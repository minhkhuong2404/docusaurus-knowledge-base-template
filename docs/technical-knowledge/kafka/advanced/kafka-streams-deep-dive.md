---
id: kafka-streams-deep-dive
title: Kafka Streams — Complete Deep Dive
sidebar_label: Kafka Streams Deep Dive
description: >
  A comprehensive guide to Kafka Streams: from core concepts and internal architecture
  to stateful processing, failure recovery, exactly-once semantics, windowing, joins,
  interactive queries, and production system design patterns.
tags:
  - kafka
  - kafka-streams
  - stream-processing
  - stateful-processing
  - rocksdb
  - exactly-once
  - advanced
---

import KafkaStreamsAbstractionsDiagram from '@site/src/components/KafkaStreamsAbstractionsDiagram';
import KafkaStreamsTopologyDiagram from '@site/src/components/KafkaStreamsTopologyDiagram';
import KafkaStreamsExecutionModelDiagram from '@site/src/components/KafkaStreamsExecutionModelDiagram';
import KafkaStreamsStateStoreDiagram from '@site/src/components/KafkaStreamsStateStoreDiagram';
import KafkaStreamsWindowJoinDiagram from '@site/src/components/KafkaStreamsWindowJoinDiagram';
import KafkaStreamsTopologyMigrationRunbookDiagram from '@site/src/components/KafkaStreamsTopologyMigrationRunbookDiagram';
import KafkaStreamsRebalanceStormDurationDiagram from '@site/src/components/KafkaStreamsRebalanceStormDurationDiagram';
import KafkaStreamsTopologyResilienceDiagram from '@site/src/components/KafkaStreamsTopologyResilienceDiagram';
import KafkaStreamsFailoverRecoveryDiagram from '@site/src/components/KafkaStreamsFailoverRecoveryDiagram';
import KafkaStreamsExactlyOnceDiagram from '@site/src/components/KafkaStreamsExactlyOnceDiagram';

# Kafka Streams — Complete Deep Dive

> **Who this is for:** Engineers who want to truly understand how Kafka Streams works — not just use the API, but reason about it in production, design systems with it, and answer hard senior interview questions confidently.

---

:::tip[Modular Knowledge Base Guides]
This master guide provides an end-to-end principal architectural reference. For targeted, modular deep dives, navigate directly to each focused guide:
- **[🌊 1. Overview & Core Abstractions](../streams/overview)**: Mental model, Stream-Table duality, KStream vs KTable vs GlobalKTable.
- **[⚡ 2. Topology Architecture & Execution](../streams/topology-architecture)**: DAG compilation, task sharding, Cooperative Sticky Assignor, sub-topology reorder storms.
- **[💾 3. State Stores, RocksDB & Restore](../streams/state-stores-rocksdb)**: Off-heap memory bounding, cgroup OOMs, changelog compaction, `.checkpoint` recovery.
- **[🪟 4. Windowing, Joins & Suppress](../streams/windowing-joins)**: Tumbling/hopping/sliding/session windows, `suppress()` stream-time trap, co-partitioning contract.
- **[⚙️ 5. Processor API, DLQ & Deduplication](../streams/processor-api-dlq)**: PAPI 3.x+, Wall-Clock vs Stream-Time Punctuators, WindowStore deduplication, custom DLQ handler, async anti-pattern.
- **[🍃 6. Spring Boot Integration](../streams/spring-boot)**: `spring-kafka` vs Spring Cloud Stream, multi-bean topology synthesis, branching with `split()` / `onTopOf()`, safe Interactive Queries.
- **[📋 7. Production Runbook, Testing & Anti-Patterns](../streams/production-runbook)**: `TopologyTestDriver`, JMX monitoring metrics, 7 fatal anti-patterns, 5-way streaming comparison matrix.
- **[🎯 8. Senior & Staff Interview Questions](../streams/interview-questions)**: 15 deep architectural interview questions, failure recovery scenarios, and The Four Golden Rules.
:::

---

## 1. What Is Kafka Streams (Really)?

Most introductions say: *"Kafka Streams is a client library for stream processing."*

That is technically correct but hides the important truth:

> **Kafka Streams is an embedded, fault-tolerant, stateful stream processing engine that runs inside your application process.**

No separate cluster to operate. No Spark master. No Flink job manager. No YARN. You import a library, write a topology, and your application *becomes* the stream processor. This architectural choice has deep implications for operations, scalability, and failure handling.

### Why This Architecture Matters

| Aspect | Implication |
|:---|:---|
| No separate cluster | Deploy as a standard microservice — same CI/CD, same Kubernetes manifests |
| Scales with Kafka partitions | Horizontal scale is built-in — add instances, partitions are redistributed |
| State is local (RocksDB) | Sub-millisecond state reads — no network hop for state access |
| State is backed by Kafka | State is durable, recoverable, and auditable without external databases |
| Consumer group protocol | Kafka's consumer group assignment handles instance discovery and failover |

### The Mental Model

```
Kafka Streams =
    Kafka Topic (Event Log — Source of Truth)
  + RocksDB    (Local State — Fast Key-Value Access)
  + Topology   (Processing Graph — Transformation Logic)

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
  key="user-123" value={orderId="3", total=149.99}  t=2s  ← same key, separate event
  key="user-789" value={orderId="4", total=29.99}   t=3s
```

**Use for**: individual events — order placed, payment processed, click recorded, log line emitted. Any stream where each record has independent meaning regardless of what came before.

### KTable — Changelog View (Materialized State)

A `KTable` represents a **materialized view of a changelog stream**. Each new record for a key **replaces** the previous value — it tracks the latest known state per key. The underlying stream is still append-only; KTable adds update semantics on top.

```
KTable<String, AccountBalance>:

  key="user-123" value={balance=1000}   t=0s  ← initial state
  key="user-123" value={balance=900}    t=1s  ← replaces previous (debit $100)
  key="user-123" value={balance=1050}   t=2s  ← replaces previous (credit $150)

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

### KStream vs KTable vs GlobalKTable — Decision Guide

<KafkaStreamsAbstractionsDiagram initialTab="kstream" />

| Question | KStream | KTable | GlobalKTable |
|:---|:---|:---|:---|
| Each record is an independent event? | ✅ | ❌ | ❌ |
| Each record replaces the previous for that key? | ❌ | ✅ | ✅ |
| Need to join without co-partitioning? | ❌ | ❌ | ✅ |
| Data fits comfortably in memory per instance? | N/A | No | ✅ Required |
| High write volume to the table? | N/A | ✅ | ❌ (replication cost) |

---

## 3. Topology — The Processing Graph

A **topology** is a directed acyclic graph (DAG) of processing nodes. Every Kafka Streams application is, at its core, a topology definition.

```
Source Nodes    →    Processor Nodes (transforms)    →    Sink Nodes
(read from           (filter, map, aggregate,              (write to
 Kafka topics)        join, branch, etc.)                   Kafka topics)
```

### Topology Visualization

<KafkaStreamsTopologyDiagram initialTab="DSL_DAG" />

### Topology Definition (DSL + Processor API)

```java
StreamsBuilder builder = new StreamsBuilder();

// Source: read from topic
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
        (orderKey, order) -> order.getProductId(),   // key extractor from the stream record
        (order, product) -> order.enrichWith(product),
        Named.as("join-product-catalog")
    );

// Branch into two output streams
Map<String, KStream<String, EnrichedOrder>> branches = enriched.split(Named.as("order-tier-split"))
    .branch((key, order) -> order.getTotal().compareTo(new BigDecimal("500")) >= 0,
        Branched.as("high-value"))
    .defaultBranch(Branched.as("standard"));

// Sink nodes
branches.get("order-tier-split-high-value").to("vip-orders",
    Produced.with(Serdes.String(), enrichedOrderSerde));
branches.get("order-tier-split-standard").to("standard-orders",
    Produced.with(Serdes.String(), enrichedOrderSerde));

// Build and inspect the topology
Topology topology = builder.build();
System.out.println(topology.describe());  // Always inspect in development
```

### Stream Branching: Native `split()` vs Spring Kafka `KafkaStreamBrancher.onTopOf()`

Historically in Kafka Streams (< 2.8), splitting a stream used `stream.branch(Predicate...)`, which returned an untyped array `KStream<K, V>[]`. Developers had to access branches using brittle array indices like `branches[0]`, where adding or reordering predicates silently broke downstream processing.

#### 1. Native Kafka Streams 2.8+ (`split()` and `Branched`)
Modern Kafka Streams provides a type-safe, fluent `split()` API that names branches and supports chained consumers:

```java
// Native split with direct consumer routing:
enriched.split(Named.as("orders-branch-"))
    .branch((k, v) -> v.isVip(),
        Branched.withConsumer(ks -> ks.to("vip-orders", Produced.with(Serdes.String(), orderSerde))))
    .branch((k, v) -> v.isFraudRisk(),
        Branched.withConsumer(ks -> ks.to("fraud-review", Produced.with(Serdes.String(), orderSerde))))
    .defaultBranch(
        Branched.withConsumer(ks -> ks.to("standard-orders", Produced.with(Serdes.String(), orderSerde))));
```

#### 2. Spring Kafka `KafkaStreamBrancher.onTopOf(stream)`
In Spring Boot ecosystems using `spring-kafka`, `org.springframework.kafka.support.KafkaStreamBrancher` provides an alternative builder pattern that defines branching rules upfront and attaches them onto an existing `KStream` via `.onTopOf(stream)`:

```java
// Spring Kafka fluent brancher definition
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

### Merging Streams (`stream.merge()`) vs Merging Topologies

A frequent source of design ambiguity in Kafka Streams is the difference between **merging stream records** and **merging topology graphs**.

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

#### 1. Merging Streams (`KStream.merge`)
`streamA.merge(streamB)` is a **stream-level union operator**. It combines records from two independent streams having the **exact same Key and Value types** into a single downstream `KStream`:

```java
KStream<String, ClickEvent> webClicks = builder.stream("clicks-web");
KStream<String, ClickEvent> mobileClicks = builder.stream("clicks-mobile");

// Merge creates a single logical stream downstream
KStream<String, ClickEvent> allClicks = webClicks.merge(mobileClicks, Named.as("merge-clicks"));

allClicks
    .groupByKey(Grouped.as("group-clicks-by-user"))
    .count(Materialized.as("user-click-counts"))
    .toStream()
    .to("clicks-aggregated");
```

**Under-the-Hood Mechanics of `merge()`:**
- **No Kafka Broker Hop**: Records are NOT written to an intermediate repartition topic. The downstream processor simply accepts inputs from both upstream nodes.
- **Timestamp Ordering (Stream-Time)**: If the streams originate from different topics, Kafka Streams' partition synchronization logic processes records based on the lowest timestamp among available buffered records to maintain deterministic stream-time ordering.
- **Co-Partitioning Invariant**: If you perform a key-based stateful operation (like `groupByKey()` or `join()`) immediately after `merge()`, both upstream topics **must** be co-partitioned (same partition count and partitioner). If partition counts differ, Kafka Streams automatically injects an internal repartition topic.

#### 2. Merging Topologies in Spring Boot
In Spring Boot (`@EnableKafkaStreams`), you often have separate business domains (e.g. Orders, Payments, Inventory). You can write distinct `@Bean` configuration methods that each inject `StreamsBuilder`:

```java
@Configuration
@EnableKafkaStreams
public class OrderStreamConfiguration {

    @Bean
    public KStream<String, Order> orderPipeline(StreamsBuilder builder) {
        KStream<String, Order> orders = builder.stream("orders-raw", Consumed.with(Serdes.String(), orderSerde));
        orders.filter((k, v) -> v.isValid(), Named.as("filter-orders"))
              .to("orders-valid", Produced.with(Serdes.String(), orderSerde));
        return orders;
    }
}

@Configuration
public class PaymentStreamConfiguration {

    @Bean
    public KStream<String, Payment> paymentPipeline(StreamsBuilder builder) {
        KStream<String, Payment> payments = builder.stream("payments-raw", Consumed.with(Serdes.String(), paymentSerde));
        payments.filter((k, v) -> v.isSuccess(), Named.as("filter-payments"))
                .to("payments-processed", Produced.with(Serdes.String(), paymentSerde));
        return payments;
    }
}
```

**How Spring Combines These Beans into One Topology:**
1. **Single Shared `StreamsBuilder`**: Spring's `StreamsBuilderFactoryBean` creates a single instance of `StreamsBuilder`.
2. **Sequential Bean Execution**: As Spring instantiates `@Bean` methods, each method adds nodes to the **same underlying `StreamsBuilder`**.
3. **Single Topology Compilation**: When the Spring Application Context finishes loading, `StreamsBuilderFactoryBean.start()` calls `builder.build()`. This compiles both `orderPipeline` and `paymentPipeline` into a **single, composite `Topology` object**.
4. **Sub-Topology Segmentation**: Because `orders-raw` and `payments-raw` share no source or sink connections, Kafka Streams automatically splits them into independent **Sub-topology 0** and **Sub-topology 1**.

:::warning[Architectural Trade-Off: Shared vs Isolated Topologies]
Merging all pipelines into one `StreamsBuilder` shares the same `KafkaStreams` client, the same thread pool (`num.stream.threads`), and the same `application.id`.
- **Downside**: If `PaymentStream` crashes due to an uncaught exception, or triggers a rebalance due to a heavy lag, `OrderStream` is also paused!
- **Best Practice for Critical Services**: If domains require fault isolation, configure separate `StreamsBuilderFactoryBean` beans with dedicated `application.id`s and thread pools (see Section 3.4 Multi-Engine JVM Isolation).
:::

### Why Topology Naming Is Critical for Production

<KafkaStreamsTopologyDiagram initialTab="NAMING_TRAP" />

Auto-generated internal names for operators, state stores, and repartition topics look like: `KSTREAM-FILTER-0000000002`. These names are used as:
- Kafka internal topic names: `app-id-KSTREAM-FILTER-0000000002-repartition`
- RocksDB state directory names: `/tmp/kafka-streams/KSTREAM-MAPVALUES-0000000003`
- Changelog topic names: `app-id-KSTREAM-AGGREGATE-STATE-STORE-0000000004-changelog`

**If you add, remove, or reorder any operator in the topology**, all downstream auto-generated names shift. This causes:

```
Deployment without explicit naming:

  v1 topology:  FILTER-0002 → MAPVALUES-0003 → AGGREGATE-0004
  v2 topology:  FILTER-0002 → FILTER-0003 → MAPVALUES-0004 → AGGREGATE-0005
                              (added a second filter)

  On startup:
    AGGREGATE-0005 looks for changelog topic: "app-AGGREGATE-0005-changelog" → NOT FOUND
    → Creates new changelog topic
    → Full state rebuild from scratch (minutes to hours for large state)
    → Old changelog topic "app-AGGREGATE-0004-changelog" orphaned (wasting disk)

  During rolling deploy:
    v1 instance expects task structure A
    v2 instance expects task structure B
    → Rebalance loop: coordinators cannot reconcile incompatible task maps
    → Continuous rebalancing, no processing
```

**Always use explicit names:**

```java
// ✅ Explicit naming — topology is stable across code changes
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

### The Sub-Topology Reordering Disaster (Rebalance Storms & Zero Processing)

<KafkaStreamsTopologyDiagram initialTab="SUBTOPOLOGY_STORM" />

A **Sub-topology** is an independent connected component of processors in your topology. If your application defines multiple independent pipelines in the same `StreamsBuilder` (e.g. consuming from `orders-raw` and `payments-raw` independently), Kafka Streams compiles them into separate sub-topologies numbered sequentially (`0, 1, 2, ...`):

#### Why Reordering Causes an Infinite Rebalance Storm During Rolling Updates

When rolling out `v2` across a cluster of pods:

1. **The Incompatible Assignment**:
   - The cluster is in a mixed state where Pod 1 runs `v2` and Pod 2 runs `v1`.
   - Both pods join the same Consumer Group (`application.id`).
   - If the group leader elected by the broker is running `v2`, it computes partition assignments according to `v2`'s topology map: **Task `0_0` is assigned `payments-raw-0`**.
2. **Topology Semantic Validation Collision**:
   - The leader sends this assignment to Pod 2 (running `v1`).
   - In Pod 2's local topology, **Task `0_0` is hardwired to process `orders-raw-0`**.
   - Pod 2 receives partitions for `payments-raw-0`, detects a fatal metadata mismatch, and throws `TaskAssignmentException: Task 0_0 assigned unexpected topic-partition` (or crashes).
3. **The Infinite Rebalance Loop (Zero Records Processed)**:
   - The crashing or rejecting pod leaves the group or requests immediate reassignment (`requestTaskReassignment`).
   - The group coordinator broker stops stream processing and triggers a cluster-wide rebalance.
   - All stream threads are forced into the `REBALANCING` state. Partitions are revoked across all pods.
   - The assignor runs again, creates another incompatible assignment for mixed instances, and triggers another rebalance immediately.
   - **Result**: Streams threads never reach the `RUNNING` state. No consumer offsets advance, and throughput drops to absolute zero.

#### How Long Does the Rebalance Storm Last?

<KafkaStreamsRebalanceStormDurationDiagram />

The rebalance storm lasts **for the ENTIRE duration of the rolling deployment** — from the moment the **first `v2` pod starts** until the **very last `v1` pod is fully terminated and deregistered from the consumer group**:

$$\text{Rebalance Storm Duration} = T_{\text{rolling\_update}} \approx \left(\frac{N_{\text{pods}}}{\text{maxUnavailable}}\right) \times (T_{\text{start}} + T_{\text{readiness}} + T_{\text{termination\_grace}})$$

- **Does it depend on the number of pods?** **Yes, directly.** 20 pods take $4\times$ longer to roll than 5 pods. If `maxUnavailable: 1` replaces pods one by one at 30s per pod, a 20-pod cluster experiences **10 full minutes of zero message processing**.
- **What happens when ALL old pods are terminated?**
  1. **Rebalance Storm STOPS**: Once 100% of active group members run `v2`, all pods agree on `v2` task assignments. No member throws `TaskAssignmentException` or leaves the group.
  2. **State Restoration Wall BEGINS**: Because local `/0_0/` disk directories contain old state, `v2` tasks must replay the new changelog topics from Kafka brokers. Stream threads enter `RESTORING` state for another **5–20 minutes** before real-time processing resumes.

#### Secondary Disaster: Local Disk & RocksDB State Store Corruption

Even if you execute a cold restart (shutting down all pods before launching `v2`):
- Local RocksDB state directories are keyed by `/<subTopologyId>_<partitionId>/<storeName>` (e.g. `/0_0/order-store/`).
- If sub-topologies are reordered without clearing disk volumes, Task `0_0` (now Payments) opens the old Orders RocksDB SSTables, resulting in deserialization crashes or state corruption.
- Auto-generated changelog topics (`KSTREAM-AGGREGATE-STATE-STORE-000000000X-changelog`) shift their index counter, causing tasks to restore from the wrong topic.

:::danger[Production Deployment Rule]
- **Never change sub-topology declaration order or insert new sub-topologies during a rolling update.**
- If sub-topologies must be reordered or restructured: perform an offline migration (scale old deployment to 0, wipe local state or change `application.id`, then deploy the new version).
:::

#### Safe Runbook: How to Clean Up, Remove, or Reorder Topologies in Production

<KafkaStreamsTopologyMigrationRunbookDiagram initialStrategy="blue_green" />

When business requirements demand deleting an obsolete sub-topology, cleaning up deprecated state stores, or restructuring your pipeline, use one of the following four proven production strategies:

---

##### Strategy 1: Blue-Green / Application ID Versioning (Zero Downtime — Gold Standard)

The safest, zero-downtime way to clean up or reorder sub-topologies is to treat the change as a new versioned stream application:

1. **Increment `application.id`**:
   ```java
   // v1 was "order-enrichment-service-v1"
   props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-enrichment-service-v2");
   ```
2. **Deploy `v2` Alongside `v1`**:
   - `v2` creates a brand-new consumer group and provisions its own independent RocksDB state stores and changelog topics (e.g. `order-enrichment-service-v2-agg-store-changelog`).
   - `v1` continues serving live production traffic without interruption.
3. **Wait for State Catch-Up**:
   - Monitor consumer lag on `v2` until it catches up to real-time (`lag ≈ 0`).
4. **Switch Traffic & Decommission `v1`**:
   - Switch downstream consumers or API routing to read from `v2`'s output topics.
   - Scale `v1` instances to `0`.
5. **Purge Orphaned `v1` Kafka Topics**:
   ```bash
   # List and delete obsolete internal topics created by v1
   kafka-topics.sh --bootstrap-server localhost:9092 --list | grep "order-enrichment-service-v1"
   kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic "order-enrichment-service-v1-*-changelog"
   kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic "order-enrichment-service-v1-*-repartition"
   ```

---

##### Strategy 2: Cold Maintenance Window & Application Reset (Same `application.id`)

If you must reuse the same `application.id` and can take a brief maintenance window:

1. **Step 1: Stop All Instances Completely (Scale to 0)**:
   ```bash
   kubectl scale deployment order-enrichment-service --replicas=0
   # Verify that all pods are terminated and consumer group state is DEAD or EMPTY
   kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group order-enrichment-service
   ```
2. **Step 2: Run the Kafka Streams Application Reset Tool**:
   ```bash
   kafka-streams-application-reset \
     --bootstrap-servers localhost:9092 \
     --application-id order-enrichment-service \
     --input-topics orders-raw,payments-raw \
     --intermediate-topics order-enrichment-service-repartition-topic
   ```
   *What this does*: Cleans up internal repartition topics and resets input topic offsets to prevent rebalance conflicts.
3. **Step 3: Delete Obsolete / Deleted Changelog Topics**:
   ```bash
   # Delete changelogs corresponding to removed state stores
   kafka-topics.sh --bootstrap-server localhost:9092 --delete \
     --topic order-enrichment-service-deprecated-store-changelog
   ```
4. **Step 4: Wipe Local RocksDB Disk State on All Nodes**:
   ```bash
   # If using Kubernetes with PersistentVolumeClaims (PVCs) or HostPaths:
   # Delete the PVCs or clear the local state directory before restarting
   rm -rf /var/data/kafka-streams/order-enrichment-service/*
   ```
5. **Step 5: Deploy and Start `v2`**:
   ```bash
   kubectl scale deployment order-enrichment-service --replicas=3
   ```
   *Result*: Clean sub-topology mapping is initialized, Task `0_0` maps cleanly, and state is restored from scratch without metadata collisions.

---

##### Strategy 3: Architectural Decoupling (Split Independent Pipelines into Separate Apps)

If sub-topologies are conceptually independent (e.g. an **Orders Pipeline** and a **Payments Pipeline**), keeping them in the same `StreamsBuilder` is an architectural anti-pattern. They share the same consumer group and force rebalance storms on each other.

**Best Practice**: Separate them into two distinct microservices with their own `application.id`:

```java
// Microservice A: OrderEnrichmentApp.java
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-enrichment-app");
StreamsBuilder ordersBuilder = new StreamsBuilder();
// Only defines orders sub-topology...

// Microservice B: PaymentEnrichmentApp.java
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "payment-enrichment-app");
StreamsBuilder paymentsBuilder = new StreamsBuilder();
// Only defines payments sub-topology...
```

*Benefits*:
- Independent scaling (scale payments pods without scaling orders pods).
- Independent deployments (reordering or refactoring orders topology never affects payments).
- Isolated failure domains.

---

##### Strategy 4: Append-Only Topology Evolution (For Safe Rolling Updates)

If you must deploy via rolling updates without downtime or `application.id` changes:

- **Rule 1: Never delete or reorder sub-topologies at indices `0..N-1`**: Always keep existing sub-topologies in their exact original declaration order in `StreamsBuilder`.
- **Rule 2: Append new pipelines only at the bottom**: Always add newly introduced sub-topologies at the very end of your `StreamsBuilder` method (index `N`), so existing sub-topology indices `0, 1, ...` remain completely untouched.
- **Rule 3: Replace Decommissioned Pipelines with a Dummy No-Op Stub**:
  If you want to retire Sub-topology 0 while keeping Sub-topology 1 in place:
  ```java
  // ⚠️ Retain Sub-topology 0 slot to prevent index shift for Sub-topology 1
  builder.stream("deprecated-orders-topic", Consumed.with(Serdes.String(), Serdes.String()))
      .filter((k, v) -> false); // No-op discard stub
  
  // Sub-topology 1 remains stable at index 1!
  builder.stream("payments-raw", ...);
  ```

---

#### How to Keep Services Alive During Topology Mismatches & Rebalances

When a topology mismatch or assignment collision occurs (e.g. during rolling updates, accidental sub-topology reordering, or schema mismatch), standard Java streams applications can easily enter an **uncontrolled CrashLoopBackOff**, taking down the entire service container.

Use the following three architectural guardrails to prevent crashes and ensure graceful degradation:

<KafkaStreamsTopologyResilienceDiagram />

---

##### 1. Decouple Kubernetes Liveness vs. Readiness Probes (The Golden Rule)

The #1 root cause of cluster death during rolling updates is an improperly configured Kubernetes Liveness probe:

- **❌ Anti-Pattern (Coupled Probe)**: Pointing the Liveness probe at `kafkaStreams.state() == RUNNING`. During a rebalance storm or partition validation clash, the state is `REBALANCING` or `ERROR`. Kubernetes fails the liveness check and sends `SIGKILL` to the pod. The restarted pod rejoins and triggers *another* rebalance, locking the entire cluster in an infinite CrashLoopBackOff!
- **✅ Best Practice (Decoupled Probes)**:
  - **Liveness Probe (`/health/live`)**: Checks JVM process health and memory only (always returns `200 OK` while the JVM is up).
  - **Readiness Probe (`/health/ready`)**: Checks `kafkaStreams.state() == RUNNING` (returns `503 Service Unavailable` during rebalances).

```java
@Component
public class KafkaStreamsHealthIndicator implements HealthIndicator {
    private final KafkaStreams kafkaStreams;

    public KafkaStreamsHealthIndicator(KafkaStreams kafkaStreams) {
        this.kafkaStreams = kafkaStreams;
    }

    @Override
    public Health health() {
        KafkaStreams.State state = kafkaStreams.state();
        
        // Readiness logic: Stops external HTTP traffic during rebalance, but NEVER kills container
        if (state == KafkaStreams.State.RUNNING) {
            return Health.up().withDetail("state", state).build();
        } else if (state == KafkaStreams.State.REBALANCING) {
            return Health.status("REBALANCING").withDetail("state", state).build();
        } else {
            return Health.down().withDetail("state", state).build();
        }
    }
}
```

---

##### 2. Intercept Errors via `StreamsUncaughtExceptionHandler` (KIP-663)

By default, an uncaught topology exception kills the `StreamThread`. When all stream threads die, the `KafkaStreams` instance terminates.

Use `setUncaughtExceptionHandler` to catch topology and partition assignment errors explicitly:

```java
kafkaStreams.setUncaughtExceptionHandler(throwable -> {
    log.error("💥 Uncaught exception in Kafka Streams thread: ", throwable);

    // If it's a topology or partition assignment mismatch during a rolling rollout:
    if (isTopologyMismatch(throwable)) {
        log.warn("⚠️ Topology mismatch detected. Retrying thread to allow rolling upgrade to finish...");
        // Spawns a fresh thread to rejoin group gracefully
        return StreamThreadExceptionResponse.REPLACE_THREAD;
    }

    // Default safety behavior: replace crashed thread
    return StreamThreadExceptionResponse.REPLACE_THREAD;
});

private boolean isTopologyMismatch(Throwable throwable) {
    String msg = throwable.getMessage();
    return msg != null && (
        msg.contains("TaskAssignmentException") ||
        msg.contains("unexpected topic-partition") ||
        msg.contains("Missing source topic")
    );
}
```

---

##### 3. Multi-Engine JVM Isolation (Independent `KafkaStreams` Objects)

If a service handles multiple sub-topologies (e.g. Orders and Payments), do not merge them into a single `StreamsBuilder`. Instead, instantiate **two independent `KafkaStreams` instances** within the same Spring Boot / JVM application:

```java
@Configuration
public class MultiStreamEngineConfig {

    @Bean(name = "orderStreams")
    public KafkaStreams orderStreams(StreamsBuilder ordersBuilder) {
        // App ID: "order-enrichment-service"
        KafkaStreams streams = new KafkaStreams(ordersBuilder.build(), orderProps);
        streams.start();
        return streams;
    }

    @Bean(name = "paymentStreams")
    public KafkaStreams paymentStreams(StreamsBuilder paymentsBuilder) {
        // App ID: "payment-processing-service"
        KafkaStreams streams = new KafkaStreams(paymentsBuilder.build(), paymentProps);
        streams.start();
        return streams;
    }
}
```

* **Blast Radius Isolation**: A failure, rebalance storm, or topology mismatch in `orderStreams` leaves `paymentStreams` and your HTTP REST API controllers **100% online and healthy**.

---

## 4. Internal Execution Model

### Tasks — The Unit of Parallelism

<KafkaStreamsExecutionModelDiagram initialMode="task_mapping" />

Kafka Streams divides a topology into **tasks**, one per source partition. Each task is an independent, isolated processing unit with its own:
- Consumer offset tracking
- State store instance (its own RocksDB directory)
- In-memory record buffer

```
Topic "orders-raw" has 6 partitions:
  Partition 0 → Task 0
  Partition 1 → Task 1
  Partition 2 → Task 2
  Partition 3 → Task 3
  Partition 4 → Task 4
  Partition 5 → Task 5

With 3 application instances (2 stream threads each, 2 tasks per thread):
  Instance A: Tasks [0, 1, 2]   (active)
  Instance B: Tasks [3, 4]      (active)
  Instance C: Task  [5]         (active)
```

**Maximum parallelism = number of source partitions.** Adding a 4th instance when you only have 3 partitions results in the 4th instance having no tasks — it sits idle. To scale beyond current parallelism, you must increase partition count.

### Stream Threads — Concurrency Within an Instance

Each application instance can run multiple **stream threads**. Each thread manages a subset of tasks and runs its own event loop — poll from Kafka → process records → commit offsets. Threads within one instance share no mutable state (each task is assigned to exactly one thread).

```java
Properties props = new Properties();
props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 4);
// This instance will run 4 independent stream threads
// Each thread manages its own tasks and state stores
```

```
Instance A with 4 stream threads:
  Thread 1: Tasks [0, 1]  → their own RocksDB dirs
  Thread 2: Tasks [2, 3]  → their own RocksDB dirs
  Thread 3: Tasks [4, 5]  → their own RocksDB dirs
  Thread 4: Tasks [6]     → own RocksDB dir

Total tasks per instance = NUM_STREAM_THREADS × (partitions / instances)
```

### The Record Processing Loop

<KafkaStreamsExecutionModelDiagram initialMode="event_loop" />

```
For each stream thread, the event loop runs continuously:

1. poll(100ms) → fetch records from Kafka for all assigned partitions
2. For each fetched record:
   a. Deserialize key and value
   b. Route through topology nodes (filter → transform → state store → produce)
   c. Write output records to producer buffer (not yet sent)
3. Commit if commit.interval.ms elapsed:
   a. Flush in-memory write cache to RocksDB
   b. Flush RocksDB to disk (sync)
   c. Flush producer buffer → send output records to Kafka
   d. Commit consumer offsets to Kafka
   (Steps a-d are atomic with exactly_once_v2)
4. Repeat
```

### Configuration Reference

```java
Properties props = new Properties();

// Required
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-processing-app");
// Application ID = consumer group ID = prefix for all internal topics
// Changing this creates a brand-new application with new consumer offsets

props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092,broker2:9092");

// Parallelism
props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 4);

// State store location
props.put(StreamsConfig.STATE_DIR_CONFIG, "/var/kafka-streams/state");
// Use fast NVMe SSDs — state store I/O is on the critical path

// Commit interval (how often to flush + commit)
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);
// Lower = less data re-processed on crash; higher = better throughput

// Exactly-once semantics
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

// Cache size (in-memory write buffer before hitting RocksDB)
props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 50 * 1024 * 1024L); // 50MB
// Higher = fewer RocksDB writes = better throughput; lower = more frequent downstream emission

// Standby replicas (shadow state for fast failover)
props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
```

### Scaling & Sizing: Partition-to-Task Math & Pod Allocation

Scaling a Kafka Streams application requires understanding how tasks map to hardware cores and Kubernetes pods:

#### 1. Maximum Parallelism Formula
Kafka Streams parallelism is strictly bounded by the partition count of its input topics:

$$\text{Max Active Tasks} = \sum_{s \in \text{Sub-topologies}} \left( \max_{t \in \text{SourceTopics}(s)} \text{Partitions}(t) \right)$$

- **Single Pipeline Example**: If `orders-raw` has 12 partitions, the application creates exactly **12 Active Tasks** (`0_0` through `0_11`).
- **Multiple Sub-Topologies Example**: If Sub-topology 0 reads `orders-raw` (12 partitions) and Sub-topology 1 reads `payments-raw` (8 partitions), total active tasks = $12 + 8 = 20\text{ tasks}$.

#### 2. Sizing Stream Threads (`num.stream.threads`)
- Each `StreamThread` executes a continuous `poll() → process() → commit()` event loop on a dedicated OS thread.
- **Rule of Thumb**: Allocate **1 Stream Thread per dedicated vCPU core**, up to the number of tasks assigned to that instance.
- **Thread Idling Trap**: If your cluster has 12 total tasks and you deploy 3 pods each configured with `num.stream.threads = 8` ($3 \times 8 = 24\text{ threads}$), exactly 12 threads will process tasks while the remaining 12 threads sit completely idle, consuming memory and thread stack overhead without increasing throughput.

#### 3. Kubernetes Pod Sizing & Replicas
- **Instance Saturation Limit**: You cannot scale beyond the total task count. If total active tasks = 12, deploying 16 Kubernetes pods leaves 4 pods with 0 active tasks (they will only host standby tasks if `num.standby.replicas > 0`; otherwise, they consume CPU/memory idling).
- **Recommended Ratio**: Deploy pods such that $\frac{\text{Total Tasks}}{\text{Pods}} \in [2, 4]$. For example, 12 tasks on 3 pods (4 tasks/pod, 4 threads/pod) or 4 pods (3 tasks/pod, 3 threads/pod).

---

### Rebalancing Deep Dive: Eager vs Cooperative Sticky Assignor

Understanding rebalancing mechanics is crucial to eliminating processing freezes during deployments and autoscaling.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Eager Rebalance (Legacy - Stop The World):                             │
│ Pod 1: [ Task 0, 1 ] ──► REVOKED ──► [ PAUSE ] ──► Re-assign [ Task 0 ]│
│ Pod 2: [ Task 2, 3 ] ──► REVOKED ──► [ PAUSE ] ──► Re-assign [ Task 1 ]│
│ Pod 3: (New instance joins) ───────► [ PAUSE ] ──► Re-assign [ Task 2 ]│
│ ⚠️ 100% of tasks halt processing while assignments are computed!        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Cooperative Sticky Rebalance (Modern Incremental Handoff):             │
│ Pod 1: [ Task 0 ] CONTINUES RUNNING ──► Only Task 1 revoked            │
│ Pod 2: [ Task 2 ] CONTINUES RUNNING ──► Only Task 3 revoked            │
│ Pod 3: (New instance joins) ──► Rebuilt state warm in background        │
│ ✅ Unaffected tasks NEVER stop processing; sub-second handoff!          │
└────────────────────────────────────────────────────────────────────────┘
```

#### 1. The Eager Rebalance Flaw (Stop-The-World)
In early Kafka Streams versions, any group membership change (pod restart, deployment, node crash) triggered an **Eager Rebalance**:
1. All instances revoked **all** assigned tasks simultaneously.
2. All stream processing across the entire fleet froze completely.
3. Local RocksDB state stores were closed.
4. If an instance was reassigned its old task, it had to reopen RocksDB and verify offsets before resuming.
5. In clusters with large state or frequent scale events, applications suffered endless "stop-the-world" latency spikes.

#### 2. Cooperative Sticky Assignor (Incremental Rebalancing)
Kafka Streams utilizes the **Cooperative Sticky Assignor** (`StreamsPartitionAssignor` with cooperative protocol):
- **Sticky Assignment**: Tasks remain on their existing host whenever possible to maximize RocksDB page cache and disk reuse.
- **Incremental Revocation**: When an instance joins or leaves, **only the specific tasks migrating to another node are paused and revoked**. All other tasks on all other instances continue processing real-time events without interruption!

#### 3. Probing Rebalances & Warm Task Migration
When a new instance joins, migrating a 50GB stateful task immediately would cause minutes of downtime while the new pod cold-replays the changelog. The Cooperative Sticky Assignor avoids this using **Probing Rebalances**:

1. **Standby Task Assignment**: Instead of moving the active task immediately, the assignor assigns the task as a **Standby Task** to the new pod, while keeping the active task running on the original pod.
2. **Background Catch-Up**: The new pod passively replays the changelog in the background while the active task processes live traffic without interruption.
3. **Probing Intervals (`probing.rebalance.interval.ms`)**:
   - Every `probing.rebalance.interval.ms` (default: 10 minutes / 600,000ms), the group coordinator initiates a lightweight **probing rebalance**.
   - The assignor checks whether the standby task's changelog lag is within `acceptable.recovery.lag` (default: 10,000 records).
4. **Hot Swap**: Once the standby task is caught up, the active task on the old pod is revoked and immediately promoted on the new pod. Downtime is reduced from minutes to sub-second.

:::tip[Tuning Probing Rebalances for Fast Deploys]
In Kubernetes environments with fast CI/CD pipelines, waiting 10 minutes for a probing rebalance can delay task convergence. Tune `probing.rebalance.interval.ms` down to `1.minute` (`60000`) for workloads with moderate state size to accelerate warm handoffs.
:::

---

## 5. Stream Operations

### Stateless Operations

These operations process each record independently — no state is maintained between records.

```java
KStream<String, Order> stream = builder.stream("orders");

// Filter: keep only records matching predicate
KStream<String, Order> valid = stream
    .filter((key, order) -> order.getTotal().compareTo(BigDecimal.ZERO) > 0,
        Named.as("filter-positive-orders"));

// FilterNot: keep records NOT matching predicate (inverse of filter)
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
// ⚠️ Key changed → repartition topic created → extra Kafka round-trip

// SelectKey: change only the key (TRIGGERS repartition)
KStream<String, Order> byProduct = stream
    .selectKey((key, order) -> order.getProductId(),
        Named.as("select-product-key"));

// FlatMapValues: one record → many records (value transform, no repartition)
KStream<String, OrderItem> items = stream
    .flatMapValues(order -> order.getItems(), Named.as("flatten-order-items"));

// Peek: side effect (logging, metrics) without transforming
KStream<String, Order> peeked = stream
    .peek((key, order) -> log.debug("Processing order: {}", key),
        Named.as("log-orders"));

// Branch: split stream into multiple streams based on predicates
Map<String, KStream<String, Order>> branches = stream.split(Named.as("order-tier"))
    .branch((key, order) -> order.isPriority(), Branched.as("priority"))
    .defaultBranch(Branched.as("standard"));
```

### Stateful Operations — Aggregations

```java
// Group by key (required before aggregation)
KGroupedStream<String, Order> grouped = stream
    .groupByKey(Grouped.as("group-by-customer-id"));
// Only use groupByKey if the stream is already keyed correctly
// Use groupBy() if you need to rekey:
KGroupedStream<String, Order> reGrouped = stream
    .groupBy((key, order) -> order.getProductCategory(),
        Grouped.as("group-by-category"));

// Count: how many records per key
KTable<String, Long> orderCounts = grouped
    .count(Named.as("count-orders-per-customer"),
        Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("order-count-store")
            .withKeySerde(Serdes.String())
            .withValueSerde(Serdes.Long()));

// Reduce: combine records with an associative operation
KTable<String, Order> latestOrder = grouped
    .reduce((existing, newOrder) ->
        existing.getCreatedAt().isAfter(newOrder.getCreatedAt()) ? existing : newOrder,
        Named.as("reduce-latest-order"),
        Materialized.as("latest-order-store"));

// Aggregate: general-purpose aggregation with an initializer + adder
KTable<String, CustomerOrderSummary> summaries = grouped
    .aggregate(
        CustomerOrderSummary::empty,   // initializer: called when first record for a key arrives
        (customerId, order, summary) -> summary.addOrder(order),  // adder
        Named.as("aggregate-customer-summary"),
        Materialized.<String, CustomerOrderSummary, KeyValueStore<Bytes, byte[]>>
            as("customer-summary-store")
            .withKeySerde(Serdes.String())
            .withValueSerde(summaryJsonSerde)
    );
```

### Reading KTable as a Stream

A `KTable` can be converted back to a `KStream` to observe every change (useful for downstream processing of state changes):

```java
// toStream: emit every KTable update as a KStream record
KStream<String, CustomerOrderSummary> summaryUpdates = summaries.toStream();
summaryUpdates.to("customer-summary-updates");
// Every time any customer's summary changes, a record is emitted
```

---

## 6. State Stores — The Heart of Stateful Processing

State stores are the local key-value databases that hold aggregation state, join tables, and any custom state. Understanding their internals is essential for performance and capacity planning.

### Internal Architecture

<KafkaStreamsStateStoreDiagram initialTab="layers" />

### RocksDB — Why It's Used

<KafkaStreamsStateStoreDiagram initialTab="rocksdb_io" />

RocksDB is a log-structured merge-tree (LSM-tree) embedded key-value database, optimized for write-heavy workloads on SSD.

**Why RocksDB over a hash map?**
- Dataset can exceed available RAM — RocksDB spills to disk transparently
- Supports range queries (`ZRANGEBYLEX`-equivalent) — needed for windowed state
- Crash-safe via WAL — data survives process crash without full changelog replay
- Tunable memory/disk trade-off via block cache size and compression

#### How RocksDB Interacts with the Linux OS Page Cache

A frequent architectural point of confusion is: **Does Kafka Streams have a Page Cache, or is that only on the Kafka Broker?**

**Both use the Linux OS Page Cache, but in fundamentally different ways:**
- On the **Kafka Broker**: The Page Cache directly buffers topic partition log segment files (`.log`), and `sendfile(2)` streams them to the network via Zero-Copy DMA without touching user space.
- In **Kafka Streams**: The Page Cache runs on your **client application host or Kubernetes pod**, acting as a **secondary disk cache for RocksDB**:

```
Kafka Streams Memory Hierarchy on Client Host / K8s Pod:
┌────────────────────────────────────────────────────────────────────────┐
│ Tier 1: JVM Heap Memory (-Xmx)                                        │
│ - Topology DAG, SerDes, StreamThread queues, POJO records              │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: RocksDB Off-Heap Native Memory (C++ via JNI)                   │
│ - MemTable: In-memory write buffer for fast mutations                  │
│ - Block Cache: Decompressed hot key-value data blocks                  │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Linux OS Page Cache (Host / Container Kernel RAM)              │
│ - Caches compressed SSTable (.sst) files and WAL logs                  │
│ - Prevents physical disk I/O when Block Cache misses occur             │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Physical Storage (Local NVMe / Persistent Volume)              │
│ - Flushed SSTables, .checkpoint file                                   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Read Request Path**: When your stream topology queries a state store (`store.get(key)`):
   - It checks the RocksDB in-memory **Block Cache** in off-heap C++ RAM.
   - On a block cache miss, RocksDB performs a file read. The Linux kernel intercepts this read and checks the **OS Page Cache**. If the SST page is present in Page Cache, it is read into native memory at RAM bus speeds without hitting storage media.
   - Only on a cold Page Cache miss does the kernel trigger physical NVMe/SSD read I/O.
2. **Kubernetes Memory Planning Hazard**:
   - In containerized environments (Kubernetes), developers frequently set container limits based only on the JVM `-Xmx` setting (e.g. `limit: 4Gi`, `-Xmx3g`).
   - Because RocksDB allocates native C++ memory for its Block Cache and MemTables outside the JVM, and the Linux kernel allocates Page Cache for SST files within the container cgroup, the total memory usage will exceed 4 GiB, triggering an **`OOMKilled` (Exit Code 137)** termination.
   - **Production Sizing Formula**:
     $$\text{Container Memory Limit} \ge \text{JVM Heap } (-Xmx) + \text{RocksDB Block Cache} + \text{MemTables} + \text{Page Cache Buffer (25--30\%)}$$

#### 3. Bounding Native Off-Heap Memory with `RocksDBConfigSetter`
By default, **every state store in every task creates its own independent RocksDB instance**, each allocating its own Block Cache (default 32MB) and MemTables (3 $\times$ 16MB).
If an application has 8 active tasks and 3 state stores per task, that equals $8 \times 3 = 24$ independent RocksDB instances!
$$24 \times (32\text{MB Block Cache} + 48\text{MB MemTables}) \approx 1.92\text{ GB native C++ RAM}$$
Without global bounding, native memory balloons uncontrollably under load and triggers a container `OOMKilled (Exit Code 137)`.

**The Solution: Shared Cache and Shared WriteBufferManager**
Implement `org.apache.kafka.streams.state.RocksDBConfigSetter` to enforce a single global memory pool shared across all RocksDB instances on the JVM:

```java
import org.apache.kafka.streams.state.RocksDBConfigSetter;
import org.rocksdb.BlockBasedTableConfig;
import org.rocksdb.BloomFilter;
import org.rocksdb.Cache;
import org.rocksdb.CompactionStyle;
import org.rocksdb.CompressionType;
import org.rocksdb.LRUCache;
import org.rocksdb.Options;
import org.rocksdb.WriteBufferManager;
import java.util.Map;

public class CustomRocksDBConfigSetter implements RocksDBConfigSetter {

    // Shared native memory budget across ALL RocksDB instances in this JVM process
    // Total Native RocksDB Cap = 512 MB (Block Cache + Write Buffers)
    private static final Cache SHARED_BLOCK_CACHE = new LRUCache(384 * 1024 * 1024L); // 384 MB
    private static final WriteBufferManager SHARED_WRITE_BUFFER_MANAGER =
        new WriteBufferManager(128 * 1024 * 1024L, SHARED_BLOCK_CACHE); // 128 MB write buffer charged to cache

    @Override
    public void setConfig(String storeName, Options options, Map<String, Object> configs) {
        // 1. Enforce global shared write buffer manager
        options.setWriteBufferManager(SHARED_WRITE_BUFFER_MANAGER);

        // 2. Table options: attach shared block cache and configure bloom filter
        BlockBasedTableConfig tableConfig = new BlockBasedTableConfig();
        tableConfig.setBlockCache(SHARED_BLOCK_CACHE);
        tableConfig.setBlockSize(16 * 1024L); // 16 KB block size (improves point lookup performance)
        tableConfig.setCacheIndexAndFilterBlocks(true); // Cache index/filter in the shared block cache
        tableConfig.setFilterPolicy(new BloomFilter(10, false)); // 10 bits per key (~1% false positive rate)
        options.setTableFormatConfig(tableConfig);

        // 3. Compaction and I/O tuning
        options.setCompactionStyle(CompactionStyle.LEVEL);
        options.setCompressionType(CompressionType.LZ4_COMPRESSION); // Fast compression, low CPU overhead
        options.setMaxWriteBufferNumber(3);
        options.setWriteBufferSize(32 * 1024 * 1024L); // 32 MB per memtable
        options.setMaxBackgroundJobs(4); // Parallel flush and compaction threads
    }

    @Override
    public void close(String storeName, Options options) {
        // RocksDBConfigSetter close hook (resources cleaned on JVM shutdown)
    }
}
```

Enable it in your streams configuration:
```java
props.put(StreamsConfig.ROCKSDB_CONFIG_SETTER_CLASS_CONFIG, CustomRocksDBConfigSetter.class.getName());
```

---

### State Store TTL & Expiration Patterns

Unbounded state stores are the primary cause of disk space exhaustion and prolonged recovery times in production.

| Store Type | Built-In Retention Mechanism | How TTL Works |
|:---|:---|:---|
| **WindowStore** | Native `TimeWindows.ofSizeAndGrace(...)` | Segments older than `windowSize + gracePeriod` are physically dropped |
| **SessionStore** | Native `SessionWindows.ofInactivityGapAndGrace(...)` | Expired sessions dropped once inactivity gap + grace period passes |
| **KeyValueStore** | **None** by default (Retained indefinitely!) | Requires KIP-653 / KIP-1033 state store TTL or custom Punctuator |

#### 1. Native Window Retention
Windowed stores divide RocksDB state into discrete time-sliced segment files. When a segment's latest timestamp falls outside the retention window:
```java
// Window retention: 24 hours retention, 1 hour grace period
TimeWindows window = TimeWindows.ofSizeAndGrace(Duration.ofHours(1), Duration.ofMinutes(15));
// RocksDB drops segment files older than (size + grace) without scanning individual keys!
```

#### 2. Key-Value Store Expiration via Processor API Punctuator
Because regular `KeyValueStore` does not prune expired keys automatically, you must schedule a periodic cleanup punctuator:

```java
public class TtlCleanupProcessor extends ContextualProcessor<String, ValueWithTimestamp<String>, String, String> {

    private KeyValueStore<String, ValueWithTimestamp<String>> stateStore;
    private static final long TTL_MS = Duration.ofHours(6).toMillis();

    @Override
    public void init(ProcessorContext<String, String> context) {
        super.init(context);
        this.stateStore = context.getStateStore("ttl-store");

        // Schedule wall-clock punctuator to purge expired keys every 15 minutes
        context.schedule(Duration.ofMinutes(15), PunctuationType.WALL_CLOCK_TIME, timestamp -> {
            try (KeyValueIterator<String, ValueWithTimestamp<String>> iterator = stateStore.all()) {
                while (iterator.hasNext()) {
                    KeyValue<String, ValueWithTimestamp<String>> entry = iterator.next();
                    if (timestamp - entry.value.getTimestamp() > TTL_MS) {
                        stateStore.delete(entry.key); // Writes tombstone to state store and changelog
                    }
                }
            }
        });
    }

    @Override
    public void process(Record<String, ValueWithTimestamp<String>> record) {
        stateStore.put(record.key(), record.value());
        context().forward(record.withValue(record.value().getValue()));
    }
}
```

:::warning[Punctuator Scanning Hazard on Large Stores]
Scanning a full RocksDB store (`stateStore.all()`) with millions of keys inside a punctuator blocks the StreamThread event loop.
- If store has $> 100{,}000$ keys, maintain a secondary **time-ordered index store** (keyed by `timestamp + key`), or use KIP-653 / KIP-1033 state store TTL APIs in Kafka 3.6+.
:::

### State Store Types

```java
// 1. KeyValueStore — simple key-value (most common)
Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("count-store")
    .withKeySerde(Serdes.String())
    .withValueSerde(Serdes.Long());

// 2. WindowStore — keyed by (key, window-start-time)
Materialized.<String, Long, WindowStore<Bytes, byte[]>>as("windowed-count-store");

// 3. SessionStore — keyed by (key, session-start, session-end)
Materialized.<String, Long, SessionStore<Bytes, byte[]>>as("session-store");

// 4. In-memory store (no RocksDB — state lost on crash, rebuilt from changelog)
// Use when state is small and rebuild is fast
Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("small-store")
    .withLoggingEnabled(Map.of())  // still has changelog
    .withCachingEnabled()
    // explicitly choose in-memory backend:
    .withStoreType(Stores.inMemoryKeyValueStore("small-store").getClass()); // simplified
```

### Write Cache Behavior and Downstream Emission Timing

The in-memory write cache introduces a critical behavioral subtlety: **downstream KTable-to-KStream emissions are delayed and deduplicated by the cache**.

```
Without cache:
  Input record 1 (key="user-1", value=order1) → KTable update emitted immediately
  Input record 2 (key="user-1", value=order2) → KTable update emitted immediately
  → 2 downstream records emitted

With cache (cache.max.bytes.buffering > 0):
  Input record 1 (key="user-1", value=order1) → buffered in cache
  Input record 2 (key="user-1", value=order2) → overwrites in cache (same key)
  → On cache flush (commit): 1 downstream record emitted (only final value)
  → 1 downstream record emitted instead of 2

This is correct for KTable semantics (only latest value matters)
but can surprise engineers expecting every update to be emitted downstream.
```

**To disable caching (emit every update — useful for testing or audit streams):**

```java
Materialized.as("store-name")
    .withCachingDisabled()  // every update emitted immediately
```

### State Store Access in Custom Processors

```java
// Processor API: direct state store access
public class OrderEnrichmentProcessor implements Processor<String, Order, String, EnrichedOrder> {

    private KeyValueStore<String, CustomerProfile> customerStore;
    private ProcessorContext<String, EnrichedOrder> context;

    @Override
    public void init(ProcessorContext<String, EnrichedOrder> context) {
        this.context = context;
        // Access state store by name — must be registered in the topology
        this.customerStore = context.getStateStore("customer-profile-store");
    }

    @Override
    public void process(Record<String, Order> record) {
        String customerId = record.value().getCustomerId();
        CustomerProfile profile = customerStore.get(customerId);

        if (profile == null) {
            context.forward(record.withValue(EnrichedOrder.withoutProfile(record.value())));
        } else {
            context.forward(record.withValue(EnrichedOrder.of(record.value(), profile)));
        }
    }

    @Override
    public void close() { }
}
```

---

## 7. Changelog Topics — The Durability Layer

Every persistent state store has a corresponding **changelog topic** — a compacted Kafka topic that records every write made to the state store. The changelog is the source of truth for state recovery.

### How the Changelog Works

<KafkaStreamsStateStoreDiagram initialTab="layers" />

- **Dual Write Path**: When state is modified via `put(K, V)` or `aggregate()`, it is staged in the in-memory write cache, flushed to local RocksDB on disk, and simultaneously appended to the internal Kafka changelog topic.
- **Log Compaction**: The changelog topic uses `cleanup.policy=compact`, retaining only the latest value for each key. Total changelog size is bounded by the number of distinct keys rather than total historic events. Tombstones (`null` values) delete old entries during log cleaner cycles.
- **Deterministic Recovery**: On task reassignment after a node crash, the new host inspects the local `.checkpoint` file and replays uncommitted records from the changelog to restore full state.

### Changelog Topic Configuration

```java
// Control changelog topic settings per state store
Map<String, String> changelogConfig = Map.of(
    "min.insync.replicas", "2",          // Durability: require 2 replicas for changelog writes
    "replication.factor", "3",
    "retention.ms", "-1",                // Never expire (compacted — size bounded by unique keys)
    "segment.bytes", "104857600",        // 100MB segments
    "cleanup.policy", "compact"          // Required for changelog — keep only latest per key
);

Materialized.as("my-state-store")
    .withLoggingEnabled(changelogConfig);

// Disable changelog (state is rebuilt from scratch on crash — no Kafka dependency for state)
Materialized.as("ephemeral-store")
    .withLoggingDisabled();
// ⚠️ Without changelog, task assignment to a different instance = full state loss
// Only use for reproducible state (e.g., aggregating from beginning of topic every time)
```

---

## 8. Failure Recovery Deep Dive

<KafkaStreamsFailoverRecoveryDiagram />

Understanding exactly what happens when a Kafka Streams instance fails is essential for designing systems with acceptable recovery windows.

### Timeline of a Crash and Recovery

When an instance fails (e.g. OOM, node reboot, or network partition), the Kafka Consumer Group Coordinator detects the missing heartbeat after `session.timeout.ms` (30s) and triggers a cluster rebalance to reassign tasks to healthy nodes.

### The Checkpoint File

<KafkaStreamsStateStoreDiagram initialTab="checkpoint" />

Kafka Streams writes a `.checkpoint` file in the state directory periodically. It records the Kafka offset in the changelog topic up to which RocksDB state is guaranteed durable.

**Key insight**: if RocksDB data on disk is up to offset 45231, and the changelog has 47500 records total, recovery only needs to replay 2269 records — not the full history.

### What `commit.interval.ms` Controls

```
commit.interval.ms = 100ms (default):

  Every 100ms:
    1. Flush in-memory write cache → RocksDB
    2. Flush RocksDB to disk
    3. Write updated offset to .checkpoint file
    4. Flush output producer buffer → send to Kafka
    5. Commit consumer offsets to Kafka
    (Steps 1-5 atomic with exactly_once_v2)

  On crash: at most 100ms of changelog records must be replayed
  Trade-off: lower commit.interval = less replay needed = faster recovery
             lower commit.interval = more frequent disk syncs = lower throughput
```

### The `.checkpoint` File Anatomy & Corruption Hazard

Located on disk at `<state.dir>/<application.id>/<task_id>/.checkpoint`, this plain text file represents the watermark up to which RocksDB data has been fsynced to storage:

```
0                       <-- Checkpoint file version (0)
2                       <-- Number of state stores tracked
order-count-store-changelog 0 148920
summary-store-changelog     0 93402
```

#### Why Checkpoint Corruption Causes Catastrophic Cold Replay
1. **Commit Coordination**: Kafka Streams only updates `.checkpoint` **after** RocksDB flushes all active MemTables to disk as immutable SST files.
2. **Crash Before Checkpoint**: If a pod crashes mid-batch, uncommitted MemTable writes are lost, but `.checkpoint` reflects the last committed offset. On restart, Kafka Streams safely plays the changelog forward from `148920` to the partition head.
3. **The Checkpoint Erasure Disaster**: If operations scripts, container restart policies, or pod storage volume remounts delete the `.checkpoint` file while retaining the RocksDB `.sst` data files:
   - Kafka Streams treats the missing checkpoint as an **unclean, corrupted shutdown**.
   - It **wipes the entire local RocksDB directory** and replays all changelog records from offset 0!
   - For a 100GB state store, this converts what should have been a 2-second restart into a 30-minute outage.

### Observing State Restoration with `StateRestoreListener`

During failover, instances transition to the `RESTORING` state while replaying changelog records. Use `StateRestoreListener` to track progress, expose metrics, and avoid premature health check failures:

```java
kafkaStreams.setGlobalStateRestoreListener(new StateRestoreListener() {

    @Override
    public void onRestoreStart(TopicPartition topicPartition, String storeName,
                               long startingOffset, long endingOffset) {
        long totalRecordsToRestore = endingOffset - startingOffset;
        log.info("Starting restoration for store [{}] on partition [{}] (records to replay: {})",
            storeName, topicPartition, totalRecordsToRestore);
    }

    @Override
    public void onBatchRestored(TopicPartition topicPartition, String storeName,
                                long batchEndOffset, long numRestored) {
        log.debug("Restored batch of {} records for store [{}] on partition [{}], current offset: {}",
            numRestored, storeName, topicPartition, batchEndOffset);
    }

    @Override
    public void onRestoreEnd(TopicPartition topicPartition, String storeName, long totalRestored) {
        log.info("Completed restoration for store [{}] on partition [{}], total restored: {}",
            storeName, topicPartition, totalRestored);
    }
});
```

---

## 9. Standby Replicas

Standby replicas are **shadow tasks** that passively consume a state store's changelog without processing any input records. They maintain a warm copy of state that can be promoted to an active task almost instantly on failover — eliminating the recovery window.

### How Standby Replicas Work

```
Normal operation (num.standby.replicas = 1):
  Instance A: Active Task 0 → processing orders, updating state store
              Reads from: "orders-raw-0"
              Writes changelog to: "app-order-summary-store-changelog-0"
              
  Instance B: Standby for Task 0 → passively consuming changelog
              Reads from: "app-order-summary-store-changelog-0"
              Maintains: local RocksDB copy, offset ~= Instance A's offset
              Does NOT read from: "orders-raw-0" (that's Instance A's job)

Instance A crashes:
  Instance B already has state at t ≈ now
  Recovery time: replay only the last few seconds of changelog (very short)
  Processing resumes in seconds, not minutes
```

```java
// Configure standby replicas
props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
// Each state store partition gets 1 standby copy
// Infrastructure cost: N extra instances running (consuming changelog, not input)
// Memory cost: each standby instance holds RocksDB data for its assigned standby tasks
```

### Standby Replica Trade-offs

| Aspect | No Standby | 1 Standby | 2 Standbys |
|:---|:---|:---|:---|
| Recovery time on crash | Minutes (full changelog replay) | Seconds (minimal replay) | Near-zero (replica already current) |
| Instance count needed | N | N + N (doubled) | N + 2N (tripled) |
| Memory/disk per instance | State for active tasks | State for active + standby tasks | More standby state |
| Use when | State is small, fast recovery acceptable | Production systems | Critical, low-RTO systems |

---

## 10. Exactly-Once Semantics

<KafkaStreamsExactlyOnceDiagram />

### Exactly-Once V2 (`EXACTLY_ONCE_V2`)

Kafka Streams wraps each read-process-write cycle in a **Kafka transaction**. Output records AND consumer offset commits are atomic:

```yaml
# Required consumer configuration for downstream consumers
# to only see committed (non-aborted) output records
isolation.level: read_committed
```

```java
// V2 vs V1 difference:
// V1: one transactional producer per TASK (many producers if many tasks)
// V2: one transactional producer per STREAM THREAD (fewer producers = better throughput)
// V2 requires Kafka 2.5+ and is strongly preferred

props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
```

### Exactly-Once for External Database Writes

`EXACTLY_ONCE_V2` only covers Kafka-internal atomicity. When writing to an external database, combine with the **Transactional Outbox Pattern**:

```java
@KafkaListener(topics = "processed-orders")
@Transactional  // Local DB transaction
public void consumeProcessedOrder(EnrichedOrder order) {
    // Write business state to DB
    orderRepository.save(OrderEntity.from(order));
    
    // Write outbox event in SAME transaction
    outboxRepository.save(OutboxEvent.of("OrderFulfillmentStarted", order.getOrderId(), order));
    
    // If crash here: DB transaction rolls back, no partial state
    // On replay: idempotency key prevents double processing
}
// Outbox relay (Debezium) publishes to Kafka after commit — at-least-once
// Consumer idempotency key deduplicates retries — effectively exactly-once end-to-end
```

### The EOS Duplicates Trap: Why `exactly_once_v2` Still Leaks Duplicates

A ubiquitous production misconception is assuming that configuring `processing.guarantee=exactly_once_v2` eliminates duplicate processing across the entire enterprise system. In reality, Kafka EOS is strictly scoped to **internal Kafka-read-to-Kafka-write atomicity**.

Here are the three primary vectors where duplicates still leak into downstream systems:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Vector 1: Downstream Consumer reads aborted transaction records        │
│ Kafka Broker Log: [ Msg 1 ] ──► [ Msg 2 (aborted) ] ──► [ Msg 2 (retry)│
│                                           │                     │      │
│ Downstream Consumer (read_uncommitted) ───┴─────────────────────┴──► 2x!
│ (Reads BOTH aborted message and retry message!)                        │
├────────────────────────────────────────────────────────────────────────┤
│ Vector 2: External Side Effects (HTTP / REST / Third-Party DB)         │
│ Stream Processor ──► HTTP POST /pay ──► [ Crash before commit ]        │
│ Rebalance ──► Replay input record ──► HTTP POST /pay (2nd payment!)   │
├────────────────────────────────────────────────────────────────────────┤
│ Vector 3: Non-Idempotent Downstream Producer Republishing              │
│ Consumer reads_committed ──► Non-idempotent Producer ──► Network Retry │
└────────────────────────────────────────────────────────────────────────┘
```

#### 1. Downstream Consumers Missing `isolation.level=read_committed`
- **Under-the-Hood Broker Truth**: When a Kafka Streams transactional producer writes records that eventually abort (due to an unhandled exception or rebalance fence), **the aborted messages are NEVER deleted from broker log segments**. They physically reside in the `.log` partition file alongside an abort control marker (`CONTROL_BATCH`).
- **The Trap**: Standard Kafka consumers (in Spring Boot, Python, Go, or Spark) default to `isolation.level=read_uncommitted`. These consumers read straight through the partition log, receiving both the aborted records and the subsequently re-processed records!
- **Mandatory Guard**: Every downstream consumer reading from Kafka Streams output topics must explicitly set:
  ```properties
  isolation.level=read_committed
  ```

#### 2. Non-Transactional External Side Effects (HTTP / RPC)
- Placing HTTP REST calls, gRPC calls, email notifications, or non-transactional database mutations inside `.map()`, `.peek()`, or a Processor API step is an architectural disaster.
- If the Kafka Streams transaction fails before commit (e.g. during a broker timeout or JVM crash), Kafka rolls back consumer offsets and output records. However, the external HTTP endpoint has already processed the request!
- Upon task restart, the input record is replayed from the previous committed offset, triggering the HTTP call a second time.
- **Mandatory Guard**: Always separate stream processing from external side effects. Write results to a dedicated Kafka topic, and let an idempotent worker or Transactional Outbox consumer trigger external RPC calls.

#### 3. Producer Republishing Without Idempotence
- If downstream pipelines read from a streams output topic and forward to an external Kafka cluster or message bus without `enable.idempotence=true` and transaction coordination, transient network disconnects on produce retries will inject duplicate messages into target topics.

---

## 11. Repartitioning — The Hidden Cost

### When Repartitioning Occurs

Any operation that changes the record's **key** causes repartitioning. This is because state stores are partitioned by key — for correct co-location, records with the same key must land on the same task.

```
Operations that TRIGGER repartitioning (key changes):
  .map()          - key and value both transform
  .selectKey()    - key-only transform
  .groupBy()      - rekeys before aggregation
  .join()         - if streams are not co-partitioned

Operations that DO NOT trigger repartitioning (key preserved):
  .mapValues()    - only value transforms
  .filter()       - no transform
  .filterNot()    - no transform
  .flatMapValues()- value-only transform
  .peek()         - side-effect only
  .groupByKey()   - groups by existing key (no rekey)
```

### What Happens During Repartitioning

```
groupBy((key, order) -> order.getProductCategory()):
  
  Before repartition:
    Task 0 (partition 0): [key="order-1", category="electronics"]
    Task 1 (partition 1): [key="order-2", category="electronics"]
    Task 2 (partition 2): [key="order-3", category="clothing"]
  
  Repartition step:
    Kafka Streams writes records to internal repartition topic:
    "app-id-KGROUPEDSTREAM-MAP-0000000003-repartition" (or named equivalent)
    
    Records are re-partitioned by new key (product category):
    "electronics" → partition 0 (hash("electronics") % 3 = 0)
    "clothing"    → partition 2 (hash("clothing") % 3 = 2)
  
  After repartition:
    Task 0: all "electronics" orders from all input partitions
    Task 2: all "clothing" orders from all input partitions
    → State store for "electronics" is always on the same task → correct aggregation
```

**Cost of repartitioning:**
- Extra Kafka topic created and maintained
- Extra Kafka producer write for every record
- Extra Kafka consumer read from repartition topic
- Additional end-to-end latency (one extra Kafka round-trip: ~5–50ms)

**How to minimize repartitioning:**
- Key your source topic correctly upfront (schema design matters)
- Use `mapValues()` instead of `map()` when only the value needs changing
- Use `groupByKey()` instead of `groupBy()` when the key is already correct
- Design your topics so join inputs are co-partitioned

---

## 12. Windowing

<KafkaStreamsWindowJoinDiagram initialMode="tumbling" />

Windowing divides an infinite stream into finite time-bounded subsets for aggregation. Without windowing, an aggregation would accumulate state forever.

### Tumbling Windows — Fixed, Non-Overlapping

Each record belongs to exactly one window. Windows do not overlap. After the window closes, results are final.

```
Tumbling window size = 1 minute:

  t=0:00–0:59:  Window 1 → count("electronics") = 142
  t=1:00–1:59:  Window 2 → count("electronics") = 87
  t=2:00–2:59:  Window 3 → count("electronics") = 203

  No record appears in more than one window.
```

```java
TimeWindows tumblingWindow = TimeWindows
    .ofSizeWithNoGrace(Duration.ofMinutes(1));
// "WithNoGrace" = window closes immediately — late records are dropped

TimeWindows tumblingWithGrace = TimeWindows
    .ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofSeconds(30));
// Grace period = accept records arriving up to 30s after window closes
// Essential for out-of-order event streams (mobile, IoT)

KTable<Windowed<String>, Long> windowedCounts = stream
    .groupBy((key, order) -> order.getCategory(), Grouped.as("group-by-category"))
    .windowedBy(tumblingWithGrace)
    .count(Materialized.as("category-minute-counts"));

// Access windowed results
windowedCounts.toStream().foreach((windowedKey, count) -> {
    String category = windowedKey.key();
    long windowStart = windowedKey.window().start();
    long windowEnd = windowedKey.window().end();
    log.info("Category {} in window [{}, {}]: {} orders",
        category, windowStart, windowEnd, count);
});
```

### Hopping Windows — Fixed, Overlapping

Windows have a fixed size and advance by a smaller "hop" interval. Each record belongs to multiple windows.

```
Window size = 1 hour, hop = 15 minutes:

  Window starting 00:00: covers 00:00–01:00
  Window starting 00:15: covers 00:15–01:15
  Window starting 00:30: covers 00:30–01:30
  Window starting 00:45: covers 00:45–01:45

  A record at t=00:45 belongs to windows starting at: 00:00, 00:15, 00:30, 00:45
  → Written to 4 state store entries (one per window)
  → Memory usage = 4× a tumbling window of the same size
```

```java
SlidingWindows hoppingWindow = SlidingWindows.ofTimeDifferenceAndGrace(
    Duration.ofHours(1),    // window size
    Duration.ofMinutes(15), // hop interval  
    Duration.ofMinutes(5)   // grace period
);
```

### Session Windows — Activity-Based, Variable Length

Session windows group records by periods of activity separated by gaps of inactivity. A new session starts when a gap exceeds `inactivityGap` after the last event.

```
inactivityGap = 5 minutes:

  Events for user-123:
    t=00:01  → Session 1 starts
    t=00:03  → extends Session 1
    t=00:04  → extends Session 1
    t=00:10  → 6 min gap > 5 min → Session 1 ends, Session 2 starts
    t=00:12  → extends Session 2
    t=00:25  → 13 min gap > 5 min → Session 2 ends

  Session 1: [00:01, 00:04] — 3 minutes active
  Session 2: [00:10, 00:12] — 2 minutes active
```

```java
SessionWindows sessionWindow = SessionWindows
    .ofInactivityGapWithNoGrace(Duration.ofMinutes(5));

KTable<Windowed<String>, Long> sessionCounts = stream
    .groupByKey()
    .windowedBy(sessionWindow)
    .count(Materialized.as("session-activity-store"));
```

### Suppress — Emit Only Final Window Results

By default, windowed aggregations emit a result **every time the window's aggregate changes** — potentially dozens or hundreds of intermediate updates per window. `suppress()` holds back results in an internal buffer and emits **exactly once per window** when the window definitively closes:

```java
// With suppress: emits exactly once per window, after it closes
KTable<Windowed<String>, Long> finalCounts = stream
    .groupBy((k, v) -> v.getCategory(), Grouped.as("group-cat"))
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofSeconds(10)))
    .count(Materialized.as("suppress-counts"))
    .suppress(
        Suppressed.untilWindowCloses(
            Suppressed.BufferConfig.maxBytes(50 * 1024 * 1024L) // 50MB buffer
                .shutDownWhenFull() // StrictBufferConfig: fail loudly if buffer fills
        )
    );
```

### The `suppress()` Stalled Stream-Time Trap (`suppress-not-emitting`)

The single most frequent production issue reported with `suppress(Suppressed.untilWindowCloses(...))` is that **the downstream output topic remains completely silent**. No errors, no warnings, no exceptions in the logs, but zero records are emitted.

This is almost never a bug in Kafka Streams. It is a direct consequence of how `untilWindowCloses` defines when a window is finished:

```
┌────────────────────────────────────────────────────────────────────────┐
│ The Cardinal Invariant: Suppress Fires on STREAM-TIME, NOT WALL-CLOCK  │
│                                                                        │
│ Window [ 10:00 - 11:00 ] with 5 min grace                              │
│ Closes ONLY when: Stream-Time >= 11:05:00                              │
│                                                                        │
│ Stream-Time = Max(record timestamps processed by this task)            │
│ ⚠️ If last record arrived at 10:58 and stream goes quiet:              │
│    Stream-Time remains frozen at 10:58:00 FOREVER!                     │
│    Wall-clock reaches 11:05, 12:00, 18:00... WINDOW NEVER CLOSES!      │
└────────────────────────────────────────────────────────────────────────┘
```

#### 1. Why Stream-Time Freezes on Low-Traffic or Idle Partitions
- **Stream-Time is data-driven**: Stream-time advances **only when a new record arrives on that partition with a timestamp higher than the current stream-time**.
- If a partition receives its last record at 10:58, and no more events arrive, stream-time is frozen at 10:58. Even though hours of wall-clock time pass, the window `[10:00 - 11:00]` cannot close. `suppress()` dutifully holds the result in its memory buffer indefinitely.
- **Sparse Keys vs Quiet Partitions**: While windowed aggregation state is keyed, window closure is per **partition/task**. If other keys on the same partition have high volume, their events push stream-time forward and close the quiet key's window. But if an entire partition becomes idle (e.g. overnight, weekends, or hash key skew), all keys on that partition go silent.

#### 2. Lagging Partition Holdback in Multi-Source Tasks
- Stream-time is tracked **per task**. When a sub-topology reads from multiple source topics (such as a stream-stream join or `merge()`), Kafka Streams synchronizes inputs by picking the record with the **lowest timestamp** among buffered partition queues to maintain strict event-time ordering.
- If one partition is lagging significantly (e.g. due to slow upstream producers or network partitions), it acts as an anchor holding back the entire task's stream-time. Windows on the faster partitions cannot close until the straggler partition catches up.

#### 3. The `TopologyTestDriver` Illusion
Why does `suppress()` pass in unit tests but fail in production?
In a test using `TopologyTestDriver`, developers pipe test records with manually configured timestamps:
```java
// In test:
inputTopic.pipeInput("k", "val1", Instant.parse("2026-06-08T10:30:00Z"));
inputTopic.pipeInput("k", "val2", Instant.parse("2026-06-08T10:58:00Z"));
// Still empty!
assertTrue(outputTopic.isEmpty());

// Test pipes a future event to verify output:
inputTopic.pipeInput("k", "val3", Instant.parse("2026-06-08T11:06:00Z"));
// BAM! Stream-time crossed 11:05, window closed, test passes!
assertFalse(outputTopic.isEmpty());
```
In production, if that 11:06 event never arrives because customers stopped ordering, the application never emits!

#### 4. The BufferConfig Strictness Compile Trap
`suppress` stores pending window aggregates in heap memory (backed by an internal changelog topic `app-KTABLE-SUPPRESS-STATE-STORE-changelog`):

| Buffer Configuration | Behavior When Buffer Fills | Safety & Semantics |
|:---|:---|:---|
| `BufferConfig.unbounded()` | Buffer grows indefinitely | ⚠️ High risk of Heap OOM on high-cardinality keys |
| `BufferConfig.maxBytes(...).shutDownWhenFull()` | Application terminates immediately with error | ✅ Strict guarantee, fails fast without silent data corruption |
| `BufferConfig.maxBytes(...).emitEarlyWhenFull()` | Emits oldest buffered window early | ❌ **Compile Error with `untilWindowCloses`!** Only works with `untilTimeLimit` |

:::danger[Compile-Time Safety Guard]
`untilWindowCloses` explicitly requires a `StrictBufferConfig`. You cannot combine `untilWindowCloses` with `emitEarlyWhenFull()`, because emitting early directly violates the contract of "emit only when the window is closed".
:::

#### 5. Solutions: Synthetic Heartbeats vs Wall-Clock Punctuator

##### Approach A: Synthetic Heartbeat / Pulse Topic (Data-Driven Fix)
Inject a synthetic "pulse" record with current wall-clock timestamp into every partition at a regular interval (e.g. every minute):
- **Pros**: Advances stream-time without altering the topology DSL.
- **Cons (Architectural Smell)**: Requires producing dummy messages to every partition; stream processors must filter out pulse records so they don't corrupt aggregates; synthetic future timestamps can prematurely expire genuine late-arriving records.

##### Approach B: Processor API with `WALL_CLOCK_TIME` Punctuator (The Clean Architecture Fix)
If you require predictable, wall-clock emission on sparse or low-traffic topics, discard `suppress()` and implement a custom Processor with a `WALL_CLOCK_TIME` Punctuator:

```java
// Punctuator runs on a fixed wall-clock schedule, immune to idle partition stalls:
public class WallClockWindowFlushProcessor extends ContextualProcessor<String, Order, String, Long> {

    private TimestampedKeyValueStore<String, Long> countStore;

    @Override
    public void init(ProcessorContext<String, Long> context) {
        super.init(context);
        this.countStore = context.getStateStore("window-counts");

        // Schedule wall-clock execution every 60 seconds
        context.schedule(Duration.ofSeconds(60), PunctuationType.WALL_CLOCK_TIME, currentWallTimeMs -> {
            try (KeyValueIterator<String, ValueAndTimestamp<Long>> iter = countStore.all()) {
                while (iter.hasNext()) {
                    KeyValue<String, ValueAndTimestamp<Long>> entry = iter.next();
                    long windowEnd = entry.value.timestamp() + Duration.ofMinutes(10).toMillis();
                    if (currentWallTimeMs >= windowEnd) {
                        // Window has elapsed according to wall clock — emit and delete
                        context().forward(new Record<>(entry.key, entry.value.value(), currentWallTimeMs));
                        countStore.delete(entry.key);
                    }
                }
            }
        });
    }

    @Override
    public void process(Record<String, Order> record) {
        ValueAndTimestamp<Long> current = countStore.get(record.key());
        long newCount = (current == null) ? 1L : current.value() + 1;
        countStore.put(record.key(), ValueAndTimestamp.make(newCount, record.timestamp()));
    }
}
```

---

## 13. Joins

<KafkaStreamsWindowJoinDiagram initialMode="tumbling" />

### Stream-Stream Join

Both streams are temporal — a record from stream A joins with any record from stream B that arrives within the join window.

```java
KStream<String, Order> orders = builder.stream("orders");
KStream<String, Payment> payments = builder.stream("payments");

// Both streams MUST be co-partitioned (same number of partitions, same key)
JoinWindows joinWindow = JoinWindows
    .ofTimeDifferenceAndGrace(Duration.ofMinutes(5), Duration.ofSeconds(30));
// An order joins with any payment that arrives within 5 minutes

KStream<String, OrderWithPayment> joined = orders.join(
    payments,
    (order, payment) -> OrderWithPayment.of(order, payment),
    joinWindow,
    StreamJoined.<String, Order, Payment>with(
        Serdes.String(), orderSerde, paymentSerde)
        .withName("order-payment-join")
        .withStoreName("order-payment-join-store")
);
```

**Join types:**
- `join()` — inner join: both records must exist within the window
- `leftJoin()` — left outer: order always emitted; payment is null if no matching payment
- `outerJoin()` — full outer: both sides emit even without a match

### Stream-KTable Join

The stream is temporal (current record only); the KTable represents current state. The stream record joins with the KTable's current value for the same key at the time of processing.

```java
KStream<String, Order> orders = builder.stream("orders");
KTable<String, CustomerProfile> customers = builder.table("customer-profiles",
    Materialized.as("customer-profile-store"));

// Must be co-partitioned
KStream<String, EnrichedOrder> enriched = orders.join(
    customers,
    (order, profile) -> order.enrichWith(profile),  // profile can be null for leftJoin
    Joined.as("order-customer-join")
);
// Result: every order record is enriched with the customer's current profile
```

### Stream-GlobalKTable Join

GlobalKTable is fully replicated — no co-partitioning required. The join key is extracted from the stream record.

```java
GlobalKTable<String, Product> products = builder.globalTable("product-catalog",
    Materialized.as("product-store"));

KStream<String, Order> orders = builder.stream("orders");

// Key extractor: from the stream record, extract the join key for the GlobalKTable
KStream<String, EnrichedOrder> enriched = orders.join(
    products,
    (orderKey, order) -> order.getProductId(),   // extract product ID from order
    (order, product) -> order.enrichWith(product)
);
// No co-partitioning required — every instance has the full product table
```

### Join Co-Partitioning Requirements

| Join Type | Co-partitioning Required? | Key Extraction |
|:---|:---|:---|
| KStream + KStream | ✅ Yes | Same key used for both |
| KStream + KTable | ✅ Yes | Same key used for both |
| KStream + GlobalKTable | ❌ No | Custom key extractor from stream record |
| KTable + KTable | ✅ Yes | Same key used for both |

**Co-partitioning means**: same number of partitions AND same partitioning logic (same key, same partitioner). If topics have different partition counts, a repartition step is inserted automatically.

### Join Debugging & Troubleshooting Checklist

Stream joins are notoriously sensitive to partition alignment, window timing, and event timestamps. When a join produces missing or null results, walk through this 4-point diagnostic checklist:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Join Troubleshooting Pipeline:                                         │
│ 1. Co-partitioning Check ──► Same Partition Count? Same Hasher (Murmur)?│
│ 2. Timestamp Alignment   ──► Event-Time vs Wall-Clock skew?            │
│ 3. Asymmetric Windows    ──► before() and after() boundaries correct?  │
│ 4. Grace Period Drops    ──► Check metric: dropped-records-total       │
└────────────────────────────────────────────────────────────────────────┘
```

#### 1. The Co-Partitioning Tri-Contract
For any `KStream-KStream` or `KStream-KTable` join, both inputs **must strictly adhere to all three rules**:
1. **Identical Partition Count**: If `orders` has 12 partitions and `payments` has 8 partitions, record `key="user-42"` hashes to partition `abs(murmur2("user-42")) % 12 = 5` for orders, but `abs(murmur2("user-42")) % 8 = 1` for payments! Task 5 only holds state for Partition 5, so the records **never meet in memory**. Kafka Streams 3.x validates this and fails fast with `TopologyException`.
2. **Identical Key SerDes**: If Topic A serializes keys as UTF-8 Strings (`"100"`) while Topic B serializes keys as 4-byte integers (`100`), the Murmur2 hash values are completely different, routing them to different partitions.
3. **Identical Partitioner Strategy**: If upstream services use custom partitioners (e.g. partition by tenant ID while streams keys by user ID), co-partitioning is broken even with identical partition counts.
- **Fix**: Force repartitioning via `.repartition(Repartitioned.as("orders-repartition").withNumberOfPartitions(8))` before joining.

#### 2. Asymmetric Window Boundaries (`before()` vs `after()`)
In `KStream-KStream` joins, timestamps define whether records join:
- `JoinWindows.ofTimeDifferenceWithGrace(Duration.ofMinutes(5), Duration.ofSeconds(30))` creates a symmetric window:
  $$t_{\text{order}} - 5\text{m} \le t_{\text{payment}} \le t_{\text{order}} + 5\text{m}$$
- **Asymmetric Realities**: In real-world payment flows, payments *almost always happen after* orders, never before:
  ```java
  // Asymmetric window: payment can arrive up to 10 minutes AFTER order,
  // but at most 30 seconds BEFORE order (clock skew tolerance)
  JoinWindows asymmetricWindow = JoinWindows.ofTimeDifferenceAndGrace(Duration.ofMinutes(10), Duration.ofMinutes(1))
      .before(Duration.ofSeconds(30))
      .after(Duration.ofMinutes(10));
  ```

#### 3. Late-Arriving Records & Grace Period Drops
- If an event arrives whose timestamp is older than:
  $$t_{\text{current\_stream\_time}} - (\text{windowSize} + \text{gracePeriod})$$
  Kafka Streams drops the record from the join entirely!
- Dropped records are **not** routed to standard output or error topics by default.
- **How to verify**: Monitor the JMX metric `kafka.streams:type=stream-processor-node-metrics,processor-node-id=*,client-id=*,dropped-records-total`. If this gauge is rising, increase your grace period or investigate upstream network latency.

---

## 14. Interactive Queries

Interactive Queries allow external services to query Kafka Streams state stores directly — turning your Kafka Streams application into a queryable, real-time materialized view.

### Local Store Query

```java
@RestController
@RequiredArgsConstructor
public class OrderSummaryController {

    private final KafkaStreams streams;

    @GetMapping("/api/orders/summary/{customerId}")
    public ResponseEntity<CustomerOrderSummary> getSummary(@PathVariable String customerId) {
        // Query the local state store directly — sub-millisecond O(1) lookup
        ReadOnlyKeyValueStore<String, CustomerOrderSummary> store =
            streams.store(StoreQueryParameters.fromNameAndType(
                "customer-summary-store",
                QueryableStoreTypes.keyValueStore()
            ));

        CustomerOrderSummary summary = store.get(customerId);
        if (summary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/api/orders/all-summaries")
    public ResponseEntity<List<CustomerOrderSummary>> getAllSummaries() {
        ReadOnlyKeyValueStore<String, CustomerOrderSummary> store =
            streams.store(StoreQueryParameters.fromNameAndType(
                "customer-summary-store",
                QueryableStoreTypes.keyValueStore()
            ));

        List<CustomerOrderSummary> results = new ArrayList<>();
        try (KeyValueIterator<String, CustomerOrderSummary> iter = store.all()) {
            iter.forEachRemaining(kv -> results.add(kv.value));
        }
        return ResponseEntity.ok(results);
    }
}
```

### Distributed Query (Querying Across All Instances)

State is distributed across instances — each instance holds only its assigned partitions. To query a key that might be on a different instance, you need to route the query:

```java
@GetMapping("/api/orders/summary/{customerId}")
public ResponseEntity<CustomerOrderSummary> getSummaryDistributed(
        @PathVariable String customerId,
        HttpServletRequest request) throws Exception {

    // Find which instance hosts the partition for this key
    KeyQueryMetadata metadata = streams.queryMetadataForKey(
        "customer-summary-store",
        customerId,
        Serdes.String().serializer()
    );

    HostInfo activeHost = metadata.activeHost();
    String thisHost = myHostname();

    if (activeHost.host().equals(thisHost)) {
        // This instance has the data — serve locally
        ReadOnlyKeyValueStore<String, CustomerOrderSummary> store =
            streams.store(StoreQueryParameters.fromNameAndType(
                "customer-summary-store",
                QueryableStoreTypes.keyValueStore()
            ));
        return ResponseEntity.ok(store.get(customerId));

    } else {
        // Forward request to the correct instance via HTTP
        String forwardUrl = "http://" + activeHost.host() + ":" + activeHost.port()
            + "/api/orders/summary/" + customerId + "?local=true";
        return restTemplate.getForEntity(forwardUrl, CustomerOrderSummary.class);
    }
}
```

**Discovery via `streams.allMetadataForStore()`:**

```java
// Get the host responsible for each partition of a store
Collection<StreamsMetadata> metadata = streams.allMetadataForStore("customer-summary-store");
metadata.forEach(m -> log.info("Host {} holds partitions {}", m.hostInfo(), m.topicPartitions()));
```

---

## 15. Spring Boot Integration

There are two distinct ways to run Kafka Streams in Spring Boot: **Spring for Apache Kafka (`spring-kafka`)** and **Spring Cloud Stream (KStream binder)**. Both run the exact same `kafka-streams` client library under the hood, but their architecture, configuration, and abstraction levels differ fundamentally.

### Two Libraries, One Engine

| Dimension | Spring for Apache Kafka (`spring-kafka`) | Spring Cloud Stream (KStream Binder) |
|:---|:---|:---|
| **Programming Model** | Explicit `StreamsBuilder` topology DAG | Functional `java.util.function.Function<KStream, KStream>` |
| **Topic Binding** | Explicit in code (`builder.stream()`, `stream.to()`) | Declarative in `application.yml` (`spring.cloud.stream.bindings.*`) |
| **Configuration Namespace** | `spring.kafka.streams.*` | `spring.cloud.stream.kafka.streams.binder.*` |
| **Lifecycle Manager** | `StreamsBuilderFactoryBean` | Spring Cloud Stream Binder lifecycle |
| **Topology Control** | Full, granular control over every processor node | Abstracted away; declarative input/output bindings |
| **Interactive Queries** | Direct access via `factoryBean.getKafkaStreams()` | Complex; requires accessing underlying queryable state |
| **Best Fit** | High-performance stateful topologies, complex joins, interactive queries | Microservice event meshes, multi-binder architectures |

---

### Approach 1: Spring for Apache Kafka (`spring-kafka`)

Add `spring-kafka` and annotate your configuration with `@EnableKafkaStreams`. Spring auto-configures a `StreamsBuilderFactoryBean` that manages the lifecycle (`start()` / `stop()`) of the underlying `KafkaStreams` instance.

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

#### Application Configuration (`application.yml`)

```yaml
spring:
  kafka:
    bootstrap-servers: broker1:9092,broker2:9092
    streams:
      application-id: order-processing-service
      properties:
        # Mandatory since Kafka 3.0+ (KIP-741): no default serdes provided!
        default.key.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
        default.value.serde: org.springframework.kafka.support.serializer.JsonSerde
        spring.json.trusted.packages: "com.example.orders.model"
        
        # Performance and Resilience
        processing.guarantee: exactly_once_v2
        num.stream.threads: 4
        num.standby.replicas: 1
        commit.interval.ms: 100
        cache.max.bytes.buffering: 67108864 # 64 MB
        state.dir: /var/data/kafka-streams/state
        rocksdb.config.setter: com.example.config.CustomRocksDBConfigSetter
```

:::caution[The Kafka 3.0+ Missing Default Serdes Trap]
Prior to Apache Kafka 3.0, Kafka provided default serdes for keys and values. Starting with Kafka 3.0 (KIP-741), **default serdes were completely removed**.
If you do not configure `spring.kafka.streams.properties[default.key.serde]` and `[default.value.serde]`, or omit explicit `Consumed.with(...)` parameters, your Spring Boot context fails to start with:
`org.apache.kafka.common.config.ConfigException: Missing required configuration "default.key.serde"`.
:::

#### Defining Topologies Across Multiple `@Bean` Methods

In `spring-kafka`, you can declare one or more `@Bean` methods that inject `StreamsBuilder`. Spring combines all these beans into the **exact same underlying `StreamsBuilder`**:

```java
@Configuration
@EnableKafkaStreams
public class OrderStreamTopologyConfig {

    @Bean
    public KStream<String, Order> orderPipeline(StreamsBuilder builder,
                                                JsonSerde<Order> orderSerde,
                                                JsonSerde<EnrichedOrder> enrichedSerde) {
        KStream<String, Order> orders = builder.stream("orders-raw",
            Consumed.with(Serdes.String(), orderSerde).withName("source-orders-raw"));

        orders
            .filter((k, v) -> v.isValid(), Named.as("filter-valid-orders"))
            .mapValues(Order::enrich, Named.as("enrich-orders"))
            .to("orders-enriched", Produced.with(Serdes.String(), enrichedSerde));

        return orders;
    }

    @Bean
    public KTable<String, Long> userStatsPipeline(StreamsBuilder builder) {
        return builder.table("user-logins",
            Consumed.with(Serdes.String(), Serdes.Long()).withName("source-user-logins"),
            Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("user-logins-store")
                .withKeySerde(Serdes.String())
                .withValueSerde(Serdes.Long()));
    }
}
```

When Spring refreshes its application context, `StreamsBuilderFactoryBean.start()` calls `builder.build()`, synthesizing both `orderPipeline` and `userStatsPipeline` into a **single unified `Topology` DAG** executed by the same thread pool.

#### Lifecycle Customization & Error Handling

Use `StreamsBuilderFactoryBeanCustomizer` (or `StreamsBuilderFactoryBeanConfigurer`) to intercept lifecycle states and stream thread crashes:

```java
@Configuration
@Slf4j
public class StreamsLifecycleConfig {

    @Bean
    public StreamsBuilderFactoryBeanCustomizer customizer(MeterRegistry meterRegistry) {
        return factoryBean -> {
            // Track state transitions (REBALANCING -> RUNNING -> ERROR)
            factoryBean.setStateListener((newState, oldState) -> {
                log.info("Kafka Streams State Transition: {} -> {}", oldState, newState);
                meterRegistry.gauge("kafka.streams.state", newState.ordinal());
                if (newState == KafkaStreams.State.ERROR) {
                    log.error("💥 Kafka Streams entered ERROR state! Triggering alert...");
                }
            });

            // Handle uncaught exceptions in StreamThreads (KIP-663)
            factoryBean.setStreamsUncaughtExceptionHandler(exception -> {
                log.error("Uncaught exception in StreamThread", exception);
                // REPLACE_THREAD: restart only the crashed thread (keeps instance alive)
                // SHUTDOWN_CLIENT: terminate this KafkaStreams instance (forces rebalance)
                // SHUTDOWN_APPLICATION: terminate all instances in the consumer group
                return StreamsUncaughtExceptionHandler.StreamThreadExceptionResponse.REPLACE_THREAD;
            });
        };
    }
}
```

#### Accessing `KafkaStreams` for Interactive Queries Safely

```java
@RestController
@RequiredArgsConstructor
public class InteractiveQueryController {

    private final StreamsBuilderFactoryBean factoryBean;

    @GetMapping("/api/users/{userId}/logins")
    public ResponseEntity<?> getUserLogins(@PathVariable String userId) {
        KafkaStreams streams = factoryBean.getKafkaStreams();

        // 1. Null check: streams is null before context refresh and after stop()
        if (streams == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Streams initializing");
        }

        // 2. State check: store() throws InvalidStateStoreException unless state == RUNNING
        if (streams.state() != KafkaStreams.State.RUNNING) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Streams not ready (current state: " + streams.state() + ")");
        }

        ReadOnlyKeyValueStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType("user-logins-store", QueryableStoreTypes.keyValueStore())
        );

        Long count = store.get(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "logins", count != null ? count : 0L));
    }
}
```

---

### Approach 2: Spring Cloud Stream Functional Binder

Spring Cloud Stream inverts the paradigm: you do not touch `StreamsBuilder` directly. You write a standard `java.util.function.Function` bean, and the binder wires inputs and outputs declaratively based on `application.yml`:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-stream-binder-kafka-streams</artifactId>
</dependency>
```

#### Functional Pipeline Bean

```java
@Configuration
public class FunctionalStreamConfig {

    @Bean
    public Function<KStream<String, Order>, KStream<String, EnrichedOrder>> processOrders() {
        return input -> input
            .filter((k, v) -> v.isValid())
            .mapValues(Order::enrich);
    }
}
```

#### Declarative Topic Bindings (`application.yml`)

```yaml
spring:
  cloud:
    function:
      definition: processOrders
    stream:
      bindings:
        processOrders-in-0:
          destination: orders-raw
        processOrders-out-0:
          destination: orders-enriched
      kafka:
        streams:
          binder:
            application-id: functional-order-service
            brokers: localhost:9092
            configuration:
              processing.guarantee: exactly_once_v2
              default.key.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
              default.value.serde: org.springframework.kafka.support.serializer.JsonSerde
```

:::danger[Obsolete API Warning]
The legacy `@EnableBinding` and `@StreamListener` annotations were **completely removed in Spring Cloud Stream 4.0**. Any tutorial or code using `@StreamListener` is obsolete. Always use the modern `java.util.function.Function`, `Consumer`, or `Supplier` functional model.
:::

---

## 16. Production Engineering Patterns & Runbook

### 16.1 Modern Processor API (PAPI 3.x+) & Wall-Clock Punctuator

While the High-Level DSL (`map`, `filter`, `join`) covers 90% of use cases, complex stateful workflows (custom sessionizing, deduplication, state TTL, dynamic routing) require the **Processor API (PAPI)**.

Modern Kafka Streams (3.0+) uses `org.apache.kafka.streams.processor.api.Processor<KIn, VIn, KOut, VOut>` and `Record<K, V>`:

```java
import org.apache.kafka.streams.processor.api.ContextualProcessor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;
import org.apache.kafka.streams.state.KeyValueStore;
import org.apache.kafka.streams.processor.PunctuationType;
import java.time.Duration;

public class OrderAggregationProcessor extends ContextualProcessor<String, Order, String, CustomerSummary> {

    private KeyValueStore<String, CustomerSummary> stateStore;

    @Override
    public void init(ProcessorContext<String, CustomerSummary> context) {
        super.init(context);
        this.stateStore = context.getStateStore("customer-summary-store");

        // Schedule Punctuator: fires every 60 seconds of WALL-CLOCK time
        // (Runs independently of whether new records arrive on this partition!)
        context.schedule(Duration.ofSeconds(60), PunctuationType.WALL_CLOCK_TIME, currentTimestamp -> {
            log.info("Wall-clock punctuation tick at timestamp: {}", currentTimestamp);
            // Scan state, flush pending summaries, or purge expired records
        });

        // Contrast: PunctuationType.STREAM_TIME advances ONLY when records with newer timestamps arrive.
        // On idle partitions, STREAM_TIME freezes and never triggers!
    }

    @Override
    public void process(Record<String, Order> record) {
        CustomerSummary summary = stateStore.get(record.key());
        if (summary == null) {
            summary = new CustomerSummary(record.key());
        }
        summary.addOrder(record.value());
        stateStore.put(record.key(), summary);

        // Forward transformed record downstream with preserved headers and timestamp
        context().forward(record.withValue(summary));
    }
}
```

#### Attaching PAPI to the DSL
Integrate custom processors directly into a DSL pipeline via `.process()`:

```java
KStream<String, Order> orders = builder.stream("orders-raw");

orders.process(
    OrderAggregationProcessor::new,
    Named.as("process-customer-summary"),
    "customer-summary-store" // Declare state stores accessed by the processor
).to("customer-summaries");
```

---

### 16.2 Production Event Deduplication Pattern

In high-throughput distributed systems, upstream retries or non-idempotent producers can produce duplicate events. You can implement an **idempotent deduplication filter** using the Processor API and a `WindowStore`:

```java
public class EventDeduplicationProcessor<K, V> extends ContextualProcessor<K, V, K, V> {

    private WindowStore<String, Long> dedupStore;
    private final Duration dedupWindow;

    public EventDeduplicationProcessor(Duration dedupWindow) {
        this.dedupWindow = dedupWindow;
    }

    @Override
    public void init(ProcessorContext<K, V> context) {
        super.init(context);
        this.dedupStore = context.getStateStore("dedup-store");
    }

    @Override
    public void process(Record<K, V> record) {
        String eventId = extractEventId(record); // Unique event ID from payload or header
        long recordTime = record.timestamp();

        // Query window store: did we see this eventId within [recordTime - window, recordTime + window]?
        Long previousTime = dedupStore.fetch(eventId, recordTime);

        if (previousTime != null) {
            // Duplicate detected! Drop record and increment drop metric
            log.warn("Dropping duplicate event [{}] seen previously at {}", eventId, previousTime);
            return;
        }

        // New event: record into store and forward downstream
        dedupStore.put(eventId, recordTime, recordTime);
        context().forward(record);
    }

    private String extractEventId(Record<K, V> record) {
        // Extract from Kafka Header or payload ID
        org.apache.kafka.common.header.Header header = record.headers().lastHeader("X-Event-ID");
        return (header != null) ? new String(header.value()) : record.key().toString();
    }
}
```

```java
// Registering in StreamsBuilder:
StoreBuilder<WindowStore<String, Long>> dedupStoreBuilder = Stores.windowStoreBuilder(
    Stores.persistentWindowStore("dedup-store", Duration.ofHours(2), Duration.ofHours(2), false),
    Serdes.String(), Serdes.Long()
);
builder.addStateStore(dedupStoreBuilder);

stream.process(() -> new EventDeduplicationProcessor<>(Duration.ofHours(2)),
    Named.as("dedup-filter"), "dedup-store")
    .to("deduped-output");
```

---

### 16.3 Dead Letter Queue (DLQ) & Deserialization Exception Handling

When a corrupt, malformed, or schema-incompatible record lands on an input topic, deserialization happens **before the record enters the topology**.
- **Default Behavior (`LogAndFailExceptionHandler`)**: The stream thread crashes immediately with `SerializationException`.
- **Naive Fallback (`LogAndContinueExceptionHandler`)**: The corrupted record is dropped with a log warning. **Fatal production hazard**: silent data loss without auditability!

#### Production Solution: Custom DLQ Deserialization Exception Handler
Route poison pills to a Dead Letter Queue (DLQ) topic via a dedicated `KafkaProducer`, stamping diagnostic error headers:

```java
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.apache.kafka.streams.errors.DeserializationExceptionHandler;
import org.apache.kafka.streams.processor.ProcessorContext;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class ProductionDlqDeserializationHandler implements DeserializationExceptionHandler {

    private KafkaProducer<byte[], byte[]> dlqProducer;
    private String dlqTopicName;

    @Override
    public void configure(Map<String, ?> configs) {
        this.dlqTopicName = (String) configs.getOrDefault("dlq.topic.name", "streams-dlq");
        this.dlqProducer = new KafkaProducer<>(configs);
    }

    @Override
    public DeserializationHandlerResponse handle(ProcessorContext context,
                                                ConsumerRecord<byte[], byte[]> record,
                                                Exception exception) {
        ProducerRecord<byte[], byte[]> dlqRecord = new ProducerRecord<>(
            dlqTopicName,
            record.partition(),
            record.timestamp(),
            record.key(),
            record.value()
        );

        // Attach diagnostic error headers for debugging and replay
        dlqRecord.headers().add(new RecordHeader("x-orig-topic", record.topic().getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-orig-partition", String.valueOf(record.partition()).getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-orig-offset", String.valueOf(record.offset()).getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-error-class", exception.getClass().getName().getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-error-msg", (exception.getMessage() != null ? exception.getMessage() : "null").getBytes(StandardCharsets.UTF_8)));

        // Synchronously or asynchronously dispatch to DLQ
        dlqProducer.send(dlqRecord);

        // Instruct Streams to acknowledge and continue processing the partition
        return DeserializationHandlerResponse.CONTINUE;
    }

    @Override
    public void close() {
        if (dlqProducer != null) {
            dlqProducer.close();
        }
    }
}
```

Enable in `application.yml`:
```yaml
spring.kafka.streams.properties:
  default.deserialization.exception.handler: com.example.kafka.ProductionDlqDeserializationHandler
  dlq.topic.name: dead-letter-orders
```

---

### 16.4 The Async Processing Anti-Pattern (Network I/O in Streams)

A common temptation among engineers migrating from Spring Web or microservices is placing non-blocking asynchronous calls (`CompletableFuture`, WebClient, reactive `Mono`) inside `.map()`, `.peek()`, or a Processor:

```java
// ❌ DANGEROUS ANTI-PATTERN: Asynchronous HTTP / DB call in stream loop
stream.mapValues(order -> {
    return httpClient.post()
        .uri("https://payment-gateway/v1/charge")
        .bodyValue(order)
        .retrieve()
        .bodyToMono(PaymentResult.class); // Returns Mono<PaymentResult>!
});
```

#### Why Async Calls Destroy Kafka Streams
1. **Uncompleted Futures & Data Loss**: The stream thread cannot await external reactive publishers. Offsets are committed immediately upon returning from the processor. If the external async operation fails 2 seconds later or the pod restarts, **the event is lost forever**.
2. **Blocking Futures (`future.get()`) Destroys Throughput**: If you block the stream thread synchronously (`Mono.block()` or `future.get(50, TimeUnit.MILLISECONDS)`), a single 50ms latency hop limits the thread's maximum throughput to $1000\text{ms} / 50\text{ms} = 20\text{ records/second}$!
3. **Heartbeat Failure & Rebalance Storm**: If an external database slows down or times out, the stream thread blocks beyond `max.poll.interval.ms` (default: 5 minutes). The broker coordinator assumes the consumer died, evicts it from the group, and triggers an infinite cluster rebalance loop!

#### Proper Architectural Solutions:
1. **Parallel Consumer Pattern**: Offload I/O to a dedicated Kafka Consumer fleet using Confluent Parallel Consumer with key-based concurrent worker pools.
2. **Transactional Outbox / Database CDC**: Have upstream services commit to local databases, use Debezium to stream the WAL into Kafka, and keep Kafka Streams 100% compute-only.
3. **Decoupled Kafka Topics**: Write requests to a `payment-requests` topic, process them with a horizontally scalable stateless worker fleet, and produce responses to a `payment-responses` topic for Kafka Streams to join.

---

### 16.5 Serdes & Schema Registry Integration

For production pipelines using Avro, Protobuf, or JSON Schema, integrate with Confluent or Apicurio Schema Registry:

```java
Map<String, Object> serdeConfig = Map.of(
    AbstractKafkaSchemaSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, "http://schema-registry:8081",
    AbstractKafkaSchemaSerDeConfig.AUTO_REGISTER_SCHEMAS, "false", // CI/CD controls schema versions
    KafkaAvroSerializerConfig.SPECIFIC_AVRO_READER_CONFIG, "true"
);

SpecificAvroSerde<OrderEvent> orderSerde = new SpecificAvroSerde<>();
orderSerde.configure(serdeConfig, false); // false = value serde

KStream<String, OrderEvent> stream = builder.stream("orders-avro",
    Consumed.with(Serdes.String(), orderSerde));
```

---

### 16.6 Testing Topologies with `TopologyTestDriver`

Unit testing Kafka Streams does not require a Kafka cluster, Zookeeper, KRaft, or Docker containers. Use `TopologyTestDriver` for **100% deterministic, in-memory, synchronous test execution**:

```java
public class OrderTopologyTest {

    private TopologyTestDriver driver;
    private TestInputTopic<String, String> inputTopic;
    private TestOutputTopic<String, Long> outputTopic;

    @BeforeEach
    void setup() {
        StreamsBuilder builder = new StreamsBuilder();
        new WordCountTopology().buildPipeline(builder);

        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "test-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:1234");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass().getName());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass().getName());

        driver = new TopologyTestDriver(builder.build(), props);
        inputTopic = driver.createInputTopic("words-input", new StringSerializer(), new StringSerializer());
        outputTopic = driver.createOutputTopic("words-output", new StringDeserializer(), new LongDeserializer());
    }

    @AfterEach
    void tearDown() {
        driver.close();
    }

    @Test
    void shouldCountWordsCorrectly() {
        inputTopic.pipeInput("k1", "apple banana apple");

        Map<String, Long> results = outputTopic.readKeyValuesToMap();
        assertEquals(2L, results.get("apple"));
        assertEquals(1L, results.get("banana"));
    }

    @Test
    void shouldTestWindowClosingWithExplicitTimestamps() {
        Instant t0 = Instant.parse("2026-06-08T10:00:00Z");
        inputTopic.pipeInput("user1", "login", t0);
        inputTopic.pipeInput("user1", "action", t0.plus(Duration.ofMinutes(45)));

        // Output remains empty because window is still open!
        assertTrue(outputTopic.isEmpty());

        // Advance stream-time past window end (11:00) + grace (5m)
        inputTopic.pipeInput("user1", "heartbeat", t0.plus(Duration.ofMinutes(66)));

        // Window closes, verified!
        assertFalse(outputTopic.isEmpty());
    }
}
```

---

### 16.7 Production Monitoring & Key Observability Metrics

Monitor Kafka Streams applications through JMX and Micrometer metrics. The most critical operational signals are:

| Metric Name | Subsystem | Alert Threshold | Operational Meaning |
|:---|:---|:---|:---|
| `record-e2e-latency-avg` | Processor Node | Spike $> 2000\text{ms}$ | Time from initial producer timestamp to processing completion. Indicates pipeline lag. |
| `process-rate` | Stream Thread | Drop to 0 records/s | Processing throughput per thread. Zero indicates rebalance storm or stall. |
| `commit-latency-avg` | Stream Thread | $> 200\text{ms}$ | Time spent flushing state stores and committing transactions to brokers. |
| `active-process-ratio` | Stream Thread | $< 0.10$ or $> 0.95$ | Fraction of time spent actively processing vs polling. High = CPU bottleneck; Low = idle. |
| `dropped-records-total` | Stream Node | $> 0$ | Records dropped due to grace period expiration or deserialization errors. |
| `block-cache-hit-ratio` | RocksDB | $< 0.85$ | Cache hits in off-heap memory. Low ratio triggers heavy NVMe disk read I/O. |
| `memtable-flush-pending` | RocksDB | $> 2$ | Pending memtables waiting to write to disk. Risk of write stall. |

---

## 17. Kafka Streams Anti-Patterns Checklist

Before deploying any Kafka Streams application to production, audit your codebase against these seven fatal anti-patterns:

```
┌────────────────────────────────────────────────────────────────────────┐
│ The 7 Fatal Kafka Streams Anti-Patterns:                               │
│ 1. ❌ Synchronous or Reactive Network I/O inside .map() / .peek()      │
│ 2. ❌ Unbounded KeyValueStore without TTL or purge punctuator          │
│ 3. ❌ Using .map() when only values change (triggers unnecessary topic)│
│ 4. ❌ Relying on Wall-Clock Time instead of Event-Time for aggregations│
│ 5. ❌ Static Singletons / Thread-Unsafe state shared across threads    │
│ 6. ❌ Anonymous operator IDs in production topologies (naming shift)   │
│ 7. ❌ Mixing Spring Cloud Stream and @EnableKafkaStreams in one app     │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Network I/O in the Stream Thread**: Performing HTTP, gRPC, or external SQL lookups inside stream processors blocks event loops, breaks EOS guarantees, and risks `max.poll.interval.ms` rebalance evictions.
2. **Unbounded State Stores**: Registering persistent `KeyValueStore` instances without retention periods or purging logic causes infinite disk growth and hours-long cold restore times.
3. **Unnecessary Key Mutations**: Using `.map()` or `.selectKey()` when only values are transformed forces Kafka Streams to provision an internal repartition topic, adding network hops and disk write overhead. Always prefer `.mapValues()`.
4. **Wall-Clock Time Reliance**: Using `System.currentTimeMillis()` for windowing rather than event timestamps produces non-deterministic results during replays and rebalances.
5. **Shared Mutable State**: Sharing HashMap instances or mutable caches between stream threads without thread safety causes race conditions, corrupted state, and intermittent JVM segfaults.
6. **Anonymous Operator Naming**: Omitting `Named.as()` and `Materialized.as()` exposes your application to catastrophic state store invalidation on code deployment.
7. **Mixing Spring Stacks**: Combining `@EnableKafkaStreams` and Spring Cloud Stream functional binders creates conflicting lifecycle managers fighting over client startup.

---

## 18. Kafka Streams vs Alternatives

Choosing between Kafka Streams, Apache Flink, Apache Spark, ksqlDB, and the raw Consumer API depends on operational boundaries, latency requirements, and data architecture:

| Dimension | Kafka Streams | Apache Flink | Apache Spark Structured Streaming | ksqlDB | Raw Consumer API (Parallel Consumer) |
|:---|:---|:---|:---|:---|:---|
| **Architecture** | **Embedded Java Library** (runs in microservice) | **Distributed Cluster** (JobManager + TaskManager) | **Distributed Cluster** (Driver + Executors) | **Distributed Server Engine** (built on Kafka Streams) | **Embedded Client Library** |
| **Operational Overhead** | **Lowest** (standard container CI/CD, no cluster) | **High** (dedicated Flink cluster, Kubernetes operator) | **High** (Spark cluster, YARN/K8s resource management) | **Medium** (separate server cluster to monitor) | **Lowest** (microservice) |
| **Latency** | **Sub-millisecond** (Continuous record-by-record) | **Sub-millisecond** (Continuous streaming engine) | **100ms - 1s** (Micro-batch by default) | **Sub-millisecond** (Continuous) | **Sub-millisecond** (Continuous) |
| **State Storage** | Embedded RocksDB / Heap | RocksDB / Heap (checkpointed to S3/HDFS) | Memory / RocksDB (checkpointed to HDFS) | Embedded RocksDB via Kafka Streams | External DB only (Stateless client) |
| **Fault Recovery** | Local disk `.checkpoint` + Kafka compacted changelog | Distributed Chandy-Lamport state snapshots to object storage | Lineage graph + WAL replay from object storage | Kafka compacted changelog | Offset replay from Kafka broker |
| **Event-Time & Watermarks** | Event-time windows + grace period + Stream-Time | Advanced event-time watermarking & timers | Watermarks with micro-batch trigger | Event-time windowing via Streams DSL | Custom application implementation |
| **Dynamic SQL Engine** | ❌ None (Pure Java/Scala DSL + PAPI) | ✅ First-class Flink SQL | ✅ First-class Spark SQL | ✅ SQL-first (REST API driven) | ❌ None |
| **Elastic Autoscaling** | Partition-bounded ($N \le \text{partitions}$) | Dynamic task slot scaling via JobManager | Dynamic executor allocation | Partition-bounded | Key-hash concurrent threads ($N > \text{partitions}$) |
| **Best Fit** | Stateful event-driven microservices, CQRS materialized views, low-ops Java teams | Large-scale complex event processing (CEP), cross-cluster analytics | Unified batch + stream processing, ML feature engineering | Rapid SQL analytics, Kafka-native stream ETL | Stateless asynchronous I/O, external REST/DB calls |

---

## 19. When to Use (and Not Use) Kafka Streams

### Use Kafka Streams When

```
✅ You need stateful stream processing (aggregations, joins, windowing)
   and your state fits on local disk (RocksDB scales to TB)

✅ Your processing topology is relatively stable — not dynamically generated

✅ You want operational simplicity — no separate cluster to manage,
   deploy as a standard microservice

✅ Your team already operates Kafka — Kafka Streams adds zero new infrastructure

✅ You need exactly-once semantics within the Kafka ecosystem
   (EXACTLY_ONCE_V2 + read_committed consumers)

✅ Data volume scales with partition count — horizontal scale is free

✅ You need queryable state (Interactive Queries) without a separate store
```

### Do NOT Use Kafka Streams When

```
❌ Processing logic requires joining against very large, frequently changing
   external databases (RDB, Cassandra) — the join must be in Kafka or a GlobalKTable
   Large GlobalKTable = high memory per instance

❌ Your topology changes frequently at runtime — topology is fixed at build time
   (use Kafka consumer + custom routing for dynamic pipelines)

❌ You need SQL-based ad-hoc queries over event streams — use ksqlDB or Apache Flink

❌ Your state exceeds what local disk can hold AND you have many instances
   (horizontal scale helps if you partition correctly, but very large state
    per partition requires very large disks per instance)

❌ Sub-millisecond event-time precision across distributed producers is required
   (clock skew + network jitter make exact event-time ordering impossible)

❌ You need batch processing of historical data — Kafka Streams is stream-first;
   use Spark or Flink for historical batch jobs
```

---

## 20. Production System Design Examples

### Example 1 — Real-Time Fraud Detection

```java
// Design: detect users making > 5 purchases in 10 minutes
KStream<String, Transaction> transactions = builder.stream("transactions");

KTable<Windowed<String>, Long> txCounts = transactions
    .groupByKey(Grouped.as("group-by-user"))
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(10), Duration.ofMinutes(1)))
    .count(
        Named.as("count-user-transactions"),
        Materialized.as("user-tx-count-store")
    )
    .suppress(Suppressed.untilWindowCloses(
        Suppressed.BufferConfig.maxBytes(100 * 1024 * 1024L)
    ));

// Alert when count exceeds threshold
txCounts.toStream()
    .filter((windowedKey, count) -> count != null && count > 5)
    .map((windowedKey, count) -> KeyValue.pair(
        windowedKey.key(),
        FraudAlert.of(windowedKey.key(), count, windowedKey.window())
    ))
    .to("fraud-alerts", Produced.with(Serdes.String(), fraudAlertSerde));
```

### Example 2 — Order Enrichment Pipeline

```java
// Design: enrich every order with product and customer details before publishing
GlobalKTable<String, Product> products = builder.globalTable("products",
    Materialized.as("product-lookup-store"));

KTable<String, Customer> customers = builder.table("customers",
    Consumed.with(Serdes.String(), customerSerde),
    Materialized.as("customer-store"));

KStream<String, Order> orders = builder.stream("orders-raw");

orders
    .join(products,
        (key, order) -> order.getProductId(),
        (order, product) -> order.withProduct(product),
        Named.as("join-product"))
    .join(customers,
        (order, customer) -> order.withCustomer(customer),
        Joined.<String, Order, Customer>as("join-customer")
            .withKeySerde(Serdes.String()))
    .to("orders-enriched");
```

### Example 3 — CQRS Read Model Builder

```java
// Design: maintain a real-time queryable view of order summaries per customer
KStream<String, OrderEvent> events = builder.stream("order-events");

KTable<String, OrderReadModel> readModel = events
    .groupByKey(Grouped.as("group-by-customer"))
    .aggregate(
        OrderReadModel::empty,
        (customerId, event, model) -> model.applyEvent(event),
        Named.as("build-order-read-model"),
        Materialized.<String, OrderReadModel, KeyValueStore<Bytes, byte[]>>
            as("order-read-model-store")
            .withKeySerde(Serdes.String())
            .withValueSerde(readModelSerde)
    );

// Expose via Interactive Queries for REST API queries
// -> customers can query their order history in real-time with sub-ms latency
```

---

## 21. Failure Scenarios & Mitigation Matrix

| Scenario | What Happens | Latency Impact | Mitigation |
|:---|:---|:---|:---|
| **Instance crash** | Consumer group rebalance; tasks reassigned; state rebuilt from changelog | Downtime proportional to unrebuildable state | Standby replicas (`NUM_STANDBY_REPLICAS`), Cooperative Sticky Assignor |
| **Rebalance (new instance joins)** | Task redistribution; incremental migration | Sub-second pause for migrating tasks only | Cooperative Sticky Assignor, standby replicas, tuned `probing.rebalance.interval.ms` |
| **Large state cold restore** | Full changelog replay from beginning | Minutes to hours | Windowing + TTL to limit state size; persistent volume checkpoints; NVMe SSDs |
| **Topology naming shift on deploy** | State store name mismatch; full state rebuild; orphaned topics | Extended startup latency | Explicit `Named.as()` and `Materialized.as()` on all operators |
| **Rolling deploy with topology mismatch** | V1 and V2 tasks incompatible; infinite rebalance loop | Total processing stoppage | Blue-green deploy; decouple K8s liveness probes; append-only evolution |
| **Zombie task (pre-fence)** | Stale instance writes after eviction | Duplicate output | `EXACTLY_ONCE_V2` fences zombie producers via epoch |
| **Changelog topic lag during restore** | State behind changelog; data inconsistency window | Degraded accuracy during restore | Monitor `commit-latency-avg`; alert on restore lag via `StateRestoreListener` |
| **Repartition topic growth** | Internal topics fill disk; partition exhaustion | Processing failure if Kafka cluster full | Topic retention policies; monitor internal topic sizes |
| **Idle partition suppresses output** | Stream-time halts; window close never triggered | Silent pipeline halt | Pulse/heartbeat topic or Processor API `WALL_CLOCK_TIME` Punctuator |
| **RocksDB Cgroup OOMKilled** | Native C++ memory balloons beyond container limit | CrashLoopBackOff | Enforce shared block cache and write buffer manager via `RocksDBConfigSetter` |

---

## 22. Interview Questions — Senior Level

**Q: Why does `suppress(untilWindowCloses)` emit nothing on an idle or low-traffic partition?**

> `suppress(untilWindowCloses)` evaluates window closure strictly using **Stream-Time**, which is the maximum record timestamp processed so far by that task. It does **not** look at the system wall-clock. A window `[10:00 - 11:00]` with a 5-minute grace period closes only when a record stamped $\ge 11:05$ arrives on that partition. If the stream goes idle at 10:58, Stream-Time freezes at 10:58 forever. Even if hours of wall-clock time pass, the window never closes and the suppressed result is never emitted. To fix this on quiet partitions, you must either inject synthetic heartbeat records to advance stream-time, or abandon `suppress` in favor of a Processor API `WALL_CLOCK_TIME` Punctuator that flushes expired windows on a fixed real-time schedule.

**Q: How do you prevent RocksDB off-heap memory from crashing a Kubernetes pod with Exit Code 137 (`OOMKilled`)?**

> Each state store in each active task creates its own independent native RocksDB C++ instance with separate Block Cache and MemTables outside the JVM heap. With multiple tasks and state stores, total native allocations frequently exceed the container cgroup memory limit, causing Kubernetes to issue `SIGKILL (Exit Code 137)`. The solution is implementing a custom `RocksDBConfigSetter` that instantiates a static, shared `org.rocksdb.Cache` (e.g. 384MB) and a shared `org.rocksdb.WriteBufferManager` (e.g. 128MB). Every state store instance is configured to share these singletons, strictly bounding total native off-heap memory across the entire process to a fixed budget.

**Q: How does the Cooperative Sticky Assignor prevent "stop-the-world" freezes during cluster scaling?**

> Legacy Eager Rebalancing forced all group members to revoke all partitions simultaneously, halting processing across the entire fleet until assignment completed. The **Cooperative Sticky Assignor** uses incremental rebalancing: only the specific tasks migrating to another node are paused, while all unaffected tasks continue processing live events without interruption. Furthermore, when migrating a stateful task to a new node, it assigns the task as a warm **Standby Task** first. The new node passively replays the changelog in the background while the old node keeps running the active task. Every `probing.rebalance.interval.ms` (default 10 minutes), a lightweight probing rebalance checks whether the standby is caught up. Once caught up, an instant sub-second hot swap occurs.

**Q: Why can an application with `processing.guarantee=exactly_once_v2` still produce duplicate records for downstream consumers?**

> `EXACTLY_ONCE_V2` only guarantees atomicity within the internal Kafka read-process-write cycle. Duplicates still leak downstream in three scenarios:
> 1. **Downstream consumers lack `isolation.level=read_committed`**: Aborted transactional batches are physically retained in broker partition logs. Consumers using default `read_uncommitted` read both aborted batches and retry batches.
> 2. **External non-transactional side-effects**: If a processor makes HTTP/REST calls, emails, or direct database mutations inside the stream thread, rolling back a Kafka transaction does not roll back the external call. Replaying the input record triggers the HTTP call again.
> 3. **Non-idempotent downstream republishing**: If downstream consumers forward records to external topics without producer idempotence, broker network retries inject duplicates.

**Q: What is the purpose of Spring Kafka's `KafkaStreamBrancher.onTopOf()` and how does merging multiple topology `@Bean` methods work?**

> In `spring-kafka`, `KafkaStreamBrancher` provides a fluent builder pattern to define branching predicates with inline consumer actions, terminating with `.onTopOf(stream)` which attaches the branch definitions onto a base `KStream` and returns it. This avoided legacy Kafka Streams brittle array-indexed `KStream[]` branching before `split()` was introduced.
> When multiple `@Bean` methods in Spring configuration accept `StreamsBuilder builder`, Spring passes the **same shared `StreamsBuilder` instance** to all of them during context initialization. Each bean registers its nodes into this common builder. When `StreamsBuilderFactoryBean.start()` is executed, it invokes `builder.build()`, synthesizing all individual bean pipelines into a **single composite `Topology` object** sharing the same thread pool and `application.id`.

**Q: What is the difference between KStream and KTable?**

> A `KStream` is an unbounded, append-only sequence of independent records — every record is a distinct event. Two records with the same key coexist as separate events. A `KTable` is a changelog stream where each new record for a key replaces the previous value — it materializes the latest known state per key, like a database table. `ZSCORE` in Redis vs a sorted set: KTable gives you the current value for a key; KStream gives you every event that ever happened.

**Q: How does Kafka Streams handle state across restarts?**

> Each state store (RocksDB) is backed by a compacted Kafka changelog topic. On every commit, Kafka Streams writes a checkpoint file recording the changelog offset up to which RocksDB is durable. On restart, Kafka Streams reads the checkpoint, then replays the changelog from that offset forward to rebuild state. This means: recovery time = (changelog records since checkpoint) / replay throughput — not a full replay from the beginning. Standby replicas further reduce this by maintaining near-current copies in shadow tasks.

**Q: What is `EXACTLY_ONCE_V2` and how does it work internally?**

> `EXACTLY_ONCE_V2` wraps each read-process-write cycle in a Kafka transaction. Output records and consumer offset commits are committed atomically — either both happen or neither does. If processing fails before the transaction commits, it's aborted; on restart, the same input records are reprocessed, but no duplicate output is visible to downstream consumers (who must use `isolation.level=read_committed`). V2 uses one transactional producer per stream thread (not per task as V1 did) — fewer producers, better throughput. Zombie fencing uses producer epochs: if a stale instance tries to write, the broker rejects its writes because a new instance has claimed a higher epoch.

**Q: Why does Kafka Streams show a persistent consumer lag of 1 even when caught up?**

> Kafka's exactly-once implementation writes transaction control records (commit/abort markers) to the partition log. These markers increment `LogEndOffset` but are transparent to `read_committed` consumers — they don't count as deliverable records. The consumer's committed offset doesn't advance past these markers until a real data record arrives. So `LogEndOffset - CommittedOffset = 1` is normal and expected in fully-caught-up `exactly_once_v2` applications. Exclude this from lag alerting.

**Q: Why does changing the order of sub-topologies in code cause an infinite rebalance storm during a rolling deployment?**

> Kafka Streams assigns sequential integer IDs to sub-topologies (`0, 1, ...`) based on their declaration order in `StreamsBuilder`. Physical tasks are identified by `TaskId(subTopologyId, partitionId)` (e.g. `0_0`). If you swap the declaration order of two sub-topologies, Task `0_0` changes from consuming Topic A to Topic B. During a rolling update, a `v2` leader assigns Task `0_0` (Topic B) to a `v1` instance, whose local topology expects Task `0_0` to process Topic A. The instance rejects the assignment with a topology mismatch, crashes or leaves the group, triggering another cluster-wide rebalance. Because instances endlessly clash over task definitions, threads never reach the `RUNNING` state and zero records are processed. Furthermore, local RocksDB directories on disk (`/0_0/`) and auto-generated changelog topic names become misaligned with the new task duties.

---

## 23. Summary — The Four Golden Rules

```
Kafka Streams =
  Kafka (Event Log — Source of Truth)
  + RocksDB (Local State — Fast Key-Value Access)
  + Topology (Processing Graph — Transformation Logic)
= Event Sourcing + CQRS + Materialized Views embedded in your application
```

| Rule | Why It Matters |
|:---|:---|
| **State size = recovery time** | Design state to be bounded via windowing, TTL, and selective aggregation |
| **Partition count = max parallelism** | More partitions -> more tasks -> more scale; you cannot exceed partition count |
| **Changelog = source of truth** | Everything needed to reconstruct state is in Kafka; local disk is a cache |
| **Design for failure, not success** | Rebalances and restores are normal events — design your state and topology for fast recovery |

> *"Design your state before your topology."* — State defines performance, scalability, and availability. The topology is the code. The state is the architecture.