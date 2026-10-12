---
id: topology-architecture
title: Kafka Streams — Topology Architecture & Execution Model
sidebar_label: 2. Topology & Execution
sidebar_position: 2
description: >
  Deep dive into Kafka Streams DAG compilation, branching with KafkaStreamBrancher.onTopOf,
  topology merging, execution tasks, threading model, scaling math, and rebalance storm runbooks.
tags:
  - kafka
  - kafka-streams
  - topology
  - execution-model
  - rebalance
---

import KafkaStreamsTopologyDiagram from '@site/src/components/KafkaStreamsTopologyDiagram';
import KafkaStreamsExecutionModelDiagram from '@site/src/components/KafkaStreamsExecutionModelDiagram';
import KafkaStreamsTopologyMigrationRunbookDiagram from '@site/src/components/KafkaStreamsTopologyMigrationRunbookDiagram';
import KafkaStreamsRebalanceStormDurationDiagram from '@site/src/components/KafkaStreamsRebalanceStormDurationDiagram';
import KafkaStreamsTopologyResilienceDiagram from '@site/src/components/KafkaStreamsTopologyResilienceDiagram';

# Kafka Streams — Topology Architecture & Execution Model

A **topology** is a directed acyclic graph (DAG) of processing nodes. Every Kafka Streams application is, at its core, a compiled topology definition executed by a managed pool of stream threads and tasks.

```
Source Nodes    ──►   Processor Nodes (transforms)   ──►   Sink Nodes
(read from            (filter, map, aggregate,             (write to
 Kafka topics)         join, branch, etc.)                  Kafka topics)
```

---

## 1. Topology Visualization

<KafkaStreamsTopologyDiagram initialTab="DSL_DAG" />

### Defining Topologies via High-Level DSL

```java
StreamsBuilder builder = new StreamsBuilder();

// Source node: read from Kafka topic
KStream<String, OrderEvent> rawOrders = builder.stream(
    "orders-raw",
    Consumed.with(Serdes.String(), orderSerde)
        .withOffsetResetPolicy(AutoOffsetReset.EARLIEST)
);

// GlobalKTable for reference data join
GlobalKTable<String, Product> products = builder.globalTable(
    "product-catalog",
    Consumed.with(Serdes.String(), productSerde),
    Materialized.<String, Product, KeyValueStore<Bytes, byte[]>>as("product-store")
        .withKeySerde(Serdes.String())
        .withValueSerde(productSerde)
);

// Transformation pipeline
KStream<String, EnrichedOrder> enriched = rawOrders
    .filter((key, order) -> order != null && order.isValid(),
        Named.as("filter-invalid-orders"))
    .join(
        products,
        (orderKey, order) -> order.getProductId(),
        (order, product) -> order.enrichWith(product),
        Named.as("join-product-catalog")
    );

// Build and inspect the topology
Topology topology = builder.build();
System.out.println(topology.describe()); // Always inspect in development
```

---

## 2. Stream Branching: `split()` vs Spring Kafka `KafkaStreamBrancher.onTopOf()`

Historically in Kafka Streams (< 2.8), splitting a stream used `stream.branch(Predicate...)`, which returned an untyped array `KStream<K, V>[]`. Developers had to access branches using brittle array indices like `branches[0]`, where adding or reordering predicates silently broke downstream processing.

### 1. Native Kafka Streams 2.8+ (`split()` and `Branched`)
Modern Kafka Streams provides a type-safe, fluent `split()` API that names branches and supports chained consumers:

```java
enriched.split(Named.as("orders-branch-"))
    .branch((k, v) -> v.isVip(),
        Branched.withConsumer(ks -> ks.to("vip-orders", Produced.with(Serdes.String(), orderSerde))))
    .branch((k, v) -> v.isFraudRisk(),
        Branched.withConsumer(ks -> ks.to("fraud-review", Produced.with(Serdes.String(), orderSerde))))
    .defaultBranch(
        Branched.withConsumer(ks -> ks.to("standard-orders", Produced.with(Serdes.String(), orderSerde))));
```

### 2. Spring Kafka `KafkaStreamBrancher.onTopOf(stream)`
In Spring Boot applications using `spring-kafka`, `org.springframework.kafka.support.KafkaStreamBrancher` provides an alternative builder pattern that defines branching rules upfront and attaches them onto an existing `KStream` via `.onTopOf(stream)`:

```java
KStream<String, Order> orderStream = builder.stream("orders-raw", Consumed.with(Serdes.String(), orderSerde));

new KafkaStreamBrancher<String, Order>()
    .branch((key, order) -> order.getTotal().compareTo(new BigDecimal("500")) >= 0,
        ks -> ks.to("vip-orders", Produced.with(Serdes.String(), orderSerde)))
    .branch((key, order) -> order.isFlaggedForReview(),
        ks -> ks.to("fraud-review-orders", Produced.with(Serdes.String(), orderSerde)))
    .defaultBranch(ks -> ks.to("standard-orders", Produced.with(Serdes.String(), orderSerde)))
    .onTopOf(orderStream); // Binds all branches onto the base stream and returns it
```

**How `.onTopOf(...)` Works Under the Hood:**
1. **Separation of Definition from Stream Instance**: You can define a reusable `KafkaStreamBrancher` bean or strategy object and apply it across multiple streams or in unit tests.
2. **Terminal vs Continuation Chain**: `.onTopOf(stream)` returns the original `orderStream`, allowing you to continue chaining downstream operators on the root stream if needed, while each branch lambda consumes its filtered slice.
3. **Execution Semantics**: Under the hood, `KafkaStreamBrancher` evaluates predicates sequentially in declaration order. The first predicate returning `true` routes the record; remaining predicates are skipped for that record.

---

## 3. Merging Streams (`stream.merge()`) vs Merging Topologies

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Stream-Level Merge: streamA.merge(streamB)                              │
│                                                                         │
│ Topic A ──► [ streamA ] ──┐                                             │
│                           ├──► [ merge() ] ──► [ combined KStream ]     │
│ Topic B ──► [ streamB ] ──┘                                             │
│ (Same Key & Value SerDes required; interweaves records in Stream-Time)  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Topology-Level Merging: Multiple Pipelines in One StreamsBuilder        │
│                                                                         │
│ Pipeline 1: Topic A ──► [ Process ] ──► Topic Out 1   (Sub-topology 0)  │
│ Pipeline 2: Topic B ──► [ Process ] ──► Topic Out 2   (Sub-topology 1)  │
│                                                                         │
│ Both registered in SAME StreamsBuilder ──► builder.build() = 1 Topology │
│ Managed by 1 KafkaStreams client and 1 Consumer Group (application.id)  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Merging Streams (`KStream.merge`)
`streamA.merge(streamB)` is a **stream-level union operator**. It combines records from two independent streams having the **exact same Key and Value types** into a single downstream `KStream`:

```java
KStream<String, ClickEvent> webClicks = builder.stream("clicks-web");
KStream<String, ClickEvent> mobileClicks = builder.stream("clicks-mobile");

// Merge creates a single logical stream downstream without an extra topic hop
KStream<String, ClickEvent> allClicks = webClicks.merge(mobileClicks, Named.as("merge-clicks"));
```

### 2. Merging Topologies in Spring Boot
In Spring Boot (`@EnableKafkaStreams`), declaring multiple `@Bean` methods that each take `StreamsBuilder` mutates the same shared `StreamsBuilder` instance. When `StreamsBuilderFactoryBean.start()` is called, it executes `builder.build()`, synthesizing all those independent beans into one single composite `Topology` object!

---

## 4. Why Topology Naming Is Critical for Production

<KafkaStreamsTopologyDiagram initialTab="NAMING_TRAP" />

Auto-generated internal names for operators, state stores, and repartition topics look like: `KSTREAM-FILTER-0000000002`. These names are used as:
- Kafka internal topic names: `app-id-KSTREAM-FILTER-0000000002-repartition`
- RocksDB state directory names: `/tmp/kafka-streams/KSTREAM-MAPVALUES-0000000003`
- Changelog topic names: `app-id-KSTREAM-AGGREGATE-STATE-STORE-0000000004-changelog`

**If you add, remove, or reorder any operator in the topology without explicit names**, all downstream auto-generated index counters shift. This causes:

```
Deployment without explicit naming:

  v1 topology:  FILTER-0002 ──► MAPVALUES-0003 ──► AGGREGATE-0004
  v2 topology:  FILTER-0002 ──► FILTER-0003 ──► MAPVALUES-0004 ──► AGGREGATE-0005
                              (added a second filter)

  On startup:
    AGGREGATE-0005 looks for changelog topic: "app-AGGREGATE-0005-changelog" ──► NOT FOUND
    ──► Creates new changelog topic
    ──► Full state rebuild from scratch (minutes to hours for large state)
    ──► Old changelog topic "app-AGGREGATE-0004-changelog" orphaned (wasting disk)
```

**Always enforce explicit naming:**
```java
rawOrders
    .filter((k, v) -> v.isValid(), Named.as("filter-valid-orders"))
    .mapValues(v -> v.normalize(), Named.as("normalize-order"))
    .groupByKey(Grouped.as("group-by-customer"))
    .aggregate(
        OrderSummary::new,
        (key, order, summary) -> summary.add(order),
        Named.as("aggregate-order-summary"),
        Materialized.<String, OrderSummary, KeyValueStore<Bytes, byte[]>>as("order-summary-store")
            .withKeySerde(Serdes.String())
            .withValueSerde(orderSummarySerde)
    );
```

---

## 5. Internal Execution Model: Tasks & Threads

### Tasks — The Unit of Parallelism

<KafkaStreamsExecutionModelDiagram initialMode="task_mapping" />

Kafka Streams divides a topology into **tasks**, one per source partition. Each task is an independent, isolated processing unit with its own consumer offset tracking, state store instance (RocksDB directory), and in-memory record buffer.

```
Topic "orders-raw" has 6 partitions:
  Partition 0 ──► Task 0_0
  Partition 1 ──► Task 0_1
  Partition 2 ──► Task 0_2
  Partition 3 ──► Task 0_3
  Partition 4 ──► Task 0_4
  Partition 5 ──► Task 0_5
```

### Stream Threads — Concurrency Within an Instance

Each application instance runs one or more **stream threads** (`num.stream.threads`). Each thread runs its own continuous event loop:
$$\text{poll}(100\text{ms}) \longrightarrow \text{process records} \longrightarrow \text{commit offsets}$$

---

## 6. Scaling & Sizing Math

$$\text{Max Active Tasks} = \sum_{s \in \text{Sub-topologies}} \left( \max_{t \in \text{SourceTopics}(s)} \text{Partitions}(t) \right)$$

- **Thread Sizing Rule of Thumb**: Allocate **1 Stream Thread per dedicated vCPU core**, up to the number of tasks assigned to that instance.
- **Thread Idling Trap**: If your cluster has 12 total tasks and you deploy 3 pods each configured with `num.stream.threads = 8` ($3 \times 8 = 24\text{ threads}$), exactly 12 threads will process tasks while the remaining 12 threads sit completely idle.
- **Instance Saturation Limit**: You cannot scale beyond the total task count. If total active tasks = 12, deploying 16 Kubernetes pods leaves 4 pods with 0 active tasks (idle unless hosting standby tasks).

---

## 7. Rebalancing Deep Dive: Cooperative Sticky Assignor

```
┌────────────────────────────────────────────────────────────────────────┐
│ Cooperative Sticky Rebalance (Modern Incremental Handoff):             │
│ Pod 1: [ Task 0 ] CONTINUES RUNNING ──► Only Task 1 revoked            │
│ Pod 2: [ Task 2 ] CONTINUES RUNNING ──► Only Task 3 revoked            │
│ Pod 3: (New instance joins) ──► Rebuilt state warm in background        │
│ ✅ Unaffected tasks NEVER stop processing; sub-second handoff!          │
└────────────────────────────────────────────────────────────────────────┘
```

The **Cooperative Sticky Assignor** uses incremental rebalancing:
1. **Incremental Revocation**: Only tasks migrating to another node are paused. All other tasks continue processing real-time events without interruption.
2. **Probing Rebalances (`probing.rebalance.interval.ms`)**: When a new instance joins, the assignor assigns existing active tasks to their current owners, but assigns warm **standby tasks** to the new instance. Every 10 minutes (configurable), a lightweight probing rebalance checks whether the standby task's changelog lag is within `acceptable.recovery.lag` (default 10,000 records). Once caught up, an instant sub-second hot swap occurs.

---

## 8. Sub-Topology Reordering Disaster & Production Migration Runbook

<KafkaStreamsTopologyDiagram initialTab="SUBTOPOLOGY_STORM" />

If you reorder sub-topologies during a rolling update, Task `0_0`'s topic assignment clashes between v1 and v2 pods, triggering an **infinite rebalance storm with zero records processed**:

<KafkaStreamsRebalanceStormDurationDiagram />

### Safe Production Migration Runbook

<KafkaStreamsTopologyMigrationRunbookDiagram initialStrategy="blue_green" />

1. **Strategy 1: Blue-Green / Application ID Versioning (Gold Standard)**: Increment `application.id` (e.g. `order-service-v2`), deploy alongside v1, wait for changelogs to catch up, switch downstream consumers, decommission v1.
2. **Strategy 2: Cold Maintenance Window & Application Reset**: Scale replicas to 0, run `kafka-streams-application-reset`, wipe local state, deploy v2.
3. **Strategy 3: Architectural Decoupling**: Split independent pipelines into separate microservices with isolated `application.id`s.
4. **Strategy 4: Append-Only Evolution**: Never delete or reorder sub-topologies at indices `0..N-1`. Append new pipelines only at the very end (index `N`), or replace decommissioned pipelines with a dummy no-op stub (`filter((k, v) -> false)`).

### Keeping Services Alive: Decoupled Probes

<KafkaStreamsTopologyResilienceDiagram />

- **Liveness Probe (`/health/live`)**: Checks JVM process health only (always returns `200 OK` while JVM is up).
- **Readiness Probe (`/health/ready`)**: Checks `kafkaStreams.state() == RUNNING` (returns `503 Service Unavailable` during rebalances so traffic is paused, but container is NEVER killed).
