---
id: consumer-overview
title: Kafka Consumer
sidebar_label: Consumer Overview
---

# Kafka Consumer

## What is a Consumer?

A **consumer** reads messages from Kafka topics. Unlike traditional queues (push-based), Kafka consumers **pull** messages at their own pace. This gives consumers full control over throughput, backpressure, and replay.

---

## Consumer Internals

```
Kafka Broker (leader partition)
        │
        │  FetchRequest (poll)
        ▼
  Consumer Client
        │
        ▼
  ConsumerRecords<K, V>
        │
        ▼
  Application processes records
        │
        ▼
  commitOffset (manual or auto)
```

The consumer maintains an **offset** per assigned partition, tracking the last processed record.

---

## The Poll Loop

The consumer's core loop:

```java
@Component
public class OrderConsumer {

    @KafkaListener(topics = "orders", groupId = "order-service")
    public void listen(ConsumerRecord<String, OrderEvent> record) {
        log.info("Received: key={}, offset={}, partition={}",
            record.key(), record.offset(), record.partition());
        processOrder(record.value());
    }
}
```

Under the hood, Spring Kafka's `@KafkaListener` runs a poll loop:

```java
// Equivalent manual loop (for understanding)
while (running) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        process(record);
    }
    consumer.commitSync(); // or commitAsync
}
```

---

## Offset Management

### Auto Commit (at-most-once risk)

```properties
enable.auto.commit=true
auto.commit.interval.ms=5000  # commits every 5 seconds
```

⚠️ Risk: consumer processes record, crashes before next auto-commit → record re-processed after restart (at-least-once). But if commit happens before processing completes → **data loss** (at-most-once).

### Manual Commit (at-least-once)

```java
@KafkaListener(topics = "orders")
public void listen(ConsumerRecord<String, String> record, Acknowledgment ack) {
    try {
        process(record);
        ack.acknowledge(); // commit offset AFTER successful processing
    } catch (Exception e) {
        // Don't ack → message will be redelivered
        log.error("Processing failed, will retry", e);
    }
}
```

```yaml
spring:
  kafka:
    listener:
      ack-mode: MANUAL_IMMEDIATE  # or MANUAL
```

### AckMode Options (Spring Kafka)

| AckMode | Description |
|---------|-------------|
| `BATCH` | Commit after all records in the poll batch are processed |
| `RECORD` | Commit after each individual record |
| `MANUAL` | App calls `ack.acknowledge()`, committed on next poll |
| `MANUAL_IMMEDIATE` | App calls `ack.acknowledge()`, committed immediately |
| `COUNT` | Commit after N records |
| `TIME` | Commit after X milliseconds |
| `COUNT_TIME` | Commit after N records OR X ms, whichever comes first |

---

## Key Consumer Configurations

```properties
bootstrap.servers=localhost:9092
group.id=order-service
key.deserializer=org.apache.kafka.common.serialization.StringDeserializer
value.deserializer=org.apache.kafka.common.serialization.StringDeserializer

# Offset reset for new groups or deleted offsets
auto.offset.reset=earliest       # earliest | latest | none

# Polling
max.poll.records=500              # Max records per poll()
max.poll.interval.ms=300000       # Max time between polls before consumer is kicked out (5 min)
fetch.min.bytes=1                 # Min bytes to fetch (default=1, higher = batch)
fetch.max.wait.ms=500             # Max wait when < fetch.min.bytes available
fetch.max.bytes=52428800          # Max bytes per fetch (50 MB)

# Session/heartbeat
session.timeout.ms=10000          # Consumer considered dead after this
heartbeat.interval.ms=3000        # Heartbeat frequency (must be < session.timeout / 3)

# Offset commit
enable.auto.commit=false          # Prefer manual commits
```

---

## `auto.offset.reset` Explained

| Value | Behavior |
|-------|----------|
| `earliest` | Start from the very first available message (good for new consumers) |
| `latest` | Start from the next new message (skip history) |
| `none` | Throw `NoOffsetForPartitionException` if no committed offset found |

---

## Consumer Lifecycle

```
1. subscribe(topics) or assign(partitions)
2. poll() → triggers group join / partition assignment (first call)
3. Heartbeat thread runs in background
4. Session expires if poll() not called within max.poll.interval.ms
   → Consumer is removed from group → rebalance triggered
```

---

## Dead Letter Topic (DLT) Pattern

```java
@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<?, ?> template) {
    DeadLetterPublishingRecoverer recoverer =
        new DeadLetterPublishingRecoverer(template,
            (r, e) -> new TopicPartition(r.topic() + ".DLT", r.partition()));

    return new DefaultErrorHandler(recoverer,
        new FixedBackOff(1000L, 3L)); // retry 3 times, 1 sec apart
}
```

```java
// Or in ConcurrentKafkaListenerContainerFactory
@Bean
public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> kafkaListenerContainerFactory(
        ConsumerFactory<String, OrderEvent> cf,
        DefaultErrorHandler errorHandler) {
    ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(cf);
    factory.setCommonErrorHandler(errorHandler);
    return factory;
}
```

---

## Interview Questions — Consumer

**Q: What is `max.poll.interval.ms` and what happens when it's exceeded?**

> `max.poll.interval.ms` (default 5 minutes) is the maximum time between two consecutive `poll()` calls. If processing takes longer, the broker considers the consumer dead and triggers a group rebalance, revoking its partitions. In Spring Kafka, this usually means your `@KafkaListener` processing is too slow — increase this value or reduce `max.poll.records`.

**Q: What is the difference between `session.timeout.ms` and `max.poll.interval.ms`?**

> `session.timeout.ms` controls heartbeat-based liveness detection — if no heartbeat arrives within this window, the broker considers the consumer dead. `max.poll.interval.ms` controls processing liveness — if the consumer doesn't call `poll()` within this time, it's removed from the group. Since Kafka 0.10.1, these are separate: `session.timeout.ms` handles network failures; `max.poll.interval.ms` handles slow processing.

**Q: What is at-least-once vs at-most-once delivery?**

> **At-most-once**: Offset committed before processing. If the consumer crashes after commit, the message is lost (never reprocessed). **At-least-once**: Offset committed after successful processing. If the consumer crashes after processing but before commit, the message is reprocessed (possible duplicate). Most production systems prefer at-least-once with idempotent processing logic.

**Q: What is `auto.offset.reset=none`?**

> It causes the consumer to throw `NoOffsetForPartitionException` if no committed offset is found for the assigned partition. This is a defensive setting that forces developers to handle the case explicitly — useful when you absolutely cannot tolerate starting from an unintended offset.

**Q: How do you implement a consumer that reads from the beginning every time?**

> Assign (not subscribe) to specific partitions and call `consumer.seekToBeginning(partitions)` before polling. In Spring Kafka, you can use `ConsumerRebalanceListener` to `seekToBeginning` during `onPartitionsAssigned`. This is useful for batch reprocessing jobs.
