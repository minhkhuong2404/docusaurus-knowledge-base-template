---
id: partition
title: Partitions
sidebar_label: Partition
---

# Partitions

## What is a Partition?

A **partition** is an ordered, immutable sequence of records (a log) within a topic. Each partition lives on exactly one broker at a time (as leader) and optionally on multiple others (as followers for replication).

```
Topic: "orders" (3 partitions, RF=3)

Broker 1: P0-Leader | P1-Follower | P2-Follower
Broker 2: P1-Leader | P2-Follower | P0-Follower
Broker 3: P2-Leader | P0-Follower | P1-Follower
```

---

## Partition Structure

```
Partition 0
┌──────────────────────────────────────────────┐
│ Offset: 0   1   2   3   4   5   6   7  ...   │
│         [m][m][m][m][m][m][m][m] ←─ append   │
└──────────────────────────────────────────────┘
                ▲               ▲
           Log Start          Log End
           Offset (LSO)       Offset (LEO)
```

Each record has:
- **Offset** — sequential ID within the partition
- **Timestamp** — creation or ingestion time
- **Key** (optional) — used for partitioning
- **Value** — the message payload
- **Headers** (optional) — metadata key-value pairs

---

## Partitioner Strategy

When a producer sends a message, the **partitioner** decides which partition to use:

### 1. Key-Based Partitioning (default when key is present)
```java
partition = murmur2(key) % numPartitions
```
All messages with the same key go to the same partition → **ordering guarantee per key**.

```java
// Same orderId always → same partition
kafkaTemplate.send("orders", orderId, orderJson);
```

### 2. Round-Robin (when key is null, Kafka < 2.4)
Messages distributed evenly across partitions. No ordering guarantee.

### 3. Sticky Partitioner (default when key is null, Kafka ≥ 2.4)
Batches all keyless messages to the **same partition** until the batch is full or `linger.ms` expires, then switches. Better throughput than pure round-robin.

### 4. Custom Partitioner
```java
public class RegionPartitioner implements Partitioner {

    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        String region = extractRegion((String) key);
        int numPartitions = cluster.partitionCountForTopic(topic);
        return switch (region) {
            case "US" -> 0 % numPartitions;
            case "EU" -> 1 % numPartitions;
            default   -> Math.abs(key.hashCode()) % numPartitions;
        };
    }
    // ...
}
```

```properties
partitioner.class=com.example.RegionPartitioner
```

---

## Partition Leadership

Every partition has exactly one **leader** and zero or more **followers**:

- **All reads and writes go through the leader**
- Followers fetch from the leader to stay in sync
- If the leader fails, the Controller elects a new leader from the ISR

```
Producer → writes to P0-Leader on Broker1
                         ↓ replicates
              P0-Follower on Broker2
              P0-Follower on Broker3
```

:::note
Since Kafka 2.4, **follower fetching** is supported — consumers can optionally read from the nearest follower replica (rack-aware) to reduce cross-AZ traffic.
:::

---

## Partition Assignment & Rebalancing

When a new consumer joins a consumer group, partitions are **rebalanced**. The **Group Coordinator** assigns partitions to consumers via an **assignor strategy**:

| Assignor | Behavior |
|---|---|
| `RangeAssignor` | Default; assigns contiguous ranges per topic |
| `RoundRobinAssignor` | Distributes evenly across all partitions and consumers |
| `StickyAssignor` | Minimizes partition movement on rebalance |
| `CooperativeStickyAssignor` | Incremental rebalance — consumers keep current partitions while new ones are assigned |

```yaml
spring:
  kafka:
    consumer:
      partition-assignment-strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

---

## Key Partition Configs

```properties
# Number of partitions (topic-level)
num.partitions=6

# Max bytes Kafka will fetch per partition per request
max.partition.fetch.bytes=1048576

# Preferred replica election: balance leadership
auto.leader.rebalance.enable=true
leader.imbalance.check.interval.seconds=300
```

---

## Interview Questions — Partitions

**Q: What determines which partition a message goes to?**

> If the message has a key, the default partitioner hashes the key (`murmur2`) and takes modulo of the partition count. Messages with the same key always land on the same partition. If there is no key, the sticky partitioner (Kafka ≥ 2.4) fills a batch for one partition before switching. A custom partitioner can implement any logic.

**Q: Why can't you decrease the number of partitions?**

> Decreasing partitions would break the key → partition mapping: the same key would hash to a different partition number, violating ordering guarantees. Existing data on deleted partitions would be lost. The only safe option is to create a new topic and migrate.

**Q: What is partition skew and how do you fix it?**

> Partition skew occurs when some partitions receive far more messages than others — usually because certain keys are "hot" (high frequency). Fix options: (1) add a random suffix to hot keys and aggregate downstream, (2) use a custom partitioner with explicit key-to-partition routing, (3) route hot keys to a dedicated topic with more partitions.

**Q: Does Kafka guarantee ordering across partitions?**

> No. Kafka only guarantees ordering within a single partition. For use cases requiring total ordering, you must use a single partition — sacrificing parallelism. For per-entity ordering (e.g., all events for a given `orderId`), use the entity ID as the partition key.

**Q: What is a preferred leader election?**

> When a broker restarts, its partitions may have been reassigned to other brokers. Kafka can automatically trigger a **preferred leader election** to restore leadership back to the originally-assigned "preferred" broker, ensuring even load distribution. Controlled by `auto.leader.rebalance.enable=true`.
