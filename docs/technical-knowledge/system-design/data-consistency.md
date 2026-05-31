---
id: data-consistency
title: Data Consistency & Transactions
sidebar_label: Data Consistency
description: Patterns for maintaining data consistency in distributed systems including database transactions, eventual consistency, the outbox pattern, idempotency, and conflict resolution.
tags: [consistency, transactions, acid, eventual-consistency, outbox-pattern, idempotency, conflict-resolution]
---

# Data Consistency & Transactions

> Ensuring data remains correct and coherent across distributed systems is one of the hardest challenges in system design.

## Table of Contents

- [Beginner View](#beginner-view)
  - [ACID Properties](#acid-properties)
  - [Spring Transaction Management](#spring-transaction-management)
  - [BASE Properties (NoSQL)](#base-properties-nosql)
  - [Consistency Anomalies](#consistency-anomalies)
  - [Write Skew](#write-skew)
- [Distributed Consistency Patterns](#distributed-consistency-patterns)
  - [Eventual Consistency](#eventual-consistency)
  - [Read-Your-Writes Consistency](#read-your-writes-consistency)
  - [Causal Consistency](#causal-consistency)
- [Conflict Resolution (Multi-Master)](#conflict-resolution-multi-master)
  - [Last-Write-Wins (LWW)](#last-write-wins-lww)
  - [CRDT (Conflict-free Replicated Data Types)](#crdt-conflict-free-replicated-data-types)
  - [Application-Level Resolution](#application-level-resolution)
- [Dual-Write Problem](#dual-write-problem)
- [Quorum Reads and Read Repair](#quorum-reads-and-read-repair)
  - [Beginner View](#beginner-view-1)
  - [Senior Deep Dive](#senior-deep-dive)
  - [Tradeoffs](#tradeoffs)
- [Idempotency Patterns](#idempotency-patterns)
  - [Database Constraint](#database-constraint)
  - [Application-Level](#application-level)
- [Database Lock Patterns](#database-lock-patterns)
  - [Advisory Locks (PostgreSQL)](#advisory-locks-postgresql)
  - [SELECT FOR UPDATE SKIP LOCKED](#select-for-update-skip-locked)
- [How Transactions Work Internally](#how-transactions-work-internally)
  - [Transaction Lifecycle](#transaction-lifecycle)
  - [Write-Ahead Logging (WAL)](#write-ahead-logging-wal)
  - [Multi-Version Concurrency Control (MVCC)](#multi-version-concurrency-control-mvcc)
  - [Isolation Level Implementation](#isolation-level-implementation)
  - [Two-Phase Locking (2PL)](#two-phase-locking-2pl)
  - [Deadlock Detection](#deadlock-detection)
- [Distributed Transaction Protocols](#distributed-transaction-protocols)
  - [Two-Phase Commit (2PC)](#two-phase-commit-2pc)
  - [Three-Phase Commit (3PC)](#three-phase-commit-3pc)
  - [Saga Pattern](#saga-pattern)
  - [Compensating Transactions](#compensating-transactions)
- [Consensus Algorithms](#consensus-algorithms)
  - [Paxos](#paxos)
  - [Raft](#raft)
  - [Comparison](#comparison)
- [Event Sourcing and CQRS](./cqrs.md)
- [Change Data Capture (CDC)](./cdc.md)
- [Real-World Implementations](#real-world-implementations)
  - [PostgreSQL](#postgresql)
  - [MySQL](#mysql)
  - [MongoDB](#mongodb)
  - [Cassandra](#cassandra)
  - [DynamoDB](#dynamodb)
  - [Google Spanner](#google-spanner)
- [Integration Patterns](#integration-patterns)
  - [Outbox Pattern](#outbox-pattern-1)
  - [Saga Orchestration](#saga-orchestration)
  - [Eventual Consistency with Versioning](#eventual-consistency-with-versioning)
  - [Optimistic Concurrency Control](#optimistic-concurrency-control)
  - [Pessimistic Concurrency Control](#pessimistic-concurrency-control)
- [Pros and Cons](#pros-and-cons)
  - [Strong Consistency](#strong-consistency)
  - [Eventual Consistency](#eventual-consistency-1)
  - [Outbox Pattern](#outbox-pattern-2)
  - [Saga Pattern](#saga-pattern-1)
  - [CRDTs](#crdts)
- [Interview Questions](#interview-questions)
- [Senior Deep Dive: Advanced Topics](#senior-deep-dive-advanced-topics)
  - [Vector Clocks](#vector-clocks)
  - [Lamport Clocks](#lamport-clocks)
  - [Hybrid Logical Clocks (HLC)](#hybrid-logical-clocks-hlc)
  - [Distributed Snapshots](#distributed-snapshots)
  - [Consistency Models Hierarchy](#consistency-models-hierarchy)
  - [CAP Theorem Revisited](#cap-theorem-revisited)
  - [PACELC Theorem](#pacelc-theorem)
- [Additional Resources](#additional-resources)
- [Best Practices](#best-practices)

---

## Beginner View

### ACID Properties

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

### BASE Properties (NoSQL)

| Property | Meaning |
|---|---|
| **B**asically **A**vailable | System available most of the time |
| **S**oft state | Data may be in transition |
| **E**ventual consistency | Will converge to consistent state |

### Consistency Anomalies

#### Dirty Read
```
T1: UPDATE balance = 500  (not yet committed)
T2: READ balance = 500    (reads uncommitted data)
T1: ROLLBACK
T2: Used wrong data!
```
Fixed by: READ COMMITTED isolation level.

#### Non-Repeatable Read
```
T1: READ balance = 1000
T2: UPDATE balance = 500  (commits)
T1: READ balance = 500    (different value in same transaction!)
```
Fixed by: REPEATABLE READ.

#### Phantom Read
```
T1: SELECT COUNT(*) WHERE amount > 100  → 5 rows
T2: INSERT new row WHERE amount = 200   (commits)
T1: SELECT COUNT(*) WHERE amount > 100  → 6 rows (phantom!)
```
Fixed by: SERIALIZABLE.

#### Lost Update
```
T1: READ balance = 1000
T2: READ balance = 1000
T1: UPDATE balance = 1000 + 100 = 1100  (commits)
T2: UPDATE balance = 1000 + 50  = 1050  (overwrites T1!)
Final: 1050 instead of 1150
```
Fixed by: Pessimistic lock, optimistic lock, or `UPDATE ... SET balance = balance + 50`.

### Write Skew

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

Writing to two systems (DB + Kafka) without coordination is known as the **Dual-Write Problem**.

:::info[Deep Dive: Outbox Pattern]
The standard solution to the Dual-Write problem is the **Transactional Outbox Pattern**. 
For a comprehensive guide on how it works, polling vs CDC strategies, code examples, and reliability checklists, see the **[Transactional Outbox Pattern](./outbox-pattern.md)** page.
:::

---

## Quorum Reads and Read Repair

### Beginner View

In leaderless replication, quorum is configured with `N` replicas:
- `W` replicas must acknowledge a write
- `R` replicas are queried for a read

If `W + R > N`, reads are more likely to see latest writes.

### Senior Deep Dive

Example with `N=3`:
- Stronger freshness: `W=2, R=2`
- Higher availability: `W=1, R=1`

Read repair strategy:
1. Read from multiple replicas
2. Compare versions/vector clocks
3. Return latest to client
4. Asynchronously repair stale replicas

### Tradeoffs

- Higher `R` increases read latency but reduces stale reads
- Lower `W` improves write availability but increases reconciliation work
- Hot partitions can trigger repair storms under read-heavy load

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

## How Transactions Work Internally

### Transaction Lifecycle

```
BEGIN → Acquire locks → Execute statements → Write to WAL → Commit → Release locks
```

1. **BEGIN**: Start transaction, assign transaction ID
2. **Acquire locks**: Get read/write locks on affected rows
3. **Execute statements**: Apply changes in memory
4. **Write to WAL**: Log changes to Write-Ahead Log (durability)
5. **Commit**: Mark transaction as committed in WAL
6. **Release locks**: Free acquired locks

### Write-Ahead Logging (WAL)

WAL ensures durability by writing changes to a log before applying them to data files.

```
Transaction T1:
1. Write "BEGIN T1" to WAL
2. Write "UPDATE accounts SET balance=500 WHERE id=1" to WAL
3. Write "COMMIT T1" to WAL
4. fsync() WAL to disk
5. Apply changes to data files (can be deferred)
```

Benefits:
- Crash recovery: replay WAL to restore committed transactions
- Checkpointing: periodically flush dirty pages to reduce recovery time
- Replication: stream WAL to replicas

### Multi-Version Concurrency Control (MVCC)

MVCC allows readers to not block writers and vice versa by maintaining multiple versions of rows.

```
Row: accounts(id=1, balance=1000)

T1 (READ): Sees balance=1000 at timestamp=100
T2 (UPDATE): Creates new version balance=900 at timestamp=200
T1 (READ): Still sees balance=1000 (its snapshot)
T2 (COMMIT): New version becomes visible to transactions starting after 200
```

Implementation:
- Each row has `xmin` (creation transaction) and `xmax` (deletion transaction)
- Readers see rows where `xmin` is committed and `xmax` is not committed
- Old versions are cleaned up by vacuum process

### Isolation Level Implementation

| Isolation Level | Implementation |
|---|---|
| READ UNCOMMITTED | No locks, reads uncommitted data |
| READ COMMITTED | Acquires write locks, releases after each statement |
| REPEATABLE READ | Snapshot isolation, locks held until commit |
| SERIALIZABLE | Full predicate locking or conflict detection |

### Two-Phase Locking (2PL)

2PL ensures serializability by acquiring locks in growing phase and releasing in shrinking phase.

```
Growing phase: Acquire locks, never release
Shrinking phase: Release locks, never acquire
```

Problem: Can cause deadlocks.

### Deadlock Detection

Deadlock occurs when transactions wait for each other in a cycle.

```
T1: Locks row A, waits for row B
T2: Locks row B, waits for row A
→ Deadlock!
```

Detection:
- Wait-for graph: edges represent "waits for" relationships
- Cycle detection: find cycles in the graph
- Resolution: abort one transaction in the cycle

Prevention:
- Always acquire locks in consistent order
- Use timeouts
- Use lower isolation levels when possible

---

## Distributed Transaction Protocols

### Two-Phase Commit (2PC)

2PC ensures atomic commit across multiple participants.

```
Phase 1: Prepare
Coordinator → Participant 1: Prepare
Coordinator → Participant 2: Prepare
Participants: Write to WAL, vote YES/NO

Phase 2: Commit
If all YES:
  Coordinator → Participants: Commit
  Participants: Apply changes, ACK
If any NO:
  Coordinator → Participants: Abort
  Participants: Rollback, ACK
```

Problems:
- Blocking: participants block until coordinator decides
- Single point of failure: coordinator crash blocks progress
- Network partitions: can cause indefinite blocking

### Three-Phase Commit (3PC)

3PC adds a pre-commit phase to reduce blocking.

```
Phase 1: CanCommit
Coordinator → Participants: CanCommit?
Participants: Vote YES/NO

Phase 2: PreCommit (if all YES)
Coordinator → Participants: PreCommit
Participants: Write to WAL, ACK

Phase 3: DoCommit/Abort
Coordinator → Participants: DoCommit/Abort
Participants: Apply changes, ACK
```

Benefits:
- Non-blocking: participants can decide if coordinator crashes
- Better recovery: can recover from coordinator failure

Problems:
- More complex
- Still vulnerable to network partitions
- Higher latency

### Saga Pattern

Saga breaks long transactions into a sequence of local transactions with compensating actions.

```
Order Saga:
1. Create Order (local transaction)
2. Reserve Inventory (local transaction)
3. Process Payment (local transaction)
4. Ship Order (local transaction)

If step 3 fails:
  Compensate step 2: Release Inventory
  Compensate step 1: Cancel Order
```

Types:
- **Choreography**: Each step emits events, next step listens
- **Orchestration**: Central coordinator orchestrates steps

### Compensating Transactions

Compensating transactions undo the effects of a previous transaction.

```java
public void compensatePayment(Payment payment) {
    // Reverse the payment
    paymentService.refund(payment.getId(), payment.getAmount());
    // Update payment status
    payment.setStatus(PaymentStatus.REFUNDED);
    paymentRepository.save(payment);
}
```

---

## Consensus Algorithms

### Paxos

Paxos is a consensus algorithm for achieving agreement in a distributed system.

Roles:
- **Proposer**: Proposes values
- **Acceptor**: Accepts or rejects proposals
- **Learner**: Learns the chosen value

Phases:
1. **Prepare**: Proposer sends prepare(n) to acceptors
2. **Promise**: Acceptors promise not to accept proposals < n
3. **Accept**: Proposer sends accept(n, v) to acceptors
4. **Accepted**: Acceptors accept if no higher proposal seen

```java
// Simplified Paxos proposer
class PaxosProposer {
    private int proposalNumber;
    private String acceptedValue;

    public String propose(String value) {
        // Phase 1: Prepare
        List<Promise> promises = sendPrepare(proposalNumber);
        if (promises.size() < quorum) return null;

        // Phase 2: Accept
        String valueToAccept = getValueFromPromises(promises, value);
        List<Accept> accepts = sendAccept(proposalNumber, valueToAccept);
        if (accepts.size() >= quorum) {
            return valueToAccept;
        }
        return null;
    }
}
```

### Raft

Raft is a consensus algorithm designed for understandability.

Roles:
- **Leader**: Handles all client requests
- **Follower**: Responds to leader and candidate requests
- **Candidate**: Campaigns to become leader

Phases:
1. **Leader election**: Followers timeout, become candidates, request votes
2. **Log replication**: Leader appends entries to log, replicates to followers
3. **Safety**: Leader must have all committed entries

```java
// Simplified Raft node
class RaftNode {
    private State state = State.FOLLOWER;
    private int currentTerm;
    private String votedFor;
    private List<LogEntry> log;
    private int commitIndex;
    private int lastApplied;

    public void onElectionTimeout() {
        state = State.CANDIDATE;
        currentTerm++;
        votedFor = self;
        requestVotes();
    }

    public void onVoteRequest(VoteRequest req) {
        if (req.term > currentTerm ||
            (req.term == currentTerm && votedFor == null)) {
            votedFor = req.candidateId;
            currentTerm = req.term;
            return new VoteResponse(true, currentTerm);
        }
        return new VoteResponse(false, currentTerm);
    }
}
```

### Comparison

| Algorithm | Understandability | Performance | Fault Tolerance |
|---|---|---|---|
| Paxos | Complex | High | High |
| Raft | Simple | High | High |
| ZAB | Complex | High | High |

---

## Event Sourcing and CQRS

:::info[Deep Dive: CQRS & Event Sourcing]
For a comprehensive guide on separating read and write models, synchronization via Domain Events, and Event Sourcing theory, see the centralized **[CQRS & Event Sourcing](./cqrs.md)** page.
:::

---

## Change Data Capture (CDC)

:::info[Deep Dive: Change Data Capture (CDC)]
For a comprehensive guide on how CDC works, implementations like Debezium, and how it compares to polling, see the **[Change Data Capture (CDC)](./cdc.md)** page.
:::

---

## Real-World Implementations

### PostgreSQL

- **ACID**: Full support with MVCC
- **Isolation levels**: READ COMMITTED, REPEATABLE READ, SERIALIZABLE
- **Distributed transactions**: Two-phase commit via `PREPARE TRANSACTION`
- **CDC**: Logical replication, WAL streaming

```sql
-- Set isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Advisory lock
SELECT pg_advisory_lock(12345);

-- Two-phase commit
BEGIN;
PREPARE TRANSACTION 'my_transaction';
COMMIT PREPARED 'my_transaction';
```

### MySQL

- **ACID**: Full support with InnoDB
- **Isolation levels**: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE
- **MVCC**: Implemented via undo log
- **Distributed transactions**: XA transactions

```sql
-- Set isolation level
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- XA transaction
XA START 'my_transaction';
-- ... statements ...
XA END 'my_transaction';
XA PREPARE 'my_transaction';
XA COMMIT 'my_transaction';
```

### MongoDB

- **ACID**: Multi-document ACID transactions (since 4.0)
- **Isolation levels**: Snapshot isolation
- **Consistency**: Tunable consistency (strong vs eventual)
- **Conflict resolution**: Last-write-wins

```javascript
// Multi-document transaction
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await accountsCollection.updateOne(
      { _id: fromId },
      { $inc: { balance: -amount } },
      { session }
    );
    await accountsCollection.updateOne(
      { _id: toId },
      { $inc: { balance: amount } },
      { session }
    );
  });
} finally {
  await session.endSession();
}
```

### Cassandra

- **BASE**: Eventual consistency
- **Consistency levels**: ONE, QUORUM, ALL, LOCAL_QUORUM
- **Conflict resolution**: Last-write-wins with timestamps
- **Lightweight transactions**: Paxos-based for linearizable operations

```java
// Consistency level
SimpleStatement query = SimpleStatement.builder("SELECT * FROM users WHERE id = ?")
    .setConsistencyLevel(ConsistencyLevel.QUORUM)
    .build();

// Lightweight transaction (Paxos)
PreparedStatement prepared = session.prepare(
    "INSERT INTO users (id, name) VALUES (?, ?) IF NOT EXISTS"
);
BoundStatement bound = prepared.bind(id, name);
ResultSet result = session.execute(bound);
```

### DynamoDB

- **BASE**: Eventual consistency by default
- **Consistency levels**: EVENTUAL, STRONG
- **ACID**: Transactions for multi-item operations
- **Conflict resolution**: Last-write-wins

```java
// Strong consistent read
GetItemRequest request = GetItemRequest.builder()
    .tableName("Users")
    .key(Map.of("id", AttributeValue.fromS("123")))
    .consistentRead(true)
    .build();

// Transaction
TransactWriteItemsRequest transaction = TransactWriteItemsRequest.builder()
    .transactItems(
        TransactWriteItem.builder()
            .update(Update.builder()
                .tableName("Accounts")
                .key(Map.of("id", AttributeValue.fromS("123")))
                .updateExpression("SET balance = balance - :amt")
                .expressionAttributeValues(Map.of(":amt", AttributeValue.fromN("100")))
                .build())
            .build(),
        TransactWriteItem.builder()
            .update(Update.builder()
                .tableName("Accounts")
                .key(Map.of("id", AttributeValue.fromS("456")))
                .updateExpression("SET balance = balance + :amt")
                .expressionAttributeValues(Map.of(":amt", AttributeValue.fromN("100")))
                .build())
            .build())
    .build();
```

### Google Spanner

- **ACID**: True external consistency across regions
- **Consistency**: Strong consistency via TrueTime
- **Isolation**: Serializable isolation
- **Distributed transactions**: Two-phase commit with TrueTime

```sql
-- Transaction
BEGIN TRANSACTION;

-- Read with timestamp
SELECT * FROM accounts WHERE id = 1;

-- Write
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

COMMIT;
```

---

## Integration Patterns

### Outbox Pattern

```java
@Entity
public class Order {
    @Id
    private Long id;
    private BigDecimal amount;
    private OrderStatus status;
}

@Entity
public class OutboxEvent {
    @Id
    private Long id;
    private String aggregateType;
    private String aggregateId;
    private String eventType;
    private String payload;
    private Instant createdAt;
    private Instant publishedAt;
    private EventStatus status;
}

@Service
public class OrderService {
    @Transactional
    public Order createOrder(CreateOrderCommand cmd) {
        Order order = new Order(cmd);
        orderRepository.save(order);

        OutboxEvent event = new OutboxEvent(
            "Order",
            order.getId().toString(),
            "OrderCreated",
            toJson(new OrderCreatedEvent(order))
        );
        outboxRepository.save(event);

        return order;
    }
}
```

### Saga Orchestration

```java
@Service
public class OrderSagaOrchestrator {
    @SagaOrchestrationStart
    public void handle(OrderCreatedEvent event) {
        sagaManager.createSaga(event.getOrderId())
            .step("reserveInventory")
            .invokeParticipant(inventoryService::reserve)
            .onCompensation(inventoryService::release)
            .step("processPayment")
            .invokeParticipant(paymentService::process)
            .onCompensation(paymentService::refund)
            .step("shipOrder")
            .invokeParticipant(shippingService::ship)
            .onCompensation(shippingService::cancel)
            .start();
    }
}
```

### Eventual Consistency with Versioning

```java
@Entity
public class Document {
    @Id
    private Long id;
    private String content;
    @Version
    private Long version;
}

@Service
public class DocumentService {
    public Document updateDocument(Long id, String newContent, Long expectedVersion) {
        Document doc = documentRepository.findById(id).orElseThrow();
        if (!doc.getVersion().equals(expectedVersion)) {
            throw new OptimisticLockException("Document modified by another transaction");
        }
        doc.setContent(newContent);
        return documentRepository.save(doc);
    }
}
```

### Optimistic Concurrency Control

```java
@Entity
public class Account {
    @Id
    private Long id;
    private BigDecimal balance;
    @Version
    private Long version;
}

@Service
public class AccountService {
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepository.findById(fromId).orElseThrow();
        Account to = accountRepository.findById(toId).orElseThrow();

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        accountRepository.save(from);
        accountRepository.save(to);
    }
}
```

### Pessimistic Concurrency Control

```java
@Service
public class AccountService {
    @Transactional
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepository.findById(fromId).orElseThrow();
        Account to = accountRepository.findById(toId).orElseThrow();

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        accountRepository.save(from);
        accountRepository.save(to);
    }
}
```

---

## Pros and Cons

### Strong Consistency

**Pros:**
- Guarantees correct data
- Simplifies application logic
- No conflict resolution needed

**Cons:**
- Lower availability
- Higher latency
- Harder to scale

### Eventual Consistency

**Pros:**
- High availability
- Low latency
- Easy to scale

**Cons:**
- Stale reads possible
- Complex conflict resolution
- Harder to reason about

### Outbox Pattern

**Pros:**
- Guarantees event delivery
- No dual-write problem
- Idempotent by design

**Cons:**
- Additional storage
- Polling/CDC complexity
- Event ordering challenges

### Saga Pattern

**Pros:**
- Long-running transactions
- No blocking
- Fault-tolerant

**Cons:**
- Complex compensation logic
- Eventual consistency
- Hard to debug

### CRDTs

**Pros:**
- Conflict-free merging
- High availability
- No coordination needed

**Cons:**
- Limited data types
- Metadata overhead
- Complex semantics

---

## Interview Questions

### Q: Explain the ACID properties. Can you have a database that satisfies all four?

**A:** ACID means atomicity, consistency, isolation, and durability for transactions. Yes, many relational systems provide all four within a node/transaction scope, though distributed scale can relax guarantees for availability.

### Q: What is a lost update and how do you prevent it?

**A:** Lost update happens when concurrent writers overwrite each other silently. Prevent with optimistic version checks, row locks, or serializable transaction boundaries.

### Q: What is write skew? How do you detect and prevent it?

**A:** Write skew occurs when concurrent transactions read shared predicates and write different rows, violating a global invariant. Prevent with serializable isolation, explicit locking on invariant rows, or materialized guard rows.

### Q: What is the dual-write problem in microservices?

**A:** Dual write is updating DB and publishing event separately, where one can succeed and the other fail. It creates inconsistent state between source of truth and downstream consumers.

### Q: What is the transactional outbox pattern?

**A:** Write business data and outbox event in one local DB transaction, then relay events asynchronously. This guarantees no event is published without its corresponding state change.

### Q: How do you implement read-your-writes consistency when using read replicas?

**A:** Route post-write reads to primary until replica catches up to the client's commit position. Use LSN/GTID tracking or sticky-session windows.

### Q: What is a CRDT? When would you use one?

**A:** CRDTs are data types that merge concurrent updates deterministically without coordination. Use them for collaborative/offline systems where availability and conflict-free sync are priorities.

### Q: What is the difference between optimistic and pessimistic concurrency control?

**A:** Optimistic control checks for conflicts at commit and retries on collision; pessimistic control locks resources before mutation. Choose based on contention level and latency sensitivity.

### Q: How do you handle conflicts in a multi-master database setup?

**A:** Define deterministic merge policy (for example last-write-wins, field-level merge, or domain-specific resolver) and track causality/version metadata. Surface irreconcilable conflicts for business-level resolution.

### Q: What database isolation level prevents phantom reads?

**A:** Serializable isolation prevents phantoms by enforcing full serial equivalence. Some engines also prevent phantoms at repeatable read using predicate/next-key locks.

### Q: Explain the two-phase commit protocol and its limitations.

**A:** 2PC coordinates atomic commit across participants via prepare and commit phases. Limitations include blocking behavior, single point of failure, and vulnerability to network partitions.

### Q: What is the difference between 2PC and 3PC?

**A:** 3PC adds a pre-commit phase to reduce blocking and improve recovery from coordinator failure, at the cost of higher latency and complexity.

### Q: How does MVCC work and what are its benefits?

**A:** MVCC maintains multiple row versions so readers don't block writers. Benefits include higher concurrency, no read locks, and consistent snapshots.

### Q: What is a saga pattern and when would you use it?

**A:** Saga breaks long transactions into local transactions with compensating actions. Use for long-running business processes across services where ACID is impractical.

### Q: How does change data capture (CDC) work?

**A:** CDC reads database transaction logs and streams changes to consumers. It provides real-time, reliable change streaming without impacting application code. For more details, see the [CDC Deep Dive](./cdc.md).

### Q: What is the difference between event sourcing and traditional state persistence?

**A:** Event sourcing stores state changes as events, enabling replay and audit trails. Traditional persistence stores only current state, losing history.

### Q: Explain the CAP theorem in the context of data consistency.

**A:** CAP states that during network partitions, you must choose between consistency (all nodes see same data) and availability (all nodes can respond). You can't have both during partitions.

### Q: How do you implement idempotency in distributed systems?

**A:** Use idempotency keys stored in a unique constraint table, or embed version/timestamp in data and check before applying changes.

### Q: What is write-ahead logging (WAL) and why is it important?

**A:** WAL writes changes to a log before applying to data files, ensuring durability and enabling crash recovery by replaying the log.

---

## Senior Deep Dive: Advanced Topics

### Vector Clocks

Vector clocks track causality across distributed nodes.

```java
public class VectorClock {
    private Map<String, Long> clock = new HashMap<>();

    public void increment(String nodeId) {
        clock.merge(nodeId, 1L, Long::sum);
    }

    public void merge(VectorClock other) {
        other.clock.forEach((node, value) ->
            clock.merge(node, value, Math::max));
    }

    public boolean happenedBefore(VectorClock other) {
        boolean anyLess = false;
        boolean anyGreater = false;

        Set<String> allNodes = new HashSet<>();
        allNodes.addAll(clock.keySet());
        allNodes.addAll(other.clock.keySet());

        for (String node : allNodes) {
            long thisValue = clock.getOrDefault(node, 0L);
            long otherValue = other.clock.getOrDefault(node, 0L);

            if (thisValue < otherValue) anyLess = true;
            if (thisValue > otherValue) anyGreater = true;
        }

        return anyLess && !anyGreater;
    }

    public boolean isConcurrent(VectorClock other) {
        return !happenedBefore(other) && !other.happenedBefore(this);
    }
}
```

### Lamport Clocks

Lamport clocks provide a partial order of events.

```java
public class LamportClock {
    private long timestamp = 0;

    public synchronized long tick() {
        return ++timestamp;
    }

    public synchronized long update(long receivedTimestamp) {
        timestamp = Math.max(timestamp, receivedTimestamp) + 1;
        return timestamp;
    }
}
```

### Hybrid Logical Clocks (HLC)

HLC combines physical and logical clocks for better ordering.

```java
public class HybridLogicalClock {
    private long physical;
    private long logical;
    private long nodeId;

    public synchronized HLCTimestamp now() {
        long nowPhysical = System.currentTimeMillis();
        if (nowPhysical > physical) {
            physical = nowPhysical;
            logical = 0;
        } else {
            logical++;
        }
        return new HLCTimestamp(physical, logical, nodeId);
    }

    public synchronized HLCTimestamp update(HLCTimestamp received) {
        long nowPhysical = System.currentTimeMillis();
        if (nowPhysical > physical && nowPhysical > received.physical) {
            physical = nowPhysical;
            logical = 0;
        } else if (received.physical > physical) {
            physical = received.physical;
            logical = received.logical + 1;
        } else if (received.physical == physical) {
            logical = Math.max(logical, received.logical) + 1;
        }
        return new HLCTimestamp(physical, logical, nodeId);
    }
}
```

### Distributed Snapshots

Distributed snapshots capture global state consistently.

```java
public class SnapshotCoordinator {
    private Map<String, SnapshotState> nodeStates = new ConcurrentHashMap<>();

    public void initiateSnapshot(String snapshotId) {
        // Send marker to all nodes
        nodes.forEach(node -> node.sendMarker(snapshotId));

        // Wait for all nodes to acknowledge
        awaitAllAcknowledgments(snapshotId);

        // Snapshot is complete
        System.out.println("Snapshot " + snapshotId + " complete");
    }

    public void onMarkerReceived(String nodeId, String snapshotId) {
        nodeStates.computeIfAbsent(nodeId, k -> new SnapshotState())
            .recordMarker(snapshotId);
    }

    public void onMessageReceived(String nodeId, String snapshotId, Message message) {
        nodeStates.computeIfAbsent(nodeId, k -> new SnapshotState())
            .recordMessage(snapshotId, message);
    }
}
```

### Consistency Models Hierarchy

```
Strong Consistency
├── Linearizability
├── Sequential Consistency
└── Causal Consistency
    └── Read-Your-Writes
        └── Monotonic Reads
            └── Monotonic Writes
                └── Eventual Consistency
```

### CAP Theorem Revisited

CAP states that during network partitions, you must choose between:
- **Consistency**: All nodes see same data simultaneously
- **Availability**: Every request receives a response
- **Partition Tolerance**: System continues despite network failures

In practice:
- **CP systems**: Choose consistency over availability (for example, HBase, MongoDB with strong consistency)
- **AP systems**: Choose availability over consistency (for example, Cassandra, DynamoDB)
- **CA systems**: Not possible in distributed systems with partitions

### PACELC Theorem

PACELC extends CAP:
- **P**artition: **A**vailability vs **C**onsistency (same as CAP)
- **E**lse (no partition): **L**atency vs **C**onsistency

```
Partition:  Availability vs Consistency
No partition: Latency vs Consistency
```

Examples:
- **Cassandra**: AP (availability during partition), else latency (eventual consistency)
- **Couchbase**: AP (availability during partition), else consistency (strong consistency when no partition)
- **HBase**: CP (consistency during partition), else consistency (strong consistency always)

---

## Additional Resources

### Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Distributed Systems: Principles and Paradigms" by Andrew Tanenbaum
- "Database System Concepts" by Silberschatz, Korth, and Sudarshan

### Papers
- "Time, Clocks, and the Ordering of Events in a Distributed System" by Leslie Lamport
- "Paxos Made Simple" by Leslie Lamport
- "In Search of an Understandable Consensus Algorithm" by Diego Ongaro and John Ousterhout

### Tools
- **Debezium**: Open-source CDC platform
- **Apache Kafka**: Distributed event streaming
- **Apache ZooKeeper**: Distributed coordination service
- **etcd**: Distributed key-value store

### Standards
- **XA**: Two-phase commit standard
- **JTA**: Java Transaction API
- **JTS**: Java Transaction Service

---

## Best Practices

### Transaction Management
1. Keep transactions short to reduce lock contention
2. Use appropriate isolation levels for your use case
3. Handle deadlocks gracefully with retries
4. Use read-only transactions for queries

### Distributed Transactions
1. Prefer sagas over 2PC for long-running transactions
2. Use idempotency keys for safe retries
3. Implement compensating transactions for rollback
4. Monitor transaction latency and failure rates

### Eventual Consistency
1. Document consistency guarantees clearly
2. Use versioning for conflict detection
3. Implement read repair for stale data
4. Provide consistency controls to users when needed

### Outbox Pattern
1. Use ordered primary keys for outbox table
2. Implement idempotent event publishing
3. Include correlation IDs for tracing
4. Clean up published outbox entries regularly

### Conflict Resolution
1. Choose appropriate conflict resolution strategy
2. Track causality with vector clocks
3. Surface irreconcilable conflicts to users
4. Implement merge UI for collaborative editing

### Monitoring
1. Track transaction latency and throughput
2. Monitor deadlock rates and retry counts
3. Alert on outbox backlog growth
4. Measure consistency lag in eventually consistent systems

### Testing
1. Test concurrent access patterns
2. Simulate network partitions
3. Test failure scenarios and recovery
4. Verify consistency guarantees under load
