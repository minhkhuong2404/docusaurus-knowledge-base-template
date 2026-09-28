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

By default, windowed aggregations emit a result **every time the window's aggregate changes** — potentially many times per window. `suppress()` holds back results until the window definitively closes:

```java
// Without suppress: emits on every new record in the window
// → many intermediate results per window

// With suppress: emits exactly once per window, after it closes
KTable<Windowed<String>, Long> finalCounts = stream
    .groupBy((k, v) -> v.getCategory(), Grouped.as("group-cat"))
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofSeconds(10)))
    .count(Materialized.as("suppress-counts"))
    .suppress(
        Suppressed.untilWindowCloses(
            Suppressed.BufferConfig.maxBytes(50 * 1024 * 1024L)  // 50MB buffer
                .shutDownWhenFull()   // Fail fast if buffer exhausted (vs emitEarlyWhenFull)
        )
    );
```

**Trade-off**: `suppress()` buffers all in-flight window records in memory until each window closes. Buffer size is bounded by your configuration. If the buffer fills before windows close, you can either fail fast (`shutDownWhenFull`) or emit early (`emitEarlyWhenFull` — breaks the "exactly one emission" guarantee).

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

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

```java
@Configuration
@EnableKafkaStreams
public class KafkaStreamsConfig {

    @Bean(name = KafkaStreamsDefaultConfiguration.DEFAULT_STREAMS_CONFIG_BEAN_NAME)
    public KafkaStreamsConfiguration streamsConfig() {
        Map<String, Object> props = new HashMap<>();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-processing-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092,broker2:9092");
        props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
        props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 4);
        props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
        props.put(StreamsConfig.STATE_DIR_CONFIG, "/var/kafka-streams/state");
        props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);
        props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 50 * 1024 * 1024L);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return new KafkaStreamsConfiguration(props);
    }

    @Bean
    public Topology orderProcessingTopology(StreamsBuilder builder,
                                             JsonSerde<Order> orderSerde,
                                             JsonSerde<CustomerOrderSummary> summarySerde) {
        KStream<String, Order> orders = builder.stream("orders-raw",
            Consumed.with(Serdes.String(), orderSerde));

        orders
            .filter((key, order) -> order != null && order.isValid(),
                Named.as("filter-valid-orders"))
            .mapValues(order -> order.normalize(), Named.as("normalize-orders"))
            .groupByKey(Grouped.as("group-by-customer"))
            .aggregate(
                CustomerOrderSummary::empty,
                (key, order, summary) -> summary.addOrder(order),
                Named.as("aggregate-customer-summary"),
                Materialized.<String, CustomerOrderSummary, KeyValueStore<Bytes, byte[]>>
                    as("customer-summary-store")
                    .withKeySerde(Serdes.String())
                    .withValueSerde(summarySerde)
            )
            .toStream(Named.as("summary-to-stream"))
            .to("customer-summaries", Produced.with(Serdes.String(), summarySerde));

        return builder.build();
    }
}
```

### StateListener — React to Application State Changes

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class StreamsHealthMonitor {

    private final KafkaStreams kafkaStreams;
    private final MeterRegistry meterRegistry;

    @PostConstruct
    public void registerStateListener() {
        kafkaStreams.setStateListener((newState, oldState) -> {
            log.info("Kafka Streams state: {} → {}", oldState, newState);
            meterRegistry.gauge("kafka.streams.state",
                Tags.of("state", newState.name()),
                newState.ordinal());

            if (newState == KafkaStreams.State.ERROR) {
                log.error("Kafka Streams entered ERROR state — alerting ops");
                alertingService.sendCritical("Kafka Streams ERROR",
                    Map.of("application", "order-processing-app", "previousState", oldState.name()));
            }
        });

        // Exception handler for uncaught stream thread exceptions
        kafkaStreams.setUncaughtExceptionHandler(exception -> {
            log.error("Uncaught exception in stream thread", exception);
            return StreamThreadExceptionResponse.REPLACE_THREAD;
            // REPLACE_THREAD: restart just the failed thread
            // SHUTDOWN_CLIENT: shut down this instance (trigger rebalance)
            // SHUTDOWN_APPLICATION: shut down all instances
        });
    }

    @GetMapping("/health/streams")
    public ResponseEntity<Map<String, String>> streamsHealth() {
        KafkaStreams.State state = kafkaStreams.state();
        boolean healthy = state == KafkaStreams.State.RUNNING || state == KafkaStreams.State.REBALANCING;
        return ResponseEntity.status(healthy ? 200 : 503)
            .body(Map.of("state", state.name()));
    }
}
```

---

## 16. When to Use (and Not Use) Kafka Streams

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

## 17. Kafka Streams vs Alternatives

| Dimension | Kafka Streams | Apache Flink | Apache Spark Structured Streaming | ksqlDB |
|:---|:---|:---|:---|:---|
| **Deployment model** | Embedded library | Separate cluster (JobManager + TaskManager) | Separate cluster (Driver + Executors) | Separate server (built on Kafka Streams) |
| **Operational overhead** | Minimal — standard microservice | High — Flink cluster ops | High — Spark cluster ops | Medium — ksqlDB server |
| **State management** | RocksDB (local, backed by changelog) | RocksDB or heap (backed by Flink state backend) | In-memory / RocksDB (backed by HDFS) | RocksDB via Kafka Streams |
| **Exactly-once** | ✅ (EXACTLY_ONCE_V2) | ✅ (Flink checkpointing) | ✅ (with idempotent sink) | ✅ (via Kafka Streams) |
| **SQL support** | ❌ Java/Scala only | ✅ Flink SQL | ✅ Spark SQL | ✅ SQL-first |
| **Event time / watermarks** | ✅ (window + grace) | ✅ (advanced watermarking) | ✅ (event time) | ✅ (via Kafka Streams) |
| **Dynamic pipelines** | ❌ Topology fixed | ✅ Dynamic graph | ✅ Dynamic | ❌ Schema-first |
| **Throughput at scale** | Very high (bounded by Kafka) | Very high | Very high | High |
| **Best for** | Microservice-embedded stateful processing | Complex large-scale stateful streaming | Batch + streaming unified | SQL-based stream analytics |

---

## 18. Production System Design Examples

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
// → customers can query their order history in real-time with sub-ms latency
```

---

## 19. Failure Scenarios & Mitigation Matrix

| Scenario | What Happens | Latency Impact | Mitigation |
|:---|:---|:---|:---|
| **Instance crash** | Consumer group rebalance; tasks reassigned; state rebuilt from changelog | Downtime proportional to unrebuildable state | Standby replicas (`NUM_STANDBY_REPLICAS`) |
| **Rebalance (new instance joins)** | All instances pause; task redistribution; partial state rebuild | Temporary pause (seconds with standbys, minutes without) | Static group membership (`group.instance.id`), standby replicas |
| **Large state cold restore** | Full changelog replay from beginning | Minutes to hours | Windowing + TTL to limit state size; use checkpoints; NVMe SSDs |
| **Topology naming shift on deploy** | State store name mismatch; full state rebuild; orphaned topics | Extended startup latency | Explicit Named/Materialized names on all operators |
| **Rolling deploy with topology mismatch** | V1 and V2 tasks incompatible; infinite rebalance loop | Total processing stoppage | Blue-green deploy; validate topology stability before rolling |
| **Zombie task (pre-fence)** | Stale instance writes after eviction | Duplicate output | `EXACTLY_ONCE_V2` fences zombie producers via epoch |
| **Changelog topic lag during restore** | State behind changelog; data inconsistency window | Degraded accuracy during restore | Monitor `kafka.streams.thread.commit-latency-avg`; alert on restore time |
| **Repartition topic growth** | Internal topics fill disk; partition exhaustion | Processing failure if Kafka cluster full | Topic retention policies; monitor internal topic sizes |
| **Clock skew across producers** | Out-of-order events relative to event time | Incorrect window assignment | Grace periods; prefer processing time for non-time-critical aggregations |
| **RocksDB compaction stall** | Write stalls under heavy load | Latency spikes | Tune RocksDB via `rocksdb.config.setter`; allocate dedicated NVMe |

---

## 20. Interview Questions — Senior Level

**Q: What is the difference between KStream and KTable?**

> A `KStream` is an unbounded, append-only sequence of independent records — every record is a distinct event. Two records with the same key coexist as separate events. A `KTable` is a changelog stream where each new record for a key replaces the previous value — it materializes the latest known state per key, like a database table. `ZSCORE` in Redis vs a sorted set: KTable gives you the current value for a key; KStream gives you every event that ever happened.

**Q: How does Kafka Streams handle state across restarts?**

> Each state store (RocksDB) is backed by a compacted Kafka changelog topic. On every commit, Kafka Streams writes a checkpoint file recording the changelog offset up to which RocksDB is durable. On restart, Kafka Streams reads the checkpoint, then replays the changelog from that offset forward to rebuild state. This means: recovery time = (changelog records since checkpoint) / replay throughput — not a full replay from the beginning. Standby replicas further reduce this by maintaining near-current copies in shadow tasks.

**Q: What is `EXACTLY_ONCE_V2` and how does it work internally?**

> `EXACTLY_ONCE_V2` wraps each read-process-write cycle in a Kafka transaction. Output records and consumer offset commits are committed atomically — either both happen or neither does. If processing fails before the transaction commits, it's aborted; on restart, the same input records are reprocessed, but no duplicate output is visible to downstream consumers (who must use `isolation.level=read_committed`). V2 uses one transactional producer per stream thread (not per task as V1 did) — fewer producers, better throughput. Zombie fencing uses producer epochs: if a stale instance tries to write, the broker rejects its writes because a new instance has claimed a higher epoch.

**Q: Why does Kafka Streams show a persistent consumer lag of 1 even when caught up?**

> Kafka's exactly-once implementation writes transaction control records (commit/abort markers) to the partition log. These markers increment `LogEndOffset` but are transparent to `read_committed` consumers — they don't count as deliverable records. The consumer's committed offset doesn't advance past these markers until a real data record arrives. So `LogEndOffset - CommittedOffset = 1` is normal and expected in fully-caught-up `exactly_once_v2` applications. Exclude this from lag alerting.

**Q: How does repartitioning work and when does it occur?**

> Any operation that changes the record key (`.map()`, `.selectKey()`, `.groupBy()`) triggers repartitioning. Kafka Streams writes affected records to an internal repartition topic partitioned by the new key. Records are then re-consumed from this topic, ensuring all records with the same key land on the same task (which owns the state store for that key). The cost is an extra Kafka write + read round-trip per record, plus a permanent internal topic. Prefer `.mapValues()` over `.map()` when only the value needs changing — it never triggers repartition.

**Q: What happens during a rebalance and how do standby replicas help?**

> During a rebalance, all instances in the consumer group pause processing — tasks are redistributed and each instance must restore state for newly assigned tasks by replaying changelog topics. Without standby replicas, restoring 100GB of state could take 15+ minutes. Standby replicas are shadow tasks that continuously consume the changelog without processing input. On failover, they already have near-current state — promotion to active requires replaying only the most recent seconds of changelog. Recovery drops from minutes to seconds.

**Q: Why is state store size a first-class design concern?**

> Recovery time is directly proportional to state size: `recovery_time ≈ state_size / replay_throughput`. A 100GB state store with no standby replicas and a cold changelog could take 15–30 minutes to restore. This means every crash causes 15–30 minutes of downtime per affected task. The primary levers for controlling state size: windowing (discard data older than N minutes), TTL on state entries, selective aggregation (aggregate only needed fields), and designing your event schema to minimize state fan-out.

**Q: When would you choose GlobalKTable over KTable for a join?**

> Choose `GlobalKTable` when: the reference data is small enough to replicate to every instance (rule of thumb: < 1GB per instance), the data changes infrequently (each change triggers a full replication across all instances), and the stream you're joining is not co-partitioned with the table. `GlobalKTable` eliminates the co-partitioning constraint entirely. For large tables or high-write reference data, prefer `KTable` to avoid the per-instance replication cost, but then ensure co-partitioning between the stream and table.

**Q: How would you design exactly-once end-to-end when writes go to an external database?**

> `EXACTLY_ONCE_V2` covers atomicity within Kafka only. For external DB writes, use the Transactional Outbox Pattern: the consuming service writes both its business state and an outbox record in a single local DB transaction (atomic). A CDC tool like Debezium reads the WAL and publishes the outbox record to Kafka. Downstream consumers process the outbox event with idempotency guards (unique constraint on event ID). This chains: Kafka EOS (Kafka → consumer) + local ACID (consumer DB write) + CDC + idempotency (consumer → downstream) = effectively exactly-once end-to-end, without any distributed transaction manager.

**Q: Why does changing the order of sub-topologies in code cause an infinite rebalance storm during a rolling deployment?**

> Kafka Streams assigns sequential integer IDs to sub-topologies (`0, 1, ...`) based on their declaration order in `StreamsBuilder`. Physical tasks are identified by `TaskId(subTopologyId, partitionId)` (e.g. `0_0`). If you swap the declaration order of two sub-topologies, Task `0_0` changes from consuming Topic A to Topic B. During a rolling update, a `v2` leader assigns Task `0_0` (Topic B) to a `v1` instance, whose local topology expects Task `0_0` to process Topic A. The instance rejects the assignment with a topology mismatch, crashes or leaves the group, triggering another cluster-wide rebalance. Because instances endlessly clash over task definitions, threads never reach the `RUNNING` state and zero records are processed. Furthermore, local RocksDB directories on disk (`/0_0/`) and auto-generated changelog topic names become misaligned with the new task duties.

---

## Summary — The Four Golden Rules

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
| **Partition count = max parallelism** | More partitions → more tasks → more scale; you cannot exceed partition count |
| **Changelog = source of truth** | Everything needed to reconstruct state is in Kafka; local disk is a cache |
| **Design for failure, not success** | Rebalances and restores are normal events — design your state and topology for fast recovery |

> *"Design your state before your topology."* — State defines performance, scalability, and availability. The topology is the code. The state is the architecture.