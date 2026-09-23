---
id: postgresql-update-locking-mechanics
title: "What PostgreSQL Locks on UPDATE: In-Place xmax, 4 Row Lock Modes, EvalPlanQual & SSI"
sidebar_label: "PostgreSQL UPDATE Locks & xmax"
description: "Physical engine mechanics of PostgreSQL row locking: how xmax writes locks directly into tuple headers without a lock table, the 4 row lock modes matrix, foreign key collisions, EvalPlanQual rechecks, and why SSI serializable aborts are by design."
tags: [database, postgresql, locking, xmax, row-lock, foreign-key, eval-plan-qual, ssi, serializable]
sidebar_position: 8
---

import PostgresUpdateLockingDiagram from '@site/src/components/PostgresUpdateLockingDiagram';

# What PostgreSQL Locks on UPDATE: In-Place xmax, 4 Row Lock Modes, EvalPlanQual & SSI

Engineers transitioning from MySQL to PostgreSQL often carry assumptions formed by InnoDB: they assume the database maintains an in-memory "Lock Table" tracking every locked row and transaction handle.

When working with PostgreSQL under load, they encounter puzzling phenomena:
- An `UPDATE` modifying 100 million rows consumes **zero additional bytes of RAM for locks**.
- Updating a user's display name unexpectedly **blocks concurrent order creation for that user**, despite modifying entirely different tables.
- Under `SERIALIZABLE` isolation, the database frequently terminates transactions with `could not serialize access due to read/write dependencies` even though the concurrent operations touched disjoint rows.

This article dissects the physical engine mechanics of PostgreSQL row locking via the `xmax` tuple header, maps the compatibility matrix across the four physical row lock modes, examines the `EvalPlanQual` (EPQ) re-evaluation algorithm, and clarifies why SSI false positives are a mathematical consequence of design.

<PostgresUpdateLockingDiagram initialTab="xmax_storage" />

---

## 1. No Lock Table: `xmax` Writes Locks Directly into Tuples

The fundamental architectural difference between PostgreSQL and MySQL InnoDB lies in how row-level locks are physically stored:

```text
Row Lock Storage Mechanics Compared:
MySQL InnoDB:
└── Lock Manager (In-Memory Hash Table) ──> Allocates Lock Structs in RAM
    └── Locking 100M rows ➔ Consumes gigabytes of RAM in the Lock System!

PostgreSQL:
└── Slotted Page (8KB Block in Shared Buffers / Disk)
    └── HeapTupleHeaderData (23 Bytes)
        ├── t_xmin: Transaction ID of creator
        ├── t_xmax: DIRECTLY RECORDS THE TRANSACTION ID HOLDING THE LOCK!
        └── t_infomask: Status bits (HEAP_XMAX_EXCL_LOCK, HEAP_XMAX_IS_MULTI...)
```

### Physical Mechanics of `t_xmax`
Consider an update statement:
```sql
UPDATE accounts SET balance = balance - 100 WHERE id = 42;
```
1. PostgreSQL identifies the 8KB slotted page containing the row `id = 42`.
2. It writes the active Transaction ID (e.g., `1005`) directly into the **`t_xmax`** field inside the 23-byte `HeapTupleHeaderData` on the physical data page, toggling lock flags in `t_infomask`.
3. **When Transaction B attempts to read or update this row**:
   - Transaction B inspects `t_xmax = 1005`.
   - It checks the shared transaction status array in RAM (**ProcArray**).
   - If transaction `1005` is still active, Transaction B knows the row is locked.
   - Transaction B does not busy-spin. It requests a virtual lock on transaction `1005` (`XactLockTableWait(1005)`) and yields the CPU. When Transaction A commits or rolls back, the OS wakes Transaction B up.

> **Architectural Invariant**: Because row locks reside directly within individual tuple headers on 8KB data pages, **PostgreSQL can lock 1 billion rows without allocating a single additional byte in memory**.

---

## 2. The Four Row Lock Modes & The Foreign Key Collision

To minimize lock contention between concurrent readers and writers, PostgreSQL provides **four physical row lock modes**:

<PostgresUpdateLockingDiagram initialTab="four_lock_modes" />

### Lock Compatibility Matrix

| Lock Mode | Acquired By | `FOR KEY SHARE` | `FOR SHARE` | `FOR NO KEY UPDATE` | `FOR UPDATE` |
|---|---|:---:|:---:|:---:|:---:|
| **`FOR KEY SHARE`** | Child table Foreign Key verification | ✅ | ✅ | ✅ | ❌ |
| **`FOR SHARE`** | `SELECT ... FOR SHARE` | ✅ | ✅ | ❌ | ❌ |
| **`FOR NO KEY UPDATE`** | `UPDATE` on non-unique / non-PK columns | ✅ | ❌ | ❌ | ❌ |
| **`FOR UPDATE`** | `DELETE` / `UPDATE` modifying PK or Unique Key | ❌ | ❌ | ❌ | ❌ |

### The Classic Foreign Key Collision Scenario
Consider a relationship between `users` (parent) and `orders` (child):

```sql
CREATE TABLE users (id BIGINT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE orders (id BIGINT PRIMARY KEY, user_id BIGINT REFERENCES users(id));
```

#### Scenario 1: Non-Key Column Update (`FOR NO KEY UPDATE`)
Suppose an admin updates a user's name:
```sql
-- Transaction 1:
UPDATE users SET name = 'Alice Smith' WHERE id = 42;
```
- Because the `name` column is neither a Primary Key nor a Unique index, PostgreSQL acquires **`FOR NO KEY UPDATE`**.
- Simultaneously, a customer service request inserts a new order:
```sql
-- Transaction 2:
INSERT INTO orders (user_id, total) VALUES (42, 100);
```
- The child insert must verify referential integrity, requesting a **`FOR KEY SHARE`** lock on the parent row (`id = 42`).
- As shown in the matrix: **`FOR NO KEY UPDATE` and `FOR KEY SHARE` are fully compatible!** Both transactions proceed concurrently without delay.

#### Scenario 2: ORM Over-Locking / Key Modification (`FOR UPDATE`)
If an ORM updates all entity columns by default (including the primary key), or explicitly issues:
```sql
-- Transaction 1:
SELECT * FROM users WHERE id = 42 FOR UPDATE;
```
- The parent row is now locked with exclusive **`FOR UPDATE`**.
- Transaction 2's insert requests **`FOR KEY SHARE`**, which is **incompatible with `FOR UPDATE`**.
- Transaction 2 is blocked until Transaction 1 commits. If batch processes lock parent users for seconds, inbound order creation across the platform stalls.

---

## 3. The `EvalPlanQual` (EPQ) Algorithm: Why UPDATEs Don't Fail in Read Committed

Under the default `READ COMMITTED` isolation level, what occurs when Transaction B attempts to update a row that Transaction A has just updated and committed?

```text
The EvalPlanQual (EPQ) Recheck Flow:
Tuple v1 (xmin: 100, xmax: 200) ──> Updated to Tuple v2 (xmin: 200, xmax: 0)
                                                                ▲
Tx B (executing UPDATE WHERE balance > 50) ─────────────────────┘
1. Tx B blocks waiting for Tx A to commit.
2. Tx A commits ➔ Tx B is awakened.
3. Rather than failing, EPQ follows the CTID pointer to the newest version (v2)
   and re-evaluates the WHERE balance > 50 predicate:
   ├── If v2 still satisfies balance > 50: Tx B applies its update to Tuple v2!
   └── If v2 no longer matches (e.g., balance < 50): Tx B gracefully skips the row!
```

<PostgresUpdateLockingDiagram initialTab="eval_plan_qual" />

### EPQ Behavior
- The **EvalPlanQual** protocol enables PostgreSQL to preserve transactional flow without forcing applications to catch exceptions and retry manually.
- If the rechecked tuple matches the filter, the update is applied directly to the newest version. If the tuple no longer matches (or was deleted), the statement updates 0 rows gracefully.

### The Trade-off: EPQ is Inactive in `REPEATABLE READ`
Under `TRANSACTION ISOLATION LEVEL REPEATABLE READ`:
- EPQ is disabled to maintain strict snapshot consistency.
- Transaction B cannot observe changes committed by Transaction A after B's snapshot began.
- When a concurrent write conflict is detected, PostgreSQL immediately aborts the operation:
  ```text
  ERROR: could not serialize access due to concurrent update
  ```
- The client application must catch this error and retry the entire transaction.

---

## 4. SSI Aborts: A Mathematical Design Feature, Not a Bug

In PostgreSQL, the `SERIALIZABLE` isolation level is powered by **Serializable Snapshot Isolation (SSI)**.

Unlike traditional locking models that rely on heavy Shared Locks (S-Locks) that block writers, PostgreSQL's SSI guarantees that **readers never block writers, and writers never block readers**.

<PostgresUpdateLockingDiagram initialTab="ssi_dependencies" />

### The SIREAD Predicate Lock & Antidependency Cycle Detection
To prevent anomalies like Write Skew, PostgreSQL tracks read dependencies using virtual in-memory markers called **SIREAD Locks**:
1. When Transaction $T_1$ reads a row or page, an SIREAD predicate lock is recorded.
2. When Transaction $T_2$ writes or inserts data that conflicts with what $T_1$ read, the engine records a directed read-write anti-dependency:
   $$T_1 \xrightarrow{rw} T_2$$
3. If the engine detects a dangerous cycle containing two consecutive anti-dependency edges:
   $$T_{prev} \xrightarrow{rw} T_0 \xrightarrow{rw} T_{next}$$
   PostgreSQL terminates one of the transactions to eliminate potential non-serializable states:
   ```text
   ERROR: could not serialize access due to read/write dependencies among transactions
   ```

### Why "False Positives" Occur
- To prevent unbounded memory consumption by SIREAD locks, PostgreSQL performs **lock escalation**: individual tuple SIREAD locks are merged into page-level (8KB) or relation-level predicate locks.
- Once escalated to the page level, if Transaction 1 reads Row A on Page 10, and Transaction 2 writes Row B **on the exact same Page 10 (even though Row A and Row B are completely unrelated)**, the engine treats this as a potential conflict and aborts one of the transactions!

> **Principal Architect Mandate**:
> The `could not serialize access due to read/write dependencies` error is **NOT A BUG**. It is the necessary mathematical trade-off for non-blocking serializability.
> Any application operating under PostgreSQL `SERIALIZABLE` **must encapsulate database operations in an automated retry loop**.
