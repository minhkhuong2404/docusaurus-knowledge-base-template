---
id: mysql-deadlocks-gap-locks-internals
title: "Why You Deadlock Touching Only 1 Row: Gap Locks & The 3 Access Paths of WHERE"
sidebar_label: "Deadlocks Touching 1 Row (Gap Locks)"
description: "Deep dive into MySQL InnoDB storage engine locking mechanics: why two users updating distinct draft carts trigger Deadlock 1213, decoding the 3 access paths of a WHERE clause, and why READ COMMITTED won't save you."
tags: [database, mysql, innodb, locks, deadlock, gap-lock, next-key-lock, isolation-levels, concurrency]
sidebar_position: 5
---

import MysqlDeadlockGapLockDiagram from '@site/src/components/MysqlDeadlockGapLockDiagram';

# Why You Deadlock Touching Only 1 Row: Gap Locks & The 3 Access Paths of WHERE

In high-concurrency e-commerce and multi-tenant SaaS architectures, one of the most baffling and heated production incidents surfaces with a single error code:

```text
ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction
```

When reviewing application logs, developers often swear on their code: *"Every user has exactly one draft cart. User A updates Cart A (`id = 10`), while User B updates Cart B (`id = 12`). These two records are completely independent. How on earth can the database report a Deadlock?"*

The root cause lies in **the physical locking mechanics of MySQL's InnoDB storage engine**, the emergence of **Gap Locks** under the default `REPEATABLE READ` isolation level, and **the three fundamentally different access paths of an identical `WHERE` clause**.

<MysqlDeadlockGapLockDiagram initialTab="access_paths" />

---

## 1. The Classic Incident: The Two Draft Carts Scenario

Consider an e-commerce table storing shopping cart states:

```sql
CREATE TABLE carts (
    id         BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_user_id (user_id)
) ENGINE=InnoDB;
```

Suppose the table currently contains completed carts with IDs `5`, `15`, and `25`.
- **User A** (who does not yet have a cart) sends a request: the service executes `SELECT * FROM carts WHERE id = 10 FOR UPDATE;`.
- **User B** (also without a cart) sends a concurrent request: the service executes `SELECT * FROM carts WHERE id = 12 FOR UPDATE;`.

```text
Step-by-Step Deadlock Timeline in InnoDB:
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ Transaction A (User A)               │ Transaction B (User B)               │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ 1. BEGIN;                            │                                      │
│ 2. SELECT * FROM carts               │                                      │
│    WHERE id = 10 FOR UPDATE;         │                                      │
│    (Record 10 does NOT exist!)       │                                      │
│    ➔ Acquires GAP LOCK on (5, 15)   │                                      │
│                                      │ 3. BEGIN;                            │
│                                      │ 4. SELECT * FROM carts               │
│                                      │    WHERE id = 12 FOR UPDATE;         │
│                                      │    (Record 12 does NOT exist!)       │
│                                      │    ➔ Acquires GAP LOCK on (5, 15)   │
│                                      │                                      │
│ 5. INSERT INTO carts (id, user_id)   │                                      │
│    VALUES (10, 101);                 │                                      │
│    ➔ Requests Insert Intention (10)  │                                      │
│    ➔ BLOCKED by Tx B's Gap Lock!     │                                      │
│                                      │ 6. INSERT INTO carts (id, user_id)   │
│                                      │    VALUES (12, 102);                 │
│                                      │    ➔ Requests Insert Intention (12)  │
│                                      │    ➔ BLOCKED by Tx A's Gap Lock!     │
│                                      │    💥 DEADLOCK DETECTED!             │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

<MysqlDeadlockGapLockDiagram initialTab="cart_deadlock" />

### The Physical Nature of Gap Locks: Blocking Inserts, Not Each Other
- In InnoDB, the sole purpose of a **Gap Lock** is to prevent phantom rows (Phantom Reads)—meaning it prevents other transactions from inserting new rows into the gap between existing index values.
- Crucially, **multiple transactions can hold conflicting-type Gap Locks on the exact same gap concurrently**. Step 2 and Step 4 both succeed effortlessly without any lock conflict!
- The trap snaps shut at Step 5: when Transaction A attempts to insert a new row (`INSERT`), it must obtain an **Insert Intention Lock** (a special type of gap lock). An Insert Intention Lock is incompatible with an existing Gap Lock held by Transaction B $\to$ Tx A must wait for Tx B.
- Immediately afterward, Tx B also attempts to insert into that same gap $\to$ Tx B requests an Insert Intention Lock, which is incompatible with Tx A's Gap Lock $\to$ Tx B must wait for Tx A.
- A circular dependency in InnoDB's **Wait-For Graph** is formed. InnoDB's internal deadlock detector triggers and terminates one of the transactions with a `ROLLBACK`.

---

## 2. The Three Access Paths of the Same `WHERE` Clause

Consider this standard statement:
```sql
UPDATE carts SET status = 'ACTIVE' WHERE <condition>;
```
Depending on whether the column in the `WHERE` clause is indexed, and what type of index it possesses, InnoDB activates one of three radically different lock paths:

```text
The 3 Physical Access Paths of WHERE in InnoDB:
1. Clustered PK Exact Seek (id = 42):
   └── Clustered B+Tree ──> Locks exactly 1 Record Lock (X) [Safest, minimal blast radius]

2. Secondary Index Lookup (user_id = 99):
   ├── Secondary B+Tree ───> Record Lock + Gap Lock on idx_user_id
   └── Clustered B+Tree ───> Follows PK pointer ➔ Record Lock on PK [Asymmetric lock hazard]

3. Unindexed Column / Table Scan (cart_token = 'xyz'):
   └── Clustered B+Tree ───> FULL TABLE SCAN
                             Next-Key Locks EVERY SINGLE RECORD and GAP in the entire table!
```

### Path 1: Clustered Primary Key Seek (Record Lock Only)
- When the query filters on `WHERE id = 42` (Primary Key or Unique Index with non-null columns) using an equality operator (`=`):
- InnoDB knows with mathematical certainty that **at most one record can possibly match**.
- Optimization: InnoDB **downgrades the Next-Key Lock into a single Record Lock (X)**. No Gap Lock is placed. Other transactions are completely free to insert records with `id = 41` or `id = 43` without being blocked.

### Path 2: Non-Unique Secondary Index Lookup (Two-Tier B+Tree Locking)
- When filtering on `WHERE user_id = 99` (a standard non-unique secondary index):
- Because a single `user_id` could have multiple records inserted in the future, InnoDB must lock both the existing record and **the entire gap before and after** that value in the secondary index B+Tree to prevent phantom reads under `REPEATABLE READ`.
- Then, the engine traverses the primary key pointer back to the Clustered Index B+Tree to place an exclusive Record Lock on the actual row data.
- **Asymmetric Deadlock Hazard**: If Transaction 1 locks the Secondary Index first and then resolves the Clustered Index, while Transaction 2 updates by Primary Key (locking Clustered first, then Secondary), the two transactions lock physical resources in opposite directions and deadlock immediately.

### Path 3: Unindexed Column (Table Scan — Catastrophic Whole-Table Lock)
- When filtering on an unindexed column (e.g., `WHERE cart_token = 'abc'`):
- The storage engine cannot perform a B+Tree seek. It must scan sequentially through every page in the Clustered Index from beginning to end, handing rows up to the MySQL server layer to evaluate the condition.
- **Catastrophic Impact**: In `REPEATABLE READ`, as it scans, **InnoDB acquires Next-Key Locks on every single record and every gap in the entire table**!
- Every concurrent `INSERT`, `UPDATE`, or `DELETE` targeting the `carts` table across the entire cluster is instantly blocked or deadlocked until this transaction commits.

---

## 3. Why `READ COMMITTED` Won't Completely Save You

Many articles recommend switching to `SET TRANSACTION ISOLATION LEVEL READ COMMITTED;` because this level eliminates gap locks for standard read and update operations. However, in high-throughput production workloads, **deadlocks still regularly occur in READ COMMITTED** due to three mandatory engine mechanisms:

<MysqlDeadlockGapLockDiagram initialTab="read_committed" />

### 1. Foreign Key Verification Shared Locks (S-Locks)
When inserting into a child table referencing a parent table:
```sql
-- Transaction on orders (child table):
INSERT INTO orders (user_id, total) VALUES (42, 500);
```
To guarantee referential integrity, InnoDB must verify that `user_id = 42` exists in the parent `users` table:
- This check **automatically acquires a Shared Record Lock (S-Lock) on `id = 42` of the parent table**, regardless of isolation level!
- If two transactions insert child rows for different users while concurrently updating parent rows, or if one transaction deletes a parent row while another inserts a child row, these S-Locks attempt to upgrade to Exclusive Locks (X-Locks), producing immediate deadlocks.

### 2. Unique Constraint Verification on Duplicate INSERTs
When executing `INSERT` or `INSERT ... ON DUPLICATE KEY UPDATE` on a table with a Unique Key:
- If a duplicate value already exists, InnoDB cannot simply discard the write. It **must acquire a Shared Next-Key Lock (S-Lock)** on the duplicate record to inspect its visibility in the MVCC read view.
- Consider Transactions 1, 2, and 3 inserting the same unique value concurrently:
  1. Tx 1 acquires an exclusive X-Lock and waits before committing.
  2. Tx 2 and Tx 3 detect the duplicate key $\to$ both queue up requesting **S Next-Key Locks**.
  3. Tx 1 unexpectedly issues a `ROLLBACK`.
  4. Both Tx 2 and Tx 3 are granted their **S Next-Key Locks** simultaneously.
  5. Both now proceed with their insert, requiring an upgrade from S-Lock to **X-Lock**.
  6. Because each transaction's S-Lock blocks the other's requested X-Lock $\to$ **100% Guaranteed Deadlock**!

### 3. Limitations of Semi-Consistent Read
Under `READ COMMITTED`, InnoDB employs *Semi-Consistent Read*: during `UPDATE` operations, if a row evaluated by the server does not match the `WHERE` condition, InnoDB releases the lock on that non-matching row early rather than holding it until transaction commit.
- **The Caveat**: Early release only applies to **unmatched rows**. For all rows that match the filter, exclusive X-Locks are retained until final `COMMIT`.
- If two concurrent updates touch overlapping row sets in differing physical B+Tree traversal orders, deadlocks remain inevitable.

---

## 4. Production Deadlock Remediation Runbook

```text
The Golden Rules of Deadlock Prevention:
1. Deterministic Lock Ordering: Sort all target IDs in ascending order in application memory before querying.
2. Never SELECT ... FOR UPDATE on non-existent rows (avoid gap lock traps).
3. Ensure every UPDATE and DELETE hits a unique index (Primary Key or Unique Key).
```

### Playbook 1: In-Memory ID Sorting Before Batch Operations
If a service needs to lock or update multiple records in a single transaction, always sort the IDs in ascending order in application memory before firing SQL:

```java
// ✅ Guarantees all threads acquire locks in the exact order: 1 -> 2 -> 3
public void updateMultipleCarts(List<Long> cartIds) {
    List<Long> sortedIds = cartIds.stream().sorted().toList();
    for (Long id : sortedIds) {
        cartRepository.updateStatusForUpdate(id, "PROCESSED");
    }
}
```

### Playbook 2: Replace Speculative SELECT FOR UPDATE with Atomic Upsert
Instead of checking for existence before inserting:

```sql
-- ❌ DANGEROUS: Places Gap Locks on empty spaces
SELECT * FROM carts WHERE user_id = :userId FOR UPDATE;
-- If empty, then INSERT ...

-- ✅ SAFE: Rely on Unique Constraints with Atomic Upsert
INSERT INTO carts (user_id, status) VALUES (:userId, 'DRAFT')
ON DUPLICATE KEY UPDATE updated_at = NOW();
```

### Playbook 3: Decoding Deadlocks with Engine Status
Whenever Error 1213 occurs, immediately inspect the exact physical locks and conflicting statements:

```sql
SHOW ENGINE INNODB STATUS\G
```

Locate the `------------------------ LATEST DETECTED DEADLOCK ------------------------` section:
- Inspect `*** (1) TRANSACTION` and `*** (2) TRANSACTION` to identify the conflicting SQL queries and connection thread IDs.
- Check `lock_mode X waiting` vs `lock mode S waiting` to pinpoint whether the conflict was caused by an Insert Intention Lock waiting on a Gap Lock, or a lock upgrade.
- Identify the exact index name (`idx_user_id` or `PRIMARY`) to determine whether missing indexes or asymmetric access paths caused the deadlock.
