---
id: indexing-query-optimization
title: Indexing & Query Optimization
description: Deep dive into database indexes — B-Tree, hash, covering, composite — and strategies to analyze and optimize slow queries.
tags: [database, indexing, query-optimization, b-tree, explain, performance]
sidebar_position: 3
---

# Indexing & Query Optimization

## What is an Index?

An index is a **separate data structure** that stores a subset of a table's columns in an organized way so the database can find rows without scanning every row (a **full table scan**).

Trade-offs:
- ✅ Speeds up `SELECT`, `JOIN`, `ORDER BY`, `WHERE`
- ❌ Slows down `INSERT`, `UPDATE`, `DELETE` (index must be maintained)
- ❌ Consumes additional disk space

---

## B-Tree Index (Default)

The **B-Tree (Balanced Tree)** is the most common index structure, used by default in MySQL (InnoDB), PostgreSQL, Oracle.

```
                    [40]
                   /    \
              [20]        [60]
             /    \      /    \
          [10]  [30]  [50]  [70,80]
```

- **O(log n)** for equality, range, prefix searches
- Supports: `=`, `<`, `>`, `<=`, `>=`, `BETWEEN`, `LIKE 'prefix%'`
- Does **not** help: `LIKE '%suffix'`, functions on columns

### B+ Tree (used in practice)
Most DBs use **B+ Trees** where:
- Only **leaf nodes** hold actual data pointers
- Leaf nodes are **linked** — enables fast range scans
- Internal nodes only hold routing keys

---

## Hash Index

- Uses a **hash function** to map key → bucket
- **O(1)** average lookup for **exact equality** only
- Does **not** support range queries or ordering
- Used by: MEMORY engine in MySQL, PostgreSQL hash indexes (since 10)

```sql
CREATE INDEX idx_hash ON sessions USING HASH (token);
```

---

## Index Types Comparison

| Type | Best For | Supports Range? | Notes |
|------|----------|----------------|-------|
| B-Tree | General purpose | ✅ | Default |
| Hash | Exact equality | ❌ | Fastest point lookup |
| Full-Text | Text search (`MATCH AGAINST`) | ❌ | Tokenized |
| Spatial (R-Tree) | Geo queries | ✅ | `ST_Within`, etc. |
| Composite | Multi-column WHERE/ORDER | ✅ | Column order matters |
| Covering | SELECT covered by index | ✅ | No heap lookup |
| Partial | Subset of rows | ✅ | Smaller, targeted |

---

## Composite Indexes & Column Order

```sql
CREATE INDEX idx_user_date ON orders (user_id, created_at, status);
```

The **left-prefix rule**: the index is usable only if queries filter on columns from **left to right** without skipping.

| Query | Uses Index? |
|-------|-------------|
| `WHERE user_id = 1` | ✅ (leftmost) |
| `WHERE user_id = 1 AND created_at > '2024-01-01'` | ✅ |
| `WHERE user_id = 1 AND status = 'active'` | ✅ (user_id only, status skips) |
| `WHERE created_at > '2024-01-01'` | ❌ (skips user_id) |
| `WHERE status = 'active'` | ❌ |

**Rule of thumb:** Place **equality** columns first, **range** columns last, **high cardinality** columns first.

---

## Covering Index

A covering index includes **all columns** needed by a query — no heap (table) lookup required.

```sql
-- Query
SELECT user_id, total FROM orders WHERE status = 'pending';

-- Covering index
CREATE INDEX idx_covering ON orders (status, user_id, total);
-- status in WHERE, user_id + total in SELECT — all in index
```

MySQL EXPLAIN will show `Using index` (not `Using index condition`) for a true covering index.

---

## Analyzing Queries with EXPLAIN

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 5 AND status = 'pending';
```

### Key EXPLAIN fields (MySQL)

| Field | Look For |
|-------|----------|
| `type` | `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` (worst) |
| `key` | Which index was chosen (NULL = no index) |
| `rows` | Estimated rows scanned |
| `Extra` | `Using index` (good), `Using filesort` (bad), `Using temporary` (bad) |

```sql
EXPLAIN ANALYZE SELECT ...;  -- PostgreSQL: actual execution stats
```

### PostgreSQL EXPLAIN example
```
Seq Scan on orders  (cost=0.00..4320.00 rows=85000 width=50)
  Filter: (status = 'pending')
→ Bad: full scan. Add index on status.

Index Scan using idx_status on orders  (cost=0.43..8.45 rows=1 width=50)
  Index Cond: (status = 'pending')
→ Good: index used.
```

---

## Common Query Optimization Techniques

### 1. Avoid functions on indexed columns
```sql
-- ❌ Bad: index on created_at not used
WHERE YEAR(created_at) = 2024

-- ✅ Good: range on indexed column
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
```

### 2. Avoid implicit type conversion
```sql
-- ❌ Bad: user_id is INT but compared to VARCHAR
WHERE user_id = '42'

-- ✅ Good
WHERE user_id = 42
```

### 3. Use EXISTS instead of IN for subqueries
```sql
-- ❌ Potentially slow for large subquery
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100);

-- ✅ Better: stops at first match
SELECT * FROM users u WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 100
);
```

### 4. Pagination: avoid OFFSET on large tables
```sql
-- ❌ Bad: scans and discards 100,000 rows
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;

-- ✅ Good: keyset pagination
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20;
```

### 5. SELECT only needed columns
```sql
-- ❌ Bad: fetches all columns
SELECT * FROM users;

-- ✅ Good: allows covering index
SELECT id, email FROM users WHERE active = true;
```

---

## Index Selectivity & Cardinality

**Cardinality** = number of distinct values in a column.

- High cardinality (e.g. `email`, `user_id`) → indexes very effective
- Low cardinality (e.g. `status` with 3 values, `boolean`) → indexes often **not used** by optimizer (full scan cheaper)

```sql
-- Check cardinality in MySQL
SELECT COUNT(DISTINCT status) / COUNT(*) AS selectivity FROM orders;
-- > 0.01 = low selectivity, index may not help
```

---

## Index Maintenance

```sql
-- MySQL: analyze table statistics
ANALYZE TABLE orders;

-- PostgreSQL: rebuild bloated index
REINDEX INDEX idx_orders_status;

-- Find unused indexes (PostgreSQL)
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Find missing indexes (MySQL slow query log + pt-query-digest)
```

---

## Spring / JPA Notes

```java
// Add indexes via JPA annotations
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_user_status", columnList = "user_id, status"),
    @Index(name = "idx_created_at",  columnList = "created_at")
})
public class Order { ... }

// Enable SQL logging to spot bad queries
# application.properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.type.descriptor.sql=TRACE
```

:::tip Hibernate Query Plans
Use Hibernate's Statistics API or tools like **p6spy** and **datasource-proxy** to log execution time per query in production.
:::

---

## 🎯 Interview Questions

**Q1. What is a B-Tree index and how does it work?**
> A B-Tree is a self-balancing tree where each node holds multiple keys and pointers to child nodes. Searches traverse from root to leaf in O(log n). In B+ Trees (used in practice), only leaf nodes hold data pointers and leaves are linked for efficient range scans.

**Q2. What is a covering index?**
> An index that includes all columns required by a query (in WHERE, SELECT, ORDER BY), so the DB can answer the query entirely from the index without reading the actual table row. Results in `Using index` in MySQL EXPLAIN.

**Q3. Explain the left-prefix rule for composite indexes.**
> A composite index on `(a, b, c)` is only useful if the query's WHERE clause includes `a`, then optionally `b`, then optionally `c` — without skipping. A query filtering on `b` alone won't use the index.

**Q4. When would you NOT add an index?**
> - Low-cardinality columns (boolean, enum with few values)
> - Tables with heavy write loads where index maintenance cost outweighs read gains
> - Very small tables where a full scan is cheaper than index traversal
> - Columns never used in WHERE, JOIN, or ORDER BY

**Q5. What does `Using filesort` mean in EXPLAIN and how do you fix it?**
> The DB cannot use an index to satisfy the ORDER BY and must sort results in memory or on disk. Fix by creating an index that matches the ORDER BY clause (and its sort direction), potentially as part of a composite index with WHERE columns.

**Q6. What is the difference between a clustered and non-clustered index?**
> A **clustered index** determines the physical order of data on disk — the table IS the index (InnoDB uses the PK as clustered). There can be only one. A **non-clustered index** is a separate structure with pointers back to the heap rows. Secondary indexes in InnoDB store the PK value (not a direct pointer) to look up the row.

**Q7. How do you find slow queries in MySQL/PostgreSQL?**
> - MySQL: Enable `slow_query_log`, set `long_query_time`; analyze with `pt-query-digest`
> - PostgreSQL: `pg_stat_statements` extension for query stats; `auto_explain` for plans
> - Both: `EXPLAIN ANALYZE` to see actual vs. estimated row counts

**Q8. What is index bloat and how do you handle it?**
> Over time, updates/deletes leave dead index entries ("bloat"). In PostgreSQL, run `VACUUM` (autovacuum handles this) or `REINDEX`. In MySQL, `OPTIMIZE TABLE` rebuilds the table and indexes. Bloat increases index size and slows scans.

---

## Advanced Editorial Pass: Index Strategy as Cost Engineering

### Senior Engineering Focus
- Optimize indexes for dominant access patterns, not generic completeness.
- Balance read acceleration against write amplification and storage cost.
- Pair index lifecycle with evolving workload behavior.

### Failure Modes to Anticipate
- Index bloat and duplication from uncontrolled additions.
- False confidence from small-data benchmarks.
- Over-indexing that degrades ingest and update throughput.

### Practical Heuristics
1. Maintain an index inventory with owner and purpose.
2. Re-evaluate index utility periodically using query telemetry.
3. Test index changes with both read and write workloads.

### Compare Next
- [Query Planner & Optimizer](./query-planner-optimizer.md)
- [Performance & Monitoring](./performance-monitoring.md)
- [Advanced SQL](./advanced-sql.md)
