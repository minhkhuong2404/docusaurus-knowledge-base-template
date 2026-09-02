---
id: interview-core
title: Interview Questions — Core Concepts
sidebar_label: Core Concepts Q&A
description: '**Q1: Explain Kafka''s architecture in 2 minutes.**'
tags:
- technical-knowledge
- kafka
- interview
- interview-core
---
import KafkaInterviewScenarioDiagram from '@site/src/components/KafkaInterviewScenarioDiagram';

# Interview Questions — Core Kafka Concepts

> 🎯 These are the most commonly asked Kafka interview questions, grouped by topic. Each answer is designed to be comprehensive enough to impress, but concise enough to deliver in an interview.

<KafkaInterviewScenarioDiagram />

---

## Architecture

**Q1: Explain Kafka's architecture in 2 minutes.**

> Apache Kafka is a distributed event streaming platform built around an append-only, partitioned log. Producers write messages to **topics**, which are divided into **partitions**. Partitions are distributed across multiple **brokers** in a cluster, with each partition having one **leader** and zero or more **follower** replicas. One broker is elected as the **Controller**, responsible for partition leader elections.
>
> Consumers read from partitions in **consumer groups** — each partition assigned to exactly one consumer within a group. Kafka retains messages for a configurable time regardless of consumption, enabling replay and multiple independent consumer groups.
>
> In modern Kafka (3.3+), **KRaft** replaces ZooKeeper for metadata management, embedding a Raft consensus quorum directly into brokers.

---

**Q2: How does Kafka achieve high throughput?**

> Several design decisions work together: (1) **Sequential disk I/O** — Kafka appends to the end of log segment files, which is much faster than random writes. (2) **OS page cache** — Kafka relies on the OS to cache recently written data in memory, avoiding redundant reads from disk. (3) **Zero-copy transfer** (`sendfile` syscall) — data is transferred directly from page cache to network socket without copying through user space. (4) **Batching** — producers batch multiple messages; brokers serve batches to consumers. (5) **Compression** — reduces network and disk I/O.

---

**Q3: What is the role of ZooKeeper in Kafka (legacy) and why is KRaft replacing it?**

> In legacy Kafka, ZooKeeper stored cluster metadata: broker registry, topic/partition assignments, controller election, and (in old clients) consumer group offsets. This added operational complexity — two distributed systems to manage, monitor, and version-align.
>
> KRaft (Kafka Raft) replaces ZooKeeper by embedding metadata management into Kafka itself using a Raft consensus algorithm. The metadata log is stored in a special `__cluster_metadata` topic managed by a quorum of controller nodes. Benefits: single system to operate, millisecond controller failover (vs tens of seconds), support for millions of partitions per cluster.

---

**Q4: What is the difference between a partition leader and a follower?**

> The **leader** handles all reads and writes for a partition. Producers send messages to the leader; consumers fetch from the leader (unless follower fetching is enabled). **Followers** exist solely to replicate data from the leader, staying in sync to be ready for failover. When the leader fails, the Controller elects a new leader from the **ISR** (In-Sync Replicas).

---

**Q5: What is the High Watermark and why does it matter?**

> The High Watermark (HW) is the highest offset that has been replicated to all In-Sync Replicas. Consumers can only read messages up to the HW — they cannot see messages that haven't been fully replicated yet. This prevents consumers from reading data that might be lost if the leader crashes before replication completes. The HW advances as followers acknowledge fetching messages from the leader.

---

## Topics & Partitions

**Q6: How do you decide how many partitions to create for a topic?**

> Consider three factors: (1) **Throughput**: if a single partition can handle 50 MB/s and you need 200 MB/s, you need at least 4 partitions. (2) **Consumer parallelism**: the number of partitions limits how many consumers in a group can run in parallel — 6 partitions → max 6 active consumers. (3) **Operational overhead**: each partition costs memory, file handles, and replication overhead. A common starting point for moderate workloads is 6–12 partitions. Partitions can be increased later (never decreased), so starting conservatively is reasonable.

---

**Q7: What is the difference between `delete` and `compact` cleanup policies?**

> `delete` removes messages based on time (`retention.ms`) or size (`retention.bytes`) — oldest segments are deleted. Once deleted, messages are gone. `compact` retains only the **latest value per key** indefinitely, deleting records with older versions of the same key. A null-value record (tombstone) signals deletion of a key. Use `delete` for time-series/event streams; use `compact` for state/changelog topics where only current state matters.

---

**Q8: Can you decrease partition count? Why or why not?**

> No. Decreasing partitions is not supported. The `key → partition` assignment is based on `hash(key) % numPartitions`. Decreasing partitions would remap keys to different partitions, breaking ordering guarantees and making it impossible to find historical messages for a given key. The only option is to create a new topic with fewer partitions and migrate data.

---

**Q9: What is partition skew and how do you mitigate it?**

> Partition skew occurs when traffic is unevenly distributed — some partitions get far more messages than others. It's caused by low-cardinality keys (e.g., using `status="ACTIVE"` as a key when 90% of messages are active) or viral/hot keys. Mitigation strategies: (1) Use high-cardinality keys (UUIDs, entity IDs). (2) Implement a custom partitioner with special-case logic for hot keys. (3) Add a random salt suffix to hot keys and aggregate in a separate stage. (4) Create a dedicated high-throughput topic for hot entities.

---

## Replication & Durability

**Q10: What is the ISR and what happens when a replica falls out of it?**

> The ISR (In-Sync Replicas) is the set of replicas that are fully caught up with the leader within `replica.lag.time.max.ms`. When a follower falls behind — typically due to network issues or broker slowness — it's removed from the ISR. The leader no longer waits for it when advancing the High Watermark. When the follower catches up, it's added back. If the ISR shrinks below `min.insync.replicas`, writes with `acks=all` are rejected with `NotEnoughReplicasException`.

---

**Q11: What configuration gives the strongest durability guarantee?**

> The "zero data loss" combination:
> - `acks=all` — wait for all ISR members
> - `min.insync.replicas=2` — require at least 2 replicas in ISR
> - `replication.factor=3` — maintain 3 copies
> - `unclean.leader.election.enable=false` — never elect out-of-sync replicas
> - `enable.idempotence=true` — prevent duplicate writes on retry
>
> This setup tolerates the loss of 1 broker while maintaining write availability, and never loses an acknowledged message.

---

**Q12: What is unclean leader election? When would you enable it?**

> Unclean leader election allows an out-of-sync replica (not in ISR) to become the new leader when all ISR members are unavailable. This restores availability at the cost of data loss — the new leader may be missing recently produced messages. It's disabled by default. You might enable it in scenarios where availability is strictly more important than data integrity, such as log aggregation pipelines where losing a few recent log lines is acceptable vs a topic being offline.

---

## Operations

**Q13: How would you handle a scenario where consumer lag is growing?**

> Growing lag means consumers are slower than producers. Diagnose first: (1) Check `max.poll.records` — consuming more per poll batch may help. (2) Check processing time per record — if slow, optimize or add parallelism. (3) Check consumer count — add more consumers (up to partition count). (4) Check if a partition is stuck on an error loop consuming retries. (5) Check `max.poll.interval.ms` — if processing is slow, increase it to prevent premature rebalances. If genuinely under-resourced, scale consumer instances horizontally.

---

**Q14: How do you replay messages in Kafka?**

> Options: (1) **Reset consumer group offset** — use `kafka-consumer-groups.sh --reset-offsets --to-earliest` (stop consumers first). (2) **Seek to specific offset or timestamp** in application code using `consumer.seek()` or `consumer.offsetsForTimes()`. (3) **Use a separate consumer group** — create a new group that starts from earliest; doesn't disturb existing groups. (4) For full topic replay, mirror the topic to a replay topic and reprocess. Kafka's message retention (default 7 days) makes all of these possible.

---

**Q15: What is rack-aware replica assignment?**

> Kafka can spread replicas across different racks (physical or availability zones) to ensure that a single rack failure doesn't take a partition offline. Configure `broker.rack=us-east-1a` on each broker. When creating topics, Kafka assigns replicas to brokers in different racks. This provides rack-level fault tolerance in addition to broker-level fault tolerance.

---

## 🚀 Senior Deep-Dive: 6 Critical Kafka System Design Scenarios

### Scenario 1: What architectural problem does Kafka solve in an E-Commerce Checkout?
> **The Problem**: In a synchronous architecture, when a user clicks "Place Order", the Checkout Service must call the Payment Service, Inventory Service, Fraud Detection Service, and Notification Service via HTTP/gRPC. If any single service is slow (e.g. Fraud takes 2 seconds) or down (Inventory 500 error), the entire user checkout fails or times out.
> 
> **The Kafka Solution**: The Checkout Service writes a single `OrderPlaced` event to Kafka and returns HTTP 202 / 200 to the user in **&lt;5ms**. Payment, Inventory, and Notification services each operate in their own independent consumer groups. If the Notification service crashes for 2 hours, it simply resumes from its last committed offset with zero data loss and zero impact on active checkouts.

---

### Scenario 2: How does Kafka organize data on disk for massive throughput?
> Kafka organizes data into **Topics**, which are split into physical **Partitions**, and partitions are stored as **Segment files** (`.log`, `.index`, `.timeindex`) on disk.
> 1. **Sequential Append-Only Writes**: Kafka never updates data in place; new records are appended sequentially to the active segment file. On modern NVMe/SSDs and spinning disks, sequential writes achieve near memory-bus throughput (600+ MB/s).
> 2. **Linux OS Page Cache**: Kafka does not cache messages in the JVM heap (avoiding GC overhead). It relies entirely on the OS Page Cache.
> 3. **Zero-Copy Network Transfers (`sendfile`)**: When consumers fetch data, the Linux kernel copies bytes directly from the Page Cache to the network socket descriptor without transferring data through user space.

---

### Scenario 3: What is an Offset, and what happens if a consumer crashes?
> An **Offset** is a monotonically increasing 64-bit integer assigned to each record within a partition. It represents the logical position of a message.
> 
> When a consumer processes messages, it periodically commits its current offset to the internal `__consumer_offsets` topic.
> - **During Crash / Failover**: If Consumer A crashes mid-processing, Kafka detects heartbeat timeout, triggers a **Consumer Group Rebalance**, and assigns the partition to Consumer B. Consumer B reads `__consumer_offsets` and starts reading from the last committed offset.
> - **At-Least-Once Risk**: If Consumer A processed the record but crashed *before* committing offset, Consumer B will re-process that record. Hence, all downstream business operations must be **idempotent**.

---

### Scenario 4: How does Key-Based Partitioning guarantee ordering?
> Kafka guarantees message order **only within a single partition**, never across multiple partitions of a topic.
> - When a producer sends a record with a non-null key (e.g., `customerId` or `orderId`), Kafka calculates:
>   $$\text{targetPartition} = \text{abs}(\text{murmur2}(\text{key})) \pmod{\text{totalPartitions}}$$
> - Because this hashing algorithm is deterministic, every single event for customer `cust_88` will ALWAYS route to the exact same partition in the exact sequence they were published.
> - *Gotcha*: If you dynamically increase the partition count on a live topic, the modulo divisor changes, re-mapping existing keys to new partitions and breaking ordering for in-flight streams.

---

### Scenario 5: Why does a Consumer Group have an upper limit on active workers?
> **The 1:1 Partition Assignment Rule**: Within a single consumer group, a partition can be consumed by **at most ONE active consumer instance** at any given time.
> - If topic `orders` has **12 partitions**:
>   - 4 consumers $\to$ each consumes 3 partitions.
>   - 12 consumers $\to$ each consumes 1 partition (maximum useful parallelism).
>   - 20 consumers $\to$ 12 active consumers, while **8 instances sit completely idle** as hot standbys.
> - To increase consumer parallelism beyond 12 workers, you must increase the partition count of the topic.

---

### Scenario 6: Does Kafka TRULY guarantee "Exactly-Once Processing"?
> **The Interview Trap Answer**: *"Yes, Kafka has `processing.guarantee=exactly_once_v2`."* (Junior answer).
> 
> **The Senior Architect Answer**:
> *"Kafka's Exactly-Once Semantics (EOS) only applies **within the Kafka ecosystem** (reading from Kafka, processing in Kafka Streams / Flink, and writing to another Kafka topic). Inside that boundary, Kafka uses idempotent producer sequence numbers and 2-Phase Commit transaction markers across `__transaction_state` and output partitions."*
> 
> *"However, the moment a consumer writes to an **external system** (e.g. updating a PostgreSQL database, charging a Stripe credit card, or sending an SMS), exactly-once is mathematically impossible via Kafka alone. If the consumer updates the database but crashes before committing its offset to Kafka, the message will be redelivered. Therefore, end-to-end exactly-once requires **Application-Level Deduplication** (idempotency keys + unique DB constraints or Redis `SETNX`)."*

---

## Related Pages
- [Kafka Exactly-Once Semantics Deep Dive](../advanced/kafka-exactly-once.md)
- [Deduplication in Distributed Messaging (State Store vs Redis)](../advanced/exactly-once-vs-dedup.md)
- [Event-Driven Microservices Architecture](../../system-design/event-driven-microservices.md)
- [Kafka Producer & Consumer Internals Q&A](./interview-producer-consumer.md)
