---
id: message-queues
title: Message Queues & Streaming
sidebar_label: Message Queues
description: Guide to asynchronous messaging systems including Kafka, RabbitMQ, SQS, event sourcing, pub/sub patterns, consumer groups, ordering guarantees, and exactly-once semantics.
tags: [kafka, rabbitmq, sqs, messaging, event-driven, pub-sub, streaming, event-sourcing]
---

import MessageQueueArchDiagram from '@site/src/components/MessageQueueArchDiagram';

# Message Queues: Comprehensive System Design Guide

Message queues are the foundational buffer of distributed systems. They sit between the services that *create* work and the services that *perform* work, ensuring that traffic spikes, hardware failures, and slow processing don't bring down your application.

---

## 🟢 For New Learners: The Fundamentals

### What is a Message Queue?

A message queue is a component that enables asynchronous communication between different services. It acts as a buffer that temporarily stores messages until they are processed by consumers.

**Key Benefits:**
- **Decoupling:** Producers don't need to know about consumers.
- **Resilience:** Temporary failures don't cause data loss.
- **Load Leveling:** Spikes in traffic are smoothed out (load leveling).
- **Scalability:** Consumers can scale independently.

---

### The Synchronous Trap (Without a Queue)

Imagine you are building a photo-sharing app like Instagram. When a user uploads a photo, your server must resize it, apply filters, and run an AI moderation check.

In a **synchronous** architecture, the Web Server handles the upload and does all the processing itself before responding to the user.

**Problems:**
1. **Latency:** The user hits "Upload" and stares at a loading spinner for 6 seconds. This is a terrible user experience.
2. **Fragility:** If the content moderation service crashes at second 5, the entire upload fails. The user gets a "Failed to Upload" error and has to start over.
3. **Bursty Traffic Meltdown:** If your app goes viral, uploads spike from 50 per second to 50,000 per second. Your Web Servers exhaust their CPU trying to resize images, causing them to drop requests entirely. The system crashes.

---

### The Asynchronous Solution (With a Queue)

By introducing a Message Queue, we separate the "Upload" from the "Processing."

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Producer  │ ───▶ │    Queue    │ ───▶ │   Consumer  │
│  (Web App)  │      │   (Buffer)  │      │  (Worker)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

**How it works:**
1. **The Producer (Web Server):** The user uploads the photo. The Web Server saves the raw file to a database, writes a tiny text message to the Queue ("Photo 456 needs processing"), and *immediately* returns a "Success!" screen to the user (takes 0.1 seconds).
2. **The Queue:** A storage buffer that safely holds the message "Photo 456 needs processing".
3. **The Consumer (Worker Server):** A completely separate background server pulls the message off the Queue and spends 6 seconds resizing the image and running moderation.

**The Kitchen Analogy:**
A queue works exactly like a restaurant kitchen. The **Waiter (Producer)** takes your order, puts it on the **Ticket Rail (Queue)**, and immediately goes to serve another table. The **Cook (Consumer)** pulls the ticket off the rail when they have an open stove.

---

### The Hidden Benefit: Hardware Decoupling

Because the Producers and Consumers are decoupled, you can optimize their hardware independently.

- **Web Servers (Producers):** Cheap, lightweight machines to accept incoming HTTP requests.
- **Workers (Consumers):** Expensive, high-memory GPU instances for image processing.

You only pay for the heavy hardware where you actually need it.

---

### Message Queue vs Event Streaming

| Feature | Message Queue (RabbitMQ, SQS) | Event Streaming (Kafka) |
| :--- | :--- | :--- |
| **Message retention** | Deleted after consumed | Retained for configurable period |
| **Consumer groups** | Competing consumers | Independent consumer groups |
| **Ordering** | Per queue (RabbitMQ) | Per partition (Kafka) |
| **Replay** | Not supported | Yes (seek to offset) |
| **Throughput** | Medium (10K–50K msg/s) | Very high (1M+ msg/s) |
| **Latency** | 1-5ms | 5-50ms |
| **Use case** | Task queues, RPC | Event sourcing, audit log, fan-out |

---

## 🔵 For Seniors: Internal Architecture & Deep Dive

### How Message Queues Work Internally

#### 1. Storage Mechanisms

**In-Memory Queues (Redis, RabbitMQ):**
- Messages stored in RAM for ultra-low latency.
- Risk of data loss on crash unless persistence is enabled.
- Best for: High-throughput, low-value data.

**Disk-Based Queues (Kafka, SQS):**
- Messages written to disk for durability.
- Can survive broker failures.
- Best for: Critical business data, audit trails.

**Hybrid Approaches:**
- Write-ahead logs (WAL) for durability.
- In-memory caching for performance.
- Example: RabbitMQ with disk persistence.

---

#### 2. The Duplicate Worker Problem (Concurrency Guardrails)

If you have 10 Worker servers listening to one Queue, what stops Worker A and Worker B from grabbing the *exact same message* at the same time?

**Different technologies solve this differently:**

**Amazon SQS (Visibility Timeout):**
<MessageQueueArchDiagram defaultTab="PREVENTION" />
Kafka prevents competition entirely. Since Worker A is the *only* server allowed to read Partition 1, duplicate reading is structurally impossible.

---

#### 3. Acknowledgements (ACKs) & Idempotency

Queues do not automatically delete messages when they are read. If a worker crashes mid-processing, that data would be lost. Instead, the queue waits for the worker to send a definitive **Acknowledgement (ACK)** after the job is 100% complete.

**The Danger Scenario:**
<MessageQueueArchDiagram defaultTab="AT_LEAST_ONCE" />

Because of this, you operate under an **At-Least-Once Delivery Guarantee**. Your system *will* process duplicates eventually. Therefore, your consumer logic **must be idempotent**.

**Idempotency Examples:**

| Not Idempotent (Dangerous) | Idempotent (Safe) |
| :--- | :--- |
| `ADD 1 to User Post Count` | `SET User Post Count to 54` |
| `INSERT INTO users VALUES (...)` | `INSERT INTO users ... ON CONFLICT DO NOTHING` |
| `chargeCreditCard(amount)` | `chargeCreditCard(transactionId, amount)` |

---

#### 4. The Scaling Ceiling & Partitions

A single queue is a bottleneck. To scale throughput, you must **Partition** (shard) the queue.

<MessageQueueArchDiagram defaultTab="SCALING" />

**A Consumer Group** is a pool of workers that divides the partitions among themselves.

**The Hard Limit:** You cannot have more consumers than partitions. If you have 6 partitions and add a 7th consumer, the 7th consumer will sit 100% idle because there is no partition left to read from.

---

#### 5. Partition Keys: The Ordering vs. Distribution Trade-off

To route messages to partitions, you must define a **Partition Key**. This dictates the balance of your system:

**Optimizing for Strict Ordering (The Bank):**
```
Partition Key: Account_ID
├─ Account 123 → Always Partition 0 → Ordered
├─ Account 456 → Always Partition 1 → Ordered
└─ Account 789 → Always Partition 2 → Ordered
```
If a user deposits $100 and then withdraws $50, the deposit *must* process first. By using `Account_ID` as the Partition Key, all messages for that user go to the exact same partition. Because partitions act as sequential sub-queues, the messages are processed in perfect chronological order.

**Optimizing for Distribution (The Uber Problem):**
```
Partition Key: Ride_ID (random)
├─ Ride 001 → Partition 0
├─ Ride 002 → Partition 1
├─ Ride 003 → Partition 2
└─ Perfectly distributed load!
```
If you are a ride-sharing app and you use `City` as your Partition Key, the partition handling "New York City" will be crushed with millions of messages, while the partition handling "Boise, Idaho" sits empty. This is a **Hot Partition**, and it will bring down your system. To fix this, you must partition by something random like `Ride_ID` to distribute the load perfectly—but in doing so, you sacrifice strict global ordering.

---

#### 6. Handling System Overload & Failures

**Backpressure:**
```
Interview Question: "You receive 300 messages/sec, but consumers only process 200/sec. What happens?"
```

The queue will grow infinitely until you run out of memory (OOM crash). A queue does not solve a capacity deficit; it only delays it. To survive, you must apply **Backpressure**.

**Backpressure Strategies:**
```java
// Detect queue depth and reject new requests
if (queueDepth > THRESHOLD) {
    return ResponseEntity.status(429).body("Too many requests");
}

// Circuit breaker pattern
circuitBreaker.open(); // Stop accepting new work
```

**Poison Messages:**
```
User uploads corrupted image → Worker A crashes → Queue redelivers
→ Worker B crashes → Queue redelivers → Infinite loop!
```

A "Poison Message" will bounce around forever, destroying your worker pool.

**The Solution:**
Implement a **Max Retry Count** (e.g., 5). If a message fails 5 times, automatically route it to a **Dead Letter Queue (DLQ)**. For full design patterns and configurations, see the centralized **[Dead Letter Queue (DLQ) Pattern](./dead-letter-queue.md)** page.

---

#### 7. Consumer Group Rebalancing

When consumers join/leave, Kafka redistributes partitions.

```
Initial State:
3 partitions, 3 consumers
├─ Consumer A → Partition 0
├─ Consumer B → Partition 1
└─ Consumer C → Partition 2

Consumer C dies:
├─ Consumer A → Partition 0, 2
├─ Consumer B → Partition 1
└─ (Rebalancing in progress)

Consumer D added:
├─ Consumer A → Partition 0
├─ Consumer B → Partition 1
└─ Consumer D → Partition 2
```

**During rebalance:** All consumption pauses briefly.

**Minimize rebalance impact:**
- Use `CooperativeStickyAssignor` for incremental rebalancing.
- Set `session.timeout.ms` and `heartbeat.interval.ms` appropriately.
- Commit offsets frequently.

---

## 🏗️ Integration Patterns

### Spring Boot + Kafka

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
# application.yml
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

### RabbitMQ Patterns

**Work Queue (Competing Consumers):**
```
Producer → Queue → Consumer A (processes 1 message at a time)
                 → Consumer B (processes 1 message at a time)
```

```java
@RabbitListener(queues = "email-queue")
public void processEmail(EmailMessage msg) {
    emailService.send(msg);
}
```

**Pub/Sub (Exchange → Multiple Queues):**
```
Producer → Fanout Exchange → Queue A → Consumer A (notifications)
                           → Queue B → Consumer B (analytics)
                           → Queue C → Consumer C (audit)
```

**Dead Letter Exchange:**
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

### Backpressure in Consumers

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

## 📊 Kafka vs RabbitMQ: Detailed Comparison

### Core Philosophies

**RabbitMQ: The Smart Broker with Simple Consumers**
- **How it works:** A producer sends a message, and the broker looks at routing rules to place it in the correct queue. The consumer pulls it, processes it, and acknowledges it.
- **The Catch:** Once a message is consumed and acknowledged, RabbitMQ **deletes it**.
- **The Benefit:** The broker does all the heavy lifting. It tracks deliveries, manages routing, and automatically moves repeatedly failing messages to a Dead Letter Queue (DLQ) for debugging.

**Kafka: The Simple Broker with Smart Consumers**
- **How it works:** Producers append messages to a topic. Messages **do not disappear** when read; they sit in the log based on your retention configuration (hours, days, or forever).
- **The Catch:** Consumers must track their own position in the log, called an **offset**. If a consumer crashes, it looks up its last offset to resume.
- **The Benefit:** Because messages persist, they are **durable and replayable**. Multiple different services can read the exact same event stream independently.

---

### Detailed Comparison Table

| Feature | RabbitMQ | Kafka |
| :--- | :--- | :--- |
| **Architecture** | Smart broker, simple consumers | Simple broker, smart consumers |
| **Message Retention** | Deleted after ACK | Configurable retention (hours to forever) |
| **Ordering** | Per queue (strict) | Per partition (strict within partition) |
| **Parallelism** | Competing consumers | Consumer groups with partition assignment |
| **Throughput** | 4K–10K msg/s | 1M+ msg/s |
| **Latency** | 1–5ms | 5–50ms |
| **Replay** | Not supported | Yes (seek to offset) |
| **Delivery Guarantees** | At-most-once, At-least-once | At-most-once, At-least-once, Exactly-once* |
| **Fan-out** | Exchange → Multiple queues | Topics + Consumer groups |
| **Persistence** | Disk or memory | Disk (append-only log) |
| **Management** | Built-in UI | External tools (Confluent Control Center) |
| **Complexity** | Low | High |

\* Exactly-once only works when both input and output are Kafka topics in the same cluster.

---

### Ordering Guarantees & Parallelism

**RabbitMQ (Strict Global Ordering):**
- Messages come out in the exact order they went in.
- To maintain perfect order, you are restricted to a **single consumer**.
- If you add multiple consumers to increase throughput, they process in parallel, and global ordering is lost.

**Kafka (Partitioned Ordering):**
- Kafka splits topics into partitions.
- Order is guaranteed **only within a partition**.
- By assigning a "partition key" (e.g., a customer ID), all events for that specific customer go to the same partition and are processed strictly in sequence.
- Other customers' events are processed in parallel across other partitions.

---

### Throughput vs. Latency

**RabbitMQ:**
- Pushes messages to consumers immediately.
- Very low latency (**1 to 5 milliseconds**).
- Because the broker is tracking delivery states, handling acks, and making routing decisions per-message, throughput typically caps at **4,000 to 10,000 messages per second**.

**Kafka:**
- Consumers pull messages in batches.
- The broker does almost no per-message work; it just appends to a sequential log.
- Allows Kafka to handle **over 1 million messages per second** (100x more).
- Introduces a higher baseline latency (**5 to 50 milliseconds**) due to the batching.

---

### Delivery Guarantees

| Guarantee | Risk | Implementation |
| :--- | :--- | :--- |
| **At-most-once** | Message loss | Fire and forget |
| **At-least-once** | Duplicate processing | Retry + idempotent consumer |
| **Exactly-once** | Complex | Kafka transactions |

**Exactly-once (The Holy Grail):**
Kafka supports this, but it is heavily constrained. It *only* works when both the input and output are Kafka topics within the same cluster. The moment you write to a database or call an external API, you are back to At-least-once.

---

### Operational Complexity

**RabbitMQ:**
- Highly approachable for small teams.
- Single binary with straightforward clustering.
- Built-in management UI.
- Easier to debug and monitor.

**Kafka:**
- Historically required Zookeeper, newer versions use Raft (KRaft).
- Must manage partition rebalancing, broker failures, and topic configurations.
- Unless you have dedicated infrastructure expertise, strongly consider managed services like Confluent Cloud, Amazon MSK, or Azure Event Hubs.

---

## 📊 Kafka vs SQS Comparison

| Feature | Kafka | AWS SQS |
| :--- | :--- | :--- |
| **Managed** | No (self-hosted) / Confluent Cloud | Yes, fully managed |
| **Replay** | Yes | No (FIFO queue, deleted on consume) |
| **Ordering** | Per partition | FIFO queue only |
| **Retention** | Days–forever | Up to 14 days |
| **Max message size** | 1 MB (default) | 256 KB |
| **Fan-out** | Topics + consumer groups | SNS ──► multiple SQS queues |
| **Use case** | Event log, streaming | Simple task queues |

---

## 🎯 Real-World Use Cases

### When to use RabbitMQ (Task Queues)

Use RabbitMQ for task-oriented workloads where work goes in, gets done, and disappears.

**Examples:**
- **Instagram:** Uses RabbitMQ to process photo uploads, handle image resizing, and apply filters via background workers.
- **Reddit:** Uses RabbitMQ to build comment threads and calculate karma scores asynchronously.
- **Email sending:** Queue outgoing emails and process them in batches.
- **PDF generation:** Generate documents asynchronously without blocking the user.

---

### When to use Kafka (Event Streaming)

Use Kafka when you need a permanent, replayable history of events consumed by multiple independent systems.

**Examples:**
- **Netflix:** Processes petabytes of data daily through Kafka to power both user recommendations and billing.
- **Uber:** Uses Kafka to process millions of rides for real-time pricing and fraud detection.
- **LinkedIn:** Invented Kafka and uses it to power their central feed and messaging systems.
- **Financial trading:** Stream market data and execute trades with millisecond precision.

---

### Hybrid Architecture

Many large-scale teams actually use **both**:
- **Kafka** serves as the durable event backbone.
- **RabbitMQ** serves as the background worker queue triggered by those Kafka events.

```
User Action ──► Kafka (Event Log) ──► RabbitMQ (Task Queue) ──► Workers
```

---

## 🔄 Advanced Patterns

### Event-Driven Architecture Patterns

**Event Notification:**
"Something happened" — consumer fetches full data if needed.
```json
{ "type": "order.placed", "orderId": "12345" }
```

**Event-Carried State Transfer:**
Event contains full state — no need to call back.
```json
{ "type": "order.placed", "orderId": "12345", "items": [...], "total": 99.99 }
```

**Event Sourcing:**
Events are the source of truth. The current state is derived by replaying all events.

---

### Change Data Capture (CDC)

**Beginner View:**
CDC captures database changes and publishes them as events so other services can react without polling tables repeatedly.

```
App writes row ──► DB transaction log ──► CDC connector ──► Kafka topic ──► Consumers
```

**Senior Deep Dive:**
Two dominant CDC styles:
- **Log-based CDC** (e.g., Debezium): Low overhead, preserves commit order.
- **Query-based CDC:** Simple but expensive and can miss ordering under race conditions.

**Design concerns:**
- Per-key ordering must align with partition key.
- Schema evolution must be versioned and backward compatible.
- Reprocessing requires idempotent consumers and replay-safe handlers.

**Failure Modes and Recovery:**
- Connector lag spikes after deployment or broker incidents.
- Poison events block downstream consumers.
- Snapshot + streaming overlap creates duplicate events.

**Recovery playbook:**
- Track connector lag SLO and alert thresholds.
- Route malformed payloads to DLQ with schema version metadata.
- Use dedup keys: `source_table + primary_key + commit_lsn`.

---

### CQRS (Command Query Responsibility Segregation)

**Beginner View:**
CQRS separates write and read models:
- Command side validates and persists business changes.
- Query side serves fast, denormalized read views.

```
Command API ──► Write Model ──► Domain Events ──► Read Model Projector ──► Query API
```

**Senior Deep Dive:**
CQRS is most useful when:
- Read and write scaling patterns differ significantly.
- You need many specialized read projections.
- Domain rules are complex and must be isolated from query optimizations.

**Tradeoffs:**
- Eventual consistency between write and read sides.
- More operational components (projectors, replay tools, drift monitoring).
- Harder local debugging without good trace correlation.

**Spring Projection Example:**
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

### Transactional Outbox Pattern

To ensure that database updates and event publications to message queues/streams occur atomically (preventing the dual-write problem), use the Transactional Outbox Pattern.

For a complete guide with code examples, polling vs. CDC (Debezium) trade-offs, schemas, and production checklists, see the dedicated **[Transactional Outbox Pattern Guide](./outbox-pattern.md)**.

## ⚖️ Pros and Cons

### Message Queues (RabbitMQ, SQS)

**Pros:**
- Simple to understand and implement.
- Low latency (1-5ms).
- Built-in routing and exchange patterns.
- Easy to monitor and debug.
- Good for task-oriented workloads.

**Cons:**
- Messages deleted after consumption.
- No replay capability.
- Limited throughput compared to Kafka.
- Global ordering requires single consumer.
- Not ideal for event streaming.

---

### Event Streaming (Kafka)

**Pros:**
- Extremely high throughput (1M+ msg/s).
- Durable, replayable event log.
- Multiple independent consumer groups.
- Per-partition ordering with parallelism.
- Exactly-once semantics (within constraints).
- Ideal for event sourcing and analytics.

**Cons:**
- Higher latency (5-50ms).
- More complex to operate.
- Requires partition management.
- Consumers must track offsets.
- Steeper learning curve.

---

## 🚫 When NOT to Use a Queue

If your non-functional requirements state that a user needs a strict, real-time response (e.g., "The API must return data in < 500ms"), **do not introduce a queue.**

Queues are inherently designed for work that can happen *later*. Introducing one into a synchronous, low-latency requirement breaks the latency constraint by design, and adds massive complexity in trying to route the background worker's result back to the waiting client's open HTTP connection.

**Use synchronous calls when:**
- You need immediate response.
- The operation is fast (< 100ms).
- You need transactional consistency.
- The caller needs the result.

**Use queues when:**
- The operation is slow (> 1 second).
- You can process asynchronously.
- You need to handle traffic spikes.
- You need to decouple services.

---

## 📚 Interview Questions

### Q1: What is the difference between Kafka and RabbitMQ? When would you choose each?
> **Answer:** Kafka is a distributed log optimized for high-throughput replayable streams; RabbitMQ is a broker optimized for flexible routing and work queues. Choose Kafka for event streaming/analytics and RabbitMQ for low-latency task dispatch patterns.

### Q2: How does Kafka guarantee ordering of messages?
> **Answer:** Kafka preserves order only within a partition. To keep order for an entity, route all related events with the same key to one partition.

### Q3: What is a consumer group in Kafka and how does it enable parallelism?
> **Answer:** A consumer group shares a topic where each partition is assigned to one consumer instance in that group. This enables horizontal parallelism up to partition count.

### Q4: What is the difference between at-most-once, at-least-once, and exactly-once delivery?
> **Answer:** At-most-once can lose messages, at-least-once can duplicate, and exactly-once avoids duplicates within defined boundaries. In practice, most systems combine at-least-once with idempotent processing.

### Q5: How do you implement an idempotent consumer?
> **Answer:** Use a deterministic message ID and record processed IDs in durable storage with uniqueness constraints. If the ID already exists, skip side effects and ack safely.
> ```java
> @KafkaListener(topics = "payments")
> public void processPayment(PaymentEvent event) {
>     if (processedEventRepository.exists(event.getEventId())) {
>         log.info("Duplicate event {}, skipping", event.getEventId());
>         return;
>     }
>     paymentService.process(event);
>     processedEventRepository.save(new ProcessedEvent(event.getEventId()));
> }
> ```

### Q6: What happens during a Kafka consumer group rebalance?
> **Answer:** Partition ownership is revoked and reassigned when members join/leave or topic partitions change. Consumers pause processing briefly, so cooperative rebalancing and static membership reduce disruption.

### Q7: How would you design a fan-out system where one event needs to trigger 5 different services?
> **Answer:** Publish one domain event to a topic and let each service consume independently with its own group. Use schema versioning and DLQs per consumer for isolated failure handling.

### Q8: What is the transactional outbox pattern and why is it needed with Kafka?
> **Answer:** Outbox writes domain change and event record in one DB transaction, then a relay publishes events to Kafka. It prevents dual-write inconsistencies between DB commit and broker publish.

### Q9: How do you handle poison pill messages (messages that always fail)?
> **Answer:** Retry with bounded attempts/backoff, then move to DLQ including failure context. Provide replay tooling after code/data fixes.

### Q10: How does Kafka's retention and replay capability enable event sourcing?
> **Answer:** Retained immutable events can be replayed to rebuild projections or recover consumers. This supports auditability and reprocessing after schema/logic changes.

### Q11: What is the difference between a partition key and a message key in Kafka?
> **Answer:** A message key is used for ordering and partition assignment, while a partition key explicitly determines which partition a message goes to. In practice, the message key is often used as the partition key via hashing.

### Q12: How do you handle schema evolution in Kafka?
> **Answer:** Use a schema registry (Confluent Schema Registry) to manage Avro/Protobuf/JSON schemas. Follow backward and forward compatibility rules:
> - **Backward compatible:** New schema can read old data.
> - **Forward compatible:** Old schema can read new data.

### Q13: What is the difference between push-based and pull-based messaging?
> **Answer:** Push-based (RabbitMQ) sends messages to consumers immediately, resulting in low latency but potential consumer overload. Pull-based (Kafka) lets consumers fetch at their own pace, providing natural backpressure but higher latency.

### Q14: How do you monitor the health of a message queue system?
> **Answer:** Key metrics to monitor include:
> - Queue depth / lag
> - Consumer lag (offset difference)
> - Message throughput (messages/sec)
> - Error rates and DLQ size
> - Broker health and partition status
> - Consumer group rebalance frequency

### Q15: What is a Dead Letter Queue (DLQ) and when should you use it?
> **Answer:** A DLQ is a secondary queue dedicated to isolating unprocessable messages (poison pills) to prevent blocking the main queue pipeline. For a full breakdown of DLQ use cases, SQS/Kafka/RabbitMQ configurations, and operational checklists, see the centralized **[Dead Letter Queue (DLQ) Pattern](./dead-letter-queue.md)** page.

### Q16: How do you ensure exactly-once processing when writing to an external database?
> **Answer:** You cannot achieve true exactly-once when writing to external systems. Instead, use idempotent database operations, track processed message IDs, use database transactions with the outbox pattern, or accept at-least-once with deduplication.

### Q17: What is the difference between Kafka and AWS SQS?
> **Answer:** Kafka is a distributed log you self-host (or use Confluent Cloud) with replay capability and high throughput. SQS is a fully managed AWS service with simpler setup but no replay and lower throughput. Choose SQS for simple task queues on AWS, Kafka for event streaming and complex use cases.

### Q18: How do you handle consumer failures in a message queue system?
> **Answer:** Strategies include:
> 1. **Automatic redelivery:** Queue re-delivers unacknowledged messages.
> 2. **Retry with backoff:** Exponential backoff for transient failures.
> 3. **DLQ routing:** Move permanently failing messages to DLQ.
> 4. **Circuit breakers:** Stop processing when failure rate is high.
> 5. **Health checks:** Monitor consumer health and alert on failures.

### Q19: What is the role of a schema registry in event streaming?
> **Answer:** A schema registry stores and versions message schemas, ensures compatibility between producers and consumers, reduces message size by storing schema IDs instead of full schemas, and enables schema evolution without breaking consumers.

### Q20: How do you design for high availability in a message queue system?
> **Answer:** Use replication (multiple brokers/replicas for fault tolerance), partitioning (distribute data across multiple nodes), active monitoring/alerts, automated failover/disaster recovery, and multi-region deployment.

### Q21: What is the difference between compaction and deletion in Kafka?
> **Answer:** Deletion removes messages after a time-based retention period. Compaction keeps the latest message for each key, removing older versions. Use deletion for event logs and compaction for changelog streams where only the latest state matters.

### Q22: How do you optimize Kafka performance?
> **Answer:** Optimization techniques include:
> - **Batching:** Increase batch size for higher throughput.
> - **Compression:** Use compression (snappy, lz4, gzip) to reduce network I/O.
> - **Partitioning:** Add partitions for parallelism.
> - **Consumer tuning:** Adjust fetch sizes and poll intervals.
> - **Producer tuning:** Adjust linger time and buffer sizes.
> - **Hardware:** Use SSDs and sufficient memory.

### Q23: What is the difference between synchronous and asynchronous replication in Kafka?
> **Answer:** Synchronous replication (`acks=all`) waits for all replicas to acknowledge before considering a message committed, providing stronger durability but higher latency. Asynchronous replication (`acks=1` or `acks=0`) considers a message committed after the leader (or even just the producer sending it) acknowledges, providing lower latency but potential data loss on leader failure.

### Q24: How do you handle message ordering across multiple topics?
> **Answer:** Kafka does not guarantee ordering across topics. To maintain ordering, use a single topic partitioned by key, include timestamps/sequence numbers in messages for client-side sorting, or consider the saga pattern.

---

## 📖 Further Reading

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Designing Data-Intensive Applications](https://dataintensive.net/) by Martin Kleppmann
- [Confluent Platform](https://www.confluent.io/)
- [AWS SQS Documentation](https://docs.aws.amazon.com/sqs/)

## See Also
* **[Scaling Reads](./scaling-reads.md)**: Explore cache-aside/event-driven invalidation and read replication concepts.
* **[Scaling Writes](./scaling-writes.md)**: Explore async write pipelines, producer configurations, batching, and Kafka throughput settings.

