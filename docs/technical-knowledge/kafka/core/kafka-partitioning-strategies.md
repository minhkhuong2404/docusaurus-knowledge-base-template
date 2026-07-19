---
id: kafka-partitioning-strategies
title: Kafka Partitioning Strategies & Best Practices
sidebar_label: Partitioning Strategies
description: Deep dive into Kafka partitioning strategies — key-based, round-robin, sticky, custom partitioners, hot key mitigation, partition count sizing, and ordering trade-offs.
tags:
- technical-knowledge
- kafka
- core
- partitioning
- best-practices
---

# Kafka Partitioning Strategies & Best Practices

Partitions are the fundamental unit of parallelism, ordering, and throughput in Kafka. Choosing the right partitioning strategy is one of the most consequential design decisions in a Kafka-based system — the wrong choice leads to hot spots, ordering violations, or insufficient parallelism that cannot easily be fixed after data is flowing.

---

## Why Partitioning Matters

```
Topic: "orders" (6 partitions, RF=3)

Producer                  Broker Cluster
  │                    ┌─────────────────────────┐
  │  key="user-1"      │  P0 ──► Broker 1        │
  ├──────────────────► │  P1 ──► Broker 2        │
  │  key="user-2"      │  P2 ──► Broker 3        │
  └──────────────────► │  P3 ──► Broker 1        │
                        │  P4 ──► Broker 2        │
                        │  P5 ──► Broker 3        │
                        └─────────────────────────┘
                               │ each partition consumed by
                               ▼ exactly one consumer
                       Consumer Group
                       C1:P0,P1 | C2:P2,P3 | C3:P4,P5
```

The partition key determines:
1. **Which broker** stores the data (leader for that partition)
2. **Which consumer** processes the data (one consumer per partition per group)
3. **Ordering guarantees** (guaranteed within a partition, not across partitions)

---

## The Four Partitioning Strategies

### 1. Key-Based Partitioning (Default when key is present)

The producer hashes the message key using **murmur2** and maps to a partition:

```
partition = abs(murmur2(keyBytes)) % numPartitions
```

All messages with the same key are always routed to the same partition — providing **ordering guarantees per key**.

```java
// Same orderId → always same partition → ordered delivery per order
ProducerRecord<String, OrderEvent> record =
    new ProducerRecord<>("orders", orderId, orderEvent);
producer.send(record);
```

**When to use**: When ordering per entity matters (events for a given user, order, or device must be processed in sequence).

**Pitfall**: Key distribution must be uniform. A "hot key" (one key that generates far more messages than others) creates a hot partition — one overloaded broker and one overloaded consumer while others are idle.

---

### 2. Round-Robin (Kafka < 2.4, no key)

Keyless messages distributed one-by-one across all partitions. Provides even distribution but poor batching efficiency because each record may go to a different partition before a batch fills.

**Kafka ≥ 2.4**: Replaced by Sticky Partitioner for keyless messages.

---

### 3. Sticky Partitioner (Default when no key, Kafka ≥ 2.4)

The producer sends all keyless messages to the **same partition** until either `batch.size` is filled or `linger.ms` expires, then switches to a new partition. This dramatically improves batching and throughput for keyless producers.

```java
// No key specified — sticky partitioner decides
ProducerRecord<String, ClickEvent> record =
    new ProducerRecord<>("clickstream", clickEvent);
```

**When to use**: For high-volume event streams where ordering is not required and throughput matters most.

---

### 4. Custom Partitioner

Implement `org.apache.kafka.clients.producer.Partitioner` for business-driven routing:

```java
public class TieredPriorityPartitioner implements Partitioner {

    private static final int PREMIUM_PARTITION_COUNT = 2;

    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        int totalPartitions = cluster.partitionCountForTopic(topic);

        if (keyBytes == null) {
            // Null key → uniform distribution over remaining partitions
            return ThreadLocalRandom.current().nextInt(PREMIUM_PARTITION_COUNT, totalPartitions);
        }

        String customerId = new String(keyBytes);
        CustomerTier tier = lookupTier(customerId);

        return switch (tier) {
            case PREMIUM   -> Math.abs(customerId.hashCode()) % PREMIUM_PARTITION_COUNT;
            case STANDARD  -> PREMIUM_PARTITION_COUNT +
                              Math.abs(customerId.hashCode()) % (totalPartitions - PREMIUM_PARTITION_COUNT);
        };
    }

    @Override
    public void close() {}

    @Override
    public void configure(Map<String, ?> configs) {}
}
```

```properties
partitioner.class=com.example.TieredPriorityPartitioner
```

**Use cases**:
- Route premium customers to dedicated partitions with dedicated consumers
- Geographic routing (US → P0-P2, EU → P3-P5)
- Separate low-latency from batch traffic within the same topic

:::warning
Custom partitioners must be **deterministic and stateless** — the same key must always map to the same partition, otherwise ordering guarantees break when producer instances restart.
:::

---

## Partition Count Sizing

Getting partition count right is critical. Too few and you can't scale; too many and you add overhead.

### The Formula

```
partitions = max(T/Tp, T/Tc)

Where:
  T  = target throughput (messages/sec or MB/sec)
  Tp = throughput of a single producer partition (measured via perf test)
  Tc = throughput of a single consumer partition (your processing speed)
```

For most production workloads:

| Traffic Level | Recommended Partitions |
|---------------|------------------------|
| < 10 MB/s | 6–12 |
| 10–100 MB/s | 12–48 |
| > 100 MB/s | 48–200+ |

### Sizing Rules of Thumb

1. **Start with the number of brokers × 2** as a baseline (spreads leader partitions evenly)
2. **Set partition count = expected peak consumers × 2** so you have headroom to scale
3. **Never go below 3** for any production topic (allow for consumer group flexibility)
4. **Measure, don't guess** — use `kafka-producer-perf-test.sh` to measure your actual `Tp`

```bash
# Measure producer throughput per partition (baseline)
kafka-producer-perf-test.sh \
  --topic perf-test-1partition \
  --num-records 5000000 \
  --record-size 1000 \
  --throughput -1 \
  --producer-props bootstrap.servers=localhost:9092 acks=1
```

### Too Many Partitions: The Overhead

Each partition has costs:
- **Per-broker**: One open file handle per segment per partition (~3 file handles per partition)
- **Per-controller**: Metadata for every partition stored in KRaft
- **Per-client**: Metadata fetch overhead grows with partition count
- **Rebalance time**: Consumer group rebalances are O(partitions × consumers)

**Practical upper limit**: 4,000–10,000 partitions per broker (depending on broker hardware). Across a 10-broker cluster: 40,000–100,000 total partitions.

---

## Hot Key Problem & Mitigation

### What Is a Hot Key?

When a small number of keys generate a disproportionate share of messages, a few partitions receive far more load than others:

```
Partition distribution with hot key "user-vip-001":
  P0: ████████████████████████████████ 80% (hot - "user-vip-001")
  P1: ███ 10%
  P2: ██ 6%
  P3: █ 4%
```

Result: The consumer assigned to P0 is overwhelmed; consumers on P1–P3 are underutilized. The hot broker handles disproportionate I/O.

### Detection

```bash
# Check partition byte rates to identify hot partitions
kafka-log-dirs.sh --bootstrap-server localhost:9092 \
  --topic-list orders --describe | grep -E "size|offsetLag"

# Prometheus query — bytes per partition
kafka_log_log_size{topic="orders"} by (partition)
```

### Mitigation Strategy 1: Key Salting

Add a random suffix to the hot key to spread load across multiple partitions. Requires downstream aggregation:

```java
// Salting: spread "user-vip-001" across N partitions
private static final int SALT_FACTOR = 10;

String saltedKey = hotKey + "-" + ThreadLocalRandom.current().nextInt(SALT_FACTOR);
producer.send(new ProducerRecord<>("orders", saltedKey, event));
```

```java
// Consumer-side: aggregate by original key (strip salt)
String originalKey = record.key().split("-")[0] + "-" + record.key().split("-")[1];
aggregator.merge(originalKey, record.value());
```

### Mitigation Strategy 2: Dedicated Hot Topic

Route the hot key to a separate topic with more partitions:

```java
String topic = isHotKey(key) ? "orders-hot-keys" : "orders";
producer.send(new ProducerRecord<>(topic, key, event));
```

The dedicated topic can have 10× more partitions and a dedicated consumer group scaled accordingly.

### Mitigation Strategy 3: Application-Level Sharding

Shard at the application layer before Kafka — the hot entity is divided into logical sub-entities that each have their own key:

```java
// Instead of key = "vip-account-001"
// Shard by operation type within the same entity
String shardedKey = accountId + ":" + operationType; // e.g., "vip-001:debit"
```

---

## Ordering Trade-offs

| Scenario | Ordering Guarantee | Approach |
|---------|-------------------|---------|
| All events for entity X in order | ✅ Per-key | Use entity ID as key |
| Global total ordering | ⚠️ Single partition only | 1 partition (no parallelism) |
| No ordering requirement | ❌ None needed | Sticky/round-robin (maximize throughput) |
| Cross-entity ordering | ❌ Not possible | Use a single partition or external coordination |

### Ordering with Exactly-Once

For strict ordering with idempotent producers:

```java
// Ordering guarantee: same key = same partition = same sequence
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
// With idempotence enabled, up to 5 in-flight requests maintain ordering
```

Without idempotence: `max.in.flight.requests.per.connection=1` is required for strict ordering with retries (at a significant throughput cost).

---

## Partition Reassignment & Rebalancing

### Increasing Partition Count

```bash
# Increase from 6 to 12 partitions (irreversible)
kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic orders --partitions 12

# WARNING: Existing key-to-partition mappings change!
# "user-123" may now hash to partition 9 instead of partition 3
# Existing messages for "user-123" are still in partition 3
# New messages go to partition 9
# → Ordering broken for in-flight orders
```

:::caution
**Increasing partitions breaks key-to-partition mapping** for existing data. Plan partition counts conservatively upfront or accept a cutover strategy (new topic, migration).
:::

### Safe Increase Strategy

```bash
# Step 1: Check current assignment
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic orders

# Step 2: Create reassignment plan for existing data
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --topics-to-move-json-file topics.json \
  --broker-list "1,2,3,4" --generate

# Step 3: Execute and monitor
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --reassignment-json-file reassign.json --execute

# Step 4: Verify completion
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --reassignment-json-file reassign.json --verify
```

---

## Best Practices Summary

| Practice | Rationale |
|---------|-----------|
| Use entity ID as key for ordered processing | Same key → same partition → ordered delivery |
| Size partitions at 2× expected peak consumers | Leave room to scale without repartitioning |
| Use `CooperativeStickyAssignor` on consumers | Minimize stop-the-world rebalance impact |
| Monitor partition byte rate for hot spots | Detect skew before it causes lag |
| Never use mutable keys | Key hash must be stable or ordering breaks |
| Pre-provision partition count generously | Can increase but can't decrease; increasing breaks key mapping |
| Use `linger.ms=5–20` for keyless producers | Improves batching efficiency with sticky partitioner |

---

## Interview Questions

**Q: What is the difference between key-based and round-robin partitioning?**

> Key-based partitioning hashes the message key (`murmur2(key) % numPartitions`) and routes all messages with the same key to the same partition — guaranteeing ordering per key. Round-robin distributes keyless messages evenly across all partitions on a per-message basis, sacrificing ordering for even distribution. Since Kafka 2.4, keyless messages use the Sticky Partitioner instead of pure round-robin, which improves batching by directing keyless messages to the same partition until a batch fills.

**Q: What is the hot key problem and how do you solve it?**

> A hot key is one key that generates far more messages than average, causing a single partition to receive disproportionate load — overloading one broker and one consumer while others sit idle. Solutions: (1) Key salting — append a random suffix (e.g., `user-123-0` through `user-123-9`) to spread across partitions, then aggregate by original key downstream. (2) Dedicated hot topic — route the hot key to a separate topic with more partitions. (3) Application sharding — divide the hot entity into logical sub-entities with distinct keys.

**Q: Why can't you decrease the partition count of a Kafka topic?**

> Decreasing partitions would require deciding which data to move (or discard) from the removed partitions. More critically, it would invalidate the key-to-partition hash mapping — existing consumers reading historical data from old partitions would find their committed offsets pointing to now-nonexistent partitions, causing data loss or corruption. Kafka's solution is to allow only increases. If you need fewer partitions, create a new topic and migrate.

**Q: How do you choose the right partition count?**

> Use the formula `partitions = max(T/Tp, T/Tc)` where T is target throughput, Tp is single-partition producer throughput (measured with perf tests), and Tc is your consumer processing capacity per partition. As a rule of thumb: start at 2× your broker count, set it to at least your expected peak consumer count × 2, and never go below 3 for production topics. Err on the side of more partitions — it's harder to increase later (breaks key mapping) than to have extra partitions initially.

---

## Related Topics

- [Partitions Deep Dive](./partition.md) — Partition structure, LEO, HW, and leadership
- [Scaling Partitions](./scaling-partitions.md) — Mechanics of increasing partitions and reassignment
- [Consumer Groups](../consumer/consumer-group.md) — How partitions are assigned to consumers
- [Kafka Performance Tuning](../advanced/kafka-performance-tuning.md) — Throughput and latency optimization
- [Exactly-Once Semantics](../advanced/exactly-once.md) — Ordering guarantees with idempotent producers

## Sources

1. [Apache Kafka Documentation: Partitions](https://kafka.apache.org/documentation/#intro_topics)
2. [KIP-480: Sticky Partitioner](https://cwiki.apache.org/confluence/display/KAFKA/KIP-480%3A+Sticky+Partitioner)
3. [Conduktor Glossary: Kafka Partitioning Strategies](https://www.conduktor.io/glossary/kafka-partitioning-strategies-and-best-practices)
4. Narkhede, N., Shapira, G., & Palino, T. — *Kafka: The Definitive Guide* (O'Reilly)
