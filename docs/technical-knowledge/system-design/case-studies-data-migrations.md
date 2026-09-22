---
id: case-studies-data-migrations
title: "Real-World Case Studies: Petabyte Data Stores & Zero-Downtime Migrations"
sidebar_label: 💾 Data & Migrations
description: Comprehensive Staff-level architectural breakdown of 8 landmark petabyte storage engines and zero-downtime database migrations — Dropbox Magic Pocket, Discord ScyllaDB, YouTube Vitess, GitHub MySQL 8, Pinterest 64-bit sharding, Instagram Rocksandra, Figma multiplayer, and WhatsApp Erlang.
tags: [case-study, system-design, database, data-migration, dropbox, discord, youtube, vitess, github, pinterest, instagram, figma, whatsapp]
---

import CaseStudiesDataMigrationsDiagram from '@site/src/components/CaseStudiesDataMigrationsDiagram';

# Real-World Case Studies: Petabyte Data Stores & Migrations

Migrating data at petabyte and exabyte scale without taking downtime, corrupting state, or dropping transactional mutations is one of the most demanding disciplines in distributed systems engineering. When off-the-shelf databases reach physical memory, I/O, or operational limits, premier engineering organizations invent custom storage engines, novel sharding schemes, and zero-downtime dual-writing pipelines.

This comprehensive guide analyzes eight iconic data store designs and migration case studies from **Dropbox, Discord, YouTube, GitHub, Pinterest, Instagram, Figma, and WhatsApp**.

<CaseStudiesDataMigrationsDiagram />

---

## 1. Dropbox Magic Pocket: Exabyte Object Storage Migration

In 2014, Dropbox was one of the largest customers of Amazon AWS S3, storing hundreds of petabytes of user files. To optimize margin economics, gain full hardware control, and tailor software directly to immutable file chunks, Dropbox executed one of the largest infrastructure migrations in Internet history: migrating **over 500 Petabytes of user data off AWS S3 into custom on-premise datacenters** with zero user downtime.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DROPBOX MAGIC POCKET ARCHITECTURE                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  User File Chunk (4 MB)                                                                │
│        │                                                                               │
│        ▼                                                                               │
│  ┌───────────────────────────────────────────────────────────┐                         │
│  │ 8+9 Reed-Solomon Erasure Coding Engine (Galois Field 2^8) │                         │
│  └─────────────────────────────┬─────────────────────────────┘                         │
│                                │ Split into 17 Shards (4 MB / 8 = 512 KB per shard)    │
│        ┌───────────────────────┴───────────────────────┐                               │
│        ▼                                               ▼                               │
│  [8 Data Shards: D1..D8]                     [9 Parity Shards: P1..P9]                 │
│        │                                               │                               │
│        ▼                                               ▼                               │
│  Stored across 17 distinct physical racks in custom Disk Pack Chassis (SMR drives)     │
│  ✓ Survives simultaneous loss of ANY 9 disks or 9 full server racks                    │
│  ✓ Raw hardware overhead slashed from 200% (3x replication) to 112.5%                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Storage Overhead Crisis
Standard distributed object storage systems use **3x replication** (storing 3 identical copies of each chunk across 3 availability zones or racks).
- For 500 Petabytes of user files, 3x replication requires purchasing and powering **1,500 Petabytes (1.5 Exabytes) of raw hard disk drives**—a **200% raw hardware overhead**.
- At multi-hundred-petabyte scale, the annual capital expenditure (CapEx) and operational expenditure (OpEx) for power, cooling, and drive replacement becomes unsustainable.

### The Solution: 8+9 Reed-Solomon Erasure Coding
Dropbox engineered **Magic Pocket** in Rust and Go, replacing 3x replication with an **8+9 Reed-Solomon Erasure Coding** scheme:
- A file chunk is divided into **$k = 8$ data blocks**.
- The mathematical erasure coding algorithm generates **$m = 9$ parity blocks** using matrix multiplication over a Galois Field $GF(2^8)$.
- Total blocks = $k + m = 17$ blocks.
- **Physical Placement Invariant**: Each of the 17 blocks is written to a distinct physical server rack and power domain across the datacenter.
- **Extreme Durability**: Magic Pocket can survive the simultaneous loss of **any 9 disks or 9 entire server racks** without data loss. Any $k = 8$ blocks from the 17 are sufficient to mathematically reconstruct the original chunk:
  $$\text{Storage Overhead} = \frac{k + m}{k} = \frac{8 + 9}{8} = 2.125 \implies \mathbf{112.5\% \text{ overhead}}$$
  This slashed raw drive requirements compared to 3x replication ($3.0 / 2.125 \approx 30\%$ total raw drive reduction across 500+ PB), saving Dropbox tens of millions of dollars annually.

### Hardware-Software Co-Design
- **Custom Disk Pack Chassis**: Dropbox designed custom 1U/4U storage sleds packed with high-density Shingled Magnetic Recording (SMR) drives.
- **Immutable Append-Only Block Engine**: Because Magic Pocket treats stored chunks as immutable content-addressed blobs (keyed by SHA-256 hash), drives avoid random write head movement, allowing high-throughput sequential disk writes.

### Degraded Read Performance Trade-Off
- **The Gotcha**: Under normal conditions, reading a chunk requires fetching only the 8 data blocks. However, if a disk or rack is offline, the system must execute a **degraded read**: fetching 8 surviving blocks across the network and performing CPU-intensive matrix inversion to reconstruct the missing blocks, adding tail latency.
- **The Mitigation**: Magic Pocket deploys front-end NVMe SSD caching layers that cache popular blocks and actively repair missing blocks in the background before users experience degraded read penalties.

---

## 2. Discord: Trillions of Messages from Cassandra to ScyllaDB

In 2017, Discord migrated its core chat message storage from MongoDB to Apache Cassandra. By 2022, Discord stored **trillions of messages** and processed millions of read/write requests per second. However, Cassandra began experiencing catastrophic latency spikes and JVM operational instability.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 DISCORD MESSAGE STORAGE: CASSANDRA VS SCYLLADB                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  APACHE CASSANDRA (JVM)                      SCYLLADB (C++ SEASTAR)                    │
│  ┌────────────────────────────────────┐      ┌────────────────────────────────────┐    │
│  │ JVM Heap (32GB+)                   │      │ Thread-Per-Core (Shared-Nothing)   │    │
│  │ ✖ Stop-the-World GC (up to 2-5s)   │      │ ✓ Zero GC Stalls (Deterministic)   │    │
│  │ ✖ Tombstone scanning cliffs        │      │ ✓ Dynamic memory arenas per core   │    │
│  │ ✖ Kernel thread context-switching  │      │ ✓ Lock-free inter-core queues      │    │
│  │ P99 Read Latency: > 1,000ms        │      │ P99 Read Latency: < 15ms           │    │
│  └────────────────────────────────────┘      └────────────────────────────────────┘    │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Cassandra JVM Bottlenecks

#### 1. JVM Stop-The-World (STW) Garbage Collection Spikes
Cassandra is written in Java. When queries scanned large partition buckets, millions of short-lived Java objects (`ByteBuffer`, `Cell`, `Row`) were allocated on the JVM heap. This triggered unpredictable G1GC / CMS garbage collection pauses, causing latency spikes up to **2–5 seconds** that caused client connection timeouts.

#### 2. The Tombstone Scanning Cliff
In Cassandra's LSM architecture, deleting a message does not erase bytes from disk immediately; it writes a **tombstone marker**. In Discord channels where bots routinely purged messages or users deleted conversations:
- Fetching the last 50 messages required Cassandra to scan through **hundreds of thousands of consecutive tombstones**.
- When the tombstone count exceeded `tombstone_failure_threshold` (default 100,000), Cassandra aborted the query entirely with a `ReadFailureException`.
- Compactions struggled to clear tombstones because surviving replicas held different tombstone expiration timestamps (`gc_grace_seconds`).

#### 3. Hot Partition Thrashing
When massive announcement channels (e.g. Fortnite or Midjourney servers) received hundreds of thousands of concurrent reads, Cassandra's row-cache and OS page-cache thrashing caused CPU starvation across the node.

### The Solution: ScyllaDB (C++ Seastar Framework)
Discord migrated trillions of messages to **ScyllaDB**, a ground-up C++ rewrite of Apache Cassandra:
- **Shared-Nothing Thread-Per-Core**: ScyllaDB utilizes the **Seastar asynchronous framework**. Each physical CPU core is assigned an independent execution thread, its own local memory arena, dedicated NUMA node access, and its own direct NVMe queue. There are zero inter-thread locks on the critical read/write path.
- **Zero JVM Garbage Collection**: Because memory is managed natively in C++ using custom slab allocators, GC pauses are physically impossible.
- **Direct AIO/DIO**: ScyllaDB bypasses the Linux page cache using asynchronous Direct I/O (`O_DIRECT`), eliminating double-buffering and memory bloat.

### The Zero-Downtime Migration Architecture
1. **Rust Data Migrator**: Discord developed a custom high-performance Rust migration service that scanned Cassandra token ranges using token-aware pagination.
2. **Dual-Writing Ingestion**: Discord's application gateways dual-wrote new messages to both Cassandra and ScyllaDB.
3. **Continuous Verification**: A shadow reader compared reads from both clusters, verifying 100% bitwise parity.
4. **Results**:
   - P99 read latency plummeted from **over 1,000ms down to a stable 15ms**.
   - The database server footprint was reduced by **over 60%**, eliminating JVM GC tuning firefighting entirely.

---

## 3. YouTube + Vitess: Transparent MySQL Horizontal Sharding

YouTube began as a Python monolith running on a single monolithic MySQL database. As global video uploads and comment threads exploded to billions of daily views, YouTube faced an existential dilemma: a single MySQL master could not sustain write throughput.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              YOUTUBE VITESS TOPOLOGY                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│                                Application Tier (Web / API)                            │
│                                             │                                          │
│                                             ▼                                          │
│                               ┌───────────────────────────┐                            │
│                               │   VTGate (Stateless L7)   │                            │
│                               │  • Parses standard SQL    │                            │
│                               │  • Evaluates VSchema      │                            │
│                               │  • Scatter-gather routing │                            │
│                               └─────────────┬─────────────┘                            │
│                                             │                                          │
│                     ┌───────────────────────┴───────────────────────┐                  │
│                     ▼                                               ▼                  │
│       ┌───────────────────────────┐                   ┌───────────────────────────┐    │
│       │   VTTablet (Shard -80)    │                   │   VTTablet (Shard 80-)    │    │
│       │  • Connection pooling     │                   │  • Connection pooling     │    │
│       │  • Query deduplication    │                   │  • Query deduplication    │    │
│       │  • Row memory caps        │                   │  • Row memory caps        │    │
│       └─────────────┬─────────────┘                   └─────────────┬─────────────┘    │
│                     ▼                                               ▼                  │
│          MySQL Primary (-80)                             MySQL Primary (80-)           │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Architectural Dilemma
- Moving to a NoSQL store (e.g. Cassandra or Bigtable) would have required thousands of YouTube engineers to rewrite millions of lines of application code, abandoning relational SQL semantics, transactions, secondary indexes, and joins.
- Sharding MySQL manually at the application layer requires hardcoding shard IDs into application queries, making resharding painful and error-prone.

### The Solution: Vitess
YouTube built and open-sourced **Vitess**, a database clustering middleware layer that presents thousands of underlying MySQL instances as a single logical relational database.

#### Core Vitess Components:
1. **VTGate (Stateless SQL Router)**:
   - Applications connect to VTGate using standard MySQL drivers (`port 3306`).
   - VTGate parses incoming SQL ASTs, inspects the **VSchema** (Vitess Sharding Schema), and determines whether the query targets a single shard or requires a scatter-gather across multiple shards.
   - Merges results, handles cross-shard ordering (`ORDER BY`), and enforces query timeouts.
2. **VTTablet (Database Sidecar)**:
   - Runs as a sidecar alongside every physical MySQL instance.
   - **Connection Pool Management**: Manages thousands of application connections, pooling them down to a small, fixed pool (e.g. 50–100 active connections) to protect MySQL from the "connection explosion" cliff.
   - **Query Consolidation (SingleFlight)**: If 500 identical read queries arrive simultaneously for the same video metadata row, VTTablet executes the query once against MySQL and shares the result among all 500 callers.
3. **VSchema (Declarative Sharding Model)**:
   - Defines keyspaces and keyspace IDs using cryptographic hash functions (e.g. `hash(keyspace_id) = Murmur3`).
   - Shards are defined as hexadecimal ranges, e.g., Shard `[-80)` and Shard `[80-)`.

### Zero-Downtime Online Resharding (VReplication)
When Shard `[-80)` fills up:
1. Vitess provisions two target shards: `[-40)` and `[40-80)`.
2. **VReplication Stream**: VTTablet streams binary logs from the source shard, continuously copying rows and transforming them into the target shards.
3. **Replication Catch-Up**: Target shards catch up until replication lag is $< 100\text{ms}$.
4. **Atomic Cutover**: VTGate pauses write routing for $< 50\text{ms}$, verifies target shards are in sync, flips the VSchema routing pointer, and unpauses writes. Total application downtime: **0 seconds**.

---

## 4. GitHub: Zero-Downtime MySQL 5.7 to 8.0 Fleet Upgrade

GitHub’s core relational data tier runs on MySQL. In 2023, GitHub completed a multi-year engineering effort upgrading all production database clusters from MySQL 5.7 to MySQL 8.0 without causing a single second of scheduled maintenance window downtime.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   GITHUB ZERO-DOWNTIME REPLICATION CUTOVER                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  Phase 1: Dual-Version Replication Chain                                               │
│  ┌─────────────────────────┐                                                           │
│  │ MySQL 5.7 Primary (RW)  │                                                           │
│  └────────────┬────────────┘                                                           │
│               │ binlog async replication                                               │
│               ▼                                                                        │
│  ┌─────────────────────────┐         ┌─────────────────────────┐                       │
│  │ MySQL 5.7 Replica (RO)  │ ──────► │ MySQL 8.0 Replica (RO)  │ ◄── Shadow Reads Test │
│  └─────────────────────────┘ binlog  └─────────────────────────┘                       │
│                                                                                        │
│  Phase 2: Orchestrator Raft Failover Promotion (< 10 seconds)                          │
│  1. Orchestrator detects planned switchover.                                           │
│  2. Sets MySQL 5.7 Primary to read-only (`SET GLOBAL read_only = ON`).                 │
│  3. Waits for MySQL 8.0 Replica to reach binlog coordinates (lag = 0).                 │
│  4. Promotes MySQL 8.0 to Primary (`SET GLOBAL read_only = OFF`).                      │
│  5. HAProxy / ProxySQL routes application write pool to MySQL 8.0 Primary.             │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Migration Arsenal: `gh-ost` and Orchestrator

#### 1. `gh-ost` (GitHub Online Schema Transmogrifier)
Traditional online schema migration tools (like `pt-online-schema-change`) rely on MySQL SQL triggers.
- **The Trigger Hazard**: Triggers execute synchronously inside user write transactions, compounding lock contention, exhausting thread pools, and causing write stalls.
- **The `gh-ost` Difference**: `gh-ost` does **not** use triggers. It connects to MySQL as an asynchronous replication client, tails the binary log (`binlog`), copies historical rows in throttled chunks, and replays binlog delta events into a ghost table. It swaps the table atomically in $< 1\text{ms}$ using a double `RENAME TABLE` metadata lock.

#### 2. Orchestrator for High Availability & Topology Management
- GitHub uses **Orchestrator** to continuously discover, poll, and map MySQL replication topologies.
- Orchestrator uses **Raft consensus** across nodes to eliminate split-brain master promotions.
- Capable of executing automated master promotions and topology rewiring in $< 10$ seconds.

#### 3. Shadow Reads & Query Planner Auditing
MySQL 8.0 introduced a completely overhauled query optimizer (e.g. hash joins replacing block nested loops). A query that executed in 5ms on MySQL 5.7 could regress to a 3-second full table scan on 8.0 if the optimizer picked a different index path.
- GitHub mirrored production read traffic to MySQL 8.0 replicas for months prior to cutover.
- Queries exhibiting plan regressions had index hints (`FORCE INDEX`) applied or optimizer flags adjusted before live promotion.

---

## 5. Pinterest: 64-Bit MySQL Sharding Architecture

In 2011–2012, Pinterest experienced explosive viral growth. Its initial database—a monolithic MySQL instance with read replicas on AWS—collapsed under write saturation. After briefly evaluating Cassandra 0.7/0.8 (which proved unstable under production write storms at the time), Pinterest chose to scale horizontally using **bare MySQL instances partitioned by a deterministic 64-bit ID layout**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         PINTEREST 64-BIT SHARDED ID LAYOUT                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌───────────────────────┬───────────────────────────┬───────────────────────────────┐ │
│  │ 16 Bits: Shard ID     │ 10 Bits: Entity Type ID   │ 38 Bits: Auto-Increment ID    │ │
│  │ (0 to 65,535)         │ (Pin=1, User=2, Board=3)  │ (Up to 274 Billion Rows)      │ │
│  └───────────────────────┴───────────────────────────┴───────────────────────────────┘ │
│                                                                                        │
│  • Shard Routing: Direct O(1) bitshift: `shard_id = (entity_id >> 48) & 0xFFFF`       │
│  • Logical Sharding: 4,096 logical databases mapped across physical servers           │
│  • Co-location: User pins & boards share the same Shard ID prefix                     │
│  • Cross-Shard Joins: Strictly FORBIDDEN at database tier; joined in app memory       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Decisions:

#### 1. Deterministic 64-Bit Integer IDs
Pinterest structured all 64-bit database primary keys with explicit routing semantics:
- **16 Bits (Bits 48–63)**: `Shard ID`. Allows up to $2^{16} = 65,536$ logical shards.
- **10 Bits (Bits 38–47)**: `Entity Type`. Identifies whether the entity is a Pin, User, Board, or Comment.
- **38 Bits (Bits 0–37)**: `Local Sequence ID`. Auto-incrementing integer local to that specific table on that shard ($2^{38} \approx 274\text{ Billion records}$ per type per shard).

#### 2. Logical Shards vs Physical Nodes
- Pinterest started by provisioning **4,096 logical MySQL databases** (named `db0000` through `db4095`) distributed across **8 physical EC2 database servers** (512 logical databases per server).
- **Zero Re-hashing Out-of-Capacity**: When the 8 physical servers reached 70% disk capacity, Pinterest provisioned 8 additional servers. Moving 256 logical databases from each original server to the new servers required simple MySQL replication and updating an in-memory application configuration dictionary. No row-level rehashing was necessary!

#### 3. Co-location of User Data
- When User 123 (whose data is on Shard 42) creates a new Board or Pin, the newly generated Pin ID is assigned `Shard 42` as its prefix.
- All pins, boards, and user actions for User 123 are physically co-located on the same shard, allowing fast local transactions and eliminating cross-shard network queries.

#### 4. The Golden Rule: No Cross-Shard Foreign Keys or Joins
- All database joins across shards were strictly forbidden in application code.
- If a user requested their feed containing pins from 20 followed users, the application fetched the Pin IDs from an in-memory cache/index, grouped the Pin IDs by their embedded 16-bit Shard IDs, and dispatched parallel batch queries (`SELECT * FROM pins WHERE id IN (...)`) to the corresponding shards.

---

## 6. Instagram: From Redis RAM to Cassandra & Rocksandra (C++)

In 2012, Instagram stored user activity feeds, follower maps, and counter metadata entirely in **Redis**. However, as user numbers soared toward 1 billion, keeping all active and inactive feed timelines resident in RAM became financially and architecturally unsustainable.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        INSTAGRAM ROCKSANDRA ARCHITECTURE                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  Cassandra Java Layer (Distributed Consensus & Topology)                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ • Token Ring Consistent Hashing       • CQL Query Parser                         │  │
│  │ • Gossip Failure Detector             • Read/Write Coordinator                   │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ JNI (Java Native Interface) Boundary     │
│  RocksDB C++ Storage Engine (Native I/O)    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ • Native C++ Memtable (SkipList)      • Custom Column Family Compactions         │  │
│  │ • Direct NVMe SSD I/O                 • Zero JVM Heap Garbage Collection         │  │
│  │ • Fast C++ Block Cache                • P99 Read Latency dropped 60ms -> 20ms    │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Transition to Cassandra & The Latency Crisis
Instagram migrated activity feeds from Redis to **Apache Cassandra on NVMe SSDs**, achieving an immediate **~75% reduction in infrastructure hosting costs**.
However, as the cluster grew past 1,000 nodes across six datacenters, Instagram hit the JVM storage wall:
- Cassandra’s Java-based memtable and SSTable compaction engine continuously allocated millions of short-lived Java objects on the JVM heap.
- Frequent CMS/G1GC Stop-The-World pauses caused P99 read latencies to degrade to **60ms+**, with periodic tail latency spikes exceeding 200ms.

### The Innovation: Rocksandra (Cassandra + RocksDB via JNI)
Meta (Instagram's parent company) engineered **Rocksandra**:
- Replaced Cassandra’s native Java-based storage engine with **RocksDB** (Meta’s open-source, high-performance embeddable key-value engine written in native C++).
- **Architectural Division of Labor**:
  - **Cassandra (Java)**: Retained for what it does best—distributed peer-to-peer gossip, token ring routing, cluster topology management, and CQL query parsing.
  - **RocksDB (C++)**: Plugged in via Java Native Interface (JNI) to manage raw disk I/O, memtable buffering, SSTables, block caching, and compaction.
- **Results**:
  - P99 read latency dropped from **60ms to 20ms** (a 66% latency reduction).
  - JVM garbage collection stalls plummeted by **10x**.
  - Storage density per server doubled because RocksDB's C++ compaction algorithms were far more CPU- and memory-efficient than Cassandra’s Java compactions.

---

## 7. Figma: Multiplayer Infrastructure (Why Not Pure OT or CRDT)

Figma is a browser-based collaborative design application. Unlike linear text editors, a Figma canvas contains tens of thousands of deeply nested 2D/3D hierarchical objects (frames, groups, vector curves, text nodes, layout constraints).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FIGMA MULTIPLAYER CANVAS SYNC                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   Browser Client A (Wasm / WebGL)             Browser Client B (Wasm / WebGL)          │
│   • Modifies local state at 60 FPS            • Modifies local state at 60 FPS         │
│   • Sends property mutation over WS           • Sends property mutation over WS        │
│              │                                           │                             │
│              └──────────────────┐     ┌──────────────────┘                             │
│                                 ▼     ▼                                                │
│                   ┌─────────────────────────────────────────┐                          │
│                   │ Server-Authoritative Room Process       │                          │
│                   │ (Single-Threaded Rust/TS Sequencer)     │                          │
│                   │ • Exactly 1 process per active file     │                          │
│                   │ • Establishes global monotonic ordering │                          │
│                   │ • Property-level Last-Writer-Wins (LWW) │                          │
│                   │ • Broadcasts diffs to connected clients │                          │
│                   └─────────────────────────────────────────┘                          │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Architectural Dilemma: Pure OT vs Pure CRDT

#### Why Not Operational Transformation (OT)?
- Operational Transformation (used by Google Docs) was engineered for **1-dimensional linear text arrays** (e.g. `insert(char, index)` and `delete(index)`).
- A design canvas is an $N$-ary **hierarchical tree**. Concurrent structural transformations—such as User A reparenting Group 1 into Frame A while User B deletes Frame A—result in mathematically undefined states, orphan subtrees, or cyclic parent-child loops that cannot be resolved deterministically using peer-to-peer OT.

#### Why Not Pure Peer-to-Peer CRDTs?
- Pure CRDTs (like Automerge or Yjs) maintain an immutable history of every operation, unique character/node identifiers, and **tombstones** for deleted objects.
- In a 50,000-object design document, CRDT metadata bloats memory footprint by **10x to 50x**, crashing browser WebAssembly memory allocations ($< 4\text{ GB}$).
- Furthermore, pure CRDTs cannot easily enforce document-wide business invariants (e.g., ensuring component instances do not diverge from their library parent).

### The Solution: Server-Authoritative Sequencer with Property-Level LWW
Figma rejected both pure OT and pure CRDTs in favor of a pragmatic, hybrid architecture:
1. **Server-Authoritative Room Process**:
   - For every active document, exactly one dedicated server process runs in the datacenter.
   - The server process is single-threaded, establishing a **canonical total order** for all incoming operations.
2. **Property-Level Last-Writer-Wins (LWW)**:
   - Mutations are applied at the individual property level rather than the whole node level.
   - If User A modifies the `x` coordinate of a rectangle while User B simultaneously modifies its `fill_color`, both mutations commute cleanly without conflict.
3. **Fractional Indexing for Layer Ordering**:
   - To order layers without re-indexing arrays, Figma assigns floating-point fractional indices (e.g. placing a layer between index `1.0` and `2.0` assigns `1.5`).
4. **Client-Side Optimistic Rendering**:
   - The browser applies local edits instantly at 60 FPS. When the server broadcasts the canonical sequence, the client reconciles any divergent frames smoothly.

---

## 8. WhatsApp + Erlang: 2+ Million Concurrent Connections per Server

In 2012, WhatsApp served hundreds of millions of users with an engineering team of only ~30 engineers. Achieving this required solving the **C10K and C2M problem**: maintaining millions of concurrent persistent TCP connections on minimal hardware.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        WHATSAPP ERLANG BEAM ARCHITECTURE                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  2,000,000+ Concurrent TCP Client Sockets                                              │
│         │                                                                              │
│         ▼                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐            │
│  │ FreeBSD Kernel Tuning                                                  │            │
│  │ • kern.maxfiles = 2,500,000+                                           │            │
│  │ • Dynamic TCP receive/send socket buffer sizing (auto-tuning)          │            │
│  │ • kqueue event demultiplexing                                          │            │
│  └───────────────────────────────────┬────────────────────────────────────┘            │
│                                      │                                                 │
│                                      ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐            │
│  │ Erlang BEAM Virtual Machine                                            │            │
│  │ • 1 Lightweight Green Process per TCP connection                       │            │
│  │ • Initial process memory footprint: only ~300 bytes                     │            │
│  │ • Preemptive Reduction Scheduler (2,000 reductions per process slice)   │            │
│  │ • Zero shared memory; immutable asynchronous message passing           │            │
│  └────────────────────────────────────────────────────────────────────────┘            │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The C2M Challenge: Why Traditional Models Fail
- In traditional operating systems and multi-threaded runtimes (like Java or C++ thread pools), allocating an OS thread per connection consumes 512KB to 1MB of stack memory. 2 Million threads would require **2 Terabytes of RAM just for thread stacks**, not counting context switching overhead.
- Under high connection loads, kernel thread context switching burns 100% of CPU cycles without completing application work.

### The Erlang BEAM Advantage
WhatsApp deployed **Erlang** on **FreeBSD**:
1. **Lightweight Actor Processes**:
   - An Erlang process is not an OS thread; it is a lightweight user-space green thread managed entirely by the BEAM virtual machine.
   - Initial memory footprint: **only ~300 bytes**. 2 Million idle connections consume only ~600 MB of process memory.
2. **Preemptive Reduction Scheduler**:
   - The BEAM scheduler assigns a budget of **2,000 reductions** (function calls) to a process. Once the reduction budget is exhausted, the process is preempted and another process is scheduled.
   - This prevents any single busy connection or slow network client from starving other connections.
3. **FreeBSD Kernel Parameter Tuning**:
   - **`kern.maxfiles` & `kern.maxfilesperproc`**: Raised beyond 2.5 million to prevent socket descriptor exhaustion.
   - **Socket Buffer Auto-Tuning**: Static socket buffers (e.g. 64KB per socket) would consume $2\text{M} \times 64\text{KB} = 128\text{ GB RAM}$. WhatsApp tuned FreeBSD to allocate minimal buffer memory for idle connections and expand dynamically only when data is actively in transit.
   - **Result**: WhatsApp achieved **over 2,100,000 concurrent active connections on a single dual-socket server with 64GB RAM**, running the entire global messaging network on fewer than 100 servers.

---

## 9. Architectural Comparison Matrix

| Case Study | Origin Datastore | Target Architecture | Primary Bottleneck Solved | Core Distributed Pattern |
|---|---|---|---|---|
| **Dropbox Magic Pocket** | AWS S3 (3x Replica) | Custom Rust/Go + 8+9 Reed-Solomon | 200% storage overhead & multi-million AWS bill | Reed-Solomon Erasure Coding ($GF(2^8)$), SMR disk packs |
| **Discord Messages** | Apache Cassandra (Java) | ScyllaDB (C++ Seastar) | JVM GC pauses (2-5s) & tombstone scanning cliffs | Thread-Per-Core shared-nothing architecture, Direct AIO |
| **YouTube Vitess** | Monolithic MySQL | Vitess (VTGate + VTTablet) | Single master write saturation & connection explosion | VSchema hash routing, transparent online resharding |
| **GitHub MySQL** | MySQL 5.7 | MySQL 8.0 | Zero-downtime fleet upgrade without maintenance window | `gh-ost` async binlog tailing, Orchestrator Raft failover |
| **Pinterest Sharding** | MySQL RDS | 64-bit Sharded MySQL (4,096 shards) | Cassandra early instability & MySQL memory exhaustion | Deterministic 64-bit ID routing, user data co-location |
| **Instagram Rocksandra** | Redis RAM / Cassandra | Cassandra + RocksDB C++ engine (JNI) | Redis memory cost & Cassandra JVM GC stalls | Native C++ LSM storage engine, separation of topology from I/O |
| **Figma Multiplayer** | N/A (Ground-up) | Server-Authoritative Rust/TS Process | OT canvas tree intractability & CRDT metadata bloat | Single-threaded room sequencer, property-level LWW, fractional index |
| **WhatsApp Erlang** | Traditional Threads | Erlang BEAM on FreeBSD | C10K/C2M persistent connection limits & thread stack bloat | 300-byte green actor processes, reduction-count preemptive scheduler |

---

## 10. Core Lessons for Principal Engineers

1. **Erasure Coding Beats 3x Replication Beyond 50 Petabytes**: At massive scale, the 200% hardware overhead of 3x replication is economically indefensible. Reed-Solomon erasure coding provides superior durability with half the physical drives.
2. **LSM Tombstones Are a Silent Killer**: In Cassandra, ScyllaDB, and RocksDB, deletions are writes. High deletion workloads without aggressive compaction cause catastrophic read latency cliffs.
3. **Decouple Distributed Topology from the Storage Kernel**: Distributed consensus (Gossip, Raft, Paxos) and physical disk I/O are fundamentally different disciplines. Architectures like Rocksandra and ScyllaDB prove that native C++ storage kernels outperform managed runtimes for high-I/O workloads.
4. **Never Use SQL Triggers for Online Migrations**: Triggers execute synchronously inside user transactions, multiplying lock contention. Asynchronous binlog tailing (`gh-ost`) is the gold standard for zero-downtime database transformations.
5. **Pragmatism Trumps Theoretical Purity in Collaboration**: While peer-to-peer CRDTs and OT are academically elegant, real-world high-performance collaboration (Figma) thrives on server-authoritative single-threaded sequencing with lightweight property-level commutative primitives.
