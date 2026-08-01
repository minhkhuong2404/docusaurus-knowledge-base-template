---
id: partition
title: Partitions
sidebar_label: Partition
description: A partition is an ordered, immutable sequence of records within a topic — the fundamental unit of parallelism, replication, and storage scaling in Kafka.
tags:
  - technical-knowledge
  - kafka
  - core
  - partition
---

import KafkaPartitionOffsetDiagram from '@site/src/components/KafkaPartitionOffsetDiagram';

# Partitions

<KafkaPartitionOffsetDiagram />

---

## What is a Partition?

A **Partition** is the fundamental unit of storage, parallelism, and replication in Apache Kafka. Each topic is divided into one or more partitions, where each partition is an append-only, ordered, immutable sequence of `RecordBatch` structures on disk.

Every message written to a partition is assigned a monotonically increasing 64-bit integer ID called an **Offset**.

```
Partition 0 Log Segment:
+----------+----------+----------+----------+----------+
| Offset 0 | Offset 1 | Offset 2 | Offset 3 | Offset 4 | ... (Append-only >)
+----------+----------+----------+----------+----------+
```

---

## Partitioning Strategies

When a producer publishes a record, the **Producer Partitioner** determines which partition index receives the message:

### 1. Key-Based Hashing (`DefaultPartitioner`)
When a non-null key is present, Kafka computes the partition index using MurmurHash2:

$$\text{Partition Index} = \left( \text{toPositive}(\text{Utils.murmur2}(\text{key})) \right) \pmod N$$

Guarantees strict **per-key ordering**: all records with identical keys (e.g., `account_id = "ACC-9921"`) land on the exact same partition.

### 2. Sticky Partitioner (Keyless Messages, Kafka 2.4+)
When no key is specified (`key == null`), the **Sticky Partitioner** batches records targeted for a single partition until `batch.size` or `linger.ms` is reached, before switching to the next partition. This maximizes batch compression efficiency compared to round-robin.

### 3. Custom Partitioner Implementation

```java
public class RegionPartitioner implements Partitioner {

    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        int numPartitions = cluster.partitionCountForTopic(topic);
        String regionKey = (String) key;
        
        return switch (regionKey) {
            case "US-EAST" -> 0;
            case "US-WEST" -> 1;
            case "EU-CENTRAL" -> 2;
            default -> Math.abs(Utils.murmur2(keyBytes)) % numPartitions;
        };
    }

    @Override
    public void close() {}

    @Override
    public void configure(Map<String, ?> configs) {}
}
```

---

## Consumer Group Partition Assignment Strategies

The **Consumer Group Leader** assigns partition partitions to group instances using one of four assignment algorithms:

| Strategy | Algorithm | Behavior |
|---|---|---|
| `RangeAssignor` | Topic-by-Topic | Groups partitions per topic and assigns contiguous ranges to consumers. Can cause assignment imbalance. |
| `RoundRobinAssignor` | Global Interleaving | Interleaves all partitions across all subscribed topics evenly among consumers. |
| `StickyAssignor` | Minimal Displacement | Preserves current partition assignments during rebalance while distributing unassigned partitions evenly. |
| `CooperativeStickyAssignor` | Incremental Rebalance | Uses two-phase cooperative protocol; non-affected consumers continue processing without STW pauses. |

```yaml
spring:
  kafka:
    consumer:
      properties:
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

---

## Interview Questions

### Q1. Does Apache Kafka guarantee global message ordering across an entire topic?
> No. Kafka guarantees message ordering strictly **within a single partition**, not across different partitions of the same topic. For strict per-entity ordering (e.g., e-commerce order state transitions), use the entity ID as the message key so all related events route to the same partition. To achieve global ordering for an entire topic, set partition count to 1 (which sacrifices multi-worker consumer scaling).

### Q2. What is Partition Skew and how do you mitigate hot keys in production?
> Partition Skew occurs when a minority of partitions receive a disproportionately massive volume of traffic due to non-uniform key distribution (hot keys). Remedies include: (1) **Salting Keys**: Appending a random integer suffix (`order_id + "_" + random(1..4)`) to spread hot key writes across 4 sub-partitions; (2) **Custom Partitioner**: Routing high-traffic accounts to dedicated isolated partitions; (3) **Keyless Sticky Publishing**: Publishing non-keyed events to allow uniform batching.

### Q3. How does `CooperativeStickyAssignor` eliminate Stop-The-World rebalance pauses?
> The legacy Eager rebalance protocol forces all consumers in a group to revoke all assigned partitions and stop fetching during a rebalance. The `CooperativeStickyAssignor` uses an incremental protocol: consumers retain their existing partition assignments during the first rebalance phase, only revoking partitions that need to be reassigned. Active processing continues uninterrupted for unaffected partitions.

---

## See Also

- [Kafka Topic Architecture](./topic.md)
- [Kafka Partition Scaling Mechanics](./scaling-partitions.md)
- [Consumer Group Lag & Rebalancing](../consumer/consumer-lag.md)
