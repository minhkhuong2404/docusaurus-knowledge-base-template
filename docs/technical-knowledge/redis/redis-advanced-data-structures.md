---
id: redis-advanced-data-structures
title: "Redis Advanced Data Structures & Algorithms"
slug: redis-advanced-data-structures
description: A senior deep dive into Redis advanced data types — Bitmaps, HyperLogLog, Geospatial, Streams, Sorted Sets, Bloom Filters, and Bitfields — with internals, memory math, production patterns, and when to use each.
tags: [redis, bitmap, hyperloglog, geospatial, streams, sorted-sets, bloom-filter, backend, architecture, performance]
---

import RedisAdvancedDataStructuresDiagram from '@site/src/components/RedisAdvancedDataStructuresDiagram';
import RedisSkipListDiagram from '@site/src/components/RedisSkipListDiagram';
import RedisGeospatialDiagram from '@site/src/components/RedisGeospatialDiagram';
import RedisBitmapBitopDiagram from '@site/src/components/RedisBitmapBitopDiagram';
import RedisBloomFilterDiagram from '@site/src/components/RedisBloomFilterDiagram';

# Redis Advanced Data Structures & Algorithms

<RedisAdvancedDataStructuresDiagram />

Standard Redis Strings, Lists, Hashes, and Sets handle the majority of application caching use cases elegantly. But operating at genuine hyperscale—hundreds of millions of daily active users, billions of telemetry events, sub-millisecond leaderboards, and spatial geolocation—exposes the catastrophic memory and compute limits of naive data modeling.

Tracking unique visitors with a standard `SET` of UUIDs costs gigabytes of RAM. Computing "users active in the last 30 days" with relational joins or set intersections degrades database throughput.

Advanced Redis data structures solve these problems using specialized data structures and probabilistic algorithms that trade negligible precision for orders-of-magnitude improvements in memory density and execution speed.

---

## 1. Sorted Sets (ZSET) — Probabilistic Skip Lists & Rank Indexing

<RedisSkipListDiagram />

A **Sorted Set (ZSET)** stores unique string members mapped to 64-bit IEEE 754 floating-point scores. It powers low-latency leaderboards, priority queues, and sliding-window rate limiters.

### Internal Dual-Structure Mechanics
To guarantee simultaneous $O(1)$ point lookups and $O(\log N)$ range scans, Redis maintains two internal structures concurrently:

1. **Hash Table (`dict`)**: Maps `member -> score` for $O(1)$ retrieval (`ZSCORE`).
2. **Skip List (`zskiplist`)**: A probabilistic multi-level linked list that sorts elements by score (and lexicographically for identical scores).

```
Level 4: [Head] --------------------------------------------------------> [Node 8] -> NULL
Level 3: [Head] -------------------------> [Node 4] --------------------> [Node 8] -> NULL
Level 2: [Head] -----------> [Node 2] ---> [Node 4] -------> [Node 6] --> [Node 8] -> NULL
Level 1: [Head] -> [Node 1] -> [Node 2] -> [Node 3] -> [Node 4] ... ----> [Node 8] -> NULL
```

- **Why Skip Lists Instead of Red-Black / AVL Balanced Trees?**
  - **Memory Overhead**: Skip list node pointers consume less overhead on average than balanced tree parent/left/right/color metadata.
  - **Range Operations**: Range queries (`ZRANGEBYSCORE`) simply traverse the base level forward pointers like a linked list once the starting node is located in $O(\log N)$.
  - **Concurrency & Simplicity**: Skip list insertions avoid complex tree rebalancing rotations.
- **Probabilistic Height Distribution**:
  - The level height of a new node is chosen probabilistically: a level is increased with probability $p = 0.25$ (up to `ZSKIPLIST_MAXLEVEL = 32`). The average number of forward pointers per node is $\frac{1}{1 - p} \approx 1.33$.

### Memory Optimization: `listpack` Encoding
When a ZSET has fewer than `zset-max-listpack-entries` (default 128) and all member byte lengths are below `zset-max-listpack-value` (default 64 bytes), Redis encodes the entire ZSET as a single contiguous memory buffer (`listpack`). This avoids pointer overhead entirely. Once either threshold is crossed, Redis converts the listpack into the full `zskiplist + dict` structure.

### Production Pattern: Distributed Sliding Window Rate Limiter
Using a ZSET, we can enforce exact sliding-window rate limits (e.g. max 100 requests per 60 seconds) without fixed-window boundary spikes:

```bash
# Transaction for User 4401 at timestamp 1700000000000 (milliseconds)
MULTI
# 1. Remove events older than the 60-second window
ZREMRANGEBYSCORE user:4401:ratelimit 0 (1700000000000 - 60000)
# 2. Add current request (score = timestamp, member = timestamp:nonce)
ZADD user:4401:ratelimit 1700000000000 1700000000000:abc1
# 3. Count requests remaining in the window
ZCARD user:4401:ratelimit
# 4. Set TTL to auto-cleanup inactive users
EXPIRE user:4401:ratelimit 60
EXEC
```

---

## 2. Bitmaps — Sub-Millisecond Bitwise Cohort Analytics

<RedisBitmapBitopDiagram />

Bitmaps are not an independent data type; they are bit-level operations executed directly on standard Redis **Strings**. Because Redis Strings are binary-safe buffers that can grow up to 512 MB, a single String can store up to $2^{32} - 1 \approx 4.29\text{ billion}$ distinct bits.

### Memory Mathematics
Tracking whether a user logged in today:
$$\text{Memory for 100 Million Users} = \frac{100,000,000\text{ bits}}{8\text{ bits/byte}} = 12,500,000\text{ bytes} \approx 11.92\text{ MB}$$
Storing 100 million user IDs in a standard `SET` (assuming 8-byte integer IDs + dictionary node overhead $\approx 32\text{ bytes/node}$) consumes **over 3.2 GB of RAM**. A Bitmap delivers a **$99.6\%$ memory reduction**.

### Bitwise Cohort Analysis via `BITOP`
By allocating one key per calendar day (e.g. `active:2026-10-01`), we compute complex user retention cohorts in hardware-accelerated CPU instructions:

```bash
# Day 1: User 101, 102, 105 log in
SETBIT active:2026-10-01 101 1
SETBIT active:2026-10-01 102 1
SETBIT active:2026-10-01 105 1

# Day 2: User 102, 105, 109 log in
SETBIT active:2026-10-02 102 1
SETBIT active:2026-10-02 105 1
SETBIT active:2026-10-02 109 1

# Compute 2-Day Retained Users (Active on Day 1 AND Day 2)
BITOP AND retained:day1_and_day2 active:2026-10-01 active:2026-10-02
BITCOUNT retained:day1_and_day2
# Returns: 2 (Users 102 and 105)

# Compute Total Unique Weekly Active Users (WAU)
BITOP OR wau:week40 active:2026-10-01 active:2026-10-02 ... active:2026-10-07
BITCOUNT wau:week40
```

### Production Gotcha: Sparse Offsets
If you run `SETBIT user:active 2000000000 1` on an empty string, Redis must allocate all preceding zero bytes immediately:
$$\frac{2,000,000,000\text{ bits}}{8 \times 1024 \times 1024} \approx 238.4\text{ MB of contiguous RAM}$$
If your user IDs are sparse (e.g. UUIDs or scattered non-consecutive IDs), Bitmaps will waste immense amounts of RAM on zero-byte padding. Ensure user IDs are densely packed integers starting from 1, or partition into bucketed shards (e.g. `user:active:bucket:N`).

---

## 3. HyperLogLog (HLL) — Constant-Memory Cardinality Estimation

HyperLogLog is a probabilistic cardinality estimation algorithm that counts unique elements (e.g. Daily Unique Visitors, unique IP addresses, unique search terms) with a fixed memory footprint of **exactly 12 KB**, regardless of whether you add 10 items or 10 billion items.

### Under-the-Hood Mechanics
1. **64-bit Hash Function**: Redis hashes incoming values using a 64-bit variant of `MurmurHash64A`.
2. **Bucket Partitioning ($m = 16,384$)**:
   - The first 14 bits of the 64-bit hash are used to address one of $2^{14} = 16,384$ internal registers:
     $$m = 2^{14} = 16,384\text{ registers}$$
3. **Leading Zeros Counting**:
   - The remaining 50 bits are inspected for the number of leading zeros before the first `1` bit.
   - If an event has $k$ leading zeros, the probability of observing it in a uniform random distribution is $2^{-(k+1)}$. Thus, observing $k$ leading zeros implies approximately $2^{k+1}$ unique items.
4. **Register Maximum Tracking**:
   - Each register stores only the **maximum** leading-zero count seen so far for that register.
   - Since the remaining hash is 50 bits long, the maximum leading zero count is 50. Storing numbers between 0 and 50 requires only **6 bits** ($2^6 = 64$):
     $$\text{Total Size} = 16,384\text{ registers} \times 6\text{ bits} = 98,304\text{ bits} = 12,288\text{ bytes} = 12\text{ KB}$$
5. **Harmonic Mean Estimation**:
   - To eliminate extreme outlier distortions, HLL computes the **harmonic mean** of all 16,384 registers, corrected by a bias-reduction constant $\alpha_m \approx 0.7213$:
     $$E = \alpha_m m^2 \left( \sum_{j=1}^{m} 2^{-M[j]} \right)^{-1}$$
   - **Standard Error**: The standard error rate is strictly:
     $$\text{Error Rate} = \frac{1.04}{\sqrt{m}} = \frac{1.04}{\sqrt{16384}} = \frac{1.04}{128} \approx 0.8125\%$$

### Dense vs. Sparse Representation
- **Sparse Encoding**: When an HLL key is newly created and contains few elements, storing 16,384 6-bit registers is wasteful. Redis begins with a compressed run-length encoded (RLE) sparse representation that typically consumes only **a few hundred bytes**.
- **Dense Transition**: Once memory reaches `hll-sparse-max-bytes` (default 3,000 bytes) or register values become too fragmented to compress, Redis automatically transitions to the fixed 12 KB dense layout.

```bash
# Add page views
PFADD uuv:product:9912 user_session_abc user_session_def user_session_xyz
PFCOUNT uuv:product:9912
# Returns: 3

# Merge multiple days in O(1) time
PFMERGE uuv:product:weekly uuv:product:day1 uuv:product:day2 uuv:product:day3
```

---

## 4. Geospatial (GEO) — 52-bit Geohash on Sorted Sets

<RedisGeospatialDiagram />

Redis Geospatial indexing enables sub-millisecond radius search ("Find riders within 3 km of this driver"). Under the hood, **Redis GEO does not use a R-tree or spatial grid index**; it encodes coordinates directly into a **ZSET**!

### The 52-bit Geohash Integer Transformation
1. **Coordinate Normalization**:
   - Longitude is mapped from $[-180.0, +180.0]$ to $[0, 2^{26}-1]$.
   - Latitude is mapped from $[-85.05112878, +85.05112878]$ (Web Mercator boundary) to $[0, 2^{26}-1]$.
2. **Bit Interleaving (Morton Code / Z-Order Curve)**:
   - The 26 bits of longitude and 26 bits of latitude are interleaved bit-by-bit into a single **52-bit integer**:
     $$\text{Geohash} = \text{lon}_0 \parallel \text{lat}_0 \parallel \text{lon}_1 \parallel \text{lat}_1 \dots \parallel \text{lon}_{25} \parallel \text{lat}_{25}$$
3. **Storing in Sorted Sets**:
   - A 52-bit integer fits perfectly within the 53-bit mantissa of an IEEE 754 64-bit double float!
   - Redis stores this 52-bit integer as the **score** of a standard ZSET:
     ```text
     ZADD key <52-bit-geohash-score> <member-name>
     ```

### Search Mechanics (`GEOSEARCH`)
Spatial proximity corresponds to numerical score proximity along the Z-order space-filling curve. When querying `GEOSEARCH key FROMLONLAT lon lat BYRADIUS 5 km`:
1. Redis calculates the bounding box and determines the 8 surrounding Geohash prefix sub-squares.
2. It translates the search area into continuous numeric range intervals `[min_score, max_score]`.
3. It queries the ZSET via fast skip list range scans (`ZRANGEBYSCORE`), filtering out false positives using the Haversine distance formula.

---

## 5. Redis Streams — Append-Only Log with Consumer Groups

Redis Streams (`XADD`, `XREAD`, `XREADGROUP`) provide an enterprise-grade message log architecture similar to Apache Kafka, with consumer groups, message acknowledgment, and replayability.

### Internal Storage: Radix Trees of Listpacks
Unlike a simple linked list, a Redis Stream is stored as a **Radix Tree (`rax`)** where each leaf node contains a compact **`listpack`** holding multiple message entries (typically 100 entries per node). This yields massive memory compression and cache locality.

```
Radix Tree Root (Prefix Index)
 ├── "1700000000000" -> Leaf Listpack [Entry 1, Entry 2, Entry 3 ... Entry 100]
 └── "1700000010000" -> Leaf Listpack [Entry 101, Entry 102 ... Entry 200]
```

### Message Identifiers
Stream message IDs have the format:
$$\text{MessageID} = \langle\text{millisecondsTimestamp}\rangle - \langle\text{sequenceNumber}\rangle$$
- `1700000000000-0`: First message generated at that millisecond.
- Sequence numbers handle multiple messages generated within the same millisecond clock tick.

### Consumer Groups & The Pending Entries List (PEL)
Consumer groups enable competing-consumer message processing with at-least-once delivery guarantees:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        REDIS STREAM CONSUMER GROUP PIPELINE                            │
│                                                                                        │
│   PRODUCER                   REDIS STREAM (orders.stream)    CONSUMER GROUP (workers)  │
│   ┌───────────┐              ┌───────────────────────────┐   ┌───────────────────────┐ │
│   │ XADD      │ ───────────> │ ID: 1700000-1  {amt: $50} │ ─>│ Consumer A            │ │
│   │           │              │ ID: 1700000-2  {amt: $90} │ ─>│ Consumer B            │ │
│   └───────────┘              └─────────────┬─────────────┘   └───────────┬───────────┘ │
│                                            │                             │             │
│                                            │ Tracks Unacked Messages     │ XACK        │
│                                            ▼                             ▼             │
│                              ┌───────────────────────────┐   ┌───────────────────────┐ │
│                              │ Pending Entries List(PEL) │ <─│ Acknowledged!         │ │
│                              │ Message ID -> (Owner, TTL)│   │ Removed from PEL      │ │
│                              └───────────────────────────┘   └───────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Dead Consumer Recovery (`XAUTOCLAIM` / `XCLAIM`)
If Consumer B crashes while processing message `1700000-2`, the message remains unacknowledged in the PEL. An inspection worker scans the PEL with `XPENDING` and uses `XAUTOCLAIM` to steal and reassign dead consumer messages:
```bash
# Claim messages in orders.stream for group workers that have been idle > 60000ms
XAUTOCLAIM orders.stream workers worker_c 60000 0-0 COUNT 10
```

#### Bounded Stream Trimming (`MAXLEN ~`)
Without trimming, streams grow indefinitely until RAM exhaustion. Using approximate trimming (`~`) allows Redis to drop entire listpack nodes in $O(1)$ time rather than deleting individual entries:
```bash
# Retain approximately 100,000 entries (extremely fast, zero CPU spike)
XADD orders.stream MAXLEN ~ 100000 * order_id 9912 amount 54.20
```

---

## 6. Probabilistic Bloom Filters & Cuckoo Filters

<RedisBloomFilterDiagram />

A **Bloom Filter** (available via RedisBloom / modern Redis Stack) is a space-efficient probabilistic data structure used to test set membership:
- **Returns "NO"**: The item **definitely does not exist** in the set ($0\%$ false negative rate).
- **Returns "YES"**: The item **probably exists** in the set (subject to a configurable false positive probability $p$).

### Mathematical Fundamentals
A Bloom filter consists of a bit array of $m$ bits initialized to 0, and $k$ independent hash functions.
When adding an element $x$, the bits at positions $h_1(x), h_2(x), \dots, h_k(x)$ are set to 1.

Given desired capacity $n$ and target false positive rate $p$:
$$\text{Optimal Array Size } m = -\frac{n \ln p}{(\ln 2)^2} \approx -1.44 \cdot n \log_2 p$$
$$\text{Optimal Number of Hash Functions } k = \frac{m}{n} \ln 2 \approx 0.693 \cdot \frac{m}{n}$$

For $n = 10,000,000$ items and $p = 0.01$ ($1\%$ false positive rate):
- Bit array size: $m \approx 95,850,583\text{ bits} \approx 11.42\text{ MB}$.
- Hash count: $k = 7$ hashes.
- Contrast: Storing 10M UUIDs in a Redis Set consumes **$> 600\text{ MB}$**.

### Production Defense: Cache Penetration & Stampede Shield
A classic vulnerability in high-throughput architectures occurs when attackers query millions of non-existent IDs (e.g. `GET /user/99999999`). Every request misses Redis and hits the primary database:
```
Client Request -> Check Bloom Filter -> Returns FALSE -> Return 404 (DB Never Touched!)
                                     -> Returns TRUE  -> Query Redis -> Fallback to DB
```

---

## 7. Bitfields — Compact Custom Integer Packing

The `BITFIELD` command treats Redis strings as an array of arbitrary-width integers (signed `i1` through `i64`, or unsigned `u1` through `u63`) at specific bit offsets.

### Packing Gaming User Stats into 32 Bits
Instead of storing 4 separate hash fields for player state:
- Player Level: 8 bits unsigned (`u8`) $\to$ values 0–255
- Health Points: 10 bits unsigned (`u10`) $\to$ values 0–1023
- Mana Points: 10 bits unsigned (`u10`) $\to$ values 0–1023
- VIP Status: 4 bits unsigned (`u4`) $\to$ values 0–15
$$\text{Total Size} = 8 + 10 + 10 + 4 = 32\text{ bits} = 4\text{ bytes}$$

```bash
# Set Level=45, HP=850, MP=300, VIP=3 for user 1092
BITFIELD player:1092 SET u8 #0 45 SET u10 #1 850 SET u10 #2 300 SET u4 #3 3

# Atomic In-Place Damage: Deduct 50 HP with Underflow Saturation (SAT)
BITFIELD player:1092 OVERFLOW SAT INCRBY u10 #1 -50
```

---

## 8. Cross-Structure Architectural Decision Matrix

| Data Structure | Typical Use Case | Time Complexity | Memory Profile | Key Trade-Off |
|---|---|---|---|---|
| **Sorted Set (ZSET)** | Leaderboards, rate limiters, priority queues | $O(\log N)$ insert / rank | Medium-High (Dual skiplist + dict) | Exact ordering, but high pointer overhead |
| **Bitmap** | Daily active users, feature flags, cohort retention | $O(1)$ set/get, $O(N)$ bitop | Ultra-Low ($12.5\text{ MB}$ / 100M users) | User IDs must be dense non-negative integers |
| **HyperLogLog** | Unique website visitors, unique IP counts | $O(1)$ add/count | Constant ($12\text{ KB}$ max) | $\pm 0.81\%$ probabilistic error; cannot list items |
| **Geospatial (GEO)** | Radius dispatch (ride-sharing, food delivery) | $O(\log N + M)$ search | Compact (52-bit float in ZSET) | Bounding box approximation requiring distance filter |
| **Streams** | Message queues, audit trails, event sourcing | $O(1)$ append, $O(\log N)$ query | Low-Medium (Radix tree listpack) | Memory grows unless explicitly trimmed via `MAXLEN` |
| **Bloom Filter** | Cache penetration guard, spam/malware filtering | $O(k)$ test/add ($k \approx 7$) | Low ($1.14\text{ bytes}$ per element at $1\%$) | Probabilistic false positives; standard Bloom cannot delete |
| **Bitfield** | Multi-attribute gaming state, packed telemetry | $O(1)$ read/modify/write | Ultra-Low (Exact bit allocation) | Complex bit offset math; strictly positional |

---

## 9. Production Gotchas & Performance Pitfalls

### 1. The `BITOP` Single-Thread Blocker
`BITOP AND/OR/XOR` runs synchronously on the Redis main event loop. Performing a bitwise operation on a 500 MB string processes 4 billion bits, blocking the Redis engine for hundreds of milliseconds and stalling all concurrent traffic.
- **Rule**: Never run `BITOP` across multi-hundred-megabyte keys on production primaries. Run heavy bitwise operations on a read-only replica or slice keys into small chunks.

### 2. Unbounded Stream Memory Leaks
Unlike Redis Lists which can be popped with `LPOP`, reading from a Stream with `XREAD` does **not** delete the message.
- **Rule**: Always specify `MAXLEN ~ <threshold>` during `XADD` or schedule periodic trimming via `XTRIM`.

### 3. HyperLogLog Merging CPU Spikes
`PFMERGE dest source1 source2 ... source30` merges multiple 12 KB register arrays. Merging hundreds of keys simultaneously can cause CPU throttling. Perform batch merges during off-peak windows or offload to background workers.

---

## Related Documentation

- [Redis Eviction Policies & Memory Management](./redis-eviction-policies.md)
- [Redis Clustering, Replication & High Availability](./redis-clustering-replication.md)
- [Redis Lua Scripting & Distributed Locks](./redis-lua-scripting-distributed-locks.md)
- [Caching Strategies & Production Gotchas](../system-design/caching-strategies.md)