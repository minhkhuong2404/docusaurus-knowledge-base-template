---
id: query-optimization-beyond-indexes-upsert-traps
title: "After Indexing is Correct: Hash Join Spills, Splitting Joins Without N+1 & 4 UPSERT Traps"
sidebar_label: "Query Optimization Beyond Indexes & UPSERT Traps"
description: "Advanced database query optimization when indexes are already optimal: Hash Join memory spills to disk, the art of application-side joins without N+1, deterministic SELECT-then-write ID ordering, and 4 dangerous traps of ON DUPLICATE KEY UPDATE."
tags: [database, mysql, postgresql, hash-join, query-optimization, upsert, on-duplicate-key-update, deadlock]
sidebar_position: 12
---

import QueryOptimizationUpsertTrapsDiagram from '@site/src/components/QueryOptimizationUpsertTrapsDiagram';

# After Indexing is Correct: Hash Join Spills, Splitting Joins Without N+1 & 4 UPSERT Traps

When a query runs slowly, the standard engineering instinct is predictable: run `EXPLAIN`, check if the `type` column indicates a full table scan (`ALL`), and add an index to the filtered column.

Yet in high-scale production systems, situations regularly occur where the index is correctly designed, the execution plan confirms the index is chosen, and yet execution latency **stalls between 3 and 8 seconds**.

Why do queries remain slow when indexing is correct? When should complex multi-table SQL queries be **deconstructed into application-tier joins** rather than forced onto the database engine? And why does the standard `INSERT ... ON DUPLICATE KEY UPDATE` (UPSERT) pattern secretly burn through primary key sequences and produce baffling deadlocks?

This article explores high-level query optimization techniques once baseline indexing has already been perfected.

<QueryOptimizationUpsertTrapsDiagram initialTab="upsert_traps" />

---

## 1. When Indexing is Correct but Queries Crawl: The Hash Join Disk Spill

In modern database engines (MySQL 8.0.18+ and PostgreSQL), when joining large datasets or when indexes cannot be utilized, the optimizer selects the **Hash Join** algorithm:

```text
The Two Phases of a Hash Join:
Phase 1: Build Phase (Construct In-Memory Hash Table)
└── Reads smaller input (Build Table) ──> Populates Hash Table in memory:
    ├── If size <= join_buffer_size: Fits entirely in RAM (O(1) memory lookup)
    └── If size > join_buffer_size:  💥 DISK SPILL (Partitions written to temporary disk files)!

Phase 2: Probe Phase (Scan Larger Table)
└── Reads rows from larger input (Probe Table) ──> Probes hash partitions to return matches.
```

<QueryOptimizationUpsertTrapsDiagram initialTab="hash_join" />

### The Memory Threshold: `join_buffer_size` & `work_mem`
- When the build dataset exceeds the allocated join memory buffer (**`join_buffer_size`** in MySQL or **`work_mem`** in PostgreSQL):
- The engine cannot retain the hash table in memory. It partitions the dataset into chunks and **spills them to temporary disk files**.
- The algorithm transforms from an in-memory lookup into multi-pass random disk I/O.
- **The Result**: `EXPLAIN` reports a modern Hash Join, but the query spends 8 seconds waiting on disk I/O.

### Production Remediation
1. **Inspect with `EXPLAIN ANALYZE`**: Look for metrics indicating disk spills (e.g., `Batches: 5, Memory Usage: ... (Disk Spill: Yes)`).
2. **Evaluate Index Nested Loop Join**: Ensure the join column on the probed table has a covering index so the engine can utilize an Index Nested Loop Join ($O(N \log M)$) instead of scanning and hashing entire tables.
3. **Elevate Session Buffers**: For dedicated reporting queries, elevate memory for that session:
   ```sql
   SET SESSION join_buffer_size = 268435456; -- 256 MB
   ```

---

## 2. The Art of Splitting Multi-Table JOINs Without Creating N+1

Developers frequently write monolithic queries joining 4 to 6 tables (`JOIN users JOIN orders JOIN order_items JOIN products JOIN payments...`) believing that *"letting the database do everything in one round-trip is always fastest."*

In high-throughput microservices architectures, **massive multi-table joins are actively discouraged** on operational paths. Instead, high-scale platforms employ **Application-Side Joins**:

<QueryOptimizationUpsertTrapsDiagram initialTab="app_join" />

### Vulnerabilities of Complex Multi-Table JOINs
1. **Network Bloat**: Joining `orders` with `order_items` duplicates order-level metadata (shipping addresses, customer names) across every single line item sent over the network.
2. **Cache Invalidation Coupling**: Caching the unified result of a 5-table join means that an update to any single product description invalidates the cached representation of all associated orders.
3. **Sharding Incompatibility**: When tables are partitioned across separate physical databases (`orders` in Shard-1, `users` in Shard-2), cross-database SQL joins become physically impossible.

### Enterprise Pattern: Batch Fetching (2 Queries, Zero N+1)
Avoid issuing single-record queries in loops ($1 + N$ queries). Use bounded **Batch Ingestion**:

```java
// ✅ Step 1: Fetch 50 orders (1 Network Roundtrip)
List<Order> orders = orderRepository.findByUserId(userId, PageRequest.of(0, 50));
List<Long> orderIds = orders.stream().map(Order::getId).toList();

// ✅ Step 2: Fetch all child items for all 50 orders at once (1 Network Roundtrip)
List<OrderItem> allItems = orderItemRepository.findByOrderIdIn(orderIds);

// ✅ Step 3: Stitch together in application memory using a HashMap (O(1) CPU, 0 Disk I/O)
Map<Long, List<OrderItem>> itemsByOrderId = allItems.stream()
    .collect(Collectors.groupingBy(OrderItem::getOrderId));

orders.forEach(order -> order.setItems(itemsByOrderId.getOrDefault(order.getId(), List.of())));
```

- **Query Overhead**: Exactly **2 simple queries**.
- Each query hits primary keys or indexed foreign keys, completing in $<1\text{ms}$.
- Each entity can be cached independently in Redis with a cache hit ratio exceeding 95%.

---

## 3. The Deterministic Pattern: `SELECT id` Then Write by ID

When executing bulk updates on expired or pending records, developers often write:

```sql
-- ❌ DANGEROUS: Causes unconstrained gap locks and frequent deadlocks
UPDATE orders 
SET status = 'EXPIRED' 
WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL 1 DAY 
LIMIT 1000;
```

<QueryOptimizationUpsertTrapsDiagram initialTab="select_id_write" />

### Why This Statement Causes Deadlocks
1. Evaluating a range condition on `created_at` combined with a `LIMIT` clause causes InnoDB to acquire **Next-Key Locks** across unpredictable index gaps.
2. When multiple background workers or user checkout transactions touch adjacent rows, these gap locks conflict, causing immediate Deadlock 1213 errors.

### The Safe 3-Step Pattern: Deterministic ID Mutation
1. **Read IDs in Read-Only Mode**:
   ```sql
   SELECT id FROM orders 
   WHERE status = 'PENDING' AND created_at < :expiredTime 
   LIMIT 1000;
   ```
2. **Sort IDs in Application Memory**:
   Sort the retrieved `orderIds` in strictly ascending numerical order (`Collections.sort(ids)`). This guarantees **every worker thread requests row locks in identical physical sequence**.
3. **Execute Update by Primary Key**:
   ```sql
   UPDATE orders SET status = 'EXPIRED' WHERE id IN (:sortedIds);
   ```
   InnoDB acquires **Record Locks only on Primary Key records**. Zero Gap Locks are generated, completely eliminating deadlock risk.

---

## 4. The Four Deadliest Traps of `ON DUPLICATE KEY UPDATE`

The `INSERT ... ON DUPLICATE KEY UPDATE` (UPSERT) construct is widely used to handle insert-or-update flows. However, it introduces four critical production traps:

<QueryOptimizationUpsertTrapsDiagram initialTab="upsert_traps" />

### Trap 1: Auto-Increment ID Burn & Sequence Exhaustion
Consider a table tracking user page counters:
```sql
CREATE TABLE user_counters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    visit_count INT DEFAULT 1
);
```
Executing:
```sql
INSERT INTO user_counters (user_id, visit_count) VALUES (42, 1)
ON DUPLICATE KEY UPDATE visit_count = visit_count + 1;
```
- **Physical Engine Behavior**: Before checking if `user_id = 42` exists, **InnoDB always allocates the next Auto-Increment ID from the global table counter**!
- When the duplicate is detected and an `UPDATE` occurs, **the allocated ID is discarded and permanently lost**.
- On a high-throughput counter updating millions of times daily, an `INT` primary key (maximum value 2.1 billion) **will be completely exhausted within months**, triggering fatal `Duplicate entry for key 'PRIMARY'` errors that take down the service!

### Trap 2: Insert Intention vs Gap Lock Deadlocks
When an UPSERT detects a conflict on a unique secondary index:
- InnoDB must acquire an exclusive **X Next-Key Lock** on the duplicate record.
- When concurrent transactions perform upserts into adjacent ranges, their Gap Locks and Insert Intention Locks create cyclic wait dependencies, producing immediate deadlocks.

### Trap 3: Replication Data Drift Under Statement-Based Replication
If using `binlog_format = STATEMENT`:
- Non-deterministic functions (e.g., `NOW()`) or statements evaluated across multiple unique keys can be applied in different physical index orders on primary vs replica servers.
- Data drifts silently between primary and replica nodes.
- **Mandate**: Always enforce `binlog_format = ROW` in production MySQL deployments.

### Trap 4: Ambiguity with Multiple Unique Indexes
Consider a table with both a Primary Key (`id`) and a Unique Key (`email`):
```sql
-- Existing rows:
-- Row 1: (id = 1, email = 'alice@example.com')
-- Row 2: (id = 2, email = 'bob@example.com')

INSERT INTO users (id, email, name) VALUES (1, 'bob@example.com', 'Hacker')
ON DUPLICATE KEY UPDATE name = 'Hacker';
```
- The statement conflicts on `id = 1` with Row 1, but also conflicts on `email = 'bob@example.com'` with Row 2!
- MySQL cannot update both rows. **It updates ONE arbitrary row depending on which index the engine scans first**!
- This causes silent, undetected data corruption and security breaches.
