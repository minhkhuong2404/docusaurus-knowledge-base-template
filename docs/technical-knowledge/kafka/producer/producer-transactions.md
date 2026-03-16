---
id: producer-transactions
title: Producer Transactions
sidebar_label: Producer Transactions
---

# Producer Transactions

## Why Transactions?

Idempotence protects against duplicates within a session, but it doesn't help when:

1. A producer writes to **multiple partitions/topics atomically**
2. A consumer-process-producer pipeline must achieve **exactly-once** (read → process → write)
3. Producer **restarts** and you need to resume without re-sending already-committed records

Kafka Transactions solve this with **atomic multi-partition writes**.

---

## How Transactions Work

### Key Actors

| Actor | Role |
|-------|------|
| **Transaction Coordinator** | A broker responsible for managing transaction state (selected by `transactional.id` hash) |
| **`__transaction_state` topic** | Internal topic storing transaction metadata |
| **Transaction Markers** | Special records written to each partition to commit or abort |

### Transaction Lifecycle

```
1. initTransactions()           → Register PID + transactional.id with coordinator
2. beginTransaction()           → Mark start (local state only)
3. send(record to topic A)      → Writes buffered under transaction
4. send(record to topic B)      → Same transaction
5. commitTransaction()          → Coordinator writes PREPARE_COMMIT
                                  Transaction markers (COMMIT) written to all partitions
                                  Consumers with isolation.level=read_committed see messages
6. abortTransaction() (on error) → ABORT markers written, records invisible to consumers
```

---

## Producer Configuration

```java
@Bean
public ProducerFactory<String, OrderEvent> transactionalProducerFactory() {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

    // Transactions require idempotence
    props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

    // Stable ID that survives restarts
    props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "order-producer-1");

    // Required by transactions
    props.put(ProducerConfig.ACKS_CONFIG, "all");

    // Transaction timeout (if not committed within this time, coordinator aborts)
    props.put(ProducerConfig.TRANSACTION_TIMEOUT_CONFIG, 60_000); // 60 seconds

    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

    DefaultKafkaProducerFactory<String, OrderEvent> factory =
        new DefaultKafkaProducerFactory<>(props);
    factory.setTransactionIdPrefix("order-tx-");  // Spring manages suffix per instance
    return factory;
}
```

---

## Using Transactions in Spring Kafka

### Method 1: `@Transactional` with `KafkaTransactionManager`

```java
@Configuration
public class KafkaTransactionConfig {

    @Bean
    public KafkaTransactionManager<String, OrderEvent> kafkaTransactionManager(
            ProducerFactory<String, OrderEvent> pf) {
        return new KafkaTransactionManager<>(pf);
    }
}

@Service
@RequiredArgsConstructor
public class OrderService {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    @Transactional("kafkaTransactionManager")
    public void processOrder(OrderEvent order) {
        kafkaTemplate.send("orders.created", order.getId(), order);
        kafkaTemplate.send("inventory.reserve", order.getId(), order);
        // If any send fails, both are aborted
    }
}
```

### Method 2: `executeInTransaction`

```java
kafkaTemplate.executeInTransaction(t -> {
    t.send("orders.created", order.getId(), order);
    t.send("inventory.reserve", order.getId(), order);
    return true;
});
```

### Method 3: Manual Transaction Control

```java
producer.initTransactions();
try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("orders.created", key, value1));
    producer.send(new ProducerRecord<>("inventory.reserve", key, value2));
    producer.commitTransaction();
} catch (ProducerFencedException e) {
    producer.close(); // Cannot recover — zombie producer
} catch (KafkaException e) {
    producer.abortTransaction();
    throw e;
}
```

---

## Consumer Isolation Level

Consumers must opt in to see only committed records:

```java
// Consumer config
props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
```

| `isolation.level` | Behavior |
|---|---|
| `read_uncommitted` (default) | Reads all records, including aborted transactions |
| `read_committed` | Only reads records from committed transactions |

:::warning
Always set `isolation.level=read_committed` when consuming from topics written by transactional producers.
:::

---

## Transactional ID & Zombie Fencing

`transactional.id` is the key to cross-session guarantees:

```
Session 1: transactional.id="order-producer-1" → PID=100, Epoch=0
Crash → restart
Session 2: transactional.id="order-producer-1" → PID=100, Epoch=1

Old session (zombie) tries to send → rejected (lower epoch)
```

The **Epoch** mechanism prevents zombie producers from committing stale transactions. This is critical in distributed systems where old instances may linger.

---

## Transactions in Consume-Process-Produce Pattern

```java
@KafkaListener(topics = "incoming-orders")
public void processOrder(ConsumerRecord<String, OrderEvent> record,
                         Acknowledgment ack) {
    kafkaTemplate.executeInTransaction(t -> {
        // Process and produce in one transaction
        t.send("processed-orders", record.key(), transform(record.value()));
        // Also commit the consumer offset atomically
        Map<TopicPartition, OffsetAndMetadata> offsets = Map.of(
            new TopicPartition(record.topic(), record.partition()),
            new OffsetAndMetadata(record.offset() + 1)
        );
        t.sendOffsetsToTransaction(offsets, "my-consumer-group");
        return true;
    });
}
```

Combining `sendOffsetsToTransaction` with produce ensures exactly-once: if the transaction aborts, neither the output message nor the offset commit is visible.

---

## Transaction Performance

- Transactions add ~2ms overhead per commit (coordinator round trip)
- Batch multiple records in one transaction to amortize cost
- Avoid very long-running transactions (coordinator timeout = `transaction.timeout.ms`)
- Use `transaction.timeout.ms` slightly lower than your consumer `max.poll.interval.ms`

---

## Interview Questions — Producer Transactions

**Q: What is `transactional.id` and why must it be stable across restarts?**

> `transactional.id` is a user-supplied string that uniquely identifies a producer across sessions. When the producer restarts with the same `transactional.id`, the Transaction Coordinator increments its epoch. This allows the new session to fence out any zombie instance of the old session that might still be running. Without a stable ID, you lose cross-restart guarantees and zombie fencing.

**Q: What is zombie fencing?**

> Zombie fencing prevents an old (crashed-but-still-running) producer instance from committing a stale transaction after the application has restarted. The coordinator tracks an epoch per `transactional.id`. When a new producer registers the same `transactional.id`, the epoch is bumped. Any subsequent request from the old producer with a lower epoch is rejected with `ProducerFencedException`.

**Q: What happens to an uncommitted transaction if the producer crashes?**

> The Transaction Coordinator holds the transaction in OPEN state. After `transaction.timeout.ms` elapses, the coordinator automatically aborts the transaction by writing ABORT markers to all partitions. Consumers with `read_committed` will never see those messages.

**Q: What is `sendOffsetsToTransaction`?**

> It's the mechanism for atomic consume-process-produce: you include consumer offset commits within the transaction. If the transaction commits, both the output records and the offset commit are made visible. If it aborts, neither is visible. This provides exactly-once semantics in a stream-processing pipeline.

**Q: How does `isolation.level=read_committed` affect consumer performance?**

> The consumer must buffer and skip records from open transactions (records written but not yet committed). This increases memory usage and introduces latency proportional to the longest open transaction. A producer that takes a long time to commit will delay how far a `read_committed` consumer can advance.
