---
id: transactions-concurrency
title: Transactions & Concurrency Control
description: ACID properties, isolation levels, locking mechanisms, MVCC, deadlocks, and optimistic vs pessimistic concurrency.
tags: [database, transactions, acid, isolation, locking, mvcc, concurrency, deadlock]
sidebar_position: 4
---

import TwoPhaseLockingMechanismDiagram from '@site/src/components/TwoPhaseLockingMechanismDiagram';
import TwoPhaseCommitDiagram from '@site/src/components/TwoPhaseCommitDiagram';
import SerializabilityLinearizabilityDiagram from '@site/src/components/SerializabilityLinearizabilityDiagram';
import InventoryLockContentionDiagram from '@site/src/components/InventoryLockContentionDiagram';

# Transactions & Concurrency Control

---

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

To guarantee data integrity under concurrency and failures, relational databases enforce the ACID properties: **Atomicity**, **Consistency**, **Isolation**, and **Durability**.

:::info[Detailed Guide]
For an in-depth explanation of these properties, including real-world analogies for beginners, deep-dive implementation details (WAL, undo logs, locking models), distributed ACID, and interview Q&As, please refer to the dedicated **[Database ACID Properties](./acid.md)** page.
:::

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

<SerializabilityLinearizabilityDiagram />

Defined by SQL standard, each level prevents different anomalies:

| Isolation Level | Dirty Read | Non-Repeatable | Phantom | Notes |
|-----------------|-----------|----------------|---------|-------|
| `READ UNCOMMITTED` | ✅ possible | ✅ possible | ✅ possible | Fastest, riskiest |
| `READ COMMITTED` | ❌ prevented | ✅ possible | ✅ possible | Default in PostgreSQL, Oracle |
| `REPEATABLE READ` | ❌ | ❌ prevented | ✅ possible (standard) | Default in MySQL InnoDB (but InnoDB also prevents phantoms via gap locks) |
| `SERIALIZABLE` | ❌ | ❌ | ❌ prevented | Slowest; fully serial behavior |

:::info[Dedicated Isolation Levels Guide]
For an interactive deep-dive into all 5 anomalies (including **Lost Update** and **Write Skew**), PostgreSQL vs. MySQL vs. Oracle implementation differences, snapshot scope, and practical query-level fixes, visit the **[Database Isolation Levels](./isolation-levels.md)** guide.
:::

```sql
-- Set in MySQL
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Per transaction in PostgreSQL
BEGIN ISOLATION LEVEL SERIALIZABLE;
```

---

## Locking

<TwoPhaseLockingMechanismDiagram />

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

## High-Throughput Row Locking & Reservation Patterns

Under massive write concurrency (e.g. Black Friday flash sales with thousands of concurrent checkouts competing for the same SKU), standard single-row pessimistic locking (`UPDATE inventory SET qty = qty - 1 WHERE id = 1`) forms a severe bottleneck: **all concurrent transactions serialize on that single row's exclusive lock**, cascading into connection pool exhaustion and lock wait timeouts.

### 1. `SELECT ... FOR UPDATE SKIP LOCKED` vs `NOWAIT`

Introduced in MySQL 8.0+, PostgreSQL 9.5+, and Oracle:

| Locking Mode | Behavior when Target Row is Already Locked | Use Case |
|---|---|---|
| `FOR UPDATE` *(Standard)* | **Blocks** until the holding transaction commits/rollbacks, creating a FIFO queue. | Strict sequential processing. |
| `FOR UPDATE NOWAIT` | **Fails immediately** with a lock conflict error (`ERROR 3572` in MySQL / `55P03` in PG) instead of waiting. | Fast-fail paths, preventing connection hold queues. |
| `FOR UPDATE SKIP LOCKED` | **Non-blocking skip**: Skips all locked rows and locks the next available unlocked matching row(s). | Queue workers, high-throughput item reservations, job dispatch. |

```sql
-- Worker 1 grabs the first available pending job:
SELECT * FROM job_queue WHERE status = 'PENDING' LIMIT 1 FOR UPDATE SKIP LOCKED;

-- Worker 2 runs the exact same query concurrently:
-- Worker 2 does NOT wait for Worker 1; it skips Worker 1's locked row and grabs the next row immediately!
```

---

### 2. Case Study: Scaling Inventory Reservations (The 1-Row-Per-Unit Pattern)

*Production Pattern (Shopify Engineering)*: How high-throughput e-commerce handles flash sales without Redis dual-write anomalies or single-row database lock serialization.

<InventoryLockContentionDiagram />

#### Step 1: Replace Quantity Counter with Unit Rows
Instead of a single row with a `quantity` integer column, represent sellable stock as individual rows in a dedicated table (`reservation_units`). Reserving $N$ units executes:

```sql
-- Reserve 2 units for item 456
SELECT id 
FROM reservation_units 
WHERE shop_id = 12 AND inventory_item_id = 456 
LIMIT 2 
FOR UPDATE SKIP LOCKED;
```
Because of `SKIP LOCKED`, concurrent buyers reserve different unit rows simultaneously without blocking or waiting on each other.

#### Step 2: Maintain a Bounded Buffer Pool (e.g. 1,000 Units)
If an item has 500,000 units, creating 500,000 physical rows causes table bloat and slow index scans.
- **Solution**: Keep a bounded pool (e.g. max 1,000 unit rows per SKU/location) in `reservation_units`.
- Reservations consume rows (`DELETE` or transition state) from the pool.
- A background or inline replenishment process refills rows from the persistent inventory ledger.

#### Step 3: Thundering Herd Mitigation on Pool Exhaustion
When a sudden surge exhausts the 1,000-unit pool:
1. The reserve transaction detects 0 rows returned.
2. It acquires a dedicated replenishment lock/mutex (e.g., per SKU).
3. **Only one transaction** refills the pool from the inventory ledger; all other concurrent reserves wait for that single replenishment to finish, rather than hundreds of threads racing to insert duplicate rows.

#### Step 4: Multi-Item Cart Batching (`UNION ALL`)
When a buyer purchases multiple distinct SKUs in a single cart, avoid multiple round trips by batching queries into a single database execution:

```sql
(SELECT id, inventory_item_id FROM reservation_units 
 WHERE shop_id = 12 AND inventory_item_id = 101 LIMIT 1 FOR UPDATE SKIP LOCKED)
UNION ALL
(SELECT id, inventory_item_id FROM reservation_units 
 WHERE shop_id = 12 AND inventory_item_id = 202 LIMIT 2 FOR UPDATE SKIP LOCKED);
```

---

### 3. Lock Manager Overhead: Clustered vs Secondary Index Locking

Under intense concurrency, **how your primary key is structured determines the number of internal row locks InnoDB must acquire**.

```
Auto-Increment PK with Secondary Index Lookup:
Query: WHERE shop_id = 12 AND inventory_item_id = 456
  1. Acquire lock on Secondary Index entry (shop_id, inventory_item_id)
  2. Acquire lock on Clustered Index (Primary Key id)
  Total: 2 Locks per row!

Composite Primary Key (shop_id, inventory_item_id, id):
Query: WHERE shop_id = 12 AND inventory_item_id = 456
  1. Acquire lock directly on Clustered Index
  Total: 1 Lock per row (50% reduction in lock manager overhead!)
```

:::tip[Index Optimization for High-Concurrency Locks]
When querying rows with `SELECT ... FOR UPDATE`, always ensure the filter predicates match the **leading columns of the clustered index (Composite Primary Key)**. This eliminates the secondary index lookup phase and halves the row lock count inside the storage engine.
:::

---

### 4. Deadlock Elimination via Strict Lock Ordering

Deadlocks frequently happen in state transitions when different business workflows touch the same tables in reverse order.

**The Bug (Circular Wait):**
- **Reserve Flow**: `INSERT` into `reserved_quantities` $\rightarrow$ `DELETE` from `reservation_units`.
- **Claim Flow**: `DELETE` from `reservation_units` $\rightarrow$ `UPDATE` `reserved_quantities`.
- Concurrent reserve and claim transactions lock tables in opposite directions $\rightarrow$ **Deadlock!**

**The Production Fix (Deterministic Ordering Protocol):**
1. Standardize the exact sequence in which tables are locked across every code path:
   - **Reserve**: Always modifies `reservation_units` first, then `reserved_quantities`.
   - **Claim**: Only modifies `reserved_quantities` (never touches `reservation_units`).
2. When locking multiple rows in the same table, always sort by Primary Key in ascending order (`ORDER BY id ASC FOR UPDATE`).

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

:::caution[Self-invocation trap]
`@Transactional` only works via Spring's proxy. Calling a `@Transactional` method **from within the same class** bypasses the proxy — the transaction annotation is ignored!
:::

---

## Interview Questions

**Q1. Explain ACID properties with an example.**
> ACID stands for Atomicity, Consistency, Isolation, and Durability. A classic example is a bank transfer: Atomicity ensures both debit and credit succeed or neither does; Consistency guarantees that constraints (like non-negative balances) are not violated; Isolation ensures concurrent operations don't see intermediate states; and Durability guarantees committed results survive crashes. For a comprehensive breakdown with analogies, illustrations, and implementation details, see **[Database ACID Properties](./acid.md)**.

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

**Q9. How does `SELECT ... FOR UPDATE SKIP LOCKED` solve high-concurrency queue/inventory contention?**
> Standard `FOR UPDATE` serializes concurrent transactions on the same locked row, causing lock wait timeouts and thread pool exhaustion. `SKIP LOCKED` skips rows that are currently locked by other in-flight transactions and immediately acquires the next available unlocked row(s). This turns a blocking lock queue into an asynchronous, non-blocking parallel worker pipeline without application-level distributed locks.

**Q10. Why does single-row inventory counter (`UPDATE item SET qty = qty - 1`) fail during flash sales, and what is the unit-based bounded pool pattern?**
> A single quantity column serializes all concurrent purchases on one row lock. The unit-based bounded pool pattern (used by Shopify) models sellable inventory as individual unit rows in a buffer table (e.g., max 1,000 unit rows per SKU/location) reserved via `SELECT id FROM reservation_units WHERE sku = ? LIMIT N FOR UPDATE SKIP LOCKED`. Because each transaction locks separate unit rows, reservations execute concurrently. A background/inline replenishment process with mutex coordination refills the buffer pool from the authoritative ledger, eliminating thundering herds.

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
- [Caching Strategies](../system-design/caching-strategies.md)
