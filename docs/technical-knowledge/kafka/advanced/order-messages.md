---
id: order-messages
title: Message Ordering with Partition Keys
sidebar_label: Message Ordering
---

# Message Ordering with Partition Keys

## Kafka's Ordering Guarantee

Kafka guarantees **total ordering within a partition**. Messages written to the same partition are always consumed in the exact order they were produced.

```
Partition 3 (orderId="ORD-100"):
  offset=0 → OrderCreated
  offset=1 → PaymentConfirmed
  offset=2 → OrderShipped
  offset=3 → OrderDelivered
```

A consumer reading partition 3 will always see these events in this order.

---

## The Partition Key Pattern

To enforce ordering for a specific entity, use the **entity ID as the partition key**:

```java
// All events for the same order → same partition
kafkaTemplate.send("order-events", orderId, orderEvent);
```

Kafka's default partitioner uses `murmur2(key) % numPartitions`:

```
"ORD-100" → hash → partition 3
"ORD-101" → hash → partition 0
"ORD-102" → hash → partition 5
```

All events for `ORD-100` always go to partition 3, regardless of which producer instance sends them.

---

## Choosing the Right Partition Key

| Use Case | Key |
|----------|-----|
| Order events | `orderId` |
| User activity | `userId` |
| IoT sensor data | `deviceId` |
| Payments | `transactionId` |
| Multi-tenant apps | `tenantId + entityId` |

:::warning
Avoid keys with **low cardinality** as partition keys (e.g., country, status). They create hot partitions. Use high-cardinality keys (UUIDs, IDs).
:::

---

## Producing with Partition Key

```java
@Service
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void publish(String orderId, OrderEvent event) {
        // orderId is the partition key → ensures ordering per order
        kafkaTemplate.send("order-events", orderId, event);
    }

    // With full control over partition selection
    public void publishToSpecificPartition(String orderId, OrderEvent event, int partition) {
        ProducerRecord<String, OrderEvent> record =
            new ProducerRecord<>("order-events", partition, orderId, event);
        kafkaTemplate.send(record);
    }
}
```

---

## Hot Partition Problem

### Problem
If some keys receive disproportionately more messages than others:

```
"ORD-BIG-CLIENT" → 80% of all messages → partition 2 overwhelmed
"ORD-others"     → 20% spread across other partitions
```

### Solutions

#### 1. Key Salting (for read-heavy/aggregate use cases)
```java
// Write: scatter with salt
String saltedKey = orderId + "-" + (System.nanoTime() % 4); // distribute to 4 sub-partitions
kafkaTemplate.send("order-events", saltedKey, event);

// Read: aggregate results from multiple partitions
```
Breaks per-key ordering — only suitable for aggregate/stateless processing.

#### 2. Dedicated Topic for Hot Entities
```java
String targetTopic = isHotClient(orderId) ? "order-events-hot" : "order-events";
kafkaTemplate.send(targetTopic, orderId, event);
```

#### 3. Custom Partitioner
```java
public class TenantAwarePartitioner implements Partitioner {

    private final Set<String> vipTenants = Set.of("ENTERPRISE_A", "ENTERPRISE_B");

    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        int numPartitions = cluster.partitionCountForTopic(topic);
        String tenantId = extractTenantId((String) key);

        if (vipTenants.contains(tenantId)) {
            // VIP tenants get dedicated first-half partitions
            return Math.abs(tenantId.hashCode()) % (numPartitions / 2);
        }
        // Regular tenants get second-half partitions
        return (numPartitions / 2) + Math.abs(key.hashCode()) % (numPartitions / 2);
    }
}
```

---

## Ordering Across Partitions

Kafka does not provide ordering across partitions. If you need global ordering:

### Option 1: Single Partition (high consistency, zero scalability)
```bash
kafka-topics.sh --create --topic critical-events --partitions 1 ...
```
Only one consumer can process at a time.

### Option 2: Sequencing Service
Use an external sequencer (e.g., database sequence) to assign monotonically increasing IDs. Consumers sort locally using these IDs.

### Option 3: Lamport Timestamps
Each event carries a logical timestamp. Consumers merge and reorder events from multiple partitions using the logical clock.

---

## Consumer-Side Ordering Guarantees

```java
@KafkaListener(
    topics = "order-events",
    groupId = "order-processor",
    concurrency = "6"  // 6 consumer threads
)
public void consume(ConsumerRecord<String, OrderEvent> record) {
    // Each thread handles a set of partitions
    // Within a partition: strict ordering guaranteed
    // Across partitions: no ordering guarantee (different threads)
    processOrderEvent(record.value());
}
```

:::tip
With `concurrency=6`, Spring creates 6 consumer threads, each assigned to a subset of partitions. Per-partition ordering is still maintained within each thread.
:::

---

## Ordering with Retries & DLT

A common pitfall: retrying a failed message can break ordering!

```
P0: [event-A] → fail, retry later
P0: [event-B] → success
P0: [event-A retry] → now processed AFTER event-B → ordering violated!
```

### Solutions:
1. **Block partition on failure** (slow but safe):
```java
// Don't ack failed message → no new messages from partition until resolved
// Use DefaultErrorHandler with BackOff to wait before re-attempting
```

2. **DLT with manual reprocessing** after fixing the cause

3. **Pause partition on failure**:
```java
// In error handler:
consumer.pause(Set.of(new TopicPartition(record.topic(), record.partition())));
// Process DLT, fix issue, then:
consumer.resume(Set.of(new TopicPartition(record.topic(), record.partition())));
```

---

## Interview Questions — Message Ordering

**Q: How does Kafka guarantee message ordering?**

> Kafka guarantees **total ordering within a single partition**. The partition is an append-only log, and consumers read it sequentially. As long as you use a consistent partition key, all messages for that key land on the same partition and are consumed in the order they were produced.

**Q: What is a hot partition and how do you avoid it?**

> A hot partition receives significantly more traffic than others, creating a bottleneck. It's caused by low-cardinality or highly skewed partition keys. Solutions: use high-cardinality keys (UUIDs), use key salting to spread hot keys, create a custom partitioner for VIP entities, or create a dedicated topic for high-volume entities.

**Q: How can retries break message ordering, and how do you fix it?**

> If message A fails and message B succeeds, then A is retried — A will be processed after B, violating ordering. Solutions: (1) Use a dead letter queue with manual replay ensuring ordered reprocessing. (2) Pause the partition on failure and resume only after the issue is resolved. (3) Use idempotent producers with `max.in.flight.requests.per.connection=1` to prevent out-of-order retries (at the cost of throughput).

**Q: Does `concurrency > 1` on a `@KafkaListener` break ordering?**

> No. Each concurrent thread is assigned non-overlapping partitions. A partition is only handled by one thread at a time, so per-partition ordering is preserved. Ordering is only guaranteed per-partition — events in different partitions may be processed in any interleaved order.

**Q: What happens to ordering when you add more partitions to a topic?**

> Adding partitions changes the `key → partition` mapping for future messages. Some keys that previously mapped to partition X will now map to partition Y. This means: (1) historical messages for a key are on the old partition, (2) new messages for the same key go to the new partition. Consumers must handle this temporal split, which can break ordering semantics during the transition.
