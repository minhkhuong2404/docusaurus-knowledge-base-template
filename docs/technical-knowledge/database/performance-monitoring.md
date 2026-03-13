---
id: performance-monitoring
title: Performance & Monitoring
description: Identifying slow queries, profiling tools, key metrics, connection pooling, and practical optimization workflow.
tags: [database, performance, monitoring, slow-query, connection-pooling, metrics, profiling]
sidebar_position: 11
---

# Performance & Monitoring

## Key Performance Metrics

| Metric | Target / Watch For |
|--------|-------------------|
| **Query latency (p99)** | < 100ms for OLTP; alert if rising |
| **Queries per second (QPS)** | Baseline + watch for spikes |
| **Buffer pool hit rate** | > 99% for InnoDB |
| **Replication lag** | < 1 second; alert if > 5 seconds |
| **Active connections** | Should be below `max_connections` |
| **Lock wait time** | Spikes indicate lock contention |
| **Temp table to disk** | Should be near 0; index/query issue |
| **Disk I/O** | High read I/O = cache miss; high write = heavy load |
| **CPU usage** | Sustained > 70% = investigate queries |
| **Deadlocks/sec** | Should be near 0 |

---

## Slow Query Logging

### MySQL

```ini
# my.cnf
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1          # log queries > 1 second
log_queries_not_using_indexes = ON
```

```sql
-- Runtime (no restart needed)
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;

-- Analyze slow query log
-- Use: pt-query-digest (Percona Toolkit)
-- pt-query-digest /var/log/mysql/slow.log
```

### PostgreSQL

```ini
# postgresql.conf
log_min_duration_statement = 500    # log queries > 500ms
log_statement = 'none'              # don't log all (too noisy)
log_checkpoints = on
log_lock_waits = on
auto_explain.log_min_duration = 1000   # log explain plans for slow queries
```

```sql
-- pg_stat_statements: aggregated query stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
    LEFT(query, 80)          AS query,
    calls,
    round(mean_exec_time::numeric, 2) AS avg_ms,
    round(total_exec_time::numeric, 2) AS total_ms,
    rows / calls             AS avg_rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## EXPLAIN and EXPLAIN ANALYZE

### MySQL EXPLAIN

```sql
EXPLAIN SELECT u.name, COUNT(o.id)
FROM users u LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id;
```

| Column | Meaning |
|--------|---------|
| `type` | Join type: `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` |
| `key` | Index used (NULL = no index) |
| `rows` | Estimated rows examined |
| `filtered` | % of rows after WHERE filter |
| `Extra` | `Using index`, `Using filesort`, `Using temporary`, `Using where` |

**Red flags**: `type = ALL`, `Extra = Using filesort`, `Extra = Using temporary`.

### PostgreSQL EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 5;
```

```
Index Scan using idx_orders_user on orders  (cost=0.43..12.46 rows=5 width=88)
                                           (actual time=0.056..0.062 rows=3 loops=1)
  Index Cond: (user_id = 5)
  Buffers: shared hit=4
Planning Time: 0.2 ms
Execution Time: 0.1 ms
```

Key things to check:
- `Seq Scan` on large table → missing index
- Large difference between `cost rows` and `actual rows` → stale statistics (`ANALYZE`)
- `Buffers: shared read` → disk I/O (not in buffer cache)
- Nested Loop with large inner rows → consider Hash Join

---

## Connection Pooling

Opening a DB connection is expensive (~20-50ms, TLS + auth + backend process). Applications must use a **connection pool**.

### HikariCP (Default in Spring Boot)

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    hikari:
      maximum-pool-size: 20         # max connections to DB
      minimum-idle: 5               # keep alive connections
      connection-timeout: 30000     # ms to wait for connection
      idle-timeout: 600000          # ms before idle connection closed
      max-lifetime: 1800000         # ms max connection lifetime
      pool-name: MyHikariPool
      # Validate connection before use
      connection-test-query: SELECT 1
```

**Pool sizing formula (rough guide):**
```
pool_size = (num_cores * 2) + effective_spindle_count

For most OLTP apps: 10-20 connections per app instance
For high-concurrency: scale horizontally (more app instances), not pool size
```

### PgBouncer (PostgreSQL Connection Pooler)

Sits between app and PostgreSQL; reuses backend connections:

```ini
# pgbouncer.ini
[pgbouncer]
pool_mode = transaction     # transaction-level pooling (most efficient)
max_client_conn = 10000     # clients connecting to PgBouncer
default_pool_size = 20      # connections to PostgreSQL per DB/user
```

| Pool Mode | Connection reused when |
|-----------|----------------------|
| `session` | Client disconnects |
| `transaction` | Transaction ends (most efficient for stateless apps) |
| `statement` | Each statement (cannot use multi-statement transactions) |

:::caution
Transaction pooling breaks `SET`, prepared statements (without `server_reset_query`), and advisory locks. Spring apps must disable prepared statement caching.
:::

---

## Query Optimization Workflow

```
1. Identify slow queries
   → slow query log, pg_stat_statements, APM tool

2. EXPLAIN ANALYZE the query
   → Look for full scans, large row estimates, wrong join types

3. Check indexes
   → Are required indexes present?
   → Is the optimizer choosing the right one?
   → Run ANALYZE to update statistics

4. Rewrite the query
   → Eliminate functions on indexed columns
   → Replace correlated subqueries with JOINs
   → Use EXISTS instead of IN where appropriate

5. Add/modify indexes
   → Composite index matching WHERE + ORDER BY
   → Covering index if feasible

6. Verify improvement
   → EXPLAIN ANALYZE again, compare row estimates
   → Measure actual latency in staging
```

---

## Common Performance Anti-Patterns

### N+1 Query Problem

```java
// ❌ N+1: 1 query for users + N queries for orders
List<User> users = userRepo.findAll();
for (User u : users) {
    List<Order> orders = orderRepo.findByUserId(u.getId()); // N queries!
}

// ✅ Single JOIN query
List<User> users = userRepo.findAllWithOrders();
// Repository: @Query("SELECT u FROM User u LEFT JOIN FETCH u.orders")
```

### SELECT *

```sql
-- ❌ Fetches all columns, prevents covering index
SELECT * FROM users WHERE active = true;

-- ✅ Fetch only needed columns
SELECT id, email, name FROM users WHERE active = true;
```

### OFFSET Pagination on Large Tables

```sql
-- ❌ Scans and discards all rows before offset
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 50000;

-- ✅ Keyset pagination
SELECT * FROM orders WHERE created_at < :lastSeenDate
ORDER BY created_at DESC LIMIT 20;
```

### Implicit Conversions

```sql
-- ❌ user_id is INT, comparison to VARCHAR triggers full scan
WHERE user_id = '100'

-- ❌ Function on indexed column prevents index use
WHERE DATE(created_at) = '2024-01-15'

-- ✅
WHERE created_at >= '2024-01-15' AND created_at < '2024-01-16'
```

---

## Monitoring Tools

| Tool | Use Case |
|------|---------|
| **pg_stat_statements** | PostgreSQL query stats aggregation |
| **Percona Monitoring & Management (PMM)** | MySQL/PostgreSQL dashboards |
| **pt-query-digest** | Analyze MySQL slow query logs |
| **pgBadger** | PostgreSQL log analyzer |
| **Prometheus + Grafana** | Custom metrics + visualization |
| **Datadog / New Relic** | APM with DB query tracing |
| **p6spy** | Java: log all JDBC queries with timing |
| **datasource-proxy** | Spring: intercept & log DataSource queries |

```java
// p6spy configuration (Maven)
// Add p6spy dependency
// Create spy.properties:
// driverlist=com.mysql.cj.jdbc.Driver
// logMessageFormat=com.p6spy.engine.spy.appender.MultiLineFormat
// appender=com.p6spy.engine.spy.appender.Slf4JLogger
// Change JDBC URL to: jdbc:p6spy:mysql://...
```

---

## 🎯 Interview Questions

**Q1. How do you identify slow queries in production?**
> Enable slow query logs (MySQL: `slow_query_log`; PostgreSQL: `log_min_duration_statement`). For aggregated stats, use PostgreSQL's `pg_stat_statements` or MySQL's performance schema. APM tools like Datadog or New Relic trace queries at the application level. In Java/Spring, use p6spy or datasource-proxy.

**Q2. What is the N+1 problem and how do you fix it?**
> N+1 occurs when loading N parent entities triggers N additional queries to load their children (one per parent). Fix: use JOIN FETCH in JPQL/HQL, `@EntityGraph` in Spring Data, or `@BatchSize` for batch loading. Always inspect Hibernate SQL logs during development.

**Q3. Why is OFFSET pagination bad for large tables and what's the alternative?**
> OFFSET forces the DB to scan and discard all rows before the offset — O(offset + limit) work. At page 5000, you scan 100,000 rows. Keyset (cursor) pagination uses a WHERE clause on the last-seen value (`WHERE id > ?` or `WHERE created_at < ?`) — always O(limit) regardless of page depth.

**Q4. How do you size a connection pool?**
> A common formula: `pool_size = (core_count * 2) + spindle_count`. For OLTP workloads, 10-20 connections per app instance is typical. Bigger pools don't always help — more concurrent queries mean more lock contention and context switching. Scale horizontally (more app nodes) rather than making one huge pool.

**Q5. What does `Using filesort` mean in MySQL EXPLAIN and how do you fix it?**
> The DB cannot satisfy the ORDER BY using an index and must sort the result set in memory (or on disk for large sets). Fix: create an index that matches the ORDER BY column(s) and their direction. If combined with a WHERE clause, the composite index should cover both the filter and sort columns.

**Q6. What is the difference between EXPLAIN and EXPLAIN ANALYZE?**
> `EXPLAIN` shows the query plan with *estimated* costs and row counts based on statistics — no actual execution. `EXPLAIN ANALYZE` actually *executes* the query and shows both estimated and actual rows, time, and buffer usage. Use EXPLAIN ANALYZE on production only with care (it runs the query); use EXPLAIN in development first.

**Q7. What metrics do you monitor for database health?**
> Key metrics: query latency (p50/p99), QPS, buffer pool hit rate (>99%), connections used vs max, replication lag, lock wait events, deadlock rate, disk IOPS, temp tables written to disk, and slow query count. Set alerts on p99 latency spikes, replication lag > threshold, and connections near max.

**Q8. What is PgBouncer and why is it used?**
> PgBouncer is a connection pooler that sits between the application and PostgreSQL. PostgreSQL creates a backend process per connection (~5MB RAM each), so thousands of app connections are expensive. PgBouncer maintains a small pool of real DB connections and multiplexes thousands of client connections onto them. Transaction-mode pooling is the most efficient.

---

## Advanced Editorial Pass: Database Observability and Performance Governance

### Senior Engineering Focus
- Measure at plan, lock, and resource levels to explain latency movement.
- Correlate DB metrics with upstream traffic and deployment changes.
- Use SLO-driven tuning instead of ad-hoc query tweaks.

### Failure Modes to Anticipate
- Alert fatigue from noisy, non-actionable metrics.
- Blind spots in lock/contention visibility.
- Tuning changes made without baseline and rollback plan.

### Practical Heuristics
1. Define golden signals for each datastore role.
2. Keep plan regressions and slow-query trends under continuous review.
3. Run periodic capacity and failure-injection exercises.

### Compare Next
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Query Planner & Optimizer](./query-planner-optimizer.md)
- [Backup & Recovery](./backup-recovery.md)
