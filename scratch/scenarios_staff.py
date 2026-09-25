# Staff Scenarios (Scenarios 98 to 113: 16 scenarios)

STAFF_SCENARIOS = [
  {
    "id": "distributed_transaction_2pc_vs_saga",
    "title": "Two-Phase Commit (2PC) Coordinator Crash & Indoubt Lock Blocking",
    "difficulty": "Staff",
    "category": "distributed",
    "categoryLabel": "Distributed Systems & Architecture",
    "tableName": "distributed_tx_participants",
    "rowCount": "Multi-region microservices (Orders, Payments, Inventory)",
    "tableSizeDisk": "Distributed database nodes",
    "slowQuery": """-- XA / 2PC Distributed Transaction:
XA START 'tx_98231';
UPDATE inventory SET reserved = reserved + 1 WHERE sku = 'MACBOOK-PRO';
XA END 'tx_98231';
XA PREPARE 'tx_98231';
-- Coordinator crashes before issuing XA COMMIT!
-- Rows in 'inventory' are locked indefinitely across all database nodes!""",
    "initialCost": 1000000,
    "initialLatencyMs": 300000,
    "initialPlanSummary": "XA Indoubt Transaction: exclusive row locks held by prepared transaction block all inventory writes indefinitely",
    "businessContext": "Enterprise microservice architecture uses XA/2PC transactions. An orchestration pod restarts midway through checkout. The inventory database hangs on subsequent purchases because indoubt locks are never released.",
    "strategies": [
      {
        "id": "strat_saga_compensating_tx_optimal",
        "title": "Replace 2PC with Choreographed/Orchestrated Saga Pattern & Compensating Transactions",
        "sqlCommand": """-- 1. Execute local ACID transactions per service:
UPDATE inventory SET reserved = reserved + 1 WHERE sku = 'MACBOOK-PRO';
-- Publish Domain Event to Kafka / Outbox table:
INSERT INTO outbox_events (aggregate_id, event_type, payload) 
VALUES ('ord_102', 'InventoryReserved', '{"sku": "MACBOOK-PRO"}');

-- 2. If downstream Payment service fails, execute compensating action:
-- UPDATE inventory SET reserved = reserved - 1 WHERE sku = 'MACBOOK-PRO';""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Local ACID transactions with asynchronous event-driven compensation (Zero cross-network distributed lock holding)",
        "engineExplanation": "Winner! Two-Phase Commit is a blocking protocol: if the coordinator crashes during the prepare/commit phase, participants must hold exclusive database locks indefinitely until manual intervention, destroying availability. The Saga pattern breaks the distributed transaction into independent local transactions with compensating undo actions, maintaining high availability.",
      },
      {
        "id": "strat_increase_xa_timeout",
        "title": "Set xa_detach_on_prepare = 1 and elevate transaction timeout",
        "sqlCommand": "SET GLOBAL xa_detach_on_prepare = 1;",
        "isOptimal": False,
        "resultingCost": 500000,
        "resultingLatencyMs": 60000,
        "executionPlanSummary": "Detaches thread but row locks remain held by indoubt XA transaction",
        "engineExplanation": "Detaching the session frees the client connection thread, but the underlying database locks remain held on disk by the prepared transaction.",
      },
      {
        "id": "strat_kill_xa_transactions_cron",
        "title": "Run a bash cron script every 10 seconds executing XA ROLLBACK on all prepared transactions",
        "sqlCommand": "XA RECOVER; -- parse and XA ROLLBACK '...';",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 5.0,
        "executionPlanSummary": "High data corruption: Rolls back transactions that were actually committed on other nodes, creating ledger inconsistencies",
        "engineExplanation": "Blindly rolling back prepared transactions risks rolling back a transaction that committed on node 2, violating ACID atomicity across services.",
      },
    ],
    "keyTakeaway": "Two-Phase Commit (2PC) is synchronous and blocking; coordinator crashes hold database row locks indefinitely. Modern distributed systems use Sagas with compensating transactions and transactional outboxes.",
  },
  {
    "id": "database_sharding_key_fanout_prevention",
    "title": "Scatter-Gather Sharding Query Fanout Across 64 Physical Database Nodes",
    "difficulty": "Staff",
    "category": "sharding",
    "categoryLabel": "Table Partitioning & Sharding",
    "tableName": "sharded_orders (64 physical Vitess/Citus shards)",
    "rowCount": "2,000,000,000 rows across shards",
    "tableSizeDisk": "1.2 TB across cluster",
    "slowQuery": """-- Sharding Key is tenant_id, but query searches by customer_email:
SELECT order_id, order_total, created_at
FROM sharded_orders
WHERE customer_email = 'alice@example.com'
ORDER BY created_at DESC
LIMIT 10;""",
    "initialCost": 640000,
    "initialLatencyMs": 1850,
    "initialPlanSummary": "Scatter-Gather Fanout: Middleware sends query to ALL 64 shards simultaneously. Latency bounded by the 99th percentile slowest replica node.",
    "businessContext": "Multi-tenant e-commerce platform sharded across 64 MySQL nodes by tenant_id. Searching orders by customer email fans out across all 64 database instances, saturating network switches and driving tail latency to 2 seconds.",
    "strategies": [
      {
        "id": "strat_global_lookup_secondary_index_optimal",
        "title": "Deploy Global Secondary Lookup Index / Sharded Routing Table (email -> tenant_id)",
        "sqlCommand": """-- 1. Query lightweight global routing table (or Redis / Citus reference table):
SELECT tenant_id FROM user_tenant_lookup WHERE customer_email = 'alice@example.com';
-- Result: tenant_id = 42

-- 2. Direct targeted query with shard routing key:
SELECT order_id, order_total, created_at
FROM sharded_orders
WHERE tenant_id = 42 AND customer_email = 'alice@example.com'
ORDER BY created_at DESC
LIMIT 10;""",
        "isOptimal": True,
        "resultingCost": 12.0,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "Direct Point-to-Point Shard Routing -> Single shard contacted, zero scatter-gather fanout",
        "engineExplanation": "Winner! In a sharded database, any query omitting the sharding key must be broadcast to every single shard (scatter-gather). Cluster tail latency is bounded by the slowest replica ($P(\text{slow}) = 1 - (1-p)^{64}$). Maintaining a global secondary lookup table or distributed cache resolves the shard key in 0.5ms, turning a 64-node fanout into a targeted single-node lookup.",
      },
      {
        "id": "strat_parallel_goroutines_fanout",
        "title": "Use 64 Go goroutines to query all shards concurrently",
        "sqlCommand": "// Application fanout with sync.WaitGroup across 64 database connections",
        "isOptimal": False,
        "resultingCost": 640000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "Scatter-gather fanout still burns 64x CPU and saturates database connection pools across all 64 nodes",
        "engineExplanation": "Application parallelization does not eliminate resource waste. 1,000 concurrent searches consume 64,000 active database connection slots.",
      },
      {
        "id": "strat_rehash_shard_key_email",
        "title": "Change sharding key to hash(customer_email)",
        "sqlCommand": "-- Re-shard entire database by customer_email",
        "isOptimal": False,
        "resultingCost": 1000000,
        "resultingLatencyMs": 2500,
        "executionPlanSummary": "Breaks all multi-tenant queries (WHERE tenant_id = X), turning 99% of business traffic into fanout queries",
        "engineExplanation": "Switching the sharding key to email fixes email searches but breaks all merchant/tenant-scoped analytics and operations.",
      },
    ],
    "keyTakeaway": "Queries omitting the database sharding key cause scatter-gather fanout across all shards, suffering from tail latency amplification. Build a global lookup index to resolve the shard key before querying.",
  },
  {
    "id": "hotspot_sharded_counter_architecture",
    "title": "Extreme Write Latch Contention on Single Counter Hotspot (100k TPS)",
    "difficulty": "Staff",
    "category": "distributed",
    "categoryLabel": "Distributed Systems & Architecture",
    "tableName": "video_likes",
    "rowCount": "1 viral video (100,000 likes/sec)",
    "tableSizeDisk": "Single row in database page",
    "slowQuery": """-- 10,000 concurrent API workers executing:
UPDATE video_stats 
SET like_count = like_count + 1 
WHERE video_id = 999999;""",
    "initialCost": 8.4,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Exclusive row-level latch queue -> 10,000 threads queueing for single row in InnoDB buffer pool, TPS drops from 100k to 800",
    "businessContext": "Global livestream platform where a celebrity video receives 100,000 likes per second. Even on a 128-core bare metal database, CPU maxes out on kernel spinlocks and row-lock queues.",
    "strategies": [
      {
        "id": "strat_sharded_counter_buckets_optimal",
        "title": "Deploy Sharded Counter Buckets (N Slots per Entity)",
        "sqlCommand": """-- 1. Table holds N discrete bucket slots for each video:
CREATE TABLE video_like_buckets (
  video_id BIGINT NOT NULL,
  slot_id INT NOT NULL,
  like_count BIGINT DEFAULT 0,
  PRIMARY KEY (video_id, slot_id)
);
-- Pre-populate 100 slots for video:
-- INSERT INTO video_like_buckets SELECT 999999, generate_series(0, 99), 0;

-- 2. Worker increments random slot (eliminating single-row latch contention):
UPDATE video_like_buckets 
SET like_count = like_count + 1 
WHERE video_id = 999999 AND slot_id = floor(random() * 100)::int;

-- 3. Read total likes via sum across the 100 slots:
-- SELECT SUM(like_count) FROM video_like_buckets WHERE video_id = 999999;""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.4,
        "executionPlanSummary": "Index Update on random slot -> Write load distributed across 100 physical rows, achieving 100,000+ TPS",
        "engineExplanation": "Winner! A single database row can only be locked and modified by one CPU thread at a time (Amdahl's Law). No amount of hardware can overcome the single-row write barrier. By splitting the counter into N discrete buckets (e.g. 100 slots) and writing to a random slot, lock contention is reduced by 100x. SUM(like_count) aggregates the total in sub-millisecond time.",
      },
      {
        "id": "strat_atomic_redis_incr",
        "title": "Move counter directly to Redis INCR without durability persistence",
        "sqlCommand": "INCR video:999999:likes",
        "isOptimal": False,
        "resultingCost": 0,
        "resultingLatencyMs": 0.3,
        "executionPlanSummary": "High throughput but risk of permanent like count loss upon Redis node failover without persistence",
        "engineExplanation": "Pure Redis counters without transactional reconciliation or durability risk losing user engagements during network partitions or node failover.",
      },
      {
        "id": "strat_spin_lock_delay",
        "title": "Tune innodb_spin_wait_delay to 96",
        "sqlCommand": "SET GLOBAL innodb_spin_wait_delay = 96;",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 3800,
        "executionPlanSummary": "Reduces CPU heat slightly but throughput remains hard-capped at 800 TPS by single-row serialization",
        "engineExplanation": "Tuning spinlock delays treats CPU symptoms without solving the fundamental physical bottleneck of single-row lock serialization.",
      },
    ],
    "keyTakeaway": "A single database row cannot scale past ~1,000-2,000 concurrent writes/second due to row-level page latches. Scale write-heavy counters using distributed counter buckets (N slots per entity).",
  },
  {
    "id": "buffer_pool_lru_cache_pollution",
    "title": "Full Table Backup Flushing Hot Working Set from InnoDB Buffer Pool",
    "difficulty": "Staff",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "mysqldump / historical_archive",
    "rowCount": "800,000,000 archived rows",
    "tableSizeDisk": "180 GB table / 64 GB Buffer Pool",
    "slowQuery": """-- Nightly mysqldump or analytics export scans entire cold archive:
SELECT /*!40001 SQL_NO_CACHE */ * FROM historical_archive;""",
    "initialCost": 2500000,
    "initialLatencyMs": 450000,
    "initialPlanSummary": "Full Table Scan -> Evicts active OLTP customer working pages from the Young sublist of the Buffer Pool LRU chain!",
    "businessContext": "Every night at 2:00 AM during automated backups, production API p99 latency spikes from 2ms to 450ms for 3 hours because the backup sweeps millions of cold pages into the InnoDB Buffer Pool, purging hot user sessions.",
    "strategies": [
      {
        "id": "strat_tune_old_blocks_time_optimal",
        "title": "Configure innodb_old_blocks_time & innodb_old_blocks_pct to Shield Working Set",
        "sqlCommand": """-- Guard the Young LRU generation from single-pass scans:
SET GLOBAL innodb_old_blocks_time = 1000; -- 1000ms delay before promoting to Young list!
SET GLOBAL innodb_old_blocks_pct = 20;    -- Shrink Old generation to 20% of buffer pool

-- Run mysqldump with non-locking transaction consistency:
-- mysqldump --single-transaction --quick ...""",
        "isOptimal": True,
        "resultingCost": 850000,
        "resultingLatencyMs": 2.1,
        "executionPlanSummary": "Cold scan pages remain confined to Old sublist and are rapidly evicted without evicting hot OLTP pages",
        "engineExplanation": "Winner! InnoDB uses a midpoint insertion LRU algorithm split into 'Young' (hot) and 'Old' (cold) sublists. New pages enter the Old sublist. By setting innodb_old_blocks_time = 1000 (1 second), pages accessed during a rapid full table scan cannot be promoted to the Young sublist unless re-accessed after 1,000ms. Hot OLTP pages remain safely pinned in memory.",
      },
      {
        "id": "strat_sql_no_cache_directive",
        "title": "Add SQL_NO_CACHE to the query",
        "sqlCommand": "SELECT SQL_NO_CACHE * FROM historical_archive;",
        "isOptimal": False,
        "resultingCost": 2500000,
        "resultingLatencyMs": 440000,
        "executionPlanSummary": "SQL_NO_CACHE only affected the legacy MySQL Query Cache (removed in 8.0); it has zero effect on InnoDB Buffer Pool",
        "engineExplanation": "SQL_NO_CACHE disabled the deprecated MySQL query cache; it does not stop InnoDB from reading data pages into the buffer pool.",
      },
      {
        "id": "strat_double_buffer_pool_ram",
        "title": "Upgrade instance RAM to 256 GB to fit entire archive",
        "sqlCommand": "-- Upgrade cloud instance to r6i.8xlarge",
        "isOptimal": False,
        "resultingCost": 2500000,
        "resultingLatencyMs": 350000,
        "executionPlanSummary": "Increases cloud infrastructure costs by $15,000/year without solving the fundamental cache churn flaw",
        "engineExplanation": "Expanding memory is expensive and temporary; once the archive table exceeds 256 GB, the exact same cache pollution returns.",
      },
    ],
    "keyTakeaway": "Large table scans pollute the buffer pool by evicting hot working sets. Protect your active working set using innodb_old_blocks_time (e.g. 1000ms) to quarantine scan pages in the cold LRU sublist.",
  },
  {
    "id": "zfs_ext4_recordsize_page_alignment",
    "title": "PostgreSQL 8KB Page Torn Writes vs OS Filesystem Block Misalignment",
    "difficulty": "Staff",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "financial_records",
    "rowCount": "100,000,000 rows",
    "tableSizeDisk": "45 GB on disk",
    "slowQuery": """-- Heavy write transactions encountering double-buffering write amplification:
INSERT INTO financial_records (id, amount, account_id) 
SELECT g, random()*1000, 42 FROM generate_series(1, 100000) g;""",
    "initialCost": 85000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "Kernel I/O bottleneck: PostgreSQL 8KB pages misaligned with ZFS 128KB recordsize (Read-Modify-Write amplification) + WAL full_page_writes penalty",
    "businessContext": "PostgreSQL running on ZFS / ext4 NVMe storage shows 8x write amplification compared to raw SQL throughput. Storage controller saturates due to read-modify-write block misalignments.",
    "strategies": [
      {
        "id": "strat_match_recordsize_and_compression_optimal",
        "title": "Align Filesystem recordsize to 8KB & Match PostgreSQL Block Size",
        "sqlCommand": """-- On ZFS storage pool for PostgreSQL data directory:
-- zfs set recordsize=8k tank/postgres/data
-- zfs set compression=lz4 tank/postgres/data
-- zfs set atime=off tank/postgres/data
-- zfs set logbias=latency tank/postgres/data

-- In postgresql.conf:
-- wal_init_zero = off
-- wal_recycle = off (on ZFS CoW)""",
        "isOptimal": True,
        "resultingCost": 12000,
        "resultingLatencyMs": 620,
        "executionPlanSummary": "Perfect 8KB-to-8KB block alignment eliminates Read-Modify-Write cycles, cutting write amplification by 80%",
        "engineExplanation": "Winner! By default, ZFS uses a 128KB recordsize. When PostgreSQL modifies an 8KB data page, ZFS must read the entire 128KB block from disk, update 8KB, and write back all 128KB (Read-Modify-Write)! Setting ZFS recordsize=8k aligns filesystem allocation units perfectly with PostgreSQL's 8KB page size, slashing write I/O.",
      },
      {
        "id": "strat_disable_full_page_writes",
        "title": "Set full_page_writes = off in postgresql.conf",
        "sqlCommand": "ALTER SYSTEM SET full_page_writes = off; SELECT pg_reload_conf();",
        "isOptimal": False,
        "resultingCost": 12000,
        "resultingLatencyMs": 580,
        "executionPlanSummary": "CRITICAL RISK: Causes torn page corruption on non-CoW filesystems (ext4/XFS) during OS crash",
        "engineExplanation": "On ext4/XFS, disabling full_page_writes means an OS crash midway through writing an 8KB page leaves half-written pages that cannot be repaired by WAL recovery.",
      },
      {
        "id": "strat_increase_checkpoint_timeout",
        "title": "Increase checkpoint_timeout to 24 hours",
        "sqlCommand": "ALTER SYSTEM SET checkpoint_timeout = '24h';",
        "isOptimal": False,
        "resultingCost": 85000,
        "resultingLatencyMs": 4500,
        "executionPlanSummary": "Causes hours of crash recovery time during reboot and saturates disk with uncheckpointed WAL",
        "engineExplanation": "Extreme checkpoint timeouts inflate recovery time (RTO) to hours and consume hundreds of gigabytes of WAL disk storage.",
      },
    ],
    "keyTakeaway": "Always match the underlying OS filesystem block/recordsize to the database page size (e.g. ZFS recordsize=8k for PostgreSQL 8KB pages) to prevent severe Read-Modify-Write amplification.",
  },
  {
    "id": "read_your_own_writes_lsn_tracking",
    "title": "Read-After-Write Consistency Lag in Primary-Replica Topology",
    "difficulty": "Staff",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "user_comments",
    "rowCount": "50,000,000 rows",
    "tableSizeDisk": "15 GB on disk",
    "slowQuery": """-- 1. Client posts a new comment (written to Primary):
INSERT INTO user_comments (comment_id, user_id, body) VALUES (502, 99, 'Great post!');

-- 2. Client is redirected to post page, which reads from Read Replica:
SELECT * FROM user_comments WHERE post_id = 120 ORDER BY created_at DESC;
-- The user's newly submitted comment is MISSING because replica has 200ms lag!""",
    "initialCost": 8.4,
    "initialLatencyMs": 1.2,
    "initialPlanSummary": "Replica LSN lag: Read replica is 250ms behind primary. User does not see their own write and clicks 'Submit' 5 times in confusion.",
    "businessContext": "Social network users report comments disappear immediately after submitting. Frustrated users submit duplicate comments, overwhelming backend APIs.",
    "strategies": [
      {
        "id": "strat_lsn_gtid_read_your_writes_optimal",
        "title": "Track Primary Commit LSN/GTID via Session Cookie & Wait or Route to Primary",
        "sqlCommand": """-- On Primary after write, capture the Log Sequence Number / GTID:
SELECT pg_current_wal_lsn(); -- Returns e.g. '0/16B3748'
-- Set HTTP response cookie: X-User-LSN = '0/16B3748'

-- On subsequent Read request:
-- If reading from replica, wait until replica catches up:
SELECT pg_wal_lsn_diff(pg_last_wal_replay_lsn(), '0/16B3748'::pg_lsn);
-- If lag > 0, either sleep 20ms or route this specific user's query to Primary!""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "Causal Consistency (Read-Your-Own-Writes) guaranteed without sending all global read traffic to Primary",
        "engineExplanation": "Winner! Asynchronous replication always incurs a replication lag window. Routing ALL reads to the primary defeats the purpose of read replicas. By returning the transaction's commit LSN/GTID to the client and checking it before replica queries, you achieve causal 'Read-Your-Own-Writes' consistency while keeping 95% of reads distributed across replicas.",
      },
      {
        "id": "strat_route_all_reads_primary",
        "title": "Route all application reads to the Primary database",
        "sqlCommand": "-- Configure Spring DataSource to send all reads to master_db",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 45.0,
        "executionPlanSummary": "Primary DB CPU spikes to 100%, saturating master connection pools and degrading write throughput",
        "engineExplanation": "Routing 100% of reads to the primary negates replica scalability and crashes the primary during peak traffic.",
      },
      {
        "id": "strat_client_side_sleep",
        "title": "Add a Thread.sleep(500) before reading on the frontend/backend",
        "sqlCommand": "Thread.sleep(500);",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 501.2,
        "executionPlanSummary": "Arbitrary sleep wastes user time during normal operation and still fails if lag spikes above 500ms",
        "engineExplanation": "Fixed sleep intervals degrade user experience and provide zero formal correctness guarantees when replication lag exceeds the sleep duration.",
      },
    ],
    "keyTakeaway": "Guarantee 'Read-Your-Own-Writes' in replica architectures by tracking the primary commit LSN/GTID in the user's session context and validating replica replay position before reading.",
  },
  {
    "id": "connection_pool_sizing_formula",
    "title": "Database Connection Pool Sizing Thrashing (HikariCP 1,000 Connections)",
    "difficulty": "Staff",
    "category": "performance",
    "categoryLabel": "Database Drivers & Streaming",
    "tableName": "pg_stat_activity",
    "rowCount": "1,000 concurrent active connections",
    "tableSizeDisk": "16-core CPU Database Server",
    "slowQuery": """-- 50 microservice instances each configured with maximumPoolSize = 20:
-- Total 1,000 connections established to a 16-core database!
SELECT order_id, status FROM orders WHERE user_id = 9812;""",
    "initialCost": 8.4,
    "initialLatencyMs": 420.0,
    "initialPlanSummary": "OS Kernel context-switch storm: 16 physical CPU cores thrashing across 1,000 PostgreSQL worker processes. CPU spent on context switching > 70%!",
    "businessContext": "During traffic spikes, query latency degrades from 1ms to 420ms. Developers increased HikariCP pool size from 10 to 50 connections per pod, which paradoxically made query performance 10x worse.",
    "strategies": [
      {
        "id": "strat_hikaricp_formula_optimal",
        "title": "Apply HikariCP Pool Sizing Formula ((core_count * 2) + effective_spindle_count) & Add PgBouncer",
        "sqlCommand": """-- For a 16-core database with NVMe SSDs:
-- Pool Size = (16 * 2) + 1 = 33 connections!

-- Deploy PgBouncer in transaction pooling mode:
-- pgbouncer.ini:
-- pool_mode = transaction
-- max_client_conn = 5000
-- default_pool_size = 33

-- In Spring Boot application.yml:
-- hikari.maximum-pool-size: 10""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "CPU context switches drop by 95% -> 33 active workers execute in parallel without CPU starvation",
        "engineExplanation": "Winner! A CPU core can execute only ONE instruction thread at any instant. Running 1,000 PostgreSQL processes on 16 cores forces the Linux kernel into non-stop context switching and cache thrashing. The proven PostgreSQL/HikariCP formula is: connections = ((core_count * 2) + effective_spindle_count). Placing PgBouncer in transaction mode buffers thousands of incoming clients into a lean 33-connection pipeline.",
      },
      {
        "id": "strat_increase_pool_to_5000",
        "title": "Increase database max_connections to 5,000",
        "sqlCommand": "ALTER SYSTEM SET max_connections = 5000;",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1200.0,
        "executionPlanSummary": "PostgreSQL allocates 10 MB per connection -> 50 GB RAM wasted on idle connection overhead, triggering Linux OOM killer",
        "engineExplanation": "PostgreSQL uses process-based concurrency (forked processes). Allocating thousands of connections exhausts RAM and causes out-of-memory kernel kills.",
      },
      {
        "id": "strat_disable_connection_pooling",
        "title": "Disable connection pooling and open fresh TCP connections per HTTP request",
        "sqlCommand": "-- Remove HikariCP; connect via plain DriverManager",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 85.0,
        "executionPlanSummary": "TCP 3-way handshake + TLS negotiation + PostgreSQL fork overhead on every query destroys latency",
        "engineExplanation": "Establishing a raw PostgreSQL connection requires forking a backend process and TLS handshaking, adding 50-100ms overhead to every single query.",
      },
    ],
    "keyTakeaway": "More database connections does NOT equal more speed. Formula: connections = ((cores * 2) + spindles). Use PgBouncer transaction pooling to handle thousands of application clients with a lean backend pool.",
  },
  {
    "id": "postgresql_jit_compilation_oltp_degradation",
    "title": "PostgreSQL LLVM JIT Compilation Latency Degrading Fast OLTP Queries",
    "difficulty": "Staff",
    "category": "performance",
    "categoryLabel": "Query Optimizer & Statistics",
    "tableName": "order_items",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "4.8 GB on disk",
    "slowQuery": """SELECT SUM(quantity * unit_price) 
FROM order_items 
WHERE order_id = 45812;""",
    "initialCost": 125000,
    "initialLatencyMs": 18.5,
    "initialPlanSummary": "JIT: Functions: 2, Options: Inlining true, Optimization true, Expressions true. JIT generation: 1.8ms, Inlining: 3.2ms, Optimization: 11.5ms, Emission: 1.8ms (Total JIT time: 18.3ms! Execution time: 0.2ms!)",
    "businessContext": "High-volume checkout API experiences unexpected 18ms latency on small order line aggregations. Profiling shows 99% of query time is spent by the LLVM compiler generating machine code rather than executing the query!",
    "strategies": [
      {
        "id": "strat_disable_jit_oltp_optimal",
        "title": "Disable JIT for OLTP Workloads (jit = off) or Raise jit_above_cost",
        "sqlCommand": """-- For OLTP database clusters:
ALTER SYSTEM SET jit = off;
SELECT pg_reload_conf();

-- Or raise the JIT compilation cost threshold from default 100,000 to 1,000,000:
-- ALTER SYSTEM SET jit_above_cost = 1000000;""",
        "isOptimal": True,
        "resultingCost": 125000,
        "resultingLatencyMs": 0.25,
        "executionPlanSummary": "Query executes via interpreted tuple evaluation in 0.25ms without LLVM compilation delay",
        "engineExplanation": "Winner! PostgreSQL 11+ enables LLVM Just-In-Time (JIT) compilation by default. While JIT accelerates long-running analytical queries (OLAP) processing billions of rows, the 15-20ms overhead of compiling LLVM bytecode is disastrous for short OLTP queries that only take 0.2ms to execute! Disabling JIT or raising jit_above_cost brings latency down to sub-millisecond speeds.",
      },
      {
        "id": "strat_increase_jit_optimization",
        "title": "Enable LLVM aggressive optimization flags",
        "sqlCommand": "SET jit_optimize_above_cost = 0;",
        "isOptimal": False,
        "resultingCost": 125000,
        "resultingLatencyMs": 45.0,
        "executionPlanSummary": "LLVM optimization time increases from 11ms to 38ms, worsening response latency",
        "engineExplanation": "Instructing LLVM to perform deeper compiler passes increases compilation time without speeding up a query that scans only 5 order rows.",
      },
      {
        "id": "strat_rewrite_as_stored_procedure",
        "title": "Convert the query into a PL/pgSQL stored function",
        "sqlCommand": "CREATE FUNCTION calculate_order_total(int) ...",
        "isOptimal": False,
        "resultingCost": 125000,
        "resultingLatencyMs": 18.2,
        "executionPlanSummary": "JIT compilation still triggers inside PL/pgSQL for statements exceeding jit_above_cost",
        "engineExplanation": "Wrapping SQL in stored procedures does not disable LLVM JIT compilation for statements meeting the cost threshold.",
      },
    ],
    "keyTakeaway": "PostgreSQL LLVM JIT compilation introduces a 10-25ms compilation overhead. For OLTP databases dominated by short queries, disable JIT (jit = off) or elevate jit_above_cost.",
  },
  {
    "id": "zero_downtime_column_type_widening",
    "title": "Zero-Downtime Column Type Widening (INT to BIGINT on 500M Rows)",
    "difficulty": "Staff",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "transactions",
    "rowCount": "500,000,000 rows",
    "tableSizeDisk": "85 GB on disk",
    "slowQuery": """-- Transaction ID sequence approaching 2,147,483,647 (INT overflow!):
ALTER TABLE transactions ALTER COLUMN transaction_id TYPE BIGINT;
-- Table freezes under AccessExclusiveLock for 4 hours!""",
    "initialCost": 5000000,
    "initialLatencyMs": 14400000,
    "initialPlanSummary": "AccessExclusiveLock held -> Full table rewrite rewriting all 500M tuples on disk, halting all production traffic",
    "businessContext": "Core transaction ID column is 2 weeks away from overflowing the 32-bit signed integer limit (2.14B). Running direct ALTER TABLE would require taking the entire banking app offline for 4 hours.",
    "strategies": [
      {
        "id": "strat_dual_column_shadow_migration_optimal",
        "title": "Dual-Column Shadow Write Migration (Additive Column + Backfill + Dual Writes + Atomic Swap)",
        "sqlCommand": """-- Phase 1: Add shadow column (instant metadata-only change in Postgres/MySQL 8):
ALTER TABLE transactions ADD COLUMN transaction_id_bigint BIGINT;

-- Phase 2: Create trigger / dual write in app for new writes:
CREATE OR REPLACE FUNCTION sync_tx_id() RETURNS TRIGGER AS $$
BEGIN
  NEW.transaction_id_bigint = NEW.transaction_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_sync_tx_id BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION sync_tx_id();

-- Phase 3: Background chunked backfill of historical rows:
-- UPDATE transactions SET transaction_id_bigint = transaction_id WHERE id BETWEEN X AND Y;

-- Phase 4: Atomic cutover in microsecond lock window!""",
        "isOptimal": True,
        "resultingCost": 45.0,
        "resultingLatencyMs": 2.5,
        "executionPlanSummary": "Zero downtime achieved -> 100% production uptime maintained throughout 500M row migration",
        "engineExplanation": "Winner! Changing column types between incompatible binary widths (INT 4 bytes to BIGINT 8 bytes) requires physically rewriting every single disk page and index tuple. A direct ALTER TABLE locks the table exclusively. The shadow column migration pattern decouples the rewrite into an asynchronous backfill while live traffic continues uninterrupted.",
      },
      {
        "id": "strat_maintenance_window_alter",
        "title": "Schedule a 4-hour weekend maintenance downtime window",
        "sqlCommand": "ALTER TABLE transactions ALTER COLUMN transaction_id TYPE BIGINT;",
        "isOptimal": False,
        "resultingCost": 5000000,
        "resultingLatencyMs": 14400000,
        "executionPlanSummary": "Complete business outage, SLA violations, and customer service disruption for 4 hours",
        "engineExplanation": "Downtime maintenance windows damage customer trust and violate modern 99.99% high-availability enterprise SLAs.",
      },
      {
        "id": "strat_cast_in_view",
        "title": "Create a View casting transaction_id::BIGINT",
        "sqlCommand": "CREATE VIEW v_transactions AS SELECT transaction_id::BIGINT FROM transactions;",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Does not solve sequence overflow: nextval() will still fail with 'integer out of range' at 2,147,483,648",
        "engineExplanation": "Casting in a view does not change the physical column type or sequence limits; the sequence will still overflow and crash all future inserts.",
      },
    ],
    "keyTakeaway": "Widening column types (INT to BIGINT) requires a full table rewrite. Achieve zero downtime using the shadow column pattern: add new column, dual-write, background chunked backfill, and cut over atomically.",
  },
  {
    "id": "distributed_lock_fencing_token_gc_pause",
    "title": "Distributed Lock Expiration During JVM GC Pause & Lack of Fencing Tokens",
    "difficulty": "Staff",
    "category": "distributed",
    "categoryLabel": "Distributed Systems & Architecture",
    "tableName": "shared_storage / invoices",
    "rowCount": "Distributed microservice workers",
    "tableSizeDisk": "Shared database / object store",
    "slowQuery": """-- Client 1 acquires Redis lock with 10s TTL:
SET lock:invoice:42 token_abc NX PX 10000;
-- Client 1 enters major Stop-The-World (STW) JVM Garbage Collection pause for 15 seconds!
-- TTL expires! Client 2 acquires the lock:
SET lock:invoice:42 token_xyz NX PX 10000;
-- Client 1 wakes up from GC and proceeds to write, overwriting Client 2!""",
    "initialCost": 1.0,
    "initialLatencyMs": 15000,
    "initialPlanSummary": "Split-brain race condition: Both Client 1 and Client 2 believe they hold the lock, producing silent financial ledger corruption",
    "businessContext": "Automated billing engine issues duplicate customer invoices and double-refunds accounts because distributed locks expire during JVM GC pauses or cloud network hiccups.",
    "strategies": [
      {
        "id": "strat_fencing_tokens_optimal",
        "title": "Enforce Monotonically Increasing Fencing Tokens at the Database Storage Layer",
        "sqlCommand": """-- 1. Lock service (Zookeeper / etcd / Redis Redlock) returns a monotonic fencing token:
-- Client 1 gets token = 31; Client 2 gets token = 32

-- 2. Database enforces fencing validation on every write:
UPDATE invoices 
SET status = 'PROCESSED', processed_by = 'client_1', last_fencing_token = 31
WHERE invoice_id = 42 AND last_fencing_token < 31;

-- If Client 1 executes after Client 2 (token 32), the write is rejected (0 rows updated)!""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Storage-level fencing token check rejects stale zombie writes, eliminating split-brain corruption",
        "engineExplanation": "Winner! As Martin Kleppmann proved, distributed locks based on timeouts (Redis TTL) CANNOT guarantee mutual exclusion in asynchronous networks subject to GC pauses, thread descheduling, or network delays. You must validate a monotonically increasing fencing token at the target storage layer (e.g. 'WHERE last_fencing_token < :token') to reject writes from zombie processes.",
      },
      {
        "id": "strat_increase_redis_ttl_to_10_minutes",
        "title": "Increase Redis lock TTL from 10 seconds to 600 seconds",
        "sqlCommand": "SET lock:invoice:42 token NX PX 600000",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "If a worker crashes, the resource remains frozen and locked for 10 minutes, destroying system availability",
        "engineExplanation": "Lengthening TTLs creates massive availability outages when workers crash, while still failing if a delay exceeds the longer TTL.",
      },
      {
        "id": "strat_use_zgc_garbage_collector",
        "title": "Switch JVM to ZGC (-XX:+UseZGC) and assume pauses never occur",
        "sqlCommand": "java -XX:+UseZGC -jar app.jar",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Reduces GC pause times but does not prevent hypervisor CPU steals, VM migration pauses, or network delays",
        "engineExplanation": "Low-pause collectors like ZGC reduce GC pauses but cannot eliminate operating system paging, hypervisor virtualization pauses, or network partitions.",
      },
    ],
    "keyTakeaway": "Distributed locks with timeouts cannot guarantee safety across GC pauses or network delays. Always enforce monotonic fencing tokens at the database storage layer to reject stale zombie writes.",
  },
  {
    "id": "replica_promotion_split_brain_fencing",
    "title": "Automated Replica Failover Split-Brain & Dual Primary Data Corruption",
    "difficulty": "Staff",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "cluster_metadata / customer_ledger",
    "rowCount": "HA Primary + 2 Standbys",
    "tableSizeDisk": "Multi-node PostgreSQL cluster",
    "slowQuery": """-- Transient 5-second network partition separates Node A (Primary) from Node B (Replica):
-- Failover orchestrator declares Node A dead and promotes Node B to Primary!
-- Network heals: Both Node A and Node B are now accepting writes with divergent timelines!""",
    "initialCost": 1000000,
    "initialLatencyMs": 5000,
    "initialPlanSummary": "Split-brain divergence: Node A writes LSN 0/2000000 while Node B writes different transactions at LSN 0/2000000. Data diverges irreversibly!",
    "businessContext": "High-availability database cluster suffers transient network blip. Automated failover promotes a replica while the old primary is still alive. Both accept writes, resulting in divergent databases that cannot be merged without manual reconciliation.",
    "strategies": [
      {
        "id": "strat_patroni_etcd_dcs_fencing_optimal",
        "title": "Deploy Distributed Consensus DCS (Patroni + etcd) with Watchdog Fencing (STONITH)",
        "sqlCommand": """-- Configure Patroni with etcd DCS and Linux hardware watchdog:
-- patroni.yml:
# dcs:
#   ttl: 30
#   loop_wait: 10
#   retry_timeout: 10
# watchdog:
#   mode: automatic
#   device: /dev/watchdog

-- If Primary cannot renew its etcd DCS leader lease within TTL,
-- the kernel watchdog hardware resets the machine instantly (STONITH)!""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Hardware watchdog terminates zombie primary before replica is promoted, mathematically preventing split-brain",
        "engineExplanation": "Winner! High-availability failover without robust fencing guarantees data divergence. Patroni integrates with a Distributed Consensus Store (etcd/Consul) via leader lease locks, backed by Linux /dev/watchdog. If the primary loses contact with the DCS quorum, the hardware watchdog hard-resets the node (Shoot The Other Node In The Head - STONITH) before a new leader can accept writes.",
      },
      {
        "id": "strat_custom_bash_ping_failover",
        "title": "Use custom Bash script that pings the primary and promotes replica if 3 pings fail",
        "sqlCommand": "if ! ping -c 3 master_ip; then pg_ctl promote; fi",
        "isOptimal": False,
        "resultingCost": 1000000,
        "resultingLatencyMs": 3000,
        "executionPlanSummary": "Guaranteed split-brain: Ping failures from transient packet loss promote replica while master remains active",
        "engineExplanation": "Homegrown ping-based failover scripts are the number one cause of split-brain catastrophes in production databases.",
      },
      {
        "id": "strat_manual_failover_only",
        "title": "Disable automated failover entirely; require human DBA manual promotion",
        "sqlCommand": "-- No failover tooling",
        "isOptimal": False,
        "resultingCost": 1000000,
        "resultingLatencyMs": 1800000,
        "executionPlanSummary": "30 to 60 minutes downtime during real hardware crashes waiting for on-call DBA to wake up",
        "engineExplanation": "Manual failover avoids split-brain but blows through MTTR SLAs, turning a 30-second failover into an hour-long outage.",
      },
    ],
    "keyTakeaway": "Automated failover without strict node fencing (STONITH / DCS leader leases like Patroni + etcd) inevitably leads to dual-primary split-brain and permanent data divergence.",
  },
  {
    "id": "read_committed_snapshot_isolation_anomalies",
    "title": "Write Skew Anomaly Under Snapshot Isolation (The Two Doctors On-Call)",
    "difficulty": "Staff",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "on_call_roster",
    "rowCount": "100 doctors",
    "tableSizeDisk": "15 MB on disk",
    "slowQuery": """-- Rule: At least ONE doctor must remain on call at all times!
-- Currently Dr. Alice and Dr. Bob are on call (count = 2).

-- Transaction 1 (Dr. Alice requests to leave):
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ; -- (Snapshot Isolation)
SELECT count(*) FROM on_call_roster WHERE is_on_call = true; -- Returns 2
UPDATE on_call_roster SET is_on_call = false WHERE doctor_id = 1;
COMMIT;

-- Concurrent Transaction 2 (Dr. Bob requests to leave simultaneously):
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM on_call_roster WHERE is_on_call = true; -- Returns 2
UPDATE on_call_roster SET is_on_call = false WHERE doctor_id = 2;
COMMIT;
-- Both commit successfully! 0 doctors remain on call! Rule violated!""",
    "initialCost": 8.4,
    "initialLatencyMs": 1.2,
    "initialPlanSummary": "Write Skew: Both transactions read consistent snapshots and update non-overlapping rows, satisfying Snapshot Isolation but violating business invariants!",
    "businessContext": "Hospital scheduling and financial allocation systems under REPEATABLE READ isolation suffer state corruption because Snapshot Isolation does not prevent Write Skew anomalies.",
    "strategies": [
      {
        "id": "strat_pessimistic_for_update_or_serializable_optimal",
        "title": "Use SELECT FOR UPDATE Lock or Upgrade to SERIALIZABLE Isolation",
        "sqlCommand": """-- Approach A: Explicit row-level lock on the hospital constraint:
BEGIN;
SELECT count(*) FROM on_call_roster WHERE is_on_call = true FOR UPDATE;
-- Locks all matching rows, serializing both transactions!
UPDATE on_call_roster SET is_on_call = false WHERE doctor_id = 1;
COMMIT;

-- Approach B: True Serializable Isolation:
-- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.5,
        "executionPlanSummary": "LockRows prevents concurrent mutation -> Second transaction re-checks count and aborts with validation error",
        "engineExplanation": "Winner! Write Skew occurs when two transactions read overlapping datasets, but make updates to disjoint rows based on the snapshot they saw. Snapshot Isolation (REPEATABLE READ) prevents dirty reads, non-repeatable reads, and lost updates, but DOES NOT prevent Write Skew! You must either use explicit SELECT FOR UPDATE or full SERIALIZABLE isolation.",
      },
      {
        "id": "strat_rely_on_repeatable_read",
        "title": "Keep REPEATABLE READ and add an application if-statement check",
        "sqlCommand": "if (count >= 2) { update(); }",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Both application threads read count == 2 from their separate MVCC snapshots, reproducing the invariant violation",
        "engineExplanation": "Application-level checks read from their respective MVCC snapshots, meaning both threads see count == 2 and both proceed to leave.",
      },
      {
        "id": "strat_check_constraint_count",
        "title": "Add a SQL CHECK constraint: CHECK ((SELECT count(*) ...) >= 1)",
        "sqlCommand": "ALTER TABLE on_call_roster ADD CONSTRAINT chk_min_doctors CHECK (...);",
        "isOptimal": False,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "ERROR: subqueries are not allowed in CHECK constraints",
        "engineExplanation": "SQL engines disallow subqueries in standard table CHECK constraints because constraints must evaluate on a single row.",
      },
    ],
    "keyTakeaway": "Snapshot Isolation (REPEATABLE READ) does not prevent Write Skew anomalies. Enforce cross-row invariants using explicit SELECT FOR UPDATE locking or SERIALIZABLE isolation.",
  },
  {
    "id": "semi_consistent_read_innodb_concurrency",
    "title": "MySQL Semi-Consistent Read Under READ COMMITTED Isolation",
    "difficulty": "Staff",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "subscriptions",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.5 GB on disk",
    "slowQuery": """-- Session 1 updates a row and holds exclusive lock:
BEGIN;
UPDATE subscriptions SET status = 'EXPIRED' WHERE user_id = 500;
-- Does not commit yet...

-- Session 2 runs broad update on non-indexed column under READ COMMITTED:
UPDATE subscriptions SET notification_sent = true WHERE email_domain = 'gmail.com';""",
    "initialCost": 350000,
    "initialLatencyMs": 12000,
    "initialPlanSummary": "Table Scan -> In REPEATABLE READ: Blocks on user_id=500 and fails with Lock wait timeout. In READ COMMITTED: Semi-Consistent Read evaluates latest committed version!",
    "businessContext": "Large batch notification update on a table with active OLTP modifications freezes due to lock wait timeouts under REPEATABLE READ, but completes smoothly under READ COMMITTED.",
    "strategies": [
      {
        "id": "strat_index_and_semi_consistent_optimal",
        "title": "Index Filter Column & Leverage READ COMMITTED Semi-Consistent Reads",
        "sqlCommand": """-- 1. Add index so update does not scan and lock every record:
CREATE INDEX idx_subs_domain ON subscriptions(email_domain);

-- 2. Use READ COMMITTED isolation:
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
UPDATE subscriptions SET notification_sent = true WHERE email_domain = 'gmail.com';""",
        "isOptimal": True,
        "resultingCost": 45.0,
        "resultingLatencyMs": 3.2,
        "executionPlanSummary": "Index Range Scan -> Locks only exact matching rows; non-matching rows are immediately released",
        "engineExplanation": "Winner! In MySQL InnoDB under READ COMMITTED, a 'Semi-Consistent Read' occurs during UPDATE: if a scanned row is locked by another transaction, InnoDB reads its latest committed snapshot from undo log to test whether the row matches the WHERE clause. If it does not match, InnoDB moves on without waiting for the lock! Adding an index avoids table scans entirely.",
      },
      {
        "id": "strat_lock_wait_timeout_increase",
        "title": "Increase innodb_lock_wait_timeout to 600s",
        "sqlCommand": "SET innodb_lock_wait_timeout = 600;",
        "isOptimal": False,
        "resultingCost": 350000,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "Transactions wait 10 minutes for lock resolution, blocking all other DML on subscriptions",
        "engineExplanation": "Increasing lock timeout causes threads to pile up and wait for minutes, degrading overall database responsiveness.",
      },
      {
        "id": "strat_lock_table_write",
        "title": "Acquire LOCK TABLES subscriptions WRITE before updating",
        "sqlCommand": "LOCK TABLES subscriptions WRITE; UPDATE subscriptions ...; UNLOCK TABLES;",
        "isOptimal": False,
        "resultingCost": 350000,
        "resultingLatencyMs": 15000,
        "executionPlanSummary": "Exclusive table lock completely halts all user logins and API queries for 15 seconds",
        "engineExplanation": "LOCK TABLES WRITE halts the entire application by blocking all reads and writes across the entire table.",
      },
    ],
    "keyTakeaway": "In MySQL InnoDB READ COMMITTED mode, Semi-Consistent Reads evaluate committed versions of locked rows to check WHERE conditions, bypassing unnecessary lock waits on non-matching records.",
  },
  {
    "id": "bloom_filter_index_ad_hoc_olap",
    "title": "Multi-Dimensional Ad-Hoc Filtering via PostgreSQL Bloom Filter Index",
    "difficulty": "Staff",
    "category": "indexing",
    "categoryLabel": "Specialized Index Types",
    "tableName": "ecommerce_catalog",
    "rowCount": "50,000,000 products",
    "tableSizeDisk": "18 GB table / 15 separate B-Tree indexes (45 GB!)",
    "slowQuery": """-- Ad-hoc search filtering any arbitrary combination of 8 product attributes:
SELECT product_id, title, price 
FROM ecommerce_catalog
WHERE brand_id = 42 
  AND category_id = 10 
  AND color = 'blue' 
  AND size = 'XL';""",
    "initialCost": 85000,
    "initialLatencyMs": 1400,
    "initialPlanSummary": "BitmapAnd -> Merges 4 separate B-Tree indexes, burning 350 MB RAM in work_mem and high disk random reads",
    "businessContext": "Product catalog with 15 searchable attributes. Creating separate B-Tree indexes for every possible column combination causes massive 45 GB index bloat, destroying write performance.",
    "strategies": [
      {
        "id": "strat_bloom_index_optimal",
        "title": "Deploy pg_bloom Extension Index for Multi-Column Ad-Hoc Equality Queries",
        "sqlCommand": """CREATE EXTENSION IF NOT EXISTS bloom;

CREATE INDEX idx_catalog_bloom ON ecommerce_catalog USING bloom (
  brand_id, category_id, color, size, material, season, gender
) WITH (length = 80, col1 = 4, col2 = 4, col3 = 4, col4 = 4);""",
        "isOptimal": True,
        "resultingCost": 420.0,
        "resultingLatencyMs": 18.0,
        "executionPlanSummary": "Bitmap Heap Scan -> Bitmap Index Scan on idx_catalog_bloom (Single 1.2 GB index serves all combinations!)",
        "engineExplanation": "Winner! Standard B-Tree composite indexes require queries to filter by the leading prefix column. To cover all combinations of 8 columns requires dozens of indexes (tens of gigabytes). A Bloom filter index creates signature bitmasks across all columns. A single 1.2 GB Bloom index answers queries filtering on ANY subset of columns with zero prefix restrictions.",
      },
      {
        "id": "strat_15_composite_btrees",
        "title": "Create 15 additional composite B-Tree indexes covering every permutation",
        "sqlCommand": "CREATE INDEX idx_comb1 ON ...; CREATE INDEX idx_comb2 ON ...;",
        "isOptimal": False,
        "resultingCost": 350.0,
        "resultingLatencyMs": 12.0,
        "executionPlanSummary": "Index storage swells to 90 GB (5x table size), slowing INSERT and UPDATE operations to a crawl",
        "engineExplanation": "Maintaining dozens of B-Tree indexes inflicts severe write amplification and consumes dozens of gigabytes of valuable buffer pool RAM.",
      },
      {
        "id": "strat_gin_jsonb_conversion",
        "title": "Convert all columns into a single JSONB document with GIN index",
        "sqlCommand": "ALTER TABLE ecommerce_catalog ADD COLUMN attributes JSONB; CREATE INDEX idx_gin ON ecommerce_catalog USING GIN(attributes);",
        "isOptimal": False,
        "resultingCost": 1200.0,
        "resultingLatencyMs": 95.0,
        "executionPlanSummary": "GIN index on 50M JSONB rows consumes 28 GB, with high write update costs",
        "engineExplanation": "GIN indexes on large tables have significant update overhead and large disk footprints compared to Bloom indexes for equality attributes.",
      },
    ],
    "keyTakeaway": "For tables with many arbitrary equality filter combinations, PostgreSQL Bloom indexes (pg_bloom) provide compact, multi-column search capability in a fraction of the space of dozens of B-Trees.",
  },
  {
    "id": "lsm_tree_vs_btree_write_amplification",
    "title": "LSM-Tree Write Amplification & Compaction Stalls Under Ingestion Spikes",
    "difficulty": "Staff",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "sensor_ingest (RocksDB / CockroachDB LSM-Tree)",
    "rowCount": "1,000,000,000 rows",
    "tableSizeDisk": "250 GB on disk",
    "slowQuery": """-- High-frequency batch ingest (50,000 writes/sec):
INSERT INTO sensor_ingest (sensor_id, ts, metric_value) VALUES (...);
-- Ingestion suddenly freezes! Latency spikes from 0.8ms to 3,500ms!""",
    "initialCost": 1.0,
    "initialLatencyMs": 3500,
    "initialPlanSummary": "Compaction Stall: MemTable write buffer full; Level 0 file count (L0) exceeds max threshold; RocksDB throttles/pauses all incoming writes!",
    "businessContext": "High-throughput metric ingestion engine using an LSM-tree storage engine (RocksDB/Cassandra/CockroachDB). Under sustained write bursts, the database freezes periodically due to cascading compaction stalls.",
    "strategies": [
      {
        "id": "strat_tune_lsm_compaction_optimal",
        "title": "Tune L0 Compaction Triggers, Increase MemTable Threads & Set Dynamic Level Base Size",
        "sqlCommand": """-- RocksDB / CockroachDB LSM tuning configuration:
-- Increase L0 file limit before stalling:
level0_slowdown_writes_trigger = 32; -- Default 20
level0_stop_writes_trigger = 64;     -- Default 36

-- Increase background compaction concurrency:
max_background_jobs = 8;             -- Dedicate 8 CPU cores to background flush/compaction
write_buffer_size = 134217728;       -- 128 MB MemTable
max_write_buffer_number = 6;         -- Allow up to 6 memtables in RAM before backpressure""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Compaction throughput matches ingestion rate, completely eliminating write stalls",
        "engineExplanation": "Winner! In an LSM-tree (Log-Structured Merge-tree), writes are appended to an in-memory MemTable and flushed to Level 0 SST files. If background compaction workers cannot merge L0 files into Level 1 fast enough, L0 files accumulate. When level0_stop_writes_trigger is reached, the engine deliberately halts incoming writes! Allocating more compaction threads and raising L0 thresholds prevents write stalls.",
      },
      {
        "id": "strat_disable_wal_lsm",
        "title": "Disable Write-Ahead Log with disableWAL = true",
        "sqlCommand": "-- Set writeOptions.disableWAL = true",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "CRITICAL RISK: Any power loss or process crash permanently destroys all unflushed MemTable data in RAM",
        "engineExplanation": "Disabling the WAL speeds up writes but sacrifices durability: uncompacted data in memory is permanently lost upon crash.",
      },
      {
        "id": "strat_switch_to_unindexed_heap",
        "title": "Switch to an un-indexed append-only CSV file",
        "sqlCommand": "-- Append to /var/log/sensor.csv",
        "isOptimal": False,
        "resultingCost": 1000000,
        "resultingLatencyMs": 45000,
        "executionPlanSummary": "High write speed but reading/aggregating metrics requires scanning gigabytes of flat text files",
        "engineExplanation": "Dumping to flat CSV eliminates indexing during ingestion but destroys analytical query performance.",
      },
    ],
    "keyTakeaway": "LSM-Tree storage engines trade background compaction CPU/IO for ultra-fast writes. To prevent write compaction stalls, tune level0_stop_writes_trigger and dedicate sufficient background compaction threads.",
  },
  {
    "id": "kernel_aio_direct_io_bypass",
    "title": "Linux OS Page Cache Double-Buffering & Direct I/O (O_DIRECT) Bypass",
    "difficulty": "Staff",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "innodb_data_file (ibdata1 / *.ibd)",
    "rowCount": "Production Enterprise Database",
    "tableSizeDisk": "500 GB on NVMe SSD array",
    "slowQuery": """-- System memory profile under heavy mixed OLTP workload:
-- 64 GB RAM allocated to InnoDB Buffer Pool
-- 60 GB RAM consumed by Linux OS Page Cache (Dirty pages cached twice!)
-- System enters Linux kswapd swap thrashing, query latency spikes 50x!""",
    "initialCost": 100000,
    "initialLatencyMs": 280,
    "initialPlanSummary": "Double-Buffering Memory Contention: Pages cached in InnoDB Buffer Pool AND in Linux Kernel Page Cache simultaneously, triggering swapping",
    "businessContext": "Database host with 128 GB RAM begins swapping to disk even though the InnoDB buffer pool is configured for only 64 GB. The operating system kernel caches the same data pages twice, starving application processes of RAM.",
    "strategies": [
      {
        "id": "strat_enable_o_direct_optimal",
        "title": "Configure innodb_flush_method = O_DIRECT (or O_DIRECT_NO_FSYNC)",
        "sqlCommand": """-- In my.cnf / MySQL configuration:
[mysqld]
innodb_flush_method = O_DIRECT

-- In modern Linux kernels on NVMe SSDs:
-- Bypasses the OS page cache for data files, eliminating double buffering!
-- In PostgreSQL: use pg_prewarm and leave shared_buffers at 25% if relying on OS cache,
-- or use direct I/O extensions where supported.""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "OS page cache double buffering eliminated -> 60 GB RAM returned to OS, swap usage drops to 0%",
        "engineExplanation": "Winner! By default on Linux (fsync flush method), writes go to the OS page cache before being flushed to disk. This causes 'double-buffering': data pages reside simultaneously in the database buffer pool and the Linux kernel cache! Setting innodb_flush_method = O_DIRECT tells the OS to bypass the kernel page cache and write directly between database buffers and disk hardware, freeing gigabytes of memory and eliminating swap thrashing.",
      },
      {
        "id": "strat_increase_swap_space",
        "title": "Allocate a 128 GB swapfile on NVMe SSD",
        "sqlCommand": "fallocate -l 128G /swapfile && mkswap /swapfile && swapon /swapfile",
        "isOptimal": False,
        "resultingCost": 100000,
        "resultingLatencyMs": 250,
        "executionPlanSummary": "Allows swapping without crashing, but SSD swapping still incurs 100x latency penalty compared to RAM",
        "engineExplanation": "Increasing swap mask memory starvation while keeping queries painfully slow as pages are constantly swapped in and out of disk.",
      },
      {
        "id": "strat_reduce_buffer_pool_to_16gb",
        "title": "Shrink innodb_buffer_pool_size to 16GB",
        "sqlCommand": "SET GLOBAL innodb_buffer_pool_size = 17179869184;",
        "isOptimal": False,
        "resultingCost": 450000,
        "resultingLatencyMs": 95.0,
        "executionPlanSummary": "Buffer pool hit ratio drops from 99% to 75%, forcing massive disk read I/O for standard queries",
        "engineExplanation": "Shrinking the buffer pool starves the database of working memory, causing cache misses and spiking query latency across the entire system.",
      },
    ],
    "keyTakeaway": "Database engines manage their own memory buffers. Configure innodb_flush_method = O_DIRECT to bypass the operating system page cache and prevent double-buffering memory exhaustion.",
  },
]
