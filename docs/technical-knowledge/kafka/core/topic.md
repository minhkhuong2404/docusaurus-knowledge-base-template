---
id: topic
title: Kafka Topics
sidebar_label: Topic
description: A topic is a named, durable stream of messages in Kafka — the logical category or feed where producers write and consumers read.
tags:
  - technical-knowledge
  - kafka
  - core
  - topic
---

import KafkaTopicPartitionDiagram from '@site/src/components/KafkaTopicPartitionDiagram';

# Kafka Topics

<KafkaTopicPartitionDiagram />

---

## What is a Topic?

A **Topic** is a named, durable, logical category or feed to which producers publish messages and from which consumers read. Topics in Kafka are partitioned, replicated, and stored on disk for configurable retention periods.

---

## Topic Anatomy

| Property | Description | Senior Engineering Impact |
|---|---|---|
| **Name** | Unique string identifier (`<domain>.<entity>.<event>`). | Governs topic discovery and ACL security policies. |
| **Partitions** | Number of independent, append-only log segments. | Determines maximum horizontal consumer parallelism and write throughput. |
| **Replication Factor** | Number of broker nodes holding a copy of each partition. | Determines cluster fault-tolerance (`RF=3` tolerates 2 broker failures). |
| **Retention Policy** | Time (`retention.ms`) or size (`retention.bytes`) limits. | Governs disk storage consumption and message replay window. |
| **Cleanup Policy** | `delete`, `compact`, or `delete,compact`. | Dictates whether historical records are purged or retained per key. |

---

## Creating Topics

### CLI Commands

```bash
# Create a topic with 6 partitions and replication factor 3
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create \
  --topic orders.order.created \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=604800000 \
  --config min.insync.replicas=2
```

### Spring Boot Programmatic Topic Creation

```java
@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic ordersTopic() {
        return TopicBuilder.name("orders.order.created")
                .partitions(6)
                .replicas(3)
                .config(TopicConfig.RETENTION_MS_CONFIG, String.valueOf(7 * 24 * 60 * 60 * 1000L))
                .config(TopicConfig.MIN_IN_SYNC_REPLICAS_CONFIG, "2")
                .build();
    }

    @Bean
    public NewTopic ordersDlqTopic() {
        return TopicBuilder.name("orders.order.created.DLT")
                .partitions(6)
                .replicas(3)
                .build();
    }
}
```

---

## Topic Retention & Cleanup Policies: `delete`, `compact` & Dual Retention

Kafka manages topic storage at the partition segment level via the `cleanup.policy` topic configuration (defaulting to broker-level `log.cleanup.policy=delete`).

### 1. Delete Policy (`cleanup.policy=delete`)
* **Default policy**. Segments are deleted when their age exceeds `retention.ms` (default: 7 days) or partition disk usage exceeds `retention.bytes`.
* The background **Log Retention Check Coordinator** scans closed segments every `log.retention.check.interval.ms` (default: 5 minutes) and unlinks expired segment files.
* **Active Segment Immunity**: The active segment receiving writes is never deleted, regardless of message age.

### 2. Compact Policy (`cleanup.policy=compact`)
* Kafka retains the **latest value for every message key** indefinitely, deduplicating older versions in the background.
* Ideal for Change Data Capture (CDC), materialized tables (KTables), and distributed configuration topics.
* **Tombstone Record**: A record published with a non-null key and `value = null`. Informs downstream consumers to evict the key. The cleaner thread preserves the tombstone for `delete.retention.ms` (default 24h) before garbage collecting it.
* **Null Key Hazard**: Records published without keys (`key = null`) cannot be hashed by the cleaner and are **never compacted**, causing permanent disk consumption.

### 3. Dual Retention Policy (`cleanup.policy=compact,delete`)
* Combines key deduplication with temporal expiration.
* Compaction deduplicates intermediate updates within closed segments, while retention purges segments whose maximum record timestamp exceeds `retention.ms`.
* Ideal for **GDPR compliance** (Right to be Forgotten) and bounded user session state.

```properties
# Topic configuration snippet for dual retention
cleanup.policy=compact,delete
retention.ms=2592000000       # 30 days time-to-live
min.cleanable.dirty.ratio=0.5 # Trigger compaction when dirty log >= 50%
delete.retention.ms=604800000 # Retain tombstones for 7 days to prevent resurrection
segment.ms=86400000           # Force roll active segment daily for low-volume topics
```

:::tip Deep Dive
For detailed internal engine mechanics of the `SkimpyOffsetMap`, two-pass cleaner algorithms, and tombstone resurrection runbooks, see the [Kafka Cleanup Policy & Log Compaction Deep Dive](../advanced/kafka-log-compaction.md).
:::

---

## Interview Questions

### Q1. How do you calculate the optimal partition count for a new Kafka topic?
> Estimate target write throughput ($T_{\text{write}}$) and read throughput ($T_{\text{read}}$). Calculate partitions using:
> $$\text{Partitions} = \max\left(\frac{T_{\text{write}}}{\text{Max Producer Throughput per Partition}}, \frac{T_{\text{read}}}{\text{Max Consumer Throughput per Partition}}, \text{Consumer Parallelism Count}\right)$$
> Rule of thumb: start with 6–12 partitions for moderate workloads, allowing future consumer group scaling without topic re-creation.

### Q2. Can you decrease the number of partitions in an existing Kafka topic?
> No. Kafka only supports increasing partition counts. Decreasing partitions is impossible because it would break hash-key partitioning routing ($hash(key) \pmod N$) and disrupt ordering guarantees for existing data across log segments. Decreasing partitions requires creating a new topic with fewer partitions and migrating data via Kafka Connect or custom consumer pipelines.

### Q3. What is a Tombstone record in a compacted Kafka topic?
> A tombstone record is a message published with a non-null key and a `null` payload. In a compacted topic (`cleanup.policy=compact`), the tombstone signals that the key has been deleted. Background log cleaner threads retain the tombstone for `delete.retention.ms` (default 24 hours) so lagging consumers can read the tombstone and delete the entity from local memory/databases before the tombstone is purged.

### Q4. What happens if a topic's configured replication factor exceeds the total number of live brokers in the cluster?
> Topic creation fails immediately with `InvalidReplicationFactorException`. Each replica of a partition must reside on a distinct physical broker node to ensure fault tolerance. A cluster with 3 brokers cannot host a topic with a replication factor of 4.

---

## See Also

- [Kafka Broker Architecture](./broker.md)
- [Kafka Partition Scaling & Offsets](./scaling-partitions.md)
- [Kafka Partitioning Strategies](./kafka-partitioning-strategies.md)
