---
id: consumer-lag
title: Consumer Lag & Poison Messages
sidebar_label: Consumer Lag & Poison Messages
description: Deep dive into Kafka consumer lag — offset mechanics, lag calculation, root cause diagnosis, scaling strategies, and poison message handling (DLQ, retry topics, skip strategies) for senior engineers.
tags:
  - kafka
  - consumer
  - consumer-lag
  - poison-messages
  - dlq
  - dead-letter-queue
  - monitoring
  - resilience
---

# Consumer Lag & Poison Messages in Kafka

Consumer lag and poison messages are the two most common causes of Kafka consumer degradation in production. They are deeply related: a single poison message that causes a consumer to crash repeatedly will cause lag to grow indefinitely on that partition, while other partitions stay healthy — a failure mode that is surprisingly hard to detect without proper instrumentation.

This guide covers both in depth: the mechanics, the diagnostics, the mitigation strategies, and the production patterns for handling each.

---

## Part 1 — Consumer Lag

### 1.1 What Is Consumer Lag?

Consumer lag is the number of messages a consumer group has **not yet processed** in a partition. It is the difference between the latest message written to the partition (Log End Offset) and the last message the consumer committed as processed (Committed Offset).

```
Partition 0:

  Messages:   [m0][m1][m2][m3][m4][m5][m6][m7][m8][m9]
  Offsets:      0    1    2    3    4    5    6    7    8    9
                                    ▲                        ▲
                                    │                        │
                           Committed Offset = 4       Log End Offset (LEO) = 10
                           (consumer's next read)     (broker's next write)
                                    │                        │
                                    ◄──────── LAG = 6 ───────►
```

If lag is **0**, the consumer is fully caught up — it has processed every message the producer has written. If lag is **growing over time**, the consumer cannot keep pace with the producer's throughput and will eventually fall arbitrarily far behind.

### 1.2 Beginner Analogy — The Inbox

| Email Inbox | Kafka |
|:---|:---|
| Emails arriving | Producers publishing messages |
| You reading and replying | Consumer processing messages |
| Unread email count | Consumer Lag |
| Inbox zero | Lag = 0 |
| Receiving 10 emails/hour, reading 7/hour | Lag growing by 3/hour |

If you receive 10 emails per hour but can only process 7 per hour, your unread count grows by 3 every hour. After 8 hours, you are 24 messages behind. At this rate, you will never catch up without either reading faster (optimize consumer) or having someone help you (scale consumers).

:::tip[Lag tells you *how far behind the consumer is*. It does not tell you *why*. Root cause requires diagnostics — covered in Section 1.5.]
:::

---

### 1.3 Offset Mechanics — Deep Dive

#### The Two Offset Pointers

For every partition in every consumer group, Kafka tracks two critical offsets:

```
Partition 0 state:
  ┌───────────────────────────────────────────────────────────┐
  │ Broker log:  [0][1][2][3][4][5][6][7][8][9]              │
  │                                              ↑             │
  │                                         LEO = 10           │
  │              Consumer committed offset: 4 ↑               │
  │              (consumer will poll offset 4 next)           │
  └───────────────────────────────────────────────────────────┘
  Lag = LEO − Committed Offset = 10 − 4 = 6
```

| Pointer | Maintained By | Definition |
|:---|:---|:---|
| **Log End Offset (LEO)** | Broker | Offset of the *next* message to be written. If 10 messages exist (offsets 0–9), LEO = 10. |
| **Committed Offset** | Consumer Group (stored in `__consumer_offsets` internal topic) | Offset of the *next* message the consumer will fetch. Committing offset 4 means "I have processed everything up to and including offset 3." |
| **Current Offset** | In-flight (not yet committed) | The offset the consumer is currently reading — may be ahead of the committed offset if auto-commit hasn't fired yet. |

#### Lag Formula

```
Partition Lag     = Log End Offset − Committed Offset
Total Group Lag   = Σ Partition Lag across all assigned partitions
```

#### The Persistent Lag-of-1 Explained

A persistent lag of exactly 1 per partition when the system is otherwise healthy is expected behavior, not a bug:

```
t=0: Producer writes message at offset 9. LEO becomes 10.
t=0: Consumer's committed offset is 9. Lag = 10 - 9 = 1.
t=1: Consumer polls, fetches offset 9, begins processing.
     Committed offset is still 9 until the consumer commits.
t=2: Consumer commits offset 10 (meaning "processed up to 9").
     Lag = 10 - 10 = 0.
t=3: Producer writes offset 10. LEO = 11. Lag = 11 - 10 = 1 again.
```

The lag of 1 is the message currently in-flight (fetched, being processed, not yet committed). It is normal and disappears the moment the consumer commits.

#### `__consumer_offsets` Internal Topic

Committed offsets are stored durably in Kafka's internal `__consumer_offsets` topic — not in ZooKeeper (deprecated) or in the consumer's memory. This means:

- Offset commits survive consumer restarts.
- Offset state is consistent across all consumer instances in the group.
- The broker can calculate lag server-side by comparing LEO to the committed offset from `__consumer_offsets`.

```bash
# Inspect raw offset commits for a group (advanced debugging)
kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 \
    --topic __consumer_offsets \
    --formatter "kafka.coordinator.group.GroupMetadataManager\$OffsetsMessageFormatter" \
    --from-beginning | grep "payment-processor"
```

#### Auto-Commit vs Manual Commit — Impact on Lag Accuracy

```properties
# AUTO-COMMIT (default — risky for lag accuracy)
enable.auto.commit=true
auto.commit.interval.ms=5000  # Commits every 5 seconds regardless of processing state
```

With auto-commit, the committed offset advances on a timer. If the consumer is processing a batch of 500 records but auto-commit fires after 5 seconds, offsets are committed before all records are processed. On crash and restart, those records are skipped — creating **data loss** — and lag metrics undercount real outstanding work.

```properties
# MANUAL COMMIT (recommended for production)
enable.auto.commit=false
```

```java
@KafkaListener(topics = "payments", groupId = "payment-processor")
public void process(List<ConsumerRecord<String, PaymentEvent>> records,
                    Acknowledgment ack) {
    for (ConsumerRecord<String, PaymentEvent> record : records) {
        processRecord(record);
    }
    ack.acknowledge();  // Commit only AFTER all records in the batch are processed
}
```

With manual commit, lag accurately reflects unprocessed work — the committed offset only advances when the consumer has genuinely finished processing.

---

### 1.4 How to Monitor Lag

#### CLI — `kafka-consumer-groups.sh`

```bash
# Describe lag for a specific consumer group
kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 \
    --group payment-processor \
    --describe

# OUTPUT:
# GROUP              TOPIC     PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG    CONSUMER-ID               HOST
# payment-processor  payments  0          1234            1240            6      consumer-1-abc123         /10.0.1.5
# payment-processor  payments  1          5678            5678            0      consumer-2-def456         /10.0.1.6
# payment-processor  payments  2          9100            9250            150    consumer-3-ghi789         /10.0.1.7

# Partition 2 has lag=150 while partitions 0 and 1 are near zero
# This asymmetric pattern is a classic sign of a slow consumer on one partition,
# or a poison message stuck on partition 2 (see Part 2)
```

```bash
# List all consumer groups and their overall lag (useful for dashboards)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list | \
    xargs -I{} kafka-consumer-groups.sh \
        --bootstrap-server localhost:9092 \
        --group {} --describe 2>/dev/null | \
    awk 'NR>1 {lag+=$6} END {print "Total lag:", lag}'

# Reset offsets (use with caution — this skips messages!)
kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 \
    --group payment-processor \
    --topic payments \
    --reset-offsets \
    --to-latest \          # Options: --to-earliest, --to-offset N, --by-duration PT1H
    --execute
```

#### JMX Consumer Metrics

| Metric | Description | Alert Threshold |
|:---|:---|:---|
| `records-lag-max` | Maximum lag across all assigned partitions | > configured threshold (e.g. 10,000) |
| `records-lag` (per partition) | Lag for a specific partition | Asymmetric lag = single partition issue |
| `records-consumed-rate` | Records processed per second | Drop → consumer slowing down |
| `fetch-rate` | Poll calls per second | Drop → consumer may be stuck |
| `commit-rate` | Offset commits per second | Near zero → commits not happening |
| `rebalance-rate-and-time` | Rebalance frequency | Frequent rebalances = instability |
| `join-time-avg` | Average time to rejoin after rebalance | Long times = slow consumer startup |

#### Prometheus + Grafana with Kafka Lag Exporter

```yaml
# prometheus-rules.yml — alert on growing lag
groups:
  - name: kafka-consumer-lag
    rules:
      # Warning: lag > 10,000 for 5 minutes
      - alert: KafkaConsumerLagHigh
        expr: kafka_consumer_group_lag{group="payment-processor"} > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Consumer group {{ $labels.group }} partition {{ $labels.partition }} lag {{ $value }}"

      # Critical: lag growing (rate increasing) for 10 minutes
      - alert: KafkaConsumerLagGrowing
        expr: >
          rate(kafka_consumer_group_lag{group="payment-processor"}[5m]) > 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Lag growing continuously — consumer cannot keep up"

      # Critical: consumer not committing (potential poison message stall)
      - alert: KafkaConsumerNotProgressing
        expr: >
          increase(kafka_consumer_group_current_offset{group="payment-processor"}[10m]) == 0
          and
          kafka_consumer_group_lag{group="payment-processor"} > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Consumer offset not advancing — possible poison message or crash loop"
```

#### Asymmetric Lag — The Key Diagnostic Signal

```
Healthy lag distribution (evenly spread):
  Partition 0:  lag = 200   ← all roughly equal = producer throughput issue
  Partition 1:  lag = 195
  Partition 2:  lag = 210
  → Scale consumers or optimize processing

Unhealthy lag distribution (single partition stuck):
  Partition 0:  lag = 5     ← 0 and 1 are fine
  Partition 1:  lag = 3
  Partition 2:  lag = 850   ← and growing → single partition issue
  → Likely poison message on partition 2, or consumer for partition 2 has crashed
```

When lag is isolated to one or two partitions while others are at zero, the problem is almost never overall throughput — it is almost always a specific message, a specific consumer instance, or a specific downstream dependency that affects only some partitions.

---

### 1.5 Root Cause Diagnosis Framework

```
Consumer lag is increasing
            │
            ▼
Is lag growing uniformly across ALL partitions?
            │
     ┌──────┴──────┐
     │ YES          │ NO (one or few partitions affected)
     ▼              ▼
Did produce rate  → Partition-specific issue
also increase?       ├── Is the consumer for that partition
     │               │   in a crash loop (restarting repeatedly)?
  ┌──┴──┐            │   └── YES → Likely POISON MESSAGE (see Part 2)
  │YES  │NO          │
  ▼     ▼            ├── Is the consumer alive but not committing?
Traffic Consumer      │   └── YES → Processing stall (DB timeout, OOM,
spike   is slowing        │         infinite loop, blocking lock)
        │                 │
        └──────────────── └── Is the partition reassigned to a slow host?
                                └── YES → Uneven partition distribution
                                          or hardware degradation
└─ Slow consumer root causes:
   ├── Processing logic slow (DB writes, API calls, heavy computation)
   ├── GC pauses — check GC logs, p99 pause times
   ├── Thread pool exhaustion — all threads blocked on downstream
   ├── Connection pool exhaustion — DB connections all in use
   └── max.poll.interval.ms exceeded → broker evicts consumer → rebalance
```

### Root Cause Reference Table

| Root Cause | Diagnostic Signal | Fix |
|:---|:---|:---|
| **Slow processing logic** | `records-lag-max` growing, produce rate stable, consumer CPU high | Batch DB writes, cache API calls, optimize hot path |
| **Traffic spike (normal)** | Lag and produce rate increase together | Scale consumers temporarily; use auto-scaling |
| **Consumer crash / OOM** | Pod restart events, lag jumps after restart then recovers | Fix crash root cause; add heap monitoring |
| **Poison message** | One partition's lag grows, consumer restarts repeatedly, offset never advances | DLQ routing, skip + alert, per-record try/catch (see Part 2) |
| **Rebalance storm** | Lag spikes every few minutes, correlated with rebalance events | Use `CooperativeStickyAssignor`, tune `session.timeout.ms` |
| **GC pause** | Lag spikes correlate with GC log pause times >100ms | Tune JVM heap, switch to ZGC / Shenandoah |
| **`max.poll.interval.ms` exceeded** | Consumer evicted from group, rebalance triggered, lag spike | Increase `max.poll.interval.ms`, reduce `max.poll.records`, offload heavy work to thread pool |
| **Downstream bottleneck** | Processing time grows, downstream DB/API latency high | Circuit breaker, connection pool sizing, add retry with backoff |
| **Network issue** | High `fetch-latency-avg`, consumer↔broker round-trip slow | Rack-aware consumer assignment, check network paths |
| **Uneven partition assignment** | Some partitions have 0 consumers (host crashed, not rebalanced) | Force rebalance, check consumer group health |

---

### 1.6 Scaling and Performance Strategies

#### Strategy 1 — Optimize Processing Before Scaling

Scale-out is not always the answer. Profile the consumer first:

```java
// ❌ Anti-pattern: one DB round-trip per message
@KafkaListener(topics = "payments")
public void process(ConsumerRecord<String, PaymentEvent> record) {
    paymentRepository.save(toEntity(record.value()));  // N round-trips for N messages
}

// ✅ Pattern: batch writes — one round-trip for many messages
private final List<PaymentEntity> buffer = new ArrayList<>();
private static final int BATCH_SIZE = 500;

@KafkaListener(topics = "payments")
public void process(List<ConsumerRecord<String, PaymentEvent>> records,
                    Acknowledgment ack) {
    for (ConsumerRecord<String, PaymentEvent> record : records) {
        buffer.add(toEntity(record.value()));
    }
    if (buffer.size() >= BATCH_SIZE) {
        paymentRepository.saveAll(buffer);  // 1 round-trip for 500 messages
        buffer.clear();
    }
    ack.acknowledge();
}
```

**Common optimization wins before scaling:**
- Batch DB writes (`saveAll` vs per-record `save`)
- Cache external API lookups (user profile, product catalog) — these are often called once per message
- Parallelize independent enrichment steps within a record
- Remove blocking I/O from the consumer thread (delegate to async executor, wait for results)

#### Strategy 2 — Scale Consumers Horizontally

```
10-partition topic "payments":

Before (2 consumers, 5 partitions each):
  Consumer A: [P0, P1, P2, P3, P4]  ← each handling 5 partitions, possibly overloaded
  Consumer B: [P5, P6, P7, P8, P9]

After (5 consumers, 2 partitions each):
  Consumer A: [P0, P1]  ← each handling 2 partitions, lower per-consumer load
  Consumer B: [P2, P3]
  Consumer C: [P4, P5]
  Consumer D: [P6, P7]
  Consumer E: [P8, P9]
```

:::warning[Consumer count cannot exceed partition count. A consumer group with more consumers than partitions will have idle consumers doing no work. The maximum parallelism for a consumer group is bounded by the number of partitions. If you need more consumer parallelism, increase partitions first — but note that partition count changes on existing topics require careful coordination.]
:::

#### Strategy 3 — Tune Fetch Configuration

```properties
# How much data to fetch per request (increase to reduce small fetches)
fetch.min.bytes=1048576         # 1MB — wait for at least 1MB before returning
fetch.max.wait.ms=500           # But wait no longer than 500ms

# Records per poll() call — balance batch size vs processing time per poll
max.poll.records=1000           # Increase for high-throughput batch consumers
                                # Decrease for low-latency or slow-processing consumers

# Time between poll() calls allowed before broker evicts consumer
max.poll.interval.ms=600000     # 10 minutes — increase if processing is legitimately slow
                                # Must be > (max.poll.records × avg processing time per record)

# Max bytes fetched per partition per request
max.partition.fetch.bytes=1048576   # 1MB per partition
```

**`max.poll.interval.ms` is a critical safety valve:**

```
Consumer fetches 1000 records. Processing takes 11 minutes total.
max.poll.interval.ms = 10 minutes (600000ms).

At t=10min: broker has not received a poll() from this consumer in 10 minutes.
           Broker assumes consumer is dead → triggers rebalance.
           Partitions reassigned to other consumers.
           Consumer tries to commit at t=11min → COMMIT REJECTED (no longer group member).
           All 1000 records are re-delivered to the new consumer → potential duplicates.

Fix options:
  1. Increase max.poll.interval.ms to 15 minutes (720000ms) — if processing is legitimately slow
  2. Reduce max.poll.records to 200 records — ensures each poll() completes faster
  3. Process records asynchronously and poll() more frequently (advanced — see below)
```

#### Strategy 4 — Async Processing with Safe Offset Management

```java
// ❌ DANGEROUS: fire-and-forget async — offset committed before work is done
@KafkaListener(topics = "events")
public void process(List<ConsumerRecord<String, Event>> records) {
    for (var record : records) {
        executor.submit(() -> processAsync(record));  // dispatched but not awaited
    }
    // Spring auto-commits here — but async tasks may still be running!
    // If app crashes, in-flight messages are LOST
}

// ✅ SAFE: wait for all async tasks to complete before committing
@KafkaListener(topics = "events")
public void process(List<ConsumerRecord<String, Event>> records, Acknowledgment ack) {
    List<CompletableFuture<Void>> futures = records.stream()
        .map(record -> CompletableFuture.runAsync(() -> processAsync(record), executor))
        .toList();

    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    ack.acknowledge();  // All tasks complete → safe to commit
}
```

**Advanced: per-partition offset tracking for granular commits:**

```java
// Commit the highest processed offset per partition
// Useful when some records in a batch succeed and some fail
@KafkaListener(topics = "events")
public void process(List<ConsumerRecord<String, Event>> records,
                    Consumer<?, ?> consumer) {
    Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();

    for (ConsumerRecord<String, Event> record : records) {
        try {
            processRecord(record);
            // Track the highest successfully processed offset per partition
            offsets.put(
                new TopicPartition(record.topic(), record.partition()),
                new OffsetAndMetadata(record.offset() + 1)
            );
        } catch (Exception e) {
            log.error("Failed record at offset {}/{} — stopping batch at this point",
                record.partition(), record.offset(), e);
            break;  // Stop processing; commit what succeeded so far
        }
    }

    if (!offsets.isEmpty()) {
        consumer.commitSync(offsets);  // Commit only the successfully processed offsets
    }
}
```

#### Strategy 5 — Increase Partitions (With Caveats)

```bash
# Increase partition count for a topic — only affects NEW messages
# Existing messages stay on their current partitions
kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --topic payments \
    --alter \
    --partitions 20    # Increasing from 10 to 20

# After increasing partitions:
# 1. Redeploy consumers — they will rebalance and pick up new partitions
# 2. Scale consumer instances to match (up to 20 now)
# 3. Note: key-based partitioning changes — same key may land on different partition
#    This breaks ordering guarantees for consumers that depended on key-per-partition ordering
```

:::warning[Increasing partition count changes which partition messages with the same key are routed to. If your consumer depends on "all messages for customer-X are always on the same partition" (a common pattern for ordering guarantees), adding partitions breaks this guarantee for new messages. Re-keyed messages may arrive before or after older messages on the original partition. Design your system for this before increasing partitions.]
:::

---

### 1.7 Rebalance Storms — A Major Lag Amplifier

A rebalance reassigns partitions among consumers. During a rebalance, **all consumers in the group stop processing** — triggering a lag spike on every partition. A system that rebalances frequently will have continuously degraded throughput and spiking lag.

```
Timeline of a Kafka consumer group rebalance (eager rebalancing):

t=0s    Consumer C crashes. Broker detects after session.timeout.ms.
t=5s    Broker triggers rebalance. ALL consumers receive "stop fetching" signal.
t=5s    All consumers pause. Lag grows on every partition.
t=8s    Consumers send JoinGroup requests.
t=10s   Leader consumer sends SyncGroup with new partition assignment.
t=12s   All consumers receive new assignment. Resume fetching.
        Total pause: ~7 seconds.

With 100k msg/sec produce rate and 7s pause:
    Lag accumulated during rebalance = 100,000 × 7 = 700,000 messages
```

#### Cooperative Sticky Assignor — The Fix for Rebalance Storms

```properties
# Spring Kafka — use CooperativeStickyAssignor to minimize rebalance impact
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

```
Eager rebalance (default EagerAssignor):
    1. ALL consumers revoke ALL partitions
    2. ALL consumers pause processing
    3. Leader reassigns ALL partitions
    4. ALL consumers resume
    → Full processing stop = lag spike proportional to number of partitions

Cooperative Sticky rebalance:
    1. Only the partitions that need to move are revoked
    2. Only the affected consumers pause momentarily
    3. Non-moving partitions continue processing without interruption
    4. Total pause is minimal — often < 1 second
    → Near-zero lag spike for most rebalances
```

#### Tuning Session and Heartbeat Timeouts

```properties
# Heartbeat interval — how often consumer sends "I'm alive" to broker
heartbeat.interval.ms=3000          # 3 seconds (default)

# Session timeout — how long broker waits before declaring consumer dead
session.timeout.ms=45000            # 45 seconds — must be > 3× heartbeat interval

# Max time between poll() calls — independent of heartbeat
max.poll.interval.ms=600000         # 10 minutes — for slow-processing consumers

# The relationship:
# heartbeat.interval.ms < session.timeout.ms / 3
# session.timeout.ms < max.poll.interval.ms (usually)
```

**Why `session.timeout.ms` and `max.poll.interval.ms` are separate:**

The heartbeat is sent on a background thread. The poll interval tracks the main consumer thread. A consumer with a healthy heartbeat but a stalled main thread (processing one record for too long) will be evicted via `max.poll.interval.ms`, not `session.timeout.ms`. Confusing these two settings is a common source of unexpected rebalances.

---

## Part 2 — Poison Messages

### 2.1 What Is a Poison Message?

A poison message (also called a poison pill) is a message that **consistently causes the consumer to fail when it tries to process it**. Because Kafka consumers commit offsets only after successful processing, a poison message at offset N causes the consumer to retry offset N indefinitely — the offset never advances, lag on that partition grows without bound, and the consumer often enters a crash loop.

```
Partition 0 offset sequence:

  [0: OK][1: OK][2: OK][3: POISON][4: OK][5: OK][6: OK]...
                              ▲
                        Consumer crashes here.
                        Restarts, reads offset 3 again.
                        Crashes again. Restarts.
                        Repeat indefinitely.

  Consumer committed offset: 3 (never moves)
  Log End Offset: growing as producer writes 4, 5, 6, ...
  Lag on partition 0: growing unboundedly

  Meanwhile, partitions 1, 2, 3... may be at lag = 0
  (different consumers handle those partitions)
```

### 2.2 Why Poison Messages Are Hard to Detect

The insidious nature of a poison message problem:

1. **Asymmetric lag**: Only one partition is affected. Overall group lag metrics may look acceptable because other partitions are healthy. Per-partition lag is required to detect this.
2. **Consumer appears alive**: The consumer is heartbeating, passing liveness checks, and even logging activity. It is not "down" — it is stuck.
3. **Offset not advancing**: The only reliable signal is that the committed offset for that partition does not advance over time despite the consumer being alive.
4. **No alert fires**: If alerts are only on total lag (not "offset not advancing"), the incident can go undetected for hours.

**The key alert that catches poison messages (see monitoring section above):**

```promql
# Alert: consumer is alive, lag exists, but offset not advancing
increase(kafka_consumer_group_current_offset{group="payment-processor"}[10m]) == 0
and
kafka_consumer_group_lag{group="payment-processor"} > 0
```

### 2.3 Root Causes of Poison Messages

| Cause | Example | Why Retrying Never Helps |
|:---|:---|:---|
| **Malformed payload** | Invalid JSON, truncated protobuf, wrong encoding | The bytes are always wrong — retrying parses the same bytes |
| **Schema version mismatch** | Producer sends schema v2, consumer compiled against v1 | The schema never changes mid-message |
| **Business rule violation** | `orderId=null`, negative amount, referential integrity failure | The business data is invalid — no amount of retrying fixes it |
| **Missing dependency** | Consumer tries to enrich from a service that no longer has the referenced entity | The enrichment will always fail for this specific ID |
| **Corrupt message** | Broker storage corruption, partial write, bit flip | The message content is irreparably wrong |
| **Code bug (version mismatch)** | New consumer deployed, old messages use a field the new code can't handle | All old messages of that type are now poison |

### 2.4 Handling Strategies

The four strategies for handling poison messages, from simplest to most robust:

#### Strategy 1 — Per-Record Try/Catch (Least Safe, Simplest)

Wrap each record's processing in a try/catch. Log the failure and continue to the next record. The poison message is acknowledged and skipped permanently.

```java
@KafkaListener(topics = "payments", groupId = "payment-processor")
public void process(List<ConsumerRecord<String, PaymentEvent>> records,
                    Acknowledgment ack) {
    for (ConsumerRecord<String, PaymentEvent> record : records) {
        try {
            paymentService.process(record.value());
        } catch (Exception e) {
            // DECISION POINT: Log and skip, or route to DLQ?
            log.error("Poison message detected at partition={} offset={} key={}. Skipping. Error: {}",
                record.partition(), record.offset(), record.key(), e.getMessage(), e);
            // Message is skipped — offset will be committed by the ack below
            // The message content is permanently lost from the consumer's perspective
            alertingService.sendAlert("POISON_MESSAGE_SKIPPED",
                "topic=" + record.topic() + " partition=" + record.partition() +
                " offset=" + record.offset());
        }
    }
    ack.acknowledge();  // Commits offset past the poison message
}
```

**When to use**: only when the message content is truly unrecoverable and losing it is acceptable (e.g., analytics events, metrics, telemetry where individual message loss has no business impact).

**When NOT to use**: financial transactions, order creation, any event where losing a message causes data inconsistency.

#### Strategy 2 — Dead Letter Queue (DLQ) Routing (Recommended for Production)

Route failing messages to a separate DLQ topic for human review and reprocessing, rather than discarding them.

```
Main flow:
  payments topic → consumer processes → success → commit offset → continue

Poison message detected:
  payments topic → consumer fails → route to payments.DLQ topic → commit offset → continue

DLQ workflow:
  payments.DLQ topic → engineer reviews → root cause fixed →
  messages redriven to payments topic → reprocessed successfully
```

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentConsumer {

    private final PaymentService paymentService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String DLQ_TOPIC_SUFFIX = ".DLQ";
    private static final int MAX_RETRY_ATTEMPTS  = 3;

    @KafkaListener(topics = "payments", groupId = "payment-processor")
    public void process(ConsumerRecord<String, PaymentEvent> record,
                        Acknowledgment ack) {

        int attempt = 0;
        Exception lastException = null;

        // Immediate retry loop (for transient errors — network blips, lock contention)
        while (attempt < MAX_RETRY_ATTEMPTS) {
            try {
                paymentService.process(record.value());
                ack.acknowledge();  // Success — advance offset
                return;
            } catch (TransientException e) {
                attempt++;
                lastException = e;
                log.warn("Transient failure, attempt {}/{} for offset={}/{}: {}",
                    attempt, MAX_RETRY_ATTEMPTS, record.partition(), record.offset(), e.getMessage());
                sleepBriefly(attempt); // Simple backoff: 100ms, 200ms, 400ms
            } catch (PermanentException e) {
                // Non-retryable — go straight to DLQ, don't burn retries
                routeToDlq(record, e, ack);
                return;
            }
        }

        // All retries exhausted — route to DLQ
        routeToDlq(record, lastException, ack);
    }

    private void routeToDlq(ConsumerRecord<String, PaymentEvent> record,
                             Exception cause,
                             Acknowledgment ack) {
        String dlqTopic = record.topic() + DLQ_TOPIC_SUFFIX;

        // Preserve original message metadata in headers for traceability
        ProducerRecord<String, Object> dlqRecord = new ProducerRecord<>(
            dlqTopic, record.key(), record.value()
        );
        dlqRecord.headers()
            .add("X-Original-Topic",     record.topic().getBytes())
            .add("X-Original-Partition", String.valueOf(record.partition()).getBytes())
            .add("X-Original-Offset",    String.valueOf(record.offset()).getBytes())
            .add("X-Error-Message",      cause.getMessage().getBytes())
            .add("X-Error-Class",        cause.getClass().getName().getBytes())
            .add("X-Failed-At",          Instant.now().toString().getBytes())
            .add("X-Consumer-Group",     "payment-processor".getBytes());

        kafkaTemplate.send(dlqRecord)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    // DLQ send failed — do NOT commit the offset
                    // Message will be retried (risk: keeps consumer stuck if DLQ is also down)
                    log.error("CRITICAL: Failed to route message to DLQ topic {}. Not committing offset.", dlqTopic, ex);
                } else {
                    log.warn("Poison message routed to DLQ: topic={} partition={} offset={} dlqOffset={}",
                        record.topic(), record.partition(), record.offset(),
                        result.getRecordMetadata().offset());
                    ack.acknowledge();  // Advance offset — message is preserved in DLQ
                }
            });
    }

    private void sleepBriefly(int attempt) {
        try { Thread.sleep(100L * (1L << (attempt - 1))); } // 100ms, 200ms, 400ms
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
```

#### Strategy 3 — Retry Topics (Delayed Retry Pattern)

Instead of retrying immediately (which puts a stuck message at the front of the queue), route failing messages to intermediate retry topics with increasing delays. The message is re-delivered after the delay, giving dependent systems time to recover.

```
Retry topology:
  payments           → fails → payments.retry-1 (delay: 1 min)
  payments.retry-1   → fails → payments.retry-2 (delay: 5 min)
  payments.retry-2   → fails → payments.retry-3 (delay: 30 min)
  payments.retry-3   → fails → payments.DLQ     (give up, alert)
```

```java
@Configuration
public class RetryTopicConfig {

    @Bean
    public RetryTopicConfiguration paymentRetryTopicConfig(KafkaTemplate<String, Object> template) {
        return RetryTopicConfigurationBuilder
            .newInstance()
            .fixedBackOff(60_000)              // 1 minute between retries
            .maxAttempts(4)                    // 1 original + 3 retries before DLQ
            .includeTopic("payments")
            .retryTopicSuffix("-retry")
            .dltSuffix("-DLQ")
            // Only retry on transient exceptions — route permanent ones to DLQ immediately
            .retryOn(TransientException.class)
            .notRetryOn(PermanentException.class, DeserializationException.class)
            .create(template);
    }
}
```

With Spring Kafka's `@RetryableTopic`:

```java
@RetryableTopic(
    attempts = "4",
    backoff = @Backoff(delay = 60_000, multiplier = 5.0, maxDelay = 1_800_000),
    // delays: 1min, 5min, 30min — then DLQ
    autoCreateTopics = "false",  // Create topics via IaC, not automatically
    dltStrategy = DltStrategy.FAIL_ON_ERROR,  // If DLQ send fails, don't skip
    retryTopicSuffix = "-retry",
    dltTopicSuffix = "-DLQ"
)
@KafkaListener(topics = "payments")
public void process(PaymentEvent event) {
    paymentService.process(event);  // Exceptions trigger retry routing automatically
}

@DltHandler
public void handleDlt(PaymentEvent event,
                      @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                      @Header(KafkaHeaders.EXCEPTION_MESSAGE) String errorMessage) {
    log.error("Message reached DLQ. Topic: {}, Error: {}, Event: {}", topic, errorMessage, event);
    alertingService.sendDlqAlert(topic, event.getOrderId(), errorMessage);
    // Optionally: persist to database for ops dashboard visibility
    dlqAuditRepository.save(new DlqEntry(event.getOrderId(), topic, errorMessage, Instant.now()));
}
```

**Retry topic vs immediate retry — when each is appropriate:**

| Pattern | When to Use | Risk |
|:---|:---|:---|
| **Immediate retry in-consumer** | Transient errors that resolve in milliseconds (network blip, lock timeout) | Keeps consumer thread busy during retry; risks `max.poll.interval.ms` breach |
| **Retry topic (delayed)** | Errors that require downstream system recovery time (service restart, DB overload) | Adds delay for legitimate failures; more complex topic management |
| **DLQ only (no retry)** | Permanent errors (schema mismatch, invalid data, code bug) | Message requires manual intervention; no automatic recovery |

#### Strategy 4 — Resilience4j on the Consumer (Structured Retry + Circuit Breaker)

For consumers making external HTTP calls or DB writes that may fail transiently, integrate Resilience4j for structured retry with circuit breaker protection:

```java
@Service
@RequiredArgsConstructor
public class PaymentProcessorService {

    private final ExternalPaymentGateway gateway;
    private final CircuitBreakerRegistry cbRegistry;
    private final RetryRegistry retryRegistry;

    public void process(PaymentEvent event) {
        CircuitBreaker circuitBreaker = cbRegistry.circuitBreaker("paymentGateway");
        Retry retry = retryRegistry.retry("paymentGateway");

        // Retry wraps the call; CircuitBreaker wraps the retry
        // If the gateway is persistently down, CB opens — subsequent calls fail immediately
        // without burning retry attempts, protecting the consumer's poll interval
        Callable<Void> decoratedCall = CircuitBreaker.decorateCallable(
            circuitBreaker,
            Retry.decorateCallable(
                retry,
                () -> { gateway.charge(event); return null; }
            )
        );

        try {
            decoratedCall.call();
        } catch (CallNotPermittedException e) {
            // Circuit breaker is open — downstream is down
            // Throw to trigger retry-topic routing (not a permanent failure)
            throw new TransientException("Payment gateway circuit open", e);
        } catch (Exception e) {
            // Retry exhausted or permanent failure
            if (isPermanent(e)) throw new PermanentException("Permanent payment failure", e);
            throw new TransientException("Transient payment failure after retries", e);
        }
    }
}
```

---

### 2.5 Deserialization Failures — A Special Poison Message Case

Deserialization failures are distinct from processing failures: the message bytes cannot even be parsed into an object, so the consumer's `process()` method never runs. Spring Kafka handles these separately.

```java
@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, PaymentEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092");

        // ErrorHandlingDeserializer wraps the real deserializer
        // On deserialization failure: creates a special DeserializationException
        // that the error handler can route to DLQ instead of crashing the consumer
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);

        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.example.events");
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> kafkaListenerContainerFactory(
            ConsumerFactory<String, PaymentEvent> consumerFactory,
            KafkaTemplate<String, Object> kafkaTemplate) {

        ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);

        // DefaultErrorHandler: retries N times, then routes to DLQ
        // BackOff: 3 retries with 1-second delay between attempts
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                new DeadLetterPublishingRecoverer(kafkaTemplate,
                        (record, ex) -> new TopicPartition(record.topic() + ".DLQ", record.partition())),
                new FixedBackOff(1000L, 3L)  // 3 retries, 1s apart
        );

        // Immediately DLQ deserialization errors — retrying will never fix them
        errorHandler.addNotRetryableExceptions(DeserializationException.class);

        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }
}
```

### 2.6 DLQ Operations — Monitoring and Redriving

The DLQ is only useful if it is monitored and messages are eventually redriven:

```yaml
# Alert: messages accumulating in DLQ
- alert: KafkaDlqMessagesAccumulating
  expr: kafka_topic_partition_current_offset{topic=~".*\\.DLQ"} > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "DLQ {{ $labels.topic }} has {{ $value }} unprocessed messages"

- alert: KafkaDlqGrowing
  expr: rate(kafka_topic_partition_current_offset{topic=~".*\\.DLQ"}[5m]) > 0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "DLQ {{ $labels.topic }} is actively receiving new messages"
```

```bash
# Inspect DLQ messages — see what failed and why
kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 \
    --topic payments.DLQ \
    --from-beginning \
    --property print.headers=true \
    --property print.key=true \
    --max-messages 10

# After fixing the root cause: redrive DLQ messages back to the main topic
# Option 1: Mirror DLQ → main topic (careful: may reintroduce same errors if fix not deployed)
kafka-mirror-maker.sh \
    --consumer.config dlq-consumer.properties \
    --producer.config main-producer.properties \
    --whitelist "payments.DLQ"

# Option 2: Use a purpose-built DLQ redrive script / tool
# (e.g., kafka-dlq-redrive, AWS SQS redrive, custom Spring Boot admin)
```

---

### 2.7 Poison Message + Lag: Combined Decision Guide

```
Consumer lag alert fires
            │
            ▼
Is lag uniform across ALL partitions?
            │
     ┌──────┴──────────────────────────────┐
     │ YES (all partitions lagging)         │ NO (one or few partitions lagging)
     ▼                                      ▼
Scale consumer or fix throughput    Is the consumer for that partition
(see Part 1 strategies)             restarting repeatedly?
                                            │
                                     ┌──────┴──────┐
                                     │ YES          │ NO
                                     ▼              ▼
                               POISON MESSAGE   Partition-specific bottleneck
                               SUSPECTED        (slow DB, network, host issue)
                                     │
                                     ▼
                        Is the error a DeserializationException?
                                     │
                              ┌──────┴──────┐
                              │ YES          │ NO
                              ▼              ▼
                       Skip/DLQ immediately  Is the error transient
                       (retrying cannot      or permanent?
                        fix bad bytes)               │
                                            ┌─────────┴──────────┐
                                            │ TRANSIENT           │ PERMANENT
                                            ▼                    ▼
                                      Retry topic          Skip + DLQ immediately
                                      with backoff         (retrying won't help)
```

---

## Part 3 — Interview Questions

**Q: What is consumer lag and why does it matter?**

> Consumer lag is the difference between the Log End Offset (LEO) and the consumer group's committed offset for a partition — the number of messages not yet processed. A growing lag means the consumer cannot keep pace with the producer, leading to stale data, SLA violations, and backpressure issues. Lag = 0 means fully caught up. Monitoring lag per-partition is essential because aggregate lag can mask a single partition that is completely stuck.

**Q: How is lag calculated, and where is the committed offset stored?**

> Per-partition lag = LEO − committed offset. Total group lag = sum across all assigned partitions. The committed offset is stored in Kafka's internal `__consumer_offsets` topic — not in the consumer's memory or ZooKeeper. This makes offset state durable, shared across all instances of a consumer group, and visible to the broker for server-side lag calculation.

**Q: Why might a consumer show persistent lag of 1?**

> The LEO is the offset of the *next* message to be written, and the committed offset is the *next* message to be read. If a message was just produced but not yet polled and committed by the consumer, the difference is 1. This is normal and expected — not a bug or a sign of a problem.

**Q: What is a poison message and how do you handle it?**

> A poison message is a message that consistently causes the consumer to fail on every processing attempt — the offset never advances, lag on that partition grows unboundedly, and the consumer often enters a crash loop. The key diagnostic signal is: "consumer is alive, lag exists, but committed offset has not advanced in N minutes." Handling strategies in order of safety: (1) per-record try/catch with skip — simplest but loses the message; (2) DLQ routing — preserves the message for investigation and redriving; (3) retry topics with exponential backoff — useful for transient failures that may self-resolve; (4) deserialization-specific handling with `ErrorHandlingDeserializer` — for bytes-level failures that no application-level retry can fix.

**Q: What happens when `max.poll.interval.ms` is exceeded?**

> The broker considers the consumer dead and removes it from the consumer group, triggering a rebalance. Its partitions are reassigned to other consumers. The evicted consumer will be allowed to rejoin on its next `poll()` call. If the processing is legitimately slow, the fix is either: increase `max.poll.interval.ms`, reduce `max.poll.records` to process fewer records per batch, or offload heavy processing to an async thread pool while keeping the consumer thread polling frequently.

**Q: What is the difference between `session.timeout.ms` and `max.poll.interval.ms`?**

> `session.timeout.ms` is how long the broker waits for a **heartbeat** before declaring the consumer dead — the heartbeat is sent by a background thread independently of processing. `max.poll.interval.ms` is how long the broker waits between **poll() calls** from the main consumer thread — this detects a consumer that is alive (heartbeating) but stuck processing one batch for too long. Both can trigger a rebalance and should be tuned together: `heartbeat.interval.ms < session.timeout.ms / 3`, and `session.timeout.ms < max.poll.interval.ms` for most configurations.

**Q: How do you prevent rebalance storms from spiking lag?**

> Use `CooperativeStickyAssignor` instead of the default eager assignor. Cooperative rebalancing only revokes partitions that need to move — partitions staying on the same consumer continue processing without interruption. With eager rebalancing, all partitions are revoked from all consumers at once, causing a processing stop across the entire consumer group for the duration of the rebalance.

**Q: You have a 10-partition topic with 3 consumers. Partition 7's lag is growing, while the other 9 partitions are at lag=0. What do you investigate first?**

> Asymmetric lag on a single partition while others are healthy points away from overall throughput issues. I would: (1) Check the consumer currently assigned to partition 7 — is it restarting repeatedly? If yes, this is likely a poison message. (2) Check the committed offset for partition 7 over the last 10 minutes — if it has not advanced at all, a poison message is almost certain. (3) Examine the consumer's logs for the specific error on that partition. (4) If a poison message is confirmed, route it to a DLQ and commit the offset past it to unblock the partition. (5) After unblocking, investigate the DLQ message to understand the root cause and prevent future occurrences.