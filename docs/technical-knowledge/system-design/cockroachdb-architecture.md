---
id: cockroachdb-architecture
title: "CockroachDB Architecture: Multi-Raft, HLC & Distributed ACID"
sidebar_label: "CockroachDB Architecture"
sidebar_position: 15
description: "Masterclass guide to CockroachDB internals — 5-layer architecture (SQL, Transaction, Distribution, Replication, Storage), Hybrid Logical Clocks (HLC), Multi-Raft consensus, Leaseholders, Write Intents, Parallel Commits, Read Uncertainty, and Pebble storage engine."
tags:
  - system-design
  - distributed-systems
  - cockroachdb
  - distributed-transactions
  - raft
  - hlc
  - newsql
  - acid
  - consistency
---

import CockroachDbArchitectureDiagram from '@site/src/components/CockroachDbArchitectureDiagram';

# 🪳 CockroachDB Architecture: Multi-Raft, HLC & Distributed ACID

Traditional relational databases (PostgreSQL, MySQL) were architected for single-node vertical scaling. To survive outages, they rely on active-passive replication with automated failover scripts (Patroni, Orchestrator), which risk split-brain conditions, replication lag, and data loss upon ungraceful failover. Conversely, traditional NoSQL databases (Cassandra, DynamoDB, MongoDB) achieve horizontal scale and fault tolerance by abandoning SQL joins, foreign keys, or strict ACID transactions.

**CockroachDB bridges this divide** as a leader in the **Distributed SQL (NewSQL)** category. It provides standard relational SQL, secondary indexes, and default **Strict Serializable ACID isolation**, while scaling horizontally across nodes, availability zones, and global cloud regions like a NoSQL cluster.

---

## Interactive Telemetry: The 5-Layer CockroachDB Engine

Explore CockroachDB's complete internal architecture, Hybrid Logical Clocks, and transaction commit flows in the interactive telemetry viewer below:

<CockroachDbArchitectureDiagram />

---

## 1. The 5-Layer Architectural Stack

CockroachDB is structured as five layered, decoupled subsystems that translate high-level SQL queries into low-level bytes on disk:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. SQL Layer                                                           │
│    PostgreSQL Wire Protocol • Parser • Cost-Based Optimizer • DistSQL │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Transaction Layer                                                   │
│    Strict Serializability • Write Intents • Parallel Commits • HLC    │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Distribution Layer                                                  │
│    Monolithic Keyspace (0x00..0xff) • 64 MB Ranges • Meta2 Index Table │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Replication Layer                                                   │
│    Multi-Raft Consensus Groups • Leaseholders • Automated Rebalancing  │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Storage Layer                                                       │
│    Pebble LSM-Tree (Pure Go) • MemTables • WAL • MVCC Time-Travel      │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: SQL Layer (Client Gateway & Optimization)
- **Symmetric Gateway**: Every node runs an identical binary. A client can connect to **any** node in the cluster using standard PostgreSQL drivers (port `26257`). That node acts as the **Gateway Coordinator** for the lifetime of that query.
- **Cost-Based Optimizer (CBO)**: Translates relational SQL AST into an optimized physical execution plan, taking statistical histogram distributions into account.
- **DistSQL (Distributed SQL)**: Queries involving aggregations, scans, or joins across millions of rows are distributed across the nodes that physically host those partitions, executing operations in parallel at the storage layer rather than streaming gigabytes of raw rows back to the gateway.

### Layer 2: Transaction Layer (Distributed ACID & Concurrency)
- Guarantees **SERIALIZABLE** isolation by default (ANSI SQL Level 4).
- Handles concurrency control using **Multi-Version Concurrency Control (MVCC)** paired with distributed locks known as **Write Intents**.
- Coordinates atomic distributed commits using the **Parallel Commits protocol**, reducing multi-region commit latency by 50%.

### Layer 3: Distribution Layer (Global Monolithic Keyspace)
- Rather than maintaining separate files per table, CockroachDB models the **entire database as a single sorted, continuous byte array** from `0x00` to `0xff`.
- System tables, user tables, and secondary indexes are all mapped into this unified keyspace using prefix encoding:
  ```
  /Table/<table_id>/Index/<index_id>/<primary_key_val>/<column_family> ──▶ Value
  ```
- The keyspace is partitioned into contiguous, ordered chunks called **Ranges** (default target size: **64 MB**).

### Layer 4: Replication Layer (Multi-Raft & Leaseholders)
- Each 64 MB Range is an independent **Raft consensus group** replicated across 3 or 5 physical nodes.
- Introduces **Multi-Raft**: Instead of running a single global Raft instance, a cluster with 100,000 ranges multiplexes 100,000 independent Raft groups over shared TCP connections and OS threads.
- Elects a dedicated **Leaseholder** per range to serve local reads without Raft consensus overhead.

### Layer 5: Storage Layer (Pebble LSM-Tree Engine)
- While early versions of CockroachDB used RocksDB (C++), the team developed **Pebble**—a pure-Go Log-Structured Merge-tree (LSM) storage engine.
- Eliminates Cgo foreign-function call overhead and Go-to-C++ memory copying.
- Encodes physical disk entries with MVCC timestamps: `Key @ HLC_Timestamp ──▶ Value`.

---

## 2. Hybrid Logical Clocks (HLC): Ordering Without Atomic Clocks

To provide serializable transactions across machines, a distributed database must determine the global ordering of events: *Did Transaction A commit before Transaction B started?*

### The TrueTime vs. NTP Dilemma
- **Google Spanner** solves this using **TrueTime**, an API backed by physical GPS receivers and atomic rubidium clocks deployed in every Google datacenter. TrueTime guarantees clock drift uncertainty is strictly bounded: $\epsilon \le 7\text{ ms}$.
- **CockroachDB's Challenge**: It was engineered to run anywhere—on AWS, Google Cloud, Azure, on-prem Kubernetes, or developer laptops—where servers only have access to standard **Network Time Protocol (NTP)**, which experiences clock drifts of $100\text{--}250\text{ ms}$.

To achieve linearizable causality on commodity hardware without TrueTime, CockroachDB implements **Hybrid Logical Clocks (HLC)** (based on Kulkarni et al., 2014).

```
Hybrid Logical Clock (HLC) Timestamp:
┌───────────────────────────────────────┬─────────────────────────────┐
│ Physical Component l (Wall-Clock ms) │ Logical Counter c (Integer) │
└───────────────────────────────────────┴─────────────────────────────┘
```

### The HLC Update Algorithm
Each node $j$ maintains an HLC timestamp $(l.j, c.j)$, and periodically observes its local physical clock $pt.j$:

1. **Local Event Generation (e.g., Transaction Start)**:
   - $l.j' = \max(l.j, pt.j)$
   - If $l.j' == l.j$, increment logical counter: $c.j' = c.j + 1$.
   - Else, reset counter: $c.j' = 0$.
2. **Receiving a Message from Node $k$ with Timestamp $(l.k, c.k)$**:
   - $l.j' = \max(l.j, pt.j, l.k)$
   - If physical times match across all sources ($l.j' == l.j == l.k$), set $c.j' = \max(c.j, c.k) + 1$.
   - Else if $l.j' == l.j$, set $c.j' = c.j + 1$.
   - Else if $l.j' == l.k$, set $c.j' = c.k + 1$.
   - Else, reset counter: $c.j' = 0$.

### Core HLC Invariants
1. **Strict Causality Preservation**: If event $e_1$ causally precedes $e_2$ ($e_1 \to e_2$, happens-before), then $HLC(e_1) < HLC(e_2)$ is mathematically guaranteed.
2. **Bounded Physical Drift**: The physical component $l.e$ never drifts unboundedly into the future: $|l.e - pt.e| \le \text{MaxOffset}$.
3. **The Node Suicide Protection Mechanism**: If a node's physical clock drifts beyond the cluster's `--max-offset` flag (default **500 ms**), the CockroachDB node **intentionally crashes itself** (`panic`). This fail-stop behavior protects the cluster from serializability corruption caused by catastrophic NTP drift.

---

## 3. Read Uncertainty & Serialization Restarts

While HLC guarantees that causal dependencies are ordered ($e_1 \to e_2 \implies HLC(e_1) < HLC(e_2)$), physical clocks can still drift within the window of $[-\text{MaxOffset}, +\text{MaxOffset}]$.

If two independent transactions execute concurrently on different nodes without message passing between them, **HLC alone cannot determine their absolute physical ordering**. This gives rise to the **Read Uncertainty Window**.

```
Transaction T1 read timestamp: t_read
Uncertainty Interval: [t_read, t_read + max_offset]

               t_read                      t_read + max_offset
─────────────────┼──────────────────────────────────┼─────────────────▶ Time
                 │   UNCERTAINTY WINDOW             │
                 │   (Value t_val found here!)      │
```

### How Read Uncertainty Restarts Work
When Transaction $T_1$ with read timestamp $t_{\text{read}}$ reads a key and encounters a value committed with timestamp $t_{\text{val}}$ such that:
$$t_{\text{read}} < t_{\text{val}} \le t_{\text{read}} + \text{MaxOffset}$$

The database cannot determine whether $t_{\text{val}}$ was written *before* $T_1$ began in physical reality (and should be visible) or *after* $T_1$ began (and should be hidden).

To preserve **Strict Serializability**, CockroachDB takes the conservative, fail-safe path:
1. It triggers a **Read Uncertainty Restart**.
2. The transaction bumps its read timestamp above $t_{\text{val}}$:
   $$t_{\text{read\_new}} = t_{\text{val}}$$
3. It transparently retries the transaction from the beginning.
4. If statements have already returned results to the client, CockroachDB surfaces standard PostgreSQL error code **`40001 (serialization_failure)`**, signaling the application to execute a client-side retry.

---

## 4. Multi-Raft Consensus & The Leaseholder Pattern

Standard Raft implementations (like `etcd` or `HashiCorp Consul`) manage a single consensus group. Replicating an entire multi-terabyte database through a single Raft log creates an unscalable bottleneck.

### Multi-Raft: Scaling Consensus to Millions of Ranges
CockroachDB breaks the keyspace into independent 64 MB Ranges, each managed by its own isolated Raft consensus group:
- A cluster with $50\text{ TB}$ of data has $\approx 800{,}000$ active Ranges.
- That means $800{,}000$ independent Raft consensus groups run simultaneously.
- **Resource Sharing**: Multi-Raft co-locates thousands of range consensus groups onto the same physical node, batching heartbeat ticks, network RPCs, and disk I/O into coalesced system calls.

```
Cluster Nodes:
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Node 1      │       │     Node 2      │       │     Node 3      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ Range 1 (Leader)│◀─────▶│ Range 1 (Follow)│◀─────▶│ Range 1 (Follow)│ ── Group 1
│ Range 2 (Follow)│◀─────▶│ Range 2 (Leader)│◀─────▶│ Range 2 (Follow)│ ── Group 2
│ Range 3 (Follow)│◀─────▶│ Range 3 (Follow)│◀─────▶│ Range 3 (Leader)│ ── Group 3
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### The Leaseholder Pattern: Zero-Overhead Linearizable Reads
In vanilla Raft, serving a linearizable read requires the Raft leader to execute a **heartbeat round with a majority of followers** before returning data, to prove it has not been deposed by a network partition (preventing stale reads from split-brain zombie leaders).

Doing a majority network roundtrip for every single `SELECT` query would destroy database read throughput. CockroachDB introduces the **Leaseholder**:

1. **Time-Bounded Exclusive Lease**: A range elects one of its replicas as the Leaseholder. The Leaseholder acquires a time-bounded lease (e.g., valid for 6 seconds) agreed upon via Raft consensus.
2. **Sole Point of Contact**: During the lease term, **no other replica can accept writes or grant another lease**.
3. **Local Read Execution**: Because the Leaseholder is mathematically guaranteed to be the only node capable of accepting writes for that Range, it can serve read queries **directly from its local Pebble storage engine** with zero network roundtrips!
4. **Co-location Optimization**: CockroachDB's rebalancing heuristics constantly ensure that for each Range, the **Raft Leader** and the **Leaseholder** reside on the exact same physical node, eliminating intra-node coordination hops.

---

## 5. Distributed Transactions: Write Intents & Parallel Commits

How does CockroachDB execute multi-row, multi-range transactions without distributed deadlocks or centralized lock managers?

### The Write Intent Mechanism
CockroachDB does not maintain lock tables in memory like Oracle or PostgreSQL. Instead, it writes **Write Intents** directly into the storage layer:
- A Write Intent is an MVCC key-value record that contains provisional data, a lock marker, and a pointer to a **Transaction Record**.
- The **Transaction Record** is an atomic record stored in the range containing the transaction's first write, tracking states:
  $$\text{PENDING} \longrightarrow \text{COMMITTED} \quad \text{or} \quad \text{ABORTED}$$

```
Concurrent Reader Encountering a Write Intent:
Reader ──▶ Inspects Key ──▶ Sees "Write Intent" ──▶ Follows Pointer to Transaction Record
                                                                  │
              ┌───────────────────────────────────────────────────┴─────────────────┐
              ▼                                                                     ▼
       Status: COMMITTED                                                     Status: PENDING
       (Reader treats intent as valid committed data)                        (Reader waits on Lock Table / pushes timestamp)
```

### The Evolution to Parallel Commits (1-RTT Distributed Commits)

Historically, distributed transactions across ranges required a two-phase commit (2PC) protocol requiring **2 network roundtrips (2-RTT)**:
1. *Roundtrip 1*: Write all Write Intents across participating ranges.
2. *Roundtrip 2*: Write `COMMITTED` to the Transaction Record.

In multi-region clusters spanning North America, Europe, and Asia, 2 cross-region roundtrips added $150\text{--}300\text{ ms}$ of transaction latency.

**CockroachDB's Parallel Commits Protocol** cuts this to **1 network roundtrip (1-RTT)**:

```
Standard 2PC (2 Roundtrips):
Coordinator ──▶ 1. Write Intents (RTT 1) ──▶ 2. Write COMMITTED to Tx Record (RTT 2) ──▶ Client ACK

CockroachDB Parallel Commits (1 Roundtrip):
Coordinator ──┬──▶ Write Intents across all Ranges (in parallel) ─────────────┐
              └──▶ Write Tx Record as "STAGING" with Intent Manifest ────────┼──▶ Client ACK (1 RTT!)
                                                                              │
                                       (Consensus Quorums Acknowledged in Parallel)
```

1. **Transactional Pipelining**: As the client executes SQL statements, write intents are pipelined asynchronously to their respective range leaseholders.
2. **Staging State**: When the client issues `COMMIT`, the coordinator writes the Transaction Record in the `STAGING` state, inlining an array of all keys being modified.
3. **Implicit Commit Rule**: The transaction is considered committed the instant **both** the `STAGING` record and all in-flight Write Intents achieve Raft quorum ACKs concurrently.
4. **Instant Client ACK**: The coordinator responds to the client immediately upon completion of the single roundtrip. Intent resolution (cleaning up provisional lock markers) occurs asynchronously in the background.

---

## 6. Pebble Storage Engine: Replacing RocksDB with Pure Go

For its first four years, CockroachDB used RocksDB as its underlying local storage engine. However, as cluster scale grew, RocksDB became a major architectural bottleneck:

| Challenge | RocksDB (C++) | Pebble (Pure Go) |
|---|---|---|
| **Language & FFI** | C++ accessed via Go `cgo` bridge. Every read/write crossed language boundaries ($\approx 100\text{ ns}$ per FFI invocation). | Pure Go. Inlines function calls directly; zero Cgo crossing overhead. |
| **Memory Allocation** | C++ allocated memory outside the Go runtime. Go profilers could not see C++ heap leaks. | Go-native memory management. Directly visible to Go runtime and pprof tooling. |
| **Compaction Tuning** | Generic LSM compaction engine with hundreds of opaque flags. | Tailored specifically for CockroachDB's MVCC split-range access patterns. |
| **Range Deletion** | Deleting a range generated millions of tombstone keys, stalling read scans. | Fast range-tombstone support (`DeleteRange`) optimized for CockroachDB range splits and drops. |

Pebble retains the LSM-tree storage layout:
- In-memory **MemTables** accept append-only writes via WAL logs.
- Flushed sequentially to **SSTables (SSTs)** organized into hierarchical levels ($L_0$ through $L_6$).
- Sequential disk writes ensure that CockroachDB achieves maximum NVMe SSD write throughput without triggering flash block erase write-amplification.

---

## 7. Architectural Comparison: CockroachDB vs. Google Spanner vs. PostgreSQL

| Dimension | CockroachDB | Google Cloud Spanner | Traditional PostgreSQL |
|---|---|---|---|
| **SQL Compatibility** | PostgreSQL wire protocol & dialect | Proprietary SQL (GoogleSQL) | Native PostgreSQL |
| **Hardware Dependency** | Commodity hardware / Any cloud (NTP) | Proprietary atomic clocks & GPS (TrueTime) | Standard single-node hardware |
| **Clock Synchronization** | **Hybrid Logical Clocks (HLC)** | **TrueTime API** ($\epsilon \le 7\text{ ms}$) | Local OS wall clock |
| **Consensus Algorithm** | **Multi-Raft** per 64 MB Range | **Multi-Paxos** per Split | None (or Patroni / Raft plugin) |
| **Transaction Isolation** | **Strict SERIALIZABLE** (default) | **Strict SERIALIZABLE** | Read Committed (default) |
| **Read Routing** | Direct from **Leaseholder** (0-RTT Raft) | Direct from **Paxos Leader** | Read replicas (stale lag) |
| **Commit Latency** | 1-RTT via **Parallel Commits** | 1-RTT + TrueTime commit wait ($\approx 2\epsilon$) | Local fsync to WAL |
| **Horizontal Scaling** | Automatic range splitting & rebalancing | Automatic split management | Manual sharding (Citus / PgBouncer) |
| **Failure Recovery** | Automatic sub-second Raft re-election | Automatic sub-second Paxos re-election | Manual or scripted failover (failover lag) |

---

## 8. Two-Level Range Indexing (`Meta1` & `Meta2`)

How does any arbitrary gateway node in a 500-node CockroachDB cluster locate which physical node holds the Leaseholder for key `user_987654` without querying a centralized master?

CockroachDB models the **entire database as a single sorted monolithic key-value keyspace**. System metadata itself is stored in the very same keyspace as user data, indexed using a B-tree-like structure with two metadata layers: `Meta1` and `Meta2`.

```
                    ┌──────────────────────────────────────────────┐
                    │               Range 1 (Meta1)                │
                    │        (Root of the Range Directory)         │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    ▼                                              ▼
       ┌─────────────────────────┐                    ┌─────────────────────────┐
       │     Range 2 (Meta2)     │                    │     Range 3 (Meta2)     │
       │    Keys: [meta2_a ... m) │                    │    Keys: [meta2_n ... z) │
       └────────────┬────────────┘                    └────────────┬────────────┘
                    │                                              │
         ┌──────────┴──────────┐                        ┌──────────┴──────────┐
         ▼                     ▼                        ▼                     ▼
┌─────────────────┐   ┌─────────────────┐      ┌─────────────────┐   ┌─────────────────┐
│ User Range: A-G │   │ User Range: H-M │      │ User Range: N-S │   │ User Range: T-Z │
│ (Leaseholder N1)│   │ (Leaseholder N4)│      │ (Leaseholder N2)│   │ (Leaseholder N5)│
└─────────────────┘   └─────────────────┘      └─────────────────┘   └─────────────────┘
```

### The Lookup Mechanics:
1. **Range 1 (`Meta1`)**: The very first 64 MB range in the cluster is special. It contains the address descriptors for all `Meta2` ranges. Because Range 1 is fixed and replicated across the cluster, every node knows its replica locations at startup.
2. **`Meta2` Ranges**: Contain the actual range descriptors for all **user tables and indexes**, including the range boundaries `[start_key, end_key)`, replica node IDs, and current leaseholder leases.
3. **Gateway Caching & Amortized $O(1)$ Routing**:
   - Every node maintains an in-memory cache of `Meta2` descriptors and leaseholders.
   - For 99.9% of user queries, the gateway node resolves the key's target Leaseholder from its local in-memory cache with **$0$ network roundtrips**.
   - If a range has split or the lease has moved, the target node rejects the request with an `EpochStaleError`. The gateway clears its cache, walks the two-level tree to refresh the descriptor, and retries transparently.

---

## 9. Multi-Region Data Topologies & Low-Latency Locality

CockroachDB eliminates cross-ocean WAN latency through declarative SQL table localities. Instead of operating separate regional databases with fragile batch ETL, you define geographic constraints directly in table schemas:

```sql
-- Configure database regions
ALTER DATABASE e_commerce SET PRIMARY REGION "us-east-1";
ALTER DATABASE e_commerce ADD REGION "eu-west-1";
ALTER DATABASE e_commerce ADD REGION "ap-southeast-1";
ALTER DATABASE e_commerce SET SURVIVE REGION FAILURE;
```

CockroachDB provides three distinct multi-region table topologies:

### 1. `REGIONAL TABLES` (Single-Region Home)
- All replicas and the Leaseholder for the table are pinned to a specific home region (e.g., `us-east-1`).
- Reads and writes within that home region achieve **local sub-millisecond latencies**.
- Access from other regions incurs WAN latency to reach the home leaseholder.

### 2. `REGIONAL BY ROW` (Data Locality by Partition Key)
Ideal for multi-tenant SaaS, GDPR compliance, and banking accounts where data belongs to a specific user domicile:

```sql
CREATE TABLE users (
    user_id UUID DEFAULT gen_random_uuid(),
    region crdb_region NOT NULL,
    full_name STRING,
    balance DECIMAL,
    PRIMARY KEY (region, user_id)
) LOCALITY REGIONAL BY ROW;
```

- CockroachDB transparently fragments the table's 64 MB ranges based on the hidden or explicit `crdb_region` column.
- European users' rows reside strictly on European nodes; US users' rows reside on US nodes.
- Writes and reads achieve local NVMe latency ($\approx 2\text{--}5\text{ ms}$) with zero cross-region hops while preserving a single unified SQL view across the globe.

### 3. `GLOBAL TABLES` (Zero-Latency Reads Cluster-Wide)
For reference data that is rarely written but read millions of times per second worldwide (e.g., product catalogs, exchange rates, postal codes):

```sql
CREATE TABLE product_catalog (
    sku STRING PRIMARY KEY,
    title STRING,
    price_cents INT
) LOCALITY GLOBAL;
```

- Global tables replicate data to **every region**.
- Reads are served locally from the nearest replica without consulting the Leaseholder by evaluating data at a bounded historical MVCC timestamp (closed timestamps), achieving **$0\text{ ms}$ WAN latency**.
- Writes incur an extended cross-region 2PC roundtrip to safely invalidate cached reads across all regions.

---

## 10. Online, Non-Blocking Schema Changes

In traditional relational engines (MySQL `ALTER TABLE` locks, older PostgreSQL versions), adding an index or dropping a column on a multi-terabyte table takes exclusive table-level locks (`AccessExclusiveLock`), blocking reads and writes for hours.

CockroachDB executes all schema changes **online with zero table locking**, using a multi-phase asynchronous state machine inspired by Google F1:

```
┌──────────┐      ┌─────────────┐      ┌────────────┐      ┌──────────┐
│  ABSENT  │ ──▶  │ DELETE_ONLY │ ──▶  │ WRITE_ONLY │ ──▶  │  PUBLIC  │
└──────────┘      └─────────────┘      └────────────┘      └──────────┘
```

1. **`ABSENT`**: The schema change is initiated. Nodes across the cluster are still unaware of the new index/column.
2. **`DELETE_ONLY`**:
   - Prevents stale records: If a node deletes an existing row, it also deletes the corresponding index entry in the new index.
   - However, new `INSERT` statements do not yet populate this index.
3. **`WRITE_ONLY`**:
   - Nodes now write new entries for `INSERT` and `UPDATE` into the new index, ensuring no new entries are missed.
   - The query planner still hides the index from `SELECT` queries because existing historical rows have not yet been backfilled.
4. **Historical Backfill**:
   - Background leaseholder jobs scan existing table ranges and backfill all pre-existing rows into the new index in chunked, low-priority transactions.
5. **`PUBLIC`**:
   - Once backfill reaches 100% and all cluster nodes have acknowledged the new schema descriptor, the index is marked `PUBLIC`. The cost-based optimizer immediately routes queries to it.

---

## 11. Change Data Capture (CDC) & Core Changefeeds

Instead of deploying external log-scraping debezium agents that poll PostgreSQL WAL files, CockroachDB features an integrated distributed **Changefeed engine**:

```sql
-- Stream real-time mutations directly to Apache Kafka
CREATE CHANGEFEED FOR TABLE orders, order_items
INTO 'kafka://broker1:9092,broker2:9092?topic_name=orders_cdc'
WITH resolved = '1s', updated;
```

### CDC Mechanics Under the Hood:
- **Direct Leaseholder Streaming**: Each 64 MB Range Leaseholder pushes committed MVCC mutation events directly over HTTP/Kafka sockets. There is no single central broker bottleneck.
- **Resolved Timestamps**: In a distributed system, physical arrival order across partitions can be out-of-order. CockroachDB periodically emits `{"resolved": "1718000000.000000000"}` markers guaranteeing that **no future transaction will ever commit with a timestamp earlier than the resolved marker**. Downstream consumers (Kafka Streams, Flink) use this for exactly-once deterministic stream processing.

---

## 12. Client-Side Retry Pattern for SQLSTATE `40001`

Because CockroachDB enforces strict `SERIALIZABLE` isolation by default, concurrent transactions modifying overlapping keys or encountering read uncertainty windows will occasionally trigger an optimistic concurrency conflict:

$$\text{ERROR: restart transaction: TransactionRetryWithProtoRefreshError (SQLSTATE 40001)}$$

Production applications **must** implement client-side transaction retries with exponential backoff and randomized jitter.

### Production Java / Spring Boot Retry Implementation

```java
package dev.luminhkhuong.crdb;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class CockroachTransactionService {

    private static final Logger log = LoggerFactory.getLogger(CockroachTransactionService.class);
    private static final int MAX_RETRIES = 5;
    private static final long INITIAL_BACKOFF_MS = 20;

    private final DataSource dataSource;

    public CockroachTransactionService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Executes a transactional lambda with robust CockroachDB SQLSTATE 40001 retry logic.
     */
    public void executeWithRetry(TransactionCallback callback) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);

            int attempts = 0;
            while (true) {
                Savepoint sp = null;
                try {
                    // CockroachDB savepoint nesting allows server-side priority elevation
                    sp = conn.setSavepoint("cockroach_restart");

                    callback.doInTransaction(conn);

                    // If reached without exception, release savepoint and commit
                    conn.releaseSavepoint(sp);
                    conn.commit();
                    return;

                } catch (SQLException ex) {
                    // SQLSTATE 40001 = serialization_failure / transaction retry error
                    if ("40001".equals(ex.getSQLState()) && attempts < MAX_RETRIES) {
                        attempts++;
                        long jitter = ThreadLocalRandom.current().nextLong(5, 25);
                        long backoff = (INITIAL_BACKOFF_MS * (1L << (attempts - 1))) + jitter;

                        log.warn("Encountered CRDB SQLSTATE 40001 serialization conflict (attempt {}/{}). Retrying in {}ms...",
                                attempts, MAX_RETRIES, backoff);

                        if (sp != null) {
                            try {
                                conn.rollback(sp);
                            } catch (SQLException rbEx) {
                                conn.rollback();
                            }
                        } else {
                            conn.rollback();
                        }

                        try {
                            Thread.sleep(backoff);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new SQLException("Thread interrupted during transaction retry backoff", ie);
                        }
                    } else {
                        // Unrecoverable SQL error or max retries exceeded
                        conn.rollback();
                        throw ex;
                    }
                }
            }
        }
    }

    @FunctionalInterface
    public interface TransactionCallback {
        void doInTransaction(Connection conn) throws SQLException;
    }
}
```

---

## 13. Principal Engineer System Design Review FAQ

### Q1: What happens if a node's physical clock drifts by 2 seconds in CockroachDB?
> CockroachDB checks physical clock drift against `--max-offset` on every heartbeat round. If a node discovers that its local physical clock differs from cluster peers by more than `--max-offset` (default $500\text{ ms}$), the node triggers a **fatal crash panic**. It self-terminates to protect the cluster from generating causality inversions or violating Serializable isolation.

### Q2: Why does CockroachDB use 64 MB Ranges instead of larger 1 GB partitions?
> Small 64 MB ranges provide fine-grained operational agility:
> 1. **Sub-second Rebalancing**: Transferring a 64 MB range across nodes during automated cluster rebalancing takes $\approx 50\text{--}100\text{ ms}$ over 10 GbE networks, preventing network saturation.
> 2. **Fast Recovery**: If a node crashes, its thousands of 64 MB ranges are scattered across dozens of surviving nodes. All surviving nodes re-replicate missing replicas in parallel, completing cluster-wide recovery in seconds rather than hours.
> 3. **Minimal Blast Radius**: An active split or compaction event only locks a tiny 64 MB keyspace slice for milliseconds.

### Q3: When should you NOT use CockroachDB?
> 1. **Ultra-Low Latency Single-Node Writes**: If your workload demands sub-millisecond write latency ($&lt; 1\text{ ms}$), a single-node PostgreSQL instance with local SSD will outperform CockroachDB because it does not require network Raft consensus.
> 2. **Massive OLAP / Analytical Scans**: CockroachDB is optimized for distributed OLTP. For petabyte-scale data warehousing with complex star-schema joins, columnar analytical engines (ClickHouse, Snowflake, BigQuery) are vastly more cost-effective.
> 3. **Extensive Legacy PostgreSQL Extensions**: CockroachDB implements the PostgreSQL wire protocol and SQL syntax, but does **not** support native C extensions like PostGIS (CockroachDB has custom spatial support), `pg_partman`, or custom procedural languages (PL/pgSQL is only partially supported).

---

## Related Knowledge & Further Reading

- [Data Consistency & Transactions Deep Dive](./data-consistency.md) — 7-level consistency spectrum from Linearizability to Eventual Consistency.
- [Distributed Transactions: 2PC vs. Saga Pattern](./distributed-transactions.md) — Multi-step transaction coordination patterns.
- [CAP Theorem Revisited & PACELC](./cap-theorem.md) — Real-world partition trade-offs.
- [PostgreSQL Heap Storage Architecture](../database/postgresql-heap-storage-architecture.md) — 8KB slotted page storage vs LSM trees.
