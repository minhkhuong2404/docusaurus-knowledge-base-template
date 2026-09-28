---
id: long-transactions-undo-mdl-meltdown
title: "How Long Transactions Kill Services: Undo Log Bloat, Rollback Traps & The MDL Cascade"
sidebar_label: "Long Transactions & The MDL Cascade"
description: "Physical mechanisms of long-running transaction failures: Undo tablespace and History List Length (HLL) bloat, the single-threaded rollback trap, the critical difference between KILL QUERY and KILL CONNECTION, and the Metadata Lock (MDL) queue cascade exhausting connection pools."
tags: [database, mysql, long-transaction, undo-log, mdl, metadata-lock, connection-pool, rollback, sre]
sidebar_position: 10
---

import LongTransactionMdlMeltdownDiagram from '@site/src/components/LongTransactionMdlMeltdownDiagram';

# How Long Transactions Kill Services: Undo Log Bloat, Rollback Traps & The MDL Cascade

In microservices architectures, the most severe database outages often do not originate from sudden traffic spikes. They originate from **a single long-running transaction**.

Common triggers include:
- An analytical reporting query executing for 10 minutes on a primary database.
- A bulk `UPDATE` modifying millions of rows executed via a developer GUI where the user forgot to issue `COMMIT`.
- Application code that opens a `@Transactional` block, executes an external HTTP call to a payment gateway, and stalls during a 30-second network blip.

The impact of a long transaction is rarely confined to its own connection. It triggers a **cascading engine meltdown**: Undo tablespaces bloat uncontrollably, rollbacks lock server I/O, and the **Metadata Lock (MDL) queue cascade** evaporates the application connection pool in seconds.

<LongTransactionMdlMeltdownDiagram initialTab="mdl_cascade" />

---

## 1. The Metadata Lock (MDL) Queue Cascade: How 1 Long Query Tanks the Platform

Consider the following timeline that has taken down major consumer platforms:

```text
The 4-Phase Metadata Lock Cascade:
Phase 1: Long Read Query ──> SELECT * FROM orders WHERE ... (Runs 5 min, holds MDL Shared Read)
                                   │
Phase 2: Migration / DDL ──> ALTER TABLE orders ADD COLUMN ... (Requires MDL Exclusive ➔ BLOCKED by Phase 1!)
                                   │
Phase 3: Priority Inversion ─> MySQL Queue places DDL at HEAD of wait queue (Writer Starvation Prevention)
                                   │
Phase 4: Platform Meltdown ──> Thousands of fast 1ms user queries: SELECT * FROM orders WHERE id = ?
                               QUEUE BEHIND THE PENDING DDL STATEMENT!
                               HikariCP connection pool exhausted in 3 seconds ➔ Cascading HTTP 500s!
```

<LongTransactionMdlMeltdownDiagram initialTab="mdl_cascade" />

### Why Do 1ms SELECT Queries Get Blocked?
Developers often wonder: *"MySQL permits multiple concurrent SELECT queries (Shared Read Locks are mutually compatible). Why would a quick user query get blocked?"*

The root cause is **MySQL's lock acquisition queue prioritization**:
1. To prevent DDL (`ALTER TABLE`) statements from being starved indefinitely by an endless stream of inbound `SELECT` queries, **MySQL prioritizes Exclusive (Write) Lock requests in the wait queue**.
2. Once the DDL enters the wait queue with the status `Waiting for table metadata lock`:
   - **All subsequent queries (including simple `SELECT` statements) must wait behind that DDL**!
   - No new statement is permitted to access the `orders` table until the DDL acquires its lock and finishes.
3. Within seconds, application thread pools saturate waiting for database connections. The entire platform halts.

---

## 2. Undo Log Bloat & The MVCC Purge Stall

A long transaction does not just hold metadata locks; it **paralyzes the database garbage collection mechanism**.

<LongTransactionMdlMeltdownDiagram initialTab="undo_bloat" />

### What is History List Length (HLL)?
In InnoDB, when a transaction performs an `UPDATE` or `DELETE`, the previous version of the record is preserved in the **Undo Log** to:
- Facilitate `ROLLBACK` if needed.
- Provide snapshot read consistency for concurrent transactions under MVCC.

When a transaction begins, it establishes a **ReadView** (recording the oldest active transaction ID at that moment).
- InnoDB's background **Master Purge Thread** is responsible for freeing undo log pages that are no longer visible to any active transaction.
- **The Core Invariant**: *If an Undo Log record was created after the ReadView of an active long transaction, InnoDB CANNOT purge it!*

### The Impact of Purge Stalls
- The **`History list length` (HLL)** metric reported in `SHOW ENGINE INNODB STATUS` balloons from double digits into the millions.
- Undo tablespaces (`undo_001`, `undo_002`) expand from 100MB to 50GB+, consuming disk capacity.
- Query performance degrades globally across the entire database because rows point to lengthy undo history chains (`roll_ptr`), forcing the engine to traverse thousands of older versions in memory to reconstruct snapshots.

---

## 3. The Unstoppable Single-Threaded Rollback Trap & The `kill -9` Disaster

Consider an accidental query executed on production:
```sql
UPDATE orders SET status = 'CANCELLED'; -- Missing WHERE clause! (5 million rows affected)
```
After 5 minutes of execution, the engineer hits **Cancel** in their IDE, or an operator attempts to terminate the process.

```text
The Asymmetry of Execution vs Rollback:
UPDATE Execution (Batch/Pipelined) ──(Took 5 minutes to mutate 5M rows)──>
Rollback (SINGLE-THREADED, RANDOM)  ──(Requires 10 to 15 minutes of random I/O to undo!)──>
```

<LongTransactionMdlMeltdownDiagram initialTab="rollback_trap" />

### Why Rollback Takes Significantly Longer Than Execution
1. **Rollback is Single-Threaded**: InnoDB must sequentially read each undo record from disk, fetch the target data page into the Buffer Pool, restore the previous value, and reverse all associated secondary index updates.
2. **Random Disk I/O**: While updates frequently benefit from sequential Redo Log writes, rolling back modifications across a large table requires random page lookups, saturating disk I/O at 100%.

### ⛔ CRITICAL WARNING: NEVER RESTART THE DATABASE TO STOP A ROLLBACK!
Under severe pressure, operators sometimes issue:
```bash
# ❌ THIS EXTENDS DOWNTIME BY HOURS:
sudo systemctl restart mysql # Or kill -9 mysqld
```
**The Resulting Outage**:
- Upon reboot, MySQL detects an unclean shutdown and initiates **Crash Recovery**.
- Under ACID durability requirements, **the database must complete the Undo Phase to roll back uncommitted transactions BEFORE accepting client connections**!
- Instead of the database serving other tables while rollback proceeds in the background, restarting the service leaves **the entire database unavailable in the `Starting MySQL Database Server...` state for hours**.

---

## 4. `KILL QUERY` vs `KILL CONNECTION`: Two Radically Different Outcomes

When attempting to terminate a runaway transaction, selecting the wrong command exacerbates the incident:

<LongTransactionMdlMeltdownDiagram initialTab="kill_query_diff" />

### `KILL QUERY <thread_id>` (Aborts Statement, LEAVES TRANSACTION OPEN)
- Sends an interruption signal to the currently executing SQL statement on that thread.
- The statement halts with `Query execution was interrupted`.
- **THE CRITICAL TRAP**: **The underlying transaction remains ACTIVE and OPEN!**
- All Row Locks and Metadata Locks acquired by preceding statements in that transaction **remain held**. The outage continues unabated.

### `KILL CONNECTION <thread_id>` (Terminates Session & Cleans Locks)
- Immediately terminates the physical TCP socket and worker thread.
- MySQL detects client disconnection and **automatically triggers transaction rollback**.
- All held Metadata Locks and row locks are released, immediately resolving the lock queue cascade.

> **Operational Directive**: During lock contention incidents, **always issue `KILL CONNECTION <id>` (or simply `KILL <id>`)**. Never use `KILL QUERY`.

---

## 5. Production Prevention Playbook

1. **Enforce Strict Metadata Lock Wait Timeouts**:
   Prevent DDL migrations from queuing indefinitely and blocking user queries:
   ```sql
   -- Limit DDL lock wait time to 5 seconds; fail immediately if blocked:
   SET SESSION lock_wait_timeout = 5;
   ALTER TABLE orders ADD COLUMN status_code INT;
   ```
2. **Never Execute Network Calls Inside `@Transactional` Blocks**:
   External API calls (payment gateways, notification services, HTTP clients) must remain **outside transaction boundaries**. Transactions should strictly encapsulate SQL statements and complete in under **50 milliseconds**.
3. **Configure Automatic Query Execution Ceilings**:
   ```sql
   -- Automatically terminate read queries exceeding 30 seconds:
   SET GLOBAL max_execution_time = 30000;
   ```
