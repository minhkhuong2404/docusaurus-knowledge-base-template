---
id: kafka-producers-consumers
title: Kafka Producers & Consumers
sidebar_label: Producers & Consumers
description: Combined guide to Kafka producers and consumers — internal architecture, delivery semantics, serialization, offset management, error handling, and production patterns.
tags:
- technical-knowledge
- kafka
- producer
- consumer
- core
---

import KafkaProducerConsumerFlowDiagram from '@site/src/components/KafkaProducerConsumerFlowDiagram';

# Kafka Producers & Consumers

<KafkaProducerConsumerFlowDiagram />

---

Producers and consumers are the two ends of every Kafka data pipeline. Understanding how they work internally — not just their API — is essential for tuning throughput, ensuring delivery guarantees, and debugging production issues.

---

## The Producer

### What Is a Producer?

A **Kafka producer** is any application that writes records to Kafka topics. It is responsible for:
1. Serializing keys and values
2. Selecting the target partition
3. Batching records for network efficiency
4. Handling retries, errors, and delivery guarantees

### Producer Internal Architecture

The `send()` call is **always asynchronous** — it adds the record to an in-memory `RecordAccumulator` buffer and returns immediately. A background `Sender` thread drains the buffer and sends batches to brokers. Callbacks fire on the Sender thread when the broker responds.

### Delivery Semantics

| Semantic | Configuration | Behavior |
|----------|--------------|---------|
| **At-most-once** | `acks=0`, no retries | Fire and forget — possible data loss |
| **At-least-once** | `acks=all`, `retries > 0` | Default — retries may cause duplicates |
| **Exactly-once** | `acks=all` + `enable.idempotence=true` + transactions | No loss, no duplicates |

### Idempotent Producer (Kafka 3.0+ default)

Since Kafka 3.0, idempotence is **enabled by default** (`enable.idempotence=true`). The producer assigns a unique **Producer ID (PID)** and a **sequence number** to each batch. If the broker receives a duplicate (retry), it deduplicates using these identifiers.

### The Consumer Poll Loop

The poll loop is the core of every Kafka consumer. It must be called regularly to:
1. Fetch records from the broker
2. Send heartbeats to the Group Coordinator (keeps the consumer "alive")
3. Trigger partition rebalances when group membership changes

**Offset reset behavior** (`auto.offset.reset`):
- `earliest` — start from the very beginning of the topic
- `latest` — start from now (skip historical data)
- `none` — throw exception if no committed offset exists

```bash
# Manually reset a consumer group offset (stop consumers first)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service \
  --topic orders \
  --reset-offsets --to-earliest --execute

# Or to a specific offset
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service --topic orders \
  --reset-offsets --to-offset 5000 --execute

# Or to a specific datetime (replay from a point in time)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service --topic orders \
  --reset-offsets --to-datetime 2025-01-01T00:00:00.000 --execute
```

### Consumer Configuration

```properties
# Group and identity
group.id=order-service-group
client.id=order-consumer-1

# Offset behavior
auto.offset.reset=earliest        # Start from beginning if no committed offset
enable.auto.commit=false          # Manual commit (recommended for correctness)

# Fetch tuning
fetch.min.bytes=1048576           # 1 MB: wait for data accumulation before return
fetch.max.wait.ms=500             # Max wait for fetch.min.bytes
max.partition.fetch.bytes=10485760  # 10 MB max per partition per fetch
max.poll.records=500              # Records per poll() call

# Group liveness
session.timeout.ms=30000          # Coordinator marks consumer dead after this
heartbeat.interval.ms=10000       # Heartbeat interval (must be < session.timeout.ms / 3)
max.poll.interval.ms=300000       # Max time between poll() calls (increase for slow processing)
```

### `subscribe()` vs `assign()`

| Method | Behavior | Use Case |
|--------|---------|---------|
| `subscribe(topics)` | Group coordinator assigns partitions dynamically; rebalances on change | Live production consumers |
| `assign(partitions)` | Manual partition assignment; no group coordinator; no rebalancing | One-off replay jobs, debugging |

```java
// subscribe — group-managed (production)
consumer.subscribe(List.of("orders"));

// assign — manual (replay/debugging)
consumer.assign(List.of(
    new TopicPartition("orders", 0),
    new TopicPartition("orders", 1)
));
consumer.seek(new TopicPartition("orders", 0), 1000); // seek to specific offset
```

---

## Producers & Consumers in Spring Boot

### Spring Boot Producer

```java
@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String, OrderEvent> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
        props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
        props.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 32 * 1024);
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}

@Service
public class OrderProducer {
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public CompletableFuture<SendResult<String, OrderEvent>> publishOrder(OrderEvent event) {
        return kafkaTemplate.send("orders", event.getOrderId(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish order {}: {}", event.getOrderId(), ex.getMessage());
                } else {
                    log.info("Published order {} to partition {} offset {}",
                        event.getOrderId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
                }
            });
    }
}
```

### Spring Boot Consumer

```java
@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, OrderEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300_000);
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30_000);
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 10_000);
        props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
            CooperativeStickyAssignor.class.getName());
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> kafkaListenerContainerFactory() {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, OrderEvent>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }
}

@Service
public class OrderConsumer {

    @KafkaListener(topics = "orders", groupId = "order-service", concurrency = "3")
    public void consume(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
        try {
            orderService.process(record.value());
            ack.acknowledge(); // Commit only after successful processing
        } catch (RetriableException e) {
            log.warn("Retriable error — will retry on next poll: {}", e.getMessage());
            // Don't ack — message will be re-fetched
        } catch (Exception e) {
            log.error("Fatal error processing order {}: {}", record.key(), e.getMessage());
            dlqProducer.sendToDlq(record);
            ack.acknowledge(); // Ack and route to DLQ to avoid blocking partition
        }
    }
}
```

---

## Common Pitfalls

### Producer Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Using `.get()` on every send | Throughput < 100 msg/sec | Use async callbacks |
| `buffer.memory` too small | `BufferExhaustedException` | Increase `buffer.memory` or `max.block.ms` |
| Missing error handling in callback | Silent data loss | Always handle the exception parameter |
| No compression | High network bandwidth usage | Enable `lz4` or `zstd` |

### Consumer Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Processing too slow → `max.poll.interval.ms` exceeded | Infinite rebalances | Increase `max.poll.interval.ms` or reduce `max.poll.records` |
| `enable.auto.commit=true` with manual processing | Duplicates or loss on crash | Disable auto-commit; use `MANUAL_IMMEDIATE` ack |
| Missing `consumer.close()` on shutdown | Delayed rebalance (waits for `session.timeout.ms`) | Use shutdown hook + `wakeup()` |
| Blocking inside poll loop | Heartbeat timeout, group kicked | Move blocking work off the poll thread |

---

## Interview Questions

### Q: What is the RecordAccumulator and why does it exist?

> The RecordAccumulator is an in-memory buffer organized by partition. Records accumulate in partition-specific batches until either `batch.size` is reached or `linger.ms` expires. The background Sender thread then drains these batches into ProduceRequests sent to brokers. It exists to improve throughput — sending messages individually (one network round-trip per message) is inefficient at scale. The RecordAccumulator amortizes network overhead across many messages per request.

### Q: What is the difference between `commitSync()` and `commitAsync()`?

> `commitSync()` blocks until the broker acknowledges the commit, retrying on retriable errors — it's safe but adds latency to the poll loop. `commitAsync()` is non-blocking but does not retry on failure (retrying could commit a stale offset after a newer one already succeeded). In practice, use `commitAsync()` for normal commits (performance) and `commitSync()` in the `finally` block on shutdown to ensure the last offset is committed before the consumer exits.

### Q: Why does Kafka use a pull model instead of a push model?

> Pull lets consumers read at their own pace — a slow consumer isn't overwhelmed by broker pushes. Consumers can process batches efficiently, re-read messages by resetting offsets, and pause/resume without coordination. The broker doesn't need to track consumer state or buffer-per-consumer — complexity moves to the consumer's offset management. The trade-off is slightly higher latency for small volumes (consumers must poll even when there's nothing new), mitigated by `fetch.max.wait.ms`.

### Q: What happens if a consumer crashes without committing its offset?

> When the consumer restarts and rejoins the group, it reads the last **committed** offset from `__consumer_offsets` and starts consuming from there. Any messages processed between the last commit and the crash will be reprocessed — this is **at-least-once** delivery semantics. To minimize this window, commit frequently (but not on every record — that kills throughput) and design message processing to be idempotent.

### Q: What is `enable.idempotence` and why was it made the default in Kafka 3.0?

> An idempotent producer assigns a Producer ID (PID) and a monotonically increasing sequence number to each batch sent to a partition. If a network failure causes the broker to receive a duplicate batch (because the producer retried), the broker deduplicates using the PID + sequence number. This prevents duplicate writes from retries. It was made the default in Kafka 3.0 because the performance overhead is negligible (< 3% throughput impact) and the safety benefit — preventing duplicates from standard producer retries — applies universally.

---

## Related Topics

- [Consumer Groups](../consumer/consumer-group.md) — Group coordination, rebalancing, and partition assignment
- [Consumer Lag & Poison Messages](../consumer/consumer-lag.md) — Lag diagnosis, DLQ patterns
- [Exactly-Once Semantics](../advanced/exactly-once.md) — Transactions and idempotent producers
- [Producer Idempotency](../producer/producer-idempotency.md) — Deep dive into PID and sequence numbers
- [Producer ACKs](../producer/producer-acks.md) — Durability trade-offs in detail
- [Kafka Performance Tuning](../advanced/kafka-performance-tuning.md) — Throughput and latency optimization

## Sources

1. [Apache Kafka Documentation: Producers](https://kafka.apache.org/documentation/#theproducer)
2. [Apache Kafka Documentation: Consumers](https://kafka.apache.org/documentation/#theconsumer)
3. [Conduktor Glossary: Kafka Producers](https://www.conduktor.io/glossary/kafka-producers)
4. [Conduktor Glossary: Kafka Producers and Consumers](https://www.conduktor.io/glossary/kafka-producers-and-consumers)
5. Narkhede, N., Shapira, G., & Palino, T. — *Kafka: The Definitive Guide* (O'Reilly), Chapters 3 & 4
