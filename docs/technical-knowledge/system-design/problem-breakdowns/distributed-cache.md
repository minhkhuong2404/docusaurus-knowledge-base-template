---
id: distributed-cache
title: Design a Distributed In-Memory Cache Like Redis
sidebar_label: 20. Distributed Cache
description: Staff-level system design breakdown for a high-performance distributed in-memory key-value cache with consistent hashing, eviction algorithms, and replication.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Distributed In-Memory Cache Like Redis

> **Reference**: [Sujeet Pro — Distributed Cache Design](https://sujeet.pro/articles/distributed-cache-design)

A distributed in-memory cache (e.g., Redis Cluster, Memcached, Amazon ElastiCache, Meta TAO/McRouter) provides ultra-low latency, sub-millisecond key-value storage in RAM. Caching sits between application services and durable databases to absorb massive read spikes, reduce database CPU load, and accelerate API response times.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Core Key-Value Operations**: `get(key)`, `put(key, value, ttl)`, `delete(key)` with sub-millisecond latency.
2. **Configurable Eviction Policies**: Evict cold items when memory limit is reached (LRU, LFU, W-TinyLFU, FIFO).
3. **Data Expiration (TTL)**: Keys expire automatically after their Time-To-Live (TTL) has elapsed.
4. **Horizontal Scalability**: Add or remove cache nodes dynamically with minimal cache disruption (Consistent Hashing).
5. **High Availability & Replication**: Primary-replica clustering with automated failover.

### Non-Functional Requirements
- **Sub-Millisecond Read/Write Latency**: P99 latency `< 1ms` for all operations.
- **High Throughput**: Support **Millions of operations per second** across the cluster.
- **Memory Efficiency**: Minimal memory overhead per key; zero memory fragmentation crashes.
- **Fault Tolerance**: Cluster continues serving traffic during node failures without data corruption or cascading crashes.

### Capacity Estimations & Sizing
- **Total Ingress Throughput**: 5 Million operations/sec (80% reads, 20% writes).
- **Total Cached Data**: 10 Terabytes (TB) of active cached objects.
- **Server Sizing**:
  - Cloud cache nodes equipped with 64 GB RAM and 10 Gbps network interfaces.
  - Safe memory utilization cap (80% to avoid OS swapping): $64\text{ GB} \times 0.80 \approx 51.2\text{ GB usable RAM/node}$.
  - Total Nodes = $10\text{ TB} / 51.2\text{ GB} \approx$ **200 Cache Shards**.
  - With 1 replica per shard (2x replication) $\implies$ **400 Total Nodes**.

---

## 2. The Set Up

### Eviction Policies & Data Structures

```
┌───────────────────────────┬──────────────────────────────────┬──────────────────────────────────┐
│ EVICTION POLICY           │ DATA STRUCTURE                   │ COMPLEXITY & BEHAVIOR            │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 1. LRU (Least Recently    │ Hash Map + Doubly Linked List    │ O(1) get, O(1) put.              │
│    Used)                  │                                  │ Vulnerable to full-cache flushes │
│                           │                                  │ during one-off table scans.      │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 2. LFU (Least Frequently  │ Hash Map + Frequency Doubly      │ O(1) get, O(1) put.              │
│    Used)                  │ Linked Lists                     │ Historical bias: Old popular     │
│                           │                                  │ items linger forever (decay req) │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 3. W-TinyLFU (Window      │ TinyLFU (Count-Min Sketch) +     │ Near-optimal hit ratios! Used by │
│    TinyLFU)               │ SLRU (Segmented LRU)             │ Caffeine Cache and modern Redis. │
└───────────────────────────┴──────────────────────────────────┴──────────────────────────────────┘
```

### The Client Driver & Protocol API

```
// Standard Cache Operations
interface DistributedCacheClient {
    byte[] get(String key);
    boolean put(String key, byte[] value, long ttlSeconds);
    boolean delete(String key);
}
```

### Deployment Models: Co-Located (In-Process) vs. Dedicated Cache Cluster

Before provisioning a distributed cache fleet, architects must evaluate **Co-Located Cache** (running inside the application process or as a local sidecar on the same host) against a **Dedicated Cache Cluster**:

| Architectural Dimension | Co-Located / In-Process Cache (e.g., Caffeine, Local Memcached) | Dedicated Cache Cluster (e.g., Redis Cluster, ElastiCache) |
| :--- | :--- | :--- |
| **Access Latency** | **~50 – 200 ns** (Direct heap pointer dereference; zero network RTT or serialization). | **~0.5 – 2 ms** (TCP socket hop + RESP/Protobuf serialization/deserialization). |
| **Data Consistency & Coherence** | **Low**: Each app node holds an independent copy; invalidating a key across 200 app pods requires a Pub/Sub broadcast mesh. | **High**: Single shared view per key shard; a single `DEL` or `SET` updates the authoritative cache entry for all callers. |
| **Memory Utilization** | **Fragmented & Duplicated**: Identical hot keys are duplicated across every application instance's RAM, inflating JVM GC pause times. | **Consolidated**: Each key is stored once per primary shard (+ replica), maximizing effective Working Set capacity. |
| **Scaling Coupling** | **Tightly Coupled**: Scaling compute pods unnecessarily scales cache RAM (and vice versa); pod deployments wipe local caches cold. | **Decoupled**: Cache RAM and compute CPU scale independently; app deployments never flush cached state. |
| **Production Sweet Spot** | L1 Near-Cache for ultra-hot immutable/semi-static keys (feature flags, celebrity profiles, config). | Primary L2 shared cache for high-cardinality user sessions, feeds, timelines, and rate limiters. |

### Cache Access & Write Topologies

A distributed cache interacts with the source-of-truth database through five canonical topologies:
1. **Cache-Aside (Lazy Loading)**: Application checks cache first; on a miss, it queries the DB, populates the cache, and returns. On writes, the application updates the DB and **deletes (invalidates)** the cache key (never overwrites, to avoid concurrent write reorder races).
2. **Read-Through**: The cache cluster (or a smart proxy like **Meta McRouter / TAO**) sits inline; on a cache miss, the cache layer itself fetches from the backing store, populates the key, and returns to the client.
3. **Write-Through**: Every mutation writes synchronously to both the cache and the database before returning success. Guarantees strong cache freshness at the cost of higher write latency and potential cache pollution with unread writes.
4. **Write-Behind (Write-Back)**: Mutations write exclusively to the cache in `< 1ms` and append to an in-memory dirty queue; asynchronous background workers batch and flush mutations to the database. Essential for high-velocity counters (likes, view counts), but risks data loss if both primary and replica cache nodes fail before flushing.
5. **Refresh-Ahead**: The cache tracks access frequency and proactively reloads hot keys asynchronously when their remaining TTL crosses a threshold (e.g., 80% elapsed), eliminating read-path miss latency spikes entirely.

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="in-memory-cache" title="Distributed In-Memory Cache Cluster Architecture" />

### Core Subsystems & Operational Flow

#### 1. Consistent Hashing Client Routing
1. The application client driver holds a local view of the **Consistent Hashing Ring** containing virtual nodes (tokens) for all primary cache instances.
2. Client calls `get("user:101")`.
3. The client computes: $\text{hash} = \text{MurmurHash3}(\text{"user:101"})$.
4. Finds the first virtual node clockwise on the ring $\implies$ Node 4.
5. Issues a direct TCP socket call to Node 4 over a persistent connection pool in **0.4ms**.

#### 2. Storage & Eviction Inside a Single Cache Node
1. Node receives `put(key, value, ttl)`.
2. Checks current memory usage against max allocation (`maxmemory`).
3. If memory is full:
   - Triggers the **Eviction Engine (LRU / W-TinyLFU)**: Evicts victim keys from RAM.
4. Stores key, pointer, metadata, and expiration timestamp in the in-memory hash table.
5. Asynchronously streams the write command to connected replica nodes over replication sockets.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Consistent Hashing with Virtual Nodes
Why does naive modulo hashing (`hash(key) % N`) fail in distributed caching?

- **The Modulo Catastrophe**:
  - If we have $N=10$ nodes and 1 node crashes ($N=9$):
  - Almost 100% of keys remap to different nodes (`hash(key) % 9 != hash(key) % 10`)!
  - **Result**: Immediate 100% cache miss storm across the entire company. Database receives 100x traffic surge and collapses instantly (**Cascading Failure**).
- **Consistent Hashing Solution**:
  - Map keys and server nodes onto a circular $2^{32}-1$ integer ring.
  - When a server is added or removed, **only $K/N$ keys** are remapped!
- **Virtual Nodes (Preventing Non-Uniform Hotspots)**:
  - Placing physical nodes directly on the ring causes uneven partition splits.
  - By assigning **100 to 256 virtual nodes** per physical server (e.g. `Server1#1`, `Server1#2`), keys are distributed uniformly across all physical nodes within a 2% variance.

```
                  Consistent Hash Ring (0 to 2^32 - 1)
                            [Node 1#V1]
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
           [Node 3#V2]                      [Node 2#V1]
                 │                               │
                 │          Key "order:99"       │
                 │          hashes here ────────►│ (Routed to Node 2)
                 │                               │
           [Node 2#V2]                      [Node 1#V2]
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                            [Node 3#V1]
```

### Deep Dive 2: Memory Management & Fragmentation (Slab Allocation vs jemalloc)
Why does continuous allocation of dynamic key sizes crash cache servers?

- **External Memory Fragmentation**: Repeatedly allocating and freeing random-sized keys (100 bytes, 4 KB, 1 MB) creates holes in physical memory. The OS reports 10 GB of free RAM, but no contiguous block exists to allocate a 50 KB object $\implies$ `OutOfMemoryError` crash!
- **Slab Allocation (Memcached Model)**:
  - Pre-allocates memory into fixed 1 MB pages.
  - Divides pages into uniform chunks called **Slab Classes** (e.g. Class 1: 64 bytes, Class 2: 128 bytes, Class 3: 256 bytes).
  - A 100-byte object is stored in Slab Class 2.
  - Completely eliminates external memory fragmentation.
- **jemalloc & Active Defragmentation (Redis Model)**:
  - Uses `jemalloc` with automatic background defragmentation (`activedefrag yes`).
  - The engine copies allocated values to contiguous memory in the background while updating pointers without blocking reads.

### Deep Dive 3: Cache Stampede (Thundering Herd) & Single-Flight Locking
What happens when a popular hot key (`"breaking:news"`) expires under 50,000 requests per second?

```
50,000 Concurrent Requests arrive for Key "breaking:news"
                 │
                 ▼
Key expired in Cache! (50,000 Cache Misses!)
                 │
                 ▼
ALL 50,000 REQUESTS HIT THE PRIMARY DATABASE SIMULTANEOUSLY!
                 ➔ DATABASE CONNECTION EXHAUSTION & CRASH!
```

#### Production Defenses:
1. **Single-Flight / Mutex Locking (`Go singleflight` / Distributed Lock)**:
   - When a cache miss occurs, only **one single worker** acquires a local mutex to fetch the data from the database and populate the cache.
   - The remaining 49,999 requests wait for the mutex or subscribe to the in-flight result, completely protecting the database.
2. **Probabilistic Early Expiration (XFetch Algorithm)**:
   - Recompute the cache value before it actually expires using probabilistic math:
     $\Delta \times \beta \times \ln(\text{rand}()) > \text{TTL} - \text{now}()$.
   - A background thread silently refreshes the key before the hard expiration boundary arrives.

---

### Deep Dive 4: Consistent Hashing Ring vs. Redis Cluster 16,384 Hash Slots

While Memcached ecosystems (e.g., ketama client ring or McRouter) map keys onto a continuous $2^{32}$ Consistent Hashing Ring with virtual nodes, **Redis Cluster** deliberately replaces the continuous ring with **16,384 deterministic Hash Slots**:

$$\text{Hash Slot} = \text{CRC16}(\text{key}) \bmod 16384$$

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 REDIS CLUSTER DETERMINISTIC HASH SLOTS (0..16383)            │
├────────────────────────┬───────────────────────────┬─────────────────────────┤
│   Shard 1 (Master A)   │    Shard 2 (Master B)     │   Shard 3 (Master C)    │
│   Slots: 0 – 5460      │    Slots: 5461 – 10922    │   Slots: 10923 – 16383  │
└────────────────────────┴───────────────────────────┴─────────────────────────┘
```

- **Why 16,384 ($2^{14}$) Instead of 65,536 ($2^{16}$)?**
  1. **Gossip Heartbeat Bitmaps**: Every Redis node exchanges cluster state via gossip `PING`/`PONG` packets containing a bitmap of owned slots. At $16,384$ slots, the ownership bitmap is only $16384 / 8 = \mathbf{2\text{ KB}}$ per heartbeat packet. At $65,536$ slots, the bitmap balloons to $8\text{ KB}$ per message, wasting significant internal network bandwidth across hundreds of nodes.
  2. **Operational Cluster Limit**: Redis Cluster rarely scales beyond 1,000 primary nodes due to gossip overhead; 16,384 slots still provide $\ge 16$ slots per node for smooth load balancing.
- **Explicit Slot Migration vs. Ring Token Math**: Moving load from Node A to Node B does not require recalculating virtual node token ranges—operators simply issue `CLUSTER SETSLOT <slot> MIGRATING/IMPORTING`, moving atomic slot buckets while smart clients follow `-ASK` and `-MOVED` redirections.
- **Multi-Key Operations via Hash Tags**: To execute atomic `MGET` or Lua scripts across multiple keys on the same shard, wrap the routing substring in braces (e.g., `user:{9481}:profile` and `user:{9481}:orders`). Redis hashes **only the bytes inside `{...}`**, guaranteeing both keys land in the exact same hash slot.

---

### Deep Dive 5: Cache Invalidation, Stale-Set Race Conditions & Meta's Lease Mechanism

In a standard **Cache-Aside** architecture (`Write updates DB -> Write deletes Cache`), a notorious concurrency bug occurs when a slow read overlaps with a concurrent write (**The Classic Stale-Set Race Condition**):

```
Timeline   Reader Thread (Cache Miss)             Writer Thread (DB Mutation)
────────   ────────────────────────────────────   ────────────────────────────────────
  t1       1. Cache GET "item:42" ➔ MISS!
  t2       2. Reads DB: v1 ($100)
  t3         [JVM GC Pause / Network Delay]       3. Updates DB: v2 ($150)
  t4         [Paused...]                          4. Deletes Cache "item:42" (No-op)
  t5       5. Resumes: Cache SET "item:42" = v1!
────────   ────────────────────────────────────   ────────────────────────────────────
RESULT:    Cache is permanently poisoned with stale v1 ($100) until TTL expires!
```

#### Solution A: Meta (Facebook) Memcached / TAO **Leases** (64-bit CAS Tokens)
Introduced in Meta's seminal NSDI *Scaling Memcache at Facebook* paper, **Leases** solve both **Stale Sets** and **Thundering Herds** in a single mechanism:
1. **Lease Issuance on Miss**: When Client A experiences a cache miss on key $K$, the cache node generates and returns a monotonically increasing **64-bit Lease Token** (`lease_id = 88412`) and records it in key $K$'s tombstone metadata.
2. **Thundering Herd Rate-Limiting**: If Clients B, C, and D miss on key $K$ within 10 milliseconds of lease issuance, the cache server does **not** issue them new leases—it returns a **`HOT_MISS` (wait/backoff)** signal (or serves slightly stale data), forcing them to retry `GET` after a few milliseconds when Client A has populated the cache.
3. **Lease Invalidation on Delete**: When Writer Thread updates the DB and sends `DELETE K` at $t_4$, the cache server invalidates any active lease token for $K$.
4. **Lease Verification on Set**: When Client A wakes up from its GC pause at $t_5$ and calls `SET(K, v1, lease_id=88412)`, the cache server sees that `88412` was invalidated by the intervening `DELETE` and **rejects the stale write**!

#### Solution B: Asynchronous CDC-Driven Invalidation (Debezium + Kafka)
Instead of coupling application services to dual-write or synchronous `DELETE` calls (which can fail mid-flight after DB commit), production systems decouple invalidation via **Change Data Capture (CDC)**:
- Application writes strictly to the relational database (PostgreSQL WAL / MySQL Binlog).
- **Debezium** tails the transaction log in real time, streaming committed row mutations (`op: u/d`, `lsn / scn`) into Kafka.
- A dedicated **Cache Invalidator Consumer** reads the stream, compares the database **Log Sequence Number (`LSN`) / version** against the cached version, and atomically deletes or updates the Redis key via a Lua script (`if incoming_lsn > cached_lsn then redis.call('SET', ...)`).

---

### Deep Dive 6: Hot Key Mitigation (Celebrity / Flash-Sale Skew)

Even with uniform consistent hashing or 16,384 slots, a single **Hot Key** (e.g., a celebrity post or flash-sale SKU receiving 2,000,000 reads/sec) maps to **one single hash slot on one single Redis primary**, saturating its single CPU core (~150k ops/sec limit) and NIC bandwidth.

```java
// Production Hot-Key Defense: L1 Near-Cache + Salted Read Replicas
public final class HotKeyResilientCacheClient {
    private final Cache<String, byte[]> l1NearCache;
    private final DistributedCacheClient l2RedisCluster;
    private final HotKeyDetector topKDetector; // Count-Min Sketch + Min-Heap tracking QPS/key
    private static final int SALT_BUCKETS = 16;

    public HotKeyResilientCacheClient(DistributedCacheClient l2RedisCluster) {
        this.l2RedisCluster = l2RedisCluster;
        this.topKDetector = new HotKeyDetector(5000); // Threshold: 5,000 QPS per client
        this.l1NearCache = Caffeine.newBuilder()
            .maximumSize(2_000)
            .expireAfterWrite(Duration.ofSeconds(2)) // Ultra-short 2s micro-TTL
            .build();
    }

    public byte[] get(String key) {
        topKDetector.recordAccess(key);
        if (topKDetector.isHot(key)) {
            // Defense 1: Serve from in-process L1 Near-Cache (0 network hops, ~100ns)
            byte[] cached = l1NearCache.getIfPresent(key);
            if (cached != null) return cached;

            // Defense 2: Key Salting / Read-Replica Fan-Out across 16 distinct hash slots
            int salt = ThreadLocalRandom.current().nextInt(SALT_BUCKETS);
            String saltedKey = key + "#replica:" + salt;
            byte[] value = l2RedisCluster.get(saltedKey);
            if (value == null) {
                value = l2RedisCluster.get(key); // Fallback to primary key
            }
            if (value != null) {
                l1NearCache.put(key, value);
            }
            return value;
        }
        return l2RedisCluster.get(key);
    }
}
```

1. **Client-Side L1 Near-Cache + Pub/Sub Invalidation (Redis 6 Client-Side Caching / Tracking)**: Application instances detect top-$K$ hot keys using a local Count-Min Sketch + HeavyKeeper structure and cache them in local JVM heap (`Caffeine`) with a **1–3 second micro-TTL** plus Redis RESP3 `CLIENT TRACKING` invalidation push notifications.
2. **Key Salting / Shadow Key Replication (`key#1` .. `key#N`)**: When a key is flagged as hot, writes fan out to $N$ salted copies (`product:99#1` through `product:99#16`). Because each salted key has a distinct hash, the 16 copies scatter across 16 different physical shards, multiplying read throughput by $16\times$.

---

### Deep Dive 7: High Availability, Failover & Cold-Cache Warm-Up

1. **Primary-Replica Failover & Consensus**:
   - Every primary shard maintains 1–2 asynchronous read replicas across distinct Availability Zones (AZs).
   - **Gossip / Sentinel Quorum**: When a primary node fails to respond to heartbeats within `cluster-node-timeout` (e.g., 5 seconds), a majority quorum of master nodes elects the replica with the most advanced `replication_offset` to promote to primary and broadcasts an epoch bump (`configEpoch`).
2. **The Cold-Cache Replacement Catastrophe**:
   - If a failed shard is replaced by a brand-new, empty node (0% hit ratio), routing live production traffic to it immediately will cause a massive miss storm that crushes the backing database.
3. **Production Warm-Up Protocols Before Traffic Shift**:
   - **Shadow Traffic Replay (Dark Launch)**: Mirror read traffic from the load balancer or McRouter to the warming node asynchronously without serving its responses to users until its hit ratio crosses 85%.
   - **Peer Replica Snapshot Cloning**: Bootstrap the new node from an existing replica's RDB snapshot / memory fork + replication backlog stream before registering it in the active hash ring.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Routing Topology** | Proxy-Based Routing (Twemproxy/Envoy) | Client-Side Consistent Hash Driver | **Client-Side Driver**: Direct socket communication eliminates a proxy network hop, shaving 0.5ms off every request. |
| **Eviction Algorithm** | Standard LRU | W-TinyLFU (Window TinyLFU) | **W-TinyLFU**: Solves the scan resistance flaw of standard LRU. Prevents full-cache evictions caused by one-off analytical scans. |
| **Replication Semantics** | Synchronous Replication | Asynchronous Primary-Replica | **Asynchronous**: Synchronous replication forces writes to wait for network round-trips to replicas, destroying sub-millisecond write SLAs. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands the need for caching in front of databases.
- Implements basic in-memory LRU cache using a Hash Map and Doubly Linked List.
- Explains basic TTL and cache expiration.
- Designs basic Cache-Aside read/write flows.

### Senior (L5 / IC5)
- Details the **Consistent Hashing** algorithm and why virtual nodes are essential to prevent partition skew.
- Explains memory fragmentation and compares Slab Allocation (Memcached) vs jemalloc defragmentation (Redis).
- Solves Cache Stampede / Thundering Herd using single-flight mutexes or probabilistic early expiration (XFetch).
- Implements primary-replica failover mechanisms with automated health-check heartbeats.

### Staff+ (L6 / Principal)
- Designs multi-datacenter cache synchronization: Handling cross-region cache replication without causing stale read loops or split-brain overwrites during network partitions.
- Details kernel networking optimization: Bypassing Linux kernel network stack overhead using kernel-bypass networking (DPDK / eBPF / XDP) to achieve 10M+ packets/sec per node.
- Evaluates persistent memory (PMEM / Intel Optane) trade-offs for instant cold-start cache warming after cluster restarts.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Distributed Cache Interviews

> **Reference**: [Sujeet Pro — Distributed Cache Design](https://sujeet.pro/articles/distributed-cache-design)

### 1. The Senior Framing Strategy (First 60 Seconds)
When an interviewer asks *"Design a Distributed Cache like Redis or Memcached"*, anchor your design in physical hardware constraints and failure domains within the first 60 seconds:
- **State Non-Negotiable Invariants Upfront**: A distributed cache is an **AP / Best-Effort Low-Latency acceleration layer**, never the authoritative system of record. The two physical invariants are **Bounded Tail Latency** ($P99 < 1\text{ ms}$ intra-AZ) and **Database Shielding** (a cache failure, resharding event, or key expiration must never trigger a cascading outage on the backing OLTP database).
- **Back-of-the-Envelope Capacity & NIC Physics**: Never size a cache cluster strictly by dividing total RAM ($10\text{ TB} / 64\text{ GB}$). Calculate **QPS per CPU core** and **Network Interface Card (NIC) saturation**: a single-threaded Redis shard maxes out around **100k–150k ops/sec**, and a `10 Gbps` NIC saturates at $\sim 1.1\text{ GB/sec}$ (just $110,000\text{ reads/sec}$ of $10\text{ KB}$ payloads!). Always cap memory utilization at **75–80% of physical RAM** to leave headroom for replication buffers and `fork()` Copy-on-Write (CoW) page tables during snapshots.
- **Proactive Failure-Mode Identification**: Proactively surface the four distributed failure modes before the interviewer asks:
  1. **Stale-Set Race Condition**: Concurrent read-miss and write-invalidate reordering poisoning the cache with stale data (solved via **Meta Leases** or versioned CDC).
  2. **Hot-Key Single-Shard Meltdown**: Consistent hashing cannot split a single hot key across nodes (solved via **L1 Near-Cache** + **Salted Key Replication `key#1..N`**).
  3. **Cache Stampede / Thundering Herd**: Simultaneous expiration of hot keys crushing the DB (solved via **Single-Flight**, **Lease rate-limiting**, or **Refresh-Ahead / XFetch**).
  4. **Cold-Cluster / Cold-Shard Reboot**: A restarted shard shifting 100% miss traffic to the DB (solved via **shadow traffic warming** and replica snapshot bootstrapping).
- **Day-2 Operational Realism**: Highlight `jemalloc` active defragmentation vs. Memcached Slab Calcification (reassigning slab page classes dynamically when object size distributions shift), Redis Cluster 16,384 slot migration, and CDC-driven asynchronous cache invalidation.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "In Cache-Aside, when a user updates their data in the database, should our application update the cache (`SET`) or delete the cache (`DEL`)? And does deleting it guarantee we never have stale data?"
* **Junior/Mid Answer:** *"We should update the cache with `SET` so the next read is a cache hit! Or if we `DEL` the key after updating the database, the next read will fetch fresh data from the DB, which guarantees 100% consistency."*
* **Principal Rebuttal:**
  > *"First, updating the cache on write (`SET`) is dangerous because two concurrent writes $W_1$ and $W_2$ can arrive at the database in order $(W_1, W_2)$ but arrive over the network at Redis in order $(W_2, W_1)$, leaving the cache permanently out of sync. Therefore, **Delete-on-Write (`DEL`)** is preferred.*
  >
  > *Second, even `Update DB -> Delete Cache` does **NOT** guarantee freedom from stale data! If Reader A misses the cache and reads $v_1$ from the DB, then pauses for a 50ms JVM GC pause while Writer B updates the DB to $v_2$ and executes `DEL`, Reader A will wake up and execute `SET v1`, poisoning the cache until TTL expiration.*
  >
  > *At Staff/Principal scale (like Meta's TAO / McRouter), we solve this using **64-bit Lease Tokens**: on a miss, the cache issues a lease token to Reader A. When Writer B executes `DEL`, the cache invalidates that lease token. When Reader A resumes and tries to `SET v1` with the invalidated token, the cache rejects the stale write. We further decouple invalidation from app threads by tailing the DB WAL via **Debezium CDC** and comparing monotonic `LSN` versions inside a Redis Lua script."*

#### Trap 2: "We use Consistent Hashing with 200 virtual nodes per server. What happens when a celebrity posts a viral link and 1,000,000 users per second request that exact key?"
* **Junior/Mid Answer:** *"Consistent hashing with virtual nodes distributes the load evenly across all 100 Redis servers, so each server will only handle 10,000 requests per second."*
* **Principal Rebuttal:**
  > *"That is a fundamental misunderstanding of consistent hashing. Virtual nodes distribute **different keys** uniformly across the ring, but **a single deterministic key (`post:999`) always hashes to the exact same point on the ring** and routes 100% of its 1,000,000 QPS to a **single physical shard**! That single shard will immediately hit 100% CPU saturation and drop connections.*
  >
  > *To mitigate a single Hot Key, we combine two architectural defenses:*
  > 1. ***Client-Side L1 Near-Cache***: *Each application pod runs a lightweight stream frequency detector (Count-Min Sketch / HeavyKeeper). Once a key exceeds a local QPS threshold, it is cached in local process memory (Caffeine) with a **1–2 second micro-TTL** or invalidated via Redis `CLIENT TRACKING` pub/sub, absorbing 99% of reads at 0 network cost.*
  > 2. ***Key Salting / Read-Out Fanout***: *Append a bounded random salt `post:999#1` .. `post:999#16` to replicate the hot key across 16 different hash slots on 16 physical servers, spreading the network and CPU load horizontally."*

#### Trap 3: "Why does Redis Cluster use exactly 16,384 hash slots instead of consistent hashing or 65,536 slots?"
* **Junior/Mid Answer:** *"16,384 is just an arbitrary power of two chosen by the creator of Redis, and it works the same as a consistent hashing ring."*
* **Principal Rebuttal:**
  > *"Unlike a stateless consistent hashing ring where slot boundaries are implicitly computed from node hashes, Redis Cluster explicitly tracks **which node owns which slot** via a bit-array exchanged in every cluster gossip `PING`/`PONG` heartbeat packet.*
  >
  > *With $16,384$ ($2^{14}$) slots, the slot ownership bitmap per node is $16,384 / 8\text{ bits} = \mathbf{2\text{ KB}}$. If Redis used $65,536$ ($2^{16}$) slots, every gossip heartbeat packet would carry an **8 KB bitmap**, saturating intra-cluster network bandwidth as nodes gossip multiple times per second. Furthermore, explicit slot tables make live resharding trivial: an operator can move Slot `4012` from Node A to Node B atomically without shifting token ranges of unrelated nodes."*

#### Trap 4: "What happens if a primary cache shard crashes and Kubernetes spins up a fresh replacement node and puts it right back into the consistent hash ring?"
* **Junior/Mid Answer:** *"Consistent hashing routes $1/N$ of the traffic to the new node, which will lazily repopulate its memory via Cache-Aside as requests come in."*
* **Principal Rebuttal:**
  > *"In a high-throughput production system (e.g., 5M QPS with a 99% hit ratio), the database is provisioned to handle only the **1% miss traffic (50,000 QPS)**. If a cold shard is dropped directly into active rotation, 100% of requests to that shard miss simultaneously, instantly multiplying database read load and risking a cascading DB meltdown.*
  >
  > *Before shifting live traffic to a replacement shard, we must execute a **Cold-Cache Warm-Up Protocol**: either promote an already-warm **Asynchronous Read Replica** via Sentinel/Cluster failover, or place the new node in **Shadow/Dark-Read Mode** (where the proxy/client tee-mirrors production `GET`/`SET` traffic to the new node while still serving responses from the fallback replica) until its hit ratio stabilizes above 85%."*

---

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Sharding Architecture** | *"Use `hash(key) % N` or basic consistent hashing."* | *"Contrasts **Consistent Hashing + Virtual Nodes** (Memcached/McRouter) against **Redis Cluster 16,384 Hash Slots** (`CRC16 % 16384`, 2KB gossip bitmaps, and `{hash_tag}` multi-key locality)."* |
| **Cache-Aside Stale Write Race** | *"Delete the cache key after updating the DB to stay consistent."* | *"Explains how a paused reader overwrites a newer DB mutation, and solves it via **Meta 64-bit Lease Tokens** or **Debezium CDC** with monotonic `LSN` version checks."* |
| **Hot Key Skew** | *"Add more nodes to the consistent hashing ring."* | *"Proves why adding nodes never splits a single hot key; implements **Client-Side L1 Near-Cache** (2s micro-TTL + `CLIENT TRACKING`) and **Salted Key Replication (`key#1..16`)**."* |
| **Memory Allocation & OOM** | *"Evict keys with LRU when RAM hits 100%."* | *"Caps RAM at 75–80% for `fork()` CoW safety; addresses **External Memory Fragmentation** via Memcached **Slab Classes** (and slab page reassignment) vs. Redis **`jemalloc` active defragmentation**."* |
| **Failover & Node Recovery** | *"Spin up a new cache container and let Cache-Aside fill it."* | *"Prevents cold-shard DB avalanches via **Primary-Replica promotion** (`replication_offset` election) and **Shadow Traffic Replay** before shifting client routing."* |

