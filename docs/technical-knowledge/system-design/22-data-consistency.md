---
id: data-consistency
title: Data Consistency & Transactions
sidebar_label: Data Consistency
description: Patterns for maintaining data consistency in distributed systems including database transactions, eventual consistency, the outbox pattern, idempotency, and conflict resolution.
tags: [consistency, transactions, acid, eventual-consistency, outbox-pattern, idempotency, conflict-resolution]
---

# Data Consistency & Transactions

---

## ACID Properties

| Property | Meaning | Example |
|---|---|---|
| **Atomicity** | All or nothing — no partial writes | Transfer: debit + credit, both succeed or both fail |
| **Consistency** | DB moves from one valid state to another | Balance never goes negative (constraint enforced) |
| **Isolation** | Concurrent transactions don't interfere | Two transfers don't corrupt each other |
| **Durability** | Committed data survives crashes | Power loss doesn't lose committed transactions |

### Spring Transaction Management
```java
@Transactional
public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
    Account from = accountRepository.findById(fromId).orElseThrow();
    Account to = accountRepository.findById(toId).orElseThrow();

    from.debit(amount);   // Validates: throws if insufficient funds
    to.credit(amount);

    accountRepository.save(from);
    accountRepository.save(to);
    // If exception: entire transaction rolls back (atomicity)
}

// Propagation options
@Transactional(propagation = Propagation.REQUIRED)      // Join existing or create new (default)
@Transactional(propagation = Propagation.REQUIRES_NEW)  // Always new transaction
@Transactional(propagation = Propagation.NESTED)        // Savepoint within existing
@Transactional(readOnly = true)                          // Read-only optimization
@Transactional(timeout = 5)                              // 5 second timeout
@Transactional(rollbackFor = BusinessException.class)   // Rollback on checked exceptions too
```

---

## BASE Properties (NoSQL)

| Property | Meaning |
|---|---|
| **B**asically **A**vailable | System available most of the time |
| **S**oft state | Data may be in transition |
| **E**ventual consistency | Will converge to consistent state |

---

## Consistency Anomalies

### Dirty Read
```
T1: UPDATE balance = 500  (not yet committed)
T2: READ balance = 500    (reads uncommitted data)
T1: ROLLBACK
T2: Used wrong data!
```
Fixed by: READ COMMITTED isolation level.

### Non-Repeatable Read
```
T1: READ balance = 1000
T2: UPDATE balance = 500  (commits)
T1: READ balance = 500    (different value in same transaction!)
```
Fixed by: REPEATABLE READ.

### Phantom Read
```
T1: SELECT COUNT(*) WHERE amount > 100  → 5 rows
T2: INSERT new row WHERE amount = 200   (commits)
T1: SELECT COUNT(*) WHERE amount > 100  → 6 rows (phantom!)
```
Fixed by: SERIALIZABLE.

### Lost Update
```
T1: READ balance = 1000
T2: READ balance = 1000
T1: UPDATE balance = 1000 + 100 = 1100  (commits)
T2: UPDATE balance = 1000 + 50  = 1050  (overwrites T1!)
Final: 1050 instead of 1150
```
Fixed by: Pessimistic lock, optimistic lock, or `UPDATE ... SET balance = balance + 50`.

---

## Write Skew

Two transactions read the same data, make decisions based on it, then write different records.

```
Constraint: At least one doctor must be on call.

T1: Reads: Alice on_call=true, Bob on_call=true → Alice can go off-call
T2: Reads: Alice on_call=true, Bob on_call=true → Bob can go off-call

T1: UPDATE Alice SET on_call=false
T2: UPDATE Bob SET on_call=false

Result: Nobody on call! Constraint violated.
```

Fix: SERIALIZABLE isolation or explicit SELECT FOR UPDATE on the check.

---

## Distributed Consistency Patterns

### Eventual Consistency
```
Write → Primary DB → Propagate to replicas (async)
Read from replica → might get stale data

Acceptable for: Social feed, product views, analytics
Not acceptable for: Bank balance, inventory count
```

### Read-Your-Writes Consistency
```java
// After write, route subsequent reads to primary for the session
public User updateAndReturn(Long userId, UpdateRequest req) {
    User user = repo.save(mapper.toEntity(req));

    // Signal: next read for this user must hit primary
    sessionStore.set("primary_read:" + userId, "1", Duration.ofSeconds(5));
    return user;
}

public User findUser(Long userId) {
    boolean mustReadPrimary = sessionStore.exists("primary_read:" + userId);
    if (mustReadPrimary) {
        return primaryRepo.findById(userId);
    }
    return replicaRepo.findById(userId);
}
```

### Causal Consistency
Operations causally related are seen in order.
```
User posts comment → Sees own comment (read-your-writes)
User B replies → Sees original comment + reply (causal order preserved)
```

---

## Conflict Resolution (Multi-Master)

### Last-Write-Wins (LWW)
```
T1 writes value=100 at timestamp=1000
T2 writes value=200 at timestamp=1001
Winner: T2 (higher timestamp)

Problem: Clock skew — timestamps can't be trusted across nodes
```

### CRDT (Conflict-free Replicated Data Types)
Data structures that merge without conflicts.

```java
// G-Counter (grow-only) — each node tracks its own count
Map<String, Long> nodeCounters = {
    "node1": 5,
    "node2": 3,
    "node3": 7
}
// Total = sum of all = 15
// Merge: take max per node
```

### Application-Level Resolution
```java
// User profile merge: newest non-null field wins
public UserProfile merge(UserProfile local, UserProfile remote) {
    return UserProfile.builder()
        .name(newerNonNull(local.getName(), local.getNameTs(),
                           remote.getName(), remote.getNameTs()))
        .email(newerNonNull(local.getEmail(), local.getEmailTs(),
                            remote.getEmail(), remote.getEmailTs()))
        .build();
}
```

---

## Dual-Write Problem

Writing to two systems (DB + Kafka) without coordination.

```
@Transactional
public Order createOrder(CreateOrderCommand cmd) {
    Order order = orderRepository.save(new Order(cmd));  // DB: success
    kafkaTemplate.send("orders", new OrderCreatedEvent(order)); // Kafka: FAILS!
    // DB committed but Kafka never got the event → downstream services don't know
    return order;
}
```

**Solution: Transactional Outbox Pattern**
```java
@Transactional
public Order createOrder(CreateOrderCommand cmd) {
    Order order = orderRepository.save(new Order(cmd));

    // Write event to outbox table IN SAME TRANSACTION
    OutboxEvent event = new OutboxEvent("orders", toJson(new OrderCreatedEvent(order)));
    outboxRepository.save(event);
    // If transaction commits → both order AND event are durably stored
    return order;
}

// Separate process reads outbox and publishes to Kafka
// (Or use Debezium CDC to read DB transaction log)
```

---

## Idempotency Patterns

### Database Constraint
```sql
-- Natural idempotency via UNIQUE constraint
CREATE TABLE processed_payments (
    idempotency_key VARCHAR(100) PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    result JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL
);

-- On duplicate: INSERT ... ON CONFLICT DO NOTHING
```

### Application-Level
```java
public PaymentResult processPayment(PaymentRequest req) {
    return processedRepo.findByKey(req.getIdempotencyKey())
        .map(p -> p.getResult()) // Return cached result
        .orElseGet(() -> {
            PaymentResult result = doProcess(req);
            processedRepo.save(new ProcessedPayment(req.getIdempotencyKey(), result));
            return result;
        });
}
```

---

## Database Lock Patterns

### Advisory Locks (PostgreSQL)
```sql
-- Application-level lock, not tied to a row
SELECT pg_advisory_xact_lock(user_id); -- Lock for this transaction
-- OR
SELECT pg_try_advisory_lock(user_id);  -- Non-blocking attempt
```

### SELECT FOR UPDATE SKIP LOCKED
```sql
-- Worker picks up jobs without blocking other workers
SELECT * FROM jobs
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 10
FOR UPDATE SKIP LOCKED; -- Skip rows locked by other workers
```

```java
// Spring Data JPA
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT j FROM Job j WHERE j.status = 'PENDING' ORDER BY j.createdAt LIMIT 10")
List<Job> claimJobs();
```

---

## Interview Questions

1. Explain the ACID properties. Can you have a database that satisfies all four?
2. What is a lost update and how do you prevent it?
3. What is write skew? How do you detect and prevent it?
4. What is the dual-write problem in microservices?
5. What is the transactional outbox pattern?
6. How do you implement read-your-writes consistency when using read replicas?
7. What is a CRDT? When would you use one?
8. What is the difference between optimistic and pessimistic concurrency control?
9. How do you handle conflicts in a multi-master database setup?
10. What database isolation level prevents phantom reads?
