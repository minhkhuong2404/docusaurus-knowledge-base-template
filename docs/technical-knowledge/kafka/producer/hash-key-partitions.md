---
id: hash-key-partitions
title: Hash Key Partitions
sidebar_label: Hash Key Partitions
---

# Hash Key Partitions in Kafka

When producing a message to Kafka, you can provide an optional **Key** (a string, number, or any byte array). This key dictates exactly how Kafka routes the message to a specific partition. Understanding key-based partitioning is fundamental for distributed data modeling and guaranteeing message order.

---

## 👶 For Beginners: The "Mail Sorter" Analogy

Imagine a post office with 10 different mail delivery trucks (Partitions) going to 10 different neighborhoods.

- **No Key (Round Robin)**: You drop a stack of unaddressed flyers into the mail bin. The postmaster just hands one flyer to Truck 1, the next to Truck 2, the next to Truck 3, to distribute them evenly. 
- **With a Key (Hash Partitioning)**: You drop off letters with specific ZIP Codes (the Key). The postmaster looks at the ZIP Code and says, "All mail for 90210 *always* goes into Truck 4. All mail for 10001 *always* goes into Truck 7." 

By using a ZIP Code, you guarantee that all mail for a specific neighborhood is delivered together, in the order it was handed to the postmaster.

---

## 🧠 Deep Dive: The Default Partitioner Mechanics

If a key is provided, the Kafka producer uses the `DefaultPartitioner` to determine the destination partition before sending the payload over the network.

### 1. The Hashing Algorithm
The producer serializes the Key into a byte array. It then applies a hashing algorithm (historically **MurmurHash2**) to generate a 32-bit integer hash.

```java
// Simplified pseudo-code of Kafka's DefaultPartitioner
byte[] keyBytes = keySerializer.serialize(topic, key);
int hash = Utils.murmur2(keyBytes);
```

### 2. The Modulo Operation
To map this random integer to an actual partition number, Kafka applies a modulo operation based on the *current* number of partitions available in the topic.

```java
// Ensure positive number, then modulo
int partition = Math.abs(hash) % numPartitions;
```

### 3. Guaranteeing Strict Ordering
Because mathematical functions are deterministic, the same Key will always yield the same Hash. As long as `numPartitions` remains constant, `Hash % numPartitions` will always map to the exact same partition. 

Since Kafka guarantees strict FIFO (First-In-First-Out) ordering *within a single partition*, all messages sharing a key are guaranteed to be processed by consumers in the exact order they were produced.

---

## ⚠️ The Danger: "Hot" Partitions

While hash partitioning is powerful, it can lead to **Data Skew**.

If you choose a poor partition key—for example, a `customer_tier` where 90% of your users are "Free" and 10% are "Premium"—then 90% of your messages will hash to a single partition. 

**Consequences:**
- The broker hosting the "Free" partition will experience high CPU and disk I/O, creating a bottleneck.
- The single consumer assigned to that partition will be overwhelmed, leading to high Consumer Lag.
- The other partitions (and consumers) will sit mostly idle.

---

## ✅ Best Practices

1. **Choose High-Cardinality Keys**: Select a key that has millions of unique possible values (e.g., `user_id`, `device_id`, `order_id`) rather than low-cardinality keys (e.g., `country_code`, `status`). This ensures an even, uniform distribution of messages across all partitions.
2. **Beware of Null Keys**: In older Kafka versions, `null` keys used a pure Round-Robin strategy. In modern Kafka (>= 2.4), `null` keys use **Sticky Partitioning**. The producer sticks to a single partition for a batch of messages to optimize batching and compression, then switches to a new partition. It is highly efficient for throughput but offers zero ordering guarantees.
3. **Custom Partitioners**: If the default MurmurHash doesn't fit your needs, you can implement Kafka's `Partitioner` interface. This is useful for complex routing, like sending VIP customers to dedicated high-performance partitions while hashing regular users across the rest.
4. **Never Scale Partitions for Keyed Topics**: As mentioned in the Partition Scaling documentation, altering the partition count breaks the modulo math, permanently destroying ordering guarantees for historical keys.
