---
id: chapter-06
title: "Chapter 6: Partitioning"
sidebar_label: "Ch 6 — Partitioning"
sidebar_position: 2
---

# Chapter 6: Partitioning

## The Big Idea

For very large datasets or very high query throughput, a single machine is not enough. **Partitioning** (also called sharding) breaks the data into **partitions** — each partition is assigned to a different node. This enables horizontal scaling of both storage and query throughput.

The challenge is doing this in a way that distributes load evenly and supports efficient queries.

---

## 🗂️ Partitioning and Replication

Partitioning and replication are often combined. Each partition is replicated across several nodes for fault tolerance. A node may hold multiple partitions.

```
Node 1: Partition 1 (leader), Partition 3 (follower)
Node 2: Partition 2 (leader), Partition 1 (follower)
Node 3: Partition 3 (leader), Partition 2 (follower)
```

Partitioning strategy determines *which node* holds which data. Replication strategy determines *how many copies* and *which nodes* hold them.

---

## 🔢 Partitioning of Key-Value Data

Goal: spread data and query load evenly (**skew** means uneven distribution; a heavily loaded partition is a **hot spot**).

### Partitioning by Key Range

Assign a continuous range of keys to each partition (like encyclopedia volumes: A-D, E-H, ...).

```
Partition 1: keys [a — cart]
Partition 2: keys [cart — menu]
Partition 3: keys [menu — zzz]
```

✅ Efficient range queries (e.g., all timestamps in January)
❌ Risk of hot spots — e.g., all writes today go to the "today's date" partition

Used by: HBase, Bigtable, MongoDB (range sharding), RethinkDB.

**Fix for timestamp hot spot:** Prefix the key with something other than the timestamp, e.g., `{sensor_id}_{timestamp}` instead of `{timestamp}_{sensor_id}`. Now you can still range-query one sensor's data, and writes are spread across partitions.

### Partitioning by Hash of Key

Use a **hash function** to determine which partition a key goes to.

```
hash("user_123") % 10 = 7  →  Partition 7
```

✅ Distributes load evenly (good hash function = uniform distribution)
❌ Range queries no longer work (adjacent keys are scattered across partitions)

Used by: Cassandra, MongoDB (hash sharding), Riak, Voldemort.

**Consistent hashing:** A technique where adding/removing nodes only requires moving a fraction of the keys (not rehashing everything).

### Cassandra's Compound Primary Key

Cassandra uses a hybrid: the **first column** is hashed (to select partition), the **remaining columns** form an SSTable-style sort key within the partition. This allows efficient range queries within one user's data:

```
PARTITION KEY: (user_id)          ← hashed to select node
CLUSTERING KEY: (update_timestamp) ← sorted within partition
```

Query: "Give me the last 10 posts for user 42" — goes to one partition and does a range scan. Efficient!

---

## 🔥 Skewed Workloads and Hot Spots

Even with hash partitioning, extreme skew can occur. Example: a celebrity Twitter account — all of their followers reading and writing generates traffic that hashes to one key.

**Mitigation:** Add a random prefix (e.g., 2-digit suffix) to the celebrity's key, spreading writes across 100 partitions. Reads must then query all 100 partitions and combine results — a trade-off the application must manage manually.

No database handles this automatically — it requires application-level logic.

---

## 🔍 Partitioning and Secondary Indexes

Secondary indexes don't map neatly to partitions. Two main approaches:

### Document-Based Partitioning (Local Indexes)

Each partition maintains its own secondary index — only covering documents in that partition.

```
Partition 0 (cars with id 0-499):
  color:red → [id:12, id:58, id:100]
  make:honda → [id:22, id:199]

Partition 1 (cars with id 500-999):
  color:red → [id:512, id:788]
  make:honda → [id:600]
```

✅ Simple writes — only update the local index
❌ **Scatter/gather reads** — a query for "red cars" must go to ALL partitions and merge results; prone to tail latency amplification

Used by: MongoDB, Cassandra, Riak, Elasticsearch, SolrCloud.

### Term-Based Partitioning (Global Indexes)

One global index, also partitioned — but by the index term, not by document ID.

```
Index for 'color':
  Partition 0: color:black → [car:id:523, car:id:904, ...]
  Partition 1: color:red   → [car:id:12, car:id:512, ...]
  Partition 2: color:white → [car:id:77, ...]
```

✅ Reads are efficient — query goes to just the index partition(s) for the term
❌ Writes are slower — a single document write may update multiple index partitions

Used by: Amazon DynamoDB Global Secondary Indexes, Riak Search.

Global index updates are often asynchronous — meaning reads may see stale index data for a short window.

---

## 🔄 Rebalancing Partitions

Partitions need to be moved between nodes when:
- Query throughput increases → add more CPUs
- Dataset grows → add more disks
- A node fails → its partitions must be served by other nodes

**Requirements for rebalancing:**
- Load should be evenly distributed after rebalancing
- Database should continue serving reads/writes during rebalancing
- Minimize data moved across the network

### Bad Approach: `hash mod N`

Using `hash(key) % N` (where N = number of nodes) means that when N changes, almost all keys need to be moved. Too disruptive.

### Fixed Number of Partitions

Create many more partitions than nodes (e.g., 1000 partitions for 10 nodes → 100 partitions/node). When adding a node, steal a few partitions from each existing node. Only partition-to-node assignment changes, not the key-to-partition mapping.

Used by: Riak, Elasticsearch, Couchbase, Voldemort.

Downside: You must choose the total partition count upfront. Too low = large partitions (expensive rebalancing). Too high = overhead.

### Dynamic Partitioning

Partitions split when they grow beyond a threshold (e.g., 10 GB), and merge when they shrink below a threshold. Total partition count adapts to data volume.

Used by: HBase, MongoDB, RethinkDB.

### Partitioning Proportionally to Nodes

Fixed number of partitions **per node** (Cassandra, Ketama). Adding a node = splitting some existing partitions. Partition size scales with dataset; partition count scales with node count.

---

## 🧭 Request Routing

How does a client know which node to connect to for a given key?

Three approaches:

1. **Client connects to any node**, which forwards if needed (gossip protocol approach — Cassandra, Riak)
2. **Routing tier (partition-aware load balancer)** — all clients connect to a router that tracks partition-to-node mapping (ZooKeeper-based)
3. **Client tracks partition assignment** — client knows directly which node to connect to

**ZooKeeper** is commonly used to track cluster state. Nodes register themselves; the routing tier subscribes to ZooKeeper and gets notified of changes.

---

## Summary

| Aspect | By Key Range | By Hash | Hash + Compound Key |
|---|---|---|---|
| Range queries | ✅ Efficient | ❌ Inefficient | ⚠️ Within-partition only |
| Load distribution | ⚠️ Risk of hot spots | ✅ Even | ✅ Even per partition |
| Used by | HBase, MongoDB | Cassandra, Dynamo | Cassandra |

Partitioning enables scaling beyond a single machine, but it adds complexity around secondary indexes, query routing, and rebalancing. The right strategy depends on your query patterns.
