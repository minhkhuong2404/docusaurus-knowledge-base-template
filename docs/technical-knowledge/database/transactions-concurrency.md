---
id: transactions-concurrency
title: Transactions & Concurrency Control
description: ACID properties, isolation levels, locking mechanisms, MVCC, deadlocks, and optimistic vs pessimistic concurrency.
tags: [database, transactions, acid, isolation, locking, mvcc, concurrency, deadlock]
sidebar_position: 4
---

# Transactions & Concurrency Control

## What is a Transaction?

A **transaction** is a sequence of operations treated as a single logical unit of work. Either **all** operations succeed (commit) or **none** take effect (rollback).

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- Or: ROLLBACK; if something fails
```

---

## ACID Properties

| Property | Description |
|----------|-------------|
| **Atomicity** | All-or-nothing: either all operations commit or all are rolled back |
| **Consistency** | Transaction brings DB from one valid state to another; constraints are never violated |
| **Isolation** | Concurrent transactions don't interfere with each other (degree depends on isolation level) |
| **Durability** | Once committed, data survives crashes (written to persistent storage / WAL) |

### How each property is implemented

| Property | Mechanism |
|----------|-----------|
| Atomicity | Undo log / rollback log |
| Consistency | Constraints, triggers, application logic |
| Isolation | Locks, MVCC |
| Durability | WAL (Write-Ahead Log), fsync |

---

## Concurrency Problems

| Problem | Description |
|---------|-------------|
| **Dirty Read** | Reading uncommitted data from another transaction |
| **Non-Repeatable Read** | Same row returns different values in same transaction (another tx committed UPDATE) |
| **Phantom Read** | Same query returns different set of rows (another tx committed INSERT/DELETE) |
| **Lost Update** | Two txns read-modify-write same data; one overwrites the other's change |
| **Write Skew** | Two txns read overlapping data, make non-overlapping writes that violate a constraint |

---

## Isolation Levels

Defined by SQL standard, each level prevents different anomalies:

| Isolation Level | Dirty Read | Non-Repeatable | Phantom | Notes |
|-----------------|-----------|----------------|---------|-------|
| `READ UNCOMMITTED` | ✅ possible | ✅ possible | ✅ possible | Fastest, riskiest |
| `READ COMMITTED` | ❌ prevented | ✅ possible | ✅ possible | Default in PostgreSQL, Oracle |
| `REPEATABLE READ` | ❌ | ❌ prevented | ✅ possible (standard) | Default in MySQL InnoDB (but InnoDB also prevents phantoms via gap locks) |
| `SERIALIZABLE` | ❌ | ❌ | ❌ prevented | Slowest; fully serial behavior |

```sql
-- Set in MySQL
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Per transaction in PostgreSQL
BEGIN ISOLATION LEVEL SERIALIZABLE;
```

---

## Locking

### Shared vs Exclusive Locks

| Lock | Abbreviation | Who Holds It | Compatible With |
|------|-------------|-------------|-----------------|
| Shared (Read) Lock | S | Reader | Other S locks |
| Exclusive (Write) Lock | X | Writer | Nothing |

```sql
-- Explicit locks in PostgreSQL
SELECT * FROM accounts WHERE id = 1 FOR SHARE;   -- S lock
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;  -- X lock
```

### Lock Granularity

From finest to coarsest:
- **Row-level lock** — best concurrency, most overhead per lock
- **Page-level lock**
- **Table-level lock** — simple, less overhead, worst concurrency
- **Database-level lock**

InnoDB uses **row-level locking** by default. DDL operations acquire table-level locks.

### Gap Locks & Next-Key Locks (InnoDB)

InnoDB uses **next-key locks** (row lock + gap lock) in `REPEATABLE READ` to prevent phantom reads:

```
Rows: [10, 20, 30]
Gap locks cover: (-∞,10), (10,20), (20,30), (30,+∞)
```

A query `WHERE id BETWEEN 15 AND 25` locks the gap, preventing inserts into that range.

---

## MVCC — Multi-Version Concurrency Control

MVCC allows readers and writers to **not block each other** by keeping multiple versions of rows.

**How it works (PostgreSQL):**
- Every row has `xmin` (transaction that created it) and `xmax` (transaction that deleted/updated it)
- A reader sees the **snapshot** of data from when its transaction started
- Writes create new row versions; old versions are cleaned up by `VACUUM`

**How it works (MySQL InnoDB):**
- Uses an **undo log** to reconstruct older row versions
- Each transaction gets a **read view** at the start (or first read, depending on isolation level)

```
Time →
T1 starts: sees snapshot A
T2 commits UPDATE (row v2 created)
T1 re-reads: still sees snapshot A (v1) — no non-repeatable read
T1 commits
```

**Benefits:**
- Readers don't block writers
- Writers don't block readers
- Consistent snapshots for long-running queries

---

## Deadlocks

A **deadlock** occurs when two (or more) transactions are each waiting for a lock held by the other.

```
T1 holds lock on row A, waiting for row B
T2 holds lock on row B, waiting for row A
→ Deadlock!
```

### Detection and Resolution
- DBs detect deadlocks automatically (cycle detection in wait-for graph)
- The DB **kills** one transaction (typically the one with less work done) and rolls it back
- The application should **retry** the rolled-back transaction

### Prevention Strategies
1. **Always acquire locks in the same order** — most effective
2. Keep transactions **short** — reduces lock hold time
3. **Lock at start** of transaction if possible (`SELECT ... FOR UPDATE` upfront)
4. Use lower isolation levels if safe
5. Use **optimistic locking** (no DB locks at all)

```java
// Spring: retry on deadlock
@Retryable(
    value = {DeadlockLoserDataAccessException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 100)
)
@Transactional
public void transferFunds(Long fromId, Long toId, BigDecimal amount) { ... }
```

---

## Optimistic vs Pessimistic Locking

### Pessimistic Locking
Assumes conflicts **will** happen → lock the resource immediately.

```sql
-- Lock row for update
SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
```

```java
// JPA pessimistic lock
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT i FROM Inventory i WHERE i.productId = :id")
Inventory findByProductIdForUpdate(@Param("id") Long id);
```

### Optimistic Locking
Assumes conflicts are **rare** → no DB lock; check version at commit time.

```sql
-- version column approach
UPDATE orders SET status = 'shipped', version = version + 1
WHERE id = 42 AND version = 3;
-- If 0 rows updated → conflict, retry
```

```java
// JPA optimistic lock
@Entity
public class Order {
    @Id Long id;

    @Version  // Hibernate manages this automatically
    private Integer version;
}
// Throws OptimisticLockException if version mismatch at commit
```

| | Pessimistic | Optimistic |
|--|------------|-----------|
| Contention | High read/write contention | Low contention |
| Performance | Lower (lock overhead) | Higher (no locks) |
| Failure mode | Blocks / deadlocks | Retry on conflict |
| Use case | Financial, inventory | User profiles, reads |

---

## Savepoints

```sql
BEGIN;
  INSERT INTO orders VALUES (...);
  SAVEPOINT sp1;
  UPDATE inventory SET qty = qty - 1 WHERE id = 5;
  -- Something went wrong:
  ROLLBACK TO SAVEPOINT sp1;
  -- First INSERT is still active
COMMIT;
```

---

## Spring `@Transactional`

```java
@Service
public class OrderService {

    // Default: REQUIRED (joins existing or creates new)
    @Transactional
    public void placeOrder(OrderRequest req) { ... }

    // Always creates a new transaction
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void auditLog(String msg) { ... }

    // Readonly hint — allows DB optimizations, disables flush
    @Transactional(readOnly = true)
    public List<Order> getOrders(Long userId) { ... }

    // Custom isolation
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void criticalOperation() { ... }

    // Rollback only on specific exceptions (default: unchecked)
    @Transactional(rollbackFor = InsufficientFundsException.class)
    public void transfer(...) throws InsufficientFundsException { ... }
}
```

### Propagation Levels

| Propagation | Behavior |
|-------------|---------|
| `REQUIRED` | Join existing or create new (default) |
| `REQUIRES_NEW` | Always create new; suspend current |
| `SUPPORTS` | Join if exists; no tx if none |
| `NOT_SUPPORTED` | Suspend current tx; run without tx |
| `MANDATORY` | Must have existing tx; throw if none |
| `NEVER` | Must NOT have tx; throw if one exists |
| `NESTED` | Nested tx with savepoints |

:::caution Self-invocation trap
`@Transactional` only works via Spring's proxy. Calling a `@Transactional` method **from within the same class** bypasses the proxy — the transaction annotation is ignored!
:::

---

## 🎯 Interview Questions

**Q1. Explain ACID properties with an example.**
> Using a bank transfer: Atomicity — debit and credit both happen or neither does. Consistency — account balance never goes negative (constraint). Isolation — another query doesn't see the partially-transferred amount. Durability — after commit, power failure doesn't lose the data.

**Q2. What is the difference between Repeatable Read and Serializable?**
> Repeatable Read prevents dirty reads and non-repeatable reads but still allows phantom reads (new rows appearing). Serializable prevents all anomalies by making transactions behave as if run serially — typically via predicate locking or SSI (Serializable Snapshot Isolation in PostgreSQL).

**Q3. What is MVCC and why is it useful?**
> MVCC maintains multiple versions of rows so readers see a consistent snapshot without blocking writers and vice versa. This dramatically improves concurrency compared to pure locking. PostgreSQL uses heap row versions; MySQL InnoDB uses undo logs.

**Q4. What causes a deadlock and how is it resolved?**
> A deadlock occurs when transactions form a cycle of lock dependencies (T1 waits for T2's lock, T2 waits for T1's). DBs auto-detect via wait-for graphs and abort the cheapest victim transaction. Prevention: consistent lock ordering, short transactions, optimistic locking.

**Q5. What is the difference between optimistic and pessimistic locking?**
> Pessimistic: acquires DB locks (FOR UPDATE) assuming conflict is likely — safe but may cause contention. Optimistic: uses a version/timestamp column; detects conflict only at commit time and retries — better for low-contention scenarios.

**Q6. In Spring, what happens if a `@Transactional` method calls another `@Transactional` method in the same class?**
> The inner method's `@Transactional` is **ignored** because Spring's AOP proxy is bypassed for self-invocations. The inner call runs in the same transaction as the outer. Fix: inject the bean and call it externally, or use `ApplicationContext.getBean()`.

**Q7. What is a phantom read? Which isolation level prevents it?**
> A phantom read occurs when a transaction re-executes a range query and finds new rows inserted by another committed transaction. Only `SERIALIZABLE` prevents it per the SQL standard. MySQL InnoDB also prevents it at `REPEATABLE READ` using gap locks.

**Q8. What is a write skew anomaly?**
> Write skew: two transactions read overlapping data and make writes that individually are valid but together violate an invariant. Example: two doctors both check "at least one doctor on call" is true, then both take off — now zero doctors on call. Prevented only by SERIALIZABLE isolation.

---

## Advanced Editorial Pass: Transaction Semantics and Contention Control

### Senior Engineering Focus
- Pick isolation levels by anomaly tolerance and throughput requirements.
- Design lock scope and transaction size for predictable contention behavior.
- Treat idempotency and retries as part of transaction design.

### Failure Modes to Anticipate
- Deadlock storms under peak write contention.
- Long transactions blocking critical read/write paths.
- Misaligned retry logic causing duplicate side effects.

### Practical Heuristics
1. Define transaction boundaries around business invariants.
2. Monitor lock wait, deadlock rate, and rollback patterns.
3. Use deterministic write ordering where possible.

### Compare Next
- [Replication & Partitioning](./replication-partitioning.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [Caching Strategies](./caching-strategies.md)
