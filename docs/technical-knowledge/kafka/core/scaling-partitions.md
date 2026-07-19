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
# Scaling Partitions in Kafka

## Why Scale Partitions?

Partitions are Kafka's fundamental unit of **parallelism**. The maximum number of consumers that can process a topic concurrently is equal to its partition count — no more.

```
Topic: "payments" (3 partitions)

  Consumer Group "payment-service"
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ Consumer1│   │ Consumer2│   │ Consumer3│    ← max parallelism = 3
  └────┬─────┘   └────┬─────┘   └────┬─────┘
       │              │              │
  ┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐
  │ P0       │   │ P1       │   │ P2       │
  └──────────┘   └──────────┘   └──────────┘

  Adding a 4th consumer?  It sits IDLE — no partition to assign.
```

If your throughput demand exceeds what 3 consumers can handle, you **must** add more partitions before you can add more consumers.

---

## 👶 For Beginners: The "Checkout Counter" Analogy

Imagine a supermarket:

| Concept | Kafka Equivalent |
|---------|-----------------|
| The store | A Kafka **Topic** |
| Customers in line | **Messages** |
| Checkout counters | **Partitions** |
| Cashiers | **Consumers** |

- **1 counter**: All customers wait in one line. Strict first-come-first-served (ordering), but very slow.
- **5 counters**: 5x faster, but you can't guarantee that Customer A (who arrived first) finishes before Customer B (who picked a faster line).

**Scaling partitions** = opening more checkout counters so you can hire more cashiers.

:::tip[Key Insight]
You never need to understand the internals to remember this rule: **More partitions → more parallelism → more throughput. But ordering is only guaranteed within one partition (one checkout line).**
:::

---

## 🧠 Deep Dive: How Scaling Works Internally

### How to Increase Partitions

You can increase partitions using the Kafka CLI, but **you can never decrease them**:

```bash
# Check current partition count
bin/kafka-topics.sh --bootstrap-server localhost:9092 \
    --describe --topic payments

# Increase to 10 partitions
bin/kafka-topics.sh --bootstrap-server localhost:9092 \
    --alter --topic payments --partitions 10
```

Under the hood Kafka will:

```
Step 1: Create new log segment directories on brokers
        /var/kafka-logs/payments-3/
        /var/kafka-logs/payments-4/
        ...
        /var/kafka-logs/payments-9/

Step 2: Update cluster metadata in ZooKeeper / KRaft Controller

Step 3: Broadcast metadata update to ALL brokers & connected clients
        → Producers refresh partition list
        → Consumer groups trigger rebalance
```

:::warning[New partitions start **empty**. Existing data stays in the original partitions. There is no automatic data redistribution.]
:::

### What Happens to Consumer Groups (Rebalancing)

Adding a partition triggers a **consumer group rebalance**:

```
Timeline during Rebalance:
─────────────────────────────────────────────────────────────
  t0       t1              t2              t3
  │        │               │               │
  ▼        ▼               ▼               ▼
 ALTER   Revoke all     Reassign        Resume
 topic   partitions     partitions      processing
         (STOP)         (new layout)    (START)
         ◄──── DOWNTIME ────►
```

| Rebalance Protocol | Behavior | Downtime |
|---|---|---|
| **Eager (default old)** | All consumers stop, revoke all partitions, reassign from scratch | High — full Stop-the-World |
| **Cooperative Sticky** | Only affected partitions are revoked; others continue processing | Low — incremental migration |

```yaml
# Spring Boot — use cooperative rebalancing to minimize downtime
spring:
  kafka:
    consumer:
      partition-assignment-strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

---

## ⚠️ The Danger: Hash Ring Breaking

The most dangerous side effect of scaling partitions is **breaking key-based ordering**.

When a producer uses a message key, the default partitioner computes:

```
partition = murmur2(key) % numPartitions
```

If you change `numPartitions`, the modulo result changes:

```
Key: "user_123"    hash = 827364

Before (5 partitions):  827364 % 5  = Partition 4
After  (10 partitions): 827364 % 10 = Partition 4  ← same? LUCKY.

Key: "user_456"    hash = 519283

Before (5 partitions):  519283 % 5  = Partition 3
After  (10 partitions): 519283 % 10 = Partition 3  ← same? LUCKY.

Key: "user_789"    hash = 412057

Before (5 partitions):  412057 % 5  = Partition 2
After  (10 partitions): 412057 % 10 = Partition 7  ← DIFFERENT! ❌
```

**The result:** New messages for `user_789` now go to Partition 7, while old messages are still sitting in Partition 2. A consumer reading P7 might process the new event *before* the consumer reading P2 finishes the old one.

:::caution
**Strict ordering for that key is permanently broken.** There is no automatic fix — you cannot "re-hash" existing data.
:::

---

## ✅ Best Practices

### 1. Pre-Provision Partitions (Over-partitioning)

The safest way to "scale" is to **never need to**.

```bash
# Create with generous partition count on day one
bin/kafka-topics.sh --create --topic payments \
    --partitions 30 \
    --replication-factor 3 \
    --bootstrap-server localhost:9092
```

| Partition Count | Tradeoffs |
|---|---|
| Too few (1–3) | Limited parallelism, easy to hit throughput ceiling |
| Sweet spot (12–50) | Good balance of parallelism and manageable overhead |
| Too many (500+) | High broker file-handle usage, slow leader elections, increased replication lag |

### 2. Never `--alter` a Keyed Topic

If your topic uses message keys for ordering, **do not** add partitions in-place.

### 3. The "New Topic" Migration Strategy

If you *must* scale a keyed topic:

```
Step 1: Create "payments-v2" with 30 partitions

Step 2: Stop all producers to "payments"

Step 3: Wait for all consumers to drain "payments" (lag = 0)

Step 4: Switch producers to "payments-v2"

Step 5: Switch consumers to "payments-v2"

Step 6: (Optional) Delete "payments" after retention expires
```

```java
// Example: Toggling topics via feature flag
@Value("${kafka.payments.topic:payments}")
private String paymentsTopic;

public void publishPayment(String orderId, PaymentEvent event) {
    kafkaTemplate.send(paymentsTopic, orderId, event);
}
```

### 4. Monitor Rebalance Duration

Ensure `max.poll.interval.ms` is large enough that slow consumers don't get evicted during the rebalance storm after scaling:

```properties
# Default is 5 minutes — increase for heavy consumers
max.poll.interval.ms=600000
session.timeout.ms=30000
heartbeat.interval.ms=10000
```

---

## 🔧 Sizing Guide: How Many Partitions Do You Need?

Use this formula as a starting point:

```
Target Partitions = max(T/Cp, T/Pp)

Where:
  T  = Target throughput (messages/sec)
  Cp = Throughput per consumer (messages/sec)
  Pp = Throughput per producer partition (messages/sec)
```

**Example:** You need 100k msg/sec throughput. Each consumer processes 5k msg/sec.

```
Partitions = 100,000 / 5,000 = 20 partitions minimum
```

Round up to 24 or 30 to leave headroom for traffic spikes.

---

## Interview Questions

**Q: Can you decrease the number of partitions in Kafka?**

> No. Kafka does not support reducing partition count. Removing partitions would break key→partition mappings and lose existing data in the removed partitions. The only safe approach is to create a new topic with fewer partitions and migrate data.

**Q: What happens to existing data when you add partitions?**

> Existing data stays in the original partitions — nothing is moved or rebalanced. Only **new** messages are routed to the new partitions. This means the original partitions may still hold messages for keys that now hash to a different partition.

**Q: Why is scaling partitions dangerous for keyed topics?**

> The default partitioner uses `murmur2(key) % numPartitions`. Changing `numPartitions` changes the modulo result, so the same key may now route to a different partition. Historical messages for that key remain on the old partition, breaking the per-key ordering guarantee.

**Q: How would you safely increase partitions for a production topic?**

> The safest strategy is the "New Topic" migration: create a new topic with more partitions, drain the old topic, then switch producers and consumers. For non-keyed topics, you can use `--alter` directly since there is no ordering contract to break.

**Q: How do you decide the right number of partitions?**

> Start with the formula `Target Throughput / Per-Consumer Throughput`. Add headroom (20–50%) for traffic spikes. Also consider the number of brokers (distribute partitions evenly), file descriptor limits, and replication factor overhead.
