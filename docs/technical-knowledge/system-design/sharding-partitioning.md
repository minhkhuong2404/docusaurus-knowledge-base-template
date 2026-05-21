---
id: sharding-partitioning
title: Database Sharding & Partitioning
sidebar_label: Sharding & Partitioning
description: A deep dive into horizontal scaling, sharding strategies (Hash, Range, Consistent Hashing), and managing cross-shard complexities in distributed databases.
tags: [database, sharding, partitioning, scaling, consistent-hashing, distributed-systems]
---

# Database Sharding & Partitioning

:::info[Who this guide is for]
- **New learners** — start at [Why Shard?](#why-shard) and [Sharding Strategies](#sharding-strategies) to understand the core concepts of horizontal scaling.
- **Senior engineers** — jump to [Consistent Hashing](#consistent-hashing), [Cross-Shard Problems](#cross-shard-problems), or [Interview Questions](#interview-questions).
:::

---

## What is Partitioning?

**Partitioning** is the process of splitting a large dataset into smaller, more manageable pieces (partitions/shards). 

- **Vertical Partitioning**: Splitting a table by columns. For example, moving a large text column or rarely accessed fields into a separate table.
- **Horizontal Partitioning (Sharding)**: Splitting a table by rows. Different subsets of rows are stored on entirely different database servers (nodes). 

When we talk about "Sharding" in system design, we almost always mean **Horizontal Partitioning**.

### Why Shard?

As a system grows, a single database server will eventually hit its limits:
1. **Storage limit**: The dataset is too large to fit on one machine's disks.
2. **Compute limit (CPU/RAM)**: The query load (especially complex queries) exceeds what one server can process.
3. **Write throughput limit (I/O)**: The volume of write operations saturates the disk's IOPS or network bandwidth. (Read load can usually be handled by Read Replicas, but all writes must go to the primary node).

Sharding allows us to scale horizontally by distributing the data and the read/write load across many independent machines.

---

## Sharding Strategies

How do we decide which row goes to which shard? We use a **Routing Algorithm** based on a **Shard Key** (Partition Key).

### 1. Range Partitioning

Data is divided based on continuous ranges of the shard key.

```
Shard 1: user_id  1 – 1,000,000
Shard 2: user_id  1,000,001 – 2,000,000
Shard 3: user_id  2,000,001 – 3,000,000
```

- ✅ **Pros**: Range queries are extremely efficient. If you query `user_id BETWEEN 10 AND 50`, you only need to query Shard 1.
- ❌ **Cons**: High risk of **Hot Spots**. If you shard by `timestamp` or auto-incrementing IDs, all new writes will go to the single "latest" shard, leaving the other shards idle. 

### 2. Hash Partitioning

Data is routed based on a hash of the shard key.

```
shard_id = hash(user_id) % num_shards
```

- ✅ **Pros**: Data is evenly distributed across all shards, virtually eliminating hot spots.
- ❌ **Cons**: Range queries become expensive "scatter-gather" operations because adjacent keys (e.g. `user_id=1` and `user_id=2`) are likely on completely different shards.
- ❌ **Cons**: **Rebalancing is painful**. If you add a new shard (`num_shards` changes from 3 to 4), almost every key will hash to a new location, requiring a massive migration of data.

### 3. Consistent Hashing

To solve the painful rebalancing of Hash Partitioning, modern distributed databases (Cassandra, DynamoDB, Redis Cluster) use Consistent Hashing.

Instead of modulo arithmetic, both the data keys and the database nodes are hashed onto a virtual "ring" (from $0$ to $2^{32}-1$). A key belongs to the node that appears immediately clockwise on the ring.

```
Virtual ring: 0 ──────────────────── 2^32
Nodes at positions:   N1   N2   N3
Key maps to nearest node clockwise
```

- ✅ **Pros**: When adding or removing a node, only $\frac{1}{N}$ of the data needs to migrate (only the data belonging to the immediate neighbor), rather than migrating everything.
- ✅ **Pros**: Using "Virtual Nodes", a powerful physical server can be placed on the ring multiple times to take a larger share of the traffic.

### 4. Directory / Lookup Service

A central routing table maps specific keys or ranges to specific shards.

```
user_id range → shard_id → DB host
```

- ✅ **Pros**: Extremely flexible. You can manually move specific high-traffic tenants to their own dedicated hardware.
- ❌ **Cons**: Introduces a single point of failure and adds an extra network hop to every query.

---

## ⚠️ Cross-Shard Problems

Sharding introduces distributed systems complexities. 

| Problem | Explanation & Solution |
|---|---|
| **Cross-Shard JOINs** | Joining tables across different physical servers is slow and complex. <br/>*Solution*: Denormalize data so it lives on the same shard, or perform the join at the application layer (API Composition). |
| **Global Transactions** | ACID transactions across multiple shards require distributed protocols (like Two-Phase Commit), which are slow. <br/>*Solution*: Avoid them by using the Saga Pattern, or design your shard key so related entities always land on the same shard. |
| **Unique ID Generation** | Auto-incrementing primary keys (like MySQL `AUTO_INCREMENT`) don't work across isolated shards. <br/>*Solution*: Use a distributed ID generator like Snowflake IDs, UUID v7, or a composite key (`shard_id` + `local_auto_increment`). |
| **Scatter-Gather Queries** | A query without the shard key (e.g. `SELECT * FROM users WHERE email='x'`) must be sent to *all* shards. <br/>*Solution*: Maintain secondary indexes, or use a separate mapping table (e.g. `email` -> `user_id`). |

### Deep Dive: Snowflake IDs

A popular way to generate unique, sortable IDs without coordination between shards.

```
| 41 bits timestamp | 10 bits machine ID | 12 bits sequence |
→ Globally unique, roughly sortable, no coordination needed
```

---

## Sharding in SQL Databases (Native)

Many RDBMS systems support partitioning natively, making it transparent to the application.

### PostgreSQL Declarative Partitioning

```sql
CREATE TABLE orders (
    id BIGSERIAL,
    created_at DATE NOT NULL,
    total NUMERIC
) PARTITION BY RANGE (created_at);

-- Create partitions for specific years
CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

## 🎯 Interview Questions

### For New Learners

**Q: What is the difference between Replication and Sharding?**
> **Replication** copies the *same* data to multiple nodes to improve read scalability and high availability (fault tolerance). **Sharding** splits *different* data across multiple nodes to improve write scalability and handle datasets that are too large for a single disk. They are usually combined: a distributed database will have multiple shards, and each shard will have multiple replicas.

**Q: What is a "Hot Spot" in sharding?**
> A hot spot occurs when one shard receives disproportionately more read or write traffic than the others. This often happens with Range Partitioning when sharding by an auto-incrementing ID or a timestamp, as all new inserts naturally route to the "latest" shard, overwhelming it while older shards sit idle.

### For Senior Engineers

**Q: Why is Hash Modulo (`hash(key) % N`) a bad strategy for dynamically scaling a database?**
> If you have $N$ shards and you add one more to scale up to $N+1$, the modulo result for almost every key will change. This means nearly $100\%$ of your data must be migrated across the network to restore balance, causing massive downtime or performance degradation. Consistent hashing solves this by only requiring $\frac{1}{N}$ of the data to move when a node is added.

**Q: If you shard the `users` table by `user_id`, how do you handle a login request where the user only provides their `email`?**
> Because `email` is not the shard key, the database doesn't know which shard holds the user's record. You have two options:
> 1. **Scatter-Gather**: Send the query `SELECT * FROM users WHERE email=?` to all shards and merge the results. This is slow and doesn't scale.
> 2. **Global Secondary Index / Mapping Table**: Create a highly-available lookup table (e.g. in Redis or a separate DB) that simply maps `email -> user_id`. You query the mapping table first, get the `user_id`, and then query the correct shard directly.
