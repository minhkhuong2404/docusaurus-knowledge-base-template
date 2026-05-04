---
id: scaling-partitions
title: Scaling Partitions
sidebar_label: Scaling Partitions
---

# Scaling Partitions in Kafka

Scaling partitions is one of the most critical operations for increasing throughput in a Kafka cluster. While Kafka handles high volumes of data gracefully, understanding how and when to scale partitions is essential for maintaining performance and message ordering.

---

## 👶 For Beginners: The "Checkout Counter" Analogy

Imagine a busy supermarket. The store itself is a **Kafka Topic**, the customers are **messages**, and the checkout counters are **Partitions**.

- **1 Checkout Counter (1 Partition)**: All customers wait in a single line. It guarantees that the first person who got in line will be the first one served (strict ordering), but it is very slow.
- **5 Checkout Counters (5 Partitions)**: Customers are distributed across 5 lines. You process 5 times as many people at once! However, you can no longer guarantee that customer A (who arrived slightly before customer B) will leave the store first, because customer B might pick a faster line.

**Scaling Partitions** is simply opening more checkout counters so you can serve more customers simultaneously. 

---

## 🧠 Deep Dive: How Scaling Works Internally

Partitions are the fundamental unit of parallelism in Kafka. A single consumer thread can read from one or more partitions, but a single partition cannot be read by multiple consumers within the *same* consumer group concurrently.

Therefore, the **maximum parallel consumption capacity** of a topic is exactly equal to its number of partitions.

### How to Increase Partitions

You can increase the number of partitions for an existing topic using the Kafka CLI, but **you can never decrease them**.

```bash
# Increase partitions for 'my-topic' to 10
bin/kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic my-topic --partitions 10
```

Under the hood, Kafka will:
1. Create new log directories on the brokers for the new partitions (e.g., `my-topic-8`, `my-topic-9`).
2. Update the cluster metadata in ZooKeeper/KRaft.
3. Broadcast the new metadata to all brokers and connected clients.

### The Impact on Consumer Groups (Rebalancing)

When you add a partition, any active consumer group listening to that topic will undergo a **Rebalance**.
- The Group Coordinator tells all consumers to stop fetching.
- It recalculates the partition assignment to include the newly created partitions.
- It redistributes all partitions across the available consumers.
- **Impact**: Message processing pauses briefly (Stop-the-World) unless you are using Incremental Cooperative Rebalancing.

---

## ⚠️ The Danger: Hash Ring Breaking (Ordering Loss)

The most significant gotcha when scaling partitions relates to **Keyed Messages**.

When a producer sends a message with a Key (e.g., `user_id_123`), Kafka uses a hash function to determine the partition:
```
Partition = Hash(Key) % Total_Partitions
```

If you scale from `5` to `10` partitions, the `Total_Partitions` changes. 
The modulo math changes entirely. 

- **Before**: `Hash("user_id_123") % 5` = Partition `2`
- **After**: `Hash("user_id_123") % 10` = Partition `7`

**The Result:** New messages for `user_id_123` are now going to Partition 7. A consumer reading Partition 7 might process the new event *before* another consumer reading Partition 2 has finished processing the old events. **Strict ordering for that key is permanently broken.**

---

## ✅ Best Practices

1. **Pre-Provision Partitions (Over-partitioning)**: The best way to scale partitions is to never have to do it. Over-allocate partitions when creating the topic (e.g., create 30 or 50 partitions even if you only need 5 today). The overhead of idle partitions is very low in modern Kafka.
2. **Never Scale Keyed Topics In-Place**: If your topic relies on message keys for ordering, do not use the `--alter` command to add partitions.
3. **The "New Topic" Migration Strategy**: If you *must* scale a keyed topic:
   - Create a brand new topic (`my-topic-v2`) with the new partition count.
   - Stop producers to the old topic.
   - Wait for consumers to fully drain the old topic.
   - Switch consumers and producers to point to the new topic.
4. **Monitor Rebalance Times**: Ensure your consumer application's `max.poll.interval.ms` is configured properly so that scaling doesn't trigger a cascade of consumer failures during the rebalance phase.
