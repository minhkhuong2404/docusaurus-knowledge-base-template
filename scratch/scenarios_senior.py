# Senior Scenarios (Scenarios 73 to 97: 25 scenarios)

SENIOR_SCENARIOS = [
  {
    "id": "select_for_update_skip_locked_queue",
    "title": "Job Queue Starvation & Deadlocks Under Concurrent Workers",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "task_queue",
    "rowCount": "1,500,000 pending tasks",
    "tableSizeDisk": "850 MB on disk",
    "slowQuery": """-- 50 worker threads executing simultaneously:
SELECT task_id, payload, retry_count
FROM task_queue
WHERE status = 'PENDING'
ORDER BY priority DESC, created_at ASC
LIMIT 10
FOR UPDATE;""",
    "initialCost": 32000,
    "initialLatencyMs": 4800,
    "initialPlanSummary": "LockRows -> Sort -> Index Scan on idx_status_prio (Contention: 49 threads blocked on same row locks)",
    "businessContext": "Background processing pipeline with 50 worker pods processing payments. Worker throughput degrades from 10,000 tasks/min to 80 tasks/min due to massive row-lock queues.",
    "strategies": [
      {
        "id": "strat_skip_locked_optimal",
        "title": "Use FOR UPDATE SKIP LOCKED with Partial Composite Index",
        "sqlCommand": """CREATE INDEX idx_queue_pending ON task_queue(priority DESC, created_at ASC)
WHERE status = 'PENDING';

SELECT task_id, payload, retry_count
FROM task_queue
WHERE status = 'PENDING'
ORDER BY priority DESC, created_at ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Limit -> LockRows (Skip Locked) -> Index Scan on idx_queue_pending (Zero lock waiting)",
        "engineExplanation": "Winner! FOR UPDATE SKIP LOCKED tells the storage engine to immediately bypass any rows currently locked by other transactions instead of waiting. Combined with a partial index matching the PENDING filter, all 50 workers grab independent batches concurrently without lock queue delays.",
      },
      {
        "id": "strat_increase_lock_timeout",
        "title": "Increase lock_timeout to 60s to prevent transaction failures",
        "sqlCommand": "SET lock_timeout = '60s'; SELECT ... FOR UPDATE;",
        "isOptimal": False,
        "resultingCost": 32000,
        "resultingLatencyMs": 12500,
        "executionPlanSummary": "LockRows -> Massive thread wait queues and thread pool exhaustion in application servers",
        "engineExplanation": "Disastrous! Increasing timeout doesn't reduce lock contention; it forces worker threads to sleep longer waiting on locks, exhausting the application HikariCP connection pool.",
      },
      {
        "id": "strat_random_order_limit",
        "title": "Add ORDER BY RANDOM() to distribute worker row selection",
        "sqlCommand": "SELECT task_id FROM task_queue WHERE status = 'PENDING' ORDER BY RANDOM() LIMIT 10 FOR UPDATE;",
        "isOptimal": False,
        "resultingCost": 185000,
        "resultingLatencyMs": 6200,
        "executionPlanSummary": "Seq Scan -> Sort on random() -> Full table scan and catastrophic CPU thrashing",
        "engineExplanation": "ORDER BY RANDOM() invalidates all indexes, forcing a sequential table scan of 1.5 million rows and in-memory sort on every single poll invocation.",
      },
    ],
    "keyTakeaway": "In high-throughput database-backed job queues, plain SELECT FOR UPDATE causes serialization bottlenecks. Always use FOR UPDATE SKIP LOCKED paired with a partial index on status = 'PENDING'.",
  },
  {
    "id": "select_for_update_nowait_bank",
    "title": "Bank Account Balance Deadlock Cascade During Double-Spend",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "bank_accounts",
    "rowCount": "20,000,000 accounts",
    "tableSizeDisk": "3.8 GB on disk",
    "slowQuery": """-- Core banking ledger transfer between Account A (id=101) and Account B (id=202):
BEGIN;
SELECT balance FROM bank_accounts WHERE account_id = 101 FOR UPDATE;
-- Concurrent tx running transfer from 202 to 101 locks 202 then waits for 101!
SELECT balance FROM bank_accounts WHERE account_id = 202 FOR UPDATE;""",
    "initialCost": 8.4,
    "initialLatencyMs": 1000,
    "initialPlanSummary": "LockRows -> Deadlock detected: Process 4125 waits on ExclusiveLock on tuple (0, 12); Process 4128 waits on (0, 18)",
    "businessContext": "Two peer-to-peer transfers between Alice and Bob occur within 5 milliseconds in opposite directions. Both transactions freeze and roll back with error 40P01 (deadlock detected).",
    "strategies": [
      {
        "id": "strat_ordered_locking_nowait_optimal",
        "title": "Deterministic Key Ordering with NOWAIT or Advisory Lock",
        "sqlCommand": """-- Enforce strict lock ordering: LEAST(id1, id2) followed by GREATEST(id1, id2):
SELECT account_id, balance 
FROM bank_accounts 
WHERE account_id IN (101, 202) 
ORDER BY account_id ASC 
FOR UPDATE NOWAIT;""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Index Scan on pk_bank_accounts -> LockRows in sorted order (Deadlock mathematically impossible)",
        "engineExplanation": "Winner! Deadlocks require a cyclic lock wait graph (A waits on B while B waits on A). By enforcing strict alphabetical/numerical lock acquisition order across all application code, cyclic dependency is impossible. NOWAIT ensures immediate fail-fast retry if another tx is modifying either account.",
      },
      {
        "id": "strat_disable_deadlock_detector",
        "title": "Disable deadlock_timeout to prevent error 40P01",
        "sqlCommand": "SET deadlock_timeout = '600s';",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "LockRows -> Permanent unmonitored hang until TCP socket timeout",
        "engineExplanation": "Deadlock detection is not the cause of the problem—it is the emergency brake! Lengthening deadlock_timeout causes transactions to freeze indefinitely until clients timeout.",
      },
      {
        "id": "strat_switch_read_uncommitted",
        "title": "Set Transaction Isolation Level to READ UNCOMMITTED",
        "sqlCommand": "SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT balance ...",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Unsafe Dirty Reads -> Balance corruption and double-spending vulnerability",
        "engineExplanation": "Catastrophic! Financial ledgers require strict ACID guarantees. READ UNCOMMITTED allows dirty reads and race conditions where money can be withdrawn simultaneously twice.",
      },
    ],
    "keyTakeaway": "Deadlocks between concurrent multi-row updates are prevented architecturally by sorting target primary keys before acquiring exclusive locks (e.g. ORDER BY id ASC FOR UPDATE).",
  },
  {
    "id": "gap_lock_insert_intention_deadlock",
    "title": "InnoDB Gap Lock and Insert Intention Deadlock on Missing Rows",
    "difficulty": "Senior",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "user_wallets",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "1.2 GB on disk",
    "slowQuery": """-- Transaction 1 (Thread A):
SELECT * FROM user_wallets WHERE user_id = 9999999 FOR UPDATE; -- Record does not exist!
INSERT INTO user_wallets (user_id, balance) VALUES (9999999, 100.00);

-- Concurrent Transaction 2 (Thread B):
SELECT * FROM user_wallets WHERE user_id = 9999998 FOR UPDATE; -- Record does not exist!
INSERT INTO user_wallets (user_id, balance) VALUES (9999998, 50.00);""",
    "initialCost": 12.0,
    "initialLatencyMs": 1500,
    "initialPlanSummary": "InnoDB Lock System: T1 holds GAP lock on (5000000, supremum). T2 holds GAP lock on same gap. Both request INSERT INTENTION lock -> DEADLOCK!",
    "businessContext": "User onboarding microservice creates initial wallet accounts. When users register in parallel, transactions deadlock and roll back with 'Deadlock found when trying to get lock; try restarting transaction'.",
    "strategies": [
      {
        "id": "strat_read_committed_or_upsert_optimal",
        "title": "Switch to READ COMMITTED Isolation & INSERT ... ON DUPLICATE KEY UPDATE",
        "sqlCommand": """-- 1. Use READ COMMITTED (Gap locks are disabled for simple searches):
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 2. Atomic UPSERT avoiding pre-checking SELECT FOR UPDATE:
INSERT INTO user_wallets (user_id, balance) VALUES (9999999, 100.00)
ON DUPLICATE KEY UPDATE updated_at = NOW();""",
        "isOptimal": True,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Insert on duplicate key -> Exclusive Record Lock (No Gap Lock, zero deadlock)",
        "engineExplanation": "Winner! In REPEATABLE READ, SELECT FOR UPDATE on a nonexistent key acquires a Gap Lock spanning to the next record. Two transactions can both hold overlapping Gap locks, but when both try to insert, each needs an Insert Intention lock blocked by the other's Gap lock! In READ COMMITTED, gap locks are disabled, and atomic UPSERT eliminates the race condition.",
      },
      {
        "id": "strat_add_sleep_retry",
        "title": "Wrap in application sleep and 10x retry loop",
        "sqlCommand": "-- Application Java/Go retry with Thread.sleep(500);",
        "isOptimal": False,
        "resultingCost": 12.0,
        "resultingLatencyMs": 3500,
        "executionPlanSummary": "Repeated gap lock collisions and elevated database connection count",
        "engineExplanation": "Retrying mask the symptom while compounding load. Under traffic spikes, retry loops amplify contention into a complete lock cascade.",
      },
      {
        "id": "strat_drop_unique_constraint",
        "title": "Drop the UNIQUE index on user_id to prevent locking",
        "sqlCommand": "ALTER TABLE user_wallets DROP INDEX uq_user_id;",
        "isOptimal": False,
        "resultingCost": 100.0,
        "resultingLatencyMs": 15.0,
        "executionPlanSummary": "Table scan without uniqueness verification -> Duplicate wallet creation",
        "engineExplanation": "Catastrophic! Dropping uniqueness allows duplicate wallets for the same user, corrupting core accounting records.",
      },
    ],
    "keyTakeaway": "In MySQL REPEATABLE READ, SELECT FOR UPDATE on missing rows generates Gap Locks. Two transactions can share a Gap Lock, but their subsequent INSERTs into that gap deadlock on Insert Intention locks. Use READ COMMITTED or atomic UPSERT.",
  },
  {
    "id": "brin_index_telemetry_timeseries",
    "title": "B-Tree Bloat vs BRIN Index for 500M Row Time-Series Telemetry",
    "difficulty": "Senior",
    "category": "indexing",
    "categoryLabel": "Specialized Index Types",
    "tableName": "device_telemetry",
    "rowCount": "500,000,000 rows",
    "tableSizeDisk": "65 GB table / 22 GB B-Tree Index",
    "slowQuery": """SELECT device_id, AVG(cpu_temperature), MAX(memory_usage)
FROM device_telemetry
WHERE recorded_at >= '2026-03-01 00:00:00' 
  AND recorded_at < '2026-03-02 00:00:00'
GROUP BY device_id;""",
    "initialCost": 850000,
    "initialLatencyMs": 4200,
    "initialPlanSummary": "Bitmap Heap Scan -> Bitmap Index Scan on idx_recorded_at_btree (22 GB index exceeds RAM cache, massive random NVMe reads)",
    "businessContext": "IoT device telemetry database receives 10,000 events/sec. The B-Tree index on recorded_at has swollen to 22 GB, blowing out the buffer pool and causing severe write amplification.",
    "strategies": [
      {
        "id": "strat_brin_index_optimal",
        "title": "Replace B-Tree with BRIN (Block Range Index) on recorded_at",
        "sqlCommand": """DROP INDEX idx_recorded_at_btree;
CREATE INDEX idx_telemetry_recorded_at_brin 
ON device_telemetry USING BRIN (recorded_at) 
WITH (pages_per_range = 128);""",
        "isOptimal": True,
        "resultingCost": 42000,
        "resultingLatencyMs": 180,
        "executionPlanSummary": "Bitmap Heap Scan -> Bitmap Index Scan on idx_telemetry_recorded_at_brin (Index size: 1.8 MB vs 22 GB!)",
        "engineExplanation": "Winner! Time-series data is naturally appended sequentially, resulting in near-perfect physical correlation between disk pages and recorded_at timestamps. BRIN stores only min/max values per 128 pages. The index drops from 22 GB to 1.8 MB (99.9% reduction), fits permanently in CPU cache, and eliminates B-Tree page split churn during inserts.",
      },
      {
        "id": "strat_hash_index_telemetry",
        "title": "Convert to HASH Index on recorded_at",
        "sqlCommand": "CREATE INDEX idx_telemetry_hash ON device_telemetry USING HASH(recorded_at);",
        "isOptimal": False,
        "resultingCost": 1200000,
        "resultingLatencyMs": 14000,
        "executionPlanSummary": "Seq Scan -> Hash indexes do not support range operators (>= and <)",
        "engineExplanation": "Hash indexes only support equality operators (=). The query optimizer ignores the hash index completely for timestamp ranges, reverting to a 65 GB sequential scan.",
      },
      {
        "id": "strat_unlogged_btree_table",
        "title": "Rebuild B-Tree with fillfactor = 50",
        "sqlCommand": "ALTER INDEX idx_recorded_at_btree SET (fillfactor = 50); REINDEX INDEX idx_recorded_at_btree;",
        "isOptimal": False,
        "resultingCost": 920000,
        "resultingLatencyMs": 5800,
        "executionPlanSummary": "Index bloats from 22 GB to 44 GB, increasing disk footprint and I/O thrashing",
        "engineExplanation": "Fillfactor 50 doubles the physical size of the B-Tree index to 44 GB, exacerbating buffer cache eviction and disk I/O.",
      },
    ],
    "keyTakeaway": "For append-only ordered tables (time-series, logs, audit trails), PostgreSQL BRIN indexes occupy a fraction of the RAM of a B-Tree (1.8 MB vs 22 GB) with near-identical range query scan speed.",
  },
  {
    "id": "eval_plan_qual_concurrent_update",
    "title": "PostgreSQL EvalPlanQual (EPQ) Anomaly During Concurrent Updates",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "account_orders",
    "rowCount": "8,000,000 rows",
    "tableSizeDisk": "2.4 GB on disk",
    "slowQuery": """-- Session 1 starts processing:
UPDATE account_orders 
SET status = 'PROCESSING', updated_at = NOW() 
WHERE order_id = 45012 AND status = 'READY';

-- Concurrent Session 2 updated the same row moments earlier to status = 'CANCELLED' and committed!""",
    "initialCost": 8.4,
    "initialLatencyMs": 350,
    "initialPlanSummary": "Update on account_orders -> EvalPlanQual re-evaluates WHERE clause against newer tuple version",
    "businessContext": "E-commerce order fulfillment service. Customers report cancelled orders are still being processed and shipped because concurrent updates overwrite state transitions.",
    "strategies": [
      {
        "id": "strat_state_machine_validation_optimal",
        "title": "Verify Rows Affected in Application & Use State-Machine Check Constraint",
        "sqlCommand": """-- In application DAO:
int rowsUpdated = jdbcTemplate.update(
  "UPDATE account_orders SET status = 'PROCESSING', updated_at = NOW() WHERE order_id = ? AND status = 'READY'",
  orderId
);
if (rowsUpdated == 0) {
  throw new IllegalOrderStateException("Order state changed concurrently; aborting processing.");
}""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Index Update -> EPQ detects status != 'READY' in new version, updates 0 rows cleanly",
        "engineExplanation": "Winner! In PostgreSQL READ COMMITTED mode, when an UPDATE finds a row locked by another transaction, it waits. When the blocker commits, Postgres uses EvalPlanQual to re-evaluate the WHERE clause on the new tuple version. If the new version fails the WHERE condition (e.g. status is now 'CANCELLED'), 0 rows are updated! Applications must check affected row count.",
      },
      {
        "id": "strat_remove_where_status",
        "title": "Remove WHERE status = 'READY' to force unconditional overwrite",
        "sqlCommand": "UPDATE account_orders SET status = 'PROCESSING' WHERE order_id = 45012;",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Unconditional overwrite -> Overwrites CANCELLED and REFUNDED states with PROCESSING",
        "engineExplanation": "Catastrophic! Blind updates create severe data corruption by resurrecting cancelled or refunded orders.",
      },
      {
        "id": "strat_use_read_uncommitted",
        "title": "Use Dirty Reads to detect concurrent writes early",
        "sqlCommand": "SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "PostgreSQL treats READ UNCOMMITTED identically to READ COMMITTED",
        "engineExplanation": "PostgreSQL does not implement dirty reads. Per SQL standard allowance, Postgres treats READ UNCOMMITTED as READ COMMITTED.",
      },
    ],
    "keyTakeaway": "Under PostgreSQL READ COMMITTED, concurrent updates invoke EvalPlanQual (EPQ) to recheck WHERE conditions against the committed tuple. If the condition fails, affected rows is 0. Always verify rows_affected == 1.",
  },
  {
    "id": "ssi_siread_predicate_lock_false_positive",
    "title": "SSI SIREAD Lock Escalation False Positives (Error 40001)",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "doctor_shifts",
    "rowCount": "4,000,000 rows",
    "tableSizeDisk": "950 MB on disk",
    "slowQuery": """-- Serializable Transaction:
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT count(*) FROM doctor_shifts WHERE hospital_id = 42 AND shift_date = CURRENT_DATE AND on_call = true;
-- If count >= 2, allow doctor to leave:
UPDATE doctor_shifts SET on_call = false WHERE doctor_id = 901 AND hospital_id = 42 AND shift_date = CURRENT_DATE;
COMMIT;""",
    "initialCost": 28000,
    "initialLatencyMs": 850,
    "initialPlanSummary": "Seq Scan -> SIREAD lock escalates to Relation/Page level -> ERROR 40001: could not serialize access due to read/write dependencies among transactions",
    "businessContext": "Hospital scheduling portal running under SERIALIZABLE isolation to prevent write-skew. Doctors on completely different wards and dates receive 40001 serialization failures.",
    "strategies": [
      {
        "id": "strat_composite_index_siread_optimal",
        "title": "Add Precise Composite Index (hospital_id, shift_date, on_call) for Fine-Grained SIREAD Tuples",
        "sqlCommand": """CREATE INDEX idx_doctor_shifts_lookup 
ON doctor_shifts(hospital_id, shift_date, on_call);

-- Now the SIREAD predicate lock attaches to individual leaf tuples instead of whole pages or the whole relation!""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Index Only Scan on idx_doctor_shifts_lookup -> Fine-grained tuple SIREAD locks (Zero false positive conflicts)",
        "engineExplanation": "Winner! In Serializable Snapshot Isolation (SSI), if there is no index covering the predicate, PostgreSQL must perform a Sequential Scan, placing an SIREAD lock on every page or escalating to the entire relation. Any concurrent write to the table triggers false-positive serialization conflicts! Adding a matching composite index confines SIREAD locks to exact matching tuples.",
      },
      {
        "id": "strat_increase_max_locks_per_tx",
        "title": "Increase max_locks_per_transaction to 4096",
        "sqlCommand": "ALTER SYSTEM SET max_locks_per_transaction = 4096;",
        "isOptimal": False,
        "resultingCost": 28000,
        "resultingLatencyMs": 830,
        "executionPlanSummary": "Sequential Scan still triggers broad page and relation level SIREAD conflicts",
        "engineExplanation": "max_locks_per_transaction sets hash table sizing but does not stop a Seq Scan from locking the entire table with SIREAD predicate locks.",
      },
      {
        "id": "strat_downgrade_to_read_uncommitted",
        "title": "Downgrade isolation to READ COMMITTED without concurrency guard",
        "sqlCommand": "SET TRANSACTION ISOLATION LEVEL READ COMMITTED;",
        "isOptimal": False,
        "resultingCost": 28000,
        "resultingLatencyMs": 750,
        "executionPlanSummary": "Vulnerable to Write-Skew anomaly -> All doctors can leave shift concurrently leaving 0 on-call!",
        "engineExplanation": "Under READ COMMITTED, two concurrent doctors can both check count(*) == 2 and both proceed to leave, leaving 0 doctors on duty (classic Write-Skew anomaly).",
      },
    ],
    "keyTakeaway": "In PostgreSQL SERIALIZABLE isolation, missing indexes force Sequential Scans that place SIREAD predicate locks on entire relation pages, triggering false-positive 40001 serialization errors across unrelated transactions.",
  },
  {
    "id": "orphan_replication_slot_disk_exhaustion",
    "title": "Orphan Logical Replication Slot Causing Catastrophic WAL Disk 100%",
    "difficulty": "Senior",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "pg_replication_slots",
    "rowCount": "1 abandoned Debezium CDC consumer slot",
    "tableSizeDisk": "2 TB WAL directory (pg_wal 100% full)",
    "slowQuery": """-- System crashes with:
-- PANIC: could not write to log file: No space left on device
SELECT slot_name, plugin, active, restart_lsn, pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) / (1024*1024*1024) AS lag_gb
FROM pg_replication_slots;""",
    "initialCost": 1.0,
    "initialLatencyMs": 2.0,
    "initialPlanSummary": "debezium_cdc_orders_slot | inactive | lag_gb: 1850 GB held on disk",
    "businessContext": "Primary database server running out of disk space on /var/lib/postgresql/data. Checkpointer cannot recycle WAL files because an abandoned Kafka Debezium connector went offline 3 days ago.",
    "strategies": [
      {
        "id": "strat_drop_slot_and_set_max_wal_optimal",
        "title": "Drop Orphan Slot & Configure max_slot_wal_keep_size Safety Circuit Breaker",
        "sqlCommand": """-- 1. Drop the abandoned replication slot to release pinned WAL:
SELECT pg_drop_replication_slot('debezium_cdc_orders_slot');

-- 2. Configure safety ceiling in postgresql.conf (PostgreSQL 13+):
ALTER SYSTEM SET max_slot_wal_keep_size = '50GB';
SELECT pg_reload_conf();""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 5.0,
        "executionPlanSummary": "Slot removed -> Checkpointer immediately removes/recycles 1.8 TB of WAL files",
        "engineExplanation": "Winner! PostgreSQL replication slots guarantee that WAL is never recycled until the consumer confirms receipt. If a consumer crashes, the primary accumulates WAL until disk exhaustion. Dropping the orphan slot frees the disk. Setting max_slot_wal_keep_size (50GB) invalidates lagging slots before they crash the primary database.",
      },
      {
        "id": "strat_manual_delete_wal_rm",
        "title": "Manually delete WAL files using rm -rf /var/lib/postgresql/data/pg_wal/*",
        "sqlCommand": "rm -rf /var/lib/postgresql/data/pg_wal/*",
        "isOptimal": False,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "Irreversible database corruption -> Database fails to start upon recovery",
        "engineExplanation": "NEVER manually delete files from pg_wal with rm! Deleting unapplied WAL permanently corrupts the database cluster, making crash recovery impossible without restoring from cold backup.",
      },
      {
        "id": "strat_increase_wal_keep_size",
        "title": "Increase wal_keep_size to 200GB",
        "sqlCommand": "ALTER SYSTEM SET wal_keep_size = '200GB';",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "wal_keep_size forces PostgreSQL to retain MORE wal files, worsening the disk full panic",
        "engineExplanation": "Increasing wal_keep_size commands PostgreSQL to hold even more WAL, accelerating total disk saturation.",
      },
    ],
    "keyTakeaway": "Replication slots protect consumer replicas but will retain WAL indefinitely until disk full. Always monitor pg_replication_slots and set max_slot_wal_keep_size as an emergency circuit breaker.",
  },
  {
    "id": "noop_update_wal_amplification",
    "title": "No-Op UPDATE Write Amplification Blowing WAL & Breaking HOT Chains",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "user_profiles",
    "rowCount": "25,000,000 rows",
    "tableSizeDisk": "12 GB on disk",
    "slowQuery": """-- Microservice heartbeat executes 5,000 times/second:
UPDATE user_profiles 
SET is_active = true, last_seen_device = 'iOS' 
WHERE user_id = 78104; 
-- Note: is_active is ALREADY true and last_seen_device is ALREADY 'iOS'!""",
    "initialCost": 8.4,
    "initialLatencyMs": 14.2,
    "initialPlanSummary": "Index Update on user_profiles -> Physical row tuple copy written, indexes updated, WAL generated",
    "businessContext": "Application user heartbeat issues no-op updates for millions of active sessions. Database generates 400 GB of WAL logs per day and autovacuum cannot keep up with table bloat.",
    "strategies": [
      {
        "id": "strat_guard_condition_noop_optimal",
        "title": "Add Identity WHERE Guard & IS DISTINCT FROM Filter",
        "sqlCommand": """UPDATE user_profiles 
SET is_active = true, last_seen_device = 'iOS' 
WHERE user_id = 78104 
  AND (is_active IS DISTINCT FROM true 
       OR last_seen_device IS DISTINCT FROM 'iOS');""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.4,
        "executionPlanSummary": "Index Scan -> WHERE clause fails immediately -> 0 tuples copied, 0 WAL generated, 0 index updates",
        "engineExplanation": "Winner! In PostgreSQL, updating a row with identical data is NOT a no-op under the hood; MVCC must write a new row version, generate WAL, and dirty the index pages unless HOT applies. By adding a guard filter (IS DISTINCT FROM), the engine skips the write completely if the values match, slashing WAL volume by 95%.",
      },
      {
        "id": "strat_run_vacuum_full_hourly",
        "title": "Run VACUUM FULL user_profiles every hour",
        "sqlCommand": "VACUUM FULL user_profiles;",
        "isOptimal": False,
        "resultingCost": 950000,
        "resultingLatencyMs": 45000,
        "executionPlanSummary": "Exclusive AccessExclusiveLock -> Blocks all application reads and writes for 45 seconds",
        "engineExplanation": "VACUUM FULL acquires an exclusive table lock that locks out all API users, causing immediate cascading timeouts across the web application.",
      },
      {
        "id": "strat_disable_wal_logging",
        "title": "Convert user_profiles table to UNLOGGED",
        "sqlCommand": "ALTER TABLE user_profiles SET UNLOGGED;",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 2.1,
        "executionPlanSummary": "Table loses crash recovery and streaming replication standby synchronization",
        "engineExplanation": "UNLOGGED tables are truncated to empty upon any database crash or restart, and cannot be replicated to standby read replicas.",
      },
    ],
    "keyTakeaway": "In PostgreSQL, setting a column to its existing value still creates a new MVCC tuple and writes WAL. Always guard updates with 'WHERE col IS DISTINCT FROM new_val'.",
  },
  {
    "id": "long_transaction_undo_hll_bloat",
    "title": "Long-Running Analytical Transaction Freezing InnoDB Undo Purge",
    "difficulty": "Senior",
    "category": "innodb",
    "categoryLabel": "MySQL InnoDB Internals",
    "tableName": "innodb_undo_tablespace",
    "rowCount": "History List Length (HLL): 45,000,000 undo records",
    "tableSizeDisk": "Undo log swollen from 500 MB to 180 GB",
    "slowQuery": """-- A developer left a psql/mysql session open with a forgotten BEGIN:
-- Transaction started 18 hours ago:
BEGIN;
SELECT count(*) FROM audit_logs WHERE created_at < '2025-01-01';
-- Session left idle in transaction for 18 hours...""",
    "initialCost": 500000,
    "initialLatencyMs": 12000,
    "initialPlanSummary": "InnoDB Purge Lag: Master purge thread blocked by oldest read view (trx_id=14092100). All OLTP queries slow down due to traversing giant undo chains.",
    "businessContext": "MySQL database query latency on standard primary key lookups spikes from 0.5ms to 120ms. The undo tablespace grows to 180 GB, threatening disk capacity.",
    "strategies": [
      {
        "id": "strat_kill_idle_and_set_timeout_optimal",
        "title": "Kill Oldest Idle Transaction & Enforce idle_in_transaction_session_timeout",
        "sqlCommand": """-- Identify and terminate the blocking connection:
SELECT trx_mysql_thread_id, trx_started, NOW() - trx_started AS duration
FROM information_schema.innodb_trx 
ORDER BY trx_started ASC LIMIT 1;
-- KILL <thread_id>;

-- Configure server-side circuit breaker:
SET GLOBAL max_execution_time = 30000; -- MySQL 8.0 query timeout
-- In PostgreSQL: ALTER SYSTEM SET idle_in_transaction_session_timeout = '60000';""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "Idle transaction rolled back -> InnoDB purge thread instantly awakens, pruning 45M undo records",
        "engineExplanation": "Winner! In MVCC, an active transaction's Read View requires the database to preserve undo versions for every row modified anywhere in the database since that transaction began. The undo purge worker is completely blocked. Terminating the idle transaction unblocks undo purging and restores secondary index lookups to sub-millisecond speeds.",
      },
      {
        "id": "strat_increase_undo_tablespace_size",
        "title": "Allocate an additional 500 GB EBS volume for undo tablespace",
        "sqlCommand": "-- Attach AWS EBS volume and resize file system",
        "isOptimal": False,
        "resultingCost": 500000,
        "resultingLatencyMs": 14000,
        "executionPlanSummary": "Disk size increased but query traversal through 10,000-deep undo version chains remains agonizingly slow",
        "engineExplanation": "Adding disk space does not fix query performance. Every SELECT must traverse thousands of undo log records to reconstruct historical row snapshots.",
      },
      {
        "id": "strat_restart_mysql_service",
        "title": "Perform an emergency kill -9 and restart of the database server",
        "sqlCommand": "systemctl restart mysql",
        "isOptimal": False,
        "resultingCost": 1000000,
        "resultingLatencyMs": 1800000,
        "executionPlanSummary": "Crash Recovery -> InnoDB must recover 180 GB of undo logs during startup, incurring 45 minutes of total downtime",
        "engineExplanation": "Force-killing MySQL with a massive undo backlog causes hours-long crash recovery during startup while InnoDB rebuilds the transaction state.",
      },
    ],
    "keyTakeaway": "An idle transaction holding an open read view stops undo log / dead tuple purging for the entire database. Enforce strict idle_in_transaction_session_timeout settings.",
  },
  {
    "id": "metadata_lock_priority_queue_cascade",
    "title": "MySQL Metadata Lock (MDL) Queue Cascading Outage",
    "difficulty": "Senior",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "customer_orders",
    "rowCount": "15,000,000 rows",
    "tableSizeDisk": "6.2 GB on disk",
    "slowQuery": """-- Session 1 (Slow analytical query running for 30s):
SELECT count(*) FROM customer_orders WHERE notes LIKE '%VIP%';

-- Session 2 (Migration tool attempts schema change):
ALTER TABLE customer_orders ADD COLUMN loyalty_tier VARCHAR(20);

-- Session 3 to 500 (Incoming live traffic):
SELECT * FROM customer_orders WHERE order_id = 91823;""",
    "initialCost": 8.4,
    "initialLatencyMs": 30000,
    "initialPlanSummary": "Waiting for table metadata lock -> 498 active connections piled up in 'Waiting for table metadata lock', max_connections exhausted!",
    "businessContext": "During an online release, adding a non-blocking nullable column freezes the entire production website. All 500 connection pool slots fill up with 504 Gateway Timeouts.",
    "strategies": [
      {
        "id": "strat_lock_wait_timeout_ddl_optimal",
        "title": "Set lock_wait_timeout for DDL Sessions & Retry Gracefully",
        "sqlCommand": """-- Inside migration script:
SET lock_wait_timeout = 3; -- Fail within 3 seconds instead of 1 year!
ALTER TABLE customer_orders ADD COLUMN loyalty_tier VARCHAR(20), ALGORITHM=INPLACE, LOCK=NONE;""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "DDL acquires lock immediately if clear, or aborts within 3s without queuing behind slow reads",
        "engineExplanation": "Winner! MySQL prioritizes DDL write-lock requests ahead of new read-lock requests in the Metadata Lock (MDL) queue. When ALTER TABLE waits for Session 1, ALL subsequent SELECT statements queue behind the ALTER TABLE! Setting lock_wait_timeout = 3 ensures the migration fails fast rather than piling up hundreds of incoming customer queries.",
      },
      {
        "id": "strat_increase_max_connections",
        "title": "Increase max_connections from 500 to 5,000",
        "sqlCommand": "SET GLOBAL max_connections = 5000;",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 60000,
        "executionPlanSummary": "5,000 connections queue waiting for MDL, inducing kernel thread scheduling thrashing and OOM crash",
        "engineExplanation": "Raising connection limits allows 5,000 threads to queue simultaneously, exhausting operating system memory and crashing the database process.",
      },
      {
        "id": "strat_force_copy_algorithm",
        "title": "Use ALGORITHM=COPY for the schema migration",
        "sqlCommand": "ALTER TABLE customer_orders ADD COLUMN loyalty_tier VARCHAR(20), ALGORITHM=COPY;",
        "isOptimal": False,
        "resultingCost": 980000,
        "resultingLatencyMs": 180000,
        "executionPlanSummary": "Full table copy under shared table lock -> Locks out all INSERT, UPDATE, and DELETE operations for 3 minutes",
        "engineExplanation": "ALGORITHM=COPY converts the table to read-only during the copy, completely halting production mutations for minutes.",
      },
    ],
    "keyTakeaway": "MySQL gives DDL requests higher priority in the Metadata Lock queue than new SELECT queries. A blocked ALTER TABLE blocks ALL subsequent queries on that table. Always set session lock_wait_timeout = 3 for DDL.",
  },
  {
    "id": "online_ddl_row_log_buffer_overflow",
    "title": "MySQL Online DDL Row Log Buffer Overflow Rollback",
    "difficulty": "Senior",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "payment_transactions",
    "rowCount": "80,000,000 rows",
    "tableSizeDisk": "35 GB on disk",
    "slowQuery": """-- Adding a secondary index on a busy OLTP table:
ALTER TABLE payment_transactions 
ADD INDEX idx_created_merchant (created_at, merchant_id), 
ALGORITHM=INPLACE, LOCK=NONE;""",
    "initialCost": 1200000,
    "initialLatencyMs": 900000,
    "initialPlanSummary": "InnoDB Online DDL: Error 1799 (HY000): Creating index 'idx_created_merchant' required more than 'innodb_online_alter_log_max_size' bytes of modification log",
    "businessContext": "Adding a missing index to an 80M row payments table during peak business hours. After running for 15 minutes, the operation fails and rolls back, having wasted massive I/O bandwidth.",
    "strategies": [
      {
        "id": "strat_increase_online_alter_log_optimal",
        "title": "Increase innodb_online_alter_log_max_size for the Migration",
        "sqlCommand": """-- Temporarily raise modification log buffer from default 128MB to 2GB:
SET GLOBAL innodb_online_alter_log_max_size = 2147483648;

-- Re-run the concurrent online DDL:
ALTER TABLE payment_transactions 
ADD INDEX idx_created_merchant (created_at, merchant_id), 
ALGORITHM=INPLACE, LOCK=NONE;

-- Reset back after index build completes:
SET GLOBAL innodb_online_alter_log_max_size = 134217728;""",
        "isOptimal": True,
        "resultingCost": 450000,
        "resultingLatencyMs": 420000,
        "executionPlanSummary": "Online index build succeeds concurrently without blocking concurrent INSERT/UPDATE traffic",
        "engineExplanation": "Winner! During ALGORITHM=INPLACE online index creation, concurrent writes are buffered in an in-memory row log (default 128 MB). On a high-throughput table, 128 MB is quickly exhausted before the index scan finishes, triggering Error 1799. Raising innodb_online_alter_log_max_size allows the buffer to hold all concurrent mutations.",
      },
      {
        "id": "strat_lock_exclusive_mode",
        "title": "Use LOCK=EXCLUSIVE to prevent row logging entirely",
        "sqlCommand": "ALTER TABLE payment_transactions ADD INDEX idx_created_merchant (created_at, merchant_id), LOCK=EXCLUSIVE;",
        "isOptimal": False,
        "resultingCost": 400000,
        "resultingLatencyMs": 350000,
        "executionPlanSummary": "Exclusive Table Lock -> All payment processing APIs fail with 500 errors for 6 minutes",
        "engineExplanation": "LOCK=EXCLUSIVE stops concurrent writes, meaning payment checkouts will be rejected across the entire platform for several minutes.",
      },
      {
        "id": "strat_disable_binlog_during_ddl",
        "title": "Disable binary logging with SET sql_log_bin = 0",
        "sqlCommand": "SET sql_log_bin = 0; ALTER TABLE payment_transactions ADD INDEX ...",
        "isOptimal": False,
        "resultingCost": 450000,
        "resultingLatencyMs": 420000,
        "executionPlanSummary": "DDL is omitted from binary log -> Read replicas never receive the index, breaking replication consistency",
        "engineExplanation": "Disabling sql_log_bin creates replication drift. Replicas never build the index, leading to slow queries and failover discrepancies.",
      },
    ],
    "keyTakeaway": "MySQL INPLACE online index creation buffers concurrent writes in innodb_online_alter_log_max_size. If write volume exceeds this size before the scan completes, the DDL aborts. Increase this parameter before large online migrations.",
  },
  {
    "id": "ghost_vs_ptosc_triggerless_migration",
    "title": "Trigger Lock Contention in pt-online-schema-change vs gh-ost",
    "difficulty": "Senior",
    "category": "ddl",
    "categoryLabel": "Schema Migrations & DDL",
    "tableName": "audit_events",
    "rowCount": "120,000,000 rows",
    "tableSizeDisk": "48 GB on disk",
    "slowQuery": """-- Running pt-online-schema-change on high-write table:
pt-online-schema-change --alter "ADD COLUMN severity TINYINT NOT NULL DEFAULT 1" \\
  --execute h=master_db,D=prod,t=audit_events""",
    "initialCost": 1500000,
    "initialLatencyMs": 1200000,
    "initialPlanSummary": "pt-osc attaches synchronous AFTER INSERT, AFTER UPDATE, AFTER DELETE triggers -> Write amplification doubles lock contention, lock wait timeouts cascade",
    "businessContext": "Running schema migrations on an audit table ingesting 8,000 inserts/second. pt-online-schema-change's triggers cause thread contention and lock wait timeouts on master database.",
    "strategies": [
      {
        "id": "strat_ghost_binlog_stream_optimal",
        "title": "Use gh-ost (Triggerless Online Schema Change via Binlog Streaming)",
        "sqlCommand": """gh-ost \\
  --host=master_db --database=prod --table=audit_events \\
  --alter="ADD COLUMN severity TINYINT NOT NULL DEFAULT 1" \\
  --allow-on-master --serve-socket-file=/tmp/ghost.sock \\
  --cut-over=atomic --max-load=Threads_running=50 \\
  --execute""",
        "isOptimal": True,
        "resultingCost": 120000,
        "resultingLatencyMs": 600000,
        "executionPlanSummary": "gh-ost replicates writes asynchronously by reading row-based binlog -> ZERO triggers, zero lock contention",
        "engineExplanation": "Winner! pt-online-schema-change uses synchronous row triggers (AFTER INSERT/UPDATE/DELETE) on the original table, multiplying locking overhead and causing deadlocks under high write loads. gh-ost is triggerless: it connects as a replication replica, reads changes asynchronously from the binary log, and applies them to the ghost table with automatic back-pressure throttle.",
      },
      {
        "id": "strat_ptosc_drop_foreign_keys",
        "title": "Add --no-check-alter to bypass pt-osc safety checks",
        "sqlCommand": "pt-online-schema-change --no-check-alter --alter ...",
        "isOptimal": False,
        "resultingCost": 1500000,
        "resultingLatencyMs": 1200000,
        "executionPlanSummary": "Bypasses safety validations without reducing synchronous trigger lock contention",
        "engineExplanation": "Disabling safety checks does not eliminate the synchronous write triggers that are causing the lock contention.",
      },
      {
        "id": "strat_run_direct_alter_table",
        "title": "Run native ALTER TABLE audit_events ADD COLUMN severity ...",
        "sqlCommand": "ALTER TABLE audit_events ADD COLUMN severity TINYINT NOT NULL DEFAULT 1;",
        "isOptimal": False,
        "resultingCost": 2000000,
        "resultingLatencyMs": 2400000,
        "executionPlanSummary": "Blocks write access and locks table for 40 minutes on 120M row dataset",
        "engineExplanation": "Direct ALTER TABLE on a 120M row table causes table-level locking, blocking all 8,000 inserts/sec and bringing down ingest pipelines.",
      },
    ],
    "keyTakeaway": "pt-online-schema-change uses synchronous SQL triggers that can cause severe lock contention on write-heavy tables. Use triggerless tools like GitHub's gh-ost which consume changes via the binary log.",
  },
  {
    "id": "postgresql_create_index_invalid_recovery",
    "title": "PostgreSQL Failed CREATE INDEX CONCURRENTLY Left in INVALID State",
    "difficulty": "Senior",
    "category": "indexing",
    "categoryLabel": "Indexing Strategies",
    "tableName": "user_subscriptions",
    "rowCount": "30,000,000 rows",
    "tableSizeDisk": "7.5 GB on disk",
    "slowQuery": """-- Query planner ignores index and runs full Seq Scan:
SELECT * FROM user_subscriptions 
WHERE renewed_at < NOW() - INTERVAL '30 days' AND status = 'ACTIVE';

-- Database status query:
SELECT indexrelid::regclass, indisvalid, indisready 
FROM pg_index WHERE indexrelid = 'idx_subs_renewed'::regclass;
-- Result: indisvalid = false, indisready = true""",
    "initialCost": 520000,
    "initialLatencyMs": 6400,
    "initialPlanSummary": "Seq Scan on user_subscriptions -> idx_subs_renewed is marked INVALID and completely ignored by the query planner!",
    "businessContext": "A CI/CD deployment previously ran CREATE INDEX CONCURRENTLY idx_subs_renewed, but the TCP connection was cancelled midway. The index exists on disk, takes 1.4 GB, but is ignored by SELECT queries.",
    "strategies": [
      {
        "id": "strat_reindex_concurrently_optimal",
        "title": "Drop Invalid Index or Run REINDEX INDEX CONCURRENTLY",
        "sqlCommand": """-- PostgreSQL 12+:
REINDEX INDEX CONCURRENTLY idx_subs_renewed;

-- Or clean drop and recreate:
-- DROP INDEX CONCURRENTLY idx_subs_renewed;
-- CREATE INDEX CONCURRENTLY idx_subs_renewed ON user_subscriptions(renewed_at, status);""",
        "isOptimal": True,
        "resultingCost": 12.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Index Scan on idx_subs_renewed -> indisvalid becomes TRUE, planner uses index",
        "engineExplanation": "Winner! When CREATE INDEX CONCURRENTLY fails or is cancelled, PostgreSQL leaves the index catalog entry in an INVALID state. An invalid index is NEVER used for queries, yet it continues to be updated on every INSERT/UPDATE/DELETE (burning write I/O!). REINDEX INDEX CONCURRENTLY safely rebuilds the index and marks indisvalid = true.",
      },
      {
        "id": "strat_enable_seqscan_off",
        "title": "Force index use with SET enable_seqscan = off",
        "sqlCommand": "SET enable_seqscan = off; SELECT * FROM user_subscriptions ...",
        "isOptimal": False,
        "resultingCost": 999999999,
        "resultingLatencyMs": 6800,
        "executionPlanSummary": "Planner cannot use an invalid index under any circumstances; falls back to Seq Scan with penalty cost",
        "engineExplanation": "The PostgreSQL planner strictly refuses to use an invalid index because its data integrity is unverified. Disabling seqscan only inflates the cost of the sequential scan.",
      },
      {
        "id": "strat_update_pg_index_catalog",
        "title": "Directly update system catalog UPDATE pg_index SET indisvalid = true",
        "sqlCommand": "UPDATE pg_index SET indisvalid = true WHERE indexrelid = 'idx_subs_renewed'::regclass;",
        "isOptimal": False,
        "resultingCost": 12.5,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Corrupt index returns wrong/missing rows for queries because partial keys were never indexed",
        "engineExplanation": "Directly hacking pg_index causes silent query corruption. The failed concurrent build missed rows that were updated during the initial scan.",
      },
    ],
    "keyTakeaway": "An aborted CREATE INDEX CONCURRENTLY leaves an INVALID index that burns write I/O on every write without ever being used for reads. Rebuild it with REINDEX CONCURRENTLY.",
  },
  {
    "id": "streaming_export_net_write_timeout",
    "title": "MySQL net_write_timeout & Java OutOfMemory During 5M Row Export",
    "difficulty": "Senior",
    "category": "performance",
    "categoryLabel": "Database Drivers & Streaming",
    "tableName": "invoices",
    "rowCount": "5,000,000 rows",
    "tableSizeDisk": "4.2 GB on disk",
    "slowQuery": """-- Spring Boot batch job exporting invoices to S3:
SELECT invoice_id, customer_id, total_amount, pdf_payload, tax_code
FROM invoices
WHERE billing_year = 2025;""",
    "initialCost": 350000,
    "initialLatencyMs": 75000,
    "initialPlanSummary": "MySQL Client Error: Communications link failure (net_write_timeout) / Java Heap Space: java.lang.OutOfMemoryError",
    "businessContext": "Annual tax compliance batch job fails after 60 seconds with 'net_write_timeout' or crashes the Spring microservice container with OOM error.",
    "strategies": [
      {
        "id": "strat_cursor_streaming_fetchsize_optimal",
        "title": "Configure MySQL Cursor Streaming (Integer.MIN_VALUE) & Client Stream",
        "sqlCommand": """-- In JDBC / MyBatis / Hibernate configuration:
PreparedStatement stmt = conn.prepareStatement(
  "SELECT invoice_id, customer_id, total_amount, tax_code FROM invoices WHERE billing_year = 2025",
  ResultSet.TYPE_FORWARD_ONLY,
  ResultSet.CONCUR_READ_ONLY
);
// Magic MySQL connector stream flag (fetches row by row without buffering in RAM):
stmt.setFetchSize(Integer.MIN_VALUE);

-- Or in MySQL session:
SET SESSION net_write_timeout = 1800;""",
        "isOptimal": True,
        "resultingCost": 45000,
        "resultingLatencyMs": 8500,
        "executionPlanSummary": "Streamed ResultSet -> Constant 32 MB JVM memory consumption, zero socket write timeouts",
        "engineExplanation": "Winner! By default, the MySQL JDBC driver fetches all millions of rows into Java client memory in a single byte array, triggering JVM OutOfMemoryError. Furthermore, if the client is slow writing to S3, MySQL's TCP output buffer fills up, exceeding net_write_timeout (default 60s). Setting setFetchSize(Integer.MIN_VALUE) instructs MySQL Connector/J to stream row-by-row directly from the socket.",
      },
      {
        "id": "strat_increase_jvm_heap",
        "title": "Increase JVM container heap memory to -Xmx64G",
        "sqlCommand": "java -Xmx64G -jar batch-service.jar",
        "isOptimal": False,
        "resultingCost": 350000,
        "resultingLatencyMs": 82000,
        "executionPlanSummary": "Huge GC pauses and net_write_timeout still triggers because MySQL TCP buffer fills up",
        "engineExplanation": "Throwing memory at the problem costs cloud dollars without solving the network socket buffer timeout when consumer throughput lags database output.",
      },
      {
        "id": "strat_offset_batching",
        "title": "Chunk into 5,000 batches using LIMIT 1000 OFFSET 0..5000000",
        "sqlCommand": "SELECT ... LIMIT 1000 OFFSET 4999000;",
        "isOptimal": False,
        "resultingCost": 1800000,
        "resultingLatencyMs": 480000,
        "executionPlanSummary": "O(N^2) quadratic degradation: each batch re-scans all preceding offset rows",
        "engineExplanation": "OFFSET pagination gets progressively slower on every batch, turning an 8-second query into an 8-minute crawl.",
      },
    ],
    "keyTakeaway": "MySQL JDBC by default buffers all query rows into client memory before returning. For large data exports, use setFetchSize(Integer.MIN_VALUE) to enable true streaming and increase net_write_timeout.",
  },
  {
    "id": "advisory_lock_connection_pool_leak",
    "title": "PostgreSQL pg_advisory_lock Session Leak Across Pooled Connections",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "pg_locks",
    "rowCount": "100 HikariCP pool connections",
    "tableSizeDisk": "Memory-resident lock manager",
    "slowQuery": """-- Microservice acquiring session-level advisory lock:
SELECT pg_advisory_lock(98765);
-- Transaction completes or throws unhandled exception:
-- Application forgets to call SELECT pg_advisory_unlock(98765);
-- Connection is returned to HikariCP pool!""",
    "initialCost": 1.0,
    "initialLatencyMs": 10000,
    "initialPlanSummary": "ExclusiveLock on Advisory (classid=0, objid=98765) held permanently by physical backend PID 18420. Subsequent threads block forever!",
    "businessContext": "Distributed cron scheduling service uses advisory locks for leader election. After an exception occurs, no worker is ever able to run the cron job again until database restart.",
    "strategies": [
      {
        "id": "strat_transaction_level_advisory_lock_optimal",
        "title": "Switch to Transaction-Scoped Advisory Locks (pg_advisory_xact_lock)",
        "sqlCommand": """-- Inside transaction block:
BEGIN;
-- Automatically released upon COMMIT or ROLLBACK:
SELECT pg_advisory_xact_lock(98765);
-- Perform critical task...
COMMIT;""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 0.5,
        "executionPlanSummary": "Transaction-scoped lock -> Automatically and unconditionally released when tx terminates",
        "engineExplanation": "Winner! pg_advisory_lock is session-scoped; it lives on the underlying TCP database connection. In modern connection pools (HikariCP, PgBouncer), connections are reused across different web requests. If code throws an unhandled exception before unlocking, the lock leaks into the pool. pg_advisory_xact_lock is bound to the transaction lifecycle and automatically releases on commit or rollback.",
      },
      {
        "id": "strat_kill_backend_pid",
        "title": "Write a cron script to kill database connections holding advisory locks",
        "sqlCommand": "SELECT pg_terminate_backend(pid) FROM pg_locks WHERE locktype = 'advisory';",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 5.0,
        "executionPlanSummary": "Terminating backend connections causes pool connection resets and breaks in-flight transactions",
        "engineExplanation": "Killing active pool connections creates transient application connection errors and doesn't fix the underlying code bug.",
      },
      {
        "id": "strat_switch_to_redis_lock",
        "title": "Replace with un-fenced Redis SETNX key with 10s TTL",
        "sqlCommand": "SET lock:98765 token NX EX 10",
        "isOptimal": False,
        "resultingCost": 0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "Lock expires prematurely during GC pause or slow network I/O, leading to split-brain execution",
        "engineExplanation": "Basic Redis locks without fencing tokens fail under GC pauses or network delays, allowing two workers to run concurrently.",
      },
    ],
    "keyTakeaway": "Never use session-level pg_advisory_lock with connection pools like HikariCP. Always use transaction-scoped pg_advisory_xact_lock so locks release automatically on COMMIT or ROLLBACK.",
  },
  {
    "id": "optimistic_lock_retry_storm_flash_sale",
    "title": "Optimistic Locking @Version Retry Storm During Flash Sale",
    "difficulty": "Senior",
    "category": "concurrency",
    "categoryLabel": "Locking & Concurrency",
    "tableName": "product_inventory",
    "rowCount": "1 hotspot row (SKU: iPhone 16 Pro)",
    "tableSizeDisk": "150 MB on disk",
    "slowQuery": """-- 5,000 concurrent threads executing:
UPDATE product_inventory 
SET stock = stock - 1, version = version + 1 
WHERE product_id = 999 AND version = 42;""",
    "initialCost": 8.4,
    "initialLatencyMs": 3500,
    "initialPlanSummary": "OptimisticLockException -> 4,999 threads fail with version mismatch, triggering application retry loop, collapsing DB CPU to 100%",
    "businessContext": "Black Friday flash sale for limited stock item. 5,000 customers hit purchase simultaneously. 99.8% of requests fail with OptimisticLockException, and client retry storms crash the microservice cluster.",
    "strategies": [
      {
        "id": "strat_pessimistic_decrement_optimal",
        "title": "Direct Atomic Database Decrement with Zero Application Retries",
        "sqlCommand": """UPDATE product_inventory 
SET stock = stock - :quantity 
WHERE product_id = :productId AND stock >= :quantity;

-- In Java/Go:
int updated = jdbcTemplate.update(sql, params);
if (updated == 0) {
  throw new OutOfStockException("Item sold out!");
}""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "Row-level atomic write lock -> Hardware serialize in InnoDB engine at 15,000 TPS, 0 retries",
        "engineExplanation": "Winner! Optimistic locking (@Version) works great for low-contention workloads, but is an anti-pattern for high-contention hotspots because 99% of transactions abort and retry. Atomic decrement ('stock = stock - 1 WHERE stock >= 1') serializes at the database row latch level, completely eliminating retry storms and application exceptions.",
      },
      {
        "id": "strat_exponential_backoff_retry",
        "title": "Add Spring @Retryable with Exponential Backoff (10 retries)",
        "sqlCommand": "@Retryable(value = ObjectOptimisticLockingFailureException.class, maxAttempts = 10)",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 12000,
        "executionPlanSummary": "Massive thread pool queueing, latency explosion, and 85% eventual failure rate",
        "engineExplanation": "Backoff retries do not resolve high contention on a single row; they merely postpone failure while keeping worker threads tied up.",
      },
      {
        "id": "strat_synchronized_java_block",
        "title": "Use synchronized (this) in the Java Spring service layer",
        "sqlCommand": "public synchronized void buyProduct(Long id) { ... }",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 8500,
        "executionPlanSummary": "JVM-level lock only protects a single node; across 10 Kubernetes pods, race conditions remain unchecked",
        "engineExplanation": "JVM synchronized locks do nothing in a distributed microservice environment with multiple application replicas.",
      },
    ],
    "keyTakeaway": "Optimistic locking collapses under high-contention hotspots (flash sales, ticket drops). Use atomic row decrements ('UPDATE ... SET stock = stock - 1 WHERE stock >= 1') to serialize updates cleanly in the engine.",
  },
  {
    "id": "declarative_range_partition_pruning",
    "title": "PostgreSQL Range Partition Pruning Defeated by Dynamic Expression",
    "difficulty": "Senior",
    "category": "partitioning",
    "categoryLabel": "Table Partitioning & Sharding",
    "tableName": "audit_logs (Partitioned by month: 120 partitions)",
    "rowCount": "600,000,000 rows across partitions",
    "tableSizeDisk": "120 GB on disk",
    "slowQuery": """SELECT event_id, user_id, action, event_timestamp
FROM audit_logs
WHERE event_timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days';""",
    "initialCost": 980000,
    "initialLatencyMs": 8900,
    "initialPlanSummary": "Append -> Seq Scan on audit_logs_y2016_m01 ... Seq Scan on audit_logs_y2026_m03 (All 120 partitions scanned!)",
    "businessContext": "Enterprise audit log query searching the past 7 days scans every historical partition dating back to 2016 because the planner cannot perform compile-time partition pruning.",
    "strategies": [
      {
        "id": "strat_enable_runtime_pruning_and_stable_date_optimal",
        "title": "Use Explicit Parameters or Ensure enable_partition_pruning = on with Static Bounds",
        "sqlCommand": """-- Ensure partition pruning is enabled in PostgreSQL:
SET enable_partition_pruning = on;

-- In application query, pass pre-computed timestamp literal or parameter:
-- e.g. WHERE event_timestamp >= '2026-03-18 00:00:00'::timestamptz;
SELECT event_id, user_id, action, event_timestamp
FROM audit_logs
WHERE event_timestamp >= (now() - INTERVAL '7 days')::timestamptz;""",
        "isOptimal": True,
        "resultingCost": 8500,
        "resultingLatencyMs": 42.0,
        "executionPlanSummary": "Append -> Seq/Index Scan on audit_logs_y2026_m03 only (119 partitions pruned!)",
        "engineExplanation": "Winner! When partition pruning is enabled, PostgreSQL can prune partitions at execution time (run-time pruning) for STABLE functions like now(). If dynamic SQL or volatile functions prevent pruning, passing an explicit pre-calculated timestamp boundary allows compile-time pruning, scanning only the 1 relevant partition out of 120.",
      },
      {
        "id": "strat_global_btree_index",
        "title": "Create a Global B-Tree index across all partitions",
        "sqlCommand": "CREATE INDEX idx_global_audit_logs ON audit_logs(event_timestamp);",
        "isOptimal": False,
        "resultingCost": 980000,
        "resultingLatencyMs": 8800,
        "executionPlanSummary": "PostgreSQL does not support global indexes on partitioned tables (creates separate local index per partition)",
        "engineExplanation": "PostgreSQL does not feature global indexes. Creating an index on the root partitioned table creates local indexes on each partition, which does not bypass partition scanning.",
      },
      {
        "id": "strat_subquery_unnest",
        "title": "Wrap in a CTE (WITH recent AS ...) to force evaluation",
        "sqlCommand": "WITH recent AS (SELECT now() - INTERVAL '7 days' AS cutoff) SELECT * FROM audit_logs, recent WHERE event_timestamp >= recent.cutoff;",
        "isOptimal": False,
        "resultingCost": 1250000,
        "resultingLatencyMs": 11500,
        "executionPlanSummary": "Materialized CTE acts as optimization fence -> forces Nested Loop across all partitions",
        "engineExplanation": "CTE fences prevent partition pruning by turning the predicate into an opaque join condition evaluated after partition selection.",
      },
    ],
    "keyTakeaway": "Always verify with EXPLAIN that the planner prunes unused partitions (look for 'Partitions removed by pruning: N'). Avoid volatile expressions in WHERE clauses on partition keys.",
  },
  {
    "id": "hash_partitioning_high_concurrency_writes",
    "title": "B-Tree Right-Edge Page Latch Contention on Monotonic Sequences",
    "difficulty": "Senior",
    "category": "partitioning",
    "categoryLabel": "Table Partitioning & Sharding",
    "tableName": "ledger_entries",
    "rowCount": "200,000,000 rows",
    "tableSizeDisk": "42 GB on disk",
    "slowQuery": """-- 128 application threads inserting high-frequency ledger records:
INSERT INTO ledger_entries (entry_id, account_id, amount, created_at)
VALUES (nextval('ledger_seq'), 84210, 150.00, NOW());""",
    "initialCost": 1.0,
    "initialLatencyMs": 45.0,
    "initialPlanSummary": "InnoDB buffer pool: page latch contention on leaf page of primary key B-Tree (Right-edge insert hotspot)",
    "businessContext": "Financial transaction ledger ingests 50,000 records/sec. Even with fast NVMe SSDs, write throughput throttles because every thread is competing to lock the single rightmost B-Tree index leaf page.",
    "strategies": [
      {
        "id": "strat_hash_partition_or_uuid_optimal",
        "title": "Hash Partition the Table by entry_id or Distribute Ingestion Keys",
        "sqlCommand": """CREATE TABLE ledger_entries (
  entry_id BIGINT NOT NULL,
  account_id BIGINT NOT NULL,
  amount NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (entry_id, account_id)
) PARTITION BY HASH (entry_id);

-- Create 16 hash partitions:
CREATE TABLE ledger_entries_p0 PARTITION OF ledger_entries FOR VALUES WITH (MODULUS 16, REMAINDER 0);
-- ... p1 to p15 ...""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Writes distributed across 16 independent B-Tree leaf pages, eliminating single-page latch bottlenecks",
        "engineExplanation": "Winner! Monotonically increasing sequence IDs cause all concurrent INSERT operations to target the exact same leaf page at the extreme right edge of the B-Tree index, serializing on kernel page latches. Hash partitioning splits inserts across 16 separate B-Trees, multiplying insert concurrency by 16x.",
      },
      {
        "id": "strat_increase_innodb_buffer_pool",
        "title": "Increase innodb_buffer_pool_size to 128GB",
        "sqlCommand": "SET GLOBAL innodb_buffer_pool_size = 137438953472;",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 42.0,
        "executionPlanSummary": "Buffer pool size does not resolve CPU page mutex/rwlock contention on the single target page",
        "engineExplanation": "Page latch contention is an in-memory concurrency problem, not an I/O cache miss. A larger buffer pool does not relieve single-page lock serialization.",
      },
      {
        "id": "strat_disable_primary_key",
        "title": "Drop the PRIMARY KEY to speed up inserts",
        "sqlCommand": "ALTER TABLE ledger_entries DROP PRIMARY KEY;",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 38.0,
        "executionPlanSummary": "InnoDB creates hidden 6-byte DB_ROW_ID which is globally sequenced, reproducing the same latch hotspot",
        "engineExplanation": "In MySQL InnoDB, dropping the primary key causes InnoDB to generate an internal hidden row ID sequence that still concentrates all inserts on one leaf page.",
      },
    ],
    "keyTakeaway": "Monotonic auto-increment keys concentrate write latch contention on the rightmost leaf of the B-Tree index. Hash partitioning or sharded sequences distribute insert pressure across multiple physical index trees.",
  },
  {
    "id": "toast_table_out_of_line_compression",
    "title": "PostgreSQL TOAST Out-of-Line JSONB Thrashing and Decompression Overhead",
    "difficulty": "Senior",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "raw_payloads",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "180 GB (Main: 8 GB, pg_toast: 172 GB)",
    "slowQuery": """SELECT payload_id, metadata->>'status', created_at
FROM raw_payloads
WHERE created_at >= '2026-03-01'
ORDER BY created_at DESC
LIMIT 100;""",
    "initialCost": 85000,
    "initialLatencyMs": 2800,
    "initialPlanSummary": "Bitmap Heap Scan -> Detoast JSONB chunk tuples -> 100 rows fetched requires decompressing 80 MB of TOAST chunk pages",
    "businessContext": "Event sourcing table stores full 500 KB API payloads in a JSONB column. Querying basic status and timestamps is 100x slower than expected due to out-of-line TOAST retrieval.",
    "strategies": [
      {
        "id": "strat_extract_hot_columns_optimal",
        "title": "Extract Filter/Display Fields to Dedicated Columns & Set TOAST Storage to MAIN",
        "sqlCommand": """-- 1. Promote hot metadata property to native indexed column:
ALTER TABLE raw_payloads ADD COLUMN status VARCHAR(32);
UPDATE raw_payloads SET status = metadata->>'status';
CREATE INDEX idx_payloads_created_status ON raw_payloads(created_at DESC, status);

-- 2. Query without accessing the bloated JSONB TOAST column:
SELECT payload_id, status, created_at
FROM raw_payloads
WHERE created_at >= '2026-03-01'
ORDER BY created_at DESC
LIMIT 100;""",
        "isOptimal": True,
        "resultingCost": 14.2,
        "resultingLatencyMs": 1.1,
        "executionPlanSummary": "Index Only Scan on idx_payloads_created_status (TOAST table is never touched)",
        "engineExplanation": "Winner! In PostgreSQL, column values exceeding ~2KB are compressed and moved out-of-line into a separate TOAST table (The Oversized-Attribute Storage Technique). Even if you only extract one key with metadata->>'status', PostgreSQL must fetch and decompress the entire 500KB JSON document from the TOAST table! Promoting hot search attributes to real columns avoids TOAST I/O entirely.",
      },
      {
        "id": "strat_toast_storage_plain",
        "title": "Change column storage mode to PLAIN",
        "sqlCommand": "ALTER TABLE raw_payloads ALTER COLUMN metadata SET STORAGE PLAIN;",
        "isOptimal": False,
        "resultingCost": 85000,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "ERROR: row is too big: size exceeds maximum allowed 8191 bytes for a tuple page",
        "engineExplanation": "STORAGE PLAIN disables compression and out-of-line storage. Any INSERT with payload exceeding 8KB will immediately crash with 'row is too big'.",
      },
      {
        "id": "strat_vacuum_toast_table",
        "title": "Run VACUUM FULL on the pg_toast table",
        "sqlCommand": "VACUUM FULL pg_toast.pg_toast_16842;",
        "isOptimal": False,
        "resultingCost": 85000,
        "resultingLatencyMs": 2700,
        "executionPlanSummary": "Compacts disk space but does not eliminate de-toast decompression latency during queries",
        "engineExplanation": "Compacting TOAST chunks does not eliminate the architectural penalty of fetching and decompressing 500KB blobs during queries.",
      },
    ],
    "keyTakeaway": "Querying fields nested inside out-of-line TOAST columns forces PostgreSQL to load and decompress giant byte blobs. Extract frequently queried keys into native columns with covering indexes.",
  },
  {
    "id": "autovacuum_freeze_max_age_wraparound",
    "title": "Emergency Autovacuum Freeze Triggered by Transaction ID Wraparound",
    "difficulty": "Senior",
    "category": "mvcc",
    "categoryLabel": "MVCC & Engine Mechanics",
    "tableName": "pg_database / all tables",
    "rowCount": "Entire database cluster (2 billion transaction ceiling)",
    "tableSizeDisk": "All tables",
    "slowQuery": """-- Database logs warning:
-- WARNING: database "production" must be vacuumed within 10000000 transactions
-- Followed by aggressive autovacuum worker saturation consuming 100% disk I/O!""",
    "initialCost": 1000000,
    "initialLatencyMs": 60000,
    "initialPlanSummary": "autovacuum: VACUUM (to prevent wraparound) running aggressively on large tables with default cost delays",
    "businessContext": "Production PostgreSQL cluster suddenly launches aggressive autovacuum freeze jobs on all tables. Disk I/O reaches 100%, and application queries begin timing out.",
    "strategies": [
      {
        "id": "strat_tune_autovacuum_io_budget_optimal",
        "title": "Elevate autovacuum_vacuum_cost_limit & autovacuum_max_workers to Complete Freeze Rapidly",
        "sqlCommand": """-- Un-throttle autovacuum during maintenance or wraparound emergency:
ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000; -- Default is weak 200
ALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2;    -- Default is 2ms (or 20ms in older versions)
ALTER SYSTEM SET vacuum_cost_limit = 2000;
SELECT pg_reload_conf();

-- Perform manual parallel vacuum freeze on oldest table:
-- VACUUM FREEZE VERBOSE ANALYZE orders;""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 10.0,
        "executionPlanSummary": "Autovacuum throughput increases by 10x, clearing the 2B transaction freeze queue in 40 minutes instead of stalling for days",
        "engineExplanation": "Winner! PostgreSQL 32-bit transaction IDs (XIDs) wrap around every 2 billion transactions. If autovacuum_freeze_max_age is reached, Postgres launches un-cancelable emergency vacuum freeze. If default autovacuum_vacuum_cost_limit is left at 200, autovacuum sleeps frequently, extending the emergency for days. Raising the cost limit gives vacuum the I/O budget to finish freezing quickly.",
      },
      {
        "id": "strat_turn_off_autovacuum",
        "title": "Disable autovacuum completely with autovacuum = off",
        "sqlCommand": "ALTER SYSTEM SET autovacuum = off; SELECT pg_reload_conf();",
        "isOptimal": False,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "CRITICAL PANIC: PostgreSQL shuts down completely to prevent data corruption when limit reached",
        "engineExplanation": "Catastrophic! Disabling autovacuum prevents freezing. Once the hard 2-billion transaction limit is reached, PostgreSQL shuts down and refuses all connections except standalone single-user mode.",
      },
      {
        "id": "strat_increase_freeze_max_age",
        "title": "Increase autovacuum_freeze_max_age to 10 billion",
        "sqlCommand": "ALTER SYSTEM SET autovacuum_freeze_max_age = 10000000000;",
        "isOptimal": False,
        "resultingCost": 0,
        "resultingLatencyMs": 0,
        "executionPlanSummary": "ERROR: parameter out of range: 32-bit unsigned transaction ID maximum is ~2.1 billion",
        "engineExplanation": "Transaction IDs are 32-bit integers; values cannot exceed 2.14 billion. The engine rejects this setting.",
      },
    ],
    "keyTakeaway": "Transaction ID wraparound is an existential risk in PostgreSQL. When wraparound autovacuum triggers, don't kill it—give it the I/O budget to finish fast by raising autovacuum_vacuum_cost_limit.",
  },
  {
    "id": "extended_statistics_correlated_columns",
    "title": "PostgreSQL Multi-Column Correlation Misleading Cardinality Estimates",
    "difficulty": "Senior",
    "category": "performance",
    "categoryLabel": "Query Optimizer & Statistics",
    "tableName": "car_inventory",
    "rowCount": "10,000,000 rows",
    "tableSizeDisk": "2.8 GB on disk",
    "slowQuery": """SELECT * FROM car_inventory
WHERE make = 'Audi' AND model = 'R8';""",
    "initialCost": 350000,
    "initialLatencyMs": 3200,
    "initialPlanSummary": "Nested Loop Join -> Planner assumes make and model are independent: P(make)*P(model) = 0.01 * 0.001 = 0.00001 (Estimated rows: 1, Actual rows: 250,000!)",
    "businessContext": "Automotive marketplace query performs poorly because the optimizer drastically underestimates result row counts, selecting a disastrous Nested Loop instead of a Hash Join or sequential batch.",
    "strategies": [
      {
        "id": "strat_create_extended_statistics_optimal",
        "title": "Create Extended Statistics (CREATE STATISTICS ... ON (make, model))",
        "sqlCommand": """CREATE STATISTICS stat_cars_make_model 
ON make, model FROM car_inventory;

ANALYZE car_inventory;""",
        "isOptimal": True,
        "resultingCost": 420.0,
        "resultingLatencyMs": 4.5,
        "executionPlanSummary": "Bitmap Heap Scan on idx_make_model -> Planner estimate: 248,000 rows (matches actual 250,000 rows)",
        "engineExplanation": "Winner! By default, the database calculates single-column histograms and assumes column predicates are statistically independent ($P(A \\cap B) = P(A) \\times P(B)$). But 'make' and 'model' are strongly correlated (only Audi makes the R8!). CREATE STATISTICS collects multivariate n-distinct and dependencies data, giving the planner accurate cardinality estimates.",
      },
      {
        "id": "strat_force_hashjoin_hints",
        "title": "Disable nested loop joins with SET enable_nestloop = off",
        "sqlCommand": "SET enable_nestloop = off; SELECT * FROM car_inventory WHERE ...",
        "isOptimal": False,
        "resultingCost": 480000,
        "resultingLatencyMs": 1800,
        "executionPlanSummary": "Forces planner to use Hash Join globally across all queries, penalizing fast sub-millisecond lookups",
        "engineExplanation": "Global session flags like enable_nestloop = off distort the execution plans of every other query in the application session.",
      },
      {
        "id": "strat_increase_default_statistics_target",
        "title": "Increase single-column default_statistics_target to 1000",
        "sqlCommand": "ALTER TABLE car_inventory ALTER COLUMN make SET STATISTICS 1000; ANALYZE car_inventory;",
        "isOptimal": False,
        "resultingCost": 340000,
        "resultingLatencyMs": 3100,
        "executionPlanSummary": "More granular single-column histogram still cannot compute cross-column correlations",
        "engineExplanation": "Single-column statistics targets only deepen individual column sample buckets; they cannot capture multivariate inter-column correlations.",
      },
    ],
    "keyTakeaway": "When columns are correlated (city/state, make/model, category/subcategory), default statistics multiply independent probabilities, causing catastrophic under-estimates. Use CREATE STATISTICS in PostgreSQL.",
  },
  {
    "id": "btree_deduplication_postgres_13",
    "title": "Low-Cardinality Secondary Index Bloat & B-Tree Deduplication",
    "difficulty": "Senior",
    "category": "indexing",
    "categoryLabel": "Indexing Strategies",
    "tableName": "order_events",
    "rowCount": "150,000,000 rows",
    "tableSizeDisk": "28 GB table / 16 GB index on (status)",
    "slowQuery": """-- Index on status has only 4 distinct values ('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED'):
SELECT event_id, created_at 
FROM order_events 
WHERE status = 'FAILED';""",
    "initialCost": 45000,
    "initialLatencyMs": 1450,
    "initialPlanSummary": "Bitmap Heap Scan on idx_order_events_status (16 GB index exceeds RAM cache, massive random I/O)",
    "businessContext": "High-volume event log indexing status code on 150M rows. The status index consumes 16 GB of RAM, causing buffer cache churn and slowing writes.",
    "strategies": [
      {
        "id": "strat_reindex_with_deduplication_optimal",
        "title": "Rebuild Index with B-Tree Deduplication Enabled (deduplicate_items = on)",
        "sqlCommand": """-- PostgreSQL 13+ default feature:
REINDEX INDEX CONCURRENTLY idx_order_events_status;
-- Or explicitly:
-- CREATE INDEX idx_order_events_status ON order_events(status) WITH (deduplicate_items = on);""",
        "isOptimal": True,
        "resultingCost": 8500,
        "resultingLatencyMs": 65.0,
        "executionPlanSummary": "Bitmap Index Scan -> Index size shrinks from 16 GB to 3.2 GB (80% memory reduction), 100% cached in RAM",
        "engineExplanation": "Winner! In PostgreSQL 13+, B-Tree deduplication merges identical keys into a posting list of tuple pointers (TIDs). For low-cardinality columns with millions of duplicate values, deduplication shrinks index disk footprint by 70-85%, keeping the entire index pinned in memory and accelerating range scans.",
      },
      {
        "id": "strat_replace_with_gin_index",
        "title": "Replace B-Tree with a GIN (Generalized Inverted) Index",
        "sqlCommand": "CREATE INDEX idx_status_gin ON order_events USING GIN(status);",
        "isOptimal": False,
        "resultingCost": 52000,
        "resultingLatencyMs": 850,
        "executionPlanSummary": "GIN index build takes 2 hours; insert throughput drops 10x due to GIN pending list overhead",
        "engineExplanation": "GIN indexes have heavy write overhead and slow insert throughput, making them unsuitable for high-write transactional OLTP tables.",
      },
      {
        "id": "strat_drop_index_status",
        "title": "Drop the index and rely on Sequential Scan",
        "sqlCommand": "DROP INDEX idx_order_events_status;",
        "isOptimal": False,
        "resultingCost": 850000,
        "resultingLatencyMs": 18000,
        "executionPlanSummary": "Parallel Seq Scan on 150M rows -> 18 seconds response time",
        "engineExplanation": "Dropping the index forces full scans of 28 GB of data for every status query, crashing dashboard response times.",
      },
    ],
    "keyTakeaway": "Low-cardinality indexes in PostgreSQL 13+ benefit enormously from B-Tree deduplication (deduplicate_items = on), reducing index memory consumption by up to 80% while speeding up scans.",
  },
  {
    "id": "unlogged_table_transient_session_cache",
    "title": "WAL Disk Thrashing from High-Churn Transient Session Tables",
    "difficulty": "Senior",
    "category": "storage",
    "categoryLabel": "Storage Engine & Data Layout",
    "tableName": "user_session_cache",
    "rowCount": "20,000,000 active sessions",
    "tableSizeDisk": "8.5 GB on disk",
    "slowQuery": """-- Microservice authentication checks and writes tokens every 1ms:
INSERT INTO user_session_cache (token, user_id, expires_at)
VALUES ('tok_9823f...', 49012, NOW() + INTERVAL '2 hours')
ON CONFLICT (token) DO UPDATE SET last_accessed = NOW();""",
    "initialCost": 8.4,
    "initialLatencyMs": 28.0,
    "initialPlanSummary": "Insert on user_session_cache -> WAL write throughput bottlenecks on disk fsync (150 MB/sec WAL generated)",
    "businessContext": "Authentication token table generates massive WAL write traffic, consuming 60% of total SSD IOPS and saturating replica streaming bandwidth for non-critical transient session data.",
    "strategies": [
      {
        "id": "strat_convert_to_unlogged_optimal",
        "title": "Convert Table to UNLOGGED with In-Memory Caching",
        "sqlCommand": """-- For transient session data where crash loss is acceptable:
ALTER TABLE user_session_cache SET UNLOGGED;

-- Re-enable autovacuum with aggressive settings:
ALTER TABLE user_session_cache SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_vacuum_cost_limit = 1000
);""",
        "isOptimal": True,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.9,
        "executionPlanSummary": "Zero WAL writes generated -> IOPS drop by 90%, insert throughput jumps 5x",
        "engineExplanation": "Winner! UNLOGGED tables bypass write-ahead logging (WAL) entirely. Data is written directly to shared buffers and table files without disk fsync on every transaction commit. Writes are 3x to 5x faster. Note: UNLOGGED tables are truncated to empty upon a database crash, which is acceptable for ephemeral session caches.",
      },
      {
        "id": "strat_disable_fsync_globally",
        "title": "Set fsync = off in postgresql.conf",
        "sqlCommand": "ALTER SYSTEM SET fsync = off; SELECT pg_reload_conf();",
        "isOptimal": False,
        "resultingCost": 4.2,
        "resultingLatencyMs": 0.8,
        "executionPlanSummary": "CRITICAL RISK: Entire database cluster will suffer total unrecoverable data corruption on power loss",
        "engineExplanation": "Never disable fsync globally! Power loss or server crash will render the entire database cluster corrupt and unstartable.",
      },
      {
        "id": "strat_drop_session_index",
        "title": "Drop the primary key index on token",
        "sqlCommand": "ALTER TABLE user_session_cache DROP CONSTRAINT user_session_cache_pkey;",
        "isOptimal": False,
        "resultingCost": 450000,
        "resultingLatencyMs": 5200,
        "executionPlanSummary": "Breaks ON CONFLICT clause and turns token verification into full table scan",
        "engineExplanation": "Dropping the key disables conflict resolution and makes token lookups scan 20 million rows sequentially.",
      },
    ],
    "keyTakeaway": "For ephemeral, reconstructible caching tables (sessions, scratch spaces), PostgreSQL UNLOGGED tables eliminate WAL generation, delivering massive write throughput improvements.",
  },
  {
    "id": "wal_keep_size_vs_replication_slots",
    "title": "Streaming Replica Disconnection: WAL Recycling vs Replication Slots",
    "difficulty": "Senior",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "pg_stat_replication",
    "rowCount": "3 streaming read replicas",
    "tableSizeDisk": "Replication stream",
    "slowQuery": """-- Read replica terminates with:
-- FATAL: requested WAL segment 0000000100000A1200000045 has already been removed
-- Replica enters disconnected error state!""",
    "initialCost": 1.0,
    "initialLatencyMs": 5.0,
    "initialPlanSummary": "Replica lags behind primary during heavy batch job -> Primary recycled old WAL segments before replica could fetch them",
    "businessContext": "During an overnight data warehouse import, read replicas fail with 'requested WAL segment has already been removed'. Replicas must be completely rebuilt from pg_basebackup, causing hours of lost read capacity.",
    "strategies": [
      {
        "id": "strat_configure_replication_slots_optimal",
        "title": "Use Physical Replication Slots with max_slot_wal_keep_size Ceiling",
        "sqlCommand": """-- On primary database:
SELECT pg_create_physical_replication_slot('replica_read_01');

-- In replica postgresql.conf:
-- primary_slot_name = 'replica_read_01'

-- On primary: set safety ceiling so broken replica cannot fill disk:
ALTER SYSTEM SET max_slot_wal_keep_size = '100GB';
SELECT pg_reload_conf();""",
        "isOptimal": True,
        "resultingCost": 1.0,
        "resultingLatencyMs": 1.0,
        "executionPlanSummary": "Physical slot retains exact required WAL segments on primary until replica confirms receipt",
        "engineExplanation": "Winner! Without replication slots, the primary database recycles WAL once wal_keep_size is exceeded, regardless of whether replicas have processed it. A physical replication slot instructs the primary checkpointer to never delete WAL needed by that replica. Setting max_slot_wal_keep_size acts as an emergency circuit breaker to prevent primary disk full panics.",
      },
      {
        "id": "strat_increase_wal_keep_size_unbounded",
        "title": "Set wal_keep_size = '1TB' in postgresql.conf",
        "sqlCommand": "ALTER SYSTEM SET wal_keep_size = '1TB'; SELECT pg_reload_conf();",
        "isOptimal": False,
        "resultingCost": 1.0,
        "resultingLatencyMs": 2.0,
        "executionPlanSummary": "Permanent 1 TB disk space reservation even when replicas are fully in sync",
        "engineExplanation": "wal_keep_size statically reserves disk space even when replicas are healthy, and can still be exceeded during giant bulk operations.",
      },
      {
        "id": "strat_switch_to_logical_dump",
        "title": "Replace streaming replication with hourly pg_dump restore",
        "sqlCommand": "pg_dump -Fc mydb > backup.dump && pg_restore -d mydb_replica backup.dump",
        "isOptimal": False,
        "resultingCost": 900000,
        "resultingLatencyMs": 3600000,
        "executionPlanSummary": "1 hour data latency and huge CPU load rebuilding tables on replica every hour",
        "engineExplanation": "Periodic pg_dump is not a high-availability replication solution; it introduces massive recovery point objective (RPO) and high CPU consumption.",
      },
    ],
    "keyTakeaway": "Streaming replicas disconnect when the primary purges WAL they still need. Use physical replication slots (primary_slot_name) bounded by max_slot_wal_keep_size.",
  },
  {
    "id": "statement_vs_row_binlog_replication_drift",
    "title": "MySQL Statement-Based Replication Drift from Non-Deterministic Functions",
    "difficulty": "Senior",
    "category": "replication",
    "categoryLabel": "High Availability & Replication",
    "tableName": "audit_logs",
    "rowCount": "40,000,000 rows",
    "tableSizeDisk": "9.5 GB on disk",
    "slowQuery": """-- Statement executed on primary under binlog_format = STATEMENT:
INSERT INTO audit_logs (log_id, user_id, generated_token, created_at)
VALUES (DEFAULT, 1024, UUID(), NOW());
-- Primary and Read Replica now have DIFFERENT UUID() values!""",
    "initialCost": 8.4,
    "initialLatencyMs": 1.5,
    "initialPlanSummary": "Replication warning: Statement is not safe to log in statement format -> UUID() evaluates differently on replica",
    "businessContext": "Primary database and read replica silently drift out of sync. When clients read from replicas, security token verification fails because UUID() generated different tokens on replica vs primary.",
    "strategies": [
      {
        "id": "strat_switch_row_binlog_optimal",
        "title": "Enforce binlog_format = ROW with binlog_row_image = FULL",
        "sqlCommand": """-- Enforce Row-Based Replication globally:
SET GLOBAL binlog_format = 'ROW';
SET GLOBAL binlog_row_image = 'FULL';

-- In my.cnf configuration file:
-- binlog_format = ROW
-- binlog_row_image = FULL""",
        "isOptimal": True,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "Row-Based Replication logs the exact physical post-execution row values, guaranteeing bit-for-bit consistency",
        "engineExplanation": "Winner! Under Statement-Based Replication (SBR), the replica re-executes the exact SQL text. Non-deterministic functions (UUID(), RAND(), NOW(), CURRENT_TIMESTAMP) or LIMIT clauses without ORDER BY produce different data on the replica! Row-Based Replication (RBR) logs the exact evaluated row values, eliminating replication data drift completely.",
      },
      {
        "id": "strat_switch_mixed_binlog",
        "title": "Set binlog_format = MIXED",
        "sqlCommand": "SET GLOBAL binlog_format = 'MIXED';",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.2,
        "executionPlanSummary": "MIXED mode relies on heuristics and can still miss subtle non-deterministic trigger and stored procedure side-effects",
        "engineExplanation": "While MIXED switches to ROW for obvious functions like UUID(), it can fail on complex triggers or non-deterministic user-defined functions.",
      },
      {
        "id": "strat_pass_constant_uuid_from_app",
        "title": "Generate UUID in Java/Go application code only",
        "sqlCommand": "INSERT INTO audit_logs (log_id, user_id, generated_token, created_at) VALUES (DEFAULT, 1024, 'fixed-uuid-str', '2026-03-24 10:00:00');",
        "isOptimal": False,
        "resultingCost": 8.4,
        "resultingLatencyMs": 1.4,
        "executionPlanSummary": "Solves this one query but leaves the database vulnerable to any other non-deterministic statement",
        "engineExplanation": "Application-level fixes do not prevent future developers or ad-hoc SQL updates from corrupting replication.",
      },
    ],
    "keyTakeaway": "Statement-Based Replication causes silent data corruption when using non-deterministic SQL functions. Always configure binlog_format = ROW for production MySQL clusters.",
  },
]
