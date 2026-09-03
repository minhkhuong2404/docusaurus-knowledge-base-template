---
id: case-studies-data-migrations
title: "Real-World Case Studies: Petabyte Data Stores & Zero-Downtime Migrations"
sidebar_label: 💾 Data & Migrations
description: Deep dive into landmark petabyte data storage architectures and zero-downtime migrations — Dropbox Magic Pocket erasure coding, Discord Cassandra to ScyllaDB, YouTube Vitess, GitHub MySQL 8, Pinterest 64-bit sharding, Instagram Rocksandra, Figma multiplayer, and WhatsApp Erlang.
tags: [case-study, system-design, database, data-migration, dropbox, discord, youtube, vitess, github, pinterest, instagram, figma, whatsapp]
---

import CaseStudiesDataMigrationsDiagram from '@site/src/components/CaseStudiesDataMigrationsDiagram';

# Real-World Case Studies: Petabyte Data Stores & Migrations

---

Migrating data at petabyte and exabyte scale without taking downtime or losing transactions is one of the ultimate tests of software engineering. When off-the-shelf databases reach physical limits, engineering teams invent custom storage engines, novel sharding schemes, and zero-downtime dual-writing pipelines.

This guide analyzes eight iconic data and migration case studies from Dropbox, Discord, YouTube, GitHub, Pinterest, Instagram, Figma, and WhatsApp.

<CaseStudiesDataMigrationsDiagram />

---

## 1. Dropbox Magic Pocket: Exabyte Object Storage

In 2014, Dropbox stored hundreds of petabytes on Amazon AWS S3. To optimize costs and exercise full hardware control, Dropbox executed one of the largest infrastructure migrations in tech history: moving over **500 Petabytes of user data from AWS S3 to custom on-premise datacenters**.

### The Storage Overhead Problem
Standard distributed object storage systems use **3x replication** (storing 3 identical copies of each file on 3 separate servers).
- For 500 Petabytes of user files, 3x replication requires purchasing **1,500 Petabytes (1.5 Exabytes) of raw hard drives**—a 200% raw hardware overhead!

### The Solution: 8+9 Reed-Solomon Erasure Coding
Dropbox built **Magic Pocket** in Rust and Go, replacing 3x replication with an advanced **8+9 Reed-Solomon Erasure Coding scheme**:
- A file chunk is split into **8 data blocks**.
- The mathematical erasure coding algorithm computes **9 parity blocks** (total 17 blocks).
- Each of the 17 blocks is stored on a separate physical server rack across the datacenter.
- **Extreme Durability**: Magic Pocket can survive the simultaneous loss of **up to 9 entire racks or disks** without losing a single byte of user data!
- **Storage Efficiency**: The raw storage overhead was slashed from 200% down to approximately **112%**, saving Dropbox tens of millions of dollars annually.

### Key Lessons Learned: Dropbox Magic Pocket
- **Erasure Coding Slashes Hardware Footprint at Scale**: Beyond 50 Petabytes, 3x replication becomes economically prohibitive. Reed-Solomon erasure coding provides superior durability with half the disk storage.
- **Hardware-Software Co-Design**: Building custom low-power storage chassis tailored specifically to immutable chunk sizes maximizes storage density and reduces datacenter cooling costs.

---

## 2. Discord: Trillions of Messages from Cassandra to ScyllaDB

In 2017, Discord migrated its core message storage from MongoDB to Apache Cassandra. By 2022, Discord stored **trillions of messages** and processed millions of queries per second. However, Cassandra began experiencing severe performance degradation.

### The Cassandra JVM Bottlenecks:
1. **JVM Garbage Collection Pauses**: Cassandra is written in Java. When scanning large row partitions, millions of objects allocated on the JVM heap triggered unpredictable Stop-The-World (STW) garbage collection pauses, causing latency spikes up to several seconds.
2. **Tombstone Scanning Cliffs**: In Discord channels where users frequently deleted messages or where bot messages were purged, Cassandra accumulated millions of tombstone records. Reading unread messages forced Cassandra to scan hundreds of thousands of tombstones, triggering query timeouts (`ReadFailureException`).

### The Migration to ScyllaDB (C++):
Discord migrated trillions of messages from Cassandra to **ScyllaDB**:
- **C++ Shared-Nothing Architecture**: ScyllaDB is a C++ rewrite of Cassandra built on the **Seastar asynchronous framework**. It uses a **Thread-Per-Core** architecture: each CPU core manages its own memory, cache, and NIC queue without lock contention.
- **Zero JVM Garbage Collection**: No JVM heap sweeps.
- **Results**: P99 read latency dropped from over **1,000ms down to a predictable 15ms**, and the cluster size was reduced from hundreds of heavy nodes to a fraction of the fleet.

### Key Lessons Learned: Discord Message Storage
- **Tombstones Are a Silent Killer in LSM Trees**: In distributed column stores, deletions write tombstones. Workloads with frequent deletions will suffer catastrophic read degradation unless compaction strategies are aggressively tuned.
- **Thread-Per-Core C++ Beats Managed JVMs for Ultra-High I/O**: Eliminating kernel thread context-switching and garbage collection unlocks hardware NVMe drive potential.

---

## 3. YouTube + Vitess: Transparent MySQL Horizontal Sharding

YouTube began as a Python monolith on MySQL. As video upload volume and comment threads exploded, a single MySQL database could not sustain write throughput.

### The Problem:
Moving to a NoSQL datastore would require completely rewriting YouTube's application code, abandoning relational SQL queries, joins, and transactional consistency.

### The Solution: Vitess
YouTube built **Vitess**, an open-source database clustering middleware:
- **`vtgate` Proxy Layer**: Applications connect to Vitess as if it were a single giant MySQL database. `vtgate` parses SQL queries and routes them to the appropriate shards.
- **`vttablet` Sidecar**: Runs alongside each MySQL instance, pooling connections to protect MySQL from the connection explosion problem.
- **Transparent Online Resharding**: When a shard becomes full, Vitess splits the shard dynamically (e.g. splitting shard `-80` into `-40` and `40-80`), backfills data, reconciles replication lag, and cuts over traffic **with zero application downtime**.

### Key Lessons Learned: YouTube Vitess
- **Keep Relational SQL Semantics While Sharding**: Sharding middleware allows organizations to scale horizontally without forcing thousands of developers to rewrite business logic into complex NoSQL patterns.
- **Connection Pooling at Scale**: Thousands of app servers connecting directly to MySQL exhaust memory. Placing a connection-pooling sidecar (`vttablet`) in front of MySQL stabilizes database CPU.

---

## 4. GitHub: Zero-Downtime MySQL 8 Migration

GitHub’s core relational database clusters run on MySQL. In 2023, GitHub completed a multi-year migration upgrading all production clusters from MySQL 5.7 to MySQL 8.0 without causing a single second of site downtime.

### The Strategy:
1. **`gh-ost` Online Schema Change**: GitHub’s open-source tool creates a shadow table, mirrors binary log (binlog) mutations asynchronously, and swaps tables atomically with a metadata lock.
2. **Orchestrator for High Availability**: GitHub uses **Orchestrator** to monitor MySQL replication topologies and execute automated master failovers in &lt; 10 seconds.
3. **Dual-Replication Cutover**: Provisioned new MySQL 8.0 replicas replicating from MySQL 5.7 primaries. Once replication lag was zero and shadow traffic verified performance parity, Orchestrator promoted the MySQL 8.0 instance to primary.

### Key Lessons Learned: GitHub MySQL Migration
- **Decouple Migrations into Verifiable Reversible Steps**: Upgrade replicas first, shadow read queries to verify query planner plan changes, and execute automated failover only after 100% confidence.
- **Asynchronous Binlog Tailing Beats SQL Triggers**: Tools like `gh-ost` that read binlogs directly place virtually zero write overhead on the primary database compared to trigger-based tools like `pt-online-schema-change`.

---

## 5. Pinterest: 64-Bit MySQL Sharding Architecture

In 2011, Pinterest hit rapid viral growth and experienced frequent database crashes on Amazon RDS MySQL.

### The Solution: Deterministic 64-Bit Shard IDs
Instead of adopting an unproven NoSQL datastore, Pinterest engineered a deterministic horizontal sharding scheme on bare MySQL instances using a custom **64-bit integer ID**:

```
┌──────────────┬────────────────────────┬────────────────────────┐
│ 16 bits      │ 10 bits                │ 38 bits                │
│ Shard ID     │ Type (Pin, User, Board)│ Auto-increment local ID│
└──────────────┴────────────────────────┴────────────────────────┘
```
- **16 bits for Shard ID**: Supports up to $2^{16} = 65,536$ logical shards (Pinterest started with 4,096 logical shards mapped across 8 physical database servers).
- **Zero Cross-Shard Joins**: All related pins and boards for a user are co-located on the same shard using the user's Shard ID prefix.
- **Simple Re-balancing**: If a physical server runs out of disk space, moving 500 logical shards to a new physical server is a simple master-slave dump and replication cutover!

### Key Lessons Learned: Pinterest MySQL Sharding
- **Logical Shards Decoupled from Physical Servers**: Allocating 4,096 logical databases across 8 physical boxes allows painless scaling: to double capacity, migrate 2,048 logical databases to 8 new boxes without re-hashing rows.
- **Embed Routing Metadata in the Primary Key**: Encoding the shard ID directly into the 64-bit entity ID eliminates the need for a global lookup directory service.

---

## 6. Instagram: From Redis to Cassandra & Rocksandra

In 2012, Instagram stored user activity feeds and fraud detection metadata in Redis. As user counts exploded toward 1 billion, keeping all feed data resident in RAM became financially unsustainable.

### The Migration to Cassandra & The JVM Latency Crisis:
Instagram migrated activity feeds to Apache Cassandra, achieving a **~75% infrastructure cost reduction** by moving from RAM to SSDs. However, as cluster size grew to 1,000+ nodes across six datacenters, Cassandra's Java-based storage engine triggered frequent JVM garbage collection stalls, pushing P99 read latencies up to **60ms**.

### The Solution: Rocksandra (RocksDB Pluggable Storage Engine)
Instagram built **Rocksandra**:
- Replaced Cassandra's Java-based LSM storage engine with **RocksDB** (a high-performance C++ key-value engine developed by Meta).
- Cassandra continues handling distributed consensus, peer-to-peer gossip, token ring routing, and replication.
- RocksDB handles physical disk writes, block caching, and compaction in native C++.
- **Outcome**: P99 read latency dropped from **60ms to 20ms**, and GC stalls plummeted by **10x**.

### Key Lessons Learned: Instagram Rocksandra
- **Separate Distributed Protocol from Storage Kernels**: Cassandra's distributed ring architecture is proven, but JVM storage engines struggle with multi-terabyte SSDs. Swapping the storage engine for a native C++ engine (RocksDB) delivers the best of both worlds.
- **Tiered Storage Saves Millions**: Inactive user feeds belong on high-density SSDs, not expensive memory-bound caches like Redis.

---

## 7. Figma: Multiplayer Infrastructure (Why Not Pure OT or Pure CRDT)

Figma built browser-based multiplayer design collaboration supporting up to 200 concurrent active editors on a single complex design canvas.

### The Core Architectural Dilemma:
When designing the real-time engine, Figma evaluated the two standard industry paradigms:
1. **Why Not Operational Transformation (OT)?**
   OT was built for 1D linear text strings (like Google Docs). A Figma design canvas is a deeply nested 2D/3D tree of hierarchical objects (frames, groups, vector paths). Transforming concurrent tree structural operations (e.g. reparenting a group while deleting its parent) in peer-to-peer OT is mathematically intractable.
2. **Why Not Pure Peer-to-Peer CRDTs?**
   Pure CRDTs maintain immutable history, unique character position identifiers, and tombstones for every deleted element. In a 50,000-object design file, the memory metadata bloat would crash the WebAssembly memory limits of client browsers. Furthermore, pure CRDTs cannot enforce business invariants (e.g. ensuring unique layer names or bounding canvas boundaries).

```
                      FIGMA MULTIPLAYER ENGINE
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
BROWSER CLIENTS (Wasm / WebGL)              SERVER SEQUENCER (Rust Process)
• Modifies local state immediately          • Exactly 1 process per active file
• Sends property-level mutations            • Establishes canonical total order
• Smooth 60fps local rendering              • Broadcasts diffs via WebSockets
```

### The Solution: Server-Authoritative Property-Level LWW
Figma rejected both pure OT and pure CRDTs in favor of a pragmatic hybrid:
- **Server-Authoritative Room Process**: Exactly one lightweight server process (written in Rust/TypeScript) runs per open document. The server acts as a single-threaded sequencer, establishing a canonical total order of operations.
- **Property-Level Last-Writer-Wins (LWW)**: Instead of conflicting at the document or node level, mutations apply at the individual property level (e.g. modifying `fill_color` commutes independently from another user modifying `width`).
- **Fractional Indexing for Layer Ordering**: Reordering layers assigns floating-point fractional indices (e.g. placing a layer between index 1.0 and 2.0 assigns 1.5), preventing concurrent reordering conflicts.

### Key Lessons Learned: Figma Multiplayer
- **Pragmatism Trumps Theoretical Purity**: Pure decentralized peer-to-peer CRDTs carry severe memory and metadata overhead. A server-authoritative sequencer combined with property-level commutative CRDT primitives delivers optimal real-world performance.
- **WebAssembly + WebSockets for Real-Time Apps**: Running the core rendering engine in C++/Rust compiled to WebAssembly inside the browser delivers desktop-grade 60 FPS performance.

---

## 8. WhatsApp + Erlang: 2+ Million Connections per Server

In 2012, WhatsApp served hundreds of millions of users with an engineering team of only ~30 engineers.

### The C2M Challenge:
Traditional operating systems and threading models (like Java or C++ thread pools) hit the **C10K problem** (struggling to maintain 10,000 concurrent TCP connections due to thread stack memory and context-switching overhead).

### The Erlang BEAM Architecture:
WhatsApp selected **Erlang** and FreeBSD:
- **Lightweight Actor Processes**: An Erlang process is not an OS thread; it is an in-memory green process managed by the BEAM virtual machine. Each process consumes only **300 bytes of memory**.
- **No Shared Memory**: Processes communicate strictly via immutable message passing.
- **The Result**: WhatsApp tuned the FreeBSD kernel and Erlang VM to handle **over 2,000,000 (2 Million) concurrent, persistent TCP connections on a single commodity server**, allowing 1 billion users to be served by fewer than 100 servers!

### Key Lessons Learned: WhatsApp Erlang
- **The Actor Model Conquers Extreme Concurrency**: Erlang's isolated share-nothing actor processes eliminate lock contention, race conditions, and thread stack exhaustion.
- **Kernel & OS Parameter Tuning**: Achieving 2M connections requires deep kernel tuning: increasing `kern.maxfiles`, tuning TCP receive buffers (`net.inet.tcp.recvspace`), and utilizing epoll/kqueue event demultiplexers.

---

### Compare Next
- [Catastrophic Outages & Reliability](./case-studies-outages-reliability.md)
- [Hyper-Scale System Architecture](./case-studies-architecture-scaling.md)
- [Platform Delivery & Modern CI/CD](./platform-delivery-reliability.md)
