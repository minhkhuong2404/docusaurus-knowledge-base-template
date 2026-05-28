---
id: sharding-partitioning
title: Database Sharding & Partitioning
sidebar_label: Sharding & Partitioning
description: A complete guide to horizontal scaling — sharding strategies, consistent hashing, cross-shard complexities, rebalancing, distributed ID generation, and real-world database comparisons.
tags: [database, sharding, partitioning, scaling, consistent-hashing, distributed-systems, snowflake-id, rebalancing]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Database Sharding & Partitioning

:::info Who this guide is for
- **New learners** — start at [Why Shard?](#why-shard) and [Sharding Strategies](#sharding-strategies) to understand the core concepts.
- **Senior engineers** — jump to [Consistent Hashing deep dive](#consistent-hashing), [Cross-Shard Problems](#cross-shard-problems), [Rebalancing](#rebalancing-strategies), or [Real-World Database Comparison](#real-world-database-comparison).
:::

---

## What is Partitioning?

**Partitioning** splits a large dataset into smaller, more manageable pieces. There are two fundamentally different ways to split:

### Vertical partitioning

Split a table **by columns**. Move rarely-accessed or large fields into a separate table while keeping hot fields together.

```
Before (one wide table):
┌─────────┬──────────┬───────┬─────────────────────┬──────────────┐
│ user_id │ username │ email │ profile_bio (TEXT)  │ avatar_blob  │
└─────────┴──────────┴───────┴─────────────────────┴──────────────┘

After (vertical split):
┌─────────┬──────────┬───────┐    ┌─────────┬──────────────────────┐
│ user_id │ username │ email │    │ user_id │ profile_bio, avatar  │
└─────────┴──────────┴───────┘    └─────────┴──────────────────────┘
  Hot table (queried every login)    Cold table (queried on profile view)
```

**When to use it:** when a small number of columns are accessed in 95% of queries and the rest inflate the row size, bloating cache and increasing I/O.

### Horizontal partitioning (sharding)

Split a table **by rows**. Different subsets of rows live on entirely different database servers.

```
Before: one table with 100M rows on one server

After (sharded by user_id):
Shard A  ─── rows where user_id % 3 = 0   (≈33M rows)
Shard B  ─── rows where user_id % 3 = 1   (≈33M rows)
Shard C  ─── rows where user_id % 3 = 2   (≈33M rows)
```

**When we say "sharding" in system design, we almost always mean horizontal partitioning.** The rest of this guide focuses on it.

---

## Why Shard?

A single database server has hard physical limits. Understanding *which* limit you're hitting determines the right solution:

| Bottleneck | Symptom | First-line solution | When you need sharding |
|-----------|---------|-------------------|----------------------|
| **Read load** | Slow SELECTs, high CPU on reads | Add read replicas | When even read replicas can't absorb the fan-out |
| **Write throughput** | Replication lag, high disk I/O | Tune indexes, batch writes | When write IOPS saturate the primary's disk |
| **Dataset size** | Disk full, slow full-table scans | Archival, compression | When data exceeds one server's storage capacity |
| **RAM (working set)** | High disk reads, cache miss rate rising | Bigger instance | When the working set no longer fits in memory |

:::tip Exhaust simpler options first
Before sharding, try in this order: **query tuning → indexes → vertical scaling → read replicas → caching (Redis)**. Sharding adds enormous operational complexity. It should be a last resort, not a first instinct.
:::

### Concrete thresholds to consider sharding

- Table rows exceeding **500M–1B** and growing fast
- Write throughput exceeding **~10K writes/sec** sustained on a single primary
- Dataset exceeding **2–4 TB** (point where even SSDs become expensive and slow)
- P99 write latency increasing despite hardware upgrades

---

## Sharding Strategies

Choosing a routing algorithm is the most important decision in your sharding design. Each strategy makes a different trade-off between **write distribution**, **range query efficiency**, and **rebalancing cost**.

### 1. Range partitioning

Divide data into continuous ranges of the shard key. Each shard owns a contiguous slice.

```
Shard 1:  user_id   1 – 10,000,000
Shard 2:  user_id   10,000,001 – 20,000,000
Shard 3:  user_id   20,000,001 – 30,000,000
```

```sql
-- PostgreSQL declarative range partition
CREATE TABLE orders (
    id        BIGSERIAL,
    user_id   BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    total     NUMERIC(12,2)
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
```

**Pros:**
- Range queries are extremely efficient — `WHERE user_id BETWEEN 100 AND 500` touches exactly one shard.
- Contiguous scans for reporting and archival are fast.
- Easy to reason about which shard holds which data.

**Cons:**
- High risk of **hot spots** (see below). Sharding by `created_at` or auto-increment means all new writes always go to the last shard.
- Uneven data distribution if the key is not uniformly spread.

:::danger The hot spot problem with range partitioning
If you shard by `timestamp` or a monotonically increasing ID:

```
t=0:  Shard 1 ← all writes (idle: Shard 2, 3)
t=1:  Shard 2 ← all writes (idle: Shard 1, 3)
t=2:  Shard 3 ← all writes (idle: Shard 1, 2)
```

You've bought yourself horizontal hardware but not horizontal write throughput. The active shard is always the bottleneck. **Mitigations:** add a random prefix to the key, shard by a different key (e.g. `user_id` instead of `order_time`), or use consistent hashing.
:::

---

### 2. Hash partitioning

Apply a hash function to the shard key and use modulo to assign a shard:

```
shard_id = hash(user_id) % num_shards

hash("user_1001") % 3 = 0  → Shard A
hash("user_1002") % 3 = 2  → Shard C
hash("user_1003") % 3 = 1  → Shard B
```

**Pros:**
- Even data distribution — hash functions spread keys uniformly, eliminating hot spots.
- Simple to implement and reason about.

**Cons:**
- **Range queries become scatter-gather operations.** `user_id BETWEEN 1 AND 1000` hits all shards because adjacent keys hash to different shards.
- **Rebalancing is catastrophic.** Adding a shard changes `num_shards` from N to N+1, so `hash(key) % (N+1)` gives a different result for almost every key. Nearly 100% of data must migrate.

```
3 shards → 4 shards:
key "abc":  hash % 3 = 1 (was Shard B)  →  hash % 4 = 3 (now Shard D)
key "xyz":  hash % 3 = 0 (was Shard A)  →  hash % 4 = 1 (now Shard B)
... virtually every key must move
```

This is the fundamental weakness that **consistent hashing** was designed to solve.

---

### 3. Consistent hashing

Rather than modulo arithmetic, both keys and nodes are mapped onto a **virtual ring** from `0` to `2³²−1`. A key is owned by the first node clockwise from its hash position.

```
                 0
           ┌─────┴─────┐
     N3    │           │   N1
   (75%)   │           │  (25%)
           │   RING    │
           │           │
           └─────┬─────┘
                 N2
                (50%)

Key hash=10%  → clockwise → N1  ✅
Key hash=40%  → clockwise → N2  ✅
Key hash=60%  → clockwise → N3  ✅
```

**Adding a node:** only the keys between the new node and its predecessor on the ring need to move. ~1/N keys migrate instead of ~100%.

```
Before (3 nodes):
Ring: N1(25%) ── N2(50%) ── N3(75%) ── N1...

After adding N4 at position 60%:
Ring: N1(25%) ── N2(50%) ── N4(60%) ── N3(75%) ── N1...

Only keys between 50%–60% move from N3 to N4.
Everything else stays put.
```

**Removing a node (failure or decommission):** only that node's keys move to its successor. All other nodes are unaffected.

**Pros:**
- Minimal data movement on topology changes (~1/N keys migrate).
- Naturally supports heterogeneous nodes via virtual nodes.
- No single point of failure — ring is fully decentralised.

**Cons:**
- Basic consistent hashing can still produce uneven distribution if nodes land unluckily on the ring.
- More complex to implement than modulo hashing.
- Non-uniform load is solved with virtual nodes (see senior section below).

---

### 4. Directory / lookup service

A central routing table (sometimes called a **shard map**) explicitly records where each key or key range lives:

```
email → user_id (mapping table)
user_id range → shard_id
shard_id → host:port
```

**Pros:**
- Maximum flexibility — you can manually move individual hot tenants to dedicated hardware.
- Supports complex routing logic (geo-based, tier-based).
- Shard rebalancing requires only updating the directory, not rehashing.

**Cons:**
- Central directory is a **single point of failure** (mitigate with replication + caching).
- Adds a **network hop** to every query.
- Directory can become stale — cache invalidation is a hard problem.

---

### Strategy comparison

| | Range | Hash modulo | Consistent hash | Directory |
|--|-------|------------|----------------|-----------|
| **Range queries** | ✅ Efficient (single shard) | ❌ Scatter-gather | ❌ Scatter-gather | ✅ If mapped |
| **Write distribution** | ❌ Hot spots (monotonic keys) | ✅ Even | ✅ Even | ✅ Flexible |
| **Rebalancing cost** | 🟡 Migrate range | ❌ Migrate ~100% | ✅ Migrate ~1/N | ✅ Update table |
| **Complexity** | Low | Low | Medium | High |
| **Used by** | PostgreSQL, MySQL, Cassandra | Redis Cluster (basic) | Cassandra, DynamoDB, Riak | Vitess, some custom systems |

---

## Consistent Hashing — Deep Dive

### Virtual nodes (vnodes)

Basic consistent hashing with one point per physical node produces uneven distribution — nodes land at random positions and some get much larger arcs than others.

The solution: each physical node claims **multiple positions** on the ring (virtual nodes). A cluster with 3 servers and 150 vnodes per server has 450 points on the ring, producing near-uniform distribution.

```
Physical servers: S1, S2, S3
Virtual nodes: S1_1, S1_2, ..., S1_150,
               S2_1, S2_2, ..., S2_150,
               S3_1, S3_2, ..., S3_150

Ring positions (sorted):
... S3_72 ── S1_14 ── S2_91 ── S3_4 ── S1_88 ...
         ↑               ↑
   (key A → S1_14)   (key B → S2_91)
```

**Benefits of vnodes:**
- Even load distribution regardless of how many nodes join or leave.
- A more powerful server can be given more vnodes to handle a proportionally larger share.
- When a node fails, its vnodes are spread across many other nodes, distributing the recovery load instead of dumping everything on one neighbour.

**Used by:** Cassandra (default 256 vnodes/node), DynamoDB internally, Riak.

### Replication with consistent hashing

In production, keys are not stored on just one node. They are replicated to the next N nodes clockwise on the ring (the **replication factor**):

```
Replication factor = 3:
Key → primary node → replica 1 (next clockwise) → replica 2 (next after that)
```

This means every piece of data survives the loss of up to N-1 nodes in its replica group.

---

## Cross-Shard Problems

Sharding is not free. It introduces a category of distributed systems problems that don't exist on a single server.

### Cross-shard JOINs

SQL JOINs assume data lives in the same process. When tables are split across servers, you can't do a SQL JOIN across shards.

```sql
-- Works on a single DB:
SELECT u.name, o.total
FROM users u JOIN orders o ON u.id = o.user_id
WHERE u.country = 'VN';

-- With sharding: users and orders may be on different shards.
-- This JOIN is impossible at the DB layer.
```

**Solutions:**

<Tabs>
  <TabItem value="collocate" label="Co-locate data (preferred)">

Design your shard key so related entities always land on the same shard. If you shard `users` and `orders` both by `user_id`, all of Alice's data is on the same shard:

```
Shard A: users where user_id % 3 = 0
         orders where user_id % 3 = 0
→ JOIN between Alice's user row and Alice's orders never crosses a shard
```

  </TabItem>
  <TabItem value="denormalize" label="Denormalize">

Duplicate the fields you need into the child record so you don't need the JOIN at all:

```json
// Orders document includes user snapshot — no JOIN needed
{
  "order_id": "ORD-001",
  "user_id": "alice",
  "user_name": "Alice Tran",   // duplicated
  "user_email": "alice@...",   // duplicated
  "total": 99.90
}
```

Trade-off: update complexity — if the user's email changes, all their orders must be updated too.

  </TabItem>
  <TabItem value="app-layer" label="Application-layer JOIN">

Fetch data from each shard separately and join in application code (API Composition pattern):

```python
# Step 1: query shard determined by user_id
user = shard_for(user_id).query("SELECT * FROM users WHERE id = ?", user_id)

# Step 2: query shard determined by user_id (same shard if co-located)
orders = shard_for(user_id).query("SELECT * FROM orders WHERE user_id = ?", user_id)

# Step 3: join in application code
result = { **user, "orders": orders }
```

This works but is slower than a native SQL JOIN and harder to express complex join conditions.

  </TabItem>
</Tabs>

---

### Global transactions (distributed ACID)

A transaction that touches data on multiple shards cannot use standard ACID guarantees without a distributed coordination protocol.

```
Transfer $100 from Alice (Shard A) to Bob (Shard B):

Step 1: Debit Alice on Shard A  ✅
Step 2: Credit Bob on Shard B   ❌ (Shard B crashes)

Result: Alice lost $100, Bob received nothing → inconsistency
```

**Solutions:**

| Approach | How it works | Trade-offs |
|---------|-------------|-----------|
| **Two-Phase Commit (2PC)** | Coordinator asks all shards to "prepare", then commits if all agree. | Synchronous, slow, coordinator is a SPOF. Blocks if coordinator crashes mid-transaction. |
| **Saga pattern** | Break transaction into a sequence of local transactions. Each step publishes an event. Compensating transactions undo steps on failure. | Eventual consistency, complex to implement, no atomicity guarantee. |
| **Avoid cross-shard writes** | Design data model so all writes for a logical operation touch one shard only (co-location). | Best option when achievable — zero coordination cost. |
| **Optimistic locking + reconciliation** | Allow eventual inconsistency; detect and reconcile conflicts later. | Works for some use cases (analytics); unacceptable for money. |

:::tip The best solution is avoiding the problem
If you find yourself writing a lot of cross-shard transactions, your shard key is probably wrong. Revisit whether a different key can co-locate the data that is written together.
:::

---

### Unique ID generation

Auto-incrementing primary keys (`AUTO_INCREMENT`, `SERIAL`) don't work across isolated shards — each shard would generate its own `id=1`, `id=2`, creating duplicates when merged.

**Solutions:**

<Tabs>
  <TabItem value="uuid" label="UUID v4 / v7">

```python
import uuid
id = uuid.uuid4()   # e.g. "550e8400-e29b-41d4-a716-446655440000"
```

**UUID v4:** random 128-bit — globally unique, but not sortable. Causes random index insertions, defeating B-tree locality.

**UUID v7:** timestamp-prefixed — globally unique AND sortable by creation time. Preferred over v4 for database IDs.

  </TabItem>
  <TabItem value="snowflake" label="Snowflake ID (recommended)">

Originated at Twitter. A 64-bit integer composed of:

```
| 41 bits timestamp (ms) | 10 bits machine/datacenter ID | 12 bits sequence |
```

```python
# Rough implementation concept
def snowflake_id(machine_id: int, sequence: int) -> int:
    timestamp_ms = current_time_ms() - EPOCH_MS
    return (timestamp_ms << 22) | (machine_id << 12) | sequence
    # sequence resets every ms; 4096 IDs/ms per machine
```

**Properties:**
- Globally unique without coordination between shards.
- Roughly time-sortable (IDs increase over time).
- Fits in a 64-bit integer — efficient for indexes.
- 4096 IDs per millisecond per machine (12-bit sequence), 1024 machines (10-bit machine ID).

**Used by:** Twitter, Discord, Instagram (variant), Mastodon.

  </TabItem>
  <TabItem value="ulid" label="ULID">

ULID (Universally Unique Lexicographically Sortable Identifier) — a 128-bit ID that is URL-safe and sortable:

```
01ARZ3NDEKTSV4RRFFQ69G5FAV
├──────────┤├────────────────┤
 timestamp      randomness
 (48 bits)      (80 bits)
```

Similar to UUID v7 in concept. Sortable as a string. Useful when string IDs are preferred over integers.

  </TabItem>
  <TabItem value="composite" label="Composite key">

```sql
-- shard_id is part of the primary key, ensuring global uniqueness
CREATE TABLE users (
    shard_id   SMALLINT NOT NULL,   -- e.g. 0–255
    local_id   BIGSERIAL,           -- auto-increment within this shard
    PRIMARY KEY (shard_id, local_id)
);
```

Simple but couples the ID to the shard — makes resharding harder.

  </TabItem>
</Tabs>

---

### Scatter-gather queries (no shard key in filter)

When a query doesn't include the shard key in its `WHERE` clause, the router has no choice but to send it to all shards and merge the results:

```sql
-- Shard key is user_id. This query has no user_id:
SELECT * FROM users WHERE email = 'alice@example.com';
-- → sent to ALL shards, results merged, sorted, returned
```

This is called a **scatter-gather** or **fan-out** query. At 10 shards it's 10x overhead. At 100 shards it's 100x.

**Solutions:**

| Solution | Description | Trade-off |
|---------|-------------|-----------|
| **Global secondary index** | Maintain a separate index table mapping non-key attributes to shard keys | Extra write on every insert/update; index must be highly available |
| **Mapping table in Redis** | `email → user_id` stored in Redis; look up user_id first, then query correct shard | Extra network hop; cache invalidation |
| **Dual-write to a search index** | Write to both your DB and Elasticsearch on every mutation | Eventual consistency; more complex writes |
| **Covering shard key** | Choose a shard key that appears in all hot query patterns (e.g. `tenant_id` in a SaaS app) | May not be possible for all queries |

---

## Rebalancing Strategies

When your cluster grows (adding nodes) or shrinks (node failure, decommission), data must be redistributed. How you do this determines downtime and migration cost.

### Manual rebalancing

An operator explicitly decides which partitions to move and executes the migration. The system makes no automatic decisions.

- **Pro:** full operator control, no surprise data movements.
- **Con:** tedious and error-prone at scale; requires careful sequencing.

Used by: MongoDB (manual chunk migration via `moveChunk`).

### Automatic rebalancing

The system continuously monitors shard load and migrates partitions in the background when imbalance is detected.

```
Cassandra:
  → monitors each vnode's data volume
  → auto-streams data to new nodes when they join
  → background streaming, no downtime

DynamoDB:
  → fully managed; partitions split/merge transparently
  → no operator involvement required
```

- **Pro:** hands-off operation; reacts to organic growth.
- **Con:** background migrations consume I/O; can degrade query performance during rebalancing.

### Fixed partition count

Instead of changing the number of partitions when nodes change, use a large fixed number of partitions (e.g. 1000) and redistribute ownership of those partitions to nodes:

```
1000 fixed partitions, 3 nodes:
  Node A → partitions 0–332
  Node B → partitions 333–666
  Node C → partitions 667–999

Adding Node D:
  Node A → partitions 0–249  (moved 83 partitions to D)
  Node B → partitions 333–582 (moved 84 partitions to D)
  Node C → partitions 667–916 (moved 83 partitions to D)
  Node D → partitions 250–332, 583–666, 917–999
```

Only metadata (partition→node mapping) changes; the partitions themselves remain stable. Used by **Elasticsearch** (fixed primary shards).

:::warning You can't change the number of primary shards in Elasticsearch after index creation
This is why choosing the right initial shard count matters so much. Rule of thumb: aim for shards of 10–50 GB each. For a 500 GB index, 10–50 shards is reasonable.
:::

---

## Scatter-Gather vs. Co-located Queries

Understanding when queries cross shards is essential for performance planning:

```
Co-located query (best case):
Client → Router → Shard A   ← all data here
                    ↓
                  Result
Latency: 1 network hop

Scatter-gather query (worst case):
Client → Router → Shard A ─┐
                → Shard B ─┤→ Merge & sort → Result
                → Shard C ─┘
Latency: 1 hop + merge time + slowest shard's response
```

Real latency impact: at P50 scatter-gather is ~3x slower; at P99 it's often 10–20x slower because you wait for the slowest shard (the "long tail" problem).

---

## Real-World Database Comparison

<Tabs>
  <TabItem value="cassandra" label="Cassandra">

**Strategy:** Consistent hashing with vnodes (default 256 per node).

**Shard key:** The **partition key** in the `PRIMARY KEY` definition.

```sql
CREATE TABLE orders_by_user (
    user_id    UUID,
    created_at TIMESTAMP,
    order_id   UUID,
    total      DECIMAL,
    PRIMARY KEY ((user_id), created_at, order_id)
    --           ^^^^^^^^^
    --           partition key → determines shard
    --           created_at, order_id → clustering keys (sort within shard)
) WITH CLUSTERING ORDER BY (created_at DESC);
```

**Rebalancing:** Automatic streaming when nodes join or leave. New nodes bootstrap data from neighbours.

**Cross-shard JOINs:** Not supported. You must denormalise into query-specific tables.

  </TabItem>
  <TabItem value="dynamodb" label="DynamoDB">

**Strategy:** Consistent hashing, fully managed and invisible to the user.

**Shard key:** The **Partition Key** (PK) of your table's primary key.

```python
# Table: partition key = user_id, sort key = created_at
# DynamoDB routes all items with the same user_id to the same partition
table.put_item(Item={
    'user_id': 'alice',       # partition key → determines shard
    'created_at': '2024-01-15T09:00:00Z',  # sort key → orders within shard
    'total': Decimal('99.90')
})
```

**Adaptive capacity:** DynamoDB automatically isolates hot partitions, borrowing unused capacity from cold ones.

**Hot key problem:** A single partition can handle ~3000 RCU/s and 1000 WCU/s. If one user_id generates more traffic than this, it becomes a hot partition regardless of consistent hashing.

**Mitigation:** Add a random suffix to the partition key (write amplification), use `user_id#shard_suffix` where suffix = `hash(timestamp) % 8`.

  </TabItem>
  <TabItem value="mongodb" label="MongoDB">

**Strategy:** Range-based or hashed sharding, operator-chosen per collection.

```js
// Enable sharding on a collection
sh.enableSharding("ecommerce")

// Hashed shard key — even distribution, no range queries
sh.shardCollection("ecommerce.orders", { user_id: "hashed" })

// Range shard key — efficient range queries per user
sh.shardCollection("ecommerce.orders", { user_id: 1, created_at: 1 })
```

**Routing:** A `mongos` router process consults the **config servers** (shard map) and routes each query. Multi-shard queries are aggregated by mongos.

**Rebalancing:** Semi-automatic. MongoDB auto-migrates chunks in the background but operators can also trigger `moveChunk` manually. Each collection is split into fixed-size **chunks** (default 128 MB).

  </TabItem>
  <TabItem value="postgres" label="PostgreSQL">

**Built-in declarative partitioning** (single-server, no routing layer):

```sql
-- Hash partitioning (PostgreSQL 11+)
CREATE TABLE users (
    user_id BIGINT,
    name    TEXT,
    email   TEXT
) PARTITION BY HASH (user_id);

CREATE TABLE users_p0 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE users_p1 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE users_p2 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE users_p3 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

For **multi-server sharding**, PostgreSQL requires an extension: **Citus** (now part of Azure) distributes partitions across worker nodes and adds a coordinator that rewrites queries.

```sql
-- With Citus extension
SELECT create_distributed_table('orders', 'user_id');
-- Citus shards the table across worker nodes by user_id
```

  </TabItem>
  <TabItem value="vitess" label="Vitess / MySQL">

**Vitess** is the sharding layer built at YouTube that sits in front of MySQL. It is the basis of PlanetScale.

**Strategy:** Range-based sharding with a **VSchema** (virtual schema) that defines which columns are shard keys.

```json
{
  "sharded": true,
  "vindexes": {
    "user_id_vindex": {
      "type": "hash"
    }
  },
  "tables": {
    "users": {
      "column_vindexes": [{ "column": "user_id", "name": "user_id_vindex" }]
    }
  }
}
```

Vitess handles cross-shard scatter-gather queries, online schema changes (without locking), and connection pooling. Used by YouTube, Slack, GitHub, Shopify.

  </TabItem>
</Tabs>

---

## Sharding in SQL Databases — Patterns

### PostgreSQL: list partitioning

Useful when the partition key is categorical (e.g. region, status):

```sql
CREATE TABLE orders (
    id         BIGSERIAL,
    region     TEXT NOT NULL,
    total      NUMERIC(12,2)
) PARTITION BY LIST (region);

CREATE TABLE orders_apac PARTITION OF orders
    FOR VALUES IN ('VN', 'SG', 'TH', 'PH', 'ID');

CREATE TABLE orders_emea PARTITION OF orders
    FOR VALUES IN ('DE', 'FR', 'GB', 'NL');

CREATE TABLE orders_amer PARTITION OF orders
    FOR VALUES IN ('US', 'CA', 'BR', 'MX');
```

### Partition pruning

When the `WHERE` clause includes the partition key, PostgreSQL eliminates irrelevant partitions from the query plan — only scanning the partitions that could contain matching rows:

```sql
EXPLAIN SELECT * FROM orders WHERE region = 'VN' AND total > 1000;
-- → Seq Scan on orders_apac  (partition pruning eliminates orders_emea, orders_amer)
```

### Sub-partitioning (composite)

Partitions can themselves be partitioned — range by year, then hash within the year:

```sql
CREATE TABLE events (
    id         BIGSERIAL,
    created_at DATE NOT NULL,
    user_id    BIGINT NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')
    PARTITION BY HASH (user_id);  -- sub-partition by user

CREATE TABLE events_2024_p0 PARTITION OF events_2024
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
-- ... p1, p2, p3
```

---

## Monitoring a Sharded Cluster

A sharded system introduces failure modes that don't exist on single-server databases. These are the key signals to watch:

| Metric | What it reveals | Alert threshold (example) |
|--------|----------------|--------------------------|
| **Shard data size variance** | Uneven distribution — one shard getting all writes | >20% deviation from mean |
| **Replication lag per shard** | A replica is falling behind; stale reads possible | >30 seconds |
| **Scatter-gather query ratio** | % of queries without shard key — cross-shard overhead | >5% of query volume |
| **P99 cross-shard query latency** | Long-tail queries from multi-shard fan-out | >1 second |
| **Chunk migration rate** (MongoDB) | Background rebalancing consuming I/O | Monitor spikes during business hours |
| **Hot partition rate** (DynamoDB) | One partition key receiving disproportionate traffic | Throttled requests per partition |

---

## 🎯 Interview Questions

### For new learners

**Q: What is the difference between replication and sharding?**
> **Replication** copies the *same* data to multiple nodes to improve read scalability and high availability (fault tolerance). **Sharding** splits *different* data across multiple nodes to improve write scalability and handle datasets too large for one disk. They are almost always used together: a distributed database will have multiple shards, and each shard will have multiple replicas.

**Q: What is a hot spot in sharding, and how do you prevent it?**
> A hot spot occurs when one shard receives disproportionately more traffic than others. The most common cause is choosing a monotonically increasing shard key (timestamp, auto-increment ID) — all new writes always go to the "latest" shard. Mitigations: choose a high-cardinality, randomly distributed shard key (like `user_id`), use hash partitioning, or add a random salt prefix to the key at the cost of scatter-gather on reads.

**Q: When should you NOT shard?**
> When simpler alternatives can solve the problem: query tuning, adding indexes, vertical scaling (bigger server), adding read replicas, or in-memory caching. Sharding adds massive operational complexity — cross-shard JOINs, distributed transactions, complex deployments, harder debugging. Only shard when you've genuinely exhausted the alternatives and benchmarks confirm the bottleneck.

---

### For senior engineers

**Q: Why is hash modulo (`hash(key) % N`) a bad strategy for dynamically scaling a database?**
> When you add one shard (N becomes N+1), the modulo result changes for nearly every key — `hash(key) % N` and `hash(key) % (N+1)` rarely agree. This means close to 100% of data must migrate across the network to restore consistency. For a 10 TB dataset, this is a near-total reshuffle with massive I/O and potential downtime. Consistent hashing solves this by only requiring ~1/N of data to migrate when adding one node.

**Q: How do virtual nodes (vnodes) improve consistent hashing?**
> Basic consistent hashing places one point per physical node on the ring. With three nodes, one might get a 40% arc, another 35%, another 25% — uneven load. Virtual nodes assign each physical node 100–300 positions on the ring, producing near-uniform distribution. Additionally: a stronger server can be given more vnodes to carry a larger share; when a node fails, its vnodes scatter to many different neighbours, distributing recovery load instead of overloading one node.

**Q: You shard `users` by `user_id`. A user logs in with only their `email`. How do you find the right shard?**
> `email` is not the shard key, so the router doesn't know which shard to query. Two approaches: (1) **Scatter-gather** — send the query to all shards and merge results. Works but is O(shards) in cost and unacceptable at scale. (2) **Mapping table** — maintain a high-availability lookup (e.g. Redis or a small dedicated DB) that maps `email → user_id`. Every login first queries the mapping table to get `user_id`, then routes to the correct shard. The mapping table is tiny (just email + user_id) and can be replicated globally for low latency.

**Q: How does the Saga pattern replace distributed transactions in a sharded system?**
> A Saga breaks a cross-shard operation into a sequence of local transactions, each publishing a domain event on completion. Downstream services listen and execute their step. If any step fails, **compensating transactions** run in reverse order to undo completed steps (e.g. refund a payment if inventory reservation fails). The key difference from 2PC: Saga is asynchronous and eventually consistent — there is a window where the system is partially updated. This is acceptable for many business workflows (order fulfilment) but not for hard financial consistency (bank transfers).

**Q: A DynamoDB table's `user_id` partition is throttled because one user generates 10x the normal traffic. How do you fix it?**
> The hot partition problem. Options: (1) **Write sharding** — append a random suffix (`user_id#0` through `user_id#7`) to distribute writes across 8 partitions, then scatter-gather on reads and aggregate. (2) **Caching** — put a Redis cache in front for read-heavy hot users. (3) **DAX** (DynamoDB Accelerator) — AWS in-memory cache for DynamoDB, microsecond reads for hot keys. (4) **Data model redesign** — if this user's data is always accessed differently from others, consider a separate table or a different access pattern that doesn't funnel through one partition.

**Q: Walk through how Cassandra rebalances data when a new node joins.**
> When a new node joins, it announces itself to the ring with a chosen token (or multiple tokens if using vnodes). Cassandra's gossip protocol propagates its existence to the cluster. The node then streams its responsible token ranges from its neighbours — specifically, it takes ownership of its vnodes' key ranges, and the previous owners stream the corresponding data to it. Read and write traffic gradually shifts to the new node as the ring topology updates. The process is online — the cluster continues serving traffic throughout. Once streaming completes, the operator can `nodetool cleanup` on the previous owners to reclaim disk space from keys that are no longer their responsibility.

---

## See Also

- [NoSQL & MongoDB — Complete Guide](./nosql-mongodb.mdx)
- [Replication & High Availability](./replication-ha.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [CAP Theorem & Consistency Models](./cap-consistency.md)