---
id: scaling-reads
title: Scaling Reads
sidebar_label: Scaling Reads
description: Strategies for handling high read QPS including caching layers, read replicas, CDN, CQRS, and database indexing. Covers Redis patterns, cache invalidation, consistency models, fan-out strategies, and senior-level deep dives into coherence, hot keys, and tail latency.
tags: [scaling, reads, caching, redis, cdn, cqrs, read-replicas, performance, consistency]
---
import ScalingReadsStrategyHierarchyDiagram from '@site/src/components/ScalingReadsStrategyHierarchyDiagram';
import CacheAsideSequenceDiagram from '@site/src/components/CacheAsideSequenceDiagram';
import ReadThroughSequenceDiagram from '@site/src/components/ReadThroughSequenceDiagram';
import WriteThroughSequenceDiagram from '@site/src/components/WriteThroughSequenceDiagram';
import WriteBehindSequenceDiagram from '@site/src/components/WriteBehindSequenceDiagram';
import DualDeleteSequenceDiagram from '@site/src/components/DualDeleteSequenceDiagram';
import CdcInvalidationPipelineDiagram from '@site/src/components/CdcInvalidationPipelineDiagram';
import CacheStampedeThunderingHerdDiagram from '@site/src/components/CacheStampedeThunderingHerdDiagram';
import HotKeySaturationDiagram from '@site/src/components/HotKeySaturationDiagram';
import ReadReplicasFlowDiagram from '@site/src/components/ReadReplicasFlowDiagram';
import CdnEdgeOriginShieldDiagram from '@site/src/components/CdnEdgeOriginShieldDiagram';
import CqrsDataFlowDiagram from '@site/src/components/CqrsDataFlowDiagram';
import FanOutStrategiesDiagram from '@site/src/components/FanOutStrategiesDiagram';
import CacheCoherenceCoreProblemDiagram from '@site/src/components/CacheCoherenceCoreProblemDiagram';

# Scaling Reads

In high-scale systems, the read-to-write ratio is often heavily skewed towards reads (typically >80-90%, and frequently 95%+ for content-heavy products). In social media feeds, e-commerce catalogs, and news portals, users read content orders of magnitude more often than they publish or update it. A single viral post might be written once and read tens of millions of times within hours.

Read-heavy workloads require a fundamentally different scaling architecture than write-heavy systems. The core operational rule is simple: **serve data as close to the user as possible, and avoid hitting the primary database for reads.** Every layer added between the user and the primary database trades some freshness or consistency for an order-of-magnitude improvement in latency and throughput. The senior engineer's job is choosing *which* trade-offs are acceptable for *which* data, not eliminating trade-offs entirely — that's impossible.

---

## Strategy Hierarchy (Fastest to Slowest)

A modern read-scaling architecture relies on a multi-layer hierarchy of storage tiers, optimized to trade data consistency and capacity for low latency and high throughput. Requests fall through the hierarchy only on a miss — each layer acts as a shock absorber for the one below it.

<ScalingReadsStrategyHierarchyDiagram />

### Latency and Throughput Comparison

| Layer | Latency | Typical Throughput (QPS) | Consistency Guarantee | Target Data |
| :--- | :--- | :--- | :--- | :--- |
| **L1 In-Memory Cache** | &lt; 1 ms | $10^6+$ per instance | Eventual (Per-node TTL) | Hot configs, static lookups, session tokens |
| **L2 Distributed Cache** | 1–5 ms | $100,000+$ per node | Eventual (Shared invalidation) | User profiles, catalog items, pre-computed feeds |
| **CDN Edge Cache** | 10–50 ms | Millions (Globally distributed) | Eventual (Purge / TTL) | Static assets, public API responses, pages |
| **Read Replicas** | 50–100 ms | $10,000+$ per instance | Eventual (Subject to replication lag) | Complex queries, non-cached queries, reports |
| **Primary Database** | > 100 ms | $1,000 - 5,000$ | Strong (Read-Your-Writes) | Fresh writes, transactional validation |

> **Senior framing**: This table is really a menu of *consistency budgets*. Every read your system serves should be deliberately assigned to a tier based on how stale it's allowed to be — not based on which tier happens to be "default." A pricing page can tolerate minutes of staleness; an account balance after a deposit cannot. Conflating these is the single most common cause of production caching incidents.

---

## Caching Strategies

Caching is the most effective lever for scaling reads. By keeping frequently accessed data in memory, caching reduces load on databases and provides predictable sub-millisecond latencies. But caching is not "free speed" — it's a second copy of your data that can silently diverge from the source of truth, and every caching strategy below is really a different policy for managing that divergence.

:::info[Eviction Policies & Redis Details]
For an in-depth breakdown of cache eviction algorithms (LRU, LFU, ARC) and specific Redis data structure operations, see the centralized **[Caching Strategies](./caching-strategies.md)** and **[Redis Eviction Policies](../redis/redis-eviction-policies.md)** guides.
:::

### Cache-Aside (Lazy Loading)

In the Cache-Aside pattern, the application orchestrates interactions with both the cache and the database. The cache is purely passive storage — it knows nothing about where data comes from.

<CacheAsideSequenceDiagram />

**Why it dominates in practice**: Cache-aside is lazy — only data that is actually requested ever gets cached, which keeps memory usage proportional to real traffic patterns rather than total dataset size. It also degrades gracefully: if Redis is completely down, the cache-aside path simply falls through to the database on every request (slow, but correct), whereas read-through and write-through designs often have the cache baked into the data-access layer in ways that are harder to bypass safely.

**The latency economics senior engineers must evaluate**: Cache-aside is not free speed. Every cache miss incurs a **$+2\text{ms}$ network RTT penalty** (1ms read check + 1ms sync write back to cache) compared to querying the DB directly. Per the **AMAT (Average Memory Access Time)** model, the minimum hit ratio to achieve lower latency is:
$$\mathbf{H_{\text{break-even}} = \frac{2}{T_{\text{db}} + 1}}$$
For heavy queries ($T_{\text{db}} = 50\text{ms}$), break-even requires only $H \ge 3.9\%$; but for fast queries ($T_{\text{db}} = 2\text{ms}$), you need $H \ge 66.7\%$ just to break even! For the complete mathematical proof, Zipf's law RAM sizing, and observability traps, see the **[Mathematical Economics of Caching](./caching-strategies.md#the-mathematical-economics-of-caching-amat--break-even-hit-ratio)** guide.

**The trade-off senior engineers must own**: because the cache is a separate write target from the database, there is always a window — however small — where the two disagree. Cache-aside pushes the responsibility for managing that window entirely onto the application.

#### Spring Boot Implementations (Caffeine & Redis)

Below is an implementation of a multi-level fallback caching pattern combining local Caffeine (L1) and distributed Redis (L2) cache-aside logic.

```java
@Service
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final Cache<Long, User> l1CaffeineCache;
    private final RedisTemplate<String, User> l2RedisTemplate;

    public UserService(UserRepository userRepository,
                       Cache<Long, User> l1CaffeineCache,
                       RedisTemplate<String, User> l2RedisTemplate) {
        this.userRepository = userRepository;
        this.l1CaffeineCache = l1CaffeineCache;
        this.l2RedisTemplate = l2RedisTemplate;
    }

    public User getUser(Long id) {
        // 1. Query L1 Local Cache (Caffeine)
        User cachedUser = l1CaffeineCache.getIfPresent(id);
        if (cachedUser != null) {
            log.debug("L1 Cache Hit for user: {}", id);
            return cachedUser;
        }

        // 2. Query L2 Distributed Cache (Redis)
        String redisKey = "user:" + id;
        try {
            cachedUser = l2RedisTemplate.opsForValue().get(redisKey);
            if (cachedUser != null) {
                log.debug("L2 Cache Hit for user: {}", id);
                l1CaffeineCache.put(id, cachedUser); // Populate L1
                return cachedUser;
            }
        } catch (Exception e) {
            log.error("Redis unreachable while reading user: {}", id, e);
        }

        // 3. Fallback to Database
        log.warn("Cache Miss (L1 & L2) for user: {}. Fetching from Database.", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));

        // 4. Populate Cache Asynchronously to minimize response latency
        populateCaches(id, redisKey, user);

        return user;
    }

    private void populateCaches(Long id, String key, User user) {
        l1CaffeineCache.put(id, user);
        CompletableFuture.runAsync(() -> {
            try {
                l2RedisTemplate.opsForValue().set(key, user, Duration.ofMinutes(30));
            } catch (Exception e) {
                log.error("Failed to write to Redis for key: {}", key, e);
            }
        });
    }
}
```

**Production hardening notes**:

* The `try/catch` around the Redis read is essential — Redis being down should *degrade* read latency, not cause request failures. A common production bug is treating a Redis exception as equivalent to a "miss" without distinguishing it from a true cache miss, which can cause thundering-herd traffic to the database during a Redis outage (see Cache Stampede below).
* `populateCaches` writes asynchronously specifically so a slow Redis `SET` never adds latency to the user-facing response. The trade-off is a brief window where a concurrent request could miss the cache again before the async write lands — acceptable for read-heavy keys, but worth knowing.
* L1 (Caffeine) caches are **per-instance**. With N application nodes, you effectively have N independent L1 caches that can disagree with each other and with L2. This is the root cause that motivates the "Advanced Cache Coherence" section later in this doc.

### Read-Through

The application treats the cache as the primary data store. On a cache miss, the cache infrastructure itself is responsible for reading from the database and populating itself before returning control to the application.

<ReadThroughSequenceDiagram />

* **Pros**: Decouples application logic from data-fetching mechanics — the application code is simpler because it only ever talks to "the cache."
* **Cons**: Requires custom provider extensions (e.g., implementing a `CacheLoader` in Caffeine, or a similar abstraction in your caching library); harder to optimize multi-table joins or batched fetches, since the loader typically operates on one key at a time.

**When to prefer this over cache-aside**: Read-through shines when you want a uniform caching policy enforced centrally — for example, every team in an org uses the same `CacheLoader` implementation, so cache population logic (including retries, circuit breaking, and metrics) lives in one place instead of being copy-pasted across services. The cost is reduced flexibility: cache-aside lets one call site batch-fetch 50 records in one DB round trip on a miss, while a naive read-through loader might issue 50 individual loads.

### Write-Through

Every write operation passes through the cache, which updates the underlying database synchronously as part of the same logical operation.

<WriteThroughSequenceDiagram />

* **Pros**: The cache is never stale for keys that have been written — read-after-write within the cache is always consistent.
* **Cons**: Adds the database write latency to every cache write (no latency benefit on the write path); caches data that may never be read again, wasting memory on cold keys.

**Where it actually earns its keep**: Write-through is most justified for data with a **high write-to-subsequent-read ratio on the same key shortly after the write** — e.g., a user's "last seen" status, a shopping cart, or session state that's almost certainly going to be read again within seconds by the same user. For data that's written far more often than it's read (audit logs, metrics), write-through is pure overhead — don't cache it at all, or cache it on first read instead (cache-aside).

### Write-Behind (Write-Back)

The application writes directly to the cache, which acknowledges immediately. An asynchronous background process flushes modified ("dirty") cache entries back to the database in batches.

<WriteBehindSequenceDiagram />

* **Pros**: Highest write throughput and lowest write latency of any pattern. Naturally batches and coalesces multiple writes to the same key — if a counter is incremented 1,000 times in a second, write-behind can flush a single net delta instead of 1,000 individual database writes.
* **Cons**: Real risk of data loss if the cache node crashes before flushing dirty writes — this pattern fundamentally weakens durability guarantees unless the cache itself is replicated/persisted (e.g., Redis with AOF + replicas).

**Senior caveat**: Write-behind is the *least* commonly used of the four patterns in mainstream web systems precisely because of the durability risk — it's most often seen in specialized contexts like write-heavy analytics counters, leaderboards, or caches in front of slow external APIs where occasional loss of the most recent update is an acceptable trade for throughput. If you're considering write-behind for anything resembling financial or order data, that's a signal to step back and look at an event-sourced or queue-based design instead.

---

## Cache Invalidation and Failure Patterns

A major challenge in caching is maintaining synchronization between the database and the cache. Incorrect invalidation leads to silent data corruption and stale reads that are notoriously hard to reproduce and debug, because the failure is timing-dependent.

### Cache Invalidation Patterns

#### 1. The Dual-Delete Strategy

When updating database entities, a naive "update DB then delete cache key" sequence has a race: a concurrent read can occur *between* the database write and the cache eviction, repopulating the cache with the now-stale pre-update value — which then sits there until TTL expiry. The **Dual-Delete** strategy mitigates this by bracketing the database write with two cache evictions.

<DualDeleteSequenceDiagram />

1. **Delete Cache Key**: Evict immediately, before the write, to reduce the window during which a concurrent reader could load a value that's about to become stale.
2. **Update Database**: Perform the SQL write.
3. **Sleep**: Pause briefly — long enough to cover typical read-replica replication lag (commonly 100ms–1s, tuned per system).
4. **Delete Cache Key Again**: This second delete is the actual fix for the race — it removes any stale entry that a concurrent reader (who missed the first delete, read from a lagging replica, and repopulated the cache) may have written during the window between steps 1 and 2.

**Why the delay matters**: If a reader's database query in step 2's window hits a *read replica* that hasn't yet applied the write, that reader will repopulate the cache with old data — and the first delete alone can't prevent this, because the stale write to the cache happens *after* the first delete. The second delete, timed after the expected replication lag, cleans this up. Without it, a single unlucky read can pin stale data in the cache for the full TTL.

**Limitations**: This is a heuristic, not a guarantee — if replication lag exceeds your sleep duration, the race can still occur. It also adds latency to the write path (the sleep blocks the writer, or must be offloaded to a background job). For systems that need a stronger guarantee, see CDC-based invalidation below.

#### 2. CDC-Based Invalidation (Highly Recommended for Reliability)

To decouple database updates from cache evictions entirely — and eliminate the race conditions inherent to dual-delete — implement Change Data Capture (CDC).

<CdcInvalidationPipelineDiagram />

* **How it works**: A CDC connector (e.g., Debezium) tails the database's write-ahead log (WAL) or binlog and emits an event for every committed row change. A downstream worker consumes these events and evicts the corresponding cache keys.
* **Advantages**:
  * Cache eviction only happens **after** the database transaction is durably committed — there's no possibility of evicting based on a write that later rolls back.
  * Removes caching logic entirely from the application's write path — services don't need to know which cache keys correspond to which rows.
  * Naturally handles retries, replays, and backpressure, since it's built on a durable log (Kafka).
* **Trade-off**: Adds infrastructure (CDC connector, Kafka, invalidation workers) and introduces its own lag — typically tens to low-hundreds of milliseconds from commit to eviction. For most read-heavy systems this is a worthwhile trade for the elimination of invalidation races.
* **Details**: For deep implementation patterns of transactional CDC pipelines, see the **[Change Data Capture Guide](./cdc.md)**.

**Senior framing**: Dual-delete is a tactical fix you reach for when you can't change the write path. CDC-based invalidation is the strategic fix — it treats "the cache is derived data" as a first-class architectural fact, similar to how a search index or materialized view is derived from the primary store. If you're designing a new system from scratch and expect significant cache usage, build the CDC pipeline early; retrofitting it later means auditing every write path that currently does manual invalidation.

### Mitigating Cache Failures

#### Cache Stampede (Thundering Herd)

When a highly popular cache key (e.g., homepage layout, top-seller product, a celebrity's profile) expires, thousands of concurrent requests can miss the cache within the same few milliseconds. They all attempt to query the database simultaneously, causing connection pool exhaustion and potential cascading failure.

<CacheStampedeThunderingHerdDiagram />

**Why "hot keys" are special**: A typical cache miss for a cold key costs one database query. A stampede on a hot key can cost *thousands* of identical, simultaneous database queries — the database does N times the work to produce N identical results. This is wasted work by definition, which is why coalescing (below) is so effective: it converts N redundant queries into 1.

##### Mitigation 1: Request Coalescing (SingleFlight)

Ensure only one thread/request queries the database for a given key, while all other concurrent requesters for that same key wait for — and share — the result.

```java
public class CoalescingCacheService {
    private final Cache<String, Object> cache = Caffeine.newBuilder().build();
    private final ConcurrentHashMap<String, ReentrantLock> locks = new ConcurrentHashMap<>();
    private final DatabaseService db;

    public Object getWithCoalescing(String key) {
        Object value = cache.getIfPresent(key);
        if (value != null) return value;

        ReentrantLock lock = locks.computeIfAbsent(key, k -> new ReentrantLock());
        lock.lock();
        try {
            // Double-check cache after lock acquisition
            value = cache.getIfPresent(key);
            if (value != null) return value;

            // Single query hits the database
            value = db.query(key);
            cache.put(key, value);
            return value;
        } finally {
            lock.unlock();
            locks.remove(key, lock); // clean up memory
        }
    }
}
```

**Important nuance**: This code coalesces requests *within a single application instance* (the lock is in-process). If you run 50 application instances, you can still get 50 simultaneous database queries — one per instance — even with perfect per-instance coalescing. For cluster-wide coalescing, the equivalent pattern uses a **distributed lock** (e.g., `SET key value NX EX 5` in Redis) where the first instance to acquire the lock queries the database and writes the result back to the shared cache, while other instances either wait briefly and retry the cache, or serve a stale value if one exists.

**Edge case to watch**: the `finally` block's `locks.remove(key, lock)` is there to prevent the `ConcurrentHashMap` from growing unboundedly with one entry per distinct key ever requested. The `remove(key, lock)` overload (compare-and-remove) is important — it ensures you don't remove a *different* lock object that another thread just inserted for the same key after this thread released it.

##### Mitigation 2: Probabilistic Early Expiration (XFetch)

The XFetch algorithm spreads out cache refreshes for a hot key *before* it actually expires, so that by the time the real TTL hits, the value has likely already been refreshed by one early "volunteer" request — and the stampede never happens.

The probability of a background refresh being triggered is determined by:

$$\text{rand}() \cdot \beta \cdot \delta > \text{TTL}$$

Where:
* $\text{rand}()$ is a random floating-point value between 0 and 1, drawn fresh on each request.
* $\beta$ is an aggressive multiplier (>0). Higher values trigger early refresh sooner and more often.
* $\delta$ represents the time taken to compute and fetch the value from the database (measured from the last refresh).
* $\text{TTL}$ is the remaining time-to-live of the cached key.

**Intuition**: As `TTL` (remaining lifetime) shrinks toward zero, the inequality becomes easier to satisfy for any given `rand()` draw, so the *probability* that a request triggers an early refresh increases smoothly as expiry approaches — rather than every request waiting until the literal expiry moment. Because many concurrent requests are each independently rolling this probabilistic check, exactly one of them is likely to "win" early and refresh the value in the background while still serving the (still-valid) cached value to everyone, itself included. By the time TTL truly hits zero, the key has usually already been refreshed, so there's no miss at all.

**Comparison with coalescing**: Coalescing handles the stampede *after* it starts (limiting blast radius to one DB query). XFetch tries to prevent the stampede from starting in the first place by smearing refreshes probabilistically over time. The two are complementary and often used together: XFetch reduces the *frequency* of true misses on hot keys, and coalescing bounds the damage on the misses that still occur.

---

#### Hot Key Saturation (High Cache Hit, Low System Performance)

A distinct class of failure occurs when the cache hit rate remains extremely high (e.g., 99%), but system performance degrades significantly. This indicates that traffic is highly concentrated on a few **hot keys**.

Unlike a Cache Stampede (which is a storm of cache *misses* hammering the database), Hot Key Saturation is a bottleneck at the *cache tier itself* caused by cache *hits*.

<HotKeySaturationDiagram />

**Core Bottlenecks at Scale:**
* **Network NIC Saturation:** Reading a 500 KB serialized JSON key at 10,000 QPS requires 5 GB/s ($\approx$ 40 Gbps) network throughput. This easily saturates the physical network interface cards of both the cache nodes and application servers, leading to packet loss, retransmissions, and timeouts.
* **Single-Thread Event Loop Blocking:** Key-value stores like Redis process commands sequentially in a single thread. Running heavy commands (e.g., `HGETALL`, `SMEMBERS`, `LRANGE 0 -1`) on large hot keys blocks the event loop, queuing up all other requests.
* **Hot Shards:** In clustered environments, keys are distributed by hash slot to different nodes. A hot key directs all QPS to a single cluster node, causing a CPU hotspot on that node while the rest of the cluster sits idle.

**Solutions & Mitigations:**
1. **L1 Near Cache:** Store hot keys in the application's local heap memory (e.g., Caffeine/Guava) for a very short duration (1–5 seconds). This intercepts the majority of requests before they hit the network.
2. **Key Replication (Splitting):** Replicate the hot key across shards by appending random suffixes (e.g., `global_config:0`, `global_config:1`, ..., `global_config:N`). Update all replicas on writes, and query a random suffix on reads.
3. **Avoid O(N) Commands:** Query specific fields (`HGET`/`HMGET`) or use cursors (`HSCAN`) instead of loading entire data structures.

For detailed design patterns, detection commands, and a defensive Java Caffeine+Redis implementation, see the **[Redis Hot Keys Guide](../redis/redis-performance-patterns.md#redis-hot-keys)**.

---

## Read Replicas

When read volume surpasses the memory capacity or budget of a cache layer — or when queries are too varied/ad-hoc to cache effectively (e.g., admin dashboards, reporting) — scale the storage tier itself using read replicas.

<ReadReplicasFlowDiagram />

### Replication Mechanics

Replicas operate by continuously receiving and applying the Write-Ahead Log (WAL) stream generated by the primary node. The replica is, conceptually, "replaying" the primary's transaction history.

* **Asynchronous Replication**: The primary commits a transaction locally and acknowledges the client *without* waiting for any replica to receive the WAL records.
  * *Trade-off*: Lowest possible write latency (the replica is entirely off the critical path), but introduces **replication lag** — a window (typically milliseconds, but can spike to seconds under load or network issues) during which replicas serve data older than the primary.
* **Synchronous Replication**: The primary blocks the commit acknowledgment until at least one replica confirms it has received *and durably written* the WAL records.
  * *Trade-off*: Zero data loss on primary failover (the synchronous replica is guaranteed to have everything the primary committed), but adds a full network round-trip to *every write's* latency — and if the synchronous replica becomes unreachable, writes can stall entirely unless the system degrades to async.
* **Semi-Synchronous Replication**: A middle ground — the primary waits for acknowledgment from at least one replica (often the fastest-responding of several candidates) before completing the write, while remaining replicas sync purely asynchronously.
  * *Why this is the common production choice*: it bounds the worst-case data loss to "at most the writes not yet seen by the semi-sync replica" while avoiding the latency and availability risk of requiring *all* replicas to ack.

For deeper database replication architectures, see the **[Database Replication & Partitioning](../database/replication-partitioning.md)** guide.

### Read-Your-Writes Consistency (Lag Shielding)

Asynchronous replication lag can cause a confusing user-facing bug: a user updates their profile (write goes to the primary), immediately refreshes the page (read goes to a replica that hasn't caught up yet), and sees their *old* data — as if the update silently failed. This is one of the most common sources of "ghost bug" support tickets in systems with read replicas.

#### Mitigation: Dynamic Write-Session Routing

After a write transaction, mark the user's session as "recently wrote." Route all subsequent reads for that user to the **primary** database for a duration matching (and slightly exceeding) the expected replication lag window — commonly 2–5 seconds. After that window elapses, fall back to normal replica routing.

```java
@Aspect
@Component
public class ReadOnlyConnectionInterceptor {

    // ThreadLocal tracking if current request has performed a write recently
    public static final ThreadLocal<Boolean> FORCE_PRIMARY_ROUTE = ThreadLocal.withInitial(() -> false);

    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object routeConnection(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        Transactional transactional = signature.getMethod().getAnnotation(Transactional.class);

        if (transactional != null) {
            if (transactional.readOnly() && !FORCE_PRIMARY_ROUTE.get()) {
                DbContextHolder.set(DatabaseType.REPLICA);
            } else {
                // If it is a write, use primary and flag subsequent reads in this thread context
                DbContextHolder.set(DatabaseType.PRIMARY);
            }
        }
        try {
            return pjp.proceed();
        } finally {
            DbContextHolder.clear();
        }
    }
}
```

**Where the "session" flag actually lives**: The `ThreadLocal` in this example only covers a single request's lifetime within one thread — it does *not* persist the "force primary" decision across separate HTTP requests (e.g., the write request and the subsequent page-refresh request, which are different threads/connections entirely). A real implementation needs this flag to survive across requests — typically stored in the user's session cookie (a "last-write-at" timestamp), a short-lived Redis key keyed by user ID, or a sticky-session mechanism that pins the user's *next several requests* to the primary or to a replica known to have caught up. The `ThreadLocal` shown here is the *mechanism* for routing within one request once that decision has been made; the cross-request propagation of the decision is the part that's easy to forget and the part that actually fixes the bug.

**Alternative approaches** if session-based routing is too coarse:
* **Monotonic read tracking**: Have each write return the WAL position/LSN it committed at. Subsequent reads from that client carry this LSN, and the replica either waits until it has applied that LSN or routes the read to the primary if it hasn't.
* **Read from primary only for the affected entity, not the whole user session**: e.g., after updating order #123, only force order #123's subsequent reads to primary — other reads can still go to replicas.

*For more details on managing consistency across nodes, check the **[Data Consistency Guide](./data-consistency.md)**.*

---

## CDN (Content Delivery Network)

CDNs scale reads globally by caching static media (images, JS/CSS bundles, downloads) and even dynamic API JSON payloads at edge nodes located physically close to end-users — collapsing what would be a 100-300ms cross-continent round trip into a 10-50ms local one.

<CdnEdgeOriginShieldDiagram />

### Edge Caching Optimizations

#### Origin Shielding

If a CDN has 100 edge nodes globally and a popular resource's cache entry expires (or is purged) simultaneously across all of them, each of the 100 edges could independently miss and forward a request to your origin — a 100x amplification at the worst possible moment (right after a deploy/purge, when traffic is often also elevated).

An **Origin Shield** is a single, centralized, high-capacity CDN caching layer positioned between the edge locations and your origin server. All edge misses are routed through this shield first. The shield itself caches the response, so the 100 simultaneous edge misses collapse into effectively one request to your actual origin — the shield absorbs the fan-in, much like a coalescing layer absorbs a cache stampede.

#### Cache-Control Headers & Purge Tagging

```http
Cache-Control: public, s-maxage=600, max-age=60, stale-while-revalidate=30
```

* `public`: Indicates both shared edge proxies (CDNs) and local browser caches may store the response. (`private` restricts caching to the end-user's browser only — important for personalized responses.)
* `s-maxage=600`: Tells the CDN edge proxy specifically to cache the response for 10 minutes (600 seconds). The `s-` prefix means this directive applies to *shared* caches and overrides `max-age` for them.
* `max-age=60`: Tells the browser client to cache the response locally for 1 minute (60 seconds) — independent of, and shorter than, the CDN's TTL. This split lets you serve a relatively fresh experience to the browser while letting the CDN absorb the bulk of repeat traffic for longer.
* `stale-while-revalidate=30`: If a request arrives up to 30 seconds *after* the cached entry has expired, the CDN immediately serves the stale (expired) response to that request — keeping latency low — while *simultaneously* firing a background request to the origin to refresh the cache for subsequent requests. This is conceptually identical in spirit to XFetch above: prefer serving something slightly stale over making the user wait for a fresh fetch.

#### Surrogate Keys (Cache-Tags)

Instead of purging individual URLs one-by-one — which doesn't scale when a single underlying data change (e.g., a product price update) affects dozens of rendered pages (product page, category page, search results, related-products widgets, etc.) — assign tagging metadata headers to responses:

```http
X-Cache-Tags: product-1234, category-electronics
```

When product `1234` is updated, the application sends a single purge command for the surrogate key `product-1234`. The CDN instantly invalidates **every cached response, across every edge node globally, that was tagged with that key** — regardless of how many distinct URLs those responses lived at. This decouples "what changed" (a single product) from "what needs to be invalidated" (potentially many pages), and is the CDN-layer analog of CDC-based cache invalidation discussed earlier — both are about deriving invalidation from a single source-of-truth event rather than tracking every dependent cache entry manually.

---

## CQRS (Command Query Responsibility Segregation)

CQRS isolates mutation logic (Commands) from lookup logic (Queries) by maintaining **separate models — and often separate physical stores — for writes versus reads.** Rather than querying a highly normalized relational schema designed for transactional integrity, reads are served from denormalized "projection" tables or documents that are pre-shaped for exactly the query patterns the application needs.

<CqrsDataFlowDiagram />

By decoupling storage schemas:

1. The **Write Model** guarantees ACID properties, referential integrity, and constraint checks — it stays normalized because normalization minimizes write-time anomalies and storage overhead for the "one true copy" of the data.
2. The **Read Model** is optimized purely for retrieval shape — e.g., a single pre-joined document per "product detail page" that contains the product, its reviews summary, its price, and its stock status all in one record, even though those four things live in four normalized tables on the write side. Read models commonly live in document stores, search indexes (Elasticsearch/OpenSearch), or even just heavily denormalized SQL tables maintained by triggers or CDC.

**How CQRS relates to everything above it in this document**: CQRS is, in a sense, the *generalization* of caching and read replicas. A cache is a CQRS read model with a TTL-based (rather than event-based) update mechanism. A read replica is a CQRS read model that happens to share the exact same schema as the write model. Full CQRS removes both constraints — the read model can have an entirely different schema *and* be updated by an explicit, durable pipeline (often the same CDC pipeline discussed for cache invalidation) rather than by replication or expiry. The cost is the same as everywhere else in this document: the read model is eventually consistent with the write model, and the lag between "write committed" and "read model updated" is a number you need to know and design around.

:::info[CQRS Deep Dive]
For complete architectural patterns of CQRS along with Event Sourcing engines, refer to the dedicated **[CQRS Pattern Guide](./cqrs.md)**.
:::

---

## Database Read Optimization

Before adding caching or replication layers — which add operational complexity, infrastructure cost, and consistency trade-offs — ensure the database itself is optimized to handle the query load efficiently. A well-indexed primary database can often absorb 5-10x more read traffic than an unoptimized one, and "we need a cache" is sometimes really "we have a missing index."

### Indexing Strategies

* **Covering Indexes (Index-Only Scans)**: An index that contains *every column* referenced by a query (both filter columns and selected columns). The database can answer the query by reading the index alone, without a second lookup ("heap fetch") into the main table — roughly halving the I/O for that query in many cases, since index pages are typically smaller and more likely to already be in memory than table pages.
* **Partial Indexes**: An index covering only a subset of rows, filtered by a conditional predicate:

  ```sql
  CREATE INDEX idx_active_orders ON orders(user_id, created_at)
  WHERE status = 'PENDING';
  ```

  This is powerful when queries overwhelmingly filter on a condition that's true for only a small fraction of rows (e.g., "pending" orders might be 2% of all orders, but represent nearly 100% of the queries on this table from a fulfillment dashboard). The index stays small — fitting more easily in memory — and faster to maintain on writes, because rows that don't match the predicate (e.g., `status = 'SHIPPED'`) are never added to it at all.

*For detailed query tuning, B-Tree layouts, and execution plan analysis, read the **[Database Indexing & Query Optimization Guide](../database/indexing-query-optimization.md)** and the **[Query Planner & Optimizer Guide](../database/query-planner-optimizer.md)**.*

### Pagination Optimization: Keyset (Cursor) vs. Offset

Offset-based pagination degrades in performance as the offset increases, because the database must scan through (and discard) all preceding rows before it can return the requested page — `OFFSET 1000000` genuinely costs the database roughly a million row reads, even though only 20 rows are returned.

```sql
-- SLOW: Scans and discards 1,000,000 records
SELECT * FROM posts
ORDER BY id DESC
LIMIT 20 OFFSET 1000000;
```

Keyset (cursor) pagination instead queries for rows *beyond* the last value the client has already seen, which the index can satisfy directly via a range seek — the cost is the same (roughly constant) regardless of how "deep" into the dataset the user has paged.

```sql
-- FAST: Uses index on (id) directly
SELECT * FROM posts
WHERE id < 982347
ORDER BY id DESC
LIMIT 20;
```

**Trade-off to be aware of**: keyset pagination doesn't support "jump to page 50" UIs as naturally, since there's no concept of an absolute page number — only "the next page after cursor X." Most infinite-scroll and "load more" UIs (which dominate read-heavy consumer apps) map onto keyset pagination perfectly; traditional numbered-page UIs (common in admin/back-office tools with smaller datasets) often still use offset pagination because the dataset sizes involved make the cost difference negligible.

---

## Fan-Out Strategies (Social Feed Example)

Fan-out is the process of distributing a piece of content (e.g., a social media post) to the timelines of the users who should see it. This is fundamentally a **read/write trade-off problem at massive scale**: every strategy below is choosing where to spend computation — at write time (when content is published) or at read time (when a feed is requested).

<FanOutStrategiesDiagram />

### Fan-Out on Write (Push Model)

* **How**: When a user publishes a post, the system immediately appends the post ID to a pre-computed timeline for every one of their followers.
* **Database Choice**: Typically implemented using Redis Sorted Sets (`ZSET`), where the score is a timestamp — this gives sub-millisecond range reads for "give me the latest 20 items" (`ZREVRANGE`).
* **Pros**: Reads are essentially free — fetching a feed is a single `ZRANGE` call against pre-computed data. This is why reads (which happen constantly, as users refresh feeds dozens of times a day) are made cheap at the expense of writes (which happen comparatively rarely).
* **Cons**: **Write amplification.** If a user with 50 million followers posts, the system must perform 50 million individual writes — one per follower's timeline. At realistic throughput, this can take minutes to fully propagate and creates enormous, bursty load on the write path exactly when a post is most likely to be time-sensitive (e.g., breaking news).

### Fan-Out on Read (Pull Model)

* **How**: No timeline is pre-computed. When a user requests their feed, the system looks up who they follow, fetches each followed user's recent posts, and merges/sorts them in memory (or via a database query with a join/union across those authors).
* **Pros**: Posting is instant and cheap — a single write, regardless of follower count. This makes the pull model attractive for accounts with enormous follower counts, where push would be prohibitively expensive.
* **Cons**: **Expensive, latency-sensitive reads.** A user who follows 2,000 accounts requires fetching and merging recent posts from up to 2,000 sources on every feed load — this is a fan-*in* problem on the read path, the mirror image of the fan-*out* write problem.

### Hybrid Fan-Out Architecture

Neither pure model works well at the extremes — push is too expensive for accounts with millions of followers ("celebrities"), and pull is too expensive for users who follow many accounts. The hybrid approach uses push for the common case (most accounts have manageable follower counts) and pull for the exceptional case (celebrity accounts), merging both at read time.

```java
@Service
public class FeedService {
    private static final int CELEBRITY_THRESHOLD = 25_000;

    private final FollowerRepository followers;
    private final TimelineCache timelineCache;
    private final PostRepository postRepository;

    public void publishPost(Post post) {
        int followerCount = followers.countFollowers(post.getUserId());

        if (followerCount < CELEBRITY_THRESHOLD) {
            // Push Model: Write to all followers' feeds
            List<Long> followerIds = followers.getFollowerIds(post.getUserId());
            timelineCache.pushToTimelines(followerIds, post.getId(), post.getCreatedAt().toEpochMilli());
        } else {
            // Celebrity Optimization: Do not push. Mark post as celebrity-authored.
            postRepository.markCelebrityPost(post.getId());
        }
    }

    public List<Post> getFeed(Long userId, int limit) {
        // 1. Fetch pre-computed feed (Push timeline)
        List<Long> postIds = timelineCache.getTimeline(userId, limit);

        // 2. Fetch celebrities followed by the user
        List<Long> celebrityIds = followers.getFollowedCelebrities(userId);

        // 3. Pull celebrity posts dynamically
        List<Post> celebrityPosts = postRepository.getRecentPosts(celebrityIds, limit);

        // 4. Merge and sort timelines in memory
        return mergeAndSortFeeds(postIds, celebrityPosts, limit);
    }
}
```

**Why `CELEBRITY_THRESHOLD` is the key design parameter**: This number is a direct knob on the read/write trade-off. Lowering it shifts more accounts into the pull path — reducing peak write amplification but increasing the per-request cost of `getFeed` (more celebrities to pull per user, on average). Raising it does the opposite. In practice this threshold is tuned empirically based on observed write-amplification costs versus read-latency budgets, and large systems often use *multiple* tiers (not just two) — e.g., normal push, "large account" with capped/sampled push, and "celebrity" pure-pull.

**A subtlety in `getFeed`**: note that step 1 (push timeline) and step 3 (celebrity pull) have fundamentally different latency and consistency characteristics — step 1 is a fast in-memory read, step 3 is a database query that may itself need caching. If celebrity accounts are followed by a large fraction of users, step 3's `getRecentPosts(celebrityIds, ...)` becomes itself a hot, cacheable query — celebrity posts are exactly the kind of content where a short-TTL cache-aside layer (from the very first section of this document) pays for itself, because the *same* celebrity post is being fetched on behalf of millions of different `getFeed` calls.

---

## Senior Deep Dive: Advanced Cache Coherence

When running multi-node clusters where each application instance has its own local in-memory cache (L1, e.g., Caffeine) acting as a front shield to a shared Redis instance (L2), maintaining **L1 coherence across nodes** is one of the trickiest correctness problems in a caching architecture — because by definition, each node's L1 is invisible to every other node.

### The Core Problem

If Node A processes a write, it can update the database and invalidate/update its *own* L1 and the shared L2 (Redis). But Node B, Node C, ... have no way of knowing this happened — their L1 caches continue to serve the pre-write value until their local TTL expires, even though L2 and the database have moved on. The system as a whole is now in a state where **different users, served by different nodes, see different data for the same key** — a correctness problem, not just a staleness problem, if those users are comparing notes (e.g., two collaborators looking at the "same" shared document).

<CacheCoherenceCoreProblemDiagram />

### Mitigation: Redis Pub/Sub Invalidation Broadcast

Use **Redis Pub/Sub** as a low-latency broadcast channel: whenever any node performs a write that invalidates a key, it publishes an invalidation message naming that key. Every node subscribes to this channel and evicts the corresponding entry from its local L1 cache upon receipt.

#### Spring Boot Coherence Implementation

```java
@Configuration
public class CachePubSubConfig {

    @Bean
    public MessageListenerAdapter listenerAdapter(CacheCoherenceListener listener) {
        return new MessageListenerAdapter(listener, "handleInvalidation");
    }

    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory factory,
                                                   MessageListenerAdapter adapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(adapter, new PatternTopic("l1-invalidation"));
        return container;
    }
}

@Component
@Slf4j
public class CacheCoherenceListener {
    private final Cache<Long, User> localCaffeineCache;

    public CacheCoherenceListener(Cache<Long, User> localCaffeineCache) {
        this.localCaffeineCache = localCaffeineCache;
    }

    public void handleInvalidation(String message) {
        try {
            Long userId = Long.parseLong(message);
            log.info("Received broadcast invalidation. Evicting L1 cache for User ID: {}", userId);
            localCaffeineCache.invalidate(userId);
        } catch (NumberFormatException e) {
            log.warn("Invalid cache coherence message received: {}", message);
        }
    }
}
```

### Important Caveats for This Pattern

**Pub/Sub is fire-and-forget — it is not durable.** Redis Pub/Sub messages are delivered only to subscribers connected *at the moment of publish*. If Node C is restarting, network-partitioned, or its subscriber connection silently drops (which can happen without obvious errors), it will miss the invalidation message entirely and indefinitely. Because of this:

* **L1 TTLs must be short** — Pub/Sub invalidation should be treated as an *optimization* that reduces average staleness, not as the sole correctness mechanism. A short L1 TTL (seconds, not minutes) acts as the backstop: even if a node misses every invalidation message, it will self-correct within one TTL window.
* **This is the same "belt and suspenders" philosophy as combining XFetch with coalescing, or dual-delete with TTLs**: throughout this entire document, the pattern is *probabilistic/best-effort optimizations layered on top of a TTL-based correctness backstop*. None of these mechanisms (pub/sub invalidation, dual-delete, CDC-based eviction) are claimed to be 100% reliable in isolation — they reduce the *probability and duration* of staleness, while TTLs bound the *worst case*.

**Ordering is not guaranteed across channels/keys.** If Node A publishes two invalidations for the same key in quick succession (e.g., due to a rapid update-then-update), and Node B is momentarily slow to process its subscription queue, it's possible (though uncommon with Redis's typical in-order delivery per connection) for processing to be delayed enough that a stale repopulation from a concurrent reader on Node B races with the invalidation. This is the L1-coherence analog of the dual-delete race discussed for L2/database coherence — the same class of problem recurs at every layer of the hierarchy, just with different actors.

**Cost scales with cluster size and write rate.** Every write that needs to invalidate a hot key now fans out to N nodes via Pub/Sub. For a cluster of 200 nodes and a key that's updated 1,000 times/second, that's 200,000 messages/second just for invalidation traffic on one key — itself a potential hot-spot on the Redis Pub/Sub channel. In extreme cases, teams either accept higher L1 TTLs for very hot keys (relying on the backstop rather than the broadcast) or exclude the hottest keys from L1 entirely, serving them only from L2.

---

## Senior Deep Dive: Choosing Between Strategies — A Decision Framework

With so many tools available, the practical question is: *which combination, for which data?* A useful framework is to classify each piece of data along two axes:

1. **Read/write ratio** — how many times is this data read for every time it's written?
2. **Staleness tolerance** — if a reader sees a value that's N seconds/minutes old, does it matter?

| Read/Write Ratio | Staleness Tolerance | Recommended Strategy |
| :--- | :--- | :--- |
| Very high (>1000:1) | High (minutes+ OK) | CDN + long-TTL L2 cache. Example: product catalog descriptions, blog posts. |
| Very high (>1000:1) | Low (must be fresh) | L1/L2 cache with event-driven (CDC) invalidation, short TTL backstop. Example: user profile display name, account status flags. |
| Moderate (10-1000:1) | High | Read replicas with simple round-robin routing; caching optional. Example: order history pages, analytics dashboards. |
| Moderate (10-1000:1) | Low | Read replicas + read-your-writes routing (primary pinning after write). Example: shopping cart contents, comment threads. |
| Low (&lt;10:1) or write-heavy | N/A | Don't cache. Optimize indexes; consider write-behind only for aggregable counters. Example: audit logs, raw event streams. |

**The meta-lesson**: nearly every technique in this document — cache-aside vs. write-through, dual-delete vs. CDC, push vs. pull fan-out, sync vs. async replication — is a different point on the *same* underlying trade-off curve between **freshness** and **cost/latency**. A senior engineer's value-add isn't memorizing these patterns in isolation; it's recognizing that a single system will need *several* of them simultaneously, applied to different data with different SLAs, and being able to articulate — in a design review — exactly what staleness window each piece of data is allowed to have and why that's acceptable for the product.

---

## Best Practices

1. **Define Staleness Tolerance Explicitly, Per Data Type**: Don't apply one global TTL policy. Static catalog data can tolerate minutes of staleness; inventory counts near zero stock need much tighter bounds or real-time validation; financial balances typically need read-your-writes or strong consistency.
2. **Always Use Jitter on TTL**: Prevent synchronized mass expiry of cached items (which itself can trigger a stampede across *many* keys at once) by adding random variance to expiration windows, e.g. $TTL = 3600\text{s} + \text{rand}(-300, 300)\text{s}$.
3. **Plan for Cache Failure (Cache Fallthrough)**: Design for the day Redis is unreachable. Ensure database connection pools, rate limits, and circuit breakers can survive a sudden 100% cache-miss rate without the database falling over — this is the single most common cause of cascading outages in cached systems.
4. **Monitor Cache Metrics Continuously**: Track hit ratio, eviction rate, memory usage, and per-tier latency. A declining hit ratio is an early warning sign of TTLs that are too short, a working set that's outgrown available memory, or a key-naming change that's fragmenting the cache.
5. **Treat Every Cache as Derived, Disposable State**: A cache (or CQRS read model, or replica) should always be re-derivable from the source of truth. If "the cache is wrong and we can't figure out why, so we have to manually patch it" is ever a real incident response step, that's a signal the invalidation strategy needs to move toward CDC-based, event-driven correctness rather than ad-hoc deletes.

## See Also
* **[Rate Limiting Algorithms](./rate-limiting-algorithms.md)**: Detail conceptual designs, comparisons, and pseudocode implementations of all core rate-limiting algorithms.