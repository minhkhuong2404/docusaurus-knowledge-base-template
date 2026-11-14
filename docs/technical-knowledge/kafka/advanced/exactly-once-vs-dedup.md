---
id: exactly-once-vs-dedup
title: "Deduplication in Distributed Messaging — Kafka, Kafka Streams, RabbitMQ, SQS, Redis"
sidebar_label: Exactly-Once & Deduplication
description: "A comprehensive guide to preventing duplicate message processing across Kafka, Kafka Streams, RabbitMQ, SQS, and Redis — covering EOS internals, Kafka Streams State Store vs Redis architecture, idempotent consumers, and production deduplication patterns for senior engineers."
tags: [kafka, exactly-once, deduplication, idempotency, event-driven, kafka-streams, rabbitmq, sqs, redis, java, spring, rocksdb]
---

import KafkaDedupComparisonDiagram from '@site/src/components/KafkaDedupComparisonDiagram';
import KafkaStreamsExactlyOnceDiagram from '@site/src/components/KafkaStreamsExactlyOnceDiagram';
import KafkaWorkerScalingThreeLayerDefenseDiagram from '@site/src/components/KafkaWorkerScalingThreeLayerDefenseDiagram';

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

In any distributed system, when a producer sends a message and doesn't hear back in time, it faces an unavoidable dilemma:

```
Producer sends message ──► [Network / Broker] ──► ??? (did it arrive?)

Case A: Message arrived, but the ACK was lost on the way back.
        Producer sees a timeout → assumes failure → retries.
        Result: broker received the message TWICE.

Case B: Message never arrived (dropped, broker was down).
        Producer sees a timeout → retries.
        Result: broker received it ONCE, correctly, on retry.
```

From the producer's point of view, Case A and Case B are **indistinguishable** — both look like "no ACK received in time." A producer that wants to guarantee delivery *must* retry on timeout, and retrying on timeout unavoidably risks re-sending a message that already arrived. This single fact is the root cause of essentially every duplicate in distributed messaging: brokers, consumers, and downstream systems all inherit this ambiguity from the network itself.

Concrete sources of duplicates in a typical Kafka-based system:

- **Producer retries**: `retries > 0` (the default) means a producer that doesn't receive a broker ACK in time re-sends — potentially after the original write already succeeded.
- **Consumer rebalances**: if a consumer commits an offset *after* processing but crashes before the commit lands, the next owner of that partition re-reads and re-processes the already-handled message.
- **At-least-once redelivery**: SQS, RabbitMQ, and Kafka's default consumer semantics all promise "you will get every message at least once" — which explicitly allows more than once.
- **DLQ redrives**: an operator manually replaying a dead-letter queue days later can reintroduce a message that was, in fact, already successfully processed before it was (incorrectly) routed to the DLQ.
- **Client-side retry logic**: an HTTP client wrapping a Kafka producer, or an upstream service retrying a failed call to your ingestion API, reintroduces the same logical event with a new transport-level identity.

---

## 2. The Three Delivery Guarantees

Every messaging system picks one of three delivery guarantees. It's important to understand precisely what each one promises — and does not promise:

| Guarantee | Promise | Failure Mode | Typical Default |
| :--- | :--- | :--- | :--- |
| **At-most-once** | Message delivered zero or one times | Silent message loss on failure — no retry | Fire-and-forget producers (`acks=0`), Redis Pub/Sub |
| **At-least-once** | Message delivered one or more times | Duplicates on retry — never silent loss | Kafka default consumer, SQS standard queues, RabbitMQ with manual ACK |
| **Exactly-once** | Message has the *effect* of being delivered precisely once | Requires coordination between producer, broker, and consumer state | Kafka `EXACTLY_ONCE_V2` (within Kafka's boundary only) |

:::tip[For newcomers]
Think of these as three answers to "what happens if I don't hear back after mailing a letter?" **At-most-once** is "I won't resend it — if it got lost, it's lost." **At-least-once** is "I'll keep resending copies until someone confirms receipt" — which means the recipient might get several copies of the same letter. **Exactly-once** is "the recipient's mailbox is built so that even if they receive five copies, they only *act on* it once" — the guarantee isn't that only one copy is delivered, it's that duplicates don't change the outcome.
:::

The critical insight for the rest of this guide: **true exactly-once delivery across an arbitrary network is provably impossible** (this follows from the [Two Generals' Problem](https://en.wikipedia.org/wiki/Two_Generals%27_Problem)). What Kafka's "exactly-once semantics" actually delivers is exactly-once *processing effects* — achieved not by preventing duplicate delivery, but by combining at-least-once delivery with idempotent, transactional processing so duplicates are absorbed without changing the result. This reframing — "exactly-once is at-least-once delivery plus idempotent processing," not "duplicates never happen" — is the single most important mental model in this entire guide.

---

## 3. Kafka's Exactly-Once Semantics (EOS): How It Actually Works

Kafka achieves EOS through two independent mechanisms that are often conflated:

### 3.1 Idempotent Producer

Setting `enable.idempotence=true` (default since Kafka 3.0 when `acks=all`) assigns each producer a unique **Producer ID (PID)** and a **sequence number** per partition. The broker tracks the last sequence number it accepted per `(PID, partition)` pair and silently discards a retried write whose sequence number it has already seen — turning "producer retry causes duplicate" into "producer retry is a safe no-op." This solves *only* the producer-retry source of duplicates from Section 1 — it does nothing for consumer-side duplicates or duplicates introduced downstream of Kafka.

### 3.2 Transactions (`EXACTLY_ONCE_V2`)

<KafkaStreamsExactlyOnceDiagram />

Transactions extend idempotence to cover "read-process-write" cycles (the Kafka Streams / consume-transform-produce pattern):

Consumers reading the output topic with `isolation.level=read_committed` never see the output of an aborted transaction — so a crash mid-processing either produces the complete, correct output or produces nothing, never a partial/duplicated result. This is what makes the Kafka Streams State Store deep dive in Section 7 possible: the state store update and the output write are part of the *same* atomic unit.

**What EOS does not cover**: anything outside the Kafka transaction boundary. A database write, a REST call to Stripe, or an email send cannot be enlisted in a Kafka transaction — those require application-level idempotency, covered from Section 4 onward.

---

## 4. Idempotent Consumer Pattern — The Baseline

For any consumer that has a side effect outside Kafka (the overwhelmingly common case), the baseline pattern is: check-then-act against a durable dedup record, guarded by a uniqueness constraint so concurrent attempts can't both "win" the check.

```java
// Minimal idempotent consumer using a relational dedup table
@KafkaListener(topics = "orders")
@Transactional
public void consume(OrderEvent event) {
    try {
        // INSERT with a PRIMARY/UNIQUE KEY on event_id — a genuine duplicate throws here
        processedEventRepository.save(new ProcessedEvent(event.getId()));
    } catch (DataIntegrityViolationException e) {
        log.debug("Duplicate suppressed: {}", event.getId());
        return; // safe no-op; Kafka offset still advances normally
    }
    orderService.applyOrderCreated(event); // only the winner of the INSERT reaches here
}
```

This is the pattern every later section builds on. The two storage backends covered in depth below — Kafka Streams State Store and Redis — are two different answers to "where does the dedup record live, and what consistency guarantee does it have with the rest of the pipeline."

---

## 5. RabbitMQ and SQS: No Native Cross-Delivery Dedup

Unlike Kafka's idempotent producer, RabbitMQ has no broker-level deduplication at all — every redelivery (due to a NACK, consumer crash before ACK, or connection loss) is a fresh, indistinguishable message from the consumer's point of view. Deduplication is entirely the application's responsibility, using the same idempotent-consumer pattern as Section 4, keyed on a message ID the *producer* sets deliberately (never the RabbitMQ delivery tag, which is connection-scoped and meaningless across redeliveries).

SQS standard queues provide **best-effort** at-least-once delivery with no dedup guarantee. **SQS FIFO queues** provide a narrow, time-boxed exception: a 5-minute deduplication window keyed on `MessageDeduplicationId` (or a content hash if not set) — messages with the same ID within that 5-minute window are deduplicated by the broker. This is useful but easy to over-trust: a DLQ redrive that happens hours or days later falls completely outside the window and needs the same application-level defense as everything else in this guide.

---

## 6. Choosing Where Dedup State Lives

Once you accept that most consumers need application-level dedup (Section 4), the remaining architectural question is *where the dedup record lives* — because that choice determines your consistency guarantees, latency, and operational footprint. Three realistic options:

1. **The same database you're already writing to** (a `UNIQUE` constraint + `ON CONFLICT DO NOTHING` / catch-and-ignore) — simplest, no new infrastructure, but only works when your side effect *is* a write to that database.
2. **Kafka Streams' embedded State Store (RocksDB)** — the right answer when your pipeline is entirely Kafka-to-Kafka.
3. **Redis** — the right answer when the side effect is external (a REST call, an email, a write to a different service's database) or when multiple services need to agree on dedup state.

Sections 7 onward focus on the State Store vs. Redis decision in depth, since it's the one senior engineers most often get wrong by defaulting to whichever one they used last.

---

## 7. Kafka Streams State Store vs Redis Deep Dive

### 7.1 Architecture: Partition-Local vs Shared

A Kafka Streams **State Store** is an embedded RocksDB instance colocated with each Streams task, one per assigned partition. The key property: **messages from partition 0 always go to Instance A**, and RocksDB for partition 0 is always on Instance A — lookups are always local, with no network hop required. The state is also backed by a **changelog topic** in Kafka, so it can be rebuilt from scratch (or from a standby replica) if the instance is lost.

Redis, by contrast, is an external, shared service. Every instance of every consumer — regardless of which partitions it owns, or even which application it belongs to — talks to the same Redis cluster over the network. There is no locality: a dedup check is always a network round trip.

### 7.2 What Happens During a State Store Lookup

```
1. Kafka Streams task receives a record for partition 0 (owned locally).
2. Processor calls stateStore.get(key) — this is an in-process method call.
3. RocksDB checks its in-memory block cache first (sub-millisecond hit).
4. On a cache miss, RocksDB reads from the local SST files on disk
   (still local — typically < 1ms on SSD, no network involved).
5. If the record is part of an EXACTLY_ONCE_V2 transaction, the store
   write (stateStore.put()) is buffered and committed atomically
   with the output record and the offset — see Section 3.2.
```

### 7.3 What Happens During a Redis Deduplication Check

```
1. Consumer receives a record — could be any partition, any instance.
2. Consumer calls redis.setIfAbsent(key, value, ttl) — a network call.
3. Request traverses: app → network → Redis cluster → command processed
   → response → network → app. Typically 1–5ms even in the same
   datacenter; more across availability zones.
4. This operation is NOT part of any Kafka transaction. It commits
   (or doesn't) independently of the Kafka offset commit — see 7.4.
```

### 7.4 Consistency Model — The Critical Difference

This is the most important architectural distinction between the two approaches.

**Kafka Streams State Store: Transactionally Consistent.** With `EXACTLY_ONCE_V2`, the state store update, output record write, and offset commit are all part of one atomic Kafka transaction (Section 3.2). There is no dual-write hazard — the state store and the offset are always consistent with each other because they commit together. A crash at any point either leaves both uncommitted (safe replay) or both committed (correct, no gap).

**Redis: Eventual Consistency with Dual-Write Hazard.** Redis is an external system. The Redis write and the Kafka offset commit are two separate network operations with no shared coordinator:

```
Failure window 1: Redis SETNX succeeds → consumer crashes before ack.acknowledge()
                  → Kafka redelivers the message → Redis sees the key as taken
                  → event is (incorrectly) treated as a duplicate and DROPPED,
                    even though it was never actually processed.

Failure window 2: Redis SETNX succeeds → external API call succeeds
                  → consumer crashes before setting status to COMPLETED
                  → offset never commits → redelivery → Redis key exists but
                    status is still PROCESSING → ambiguous: did it finish or not?
```

This is exactly why the combined implementation in Section 9 uses an explicit `PROCESSING` → `COMPLETED` status rather than a bare boolean key — it turns an ambiguous dual-write race into a recoverable state machine, though it still can't reach the atomicity that a single Kafka transaction gives you for free.

**Mitigations for rebuild latency (State Store side):** `num.standby.replicas=1` keeps a hot-standby copy of state on another instance so failover doesn't require a full changelog replay; keeping `state.dir` on fast NVMe disk and bounding state size (Section 11.3) further reduces the rebuild window.

### 7.5 Use Kafka Streams State Store (RocksDB) When

1. **Your pipeline is Kafka → processing → Kafka** (no external side effects). State store is the only option that provides transactional atomicity with the offset commit and output record — Redis cannot participate in a Kafka transaction.

2. **You need true exactly-once with `EXACTLY_ONCE_V2`**. State store updates are committed atomically with offsets. Redis updates cannot be.

3. **You want zero external infrastructure**. State store is embedded — no Redis cluster to provision, size, monitor, or pay for.

4. **Latency budget is extremely tight** (sub-millisecond per lookup). Local RocksDB block cache reads are 10–100× faster than Redis round-trips.

5. **Your state is small enough to rebuild quickly** (< 1M entries per partition) or you have `num.standby.replicas` configured.

6. **State is strictly partition-local** (no cross-partition or cross-service dedup needed).

### 7.6 Use Redis When

1. **Your consumer writes to an external system** (database, REST API, email). Kafka EOS does not cover external writes. Redis provides a fast, shared dedup gate that works across any technology.

2. **Multiple services or components share dedup state**. An API gateway, a Kafka consumer, and a background worker all need to agree that event-123 was processed. Redis is the shared store.

3. **Startup and rebalance latency is a hard SLO**. A Redis-backed consumer starts processing immediately after connecting to Kafka, with no state rebuild. A Kafka Streams app with large state may be unavailable for minutes during a rebalance.

4. **Deduplication windows are very long** (7+ days, 30 days). Storing 30 days of event IDs in RocksDB on the container's local disk is operationally risky — disk pressure, slow rebuilds, state loss on disk failure. Redis TTL-based eviction is native and automatic.

5. **False-positive rate is acceptable and throughput is extreme** (millions/sec). Redis Bloom Filter uses 1/50th the memory of exact key storage with configurable false-positive rate.

6. **Your deployment model does not support local persistent storage**. Ephemeral containers without persistent volumes cannot host a reliable RocksDB state store.

### 7.7 Side-by-Side Summary Table

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

## 8. Choosing a Dedup Window and Storage Budget

Before implementing either backend, size the dedup window deliberately — this single number drives storage cost, TTL configuration, and which backend is even viable:

```
Window sizing rule of thumb:
  window >= max plausible redelivery delay in your system

Inputs to consider:
  - Consumer rebalance / restart recovery time     (usually seconds-minutes)
  - Kafka Streams state rebuild time under failure  (minutes, see Section 11.3)
  - DLQ retention before an operator might redrive  (SQS max 14 days; team policy for Kafka DLQs)
  - Manual incident-response replay windows          (hours-days, ad hoc)
```

A window sized only for "normal" redelivery (seconds) will silently under-protect against the DLQ-redrive case (Section 11.2) — this is the single most common under-sizing mistake, and it's why Section 11.2's mitigation always pairs a short-TTL fast path with a permanent DB uniqueness constraint as backstop.

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

### 6. Testing Dedup Logic — Don't Trust It Untested

Dedup bugs are notoriously invisible in the happy-path test suite (send one event, assert one write) — they only show up under concurrency or replay, which is exactly why the TOCTOU bug in 11.1 survives code review so often. Test the failure paths explicitly:

```java
@Test
void concurrentDeliveryOfSameEventShouldOnlyChargeOnce() throws InterruptedException {
    PaymentEvent event = new PaymentEvent("evt-1", BigDecimal.TEN);
    ExecutorService pool = Executors.newFixedThreadPool(2);
    CountDownLatch ready = new CountDownLatch(2);
    CountDownLatch go = new CountDownLatch(1);

    Runnable attempt = () -> {
        ready.countDown();
        awaitUninterruptibly(go);
        paymentConsumer.process(event); // both threads race to process the SAME event
    };
    pool.submit(attempt);
    pool.submit(attempt);
    ready.await();
    go.countDown();
    pool.shutdown();
    pool.awaitTermination(5, TimeUnit.SECONDS);

    verify(paymentGateway, times(1)).charge(any()); // only one charge, regardless of race outcome
}

@Test
void replayAfterTtlExpiryShouldBeCaughtByDbConstraint() {
    orderConsumer.process(orderPlacedEvent("ord-1"));
    redisTemplate.delete("dedup:ord-1"); // simulate TTL expiry
    orderConsumer.process(orderPlacedEvent("ord-1")); // late DLQ redrive after "expiry"

    assertThat(orderRepository.findAllByOrderId("ord-1")).hasSize(1); // DB constraint caught it
}
```

---

## 12. Production Case Study: Scaling a Kafka Consumer from 1 Pod to 2+ Pods Without Duplicate Aggregates or Redis Locks

A classic production incident occurs the very first time a team enables Kubernetes Horizontal Pod Autoscaling (HPA / KEDA) on a Kafka worker that aggregates records into a relational database: **running 1 pod works flawlessly, but scaling to 2 pods immediately creates duplicate parent rows and corrupted aggregate totals.**

Best of all, the foundational fix lives **inside the database and partition routing**, without needing to introduce a Redis distributed lock.

<KafkaWorkerScalingThreeLayerDefenseDiagram initialTab="three_layers" />

---

### 12.1 Problem Statement: The `Document` & `Transaction` Aggregation Pipeline

- **Incoming Kafka Message:** Each message represents an issued ticket containing `TicketNumber`, `UserCode`, `DateOfIssue`, and `Amount`. The producer belongs to an external upstream team and cannot be modified directly.
- **Database Schema:**
  - **`Document` Table:** Strictly **one row per `(UserCode, DateOfIssue)`**. The column `TotalAmount` stores the daily sum of all tickets for that user on that date.
  - **`Transaction` Table:** Strictly **one row per ticket (`TicketNumber`)**, referencing `DocumentId`.
- **Legacy Worker Logic (EF Core / Hibernate ORM):**
  1. Query `Document` by `(UserCode, DateOfIssue)`.
  2. If not found, create a new `Document`; if found, add `Amount` to `Document.TotalAmount`.
  3. Insert a new row into `Transaction` and `SaveChanges()`.
- **The Production Incident:** With `replicas: 1`, data is 100% accurate. When Kubernetes autoscales to `replicas: 2`, two `Document` rows are created for the same user on the same day, and `Document.TotalAmount` no longer matches `SUM(Transaction.Amount)`!

---

### 12.2 Root Cause Analysis: Why 2 Pods Corrupt State

#### 1. Check-Then-Act Race on `Document` Creation
The *"find, or create if missing"* logic executes two separate SQL statements: a `SELECT` followed by an `INSERT`. When two tickets for `U01` on `2026-11-08` are processed concurrently by Pod 1 and Pod 2, both pods execute `SELECT`, both observe "no `Document` exists", and both execute `INSERT`.

**Why wrapping `SELECT` + `INSERT` in a Database Transaction does NOT prevent this:**
- **`READ COMMITTED` (Default Isolation in PostgreSQL, SQL Server, Oracle):** A `SELECT` statement cannot acquire a row lock on a row that **does not exist yet**. Both transactions see an empty result and both succeed in inserting a row.
- **`SERIALIZABLE` (or `REPEATABLE READ` gap locking):** Both transactions acquire shared range/gap locks on the missing key gap and then attempt to upgrade to an exclusive insert-intention lock—causing an immediate **deadlock** on SQL Server / MySQL (or a `40001` serialization failure on PostgreSQL), forcing retries while imposing heavy lock overhead on every read.

#### 2. The 4 Paths That Corrupt `TotalAmount`
1. **Split `Document` Rows:** Tickets for `(U01, 2026-11-08)` land across two duplicate `Document` records, each holding only part of the daily total.
2. **Read-Modify-Write Lost Update:** Pod A and Pod B both read `TotalAmount = 100` into ORM memory. Pod A adds `50` and writes `UPDATE Document SET TotalAmount = 150`. Pod B adds `70` and writes `UPDATE Document SET TotalAmount = 170`—silently overwriting Pod A's `+50` update (`170` instead of `220`).
3. **At-Least-Once Consumer Redelivery:** Pod A commits the DB transaction, but before its Kafka offset is committed, the pod scales down, restarts, or loses its partition during a consumer group rebalance. Pod B picks up the partition from the last committed offset and processes the same tickets a second time—inserting duplicate `Transaction` rows and double-counting `TotalAmount`.
4. **Upstream Producer Duplicate Messages (Same Ticket at 2 Different Offsets):** Because Kafka producers also operate at-least-once, the topic itself can contain two messages with the same `TicketNumber` at two different offsets. Even if the consumer commits offsets perfectly, it will read and process both offsets! Producer duplicates arise from three sources:
   - *Lost Broker ACK Retry:* The broker wrote the message, the ACK dropped on the network, and the producer retried. While `enable.idempotence=true` prevents this in Java clients (default since Kafka 3.0), **`librdkafka`-based clients (.NET `Confluent.Kafka`, Go, Python) still default `enable.idempotence` to `false`!**
   - *Producer Restart Across Sessions:* Kafka's idempotent producer (`PID`) only deduplicates retries within a single producer process lifetime. If the producer app restarts and resends unacknowledged records, the broker assigns a new `PID` and accepts the duplicate.
   - *Application-Level Retry / Sync Job Rerun:* Upstream code catches a timeout and calls `produce()` again, or re-runs a batch sync job.

#### 3. Step 0 Pre-Check: Verify `GroupId` Before Touching Code!
When an engineer says *"Kafka sent messages to both workers"*, check which of two completely different topologies is happening:
- **Both pods share the same fixed `group.id`:** Kafka divides partitions across the 2 pods; each offset goes to only 1 pod. Corruption happens when two different tickets for the same `(UserCode, DateOfIssue)` sit on different partitions (or during rebalance overlap).
- **Each pod has a different `group.id`:** Commonly caused by concatenating `Environment.MachineName`, pod hostname, or `Guid.NewGuid()` into `GroupId` at startup. Every pod becomes an independent consumer group and reads **100% of the topic**, processing every ticket twice!
  - *Smoking Gun:* If the topic has **only 1 partition** yet both pods are actively processing messages (or every single ticket has 2 `Transaction` rows), the pods have different `GroupId`s. Fix by setting a static `GroupId` in config.

---

### 12.3 The 3-Layer Defense Architecture (No Redis Lock Required)

> **Core Design Principle:** Partitioning by `UserCode` (Layer 1) eliminates 99.9% of concurrent collisions during normal operation by routing each user to a single writer pod, while **the database is the ultimate source of truth**—using a unique constraint on `(UserCode, DateOfIssue)` (Layer 2) and ticket deduplication + `UNIQUE(TicketNumber)` (Layer 3) to catch rebalance overlaps and duplicate deliveries.

#### Layer 1: Partition by `UserCode` (Single-Writer Lane) & Kubernetes Consumer Config
When messages use `UserCode` as their Kafka message key (`murmur2(UserCode) % numPartitions`), every ticket for user `U01` lands in the exact same partition. Because a partition is assigned to at most **one** consumer within a group at any time, a single pod processes all of `U01`'s tickets sequentially.

**What if you cannot modify the upstream producer?** Inspect the incoming message key first:
1. **Key is already `UserCode` (or `UserCode + DateOfIssue`):** Layer 1 is already active!
2. **Key is `null` or something else:**
   - *Path A:* Ask the upstream producer team to set the message key to `UserCode` (payload stays untouched, provided no other consumer group depends on the old key).
   - *Path B (Internal Re-Keying Topic):* Deploy a lightweight forwarder worker that reads the raw upstream topic and republishes to an internal topic keyed by `UserCode` (adds ~a few milliseconds of latency).
3. **Neither Path A nor Path B is possible:** Skip Layer 1. Data remains 100% accurate thanks to Layer 2 (`UNIQUE(UserCode, DateOfIssue)`) and Layer 3 (`UNIQUE(TicketNumber)` + conditional optimistic `UPDATE`), though pods will collide more often and retry batches more frequently.

**Why Layer 1 Cannot Stand Alone (Two Inevitable Gaps):**
- **Rebalance / Restart Replay:** Uncommitted offsets are replayed after a pod restart or rebalance.
- **Slow Batch Exceeding `max.poll.interval.ms` (Zombie Overlap):** If Pod 1 takes longer than `max.poll.interval.ms` (default 5 minutes) to process a batch, the broker revokes its partition and assigns it to Pod 2 **while Pod 1 is still mid-flight writing to the database**! For a brief window, two pods write the same partition concurrently.

**Mandatory Kubernetes & `.NET Confluent.Kafka` Configurations:**
- **Max Replicas $\le$ Partition Count:** Never autoscale pods beyond the topic's partition count (excess pods sit idle while triggering unnecessary rebalances).
- **Scale on Consumer Lag (KEDA), Not CPU:** Use KEDA's Kafka lag scaler with stabilization cooldown windows so pods don't thrash in and out of the group.
- **`.NET Confluent.Kafka` (`librdkafka`) Offset Store Trap:** By default, `Confluent.Kafka` runs a background auto-commit thread every 5 seconds **and sets `EnableAutoOffsetStore = true`, which marks a message's offset as ready-to-commit the instant `Consume()` hands it to your C# code—before your DB transaction even runs!** If the pod crashes 1 second later, the background thread or close handler commits the offset and the ticket is **permanently lost**.
  - **Fix:** Set **`EnableAutoOffsetStore = false`** and call **`consumer.StoreOffset(consumeResult)`** strictly **after** the database transaction commits!

---

#### Layer 2: Unique Key on `(UserCode, DateOfIssue)` — Comparing 3 Options

Where should the uniqueness lock live? Compare the three architectural options:

| Option | How It Works | Pros | Cons & Operational Gotchas |
| :--- | :--- | :--- | :--- |
| **Option 1: Redis Distributed Lock** (`SET doc:{User}:{Date} NX PX`) | Acquire Redis lock before `SELECT`/`INSERT`, release after DB commit. | No immediate DB schema change required. | ❌ **4 Fatal Drawbacks:** (1) Extra infra SPOF; (2) **TTL Trap** (long TTL stalls failover after pod kill; short TTL expires during slow DB/GC pause, letting 2 pods write concurrently); (3) **Batch Deadlocks** (a 500-msg batch spans hundreds of `(User, Date)` keys—locking them out of order deadlocks two pods unless wrapped in an all-or-nothing Lua script); (4) **Does NOT stop replayed or duplicate tickets!** |
| **Option 2: Unique Index on `Document(UserCode, DateOfIssue)`** *(Target End-State)* | DB enforces uniqueness natively. 2nd concurrent `INSERT` blocks until 1st commits, then fails with duplicate key $\rightarrow$ rolls back and retries into `UPDATE`. | ✅ Zero extra infra, works with batching, guarantees correctness across rebalances. | Requires cleaning existing duplicate `Document` rows first and running **Online DDL** (`WITH (ONLINE = ON)` in SQL Server, `CREATE UNIQUE INDEX CONCURRENTLY` in Postgres, `ALGORITHM=INPLACE, LOCK=NONE` in MySQL). |
| **Option 3: Dedicated `DocumentKey` Side-Table** *(Stepping Stone)* | Create `DocumentKey(UserCode, DateOfIssue, DocumentId)` with `UNIQUE(UserCode, DateOfIssue)`. Worker inserts into `DocumentKey` first inside the same DB tx. | ✅ Stops new duplicates **today** without waiting to clean up dirty legacy rows in `Document`! | Must pre-populate `DocumentKey` from existing `Document` rows using `MIN(Id) GROUP BY UserCode, DateOfIssue` so workers update a single canonical `DocumentId` per pair, and every write path must go through `DocumentKey`. |

> [!CAUTION]
> **Critical Schema Rule for `DateOfIssue` & Filtered Unique Indexes:**
> - **Use `DATE`, Never `DATETIME`:** The unique index on `(UserCode, DateOfIssue)` **must** use a calendar `DATE` column normalized to a single business timezone. If `DateOfIssue` is stored as `DATETIME` / `TIMESTAMP`, two tickets at `08:00` and `09:00` on the same day have different timestamps and the unique index will not block the duplicate `Document`!
> - **Conditional / Filtered Unique Index Variant:** In SQL Server (`CREATE UNIQUE INDEX ... WHERE Id > @MaxLegacyId`) and PostgreSQL (partial unique index), you can enforce uniqueness immediately on all newly inserted rows without cleaning legacy duplicates first (not supported in MySQL).

---

#### Layer 3: In-App Ticket Deduplication + `UNIQUE(TicketNumber)` Safety Net

A unique key on `Document(UserCode, DateOfIssue)` prevents duplicate `Document` headers, but what prevents a replayed or producer-duplicated ticket from adding `Amount` to `TotalAmount` twice?
1. **Filter Duplicates in Application Code Before Computing `TotalAmount`:** Deduplicate identical `TicketNumber` entries within the polled memory batch, and run `SELECT TicketNumber FROM Transaction WHERE TicketNumber IN (...)` to strip out any tickets already persisted in the database. Compute the new `TotalAmount` strictly from the remaining net-new tickets.
2. **`UNIQUE` Constraint on `Transaction(TicketNumber)` as the Ultimate Safety Net:** Because `TicketNumber` is a natural business idempotency key already present in the payload, add a unique index on `Transaction(TicketNumber)` (or `(TicketNumber, OperationType)` if a ticket can emit distinct lifecycle events like Issue, Refund, Cancel). If two pods overlap during a rebalance and race past the `SELECT` filter on the same ticket, the second pod's `INSERT INTO Transaction` throws a unique constraint violation, rolling back its entire transaction (including its `UPDATE Document`).
3. **Why Direct `UPDATE TotalAmount = @newTotal` Is Safe—And When to Add Optimistic CAS:**
   - **When Partitioned by `UserCode` (Layer 1 active):** Only one pod processes a given user's tickets, and any rebalance overlap processes a contiguous sequence of tickets sharing at least one `TicketNumber`—which `UNIQUE(TicketNumber)` catches immediately.
   - **When NOT Partitioned by `UserCode` (Layer 1 inactive):** Two pods can concurrently process two completely disjoint sets of tickets for the same user on the same day (`UNIQUE(TicketNumber)` won't collide, causing a Lost Update!). In that case, add an **Optimistic Lock condition on the old total** directly to the `UPDATE` statement (Compare-And-Swap without needing a separate `Version` column):
     ```sql
     UPDATE Document
     SET TotalAmount = @newTotal
     WHERE Id = @docId
       AND TotalAmount = @previousReadTotal;
     -- If affected_rows == 0, another pod updated this Document concurrently:
     -- Rollback and retry the batch from Step 2!
     ```

---

### 12.4 The 4-Step Short-Transaction Batch Processing Flow

To maximize throughput and minimize database lock hold time, perform all deduplication and aggregation **in memory before opening the database transaction**, opening the transaction only for the final write step:

```csharp
// Production Batch Flow (.NET / C# Conceptual Implementation)
public async Task ProcessBatchAsync(IReadOnlyList<ConsumeResult<string, TicketMessage>> batch, CancellationToken ct)
{
    // STEP 1: In-app batch deduplication (handles producer duplicates within the same batch)
    var uniqueTickets = batch
        .Select(r => r.Message.Value)
        .Where(IsValidBusinessTicket)
        .DistinctBy(t => t.TicketNumber)
        .ToList();

    while (true) // Retry loop for rare rebalance unique-key / optimistic-lock collisions
    {
        // STEP 2: Strip tickets already persisted in Transaction (handles rebalance & restart replay)
        var candidateNumbers = uniqueTickets.Select(t => t.TicketNumber).ToList();
        var existingNumbers = await db.Transactions
            .Where(t => candidateNumbers.Contains(t.TicketNumber))
            .Select(t => t.TicketNumber)
            .ToHashSetAsync(ct);

        var netNewTickets = uniqueTickets
            .Where(t => !existingNumbers.Contains(t.TicketNumber))
            .ToList();

        // If all tickets in this batch were already processed, store offsets and return!
        if (netNewTickets.Count == 0)
        {
            StoreBatchOffsets(batch);
            return;
        }

        // STEP 3: Group by (UserCode, DateOfIssue) and read current Document totals AFTER Step 2
        var groups = netNewTickets.GroupBy(t => new { t.UserCode, Date = t.DateOfIssue.Date }).ToList();
        var existingDocs = await LoadExistingDocumentsAsync(groups.Select(g => g.Key), ct);

        // STEP 4: Open a SHORT DB transaction strictly for the writes
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        try
        {
            foreach (var group in groups)
            {
                decimal batchDelta = group.Sum(t => t.Amount);
                if (!existingDocs.TryGetValue(group.Key, out var docSnapshot))
                {
                    // New Document for (UserCode, Date) — guarded by UNIQUE(UserCode, DateOfIssue)
                    var newDoc = new Document {
                        UserCode = group.Key.UserCode,
                        DateOfIssue = group.Key.Date,
                        TotalAmount = batchDelta
                    };
                    db.Documents.Add(newDoc);
                    await db.SaveChangesAsync(ct);
                    InsertTransactionsForGroup(group, newDoc.Id);
                }
                else
                {
                    // Update existing Document — guarded by optimistic TotalAmount check if unpartitioned
                    decimal newTotal = docSnapshot.TotalAmount + batchDelta;
                    int updated = await db.Database.ExecuteSqlInterpolatedAsync($@"
                        UPDATE Document
                        SET TotalAmount = {newTotal}
                        WHERE Id = {docSnapshot.Id}
                          AND TotalAmount = {docSnapshot.TotalAmount}", ct);

                    if (updated == 0)
                        throw new DbUpdateConcurrencyException("Concurrent Document update detected.");

                    InsertTransactionsForGroup(group, docSnapshot.Id);
                }
            }

            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            // Commit succeeded -> Now safely mark offsets in librdkafka!
            StoreBatchOffsets(batch);
            return;
        }
        catch (Exception ex) when (IsUniqueConstraintOrConcurrencyError(ex))
        {
            await tx.RollbackAsync(ct);
            // Another pod wrote overlapping records during rebalance; loop back to Step 2
            // which automatically filters out the rows the other pod just committed!
        }
    }
}
```

---

### 12.5 Legacy Duplicate Cleanup Runbook & Chaos Verification

Because duplicate `Document` and `Transaction` rows already exist in the database, financial reports are currently skewed and must be cleaned in **6 ordered steps**:

1. **Deploy the New Worker Code First:** Temporarily scale to `1` pod (or enable Option 3 `DocumentKey` / filtered unique index) so zero new duplicates are generated during cleanup.
2. **Deduplicate `Transaction` Rows in Batches:** Group by `TicketNumber`, keep `MIN(Id)`, and delete duplicate rows in small chunks (a few thousand keys per transaction—**never** run a single giant transaction across millions of rows, which locks the table and stalls live workers!).
3. **Consolidate Duplicate `Document` Rows:** For each `(UserCode, DateOfIssue)` having `COUNT(*) > 1`, keep `MIN(Id)` as the canonical `DocumentId`, repoint `Transaction.DocumentId` from the duplicate documents to `MIN(Id)`, and delete the redundant `Document` rows (check with business/accounting first if external invoices reference those old `Document.Id` values!).
4. **Recompute `Document.TotalAmount`:** Update `TotalAmount = (SELECT SUM(Amount) FROM Transaction WHERE DocumentId = Document.Id)`.
5. **Create Online Unique Indexes:** Create `UNIQUE(UserCode, DateOfIssue)` on `Document` and `UNIQUE(TicketNumber)` on `Transaction`. Successful index creation mathematically proves zero duplicates remain.
6. **Re-enable Kubernetes Autoscaling & Schedule Continuous Reconciliation:**
   Run a periodic background audit query (must always return `0 rows`):
   ```sql
   SELECT d.Id, d.UserCode, d.DateOfIssue, d.TotalAmount, COALESCE(SUM(t.Amount), 0) AS TxSum
   FROM Document d
   LEFT JOIN Transaction t ON t.DocumentId = d.Id
   GROUP BY d.Id, d.UserCode, d.DateOfIssue, d.TotalAmount
   HAVING d.TotalAmount <> COALESCE(SUM(t.Amount), 0);
   ```
   **Chaos Verification Test (`kill -9`):** Before signing off, run 3+ worker pods against a test stream containing duplicate tickets and multiple tickets per user/day, forcefully `kill -9` one pod mid-stream (bypassing graceful shutdown), and verify that the reconciliation query above returns **0 rows** and every `(UserCode, DateOfIssue)` has exactly 1 `Document`.

---

## 13. Interview Decision Matrix

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

## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Deduplication, Worker Scaling & Exactly-Once Interviews

When an interviewer asks *"Our Kafka consumer works with 1 pod, but when Kubernetes scales to 2 pods we get duplicate records and wrong totals—should we add a Redis distributed lock?"*, a mid-level candidate immediately designs a Redis `SETNX` lock around the consumer. A **Principal Engineer** rejects the unnecessary Redis lock, diagnoses the **4 root causes (Check-Then-Act, Lost Update, Rebalance Replay, and Upstream Producer Duplicates)**, and designs the **3-Layer Defense (Partition by Entity Key + DB Unique Constraints + Idempotent Ticket Deduplication with Short DB Transactions)**.

### 1. The 60-Second Senior Framing Strategy

1. **Establish the Order of Defense (DB Constraints & Partitioning Before Distributed Locks):** When all mutated state lives inside a single relational database, **never** introduce an external Redis distributed lock as your primary guard. Use **Layer 1 (Partition by Entity Key)** to eliminate 99.9% of contention, **Layer 2 (`UNIQUE(UserCode, DateOfIssue)`)** to block duplicate parent headers during rebalances, and **Layer 3 (`UNIQUE(TicketNumber)` + pre-filter)** to guarantee idempotent aggregation.
2. **Check the `GroupId` & Offset Commit Invariant First:** Verify that all pods share a single static `GroupId` (no `Environment.MachineName` suffix) and that offset marking happens **strictly after** DB transaction commit (`EnableAutoOffsetStore = false` in `.NET Confluent.Kafka`).
3. **Separate Preparation from Transaction Execution:** Filter in-batch duplicates, query `WHERE TicketNumber IN (...)` to remove already-processed tickets, and compute new totals in memory **before** opening a short DB transaction solely for `INSERT`/`UPDATE`.
4. **Proactively Handle Dirty Legacy Data & Day-2 Reconciliation:** Mention **Online DDL** (`CONCURRENTLY` / `ONLINE = ON` / `ALGORITHM=INPLACE`), the **Dedicated `DocumentKey` Side-Table** (or filtered unique index) when legacy duplicates cannot be merged immediately, and a continuous SQL reconciliation job (`HAVING d.TotalAmount <> SUM(t.Amount)`).

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "When scaling our Kafka worker from 1 pod to 2 pods creates duplicate `Document` rows, why doesn't wrapping `SELECT` + `INSERT` inside a database transaction fix the race condition?"
* **Junior/Mid Answer:** *"A database transaction makes `SELECT` and `INSERT` atomic, so the second pod will wait until the first transaction finishes."*
* **Principal Rebuttal:** *"Under the default **`READ COMMITTED`** isolation level in PostgreSQL, SQL Server, and Oracle, a `SELECT` statement **cannot lock a row that does not exist yet**. Both pods run `SELECT`, both observe zero rows, and both proceed to `INSERT` inside their respective transactions! And if you raise isolation to **`SERIALIZABLE`** (or `REPEATABLE READ` gap locking), both pods acquire shared range/gap locks on the non-existent key range and then deadlock when both try to upgrade to an exclusive insert-intention lock. The proper database primitive for 'create at most one row per key' is a **`UNIQUE` index on `(UserCode, DateOfIssue)`** (using a `DATE` column, never `DATETIME`!)."*

#### Trap 2: "Why shouldn't we just acquire a Redis lock `SET lock:{UserCode}:{Date} NX PX 5000` before processing each Kafka message?"
* **Junior/Mid Answer:** *"Redis lock is fast and prevents two pods from processing the same user at the same time."*
* **Principal Rebuttal:** *"Adding a Redis lock for state that lives inside a single relational database introduces four production hazards without solving the problem:
  1. **New Infrastructure SPOF:** If Redis blips or fails over, your entire Kafka pipeline halts.
  2. **The TTL Dilemma:** If a pod is killed during deployment, the new pod stalls until TTL expires; if TTL is short and a pod hits a GC pause or slow DB query, the lock expires mid-transaction and two pods write concurrently anyway!
  3. **Batch Lock-Ordering Deadlocks:** High-throughput consumers process in batches (e.g., 500 messages spanning 200 `(User, Date)` keys). Locking 200 keys across two pods during a rebalance causes distributed deadlocks unless you sort keys and acquire them all-or-nothing in a Redis Lua script.
  4. **Zero Protection Against Redelivery:** Once Pod 1 commits and releases the Redis lock, if a rebalance replays the message (or the producer sent a duplicate at a later offset), Pod 2 acquires the free Redis lock and double-counts `TotalAmount` anyway!"*

#### Trap 3: "If we partition the Kafka topic by `UserCode` so all messages for `U01` go to the same partition, do we still need `UNIQUE` indexes and optimistic locking in the database?"
* **Junior/Mid Answer:** *"No, because a partition is only consumed by one pod in a consumer group, so two pods can never process `U01` at the same time."*
* **Principal Rebuttal:** *"Partitioning by `UserCode` is a massive throughput optimization (eliminating 99.9% of cross-pod contention), **but it is not a correctness guarantee** because of two inevitable windows:
  1. **Rebalance & Restart Replay:** If Pod 1 commits to the DB and crashes before committing its Kafka offset, Pod 2 re-reads those messages after rebalance.
  2. **Slow Batch Zombie Overlap (`max.poll.interval.ms`):** If Pod 1 stalls on a slow batch beyond `max.poll.interval.ms`, the broker revokes its partition and hands it to Pod 2 **while Pod 1 is still executing its DB transaction**!
  Therefore, partitioning by key optimizes the happy path, while **`UNIQUE(UserCode, DateOfIssue)` + `UNIQUE(TicketNumber)`** in the database guarantees correctness during the unhappy path."*

#### Trap 4: "We enabled `enable.idempotence=true` on our Kafka producer, yet our consumer still receives two messages with the exact same `TicketNumber` at two different offsets. How is that possible?"
* **Junior/Mid Answer:** *"Kafka's idempotent producer must be misconfigured; `enable.idempotence=true` prevents all producer duplicates."*
* **Principal Rebuttal:** *"First, in `librdkafka`-based clients (.NET `Confluent.Kafka`, Go, Python), `enable.idempotence` defaults to `false` (unlike Java where it defaulted to `true` in Kafka 3.0). Second, even when enabled, Kafka's idempotent producer only deduplicates network retries **within a single Producer ID (`PID`) session** and the broker's 5-batch sequence window. If the producer pod restarts (getting a brand-new `PID`) and replays unacknowledged events from memory or an outbox, or if application code catches a timeout exception and calls `produce()` a second time, the broker treats it as a brand-new record and appends it at a new offset. Consumer-side deduplication on the business key (`TicketNumber`) is non-negotiable."*

---

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **First Check When 2 Pods Duplicate Everything** | "Add a distributed lock in Redis." | "Check if `GroupId` is dynamic (`MachineName`/`Guid`) or if topic has 1 partition with 2 active pods; enforce a single static `GroupId`." |
| **Preventing Duplicate Parent Rows (`Document`)** | "Wrap `SELECT` + `INSERT` in a DB transaction." | "`READ COMMITTED` cannot lock non-existent rows. Enforce **`UNIQUE(UserCode, DateOfIssue)`** (with `DATE` type) via Online DDL or a `DocumentKey` side-table." |
| **Preventing Double-Counted Totals (`TotalAmount`)** | "Use `TotalAmount = TotalAmount + @amount` in SQL." | "`+ @amount` still double-counts on consumer replay or producer duplicates! Pre-filter existing `TicketNumber`s, enforce **`UNIQUE(TicketNumber)`**, and use `WHERE TotalAmount = @oldTotal` when unpartitioned." |
| **`.NET Confluent.Kafka` Offset Safety** | "Use default auto-commit." | "Default `EnableAutoOffsetStore = true` marks offsets *before* DB commit (losing data on crash). Set **`EnableAutoOffsetStore = false`** and call `StoreOffset()` after `tx.Commit()`." |
| **Cleaning Dirty Production Tables** | "Run `DELETE` and `ALTER TABLE ADD UNIQUE`." | "Deploy guarded code first, merge duplicates in **small batched transactions**, verify with Online DDL index creation, and schedule a continuous `TotalAmount <> SUM(Amount)` reconciliation query." |

---

## 14. Further Reading

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
- [Event-Driven Microservices](../../system-design/event-driven-microservices.md) — Asynchronous choreography, domain events, anti-corruption boundaries, and consumer group scaling.