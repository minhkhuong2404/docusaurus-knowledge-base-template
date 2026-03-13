---
id: replication-partitioning
title: Replication & Partitioning
description: Database replication strategies, sharding patterns, the CAP theorem, and horizontal scaling techniques.
tags: [database, replication, sharding, partitioning, cap-theorem, scaling, leader-follower]
sidebar_position: 6
---

# Replication & Partitioning

## Why Replicate?

- **High availability**: if primary fails, promote a replica
- **Read scalability**: distribute read queries across replicas
- **Geographic distribution**: serve users from nearby region
- **Disaster recovery**: off-site replicas for backup

---

## Replication Architectures

### Leader–Follower (Primary–Replica)

The most common model.

```
          Writes
Client ──────────→ [Leader / Primary]
                         │
                    WAL / binlog
                    ↙         ↘
             [Replica 1]  [Replica 2]
                 │               │
           Read queries    Read queries
```

- All **writes go to leader**
- Leader ships changes to followers via log (MySQL binlog, PostgreSQL WAL)
- Followers are **read-only** (can serve SELECT queries)
- On leader failure → **failover** promotes a replica

**Replication lag**: followers may be seconds behind the leader → **eventual consistency** for reads.

```sql
-- MySQL: check replication lag
SHOW SLAVE STATUS\G
-- Seconds_Behind_Master: N
```

### Synchronous vs Asynchronous Replication

| | Synchronous | Asynchronous |
|--|-------------|-------------|
| Durability | Higher (follower confirmed) | Leader can't wait |
| Write latency | Higher (waits for follower ack) | Lower |
| Risk | Blocks if follower is slow | Data loss if leader crashes before replica syncs |
| PostgreSQL | `synchronous_commit = on` | `synchronous_commit = off` |

**Semi-synchronous** (MySQL): at least one follower must ack before commit returns.

---

### Multi-Leader (Multi-Primary)

Multiple nodes accept writes. Used for:
- Multi-datacenter deployments (each DC has a leader)
- Offline-capable apps (each client is a "leader")

**Challenge: write conflicts** — two leaders can accept conflicting writes.

Conflict resolution strategies:
- **Last-write-wins (LWW)**: by timestamp (risk of data loss)
- **Merge**: application-level merging (CRDTs)
- **Custom logic**: application decides which wins

---

### Leaderless (Dynamo-style)

Any node accepts reads and writes. Used by: **Cassandra, DynamoDB, Riak**.

```
Client writes to W nodes
Client reads from R nodes
Quorum: W + R > N → at least one response has latest write
```

- No single point of failure
- **Eventual consistency** by default
- Tunable consistency: adjust W, R, N

---

## Partitioning / Sharding

**Partitioning** = splitting large tables. Can be:
- **Vertical**: split columns into separate tables
- **Horizontal (sharding)**: split rows across nodes

### Why Shard?
- Dataset too large for one server
- Write throughput exceeds one server's capacity
- Query load can't be served by replicas alone

---

## Sharding Strategies

### Range Partitioning

```
Shard 1: user_id  1 – 1,000,000
Shard 2: user_id  1,000,001 – 2,000,000
Shard 3: user_id  2,000,001 – 3,000,000
```

✅ Range queries easy (scan one or few shards)
❌ **Hot spots**: recent data (e.g., order by date) all goes to one shard

### Hash Partitioning

```
shard = hash(user_id) % num_shards
```

✅ Even distribution, no hot spots
❌ Range queries require scanning all shards
❌ **Rebalancing** when adding shards: most keys must move

### Consistent Hashing

Used by: **Cassandra, DynamoDB, Redis Cluster**

```
Virtual ring: 0 ──────────────────── 2^32
Nodes at positions:   N1   N2   N3
Key maps to nearest node clockwise
```

✅ Adding/removing a node only redistributes ~1/N keys
✅ Virtual nodes enable uneven weighting
❌ More complex to implement

### Directory / Lookup Service

A routing table maps keys to shards:
```
user_id range → shard_id → DB host
```

✅ Flexible, any mapping possible
❌ Single point of failure (if directory is down)
❌ Extra lookup hop

---

## Partitioning in SQL Databases

### MySQL Partitioning

```sql
-- Range partition by year
CREATE TABLE orders (
    id INT,
    created_at DATE,
    total DECIMAL(10,2)
)
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Hash partition
CREATE TABLE sessions (
    id BIGINT,
    user_id INT
)
PARTITION BY HASH(user_id) PARTITIONS 8;
```

### PostgreSQL Table Partitioning (Declarative — PG 10+)

```sql
CREATE TABLE orders (
    id BIGSERIAL,
    created_at DATE NOT NULL,
    total NUMERIC
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

## CAP Theorem

A distributed system can guarantee at most **2 of 3**:

| Property | Description |
|----------|-------------|
| **Consistency (C)** | Every read receives the latest write (or an error) |
| **Availability (A)** | Every request receives a response (no error) |
| **Partition tolerance (P)** | System continues despite network partitions |

**Network partitions are inevitable in distributed systems**, so the real choice is **CP vs AP**:

- **CP** (Consistent + Partition tolerant): Returns error or waits when partitioned. Examples: HBase, Zookeeper, etcd, MongoDB (strong consistency mode)
- **AP** (Available + Partition tolerant): Returns potentially stale data when partitioned. Examples: Cassandra (eventual consistency), CouchDB, DynamoDB

:::info CAP is a simplification
The PACELC model extends CAP: even without partitions, there's a trade-off between **latency** and **consistency**.
:::

---

## PACELC Model

```
If Partition:    Availability   vs  Consistency     (AP vs CP)
Else (no part):  Latency        vs  Consistency     (EL vs EC)
```

| System | Partition | Else |
|--------|-----------|------|
| DynamoDB (default) | AP | EL |
| Cassandra | AP | EL |
| MongoDB | CP | EC |
| PostgreSQL (single node) | — | EC |

---

## Read Replicas and Replication Lag — Practical Issues

### Read-Your-Writes Consistency

After a user submits a form, they must see their own update even if reads go to replicas:

1. Read from leader for N seconds after write
2. Track last write timestamp, only read from replica if it has caught up
3. Route user's reads to leader for their own data; replica for others

### Monotonic Reads

A user should not read older data after reading newer data (by reading different replicas):
- Assign user → specific replica (consistent routing by user_id)

---

## Spring Boot Configuration for Read/Write Split

```java
// Route reads to replica, writes to primary
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource routingDataSource(
            @Qualifier("primaryDs") DataSource primary,
            @Qualifier("replicaDs") DataSource replica) {

        Map<Object, Object> targets = new HashMap<>();
        targets.put("primary", primary);
        targets.put("replica", replica);

        AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
                    ? "replica" : "primary";
            }
        };
        routing.setTargetDataSources(targets);
        routing.setDefaultTargetDataSource(primary);
        return routing;
    }
}

// Use @Transactional(readOnly = true) to route to replica
@Transactional(readOnly = true)
public List<Order> getRecentOrders() { ... }
```

---

## 🎯 Interview Questions

**Q1. What is the difference between replication and sharding?**
> Replication copies the **same data** to multiple nodes — for high availability and read scaling. Sharding splits **different data** across nodes — for write scaling and handling datasets too large for one server. They're often combined: multiple shards, each with its own replicas.

**Q2. What is replication lag and how do you handle it?**
> Replication lag is the delay between a write on the leader and its appearance on replicas. Handle it by: routing writes and immediate re-reads to the leader; using read-your-writes consistency; tracking replication positions; or accepting eventual consistency where appropriate.

**Q3. Explain consistent hashing. Why is it better than regular hash modulo for sharding?**
> Consistent hashing maps both data and nodes onto a virtual ring. When a node is added/removed, only ~1/N of keys need to be remapped, versus N-1/N for hash-modulo. This makes it much cheaper to scale the cluster.

**Q4. What is the CAP theorem? How does it apply to choosing a database?**
> CAP states a distributed system can have at most 2 of: Consistency (reads always see latest write), Availability (every request gets a response), and Partition tolerance. Since partitions are inevitable, the real choice is between CP (consistency over availability) and AP (availability with eventual consistency).

**Q5. What are the trade-offs of range partitioning vs hash partitioning?**
> Range: supports range queries efficiently, but can create hot spots (recent time-range data all on one shard). Hash: evenly distributes data, eliminates hot spots, but makes range queries expensive (scatter-gather across all shards) and rebalancing costly with modulo hashing.

**Q6. What is a hot spot in sharding and how do you prevent it?**
> A hot spot is a shard receiving disproportionately more traffic than others. Causes: popular key (celebrity user, viral post), monotonically increasing PK with range sharding. Prevention: hash sharding, adding random suffix to hot keys, dedicated shard for hot data, caching.

**Q7. What is leader election and why is it critical for replication?**
> When the leader fails, a new leader must be elected from replicas. Common algorithms: Raft, Paxos, Zab (ZooKeeper). The new leader must have the most up-to-date data. Split-brain (two leaders simultaneously) is a dangerous failure mode — fencing mechanisms and quorums prevent it.

**Q8. How does multi-leader replication handle write conflicts?**
> Conflicts occur when two leaders accept conflicting writes to the same row. Strategies: last-write-wins (LWW) by timestamp (risks data loss); per-record conflict avoidance (route each user to one leader); application-level merge (CRDTs); reporting conflict to user. There's no perfect automatic solution — it depends on the use case.

---

## Advanced Editorial Pass: Replication and Partitioning in Distributed Reality

### Senior Engineering Focus
- Design topology around failure domains and consistency expectations.
- Use partition keys that balance load and preserve query locality.
- Plan failover behavior and reconciliation paths up front.

### Failure Modes to Anticipate
- Hot partitions and uneven replica lag under skewed traffic.
- Failover events violating read-after-write assumptions.
- Operational complexity outpacing team runbook maturity.

### Practical Heuristics
1. Measure replication lag and partition skew continuously.
2. Test failover and rebalancing during controlled game days.
3. Document consistency guarantees per API surface.

### Compare Next
- [NoSQL & Distributed Databases](./nosql-distributed.md)
- [Transactions & Concurrency](./transactions-concurrency.md)
- [Backup & Recovery](./backup-recovery.md)
