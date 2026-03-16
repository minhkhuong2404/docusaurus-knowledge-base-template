---
id: exactly-once
title: Exactly-Once Semantics (EOS)
sidebar_label: Exactly-Once (EOS)
---

# Exactly-Once Semantics (EOS)

## The Delivery Guarantee Spectrum

| Guarantee | Description | Risk |
|-----------|-------------|------|
| **At-most-once** | Send once, no retry | Message loss possible |
| **At-least-once** | Retry until ACK received | Duplicate messages possible |
| **Exactly-once** | Delivered and processed exactly one time | Neither loss nor duplicates |

---

## Components of EOS

Full end-to-end exactly-once in Kafka requires three layers working together:

```
1. Idempotent Producer    → prevents duplicates on retry (producer → broker)
2. Transactions           → atomic multi-partition writes
3. read_committed Consumer → only sees committed transaction records
4. sendOffsetsToTransaction → atomically commits consumer offset with produce
```

---

## EOS Configuration Checklist

### Producer
```java
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "my-app-tx-1");
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
```

### Consumer
```java
props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
```

### Broker / Topic
```properties
min.insync.replicas=2
replication.factor=3
unclean.leader.election.enable=false
```

---

## Full EOS Example: Consume → Process → Produce

```java
@Service
@RequiredArgsConstructor
public class OrderProcessingService {

    private final KafkaTemplate<String, ProcessedOrder> kafkaTemplate;

    @KafkaListener(
        topics = "raw-orders",
        groupId = "order-processor",
        containerFactory = "eosKafkaListenerContainerFactory"
    )
    public void process(ConsumerRecord<String, RawOrder> record,
                        @Header(KafkaHeaders.OFFSET) long offset,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition) {

        kafkaTemplate.executeInTransaction(t -> {
            // 1. Process the record
            ProcessedOrder processed = transform(record.value());

            // 2. Produce result (part of transaction)
            t.send("processed-orders", record.key(), processed);

            // 3. Commit input offset atomically with produce
            Map<TopicPartition, OffsetAndMetadata> offsets = Map.of(
                new TopicPartition(record.topic(), partition),
                new OffsetAndMetadata(offset + 1)
            );
            t.sendOffsetsToTransaction(offsets, "order-processor");

            return null;
        });
    }
}
```

### Container Factory for EOS

```java
@Bean
public ConcurrentKafkaListenerContainerFactory<String, RawOrder>
        eosKafkaListenerContainerFactory(
            ConsumerFactory<String, RawOrder> consumerFactory,
            ProducerFactory<String, ProcessedOrder> producerFactory) {

    ConcurrentKafkaListenerContainerFactory<String, RawOrder> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);

    // Enable EOS in Spring Kafka
    factory.getContainerProperties().setEosMode(ContainerProperties.EOSMode.V2);

    return factory;
}
```

---

## EOSMode in Spring Kafka

Spring Kafka provides two EOS modes:

| EOSMode | Description |
|---------|-------------|
| `V1` (ALPHA) | One producer per group/topic/partition (old approach) |
| `V2` (BETA, default since Spring Kafka 2.6) | One producer per listener container thread — simpler, better performance |

```java
factory.getContainerProperties().setEosMode(ContainerProperties.EOSMode.V2);
```

---

## EOS vs At-Least-Once

```
At-Least-Once (simplest, most common):
  - Consumer reads message
  - Processes it
  - Commits offset after success
  - On crash between process and commit → reprocessed (duplicate output)
  - Requires idempotent downstream systems to be safe

Exactly-Once:
  - Consumer reads message
  - Processes it and produces output in a transaction
  - Consumer offset committed atomically with produce
  - On crash → transaction aborted, no output, no offset advance
  - Message reprocessed exactly once on restart
```

---

## EOS Performance Considerations

EOS adds overhead:
- Two-phase commit protocol (PREPARE + COMMIT markers)
- Additional broker round-trips
- Consumers with `read_committed` must wait for transaction markers

**Tips:**
- Batch multiple messages in one transaction where possible
- Keep transactions short (< `transaction.timeout.ms`)
- Use `linger.ms` to fill batches before committing
- Monitor `ProducerMetrics.record-error-rate` and transaction abort rate

---

## Interview Questions — Exactly-Once

**Q: What are the three pillars required for exactly-once in Kafka?**

> (1) **Idempotent producer** — prevents duplicate writes from retries within a session. (2) **Transactions** — enables atomic writes across partitions and atomically commits consumer offsets with output production. (3) **`read_committed` consumer** — ensures consumers only see fully committed transaction records, ignoring aborted transactions and open/uncommitted data.

**Q: Is exactly-once semantics truly end-to-end or only within Kafka?**

> Kafka's EOS guarantees exactly-once **within the Kafka cluster** (producer → broker → consumer). It does not extend to external systems (e.g., writing to a database). If your consumer writes to a DB as part of processing, you need idempotent DB writes or two-phase commit with an external coordinator. For Kafka Streams, EOS is built-in end-to-end within the streaming pipeline.

**Q: What is `sendOffsetsToTransaction` and why is it needed?**

> It includes consumer offset commits within the producer's current transaction. This ensures that if the transaction aborts (e.g., due to failure), the consumer's offset is also not committed — causing the message to be reprocessed. Without this, you could commit the output to Kafka but fail to commit the offset, or vice versa, breaking exactly-once.

**Q: What is the performance cost of exactly-once?**

> EOS adds ~10–20% overhead compared to at-least-once, primarily from the two-phase commit protocol (PREPARE_COMMIT marker, then COMMIT marker) and consumers needing to buffer records pending transaction completion. For most use cases the overhead is acceptable; high-frequency, low-latency systems may prefer at-least-once with idempotent processing.

**Q: How does Kafka Streams achieve EOS internally?**

> Kafka Streams uses `processing.guarantee=exactly_once_v2` to configure its internal producers with `transactional.id` derived from the application ID and task ID. For each stream task, it wraps the read-process-write cycle in a Kafka transaction, including offset commits via `sendOffsetsToTransaction`. This provides EOS within the streaming pipeline without requiring manual transaction management.

---

## Decision Flowchart

```
Do you need exactly-once?
│
├── Only preventing producer retry duplicates?
│   └── Use idempotent producer (enable.idempotence=true)
│
├── Kafka-to-Kafka processing with Kafka Streams?
│   └── Set processing.guarantee=exactly_once_v2
│
├── Kafka-to-Kafka with custom consumer/producer?
│   └── Use transactional producer + read_committed consumer
│
├── Kafka Connect source?
│   └── Set exactly.once.source.support=enabled (Kafka 3.3+)
│
└── Kafka to external system?
    └── EOS covers Kafka side only; implement idempotent writes externally
```

---

## Summary Configuration Cheat Sheet

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
