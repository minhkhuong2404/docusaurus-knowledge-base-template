---
id: isolation-levels
title: "Database Isolation Levels — How to Get It Right"
description: "Deep-dive into all 5 isolation anomalies (dirty read, non-repeatable, phantom, lost update, write skew), the 4 standard isolation levels, PostgreSQL vs MySQL vs Oracle implementation differences, snapshot scope (per-statement vs per-transaction), practical fix strategies without raising isolation, and the spec vs implementation distinction."
tags: [database, transactions, isolation, mvcc, serializable, write-skew, lost-update, postgresql, mysql, concurrency]
sidebar_position: 6
---
import IsolationLevelDiagram from '@site/src/components/IsolationLevelDiagram';
import AcidIsolationAnomaliesDiagram from '@site/src/components/AcidIsolationAnomaliesDiagram';
import TwoPhaseLockingMechanismDiagram from '@site/src/components/TwoPhaseLockingMechanismDiagram';

# Database Isolation Levels — How to Get It Right

A few years ago, a production bug landed on a review: a digital wallet. End of day, balance off by a few hundred thousand. No exceptions in the logs. Code looked correct — SELECT balance, check funds, UPDATE to deduct. Ran fine in isolation. The problem: production never runs in isolation.

Two withdrawal requests arrived nearly simultaneously. Both read balance = 500k. Both checked "enough funds?" — yes. Both deducted. The second write overwrote the first. One deduction silently vanished.

The fix was straightforward. The interesting question was: *why do engineers who write database code every day almost never think about isolation levels?*

---

## 📚 Table of Contents

- [The Root Problem: Concurrent Transactions and Anomalies](#the-root-problem)
- [The 5 Anomalies — Standard and Beyond](#the-5-anomalies)
- [The 4 Isolation Levels — Standard Spec](#the-4-isolation-levels)
- [Spec ≠ Implementation: PostgreSQL Deep Dive](#spec--implementation-postgresql-deep-dive)
- [MySQL and Oracle Differences](#mysql-and-oracle-differences)
- [Two Layers: What You Set vs What Database Does](#two-layers-what-you-set-vs-what-database-does)
- [MVCC — How Isolation Is Actually Achieved](#mvcc--how-isolation-is-actually-achieved)
- [Practical Strategies: Handle Anomalies Without Raising Isolation](#practical-strategies)
- [The Question to Answer First](#the-question-to-answer-first)

---

## The Root Problem

When multiple transactions run concurrently and touch the same data, certain wrong outcomes become possible — collectively called *anomalies*. Isolation level is a dial: how much concurrency do you allow, and which anomalies do you accept as the price?

The ANSI SQL 1992 standard defined three anomalies and four isolation levels around them. In 1995, a landmark paper — *"A Critique of ANSI SQL Isolation Levels"* — showed that the standard was too vague, and had missed an entire class of anomalies. The two most important additions: **lost update** and **write skew** — both silently corrupt data with zero exceptions in the logs.

<IsolationLevelDiagram initialTab="anomalies" />

---

## The 5 Anomalies — Standard and Beyond

### 1. Dirty Read (ANSI SQL 1992 — P1)

Transaction A modifies a row but hasn't committed. Transaction B reads that uncommitted value. Then A rolls back. B just acted on data that never officially existed.

```
T1: UPDATE balance = $0 WHERE id = 1;  -- not yet committed
T2:   SELECT balance FROM accounts WHERE id = 1;  -- sees $0!
T1: ROLLBACK;  -- T2 read data that never existed
```

**Prevented by:** READ COMMITTED or higher.

> PostgreSQL silently upgrades READ UNCOMMITTED to READ COMMITTED. Dirty reads are impossible in PostgreSQL regardless of what you declare.

---

### 2. Non-Repeatable Read (ANSI SQL 1992 — P2)

In the same transaction, the same row is read twice and returns different values — because another transaction committed a change between the two reads.

```
T1: SELECT balance FROM accounts WHERE id = 1;  -- returns $500
T2:     UPDATE accounts SET balance = $300 WHERE id = 1; COMMIT;
T1: SELECT balance FROM accounts WHERE id = 1;  -- returns $300 ← different!
```

**Prevented by:** REPEATABLE READ or higher.

---

### 3. Phantom Read (ANSI SQL 1992 — P3)

Like non-repeatable, but at the set level. A range query returns a different count on two executions within the same transaction — because another transaction inserted a qualifying row in between.

```
T1: SELECT COUNT(*) FROM accounts WHERE balance > 100;  -- returns 5
T2:     INSERT INTO accounts (balance) VALUES (200); COMMIT;
T1: SELECT COUNT(*) FROM accounts WHERE balance > 100;  -- returns 6 ← phantom!
```

**Prevented by:** SERIALIZABLE (standard) — or REPEATABLE READ in PostgreSQL (per-transaction snapshot naturally blocks phantoms).

---

### 4. Lost Update (1995 Critique — P4)

The e-wallet bug. Two transactions both read the same row, compute based on that value, and write their result. The second write silently overwrites the first.

```sql
T1: balance = SELECT balance FROM accounts WHERE id=1;  -- 500
T2: balance = SELECT balance WHERE id=1;                -- 500
T1: UPDATE accounts SET balance = 500 - 100 = 400 WHERE id=1;
T2: UPDATE accounts SET balance = 500 - 200 = 300 WHERE id=1; ← T1's deduction is lost!
-- Final: 300. Should be: 200. 100 vanished silently.
```

**Prevented by:** REPEATABLE READ (PostgreSQL aborts the loser) / `SELECT FOR UPDATE` / atomic `UPDATE`.

> **The most dangerous anomaly in production** because it produces no exception. The only symptom is an end-of-day balance reconciliation failure.

---

### 5. Write Skew (1995 Critique — P5)

Two transactions read overlapping data, make individually valid decisions, then write to **different rows**. Their combined result violates a shared invariant.

```sql
-- Rule: at least 1 doctor on-call at all times
-- Current: An and Binh are both on-call

T1 (An requests leave):
    SELECT COUNT(*) FROM doctors WHERE on_call = true;  -- sees 2, ok
    UPDATE doctors SET on_call = false WHERE id = 1;    -- An's row

T2 (Binh requests leave, concurrent):
    SELECT COUNT(*) FROM doctors WHERE on_call = true;  -- also sees 2, ok
    UPDATE doctors SET on_call = false WHERE id = 2;    -- Binh's row

-- Both COMMIT. 0 doctors on-call. Invariant BROKEN.
```

**Why write skew is harder than lost update:** Lost update has two transactions writing the *same row* — there's a direct collision the database can detect. Write skew has each transaction writing a *different row* — no direct collision exists. The conflict is at the invariant level, invisible to the database unless you tell it what to guard.

**Prevented by:** SERIALIZABLE (SSI) — or materializing the invariant into a lockable row.

---

## The 4 Isolation Levels — Standard Spec

<IsolationLevelDiagram initialTab="matrix" />

| Isolation Level | Dirty Read | Non-Repeatable | Phantom | Lost Update | Write Skew |
|---|:---:|:---:|:---:|:---:|:---:|
| **READ UNCOMMITTED** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **READ COMMITTED** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **REPEATABLE READ** | ❌ | ❌ | ✅* | ✅ | ✅ |
| **SERIALIZABLE** | ❌ | ❌ | ❌ | ❌ | ❌ |

> **This table describes the spec** — what anomalies each level *must* prevent. It says nothing about *how* the database achieves it. That distinction matters enormously.

The four levels are a dial: higher = safer, but more lock contention, more deadlocks, lower throughput.

:::warning[Don't default to Serializable "for safety"]
A ticket-booking system set all transactions to SERIALIZABLE "just to be safe." At peak load, transactions queued waiting for locks, timeouts cascaded, and the dashboard went red. The fix: drop to READ COMMITTED and handle inventory specifically with targeted `SELECT FOR UPDATE`. ACID isolation is not an on/off switch — it's a dial. Choose deliberately.
:::

---

## Spec ≠ Implementation: PostgreSQL Deep Dive

<IsolationLevelDiagram initialTab="implementations" />

:::important[Every database implements isolation differently]
The same level name can have completely different behaviour across databases. The spec defines the floor — what anomalies a level must prevent. Each database is free to prevent more. Trusting a level name without verifying the implementation is how subtle bugs enter production.
:::

### PostgreSQL Has No Real READ UNCOMMITTED

You can declare it, but PostgreSQL silently runs it as READ COMMITTED. Dirty reads are impossible in PostgreSQL, regardless of what you set.

### PostgreSQL READ COMMITTED — Per-Statement Snapshot

Each SQL statement takes a **fresh snapshot at execution time**. Two SELECTs in the same transaction can see different committed data — because each looks at a newer snapshot.

```sql
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- snapshot at 10:00:01 → $500
-- (another transaction commits: $300)
SELECT balance FROM accounts WHERE id = 1;  -- snapshot at 10:00:04 → $300 ← different!
COMMIT;
```

### PostgreSQL REPEATABLE READ — Per-Transaction Snapshot (Snapshot Isolation)

One snapshot is taken at the first statement and **held for the entire transaction**. Every read sees the same frozen world.

```sql
BEGIN;  -- snapshot taken here
SELECT balance FROM accounts WHERE id = 1;  -- $500
-- (another transaction commits: $300)
SELECT balance FROM accounts WHERE id = 1;  -- still $500 ← same snapshot
COMMIT;
```

**PostgreSQL REPEATABLE READ prevents more than the standard requires:**
- **Phantom reads** — the frozen snapshot blocks new rows from appearing
- **Lost updates** — if two transactions try to update the same row, the second is **aborted** with `ERROR: could not serialize access due to concurrent update`. It doesn't silently overwrite — it loudly fails so your application can retry.

**But REPEATABLE READ still allows write skew** — An and Binh write different rows, no direct collision, both commit.

### PostgreSQL SERIALIZABLE — SSI (Serializable Snapshot Isolation)

PostgreSQL tracks read-write dependency edges between concurrent transactions. If it detects a cycle that would produce a non-serializable outcome, it aborts one transaction. This is how it catches the doctor write skew scenario.

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT COUNT(*) FROM doctors WHERE on_call = true;
-- If ok:
UPDATE doctors SET on_call = false WHERE id = ?;
COMMIT;
-- Must catch serialization_failure and retry!
```

---

## MySQL and Oracle Differences

**MySQL InnoDB** defaults to REPEATABLE READ — higher than PostgreSQL's default. It uses gap locks alongside MVCC to prevent phantoms in some cases. The mechanism differs from PostgreSQL's pure-snapshot approach.

**Oracle's "SERIALIZABLE"** is actually Snapshot Isolation under the hood — it prevents phantoms but still allows write skew. Same label, fundamentally weaker guarantee than PostgreSQL's SERIALIZABLE. A team that relied on the name without reading Oracle's documentation could ship broken invariant enforcement.

---

## Two Layers: What You Set vs What Database Does

<TwoPhaseLockingMechanismDiagram />

| Layer | What it is | Example |
|---|---|---|
| **Isolation Level (Spec)** | Behavioural contract — which anomalies the DB promises to prevent | `REPEATABLE READ` means non-repeatable reads won't happen |
| **Implementation** | How the DB achieves the promise — MVCC, locks, SSI | PostgreSQL uses per-transaction snapshot + abort-on-conflict |

These layers are independent. The spec says *what*; the implementation says *how*. The same "what" can have different "hows" — and sometimes the name on the dial doesn't match the actual behaviour underneath (Oracle's SERIALIZABLE).

---

## MVCC — How Isolation Is Actually Achieved

**Multi-Version Concurrency Control**: when you UPDATE a row, the database doesn't overwrite the old value. It creates a new version, keeps the old one around for transactions that started before this change.

Think of it as photocopying the morning newspaper before boarding a train. Outside, news keeps updating. But your copy stays consistent from page 1 to the last page — you're never reading a mix of yesterday's and today's articles.

```
-- PostgreSQL hidden columns on every row:
xmin: transaction ID that CREATED this version
xmax: transaction ID that DELETED/REPLACED this version (0 = still live)

-- T100 reads: sees rows where xmin <= 100 and xmax = 0 (or xmax > 100)
-- T102 writes: creates new version (xmin=102), old version still exists with xmax=102
-- T100 can still read the old version — no lock needed
```

**Why MVCC wins:** Readers never block writers. Writers never block readers. Each transaction reads its own snapshot. No global serialization lock.

When you do need to enforce ordering — `SELECT ... FOR UPDATE` — PostgreSQL steps out of pure MVCC mode and places a real row lock. MVCC handles the "read without blocking" case; explicit locks handle "I need exclusive write access before I proceed."

---

## Practical Strategies

<IsolationLevelDiagram initialTab="fixes" />

In practice, most teams keep the database default and handle anomalies at the query level. Raising isolation level adds lock contention and requires retry loops everywhere. These fixes usually cost less.

### Handling Lost Update

**Option 1 — Atomic UPDATE (cleanest, no extra lock):**

```sql
UPDATE accounts
SET balance = balance - 70
WHERE id = ? AND balance >= 70;
-- Check affected rows: 0 means insufficient funds OR lost race → handle accordingly
```

The database locks this row for the duration of the statement. No gap between read and write — the race condition can't exist.

**Option 2 — Optimistic Locking (low contention):**

```sql
UPDATE accounts
SET balance = ?, version = version + 1
WHERE id = ? AND version = ?;
-- 0 rows updated = someone changed it → retry
```

```java
@Entity
public class Account {
    @Version  // JPA handles this automatically
    private Long version;
}
```

Best when conflicts are rare. Under heavy contention (flash sale inventory), retries pile up exactly when you need throughput most.

**Option 3 — Pessimistic Locking (hot rows):**

```sql
BEGIN;
SELECT balance FROM accounts WHERE id = ? FOR UPDATE;  -- locks row immediately
-- compute ...
UPDATE accounts SET balance = ? WHERE id = ?;
COMMIT;
```

Other transactions trying to `SELECT FOR UPDATE` the same row block until this one commits. No retries needed, but lock duration directly impacts concurrency.

### Handling Write Skew

Before reaching for SERIALIZABLE — which requires retry loops everywhere and sees abort rate climb under load — check if you can **materialize the invariant into a lockable row**.

Write skew happens because the invariant ("at least 1 doctor on-call") lives in an aggregate that no transaction locks. Create a concrete row representing the constraint and lock it:

```sql
BEGIN;
-- Lock the on-call slot row — makes the invisible invariant visible to the lock manager
SELECT * FROM on_call_slots WHERE shift_id = ? FOR UPDATE;

SELECT COUNT(*) FROM doctors WHERE on_call = true AND shift_id = ?;
-- IF count > 1 THEN
UPDATE doctors SET on_call = false WHERE id = ?;
-- ELSE raise exception
COMMIT;
```

By locking `on_call_slots`, both concurrent transactions queue on the same lock. The second sees the real post-first-commit state and correctly rejects the request. The invariant is now visible to the lock manager.

---

## The Question to Answer First

<IsolationLevelDiagram initialTab="spec-vs-impl" />

Isolation level is a **contract**: the database hides these anomalies; you handle the rest. Every time you lower the level, you accept more responsibility — and the database won't remind you. It silently produces the correct-or-incorrect result as specified by the contract.

> *"In this business operation, what invariant must always hold — and what data do I **read** to make the decision but **not write**?"*

The data you read-but-not-write is your write skew risk surface. Once you identify it:
- **If it fits in one statement** → atomic UPDATE. Done.
- **If it's low contention** → optimistic locking with `@Version`.
- **If it's a hot row** → `SELECT FOR UPDATE`.
- **If it's an aggregate invariant** → materialize into a lockable row.
- **If it's genuinely complex** → SERIALIZABLE with retry loops as last resort.

The isolation level you need is the **consequence** of this analysis — not a setting you pick upfront and hope for the best.

---

## Summary: Default Behavior by Database

| Database | Default Level | Snapshot Scope | Notable Quirks |
|---|---|---|---|
| **PostgreSQL** | READ COMMITTED | Per-statement | No real READ UNCOMMITTED. REPEATABLE READ also blocks phantoms + aborts on lost update. SERIALIZABLE uses SSI. |
| **MySQL InnoDB** | REPEATABLE READ | Per-transaction | Uses gap locks for phantom prevention. Different from PG. |
| **Oracle** | READ COMMITTED | Per-statement | "SERIALIZABLE" is actually Snapshot Isolation — still allows write skew. |
| **SQL Server** | READ COMMITTED | Lock-based by default | Must opt in to MVCC mode (READ_COMMITTED_SNAPSHOT). |

:::tip[Set isolation per transaction, not globally]
`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;` applies only to that one transaction. The rest of your system keeps running at its own level. Changing the database-wide default has a much wider blast radius — reserve that for carefully considered infrastructure decisions.
:::

```java
// Spring — set per method, affects only that transaction
@Transactional(isolation = Isolation.SERIALIZABLE)   // for write skew prevention
@Transactional(isolation = Isolation.READ_COMMITTED)  // PostgreSQL default
@Transactional(isolation = Isolation.REPEATABLE_READ) // when you re-read rows
```
