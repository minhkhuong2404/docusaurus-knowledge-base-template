---
id: kafka-exactly-once
title: "Configuring Exactly-Once Semantics in Kafka"
slug: kafka-exactly-once
description: Guide to Kafka exactly-once semantics, including producers, consumers, transactions, Kafka Streams, and Kafka Connect.
tags: [kafka, exactly-once-semantics, stream-processing, reliability]
---

# Configuring Exactly-Once Semantics in Kafka

Exactly-once semantics (EOS) ensures that every message is **delivered and processed exactly once** — no duplicates, no data loss. This guide covers how to configure EOS across producers, consumers, Kafka Streams, and Kafka Connect.

---

## 1. Understanding Delivery Guarantees

| Guarantee        | Behavior                                | Risk                 |
|-----------------|-----------------------------------------|----------------------|
| **At-most-once** | Fire and forget; offsets committed early | Data loss            |
| **At-least-once**| Offsets committed after processing       | Duplicate processing |
| **Exactly-once** | Atomic writes + offset commits           | None (highest cost)  |

Exactly-once is achieved by combining two Kafka features:
1. **Idempotent producers** — prevent duplicate writes at the broker level
2. **Transactions** — atomically write to multiple partitions and commit offsets

---

## 2. Idempotent Producers

An idempotent producer ensures that **retries do not create duplicate messages** in a partition.

### How It Works

- The broker assigns a **Producer ID (PID)** and tracks a **sequence number** per partition.
- If a producer retries a send, the broker detects the duplicate sequence number and deduplicates it.
- This guarantees exactly-once delivery for a **single producer session to a single partition**.

### Configuration

```properties
# Enable idempotency (implied by enable.idempotence=true)
enable.idempotence=true

# These are automatically set when idempotence is enabled:
acks=all
retries=2147483647
max.in.flight.requests.per.connection=5
```

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
```

### Limitations

- Idempotency alone only prevents duplicates from **producer retries**.
- It does **not** protect against application-level replays (e.g., restarting and resending).
- For cross-partition and cross-topic exactly-once, you need **transactions**.

---

## 3. Transactional Producer

Transactions enable atomic writes across **multiple partitions and topics**, including consumer offset commits.

### Configuration

```properties
enable.idempotence=true
transactional.id=my-transactional-app-01
```

> **`transactional.id`** must be unique per producer instance and stable across restarts. Kafka uses it to fence zombie producers (previous instances that are still alive after a rebalance).

### Transactional Write Pattern

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "order-processor-01");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

// Initialize transactions (call once)
producer.initTransactions();

try {
    producer.beginTransaction();

    // Send to multiple topics/partitions atomically
    producer.send(new ProducerRecord<>("output-topic-1", "key1", "value1"));
    producer.send(new ProducerRecord<>("output-topic-2", "key2", "value2"));

    // Commit consumer offsets as part of the transaction
    Map<TopicPartition, OffsetAndMetadata> offsets = Map.of(
        new TopicPartition("input-topic", 0),
        new OffsetAndMetadata(currentOffset + 1)
    );
    producer.sendOffsetsToTransaction(offsets, consumerGroupMetadata);

    producer.commitTransaction();
} catch (ProducerFencedException | OutOfOrderSequenceException e) {
    // Fatal — cannot recover, must close
    producer.close();
} catch (KafkaException e) {
    // Abort and retry
    producer.abortTransaction();
}
```

### Transaction Lifecycle

```
initTransactions()
       │
       ▼
beginTransaction()
       │
       ├── send(record1)
       ├── send(record2)
       ├── sendOffsetsToTransaction(offsets, groupMetadata)
       │
       ▼
commitTransaction()   ──or──   abortTransaction()
```

---

## 4. Transactional Consumer

To participate in exactly-once, the consumer must only read **committed** messages.

### Configuration

```properties
group.id=my-consumer-group
isolation.level=read_committed
enable.auto.commit=false
```

| Property            | Value              | Why                                              |
|--------------------|--------------------|--------------------------------------------------|
| `isolation.level`  | `read_committed`   | Skip uncommitted (in-flight) transactional messages |
| `enable.auto.commit` | `false`          | Offsets are committed by the transactional producer |

```java
Properties props = new Properties();
props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ConsumerConfig.GROUP_ID_CONFIG, "my-consumer-group");
props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
```

---

## 5. Complete Consume-Transform-Produce Pattern

This is the full exactly-once pattern: consume → process → produce + commit offsets atomically.

```java
KafkaConsumer<String, String> consumer = createTransactionalConsumer();
KafkaProducer<String, String> producer = createTransactionalProducer();

producer.initTransactions();
consumer.subscribe(List.of("input-topic"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

    if (records.isEmpty()) continue;

    producer.beginTransaction();
    try {
        Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();

        for (ConsumerRecord<String, String> record : records) {
            // Transform
            String result = process(record.value());

            // Produce to output topic
            producer.send(new ProducerRecord<>("output-topic", record.key(), result));

            // Track offsets
            offsets.put(
                new TopicPartition(record.topic(), record.partition()),
                new OffsetAndMetadata(record.offset() + 1)
            );
        }

        // Atomically commit offsets + produced records
        producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());
        producer.commitTransaction();

    } catch (ProducerFencedException | OutOfOrderSequenceException e) {
        producer.close();
        break;
    } catch (KafkaException e) {
        producer.abortTransaction();
    }
}
```

---

## 6. Exactly-Once in Kafka Streams

Kafka Streams makes exactly-once **trivial to enable** — it handles all the transactional plumbing internally.

### Configuration

```java
Properties props = new Properties();
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-streams-app");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

// Enable exactly-once (use "exactly_once_v2" for Kafka 3.0+)
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, "exactly_once_v2");
```

| Value               | Kafka Version | Description                                    |
|--------------------|---------------|------------------------------------------------|
| `at_least_once`    | All           | Default; possible duplicates                   |
| `exactly_once`     | 0.11–2.x      | Original EOS (one producer per task)           |
| `exactly_once_v2`  | 2.6+ (recommended for 3.0+) | Optimized EOS (fewer producers, less overhead) |

> **Always use `exactly_once_v2`** on Kafka 2.6+. The original `exactly_once` is deprecated.

### What Kafka Streams Does Internally

When `exactly_once_v2` is enabled, Kafka Streams:
1. Uses a **transactional producer** per stream thread
2. Atomically writes output records and commits consumer offsets
3. Atomically flushes changelog (state store) updates
4. Fences zombie instances using `transactional.id` derived from `application.id`

---

## 7. Exactly-Once in Kafka Connect

### Source Connectors

Kafka Connect supports exactly-once source connectors (Kafka 3.3+):

```properties
# In connect-distributed.properties
exactly.once.source.support=enabled

# Per-connector override
exactly.once.support=required
transaction.boundary=poll    # or "connector" or "interval"
```

| `transaction.boundary` | Behavior                                                    |
|-----------------------|------------------------------------------------------------|
| `poll`                | One transaction per `poll()` call (default)                |
| `connector`           | One global transaction per connector                       |
| `interval`            | Transaction committed at configured interval               |

### Sink Connectors

Sink connectors achieve exactly-once by:
1. Setting `consumer.override.isolation.level=read_committed`
2. Implementing **idempotent writes** in the sink system (e.g., upserts with primary keys)

---

## 8. Broker Configuration for EOS

Ensure your broker cluster is configured to support transactions:

```properties
# Minimum ISR for transactional internal topics
transaction.state.log.min.isr=2
transaction.state.log.replication.factor=3

# Transaction timeout
transaction.max.timeout.ms=900000

# Enable unclean leader election = false (default, keep it)
unclean.leader.election.enable=false

# Minimum in-sync replicas for data topics
min.insync.replicas=2
```

**Cluster requirements:**
- At least **3 brokers** (for replication factor 3)
- **`min.insync.replicas=2`** on data topics to prevent data loss with `acks=all`
- The `__transaction_state` internal topic must be healthy

---

## 9. Performance Considerations

Exactly-once introduces overhead. Understand the trade-offs:

| Aspect              | Impact                                                   |
|--------------------|----------------------------------------------------------|
| **Latency**         | Slightly higher due to transaction commit overhead       |
| **Throughput**      | ~3-20% lower (varies by workload)                        |
| **Broker load**     | Additional transaction coordinator work                  |
| **Producer memory** | Transaction buffers require more memory                  |

### Tuning Tips

```properties
# Increase batch size to amortize transaction overhead
batch.size=65536
linger.ms=10

# Kafka Streams: increase commit interval (fewer, larger transactions)
commit.interval.ms=100   # default is 100ms for EOS

# Transaction timeout (increase if processing is slow)
transaction.timeout.ms=60000
```

---

## 10. Common Pitfalls

### 1. Forgetting `isolation.level=read_committed`

Without this, consumers read **uncommitted** messages — breaking the exactly-once guarantee.

### 2. Non-unique `transactional.id`

If two active producers share the same `transactional.id`, one will be **fenced** (killed). Ensure each instance has a unique ID, typically derived from partition assignment.

### 3. Using `exactly_once` instead of `exactly_once_v2`

The v1 mode creates one producer **per task**, which is resource-intensive. Always use v2 on Kafka 2.6+.

### 4. External side effects

Exactly-once only applies to **Kafka-to-Kafka** processing. If your consumer writes to an external database:
- The database write is **not** part of the Kafka transaction.
- You need **idempotent writes** on the external system (e.g., upsert with a unique key, deduplication table).

### 5. Ignoring `ProducerFencedException`

This is a **fatal** exception. Do not retry — close the producer and let the application restart.

---

## 11. Decision Flowchart

```
Do you need exactly-once?
│
├── Only preventing producer retry duplicates?
│   └── ✅ Use idempotent producer (enable.idempotence=true)
│
├── Kafka-to-Kafka processing with Kafka Streams?
│   └── ✅ Set processing.guarantee=exactly_once_v2
│
├── Kafka-to-Kafka with custom consumer/producer?
│   └── ✅ Use transactional producer + read_committed consumer
│
├── Kafka Connect source?
│   └── ✅ Set exactly.once.source.support=enabled (Kafka 3.3+)
│
└── Kafka to external system?
    └── ⚠️  EOS covers Kafka side only; implement idempotent
        writes on the external system
```

---

## 12. Summary Configuration Cheat Sheet

### Producer

```properties
enable.idempotence=true
transactional.id=<unique-per-instance>
acks=all
```

### Consumer

```properties
isolation.level=read_committed
enable.auto.commit=false
```

### Kafka Streams

```properties
processing.guarantee=exactly_once_v2
```

### Broker

```properties
transaction.state.log.replication.factor=3
transaction.state.log.min.isr=2
min.insync.replicas=2
unclean.leader.election.enable=false
```

---

## Further Reading

- [KIP-98: Exactly Once Delivery and Transactional Messaging](https://cwiki.apache.org/confluence/display/KAFKA/KIP-98)
- [KIP-447: Producer Scalability for Exactly Once Semantics](https://cwiki.apache.org/confluence/display/KAFKA/KIP-447)
- [Confluent — Exactly-Once Semantics](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/)

---

## Advanced Editorial Pass: Exactly-Once as End-to-End Discipline

### What Senior Teams Get Right
- Exactly-once is a pipeline property, not a single producer flag.
- Idempotency, transaction boundaries, and offset coordination must be co-designed.
- Failure injection testing is required to validate guarantee claims.

### Subtle Failure Modes
- EOS assumptions broken by side effects outside transaction scope.
- Zombie producer fencing misunderstood during failover events.
- Commit strategy drift between application and framework defaults.

### Engineering Heuristics
1. Document guarantee scope clearly: topic-only, pipeline, or business operation level.
2. Validate semantics under rebalance, retry storm, and partial outage scenarios.
3. Keep transactional boundaries narrow and observable.

### Compare Next
- [Kafka Streams: Topology & Branching](./kafka-streams.md)
- [Parallel Consumer in Kafka](./kafka-parallel-consumer.md)
- [Kafka Connect](./kafka-connect.md)
