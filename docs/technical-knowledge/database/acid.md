---
id: acid
title: Database ACID Properties
description: A deep-dive guide to ACID properties — Atomicity, Consistency, Isolation, Durability — covering isolation levels, MVCC, 2PL, WAL, write skew, distributed ACID, and practical interview questions.
tags: [database, transactions, acid, isolation, mvcc, wal, 2pl, concurrency, deep-dive]
sidebar_position: 5
---
import AcidIsolationAnomaliesDiagram from '@site/src/components/AcidIsolationAnomaliesDiagram';

# 🛡️ Database ACID Properties

In database systems, a **transaction** is a sequence of read and write operations treated as a single logical unit of work. To guarantee data integrity under concurrency and failures, relational databases enforce the **ACID** properties: **Atomicity**, **Consistency**, **Isolation**, and **Durability**.

:::tip[The four letters are not equally weighted]
ACID was named in a 1983 ACM Computing Surveys paper by Theo Härder and Andreas Reuter — for memorability, not symmetry. In practice:
- **Atomicity & Durability** — the database handles these almost entirely. You barely need to think about them.
- **Consistency** — half is the DB's job (constraints), half is yours (business rules). The half that's yours is the one that gets forgotten.
- **Isolation** — the only one with a tuning dial. Every real production incident involving data corruption traces back here.

If you ranked by "worth your time to deeply understand": **I → C → D → A**.
:::

This guide covers ACID from the ground up — simple analogies first, then low-level implementation mechanics, isolation anomalies, and senior-level interview traps.

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

Consider a **bank transfer of \$100 from Alice to Bob**. Two operations must both succeed:

1. **Deduct \$100** from Alice's account.
2. **Add \$100** to Bob's account.

```
[ Alice: $500 ]  ──( -$100 )──►  [ Deducted: $100 ]  ──( +$100 )──►  [ Bob: $200 ]
```

### 1. Atomicity — All or Nothing

If the server crashes **after** deducting from Alice but **before** crediting Bob, the \$100 would vanish. Atomicity guarantees this never happens — the database rolls back Alice's deduction, restoring her \$500.

### 2. Consistency — Rules Are Never Broken

The bank enforces: *"Balance cannot go negative."* If Alice has \$50 and tries to send \$100, the database rejects the whole transaction before it starts. The database always moves between valid states.

### 3. Isolation — Transactions are Private

While Alice's transfer is in-flight, Bob shouldn't see a fluctuating balance. Isolation ensures that concurrent transactions (e.g., Alice's husband simultaneously withdrawing at an ATM) see either the pre-transfer or post-transfer state — never a half-done state.

### 4. Durability — Committed = Permanent

The moment your screen shows *"Transfer Successful,"* the database has written that change to persistent storage. A power failure a second later doesn't undo it — when the system restarts, Bob still has his $100.

---

## 🔍 Deep Dive: Atomicity

"All-or-nothing" sounds simple until you ask: *how?* The key mechanic: before modifying a row, the database saves the old value somewhere. If the transaction must be undone, it restores from that saved copy. If the transaction commits successfully, the saved copy is no longer needed and gets cleaned up in the background.

This "save the old value" approach is called an **undo log**.

### Undo Log (Rollback Segment)

Every row modification writes the **before-image** (old value) to an **undo log** before changing the actual data.

```
Transaction T1: UPDATE accounts SET balance = 400 WHERE id = 1;

Undo Log entry:
  ┌──────────┬────────────────────────────────────┐
  │ Txn ID   │ Before-Image                       │
  ├──────────┼────────────────────────────────────┤
  │ T1       │ accounts: id=1, balance=500        │
  └──────────┴────────────────────────────────────┘
```

On `ROLLBACK` (or crash before `COMMIT`), the engine reads the undo log in reverse and restores original values.

- **InnoDB (MySQL)**: dedicated undo log segments in the system tablespace
- **PostgreSQL**: uses its MVCC tuple versioning (old tuple becomes the "undo" implicitly)

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

Every tuple (row version) has two hidden system columns:

```
┌──────────┬──────────┬─────────────────────────────────┐
│  xmin    │  xmax    │  user columns (id, balance, ...) │
├──────────┼──────────┼─────────────────────────────────┤
│ 100      │  0       │  id=1, balance=500               │  ← visible to txns >= 100
│ 102      │  0       │  id=1, balance=400               │  ← visible to txns >= 102
└──────────┴──────────┴─────────────────────────────────┘

xmin: transaction ID that CREATED this version
xmax: transaction ID that DELETED/UPDATED this version (0 = still live)
```

When a transaction reads, it uses its **snapshot** (a list of all active txn IDs at start time) to determine which row version is visible:
- A version is visible if `xmin` committed before the snapshot AND `xmax` is either 0 (not deleted) or committed after the snapshot

```sql
-- Two transactions running concurrently:
T1 (txn_id=200): UPDATE accounts SET balance=400 WHERE id=1;  -- creates new version xmin=200
T2 (txn_id=201): SELECT balance FROM accounts WHERE id=1;
  -- T2's snapshot was taken before T1 committed
  -- T2 sees the OLD version (xmin=100, balance=500) ← non-blocking!
```

**Key benefit**: Readers never block writers; writers never block readers. Each transaction sees a **consistent point-in-time snapshot**.

#### MySQL InnoDB MVCC

InnoDB doesn't keep multiple tuple versions in the main table — it reconstructs them from the **undo log**:

```
Current row:  id=1, balance=400, txn_id=200
Undo log ptr ──► id=1, balance=500, txn_id=100  (the old version)
```

When a reader needs the old version, InnoDB applies undo log records backward until it finds the version visible to its snapshot.

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

The core mechanism for durability. **The log must be written before the data pages.**

```
Write Operation:
  1. Write change to WAL buffer (in memory)      → fast
  2. Flush WAL buffer to WAL file on disk         → sequential write, fast
  3. Mark data page "dirty" in buffer pool        → in memory only
  4. COMMIT acknowledged to client                → durable at this point
  5. (Later) Checkpoint flushes dirty pages       → async, to data files

Crash & Recovery:
  1. Replay WAL from last checkpoint (Redo phase) → restore committed changes
  2. Undo uncommitted transactions                → rollback using undo log
```

```
                    ┌─────────────┐
Write Op ──────────►│ WAL Buffer  │
                    └──────┬──────┘
                           │ sequential fsync
                           ▼
                    ┌─────────────┐         ┌──────────────────┐
                    │ WAL on Disk │         │  Data Files on   │
                    │ (Redo Log)  │         │  Disk            │
                    └─────────────┘    ▲    └──────────────────┘
                                       │ async checkpoint
                    ┌─────────────┐    │
                    │ Buffer Pool │────┘
                    │ (dirty pgs) │
                    └─────────────┘
```

#### WAL Configuration (PostgreSQL)

```sql
-- Check WAL settings
SHOW wal_level;              -- minimal | replica | logical
SHOW synchronous_commit;     -- on | off | local | remote_apply

-- synchronous_commit = off: WAL written async (up to ~600ms data loss on crash)
-- synchronous_commit = on:  WAL flushed to disk before COMMIT returns (default)
```

### The `fsync()` System Call

OSes buffer disk writes in memory. `fsync()` forces the OS to flush write buffers to the physical disk:

```
Database ──► OS Write Buffer (RAM) ──( fsync() )──► Physical Disk / Flash
                   ↑
         Without fsync, a power loss here = data loss
         even if the DB thinks it committed
```

| Config | Safety | Performance |
|--------|--------|-------------|
| `fsync = on` (default) | ✅ Full durability | Slower (disk sync on every commit) |
| `fsync = off` | ❌ Data loss on OS crash | Much faster (dangerous for production) |
| `synchronous_commit = off` | ⚠️ ~600ms window of data loss | 3-5x faster writes |

:::caution[fsync = off is dangerous]
Never turn off `fsync` in production. A power failure or OS crash can corrupt the entire database — not just lose recent writes, but cause full data corruption because WAL and data files are out of sync.
:::

### Group Commit

To amortize the cost of `fsync()`, databases batch multiple transactions' WAL writes into a single disk flush:

```
T1 commits ─────────────────┐
T2 commits ──────────────── ┼──► Single fsync() ──► disk
T3 commits ─────────────────┘

Instead of 3 separate fsyncs, only 1 is needed.
```

PostgreSQL does this automatically. It significantly increases throughput under concurrent write load.

---

## 🌐 Distributed ACID

### Why You Need to Understand This Even Without Microservices

Once a system grows beyond a single database — microservices with separate DBs, event-driven pipelines, cross-service workflows — single-node ACID no longer applies. A transaction that touches two separate databases cannot use the same `BEGIN`/`COMMIT`. People move to Saga patterns, outbox patterns, eventual consistency.

But here's the catch: **you can only design a good Saga if you understand what ACID was protecting you from.** You need to know which steps need compensating transactions (undo actions if a later step fails), which intermediate states are acceptable, and where data can be temporarily inconsistent. Abandoning something you don't understand is not an engineering trade-off — it's data loss waiting to happen.

### The Scaling Problem

Single-node ACID is well-understood. Across multiple nodes:
- Nodes can fail independently
- Network partitions can occur
- Clock skew makes ordering events difficult

### Two-Phase Commit (2PC)

The standard protocol for atomic commits across multiple nodes:

```
Phase 1 — Prepare:
  Coordinator ──► Node A: "Can you commit?"
  Coordinator ──► Node B: "Can you commit?"
  Node A ──────► Coordinator: "YES" (locks resources, writes prepare log)
  Node B ──────► Coordinator: "YES"

Phase 2 — Commit:
  Coordinator ──► Node A: "COMMIT"
  Coordinator ──► Node B: "COMMIT"
  (or ROLLBACK if any node said NO or timed out)
```

```sql
-- PostgreSQL distributed example using PREPARE TRANSACTION
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
PREPARE TRANSACTION 'txn_transfer_001';   -- durable prepare point

-- Later (from coordinator):
COMMIT PREPARED 'txn_transfer_001';       -- or ROLLBACK PREPARED
```

:::warning[2PC Failure Modes]
- **Coordinator crashes after Phase 1**: Participant nodes hold locks **indefinitely** — they can't decide without the coordinator's Phase 2 message
- **Network partition during Phase 2**: Some nodes commit, others don't — data inconsistency until coordinator recovers
- 2PC is a **blocking protocol** — it has a Single Point of Failure
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

```
What anomalies can you tolerate?
│
├─ Can tolerate dirty reads (dangerous, almost never) → READ UNCOMMITTED
│
├─ Need to avoid dirty reads only → READ COMMITTED
│    └─ Most OLTP workloads, default for PostgreSQL/Oracle
│
├─ Need stable reads within a transaction → REPEATABLE READ
│    └─ Reports that read the same data multiple times
│    └─ MySQL InnoDB default
│
└─ Need complete isolation (no anomalies at all) → SERIALIZABLE
     └─ Financial transactions, inventory allocation
     └─ Use PostgreSQL SSI for performance; MySQL uses 2PL (slower)
```

---

## Compare Next
- [Transactions & Concurrency](./transactions-concurrency.md)
- [Advanced SQL](./advanced-sql.md)
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [CAP Theorem & System Design](../system-design/cap-theorem.md)
