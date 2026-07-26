---
id: cqrs
title: "CQRS & Event Sourcing"
sidebar_label: CQRS & Event Sourcing
description: Comprehensive guide on Command Query Responsibility Segregation (CQRS) and Event Sourcing, detailing architecture, implementation patterns, comparisons with alternatives, and deep dives for senior engineers.
tags: [cqrs, event-sourcing, system-design, microservices, architecture, java, spring]
---

import CqrsArchitectureDiagram from '@site/src/components/CqrsArchitectureDiagram';
import CqrsCrudPatternDiagram from '@site/src/components/CqrsCrudPatternDiagram';
import CqrsReadReplicasDiagram from '@site/src/components/CqrsReadReplicasDiagram';
import CqrsPurePatternDiagram from '@site/src/components/CqrsPurePatternDiagram';
import CqrsEventSourcingPatternDiagram from '@site/src/components/CqrsEventSourcingPatternDiagram';
import EventDrivenNoCqrsDiagram from '@site/src/components/EventDrivenNoCqrsDiagram';
import CqrsSagaProcessManagerDiagram from '@site/src/components/CqrsSagaProcessManagerDiagram';

# CQRS & Event Sourcing

> **Command Query Responsibility Segregation (CQRS)** is an architectural pattern that separates the models used to read data (Queries) from the models used to update data (Commands).
>
> **Event Sourcing** is a complementary pattern that stores the state of an application as a sequence of immutable, append-only events rather than just the current state snapshot.

These are two independent patterns — you can use CQRS without Event Sourcing, and vice versa. They are frequently combined because they naturally complement each other.

---

## 👶 Beginner View: What is CQRS?

In a traditional CRUD (Create, Read, Update, Delete) system, you use the same database model for both reading and writing. This works well for simple applications but starts to fail under heavy load or complex business logic.

**The restaurant analogy:**
- **CRUD:** One giant whiteboard. Waiters write new orders on it (Writes), and chefs constantly read from that same board (Reads). They bump into each other — it's chaotic.
- **CQRS:** Waiters hand order tickets to an expeditor (Command Model). The expeditor processes them, applies business rules, and updates a separate, specialized screen for the chefs (Query Model) optimized *exactly* for what a chef needs to see.

By separating the "Write Side" and "Read Side", you can scale and optimize them completely independently.

### Architecture Diagram

<CqrsArchitectureDiagram />

---

## 👶 Beginner View: What is Event Sourcing?

Instead of saving only the *current state* of an entity, you save the *full history of all events* that happened to it. Current state is derived by replaying that history.

```
// Traditional approach — only shows current state
Account { id: 1, balance: $1300 }

// Event Sourced approach — shows how we got here
AccountCreated    { id: 1, initialBalance: $1000 }
MoneyDeposited    { id: 1, amount: $500 }
MoneyWithdrawn    { id: 1, amount: $200 }
// Replay: 1000 + 500 - 200 = $1300
```

### Why Use Event Sourcing?

- **Perfect Audit Trail:** You never delete or overwrite data. You have a mathematically verifiable history of every state change.
- **Time Travel:** Reconstruct the exact state of the system at any past moment by replaying events up to that timestamp.
- **New Read Models on Demand:** Need a new reporting dashboard? Build a new Read DB, replay all historical events from the beginning, and instantly have a populated view without touching production data.
- **Event-Driven Integration:** Downstream services can subscribe to the event log and react in real time without polling.

---

## ⚖️ Alternatives & When to Choose What

Understanding CQRS and Event Sourcing means knowing the full landscape of architectural alternatives. Each has genuine trade-offs.

### Pattern Comparison Matrix

| Criterion | Traditional CRUD | CQRS (no ES) | CQRS + Event Sourcing | Event-Driven (no CQRS) |
|---|---|---|---|---|
| **Complexity** | Low | Medium | High | Medium |
| **Auditability** | ❌ No history | ⚠️ Manual audit log | ✅ Built-in, immutable | ⚠️ Depends on design |
| **Read scalability** | ❌ Limited | ✅ Independent scaling | ✅ Independent scaling | ⚠️ Partial |
| **Write scalability** | ⚠️ Limited | ✅ Independent scaling | ✅ Independent scaling | ✅ Good |
| **Consistency** | ✅ Strong | ⚠️ Eventual | ⚠️ Eventual | ⚠️ Eventual |
| **Time travel / replay** | ❌ | ❌ | ✅ | ❌ |
| **Operational overhead** | Low | Medium | High | Medium |
| **Query flexibility** | ❌ One model | ✅ Multiple read models | ✅ Multiple read models | ❌ Limited |
| **Team learning curve** | Low | Medium | Very high | Medium |

---

### 1. Traditional CRUD (3-Tier Architecture)

The simplest architecture: one data model shared between reads and writes, typically backed by a relational database.

<CqrsCrudPatternDiagram />

**Strengths:**
- Low complexity; almost every developer understands it.
- Strong consistency — reads immediately reflect writes.
- Well-supported by mature tooling (Spring Data JPA, Hibernate).
- Easy to debug; no distributed state to reason about.

**Weaknesses:**
- The same schema must satisfy both read (complex joins, aggregations) and write (normalization, constraints) needs — they pull in opposite directions.
- Heavy read traffic degrades write performance and vice versa.
- No built-in history or auditability.
- Scaling writes and reads independently is difficult.

**Choose CRUD when:** you have a team-facing admin tool, a low-traffic internal service, or a domain with no complex business invariants.

---

### 2. Read Replicas + Caching (CRUD with Scalability)

Before jumping to CQRS, many teams solve read scalability by adding a read replica and a caching layer (Redis, Memcached) in front of the existing CRUD model.

<CqrsReadReplicasDiagram />

**Strengths:**
- Dramatically easier than CQRS — no architectural paradigm shift.
- Solves most read-scalability problems.
- Minimal code changes; Spring Cache abstraction handles caching transparently.
- Cache invalidation is solvable with TTL or event-based eviction.

**Weaknesses:**
- Read Replicas still use the same schema — complex denormalization for UI still lives in your application layer (N+1 queries, heavy joins).
- Cache invalidation is error-prone at scale.
- No independent write-side or domain logic isolation.
- No audit history.

**Choose this when:** your bottleneck is read throughput only and your domain model is not overly complex. This should be the first scaling step, before CQRS.

---

### 3. CQRS Without Event Sourcing

A separate Command and Query model backed by separate databases, synchronized via domain events. The Write DB stores current state normally; the Read DB is a denormalized projection optimized for queries.

<CqrsPurePatternDiagram />

**Strengths:**
- Write side enforces domain invariants on a clean, normalized model without join complexity.
- Read side can be radically denormalized per use case — one collection for "user feed", another for "order search", etc.
- Read and write sides scale independently.
- No Event Sourcing complexity — you still update state normally.

**Weaknesses:**
- Eventual consistency between Write and Read DBs requires explicit handling.
- Projectors must be idempotent and resilient to duplicate events.
- More moving parts: an event bus, projectors, and two databases to operate.
- Still no built-in audit trail.

**Choose this when:** your system has a high read/write asymmetry and complex UI queries, but you do not need a full event history.

---

### 4. CQRS + Event Sourcing (Full Pattern)

The Write DB is replaced entirely by an **Event Store** — an append-only log of domain events. Current state is never stored directly; it is always derived by replaying events. The Query side remains the same as pure CQRS.

<CqrsEventSourcingPatternDiagram />

**Strengths:**
- All of CQRS's benefits, plus a complete, immutable, auditable event history.
- Time travel: reconstruct any aggregate's state at any past point in time.
- Enables retroactive analytics: replay events into new read models you didn't anticipate at design time.
- Natural decoupling for Saga/process manager patterns.

**Weaknesses:**
- The highest architectural complexity of all options.
- Event schema evolution is a first-class operational concern for the lifetime of the system.
- Snapshotting is mandatory for long-lived aggregates (see below).
- Requires a paradigm shift away from "update a row in a table."

**Choose this when:** auditability is a hard requirement (financial, healthcare, legal), or when your domain is inherently event-centric (ledgers, supply chain, inventory).

---

### 5. Event-Driven Architecture Without CQRS

Services communicate exclusively via events but do not separate read and write models internally. Each service consumes events from others and maintains its own local state.

<EventDrivenNoCqrsDiagram />

**Strengths:**
- Excellent service decoupling.
- Resilience: producing service doesn't wait for consumers.
- Good for choreography-based Sagas.

**Weaknesses:**
- No read/write separation benefit within a single service.
- Hard to understand overall system flow ("event spaghetti").
- No audit history unless explicitly built.

**Choose this when:** your primary concern is inter-service decoupling, not per-service read/write scalability.

---

## 🛠️ When to Use CQRS & Event Sourcing

### Use CQRS When:
- **High Read/Write Asymmetry:** (e.g., social feeds) — 1000x more reads than writes. Pre-computed, denormalized read models serve reads orders of magnitude faster.
- **Complex Domain Logic:** The Write side focuses purely on invariant checking; it never needs to join tables for UI concerns.
- **Independent Scaling:** The Read API runs across 50 pods; the Write API runs on 3.
- **Multiple UI Views of the Same Data:** An order can be viewed as a "chef's view", a "delivery view", and a "customer view" — each backed by its own tailored projection.

### Use Event Sourcing When:
- **Strict Audit Requirements:** Financial, medical, or legal systems must prove exactly how the system reached its current state.
- **Frequent Requirement Changes:** New reporting needs arise regularly; replaying events populates any new view from day one.
- **Business Process Replay:** After fixing a bug in business logic, replay events to correct the state of affected aggregates.
- **Inherently Event-Centric Domain:** Accounting ledgers, insurance claims, supply chain movements — these are naturally event-based, not state-based.

### ❌ When NOT to Use Them:
- **Simple CRUD Apps:** An admin dashboard, internal tool, or early-stage startup MVP. Massive over-engineering.
- **Strong Consistency on the UI is Required:** If the user *must* immediately see the result of their write reflected in a complex query, the eventual consistency model creates severe UX friction.
- **Small, Inexperienced Team:** Event Sourcing requires a paradigm shift. If your team has not worked with it before, budget significant ramp-up time before committing to production.
- **High-Frequency Writes with Long-Lived Aggregates:** Without disciplined snapshotting, replaying millions of events per request becomes a performance disaster.

---

## 🧠 Senior Deep Dive: Challenges & Solutions

### 1. Eventual Consistency: The Full Picture

Because Write and Read DBs synchronize asynchronously, there is an inherent **projection lag** — the Read DB lags behind the Write DB by however long it takes the event to travel through the bus and be processed by the projector.

**The Problem in Practice:** A user submits a profile update. The Command succeeds (HTTP 200). They are redirected to their profile page. They still see their *old* photo because the projector has not caught up yet.

**Solutions, ranked by complexity:**

| Strategy | Mechanism | Trade-off |
|---|---|---|
| **Optimistic UI** | The UI locally applies the change immediately without waiting for the server-side Read DB | Can diverge from actual server state |
| **Return-and-cache** | Command handler returns the new state in the response; UI uses it directly | Couples command and query sides |
| **ETag / version polling** | Command returns an expected version number; UI polls Query API until it returns that version | Adds latency; requires versioned projections |
| **WebSocket notification** | Projector pushes a "projection-ready" event to the UI via WebSocket when the read side catches up | High infrastructure complexity |
| **Synchronous projection** | For critical writes, update the Read DB synchronously in the same transaction | Defeats the purpose of separation for those paths |

In practice, **Optimistic UI combined with version polling** covers most production use cases.

---

### 2. Aggregate Design: Getting the Boundaries Right

In Event Sourcing, the Aggregate is the transactional boundary. Getting aggregate boundaries wrong is the most common source of bugs and performance issues.

**Rules for aggregate boundaries:**
- An aggregate should protect one or more business invariants — things that must *always* be true.
- If two pieces of state must be consistent *in the same transaction*, they belong to the same aggregate.
- Aggregates should be as small as possible. An `Order` aggregate does not need to contain the full `Customer` entity.
- Aggregates communicate across boundaries only via events, never by direct reference.

**Common mistake — over-aggregation:**
```java
// ❌ BAD: One giant aggregate for the entire Order domain
// This creates a single contention point under load
public class OrderAggregate {
    private Order order;
    private Customer customer;      // wrong — Customer is its own aggregate
    private List<Product> products; // wrong — Products are their own aggregates
    private Shipment shipment;      // wrong — Shipment is its own aggregate
}

// ✅ GOOD: Each aggregate protects its own invariants
public class OrderAggregate {
    private OrderId id;
    private CustomerId customerId;  // reference by ID only
    private List<OrderLine> lines;  // lines are part of Order's invariants
    private OrderStatus status;
    private Money totalAmount;
}
```

---

### 3. Event Versioning & Schema Evolution

Events are **immutable and permanent**. Once `OrderPlacedV1` is in production, you will support it forever. This is the most under-appreciated operational challenge in Event Sourcing.

**Versioning Strategies:**

**Option A — Weak Schema (JSON with no registry):**
Add new optional fields; never remove fields. Forward and backward compatibility is maintained by convention, not enforcement. Simple but risky at scale.

**Option B — Schema Registry (Avro / Protobuf with Confluent Schema Registry):**
All events are registered with a schema. New versions must pass compatibility checks (backward, forward, or full). Enforced at publish time. This is the production-grade approach.

**Option C — Upcasters:**
A dedicated component that intercepts old event versions as they are read from the event store and upgrades them to the current version *in memory*, before the aggregate ever sees them.

```java
// Example: OrderPlaced event was refactored in v2
// v1: had a single "customerName" string
// v2: has a separate "firstName" and "lastName"

@Component
public class OrderPlacedV1Upcaster implements EventUpcaster {

    @Override
    public boolean canUpcast(EventData event) {
        return "OrderPlaced".equals(event.getType())
                && event.getRevision() == 1;
    }

    @Override
    public EventData upcast(EventData event) {
        var payload = event.getPayload();
        String[] nameParts = payload.get("customerName").asText().split(" ", 2);
        payload.put("firstName", nameParts[0]);
        payload.put("lastName", nameParts.length > 1 ? nameParts[1] : "");
        payload.remove("customerName");
        return event.withPayload(payload).withRevision(2);
    }
}
```

:::warning[Schema Evolution Rule]
Never rename, remove, or change the type of an existing field in a published event. Always add new fields as optional, or create a new versioned event type and use an upcaster to bridge the gap.
:::

---

### 4. Snapshotting

If an aggregate processes 50,000 events over its lifetime (an active bank account, for example), loading it requires replaying all 50,000 events — which is unacceptably slow.

**Snapshot Strategy:**

1. Every N events (e.g., every 100), serialize the current aggregate state to a snapshot store.
2. On load: fetch the latest snapshot. Replay only the events that occurred *after* that snapshot's sequence number.

```java
@Service
public class AggregateRepository {

    private static final int SNAPSHOT_THRESHOLD = 100;

    public BankAccount load(AccountId id) {
        // 1. Load latest snapshot (if any)
        Optional<Snapshot> snapshot = snapshotStore.findLatest(id);

        long fromSequence = snapshot.map(Snapshot::getSequenceNumber).orElse(0L);
        BankAccount account = snapshot
                .map(s -> deserialize(s.getPayload(), BankAccount.class))
                .orElseGet(BankAccount::new);

        // 2. Replay only events after the snapshot
        List<DomainEvent> events = eventStore.loadEvents(id, fromSequence);
        events.forEach(account::apply);
        return account;
    }

    public void save(BankAccount account) {
        List<DomainEvent> newEvents = account.getUncommittedEvents();
        eventStore.appendEvents(account.getId(), newEvents, account.getExpectedVersion());

        // 3. Take a snapshot if threshold reached
        if (account.getVersion() % SNAPSHOT_THRESHOLD == 0) {
            snapshotStore.save(new Snapshot(account.getId(), account.getVersion(),
                    serialize(account)));
        }

        account.clearUncommittedEvents();
    }
}
```

---

### 5. Idempotent Projectors

Kafka and RabbitMQ guarantee **at-least-once delivery** — your projector will receive duplicate events under failure scenarios (consumer restarts, network partitions, etc.). A non-idempotent projector will corrupt the Read DB on duplicates.

**Three approaches to idempotency:**

**Approach 1 — Idempotent Upsert (simplest):**
Design your projection update SQL/NoSQL query so that applying the same event twice produces the same result. Use `ON CONFLICT DO UPDATE` in PostgreSQL or `replaceOne` with upsert in MongoDB.

```java
// MongoDB upsert — safe to run multiple times with the same event
mongoTemplate.update(OrderView.class)
    .matching(where("orderId").is(event.getOrderId()))
    .apply(new Update()
        .set("status", "CONFIRMED")
        .set("updatedAt", event.getOccurredAt()))
    .upsert();
```

**Approach 2 — Event ID Deduplication Table:**
Record each processed event ID in a deduplication table. Before processing, check if the event was already handled.

```java
@Transactional
public void on(OrderConfirmedEvent event) {
    if (processedEventRepository.existsById(event.getEventId())) {
        log.warn("Duplicate event detected, skipping: {}", event.getEventId());
        return;
    }
    // Apply projection update...
    orderViewRepository.updateStatus(event.getOrderId(), "CONFIRMED");
    processedEventRepository.save(new ProcessedEvent(event.getEventId()));
}
```

**Approach 3 — Sequence Number / Offset Tracking:**
Store the last processed event offset (Kafka offset or event sequence number). On restart, resume from that offset. This is the most robust approach and is built into Kafka consumer groups.

---

### 6. Optimistic Concurrency Control on the Write Side

Multiple concurrent commands targeting the same aggregate can cause **lost updates** without concurrency control. In an Event Sourced system, this is handled via optimistic locking on the expected event stream version.

```java
@Service
public class EventStore {

    public void appendEvents(AggregateId id, List<DomainEvent> events, long expectedVersion) {
        long actualVersion = getLatestVersion(id);

        if (actualVersion != expectedVersion) {
            throw new OptimisticConcurrencyException(
                "Expected version %d but aggregate is at version %d for aggregate %s"
                    .formatted(expectedVersion, actualVersion, id));
        }

        // Append events atomically
        events.forEach(event -> persist(id, event, ++actualVersion));
    }
}

// In the command handler:
@CommandHandler
public void handle(WithdrawMoneyCommand command) {
    BankAccount account = repository.load(command.getAccountId());
    account.withdraw(command.getAmount()); // validates invariants, emits event

    // Will throw if another command modified the aggregate concurrently
    repository.save(account); // passes account.getVersion() as expectedVersion
}
```

The command handler can be retried on `OptimisticConcurrencyException`, which is safe because the retry will reload the latest state and re-evaluate the business rule.

---

### 7. Sagas and Process Managers

In a microservices architecture, a business process often spans multiple services. Neither a single database transaction nor a 2-phase commit is viable across service boundaries. The **Saga Pattern** solves this with a sequence of local transactions coordinated by events.

CQRS naturally integrates with Sagas:

<CqrsSagaProcessManagerDiagram />

**Compensating Transactions:** If any step fails, the Saga emits compensating commands to undo previous steps (e.g., `RefundPaymentCommand` if stock reservation fails).

**Choreography vs. Orchestration:**

| Aspect | Choreography | Orchestration |
|---|---|---|
| **Control** | Distributed across services | Centralized in Saga/Process Manager |
| **Coupling** | Services know only about events | Only the orchestrator knows the flow |
| **Traceability** | Hard — must trace event chains | Easy — single place shows full flow |
| **Failure handling** | Complex — each service handles compensations | Centralized in the orchestrator |
| **Best for** | Simple, linear flows | Complex, conditional, long-running flows |

---

### 8. Java & Spring Implementation: Technology Choices

For teams in the Spring ecosystem, the standard technology stack for CQRS + Event Sourcing is:

**Axon Framework (most complete option):**

Axon provides first-class CQRS and Event Sourcing support with Spring Boot auto-configuration. It handles command routing, event storage, projections, and Saga lifecycle out of the box.

```java
// Aggregate — the Write side
@Aggregate
public class OrderAggregate {

    @AggregateIdentifier
    private String orderId;
    private OrderStatus status;

    @CommandHandler
    public OrderAggregate(PlaceOrderCommand command) {
        // Validate business rules, then emit event
        AggregateLifecycle.apply(new OrderPlacedEvent(
                command.getOrderId(),
                command.getCustomerId(),
                command.getItems()
        ));
    }

    @EventSourcingHandler
    public void on(OrderPlacedEvent event) {
        // Reconstruct state — no business logic here, only state assignment
        this.orderId = event.getOrderId();
        this.status = OrderStatus.PLACED;
    }

    @CommandHandler
    public void handle(ConfirmOrderCommand command) {
        if (this.status != OrderStatus.PLACED) {
            throw new IllegalStateException("Can only confirm a PLACED order");
        }
        AggregateLifecycle.apply(new OrderConfirmedEvent(this.orderId));
    }

    @EventSourcingHandler
    public void on(OrderConfirmedEvent event) {
        this.status = OrderStatus.CONFIRMED;
    }
}

// Projector — the Read side
@Component
@ProcessingGroup("order-projections")
public class OrderProjector {

    private final OrderViewRepository repository;

    @EventHandler
    public void on(OrderPlacedEvent event, @Timestamp Instant timestamp) {
        repository.save(new OrderView(
                event.getOrderId(),
                event.getCustomerId(),
                OrderStatus.PLACED.name(),
                timestamp
        ));
    }

    @EventHandler
    public void on(OrderConfirmedEvent event) {
        repository.updateStatus(event.getOrderId(), OrderStatus.CONFIRMED.name());
    }
}

// Query Handler
@Component
public class OrderQueryHandler {

    private final OrderViewRepository repository;

    @QueryHandler
    public OrderView handle(FindOrderByIdQuery query) {
        return repository.findById(query.getOrderId())
                .orElseThrow(() -> new OrderNotFoundException(query.getOrderId()));
    }

    @QueryHandler
    public List<OrderView> handle(FindOrdersByCustomerQuery query) {
        return repository.findByCustomerId(query.getCustomerId());
    }
}
```

**Alternative: Spring + Kafka + Custom Implementation (without Axon):**

When you need more control or already have Kafka infrastructure, you can implement CQRS manually:

```java
// Command Handler (Write side) — uses Spring Data JPA on a normalized Write DB
@Service
@Transactional
public class OrderCommandHandler {

    @CommandHandler
    public String handle(PlaceOrderCommand command) {
        Order order = Order.place(command); // emits domain events internally
        order = orderRepository.save(order);

        // Publish domain events via Spring ApplicationEventPublisher
        order.getDomainEvents().forEach(eventPublisher::publishEvent);
        order.clearDomainEvents();

        return order.getId();
    }
}

// Kafka event relay — translates Spring domain events to Kafka
@Component
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public class DomainEventRelay {

    public void relay(DomainEvent event) {
        kafkaTemplate.send("domain-events", event.getAggregateId(), event);
    }
}

// Projector (Read side) — Kafka consumer that updates the Read DB
@Component
public class OrderProjector {

    @KafkaListener(topics = "domain-events", groupId = "order-projections")
    public void project(DomainEvent event) {
        if (event instanceof OrderPlacedEvent e) {
            readRepository.save(new OrderView(e));
        }
    }
}
```

**Event Store choices:**

| Technology | Best for | Notes |
|---|---|---|
| **EventStoreDB** | Full Event Sourcing | Purpose-built event store; native subscriptions; best DX for ES |
| **Apache Kafka** | Event bus + ES hybrid | Excellent for streaming; limited random-access by aggregate ID |
| **PostgreSQL (append-only table)** | Teams with existing Postgres | Simple, transactional; lacks native subscription; works well with Debezium CDC |
| **Apache Cassandra** | Very high write throughput | Good for time-series event data; requires careful partitioning |
| **Axon Server** | Axon Framework users | Axon's own event store; tightly integrated with the framework |

---

### 9. Observability: What to Monitor in Production

A CQRS + Event Sourcing system has several unique failure modes that standard monitoring won't catch.

**Key metrics to instrument:**

- **Projection Lag:** The time difference between when an event is written to the event store and when the corresponding Read DB projection is updated. Alert when this exceeds your SLA (e.g., > 5 seconds).
- **Dead Letter Queue (DLQ) size:** Events that failed projection after N retries land in the DLQ. A growing DLQ means your Read DB is diverging from the Write DB.
- **Event store write latency:** Slowdowns here affect command throughput.
- **Saga step completion rate:** Track how often each Saga step succeeds vs. triggers a compensating transaction.
- **Snapshot creation rate:** If snapshots stop being created, future aggregate loads will become progressively slower.

```java
// Example: Micrometer gauge for projection lag
@Component
public class ProjectionLagMonitor {

    private final MeterRegistry meterRegistry;

    @Scheduled(fixedDelay = 10_000)
    public void recordLag() {
        Instant lastEventTime = eventStore.getLatestEventTimestamp();
        Instant lastProjectedTime = projectionTracker.getLastProjectedEventTimestamp();

        long lagMillis = Duration.between(lastProjectedTime, lastEventTime).toMillis();
        meterRegistry.gauge("cqrs.projection.lag.ms", lagMillis);
    }
}
```

---

## 🎯 Interview Decision Matrix

| Scenario | Recommend CQRS? | Recommend Event Sourcing? | Reasoning |
|---|---|---|---|
| Simple CRUD App / Admin Panel | ❌ No | ❌ No | Overkill. Standard 3-tier is the right answer. |
| High Read Traffic (Social Feed) | ✅ Yes | ❌ No | CQRS allows pre-computing feeds into tailored read models. ES adds no value here. |
| Banking Ledger / Financial System | ✅ Yes | ✅ Yes | ES guarantees auditability. CQRS handles complex reporting views. |
| Healthcare Records | ⚠️ Maybe | ✅ Yes | Immutable audit trail is legally mandatory. |
| E-Commerce Order Management | ✅ Yes | ⚠️ Maybe | CQRS is a clear win. ES adds value if regulatory auditability is required. |
| Complex Domain + Many UI Views | ✅ Yes | ⚠️ Maybe | CQRS decouples the domain from the UI. Add ES if history matters. |
| Real-time Collaboration Tool | ✅ Yes | ✅ Yes | Events are the natural model; time travel enables conflict resolution. |
| IoT / Telemetry | ❌ No | ✅ Yes | Write-only event log is the right fit; CQRS overhead unnecessary. |

:::tip[Interview Phrasing for CQRS]
*"Because this system has a 100:1 read-to-write ratio and requires complex, multi-source queries to render each UI view, a standard CRUD architecture will bottleneck at the database — any read optimization (indexes, joins) directly conflicts with write normalization. I propose CQRS: we enforce business invariants against a normalized relational write model, and asynchronously project domain events via Kafka to a denormalized MongoDB collection optimized specifically for each query pattern. We must also design the UI to handle eventual consistency explicitly — I would use an optimistic UI with version polling for the most user-sensitive operations."*
:::

:::tip[Interview Phrasing for Event Sourcing]
*"This is a financial ledger — the regulatory requirement is not just 'what is the current balance' but 'prove exactly how this account reached this state.' Event Sourcing is the correct model here: the event store is the source of truth, current state is always derived by replaying events, and any new reporting requirement can be satisfied by building a new projection and replaying history. We will need to plan for schema evolution from day one and implement snapshotting to keep aggregate load times acceptable as event counts grow."*
:::

---

## 📚 Further Reading

- [Implementing Domain-Driven Design — Vaughn Vernon](https://www.oreilly.com/library/view/implementing-domain-driven-design/9780133039900/) — Essential reading for aggregate design.
- [Designing Event-Driven Systems — Ben Stopford](https://www.confluent.io/designing-event-driven-systems/) — Free ebook from Confluent; covers Kafka-based event sourcing.
- [Axon Framework Reference Guide](https://docs.axoniq.io/reference-guide/) — Canonical reference for CQRS + ES in the Spring ecosystem.
- [EventStoreDB Documentation](https://developers.eventstore.com/) — Purpose-built event store; excellent conceptual documentation.
- [Martin Fowler — CQRS](https://martinfowler.com/bliki/CQRS.html) — The original definitive article by Fowler.
- [Greg Young — CQRS Documents](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf) — Greg Young's foundational paper; still the best conceptual treatment of Event Sourcing.

## See Also
* **[Scaling Reads](./scaling-reads.md)**: Understand how CQRS and read models fit into a broader read-scaling architecture.
* **[Scaling Writes](./scaling-writes.md)**: Explore write pipeline optimization and append-only/event-sourcing models.