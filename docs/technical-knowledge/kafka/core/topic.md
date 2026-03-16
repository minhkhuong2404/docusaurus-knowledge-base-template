---
id: topic
title: Kafka Topics
sidebar_label: Topic
---

# Kafka Topics

## What is a Topic?

A **topic** is a named, durable stream of messages in Kafka. Think of it as a logical category or feed where producers write and consumers read.

```
Topic: "orders"
┌─────────────────────────────────────────┐
│  Partition 0: [msg0][msg1][msg2][msg3]  │
│  Partition 1: [msg0][msg1][msg2]        │
│  Partition 2: [msg0][msg1][msg2][msg3]  │
└─────────────────────────────────────────┘
```

---

## Topic Anatomy

| Property | Description |
|---|---|
| **Name** | Unique identifier (supports `.`, `_`, `-`, alphanumeric) |
| **Partitions** | Number of parallel logs (affects throughput & parallelism) |
| **Replication Factor** | Number of copies across brokers (affects fault tolerance) |
| **Retention** | How long messages are kept |
| **Cleanup Policy** | `delete` (time/size) or `compact` (latest per key) |

---

## Creating Topics

### CLI
```bash
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create \
  --topic orders \
  --partitions 6 \
  --replication-factor 3
```

### AdminClient (Java)
```java
@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic ordersTopic() {
        return TopicBuilder.name("orders")
                .partitions(6)
                .replicas(3)
                .config(TopicConfig.RETENTION_MS_CONFIG, String.valueOf(7 * 24 * 60 * 60 * 1000L))
                .build();
    }

    @Bean
    public NewTopic ordersDlqTopic() {
        return TopicBuilder.name("orders.DLT")
                .partitions(6)
                .replicas(3)
                .build();
    }
}
```

Spring Boot auto-creates topics declared as `@Bean` of type `NewTopic` on startup.

---

## Cleanup Policies

### Delete Policy (default)
Messages are removed after `retention.ms` (default 7 days) or when log size exceeds `retention.bytes`.

```properties
cleanup.policy=delete
retention.ms=604800000    # 7 days
retention.bytes=-1        # unlimited
```

### Compact Policy
Kafka retains only the **latest record per key**. Useful for event sourcing, CDC, or state stores.

```properties
cleanup.policy=compact
min.cleanable.dirty.ratio=0.5
```

A tombstone (null value) record signals deletion of a key.

### Combined: delete,compact
```properties
cleanup.policy=delete,compact
```
Compacts the log AND deletes segments older than retention time.

---

## Topic Naming Conventions

A consistent naming convention improves maintainability:

```
<domain>.<entity>.<event>
<team>.<service>.<entity>

# Examples
orders.order.created
payments.payment.processed
inventory.product.updated
analytics.user.clickstream

# Dead Letter Topics (DLT)
orders.order.created.DLT
```

---

## Internal Topics

Kafka uses several internal topics automatically:

| Topic | Purpose |
|---|---|
| `__consumer_offsets` | Stores committed consumer offsets |
| `__transaction_state` | Tracks transaction state for EOS |
| `_schemas` | Schema Registry metadata (Confluent) |
| `connect-offsets` | Kafka Connect source connector offsets |
| `connect-configs` | Kafka Connect connector configurations |
| `connect-status` | Kafka Connect connector status |

---

## Topic Metrics

| Metric | Description |
|---|---|
| `LogEndOffset` | Latest offset in the partition |
| `LogStartOffset` | Earliest available offset |
| `NumLogSegments` | Number of segment files |
| `Size` | Total size on disk |

---

## Interview Questions — Topics

**Q: How do you choose the number of partitions for a topic?**

> Partitions determine parallelism. A good starting formula: `partitions = max(target throughput / throughput per partition, desired consumer parallelism)`. Over-partitioning wastes resources (file handles, memory); under-partitioning bottlenecks throughput. Common recommendation: start with 3–12 partitions for moderate workloads; you can increase but never decrease partitions.

**Q: Can you reduce the number of partitions in a Kafka topic?**

> No. Kafka only allows increasing partitions, never decreasing. Decreasing would require re-mapping existing data and could violate ordering guarantees for partitioned keys. To reduce partitions, you'd need to create a new topic with fewer partitions and migrate data.

**Q: What is the difference between `delete` and `compact` cleanup policies?**

> `delete` removes messages after a time or size threshold — messages are gone forever. `compact` keeps only the latest value per key, forever (unless a tombstone is sent). Use `delete` for transient event streams; use `compact` for tables/state that consumers need to replay from scratch.

**Q: What is a tombstone message?**

> A tombstone is a record with a non-null key and a **null value**. In a compacted topic, it signals that the key should be deleted. During compaction, the tombstone itself is eventually removed after `delete.retention.ms` (default 24 hours), giving lagging consumers time to see the deletion.

**Q: What happens if a topic's replication factor is higher than the number of brokers?**

> Topic creation fails with `InvalidReplicationFactorException`. You cannot have more replicas than there are brokers, since each replica must reside on a distinct broker.
