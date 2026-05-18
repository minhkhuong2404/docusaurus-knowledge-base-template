---
id: hash-key-partitions
title: Hash Key Partitions
sidebar_label: Hash Key Partitions
description: Kafka uses a hash of the message key to determine partition assignment. Understanding this mechanism is essential for ordering guarantees, avoiding hot partitions, and designing correct partition keys.
tags:
- technical-knowledge
- kafka
- producer
- hash-key-partitions
---
# Hash Key Partitions in Kafka

## What Is a Partition Key?

When producing a message, you can provide an optional **Key**. Kafka uses this key to deterministically route the message to a specific partition. This is the foundation of Kafka's per-entity ordering guarantee.

```
Producer sends 6 messages with keys:

  Key="A"  Key="B"  Key="A"  Key="C"  Key="B"  Key="A"
    │        │        │        │        │        │
    ▼        ▼        ▼        ▼        ▼        ▼
 ┌──────────────────────────────────────────────────────┐
 │              DefaultPartitioner                       │
 │   hash(key) % numPartitions → target partition        │
 └──────────────────────────────────────────────────────┘
    │        │        │        │        │        │
    ▼        ▼        ▼        ▼        ▼        ▼
  ┌─P0─┐  ┌─P1─┐  ┌─P0─┐  ┌─P2─┐  ┌─P1─┐  ┌─P0─┐

Result: All "A" messages → P0 (ordered)
        All "B" messages → P1 (ordered)
        All "C" messages → P2 (ordered)
```

---

## 👶 For Beginners: The "Mail Sorter" Analogy

Imagine a post office with 10 delivery trucks (Partitions), each serving a different neighborhood:

| Scenario | What Happens |
|----------|-------------|
| **No Key** (null) | You drop off unaddressed flyers. The postmaster distributes them evenly — Truck 1, Truck 2, Truck 3... No guarantee which truck gets which flyer. |
| **With Key** (ZIP Code) | You drop off letters with ZIP Codes. The postmaster has a rule: *"All mail for 90210 → Truck 4. All mail for 10001 → Truck 7."* Every letter for the same ZIP always goes to the same truck, in order. |

:::tip[Key Takeaway]
A message key is like a ZIP Code — it guarantees that all related messages end up in the same "truck" (partition), processed in the order they were sent.
:::

---

## 🧠 Deep Dive: The Default Partitioner Mechanics

### Step 1 — Serialize the Key

The producer serializes the Key into a byte array using the configured `key.serializer`:

```java
byte[] keyBytes = keySerializer.serialize(topic, headers, key);
// e.g., "user_123" → [117, 115, 101, 114, 95, 49, 50, 51]
```

### Step 2 — Hash with MurmurHash2

Kafka applies **MurmurHash2** — a fast, non-cryptographic hash function — to the key bytes:

```java
int hash = Utils.murmur2(keyBytes);
// "user_123" → 827364 (example)
```

:::note[Why MurmurHash2?]
MurmurHash2 was chosen for its excellent **distribution uniformity** (keys spread evenly across buckets) and **speed** (no CPU-intensive cryptographic operations). It's the same hash function used in many distributed systems.
:::

### Step 3 — Modulo to Partition Number

The hash is mapped to a partition index:

```java
// toPositive() clears the sign bit without using Math.abs()
// (Math.abs(Integer.MIN_VALUE) returns a negative number!)
int partition = Utils.toPositive(Utils.murmur2(keyBytes)) % numPartitions;
```

```
Example with 6 partitions:
  "user_123" → hash=827364  → 827364 % 6 = 0  → Partition 0
  "user_456" → hash=519283  → 519283 % 6 = 1  → Partition 1
  "user_789" → hash=412057  → 412057 % 6 = 5  → Partition 5
  "user_123" → hash=827364  → 827364 % 6 = 0  → Partition 0  ← SAME!
```

Because hash functions are **deterministic**, the same key will *always* produce the same hash, and therefore *always* map to the same partition — as long as the partition count doesn't change.

---

## What Happens with Null Keys?

The behavior depends on your Kafka version:

| Kafka Version | Null Key Strategy | Description |
|---|---|---|
| < 2.4 | **Round-Robin** | Messages rotate across partitions: P0, P1, P2, P0... |
| ≥ 2.4 | **Sticky Partitioner** | Fills one partition's batch completely, then switches to the next |

### Why Sticky Partitioner Is Better

```
Round-Robin (old):
  Batch 1 → P0 (1 msg)  P1 (1 msg)  P2 (1 msg)   ← 3 tiny network requests

Sticky (new):
  Batch 1 → P0 (3 msgs)                            ← 1 large network request
  Batch 2 → P1 (3 msgs)                            ← 1 large network request
```

Sticky partitioning allows the producer to fill batches more efficiently, reducing network overhead and improving compression ratios. **No ordering guarantees** either way for null keys.

---

## ⚠️ The Danger: Hot Partitions (Data Skew)

Hash partitioning assumes the keys are **uniformly distributed**. If they aren't, you get data skew:

```
Key = "customer_tier"   (BAD — only 3 unique values)

  "free"    → hash → Partition 2  ← 90% of all traffic!
  "premium" → hash → Partition 0  ← 8%
  "enterprise" → hash → Partition 4  ← 2%

Result:
  P0: ░░░░
  P1:
  P2: ████████████████████████████████████  ← HOT PARTITION
  P3:
  P4: ░░
```

**Consequences:**
- The broker hosting P2 becomes a CPU/disk bottleneck
- The consumer assigned to P2 has massive lag while other consumers idle
- Throughput is limited by the speed of the single slowest partition

### Solutions for Hot Partitions

#### 1. Use High-Cardinality Keys

```java
// BAD — low cardinality, creates hot partitions
kafkaTemplate.send("events", event.getCountry(), event);       // ~200 unique values

// GOOD — high cardinality, uniform distribution
kafkaTemplate.send("events", event.getUserId(), event);        // millions of unique values
```

#### 2. Key Salting (scatter-gather)

```java
// Scatter: split hot key into N sub-keys
String saltedKey = orderId + "-" + ThreadLocalRandom.current().nextInt(4);
kafkaTemplate.send("order-events", saltedKey, event);

// Gather: consumer must aggregate across all 4 sub-partitions
// ⚠️ This BREAKS per-key ordering — only use for aggregate/stateless workloads
```

#### 3. Dedicated Topic for Hot Keys

```java
public void publish(String orderId, OrderEvent event) {
    if (hotKeyDetector.isHot(orderId)) {
        kafkaTemplate.send("order-events-hot", orderId, event);
    } else {
        kafkaTemplate.send("order-events", orderId, event);
    }
}
```

#### 4. Custom Partitioner

```java
public class VipAwarePartitioner implements Partitioner {

    private static final Set<String> VIP_KEYS = Set.of("MEGA_CORP", "BIG_BANK");

    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        int numPartitions = cluster.partitionCountForTopic(topic);
        String keyStr = (String) key;

        if (VIP_KEYS.contains(keyStr)) {
            // VIP keys get dedicated partitions (first 2)
            return Math.abs(keyStr.hashCode()) % 2;
        }
        // All other keys share remaining partitions
        return 2 + (Utils.toPositive(Utils.murmur2(keyBytes)) % (numPartitions - 2));
    }
}
```

```properties
# Apply custom partitioner
partitioner.class=com.example.VipAwarePartitioner
```

---

## ✅ Best Practices

| Practice | Why |
|---|---|
| Use **entity IDs** as keys (`userId`, `orderId`) | High cardinality → even distribution |
| Avoid **status/enum** keys (`PENDING`, `ACTIVE`) | Low cardinality → hot partitions |
| Use **composite keys** for multi-tenant apps | `tenantId + ":" + entityId` → ordering per entity per tenant |
| **Never change partition count** for keyed topics | Breaks `hash % N` mapping → destroys ordering |
| Use `Utils.toPositive()` not `Math.abs()` | `Math.abs(Integer.MIN_VALUE)` is negative! Kafka's source uses bit masking |
| Monitor partition-level throughput | Detect skew early with `kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec` per partition |

---

## Interview Questions — Hash Key Partitions

**Q: How does Kafka decide which partition a keyed message goes to?**

> The producer serializes the key to bytes, hashes it with MurmurHash2, then takes the result modulo the number of partitions: `toPositive(murmur2(keyBytes)) % numPartitions`. This is deterministic — the same key always maps to the same partition as long as partition count is constant.

**Q: What is the Sticky Partitioner and why was it introduced?**

> Before Kafka 2.4, null-key messages used pure round-robin, producing many tiny batches (one per partition per batch interval). The Sticky Partitioner instead fills one partition's batch completely before switching. This improves batching, compression, and throughput — up to 50% latency reduction in benchmarks.

**Q: What is a hot partition and how do you detect it?**

> A hot partition receives disproportionately more traffic than others, caused by a low-cardinality or skewed key. Detect it by monitoring per-partition metrics (`BytesInPerSec`, `MessagesInPerSec`) or by observing uneven consumer lag. Solutions: choose high-cardinality keys, salt hot keys, use a custom partitioner, or route hot keys to a dedicated topic.

**Q: What happens to key→partition mapping when you add partitions?**

> The modulo math changes. `hash % 5` and `hash % 10` yield different results for many keys. New messages for an affected key will go to a different partition than where historical messages reside, permanently breaking per-key ordering. The safe alternative is topic migration.

**Q: Why does Kafka use MurmurHash2 instead of Java's `hashCode()`?**

> MurmurHash2 provides better distribution uniformity and is consistent across languages (the same bytes produce the same hash in Java, Python, Go, etc.). Java's `String.hashCode()` has known clustering patterns and its implementation is not guaranteed across JVM versions.
