---
id: advanced-sql
title: Advanced SQL
description: Window functions, CTEs, subqueries, recursive queries, lateral joins, pivot/unpivot, and advanced SQL patterns.
tags: [database, sql, window-functions, cte, subquery, recursive, advanced]
sidebar_position: 10
---

# Advanced SQL

## Window Functions

Window functions perform calculations **across a set of rows related to the current row** — unlike GROUP BY, they don't collapse rows.

```sql
function() OVER (
    [PARTITION BY column]    -- group rows (like GROUP BY but keeps rows)
    [ORDER BY column]        -- order within partition
    [ROWS/RANGE frame]       -- which rows in partition to include
)
```

### Ranking Functions

```sql
SELECT
    name,
    department,
    salary,
    ROW_NUMBER()   OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
    RANK()         OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
    DENSE_RANK()   OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank,
    NTILE(4)       OVER (PARTITION BY department ORDER BY salary DESC) AS quartile
FROM employees;

-- ROW_NUMBER: 1, 2, 3, 4   (always unique)
-- RANK:       1, 2, 2, 4   (ties share rank, gaps after ties)
-- DENSE_RANK: 1, 2, 2, 3   (ties share rank, no gaps)
```

### Offset Functions

```sql
SELECT
    date,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY date) AS prev_revenue,
    LEAD(revenue, 1) OVER (ORDER BY date) AS next_revenue,
    FIRST_VALUE(revenue) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS first_ever,
    LAST_VALUE(revenue)  OVER (ORDER BY date ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS last_ever
FROM daily_revenue;
```

### Aggregate Window Functions

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
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW    -- running total
ROWS BETWEEN 6 PRECEDING AND CURRENT ROW            -- rolling 7-day
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING            -- centered moving avg
RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW  -- by date range (not row count)
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

:::caution Performance
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

## 🎯 Interview Questions

**Q1. What is the difference between ROW_NUMBER, RANK, and DENSE_RANK?**
> All assign a number based on ORDER BY. `ROW_NUMBER` always gives unique sequential numbers (no ties). `RANK` gives tied rows the same number but then skips (1,2,2,4). `DENSE_RANK` gives tied rows the same number with no gaps (1,2,2,3).

**Q2. What is a CTE and when would you use it over a subquery?**
> A CTE (WITH clause) creates a named temporary result set. Use CTEs when: logic is reused multiple times in the query; the query has multiple logical steps that are easier to read as named blocks; implementing recursive queries. For simple single-use cases, a subquery is equivalent in performance.

**Q3. How do window functions differ from GROUP BY?**
> `GROUP BY` collapses multiple rows into one row per group. Window functions compute over a set of related rows but **keep every row** in the result. You can have running totals, rankings, and comparisons to adjacent rows without losing the original row data.

**Q4. What is a correlated subquery and what are its performance implications?**
> A correlated subquery references columns from the outer query, causing it to re-execute once for each row of the outer query — O(n) executions. For large tables, this is very expensive. Alternatives: rewrite as a JOIN (often faster), use window functions, or use a CTE to pre-aggregate.

**Q5. Why is `NOT IN` dangerous when the subquery can return NULLs?**
> SQL's NULL logic: `5 NOT IN (1, 2, NULL)` returns NULL (not TRUE), because `5 <> NULL` is unknown. If any value in the NOT IN list is NULL, the entire expression evaluates to NULL/false and no rows are returned. Use `NOT EXISTS` instead, which handles NULLs correctly.

**Q6. What is a LATERAL join and when is it useful?**
> LATERAL allows the right side of a join to reference columns from the left side (a correlated join). Use cases: fetching the top-N rows per group (top 3 orders per user), applying a function to each row of another table. More flexible than a plain correlated subquery as it returns multiple rows.

**Q7. How would you find the second highest salary without using LIMIT/OFFSET?**
> Multiple approaches: `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`. Or with dense_rank: `SELECT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) dr FROM employees) WHERE dr = 2`. The window function approach easily generalizes to Nth highest.

**Q8. What is a recursive CTE and give a real-world use case.**
> A recursive CTE has an anchor (base case) and a recursive member (adds rows referencing the CTE itself), united by UNION ALL. Real-world uses: traversing org charts (employee → manager chain), resolving category hierarchies, BOM (bill of materials) explosion, finding shortest paths in a graph stored as edges.

---

## Advanced Editorial Pass: Advanced SQL for Predictable Performance

### Senior Engineering Focus
- Use SQL expressiveness to reduce round-trips and application post-processing.
- Understand windowing, CTE, and recursion cost profiles.
- Tune query readability and optimizer friendliness together.

### Failure Modes to Anticipate
- Complex queries with unstable plans across data growth.
- Excessive temporary sorting and spill behavior.
- CTE misuse that blocks optimizer transformations.

### Practical Heuristics
1. Inspect execution plans for each high-impact query version.
2. Benchmark with realistic cardinality and skew.
3. Guard critical queries with regression tests on plan shape and latency.

### Compare Next
- [Query Planner & Optimizer](./query-planner-optimizer.md)
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Performance & Monitoring](./performance-monitoring.md)
