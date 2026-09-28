---
id: acid
title: Database ACID Properties
description: A deep-dive guide to ACID properties — Atomicity, Consistency, Isolation, Durability — covering isolation levels, MVCC, 2PL, WAL, write skew, distributed ACID, and practical interview questions. Includes the real priority order (I → C → D → A), the AI PR story, and the link to the full isolation levels deep-dive.
tags: [database, transactions, acid, isolation, mvcc, wal, 2pl, concurrency, deep-dive]
sidebar_position: 5
---
import AcidIsolationAnomaliesDiagram from '@site/src/components/AcidIsolationAnomaliesDiagram';
import AcidBeginnersDiagram from '@site/src/components/AcidBeginnersDiagram';
import AcidUndoRecordStructureDiagram from '@site/src/components/AcidUndoRecordStructureDiagram';
import AcidUndoStoragePurgeDiagram from '@site/src/components/AcidUndoStoragePurgeDiagram';
import AcidPgSnapshotVisibilityDiagram from '@site/src/components/AcidPgSnapshotVisibilityDiagram';
import AcidInnodbClusteredFieldsDiagram from '@site/src/components/AcidInnodbClusteredFieldsDiagram';
import AcidInnodbReconstructionDiagram from '@site/src/components/AcidInnodbReconstructionDiagram';
import AcidWalRecordAnatomyDiagram from '@site/src/components/AcidWalRecordAnatomyDiagram';
import AcidWalWritePathLifecycleDiagram from '@site/src/components/AcidWalWritePathLifecycleDiagram';
import AcidOsStorageStackDiagram from '@site/src/components/AcidOsStorageStackDiagram';
import AcidGroupCommitPipelineDiagram from '@site/src/components/AcidGroupCommitPipelineDiagram';
import Acid2PcSequenceStateMachineDiagram from '@site/src/components/Acid2PcSequenceStateMachineDiagram';
import AcidIsolationFlowchartDiagram from '@site/src/components/AcidIsolationFlowchartDiagram';

# 🛡️ Database ACID Properties

During a code review, an AI agent in the team wrote a money transfer function: debit account A, credit account B — two UPDATE statements, side by side, no transaction. The comment: *"If the server dies between these two lines, what happens?"* The agent's reply: *"I don't care, ship it!"*

The AI was deleted. But a few years earlier, a human engineer thought the same thing — and just didn't say it out loud. Not until sitting at 2am reconciling a balance sheet that wouldn't balance.

So: what is ACID, and why is it the first thing people teach but the last thing people truly understand?

The answer starts with **transaction** — a group of actions you declare to the database as a single unit of work. Debit A is one action, credit B is another. They only become a unit when you explicitly wrap them. The database cannot infer your business intent — and neither can AI agents. Two UPDATE statements sitting next to each other in code are, to the database, two completely separate events.

ACID is what the database promises to protect for that declared unit. No declaration → no protection.

```java
// The entire fix: one annotation. One declaration.
@Transactional
public void transfer(long fromId, long toId, BigDecimal amount) {
    accountRepo.debit(fromId, amount);
    accountRepo.credit(toId, amount);
}
```

:::tip[The four letters are not equally weighted]
ACID was named in a 1983 ACM Computing Surveys paper by Theo Härder and Andreas Reuter — for memorability, not symmetry. In practice:
- **Atomicity & Durability** — the database handles these almost entirely. You barely need to think about them.
- **Consistency** — half is the DB's job (constraints), half is yours (business rules). The half that's yours is the one that gets forgotten.
- **Isolation** — the only one with a tuning dial. Every real production incident involving data corruption traces back here.

If you ranked by "worth your time to deeply understand": **I → C → D → A**.
:::

This guide covers ACID from the ground up — simple analogies first, then low-level implementation mechanics, isolation anomalies, and senior-level interview traps.

> **Isolation has its own dedicated deep-dive:** [Database Isolation Levels →](./isolation-levels.md) — covers all 5 anomalies, PostgreSQL vs MySQL vs Oracle implementation differences, snapshot scope, and practical fix strategies.

---

## 📊 ACID Cheat Sheet

| Property | Core Concept | Implementation Mechanism | Analogy |
| :--- | :--- | :--- | :--- |
| **Atomicity** | All-or-nothing execution | Undo logs, Shadow paging | Round-trip ticket: both legs or neither |
| **Consistency** | DB moves from one valid state to another | Constraints, triggers, app logic | Account balance cannot go negative |
| **Isolation** | Concurrent transactions don't interfere | Locks (2PL), MVCC, SSI | Private cinema — no one else in your showing |
| **Durability** | Committed data survives crashes | Write-Ahead Log (WAL), fsync | Contract engraved in stone, not written in sand |

---

## 🐣 ACID for Beginners

<AcidBeginnersDiagram />

Consider a **bank transfer of \$100 from Alice (\$500) to Bob (\$200)**. This single business action requires two physical SQL operations:

1. **Deduct \$100** from Alice (`balance = balance - 100`).
2. **Add \$100** to Bob (`balance = balance + 100`).

### The 4 Guarantees in Action

#### 1. Atomicity — All or Nothing
If power fails **after** deducting from Alice but **before** crediting Bob, the \$100 is not lost in limbo. During recovery, the database reads the **Undo Log**, reverses Alice's deduction, and restores her balance to \$500.

#### 2. Consistency — Invariants Are Preserved
The bank declares: `CONSTRAINT balance_non_negative CHECK (balance >= 0)`. If Alice has \$50 and attempts to transfer \$100, the database aborts the transaction before committing. The system transitions strictly from one valid invariant state to another.

#### 3. Isolation — Concurrent Operations Are Private
While Alice's transaction is executing, an automated utility bill payment or ATM withdrawal occurring on Bob's account sees either Bob's original \$200 balance or his final \$300 balance — never an intermediate state.

#### 4. Durability — Committed Means Permanent
Once `COMMIT` receives acknowledgement, the transaction changes are persisted to non-volatile storage via the **Write-Ahead Log (WAL)** and `fsync()`. A system power outage a millisecond later will not erase the transfer.

---

### ⚙️ Engine Mechanics Mapping

Under the hood, database engines implement each letter of ACID using distinct physical subsystems:

| ACID Property | Core Responsibility | Engine Subsystem | Storage Structure |
| :--- | :--- | :--- | :--- |
| **Atomicity** | Reverses half-completed work on failure | **Undo Subsystem** | Undo Tablespace / Rollback Segments (`.ibu` files in InnoDB) |
| **Consistency** | Enforces constraints & business rules | **Constraint Engine + App Logic** | Schema Metadata, Catalog Tables, Index Invariants |
| **Isolation** | Controls concurrent transaction visibility | **Lock Manager & MVCC Engine** | 2PL Row/Table Locks, Read Views, Undo Chain / Heap Tuples |
| **Durability** | Guarantees survival after sudden crash | **WAL & Buffer Subsystem** | Sequential Log Files (`pg_wal` / `ib_logfile`), `fsync()` system calls |

---

### ⚠️ Common Beginner Traps & Misconceptions

:::caution[Trap 1: "Single UPDATE statements do not need transactions"]
Auto-commit mode automatically wraps a single statement in an implicit transaction. However, multi-statement business flows (e.g. debit account A, credit account B) **require an explicit transaction boundary** (`BEGIN` / `COMMIT` or `@Transactional`). Without explicit boundaries, a failure between statements leaves the database in a partially updated state.
:::

:::danger[Trap 2: "ACID guarantees 100% data correctness automatically"]
The database only enforces constraints you explicitly declare (`NOT NULL`, `FOREIGN KEY`, `CHECK`). Higher-level business invariants — such as *"Total rewards points issued must equal total dollars spent"* — must be enforced by application logic. Consistency is a shared 50/50 contract between database schemas and application code.
:::

---

## 🔍 Deep Dive: Atomicity

"All-or-nothing" execution requires a mechanism to restore original data if a transaction aborts. Before mutating any data page in memory, the storage engine records the original state — the **before-image** — to an **Undo Log**.

### Undo Log (Rollback Segment)

#### Undo Record Physical Structure

<AcidUndoRecordStructureDiagram />

Every row mutation (`INSERT`, `UPDATE`, `DELETE`) constructs an undo record containing transaction metadata and data before-images:

- **`trx_id`**: Transaction ID that modified this row.
- **`roll_ptr`**: 7-byte pointer referencing the previous undo record in the rollback segment, creating a reverse linked chain.
- **`rec_type`**: Type of mutation (e.g., `TRX_UNDO_INSERT_REC`, `TRX_UNDO_UPD_EXIST_REC`).
- **Before-Image Payload**: Delta of modified columns required to reverse the change.

#### Storage Architecture & Purge Subsystem

<AcidUndoStoragePurgeDiagram />

1. **InnoDB (MySQL)**: Allocates undo log segments within dedicated undo tablespaces (`undo001`, `undo002`). Undo slots are managed inside rollback segments (`trx_rseg_t`).
2. **PostgreSQL**: Implements MVCC via Heap Tuple Versioning. The old tuple version remains in the main heap page, serving implicitly as the "undo" image until cleaned up by `VACUUM`.

#### Dual-Duty of the Undo Log

Undo logs serve two critical functions:
1. **Atomicity**: During `ROLLBACK` or crash recovery, the rollback engine traverses `roll_ptr` chains backward to undo changes.
2. **MVCC Snapshot Construction**: When concurrent transactions read older snapshots, InnoDB uses undo logs to reconstruct historical row versions without copying entire table pages.

#### Production Gotcha: Undo Log Bloat & History List Length (HLL)

:::danger[Performance Trap: Long-Running Transactions Block Undo Purge]
If a long-running reporting query or batch job keeps an active snapshot open for hours, the **Purge Daemon** cannot free undo log records created after that snapshot started.

- **Symptom**: Undo tablespaces expand rapidly, consuming disk space.
- **Impact**: The Undo History List Length (`trx_sys->rseg_history_len`) spikes into millions. Point-in-time queries must traverse thousands of `roll_ptr` links to reconstruct old versions, causing severe CPU spikes and query degradation.
- **Remediation**: Set `idle_in_transaction_session_timeout` (PostgreSQL) or monitor `innodb_undo_directory` and terminate stale long-running transactions.
:::

### Atomicity Is Not Just a Database Concept

The same "don't let anyone see a half-done state" problem appears everywhere concurrency exists.

**Java `AtomicInteger`** solves it with **Compare-And-Swap (CAS)** at the CPU level:
```java
// Under the hood — pseudo-code for AtomicInteger.incrementAndGet()
do {
    int current = get();           // read current value
    int next = current + 1;        // compute new value
} while (!compareAndSet(current, next)); // write ONLY if value hasn't changed since read
// If another thread changed it in between → retry. No locks needed.
```

**Redis** takes a completely different approach: even though recent versions added I/O threads for networking, command *execution* is single-threaded. So `INCR` is naturally atomic — there's no other thread that could observe the in-between state.

Three totally different mechanisms — **undo log**, **CAS**, **single-threaded execution** — solving the same problem: *no one sees a half-done state.*

### Shadow Paging

An alternative where the DB maintains two page tables: **current** and **shadow**:

- Writes go to new (shadow) pages
- On `COMMIT`: atomically flip pointer from shadow → current
- On `ABORT`: discard shadow pages; original current pages are untouched

Used by **SQLite's rollback journal**. Simpler than WAL but causes file fragmentation.

### Savepoints

Partial rollback within a transaction — useful for nested logic:

```sql
BEGIN;

INSERT INTO orders (user_id, total) VALUES (42, 100.00);
SAVEPOINT sp_order_created;

INSERT INTO order_items (order_id, product_id) VALUES (LASTVAL(), 99);  -- may fail

-- Only roll back to after the order was created, not the entire transaction
ROLLBACK TO SAVEPOINT sp_order_created;

-- Retry with different item or commit partial work
COMMIT;
```

---

## 🔍 Deep Dive: Consistency

### Database-Level Constraints

The database enforces these automatically:

```sql
CREATE TABLE accounts (
    id      BIGSERIAL PRIMARY KEY,
    balance NUMERIC(12, 2) NOT NULL,
    CONSTRAINT balance_non_negative CHECK (balance >= 0)  -- enforced by DB
);

-- This will FAIL with: ERROR: new row violates check constraint
UPDATE accounts SET balance = -50 WHERE id = 1;
```

| Constraint Type | Example |
|---|---|
| `NOT NULL` | Required columns |
| `UNIQUE` | No duplicate emails |
| `FOREIGN KEY` | Order must reference a valid user |
| `CHECK` | Balance ≥ 0, Age between 0 and 150 |
| `TRIGGER` | Complex cross-table invariants |

### Application-Level Consistency

Business rules the DB can't enforce alone:

- "Total items shipped cannot exceed total items ordered"
- "A meeting cannot be double-booked"
- "A user cannot transfer more than their daily limit across all transactions"
- "Total money across all accounts must remain constant after a transfer"

:::important[The "C" in ACID — the half that's yours]
The "C" in ACID is technically the **application developer's responsibility**. The database only enforces constraints you explicitly declare. If you forget to write `CHECK (balance >= 0)`, the database has no idea balances shouldn't go negative. The database handles *execution*; you handle *definition*. The half that's yours is the half that gets forgotten.
:::

:::note[Consistency happens mid-transaction too]
During a transaction, data can temporarily be in an "invalid" state — money deducted from account A but not yet credited to B. That's fine. The consistency guarantee applies at transaction boundaries: when the transaction *commits*, all invariants must hold again.
:::

### ACID Consistency vs CAP Consistency

One of the most common interview traps — two completely different concepts sharing the same word:

| | ACID Consistency | CAP Consistency (Linearizability) |
|---|---|---|
| **Meaning** | DB transitions between valid states according to declared rules/invariants | Every read reflects the most recent write across all nodes |
| **Scope** | Single node / single transaction | Distributed system across multiple replicas |
| **Example** | Balance cannot go negative | After a write to node A, node B immediately sees the same value |
| **Who enforces it** | Your constraints + your app logic | The distributed consensus protocol |

> ACID Consistency has nothing to do with replicas. CAP Consistency has nothing to do with constraints. Same word, two worlds.

---

## 🔍 Deep Dive: Isolation

Isolation answers exactly one question: *when does a change made by one transaction become visible to other concurrent transactions?*

See it immediately (even before commit) → **dirty read**. See it only after commit, but the same row can look different on two reads in the same transaction → **non-repeatable read**. Don't lock the range, so someone inserts a new row between your two queries → **phantom read**.

Isolation is the **most complex** ACID property because strict isolation is expensive. Databases offer a spectrum of **isolation levels**, each trading consistency for concurrency.

<AcidIsolationAnomaliesDiagram />

:::warning[Don't default to Serializable "for safety"]
A ticket-booking system set all transactions to `SERIALIZABLE` to be safe. At peak load, transactions queued waiting for locks, timeouts cascaded, and the monitoring dashboard turned red like a summer downpour. The fix: drop to `READ COMMITTED` and handle inventory contention separately at the application layer with targeted `SELECT FOR UPDATE`.

ACID isolation is not an on/off switch — it's a dial. Higher isolation = more locks = more deadlocks = lower throughput. Choose deliberately per use case.
:::

### Isolation Anomalies

The ANSI SQL 1992 standard listed exactly three anomalies (dirty read, non-repeatable read, phantom read) and defined the four isolation levels around them. In 1995, a landmark paper **"A Critique of ANSI SQL Isolation Levels"** showed the standard was too vague and had missed an entire family of anomalies. The two most important additions from that paper are **lost update** and **write skew** — both can silently corrupt data without a single exception in your logs.

#### 1. Dirty Read
Transaction A modifies a row but hasn't committed. Transaction B reads that uncommitted value. Then A rolls back. B just acted on data that never officially existed — like overhearing a decision your manager hadn't finalized yet, acting on it, then being told "I was just thinking out loud."

```
T1: UPDATE accounts SET balance = 0 WHERE id = 1;  -- not yet committed
T2:                SELECT balance FROM accounts WHERE id = 1;  -- sees 0!
T1: ROLLBACK;  -- T2 read data that never officially existed
```

#### 2. Non-Repeatable Read
In the same transaction, B reads a row and gets 100. Later B reads the same row and gets 200 — because another transaction committed a change in between. Same query, same row, two different results. It cannot repeat the read consistently, hence "non-repeatable."

```
T1: SELECT balance FROM accounts WHERE id = 1;  -- returns 500
T2:     UPDATE accounts SET balance = 300 WHERE id = 1; COMMIT;
T1: SELECT balance FROM accounts WHERE id = 1;  -- returns 300  ← different!
```

#### 3. Phantom Read
Like non-repeatable but at the set level. In the same transaction, B counts users over 30 and gets 10. Later the same query returns 11 — someone inserted a qualifying row in between. No existing row changed value; a new "ghost" appeared in the result.

```
T1: SELECT COUNT(*) FROM accounts WHERE balance > 100;  -- returns 5
T2:     INSERT INTO accounts (balance) VALUES (200); COMMIT;
T1: SELECT COUNT(*) FROM accounts WHERE balance > 100;  -- returns 6 ← phantom!
```

#### 4. Lost Update
The e-wallet bug from the intro. Two transactions both read balance = 500k, both decide "enough funds," both write their result — the second write overwrites the first's deduction. One withdrawal is silently lost.

```
T1: balance = SELECT balance FROM accounts WHERE id=1;  -- 500
T2: balance = SELECT balance WHERE id=1;                -- 500
T1: UPDATE accounts SET balance = 500 - 100 = 400 WHERE id=1;
T2: UPDATE accounts SET balance = 500 - 200 = 300 WHERE id=1; ← T1's deduction is lost!
-- Final balance = 300. But it should be 200. 100 vanished.
```

#### 5. Write Skew
More subtle than lost update. Two transactions each read overlapping data, make individually valid decisions, write to **different rows**, and their combined result violates an invariant.

```sql
-- Rule: at least 1 doctor must be on call at all times
-- Current state: An and Binh are both on-call

T1 (An requests leave):
    SELECT COUNT(*) FROM doctors WHERE on_call = true;  -- sees 2, ok to proceed
    UPDATE doctors SET on_call = false WHERE id = 1;

T2 (Binh requests leave, concurrent):
    SELECT COUNT(*) FROM doctors WHERE on_call = true;  -- also sees 2, ok to proceed
    UPDATE doctors SET on_call = false WHERE id = 2;

-- Both COMMIT. No 0 doctors on call. Invariant BROKEN.
```

**Why write skew is harder than lost update:** Lost update has two transactions writing the *same row* — there's a direct collision the database can detect and block. Write skew has each transaction writing a *different row* — no direct collision exists. The database has nothing to detect unless you tell it what invariant to enforce.

:::note[The 1995 anomaly map]
| Anomaly | Root cause | Prevented by |
|---|---|---|
| Dirty Read | Reading uncommitted data | Read Committed+ |
| Non-Repeatable Read | Same row, different values across reads | Repeatable Read+ |
| Phantom Read | Range query sees new rows | Serializable (or PG Repeatable Read) |
| Lost Update | Read-modify-write conflict on same row | Repeatable Read+ (PG); `SELECT FOR UPDATE`; atomic UPDATE |
| Write Skew | Concurrent decisions violating a shared invariant | Serializable (SSI); `SELECT FOR UPDATE` on a materialized conflict row |
:::

---

### Isolation Levels: The Standard Table

SQL standard defines four isolation levels. Each level is a dial — higher = safer, but more lock contention and lower throughput:

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Write Skew |
|---|:---:|:---:|:---:|:---:|
| **READ UNCOMMITTED** | ✅ Possible | ✅ Possible | ✅ Possible | ✅ Possible |
| **READ COMMITTED** | ❌ Prevented | ✅ Possible | ✅ Possible | ✅ Possible |
| **REPEATABLE READ** | ❌ Prevented | ❌ Prevented | ✅ Possible* | ✅ Possible |
| **SERIALIZABLE** | ❌ Prevented | ❌ Prevented | ❌ Prevented | ❌ Prevented |

This table describes the **spec** — what anomalies each level *must* prevent. It says nothing about *how* the database achieves it. That distinction matters enormously once you look at real implementations.

### PostgreSQL's Actual Behaviour (Spec ≠ Implementation)

:::important[Every database implements isolation levels differently]
The same level name can have completely different behaviour across databases. The spec defines what anomalies to prevent; each database chooses how. Trusting a level name without verifying the implementation is how subtle bugs get into production.
:::

**PostgreSQL has no real READ UNCOMMITTED.** You can write the name, but PostgreSQL silently runs it as READ COMMITTED. Dirty reads are impossible in PostgreSQL regardless of what you declare.

| Level | PostgreSQL snapshot scope | Key differences from SQL standard |
|---|---|---|
| **READ COMMITTED** *(default)* | **Per-statement** — each SQL statement takes a fresh snapshot at execution time | Two SELECTs in the same transaction 3 seconds apart can see different data |
| **REPEATABLE READ** | **Per-transaction** — one snapshot taken at the first statement, held until commit | Prevents phantoms too (not just standard guarantee); aborts on lost update conflict |
| **SERIALIZABLE** | Per-transaction + SSI tracking of read-write dependencies | Aborts transactions that would produce non-serializable results; prevents write skew |

**PostgreSQL REPEATABLE READ prevents more than the standard requires:**
- **Phantom reads** — because the whole transaction sees a single frozen snapshot
- **Lost updates** — if two transactions both try to update the same row, the second one gets aborted with a `serialization failure` error and must retry. It doesn't silently overwrite — it loudly fails so you can handle it.

**PostgreSQL REPEATABLE READ still allows write skew** — each doctor's transaction reads 2 on-call, writes a different row, no direct conflict. The database sees nothing to abort.

**PostgreSQL SERIALIZABLE uses SSI** (Serializable Snapshot Isolation): tracks read-write dependency edges between concurrent transactions. If it detects a cycle that would produce a non-serializable outcome, it aborts one transaction. This is how it catches the doctor write skew — the two transactions form a cycle that SSI breaks.

**Oracle's "Serializable" is actually Snapshot Isolation** — it prevents phantoms but still allows write skew. Same label, fundamentally different guarantee. This is why knowing the spec name is not enough; you need to know what your specific database actually does underneath.

```sql
-- Per-transaction (set for a specific operation only, not the whole system)
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- ... your statements ...
COMMIT;

-- Check current PostgreSQL session level
SHOW transaction_isolation;
```

```java
// In Spring — set per transaction method, not globally
@Transactional(isolation = Isolation.SERIALIZABLE)   // strictest
@Transactional(isolation = Isolation.READ_COMMITTED)  // PG default
@Transactional(isolation = Isolation.REPEATABLE_READ)
```

:::tip[Isolation is per-transaction, not a global toggle]
Setting a higher isolation level applies only to the transaction that declares it. Other transactions in your system keep running at their own level. This means you can safely use `SERIALIZABLE` for one critical operation without impacting system-wide throughput. Changing the *default* isolation level for the entire database has a much wider blast radius — reserve that for carefully considered infrastructure decisions.
:::

:::tip[Real-World Defaults]
- **PostgreSQL**: `READ COMMITTED` by default (per-statement snapshot)
- **MySQL InnoDB**: `REPEATABLE READ` by default (per-transaction snapshot, gap locks for phantoms)
- **Oracle**: `READ COMMITTED` by default
- **SQL Server**: `READ COMMITTED` by default
:::

### Practical Strategies: Handle Anomalies Without Raising Isolation

In practice, most teams keep the database default and handle specific anomalies at the query or application layer. Raising isolation level system-wide trades one problem for another: you fix data correctness but add lock contention, deadlock risk, and retry loops.

#### Handling Lost Update

**Option 1 — Atomic UPDATE (cleanest, no extra lock):**
```sql
-- Instead of: read balance, compute, write
-- Do this: fold the business logic into one statement
UPDATE accounts
SET balance = balance - 70
WHERE id = ? AND balance >= 70;
-- Check affected rows: 0 means insufficient funds OR lost race → handle accordingly
```
The database locks exactly this row for the duration of this statement. The race condition can't happen because there's no gap between read and write.

**Option 2 — Optimistic Locking (for low-contention data):**
```sql
-- Add a version column
UPDATE accounts
SET balance = ?, version = version + 1
WHERE id = ? AND version = ?;  -- 0 rows updated = someone else changed it first → retry
```
```java
@Entity
public class Account {
    @Version  // JPA handles optimistic locking automatically
    private Long version;
}
```
Best when conflicts are rare. Under heavy contention (flash-sale inventory), retries pile up exactly when you need throughput most.

**Option 3 — Pessimistic Locking (for hot rows):**
```sql
BEGIN;
SELECT balance FROM accounts WHERE id = ? FOR UPDATE;  -- locks the row immediately
-- ... compute ...
UPDATE accounts SET balance = ? WHERE id = ?;
COMMIT;
```
Other transactions trying to `SELECT FOR UPDATE` the same row block until this one commits. No retries needed, but lock duration directly impacts concurrency.

#### Handling Write Skew

The cleanest fix: **materialize the hidden constraint into a real lockable row.** Write skew happens because the invariant lives in an aggregate ("count of on-call doctors") that no transaction locks. Make a concrete row represent that invariant and lock it:

```sql
BEGIN;
-- Lock the on-call slot for this shift — makes the invisible invariant visible to the lock manager
SELECT * FROM on_call_slots WHERE shift_id = ? FOR UPDATE;

SELECT COUNT(*) FROM doctors WHERE on_call = true AND shift_id = ?;
-- IF count > 1 THEN
UPDATE doctors SET on_call = false WHERE id = ?;
-- ELSE raise exception
COMMIT;
```

By locking `on_call_slots`, both transactions are forced to queue — the second one sees the real post-first-commit state and correctly rejects the request.

As a last resort, `SERIALIZABLE` isolation (PostgreSQL SSI) catches write skew automatically — but at the cost of a retry loop everywhere, and abort rate climbs fast under high load. Use it when the invariant is genuinely complex and can't be materialized.

#### The Question to Answer First

> *"In this business operation, what invariant must always hold — and what data do I **read** to make the decision but **not write**?"*

That read-but-not-written data is your write skew risk surface. Once you identify it, you can choose: lock it explicitly, materialize it into a lockable row, or reach for a higher isolation level as a last resort. The isolation level you need is the consequence of this analysis — not a setting you pick upfront.

---

### Concurrency Control: MVCC

**Multi-Version Concurrency Control** solves the "readers block writers" problem by maintaining **multiple historical versions** of each row. When you run `UPDATE`, the database doesn't overwrite the old value — it creates a new version and keeps the old one around for any transactions that started before this change.

Think of it like photocopying the morning newspaper before boarding a train. Outside, news keeps updating. But the copy in your hand stays consistent from start to finish — you're not reading a mix of yesterday's and today's articles. MVCC gives every transaction that same "frozen copy" of the world at the moment it began.

This is why readers never block writers and writers never block readers: each transaction is reading its own snapshot, and a new writer just creates a new version rather than overwriting what anyone is currently reading.

When you *do* need to enforce ordering — like `SELECT ... FOR UPDATE` — PostgreSQL steps out of MVCC mode and places an actual row lock, forcing other transactions to queue. MVCC covers the "read without blocking" case; explicit locks cover the "I need exclusive access to this row before writing" case.

#### PostgreSQL MVCC Internals

PostgreSQL implements MVCC via **Heap Tuple Versioning**. Every table row update creates a brand new tuple on the heap rather than overwriting existing bytes.

##### Tuple Header Physical Metadata (`HeapTupleHeaderData`)

Every physical tuple on disk contains a 23-byte header preceding the user columns:

| Header Field | Byte Size | Description & Concurrency Purpose |
|---|---|---|
| `xmin` | 4 Bytes | Transaction ID (XID) that inserted/created this tuple version. |
| `xmax` | 4 Bytes | Transaction ID (XID) that deleted or updated this tuple (`0` if live and unlocked). |
| `cmin / cmax` | 4 Bytes | Intra-transaction Command ID counter distinguishing statement execution order within a single transaction. |
| `t_ctid` | 6 Bytes | Physical `(page_number, tuple_index)` tuple ID pointing to self or the newer version in an update chain. |
| `t_infomask` | 2 Bytes | Bitmask status flags (`HEAP_XMIN_COMMITTED`, `HEAP_XMAX_INVALID`, `HEAP_HOT_UPDATED`). |

- **`xmin`**: Transaction ID that inserted/created this tuple version.
- **`xmax`**: Transaction ID that deleted or updated this tuple version (set to `0` if live and un-deleted).
- **`cmin / cmax`**: Intra-transaction Command ID counter distinguishing statement execution order within a single transaction.
- **`t_ctid`**: Physical `(page_number, tuple_index)` tuple ID. When updated, `t_ctid` in the old tuple points directly to the new tuple version.
- **`t_infomask`**: Bitmask flags caching tuple status (`HEAP_XMIN_COMMITTED`, `HEAP_XMAX_INVALID`, `HEAP_HOT_UPDATED`).

##### HOT Updates (Heap-Only Tuples)

Normally, updating a row requires inserting new entries in all associated table indexes. **HOT updates** eliminate index update overhead:
- If an `UPDATE` does not alter any indexed column AND the new tuple fits on the **same 8KB heap page**, PostgreSQL writes the new tuple without creating new index pointers.
- Index lookup lands on the original tuple, checks `HEAP_HOT_UPDATED` in `t_infomask`, and follows `t_ctid` directly to the newest tuple version on the page.

##### Snapshot Structure & Visibility Rule Evaluation

<AcidPgSnapshotVisibilityDiagram />

A PostgreSQL snapshot (`SnapshotData`) captures active transaction state at execution time, formatted as `xmin:xmax:xip_list` (e.g. `100:108:102,105`):

- **`xmin`**: Lowest transaction ID still active. All `txns < xmin` are committed and visible.
- **`xmax`**: First unassigned transaction ID. All `txns >= xmax` started after snapshot creation and are invisible.
- **`xip_list`**: Array of in-progress transaction IDs between `xmin` and `xmax`.

##### Transaction ID (TXID) Wraparound Hazard

PostgreSQL uses 32-bit transaction IDs ($2^{32} \approx 4.29 \text{ billion}$). Epoch space uses modulo arithmetic: half the space ($2^{31} \approx 2.14 \text{ billion}$) is in the past, half in the future.

:::danger[Production Outage Trap: TXID Wraparound Freeze]
If a database runs $2.14 \text{ billion}$ transactions without running `VACUUM FREEZE`, past transaction IDs wrap into the future, causing catastrophic data corruption (old tuples suddenly appear uncommitted).

To prevent data corruption, PostgreSQL turns read-only and refuses all write transactions when TXID age reaches `autovacuum_freeze_max_age` (default 200 million transactions).

- **Monitoring Alert**: `SELECT max(age(datfrozenxid)) FROM pg_database;`
- **Mitigation**: Ensure autovacuum parameters (`autovacuum_vacuum_cost_limit`, `autovacuum_max_workers`) are aggressive enough to keep pace with write throughput.
:::

---

#### MySQL InnoDB MVCC

Unlike PostgreSQL, MySQL InnoDB updates clustered index pages in-place and reconstructs historical versions dynamically using the **Undo Log**.

##### Clustered Index Hidden Fields

<AcidInnodbClusteredFieldsDiagram />

Every InnoDB index record contains three hidden system fields:

- **`DB_TRX_ID`**: ID of the last transaction that inserted or updated this row.
- **`DB_ROLL_PTR`**: Pointer to the undo log record containing the before-image.
- **`DB_ROW_ID`**: Auto-increment row ID generated when a table lacks an explicit Primary Key.

##### InnoDB `ReadView` Data Structure

When a transaction executes a query under `READ COMMITTED` or `REPEATABLE READ`, InnoDB generates a `ReadView` (`storage/innobase/include/read0read.h`):

- **`m_ids`**: List of active (uncommitted) transaction IDs at snapshot creation time.
- **`m_low_limit_id`**: Highest transaction ID allocated + 1. Any `trx_id >= m_low_limit_id` is invisible.
- **`m_high_limit_id`**: Smallest transaction ID in `m_ids`. Any `trx_id < m_high_limit_id` is visible.
- **`m_creator_trx_id`**: Transaction ID of the transaction that created the ReadView.

##### Historical Version Reconstruction Algorithm

<AcidInnodbReconstructionDiagram />

1. InnoDB reads the latest tuple from the buffer pool clustered index page.
2. Checks `DB_TRX_ID` against `ReadView`:
   - If `DB_TRX_ID < m_high_limit_id` (or equals `m_creator_trx_id`), the row is visible.
   - If `DB_TRX_ID >= m_low_limit_id` or present in `m_ids`, the row is invisible.
3. If invisible, InnoDB follows `DB_ROLL_PTR` to the Undo Log, applies the undo delta in memory to reconstruct the older row version, and evaluates visibility again.
4. Traversal repeats down the undo chain until a visible version is found.

1. InnoDB reads the latest tuple from the buffer pool clustered index page.
2. Checks `DB_TRX_ID` against `ReadView`:
   - If `DB_TRX_ID < m_high_limit_id` (or equals `m_creator_trx_id`), the row is visible.
   - If `DB_TRX_ID >= m_low_limit_id` or present in `m_ids`, the row is invisible.
3. If invisible, InnoDB follows `DB_ROLL_PTR` to the Undo Log, applies the undo delta in memory to reconstruct the older row version, and evaluates visibility again.
4. Traversal repeats down the undo chain until a visible version is found.

---

##### Architectural Comparison: PostgreSQL vs MySQL InnoDB MVCC

| Dimension | PostgreSQL MVCC | MySQL InnoDB MVCC |
| :--- | :--- | :--- |
| **Tuple Storage** | Multiple physical versions stored directly in main Heap pages | Single latest version in Clustered Index page; old versions in Undo Log |
| **Read Overhead** | Reads latest or older physical tuples directly from Heap | Reconstructs old tuple versions by applying Undo deltas in memory |
| **Write Overhead** | Every update inserts a new physical tuple (unless HOT optimization applies) | In-place page update + append undo record to rollback segment |
| **Garbage Collection** | `VACUUM` daemon scans Heap pages to reclaim dead tuples | Purge Threads free undo log segments once old snapshots complete |
| **Bloat Location** | Main Table and Index Heap pages (Table Bloat) | System / Undo Tablespaces (`.ibu` files & History List Length) |

#### MVCC and VACUUM (PostgreSQL)

MVCC creates dead tuples (old versions no longer needed). Without cleanup, tables bloat:

```sql
-- VACUUM reclaims space from dead tuples
VACUUM accounts;
VACUUM ANALYZE accounts;  -- also updates query planner statistics

-- VACUUM FULL: full table rewrite (locks table, reclaims disk space)
-- autovacuum daemon runs this automatically in the background

-- Monitor bloat
SELECT relname, n_dead_tup, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

---

### Concurrency Control: Two-Phase Locking (2PL)

**2PL** is a **pessimistic** concurrency control strategy: acquire locks before accessing data.

#### Lock Types

| Lock | Also Called | Who can hold it concurrently? | Use |
|------|-------------|-------------------------------|-----|
| **Shared (S)** | Read lock | Multiple readers | `SELECT` |
| **Exclusive (X)** | Write lock | Only one writer; blocks all others | `UPDATE`, `DELETE`, `INSERT` |
| **Row-Share** | FOR SHARE | Multiple readers with intent to lock | `SELECT FOR SHARE` |
| **Row-Exclusive** | FOR UPDATE | One writer | `SELECT FOR UPDATE` |

```sql
-- Pessimistic locking: lock the row for update
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;  -- acquires X lock
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- Shared lock: read with intent to validate (no update)
SELECT * FROM accounts WHERE id = 1 FOR SHARE;
```

#### Two Phases

1. **Growing Phase**: Transaction acquires locks. Cannot release any.
2. **Shrinking Phase**: Transaction releases locks. Cannot acquire new ones.

This ordering guarantees **serializability** — no two transactions can have conflicting lock schedules.

#### Deadlocks

When two transactions each hold a lock the other needs:

```
T1: LOCK accounts WHERE id=1 (X)
T2: LOCK accounts WHERE id=2 (X)
T1: tries to LOCK accounts WHERE id=2 → WAITS for T2
T2: tries to LOCK accounts WHERE id=1 → WAITS for T1  ← DEADLOCK!
```

Detection and resolution:
- DB periodically checks for **wait-for cycles** in the lock dependency graph
- One transaction is chosen as the **victim** and rolled back
- The surviving transaction completes

```sql
-- Prevent deadlocks by always locking in a consistent order
-- ✅ Both T1 and T2 always lock lower ID first
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
```

---

### Concurrency Control: Serializable Snapshot Isolation (SSI)

PostgreSQL's **Serializable** isolation level uses SSI — an **optimistic** approach:

- Transactions execute concurrently without blocking (like Snapshot Isolation)
- The DB tracks **read-write dependency edges** between transactions
- If a **cycle** is detected (indicating a serialization anomaly like write skew), one transaction is aborted

```sql
-- Set serializable for the most critical transactions
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT COUNT(*) FROM doctors WHERE on_call = true;  -- reads
UPDATE doctors SET on_call = false WHERE id = 42;   -- writes
COMMIT;  -- DB checks for dependency cycles; may abort if conflict detected
```

SSI prevents write skew without explicit `SELECT FOR UPDATE` locking.

---

## 🔍 Deep Dive: Durability

Durability sounds like the simplest guarantee: *commit means it's permanent*. But the database doesn't write directly to the data file on every commit — data files are scattered across disk, and random writes are slow. Instead it writes to a **Write-Ahead Log** first: a file that only ever appends sequentially (fast), then calls `fsync` to ensure the log is on physical disk, then acknowledges the commit. The actual data file is updated later, asynchronously.

:::note[Undo log vs WAL — easy to confuse]
| Log | Purpose | Serves |
|---|---|---|
| **Undo log** | Stores *old values* (before-images) to reverse a transaction | Atomicity |
| **Write-Ahead Log (WAL / Redo log)** | Stores *new changes* to replay after a crash | Durability |

Undo log = "forget what was done." WAL = "remember what was promised."

Durability does not guarantee that data is *already in the right place on disk* — it guarantees there is *enough information to reconstruct it after restart*.
:::

### Write-Ahead Logging (WAL)

Write-Ahead Logging dictates that **no data page may be written to non-volatile storage until the log record describing the change has been flushed to disk**.

#### Physical WAL Record Anatomy

<AcidWalRecordAnatomyDiagram />

Every change generates a binary WAL record (`XLogRecord` in PostgreSQL / Redo Log Block in InnoDB):

- **`LSN` (Log Sequence Number)**: A 64-bit monotonically increasing byte offset in the WAL log stream.
- **`rmid` (Resource Manager ID)**: Identifies subsystem target (e.g. `RM_HEAP_ID`, `RM_BTREE_ID`, `RM_TRANSACT_ID`).
- **`xl_tot_len`**: Total byte length of record including headers and alignment padding.
- **Payload**: Page offset, tuple delta bytes, and CRC32 checksum.

#### 5-Step End-to-End Write Path Lifecycle

<AcidWalWritePathLifecycleDiagram />

1. **WAL Generation**: The transaction writes modification log records to the in-memory WAL Buffer (`wal_buffers` / `innodb_log_buffer_size`).
2. **Sequential Log Sync**: On `COMMIT`, the database issues `fsync()` to flush WAL buffer contents sequentially to disk.
3. **Dirty Page Tagging**: Data pages in the Buffer Pool are updated in memory and marked "dirty," tagged with `page_lsn`.
4. **Client Acknowledgement**: The engine returns `COMMIT SUCCESS` to the application client as soon as WAL reaches disk.
5. **Asynchronous Checkpointing**: Background Checkpointer daemon periodically flushes dirty pages (`page_lsn <= flushed_wal_lsn`) to physical data files, freeing WAL log space.

#### ARIES Crash Recovery Protocol

Upon restarting after an unclean shutdown, the engine executes the **ARIES (Algorithms for Recovery and Isolation Exploiting Semantics)** recovery protocol:

1. **Analysis Phase**: Scans WAL from the last valid checkpoint forward to reconstruct the dirty page table and identify active uncommitted transactions at crash time.
2. **Redo Phase (Repeating History)**: Replays all WAL records from the checkpoint forward, restoring the Buffer Pool to the exact state immediately preceding the crash.
3. **Undo Phase**: Traverses undo chains backward to roll back all transactions that were active (uncommitted) at the instant of crash.

#### Production Configuration & Tuning Parameters

```sql
-- PostgreSQL WAL Tuning
SHOW wal_level;                   -- replica (default) | logical (for CDC/Debezium)
SHOW synchronous_commit;        -- on (full durability) | off (async ~600ms risk) | remote_apply
SHOW wal_buffers;               -- Shared memory allocated for unwritten WAL (default 16MB)
SHOW max_wal_size;              -- Soft limit triggering automatic checkpoint (e.g. 16GB)
SHOW checkpoint_completion_target; -- Target completion time between checkpoints (default 0.9)

-- MySQL InnoDB Redo Log Tuning
SHOW VARIABLES LIKE 'innodb_log_buffer_size';     -- In-memory log buffer (e.g. 64MB)
SHOW VARIABLES LIKE 'innodb_redo_log_capacity';   -- Total disk capacity for redo logs (8.0.30+)
```

---

### The `fsync()` System Call

Standard file `write()` system calls transfer data from application memory into the **OS Page Cache** (kernel RAM). Power failure while data resides solely in Page Cache results in permanent data loss. The `fsync()` system call forces the operating system kernel to flush dirty page cache buffers down to non-volatile disk hardware.

#### OS Kernel Storage Stack Layering

<AcidOsStorageStackDiagram />

#### System Call Comparison

| System Call | Behavior | Performance | Durability Guarantee |
| :--- | :--- | :--- | :--- |
| `write(fd, buf, count)` | Copies buffer to OS Page Cache. Does NOT sync disk. | Fast (~1 μs) | ❌ None (lost on power crash) |
| `fdatasync(fd)` | Flushes file data pages to storage media; omits non-essential metadata updates (e.g. `mtime`). | Moderate (~0.5-2 ms) | ✅ Full data durability |
| `fsync(fd)` | Flushes file data pages AND inode metadata (file size, access timestamps). | Slower (~1-3 ms) | ✅ Full data + metadata durability |
| `open(..., O_DIRECT \| O_DSYNC)` | Bypasses OS Page Cache entirely; performs direct synchronous I/O. | Variable | ✅ Direct-to-hardware durability |

#### Hardware & Virtualization Gotchas

:::danger[Hardware Trap: Consumer SSDs & Virtualized Disk Caches]
1. **Consumer SSDs Ignoring Flush**: Cheap consumer SSDs often report `fsync` completion immediately while data is still in volatile onboard DRAM without Power Loss Protection (PLP). Sudden loss of power causes silent corruption.
2. **VM Disk Cache Modes**: Virtual machine storage configured with `cache=writeback` buffers writes in hypervisor RAM. Ensure production VMs use `cache=writethrough` or `cache=directsync` with enterprise SSDs featuring PLP supercapacitors.
:::

:::warning[Historical Linux Kernel Bug: Silent Page Cache Drop]
Prior to Linux Kernel 4.13/4.16, if an I/O error (`EIO`) occurred during background page cache writeback, the Linux kernel cleared dirty flags and dropped the page from memory. Subsequent calls to `fsync()` returned `0` (Success), misleading databases into believing data was safe on disk. Always run modern kernel versions (>= 5.4 LTS) in production.
:::

#### Production Flush Mode Trade-Off Matrix

```sql
-- PostgreSQL synchronous_commit levels:
SET LOCAL synchronous_commit = 'off';          -- 3-5x faster write throughput; ~600ms data loss on crash
SET LOCAL synchronous_commit = 'local';        -- Guaranteed local fsync; does not wait for replicas
SET LOCAL synchronous_commit = 'on';           -- Local fsync + wait for WAL write on synchronous standby
SET LOCAL synchronous_commit = 'remote_apply'; -- Waits until WAL is applied on standby (zero loss)
```

```ini
# MySQL InnoDB innodb_flush_log_at_trx_commit modes:
innodb_flush_log_at_trx_commit = 1   # (Default) Write + fsync every commit. Full ACID durability.
innodb_flush_log_at_trx_commit = 2   # Write to OS cache every commit; fsync once per second. High speed, ~1s OS crash risk.
innodb_flush_log_at_trx_commit = 0   # Write + fsync once per second. Maximum speed, ~1s app/OS crash risk.
```

---

### Group Commit

Issuing an `fsync()` system call for every individual `COMMIT` caps database throughput to the physical disk IOPS limit ($1 / 0.001\text{s} = 1,000 \text{ commits/sec}$). **Group Commit** amortizes disk sync overhead by batching multiple concurrent transaction commit requests into a single `fsync()` invocation.

#### Throughput Math: Individual vs Group Commit

$$\text{Throughput}_{\text{Single}} = \frac{1}{\text{Latency}_{\text{fsync}}} = \frac{1}{0.001\text{s}} = 1,000 \text{ TPS}$$

$$\text{Throughput}_{\text{Group}} = \frac{\text{Batch Size} \times 1}{\text{Latency}_{\text{fsync}} + \text{Queue Delay}} = \frac{50}{0.001\text{s} + 0.0001\text{s}} \approx 45,454 \text{ TPS}$$

#### Group Commit Lock-Free Pipeline Mechanism

<AcidGroupCommitPipelineDiagram />

1. **Flush Phase**: The first thread initiating commit becomes the **Group Leader**. Concurrent follower threads register their WAL commit requests in a lock-free queue.
2. **Sync Phase**: The Leader thread issues a single `fsync()` system call covering the combined WAL log sequence range of all queued transactions.
3. **Commit Phase**: Upon `fsync()` completion, the Leader marks all queued transactions committed and releases waiting follower threads.

#### Database Tuning Parameters

```sql
-- PostgreSQL Group Commit Tuning
SHOW commit_delay;     -- Microsecond sleep delay before flushing WAL (e.g. 100μs)
SHOW commit_siblings;  -- Minimum active concurrent transactions required before commit_delay applies (default 5)

-- MySQL InnoDB Binlog Group Commit Tuning (8.0+)
SHOW VARIABLES LIKE 'binlog_group_commit_sync_delay';       -- Delay in microseconds before flushing binlog (e.g. 100)
SHOW VARIABLES LIKE 'binlog_group_commit_sync_no_delay_count'; -- Max transactions to queue before overriding delay
```

---

## 🌐 Distributed ACID

### Two-Phase Commit (2PC)

Two-Phase Commit (2PC) is an atomic commitment protocol rendering all participating database nodes in a distributed transaction to either commit or roll back changes together.

#### Detailed Protocol State Machine & Sequence

<Acid2PcSequenceStateMachineDiagram />

#### 2PC WAL Logging Steps

1. **Phase 1 Prepare**: Participant node acquires necessary locks, writes a `PREPARE TRANSACTION` record to its local WAL, and responds `YES` to Coordinator.
2. **Coordinator Commit Log**: Once all participants respond `YES`, Coordinator writes a durable `COMMIT` record to its transaction log. The decision is now legally binding.
3. **Phase 2 Execution**: Coordinator sends `COMMIT` to participants. Participants execute commit, release locks, write `COMMIT` to local WAL, and return `ACK`.

---

#### 5-Scenario Failure & Recovery Matrix

| Failure Scenario | Timing / Location | System Behavior & Recovery Procedure |
| :--- | :--- | :--- |
| **1. Participant Abort** | Phase 1 (Participant returns `NO` or times out) | Coordinator aborts transaction; sends `ROLLBACK` to all participants. No partial writes occur. |
| **2. Participant Crash (Pre-Prepare)** | Phase 1 (Node crashes before writing `PREPARE` WAL) | Coordinator times out waiting for response, issues global `ROLLBACK`. |
| **3. Participant Crash (Post-Prepare)** | Phase 1 (Node crashes after writing `PREPARE` WAL) | **In-Doubt Transaction**: On restart, node reads `PREPARE` WAL, sees it is in `PREPARED` state, queries Coordinator for final decision (`COMMIT` or `ROLLBACK`). Holds locks until resolved. |
| **4. Coordinator Crash (Mid-Phase 1)** | Phase 1 (Coordinator crashes before logging decision) | Participants wait in `PREPARED` state. **Blocking Protocol Hazard**: Participants cannot decide independently because one node may have returned `NO`. Re-elected coordinator reads log, finds no decision, and issues `ROLLBACK`. |
| **5. Coordinator Crash (Post-Commit Log)** | Phase 2 (Coordinator logged `COMMIT` then crashed) | On restart, Coordinator re-reads its transaction log, detects un-acknowledged `COMMIT` state, and re-sends Phase 2 `COMMIT` commands to participants (Indoubt Recovery). |

:::warning[Why 2PC is a Coordinated Blocking Protocol]
If the Coordinator crashes after participants enter the `PREPARED` state (Scenario 4), participants **must hold resource locks indefinitely**. Unilateral commit by a participant risks split-brain inconsistency if another node voted `NO`. Unilateral abort risks inconsistency if the coordinator had logged `COMMIT`. This blocking vulnerability makes raw 2PC unsuitable for high-availability cloud-native microservices.
:::

### 3-Phase Commit (3PC)

Adds a **pre-commit** phase to allow non-blocking behavior if the coordinator fails, but is rarely used in practice due to complexity and inability to handle network partitions.

### Modern Alternatives to 2PC

| Solution | How it Works | Trade-off |
|----------|-------------|-----------|
| **Saga Pattern** | Chain of local transactions with compensating actions on failure | Eventually consistent; no locks held |
| **Outbox Pattern** | Write event to DB in same transaction, relay to message broker | At-least-once delivery; requires idempotent consumers |
| **Google Spanner** | TrueTime API + Paxos for external consistency | Proprietary; expensive; requires GPS clocks |
| **CockroachDB** | Distributed SQL with consensus-based transactions | Open source; higher latency than single-node |

### ACID vs BASE

| | ACID | BASE |
| :--- | :--- | :--- |
| **Full Form** | Atomicity, Consistency, Isolation, Durability | Basically Available, Soft State, Eventually Consistent |
| **Focus** | Strong consistency & correctness | High availability & horizontal scale |
| **State** | Hard (changes are immediate & atomic) | Soft (data converges over time) |
| **Consistency** | Immediate, strong | Eventual |
| **Conflict resolution** | Pessimistic (locks/abort) | Optimistic (last-write-wins, CRDTs) |
| **Examples** | PostgreSQL, MySQL, Oracle | Cassandra, DynamoDB, Couchbase |

---

## 💻 Code Examples

### Raw SQL: Full Transaction with Error Handling

```sql
-- PostgreSQL — bank transfer with explicit error guard
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1 AND balance >= 100;    -- atomic deduction with guard

-- Check that the row was actually updated (rowcount = 0 means insufficient balance)
DO $$
BEGIN
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient balance for account 1';
    END IF;
END;
$$;

UPDATE accounts
SET balance = balance + 100
WHERE id = 2;

COMMIT;
-- If any statement raises an exception, the whole transaction rolls back
```

### Preventing Lost Updates with Optimistic Locking

```sql
-- Add a version column
ALTER TABLE accounts ADD COLUMN version INTEGER DEFAULT 0;

-- Read with version
SELECT balance, version FROM accounts WHERE id = 1;  -- version=5

-- Update only if version hasn't changed (optimistic lock)
UPDATE accounts
SET balance = balance - 100,
    version = version + 1
WHERE id = 1 AND version = 5;   -- fails if someone else updated in between

-- If 0 rows updated: version mismatch → retry the transaction
```

### Java / Spring Boot: Declarative Transactions

```java
@Service
public class BankService {

    @Autowired
    private AccountRepository accountRepository;

    // Default: READ_COMMITTED isolation, REQUIRED propagation, RuntimeException rollback
    @Transactional(
        isolation    = Isolation.READ_COMMITTED,
        propagation  = Propagation.REQUIRED,
        rollbackFor  = Exception.class,
        timeout      = 30   // abort if transaction takes > 30 seconds
    )
    public void transferFunds(Long fromId, Long toId, BigDecimal amount) {
        // SELECT FOR UPDATE: locks the row pessimistically
        Account sender = accountRepository.findByIdWithLock(fromId)
            .orElseThrow(() -> new AccountNotFoundException("Sender not found"));
        sender.debit(amount);   // throws InsufficientFundsException if balance < amount

        Account recipient = accountRepository.findByIdWithLock(toId)
            .orElseThrow(() -> new AccountNotFoundException("Recipient not found"));
        recipient.credit(amount);

        accountRepository.save(sender);
        accountRepository.save(recipient);
        // Transaction commits here if no exception; rolls back on any exception
    }
}
```

```java
// Repository with pessimistic lock
public interface AccountRepository extends JpaRepository<Account, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)   // → SELECT FOR UPDATE
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdWithLock(@Param("id") Long id);
}
```

### Transaction Propagation

```java
// REQUIRED (default): join existing transaction or create new one
@Transactional(propagation = Propagation.REQUIRED)
public void doWork() { ... }

// REQUIRES_NEW: always create a new independent transaction (suspends outer)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void auditLog(String event) { ... }  // committed even if outer rolls back

// SUPPORTS: run in transaction if one exists, otherwise run non-transactionally
@Transactional(propagation = Propagation.SUPPORTS)
public Account readOnly() { ... }

// NOT_SUPPORTED: always run non-transactionally (suspend outer if exists)
// NEVER: throw if a transaction exists
// MANDATORY: throw if no transaction exists
```

:::caution[Self-Invocation Pitfall]
Spring `@Transactional` works via **AOP proxies**. Calling a `@Transactional` method from within the **same class** bypasses the proxy — the transaction annotation is ignored!

```java
// ❌ WRONG: self-call bypasses proxy, doInnerWork() has NO transaction
public void outerMethod() {
    this.doInnerWork();   // direct call, not through proxy
}

// ✅ FIX: inject self, or restructure into separate service classes
@Autowired
private BankService self;  // Spring injects the proxied bean

public void outerMethod() {
    self.doInnerWork();   // goes through proxy ✅
}
```
:::

---

## Interview Questions

**Q1. What is a "write skew" anomaly, and how do you prevent it?**
> Write skew occurs when two concurrent transactions each read overlapping data, make individually valid writes, but together violate a business invariant. The classic example: two doctors both go off-call when the rule is "at least one must be on-call." Both read 2 doctors on-call, both decide it's safe to leave, both commit — now 0 doctors are on-call.
>
> Prevention:
> - **`SERIALIZABLE` isolation** (uses SSI in PostgreSQL — detects the dependency cycle and aborts one transaction)
> - **`SELECT FOR UPDATE`** on the rows being checked (pessimistic lock prevents the concurrent read)
> - **Materializing the conflict** — create a concrete row to lock (e.g., a "shift slot" row for each time period)

**Q2. What is the difference between dirty read, non-repeatable read, and phantom read?**
> - **Dirty read**: Reading uncommitted data from another transaction. Prevented by READ COMMITTED and above.
> - **Non-repeatable read**: Reading the same row twice and getting different values because another transaction updated it and committed in between. Prevented by REPEATABLE READ and above.
> - **Phantom read**: Re-executing a range query and seeing new rows because another transaction inserted and committed in between. Prevented by SERIALIZABLE (and practically by PostgreSQL's REPEATABLE READ via snapshot isolation).

**Q3. How does MVCC eliminate the need for read locks?**
> MVCC stores multiple versions of each row. Each transaction gets a **consistent snapshot** — a point-in-time view based on which transaction IDs had committed at snapshot creation time. When a writer updates a row, it creates a new version; the old version remains. Readers see the version visible to their snapshot — no lock needed. Writers don't block readers; readers don't block writers. Only write-write conflicts require coordination.

**Q4. How does Write-Ahead Logging guarantee durability?**
> WAL ensures changes are durably logged **before** they are applied to data pages. Even if the server crashes, the Redo phase replays WAL records from the last checkpoint to restore all committed changes. The undo log (or MVCC old versions) is used to roll back uncommitted changes. The key insight: sequential log writes are fast; random data page writes happen asynchronously. Durability is guaranteed at log flush time, not data flush time.

**Q5. What is the difference between ACID Consistency and CAP Consistency?**
> They are completely different concepts that share a word. **ACID Consistency** means the database transitions between valid states that satisfy all defined constraints and invariants — it's about relational correctness on a single node. **CAP Consistency (Linearizability)** means in a distributed system, every read returns the most recent write across all nodes — it's about distributed agreement. Confusing them is a common interview mistake.

**Q6. Why is 2PC considered a blocking protocol?**
> In Two-Phase Commit, if the **coordinator fails after sending Prepare but before sending Commit/Rollback**, participant nodes are in a "prepared" state — they hold locks and cannot make progress. They must wait for the coordinator to recover. There's no safe way for participants to decide unilaterally: committing risks inconsistency if some nodes rolled back; rolling back risks inconsistency if some nodes committed. This is the fundamental limitation of 2PC — it's a Coordinated Blocking Protocol (CBP).

**Q7. What is the difference between pessimistic and optimistic locking?**
> **Pessimistic locking** (`SELECT FOR UPDATE`): Assumes conflicts are likely. Lock the row at read time, hold until commit. Safe but reduces concurrency — other transactions block.
>
> **Optimistic locking** (version columns): Assumes conflicts are rare. Read without locking, include version in UPDATE WHERE clause. If version changed (0 rows updated), retry. Higher concurrency at the cost of retry logic under contention.
>
> Choose pessimistic for high-contention, short transactions. Choose optimistic for low-contention, longer reads.

**Q8. Explain MVCC and VACUUM in PostgreSQL. What happens without VACUUM?**
> PostgreSQL's MVCC never modifies rows in-place — updates write a **new tuple version** and mark the old one with `xmax`. This leaves "dead tuples" (old versions no longer visible to any transaction). Without `VACUUM`, these dead tuples accumulate, causing **table bloat** (wasted disk space), **index bloat**, and eventually **transaction ID wraparound** — a catastrophic scenario where PostgreSQL freezes new writes to protect against ID collision (it will force a `VACUUM FREEZE` first). `autovacuum` normally prevents this by running VACUUM in the background automatically.

**Q9. What is the `@Transactional` self-invocation problem in Spring?**
> Spring's `@Transactional` is implemented via **AOP proxy**. When you call a transactional method from *within the same class* (e.g., `this.method()`), the call goes directly to the object — bypassing the proxy. The transaction interceptor never fires, so no transaction is started/joined. Fix: inject the bean itself via `@Autowired` to call the proxied version, or move the method to a separate Spring-managed service class.

**Q10. How would you handle a scenario where you need a new transaction regardless of the outer one?**
> Use `@Transactional(propagation = Propagation.REQUIRES_NEW)`. This suspends the outer transaction, starts a new independent one, commits or rolls back on its own, then resumes the outer transaction. Common use case: **audit logging** — you want the audit record committed even if the outer business transaction rolls back.

---

## 📊 Isolation Level Decision Guide

Choosing the right isolation level requires balancing **data correctness guarantees** against **throughput, concurrency, and deadlock risks**.

### Workload Decision Flowchart

<AcidIsolationFlowchartDiagram />

---

### Workload Trade-Off Evaluation Matrix

| Isolation Level | Throughput (TPS) | Latency Overhead | Lock Contention Risk | Serialization Failure / Retries | Key Anomaly Prevented |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **READ UNCOMMITTED** | Maximum | Lowest (~0 ms) | None | None | None (Allows Dirty Reads) |
| **READ COMMITTED** | High | Very Low (< 1 ms) | Low (Short statement locks) | None | Dirty Reads |
| **REPEATABLE READ** | Moderate | Low (1 - 5 ms) | Moderate (Gap locks in MySQL) | Low (Aborts on concurrent row update in PG) | Non-Repeatable Reads & Phantoms (PG) |
| **SERIALIZABLE** | Low to Moderate | High (10 - 100+ ms) | High (SSI Lock predicate tracking / 2PL) | High (Requires App Retry Loop) | All Anomalies (including Write Skew) |

---

### Production Implementation Recipes

#### Recipe 1: Standard OLTP — Atomic UPDATE (`READ COMMITTED`)

```java
// Spring Boot Service — Default Read Committed
@Transactional(isolation = Isolation.READ_COMMITTED)
public boolean processPayment(Long userId, BigDecimal amount) {
    // Atomic update prevents lost update without explicit locks
    int rowsUpdated = userRepository.deductBalance(userId, amount);
    if (rowsUpdated == 0) {
        throw new InsufficientBalanceException("Insufficient funds or account inactive");
    }
    return true;
}
```

```sql
-- Repository SQL
UPDATE users
SET balance = balance - :amount
WHERE id = :userId AND balance >= :amount;
```

#### Recipe 2: Hot Inventory / High Contention — Pessimistic Lock (`READ COMMITTED`)

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public void reserveTicket(Long eventId, Long userId) {
    // Lock event inventory row pessimistically
    Event event = eventRepository.findByIdForUpdate(eventId)
        .orElseThrow(() -> new EventNotFoundException(eventId));

    if (event.getAvailableSeats() <= 0) {
        throw new SoldOutException("No seats remaining");
    }

    event.setAvailableSeats(event.getAvailableSeats() - 1);
    eventRepository.save(event);
}
```

#### Recipe 3: Complex Business Invariant — PostgreSQL SSI (`SERIALIZABLE` + Retry Loop)

```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public void requestDoctorLeave(Long doctorId, Long shiftId) {
    int maxRetries = 3;
    while (true) {
        try {
            long onCallCount = doctorRepository.countOnCallDoctorsForShift(shiftId);
            if (onCallCount <= 1) {
                throw new IllegalStateException("Cannot take leave: at least 1 doctor must remain on-call");
            }
            doctorRepository.setDoctorOffCall(doctorId, shiftId);
            break; // Success
        } catch (ObjectOptimisticLockingFailureException | CannotSerializeTransactionException e) {
            if (--maxRetries == 0) throw e;
            // Short backoff delay before retrying serialization failure (SQLSTATE 40001)
            LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(50));
        }
    }
}
```

---

## Compare Next
- [Transactions & Concurrency](./transactions-concurrency.md)
- [Advanced SQL](./advanced-sql.md)
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [CAP Theorem & System Design](../system-design/cap-theorem.md)
