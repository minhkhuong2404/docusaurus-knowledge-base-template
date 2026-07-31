---
id: redis-interview-questions
title: "Redis Interview Questions & Answers"
slug: redis-interview-questions
description: Senior-level Redis interview questions covering data structures, persistence, clustering, cache patterns, distributed systems, and production failure scenarios.
tags: [redis, interview-questions, backend, cache, distributed-systems]
---

import RedisInterviewScenariosDiagram from '@site/src/components/RedisInterviewScenariosDiagram';

# Redis Interview Questions & Answers

Senior-level Redis interview questions spanning architecture, data structures, persistence, distributed systems, and production failure scenarios.

<RedisInterviewScenariosDiagram />

---

## Architecture & Internals

### 🔴 Why is Redis fast despite being single-threaded?

Redis's speed comes from several complementary factors, not just single-threading:

1. **In-memory operations:** No disk I/O on critical path — RAM access is ~100ns vs disk at ~1ms
2. **I/O multiplexing (epoll/kqueue):** One thread monitors thousands of connections via OS kernel event notification — no blocking waits
3. **Single-threaded command execution:** Eliminates lock contention overhead. No mutex, no context switching for data access
4. **Simple, cache-friendly data structures:** Optimized for CPU cache locality (e.g., `listpack` is a flat array)
5. **Efficient memory allocation (jemalloc):** Reduces fragmentation and allocation latency

**Redis 6.0+:** Added I/O threading — network reads/writes are parallelized, while **command execution** remains single-threaded. This removes the NIC I/O bottleneck on high-connection workloads without sacrificing simplicity.

---

### 🔴 Explain the difference between RDB and AOF persistence. When would you use each?

| | RDB | AOF |
|---|---|---|
| Mechanism | Periodic binary snapshot | Log every write command |
| Data loss | Up to time since last snapshot | Up to 1s (with `everysec`) |
| Restart speed | Fast (load binary) | Slow (replay all commands) |
| File size | Small | Large (grows until rewrite) |
| Fork latency | Yes (periodic) | More frequent (during rewrite) |

**Use RDB:** Pure cache, fast recovery needed, disk space sensitive  
**Use AOF:** Primary database, near-zero data loss required  
**Use Both:** Production databases — AOF for durability, RDB for fast recovery backup

**Critical detail:** `appendfsync always` is truly safe but slow. `appendfsync everysec` (default) means at most 1 second of data loss on OS/Redis crash. `appendfsync no` means data loss up to the OS flush interval.

---

### 🔴 How does Redis handle a fork() operation and what are the performance implications?

When Redis forks (for RDB snapshot or AOF rewrite), the OS uses **Copy-on-Write (CoW)**:

```
Parent (Redis main) → continues serving requests
Child (forked)      → writes snapshot to disk

Memory pages: shared initially (no copy)
When parent MODIFIES a page → OS copies that page for child
```

**Performance impact:**
- Fork itself is fast (copies page table, not data) — but for a 10 GB instance, fork can pause Redis for 50–200ms
- If writes are heavy during fork → many CoW copies → child uses ~2x memory, potentially OOM
- Mitigation: `rdb-save-incremental-fsync yes` — writes snapshot in chunks to reduce I/O bursts

```bash
# Monitor fork latency
LATENCY HISTORY fork
INFO persistence | grep rdb_last_bgsave_time_sec

# Disable THP to prevent fork latency amplification
echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

---

## Data Structures

### 🔴 When would you use a Sorted Set vs a List for a queue? What are the trade-offs?

| | List | Sorted Set |
|---|---|---|
| Time complexity (add) | O(1) | O(log N) |
| Ordering | Insertion order | Score-ordered |
| Deduplication | None | Built-in (unique members) |
| Priority queuing | ❌ (only FIFO) | ✅ (score = priority) |
| Range queries | O(S+N) by index | O(log N + M) by score/rank |
| Remove arbitrary element | O(N) | O(log N) |

**List as queue:** Simple FIFO with `RPUSH/BLPOP`. Best for task queues with equal priority.

**Sorted Set as priority queue:** Score = priority (lower = higher priority). `ZPOPMIN` to always get highest priority task. Enables delayed processing: score = epoch timestamp → `ZADD delayed-jobs 1700000060 task1` → worker `ZRANGEBYSCORE delayed-jobs 0 NOW` to get ready tasks.

```bash
# Sorted Set delayed job queue
ZADD delayed-jobs 1700000060 "send-email:user123"  # Run at unix timestamp
# Worker polls:
ZRANGEBYSCORE delayed-jobs 0 (current-time) LIMIT 0 10
# Claim: ZPOPMIN or WATCH/MULTI for concurrency safety
```

---

### 🔴 Explain the internal encoding of a Hash. Why does it matter for production?

Small hashes use `listpack` (formerly `ziplist`) — a flat array of variable-length entries:

```
[prevlen][encoding][data][prevlen][encoding][data]...
(compact sequential layout — cache-friendly)
```

Large hashes (>128 fields or values >64 bytes) use `hashtable` — a dynamic hash table with bucket chains.

**Why it matters:**
- A `listpack` hash with 100 fields can be **5–10x more memory efficient** than a hashtable
- Accessing a field in `listpack` is O(n) scan, not O(1) — this is acceptable for small hashes
- Inserting a 65-byte value **immediately promotes** the hash to hashtable encoding — even if only one field is large

```bash
OBJECT ENCODING myhash     # Check current encoding
CONFIG SET hash-max-listpack-entries 128  # Threshold for encoding upgrade
CONFIG SET hash-max-listpack-value 64     # Byte size threshold per value
```

**Production pattern:** Store user objects as Hashes with fields ≤64 bytes each. Never store large JSON blobs in individual hash fields — use a separate String key instead.

---

## Caching

### 🔴 Describe three Redis cache failure modes and how to prevent them.

**1. Cache Stampede (Thundering Herd):**
- Problem: A popular key expires → all readers miss → all hit DB simultaneously
- Fix: Jittered TTL, mutex lock (SET NX lock), probabilistic early refresh

**2. Cache Penetration:**
- Problem: Non-existent keys repeatedly hit DB (no cache entry to populate)
- Fix: Cache null values with short TTL; Bloom filter to reject non-existent IDs before DB

**3. Cache Avalanche:**
- Problem: Many keys expire simultaneously → DB overwhelmed by mass misses
- Fix: Jitter on TTL (randomize expiry by ±10–20%); pre-warm cache before peak traffic

**Bonus — Cache Inconsistency** (write-then-invalidate race):
```
Thread 1: Write to DB   (old value cached)
Thread 2: Read from cache → HIT → old value
Thread 1: DELETE cache key
Thread 3: Cache MISS → read DB → cache new value → all good now
```
Common fix: use `@CacheEvict` separately from `@Transactional`, or invalidate from TransactionSynchronization.afterCommit().

---

### 🔴 How does the `WAIT` command relate to data durability, and when would you use it?

```bash
WAIT numreplicas timeout
```

`WAIT` blocks the client until at least `numreplicas` replicas have acknowledged receiving all writes sent before the `WAIT` command. Returns the number of replicas that acknowledged.

```bash
SET critical-data "value"
WAIT 1 1000   # Wait for 1 replica to acknowledge, timeout 1000ms
```

**Use case:** Critical write paths where replication lag is unacceptable. For example, after writing a payment record, wait for at least one replica before returning success to the client — reduces the chance of data loss if master fails immediately after write.

**Important:** WAIT does NOT make replication synchronous by default — it's best-effort. If timeout expires, WAIT returns even if replicas haven't caught up.

---

## Distributed Systems

### 🔴 What is Redlock and what are its limitations?

Redlock is an algorithm for distributed locking across N independent Redis instances:

```
1. Record start time
2. Try to acquire lock on all N nodes with same key and TTL
3. If acquired on majority (N/2 + 1) and total time < TTL → lock is valid
4. If not majority → release locks on all nodes
```

```python
def acquire_redlock(lock_name, ttl_ms, n_nodes=5):
    token = uuid4()
    acquired_count = 0
    start_ms = now_ms()

    for node in redis_nodes:
        if node.set(lock_name, token, nx=True, px=ttl_ms):
            acquired_count += 1

    elapsed = now_ms() - start_ms
    if acquired_count >= (n_nodes // 2 + 1) and elapsed < ttl_ms:
        return token  # Lock acquired
    else:
        release_redlock(lock_name, token)  # Release partial
        return None
```

**Limitations (Martin Kleppmann's critique):**
1. **Clock drift:** If system clock jumps forward on a Redis node, TTL expires prematurely
2. **Process pauses:** A GC pause can cause lock to expire while the owner is still processing
3. **No linearizability:** Redis is "fire and forget" — not designed for strict ordering

**Production guidance:**
- Redlock is suitable for "efficiency" locks (prevent duplicate work)
- Not suitable for "correctness" locks (protecting critical data where race conditions cause corruption)
- For correctness: use fencing tokens + database-level optimistic locking

---

### 🔴 How would you design a Redis-based rate limiter that handles Redis unavailability?

```java
@Service
public class ResilientRateLimiter {

    private final CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("redis");

    // Local fallback rate limiter (in-process)
    private final RateLimiter localFallback = RateLimiter.create(1000.0); // 1000 req/sec

    public boolean isAllowed(String userId, int limit, Duration window) {
        return Try.of(() ->
            circuitBreaker.executeSupplier(() -> checkRedisRateLimit(userId, limit, window))
        ).getOrElse(() -> {
            // Redis unavailable → fall back to local rate limiter
            log.warn("Redis rate limiter unavailable, using local fallback");
            return localFallback.tryAcquire();
        });
    }

    private boolean checkRedisRateLimit(String userId, int limit, Duration window) {
        // Sliding window Lua script
        return redisRateLimiter.isAllowed(userId, limit, window);
    }
}
```

**Design decisions:**
1. Circuit breaker on Redis calls — fail fast instead of cascading timeouts
2. Local in-process fallback — less accurate but available
3. Alert on Redis degradation — don't silently degrade
4. Consider fail-open (allow all requests) vs fail-closed (reject all) based on risk

---

## Production Scenarios

### 🔴 You notice Redis memory is growing continuously despite TTLs being set. What do you check?

1. **Check active expiry backlog:**
   ```bash
   INFO keyspace   # expired_keys should be growing (expiry working)
   INFO stats      # expired_keys per second
   ```

2. **Check for keys WITHOUT TTL:**
   ```bash
   INFO keyspace
   # db0:keys=500000,expires=100000,...
   # If expires << keys → many keys have no TTL
   ```

3. **Check memory fragmentation ratio:**
   ```bash
   INFO memory | grep mem_fragmentation_ratio
   # > 1.5 → significant fragmentation → shrink allocated but unused pages
   # MEMORY PURGE  (Redis 4.0+) → trigger allocator to return memory to OS
   ```

4. **Find biggest keys:**
   ```bash
   redis-cli --bigkeys -u redis://localhost:6379
   MEMORY USAGE mykey   # Bytes used by specific key
   ```

5. **Check `maxmemory` and eviction policy:**
   ```bash
   CONFIG GET maxmemory
   CONFIG GET maxmemory-policy
   # noeviction + no maxmemory = unbounded growth
   ```

6. **Check for `OBJECT ENCODING` regressions:**
   Large values may be promoting compact encodings to expensive ones.

---

### 🔴 A Redis Cluster node is down. What happens to reads and writes targeting its slots?

```
Normal:     Client → MOVED → Master A → data
After fail: Master A is down → Cluster detects failure → elections

During failover window (~15-30s):
  Reads → CLUSTERDOWN error for slots A owns
  Writes → CLUSTERDOWN error

After election:
  Replica A promoted to new master
  Client refreshes slot map (CLUSTER SLOTS)
  Reads + writes resume on Replica A (now master)
```

**Data loss risk:** If Master A had writes that weren't replicated to Replica A before the failure → those writes are lost when Replica A becomes master.

**Mitigation:**
```bash
cluster-require-full-coverage no   # Allow partial cluster operation (serve remaining slots)
# Default: yes → entire cluster stops if any master has no alive replica
```

```bash
min-replicas-to-write 1           # Master refuses writes if replica is down
# Prevents accepting data that can't be replicated → no replica = no writes
```

---

### 🔴 Describe the exact execution order when these annotations combine on the same service method:

```java
@PreAuthorize("hasRole('USER')")
@Cacheable("products")
@Retryable(retryFor = RemoteException.class, maxAttempts = 3)
@Transactional(readOnly = true)
public Product getProduct(Long id) { ... }
```

Execution order (outermost to innermost):

```
1. Spring Security @PreAuthorize (lowest @Order / highest priority)
   → Check authentication & authorization
   → AccessDeniedException if unauthorized
2. @Cacheable aspect
   → Cache HIT → return immediately (skips method, retry, and transaction)
   → Cache MISS → continue
3. @Retryable aspect
   → Will retry the inner portion (method + transaction) on RemoteException
4. @Transactional aspect (Integer.MAX_VALUE - 1)
   → Open read-only transaction
5. Target method executes
4. ← Transaction commits/closes
3. ← If RemoteException: retry up to 3 times (re-opens transaction each time)
2. ← On success: write result to cache
1. ← Security context checked on initial entry only
```

**Key interview points:**
- @Cacheable is OUTSIDE @Retryable → a cache hit completely bypasses retry and transaction
- @Retryable wraps @Transactional → each retry opens a fresh transaction
- If @Retryable were inside @Transactional, the entire transaction would retry (different semantics)
- @PreAuthorize runs first → a 403 never reaches cache or DB

---

### 🔴 How would you implement a Redis-backed job queue with at-least-once processing semantics?

```
Architecture:
  Producer → RPUSH jobs:pending taskId
  Consumer → BRPOPLPUSH jobs:pending jobs:processing (atomic move)
  Worker   → process task
  On success → LREM jobs:processing 1 taskId
  On failure → stays in jobs:processing
  Reaper   → scan jobs:processing for items > timeout → re-enqueue
```

```java
@Service
public class ReliableJobQueue {

    // Producer
    public void enqueue(String task) {
        redisTemplate.opsForList().rightPush("jobs:pending", task);
    }

    // Consumer — atomic pop from pending + push to processing
    public String dequeue(Duration timeout) {
        return redisTemplate.opsForList()
            .rightPopAndLeftPush("jobs:pending", "jobs:processing", timeout);
    }

    // Acknowledge successful processing
    public void acknowledge(String task) {
        redisTemplate.opsForList().remove("jobs:processing", 1, task);
    }

    // Reaper — recover stuck jobs (scheduled task)
    @Scheduled(fixedDelay = 60_000)
    public void recoverStuckJobs() {
        List<String> processing = redisTemplate.opsForList()
            .range("jobs:processing", 0, -1);
        for (String task : processing) {
            // Check if task has a heartbeat or metadata for timeout
            if (isExpired(task)) {
                redisTemplate.opsForList().remove("jobs:processing", 1, task);
                redisTemplate.opsForList().rightPush("jobs:pending", task);
                log.warn("Re-enqueued stuck job: {}", task);
            }
        }
    }
}
```

**Better alternative for new systems:** Use Redis Streams with consumer groups — built-in PEL (Pending Entries List) tracks unACKed messages with delivery count and idle time.

---

### 🔴 What is a Redis Hot Key, and how do you resolve it in production when cache hit rate remains high but system latency increases?

A **Redis Hot Key** occurs when a specific cache key receives a disproportionate volume of incoming requests (extreme QPS). 

#### Why Cache Hit Rate is Deceptive
A high cache hit rate (e.g., 99%) only indicates that Redis successfully returned data for 99% of requests. It does not measure key access distribution or downstream resource overhead. A single hot key can overwhelm the infrastructure despite high hit rates due to:
1. **Network NIC Saturation:** If a cached product catalog or layout JSON is 500 KB and requested 10,000 times/sec, it consumes:
   $$500\text{ KB} \times 10,000\text{ req/s} = 5\text{ GB/s} \approx 40\text{ Gbps}$$
   This exceeds standard NIC limits, causing packet drops, TCP retransmissions, and high latency.
2. **Single-Thread CPU Blockage:** Redis command execution is single-threaded. Fetching massive collections or running $O(N)$ operations (e.g., `HGETALL`, `SMEMBERS`, `LRANGE 0 -1`) blocks the event loop. Other concurrent operations queue up, causing timeouts.
3. **Application CPU Load:** Client instances waste CPU cycles deserializing the large payload repeatedly.
4. **Cluster Shard Imbalance (Hot Shards):** In a Redis Cluster, slots are assigned to specific master nodes. A hot key routes 100% of its QPS to a single shard, saturating that node while other shards remain idle.

#### How to Detect Hot Keys
- **High-level metrics:** Run `redis-cli INFO stats` and monitor `total_net_output_bytes` and `keyspace_hits`. Compare CPU load and `instantaneous_ops_per_sec` per node in a cluster to identify hot shards.
- **Detailed profiling:** Check `redis-cli INFO commandstats` for average execution times (`usec_per_call`) and inspect `redis-cli SLOWLOG GET 20`.
- **Key scanning:** Use `redis-cli --hotkeys` to scan key frequencies *(requires LFU eviction enabled, e.g., `maxmemory-policy allkeys-lfu`)*.
- **Real-time sampling:** Run `redis-cli MONITOR` for a short period (1–2 seconds) to sample traffic. Avoid keeping it active long-term as it degrades Redis performance.

#### Production Mitigations
1. **L1 Local Cache (Near Cache):** Add a short-lived local cache (e.g., Caffeine/Guava in Java, in-process memory) in front of Redis. A TTL of just 2–5 seconds absorbs extreme QPS at the application layer, protecting the network.
2. **Key Splitting / Replication:** Append random suffixes to replicate the hot key across shards:
   - Write path: Update all replicas (`global_config:0`, `global_config:1`, ..., `global_config:N`).
   - Read path: Randomly load-balance reads (`global_config:` + `random(0, N)`). This distributes QPS across different slots and nodes.
3. **Optimize Query Commands:** Avoid fetching entire collections. Replace `HGETALL` with `HMGET`/`HGET` or paginate with `HSCAN`.
4. **Payload Reduction & Compression:** Compress heavy payloads on the client side using GZIP or Brotli before writing to Redis, and prune unused fields to save network bandwidth.
5. **Request Coalescing (Singleflight):** For cache updates, use a singleflight/coalescer so that concurrent threads request the DB/Redis once and share the result.
6. **Read Replicas:** Distribute read traffic by querying Redis replicas rather than the master.
