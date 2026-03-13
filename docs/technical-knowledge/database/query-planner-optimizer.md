---
id: query-planner-optimizer
title: Query Planner & Optimizer
description: How databases parse, plan, and optimize SQL queries — cost-based optimization, statistics, plan hints, and common planner pitfalls.
tags: [database, query-planner, optimizer, cost-based, statistics, execution-plan, cardinality]
sidebar_position: 14
---

# Query Planner & Optimizer

## The Query Lifecycle

Every SQL statement goes through a pipeline before data is returned:

```
SQL Text
   ↓
[Parser]          → Abstract Syntax Tree (AST)
   ↓
[Analyzer]        → Resolves table/column names, type checking
   ↓
[Rewriter]        → Applies view definitions, rule substitutions
   ↓
[Planner/Optimizer] → Generates candidate plans, picks cheapest
   ↓
[Executor]        → Runs the chosen plan, returns rows
```

---

## Cost-Based Optimization (CBO)

Modern databases use a **Cost-Based Optimizer (CBO)** — it generates multiple candidate execution plans and chooses the one with the **lowest estimated cost**.

Cost is estimated based on:
- **Row count estimates** (cardinality estimation)
- **Available indexes**
- **Table and column statistics**
- **Join algorithms available**
- **Hardware parameters** (sequential vs random I/O cost, CPU cost)

```sql
-- PostgreSQL cost parameters (tune for SSD vs HDD)
SET seq_page_cost = 1.0;         -- cost per sequential page read (baseline)
SET random_page_cost = 1.1;      -- SSDs: ~1.1; HDDs: ~4.0
SET cpu_tuple_cost = 0.01;       -- cost per row processed
SET cpu_index_tuple_cost = 0.005;
SET effective_cache_size = '8GB'; -- hint about OS page cache size
```

---

## Statistics

The optimizer relies on **column statistics** to estimate how many rows a filter will return.

### PostgreSQL Statistics

```sql
-- View column statistics
SELECT
    attname AS column,
    n_distinct,          -- distinct values (-1 = unique, positive = count, negative = fraction)
    correlation,         -- physical vs logical ordering (-1 to 1; near 1 = sequential, good for index scans)
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'status';

-- Update statistics manually (normally handled by autovacuum/autoanalyze)
ANALYZE orders;
ANALYZE orders (user_id, status);  -- specific columns

-- Increase statistics target for high-cardinality columns
ALTER TABLE orders ALTER COLUMN user_id SET STATISTICS 500;  -- default: 100
```

### MySQL Statistics

```sql
-- Table statistics
SELECT * FROM information_schema.STATISTICS
WHERE table_name = 'orders';

-- Update index statistics
ANALYZE TABLE orders;

-- Innodb stats persistence
SHOW VARIABLES LIKE 'innodb_stats_persistent%';
SET GLOBAL innodb_stats_persistent = ON;
SET GLOBAL innodb_stats_persistent_sample_pages = 20;  -- pages sampled per index
```

---

## Cardinality Estimation

The optimizer estimates how many rows a predicate will match. Bad estimates → bad plans.

```sql
-- PostgreSQL: actual vs estimated rows (look for large discrepancies)
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending' AND user_id = 42;

-- Bad estimate example:
-- "rows=10000" (estimate) vs "(actual rows=3 loops=1)"
-- → Optimizer chose Seq Scan instead of Index Scan

-- Fix: ANALYZE to refresh statistics; increase stats target; use extended stats
```

### Extended Statistics (PostgreSQL 10+)

When columns are correlated, the optimizer may underestimate row counts:

```sql
-- Correlated example: country='US' AND state='CA' — state values depend on country
-- Default: optimizer treats them as independent → overestimates rows filtered

CREATE STATISTICS orders_country_state
    ON country, state
    FROM orders;

ANALYZE orders;
-- Now optimizer knows about the correlation
```

---

## Join Algorithms

The optimizer chooses between join algorithms based on table sizes, indexes, and available memory:

### Nested Loop Join

```
For each row in outer table:
    Find matching rows in inner table (via index scan ideally)
```

- Best for: small outer table + index on inner table's join column
- Cost: O(outer × inner) without index; O(outer × log(inner)) with index
- Works well for small result sets

```
EXPLAIN output:
Nested Loop
  → Seq Scan on users
  → Index Scan on orders using idx_orders_user (index cond: orders.user_id = users.id)
```

### Hash Join

```
Phase 1 (build): scan smaller table, build hash table in memory
Phase 2 (probe): scan larger table, probe hash table for matches
```

- Best for: large tables with no useful indexes on join columns
- Cost: O(smaller + larger), one pass each
- Needs memory for hash table; may spill to disk if too large

```sql
-- Force hash join (PostgreSQL testing)
SET enable_nestloop = OFF;
SET enable_hashjoin = ON;
```

### Merge Join (Sort-Merge Join)

```
Sort both tables by join key
Walk both sorted lists simultaneously merging matches
```

- Best for: inputs already sorted (e.g., both sides have indexes on join key)
- Cost: O(n log n) for sorting + O(n + m) for merge
- Very efficient when sort is "free" (index already provides order)

### Join Algorithm Selection Guide

| Scenario | Algorithm |
|----------|-----------|
| Small outer + indexed inner | Nested Loop |
| Two large unsorted tables | Hash Join |
| Both sides sorted/indexed | Merge Join |
| Outer small, inner tiny | Nested Loop |

---

## Common Plan Node Types (PostgreSQL)

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 5 ORDER BY created_at DESC LIMIT 10;
```

| Node | Meaning |
|------|---------|
| `Seq Scan` | Full table scan |
| `Index Scan` | B-tree traversal + heap fetch |
| `Index Only Scan` | B-tree traversal only (covering index) |
| `Bitmap Heap Scan` | Multiple index entries → bitmap → heap fetch (range queries) |
| `Hash Join` | Hash-based join |
| `Merge Join` | Sort-merge join |
| `Nested Loop` | Loop-based join |
| `Sort` | In-memory or disk sort |
| `Hash Aggregate` | Hash-based GROUP BY |
| `Limit` | Stops after N rows |
| `Materialize` | Caches subquery result |

---

## Plan Stability & Hints

Optimizers can make bad choices. Options for influencing plans:

### PostgreSQL — GUC Parameters

```sql
-- Disable specific plan types (use in session scope, not globally!)
SET enable_seqscan = OFF;      -- force index scan
SET enable_hashjoin = OFF;     -- prefer nested loop or merge
SET enable_sort = OFF;         -- avoid explicit sorts
SET enable_nestloop = OFF;     -- avoid nested loops (useful for large joins)

-- After testing, reset
RESET enable_seqscan;
```

### PostgreSQL — pg_hint_plan Extension

```sql
-- Explicit hints (like Oracle hints)
/*+ IndexScan(orders idx_orders_user) HashJoin(orders users) */
SELECT * FROM orders JOIN users ON orders.user_id = users.id
WHERE orders.status = 'pending';
```

### MySQL — Optimizer Hints (8.0+)

```sql
SELECT /*+ INDEX(orders idx_user_status) */ *
FROM orders
WHERE user_id = 42;

SELECT /*+ NO_INDEX_MERGE(orders) */ *
FROM orders
WHERE user_id = 42 OR status = 'pending';

-- Force join order
SELECT /*+ JOIN_ORDER(users, orders) */ *
FROM users JOIN orders ON users.id = orders.user_id;
```

### MySQL — Index Hints

```sql
-- Force specific index
SELECT * FROM orders USE INDEX (idx_user_status)
WHERE user_id = 42 AND status = 'pending';

-- Ignore a specific index
SELECT * FROM orders IGNORE INDEX (idx_created_at)
WHERE created_at > '2024-01-01';
```

---

## Prepared Statements & Plan Caching

### The Generic Plan Problem

Prepared statements can reuse execution plans, but the same plan may not be optimal for different parameter values.

```java
// Java PreparedStatement — plan cached after first execution
PreparedStatement ps = conn.prepareStatement(
    "SELECT * FROM orders WHERE status = ?");
ps.setString(1, "pending");  // first call → plan created for 'pending' (90% of rows)
// ...
ps.setString(1, "archived"); // reuses 'pending' plan — bad if 'archived' is rare!
```

```sql
-- PostgreSQL: view cached plans
SELECT query, calls, plan_calls, generic_plans, custom_plans
FROM pg_prepared_statements;

-- Force custom plans (recalculate per call)
DEALLOCATE plan_name;
-- Or set plan_cache_mode = 'force_custom_plan' (PostgreSQL 12+)
```

---

## Partitioning & Partition Pruning

The optimizer eliminates irrelevant partitions automatically:

```sql
-- Partitioned table
CREATE TABLE orders (id BIGINT, created_at DATE, ...)
PARTITION BY RANGE (created_at);

-- Query with partition key in WHERE
EXPLAIN SELECT * FROM orders WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
-- → Optimizer should show only 1 partition scanned, not all

-- If pruning doesn't work: check that the WHERE clause uses the actual partition column
-- (not a function on it: WHERE YEAR(created_at) = 2024 ← won't prune!)
```

---

## Parallel Query Execution

PostgreSQL and MySQL (8.0+) can parallelize large queries:

```sql
-- PostgreSQL parallel settings
SET max_parallel_workers_per_gather = 4;   -- workers per query node
SET parallel_tuple_cost = 0.1;
SET parallel_setup_cost = 1000;
SET min_parallel_table_scan_size = '8MB';  -- min table size for parallel

-- Check if parallel is used
EXPLAIN SELECT COUNT(*) FROM large_table WHERE value > 100;
-- Look for: "Gather" or "Gather Merge" node = parallel execution
-- "Workers Planned: 4" = 4 parallel workers + 1 leader = 5 total
```

---

## 🎯 Interview Questions

**Q1. What is the difference between a cost-based and rule-based optimizer?**
> A rule-based optimizer (RBO) applies a fixed set of rules to transform queries (e.g., "always use an index if available"). A cost-based optimizer (CBO) estimates the cost of multiple candidate plans using table statistics and picks the cheapest. Modern DBs all use CBO — it makes better decisions for diverse data distributions.

**Q2. Why might the optimizer choose a Seq Scan even when an index exists?**
> When the optimizer estimates many rows will be returned (low selectivity), a Seq Scan is cheaper than an index scan because: (1) random I/O for index lookups is expensive; (2) a full sequential scan amortizes I/O cost across many rows. Also triggers: stale statistics (run ANALYZE), column correlation, or wrong random_page_cost setting.

**Q3. What is cardinality estimation and why does it matter?**
> Cardinality estimation is the optimizer's guess of how many rows a predicate will return. Bad estimates → bad plan choices (e.g., choosing Nested Loop for a large table instead of Hash Join). Fix with fresh ANALYZE, higher statistics targets, extended statistics for correlated columns, or explicit plan hints.

**Q4. What are the three main join algorithms and when does each excel?**
> Nested Loop: small outer table with index on inner join column — O(outer × log inner). Hash Join: two large tables with no join-column index — builds hash table on smaller table, probes with larger. Merge Join: both inputs already sorted on the join key (e.g., both have B-tree indexes) — O(n+m) after sort. The optimizer estimates costs for all and picks the cheapest.

**Q5. What is partition pruning and how do you ensure it works?**
> Partition pruning is the optimizer skipping irrelevant partitions when a WHERE clause filters on the partition key. To ensure pruning: filter must be on the partition key directly (no functions — `WHERE YEAR(date) = 2024` won't prune; `WHERE date BETWEEN ...` will). Use EXPLAIN to verify only the expected partitions are scanned.

**Q6. What causes a "bad" query plan and how do you fix it?**
> Causes: stale statistics (run ANALYZE); low statistics target (increase `ALTER TABLE ... SET STATISTICS N`); correlated columns (add extended statistics); wrong cost parameters (adjust `random_page_cost` for SSDs); parameter sniffing in prepared statements (custom plans or hints). Fix in order: ANALYZE → statistics target → extended stats → hints as last resort.

**Q7. What is the difference between `Index Scan` and `Index Only Scan` in PostgreSQL?**
> Index Scan traverses the B-tree index to find matching entries, then fetches the actual row from the heap table (two I/O operations per row). Index Only Scan satisfies the query entirely from the index (covering index) — no heap fetch needed. Significantly faster when the index contains all required columns. Requires `VACUUM` to keep visibility map current.

**Q8. What is a bitmap heap scan and when does the optimizer use it?**
> A Bitmap Heap Scan is used for range queries or multiple conditions on indexed columns. Phase 1 (Bitmap Index Scan): scans the index and builds an in-memory bitmap of matching heap page numbers. Phase 2 (Bitmap Heap Scan): fetches matching pages sequentially using the bitmap, which converts random I/O into sequential I/O. More efficient than plain Index Scan for 1-10% selectivity.

---

## Advanced Editorial Pass: Execution Planning and Optimizer Behavior

### Senior Engineering Focus
- Treat plans as probabilistic outcomes dependent on statistics quality.
- Understand join order, access method, and cardinality estimation interactions.
- Use planner insight to drive schema and query rewrites.

### Failure Modes to Anticipate
- Stale statistics causing catastrophic plan regressions.
- Plan instability after upgrades or distribution changes.
- Incorrect row estimates leading to bad join algorithms.

### Practical Heuristics
1. Refresh and validate statistics strategies per workload.
2. Capture plan baselines for mission-critical queries.
3. Investigate regressions with reproducible plan diffs.

### Compare Next
- [Advanced SQL](./advanced-sql.md)
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Performance & Monitoring](./performance-monitoring.md)
