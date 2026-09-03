---
id: postgresql-heap-storage-architecture
title: PostgreSQL Heap Storage Architecture & Internals
description: Deep dive into PostgreSQL internal storage mechanics — 8KB slotted pages, HeapTupleHeader, CTID double-hop lookup, the UPDATE dilemma, HOT optimization, MVCC visibility, and VACUUM mechanics.
tags: [database, postgresql, heap-storage, page-layout, ctid, mvcc, hot-optimization, vacuum, database-internals]
sidebar_position: 6
---

import PostgresHeapStorageDiagram from '@site/src/components/PostgresHeapStorageDiagram';

# PostgreSQL Heap Storage Architecture & Internals

Understanding how PostgreSQL physically stores, indexes, and updates data on disk is essential for diagnosing query latency, index bloat, write amplification, and VACUUM contention in high-throughput production databases.

<PostgresHeapStorageDiagram />

---

## 1. The Fundamental Storage Model: Heap vs Clustered Index

Relational database storage engines generally adopt one of two foundational architectures for storing table rows on disk:

| Architecture Dimension | PostgreSQL (Heap Table Engine) | MySQL InnoDB (Clustered Index) |
|---|---|---|
| **Primary Storage Format** | Unordered Heap storage files. Rows placed in any page with sufficient free space. | Clustered B+Tree storage. Table data physically resides in Primary Key leaf nodes. |
| **Secondary Index Addressing** | Stores physical tuple pointers: `CTID (block#, offset#)`. | Stores Primary Key values (requires second B+Tree lookup to fetch non-indexed columns). |
| **MVCC Tuple Updates** | Append-only: `INSERT` new tuple version + mark old tuple dead with `xmax`. | In-place updates with Undo Log rollback segments for historical snapshots. |
| **Index Maintenance on Update** | Modifying any column forces updating all secondary indexes (unless HOT applies). | Updating non-indexed columns touches zero secondary indexes. |

In PostgreSQL, tables are stored in **Heap Files** (an unordered collection of 8KB pages). Secondary indexes (B-Tree, GIN, GiST, BRIN) do not contain table data; they store key values paired with physical pointers called **CTIDs** pointing to the heap.

---

## 2. PostgreSQL Physical Disk Layout

When PostgreSQL writes data to disk, it organizes storage into a strict hierarchical filesystem structure:

```
$PGDATA/
├── base/                                # Database directories (keyed by db OID)
│   └── 16384/                           # Database OID
│       ├── 2619                         # Table relation file node (relfilenode)
│       ├── 2619.1                       # 1 GB segment 1 (if table > 1 GB)
│       ├── 2619_fsm                     # Free Space Map fork
│       └── 2619_vm                      # Visibility Map fork
└── global/                              # Cluster-wide shared catalogs
```

### Key Storage Invariants:
1. **1 GB File Segments**: PostgreSQL splits table files into 1 GB segments (`relfilenode`, `relfilenode.1`, `relfilenode.2`) to maintain compatibility with operating systems and filesystems with file size constraints.
2. **8 KB Block Size**: Data inside each relation file is divided into contiguous, fixed-size blocks called **Pages** (default `8192 bytes`, configurable at compile time via `BLCKSZ`).
3. **Shared Buffer Cache**: The PostgreSQL buffer manager reads 8KB pages from the OS kernel page cache into PostgreSQL shared memory (`shared_buffers`). All reads and writes operate on in-memory 8KB pages.

---

## 3. Slotted Page Binary Anatomy (8KB Layout)

PostgreSQL implements a classic **Slotted Page** architecture. The 8192 bytes of a heap page are partitioned into distinct zones:

| Page Zone | Byte Boundaries | Growth Direction | Internal Contents & Purpose |
|---|---|---|---|
| **PageHeaderData** | Byte 0 to Byte 24 | Fixed (24 Bytes) | `pd_lsn` (8B), `pd_checksum` (2B), `pd_flags` (2B), `pd_lower` (2B), `pd_upper` (2B), `pd_special` (2B), `pd_prune_xid` (4B). |
| **Line Pointers (`ItemIdData`)** | Starts at Byte 24 | Grows **downward** (↓) | Array of 4-byte pointers (`lp_off`, `lp_flags`, `lp_len`). Indirection layer decoupling index CTIDs from physical byte offsets. |
| **Free Space Gap** | Between `pd_lower` and `pd_upper` | Dynamic shrinking | Contiguous unallocated bytes available for new line pointers or incoming tuple payloads. Tracked by FSM. |
| **Heap Tuples** | Starts at Byte 8192 | Grows **upward** (↑) | Physical row versions containing 23-byte `HeapTupleHeaderData` (`t_xmin`, `t_xmax`, `t_ctid`, `t_infomask`) + user column data. |
| **Special Space** | End of Page (Byte 8192) | Fixed (0 Bytes in Heap) | Reserved for access method metadata (used in B-Tree/GiST index pages; 0 bytes for heap tables). |

### 3.1 Page Header (`PageHeaderData` - 24 Bytes)

| Field | Size | Description |
| :--- | :--- | :--- |
| `pd_lsn` | 8 Bytes | `PageLogSequenceNumber`: LSN of the last WAL record that modified this page. Ensures ACID durability and crash recovery. |
| `pd_checksum` | 2 Bytes | Page checksum calculated when writing the page to disk (if `data_checksums = on`). |
| `pd_flags` | 2 Bytes | Flag bits (`PD_HAS_FREE_LINES`, `PD_PAGE_FULL`, `PD_ALL_VISIBLE`). |
| `pd_lower` | 2 Bytes | Byte offset from the start of the page pointing to the end of the line pointer array (start of free space). |
| `pd_upper` | 2 Bytes | Byte offset from the start of the page pointing to the start of the newest tuple data (end of free space). |
| `pd_special` | 2 Bytes | Byte offset to special space at the end of the page (used for B-Tree sibling pointers; equals `8192` in heap pages). |
| `pd_pagesize_version` | 2 Bytes | Contains page size (8192) and layout version number (version 4 since PostgreSQL 8.3). |
| `pd_prune_xid` | 4 Bytes | Oldest unpruned `XMAX` on the page. Used as an optimization hint for opportunistic pruning during query execution. |

### 3.2 Line Pointers (`ItemIdData` - 4 Bytes Each)

Line pointers provide an essential **indirection layer** between index pointers and actual physical byte offsets:

```c
typedef struct ItemIdData {
    unsigned lp_off:15;   /* byte offset to tuple from page start */
    unsigned lp_flags:2;  /* state of line pointer */
    unsigned lp_len:15;   /* byte length of tuple payload */
} ItemIdData;
```

#### Line Pointer Flags (`lp_flags`):
- `LP_UNUSED (0)`: Slot is unused and available for allocation.
- `LP_NORMAL (1)`: Slot points to a live or valid heap tuple.
- `LP_REDIRECT (2)`: HOT redirect; points to another line pointer slot on the same page.
- `LP_DEAD (3)`: Slot is dead (tuple removed by vacuum); line pointer remains to preserve index references until index vacuuming completes.

### 3.3 Heap Tuple Header (`HeapTupleHeaderData` - 23B min + padding = 24B)

Every row on disk is prefixed with a 24-byte binary header before user columns:

```c
struct HeapTupleHeaderData {
    union {
        HeapTupleFields t_heap;
        DatumTupleFields t_datum;
    } t_choice;
    ItemPointerData t_ctid;      /* Current TID of this or newer tuple (6B) */
    uint16          t_infomask2; /* attribute count + HOT flags (2B) */
    uint16          t_infomask;  /* transactional status flags (2B) */
    uint8           t_hoff;      /* offset to user data, padded (1B) */
    bits8           t_bits[1];   /* bitmap of NULL attributes (variable) */
};
```

#### Crucial Transaction Header Fields:
1. `t_xmin` (4 Bytes): Transaction ID (XID) that inserted/created this row version.
2. `t_xmax` (4 Bytes): Transaction ID (XID) that deleted or updated this row version (`0` if row is active and un-deleted).
3. `t_cid` (4 Bytes): Command ID (distinguishes multiple SQL statements executed within the same transaction).
4. `t_ctid` (6 Bytes): Physical pointer `(BlockNumber, OffsetNumber)`. For a current row, points to itself `(0, 1)`. If updated, points to the newer version `(0, 2)`.
5. `t_infomask`: Contains transaction hint flags (`HEAP_XMIN_COMMITTED`, `HEAP_XMIN_INVALID`, `HEAP_XMAX_COMMITTED`, `HEAP_XMAX_INVALID`, `HEAP_HASNULL`).

---

## 4. CTID & The "Double Hop" Index Resolution

### What is a CTID?
A **CTID (Current Tuple Identifier)** is a system column of type `tid` that represents the physical address of a row version on disk:

$$\text{CTID} = (\text{Block Number}, \text{Offset Number})$$

- **Block Number** (32 bits): Identifies the 8KB page number within the relation file ($0 \le \text{Block} < 2^{32}$).
- **Offset Number** (16 bits): Identifies the 1-based index into the page's Line Pointer array (`ItemId[1..N]`).

```sql
SELECT ctid, xmin, xmax, id, email, balance FROM accounts LIMIT 3;

-- Output:
--  ctid  | xmin | xmax | id |      email       | balance 
-- -------+------+------+----+------------------+---------
--  (0,1) | 1001 |    0 |  1 | alice@domain.com | 1500.00
--  (0,2) | 1002 |    0 |  2 | bob@domain.com   | 2400.00
--  (1,1) | 1005 |    0 |  3 | carol@domain.com |  890.00
```

### The Double Hop Execution Path

When a query executes `SELECT * FROM accounts WHERE email = 'alice@domain.com'`, PostgreSQL performs two distinct operations:

| Hop Phase | Storage Subsystem | Lookup Data & Action |
|---|---|---|
| **Hop 1** | B-Tree Index Leaf | Matches Key (`"alice@domain.com"`), extracts physical payload `CTID = (0, 1)`. |
| **Hop 2** | Heap Page 0 Shared Buffer | Accesses Line Pointer `ItemId[1]` ➔ reads `lp_off = 8100`, `lp_flags = LP_NORMAL`. |
| **Data Fetch** | HeapTuple @ Byte 8100 | Evaluates MVCC visibility (`xmin`, `xmax`) and deserializes columns (`balance = 1500.00`). |

### Why Line Pointer Indirection is Critical
Why doesn't the B-Tree index point directly to byte offset `8100` on disk?
- **In-Page Defragmentation**: When dead tuples on Page 0 are purged, PostgreSQL defragments the page and shifts Alice's tuple payload from Byte `8100` to Byte `8050`.
- **Zero Index Writes**: PostgreSQL updates only `ItemId[1].lp_off = 8050`. The B-Tree index entry remains completely unchanged (`CTID (0, 1)`), avoiding costly random writes to B-Tree index pages on disk.

---

## 5. The PostgreSQL UPDATE Dilemma & Write Amplification

Because PostgreSQL uses append-only MVCC, an `UPDATE` statement is physically executed as:

$$\text{UPDATE} = \text{INSERT (new tuple version)} + \text{DELETE (mark old tuple version dead)}$$

### The Multi-Index Amplification Problem

Suppose a table has 5 indexes (`idx_id`, `idx_email`, `idx_status`, `idx_created_at`, `idx_org_id`):

```sql
UPDATE users SET status = 'ACTIVE' WHERE id = 42;
```

| Physical Layer | Write Action | Amplification Overhead |
|---|---|---|
| **Heap Storage (Page 0)** | Marks old tuple `(0, 1)` with `xmax = 2001` (DEAD); appends new tuple at `(0, 2)`. | 2 tuple row versions written to heap. |
| **Secondary Indexes (5x)** | `idx_id`, `idx_email`, `idx_status`, `idx_created_at`, `idx_org_id` | **5 separate B-Tree page modifications**, inserting new key ➔ `(0, 2)` pointers. |
| **WAL Stream** | Generates Write-Ahead Log records for Heap Page + all 5 B-Tree index pages. | Massive write amplification and disk I/O churn. |

**Consequences in High-Write Systems:**
- **Severe Write Amplification**: 1 row update produces 1 heap write + 5 random B-Tree index page writes + WAL records for all modified pages.
- **Index Bloat**: Dead index entries accumulate in all B-Tree leaf pages, degrading cache hit ratios and range scan throughput.

---

## 6. The HOT (Heap-Only Tuples) Optimization

Introduced in PostgreSQL 8.3, **HOT (Heap-Only Tuples)** solves the update write amplification problem.

### 6.1 Prerequisites for HOT Updates
A row update qualifies for HOT optimization if and only if:
1. **No Indexed Column is Modified**: The columns modified by the `UPDATE` are not referenced by any index on the table.
2. **Same-Page Free Space**: The same 8KB page containing the old tuple has enough free space (`pd_upper - pd_lower >= new_tuple_size`) to store the new tuple version.

### 6.2 How HOT Works Under the Hood

| Component | In-Page State | HOT Optimization Mechanism |
|---|---|---|
| **Line Pointer `ItemId[1]`** | `lp_flags: LP_REDIRECT ➔ ItemId[2]` | Redirection pointer. B-Tree indexes continue pointing to `(0, 1)` without modifications. |
| **Line Pointer `ItemId[2]`** | `lp_flags: LP_NORMAL ➔ Byte 8000` | Points to the new tuple payload version on the same page. |
| **Old Tuple #1** | `xmax: 2001, HEAP_HOT_UPDATED` | Marked dead, preserved until transactions older than snapshot commit. |
| **New Tuple #2** | `xmin: 2001, HEAP_ONLY_TUPLE (0, 2)` | Valid new version. No index entry points to `(0, 2)` directly (heap-only). |
| **Secondary Indexes** | Point to `CTID (0, 1)` | **Zero index page writes**. Index traversals follow `LP_REDIRECT` in memory. |

### 6.3 HOT Execution Lifecycle
1. **Insert New Tuple**: The new tuple is written to the same page with `HEAP_ONLY_TUPLE` flag set.
2. **Mark Old Tuple**: The old tuple is updated with `xmax = current_xid` and `HEAP_HOT_UPDATED` flag set.
3. **Chain Redirection**: `ItemId[1]` becomes an `LP_REDIRECT` pointer pointing to `ItemId[2]`.
4. **Zero Index Modifications**: Indexes are never touched.
5. **Index Traversal**: When an index lookup searches for `(0, 1)`, the buffer manager loads Page 0, reads `ItemId[1]`, follows `LP_REDIRECT` to `ItemId[2]`, and reads Tuple #2 seamlessly in memory.
6. **Opportunistic Pruning**: When subsequent queries read Page 0, if the old transaction has committed and no active snapshot requires Tuple #1, PostgreSQL opportunistically reclaims Tuple #1 space without waiting for autovacuum.

### 6.4 The `fillfactor` Tuning Strategy
By default, PostgreSQL fills heap pages to 100% capacity (`fillfactor = 100`). On update-heavy tables, subsequent updates fail the second HOT condition (insufficient page space), reverting to slow non-HOT updates.

```sql
-- Reserve 15-25% free space in each page for in-page HOT updates
ALTER TABLE orders SET (fillfactor = 80);

-- Rebuild table to apply new fillfactor to existing pages
VACUUM FULL orders; -- or: pg_repack -t orders
```

---

## 7. MVCC Tuple Visibility & Dead Tuple Bloat

### 7.1 PostgreSQL Transaction Snapshot
A PostgreSQL snapshot determines what data a query can see:

$$\text{Snapshot} = \text{xmin} : \text{xmax} : [\text{xip\_list}]$$

- `xmin`: Lowest transaction ID that was still active (uncommitted) when the snapshot was taken. All transactions $< \text{xmin}$ are committed and visible.
- `xmax`: First unassigned transaction ID. All transactions $\ge \text{xmax}$ started after the snapshot and are invisible.
- `xip_list`: List of active (in-progress) transaction IDs between `xmin` and `xmax` when the snapshot was created.

### 7.2 Visibility Rule Matrix

| Tuple `t_xmin` Status | Tuple `t_xmax` Status | Visible to Snapshot? |
| :--- | :--- | :--- |
| Uncommitted / Aborted | Any | ❌ **No** |
| Committed ($< \text{xmin}$) | `0` (Not deleted) | ✅ **Yes** |
| Committed ($< \text{xmin}$) | In progress or $> \text{xmax}$ | ✅ **Yes** (deletion not visible yet) |
| Committed ($< \text{xmin}$) | Committed ($< \text{xmin}$) | ❌ **No** (deleted before snapshot) |
| Active in `xip_list` | Any | ❌ **No** (created by active transaction) |
| $> \text{xmax}$ | Any | ❌ **No** (created after snapshot) |

### 7.3 Why Long-Running Transactions Cause Table Bloat
PostgreSQL tracks `oldestxmin` across all active backend connections. 

> [!WARNING]
> If a developer opens a `BEGIN;` transaction in psql or an analytics query runs for 4 hours, `oldestxmin` is pinned. PostgreSQL **cannot remove any dead tuple** updated or deleted after that timestamp, because that long-running transaction might still need to see it. This causes rapid, catastrophic table and index bloat!

---

## 8. Auxiliary Maps: Free Space Map (FSM) & Visibility Map (VM)

Each table in PostgreSQL has two auxiliary file forks:

```
2619          (Heap Data Fork)
├── 2619_fsm  (Free Space Map Fork)
└── 2619_vm   (Visibility Map Fork)
```

### 8.1 Free Space Map (`_fsm`)
- Stored as a binary tree of page space availability categories ($0 \text{ to } 255$).
- When an `INSERT` occurs, PostgreSQL queries the FSM to locate a page with sufficient bytes instead of sequentially scanning the entire table or appending to the end of the file.

### 8.2 Visibility Map (`_vm`)
Stores 2 bits for every 8KB page in the heap:
1. **Bit 0 (All-Visible)**: Set to `1` if all tuples on the page are committed and visible to all current and future transactions.
2. **Bit 1 (All-Frozen)**: Set to `1` if all tuples on the page have been frozen (safe from transaction ID wraparound).

### 8.3 Index-Only Scans
Because secondary indexes do not store transaction visibility headers (`xmin`/`xmax`), an index lookup would normally always have to visit the heap page to verify visibility.

With the **Visibility Map**, if the target page is marked **All-Visible**, PostgreSQL skips the heap page visit entirely:

$$\text{B-Tree Index Scan} \xrightarrow{\text{VM Bit = 1}} \text{Return Data Directly (Index-Only Scan)}$$

---

## 9. Maintenance: VACUUM vs VACUUM FULL vs pg_repack

| Feature Dimension | Standard VACUUM | VACUUM FULL | pg_repack |
|---|---|---|---|
| **Lock Required** | `SHARE UPDATE EXCLUSIVE` | `ACCESS EXCLUSIVE` (Exclusive table lock) | `ACCESS SHARE` (Concurrent table access) |
| **Concurrent Reads** | ✅ Yes (Unblocked) | ❌ Blocked | ✅ Yes (Unblocked) |
| **Concurrent Writes** | ✅ Yes (Unblocked) | ❌ Blocked | ✅ Yes (Unblocked) |
| **Reclaims OS Disk Space** | ❌ No (Space returned to page FSM for future inserts) | ✅ Yes (Physical table file completely rewritten) | ✅ Yes (Table file rebuilt in shadow table) |
| **Updates FSM & VM** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Production Safety** | ✅ Always safe (Autovacuum engine) | ⚠️ Requires dedicated maintenance window | ✅ Safe for zero-downtime online bloat compaction |

### 9.1 Autovacuum Tuning Parameters
To prevent table bloat in write-heavy production systems:

```ini
# postgresql.conf
autovacuum = on
autovacuum_max_workers = 5
autovacuum_vacuum_scale_factor = 0.05       # Vacuum when 5% of tuples are dead
autovacuum_vacuum_cost_limit = 2000         # Increase I/O throughput for vacuum
autovacuum_vacuum_cost_delay = 2ms          # Reduce delay throttle
```

### 9.2 Transaction ID (TXID) Wraparound & Frozen XIDs
PostgreSQL transaction IDs are 32-bit integers, wrapping around every $2^{32} \approx 4.2 \text{ billion}$ transactions. To prevent historical data from suddenly becoming "invisible in the future":
- PostgreSQL uses a special frozen XID (`FrozenTransactionId = 2`), which is defined as older than every possible transaction ID.
- Autovacuum scans pages and marks tuples older than `vacuum_freeze_min_age` as frozen.

---

## 10. Production Diagnostics & Inspection Queries

### 10.1 Inspect Raw 8KB Pages with `pageinspect`

```sql
CREATE EXTENSION IF NOT EXISTS pageinspect;

-- Inspect 8KB Page Header
SELECT * FROM page_header(get_raw_page('accounts', 0));

-- Inspect all Line Pointers and Tuples on Page 0
SELECT lp, lp_off, lp_flags, lp_len, t_xmin, t_xmax, t_ctid, t_infomask2
FROM heap_page_items(get_raw_page('accounts', 0));
```

### 10.2 Measure HOT Update Efficiency

```sql
SELECT 
    relname AS table_name,
    n_tup_upd AS total_updates,
    n_tup_hot_upd AS hot_updates,
    ROUND(100.0 * n_tup_hot_upd / NULLIF(n_tup_upd, 0), 2) AS hot_ratio_pct,
    n_dead_tup AS dead_tuples,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_tup_upd DESC;
```

:::info
If `hot_ratio_pct` is below 70% on update-heavy tables, consider lowering `fillfactor` to 80-85 or dropping unused secondary indexes on frequently updated columns.
:::

### 10.3 Detect Dead Tuple Bloat & Long-Running Transactions

```sql
-- Find queries pinning oldestxmin and blocking VACUUM
SELECT 
    pid, 
    now() - xact_start AS duration, 
    backend_xmin, 
    state, 
    query 
FROM pg_stat_activity 
WHERE backend_xmin IS NOT NULL 
ORDER BY duration DESC;
```

---

## 11. Summary: Key Architectural Insights

1. **Heap + Secondary Index Separation**: Secondary indexes store `CTID (Block#, Offset#)`. Line pointers insulate B-Trees from internal page movements.
2. **UPDATE = INSERT + DELETE**: Every update creates a new physical tuple with a new CTID, triggering write amplification across all secondary indexes unless HOT applies.
3. **HOT Optimization**: Requires unindexed column updates + free space in the same 8KB page. Uses `LP_REDIRECT` to eliminate secondary index writes.
4. **MVCC Isolation**: Managed via `xmin`, `xmax`, and snapshot watermarks. Unclosed transactions pin `oldestxmin` and create dead tuple bloat.
5. **Visibility Map**: Powers **Index-Only Scans** by verifying page-level visibility without requiring heap reads.
