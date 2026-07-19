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

# Kafka vs RabbitMQ: Streams vs Queues

**Apache Kafka** is a distributed log for stream storage and replay: records are retained durably and consumers pull at their own pace.  
**RabbitMQ** is a message broker implementing AMQP: messages are pushed to consumers and deleted once acknowledged.

The core difference is the **persistence model** — Kafka is a log you can re-read; RabbitMQ is a queue that empties as messages are consumed.

---

## Quick Comparison

| Dimension | Apache Kafka | RabbitMQ |
|-----------|-------------|----------|
| **Architecture** | Distributed append-only log | Message broker (AMQP / STOMP / MQTT) |
| **Delivery model** | Consumer pulls at own pace | Broker pushes to consumers |
| **Message retention** | Configurable (days, size, forever) | Deleted after acknowledgment |
| **Ordering** | Per-partition ordering guarantee | Per-queue (no cross-queue ordering) |
| **Replay** | ✅ Yes — reset consumer offset to any point | ❌ No — consumed messages are gone |
| **Routing** | Topic-based (producer specifies topic) | Exchange types: direct, fanout, topic, headers |
| **Consumer model** | Consumer groups (shared offset tracking) | Competing consumers on a queue |
| **Throughput** | Very high (millions of msg/sec per node) | High (tens of thousands/sec per queue) |
| **Protocol** | Kafka binary protocol | AMQP 0-9-1 (primary), STOMP, MQTT |
| **Language** | Scala/Java (JVM) | Erlang |
| **License** | Apache 2.0 | MPL 2.0 |
| **Best fit** | Event streaming, analytics, CDC, audit logs | Task queues, work distribution, RPC |

---

## Storage and Delivery Model

### Kafka: Durable Log

Kafka stores every message on disk **regardless of consumer state**. A message written at 9:00 AM is still readable at 9:00 PM (within the retention window). Consumers self-manage their read position (offset).

This makes Kafka suitable for:
- **Event sourcing**: replay history to rebuild state
- **Multiple independent consumers**: analytics, alerting, and replication all read the same topic independently
- **Audit logs**: immutable record of what happened and when
- **CDC pipelines**: retain change history with compaction for current state

### RabbitMQ: Transient Queue

Messages exist to be delivered and then removed once acknowledged. Queue depth is bounded by memory/disk limits, not a durability window.

RabbitMQ Streams (available since 3.9, via `rabbitmq_stream` plugin) add an append-only, non-destructive log closer to Kafka's model — but this is a separate protocol and not the default queue behavior.

RabbitMQ is suitable for:
- **Task queues**: distribute units of work to worker processes
- **RPC patterns**: request-reply with correlation IDs
- **Short-lived messages**: where post-delivery persistence adds no value

---

## Consumer Model

### Kafka Consumer Groups

Partitions are assigned to consumers in a group. Each partition is consumed by exactly **one consumer** within the group at a time; a consumer may own multiple partitions. Adding consumers scales throughput up to the partition count.

Multiple independent groups read the same topic **without interfering** — each group maintains its own independent offset.

```
Topic "orders" (6 partitions)
         │
         ├──► Group "order-service"     → processes orders
         ├──► Group "analytics-service" → aggregates metrics
         └──► Group "audit-logger"      → writes audit trail
```

### RabbitMQ Competing Consumers

Multiple consumers on the same queue share messages round-robin (one consumer per message). This is the classic work-queue pattern, but does **not** allow multiple independent consumers to each receive a copy of the same message.

To approximate Kafka's multi-group behavior in RabbitMQ, you need fanout exchanges routing copies to multiple queues — significant architectural overhead.

---

## Routing

**RabbitMQ** provides rich routing via exchange types:
- **Direct**: route by exact routing key
- **Fanout**: broadcast to all bound queues
- **Topic**: wildcard routing key patterns (`order.#`, `*.us-east`)
- **Headers**: route by message header attributes

**Kafka** routes by producer-specified **topic name**. Filtering within a topic requires consumer-side processing or stream processing frameworks (Kafka Streams, Flink). The simplicity is intentional — Kafka offloads routing logic to producers and consumers.

---

## Ordering

**Kafka**: Ordering guaranteed **within a partition**. Messages with the same key always go to the same partition (key-based routing), ensuring ordered delivery per entity (e.g., all events for user ID 123 are ordered). Cross-partition ordering is not guaranteed.

**RabbitMQ**: Ordering guaranteed within a **single queue with a single consumer**. With competing consumers, ordering is not preserved — a slow consumer can hold an unacked message while faster consumers process later messages.

---

## Throughput Comparison

```
Kafka:     millions of messages/sec per node (sequential I/O, batching, compression)
RabbitMQ:  tens of thousands of messages/sec per queue (push delivery, per-message ack)
```

**Kafka achieves higher aggregate throughput** due to partitioned design, sequential disk writes, and batching. **RabbitMQ achieves lower per-message latency** for small volumes because push delivery removes the pull polling cycle.

Under high load, **Kafka scales more predictably** — throughput scales horizontally by adding partitions. RabbitMQ performance degrades more as queue depth grows.

---

## Advantages and Disadvantages

### Kafka Advantages
- High throughput at scale — partitioned design allows horizontal scaling without coordination
- Durable replay — essential for event sourcing, CDC pipelines, and audit requirements
- Multiple independent consumer groups at no extra cost
- Native support for stream processing via Kafka Streams or Flink
- Exactly-once semantics via idempotent producers and transactions

### Kafka Disadvantages
- Higher operational complexity — partition management, consumer group rebalancing, offset tracking
- No built-in complex routing logic — routing must be in producers or external processors
- Messages cannot be selectively deleted (only log compaction per key)
- Not suitable as a task queue where you need exactly-one delivery without re-reads

### RabbitMQ Advantages
- Rich routing model (exchanges, binding keys) with minimal client code
- Lower latency for small message volumes — push delivery is faster for interactive workloads
- Message TTL, dead-letter queues, priority queues built-in
- Easier to reason about for point-to-point or worker-queue patterns
- Per-message acknowledgment and requeue semantics

### RabbitMQ Disadvantages
- Messages are lost after acknowledgment — no replay, no audit trail by default
- Queue depth is memory-bounded; large queues degrade performance
- Competing consumers don't scale as cleanly for high-throughput partitioned workloads
- No native stream processing integration

---

## Decision Guide

### Choose Kafka When:
- You need **replay**: a new service needs historical events without data loss
- You have **multiple independent consumers** of the same event stream
- You are building **CDC pipelines**, **event sourcing**, or **audit logging** — retention is mandatory
- You need **high throughput** (millions of messages/sec) with predictable horizontal scaling
- Your data stack uses tools that integrate natively with Kafka (Flink, Spark, Debezium, dbt)
- You need exactly-once semantics in a transactional pipeline

### Choose RabbitMQ When:
- You have a **task queue** pattern: distribute units of work to workers, acknowledge on completion
- You need **flexible routing** — topic exchanges with wildcard keys, header-based dispatch
- Your messages are **short-lived** and replay is not a requirement
- You need **per-message TTL** or **dead-letter exchange** routing out of the box
- Your stack is polyglot and needs AMQP, STOMP, or MQTT protocol support
- You are implementing **RPC or request-reply** patterns with correlation IDs

---

## Coexistence Pattern

Kafka and RabbitMQ often coexist in the same architecture — they solve different problems:

```
Kafka                           RabbitMQ
─────────────────────           ────────────────────
User activity events    ───►    Send welcome email
Transaction events      ───►    Resize uploaded image
CDC changelogs          ───►    Trigger approval workflow
Audit logs
```

**Kafka** carries high-volume event streams (user activity, transactions). **RabbitMQ** handles internal task distribution where acknowledgment semantics and per-message TTL matter.

The boundary is usually clear: if you need **replay or multiple consumers**, use Kafka; if you need **flexible task routing with acknowledgment semantics**, use RabbitMQ.

---

## Frequently Asked Questions

**Can RabbitMQ replace Kafka?**

For most event streaming use cases, no. RabbitMQ does not retain messages after consumption, so replay is not possible with standard queues. RabbitMQ Streams adds an append-only log, but lacks Kafka's ecosystem maturity.

**Can Kafka replace RabbitMQ?**

For task queues and RPC patterns, Kafka is a poor fit. Kafka has no built-in per-message acknowledgment with requeue, dead-letter semantics, or per-message TTL. Implementing a task queue on Kafka requires significant application-level logic.

**Which is faster — Kafka or RabbitMQ?**

Depends on the metric. Kafka achieves higher **aggregate throughput** (millions of messages/sec) due to batching and sequential I/O. RabbitMQ achieves lower **per-message latency** for small volumes because push delivery removes the poll cycle. Under high load, Kafka scales more predictably.

---

## Interview Questions

**Q: What is the fundamental architectural difference between Kafka and RabbitMQ?**

> Kafka is a distributed **append-only log** — messages are written to partitioned segments on disk and retained regardless of consumption. Consumers pull at their own pace and maintain their own read position (offset). RabbitMQ is a **message broker** (AMQP) — messages are pushed to consumers and deleted after acknowledgment. The core difference is that Kafka is a log you can re-read; RabbitMQ is a queue that empties as messages are consumed.

**Q: Why can RabbitMQ competing consumers break message ordering?**

> In RabbitMQ, multiple consumers share a queue in round-robin distribution. If Consumer A processes its message slowly (or nacks and requeues it), Consumer B may process a later message first — breaking FIFO order. Kafka avoids this because each partition is consumed by exactly one consumer within a group, guaranteeing ordering within each partition.

**Q: When would you choose RabbitMQ over Kafka?**

> RabbitMQ is preferred for: (1) task queue patterns where workers compete for jobs and acknowledge completion; (2) complex routing requirements using direct/fanout/topic/header exchanges; (3) short-lived messages where replay has no value; (4) per-message TTL and dead-letter queue routing out of the box; (5) RPC/request-reply patterns with correlation IDs; (6) polyglot stacks needing AMQP, STOMP, or MQTT protocols. If you're distributing work to workers and need acknowledgment semantics, RabbitMQ is the better fit.

---

## Related Topics

- [Kafka Overview](./kafka-overview.md) — Kafka architecture and core concepts
- [Consumer Groups](../consumer/consumer-group.md) — Kafka's consumer model in detail
- [Exactly-Once Semantics](../advanced/exactly-once.md) — Kafka transactional guarantees
- [Kafka Producers](../producer/producer-overview.md) — Producer configuration and delivery semantics

## Sources

1. [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
2. [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
3. [RabbitMQ Streams Plugin](https://www.rabbitmq.com/docs/streams)
4. Narkhede, N., Shapira, G., & Palino, T. — *Kafka: The Definitive Guide* (O'Reilly)
