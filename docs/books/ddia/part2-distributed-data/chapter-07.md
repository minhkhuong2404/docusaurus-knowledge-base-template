---
id: chapter-07
title: "Chapter 7: Transactions"
sidebar_label: "Ch 7 — Transactions"
sidebar_position: 3
---

# Chapter 7: Transactions

## The Big Idea

Real applications are messy — the database can crash, network connections can drop, multiple clients write concurrently, and partial reads of partially updated data can cause bizarre bugs. **Transactions** group a set of reads and writes into a single logical unit — it either commits (fully succeeds) or aborts (fully rolls back). This simplification has been invaluable for decades.

This chapter breaks down what ACID really means, explores the many levels of transaction isolation, and shows what weaker isolation levels can go wrong.

---

## 🔒 The Meaning of ACID

ACID is widely cited but poorly understood. Different databases implement it differently.

### Atomicity

> All writes in a transaction succeed together, or none of them do.

If a transaction fails halfway, the already-applied writes are **rolled back**. The client can safely retry without fear of partial effects.

:::note
Atomicity is about **fault tolerance** (not concurrency — that's isolation).
:::

### Consistency

> The database must always be in a "valid" state (invariants must hold).

**This is actually a property of the application**, not the database! The database can check foreign key constraints and uniqueness, but it can't know about your business rules. The "C" in ACID is a bit of a stretch — it's mainly there to make the acronym work.

### Isolation

> Concurrently executing transactions do not interfere with each other.

Each transaction runs as if it were the only one running. In practice, this is expensive, and most databases offer **weaker isolation levels** for better performance.

### Durability

> Once a transaction commits, its data is not lost even on hardware failure.

In a single-node DB: means the data is written to disk (and WAL). In a replicated DB: means the data was replicated to multiple nodes before acknowledging the commit.

---

## 🔄 Single-Object and Multi-Object Operations

**Single-object atomicity:** Most databases provide this trivially — a single write to one row is atomic (you don't get a half-written JSON document). Some offer CAS (compare-and-set) operations.

**Multi-object transactions:** Much harder, especially in distributed databases. The need is real:
- Inserting a row and updating a counter (denormalized count in another table)
- Inserting a message and marking it unread in the user's inbox summary
- Updating multiple documents that reference each other

Many NoSQL databases lack multi-object transactions, forcing application developers to work around this (with compensating logic).

---

## ⚠️ Weak Isolation Levels

**Serializable isolation** (the gold standard) is expensive. Most databases use weaker levels for performance. Here are the isolation levels from weakest to strongest and the concurrency bugs they expose:

### Read Committed

**Guarantees:**
1. No dirty reads — you only see committed data
2. No dirty writes — you only overwrite committed data

**What it prevents:**
- Reading another transaction's uncommitted writes (dirty read)
- Overwriting another transaction's uncommitted writes (dirty write)

**What it does NOT prevent:**
- Nonrepeatable reads (read skew)

**Used by default in:** Oracle 11g, PostgreSQL, SQL Server, MemSQL.

**How it's implemented:** Use separate before/after values for each row; readers see the old value until the transaction commits.

### Snapshot Isolation (Repeatable Read)

**Guarantee:** Each transaction sees a consistent snapshot of the database from the moment it started. Even if other transactions commit during your transaction, you see the old values.

**What it prevents:**
- Read skew — seeing different states of data within one transaction

**Key use case:** Long-running reads (backups, analytics queries) that need a consistent view while writes continue.

**How it's implemented:** **MVCC (Multi-Version Concurrency Control)** — the database keeps multiple versions of each row, tagged with the transaction ID that created/deleted them. Readers access the version visible at their transaction start time.

**Used by:** PostgreSQL, Oracle, MySQL InnoDB, CockroachDB, and most serious databases.

### The Phantoms Problem

Even with snapshot isolation, a transaction can read a set of rows matching a condition, another transaction adds a new row matching that condition, and now your "consistent snapshot" is logically inconsistent (the new row wasn't there when you started).

This is called a **phantom** — a write in one transaction changes the results of a search query in another.

---

## 🐛 Concurrency Bugs: What Weak Isolation Allows

### Dirty Reads
Reading uncommitted writes from another transaction. Fixed by: Read Committed.

### Dirty Writes
Overwriting uncommitted writes from another transaction. Fixed by: Read Committed.

### Read Skew (Nonrepeatable Read)
Same query returns different results within one transaction (because another transaction committed between reads). Fixed by: Snapshot Isolation.

### Lost Updates
Two transactions read, modify, and write back the same value. One overwrites the other's change.

```
T1: read counter=42
T2: read counter=42
T1: write counter=43  (increment by 1)
T2: write counter=43  (increment by 1) ← WRONG! Should be 44
```

**Solutions:**
- **Atomic operations:** `UPDATE counters SET value = value + 1 WHERE key = 'x'` — database handles the read-modify-write atomically
- **Explicit locking:** `SELECT ... FOR UPDATE`
- **Compare-and-set:** Only write if value is still what you read

### Write Skew
Each transaction reads something, makes a decision, then writes — but the thing they read has changed by the time they write.

**Example:** On-call scheduling. Rule: at least one doctor must be on call. Alice and Bob both check and see two doctors on call. Alice calls in sick. Bob calls in sick. Now zero doctors are on call.

```
T1: read(count of on-call doctors) = 2 → ok, call in sick
T2: read(count of on-call doctors) = 2 → ok, call in sick
T1: update(alice.on_call = false)
T2: update(bob.on_call = false)
→ Invariant violated: 0 doctors on call
```

Write skew cannot be prevented by atomic operations on a single object. It requires **serializable isolation** or **materializing conflicts** (explicitly locking the rows read).

---

## 🔐 Serializability

**Serializable isolation:** The strongest isolation level. Concurrent transactions produce the same result as if they ran **serially** (one at a time, in some order).

Three main implementations:

### 1. Actual Serial Execution

Run transactions literally one at a time, on a single CPU thread. Surprisingly viable for certain workloads:
- In-memory datasets (fast enough that single-threaded is ok)
- **Stored procedures** — transactions are pre-committed code, not interactive round-trips

Used by: Redis (single-threaded), VoltDB/H-Store, Datomic.

**Limitation:** One CPU core = one partition = limited throughput. Stored procedures must be carefully written to avoid slow operations.

### 2. Two-Phase Locking (2PL)

The classic approach used in most databases for decades.

**Phase 1 (growing):** Acquire locks (read locks and write locks).
**Phase 2 (shrinking):** Release locks after the transaction commits.

- **Shared lock (read lock):** Multiple transactions can hold simultaneously
- **Exclusive lock (write lock):** Only one transaction can hold; blocks everyone else

If a transaction holds a write lock, readers are blocked. If a transaction holds a read lock, writers are blocked.

**Predicate locks:** Lock all rows matching a search condition, even ones that don't exist yet — prevents phantoms.

**Index-range locks:** Approximate of predicate locks, locking a range of the index — more practical.

**Problems with 2PL:**
- Performance: lock contention causes high latency and poor throughput
- **Deadlocks:** T1 waits for T2's lock; T2 waits for T1's lock → neither can proceed (database detects and aborts one)

Used by: MySQL (REPEATABLE READ level), DB2.

### 3. Serializable Snapshot Isolation (SSI)

A newer, optimistic approach (Michael Cahill, 2008). Let transactions proceed without blocking. At commit time, detect if serialization was violated and abort if necessary.

**Optimistic vs pessimistic concurrency control:**
- 2PL is **pessimistic** — block anything that might cause a conflict
- SSI is **optimistic** — let things proceed; abort if conflict detected at commit

SSI works well when conflicts are rare (high contention → many aborts → worse than 2PL). It tracks:
1. When a transaction's **premise** is invalidated (a value it read has been updated)
2. When a write affects an uncommitted read (stale MVCC reads)

If either is detected at commit, abort and retry.

Used by: PostgreSQL (since v9.1), CockroachDB.

---

## Summary

| Isolation Level | Dirty Reads | Dirty Writes | Read Skew | Lost Updates | Write Skew | Phantoms |
|---|---|---|---|---|---|---|
| Read Uncommitted | ✗ exposed | ✗ exposed | ✗ exposed | ✗ exposed | ✗ exposed | ✗ exposed |
| Read Committed | ✅ safe | ✅ safe | ✗ exposed | ✗ exposed | ✗ exposed | ✗ exposed |
| Snapshot Isolation | ✅ safe | ✅ safe | ✅ safe | ⚠️ partial | ✗ exposed | ✗ exposed |
| Serializable | ✅ safe | ✅ safe | ✅ safe | ✅ safe | ✅ safe | ✅ safe |

Transactions are one of the most important abstractions in computing. The key takeaway: **know your isolation level and know what bugs it can and cannot prevent.**
