---
id: kafka-complete-guide
title: "Kafka: The Complete Guide"
slug: kafka-complete-guide
description: Introductory Kafka guide covering core concepts, brokers, topics, partitions, producers, consumers, and event streaming basics.
tags: [kafka, event-streaming, distributed-systems, beginner]
---

# Kafka: The Complete Guide

Apache Kafka is a distributed event-streaming platform designed for high-throughput, fault-tolerant, real-time data pipelines and streaming applications. This guide covers the core concepts every new learner needs to understand.

---

## 1. What Is Apache Kafka?

Kafka is an **open-source distributed event store and stream-processing platform**. Originally developed at LinkedIn, it is now maintained by the Apache Software Foundation.

**Key characteristics:**

- **High throughput** — handles millions of messages per second
- **Distributed** — runs as a cluster across multiple servers (brokers)
- **Durable** — persists messages to disk with configurable retention
- **Scalable** — horizontally scales by adding more brokers and partitions
- **Fault-tolerant** — replicates data across brokers to survive failures

**Common use cases:**

- Real-time event streaming (e.g., user activity tracking)
- Log aggregation
- Data integration between microservices
- Stream processing (ETL pipelines)
- Event sourcing and CQRS

---

## 2. Core Concepts

### 2.1 Topics

A **topic** is a named feed or category to which records are published. Think of it as a logical channel.

- Producers write to topics; consumers read from topics.
- Topics are identified by name (e.g., `order-events`, `user-signups`).
- A topic can have zero, one, or many consumers.

### 2.2 Partitions

Each topic is split into one or more **partitions** — ordered, immutable sequences of records.

```
Topic: order-events
├── Partition 0: [msg0, msg1, msg2, msg3, ...]
├── Partition 1: [msg0, msg1, msg2, ...]
└── Partition 2: [msg0, msg1, msg2, msg3, msg4, ...]
```

- Each message within a partition gets a sequential **offset** (starting at 0).
- Partitions enable **parallelism** — different consumers can read different partitions concurrently.
- **Ordering is guaranteed only within a single partition**, not across partitions.

### 2.3 Brokers

A **broker** is a single Kafka server. A Kafka **cluster** consists of multiple brokers.

- Each broker hosts a subset of partitions.
- Brokers coordinate via a **controller** (one broker elected as controller).
- Adding more brokers increases storage capacity and throughput.

### 2.4 Producers

A **producer** publishes messages to a Kafka topic.

```java
// Java Producer example
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.send(new ProducerRecord<>("order-events", "order-123", "Order Created"));
producer.close();
```

**Key points:**

- Producers choose which partition a message goes to via a **partitioning strategy** (round-robin, key-based hash, or custom).
- If a message key is provided, all messages with the same key go to the same partition (preserving order for that key).
- Producers can send messages **synchronously** or **asynchronously**.

### 2.5 Consumers

A **consumer** reads messages from one or more topics.

```java
// Java Consumer example
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "order-processing-group");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Collections.singletonList("order-events"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        System.out.printf("offset=%d, key=%s, value=%s%n",
            record.offset(), record.key(), record.value());
    }
}
```

### 2.6 Consumer Groups

A **consumer group** is a set of consumers that cooperate to consume a topic.

```
Topic: order-events (3 partitions)

Consumer Group: order-processing-group
├── Consumer A → reads Partition 0
├── Consumer B → reads Partition 1
└── Consumer C → reads Partition 2
```

- Each partition is consumed by **exactly one consumer** within a group.
- If a consumer fails, its partitions are **rebalanced** to remaining consumers.
- Multiple consumer groups can independently read the same topic (each group tracks its own offsets).

### 2.7 Offsets

An **offset** is a unique identifier for each record within a partition.

- Consumers track their position (offset) in each partition.
- Offsets are committed (stored) so consumers can resume after a restart.
- Offset commit strategies:
  - **Auto-commit** — periodic automatic commits (simple but risk of duplicates)
  - **Manual commit** — explicit control for at-least-once or exactly-once processing

### 2.8 Replication

Kafka replicates partitions across multiple brokers for fault tolerance.

- Each partition has one **leader** and zero or more **follower** replicas.
- All reads and writes go through the leader.
- Followers continuously replicate data from the leader.
- If the leader fails, a follower is promoted to leader.

```
Partition 0:
  Leader  → Broker 1
  Replica → Broker 2
  Replica → Broker 3
```

**Replication factor** — the total number of copies (e.g., a replication factor of 3 means 1 leader + 2 followers).

---

## 3. Kafka Architecture Overview

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌──────────┐
│ Producer  │────▶│          Kafka Cluster               │────▶│ Consumer │
│          │     │  ┌────────┐ ┌────────┐ ┌────────┐   │     │ Group A  │
│ Producer  │────▶│  │Broker 1│ │Broker 2│ │Broker 3│   │────▶│          │
│          │     │  └────────┘ └────────┘ └────────┘   │     │ Consumer │
│ Producer  │────▶│                                      │────▶│ Group B  │
└──────────┘     └──────────────────────────────────────┘     └──────────┘
                          │
                   ┌──────┴──────┐
                   │  ZooKeeper  │  (or KRaft in newer versions)
                   └─────────────┘
```

### ZooKeeper vs. KRaft

- **ZooKeeper** (legacy) — manages broker metadata, leader election, and cluster coordination.
- **KRaft** (Kafka Raft, introduced in Kafka 3.x) — replaces ZooKeeper with a built-in consensus protocol. KRaft is the recommended mode for new deployments.

---

## 4. Message Structure

Every Kafka message (record) consists of:

| Field       | Description                                    |
|------------|------------------------------------------------|
| **Key**     | Optional. Used for partitioning and compaction. |
| **Value**   | The actual message payload (bytes).            |
| **Timestamp** | When the message was produced or ingested.   |
| **Headers** | Optional key-value metadata pairs.             |
| **Offset**  | Assigned by Kafka upon write (not set by the producer). |

---

## 5. Key Configurations

### Producer Configurations

| Property           | Description                                                      |
|-------------------|------------------------------------------------------------------|
| `acks`            | `0` = no ack, `1` = leader ack, `all` = all replicas ack       |
| `retries`         | Number of retries on transient failures                          |
| `batch.size`      | Max bytes per batch before sending                               |
| `linger.ms`       | Time to wait for more messages before sending a batch            |
| `compression.type`| Compression codec: `none`, `gzip`, `snappy`, `lz4`, `zstd`    |

### Consumer Configurations

| Property                  | Description                                            |
|--------------------------|--------------------------------------------------------|
| `group.id`               | Consumer group identifier                              |
| `auto.offset.reset`      | `earliest` = start from beginning, `latest` = newest   |
| `enable.auto.commit`     | Whether offsets are committed automatically             |
| `max.poll.records`       | Max records returned per `poll()` call                 |
| `session.timeout.ms`     | Time before a consumer is considered dead              |

### Broker / Topic Configurations

| Property                   | Description                                           |
|---------------------------|-------------------------------------------------------|
| `num.partitions`          | Default number of partitions for new topics            |
| `default.replication.factor` | Default replication factor for new topics           |
| `retention.ms`            | How long messages are retained (default: 7 days)       |
| `retention.bytes`         | Max size per partition before old messages are deleted  |
| `cleanup.policy`          | `delete` (time/size based) or `compact` (key based)   |

---

## 6. Delivery Semantics

Kafka supports three delivery guarantees:

### At-Most-Once

- Messages may be lost but are never redelivered.
- Offsets are committed **before** processing.
- Fastest but least reliable.

### At-Least-Once (default)

- Messages are never lost but may be redelivered (duplicates possible).
- Offsets are committed **after** processing.
- Most common choice — handle duplicates via idempotent consumers.

### Exactly-Once

- Each message is delivered and processed exactly once.
- Achieved via **idempotent producers** (`enable.idempotence=true`) and **transactional APIs**.
- Highest overhead but strongest guarantee.

---

## 7. Log Compaction

Log compaction retains the **latest value for each key** within a partition, rather than expiring messages by time or size.

```
Before compaction:
  offset 0: key=A, value=v1
  offset 1: key=B, value=v1
  offset 2: key=A, value=v2   ← latest for key A
  offset 3: key=B, value=v2   ← latest for key B
  offset 4: key=A, value=v3   ← latest for key A

After compaction:
  offset 3: key=B, value=v2
  offset 4: key=A, value=v3
```

Use cases: maintaining latest state (e.g., user profiles, configuration snapshots).

---

## 8. Kafka Streams (Stream Processing)

**Kafka Streams** is a client library for building real-time stream-processing applications directly on Kafka.

```java
StreamsBuilder builder = new StreamsBuilder();

KStream<String, String> orders = builder.stream("order-events");

// Filter and transform
orders
    .filter((key, value) -> value.contains("CREATED"))
    .mapValues(value -> value.toUpperCase())
    .to("processed-orders");

KafkaStreams streams = new KafkaStreams(builder.build(), props);
streams.start();
```

**Key features:**

- No separate cluster needed — runs in your application process
- Supports stateful operations (aggregations, joins, windowing)
- Exactly-once processing semantics
- Fault-tolerant state stores (backed by changelog topics)

---

## 9. Schema Registry

In production, you typically use a **Schema Registry** (e.g., Confluent Schema Registry) to manage message schemas.

- Enforces schema compatibility (backward, forward, full)
- Common serialization formats: **Avro**, **Protobuf**, **JSON Schema**
- Producers register schemas; consumers validate against registered schemas
- Prevents breaking changes from being published

---

## 10. Monitoring and Operations

### Key Metrics to Monitor

| Metric                        | What It Tells You                              |
|------------------------------|------------------------------------------------|
| **Under-replicated partitions** | Replicas falling behind the leader           |
| **Consumer lag**              | How far behind a consumer group is             |
| **Request latency**          | Produce/fetch request times                    |
| **Broker disk usage**        | Storage consumption per broker                 |
| **ISR shrink/expand rate**   | In-sync replica set changes (stability)        |

### Common Tools

- **Kafka CLI** — `kafka-topics.sh`, `kafka-console-producer.sh`, `kafka-console-consumer.sh`
- **Kafka UI** — Conduktor, AKHQ, Kafdrop
- **Monitoring** — Prometheus + Grafana with JMX exporter

---

## 11. Best Practices for Beginners

1. **Start small** — begin with a single broker, a few topics, and one consumer group.
2. **Use meaningful keys** — keys determine partition assignment and ordering.
3. **Set replication factor ≥ 3** in production for fault tolerance.
4. **Size partitions thoughtfully** — more partitions = more parallelism, but also more overhead. A common starting point is 6–12 partitions per topic.
5. **Use `acks=all`** for critical data to ensure durability.
6. **Monitor consumer lag** — large lag indicates consumers can't keep up.
7. **Use schemas** — adopt Avro or Protobuf with a Schema Registry early.
8. **Handle rebalances gracefully** — implement `ConsumerRebalanceListener` for cleanup.
9. **Prefer KRaft** over ZooKeeper for new deployments (Kafka 3.3+).
10. **Idempotent consumers** — design consumers to handle duplicate messages safely.

---

## 12. Quick Reference: CLI Commands

```bash
# Create a topic
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic order-events \
  --partitions 3 --replication-factor 2

# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Describe a topic
kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --topic order-events

# Produce messages
kafka-console-producer.sh --bootstrap-server localhost:9092 \
  --topic order-events

# Consume messages (from beginning)
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic order-events --from-beginning --group my-group

# Check consumer group lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group order-processing-group
```

---

## Further Reading

- [Apache Kafka Official Documentation](https://kafka.apache.org/documentation/)
- [Confluent Developer Tutorials](https://developer.confluent.io/)
- *Kafka: The Definitive Guide* — Neha Narkhede, Gwen Shapira, Todd Palino (O'Reilly)

---

## Advanced Editorial Pass: Kafka Platform Thinking

### Strategic Architecture Focus
- Topic design, partition strategy, and key semantics are long-term contracts.
- Delivery guarantees must align with business consistency requirements.
- Operability (lag, rebalancing, retries, DLQ) determines real reliability.

### Production Failure Modes
- Partition-key mistakes that create hotspots and unstable throughput.
- Retry policies that amplify duplicates without idempotent consumers.
- Under-observed consumer groups causing silent backlog growth.

### Engineering Heuristics
1. Treat event schema and key design as governance decisions.
2. Define replay and backfill strategy before first production launch.
3. Instrument lag and end-to-end processing latency as primary SLO inputs.

### Compare Next
- [Kafka Streams: Topology & Branching](./kafka-streams.md)
- [Configuring Exactly-Once Semantics in Kafka](./kafka-exactly-once.md)
- [Kafka Connect](./kafka-connect.md)
