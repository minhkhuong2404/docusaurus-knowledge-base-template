---
id: overview
title: Kafka Streams — Core Abstractions & Architecture
sidebar_label: 1. Overview & Core Abstractions
sidebar_position: 1
description: >
  A principal-level deep dive into Kafka Streams core concepts: mental model,
  KStream vs KTable vs GlobalKTable, duality of streams and tables, and stateless operations.
tags:
  - kafka
  - kafka-streams
  - stream-processing
  - kstream
  - ktable
---

import KafkaStreamsAbstractionsDiagram from '@site/src/components/KafkaStreamsAbstractionsDiagram';

# Kafka Streams — Core Abstractions & Architecture

> **Who this is for:** Senior engineers and architects seeking to master the core abstractions and mental models of Kafka Streams.

---

## 1. What Is Kafka Streams (Really)?

Most introductions say: *"Kafka Streams is a client library for stream processing."*

That is technically correct but hides the important architectural truth:

> **Kafka Streams is an embedded, fault-tolerant, stateful stream processing engine that runs inside your application process.**

No separate cluster to operate. No Spark master. No Flink job manager. No YARN. You import a library, write a topology, and your application *becomes* the stream processor. This architectural choice has deep implications for operations, scalability, and failure handling.

### Why This Architecture Matters

| Aspect | Implication |
|:---|:---|
| **No separate cluster** | Deploy as a standard microservice — same CI/CD, same Kubernetes manifests |
| **Scales with Kafka partitions** | Horizontal scale is built-in — add instances, partitions are redistributed |
| **State is local (RocksDB)** | Sub-millisecond state reads — no network hop for state access |
| **State is backed by Kafka** | State is durable, recoverable, and auditable without external databases |
| **Consumer group protocol** | Kafka's consumer group assignment handles instance discovery and failover |

### The Mental Model

```
Kafka Streams =
    Kafka Topic (Event Log — Source of Truth)
  + RocksDB     (Local State — Fast Key-Value Access)
  + Topology    (Processing Graph — Transformation Logic)

= Event Sourcing + CQRS + Materialized Views
  embedded inside your application
```

This is architecturally equivalent to: consume events from Kafka, apply transformations, maintain local state, produce output events back to Kafka — all within one library and one JVM process.

---

## 2. Core Abstractions

### KStream — Infinite Append-Only Log

A `KStream` represents an **unbounded sequence of independent events**. Every record is treated as a distinct fact. Records with the same key do not replace each other — they coexist as separate events in time.

```
KStream<String, OrderEvent>:

  key="user-123" value={orderId="1", total=99.99}   t=0s
  key="user-456" value={orderId="2", total=49.99}   t=1s
  key="user-123" value={orderId="3", total=149.99}  t=2s  <-- same key, separate event
  key="user-789" value={orderId="4", total=29.99}   t=3s
```

**Use for**: individual events — order placed, payment processed, click recorded, log line emitted. Any stream where each record has independent meaning regardless of what came before.

### KTable — Changelog View (Materialized State)

A `KTable` represents a **materialized view of a changelog stream**. Each new record for a key **replaces** the previous value — it tracks the latest known state per key. The underlying stream is still append-only; KTable adds update semantics on top.

```
KTable<String, AccountBalance>:

  key="user-123" value={balance=1000}   t=0s  <-- initial state
  key="user-123" value={balance=900}    t=1s  <-- replaces previous (debit $100)
  key="user-123" value={balance=1050}   t=2s  <-- replaces previous (credit $150)

  Current state of KTable: { "user-123": {balance=1050} }
  (previous values 1000 and 900 are no longer visible in queries)
```

**Use for**: entity state — user profiles, account balances, product inventory, feature flags. Any data where you care about the current value, not the history of changes.

### GlobalKTable — Replicated Reference Data

A `GlobalKTable` is a `KTable` that is fully replicated to **every application instance**, regardless of partition assignment. Unlike `KTable` (where each instance only has its assigned partitions), a `GlobalKTable` gives every instance access to the entire dataset.

```
KTable (partitioned):                GlobalKTable (replicated):
  Instance A: partitions [0, 1]        Instance A: ALL partitions
  Instance B: partitions [2, 3]        Instance B: ALL partitions (same)
  Instance C: partitions [4, 5]        Instance C: ALL partitions (same)

  join requires co-partitioning         join works without co-partitioning
```

**Use for**: reference data — product catalog, country codes, user tier config, rate limit settings. Data that is relatively small, changes infrequently, and needs to be joined against streams from any partition.

### The Dual Nature of Streams and Tables (Stream-Table Duality)

One of the foundational theorems of stream processing is the **Stream-Table Duality**:
- **A stream can be viewed as a table**: If you aggregate an unbounded stream over time, you build a stateful table (the current accumulation of all historical changes).
- **A table can be viewed as a stream**: If you capture every mutation (`INSERT`, `UPDATE`, `DELETE`) on a table, you generate an append-only changelog stream (CDC).

```
   Stream of Changes (Log) ──► AGGREGATE ──► Table of Current State
             ▲                                            │
             └─────────── toStream() (CDC) ───────────────┘
```

---

## 3. Decision Guide

<KafkaStreamsAbstractionsDiagram initialTab="kstream" />

| Question | KStream | KTable | GlobalKTable |
|:---|:---|:---|:---|
| Each record is an independent event? | ✅ | ❌ | ❌ |
| Each record replaces the previous for that key? | ❌ | ✅ | ✅ |
| Need to join without co-partitioning? | ❌ | ❌ | ✅ |
| Data fits comfortably in memory per instance? | N/A | No | ✅ Required |
| High write volume to the table? | N/A | ✅ | ❌ (replication cost) |

---

## 4. Stateless Stream Operations

These operations process each record independently — no state is maintained between records.

```java
KStream<String, Order> stream = builder.stream("orders", Consumed.with(Serdes.String(), orderSerde));

// Filter: keep only records matching predicate
KStream<String, Order> valid = stream
    .filter((key, order) -> order.getTotal().compareTo(BigDecimal.ZERO) > 0,
        Named.as("filter-positive-orders"));

// FilterNot: keep records NOT matching predicate
KStream<String, Order> nonCancelled = stream
    .filterNot((key, order) -> order.getStatus() == OrderStatus.CANCELLED,
        Named.as("filter-not-cancelled"));

// MapValues: transform value, preserve key (NO repartition — key unchanged)
KStream<String, OrderDto> dtos = stream
    .mapValues(order -> OrderDto.from(order), Named.as("map-to-dto"));

// Map: transform both key and value (TRIGGERS repartition if key changed)
KStream<String, Order> reKeyed = stream
    .map((key, order) -> KeyValue.pair(order.getCustomerId(), order),
        Named.as("rekey-by-customer"));
// ⚠️ Key changed -> repartition topic created -> extra Kafka round-trip

// SelectKey: change only the key (TRIGGERS repartition)
KStream<String, Order> byProduct = stream
    .selectKey((key, order) -> order.getProductId(),
        Named.as("select-product-key"));

// FlatMapValues: one record -> many records (value transform, no repartition)
KStream<String, OrderItem> items = stream
    .flatMapValues(order -> order.getItems(), Named.as("flatten-order-items"));

// Peek: side effect (logging, metrics) without transforming
KStream<String, Order> peeked = stream
    .peek((key, order) -> log.debug("Processing order: {}", key),
        Named.as("log-orders"));
```

:::tip[Performance Golden Rule: MapValues vs Map]
Always use `.mapValues()` and `.flatMapValues()` instead of `.map()` or `.flatMap()` whenever the record key remains unchanged. `.map()` automatically marks the stream as repartition-required, creating an internal topic and forcing unnecessary network and disk I/O.
:::
