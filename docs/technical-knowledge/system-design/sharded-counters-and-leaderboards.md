---
id: sharded-counters-and-leaderboards
title: "Sharded Counters & Real-Time Leaderboards at Scale"
sidebar_label: 🏆 Sharded Counters & Leaderboards
description: Deep dive into distributed counting and ranking architectures — hot-key mitigation, sharded counters, CRDT PN-Counters, HyperLogLog, and Redis Sorted Set (ZSET) skiplist leaderboards with tie-breaking bit-packing.
tags: [system-design, redis, sharded-counters, leaderboards, hyperloglog, skiplist, zset, crdt]
---

import ShardedCountersLeaderboardDiagram from '@site/src/components/ShardedCountersLeaderboardDiagram';

# Sharded Counters & Real-Time Leaderboards at Scale

---

Counting and ranking seem deceptively simple until they collide with extreme write concurrency. A viral tweet receiving 500,000 likes per second, an e-commerce flash sale tracking inventory, or a global gaming leaderboard ranking 100 million players cannot rely on naive SQL transactions or single-key Redis increments.

High-throughput systems scale counting and ranking through **Sharded Counters**, **CRDT Convergent Counters**, **Probabilistic Data Structures (HyperLogLog, Count-Min Sketch)**, and **Redis Sorted Set (ZSET) Skip Lists**.

<ShardedCountersLeaderboardDiagram />

---

## 1. Why Single-Key Counters Melt Under Load

In relational databases and key-value caches, incrementing a counter is a read-modify-write operation:

```sql
-- PostgreSQL / MySQL:
UPDATE post_metrics SET like_count = like_count + 1 WHERE post_id = 99824;

-- Redis:
INCR post:99824:likes
```

### The Two Bottlenecks:

1. **Relational Row-Lock Contention**:
   In PostgreSQL or MySQL (InnoDB), updating a row acquires an **Exclusive (X) Row Lock**. When 10,000 requests arrive concurrently for the same viral post, 9,999 transactions block waiting in a lock queue. Connection pools exhaust within milliseconds, database CPU spikes to 100% due to thread context-switching, and queries fail with `Lock wait timeout exceeded`.

2. **Redis Single-Threaded Core Saturation**:
   While Redis executes in-memory with non-blocking I/O, a single Redis master core executes commands sequentially. A single CPU core caps out at approximately **100,000 to 120,000 commands per second**. A viral event exceeding 200,000 operations/second completely saturates the core, causing request buffering and cascading gateway timeouts.

---

## 2. Sharded Counters Architecture

The standard engineering solution for hot-key write contention is **Counter Sharding**: dividing a single logical counter into $N$ distinct physical sub-keys.

```
Incoming Writes (500k/s) ──► rand(0, 3) ──┬──► Shard 0: INCR post:99:like:0
                                          ├──► Shard 1: INCR post:99:like:1
                                          ├──► Shard 2: INCR post:99:like:2
                                          └──► Shard 3: INCR post:99:like:3
```

### Write Path: Random Scatter
When a user likes a post:
1. The client or API server selects a random shard index:
   $$\text{shard\_index} = \text{random}(0, N - 1)$$
2. The increment is routed to that sub-key:
   ```bash
   INCR post:99:like:2
   ```
3. **Throughput Multiplier**: Write throughput scales **linearly with $N$**. If 1 shard handles 100,000 writes/sec, 10 shards across a Redis cluster handle **1,000,000 writes/sec** with zero lock contention!

### Read Path: Scatter-Gather & Rollup Caching
To read the total count:
- **Low-Latency / Exact**: Issue a multi-key fetch in a single network round-trip:
  ```bash
  MGET post:99:like:0 post:99:like:1 post:99:like:2 post:99:like:3
  ```
  Sum the integers in memory on the API gateway ($O(N)$ operations).
- **Hyperscale / Eventual Consistency**: For high-read workloads (millions of users viewing a tweet), reading and summing 20 shards on every HTTP request wastes CPU. A lightweight background worker aggregates the shards every 1 to 3 seconds into a cached `total_likes` key.

---

## 3. CRDT Counters: G-Counters & PN-Counters

In multi-region active-active architectures (e.g. AWS US-East and EU-West), sharded keys cannot synchronize synchronously over transatlantic networks without latency penalties. We use **Conflict-Free Replicated Data Type (CRDT)** counters.

### 1. Grow-Only Counter (G-Counter)
A G-Counter only supports increments. It is modeled as a vector of integers of size $K$, where $K$ is the number of participating datacenter nodes:

$$V = [v_1, v_2, \dots, v_K]$$

- Node $i$ only increments its own slot $V[i]$.
- **Value**: The total counter value is the sum of all elements:
  $$\text{Value} = \sum_{k=1}^K V[k]$$
- **Merge**: Replicas exchange vectors asynchronously. The merge function computes the element-wise maximum (forming a join-semilattice):
  $$V_{\text{merged}}[k] = \max(V_A[k], V_B[k])$$

### 2. Positive-Negative Counter (PN-Counter)
To support both increments (likes) and decrements (unlikes), a PN-Counter pairs two G-Counters: $P$ (tracks increments) and $N$ (tracks decrements):

$$\text{Total Value} = \sum P - \sum N$$

- **Increment**: Increments local node slot in $P$.
- **Decrement**: Increments local node slot in $N$.
- Both $P$ and $N$ grow monotonically, preserving commutativity and associativity across multi-region datacenters without locks!

---

## 4. Probabilistic Counting Primitives

When exact counts are not required (e.g. estimating unique visitor counts or detecting trending hashtags), storing exact IDs in sets wastes gigabytes of memory.

```
                    PROBABILISTIC DATA STRUCTURES
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
HYPERLOGLOG (HLL)                                 COUNT-MIN SKETCH (CMS)
• Unique Cardinality (Distinct Count)             • Frequency Estimation (Item Counts)
• O(log log N) space (~12 KB memory)              • Fixed 2D hash matrix
• Standard error ≤ 0.81%                          • Ideal for Top-K trending & DDoS detection
• Redis: PFADD / PFCOUNT                          • Redis: CMS.INCRBY / CMS.QUERY
```

### 1. HyperLogLog (HLL)
- **Problem**: Counting distinct visitors (DAU) across 100 million users using a standard Redis `SET` requires storing 100M user IDs ($\approx 1.6\text{ GB}$ of RAM).
- **HLL Magic**: HyperLogLog estimates the number of leading zeros in hashed bit patterns across 16,384 internal registers ($2^{14}$).
- **The Memory Feat**: Counts from 1 up to $2^{64}$ unique items using a fixed **12 KB of RAM**, with a bounded statistical error rate of **0.81%**.
- **Redis Commands**:
  ```bash
  PFADD daily_active_users:2026-05-01 "user_892" "user_104"
  PFCOUNT daily_active_users:2026-05-01
  ```

### 2. Count-Min Sketch (CMS)
- **Problem**: Determining which songs or hashtags are trending in real-time streams without storing billions of event strings.
- **CMS Mechanism**: A 2D array of $w$ columns and $d$ rows with $d$ independent hash functions. An item is hashed and its corresponding cells incremented. The estimated frequency is the minimum value across the $d$ hashed cells:
  $$\text{Estimate}(x) = \min_{1 \le i \le d} \text{Table}[i, h_i(x)]$$
- Guaranteed never to underestimate; overestimation is bounded by matrix width $w$ and depth $d$.

---

## 5. Real-Time Leaderboards on Redis Sorted Sets (ZSET)

Building a gaming or competitive leaderboard with millions of players requires three capabilities:
1. Update player score in real-time ($O(\log N)$)
2. Retrieve a player's exact rank ($O(\log N)$)
3. Fetch the top 100 players or friends around a player ($O(\log N + M)$)

Relational databases fail because computing rank requires `SELECT COUNT(*) FROM scores WHERE score > my_score`, which degrades into a full table scan under continuous writes.

### Redis ZSET Dual Architecture
Redis implements Sorted Sets using **two coordinated data structures** pointing to the same elements:

```
                       REDIS ZSET INTERNALS
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
   HASH TABLE                                       SKIP LIST
• Maps: member ➔ score                          • Multi-level linked list
• Provides O(1) score lookup (ZSCORE)           • Keeps members ordered by score
• O(1) existence checks                         • Provides O(log N) rank & range
```

#### The Skip List Mechanism:
A Skip List is a probabilistic alternative to balanced trees (AVL/Red-Black). Nodes have random geometric heights (promoted with probability $p = 0.25$). Forward pointers allow the search traversal to skip over hundreds of nodes in $O(\log N)$ time, avoiding complex tree rebalancing rotations during concurrent score updates.

---

## 6. Leaderboard Engineering Nuances

### Nuance 1: Tie-Breaking via Timestamp Bit-Packing
If Player A and Player B both achieve 1,000 points, Player A who reached the score first should rank higher. By default, Redis ZSET breaks score ties **lexicographically by username string**!

#### The Solution: Decimal Timestamp Packing
Encode the inverted timestamp into the fractional component of the 64-bit IEEE double score:

$$\text{Final Score} = \text{Base Score} + \left(1.0 - \frac{\text{Unix Timestamp}}{10^{10}}\right)$$

- *Player A* scores 1,000 at $t = 1,700,000,000$:
  $$\text{Score}_A = 1000 + (1.0 - 0.1700000000) = \mathbf{1000.8300000000}$$
- *Player B* scores 1,000 at $t = 1,700,000,500$ (500 seconds later):
  $$\text{Score}_B = 1000 + (1.0 - 0.1700000500) = \mathbf{1000.8299999500}$$
- $\text{Score}_A > \text{Score}_B$: Player A deterministically ranks ahead without custom tie-break queries!

### Nuance 2: Scaling Beyond a Single Redis Instance
A single Redis ZSET can hold millions of members, but memory capacity and network egress limit throughput.

For massive leaderboards (100 million players):
1. **Score-Range Partitioning**:
   Partition across multiple Redis instances based on score tiers:
   - Node 1: Scores 0 – 999 (Long tail)
   - Node 2: Scores 1,000 – 4,999 (Intermediate)
   - Node 3: Scores 5,000+ (Elite / Top Tier)
2. **Approximate Ranking for the Long Tail**:
   At scale, players only care about their exact rank if they are in the **Top 1,000**. For a player ranked #4,582,104, displaying `"Rank: Top 5%"` using bucketed histogram counters saves massive cluster coordination overhead.

---

## 7. Senior Interview Scenarios

### Q1: How do you determine the optimal number of shards $N$ for a sharded counter?
> **Answer**:
> Sizing $N$ is a balance between **write capacity** and **read latency**:
> $$N = \left\lceil \frac{\text{Peak Write QPS}}{\text{Single Node Max Write Throughput}} \right\rceil \times \text{Headroom Factor (1.5–2.0)}$$
> If peak writes are 300,000 QPS and a single Redis instance safely handles 75,000 QPS, $N = \lceil 300,000 / 75,000 \rceil \times 2 = 8$ shards.
> Avoid over-sharding: setting $N = 100$ when $N = 8$ suffices increases `MGET` packet size and CPU scatter-gather overhead for read requests.

### Q2: Why is a Skip List preferred over a B-Tree or Red-Black Tree in Redis ZSET?
> **Answer**:
> 1. **Memory Efficiency**: Skip lists consume less pointer overhead per node on average than balanced binary search trees.
> 2. **Simpler Range Queries**: The bottom level of a skip list is a continuous sorted singly-linked list, allowing $O(M)$ range streaming (`ZREVRANGE`) once the start node is located in $O(\log N)$.
> 3. **Concurrency & Lock-Free Simplicity**: Balancing trees (AVL / Red-Black) requires complex rotational cascade rebalancing that can touch nodes near the root. Skip list insertions only modify local forward pointers of adjacent nodes, making future concurrent or partitioned implementations significantly simpler.

---

## 8. Advanced Deep Dives: Adaptive Sharding, Write-Behind Batching & ZSET Span Internals

> **References**: [Sujeet Pro — Sharded Counters](https://sujeet.pro/articles/sharded-counters) | [Sujeet Pro — Leaderboard Design](https://sujeet.pro/articles/leaderboard-design)

### 1. Why Single-Row SQL Updates Cap at ~1k–5k Writes/Sec (Physical Engine Truth)
When executing `UPDATE counters SET count = count + 1 WHERE counter_id = 'post_99'` in PostgreSQL or MySQL:
1. **Row-Level Exclusive Lock Serialization (`X-Lock`)**: Even if the server has 64 CPU cores, all concurrent transactions targeting `'post_99'` must serialize sequentially behind a single row lock. If a transaction takes `0.2ms–1ms` (including network round-trip and WAL `fsync` group commit), the physical ceiling for a single row is $\frac{1000\text{ ms}}{0.2\text{ ms}} = \mathbf{1,000\text{ to }5,000\text{ writes/sec}}$.
2. **PostgreSQL MVCC Tuple Bloat**: In PostgreSQL, every `UPDATE` writes a brand-new row version (dead tuple) on the heap page. Updating a single row 5,000 times per second generates **300,000 dead tuples per minute**, causing severe B+Tree and heap bloat before `autovacuum` can reclaim space.

---

### 2. Adaptive Dynamic Shard Splitting & Write-Behind Delta Aggregation

Static sharding (e.g., allocating $N=20$ shards for *every* post in the database) wastes $20\times$ the metadata rows when 99% of posts receive fewer than 10 likes. Production systems combine **Adaptive Dynamic Shard Splitting** with **In-Memory Write-Behind Batching**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               ADAPTIVE SHARD SPLITTING + WRITE-BEHIND DELTA AGGREGATION                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. Cold/Normal Key (QPS < 100/s):                                                     │
│     • Uses N = 1 shard (counter_id:shard_0)                                            │
│                                                                                        │
│  2. Hot-Key Detection (Sliding-Window Count-Min Sketch / Local Rate Tracker):          │
│     • Detects QPS > 1,000/s on 'post_99'                                               │
│     • Dynamically expands shard metadata in ZooKeeper/Redis config: N = 1 ➔ N = 32    │
│     • Writers immediately scatter across post_99:shard_0 .. post_99:shard_31           │
│                                                                                        │
│  3. Two-Tier Write-Behind Aggregation (Coalescing 500k/s into 1 DB Write/s):           │
│     • Tier 1 (App Node Memory): JVM LongAdder (striped 64-bit cells) accumulates       │
│       deltas for 200ms ➔ flushes single INCRBY +4820 to Redis                          │
│     • Tier 2 (Redis to RDBMS/Cassandra): Background worker atomically reads & resets   │
│       delta (GETSET key 0 / Lua script) every 5s ➔ single SQL UPDATE count = count + Δ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Why `LongAdder` Inside the Application Node?
Even in Java memory, a single `AtomicLong.incrementAndGet()` suffers from CPU L1/L3 cache-line bouncing (MESI protocol invalidations) when 64 threads execute `LOCK CMPXCHG` on the same memory address. Java's `LongAdder` automatically stripes contention across an internal `Cell[]` array (padded to avoid false sharing), summing them only when `.sum()` or `.sumThenReset()` is called every 200ms!

---

### 3. Under the Hood of Redis `ZSET`: How `ZREVRANK` Achieves $O(\log N)$ via `span` Pointers

A standard Skip List only allows $O(\log N)$ search by score; finding a node's **ordinal rank** (`#1`, `#4,592`) would normally require walking the bottom linked list in $O(N)$ time! How does Redis compute `ZANK` / `ZREVRANK` in **$O(\log N)$**?

```
Level 3: [HEAD] ─────────────── (span: 5) ───────────────► [Node E: 950] ── (span: 2) ──► NULL
Level 2: [HEAD] ── (span: 2) ──► [Node B: 400] ─(span: 3)─► [Node E: 950] ── (span: 2) ──► NULL
Level 1: [HEAD] ──► [A: 100] ──► [B: 400] ──► [C: 600] ──► [D: 800] ──► [E: 950] ──► [F: 990]
Rank:       0          1            2            3            4            5            6
```

- **The `zskiplistLevel.span` Field**:
  In Redis (`server.h`), every forward pointer at level $k$ of a skip list node stores an unsigned integer **`span`**—the exact number of level-1 nodes skipped over by that pointer.
- **Computing `ZRANK` in $O(\log N)$**:
  As Redis traverses from the top level down toward the target member, it simply **adds the `span` values of every forward pointer it traverses**. By the time it lands on `[Node E: 950]` in $O(\log N)$ hops, the accumulated sum of spans (`2 + 3 = 5`, or `5` directly at Level 3) equals the exact 0-based rank!
- **Precision Caveat with 64-Bit IEEE-754 Double Tie-Breaking**:
  In Redis, `ZSET` scores are 64-bit IEEE-754 floating-point numbers, which have **53 bits of mantissa precision** (exact integers up to $2^{53} - 1 \approx 9.007 \times 10^{15}$).
  - If you bit-pack a 32-bit Unix timestamp ($\approx 10\text{ digits}$) into the lower bits or fractional decimal of the score, you have `53 - 32 = 21 bits` ($\approx 2.09\text{ million}$) of exact integer score headroom before floating-point rounding causes two different timestamps to collide!
  - **When Primary Scores Exceed $2^{21}$**: Either store the inverted timestamp in the **member string** (`score = 1000`, `member = "inv_ts:8299999500:user_42"`) to leverage Redis's native lexicographical tie-breaking on identical scores, or use a custom 64-bit integer skiplist service.

---

### 4. Scaling Leaderboards Past 100M+ Users: Scatter-Gather vs. Score-Range Sharding

When a leaderboard outgrows a single Redis instance's RAM (e.g., 250M users $\times$ 100 bytes $\approx 25\text{ GB}$ plus replication buffer) or write throughput (>100k `ZINCRBY`/sec), there are two primary sharding architectures:

| Sharding Strategy | How `ZINCRBY` (Write) Works | How `ZREVRANGE 0 99` (Top 100) Works | How `ZREVRANK user_x` (Exact Rank) Works | Best Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **1. Hash Partitioning by `user_id` ($K$ Shards)** | **$O(\log(N/K))$ on 1 shard**: Route directly to `Shard[hash(user_id) % K]`. | **Scatter-Gather**: Fetch Top 100 from all $K$ shards and merge-sort in memory on the API gateway ($O(K \log(N/K) + 100K)$). | **Expensive Scatter-Gather**: First lookup `user_x` score on its home shard, then query `ZCOUNT shard_i (score +inf` across all $K$ shards and sum! | High write throughput where Top-K is cached and exact global rank is rarely queried. |
| **2. Score-Range (Tier) Partitioning + Histogram Approximation** | Check user's old score bucket; if new score crosses bucket boundary (e.g. `990 -> 1010`), move from `Bucket_[0..999]` to `Bucket_[1000..4999]` and update bucket total count. | **$O(\log N_{\text{top}})$ on 1 shard**: Top 100 always lives exclusively in the highest score-tier ZSET shard! | **Instant ($O(\log N_{\text{bucket}})$)**: Sum total counts of all higher score buckets + `ZREVRANK` within the user's current score bucket! | Massive global gaming leaderboards (100M+ users) requiring both fast Top-K and fast global rank. |

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Sharded Counters & Leaderboard Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked to *"Design a Real-Time Like Counter for Viral Posts"* or *"Design a Global Gaming Leaderboard for 100M Players"*, immediately establish four physical invariants:
1. **Identify the Contention Boundary (Single-Key Serialization)**:
   - A single SQL row (`UPDATE ... SET count = count + 1`) caps at **~1k–5k writes/sec** due to row-lock queuing and WAL `fsync`. A single Redis key (`INCR` / `ZINCRBY`) caps at **~100k ops/sec** due to single-threaded event-loop serialization. Any design exceeding these numbers *must* distribute writes across shards or batch deltas in memory.
2. **Consistency vs. Latency Trade-Off (PACELC)**:
   - Ask upfront whether the counter requires **Strict Linearizability** (e.g., flash-sale inventory where overselling is forbidden—requiring atomic Lua scripts or partitioned reservation tokens) or **Eventual / Monotonic Read Consistency** (e.g., video views or tweet likes—where 1–3 seconds of write-behind batching and CRDT convergence is ideal).
3. **Exact vs. Probabilistic Cardinality**:
   - Distinguish between counting **events** (`INCRBY` / Sharded Counters) and counting **unique entities** (DAU, unique video viewers). If a user can view a video 50 times but only counts as 1 unique viewer, simple sharded counters fail—you need **HyperLogLog (`PFADD`, 12 KB per key, 0.81% error)** paired with a deduplication Bloom Filter or Kafka stream processor.
4. **Data Structure Mechanical Sympathy**:
   - Explain *why* Redis `ZSET` achieves $O(\log N)$ for **both** range queries and rank lookups (`HashMap` for $O(1)$ member-to-score lookup + **Skip List with level `span` counters** for $O(\log N)$ rank summation).

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "To prevent a user from liking a post twice, we just increment our sharded counter when they click Like. What if their network retries the POST request?"
* **Junior/Mid Answer:** "We can check `SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?` before incrementing the sharded counter."
* **Principal Rebuttal:** "A non-atomic check-then-increment (`SELECT` then `INCR`) suffers from a classic Time-of-Check to Time-of-Use (**TOCTOU**) race condition under concurrent retries, resulting in double-counts. Worse, sharded counters (`INCR post:99:shard_3`) are **non-idempotent** by themselves. To guarantee idempotent counting:
  1. Write the deduplication record `(post_id, user_id)` to a partitioned primary store (e.g., Cassandra/DynamoDB or sharded PostgreSQL with `INSERT ... ON CONFLICT DO NOTHING`).
  2. Only if the insert returns `inserted = true` (or via a **Change Data Capture (CDC) / Kafka stream** off the likes table) do we increment the sharded counter or local `LongAdder` write-behind buffer."

#### Trap 2: "We packed `score + (1 - timestamp / 10^10)` into a Redis ZSET float score so earlier players win ties. In our game, players can earn up to 100,000,000 points. Does your tie-breaker work?"
* **Junior/Mid Answer:** "Yes, Redis scores are 64-bit doubles (`double`), which can store huge numbers up to $10^{308}$, so `100,000,000.8300000000` fits easily."
* **Principal Rebuttal:** "While a 64-bit IEEE-754 `double` has a massive *exponent* range ($10^{308}$), it only has **53 bits of mantissa (significand) precision**—which translates to **15 to 17 significant decimal digits total**!
  - If the integer part of the score is `100,000,000` ($8\text{ digits}$, $\approx 27\text{ bits}$), and the Unix timestamp in seconds/milliseconds needs $10\text{ to }13\text{ digits}$ ($32\text{ to }43\text{ bits}$), $27 + 32 = 59\text{ bits} > 53\text{ bits}$!
  - The lowest bits of the timestamp are silently truncated by IEEE-754 floating-point rounding, destroying tie-breaker determinism!
  **The Principal Fix**: Keep the Redis ZSET `score` as the pure integer score (which is exact up to $2^{53} \approx 9\text{ quadrillion}$), or pack into a 64-bit integer where `30 bits` = score (up to 1B) and `34 bits` = epoch seconds delta; alternatively, leverage Redis ZSET's native **lexicographical member tie-breaking** by prefixing the member key with the zero-padded inverted timestamp."

#### Trap 3: "How does `ZREVRANK` find that a player is ranked #842,109 out of 10,000,000 players in 0.1 milliseconds without counting 842,109 nodes?"
* **Junior/Mid Answer:** "Redis uses a Skip List, so it binary-searches the list in $O(\log N)$ time to find the player's node."
* **Principal Rebuttal:** "Finding the node in a standard Skip List or B-Tree takes $O(\log N)$, but knowing *which node* you landed on doesn't tell you how many nodes precede it unless the structure is an **Order-Statistic Tree / Augmented Skip List**! Redis augments every forward pointer at every level of the Skip List with a **`span` counter** recording how many bottom-level nodes that pointer jumps over. During the $O(\log N)$ top-down search path (~20 pointer hops for 10M items), Redis sums the `span` of every traversed edge to compute the exact rank `#842,109` in ~20 integer additions."

#### Trap 4: "We need to display exact unique view counts on 50 million YouTube videos. Should we use HyperLogLog for every video?"
* **Junior/Mid Answer:** "Yes! HyperLogLog uses only 12 KB per video regardless of how many millions of views it gets."
* **Principal Rebuttal:** "Multiply `12 KB × 50,000,000 videos`—that's **600 GB of RAM** even if 95% of those videos only have 5 views! A naive dense HLL allocation wastes massive memory on the long tail. Redis solves this internally via **Hybrid Sparse-to-Dense HLL Encoding** (and we should mirror this in system design):
  1. For low-cardinality keys (`< ~3,000` unique viewers), use an exact or sparse run-length encoded representation (`hl_sparse_max_bytes`, taking only `100–500 bytes`).
  2. Automatically promote the key to a dense `12 KB` 16,384-register HLL only when cardinality crosses the threshold."

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Hot-Key Counter Writes** | "Use `UPDATE counters SET v = v + 1` or a single Redis `INCR` key." | "Use **Adaptive Dynamic Sharded Counters (`shard_0..N-1`)** + in-memory `LongAdder` write-behind batching to coalesce 500k/s increments into periodic delta flushes." |
| **Multi-Region Counting** | "Replicate increments across regions with last-write-wins (LWW)." | "LWW drops concurrent increments! Use **State-based CRDT PN-Counters** ($P$ and $N$ per-datacenter vectors merged via element-wise `max()`)." |
| **Unique Visitor Counting** | "Store `user_id` in a Redis `SET` and call `SCARD`." | "Use **HyperLogLog (`PFADD`/`PFCOUNT`)** with sparse-to-dense representation (`12 KB` max, `0.81%` standard error) + `PFMERGE` for daily-to-monthly rollups." |
| **ZSET Rank Internals** | "Redis ZSET uses a Skip List to find rank in $O(\log N)$." | "Redis ZSET pairs a **Hash Table** ($O(1)$ `ZSCORE`) with an **Augmented Skip List carrying `span` counts** on forward pointers to accumulate rank in $O(\log N)$." |
| **100M+ User Leaderboard** | "Put all 100M users in one Redis ZSET and pack timestamp into a float." | "Guard against **IEEE-754 53-bit mantissa truncation**; scale past 1 node via **Score-Tier Range Partitioning** (exact ZSET for Top Tiers + bucketed histograms for the long tail)." |

---

### Compare Next
- [Caching Fundamentals & Strategies](./caching-strategies.md)
- [Rate Limiting Algorithms](./rate-limiting-algorithms.md)
- [Time, Ordering & Unique IDs](./time-and-ordering-and-unique-ids.md)
