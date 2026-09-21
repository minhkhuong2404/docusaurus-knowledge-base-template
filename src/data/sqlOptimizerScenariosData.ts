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
];
