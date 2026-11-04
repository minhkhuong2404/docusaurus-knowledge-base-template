---
id: exporting-large-datasets-streaming-internals
title: "Exporting 5 Million Rows Without Killing the Database: Keyset Seek, JDBC Buffers & net_write_timeout"
sidebar_label: "Exporting 5M Rows Without OOM"
description: "Physical engine mechanics of large-scale database exports: why LIMIT OFFSET degrades linearly, keyset pagination pitfalls, Go streaming vs Java JDBC OutOfMemoryError, and an anatomy of the net_write_timeout socket failure."
tags: [database, mysql, performance, pagination, keyset, streaming, jdbc, memory-leaks, net-write-timeout]
sidebar_position: 6
---

import DatabaseStreamingExportDiagram from '@site/src/components/DatabaseStreamingExportDiagram';

# Exporting 5 Million Rows Without Killing the Database: Keyset Seek, JDBC Buffers & net_write_timeout

In financial reporting systems, e-commerce analytics, and enterprise multi-tenant SaaS platforms, exporting datasets ranging from 1 million to 5 million records into CSV or Excel is a routine requirement.

Yet, some of the most catastrophic database outages in production originate from this exact feature:
1. In the staging environment with 5,000 rows, the export finishes smoothly in under 2 seconds.
2. In production with 5,000,000 rows, the database CPU spikes to 100%, application servers run out of memory with `OutOfMemoryError: Java heap space`, or after exactly 60 seconds the socket abruptly terminates with a cryptic error:

```text
ERROR 1160 (08S01): Got an error writing communication packets
```

This article dissects the physical engine mechanics of how databases traverse millions of B+Tree pages, contrasts the fundamental socket buffering architectures of Go and Java JDBC, and provides an enterprise-grade runbook for multi-million-row streaming exports.

<DatabaseStreamingExportDiagram initialTab="limit_offset" />

---

## 1. Why `LIMIT OFFSET` Degrades as Pagination Goes Deeper

The most intuitive implementation of batch export is looped offset pagination:

```sql
SELECT * FROM transactions ORDER BY id LIMIT 1000 OFFSET 0;
SELECT * FROM transactions ORDER BY id LIMIT 1000 OFFSET 1000;
...
SELECT * FROM transactions ORDER BY id LIMIT 1000 OFFSET 4999000;
```

### Physical Mechanics of B+Tree Leaf Traversal
Developers often assume that the database engine can jump directly to the 4,500,000th row in $O(1)$ time. In physical storage:
- In InnoDB, B+Tree leaf pages are linked together as a doubly-linked list.
- Because records have variable lengths (`VARCHAR`, `TEXT`, `NULL` bitmaps) and pages fragment over time due to deletes, **each 16KB leaf page contains an unpredictable number of rows**.
- The database **cannot calculate the physical memory or disk offset** of the 4,500,000th row in advance.

```text
Physical Execution Cost of LIMIT M OFFSET N:
└── B+Tree Root ──> Traverses index tree down to the very first leaf page
    └── Sequential scan across (N + M) records along the leaf page linked list:
        ├── Reads and DISCARDS 4,500,000 records! (Consuming disk I/O and CPU)
        └── Returns only the final 1,000 records.
```

### The Systemic Blast Radius:
- **Time Complexity**: $O(N + M)$ rather than $O(\log N)$. Later pages take orders of magnitude longer to execute.
- **Buffer Pool Thrashing (LRU Pollution)**: Scanning millions of leaf pages continuously evicts "hot" working-set data (active user sessions, carts, catalog items) out of InnoDB's Buffer Pool, degrading system-wide latency for all other online transactions.

---

## 2. Keyset Pagination (Seek Method): Caveats & Constraints

The architectural solution to eliminate offset traversal overhead is **Keyset Pagination** (the Seek Method):

```sql
-- Initial Batch:
SELECT id, created_at, amount 
FROM transactions 
ORDER BY id ASC 
LIMIT 5000;

-- Subsequent Batches: Seek directly from the last observed checkpoint
SELECT id, created_at, amount 
FROM transactions 
WHERE id > :last_seen_id 
ORDER BY id ASC 
LIMIT 5000;
```

<DatabaseStreamingExportDiagram initialTab="keyset_seek" />

### Why Keyset Delivers Constant $O(\log N)$ Speed
Instead of scanning sequentially from the beginning of the table, the predicate `WHERE id > :last_seen_id` allows the storage engine to execute a **B+Tree Index Seek**:
1. Starting from the Root page, InnoDB navigates internal nodes and lands directly on the leaf page containing `:last_seen_id` within 3 to 4 I/O operations ($O(\log N)$).
2. From that precise leaf node, it sequentially reads exactly the next 5,000 rows.
3. Execution time remains completely flat from row 1 to row 5,000,000.

### Production Pitfalls: When Keyset Fails Silently

#### Pitfall 1: Non-Unique Sort Columns & Skipped Records
If you paginate by a non-unique column such as a creation timestamp:

```sql
-- ❌ DANGEROUS: Silently drops records under concurrent writes!
SELECT * FROM transactions 
WHERE created_at > :last_created_at 
ORDER BY created_at ASC LIMIT 5000;
```

In high-concurrency systems, multiple transactions frequently share the **exact same microsecond `created_at` timestamp**. If batch $N$ stops halfway through a cluster of records sharing the same timestamp, the strict inequality `created_at > :last_created_at` will permanently skip the remaining records in that cluster!
- **Remediation**: Always append a unique tie-breaker column (such as the Primary Key) and leverage composite indexes with tuple comparisons (Row Value Constructors):

```sql
-- ✅ SAFE: Deterministic Tuple Comparison
SELECT * FROM transactions 
WHERE (created_at, id) > (:last_ts, :last_id) 
ORDER BY created_at ASC, id ASC 
LIMIT 5000;
```
*Requirement*: The table must have a covering composite index on `(created_at, id)`.

#### Pitfall 2: Nullable Sort Columns
In ANSI SQL, comparing against `NULL` using `NULL > :value` always evaluates to `UNKNOWN` (treated as `FALSE`). If the pagination column contains null values, those records will be permanently omitted from the export stream.

---

## 3. Driver Buffering: Go Streams by Default, Java Hoards Heap

Even with an optimal keyset query, your backend service can still crash due to how the client database driver manages network socket memory.

<DatabaseStreamingExportDiagram initialTab="jvm_vs_go" />

### Go's Native Socket Streaming (`database/sql`)
In Go:
```go
rows, err := db.Query("SELECT * FROM transactions WHERE ...")
if err != nil {
    return err
}
defer rows.Close()

for rows.Next() {
    var tx Transaction
    if err := rows.Scan(&tx.ID, &tx.Amount); err != nil {
        return err
    }
    // Process row-by-row directly from the network buffer
}
```
The Go SQL driver is designed around non-blocking TCP socket streaming by default:
- Data is received incrementally in chunks that fit within the OS TCP receive window.
- Calling `rows.Next()` fetches the next packet from the socket. Memory utilization remains completely flat (typically under 15MB of RAM) whether streaming 5 thousand or 50 million records.

### Java JDBC's Default Behavior: Heap Exhaustion
In the Java ecosystem, the JDBC specification states that `ResultSet` objects must support cursor metadata and scrollability by default. Consequently, **MySQL Connector/J defaults to reading the entire 5,000,000-row result set into JVM Heap memory** before returning execution control to the application!

The result is instant heap saturation and failure:
```text
java.lang.OutOfMemoryError: Java heap space
```

### Two Production Solutions in Java JDBC

#### Approach 1: Streaming ResultSet (Row-by-Row Socket Cursor)
By setting the fetch size to the magic constant `Integer.MIN_VALUE`, Connector/J switches to streaming rows one-by-one directly from the socket:

```java
// ✅ Enable true client-side socket streaming in MySQL Connector/J
Statement stmt = connection.createStatement(
    ResultSet.TYPE_FORWARD_ONLY,
    ResultSet.CONCUR_READ_ONLY
);

// Magic constant instructing Connector/J not to buffer rows into heap:
stmt.setFetchSize(Integer.MIN_VALUE);

try (ResultSet rs = stmt.executeQuery("SELECT * FROM transactions")) {
    while (rs.next()) {
        writeToCsv(rs);
    }
}
```
*Critical Invariant*: When a connection is in streaming mode (`Integer.MIN_VALUE`), no other query can be executed on that physical connection until the entire `ResultSet` has been fully drained or closed.

#### Approach 2: Server-Side Cursors
By adding `useCursorFetch=true` to the JDBC connection string:
```text
jdbc:mysql://localhost:3306/db?useCursorFetch=true
```
You can configure a bounded batch fetch: `stmt.setFetchSize(5000);`. The MySQL server will materialize the result set into an internal temporary cursor and stream back 5,000 rows per round-trip.

---

## 4. Anatomy of the `net_write_timeout` Outage

Even after implementing keyset pagination and JDBC streaming, exports can still fail under the following condition:

```text
com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
Caused by: java.io.IOException: Got an error writing communication packets (Error 1160)
```

<DatabaseStreamingExportDiagram initialTab="net_write_timeout" />

### Socket Buffer Starvation Mechanics
1. **Producer is Fast**: The MySQL server thread executes the query, fetching data from the Buffer Pool and pushing packets into the OS **TCP Send Buffer** at line speed (tens of MB/s).
2. **Consumer is Slow**: The backend application reads rows one-by-one, but performs CPU-heavy formatting per record: parsing timestamps, escaping CSV strings, compressing data via `GZIPOutputStream`, or piping bytes over a slow network connection to AWS S3.
3. **TCP Zero Window**: The application's OS TCP Receive Window fills to capacity. The client's TCP stack transmits a **TCP Zero Window** probe to the MySQL server, indicating that no more bytes can be accepted.
4. **MySQL Thread Hangs**: The server process cannot write further bytes to the socket and enters a wait state.
5. **The `net_write_timeout` Timer Expires**:
   - MySQL enforces `net_write_timeout` (default: **60 seconds**).
   - If the socket remains blocked for 60 consecutive seconds without draining, **the MySQL server unilaterally closes the TCP connection**, aborting the query and leaving the client stranded with Error 1160.

### Production Runbook & Architecture

```text
Decoupled Streaming Pipeline:
Database (Stream) ──> RingBuffer/Queue (In-memory) ──> Worker (Format/GZIP) ──> S3 Upload
```

1. **Decouple Ingestion from Processing (RingBuffer Architecture)**:
   - Dedicate a single reader thread solely to reading rows from the JDBC socket and placing raw DTOs into a bounded in-memory queue (e.g., `ArrayBlockingQueue(10000)` or LMAX Disruptor).
   - Downstream worker threads consume from the queue, format the CSV, and compress the stream. Socket draining is never blocked by compression or remote upload latency.
2. **Elevate Session-Level Timeouts**:
   Before executing multi-million-row export queries, extend the socket timeout for that specific session:
   ```sql
   SET SESSION net_write_timeout = 3600; -- 1 hour
   ```
3. **Asynchronous Background Processing (The 7-Step Production Architecture)**:
   - Never hold open an active synchronous HTTP request for multi-gigabyte file exports.
   - Trigger an asynchronous job via a task queue, upload the finalized file to an object store (S3/GCS), and deliver a signed pre-signed download URL via notification or webhook upon completion.

---

## 5. The ID-List (Two-Query Deferred Join) Batch Pattern & Ordering Gotcha

When exporting a filtered subset across a composite index (e.g., `INDEX idx_shop_created (shop_id, created_at)`), InnoDB automatically appends the Primary Key `id` to every secondary index leaf entry. You can exploit this by splitting each batch into **two ultra-fast queries**:

```sql
-- Step 1: Covering Index Scan (Touches ONLY the secondary index in RAM, zero table lookups!)
SELECT id, created_at
FROM orders
WHERE shop_id = 42
  AND (created_at > :lastCreatedAt OR (created_at = :lastCreatedAt AND id > :lastId))
ORDER BY created_at ASC, id ASC
LIMIT 5000;

-- Step 2: Primary Key Lookup for those 5,000 IDs
SELECT id, shop_id, customer_name, total_amount, created_at
FROM orders
WHERE id IN (:id1, :id2, ..., :id5000)
ORDER BY created_at ASC, id ASC; -- <-- CRITICAL: NEVER OMIT THIS ORDER BY!
```

> [!WARNING]
> **The `WHERE id IN (...)` Ordering Trap:**
> Many developers assume that if they pass IDs into `WHERE id IN (105, 102, 109)` in sorted order, the database will return rows in that exact order. **SQL makes zero ordering guarantee without an explicit `ORDER BY`!** InnoDB will typically execute `WHERE id IN (...)` in ascending `PRIMARY KEY (id)` order, which can scramble your `ORDER BY created_at ASC, id ASC` sequence unless you either include `ORDER BY created_at ASC, id ASC` on Step 2 or re-order the 5,000 rows in application memory using the ID list from Step 1!

---

## 6. Streaming vs. Keyset Batching: The Hidden MVCC & Undo Log Cost

Why not just use JDBC `setFetchSize(Integer.MIN_VALUE)` streaming for every 10-minute export? Because a single long-running query holds open a **Database Transaction Snapshot** and a **dedicated connection** for the entire duration:

| Dimension | Single JDBC Streaming Query (`Integer.MIN_VALUE`) | Keyset / ID-List Pagination (5,000 rows/batch) |
| :--- | :--- | :--- |
| **Connection Hold Time** | Pins 1 HikariCP connection continuously for 5–20 minutes. | Borrows a connection for ~15ms per batch, releasing it between batches. |
| **InnoDB MVCC & Undo Log Impact** | **High Risk:** In `REPEATABLE READ`, a 15-minute query holds an old `ReadView`, blocking the InnoDB Purge Thread from cleaning up Undo Logs (`History List Length` spikes across the entire DB!). | **Zero MVCC Bloat:** Each 5,000-row query opens and closes its `ReadView` in milliseconds. |
| **Mid-Export Failure Recovery** | If the network drops at row 4,900,000, the entire stream aborts (`Error 1160`) and must restart from row 0. | Worker checkpoints `(last_created_at, last_id)` + S3 Multipart `uploadId` after every batch; resumes from row 4,900,000! |
| **Snapshot Consistency** | Strictly consistent point-in-time snapshot from start of query. | Eventual across batches unless upper-bounded by `AND created_at <= :exportRequestedAt`. |

---

## 7. End-to-End Production Architecture for 5-Million-Row Exports

To export millions of rows without threatening online OLTP traffic, combine **Status Store + Work Queue + Keyset Batching + S3 Multipart Upload**:

1. **API Request (`POST /exports`):** Insert a job record into a **Status Store** (`export_jobs` table or Redis: `status = PENDING`, `upper_bound_ts = NOW()`) and enqueue `jobId` into a **Work Queue** (AWS SQS / RabbitMQ), returning `202 Accepted` immediately.
2. **Worker Acquisition & Heartbeating:** An export worker pulls the job, transitions status to `RUNNING`, and initiates an **AWS S3 Multipart Upload** (`createMultipartUpload` $\rightarrow$ `uploadId`).
3. **Keyset / ID-List Batch Loop (Read Replica):** The worker queries the **Read Replica** (never the Primary writer!) using composite keyset pagination `(created_at, id) > (:lastTs, :lastId) AND created_at <= :upperBoundTs LIMIT 5000`.
4. **Stream-to-Part Buffering:** Rows are formatted into CSV/Parquet and compressed (`GZIPOutputStream`) into a bounded buffer. Every time the buffer reaches **5 MB–10 MB**, the worker uploads a part (`uploadPart`) to S3 and discards the buffer from JVM Heap.
5. **Progress Checkpointing & Lease Renewal:** After each part upload, the worker updates `export_jobs` (`processed_rows`, `last_cursor`, `completed_part_etags`) and extends the queue visibility timeout (`ChangeMessageVisibility`).
6. **Completion (`CompleteMultipartUpload`):** Once a batch returns `< 5000` rows, the worker sends `CompleteMultipartUpload` with the list of part `ETag`s, generates a **Pre-Signed S3 Download URL**, and marks `status = COMPLETED`.
7. **Idempotent Crash Recovery:** If a worker pod is OOMKilled or preempted at 80%, the next worker reads `last_cursor` and `completed_part_etags` from the Status Store and resumes uploading from the exact next batch!

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Large Dataset Export & Database Streaming Interviews

When an interviewer asks *"A customer clicks 'Export 5 Million Orders to CSV' and our Spring Boot server crashes with OOM or kills the database—how do you redesign it?"*, a mid-level candidate suggests *"Use pagination with `LIMIT 10000 OFFSET N`."* A **Principal Engineer** explains **why `OFFSET` is $O(N^2)$**, contrasts **MySQL JDBC full-ResultSet buffering vs. `Integer.MIN_VALUE` socket streaming**, diagnoses **`net_write_timeout` (Error 1160)** and **InnoDB Undo Log (`History List Length`) bloat**, and designs an **asynchronous Keyset + S3 Multipart checkpointed pipeline**.

### 1. The 60-Second Senior Framing Strategy

1. **Eliminate Synchronous HTTP & Heap Accumulation:** Exporting 5M rows ($\sim 2.5\text{ GB}$) inside an HTTP request thread or loading them into a `List<OrderEntity>` guarantees `OutOfMemoryError`. Memory footprint must be **$O(1)$ ($\le 10\text{ MB}$)** regardless of whether the export is 50,000 or 50,000,000 rows.
2. **Replace `OFFSET` with Composite Keyset Pagination:** Point out that paging 5M rows in batches of 5,000 using `LIMIT 5000 OFFSET N` forces the database to scan and discard $\frac{5000 \times 1000 \times 1001}{2} \approx \mathbf{2.5\text{ billion rows}}$ ($O(N^2)$)! Keyset pagination (`WHERE (created_at, id) > (?, ?)`) seeks directly to the cursor in $O(\log N)$ per batch.
3. **Explain JDBC Wire-Protocol Buffering & `net_write_timeout`:** Highlight that MySQL Connector/J buffers the *entire* result set in JVM RAM by default unless `setFetchSize(Integer.MIN_VALUE)` or `useCursorFetch=true` is used—and explain why slow client-side S3 uploads during socket streaming trigger MySQL **`net_write_timeout` (60s)**.
4. **Protect OLTP via Read Replicas & Bounded MVCC Transactions:** Route exports to a Read Replica using short-lived keyset batches + S3 Multipart Upload checkpoints so InnoDB's Undo Log purge thread is never blocked by a 20-minute transaction snapshot.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "I called `preparedStatement.setFetchSize(5000)` in my Spring Boot + MySQL app, why did it still crash with `OutOfMemoryError` on 5 million rows?"
* **Junior/Mid Answer:** *"Because 5,000 rows is still too large for the heap; we should lower it to 500."*
* **Principal Rebuttal:** *"In MySQL Connector/J, `setFetchSize(5000)` is **completely ignored by default**! Because the classic MySQL wire protocol streams all rows back-to-back over the TCP socket, the JDBC driver reads all 5,000,000 rows into an in-memory `ArrayList` (`ResultsetRowsStatic`) inside `executeQuery()` before returning the `ResultSet`. To stop Connector/J from buffering the entire table in RAM, you must either set the magic value **`stmt.setFetchSize(Integer.MIN_VALUE)`** (client-side row-by-row socket streaming) or add **`useCursorFetch=true`** to the JDBC URL (which allocates a server-side temporary table/cursor in MySQL so `setFetchSize(5000)` works)."*

#### Trap 2: "After we enabled `setFetchSize(Integer.MIN_VALUE)` and streamed the CSV directly to AWS S3, the export failed at minute 2 with `CommunicationsException: Got an error writing communication packets (Error 1160)`. Why did MySQL drop the connection?"
* **Junior/Mid Answer:** *"The firewall or connection pool closed the idle connection."*
* **Principal Rebuttal:** *"The connection wasn't idle—it was **choked by TCP backpressure (`net_write_timeout`)**. With `Integer.MIN_VALUE`, MySQL blasts rows into its OS TCP Send Buffer as fast as it reads pages. When our Java thread pauses or slows down to GZIP-compress data and upload chunks over the network to S3, the client's TCP Receive Window fills up (`TCP Zero Window`). The MySQL server thread blocks on `write()` waiting for the client to drain the socket. Once it blocks for **`net_write_timeout` (default 60 seconds)**, MySQL forcefully aborts the connection with Error 1160! This is why production exports decouple DB reading from S3 uploading using keyset batches or an in-memory ring buffer."*

#### Trap 3: "If we use Keyset Pagination `WHERE created_at > :lastCreatedAt ORDER BY created_at ASC LIMIT 5000`, is our export guaranteed to be accurate?"
* **Junior/Mid Answer:** *"Yes, because `created_at` is indexed and increases over time."*
* **Principal Rebuttal:** *"No—if `created_at` is not 100% unique (e.g., 20 orders created in the same second or millisecond) and happens to span across the 5,000th row boundary of Batch 1, then using `WHERE created_at > :lastCreatedAt` in Batch 2 will **silently skip** all remaining orders that shared that exact timestamp! And using `>=` will duplicate them. You must always append a unique tie-breaker column—the Primary Key `id`—to both the index `(created_at, id)` and the cursor predicate: `WHERE (created_at > :lastTs) OR (created_at = :lastTs AND id > :lastId) ORDER BY created_at ASC, id ASC`."*

#### Trap 4: "Why is running a single 15-minute streaming query dangerous for other transactions on an InnoDB database, even if CPU is low?"
* **Junior/Mid Answer:** *"Because `SELECT` locks the rows so `UPDATE` statements have to wait."*
* **Principal Rebuttal:** *"Plain `SELECT` statements in InnoDB are non-locking MVCC reads, so they don't lock rows. The danger is **MVCC Undo Log retention (`History List Length`)**! Under InnoDB's default `REPEATABLE READ` isolation level, a 15-minute query holds a transaction `ReadView` open at $t_0$. As long as that `ReadView` is open, InnoDB's background Purge Thread **cannot garbage-collect any Undo Log versions** created across the database after $t_0$. On a busy OLTP database, a 15-minute export causes Undo Logs to balloon by millions of versions, degrading index scan latency for every other query on the server! Breaking the export into 15-millisecond Keyset batches (with an upper-bound `created_at <= :exportStartTs` filter) eliminates long-lived `ReadView`s completely."*

---

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Deep Pagination (`OFFSET 4000000`)** | "Add an index on `created_at` to make `OFFSET` fast." | "Even with an index, `OFFSET 4000000 LIMIT 5000` scans and discards 4,005,000 entries ($O(N^2)$ total work). Use **Keyset Pagination** `(created_at, id) > (?, ?)` for $O(\log N)$ seeks." |
| **MySQL JDBC Fetch Size** | "Set `setFetchSize(1000)` to fetch 1,000 rows at a time." | "MySQL Connector/J ignores `setFetchSize(N)` unless **`useCursorFetch=true`** is set, or **`setFetchSize(Integer.MIN_VALUE)`** is used for row-by-row socket streaming." |
| **Two-Query ID-List Pattern** | "Run `SELECT *` with keyset pagination." | "Run a Covering Index query (`SELECT id, created_at`) first, then `SELECT * WHERE id IN (...) ORDER BY created_at, id` (never omit `ORDER BY` on the `IN` query!)." |
| **Long Streaming Outages** | "Increase HikariCP connection timeout." | "Watch for MySQL **`net_write_timeout` (60s Error 1160)** when client S3 uploads stall the TCP window, and **InnoDB `History List Length`** Undo Log bloat." |
| **End-to-End Export Design** | "Stream the CSV directly in the HTTP `OutputStream`." | "Use **202 Accepted + Status Store + Work Queue + Keyset Batching on Read Replica + S3 Multipart Upload** with per-batch cursor checkpoints." |

