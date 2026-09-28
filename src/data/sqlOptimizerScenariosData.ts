export interface SqlTuningStrategy {
  id: string;
  title: string;
  sqlCommand: string;
  isOptimal: boolean;
  resultingCost: number;
  resultingLatencyMs: number;
  executionPlanSummary: string;
  engineExplanation: string;
}

export interface SqlOptimizerScenario {
  id: string;
  title: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Staff';
  category: string;
  categoryLabel: string;
  tableName: string;
  rowCount: string;
  tableSizeDisk: string;
  slowQuery: string;
  initialCost: number;
  initialLatencyMs: number;
  initialPlanSummary: string;
  businessContext: string;
  strategies: SqlTuningStrategy[];
  keyTakeaway: string;
}

export const SQL_OPTIMIZER_SCENARIOS: SqlOptimizerScenario[] = [
  // ── Scenario 1: Composite Indexing ──
  {
    id: 'orders_composite_index',
    title: 'E-Commerce Order History Bottleneck',
    difficulty: 'Mid',
    category: 'indexing',
    categoryLabel: 'Composite Indexing',
    tableName: 'orders',
    rowCount: '15,000,000 rows',
    tableSizeDisk: '4.8 GB on disk',
    slowQuery: `SELECT order_id, user_id, status, total_amount, created_at
FROM orders
WHERE user_id = 1042 AND status = 'COMPLETED'
ORDER BY created_at DESC
LIMIT 20;`,
    initialCost: 385200,
    initialLatencyMs: 4820,
    initialPlanSummary: 'Seq Scan on orders (cost=0.00..385200.00 rows=15000000) Filter: ((user_id = 1042) AND (status = COMPLETED)) -> Sort Method: external merge Disk (Filesort)',
    businessContext: 'User profile orders page takes 5+ seconds to load during peak shopping hours. 15M records in PostgreSQL.',
    strategies: [
      {
        id: 'strat_status_single',
        title: 'Single Index on status',
        sqlCommand: 'CREATE INDEX idx_orders_status ON orders(status);',
        isOptimal: false,
        resultingCost: 320000,
        resultingLatencyMs: 3950,
        executionPlanSummary: 'Bitmap Heap Scan -> Low Cardinality Filter (Engine falls back to Seq Scan)',
        engineExplanation: 'Trap! The "status" column only has 4 distinct values (COMPLETED, PENDING, CANCELLED, REFUNDED). With low cardinality, PostgreSQL estimates scanning the index will visit 40%+ of the table and chooses a Seq Scan anyway.',
      },
      {
        id: 'strat_created_single',
        title: 'Single Index on created_at DESC',
        sqlCommand: 'CREATE INDEX idx_orders_created ON orders(created_at DESC);',
        isOptimal: false,
        resultingCost: 84500,
        resultingLatencyMs: 1240,
        executionPlanSummary: 'Index Scan on created_at -> Filter: user_id & status checked row-by-row',
        engineExplanation: 'Sub-optimal: It avoids the filesort, but forces the engine to read thousands of index pages in reverse date order, checking user_id on every row until 20 matches are found.',
      },
      {
        id: 'strat_composite_optimal',
        title: 'Composite Index (user_id, status, created_at DESC)',
        sqlCommand: 'CREATE INDEX idx_orders_u_s_c ON orders(user_id, status, created_at DESC);',
        isOptimal: true,
        resultingCost: 12.4,
        resultingLatencyMs: 1.8,
        executionPlanSummary: 'Index Scan using idx_orders_u_s_c (cost=0.56..12.40 rows=20) -> Zero Disk Filesort',
        engineExplanation: 'Winner! Adheres to the Leftmost Prefix Rule: equality filters first (user_id, status), followed by the sorting order (created_at DESC). Resolves filter and sort directly in B-Tree leaves in 1.8ms!',
      },
      {
        id: 'strat_wrong_order',
        title: 'Composite Index (created_at DESC, user_id, status)',
        sqlCommand: 'CREATE INDEX idx_orders_c_u_s ON orders(created_at DESC, user_id, status);',
        isOptimal: false,
        resultingCost: 72000,
        resultingLatencyMs: 980,
        executionPlanSummary: 'Index Scan on created_at -> Filter on user_id and status applied post-scan',
        engineExplanation: 'Trap! Placing the range/sort column "created_at" first breaks the compound index seeking for user_id. The database cannot do an equality seek on user_id.',
      },
    ],
    keyTakeaway: 'The Equality-Sort-Range (ESR) rule dictates: Place columns with equality conditions first (user_id, status), then sort columns (created_at), and finally range columns. This completely eliminates both table scans and disk filesorts.',
  },

  // ── Scenario 2: Deep Pagination ──
  {
    id: 'deep_pagination_keyset',
    title: 'Deep Page 20,000 Latency Spike',
    difficulty: 'Senior',
    category: 'pagination',
    categoryLabel: 'Keyset vs Offset',
    tableName: 'audit_logs',
    rowCount: '50,000,000 rows',
    tableSizeDisk: '14.2 GB on disk',
    slowQuery: `SELECT id, event_type, actor_id, ip_address, created_at
FROM audit_logs
ORDER BY id ASC
LIMIT 50 OFFSET 1000000;`,
    initialCost: 184500,
    initialLatencyMs: 3600,
    initialPlanSummary: 'Index Scan on audit_logs_pkey -> Discard 1,000,000 rows -> Return 50 rows',
    businessContext: 'Security compliance export jumps to page 20,000 (OFFSET 1,000,000). The query scans and discards 1 million rows from disk before returning 50.',
    strategies: [
      {
        id: 'strat_increase_work_mem',
        title: 'Increase work_mem to 512MB',
        sqlCommand: 'SET work_mem = "512MB";',
        isOptimal: false,
        resultingCost: 182000,
        resultingLatencyMs: 3450,
        executionPlanSummary: 'Index Scan on audit_logs_pkey (Offset still traverses 1M rows in RAM)',
        engineExplanation: 'Ineffective: work_mem only helps sorts and hash joins. The database engine must still walk 1,000,000 B-Tree leaf pointers before yielding the first result row.',
      },
      {
        id: 'strat_composite_covering',
        title: 'Covering Index on (id, event_type, actor_id)',
        sqlCommand: 'CREATE INDEX idx_audit_covering ON audit_logs(id, event_type, actor_id);',
        isOptimal: false,
        resultingCost: 48000,
        resultingLatencyMs: 820,
        executionPlanSummary: 'Index Only Scan (cost=0.56..48000.00) -> Still discards 1M index tuples',
        engineExplanation: 'Better, but flawed: Index-Only scan avoids heap fetches, but the engine still has to count and discard 1,000,000 index tuples.',
      },
      {
        id: 'strat_keyset_cursor_optimal',
        title: 'Seek-Method Keyset Cursor (WHERE id > :last_seen_id)',
        sqlCommand: `SELECT id, event_type, actor_id, ip_address, created_at
FROM audit_logs
WHERE id > 1000000
ORDER BY id ASC
LIMIT 50;`,
        isOptimal: true,
        resultingCost: 8.2,
        resultingLatencyMs: 1.2,
        executionPlanSummary: 'Index Scan using audit_logs_pkey (id > 1000000) -> O(log N) B-Tree Seek',
        engineExplanation: 'Winner! Keyset pagination (Cursor-based) jumps directly to the target leaf node via B-Tree binary search in O(log N). Zero rows are discarded!',
      },
      {
        id: 'strat_subquery_id_seek',
        title: 'JOIN on ID subquery with LIMIT 50',
        sqlCommand: `SELECT a.* FROM audit_logs a
JOIN (SELECT id FROM audit_logs ORDER BY id LIMIT 50 OFFSET 1000000) b ON a.id = b.id;`,
        isOptimal: false,
        resultingCost: 38000,
        resultingLatencyMs: 650,
        executionPlanSummary: 'Deferred Join (Reduces heap reads, but still scans 1M index keys)',
        engineExplanation: 'A valid deferral optimization in MySQL, but still fundamentally wastes time counting 1M records in the subquery.',
      },
    ],
    keyTakeaway: 'Avoid OFFSET for large datasets. OFFSET N forces the database to read and discard N rows. Keyset pagination (WHERE id > last_seen_id) performs an instant O(log N) B-Tree seek.',
  },

  // ── Scenario 3: Partial Indexing ──
  {
    id: 'partial_index_retry',
    title: 'Index Bloat on Sparse Flags (Partial Indexing)',
    difficulty: 'Senior',
    category: 'partial',
    categoryLabel: 'Partial Indexing',
    tableName: 'payment_invoices',
    rowCount: '60,000,000 rows',
    tableSizeDisk: '18.5 GB on disk',
    slowQuery: `SELECT invoice_id, customer_id, amount_cents, retry_count
FROM payment_invoices
WHERE retry_needed = TRUE AND status = 'FAILED';`,
    initialCost: 495000,
    initialLatencyMs: 5200,
    initialPlanSummary: 'Seq Scan on payment_invoices (cost=0.00..495000.00) Filter: (retry_needed AND status = FAILED)',
    businessContext: 'Payment reconciliation job runs every 60 seconds. Out of 60,000,000 invoices, only 1,200 (0.002%) ever have retry_needed = TRUE.',
    strategies: [
      {
        id: 'strat_full_btree',
        title: 'Standard B-Tree on (retry_needed, status)',
        sqlCommand: 'CREATE INDEX idx_invoices_retry_status ON payment_invoices(retry_needed, status);',
        isOptimal: false,
        resultingCost: 14000,
        resultingLatencyMs: 420,
        executionPlanSummary: 'Bitmap Index Scan -> Index takes 2.6 GB of RAM on disk',
        engineExplanation: 'Sub-optimal: Storing 60,000,000 index entries where 99.99% are "FALSE" bloats the index to 2.6 GB, blowing out the Postgres shared_buffers cache.',
      },
      {
        id: 'strat_partial_optimal',
        title: 'Partial Filtered Index (WHERE retry_needed = TRUE)',
        sqlCommand: 'CREATE INDEX idx_invoices_pending_retry ON payment_invoices(status) WHERE retry_needed = TRUE;',
        isOptimal: true,
        resultingCost: 4.8,
        resultingLatencyMs: 0.9,
        executionPlanSummary: 'Index Scan using idx_invoices_pending_retry (cost=0.15..4.80 rows=1200) -> Size: 48 KB!',
        engineExplanation: 'Winner! A Partial Index indexes only the 1,200 rows matching the WHERE condition. The index shrinks from 2.6 GB to 48 KB, permanently staying in L1/L2 CPU cache for sub-millisecond execution!',
      },
      {
        id: 'strat_hash_index',
        title: 'PostgreSQL Hash Index on retry_needed',
        sqlCommand: 'CREATE INDEX idx_invoices_retry_hash ON payment_invoices USING HASH(retry_needed);',
        isOptimal: false,
        resultingCost: 280000,
        resultingLatencyMs: 3100,
        executionPlanSummary: 'Hash index scan on boolean (low cardinality bucket collision)',
        engineExplanation: 'Catastrophic: Hash index on a boolean column splits into 2 massive hash buckets with 30M collisions each.',
      },
      {
        id: 'strat_cluster_table',
        title: 'CLUSTER Table by retry_needed',
        sqlCommand: 'CLUSTER payment_invoices USING idx_invoices_retry_status;',
        isOptimal: false,
        resultingCost: 8500,
        resultingLatencyMs: 380,
        executionPlanSummary: 'Clustered table rewrites entire 18GB table with exclusive lock',
        engineExplanation: 'Dangerous: CLUSTER locks the table exclusively for hours, blocking all writes, and degrades as new rows are inserted.',
      },
    ],
    keyTakeaway: 'For sparse flags (e.g. is_active, retry_needed, unread), Partial Indexes (WHERE condition) store only relevant rows, reducing index disk footprint by >99% and accelerating lookups.',
  },

  // ── Scenario 4: Covering Index ──
  {
    id: 'covering_index_include',
    title: 'Heap Lookup Tax & Index-Only Scans',
    difficulty: 'Staff',
    category: 'covering',
    categoryLabel: 'Covering Index (INCLUDE)',
    tableName: 'inventory_stocks',
    rowCount: '25,000,000 rows',
    tableSizeDisk: '6.2 GB on disk',
    slowQuery: `SELECT warehouse_id, product_id, available_quantity
FROM inventory_stocks
WHERE warehouse_id = 12 AND product_id BETWEEN 10000 AND 20000;`,
    initialCost: 65400,
    initialLatencyMs: 890,
    initialPlanSummary: 'Bitmap Heap Scan on inventory_stocks -> Random I/O page fetches for available_quantity',
    businessContext: 'High-frequency checkout reservation query. Even with a B-Tree on (warehouse_id, product_id), the engine must jump to the main table heap on disk to fetch available_quantity.',
    strategies: [
      {
        id: 'strat_regular_composite_3',
        title: 'B-Tree on (warehouse_id, product_id, available_quantity)',
        sqlCommand: 'CREATE INDEX idx_inv_w_p_q ON inventory_stocks(warehouse_id, product_id, available_quantity);',
        isOptimal: false,
        resultingCost: 18.5,
        resultingLatencyMs: 14.2,
        executionPlanSummary: 'Index Only Scan (All 3 columns in B-Tree keys, larger branch nodes)',
        engineExplanation: 'Good, but sub-optimal: Including available_quantity as a key column bloats all intermediate B-Tree branch nodes, reducing fanout and increasing tree depth.',
      },
      {
        id: 'strat_include_optimal',
        title: 'Covering Index with INCLUDE (available_quantity)',
        sqlCommand: 'CREATE INDEX idx_inv_covering ON inventory_stocks(warehouse_id, product_id) INCLUDE (available_quantity);',
        isOptimal: true,
        resultingCost: 6.2,
        resultingLatencyMs: 1.4,
        executionPlanSummary: 'Index Only Scan using idx_inv_covering (Zero heap lookups, payload in leaf only)',
        engineExplanation: 'Winner! The INCLUDE clause stores available_quantity exclusively in leaf pages without adding it to the B-Tree search keys. Keeps branch nodes tiny and eliminates 100% of heap table lookups!',
      },
      {
        id: 'strat_separate_indexes',
        title: 'Two Separate Indexes: (warehouse_id) and (product_id)',
        sqlCommand: 'CREATE INDEX idx_w ON inventory_stocks(warehouse_id); CREATE INDEX idx_p ON inventory_stocks(product_id);',
        isOptimal: false,
        resultingCost: 32000,
        resultingLatencyMs: 450,
        executionPlanSummary: 'BitmapAnd of both index bitmaps -> Heap table fetches',
        engineExplanation: 'Sub-optimal: Forces BitmapAnd union in RAM, followed by thousands of random disk page reads to fetch quantity.',
      },
      {
        id: 'strat_materialized_view',
        title: 'Materialized View Refreshing every minute',
        sqlCommand: 'CREATE MATERIALIZED VIEW mv_inventory AS SELECT warehouse_id, product_id, available_quantity FROM inventory_stocks;',
        isOptimal: false,
        resultingCost: 240,
        resultingLatencyMs: 25.0,
        executionPlanSummary: 'Stale read window; periodic refresh spikes CPU 100%',
        engineExplanation: 'Anti-pattern: Inventory availability requires real-time consistency. Materialized views serve stale stock numbers, causing overselling.',
      },
    ],
    keyTakeaway: 'Covering Indexes with the INCLUDE clause (PostgreSQL / SQL Server) store payload columns only in leaf nodes, enabling Index-Only Scans with zero random heap reads.',
  },

  // ── Scenario 5: Subquery N+1 ──
  {
    id: 'subquery_join_aggregation',
    title: 'Correlated Subquery N+1 Collapse',
    difficulty: 'Mid',
    category: 'subquery',
    categoryLabel: 'Subquery Rewrite',
    tableName: 'users / user_posts',
    rowCount: '500,000 users • 10,000,000 posts',
    tableSizeDisk: '3.5 GB on disk',
    slowQuery: `SELECT u.id, u.username,
  (SELECT COUNT(*) FROM user_posts p WHERE p.user_id = u.id) AS post_count
FROM users u
WHERE u.country_code = 'VN';`,
    initialCost: 450000,
    initialLatencyMs: 6800,
    initialPlanSummary: 'Seq Scan on users -> SubPlan executes 50,000 times (N+1 Correlated Subquery Loop)',
    businessContext: 'User directory endpoint generates an N+1 query loop: for every single user in Vietnam, an independent subquery executes against 10M posts.',
    strategies: [
      {
        id: 'strat_index_subquery_only',
        title: 'Add Index on user_posts(user_id) only',
        sqlCommand: 'CREATE INDEX idx_posts_uid ON user_posts(user_id);',
        isOptimal: false,
        resultingCost: 125000,
        resultingLatencyMs: 2100,
        executionPlanSummary: 'SubPlan still loops 50,000 times (50,000 individual index lookups)',
        engineExplanation: 'Partial fix: Accelerates each lookup, but the engine still executes 50,000 distinct B-Tree traversals in a loop.',
      },
      {
        id: 'strat_join_groupby_optimal',
        title: 'Rewrite with LEFT JOIN & GROUP BY + Index',
        sqlCommand: `SELECT u.id, u.username, COUNT(p.id) AS post_count
FROM users u
LEFT JOIN user_posts p ON p.user_id = u.id
WHERE u.country_code = 'VN'
GROUP BY u.id, u.username;
-- With CREATE INDEX idx_posts_uid ON user_posts(user_id);`,
        isOptimal: true,
        resultingCost: 180.0,
        resultingLatencyMs: 18.0,
        executionPlanSummary: 'Hash Join (cost=120..180 rows=50000) -> Single-pass Hash Aggregate',
        engineExplanation: 'Winner! Converts the O(N) subquery loop into a single-pass Hash Join. Instead of 50,000 separate queries, the database joins and aggregates in memory in 18ms!',
      },
      {
        id: 'strat_stored_proc',
        title: 'PL/pgSQL Cursor Stored Procedure with Loop',
        sqlCommand: 'CREATE FUNCTION get_user_posts() ... LOOP FETCH u ... END LOOP;',
        isOptimal: false,
        resultingCost: 350000,
        resultingLatencyMs: 5400,
        executionPlanSummary: 'Procedural row-by-row iteration in PL/pgSQL engine',
        engineExplanation: 'Anti-pattern: Moving the loop into a stored procedure still executes row-by-row context switching in the engine.',
      },
      {
        id: 'strat_trigger_denorm',
        title: 'Add post_count column with INSERT/DELETE triggers on posts',
        sqlCommand: 'ALTER TABLE users ADD COLUMN post_count INT; CREATE TRIGGER trg_posts ...;',
        isOptimal: false,
        resultingCost: 50.0,
        resultingLatencyMs: 5.0,
        executionPlanSummary: 'Fast reads, but creates write lock contention and concurrency deadlocks',
        engineExplanation: 'High risk: Triggers create row locks on the users table on every post creation, causing deadlock storms during high write throughput.',
      },
    ],
    keyTakeaway: 'Correlated subqueries in the SELECT projection execute once per row (N+1 query problem). Refactoring to a set-based LEFT JOIN with GROUP BY replaces thousands of iterations with a single Hash Join.',
  },

  // ── Scenario 6: GIN Trigram ──
  {
    id: 'trigram_like_wildcard',
    title: 'The LIKE "%search%" Wildcard Full-Scan',
    difficulty: 'Senior',
    category: 'text_search',
    categoryLabel: 'GIN Trigram Indexing',
    tableName: 'customers',
    rowCount: '12,000,000 rows',
    tableSizeDisk: '3.8 GB on disk',
    slowQuery: `SELECT customer_id, full_name, email, company
FROM customers
WHERE email LIKE '%@acme-corp.com';`,
    initialCost: 284000,
    initialLatencyMs: 3400,
    initialPlanSummary: 'Seq Scan on customers (cost=0.00..284000.00) Filter: (email ~~ "%@acme-corp.com")',
    businessContext: 'Customer support search with leading wildcards (%term) cannot use standard B-Tree indexes because the prefix is unknown.',
    strategies: [
      {
        id: 'strat_standard_btree',
        title: 'Standard B-Tree Index on customers(email)',
        sqlCommand: 'CREATE INDEX idx_customers_email ON customers(email);',
        isOptimal: false,
        resultingCost: 284000,
        resultingLatencyMs: 3400,
        executionPlanSummary: 'Index completely IGNORED! Engine falls back to full table scan',
        engineExplanation: 'Trap! Standard B-Trees are sorted alphabetically from left-to-right. A leading wildcard (%) makes binary search impossible; the planner rejects the index.',
      },
      {
        id: 'strat_gin_trgm_optimal',
        title: 'PostgreSQL GIN Trigram Index (pg_trgm)',
        sqlCommand: `CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_customers_email_trgm ON customers USING GIN (email gin_trgm_ops);`,
        isOptimal: true,
        resultingCost: 14.5,
        resultingLatencyMs: 3.2,
        executionPlanSummary: 'Bitmap Index Scan on idx_customers_email_trgm (3-gram inverted index match)',
        engineExplanation: 'Winner! The pg_trgm extension breaks text into 3-character tokens (e.g. "acm", "cme"). A Generalized Inverted Index (GIN) searches trigram postings lists directly in 3.2ms!',
      },
      {
        id: 'strat_reverse_btree',
        title: 'Index on REVERSE(email) with LIKE "moc.proc-emca@%"',
        sqlCommand: 'CREATE INDEX idx_cust_rev_email ON customers(REVERSE(email));',
        isOptimal: false,
        resultingCost: 42.0,
        resultingLatencyMs: 12.0,
        executionPlanSummary: 'Functional Index on REVERSE (Works for trailing wildcard only, not %term%)',
        engineExplanation: 'Clever hack that works for suffix lookups, but fails completely when the query has both leading and trailing wildcards (LIKE "%term%").',
      },
      {
        id: 'strat_full_text_tsvector',
        title: 'tsvector Full Text Search on email',
        sqlCommand: 'CREATE INDEX idx_email_fts ON customers USING GIN(to_tsvector("english", email));',
        isOptimal: false,
        resultingCost: 95000,
        resultingLatencyMs: 1200,
        executionPlanSummary: 'FTS word tokenizer fails on email domains (strips punctuation)',
        engineExplanation: 'Misguided: Full-Text Search (tsvector) is designed for natural human language words, not structured email addresses or arbitrary substrings.',
      },
    ],
    keyTakeaway: 'Standard B-Tree indexes cannot satisfy queries with leading wildcards (LIKE "%search%"). Use GIN trigram indexes (pg_trgm) for arbitrary substring search in PostgreSQL.',
  },

  // ── Scenario 7: Functional / Expression Index ──
  {
    id: 'functional_case_insensitive',
    title: 'Case-Insensitive Auth Lookup Scan',
    difficulty: 'Junior',
    category: 'functional',
    categoryLabel: 'Expression Indexing',
    tableName: 'users',
    rowCount: '20,000,000 rows',
    tableSizeDisk: '5.4 GB on disk',
    slowQuery: `SELECT user_id, password_hash, mfa_secret
FROM users
WHERE LOWER(email) = 'alex.chen@stripe.com';`,
    initialCost: 412000,
    initialLatencyMs: 4600,
    initialPlanSummary: 'Seq Scan on users (cost=0.00..412000.00) Filter: (lower(email) = "alex.chen@stripe.com")',
    businessContext: 'User login bottleneck: users type email in mixed case. A B-Tree index on email exists, yet login queries take 4.6 seconds!',
    strategies: [
      {
        id: 'strat_existing_btree',
        title: 'Rely on existing CREATE INDEX idx_users_email ON users(email);',
        sqlCommand: '-- No change: idx_users_email already exists',
        isOptimal: false,
        resultingCost: 412000,
        resultingLatencyMs: 4600,
        executionPlanSummary: 'Index cannot be used! Function call LOWER() invalidates B-Tree keys',
        engineExplanation: 'Trap! The database cannot look up "LOWER(email)" in an index that stores "email" directly. It must calculate LOWER() on all 20M rows via a full table scan!',
      },
      {
        id: 'strat_expression_optimal',
        title: 'Expression / Functional Index on LOWER(email)',
        sqlCommand: 'CREATE UNIQUE INDEX idx_users_lower_email ON users(LOWER(email));',
        isOptimal: true,
        resultingCost: 8.4,
        resultingLatencyMs: 0.8,
        executionPlanSummary: 'Index Scan using idx_users_lower_email (cost=0.56..8.40) -> Exact Point Seek',
        engineExplanation: 'Winner! An expression index pre-calculates and indexes the output of the LOWER() function. The query planner matches the WHERE clause directly to the index in 0.8ms!',
      },
      {
        id: 'strat_citext_type',
        title: 'Change column type to citext (Case-Insensitive Text)',
        sqlCommand: 'CREATE EXTENSION citext; ALTER TABLE users ALTER COLUMN email TYPE citext;',
        isOptimal: false,
        resultingCost: 12.0,
        resultingLatencyMs: 8500,
        executionPlanSummary: 'ALTER TABLE rewrites 20M rows, taking an exclusive AccessExclusiveLock for 10 minutes',
        engineExplanation: 'High risk in production: Changing the column type requires rewriting the entire 5.4 GB table and locking out all logins.',
      },
      {
        id: 'strat_application_lowercase',
        title: 'Force client app to lowercase email in query string only',
        sqlCommand: 'SELECT ... WHERE email = "alex.chen@stripe.com"; -- Assuming app lowercases input',
        isOptimal: false,
        resultingCost: 12.0,
        resultingLatencyMs: 2.0,
        executionPlanSummary: 'Misses users who originally registered with uppercase letters!',
        engineExplanation: 'Buggy: If an existing user registered as "Alex.Chen@stripe.com", searching for lowercase "alex.chen@stripe.com" with a raw equality check returns zero rows!',
      },
    ],
    keyTakeaway: 'Wrapping a column in a function (LOWER(), DATE(), COALESCE()) prevents the optimizer from using standard B-Tree indexes. Create an Expression Index on the exact function expression.',
  },

  // ── Scenario 8: BRIN Indexing for Time-Series ──
  {
    id: 'brin_append_timeseries',
    title: '200M Row IoT Logs: 14GB B-Tree RAM Exhaustion',
    difficulty: 'Staff',
    category: 'brin',
    categoryLabel: 'BRIN vs B-Tree',
    tableName: 'telemetry_readings',
    rowCount: '200,000,000 rows',
    tableSizeDisk: '72 GB on disk',
    slowQuery: `SELECT device_id, metric_name, reading_value, recorded_at
FROM telemetry_readings
WHERE recorded_at BETWEEN '2026-08-01 00:00:00' AND '2026-08-01 23:59:59';`,
    initialCost: 289000,
    initialLatencyMs: 3800,
    initialPlanSummary: 'B-Tree Index Scan -> Index takes 14.8 GB RAM (Thrashing disk cache during writes)',
    businessContext: 'Industrial IoT monitoring table receives 5,000 inserts/second. A traditional B-Tree on recorded_at consumes 14.8 GB of RAM and crashes the server under memory pressure.',
    strategies: [
      {
        id: 'strat_drop_index',
        title: 'Drop index and rely on parallel sequential scans',
        sqlCommand: 'DROP INDEX idx_readings_time; SET max_parallel_workers_per_gather = 8;',
        isOptimal: false,
        resultingCost: 950000,
        resultingLatencyMs: 8200,
        executionPlanSummary: 'Parallel Seq Scan on 72GB table -> 100% Disk I/O Saturation',
        engineExplanation: 'Catastrophic: Reading 72 GB from disk on every query spikes server I/O to 100% and starves write throughput.',
      },
      {
        id: 'strat_brin_optimal',
        title: 'Block Range Index (BRIN) on recorded_at',
        sqlCommand: 'CREATE INDEX idx_readings_brin_time ON telemetry_readings USING BRIN(recorded_at) WITH (pages_per_range = 128);',
        isOptimal: true,
        resultingCost: 140.0,
        resultingLatencyMs: 12.0,
        executionPlanSummary: 'Bitmap Index Scan using idx_readings_brin_time -> Index size: 240 KB (99.99% smaller!)',
        engineExplanation: 'Winner! For append-only naturally sorted time-series data, a BRIN index stores only the minimum and maximum values for each 128-page disk block. The index is only 240 KB (fits in L2 CPU cache!) and executes in 12ms!',
      },
      {
        id: 'strat_unlogged_table',
        title: 'Convert table to UNLOGGED TABLE',
        sqlCommand: 'ALTER TABLE telemetry_readings SET UNLOGGED;',
        isOptimal: false,
        resultingCost: 280000,
        resultingLatencyMs: 3200,
        executionPlanSummary: 'Disables WAL writes, but does not fix index size or query read performance',
        engineExplanation: 'Severe data loss risk: UNLOGGED tables are truncated upon database crash/restart. Does nothing to reduce query scan latency.',
      },
      {
        id: 'strat_btree_fillfactor',
        title: 'Rebuild B-Tree with fillfactor = 70',
        sqlCommand: 'CREATE INDEX idx_b ON telemetry_readings(recorded_at) WITH (fillfactor = 70);',
        isOptimal: false,
        resultingCost: 12000,
        resultingLatencyMs: 850,
        executionPlanSummary: 'Makes the index 30% LARGER (19 GB), worsening memory exhaustion',
        engineExplanation: 'Counter-productive: Lowering fillfactor reserves empty space for updates. On append-only tables, it simply wastes 4+ GB of additional RAM.',
      },
    ],
    keyTakeaway: 'On massive append-only or naturally correlated tables (timestamps, auto-increment IDs), BRIN (Block Range Index) takes orders of magnitude less space (<1MB vs 15GB B-Tree) while providing fast range scans.',
  },

  // ── Scenario 9: JSONB Document Optimization ──
  {
    id: 'jsonb_nested_query',
    title: 'Microservices Event Store JSONB Filtering',
    difficulty: 'Senior',
    category: 'jsonb',
    categoryLabel: 'JSONB GIN Indexing',
    tableName: 'domain_events',
    rowCount: '40,000,000 rows',
    tableSizeDisk: '28 GB on disk',
    slowQuery: `SELECT event_id, aggregate_id, payload
FROM domain_events
WHERE payload @> '{"event_type": "ORDER_DISPATCHED", "region": "APAC"}';`,
    initialCost: 890000,
    initialLatencyMs: 9400,
    initialPlanSummary: 'Seq Scan on domain_events (cost=0.00..890000.00) Filter: (payload @> \'{"event_type": "ORDER_DISPATCHED", "region": "APAC"}\')',
    businessContext: 'Microservices event sourcing store. Querying specific JSONB nested keys triggers a 28 GB sequential scan taking 9.4 seconds.',
    strategies: [
      {
        id: 'strat_default_gin',
        title: 'Default GIN Index on payload',
        sqlCommand: 'CREATE INDEX idx_events_jsonb ON domain_events USING GIN(payload);',
        isOptimal: false,
        resultingCost: 180.0,
        resultingLatencyMs: 45.0,
        executionPlanSummary: 'Bitmap Index Scan using idx_events_jsonb -> Index size: 9.8 GB',
        engineExplanation: 'Decent, but sub-optimal: Default GIN indexes every key and value in the JSONB object, inflating index size to 9.8 GB and slowing down write transactions.',
      },
      {
        id: 'strat_jsonb_path_optimal',
        title: 'Specialized GIN Index using jsonb_path_ops',
        sqlCommand: 'CREATE INDEX idx_events_jsonb_path ON domain_events USING GIN(payload jsonb_path_ops);',
        isOptimal: true,
        resultingCost: 14.2,
        resultingLatencyMs: 2.8,
        executionPlanSummary: 'Bitmap Index Scan using idx_events_jsonb_path -> Size: 1.8 GB (80% smaller!)',
        engineExplanation: 'Winner! jsonb_path_ops only indexes hashes of root-to-leaf paths rather than individual keys and values. It is 80% smaller, faster to search with the containment operator (@>), and executes in 2.8ms!',
      },
      {
        id: 'strat_btree_cast',
        title: 'B-Tree Index on (payload::text)',
        sqlCommand: 'CREATE INDEX idx_events_text ON domain_events((payload::text));',
        isOptimal: false,
        resultingCost: 890000,
        resultingLatencyMs: 9400,
        executionPlanSummary: 'Index ignored: @> operator cannot use text B-Tree index',
        engineExplanation: 'Useless: B-Tree index on text representation cannot evaluate JSON containment (@>) or key equality.',
      },
      {
        id: 'strat_extract_columns',
        title: 'ALTER TABLE to extract 10 JSON columns into relational columns',
        sqlCommand: 'ALTER TABLE domain_events ADD COLUMN event_type TEXT, ADD COLUMN region TEXT ...;',
        isOptimal: false,
        resultingCost: 10.0,
        resultingLatencyMs: 2.0,
        executionPlanSummary: 'Schema rewrite breaks backwards compatibility across 15 microservices',
        engineExplanation: 'Architectural violation: Modifying immutable event store schema breaks event sourcing contracts across microservices.',
      },
    ],
    keyTakeaway: 'For JSONB containment queries (@>), use GIN with jsonb_path_ops. It hashes full paths, resulting in smaller index footprints and significantly faster lookups than standard GIN.',
  },

  // ── Scenario 10: NULLS LAST Sort Mismatch ──
  {
    id: 'nulls_sort_mismatch',
    title: 'Priority Task Queue Sort Degradation',
    difficulty: 'Mid',
    category: 'indexing',
    categoryLabel: 'NULLS Sort Order',
    tableName: 'task_queue',
    rowCount: '10,000,000 rows',
    tableSizeDisk: '2.4 GB on disk',
    slowQuery: `SELECT task_id, priority, due_date
FROM task_queue
ORDER BY priority DESC NULLS LAST, due_date ASC
LIMIT 10;`,
    initialCost: 125000,
    initialLatencyMs: 1800,
    initialPlanSummary: 'Index Scan on idx_tasks_p_d -> Sort: external merge Disk (Sort order mismatch)',
    businessContext: 'Worker daemon polls top priority jobs every second. An index on (priority DESC, due_date ASC) exists, yet execution plan shows an in-memory/disk Sort step!',
    strategies: [
      {
        id: 'strat_default_desc_btree',
        title: 'Rely on CREATE INDEX idx_tasks ON task_queue(priority DESC, due_date ASC);',
        sqlCommand: '-- Existing index created with default NULLs behavior',
        isOptimal: false,
        resultingCost: 125000,
        resultingLatencyMs: 1800,
        executionPlanSummary: 'Sort operator executed! In PostgreSQL, DESC defaults to NULLS FIRST',
        engineExplanation: 'Trap! In PostgreSQL, "DESC" defaults to "NULLS FIRST". The query asks for "NULLS LAST". Because the index physical ordering differs from the query, the planner must sort all matching tuples in RAM/disk!',
      },
      {
        id: 'strat_nulls_last_optimal',
        title: 'Composite Index with explicit NULLS LAST',
        sqlCommand: 'CREATE INDEX idx_tasks_nulls_last ON task_queue(priority DESC NULLS LAST, due_date ASC);',
        isOptimal: true,
        resultingCost: 4.2,
        resultingLatencyMs: 0.6,
        executionPlanSummary: 'Index Scan using idx_tasks_nulls_last (cost=0.42..4.20) -> Zero Sort Step',
        engineExplanation: 'Winner! Matching the index definition exactly to "priority DESC NULLS LAST" allows the engine to walk the B-Tree leaf pointers directly. Takes 0.6ms with zero sorting overhead!',
      },
      {
        id: 'strat_coalesce_priority',
        title: 'Rewrite query to COALESCE(priority, -1)',
        sqlCommand: 'SELECT ... ORDER BY COALESCE(priority, -1) DESC, due_date ASC LIMIT 10;',
        isOptimal: false,
        resultingCost: 195000,
        resultingLatencyMs: 2400,
        executionPlanSummary: 'Seq Scan: COALESCE function call disables existing B-Tree index',
        engineExplanation: 'Anti-pattern: Adding COALESCE in the ORDER BY invalidates index usage and forces a full table scan.',
      },
      {
        id: 'strat_not_null_check',
        title: 'Add WHERE priority IS NOT NULL',
        sqlCommand: 'SELECT ... WHERE priority IS NOT NULL ORDER BY priority DESC, due_date ASC LIMIT 10;',
        isOptimal: false,
        resultingCost: 85.0,
        resultingLatencyMs: 18.0,
        executionPlanSummary: 'Changes query business semantics (Drops tasks with unassigned priority)',
        engineExplanation: 'Dangerous: Alters business logic! Tasks with NULL priority are excluded rather than being placed at the end of the queue.',
      },
    ],
    keyTakeaway: 'In PostgreSQL, ASC defaults to NULLS LAST, while DESC defaults to NULLS FIRST. If your query specifies NULLS LAST with DESC, you must create the index with explicit NULLS LAST to avoid a sort operator.',
  },

  // ── Scenario 11: OR Disjunction Trap ──
  {
    id: 'or_condition_union',
    title: 'Multi-Column OR Condition Bitmap Trap',
    difficulty: 'Mid',
    category: 'antipattern',
    categoryLabel: 'OR vs UNION ALL',
    tableName: 'customer_profiles',
    rowCount: '18,000,000 rows',
    tableSizeDisk: '4.2 GB on disk',
    slowQuery: `SELECT user_id, full_name, phone_number, national_id
FROM customer_profiles
WHERE phone_number = '+1-555-0199' OR national_id = 'ID-9948201';`,
    initialCost: 145000,
    initialLatencyMs: 2100,
    initialPlanSummary: 'BitmapOr on (idx_phone, idx_natid) -> Bitmap Heap Scan -> Lossy recheck',
    businessContext: 'Customer lookup API by either phone or national tax ID. Both columns have independent unique indexes, but OR queries degrade to slow BitmapOr scans.',
    strategies: [
      {
        id: 'strat_composite_both',
        title: 'Create Composite Index on (phone_number, national_id)',
        sqlCommand: 'CREATE INDEX idx_cust_phone_nat ON customer_profiles(phone_number, national_id);',
        isOptimal: false,
        resultingCost: 92000,
        resultingLatencyMs: 1600,
        executionPlanSummary: 'Index Scan on phone, but fails when query matches only national_id',
        engineExplanation: 'Flawed: An index on (A, B) cannot satisfy an OR query when searching for B alone (Leftmost Prefix Rule).',
      },
      {
        id: 'strat_union_all_optimal',
        title: 'Rewrite as UNION ALL with Anti-Duplicate Filter',
        sqlCommand: `SELECT user_id, full_name, phone_number, national_id
FROM customer_profiles
WHERE phone_number = '+1-555-0199'
UNION ALL
SELECT user_id, full_name, phone_number, national_id
FROM customer_profiles
WHERE national_id = 'ID-9948201' AND (phone_number != '+1-555-0199' OR phone_number IS NULL);`,
        isOptimal: true,
        resultingCost: 16.4,
        resultingLatencyMs: 1.2,
        executionPlanSummary: 'Append -> 2x Direct Index Seek on idx_phone and idx_natid (1.2ms)',
        engineExplanation: 'Winner! Refactoring the OR query into two distinct branches merged with UNION ALL allows the query planner to execute two independent O(log N) Index Seeks. Eliminates BitmapOr and heap degradation!',
      },
      {
        id: 'strat_force_index_hints',
        title: 'Force index hints using pg_hint_plan',
        sqlCommand: '/*+ IndexScan(customer_profiles) */ SELECT ... WHERE phone OR national_id;',
        isOptimal: false,
        resultingCost: 140000,
        resultingLatencyMs: 2050,
        executionPlanSummary: 'Planner cannot execute a single B-Tree scan on two independent columns',
        engineExplanation: 'Futile: Query hints cannot change the physical impossibility of searching two separate B-Trees in a single pass.',
      },
      {
        id: 'strat_in_clause',
        title: 'Rewrite using WHERE (phone_number, national_id) IN (...)',
        sqlCommand: 'SELECT ... WHERE (phone_number, national_id) IN ((\'+1-555-0199\', \'\'), (\'\', \'ID-9948201\'));',
        isOptimal: false,
        resultingCost: 180000,
        resultingLatencyMs: 2400,
        executionPlanSummary: 'Row-value constructor requires exact pair match; returns 0 rows',
        engineExplanation: 'Syntax error in logic: Row constructor requires both elements of the tuple to match, failing the OR requirement.',
      },
    ],
    keyTakeaway: 'OR conditions across different columns frequently force the optimizer into slow BitmapOr operations. Rewriting to UNION ALL allows each query branch to perform an independent, optimal B-Tree index seek.',
  },

  // ── Scenario 12: NOT IN NULL Trap ──
  {
    id: 'not_in_null_trap',
    title: 'The NOT IN Subquery 3-Valued Logic Trap',
    difficulty: 'Junior',
    category: 'antipattern',
    categoryLabel: 'NOT IN vs NOT EXISTS',
    tableName: 'employees / departments',
    rowCount: '5,000,000 employees • 20,000 departments',
    tableSizeDisk: '1.2 GB on disk',
    slowQuery: `SELECT employee_id, first_name, last_name, department_id
FROM employees
WHERE department_id NOT IN (
  SELECT department_id FROM departments WHERE is_active = FALSE
);`,
    initialCost: 320000,
    initialLatencyMs: 4100,
    initialPlanSummary: 'Seq Scan on employees (Filter: NOT (hashed SubPlan)) -> Cannot use index on department_id',
    businessContext: 'Payroll active department check. An index on employees(department_id) exists, but the query refuses to use it and takes 4.1s.',
    strategies: [
      {
        id: 'strat_add_index_subquery',
        title: 'Add Index on departments(department_id, is_active)',
        sqlCommand: 'CREATE INDEX idx_dept_active ON departments(department_id, is_active);',
        isOptimal: false,
        resultingCost: 290000,
        resultingLatencyMs: 3800,
        executionPlanSummary: 'SubPlan still evaluates row-by-row because NULLs might exist',
        engineExplanation: 'Trap! In SQL three-valued logic, if the subquery returns even a single NULL, "x NOT IN (NULL)" evaluates to UNKNOWN, returning zero rows. The engine cannot safely optimize to an Anti-Join!',
      },
      {
        id: 'strat_not_exists_optimal',
        title: 'Rewrite with NOT EXISTS (Anti-Join)',
        sqlCommand: `SELECT e.employee_id, e.first_name, e.last_name, e.department_id
FROM employees e
WHERE NOT EXISTS (
  SELECT 1 FROM departments d
  WHERE d.department_id = e.department_id AND d.is_active = FALSE
);`,
        isOptimal: true,
        resultingCost: 120.0,
        resultingLatencyMs: 14.0,
        executionPlanSummary: 'Hash Anti Join (cost=45..120 rows=4800000) -> Uses Hash Join in single pass',
        engineExplanation: 'Winner! NOT EXISTS uses 2-valued boolean logic (true/false) and allows the engine to transform the query into a high-performance Hash Anti-Join or Merge Anti-Join in 14ms!',
      },
      {
        id: 'strat_left_join_null',
        title: 'LEFT JOIN with WHERE d.department_id IS NULL without indexing',
        sqlCommand: `SELECT e.* FROM employees e
LEFT JOIN departments d ON e.department_id = d.department_id AND d.is_active = FALSE
WHERE d.department_id IS NULL;`,
        isOptimal: false,
        resultingCost: 850.0,
        resultingLatencyMs: 85.0,
        executionPlanSummary: 'Outer join materialization (Works, but heavier memory footprint than Anti-Join)',
        engineExplanation: 'Acceptable rewrite, but generates more intermediate join tuples than a dedicated Hash Anti-Join.',
      },
      {
        id: 'strat_except_clause',
        title: 'Rewrite using EXCEPT operator',
        sqlCommand: 'SELECT employee_id FROM employees EXCEPT SELECT employee_id FROM ...;',
        isOptimal: false,
        resultingCost: 45000,
        resultingLatencyMs: 820,
        executionPlanSummary: 'EXCEPT forces full sort and deduplication across all 5M rows',
        engineExplanation: 'Slow: The EXCEPT set operator performs mandatory deduplication (DISTINCT) across the entire dataset.',
      },
    ],
    keyTakeaway: 'Always prefer NOT EXISTS over NOT IN for subqueries. SQL three-valued logic causes NOT IN to degrade or yield incorrect empty results if the subquery contains a NULL value.',
  },
  // ── Scenario 13: Production Anti-Pattern: The 900M-Row Write-Only AuditLog ──
  {
    id: 'audit_log_antipattern_partitioning',
    title: 'The 900M-Row Write-Only AuditLog Meltdown',
    difficulty: 'Senior',
    category: 'anti_patterns',
    categoryLabel: 'Partitioning & Schema Anti-Patterns',
    tableName: 'AuditLog',
    rowCount: '900,000,000 rows',
    tableSizeDisk: '320 GB on disk',
    slowQuery: `SELECT log_id, action, user_id, payload, created_at
FROM AuditLog
WHERE created_at >= '2026-03-14 00:00:00' 
  AND created_at < '2026-03-15 00:00:00'
ORDER BY created_at DESC;`,
    initialCost: 12850000,
    initialLatencyMs: 48000,
    initialPlanSummary: 'Seq Scan on AuditLog (cost=0.00..12850000.00 rows=900000000) Filter: (created_at >= 2026-03-14 AND created_at < 2026-03-15) -> OOM Hazard!',
    businessContext: 'Inspired by Pinal Dave: The compliance auditor demands logs for March 14th. 900M rows written over 7 years without an index on created_at. Query runs for 48s, blows out RAM buffer pool, and causes database crash!',
    strategies: [
      {
        id: 'strat_audit_partitioning',
        title: 'Declarative Range Partitioning by Month with Local Index',
        sqlCommand: `CREATE TABLE audit_logs_partitioned (
  log_id BIGSERIAL,
  action VARCHAR(100) NOT NULL,
  user_id BIGINT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (created_at, log_id)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_partition_created ON audit_logs_2026_03(created_at DESC);`,
        isOptimal: true,
        resultingCost: 120.0,
        resultingLatencyMs: 9.5,
        executionPlanSummary: 'Partition Pruning: Scans ONLY audit_logs_2026_03 (Index Scan using idx_audit_partition_created) -> 98.3% I/O eliminated',
        engineExplanation: 'Champion! Partition pruning eliminates 885 million rows from even being examined. The optimizer routes directly to the March 2026 sub-partition, reducing disk reads from 320 GB to just 4.2 MB in 9.5ms!',
      },
      {
        id: 'strat_audit_single_btree',
        title: 'Global B-Tree Index on created_at (CREATE INDEX CONCURRENTLY)',
        sqlCommand: 'CREATE INDEX CONCURRENTLY idx_audit_created ON AuditLog(created_at DESC);',
        isOptimal: false,
        resultingCost: 4850,
        resultingLatencyMs: 380,
        executionPlanSummary: 'Index Scan on AuditLog (Avoids full table scan, but index itself is 42 GB on disk)',
        engineExplanation: 'Partial fix. An index seek retrieves the 1-day range in 380ms, but maintaining a 42 GB B-tree on a 900M-row flat table increases write latency on EVERY live INSERT and makes future archival via DELETE catastrophically slow.',
      },
      {
        id: 'strat_audit_parallel_workers',
        title: 'Increase Parallel Query Workers (SET max_parallel_workers = 8)',
        sqlCommand: 'SET max_parallel_workers_per_gather = 8; SELECT ... FROM AuditLog ...',
        isOptimal: false,
        resultingCost: 3200000,
        resultingLatencyMs: 14500,
        executionPlanSummary: 'Parallel Seq Scan on AuditLog with 8 workers (Still reads 320 GB off NVMe storage)',
        engineExplanation: 'Band-aid: Dividing a 320 GB table scan across 8 CPU cores cuts runtime from 48s to 14.5s, but saturates disk bus and CPU at 100%, causing query queuing for the rest of the application.',
      },
    ],
    keyTakeaway: 'For massive event logs, avoid flat unpartitioned tables. Declarative Range Partitioning enables partition pruning during queries and instant zero-cost archival via ALTER TABLE DETACH PARTITION instead of destructive DELETE sweeps.',
  },

  // ── Scenario 14: Implicit Type Coercion Disables Index Seek (Junior) ──
  {
    "id": "implicit_type_cast_varchar_to_int",
    "title": "Implicit Type Coercion Disables Index Seek",
    "difficulty": "Junior",
    "category": "data_types",
    "categoryLabel": "Data Types & Type Coercion",
    "tableName": "customers",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.1 GB on disk",
    "slowQuery": "SELECT customer_id, full_name, email, phone_number\nFROM customers\nWHERE phone_number = 14155552671;",
    "initialCost": 215400,
    "initialLatencyMs": 2840,
    "initialPlanSummary": "Seq Scan on customers (cost=0.00..215400.00 rows=1) Filter: ((phone_number)::numeric = 14155552671::numeric)",
    "businessContext": "Customer support hotline lookup by phone number takes 3 seconds. Table has an index on phone_number (VARCHAR), but developers passed a raw integer in the ORM query.",
    "strategies": [
      {
        "id": "strat_cast_string_optimal",
        "title": "Query with String Literal Matching Column Type",
        "sqlCommand": "SELECT customer_id, full_name, email, phone_number FROM customers WHERE phone_number = '14155552671';",
        "isOptimal": true,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan using idx_customers_phone (cost=0.43..4.20 rows=1) -> Exact B-Tree Seek",
        "engineExplanation": "Winner! By matching the VARCHAR column type with a string literal '14155552671', the database eliminates the implicit CAST function and jumps directly to the B-Tree leaf node in 0.8ms."
      },
      {
        "id": "strat_cast_in_where",
        "title": "Explicit Cast on Column in WHERE",
        "sqlCommand": "SELECT customer_id, full_name, email FROM customers WHERE CAST(phone_number AS BIGINT) = 14155552671;",
        "isOptimal": false,
        "resultingCost": 285000,
        "resultingLatencyMs": 3400,
        "executionPlanSummary": "Seq Scan on customers -> Function applied to all 8,000,000 rows",
        "engineExplanation": "Trap! Applying CAST on the column phone_number still requires evaluating the function across every single row in the table, completely blinding the B-Tree index."
      },
      {
        "id": "strat_add_composite_phone_email",
        "title": "Add Composite Index on (phone_number, email)",
        "sqlCommand": "CREATE INDEX idx_cust_phone_email ON customers(phone_number, email);",
        "isOptimal": false,
        "resultingCost": 215400,
        "resultingLatencyMs": 2850,
        "executionPlanSummary": "Seq Scan on customers (Still ignores index due to numeric type conversion)",
        "engineExplanation": "Useless index! Adding more columns to the index does not solve the type mismatch. The engine still cannot seek on a VARCHAR index when given an INT."
      }
    ],
    "keyTakeaway": "Type precedence rules: When comparing string and numeric types, SQL engines convert strings to numbers. Wrapping the column in an implicit conversion prevents B-Tree seek traversal."
  },

  // ── Scenario 15: The Suffix Search Leading Wildcard Trap (Junior) ──
  {
    "id": "like_leading_wildcard_reverse",
    "title": "The Suffix Search Leading Wildcard Trap",
    "difficulty": "Junior",
    "category": "text_search",
    "categoryLabel": "Text Search & Pattern Matching",
    "tableName": "products",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "1.4 GB on disk",
    "slowQuery": "SELECT product_id, sku, name, price\nFROM products\nWHERE sku LIKE '%-PRO-MAX'\nLIMIT 20;",
    "initialCost": 142000,
    "initialLatencyMs": 1850,
    "initialPlanSummary": "Seq Scan on products (cost=0.00..142000.00 rows=20) Filter: (sku ~~ '%-PRO-MAX'::text)",
    "businessContext": "Warehouse inventory app searches products by model suffix. Standard B-Tree index on sku exists but query takes nearly 2 seconds scanning every row.",
    "strategies": [
      {
        "id": "strat_reverse_expression_optimal",
        "title": "Reverse Expression Index with REVERSE()",
        "sqlCommand": "CREATE INDEX idx_products_sku_rev ON products (REVERSE(sku) text_pattern_ops);\n-- Rewrite Query:\nSELECT product_id, sku, name, price FROM products WHERE REVERSE(sku) LIKE REVERSE('%-PRO-MAX') LIMIT 20;",
        "isOptimal": true,
        "resultingCost": 8.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Index Scan using idx_products_sku_rev -> Converts suffix match into prefix seek",
        "engineExplanation": "Genius! REVERSE('%-PRO-MAX') turns into 'XAM-ORP-%'. Because the wildcard is now at the END, the B-Tree can seek to the 'XAM-ORP' prefix directly in 1.2ms!"
      },
      {
        "id": "strat_standard_btree_sku",
        "title": "Standard B-Tree Index on sku",
        "sqlCommand": "CREATE INDEX idx_products_sku ON products(sku);",
        "isOptimal": false,
        "resultingCost": 142000,
        "resultingLatencyMs": 1840,
        "executionPlanSummary": "Seq Scan on products (Ignored B-Tree index due to leading wildcard)",
        "engineExplanation": "B-Tree keys are sorted left-to-right. A leading wildcard '%' means any character can start the string, forcing the engine to inspect every single record."
      },
      {
        "id": "strat_ilike_scan",
        "title": "Use Case-Insensitive ILIKE",
        "sqlCommand": "SELECT product_id, sku, name FROM products WHERE sku ILIKE '%-PRO-MAX' LIMIT 20;",
        "isOptimal": false,
        "resultingCost": 180000,
        "resultingLatencyMs": 2400,
        "executionPlanSummary": "Seq Scan on products -> ILIKE is even slower due to lowercasing overhead",
        "engineExplanation": "Worse! ILIKE does not fix the leading wildcard and adds CPU overhead of lowercase byte comparisons per row."
      }
    ],
    "keyTakeaway": "Standard B-Tree indexes cannot seek with a leading wildcard ('%suffix'). For suffix queries, index REVERSE(col) and query with REVERSE(pattern) to convert suffix into prefix seek."
  },

  // ── Scenario 16: Function Call on Date Column Blinds B-Tree (Junior) ──
  {
    "id": "function_on_indexed_column_date",
    "title": "Function Call on Date Column Blinds B-Tree",
    "difficulty": "Junior",
    "category": "expression_indexes",
    "categoryLabel": "Expression & Functional Indexes",
    "tableName": "user_registrations",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.2 GB on disk",
    "slowQuery": "SELECT user_id, email, created_at\nFROM user_registrations\nWHERE DATE(created_at) = '2026-03-24';",
    "initialCost": 310500,
    "initialLatencyMs": 3950,
    "initialPlanSummary": "Seq Scan on user_registrations (cost=0.00..310500.00) Filter: (date(created_at) = '2026-03-24'::date)",
    "businessContext": "Daily sign-up dashboard runs every morning to calculate yesterday's new registrations. Query scans 12 million rows despite having an index on created_at.",
    "strategies": [
      {
        "id": "strat_half_open_range_optimal",
        "title": "Rewrite to Half-Open Timestamp Range (>= start AND < next_day)",
        "sqlCommand": "SELECT user_id, email, created_at\nFROM user_registrations\nWHERE created_at >= '2026-03-24 00:00:00' \n  AND created_at < '2026-03-25 00:00:00';",
        "isOptimal": true,
        "resultingCost": 14.2,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "Index Scan using idx_registrations_created_at -> B-Tree Range Seek",
        "engineExplanation": "Champion! By rewriting DATE(created_at) into a range query [start, end), the existing B-Tree index on created_at is utilized directly without any schema change or DDL!"
      },
      {
        "id": "strat_functional_index_date",
        "title": "Create Functional Index on DATE(created_at)",
        "sqlCommand": "CREATE INDEX idx_reg_date ON user_registrations(DATE(created_at));",
        "isOptimal": false,
        "resultingCost": 85.0,
        "resultingLatencyMs": 12.0,
        "executionPlanSummary": "Bitmap Index Scan on idx_reg_date (Works, but adds redundant index overhead)",
        "engineExplanation": "Functional index works, but consumes 350 MB extra disk space and slows down every INSERT when a simple query rewrite uses the existing index for free."
      },
      {
        "id": "strat_between_inclusive",
        "title": "Use BETWEEN with 23:59:59",
        "sqlCommand": "SELECT user_id, email FROM user_registrations WHERE created_at BETWEEN '2026-03-24 00:00:00' AND '2026-03-24 23:59:59';",
        "isOptimal": false,
        "resultingCost": 22.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Index Scan -> Accuracy Hazard: Misses sub-second microsecond rows",
        "engineExplanation": "Bug hazard! Timestamps with milliseconds (e.g. 23:59:59.850) will be skipped because they fall after 23:59:59.000. Always use half-open intervals >= and <."
      }
    ],
    "keyTakeaway": "Never wrap indexed columns in functions like DATE(), YEAR(), or UPPER() in the WHERE clause. Always rewrite conditions into range boundaries on the raw column."
  },

  // ── Scenario 17: The Low-Cardinality Flag Index Trap (Junior) ──
  {
    "id": "low_cardinality_boolean_index",
    "title": "The Low-Cardinality Flag Index Trap",
    "difficulty": "Junior",
    "category": "selectivity",
    "categoryLabel": "Index Selectivity & Cardinality",
    "tableName": "accounts",
    "rowCount": "20,000,000 rows",
    "tableSizeDisk": "5.8 GB on disk",
    "slowQuery": "SELECT account_id, balance, email\nFROM accounts\nWHERE is_active = true;",
    "initialCost": 485000,
    "initialLatencyMs": 5200,
    "initialPlanSummary": "Seq Scan on accounts (cost=0.00..485000.00 rows=19600000) Filter: is_active",
    "businessContext": "Fintech platform runs an active user balance check. 98% of all accounts have is_active = true. A junior dev added CREATE INDEX idx_accounts_active ON accounts(is_active) but Postgres refuses to use it.",
    "strategies": [
      {
        "id": "strat_explain_low_cardinality_optimal",
        "title": "Accept Seq Scan for 98% match, or use Partial Index for the 2% Inactive",
        "sqlCommand": "-- For querying inactive accounts (the 2% minority):\nCREATE INDEX idx_inactive_accounts ON accounts(account_id, balance) WHERE is_active = false;\n-- For the 98% active query, sequential scan is mathematically faster than random I/O.",
        "isOptimal": true,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Table scan is optimal for 98% selectivity; Partial index handles the rare 2% subset.",
        "engineExplanation": "Correct! When a query returns 98% of a table, reading through an index would require 19.6 million random page lookups. A sequential scan reads data blocks linearly at NVMe speed. Indexes only help high-selectivity (<5-10%) queries."
      },
      {
        "id": "strat_force_index_scan",
        "title": "Force Index Scan with SET enable_seqscan = off",
        "sqlCommand": "SET enable_seqscan = off; SELECT account_id, balance FROM accounts WHERE is_active = true;",
        "isOptimal": false,
        "resultingCost": 1850000,
        "resultingLatencyMs": 28000,
        "executionPlanSummary": "Index Scan using idx_accounts_active (cost=0.56..1850000.00) -> 5x SLOWER!",
        "engineExplanation": "Catastrophic! Forcing an index scan for 98% of rows turns sequential block reading into millions of random disk seeks, ballooning query latency from 5s to 28s."
      },
      {
        "id": "strat_cluster_table",
        "title": "CLUSTER accounts USING idx_accounts_active",
        "sqlCommand": "CLUSTER accounts USING idx_accounts_active;",
        "isOptimal": false,
        "resultingCost": 350000,
        "resultingLatencyMs": 4100,
        "executionPlanSummary": "Rewrites entire 5.8 GB table on disk with heavy exclusive lock",
        "engineExplanation": "Heavy lock outage: CLUSTER locks the table against all writes for minutes, and order degrades immediately as new records are inserted."
      }
    ],
    "keyTakeaway": "Indexes are designed for high selectivity. If a query matches >20% of a table (like a boolean true on 98% active users), sequential scanning is faster than index page hops."
  },

  // ── Scenario 18: Skipping the Leftmost Prefix in Composite Indexes (Junior) ──
  {
    "id": "composite_index_leftmost_skip",
    "title": "Skipping the Leftmost Prefix in Composite Indexes",
    "difficulty": "Junior",
    "category": "composite_indexing",
    "categoryLabel": "Composite Indexing",
    "tableName": "inventory",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.8 GB on disk",
    "slowQuery": "SELECT item_id, warehouse_id, quantity\nFROM inventory\nWHERE warehouse_id = 42 AND quantity < 10;",
    "initialCost": 265000,
    "initialLatencyMs": 3100,
    "initialPlanSummary": "Seq Scan on inventory (cost=0.00..265000.00) Filter: ((warehouse_id = 42) AND (quantity < 10))",
    "businessContext": "Warehouse replenishment alert checks low stock in warehouse 42. Table has a composite index on (sku, warehouse_id, quantity), yet the query scans the whole table.",
    "strategies": [
      {
        "id": "strat_composite_wh_qty_optimal",
        "title": "Create Index on Filtered Columns: (warehouse_id, quantity)",
        "sqlCommand": "CREATE INDEX idx_inv_wh_qty ON inventory(warehouse_id, quantity) INCLUDE (item_id);",
        "isOptimal": true,
        "resultingCost": 9.4,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Index Only Scan using idx_inv_wh_qty -> Zero Heap Reads",
        "engineExplanation": "Winner! Adheres to Leftmost Prefix: equality on warehouse_id first, followed by range on quantity. INCLUDE eliminates heap table lookups."
      },
      {
        "id": "strat_single_index_qty",
        "title": "Single Column Index on quantity",
        "sqlCommand": "CREATE INDEX idx_inv_qty ON inventory(quantity);",
        "isOptimal": false,
        "resultingCost": 78000,
        "resultingLatencyMs": 950,
        "executionPlanSummary": "Bitmap Index Scan on quantity -> Filter on warehouse_id applied to thousands of rows",
        "engineExplanation": "Sub-optimal. An index on quantity finds all low-stock items across all warehouses worldwide, forcing the engine to filter warehouse_id row-by-row."
      },
      {
        "id": "strat_index_hint_force",
        "title": "Rely on Existing (sku, warehouse_id, quantity) Index",
        "sqlCommand": "/* Query unchanged, hoping database skips sku */",
        "isOptimal": false,
        "resultingCost": 265000,
        "resultingLatencyMs": 3100,
        "executionPlanSummary": "Seq Scan -> Cannot seek B-Tree without leading 'sku' column",
        "engineExplanation": "A composite index B-Tree is ordered by sku first. Without a sku predicate, the index cannot be searched from root to leaf."
      }
    ],
    "keyTakeaway": "Leftmost Prefix Rule: A composite index on (A, B, C) can satisfy queries on (A) or (A, B), but CANNOT be used efficiently for queries filtering only on (B) or (B, C)."
  },

  // ── Scenario 19: Unindexed Foreign Key Causes Cascade Lock Meltdown (Junior) ──
  {
    "id": "unindexed_foreign_key_cascade",
    "title": "Unindexed Foreign Key Causes Cascade Lock Meltdown",
    "difficulty": "Junior",
    "category": "foreign_keys",
    "categoryLabel": "Foreign Keys & Locking",
    "tableName": "order_items",
    "rowCount": "40,000,000 rows",
    "tableSizeDisk": "9.6 GB on disk",
    "slowQuery": "-- Transaction executing on parent table:\nDELETE FROM orders WHERE order_id = 98124;",
    "initialCost": 980000,
    "initialLatencyMs": 11500,
    "initialPlanSummary": "Seq Scan on order_items (cost=0.00..980000.00) Filter: (order_id = 98124) -> Table lock on child table!",
    "businessContext": "Deleting a canceled order in the admin portal freezes database operations for 12 seconds. Every other transaction trying to write to order_items gets blocked.",
    "strategies": [
      {
        "id": "strat_index_foreign_key_optimal",
        "title": "Create Index on Child Foreign Key: order_items(order_id)",
        "sqlCommand": "CREATE INDEX idx_order_items_order_id ON order_items(order_id);",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Scan on order_items using idx_order_items_order_id -> Instant cascade check",
        "engineExplanation": "Essential! Relational databases do NOT automatically index foreign key columns on child tables. Without an index, parent DELETE/UPDATE forces a full sequential scan of 40M child rows with heavy locks."
      },
      {
        "id": "strat_remove_foreign_key",
        "title": "Drop Foreign Key Constraint Completely",
        "sqlCommand": "ALTER TABLE order_items DROP CONSTRAINT fk_order_items_order;",
        "isOptimal": false,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Deletes immediately, but corrupts data integrity with orphaned rows",
        "engineExplanation": "Dangerous anti-pattern! Dropping referential integrity allows orphaned line items when bugs occur, breaking accounting audits."
      },
      {
        "id": "strat_soft_delete_only",
        "title": "Switch to Soft Deletes without FK Index",
        "sqlCommand": "UPDATE orders SET is_deleted = true WHERE order_id = 98124;",
        "isOptimal": false,
        "resultingCost": 8.0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "Evades foreign key cascade on delete, but fails to fix cascade updates or referential checks",
        "engineExplanation": "Band-aid: While it avoids DELETE, any future cascade check or batch purge will still hit a 40M full table scan."
      }
    ],
    "keyTakeaway": "Always index foreign key columns on child tables. Databases automatically index PRIMARY KEYs, but NEVER automatically index FOREIGN KEYs."
  },

  // ── Scenario 20: Slow Full Table Row Counting (Junior) ──
  {
    "id": "count_star_vs_count_column",
    "title": "Slow Full Table Row Counting",
    "difficulty": "Junior",
    "category": "aggregations",
    "categoryLabel": "Aggregations & Group By",
    "tableName": "page_views",
    "rowCount": "50,000,000 rows",
    "tableSizeDisk": "14.2 GB on disk",
    "slowQuery": "SELECT COUNT(session_id)\nFROM page_views\nWHERE site_id = 101;",
    "initialCost": 1250000,
    "initialLatencyMs": 14200,
    "initialPlanSummary": "Seq Scan on page_views (cost=0.00..1250000.00) Filter: (site_id = 101)",
    "businessContext": "Tenant analytics page counts visits for site 101. Loading the dashboard takes 14 seconds scanning 50M rows off disk.",
    "strategies": [
      {
        "id": "strat_covering_count_optimal",
        "title": "Covering Index for Index-Only Count: (site_id, session_id)",
        "sqlCommand": "CREATE INDEX idx_pv_site_sess ON page_views(site_id, session_id);",
        "isOptimal": true,
        "resultingCost": 18.5,
        "resultingLatencyMs": 3.2,
        "executionPlanSummary": "Index Only Scan using idx_pv_site_sess -> Zero table block fetches",
        "engineExplanation": "Winner! By covering both the filter (site_id) and the counted column (session_id), the engine counts index pointers directly without fetching 14 GB of table heap data."
      },
      {
        "id": "strat_single_index_site",
        "title": "Index on site_id only",
        "sqlCommand": "CREATE INDEX idx_pv_site ON page_views(site_id);",
        "isOptimal": false,
        "resultingCost": 185000,
        "resultingLatencyMs": 2400,
        "executionPlanSummary": "Bitmap Heap Scan -> Must fetch table rows to check if session_id IS NOT NULL",
        "engineExplanation": "COUNT(col) ignores NULLs. Because the index only has site_id, the engine must still visit table heap pages to check if session_id is NULL."
      },
      {
        "id": "strat_increase_workmem",
        "title": "Increase work_mem to 1GB",
        "sqlCommand": "SET work_mem = '1GB'; SELECT COUNT(session_id) FROM page_views WHERE site_id = 101;",
        "isOptimal": false,
        "resultingCost": 1250000,
        "resultingLatencyMs": 13900,
        "executionPlanSummary": "Seq Scan -> work_mem has no effect on counting rows without sorting",
        "engineExplanation": "work_mem is used for sorting and hash tables, not for accelerating row counting on table scans."
      }
    ],
    "keyTakeaway": "COUNT(column) requires verifying that the column is NOT NULL. A composite index covering the filter and the target column turns a table scan into a fast index-only count."
  },

  // ── Scenario 21: SELECT * Destroys Index-Only Scan (Junior) ──
  {
    "id": "select_star_heap_fetch",
    "title": "SELECT * Destroys Index-Only Scan",
    "difficulty": "Junior",
    "category": "covering_indexes",
    "categoryLabel": "Covering Indexes & Index-Only Scans",
    "tableName": "members",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.4 GB on disk",
    "slowQuery": "SELECT *\nFROM members\nWHERE status = 'VERIFIED' AND country = 'US'\nORDER BY joined_date DESC\nLIMIT 50;",
    "initialCost": 182000,
    "initialLatencyMs": 2150,
    "initialPlanSummary": "Seq Scan on members -> 45 columns fetched from heap with disk filesort",
    "businessContext": "Member directory API returns 50 latest verified users. Table has 45 wide columns (biography, profile_json, address). Query fetches everything with SELECT *.",
    "strategies": [
      {
        "id": "strat_select_columns_include_optimal",
        "title": "Select Specific Columns with Covering INCLUDE Index",
        "sqlCommand": "CREATE INDEX idx_members_status_country_date ON members(status, country, joined_date DESC)\nINCLUDE (member_id, username, email);\n\n-- Query:\nSELECT member_id, username, email, joined_date\nFROM members\nWHERE status = 'VERIFIED' AND country = 'US'\nORDER BY joined_date DESC\nLIMIT 50;",
        "isOptimal": true,
        "resultingCost": 8.1,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Only Scan using idx_members_status_country_date -> Zero Heap Page Reads",
        "engineExplanation": "Champion! By requesting only the 4 needed columns instead of 45 wide columns, the query is resolved 100% within B-Tree leaf pages without touching the heap table."
      },
      {
        "id": "strat_index_all_columns",
        "title": "Create Index on All 45 Columns",
        "sqlCommand": "CREATE INDEX idx_members_all ON members(status, country, joined_date, username, email, bio, ...);",
        "isOptimal": false,
        "resultingCost": 350000,
        "resultingLatencyMs": 4200,
        "executionPlanSummary": "Exceeds B-Tree maximum index tuple size (2704 bytes limit)",
        "engineExplanation": "Error: B-Tree indexes have strict row size limits (usually 1/3 of a page, ~2704 bytes in Postgres). Indexing wide text columns fails or creates catastrophic write bloat."
      },
      {
        "id": "strat_filter_only_index",
        "title": "Index only (status, country)",
        "sqlCommand": "CREATE INDEX idx_mem_st_co ON members(status, country);",
        "isOptimal": false,
        "resultingCost": 42000,
        "resultingLatencyMs": 480,
        "executionPlanSummary": "Bitmap Heap Scan -> Still requires separate disk filesort for joined_date DESC",
        "engineExplanation": "Without joined_date in the index, the database must retrieve all matching rows and sort them in memory or disk."
      }
    ],
    "keyTakeaway": "SELECT * forces the engine to visit the heap table for every row, disabling Index-Only Scans. Explicit column selection combined with INCLUDE enables sub-millisecond execution."
  },

  // ── Scenario 22: Mixed Direction Sort Filesort Penalty (Junior) ──
  {
    "id": "orderby_asc_desc_composite",
    "title": "Mixed Direction Sort Filesort Penalty",
    "difficulty": "Junior",
    "category": "sorting",
    "categoryLabel": "Multi-Column Sorting",
    "tableName": "leaderboard",
    "rowCount": "6,000,000 rows",
    "tableSizeDisk": "1.8 GB on disk",
    "slowQuery": "SELECT user_id, score, submission_time\nFROM leaderboard\nORDER BY score DESC, submission_time ASC\nLIMIT 25;",
    "initialCost": 154000,
    "initialLatencyMs": 1920,
    "initialPlanSummary": "Seq Scan on leaderboard -> Sort: External Merge Disk (score DESC, submission_time ASC)",
    "businessContext": "Gaming platform leaderboard displays highest score first, with ties broken by earliest submission time. Sorting 6 million rows causes CPU spikes on every page load.",
    "strategies": [
      {
        "id": "strat_matching_direction_index_optimal",
        "title": "Composite Index with Matching Direction: (score DESC, submission_time ASC)",
        "sqlCommand": "CREATE INDEX idx_leaderboard_score_time ON leaderboard(score DESC, submission_time ASC);",
        "isOptimal": true,
        "resultingCost": 5.2,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan using idx_leaderboard_score_time -> Zero Sorting Overhead",
        "engineExplanation": "Winner! Standard B-Trees can only be scanned forward (ASC, ASC) or backward (DESC, DESC). When sorting directions are mixed (DESC, ASC), the index definition MUST explicitly declare matching column directions."
      },
      {
        "id": "strat_default_asc_index",
        "title": "Default Composite Index: (score, submission_time)",
        "sqlCommand": "CREATE INDEX idx_lb_default ON leaderboard(score, submission_time);",
        "isOptimal": false,
        "resultingCost": 128000,
        "resultingLatencyMs": 1550,
        "executionPlanSummary": "Index Scan -> Sort: External Disk Merge (Cannot traverse mixed directions)",
        "engineExplanation": "Trap! Default indexes are (ASC, ASC). Scanning backward gives (DESC, DESC). The engine cannot walk backward on score while walking forward on submission_time."
      },
      {
        "id": "strat_increase_sort_buffer",
        "title": "Increase sort_buffer_size to 64MB",
        "sqlCommand": "SET sort_buffer_size = 67108864; SELECT ... FROM leaderboard ...",
        "isOptimal": false,
        "resultingCost": 98000,
        "resultingLatencyMs": 1100,
        "executionPlanSummary": "In-Memory Quicksort instead of disk spill, but still sorts 6M rows",
        "engineExplanation": "Band-aid: Memory quicksort is faster than disk merge, but wasting CPU cycles sorting 6M rows on every page refresh exhausts server capacity."
      }
    ],
    "keyTakeaway": "B-Tree indexes can scan forward (A ASC, B ASC) or reverse (A DESC, B DESC). Queries with mixed directions (A DESC, B ASC) require an index declared with those exact sort directions."
  },

  // ── Scenario 23: Redundant Indexes Cripple Write Throughput (Junior) ──
  {
    "id": "redundant_index_overhead",
    "title": "Redundant Indexes Cripple Write Throughput",
    "difficulty": "Junior",
    "category": "index_maintenance",
    "categoryLabel": "Index Maintenance & Bloat",
    "tableName": "payments",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "5.2 GB on disk",
    "slowQuery": "-- High-frequency payment insertion:\nINSERT INTO payments (payment_id, user_id, amount, status, created_at)\nVALUES (994821, 1042, 150.00, 'COMPLETED', NOW());",
    "initialCost": 85.0,
    "initialLatencyMs": 84,
    "initialPlanSummary": "Insert into payments -> Updating 8 secondary B-Tree indexes! (High I/O write amplification)",
    "businessContext": "Payment processing throughput degraded to 15 writes/sec. DBA audit discovered 8 overlapping indexes: (user_id), (user_id, status), (user_id, status, created_at), (status), etc.",
    "strategies": [
      {
        "id": "strat_consolidate_indexes_optimal",
        "title": "Drop Redundant Prefix Indexes, Keep Master Composite",
        "sqlCommand": "-- Drop redundant prefix indexes:\nDROP INDEX idx_payments_user_id;\nDROP INDEX idx_payments_user_status;\n-- Retain the covering composite:\n-- idx_payments_user_status_created (user_id, status, created_at) covers all three!",
        "isOptimal": true,
        "resultingCost": 8.0,
        "resultingLatencyMs": 2.1,
        "executionPlanSummary": "Insert write latency drops from 84ms to 2.1ms (75% less index updates)",
        "engineExplanation": "Champion! Because (user_id, status, created_at) already has (user_id) and (user_id, status) as leftmost prefixes, maintaining the separate single-column indexes was 100% redundant write overhead."
      },
      {
        "id": "strat_delay_index_maintenance",
        "title": "Drop Indexes Before Batch and Recreate",
        "sqlCommand": "DROP ALL INDEXES; INSERT ...; RECREATE INDEXES;",
        "isOptimal": false,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Invalid for OLTP live customer payments! Locks production tables.",
        "engineExplanation": "Dangerous: Dropping indexes works for bulk data warehouse loading, but in live 24/7 payment processing, read queries would immediately time out with table scans."
      },
      {
        "id": "strat_increase_wal_buffers",
        "title": "Increase wal_buffers to 64MB",
        "sqlCommand": "ALTER SYSTEM SET wal_buffers = '64MB';",
        "isOptimal": false,
        "resultingCost": 80.0,
        "resultingLatencyMs": 78,
        "executionPlanSummary": "Minor I/O smoothing, but does not solve 8 B-Tree leaf page splits per insert",
        "engineExplanation": "Increasing WAL buffers helps buffer spikes, but does not eliminate the physical CPU and disk cost of updating 8 separate index trees on every insert."
      }
    ],
    "keyTakeaway": "An index on (A, B, C) already provides an index on (A) and (A, B). Storing redundant sub-prefix indexes wastes gigabytes of RAM and throttles INSERT/UPDATE speeds."
  },

  // ── Scenario 24: Sparse NULL Lookup in 10M Row Table (Junior) ──
  {
    "id": "is_null_partial_index",
    "title": "Sparse NULL Lookup in 10M Row Table",
    "difficulty": "Junior",
    "category": "partial_indexes",
    "categoryLabel": "Partial & Filtered Indexes",
    "tableName": "shipments",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "3.4 GB on disk",
    "slowQuery": "SELECT shipment_id, tracking_number, destination\nFROM shipments\nWHERE delivered_at IS NULL;",
    "initialCost": 245000,
    "initialLatencyMs": 2900,
    "initialPlanSummary": "Seq Scan on shipments (cost=0.00..245000.00 rows=50000) Filter: (delivered_at IS NULL)",
    "businessContext": "Delivery dispatcher monitors active in-flight packages. 99.5% of packages are delivered (delivered_at is NOT NULL). Only 50,000 packages (0.5%) are in transit.",
    "strategies": [
      {
        "id": "strat_partial_is_null_optimal",
        "title": "Create Partial Index for In-Flight Shipments: WHERE delivered_at IS NULL",
        "sqlCommand": "CREATE INDEX idx_shipments_in_flight ON shipments(shipment_id, tracking_number, destination) WHERE delivered_at IS NULL;",
        "isOptimal": true,
        "resultingCost": 12.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Index Only Scan using idx_shipments_in_flight -> 4 MB tiny index",
        "engineExplanation": "Masterclass! Instead of indexing all 10 million rows (300 MB), the partial index stores ONLY the 50,000 in-flight records. The index fits entirely in 4 MB of L3 CPU cache!"
      },
      {
        "id": "strat_btree_full_delivered",
        "title": "Full B-Tree Index on delivered_at",
        "sqlCommand": "CREATE INDEX idx_shipments_delivered_at ON shipments(delivered_at);",
        "isOptimal": false,
        "resultingCost": 4800,
        "resultingLatencyMs": 65,
        "executionPlanSummary": "Bitmap Heap Scan on shipments (Indexes 9.95M delivered rows needlessly)",
        "engineExplanation": "Wasteful: A full B-tree indexes 9,950,000 rows that are never queried by this endpoint, consuming 300MB of RAM and slowing down every delivery confirmation update."
      },
      {
        "id": "strat_not_null_default",
        "title": "Set Default Timestamp to '1970-01-01' instead of NULL",
        "sqlCommand": "UPDATE shipments SET delivered_at = '1970-01-01' WHERE delivered_at IS NULL;",
        "isOptimal": false,
        "resultingCost": 245000,
        "resultingLatencyMs": 2900,
        "executionPlanSummary": "Still full table scan without index, and corrupts domain semantics",
        "engineExplanation": "Anti-pattern: Magic sentinel dates break business logic and do not improve query performance without an index."
      }
    ],
    "keyTakeaway": "When searching for rare NULL values (e.g. unfinished tasks, in-transit items), create a Partial Index with WHERE col IS NULL. It creates a featherweight index that updates at lightning speed."
  },

  // ── Scenario 25: Arithmetic Operations on Columns in WHERE Clause (Junior) ──
  {
    "id": "math_expression_in_where",
    "title": "Arithmetic Operations on Columns in WHERE Clause",
    "difficulty": "Junior",
    "category": "expression_indexes",
    "categoryLabel": "Expression & Functional Indexes",
    "tableName": "invoices",
    "rowCount": "7,000,000 rows",
    "tableSizeDisk": "2.1 GB on disk",
    "slowQuery": "SELECT invoice_id, customer_id, amount\nFROM invoices\nWHERE amount * 1.10 > 500.00;",
    "initialCost": 185000,
    "initialLatencyMs": 2200,
    "initialPlanSummary": "Seq Scan on invoices (cost=0.00..185000.00) Filter: ((amount * 1.10) > 500.00)",
    "businessContext": "Billing service queries high-value transactions including sales tax. Table has an index on amount, but the query multiplies by 1.10 on the left-hand side.",
    "strategies": [
      {
        "id": "strat_algebraic_isolation_optimal",
        "title": "Isolate the Column Algebraically: amount > (500.00 / 1.10)",
        "sqlCommand": "SELECT invoice_id, customer_id, amount\nFROM invoices\nWHERE amount > (500.00 / 1.10);",
        "isOptimal": true,
        "resultingCost": 9.2,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Index Scan using idx_invoices_amount -> Pure B-Tree Range Seek",
        "engineExplanation": "Winner! By dividing 500.00 by 1.10 on the right side, the math is evaluated ONCE as a constant (454.54). The unadorned column 'amount' can now perform an instant B-Tree index seek."
      },
      {
        "id": "strat_expression_index_tax",
        "title": "Create Expression Index: ((amount * 1.10))",
        "sqlCommand": "CREATE INDEX idx_inv_amount_tax ON invoices((amount * 1.10));",
        "isOptimal": false,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.6,
        "executionPlanSummary": "Index Scan on idx_inv_amount_tax (Adds unnecessary DDL & index maintenance)",
        "engineExplanation": "Overkill: Adding a dedicated expression index consumes 180MB of disk and slows down invoice creation when a 5-second SQL rewrite achieves the exact same 1ms speed."
      },
      {
        "id": "strat_cast_float",
        "title": "Cast to FLOAT",
        "sqlCommand": "SELECT invoice_id, customer_id, amount FROM invoices WHERE (amount::float * 1.10) > 500.00;",
        "isOptimal": false,
        "resultingCost": 195000,
        "resultingLatencyMs": 2350,
        "executionPlanSummary": "Seq Scan -> Still evaluates arithmetic per row",
        "engineExplanation": "Casting does not isolate the column from the multiplication operator."
      }
    ],
    "keyTakeaway": "Always keep indexed columns 'naked' in WHERE clauses. Move arithmetic operations, constants, and functions to the right-hand side so the query planner evaluates them once as a constant."
  },

  // ── Scenario 26: Massive IN (...) Clause with 5,000 Elements (Junior) ──
  {
    "id": "in_clause_vs_equality_chain",
    "title": "Massive IN (...) Clause with 5,000 Elements",
    "difficulty": "Junior",
    "category": "query_rewrites",
    "categoryLabel": "Query Rewrites & Predicates",
    "tableName": "products",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.5 GB on disk",
    "slowQuery": "SELECT product_id, title, price\nFROM products\nWHERE category_id IN (1, 2, 3, ... 5000 ids passed from API);",
    "initialCost": 420000,
    "initialLatencyMs": 6800,
    "initialPlanSummary": "Bitmap Heap Scan with 5000 Index Scans -> Optimizer parses 2MB SQL text string",
    "businessContext": "E-commerce search passes 5,000 category IDs into an IN clause generated by application code. Database parser chokes and planner execution spikes CPU to 100%.",
    "strategies": [
      {
        "id": "strat_inner_join_temp_optimal",
        "title": "Rewrite to JOIN with VALUES or Temporary Array: = ANY(ARRAY[...])",
        "sqlCommand": "SELECT p.product_id, p.title, p.price\nFROM products p\nJOIN unnest($1::int[]) AS c(category_id) ON p.category_id = c.category_id;\n-- Or in Postgres: WHERE category_id = ANY($1::int[])",
        "isOptimal": true,
        "resultingCost": 35.0,
        "resultingLatencyMs": 4.2,
        "executionPlanSummary": "Hash Join with unnest(ARRAY) -> Fast single parameterized query",
        "engineExplanation": "Champion! Passing an array parameter with ANY() or UNNEST() allows the optimizer to perform an efficient Hash Join or batch index lookup without bloating SQL parse trees with 5,000 AST nodes."
      },
      {
        "id": "strat_split_individual_queries",
        "title": "Loop and Execute 5,000 Individual Single Queries",
        "sqlCommand": "for id in ids: SELECT ... WHERE category_id = id",
        "isOptimal": false,
        "resultingCost": 15000,
        "resultingLatencyMs": 9500,
        "executionPlanSummary": "5,000 Network Roundtrips (N+1 query disaster)",
        "engineExplanation": "Terrible! 5,000 individual queries incur 5,000 network round-trips, turning a 6-second query into a 10-second latency nightmare."
      },
      {
        "id": "strat_or_chain",
        "title": "Convert IN to OR chain: category_id = 1 OR category_id = 2...",
        "sqlCommand": "SELECT ... WHERE category_id = 1 OR category_id = 2 ...",
        "isOptimal": false,
        "resultingCost": 450000,
        "resultingLatencyMs": 7200,
        "executionPlanSummary": "OR chain is syntactically equivalent to IN, but slower to parse",
        "engineExplanation": "OR chains have higher parsing complexity and force the optimizer to perform identical Bitmap OR scans."
      }
    ],
    "keyTakeaway": "Avoid generating massive IN clauses with thousands of literals. Pass arrays with ANY(ARRAY[...]) or JOIN against UNNEST() to keep execution plans lean and parameterized."
  },

  // ── Scenario 27: Random UUID v4 B-Tree Page Split Thrashing (Junior) ──
  {
    "id": "uuid_v4_vs_uuid_v7_fragmentation",
    "title": "Random UUID v4 B-Tree Page Split Thrashing",
    "difficulty": "Junior",
    "category": "primary_keys",
    "categoryLabel": "Primary Key Design & Storage",
    "tableName": "event_log",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "8.4 GB on disk",
    "slowQuery": "-- High throughput event ingestion:\nINSERT INTO event_log (id, event_type, payload, created_at)\nVALUES (gen_random_uuid(), 'CLICK', '{\"button\": \"buy\"}', NOW());",
    "initialCost": 95.0,
    "initialLatencyMs": 68,
    "initialPlanSummary": "Insert into event_log -> Random B-Tree Page Splits on Primary Key",
    "businessContext": "High-scale analytics ingestion: As table crossed 20 million rows, INSERT latency spiked from 1ms to 68ms. Buffer pool hit ratio plummeted from 99% to 64%.",
    "strategies": [
      {
        "id": "strat_uuid_v7_monotonic_optimal",
        "title": "Switch to Time-Sorted Monotonic UUID v7 or BIGSERIAL",
        "sqlCommand": "-- Use UUID v7 (Time-prefixed UUID) or BIGINT IDENTITY:\nALTER TABLE event_log ALTER COLUMN id SET DEFAULT uuid_generate_v7();\n-- Inserts append strictly to rightmost B-Tree leaf pages!",
        "isOptimal": true,
        "resultingCost": 4.0,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Append-only leaf page inserts -> 0% random page splits, 99.8% Buffer Pool Hit",
        "engineExplanation": "Winner! Random UUID v4 scatters inserts uniformly across all 500,000 index leaf pages. Because all pages cannot fit in RAM, every insert triggers random disk reads and leaf page splits. UUID v7 is monotonically increasing, appending sequentially to the rightmost leaf."
      },
      {
        "id": "strat_increase_buffer_pool",
        "title": "Double shared_buffers / innodb_buffer_pool_size",
        "sqlCommand": "SET shared_buffers = '32GB';",
        "isOptimal": false,
        "resultingCost": 60.0,
        "resultingLatencyMs": 42,
        "executionPlanSummary": "Temporarily delays page thrashing, but fails as data continues growing",
        "engineExplanation": "Expensive hardware band-aid: As soon as table size exceeds the new RAM allocation, random I/O thrashing immediately returns."
      },
      {
        "id": "strat_hash_index_pk",
        "title": "Replace B-Tree with Hash Index on Primary Key",
        "sqlCommand": "CREATE INDEX idx_event_hash ON event_log USING HASH(id);",
        "isOptimal": false,
        "resultingCost": 50.0,
        "resultingLatencyMs": 35,
        "executionPlanSummary": "Hash indexes cannot enforce PRIMARY KEY constraints or support range scans",
        "engineExplanation": "Invalid in most engines: Primary keys require B-Tree indexes. Furthermore, hash indexes still suffer random distribution without clustering benefits."
      }
    ],
    "keyTakeaway": "Random UUID v4 values destroy B-Tree cache locality by forcing random page splits across the entire index tree. Always use time-ordered identifiers (UUID v7, TSID, or BIGINT) for primary keys."
  },

  // ── Scenario 28: Blank-Padded CHAR(255) Space Bloat (Junior) ──
  {
    "id": "char_vs_varchar_padding",
    "title": "Blank-Padded CHAR(255) Space Bloat",
    "difficulty": "Junior",
    "category": "data_types",
    "categoryLabel": "Data Types & Storage",
    "tableName": "countries",
    "rowCount": "2,000,000 rows",
    "tableSizeDisk": "1.2 GB on disk",
    "slowQuery": "SELECT country_code, country_name\nFROM countries\nWHERE country_code = 'US';",
    "initialCost": 38000,
    "initialLatencyMs": 420,
    "initialPlanSummary": "Seq Scan on countries -> Table size is 1.2 GB despite having only 2M small rows",
    "businessContext": "Schema design flaw: country_code was declared as CHAR(255) instead of CHAR(2) or VARCHAR(2). The database blank-pads every row with 253 trailing spaces.",
    "strategies": [
      {
        "id": "strat_alter_column_varchar_optimal",
        "title": "Alter Column to CHAR(2) and Add Index",
        "sqlCommand": "ALTER TABLE countries ALTER COLUMN country_code TYPE VARCHAR(2);\nCREATE INDEX idx_countries_code ON countries(country_code);",
        "isOptimal": true,
        "resultingCost": 3.5,
        "resultingLatencyMs": 0.6,
        "executionPlanSummary": "Index Scan using idx_countries_code -> Table shrinks from 1.2 GB to 48 MB",
        "engineExplanation": "Champion! CHAR(255) reserves 255 bytes per row regardless of string length. Changing to VARCHAR(2) shrinks table disk size by 96%, fitting the entire table into CPU cache in 0.6ms."
      },
      {
        "id": "strat_trim_in_where",
        "title": "Use TRIM(country_code) = 'US'",
        "sqlCommand": "SELECT * FROM countries WHERE TRIM(country_code) = 'US';",
        "isOptimal": false,
        "resultingCost": 45000,
        "resultingLatencyMs": 580,
        "executionPlanSummary": "Seq Scan with TRIM function overhead per row",
        "engineExplanation": "Makes it worse! Wrapping the column in TRIM() prevents index usage and burns CPU stripping whitespace."
      },
      {
        "id": "strat_compress_table",
        "title": "Enable TOAST / ROW_FORMAT=COMPRESSED",
        "sqlCommand": "ALTER TABLE countries ROW_FORMAT=COMPRESSED;",
        "isOptimal": false,
        "resultingCost": 15000,
        "resultingLatencyMs": 180,
        "executionPlanSummary": "Table compression adds CPU decompression penalty on every read",
        "engineExplanation": "Fixing the wrong layer: Compressing bad schema types introduces CPU compression overhead instead of fixing the 253-byte space waste."
      }
    ],
    "keyTakeaway": "Fixed-width CHAR(N) pads strings with whitespace up to length N. Use CHAR only for strictly fixed-length codes (e.g. CHAR(2) for ISO country codes); use VARCHAR for variable text."
  },

  // ── Scenario 29: Shallow vs Deep Pagination Pitfall (Junior) ──
  {
    "id": "limit_offset_shallow_vs_deep",
    "title": "Shallow vs Deep Pagination Pitfall",
    "difficulty": "Junior",
    "category": "pagination",
    "categoryLabel": "Pagination & Offset",
    "tableName": "blog_posts",
    "rowCount": "500,000 rows",
    "tableSizeDisk": "180 MB on disk",
    "slowQuery": "SELECT post_id, title, published_at\nFROM blog_posts\nORDER BY published_at DESC\nLIMIT 10 OFFSET 0;",
    "initialCost": 18500,
    "initialLatencyMs": 145,
    "initialPlanSummary": "Seq Scan on blog_posts -> Sort: published_at DESC -> Limit 10",
    "businessContext": "Blog homepage displays the 10 most recent articles. Even with OFFSET 0, loading the homepage takes 145ms because the engine performs a full table scan and filesort.",
    "strategies": [
      {
        "id": "strat_index_published_at_optimal",
        "title": "Create Index on (published_at DESC) with Covering Columns",
        "sqlCommand": "CREATE INDEX idx_blog_published ON blog_posts(published_at DESC) INCLUDE (title, post_id);",
        "isOptimal": true,
        "resultingCost": 3.1,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Index Only Scan using idx_blog_published -> Fetches top 10 index leaf entries in 0.5ms",
        "engineExplanation": "Winner! An index on published_at DESC stores rows pre-sorted. The engine reads exactly 10 index leaf records from the top and stops immediately with zero sorting."
      },
      {
        "id": "strat_keyset_for_offset_0",
        "title": "Rewrite to Keyset Pagination for Page 1",
        "sqlCommand": "SELECT post_id, title FROM blog_posts WHERE post_id > 0 LIMIT 10;",
        "isOptimal": false,
        "resultingCost": 14000,
        "resultingLatencyMs": 110,
        "executionPlanSummary": "Returns arbitrary 10 IDs without sorting by publication date",
        "engineExplanation": "Breaks business logic: Keyset pagination on post_id does not return the latest published articles."
      },
      {
        "id": "strat_subquery_limit",
        "title": "Wrap in Subquery with LIMIT",
        "sqlCommand": "SELECT * FROM (SELECT * FROM blog_posts) b ORDER BY b.published_at DESC LIMIT 10;",
        "isOptimal": false,
        "resultingCost": 22000,
        "resultingLatencyMs": 180,
        "executionPlanSummary": "Subquery scan still requires full table scan and filesort",
        "engineExplanation": "Syntactic illusion: Wrapping a full table scan in a subquery does not create an index."
      }
    ],
    "keyTakeaway": "Even for OFFSET 0, an ORDER BY clause without an index forces the database to sort the entire table in memory or disk. A matching B-Tree index satisfies ORDER BY ... LIMIT in sub-millisecond time."
  },

  // ── Scenario 30: Unbounded Text Index Exceeds Maximum Index Length (Junior) ──
  {
    "id": "text_prefix_index_length",
    "title": "Unbounded Text Index Exceeds Maximum Index Length",
    "difficulty": "Junior",
    "category": "prefix_indexes",
    "categoryLabel": "Index Size & Prefix Compression",
    "tableName": "web_bookmarks",
    "rowCount": "4,000,000 rows",
    "tableSizeDisk": "1.8 GB on disk",
    "slowQuery": "SELECT bookmark_id, url, user_id\nFROM web_bookmarks\nWHERE url = 'https://engineering.google.com/deepmind/article/transformer-scaling-laws';",
    "initialCost": 92000,
    "initialLatencyMs": 1150,
    "initialPlanSummary": "Seq Scan on web_bookmarks Filter: (url = '...')",
    "businessContext": "Bookmarking tool looks up saved URLs. Trying to run CREATE INDEX on url (VARCHAR(2048)) throws Error 1071: Specified key was too long; max key length is 3072 bytes (or bloats index to 1.5 GB).",
    "strategies": [
      {
        "id": "strat_url_hash_generated_column_optimal",
        "title": "Generated SHA256 Column with Unique Index",
        "sqlCommand": "-- Add deterministic hash column:\nALTER TABLE web_bookmarks ADD COLUMN url_hash BYTEA \nGENERATED ALWAYS AS (digest(url, 'sha256')) STORED;\n\nCREATE INDEX idx_bookmarks_url_hash ON web_bookmarks(url_hash);\n\n-- Query:\nSELECT bookmark_id, url, user_id FROM web_bookmarks \nWHERE url_hash = digest('https://engineering.google.com/...', 'sha256') \n  AND url = 'https://engineering.google.com/...';",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan using idx_bookmarks_url_hash -> 32-byte exact hash seek with verification",
        "engineExplanation": "Brilliant! Instead of indexing variable-length 2KB strings, indexing a 32-byte binary SHA-256 hash keeps the B-Tree ultra-compact, lightning fast, and immune to index key length limits."
      },
      {
        "id": "strat_prefix_index_mysql",
        "title": "MySQL Prefix Index: url(255)",
        "sqlCommand": "CREATE INDEX idx_url_prefix ON web_bookmarks(url(255));",
        "isOptimal": false,
        "resultingCost": 1500,
        "resultingLatencyMs": 85,
        "executionPlanSummary": "Index Scan on prefix -> Cannot be used for covering index or exact sort",
        "engineExplanation": "Partial solution: Prefix indexes cannot be used for index-only scans, and URLs sharing identical long domain prefixes degrade to leaf scans."
      },
      {
        "id": "strat_fulltext_index_url",
        "title": "Fulltext Search Index on url",
        "sqlCommand": "CREATE FULLTEXT INDEX idx_url_ft ON web_bookmarks(url);",
        "isOptimal": false,
        "resultingCost": 12000,
        "resultingLatencyMs": 140,
        "executionPlanSummary": "Fulltext Index Parse -> Tokenizes URL on punctuation, causing false positives",
        "engineExplanation": "Fulltext indexes split on slashes and dots, breaking exact URL lookup semantics."
      }
    ],
    "keyTakeaway": "Never index long text columns (URLs, payloads) directly. Store a deterministic cryptographic hash (MD5 or SHA256) in a generated column and index the compact hash for instant equality seeks."
  },

  // ── Scenario 31: OR Filter Across Columns Triggers Table Scan (Junior) ──
  {
    "id": "or_filter_index_merge_failure",
    "title": "OR Filter Across Columns Triggers Table Scan",
    "difficulty": "Junior",
    "category": "or_conditions",
    "categoryLabel": "OR Expansion & Union",
    "tableName": "users",
    "rowCount": "6,000,000 rows",
    "tableSizeDisk": "1.6 GB on disk",
    "slowQuery": "SELECT user_id, username, email, phone\nFROM users\nWHERE email = 'alex@example.com' OR phone = '+14155550199';",
    "initialCost": 145000,
    "initialLatencyMs": 1780,
    "initialPlanSummary": "Seq Scan on users (cost=0.00..145000.00) Filter: ((email = '...') OR (phone = '...'))",
    "businessContext": "Login API accepts either email or phone number. Indexes exist on email and on phone separately, but the database chooses a full table scan.",
    "strategies": [
      {
        "id": "strat_union_all_rewrite_optimal",
        "title": "Rewrite OR into UNION ALL with Unique Seek",
        "sqlCommand": "SELECT user_id, username, email, phone FROM users WHERE email = 'alex@example.com'\nUNION ALL\nSELECT user_id, username, email, phone FROM users WHERE phone = '+14155550199' AND email <> 'alex@example.com';",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Append -> 2x Index Scans using idx_users_email and idx_users_phone",
        "engineExplanation": "Winner! An OR condition across two different columns prevents single B-Tree seeks. UNION ALL allows each branch to perform an independent, instant index seek on its respective column."
      },
      {
        "id": "strat_composite_email_phone",
        "title": "Composite Index on (email, phone)",
        "sqlCommand": "CREATE INDEX idx_users_email_phone ON users(email, phone);",
        "isOptimal": false,
        "resultingCost": 145000,
        "resultingLatencyMs": 1780,
        "executionPlanSummary": "Seq Scan on users (Composite index cannot seek on second column when first is missing)",
        "engineExplanation": "Trap! If a user logs in with phone only, the leftmost column (email) is missing, rendering the composite index unusable for the phone half."
      },
      {
        "id": "strat_enable_bitmap_scan",
        "title": "Rely on Postgres BitmapOr Index Merge",
        "sqlCommand": "/* Keep query as is, relying on BitmapOr */",
        "isOptimal": false,
        "resultingCost": 850,
        "resultingLatencyMs": 45,
        "executionPlanSummary": "BitmapOr on idx_email, idx_phone -> Bitmap Heap Scan",
        "engineExplanation": "BitmapOr is much better than a Seq Scan, but still 40x slower than a direct UNION ALL index seek because it must construct in-memory bitmap pages."
      }
    ],
    "keyTakeaway": "An OR filter across different columns (colA = X OR colB = Y) prevents single index seeks. Rewriting to UNION ALL allows the optimizer to execute two independent sub-millisecond index seeks."
  },

  // ── Scenario 32: The BETWEEN 23:59:59 Microsecond Data Leak (Junior) ──
  {
    "id": "between_timestamp_inclusive",
    "title": "The BETWEEN 23:59:59 Microsecond Data Leak",
    "difficulty": "Junior",
    "category": "range_queries",
    "categoryLabel": "Range Queries & Boundaries",
    "tableName": "financial_ledger",
    "rowCount": "14,000,000 rows",
    "tableSizeDisk": "4.1 GB on disk",
    "slowQuery": "SELECT transaction_id, account_id, amount, posted_at\nFROM financial_ledger\nWHERE posted_at BETWEEN '2026-03-01 00:00:00' AND '2026-03-31 23:59:59';",
    "initialCost": 85000,
    "initialLatencyMs": 1100,
    "initialPlanSummary": "Index Scan using idx_ledger_posted_at -> High execution time & Data Discrepancy",
    "businessContext": "Monthly accounting close query: Auditors discover that $142,000 worth of transactions posted at 23:59:59.450 on March 31st are missing from the balance sheet!",
    "strategies": [
      {
        "id": "strat_half_open_bounds_optimal",
        "title": "Half-Open Range: >= '2026-03-01' AND < '2026-04-01'",
        "sqlCommand": "SELECT transaction_id, account_id, amount, posted_at\nFROM financial_ledger\nWHERE posted_at >= '2026-03-01 00:00:00' \n  AND posted_at < '2026-04-01 00:00:00';",
        "isOptimal": true,
        "resultingCost": 18.2,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Scan using idx_ledger_posted_at -> 100% Accurate & Zero Microsecond Loss",
        "engineExplanation": "Gold Standard! The half-open interval [start, next_start) captures every transaction right up to 23:59:59.999999 without relying on arbitrary precision seconds."
      },
      {
        "id": "strat_cast_date_trunc",
        "title": "Use date_trunc('month', posted_at)",
        "sqlCommand": "SELECT * FROM financial_ledger WHERE date_trunc('month', posted_at) = '2026-03-01';",
        "isOptimal": false,
        "resultingCost": 350000,
        "resultingLatencyMs": 4800,
        "executionPlanSummary": "Seq Scan on financial_ledger (Function disables B-Tree range seek)",
        "engineExplanation": "Crashes performance: Wrapping posted_at in date_trunc() forces a full sequential scan across 14 million rows."
      },
      {
        "id": "strat_between_with_nanos",
        "title": "Use BETWEEN '2026-03-31 23:59:59.999999'",
        "sqlCommand": "WHERE posted_at BETWEEN '2026-03-01' AND '2026-03-31 23:59:59.999999'",
        "isOptimal": false,
        "resultingCost": 22.0,
        "resultingLatencyMs": 3.8,
        "executionPlanSummary": "Index Scan -> Brittle: Breaks if timestamp precision changes from 6 to 9 digits",
        "engineExplanation": "Brittle: In MySQL or SQL Server, rounding rules can cause 23:59:59.999 to round UP to the next month's 00:00:00.000, accidentally including next month's records."
      }
    ],
    "keyTakeaway": "Never use BETWEEN for date/timestamp intervals. BETWEEN is inclusive and drops sub-second records. Always use half-open intervals: col >= start AND col < next_start."
  },

  // ── Scenario 33: LOWER() Function on Username Prevents Unique Index Seek (Junior) ──
  {
    "id": "case_insensitive_collation",
    "title": "LOWER() Function on Username Prevents Unique Index Seek",
    "difficulty": "Junior",
    "category": "collation",
    "categoryLabel": "Collation & Case Sensitivity",
    "tableName": "auth_users",
    "rowCount": "9,000,000 rows",
    "tableSizeDisk": "2.3 GB on disk",
    "slowQuery": "SELECT user_id, password_hash\nFROM auth_users\nWHERE LOWER(username) = LOWER('JohnDoe_Admin');",
    "initialCost": 195000,
    "initialLatencyMs": 2400,
    "initialPlanSummary": "Seq Scan on auth_users (cost=0.00..195000.00) Filter: (lower(username) = 'johndoe_admin'::text)",
    "businessContext": "Login authentication check verifies username case-insensitively. Table has an index on username, but LOWER() causes a 2.4-second delay on every single login attempt.",
    "strategies": [
      {
        "id": "strat_functional_lower_optimal",
        "title": "Functional Index on LOWER(username) or CITEXT data type",
        "sqlCommand": "CREATE UNIQUE INDEX idx_users_username_lower ON auth_users(LOWER(username));\n-- Query:\nSELECT user_id, password_hash FROM auth_users WHERE LOWER(username) = 'johndoe_admin';",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan using idx_users_username_lower -> Instant unique B-Tree seek in 0.7ms",
        "engineExplanation": "Winner! An expression index on LOWER(username) indexes the pre-lowercased string, resolving login checks in 0.7ms while enforcing case-insensitive uniqueness."
      },
      {
        "id": "strat_remove_lower",
        "title": "Remove LOWER() from Query",
        "sqlCommand": "SELECT user_id, password_hash FROM auth_users WHERE username = 'JohnDoe_Admin';",
        "isOptimal": false,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan, but FAILS case-insensitivity requirements",
        "engineExplanation": "Breaks business requirements: If the user registered as 'johndoe_admin', logging in with 'JohnDoe_Admin' will return 0 rows under case-sensitive collations."
      },
      {
        "id": "strat_ilike_username",
        "title": "Use ILIKE operator",
        "sqlCommand": "SELECT user_id, password_hash FROM auth_users WHERE username ILIKE 'JohnDoe_Admin';",
        "isOptimal": false,
        "resultingCost": 195000,
        "resultingLatencyMs": 2500,
        "executionPlanSummary": "Seq Scan on auth_users -> ILIKE does not use standard B-Tree index",
        "engineExplanation": "ILIKE without pg_trgm cannot use a standard B-Tree index and results in a full table scan."
      }
    ],
    "keyTakeaway": "Standard B-Tree indexes are case-sensitive. To support case-insensitive lookups, either create an expression index on LOWER(col) or use a case-insensitive collation (CITEXT in PostgreSQL)."
  },

  // ── Scenario 34: String Literal Filter on Unindexed Status Column (Junior) ──
  {
    "id": "enum_vs_lookup_table",
    "title": "String Literal Filter on Unindexed Status Column",
    "difficulty": "Junior",
    "category": "schema_design",
    "categoryLabel": "Schema Design & Indexing",
    "tableName": "orders",
    "rowCount": "16,000,000 rows",
    "tableSizeDisk": "4.9 GB on disk",
    "slowQuery": "SELECT order_id, user_id, total_amount\nFROM orders\nWHERE status = 'PAYMENT_PENDING'\nORDER BY created_at ASC\nLIMIT 100;",
    "initialCost": 395000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "Seq Scan on orders (cost=0.00..395000.00) Filter: (status = 'PAYMENT_PENDING') -> Sort on created_at",
    "businessContext": "Payment reaper worker queries pending orders to cancel expired sessions. The table has 16M records, and the reaper job times out every 5 minutes.",
    "strategies": [
      {
        "id": "strat_partial_status_created_optimal",
        "title": "Partial Index on Pending Orders: (created_at ASC) WHERE status = 'PAYMENT_PENDING'",
        "sqlCommand": "CREATE INDEX idx_orders_pending_reaper \nON orders(created_at ASC) \nWHERE status = 'PAYMENT_PENDING';",
        "isOptimal": true,
        "resultingCost": 6.8,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Scan using idx_orders_pending_reaper -> 0.9ms instant queue drainage",
        "engineExplanation": "Masterpiece! Only 0.1% of orders are in 'PAYMENT_PENDING' at any moment. A partial index contains only pending orders pre-sorted by created_at. The reaper drains orders in 0.9ms with zero filesort."
      },
      {
        "id": "strat_composite_full_status_created",
        "title": "Full Composite Index on (status, created_at ASC)",
        "sqlCommand": "CREATE INDEX idx_orders_status_created ON orders(status, created_at ASC);",
        "isOptimal": false,
        "resultingCost": 45.0,
        "resultingLatencyMs": 8.5,
        "executionPlanSummary": "Index Scan (Works, but index is 480 MB instead of 1.2 MB)",
        "engineExplanation": "Acceptable, but wasteful: A full composite index indexes all 16M completed and archived orders, consuming 400x more RAM than a partial index."
      },
      {
        "id": "strat_single_status_index",
        "title": "Single Column Index on status",
        "sqlCommand": "CREATE INDEX idx_orders_status ON orders(status);",
        "isOptimal": false,
        "resultingCost": 85000,
        "resultingLatencyMs": 1400,
        "executionPlanSummary": "Bitmap Heap Scan on status -> External merge sort on created_at",
        "engineExplanation": "Still requires an expensive sort because the single-column index on status does not provide created_at order."
      }
    ],
    "keyTakeaway": "For queue-like status tables where workers constantly poll unfinished tasks (PENDING, PROCESSING), a Partial Index with a WHERE condition eliminates 99% of index bloat and delivers sub-millisecond seeks."
  },

  // ── Scenario 35: Correlated Scalar Subquery Multiplies Execution Cost (Junior) ──
  {
    "id": "correlated_subquery_in_select",
    "title": "Correlated Scalar Subquery Multiplies Execution Cost",
    "difficulty": "Junior",
    "category": "subqueries",
    "categoryLabel": "Subqueries & Joins",
    "tableName": "customers",
    "rowCount": "100,000 rows",
    "tableSizeDisk": "25 MB on disk",
    "slowQuery": "SELECT c.customer_id, c.full_name,\n       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS order_count\nFROM customers c\nLIMIT 1000;",
    "initialCost": 85400,
    "initialLatencyMs": 2850,
    "initialPlanSummary": "Seq Scan on customers -> SubPlan 1 executed 1,000 times (N+1 database query engine loop)",
    "businessContext": "Customer list page loads 1,000 records. A scalar subquery in the SELECT clause executes 1,000 separate queries under the hood, freezing the web response.",
    "strategies": [
      {
        "id": "strat_left_join_group_by_optimal",
        "title": "Rewrite to LEFT JOIN with Subquery Aggregation",
        "sqlCommand": "SELECT c.customer_id, c.full_name, COALESCE(o.order_count, 0) AS order_count\nFROM (SELECT customer_id, full_name FROM customers LIMIT 1000) c\nLEFT JOIN (\n    SELECT customer_id, COUNT(*) AS order_count \n    FROM orders \n    GROUP BY customer_id\n) o ON o.customer_id = c.customer_id;",
        "isOptimal": true,
        "resultingCost": 32.0,
        "resultingLatencyMs": 3.4,
        "executionPlanSummary": "Hash Left Join between 1,000 customers and aggregated orders -> 3.4ms",
        "engineExplanation": "Winner! By pre-limiting customers to 1,000 rows and joining against an aggregated result, the database replaces 1,000 separate index seeks with a single fast hash join."
      },
      {
        "id": "strat_index_orders_customer",
        "title": "Add Index on orders(customer_id) without Rewriting",
        "sqlCommand": "CREATE INDEX idx_orders_customer_id ON orders(customer_id);",
        "isOptimal": false,
        "resultingCost": 12500,
        "resultingLatencyMs": 420,
        "executionPlanSummary": "Index Only Scan executed 1,000 separate times in a nested loop",
        "engineExplanation": "Partial fix: Index helps the subquery, but executing 1,000 separate subplans still incurs massive function call overhead inside the query executor."
      },
      {
        "id": "strat_lateral_join_without_index",
        "title": "Convert to CROSS JOIN LATERAL without Index",
        "sqlCommand": "SELECT c.customer_id, o.cnt FROM customers c, LATERAL (SELECT count(*) cnt FROM orders o WHERE o.customer_id = c.customer_id) o LIMIT 1000;",
        "isOptimal": false,
        "resultingCost": 85400,
        "resultingLatencyMs": 2850,
        "executionPlanSummary": "Identical nested loop execution",
        "engineExplanation": "LATERAL joins with correlated filters are physically identical to correlated scalar subqueries."
      }
    ],
    "keyTakeaway": "Avoid correlated scalar subqueries in the SELECT projection list. They force the query engine into an internal N+1 loop. Replace them with JOINs on pre-aggregated subqueries."
  },

  // ── Scenario 36: Slow DISTINCT on 20-Million-Row Table (Junior) ──
  {
    "id": "distinct_on_low_cardinality",
    "title": "Slow DISTINCT on 20-Million-Row Table",
    "difficulty": "Junior",
    "category": "aggregations",
    "categoryLabel": "Distinct & Skip Scan",
    "tableName": "audit_events",
    "rowCount": "20,000,000 rows",
    "tableSizeDisk": "6.2 GB on disk",
    "slowQuery": "SELECT DISTINCT tenant_id\nFROM audit_events;",
    "initialCost": 520000,
    "initialLatencyMs": 6400,
    "initialPlanSummary": "HashAggregate on audit_events (cost=0.00..520000.00) -> Scans all 20,000,000 rows into 128MB hash table",
    "businessContext": "Tenant dropdown in superadmin dashboard needs a list of all active tenant IDs (only ~150 distinct tenants exist among 20M rows). Query takes 6.4 seconds.",
    "strategies": [
      {
        "id": "strat_recursive_loose_index_optimal",
        "title": "Emulate Loose Index Scan (Skip Scan) via Recursive CTE",
        "sqlCommand": "WITH RECURSIVE t AS (\n   (SELECT tenant_id FROM audit_events ORDER BY tenant_id LIMIT 1)\n   UNION ALL\n   SELECT (SELECT tenant_id FROM audit_events WHERE tenant_id > t.tenant_id ORDER BY tenant_id LIMIT 1)\n   FROM t WHERE t.tenant_id IS NOT NULL\n)\nSELECT tenant_id FROM t WHERE tenant_id IS NOT NULL;",
        "isOptimal": true,
        "resultingCost": 15.0,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "150 B-Tree Seeks using idx_audit_tenant -> 1.2ms (Zero full table scan)",
        "engineExplanation": "Legendary technique! Instead of scanning 20 million rows, the recursive CTE performs exactly 150 B-Tree seeks (one per distinct tenant), jumping directly from one tenant to the next in 1.2ms!"
      },
      {
        "id": "strat_index_tenant_id",
        "title": "Standard B-Tree Index on tenant_id with SELECT DISTINCT",
        "sqlCommand": "CREATE INDEX idx_audit_tenant ON audit_events(tenant_id); SELECT DISTINCT tenant_id FROM audit_events;",
        "isOptimal": false,
        "resultingCost": 185000,
        "resultingLatencyMs": 2200,
        "executionPlanSummary": "Index Only Scan -> Still reads all 20,000,000 index pointers sequentially",
        "engineExplanation": "Postgres does not have native Index Skip Scan for B-trees yet. A standard DISTINCT still walks every single leaf node in the index, scanning 20M pointers."
      },
      {
        "id": "strat_group_by_tenant",
        "title": "Rewrite to GROUP BY tenant_id",
        "sqlCommand": "SELECT tenant_id FROM audit_events GROUP BY tenant_id;",
        "isOptimal": false,
        "resultingCost": 520000,
        "resultingLatencyMs": 6400,
        "executionPlanSummary": "HashAggregate -> Identical plan to SELECT DISTINCT",
        "engineExplanation": "DISTINCT and GROUP BY are translated to the same physical HashAggregate or GroupAggregate nodes in the optimizer."
      }
    ],
    "keyTakeaway": "Finding a few distinct values in a massive table using SELECT DISTINCT scans the entire table or index. Emulating a Loose Index Scan (Skip Scan) with a Recursive CTE jumps directly between distinct keys in milliseconds."
  },

  // ── Scenario 37: Index Condition Pushdown (ICP) Optimization (Junior) ──
  {
    "id": "index_condition_pushdown_icp",
    "title": "Index Condition Pushdown (ICP) Optimization",
    "difficulty": "Junior",
    "category": "engine_mechanics",
    "categoryLabel": "Engine Pushdown Optimization",
    "tableName": "employees",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "1.2 GB on disk",
    "slowQuery": "SELECT employee_id, first_name, last_name, salary\nFROM employees\nWHERE department_id = 12 AND last_name LIKE '%son';",
    "initialCost": 95000,
    "initialLatencyMs": 1250,
    "initialPlanSummary": "Index Scan on department_id -> 250,000 rows fetched into MySQL Server layer to evaluate LIKE '%son'",
    "businessContext": "Internal HR directory filters employees in engineering (dept 12) whose name ends in 'son'. Query visits 250,000 table rows one-by-one.",
    "strategies": [
      {
        "id": "strat_composite_icp_optimal",
        "title": "Composite Index on (department_id, last_name) with ICP",
        "sqlCommand": "CREATE INDEX idx_emp_dept_name ON employees(department_id, last_name) INCLUDE (salary);",
        "isOptimal": true,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Condition Pushdown (Using index condition) -> Storage engine filters in-place",
        "engineExplanation": "Winner! With Index Condition Pushdown (ICP), the InnoDB storage engine evaluates last_name LIKE '%son' directly in the B-Tree leaf pages before fetching rows from the clustered index, cutting heap reads by 99%!"
      },
      {
        "id": "strat_index_last_name_only",
        "title": "Index on last_name only",
        "sqlCommand": "CREATE INDEX idx_emp_last_name ON employees(last_name);",
        "isOptimal": false,
        "resultingCost": 95000,
        "resultingLatencyMs": 1250,
        "executionPlanSummary": "Seq Scan -> Leading wildcard '%son' completely disables index seek",
        "engineExplanation": "Leading wildcards cannot seek on last_name index."
      },
      {
        "id": "strat_disable_icp",
        "title": "Disable ICP with SET optimizer_switch='index_condition_pushdown=off'",
        "sqlCommand": "SET optimizer_switch='index_condition_pushdown=off';",
        "isOptimal": false,
        "resultingCost": 180000,
        "resultingLatencyMs": 2800,
        "executionPlanSummary": "Forces server layer to read every clustered record",
        "engineExplanation": "Disabling ICP increases round-trips between storage engine and SQL server tier."
      }
    ],
    "keyTakeaway": "Include secondary filter columns in composite indexes even if they contain wildcard or non-seekable operators. Index Condition Pushdown (ICP) filters rows in the storage engine before expensive heap page access."
  },

  // ── Scenario 38: Auto-Increment Sequence Burn in High-Frequency UPSERT (Junior) ──
  {
    "id": "insert_on_duplicate_key_burn",
    "title": "Auto-Increment Sequence Burn in High-Frequency UPSERT",
    "difficulty": "Junior",
    "category": "upsert",
    "categoryLabel": "UPSERT & Sequence Exhaustion",
    "tableName": "video_views",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "1.9 GB on disk",
    "slowQuery": "-- Executed 5,000 times/sec:\nINSERT INTO video_views (id, video_id, view_count)\nVALUES (DEFAULT, 40129, 1)\nON DUPLICATE KEY UPDATE view_count = view_count + 1;",
    "initialCost": 15.0,
    "initialLatencyMs": 2.2,
    "initialPlanSummary": "Upsert on unique key -> INT Primary Key burns 5,000 sequence IDs per second!",
    "businessContext": "Viral video analytics: An INT primary key (limit 2.14 billion) ran out of IDs in 3 weeks, throwing 'Duplicate entry for key PRIMARY' and taking down the entire streaming platform.",
    "strategies": [
      {
        "id": "strat_natural_key_or_bigint_optimal",
        "title": "Drop Auto-Increment ID, Use video_id as PRIMARY KEY",
        "sqlCommand": "-- video_id is already unique! Eliminate artificial auto-increment ID:\nALTER TABLE video_views DROP COLUMN id, ADD PRIMARY KEY (video_id);\n-- Or change to BIGINT with innodb_autoinc_lock_mode = 2.",
        "isOptimal": true,
        "resultingCost": 3.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Zero auto-increment sequence consumption -> In-place B-tree update",
        "engineExplanation": "Champion! In MySQL InnoDB, INSERT ... ON DUPLICATE KEY UPDATE consumes an auto-increment ID from the global table counter on every execution, even when updating an existing row. Making video_id the natural PK stops sequence burning permanently."
      },
      {
        "id": "strat_ignore_error",
        "title": "Use INSERT IGNORE",
        "sqlCommand": "INSERT IGNORE INTO video_views VALUES (DEFAULT, 40129, 1);",
        "isOptimal": false,
        "resultingCost": 15.0,
        "resultingLatencyMs": 2.2,
        "executionPlanSummary": "Still burns auto-increment IDs on every duplicate collision",
        "engineExplanation": "INSERT IGNORE also consumes and discards auto-increment IDs for every ignored row."
      },
      {
        "id": "strat_truncate_table",
        "title": "Truncate and Reset Auto-Increment Periodically",
        "sqlCommand": "ALTER TABLE video_views AUTO_INCREMENT = 1;",
        "isOptimal": false,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Cannot reset auto_increment below current MAX(id)",
        "engineExplanation": "In InnoDB, you cannot reset auto_increment below the highest existing value in the table without deleting rows."
      }
    ],
    "keyTakeaway": "In MySQL, ON DUPLICATE KEY UPDATE consumes an auto-increment ID before evaluating uniqueness. On existing rows, that ID is discarded forever. Use natural primary keys or BIGINT to prevent sequence exhaustion."
  },

  // ── Scenario 39: Hash Join Memory Spill to Temporary Disk Files (Mid) ──
  {
    "id": "hash_join_disk_spill_work_mem",
    "title": "Hash Join Memory Spill to Temporary Disk Files",
    "difficulty": "Mid",
    "category": "joins",
    "categoryLabel": "JOIN Optimization & Hash Joins",
    "tableName": "order_lines",
    "rowCount": "18,000,000 rows",
    "tableSizeDisk": "4.2 GB on disk",
    "slowQuery": "SELECT o.order_id, o.order_date, l.product_id, l.unit_price, l.quantity\nFROM orders o\nJOIN order_lines l ON o.order_id = l.order_id\nWHERE o.order_date >= '2026-01-01' AND o.order_date < '2026-04-01';",
    "initialCost": 485000,
    "initialLatencyMs": 7800,
    "initialPlanSummary": "Hash Join -> Hash Batches: 16 (Disk Spill: 320 MB written to pgsql_tmp/)",
    "businessContext": "Quarterly financial sales aggregation query stalls for 8 seconds. Storage engine disk I/O hits 100% reading temporary scratch files.",
    "strategies": [
      {
        "id": "strat_increase_session_workmem_optimal",
        "title": "Index order_lines(order_id) or Elevate work_mem for Session",
        "sqlCommand": "CREATE INDEX idx_order_lines_order_id ON order_lines(order_id);\n-- For the reporting session:\nSET work_mem = '256MB';",
        "isOptimal": true,
        "resultingCost": 420.0,
        "resultingLatencyMs": 14.5,
        "executionPlanSummary": "Hash Join (In-Memory Batches: 1, Disk Spill: 0 bytes) or Index Nested Loop Join",
        "engineExplanation": "Winner! By increasing work_mem from 4MB to 256MB for the analytical session, the build table fits entirely in RAM (0 disk writes). Adding the foreign key index also allows the planner to switch to an Index Join."
      },
      {
        "id": "strat_force_merge_join",
        "title": "Force Merge Join with SET enable_hashjoin = off",
        "sqlCommand": "SET enable_hashjoin = off; SELECT ...",
        "isOptimal": false,
        "resultingCost": 920000,
        "resultingLatencyMs": 14200,
        "executionPlanSummary": "Merge Join -> Forced external disk sort of both 18M and 3M row inputs!",
        "engineExplanation": "Catastrophic! Disabling hash joins forces the database to sort both massive inputs on disk, doubling runtime from 7.8s to 14.2s."
      },
      {
        "id": "strat_increase_buffer_pool_global",
        "title": "Increase Global shared_buffers to 64GB",
        "sqlCommand": "ALTER SYSTEM SET shared_buffers = '64GB';",
        "isOptimal": false,
        "resultingCost": 485000,
        "resultingLatencyMs": 7600,
        "executionPlanSummary": "shared_buffers caches data blocks, but does NOT allocate work_mem hash joins",
        "engineExplanation": "Misunderstanding PostgreSQL memory: shared_buffers holds cached table pages. Hash table memory for joins is governed independently by work_mem."
      }
    ],
    "keyTakeaway": "When EXPLAIN ANALYZE shows Hash Batches > 1 and Disk Spill in pgsql_tmp, the hash table exceeded work_mem (or join_buffer_size). Elevate session work_mem or provide indexed join keys."
  },

  // ── Scenario 40: Chat History Pagination Skips Microsecond Messages (Mid) ──
  {
    "id": "keyset_pagination_tie_breaker",
    "title": "Chat History Pagination Skips Microsecond Messages",
    "difficulty": "Mid",
    "category": "pagination",
    "categoryLabel": "Keyset Pagination",
    "tableName": "chat_messages",
    "rowCount": "50,000,000 rows",
    "tableSizeDisk": "12.5 GB on disk",
    "slowQuery": "-- Client requests next 50 messages:\nSELECT message_id, channel_id, sender_id, message_text, created_at\nFROM chat_messages\nWHERE channel_id = 902 AND created_at < '2026-03-24 14:10:05.120000'\nORDER BY created_at DESC\nLIMIT 50;",
    "initialCost": 85.0,
    "initialLatencyMs": 4.5,
    "initialPlanSummary": "Index Scan on created_at -> Data Loss Hazard: Drops concurrent messages sharing exact timestamp",
    "businessContext": "Slack-like team messaging app: In high-traffic channels with automated bots, 15 messages were sent at the exact same microsecond. Keyset pagination silently skips 12 of them!",
    "strategies": [
      {
        "id": "strat_composite_keyset_tiebreaker_optimal",
        "title": "Row-Value Tuple Seek with Primary Key Tie-Breaker: (created_at, message_id)",
        "sqlCommand": "CREATE INDEX idx_chat_channel_created_id ON chat_messages(channel_id, created_at DESC, message_id DESC);\n\n-- Query:\nSELECT message_id, channel_id, sender_id, message_text, created_at\nFROM chat_messages\nWHERE channel_id = 902 \n  AND (created_at, message_id) < ('2026-03-24 14:10:05.120000', 491028)\nORDER BY created_at DESC, message_id DESC\nLIMIT 50;",
        "isOptimal": true,
        "resultingCost": 4.5,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan using idx_chat_channel_created_id -> 100% Deterministic Tuple Comparison",
        "engineExplanation": "Champion! By appending the unique message_id as a tie-breaker inside a tuple comparison (created_at, message_id) < (:ts, :id), messages sharing identical microseconds are cleanly separated and never skipped."
      },
      {
        "id": "strat_use_offset_instead",
        "title": "Fall back to LIMIT 50 OFFSET 15000",
        "sqlCommand": "SELECT ... WHERE channel_id = 902 ORDER BY created_at DESC LIMIT 50 OFFSET 15000;",
        "isOptimal": false,
        "resultingCost": 145000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "Seq Scan / Deep Index Scan -> Must read and discard 15,000 rows",
        "engineExplanation": "Degrades exponentially: As users scroll up channel history, OFFSET 50,000 takes seconds and introduces pagination drift as new messages arrive."
      },
      {
        "id": "strat_nanosecond_precision",
        "title": "Increase Timestamp to Nanosecond Precision",
        "sqlCommand": "ALTER TABLE chat_messages ALTER COLUMN created_at TYPE TIMESTAMP(9);",
        "isOptimal": false,
        "resultingCost": 85.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Does not mathematically guarantee uniqueness across distributed nodes",
        "engineExplanation": "False security: In distributed systems or bulk imports, collisions still occur on identical clocks."
      }
    ],
    "keyTakeaway": "Keyset pagination on timestamps requires a unique tie-breaker (Primary Key). Use Row-Value tuple comparisons (created_at, id) < (:last_ts, :last_id) with a composite index to guarantee zero data loss."
  },

  // ── Scenario 41: Session Token Verification Heap Access Spike (Mid) ──
  {
    "id": "covering_index_include_clause",
    "title": "Session Token Verification Heap Access Spike",
    "difficulty": "Mid",
    "category": "covering_indexes",
    "categoryLabel": "Covering Indexes & INCLUDE",
    "tableName": "user_sessions",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "6.8 GB on disk",
    "slowQuery": "SELECT user_id, expires_at, device_fingerprint\nFROM user_sessions\nWHERE session_token = 'tk_98a7fbc281e4b901' AND expires_at > NOW();",
    "initialCost": 850,
    "initialLatencyMs": 28,
    "initialPlanSummary": "Index Scan on idx_session_token -> Heap Fetch to read user_id & device_fingerprint",
    "businessContext": "API Gateway validates session tokens on every inbound request (30,000 RPS). Table heap page reads cause NVMe SSD I/O saturation and intermittent latency spikes.",
    "strategies": [
      {
        "id": "strat_include_covering_optimal",
        "title": "B-Tree Index with INCLUDE (user_id, device_fingerprint)",
        "sqlCommand": "CREATE INDEX idx_sessions_token_covering \nON user_sessions (session_token, expires_at) \nINCLUDE (user_id, device_fingerprint);",
        "isOptimal": true,
        "resultingCost": 3.8,
        "resultingLatencyMs": 0.4,
        "executionPlanSummary": "Index Only Scan using idx_sessions_token_covering -> 0 Heap Page Accesses",
        "engineExplanation": "Masterpiece! session_token and expires_at are stored in internal B-Tree nodes for navigation and filtering, while user_id and device_fingerprint are stored only in leaf payloads. Zero table heap I/O in 0.4ms!"
      },
      {
        "id": "strat_composite_all_keys",
        "title": "Composite Key with All 4 Columns as Search Keys",
        "sqlCommand": "CREATE INDEX idx_sessions_all ON user_sessions(session_token, expires_at, user_id, device_fingerprint);",
        "isOptimal": false,
        "resultingCost": 4.5,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Only Scan, but index size is 40% larger due to wide B-Tree internal nodes",
        "engineExplanation": "Putting user_id and device_fingerprint into the search key increases internal B-Tree node sizes, decreasing branch fanout and increasing index tree depth."
      },
      {
        "id": "strat_single_token_index",
        "title": "Index on session_token only",
        "sqlCommand": "CREATE INDEX idx_sessions_token ON user_sessions(session_token);",
        "isOptimal": false,
        "resultingCost": 850,
        "resultingLatencyMs": 28,
        "executionPlanSummary": "Index Scan -> Still visits heap to evaluate expires_at and retrieve user_id",
        "engineExplanation": "Does not solve the problem: Every API request still hits random heap pages to inspect expires_at and fetch user attributes."
      }
    ],
    "keyTakeaway": "Use the INCLUDE clause for non-search payload columns. It stores attributes directly in B-Tree leaves for Index-Only Scans without bloating internal B-Tree navigation branch nodes."
  },

  // ── Scenario 42: Soft Deletes Bloat 95% of Search Index (Mid) ──
  {
    "id": "partial_index_soft_deletes",
    "title": "Soft Deletes Bloat 95% of Search Index",
    "difficulty": "Mid",
    "category": "partial_indexes",
    "categoryLabel": "Partial & Filtered Indexes",
    "tableName": "documents",
    "rowCount": "30,000,000 rows",
    "tableSizeDisk": "11.2 GB on disk",
    "slowQuery": "SELECT document_id, title, author_id, updated_at\nFROM documents\nWHERE organization_id = 501 AND deleted_at IS NULL\nORDER BY updated_at DESC\nLIMIT 20;",
    "initialCost": 85000,
    "initialLatencyMs": 1400,
    "initialPlanSummary": "Bitmap Heap Scan -> Scans index containing 22,000,000 deleted archive documents",
    "businessContext": "Enterprise document management: Over 7 years, 22 million documents were soft-deleted. Standard indexes on (organization_id, updated_at) are 2.8 GB in RAM, mostly caching dead records.",
    "strategies": [
      {
        "id": "strat_partial_soft_delete_optimal",
        "title": "Partial Index Excluding Soft Deletes: WHERE deleted_at IS NULL",
        "sqlCommand": "CREATE INDEX idx_docs_active_org_updated \nON documents(organization_id, updated_at DESC) \nINCLUDE (document_id, title, author_id)\nWHERE deleted_at IS NULL;",
        "isOptimal": true,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Only Scan using idx_docs_active_org_updated -> Index shrinks from 2.8 GB to 420 MB",
        "engineExplanation": "Champion! By adding WHERE deleted_at IS NULL, the 22 million deleted documents are permanently excluded from the index. The active working set shrinks by 85%, fitting entirely into RAM cache with 0.7ms response."
      },
      {
        "id": "strat_composite_including_deleted_at",
        "title": "Composite Index: (organization_id, deleted_at, updated_at DESC)",
        "sqlCommand": "CREATE INDEX idx_docs_org_del_up ON documents(organization_id, deleted_at, updated_at DESC);",
        "isOptimal": false,
        "resultingCost": 48.0,
        "resultingLatencyMs": 8.5,
        "executionPlanSummary": "Index Scan on full index (Retains all 22M deleted rows in index tree)",
        "engineExplanation": "Works for queries, but wastes 2.4 GB of RAM indexing archived deleted documents that will never be queried again."
      },
      {
        "id": "strat_separate_archive_table",
        "title": "Move Deleted Rows to documents_archive via Trigger",
        "sqlCommand": "CREATE TRIGGER trg_archive_docs AFTER UPDATE ...",
        "isOptimal": false,
        "resultingCost": 8.0,
        "resultingLatencyMs": 2.5,
        "executionPlanSummary": "Double write overhead on every soft-delete; complex rollback semantics",
        "engineExplanation": "Over-engineered: A partial index achieves the exact same performance in one line of DDL without triggers or data synchronization overhead."
      }
    ],
    "keyTakeaway": "Never index soft-deleted rows. Adding WHERE deleted_at IS NULL to your B-Tree index definition shrinks index size dramatically, eliminates dead row traversal, and keeps working sets in RAM."
  },

  // ── Scenario 43: Low-Cardinality Leading Column in Multi-Store Search (Mid) ──
  {
    "id": "index_skip_scan_loose_index",
    "title": "Low-Cardinality Leading Column in Multi-Store Search",
    "difficulty": "Mid",
    "category": "skip_scan",
    "categoryLabel": "Index Skip Scan & Loose Index",
    "tableName": "store_inventory",
    "rowCount": "20,000,000 rows",
    "tableSizeDisk": "5.4 GB on disk",
    "slowQuery": "SELECT store_id, product_sku, in_stock_count\nFROM store_inventory\nWHERE product_sku = 'IPHONE-16-PRO-256'\nLIMIT 50;",
    "initialCost": 340000,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Seq Scan on store_inventory (Index idx_store_sku exists on (store_id, product_sku) but store_id is not specified)",
    "businessContext": "Retail chain inventory: Only 8 distinct store_id values exist, but 2.5M product_skus. Queries searching by product_sku skip the leftmost store_id and force full table scans.",
    "strategies": [
      {
        "id": "strat_reverse_composite_or_skipscan_optimal",
        "title": "Create Index Ordered by High Cardinality First: (product_sku, store_id)",
        "sqlCommand": "CREATE INDEX idx_inv_sku_store ON store_inventory(product_sku, store_id) \nINCLUDE (in_stock_count);",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan using idx_inv_sku_store -> Direct B-Tree seek on product_sku",
        "engineExplanation": "Winner! By placing the high-cardinality search column (product_sku) first, queries filtering by sku jump straight to the exact index leaf in 0.8ms without needing store_id."
      },
      {
        "id": "strat_mysql_skip_scan",
        "title": "Rely on MySQL 8.0 Index Skip Scan",
        "sqlCommand": "/* Query unchanged on MySQL 8.0 */",
        "isOptimal": false,
        "resultingCost": 1200,
        "resultingLatencyMs": 45,
        "executionPlanSummary": "Index Skip Scan using idx_store_sku (Executes 8 separate sub-scans)",
        "engineExplanation": "Decent in MySQL 8.0 (45ms vs 4.2s), but still 50x slower than a dedicated index on product_sku. Furthermore, Postgres does not support B-Tree Skip Scan natively."
      },
      {
        "id": "strat_hash_index_sku",
        "title": "Create Hash Index on product_sku",
        "sqlCommand": "CREATE INDEX idx_sku_hash ON store_inventory USING HASH(product_sku);",
        "isOptimal": false,
        "resultingCost": 15.0,
        "resultingLatencyMs": 2.2,
        "executionPlanSummary": "Bitmap Heap Scan -> Cannot satisfy covering columns or range ordering",
        "engineExplanation": "Hash indexes cannot include additional columns or support ordering."
      }
    ],
    "keyTakeaway": "Avoid placing low-cardinality columns (status, store_id) first in composite indexes if queries frequently filter only on the secondary high-cardinality column."
  },

  // ── Scenario 44: Optimizer Chooses Nested Loop Over Hash Join (Mid) ──
  {
    "id": "nested_loop_vs_hash_join_hint",
    "title": "Optimizer Chooses Nested Loop Over Hash Join",
    "difficulty": "Mid",
    "category": "joins",
    "categoryLabel": "JOIN Algorithms & Planner Hints",
    "tableName": "supplier_shipments",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.8 GB on disk",
    "slowQuery": "SELECT s.supplier_name, sh.shipment_id, sh.delivered_date, sh.cost\nFROM suppliers s\nJOIN supplier_shipments sh ON s.supplier_id = sh.supplier_id\nWHERE s.region = 'APAC';",
    "initialCost": 850000,
    "initialLatencyMs": 9400,
    "initialPlanSummary": "Nested Loop (cost=0.56..850000.00) -> 240,000 separate index seeks into supplier_shipments",
    "businessContext": "Supply chain report joins 240,000 APAC suppliers with shipments. Stale statistics caused the planner to estimate only 15 suppliers, picking a devastating Nested Loop instead of a Hash Join.",
    "strategies": [
      {
        "id": "strat_analyze_statistics_optimal",
        "title": "Run ANALYZE and Tune default_statistics_target",
        "sqlCommand": "ANALYZE suppliers;\nANALYZE supplier_shipments;\n-- Planner correctly estimates 240,000 rows and switches to Hash Join automatically!",
        "isOptimal": true,
        "resultingCost": 3500,
        "resultingLatencyMs": 480,
        "executionPlanSummary": "Hash Join using Hash on suppliers -> Single-pass stream in 480ms",
        "engineExplanation": "Masterclass! Stale table statistics led the optimizer to believe APAC had only 15 suppliers, making Nested Loop look cheap. Updating statistics reveals the true 240,000 row cardinality, prompting the planner to choose an optimal Hash Join."
      },
      {
        "id": "strat_disable_nested_loop_globally",
        "title": "Disable Nested Loops Globally: SET enable_nestloop = off",
        "sqlCommand": "SET enable_nestloop = off;",
        "isOptimal": false,
        "resultingCost": 3800,
        "resultingLatencyMs": 510,
        "executionPlanSummary": "Fixes this query, but cripples OLTP point lookups across the entire application",
        "engineExplanation": "Dangerous blunt instrument! Disabling nested loops globally breaks single-row Primary Key seeks across all other user-facing OLTP APIs."
      },
      {
        "id": "strat_add_composite_shipments",
        "title": "Create Composite Index on shipments(supplier_id, cost)",
        "sqlCommand": "CREATE INDEX idx_shipments_supp_cost ON supplier_shipments(supplier_id, cost);",
        "isOptimal": false,
        "resultingCost": 720000,
        "resultingLatencyMs": 7800,
        "executionPlanSummary": "Nested Loop using new index -> Still executes 240,000 separate loops",
        "engineExplanation": "Does not address the root cause: The algorithmic mismatch (240k loops) remains."
      }
    ],
    "keyTakeaway": "Planners choose bad join algorithms when cardinality estimates are wrong. When Nested Loops run thousands of times on large sets, run ANALYZE to refresh histogram statistics before forcing planner flags."
  },

  // ── Scenario 45: Nested JSONB Filtering Without GIN Index (Mid) ──
  {
    "id": "jsonb_containment_gin_operator",
    "title": "Nested JSONB Filtering Without GIN Index",
    "difficulty": "Mid",
    "category": "jsonb",
    "categoryLabel": "JSONB & GIN Indexes",
    "tableName": "feature_flags",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "3.1 GB on disk",
    "slowQuery": "SELECT flag_id, name, rules\nFROM feature_flags\nWHERE rules @> '{\"targeting\": {\"country\": \"CA\", \"beta_user\": true}}';",
    "initialCost": 220000,
    "initialLatencyMs": 2800,
    "initialPlanSummary": "Seq Scan on feature_flags (cost=0.00..220000.00) Filter: (rules @> '...')",
    "businessContext": "Config management service checks if a feature flag is enabled for Canadian beta testers. Every microservice evaluation takes 2.8 seconds due to sequential JSON unpacking.",
    "strategies": [
      {
        "id": "strat_jsonb_path_ops_gin_optimal",
        "title": "GIN Index with jsonb_path_ops Operator Class",
        "sqlCommand": "CREATE INDEX idx_flags_rules_path_ops \nON feature_flags USING GIN (rules jsonb_path_ops);",
        "isOptimal": true,
        "resultingCost": 8.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Bitmap Index Scan using idx_flags_rules_path_ops -> 1.2ms hash containment check",
        "engineExplanation": "Winner! jsonb_path_ops hashes entire path-value pairs (targeting.country=CA, targeting.beta_user=true). It is 3x smaller and significantly faster than default GIN jsonb_ops for @> containment queries."
      },
      {
        "id": "strat_default_gin_ops",
        "title": "Default GIN Index: USING GIN (rules)",
        "sqlCommand": "CREATE INDEX idx_flags_rules_default ON feature_flags USING GIN (rules);",
        "isOptimal": false,
        "resultingCost": 28.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Bitmap Index Scan using default jsonb_ops (Works, but index is 3x larger on disk)",
        "engineExplanation": "Acceptable, but default jsonb_ops indexes every key, path, and value separately, making the index 3x larger and slower to update than jsonb_path_ops."
      },
      {
        "id": "strat_btree_cast_text",
        "title": "B-Tree Index on rules::text",
        "sqlCommand": "CREATE INDEX idx_flags_rules_text ON feature_flags((rules::text));",
        "isOptimal": false,
        "resultingCost": 220000,
        "resultingLatencyMs": 2800,
        "executionPlanSummary": "Seq Scan -> Text B-Tree cannot evaluate JSON structural containment (@>)",
        "engineExplanation": "JSON key order is non-deterministic in raw strings; text B-Trees cannot evaluate JSON tree containment."
      }
    ],
    "keyTakeaway": "For JSONB @> containment queries, use GIN indexes with jsonb_path_ops. It creates a compact hash-based index that evaluates complex nested JSON filters in 1 millisecond."
  },

  // ── Scenario 46: Customer Name Fuzzy Search Typosquatting Match (Mid) ──
  {
    "id": "pg_trgm_similarity_fuzzy_search",
    "title": "Customer Name Fuzzy Search Typosquatting Match",
    "difficulty": "Mid",
    "category": "text_search",
    "categoryLabel": "GIN & Full-Text Search",
    "tableName": "merchants",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.9 GB on disk",
    "slowQuery": "SELECT merchant_id, name, registration_number\nFROM merchants\nWHERE name % 'Starbuks Coffee'\nORDER BY similarity(name, 'Starbuks Coffee') DESC\nLIMIT 10;",
    "initialCost": 310000,
    "initialLatencyMs": 4600,
    "initialPlanSummary": "Seq Scan on merchants -> Calculates similarity() across all 10M rows + Filesort",
    "businessContext": "Fraud prevention screen checks merchant names for trademark infringement and typosquatting. Full table scan takes 4.6 seconds on every vendor onboarding check.",
    "strategies": [
      {
        "id": "strat_gin_trgm_similarity_optimal",
        "title": "GIN Trigram Index with gin_trgm_ops",
        "sqlCommand": "CREATE EXTENSION IF NOT EXISTS pg_trgm;\nCREATE INDEX idx_merchants_name_trgm ON merchants USING GIN (name gin_trgm_ops);\n-- Query uses % operator to activate index:\nSELECT merchant_id, name, registration_number FROM merchants \nWHERE name % 'Starbuks Coffee' \nORDER BY similarity(name, 'Starbuks Coffee') DESC LIMIT 10;",
        "isOptimal": true,
        "resultingCost": 18.0,
        "resultingLatencyMs": 3.8,
        "executionPlanSummary": "Bitmap Index Scan using idx_merchants_name_trgm -> 3.8ms Trigram Match",
        "engineExplanation": "Champion! pg_trgm splits words into 3-character slices ('Sta', 'tar', 'arb'). GIN index finds overlapping trigram matches in 3.8ms, eliminating 99.9% of non-matching names before computing exact similarity scores."
      },
      {
        "id": "strat_standard_fulltext_tsvector",
        "title": "PostgreSQL Full-Text Search tsvector @@ to_tsquery",
        "sqlCommand": "CREATE INDEX idx_name_fts ON merchants USING GIN (to_tsvector('english', name));",
        "isOptimal": false,
        "resultingCost": 120000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "Fails to match misspelled 'Starbuks' due to exact dictionary stem requirements",
        "engineExplanation": "FTS fails: Full-Text Search uses linguistic stemming, not character n-grams. It cannot match misspelled words like 'Starbuks' to 'Starbucks'."
      },
      {
        "id": "strat_levenshtein_full_scan",
        "title": "Use levenshtein(name, 'Starbuks Coffee') < 3",
        "sqlCommand": "SELECT ... WHERE levenshtein(name, 'Starbuks Coffee') < 3;",
        "isOptimal": false,
        "resultingCost": 680000,
        "resultingLatencyMs": 9500,
        "executionPlanSummary": "Seq Scan with expensive Levenshtein distance matrix CPU calculation per row",
        "engineExplanation": "Even slower! Levenshtein distance cannot be indexed with standard B-trees and doubles CPU time."
      }
    ],
    "keyTakeaway": "For fuzzy matching and typo-tolerant search, use PostgreSQL's pg_trgm extension with a GIN index on gin_trgm_ops. It accelerates both % similarity and LIKE '%middle%' queries."
  },

  // ── Scenario 47: Top 3 Highest Bids Per Auction with CROSS JOIN LATERAL (Mid) ──
  {
    "id": "cross_join_lateral_top_n",
    "title": "Top 3 Highest Bids Per Auction with CROSS JOIN LATERAL",
    "difficulty": "Mid",
    "category": "lateral_joins",
    "categoryLabel": "Lateral Joins & Window Functions",
    "tableName": "bids",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "4.5 GB on disk",
    "slowQuery": "-- Window function approach:\nWITH ranked_bids AS (\n    SELECT bid_id, auction_id, bidder_id, amount,\n           ROW_NUMBER() OVER (PARTITION BY auction_id ORDER BY amount DESC) as rn\n    FROM bids\n)\nSELECT * FROM ranked_bids WHERE rn <= 3;",
    "initialCost": 580000,
    "initialLatencyMs": 6800,
    "initialPlanSummary": "WindowAgg on Window (Sort by auction_id, amount DESC) -> Reads entire 15,000,000 rows into memory/disk sort!",
    "businessContext": "Auction platform shows the current top 3 leading bids across 1,000 active auctions. The window function sorts all 15 million historical bids before filtering rn <= 3.",
    "strategies": [
      {
        "id": "strat_lateral_join_top_n_optimal",
        "title": "CROSS JOIN LATERAL with Composite Index: (auction_id, amount DESC)",
        "sqlCommand": "CREATE INDEX idx_bids_auction_amount ON bids(auction_id, amount DESC);\n\n-- Query:\nSELECT a.auction_id, b.bid_id, b.bidder_id, b.amount\nFROM active_auctions a\nCROSS JOIN LATERAL (\n    SELECT bid_id, bidder_id, amount\n    FROM bids\n    WHERE bids.auction_id = a.auction_id\n    ORDER BY amount DESC\n    LIMIT 3\n) b;",
        "isOptimal": true,
        "resultingCost": 45.0,
        "resultingLatencyMs": 4.2,
        "executionPlanSummary": "Nested Loop with 1,000 Index Scans (each reading exactly 3 index leaves) -> 4.2ms!",
        "engineExplanation": "Brilliant! Instead of sorting 15 million rows, CROSS JOIN LATERAL executes a bounded index scan of exactly 3 rows per active auction. 1,000 auctions * 3 rows = 3,000 index reads total in 4.2ms!"
      },
      {
        "id": "strat_index_without_lateral",
        "title": "Add Index on bids(auction_id, amount DESC) without Rewriting Query",
        "sqlCommand": "CREATE INDEX idx_bids_a_amt ON bids(auction_id, amount DESC);",
        "isOptimal": false,
        "resultingCost": 220000,
        "resultingLatencyMs": 2800,
        "executionPlanSummary": "Index Scan on entire 15M rows -> WindowAgg still evaluates all 15 million rows",
        "engineExplanation": "Window functions cannot push down WHERE rn <= 3 into the scan. The engine must evaluate ROW_NUMBER() on all 15M rows before discarding rank > 3."
      },
      {
        "id": "strat_group_by_max",
        "title": "Use GROUP BY auction_id with MAX(amount)",
        "sqlCommand": "SELECT auction_id, MAX(amount) FROM bids GROUP BY auction_id;",
        "isOptimal": false,
        "resultingCost": 180000,
        "resultingLatencyMs": 2200,
        "executionPlanSummary": "Returns only top 1 bid, fails requirement for top 3 bids with bidder details",
        "engineExplanation": "Fails business requirements: GROUP BY MAX() only gives the single highest amount, losing bidder_id and ranks 2 and 3."
      }
    ],
    "keyTakeaway": "To get 'Top N per Category', avoid full-table window functions. Use CROSS JOIN LATERAL with a composite index on (category_id, sort_col DESC) and LIMIT N inside the subquery."
  },

  // ── Scenario 48: UNION Triggers Costly Deduplication Sort (Mid) ──
  {
    "id": "union_all_vs_union_dedup",
    "title": "UNION Triggers Costly Deduplication Sort",
    "difficulty": "Mid",
    "category": "set_operations",
    "categoryLabel": "Set Operations & Temporary Tables",
    "tableName": "security_events",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.2 GB on disk",
    "slowQuery": "SELECT user_id, event_type, created_at FROM auth_events WHERE created_at >= NOW() - INTERVAL '1 day'\nUNION\nSELECT user_id, event_type, created_at FROM security_events WHERE created_at >= NOW() - INTERVAL '1 day';",
    "initialCost": 128000,
    "initialLatencyMs": 1650,
    "initialPlanSummary": "Append -> Unique -> Sort: External Merge Disk (cost=0.00..128000.00) -> Deduplicating 400,000 rows",
    "businessContext": "Security audit dashboard combines login events and firewall events from the past 24 hours. Query spends 85% of its time sorting to eliminate duplicates, even though event IDs are disjoint.",
    "strategies": [
      {
        "id": "strat_union_all_optimal",
        "title": "Replace UNION with UNION ALL",
        "sqlCommand": "SELECT user_id, event_type, created_at FROM auth_events WHERE created_at >= NOW() - INTERVAL '1 day'\nUNION ALL\nSELECT user_id, event_type, created_at FROM security_events WHERE created_at >= NOW() - INTERVAL '1 day';",
        "isOptimal": true,
        "resultingCost": 22.0,
        "resultingLatencyMs": 3.1,
        "executionPlanSummary": "Append -> 2x Index Scans using idx_created_at -> Zero Sorting, Streams Output Instantly",
        "engineExplanation": "Winner! UNION executes a mandatory SORT and UNIQUE operation across all combined rows. UNION ALL simply concatenates streams without deduplication, dropping execution time from 1.65s to 3.1ms."
      },
      {
        "id": "strat_increase_work_mem_sort",
        "title": "Increase work_mem to 512MB for UNION Sort",
        "sqlCommand": "SET work_mem = '512MB';",
        "isOptimal": false,
        "resultingCost": 65000,
        "resultingLatencyMs": 420,
        "executionPlanSummary": "In-memory quicksort deduplication (Still wastes CPU cycles sorting)",
        "engineExplanation": "Faster than disk spill, but still wastes 400ms of pure CPU time deduplicating streams that don't even have overlapping events."
      },
      {
        "id": "strat_add_distinct_on",
        "title": "Add DISTINCT ON (created_at)",
        "sqlCommand": "SELECT DISTINCT ON (created_at) ...",
        "isOptimal": false,
        "resultingCost": 140000,
        "resultingLatencyMs": 1900,
        "executionPlanSummary": "Sort and Unique -> Adds even more sorting criteria",
        "engineExplanation": "DISTINCT ON requires an explicit sort and does not replace the lightweight nature of UNION ALL."
      }
    ],
    "keyTakeaway": "Always default to UNION ALL unless you strictly require deduplication. UNION incurs a hidden DISTINCT sort that drains memory and degrades performance."
  },

  // ── Scenario 49: Multi-Tenant Shared Table Missing Tenant Prefix (Mid) ──
  {
    "id": "multi_tenant_shared_table_tenant_id",
    "title": "Multi-Tenant Shared Table Missing Tenant Prefix",
    "difficulty": "Mid",
    "category": "multi_tenancy",
    "categoryLabel": "Multi-Tenant Database Architecture",
    "tableName": "tenant_documents",
    "rowCount": "40,000,000 rows",
    "tableSizeDisk": "12.8 GB on disk",
    "slowQuery": "SELECT doc_id, title, author, created_at\nFROM tenant_documents\nWHERE tenant_id = 'acme_corp' AND title LIKE 'Contract%'\nORDER BY created_at DESC\nLIMIT 25;",
    "initialCost": 380000,
    "initialLatencyMs": 4900,
    "initialPlanSummary": "Bitmap Heap Scan on idx_title -> Filter: tenant_id = 'acme_corp' applied to 250,000 global contracts",
    "businessContext": "Multi-tenant SaaS app: Index exists on title, but every query filters by tenant_id first. Searching contracts in one tenant scans contracts across all 10,000 companies.",
    "strategies": [
      {
        "id": "strat_tenant_composite_prefix_optimal",
        "title": "Composite Index with tenant_id Leftmost: (tenant_id, title text_pattern_ops, created_at DESC)",
        "sqlCommand": "CREATE INDEX idx_tenant_docs_t_t_c \nON tenant_documents(tenant_id, title text_pattern_ops, created_at DESC)\nINCLUDE (doc_id, author);",
        "isOptimal": true,
        "resultingCost": 5.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan using idx_tenant_docs_t_t_c -> Tenant data isolated in B-Tree subtree",
        "engineExplanation": "Winner! Making tenant_id the leftmost prefix isolates 'acme_corp' into a single compact B-Tree sub-branch. The engine seeks directly into Acme's documents without touching other tenants in 0.8ms."
      },
      {
        "id": "strat_index_tenant_id_only",
        "title": "Single Index on tenant_id",
        "sqlCommand": "CREATE INDEX idx_tenant_id ON tenant_documents(tenant_id);",
        "isOptimal": false,
        "resultingCost": 45000,
        "resultingLatencyMs": 520,
        "executionPlanSummary": "Bitmap Index Scan on tenant_id -> Filter on title and external filesort",
        "engineExplanation": "Acme Corp has 300,000 documents. Index on tenant_id retrieves all 300,000 rows and requires a filesort to find the top 25."
      },
      {
        "id": "strat_row_level_security_only",
        "title": "Enable PostgreSQL Row Level Security (RLS) without Index Change",
        "sqlCommand": "ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;",
        "isOptimal": false,
        "resultingCost": 380000,
        "resultingLatencyMs": 4900,
        "executionPlanSummary": "RLS appends WHERE tenant_id = current_tenant, but does not add index structures",
        "engineExplanation": "RLS enforces security boundaries, not indexing performance. Without a composite index, RLS still scans the full table."
      }
    ],
    "keyTakeaway": "In shared multi-tenant tables, tenant_id must almost always be the leftmost column in composite indexes to partition the B-Tree search space per tenant."
  },

  // ── Scenario 50: GROUP BY Memory Exhaustion on 10M Sensor Records (Mid) ──
  {
    "id": "group_by_streaming_vs_hashagg",
    "title": "GROUP BY Memory Exhaustion on 10M Sensor Records",
    "difficulty": "Mid",
    "category": "aggregations",
    "categoryLabel": "Aggregations & Group By",
    "tableName": "sensor_readings",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.4 GB on disk",
    "slowQuery": "SELECT device_id, DATE_TRUNC('hour', recorded_at) AS hourly_bucket, AVG(temperature)\nFROM sensor_readings\nGROUP BY device_id, DATE_TRUNC('hour', recorded_at);",
    "initialCost": 350000,
    "initialLatencyMs": 5800,
    "initialPlanSummary": "HashAggregate -> 2,500,000 buckets overflow work_mem -> Disk Spill in pgsql_tmp",
    "businessContext": "IoT telemetry analytics calculates hourly averages per device. Grouping 2.5 million distinct device-hour combinations overflows memory hash tables into temporary disk files.",
    "strategies": [
      {
        "id": "strat_presorted_streaming_group_optimal",
        "title": "Index Pre-Sorted Expression for Streaming GroupAggregate: (device_id, date_trunc('hour', recorded_at))",
        "sqlCommand": "CREATE INDEX idx_sensor_device_hour \nON sensor_readings(device_id, (DATE_TRUNC('hour', recorded_at))) \nINCLUDE (temperature);",
        "isOptimal": true,
        "resultingCost": 42.0,
        "resultingLatencyMs": 18.0,
        "executionPlanSummary": "GroupAggregate using idx_sensor_device_hour -> O(1) Memory Streaming Aggregation",
        "engineExplanation": "Champion! Because the index delivers rows pre-sorted by device_id and hourly_bucket, the engine uses a GroupAggregate node: it reads rows in a stream, aggregates on the fly, and flushes results with zero memory or disk spill!"
      },
      {
        "id": "strat_increase_work_mem_hash",
        "title": "Increase work_mem to 1GB for HashAggregate",
        "sqlCommand": "SET work_mem = '1GB';",
        "isOptimal": false,
        "resultingCost": 120000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "In-Memory HashAggregate -> Consumes 600MB of RAM per concurrent connection",
        "engineExplanation": "Dangerous: If 10 analytics queries run concurrently, 6GB of server RAM is consumed, risking Linux OOMKiller crashes."
      },
      {
        "id": "strat_materialized_view_refresh",
        "title": "Materialized View Refreshed Every Hour",
        "sqlCommand": "CREATE MATERIALIZED VIEW mv_sensor_hourly AS SELECT ...",
        "isOptimal": false,
        "resultingCost": 10.0,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "Fast read, but REFRESH MATERIALIZED VIEW takes 30 seconds and data is stale",
        "engineExplanation": "Good for reporting, but cannot provide real-time hourly telemetry for live alert monitors."
      }
    ],
    "keyTakeaway": "HashAggregate builds an in-memory hash table of all groups and spills to disk when groups exceed work_mem. Providing an index matching GROUP BY keys allows streaming GroupAggregate with constant O(1) memory."
  },

  // ── Scenario 51: Deep Page 5,000 in Real Estate Property Listings (Mid) ──
  {
    "id": "deferred_join_subquery_seek",
    "title": "Deep Page 5,000 in Real Estate Property Listings",
    "difficulty": "Mid",
    "category": "fast_pagination",
    "categoryLabel": "Fast Pagination Techniques",
    "tableName": "properties",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "4.8 GB on disk",
    "slowQuery": "SELECT property_id, title, description, floor_plan, address, price, agent_notes\nFROM properties\nWHERE city = 'Seattle'\nORDER BY listed_date DESC\nLIMIT 20 OFFSET 50000;",
    "initialCost": 185000,
    "initialLatencyMs": 3100,
    "initialPlanSummary": "Index Scan using idx_city_date -> Heap Fetch on 50,020 wide rows (Reads 450 MB of table pages off disk!)",
    "businessContext": "Real estate search engine: Users jumping to page 2,500 experience 3-second delays because the database fetches 50,000 wide rows with large text descriptions from disk only to discard 49,980 of them.",
    "strategies": [
      {
        "id": "strat_deferred_join_seek_optimal",
        "title": "Deferred Join: Subquery Seek on Covering Index Then Join Primary Key",
        "sqlCommand": "SELECT p.property_id, p.title, p.description, p.floor_plan, p.address, p.price, p.agent_notes\nFROM (\n    SELECT property_id\n    FROM properties\n    WHERE city = 'Seattle'\n    ORDER BY listed_date DESC\n    LIMIT 20 OFFSET 50000\n) sub\nJOIN properties p ON p.property_id = sub.property_id;",
        "isOptimal": true,
        "resultingCost": 85.0,
        "resultingLatencyMs": 12.5,
        "executionPlanSummary": "Index Only Scan on (city, listed_date DESC, property_id) for 50k rows -> Fetches ONLY 20 rows from heap!",
        "engineExplanation": "Masterpiece! The inner subquery scans the lightweight index to skip 50,000 rows without touching table heap pages. Then, it joins the primary key to fetch heavy text descriptions for ONLY the final 20 rows!"
      },
      {
        "id": "strat_include_all_columns",
        "title": "Add description and floor_plan to INCLUDE clause",
        "sqlCommand": "CREATE INDEX idx_prop_covering ON properties(city, listed_date DESC) INCLUDE (description, floor_plan, ...);",
        "isOptimal": false,
        "resultingCost": 45000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "Index explodes to 4 GB in size, destroying cache locality",
        "engineExplanation": "Terrible: Storing large descriptions inside the index duplicates the entire table, destroying B-Tree performance."
      },
      {
        "id": "strat_increase_max_connections",
        "title": "Increase Connection Pool Capacity",
        "sqlCommand": "SET max_connections = 500;",
        "isOptimal": false,
        "resultingCost": 185000,
        "resultingLatencyMs": 3100,
        "executionPlanSummary": "Does not improve query execution time; increases connection contention",
        "engineExplanation": "Connection pool size has zero effect on B-Tree leaf traversal latency."
      }
    ],
    "keyTakeaway": "Deferred Joins (Late Row Lookup) solve deep pagination with wide rows. Scan a compact covering index in a subquery to skip OFFSET rows, then join back on the Primary Key to fetch wide columns for only the LIMIT page."
  },

  // ── Scenario 52: Polymorphic Entity Notification Feed Lookup (Mid) ──
  {
    "id": "polymorphic_association_index",
    "title": "Polymorphic Entity Notification Feed Lookup",
    "difficulty": "Mid",
    "category": "schema_patterns",
    "categoryLabel": "Schema Patterns & Indexing",
    "tableName": "notifications",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "3.9 GB on disk",
    "slowQuery": "SELECT notification_id, user_id, message, is_read, created_at\nFROM notifications\nWHERE target_type = 'Post' AND target_id = 491028\nORDER BY created_at DESC;",
    "initialCost": 280000,
    "initialLatencyMs": 3400,
    "initialPlanSummary": "Seq Scan on notifications (cost=0.00..280000.00) Filter: ((target_type = 'Post') AND (target_id = 491028))",
    "businessContext": "Social network notifications: When a post is updated, the app fetches all related notification records. Separate indexes exist on target_type and target_id, but the database ignores both.",
    "strategies": [
      {
        "id": "strat_composite_polymorphic_optimal",
        "title": "Composite Index on (target_type, target_id, created_at DESC)",
        "sqlCommand": "CREATE INDEX idx_notif_target_composite \nON notifications(target_type, target_id, created_at DESC) \nINCLUDE (user_id, is_read);",
        "isOptimal": true,
        "resultingCost": 4.8,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan using idx_notif_target_composite -> Exact B-Tree seek in 0.8ms",
        "engineExplanation": "Winner! Polymorphic associations always query target_type and target_id together. A composite index on (target_type, target_id) turns a multi-second table scan into a sub-millisecond point seek."
      },
      {
        "id": "strat_index_target_id_only",
        "title": "Index on target_id only",
        "sqlCommand": "CREATE INDEX idx_notif_target_id ON notifications(target_id);",
        "isOptimal": false,
        "resultingCost": 4200,
        "resultingLatencyMs": 65,
        "executionPlanSummary": "Bitmap Heap Scan on target_id -> Filter on target_type and filesort on created_at",
        "engineExplanation": "Sub-optimal: target_id 491028 might match a Post, a Comment, or a User, requiring heap filtering and a separate filesort."
      },
      {
        "id": "strat_hash_index_target",
        "title": "Hash Index on target_type",
        "sqlCommand": "CREATE INDEX idx_notif_hash_type ON notifications USING HASH(target_type);",
        "isOptimal": false,
        "resultingCost": 280000,
        "resultingLatencyMs": 3400,
        "executionPlanSummary": "Low cardinality (5 types) -> Full table scan",
        "engineExplanation": "Low cardinality hash index on 5 entity types is completely useless."
      }
    ],
    "keyTakeaway": "Polymorphic associations (target_type, target_id) must always be indexed together as a composite index. Adding sort columns (created_at DESC) eliminates post-fetch sorting."
  },

  // ── Scenario 53: CTE Optimization Fence in Heavy Ledger Reconciliation (Mid) ──
  {
    "id": "cte_as_materialized_optimization",
    "title": "CTE Optimization Fence in Heavy Ledger Reconciliation",
    "difficulty": "Mid",
    "category": "cte_optimization",
    "categoryLabel": "CTE Optimization & Inlining",
    "tableName": "journal_entries",
    "rowCount": "20,000,000 rows",
    "tableSizeDisk": "5.6 GB on disk",
    "slowQuery": "WITH recent_entries AS (\n    SELECT entry_id, account_id, amount, status\n    FROM journal_entries\n    WHERE status = 'POSTED'\n)\nSELECT * FROM recent_entries WHERE account_id = 9021;",
    "initialCost": 420000,
    "initialLatencyMs": 5200,
    "initialPlanSummary": "CTE Scan on recent_entries (cost=0.00..420000.00) -> Materializes 18M rows into RAM/disk scratch file!",
    "businessContext": "Financial ledger reconciliation: PostgreSQL 11 and earlier treated CTEs as an optimization fence (materializing the entire CTE before outer filters). In Postgres 12+, developers used AS MATERIALIZED by habit.",
    "strategies": [
      {
        "id": "strat_inline_cte_not_materialized_optimal",
        "title": "Use AS NOT MATERIALIZED (or Inline Subquery) with Index on (account_id, status)",
        "sqlCommand": "CREATE INDEX idx_journal_acc_status ON journal_entries(account_id, status);\n\n-- Inlined CTE:\nWITH recent_entries AS NOT MATERIALIZED (\n    SELECT entry_id, account_id, amount, status\n    FROM journal_entries\n    WHERE status = 'POSTED'\n)\nSELECT * FROM recent_entries WHERE account_id = 9021;",
        "isOptimal": true,
        "resultingCost": 5.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Scan using idx_journal_acc_status -> Outer filter pushed down into CTE in 0.9ms",
        "engineExplanation": "Champion! By allowing PostgreSQL to inline the CTE (AS NOT MATERIALIZED), the optimizer pushes the predicate account_id = 9021 directly into the scan, executing an instant index seek instead of materializing 18M rows!"
      },
      {
        "id": "strat_force_as_materialized",
        "title": "Keep WITH recent_entries AS MATERIALIZED",
        "sqlCommand": "WITH recent_entries AS MATERIALIZED (SELECT ...) SELECT ...",
        "isOptimal": false,
        "resultingCost": 420000,
        "resultingLatencyMs": 5200,
        "executionPlanSummary": "Explicitly blocks predicate pushdown, forcing full 18M table scan",
        "engineExplanation": "AS MATERIALIZED acts as an optimization fence, strictly preventing the engine from pushing down outer WHERE conditions."
      },
      {
        "id": "strat_temporary_table",
        "title": "Create TEMPORARY TABLE before query",
        "sqlCommand": "CREATE TEMP TABLE t_recent AS SELECT ...; SELECT * FROM t_recent WHERE account_id = 9021;",
        "isOptimal": false,
        "resultingCost": 500000,
        "resultingLatencyMs": 6800,
        "executionPlanSummary": "Even slower due to catalog lock overhead and temporary table writes",
        "engineExplanation": "Writing temp tables generates heavy I/O and catalog locks."
      }
    ],
    "keyTakeaway": "In PostgreSQL 12+, CTEs are automatically inlined unless declared AS MATERIALIZED. Materializing a CTE creates an optimization barrier that blocks index predicate pushdown."
  },

  // ── Scenario 54: Most Recent Login Per User Window Partition Scan (Mid) ──
  {
    "id": "window_function_filter_over_partition",
    "title": "Most Recent Login Per User Window Partition Scan",
    "difficulty": "Mid",
    "category": "window_functions",
    "categoryLabel": "Window Functions & Sorting",
    "tableName": "user_logins",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.1 GB on disk",
    "slowQuery": "SELECT user_id, ip_address, login_time\nFROM (\n    SELECT user_id, ip_address, login_time,\n           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_time DESC) as rn\n    FROM user_logins\n    WHERE user_id IN (101, 102, 103, 104, 105)\n) t\nWHERE rn = 1;",
    "initialCost": 850,
    "initialLatencyMs": 32,
    "initialPlanSummary": "Sort -> WindowAgg -> Filter (rn = 1) -> Sorts 50,000 historical logins in memory",
    "businessContext": "Security audit checks the last login details for 5 flagged user IDs. Index exists on user_id, but the query sorts thousands of old logins before selecting row 1.",
    "strategies": [
      {
        "id": "strat_composite_user_login_time_optimal",
        "title": "Composite Index: (user_id, login_time DESC) with Covering IP",
        "sqlCommand": "CREATE INDEX idx_user_logins_u_l ON user_logins(user_id, login_time DESC) INCLUDE (ip_address);",
        "isOptimal": true,
        "resultingCost": 4.8,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan -> WindowAgg eliminates sorting; reads top row per user partition directly",
        "engineExplanation": "Winner! Because the index is already sorted by (user_id, login_time DESC), the WindowAgg node reads rows pre-grouped and pre-sorted. Zero filesort or in-memory quicksort!"
      },
      {
        "id": "strat_group_by_max_subquery",
        "title": "Rewrite to Self-Join with MAX(login_time)",
        "sqlCommand": "SELECT l.user_id, l.ip_address, l.login_time\nFROM user_logins l\nJOIN (\n    SELECT user_id, MAX(login_time) as max_time \n    FROM user_logins \n    WHERE user_id IN (101,102,103,104,105) \n    GROUP BY user_id\n) m ON l.user_id = m.user_id AND l.login_time = m.max_time;",
        "isOptimal": false,
        "resultingCost": 22.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Double table scan and hash join across user_logins",
        "engineExplanation": "Sub-optimal: Reads user_logins twice (once for MAX, once for self-join)."
      },
      {
        "id": "strat_index_ip_only",
        "title": "Index on ip_address",
        "sqlCommand": "CREATE INDEX idx_logins_ip ON user_logins(ip_address);",
        "isOptimal": false,
        "resultingCost": 850,
        "resultingLatencyMs": 32,
        "executionPlanSummary": "Index on ip_address is completely ignored by user_id filter",
        "engineExplanation": "Useless index: The query filters on user_id, not ip_address."
      }
    ],
    "keyTakeaway": "Window functions with PARTITION BY X ORDER BY Y can execute without sorting if a composite index on (X, Y) matches the partition and sort order exactly."
  },

  // ── Scenario 55: Driver Geolocation Radius Search Without Spatial Index (Mid) ──
  {
    "id": "gist_spatial_distance_st_dwithin",
    "title": "Driver Geolocation Radius Search Without Spatial Index",
    "difficulty": "Mid",
    "category": "spatial",
    "categoryLabel": "Spatial & GiST Indexing",
    "tableName": "driver_locations",
    "rowCount": "3,000,000 rows",
    "tableSizeDisk": "850 MB on disk",
    "slowQuery": "SELECT driver_id, vehicle_type, ST_Distance(location, ST_MakePoint(-122.3321, 47.6062)::geography) as dist_meters\nFROM driver_locations\nWHERE ST_DWithin(location, ST_MakePoint(-122.3321, 47.6062)::geography, 3000)\nORDER BY dist_meters ASC\nLIMIT 10;",
    "initialCost": 165000,
    "initialLatencyMs": 2400,
    "initialPlanSummary": "Seq Scan on driver_locations (cost=0.00..165000.00) Filter: ST_DWithin(location, ...)",
    "businessContext": "Ride-sharing dispatch: Matching nearby drivers within 3 km of a passenger takes 2.4 seconds, causing checkout timeouts for riders during rush hour.",
    "strategies": [
      {
        "id": "strat_gist_spatial_index_optimal",
        "title": "Spatial GiST Index: USING GIST (location)",
        "sqlCommand": "CREATE EXTENSION IF NOT EXISTS postgis;\nCREATE INDEX idx_drivers_location_gist ON driver_locations USING GIST (location);",
        "isOptimal": true,
        "resultingCost": 14.5,
        "resultingLatencyMs": 1.6,
        "executionPlanSummary": "Bitmap Index Scan using idx_drivers_location_gist -> R-Tree bounding box prune in 1.6ms",
        "engineExplanation": "Winner! GiST implements an R-Tree hierarchy of bounding boxes. ST_DWithin prunes 99.9% of distant drivers in 1.6ms, evaluating exact spherical distance only for candidates within the 3km box."
      },
      {
        "id": "strat_btree_latitude_longitude",
        "title": "B-Tree Indexes on Separate Latitude and Longitude",
        "sqlCommand": "CREATE INDEX idx_lat ON driver_locations(lat); CREATE INDEX idx_lng ON driver_locations(lng);",
        "isOptimal": false,
        "resultingCost": 42000,
        "resultingLatencyMs": 480,
        "executionPlanSummary": "BitmapAnd across two 1D B-trees -> Still computes spherical math on thousands of rows",
        "engineExplanation": "1D B-trees cannot index 2D spatial relationships efficiently. B-tree intersection is 300x slower than a native 2D R-Tree GiST index."
      },
      {
        "id": "strat_brin_spatial",
        "title": "BRIN Index on location",
        "sqlCommand": "CREATE INDEX idx_drivers_brin ON driver_locations USING BRIN (location);",
        "isOptimal": false,
        "resultingCost": 95000,
        "resultingLatencyMs": 1200,
        "executionPlanSummary": "BRIN Scan -> High page overlap due to moving driver updates",
        "engineExplanation": "BRIN requires physical on-disk clustering. Moving drivers constantly update location, destroying block-range sorting."
      }
    ],
    "keyTakeaway": "2D geospatial coordinates cannot be indexed efficiently with 1D B-Tree indexes. Always use GiST (Generalized Search Tree) or SP-GiST indexes for PostGIS ST_DWithin queries."
  },

  // ── Scenario 56: High-Frequency Heartbeat Updates Trigger Massive Index Bloat (Mid) ──
  {
    "id": "btree_fillfactor_hot_updates",
    "title": "High-Frequency Heartbeat Updates Trigger Massive Index Bloat",
    "difficulty": "Mid",
    "category": "engine_mechanics",
    "categoryLabel": "HOT Updates & Table Bloat",
    "tableName": "device_heartbeats",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "4.2 GB on disk",
    "slowQuery": "-- Executed 10,000 times/sec:\nUPDATE device_heartbeats\nSET last_ping_time = NOW(), cpu_usage = 42.5\nWHERE device_id = 104921;",
    "initialCost": 8.5,
    "initialLatencyMs": 14.5,
    "initialPlanSummary": "Update on device_heartbeats -> Non-HOT update writes new tuple to different page, updating all 5 indexes!",
    "businessContext": "IoT device telemetry: A high-frequency heartbeat update takes 14ms per write. Table and indexes bloated from 400 MB to 4.2 GB in 48 hours, causing disk space alarms.",
    "strategies": [
      {
        "id": "strat_fillfactor_hot_optimal",
        "title": "Tune Table fillfactor = 75 to Enable Heap-Only Tuples (HOT) Updates",
        "sqlCommand": "ALTER TABLE device_heartbeats SET (fillfactor = 75);\nVACUUM FULL device_heartbeats;\n-- Ensure updated columns (last_ping_time, cpu_usage) are NOT indexed!",
        "isOptimal": true,
        "resultingCost": 3.2,
        "resultingLatencyMs": 0.6,
        "executionPlanSummary": "Heap-Only Tuple (HOT) Update -> New tuple placed on same 8KB page; ZERO index updates!",
        "engineExplanation": "Masterclass! In PostgreSQL, if a newly updated tuple fits on the SAME 8KB data page as the old tuple and no indexed columns changed, a HOT update occurs. It updates in-place without touching any secondary indexes!"
      },
      {
        "id": "strat_add_index_last_ping",
        "title": "Add Index on last_ping_time",
        "sqlCommand": "CREATE INDEX idx_heartbeats_ping ON device_heartbeats(last_ping_time);",
        "isOptimal": false,
        "resultingCost": 18.0,
        "resultingLatencyMs": 28.0,
        "executionPlanSummary": "Guarantees HOT update failure; forces every ping to modify index tree",
        "engineExplanation": "Disaster! Indexing an updated column completely disables HOT optimization, doubling index write amplification and bloat."
      },
      {
        "id": "strat_run_vacuum_hourly",
        "title": "Run VACUUM FULL every hour via cron",
        "sqlCommand": "0 * * * * psql -c 'VACUUM FULL device_heartbeats;'",
        "isOptimal": false,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Exclusive ACCESS EXCLUSIVE table lock freezes all writes for 45 seconds every hour",
        "engineExplanation": "VACUUM FULL locks the table exclusively, taking down live IoT ingestion."
      }
    ],
    "keyTakeaway": "Heap-Only Tuple (HOT) optimization eliminates index updates when modifying non-indexed columns. Setting table fillfactor < 100 reserves empty space on each data page for zero-index updates."
  },

  // ── Scenario 57: Inner Join Duplicates Rows When Checking Existence (Mid) ──
  {
    "id": "semi_join_exists_vs_inner_join",
    "title": "Inner Join Duplicates Rows When Checking Existence",
    "difficulty": "Mid",
    "category": "subqueries",
    "categoryLabel": "Subqueries & Semi-Joins",
    "tableName": "users",
    "rowCount": "2,000,000 rows",
    "tableSizeDisk": "650 MB on disk",
    "slowQuery": "SELECT DISTINCT u.user_id, u.username, u.email\nFROM users u\nJOIN orders o ON u.user_id = o.user_id\nWHERE o.status = 'COMPLETED';",
    "initialCost": 310000,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Hash Join -> HashAggregate (cost=0.00..310000.00) -> Joins 15M orders, producing duplicates, then sorts to deduplicate",
    "businessContext": "Marketing email blast queries all users who have placed at least one completed order. The JOIN produces 15 million duplicate user rows, then chokes sorting them with DISTINCT.",
    "strategies": [
      {
        "id": "strat_semi_join_exists_optimal",
        "title": "Rewrite to Semi-Join with WHERE EXISTS",
        "sqlCommand": "SELECT u.user_id, u.username, u.email\nFROM users u\nWHERE EXISTS (\n    SELECT 1 FROM orders o \n    WHERE o.user_id = u.user_id AND o.status = 'COMPLETED'\n);",
        "isOptimal": true,
        "resultingCost": 28.0,
        "resultingLatencyMs": 3.4,
        "executionPlanSummary": "Hash Semi Join -> Stops scanning orders on FIRST match per user (Zero Deduplication Sort!)",
        "engineExplanation": "Champion! WHERE EXISTS executes as a Semi-Join: as soon as the engine finds ONE completed order for a user, it immediately emits the user and moves to the next, eliminating 15M duplicate joins and sorting!"
      },
      {
        "id": "strat_inner_join_group_by",
        "title": "Replace DISTINCT with GROUP BY u.user_id, u.username, u.email",
        "sqlCommand": "SELECT u.user_id, u.username, u.email FROM users u JOIN orders o ... GROUP BY u.user_id, ...",
        "isOptimal": false,
        "resultingCost": 290000,
        "resultingLatencyMs": 3900,
        "executionPlanSummary": "Still joins 15 million rows before grouping",
        "engineExplanation": "GROUP BY still performs the cartesian join across all 15 million orders before aggregating."
      },
      {
        "id": "strat_subquery_in",
        "title": "Use WHERE user_id IN (SELECT user_id FROM orders WHERE status = 'COMPLETED')",
        "sqlCommand": "SELECT * FROM users WHERE user_id IN (SELECT user_id FROM orders WHERE status = 'COMPLETED');",
        "isOptimal": false,
        "resultingCost": 65.0,
        "resultingLatencyMs": 12.0,
        "executionPlanSummary": "Subquery scan on deduplicated orders list (Slightly slower than direct Semi-Join)",
        "engineExplanation": "Acceptable, but IN subqueries without explicit correlation can force materialization of large intermediate ID arrays."
      }
    ],
    "keyTakeaway": "Never use JOIN + DISTINCT to check for existence of child records. Use WHERE EXISTS (Semi-Join): it halts scanning child rows on the very first match, eliminating duplicate row generation."
  },

  // ── Scenario 58: Abandoned Shopping Cart NOT IN NULL Trap (Mid) ──
  {
    "id": "anti_join_not_exists_null_safe",
    "title": "Abandoned Shopping Cart NOT IN NULL Trap",
    "difficulty": "Mid",
    "category": "anti_joins",
    "categoryLabel": "Anti-Joins & NULL Semantics",
    "tableName": "carts",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "1.4 GB on disk",
    "slowQuery": "SELECT c.cart_id, c.user_id\nFROM carts c\nWHERE c.cart_id NOT IN (\n    SELECT o.cart_id FROM orders o\n);",
    "initialCost": 850000,
    "initialLatencyMs": 12000,
    "initialPlanSummary": "Seq Scan on carts -> SubPlan executed with NULL check hazard -> Returned ZERO rows unexpectedly!",
    "businessContext": "Abandoned cart email reminder job runs for 12 seconds and returns 0 rows, even though there are 200,000 abandoned carts! A single NULL cart_id in orders broke SQL logic.",
    "strategies": [
      {
        "id": "strat_anti_join_not_exists_optimal",
        "title": "Rewrite to Anti-Join with WHERE NOT EXISTS",
        "sqlCommand": "CREATE INDEX idx_orders_cart_id ON orders(cart_id);\n\n-- Query:\nSELECT c.cart_id, c.user_id\nFROM carts c\nWHERE NOT EXISTS (\n    SELECT 1 FROM orders o WHERE o.cart_id = c.cart_id\n);",
        "isOptimal": true,
        "resultingCost": 35.0,
        "resultingLatencyMs": 4.1,
        "executionPlanSummary": "Hash Anti Join using idx_orders_cart_id -> 100% Correct and 4.1ms fast",
        "engineExplanation": "Winner! Under SQL 3-valued logic, if ANY row in the NOT IN subquery has cart_id IS NULL, the expression evaluates to UNKNOWN and drops all rows! NOT EXISTS is 100% NULL-safe and optimizes into a Hash Anti Join."
      },
      {
        "id": "strat_left_join_is_null",
        "title": "Rewrite to LEFT JOIN ... WHERE o.cart_id IS NULL",
        "sqlCommand": "SELECT c.cart_id, c.user_id FROM carts c \nLEFT JOIN orders o ON c.cart_id = o.cart_id \nWHERE o.cart_id IS NULL;",
        "isOptimal": false,
        "resultingCost": 45.0,
        "resultingLatencyMs": 6.8,
        "executionPlanSummary": "Hash Anti Join (Works, but slightly more verbose syntax)",
        "engineExplanation": "Functionally correct and equivalent in most modern optimizers, but NOT EXISTS conveys intent more clearly."
      },
      {
        "id": "strat_not_in_filter_null",
        "title": "Keep NOT IN and add WHERE cart_id IS NOT NULL",
        "sqlCommand": "SELECT ... WHERE c.cart_id NOT IN (SELECT cart_id FROM orders WHERE cart_id IS NOT NULL);",
        "isOptimal": false,
        "resultingCost": 12000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "Materialized SubPlan -> Slower than native Hash Anti Join",
        "engineExplanation": "Fixes the logic bug, but NOT IN still forces materialization of subquery results."
      }
    ],
    "keyTakeaway": "Always use NOT EXISTS instead of NOT IN for subqueries. If the subquery contains a single NULL value, NOT IN returns zero rows for the entire table due to three-valued logic."
  },

  // ── Scenario 59: Conference Room Booking Conflict Detection (Mid) ──
  {
    "id": "range_type_overlap_gist",
    "title": "Conference Room Booking Conflict Detection",
    "difficulty": "Mid",
    "category": "range_types",
    "categoryLabel": "Range Types & GiST Constraints",
    "tableName": "room_reservations",
    "rowCount": "4,000,000 rows",
    "tableSizeDisk": "1.1 GB on disk",
    "slowQuery": "SELECT reservation_id, room_id\nFROM room_reservations\nWHERE room_id = 42\n  AND start_time < '2026-03-24 16:00:00' \n  AND end_time > '2026-03-24 14:00:00';",
    "initialCost": 85000,
    "initialLatencyMs": 1150,
    "initialPlanSummary": "Seq Scan on room_reservations (cost=0.00..85000.00) -> Filter: start_time < ... AND end_time > ...",
    "businessContext": "Office scheduling system validates room availability. B-Trees on start_time and end_time cannot evaluate 2-dimensional time interval overlaps, leading to table scans.",
    "strategies": [
      {
        "id": "strat_gist_exclusion_tsrange_optimal",
        "title": "Use TSRANGE with GiST Index and Overlap Operator (&&)",
        "sqlCommand": "CREATE EXTENSION IF NOT EXISTS btree_gist;\nCREATE INDEX idx_reservations_room_time_gist \nON room_reservations USING GIST (room_id, tsrange(start_time, end_time));\n\n-- Query:\nSELECT reservation_id, room_id FROM room_reservations\nWHERE room_id = 42 \n  AND tsrange(start_time, end_time) && tsrange('2026-03-24 14:00:00', '2026-03-24 16:00:00');",
        "isOptimal": true,
        "resultingCost": 6.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Scan using idx_reservations_room_time_gist -> Instant interval overlap in 0.9ms",
        "engineExplanation": "Masterpiece! PostgreSQL range types (TSRANGE) and GiST indexes evaluate interval overlaps (&&) directly in the index tree. It also allows EXCLUDE USING GIST constraints to prevent double-booking at the schema level!"
      },
      {
        "id": "strat_composite_start_end",
        "title": "Composite B-Tree on (room_id, start_time, end_time)",
        "sqlCommand": "CREATE INDEX idx_res_room_s_e ON room_reservations(room_id, start_time, end_time);",
        "isOptimal": false,
        "resultingCost": 4200,
        "resultingLatencyMs": 85,
        "executionPlanSummary": "Index Scan on room_id and start_time -> Filter on end_time applied per row",
        "engineExplanation": "B-Tree can only seek on one range column (start_time). It cannot prune intervals where start_time is before the target window."
      },
      {
        "id": "strat_lock_entire_table",
        "title": "LOCK TABLE room_reservations IN EXCLUSIVE MODE",
        "sqlCommand": "LOCK TABLE room_reservations IN EXCLUSIVE MODE; SELECT ...",
        "isOptimal": false,
        "resultingCost": 85000,
        "resultingLatencyMs": 1150,
        "executionPlanSummary": "Blocks all concurrent bookings worldwide",
        "engineExplanation": "Table locks freeze all rooms worldwide to check room 42."
      }
    ],
    "keyTakeaway": "Use PostgreSQL range types (TSRANGE, DATERANGE) with GiST indexes for scheduling and reservations. The overlap operator (&&) evaluates interval intersections in sub-millisecond time."
  },

  // ── Scenario 60: Dirty Email Input Triggers Table Scan on User Lookup (Mid) ──
  {
    "id": "expression_index_lower_trim",
    "title": "Dirty Email Input Triggers Table Scan on User Lookup",
    "difficulty": "Mid",
    "category": "expression_indexes",
    "categoryLabel": "Functional & Expression Indexes",
    "tableName": "user_profiles",
    "rowCount": "9,000,000 rows",
    "tableSizeDisk": "2.4 GB on disk",
    "slowQuery": "SELECT user_id, display_name\nFROM user_profiles\nWHERE LOWER(TRIM(email)) = 'sarah.connor@sky.net';",
    "initialCost": 195000,
    "initialLatencyMs": 2400,
    "initialPlanSummary": "Seq Scan on user_profiles (cost=0.00..195000.00) Filter: (lower(btrim(email)) = '...')",
    "businessContext": "Password reset flow sanitizes user inputs by trimming spaces and lowercasing. Query scans 9 million rows because the index on email cannot be used.",
    "strategies": [
      {
        "id": "strat_expression_lower_trim_optimal",
        "title": "Create Expression Index on LOWER(TRIM(email))",
        "sqlCommand": "CREATE UNIQUE INDEX idx_profiles_clean_email ON user_profiles (LOWER(TRIM(email)));",
        "isOptimal": true,
        "resultingCost": 3.8,
        "resultingLatencyMs": 0.6,
        "executionPlanSummary": "Index Scan using idx_profiles_clean_email -> Instant exact seek in 0.6ms",
        "engineExplanation": "Winner! An expression index evaluates LOWER(TRIM(email)) during INSERT/UPDATE and indexes the clean result. Lookups matching that exact expression seek the B-Tree directly in 0.6ms."
      },
      {
        "id": "strat_app_clean_only",
        "title": "Clean Input in Application without Unique Constraint",
        "sqlCommand": "/* Only clean input in backend code before query */",
        "isOptimal": false,
        "resultingCost": 3.8,
        "resultingLatencyMs": 0.6,
        "executionPlanSummary": "Works for queries, but allows duplicate dirty emails (' Sarah@sky.net') into DB",
        "engineExplanation": "Cleaning only in app code does not prevent duplicate registrations with trailing spaces from slipping into the database."
      },
      {
        "id": "strat_trigram_index",
        "title": "GIN Trigram Index on email",
        "sqlCommand": "CREATE INDEX idx_email_trgm ON user_profiles USING GIN (email gin_trgm_ops);",
        "isOptimal": false,
        "resultingCost": 45.0,
        "resultingLatencyMs": 8.2,
        "executionPlanSummary": "Bitmap Index Scan on GIN (Overkill for exact email lookup)",
        "engineExplanation": "GIN trigram indexes are designed for wildcards and typos, not exact unique email lookups."
      }
    ],
    "keyTakeaway": "When data cleansing functions like LOWER(TRIM(col)) are applied in queries, create an expression index on the exact function combination to achieve index seeks while enforcing clean uniqueness."
  },

  // ── Scenario 61: Full Name Search and Sort Without Table Rewrite (Mid) ──
  {
    "id": "generated_column_stored_vs_virtual",
    "title": "Full Name Search and Sort Without Table Rewrite",
    "difficulty": "Mid",
    "category": "generated_columns",
    "categoryLabel": "Generated Columns",
    "tableName": "staff_directory",
    "rowCount": "6,000,000 rows",
    "tableSizeDisk": "1.7 GB on disk",
    "slowQuery": "SELECT staff_id, first_name, last_name, email\nFROM staff_directory\nWHERE (first_name || ' ' || last_name) = 'Sarah Connor'\nORDER BY (first_name || ' ' || last_name) ASC;",
    "initialCost": 165000,
    "initialLatencyMs": 2100,
    "initialPlanSummary": "Seq Scan on staff_directory -> Sort: (first_name || ' ' || last_name)",
    "businessContext": "Corporate portal searches employees by full name. Concatenating strings in WHERE and ORDER BY forces full table scans and memory filesorts.",
    "strategies": [
      {
        "id": "strat_generated_column_index_optimal",
        "title": "STORED Generated Column with B-Tree Index",
        "sqlCommand": "ALTER TABLE staff_directory ADD COLUMN full_name VARCHAR(150) \nGENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;\n\nCREATE INDEX idx_staff_full_name ON staff_directory(full_name);\n\n-- Query:\nSELECT staff_id, first_name, last_name, email FROM staff_directory \nWHERE full_name = 'Sarah Connor' ORDER BY full_name;",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan using idx_staff_full_name -> Zero Concatenation, Zero Sorting",
        "engineExplanation": "Champion! The STORED generated column computes full_name once upon INSERT/UPDATE. The B-Tree index satisfies both the equality seek and the ORDER BY sort in 0.7ms with zero runtime CPU string concatenation."
      },
      {
        "id": "strat_expression_index_concat",
        "title": "Expression Index on (first_name || ' ' || last_name)",
        "sqlCommand": "CREATE INDEX idx_staff_concat ON staff_directory((first_name || ' ' || last_name));",
        "isOptimal": false,
        "resultingCost": 8.0,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Scan, but requires repeating identical string concatenation in all queries",
        "engineExplanation": "Acceptable, but does not provide a clean named column for ORMs, GraphQL schemas, or third-party reporting tools."
      },
      {
        "id": "strat_separate_indexes",
        "title": "Separate Indexes on first_name and last_name",
        "sqlCommand": "CREATE INDEX idx_fn ON staff_directory(first_name); CREATE INDEX idx_ln ON staff_directory(last_name);",
        "isOptimal": false,
        "resultingCost": 165000,
        "resultingLatencyMs": 2100,
        "executionPlanSummary": "Seq Scan -> Concatenation in WHERE prevents using either individual index",
        "engineExplanation": "The database cannot break down a concatenated string comparison into two separate column lookups."
      }
    ],
    "keyTakeaway": "Use STORED Generated Columns for frequently queried derived attributes (e.g. full names, tax amounts). Indexing the generated column guarantees fast seek and sort without query code clutter."
  },

  // ── Scenario 62: 500,000 Row Bulk Ingestion Log Flush Stall (Mid) ──
  {
    "id": "bulk_insert_batch_size_tuning",
    "title": "500,000 Row Bulk Ingestion Log Flush Stall",
    "difficulty": "Mid",
    "category": "bulk_operations",
    "categoryLabel": "Bulk Operations & Transaction Size",
    "tableName": "warehouse_stock_sync",
    "rowCount": "500,000 rows",
    "tableSizeDisk": "150 MB on disk",
    "slowQuery": "-- Executing 500,000 single INSERT statements:\nINSERT INTO warehouse_stock_sync VALUES (1, 101, 50, NOW());\nINSERT INTO warehouse_stock_sync VALUES (2, 102, 12, NOW());\n-- ... 500,000 times",
    "initialCost": 500000,
    "initialLatencyMs": 85000,
    "initialPlanSummary": "500,000 separate transactions -> 500,000 synchronous fsync() disk commits!",
    "businessContext": "Nightly ERP inventory sync pushes 500,000 updates. Inserting row-by-row takes 85 seconds (1.5 minutes) and saturates SSD write I/O with continuous WAL flushes.",
    "strategies": [
      {
        "id": "strat_batch_chunks_copy_optimal",
        "title": "Use Batch Multi-Row Inserts (Chunk Size: 5,000) or PostgreSQL COPY",
        "sqlCommand": "-- In PostgreSQL: COPY warehouse_stock_sync FROM STDIN;\n-- Or Multi-Row Batch INSERT (chunks of 5,000 rows per transaction):\nINSERT INTO warehouse_stock_sync (id, sku_id, qty, updated_at) VALUES \n(1, 101, 50, NOW()), (2, 102, 12, NOW()), ... [5000 rows]\n-- 100 transactions instead of 500,000!",
        "isOptimal": true,
        "resultingCost": 120.0,
        "resultingLatencyMs": 1450,
        "executionPlanSummary": "Batch Insertion / Streaming COPY -> Runtime drops from 85s to 1.45s (58x faster!)",
        "engineExplanation": "Winner! Single INSERTs trigger an fsync() on every row. Grouping writes into chunks of 5,000 amortizes WAL flush overhead across thousands of rows, saturating disk write bandwidth efficiently."
      },
      {
        "id": "strat_single_giant_transaction",
        "title": "One Giant Transaction with All 500,000 Single Inserts",
        "sqlCommand": "BEGIN; INSERT ... (500k times); COMMIT;",
        "isOptimal": false,
        "resultingCost": 250000,
        "resultingLatencyMs": 32000,
        "executionPlanSummary": "Reduces fsyncs, but still incurs 500,000 network round-trips and parser overhead",
        "engineExplanation": "Better than autocommit, but sending 500,000 separate SQL strings over network connections wastes 32 seconds in network transit and query parsing."
      },
      {
        "id": "strat_disable_wal_fsync",
        "title": "Disable fsync globally: SET fsync = off",
        "sqlCommand": "ALTER SYSTEM SET fsync = off;",
        "isOptimal": false,
        "resultingCost": 100.0,
        "resultingLatencyMs": 1200,
        "executionPlanSummary": "Crashes database durability: Power loss corrupts database permanently",
        "engineExplanation": "Disastrous! Disabling fsync guarantees data corruption on power loss or kernel panic. Never disable fsync in production."
      }
    ],
    "keyTakeaway": "Never insert data row-by-row in autocommit mode. Batch records into multi-row chunks of 2,000 to 5,000 rows (or use COPY / LOAD DATA INFILE) to achieve 50x higher throughput safely."
  },

  // ── Scenario 63: Catalog Category Hierarchy Deletion Lock (Mid) ──
  {
    "id": "foreign_key_delete_restrict_lock",
    "title": "Catalog Category Hierarchy Deletion Lock",
    "difficulty": "Mid",
    "category": "foreign_keys",
    "categoryLabel": "Foreign Keys & Referential Locks",
    "tableName": "categories",
    "rowCount": "100,000 rows",
    "tableSizeDisk": "25 MB on disk",
    "slowQuery": "DELETE FROM categories WHERE category_id = 901;",
    "initialCost": 92000,
    "initialLatencyMs": 1150,
    "initialPlanSummary": "Seq Scan on products (40M rows) to check foreign key constraint -> Blocks catalog writes",
    "businessContext": "Merchandising admin deletes an obsolete product category. The query hangs for over a second because the child table `products` has 40M rows without an index on category_id.",
    "strategies": [
      {
        "id": "strat_index_child_fk_optimal",
        "title": "Add Index on Child Foreign Key: products(category_id)",
        "sqlCommand": "CREATE INDEX idx_products_category_id ON products(category_id);",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan on products using idx_products_category_id -> Instant referential check in 0.8ms",
        "engineExplanation": "Essential! When deleting or updating a primary key, the engine MUST verify that no child rows reference that key. An index on products(category_id) turns a 40M table scan into an instant 0.8ms seek."
      },
      {
        "id": "strat_cascade_delete",
        "title": "Change Constraint to ON DELETE CASCADE",
        "sqlCommand": "ALTER TABLE products DROP CONSTRAINT fk_cat, ADD CONSTRAINT fk_cat FOREIGN KEY (category_id) REFERENCES categories ON DELETE CASCADE;",
        "isOptimal": false,
        "resultingCost": 92000,
        "resultingLatencyMs": 1200,
        "executionPlanSummary": "Still full table scan on products without index, plus deletes products unintentionally",
        "engineExplanation": "CASCADE without an index still requires a full table scan to find child rows, and accidentally deletes all products belonging to that category!"
      },
      {
        "id": "strat_disable_fk_checks",
        "title": "Disable foreign_key_checks Session",
        "sqlCommand": "SET foreign_key_checks = 0; DELETE FROM categories WHERE category_id = 901;",
        "isOptimal": false,
        "resultingCost": 3.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Leaves orphaned products pointing to non-existent category 901",
        "engineExplanation": "Violates relational data integrity, leaving broken references in production."
      }
    ],
    "keyTakeaway": "Parent DELETE/UPDATE operations check child tables for referential integrity. Unindexed foreign keys on child tables force full table scans on every parent modification."
  },

  // ── Scenario 64: High-Volume Time-Series Sensor Stream Merge Join (Mid) ──
  {
    "id": "merge_join_presorted_inputs",
    "title": "High-Volume Time-Series Sensor Stream Merge Join",
    "difficulty": "Mid",
    "category": "joins",
    "categoryLabel": "Merge Joins & Presorted Streams",
    "tableName": "sensor_readings",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "6.2 GB on disk",
    "slowQuery": "SELECT r.reading_id, r.sensor_id, r.reading_time, c.calibration_offset\nFROM sensor_readings r\nJOIN sensor_calibrations c ON r.sensor_id = c.sensor_id AND r.reading_time = c.calibrated_at\nWHERE r.sensor_id BETWEEN 100 AND 200;",
    "initialCost": 380000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "Hash Join -> Hash table build overflows memory and forces disk spill",
    "businessContext": "Industrial monitoring compares 25 million sensor readings against calibration logs. Hash join requires 800MB RAM, spilling to disk during batch pipeline processing.",
    "strategies": [
      {
        "id": "strat_merge_join_presorted_optimal",
        "title": "Composite B-Trees on Both Tables to Enable Zero-Memory Merge Join",
        "sqlCommand": "CREATE INDEX idx_readings_sensor_time ON sensor_readings(sensor_id, reading_time);\nCREATE INDEX idx_calibrations_sensor_time ON sensor_calibrations(sensor_id, calibrated_at);",
        "isOptimal": true,
        "resultingCost": 48.0,
        "resultingLatencyMs": 12.0,
        "executionPlanSummary": "Merge Join using idx_readings_sensor_time & idx_calibrations_sensor_time -> 0 Disk Spill, O(1) Memory",
        "engineExplanation": "Masterpiece! When both input tables have B-Tree indexes matching the join keys (sensor_id, reading_time), the database reads both streams concurrently in sorted order using a Merge Join, requiring zero sorting and zero hash memory!"
      },
      {
        "id": "strat_increase_work_mem_hash",
        "title": "Increase work_mem to 1GB for Hash Join",
        "sqlCommand": "SET work_mem = '1GB';",
        "isOptimal": false,
        "resultingCost": 180000,
        "resultingLatencyMs": 1400,
        "executionPlanSummary": "In-Memory Hash Join -> Fast, but consumes massive memory per query",
        "engineExplanation": "Consumes 1GB of memory per query. Under concurrent pipeline execution, this causes server memory exhaustion."
      },
      {
        "id": "strat_single_sensor_index",
        "title": "Index sensor_id only on both tables",
        "sqlCommand": "CREATE INDEX idx_r_s ON sensor_readings(sensor_id); CREATE INDEX idx_c_s ON sensor_calibrations(sensor_id);",
        "isOptimal": false,
        "resultingCost": 120000,
        "resultingLatencyMs": 1600,
        "executionPlanSummary": "Still requires sorting on reading_time to evaluate second join key",
        "engineExplanation": "Without reading_time in the index, the inputs are not pre-sorted for the composite join condition."
      }
    ],
    "keyTakeaway": "Merge Joins are the most memory-efficient join algorithm. When both tables have composite B-Tree indexes matching the join keys in order, the engine streams joins with zero memory allocation."
  },

  // ── Scenario 65: Dashboard Metric Aggregation with FILTER vs CASE WHEN (Mid) ──
  {
    "id": "filtered_aggregates_vs_case_when",
    "title": "Dashboard Metric Aggregation with FILTER vs CASE WHEN",
    "difficulty": "Mid",
    "category": "aggregations",
    "categoryLabel": "Filtered Aggregations",
    "tableName": "ecommerce_orders",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.8 GB on disk",
    "slowQuery": "SELECT \n    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,\n    SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as completed_revenue,\n    COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded_orders\nFROM ecommerce_orders\nWHERE merchant_id = 401;",
    "initialCost": 92000,
    "initialLatencyMs": 1150,
    "initialPlanSummary": "Bitmap Heap Scan on merchant_id -> Evaluates 3 CASE WHEN expressions per row across 250,000 rows",
    "businessContext": "Merchant analytics dashboard calculates KPIs. Evaluating conditional CASE WHEN expressions in CPU loops for 250,000 rows slows down API response times.",
    "strategies": [
      {
        "id": "strat_filter_clause_covering_optimal",
        "title": "Use SQL Standard FILTER (WHERE ...) with Covering Index",
        "sqlCommand": "CREATE INDEX idx_orders_merchant_kpi \nON ecommerce_orders(merchant_id) \nINCLUDE (status, total_amount);\n\n-- Query:\nSELECT \n    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_orders,\n    SUM(total_amount) FILTER (WHERE status = 'COMPLETED') as completed_revenue,\n    COUNT(*) FILTER (WHERE status = 'REFUNDED') as refunded_orders\nFROM ecommerce_orders\nWHERE merchant_id = 401;",
        "isOptimal": true,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Only Scan using idx_orders_merchant_kpi -> Filter evaluated in-stream without table reads",
        "engineExplanation": "Winner! The standard SQL FILTER (WHERE ...) clause is optimized directly in PostgreSQL aggregation nodes. Combined with an INCLUDE covering index, the query runs 100% in index memory in 1.4ms."
      },
      {
        "id": "strat_three_separate_queries",
        "title": "Split into 3 Separate Queries with WHERE status = ...",
        "sqlCommand": "SELECT COUNT(*)... WHERE status = 'COMPLETED'; SELECT SUM()...; SELECT COUNT()...;",
        "isOptimal": false,
        "resultingCost": 35.0,
        "resultingLatencyMs": 5.2,
        "executionPlanSummary": "3 Separate Database Roundtrips and Index Scans",
        "engineExplanation": "Three separate queries require 3 network round-trips and 3 index scans instead of a single consolidated pass."
      },
      {
        "id": "strat_group_by_status",
        "title": "GROUP BY status and Pivot in Application Code",
        "sqlCommand": "SELECT status, COUNT(*), SUM(total_amount) FROM ecommerce_orders WHERE merchant_id = 401 GROUP BY status;",
        "isOptimal": false,
        "resultingCost": 45.0,
        "resultingLatencyMs": 6.8,
        "executionPlanSummary": "Requires application mapping and fails to return zeros for empty statuses",
        "engineExplanation": "GROUP BY omits statuses with 0 orders, requiring complex fallback null-handling in frontend clients."
      }
    ],
    "keyTakeaway": "Use standard SQL FILTER (WHERE ...) instead of SUM(CASE WHEN ...) for conditional metrics. Combined with covering indexes, it streams KPI aggregations directly from B-Tree leaf pages."
  },

  // ── Scenario 66: Deep JSONB Array Search and Subscripting (Mid) ──
  {
    "id": "jsonb_path_query_subscripting",
    "title": "Deep JSONB Array Search and Subscripting",
    "difficulty": "Mid",
    "category": "jsonb",
    "categoryLabel": "JSONB & Path Queries",
    "tableName": "customer_orders",
    "rowCount": "6,000,000 rows",
    "tableSizeDisk": "3.5 GB on disk",
    "slowQuery": "SELECT order_id, payload->'shipping'->>'postal_code' as zip\nFROM customer_orders\nWHERE payload->'shipping'->>'postal_code' = '98101';",
    "initialCost": 165000,
    "initialLatencyMs": 2100,
    "initialPlanSummary": "Seq Scan on customer_orders (cost=0.00..165000.00) -> Unpacks JSONB payload per row",
    "businessContext": "Logistics hub filters shipments by destination postal code stored inside a JSONB document. Query unpacks 6 million JSON documents on every zip code batch run.",
    "strategies": [
      {
        "id": "strat_expression_jsonb_text_optimal",
        "title": "B-Tree Expression Index on Specific JSON Path: (payload->'shipping'->>'postal_code')",
        "sqlCommand": "CREATE INDEX idx_orders_shipping_zip \nON customer_orders ((payload->'shipping'->>'postal_code'));",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan using idx_orders_shipping_zip -> Instant B-Tree equality seek in 0.7ms",
        "engineExplanation": "Winner! If queries always filter on a specific nested JSON field, an expression B-Tree index on that exact path is 10x faster and 80% smaller than a generic GIN index across the entire JSON document."
      },
      {
        "id": "strat_full_gin_index",
        "title": "Full GIN Index on payload",
        "sqlCommand": "CREATE INDEX idx_orders_payload_gin ON customer_orders USING GIN (payload);",
        "isOptimal": false,
        "resultingCost": 45.0,
        "resultingLatencyMs": 8.5,
        "executionPlanSummary": "Bitmap Index Scan on GIN (Index is 1.8 GB on disk vs 45 MB B-Tree)",
        "engineExplanation": "GIN index works, but indexing every single key in the 3.5 GB payload bloats index size to 1.8 GB and slows down every order INSERT."
      },
      {
        "id": "strat_cast_jsonb_text",
        "title": "Use payload::text LIKE '%\"postal_code\": \"98101\"%'",
        "sqlCommand": "SELECT ... WHERE payload::text LIKE '%\"postal_code\": \"98101\"%';",
        "isOptimal": false,
        "resultingCost": 220000,
        "resultingLatencyMs": 2900,
        "executionPlanSummary": "Seq Scan with full string pattern search -> Slow and brittle",
        "engineExplanation": "Casting to text is slow, brittle against spacing variations, and prevents index seeks."
      }
    ],
    "keyTakeaway": "For hot, frequent queries on specific nested JSON attributes, prefer a targeted B-Tree Expression Index on (json_col->'field'->>'subfield') over a heavy full-document GIN index."
  },

  // ── Scenario 67: Multi-Dimensional Sales Report with GROUP BY ROLLUP (Mid) ──
  {
    "id": "rollup_cube_dimensional_report",
    "title": "Multi-Dimensional Sales Report with GROUP BY ROLLUP",
    "difficulty": "Mid",
    "category": "olap",
    "categoryLabel": "OLAP & Grouping Sets",
    "tableName": "sales_transactions",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "4.1 GB on disk",
    "slowQuery": "SELECT region, country, city, SUM(sale_amount)\nFROM sales_transactions\nWHERE sale_date >= '2026-01-01'\nGROUP BY ROLLUP (region, country, city);",
    "initialCost": 395000,
    "initialLatencyMs": 5400,
    "initialPlanSummary": "Seq Scan -> Sort -> MixedAggregate (ROLLUP 3 levels across 15M rows in memory)",
    "businessContext": "Executive dashboard generates hierarchical sales rollups (Region -> Country -> City -> Total). Query sorts 15 million rows off disk on every dashboard reload.",
    "strategies": [
      {
        "id": "strat_covering_rollup_hierarchy_optimal",
        "title": "Composite Covering Index Matching Rollup Hierarchy: (sale_date, region, country, city) INCLUDE (sale_amount)",
        "sqlCommand": "CREATE INDEX idx_sales_rollup_hierarchy \nON sales_transactions(sale_date, region, country, city) \nINCLUDE (sale_amount);",
        "isOptimal": true,
        "resultingCost": 45.0,
        "resultingLatencyMs": 14.0,
        "executionPlanSummary": "Index Only Scan -> MixedAggregate streams pre-sorted hierarchy without disk sort",
        "engineExplanation": "Winner! Because the index delivers rows matching the ROLLUP hierarchy (region, country, city), the database streams aggregations directly from the index leaves, eliminating 100% of external disk filesorts."
      },
      {
        "id": "strat_union_three_queries",
        "title": "Rewrite to 3 Separate Queries with UNION ALL",
        "sqlCommand": "SELECT region, country, city ... GROUP BY region, country, city UNION ALL SELECT region, country ...",
        "isOptimal": false,
        "resultingCost": 850000,
        "resultingLatencyMs": 9200,
        "executionPlanSummary": "Scans sales_transactions table 3 separate times!",
        "engineExplanation": "Rewriting ROLLUP into separate UNION queries scans the 15M table three times instead of doing a single hierarchical pass."
      },
      {
        "id": "strat_index_city_only",
        "title": "Index on city only",
        "sqlCommand": "CREATE INDEX idx_sales_city ON sales_transactions(city);",
        "isOptimal": false,
        "resultingCost": 395000,
        "resultingLatencyMs": 5400,
        "executionPlanSummary": "Seq Scan -> City is at the bottom of the hierarchy; ignored by ROLLUP prefix",
        "engineExplanation": "City is the finest grain in the hierarchy and cannot satisfy region/country groupings."
      }
    ],
    "keyTakeaway": "ROLLUP computes hierarchical subtotals. Aligning composite indexes to match the exact hierarchy (Root -> Parent -> Child) enables the engine to aggregate in a single pre-sorted stream."
  },

  // ── Scenario 68: MySQL In-Memory Temporary Table Disk Spill (Mid) ──
  {
    "id": "in_memory_temporary_table_overflow",
    "title": "MySQL In-Memory Temporary Table Disk Spill",
    "difficulty": "Mid",
    "category": "temp_tables",
    "categoryLabel": "Temporary Tables & Memory Ceilings",
    "tableName": "web_analytics",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.2 GB on disk",
    "slowQuery": "SELECT user_ip, COUNT(DISTINCT session_id), GROUP_CONCAT(page_url SEPARATOR ', ')\nFROM web_analytics\nWHERE event_date = '2026-03-24'\nGROUP BY user_ip;",
    "initialCost": 320000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "Using temporary; Using filesort -> Temp table converted from Memory to InnoDB on disk (Created_tmp_disk_tables +1)",
    "businessContext": "Daily IP analysis query in MySQL 8.0: The temporary table exceeds tmp_table_size (16MB), converting from fast RAM to an on-disk InnoDB table and freezing server I/O.",
    "strategies": [
      {
        "id": "strat_composite_ip_session_optimal",
        "title": "Composite Index to Eliminate Temporary Table: (event_date, user_ip, session_id)",
        "sqlCommand": "CREATE INDEX idx_analytics_date_ip_sess \nON web_analytics(event_date, user_ip, session_id) \nINCLUDE (page_url);",
        "isOptimal": true,
        "resultingCost": 25.0,
        "resultingLatencyMs": 6.8,
        "executionPlanSummary": "Index Only Scan -> Zero temporary tables created (Using index for group-by)",
        "engineExplanation": "Champion! Because the index delivers rows already grouped by user_ip for that date, MySQL aggregates rows on the fly without allocating any temporary tables or spilling to disk!"
      },
      {
        "id": "strat_increase_tmp_table_size",
        "title": "Increase tmp_table_size and max_heap_table_size to 512MB",
        "sqlCommand": "SET SESSION tmp_table_size = 536870912; SET SESSION max_heap_table_size = 536870912;",
        "isOptimal": false,
        "resultingCost": 120000,
        "resultingLatencyMs": 1400,
        "executionPlanSummary": "In-memory temp table (GROUP_CONCAT BLOB columns still force on-disk InnoDB temp table!)",
        "engineExplanation": "Gotcha! In MySQL, if a query selects BLOB or TEXT columns (like GROUP_CONCAT), MySQL cannot use in-memory MEMORY storage engine and forces an on-disk table regardless of tmp_table_size!"
      },
      {
        "id": "strat_disable_group_concat",
        "title": "Remove GROUP_CONCAT and select only COUNT",
        "sqlCommand": "SELECT user_ip, COUNT(DISTINCT session_id) FROM web_analytics ...",
        "isOptimal": false,
        "resultingCost": 180000,
        "resultingLatencyMs": 2200,
        "executionPlanSummary": "Still creates temporary table without index",
        "engineExplanation": "COUNT(DISTINCT) still requires a temporary table without an index."
      }
    ],
    "keyTakeaway": "TEXT/BLOB columns or GROUP_CONCAT force MySQL temporary tables to disk. Eliminating temporary tables entirely by providing an index matching GROUP BY columns is 100x faster than bumping buffer sizes."
  },

  // ── Scenario 69: Dropping Suspected Unused Index Safely with INVISIBLE (Mid) ──
  {
    "id": "mysql_invisible_index_testing",
    "title": "Dropping Suspected Unused Index Safely with INVISIBLE",
    "difficulty": "Mid",
    "category": "database_operations",
    "categoryLabel": "Database Operations & Tuning",
    "tableName": "customer_accounts",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "5.4 GB on disk",
    "slowQuery": "-- DBA wants to drop suspected unused 2.1 GB index idx_old_legacy:\nDROP INDEX idx_old_legacy ON customer_accounts;",
    "initialCost": 0.0,
    "initialLatencyMs": 0.0,
    "initialPlanSummary": "Outage Risk: If a critical background cron job relies on this index, dropping it crashes production at midnight!",
    "businessContext": "Table has 12 indexes consuming 5.4 GB. DBA suspects idx_old_legacy is unused, but dropping an index on a 15M row table takes 20 minutes to rebuild if proven wrong.",
    "strategies": [
      {
        "id": "strat_invisible_index_optimal",
        "title": "Make Index INVISIBLE First to Test Optimizer Behavior Safely",
        "sqlCommand": "-- Soft-disable index from query planner without dropping data:\nALTER TABLE customer_accounts ALTER INDEX idx_old_legacy INVISIBLE;\n-- Monitor sys.schema_unused_indexes for 7 days before issuing DROP INDEX!",
        "isOptimal": true,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Optimizer ignores index for queries, but index continues updating in background (Can revert in 1ms!)",
        "engineExplanation": "Masterpiece! In MySQL 8.0, an INVISIBLE index is hidden from the query optimizer while still being maintained during writes. If any production query regresses, running ALTER INDEX ... VISIBLE restores it instantly in 0.001s without a 20-minute rebuild!"
      },
      {
        "id": "strat_drop_index_immediately",
        "title": "Issue DROP INDEX immediately during maintenance window",
        "sqlCommand": "DROP INDEX idx_old_legacy ON customer_accounts;",
        "isOptimal": false,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "High risk: If a monthly billing query needs it, rebuilding takes 45 minutes of heavy I/O",
        "engineExplanation": "Dangerous: Dropping an index cannot be undone without a full rebuild that saturates disk I/O."
      },
      {
        "id": "strat_rename_index",
        "title": "Rename index to idx_old_legacy_backup",
        "sqlCommand": "ALTER TABLE customer_accounts RENAME INDEX idx_old_legacy TO idx_old_legacy_backup;",
        "isOptimal": false,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Optimizer still uses the index regardless of its name",
        "engineExplanation": "Renaming an index does not hide it from the optimizer; the engine matches index columns, not index names."
      }
    ],
    "keyTakeaway": "Never drop large indexes directly in production. Mark them INVISIBLE (or use PostgreSQL hypopg / comment testing) for a full business cycle to confirm zero regressions before permanent deletion."
  },

  // ── Scenario 70: Eliminating Functional Index Overhead with CITEXT (Mid) ──
  {
    "id": "citext_case_insensitive_type",
    "title": "Eliminating Functional Index Overhead with CITEXT",
    "difficulty": "Mid",
    "category": "data_types",
    "categoryLabel": "Data Types & Extensions",
    "tableName": "auth_identities",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.1 GB on disk",
    "slowQuery": "SELECT user_id, password_hash\nFROM auth_identities\nWHERE identifier = 'john.doe@company.org';",
    "initialCost": 240000,
    "initialLatencyMs": 2800,
    "initialPlanSummary": "Seq Scan on auth_identities Filter: (lower(identifier) = '...') -> Functional index missing",
    "businessContext": "Identity provider handles millions of SSO logins. The table has an index on identifier, but case-insensitive lookups require LOWER() on every query, causing developer mistakes.",
    "strategies": [
      {
        "id": "strat_citext_extension_optimal",
        "title": "Convert Column to CITEXT (Case-Insensitive Text)",
        "sqlCommand": "CREATE EXTENSION IF NOT EXISTS citext;\nALTER TABLE auth_identities ALTER COLUMN identifier TYPE citext;\nCREATE UNIQUE INDEX idx_auth_ident_citext ON auth_identities(identifier);\n\n-- Natural queries now automatically seek B-Tree case-insensitively without LOWER()!",
        "isOptimal": true,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan using idx_auth_ident_citext -> Standard B-Tree seek with built-in case folding",
        "engineExplanation": "Winner! CITEXT automatically calls lower() internally for all comparisons and B-Tree index operations. Developers write natural SQL queries without LOWER(), preventing human errors and index misses permanently."
      },
      {
        "id": "strat_functional_index_only",
        "title": "Create Expression Index on LOWER(identifier)",
        "sqlCommand": "CREATE UNIQUE INDEX idx_auth_lower ON auth_identities(LOWER(identifier));",
        "isOptimal": false,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Works, but fails if any developer forgets to write LOWER() in a new query",
        "engineExplanation": "Fragile: If any developer or third-party ORM issues WHERE identifier = '...', the functional index is ignored, causing an accidental table scan."
      },
      {
        "id": "strat_ilike_scan",
        "title": "Use identifier ILIKE 'john.doe@company.org'",
        "sqlCommand": "SELECT ... WHERE identifier ILIKE '...';",
        "isOptimal": false,
        "resultingCost": 240000,
        "resultingLatencyMs": 2900,
        "executionPlanSummary": "Seq Scan -> ILIKE does not use standard B-Tree index",
        "engineExplanation": "ILIKE triggers a full table scan on standard B-tree columns."
      }
    ],
    "keyTakeaway": "In PostgreSQL, use the CITEXT extension for columns that require universal case-insensitive uniqueness (emails, usernames). It natively routes standard queries to B-Tree indexes without LOWER() wrapper traps."
  },

  // ── Scenario 71: Deconstructing 6-Table Monolith Query in Microservices (Mid) ──
  {
    "id": "two_step_application_join",
    "title": "Deconstructing 6-Table Monolith Query in Microservices",
    "difficulty": "Mid",
    "category": "application_joins",
    "categoryLabel": "Application-Side Joins",
    "tableName": "orders",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "8.5 GB across 6 tables",
    "slowQuery": "SELECT o.order_id, u.username, p.payment_method, s.carrier, i.item_name, pr.price\nFROM orders o\nJOIN users u ON o.user_id = u.user_id\nJOIN payments p ON o.order_id = p.order_id\nJOIN shipments s ON o.order_id = s.order_id\nJOIN order_items i ON o.order_id = i.order_id\nJOIN products pr ON i.product_id = pr.product_id\nWHERE o.user_id = 9182\nLIMIT 20;",
    "initialCost": 32000,
    "initialLatencyMs": 480,
    "initialPlanSummary": "Nested Loop across 6 tables -> Cartesian network row multiplication (120 duplicate user/payment columns)",
    "businessContext": "User order history screen: Joining 6 tables duplicates order metadata across every line item sent over the network, prevents caching individual entities in Redis, and blocks database sharding.",
    "strategies": [
      {
        "id": "strat_two_step_app_join_optimal",
        "title": "Application-Side 2-Step Batch Ingestion with In-Memory Stitching",
        "sqlCommand": "-- Query 1: Fetch 20 orders for user (0.8ms):\nSELECT order_id, user_id, status FROM orders WHERE user_id = 9182 LIMIT 20;\n-- Query 2: Batch fetch items for those 20 order IDs (0.9ms):\nSELECT order_id, product_id, quantity FROM order_items WHERE order_id IN (...20 ids...);\n-- Stitch in Java/Go application memory with HashMap!",
        "isOptimal": true,
        "resultingCost": 8.0,
        "resultingLatencyMs": 1.7,
        "executionPlanSummary": "2x Primary Key Index Seeks -> 1.7ms total, 90% less network payload, 100% cacheable",
        "engineExplanation": "Architecture Winner! Two simple queries hitting Primary Keys complete in 1.7ms total. It eliminates Cartesian row duplication over the wire, allows caching individual products in Redis, and supports partitioned databases."
      },
      {
        "id": "strat_create_giant_materialized_view",
        "title": "Create Giant 6-Table Materialized View",
        "sqlCommand": "CREATE MATERIALIZED VIEW mv_all_order_data AS SELECT ...",
        "isOptimal": false,
        "resultingCost": 4.0,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Consumes 25 GB disk; refreshing view blocks database updates",
        "engineExplanation": "Heavy maintenance bloat: Materializing 6 joined tables creates massive write amplification and requires costly periodic refreshes."
      },
      {
        "id": "strat_loop_single_item_queries",
        "title": "Fetch Orders, then Loop Each Order to Fetch Line Items One-by-One",
        "sqlCommand": "for order in orders: SELECT * FROM order_items WHERE order_id = order.id",
        "isOptimal": false,
        "resultingCost": 1500,
        "resultingLatencyMs": 35,
        "executionPlanSummary": "N+1 Query Pattern: 21 network round-trips",
        "engineExplanation": "Classic N+1 query bug: Running queries in a loop multiplies network latency by 20x."
      }
    ],
    "keyTakeaway": "Massive multi-table joins harm caching, inflate network payloads, and break sharding. High-scale architectures split them into 2-step batch queries (SELECT ... WHERE id IN (...)) stitched in application memory."
  },

  // ── Scenario 72: Bulk Account Expiration Deadlock Under Concurrent Traffic (Mid) ──
  {
    "id": "deterministic_id_sort_update",
    "title": "Bulk Account Expiration Deadlock Under Concurrent Traffic",
    "difficulty": "Mid",
    "category": "deadlocks",
    "categoryLabel": "Concurrency & Lock Ordering",
    "tableName": "user_subscriptions",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.1 GB on disk",
    "slowQuery": "-- Executed concurrently by 4 background workers:\nUPDATE user_subscriptions\nSET status = 'EXPIRED'\nWHERE status = 'ACTIVE' AND expires_at < NOW()\nLIMIT 500;",
    "initialCost": 8500,
    "initialLatencyMs": 450,
    "initialPlanSummary": "Deadlock found when trying to get lock; try restarting transaction (Error 1213)",
    "businessContext": "Subscription reaper cron runs with 4 parallel worker threads to expire lapsed memberships. Workers acquire gap locks and row locks in random order, throwing deadlocks every 10 seconds.",
    "strategies": [
      {
        "id": "strat_deterministic_id_sort_optimal",
        "title": "3-Step Deterministic Pattern: SELECT id -> Sort Ascending in Memory -> Update by Primary Key",
        "sqlCommand": "-- Step 1: Read IDs read-only:\nSELECT id FROM user_subscriptions WHERE status = 'ACTIVE' AND expires_at < NOW() LIMIT 500;\n-- Step 2: Sort IDs in application memory: [12, 45, 98, 140...]\n-- Step 3: Mutate strictly in ascending PK order:\nUPDATE user_subscriptions SET status = 'EXPIRED' WHERE id IN (12, 45, 98, 140...);",
        "isOptimal": true,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Exact Record Locks on Primary Key -> Zero Gap Locks, Zero Deadlocks!",
        "engineExplanation": "Masterclass! In MySQL InnoDB, deadlocks occur when threads lock records in reverse physical order. Sorting IDs in ascending order in application memory guarantees all threads acquire locks in identical physical sequence, mathematically eliminating deadlocks!"
      },
      {
        "id": "strat_single_worker_serial",
        "title": "Reduce to 1 Single Threaded Worker",
        "sqlCommand": "/* Run cron with concurrency = 1 */",
        "isOptimal": false,
        "resultingCost": 8500,
        "resultingLatencyMs": 4500,
        "executionPlanSummary": "Eliminates deadlocks, but processing 500,000 expired rows takes hours",
        "engineExplanation": "Single-threading avoids deadlocks, but cripples background worker processing throughput."
      },
      {
        "id": "strat_set_innodb_lock_wait_timeout",
        "title": "Reduce innodb_lock_wait_timeout to 1 second",
        "sqlCommand": "SET SESSION innodb_lock_wait_timeout = 1;",
        "isOptimal": false,
        "resultingCost": 8500,
        "resultingLatencyMs": 1000,
        "executionPlanSummary": "Aborts queries faster on lock timeout, but does not stop deadlocks",
        "engineExplanation": "Failing faster does not fix the root cause of cyclic lock acquisition dependencies."
      }
    ],
    "keyTakeaway": "To prevent deadlocks during bulk updates, never issue UPDATE ... WHERE range LIMIT. Use the 3-step deterministic pattern: read IDs, sort them in ascending numerical order in memory, and update strictly by Primary Key."
  },

  // ── Scenario 73: Job Queue Starvation & Deadlocks Under Concurrent Workers (Senior) ──
  {
    "id": "select_for_update_skip_locked_queue",
    "title": "Job Queue Starvation & Deadlocks Under Concurrent Workers",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "task_queue",
    "rowCount": "1,500,000 pending tasks",
    "tableSizeDisk": "850 MB on disk",
    "slowQuery": "-- 50 worker threads executing simultaneously:\nSELECT task_id, payload, retry_count\nFROM task_queue\nWHERE status = 'PENDING'\nORDER BY priority DESC, created_at ASC\nLIMIT 10\nFOR UPDATE;",
    "initialCost": 32000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "LockRows -> Sort -> Index Scan on idx_status_prio (Contention: 49 threads blocked on same row locks)",
    "businessContext": "Background processing pipeline with 50 worker pods processing payments. Worker throughput degrades from 10,000 tasks/min to 80 tasks/min due to massive row-lock queues.",
    "strategies": [
      {
        "id": "strat_skip_locked_optimal",
        "title": "Use FOR UPDATE SKIP LOCKED with Partial Composite Index",
        "sqlCommand": "CREATE INDEX idx_queue_pending ON task_queue(priority DESC, created_at ASC)\nWHERE status = 'PENDING';\n\nSELECT task_id, payload, retry_count\nFROM task_queue\nWHERE status = 'PENDING'\nORDER BY priority DESC, created_at ASC\nLIMIT 10\nFOR UPDATE SKIP LOCKED;",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Limit -> LockRows (Skip Locked) -> Index Scan on idx_queue_pending (Zero lock waiting)",
        "engineExplanation": "Winner! FOR UPDATE SKIP LOCKED tells the storage engine to immediately bypass any rows currently locked by other transactions instead of waiting. Combined with a partial index matching the PENDING filter, all 50 workers grab independent batches concurrently without lock queue delays."
      },
      {
        "id": "strat_increase_lock_timeout",
        "title": "Increase lock_timeout to 60s to prevent transaction failures",
        "sqlCommand": "SET lock_timeout = '60s'; SELECT ... FOR UPDATE;",
        "isOptimal": false,
        "resultingCost": 32000,
        "resultingLatencyMs": 12500,
        "executionPlanSummary": "LockRows -> Massive thread wait queues and thread pool exhaustion in application servers",
        "engineExplanation": "Disastrous! Increasing timeout doesn't reduce lock contention; it forces worker threads to sleep longer waiting on locks, exhausting the application HikariCP connection pool."
      },
      {
        "id": "strat_random_order_limit",
        "title": "Add ORDER BY RANDOM() to distribute worker row selection",
        "sqlCommand": "SELECT task_id FROM task_queue WHERE status = 'PENDING' ORDER BY RANDOM() LIMIT 10 FOR UPDATE;",
        "isOptimal": false,
        "resultingCost": 185000,
        "resultingLatencyMs": 6200,
        "executionPlanSummary": "Seq Scan -> Sort on random() -> Full table scan and catastrophic CPU thrashing",
        "engineExplanation": "ORDER BY RANDOM() invalidates all indexes, forcing a sequential table scan of 1.5 million rows and in-memory sort on every single poll invocation."
      }
    ],
    "keyTakeaway": "In high-throughput database-backed job queues, plain SELECT FOR UPDATE causes serialization bottlenecks. Always use FOR UPDATE SKIP LOCKED paired with a partial index on status = 'PENDING'."
  },

  // ── Scenario 74: Bank Account Balance Deadlock Cascade During Double-Spend (Senior) ──
  {
    "id": "select_for_update_nowait_bank",
    "title": "Bank Account Balance Deadlock Cascade During Double-Spend",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "bank_accounts",
    "rowCount": "20,000,000 accounts",
    "tableSizeDisk": "3.8 GB on disk",
    "slowQuery": "-- Core banking ledger transfer between Account A (id=101) and Account B (id=202):\nBEGIN;\nSELECT balance FROM bank_accounts WHERE account_id = 101 FOR UPDATE;\n-- Concurrent tx running transfer from 202 to 101 locks 202 then waits for 101!\nSELECT balance FROM bank_accounts WHERE account_id = 202 FOR UPDATE;",
    "initialCost": 8.4,
    "initialLatencyMs": 1000,
    "initialPlanSummary": "LockRows -> Deadlock detected: Process 4125 waits on ExclusiveLock on tuple (0, 12); Process 4128 waits on (0, 18)",
    "businessContext": "Two peer-to-peer transfers between Alice and Bob occur within 5 milliseconds in opposite directions. Both transactions freeze and roll back with error 40P01 (deadlock detected).",
    "strategies": [
      {
        "id": "strat_ordered_locking_nowait_optimal",
        "title": "Deterministic Key Ordering with NOWAIT or Advisory Lock",
        "sqlCommand": "-- Enforce strict lock ordering: LEAST(id1, id2) followed by GREATEST(id1, id2):\nSELECT account_id, balance \nFROM bank_accounts \nWHERE account_id IN (101, 202) \nORDER BY account_id ASC \nFOR UPDATE NOWAIT;",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan on pk_bank_accounts -> LockRows in sorted order (Deadlock mathematically impossible)",
        "engineExplanation": "Winner! Deadlocks require a cyclic lock wait graph (A waits on B while B waits on A). By enforcing strict alphabetical/numerical lock acquisition order across all application code, cyclic dependency is impossible. NOWAIT ensures immediate fail-fast retry if another tx is modifying either account."
      },
      {
        "id": "strat_disable_deadlock_detector",
        "title": "Disable deadlock_timeout to prevent error 40P01",
        "sqlCommand": "SET deadlock_timeout = '600s';",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "LockRows -> Permanent unmonitored hang until TCP socket timeout",
        "engineExplanation": "Deadlock detection is not the cause of the problem\u2014it is the emergency brake! Lengthening deadlock_timeout causes transactions to freeze indefinitely until clients timeout."
      },
      {
        "id": "strat_switch_read_uncommitted",
        "title": "Set Transaction Isolation Level to READ UNCOMMITTED",
        "sqlCommand": "SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT balance ...",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Unsafe Dirty Reads -> Balance corruption and double-spending vulnerability",
        "engineExplanation": "Catastrophic! Financial ledgers require strict ACID guarantees. READ UNCOMMITTED allows dirty reads and race conditions where money can be withdrawn simultaneously twice."
      }
    ],
    "keyTakeaway": "Deadlocks between concurrent multi-row updates are prevented architecturally by sorting target primary keys before acquiring exclusive locks (e.g. ORDER BY id ASC FOR UPDATE)."
  },

  // ── Scenario 75: InnoDB Gap Lock and Insert Intention Deadlock on Missing Rows (Senior) ──
  {
    "id": "gap_lock_insert_intention_deadlock",
    "title": "InnoDB Gap Lock and Insert Intention Deadlock on Missing Rows",
    "difficulty": "Senior",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "user_wallets",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "1.2 GB on disk",
    "slowQuery": "-- Transaction 1 (Thread A):\nSELECT * FROM user_wallets WHERE user_id = 9999999 FOR UPDATE; -- Record does not exist!\nINSERT INTO user_wallets (user_id, balance) VALUES (9999999, 100.00);\n\n-- Concurrent Transaction 2 (Thread B):\nSELECT * FROM user_wallets WHERE user_id = 9999998 FOR UPDATE; -- Record does not exist!\nINSERT INTO user_wallets (user_id, balance) VALUES (9999998, 50.00);",
    "initialCost": 12.0,
    "initialLatencyMs": 1500,
    "initialPlanSummary": "InnoDB Lock System: T1 holds GAP lock on (5000000, supremum). T2 holds GAP lock on same gap. Both request INSERT INTENTION lock -> DEADLOCK!",
    "businessContext": "User onboarding microservice creates initial wallet accounts. When users register in parallel, transactions deadlock and roll back with 'Deadlock found when trying to get lock; try restarting transaction'.",
    "strategies": [
      {
        "id": "strat_read_committed_or_upsert_optimal",
        "title": "Switch to READ COMMITTED Isolation & INSERT ... ON DUPLICATE KEY UPDATE",
        "sqlCommand": "-- 1. Use READ COMMITTED (Gap locks are disabled for simple searches):\nSET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;\n\n-- 2. Atomic UPSERT avoiding pre-checking SELECT FOR UPDATE:\nINSERT INTO user_wallets (user_id, balance) VALUES (9999999, 100.00)\nON DUPLICATE KEY UPDATE updated_at = NOW();",
        "isOptimal": true,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Insert on duplicate key -> Exclusive Record Lock (No Gap Lock, zero deadlock)",
        "engineExplanation": "Winner! In REPEATABLE READ, SELECT FOR UPDATE on a nonexistent key acquires a Gap Lock spanning to the next record. Two transactions can both hold overlapping Gap locks, but when both try to insert, each needs an Insert Intention lock blocked by the other's Gap lock! In READ COMMITTED, gap locks are disabled, and atomic UPSERT eliminates the race condition."
      },
      {
        "id": "strat_add_sleep_retry",
        "title": "Wrap in application sleep and 10x retry loop",
        "sqlCommand": "-- Application Java/Go retry with Thread.sleep(500);",
        "isOptimal": false,
        "resultingCost": 12.0,
        "resultingLatencyMs": 3500,
        "executionPlanSummary": "Repeated gap lock collisions and elevated database connection count",
        "engineExplanation": "Retrying mask the symptom while compounding load. Under traffic spikes, retry loops amplify contention into a complete lock cascade."
      },
      {
        "id": "strat_drop_unique_constraint",
        "title": "Drop the UNIQUE index on user_id to prevent locking",
        "sqlCommand": "ALTER TABLE user_wallets DROP INDEX uq_user_id;",
        "isOptimal": false,
        "resultingCost": 100.0,
        "resultingLatencyMs": 15.0,
        "executionPlanSummary": "Table scan without uniqueness verification -> Duplicate wallet creation",
        "engineExplanation": "Catastrophic! Dropping uniqueness allows duplicate wallets for the same user, corrupting core accounting records."
      }
    ],
    "keyTakeaway": "In MySQL REPEATABLE READ, SELECT FOR UPDATE on missing rows generates Gap Locks. Two transactions can share a Gap Lock, but their subsequent INSERTs into that gap deadlock on Insert Intention locks. Use READ COMMITTED or atomic UPSERT."
  },

  // ── Scenario 76: B-Tree Bloat vs BRIN Index for 500M Row Time-Series Telemetry (Senior) ──
  {
    "id": "brin_index_telemetry_timeseries",
    "title": "B-Tree Bloat vs BRIN Index for 500M Row Time-Series Telemetry",
    "difficulty": "Senior",
    "category": "indexing",
    "categoryLabel": "Specialized Index Types",
    "tableName": "device_telemetry",
    "rowCount": "500,000,000 rows",
    "tableSizeDisk": "65 GB table / 22 GB B-Tree Index",
    "slowQuery": "SELECT device_id, AVG(cpu_temperature), MAX(memory_usage)\nFROM device_telemetry\nWHERE recorded_at >= '2026-03-01 00:00:00' \n  AND recorded_at < '2026-03-02 00:00:00'\nGROUP BY device_id;",
    "initialCost": 850000,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Bitmap Heap Scan -> Bitmap Index Scan on idx_recorded_at_btree (22 GB index exceeds RAM cache, massive random NVMe reads)",
    "businessContext": "IoT device telemetry database receives 10,000 events/sec. The B-Tree index on recorded_at has swollen to 22 GB, blowing out the buffer pool and causing severe write amplification.",
    "strategies": [
      {
        "id": "strat_brin_index_optimal",
        "title": "Replace B-Tree with BRIN (Block Range Index) on recorded_at",
        "sqlCommand": "DROP INDEX idx_recorded_at_btree;\nCREATE INDEX idx_telemetry_recorded_at_brin \nON device_telemetry USING BRIN (recorded_at) \nWITH (pages_per_range = 128);",
        "isOptimal": true,
        "resultingCost": 42000,
        "resultingLatencyMs": 180,
        "executionPlanSummary": "Bitmap Heap Scan -> Bitmap Index Scan on idx_telemetry_recorded_at_brin (Index size: 1.8 MB vs 22 GB!)",
        "engineExplanation": "Winner! Time-series data is naturally appended sequentially, resulting in near-perfect physical correlation between disk pages and recorded_at timestamps. BRIN stores only min/max values per 128 pages. The index drops from 22 GB to 1.8 MB (99.9% reduction), fits permanently in CPU cache, and eliminates B-Tree page split churn during inserts."
      },
      {
        "id": "strat_hash_index_telemetry",
        "title": "Convert to HASH Index on recorded_at",
        "sqlCommand": "CREATE INDEX idx_telemetry_hash ON device_telemetry USING HASH(recorded_at);",
        "isOptimal": false,
        "resultingCost": 1200000,
        "resultingLatencyMs": 14000,
        "executionPlanSummary": "Seq Scan -> Hash indexes do not support range operators (>= and <)",
        "engineExplanation": "Hash indexes only support equality operators (=). The query optimizer ignores the hash index completely for timestamp ranges, reverting to a 65 GB sequential scan."
      },
      {
        "id": "strat_unlogged_btree_table",
        "title": "Rebuild B-Tree with fillfactor = 50",
        "sqlCommand": "ALTER INDEX idx_recorded_at_btree SET (fillfactor = 50); REINDEX INDEX idx_recorded_at_btree;",
        "isOptimal": false,
        "resultingCost": 920000,
        "resultingLatencyMs": 5800,
        "executionPlanSummary": "Index bloats from 22 GB to 44 GB, increasing disk footprint and I/O thrashing",
        "engineExplanation": "Fillfactor 50 doubles the physical size of the B-Tree index to 44 GB, exacerbating buffer cache eviction and disk I/O."
      }
    ],
    "keyTakeaway": "For append-only ordered tables (time-series, logs, audit trails), PostgreSQL BRIN indexes occupy a fraction of the RAM of a B-Tree (1.8 MB vs 22 GB) with near-identical range query scan speed."
  },

  // ── Scenario 77: PostgreSQL EvalPlanQual (EPQ) Anomaly During Concurrent Updates (Senior) ──
  {
    "id": "eval_plan_qual_concurrent_update",
    "title": "PostgreSQL EvalPlanQual (EPQ) Anomaly During Concurrent Updates",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "account_orders",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.4 GB on disk",
    "slowQuery": "-- Session 1 starts processing:\nUPDATE account_orders \nSET status = 'PROCESSING', updated_at = NOW() \nWHERE order_id = 45012 AND status = 'READY';\n\n-- Concurrent Session 2 updated the same row moments earlier to status = 'CANCELLED' and committed!",
    "initialCost": 8.4,
    "initialLatencyMs": 350,
    "initialPlanSummary": "Update on account_orders -> EvalPlanQual re-evaluates WHERE clause against newer tuple version",
    "businessContext": "E-commerce order fulfillment service. Customers report cancelled orders are still being processed and shipped because concurrent updates overwrite state transitions.",
    "strategies": [
      {
        "id": "strat_state_machine_validation_optimal",
        "title": "Verify Rows Affected in Application & Use State-Machine Check Constraint",
        "sqlCommand": "-- In application DAO:\nint rowsUpdated = jdbcTemplate.update(\n  \"UPDATE account_orders SET status = 'PROCESSING', updated_at = NOW() WHERE order_id = ? AND status = 'READY'\",\n  orderId\n);\nif (rowsUpdated == 0) {\n  throw new IllegalOrderStateException(\"Order state changed concurrently; aborting processing.\");\n}",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Index Update -> EPQ detects status != 'READY' in new version, updates 0 rows cleanly",
        "engineExplanation": "Winner! In PostgreSQL READ COMMITTED mode, when an UPDATE finds a row locked by another transaction, it waits. When the blocker commits, Postgres uses EvalPlanQual to re-evaluate the WHERE clause on the new tuple version. If the new version fails the WHERE condition (e.g. status is now 'CANCELLED'), 0 rows are updated! Applications must check affected row count."
      },
      {
        "id": "strat_remove_where_status",
        "title": "Remove WHERE status = 'READY' to force unconditional overwrite",
        "sqlCommand": "UPDATE account_orders SET status = 'PROCESSING' WHERE order_id = 45012;",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Unconditional overwrite -> Overwrites CANCELLED and REFUNDED states with PROCESSING",
        "engineExplanation": "Catastrophic! Blind updates create severe data corruption by resurrecting cancelled or refunded orders."
      },
      {
        "id": "strat_use_read_uncommitted",
        "title": "Use Dirty Reads to detect concurrent writes early",
        "sqlCommand": "SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "PostgreSQL treats READ UNCOMMITTED identically to READ COMMITTED",
        "engineExplanation": "PostgreSQL does not implement dirty reads. Per SQL standard allowance, Postgres treats READ UNCOMMITTED as READ COMMITTED."
      }
    ],
    "keyTakeaway": "Under PostgreSQL READ COMMITTED, concurrent updates invoke EvalPlanQual (EPQ) to recheck WHERE conditions against the committed tuple. If the condition fails, affected rows is 0. Always verify rows_affected == 1."
  },

  // ── Scenario 78: SSI SIREAD Lock Escalation False Positives (Error 40001) (Senior) ──
  {
    "id": "ssi_siread_predicate_lock_false_positive",
    "title": "SSI SIREAD Lock Escalation False Positives (Error 40001)",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "doctor_shifts",
    "rowCount": "4,000,000 rows",
    "tableSizeDisk": "950 MB on disk",
    "slowQuery": "-- Serializable Transaction:\nBEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT count(*) FROM doctor_shifts WHERE hospital_id = 42 AND shift_date = CURRENT_DATE AND on_call = true;\n-- If count >= 2, allow doctor to leave:\nUPDATE doctor_shifts SET on_call = false WHERE doctor_id = 901 AND hospital_id = 42 AND shift_date = CURRENT_DATE;\nCOMMIT;",
    "initialCost": 28000,
    "initialLatencyMs": 850,
    "initialPlanSummary": "Seq Scan -> SIREAD lock escalates to Relation/Page level -> ERROR 40001: could not serialize access due to read/write dependencies among transactions",
    "businessContext": "Hospital scheduling portal running under SERIALIZABLE isolation to prevent write-skew. Doctors on completely different wards and dates receive 40001 serialization failures.",
    "strategies": [
      {
        "id": "strat_composite_index_siread_optimal",
        "title": "Add Precise Composite Index (hospital_id, shift_date, on_call) for Fine-Grained SIREAD Tuples",
        "sqlCommand": "CREATE INDEX idx_doctor_shifts_lookup \nON doctor_shifts(hospital_id, shift_date, on_call);\n\n-- Now the SIREAD predicate lock attaches to individual leaf tuples instead of whole pages or the whole relation!",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Only Scan on idx_doctor_shifts_lookup -> Fine-grained tuple SIREAD locks (Zero false positive conflicts)",
        "engineExplanation": "Winner! In Serializable Snapshot Isolation (SSI), if there is no index covering the predicate, PostgreSQL must perform a Sequential Scan, placing an SIREAD lock on every page or escalating to the entire relation. Any concurrent write to the table triggers false-positive serialization conflicts! Adding a matching composite index confines SIREAD locks to exact matching tuples."
      },
      {
        "id": "strat_increase_max_locks_per_tx",
        "title": "Increase max_locks_per_transaction to 4096",
        "sqlCommand": "ALTER SYSTEM SET max_locks_per_transaction = 4096;",
        "isOptimal": false,
        "resultingCost": 28000,
        "resultingLatencyMs": 830,
        "executionPlanSummary": "Sequential Scan still triggers broad page and relation level SIREAD conflicts",
        "engineExplanation": "max_locks_per_transaction sets hash table sizing but does not stop a Seq Scan from locking the entire table with SIREAD predicate locks."
      },
      {
        "id": "strat_downgrade_to_read_uncommitted",
        "title": "Downgrade isolation to READ COMMITTED without concurrency guard",
        "sqlCommand": "SET TRANSACTION ISOLATION LEVEL READ COMMITTED;",
        "isOptimal": false,
        "resultingCost": 28000,
        "resultingLatencyMs": 750,
        "executionPlanSummary": "Vulnerable to Write-Skew anomaly -> All doctors can leave shift concurrently leaving 0 on-call!",
        "engineExplanation": "Under READ COMMITTED, two concurrent doctors can both check count(*) == 2 and both proceed to leave, leaving 0 doctors on duty (classic Write-Skew anomaly)."
      }
    ],
    "keyTakeaway": "In PostgreSQL SERIALIZABLE isolation, missing indexes force Sequential Scans that place SIREAD predicate locks on entire relation pages, triggering false-positive 40001 serialization errors across unrelated transactions."
  },

  // ── Scenario 79: Orphan Logical Replication Slot Causing Catastrophic WAL Disk 100% (Senior) ──
  {
    "id": "orphan_replication_slot_disk_exhaustion",
    "title": "Orphan Logical Replication Slot Causing Catastrophic WAL Disk 100%",
    "difficulty": "Senior",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "pg_replication_slots",
    "rowCount": "1 abandoned Debezium CDC consumer slot",
    "tableSizeDisk": "2 TB WAL directory (pg_wal 100% full)",
    "slowQuery": "-- System crashes with:\n-- PANIC: could not write to log file: No space left on device\nSELECT slot_name, plugin, active, restart_lsn, pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) / (1024*1024*1024) AS lag_gb\nFROM pg_replication_slots;",
    "initialCost": 1.0,
    "initialLatencyMs": 2.0,
    "initialPlanSummary": "debezium_cdc_orders_slot | inactive | lag_gb: 1850 GB held on disk",
    "businessContext": "Primary database server running out of disk space on /var/lib/postgresql/data. Checkpointer cannot recycle WAL files because an abandoned Kafka Debezium connector went offline 3 days ago.",
    "strategies": [
      {
        "id": "strat_drop_slot_and_set_max_wal_optimal",
        "title": "Drop Orphan Slot & Configure max_slot_wal_keep_size Safety Circuit Breaker",
        "sqlCommand": "-- 1. Drop the abandoned replication slot to release pinned WAL:\nSELECT pg_drop_replication_slot('debezium_cdc_orders_slot');\n\n-- 2. Configure safety ceiling in postgresql.conf (PostgreSQL 13+):\nALTER SYSTEM SET max_slot_wal_keep_size = '50GB';\nSELECT pg_reload_conf();",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 5.0,
        "executionPlanSummary": "Slot removed -> Checkpointer immediately removes/recycles 1.8 TB of WAL files",
        "engineExplanation": "Winner! PostgreSQL replication slots guarantee that WAL is never recycled until the consumer confirms receipt. If a consumer crashes, the primary accumulates WAL until disk exhaustion. Dropping the orphan slot frees the disk. Setting max_slot_wal_keep_size (50GB) invalidates lagging slots before they crash the primary database."
      },
      {
        "id": "strat_manual_delete_wal_rm",
        "title": "Manually delete WAL files using rm -rf /var/lib/postgresql/data/pg_wal/*",
        "sqlCommand": "rm -rf /var/lib/postgresql/data/pg_wal/*",
        "isOptimal": false,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "Irreversible database corruption -> Database fails to start upon recovery",
        "engineExplanation": "NEVER manually delete files from pg_wal with rm! Deleting unapplied WAL permanently corrupts the database cluster, making crash recovery impossible without restoring from cold backup."
      },
      {
        "id": "strat_increase_wal_keep_size",
        "title": "Increase wal_keep_size to 200GB",
        "sqlCommand": "ALTER SYSTEM SET wal_keep_size = '200GB';",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "wal_keep_size forces PostgreSQL to retain MORE wal files, worsening the disk full panic",
        "engineExplanation": "Increasing wal_keep_size commands PostgreSQL to hold even more WAL, accelerating total disk saturation."
      }
    ],
    "keyTakeaway": "Replication slots protect consumer replicas but will retain WAL indefinitely until disk full. Always monitor pg_replication_slots and set max_slot_wal_keep_size as an emergency circuit breaker."
  },

  // ── Scenario 80: No-Op UPDATE Write Amplification Blowing WAL & Breaking HOT Chains (Senior) ──
  {
    "id": "noop_update_wal_amplification",
    "title": "No-Op UPDATE Write Amplification Blowing WAL & Breaking HOT Chains",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "user_profiles",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "12 GB on disk",
    "slowQuery": "-- Microservice heartbeat executes 5,000 times/second:\nUPDATE user_profiles \nSET is_active = true, last_seen_device = 'iOS' \nWHERE user_id = 78104; \n-- Note: is_active is ALREADY true and last_seen_device is ALREADY 'iOS'!",
    "initialCost": 8.4,
    "initialLatencyMs": 14.2,
    "initialPlanSummary": "Index Update on user_profiles -> Physical row tuple copy written, indexes updated, WAL generated",
    "businessContext": "Application user heartbeat issues no-op updates for millions of active sessions. Database generates 400 GB of WAL logs per day and autovacuum cannot keep up with table bloat.",
    "strategies": [
      {
        "id": "strat_guard_condition_noop_optimal",
        "title": "Add Identity WHERE Guard & IS DISTINCT FROM Filter",
        "sqlCommand": "UPDATE user_profiles \nSET is_active = true, last_seen_device = 'iOS' \nWHERE user_id = 78104 \n  AND (is_active IS DISTINCT FROM true \n       OR last_seen_device IS DISTINCT FROM 'iOS');",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.4,
        "executionPlanSummary": "Index Scan -> WHERE clause fails immediately -> 0 tuples copied, 0 WAL generated, 0 index updates",
        "engineExplanation": "Winner! In PostgreSQL, updating a row with identical data is NOT a no-op under the hood; MVCC must write a new row version, generate WAL, and dirty the index pages unless HOT applies. By adding a guard filter (IS DISTINCT FROM), the engine skips the write completely if the values match, slashing WAL volume by 95%."
      },
      {
        "id": "strat_run_vacuum_full_hourly",
        "title": "Run VACUUM FULL user_profiles every hour",
        "sqlCommand": "VACUUM FULL user_profiles;",
        "isOptimal": false,
        "resultingCost": 950000,
        "resultingLatencyMs": 45000,
        "executionPlanSummary": "Exclusive AccessExclusiveLock -> Blocks all application reads and writes for 45 seconds",
        "engineExplanation": "VACUUM FULL acquires an exclusive table lock that locks out all API users, causing immediate cascading timeouts across the web application."
      },
      {
        "id": "strat_disable_wal_logging",
        "title": "Convert user_profiles table to UNLOGGED",
        "sqlCommand": "ALTER TABLE user_profiles SET UNLOGGED;",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 2.1,
        "executionPlanSummary": "Table loses crash recovery and streaming replication standby synchronization",
        "engineExplanation": "UNLOGGED tables are truncated to empty upon any database crash or restart, and cannot be replicated to standby read replicas."
      }
    ],
    "keyTakeaway": "In PostgreSQL, setting a column to its existing value still creates a new MVCC tuple and writes WAL. Always guard updates with 'WHERE col IS DISTINCT FROM new_val'."
  },

  // ── Scenario 81: Long-Running Analytical Transaction Freezing InnoDB Undo Purge (Senior) ──
  {
    "id": "long_transaction_undo_hll_bloat",
    "title": "Long-Running Analytical Transaction Freezing InnoDB Undo Purge",
    "difficulty": "Senior",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "innodb_undo_tablespace",
    "rowCount": "History List Length (HLL): 45,000,000 undo records",
    "tableSizeDisk": "Undo log swollen from 500 MB to 180 GB",
    "slowQuery": "-- A developer left a psql/mysql session open with a forgotten BEGIN:\n-- Transaction started 18 hours ago:\nBEGIN;\nSELECT count(*) FROM audit_logs WHERE created_at < '2025-01-01';\n-- Session left idle in transaction for 18 hours...",
    "initialCost": 500000,
    "initialLatencyMs": 12000,
    "initialPlanSummary": "InnoDB Purge Lag: Master purge thread blocked by oldest read view (trx_id=14092100). All OLTP queries slow down due to traversing giant undo chains.",
    "businessContext": "MySQL database query latency on standard primary key lookups spikes from 0.5ms to 120ms. The undo tablespace grows to 180 GB, threatening disk capacity.",
    "strategies": [
      {
        "id": "strat_kill_idle_and_set_timeout_optimal",
        "title": "Kill Oldest Idle Transaction & Enforce idle_in_transaction_session_timeout",
        "sqlCommand": "-- Identify and terminate the blocking connection:\nSELECT trx_mysql_thread_id, trx_started, NOW() - trx_started AS duration\nFROM information_schema.innodb_trx \nORDER BY trx_started ASC LIMIT 1;\n-- KILL <thread_id>;\n\n-- Configure server-side circuit breaker:\nSET GLOBAL max_execution_time = 30000; -- MySQL 8.0 query timeout\n-- In PostgreSQL: ALTER SYSTEM SET idle_in_transaction_session_timeout = '60000';",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "Idle transaction rolled back -> InnoDB purge thread instantly awakens, pruning 45M undo records",
        "engineExplanation": "Winner! In MVCC, an active transaction's Read View requires the database to preserve undo versions for every row modified anywhere in the database since that transaction began. The undo purge worker is completely blocked. Terminating the idle transaction unblocks undo purging and restores secondary index lookups to sub-millisecond speeds."
      },
      {
        "id": "strat_increase_undo_tablespace_size",
        "title": "Allocate an additional 500 GB EBS volume for undo tablespace",
        "sqlCommand": "-- Attach AWS EBS volume and resize file system",
        "isOptimal": false,
        "resultingCost": 500000,
        "resultingLatencyMs": 14000,
        "executionPlanSummary": "Disk size increased but query traversal through 10,000-deep undo version chains remains agonizingly slow",
        "engineExplanation": "Adding disk space does not fix query performance. Every SELECT must traverse thousands of undo log records to reconstruct historical row snapshots."
      },
      {
        "id": "strat_restart_mysql_service",
        "title": "Perform an emergency kill -9 and restart of the database server",
        "sqlCommand": "systemctl restart mysql",
        "isOptimal": false,
        "resultingCost": 1000000,
        "resultingLatencyMs": 1800000,
        "executionPlanSummary": "Crash Recovery -> InnoDB must recover 180 GB of undo logs during startup, incurring 45 minutes of total downtime",
        "engineExplanation": "Force-killing MySQL with a massive undo backlog causes hours-long crash recovery during startup while InnoDB rebuilds the transaction state."
      }
    ],
    "keyTakeaway": "An idle transaction holding an open read view stops undo log / dead tuple purging for the entire database. Enforce strict idle_in_transaction_session_timeout settings."
  },

  // ── Scenario 82: MySQL Metadata Lock (MDL) Queue Cascading Outage (Senior) ──
  {
    "id": "metadata_lock_priority_queue_cascade",
    "title": "MySQL Metadata Lock (MDL) Queue Cascading Outage",
    "difficulty": "Senior",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "customer_orders",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "6.2 GB on disk",
    "slowQuery": "-- Session 1 (Slow analytical query running for 30s):\nSELECT count(*) FROM customer_orders WHERE notes LIKE '%VIP%';\n\n-- Session 2 (Migration tool attempts schema change):\nALTER TABLE customer_orders ADD COLUMN loyalty_tier VARCHAR(20);\n\n-- Session 3 to 500 (Incoming live traffic):\nSELECT * FROM customer_orders WHERE order_id = 91823;",
    "initialCost": 8.4,
    "initialLatencyMs": 30000,
    "initialPlanSummary": "Waiting for table metadata lock -> 498 active connections piled up in 'Waiting for table metadata lock', max_connections exhausted!",
    "businessContext": "During an online release, adding a non-blocking nullable column freezes the entire production website. All 500 connection pool slots fill up with 504 Gateway Timeouts.",
    "strategies": [
      {
        "id": "strat_lock_wait_timeout_ddl_optimal",
        "title": "Set lock_wait_timeout for DDL Sessions & Retry Gracefully",
        "sqlCommand": "-- Inside migration script:\nSET lock_wait_timeout = 3; -- Fail within 3 seconds instead of 1 year!\nALTER TABLE customer_orders ADD COLUMN loyalty_tier VARCHAR(20), ALGORITHM=INPLACE, LOCK=NONE;",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "DDL acquires lock immediately if clear, or aborts within 3s without queuing behind slow reads",
        "engineExplanation": "Winner! MySQL prioritizes DDL write-lock requests ahead of new read-lock requests in the Metadata Lock (MDL) queue. When ALTER TABLE waits for Session 1, ALL subsequent SELECT statements queue behind the ALTER TABLE! Setting lock_wait_timeout = 3 ensures the migration fails fast rather than piling up hundreds of incoming customer queries."
      },
      {
        "id": "strat_increase_max_connections",
        "title": "Increase max_connections from 500 to 5,000",
        "sqlCommand": "SET GLOBAL max_connections = 5000;",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 60000,
        "executionPlanSummary": "5,000 connections queue waiting for MDL, inducing kernel thread scheduling thrashing and OOM crash",
        "engineExplanation": "Raising connection limits allows 5,000 threads to queue simultaneously, exhausting operating system memory and crashing the database process."
      },
      {
        "id": "strat_force_copy_algorithm",
        "title": "Use ALGORITHM=COPY for the schema migration",
        "sqlCommand": "ALTER TABLE customer_orders ADD COLUMN loyalty_tier VARCHAR(20), ALGORITHM=COPY;",
        "isOptimal": false,
        "resultingCost": 980000,
        "resultingLatencyMs": 180000,
        "executionPlanSummary": "Full table copy under shared table lock -> Locks out all INSERT, UPDATE, and DELETE operations for 3 minutes",
        "engineExplanation": "ALGORITHM=COPY converts the table to read-only during the copy, completely halting production mutations for minutes."
      }
    ],
    "keyTakeaway": "MySQL gives DDL requests higher priority in the Metadata Lock queue than new SELECT queries. A blocked ALTER TABLE blocks ALL subsequent queries on that table. Always set session lock_wait_timeout = 3 for DDL."
  },

  // ── Scenario 83: MySQL Online DDL Row Log Buffer Overflow Rollback (Senior) ──
  {
    "id": "online_ddl_row_log_buffer_overflow",
    "title": "MySQL Online DDL Row Log Buffer Overflow Rollback",
    "difficulty": "Senior",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "payment_transactions",
    "rowCount": "80,000,000 rows",
    "tableSizeDisk": "35 GB on disk",
    "slowQuery": "-- Adding a secondary index on a busy OLTP table:\nALTER TABLE payment_transactions \nADD INDEX idx_created_merchant (created_at, merchant_id), \nALGORITHM=INPLACE, LOCK=NONE;",
    "initialCost": 1200000,
    "initialLatencyMs": 900000,
    "initialPlanSummary": "InnoDB Online DDL: Error 1799 (HY000): Creating index 'idx_created_merchant' required more than 'innodb_online_alter_log_max_size' bytes of modification log",
    "businessContext": "Adding a missing index to an 80M row payments table during peak business hours. After running for 15 minutes, the operation fails and rolls back, having wasted massive I/O bandwidth.",
    "strategies": [
      {
        "id": "strat_increase_online_alter_log_optimal",
        "title": "Increase innodb_online_alter_log_max_size for the Migration",
        "sqlCommand": "-- Temporarily raise modification log buffer from default 128MB to 2GB:\nSET GLOBAL innodb_online_alter_log_max_size = 2147483648;\n\n-- Re-run the concurrent online DDL:\nALTER TABLE payment_transactions \nADD INDEX idx_created_merchant (created_at, merchant_id), \nALGORITHM=INPLACE, LOCK=NONE;\n\n-- Reset back after index build completes:\nSET GLOBAL innodb_online_alter_log_max_size = 134217728;",
        "isOptimal": true,
        "resultingCost": 450000,
        "resultingLatencyMs": 420000,
        "executionPlanSummary": "Online index build succeeds concurrently without blocking concurrent INSERT/UPDATE traffic",
        "engineExplanation": "Winner! During ALGORITHM=INPLACE online index creation, concurrent writes are buffered in an in-memory row log (default 128 MB). On a high-throughput table, 128 MB is quickly exhausted before the index scan finishes, triggering Error 1799. Raising innodb_online_alter_log_max_size allows the buffer to hold all concurrent mutations."
      },
      {
        "id": "strat_lock_exclusive_mode",
        "title": "Use LOCK=EXCLUSIVE to prevent row logging entirely",
        "sqlCommand": "ALTER TABLE payment_transactions ADD INDEX idx_created_merchant (created_at, merchant_id), LOCK=EXCLUSIVE;",
        "isOptimal": false,
        "resultingCost": 400000,
        "resultingLatencyMs": 350000,
        "executionPlanSummary": "Exclusive Table Lock -> All payment processing APIs fail with 500 errors for 6 minutes",
        "engineExplanation": "LOCK=EXCLUSIVE stops concurrent writes, meaning payment checkouts will be rejected across the entire platform for several minutes."
      },
      {
        "id": "strat_disable_binlog_during_ddl",
        "title": "Disable binary logging with SET sql_log_bin = 0",
        "sqlCommand": "SET sql_log_bin = 0; ALTER TABLE payment_transactions ADD INDEX ...",
        "isOptimal": false,
        "resultingCost": 450000,
        "resultingLatencyMs": 420000,
        "executionPlanSummary": "DDL is omitted from binary log -> Read replicas never receive the index, breaking replication consistency",
        "engineExplanation": "Disabling sql_log_bin creates replication drift. Replicas never build the index, leading to slow queries and failover discrepancies."
      }
    ],
    "keyTakeaway": "MySQL INPLACE online index creation buffers concurrent writes in innodb_online_alter_log_max_size. If write volume exceeds this size before the scan completes, the DDL aborts. Increase this parameter before large online migrations."
  },

  // ── Scenario 84: Trigger Lock Contention in pt-online-schema-change vs gh-ost (Senior) ──
  {
    "id": "ghost_vs_ptosc_triggerless_migration",
    "title": "Trigger Lock Contention in pt-online-schema-change vs gh-ost",
    "difficulty": "Senior",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "audit_events",
    "rowCount": "120,000,000 rows",
    "tableSizeDisk": "48 GB on disk",
    "slowQuery": "-- Running pt-online-schema-change on high-write table:\npt-online-schema-change --alter \"ADD COLUMN severity TINYINT NOT NULL DEFAULT 1\" \\\n  --execute h=master_db,D=prod,t=audit_events",
    "initialCost": 1500000,
    "initialLatencyMs": 1200000,
    "initialPlanSummary": "pt-osc attaches synchronous AFTER INSERT, AFTER UPDATE, AFTER DELETE triggers -> Write amplification doubles lock contention, lock wait timeouts cascade",
    "businessContext": "Running schema migrations on an audit table ingesting 8,000 inserts/second. pt-online-schema-change's triggers cause thread contention and lock wait timeouts on master database.",
    "strategies": [
      {
        "id": "strat_ghost_binlog_stream_optimal",
        "title": "Use gh-ost (Triggerless Online Schema Change via Binlog Streaming)",
        "sqlCommand": "gh-ost \\\n  --host=master_db --database=prod --table=audit_events \\\n  --alter=\"ADD COLUMN severity TINYINT NOT NULL DEFAULT 1\" \\\n  --allow-on-master --serve-socket-file=/tmp/ghost.sock \\\n  --cut-over=atomic --max-load=Threads_running=50 \\\n  --execute",
        "isOptimal": true,
        "resultingCost": 120000,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "gh-ost replicates writes asynchronously by reading row-based binlog -> ZERO triggers, zero lock contention",
        "engineExplanation": "Winner! pt-online-schema-change uses synchronous row triggers (AFTER INSERT/UPDATE/DELETE) on the original table, multiplying locking overhead and causing deadlocks under high write loads. gh-ost is triggerless: it connects as a replication replica, reads changes asynchronously from the binary log, and applies them to the ghost table with automatic back-pressure throttle."
      },
      {
        "id": "strat_ptosc_drop_foreign_keys",
        "title": "Add --no-check-alter to bypass pt-osc safety checks",
        "sqlCommand": "pt-online-schema-change --no-check-alter --alter ...",
        "isOptimal": false,
        "resultingCost": 1500000,
        "resultingLatencyMs": 1200000,
        "executionPlanSummary": "Bypasses safety validations without reducing synchronous trigger lock contention",
        "engineExplanation": "Disabling safety checks does not eliminate the synchronous write triggers that are causing the lock contention."
      },
      {
        "id": "strat_run_direct_alter_table",
        "title": "Run native ALTER TABLE audit_events ADD COLUMN severity ...",
        "sqlCommand": "ALTER TABLE audit_events ADD COLUMN severity TINYINT NOT NULL DEFAULT 1;",
        "isOptimal": false,
        "resultingCost": 2000000,
        "resultingLatencyMs": 2400000,
        "executionPlanSummary": "Blocks write access and locks table for 40 minutes on 120M row dataset",
        "engineExplanation": "Direct ALTER TABLE on a 120M row table causes table-level locking, blocking all 8,000 inserts/sec and bringing down ingest pipelines."
      }
    ],
    "keyTakeaway": "pt-online-schema-change uses synchronous SQL triggers that can cause severe lock contention on write-heavy tables. Use triggerless tools like GitHub's gh-ost which consume changes via the binary log."
  },

  // ── Scenario 85: PostgreSQL Failed CREATE INDEX CONCURRENTLY Left in INVALID State (Senior) ──
  {
    "id": "postgresql_create_index_invalid_recovery",
    "title": "PostgreSQL Failed CREATE INDEX CONCURRENTLY Left in INVALID State",
    "difficulty": "Senior",
    "category": "indexing",
    "categoryLabel": "Indexing Strategies",
    "tableName": "user_subscriptions",
    "rowCount": "30,000,000 rows",
    "tableSizeDisk": "7.5 GB on disk",
    "slowQuery": "-- Query planner ignores index and runs full Seq Scan:\nSELECT * FROM user_subscriptions \nWHERE renewed_at < NOW() - INTERVAL '30 days' AND status = 'ACTIVE';\n\n-- Database status query:\nSELECT indexrelid::regclass, indisvalid, indisready \nFROM pg_index WHERE indexrelid = 'idx_subs_renewed'::regclass;\n-- Result: indisvalid = false, indisready = true",
    "initialCost": 520000,
    "initialLatencyMs": 6400,
    "initialPlanSummary": "Seq Scan on user_subscriptions -> idx_subs_renewed is marked INVALID and completely ignored by the query planner!",
    "businessContext": "A CI/CD deployment previously ran CREATE INDEX CONCURRENTLY idx_subs_renewed, but the TCP connection was cancelled midway. The index exists on disk, takes 1.4 GB, but is ignored by SELECT queries.",
    "strategies": [
      {
        "id": "strat_reindex_concurrently_optimal",
        "title": "Drop Invalid Index or Run REINDEX INDEX CONCURRENTLY",
        "sqlCommand": "-- PostgreSQL 12+:\nREINDEX INDEX CONCURRENTLY idx_subs_renewed;\n\n-- Or clean drop and recreate:\n-- DROP INDEX CONCURRENTLY idx_subs_renewed;\n-- CREATE INDEX CONCURRENTLY idx_subs_renewed ON user_subscriptions(renewed_at, status);",
        "isOptimal": true,
        "resultingCost": 12.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Index Scan on idx_subs_renewed -> indisvalid becomes TRUE, planner uses index",
        "engineExplanation": "Winner! When CREATE INDEX CONCURRENTLY fails or is cancelled, PostgreSQL leaves the index catalog entry in an INVALID state. An invalid index is NEVER used for queries, yet it continues to be updated on every INSERT/UPDATE/DELETE (burning write I/O!). REINDEX INDEX CONCURRENTLY safely rebuilds the index and marks indisvalid = true."
      },
      {
        "id": "strat_enable_seqscan_off",
        "title": "Force index use with SET enable_seqscan = off",
        "sqlCommand": "SET enable_seqscan = off; SELECT * FROM user_subscriptions ...",
        "isOptimal": false,
        "resultingCost": 999999999,
        "resultingLatencyMs": 6800,
        "executionPlanSummary": "Planner cannot use an invalid index under any circumstances; falls back to Seq Scan with penalty cost",
        "engineExplanation": "The PostgreSQL planner strictly refuses to use an invalid index because its data integrity is unverified. Disabling seqscan only inflates the cost of the sequential scan."
      },
      {
        "id": "strat_update_pg_index_catalog",
        "title": "Directly update system catalog UPDATE pg_index SET indisvalid = true",
        "sqlCommand": "UPDATE pg_index SET indisvalid = true WHERE indexrelid = 'idx_subs_renewed'::regclass;",
        "isOptimal": false,
        "resultingCost": 12.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Corrupt index returns wrong/missing rows for queries because partial keys were never indexed",
        "engineExplanation": "Directly hacking pg_index causes silent query corruption. The failed concurrent build missed rows that were updated during the initial scan."
      }
    ],
    "keyTakeaway": "An aborted CREATE INDEX CONCURRENTLY leaves an INVALID index that burns write I/O on every write without ever being used for reads. Rebuild it with REINDEX CONCURRENTLY."
  },

  // ── Scenario 86: MySQL net_write_timeout & Java OutOfMemory During 5M Row Export (Senior) ──
  {
    "id": "streaming_export_net_write_timeout",
    "title": "MySQL net_write_timeout & Java OutOfMemory During 5M Row Export",
    "difficulty": "Senior",
    "category": "performance",
    "categoryLabel": "Database Drivers & Streaming",
    "tableName": "invoices",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "4.2 GB on disk",
    "slowQuery": "-- Spring Boot batch job exporting invoices to S3:\nSELECT invoice_id, customer_id, total_amount, pdf_payload, tax_code\nFROM invoices\nWHERE billing_year = 2025;",
    "initialCost": 350000,
    "initialLatencyMs": 75000,
    "initialPlanSummary": "MySQL Client Error: Communications link failure (net_write_timeout) / Java Heap Space: java.lang.OutOfMemoryError",
    "businessContext": "Annual tax compliance batch job fails after 60 seconds with 'net_write_timeout' or crashes the Spring microservice container with OOM error.",
    "strategies": [
      {
        "id": "strat_cursor_streaming_fetchsize_optimal",
        "title": "Configure MySQL Cursor Streaming (Integer.MIN_VALUE) & Client Stream",
        "sqlCommand": "-- In JDBC / MyBatis / Hibernate configuration:\nPreparedStatement stmt = conn.prepareStatement(\n  \"SELECT invoice_id, customer_id, total_amount, tax_code FROM invoices WHERE billing_year = 2025\",\n  ResultSet.TYPE_FORWARD_ONLY,\n  ResultSet.CONCUR_READ_ONLY\n);\n// Magic MySQL connector stream flag (fetches row by row without buffering in RAM):\nstmt.setFetchSize(Integer.MIN_VALUE);\n\n-- Or in MySQL session:\nSET SESSION net_write_timeout = 1800;",
        "isOptimal": true,
        "resultingCost": 45000,
        "resultingLatencyMs": 8500,
        "executionPlanSummary": "Streamed ResultSet -> Constant 32 MB JVM memory consumption, zero socket write timeouts",
        "engineExplanation": "Winner! By default, the MySQL JDBC driver fetches all millions of rows into Java client memory in a single byte array, triggering JVM OutOfMemoryError. Furthermore, if the client is slow writing to S3, MySQL's TCP output buffer fills up, exceeding net_write_timeout (default 60s). Setting setFetchSize(Integer.MIN_VALUE) instructs MySQL Connector/J to stream row-by-row directly from the socket."
      },
      {
        "id": "strat_increase_jvm_heap",
        "title": "Increase JVM container heap memory to -Xmx64G",
        "sqlCommand": "java -Xmx64G -jar batch-service.jar",
        "isOptimal": false,
        "resultingCost": 350000,
        "resultingLatencyMs": 82000,
        "executionPlanSummary": "Huge GC pauses and net_write_timeout still triggers because MySQL TCP buffer fills up",
        "engineExplanation": "Throwing memory at the problem costs cloud dollars without solving the network socket buffer timeout when consumer throughput lags database output."
      },
      {
        "id": "strat_offset_batching",
        "title": "Chunk into 5,000 batches using LIMIT 1000 OFFSET 0..5000000",
        "sqlCommand": "SELECT ... LIMIT 1000 OFFSET 4999000;",
        "isOptimal": false,
        "resultingCost": 1800000,
        "resultingLatencyMs": 480000,
        "executionPlanSummary": "O(N^2) quadratic degradation: each batch re-scans all preceding offset rows",
        "engineExplanation": "OFFSET pagination gets progressively slower on every batch, turning an 8-second query into an 8-minute crawl."
      }
    ],
    "keyTakeaway": "MySQL JDBC by default buffers all query rows into client memory before returning. For large data exports, use setFetchSize(Integer.MIN_VALUE) to enable true streaming and increase net_write_timeout."
  },

  // ── Scenario 87: PostgreSQL pg_advisory_lock Session Leak Across Pooled Connections (Senior) ──
  {
    "id": "advisory_lock_connection_pool_leak",
    "title": "PostgreSQL pg_advisory_lock Session Leak Across Pooled Connections",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "pg_locks",
    "rowCount": "100 HikariCP pool connections",
    "tableSizeDisk": "Memory-resident lock manager",
    "slowQuery": "-- Microservice acquiring session-level advisory lock:\nSELECT pg_advisory_lock(98765);\n-- Transaction completes or throws unhandled exception:\n-- Application forgets to call SELECT pg_advisory_unlock(98765);\n-- Connection is returned to HikariCP pool!",
    "initialCost": 1.0,
    "initialLatencyMs": 10000,
    "initialPlanSummary": "ExclusiveLock on Advisory (classid=0, objid=98765) held permanently by physical backend PID 18420. Subsequent threads block forever!",
    "businessContext": "Distributed cron scheduling service uses advisory locks for leader election. After an exception occurs, no worker is ever able to run the cron job again until database restart.",
    "strategies": [
      {
        "id": "strat_transaction_level_advisory_lock_optimal",
        "title": "Switch to Transaction-Scoped Advisory Locks (pg_advisory_xact_lock)",
        "sqlCommand": "-- Inside transaction block:\nBEGIN;\n-- Automatically released upon COMMIT or ROLLBACK:\nSELECT pg_advisory_xact_lock(98765);\n-- Perform critical task...\nCOMMIT;",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Transaction-scoped lock -> Automatically and unconditionally released when tx terminates",
        "engineExplanation": "Winner! pg_advisory_lock is session-scoped; it lives on the underlying TCP database connection. In modern connection pools (HikariCP, PgBouncer), connections are reused across different web requests. If code throws an unhandled exception before unlocking, the lock leaks into the pool. pg_advisory_xact_lock is bound to the transaction lifecycle and automatically releases on commit or rollback."
      },
      {
        "id": "strat_kill_backend_pid",
        "title": "Write a cron script to kill database connections holding advisory locks",
        "sqlCommand": "SELECT pg_terminate_backend(pid) FROM pg_locks WHERE locktype = 'advisory';",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 5.0,
        "executionPlanSummary": "Terminating backend connections causes pool connection resets and breaks in-flight transactions",
        "engineExplanation": "Killing active pool connections creates transient application connection errors and doesn't fix the underlying code bug."
      },
      {
        "id": "strat_switch_to_redis_lock",
        "title": "Replace with un-fenced Redis SETNX key with 10s TTL",
        "sqlCommand": "SET lock:98765 token NX EX 10",
        "isOptimal": false,
        "resultingCost": 0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "Lock expires prematurely during GC pause or slow network I/O, leading to split-brain execution",
        "engineExplanation": "Basic Redis locks without fencing tokens fail under GC pauses or network delays, allowing two workers to run concurrently."
      }
    ],
    "keyTakeaway": "Never use session-level pg_advisory_lock with connection pools like HikariCP. Always use transaction-scoped pg_advisory_xact_lock so locks release automatically on COMMIT or ROLLBACK."
  },

  // ── Scenario 88: Optimistic Locking @Version Retry Storm During Flash Sale (Senior) ──
  {
    "id": "optimistic_lock_retry_storm_flash_sale",
    "title": "Optimistic Locking @Version Retry Storm During Flash Sale",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "product_inventory",
    "rowCount": "1 hotspot row (SKU: iPhone 16 Pro)",
    "tableSizeDisk": "150 MB on disk",
    "slowQuery": "-- 5,000 concurrent threads executing:\nUPDATE product_inventory \nSET stock = stock - 1, version = version + 1 \nWHERE product_id = 999 AND version = 42;",
    "initialCost": 8.4,
    "initialLatencyMs": 3500,
    "initialPlanSummary": "OptimisticLockException -> 4,999 threads fail with version mismatch, triggering application retry loop, collapsing DB CPU to 100%",
    "businessContext": "Black Friday flash sale for limited stock item. 5,000 customers hit purchase simultaneously. 99.8% of requests fail with OptimisticLockException, and client retry storms crash the microservice cluster.",
    "strategies": [
      {
        "id": "strat_pessimistic_decrement_optimal",
        "title": "Direct Atomic Database Decrement with Zero Application Retries",
        "sqlCommand": "UPDATE product_inventory \nSET stock = stock - :quantity \nWHERE product_id = :productId AND stock >= :quantity;\n\n-- In Java/Go:\nint updated = jdbcTemplate.update(sql, params);\nif (updated == 0) {\n  throw new OutOfStockException(\"Item sold out!\");\n}",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Row-level atomic write lock -> Hardware serialize in InnoDB engine at 15,000 TPS, 0 retries",
        "engineExplanation": "Winner! Optimistic locking (@Version) works great for low-contention workloads, but is an anti-pattern for high-contention hotspots because 99% of transactions abort and retry. Atomic decrement ('stock = stock - 1 WHERE stock >= 1') serializes at the database row latch level, completely eliminating retry storms and application exceptions."
      },
      {
        "id": "strat_exponential_backoff_retry",
        "title": "Add Spring @Retryable with Exponential Backoff (10 retries)",
        "sqlCommand": "@Retryable(value = ObjectOptimisticLockingFailureException.class, maxAttempts = 10)",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 12000,
        "executionPlanSummary": "Massive thread pool queueing, latency explosion, and 85% eventual failure rate",
        "engineExplanation": "Backoff retries do not resolve high contention on a single row; they merely postpone failure while keeping worker threads tied up."
      },
      {
        "id": "strat_synchronized_java_block",
        "title": "Use synchronized (this) in the Java Spring service layer",
        "sqlCommand": "public synchronized void buyProduct(Long id) { ... }",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 8500,
        "executionPlanSummary": "JVM-level lock only protects a single node; across 10 Kubernetes pods, race conditions remain unchecked",
        "engineExplanation": "JVM synchronized locks do nothing in a distributed microservice environment with multiple application replicas."
      }
    ],
    "keyTakeaway": "Optimistic locking collapses under high-contention hotspots (flash sales, ticket drops). Use atomic row decrements ('UPDATE ... SET stock = stock - 1 WHERE stock >= 1') to serialize updates cleanly in the engine."
  },

  // ── Scenario 89: PostgreSQL Range Partition Pruning Defeated by Dynamic Expression (Senior) ──
  {
    "id": "declarative_range_partition_pruning",
    "title": "PostgreSQL Range Partition Pruning Defeated by Dynamic Expression",
    "difficulty": "Senior",
    "category": "partitioning",
    "categoryLabel": "Table Partitioning & Sharding",
    "tableName": "audit_logs (Partitioned by month: 120 partitions)",
    "rowCount": "600,000,000 rows across partitions",
    "tableSizeDisk": "120 GB on disk",
    "slowQuery": "SELECT event_id, user_id, action, event_timestamp\nFROM audit_logs\nWHERE event_timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days';",
    "initialCost": 980000,
    "initialLatencyMs": 8900,
    "initialPlanSummary": "Append -> Seq Scan on audit_logs_y2016_m01 ... Seq Scan on audit_logs_y2026_m03 (All 120 partitions scanned!)",
    "businessContext": "Enterprise audit log query searching the past 7 days scans every historical partition dating back to 2016 because the planner cannot perform compile-time partition pruning.",
    "strategies": [
      {
        "id": "strat_enable_runtime_pruning_and_stable_date_optimal",
        "title": "Use Explicit Parameters or Ensure enable_partition_pruning = on with Static Bounds",
        "sqlCommand": "-- Ensure partition pruning is enabled in PostgreSQL:\nSET enable_partition_pruning = on;\n\n-- In application query, pass pre-computed timestamp literal or parameter:\n-- e.g. WHERE event_timestamp >= '2026-03-18 00:00:00'::timestamptz;\nSELECT event_id, user_id, action, event_timestamp\nFROM audit_logs\nWHERE event_timestamp >= (now() - INTERVAL '7 days')::timestamptz;",
        "isOptimal": true,
        "resultingCost": 8500,
        "resultingLatencyMs": 42.0,
        "executionPlanSummary": "Append -> Seq/Index Scan on audit_logs_y2026_m03 only (119 partitions pruned!)",
        "engineExplanation": "Winner! When partition pruning is enabled, PostgreSQL can prune partitions at execution time (run-time pruning) for STABLE functions like now(). If dynamic SQL or volatile functions prevent pruning, passing an explicit pre-calculated timestamp boundary allows compile-time pruning, scanning only the 1 relevant partition out of 120."
      },
      {
        "id": "strat_global_btree_index",
        "title": "Create a Global B-Tree index across all partitions",
        "sqlCommand": "CREATE INDEX idx_global_audit_logs ON audit_logs(event_timestamp);",
        "isOptimal": false,
        "resultingCost": 980000,
        "resultingLatencyMs": 8800,
        "executionPlanSummary": "PostgreSQL does not support global indexes on partitioned tables (creates separate local index per partition)",
        "engineExplanation": "PostgreSQL does not feature global indexes. Creating an index on the root partitioned table creates local indexes on each partition, which does not bypass partition scanning."
      },
      {
        "id": "strat_subquery_unnest",
        "title": "Wrap in a CTE (WITH recent AS ...) to force evaluation",
        "sqlCommand": "WITH recent AS (SELECT now() - INTERVAL '7 days' AS cutoff) SELECT * FROM audit_logs, recent WHERE event_timestamp >= recent.cutoff;",
        "isOptimal": false,
        "resultingCost": 1250000,
        "resultingLatencyMs": 11500,
        "executionPlanSummary": "Materialized CTE acts as optimization fence -> forces Nested Loop across all partitions",
        "engineExplanation": "CTE fences prevent partition pruning by turning the predicate into an opaque join condition evaluated after partition selection."
      }
    ],
    "keyTakeaway": "Always verify with EXPLAIN that the planner prunes unused partitions (look for 'Partitions removed by pruning: N'). Avoid volatile expressions in WHERE clauses on partition keys."
  },

  // ── Scenario 90: B-Tree Right-Edge Page Latch Contention on Monotonic Sequences (Senior) ──
  {
    "id": "hash_partitioning_high_concurrency_writes",
    "title": "B-Tree Right-Edge Page Latch Contention on Monotonic Sequences",
    "difficulty": "Senior",
    "category": "partitioning",
    "categoryLabel": "Table Partitioning & Sharding",
    "tableName": "ledger_entries",
    "rowCount": "200,000,000 rows",
    "tableSizeDisk": "42 GB on disk",
    "slowQuery": "-- 128 application threads inserting high-frequency ledger records:\nINSERT INTO ledger_entries (entry_id, account_id, amount, created_at)\nVALUES (nextval('ledger_seq'), 84210, 150.00, NOW());",
    "initialCost": 1.0,
    "initialLatencyMs": 45.0,
    "initialPlanSummary": "InnoDB buffer pool: page latch contention on leaf page of primary key B-Tree (Right-edge insert hotspot)",
    "businessContext": "Financial transaction ledger ingests 50,000 records/sec. Even with fast NVMe SSDs, write throughput throttles because every thread is competing to lock the single rightmost B-Tree index leaf page.",
    "strategies": [
      {
        "id": "strat_hash_partition_or_uuid_optimal",
        "title": "Hash Partition the Table by entry_id or Distribute Ingestion Keys",
        "sqlCommand": "CREATE TABLE ledger_entries (\n  entry_id BIGINT NOT NULL,\n  account_id BIGINT NOT NULL,\n  amount NUMERIC(12,2),\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  PRIMARY KEY (entry_id, account_id)\n) PARTITION BY HASH (entry_id);\n\n-- Create 16 hash partitions:\nCREATE TABLE ledger_entries_p0 PARTITION OF ledger_entries FOR VALUES WITH (MODULUS 16, REMAINDER 0);\n-- ... p1 to p15 ...",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Writes distributed across 16 independent B-Tree leaf pages, eliminating single-page latch bottlenecks",
        "engineExplanation": "Winner! Monotonically increasing sequence IDs cause all concurrent INSERT operations to target the exact same leaf page at the extreme right edge of the B-Tree index, serializing on kernel page latches. Hash partitioning splits inserts across 16 separate B-Trees, multiplying insert concurrency by 16x."
      },
      {
        "id": "strat_increase_innodb_buffer_pool",
        "title": "Increase innodb_buffer_pool_size to 128GB",
        "sqlCommand": "SET GLOBAL innodb_buffer_pool_size = 137438953472;",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 42.0,
        "executionPlanSummary": "Buffer pool size does not resolve CPU page mutex/rwlock contention on the single target page",
        "engineExplanation": "Page latch contention is an in-memory concurrency problem, not an I/O cache miss. A larger buffer pool does not relieve single-page lock serialization."
      },
      {
        "id": "strat_disable_primary_key",
        "title": "Drop the PRIMARY KEY to speed up inserts",
        "sqlCommand": "ALTER TABLE ledger_entries DROP PRIMARY KEY;",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 38.0,
        "executionPlanSummary": "InnoDB creates hidden 6-byte DB_ROW_ID which is globally sequenced, reproducing the same latch hotspot",
        "engineExplanation": "In MySQL InnoDB, dropping the primary key causes InnoDB to generate an internal hidden row ID sequence that still concentrates all inserts on one leaf page."
      }
    ],
    "keyTakeaway": "Monotonic auto-increment keys concentrate write latch contention on the rightmost leaf of the B-Tree index. Hash partitioning or sharded sequences distribute insert pressure across multiple physical index trees."
  },

  // ── Scenario 91: PostgreSQL TOAST Out-of-Line JSONB Thrashing and Decompression Overhead (Senior) ──
  {
    "id": "toast_table_out_of_line_compression",
    "title": "PostgreSQL TOAST Out-of-Line JSONB Thrashing and Decompression Overhead",
    "difficulty": "Senior",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "raw_payloads",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "180 GB (Main: 8 GB, pg_toast: 172 GB)",
    "slowQuery": "SELECT payload_id, metadata->>'status', created_at\nFROM raw_payloads\nWHERE created_at >= '2026-03-01'\nORDER BY created_at DESC\nLIMIT 100;",
    "initialCost": 85000,
    "initialLatencyMs": 2800,
    "initialPlanSummary": "Bitmap Heap Scan -> Detoast JSONB chunk tuples -> 100 rows fetched requires decompressing 80 MB of TOAST chunk pages",
    "businessContext": "Event sourcing table stores full 500 KB API payloads in a JSONB column. Querying basic status and timestamps is 100x slower than expected due to out-of-line TOAST retrieval.",
    "strategies": [
      {
        "id": "strat_extract_hot_columns_optimal",
        "title": "Extract Filter/Display Fields to Dedicated Columns & Set TOAST Storage to MAIN",
        "sqlCommand": "-- 1. Promote hot metadata property to native indexed column:\nALTER TABLE raw_payloads ADD COLUMN status VARCHAR(32);\nUPDATE raw_payloads SET status = metadata->>'status';\nCREATE INDEX idx_payloads_created_status ON raw_payloads(created_at DESC, status);\n\n-- 2. Query without accessing the bloated JSONB TOAST column:\nSELECT payload_id, status, created_at\nFROM raw_payloads\nWHERE created_at >= '2026-03-01'\nORDER BY created_at DESC\nLIMIT 100;",
        "isOptimal": true,
        "resultingCost": 14.2,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Index Only Scan on idx_payloads_created_status (TOAST table is never touched)",
        "engineExplanation": "Winner! In PostgreSQL, column values exceeding ~2KB are compressed and moved out-of-line into a separate TOAST table (The Oversized-Attribute Storage Technique). Even if you only extract one key with metadata->>'status', PostgreSQL must fetch and decompress the entire 500KB JSON document from the TOAST table! Promoting hot search attributes to real columns avoids TOAST I/O entirely."
      },
      {
        "id": "strat_toast_storage_plain",
        "title": "Change column storage mode to PLAIN",
        "sqlCommand": "ALTER TABLE raw_payloads ALTER COLUMN metadata SET STORAGE PLAIN;",
        "isOptimal": false,
        "resultingCost": 85000,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "ERROR: row is too big: size exceeds maximum allowed 8191 bytes for a tuple page",
        "engineExplanation": "STORAGE PLAIN disables compression and out-of-line storage. Any INSERT with payload exceeding 8KB will immediately crash with 'row is too big'."
      },
      {
        "id": "strat_vacuum_toast_table",
        "title": "Run VACUUM FULL on the pg_toast table",
        "sqlCommand": "VACUUM FULL pg_toast.pg_toast_16842;",
        "isOptimal": false,
        "resultingCost": 85000,
        "resultingLatencyMs": 2700,
        "executionPlanSummary": "Compacts disk space but does not eliminate de-toast decompression latency during queries",
        "engineExplanation": "Compacting TOAST chunks does not eliminate the architectural penalty of fetching and decompressing 500KB blobs during queries."
      }
    ],
    "keyTakeaway": "Querying fields nested inside out-of-line TOAST columns forces PostgreSQL to load and decompress giant byte blobs. Extract frequently queried keys into native columns with covering indexes."
  },

  // ── Scenario 92: Emergency Autovacuum Freeze Triggered by Transaction ID Wraparound (Senior) ──
  {
    "id": "autovacuum_freeze_max_age_wraparound",
    "title": "Emergency Autovacuum Freeze Triggered by Transaction ID Wraparound",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "pg_database / all tables",
    "rowCount": "Entire database cluster (2 billion transaction ceiling)",
    "tableSizeDisk": "All tables",
    "slowQuery": "-- Database logs warning:\n-- WARNING: database \"production\" must be vacuumed within 10000000 transactions\n-- Followed by aggressive autovacuum worker saturation consuming 100% disk I/O!",
    "initialCost": 1000000,
    "initialLatencyMs": 60000,
    "initialPlanSummary": "autovacuum: VACUUM (to prevent wraparound) running aggressively on large tables with default cost delays",
    "businessContext": "Production PostgreSQL cluster suddenly launches aggressive autovacuum freeze jobs on all tables. Disk I/O reaches 100%, and application queries begin timing out.",
    "strategies": [
      {
        "id": "strat_tune_autovacuum_io_budget_optimal",
        "title": "Elevate autovacuum_vacuum_cost_limit & autovacuum_max_workers to Complete Freeze Rapidly",
        "sqlCommand": "-- Un-throttle autovacuum during maintenance or wraparound emergency:\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000; -- Default is weak 200\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2;    -- Default is 2ms (or 20ms in older versions)\nALTER SYSTEM SET vacuum_cost_limit = 2000;\nSELECT pg_reload_conf();\n\n-- Perform manual parallel vacuum freeze on oldest table:\n-- VACUUM FREEZE VERBOSE ANALYZE orders;",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 10.0,
        "executionPlanSummary": "Autovacuum throughput increases by 10x, clearing the 2B transaction freeze queue in 40 minutes instead of stalling for days",
        "engineExplanation": "Winner! PostgreSQL 32-bit transaction IDs (XIDs) wrap around every 2 billion transactions. If autovacuum_freeze_max_age is reached, Postgres launches un-cancelable emergency vacuum freeze. If default autovacuum_vacuum_cost_limit is left at 200, autovacuum sleeps frequently, extending the emergency for days. Raising the cost limit gives vacuum the I/O budget to finish freezing quickly."
      },
      {
        "id": "strat_turn_off_autovacuum",
        "title": "Disable autovacuum completely with autovacuum = off",
        "sqlCommand": "ALTER SYSTEM SET autovacuum = off; SELECT pg_reload_conf();",
        "isOptimal": false,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "CRITICAL PANIC: PostgreSQL shuts down completely to prevent data corruption when limit reached",
        "engineExplanation": "Catastrophic! Disabling autovacuum prevents freezing. Once the hard 2-billion transaction limit is reached, PostgreSQL shuts down and refuses all connections except standalone single-user mode."
      },
      {
        "id": "strat_increase_freeze_max_age",
        "title": "Increase autovacuum_freeze_max_age to 10 billion",
        "sqlCommand": "ALTER SYSTEM SET autovacuum_freeze_max_age = 10000000000;",
        "isOptimal": false,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "ERROR: parameter out of range: 32-bit unsigned transaction ID maximum is ~2.1 billion",
        "engineExplanation": "Transaction IDs are 32-bit integers; values cannot exceed 2.14 billion. The engine rejects this setting."
      }
    ],
    "keyTakeaway": "Transaction ID wraparound is an existential risk in PostgreSQL. When wraparound autovacuum triggers, don't kill it\u2014give it the I/O budget to finish fast by raising autovacuum_vacuum_cost_limit."
  },

  // ── Scenario 93: PostgreSQL Multi-Column Correlation Misleading Cardinality Estimates (Senior) ──
  {
    "id": "extended_statistics_correlated_columns",
    "title": "PostgreSQL Multi-Column Correlation Misleading Cardinality Estimates",
    "difficulty": "Senior",
    "category": "performance",
    "categoryLabel": "Query Optimizer & Statistics",
    "tableName": "car_inventory",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.8 GB on disk",
    "slowQuery": "SELECT * FROM car_inventory\nWHERE make = 'Audi' AND model = 'R8';",
    "initialCost": 350000,
    "initialLatencyMs": 3200,
    "initialPlanSummary": "Nested Loop Join -> Planner assumes make and model are independent: P(make)*P(model) = 0.01 * 0.001 = 0.00001 (Estimated rows: 1, Actual rows: 250,000!)",
    "businessContext": "Automotive marketplace query performs poorly because the optimizer drastically underestimates result row counts, selecting a disastrous Nested Loop instead of a Hash Join or sequential batch.",
    "strategies": [
      {
        "id": "strat_create_extended_statistics_optimal",
        "title": "Create Extended Statistics (CREATE STATISTICS ... ON (make, model))",
        "sqlCommand": "CREATE STATISTICS stat_cars_make_model \nON make, model FROM car_inventory;\n\nANALYZE car_inventory;",
        "isOptimal": true,
        "resultingCost": 420.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Bitmap Heap Scan on idx_make_model -> Planner estimate: 248,000 rows (matches actual 250,000 rows)",
        "engineExplanation": "Winner! By default, the database calculates single-column histograms and assumes column predicates are statistically independent ($P(A \\cap B) = P(A) \\times P(B)$). But 'make' and 'model' are strongly correlated (only Audi makes the R8!). CREATE STATISTICS collects multivariate n-distinct and dependencies data, giving the planner accurate cardinality estimates."
      },
      {
        "id": "strat_force_hashjoin_hints",
        "title": "Disable nested loop joins with SET enable_nestloop = off",
        "sqlCommand": "SET enable_nestloop = off; SELECT * FROM car_inventory WHERE ...",
        "isOptimal": false,
        "resultingCost": 480000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "Forces planner to use Hash Join globally across all queries, penalizing fast sub-millisecond lookups",
        "engineExplanation": "Global session flags like enable_nestloop = off distort the execution plans of every other query in the application session."
      },
      {
        "id": "strat_increase_default_statistics_target",
        "title": "Increase single-column default_statistics_target to 1000",
        "sqlCommand": "ALTER TABLE car_inventory ALTER COLUMN make SET STATISTICS 1000; ANALYZE car_inventory;",
        "isOptimal": false,
        "resultingCost": 340000,
        "resultingLatencyMs": 3100,
        "executionPlanSummary": "More granular single-column histogram still cannot compute cross-column correlations",
        "engineExplanation": "Single-column statistics targets only deepen individual column sample buckets; they cannot capture multivariate inter-column correlations."
      }
    ],
    "keyTakeaway": "When columns are correlated (city/state, make/model, category/subcategory), default statistics multiply independent probabilities, causing catastrophic under-estimates. Use CREATE STATISTICS in PostgreSQL."
  },

  // ── Scenario 94: Low-Cardinality Secondary Index Bloat & B-Tree Deduplication (Senior) ──
  {
    "id": "btree_deduplication_postgres_13",
    "title": "Low-Cardinality Secondary Index Bloat & B-Tree Deduplication",
    "difficulty": "Senior",
    "category": "indexing",
    "categoryLabel": "Indexing Strategies",
    "tableName": "order_events",
    "rowCount": "150,000,000 rows",
    "tableSizeDisk": "28 GB table / 16 GB index on (status)",
    "slowQuery": "-- Index on status has only 4 distinct values ('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED'):\nSELECT event_id, created_at \nFROM order_events \nWHERE status = 'FAILED';",
    "initialCost": 45000,
    "initialLatencyMs": 1450,
    "initialPlanSummary": "Bitmap Heap Scan on idx_order_events_status (16 GB index exceeds RAM cache, massive random I/O)",
    "businessContext": "High-volume event log indexing status code on 150M rows. The status index consumes 16 GB of RAM, causing buffer cache churn and slowing writes.",
    "strategies": [
      {
        "id": "strat_reindex_with_deduplication_optimal",
        "title": "Rebuild Index with B-Tree Deduplication Enabled (deduplicate_items = on)",
        "sqlCommand": "-- PostgreSQL 13+ default feature:\nREINDEX INDEX CONCURRENTLY idx_order_events_status;\n-- Or explicitly:\n-- CREATE INDEX idx_order_events_status ON order_events(status) WITH (deduplicate_items = on);",
        "isOptimal": true,
        "resultingCost": 8500,
        "resultingLatencyMs": 65.0,
        "executionPlanSummary": "Bitmap Index Scan -> Index size shrinks from 16 GB to 3.2 GB (80% memory reduction), 100% cached in RAM",
        "engineExplanation": "Winner! In PostgreSQL 13+, B-Tree deduplication merges identical keys into a posting list of tuple pointers (TIDs). For low-cardinality columns with millions of duplicate values, deduplication shrinks index disk footprint by 70-85%, keeping the entire index pinned in memory and accelerating range scans."
      },
      {
        "id": "strat_replace_with_gin_index",
        "title": "Replace B-Tree with a GIN (Generalized Inverted) Index",
        "sqlCommand": "CREATE INDEX idx_status_gin ON order_events USING GIN(status);",
        "isOptimal": false,
        "resultingCost": 52000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "GIN index build takes 2 hours; insert throughput drops 10x due to GIN pending list overhead",
        "engineExplanation": "GIN indexes have heavy write overhead and slow insert throughput, making them unsuitable for high-write transactional OLTP tables."
      },
      {
        "id": "strat_drop_index_status",
        "title": "Drop the index and rely on Sequential Scan",
        "sqlCommand": "DROP INDEX idx_order_events_status;",
        "isOptimal": false,
        "resultingCost": 850000,
        "resultingLatencyMs": 18000,
        "executionPlanSummary": "Parallel Seq Scan on 150M rows -> 18 seconds response time",
        "engineExplanation": "Dropping the index forces full scans of 28 GB of data for every status query, crashing dashboard response times."
      }
    ],
    "keyTakeaway": "Low-cardinality indexes in PostgreSQL 13+ benefit enormously from B-Tree deduplication (deduplicate_items = on), reducing index memory consumption by up to 80% while speeding up scans."
  },

  // ── Scenario 95: WAL Disk Thrashing from High-Churn Transient Session Tables (Senior) ──
  {
    "id": "unlogged_table_transient_session_cache",
    "title": "WAL Disk Thrashing from High-Churn Transient Session Tables",
    "difficulty": "Senior",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "user_session_cache",
    "rowCount": "20,000,000 active sessions",
    "tableSizeDisk": "8.5 GB on disk",
    "slowQuery": "-- Microservice authentication checks and writes tokens every 1ms:\nINSERT INTO user_session_cache (token, user_id, expires_at)\nVALUES ('tok_9823f...', 49012, NOW() + INTERVAL '2 hours')\nON CONFLICT (token) DO UPDATE SET last_accessed = NOW();",
    "initialCost": 8.4,
    "initialLatencyMs": 28.0,
    "initialPlanSummary": "Insert on user_session_cache -> WAL write throughput bottlenecks on disk fsync (150 MB/sec WAL generated)",
    "businessContext": "Authentication token table generates massive WAL write traffic, consuming 60% of total SSD IOPS and saturating replica streaming bandwidth for non-critical transient session data.",
    "strategies": [
      {
        "id": "strat_convert_to_unlogged_optimal",
        "title": "Convert Table to UNLOGGED with In-Memory Caching",
        "sqlCommand": "-- For transient session data where crash loss is acceptable:\nALTER TABLE user_session_cache SET UNLOGGED;\n\n-- Re-enable autovacuum with aggressive settings:\nALTER TABLE user_session_cache SET (\n  autovacuum_vacuum_scale_factor = 0.05,\n  autovacuum_vacuum_cost_limit = 1000\n);",
        "isOptimal": true,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Zero WAL writes generated -> IOPS drop by 90%, insert throughput jumps 5x",
        "engineExplanation": "Winner! UNLOGGED tables bypass write-ahead logging (WAL) entirely. Data is written directly to shared buffers and table files without disk fsync on every transaction commit. Writes are 3x to 5x faster. Note: UNLOGGED tables are truncated to empty upon a database crash, which is acceptable for ephemeral session caches."
      },
      {
        "id": "strat_disable_fsync_globally",
        "title": "Set fsync = off in postgresql.conf",
        "sqlCommand": "ALTER SYSTEM SET fsync = off; SELECT pg_reload_conf();",
        "isOptimal": false,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "CRITICAL RISK: Entire database cluster will suffer total unrecoverable data corruption on power loss",
        "engineExplanation": "Never disable fsync globally! Power loss or server crash will render the entire database cluster corrupt and unstartable."
      },
      {
        "id": "strat_drop_session_index",
        "title": "Drop the primary key index on token",
        "sqlCommand": "ALTER TABLE user_session_cache DROP CONSTRAINT user_session_cache_pkey;",
        "isOptimal": false,
        "resultingCost": 450000,
        "resultingLatencyMs": 5200,
        "executionPlanSummary": "Breaks ON CONFLICT clause and turns token verification into full table scan",
        "engineExplanation": "Dropping the key disables conflict resolution and makes token lookups scan 20 million rows sequentially."
      }
    ],
    "keyTakeaway": "For ephemeral, reconstructible caching tables (sessions, scratch spaces), PostgreSQL UNLOGGED tables eliminate WAL generation, delivering massive write throughput improvements."
  },

  // ── Scenario 96: Streaming Replica Disconnection: WAL Recycling vs Replication Slots (Senior) ──
  {
    "id": "wal_keep_size_vs_replication_slots",
    "title": "Streaming Replica Disconnection: WAL Recycling vs Replication Slots",
    "difficulty": "Senior",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "pg_stat_replication",
    "rowCount": "3 streaming read replicas",
    "tableSizeDisk": "Replication stream",
    "slowQuery": "-- Read replica terminates with:\n-- FATAL: requested WAL segment 0000000100000A1200000045 has already been removed\n-- Replica enters disconnected error state!",
    "initialCost": 1.0,
    "initialLatencyMs": 5.0,
    "initialPlanSummary": "Replica lags behind primary during heavy batch job -> Primary recycled old WAL segments before replica could fetch them",
    "businessContext": "During an overnight data warehouse import, read replicas fail with 'requested WAL segment has already been removed'. Replicas must be completely rebuilt from pg_basebackup, causing hours of lost read capacity.",
    "strategies": [
      {
        "id": "strat_configure_replication_slots_optimal",
        "title": "Use Physical Replication Slots with max_slot_wal_keep_size Ceiling",
        "sqlCommand": "-- On primary database:\nSELECT pg_create_physical_replication_slot('replica_read_01');\n\n-- In replica postgresql.conf:\n-- primary_slot_name = 'replica_read_01'\n\n-- On primary: set safety ceiling so broken replica cannot fill disk:\nALTER SYSTEM SET max_slot_wal_keep_size = '100GB';\nSELECT pg_reload_conf();",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Physical slot retains exact required WAL segments on primary until replica confirms receipt",
        "engineExplanation": "Winner! Without replication slots, the primary database recycles WAL once wal_keep_size is exceeded, regardless of whether replicas have processed it. A physical replication slot instructs the primary checkpointer to never delete WAL needed by that replica. Setting max_slot_wal_keep_size acts as an emergency circuit breaker to prevent primary disk full panics."
      },
      {
        "id": "strat_increase_wal_keep_size_unbounded",
        "title": "Set wal_keep_size = '1TB' in postgresql.conf",
        "sqlCommand": "ALTER SYSTEM SET wal_keep_size = '1TB'; SELECT pg_reload_conf();",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "Permanent 1 TB disk space reservation even when replicas are fully in sync",
        "engineExplanation": "wal_keep_size statically reserves disk space even when replicas are healthy, and can still be exceeded during giant bulk operations."
      },
      {
        "id": "strat_switch_to_logical_dump",
        "title": "Replace streaming replication with hourly pg_dump restore",
        "sqlCommand": "pg_dump -Fc mydb > backup.dump && pg_restore -d mydb_replica backup.dump",
        "isOptimal": false,
        "resultingCost": 900000,
        "resultingLatencyMs": 3600000,
        "executionPlanSummary": "1 hour data latency and huge CPU load rebuilding tables on replica every hour",
        "engineExplanation": "Periodic pg_dump is not a high-availability replication solution; it introduces massive recovery point objective (RPO) and high CPU consumption."
      }
    ],
    "keyTakeaway": "Streaming replicas disconnect when the primary purges WAL they still need. Use physical replication slots (primary_slot_name) bounded by max_slot_wal_keep_size."
  },

  // ── Scenario 97: MySQL Statement-Based Replication Drift from Non-Deterministic Functions (Senior) ──
  {
    "id": "statement_vs_row_binlog_replication_drift",
    "title": "MySQL Statement-Based Replication Drift from Non-Deterministic Functions",
    "difficulty": "Senior",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "audit_logs",
    "rowCount": "40,000,000 rows",
    "tableSizeDisk": "9.5 GB on disk",
    "slowQuery": "-- Statement executed on primary under binlog_format = STATEMENT:\nINSERT INTO audit_logs (log_id, user_id, generated_token, created_at)\nVALUES (DEFAULT, 1024, UUID(), NOW());\n-- Primary and Read Replica now have DIFFERENT UUID() values!",
    "initialCost": 8.4,
    "initialLatencyMs": 1.5,
    "initialPlanSummary": "Replication warning: Statement is not safe to log in statement format -> UUID() evaluates differently on replica",
    "businessContext": "Primary database and read replica silently drift out of sync. When clients read from replicas, security token verification fails because UUID() generated different tokens on replica vs primary.",
    "strategies": [
      {
        "id": "strat_switch_row_binlog_optimal",
        "title": "Enforce binlog_format = ROW with binlog_row_image = FULL",
        "sqlCommand": "-- Enforce Row-Based Replication globally:\nSET GLOBAL binlog_format = 'ROW';\nSET GLOBAL binlog_row_image = 'FULL';\n\n-- In my.cnf configuration file:\n-- binlog_format = ROW\n-- binlog_row_image = FULL",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Row-Based Replication logs the exact physical post-execution row values, guaranteeing bit-for-bit consistency",
        "engineExplanation": "Winner! Under Statement-Based Replication (SBR), the replica re-executes the exact SQL text. Non-deterministic functions (UUID(), RAND(), NOW(), CURRENT_TIMESTAMP) or LIMIT clauses without ORDER BY produce different data on the replica! Row-Based Replication (RBR) logs the exact evaluated row values, eliminating replication data drift completely."
      },
      {
        "id": "strat_switch_mixed_binlog",
        "title": "Set binlog_format = MIXED",
        "sqlCommand": "SET GLOBAL binlog_format = 'MIXED';",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "MIXED mode relies on heuristics and can still miss subtle non-deterministic trigger and stored procedure side-effects",
        "engineExplanation": "While MIXED switches to ROW for obvious functions like UUID(), it can fail on complex triggers or non-deterministic user-defined functions."
      },
      {
        "id": "strat_pass_constant_uuid_from_app",
        "title": "Generate UUID in Java/Go application code only",
        "sqlCommand": "INSERT INTO audit_logs (log_id, user_id, generated_token, created_at) VALUES (DEFAULT, 1024, 'fixed-uuid-str', '2026-03-24 10:00:00');",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Solves this one query but leaves the database vulnerable to any other non-deterministic statement",
        "engineExplanation": "Application-level fixes do not prevent future developers or ad-hoc SQL updates from corrupting replication."
      }
    ],
    "keyTakeaway": "Statement-Based Replication causes silent data corruption when using non-deterministic SQL functions. Always configure binlog_format = ROW for production MySQL clusters."
  },

  // ── Scenario 98: Two-Phase Commit (2PC) Coordinator Crash & Indoubt Lock Blocking (Staff) ──
  {
    "id": "distributed_transaction_2pc_vs_saga",
    "title": "Two-Phase Commit (2PC) Coordinator Crash & Indoubt Lock Blocking",
    "difficulty": "Staff",
    "category": "distributed",
    "categoryLabel": "Distributed Systems & Architecture",
    "tableName": "distributed_tx_participants",
    "rowCount": "Multi-region microservices (Orders, Payments, Inventory)",
    "tableSizeDisk": "Distributed database nodes",
    "slowQuery": "-- XA / 2PC Distributed Transaction:\nXA START 'tx_98231';\nUPDATE inventory SET reserved = reserved + 1 WHERE sku = 'MACBOOK-PRO';\nXA END 'tx_98231';\nXA PREPARE 'tx_98231';\n-- Coordinator crashes before issuing XA COMMIT!\n-- Rows in 'inventory' are locked indefinitely across all database nodes!",
    "initialCost": 1000000,
    "initialLatencyMs": 300000,
    "initialPlanSummary": "XA Indoubt Transaction: exclusive row locks held by prepared transaction block all inventory writes indefinitely",
    "businessContext": "Enterprise microservice architecture uses XA/2PC transactions. An orchestration pod restarts midway through checkout. The inventory database hangs on subsequent purchases because indoubt locks are never released.",
    "strategies": [
      {
        "id": "strat_saga_compensating_tx_optimal",
        "title": "Replace 2PC with Choreographed/Orchestrated Saga Pattern & Compensating Transactions",
        "sqlCommand": "-- 1. Execute local ACID transactions per service:\nUPDATE inventory SET reserved = reserved + 1 WHERE sku = 'MACBOOK-PRO';\n-- Publish Domain Event to Kafka / Outbox table:\nINSERT INTO outbox_events (aggregate_id, event_type, payload) \nVALUES ('ord_102', 'InventoryReserved', '{\"sku\": \"MACBOOK-PRO\"}');\n\n-- 2. If downstream Payment service fails, execute compensating action:\n-- UPDATE inventory SET reserved = reserved - 1 WHERE sku = 'MACBOOK-PRO';",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Local ACID transactions with asynchronous event-driven compensation (Zero cross-network distributed lock holding)",
        "engineExplanation": "Winner! Two-Phase Commit is a blocking protocol: if the coordinator crashes during the prepare/commit phase, participants must hold exclusive database locks indefinitely until manual intervention, destroying availability. The Saga pattern breaks the distributed transaction into independent local transactions with compensating undo actions, maintaining high availability."
      },
      {
        "id": "strat_increase_xa_timeout",
        "title": "Set xa_detach_on_prepare = 1 and elevate transaction timeout",
        "sqlCommand": "SET GLOBAL xa_detach_on_prepare = 1;",
        "isOptimal": false,
        "resultingCost": 500000,
        "resultingLatencyMs": 60000,
        "executionPlanSummary": "Detaches thread but row locks remain held by indoubt XA transaction",
        "engineExplanation": "Detaching the session frees the client connection thread, but the underlying database locks remain held on disk by the prepared transaction."
      },
      {
        "id": "strat_kill_xa_transactions_cron",
        "title": "Run a bash cron script every 10 seconds executing XA ROLLBACK on all prepared transactions",
        "sqlCommand": "XA RECOVER; -- parse and XA ROLLBACK '...';",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 5.0,
        "executionPlanSummary": "High data corruption: Rolls back transactions that were actually committed on other nodes, creating ledger inconsistencies",
        "engineExplanation": "Blindly rolling back prepared transactions risks rolling back a transaction that committed on node 2, violating ACID atomicity across services."
      }
    ],
    "keyTakeaway": "Two-Phase Commit (2PC) is synchronous and blocking; coordinator crashes hold database row locks indefinitely. Modern distributed systems use Sagas with compensating transactions and transactional outboxes."
  },

  // ── Scenario 99: Scatter-Gather Sharding Query Fanout Across 64 Physical Database Nodes (Staff) ──
  {
    "id": "database_sharding_key_fanout_prevention",
    "title": "Scatter-Gather Sharding Query Fanout Across 64 Physical Database Nodes",
    "difficulty": "Staff",
    "category": "sharding",
    "categoryLabel": "Table Partitioning & Sharding",
    "tableName": "sharded_orders (64 physical Vitess/Citus shards)",
    "rowCount": "2,000,000,000 rows across shards",
    "tableSizeDisk": "1.2 TB across cluster",
    "slowQuery": "-- Sharding Key is tenant_id, but query searches by customer_email:\nSELECT order_id, order_total, created_at\nFROM sharded_orders\nWHERE customer_email = 'alice@example.com'\nORDER BY created_at DESC\nLIMIT 10;",
    "initialCost": 640000,
    "initialLatencyMs": 1850,
    "initialPlanSummary": "Scatter-Gather Fanout: Middleware sends query to ALL 64 shards simultaneously. Latency bounded by the 99th percentile slowest replica node.",
    "businessContext": "Multi-tenant e-commerce platform sharded across 64 MySQL nodes by tenant_id. Searching orders by customer email fans out across all 64 database instances, saturating network switches and driving tail latency to 2 seconds.",
    "strategies": [
      {
        "id": "strat_global_lookup_secondary_index_optimal",
        "title": "Deploy Global Secondary Lookup Index / Sharded Routing Table (email -> tenant_id)",
        "sqlCommand": "-- 1. Query lightweight global routing table (or Redis / Citus reference table):\nSELECT tenant_id FROM user_tenant_lookup WHERE customer_email = 'alice@example.com';\n-- Result: tenant_id = 42\n\n-- 2. Direct targeted query with shard routing key:\nSELECT order_id, order_total, created_at\nFROM sharded_orders\nWHERE tenant_id = 42 AND customer_email = 'alice@example.com'\nORDER BY created_at DESC\nLIMIT 10;",
        "isOptimal": true,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "Direct Point-to-Point Shard Routing -> Single shard contacted, zero scatter-gather fanout",
        "engineExplanation": "Winner! In a sharded database, any query omitting the sharding key must be broadcast to every single shard (scatter-gather). Cluster tail latency is bounded by the slowest replica ($P(\text{slow}) = 1 - (1-p)^{64}$). Maintaining a global secondary lookup table or distributed cache resolves the shard key in 0.5ms, turning a 64-node fanout into a targeted single-node lookup."
      },
      {
        "id": "strat_parallel_goroutines_fanout",
        "title": "Use 64 Go goroutines to query all shards concurrently",
        "sqlCommand": "// Application fanout with sync.WaitGroup across 64 database connections",
        "isOptimal": false,
        "resultingCost": 640000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "Scatter-gather fanout still burns 64x CPU and saturates database connection pools across all 64 nodes",
        "engineExplanation": "Application parallelization does not eliminate resource waste. 1,000 concurrent searches consume 64,000 active database connection slots."
      },
      {
        "id": "strat_rehash_shard_key_email",
        "title": "Change sharding key to hash(customer_email)",
        "sqlCommand": "-- Re-shard entire database by customer_email",
        "isOptimal": false,
        "resultingCost": 1000000,
        "resultingLatencyMs": 2500,
        "executionPlanSummary": "Breaks all multi-tenant queries (WHERE tenant_id = X), turning 99% of business traffic into fanout queries",
        "engineExplanation": "Switching the sharding key to email fixes email searches but breaks all merchant/tenant-scoped analytics and operations."
      }
    ],
    "keyTakeaway": "Queries omitting the database sharding key cause scatter-gather fanout across all shards, suffering from tail latency amplification. Build a global lookup index to resolve the shard key before querying."
  },

  // ── Scenario 100: Extreme Write Latch Contention on Single Counter Hotspot (100k TPS) (Staff) ──
  {
    "id": "hotspot_sharded_counter_architecture",
    "title": "Extreme Write Latch Contention on Single Counter Hotspot (100k TPS)",
    "difficulty": "Staff",
    "category": "distributed",
    "categoryLabel": "Distributed Systems & Architecture",
    "tableName": "video_likes",
    "rowCount": "1 viral video (100,000 likes/sec)",
    "tableSizeDisk": "Single row in database page",
    "slowQuery": "-- 10,000 concurrent API workers executing:\nUPDATE video_stats \nSET like_count = like_count + 1 \nWHERE video_id = 999999;",
    "initialCost": 8.4,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Exclusive row-level latch queue -> 10,000 threads queueing for single row in InnoDB buffer pool, TPS drops from 100k to 800",
    "businessContext": "Global livestream platform where a celebrity video receives 100,000 likes per second. Even on a 128-core bare metal database, CPU maxes out on kernel spinlocks and row-lock queues.",
    "strategies": [
      {
        "id": "strat_sharded_counter_buckets_optimal",
        "title": "Deploy Sharded Counter Buckets (N Slots per Entity)",
        "sqlCommand": "-- 1. Table holds N discrete bucket slots for each video:\nCREATE TABLE video_like_buckets (\n  video_id BIGINT NOT NULL,\n  slot_id INT NOT NULL,\n  like_count BIGINT DEFAULT 0,\n  PRIMARY KEY (video_id, slot_id)\n);\n-- Pre-populate 100 slots for video:\n-- INSERT INTO video_like_buckets SELECT 999999, generate_series(0, 99), 0;\n\n-- 2. Worker increments random slot (eliminating single-row latch contention):\nUPDATE video_like_buckets \nSET like_count = like_count + 1 \nWHERE video_id = 999999 AND slot_id = floor(random() * 100)::int;\n\n-- 3. Read total likes via sum across the 100 slots:\n-- SELECT SUM(like_count) FROM video_like_buckets WHERE video_id = 999999;",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.4,
        "executionPlanSummary": "Index Update on random slot -> Write load distributed across 100 physical rows, achieving 100,000+ TPS",
        "engineExplanation": "Winner! A single database row can only be locked and modified by one CPU thread at a time (Amdahl's Law). No amount of hardware can overcome the single-row write barrier. By splitting the counter into N discrete buckets (e.g. 100 slots) and writing to a random slot, lock contention is reduced by 100x. SUM(like_count) aggregates the total in sub-millisecond time."
      },
      {
        "id": "strat_atomic_redis_incr",
        "title": "Move counter directly to Redis INCR without durability persistence",
        "sqlCommand": "INCR video:999999:likes",
        "isOptimal": false,
        "resultingCost": 0,
        "resultingLatencyMs": 0.3,
        "executionPlanSummary": "High throughput but risk of permanent like count loss upon Redis node failover without persistence",
        "engineExplanation": "Pure Redis counters without transactional reconciliation or durability risk losing user engagements during network partitions or node failover."
      },
      {
        "id": "strat_spin_lock_delay",
        "title": "Tune innodb_spin_wait_delay to 96",
        "sqlCommand": "SET GLOBAL innodb_spin_wait_delay = 96;",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 3800,
        "executionPlanSummary": "Reduces CPU heat slightly but throughput remains hard-capped at 800 TPS by single-row serialization",
        "engineExplanation": "Tuning spinlock delays treats CPU symptoms without solving the fundamental physical bottleneck of single-row lock serialization."
      }
    ],
    "keyTakeaway": "A single database row cannot scale past ~1,000-2,000 concurrent writes/second due to row-level page latches. Scale write-heavy counters using distributed counter buckets (N slots per entity)."
  },

  // ── Scenario 101: Full Table Backup Flushing Hot Working Set from InnoDB Buffer Pool (Staff) ──
  {
    "id": "buffer_pool_lru_cache_pollution",
    "title": "Full Table Backup Flushing Hot Working Set from InnoDB Buffer Pool",
    "difficulty": "Staff",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "mysqldump / historical_archive",
    "rowCount": "800,000,000 archived rows",
    "tableSizeDisk": "180 GB table / 64 GB Buffer Pool",
    "slowQuery": "-- Nightly mysqldump or analytics export scans entire cold archive:\nSELECT /*!40001 SQL_NO_CACHE */ * FROM historical_archive;",
    "initialCost": 2500000,
    "initialLatencyMs": 450000,
    "initialPlanSummary": "Full Table Scan -> Evicts active OLTP customer working pages from the Young sublist of the Buffer Pool LRU chain!",
    "businessContext": "Every night at 2:00 AM during automated backups, production API p99 latency spikes from 2ms to 450ms for 3 hours because the backup sweeps millions of cold pages into the InnoDB Buffer Pool, purging hot user sessions.",
    "strategies": [
      {
        "id": "strat_tune_old_blocks_time_optimal",
        "title": "Configure innodb_old_blocks_time & innodb_old_blocks_pct to Shield Working Set",
        "sqlCommand": "-- Guard the Young LRU generation from single-pass scans:\nSET GLOBAL innodb_old_blocks_time = 1000; -- 1000ms delay before promoting to Young list!\nSET GLOBAL innodb_old_blocks_pct = 20;    -- Shrink Old generation to 20% of buffer pool\n\n-- Run mysqldump with non-locking transaction consistency:\n-- mysqldump --single-transaction --quick ...",
        "isOptimal": true,
        "resultingCost": 850000,
        "resultingLatencyMs": 2.1,
        "executionPlanSummary": "Cold scan pages remain confined to Old sublist and are rapidly evicted without evicting hot OLTP pages",
        "engineExplanation": "Winner! InnoDB uses a midpoint insertion LRU algorithm split into 'Young' (hot) and 'Old' (cold) sublists. New pages enter the Old sublist. By setting innodb_old_blocks_time = 1000 (1 second), pages accessed during a rapid full table scan cannot be promoted to the Young sublist unless re-accessed after 1,000ms. Hot OLTP pages remain safely pinned in memory."
      },
      {
        "id": "strat_sql_no_cache_directive",
        "title": "Add SQL_NO_CACHE to the query",
        "sqlCommand": "SELECT SQL_NO_CACHE * FROM historical_archive;",
        "isOptimal": false,
        "resultingCost": 2500000,
        "resultingLatencyMs": 440000,
        "executionPlanSummary": "SQL_NO_CACHE only affected the legacy MySQL Query Cache (removed in 8.0); it has zero effect on InnoDB Buffer Pool",
        "engineExplanation": "SQL_NO_CACHE disabled the deprecated MySQL query cache; it does not stop InnoDB from reading data pages into the buffer pool."
      },
      {
        "id": "strat_double_buffer_pool_ram",
        "title": "Upgrade instance RAM to 256 GB to fit entire archive",
        "sqlCommand": "-- Upgrade cloud instance to r6i.8xlarge",
        "isOptimal": false,
        "resultingCost": 2500000,
        "resultingLatencyMs": 350000,
        "executionPlanSummary": "Increases cloud infrastructure costs by $15,000/year without solving the fundamental cache churn flaw",
        "engineExplanation": "Expanding memory is expensive and temporary; once the archive table exceeds 256 GB, the exact same cache pollution returns."
      }
    ],
    "keyTakeaway": "Large table scans pollute the buffer pool by evicting hot working sets. Protect your active working set using innodb_old_blocks_time (e.g. 1000ms) to quarantine scan pages in the cold LRU sublist."
  },

  // ── Scenario 102: PostgreSQL 8KB Page Torn Writes vs OS Filesystem Block Misalignment (Staff) ──
  {
    "id": "zfs_ext4_recordsize_page_alignment",
    "title": "PostgreSQL 8KB Page Torn Writes vs OS Filesystem Block Misalignment",
    "difficulty": "Staff",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "financial_records",
    "rowCount": "100,000,000 rows",
    "tableSizeDisk": "45 GB on disk",
    "slowQuery": "-- Heavy write transactions encountering double-buffering write amplification:\nINSERT INTO financial_records (id, amount, account_id) \nSELECT g, random()*1000, 42 FROM generate_series(1, 100000) g;",
    "initialCost": 85000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "Kernel I/O bottleneck: PostgreSQL 8KB pages misaligned with ZFS 128KB recordsize (Read-Modify-Write amplification) + WAL full_page_writes penalty",
    "businessContext": "PostgreSQL running on ZFS / ext4 NVMe storage shows 8x write amplification compared to raw SQL throughput. Storage controller saturates due to read-modify-write block misalignments.",
    "strategies": [
      {
        "id": "strat_match_recordsize_and_compression_optimal",
        "title": "Align Filesystem recordsize to 8KB & Match PostgreSQL Block Size",
        "sqlCommand": "-- On ZFS storage pool for PostgreSQL data directory:\n-- zfs set recordsize=8k tank/postgres/data\n-- zfs set compression=lz4 tank/postgres/data\n-- zfs set atime=off tank/postgres/data\n-- zfs set logbias=latency tank/postgres/data\n\n-- In postgresql.conf:\n-- wal_init_zero = off\n-- wal_recycle = off (on ZFS CoW)",
        "isOptimal": true,
        "resultingCost": 12000,
        "resultingLatencyMs": 620,
        "executionPlanSummary": "Perfect 8KB-to-8KB block alignment eliminates Read-Modify-Write cycles, cutting write amplification by 80%",
        "engineExplanation": "Winner! By default, ZFS uses a 128KB recordsize. When PostgreSQL modifies an 8KB data page, ZFS must read the entire 128KB block from disk, update 8KB, and write back all 128KB (Read-Modify-Write)! Setting ZFS recordsize=8k aligns filesystem allocation units perfectly with PostgreSQL's 8KB page size, slashing write I/O."
      },
      {
        "id": "strat_disable_full_page_writes",
        "title": "Set full_page_writes = off in postgresql.conf",
        "sqlCommand": "ALTER SYSTEM SET full_page_writes = off; SELECT pg_reload_conf();",
        "isOptimal": false,
        "resultingCost": 12000,
        "resultingLatencyMs": 580,
        "executionPlanSummary": "CRITICAL RISK: Causes torn page corruption on non-CoW filesystems (ext4/XFS) during OS crash",
        "engineExplanation": "On ext4/XFS, disabling full_page_writes means an OS crash midway through writing an 8KB page leaves half-written pages that cannot be repaired by WAL recovery."
      },
      {
        "id": "strat_increase_checkpoint_timeout",
        "title": "Increase checkpoint_timeout to 24 hours",
        "sqlCommand": "ALTER SYSTEM SET checkpoint_timeout = '24h';",
        "isOptimal": false,
        "resultingCost": 85000,
        "resultingLatencyMs": 4500,
        "executionPlanSummary": "Causes hours of crash recovery time during reboot and saturates disk with uncheckpointed WAL",
        "engineExplanation": "Extreme checkpoint timeouts inflate recovery time (RTO) to hours and consume hundreds of gigabytes of WAL disk storage."
      }
    ],
    "keyTakeaway": "Always match the underlying OS filesystem block/recordsize to the database page size (e.g. ZFS recordsize=8k for PostgreSQL 8KB pages) to prevent severe Read-Modify-Write amplification."
  },

  // ── Scenario 103: Read-After-Write Consistency Lag in Primary-Replica Topology (Staff) ──
  {
    "id": "read_your_own_writes_lsn_tracking",
    "title": "Read-After-Write Consistency Lag in Primary-Replica Topology",
    "difficulty": "Staff",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "user_comments",
    "rowCount": "50,000,000 rows",
    "tableSizeDisk": "15 GB on disk",
    "slowQuery": "-- 1. Client posts a new comment (written to Primary):\nINSERT INTO user_comments (comment_id, user_id, body) VALUES (502, 99, 'Great post!');\n\n-- 2. Client is redirected to post page, which reads from Read Replica:\nSELECT * FROM user_comments WHERE post_id = 120 ORDER BY created_at DESC;\n-- The user's newly submitted comment is MISSING because replica has 200ms lag!",
    "initialCost": 8.4,
    "initialLatencyMs": 1.2,
    "initialPlanSummary": "Replica LSN lag: Read replica is 250ms behind primary. User does not see their own write and clicks 'Submit' 5 times in confusion.",
    "businessContext": "Social network users report comments disappear immediately after submitting. Frustrated users submit duplicate comments, overwhelming backend APIs.",
    "strategies": [
      {
        "id": "strat_lsn_gtid_read_your_writes_optimal",
        "title": "Track Primary Commit LSN/GTID via Session Cookie & Wait or Route to Primary",
        "sqlCommand": "-- On Primary after write, capture the Log Sequence Number / GTID:\nSELECT pg_current_wal_lsn(); -- Returns e.g. '0/16B3748'\n-- Set HTTP response cookie: X-User-LSN = '0/16B3748'\n\n-- On subsequent Read request:\n-- If reading from replica, wait until replica catches up:\nSELECT pg_wal_lsn_diff(pg_last_wal_replay_lsn(), '0/16B3748'::pg_lsn);\n-- If lag > 0, either sleep 20ms or route this specific user's query to Primary!",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "Causal Consistency (Read-Your-Own-Writes) guaranteed without sending all global read traffic to Primary",
        "engineExplanation": "Winner! Asynchronous replication always incurs a replication lag window. Routing ALL reads to the primary defeats the purpose of read replicas. By returning the transaction's commit LSN/GTID to the client and checking it before replica queries, you achieve causal 'Read-Your-Own-Writes' consistency while keeping 95% of reads distributed across replicas."
      },
      {
        "id": "strat_route_all_reads_primary",
        "title": "Route all application reads to the Primary database",
        "sqlCommand": "-- Configure Spring DataSource to send all reads to master_db",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 45.0,
        "executionPlanSummary": "Primary DB CPU spikes to 100%, saturating master connection pools and degrading write throughput",
        "engineExplanation": "Routing 100% of reads to the primary negates replica scalability and crashes the primary during peak traffic."
      },
      {
        "id": "strat_client_side_sleep",
        "title": "Add a Thread.sleep(500) before reading on the frontend/backend",
        "sqlCommand": "Thread.sleep(500);",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 501.2,
        "executionPlanSummary": "Arbitrary sleep wastes user time during normal operation and still fails if lag spikes above 500ms",
        "engineExplanation": "Fixed sleep intervals degrade user experience and provide zero formal correctness guarantees when replication lag exceeds the sleep duration."
      }
    ],
    "keyTakeaway": "Guarantee 'Read-Your-Own-Writes' in replica architectures by tracking the primary commit LSN/GTID in the user's session context and validating replica replay position before reading."
  },

  // ── Scenario 104: Database Connection Pool Sizing Thrashing (HikariCP 1,000 Connections) (Staff) ──
  {
    "id": "connection_pool_sizing_formula",
    "title": "Database Connection Pool Sizing Thrashing (HikariCP 1,000 Connections)",
    "difficulty": "Staff",
    "category": "performance",
    "categoryLabel": "Database Drivers & Streaming",
    "tableName": "pg_stat_activity",
    "rowCount": "1,000 concurrent active connections",
    "tableSizeDisk": "16-core CPU Database Server",
    "slowQuery": "-- 50 microservice instances each configured with maximumPoolSize = 20:\n-- Total 1,000 connections established to a 16-core database!\nSELECT order_id, status FROM orders WHERE user_id = 9812;",
    "initialCost": 8.4,
    "initialLatencyMs": 420.0,
    "initialPlanSummary": "OS Kernel context-switch storm: 16 physical CPU cores thrashing across 1,000 PostgreSQL worker processes. CPU spent on context switching > 70%!",
    "businessContext": "During traffic spikes, query latency degrades from 1ms to 420ms. Developers increased HikariCP pool size from 10 to 50 connections per pod, which paradoxically made query performance 10x worse.",
    "strategies": [
      {
        "id": "strat_hikaricp_formula_optimal",
        "title": "Apply HikariCP Pool Sizing Formula ((core_count * 2) + effective_spindle_count) & Add PgBouncer",
        "sqlCommand": "-- For a 16-core database with NVMe SSDs:\n-- Pool Size = (16 * 2) + 1 = 33 connections!\n\n-- Deploy PgBouncer in transaction pooling mode:\n-- pgbouncer.ini:\n-- pool_mode = transaction\n-- max_client_conn = 5000\n-- default_pool_size = 33\n\n-- In Spring Boot application.yml:\n-- hikari.maximum-pool-size: 10",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "CPU context switches drop by 95% -> 33 active workers execute in parallel without CPU starvation",
        "engineExplanation": "Winner! A CPU core can execute only ONE instruction thread at any instant. Running 1,000 PostgreSQL processes on 16 cores forces the Linux kernel into non-stop context switching and cache thrashing. The proven PostgreSQL/HikariCP formula is: connections = ((core_count * 2) + effective_spindle_count). Placing PgBouncer in transaction mode buffers thousands of incoming clients into a lean 33-connection pipeline."
      },
      {
        "id": "strat_increase_pool_to_5000",
        "title": "Increase database max_connections to 5,000",
        "sqlCommand": "ALTER SYSTEM SET max_connections = 5000;",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1200.0,
        "executionPlanSummary": "PostgreSQL allocates 10 MB per connection -> 50 GB RAM wasted on idle connection overhead, triggering Linux OOM killer",
        "engineExplanation": "PostgreSQL uses process-based concurrency (forked processes). Allocating thousands of connections exhausts RAM and causes out-of-memory kernel kills."
      },
      {
        "id": "strat_disable_connection_pooling",
        "title": "Disable connection pooling and open fresh TCP connections per HTTP request",
        "sqlCommand": "-- Remove HikariCP; connect via plain DriverManager",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 85.0,
        "executionPlanSummary": "TCP 3-way handshake + TLS negotiation + PostgreSQL fork overhead on every query destroys latency",
        "engineExplanation": "Establishing a raw PostgreSQL connection requires forking a backend process and TLS handshaking, adding 50-100ms overhead to every single query."
      }
    ],
    "keyTakeaway": "More database connections does NOT equal more speed. Formula: connections = ((cores * 2) + spindles). Use PgBouncer transaction pooling to handle thousands of application clients with a lean backend pool."
  },

  // ── Scenario 105: PostgreSQL LLVM JIT Compilation Latency Degrading Fast OLTP Queries (Staff) ──
  {
    "id": "postgresql_jit_compilation_oltp_degradation",
    "title": "PostgreSQL LLVM JIT Compilation Latency Degrading Fast OLTP Queries",
    "difficulty": "Staff",
    "category": "performance",
    "categoryLabel": "Query Optimizer & Statistics",
    "tableName": "order_items",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "4.8 GB on disk",
    "slowQuery": "SELECT SUM(quantity * unit_price) \nFROM order_items \nWHERE order_id = 45812;",
    "initialCost": 125000,
    "initialLatencyMs": 18.5,
    "initialPlanSummary": "JIT: Functions: 2, Options: Inlining true, Optimization true, Expressions true. JIT generation: 1.8ms, Inlining: 3.2ms, Optimization: 11.5ms, Emission: 1.8ms (Total JIT time: 18.3ms! Execution time: 0.2ms!)",
    "businessContext": "High-volume checkout API experiences unexpected 18ms latency on small order line aggregations. Profiling shows 99% of query time is spent by the LLVM compiler generating machine code rather than executing the query!",
    "strategies": [
      {
        "id": "strat_disable_jit_oltp_optimal",
        "title": "Disable JIT for OLTP Workloads (jit = off) or Raise jit_above_cost",
        "sqlCommand": "-- For OLTP database clusters:\nALTER SYSTEM SET jit = off;\nSELECT pg_reload_conf();\n\n-- Or raise the JIT compilation cost threshold from default 100,000 to 1,000,000:\n-- ALTER SYSTEM SET jit_above_cost = 1000000;",
        "isOptimal": true,
        "resultingCost": 125000,
        "resultingLatencyMs": 0.25,
        "executionPlanSummary": "Query executes via interpreted tuple evaluation in 0.25ms without LLVM compilation delay",
        "engineExplanation": "Winner! PostgreSQL 11+ enables LLVM Just-In-Time (JIT) compilation by default. While JIT accelerates long-running analytical queries (OLAP) processing billions of rows, the 15-20ms overhead of compiling LLVM bytecode is disastrous for short OLTP queries that only take 0.2ms to execute! Disabling JIT or raising jit_above_cost brings latency down to sub-millisecond speeds."
      },
      {
        "id": "strat_increase_jit_optimization",
        "title": "Enable LLVM aggressive optimization flags",
        "sqlCommand": "SET jit_optimize_above_cost = 0;",
        "isOptimal": false,
        "resultingCost": 125000,
        "resultingLatencyMs": 45.0,
        "executionPlanSummary": "LLVM optimization time increases from 11ms to 38ms, worsening response latency",
        "engineExplanation": "Instructing LLVM to perform deeper compiler passes increases compilation time without speeding up a query that scans only 5 order rows."
      },
      {
        "id": "strat_rewrite_as_stored_procedure",
        "title": "Convert the query into a PL/pgSQL stored function",
        "sqlCommand": "CREATE FUNCTION calculate_order_total(int) ...",
        "isOptimal": false,
        "resultingCost": 125000,
        "resultingLatencyMs": 18.2,
        "executionPlanSummary": "JIT compilation still triggers inside PL/pgSQL for statements exceeding jit_above_cost",
        "engineExplanation": "Wrapping SQL in stored procedures does not disable LLVM JIT compilation for statements meeting the cost threshold."
      }
    ],
    "keyTakeaway": "PostgreSQL LLVM JIT compilation introduces a 10-25ms compilation overhead. For OLTP databases dominated by short queries, disable JIT (jit = off) or elevate jit_above_cost."
  },

  // ── Scenario 106: Zero-Downtime Column Type Widening (INT to BIGINT on 500M Rows) (Staff) ──
  {
    "id": "zero_downtime_column_type_widening",
    "title": "Zero-Downtime Column Type Widening (INT to BIGINT on 500M Rows)",
    "difficulty": "Staff",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "transactions",
    "rowCount": "500,000,000 rows",
    "tableSizeDisk": "85 GB on disk",
    "slowQuery": "-- Transaction ID sequence approaching 2,147,483,647 (INT overflow!):\nALTER TABLE transactions ALTER COLUMN transaction_id TYPE BIGINT;\n-- Table freezes under AccessExclusiveLock for 4 hours!",
    "initialCost": 5000000,
    "initialLatencyMs": 14400000,
    "initialPlanSummary": "AccessExclusiveLock held -> Full table rewrite rewriting all 500M tuples on disk, halting all production traffic",
    "businessContext": "Core transaction ID column is 2 weeks away from overflowing the 32-bit signed integer limit (2.14B). Running direct ALTER TABLE would require taking the entire banking app offline for 4 hours.",
    "strategies": [
      {
        "id": "strat_dual_column_shadow_migration_optimal",
        "title": "Dual-Column Shadow Write Migration (Additive Column + Backfill + Dual Writes + Atomic Swap)",
        "sqlCommand": "-- Phase 1: Add shadow column (instant metadata-only change in Postgres/MySQL 8):\nALTER TABLE transactions ADD COLUMN transaction_id_bigint BIGINT;\n\n-- Phase 2: Create trigger / dual write in app for new writes:\nCREATE OR REPLACE FUNCTION sync_tx_id() RETURNS TRIGGER AS $$\nBEGIN\n  NEW.transaction_id_bigint = NEW.transaction_id;\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\nCREATE TRIGGER trg_sync_tx_id BEFORE INSERT OR UPDATE ON transactions\nFOR EACH ROW EXECUTE FUNCTION sync_tx_id();\n\n-- Phase 3: Background chunked backfill of historical rows:\n-- UPDATE transactions SET transaction_id_bigint = transaction_id WHERE id BETWEEN X AND Y;\n\n-- Phase 4: Atomic cutover in microsecond lock window!",
        "isOptimal": true,
        "resultingCost": 45.0,
        "resultingLatencyMs": 2.5,
        "executionPlanSummary": "Zero downtime achieved -> 100% production uptime maintained throughout 500M row migration",
        "engineExplanation": "Winner! Changing column types between incompatible binary widths (INT 4 bytes to BIGINT 8 bytes) requires physically rewriting every single disk page and index tuple. A direct ALTER TABLE locks the table exclusively. The shadow column migration pattern decouples the rewrite into an asynchronous backfill while live traffic continues uninterrupted."
      },
      {
        "id": "strat_maintenance_window_alter",
        "title": "Schedule a 4-hour weekend maintenance downtime window",
        "sqlCommand": "ALTER TABLE transactions ALTER COLUMN transaction_id TYPE BIGINT;",
        "isOptimal": false,
        "resultingCost": 5000000,
        "resultingLatencyMs": 14400000,
        "executionPlanSummary": "Complete business outage, SLA violations, and customer service disruption for 4 hours",
        "engineExplanation": "Downtime maintenance windows damage customer trust and violate modern 99.99% high-availability enterprise SLAs."
      },
      {
        "id": "strat_cast_in_view",
        "title": "Create a View casting transaction_id::BIGINT",
        "sqlCommand": "CREATE VIEW v_transactions AS SELECT transaction_id::BIGINT FROM transactions;",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Does not solve sequence overflow: nextval() will still fail with 'integer out of range' at 2,147,483,648",
        "engineExplanation": "Casting in a view does not change the physical column type or sequence limits; the sequence will still overflow and crash all future inserts."
      }
    ],
    "keyTakeaway": "Widening column types (INT to BIGINT) requires a full table rewrite. Achieve zero downtime using the shadow column pattern: add new column, dual-write, background chunked backfill, and cut over atomically."
  },

  // ── Scenario 107: Distributed Lock Expiration During JVM GC Pause & Lack of Fencing Tokens (Staff) ──
  {
    "id": "distributed_lock_fencing_token_gc_pause",
    "title": "Distributed Lock Expiration During JVM GC Pause & Lack of Fencing Tokens",
    "difficulty": "Staff",
    "category": "distributed",
    "categoryLabel": "Distributed Systems & Architecture",
    "tableName": "shared_storage / invoices",
    "rowCount": "Distributed microservice workers",
    "tableSizeDisk": "Shared database / object store",
    "slowQuery": "-- Client 1 acquires Redis lock with 10s TTL:\nSET lock:invoice:42 token_abc NX PX 10000;\n-- Client 1 enters major Stop-The-World (STW) JVM Garbage Collection pause for 15 seconds!\n-- TTL expires! Client 2 acquires the lock:\nSET lock:invoice:42 token_xyz NX PX 10000;\n-- Client 1 wakes up from GC and proceeds to write, overwriting Client 2!",
    "initialCost": 1.0,
    "initialLatencyMs": 15000,
    "initialPlanSummary": "Split-brain race condition: Both Client 1 and Client 2 believe they hold the lock, producing silent financial ledger corruption",
    "businessContext": "Automated billing engine issues duplicate customer invoices and double-refunds accounts because distributed locks expire during JVM GC pauses or cloud network hiccups.",
    "strategies": [
      {
        "id": "strat_fencing_tokens_optimal",
        "title": "Enforce Monotonically Increasing Fencing Tokens at the Database Storage Layer",
        "sqlCommand": "-- 1. Lock service (Zookeeper / etcd / Redis Redlock) returns a monotonic fencing token:\n-- Client 1 gets token = 31; Client 2 gets token = 32\n\n-- 2. Database enforces fencing validation on every write:\nUPDATE invoices \nSET status = 'PROCESSED', processed_by = 'client_1', last_fencing_token = 31\nWHERE invoice_id = 42 AND last_fencing_token < 31;\n\n-- If Client 1 executes after Client 2 (token 32), the write is rejected (0 rows updated)!",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Storage-level fencing token check rejects stale zombie writes, eliminating split-brain corruption",
        "engineExplanation": "Winner! As Martin Kleppmann proved, distributed locks based on timeouts (Redis TTL) CANNOT guarantee mutual exclusion in asynchronous networks subject to GC pauses, thread descheduling, or network delays. You must validate a monotonically increasing fencing token at the target storage layer (e.g. 'WHERE last_fencing_token < :token') to reject writes from zombie processes."
      },
      {
        "id": "strat_increase_redis_ttl_to_10_minutes",
        "title": "Increase Redis lock TTL from 10 seconds to 600 seconds",
        "sqlCommand": "SET lock:invoice:42 token NX PX 600000",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "If a worker crashes, the resource remains frozen and locked for 10 minutes, destroying system availability",
        "engineExplanation": "Lengthening TTLs creates massive availability outages when workers crash, while still failing if a delay exceeds the longer TTL."
      },
      {
        "id": "strat_use_zgc_garbage_collector",
        "title": "Switch JVM to ZGC (-XX:+UseZGC) and assume pauses never occur",
        "sqlCommand": "java -XX:+UseZGC -jar app.jar",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Reduces GC pause times but does not prevent hypervisor CPU steals, VM migration pauses, or network delays",
        "engineExplanation": "Low-pause collectors like ZGC reduce GC pauses but cannot eliminate operating system paging, hypervisor virtualization pauses, or network partitions."
      }
    ],
    "keyTakeaway": "Distributed locks with timeouts cannot guarantee safety across GC pauses or network delays. Always enforce monotonic fencing tokens at the database storage layer to reject stale zombie writes."
  },

  // ── Scenario 108: Automated Replica Failover Split-Brain & Dual Primary Data Corruption (Staff) ──
  {
    "id": "replica_promotion_split_brain_fencing",
    "title": "Automated Replica Failover Split-Brain & Dual Primary Data Corruption",
    "difficulty": "Staff",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "cluster_metadata / customer_ledger",
    "rowCount": "HA Primary + 2 Standbys",
    "tableSizeDisk": "Multi-node PostgreSQL cluster",
    "slowQuery": "-- Transient 5-second network partition separates Node A (Primary) from Node B (Replica):\n-- Failover orchestrator declares Node A dead and promotes Node B to Primary!\n-- Network heals: Both Node A and Node B are now accepting writes with divergent timelines!",
    "initialCost": 1000000,
    "initialLatencyMs": 5000,
    "initialPlanSummary": "Split-brain divergence: Node A writes LSN 0/2000000 while Node B writes different transactions at LSN 0/2000000. Data diverges irreversibly!",
    "businessContext": "High-availability database cluster suffers transient network blip. Automated failover promotes a replica while the old primary is still alive. Both accept writes, resulting in divergent databases that cannot be merged without manual reconciliation.",
    "strategies": [
      {
        "id": "strat_patroni_etcd_dcs_fencing_optimal",
        "title": "Deploy Distributed Consensus DCS (Patroni + etcd) with Watchdog Fencing (STONITH)",
        "sqlCommand": "-- Configure Patroni with etcd DCS and Linux hardware watchdog:\n-- patroni.yml:\n# dcs:\n#   ttl: 30\n#   loop_wait: 10\n#   retry_timeout: 10\n# watchdog:\n#   mode: automatic\n#   device: /dev/watchdog\n\n-- If Primary cannot renew its etcd DCS leader lease within TTL,\n-- the kernel watchdog hardware resets the machine instantly (STONITH)!",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Hardware watchdog terminates zombie primary before replica is promoted, mathematically preventing split-brain",
        "engineExplanation": "Winner! High-availability failover without robust fencing guarantees data divergence. Patroni integrates with a Distributed Consensus Store (etcd/Consul) via leader lease locks, backed by Linux /dev/watchdog. If the primary loses contact with the DCS quorum, the hardware watchdog hard-resets the node (Shoot The Other Node In The Head - STONITH) before a new leader can accept writes."
      },
      {
        "id": "strat_custom_bash_ping_failover",
        "title": "Use custom Bash script that pings the primary and promotes replica if 3 pings fail",
        "sqlCommand": "if ! ping -c 3 master_ip; then pg_ctl promote; fi",
        "isOptimal": false,
        "resultingCost": 1000000,
        "resultingLatencyMs": 3000,
        "executionPlanSummary": "Guaranteed split-brain: Ping failures from transient packet loss promote replica while master remains active",
        "engineExplanation": "Homegrown ping-based failover scripts are the number one cause of split-brain catastrophes in production databases."
      },
      {
        "id": "strat_manual_failover_only",
        "title": "Disable automated failover entirely; require human DBA manual promotion",
        "sqlCommand": "-- No failover tooling",
        "isOptimal": false,
        "resultingCost": 1000000,
        "resultingLatencyMs": 1800000,
        "executionPlanSummary": "30 to 60 minutes downtime during real hardware crashes waiting for on-call DBA to wake up",
        "engineExplanation": "Manual failover avoids split-brain but blows through MTTR SLAs, turning a 30-second failover into an hour-long outage."
      }
    ],
    "keyTakeaway": "Automated failover without strict node fencing (STONITH / DCS leader leases like Patroni + etcd) inevitably leads to dual-primary split-brain and permanent data divergence."
  },

  // ── Scenario 109: Write Skew Anomaly Under Snapshot Isolation (The Two Doctors On-Call) (Staff) ──
  {
    "id": "read_committed_snapshot_isolation_anomalies",
    "title": "Write Skew Anomaly Under Snapshot Isolation (The Two Doctors On-Call)",
    "difficulty": "Staff",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "on_call_roster",
    "rowCount": "100 doctors",
    "tableSizeDisk": "15 MB on disk",
    "slowQuery": "-- Rule: At least ONE doctor must remain on call at all times!\n-- Currently Dr. Alice and Dr. Bob are on call (count = 2).\n\n-- Transaction 1 (Dr. Alice requests to leave):\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ; -- (Snapshot Isolation)\nSELECT count(*) FROM on_call_roster WHERE is_on_call = true; -- Returns 2\nUPDATE on_call_roster SET is_on_call = false WHERE doctor_id = 1;\nCOMMIT;\n\n-- Concurrent Transaction 2 (Dr. Bob requests to leave simultaneously):\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT count(*) FROM on_call_roster WHERE is_on_call = true; -- Returns 2\nUPDATE on_call_roster SET is_on_call = false WHERE doctor_id = 2;\nCOMMIT;\n-- Both commit successfully! 0 doctors remain on call! Rule violated!",
    "initialCost": 8.4,
    "initialLatencyMs": 1.2,
    "initialPlanSummary": "Write Skew: Both transactions read consistent snapshots and update non-overlapping rows, satisfying Snapshot Isolation but violating business invariants!",
    "businessContext": "Hospital scheduling and financial allocation systems under REPEATABLE READ isolation suffer state corruption because Snapshot Isolation does not prevent Write Skew anomalies.",
    "strategies": [
      {
        "id": "strat_pessimistic_for_update_or_serializable_optimal",
        "title": "Use SELECT FOR UPDATE Lock or Upgrade to SERIALIZABLE Isolation",
        "sqlCommand": "-- Approach A: Explicit row-level lock on the hospital constraint:\nBEGIN;\nSELECT count(*) FROM on_call_roster WHERE is_on_call = true FOR UPDATE;\n-- Locks all matching rows, serializing both transactions!\nUPDATE on_call_roster SET is_on_call = false WHERE doctor_id = 1;\nCOMMIT;\n\n-- Approach B: True Serializable Isolation:\n-- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "LockRows prevents concurrent mutation -> Second transaction re-checks count and aborts with validation error",
        "engineExplanation": "Winner! Write Skew occurs when two transactions read overlapping datasets, but make updates to disjoint rows based on the snapshot they saw. Snapshot Isolation (REPEATABLE READ) prevents dirty reads, non-repeatable reads, and lost updates, but DOES NOT prevent Write Skew! You must either use explicit SELECT FOR UPDATE or full SERIALIZABLE isolation."
      },
      {
        "id": "strat_rely_on_repeatable_read",
        "title": "Keep REPEATABLE READ and add an application if-statement check",
        "sqlCommand": "if (count >= 2) { update(); }",
        "isOptimal": false,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Both application threads read count == 2 from their separate MVCC snapshots, reproducing the invariant violation",
        "engineExplanation": "Application-level checks read from their respective MVCC snapshots, meaning both threads see count == 2 and both proceed to leave."
      },
      {
        "id": "strat_check_constraint_count",
        "title": "Add a SQL CHECK constraint: CHECK ((SELECT count(*) ...) >= 1)",
        "sqlCommand": "ALTER TABLE on_call_roster ADD CONSTRAINT chk_min_doctors CHECK (...);",
        "isOptimal": false,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "ERROR: subqueries are not allowed in CHECK constraints",
        "engineExplanation": "SQL engines disallow subqueries in standard table CHECK constraints because constraints must evaluate on a single row."
      }
    ],
    "keyTakeaway": "Snapshot Isolation (REPEATABLE READ) does not prevent Write Skew anomalies. Enforce cross-row invariants using explicit SELECT FOR UPDATE locking or SERIALIZABLE isolation."
  },

  // ── Scenario 110: MySQL Semi-Consistent Read Under READ COMMITTED Isolation (Staff) ──
  {
    "id": "semi_consistent_read_innodb_concurrency",
    "title": "MySQL Semi-Consistent Read Under READ COMMITTED Isolation",
    "difficulty": "Staff",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "subscriptions",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.5 GB on disk",
    "slowQuery": "-- Session 1 updates a row and holds exclusive lock:\nBEGIN;\nUPDATE subscriptions SET status = 'EXPIRED' WHERE user_id = 500;\n-- Does not commit yet...\n\n-- Session 2 runs broad update on non-indexed column under READ COMMITTED:\nUPDATE subscriptions SET notification_sent = true WHERE email_domain = 'gmail.com';",
    "initialCost": 350000,
    "initialLatencyMs": 12000,
    "initialPlanSummary": "Table Scan -> In REPEATABLE READ: Blocks on user_id=500 and fails with Lock wait timeout. In READ COMMITTED: Semi-Consistent Read evaluates latest committed version!",
    "businessContext": "Large batch notification update on a table with active OLTP modifications freezes due to lock wait timeouts under REPEATABLE READ, but completes smoothly under READ COMMITTED.",
    "strategies": [
      {
        "id": "strat_index_and_semi_consistent_optimal",
        "title": "Index Filter Column & Leverage READ COMMITTED Semi-Consistent Reads",
        "sqlCommand": "-- 1. Add index so update does not scan and lock every record:\nCREATE INDEX idx_subs_domain ON subscriptions(email_domain);\n\n-- 2. Use READ COMMITTED isolation:\nSET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;\nUPDATE subscriptions SET notification_sent = true WHERE email_domain = 'gmail.com';",
        "isOptimal": true,
        "resultingCost": 45.0,
        "resultingLatencyMs": 3.2,
        "executionPlanSummary": "Index Range Scan -> Locks only exact matching rows; non-matching rows are immediately released",
        "engineExplanation": "Winner! In MySQL InnoDB under READ COMMITTED, a 'Semi-Consistent Read' occurs during UPDATE: if a scanned row is locked by another transaction, InnoDB reads its latest committed snapshot from undo log to test whether the row matches the WHERE clause. If it does not match, InnoDB moves on without waiting for the lock! Adding an index avoids table scans entirely."
      },
      {
        "id": "strat_lock_wait_timeout_increase",
        "title": "Increase innodb_lock_wait_timeout to 600s",
        "sqlCommand": "SET innodb_lock_wait_timeout = 600;",
        "isOptimal": false,
        "resultingCost": 350000,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "Transactions wait 10 minutes for lock resolution, blocking all other DML on subscriptions",
        "engineExplanation": "Increasing lock timeout causes threads to pile up and wait for minutes, degrading overall database responsiveness."
      },
      {
        "id": "strat_lock_table_write",
        "title": "Acquire LOCK TABLES subscriptions WRITE before updating",
        "sqlCommand": "LOCK TABLES subscriptions WRITE; UPDATE subscriptions ...; UNLOCK TABLES;",
        "isOptimal": false,
        "resultingCost": 350000,
        "resultingLatencyMs": 15000,
        "executionPlanSummary": "Exclusive table lock completely halts all user logins and API queries for 15 seconds",
        "engineExplanation": "LOCK TABLES WRITE halts the entire application by blocking all reads and writes across the entire table."
      }
    ],
    "keyTakeaway": "In MySQL InnoDB READ COMMITTED mode, Semi-Consistent Reads evaluate committed versions of locked rows to check WHERE conditions, bypassing unnecessary lock waits on non-matching records."
  },

  // ── Scenario 111: Multi-Dimensional Ad-Hoc Filtering via PostgreSQL Bloom Filter Index (Staff) ──
  {
    "id": "bloom_filter_index_ad_hoc_olap",
    "title": "Multi-Dimensional Ad-Hoc Filtering via PostgreSQL Bloom Filter Index",
    "difficulty": "Staff",
    "category": "indexing",
    "categoryLabel": "Specialized Index Types",
    "tableName": "ecommerce_catalog",
    "rowCount": "50,000,000 products",
    "tableSizeDisk": "18 GB table / 15 separate B-Tree indexes (45 GB!)",
    "slowQuery": "-- Ad-hoc search filtering any arbitrary combination of 8 product attributes:\nSELECT product_id, title, price \nFROM ecommerce_catalog\nWHERE brand_id = 42 \n  AND category_id = 10 \n  AND color = 'blue' \n  AND size = 'XL';",
    "initialCost": 85000,
    "initialLatencyMs": 1400,
    "initialPlanSummary": "BitmapAnd -> Merges 4 separate B-Tree indexes, burning 350 MB RAM in work_mem and high disk random reads",
    "businessContext": "Product catalog with 15 searchable attributes. Creating separate B-Tree indexes for every possible column combination causes massive 45 GB index bloat, destroying write performance.",
    "strategies": [
      {
        "id": "strat_bloom_index_optimal",
        "title": "Deploy pg_bloom Extension Index for Multi-Column Ad-Hoc Equality Queries",
        "sqlCommand": "CREATE EXTENSION IF NOT EXISTS bloom;\n\nCREATE INDEX idx_catalog_bloom ON ecommerce_catalog USING bloom (\n  brand_id, category_id, color, size, material, season, gender\n) WITH (length = 80, col1 = 4, col2 = 4, col3 = 4, col4 = 4);",
        "isOptimal": true,
        "resultingCost": 420.0,
        "resultingLatencyMs": 18.0,
        "executionPlanSummary": "Bitmap Heap Scan -> Bitmap Index Scan on idx_catalog_bloom (Single 1.2 GB index serves all combinations!)",
        "engineExplanation": "Winner! Standard B-Tree composite indexes require queries to filter by the leading prefix column. To cover all combinations of 8 columns requires dozens of indexes (tens of gigabytes). A Bloom filter index creates signature bitmasks across all columns. A single 1.2 GB Bloom index answers queries filtering on ANY subset of columns with zero prefix restrictions."
      },
      {
        "id": "strat_15_composite_btrees",
        "title": "Create 15 additional composite B-Tree indexes covering every permutation",
        "sqlCommand": "CREATE INDEX idx_comb1 ON ...; CREATE INDEX idx_comb2 ON ...;",
        "isOptimal": false,
        "resultingCost": 350.0,
        "resultingLatencyMs": 12.0,
        "executionPlanSummary": "Index storage swells to 90 GB (5x table size), slowing INSERT and UPDATE operations to a crawl",
        "engineExplanation": "Maintaining dozens of B-Tree indexes inflicts severe write amplification and consumes dozens of gigabytes of valuable buffer pool RAM."
      },
      {
        "id": "strat_gin_jsonb_conversion",
        "title": "Convert all columns into a single JSONB document with GIN index",
        "sqlCommand": "ALTER TABLE ecommerce_catalog ADD COLUMN attributes JSONB; CREATE INDEX idx_gin ON ecommerce_catalog USING GIN(attributes);",
        "isOptimal": false,
        "resultingCost": 1200.0,
        "resultingLatencyMs": 95.0,
        "executionPlanSummary": "GIN index on 50M JSONB rows consumes 28 GB, with high write update costs",
        "engineExplanation": "GIN indexes on large tables have significant update overhead and large disk footprints compared to Bloom indexes for equality attributes."
      }
    ],
    "keyTakeaway": "For tables with many arbitrary equality filter combinations, PostgreSQL Bloom indexes (pg_bloom) provide compact, multi-column search capability in a fraction of the space of dozens of B-Trees."
  },

  // ── Scenario 112: LSM-Tree Write Amplification & Compaction Stalls Under Ingestion Spikes (Staff) ──
  {
    "id": "lsm_tree_vs_btree_write_amplification",
    "title": "LSM-Tree Write Amplification & Compaction Stalls Under Ingestion Spikes",
    "difficulty": "Staff",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "sensor_ingest (RocksDB / CockroachDB LSM-Tree)",
    "rowCount": "1,000,000,000 rows",
    "tableSizeDisk": "250 GB on disk",
    "slowQuery": "-- High-frequency batch ingest (50,000 writes/sec):\nINSERT INTO sensor_ingest (sensor_id, ts, metric_value) VALUES (...);\n-- Ingestion suddenly freezes! Latency spikes from 0.8ms to 3,500ms!",
    "initialCost": 1.0,
    "initialLatencyMs": 3500,
    "initialPlanSummary": "Compaction Stall: MemTable write buffer full; Level 0 file count (L0) exceeds max threshold; RocksDB throttles/pauses all incoming writes!",
    "businessContext": "High-throughput metric ingestion engine using an LSM-tree storage engine (RocksDB/Cassandra/CockroachDB). Under sustained write bursts, the database freezes periodically due to cascading compaction stalls.",
    "strategies": [
      {
        "id": "strat_tune_lsm_compaction_optimal",
        "title": "Tune L0 Compaction Triggers, Increase MemTable Threads & Set Dynamic Level Base Size",
        "sqlCommand": "-- RocksDB / CockroachDB LSM tuning configuration:\n-- Increase L0 file limit before stalling:\nlevel0_slowdown_writes_trigger = 32; -- Default 20\nlevel0_stop_writes_trigger = 64;     -- Default 36\n\n-- Increase background compaction concurrency:\nmax_background_jobs = 8;             -- Dedicate 8 CPU cores to background flush/compaction\nwrite_buffer_size = 134217728;       -- 128 MB MemTable\nmax_write_buffer_number = 6;         -- Allow up to 6 memtables in RAM before backpressure",
        "isOptimal": true,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Compaction throughput matches ingestion rate, completely eliminating write stalls",
        "engineExplanation": "Winner! In an LSM-tree (Log-Structured Merge-tree), writes are appended to an in-memory MemTable and flushed to Level 0 SST files. If background compaction workers cannot merge L0 files into Level 1 fast enough, L0 files accumulate. When level0_stop_writes_trigger is reached, the engine deliberately halts incoming writes! Allocating more compaction threads and raising L0 thresholds prevents write stalls."
      },
      {
        "id": "strat_disable_wal_lsm",
        "title": "Disable Write-Ahead Log with disableWAL = true",
        "sqlCommand": "-- Set writeOptions.disableWAL = true",
        "isOptimal": false,
        "resultingCost": 1.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "CRITICAL RISK: Any power loss or process crash permanently destroys all unflushed MemTable data in RAM",
        "engineExplanation": "Disabling the WAL speeds up writes but sacrifices durability: uncompacted data in memory is permanently lost upon crash."
      },
      {
        "id": "strat_switch_to_unindexed_heap",
        "title": "Switch to an un-indexed append-only CSV file",
        "sqlCommand": "-- Append to /var/log/sensor.csv",
        "isOptimal": false,
        "resultingCost": 1000000,
        "resultingLatencyMs": 45000,
        "executionPlanSummary": "High write speed but reading/aggregating metrics requires scanning gigabytes of flat text files",
        "engineExplanation": "Dumping to flat CSV eliminates indexing during ingestion but destroys analytical query performance."
      }
    ],
    "keyTakeaway": "LSM-Tree storage engines trade background compaction CPU/IO for ultra-fast writes. To prevent write compaction stalls, tune level0_stop_writes_trigger and dedicate sufficient background compaction threads."
  },

  // ── Scenario 113: Linux OS Page Cache Double-Buffering & Direct I/O (O_DIRECT) Bypass (Staff) ──
  {
    "id": "kernel_aio_direct_io_bypass",
    "title": "Linux OS Page Cache Double-Buffering & Direct I/O (O_DIRECT) Bypass",
    "difficulty": "Staff",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "innodb_data_file (ibdata1 / *.ibd)",
    "rowCount": "Production Enterprise Database",
    "tableSizeDisk": "500 GB on NVMe SSD array",
    "slowQuery": "-- System memory profile under heavy mixed OLTP workload:\n-- 64 GB RAM allocated to InnoDB Buffer Pool\n-- 60 GB RAM consumed by Linux OS Page Cache (Dirty pages cached twice!)\n-- System enters Linux kswapd swap thrashing, query latency spikes 50x!",
    "initialCost": 100000,
    "initialLatencyMs": 280,
    "initialPlanSummary": "Double-Buffering Memory Contention: Pages cached in InnoDB Buffer Pool AND in Linux Kernel Page Cache simultaneously, triggering swapping",
    "businessContext": "Database host with 128 GB RAM begins swapping to disk even though the InnoDB buffer pool is configured for only 64 GB. The operating system kernel caches the same data pages twice, starving application processes of RAM.",
    "strategies": [
      {
        "id": "strat_enable_o_direct_optimal",
        "title": "Configure innodb_flush_method = O_DIRECT (or O_DIRECT_NO_FSYNC)",
        "sqlCommand": "-- In my.cnf / MySQL configuration:\n[mysqld]\ninnodb_flush_method = O_DIRECT\n\n-- In modern Linux kernels on NVMe SSDs:\n-- Bypasses the OS page cache for data files, eliminating double buffering!\n-- In PostgreSQL: use pg_prewarm and leave shared_buffers at 25% if relying on OS cache,\n-- or use direct I/O extensions where supported.",
        "isOptimal": true,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "OS page cache double buffering eliminated -> 60 GB RAM returned to OS, swap usage drops to 0%",
        "engineExplanation": "Winner! By default on Linux (fsync flush method), writes go to the OS page cache before being flushed to disk. This causes 'double-buffering': data pages reside simultaneously in the database buffer pool and the Linux kernel cache! Setting innodb_flush_method = O_DIRECT tells the OS to bypass the kernel page cache and write directly between database buffers and disk hardware, freeing gigabytes of memory and eliminating swap thrashing."
      },
      {
        "id": "strat_increase_swap_space",
        "title": "Allocate a 128 GB swapfile on NVMe SSD",
        "sqlCommand": "fallocate -l 128G /swapfile && mkswap /swapfile && swapon /swapfile",
        "isOptimal": false,
        "resultingCost": 100000,
        "resultingLatencyMs": 250,
        "executionPlanSummary": "Allows swapping without crashing, but SSD swapping still incurs 100x latency penalty compared to RAM",
        "engineExplanation": "Increasing swap mask memory starvation while keeping queries painfully slow as pages are constantly swapped in and out of disk."
      },
      {
        "id": "strat_reduce_buffer_pool_to_16gb",
        "title": "Shrink innodb_buffer_pool_size to 16GB",
        "sqlCommand": "SET GLOBAL innodb_buffer_pool_size = 17179869184;",
        "isOptimal": false,
        "resultingCost": 450000,
        "resultingLatencyMs": 95.0,
        "executionPlanSummary": "Buffer pool hit ratio drops from 99% to 75%, forcing massive disk read I/O for standard queries",
        "engineExplanation": "Shrinking the buffer pool starves the database of working memory, causing cache misses and spiking query latency across the entire system."
      }
    ],
    "keyTakeaway": "Database engines manage their own memory buffers. Configure innodb_flush_method = O_DIRECT to bypass the operating system page cache and prevent double-buffering memory exhaustion."
  },
];
