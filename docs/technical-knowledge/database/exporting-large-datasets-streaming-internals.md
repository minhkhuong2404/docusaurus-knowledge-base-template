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
3. **Asynchronous Background Processing**:
   - Never hold open an active synchronous HTTP request for multi-gigabyte file exports.
   - Trigger an asynchronous job via a task queue, upload the finalized file to an object store (S3/GCS), and deliver a signed pre-signed download URL via notification or webhook upon completion.
