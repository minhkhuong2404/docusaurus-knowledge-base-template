---
id: kafka-exactly-once
title: Kafka Exactly-Once Semantics (EOS)
sidebar_label: Exactly-Once (EOS)
description: A complete guide to Kafka exactly-once semantics — delivery guarantees, idempotent producer, transactions, read_committed consumers, Kafka Streams EOS, zombie producer fencing, two-phase commit internals, and production patterns.
tags: [kafka, exactly-once, eos, idempotent-producer, transactions, kafka-streams, distributed-systems, messaging]
---

import KafkaExactlyOnceDiagram from '@site/src/components/KafkaExactlyOnceDiagram';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Kafka Exactly-Once Semantics (EOS)

:::info[Who this guide is for]
- **New learners** — start at [The Delivery Guarantee Problem](#the-delivery-guarantee-problem) to understand the three messaging models.
- **Senior engineers** — jump to [Transaction Coordinator Mechanics](#how-the-transaction-coordinator-works), [Zombie Producer Fencing](#zombie-producer-fencing), [Kafka Streams EOS](#kafka-streams-eos), or [Failure Scenarios](#failure-scenarios).
:::

---

## The Delivery Guarantee Problem

In distributed stream processing, network failures, timeouts, and broker restarts introduce risks of record loss or duplication:

| Guarantee | Mechanism | Risk | Primary Use Cases |
|-----------|-------------|------|---------|
| **At-most-once** | `acks=0`; no retries. | Data loss possible. | High-frequency telemetry, clickstream analytics. |
| **At-least-once** | `acks=all`, `retries > 0`. | Duplicate delivery possible. | Standard business events with idempotent consumer handling. |
| **Exactly-once (EOS)** | Idempotence + Kafka Transactions + `read_committed`. | No loss, no duplicates. | Financial ledger processing, payment gateways, inventory state. |

:::tip For newcomers
Picture a producer sending a record and waiting for the broker's "got it" acknowledgment. If that acknowledgment gets lost on the way back — not the original record, just the reply — the producer has no way to know whether the broker actually received it. **At-most-once** says "I won't resend, so if that happened, the message is just gone." **At-least-once** says "I'll resend to be safe," which means the broker might now have two copies. **Exactly-once** is Kafka's answer to "can we get the safety of resending without the risk of duplicates?" — and the answer, as this page explains, is yes, but only through a specific combination of mechanisms, not through any single setting.
:::

It's worth being precise about what "exactly-once" means here, because the phrase oversells itself if taken literally: Kafka cannot prevent a producer from *physically* retransmitting a record over the network — that's unavoidable in any system with retries. What Kafka actually guarantees is that a retransmitted (duplicate) record is deduplicated **on the broker side** before it's ever visible to a consumer, and that a multi-step consume-transform-produce operation either takes full effect exactly once or has no effect at all. The guarantee is about *observable outcomes*, not about the wire never carrying a duplicate byte stream.

---

## How the Transaction Coordinator Works

Kafka implements Exactly-Once Semantics across the **Consume-Transform-Produce** loop using a **Two-Phase Commit (2PC)** protocol managed by the **Transaction Coordinator**:

<KafkaExactlyOnceDiagram initialTab="steps" />

1. **Transaction State Topic (`__transaction_state`)**: An internal, highly-replicated Kafka topic (default 50 partitions) storing transaction state logs (`Empty`, `Ongoing`, `PrepareCommit`, `CompleteCommit`, `PrepareAbort`, `CompleteAbort`).
2. **Transaction Coordinator**: A dedicated broker thread leading the assigned `__transaction_state` partition determined by:
   $$\text{Partition Index} = \text{Math.abs}(\text{transactional.id.hashCode()}) \pmod{50}$$
3. **Atomic Offset Commit (`sendOffsetsToTxn`)**: Pairs input consumer offset advances with output record writes inside a single atomic 2PC transaction.

### Deep Dive: The Full Commit Sequence, Step by Step

The high-level "2PC" description hides a fair amount of coordination that senior engineers are expected to be able to walk through:

```
1. producer.initTransactions()
   → Coordinator looks up (or creates) the transactional.id's metadata,
     bumps the Producer Epoch, and fences any prior producer instance
     with the same transactional.id (see Zombie Fencing below).

2. producer.beginTransaction()
   → Purely a client-side state change; no broker RPC yet.

3. producer.send(record) [one or more, possibly to multiple partitions]
   → Coordinator adds each target partition to the transaction's
     partition list via AddPartitionsToTxnRequest, writing
     ongoing-transaction markers so brokers know to withhold these
     records from read_committed consumers until the outcome is known.

4. producer.sendOffsetsToTransaction(offsets, consumerGroupId)
   → The consumer group's offset commit is registered as part of
     the SAME transaction — this is what makes "consume input,
     produce output" atomic as one unit, not two.

5. producer.commitTransaction()
   → PHASE 1 (Prepare): Coordinator writes a PrepareCommit marker to
     __transaction_state (durable, replicated) — this is the true
     point of no return.
   → PHASE 2 (Commit): Coordinator writes a transaction COMMIT control
     record to every partition involved, then writes CompleteCommit
     to __transaction_state. Only after this do read_committed
     consumers advance their view past these records.
```

If the producer crashes between steps 3 and 5, the transaction is left `Ongoing` — see [Failure Scenarios](#failure-scenarios) for how the coordinator resolves this via `transaction.timeout.ms`.

### The Last Stable Offset (LSO) and `read_committed`

A `read_committed` consumer doesn't simply "skip aborted records" — it is bounded by the **Last Stable Offset (LSO)**: the offset up to which all transactions have reached a final `CompleteCommit` or `CompleteAbort` state. The consumer physically cannot fetch past the LSO, even if higher offsets exist on disk, because Kafka doesn't yet know whether those records will end up committed or aborted. This has a direct operational consequence: **a single long-running or stuck transaction on a partition stalls every `read_committed` consumer of that partition at the LSO**, even for records from entirely unrelated, healthy transactions that were written later. This is why `transaction.timeout.ms` (default 60s) matters — it bounds how long one wedged producer can stall every downstream consumer.

---

## Zombie Producer Fencing

A **Zombie Producer** is an old producer process instance that was presumed dead (e.g., due to a network partition or a 60-second G1GC pause) but recovers and attempts to publish writes to a topic while a newly spawned replacement producer instance is already active.

<KafkaExactlyOnceDiagram initialTab="zombie" />

- When Producer Instance 2 initializes via `initTransactions()`, the Transaction Coordinator increments the producer **Epoch Number** for `"payment-app-prod-1"`.
- Any subsequent write requests from Producer Instance 1 holding `Epoch = 0` are immediately fenced with an unrecoverable `ProducerFencedException`.

### Deep Dive: PID, Sequence Number, and Epoch — Three Different Numbers

These three identifiers are easy to conflate but protect against three different failure modes:

| Identifier | Scope | Protects Against |
| :--- | :--- | :--- |
| **Producer ID (PID)** | Assigned once per producer session by the broker | Distinguishing which producer wrote a given record |
| **Sequence Number** | Per `(PID, partition)`, increments on every send | Duplicate writes from network-level retries *within the same producer instance* |
| **Producer Epoch** | Bumped by the coordinator on every `initTransactions()` call for a given `transactional.id` | Two *instances* of the same logical producer (e.g., old pod + new pod after a k8s reschedule) writing concurrently |

The epoch is the mechanism specific to zombie fencing — sequence numbers alone don't help here, because the zombie instance's sequence numbers are perfectly valid from its own point of view; it simply doesn't know it's been superseded. `ProducerFencedException` is deliberately unrecoverable (the producer must be discarded, not retried) precisely because a fenced producer's continued operation is the actual bug being prevented.

**Practical implication for Kubernetes deployments**: if you set `transactional.id` to something derived from the pod name (`order-service-${POD_NAME}`) rather than a logical role (`order-service-tx-partition-3`), a rescheduled pod gets a *new* transactional ID rather than fencing its predecessor — silently defeating zombie protection instead of triggering it. The `transactional.id` should be stable per logical producer role, not per process instance.

---

## Kafka Streams EOS

Kafka Streams applications are the canonical consume-transform-produce workload, and `EXACTLY_ONCE_V2` (the current, epoch-based EOS implementation, set via `processing.guarantee`) wires all of the above mechanisms together automatically per stream task — you don't manually call `beginTransaction()`/`commitTransaction()` in application code.

```java
@Bean(name = KafkaStreamsDefaultConfiguration.DEFAULT_STREAMS_CONFIG_BEAN_NAME)
public KafkaStreamsConfiguration streamsConfig() {
    return new KafkaStreamsConfiguration(Map.of(
        StreamsConfig.APPLICATION_ID_CONFIG,        "order-enrichment-service",
        StreamsConfig.BOOTSTRAP_SERVERS_CONFIG,     "localhost:9092",
        StreamsConfig.PROCESSING_GUARANTEE_CONFIG,  StreamsConfig.EXACTLY_ONCE_V2,
        // Lower commit interval trades throughput for lower end-to-end latency
        // of when downstream read_committed consumers see new data
        StreamsConfig.COMMIT_INTERVAL_MS_CONFIG,    100
    ));
}
```

What `EXACTLY_ONCE_V2` actually does per Streams task, tying back to the mechanics above:

- Each stream **task** (not each thread, not each instance) gets its own internal producer with a `transactional.id` derived from `application.id` + task ID — stable across restarts, so rescheduling correctly fences a stale instance of the same task rather than silently bypassing protection.
- Every commit interval (`commit.interval.ms`, default 100ms under EOS vs 30s otherwise), the task performs one atomic transaction covering: input offsets consumed since the last commit, all output records produced, **and** any RocksDB state store changelog writes (see the companion [State Store vs Redis Deep Dive](./exactly-once-vs-dedup.md#7-kafka-streams-state-store-vs-redis-deep-dive) for why this atomicity is the reason state stores are the preferred dedup backend for pure Kafka-to-Kafka pipelines).
- On task failure and reassignment during a rebalance, the new task owner resumes from the last **committed** offset — any records from an in-flight, uncommitted transaction are simply never observed by downstream `read_committed` consumers, so there's no manual cleanup step.

**Performance trade-off worth stating explicitly in a design review**: `EXACTLY_ONCE_V2` typically costs single-digit-percent to ~20-30% throughput versus at-least-once processing, driven mainly by the more frequent commit interval and the coordinator round trips per transaction — not by the idempotent producer itself, which is nearly free. For most business-event pipelines this is a reasonable trade for correctness; for extremely high-throughput analytics pipelines where duplicates are cheap to tolerate downstream, at-least-once with idempotent consumers (see the companion dedup guide) is often the better default.

---

## Failure Scenarios

Walking through what actually happens on each failure mode is the difference between reciting the mechanism and being able to debug it in production.

### Scenario 1: Producer Crashes Mid-Transaction (Before Commit)

```
t0: beginTransaction()
t1: send(record A) → partition 3
t2: send(record B) → partition 7
t3: producer process crashes (OOM, node eviction, etc.)
```

The transaction sits in `Ongoing` state in `__transaction_state`. Records A and B are physically on disk in their partitions but carry no commit marker, so they remain invisible to `read_committed` consumers indefinitely — **until** `transaction.timeout.ms` (default 60s) elapses, at which point the coordinator unilaterally writes an abort marker and the transaction resolves to `CompleteAbort`. No manual intervention is needed, but this is exactly the window that can stall downstream consumers at the LSO, as described above — a shorter `transaction.timeout.ms` reduces the blast radius at the cost of more aggressively aborting genuinely-slow-but-healthy transactions.

### Scenario 2: Coordinator Broker Fails Mid-Transaction

The `__transaction_state` topic is replicated like any other Kafka topic (`transaction.state.log.replication.factor`, recommended ≥ 3 in production). If the broker leading a given `__transaction_state` partition fails, a replica takes over as the new coordinator and resumes from the last durably-written state (`Ongoing`, `PrepareCommit`, etc.) — this is why Phase 1 (`PrepareCommit`) is durably written *before* Phase 2 begins: it lets a newly-elected coordinator safely resume or complete the commit rather than having to guess the outcome.

### Scenario 3: Duplicate `send()` Due to Network Retry

```java
// Producer's internal retry after a timeout waiting for a broker ACK —
// this is invisible to application code; it happens inside the KafkaProducer client
producer.send(record); // broker receives it, but the ACK is lost in transit
// client-side retry logic resends the same logical record automatically
```

The idempotent producer layer (always active when `transactional.id` is set) catches this at the broker: the retried `send` carries the same `(PID, partition, sequence number)`, and the broker recognizes it as already-applied, discarding the duplicate and returning the original offset — the application code never sees a difference, and no downstream duplicate is created.

### Scenario 4: Consumer Reads Before a Transaction Resolves

A `read_committed` consumer fetching a partition with an `Ongoing` transaction at a lower offset than requested is simply held at the LSO by the broker's fetch response (it returns only up to the LSO, never partial/uncommitted data) — this is a normal, expected wait, not an error condition, and typically resolves within one commit interval under healthy operation.

---

## Configuration Reference

| Setting | Where | Default | Senior Guidance |
| :--- | :--- | :--- | :--- |
| `enable.idempotence` | Producer | `true` (since Kafka 3.0 with `acks=all`) | Required baseline for EOS; near-zero overhead, leave enabled even outside transactions |
| `transactional.id` | Producer | none | Must be stable per logical producer role across restarts — see the Kubernetes pitfall above |
| `transaction.timeout.ms` | Producer | `60000` | Lower it to reduce how long a crashed producer can stall `read_committed` consumers at the LSO; too low aborts legitimately slow transactions |
| `isolation.level` | Consumer | `read_uncommitted` | Must be explicitly set to `read_committed` — the default does **not** enforce EOS on the read side |
| `processing.guarantee` | Kafka Streams | `at_least_once` | Set to `exactly_once_v2` for EOS; older `exactly_once` (v1) is deprecated and slower |
| `commit.interval.ms` | Kafka Streams | `30000` (100 under EOS) | Lower values reduce end-to-end latency for downstream consumers at the cost of more coordinator overhead |
| `transaction.state.log.replication.factor` | Broker | `3` | Never run below 3 in production — this topic is the single source of truth for every transaction's outcome |

---

## Production Spring Boot Configuration

```java
@Configuration
public class KafkaTransactionConfig {

    @Bean
    public ProducerFactory<String, Object> transactionalProducerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "order-service-tx-");
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTransactionManager<String, Object> kafkaTransactionManager(
            ProducerFactory<String, Object> producerFactory) {
        return new KafkaTransactionManager<>(producerFactory);
    }
}
```

```yaml
# Consumer Configuration for EOS
spring:
  kafka:
    consumer:
      isolation-level: read_committed
      enable-auto-commit: false
```

### Consume-Transform-Produce in Spring, End to End

The config alone doesn't show *why* `sendOffsetsToTransaction` matters — this listener shows the full atomic unit in application code:

```java
@Service
@RequiredArgsConstructor
public class OrderEnrichmentService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    // KafkaTransactionManager + @Transactional on the listener container makes
    // the input offset commit and the output send() part of one Kafka transaction —
    // this is the manual equivalent of what Streams' EXACTLY_ONCE_V2 does internally.
    @KafkaListener(topics = "raw-orders", groupId = "order-enrichment")
    @Transactional("kafkaTransactionManager")
    public void enrichAndForward(ConsumerRecord<String, RawOrder> record) {
        EnrichedOrder enriched = enrich(record.value());
        kafkaTemplate.send("enriched-orders", record.key(), enriched);
        // No manual sendOffsetsToTransaction() call needed — Spring's
        // ChainedKafkaTransactionManager wiring handles registering the
        // consumed offset with the same transaction automatically.
    }
}
```

---

## Interview Questions

### Q1. What are the three foundational pillars required for end-to-end Exactly-Once Semantics (EOS) in Apache Kafka?
> 1. **Idempotent Producer (`enable.idempotence=true`)**: Guarantees zero duplicates on network retries within a single producer session via PID and sequence number tracking.
> 2. **Transactional Producer (`transactional.id` + 2PC)**: Enables atomic multi-partition record writes and pairs output writes with input consumer offset commits via `sendOffsetsToTransaction()`.
> 3. **Transactional Consumer (`isolation-level=read_committed`)**: Restricts consumer fetching to records from committed transactions, withholding uncommitted or aborted transaction records below the Last Stable Offset (LSO).

### Q2. What is `sendOffsetsToTransaction` and why is it essential for the Consume-Transform-Produce pattern?
> `sendOffsetsToTransaction` registers the consumer group's input offsets directly with the Transaction Coordinator inside an active Kafka transaction. This pairs the consumption of input records and the production of output records into a single atomic 2-Phase Commit operation. If the transaction commits, both output messages and input offsets advance together; if it aborts, output messages are hidden and input offsets do not advance, preventing record loss or duplication.

### Q3. How does Zombie Producer Fencing operate in Kafka transactions?
> When a new transactional producer instance calls `initTransactions()` with a static `transactional.id`, the Transaction Coordinator increments the producer's **Epoch Number** in the `__transaction_state` topic. If a previous "zombie" instance (which paused due to network delays or GC freezes) attempts to commit a transaction using the old epoch, the coordinator rejects the write with a `ProducerFencedException`.

### Q4. Why can a single stuck transaction stall consumers that aren't even reading records from that transaction?
> Because `read_committed` consumers are bounded by the **Last Stable Offset (LSO)** — the highest offset up to which every transaction has reached a final commit or abort state — not by which specific records belong to which transaction. If a transaction at offset 100 is still `Ongoing`, the LSO cannot advance past 100, so a consumer is held there even if healthy, already-committed records exist at offset 150. This is why `transaction.timeout.ms` is a production-critical tuning knob, not just a producer-side detail.

### Q5. Why does Kafka Streams' `EXACTLY_ONCE_V2` reduce `commit.interval.ms` to 100ms by default, and what's the trade-off?
> Under EOS, downstream `read_committed` consumers can't see any output until the producing task's transaction commits — so the commit interval directly controls end-to-end pipeline latency, not just throughput. A 100ms default keeps latency reasonable for most business workloads. The trade-off is coordinator overhead: each commit is a real transaction with `AddPartitionsToTxnRequest` and `EndTxnRequest` round trips, so very aggressive intervals (e.g., 10ms) can meaningfully reduce throughput without a corresponding latency benefit once you're already below what downstream consumers actually need.

---

## See Also

- [Producer Idempotency Mechanics](../producer/producer-idempotency.md)
- [Consumer Offset Management](../consumer/consumer-overview.md)
- [Kafka Streams Deep Dive](./kafka-streams-deep-dive.md)
- [Deduplication in Distributed Messaging (State Store vs Redis)](./exactly-once-vs-dedup.md) — what to do once your pipeline steps outside Kafka's transaction boundary.