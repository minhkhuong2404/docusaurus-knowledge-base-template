---
id: nosql-distributed
title: NoSQL & Distributed Databases
description: Key-value, document, wide-column, and graph databases — their models, trade-offs, and when to choose each.
tags: [database, nosql, mongodb, cassandra, redis, dynamodb, graph, distributed, eventual-consistency]
sidebar_position: 7
---

# NoSQL & Distributed Databases

## Why NoSQL?

Relational databases have pain points at scale:
- **Rigid schema**: changing table structures is costly with large datasets
- **Vertical scaling limits**: SQL DBs scale up (bigger server), not out
- **Object-relational impedance mismatch**: mapping objects to tables is cumbersome
- **Specialized access patterns**: graph traversal, time-series, full-text are second-class citizens

NoSQL databases trade some relational guarantees for **flexibility, scale, and specialized data models**.

---

## NoSQL Categories

| Category | Data Model | Examples | Best For |
|----------|-----------|---------|----------|
| Key-Value | `key → opaque blob` | Redis, DynamoDB, Memcached | Sessions, caching, simple lookups |
| Document | `key → JSON/BSON document` | MongoDB, Couchbase, Firestore | Catalogs, user profiles, CMS |
| Wide-Column | `row key → column families` | Cassandra, HBase, Bigtable | Time-series, event logs, analytics |
| Graph | `nodes + edges + properties` | Neo4j, Amazon Neptune, JanusGraph | Social graphs, recommendation, fraud |
| Time-Series | `metric + timestamp → value` | InfluxDB, TimescaleDB, Prometheus | IoT, monitoring, metrics |
| Search | Inverted index | Elasticsearch, OpenSearch, Solr | Full-text search, log analytics |

---

## Key-Value Stores

The simplest model: a distributed hash map.

```
SET user:1001:session  "eyJhbGciOiJIUzI..."  EX 3600
GET user:1001:session
DEL user:1001:session
```

**Redis** extends this with rich data types:
- `String` → counters, cached values
- `Hash` → object fields
- `List` → queues, timelines
- `Set` → unique members, tags
- `Sorted Set (ZSet)` → leaderboards, ranked feeds
- `Stream` → append-only log, event sourcing

```bash
# Leaderboard with ZSet
ZADD leaderboard 5000 "alice"
ZADD leaderboard 8200 "bob"
ZREVRANGE leaderboard 0 9 WITHSCORES   # top 10
ZRANK leaderboard "alice"               # rank of alice
```

---

## Document Databases

Documents are self-contained JSON/BSON objects. No joins required — related data is **embedded**.

### MongoDB Data Model

```json
{
  "_id": "ObjectId(64abc...)",
  "name": "Alice",
  "email": "alice@example.com",
  "addresses": [
    { "type": "home", "city": "NYC", "zip": "10001" },
    { "type": "work", "city": "NYC", "zip": "10004" }
  ],
  "orders": [
    { "orderId": "ORD-001", "total": 99.90, "status": "shipped" }
  ]
}
```

**Embedding vs Referencing:**

| Strategy | When To Use |
|---------|------------|
| **Embed** | 1-to-few, data always read together, child has no independent lifecycle |
| **Reference** | 1-to-many (large), data accessed independently, frequent updates to child |

```javascript
// MongoDB query
db.users.find(
  { "addresses.city": "NYC" },
  { name: 1, email: 1 }
).sort({ name: 1 }).limit(10)

// Aggregation pipeline
db.orders.aggregate([
  { $match: { status: "shipped" } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
```

### Spring Data MongoDB

```java
@Document(collection = "users")
public class User {
    @Id private String id;
    private String name;
    private List<Address> addresses;  // embedded documents
}

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    List<User> findByAddressesCity(String city);

    @Query("{ 'orders.status': ?0 }")
    List<User> findByOrderStatus(String status);
}
```

---

## Wide-Column Stores (Cassandra)

Data organized as: `(partition key, clustering key) → columns`

Think of it as a distributed, sorted map of maps.

### Cassandra Data Model

```sql
-- Design driven by query patterns, not normalization
CREATE TABLE orders_by_user (
    user_id     UUID,
    created_at  TIMESTAMP,
    order_id    UUID,
    total       DECIMAL,
    status      TEXT,
    PRIMARY KEY ((user_id), created_at, order_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Efficient: scans only one partition
SELECT * FROM orders_by_user
WHERE user_id = ? AND created_at >= ? AND created_at <= ?;
```

**Partition key** → determines which node stores the data (hash-based)
**Clustering key** → sorts data within a partition

### Cassandra Consistency Levels

```
N = replication factor (e.g., 3)
W = nodes that must ack a write
R = nodes that must respond to a read

Quorum: W + R > N → strong consistency
ONE: fastest, may return stale data
EACH_QUORUM: quorum per datacenter
LOCAL_QUORUM: quorum in local DC only
```

### Key Rules in Cassandra
- **No JOINs** — denormalize data into query-specific tables
- **No unbounded queries** — always filter by partition key
- **Partition size** limit: keep under 100MB / 100K rows
- **Tombstones**: deletes create markers, cleaned up by compaction

---

## Graph Databases

Represent data as **nodes** (entities) and **edges** (relationships) with properties.

```
(Alice)-[:FOLLOWS]->(Bob)
(Alice)-[:PURCHASED]->(Product{name:"MacBook"})
(Bob)-[:REVIEWED{rating:5}]->(Product)
```

### When to use graphs
- Social networks (friends, followers)
- Recommendation engines
- Fraud detection (connected accounts)
- Knowledge graphs
- Network topology

### Cypher (Neo4j Query Language)

```cypher
// Find friends of friends not already connected
MATCH (me:User {id: $userId})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(fof:User)
WHERE NOT (me)-[:FOLLOWS]->(fof) AND me <> fof
RETURN fof, COUNT(*) AS mutualCount
ORDER BY mutualCount DESC LIMIT 10;

// Shortest path
MATCH p = shortestPath((alice:User {name:"Alice"})-[*]-(bob:User {name:"Bob"}))
RETURN p;
```

---

## DynamoDB (AWS)

- Key-value and document model, fully managed
- Primary key: Partition Key + optional Sort Key
- Single-digit millisecond latency at any scale
- **On-demand** or **provisioned** capacity modes

```python
# DynamoDB access patterns (Java SDK)
# PutItem, GetItem, Query (partition key required), Scan (expensive — avoid)
```

**DynamoDB Single-Table Design:**
```
PK              | SK              | attributes
----------------|-----------------|-----------
USER#alice      | PROFILE         | name, email
USER#alice      | ORDER#2024-001  | total, status
PRODUCT#mac     | DETAILS         | price, stock
```

Store multiple entity types in one table → avoid joins, maximize RCU/WCU efficiency.

---

## BASE vs ACID

NoSQL systems often follow **BASE** instead of ACID:

| | ACID | BASE |
|--|------|------|
| Consistency | Strong | **B**asically Available |
| State | Always consistent | **S**oft state (may be stale) |
| Availability | May block | **E**ventually consistent |
| Use case | Finance, inventory | Social, analytics, logs |

---

## Choosing the Right Database

```
Is data relational with complex queries?
  → PostgreSQL / MySQL

Need massive write throughput + horizontal scale + time-series?
  → Cassandra, InfluxDB

Need flexible schema + rich document queries?
  → MongoDB

Need graph traversal?
  → Neo4j / Amazon Neptune

Need sub-millisecond caching + pub-sub?
  → Redis

Need full-text search + log analytics?
  → Elasticsearch

Need serverless + auto-scaling on AWS?
  → DynamoDB
```

---

## Eventual Consistency in Practice

With eventual consistency, a read immediately after a write may return stale data:

```
t=0: Client writes X=5 to node A
t=1: Client reads X from node B → gets X=3 (not yet replicated)
t=2: Replication catches up
t=3: Client reads X from node B → gets X=5
```

**Handling in applications:**
- Show "changes may take a moment to appear"
- Use **read-your-writes** consistency (read from same node you wrote to)
- Use **session tokens** (read the version you wrote, or later)
- Use **monotonic reads** (always read from same replica for a session)

---

## 🎯 Interview Questions

**Q1. When would you choose a NoSQL database over a relational database?**
> Choose NoSQL when: the data model doesn't fit rows/columns well (documents, graphs); you need horizontal write scaling beyond what a single RDBMS can handle; you have a flexible/evolving schema; you need specialized access patterns (full-text, graph traversal, time-series); or you need geographic distribution with eventual consistency.

**Q2. What is the difference between embedding and referencing in MongoDB?**
> Embedding stores related data inside the parent document — good for data always read together (1-to-few, no independent lifecycle). Referencing stores a foreign key — good for large 1-to-many relationships, data accessed independently, or frequently updated sub-documents. MongoDB has no automatic join enforcement; referencing requires application-level lookups.

**Q3. How does Cassandra determine which node stores a piece of data?**
> Cassandra hashes the partition key using consistent hashing to place it on a virtual ring. The node responsible for that hash range stores the data (plus N-1 replicas on subsequent nodes). Adding nodes only moves ~1/N of partitions, minimizing rebalancing.

**Q4. What is eventual consistency and what problems does it cause?**
> Eventual consistency means all replicas will eventually converge to the same value, but reads may return stale data in the meantime. Problems: reads after writes return old data, different users see different states simultaneously, lost updates if not handled carefully. Mitigation: quorum reads/writes, read-your-writes patterns, version vectors.

**Q5. Explain BASE properties.**
> BASE = Basically Available (system remains operational, may return partial/stale data), Soft State (state may change without input due to eventual consistency), Eventually Consistent (system will reach consistency given no new updates). Contrasts with ACID's strict consistency guarantees.

**Q6. What is the difference between a key-value store and a document store?**
> A key-value store treats values as opaque blobs — you can only retrieve by key, not query inside the value. A document store understands the structure of values (JSON/BSON) and lets you query, index, and update individual fields within documents without retrieving the whole thing.

**Q7. What is DynamoDB Single-Table Design and why is it used?**
> Single-Table Design stores multiple entity types in one DynamoDB table, using a generic PK/SK scheme. It avoids the need for multiple tables and joins, maximizes RCU/WCU efficiency (one request fetches all related entities), and models access patterns directly. Trade-off: complex to design and maintain; no ad-hoc queries.

**Q8. How does Neo4j's graph model handle queries that would be expensive in SQL?**
> Graph DBs store relationships as first-class citizens (edges with direct pointers), so traversal is constant-time per edge. A friends-of-friends query on a social graph would require expensive JOINs in SQL (or multiple self-joins). In Neo4j, it's a simple MATCH pattern. Depth-first searches, shortest path, and cycle detection are all native operations.

---

## Advanced Editorial Pass: NoSQL Selection with Explicit Consistency Contracts

### Senior Engineering Focus
- Choose model by query shape and consistency budget, not branding.
- Treat partitioning and quorum behavior as API-visible constraints.
- Design for rebalance, repair, and schema evolution from day one.

### Failure Modes to Anticipate
- Unexpected consistency anomalies in multi-region reads.
- Inefficient data model requiring expensive cross-partition access.
- Operational overhead from uncontrolled cluster growth.

### Practical Heuristics
1. Write down consistency expectations per endpoint.
2. Benchmark with realistic partition-key distribution.
3. Automate repair and compaction health checks.

### Compare Next
- [Replication & Partitioning](./replication-partitioning.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [Time-Series Databases](./time-series-databases.md)
