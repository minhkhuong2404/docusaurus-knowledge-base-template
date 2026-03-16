---
id: replication
title: Replication, ISR & Fault Tolerance
sidebar_label: Replication & ISR
---

# Replication, ISR & Fault Tolerance

## Replication Factor

The **replication factor** defines how many copies of each partition exist across the cluster.

```
Topic: "orders"  Partitions=3  ReplicationFactor=3

Broker 1: P0-Leader,  P1-Follower, P2-Follower
Broker 2: P1-Leader,  P2-Follower, P0-Follower
Broker 3: P2-Leader,  P0-Follower, P1-Follower
```

| RF | Fault Tolerance | Min Brokers |
|----|----------------|-------------|
| 1  | None           | 1           |
| 2  | 1 broker lost  | 2           |
| 3  | 2 brokers lost | 3           |

:::warning Production Rule
Always use `replication.factor ≥ 3` in production. A RF of 2 gives you minimal protection and zero tolerance for a second failure during recovery.
:::

---

## In-Sync Replicas (ISR)

The **ISR (In-Sync Replicas)** is the set of replicas that are fully caught up with the leader.

```
Leader: P0 on Broker1 (LEO = 100)
ISR:    [Broker1, Broker2, Broker3]

Broker2 follower slow → falls behind → removed from ISR
ISR:    [Broker1, Broker3]

Broker2 catches up → added back to ISR
ISR:    [Broker1, Broker2, Broker3]
```

### ISR Membership Criteria

A follower is **in-sync** if it has fetched all messages from the leader within `replica.lag.time.max.ms` (default 30 seconds).

```properties
# Max time a follower can be behind before being removed from ISR
replica.lag.time.max.ms=30000
```

If a follower hasn't fetched recently, it's kicked from the ISR. When it catches up, it rejoins.

---

## High Watermark (HW) vs Log End Offset (LEO)

These two offsets are fundamental to understanding replication safety:

| Term | Definition |
|---|---|
| **LEO** (Log End Offset) | The next offset to be written — latest offset on each replica |
| **HW** (High Watermark) | The highest offset that has been replicated to **all ISR** members |

```
Leader LEO:    100
Follower1 LEO: 98
Follower2 LEO: 100

High Watermark = min(ISR LEOs) = 98

Consumers can only read up to offset 97 (HW - 1)
```

The High Watermark ensures **consumers only read fully replicated messages** — preventing reading data that might be lost in a leader failover.

---

## `min.insync.replicas` (MISR)

`min.insync.replicas` defines the **minimum number of ISR replicas** that must acknowledge a write before the broker considers it successful (when `acks=all`).

```properties
# Topic-level or broker-level config
min.insync.replicas=2
```

### The Safe Combination

```
acks=all  +  min.insync.replicas=2  +  replication.factor=3
```

This means:
- A message must be written to at least 2 out of 3 replicas
- You can lose 1 broker and still serve writes
- You cannot lose 2 brokers simultaneously

### What happens when ISR < min.insync.replicas?

Producers receive a `NotEnoughReplicasException`. Kafka refuses writes to protect durability — **safety over availability**.

---

## Unclean Leader Election

By default (`unclean.leader.election.enable=false`), Kafka will **not** elect an out-of-sync replica as leader. This prevents data loss.

If set to `true`, Kafka may elect an out-of-sync replica, risking message loss but improving availability:

```properties
# Broker default (false is safer)
unclean.leader.election.enable=false
```

| Setting | Behavior |
|---------|----------|
| `false` | No data loss, but partition may be unavailable if all ISR members fail |
| `true`  | Partition stays available but some messages may be lost |

---

## Replication Flow

```
1. Producer → writes to Leader (P0 on Broker1)
2. Broker1 appends to local log, updates LEO
3. Follower on Broker2 fetches from Broker1
4. Follower on Broker3 fetches from Broker1
5. Leader advances HW when all ISR followers have fetched up to current LEO
6. Producer ACK sent (if acks=all, waits for HW advance)
7. Consumers can now read up to new HW
```

---

## Java Configuration

```java
@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.ACKS_CONFIG, "all");          // Wait for all ISR
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        return new DefaultKafkaProducerFactory<>(props);
    }
}
```

```java
// Programmatically alter topic min.insync.replicas
AdminClient adminClient = AdminClient.create(props);
ConfigEntry minIsr = new ConfigEntry("min.insync.replicas", "2");
Map<ConfigResource, Collection<AlterConfigOp>> ops = Map.of(
    new ConfigResource(ConfigResource.Type.TOPIC, "orders"),
    List.of(new AlterConfigOp(minIsr, AlterConfigOp.OpType.SET))
);
adminClient.incrementalAlterConfigs(ops).all().get();
```

---

## Interview Questions — Replication & ISR

**Q: What is the ISR and why does it matter?**

> The ISR (In-Sync Replicas) is the set of replicas that have fully replicated all messages from the leader within `replica.lag.time.max.ms`. It matters because Kafka uses the ISR to determine the High Watermark — only messages replicated to all ISR members are visible to consumers. It also drives the `acks=all` guarantee: the producer waits for all ISR members to acknowledge before getting a success response.

**Q: What happens when a follower falls out of the ISR?**

> The leader removes it from the ISR and continues serving reads and writes. The High Watermark is recalculated based on the remaining ISR members. When the lagging follower catches up (fetches all missing messages), the leader adds it back to the ISR.

**Q: What is the difference between HW and LEO?**

> LEO (Log End Offset) is the next offset to be written on each replica — it advances as messages are appended. HW (High Watermark) is the minimum LEO across all ISR members, representing the highest offset that's fully replicated. Consumers can only read up to HW, ensuring they don't see data that might be lost in a failover.

**Q: How do you configure Kafka for zero data loss?**

> Use: `acks=all` on the producer, `min.insync.replicas=2` on the topic/broker, `replication.factor=3`, and `unclean.leader.election.enable=false`. This guarantees a message is only acknowledged after being written to at least 2 replicas, and no out-of-sync replica can become a leader.

**Q: What is `unclean.leader.election.enable` and when would you set it to true?**

> By default (`false`), Kafka will not elect a replica that is behind as the new leader, preventing data loss. Setting it to `true` allows an out-of-sync replica to become leader if all ISR members are unavailable, restoring availability at the cost of potential data loss. It might be acceptable in low-stakes, throughput-critical scenarios where availability is more important than strict durability.

**Q: What is `replica.fetch.max.bytes` and why does it matter?**

> It controls the maximum amount of data a follower fetches from the leader in a single request. If the leader is producing faster than followers can fetch, followers may fall out of the ISR. Tuning this in combination with `replica.lag.time.max.ms` helps maintain healthy replication under high load.
