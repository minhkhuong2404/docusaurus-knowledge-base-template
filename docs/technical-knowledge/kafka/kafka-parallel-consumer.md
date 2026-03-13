---
id: kafka-parallel-consumer
title: Parallel Consumer in Kafka
slug: kafka-parallel-consumer
description: Explains parallel consumer patterns in Kafka for increasing throughput when processing is slower than message consumption.
tags: [kafka, consumers, parallelism, performance]
---

# Parallel Consumer in Kafka

Standard Kafka consumers process messages **sequentially per partition** — one message at a time per assigned partition. This becomes a bottleneck when downstream processing is slow (e.g., HTTP calls, database writes). **Parallel consumers** break this limit by processing multiple messages concurrently within a single partition.

---

## 1. The Problem: Sequential Partition Processing

In a standard Kafka consumer:

```
Partition 0: [msg0] → [msg1] → [msg2] → [msg3] → ...
                ↓
            Consumer Thread
            (processes one at a time)
```

- **Throughput is bounded** by how fast a single thread processes one message.
- Adding more consumers only helps if you add more **partitions** (since each partition is assigned to exactly one consumer in a group).
- Over-partitioning causes overhead (more files, longer rebalances, more broker metadata).

**The bottleneck:** If each message takes 100ms to process and you have 1000 msg/s per partition, you need **100 partitions** just to keep up — with standard consumers.

---

## 2. Solutions Overview

| Approach                        | How It Works                                    | Ordering    |
|--------------------------------|------------------------------------------------|-------------|
| **More partitions + consumers** | Scale horizontally with partition count          | Per-partition |
| **Multi-threaded consumer**     | Decouple polling from processing with a thread pool | Custom      |
| **Confluent Parallel Consumer** | Library that manages concurrency and offset tracking | Per-key or unordered |

---

## 3. Multi-Threaded Consumer (DIY Approach)

Decouple the poll loop from message processing by submitting work to a thread pool.

### Architecture

```
                  ┌──────────────┐
                  │  Poll Thread  │  (single thread polls Kafka)
                  └──────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Worker 1 │ │ Worker 2 │ │ Worker 3 │  (thread pool)
        └──────────┘ └──────────┘ └──────────┘
```

### Implementation

```java
ExecutorService executor = Executors.newFixedThreadPool(10);
KafkaConsumer<String, String> consumer = createConsumer();
consumer.subscribe(List.of("my-topic"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

    List<Future<?>> futures = new ArrayList<>();

    for (ConsumerRecord<String, String> record : records) {
        futures.add(executor.submit(() -> {
            processRecord(record);  // slow I/O-bound work
        }));
    }

    // Wait for all records in this batch to complete before committing
    for (Future<?> future : futures) {
        future.get();  // blocks until done
    }

    consumer.commitSync();
}
```

### Challenges with DIY

| Challenge                | Description                                                |
|-------------------------|------------------------------------------------------------|
| **Offset management**    | Can't commit offset N+1 if message N is still processing   |
| **Ordering**            | Concurrent execution breaks per-partition ordering          |
| **Error handling**      | A failed message can block offset commits for the partition |
| **Rebalance safety**    | In-flight work must complete before partitions are revoked  |
| **Back-pressure**       | Must manage thread pool saturation                         |

---

## 4. Confluent Parallel Consumer Library

The [Confluent Parallel Consumer](https://github.com/confluentinc/parallel-consumer) library solves all the above challenges with a **key-level ordered, partition-level concurrent** consumer.

### How It Works

```
Partition 0: [A:1] [B:1] [A:2] [C:1] [B:2] [A:3]

Without parallel consumer:
  A:1 → B:1 → A:2 → C:1 → B:2 → A:3  (sequential)

With parallel consumer (key-ordered):
  Thread 1: A:1 → A:2 → A:3  (key A, ordered)
  Thread 2: B:1 → B:2         (key B, ordered)
  Thread 3: C:1               (key C, ordered)
  ↑ All keys processed in parallel, order preserved per key
```

### Dependency

```xml
<dependency>
    <groupId>io.confluent.parallelconsumer</groupId>
    <artifactId>parallel-consumer-core</artifactId>
    <version>0.5.3.0</version>
</dependency>
```

### Configuration and Usage

```java
// Create the standard Kafka consumer
KafkaConsumer<String, String> kafkaConsumer = new KafkaConsumer<>(consumerProps());

// Build the parallel consumer
ParallelConsumerOptions<String, String> options = ParallelConsumerOptions.<String, String>builder()
    .consumer(kafkaConsumer)
    .ordering(ParallelConsumerOptions.ProcessingOrder.KEY)  // KEY, PARTITION, or UNORDERED
    .maxConcurrency(100)       // max concurrent processing threads
    .commitMode(ParallelConsumerOptions.CommitMode.PERIODIC_CONSUMER_SYNC)
    .build();

ParallelStreamProcessor<String, String> parallelConsumer =
    ParallelStreamProcessor.createEosCore(options);

// Subscribe and process
parallelConsumer.subscribe(List.of("my-topic"));

parallelConsumer.poll(context -> {
    ConsumerRecord<String, String> record = context.getSingleConsumerRecord();
    // Process the record (can be slow — runs in parallel)
    callExternalApi(record.key(), record.value());
});
```

### Processing Order Modes

| Mode          | Behavior                                                      | Use Case                          |
|--------------|---------------------------------------------------------------|-----------------------------------|
| `KEY`         | Messages with the same key are processed in order; different keys run in parallel | Most common — user-level ordering |
| `PARTITION`   | Same as standard consumer (sequential per partition)          | Strict partition ordering needed  |
| `UNORDERED`   | Maximum parallelism, no ordering guarantees                   | Independent events (e.g., logging) |

### Offset Management

The parallel consumer tracks offsets at a **per-record granularity** using a **bitset** encoding:

```
Partition 0 offsets: [0: ✅] [1: ✅] [2: ⏳] [3: ✅] [4: ⏳] [5: ✅]
                                       │              │
                              still processing   still processing

Committed offset: 2  (highest contiguous completed offset)
Encoded incomplete offsets: stored in offset metadata
```

On restart, the parallel consumer:
1. Reads the committed offset
2. Reads the bitset from offset metadata
3. Skips already-processed records
4. Reprocesses only the incomplete ones

This prevents both **data loss** and **unnecessary reprocessing**.

---

## 5. Parallel Consumer with Exactly-Once

```java
ParallelConsumerOptions<String, String> options = ParallelConsumerOptions.<String, String>builder()
    .consumer(kafkaConsumer)
    .producer(kafkaProducer)  // provide a producer for EOS
    .ordering(ParallelConsumerOptions.ProcessingOrder.KEY)
    .maxConcurrency(50)
    .commitMode(ParallelConsumerOptions.CommitMode.PERIODIC_TRANSACTIONAL_PRODUCER)
    .build();

ParallelStreamProcessor<String, String> parallelConsumer =
    ParallelStreamProcessor.createEosCore(options);

parallelConsumer.subscribe(List.of("input-topic"));

parallelConsumer.poll(context -> {
    ConsumerRecord<String, String> record = context.getSingleConsumerRecord();
    String result = transform(record.value());

    // Produce to output topic (within the transaction)
    context.produceAndThen(
        new ProducerRecord<>("output-topic", record.key(), result),
        producerResult -> {
            // Optional: callback after successful produce
            log.info("Produced to offset {}", producerResult.offset());
        }
    );
});
```

---

## 6. Scaling Comparison

### Scenario: 10,000 messages/sec, 50ms processing per message

| Approach                            | Consumers | Partitions | Threads per Consumer | Effective Throughput |
|------------------------------------|-----------|------------|---------------------|---------------------|
| Standard consumer                   | 500       | 500        | 1                   | 10,000 msg/s        |
| Standard + more partitions          | 50        | 50         | 1                   | 1,000 msg/s         |
| Parallel consumer (`maxConcurrency=100`) | 2    | 6          | 100                 | 10,000+ msg/s       |

The parallel consumer achieves the same throughput with **far fewer partitions and consumer instances**.

---

## 7. Monitoring

### Key Metrics

| Metric                          | Description                                  |
|--------------------------------|----------------------------------------------|
| `pc.user.function.processing.time` | Time spent in your processing function      |
| `pc.concurrency.level`         | Current number of in-flight records          |
| `pc.waiting.for.processing`    | Records queued but not yet started           |
| `pc.partition.incomplete.offsets` | Number of incomplete offsets per partition  |
| Standard consumer lag           | Monitor via `kafka-consumer-groups.sh`       |

### Health Checks

```java
// Check if parallel consumer is healthy
boolean isClosedOrFailed = parallelConsumer.isClosedOrFailed();

// Draining on shutdown
parallelConsumer.closeDrainFirst();  // waits for in-flight to complete
```

---

## 8. When to Use What

```
Is processing per-message slow (>10ms)?
│
├── No → Standard consumer is fine
│
└── Yes
    │
    ├── Can you add more partitions easily?
    │   ├── Yes → Scale partitions + consumers
    │   └── No → Use parallel consumer
    │
    ├── Do you need per-key ordering?
    │   ├── Yes → Parallel consumer with KEY mode
    │   └── No → Parallel consumer with UNORDERED mode
    │
    └── Do you need exactly-once?
        ├── Yes → Parallel consumer with PERIODIC_TRANSACTIONAL_PRODUCER
        └── No → Parallel consumer with PERIODIC_CONSUMER_SYNC
```

---

## 9. Best Practices

1. **Start with `KEY` ordering** — it covers most use cases and preserves business-relevant ordering.
2. **Set `maxConcurrency` based on your bottleneck** — if each call takes 50ms, `maxConcurrency=200` gives ~4000 msg/s per instance.
3. **Use circuit breakers** — wrap external calls with resilience patterns (e.g., Resilience4j) to prevent thread pool exhaustion.
4. **Monitor incomplete offsets** — a growing count indicates processing failures or slowness.
5. **Test with `UNORDERED` mode** — if ordering doesn't matter, this gives maximum throughput.
6. **Prefer `closeDrainFirst()`** on shutdown — ensures in-flight messages are processed before exit.
7. **Keep partitions reasonable** — the parallel consumer lets you use fewer partitions (6–12) instead of hundreds.
8. **Tune `max.poll.records`** — larger batches give the parallel consumer more work to parallelize.

---

## 10. Quick Start Checklist

- [ ] Add parallel consumer dependency to your project
- [ ] Create a standard `KafkaConsumer` with `enable.auto.commit=false`
- [ ] Choose an ordering mode (`KEY`, `PARTITION`, or `UNORDERED`)
- [ ] Set `maxConcurrency` based on expected latency
- [ ] Implement your processing logic in the `poll` callback
- [ ] Add monitoring for consumer lag and incomplete offsets
- [ ] Test shutdown behavior with `closeDrainFirst()`

---

## Further Reading

- [Confluent Parallel Consumer — GitHub](https://github.com/confluentinc/parallel-consumer)
- [Confluent Blog — Introducing the Parallel Consumer](https://www.confluent.io/blog/introducing-confluent-parallel-message-processing-client/)

---

## Advanced Editorial Pass: Parallelism Without Ordering Debt

### Key Architectural Trade-offs
- Throughput gains must be balanced against ordering guarantees and offset safety.
- Parallel execution model should align with key semantics and downstream idempotency.
- Concurrency strategy must remain operable during rebalances and failures.

### Reliability Risks
- Out-of-order side effects when business key constraints are unclear.
- Back-pressure collapse from unbounded in-flight work.
- Partial-batch failures that stall commits and inflate lag.

### Practical Heuristics
1. Define ordering contract explicitly: by partition, key, or none.
2. Enforce bounded concurrency and queue depth with clear saturation policy.
3. Track in-flight age and retry distribution to detect hidden starvation.

### Compare Next
- [Configuring Exactly-Once Semantics in Kafka](./kafka-exactly-once.md)
- [Kafka Streams: Topology & Branching](./kafka-streams.md)
- [Kafka: The Complete Guide](./Kafka:%20The%20Complete%20Guide.md)
