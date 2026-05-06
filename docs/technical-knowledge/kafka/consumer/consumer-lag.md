---
id: consumer-lag
title: Consumer Lag
sidebar_label: Consumer Lag
description: Consumer Lag measures how far behind a consumer group is from the latest messages in a topic. It is the most critical health metric for any Kafka-based application.
tags:
- technical-knowledge
- kafka
- consumer
- consumer-lag
---
# Consumer Lag in Kafka

## What Is Consumer Lag?

Consumer Lag is the number of messages a consumer group has **not yet processed**. It is the single most important metric for monitoring the health of a Kafka-based system.

```
Topic Partition 0:

  Messages:  [m0][m1][m2][m3][m4][m5][m6][m7][m8][m9]
                                    ▲                 ▲
                                    │                 │
                              Committed Offset    Log End Offset
                                (Consumer)          (Broker)
                                    │                 │
                                    ◄─── LAG = 4 ────►
```

If Lag = 0, the consumer is fully caught up. If lag is growing over time, your system is falling behind and will eventually run into issues (stale data, SLA violations, memory pressure).

---

## 👶 For Beginners: The "Inbox" Analogy

Think of your email inbox:

| Email Inbox | Kafka |
|-------------|-------|
| Emails arriving | Producers publishing messages |
| You reading & replying | Consumer processing messages |
| Unread email count | **Consumer Lag** |
| Inbox zero | Lag = 0 |

If you receive **10 emails/hour** but can only read **7 emails/hour**, your unread count grows by 3 every hour. After 8 hours, you have **24 unread emails** — that's your "lag."

:::tip
Lag tells you *"How far behind am I?"*. It doesn't tell you *why* — you need to investigate further with the diagnostics below.
:::

---

## 🧠 Deep Dive: Offsets and Lag Calculation

### The Two Offset Pointers

For every partition in every consumer group, Kafka tracks two critical offsets:

```
Partition 0 (Log on Broker):
  ┌─────────────────────────────────────────────────────┐
  │ [0] [1] [2] [3] [4] [5] [6] [7] [8] [9]  ← (next) │
  └─────────────────────────────────────────────────────┘
                        ▲                          ▲
                        │                          │
              Committed Offset = 4           LEO = 10

  Lag = LEO − Committed Offset = 10 − 4 = 6
```

| Pointer | Maintained By | Definition |
|---------|-------------|------------|
| **Log End Offset (LEO)** | Broker | The offset of the *next* message to be written. If 10 messages exist (0–9), LEO = 10. |
| **Committed Offset** | Consumer Group (stored in `__consumer_offsets` topic) | The offset of the *next* message the consumer will process. If the consumer finished offset 3, committed offset = 4. |

### Lag Formula

```
Partition Lag = Log End Offset (LEO) − Committed Offset

Total Group Lag = Σ (Partition Lag) across all assigned partitions
```

### Lag of 1: A Common Surprise

:::note
It's common to see a persistent lag of **1** per partition, even when the system is "caught up." This occurs because Kafka reports the LEO as the *next writable offset*, and the committed offset is the *next readable offset*. If a message was just produced but not yet polled, the lag is 1. This is normal operational behavior — not a bug.
:::

---

## 🔍 Diagnosing High Lag

When lag alerts fire, systematically walk through these root causes:

### Root Cause Decision Tree

```
Lag increasing?
│
├─ YES → Is producer throughput also increasing?
│        ├─ YES → Traffic spike (normal).
│        │        Scale consumers or wait for spike to pass.
│        └─ NO  → Consumer is getting slower.
│                 └─ Check processing time, GC pauses,
│                    downstream latency (DB, APIs).
│
└─ NO (lag is stable but non-zero) →
         Consumer is keeping up with current rate
         but hasn't caught up from a previous spike.
         └─ Add temporary consumers to drain backlog.
```

### Common Root Causes

| Root Cause | Symptoms | Fix |
|---|---|---|
| **Slow processing logic** | High `records-lag-max`, normal produce rate | Optimize code, batch DB writes |
| **Traffic spike** | Lag spikes correlate with produce rate increase | Scale consumers, auto-scale |
| **Consumer crash/restart** | Lag jumps after pod restart, then recovers | Fix crash cause, improve health checks |
| **Rebalance storms** | Lag spikes every few minutes, correlates with `JoinGroup` events | Use CooperativeStickyAssignor, increase `session.timeout.ms` |
| **GC pauses** | Lag jumps correlate with long GC logs | Tune JVM heap, switch to G1/ZGC |
| **Network latency** | High `fetch-latency-avg` metric | Check broker↔consumer network, use rack-aware consumers |
| **Downstream bottleneck** | Processing hangs on DB/API calls | Add circuit breakers, increase connection pool |

---

## 📊 How to Monitor Lag

### 1. CLI: `kafka-consumer-groups.sh`

```bash
bin/kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 \
    --group payment-processor \
    --describe

# Output:
# TOPIC      PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG   CONSUMER-ID      HOST
# payments   0          1234            1240            6     consumer-1-...   /10.0.1.5
# payments   1          5678            5678            0     consumer-2-...   /10.0.1.6
# payments   2          9100            9250            150   consumer-3-...   /10.0.1.7
```

### 2. JMX Metrics (Consumer-side)

| Metric | Description |
|--------|------------|
| `kafka.consumer:type=consumer-fetch-manager-metrics,client-id=*,records-lag-max` | Maximum lag across all assigned partitions |
| `kafka.consumer:type=consumer-fetch-manager-metrics,client-id=*,records-lag` | Per-partition lag |
| `kafka.consumer:type=consumer-fetch-manager-metrics,client-id=*,fetch-rate` | Polls per second |

### 3. Prometheus + Grafana (Production Setup)

Use **kafka-lag-exporter** or **Burrow** to scrape lag metrics into Prometheus:

```yaml
# Alerting rule example (Prometheus)
groups:
  - name: kafka-consumer-lag
    rules:
      - alert: KafkaConsumerLagHigh
        expr: kafka_consumer_group_lag > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Consumer group {{ $labels.group }} has lag {{ $value }}"
```

---

## ✅ Best Practices for Reducing Lag

### 1. Optimize Processing Code First

Before scaling infrastructure, profile your consumer:

```java
@KafkaListener(topics = "payments")
public void process(ConsumerRecord<String, PaymentEvent> record) {
    long start = System.nanoTime();

    // BAD: Individual DB insert per message
    // paymentRepository.save(toEntity(record.value()));

    // GOOD: Batch writes — collect in buffer, flush periodically
    buffer.add(toEntity(record.value()));
    if (buffer.size() >= BATCH_SIZE) {
        paymentRepository.saveAll(buffer);  // 1 round-trip instead of N
        buffer.clear();
    }

    long elapsed = Duration.ofNanos(System.nanoTime() - start).toMillis();
    processingTimeHistogram.observe(elapsed);
}
```

### 2. Scale Out Consumers Horizontally

```
Before: 2 consumers, 10 partitions → 5 partitions each

  Consumer1: [P0, P1, P2, P3, P4]    ← overloaded
  Consumer2: [P5, P6, P7, P8, P9]    ← overloaded

After:  5 consumers, 10 partitions → 2 partitions each

  Consumer1: [P0, P1]                ← comfortable
  Consumer2: [P2, P3]                ← comfortable
  Consumer3: [P4, P5]                ← comfortable
  Consumer4: [P6, P7]                ← comfortable
  Consumer5: [P8, P9]                ← comfortable
```

:::warning
You cannot have more active consumers than partitions. Adding a 11th consumer to a 10-partition topic means it will sit **idle**, doing no work.
:::

### 3. Tune Consumer Fetch Configurations

```properties
# Fetch at least 1KB per request (reduces number of empty fetches)
fetch.min.bytes=1024

# Wait up to 500ms to accumulate fetch.min.bytes
fetch.max.wait.ms=500

# Process up to 1000 records per poll() call
max.poll.records=1000

# Allow up to 10 minutes between poll() calls for heavy processing
max.poll.interval.ms=600000
```

| Config | Default | Tuning Goal |
|---|---|---|
| `fetch.min.bytes` | 1 | Increase to reduce empty fetches when traffic is low |
| `fetch.max.wait.ms` | 500 | Increase to let broker batch more data per response |
| `max.poll.records` | 500 | Increase for batch processing; decrease for low-latency |
| `max.poll.interval.ms` | 300000 | Increase if processing logic is legitimately slow |

### 4. Async Processing with Safe Offset Management

```java
// ⚠️ DANGEROUS: Committing after async dispatch
@KafkaListener(topics = "events")
public void process(List<ConsumerRecord<String, Event>> records) {
    for (var record : records) {
        executor.submit(() -> processAsync(record));  // fire-and-forget
    }
    // Offset auto-committed here — but async tasks may not be done!
    // If app crashes, messages are LOST.
}

// ✅ SAFE: Track completion, commit only when all done
@KafkaListener(topics = "events")
public void process(List<ConsumerRecord<String, Event>> records,
                    Acknowledgment ack) {
    CountDownLatch latch = new CountDownLatch(records.size());
    for (var record : records) {
        executor.submit(() -> {
            try {
                processAsync(record);
            } finally {
                latch.countDown();
            }
        });
    }
    latch.await();   // Block until ALL async tasks complete
    ack.acknowledge(); // Now safe to commit
}
```

---

## Interview Questions — Consumer Lag

**Q: What is Consumer Lag and why does it matter?**

> Consumer Lag is the difference between the Log End Offset (LEO) and the consumer's committed offset for a partition. It represents how many unprocessed messages remain. High lag means the consumer is falling behind, which leads to stale data, SLA violations, and potential memory issues if backpressure isn't handled.

**Q: How is lag calculated for a consumer group?**

> Per-partition lag = `LEO - Committed Offset`. Total group lag = sum of per-partition lag across all assigned partitions. This is calculated on the broker side and exposed via the `kafka-consumer-groups.sh` CLI tool and JMX metrics.

**Q: Why might a consumer show a persistent lag of 1?**

> This is normal behavior. The LEO is the offset of the *next* message to be written, and the committed offset is the *next* message to be read. If a message was just produced but the consumer hasn't polled yet, the difference is 1. This is not a bug.

**Q: What are the main strategies for reducing consumer lag?**

> (1) Optimize processing code (batch DB writes, cache API responses). (2) Scale out consumers horizontally (up to partition count). (3) Tune fetch configs (`max.poll.records`, `fetch.min.bytes`). (4) Use parallel/async processing with safe offset management. (5) Increase partitions and consumer count together.

**Q: What happens if a consumer is too slow and exceeds `max.poll.interval.ms`?**

> The broker considers the consumer dead, removes it from the group, and triggers a rebalance. Its partitions are reassigned to other consumers. The evicted consumer will rejoin after its next `poll()` call, potentially causing a rebalance storm if it keeps getting evicted.
