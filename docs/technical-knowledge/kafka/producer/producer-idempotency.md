---
id: producer-idempotency
title: Idempotent Producer
sidebar_label: Idempotency
---

# Idempotent Producer

## The Problem: Duplicate Messages on Retry

Without idempotence, the standard retry flow can produce **duplicates**:

```
1. Producer sends batch to broker
2. Broker appends message and replicates
3. Network blip — ACK never reaches producer
4. Producer retries (sees timeout/network error)
5. Broker receives same batch AGAIN → appended twice!

Result: Duplicate records in the topic
```

---

## Idempotence: Exactly-Once Per Session

Enabling `enable.idempotence=true` gives the producer **exactly-once delivery per producer session per partition**.

### How It Works

Each producer is assigned a **Producer ID (PID)** by the broker. Every batch sent to a partition is tagged with:
- The **PID**
- A **Sequence Number** (monotonically increasing per PID + partition)

```
Producer → Broker
[PID=42, Seq=0, data="order-1"]  → appended at offset 100
[PID=42, Seq=1, data="order-2"]  → appended at offset 101

Retry scenario:
[PID=42, Seq=1, data="order-2"]  → duplicate! broker rejects (already saw Seq=1)
```

The broker deduplicates by tracking the last seen sequence number per `(PID, partition)`.

---

## Enabling Idempotence

```java
// Programmatic
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

// Implied by idempotence (these are auto-set)
// acks=all
// retries=MAX_INT
// max.in.flight.requests.per.connection <= 5
```

```yaml
# application.yml
spring:
  kafka:
    producer:
      properties:
        enable.idempotence: true
```

:::warning Kafka 3.0+ default
Since Kafka 3.0, `enable.idempotence=true` is the **default**. However, explicitly setting it in production configs documents intent and prevents accidental override.
:::

---

## Required Config Constraints

When idempotence is enabled, Kafka enforces:

| Config | Required Value | Why |
|--------|---------------|-----|
| `acks` | `all` | Must wait for full ISR replication |
| `retries` | `> 0` (typically `MAX_INT`) | Must retry on transient failures |
| `max.in.flight.requests.per.connection` | `<= 5` | Sequence tracking requires bounded in-flight |

If you set `enable.idempotence=true` with conflicting configs (e.g., `acks=1`), Kafka throws `ConfigException`.

---

## Idempotence Scope & Limitations

| Scope | Covered? |
|-------|---------|
| Duplicate retries within same producer session | ✅ Yes |
| Duplicates across producer restarts (new PID) | ❌ No |
| Duplicates across multiple producers writing same record | ❌ No |
| Consumer-side deduplication | ❌ No |

For cross-session deduplication, you need **Transactions** (see [Producer Transactions](./producer-transactions)).

---

## Sequence Number Tracking

The broker maintains a window of `max.in.flight.requests.per.connection` sequence numbers per `(PID, TopicPartition)`.

```
Window (5 in-flight):
Expected next seq: 10

Incoming seq=10 → accept, advance to 11
Incoming seq=10 (retry) → reject as duplicate, return OK
Incoming seq=12 → reject as out-of-order, return error
```

Out-of-order sequence numbers trigger `OutOfOrderSequenceException` — an unrecoverable error that means the producer must be restarted.

---

## Full Idempotent Producer Configuration

```java
@Bean
public ProducerFactory<String, OrderEvent> idempotentProducerFactory() {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

    // Idempotence
    props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

    // Auto-enforced by idempotence, but explicit for clarity:
    props.put(ProducerConfig.ACKS_CONFIG, "all");
    props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
    props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);

    // Timeout budget
    props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 120_000);
    props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 30_000);

    // Throughput
    props.put(ProducerConfig.LINGER_MS_CONFIG, 5);
    props.put(ProducerConfig.BATCH_SIZE_CONFIG, 32 * 1024);
    props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");

    // Serializers
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

    return new DefaultKafkaProducerFactory<>(props);
}
```

---

## Interview Questions — Idempotency

**Q: What does idempotence mean in the context of Kafka producers?**

> An idempotent producer guarantees that even if a message is retried multiple times (due to network issues or broker restarts), it will be written to the broker **exactly once** per producer session per partition. This is achieved by assigning each producer a unique PID and tagging each batch with a monotonically increasing sequence number. The broker deduplicates based on `(PID, partition, sequenceNumber)`.

**Q: Does idempotence prevent all duplicates?**

> No. Idempotence only prevents duplicates caused by producer retries within the same session. If the producer process restarts, it gets a new PID and the broker has no way to deduplicate across sessions. For cross-restart deduplication, you need Kafka Transactions with a stable `transactional.id`.

**Q: Why is `max.in.flight.requests.per.connection <= 5` required for idempotence?**

> The broker tracks sequence numbers in a bounded window. Beyond 5 in-flight requests, the deduplication window can't guarantee correctness — an out-of-order retry could fall outside the tracked window, leading to `OutOfOrderSequenceException`. Kafka enforces max 5 as a safety constraint.

**Q: What is `OutOfOrderSequenceException`?**

> This is an unrecoverable error thrown by the broker when a producer sends a sequence number that is not the expected next value for that `(PID, partition)` pair. It typically means the in-flight window was exceeded or there was a severe sequencing issue. The producer must be closed and recreated.

**Q: Is idempotence sufficient for exactly-once semantics end-to-end?**

> No. Idempotence only covers the producer → broker leg. For true end-to-end exactly-once (consume → process → produce), you need Kafka Transactions combined with idempotence. Idempotence is a prerequisite for transactions.
