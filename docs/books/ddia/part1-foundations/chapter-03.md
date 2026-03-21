---
id: chapter-03
title: "Chapter 3: Storage and Retrieval"
sidebar_label: "Ch 3 — Storage & Retrieval"
sidebar_position: 3
---

# Chapter 3: Storage and Retrieval

## The Big Idea

As an application developer, you usually just call your database and trust it to do the right thing. But to choose the right database and tune it properly, you need to know roughly *how* storage engines work internally. This chapter explores the key data structures that power databases and how they differ for **transactional (OLTP)** vs **analytical (OLAP)** workloads.

---

## 🔧 Data Structures That Power Your Database

### The Simplest Possible Database

```bash
#!/bin/bash
db_set() { echo "$1,$2" >> database; }
db_get() { grep "^$1," database | last | cut -d"," -f2; }
```

This two-function "database" uses an **append-only log**. Writes are O(1) (just append). But reads are O(n) — you scan the whole file. We need an **index** to make reads fast.

**The fundamental trade-off:** Indexes speed up reads but slow down writes (every write must update the index). This is why databases don't index everything by default.

---

### Hash Indexes

The simplest index: an **in-memory hash map** mapping each key to the **byte offset** of its value in the data file.

```
key="cat"  → offset 0
key="dog"  → offset 64
key="fish" → offset 128
```

**Bitcask** (Riak's storage engine) works this way. Perfect for:
- High-volume writes (just append + update in-memory map)
- A dataset where all keys fit in RAM (but values can be on disk)

**Problem: disk space.** With append-only writes, the log grows forever. Solution: **compaction** — merge log segments and keep only the most recent value per key.

**Why append-only instead of in-place updates?**
- Sequential writes are much faster than random writes on HDDs and SSDs
- Crash recovery is simpler (no partial overwrites)
- Concurrency is easier (immutable segments)

**Limitations of hash indexes:**
- All keys must fit in RAM (no range queries)
- Hash collisions require careful handling

---

### SSTables and LSM-Trees

**SSTable (Sorted String Table):** Like a log segment, but the key-value pairs are **sorted by key**. Advantages over unsorted hash logs:

1. Merging is efficient (like merge sort — you get sorted output for free)
2. You no longer need to keep all keys in memory — a sparse index works since keys are sorted
3. Range queries are efficient

**How do you keep data sorted when writes come in random order?** Use an in-memory balanced tree (**memtable**, e.g., a red-black tree). When it reaches a size threshold, flush it to disk as an SSTable.

This is the **LSM-Tree (Log-Structured Merge-Tree)** approach, used by:
- LevelDB, RocksDB (embedded)
- Cassandra, HBase (distributed)
- Lucene (full-text search indexes)

```
Writes → memtable (RAM) → SSTable L0 → SSTable L1 → ... (compaction in background)
Reads  → check memtable → check L0 → check L1 → ...
```

**Bloom filters** are used to avoid unnecessary disk reads for keys that don't exist.

---

### B-Trees

B-Trees are the **most widely used** index structure — the standard in virtually all relational databases (PostgreSQL, MySQL InnoDB, Oracle, SQL Server).

Unlike LSM-Trees that break data into variable-size segments, B-Trees break data into fixed-size **pages** (typically 4 KB), matching the underlying hardware page size.

```
Root Page
├── Ref to page [keys < 100]
│   ├── [key 1, val 1]
│   ├── [key 50, val 50]
│   └── [key 99, val 99]
├── Ref to page [100 ≤ keys < 200]
│   └── ...
└── Ref to page [keys ≥ 200]
    └── ...
```

A B-Tree with n keys has depth O(log n). A 4-level tree with 4 KB pages can store up to **256 TB** of data.

**Writes update pages in place** on disk (unlike LSM-Trees which are append-only).

**Crash safety:** Databases use a **Write-Ahead Log (WAL)** — every modification is first written to the WAL, then applied to the tree. On crash, the WAL is replayed to restore consistency.

---

### Comparing B-Trees and LSM-Trees

| Aspect | B-Trees | LSM-Trees |
|---|---|---|
| Write speed | Slower (random writes) | Faster (sequential appends) |
| Read speed | Generally faster | Can be slower (multiple SSTables to check) |
| Write amplification | Lower | Higher (compaction rewrites data multiple times) |
| Space usage | Some fragmentation | Better (no fragmentation, but compaction overhead) |
| Concurrency | Simpler locking | Can be more complex |
| Transaction isolation | Easier (key appears in exactly one place) | Harder |

**LSM-Trees are generally better for write-heavy workloads.** B-Trees are better for read-heavy workloads and transaction semantics.

---

### Other Indexing Structures

**Secondary indexes:** Index on a non-primary-key column. Multiple rows can match the same index key.

**Multi-column indexes:** Composite index on (lat, lon) for geospatial queries. A 2D R-tree handles this well; a regular B-tree can't efficiently query multiple columns simultaneously.

**Full-text search and fuzzy indexes:** Lucene uses a finite-state automaton to efficiently find words within edit distance 1 of a search term.

**In-memory databases:** Redis, Memcached, VoltDB. Avoiding disk I/O isn't the only advantage — in-memory databases can use data structures that are hard to implement on disk (priority queues, sets), and they can be faster due to avoiding encoding/decoding overhead.

---

## 📊 Transaction Processing or Analytics?

Databases serve two very different types of workloads:

| Property | OLTP (Online Transaction Processing) | OLAP (Online Analytical Processing) |
|---|---|---|
| Primary users | End users via applications | Internal analysts, data scientists |
| Read pattern | Small number of rows per query by key | Aggregate over millions of rows |
| Write pattern | Random-access low-latency inserts/updates | Bulk import (ETL) or event stream |
| Dataset size | GB to TB | TB to PB |
| Query bottleneck | Disk seek time | Disk bandwidth |

Running analytical queries on your OLTP database is a bad idea — they hurt production performance.

### Data Warehousing

A **data warehouse** is a separate analytical database fed by ETL (Extract-Transform-Load) from OLTP systems. It can be optimized for analytics without affecting production.

Examples: Amazon Redshift, Google BigQuery, Apache Hive, Snowflake.

**Star Schema:** The most common warehouse data model.
- A central **fact table** (each row = one event)
- Surrounding **dimension tables** (who, what, where, when, how, why)

```
         dim_date
            ↑
dim_store ← fact_sales → dim_product
            ↓
         dim_customer
```

---

## 📋 Column-Oriented Storage

In OLTP, data is stored **row by row** — good for fetching all columns of one row. But analytics queries typically only need a few columns from millions of rows:

```sql
SELECT product_id, SUM(quantity)
FROM fact_sales
WHERE date_key BETWEEN 20220101 AND 20221231
GROUP BY product_id
```

This query only needs 3 out of potentially 100 columns. Reading all 100 is wasteful.

**Column-oriented storage** stores each column's values together:

```
Row store:  [id=1, date=140102, product=69, store=4, quantity=1, ...], [id=2, ...]
Col store:  dates:    [140102, 140102, 140102, ...]
            products: [69, 69, 74, ...]
            stores:   [4, 4, 4, ...]
```

### Column Compression

Columns are highly compressible because they contain repetitive data. **Bitmap encoding** is especially effective:

```
product_id 69 appears at positions: [1, 1, 0, 0, 1, ...]  (bitmap)
```

With **run-length encoding** on top, this compresses extremely well.

**Vectorized processing:** Compressed column data fits in CPU cache, enabling SIMD operations that process many values per CPU instruction cycle. This is why column stores are dramatically faster for analytics.

### Sort Order in Column Storage

Rows can be sorted by a chosen column (e.g., date). This enables:
- Faster range queries on the sort key
- Better compression on sorted columns (long runs of identical values)

Some databases (Vertica) store **multiple sort orders** on different replicas.

---

## Summary

```
OLTP Workloads                    OLAP Workloads
──────────────────                ──────────────────
B-Tree or LSM-Tree index          Column-oriented storage
Row-oriented storage              Bitmap indexes + compression
Optimize for point lookups        Optimize for scan throughput
Small datasets per query          Aggregate over millions of rows
```

The key insight: **there is no one-size-fits-all storage engine**. The right choice depends on whether your workload is dominated by small, random accesses (OLTP) or large, sequential scans (OLAP).
