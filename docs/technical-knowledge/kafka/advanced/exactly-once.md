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

---

## How the Transaction Coordinator Works

Kafka implements Exactly-Once Semantics across the **Consume-Transform-Produce** loop using a **Two-Phase Commit (2PC)** protocol managed by the **Transaction Coordinator**:

<KafkaExactlyOnceDiagram initialTab="steps" />

1. **Transaction State Topic (`__transaction_state`)**: An internal, highly-replicated Kafka topic (default 50 partitions) storing transaction state logs (`Empty`, `Ongoing`, `PrepareCommit`, `CompleteCommit`, `PrepareAbort`, `CompleteAbort`).
2. **Transaction Coordinator**: A dedicated broker thread leading the assigned `__transaction_state` partition determined by:
   $$\text{Partition Index} = \text{Math.abs}(\text{transactional.id.hashCode()}) \pmod{50}$$
3. **Atomic Offset Commit (`sendOffsetsToTxn`)**: Pairs input consumer offset advances with output record writes inside a single atomic 2PC transaction.

---

## Zombie Producer Fencing

A **Zombie Producer** is an old producer process instance that was presumed dead (e.g., due to a network partition or a 60-second G1GC pause) but recovers and attempts to publish writes to a topic while a newly spawned replacement producer instance is already active.

<KafkaExactlyOnceDiagram initialTab="zombie" />

- When Producer Instance 2 initializes via `initTransactions()`, the Transaction Coordinator increments the producer **Epoch Number** for `"payment-app-prod-1"`.
- Any subsequent write requests from Producer Instance 1 holding `Epoch = 0` are immediately fenced with an unrecoverable `ProducerFencedException`.

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

---

## See Also

- [Producer Idempotency Mechanics](../producer/producer-idempotency.md)
- [Consumer Offset Management](../consumer/consumer-overview.md)
- [Kafka Streams Deep Dive](./kafka-streams-deep-dive.md)
