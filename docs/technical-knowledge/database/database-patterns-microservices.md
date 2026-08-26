---
id: database-patterns-microservices
title: Database Patterns for Microservices
description: Transactional Outbox, Saga, CQRS, Event Sourcing, database-per-service, and data consistency patterns in distributed architectures.
tags: [database, microservices, outbox, saga, cqrs, event-sourcing, distributed, consistency, spring]
sidebar_position: 18
---

import TransactionalOutboxDiagram from '@site/src/components/TransactionalOutboxDiagram';
import SagaCoordinationDiagram from '@site/src/components/SagaCoordinationDiagram';
import IntegrationDbVsDatabasePerServiceDiagram from '@site/src/components/IntegrationDbVsDatabasePerServiceDiagram';

# Database Patterns for Microservices

---

## Database-Per-Service Pattern

<IntegrationDbVsDatabasePerServiceDiagram />

Each microservice owns its own database — **no shared schema**.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Order Service  │   │  Inventory Svc  │   │  Payment Svc    │
│  ┌───────────┐  │   │  ┌───────────┐  │   │  ┌───────────┐  │
│  │ orders DB │  │   │  │  inv DB   │  │   │  │  pay DB   │  │
│  └───────────┘  │   │  └───────────┘  │   │  └───────────┘  │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

**Why:**
- Independent deployability (schema changes don't affect other services)
- Technology freedom (each service picks the best DB for its needs)
- Fault isolation (one DB down doesn't affect others)
- Independent scaling

**Challenge: cross-service data consistency** — no distributed ACID transactions.

---

## Transactional Outbox Pattern

<TransactionalOutboxDiagram />

**Problem**: Atomically update the DB *and* publish an event to a message broker.

**Naive approach (broken):**
```java
// ❌ NOT atomic — network failure between steps loses the event
orderRepository.save(order);      // Step 1: DB commit
messageQueue.publish(orderEvent); // Step 2: Kafka publish → could fail!
```

:::info[Deep Dive: Outbox Pattern]
The standard solution to this is the **Transactional Outbox Pattern**. 
For a complete guide with code examples, polling vs CDC (Debezium) trade-offs, and failure mitigation, see the dedicated **[Transactional Outbox Pattern Guide](../system-design/outbox-pattern.md)**.
:::

---

## Saga Pattern

<SagaCoordinationDiagram />

To coordinate multi-step workflows across microservice boundaries without blocking database resources or relying on fragile distributed transactions (like 2PC), use the Saga Pattern (via Choreography or Orchestration).

For a complete guide including a detailed Orchestration vs. Choreography comparison matrix, compensating transaction playbooks, idempotency strategies, and Java entity/orchestrator implementations, see the dedicated **[Saga Pattern Guide](../system-design/saga-pattern.md)**.

---

## CQRS — Command Query Responsibility Segregation

:::info[Deep Dive: CQRS & Event Sourcing]
For a comprehensive guide on separating read and write models, synchronization via Domain Events, and Event Sourcing theory, see the centralized **[CQRS & Event Sourcing](../system-design/cqrs.md)** page.
:::

---

## Event Sourcing

Instead of storing current state, store the **sequence of events** that led to it.

```
Traditional: store current state
┌──────────────────────────────────┐
│ Order: id=1, status=shipped,    │
│ total=99.90, items=[...]        │
└──────────────────────────────────┘

Event Sourcing: store events
┌──────────────────────────────────────────────────────┐
│ OrderCreated   {id:1, user:42, items:[...]}           │
│ PaymentApplied {amount:99.90, method:card}            │
│ ItemsShipped   {tracking:XYZ123, date:2024-01-15}     │
└──────────────────────────────────────────────────────┘

Current state = replay all events (or from last snapshot)
```

```java
@Entity
public class EventStoreRecord {
    @Id @GeneratedValue
    private Long id;
    private String aggregateId;
    private String aggregateType;
    private Long version;
    private String eventType;

    @Convert(converter = JsonConverter.class)
    private Map<String, Object> payload;
    private Instant occurredAt;
}

// Reconstitute aggregate
public Order load(String orderId) {
    List<EventStoreRecord> events = eventStore
        .findByAggregateIdOrderByVersion(orderId);
    Order order = new Order();
    events.forEach(e -> order.apply(e)); // replay events
    return order;
}
```

**Benefits:**
- Full audit log built-in
- Temporal queries ("what was the state on Jan 15?")
- Event-driven architecture natural fit
- CQRS natural companion

**Challenges:**
- Querying current state requires projection (CQRS read model)
- Schema evolution of events is hard
- High volume → large event stores (use snapshots)

---

## API Composition vs Database Join

When you need data from multiple services:

```
❌ Don't:  SELECT o.*, u.* FROM orders o JOIN users u ON ...
           (services own their own DBs — no cross-DB joins)

✅ Do:     API Gateway or BFF aggregates:
           1. GET /orders → OrderService returns orders
           2. GET /users/{ids} → UserService returns user details
           3. Merge in application layer
```

Or use a **read-side projection** that subscribes to both services' events and builds a pre-joined view.

---

## Dual Write Problem & Solutions

```
// ❌ Dual write race condition
db.save(entity);       // succeeds
kafka.publish(event);  // fails → event lost, DB has data, Kafka doesn't
```

Solutions:
1. **Transactional Outbox** (recommended)
2. **CDC with Debezium** — read DB changelog, publish to Kafka
3. **Event-First** — publish to Kafka first, DB write on consumption
4. **Change Data Capture** — treat DB as source of truth, derive events

---

## Unified ACID Consolidation (Replacing Distributed Cache with RDBMS)

A common architectural trap in high-scale systems is splitting state across an **In-Memory Cache for fast operations** (e.g. Redis for inventory holds/reservations) and an **RDBMS for permanent records** (e.g. MySQL ledger for payments and completed orders).

```
Split Architecture (Fragile Cross-System Coordination):
┌─────────────────────────┐          ┌─────────────────────────┐
│       Redis Cluster     │          │       MySQL Ledger      │
│  (Reservations: DECR)   │          │   (Authoritative Stock) │
└─────────────────────────┘          └─────────────────────────┘
            ▲                                     ▲
            │ (Step 1: Hold)                      │ (Step 2: Permanent Claim)
            └─────────────── Application ─────────┘
                 ❌ Non-Atomic Cross-System Window:
                 • Payment succeeds but DB write fails ──► Overselling!
                 • DB write succeeds but Redis rollback fails ──► Underselling!
```

### Why Consolidate Back to RDBMS?
1. **Eliminate Non-Atomic Split-Brain**: When reserve and claim share the same database instance, they execute within standard **ACID transactions**. A failed payment cleanly rolls back the reservation with zero orphaned holds or phantom stock deductions.
2. **Multi-Dimension Consistency**: Redis simple key-value structures struggle with multi-location inventory, warehouse routing rules, and multi-currency constraints. Relational engines enforce relational integrity and multi-column constraints natively.
3. **Operational Simplicity**: Replaces an entire distributed Redis cluster (plus synchronization daemons and reconciliation jobs) with optimized table structures inside existing database clusters.

---

## Zero-Downtime Migration Pattern: Shadow Mode (Dual-Write Cutover)

When replacing critical storage infrastructure (such as moving reservations from Redis to MySQL), migrating active in-flight transactions with zero downtime and zero risk of overselling is paramount.

```
Phase 1: Shadow Mode (Dual-Write)
┌─────────────┐  Write to Both   ┌─────────────┐ (Active Source of Truth)
│ Application │ ───────────────► │    Redis    │ ──► Controls Business Logic
└─────────────┘                  └─────────────┘
       │ (Async / Shadow Write)
       ▼
┌─────────────┐
│    MySQL    │ ──► Validates latency, correctness, and lock behavior under real load
└─────────────┘

Phase 2: Cutover (Kill-Switch Switchover)
┌─────────────┐  Write to Both   ┌─────────────┐
│ Application │ ───────────────► │    MySQL    │ ──► NEW Active Source of Truth
└─────────────┘                  └─────────────┘
       │ (Shadow Write / Backup)
       ▼
┌─────────────┐
│    Redis    │ ──► Immediate rollback target if anomaly occurs
└─────────────┘
```

### Execution Strategy:
1. **Dual-Write in Shadow Mode**: Write every reservation to both Redis and MySQL, with Redis remaining the authoritative source of truth.
2. **Real-World Load & Correctness Validation**: Verify that MySQL handles peak Black Friday production throughput with zero correctness drift or lock contention while serving real buyer traffic.
3. **Zero In-Flight Data Migration**: Because both databases are continuously updated, no complex batch data migration or downtime window is needed.
4. **Gradual Pod-by-Pod Cutover with Kill Switch**: Flip the source of truth to MySQL gradually (e.g. low-traffic merchant pods first, scaling to highest-volume merchants). Keep Redis dual-write active during initial days as an instant fallback kill switch.

---

## Interview Questions

**Q1. What is the database-per-service pattern and why is it used in microservices?**
> Each service owns its own database with no shared schema. This enables independent deployment (schema changes are local), technology diversity (each service uses the best DB for its needs), fault isolation, and independent scaling. The trade-off is that cross-service consistency requires patterns like Saga and Outbox instead of distributed transactions.

**Q2. What problem does the Transactional Outbox pattern solve?**
> It solves the dual-write problem: atomically updating the database AND publishing an event to a message broker. By writing the event to an outbox table in the same local transaction as the business data, you guarantee both succeed or both fail. A relay process (polling or CDC) then publishes outbox events to the broker asynchronously.

**Q3. What is the Saga pattern? When would you use choreography vs orchestration?**
> A Saga breaks a distributed transaction into a sequence of local transactions with compensating transactions for rollback. Choreography: services react to domain events — loose coupling but hard to trace. Orchestration: a central coordinator directs all steps — easier to reason about, clearer visibility. Use choreography for simple flows; orchestration for complex multi-step processes.

**Q4. What is CQRS and what problem does it solve?**
> Command Query Responsibility Segregation separates the write model (handling commands, enforcing business rules) from the read model (optimized for queries). Solves the mismatch between complex write logic (requiring normalized, consistent data) and read needs (requiring denormalized, prejoined data for performance). Enables independent scaling of reads and writes.

**Q5. What is Event Sourcing and what are its trade-offs?**
> Event Sourcing stores domain events rather than current state — current state is derived by replaying events. Benefits: full audit log, temporal queries, event-driven integration, natural CQRS fit. Trade-offs: complex to query (requires projections/CQRS), event schema evolution is hard, large event stores need snapshots, high learning curve.

**Q6. How do you handle cross-service queries (e.g., "list orders with user details") in microservices?**
> Options: API composition in a BFF/gateway (call both services, merge in memory); CQRS read-side projection (event subscriber builds a pre-joined view in its own DB); API Gateway pattern. Never do cross-database JOINs directly — each service's DB is its private implementation detail.

**Q7. What is Change Data Capture (CDC) and how does Debezium work?**
> CDC captures row-level changes from the database's transaction log (WAL for PostgreSQL, binlog for MySQL) without modifying the application. For a complete deep dive, including schema evolution and snapshotting challenges, see the **[Change Data Capture (CDC)](../system-design/cdc.md)** page.

**Q8. What is the difference between eventual consistency and strong consistency in microservices?**
> Strong consistency: every read sees the latest write immediately — achieved within a single database with ACID transactions, but impossible across distributed services without coordination cost. Eventual consistency: all replicas/services will converge to the same state *eventually* (after event propagation) — cheaper, more available, but reads may be stale. Design systems to tolerate eventual consistency; use strong consistency only where business rules require it.

---

## Advanced Editorial Pass: Data Patterns for Service Autonomy and Consistency

### Senior Engineering Focus
- Choose outbox, saga, and CQRS patterns by failure recovery requirements.
- Keep data ownership boundaries explicit across services.
- Design event contracts for replayability and backward compatibility.

### Failure Modes to Anticipate
- Cross-service coupling through shared database shortcuts.
- Compensation workflows that fail to restore business invariants.
- Event ordering assumptions broken during retries and replays.

### Practical Heuristics
1. Define consistency model per business process.
2. Test saga and outbox behavior under duplicate and delayed events.
3. Instrument end-to-end flow with correlation IDs and lag metrics.

### Compare Next
- [Transactions & Concurrency](./transactions-concurrency.md)
- [Replication & Partitioning](./replication-partitioning.md)
- [Schema Migrations](./schema-migrations.md)
