import React, { useState } from 'react';

interface RuleDetail {
  id: number;
  title: string;
  subtitle: string;
  category: 'Diagnostic' | 'Plan Analysis' | 'Indexing' | 'Query Rewrite' | 'Architecture';
  color: string;
  badge: string;
  problem: string;
  underTheHood: string;
  badSql: string;
  goodSql: string;
  planImpact: {
    before: string;
    after: string;
    improvement: string;
  };
  engineTips: {
    postgres: string;
    mysql: string;
    oracle: string;
    sqlserver: string;
  };
}

const RULES: RuleDetail[] = [
  {
    id: 1,
    title: 'Rule 1: Find the Slow Query (Telemetry Over Guesswork)',
    subtitle: 'Measure total cumulative execution time, not just single slow outliers',
    category: 'Diagnostic',
    color: '#38bdf8',
    badge: 'Step 1: Diagnostics',
    problem:
      'Engineers frequently optimize the wrong queries based on subjective developer complaints. A 3-second query run once per month costs far fewer database resources than a 40ms unindexed query run 250,000 times per minute.',
    underTheHood:
      'Database engines continuously track execution telemetry in shared memory buffers. Cumulative wall-clock impact = (Call Frequency) × (Mean Execution Latency). High cumulative time starves the Buffer Pool and hogs CPU execution threads.',
    badSql: `-- ❌ Blindly guessing query bottlenecks without telemetry:
-- "Hey, I think the checkout page is slow, let me randomly add indexes on orders.created_at!"
-- Result: Added write amplification, bloated storage, zero p99 latency reduction.`,
    goodSql: `-- ✅ Querying DB-native telemetry for top cumulative latency consumers:
SELECT
    round(total_exec_time::numeric, 2) AS total_ms,
    calls,
    round(mean_exec_time::numeric, 2) AS avg_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS pct_total_load,
    substr(query, 1, 90) AS query_snippet
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;`,
    planImpact: {
      before: 'Unmonitored DB: Latency spikes, random index sprawl, buffer churn',
      after: 'Targeted Remediation: Top 3 cumulative queries identified consuming 68% total CPU',
      improvement: 'Direct ROI on the highest-impact bottlenecks',
    },
    engineTips: {
      postgres: 'Enable `pg_stat_statements` extension; monitor `mean_exec_time` and `shared_blks_read`.',
      mysql: 'Query `sys.statement_analysis` or inspect `slow_query_log` via `pt-query-digest`.',
      oracle: 'Query `V$SQL` and `V$SQL_MONITOR`, or review ASH (Active Session History) & AWR reports.',
      sqlserver: 'Open Query Store or query `sys.dm_exec_query_stats` ordered by `total_worker_time`.',
    },
  },
  {
    id: 2,
    title: 'Rule 2: Read the Execution Plan (EXPLAIN Before Changing Code)',
    subtitle: 'Understand access paths, join algorithms, and cardinality estimation errors',
    category: 'Plan Analysis',
    color: '#34d399',
    badge: 'Step 2: Plan Analysis',
    problem:
      'Changing SQL code or adding indexes without inspecting the execution plan is flying blind. You must verify whether the planner uses a Sequential Scan, an Index Scan, or an in-memory hash aggregate.',
    underTheHood:
      'Cost-Based Optimizers (CBO) calculate tree cost based on table statistics and hardware parameters. A huge disparity between "Estimated Rows" and "Actual Rows" indicates stale statistics, prompting the optimizer to pick suboptimal nested loops over hash joins.',
    badSql: `-- ❌ Changing code based on intuition:
SELECT o.id, c.name, o.total 
FROM orders o 
JOIN customers c ON o.customer_id = c.id 
WHERE o.status = 'COMPLETED' AND o.created_at >= '2025-01-01';
-- Optimizer chose: Seq Scan on 15M orders (cost 428000, 3,450ms)`,
    goodSql: `-- ✅ Analyzing the full physical execution tree with buffers:
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT o.id, c.name, o.total 
FROM orders o 
JOIN customers c ON o.customer_id = c.id 
WHERE o.status = 'COMPLETED' AND o.created_at >= '2025-01-01';

-- Check:
-- 1. Scan Type (Seq Scan vs Index Scan vs Bitmap Heap Scan)
-- 2. Buffers: shared read (disk) vs shared hit (RAM cache)
-- 3. Rows: estimated=1 vs actual=450,000 (run ANALYZE if mismatched)`,
    planImpact: {
      before: 'Seq Scan on orders (cost=0.00..428500.20 rows=480000 actual=3450ms, shared read=52100)',
      after: 'Index Scan on idx_orders_status_date (cost=0.42..124.80 rows=45000 actual=2.1ms, hit=34)',
      improvement: '1,640x faster execution; eliminated 52,000 physical disk page reads',
    },
    engineTips: {
      postgres: 'Always run `EXPLAIN (ANALYZE, BUFFERS)`; check for `shared read` vs `shared hit`.',
      mysql: 'Run `EXPLAIN FORMAT=TREE` or `EXPLAIN ANALYZE` (MySQL 8.0+) to view iterator trees.',
      oracle: 'Run `EXPLAIN PLAN FOR ...` followed by `SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`.',
      sqlserver: 'Enable `SET STATISTICS IO ON; SET STATISTICS TIME ON;` or view Graphical XML Plan.',
    },
  },
  {
    id: 3,
    title: 'Rule 3: Use Appropriate Indexes (Selectivity, Order & Data Types)',
    subtitle: 'Prevent implicit type conversions and respect the Left-Prefix rule',
    category: 'Indexing',
    color: '#fbbf24',
    badge: 'Step 3: Indexing',
    problem:
      'Indexes fail when developers apply functions to indexed columns or mismatch data types. Comparing a VARCHAR column to an INTEGER literal forces the database engine to apply an implicit conversion function on every single row, disabling B-Tree traversal entirely!',
    underTheHood:
      'A B+ Tree relies on pre-sorted byte keys. Wrapping an indexed column `col` in `WHERE CAST(col AS INT) = 123` or `WHERE DATE(col) = ?` means the tree cannot jump directly to leaf nodes; it must evaluate the function on every row via a Full Table Scan.',
    badSql: `-- ❌ Implicit type casting & functions on indexed columns:
-- account_number is VARCHAR(32), but compared against numeric literal:
SELECT * FROM accounts WHERE account_number = 987654321;
-- Postgres/MySQL rewrites to: WHERE CAST(account_number AS BIGINT) = 987654321;
-- ❌ Triggers 100% Full Table Scan!

-- ❌ Date function disabling created_at index:
SELECT * FROM audit_logs WHERE DATE(created_at) = '2025-03-01';`,
    goodSql: `-- ✅ Matching data types & using sargable range predicates:
-- Matching data type (string literal preserves B-Tree lookup):
SELECT * FROM accounts WHERE account_number = '987654321';
-- Uses: Index Scan on idx_accounts_number (0.08ms)

-- SARGable (Search Argument Able) range comparison:
SELECT * FROM audit_logs 
WHERE created_at >= '2025-03-01 00:00:00' 
  AND created_at <  '2025-03-02 00:00:00';
-- Uses: Index Range Scan on idx_audit_created_at`,
    planImpact: {
      before: 'Seq Scan on accounts (Filter: CAST(account_number AS numeric) = 987654321) [820ms]',
      after: 'Index Scan using idx_accounts_num (Index Cond: account_number = \'987654321\') [0.12ms]',
      improvement: '6,800x latency reduction by enabling logarithmic B-Tree traversal',
    },
    engineTips: {
      postgres: 'Define partial indexes (`WHERE active = true`) or covering indexes with `INCLUDE (...)`.',
      mysql: 'Ensure composite index orders leading columns by equality first, then range: `(status, created_at)`.',
      oracle: 'Create function-based index `CREATE INDEX idx ON tab(UPPER(name))` if functions are unavoidable.',
      sqlserver: 'Inspect plan XML for `ConvertIssue="CardLoss"` or `PlanAffectingConvert` warnings.',
    },
  },
  {
    id: 4,
    title: 'Rule 4: Prefer UNION ALL Over UNION',
    subtitle: 'Bypass expensive sorting, hashing, and temporary disk spills',
    category: 'Query Rewrite',
    color: '#f97316',
    badge: 'Step 4: Set Operations',
    problem:
      '`UNION` automatically executes an implicit `DISTINCT` across every column in both result sets. Even if you know the rows are disjoint, `UNION` forces the database to sort or hash the entire combined record set.',
    underTheHood:
      '`UNION` builds a hash table or executes an external mergesort (`Using filesort` or `Sort Method: external merge Disk`). When result rows exceed `work_mem` / `sort_buffer_size`, data spills to temporary disk files. `UNION ALL` streams rows directly to the client with $O(1)$ memory.',
    badSql: `-- ❌ UNION forces heavy sort and duplicate purge across 2M rows:
SELECT customer_id, order_date, total_amount, 'ACTIVE' AS order_type
FROM current_orders
WHERE status = 'PROCESSING'
UNION
SELECT customer_id, order_date, total_amount, 'ARCHIVED' AS order_type
FROM archived_orders
WHERE status = 'ARCHIVED';

-- Execution Plan:
-- -> Append
--    -> Seq Scan on current_orders
--    -> Seq Scan on archived_orders
-- -> HashAggregate / External Merge Disk Spill: 84MB [Latency: 2,850ms]`,
    goodSql: `-- ✅ UNION ALL streams rows instantly without sorting:
SELECT customer_id, order_date, total_amount, 'ACTIVE' AS order_type
FROM current_orders
WHERE status = 'PROCESSING'
UNION ALL
SELECT customer_id, order_date, total_amount, 'ARCHIVED' AS order_type
FROM archived_orders
WHERE status = 'ARCHIVED';

-- Execution Plan:
-- -> Append (streams current_orders then archived_orders directly)
-- -> No deduplication, zero disk spill, zero sort buffer allocation [Latency: 45ms]`,
    planImpact: {
      before: 'HashAggregate (Disk Spill: 84MB, Sort Time: 2,800ms) - Total: 2,850ms',
      after: 'Append Node (Zero sorting, pure stream delivery) - Total: 45ms',
      improvement: '63x speedup, zero temporary disk I/O',
    },
    engineTips: {
      postgres: 'Only use `UNION` if deduplication is strictly mandatory; otherwise always use `UNION ALL`.',
      mysql: '`UNION` creates an internal temporary table with a primary key constraint to eliminate dupes.',
      oracle: '`UNION` triggers `SORT UNIQUE` operator in execution plan; `UNION ALL` avoids it completely.',
      sqlserver: 'Inspect plan for `Sort (Distinct Sort)` or `Hash Match (Aggregate)` on union branches.',
    },
  },
  {
    id: 5,
    title: 'Rule 5: Avoid DISTINCT (Fix Joined Duplicates with Semi-Joins)',
    subtitle: 'Stop using DISTINCT as a band-aid for Cartesian row duplication in 1:N JOINs',
    category: 'Query Rewrite',
    color: '#f87171',
    badge: 'Step 5: Join Anti-Patterns',
    problem:
      'Engineers frequently append `DISTINCT` when a query returns duplicated parent rows due to an unintended `1:N` join with a child table. `DISTINCT` wastes immense CPU hashing and sorting the inflated row set instead of addressing the root cause.',
    underTheHood:
      'A `1:N` join multiplies parent rows by the number of matching child records (e.g. 10,000 customers × avg 50 orders = 500,000 intermediate rows). `DISTINCT` then hashes all 500,000 rows to collapse them back to 10,000. An `EXISTS` semi-join short-circuits on the first child hit and never inflates row counts.',
    badSql: `-- ❌ Using DISTINCT to mask duplicate rows caused by 1:N JOIN:
SELECT DISTINCT c.id, c.company_name, c.email, c.tier
FROM customers c
JOIN invoices inv ON inv.customer_id = c.id
WHERE inv.status = 'OVERDUE' AND inv.balance > 1000;

-- Underlying issue:
-- A customer with 25 overdue invoices is joined 25 times!
-- Database generates 250,000 rows, then performs Sort Unique / HashAggregate.`,
    goodSql: `-- ✅ Semi-Join via EXISTS (short-circuits on first matching record):
SELECT c.id, c.company_name, c.email, c.tier
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM invoices inv 
    WHERE inv.customer_id = c.id 
      AND inv.status = 'OVERDUE' 
      AND inv.balance > 1000
);

-- Under the hood:
-- Hash Semi Join / Index Lookup that STOPS scanning invoices as soon as 
-- the first overdue invoice is found for each customer! Zero row inflation.`,
    planImpact: {
      before: 'Hash Join (rows=250,000) ➔ HashAggregate Unique (rows=8,200) [Time: 1,420ms]',
      after: 'Hash Semi Join (rows=8,200 direct, short-circuited) [Time: 18ms]',
      improvement: '78x speedup; eliminates intermediate row explosion and sort buffers',
    },
    engineTips: {
      postgres: 'Modern PG converts `WHERE id IN (SELECT ...)` to semi-joins, but `EXISTS` is explicit and clean.',
      mysql: 'MySQL transforms `WHERE EXISTS` into an optimized `Semi-Join` execution strategy.',
      oracle: 'Cost-Based Optimizer rewrites correlated `EXISTS` into `HASH JOIN SEMI`.',
      sqlserver: 'Shows `Left Semi Join` operator in plan, stopping probe on first match.',
    },
  },
  {
    id: 6,
    title: 'Rule 6: Structure with CTEs & Avoid Correlated Scalar Subqueries',
    subtitle: 'Modularize complex logic and manage optimizer materialization barriers',
    category: 'Query Rewrite',
    color: '#a78bfa',
    badge: 'Step 6: Query Structuring',
    problem:
      'Correlated scalar subqueries inside the `SELECT` list execute once for every single row in the outer query ($O(N)$ execution loops). Alternatively, deeply nested spaghetti queries become impossible for engineers and optimizers to reason about.',
    underTheHood:
      'CTEs (`WITH cte AS (...)`) break logic into clean declarative pipelines. Note engine differences: PostgreSQL 12+ inlines CTEs by default unless you explicitly declare `WITH cte AS MATERIALIZED (...)`. Use explicit materialization only when you want to compute an expensive calculation once and reuse it across multiple joins.',
    badSql: `-- ❌ Correlated scalar subqueries in SELECT (executes 50,000 times!):
SELECT 
    e.id,
    e.full_name,
    e.department_id,
    (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = e.id AND t.completed = true) AS completed_tasks,
    (SELECT AVG(rating) FROM performance_reviews r WHERE r.employee_id = e.id) AS avg_rating
FROM employees e
WHERE e.status = 'ACTIVE';
-- Result: 1 outer query + (50,000 × 2) = 100,001 subquery index seeks! [Latency: 4,100ms]`,
    goodSql: `-- ✅ Modular CTE with grouped aggregations (scanned exactly once):
WITH task_metrics AS (
    SELECT assigned_to, COUNT(*) AS completed_tasks
    FROM tasks
    WHERE completed = true
    GROUP BY assigned_to
),
review_metrics AS (
    SELECT employee_id, AVG(rating) AS avg_rating
    FROM performance_reviews
    GROUP BY employee_id
)
SELECT 
    e.id,
    e.full_name,
    e.department_id,
    COALESCE(tm.completed_tasks, 0) AS completed_tasks,
    round(rm.avg_rating::numeric, 2) AS avg_rating
FROM employees e
LEFT JOIN task_metrics tm ON e.id = tm.assigned_to
LEFT JOIN review_metrics rm ON e.id = rm.employee_id
WHERE e.status = 'ACTIVE';`,
    planImpact: {
      before: 'Nested Loop scalar subqueries (100,000 subquery loop iterations) [4,100ms]',
      after: '2 HashAggregates + 2 Hash Left Joins (scans each table exactly once) [32ms]',
      improvement: '128x speedup by replacing N+1 correlated scans with hash joins',
    },
    engineTips: {
      postgres: 'PG 12+ inlines non-recursive CTEs automatically; use `AS MATERIALIZED` if you want a temp fence.',
      mysql: 'MySQL 8.0+ supports CTEs; optimizer inlines or materializes based on cost evaluation.',
      oracle: 'Supports `/*+ INLINE */` and `/*+ MATERIALIZE */` optimizer hints for fine-grained CTE control.',
      sqlserver: 'Treats CTEs as inline views; predicate pushdown operates seamlessly into the CTE.',
    },
  },
  {
    id: 7,
    title: 'Rule 7: Deploy Summary Tables & Materialized Views',
    subtitle: 'Trade microsecond freshness for orders-of-magnitude faster analytical reads',
    category: 'Architecture',
    color: '#2dd4bf',
    badge: 'Step 7: Pre-Aggregation',
    problem:
      'When an analytical query scans tens of millions of rows to compute sums, averages, or counts for dashboards, no amount of indexing or query tuning can bypass the physical hardware cost of reading millions of pages.',
    underTheHood:
      'Pre-aggregating data in a dedicated summary table or Materialized View decouples write-time compute from read-time compute. A query scanning 50,000,000 ledger rows taking 18 seconds becomes a 1ms lookup against a 365-row daily summary table.',
    badSql: `-- ❌ Scanning 40,000,000 ledger records on every executive dashboard load:
SELECT 
    region_id,
    DATE_TRUNC('month', transaction_date) AS tx_month,
    COUNT(*) AS total_tx_count,
    SUM(amount) AS total_revenue,
    AVG(processing_fee) AS avg_fee
FROM transactions
WHERE transaction_date >= '2024-01-01'
GROUP BY region_id, DATE_TRUNC('month', transaction_date);
-- Must read 40M rows (~3.2 GB from disk/cache) on every HTTP request! [Latency: 8,400ms]`,
    goodSql: `-- ✅ Materialized View with scheduled refresh or continuous rollup table:
CREATE MATERIALIZED VIEW mv_monthly_revenue_summary AS
SELECT 
    region_id,
    DATE_TRUNC('month', transaction_date) AS tx_month,
    COUNT(*) AS total_tx_count,
    SUM(amount) AS total_revenue,
    AVG(processing_fee) AS avg_fee
FROM transactions
GROUP BY region_id, DATE_TRUNC('month', transaction_date);

CREATE UNIQUE INDEX idx_mv_revenue ON mv_monthly_revenue_summary(region_id, tx_month);

-- App queries the pre-computed summary (scans only 240 rows!):
SELECT * FROM mv_monthly_revenue_summary WHERE tx_month >= '2024-01-01';

-- Fast background refresh (concurrently without locking reads):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue_summary;`,
    planImpact: {
      before: 'Seq Scan on transactions (40,000,000 rows read, 3.2 GB I/O) [8,400ms]',
      after: 'Index Scan on mv_monthly_revenue_summary (240 rows read, 8 KB I/O) [0.8ms]',
      improvement: '10,500x speedup; transfers computational weight to async background refresh',
    },
    engineTips: {
      postgres: 'Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` (requires a UNIQUE index on the view).',
      mysql: 'MySQL lacks built-in materialized views; use event schedulers or rollup summary tables with triggers/CDC.',
      oracle: 'Supports `FAST REFRESH ON COMMIT` using Materialized View Logs for real-time incremental sync.',
      sqlserver: 'Use Indexed Views (`WITH SCHEMABINDING`) which are automatically maintained in real time by the engine.',
    },
  },
];

export default function SlowQueryOptimizationDiagram(): React.JSX.Element {
  const [activeRuleId, setActiveRuleId] = useState<number>(1);
  const [activeEngineTab, setActiveEngineTab] = useState<'postgres' | 'mysql' | 'oracle' | 'sqlserver'>('postgres');

  const currentRule = RULES.find((r) => r.id === activeRuleId) || RULES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '1.05rem' }}>
          The 7 Golden Rules for High-Performance SQL & Slow Query Optimization
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.78rem',
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontWeight: 600,
          }}
        >
          Rule {currentRule.id} of 7 Selected
        </span>
      </div>

      {/* SVG Pipeline Canvas with Flowing Arrows */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 980 170"
          className="interactive-diagram-svg"
          style={{ minHeight: '170px' }}
          role="img"
          aria-label="7 Rules SQL Optimization Pipeline Flow"
        >
          <defs>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
            <marker
              id="arrow-amber"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-orange"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
            </marker>
            <marker
              id="arrow-teal"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
            </marker>
          </defs>

          {/* Flowing Conduits between the 7 steps */}
          {[
            { x1: 125, y1: 85, x2: 155, y2: 85, marker: 'arrow-green', color: '#34d399' },
            { x1: 265, y1: 85, x2: 295, y2: 85, marker: 'arrow-amber', color: '#fbbf24' },
            { x1: 405, y1: 85, x2: 435, y2: 85, marker: 'arrow-orange', color: '#f97316' },
            { x1: 545, y1: 85, x2: 575, y2: 85, marker: 'arrow-red', color: '#f87171' },
            { x1: 685, y1: 85, x2: 715, y2: 85, marker: 'arrow-purple', color: '#a78bfa' },
            { x1: 825, y1: 85, x2: 855, y2: 85, marker: 'arrow-teal', color: '#2dd4bf' },
          ].map((conn, idx) => (
            <g key={idx}>
              {/* Solid background conduit */}
              <line
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                stroke={conn.color}
                strokeWidth="2"
                strokeOpacity="0.3"
              />
              {/* Flowing dashed overlay with animated path */}
              <line
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                stroke={conn.color}
                strokeWidth="2.5"
                className="interactive-diagram-flowing-path"
                markerEnd={`url(#${conn.marker})`}
              />
            </g>
          ))}

          {/* 7 Pipeline Nodes */}
          {[
            { id: 1, x: 20, y: 45, w: 105, h: 80, label: '1. Detect Query', sub: 'pg_stat / QStore', color: '#38bdf8' },
            { id: 2, x: 160, y: 45, w: 105, h: 80, label: '2. Read Plan', sub: 'EXPLAIN BUFFERS', color: '#34d399' },
            { id: 3, x: 300, y: 45, w: 105, h: 80, label: '3. Proper Index', sub: 'No Implicit Cast', color: '#fbbf24' },
            { id: 4, x: 440, y: 45, w: 105, h: 80, label: '4. UNION ALL', sub: 'No Sort Spill', color: '#f97316' },
            { id: 5, x: 580, y: 45, w: 105, h: 80, label: '5. Avoid DISTINCT', sub: 'Semi-Join / EXISTS', color: '#f87171' },
            { id: 6, x: 720, y: 45, w: 105, h: 80, label: '6. Scope CTEs', sub: 'Eliminate Loops', color: '#a78bfa' },
            { id: 7, x: 860, y: 45, w: 105, h: 80, label: '7. Summary MVs', sub: 'Pre-aggregation', color: '#2dd4bf' },
          ].map((node) => {
            const isSelected = activeRuleId === node.id;
            return (
              <g
                key={node.id}
                onClick={() => setActiveRuleId(node.id)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                {/* Node Box */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx="10"
                  fill={isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(13, 15, 30, 0.8)'}
                  stroke={isSelected ? node.color : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth={isSelected ? '2.5' : '1'}
                  filter={isSelected ? `drop-shadow(0 0 10px ${node.color}55)` : 'none'}
                />

                {/* Step indicator badge */}
                <circle
                  cx={node.x + 18}
                  cy={node.y + 20}
                  r="10"
                  fill={isSelected ? node.color : 'rgba(255, 255, 255, 0.1)'}
                />
                <text
                  x={node.x + 18}
                  y={node.y + 24}
                  textAnchor="middle"
                  fill={isSelected ? '#090b14' : '#cbd5e1'}
                  fontSize="11"
                  fontWeight="800"
                >
                  {node.id}
                </text>

                {/* Node Titles */}
                <text
                  x={node.x + node.w / 2}
                  y={node.y + 46}
                  textAnchor="middle"
                  fill={isSelected ? node.color : 'var(--ifm-color-content)'}
                  fontSize="11.5"
                  fontWeight={isSelected ? '700' : '600'}
                >
                  {node.label}
                </text>
                <text
                  x={node.x + node.w / 2}
                  y={node.y + 64}
                  textAnchor="middle"
                  fill="var(--ifm-color-content-secondary)"
                  fontSize="9.5"
                  fontWeight="500"
                >
                  {node.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Rule Selector Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {RULES.map((rule) => {
          const isSelected = activeRuleId === rule.id;
          return (
            <button
              key={rule.id}
              onClick={() => setActiveRuleId(rule.id)}
              style={{
                background: isSelected ? `${rule.color}22` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? rule.color : 'rgba(255, 255, 255, 0.08)'}`,
                color: isSelected ? rule.color : 'var(--ifm-color-content-secondary)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              Rule {rule.id}: {rule.title.split(':')[1]?.trim() || rule.title}
            </button>
          );
        })}
      </div>

      {/* Main Details Split View */}
      <div
        className="slow-query-grid-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '50% 50%',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Diagnostics & Root Cause Analysis */}
        <div
          className="interactive-diagram-details-card"
          style={{
            borderLeft: `4px solid ${currentRule.color}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: `${currentRule.color}22`,
                  color: currentRule.color,
                  border: `1px solid ${currentRule.color}44`,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {currentRule.category}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ifm-color-content-secondary)' }}>
                {currentRule.subtitle}
              </span>
            </div>
            <h3
              style={{
                fontSize: '1.15rem',
                margin: '4px 0 8px 0',
                color: 'var(--ifm-color-content)',
                fontWeight: 700,
              }}
            >
              {currentRule.title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ifm-color-content)' }}>
              {currentRule.problem}
            </p>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <strong style={{ fontSize: '0.82rem', color: currentRule.color, display: 'block', marginBottom: '4px' }}>
              🔬 Under-the-Hood Engine Mechanics:
            </strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {currentRule.underTheHood}
            </p>
          </div>

          {/* Plan Impact Stats */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
              ⚡ Execution Plan Diff & Metric Impact:
            </span>
            <div style={{ fontSize: '0.8rem', color: '#f87171', fontFamily: 'monospace' }}>
              ❌ Before: {currentRule.planImpact.before}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#34d399', fontFamily: 'monospace' }}>
              ✅ After: {currentRule.planImpact.after}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#fbbf24',
                fontWeight: 600,
                marginTop: '4px',
                paddingTop: '4px',
                borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              🚀 Outcome: {currentRule.planImpact.improvement}
            </div>
          </div>
        </div>

        {/* Right Column: Code Comparison & Engine Specific Commands */}
        <div
          className="interactive-diagram-details-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {/* Anti-Pattern vs Optimized Code */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                color: '#f87171',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Anti-Pattern / Suboptimal Query:
            </div>
            <pre
              style={{
                margin: 0,
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                background: '#080a12',
                border: '1px solid rgba(248, 113, 113, 0.25)',
                color: '#fca5a5',
                overflowX: 'auto',
                lineHeight: 1.35,
              }}
            >
              <code>{currentRule.badSql}</code>
            </pre>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                color: '#34d399',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              Optimized Production Query:
            </div>
            <pre
              style={{
                margin: 0,
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                background: '#080a12',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                color: '#86efac',
                overflowX: 'auto',
                lineHeight: 1.35,
              }}
            >
              <code>{currentRule.goodSql}</code>
            </pre>
          </div>

          {/* Engine Cheatsheet Tabs */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                Target Database Engine Advice:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['postgres', 'mysql', 'oracle', 'sqlserver'] as const).map((eng) => (
                  <button
                    key={eng}
                    onClick={() => setActiveEngineTab(eng)}
                    style={{
                      background: activeEngineTab === eng ? '#38bdf822' : 'transparent',
                      border: `1px solid ${activeEngineTab === eng ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: activeEngineTab === eng ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {eng === 'postgres' ? 'PG' : eng === 'sqlserver' ? 'MSSQL' : eng}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--ifm-color-content-secondary)',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 10px',
                borderRadius: '6px',
                borderLeft: '3px solid #38bdf8',
                lineHeight: 1.4,
              }}
            >
              {currentRule.engineTips[activeEngineTab]}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS for responsive mobile wrapping */}
      <style>{`
        @media (max-width: 768px) {
          .slow-query-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
