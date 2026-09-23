---
id: online-ddl-gh-ost-pt-osc-internals
title: "Online DDL: Adding Indexes Safely in Production — ALGORITHM Matrix, Row Log & gh-ost vs pt-osc"
sidebar_label: "Online DDL & Safe Index Creation"
description: "Online Schema Change mechanics in MySQL and PostgreSQL: why staging finishes in 40s while production exhausts connection pools, ALGORITHM & LOCK matrix, innodb_online_alter_log_max_size overflow, gh-ost vs pt-osc, and PostgreSQL's INVALID index trap."
tags: [database, mysql, postgresql, online-ddl, gh-ost, pt-osc, schema-migrations, indexing, sre]
sidebar_position: 11
---

import OnlineDdlComparisonDiagram from '@site/src/components/OnlineDdlComparisonDiagram';

# Online DDL: Adding Indexes Safely in Production — ALGORITHM Matrix, Row Log & gh-ost vs pt-osc

Adding an index to a database table is the most common response to a slow query alert.

In the staging environment, the migration runs without incident:
```sql
ALTER TABLE orders ADD INDEX idx_user_status (user_id, status);
-- Query OK, 0 rows affected (42.50 sec)
```
After 40 quiet seconds, the index is ready. Confident in the result, an engineer runs the identical statement on Production at 2:00 PM.

Within 10 seconds, monitoring dashboards turn red: **the application connection pool is depleted, hundreds of threads show `Waiting for table metadata lock`, and the checkout funnel grinds to a complete halt.**

Why does an identical DDL statement succeed in staging but crash production? How do enterprise engineering teams execute schema modifications on tables with hundreds of millions of rows with **true zero downtime**?

<OnlineDdlComparisonDiagram initialTab="algorithm_matrix" />

---

## 1. Staging vs Production: Why Staging Takes 40s While Production Melts Down

The critical difference between Staging and Production is not table size; it is **the presence of concurrent transactions**:

```text
Production Lifecycle of an ALTER TABLE Statement:
Phase 1: DDL Initialization ──> Requires Metadata Lock (MDL) Exclusive for 1 millisecond
                                 ├── If any transaction is reading the table ➔ DDL WAITS!
                                 └── DDL occupies HEAD OF WAIT QUEUE ➔ BLOCKS all subsequent user queries!

Phase 2: DDL Execution      ──> Builds B+Tree, captures concurrent writes into Row Log
                                 └── If write buffer overflows ➔ DDL CRASHES and rolls back!

Phase 3: DDL Finalization   ──> Re-acquires MDL Exclusive for 1 millisecond to swap metadata
                                 └── Triggers a second potential lock queue cascade!
```

In Staging, with no other users on the system, MySQL acquires the brief Exclusive MDL instantly ($<1\text{ms}$) and builds the index in isolation.
In Production, continuous read/write traffic causes the initial MDL acquisition to block, triggering a cascading stall across the application tier.

---

## 2. The ALGORITHM & LOCK Matrix in MySQL 8.0+

InnoDB provides native **Online DDL** with three distinct algorithms and lock levels:

<OnlineDdlComparisonDiagram initialTab="algorithm_matrix" />

### The Three Execution Algorithms
1. **`ALGORITHM=INSTANT` (MySQL 8.0+)**:
   - Updates metadata only in the data dictionary.
   - Completes in **under 0.1 seconds**, regardless of table size (even on 1-billion-row tables).
   - Supports: Adding columns at the end of a table (8.0.12+) or anywhere (8.0.29+), changing default values, and dropping virtual columns.
2. **`ALGORITHM=INPLACE` (Default for Secondary Indexes)**:
   - Avoids creating an intermediate copy table. B+Tree sorting and construction occur within InnoDB temporary memory structures.
   - **Permits concurrent read and write operations (Concurrent DML)** throughout index creation.
3. **`ALGORITHM=COPY` (Legacy Engine Mechanism)**:
   - Creates an internal temporary table, copies every row sequentially, rebuilds all indexes, and renames the table.
   - **Places the table in Read-Only mode**, completely blocking all application writes!

### The Three Lock Levels
- **`LOCK=NONE`**: Permits concurrent reads and writes (required for online changes).
- **`LOCK=SHARED`**: Permits concurrent reads, but **blocks all writes (INSERT, UPDATE, DELETE)**.
- **`LOCK=EXCLUSIVE`**: Completely locks the table against both reads and writes.

> **Production Standard**: When executing DDL in production, always declare explicit clauses:
> ```sql
> ALTER TABLE orders ADD INDEX idx_user_id (user_id), 
>   ALGORITHM=INPLACE, LOCK=NONE;
> ```
> If the requested operation cannot be performed without table locks, MySQL **fails immediately with an error rather than silently blocking production writes**.

---

## 3. The INPLACE Row Log Overflow Trap: `innodb_online_alter_log_max_size`

A common misconception is: *"I specified `ALGORITHM=INPLACE, LOCK=NONE`, so the migration is completely safe."*

After running for 2 hours on a 100-million-row table, the DDL abruptly fails:

```text
ERROR 1799 (HY000): Creating index 'idx_user_id' required more than 
'innodb_online_alter_log_max_size' bytes of modification data.
```

<OnlineDdlComparisonDiagram initialTab="row_log_trap" />

### Mechanics of the Online Alter Row Log
1. While `ALGORITHM=INPLACE` scans the clustered index to construct the new B+Tree, concurrent user writes (`INSERT`, `UPDATE`, `DELETE`) are allowed to proceed.
2. To keep the new index consistent, InnoDB records all concurrent modifications in a memory buffer: the **Online Alter Row Log**.
3. This buffer is bounded by `innodb_online_alter_log_max_size` (default: **128MB**).
4. **The Failure**: If the table takes 2 hours to build, and application write volume generates $>128\text{MB}$ of changes during that window, **the buffer overflows!**
5. MySQL terminates the DDL statement and initiates a **full rollback**, discarding hours of CPU and I/O effort.

### Production Solution
Temporarily elevate the buffer size for the DDL session before running the index creation:
```sql
SET SESSION innodb_online_alter_log_max_size = 2147483648; -- 2 GB
ALTER TABLE orders ADD INDEX idx_user_id (user_id), ALGORITHM=INPLACE, LOCK=NONE;
```

---

## 4. Tool Comparison: `gh-ost` vs `pt-online-schema-change`

For high-volume tables ($>50\text{M}$ rows or $>100\text{GB}$), native INPLACE DDL can still cause I/O starvation. Engineering teams at GitHub, Stripe, and Shopify rely on specialized tooling:

<OnlineDdlComparisonDiagram initialTab="ghost_vs_ptosc" />

### `pt-online-schema-change` (Percona Toolkit)
- **Mechanics**: Creates a ghost table (`_orders_new`), copies data in small primary-key chunks, and attaches **3 synchronous database triggers** (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`) to the source table to capture incoming writes.
- **Production Vulnerabilities**:
  - **Write Amplification**: Every user write must execute trigger logic, increasing row lock hold times.
  - **Deadlocks**: Triggers frequently deadlock with concurrent application transactions under load.
  - **Cannot Pause**: Cannot be paused during unexpected traffic spikes without losing sync.

### GitHub's `gh-ost` (Triggerless Binlog Streaming)
- **Mechanics**: **Operates without database triggers.**
  - `gh-ost` connects to MySQL as an asynchronous replication client and **reads the Binary Log (binlog) stream directly**.
  - It converts binlog events into asynchronous writes applied to the ghost table (`_orders_gho`).
- **Production Advantages**:
  - **Dynamic Throttling**: Automatically throttles or pauses data copying if replication lag exceeds 1 second or database CPU exceeds 70%.
  - **Pausable**: Can be manually paused during peak hours and resumed during off-peak windows.
  - **Safe Cut-Over**: Swaps the original and ghost tables using an atomic, non-blocking `RENAME TABLE` in milliseconds.

---

## 5. PostgreSQL: The 2-Pass Scan and the `INVALID` Index Trap

In PostgreSQL, a standard `CREATE INDEX` statement acquires an **`ACCESS EXCLUSIVE`** lock, blocking both reads and writes until completion.

To create indexes without blocking traffic, PostgreSQL provides:
```sql
CREATE INDEX CONCURRENTLY idx_orders_user ON orders (user_id);
```

<OnlineDdlComparisonDiagram initialTab="pg_concurrently" />

### The 2-Pass Table Scan Protocol
To avoid write locks (`SHARE UPDATE EXCLUSIVE`), PostgreSQL executes **two full table scans**:
1. **Pass 1**: Waits for active write transactions to clear, scans the table, and constructs the initial B+Tree.
2. **Pass 2**: Performs a second table scan to capture rows inserted or modified while Pass 1 was running.
3. Waits for old read transactions to complete, then marks the index valid (`indisvalid = true`).

### The `INVALID` Index Trap
If a concurrent index build is interrupted (via `Ctrl+C`, statement timeout, unique constraint violation, or deadlock detection):
- PostgreSQL **DOES NOT delete the broken index**.
- The index remains in the catalog with the flag `indisvalid = false`.

```text
The Cost of an Orphaned INVALID Index:
├── Query Optimizer: NEVER USES the index to accelerate SELECT queries!
└── Every INSERT/UPDATE: STILL PAYS THE I/O PENALTY OF WRITING TO THIS INDEX!
    (Wastes disk space and degrades write performance with zero read benefit!)
```

### Detection and Remediation
Find all invalid indexes in the database:
```sql
SELECT relname, indrelid::regclass, indisvalid 
FROM pg_index i 
JOIN pg_class c ON c.oid = i.indexrelid 
WHERE NOT indisvalid;
```
Clean up or rebuild the index safely:
```sql
-- Option A: Drop the invalid index without blocking writes:
DROP INDEX CONCURRENTLY idx_orders_user;

-- Option B: Rebuild online (PostgreSQL 12+):
REINDEX INDEX CONCURRENTLY idx_orders_user;
```
