---
id: scaling-partitions
title: Scaling Partitions
sidebar_label: Scaling Partitions
description: Partitions are the unit of parallelism in Kafka. Scaling them is critical for throughput but can break ordering for keyed topics. This guide covers the mechanics, risks, and migration strategies.
tags:
  - technical-knowledge
  - kafka
  - core
  - scaling-partitions
---

import KafkaPartitionScalingDiagram from '@site/src/components/KafkaPartitionScalingDiagram';

# Scaling Partitions in Kafka

<KafkaPartitionScalingDiagram />

---

## Why Scale Partitions?

Partitions are Apache Kafka's primary unit of **parallelism, throughput scaling, and consumer concurrency**. Because a single partition can be assigned to at most one active consumer within a consumer group, a topic's partition count acts as the hard ceiling for concurrent processing capacity.

If your processing demands exceed what 5 consumers can process, you **must** scale partition counts to expand consumer group parallelism.

---

## How Partition Alterations Work

Altering partition counts is accomplished via CLI or AdminClient:

```bash
# Add partitions to a topic in-place
kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter \
  --topic order-events \
  --partitions 12
```

| Alteration Type | Impact on Existing Data | Ordering Impact |
|---|---|---|
| **Non-Keyed Topics** (Round-Robin / Sticky) | Safe. Existing segment logs remain untouched; new messages route across 12 partitions. | No impact (no per-key ordering was specified). |
| **Keyed Topics** (MurmurHash2 Partitioning) | ⚠️ **DANGEROUS**. Existing records remain on old partitions. New records route to different partitions. | **Permanently breaks per-key ordering guarantees**. |

---

## The Hash Ring Breakdown Problem

For keyed records, Kafka calculates destination partition indices using:

$$\text{Partition Index} = \left( \text{toPositive}(\text{murmur2}(\text{key})) \right) \pmod N$$

```
Key: "user_789" (MurmurHash2 = 412057)

Before Alteration (5 Partitions):   412057 % 5  = Partition 2
After Alteration  (10 Partitions):  412057 % 10 = Partition 7  (DIFFERENT PARTITION!)
```

New events for `user_789` land on Partition 7, while historical unconsumed events sit on Partition 2. Consumer instances processing Partition 7 will process new updates *out-of-order* before consumers processing Partition 2 finish historical messages.

---

## Zero-Downtime Migration Strategy for Keyed Topics

To scale partitions for a keyed topic without breaking ordering:

```
Step 1: Create new topic "order-events-v2" with 12 partitions.
Step 2: Pause producers publishing to "order-events-v1".
Step 3: Wait until consumer group lag on "order-events-v1" drops to zero (drain old log).
Step 4: Update producers to publish to "order-events-v2".
Step 5: Re-configure consumers to subscribe to "order-events-v2".
```

---

## Interview Questions

### Q1. Can you decrease the number of partitions in a Kafka topic?
> No. Kafka strictly prohibits decreasing topic partition counts. Reducing partitions would require deleting partition directories, resulting in data loss and breaking hash-key routing rules ($hash(key) \pmod N$). To reduce partitions, you must create a new topic with fewer partitions and migrate data.

### Q2. What happens to existing data when you alter a topic's partition count in-place?
> Existing log segments and offsets remain untouched on their current brokers — no data is moved or re-hashed. Only newly produced records published after the alteration are routed across the expanded set of partitions.

### Q3. Why does increasing partitions break per-key message ordering?
> The default partitioner calculates destination partitions via $\text{murmur2}(key) \pmod N$. When $N$ (the total partition count) changes, the modulo calculation produces a different partition index for the same key. Subsequent events for that key route to a new partition, while historical events remain on the old partition, causing out-of-order processing across parallel consumers.

---

## See Also

- [Kafka Topic Mechanics](./topic.md)
- [Kafka Partition Assignment Strategies](./partition.md)
- [Consumer Rebalance Storms](../advanced/rebalance-storms.md)
