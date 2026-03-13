---
id: database-patterns-microservices
title: Database Patterns for Microservices
description: Transactional Outbox, Saga, CQRS, Event Sourcing, database-per-service, and data consistency patterns in distributed architectures.
tags: [database, microservices, outbox, saga, cqrs, event-sourcing, distributed, consistency, spring]
sidebar_position: 18
---

# Database Patterns for Microservices

## Database-Per-Service Pattern

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

**Problem**: Atomically update the DB *and* publish an event to a message broker.

**Naive approach (broken):**
```java
// ❌ NOT atomic — network failure between steps loses the event
orderRepository.save(order);      // Step 1: DB commit
messageQueue.publish(orderEvent); // Step 2: Kafka publish → could fail!
```

**Transactional Outbox (correct):**
```java
// ✅ Both in same local transaction
@Transactional
public void placeOrder(OrderRequest req) {
    Order order = orderRepository.save(new Order(req));

    // Write event to outbox table IN SAME TRANSACTION
    outboxRepository.save(OutboxEvent.builder()
        .aggregateId(order.getId())
        .aggregateType("Order")
        .eventType("OrderPlaced")
        .payload(toJson(order))
        .build());
    // Single DB commit — either both persist or neither
}

// Separate relay process reads outbox and publishes to Kafka
@Scheduled(fixedDelay = 1000)
public void relayOutboxEvents() {
    List<OutboxEvent> pending = outboxRepo.findPending();
    for (OutboxEvent event : pending) {
        kafka.send(event.getEventType(), event.getPayload());
        outboxRepo.markPublished(event.getId());
    }
}
```

```sql
CREATE TABLE outbox_events (
    id              BIGSERIAL PRIMARY KEY,
    aggregate_type  VARCHAR(100) NOT NULL,
    aggregate_id    VARCHAR(100) NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    published_at    TIMESTAMP NULL
);

CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at)
WHERE published_at IS NULL;
```

### CDC-Based Outbox (Debezium)

Instead of a polling relay, use **Change Data Capture (CDC)** to read DB WAL/binlog:

```
DB WAL/binlog → Debezium → Kafka Connect → Kafka topic
```

Benefits: no polling overhead, exactly-once semantics with Kafka, lower latency.

---

## Saga Pattern

**Problem**: Multi-step business transaction spanning multiple services — can't use distributed ACID transactions.

**Saga**: a sequence of local transactions, each publishing events or messages to trigger the next step. If a step fails → compensating transactions undo previous steps.

### Choreography-Based Saga (Event-Driven)

Services react to each other's events autonomously:

```
Order Service                Inventory Service         Payment Service
     │                             │                        │
     │──OrderPlaced event─────────▶│                        │
     │                             │──InventoryReserved─────▶│
     │                             │   event                 │
     │                             │                   PaymentProcessed
     │◀────────────────────────────────────────────── event  │
     │ (OrderConfirmed)            │                        │
```

**Compensation (failure):**
```
PaymentFailed event
→ Inventory Service: release reservation
→ Order Service: cancel order
```

### Orchestration-Based Saga (Central Coordinator)

A **Saga Orchestrator** directs all steps:

```java
@Component
public class OrderSagaOrchestrator {

    public void execute(Order order) {
        try {
            inventoryClient.reserveItems(order);         // Step 1
            paymentClient.processPayment(order);         // Step 2
            shippingClient.scheduleShipment(order);      // Step 3
            orderService.confirm(order.getId());         // Step 4
        } catch (PaymentException e) {
            inventoryClient.releaseReservation(order);   // Compensate step 1
            orderService.cancel(order.getId());
            throw e;
        }
    }
}
```

| | Choreography | Orchestration |
|--|-------------|--------------|
| Coupling | Loose (event-driven) | Tighter (services know orchestrator) |
| Visibility | Harder to trace | Clear in orchestrator |
| Complexity | Grows with steps | Centralized, easier to reason |
| Best for | Simple sagas | Complex, multi-step flows |

---

## CQRS — Command Query Responsibility Segregation

Separate the **write model** (commands) from the **read model** (queries).

```
Write Side                          Read Side
──────────                         ──────────
POST /orders  ──▶  Command  ──▶  Write DB (normalized)
                   Handler          │
                       │       Domain Events
                       └────────────▶  Read DB (denormalized)
                                       └──▶ GET /orders/{id}
                                       └──▶ GET /users/{id}/orders
```

**Why CQRS:**
- Read and write have different scalability needs
- Read model can be optimized for specific query patterns
- Write model enforces business invariants
- Read replicas naturally separate read/write

```java
// Command side — enforce business rules
@Service
public class OrderCommandService {
    @Transactional
    public OrderId placeOrder(PlaceOrderCommand cmd) {
        Order order = Order.create(cmd);  // domain logic, validation
        orderRepo.save(order);
        eventBus.publish(new OrderPlacedEvent(order));
        return order.getId();
    }
}

// Query side — optimized read model
@Service
public class OrderQueryService {
    // Read from denormalized view or dedicated read DB
    @Transactional(readOnly = true)
    public OrderSummaryDto getOrderSummary(Long orderId) {
        return orderSummaryRepo.findById(orderId); // pre-joined, flat DTO
    }

    public List<OrderListItem> getUserOrders(Long userId, Pageable pageable) {
        return orderListRepo.findByUserId(userId, pageable);
    }
}

// Event handler updates read model
@EventListener
public void on(OrderPlacedEvent event) {
    orderSummaryRepo.save(new OrderSummaryView(event));
    userOrderListRepo.addOrder(event.getUserId(), event);
}
```

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

## 🎯 Interview Questions

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
> CDC captures row-level changes from the database's transaction log (WAL for PostgreSQL, binlog for MySQL) without modifying the application. Debezium is an open-source CDC tool that connects to the DB log and publishes change events to Kafka. It enables the Outbox pattern without polling, synchronizes read models, and replicates data to data warehouses with low latency.

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
