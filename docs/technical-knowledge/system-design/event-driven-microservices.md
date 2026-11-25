---
id: event-driven-microservices
title: Event-Driven Microservices
sidebar_label: Event-Driven
description: In-depth guide to Event-Driven Microservices, covering domain events, event types (notification vs carried-state vs sourcing), choreography sagas, transactional outbox pattern, schema evolution, ordering, idempotency, and Kafka setups.
tags: [system-design, microservices, event-driven, kafka, event-sourcing]
---

import EventDrivenMicroservicesDiagram from '@site/src/components/EventDrivenMicroservicesDiagram';

# Event-Driven Microservices

In an **Event-Driven Microservices** architecture, services communicate asynchronously by publishing and consuming events. Instead of a service blocking on a synchronous HTTP/gRPC call to another service, it emits a domain event indicating that an action has occurred, and interested services react to it.

---

## How It Works

Synchronous communication creates tight temporal coupling (Service A cannot complete its request if Service B is slow or down). Event-driven communication decouples services entirely:

<EventDrivenMicroservicesDiagram initialTab="async_flow" />

---

## Key Event-Driven Patterns

### 1. Domain Events
A **Domain Event** is a record of something significant that happened in the business domain. It should be named in the past tense (e.g., `OrderCreated`, `PaymentCaptured`, `InventoryReserved`).

### 2. Three Styles of Event, and Why the Difference Matters

Not all "events" carry the same amount of information, and picking the wrong style is one of the most consequential early architecture decisions in an event-driven system:

| Style | What It Carries | Trade-off |
| :--- | :--- | :--- |
| **Event Notification** (thin) | Just the fact + identifiers — `{"orderId": "ord_101"}` | Small, cheap, low coupling to payload shape — but every consumer must call back to the source service for details, reintroducing synchronous coupling and load on the source |
| **Event-Carried State Transfer** (fat) | The fact plus enough data for consumers to act without a callback — `{"orderId": "ord_101", "customerId": "cus_5", "total": 99.00, "items": [...]}` | Consumers stay fully decoupled at runtime, but the event schema now encodes a data contract that must be versioned carefully, and payload growth over time is easy to lose track of |
| **Event Sourcing** | The event *is* the only source of truth — entity state is derived by replaying its full event history, not stored as a row that gets overwritten | Full audit trail and point-in-time replay for free, but requires snapshotting for performance at scale and is a much bigger architectural commitment than the other two — don't reach for it just because you're already using events |

<EventDrivenMicroservicesDiagram initialTab="event_styles" />

Most microservice systems default to **event-carried state transfer** for the common case (it's what the `OrderCreatedEvent` example below is), reserving thin **notification-style** events for cases where the payload would be large or sensitive and a callback is acceptable, and reserving full **event sourcing** for aggregates where the audit trail itself is a first-class business requirement (e.g., a ledger).

### 3. Transactional Outbox Pattern
To prevent the "dual-write" problem (where database commits succeed but publishing the event to Kafka fails, or vice versa), services write the event to an `OUTBOX` database table as part of the same local ACID transaction. An independent process (e.g., Debezium CDC or a polling publisher) reads the table and forwards the events to Kafka.

<EventDrivenMicroservicesDiagram initialTab="outbox_cdc" />

---

## Setup & Implementation

### Emitting Domain Events with Spring Data (Java)

Spring Data provides `AbstractAggregateRoot` to automatically harvest and publish domain events when a database entity is saved.

#### 1. Define the Domain Event
```java
public record OrderCreatedEvent(Long orderId, String customerId, BigDecimal amount) {}
```

#### 2. Register Events in the Aggregate Root
```java
@Entity
@Table(name = "orders")
@Getter
public class Order extends AbstractAggregateRoot<Order> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String customerId;
    private BigDecimal amount;
    private String status;

    public Order(String customerId, BigDecimal amount) {
        this.customerId = customerId;
        this.amount = amount;
        this.status = "CREATED";
        
        // Register the event to be published by Spring Data on repository.save()
        registerEvent(new OrderCreatedEvent(this.id, this.customerId, this.amount));
    }
}
```

#### 3. Listen and Forward to Kafka
Create an application event listener to pick up local Spring events and forward them to a distributed message bus like Kafka:

```java
@Component
@Slf4j
public class OrderEventListener {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventListener(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Order transaction committed. Shipping event to Kafka for Order: {}", event.orderId());
        
        // Send to Kafka topic
        kafkaTemplate.send("orders.created", String.valueOf(event.orderId()), event);
    }
}
```

> [!WARNING]
> `@TransactionalEventListener(phase = AFTER_COMMIT)` firing does **not** guarantee the Kafka send itself succeeds — if the JVM crashes or the broker is unreachable between the DB commit and `kafkaTemplate.send()` completing, the event is lost even though the order was created. This in-process listener pattern is a reasonable starting point for low-stakes events, but it is *not* the same guarantee as the Transactional Outbox pattern above — for anything where a lost event is a real business problem (payments, inventory), write to an outbox table in the same transaction as the domain write instead of publishing directly from a post-commit listener.

### Message Key Selection and Ordering

Kafka only guarantees ordering *within a partition*, and partition assignment is determined by the record key — so key selection is a design decision, not an implementation detail:

```java
// ❌ No key (or a random key) — records for the same order can land on
// different partitions and be processed out of order by different consumers
kafkaTemplate.send("orders.created", event);

// ✅ Keying by orderId guarantees every event about THIS order (created,
// updated, cancelled) is processed in emission order by the same consumer
kafkaTemplate.send("orders.created", String.valueOf(event.orderId()), event);
```

This matters most when multiple event *types* for the same entity share a topic — `OrderCreated` and `OrderCancelled` arriving out of order at a consumer would apply the cancellation before the creation exists, corrupting downstream state. Keying by aggregate ID is the standard fix; it does not help across different entities, and it does not help across topics (an `OrderCreated` on one topic and an `InventoryReserved` on another have no ordering relationship at all — see the Saga guide for how choreography handles this).

---

## Schema Evolution and the Anti-Corruption Boundary

An event's payload is a public contract the moment a second service consumes it — changing its shape is effectively an API break, just a much harder one to detect at compile time since there's no shared interface. Two practices keep this from becoming a production incident:

- **Additive-only evolution as the default rule**: add new optional fields, never remove or repurpose existing ones, and never change a field's type in place — this mirrors Kafka schema registry's `BACKWARD` compatibility mode (see the Deployment Configuration Verification guide) and lets old and new consumers coexist during a rolling deploy.
- **Don't leak internal domain models directly onto the wire**: mapping your JPA entity straight to the event payload means every internal refactor becomes a wire-format change other teams depend on. A dedicated event DTO, versioned independently of the internal `Order` entity, is the anti-corruption boundary that keeps those concerns separate.

```java
// ❌ Publishing the JPA entity directly couples every consumer to internal refactors
kafkaTemplate.send("orders.created", orderRepository.save(order)); // entity, not a contract

// ✅ A dedicated, explicitly versioned event contract
public record OrderCreatedEventV1(Long orderId, String customerId, BigDecimal amount, Instant occurredAt) {}
```

---

## Idempotent Consumers

Because event-driven systems are built on at-least-once delivery (see the companion [Deduplication in Distributed Messaging](../kafka/advanced/exactly-once-vs-dedup.md) guide for the full treatment), every consumer must treat redelivery as a normal, expected case rather than an edge case:

```java
@KafkaListener(topics = "orders.created", groupId = "payment-service")
@Transactional
public void onOrderCreated(OrderCreatedEventV1 event) {
    try {
        // UNIQUE constraint on event_id makes a genuine duplicate throw here,
        // not silently double-process
        processedEventRepository.save(new ProcessedEvent(event.orderId()));
    } catch (DataIntegrityViolationException e) {
        log.debug("Duplicate OrderCreated event suppressed: {}", event.orderId());
        return;
    }
    paymentService.initiateCharge(event.orderId(), event.amount());
}
```

For the full pattern set — TOCTOU races, Redis vs. database-backed dedup, idempotency key design — see the dedicated [Deduplication Guide](../kafka/advanced/exactly-once-vs-dedup.md); this section is deliberately the minimal baseline every event consumer needs, not the complete treatment.

---

## Dead Letter Queues and Poison Pill Handling

A single malformed or unprocessable event (a "poison pill") must not be allowed to block an entire partition's consumer indefinitely. Spring Kafka's error handling wires this up declaratively:

```java
@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> kafkaTemplate) {
    // After 3 retries with backoff, route the failing record to a dead-letter topic
    // instead of blocking the partition on an unprocessable message forever
    var recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
            (record, ex) -> new TopicPartition(record.topic() + ".dlt", record.partition()));

    var backOff = new ExponentialBackOff(1000L, 2.0);
    backOff.setMaxInterval(30_000L);

    DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backOff);
    // Some exceptions are never worth retrying (bad payload) — fail fast to the DLT
    handler.addNotRetryableExceptions(DeserializationException.class);
    return handler;
}
```

A DLQ without a triage process is just a graveyard — pair it with alerting on DLT topic depth and a documented replay procedure (fix the root cause, then republish from the DLT back to the original topic) rather than letting failed events accumulate silently.

---

## Consumer Group Scaling

Kafka consumer parallelism is bounded by partition count: a consumer group can have at most as many *active* consumers as the topic has partitions — additional consumers beyond that sit idle. This is a capacity planning input, not just a runtime detail:

<EventDrivenMicroservicesDiagram initialTab="partition_scaling" />

Partition count is also expensive to plan around after the fact — increasing it later changes key-to-partition hashing for keys going forward (breaking the ordering guarantee above for existing in-flight aggregates), so size it for a reasonable multiple of your expected peak consumer instance count up front rather than growing it reactively.

---

## Observability: Correlation Across Async Boundaries

Once a request becomes an asynchronous chain of events across several services, "where did this request go and why did it fail" stops being answerable from any single service's logs. Two practices make it answerable again:

- **Propagate a correlation ID through every event**, distinct from Kafka's own message key, so a single ID traces a business flow (e.g., a checkout) across every event it produced or triggered — even when those events span multiple topics with unrelated partition keys.
- **Instrument consumer lag, not just error rate.** A consumer that's silently falling behind (growing lag on its consumer group) is a leading indicator of an incident — a slow downstream dependency, a poison pill retry loop — that shows up in lag minutes before it shows up as a customer-visible symptom. See the companion [Distributed Tracing](./distributed-tracing.md) guide for wiring trace context through Kafka headers so a correlation ID and a full span waterfall are available together.

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Loose Runtime Coupling**: Emitting services do not need to know which or how many services react to their events. | **Eventual Consistency**: Data is not updated instantly across all services, leading to lag and race conditions. |
| **High Availability**: If the Payment Service is down, the Order Service can still accept orders; events queue up in Kafka. | **Complex Debugging**: Tracking a request's flow through asynchronous message queues is difficult without tracing. |
| **Scale & Performance**: Writes are fast because slow operations are offloaded asynchronously. | **Idempotency Requirement**: Consumers must be fully idempotent, as network glitches can cause duplicate events. |

---

## Common Gotchas & Anti-Patterns

1. **Missing Idempotency Control**: Failing to check for duplicate messages at the consumer. If Kafka retries a write, the Payment Service could charge the customer twice. 
   - *Solution*: Maintain an `idempotency_key` or `event_id` in the database and block processed keys.
2. **Synchronous REST calls inside Event Handlers**: If a consumer receives an event from Kafka and immediately blocks on a synchronous REST call to another service, you lose the scale and resilience benefits.
3. **Database Polling Overhead**: Running `SELECT * FROM OUTBOX` every 50ms using a cron job. This creates database lock contention. Use Log-based Change Data Capture (CDC) like Debezium instead.
4. **Publishing internal entities as events**: Serializing a JPA entity directly onto the wire means every internal refactor becomes an accidental breaking change for every downstream consumer. Use a dedicated, versioned event DTO.
5. **No key, or the wrong key, on the record**: Letting related events for the same aggregate land on different partitions silently breaks the "consumer processes events in order" assumption most business logic implicitly relies on.
6. **No dead-letter path**: A single unprocessable message retried forever blocks every other message behind it on that partition — treat DLQ + alerting as a required piece of any consumer, not an optional hardening step.
7. **Assuming `AFTER_COMMIT` listener publishing is as safe as the outbox pattern**: it isn't — see the warning in the Setup section above. A crash between DB commit and the Kafka send is a silent lost event with this approach.

---

## Related Pages

- [Deduplication in Distributed Messaging (State Store vs Redis)](../kafka/advanced/exactly-once-vs-dedup.md)
- [Transactional Outbox Pattern](./outbox-pattern.md)
- [Saga Pattern (Choreography vs Orchestration)](./saga-pattern.md)
- [Distributed Tracing](./distributed-tracing.md)
- [Kafka Exactly-Once Semantics](../kafka/advanced/exactly-once.md)
- [Kafka Consumer Lag & DLQ Patterns](../kafka/consumer/consumer-lag.md)
- [Deployment Configuration & Infrastructure Verification](../../non-technical-knowledge/sdlc/deployment/deployment-configuration-verification.md)

---

## 🔬 Deep Dive: Production Event-Driven Architecture (EDA)

> **Reference**: [Sujeet Pro — Event-Driven Architecture](https://sujeet.pro/articles/event-driven-architecture)

### 1. Event Notification vs. Event-Carried State Transfer (ECST) vs. Event Sourcing + CQRS

Martin Fowler and production EDA practitioners distinguish three fundamentally different patterns that are often conflated under the single label "Event-Driven":

| Pattern | Payload Semantics | Source-of-Truth Location | Runtime Coupling | Failure & Operational Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Event Notification** | Minimal pointer (`{"eventId": "e1", "orderId": "ord_99", "type": "OrderPlaced"}`) | Upstream producer DB | **High on read**: Consumer must issue synchronous `GET /orders/ord_99` back to producer | Thundering herd on producer API when 15 downstream consumer groups process a burst simultaneously |
| **Event-Carried State Transfer (ECST)** | Full state snapshot or delta (`{"orderId": "ord_99", "items": [...], "total": 149.00, "version": 4}`) | Producer DB (replicated into local read-optimized caches/tables in each consumer) | **Zero runtime read coupling**: Consumers query their own local replica | Schema evolution rigor required; storage duplication across bounded contexts; eventual consistency lag |
| **Event Sourcing + CQRS** | Immutable domain events (`OrderCreated`, `ItemAdded`, `OrderPaid`) *are* the primary database | Append-only Event Store (e.g., EventStoreDB, Kafka + PostgreSQL journal) | **Decoupled Write & Read Models** via asynchronous Projectors | Requires **Snapshotting** (every $N$ events), **Upcasters** for historical schema migration, and projector lag handling |

#### Event Sourcing Snapshot & Upcasting Mechanics
When an aggregate (e.g., a high-frequency merchant ledger account) accumulates $50,000$ events, replaying from offset $0$ on every command violates latency SLOs:
- **Snapshotting**: Periodically persist a materialized checkpoint `(aggregate_id, version = 50000, state_json)` so command handlers load the latest snapshot and replay only the $\Delta$ events where `version > 50000`.
- **Event Upcasting**: Because stored events are immutable, when `OrderPlacedV1` evolves to `OrderPlacedV2` (e.g., splitting `customerName` into `firstName` and `lastName`), registered **Upcasters** transform old serialized payloads in-memory during replay before handing them to the domain aggregate.

---

### 2. Distributed Sagas: Choreography vs. Orchestration

When a business transaction spans multiple microservices (e.g., `Order Service` $\rightarrow$ `Payment Service` $\rightarrow$ `Inventory Service` $\rightarrow$ `Shipping Service`), Two-Phase Commit (2PC) is rejected because holding cross-service database row locks across network boundaries destroys availability. Instead, we use a **Saga**—a sequence of local transactions coordinated by asynchronous events, paired with **Compensating Transactions** for backward recovery:

| Dimension | Saga Choreography (Decentralized Events) | Saga Orchestration (Centralized State Machine) |
| :--- | :--- | :--- |
| **Coordination Mechanism** | Services react to domain events (`OrderCreated` $\rightarrow$ `PaymentCharged` $\rightarrow$ `StockReserved`) with no central controller | A dedicated orchestrator (e.g., Temporal, Camunda, AWS Step Functions, or Spring StateMachine) issues commands (`ChargeCardCommand`) and awaits replies |
| **When to Use** | 2–3 loosely coupled services where downstream side-effects are naturally reactive (notifications, analytics, simple workflows) | 4+ steps, branching workflows, cyclic dependencies, timeouts, or human-in-the-loop approvals |
| **Failure & Rollback Visibility** | **Hard**: Compensation chains (`StockFailed` $\rightarrow$ `RefundPayment` $\rightarrow$ `CancelOrder`) are scattered across N codebases; risk of cyclic event loops | **Explicit**: The orchestrator persists the exact state machine step, manages step timeouts, and triggers compensations in deterministic reverse order |
| **ACID Gap (Lack of Isolation)** | **Dirty Reads / Lost Updates**: Because Saga steps commit locally before the whole Saga finishes, intermediate state is visible to other transactions | Mitigated via **Semantic Locks** (marking state as `PENDING_APPROVAL` / reserving quota in an escrow column until the Saga completes) |

---

### 3. The Dual-Write Problem & Transactional Outbox + CDC (Debezium)

Never execute a local database commit and a message broker publish as two separate network calls in application code:

```
❌ Dual-Write Race Conditions:
Case A: db.commit() succeeds ──► JVM crashes before kafka.send() ──► DB updated, downstream never notified!
Case B: kafka.send() succeeds ──► db.commit() fails (constraint violation) ──► Ghost event published for non-existent DB row!
```

#### Production Solution: Transactional Outbox + Log-Based CDC
1. **Atomic Local Write**: Within the same relational ACID transaction (`BEGIN ... COMMIT`), insert/update the domain entity in `orders` AND insert a serialized event row into `outbox_events`:
   ```sql
   CREATE TABLE outbox_events (
       id UUID PRIMARY KEY,
       aggregate_type VARCHAR(64) NOT NULL,  -- e.g., 'Order'
       aggregate_id VARCHAR(64) NOT NULL,    -- Partition key: e.g., 'ord_101'
       event_type VARCHAR(64) NOT NULL,      -- e.g., 'OrderCreated.v1'
       payload JSONB NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
2. **Log-Based CDC Relay (Debezium)**: Instead of polling `SELECT * FROM outbox_events` (which adds CPU/IOPS load on the primary DB), **Debezium** tails PostgreSQL's Write-Ahead Log (`pgoutput` logical replication slot) or MySQL's `binlog`. Using the `EventRouter` Single Message Transform (SMT), Debezium routes each `INSERT` on `outbox_events` to topic `orders.events` using `aggregate_id` as the Kafka message key.
3. **Outbox Table Hygiene**: Because Debezium reads the WAL directly rather than the table heap, you can even delete or partition-drop `outbox_events` immediately after insertion (or run `DELETE` right after `INSERT` in the same transaction!) while still capturing the `INSERT` record in the WAL stream.

---

### 4. Schema Evolution & Schema Registry (Avro / Protobuf Compatibility Modes)

In an Event-Carried State Transfer architecture,producers and consumers deploy independently. A **Schema Registry** (Confluent Schema Registry / Apicurio) enforces wire-level compatibility before a producer is allowed to publish:

```
┌──────────────────┬─────────────────────────────┬─────────────────────────────┬───────────────────────────────────────────┐
│ Mode             │ Allowed Schema Changes      │ Upgrade Order               │ Production Use Case                       │
├──────────────────┼─────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────┤
│ BACKWARD         │ Delete fields; add optional │ Upgrade CONSUMERS first,    │ Standard default; allows consumers to     │
│ (Default)        │ fields with defaults        │ then PRODUCERS              │ rewind and replay historical Kafka logs   │
├──────────────────┼─────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────┤
│ FORWARD          │ Add fields; delete optional │ Upgrade PRODUCERS first,    │ Producer teams deploy rapidly without     │
│                  │ fields with defaults        │ then CONSUMERS              │ waiting for 20 downstream teams           │
├──────────────────┼─────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────┤
│ FULL             │ Only add/delete optional    │ Deploy producers &          │ Zero-coordination independent deployments │
│ (Backward+Fwd)   │ fields with default values  │ consumers in any order      │ across multi-team enterprise event buses  │
└──────────────────┴─────────────────────────────┴─────────────────────────────┴───────────────────────────────────────────┘
```

#### Wire-Format Frame Layout
Instead of embedding a 2 KB JSON schema in every message, the Confluent wire format prepends a **5-byte header** to the compact binary Avro/Protobuf payload:
- `Byte 0`: Magic byte (`0x00`)
- `Bytes 1–4`: 4-byte big-endian **Schema ID** (`int32`), which consumers cache locally after a single lookup to the Schema Registry.

---

### 5. Out-of-Order Event Handling & Version Watermarks

Even when partitioning by `aggregate_id`, out-of-order events still occur in production when:
- Events originate from **different topics** (e.g., `PaymentCaptured` arrives before `OrderCreated` due to thread scheduling or retry queues).
- A producer retries without `max.in.flight.requests.per.connection <= 5` and `enable.idempotence=true`.
- A multi-region active-active replication bridge merges streams asynchronously.

#### Pattern 1: Monotonic Entity Version Guard (Optimistic Concurrency on ECST)
Every state-transfer event carries the aggregate's monotonic `entity_version`:
```java
@Transactional
public void applyOrderStateTransfer(OrderStateEvent event) {
    // Only apply if incoming version is strictly newer than local projection version
    int updatedRows = jdbcTemplate.update("""
        INSERT INTO order_projections (order_id, status, amount, entity_version)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (order_id) DO UPDATE
           SET status = EXCLUDED.status,
               amount = EXCLUDED.amount,
               entity_version = EXCLUDED.entity_version
         WHERE order_projections.entity_version < EXCLUDED.entity_version
        """,
        event.orderId(), event.status(), event.amount(), event.entityVersion()
    );

    if (updatedRows == 0) {
        log.info("Ignored stale/duplicate out-of-order event for order {} at version {}",
                 event.orderId(), event.entityVersion());
    }
}
```

#### Pattern 2: Tombstone / Upsert Pre-Creation for Cross-Topic Reordering
If `PaymentCaptured(orderId=99)` arrives at a projection service before `OrderCreated(orderId=99)`, instead of throwing `OrderNotFoundException` and triggering a retry storm, insert a **partial placeholder row** `(order_id=99, payment_status='CAPTURED', order_status='AWAITING_CREATION')`. When `OrderCreated(orderId=99)` arrives milliseconds later, merge the creation attributes into row `99` and transition the state.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Event-Driven Architecture Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

- **State Non-Negotiable Invariants Upfront**: Clarify **why** an boundary is asynchronous: are we decoupling availability domains (Order placement must succeed even if Notification/Analytics is down), absorbing bursty write amplification, or maintaining materialized read projections (CQRS)? Never use async events when the caller requires a synchronous confirmation of a business invariant (e.g., checking user authentication or immediate balance reservation).
- **Back-of-the-Envelope Capacity & Hardware Physics**: Quantify the fan-out amplification factor. If 1 user checkout emits 1 `OrderPlaced` event consumed by 8 independent microservice consumer groups, 10,000 checkouts/sec equals 10,000 broker writes/sec (absorbed in OS page cache) and 80,000 sequential zero-copy `sendfile()` reads/sec—compared to 80,000 synchronous RPC calls that would create a $1 - (0.999)^8 \approx 0.8\%$ cascading failure rate even if every service has $99.9\%$ uptime.
- **Proactive Failure-Mode Identification**: Immediately address the **Dual-Write Problem** (mandating Transactional Outbox + CDC), **Saga Lack of Isolation** (semantic locks + idempotent compensations), **Out-of-Order Delivery** (monotonic aggregate version numbers), and **Eventual Consistency UX** (optimistic UI updates, WebSockets/SSE push, or Read-Your-Own-Writes session tokens).
- **Day-2 Operational Realism**: Highlight W3C `traceparent` header propagation across Kafka/RabbitMQ boundaries, consumer lag SLO alerting, Schema Registry `FULL` compatibility gates in CI/CD, and DLQ replay tooling.

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "We wrapped our `orderRepository.save(order)` and `kafkaTemplate.send(...)` inside a `@Transactional` method in Spring Boot. Doesn't that prevent lost or ghost events?"
* **Junior/Mid Answer:** *"Yes, if `kafkaTemplate.send()` throws an exception, `@Transactional` rolls back the database transaction so they stay in sync."*
* **Principal Rebuttal:**
  > *"That is the classic Dual-Write trap. PostgreSQL and Kafka do not share a distributed XA transaction coordinator. Consider two fatal windows: (1) `kafkaTemplate.send()` succeeds inside the method, and 2ms later the database `COMMIT` fails due to a deferred foreign-key constraint or network drop—downstream services just received an `OrderCreated` event for an order that was rolled back! (2) Even if you move `kafkaTemplate.send()` into `@TransactionalEventListener(phase = AFTER_COMMIT)`, if the pod OOMs or gets SIGKILLed 1ms after DB commit before the Kafka batch flushes, the order is persisted in the DB and the event is lost forever. You must write the event to an `outbox` table in the exact same local DB transaction and stream it via Debezium CDC."*

#### Trap 2: "We have 6 microservices in our checkout flow. Should we use Saga Choreography so there is no single point of failure?"
* **Junior/Mid Answer:** *"Yes, Choreography is better because there is no central orchestrator bottleneck, making the system more decoupled."*
* **Principal Rebuttal:**
  > *"Past 3 to 4 steps, Saga Choreography degrades into a distributed 'pinball machine' where no single service understands the end-to-end workflow state. When step 5 (`CustomsClearanceService`) fails, triggering a cascading chain of compensating events back through `Shipping` $\rightarrow$ `Inventory` $\rightarrow$ `Payment` $\rightarrow$ `LoyaltyPoints` $\rightarrow$ `Order`, debugging timeouts or partial compensation failures across 6 repositories becomes an operational nightmare, and cyclic event dependencies frequently emerge. For 4+ step workflows with branching compensations, a fault-tolerant **Saga Orchestrator** (e.g., Temporal or an event-backed state machine) is vastly superior—and because the orchestrator persists its workflow state in a replicated store/Kafka log, it is not a single point of failure."*

#### Trap 3: "Since we're building an Event-Driven Architecture, should we use Event Sourcing for all our microservices?"
* **Junior/Mid Answer:** *"Yes, storing all changes as immutable events gives us a complete history and lets us rebuild state anytime."*
* **Principal Rebuttal:**
  > *"Event-Driven Architecture and Event Sourcing are orthogonal concepts. Using Event-Carried State Transfer over Kafka between microservices does NOT require storing entities as event streams inside each service's database. Full Event Sourcing introduces steep accidental complexity: snapshot management, event schema upcasters for 5-year-old immutable payloads, eventual consistency between command and query projections, and GDPR 'Right to be Forgotten' challenges ( requiring crypto-shredding per user key). Reserve Event Sourcing strictly for domains where the immutable audit log and temporal queries are core business invariants—such as double-entry financial ledgers, accounting, or collaborative version histories."*

#### Trap 4: "What happens in a Saga when User A starts cancelling an order at the exact same moment the Payment Service finishes charging their card?"
* **Junior/Mid Answer:** *"The `OrderCancelled` event will trigger a refund in the Payment Service."*
* **Principal Rebuttal:**
  > *"Because Sagas lack the 'I' (Isolation) in ACID—operating as ACD—concurrent Sagas on the same aggregate suffer from **Lost Updates** and **Dirty Reads**. If `CancelOrder` runs before `ChargeCard` completes, `RefundPayment` might arrive at the Payment Service *before* the original `ChargeCard` request finishes, failing as 'No charge found', followed 50ms later by `ChargeCard` succeeding and leaving the customer charged for a cancelled order! To solve this, every compensating and forward action must be **commutative** or guarded by a **Semantic Lock / Tombstone State** in the Payment Service: when `RefundPayment(orderId=99)` arrives first, it creates a `CANCELLED_TOMBSTONE` record for `orderId=99`; when the delayed `ChargeCard(orderId=99)` arrives, it sees the tombstone and immediately aborts or auto-refunds."*

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Event Payload Design** | *"Just serialize the Order JSON object and publish it to Kafka."* | *"Never leak internal JPA entities onto the wire; publish an explicitly versioned DTO under Schema Registry `FULL` compatibility, choosing intentionally between thin Event Notification and fat ECST."* |
| **DB + Broker Atomicity** | *"Publish to Kafka inside the database transaction or right after `save()`."* | *"Eliminate dual-write race conditions using a Transactional Outbox table in the same local ACID commit, tailed asynchronously via Debezium WAL CDC."* |
| **Distributed Transactions** | *"Use Two-Phase Commit (2PC) or just publish events between services."* | *"Use Orchestrated Sagas for complex multi-step mutations with semantic locks, idempotent forward retries, and commutative compensating transactions that handle out-of-order cancellation races."* |
| **Out-of-Order Events** | *"Kafka guarantees order so events never arrive out of order."* | *"Cross-topic streams and multi-source retries violate ordering; guard all downstream state projections with monotonic `entity_version` comparisons (`WHERE version < incoming_version`)."* |
| **Eventual Consistency UX** | *"The user refreshes the page after a few seconds to see the update."* | *"Return `202 Accepted` with a correlation token, optimistically update client state, or bind a `last_write_lsn` / session sticky cache to provide Read-Your-Own-Writes consistency."* |
