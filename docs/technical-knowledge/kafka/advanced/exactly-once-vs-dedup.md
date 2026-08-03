---
id: exactly-once-vs-dedup
title: "Deduplication in Distributed Messaging — Kafka, Kafka Streams, RabbitMQ, SQS, Redis"
sidebar_label: Exactly-Once & Deduplication
description: "A comprehensive guide to preventing duplicate message processing across Kafka, Kafka Streams, RabbitMQ, SQS, and Redis — covering EOS internals, Kafka Streams State Store vs Redis architecture, idempotent consumers, and production deduplication patterns for senior engineers."
tags: [kafka, exactly-once, deduplication, idempotency, event-driven, kafka-streams, rabbitmq, sqs, redis, java, spring, rocksdb]
---

import KafkaDedupComparisonDiagram from '@site/src/components/KafkaDedupComparisonDiagram';

# Deduplication in Distributed Messaging

> **The core problem of distributed messaging in one sentence:** Any reliable system uses retries; any system with retries delivers messages more than once; any system that delivers messages more than once must handle duplicates — or it will corrupt business state.

There are two complementary and independent layers of defense:
- **Exactly-Once Semantics (EOS)** — a broker-level guarantee that the messaging infrastructure will not create duplicates *within its own boundary*.
- **Idempotent Consumers / Application Deduplication** — an application-level guarantee that processing the same message twice produces the same observable result, protecting everything *outside* the broker boundary.

Real production systems almost always need both. This guide explains how each works mechanically, how to implement them, and — most importantly — provides a deep analysis of the two dominant deduplication storage backends: **Kafka Streams State Store (RocksDB)** and **Redis**, covering their internals, trade-offs, failure modes, and when each is the right choice.

<KafkaDedupComparisonDiagram />

:::info[Who this guide is for]
- **New learners** — start at [Why Duplicates Happen](#1-why-duplicates-happen) and [The Three Delivery Guarantees](#2-the-three-delivery-guarantees).
- **Senior engineers** — the core of this guide is the [Kafka Streams State Store vs Redis Deep Dive](#7-kafka-streams-state-store-vs-redis-deep-dive), [Production Failure Modes](#11-senior-deep-dive-production-failure-modes), and the [Decision Matrix](#12-interview-decision-matrix).
:::

---

## 1. Why Duplicates Happen

### The Fundamental Trade-off

In any distributed system, you face an unavoidable dilemma:

**The key property**: messages from partition 0 always go to Instance A. RocksDB for partition 0 is always on Instance A. Lookups are always local — no network hop required.

### What Happens During a State Store Lookup

### What Happens During a Redis Deduplication Check

### Consistency Model — The Critical Difference

This is the most important architectural distinction between the two approaches.

#### Kafka Streams State Store: Transactionally Consistent

With `EXACTLY_ONCE_V2`, the state store update, output record write, and offset commit are **all part of one atomic Kafka transaction**:

There is no dual-write hazard. The state store and the offset are always consistent with each other because they commit together.

#### Redis: Eventual Consistency with Dual-Write Hazard

Redis is an external system. The Redis write and the Kafka offset commit are two separate network operations with no coordinator:

**Mitigations for rebuild latency:**

### Use Kafka Streams State Store (RocksDB) When

1. **Your pipeline is Kafka → processing → Kafka** (no external side effects). State store is the only option that provides transactional atomicity with the offset commit and output record — Redis cannot participate in a Kafka transaction.

2. **You need true exactly-once with `EXACTLY_ONCE_V2`**. State store updates are committed atomically with offsets. Redis updates cannot be.

3. **You want zero external infrastructure**. State store is embedded — no Redis cluster to provision, size, monitor, or pay for.

4. **Latency budget is extremely tight** (sub-millisecond per lookup). Local RocksDB block cache reads are 10–100× faster than Redis round-trips.

5. **Your state is small enough to rebuild quickly** (< 1M entries per partition) or you have `num.standby.replicas` configured.

6. **State is strictly partition-local** (no cross-partition or cross-service dedup needed).

### Use Redis When

1. **Your consumer writes to an external system** (database, REST API, email). Kafka EOS does not cover external writes. Redis provides a fast, shared dedup gate that works across any technology.

2. **Multiple services or components share dedup state**. An API gateway, a Kafka consumer, and a background worker all need to agree that event-123 was processed. Redis is the shared store.

3. **Startup and rebalance latency is a hard SLO**. A Redis-backed consumer starts processing immediately after connecting to Kafka, with no state rebuild. A Kafka Streams app with large state may be unavailable for minutes during a rebalance.

4. **Deduplication windows are very long** (7+ days, 30 days). Storing 30 days of event IDs in RocksDB on the container's local disk is operationally risky — disk pressure, slow rebuilds, state loss on disk failure. Redis TTL-based eviction is native and automatic.

5. **False-positive rate is acceptable and throughput is extreme** (millions/sec). Redis Bloom Filter uses 1/50th the memory of exact key storage with configurable false-positive rate.

6. **Your deployment model does not support local persistent storage**. Ephemeral containers without persistent volumes cannot host a reliable RocksDB state store.

### Side-by-Side Summary Table

| Dimension | Kafka Streams State Store | Redis | Winner |
|:---|:---|:---|:---|
| **Consistency with Kafka offset** | ✅ Atomic (same transaction) | ❌ Dual-write (separate ops) | State Store |
| **Latency per lookup** | ✅ Sub-millisecond (local disk/cache) | ⚠️ 1–5ms (network) | State Store |
| **Infrastructure overhead** | ✅ None (embedded) | ❌ Dedicated cluster required | State Store |
| **Cross-instance dedup** | ❌ Partition-local only | ✅ Globally shared | Redis |
| **Cross-service dedup** | ❌ Private to Streams app | ✅ Any service can access | Redis |
| **Rebalance / restart time** | ❌ Rebuild required (seconds–minutes) | ✅ Instant (zero rebuild) | Redis |
| **Native TTL eviction** | ❌ Manual (custom transformer) | ✅ Per-key TTL built-in | Redis |
| **Long dedup windows (30d+)** | ❌ Large local disk required | ✅ TTL-managed, predictable memory | Redis |
| **External system dedup** | ❌ Cannot cover external writes | ✅ Works for any consumer | Redis |
| **Memory efficiency** | ✅ Disk-backed; large datasets OK | ❌ All in RAM; expensive at scale | State Store |
| **Bloom filter support** | ❌ | ✅ RedisBloom module | Redis |
| **Operational simplicity** | ✅ No extra infra | ❌ Redis ops (cluster, backups, alerts) | State Store |

---

## 9. Combined Architecture: Multi-Layer Deduplication

In production at scale, the two approaches are layered: Kafka Streams handles the intra-Kafka dedup, and Redis handles the external-system dedup. This is the correct model for any pipeline that both processes streams and calls external APIs.

**Why two layers:**

- **Layer 1 (RocksDB)**: Reduces downstream queue depth — deduplication inside Kafka Streams means the output topic only receives unique events. This reduces the load on Redis and the external API.
- **Layer 2 (Redis)**: The consumer calls an external API that cannot participate in a Kafka transaction. Redis provides the idempotency gate for the external call. Even if a message is re-delivered to the consumer (rebalance, retry), Redis blocks the duplicate API call.

### Full Combined Implementation

```java
// Layer 1: Kafka Streams with RocksDB dedup (EOS)
@Configuration
@EnableKafkaStreams
public class StreamsDedupConfig {

    @Bean(name = KafkaStreamsDefaultConfiguration.DEFAULT_STREAMS_CONFIG_BEAN_NAME)
    public KafkaStreamsConfiguration streamsConfig() {
        return new KafkaStreamsConfiguration(Map.of(
            StreamsConfig.APPLICATION_ID_CONFIG,        "payment-dedup-pipeline",
            StreamsConfig.BOOTSTRAP_SERVERS_CONFIG,     "broker1:9092",
            StreamsConfig.PROCESSING_GUARANTEE_CONFIG,  StreamsConfig.EXACTLY_ONCE_V2,
            StreamsConfig.COMMIT_INTERVAL_MS_CONFIG,    100
        ));
    }

    @Bean
    public Topology paymentDeduplicationTopology(StreamsBuilder builder) {
        final String STORE = "payment-dedup-store";
        final Duration WINDOW = Duration.ofHours(24);

        builder.addStateStore(Stores.keyValueStoreBuilder(
                Stores.persistentKeyValueStore(STORE), Serdes.String(), Serdes.Long()));

        builder.stream("raw-payments", Consumed.with(Serdes.String(), paymentSerde()))
               .transform(() -> new DeduplicationTransformer(STORE, WINDOW), STORE)
               .filter((k, v) -> v != null)
               .to("deduplicated-payments", Produced.with(Serdes.String(), paymentSerde()));

        return builder.build();
    }
}
```

```java
// Layer 2: Consumer with Redis dedup for external API call
@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentGatewayConsumer {

    private final StringRedisTemplate redis;
    private final ExternalPaymentGateway gateway;

    private static final String PREFIX  = "payment:dedup:";
    private static final Duration TTL   = Duration.ofHours(24);

    @KafkaListener(topics = "deduplicated-payments", groupId = "payment-gateway-consumer")
    public void consume(PaymentEvent event, Acknowledgment ack) {
        String redisKey = PREFIX + event.getPaymentId();

        // Atomic SETNX with PROCESSING status
        Boolean isNew = redis.opsForValue().setIfAbsent(redisKey, "PROCESSING", TTL);

        if (Boolean.FALSE.equals(isNew)) {
            String status = redis.opsForValue().get(redisKey);
            if ("COMPLETED".equals(status)) {
                log.info("Payment {} already completed — skipping", event.getPaymentId());
            } else {
                log.warn("Payment {} in PROCESSING state — possible concurrent consumer", event.getPaymentId());
            }
            ack.acknowledge();
            return;
        }

        try {
            gateway.executeCharge(event.getAmount(), event.getDestinationAccount());
            // Update status to COMPLETED — important for crash-recovery detection
            redis.opsForValue().set(redisKey, "COMPLETED", TTL);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Payment gateway call failed for paymentId={}. Rolling back Redis lock.", event.getPaymentId(), e);
            redis.delete(redisKey);  // Allow retry
            throw e;
        }
    }
}
```

**The `PROCESSING` / `COMPLETED` status in Redis is critical**: if a consumer crashes after the external API call succeeds but before `ack.acknowledge()`, the Kafka offset is not committed. On restart, the same event is re-delivered. Without the `COMPLETED` status, the `SETNX` would find the old `PROCESSING` key and skip the event — but the external API already processed it and the consumer thinks it failed. The `COMPLETED` status tells the retry it was successfully processed, and the `ack.acknowledge()` advances the offset.

---

## 10. Idempotency Key Design

The idempotency key is the most critical and most overlooked aspect of deduplication. A poorly designed key causes over-deduplication (drops legitimate events) or under-deduplication (lets duplicates through).

### Design Principles

```
✅ Good idempotency keys:
   - Stable across retries (same logical event = same key, always)
   - Unique per business operation (not per transport delivery)
   - Include domain context, not just a UUID
   - DLQ-safe (stable even when event is redriven to a different topic)

❌ Bad idempotency keys:
   - Kafka offset alone (new offset on DLQ redrive)
   - SQS MessageId alone (new ID per delivery attempt)
   - UUID generated at send time (new UUID = no dedup on retry)
   - Timestamp alone (two events at same millisecond = false dedup)
```

### Key Design by Event Type

```java
// State-change events: entity ID + event type ensures uniqueness per logical transition
"order-placed-"   + orderId           // Only one OrderPlaced per order
"order-cancelled-" + orderId          // Only one OrderCancelled per order

// Action events: use the action's own transaction ID
"payment-"       + paymentTransactionId    // One charge per payment transaction
"transfer-"      + transferId              // One transfer per transfer record

// External API calls: client-generated, sent as header to the API
String idempotencyKey = "charge-" + orderId + "-attempt-1";
// Send as: Idempotency-Key: charge-ord-123-attempt-1
// Stripe/Adyen/etc. deduplicates on their side using this header

// Composite key when no single stable ID exists
String key = DigestUtils.sha256Hex(
    eventType + "|" + aggregateId + "|" + eventTimestamp.toEpochMilli()
);
```

---

## 11. Senior Deep Dive: Production Failure Modes

### 1. TOCTOU Race Condition (Most Common Bug)

Time-of-Check-to-Time-of-Use: the check and the action are not atomic — two concurrent threads both check, both find "not exists," and both proceed.

```java
// ❌ BROKEN — race window between check and insert
@KafkaListener(topics = "payments")
public void process(PaymentEvent event) {
    if (!processedEventRepo.existsById(event.getId())) {
        // Thread A: finds not exists → proceeds
        // Thread B: ALSO finds not exists → ALSO proceeds
        // Both threads call charge() → double charge!
        paymentGateway.charge(event);
        processedEventRepo.save(new ProcessedEvent(event.getId()));
    }
}

// ✅ FIXED — write the dedup record FIRST; unique constraint makes the second fail
@KafkaListener(topics = "payments")
@Transactional
public void process(PaymentEvent event) {
    try {
        // INSERT with PRIMARY KEY — second concurrent insert throws immediately
        processedEventRepo.save(new ProcessedEvent(event.getId()));
    } catch (DataIntegrityViolationException e) {
        log.debug("Duplicate payment suppressed: {}", event.getId());
        return;  // ACK by returning; offset advances
    }
    paymentGateway.charge(event);  // Only reached by the winner of the INSERT race
}
```

```java
// ❌ BROKEN Redis — two non-atomic operations
if (!redis.hasKey("dedup:" + eventId)) {     // Check
    redis.opsForValue().set("dedup:" + eventId, "1"); // Set — RACE WINDOW between these
    processEvent();
}

// ✅ FIXED Redis — single atomic SETNX operation
Boolean isNew = redis.opsForValue().setIfAbsent("dedup:" + eventId, "1", Duration.ofHours(24));
if (Boolean.TRUE.equals(isNew)) {
    processEvent();
}
```

### 2. TTL Expiry + Late DLQ Redrive

Dedup keys expire after TTL. DLQ messages can be redriven days later, after the TTL has expired.

```
Timeline:
t=0h:   OrderPlaced(id=123) processed → dedup key set, TTL=24h
t=25h:  Dedup key expires (TTL)
t=26h:  DLQ redrive: OrderPlaced(id=123) → dedup check: key not found → reprocessed → DOUBLE ORDER ❌

Mitigations:
  1. TTL > DLQ max retention (SQS max = 14 days → TTL = 15 days; trade-off: more memory)
  2. DB unique constraint as a second layer of defense (catches expired-TTL duplicates)
  3. DLQ redrive validates event was not already processed before requeueing
```

```java
@Transactional
public void process(OrderPlacedEvent event) {
    // Fast path: Redis (covers recent duplicates cheaply)
    if (!redis.opsForValue().setIfAbsent("dedup:" + event.getId(), "1", Duration.ofDays(7))) {
        return;
    }

    try {
        orderRepository.save(Order.from(event));  // UNIQUE(order_id) = second defense
    } catch (DataIntegrityViolationException e) {
        // Redis TTL expired + late DLQ redrive — caught by DB constraint
        log.warn("Late duplicate caught by DB constraint for order {}", event.getId());
        redis.opsForValue().set("dedup:" + event.getId(), "1", Duration.ofDays(7)); // Re-set TTL
    }
}
```

### 3. Kafka Streams State Rebuild Under High Load

A Kafka Streams instance receiving a large partition assignment during rebalance may take minutes to rebuild its state store from the changelog. During this window, that partition is not being processed.

```
Mitigation 1 — Standby replicas:
    num.standby.replicas=1
    Each partition's state is hot-copied on another instance.
    Failover: standby takes over with minimal additional rebuild.

Mitigation 2 — State store snapshots:
    Kafka Streams periodically snapshots state to local disk.
    Rebuild from snapshot + replay only the changelog delta → much faster.
    Configure: state.dir on fast NVMe disk.

Mitigation 3 — Limit state store size:
    Use windowed state stores with appropriate retention.
    Delete expired entries in the transformer (dedup window check + eviction).
    Smaller state = faster rebuild.

Mitigation 4 — Redis as dedup backend for long windows:
    If dedup window is 30 days (large state), use Redis instead of State Store.
    Trade EOS atomicity for faster rebalance. Add DB constraint as compensating control.
```

### 4. Deduplication Storage Growth

Without cleanup, `processed_events` tables and Redis keyspaces grow unboundedly.

```java
// Scheduled DB cleanup — partition table for O(1) bulk delete
@Scheduled(cron = "0 0 3 * * *")
@Transactional
public void cleanupProcessedEvents() {
    Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
    int deleted = processedEventRepo.deleteByProcessedAtBefore(cutoff);
    log.info("Cleaned {} dedup records older than {}", deleted, cutoff);
}
```

```sql
-- PostgreSQL partitioned table for zero-cost bulk cleanup
CREATE TABLE processed_events (
    event_id       VARCHAR(255) NOT NULL,
    processed_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    consumer_group VARCHAR(255) NOT NULL
) PARTITION BY RANGE (processed_at);

-- Drop an entire week of records in milliseconds — no full table scan
DROP TABLE processed_events_week_2024_w01;  -- O(1) vs O(N) DELETE
```

### 5. Observability — What to Monitor

```java
// Emit metrics from every dedup decision
@Component
@RequiredArgsConstructor
public class DeduplicationMetrics {

    private final MeterRegistry registry;

    public void recordDuplicate(String topic, String layer, String reason) {
        registry.counter("dedup.duplicate.detected",
            "topic", topic, "layer", layer, "reason", reason).increment();
    }

    public void recordNew(String topic, String layer) {
        registry.counter("dedup.event.processed",
            "topic", topic, "layer", layer).increment();
    }

    public void recordCheckLatency(String backend, long nanos) {
        registry.timer("dedup.check.duration", "backend", backend)
                .record(Duration.ofNanos(nanos));
    }
}
```

**Alert thresholds:**

| Metric | Alert Condition | Root Cause |
|:---|:---|:---|
| `dedup.duplicate.detected` rate spike | > 5% of events | Producer bug or upstream retry storm |
| `dedup.check.duration` p99 > 10ms (Redis) | Sustained | Redis cluster under pressure |
| `dedup.check.duration` p99 > 5ms (RocksDB) | Sustained | State store needs more block cache |
| `dedup.duplicate.detected` drops to 0 suddenly | Any | Dedup check may be bypassed by a bug |
| `processed_events` table rows > 50M | Any | Cleanup job not running |
| Redis `dedup:*` key count > expected | Any | TTL misconfiguration |
| Kafka Streams `rocksdb.bytes-written-rate` | Sudden spike | Compaction storm or large rebalance |

---

## 12. Interview Decision Matrix

| Scenario | Recommended Strategy | Key Reason |
|:---|:---|:---|
| Kafka → Kafka stream processing only | Kafka Streams State Store + `EXACTLY_ONCE_V2` | Atomic with offset commit and output; no extra infra |
| Kafka consumer → PostgreSQL write | DB unique constraint + `ON CONFLICT DO NOTHING` | Atomic; handles concurrent consumers; no extra infra |
| Kafka consumer → external REST API | Redis SETNX + business-level idempotency key + DB second layer | Fast check; API dedup must be at application layer |
| RabbitMQ with retries | Message ID header + Redis or DB dedup | No native dedup in RabbitMQ |
| AWS SQS moderate throughput | SQS FIFO + `MessageDeduplicationId` | Native 5-min broker dedup |
| AWS SQS + DLQ redrive | SQS FIFO + application DB check | 5-min broker window too short for DLQ |
| 1M+ events/sec analytics (false-positives OK) | Redis Bloom Filter | 50× memory savings; no false negatives |
| Financial transactions (no false positives ever) | DB unique constraint + Redis fast path + upsert | Multiple layers; no single point of failure |
| Cross-service dedup (API + consumer + worker) | Redis | Shared store accessible by all services |
| Rebalance latency SLO < 10s, large state | Redis | Zero rebuild time; State Store rebuild too slow |
| Long dedup window (30 days) | Redis with TTL | State Store local disk impractical at this retention |

:::tip[Interview Phrasing — EOS vs Application Dedup]
*"Kafka's exactly-once semantics guarantee that records are written exactly once within the Kafka ecosystem — the output record write, state store update, and offset commit are all atomic in one Kafka transaction. The moment you step outside that boundary — writing to a database, calling Stripe, sending an email — exactly-once no longer holds, because those systems cannot participate in the Kafka transaction. That's where application-level deduplication is required. My default for financial systems is three layers: a business-level idempotency key embedded in the event payload (stable across DLQ redrives), a Redis SETNX check for speed, and a DB unique constraint as the backstop for when Redis TTL expires and a late DLQ redrive arrives. The key must be based on business identity — not Kafka offset — so it remains stable across topic migrations."*
:::

:::tip[Interview Phrasing — State Store vs Redis]
*"The core trade-off is consistency vs. operational simplicity. Kafka Streams State Store gives you transactional atomicity — the state update commits in the same Kafka transaction as the output record and offset, so you cannot have a state/offset mismatch on crash. Redis cannot offer this because it's an external system outside the Kafka transaction boundary. On the other hand, Redis is better for any consumer that writes to an external system, for shared cross-service dedup state, and for deployments where rebalance rebuild time is a hard SLO — a Streams app with 100M state entries can take 20 minutes to rebuild after a partition rebalance, while a Redis-backed consumer starts in seconds. In practice I layer them: Kafka Streams with RocksDB handles intra-Kafka dedup atomically, and Redis handles the external API call dedup where atomicity is impossible anyway."*
:::

---

## 13. Further Reading

### External Resources
- [Kafka Documentation — Transactions](https://kafka.apache.org/documentation/#transactions) — Official explanation of the transactional producer, `isolation.level`, and EOS guarantees.
- [KIP-98 — Exactly-Once Delivery](https://cwiki.apache.org/confluence/display/KAFKA/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging) — Original design proposal; covers every design decision and trade-off.
- [KIP-447 — `exactly_once_v2`](https://cwiki.apache.org/confluence/display/KAFKA/KIP-447%3A+Producer+scalability+for+exactly+once+semantics) — V2 epoch-based fencing improvements.
- [Kafka Streams State Stores](https://kafka.apache.org/documentation/streams/developer-guide/processor-api.html#state-stores) — Official docs on state store types, changelog topics, and standby replicas.
- [RocksDB Tuning Guide](https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide) — Block cache, compaction, and write amplification tuning.
- [Redis SET NX EX](https://redis.io/commands/set/) — Atomic set-if-not-exists; the foundation of Redis deduplication.
- [Amazon SQS FIFO Exactly-Once](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html) — AWS docs on the 5-minute deduplication window.
- [Designing Data-Intensive Applications — Chapter 11](https://dataintensive.net/) — Kleppmann's treatment of exactly-once semantics and the fundamental impossibility of exactly-once across system boundaries.

### Internal Reference Guides
- [Exactly-Once Semantics in Kafka](./exactly-once.md) — Under-the-hood analysis of the transactional coordinator, transaction log, and epoch fence validation.
- [Kafka Streams Deep Dive](./kafka-streams-deep-dive.md) — Detailed architecture of KStreams processing topology, partition assignment, state stores, and rebalancing.
- [Redis Distributed Locks](../../redis/redis-distributed-lock.md) — Comprehensive guide to distributed lock implementations, Redlock algorithms, and fencing tokens.
- [Redis Performance Patterns](../../redis/redis-performance-patterns.md) — High-throughput cache design patterns, handling cache stampede, hot keys, and single-flight lock caching.
- [The Retry Pattern](../../system-design/retry-pattern.md) — Design principles for retries, exponential backoff, jitter, and circuit-breaking to prevent cascading failures.
- [The Outbox Pattern](../../system-design/outbox-pattern.md) — Companion pattern for reliable event publishing, which is a prerequisite for deduplication to be the only concern at the consumer.