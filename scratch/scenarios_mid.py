# Mid Scenarios (Scenarios 39 to 72: 34 scenarios)

MID_SCENARIOS = [
  {
    "id": "hash_join_disk_spill_work_mem",
    "title": "Hash Join Memory Spill to Temporary Disk Files",
    "difficulty": "Mid",
    "category": "joins",
    "categoryLabel": "JOIN Optimization & Hash Joins",
    "tableName": "order_lines",
    "rowCount": "18,000,000 rows",
    "tableSizeDisk": "4.2 GB on disk",
    "slowQuery": """SELECT o.order_id, o.order_date, l.product_id, l.unit_price, l.quantity
FROM orders o
JOIN order_lines l ON o.order_id = l.order_id
WHERE o.order_date >= '2026-01-01' AND o.order_date < '2026-04-01';""",
    "initialCost": 485000,
    "initialLatencyMs": 7800,
    "initialPlanSummary": "Hash Join -> Hash Batches: 16 (Disk Spill: 320 MB written to pgsql_tmp/)",
    "businessContext": "Quarterly financial sales aggregation query stalls for 8 seconds. Storage engine disk I/O hits 100% reading temporary scratch files.",
    "strategies": [
      {
        "id": "strat_increase_session_workmem_optimal",
        "title": "Index order_lines(order_id) or Elevate work_mem for Session",
        "sqlCommand": """CREATE INDEX idx_order_lines_order_id ON order_lines(order_id);
-- For the reporting session:
SET work_mem = '256MB';""",
        "isOptimal": True,
        "resultingCost": 420.0,
        "resultingLatencyMs": 14.5,
        "executionPlanSummary": "Hash Join (In-Memory Batches: 1, Disk Spill: 0 bytes) or Index Nested Loop Join",
        "engineExplanation": "Winner! By increasing work_mem from 4MB to 256MB for the analytical session, the build table fits entirely in RAM (0 disk writes). Adding the foreign key index also allows the planner to switch to an Index Join.",
      },
      {
        "id": "strat_force_merge_join",
        "title": "Force Merge Join with SET enable_hashjoin = off",
        "sqlCommand": "SET enable_hashjoin = off; SELECT ...",
        "isOptimal": False,
        "resultingCost": 920000,
        "resultingLatencyMs": 14200,
        "executionPlanSummary": "Merge Join -> Forced external disk sort of both 18M and 3M row inputs!",
        "engineExplanation": "Catastrophic! Disabling hash joins forces the database to sort both massive inputs on disk, doubling runtime from 7.8s to 14.2s.",
      },
      {
        "id": "strat_increase_buffer_pool_global",
        "title": "Increase Global shared_buffers to 64GB",
        "sqlCommand": "ALTER SYSTEM SET shared_buffers = '64GB';",
        "isOptimal": False,
        "resultingCost": 485000,
        "resultingLatencyMs": 7600,
        "executionPlanSummary": "shared_buffers caches data blocks, but does NOT allocate work_mem hash joins",
        "engineExplanation": "Misunderstanding PostgreSQL memory: shared_buffers holds cached table pages. Hash table memory for joins is governed independently by work_mem.",
      },
    ],
    "keyTakeaway": "When EXPLAIN ANALYZE shows Hash Batches > 1 and Disk Spill in pgsql_tmp, the hash table exceeded work_mem (or join_buffer_size). Elevate session work_mem or provide indexed join keys.",
  },
  {
    "id": "keyset_pagination_tie_breaker",
    "title": "Chat History Pagination Skips Microsecond Messages",
    "difficulty": "Mid",
    "category": "pagination",
    "categoryLabel": "Keyset Pagination",
    "tableName": "chat_messages",
    "rowCount": "50,000,000 rows",
    "tableSizeDisk": "12.5 GB on disk",
    "slowQuery": """-- Client requests next 50 messages:
SELECT message_id, channel_id, sender_id, message_text, created_at
FROM chat_messages
WHERE channel_id = 902 AND created_at < '2026-03-24 14:10:05.120000'
ORDER BY created_at DESC
LIMIT 50;""",
    "initialCost": 85.0,
    "initialLatencyMs": 4.5,
    "initialPlanSummary": "Index Scan on created_at -> Data Loss Hazard: Drops concurrent messages sharing exact timestamp",
    "businessContext": "Slack-like team messaging app: In high-traffic channels with automated bots, 15 messages were sent at the exact same microsecond. Keyset pagination silently skips 12 of them!",
    "strategies": [
      {
        "id": "strat_composite_keyset_tiebreaker_optimal",
        "title": "Row-Value Tuple Seek with Primary Key Tie-Breaker: (created_at, message_id)",
        "sqlCommand": """CREATE INDEX idx_chat_channel_created_id ON chat_messages(channel_id, created_at DESC, message_id DESC);

-- Query:
SELECT message_id, channel_id, sender_id, message_text, created_at
FROM chat_messages
WHERE channel_id = 902 
  AND (created_at, message_id) < ('2026-03-24 14:10:05.120000', 491028)
ORDER BY created_at DESC, message_id DESC
LIMIT 50;""",
        "isOptimal": True,
        "resultingCost": 4.5,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan using idx_chat_channel_created_id -> 100% Deterministic Tuple Comparison",
        "engineExplanation": "Champion! By appending the unique message_id as a tie-breaker inside a tuple comparison (created_at, message_id) < (:ts, :id), messages sharing identical microseconds are cleanly separated and never skipped.",
      },
      {
        "id": "strat_use_offset_instead",
        "title": "Fall back to LIMIT 50 OFFSET 15000",
        "sqlCommand": "SELECT ... WHERE channel_id = 902 ORDER BY created_at DESC LIMIT 50 OFFSET 15000;",
        "isOptimal": False,
        "resultingCost": 145000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "Seq Scan / Deep Index Scan -> Must read and discard 15,000 rows",
        "engineExplanation": "Degrades exponentially: As users scroll up channel history, OFFSET 50,000 takes seconds and introduces pagination drift as new messages arrive.",
      },
      {
        "id": "strat_nanosecond_precision",
        "title": "Increase Timestamp to Nanosecond Precision",
        "sqlCommand": "ALTER TABLE chat_messages ALTER COLUMN created_at TYPE TIMESTAMP(9);",
        "isOptimal": False,
        "resultingCost": 85.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Does not mathematically guarantee uniqueness across distributed nodes",
        "engineExplanation": "False security: In distributed systems or bulk imports, collisions still occur on identical clocks.",
      },
    ],
    "keyTakeaway": "Keyset pagination on timestamps requires a unique tie-breaker (Primary Key). Use Row-Value tuple comparisons (created_at, id) < (:last_ts, :last_id) with a composite index to guarantee zero data loss.",
  },
  {
    "id": "covering_index_include_clause",
    "title": "Session Token Verification Heap Access Spike",
    "difficulty": "Mid",
    "category": "covering_indexes",
    "categoryLabel": "Covering Indexes & INCLUDE",
    "tableName": "user_sessions",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "6.8 GB on disk",
    "slowQuery": """SELECT user_id, expires_at, device_fingerprint
FROM user_sessions
WHERE session_token = 'tk_98a7fbc281e4b901' AND expires_at > NOW();""",
    "initialCost": 850,
    "initialLatencyMs": 28,
    "initialPlanSummary": "Index Scan on idx_session_token -> Heap Fetch to read user_id & device_fingerprint",
    "businessContext": "API Gateway validates session tokens on every inbound request (30,000 RPS). Table heap page reads cause NVMe SSD I/O saturation and intermittent latency spikes.",
    "strategies": [
      {
        "id": "strat_include_covering_optimal",
        "title": "B-Tree Index with INCLUDE (user_id, device_fingerprint)",
        "sqlCommand": """CREATE INDEX idx_sessions_token_covering 
ON user_sessions (session_token, expires_at) 
INCLUDE (user_id, device_fingerprint);""",
        "isOptimal": True,
        "resultingCost": 3.8,
        "resultingLatencyMs": 0.4,
        "executionPlanSummary": "Index Only Scan using idx_sessions_token_covering -> 0 Heap Page Accesses",
        "engineExplanation": "Masterpiece! session_token and expires_at are stored in internal B-Tree nodes for navigation and filtering, while user_id and device_fingerprint are stored only in leaf payloads. Zero table heap I/O in 0.4ms!",
      },
      {
        "id": "strat_composite_all_keys",
        "title": "Composite Key with All 4 Columns as Search Keys",
        "sqlCommand": "CREATE INDEX idx_sessions_all ON user_sessions(session_token, expires_at, user_id, device_fingerprint);",
        "isOptimal": False,
        "resultingCost": 4.5,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Only Scan, but index size is 40% larger due to wide B-Tree internal nodes",
        "engineExplanation": "Putting user_id and device_fingerprint into the search key increases internal B-Tree node sizes, decreasing branch fanout and increasing index tree depth.",
      },
      {
        "id": "strat_single_token_index",
        "title": "Index on session_token only",
        "sqlCommand": "CREATE INDEX idx_sessions_token ON user_sessions(session_token);",
        "isOptimal": False,
        "resultingCost": 850,
        "resultingLatencyMs": 28,
        "executionPlanSummary": "Index Scan -> Still visits heap to evaluate expires_at and retrieve user_id",
        "engineExplanation": "Does not solve the problem: Every API request still hits random heap pages to inspect expires_at and fetch user attributes.",
      },
    ],
    "keyTakeaway": "Use the INCLUDE clause for non-search payload columns. It stores attributes directly in B-Tree leaves for Index-Only Scans without bloating internal B-Tree navigation branch nodes.",
  },
  {
    "id": "partial_index_soft_deletes",
    "title": "Soft Deletes Bloat 95% of Search Index",
    "difficulty": "Mid",
    "category": "partial_indexes",
    "categoryLabel": "Partial & Filtered Indexes",
    "tableName": "documents",
    "rowCount": "30,000,000 rows",
    "tableSizeDisk": "11.2 GB on disk",
    "slowQuery": """SELECT document_id, title, author_id, updated_at
FROM documents
WHERE organization_id = 501 AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT 20;""",
    "initialCost": 85000,
    "initialLatencyMs": 1400,
    "initialPlanSummary": "Bitmap Heap Scan -> Scans index containing 22,000,000 deleted archive documents",
    "businessContext": "Enterprise document management: Over 7 years, 22 million documents were soft-deleted. Standard indexes on (organization_id, updated_at) are 2.8 GB in RAM, mostly caching dead records.",
    "strategies": [
      {
        "id": "strat_partial_soft_delete_optimal",
        "title": "Partial Index Excluding Soft Deletes: WHERE deleted_at IS NULL",
        "sqlCommand": """CREATE INDEX idx_docs_active_org_updated 
ON documents(organization_id, updated_at DESC) 
INCLUDE (document_id, title, author_id)
WHERE deleted_at IS NULL;""",
        "isOptimal": True,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Only Scan using idx_docs_active_org_updated -> Index shrinks from 2.8 GB to 420 MB",
        "engineExplanation": "Champion! By adding WHERE deleted_at IS NULL, the 22 million deleted documents are permanently excluded from the index. The active working set shrinks by 85%, fitting entirely into RAM cache with 0.7ms response.",
      },
      {
        "id": "strat_composite_including_deleted_at",
        "title": "Composite Index: (organization_id, deleted_at, updated_at DESC)",
        "sqlCommand": "CREATE INDEX idx_docs_org_del_up ON documents(organization_id, deleted_at, updated_at DESC);",
        "isOptimal": False,
        "resultingCost": 48.0,
        "resultingLatencyMs": 8.5,
        "executionPlanSummary": "Index Scan on full index (Retains all 22M deleted rows in index tree)",
        "engineExplanation": "Works for queries, but wastes 2.4 GB of RAM indexing archived deleted documents that will never be queried again.",
      },
      {
        "id": "strat_separate_archive_table",
        "title": "Move Deleted Rows to documents_archive via Trigger",
        "sqlCommand": "CREATE TRIGGER trg_archive_docs AFTER UPDATE ...",
        "isOptimal": False,
        "resultingCost": 8.0,
        "resultingLatencyMs": 2.5,
        "executionPlanSummary": "Double write overhead on every soft-delete; complex rollback semantics",
        "engineExplanation": "Over-engineered: A partial index achieves the exact same performance in one line of DDL without triggers or data synchronization overhead.",
      },
    ],
    "keyTakeaway": "Never index soft-deleted rows. Adding WHERE deleted_at IS NULL to your B-Tree index definition shrinks index size dramatically, eliminates dead row traversal, and keeps working sets in RAM.",
  },
  {
    "id": "index_skip_scan_loose_index",
    "title": "Low-Cardinality Leading Column in Multi-Store Search",
    "difficulty": "Mid",
    "category": "skip_scan",
    "categoryLabel": "Index Skip Scan & Loose Index",
    "tableName": "store_inventory",
    "rowCount": "20,000,000 rows",
    "tableSizeDisk": "5.4 GB on disk",
    "slowQuery": """SELECT store_id, product_sku, in_stock_count
FROM store_inventory
WHERE product_sku = 'IPHONE-16-PRO-256'
LIMIT 50;""",
    "initialCost": 340000,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Seq Scan on store_inventory (Index idx_store_sku exists on (store_id, product_sku) but store_id is not specified)",
    "businessContext": "Retail chain inventory: Only 8 distinct store_id values exist, but 2.5M product_skus. Queries searching by product_sku skip the leftmost store_id and force full table scans.",
    "strategies": [
      {
        "id": "strat_reverse_composite_or_skipscan_optimal",
        "title": "Create Index Ordered by High Cardinality First: (product_sku, store_id)",
        "sqlCommand": """CREATE INDEX idx_inv_sku_store ON store_inventory(product_sku, store_id) 
INCLUDE (in_stock_count);""",
        "isOptimal": True,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan using idx_inv_sku_store -> Direct B-Tree seek on product_sku",
        "engineExplanation": "Winner! By placing the high-cardinality search column (product_sku) first, queries filtering by sku jump straight to the exact index leaf in 0.8ms without needing store_id.",
      },
      {
        "id": "strat_mysql_skip_scan",
        "title": "Rely on MySQL 8.0 Index Skip Scan",
        "sqlCommand": "/* Query unchanged on MySQL 8.0 */",
        "isOptimal": False,
        "resultingCost": 1200,
        "resultingLatencyMs": 45,
        "executionPlanSummary": "Index Skip Scan using idx_store_sku (Executes 8 separate sub-scans)",
        "engineExplanation": "Decent in MySQL 8.0 (45ms vs 4.2s), but still 50x slower than a dedicated index on product_sku. Furthermore, Postgres does not support B-Tree Skip Scan natively.",
      },
      {
        "id": "strat_hash_index_sku",
        "title": "Create Hash Index on product_sku",
        "sqlCommand": "CREATE INDEX idx_sku_hash ON store_inventory USING HASH(product_sku);",
        "isOptimal": False,
        "resultingCost": 15.0,
        "resultingLatencyMs": 2.2,
        "executionPlanSummary": "Bitmap Heap Scan -> Cannot satisfy covering columns or range ordering",
        "engineExplanation": "Hash indexes cannot include additional columns or support ordering.",
      },
    ],
    "keyTakeaway": "Avoid placing low-cardinality columns (status, store_id) first in composite indexes if queries frequently filter only on the secondary high-cardinality column.",
  },
  {
    "id": "nested_loop_vs_hash_join_hint",
    "title": "Optimizer Chooses Nested Loop Over Hash Join",
    "difficulty": "Mid",
    "category": "joins",
    "categoryLabel": "JOIN Algorithms & Planner Hints",
    "tableName": "supplier_shipments",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.8 GB on disk",
    "slowQuery": """SELECT s.supplier_name, sh.shipment_id, sh.delivered_date, sh.cost
FROM suppliers s
JOIN supplier_shipments sh ON s.supplier_id = sh.supplier_id
WHERE s.region = 'APAC';""",
    "initialCost": 850000,
    "initialLatencyMs": 9400,
    "initialPlanSummary": "Nested Loop (cost=0.56..850000.00) -> 240,000 separate index seeks into supplier_shipments",
    "businessContext": "Supply chain report joins 240,000 APAC suppliers with shipments. Stale statistics caused the planner to estimate only 15 suppliers, picking a devastating Nested Loop instead of a Hash Join.",
    "strategies": [
      {
        "id": "strat_analyze_statistics_optimal",
        "title": "Run ANALYZE and Tune default_statistics_target",
        "sqlCommand": """ANALYZE suppliers;
ANALYZE supplier_shipments;
-- Planner correctly estimates 240,000 rows and switches to Hash Join automatically!""",
        "isOptimal": True,
        "resultingCost": 3500,
        "resultingLatencyMs": 480,
        "executionPlanSummary": "Hash Join using Hash on suppliers -> Single-pass stream in 480ms",
        "engineExplanation": "Masterclass! Stale table statistics led the optimizer to believe APAC had only 15 suppliers, making Nested Loop look cheap. Updating statistics reveals the true 240,000 row cardinality, prompting the planner to choose an optimal Hash Join.",
      },
      {
        "id": "strat_disable_nested_loop_globally",
        "title": "Disable Nested Loops Globally: SET enable_nestloop = off",
        "sqlCommand": "SET enable_nestloop = off;",
        "isOptimal": False,
        "resultingCost": 3800,
        "resultingLatencyMs": 510,
        "executionPlanSummary": "Fixes this query, but cripples OLTP point lookups across the entire application",
        "engineExplanation": "Dangerous blunt instrument! Disabling nested loops globally breaks single-row Primary Key seeks across all other user-facing OLTP APIs.",
      },
      {
        "id": "strat_add_composite_shipments",
        "title": "Create Composite Index on shipments(supplier_id, cost)",
        "sqlCommand": "CREATE INDEX idx_shipments_supp_cost ON supplier_shipments(supplier_id, cost);",
        "isOptimal": False,
        "resultingCost": 720000,
        "resultingLatencyMs": 7800,
        "executionPlanSummary": "Nested Loop using new index -> Still executes 240,000 separate loops",
        "engineExplanation": "Does not address the root cause: The algorithmic mismatch (240k loops) remains.",
      },
    ],
    "keyTakeaway": "Planners choose bad join algorithms when cardinality estimates are wrong. When Nested Loops run thousands of times on large sets, run ANALYZE to refresh histogram statistics before forcing planner flags.",
  },
  {
    "id": "jsonb_containment_gin_operator",
    "title": "Nested JSONB Filtering Without GIN Index",
    "difficulty": "Mid",
    "category": "jsonb",
    "categoryLabel": "JSONB & GIN Indexes",
    "tableName": "feature_flags",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "3.1 GB on disk",
    "slowQuery": """SELECT flag_id, name, rules
FROM feature_flags
WHERE rules @> '{"targeting": {"country": "CA", "beta_user": true}}';""",
    "initialCost": 220000,
    "initialLatencyMs": 2800,
    "initialPlanSummary": "Seq Scan on feature_flags (cost=0.00..220000.00) Filter: (rules @> '...')",
    "businessContext": "Config management service checks if a feature flag is enabled for Canadian beta testers. Every microservice evaluation takes 2.8 seconds due to sequential JSON unpacking.",
    "strategies": [
      {
        "id": "strat_jsonb_path_ops_gin_optimal",
        "title": "GIN Index with jsonb_path_ops Operator Class",
        "sqlCommand": """CREATE INDEX idx_flags_rules_path_ops 
ON feature_flags USING GIN (rules jsonb_path_ops);""",
        "isOptimal": True,
        "resultingCost": 8.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Bitmap Index Scan using idx_flags_rules_path_ops -> 1.2ms hash containment check",
        "engineExplanation": "Winner! jsonb_path_ops hashes entire path-value pairs (targeting.country=CA, targeting.beta_user=true). It is 3x smaller and significantly faster than default GIN jsonb_ops for @> containment queries.",
      },
      {
        "id": "strat_default_gin_ops",
        "title": "Default GIN Index: USING GIN (rules)",
        "sqlCommand": "CREATE INDEX idx_flags_rules_default ON feature_flags USING GIN (rules);",
        "isOptimal": False,
        "resultingCost": 28.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Bitmap Index Scan using default jsonb_ops (Works, but index is 3x larger on disk)",
        "engineExplanation": "Acceptable, but default jsonb_ops indexes every key, path, and value separately, making the index 3x larger and slower to update than jsonb_path_ops.",
      },
      {
        "id": "strat_btree_cast_text",
        "title": "B-Tree Index on rules::text",
        "sqlCommand": "CREATE INDEX idx_flags_rules_text ON feature_flags((rules::text));",
        "isOptimal": False,
        "resultingCost": 220000,
        "resultingLatencyMs": 2800,
        "executionPlanSummary": "Seq Scan -> Text B-Tree cannot evaluate JSON structural containment (@>)",
        "engineExplanation": "JSON key order is non-deterministic in raw strings; text B-Trees cannot evaluate JSON tree containment.",
      },
    ],
    "keyTakeaway": "For JSONB @> containment queries, use GIN indexes with jsonb_path_ops. It creates a compact hash-based index that evaluates complex nested JSON filters in 1 millisecond.",
  },
  {
    "id": "pg_trgm_similarity_fuzzy_search",
    "title": "Customer Name Fuzzy Search Typosquatting Match",
    "difficulty": "Mid",
    "category": "text_search",
    "categoryLabel": "GIN & Full-Text Search",
    "tableName": "merchants",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.9 GB on disk",
    "slowQuery": """SELECT merchant_id, name, registration_number
FROM merchants
WHERE name % 'Starbuks Coffee'
ORDER BY similarity(name, 'Starbuks Coffee') DESC
LIMIT 10;""",
    "initialCost": 310000,
    "initialLatencyMs": 4600,
    "initialPlanSummary": "Seq Scan on merchants -> Calculates similarity() across all 10M rows + Filesort",
    "businessContext": "Fraud prevention screen checks merchant names for trademark infringement and typosquatting. Full table scan takes 4.6 seconds on every vendor onboarding check.",
    "strategies": [
      {
        "id": "strat_gin_trgm_similarity_optimal",
        "title": "GIN Trigram Index with gin_trgm_ops",
        "sqlCommand": """CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_merchants_name_trgm ON merchants USING GIN (name gin_trgm_ops);
-- Query uses % operator to activate index:
SELECT merchant_id, name, registration_number FROM merchants 
WHERE name % 'Starbuks Coffee' 
ORDER BY similarity(name, 'Starbuks Coffee') DESC LIMIT 10;""",
        "isOptimal": True,
        "resultingCost": 18.0,
        "resultingLatencyMs": 3.8,
        "executionPlanSummary": "Bitmap Index Scan using idx_merchants_name_trgm -> 3.8ms Trigram Match",
        "engineExplanation": "Champion! pg_trgm splits words into 3-character slices ('Sta', 'tar', 'arb'). GIN index finds overlapping trigram matches in 3.8ms, eliminating 99.9% of non-matching names before computing exact similarity scores.",
      },
      {
        "id": "strat_standard_fulltext_tsvector",
        "title": "PostgreSQL Full-Text Search tsvector @@ to_tsquery",
        "sqlCommand": "CREATE INDEX idx_name_fts ON merchants USING GIN (to_tsvector('english', name));",
        "isOptimal": False,
        "resultingCost": 120000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "Fails to match misspelled 'Starbuks' due to exact dictionary stem requirements",
        "engineExplanation": "FTS fails: Full-Text Search uses linguistic stemming, not character n-grams. It cannot match misspelled words like 'Starbuks' to 'Starbucks'.",
      },
      {
        "id": "strat_levenshtein_full_scan",
        "title": "Use levenshtein(name, 'Starbuks Coffee') < 3",
        "sqlCommand": "SELECT ... WHERE levenshtein(name, 'Starbuks Coffee') < 3;",
        "isOptimal": False,
        "resultingCost": 680000,
        "resultingLatencyMs": 9500,
        "executionPlanSummary": "Seq Scan with expensive Levenshtein distance matrix CPU calculation per row",
        "engineExplanation": "Even slower! Levenshtein distance cannot be indexed with standard B-trees and doubles CPU time.",
      },
    ],
    "keyTakeaway": "For fuzzy matching and typo-tolerant search, use PostgreSQL's pg_trgm extension with a GIN index on gin_trgm_ops. It accelerates both % similarity and LIKE '%middle%' queries.",
  },
  {
    "id": "cross_join_lateral_top_n",
    "title": "Top 3 Highest Bids Per Auction with CROSS JOIN LATERAL",
    "difficulty": "Mid",
    "category": "lateral_joins",
    "categoryLabel": "Lateral Joins & Window Functions",
    "tableName": "bids",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "4.5 GB on disk",
    "slowQuery": """-- Window function approach:
WITH ranked_bids AS (
    SELECT bid_id, auction_id, bidder_id, amount,
           ROW_NUMBER() OVER (PARTITION BY auction_id ORDER BY amount DESC) as rn
    FROM bids
)
SELECT * FROM ranked_bids WHERE rn <= 3;""",
    "initialCost": 580000,
    "initialLatencyMs": 6800,
    "initialPlanSummary": "WindowAgg on Window (Sort by auction_id, amount DESC) -> Reads entire 15,000,000 rows into memory/disk sort!",
    "businessContext": "Auction platform shows the current top 3 leading bids across 1,000 active auctions. The window function sorts all 15 million historical bids before filtering rn <= 3.",
    "strategies": [
      {
        "id": "strat_lateral_join_top_n_optimal",
        "title": "CROSS JOIN LATERAL with Composite Index: (auction_id, amount DESC)",
        "sqlCommand": """CREATE INDEX idx_bids_auction_amount ON bids(auction_id, amount DESC);

-- Query:
SELECT a.auction_id, b.bid_id, b.bidder_id, b.amount
FROM active_auctions a
CROSS JOIN LATERAL (
    SELECT bid_id, bidder_id, amount
    FROM bids
    WHERE bids.auction_id = a.auction_id
    ORDER BY amount DESC
    LIMIT 3
) b;""",
        "isOptimal": True,
        "resultingCost": 45.0,
        "resultingLatencyMs": 4.2,
        "executionPlanSummary": "Nested Loop with 1,000 Index Scans (each reading exactly 3 index leaves) -> 4.2ms!",
        "engineExplanation": "Brilliant! Instead of sorting 15 million rows, CROSS JOIN LATERAL executes a bounded index scan of exactly 3 rows per active auction. 1,000 auctions * 3 rows = 3,000 index reads total in 4.2ms!",
      },
      {
        "id": "strat_index_without_lateral",
        "title": "Add Index on bids(auction_id, amount DESC) without Rewriting Query",
        "sqlCommand": "CREATE INDEX idx_bids_a_amt ON bids(auction_id, amount DESC);",
        "isOptimal": False,
        "resultingCost": 220000,
        "resultingLatencyMs": 2800,
        "executionPlanSummary": "Index Scan on entire 15M rows -> WindowAgg still evaluates all 15 million rows",
        "engineExplanation": "Window functions cannot push down WHERE rn <= 3 into the scan. The engine must evaluate ROW_NUMBER() on all 15M rows before discarding rank > 3.",
      },
      {
        "id": "strat_group_by_max",
        "title": "Use GROUP BY auction_id with MAX(amount)",
        "sqlCommand": "SELECT auction_id, MAX(amount) FROM bids GROUP BY auction_id;",
        "isOptimal": False,
        "resultingCost": 180000,
        "resultingLatencyMs": 2200,
        "executionPlanSummary": "Returns only top 1 bid, fails requirement for top 3 bids with bidder details",
        "engineExplanation": "Fails business requirements: GROUP BY MAX() only gives the single highest amount, losing bidder_id and ranks 2 and 3.",
      },
    ],
    "keyTakeaway": "To get 'Top N per Category', avoid full-table window functions. Use CROSS JOIN LATERAL with a composite index on (category_id, sort_col DESC) and LIMIT N inside the subquery.",
  },
  {
    "id": "union_all_vs_union_dedup",
    "title": "UNION Triggers Costly Deduplication Sort",
    "difficulty": "Mid",
    "category": "set_operations",
    "categoryLabel": "Set Operations & Temporary Tables",
    "tableName": "security_events",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.2 GB on disk",
    "slowQuery": """SELECT user_id, event_type, created_at FROM auth_events WHERE created_at >= NOW() - INTERVAL '1 day'
UNION
SELECT user_id, event_type, created_at FROM security_events WHERE created_at >= NOW() - INTERVAL '1 day';""",
    "initialCost": 128000,
    "initialLatencyMs": 1650,
    "initialPlanSummary": "Append -> Unique -> Sort: External Merge Disk (cost=0.00..128000.00) -> Deduplicating 400,000 rows",
    "businessContext": "Security audit dashboard combines login events and firewall events from the past 24 hours. Query spends 85% of its time sorting to eliminate duplicates, even though event IDs are disjoint.",
    "strategies": [
      {
        "id": "strat_union_all_optimal",
        "title": "Replace UNION with UNION ALL",
        "sqlCommand": """SELECT user_id, event_type, created_at FROM auth_events WHERE created_at >= NOW() - INTERVAL '1 day'
UNION ALL
SELECT user_id, event_type, created_at FROM security_events WHERE created_at >= NOW() - INTERVAL '1 day';""",
        "isOptimal": True,
        "resultingCost": 22.0,
        "resultingLatencyMs": 3.1,
        "executionPlanSummary": "Append -> 2x Index Scans using idx_created_at -> Zero Sorting, Streams Output Instantly",
        "engineExplanation": "Winner! UNION executes a mandatory SORT and UNIQUE operation across all combined rows. UNION ALL simply concatenates streams without deduplication, dropping execution time from 1.65s to 3.1ms.",
      },
      {
        "id": "strat_increase_work_mem_sort",
        "title": "Increase work_mem to 512MB for UNION Sort",
        "sqlCommand": "SET work_mem = '512MB';",
        "isOptimal": False,
        "resultingCost": 65000,
        "resultingLatencyMs": 420,
        "executionPlanSummary": "In-memory quicksort deduplication (Still wastes CPU cycles sorting)",
        "engineExplanation": "Faster than disk spill, but still wastes 400ms of pure CPU time deduplicating streams that don't even have overlapping events.",
      },
      {
        "id": "strat_add_distinct_on",
        "title": "Add DISTINCT ON (created_at)",
        "sqlCommand": "SELECT DISTINCT ON (created_at) ...",
        "isOptimal": False,
        "resultingCost": 140000,
        "resultingLatencyMs": 1900,
        "executionPlanSummary": "Sort and Unique -> Adds even more sorting criteria",
        "engineExplanation": "DISTINCT ON requires an explicit sort and does not replace the lightweight nature of UNION ALL.",
      },
    ],
    "keyTakeaway": "Always default to UNION ALL unless you strictly require deduplication. UNION incurs a hidden DISTINCT sort that drains memory and degrades performance.",
  },
  {
    "id": "multi_tenant_shared_table_tenant_id",
    "title": "Multi-Tenant Shared Table Missing Tenant Prefix",
    "difficulty": "Mid",
    "category": "multi_tenancy",
    "categoryLabel": "Multi-Tenant Database Architecture",
    "tableName": "tenant_documents",
    "rowCount": "40,000,000 rows",
    "tableSizeDisk": "12.8 GB on disk",
    "slowQuery": """SELECT doc_id, title, author, created_at
FROM tenant_documents
WHERE tenant_id = 'acme_corp' AND title LIKE 'Contract%'
ORDER BY created_at DESC
LIMIT 25;""",
    "initialCost": 380000,
    "initialLatencyMs": 4900,
    "initialPlanSummary": "Bitmap Heap Scan on idx_title -> Filter: tenant_id = 'acme_corp' applied to 250,000 global contracts",
    "businessContext": "Multi-tenant SaaS app: Index exists on title, but every query filters by tenant_id first. Searching contracts in one tenant scans contracts across all 10,000 companies.",
    "strategies": [
      {
        "id": "strat_tenant_composite_prefix_optimal",
        "title": "Composite Index with tenant_id Leftmost: (tenant_id, title text_pattern_ops, created_at DESC)",
        "sqlCommand": """CREATE INDEX idx_tenant_docs_t_t_c 
ON tenant_documents(tenant_id, title text_pattern_ops, created_at DESC)
INCLUDE (doc_id, author);""",
        "isOptimal": True,
        "resultingCost": 5.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan using idx_tenant_docs_t_t_c -> Tenant data isolated in B-Tree subtree",
        "engineExplanation": "Winner! Making tenant_id the leftmost prefix isolates 'acme_corp' into a single compact B-Tree sub-branch. The engine seeks directly into Acme's documents without touching other tenants in 0.8ms.",
      },
      {
        "id": "strat_index_tenant_id_only",
        "title": "Single Index on tenant_id",
        "sqlCommand": "CREATE INDEX idx_tenant_id ON tenant_documents(tenant_id);",
        "isOptimal": False,
        "resultingCost": 45000,
        "resultingLatencyMs": 520,
        "executionPlanSummary": "Bitmap Index Scan on tenant_id -> Filter on title and external filesort",
        "engineExplanation": "Acme Corp has 300,000 documents. Index on tenant_id retrieves all 300,000 rows and requires a filesort to find the top 25.",
      },
      {
        "id": "strat_row_level_security_only",
        "title": "Enable PostgreSQL Row Level Security (RLS) without Index Change",
        "sqlCommand": "ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;",
        "isOptimal": False,
        "resultingCost": 380000,
        "resultingLatencyMs": 4900,
        "executionPlanSummary": "RLS appends WHERE tenant_id = current_tenant, but does not add index structures",
        "engineExplanation": "RLS enforces security boundaries, not indexing performance. Without a composite index, RLS still scans the full table.",
      },
    ],
    "keyTakeaway": "In shared multi-tenant tables, tenant_id must almost always be the leftmost column in composite indexes to partition the B-Tree search space per tenant.",
  },
  {
    "id": "group_by_streaming_vs_hashagg",
    "title": "GROUP BY Memory Exhaustion on 10M Sensor Records",
    "difficulty": "Mid",
    "category": "aggregations",
    "categoryLabel": "Aggregations & Group By",
    "tableName": "sensor_readings",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.4 GB on disk",
    "slowQuery": """SELECT device_id, DATE_TRUNC('hour', recorded_at) AS hourly_bucket, AVG(temperature)
FROM sensor_readings
GROUP BY device_id, DATE_TRUNC('hour', recorded_at);""",
    "initialCost": 350000,
    "initialLatencyMs": 5800,
    "initialPlanSummary": "HashAggregate -> 2,500,000 buckets overflow work_mem -> Disk Spill in pgsql_tmp",
    "businessContext": "IoT telemetry analytics calculates hourly averages per device. Grouping 2.5 million distinct device-hour combinations overflows memory hash tables into temporary disk files.",
    "strategies": [
      {
        "id": "strat_presorted_streaming_group_optimal",
        "title": "Index Pre-Sorted Expression for Streaming GroupAggregate: (device_id, date_trunc('hour', recorded_at))",
        "sqlCommand": """CREATE INDEX idx_sensor_device_hour 
ON sensor_readings(device_id, (DATE_TRUNC('hour', recorded_at))) 
INCLUDE (temperature);""",
        "isOptimal": True,
        "resultingCost": 42.0,
        "resultingLatencyMs": 18.0,
        "executionPlanSummary": "GroupAggregate using idx_sensor_device_hour -> O(1) Memory Streaming Aggregation",
        "engineExplanation": "Champion! Because the index delivers rows pre-sorted by device_id and hourly_bucket, the engine uses a GroupAggregate node: it reads rows in a stream, aggregates on the fly, and flushes results with zero memory or disk spill!",
      },
      {
        "id": "strat_increase_work_mem_hash",
        "title": "Increase work_mem to 1GB for HashAggregate",
        "sqlCommand": "SET work_mem = '1GB';",
        "isOptimal": False,
        "resultingCost": 120000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "In-Memory HashAggregate -> Consumes 600MB of RAM per concurrent connection",
        "engineExplanation": "Dangerous: If 10 analytics queries run concurrently, 6GB of server RAM is consumed, risking Linux OOMKiller crashes.",
      },
      {
        "id": "strat_materialized_view_refresh",
        "title": "Materialized View Refreshed Every Hour",
        "sqlCommand": "CREATE MATERIALIZED VIEW mv_sensor_hourly AS SELECT ...",
        "isOptimal": False,
        "resultingCost": 10.0,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "Fast read, but REFRESH MATERIALIZED VIEW takes 30 seconds and data is stale",
        "engineExplanation": "Good for reporting, but cannot provide real-time hourly telemetry for live alert monitors.",
      },
    ],
    "keyTakeaway": "HashAggregate builds an in-memory hash table of all groups and spills to disk when groups exceed work_mem. Providing an index matching GROUP BY keys allows streaming GroupAggregate with constant O(1) memory.",
  },
  {
    "id": "deferred_join_subquery_seek",
    "title": "Deep Page 5,000 in Real Estate Property Listings",
    "difficulty": "Mid",
    "category": "fast_pagination",
    "categoryLabel": "Fast Pagination Techniques",
    "tableName": "properties",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "4.8 GB on disk",
    "slowQuery": """SELECT property_id, title, description, floor_plan, address, price, agent_notes
FROM properties
WHERE city = 'Seattle'
ORDER BY listed_date DESC
LIMIT 20 OFFSET 50000;""",
    "initialCost": 185000,
    "initialLatencyMs": 3100,
    "initialPlanSummary": "Index Scan using idx_city_date -> Heap Fetch on 50,020 wide rows (Reads 450 MB of table pages off disk!)",
    "businessContext": "Real estate search engine: Users jumping to page 2,500 experience 3-second delays because the database fetches 50,000 wide rows with large text descriptions from disk only to discard 49,980 of them.",
    "strategies": [
      {
        "id": "strat_deferred_join_seek_optimal",
        "title": "Deferred Join: Subquery Seek on Covering Index Then Join Primary Key",
        "sqlCommand": """SELECT p.property_id, p.title, p.description, p.floor_plan, p.address, p.price, p.agent_notes
FROM (
    SELECT property_id
    FROM properties
    WHERE city = 'Seattle'
    ORDER BY listed_date DESC
    LIMIT 20 OFFSET 50000
) sub
JOIN properties p ON p.property_id = sub.property_id;""",
        "isOptimal": True,
        "resultingCost": 85.0,
        "resultingLatencyMs": 12.5,
        "executionPlanSummary": "Index Only Scan on (city, listed_date DESC, property_id) for 50k rows -> Fetches ONLY 20 rows from heap!",
        "engineExplanation": "Masterpiece! The inner subquery scans the lightweight index to skip 50,000 rows without touching table heap pages. Then, it joins the primary key to fetch heavy text descriptions for ONLY the final 20 rows!",
      },
      {
        "id": "strat_include_all_columns",
        "title": "Add description and floor_plan to INCLUDE clause",
        "sqlCommand": "CREATE INDEX idx_prop_covering ON properties(city, listed_date DESC) INCLUDE (description, floor_plan, ...);",
        "isOptimal": False,
        "resultingCost": 45000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "Index explodes to 4 GB in size, destroying cache locality",
        "engineExplanation": "Terrible: Storing large descriptions inside the index duplicates the entire table, destroying B-Tree performance.",
      },
      {
        "id": "strat_increase_max_connections",
        "title": "Increase Connection Pool Capacity",
        "sqlCommand": "SET max_connections = 500;",
        "isOptimal": False,
        "resultingCost": 185000,
        "resultingLatencyMs": 3100,
        "executionPlanSummary": "Does not improve query execution time; increases connection contention",
        "engineExplanation": "Connection pool size has zero effect on B-Tree leaf traversal latency.",
      },
    ],
    "keyTakeaway": "Deferred Joins (Late Row Lookup) solve deep pagination with wide rows. Scan a compact covering index in a subquery to skip OFFSET rows, then join back on the Primary Key to fetch wide columns for only the LIMIT page.",
  },
  {
    "id": "polymorphic_association_index",
    "title": "Polymorphic Entity Notification Feed Lookup",
    "difficulty": "Mid",
    "category": "schema_patterns",
    "categoryLabel": "Schema Patterns & Indexing",
    "tableName": "notifications",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "3.9 GB on disk",
    "slowQuery": """SELECT notification_id, user_id, message, is_read, created_at
FROM notifications
WHERE target_type = 'Post' AND target_id = 491028
ORDER BY created_at DESC;""",
    "initialCost": 280000,
    "initialLatencyMs": 3400,
    "initialPlanSummary": "Seq Scan on notifications (cost=0.00..280000.00) Filter: ((target_type = 'Post') AND (target_id = 491028))",
    "businessContext": "Social network notifications: When a post is updated, the app fetches all related notification records. Separate indexes exist on target_type and target_id, but the database ignores both.",
    "strategies": [
      {
        "id": "strat_composite_polymorphic_optimal",
        "title": "Composite Index on (target_type, target_id, created_at DESC)",
        "sqlCommand": """CREATE INDEX idx_notif_target_composite 
ON notifications(target_type, target_id, created_at DESC) 
INCLUDE (user_id, is_read);""",
        "isOptimal": True,
        "resultingCost": 4.8,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan using idx_notif_target_composite -> Exact B-Tree seek in 0.8ms",
        "engineExplanation": "Winner! Polymorphic associations always query target_type and target_id together. A composite index on (target_type, target_id) turns a multi-second table scan into a sub-millisecond point seek.",
      },
      {
        "id": "strat_index_target_id_only",
        "title": "Index on target_id only",
        "sqlCommand": "CREATE INDEX idx_notif_target_id ON notifications(target_id);",
        "isOptimal": False,
        "resultingCost": 4200,
        "resultingLatencyMs": 65,
        "executionPlanSummary": "Bitmap Heap Scan on target_id -> Filter on target_type and filesort on created_at",
        "engineExplanation": "Sub-optimal: target_id 491028 might match a Post, a Comment, or a User, requiring heap filtering and a separate filesort.",
      },
      {
        "id": "strat_hash_index_target",
        "title": "Hash Index on target_type",
        "sqlCommand": "CREATE INDEX idx_notif_hash_type ON notifications USING HASH(target_type);",
        "isOptimal": False,
        "resultingCost": 280000,
        "resultingLatencyMs": 3400,
        "executionPlanSummary": "Low cardinality (5 types) -> Full table scan",
        "engineExplanation": "Low cardinality hash index on 5 entity types is completely useless.",
      },
    ],
    "keyTakeaway": "Polymorphic associations (target_type, target_id) must always be indexed together as a composite index. Adding sort columns (created_at DESC) eliminates post-fetch sorting.",
  },
  {
    "id": "cte_as_materialized_optimization",
    "title": "CTE Optimization Fence in Heavy Ledger Reconciliation",
    "difficulty": "Mid",
    "category": "cte_optimization",
    "categoryLabel": "CTE Optimization & Inlining",
    "tableName": "journal_entries",
    "rowCount": "20,000,000 rows",
    "tableSizeDisk": "5.6 GB on disk",
    "slowQuery": """WITH recent_entries AS (
    SELECT entry_id, account_id, amount, status
    FROM journal_entries
    WHERE status = 'POSTED'
)
SELECT * FROM recent_entries WHERE account_id = 9021;""",
    "initialCost": 420000,
    "initialLatencyMs": 5200,
    "initialPlanSummary": "CTE Scan on recent_entries (cost=0.00..420000.00) -> Materializes 18M rows into RAM/disk scratch file!",
    "businessContext": "Financial ledger reconciliation: PostgreSQL 11 and earlier treated CTEs as an optimization fence (materializing the entire CTE before outer filters). In Postgres 12+, developers used AS MATERIALIZED by habit.",
    "strategies": [
      {
        "id": "strat_inline_cte_not_materialized_optimal",
        "title": "Use AS NOT MATERIALIZED (or Inline Subquery) with Index on (account_id, status)",
        "sqlCommand": """CREATE INDEX idx_journal_acc_status ON journal_entries(account_id, status);

-- Inlined CTE:
WITH recent_entries AS NOT MATERIALIZED (
    SELECT entry_id, account_id, amount, status
    FROM journal_entries
    WHERE status = 'POSTED'
)
SELECT * FROM recent_entries WHERE account_id = 9021;""",
        "isOptimal": True,
        "resultingCost": 5.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Scan using idx_journal_acc_status -> Outer filter pushed down into CTE in 0.9ms",
        "engineExplanation": "Champion! By allowing PostgreSQL to inline the CTE (AS NOT MATERIALIZED), the optimizer pushes the predicate account_id = 9021 directly into the scan, executing an instant index seek instead of materializing 18M rows!",
      },
      {
        "id": "strat_force_as_materialized",
        "title": "Keep WITH recent_entries AS MATERIALIZED",
        "sqlCommand": "WITH recent_entries AS MATERIALIZED (SELECT ...) SELECT ...",
        "isOptimal": False,
        "resultingCost": 420000,
        "resultingLatencyMs": 5200,
        "executionPlanSummary": "Explicitly blocks predicate pushdown, forcing full 18M table scan",
        "engineExplanation": "AS MATERIALIZED acts as an optimization fence, strictly preventing the engine from pushing down outer WHERE conditions.",
      },
      {
        "id": "strat_temporary_table",
        "title": "Create TEMPORARY TABLE before query",
        "sqlCommand": "CREATE TEMP TABLE t_recent AS SELECT ...; SELECT * FROM t_recent WHERE account_id = 9021;",
        "isOptimal": False,
        "resultingCost": 500000,
        "resultingLatencyMs": 6800,
        "executionPlanSummary": "Even slower due to catalog lock overhead and temporary table writes",
        "engineExplanation": "Writing temp tables generates heavy I/O and catalog locks.",
      },
    ],
    "keyTakeaway": "In PostgreSQL 12+, CTEs are automatically inlined unless declared AS MATERIALIZED. Materializing a CTE creates an optimization barrier that blocks index predicate pushdown.",
  },
  {
    "id": "window_function_filter_over_partition",
    "title": "Most Recent Login Per User Window Partition Scan",
    "difficulty": "Mid",
    "category": "window_functions",
    "categoryLabel": "Window Functions & Sorting",
    "tableName": "user_logins",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.1 GB on disk",
    "slowQuery": """SELECT user_id, ip_address, login_time
FROM (
    SELECT user_id, ip_address, login_time,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_time DESC) as rn
    FROM user_logins
    WHERE user_id IN (101, 102, 103, 104, 105)
) t
WHERE rn = 1;""",
    "initialCost": 850,
    "initialLatencyMs": 32,
    "initialPlanSummary": "Sort -> WindowAgg -> Filter (rn = 1) -> Sorts 50,000 historical logins in memory",
    "businessContext": "Security audit checks the last login details for 5 flagged user IDs. Index exists on user_id, but the query sorts thousands of old logins before selecting row 1.",
    "strategies": [
      {
        "id": "strat_composite_user_login_time_optimal",
        "title": "Composite Index: (user_id, login_time DESC) with Covering IP",
        "sqlCommand": "CREATE INDEX idx_user_logins_u_l ON user_logins(user_id, login_time DESC) INCLUDE (ip_address);",
        "isOptimal": True,
        "resultingCost": 4.8,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Only Scan -> WindowAgg eliminates sorting; reads top row per user partition directly",
        "engineExplanation": "Winner! Because the index is already sorted by (user_id, login_time DESC), the WindowAgg node reads rows pre-grouped and pre-sorted. Zero filesort or in-memory quicksort!",
      },
      {
        "id": "strat_group_by_max_subquery",
        "title": "Rewrite to Self-Join with MAX(login_time)",
        "sqlCommand": """SELECT l.user_id, l.ip_address, l.login_time
FROM user_logins l
JOIN (
    SELECT user_id, MAX(login_time) as max_time 
    FROM user_logins 
    WHERE user_id IN (101,102,103,104,105) 
    GROUP BY user_id
) m ON l.user_id = m.user_id AND l.login_time = m.max_time;""",
        "isOptimal": False,
        "resultingCost": 22.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Double table scan and hash join across user_logins",
        "engineExplanation": "Sub-optimal: Reads user_logins twice (once for MAX, once for self-join).",
      },
      {
        "id": "strat_index_ip_only",
        "title": "Index on ip_address",
        "sqlCommand": "CREATE INDEX idx_logins_ip ON user_logins(ip_address);",
        "isOptimal": False,
        "resultingCost": 850,
        "resultingLatencyMs": 32,
        "executionPlanSummary": "Index on ip_address is completely ignored by user_id filter",
        "engineExplanation": "Useless index: The query filters on user_id, not ip_address.",
      },
    ],
    "keyTakeaway": "Window functions with PARTITION BY X ORDER BY Y can execute without sorting if a composite index on (X, Y) matches the partition and sort order exactly.",
  },
  {
    "id": "gist_spatial_distance_st_dwithin",
    "title": "Driver Geolocation Radius Search Without Spatial Index",
    "difficulty": "Mid",
    "category": "spatial",
    "categoryLabel": "Spatial & GiST Indexing",
    "tableName": "driver_locations",
    "rowCount": "3,000,000 rows",
    "tableSizeDisk": "850 MB on disk",
    "slowQuery": """SELECT driver_id, vehicle_type, ST_Distance(location, ST_MakePoint(-122.3321, 47.6062)::geography) as dist_meters
FROM driver_locations
WHERE ST_DWithin(location, ST_MakePoint(-122.3321, 47.6062)::geography, 3000)
ORDER BY dist_meters ASC
LIMIT 10;""",
    "initialCost": 165000,
    "initialLatencyMs": 2400,
    "initialPlanSummary": "Seq Scan on driver_locations (cost=0.00..165000.00) Filter: ST_DWithin(location, ...)",
    "businessContext": "Ride-sharing dispatch: Matching nearby drivers within 3 km of a passenger takes 2.4 seconds, causing checkout timeouts for riders during rush hour.",
    "strategies": [
      {
        "id": "strat_gist_spatial_index_optimal",
        "title": "Spatial GiST Index: USING GIST (location)",
        "sqlCommand": """CREATE EXTENSION IF NOT EXISTS postgis;
CREATE INDEX idx_drivers_location_gist ON driver_locations USING GIST (location);""",
        "isOptimal": True,
        "resultingCost": 14.5,
        "resultingLatencyMs": 1.6,
        "executionPlanSummary": "Bitmap Index Scan using idx_drivers_location_gist -> R-Tree bounding box prune in 1.6ms",
        "engineExplanation": "Winner! GiST implements an R-Tree hierarchy of bounding boxes. ST_DWithin prunes 99.9% of distant drivers in 1.6ms, evaluating exact spherical distance only for candidates within the 3km box.",
      },
      {
        "id": "strat_btree_latitude_longitude",
        "title": "B-Tree Indexes on Separate Latitude and Longitude",
        "sqlCommand": "CREATE INDEX idx_lat ON driver_locations(lat); CREATE INDEX idx_lng ON driver_locations(lng);",
        "isOptimal": False,
        "resultingCost": 42000,
        "resultingLatencyMs": 480,
        "executionPlanSummary": "BitmapAnd across two 1D B-trees -> Still computes spherical math on thousands of rows",
        "engineExplanation": "1D B-trees cannot index 2D spatial relationships efficiently. B-tree intersection is 300x slower than a native 2D R-Tree GiST index.",
      },
      {
        "id": "strat_brin_spatial",
        "title": "BRIN Index on location",
        "sqlCommand": "CREATE INDEX idx_drivers_brin ON driver_locations USING BRIN (location);",
        "isOptimal": False,
        "resultingCost": 95000,
        "resultingLatencyMs": 1200,
        "executionPlanSummary": "BRIN Scan -> High page overlap due to moving driver updates",
        "engineExplanation": "BRIN requires physical on-disk clustering. Moving drivers constantly update location, destroying block-range sorting.",
      },
    ],
    "keyTakeaway": "2D geospatial coordinates cannot be indexed efficiently with 1D B-Tree indexes. Always use GiST (Generalized Search Tree) or SP-GiST indexes for PostGIS ST_DWithin queries.",
  },
  {
    "id": "btree_fillfactor_hot_updates",
    "title": "High-Frequency Heartbeat Updates Trigger Massive Index Bloat",
    "difficulty": "Mid",
    "category": "engine_mechanics",
    "categoryLabel": "HOT Updates & Table Bloat",
    "tableName": "device_heartbeats",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "4.2 GB on disk",
    "slowQuery": """-- Executed 10,000 times/sec:
UPDATE device_heartbeats
SET last_ping_time = NOW(), cpu_usage = 42.5
WHERE device_id = 104921;""",
    "initialCost": 8.5,
    "initialLatencyMs": 14.5,
    "initialPlanSummary": "Update on device_heartbeats -> Non-HOT update writes new tuple to different page, updating all 5 indexes!",
    "businessContext": "IoT device telemetry: A high-frequency heartbeat update takes 14ms per write. Table and indexes bloated from 400 MB to 4.2 GB in 48 hours, causing disk space alarms.",
    "strategies": [
      {
        "id": "strat_fillfactor_hot_optimal",
        "title": "Tune Table fillfactor = 75 to Enable Heap-Only Tuples (HOT) Updates",
        "sqlCommand": """ALTER TABLE device_heartbeats SET (fillfactor = 75);
VACUUM FULL device_heartbeats;
-- Ensure updated columns (last_ping_time, cpu_usage) are NOT indexed!""",
        "isOptimal": True,
        "resultingCost": 3.2,
        "resultingLatencyMs": 0.6,
        "executionPlanSummary": "Heap-Only Tuple (HOT) Update -> New tuple placed on same 8KB page; ZERO index updates!",
        "engineExplanation": "Masterclass! In PostgreSQL, if a newly updated tuple fits on the SAME 8KB data page as the old tuple and no indexed columns changed, a HOT update occurs. It updates in-place without touching any secondary indexes!",
      },
      {
        "id": "strat_add_index_last_ping",
        "title": "Add Index on last_ping_time",
        "sqlCommand": "CREATE INDEX idx_heartbeats_ping ON device_heartbeats(last_ping_time);",
        "isOptimal": False,
        "resultingCost": 18.0,
        "resultingLatencyMs": 28.0,
        "executionPlanSummary": "Guarantees HOT update failure; forces every ping to modify index tree",
        "engineExplanation": "Disaster! Indexing an updated column completely disables HOT optimization, doubling index write amplification and bloat.",
      },
      {
        "id": "strat_run_vacuum_hourly",
        "title": "Run VACUUM FULL every hour via cron",
        "sqlCommand": "0 * * * * psql -c 'VACUUM FULL device_heartbeats;'",
        "isOptimal": False,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Exclusive ACCESS EXCLUSIVE table lock freezes all writes for 45 seconds every hour",
        "engineExplanation": "VACUUM FULL locks the table exclusively, taking down live IoT ingestion.",
      },
    ],
    "keyTakeaway": "Heap-Only Tuple (HOT) optimization eliminates index updates when modifying non-indexed columns. Setting table fillfactor < 100 reserves empty space on each data page for zero-index updates.",
  },
  {
    "id": "semi_join_exists_vs_inner_join",
    "title": "Inner Join Duplicates Rows When Checking Existence",
    "difficulty": "Mid",
    "category": "subqueries",
    "categoryLabel": "Subqueries & Semi-Joins",
    "tableName": "users",
    "rowCount": "2,000,000 rows",
    "tableSizeDisk": "650 MB on disk",
    "slowQuery": """SELECT DISTINCT u.user_id, u.username, u.email
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'COMPLETED';""",
    "initialCost": 310000,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Hash Join -> HashAggregate (cost=0.00..310000.00) -> Joins 15M orders, producing duplicates, then sorts to deduplicate",
    "businessContext": "Marketing email blast queries all users who have placed at least one completed order. The JOIN produces 15 million duplicate user rows, then chokes sorting them with DISTINCT.",
    "strategies": [
      {
        "id": "strat_semi_join_exists_optimal",
        "title": "Rewrite to Semi-Join with WHERE EXISTS",
        "sqlCommand": """SELECT u.user_id, u.username, u.email
FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.user_id = u.user_id AND o.status = 'COMPLETED'
);""",
        "isOptimal": True,
        "resultingCost": 28.0,
        "resultingLatencyMs": 3.4,
        "executionPlanSummary": "Hash Semi Join -> Stops scanning orders on FIRST match per user (Zero Deduplication Sort!)",
        "engineExplanation": "Champion! WHERE EXISTS executes as a Semi-Join: as soon as the engine finds ONE completed order for a user, it immediately emits the user and moves to the next, eliminating 15M duplicate joins and sorting!",
      },
      {
        "id": "strat_inner_join_group_by",
        "title": "Replace DISTINCT with GROUP BY u.user_id, u.username, u.email",
        "sqlCommand": "SELECT u.user_id, u.username, u.email FROM users u JOIN orders o ... GROUP BY u.user_id, ...",
        "isOptimal": False,
        "resultingCost": 290000,
        "resultingLatencyMs": 3900,
        "executionPlanSummary": "Still joins 15 million rows before grouping",
        "engineExplanation": "GROUP BY still performs the cartesian join across all 15 million orders before aggregating.",
      },
      {
        "id": "strat_subquery_in",
        "title": "Use WHERE user_id IN (SELECT user_id FROM orders WHERE status = 'COMPLETED')",
        "sqlCommand": "SELECT * FROM users WHERE user_id IN (SELECT user_id FROM orders WHERE status = 'COMPLETED');",
        "isOptimal": False,
        "resultingCost": 65.0,
        "resultingLatencyMs": 12.0,
        "executionPlanSummary": "Subquery scan on deduplicated orders list (Slightly slower than direct Semi-Join)",
        "engineExplanation": "Acceptable, but IN subqueries without explicit correlation can force materialization of large intermediate ID arrays.",
      },
    ],
    "keyTakeaway": "Never use JOIN + DISTINCT to check for existence of child records. Use WHERE EXISTS (Semi-Join): it halts scanning child rows on the very first match, eliminating duplicate row generation.",
  },
  {
    "id": "anti_join_not_exists_null_safe",
    "title": "Abandoned Shopping Cart NOT IN NULL Trap",
    "difficulty": "Mid",
    "category": "anti_joins",
    "categoryLabel": "Anti-Joins & NULL Semantics",
    "tableName": "carts",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "1.4 GB on disk",
    "slowQuery": """SELECT c.cart_id, c.user_id
FROM carts c
WHERE c.cart_id NOT IN (
    SELECT o.cart_id FROM orders o
);""",
    "initialCost": 850000,
    "initialLatencyMs": 12000,
    "initialPlanSummary": "Seq Scan on carts -> SubPlan executed with NULL check hazard -> Returned ZERO rows unexpectedly!",
    "businessContext": "Abandoned cart email reminder job runs for 12 seconds and returns 0 rows, even though there are 200,000 abandoned carts! A single NULL cart_id in orders broke SQL logic.",
    "strategies": [
      {
        "id": "strat_anti_join_not_exists_optimal",
        "title": "Rewrite to Anti-Join with WHERE NOT EXISTS",
        "sqlCommand": """CREATE INDEX idx_orders_cart_id ON orders(cart_id);

-- Query:
SELECT c.cart_id, c.user_id
FROM carts c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.cart_id = c.cart_id
);""",
        "isOptimal": True,
        "resultingCost": 35.0,
        "resultingLatencyMs": 4.1,
        "executionPlanSummary": "Hash Anti Join using idx_orders_cart_id -> 100% Correct and 4.1ms fast",
        "engineExplanation": "Winner! Under SQL 3-valued logic, if ANY row in the NOT IN subquery has cart_id IS NULL, the expression evaluates to UNKNOWN and drops all rows! NOT EXISTS is 100% NULL-safe and optimizes into a Hash Anti Join.",
      },
      {
        "id": "strat_left_join_is_null",
        "title": "Rewrite to LEFT JOIN ... WHERE o.cart_id IS NULL",
        "sqlCommand": """SELECT c.cart_id, c.user_id FROM carts c 
LEFT JOIN orders o ON c.cart_id = o.cart_id 
WHERE o.cart_id IS NULL;""",
        "isOptimal": False,
        "resultingCost": 45.0,
        "resultingLatencyMs": 6.8,
        "executionPlanSummary": "Hash Anti Join (Works, but slightly more verbose syntax)",
        "engineExplanation": "Functionally correct and equivalent in most modern optimizers, but NOT EXISTS conveys intent more clearly.",
      },
      {
        "id": "strat_not_in_filter_null",
        "title": "Keep NOT IN and add WHERE cart_id IS NOT NULL",
        "sqlCommand": "SELECT ... WHERE c.cart_id NOT IN (SELECT cart_id FROM orders WHERE cart_id IS NOT NULL);",
        "isOptimal": False,
        "resultingCost": 12000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "Materialized SubPlan -> Slower than native Hash Anti Join",
        "engineExplanation": "Fixes the logic bug, but NOT IN still forces materialization of subquery results.",
      },
    ],
    "keyTakeaway": "Always use NOT EXISTS instead of NOT IN for subqueries. If the subquery contains a single NULL value, NOT IN returns zero rows for the entire table due to three-valued logic.",
  },
  {
    "id": "range_type_overlap_gist",
    "title": "Conference Room Booking Conflict Detection",
    "difficulty": "Mid",
    "category": "range_types",
    "categoryLabel": "Range Types & GiST Constraints",
    "tableName": "room_reservations",
    "rowCount": "4,000,000 rows",
    "tableSizeDisk": "1.1 GB on disk",
    "slowQuery": """SELECT reservation_id, room_id
FROM room_reservations
WHERE room_id = 42
  AND start_time < '2026-03-24 16:00:00' 
  AND end_time > '2026-03-24 14:00:00';""",
    "initialCost": 85000,
    "initialLatencyMs": 1150,
    "initialPlanSummary": "Seq Scan on room_reservations (cost=0.00..85000.00) -> Filter: start_time < ... AND end_time > ...",
    "businessContext": "Office scheduling system validates room availability. B-Trees on start_time and end_time cannot evaluate 2-dimensional time interval overlaps, leading to table scans.",
    "strategies": [
      {
        "id": "strat_gist_exclusion_tsrange_optimal",
        "title": "Use TSRANGE with GiST Index and Overlap Operator (&&)",
        "sqlCommand": """CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE INDEX idx_reservations_room_time_gist 
ON room_reservations USING GIST (room_id, tsrange(start_time, end_time));

-- Query:
SELECT reservation_id, room_id FROM room_reservations
WHERE room_id = 42 
  AND tsrange(start_time, end_time) && tsrange('2026-03-24 14:00:00', '2026-03-24 16:00:00');""",
        "isOptimal": True,
        "resultingCost": 6.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Index Scan using idx_reservations_room_time_gist -> Instant interval overlap in 0.9ms",
        "engineExplanation": "Masterpiece! PostgreSQL range types (TSRANGE) and GiST indexes evaluate interval overlaps (&&) directly in the index tree. It also allows EXCLUDE USING GIST constraints to prevent double-booking at the schema level!",
      },
      {
        "id": "strat_composite_start_end",
        "title": "Composite B-Tree on (room_id, start_time, end_time)",
        "sqlCommand": "CREATE INDEX idx_res_room_s_e ON room_reservations(room_id, start_time, end_time);",
        "isOptimal": False,
        "resultingCost": 4200,
        "resultingLatencyMs": 85,
        "executionPlanSummary": "Index Scan on room_id and start_time -> Filter on end_time applied per row",
        "engineExplanation": "B-Tree can only seek on one range column (start_time). It cannot prune intervals where start_time is before the target window.",
      },
      {
        "id": "strat_lock_entire_table",
        "title": "LOCK TABLE room_reservations IN EXCLUSIVE MODE",
        "sqlCommand": "LOCK TABLE room_reservations IN EXCLUSIVE MODE; SELECT ...",
        "isOptimal": False,
        "resultingCost": 85000,
        "resultingLatencyMs": 1150,
        "executionPlanSummary": "Blocks all concurrent bookings worldwide",
        "engineExplanation": "Table locks freeze all rooms worldwide to check room 42.",
      },
    ],
    "keyTakeaway": "Use PostgreSQL range types (TSRANGE, DATERANGE) with GiST indexes for scheduling and reservations. The overlap operator (&&) evaluates interval intersections in sub-millisecond time.",
  },
  {
    "id": "expression_index_lower_trim",
    "title": "Dirty Email Input Triggers Table Scan on User Lookup",
    "difficulty": "Mid",
    "category": "expression_indexes",
    "categoryLabel": "Functional & Expression Indexes",
    "tableName": "user_profiles",
    "rowCount": "9,000,000 rows",
    "tableSizeDisk": "2.4 GB on disk",
    "slowQuery": """SELECT user_id, display_name
FROM user_profiles
WHERE LOWER(TRIM(email)) = 'sarah.connor@sky.net';""",
    "initialCost": 195000,
    "initialLatencyMs": 2400,
    "initialPlanSummary": "Seq Scan on user_profiles (cost=0.00..195000.00) Filter: (lower(btrim(email)) = '...')",
    "businessContext": "Password reset flow sanitizes user inputs by trimming spaces and lowercasing. Query scans 9 million rows because the index on email cannot be used.",
    "strategies": [
      {
        "id": "strat_expression_lower_trim_optimal",
        "title": "Create Expression Index on LOWER(TRIM(email))",
        "sqlCommand": "CREATE UNIQUE INDEX idx_profiles_clean_email ON user_profiles (LOWER(TRIM(email)));",
        "isOptimal": True,
        "resultingCost": 3.8,
        "resultingLatencyMs": 0.6,
        "executionPlanSummary": "Index Scan using idx_profiles_clean_email -> Instant exact seek in 0.6ms",
        "engineExplanation": "Winner! An expression index evaluates LOWER(TRIM(email)) during INSERT/UPDATE and indexes the clean result. Lookups matching that exact expression seek the B-Tree directly in 0.6ms.",
      },
      {
        "id": "strat_app_clean_only",
        "title": "Clean Input in Application without Unique Constraint",
        "sqlCommand": "/* Only clean input in backend code before query */",
        "isOptimal": False,
        "resultingCost": 3.8,
        "resultingLatencyMs": 0.6,
        "executionPlanSummary": "Works for queries, but allows duplicate dirty emails (' Sarah@sky.net') into DB",
        "engineExplanation": "Cleaning only in app code does not prevent duplicate registrations with trailing spaces from slipping into the database.",
      },
      {
        "id": "strat_trigram_index",
        "title": "GIN Trigram Index on email",
        "sqlCommand": "CREATE INDEX idx_email_trgm ON user_profiles USING GIN (email gin_trgm_ops);",
        "isOptimal": False,
        "resultingCost": 45.0,
        "resultingLatencyMs": 8.2,
        "executionPlanSummary": "Bitmap Index Scan on GIN (Overkill for exact email lookup)",
        "engineExplanation": "GIN trigram indexes are designed for wildcards and typos, not exact unique email lookups.",
      },
    ],
    "keyTakeaway": "When data cleansing functions like LOWER(TRIM(col)) are applied in queries, create an expression index on the exact function combination to achieve index seeks while enforcing clean uniqueness.",
  },
  {
    "id": "generated_column_stored_vs_virtual",
    "title": "Full Name Search and Sort Without Table Rewrite",
    "difficulty": "Mid",
    "category": "generated_columns",
    "categoryLabel": "Generated Columns",
    "tableName": "staff_directory",
    "rowCount": "6,000,000 rows",
    "tableSizeDisk": "1.7 GB on disk",
    "slowQuery": """SELECT staff_id, first_name, last_name, email
FROM staff_directory
WHERE (first_name || ' ' || last_name) = 'Sarah Connor'
ORDER BY (first_name || ' ' || last_name) ASC;""",
    "initialCost": 165000,
    "initialLatencyMs": 2100,
    "initialPlanSummary": "Seq Scan on staff_directory -> Sort: (first_name || ' ' || last_name)",
    "businessContext": "Corporate portal searches employees by full name. Concatenating strings in WHERE and ORDER BY forces full table scans and memory filesorts.",
    "strategies": [
      {
        "id": "strat_generated_column_index_optimal",
        "title": "STORED Generated Column with B-Tree Index",
        "sqlCommand": """ALTER TABLE staff_directory ADD COLUMN full_name VARCHAR(150) 
GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

CREATE INDEX idx_staff_full_name ON staff_directory(full_name);

-- Query:
SELECT staff_id, first_name, last_name, email FROM staff_directory 
WHERE full_name = 'Sarah Connor' ORDER BY full_name;""",
        "isOptimal": True,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan using idx_staff_full_name -> Zero Concatenation, Zero Sorting",
        "engineExplanation": "Champion! The STORED generated column computes full_name once upon INSERT/UPDATE. The B-Tree index satisfies both the equality seek and the ORDER BY sort in 0.7ms with zero runtime CPU string concatenation.",
      },
      {
        "id": "strat_expression_index_concat",
        "title": "Expression Index on (first_name || ' ' || last_name)",
        "sqlCommand": "CREATE INDEX idx_staff_concat ON staff_directory((first_name || ' ' || last_name));",
        "isOptimal": False,
        "resultingCost": 8.0,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Scan, but requires repeating identical string concatenation in all queries",
        "engineExplanation": "Acceptable, but does not provide a clean named column for ORMs, GraphQL schemas, or third-party reporting tools.",
      },
      {
        "id": "strat_separate_indexes",
        "title": "Separate Indexes on first_name and last_name",
        "sqlCommand": "CREATE INDEX idx_fn ON staff_directory(first_name); CREATE INDEX idx_ln ON staff_directory(last_name);",
        "isOptimal": False,
        "resultingCost": 165000,
        "resultingLatencyMs": 2100,
        "executionPlanSummary": "Seq Scan -> Concatenation in WHERE prevents using either individual index",
        "engineExplanation": "The database cannot break down a concatenated string comparison into two separate column lookups.",
      },
    ],
    "keyTakeaway": "Use STORED Generated Columns for frequently queried derived attributes (e.g. full names, tax amounts). Indexing the generated column guarantees fast seek and sort without query code clutter.",
  },
  {
    "id": "bulk_insert_batch_size_tuning",
    "title": "500,000 Row Bulk Ingestion Log Flush Stall",
    "difficulty": "Mid",
    "category": "bulk_operations",
    "categoryLabel": "Bulk Operations & Transaction Size",
    "tableName": "warehouse_stock_sync",
    "rowCount": "500,000 rows",
    "tableSizeDisk": "150 MB on disk",
    "slowQuery": """-- Executing 500,000 single INSERT statements:
INSERT INTO warehouse_stock_sync VALUES (1, 101, 50, NOW());
INSERT INTO warehouse_stock_sync VALUES (2, 102, 12, NOW());
-- ... 500,000 times""",
    "initialCost": 500000,
    "initialLatencyMs": 85000,
    "initialPlanSummary": "500,000 separate transactions -> 500,000 synchronous fsync() disk commits!",
    "businessContext": "Nightly ERP inventory sync pushes 500,000 updates. Inserting row-by-row takes 85 seconds (1.5 minutes) and saturates SSD write I/O with continuous WAL flushes.",
    "strategies": [
      {
        "id": "strat_batch_chunks_copy_optimal",
        "title": "Use Batch Multi-Row Inserts (Chunk Size: 5,000) or PostgreSQL COPY",
        "sqlCommand": """-- In PostgreSQL: COPY warehouse_stock_sync FROM STDIN;
-- Or Multi-Row Batch INSERT (chunks of 5,000 rows per transaction):
INSERT INTO warehouse_stock_sync (id, sku_id, qty, updated_at) VALUES 
(1, 101, 50, NOW()), (2, 102, 12, NOW()), ... [5000 rows]
-- 100 transactions instead of 500,000!""",
        "isOptimal": True,
        "resultingCost": 120.0,
        "resultingLatencyMs": 1450,
        "executionPlanSummary": "Batch Insertion / Streaming COPY -> Runtime drops from 85s to 1.45s (58x faster!)",
        "engineExplanation": "Winner! Single INSERTs trigger an fsync() on every row. Grouping writes into chunks of 5,000 amortizes WAL flush overhead across thousands of rows, saturating disk write bandwidth efficiently.",
      },
      {
        "id": "strat_single_giant_transaction",
        "title": "One Giant Transaction with All 500,000 Single Inserts",
        "sqlCommand": "BEGIN; INSERT ... (500k times); COMMIT;",
        "isOptimal": False,
        "resultingCost": 250000,
        "resultingLatencyMs": 32000,
        "executionPlanSummary": "Reduces fsyncs, but still incurs 500,000 network round-trips and parser overhead",
        "engineExplanation": "Better than autocommit, but sending 500,000 separate SQL strings over network connections wastes 32 seconds in network transit and query parsing.",
      },
      {
        "id": "strat_disable_wal_fsync",
        "title": "Disable fsync globally: SET fsync = off",
        "sqlCommand": "ALTER SYSTEM SET fsync = off;",
        "isOptimal": False,
        "resultingCost": 100.0,
        "resultingLatencyMs": 1200,
        "executionPlanSummary": "Crashes database durability: Power loss corrupts database permanently",
        "engineExplanation": "Disastrous! Disabling fsync guarantees data corruption on power loss or kernel panic. Never disable fsync in production.",
      },
    ],
    "keyTakeaway": "Never insert data row-by-row in autocommit mode. Batch records into multi-row chunks of 2,000 to 5,000 rows (or use COPY / LOAD DATA INFILE) to achieve 50x higher throughput safely.",
  },
  {
    "id": "foreign_key_delete_restrict_lock",
    "title": "Catalog Category Hierarchy Deletion Lock",
    "difficulty": "Mid",
    "category": "foreign_keys",
    "categoryLabel": "Foreign Keys & Referential Locks",
    "tableName": "categories",
    "rowCount": "100,000 rows",
    "tableSizeDisk": "25 MB on disk",
    "slowQuery": """DELETE FROM categories WHERE category_id = 901;""",
    "initialCost": 92000,
    "initialLatencyMs": 1150,
    "initialPlanSummary": "Seq Scan on products (40M rows) to check foreign key constraint -> Blocks catalog writes",
    "businessContext": "Merchandising admin deletes an obsolete product category. The query hangs for over a second because the child table `products` has 40M rows without an index on category_id.",
    "strategies": [
      {
        "id": "strat_index_child_fk_optimal",
        "title": "Add Index on Child Foreign Key: products(category_id)",
        "sqlCommand": "CREATE INDEX idx_products_category_id ON products(category_id);",
        "isOptimal": True,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan on products using idx_products_category_id -> Instant referential check in 0.8ms",
        "engineExplanation": "Essential! When deleting or updating a primary key, the engine MUST verify that no child rows reference that key. An index on products(category_id) turns a 40M table scan into an instant 0.8ms seek.",
      },
      {
        "id": "strat_cascade_delete",
        "title": "Change Constraint to ON DELETE CASCADE",
        "sqlCommand": "ALTER TABLE products DROP CONSTRAINT fk_cat, ADD CONSTRAINT fk_cat FOREIGN KEY (category_id) REFERENCES categories ON DELETE CASCADE;",
        "isOptimal": False,
        "resultingCost": 92000,
        "resultingLatencyMs": 1200,
        "executionPlanSummary": "Still full table scan on products without index, plus deletes products unintentionally",
        "engineExplanation": "CASCADE without an index still requires a full table scan to find child rows, and accidentally deletes all products belonging to that category!",
      },
      {
        "id": "strat_disable_fk_checks",
        "title": "Disable foreign_key_checks Session",
        "sqlCommand": "SET foreign_key_checks = 0; DELETE FROM categories WHERE category_id = 901;",
        "isOptimal": False,
        "resultingCost": 3.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Leaves orphaned products pointing to non-existent category 901",
        "engineExplanation": "Violates relational data integrity, leaving broken references in production.",
      },
    ],
    "keyTakeaway": "Parent DELETE/UPDATE operations check child tables for referential integrity. Unindexed foreign keys on child tables force full table scans on every parent modification.",
  },
  {
    "id": "merge_join_presorted_inputs",
    "title": "High-Volume Time-Series Sensor Stream Merge Join",
    "difficulty": "Mid",
    "category": "joins",
    "categoryLabel": "Merge Joins & Presorted Streams",
    "tableName": "sensor_readings",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "6.2 GB on disk",
    "slowQuery": """SELECT r.reading_id, r.sensor_id, r.reading_time, c.calibration_offset
FROM sensor_readings r
JOIN sensor_calibrations c ON r.sensor_id = c.sensor_id AND r.reading_time = c.calibrated_at
WHERE r.sensor_id BETWEEN 100 AND 200;""",
    "initialCost": 380000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "Hash Join -> Hash table build overflows memory and forces disk spill",
    "businessContext": "Industrial monitoring compares 25 million sensor readings against calibration logs. Hash join requires 800MB RAM, spilling to disk during batch pipeline processing.",
    "strategies": [
      {
        "id": "strat_merge_join_presorted_optimal",
        "title": "Composite B-Trees on Both Tables to Enable Zero-Memory Merge Join",
        "sqlCommand": """CREATE INDEX idx_readings_sensor_time ON sensor_readings(sensor_id, reading_time);
CREATE INDEX idx_calibrations_sensor_time ON sensor_calibrations(sensor_id, calibrated_at);""",
        "isOptimal": True,
        "resultingCost": 48.0,
        "resultingLatencyMs": 12.0,
        "executionPlanSummary": "Merge Join using idx_readings_sensor_time & idx_calibrations_sensor_time -> 0 Disk Spill, O(1) Memory",
        "engineExplanation": "Masterpiece! When both input tables have B-Tree indexes matching the join keys (sensor_id, reading_time), the database reads both streams concurrently in sorted order using a Merge Join, requiring zero sorting and zero hash memory!",
      },
      {
        "id": "strat_increase_work_mem_hash",
        "title": "Increase work_mem to 1GB for Hash Join",
        "sqlCommand": "SET work_mem = '1GB';",
        "isOptimal": False,
        "resultingCost": 180000,
        "resultingLatencyMs": 1400,
        "executionPlanSummary": "In-Memory Hash Join -> Fast, but consumes massive memory per query",
        "engineExplanation": "Consumes 1GB of memory per query. Under concurrent pipeline execution, this causes server memory exhaustion.",
      },
      {
        "id": "strat_single_sensor_index",
        "title": "Index sensor_id only on both tables",
        "sqlCommand": "CREATE INDEX idx_r_s ON sensor_readings(sensor_id); CREATE INDEX idx_c_s ON sensor_calibrations(sensor_id);",
        "isOptimal": False,
        "resultingCost": 120000,
        "resultingLatencyMs": 1600,
        "executionPlanSummary": "Still requires sorting on reading_time to evaluate second join key",
        "engineExplanation": "Without reading_time in the index, the inputs are not pre-sorted for the composite join condition.",
      },
    ],
    "keyTakeaway": "Merge Joins are the most memory-efficient join algorithm. When both tables have composite B-Tree indexes matching the join keys in order, the engine streams joins with zero memory allocation.",
  },
  {
    "id": "filtered_aggregates_vs_case_when",
    "title": "Dashboard Metric Aggregation with FILTER vs CASE WHEN",
    "difficulty": "Mid",
    "category": "aggregations",
    "categoryLabel": "Filtered Aggregations",
    "tableName": "ecommerce_orders",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.8 GB on disk",
    "slowQuery": """SELECT 
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
    SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END) as completed_revenue,
    COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded_orders
FROM ecommerce_orders
WHERE merchant_id = 401;""",
    "initialCost": 92000,
    "initialLatencyMs": 1150,
    "initialPlanSummary": "Bitmap Heap Scan on merchant_id -> Evaluates 3 CASE WHEN expressions per row across 250,000 rows",
    "businessContext": "Merchant analytics dashboard calculates KPIs. Evaluating conditional CASE WHEN expressions in CPU loops for 250,000 rows slows down API response times.",
    "strategies": [
      {
        "id": "strat_filter_clause_covering_optimal",
        "title": "Use SQL Standard FILTER (WHERE ...) with Covering Index",
        "sqlCommand": """CREATE INDEX idx_orders_merchant_kpi 
ON ecommerce_orders(merchant_id) 
INCLUDE (status, total_amount);

-- Query:
SELECT 
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_orders,
    SUM(total_amount) FILTER (WHERE status = 'COMPLETED') as completed_revenue,
    COUNT(*) FILTER (WHERE status = 'REFUNDED') as refunded_orders
FROM ecommerce_orders
WHERE merchant_id = 401;""",
        "isOptimal": True,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Only Scan using idx_orders_merchant_kpi -> Filter evaluated in-stream without table reads",
        "engineExplanation": "Winner! The standard SQL FILTER (WHERE ...) clause is optimized directly in PostgreSQL aggregation nodes. Combined with an INCLUDE covering index, the query runs 100% in index memory in 1.4ms.",
      },
      {
        "id": "strat_three_separate_queries",
        "title": "Split into 3 Separate Queries with WHERE status = ...",
        "sqlCommand": "SELECT COUNT(*)... WHERE status = 'COMPLETED'; SELECT SUM()...; SELECT COUNT()...;",
        "isOptimal": False,
        "resultingCost": 35.0,
        "resultingLatencyMs": 5.2,
        "executionPlanSummary": "3 Separate Database Roundtrips and Index Scans",
        "engineExplanation": "Three separate queries require 3 network round-trips and 3 index scans instead of a single consolidated pass.",
      },
      {
        "id": "strat_group_by_status",
        "title": "GROUP BY status and Pivot in Application Code",
        "sqlCommand": "SELECT status, COUNT(*), SUM(total_amount) FROM ecommerce_orders WHERE merchant_id = 401 GROUP BY status;",
        "isOptimal": False,
        "resultingCost": 45.0,
        "resultingLatencyMs": 6.8,
        "executionPlanSummary": "Requires application mapping and fails to return zeros for empty statuses",
        "engineExplanation": "GROUP BY omits statuses with 0 orders, requiring complex fallback null-handling in frontend clients.",
      },
    ],
    "keyTakeaway": "Use standard SQL FILTER (WHERE ...) instead of SUM(CASE WHEN ...) for conditional metrics. Combined with covering indexes, it streams KPI aggregations directly from B-Tree leaf pages.",
  },
  {
    "id": "jsonb_path_query_subscripting",
    "title": "Deep JSONB Array Search and Subscripting",
    "difficulty": "Mid",
    "category": "jsonb",
    "categoryLabel": "JSONB & Path Queries",
    "tableName": "customer_orders",
    "rowCount": "6,000,000 rows",
    "tableSizeDisk": "3.5 GB on disk",
    "slowQuery": """SELECT order_id, payload->'shipping'->>'postal_code' as zip
FROM customer_orders
WHERE payload->'shipping'->>'postal_code' = '98101';""",
    "initialCost": 165000,
    "initialLatencyMs": 2100,
    "initialPlanSummary": "Seq Scan on customer_orders (cost=0.00..165000.00) -> Unpacks JSONB payload per row",
    "businessContext": "Logistics hub filters shipments by destination postal code stored inside a JSONB document. Query unpacks 6 million JSON documents on every zip code batch run.",
    "strategies": [
      {
        "id": "strat_expression_jsonb_text_optimal",
        "title": "B-Tree Expression Index on Specific JSON Path: (payload->'shipping'->>'postal_code')",
        "sqlCommand": """CREATE INDEX idx_orders_shipping_zip 
ON customer_orders ((payload->'shipping'->>'postal_code'));""",
        "isOptimal": True,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan using idx_orders_shipping_zip -> Instant B-Tree equality seek in 0.7ms",
        "engineExplanation": "Winner! If queries always filter on a specific nested JSON field, an expression B-Tree index on that exact path is 10x faster and 80% smaller than a generic GIN index across the entire JSON document.",
      },
      {
        "id": "strat_full_gin_index",
        "title": "Full GIN Index on payload",
        "sqlCommand": "CREATE INDEX idx_orders_payload_gin ON customer_orders USING GIN (payload);",
        "isOptimal": False,
        "resultingCost": 45.0,
        "resultingLatencyMs": 8.5,
        "executionPlanSummary": "Bitmap Index Scan on GIN (Index is 1.8 GB on disk vs 45 MB B-Tree)",
        "engineExplanation": "GIN index works, but indexing every single key in the 3.5 GB payload bloats index size to 1.8 GB and slows down every order INSERT.",
      },
      {
        "id": "strat_cast_jsonb_text",
        "title": "Use payload::text LIKE '%\"postal_code\": \"98101\"%'",
        "sqlCommand": "SELECT ... WHERE payload::text LIKE '%\"postal_code\": \"98101\"%';",
        "isOptimal": False,
        "resultingCost": 220000,
        "resultingLatencyMs": 2900,
        "executionPlanSummary": "Seq Scan with full string pattern search -> Slow and brittle",
        "engineExplanation": "Casting to text is slow, brittle against spacing variations, and prevents index seeks.",
      },
    ],
    "keyTakeaway": "For hot, frequent queries on specific nested JSON attributes, prefer a targeted B-Tree Expression Index on (json_col->'field'->>'subfield') over a heavy full-document GIN index.",
  },
  {
    "id": "rollup_cube_dimensional_report",
    "title": "Multi-Dimensional Sales Report with GROUP BY ROLLUP",
    "difficulty": "Mid",
    "category": "olap",
    "categoryLabel": "OLAP & Grouping Sets",
    "tableName": "sales_transactions",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "4.1 GB on disk",
    "slowQuery": """SELECT region, country, city, SUM(sale_amount)
FROM sales_transactions
WHERE sale_date >= '2026-01-01'
GROUP BY ROLLUP (region, country, city);""",
    "initialCost": 395000,
    "initialLatencyMs": 5400,
    "initialPlanSummary": "Seq Scan -> Sort -> MixedAggregate (ROLLUP 3 levels across 15M rows in memory)",
    "businessContext": "Executive dashboard generates hierarchical sales rollups (Region -> Country -> City -> Total). Query sorts 15 million rows off disk on every dashboard reload.",
    "strategies": [
      {
        "id": "strat_covering_rollup_hierarchy_optimal",
        "title": "Composite Covering Index Matching Rollup Hierarchy: (sale_date, region, country, city) INCLUDE (sale_amount)",
        "sqlCommand": """CREATE INDEX idx_sales_rollup_hierarchy 
ON sales_transactions(sale_date, region, country, city) 
INCLUDE (sale_amount);""",
        "isOptimal": True,
        "resultingCost": 45.0,
        "resultingLatencyMs": 14.0,
        "executionPlanSummary": "Index Only Scan -> MixedAggregate streams pre-sorted hierarchy without disk sort",
        "engineExplanation": "Winner! Because the index delivers rows matching the ROLLUP hierarchy (region, country, city), the database streams aggregations directly from the index leaves, eliminating 100% of external disk filesorts.",
      },
      {
        "id": "strat_union_three_queries",
        "title": "Rewrite to 3 Separate Queries with UNION ALL",
        "sqlCommand": "SELECT region, country, city ... GROUP BY region, country, city UNION ALL SELECT region, country ...",
        "isOptimal": False,
        "resultingCost": 850000,
        "resultingLatencyMs": 9200,
        "executionPlanSummary": "Scans sales_transactions table 3 separate times!",
        "engineExplanation": "Rewriting ROLLUP into separate UNION queries scans the 15M table three times instead of doing a single hierarchical pass.",
      },
      {
        "id": "strat_index_city_only",
        "title": "Index on city only",
        "sqlCommand": "CREATE INDEX idx_sales_city ON sales_transactions(city);",
        "isOptimal": False,
        "resultingCost": 395000,
        "resultingLatencyMs": 5400,
        "executionPlanSummary": "Seq Scan -> City is at the bottom of the hierarchy; ignored by ROLLUP prefix",
        "engineExplanation": "City is the finest grain in the hierarchy and cannot satisfy region/country groupings.",
      },
    ],
    "keyTakeaway": "ROLLUP computes hierarchical subtotals. Aligning composite indexes to match the exact hierarchy (Root -> Parent -> Child) enables the engine to aggregate in a single pre-sorted stream.",
  },
  {
    "id": "in_memory_temporary_table_overflow",
    "title": "MySQL In-Memory Temporary Table Disk Spill",
    "difficulty": "Mid",
    "category": "temp_tables",
    "categoryLabel": "Temporary Tables & Memory Ceilings",
    "tableName": "web_analytics",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.2 GB on disk",
    "slowQuery": """SELECT user_ip, COUNT(DISTINCT session_id), GROUP_CONCAT(page_url SEPARATOR ', ')
FROM web_analytics
WHERE event_date = '2026-03-24'
GROUP BY user_ip;""",
    "initialCost": 320000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "Using temporary; Using filesort -> Temp table converted from Memory to InnoDB on disk (Created_tmp_disk_tables +1)",
    "businessContext": "Daily IP analysis query in MySQL 8.0: The temporary table exceeds tmp_table_size (16MB), converting from fast RAM to an on-disk InnoDB table and freezing server I/O.",
    "strategies": [
      {
        "id": "strat_composite_ip_session_optimal",
        "title": "Composite Index to Eliminate Temporary Table: (event_date, user_ip, session_id)",
        "sqlCommand": """CREATE INDEX idx_analytics_date_ip_sess 
ON web_analytics(event_date, user_ip, session_id) 
INCLUDE (page_url);""",
        "isOptimal": True,
        "resultingCost": 25.0,
        "resultingLatencyMs": 6.8,
        "executionPlanSummary": "Index Only Scan -> Zero temporary tables created (Using index for group-by)",
        "engineExplanation": "Champion! Because the index delivers rows already grouped by user_ip for that date, MySQL aggregates rows on the fly without allocating any temporary tables or spilling to disk!",
      },
      {
        "id": "strat_increase_tmp_table_size",
        "title": "Increase tmp_table_size and max_heap_table_size to 512MB",
        "sqlCommand": "SET SESSION tmp_table_size = 536870912; SET SESSION max_heap_table_size = 536870912;",
        "isOptimal": False,
        "resultingCost": 120000,
        "resultingLatencyMs": 1400,
        "executionPlanSummary": "In-memory temp table (GROUP_CONCAT BLOB columns still force on-disk InnoDB temp table!)",
        "engineExplanation": "Gotcha! In MySQL, if a query selects BLOB or TEXT columns (like GROUP_CONCAT), MySQL cannot use in-memory MEMORY storage engine and forces an on-disk table regardless of tmp_table_size!",
      },
      {
        "id": "strat_disable_group_concat",
        "title": "Remove GROUP_CONCAT and select only COUNT",
        "sqlCommand": "SELECT user_ip, COUNT(DISTINCT session_id) FROM web_analytics ...",
        "isOptimal": False,
        "resultingCost": 180000,
        "resultingLatencyMs": 2200,
        "executionPlanSummary": "Still creates temporary table without index",
        "engineExplanation": "COUNT(DISTINCT) still requires a temporary table without an index.",
      },
    ],
    "keyTakeaway": "TEXT/BLOB columns or GROUP_CONCAT force MySQL temporary tables to disk. Eliminating temporary tables entirely by providing an index matching GROUP BY columns is 100x faster than bumping buffer sizes.",
  },
  {
    "id": "mysql_invisible_index_testing",
    "title": "Dropping Suspected Unused Index Safely with INVISIBLE",
    "difficulty": "Mid",
    "category": "database_operations",
    "categoryLabel": "Database Operations & Tuning",
    "tableName": "customer_accounts",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "5.4 GB on disk",
    "slowQuery": """-- DBA wants to drop suspected unused 2.1 GB index idx_old_legacy:
DROP INDEX idx_old_legacy ON customer_accounts;""",
    "initialCost": 0.0,
    "initialLatencyMs": 0.0,
    "initialPlanSummary": "Outage Risk: If a critical background cron job relies on this index, dropping it crashes production at midnight!",
    "businessContext": "Table has 12 indexes consuming 5.4 GB. DBA suspects idx_old_legacy is unused, but dropping an index on a 15M row table takes 20 minutes to rebuild if proven wrong.",
    "strategies": [
      {
        "id": "strat_invisible_index_optimal",
        "title": "Make Index INVISIBLE First to Test Optimizer Behavior Safely",
        "sqlCommand": """-- Soft-disable index from query planner without dropping data:
ALTER TABLE customer_accounts ALTER INDEX idx_old_legacy INVISIBLE;
-- Monitor sys.schema_unused_indexes for 7 days before issuing DROP INDEX!""",
        "isOptimal": True,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Optimizer ignores index for queries, but index continues updating in background (Can revert in 1ms!)",
        "engineExplanation": "Masterpiece! In MySQL 8.0, an INVISIBLE index is hidden from the query optimizer while still being maintained during writes. If any production query regresses, running ALTER INDEX ... VISIBLE restores it instantly in 0.001s without a 20-minute rebuild!",
      },
      {
        "id": "strat_drop_index_immediately",
        "title": "Issue DROP INDEX immediately during maintenance window",
        "sqlCommand": "DROP INDEX idx_old_legacy ON customer_accounts;",
        "isOptimal": False,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "High risk: If a monthly billing query needs it, rebuilding takes 45 minutes of heavy I/O",
        "engineExplanation": "Dangerous: Dropping an index cannot be undone without a full rebuild that saturates disk I/O.",
      },
      {
        "id": "strat_rename_index",
        "title": "Rename index to idx_old_legacy_backup",
        "sqlCommand": "ALTER TABLE customer_accounts RENAME INDEX idx_old_legacy TO idx_old_legacy_backup;",
        "isOptimal": False,
        "resultingCost": 0.0,
        "resultingLatencyMs": 0.0,
        "executionPlanSummary": "Optimizer still uses the index regardless of its name",
        "engineExplanation": "Renaming an index does not hide it from the optimizer; the engine matches index columns, not index names.",
      },
    ],
    "keyTakeaway": "Never drop large indexes directly in production. Mark them INVISIBLE (or use PostgreSQL hypopg / comment testing) for a full business cycle to confirm zero regressions before permanent deletion.",
  },
  {
    "id": "citext_case_insensitive_type",
    "title": "Eliminating Functional Index Overhead with CITEXT",
    "difficulty": "Mid",
    "category": "data_types",
    "categoryLabel": "Data Types & Extensions",
    "tableName": "auth_identities",
    "rowCount": "12,000,000 rows",
    "tableSizeDisk": "3.1 GB on disk",
    "slowQuery": """SELECT user_id, password_hash
FROM auth_identities
WHERE identifier = 'john.doe@company.org';""",
    "initialCost": 240000,
    "initialLatencyMs": 2800,
    "initialPlanSummary": "Seq Scan on auth_identities Filter: (lower(identifier) = '...') -> Functional index missing",
    "businessContext": "Identity provider handles millions of SSO logins. The table has an index on identifier, but case-insensitive lookups require LOWER() on every query, causing developer mistakes.",
    "strategies": [
      {
        "id": "strat_citext_extension_optimal",
        "title": "Convert Column to CITEXT (Case-Insensitive Text)",
        "sqlCommand": """CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE auth_identities ALTER COLUMN identifier TYPE citext;
CREATE UNIQUE INDEX idx_auth_ident_citext ON auth_identities(identifier);

-- Natural queries now automatically seek B-Tree case-insensitively without LOWER()!""",
        "isOptimal": True,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Index Scan using idx_auth_ident_citext -> Standard B-Tree seek with built-in case folding",
        "engineExplanation": "Winner! CITEXT automatically calls lower() internally for all comparisons and B-Tree index operations. Developers write natural SQL queries without LOWER(), preventing human errors and index misses permanently.",
      },
      {
        "id": "strat_functional_index_only",
        "title": "Create Expression Index on LOWER(identifier)",
        "sqlCommand": "CREATE UNIQUE INDEX idx_auth_lower ON auth_identities(LOWER(identifier));",
        "isOptimal": False,
        "resultingCost": 4.1,
        "resultingLatencyMs": 0.7,
        "executionPlanSummary": "Works, but fails if any developer forgets to write LOWER() in a new query",
        "engineExplanation": "Fragile: If any developer or third-party ORM issues WHERE identifier = '...', the functional index is ignored, causing an accidental table scan.",
      },
      {
        "id": "strat_ilike_scan",
        "title": "Use identifier ILIKE 'john.doe@company.org'",
        "sqlCommand": "SELECT ... WHERE identifier ILIKE '...';",
        "isOptimal": False,
        "resultingCost": 240000,
        "resultingLatencyMs": 2900,
        "executionPlanSummary": "Seq Scan -> ILIKE does not use standard B-Tree index",
        "engineExplanation": "ILIKE triggers a full table scan on standard B-tree columns.",
      },
    ],
    "keyTakeaway": "In PostgreSQL, use the CITEXT extension for columns that require universal case-insensitive uniqueness (emails, usernames). It natively routes standard queries to B-Tree indexes without LOWER() wrapper traps.",
  },
  {
    "id": "two_step_application_join",
    "title": "Deconstructing 6-Table Monolith Query in Microservices",
    "difficulty": "Mid",
    "category": "application_joins",
    "categoryLabel": "Application-Side Joins",
    "tableName": "orders",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "8.5 GB across 6 tables",
    "slowQuery": """SELECT o.order_id, u.username, p.payment_method, s.carrier, i.item_name, pr.price
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN payments p ON o.order_id = p.order_id
JOIN shipments s ON o.order_id = s.order_id
JOIN order_items i ON o.order_id = i.order_id
JOIN products pr ON i.product_id = pr.product_id
WHERE o.user_id = 9182
LIMIT 20;""",
    "initialCost": 32000,
    "initialLatencyMs": 480,
    "initialPlanSummary": "Nested Loop across 6 tables -> Cartesian network row multiplication (120 duplicate user/payment columns)",
    "businessContext": "User order history screen: Joining 6 tables duplicates order metadata across every line item sent over the network, prevents caching individual entities in Redis, and blocks database sharding.",
    "strategies": [
      {
        "id": "strat_two_step_app_join_optimal",
        "title": "Application-Side 2-Step Batch Ingestion with In-Memory Stitching",
        "sqlCommand": """-- Query 1: Fetch 20 orders for user (0.8ms):
SELECT order_id, user_id, status FROM orders WHERE user_id = 9182 LIMIT 20;
-- Query 2: Batch fetch items for those 20 order IDs (0.9ms):
SELECT order_id, product_id, quantity FROM order_items WHERE order_id IN (...20 ids...);
-- Stitch in Java/Go application memory with HashMap!""",
        "isOptimal": True,
        "resultingCost": 8.0,
        "resultingLatencyMs": 1.7,
        "executionPlanSummary": "2x Primary Key Index Seeks -> 1.7ms total, 90% less network payload, 100% cacheable",
        "engineExplanation": "Architecture Winner! Two simple queries hitting Primary Keys complete in 1.7ms total. It eliminates Cartesian row duplication over the wire, allows caching individual products in Redis, and supports partitioned databases.",
      },
      {
        "id": "strat_create_giant_materialized_view",
        "title": "Create Giant 6-Table Materialized View",
        "sqlCommand": "CREATE MATERIALIZED VIEW mv_all_order_data AS SELECT ...",
        "isOptimal": False,
        "resultingCost": 4.0,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Consumes 25 GB disk; refreshing view blocks database updates",
        "engineExplanation": "Heavy maintenance bloat: Materializing 6 joined tables creates massive write amplification and requires costly periodic refreshes.",
      },
      {
        "id": "strat_loop_single_item_queries",
        "title": "Fetch Orders, then Loop Each Order to Fetch Line Items One-by-One",
        "sqlCommand": "for order in orders: SELECT * FROM order_items WHERE order_id = order.id",
        "isOptimal": False,
        "resultingCost": 1500,
        "resultingLatencyMs": 35,
        "executionPlanSummary": "N+1 Query Pattern: 21 network round-trips",
        "engineExplanation": "Classic N+1 query bug: Running queries in a loop multiplies network latency by 20x.",
      },
    ],
    "keyTakeaway": "Massive multi-table joins harm caching, inflate network payloads, and break sharding. High-scale architectures split them into 2-step batch queries (SELECT ... WHERE id IN (...)) stitched in application memory.",
  },
  {
    "id": "deterministic_id_sort_update",
    "title": "Bulk Account Expiration Deadlock Under Concurrent Traffic",
    "difficulty": "Mid",
    "category": "deadlocks",
    "categoryLabel": "Concurrency & Lock Ordering",
    "tableName": "user_subscriptions",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.1 GB on disk",
    "slowQuery": """-- Executed concurrently by 4 background workers:
UPDATE user_subscriptions
SET status = 'EXPIRED'
WHERE status = 'ACTIVE' AND expires_at < NOW()
LIMIT 500;""",
    "initialCost": 8500,
    "initialLatencyMs": 450,
    "initialPlanSummary": "Deadlock found when trying to get lock; try restarting transaction (Error 1213)",
    "businessContext": "Subscription reaper cron runs with 4 parallel worker threads to expire lapsed memberships. Workers acquire gap locks and row locks in random order, throwing deadlocks every 10 seconds.",
    "strategies": [
      {
        "id": "strat_deterministic_id_sort_optimal",
        "title": "3-Step Deterministic Pattern: SELECT id -> Sort Ascending in Memory -> Update by Primary Key",
        "sqlCommand": """-- Step 1: Read IDs read-only:
SELECT id FROM user_subscriptions WHERE status = 'ACTIVE' AND expires_at < NOW() LIMIT 500;
-- Step 2: Sort IDs in application memory: [12, 45, 98, 140...]
-- Step 3: Mutate strictly in ascending PK order:
UPDATE user_subscriptions SET status = 'EXPIRED' WHERE id IN (12, 45, 98, 140...);""",
        "isOptimal": True,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Exact Record Locks on Primary Key -> Zero Gap Locks, Zero Deadlocks!",
        "engineExplanation": "Masterclass! In MySQL InnoDB, deadlocks occur when threads lock records in reverse physical order. Sorting IDs in ascending order in application memory guarantees all threads acquire locks in identical physical sequence, mathematically eliminating deadlocks!",
      },
      {
        "id": "strat_single_worker_serial",
        "title": "Reduce to 1 Single Threaded Worker",
        "sqlCommand": "/* Run cron with concurrency = 1 */",
        "isOptimal": False,
        "resultingCost": 8500,
        "resultingLatencyMs": 4500,
        "executionPlanSummary": "Eliminates deadlocks, but processing 500,000 expired rows takes hours",
        "engineExplanation": "Single-threading avoids deadlocks, but cripples background worker processing throughput.",
      },
      {
        "id": "strat_set_innodb_lock_wait_timeout",
        "title": "Reduce innodb_lock_wait_timeout to 1 second",
        "sqlCommand": "SET SESSION innodb_lock_wait_timeout = 1;",
        "isOptimal": False,
        "resultingCost": 8500,
        "resultingLatencyMs": 1000,
        "executionPlanSummary": "Aborts queries faster on lock timeout, but does not stop deadlocks",
        "engineExplanation": "Failing faster does not fix the root cause of cyclic lock acquisition dependencies.",
      },
    ],
    "keyTakeaway": "To prevent deadlocks during bulk updates, never issue UPDATE ... WHERE range LIMIT. Use the 3-step deterministic pattern: read IDs, sort them in ascending numerical order in memory, and update strictly by Primary Key.",
  },
]
