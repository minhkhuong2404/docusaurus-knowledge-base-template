---
id: event-driven-microservices
title: Event-Driven Microservices
sidebar_label: Event-Driven
description: In-depth guide to Event-Driven Microservices, covering domain events, choreography sagas, transactional outbox pattern, and Kafka setups.
tags: [system-design, microservices, event-driven, kafka, event-sourcing]
---

# Event-Driven Microservices

In an **Event-Driven Microservices** architecture, services communicate asynchronously by publishing and consuming events. Instead of a service blocking on a synchronous HTTP/gRPC call to another service, it emits a domain event indicating that an action has occurred, and interested services react to it.

---

## How It Works

Synchronous communication creates tight temporal coupling (Service A cannot complete its request if Service B is slow or down). Event-driven communication decouples services entirely:

```text
┌─────────────────┐             ┌──────────────┐             ┌─────────────────┐
│  Order Service  │ ───────────►│ Kafka/Rabbit │ ───────────►│Payment Service  │
│                 │ Publish:    │ Message Bus  │ Consume:    │                 │
│ Creates Order   │ "Order      │              │ "Order      │ Processes       │
│ Status: PENDING │ Created"    │              │ Created"    │ Payment         │
└─────────────────┘             └──────────────┘             └─────────────────┘
                                       │
                                       └────────────────────►┌─────────────────┐
                                                     Consume:│Inventory Service│
                                                     "Order  │                 │
                                                     Created"│ Reserves Items  │
                                                             └─────────────────┘
```

---

## Key Event-Driven Patterns

### 1. Domain Events
A **Domain Event** is a record of something significant that happened in the business domain. It should be named in the past tense (e.g., `OrderCreated`, `PaymentCaptured`, `InventoryReserved`).

### 2. Transactional Outbox Pattern
To prevent the "dual-write" problem (where database commits succeed but publishing the event to Kafka fails, or vice versa), services write the event to an `OUTBOX` database table as part of the same local ACID transaction. An independent process (e.g., Debezium CDC or a polling publisher) reads the table and forwards the events to Kafka.

```text
Local DB Transaction:
┌──────────────────────────────────────┐
│  Write to Orders Table               │
│  Write Event to Outbox Table         │
└──────────────────┬───────────────────┘
                   │ Committed atomically
                   ▼
┌──────────────────┴───────────────────┐
│ Outbox Publisher / CDC Debezium      │ ────► Publish to Kafka
└──────────────────────────────────────┘
```

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
@NoClassDefFoundError
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
