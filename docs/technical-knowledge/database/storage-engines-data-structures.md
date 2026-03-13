---
id: storage-engines-data-structures
title: Storage Engines & Data Structures
description: How databases store and retrieve data — B+ trees, LSM trees, heap files, InnoDB vs MyISAM, WAL, and buffer pools.
tags: [database, storage-engines, b-tree, lsm-tree, innodb, wal, buffer-pool, data-structures]
sidebar_position: 5
---

# Storage Engines & Data Structures

## How Databases Store Data

Databases ultimately store data in **files on disk**. The storage engine is the component responsible for:
- Reading/writing data to disk
- Managing memory (buffer pool/cache)
- Crash recovery
- Locking

---

## Core Data Structures

### B+ Tree (Row-Oriented Stores)

The dominant structure for relational DBs (InnoDB, PostgreSQL heap + B-tree indexes).

```
Internal nodes: keys for routing
Leaf nodes: actual data (or pointers to rows)
Leaf nodes linked → efficient sequential/range scans

         [10 | 30]
        /    |    \
    [5,7] [15,20] [35,40,50]
       ↔     ↔       ↔        (doubly linked)
```

**Characteristics:**
- Read-optimized: great for random reads and range scans
- Write amplification: a single insert may cause page splits and propagate up
- Works well on **HDD and SSD**

---

### LSM Tree — Log-Structured Merge Tree (Write-Optimized)

Used by: **Cassandra, HBase, RocksDB, LevelDB, ClickHouse**

```
Write path:
  1. Write to in-memory buffer (MemTable)
  2. When full → flush to immutable SSTable on disk (Level 0)
  3. Background compaction merges SSTables into larger sorted levels

Read path:
  1. Check MemTable
  2. Check L0 SSTables (newest first)
  3. Check L1, L2... (larger, fewer overlaps)
  4. Bloom filter to skip irrelevant files
```

**Characteristics:**
- Write-optimized: all writes are sequential (no in-place updates)
- High write throughput, but reads can require checking multiple levels
- **Compaction** keeps levels tidy but uses CPU and disk I/O
- Good for: time-series, log data, event stores

### B+ Tree vs LSM Tree

| | B+ Tree | LSM Tree |
|--|---------|---------|
| Write speed | Moderate (random I/O) | High (sequential) |
| Read speed | High | Moderate (multi-level check) |
| Space overhead | Low | Higher (compaction needed) |
| Write amplification | Lower | Higher (compaction rewrites) |
| Use case | OLTP, mixed | Write-heavy, time-series |

---

### Heap File

A **heap file** is an unordered collection of rows stored in pages. Used by:
- PostgreSQL (data stored in heap; indexes stored separately)
- Tables without a clustered index in SQL Server

```
Page 1: [row3] [row1] [row7] [row2]  ← no ordering
Page 2: [row5] [row8]               ← free space tracked
```

Inserts go to any page with free space. Updates create new row versions (PostgreSQL MVCC). Dead rows accumulate → `VACUUM` needed.

---

### Clustered vs Heap Storage

| | Clustered (InnoDB) | Heap (PostgreSQL) |
|--|---------------------|-------------------|
| Data organized by | Primary Key | Insertion order |
| PK lookup | Single tree traversal | Index → heap lookup |
| Range scan on PK | Very fast (sequential) | Index scan + random I/O |
| Secondary index lookup | Index → PK → clustered tree | Index → heap (ctid pointer) |
| Bloat handling | `OPTIMIZE TABLE` | `VACUUM` / `VACUUM FULL` |

---

## MySQL Storage Engines

### InnoDB (Default — Use This)

- **Clustered index**: data stored in PK order (B+ tree)
- Full **ACID** compliance
- **Row-level locking** via MVCC
- **Foreign key** support
- WAL via **redo log** (crash recovery)
- **Buffer pool**: caches pages in memory

```sql
CREATE TABLE orders (id INT PRIMARY KEY, ...) ENGINE=InnoDB;
SHOW TABLE STATUS WHERE Name = 'orders'; -- shows engine
```

### MyISAM (Legacy)

- **Heap storage** (data file) + separate index file (.MYI)
- **No transactions**, no FK constraints
- **Table-level locking** only → terrible for concurrent writes
- Faster for read-heavy workloads with no writes
- Used for: full-text search (pre-InnoDB FTS), analytics on static data
- **Not recommended** for new applications

### Other Engines

| Engine | Use Case |
|--------|----------|
| `MEMORY` | Temporary in-memory tables; data lost on restart |
| `ARCHIVE` | Compressed read-only archive; only INSERT/SELECT |
| `CSV` | Tables stored as CSV files |
| `NDB` (MySQL Cluster) | Distributed in-memory storage |
| `TokuDB` | Fractal Tree index; good write-heavy loads |

---

## Write-Ahead Log (WAL)

**WAL** (also called redo log) is the mechanism behind **Durability** and **crash recovery**.

```
Before writing to data page:
  1. Write change to WAL (sequential, append-only)
  2. Acknowledge commit to client
  3. Flush WAL to disk (fsync) ← guarantees durability
  4. Apply to data pages lazily (checkpoint)
```

**Why sequential?** Sequential disk writes are 10-100x faster than random writes, even on SSDs.

**Recovery**: If the DB crashes, replay the WAL from the last checkpoint to reconstruct the committed state.

PostgreSQL WAL is also used for **logical/physical replication**.

---

## Buffer Pool / Shared Buffer

The database's **memory cache** for disk pages.

```
Buffer Pool (e.g. 8 GB in RAM)
┌────────────────────────────┐
│  Page (orders, 0-100)      │  ← hot page, pinned
│  Page (users, 0-100)       │
│  Page (orders, 100-200)    │
│  ...                       │
└────────────────────────────┘
  LRU eviction when full
```

- **Hit rate** = pages served from memory / total pages requested
- Target: >99% hit rate for OLTP
- InnoDB: `innodb_buffer_pool_size` (recommend 70-80% of RAM)
- PostgreSQL: `shared_buffers` (recommend 25% of RAM; OS page cache does the rest)

```sql
-- MySQL: buffer pool hit rate
SELECT (1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)) * 100 AS hit_rate
FROM information_schema.GLOBAL_STATUS
WHERE Variable_name IN ('Innodb_buffer_pool_reads', 'Innodb_buffer_pool_read_requests');
```

---

## Page Structure

Data is read/written in **pages** (typically 4KB, 8KB, or 16KB).

```
InnoDB Page (16KB default):
┌─────────────────────────┐
│ File Header (38B)        │ page no, checksum, LSN
│ Page Header (56B)        │ free space, record count
│ Infimum + Supremum (26B) │ virtual min/max records
│ User Records             │ actual row data
│ Free Space               │
│ Page Directory           │ slot offsets for binary search
│ File Trailer (8B)        │ checksum
└─────────────────────────┘
```

**Page fill factor**: InnoDB leaves ~1/16 of each page free for future updates to avoid immediate page splits.

---

## Column-Oriented Storage (OLAP)

Row stores serialize an entire row together. Column stores serialize each column separately.

```
Row store (OLTP):
[id=1, name="Alice", age=30, city="NYC"] [id=2, name="Bob", ...]

Column store (OLAP):
id:   [1, 2, 3, ...]
name: ["Alice", "Bob", ...]
age:  [30, 25, ...]
```

**Benefits for analytics:**
- Only read relevant columns (less I/O)
- Excellent compression (homogeneous data, run-length encoding)
- Vectorized query execution

Used by: **Redshift, BigQuery, ClickHouse, Parquet, Apache ORC**

---

## 🎯 Interview Questions

**Q1. What is the difference between InnoDB and MyISAM?**
> InnoDB supports transactions (ACID), row-level locking, foreign keys, and uses MVCC for concurrency. MyISAM has none of these — only table-level locking and no transactions. InnoDB stores data in a clustered B+ tree; MyISAM uses a heap file. InnoDB is the right choice for virtually all modern applications.

**Q2. How does a B+ tree differ from a B tree?**
> In a B+ tree, all data pointers are in the leaf nodes, and leaf nodes are linked as a doubly-linked list. Internal nodes only contain routing keys. This makes range scans very efficient. A B tree stores data in both internal and leaf nodes, making range scans less efficient.

**Q3. What is an LSM tree and what are its trade-offs?**
> LSM (Log-Structured Merge) tree buffers writes in memory (MemTable), flushes to SSTables on disk, then compacts them in the background. Writes are always sequential → very high write throughput. Reads may require checking multiple levels. Compaction uses background I/O. Ideal for write-heavy workloads like time-series.

**Q4. What is a Write-Ahead Log and why is it important?**
> WAL records changes before applying them to data pages. Because WAL writes are sequential, they're fast. On crash, the DB replays the WAL from the last checkpoint to recover committed state. WAL is the foundation of Durability in ACID. It's also used for replication.

**Q5. What is the buffer pool and how does it affect performance?**
> The buffer pool is the database's in-memory page cache. Pages read from disk are cached here; subsequent accesses are served from RAM. A high buffer pool hit rate (>99%) is critical for OLTP performance. InnoDB's buffer pool should be set to 70-80% of available RAM.

**Q6. What is the difference between row-oriented and column-oriented storage?**
> Row-oriented stores keep all fields of a row together — fast for OLTP (reading/writing full rows). Column-oriented stores keep each column's values together — fast for OLAP (scanning/aggregating a few columns across millions of rows) and enables much better compression.

**Q7. What is a page split in a B+ tree and why is it a problem?**
> When a new row is inserted into a full B+ tree page, the page splits into two half-full pages, and a key is promoted to the parent. This is expensive and can cascade up the tree. Frequent splits fragment the index. To mitigate: use monotonically increasing PKs (UUID v7 or auto-increment) rather than random UUIDs.

**Q8. How does PostgreSQL handle updates differently from InnoDB?**
> PostgreSQL uses heap storage with MVCC: an UPDATE writes a new row version to the heap (marking the old version with xmax). Old versions accumulate until `VACUUM` cleans them. InnoDB updates rows in-place using undo logs to reconstruct old versions — no dead row accumulation in the main table.

---

## Advanced Editorial Pass: Storage Engine Mechanics and Throughput Trade-offs

### Senior Engineering Focus
- Understand B-Tree vs LSM behavior for read/write and compaction patterns.
- Treat WAL, checkpointing, and cache strategy as durability-performance controls.
- Align storage engine choice to workload shape and recovery goals.

### Failure Modes to Anticipate
- Compaction debt causing latency spikes.
- Checkpoint and flush settings creating bursty I/O stalls.
- Engine mismatch with workload write/read ratio.

### Practical Heuristics
1. Track engine-specific metrics, not only generic CPU and memory.
2. Tune flush and compaction policies with durability targets.
3. Validate recovery time against actual failure drills.

### Compare Next
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Performance & Monitoring](./performance-monitoring.md)
- [Backup & Recovery](./backup-recovery.md)
