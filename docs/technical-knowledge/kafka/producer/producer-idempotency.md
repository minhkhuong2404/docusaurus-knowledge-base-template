---
id: producer-idempotency
title: Idempotent Producer
sidebar_label: Idempotency
description: Without idempotence, network retries create duplicate messages on Kafka brokers. Enabling idempotence guarantees exactly-once delivery per producer session.
tags:
  - technical-knowledge
  - kafka
  - producer
  - producer-idempotency
---

import KafkaProducerIdempotencyDiagram from '@site/src/components/KafkaProducerIdempotencyDiagram';

# Idempotent Producer (`enable.idempotence`)

<KafkaProducerIdempotencyDiagram />

---

## The Problem: Network Retries Cause Duplicate Messages

When a producer publishes a record batch to a broker, a network glitch or GC pause can prevent the leader's ACK response from reaching the producer:

```
1. Producer sends RecordBatch (Offset 101) to Leader Broker.
2. Leader writes RecordBatch to local log segment.
3. Network transient error drops the ACK response.
4. Producer retries (due to retries > 0 configuration).
5. Leader receives identical RecordBatch AGAIN -> Appends duplicate at Offset 102!
```

---

## The Solution: Producer ID (PID) & Sequence Numbers

Enabling `enable.idempotence=true` provides **exactly-once write delivery per producer session per partition**:

```
Producer Initialization:
- Producer issues InitProducerId Request to Broker.
- Broker assigns a 64-bit Producer ID (PID) to the producer session.

Record Batch Tagging:
- Every RecordBatch is tagged with: (PID, Epoch, SequenceNumber).
- Sequence numbers increment monotonically per (PID, Partition).

Broker Deduplication Window:
- Leader Broker tracks the last 5 sequence numbers per (PID, Partition).
- If Leader sees (PID=42, Seq=7) again -> Drops duplicate write, returns successful ACK.
```

---

## Required Configuration Constraints

Enabling idempotence automatically enforces strict producer client configurations:

| Property | Enforced Value | Operational Rationale |
|---|---|---|
| `acks` | `all` | Deduplication tracking requires full ISR replication. |
| `retries` | `Integer.MAX_VALUE` | Retries must remain enabled for transient error handling. |
| `max.in.flight.requests.per.connection` | $\le 5$ | Keeps in-flight batches within the broker's sequence tracking window. |

```java
// Spring Boot / Java Configuration
Map<String, Object> props = new HashMap<>();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
```

---

## Interview Questions

### Q1. What does idempotence mean in Apache Kafka producer architecture?
> An idempotent producer (`enable.idempotence=true`) guarantees that even if a producer retries message publication multiple times due to transient network failures or leader failovers, the broker appends the record batch to the log **exactly once** per producer session per partition. The broker assigns a 64-bit Producer ID (PID) and tracks sequence numbers per partition to deduplicate retried batches.

### Q2. Does enabling `enable.idempotence=true` prevent all duplicate messages across application restarts?
> No. Idempotency only deduplicates retries within a single continuous producer session. If the producer application process crashes or restarts, it receives a new PID from the broker upon initialization, and historical sequence numbers are reset. To achieve deduplication across producer restarts, you must configure **Kafka Transactions** with a persistent `transactional.id`.

### Q3. Why does Kafka restrict `max.in.flight.requests.per.connection` to a maximum of 5 when idempotency is enabled?
> Kafka brokers track sequence numbers per `(PID, Partition)` across a bounded sliding window of 5 in-flight requests. If more than 5 in-flight requests were permitted concurrently, an out-of-order sequence number could arrive outside the broker's tracking window, leading to unrecoverable `OutOfOrderSequenceException` errors.

---

## See Also

- [Producer Acknowledgements (`acks`)](./producer-acks.md)
- [Producer Transactions & 2PC](./producer-transactions.md)
- [Kafka Exactly-Once Semantics (EOS)](../advanced/exactly-once.md)
