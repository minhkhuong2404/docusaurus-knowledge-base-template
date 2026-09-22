---
id: key-value-store
title: "Design a Distributed Key-Value Store"
sidebar_label: "33. Key-Value Store"
description: "Staff-level system design breakdown for a highly available, partition-tolerant distributed key-value store based on the Amazon Dynamo and Apache Cassandra architectures."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Distributed Key-Value Store

A distributed key-value store provides simple `put(key, value)` and `get(key)` primitives with horizontal scalability, sub-millisecond latencies, and high fault tolerance across hundreds of commodity server nodes. Modeled after landmark systems such as Amazon Dynamo, Apache Cassandra, and ScyllaDB, this system trades strict serializability for tunable eventual consistency and high write availability (AP under the CAP theorem).

---

## 1. Understanding the Problem

### Functional Requirements
1. **`put(key, value)`**: Persists an arbitrary byte array value (up to 1 MB) associated with a string key (up to 256 bytes).
2. **`get(key)`**: Retrieves the latest value associated with the given key.
3. **`delete(key)`**: Deletes the value associated with the key (via tombstone markers).
4. **Configurable Consistency Level**: Clients can specify write and read consistency per operation (e.g. `ONE`, `QUORUM`, `ALL`).

### Non-Functional Requirements
- **Tunable Consistency**: Supports configurable consistency where $R + W > N$ guarantees strong consistency (reading the latest written version).
- **High Availability**: 99.999% write and read availability; the system must accept writes even during node failures or network partitions.
- **Ultra-Low Latency**: P99 write latency $< 5\text{ms}$; P99 read latency $< 3\text{ms}$.
- **Massive Scalability**: Horizontally scalable to thousands of nodes storing petabytes of data without centralized bottleneck coordinators.
- **Fault Tolerance**: Automatic failure detection, hinted handoff during temporary network partitions, and anti-entropy synchronization using Merkle trees.

### Capacity Estimations & Sizing (5 Years)
- **Scale**:
  - Daily Active Keys: 1 Billion active keys.
  - Total Keys Stored: 10 Billion keys.
  - Average Key Size: 64 bytes.
  - Average Value Size: 1 KB.
  - Total Raw Data Size: $10\text{ Billion} \times (64\text{ B} + 1\text{ KB}) \approx \mathbf{10.6\text{ TB}}$.
  - Replication Factor ($N = 3$): $10.6\text{ TB} \times 3 = \mathbf{31.8\text{ TB}}$ total cluster storage.
- **Throughput Sizing**:
  - Peak Write Traffic: 50,000 writes/second.
  - Peak Read Traffic: 200,000 reads/second.
  - Peak Write Bandwidth: $50,000 \times 1\text{ KB} = \mathbf{50\text{ MB/s}}$ (replicated write bandwidth: $150\text{ MB/s}$).
  - Peak Read Bandwidth: $200,000 \times 1\text{ KB} = \mathbf{200\text{ MB/s}}$.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      STORAGE_CELL                      │
├──────────────────┬──────────────┬──────────────────────┤
│ key              │ VARCHAR(256) │ PRIMARY KEY          │
│ value            │ BLOB         │ Max 1 MB             │
│ version          │ VARCHAR(128) │ Vector Clock String  │
│ timestamp        │ BIGINT       │ Client Unix Microsec │
│ is_tombstone     │ BOOLEAN      │ Deletion marker      │
│ ttl_seconds      │ INT          │ Optional Expiration  │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   RING_NODE_METADATA                   │
├──────────────────┬──────────────┬──────────────────────┤
│ node_id          │ UUID         │ Unique Server UUID   │
│ ip_address       │ VARCHAR(45)  │ Host IPv4/IPv6       │
│ port             │ INT          │ Gossip/Data Port     │
│ token_ranges     │ ARRAY[BIGINT]│ Assigned V-node tokens│
│ rack_id          │ VARCHAR(32)  │ Datacenter Rack ID   │
│ state            │ ENUM         │ UP, DOWN, LEAVING    │
│ generation       │ BIGINT       │ Heartbeat Epoch      │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Store Key-Value Pair
```http
PUT /api/v1/keys/{key}
Content-Type: application/octet-stream
X-Consistency-Level: QUORUM
X-Client-Timestamp: 1727020800000000
If-Match-Version: v1:3;v2:1

<binary payload up to 1MB>
```
**Response (`200 OK`)**:
```json
{
  "key": "user_session_9281a",
  "version": "v1:3;v2:2",
  "write_status": "COMMITTED",
  "replicas_responded": 2
}
```

#### 2. Retrieve Value
```http
GET /api/v1/keys/{key}
X-Consistency-Level: QUORUM
```
**Response (`200 OK`)**:
```http
HTTP/1.1 200 OK
Content-Type: application/octet-stream
ETag: "v1:3;v2:2"
X-Timestamp: 1727020800000000

<binary payload>
```

#### 3. Delete Key
```http
DELETE /api/v1/keys/{key}
X-Consistency-Level: QUORUM
```
**Response (`204 No Content`)**

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="key-value-store" title="Distributed Key-Value Store Ring Topology & Quorum Pipeline" />

### Walkthrough of Core Flows

#### 1. The Quorum Write Path
1. The **Client Driver** hashes the key using Murmur3 to locate the target partition on the consistent hashing ring. It connects directly to the node responsible for that token or to an arbitrary node which acts as the **Coordinator Node**.
2. The **Coordinator** identifies the **$N$ physical replica nodes** that own the key's token range in clockwise order on the ring (ensuring rack diversity).
3. The Coordinator sends concurrent write requests to all $N$ replicas.
4. Each replica node:
   - Appends the mutation sequentially to the disk-backed **CommitLog (WAL)** for durability.
   - Writes the record to the in-memory **Memtable** (concurrent SkipList).
   - Returns an acknowledgment to the Coordinator.
5. As soon as **$W$ replicas** acknowledge the write, the Coordinator returns `200 OK` to the client.
6. If $W$ nodes cannot be reached, the Coordinator writes a **Hinted Handoff** record to local temporary storage and returns success if Sloppy Quorum is enabled.

#### 2. The Quorum Read Path
1. The client issues a read request for `key` to the Coordinator with consistency level $R$.
2. The Coordinator requests data from 1 replica and lightweight **SHA-256 data digests** from the remaining $R - 1$ replicas to conserve internal network bandwidth.
3. If all returned digests match, the Coordinator returns the data to the client immediately ($< 2\text{ms}$).
4. **Read Repair**: If digests differ, the Coordinator fetches full data records from all $N$ replicas, compares their vector clocks / timestamps to find the most recent version, returns the latest version to the client, and asynchronously fires write requests to overwrite the stale replicas.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Consistent Hashing Ring & Virtual Nodes (V-Nodes)
How do we distribute keys uniformly without hotspots, and how do we handle heterogeneous hardware?

```
Standard Hash Ring:
Node A [Token: 100] ────► Node B [Token: 500] ────► Node C [Token: 900]
Problem: Uneven key distribution and non-uniform data movement during node addition.

Virtual Nodes (V-Nodes):
Each physical node hosts V = 128 or 256 virtual tokens distributed randomly across the ring:
Ring: [A1] ─ [B1] ─ [C1] ─ [A2] ─ [B2] ─ [C2] ─ [A3] ─ [B3] ─ [C3] ...
```
- **Uniform Data Distribution**: When physical server $D$ joins the cluster, it claims virtual tokens scattered across the ring, pulling small segments of data evenly from all existing nodes rather than overwhelming a single predecessor.
- **Heterogeneous Hardware**: A high-spec server with 64 CPU cores and 16 TB SSD is assigned 256 V-nodes, while an older 16-core server is assigned 64 V-nodes.

### Deep Dive 2: Quorum Consistency Math ($R + W > N$)
To guarantee that a read always sees the latest write, the read quorum $R$ and write quorum $W$ must overlap on at least one common replica out of $N$ total replicas:
$$R + W > N$$

| Configuration | $N$ | $W$ | $R$ | Consistency Guarantee | Latency & Availability Profile |
|---|---|---|---|---|---|
| **High Write Availability** | 3 | 1 | 3 | Eventual Consistency | Fastest writes ($W=1$), slow reads ($R=3$), tolerant to 2 write node failures |
| **High Read Availability** | 3 | 3 | 1 | Eventual Consistency | Slow writes ($W=3$), fastest reads ($R=1$), ideal for read-heavy caches |
| **Strict Quorum** | 3 | 2 | 2 | **Strong Consistency** | Balanced read/write performance; survives 1 node failure ($N-W=1$) |
| **Single-Node Local** | 3 | 1 | 1 | Weak / Eventual | Sub-millisecond latency; dirty reads possible under concurrent writes |

### Deep Dive 3: Concurrent Conflict Resolution: Vector Clocks vs Last-Write-Wins (LWW)
When network partitions occur, two clients may write concurrently to different replicas for the same key.

#### 1. Last-Write-Wins (LWW)
- Assigns the latest Unix microsecond timestamp to the record.
- **The Danger**: Clock drift across physical servers (NTP synchronization skew). A server with a clock running 50ms ahead will permanently overwrite newer updates from correctly synchronized servers.

#### 2. Vector Clocks
A vector clock is an array of pairs: `[(node_1, counter_1), (node_2, counter_2), ...]`.
- When an update occurs at node $i$, counter $i$ is incremented.
- If Vector Clock $V_A$ has all components $\ge V_B$, then $V_A$ causally succeeds $V_B$ (no conflict).
- If neither vector clock dominates, a concurrent write conflict is detected. The key-value store stores both versions as siblings and forces the client application to reconcile the divergence on the next read (e.g., merging shopping cart items).

### Deep Dive 4: Anti-Entropy with Merkle Trees & Gossip Protocol
How do nodes detect out-of-sync replicas without transferring gigabytes of raw data over the network?
- **Hierarchical Merkle Trees**: Each replica maintains a binary hash tree over its token ranges.
- **Sub-Tree Hash Comparison**:
  1. Nodes exchange the root hashes of their Merkle trees during background anti-entropy audits.
  2. If root hashes match, the entire dataset is identical $\implies 0$ bytes transferred.
  3. If root hashes differ, nodes traverse child hashes down the tree to pinpoint the exact token range and key that diverged, transferring only the missing keys over the wire.
- **Gossip Protocol (Phi Accrual Failure Detector)**:
  - Nodes exchange cluster state via randomized peer gossip every 1 second.
  - Rather than a binary "node up / node down" flag, the **Phi ($\Phi$) Accrual** algorithm calculates a continuous suspicion metric based on historic heartbeat intervals, avoiding false failovers during transient network latency blips.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Storage Engine** | B+Tree (InnoDB / WiredTiger) | LSM-Tree (Log-Structured Merge) | **LSM-Tree**: Sequential write appends to CommitLog and Memtable eliminate random disk I/O, maximizing write throughput on NVMe SSDs. |
| **Consistency vs Availability** | CP (Raft / Paxos Leader) | AP (Dynamo Masterless Quorum) | **AP Quorum**: Eliminates master bottleneck; any node can coordinate reads and writes, providing continuous availability during partial network partitions. |
| **Conflict Resolution** | Server-side Last-Write-Wins (LWW) | Vector Clocks with Sibling Merging | **Tunable**: LWW by default with TrueTime/PTP clocks; Vector Clocks enabled for business-critical schemas (e.g. shopping carts). |
| **Failure Recovery** | Synchronous Replica Rebuild | Sloppy Quorum + Hinted Handoff | **Hinted Handoff**: Buffers writes locally when a target replica is down and replays them upon recovery, avoiding write dropouts during rolling restarts. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Explains consistent hashing basics and why modulo hashing ($hash(k) \pmod N$) fails when scaling nodes.
- Understands the meaning of $N, W, R$ and calculates strict quorum ($R + W > N$).
- Describes basic read and write flows using in-memory caches and disk storage.

### Senior (L5 / IC5)
- Designs virtual node (V-node) token rings to eliminate data skew and hotspot partitions.
- Details the internal mechanics of an LSM storage engine (CommitLog, Memtable, SSTables, Bloom filters, compaction).
- Explains read repair, hinted handoff, and why tombstones are necessary for LSM deletions.
- Implements Gossip protocol and understands clock drift hazards in Last-Write-Wins (LWW).

### Staff+ (L6 / Principal)
- Mathematically evaluates Merkle tree anti-entropy exchange bandwidth overhead and compaction debt.
- Evaluates Phi Accrual failure detection probability thresholds under variable cloud cross-region network jitter.
- Designs multi-datacenter active-active replication strategies (e.g., `LOCAL_QUORUM` vs `EACH_QUORUM`).
- Formulates strategies for garbage-collecting tombstones without resurrecting deleted data (`gc_grace_seconds` coordination).
