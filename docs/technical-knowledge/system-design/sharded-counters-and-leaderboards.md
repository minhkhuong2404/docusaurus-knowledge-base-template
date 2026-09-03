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

### Compare Next
- [Caching Fundamentals & Strategies](./caching-strategies.md)
- [Rate Limiting Algorithms](./rate-limiting-algorithms.md)
- [Time, Ordering & Unique IDs](./time-and-ordering-and-unique-ids.md)
