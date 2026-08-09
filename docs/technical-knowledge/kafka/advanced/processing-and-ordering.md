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

If processing takes 100ms per message, your ceiling is **10 messages/second per partition**. To go faster, you need concurrency — but naïve multithreading breaks ordering.

---

## 👶 For Beginners: The "Bank Teller" Analogy

Imagine a bank with one massive line of customers:

You hire 3 tellers to speed things up:

The fix: route by Account Number:

#### Implementation with Confluent Parallel Consumer

Don't build this yourself — use Confluent's open-source `parallel-consumer`:

### The High-Water Mark Solution

Only commit the **highest contiguous completed offset**:

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

## Interview Questions

### Q: How do you increase Kafka consumer throughput without breaking ordering?

> Use Key-Level Parallel Consumer: a single poller thread fetches messages, then routes them to worker threads by message key. Messages with the same key are processed sequentially by the same thread, while different keys are processed in parallel. Libraries like Confluent's `parallel-consumer` handle this pattern and the complex offset tracking.

### Q: What is the High-Water Mark problem in parallel consumption?

> When messages are processed out of order by worker threads, you cannot commit the latest completed offset — earlier offsets may still be in-progress. If you commit prematurely and crash, those in-progress messages are lost. The solution is to track completion with a bitmap and only commit the highest offset where all preceding offsets are complete.

### Q: When would you use batch processing over parallel consumer?

> Batch processing is simpler and preferred when the bottleneck is I/O (e.g., many small DB inserts that can be replaced with bulk inserts). It avoids threading complexity entirely. Use parallel consumer when the bottleneck is CPU-bound processing or when individual messages require independent async I/O.

### Q: What is the Router Topic (Fan-Out) pattern?

> A fast, stateless consumer reads a high-volume topic and immediately re-produces each message to one of several smaller sub-topics based on the message key. This allows independent consumer groups to process sub-topics in parallel while preserving per-key ordering within each sub-topic. The tradeoff is added operational complexity and one extra hop of latency.

### Q: Why is idempotency critical when using parallel or async processing?

> With parallel processing, crashes during a rebalance or between processing and committing can cause messages to be replayed. Without idempotent downstream systems, this leads to duplicate state (double charges, duplicate records). Always use unique constraints, upserts, or deduplication checks.
