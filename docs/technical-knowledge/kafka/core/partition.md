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

## The 7 Core Production Conflicts ("The War") Between Topics, Partitions, and Consumers

In real-world enterprise deployments (as highlighted in engineering deep dives like *Tips Javascript / Anonystick* and *ByteByteGo*), Topics, Partitions, and Consumers exist in constant architectural tension. Optimizing for one attribute almost always degrades another:

```
┌────────────────────────────────────────────────────────────────────────┐
│        The 7 Core Architectural Conflicts in the Kafka Topology        │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. 1:1 Partition Scale Ceiling │ Partitions cap maximum active workers │
│ 2. FIFO Order vs Parallelism   │ Global ordering forces 1 partition    │
│ 3. Key Skew vs Load Balancing  │ Hot keys overload single broker/thread│
│ 4. Dynamic Resizing Trap       │ Adding partitions breaks key ordering │
│ 5. Offset Commit Race Window   │ At-least-once dupes vs data loss      │
│ 6. Slow Consumer vs Rebalances │ max.poll.interval.ms rebalance storms │
│ 7. Partition Bloat vs Failover │ >4K partitions slow down KRaft/leaders│
└────────────────────────────────┴───────────────────────────────────────┘
```

### 1. The 1:1 Partition Concurrency Limit
- **The Rule**: Within a single consumer group, each partition is assigned to **at most one** consumer thread.
- **The Conflict**: If a topic has 6 partitions and you scale your Kubernetes consumer deployment to 10 pods, **4 pods will sit completely idle**, consuming CPU and memory without processing a single record.
- **Remediation**: Scale topic partitions *before* scaling consumer pods, or implement the **Parallel Consumer pattern** to process records concurrently across worker threads within a single partition (keyed by entity).

### 2. Global FIFO Ordering vs Horizontal Scalability
- **The Conflict**: Total FIFO ordering across an entire topic is mathematically possible **only with exactly 1 partition** ($P=1$).
- **The Consequence**: A single partition limits ingestion and consumption to the throughput of a single broker and a single consumer thread (typically $20\text{K}\text{--}50\text{K}$ msg/s).
- **Remediation**: In system design interviews, reject global ordering requirements. Enforce **per-entity ordering** using a partition key (`accountId`, `orderId`) across multiple partitions.

### 3. Key Skew & Hot Partition Starvation
- **The Conflict**: When messages are keyed, Kafka hashes the key using Murmur2. If a single entity generates massive volume (e.g. Nike LeBron James viral ad, a high-frequency trading market maker, or a celebrity user), 90% of records land on a single partition.
- **The Consequence**: One broker's disk I/O and one consumer pod are pegged at 100% CPU and breach consumer lag SLAs, while all other partitions and consumers are underutilized.
- **Remediation**: Use **Random Salting** (`key + "#salt=" + random(K)`) with two-stage window aggregation, or use compound keys (`entityId + "#" + userRegion`).

### 4. The Dynamic Partition Resizing Hazard
- **The Conflict**: Kafka allows increasing partition count dynamically (e.g. from 6 to 12 partitions), but **never allows decreasing partitions**.
- **The Trap**: Partition assignment depends on `abs(murmur2(key)) % totalPartitions`. When `totalPartitions` changes from 6 to 12, the modulo divisor changes!
- **The Consequence**: Future messages for customer `CUST-101` will route to a new partition (e.g., P8) while older in-flight messages for `CUST-101` are still being processed on P2. Downstream consumers experience **out-of-order processing** for existing keys.

### 5. Offset Commit Timing: Duplicates vs Data Loss
- **The Conflict**: When to commit consumer offsets to `__consumer_offsets`.
- **At-Most-Once**: Committing offsets *before* processing records. If the consumer crashes during database update, the message is permanently skipped and lost.
- **At-Least-Once**: Committing offsets *after* processing records. If the consumer finishes database update but crashes before the Kafka offset commit reaches the broker, the rebalanced consumer re-processes the record (causing duplicates).
- **Remediation**: Design downstream database operations to be strictly **idempotent** (unique constraint keys, Redis `SETNX`, or Upsert semantics).

### 6. Slow Consumer Processing vs Rebalance Storms
- **The Conflict**: Consumers poll batches of records (up to `max.poll.records`, default 500). If downstream API calls or database locks cause batch processing time to exceed `max.poll.interval.ms` (default 5 minutes), Kafka acts ruthlessly.
- **The Consequence**: The Group Coordinator declares the consumer dead, revokes its partitions, and triggers a group rebalance. When the consumer finally finishes and attempts to commit its offset, it is greeted with a `CommitFailedException`, its work is abandoned, and another consumer re-processes the batch — creating a cascading **Rebalance Storm**.
- **Remediation**: Tune `max.poll.records` down (e.g. to 50), increase `max.poll.interval.ms`, and offload long-running I/O to background thread pools.

### 7. Over-Partitioning Bloat vs Cluster Failover Latency
- **The Conflict**: Teams often create topics with 100+ partitions "just in case" they need future scale.
- **The Cost**: Every partition requires open file descriptors (segment `.log`, `.index`, `.timeindex` files) on disk, in-memory metadata in the KRaft controller, and follower replication thread bandwidth.
- **The Consequence**: When a broker crashes in an over-partitioned cluster (e.g. 50,000 partitions), the KRaft controller must elect tens of thousands of new partition leaders simultaneously, causing leader election failover latency to spike from milliseconds to tens of seconds.
- **Remediation**: Maintain partition counts within recommended guidelines ($< 4,000$ active leader partitions per physical broker node).

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
