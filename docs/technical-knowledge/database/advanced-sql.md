---
id: advanced-sql
title: Advanced SQL
description: Window functions, CTEs, subqueries, recursive queries, lateral joins, pivot/unpivot, pagination patterns, EXPLAIN, and advanced SQL for senior engineers.
tags: [database, sql, window-functions, cte, subquery, recursive, advanced, pagination, explain]
sidebar_position: 10
---

import SqlExecutionOrderDiagram from '@site/src/components/SqlExecutionOrderDiagram';

# Advanced SQL

---

## Logical Execution Order of SQL Queries

<SqlExecutionOrderDiagram />

---

## Window Functions

Window functions perform calculations **across a set of rows related to the current row** — unlike GROUP BY, they don't collapse rows.

```sql
function() OVER (
    [PARTITION BY column]    -- group rows (like GROUP BY but keeps rows)
    [ORDER BY column]        -- order within partition
    [ROWS/RANGE frame]       -- which rows in partition to include
)
```

---

## ROW_NUMBER vs RANK vs DENSE_RANK

These three ranking functions look similar but differ critically in how they handle **ties**.

### Visual Comparison

Given a `salaries` table:

| name    | dept  | salary |
|---------|-------|--------|
| Alice   | Eng   | 90000  |
| Bob     | Eng   | 85000  |
| Carol   | Eng   | 85000  |
| Dave    | Eng   | 70000  |

```sql
SELECT
    name,
    salary,
    ROW_NUMBER()  OVER (PARTITION BY dept ORDER BY salary DESC) AS row_num,
    RANK()        OVER (PARTITION BY dept ORDER BY salary DESC) AS rank,
    DENSE_RANK()  OVER (PARTITION BY dept ORDER BY salary DESC) AS dense_rank
FROM salaries;
```

| name  | salary | row_num | rank | dense_rank |
|-------|--------|---------|------|------------|
| Alice | 90000  | 1       | 1    | 1          |
| Bob   | 85000  | 2       | 2    | 2          |
| Carol | 85000  | 3       | 2    | 2          |
| Dave  | 70000  | 4       | 4    | 3          |

### Key Differences Explained

| Function | Ties | Gap after tie? | Use case |
|---|---|---|---|
| `ROW_NUMBER()` | Assigns unique, arbitrary sequential numbers | N/A — no ties possible | De-duplication, pagination, picking one row per group |
| `RANK()` | Tied rows get the **same rank**; next rank **skips** (like Olympics medals: 1, 2, 2, **4**) | ✅ Yes | Leaderboards, competition rankings |
| `DENSE_RANK()` | Tied rows get the **same rank**; next rank **does not skip** (1, 2, 2, **3**) | ❌ No | Finding Nth highest salary, percentile groupings |

### When to Use Each

```sql
-- ROW_NUMBER: De-duplicate, pick one row per user (arbitrary tiebreak)
SELECT *
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
    FROM orders
) t
WHERE rn = 1;   -- latest order per user, one per user guaranteed

-- RANK: Leaderboard where ties share the same position
SELECT name, score, RANK() OVER (ORDER BY score DESC) AS rank
FROM leaderboard
WHERE RANK() OVER (ORDER BY score DESC) <= 3;  -- ❌ Can't filter on window fn directly

-- Correct way: use a subquery or CTE
WITH ranked AS (
    SELECT name, score, RANK() OVER (ORDER BY score DESC) AS rnk
    FROM leaderboard
)
SELECT * FROM ranked WHERE rnk <= 3;   -- may return >3 rows on ties

-- DENSE_RANK: Find Nth distinct salary value
WITH ranked AS (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS dr
    FROM employees
)
SELECT DISTINCT salary FROM ranked WHERE dr = 2;  -- 2nd highest salary
```

:::tip[Interview Gotcha]
`RANK() <= 3` can return **more than 3 rows** if there are ties at position 3.
`ROW_NUMBER() <= 3` always returns **exactly 3 rows** (or fewer if table is small).
Choose based on whether you want strict count or fair tie handling.
:::

### NTILE

Divide rows into N equal-ish buckets:

```sql
SELECT name, salary,
       NTILE(4) OVER (ORDER BY salary DESC) AS quartile  -- 1=top 25%, 4=bottom 25%
FROM employees;
```

---

## Offset Functions (LAG, LEAD, FIRST_VALUE, LAST_VALUE)

```sql
SELECT
    date,
    revenue,
    LAG(revenue, 1)  OVER (ORDER BY date)          AS prev_day_revenue,
    LEAD(revenue, 1) OVER (ORDER BY date)          AS next_day_revenue,
    LAG(revenue, 1, 0) OVER (ORDER BY date)        AS prev_or_zero,  -- default if no prev row
    FIRST_VALUE(revenue) OVER (
        ORDER BY date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                                               AS first_ever,
    LAST_VALUE(revenue) OVER (
        ORDER BY date
        ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
    )                                               AS last_ever
FROM daily_revenue;
```

:::caution[LAST_VALUE frame trap]
`LAST_VALUE` without an explicit frame defaults to `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which means it only sees up to the current row — not the actual last value. Always specify `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` (or `UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`).
:::

### Calculating Period-over-Period Change

```sql
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month)             AS prev_month_revenue,
    revenue - LAG(revenue) OVER (ORDER BY month)   AS mom_delta,
    ROUND(
        100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0),
        2
    )                                              AS mom_pct_change
FROM monthly_revenue;
```

---

## Aggregate Window Functions

```sql
SELECT
    user_id,
    order_date,
    amount,
    SUM(amount)   OVER (PARTITION BY user_id ORDER BY order_date) AS running_total,
    AVG(amount)   OVER (PARTITION BY user_id ORDER BY order_date
                        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7day_avg,
    COUNT(*)      OVER (PARTITION BY user_id) AS total_orders_for_user,
    amount / SUM(amount) OVER (PARTITION BY user_id) AS pct_of_user_total
FROM orders;
```

### Frame Specification

```sql
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW    -- running total (most common)
ROWS BETWEEN 6 PRECEDING AND CURRENT ROW            -- rolling 7-row window
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING            -- centered 3-row moving avg
RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW  -- by date range, not row count
ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING   -- entire partition
```

**ROWS vs RANGE:**
- `ROWS` = physical rows counted by position
- `RANGE` = logical range based on ORDER BY values (multiple rows with same value treated as a unit)

---

## Pagination

### ❌ The OFFSET/LIMIT Anti-Pattern

The most common approach — but deeply flawed at scale:

```sql
-- Page 1
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 0;

-- Page 2
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 20;

-- Page 1000
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 19980;
```

**Why OFFSET is dangerous:**

| Problem | Explanation |
|---------|-------------|
| **O(n) cost** | The DB must scan and discard `OFFSET` rows before returning results. `OFFSET 1,000,000` reads 1,000,020 rows to return 20. |
| **Row drift** | If a new row is inserted between page 1 and page 2 fetches, you get duplicates or skipped rows. |
| **No stable order guarantee** | Without a unique column in ORDER BY, rows with equal sort values may appear in different order on each query. |
| **Optimizer can't seek** | Index range scans can't skip directly to offset N; they must traverse N rows. |

```sql
-- EXPLAIN to see the damage
EXPLAIN SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 100000;
-- → Seq Scan or Index Scan with rows=100020 — still processes 100K rows!
```

### ✅ Keyset Pagination (Cursor-Based)

Instead of skipping rows by count, use the **last seen value** as the starting point:

```sql
-- First page
SELECT id, created_at, title
FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Next page: pass the last row's (created_at, id) as the cursor
SELECT id, created_at, title
FROM orders
WHERE (created_at, id) < ('2024-03-15 10:30:00', 12345)   -- last seen values
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Why this is fast:** The WHERE clause can use a **composite index on (created_at, id)** for a direct index seek — O(log n) instead of O(n).

```sql
-- Create the supporting index
CREATE INDEX idx_orders_pagination ON orders (created_at DESC, id DESC);
```

#### Keyset Pagination: Encoding the Cursor

In real APIs, encode the cursor as a base64 opaque token:

```sql
-- The cursor encodes: {"created_at": "2024-03-15T10:30:00Z", "id": 12345}
-- Decoded server-side and injected into the WHERE clause:
WHERE (created_at = $cursor_ts AND id < $cursor_id)
   OR created_at < $cursor_ts
-- Equivalent to: (created_at, id) < ($cursor_ts, $cursor_id) in databases that support row comparison
```

#### Keyset Pagination Limitations

| Limitation | Notes |
|-----------|-------|
| No arbitrary page jumps | Can't jump to "page 50" — must traverse forward/backward |
| Cursor must include a unique column | Tie-breaking column (e.g., `id`) required to avoid duplicate/missed rows |
| Complex with filters | WHERE conditions that change the effective sort order need careful cursor design |

### Comparison: OFFSET vs Keyset

| Attribute | `OFFSET / LIMIT` | Keyset / Cursor |
|-----------|-----------------|-----------------|
| Performance at page N | O(N × page_size) | O(log n) with index |
| Row stability | ❌ Rows drift on inserts/deletes | ✅ Stable |
| Random page access | ✅ Easy (`OFFSET = page * size`) | ❌ Sequential only |
| Implementation complexity | Low | Medium |
| Best for | Small tables, admin UIs, analytics | APIs, feeds, large tables |

### ✅ Seek Method with ROW_NUMBER (Offset Emulation)

When you need approximate page numbers but better performance:

```sql
-- Pre-paginate with ROW_NUMBER, then filter
WITH paginated AS (
    SELECT *,
           ROW_NUMBER() OVER (ORDER BY created_at DESC, id DESC) AS rn
    FROM orders
)
SELECT * FROM paginated
WHERE rn BETWEEN 101 AND 120;   -- page 6, page_size=20
```

:::caution[Still O(n)]
This is more readable but the DB still evaluates all rows up to the page boundary. Use keyset for true O(log n) performance.
:::

### Practical Pagination Decision Tree

```
Is table small (< 100K rows) or is pagination rarely used?
    └─ YES → OFFSET/LIMIT is fine
    └─ NO ──→ Is random page access (page=N) required?
                  └─ YES → Accept OFFSET cost, or use COUNT + partial index to optimize
                  └─ NO  → Use Keyset/Cursor pagination ✅
```

---

## EXPLAIN and Query Plans

Understanding `EXPLAIN` output is essential for diagnosing slow queries.

### EXPLAIN vs EXPLAIN ANALYZE

```sql
-- EXPLAIN: shows the estimated plan (does NOT execute the query)
EXPLAIN SELECT * FROM orders WHERE user_id = 42;

-- EXPLAIN ANALYZE: actually executes the query and shows real vs estimated stats
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;

-- EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON): full detail for complex queries
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
SELECT * FROM orders WHERE user_id = 42;
```

:::warning[ANALYZE runs the query]
`EXPLAIN ANALYZE` on a write query (`INSERT`, `UPDATE`, `DELETE`) **will actually execute it**. Wrap in a transaction and roll back:
```sql
BEGIN;
EXPLAIN ANALYZE DELETE FROM orders WHERE status = 'cancelled';
ROLLBACK;
```
:::

### Reading a PostgreSQL EXPLAIN Output

```
Seq Scan on orders  (cost=0.00..4580.00 rows=150000 width=128)
                           ↑       ↑         ↑         ↑
                     startup  total    estimated   row width
                       cost   cost      rows      (bytes)

-- With ANALYZE:
Seq Scan on orders  (cost=0.00..4580.00 rows=150000 width=128)
                    (actual time=0.023..34.201 rows=148932 loops=1)
                                  ↑              ↑         ↑
                              actual          actual    how many
                              startup       row count    times
                                time                    executed
```

### Common Plan Nodes

| Node | Meaning | Good / Bad? |
|------|---------|-------------|
| **Seq Scan** | Full table scan | ❌ Bad on large tables; OK on small or when reading most rows |
| **Index Scan** | Uses index to find rows, fetches heap pages | ✅ Good for selective queries |
| **Index Only Scan** | All data in index, no heap fetch | ✅✅ Best — no extra I/O |
| **Bitmap Index Scan** | Index scan building a bitmap, then bulk-fetches heap | ✅ Good for moderate selectivity |
| **Nested Loop** | For each outer row, scan inner (good for small outer sets) | ✅ for small sets |
| **Hash Join** | Build hash table of smaller relation, probe with larger | ✅ for large unsorted sets |
| **Merge Join** | Merge two sorted inputs | ✅ when both sides are sorted |
| **Sort** | Explicit sort (can spill to disk if `Sort Method: external merge`) | ⚠️ Watch for disk spills |

### Key Metrics to Watch

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.*, u.name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 100;

-- Look for:
-- 1. "Rows Removed by Filter: XXXXXX"  → missing index, filter applied after scan
-- 2. "Sort Method: external merge"      → sort spilling to disk (increase work_mem)
-- 3. "Shared Read Blocks: XXXXX"        → cache misses (pages read from disk)
-- 4. estimated rows vs actual rows      → large discrepancy = stale statistics (run ANALYZE)
```

### EXPLAIN: Rows Estimate vs Actual

A large gap between estimated and actual rows signals **stale statistics**:

```sql
-- Stale stats can produce terrible plans
-- Example: planner estimates 5 rows, actual is 50,000 → may choose Nested Loop instead of Hash Join

-- Fix stale statistics:
ANALYZE orders;
ANALYZE;   -- all tables

-- Check when stats were last collected:
SELECT relname, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'orders';
```

### Identifying Slow Queries

```sql
-- Enable slow query logging (postgresql.conf)
-- log_min_duration_statement = 1000  -- log queries > 1 second

-- Find top slow queries via pg_stat_statements (extension required)
SELECT
    query,
    calls,
    ROUND(total_exec_time::numeric / calls, 2) AS avg_ms,
    ROUND(total_exec_time::numeric, 2)          AS total_ms,
    rows
FROM pg_stat_statements
ORDER BY avg_ms DESC
LIMIT 20;
```

### EXPLAIN Checklist

```
□ Is a Seq Scan happening on a large table?      → Add an index
□ Is the estimated row count wildly off?          → Run ANALYZE; check statistics target
□ Is there a Sort with "external merge"?          → Increase work_mem or add sorted index
□ Is a Nested Loop with large inner set?          → May need Hash Join; check join conditions
□ Is Index Only Scan possible but not used?       → Check index covers all selected columns
□ Are buffers showing high "Read Blocks"?         → Cache miss; consider partial/covering index
```

---

## Common Table Expressions (CTEs)

CTEs create named temporary result sets for readability and reuse.

```sql
-- Basic CTE
WITH monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', created_at) AS month,
        SUM(total)                       AS revenue
    FROM orders
    GROUP BY 1
),
ranked AS (
    SELECT
        month,
        revenue,
        RANK() OVER (ORDER BY revenue DESC) AS rank
    FROM monthly_revenue
)
SELECT * FROM ranked WHERE rank <= 3;  -- top 3 months
```

### Multiple CTEs

```sql
WITH
active_users AS (
    SELECT id FROM users WHERE last_login > NOW() - INTERVAL '30 days'
),
recent_orders AS (
    SELECT user_id, COUNT(*) AS cnt FROM orders
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
)
SELECT u.id, COALESCE(o.cnt, 0) AS orders_last_30d
FROM active_users u
LEFT JOIN recent_orders o ON u.id = o.user_id;
```

### CTE vs Subquery

| | CTE | Subquery |
|--|-----|---------| 
| Readability | Better for complex logic | Inline, compact |
| Reusability | Can reference same CTE multiple times | Must repeat |
| Performance | Same in most DBs | Same in most DBs |
| Optimization | PostgreSQL CTEs materialized by default (pre-PG12); use `NOT MATERIALIZED` to allow inlining | Inlined by optimizer |

```sql
-- Force PostgreSQL to inline (not materialize) a CTE — allows predicate pushdown
WITH recent AS NOT MATERIALIZED (
    SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT * FROM recent WHERE user_id = 42;
```

---

## Recursive CTEs

Recursively query hierarchical data.

```sql
-- Organization chart: employee → manager hierarchy
WITH RECURSIVE org_chart AS (
    -- Anchor: start with the CEO (no manager)
    SELECT id, name, manager_id, 0 AS level, name::TEXT AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive: find direct reports
    SELECT e.id, e.name, e.manager_id, oc.level + 1, oc.path || ' > ' || e.name
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT level, path, name
FROM org_chart
ORDER BY path;

-- Fibonacci sequence (for illustration)
WITH RECURSIVE fib(a, b) AS (
    SELECT 0, 1
    UNION ALL
    SELECT b, a + b FROM fib WHERE a < 1000
)
SELECT a FROM fib;
```

---

## Subqueries

### Correlated Subquery

The inner query references the outer query — re-evaluated for each row.

```sql
-- Find employees earning more than their department average
SELECT name, salary, department_id
FROM employees e
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department_id = e.department_id  -- correlated reference
);
```

:::caution[Performance]
Correlated subqueries run once per row — O(n). Prefer JOINs or window functions for large tables.
:::

### Scalar Subquery

Returns a single value.

```sql
SELECT
    name,
    (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count
FROM users u;
-- Better done with LEFT JOIN + GROUP BY or window function
```

### EXISTS vs IN

```sql
-- EXISTS: stops at first match, handles NULLs correctly
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- NOT IN fails with NULLs! If subquery contains NULL, result is always empty
SELECT * FROM users WHERE id NOT IN (SELECT manager_id FROM employees);
-- ↑ If any manager_id is NULL → returns nothing!

-- ✅ Safe version
SELECT * FROM users WHERE id NOT IN (
    SELECT manager_id FROM employees WHERE manager_id IS NOT NULL
);
-- Or: use NOT EXISTS instead
```

---

## LATERAL Joins (PostgreSQL / MySQL 8.0+)

A LATERAL join allows the right side to reference columns from the left side (like a correlated subquery, but as a join).

```sql
-- Get the 3 most recent orders per user
SELECT u.id, u.name, o.created_at, o.total
FROM users u
CROSS JOIN LATERAL (
    SELECT created_at, total
    FROM orders
    WHERE user_id = u.id
    ORDER BY created_at DESC
    LIMIT 3
) o;
```

Also useful for calling set-returning functions per row.

---

## PIVOT and Conditional Aggregation

SQL doesn't have native PIVOT in most DBs; use conditional aggregation:

```sql
-- Monthly revenue by status (rows → columns)
SELECT
    DATE_TRUNC('month', created_at) AS month,
    SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) AS completed,
    SUM(CASE WHEN status = 'refunded'  THEN total ELSE 0 END) AS refunded,
    SUM(CASE WHEN status = 'pending'   THEN total ELSE 0 END) AS pending
FROM orders
GROUP BY 1
ORDER BY 1;
```

---

## Gaps and Islands

Find contiguous ranges in sequential data:

```sql
-- Find gaps in order IDs (missing orders)
SELECT prev_id + 1 AS gap_start, id - 1 AS gap_end
FROM (
    SELECT id, LAG(id) OVER (ORDER BY id) AS prev_id
    FROM orders
) t
WHERE id - prev_id > 1;

-- Find "islands" (contiguous groups of active users by day)
WITH numbered AS (
    SELECT date, ROW_NUMBER() OVER (ORDER BY date) AS rn
    FROM active_days
),
islands AS (
    SELECT date, DATE(date - rn * INTERVAL '1 day') AS group_id
    FROM numbered
)
SELECT MIN(date) AS start, MAX(date) AS end, COUNT(*) AS days
FROM islands
GROUP BY group_id
ORDER BY start;
```

---

## Set Operations

```sql
-- UNION: distinct rows from both
SELECT id FROM premium_users
UNION
SELECT id FROM beta_users;

-- UNION ALL: all rows including duplicates (faster)
SELECT 'premium' AS source, id FROM premium_users
UNION ALL
SELECT 'beta',             id FROM beta_users;

-- INTERSECT: rows in both
SELECT user_id FROM orders
INTERSECT
SELECT user_id FROM subscriptions;

-- EXCEPT (MINUS in Oracle): rows in first but not second
SELECT id FROM users
EXCEPT
SELECT user_id FROM orders;  -- users who never ordered
```

---

## JSON in SQL (PostgreSQL JSONB)

```sql
-- Create and query JSON columns
CREATE TABLE events (
    id      BIGSERIAL PRIMARY KEY,
    payload JSONB
);

-- Query inside JSON
SELECT payload->>'user_id' AS user_id,
       payload->'metadata'->>'source' AS source
FROM events
WHERE payload->>'event_type' = 'purchase'
  AND (payload->>'amount')::DECIMAL > 100;

-- Index on JSON field
CREATE INDEX idx_event_type ON events ((payload->>'event_type'));

-- JSON aggregation
SELECT user_id, JSONB_AGG(product) AS products
FROM order_items
GROUP BY user_id;
```

---

## Interview Questions

**Q1. What is the difference between ROW_NUMBER, RANK, and DENSE_RANK?**
> All assign a number based on ORDER BY. `ROW_NUMBER` always gives unique sequential numbers (no ties — even identical values get different numbers). `RANK` gives tied rows the same number but **skips** the next ranks (1, 2, 2, 4). `DENSE_RANK` gives tied rows the same number with **no gaps** (1, 2, 2, 3). Use `ROW_NUMBER` for de-duplication, `RANK` for competition standings, `DENSE_RANK` for finding the Nth distinct value.

**Q2. When should you use OFFSET/LIMIT vs keyset pagination?**
> `OFFSET/LIMIT` is simple but has O(n) cost — the database must scan and discard all preceding rows. At `OFFSET 1,000,000`, you scan 1M+ rows to return 20. Rows also drift when data is inserted between requests. Keyset (cursor) pagination instead stores the last-seen row's sort key and uses a `WHERE (col1, col2) < (last_val1, last_val2)` clause. With a matching composite index, each page fetch is O(log n) regardless of page number. Use keyset for high-traffic APIs and feeds; OFFSET only for small tables or when random page access is needed.

**Q3. What is a CTE and when would you use it over a subquery?**
> A CTE (WITH clause) creates a named temporary result set. Use CTEs when: logic is reused multiple times in the query; the query has multiple logical steps easier to read as named blocks; implementing recursive queries. In PostgreSQL < 12, CTEs are **materialized by default** (executed once and cached), which can be a performance fence that blocks predicate pushdown. Use `NOT MATERIALIZED` to allow the optimizer to inline it.

**Q4. How do window functions differ from GROUP BY?**
> `GROUP BY` collapses multiple rows into one row per group. Window functions compute over a set of related rows but **keep every row** in the result. You can have running totals, rankings, and comparisons to adjacent rows without losing original row data.

**Q5. What is a correlated subquery and what are its performance implications?**
> A correlated subquery references columns from the outer query, causing it to re-execute once for each row of the outer query — O(n) executions. For large tables, this is very expensive. Alternatives: rewrite as a JOIN, use window functions, or use a CTE to pre-aggregate.

**Q6. Why is `NOT IN` dangerous when the subquery can return NULLs?**
> SQL NULL logic: `5 NOT IN (1, 2, NULL)` returns NULL (not TRUE), because `5 <> NULL` is UNKNOWN. If any value in the NOT IN list is NULL, the entire expression evaluates to UNKNOWN/false and no rows are returned. Use `NOT EXISTS` instead, which handles NULLs correctly.

**Q7. What is a LATERAL join and when is it useful?**
> LATERAL allows the right side of a join to reference columns from the left side. Use cases: fetching the top-N rows per group (top 3 orders per user), applying a set-returning function to each row of another table. More flexible than a plain correlated subquery as it returns multiple rows and can be used in FROM/JOIN clauses.

**Q8. How would you find the second highest salary without using LIMIT/OFFSET?**
> Multiple approaches: `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`. Or with `DENSE_RANK`: `WITH r AS (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) dr FROM employees) SELECT DISTINCT salary FROM r WHERE dr = 2`. The window function approach easily generalizes to Nth highest. Note: use `DENSE_RANK` (not `RANK`) so that duplicate salaries don't create gaps in the ranking.

**Q9. What is a recursive CTE and give a real-world use case?**
> A recursive CTE has an anchor (base case) and a recursive member (adds rows referencing the CTE itself), united by `UNION ALL`. Real-world uses: traversing org charts (employee → manager chain), resolving category hierarchies, BOM (bill of materials) explosion, finding shortest paths in a graph stored as edges.

**Q10. How do you read an EXPLAIN output and what should you look for?**
> Key indicators: **Seq Scan on large table** → missing index. **Large gap between estimated vs actual rows** → stale statistics, run `ANALYZE`. **Sort with `external merge`** → sort spilling to disk, increase `work_mem`. **`Rows Removed by Filter`** → filter applied after a scan, index may help. **`Index Only Scan`** → best case, all data in index. Use `EXPLAIN (ANALYZE, BUFFERS)` to see actual execution time and cache hits vs disk reads.

---

## Advanced Editorial Pass: Advanced SQL for Predictable Performance

### Senior Engineering Focus
- Use SQL expressiveness to reduce round-trips and application post-processing.
- Understand windowing, CTE, and recursion cost profiles.
- Tune query readability and optimizer friendliness together.
- Always verify pagination strategy at expected data volume.

### Failure Modes to Anticipate
- OFFSET pagination degrading linearly as the table grows.
- Cursors returning duplicate or missing rows when sort key is not unique.
- Complex queries with unstable plans across data growth.
- Excessive temporary sorting and spill behavior (`work_mem` too low).
- CTE misuse that blocks optimizer transformations (pre-PG12 materialization).

### Practical Heuristics
1. Inspect execution plans for each high-impact query version.
2. Benchmark with realistic cardinality and skew.
3. Guard critical queries with regression tests on plan shape and latency.
4. For APIs returning lists: default to keyset pagination from day one — retrofitting is painful.
5. Always include a unique tie-breaking column (e.g., `id`) in pagination ORDER BY.

### Compare Next
- [Query Planner & Optimizer](./query-planner-optimizer.md)
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Performance & Monitoring](./performance-monitoring.md)
