---
id: optimistic-vs-pessimistic-lock-deep-dive
title: "Optimistic vs Pessimistic Locking: Lock Lifespans & Why 'Retry on Conflict' Destroys Flash Sales"
sidebar_label: "Optimistic vs Pessimistic Locks"
description: "Exhaustive analysis of the 5 lock types: version column, SELECT FOR UPDATE, advisory locks, lock columns, and Redis locks; physical lifespans, failure modes, and why optimistic retry storms crush high-contention ticketing systems."
tags: [database, concurrency, locking, optimistic-lock, pessimistic-lock, redis, flash-sale, architecture]
sidebar_position: 7
---

import LockLifecycleContentionDiagram from '@site/src/components/LockLifecycleContentionDiagram';

# Optimistic vs Pessimistic Locking: Lock Lifespans & Why "Retry on Conflict" Destroys Flash Sales

In software engineering interviews, the textbook question on concurrency invariably surfaces: *"When should you choose Optimistic Locking over Pessimistic Locking?"*

The standard academic answer rarely varies: *"Use Optimistic Locking when contention is low to avoid locking overhead; use Pessimistic Locking when contention is high to avoid retry penalties."*

However, in mission-critical production environments—such as **concert ticketing, Black Friday flash sales, or digital wallet balance updates**—a superficial understanding of **lock lifespans** and the naive adoption of the "retry on conflict" pattern will systematically destroy database availability within milliseconds of traffic surge.

<LockLifecycleContentionDiagram initialTab="lifecycles" />

---

## 1. The Five Lock Types: What Governs Their Lifespan?

Before selecting a locking strategy, you must answer three fundamental architectural questions: **When does the lock begin, when does it end, and if the client process crashes midway, how is the lock released?**

```text
The Lifespan Hierarchy of 5 Concurrency Lock Primitives:
1. Version Column (@Version) ──> Bound to Application State (Checked at COMMIT via CAS)
2. SELECT FOR UPDATE        ──> Bound to Database Transaction (Released at COMMIT / ROLLBACK)
3. Advisory Lock (pg/mysql) ──> Bound to DB Session / Network Connection (Survives multiple transactions!)
4. Lock Column (status)     ──> Bound to Durable Storage State (Zombie lock risk upon crash)
5. Redis Lock (SET NX PX)   ──> Bound to TTL Clock + Watchdog Heartbeat
```

### 1. Version Column (`@Version` / OCC)
- **Lifespan**: Bound to application memory.
- **Mechanics**: Does not hold any database lock while the user reads data or considers an action. At the time of saving, the application executes an atomic Compare-And-Swap (CAS) update:
  ```sql
  UPDATE tickets SET status = 'SOLD', version = version + 1 
  WHERE id = 42 AND version = 3;
  ```
- **Trade-off**: Maximizes read throughput with zero database lock overhead. However, under high contention, the CAS abort rate approaches 100%.

### 2. `SELECT FOR UPDATE` (Pessimistic Row Lock)
- **Lifespan**: **Strictly bound to the lifespan of the active Database Transaction**.
- **Mechanics**: Acquires an Exclusive Record Lock (X-Lock) on the target row at read time. The lock **automatically vanishes** the instant the transaction executes `COMMIT` or `ROLLBACK`. If the application pod crashes or drops its network connection, the database server aborts the transaction and cleans up the lock immediately.
- **Trade-off**: Serializes concurrent executions on the target row. Holding this lock across slow network calls or heavy processing starves the connection pool.

### 3. Advisory Locks (`pg_advisory_lock` / MySQL `GET_LOCK()`)
- **Lifespan**: **Bound to the Database Session (Physical TCP Connection)**.
- **Mechanics**: An application-level mutex managed in database engine memory, decoupled from table data:
  ```sql
  -- Acquire an application lock tied to the connection:
  SELECT pg_advisory_lock(123456);
  ```
- **The Fatal Flaw**: **Advisory locks do NOT release automatically upon transaction `COMMIT`!** They only release when an explicit unlock function is called, or when the physical TCP connection is terminated. If a pooled connection (e.g., from HikariCP) returns to the pool while still holding an advisory lock, it will contaminate subsequent client requests with stray locks.

### 4. Lock Column (`status = 'LOCKED'`)
- **Lifespan**: Bound to durable disk storage.
- **Mechanics**: Updates an explicit status flag in the table row and commits immediately.
- **The Fatal Flaw (Zombie Locks)**: If the worker process is killed by Kubernetes (`OOMKilled`) or crashes before clearing the flag, the record remains permanently locked. A background *Reaper Daemon* must be maintained to reclaim expired locks via timestamp inspection.

### 5. Redis Distributed Lock (`SET key val NX PX`)
- **Lifespan**: Bound to Time-To-Live (TTL) and background lease renewal (Watchdog).
- **Mechanics**: Sets an in-memory key with a lease expiration (e.g., 10 seconds).
- **The Fatal Flaw**: If a thread encounters a Stop-the-World JVM GC pause or disk I/O stall exceeding the TTL, Redis automatically releases the lock and grants it to another node. The halted thread awakens unaware and issues conflicting mutations. Safe usage strictly requires **fencing tokens**.

---

## 2. Why "Retry on Conflict" (OCC) Destroys Flash Sales

In tutorial code, Optimistic Concurrency Control (OCC) is routinely implemented with an automated retry loop:

```java
// ❌ ARCHITECTURAL SUICIDE UNDER HIGH CONCURRENCY
@Retryable(value = OptimisticLockException.class, maxAttempts = 5)
@Transactional
public void bookTicket(Long ticketId, Long userId) {
    Ticket ticket = ticketRepository.findById(ticketId);
    ticket.assignTo(userId);
    ticketRepository.save(ticket); // Throws exception if version changed
}
```

Consider what occurs under flash-sale traffic when **10,000 requests arrive in a single second** competing for 100 concert tickets:

<LockLifecycleContentionDiagram initialTab="flash_sale_storm" />

### The CAS Abort Storm & Thundering Herd
1. **Initial Read**: All 10,000 transactions concurrently read Ticket #1 with `version = 1`.
2. **Commit Race**: Exactly **1 transaction commits first**, incrementing the record to `version = 2`.
3. **Mass Failure**: The remaining **9,999 transactions fail instantaneously** due to version mismatch (an initial failure rate of **99.99%**).
4. **The Thundering Herd Explosion**:
   - The 9,999 failed requests immediately trigger their `@Retryable` logic.
   - Each retried request borrows a fresh connection from HikariCP, generating $9,999 \times 3 \approx 30,000$ redundant queries within milliseconds.
   - Database CPU surges to 100% processing meaningless transaction rollbacks and exception stack traces.
   - The entire connection pool is exhausted. Completely unrelated APIs (authentication, home feed, search) stall and fail with timeout errors across the platform.

> **Principal Engineering Verdict**: Optimistic Locking is predicated on the invariant that *"conflicts are rare"*. In flash sales and ticketing, **conflict is guaranteed on every millisecond**. Applying Optimistic Locking with blind retries here is architectural malpractice.

---

## 3. High-Contention Production Architectures

To handle tens of thousands of concurrent requests competing for finite inventory, enterprise systems implement three alternative patterns:

```text
High-Contention Architecture Patterns:
1. Redis Lua Atomic Decrement (DECR) ──> Sheds 99% load at cache tier, sub-2ms response
2. Queue Serialization (Kafka/Rabbit) ──> Serializes mutations through a single worker
3. Pessimistic SKIP LOCKED              ──> Pulls from shared pools with zero lock waits
```

### Pattern 1: Atomic Inventory Decrement via Redis Lua
Never let flash-sale contention reach the relational database. Maintain inventory balances directly in Redis and decrement them using an atomic Lua script:

```lua
-- stock_deduct.lua
local key = KEYS[1]
local quantity = tonumber(ARGV[1])
local current_stock = tonumber(redis.call('get', key) or "0")

if current_stock >= quantity then
    redis.call('decrby', key, quantity)
    return 1 -- Success: Allocated
else
    return 0 -- Sold out: Reject immediately
end
```
- Exactly the first 100 requests receive return code `1` (success).
- The remaining 9,900 requests receive `0` and are rejected at the edge gateway in under 2ms, **generating zero transactional load on the database**.
- The 100 successful allocations are dispatched to an asynchronous Message Queue for graceful database persistence.

### Pattern 2: Queue-Based Serialization
Instead of allowing 10,000 concurrent database threads to contend, route purchase orders to a message queue partitioned by `inventory_pool_id`.
- A single dedicated worker processes messages sequentially for that pool.
- Completely eliminates lock contention, rollbacks, and CPU thrashing.

### Pattern 3: `SELECT ... FOR UPDATE SKIP LOCKED`
When users simply require "any available ticket in VIP Section A" rather than a specific seat number:

```sql
SELECT * FROM seats 
WHERE section = 'VIP_A' AND status = 'AVAILABLE' 
LIMIT 1 
FOR UPDATE SKIP LOCKED;
```
- Worker 1 locks and claims Seat #1.
- Worker 2 executes concurrently, **does not block**, skips Seat #1, and locks Seat #2.
- Hundreds of workers can claim seats simultaneously with zero lock waits and zero deadlocks.

---

## 4. Architectural Decision Matrix

| Business Scenario | Optimal Primitive | Technical Rationale |
|---|---|---|
| **User Profile, CMS Articles** | `Optimistic (@Version)` | Concurrent edits on the same record are rare ($< 1\%$). Zero database lock overhead. |
| **Bank Account Balance Transfers** | `Pessimistic (FOR UPDATE)` | Must lock balances of both accounts in strict ID order to enforce absolute financial correctness. |
| **Job Queue Task Polling** | `FOR UPDATE SKIP LOCKED` | Workers claim available jobs in parallel without blocking each other or claiming duplicates. |
| **Flash Sales / Concert Ticketing** | `Redis Lua + Async Queue` | Massive concurrency ($>10,000$ RPS); sheds 99% of failures at the cache tier in $<2\text{ms}$. |
| **Single-Instance Distributed Cron** | `Advisory Lock / ShedLock` | Application-level cluster mutex that automatically clears upon task completion or connection termination. |
