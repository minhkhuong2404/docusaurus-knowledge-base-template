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
- [Kafka Exactly-Once Semantics](../kafka/advanced/kafka-exactly-once.md)
- [Kafka Consumer Lag & DLQ Patterns](../kafka/consumer/consumer-lag.md)
- [Deployment Configuration & Infrastructure Verification](../../non-technical-knowledge/sdlc/deployment/deployment-configuration-verification.md)