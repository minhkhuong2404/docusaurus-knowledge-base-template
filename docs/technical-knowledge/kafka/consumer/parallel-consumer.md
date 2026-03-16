---
id: parallel-consumer
title: Parallel Consumer
sidebar_label: Parallel Consumer
---

# Parallel Consumer

## The Problem with Standard Consumers

Standard Kafka consumer processing is **sequential per partition**:

```
Partition 0: [msg1] → process → [msg2] → process → [msg3] → process
                     ↑ must finish before next poll
```

If you have 6 partitions and 6 consumer threads, you get 6-way parallelism — but only 6, regardless of how fast your broker can serve messages. You can't increase parallelism beyond partition count without creating a new threading layer yourself.

---

## Parallel Consumer Library

The **Confluent Parallel Consumer** library (open-source) decouples threading from partitions, allowing **thousands of concurrent threads** processing messages from a small number of partitions.

```
Partition 0 → [msg1][msg2][msg3][msg4][msg5]
                ↓    ↓    ↓    ↓    ↓
               T1   T2   T3   T4   T5   ← concurrent threads
```

GitHub: [confluentinc/parallel-consumer](https://github.com/confluentinc/parallel-consumer)

---

## Dependency

```xml
<dependency>
    <groupId>io.confluent.parallelconsumer</groupId>
    <artifactId>parallel-consumer-core</artifactId>
    <version>0.5.3.0</version>
</dependency>
```

---

## Basic Usage

```java
@Service
public class ParallelOrderConsumer {

    private ParallelStreamProcessor<String, OrderEvent> parallelConsumer;

    @PostConstruct
    public void start() {
        var options = ParallelConsumerOptions.<String, OrderEvent>builder()
            .ordering(KEY)                    // ORDER_BY_KEY, PARTITION, UNORDERED
            .maxConcurrency(100)             // number of parallel threads
            .consumer(buildConsumer())
            .producer(buildProducer())       // optional, for produce results
            .build();

        parallelConsumer = ParallelStreamProcessor.createEosStreamProcessor(options);
        parallelConsumer.subscribe(List.of("orders"));

        parallelConsumer.poll(context -> {
            ConsumerRecord<String, OrderEvent> record = context.getSingleConsumerRecord();
            processOrder(record.value());   // called concurrently!
        });
    }

    @PreDestroy
    public void stop() {
        parallelConsumer.closeDrainFirst();
    }

    private Consumer<String, OrderEvent> buildConsumer() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "parallel-order-service");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false); // parallel consumer manages commits
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        return new KafkaConsumer<>(props);
    }
}
```

---

## Ordering Modes

The key design choice is the `ordering` option:

### `UNORDERED`
All messages processed concurrently regardless of key or partition:
```java
.ordering(UNORDERED)
.maxConcurrency(200)
```
- Maximum throughput
- No ordering guarantee
- Best for: idempotent, stateless processing

### `KEY` (recommended for most cases)
Messages with the same key are processed in order; different keys processed concurrently:
```java
.ordering(KEY)
.maxConcurrency(100)
```
- Per-key ordering preserved
- High parallelism across different keys
- Best for: per-entity processing (order events per orderId)

### `PARTITION`
Same behavior as standard Kafka consumer — sequential per partition:
```java
.ordering(PARTITION)
.maxConcurrency(numPartitions)
```
- Same ordering guarantees as standard consumer
- Useful for gradual migration

---

## Parallel Consumer vs Standard Consumer

| Aspect | Standard Consumer | Parallel Consumer |
|--------|-------------------|-------------------|
| Parallelism bound | # partitions | Configurable (hundreds+) |
| Ordering | Per-partition | Per-key (configurable) |
| Offset management | App-managed | Library-managed |
| Backpressure | Via `max.poll.records` | Via `maxConcurrency` |
| Complexity | Low | Moderate |
| Use case | General | High-throughput, I/O-bound |

---

## Offset Management

The Parallel Consumer manages offsets internally. It tracks which messages have been completed and commits the **highest contiguous offset** — ensuring no message is skipped even with out-of-order completions:

```
Messages processing:
[offset=100 ✓][offset=101 pending][offset=102 ✓][offset=103 ✓]

Committable offset: 100 (can't advance past 101 until it completes)
```

This is called **offset tracking with completion bitmap** — it prevents unsafe offset commits.

---

## Produce Results (Poll and Produce Pattern)

```java
parallelConsumer.pollAndProduce(
    context -> {
        OrderEvent order = context.getSingleConsumerRecord().value();
        ProcessedOrder result = processOrder(order);
        // Return record to produce as part of the same transaction
        return new ProducerRecord<>("processed-orders", order.getId(), result);
    },
    (result) -> {
        log.info("Produced to offset {}", result.getRecordMetadata().offset());
    }
);
```

---

## DIY Parallel Processing in Spring Kafka

If you don't want to add the library, you can implement basic parallel processing using a thread pool:

```java
@KafkaListener(topics = "orders", concurrency = "6")
public void listen(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
    CompletableFuture.runAsync(() -> {
        try {
            processOrder(record.value());
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Failed processing", e);
            // DO NOT ack; or route to DLT
        }
    }, executorService);
    // WARNING: ack must happen asynchronously — do not ack before processing completes
}
```

⚠️ This approach is tricky — ordering and offset commit management become your responsibility.

---

## Interview Questions — Parallel Consumer

**Q: Why would you use a Parallel Consumer over increasing partition count?**

> Increasing partitions has operational limits (file handles, rebalance cost, broker memory) and is irreversible. Parallel Consumer decouples processing concurrency from partition topology — you can run 200 concurrent processing threads on 6 partitions. This is especially useful for I/O-bound tasks (external API calls, DB writes) where the bottleneck is not Kafka throughput but per-message processing latency.

**Q: How does the Parallel Consumer maintain per-key ordering?**

> It uses an in-memory map of `key → queue` and ensures messages with the same key are dispatched to the same virtual thread queue, processed sequentially. Messages with different keys are dispatched concurrently to the thread pool.

**Q: What is the risk of unbounded `maxConcurrency`?**

> Setting too high a concurrency can exhaust thread pool resources, overwhelm downstream systems (DB connection pool, external APIs), and create memory pressure from large in-flight batches. Tune `maxConcurrency` to match downstream capacity.

**Q: How does Parallel Consumer handle failures?**

> Failed messages are retried (configurable retry policy). A dead letter queue can be configured for messages that exhaust retries. The offset tracking bitmap ensures failed messages block offset advancement until resolved.
