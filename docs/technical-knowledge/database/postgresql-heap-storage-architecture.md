---
id: postgresql-heap-storage-architecture
title: PostgreSQL Heap Storage Architecture & Internals
description: Comprehensive deep dive into PostgreSQL internal storage mechanics — 8KB slotted pages, HeapTupleHeader, CTID double-hop lookup, the UPDATE dilemma, HOT optimization, MVCC visibility, and VACUUM mechanics based on Hussein Nasser's database engineering architecture.
tags: [database, postgresql, heap-storage, page-layout, ctid, mvcc, hot-optimization, vacuum, database-internals]
sidebar_position: 6
---

import PostgresHeapStorageDiagram from '@site/src/components/PostgresHeapStorageDiagram';

# PostgreSQL Heap Storage Architecture & Internals

Understanding how PostgreSQL physically stores, indexes, and updates data on disk is essential for diagnosing query latency, index bloat, write amplification, and VACUUM contention in high-throughput production databases.

<PostgresHeapStorageDiagram />

---

## 1. The Fundamental Storage Model: Heap vs Clustered Index

Relational database storage engines generally adopt one of two foundational architectures for organizing table rows on disk:

```
MySQL InnoDB (Clustered Index Architecture):
┌─────────────────────────────────────────────────────────────┐
│ Secondary Index (email) ──> Extracts Primary Key (id=42)   │
│                                           │                 │
│                                           ▼                 │
│ Clustered Index B+Tree (PK) ────> Traverses B+Tree to leaf  │
│                                           │                 │
│                                           ▼                 │
│ Leaf Node contains: Full Row Payload [id, email, name, ...] │
└─────────────────────────────────────────────────────────────┘
  Lookup Cost: 2 × B+Tree Traversals [O(log N) + O(log N)]

PostgreSQL (Heap Storage Architecture):
┌─────────────────────────────────────────────────────────────┐
│ Secondary Index (email) ──> Extracts Physical CTID: (42, 3) │
│                                           │                 │
│                                           ▼                 │
│ Heap Storage (Shared Buffers) ──> Jumps directly to Block 42│
│                                   Reads Line Pointer Slot 3 │
│                                           │                 │
│                                           ▼                 │
│ Physical Byte Offset 8050 ──────> Full Row Payload [xmin...]│
└─────────────────────────────────────────────────────────────┘
  Lookup Cost: 1 × B+Tree Traversal + Direct Memory Hop [O(log N) + O(1)]
```

### Architectural Comparison Matrix

| Architecture Dimension | PostgreSQL (Heap Table Engine) | MySQL InnoDB (Clustered Index) |
|---|---|---|
| **Primary Storage Format** | Unordered Heap storage files. Rows placed in any 8KB page with sufficient free space. | Clustered B+Tree storage. Table data physically ordered and stored inside Primary Key leaf nodes. |
| **Secondary Index Addressing** | Stores physical tuple coordinates: `CTID (Block#, Offset#)`. | Stores Primary Key values (requires a second B+Tree traversal to fetch non-indexed columns). |
| **Read Path (Secondary Index)** | **Fast**: 1 B-Tree search + 1 direct block array lookup in `shared_buffers` ($O(\log N) + O(1)$). | **Slower**: 2 B+Tree searches (Secondary Index $\to$ Clustered PK Index $\to$ Row data). |
| **MVCC Tuple Updates** | Append-only: `INSERT` new tuple version + mark old tuple dead with `xmax`. | In-place updates with Undo Log rollback segments for historical snapshots. |
| **Index Maintenance on Update** | **Vulnerable**: Modifying any column forces updating all secondary indexes (unless HOT applies). | **Resilient**: Updating non-indexed columns touches zero secondary indexes. |
| **Table Reorganization** | Rows have no physical order. `CLUSTER` reorganizes once, but subsequent writes become unordered again. | Rows are continually kept physically sorted by Primary Key. |

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

```
┌─────────────────────────────────────────────────────────────┐
│ PageHeaderData (24 Bytes)                                   │
│ [pd_lsn, pd_checksum, pd_flags, pd_lower, pd_upper, ...]    │
├─────────────────────────────────────────────────────────────┤
│ Line Pointers (ItemIdData, 4 Bytes each)                    │
│ [Item 1] [Item 2] [Item 3] ───────► (Grows downward ↓)     │
├ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┤
│                                                             │
│                    FREE SPACE GAP (Hole)                    │
│                 (pd_upper - pd_lower bytes)                 │
│                                                             │
├ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┤
│ ◄────────────────────────────────── (Grows upward ↑)        │
│ [Tuple 3: HeapTupleHeader (23B) + Column Data (age=31)]     │
│ [Tuple 2: HeapTupleHeader (23B) + Column Data (name='Bob')] │
│ [Tuple 1: HeapTupleHeader (23B) + Column Data (id=1)]       │
├─────────────────────────────────────────────────────────────┤
│ Special Space (0 Bytes in heap; reserved for B-Tree indexes)│
└─────────────────────────────────────────────────────────────┘
 Byte 8192 (End of Page)
```

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

## 5. The Story of a Tuple: Step-by-Step Lifecycle

To make PostgreSQL internal mechanics permanently unforgettable, follow the physical journey of a record across its entire lifecycle:

### Act I: The Birth of a Row (`INSERT`)

```sql
INSERT INTO students (id, name, gpa) VALUES (1, 'Hussein', 3.8);
```

1. **Free Space Map Query**: The backend process checks the table's `_fsm` fork to locate an 8KB page with at least ~40 bytes of free space. It finds Page 0.
2. **Buffer Pin & Lock**: Page 0 is loaded into PostgreSQL's `shared_buffers` (if not already cached) and pinned in memory with an exclusive buffer lock.
3. **Slotted Allocation**:
   - `pd_lower` advances by 4 bytes: Line Pointer `ItemId[1]` is created.
   - `pd_upper` moves upwards by tuple size (e.g. 52 bytes): Tuple payload is written starting at byte `8140`.
   - `ItemId[1].lp_off = 8140`, `lp_flags = LP_NORMAL`, `lp_len = 52`.
4. **CTID Assignment**: The new row is assigned physical address **`CTID = (0, 1)`**.
5. **Index Population**: PostgreSQL writes new entries into every secondary index on `students`:
   - `idx_students_id`: `Key: 1 ➔ CTID: (0, 1)`
   - `idx_students_name`: `Key: 'Hussein' ➔ CTID: (0, 1)`
6. **WAL Flush**: WAL record is generated; upon `COMMIT`, WAL is synced to disk. `t_xmin = 501`, `t_xmax = 0`.

### Act II: The Deceptively Simple Read (`SELECT`)

```sql
SELECT * FROM students WHERE name = 'Hussein';
```

1. **Index Search**: Traverses the B-Tree index `idx_students_name`. Finds key `'Hussein'`.
2. **Extract CTID**: Retrieves payload `CTID = (0, 1)`.
3. **Direct Memory Hop**: Buffer manager accesses Block 0 in `shared_buffers`.
4. **Line Pointer Dereference**: Reads `ItemId[1]`, reads offset `8140`.
5. **The Visibility Gatekeeper**:
   - Postgres reads `HeapTupleHeaderData`:
     - Is `t_xmin = 501` committed in `pg_xact`? **Yes**.
     - Is `t_xmax = 0`? **Yes** (row has not been deleted or updated).
   - *Why is this check required?* B-Tree indexes in PostgreSQL do **not** store transactional visibility headers! An index entry might point to a tuple inserted by an aborted transaction, a dead tuple, or a tuple modified by an in-flight transaction. The heap tuple header is the single source of truth for MVCC visibility.
6. **Return Payload**: Columns are deserialized and returned to the client.

---

## 6. The PostgreSQL UPDATE Dilemma & Write Amplification

Because PostgreSQL uses append-only MVCC, an `UPDATE` statement is physically executed as:

$$\text{UPDATE} = \text{INSERT (new tuple version)} + \text{DELETE (mark old tuple version dead)}$$

### Why Can't PostgreSQL Update in Place?
1. **Concurrent Snapshot Isolation**: Another client running a query under `READ COMMITTED` or `REPEATABLE READ` may still need to read `gpa = 3.8`. Overwriting the bytes in place would destroy ACID snapshot isolation.
2. **Variable-Length Attributes**: If an update changes a VARCHAR column to a longer string, the new value cannot physically fit in the old byte boundary without corrupting adjacent tuples.

### The Multi-Index Amplification Problem

Suppose a table has 5 indexes (`idx_id`, `idx_name`, `idx_gpa`, `idx_major`, `idx_created_at`):

```sql
UPDATE students SET gpa = 3.9 WHERE id = 1;
```

```
Without HOT (Standard Update):
Heap Page 0:
  [ItemId 1] ──> Tuple 1: [xmin: 501, xmax: 600 (DEAD), gpa: 3.8] (CTID: 0,1)

Heap Page 5 (or Page 0 if full):
  [ItemId 2] ──> Tuple 2: [xmin: 600, xmax: 0 (LIVE), gpa: 3.9] (CTID: 5,2)

Secondary Indexes (ALL 5 MUST BE UPDATED):
  idx_id         : [Key: 1]        ──> MUST insert pointer to (5,2)
  idx_name       : [Key 'Hussein'] ──> MUST insert pointer to (5,2)  ◄── UNCHANGED COLUMN!
  idx_gpa        : [Key: 3.9]      ──> MUST insert pointer to (5,2)
  idx_major      : [Key: 'CS']     ──> MUST insert pointer to (5,2)  ◄── UNCHANGED COLUMN!
  idx_created_at : [Key: '...']    ──> MUST insert pointer to (5,2)  ◄── UNCHANGED COLUMN!
```

| Physical Layer | Write Action | Amplification Overhead |
|---|---|---|
| **Heap Storage** | Marks old tuple `(0, 1)` with `xmax = 600`; appends new tuple at `(5, 2)`. | 2 tuple row versions written to heap. |
| **Secondary Indexes (5x)** | `idx_id`, `idx_name`, `idx_gpa`, `idx_major`, `idx_created_at` | **5 separate B-Tree page modifications**, inserting new key $\to$ `(5, 2)` pointers. |
| **WAL Stream** | Generates Write-Ahead Log records for Heap Page + all 5 B-Tree index pages. | Massive write amplification and disk I/O churn. |

**Consequences in High-Write Systems:**
- **Severe Write Amplification**: 1 row update produces 1 heap write + 5 random B-Tree index page writes + WAL records for all modified pages.
- **Index Bloat**: Dead index entries accumulate in all B-Tree leaf pages, degrading cache hit ratios and range scan throughput.

---

## 7. The HOT (Heap-Only Tuples) Optimization

Introduced in PostgreSQL 8.3, **HOT (Heap-Only Tuples)** eliminates secondary index write amplification.

### 7.1 Prerequisites for HOT Updates
A row update qualifies for HOT optimization if and only if:
1. **No Indexed Column is Modified**: The columns modified by the `UPDATE` are not referenced by any index on the table.
2. **Same-Page Free Space**: The same 8KB page containing the old tuple has enough free space (`pd_upper - pd_lower >= new_tuple_size`) to store the new tuple version.

### 7.2 How HOT Works Under the Hood

```
With HOT (Heap-Only Tuple):
Heap Page 0:
  [ItemId 1] ──(LP_REDIRECT)──► [ItemId 2] ──► Tuple 2: [xmin: 600, xmax: 0, gpa: 3.9] (HOT)
                                              Tuple 1: [xmin: 501, xmax: 600, gpa: 3.8] (DEAD)

Secondary Indexes (ZERO MODIFICATIONS!):
  idx_id         : [Key: 1]        ──> STILL points to (0, 1)  (Untouched!)
  idx_name       : [Key 'Hussein'] ──> STILL points to (0, 1)  (Untouched!)
  idx_major      : [Key: 'CS']     ──> STILL points to (0, 1)  (Untouched!)
```

| Component | In-Page State | HOT Optimization Mechanism |
|---|---|---|
| **Line Pointer `ItemId[1]`** | `lp_flags: LP_REDIRECT ➔ ItemId[2]` | Redirection pointer. B-Tree indexes continue pointing to `(0, 1)` without modifications. |
| **Line Pointer `ItemId[2]`** | `lp_flags: LP_NORMAL ➔ Byte 8000` | Points to the new tuple payload version on the same page. |
| **Old Tuple #1** | `xmax: 600, HEAP_HOT_UPDATED` | Marked dead, preserved until transactions older than snapshot commit. |
| **New Tuple #2** | `xmin: 600, HEAP_ONLY_TUPLE (0, 2)` | Valid new version. No index entry points to `(0, 2)` directly (heap-only). |
| **Secondary Indexes** | Point to `CTID (0, 1)` | **Zero index page writes**. Index traversals follow `LP_REDIRECT` in memory. |

### 7.3 HOT Execution Lifecycle
1. **Insert New Tuple**: The new tuple is written to the same page with `HEAP_ONLY_TUPLE` flag set.
2. **Mark Old Tuple**: The old tuple is updated with `xmax = current_xid` and `HEAP_HOT_UPDATED` flag set.
3. **Chain Redirection**: `ItemId[1]` becomes an `LP_REDIRECT` pointer pointing to `ItemId[2]`.
4. **Zero Index Modifications**: Indexes are never touched.
5. **Index Traversal**: When an index lookup searches for `(0, 1)`, the buffer manager loads Page 0, reads `ItemId[1]`, follows `LP_REDIRECT` to `ItemId[2]`, and reads Tuple #2 seamlessly in memory.
6. **Opportunistic Pruning**: When subsequent queries read Page 0, if the old transaction has committed and no active snapshot requires Tuple #1, PostgreSQL opportunistically reclaims Tuple #1 space without waiting for autovacuum.

### 7.4 The `fillfactor` Tuning Strategy
By default, PostgreSQL fills heap pages to 100% capacity (`fillfactor = 100`). On update-heavy tables, subsequent updates fail the second HOT condition (insufficient page space), reverting to slow non-HOT updates.

```sql
-- Reserve 15-25% free space in each page for in-page HOT updates
ALTER TABLE orders SET (fillfactor = 80);

-- Rebuild table to apply new fillfactor to existing pages
VACUUM FULL orders; -- or: pg_repack -t orders
```

---

## 8. Janitors: Opportunistic Pruning vs Autovacuum

PostgreSQL employs two distinct cleanup mechanisms to deal with dead tuples:

```
Dead Tuple Cleanup Mechanisms:
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Opportunistic In-Page Pruning (Micro-Vacuum)                        │
│    - Triggered during regular SELECT or UPDATE statements.             │
│    - Operates purely within a single 8KB page in shared_buffers.       │
│    - Reclaims dead HOT tuple bytes and defragments page space.         │
│    - Zero table locks, zero B-Tree index scans.                        │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Autovacuum Daemon                                                   │
│    - Background worker triggered when dead tuples exceed scale factor. │
│    - Phase 1: Scans heap to find dead line pointers (marks LP_DEAD).   │
│    - Phase 2: Scans all B-Tree indexes to remove dead index pointers.  │
│    - Phase 3: Returns to heap, marks LP_DEAD slots as LP_UNUSED.       │
│    - Updates Visibility Map (VM) and Free Space Map (FSM).             │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.1 Opportunistic In-Page Pruning (Micro-Vacuum)
- When a `SELECT` reads an 8KB block, it checks `pd_prune_xid` in the page header.
- If `pd_prune_xid` is older than the oldest active transaction (`oldestxmin`), PostgreSQL knows that at least one dead tuple version in a HOT chain can be safely reclaimed.
- The reader backend removes the dead tuple, shifts remaining tuples to close the gap, updates `pd_upper`, and updates `ItemId[1]` to point directly to the live tuple.
- **Key Insight**: Page defragmentation happens on the fly without waiting for autovacuum!

### 8.2 Autovacuum vs VACUUM FULL vs pg_repack

| Feature Dimension | Standard VACUUM | VACUUM FULL | pg_repack |
|---|---|---|---|
| **Lock Required** | `SHARE UPDATE EXCLUSIVE` | `ACCESS EXCLUSIVE` (Exclusive table lock) | `ACCESS SHARE` (Concurrent table access) |
| **Concurrent Reads** | ✅ Yes (Unblocked) | ❌ Blocked | ✅ Yes (Unblocked) |
| **Concurrent Writes** | ✅ Yes (Unblocked) | ❌ Blocked | ✅ Yes (Unblocked) |
| **Reclaims OS Disk Space** | ❌ No (Space returned to page FSM for future inserts) | ✅ Yes (Physical table file completely rewritten) | ✅ Yes (Table file rebuilt in shadow table) |
| **Updates FSM & VM** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Production Safety** | ✅ Always safe (Autovacuum engine) | ⚠️ Requires dedicated maintenance window | ✅ Safe for zero-downtime online bloat compaction |

---

## 9. Auxiliary Maps: Free Space Map (FSM) & Visibility Map (VM)

Each table in PostgreSQL has two auxiliary file forks:

```
2619          (Heap Data Fork)
├── 2619_fsm  (Free Space Map Fork)
└── 2619_vm   (Visibility Map Fork)
```

### 9.1 Free Space Map (`_fsm`)
- Stored as a binary tree of page space availability categories ($0 \text{ to } 255$).
- When an `INSERT` occurs, PostgreSQL queries the FSM to locate a page with sufficient bytes instead of sequentially scanning the entire table or appending to the end of the file.

### 9.2 Visibility Map (`_vm`)
Stores 2 bits for every 8KB page in the heap:
1. **Bit 0 (All-Visible)**: Set to `1` if all tuples on the page are committed and visible to all current and future transactions.
2. **Bit 1 (All-Frozen)**: Set to `1` if all tuples on the page have been frozen (safe from transaction ID wraparound).

### 9.3 Index-Only Scans
Because secondary indexes do not store transaction visibility headers (`xmin`/`xmax`), an index lookup would normally always have to visit the heap page to verify visibility.

With the **Visibility Map**, if the target page is marked **All-Visible**, PostgreSQL skips the heap page visit entirely:

$$\text{B-Tree Index Scan} \xrightarrow{\text{VM Bit = 1}} \text{Return Data Directly (Index-Only Scan)}$$

---

## 10. Production Engineering Rules & Gotchas

### Rule 1: The `updated_at` Index Anti-Pattern
Every engineer defaults to adding `CREATE INDEX idx_orders_updated_at ON orders(updated_at);`.
- **The Trap**: If your backend updates `updated_at = NOW()` on every modification, **HOT is permanently disabled for 100% of your updates** (Condition 1 violated).
- **The Impact**: Every single update forces writes to all secondary indexes, driving massive write amplification and table bloat.
- **The Solution**: Avoid indexing `updated_at` unless strictly required for range queries; or use partial/composite indexes.

### Rule 2: Tune `fillfactor` for Update-Heavy Tables
For tables with high update frequency (e.g. account balances, order statuses, user sessions):
```sql
-- Leave 20% room on every 8KB page for HOT updates
ALTER TABLE sessions SET (fillfactor = 80);
```

### Rule 3: Beware of Long-Running Transactions Pinning `oldestxmin`
PostgreSQL tracks `oldestxmin` across all active connections. If an analytics query, uncommitted `BEGIN;` session, or abandoned replication slot remains open:
- Autovacuum **cannot** remove any dead tuple created after `oldestxmin`.
- Table and index files grow uncontrollably until disk space is exhausted.

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

## 11. Hands-On Inspection with `pageinspect`

Run this script in `psql` to inspect line pointers and HOT chains directly on disk:

```sql
CREATE EXTENSION IF NOT EXISTS pageinspect;

-- 1. Create test table with fillfactor 80
CREATE TABLE test_hot (id int, val int, note text) WITH (fillfactor = 80);
CREATE INDEX idx_test_id ON test_hot(id);

-- 2. Insert initial row
INSERT INTO test_hot VALUES (1, 100, 'Initial');

-- 3. Check page items: Line Pointer 1 is LP_NORMAL
SELECT lp, lp_off, lp_flags, lp_len, t_xmin, t_xmax, t_ctid 
FROM heap_page_items(get_raw_page('test_hot', 0));
-- lp: 1 | lp_flags: 1 (NORMAL) | t_ctid: (0,1)

-- 4. Update non-indexed column (HOT update occurs)
UPDATE test_hot SET val = 101 WHERE id = 1;

-- 5. Inspect again: Line Pointer 1 is now LP_REDIRECT (2)!
SELECT lp, lp_off, lp_flags, lp_len, t_xmin, t_xmax, t_ctid 
FROM heap_page_items(get_raw_page('test_hot', 0));
-- lp: 1 | lp_flags: 2 (REDIRECT) | lp_off: 2 (points to Line Pointer 2)
-- lp: 2 | lp_flags: 1 (NORMAL)   | t_ctid: (0,2)
```

---

## 12. Summary: The 5 Golden Takeaways

1. **PostgreSQL is Heap-First**: Tables are unordered heaps of 8KB slotted pages. Secondary indexes point directly to physical coordinates (`CTID: Block#, Offset#`).
2. **Secondary Index Reads are $O(1)$ Direct**: Unlike MySQL InnoDB (which requires a second B+Tree traversal through the primary key), PostgreSQL jumps directly from index leaf to page memory.
3. **Every Update is an Append**: An `UPDATE` writes a new tuple version and stamps `xmax` on the old one. If CTID changes, all secondary indexes must be updated.
4. **HOT Saves Write Throughput**: If no indexed column is modified and space exists on the same page, `LP_REDIRECT` chains the line pointers and leaves secondary indexes completely untouched.
5. **Pruning is the Unsung Hero**: Read queries opportunistically prune dead HOT chains and defragment 8KB pages in RAM without waiting for Autovacuum.

---

### Compare Next
- [PostgreSQL Checkpoint Tuning & WAL Buffers](./postgresql-checkpoint-wal-tuning.md)
- [PostgreSQL BRIN Index (Block Range Index): 99% Smaller Than B-Tree](./postgresql-brin-index-guide.md)
- [Storage Engines & Data Structures](./storage-engines-data-structures.md)
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Database Transactions & Concurrency Control](./transactions-concurrency.md)
