---
id: message-queues
title: Message Queues & Streaming
sidebar_label: Message Queues & Streaming
description: Guide to asynchronous messaging systems including Kafka, RabbitMQ, SQS, event sourcing, pub/sub patterns, consumer groups, ordering guarantees, and exactly-once semantics.
tags: [kafka, rabbitmq, sqs, messaging, event-driven, pub-sub, streaming, event-sourcing]
---

# Message Queues & Streaming

> Queues decouple producers from consumers, enabling **resilience**, **async processing**, and **load leveling**.

---

## Message Queue vs Event Streaming

| Feature | Message Queue (RabbitMQ, SQS) | Event Streaming (Kafka) |
|---|---|---|
| Message retention | Deleted after consumed | Retained for configurable period |
| Consumer groups | Competing consumers | Independent consumer groups |
| Ordering | Per queue (RabbitMQ) | Per partition (Kafka) |
| Replay | Not supported | Yes (seek to offset) |
| Throughput | Medium (10K–50K msg/s) | Very high (1M+ msg/s) |
| Use case | Task queues, RPC | Event sourcing, audit log, fan-out |

---

## Kafka Architecture

```
Producers → Topic (partitioned log) → Consumer Groups
                │
          Partition 0: [msg1, msg2, msg3] → Consumer A (Group 1)
          Partition 1: [msg4, msg5, msg6] → Consumer B (Group 1)
          Partition 2: [msg7, msg8, msg9] → Consumer C (Group 1)
                                         → Consumer D (Group 2) (independent offset)
```

### Key Concepts
| Concept | Meaning |
|---|---|
| **Topic** | Named stream of messages |
| **Partition** | Ordered, immutable log within a topic |
| **Offset** | Position of a message in a partition |
| **Consumer Group** | Group of consumers sharing consumption |
| **Broker** | Kafka server node |
| **Replication factor** | Number of copies of each partition |

---

## Spring Boot + Kafka

```java
// Producer
@Service
public class OrderEventProducer {
    @Autowired private KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void publishOrderPlaced(Order order) {
        OrderEvent event = new OrderEvent(order.getId(), "ORDER_PLACED", order);
        // Key = orderId → same order always goes to same partition (ordering)
        kafkaTemplate.send("order-events", order.getId().toString(), event)
            .addCallback(
                result -> log.info("Published to partition {}", result.getRecordMetadata().partition()),
                ex -> log.error("Failed to publish", ex)
            );
    }
}

// Consumer
@Component
public class OrderEventConsumer {
    @KafkaListener(
        topics = "order-events",
        groupId = "inventory-service",
        concurrency = "3"  // 3 threads = 3 partitions consumed in parallel
    )
    public void onOrderEvent(
            @Payload OrderEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment ack) {
        try {
            inventoryService.reserveForOrder(event);
            ack.acknowledge(); // Manual ack only after successful processing
        } catch (RetriableException e) {
            // Don't ack — Kafka will redeliver
            throw e;
        } catch (PermanentException e) {
            // Send to DLQ, then ack
            dlqTemplate.send("order-events-dlq", event);
            ack.acknowledge();
        }
    }
}
```

```yaml
spring:
  kafka:
    producer:
      acks: all                  # All replicas must ack
      retries: 3
      properties:
        enable.idempotence: true  # Exactly-once producer
    consumer:
      enable-auto-commit: false   # Manual commit for reliability
      auto-offset-reset: earliest
    listener:
      ack-mode: manual_immediate
```

---

## Ordering Guarantees

| Scope | Guarantee |
|---|---|
| Within a partition | Strict ordering |
| Across partitions | No ordering |
| Across topics | No ordering |

```java
// Guarantee ordering for an order's events
kafkaTemplate.send("order-events",
    orderId.toString(),  // Same key → same partition → ordered
    event
);
```

---

## Exactly-Once Semantics

| Guarantee | Risk | Implementation |
|---|---|---|
| **At-most-once** | Message loss | Fire and forget |
| **At-least-once** | Duplicate processing | Retry + idempotent consumer |
| **Exactly-once** | Complex | Kafka transactions |

```java
// Idempotent consumer (at-least-once with deduplication)
@KafkaListener(topics = "payments")
public void processPayment(PaymentEvent event) {
    if (processedEventRepository.exists(event.getEventId())) {
        log.info("Duplicate event {}, skipping", event.getEventId());
        return;
    }
    // Process and mark as processed atomically
    paymentService.process(event);
    processedEventRepository.save(new ProcessedEvent(event.getEventId()));
}
```

---

## RabbitMQ Patterns

### Work Queue (Competing Consumers)
```
Producer → Queue → Consumer A (processes 1 message at a time)
                → Consumer B (processes 1 message at a time)
```

```java
// Spring AMQP
@RabbitListener(queues = "email-queue")
public void processEmail(EmailMessage msg) {
    emailService.send(msg);
}
```

### Pub/Sub (Exchange → Multiple Queues)
```
Producer → Fanout Exchange → Queue A → Consumer A (notifications)
                           → Queue B → Consumer B (analytics)
                           → Queue C → Consumer C (audit)
```

### Dead Letter Exchange
```java
@Bean
public Queue emailQueue() {
    return QueueBuilder.durable("email-queue")
        .withArgument("x-dead-letter-exchange", "dlx")
        .withArgument("x-dead-letter-routing-key", "email-dlq")
        .withArgument("x-message-ttl", 60000)  // 60s TTL
        .build();
}
```

---

## Consumer Group Rebalancing

When consumers join/leave, Kafka redistributes partitions.

```
3 partitions, 3 consumers: each consumer owns 1 partition
Consumer C dies → rebalancing → A gets partition C's partition too
Consumer D added → rebalancing → partition redistributed

During rebalance: all consumption pauses briefly
```

**Minimize rebalance impact**:
- Use `CooperativeStickyAssignor` for incremental rebalancing
- Set `session.timeout.ms` and `heartbeat.interval.ms` appropriately
- Commit offsets frequently

---

## Backpressure in Consumers

```java
// Limit concurrent processing to avoid overwhelming downstream
@KafkaListener(
    topics = "heavy-jobs",
    containerFactory = "throttledListenerFactory"
)
public void processJob(HeavyJob job) {
    // Process
}

@Bean
public ConcurrentKafkaListenerContainerFactory<String, HeavyJob> throttledListenerFactory(
        ConsumerFactory<String, HeavyJob> cf) {
    ConcurrentKafkaListenerContainerFactory<String, HeavyJob> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(cf);
    factory.setConcurrency(2); // Only 2 concurrent consumers
    factory.getContainerProperties().setPollTimeout(3000);
    return factory;
}
```

---

## Event-Driven Architecture Patterns

### Event Notification
"Something happened" — consumer fetches full data if needed.
```json
{ "type": "order.placed", "orderId": "12345" }
```

### Event-Carried State Transfer
Event contains full state — no need to call back.
```json
{ "type": "order.placed", "orderId": "12345", "items": [...], "total": 99.99 }
```

### Event Sourcing
Events are the source of truth. See [Database Design](./database-design).

---

## Change Data Capture (CDC)

### Beginner View
CDC captures database changes and publishes them as events so other services can react without polling tables repeatedly.

```
App writes row -> DB transaction log -> CDC connector -> Kafka topic -> consumers
```

### Senior Deep Dive
Two dominant CDC styles:
- Log-based CDC (for example Debezium): low overhead, preserves commit order
- Query-based CDC: simple but expensive and can miss ordering under race conditions

Design concerns:
- Per-key ordering must align with partition key
- Schema evolution must be versioned and backward compatible
- Reprocessing requires idempotent consumers and replay-safe handlers

### Failure Modes and Recovery
- Connector lag spikes after deployment or broker incidents
- Poison events block downstream consumers
- Snapshot + streaming overlap creates duplicate events

Recovery playbook:
- Track connector lag SLO and alert thresholds
- Route malformed payloads to DLQ with schema version metadata
- Use dedup keys: `source_table + primary_key + commit_lsn`

---

## CQRS (Command Query Responsibility Segregation)

### Beginner View
CQRS separates write and read models:
- Command side validates and persists business changes
- Query side serves fast, denormalized read views

```
Command API -> write model -> domain events -> read model projector -> query API
```

### Senior Deep Dive
CQRS is most useful when:
- Read and write scaling patterns differ significantly
- You need many specialized read projections
- Domain rules are complex and must be isolated from query optimizations

Tradeoffs:
- Eventual consistency between write and read sides
- More operational components (projectors, replay tools, drift monitoring)
- Harder local debugging without good trace correlation

### Spring Projection Example
```java
@KafkaListener(topics = "order-events")
public void projectOrderEvent(OrderEvent event) {
    OrderReadModel current = readRepo.findByOrderId(event.orderId()).orElse(new OrderReadModel());

    switch (event.type()) {
        case "ORDER_PLACED" -> current.markPlaced(event.payload());
        case "PAYMENT_CAPTURED" -> current.markPaid(event.payload());
        case "ORDER_SHIPPED" -> current.markShipped(event.payload());
        default -> { return; }
    }

    readRepo.save(current);
}
```

---

## Kafka vs SQS Comparison

| Feature | Kafka | AWS SQS |
|---|---|---|
| Managed | No (self-hosted) / Confluent Cloud | Yes, fully managed |
| Replay | Yes | No (FIFO queue, deleted on consume) |
| Ordering | Per partition | FIFO queue only |
| Retention | Days–forever | Up to 14 days |
| Max message size | 1 MB (default) | 256 KB |
| Fan-out | Topics + consumer groups | SNS → multiple SQS queues |
| Use case | Event log, streaming | Simple task queues |

---

## Interview Questions

### Q: What is the difference between Kafka and RabbitMQ? When would you choose each?

**A:** Kafka is a distributed log optimized for high-throughput replayable streams; RabbitMQ is a broker optimized for flexible routing and work queues. Choose Kafka for event streaming/analytics and RabbitMQ for low-latency task dispatch patterns.

### Q: How does Kafka guarantee ordering of messages?

**A:** Kafka preserves order only within a partition. To keep order for an entity, route all related events with the same key to one partition.

### Q: What is a consumer group in Kafka and how does it enable parallelism?

**A:** A consumer group shares a topic where each partition is assigned to one consumer instance in that group. This enables horizontal parallelism up to partition count.

### Q: What is the difference between at-most-once, at-least-once, and exactly-once delivery?

**A:** At-most-once can lose messages, at-least-once can duplicate, and exactly-once avoids duplicates within defined boundaries. In practice, most systems combine at-least-once with idempotent processing.

### Q: How do you implement an idempotent consumer?

**A:** Use a deterministic message ID and record processed IDs in durable storage with uniqueness constraints. If the ID already exists, skip side effects and ack safely.

### Q: What happens during a Kafka consumer group rebalance?

**A:** Partition ownership is revoked and reassigned when members join/leave or topic partitions change. Consumers pause processing briefly, so cooperative rebalancing and static membership reduce disruption.

### Q: How would you design a fan-out system where one event needs to trigger 5 different services?

**A:** Publish one domain event to a topic and let each service consume independently with its own group. Use schema versioning and DLQs per consumer for isolated failure handling.

### Q: What is the transactional outbox pattern and why is it needed with Kafka?

**A:** Outbox writes domain change and event record in one DB transaction, then a relay publishes events to Kafka. It prevents dual-write inconsistencies between DB commit and broker publish.

### Q: How do you handle poison pill messages (messages that always fail)?

**A:** Retry with bounded attempts/backoff, then move to DLQ including failure context. Provide replay tooling after code/data fixes.

### Q: How does Kafka's retention and replay capability enable event sourcing?

**A:** Retained immutable events can be replayed to rebuild projections or recover consumers. This supports auditability and reprocessing after schema/logic changes.

