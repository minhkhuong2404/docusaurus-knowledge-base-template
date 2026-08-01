---
id: kafka-vs-rabbitmq
title: Kafka vs RabbitMQ — Streams vs Queues
sidebar_label: Kafka vs RabbitMQ
description: Apache Kafka vs RabbitMQ compared across architecture, delivery model, retention, routing, ordering, throughput, and when to choose each. Includes coexistence patterns.
tags:
  - technical-knowledge
  - kafka
  - core
  - comparison
  - rabbitmq
---

import KafkaVsRabbitmqDiagram from '@site/src/components/KafkaVsRabbitmqDiagram';

# Kafka vs RabbitMQ: Streams vs Queues

<KafkaVsRabbitmqDiagram />

---

**Apache Kafka** is a distributed append-only log designed for high-throughput stream storage and replay: records are written durably to partition log segments and consumers pull at their own pace.  
**RabbitMQ** is a traditional message broker implementing AMQP: messages are pushed by the broker to competing workers and deleted immediately upon consumption acknowledgement.

---

## Architectural Comparison Matrix

| Architectural Feature | Apache Kafka | RabbitMQ |
|---|---|---|
| **Core Abstraction** | Distributed Append-Only Log | AMQP Message Broker (Exchanges & Queues) |
| **Delivery Model** | Consumer Pull (Polling via `poll()`) | Broker Push (Pushed directly to active workers) |
| **Data Retention** | Durable (retained by time/size or forever via compaction) | Transient (deleted immediately upon ACK acknowledgement) |
| **Message Replay** | ✅ Supported — reset consumer offset to any historical point | ❌ Unsupported — consumed messages are permanently deleted |
| **Message Routing** | Topic & Partition Key routing | AMQP Exchange routing (Direct, Fanout, Topic, Headers) |
| **Ordering Guarantees** | Strict per-partition ordering | Strict per-queue (broken by competing consumer workers) |
| **Scale Ceiling** | $1,000,000+$ msg/sec per broker cluster node | $\approx 20,000\text{--}50,000$ msg/sec per queue |
| **Primary Use Cases** | Event Streaming, Event Sourcing, Log Aggregation, CDC | Background Task Distribution, Complex AMQP Routing, RPC |

---

## Consumer Model & Scaling Mechanics

```
Kafka Partitioned Pull Model:
[ Topic Partition 0 ] ----> [ Consumer 1 (Group A) ]
[ Topic Partition 1 ] ----> [ Consumer 2 (Group A) ]
(Partition strictly assigned to 1 consumer per group -> Guarantees Order)

RabbitMQ Competing Consumer Push Model:
[ Queue ] --+----> [ Worker 1 ]  (Round-robin push)
            +----> [ Worker 2 ]  (If Worker 1 NACKs, Worker 2 processes out of order)
```

---

## Interview Questions

### Q1. What is the fundamental architectural difference between Kafka and RabbitMQ?
> Kafka is a distributed **append-only commit log** — messages are written to persistent partition segment files on disk and retained independently of consumer activity. Consumers manage their own read positions (offsets) and pull records asynchronously. RabbitMQ is an AMQP **message broker** — messages are pushed by the broker to active worker processes and deleted immediately upon receiving an acknowledgement. Kafka is an immutable log you can re-read; RabbitMQ is a queue that empties as work is processed.

### Q2. Why can competing consumers in RabbitMQ break message processing ordering?
> In RabbitMQ, multiple worker processes consume from the same queue via round-robin push distribution. If Worker 1 takes a long time to process Message 1 (or encounters a failure and returns a NACK to requeue it), Worker 2 will process Message 2 first, breaking FIFO processing order. Kafka avoids this because each topic partition is assigned to **exactly one consumer** instance within a consumer group, enforcing strict per-partition ordering.

### Q3. When should a team choose RabbitMQ over Apache Kafka?
> Choose RabbitMQ for: (1) **Complex Message Routing** — leveraging AMQP exchanges (Direct, Topic, Fanout, Headers); (2) **Per-Message TTL & Dead-Letter Routing** — managing individual task expirations and retry queues natively; (3) **Competing Task Queues** — distributing work to worker pools where post-delivery message replay is unnecessary; (4) **RPC & Request-Reply Patterns** — using native correlation IDs and reply-to headers.

---

## See Also

- [Kafka Overview](./kafka-overview.md)
- [Consumer Groups & Rebalancing](../consumer/consumer-group.md)
- [Exactly-Once Semantics](../advanced/exactly-once.md)
