---
id: processing-and-ordering
title: Processing and Ordering
sidebar_label: Processing & Ordering
description: Kafka guarantees ordering within a partition, but single-threaded processing limits throughput. This guide covers four patterns for achieving high throughput while preserving per-key ordering.
tags:
- technical-knowledge
- kafka
- advanced
- processing-and-ordering
---
# Improving Processing Speed While Ensuring Ordering

## The Core Tension

Kafka guarantees message ordering **within a single partition**. The default consumer model uses one thread per partition — simple and correct, but limited in throughput.

```
Standard Consumer (single-threaded per partition):

  Partition 0:  [m0] [m1] [m2] [m3] [m4] [m5] ...
                 │
                 ▼
            ┌──────────┐
            │ Thread 0 │ ← processes m0, then m1, then m2...
            └──────────┘    (100ms each = 10 msg/sec MAX)
```

If processing takes 100ms per message, your ceiling is **10 messages/second per partition**. To go faster, you need concurrency — but naïve multithreading breaks ordering.

---

## 👶 For Beginners: The "Bank Teller" Analogy

Imagine a bank with one massive line of customers:

```
Single Line (= 1 Kafka Partition):

  [Alice-Acct123] [Bob-Acct123] [Carol-Acct456] [Dave-Acct789]
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌──────────────────────────────────────────────────────┐
    │                   1 Teller (1 Thread)                │
    │  Processes Alice → Bob → Carol → Dave (strictly)     │
    └──────────────────────────────────────────────────────┘
    Correct ordering ✅  but SLOW ❌
```

You hire 3 tellers to speed things up:

```
Naïve Parallel (BROKEN):

  [Alice-Acct123] [Bob-Acct123] [Carol-Acct456]
         │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ Teller1 │   │ Teller2 │   │ Teller3 │
    │ (slow)  │   │ (fast!) │   │         │
    └─────────┘   └─────────┘   └─────────┘

  Teller2 finishes Bob's withdrawal BEFORE
  Teller1 finishes Alice's deposit — same account!
  Account overdrafts! ❌
```

The fix: route by Account Number:

```
Key-Based Routing (CORRECT):

  Manager routes by Account Number:
    Acct123 → always Teller 1
    Acct456 → always Teller 2
    Acct789 → always Teller 3

  [Alice-Acct123] [Bob-Acct123] → Teller 1 (sequential ✅)
  [Carol-Acct456]               → Teller 2 (parallel ✅)
  [Dave-Acct789]                → Teller 3 (parallel ✅)

  3x throughput ✅  Per-account ordering preserved ✅
```

---

## 🧠 Deep Dive: Four Patterns for Throughput + Ordering

### Pattern 1: Key-Level Parallel Consumer

The most powerful and general-purpose solution. Separate the network I/O from processing, and route by key.

```
Architecture:

  Kafka Partition 0
         │
    ┌────▼──────────────────────┐
    │    Poller Thread          │  ← single thread: poll() + route
    │    (fetches batches)      │
    └────┬──────┬──────┬────────┘
         │      │      │
    ┌────▼──┐┌──▼───┐┌─▼────┐
    │ Queue ││Queue ││Queue │     ← per-key (or per-key-hash) queues
    │ Key=A ││Key=B ││Key=C │
    └───┬───┘└──┬───┘└──┬───┘
    ┌───▼───┐┌──▼───┐┌──▼───┐
    │Worker ││Worker││Worker│     ← each worker processes its queue
    │  T1   ││  T2  ││  T3  │       sequentially
    └───────┘└──────┘└──────┘

  Key A: m1→m4→m7  processed IN ORDER by T1
  Key B: m2→m5→m8  processed IN ORDER by T2
  Key C: m3→m6→m9  processed IN ORDER by T3
  But T1, T2, T3 run IN PARALLEL
```

#### Implementation with Confluent Parallel Consumer

Don't build this yourself — use Confluent's open-source `parallel-consumer`:

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.confluent.parallelconsumer</groupId>
    <artifactId>parallel-consumer-core</artifactId>
    <version>0.5.3.0</version>
</dependency>
```

```java
var options = ParallelConsumerOptions.<String, PaymentEvent>builder()
    .consumer(kafkaConsumer)
    .ordering(ParallelConsumerOptions.ProcessingOrder.KEY)  // ← KEY ordering
    .maxConcurrency(100)     // up to 100 keys processed in parallel
    .commitMode(ParallelConsumerOptions.CommitMode.PERIODIC_CONSUMER_ASYNCHRONOUS)
    .build();

var parallelConsumer = new ParallelStreamProcessor<>(options);

parallelConsumer.poll(record -> {
    // This lambda runs in parallel for DIFFERENT keys
    // but SEQUENTIALLY for the SAME key
    processPayment(record.key(), record.value());
});
```

:::tip[The `parallel-consumer` library handles the hardest part — **safe, out-of-order offset committing** — using an internal bitmap to track which offsets have completed, only committing the highest contiguous offset.]
:::

---

### Pattern 2: Batch Processing

If your bottleneck is I/O (database writes, API calls), batching can deliver 10–100x improvement without any threading complexity.

```
Without batching:
  [m0] → INSERT → [m1] → INSERT → [m2] → INSERT    (3 round-trips)

With batching:
  [m0, m1, m2] → BULK INSERT                        (1 round-trip)
```

```java
@KafkaListener(topics = "orders", batch = "true")
public void processBatch(List<ConsumerRecord<String, OrderEvent>> records) {

    // Group by key to preserve per-key ordering within the batch
    Map<String, List<OrderEvent>> byKey = records.stream()
        .collect(Collectors.groupingBy(
            ConsumerRecord::key,
            LinkedHashMap::new,    // preserve insertion order
            Collectors.mapping(ConsumerRecord::value, Collectors.toList())
        ));

    // Process each key's events in order, but different keys can be parallelized
    byKey.forEach((key, events) -> {
        List<OrderEntity> entities = events.stream()
            .map(this::toEntity)
            .collect(Collectors.toList());
        orderRepository.saveAll(entities);  // single bulk DB call per key
    });
}
```

| Approach | Throughput | Ordering | Complexity |
|---|---|---|---|
| Individual processing | Low | ✅ Guaranteed | Low |
| Batch processing | High | ✅ Guaranteed (with grouping) | Medium |
| Batch without grouping | Highest | ⚠️ Only within batch | Low |

---

### Pattern 3: Router Topic (Fan-Out)

If a single topic has extremely high throughput, write a lightweight "router" consumer that splits messages into smaller sub-topics by key:

```
Main Topic (high volume):
  ┌──────────────────────────────────────────┐
  │ [A][B][C][A][D][B][A][C][D][A][B][C]... │
  └─────────────────┬────────────────────────┘
                    │
            ┌───────▼────────┐
            │ Router Consumer│  ← ultra-fast, no business logic
            │ (fan-out)      │     just re-produces by key
            └──┬────┬────┬───┘
               │    │    │
          ┌────▼┐┌──▼──┐┌▼────┐
          │Sub-A││Sub-B││Sub-C│   ← smaller sub-topics
          └──┬──┘└──┬──┘└──┬──┘
          ┌──▼──┐┌──▼──┐┌──▼──┐
          │ C1  ││ C2  ││ C3  │   ← independent consumers
          └─────┘└─────┘└─────┘      with their own groups
```

```java
@KafkaListener(topics = "main-events", groupId = "router")
public void route(ConsumerRecord<String, Event> record) {
    // Route to sub-topic based on key hash
    int bucket = Math.abs(record.key().hashCode()) % NUM_SUB_TOPICS;
    String subTopic = "events-sub-" + bucket;
    kafkaTemplate.send(subTopic, record.key(), record.value());
}
```

:::warning[This adds operational complexity (more topics to manage) and an extra hop of latency. Use it only when you've exhausted simpler options.]
:::

---

### Pattern 4: Partition-Level Pause/Resume

If one partition is "stuck" on a slow message, you can pause it and continue processing other partitions:

```java
@Override
public void onMessage(ConsumerRecord<String, Event> record,
                      Consumer<?, ?> consumer) {
    try {
        processEvent(record);
    } catch (TemporaryFailureException e) {
        // Pause this partition — other partitions continue normally
        TopicPartition tp = new TopicPartition(record.topic(), record.partition());
        consumer.pause(Collections.singleton(tp));

        // Schedule a retry
        scheduler.schedule(() -> {
            consumer.resume(Collections.singleton(tp));
        }, 30, TimeUnit.SECONDS);
    }
}
```

This preserves ordering within the paused partition (nothing skips ahead) while allowing the rest of the consumer group to continue making progress.

---

## ⚠️ The Offset Committing Challenge

When processing messages out of order (parallel consumer, async workers), offset management becomes the hardest problem.

### Why You Can't Just Commit the Latest Offset

```
Fetched: [offset 1] [offset 2] [offset 3] [offset 4] [offset 5]
               │          │          │          │          │
           Thread A   Thread B   Thread A   Thread B   Thread A
               │          │          │          │          │
             DONE    ⏳ SLOW      DONE       DONE       DONE

If you commit offset 5 now:
  → App crashes
  → Kafka resumes from offset 5
  → Offset 2 is LOST forever ❌
```

### The High-Water Mark Solution

Only commit the **highest contiguous completed offset**:

```
Completion bitmap:  [1=✅] [2=⏳] [3=✅] [4=✅] [5=✅]
                             ▲
                     Still processing!

High-water mark = 1  ← only safe to commit offset 1

Later: [1=✅] [2=✅] [3=✅] [4=✅] [5=✅]
High-water mark = 5  ← now safe to commit offset 5
```

The Confluent Parallel Consumer handles this automatically using an internal **offset bitmap**.

---

## ✅ Best Practices Summary

| Scenario | Recommended Pattern | Why |
|---|---|---|
| Slow DB writes, ordering required | **Batch Processing** | Simple, no threading, huge I/O improvement |
| Need 10–100x throughput, ordering per key | **Parallel Consumer (Key-level)** | Best throughput/ordering tradeoff |
| Extreme volume, single fat topic | **Router Topic (Fan-Out)** | Distributes load to independent consumer groups |
| One bad message blocks processing | **Partition Pause/Resume** | Isolates slow partition without losing ordering |
| No ordering requirement at all | Add more partitions + consumers | Simplest scaling path |

---

## 🛡️ Always Add Idempotency

Regardless of which pattern you choose, your downstream systems **must be idempotent**. Crashes, retries, and rebalances can cause duplicate processing:

```java
// ✅ Idempotent DB write — uses unique constraint on eventId
@Transactional
public void processPayment(PaymentEvent event) {
    if (paymentRepository.existsByEventId(event.getEventId())) {
        log.info("Duplicate event {}, skipping", event.getEventId());
        return;
    }
    paymentRepository.save(toEntity(event));
}
```

---

## Interview Questions — Processing & Ordering

**Q: How do you increase Kafka consumer throughput without breaking ordering?**

> Use Key-Level Parallel Consumer: a single poller thread fetches messages, then routes them to worker threads by message key. Messages with the same key are processed sequentially by the same thread, while different keys are processed in parallel. Libraries like Confluent's `parallel-consumer` handle this pattern and the complex offset tracking.

**Q: What is the High-Water Mark problem in parallel consumption?**

> When messages are processed out of order by worker threads, you cannot commit the latest completed offset — earlier offsets may still be in-progress. If you commit prematurely and crash, those in-progress messages are lost. The solution is to track completion with a bitmap and only commit the highest offset where all preceding offsets are complete.

**Q: When would you use batch processing over parallel consumer?**

> Batch processing is simpler and preferred when the bottleneck is I/O (e.g., many small DB inserts that can be replaced with bulk inserts). It avoids threading complexity entirely. Use parallel consumer when the bottleneck is CPU-bound processing or when individual messages require independent async I/O.

**Q: What is the Router Topic (Fan-Out) pattern?**

> A fast, stateless consumer reads a high-volume topic and immediately re-produces each message to one of several smaller sub-topics based on the message key. This allows independent consumer groups to process sub-topics in parallel while preserving per-key ordering within each sub-topic. The tradeoff is added operational complexity and one extra hop of latency.

**Q: Why is idempotency critical when using parallel or async processing?**

> With parallel processing, crashes during a rebalance or between processing and committing can cause messages to be replayed. Without idempotent downstream systems, this leads to duplicate state (double charges, duplicate records). Always use unique constraints, upserts, or deduplication checks.
