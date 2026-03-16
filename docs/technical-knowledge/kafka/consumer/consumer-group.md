---
id: consumer-group
title: Consumer Groups
sidebar_label: Consumer Group
---

# Consumer Groups

## What is a Consumer Group?

A **consumer group** is a set of consumers that collectively consume a topic's partitions. Each partition is assigned to exactly one consumer within the group at a time — enabling parallel, load-balanced consumption.

```
Topic: "orders" (6 partitions)

Consumer Group: "order-service"
┌────────────────────────────────────────────────┐
│  Consumer-1: P0, P1                            │
│  Consumer-2: P2, P3                            │
│  Consumer-3: P4, P5                            │
└────────────────────────────────────────────────┘
```

---

## Fan-Out with Multiple Groups

Different groups consume the same topic **independently**, each maintaining their own offsets:

```
Topic: "orders"
  │
  ├──► Group "order-service"    → processes orders
  ├──► Group "analytics-service" → aggregates metrics
  └──► Group "audit-logger"     → writes to audit store
```

This is one of Kafka's most powerful features — no message is "consumed" from the topic; all groups see all messages.

---

## Partition Assignment

### Rule: max parallelism = number of partitions

```
6 partitions, 3 consumers → 2 partitions per consumer   (optimal)
6 partitions, 6 consumers → 1 partition per consumer    (max parallelism)
6 partitions, 8 consumers → 2 consumers idle            (wasteful)
```

:::tip
The number of partitions is the upper bound on consumer parallelism within a group. Plan partition count with your expected consumer scale in mind.
:::

---

## Rebalancing

When consumers join or leave the group, Kafka **rebalances** partition assignments:

```
Trigger events:
- New consumer joins
- Consumer leaves (graceful shutdown)
- Consumer dies (session.timeout.ms exceeded)
- Topic partition count changes
- Group subscription changes
```

### Stop-the-World Rebalance (legacy)

All consumers **pause** processing during rebalance. This can cause processing latency spikes.

```
All consumers → "stop processing"
Group Coordinator assigns partitions
All consumers → "resume with new assignments"
```

### Incremental Cooperative Rebalance (recommended)

```yaml
spring:
  kafka:
    consumer:
      partition-assignment-strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

With `CooperativeStickyAssignor`, only the **affected** partitions are revoked and reassigned. Consumers not losing/gaining partitions continue processing uninterrupted.

---

## Group Coordinator

The **Group Coordinator** is a broker (selected based on `hash(group.id) % __consumer_offsets partitions`) responsible for:

1. Accepting join requests from consumers
2. Triggering rebalance when membership changes
3. Storing committed offsets in `__consumer_offsets`

### Group State Machine

```
Empty → PreparingRebalance → CompletingRebalance → Stable → Dead
```

| State | Description |
|-------|-------------|
| `Empty` | No members, might have offsets |
| `PreparingRebalance` | Awaiting JoinGroup requests |
| `CompletingRebalance` | Leader assigned, awaiting SyncGroup |
| `Stable` | All members assigned, consuming |
| `Dead` | Group metadata deleted |

---

## Spring Boot Consumer Group Config

```java
@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, OrderEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300_000);
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10_000);
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3_000);
        props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
            CooperativeStickyAssignor.class.getName());
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent>
            kafkaListenerContainerFactory(ConsumerFactory<String, OrderEvent> cf) {
        ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(cf);
        factory.setConcurrency(3);  // 3 threads = 3 consumers in the group (per instance)
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }
}
```

```java
@KafkaListener(
    topics = "orders",
    groupId = "order-service",
    concurrency = "3"   // overrides factory concurrency
)
public void listen(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
    processOrder(record.value());
    ack.acknowledge();
}
```

---

## Offset Management Deep Dive

### `__consumer_offsets` Topic

Committed offsets are stored in the internal `__consumer_offsets` topic (50 partitions by default, compacted):

```
Key:   GroupId + Topic + Partition
Value: Offset + Metadata + Timestamp
```

### Viewing Offsets

```bash
# Check consumer group lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group order-service

# Output:
# GROUP         TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# order-service orders  0          1050            1100            50
# order-service orders  1          980             980             0
```

### Reset Offsets (for reprocessing)

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service \
  --topic orders \
  --reset-offsets --to-earliest \
  --execute
```

---

## Static Group Membership

By default, each consumer re-joins on restart, triggering a rebalance. **Static membership** assigns a stable `group.instance.id`, allowing a restarting consumer to reclaim its partitions without rebalancing (within `session.timeout.ms`):

```java
props.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, "order-consumer-pod-1");
```

Ideal for Kubernetes deployments with stable pod names.

---

## Interview Questions — Consumer Groups

**Q: Can two consumers in the same group read from the same partition?**

> No. At any given time, a partition is assigned to exactly one consumer within a group. This is the fundamental guarantee that prevents double-processing within the group. Multiple groups can read the same partition independently.

**Q: What triggers a consumer group rebalance?**

> Any change in group membership: a new consumer joins, an existing consumer leaves (graceful or via timeout), a consumer's `session.timeout.ms` expires, or the topic's partition count changes. Some partition assignment strategies (like range assignor) also rebalance when the group subscription changes.

**Q: What is consumer lag?**

> Consumer lag is the difference between the Log End Offset (LEO) and the consumer's committed offset for a partition: `lag = LEO - committed_offset`. High lag means the consumer is falling behind the producer. It's a critical metric monitored in production (via Kafka metrics or Burrow/Cruise Control).

**Q: What is the difference between `subscribe()` and `assign()`?**

> `subscribe(topics)` registers with a consumer group — the group coordinator assigns partitions dynamically and handles rebalancing. `assign(partitions)` manually assigns specific partitions, bypassing the group mechanism entirely (no rebalancing, no group coordinator, no shared offset management). Use `assign` for batch reprocessing jobs; use `subscribe` for live consumers.

**Q: What is static group membership and when should you use it?**

> Static membership (`group.instance.id`) gives a consumer a persistent identity. When a statically-membered consumer restarts, it reclaims its previous partition assignments without triggering a group-wide rebalance — as long as it comes back within `session.timeout.ms`. This is valuable in Kubernetes where pod restarts are frequent and rebalances are expensive.
