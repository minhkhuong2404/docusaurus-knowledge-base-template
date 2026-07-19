---
id: kafka-streams-deep-dive
title: Kafka Streams — Complete Deep Dive
sidebar_label: Kafka Streams Deep Dive
description: >
  A comprehensive guide to Kafka Streams: from core concepts and internal architecture
  to stateful processing, failure recovery, and production system design patterns.
  Built for new learners and senior engineers alike.
tags:
  - kafka
  - kafka-streams
  - stream-processing
  - stateful-processing
  - advanced
---

import KafkaStreamsTopologyDiagram from '@site/src/components/KafkaStreamsTopologyDiagram';

# Kafka Streams — Complete Deep Dive

> **Who this is for:** Engineers who want to truly understand how Kafka Streams works — not just use the API, but reason about it in production, design systems with it, and answer hard interview questions confidently.

---

## Table of Contents

1. [What is Kafka Streams (Really)?](#1-what-is-kafka-streams-really)
2. [Core Abstractions](#2-core-abstractions)
3. [Topology — The Processing Graph](#3-topology--the-processing-graph)
4. [Internal Execution Model](#4-internal-execution-model)
5. [Stream Operations](#5-stream-operations)
6. [State Stores — The Heart of Stateful Processing](#6-state-stores--the-heart-of-stateful-processing)
7. [Changelog Topics — Durability Layer](#7-changelog-topics--durability-layer)
8. [Failure Recovery Deep Dive](#8-failure-recovery-deep-dive)
9. [Standby Replicas](#9-standby-replicas)
10. [Exactly-Once Semantics](#10-exactly-once-semantics)
11. [Repartitioning — The Hidden Cost](#11-repartitioning--the-hidden-cost)
12. [Windowing](#12-windowing)
13. [Joins](#13-joins)
14. [Interactive Queries](#14-interactive-queries)
15. [Spring Boot Integration](#15-spring-boot-integration)
16. [When to Use (and Not Use) Kafka Streams](#16-when-to-use-and-not-use-kafka-streams)
17. [Kafka Streams vs Alternatives](#17-kafka-streams-vs-alternatives)
18. [Production System Design Examples](#18-production-system-design-examples)
19. [Failure Scenarios & Mitigation Matrix](#19-failure-scenarios--mitigation-matrix)
20. [Interview Questions — Senior Level](#20-interview-questions--senior-level)

---

## 1. What is Kafka Streams (Really)?

Most introductions say: *"Kafka Streams is a client library for stream processing."*

That's technically correct, but it hides the important truth:

> **Kafka Streams is an embedded, fault-tolerant, stateful stream processing engine that runs inside your application.**

No separate cluster. No Spark master. No Flink job manager. Just a library you import, and your application *becomes* the stream processor.

```
Input Topic(s)
      ↓
[Your Application — Kafka Streams Engine]
      │
      ├── KStream / KTable abstractions
      ├── State Stores (RocksDB, local)
      ├── Changelog Topics (Kafka, durable)
      └── Output Topic(s)
```

### Why does this matter?

| Aspect                       | Implication                                        |
| ---------------------------- | -------------------------------------------------- |
| No separate cluster          | Simpler ops, fewer moving parts                    |
| Scales with Kafka partitions | Horizontal scale is built-in                       |
| State is local               | Ultra-fast reads/writes, no network hops for state |
| Backed by Kafka              | State is durable and recoverable                   |

The mental model to internalize:

```
Kafka   = the event log (source of truth)
RocksDB = the local database (fast state access)
Streams = the query + transformation engine gluing them together
```

This is equivalent to **Event Sourcing + CQRS + Materialized Views**, all in one library.

---

## 2. Core Abstractions

### 2.1 KStream — Unbounded Append-Only Stream

A `KStream` represents an infinite sequence of independent events. Every record is its own fact. There is no concept of "latest value per key" — every record is processed individually.

```java
KStream<String, OrderEvent> orders = builder.stream("orders");

orders
    .filter((key, order) -> order.getAmount() > 100)
    .mapValues(order -> enrich(order))
    .to("high-value-orders");
```

**Mental model:** Think of a river — water (events) keeps flowing, and every drop is distinct.

### 2.2 KTable — Changelog Stream (Materialized View)

A `KTable` represents the *latest value* for each key. When a new record arrives for a key, it replaces the previous value. It is a **materialized view** of the latest state derived from the changelog.

```java
KTable<String, UserProfile> users = builder.table("user-profiles");
```

**Mental model:** Think of a database table where each `INSERT` or `UPDATE` for a key replaces what was there before.

### KStream vs KTable — Side by Side

| Aspect           | KStream           | KTable                        |
| ---------------- | ----------------- | ----------------------------- |
| Record semantics | Independent event | Update to a key's value       |
| History          | Keeps all records | Only latest per key           |
| Use for          | Event processing  | Stateful lookups / enrichment |
| Analogy          | Append-only log   | Database table                |

### 2.3 GlobalKTable — Replicated Lookup Table

Like a `KTable`, but **fully replicated to every instance** of your application — regardless of partition assignment.

```java
GlobalKTable<String, Product> products = builder.globalTable("product-catalog");
```

**Use case:** Enrichment/lookup tables that are relatively small and need to be accessed from any partition of a co-partitioned stream. With a regular `KTable`, you can only join with records on the same partition. With a `GlobalKTable`, any record can be enriched from any key.

**Trade-off:** Consumes more memory and storage per instance.

---

## 3. Topology — The Processing Graph

A Kafka Streams application defines a **directed acyclic graph (DAG)** of processing nodes called a **Topology**. There are three node types:

- **Source Processor** — reads from a Kafka topic
- **Stream Processor** — transforms, filters, joins, or aggregates records
- **Sink Processor** — writes to a Kafka topic

<KafkaStreamsTopologyDiagram />

### Defining and Inspecting the Topology

```java
StreamsBuilder builder = new StreamsBuilder();

KStream<String, String> source = builder.stream("input-topic");
source
    .filter((k, v) -> v != null)
    .mapValues(String::toUpperCase)
    .to("output-topic");

Topology topology = builder.build();

// Print the full DAG — invaluable for debugging
System.out.println(topology.describe());

KafkaStreams streams = new KafkaStreams(topology, props);
streams.start();
```

> **Pro tip:** Always call `topology.describe()` and log it at startup. When debugging production issues, understanding what nodes exist and in what order is essential.


### 3.2 Topology Order, Naming, and Deployment Impact (Senior Deep Dive)

When you write a Kafka Streams DSL application, the builder compiles it sequentially into a DAG of processing nodes. The order of operators in your code defines the topology structure.

#### The Auto-Generated Naming Trap
By default, Kafka Streams auto-generates names for processors, internal repartition topics, and state store changelogs based on their type and insertion order (e.g., `KSTREAM-SOURCE-0000000000`, `KSTREAM-FILTER-0000000001`, `KSTREAM-KEY-SELECT-0000000002`).

If you insert, delete, or re-order a single node in your stream definition (even a simple stateless filter or map operation), it shifts the auto-generated counter suffix for all subsequent downstream nodes.

```
Original Topology:
[Source] ──► [Filter (0000000001)] ──► [Aggregate Store (0000000002)]

Modified Topology (inserting a new Map operator):
[Source] ──► [Map (0000000001)] ──► [Filter (0000000002)] ──► [Aggregate Store (0000000003)]
```

#### How Naming Changes Affect Deployments
Deploying a microservice with a shifted topology causes several major production issues:

1. **State Store Incompatibility & Full Rebuilds:**
   If a stateful operator's auto-generated name shifts (e.g., from suffix `-0000000002` to `-0000000003`), the microservice on startup will look for a local RocksDB directory and changelog topic with the new name.
   - **Local State Loss:** It fails to find the local store, discarding cached data.
   - **Changelog Re-migration:** It creates a new changelog topic and initiates a full cold-restore of the state store from scratch, which can cause high CPU, memory consumption, network load on the Kafka cluster, and prolonged startup delays (minutes to hours depending on state size).
2. **Orphaned Topics:**
   The old internal changelog and repartition topics remain active in your Kafka cluster, wasting disk space and partitions.
3. **Rolling Upgrade Failures (Topology Mismatch):**
   If you perform a rolling deployment where old instances (running version A) and new instances (running version B) coexist within the same consumer group:
   - **Group Rebalance Errors:** The partition assignor maps partitions based on a consistent task structure. If version A and B have different topologies, the coordinator will fail to reconcile task assignments, leading to infinite rebalancing loops, `TaskMigrationException`, or partition assignment discrepancies.

#### Production Guardrails & Best Practices
To guarantee safe, zero-downtime rolling deployments, follow these rules:

1. **Assign Explicit Names to Everything:**
   Never rely on auto-generated names. Explicitly define names for all processors, state stores, and repartition/joined operations using `Named`, `Materialized`, `Repartitioned`, or `Joined`.

   ```java
   stream
       .filter((k, v) -> v != null, Named.as("filter-null-orders"))
       .selectKey((k, v) -> v.getCustomerId(), Repartitioned.as("repartition-by-customer"))
       .groupByKey()
       .aggregate(
           OrderAggregate::new,
           (key, value, aggregate) -> aggregate.add(value),
           Materialized.<String, OrderAggregate, KeyValueStore<Bytes, byte[]>>as("customer-orders-store")
       );
   ```

2. **Handle Incompatible Changes with a new `application.id`:**
   If you must make a structural topology change that cannot be name-mapped (e.g., removing a stateful store or changing key schema format):
   - **Change the `application.id`:** This creates a clean consumer group, isolates the new deployment, and avoids rolling upgrade conflicts with the old version.
   - **Run the Application Reset Tool:** Use `kafka-streams-application-reset` to clean up old internal topics and clean local states when decommissioning.

---

## 4. Internal Execution Model

This section explains how records actually flow through the engine. Understanding this is the difference between using Kafka Streams and *understanding* Kafka Streams.

### 4.1 Stream Tasks — The Fundamental Unit

```
1 Input Partition = 1 Stream Task = 1 State Store Instance
```

Each **Stream Task** is the atomic unit of parallelism. It:

- Is assigned one or more input topic partitions
- Owns its own local state store(s)
- Runs on a stream thread

### 4.2 Stream Threads

Multiple tasks can run on multiple threads within one application instance:

```
Application Instance
  ├── Stream Thread 1
  │     ├── Task 0 (Partition 0)
  │     └── Task 1 (Partition 1)
  └── Stream Thread 2
        ├── Task 2 (Partition 2)
        └── Task 3 (Partition 3)
```

Configure via:
```properties
num.stream.threads=4
```

### 4.3 Per-Record Processing Loop

For each record, a task executes this loop synchronously:

```
Poll Records from Kafka
        ↓
Process Record (DSL / Processor API)
        ↓
Update Local State Store (RocksDB)
        ↓
Write to Changelog Topic (async, for durability)
        ↓
Forward to Downstream Processor
        ↓
Commit Offset (periodically or at transaction boundary)
```

> **Key insight:** Kafka Streams processes **one record at a time per task**. Scalability comes from partition count and parallelism, not async concurrency within a task.

### 4.4 Caching Layer

Before hitting RocksDB, Kafka Streams has an in-memory **record cache**:

```
Processor → Cache (in-memory) → RocksDB → Changelog Topic
```

```properties
cache.max.bytes.buffering=10485760  # 10MB default
```

**Benefits:**
- Batches writes to RocksDB — reduces disk I/O
- Deduplicates multiple updates to the same key before flushing
- Significantly improves throughput for high-update-rate keys

**Risk:**
- Data in cache is not yet written to RocksDB or Changelog
- On crash before flush, the data must be re-derived by replaying the input changelog

> The cache flushes on `commit.interval.ms` (default 30s) or when full.

---

## 5. Stream Operations

### 5.1 Stateless Transformations

These require no memory of past records. Each record is processed independently.

```java
stream
    .filter((k, v) -> v.getStatus().equals("ACTIVE"))    // keep matching records
    .filterNot((k, v) -> v.isDeleted())                   // drop matching records
    .map((k, v) -> new KeyValue<>(v.getUserId(), v))      // remap key AND value
    .mapValues(event -> transform(event))                  // remap value only (no repartition)
    .flatMapValues(event -> expand(event))                 // one record → many records
    .selectKey((k, v) -> v.getPartitionKey());             // change key → triggers repartition
```

> **Important:** `map()` and `selectKey()` change the key, which **forces a repartition** (see [Section 11](#11-repartitioning--the-hidden-cost)). `mapValues()` does not — prefer it when you only need to transform the value.

### 5.2 Stateful Transformations

#### Counting

```java
KGroupedStream<String, OrderEvent> grouped = orders.groupByKey();

KTable<String, Long> orderCounts = grouped
    .count(Materialized.as("order-count-store"));
```

#### Aggregation

```java
KTable<String, Double> totalRevenue = grouped
    .aggregate(
        () -> 0.0,                                                // initializer — creates initial accumulator
        (key, order, aggregate) -> aggregate + order.getAmount(), // aggregator — fold each record in
        Materialized.<String, Double, KeyValueStore<Bytes, byte[]>>as("revenue-store")
            .withKeySerde(Serdes.String())
            .withValueSerde(Serdes.Double())
    );
```

**How it works internally:**
1. Each new record triggers a state store lookup for the current accumulator value
2. The aggregator function folds the new record into the accumulator
3. The new accumulator is written back to the state store
4. An update record is emitted downstream (as a `KTable` update)

#### Windowed Aggregation

```java
KTable<Windowed<String>, Long> windowedCounts = orders
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count(Materialized.as("windowed-order-count"));
```

Windowing types:

| Type         | Description                          | Use Case                               |
| ------------ | ------------------------------------ | -------------------------------------- |
| **Tumbling** | Fixed, non-overlapping windows       | "Count per 5 minute bucket"            |
| **Hopping**  | Fixed-size, overlapping windows      | "Rolling average, updated every 1 min" |
| **Sliding**  | Windows defined by event proximity   | "All events within 10s of each other"  |
| **Session**  | Variable-length, gap-defined windows | "User session analytics"               |

**Tumbling vs Session:**
- Tumbling: events bucketed by wall-clock time boundaries — predictable, fixed size
- Session: events grouped by *activity gap* — window closes after `inactivityGap` of silence, so duration varies per key

---

## 6. State Stores — The Heart of Stateful Processing

State stores are what make Kafka Streams far more powerful than a simple consumer. Understanding them deeply is non-negotiable for senior-level usage.

### 6.1 Architecture

```
┌─────────────────────────────────────┐
│          Kafka Streams Task         │
│                                     │
│  Record In → Processor              │
│                  ↓                  │
│           [Cache Layer]             │
│                  ↓                  │
│         [RocksDB — Local]  ←──────────── fast, local read/write
│                  ↓                  │
│      [Changelog Topic — Kafka] ←──────── durable, replicated
└─────────────────────────────────────┘
```

| Component           | Role                                                        |
| ------------------- | ----------------------------------------------------------- |
| **RocksDB**         | Fast local key-value store, embedded on disk                |
| **Changelog Topic** | Kafka topic that mirrors every state store write            |
| **Cache**           | In-memory buffer that batches writes before hitting RocksDB |

### 6.2 Write Path (Detailed)

```
Input Record arrives
       ↓
Processor computes new state
       ↓
Write to in-memory Cache
       ↓  (on flush)
Write to RocksDB (local disk)
       ↓
Append key-value update to Changelog Topic (Kafka)
       ↓
Forward result downstream
```

> **Why write to RocksDB before Kafka?** Local writes are orders of magnitude faster. Kafka persistence is async and provides durability — it does not need to be on the critical path of record processing latency.

### 6.3 Custom State Stores (Processor API)

For cases where the DSL is insufficient, you can define and access stores directly:

```java
// 1. Define the store
StoreBuilder<KeyValueStore<String, Long>> storeBuilder =
    Stores.keyValueStoreBuilder(
        Stores.persistentKeyValueStore("my-state-store"),
        Serdes.String(),
        Serdes.Long()
    );
builder.addStateStore(storeBuilder);

// 2. Access the store in a custom Processor
stream.process(() -> new Processor<String, Long, String, Long>() {
    private KeyValueStore<String, Long> store;

    @Override
    public void init(ProcessorContext<String, Long> context) {
        // Store reference obtained at init time — not per-record
        store = context.getStateStore("my-state-store");
    }

    @Override
    public void process(Record<String, Long> record) {
        Long current = store.get(record.key());
        long newValue = (current == null ? 0L : current) + record.value();
        store.put(record.key(), newValue);
        context.forward(record.withValue(newValue));
    }
}, "my-state-store");
```

### 6.4 State Store Types

| Type                      | API                          | Persistence | Use Case                     |
| ------------------------- | ---------------------------- | ----------- | ---------------------------- |
| `persistentKeyValueStore` | Key → Value                  | RocksDB     | General stateful aggregation |
| `inMemoryKeyValueStore`   | Key → Value                  | Memory only | Low-latency, small state     |
| `persistentWindowStore`   | (Key, Time) → Value          | RocksDB     | Windowed aggregations        |
| `persistentSessionStore`  | (Key, SessionWindow) → Value | RocksDB     | Session windows              |

---

## 7. Changelog Topics — Durability Layer

Every persistent state store automatically gets a backing **changelog topic**:

```
<application-id>-<store-name>-changelog
```

### Properties

- **Log-compacted** — Kafka retains only the latest value per key (not full history)
- **Same partition count** as the input topic(s) for that task
- **Automatically managed** — created and maintained by Kafka Streams

### Why Changelog Exists

The changelog is the **source of truth** for state recovery. If a node crashes, another node can rebuild the exact same state by replaying this topic from the beginning.

```
Normal operation:
  Processor → writes to RocksDB → mirrors to Changelog Topic

Failure & recovery:
  New task assignment → reads Changelog Topic → rebuilds RocksDB → resumes
```

### Checkpoint Files

To avoid replaying the entire changelog on every restart, Kafka Streams writes **checkpoint files** to local disk, recording the last successfully processed offset for each state store. On restart, only the delta since the checkpoint needs to be replayed.

```
Checkpoint file: <state.dir>/<app-id>/<task-id>/.checkpoint
```

---

## 8. Failure Recovery Deep Dive

This is where many engineers' understanding breaks down. Let's walk through exactly what happens.

### 8.1 Rebalance — What Triggers It?

- New application instance joins the consumer group
- An instance crashes or stops sending heartbeats
- Partition count changes
- Kafka `session.timeout.ms` expires for a member

### 8.2 Full Rebalance Timeline

```
T0: Instance A (tasks 0,1) and Instance B (tasks 2,3) running normally

T1: Instance C joins

T2: Kafka triggers rebalance
    → All instances pause processing (REBALANCING state)

T3: Tasks redistributed
    → A gets tasks 0
    → B gets tasks 2
    → C gets tasks 1,3

T4: Each instance restores state for newly assigned tasks
    → Read checkpoint file (find last committed offset)
    → Replay changelog topic from that offset
    → Rebuild RocksDB to current state

T5: Processing RESUMES
```

> **Critical:** During T2–T5, there is a **processing pause**. The duration is dominated by state restore time. This is why large state stores are dangerous in production.

### 8.3 Crash Recovery Timeline

```
T0: Instance A owns tasks 0, 1 and processes normally
T1: Instance A crashes (OOM, hardware failure, etc.)
T2: Kafka detects missed heartbeats (after session.timeout.ms)
T3: Remaining instances trigger rebalance
T4: Tasks 0 and 1 reassigned to Instance B
T5: Instance B reads checkpoint, replays changelog
T6: Processing resumes from last committed offset
```

### 8.4 Recovery Time Formula

```
Recovery time ≈ (State size − Checkpoint size) / Changelog replay throughput
```

**Example:**
```
State size: 10 GB
Checkpoint covers: 9.5 GB
Delta to replay: 0.5 GB
Replay throughput: ~100 MB/s

→ Recovery ≈ 5 seconds
```

**Without a recent checkpoint (or large state):**
```
State size: 10 GB, no checkpoint
Replay throughput: 50 MB/s

→ Recovery ≈ 200 seconds (3+ minutes of downtime per task!)
```

### 8.5 Reducing Recovery Time

| Technique                          | Effect                                   |
| ---------------------------------- | ---------------------------------------- |
| **Standby replicas**               | Near-instant failover (no replay needed) |
| **Windowing / TTL**                | Bound state size to a time horizon       |
| **SSD disks**                      | Faster RocksDB restore write speed       |
| **Increase `num.restore.threads`** | Parallel changelog replay                |
| **Tune `fetch.max.bytes`**         | Larger chunks per changelog fetch        |

---

## 9. Standby Replicas

Standby replicas are shadow tasks that silently track changelog topics *without* actively processing input records. They are pre-warmed state stores, ready to take over immediately on failure.

```properties
num.standby.replicas=1
```

### How It Works

```
Active Task (Instance A)
   → processes input records
   → writes to Changelog Topic
   
Standby Task (Instance B)
   → reads the same Changelog Topic continuously
   → keeps its own RocksDB replica up-to-date
   → does NOT process input records

Instance A crashes:
   → Instance B's standby task is promoted to active
   → Already has current state
   → Resumes processing almost immediately
```

### Trade-offs

| Benefit                  | Cost                                         |
| ------------------------ | -------------------------------------------- |
| Near-instant failover    | 2x disk usage                                |
| No full restore on crash | Additional network for changelog consumption |
| Higher availability      | More Kafka partition reads                   |

> **Rule of thumb:** For production systems with large state (> 1 GB per task) or strict SLA requirements, always enable at least `num.standby.replicas=1`.

---

## 10. Exactly-Once Semantics

### The Problem

In distributed systems, failures + retries can cause duplicate processing:

```
Task processes record → writes output → crashes before committing offset
→ On recovery, record is processed again → duplicate output
```

### The Solution: `exactly_once_v2`

```properties
processing.guarantee=exactly_once_v2
```

### Internal Flow

Kafka Streams wraps each commit cycle in a **Kafka Transaction**:

```
BEGIN TRANSACTION
   ↓
Poll + Process records
   ↓
Update State Store (RocksDB + Changelog)
   ↓
Write output records to output topics (transactionally)
   ↓
Commit consumer offsets (transactionally, inside the same transaction)
END TRANSACTION (atomic commit)
```

If anything fails before `END TRANSACTION`, the entire transaction is aborted. On retry, the transaction starts fresh. Because offsets are committed inside the transaction, there is no possibility of re-processing committed work.

### V2 vs V1

|                | `exactly_once` (V1) | `exactly_once_v2`         |
| -------------- | ------------------- | ------------------------- |
| Producer scope | One per **task**    | One per **stream thread** |
| Since          | Kafka 0.11          | Kafka 2.6                 |
| Performance    | Higher overhead     | Better throughput         |

### Critical Limitation

```
exactly_once_v2 guarantees atomicity WITHIN Kafka only.
```

It does **not** cover:

- Calls to external REST APIs
- Writes to databases (unless using Kafka transactional outbox)
- Any side effect outside Kafka's transaction scope

> **Senior insight:** "Exactly-once" is a property of the Kafka read-process-write cycle. Designing true end-to-end exactly-once requires the **Outbox Pattern** for external writes.

### The Persistent Lag-of-1 Explained

With exactly-once enabled, you may observe consumer lag stuck at `1` per partition even when fully caught up. This is **expected behavior**:

Kafka Transactions write **control records** (commit/abort markers) to the partition log. These markers occupy a real offset, incrementing `LogEndOffset`. Normal consumers skip these markers, so their committed offset lags behind. The lag is `1`, constant, harmless. Do not alert on it.

---

## 11. Repartitioning — The Hidden Cost

### When Repartitioning Occurs

Any operation that changes the record key forces Kafka Streams to repartition the data:

```java
stream.map(...)         // changes key → repartition
stream.selectKey(...)   // changes key → repartition
stream.groupBy(...)     // changes grouping key → repartition
stream.join(...)        // if partitioning doesn't match → repartition
```

`mapValues()` does **not** change the key and avoids repartitioning.

### What Happens Internally

```
Original Topic (partitioned by original key)
        ↓
Kafka Streams writes records to an auto-created Repartition Topic
(partitioned by the new key — ensuring all records for a key land on the same partition)
        ↓
Records re-consumed from Repartition Topic
        ↓
State Store (now correctly co-located with matching keys)
```

### Repartition Topic Naming

```
<application-id>-<operation>-repartition
```

### Impact

| Effect                   | Consequence                              |
| ------------------------ | ---------------------------------------- |
| Extra Kafka topic        | More storage and partition overhead      |
| Double network traversal | Record is written to Kafka, then re-read |
| Latency increase         | 10s of ms per hop                        |
| Extra consumer group     | Offset management overhead               |

### Mitigation

```java
// BAD — repartition happens here
stream
    .map((k, v) -> new KeyValue<>(v.getUserId(), v))    // key change
    .groupByKey()
    .count();

// BETTER — assign key closer to the grouping to reduce wasted steps
stream
    .selectKey((k, v) -> v.getUserId())     // repartition still happens, but intentionally
    .groupByKey()
    .count();

// BEST — if you know keys are already correct, use groupByKey() from the start
orders.groupByKey().count();
```

---

## 12. Windowing

Windowing slices an infinite stream into finite buckets for aggregation.

### Window Types Compared

| Window       | Size     | Overlap | Gap              | Best For                          |
| ------------ | -------- | ------- | ---------------- | --------------------------------- |
| **Tumbling** | Fixed    | None    | None             | "Per-minute counts"               |
| **Hopping**  | Fixed    | Yes     | None             | "Rolling averages"                |
| **Sliding**  | Fixed    | Yes     | By proximity     | "Events within 10s of each other" |
| **Session**  | Variable | None    | Activity-defined | "User sessions"                   |

### Tumbling Window Example

```java
// Count orders per 5-minute window
KTable<Windowed<String>, Long> counts = orders
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count(Materialized.as("order-counts-per-window"));
```

### Session Window Example

```java
// Group user events by inactivity gap
KTable<Windowed<String>, Long> sessions = userEvents
    .groupByKey()
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(30)))
    .count(Materialized.as("user-session-counts"));
```

### Late Events

```java
// Allow late events up to 5 minutes after the window closes
TimeWindows.of(Duration.ofMinutes(5)).grace(Duration.ofMinutes(5))
```

Without grace period (`withNoGrace`), late events are dropped. With grace, they are accepted and the aggregate is updated. Downstream consumers must handle out-of-order updates.

---

## 13. Joins

### Join Types Overview

| Left    | Right        | Type                   | Behavior                                    |
| ------- | ------------ | ---------------------- | ------------------------------------------- |
| KStream | KTable       | Left join / Inner join | Enrich stream records with table lookup     |
| KStream | GlobalKTable | Left join / Inner join | Same, but no partition co-location required |
| KStream | KStream      | Inner join (windowed)  | Match events occurring within a time window |
| KTable  | KTable       | Inner / Left / Outer   | Combine materialized state                  |

### KStream-KTable Join (Enrichment Pattern)

```java
// Enrich every order with the user's profile
KStream<String, EnrichedOrder> enriched = orders.join(
    users,                                              // KTable<String, UserProfile>
    (order, user) -> new EnrichedOrder(order, user),   // joiner
    Joined.with(Serdes.String(), orderSerde, userSerde)
);
```

**Requirements:** Both must be **co-partitioned** — same number of partitions, same key type, same partitioner. If not, repartitioning is required.

### KStream-GlobalKTable Join (No Co-Partitioning Required)

```java
KStream<String, EnrichedOrder> enriched = orders.join(
    products,                                           // GlobalKTable<String, Product>
    (orderKey, order) -> order.getProductId(),          // key extractor — maps to GlobalKTable key
    (order, product) -> new EnrichedOrder(order, product)
);
```

Because `GlobalKTable` is fully replicated, it can be joined from any partition.

### KStream-KStream Join (Time-Windowed)

```java
// Match a payment with its corresponding order within 30 seconds
KStream<String, MatchedEvent> matched = payments.join(
    orders,
    (payment, order) -> new MatchedEvent(payment, order),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofSeconds(30)),
    StreamJoined.with(Serdes.String(), paymentSerde, orderSerde)
);
```

Both sides of the join are buffered in state stores for the window duration. This is why KStream-KStream joins have higher memory overhead.

---

## 14. Interactive Queries

State stores can be queried from outside the Kafka Streams topology — enabling your application to serve the materialized state directly.

```java
// Get a read-only view of a state store
ReadOnlyKeyValueStore<String, Long> store =
    streams.store(
        StoreQueryParameters.fromNameAndType(
            "order-count-store",
            QueryableStoreTypes.keyValueStore()
        )
    );

// Point lookup
Long count = store.get("user-123");

// Range scan
KeyValueIterator<String, Long> range = store.range("a", "z");
while (range.hasNext()) {
    KeyValue<String, Long> entry = range.next();
    // process entry
}
range.close();  // Always close iterators!
```

### Multi-Instance Queries

In a multi-instance deployment, a key might be owned by a different instance. Use `StreamsMetadata` to route queries to the correct instance:

```java
Collection<StreamsMetadata> metadata = streams.metadataForAllStreamsClients();
// Use metadata to build a service discovery layer and proxy queries to the correct host
```

> **Production pattern:** Build a thin REST layer over interactive queries and use metadata routing to forward requests to the instance owning the relevant partition.

---

## 15. Spring Boot Integration

Spring Kafka provides first-class support for Kafka Streams.

### Dependency

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

### Configuration

```java
@Configuration
@EnableKafkaStreams
public class KafkaStreamsConfig {

    @Bean(name = KafkaStreamsDefaultConfiguration.DEFAULT_STREAMS_CONFIG_BEAN_NAME)
    public KafkaStreamsConfiguration streamsConfig() {
        Map<String, Object> props = new HashMap<>();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-stream-processor");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
        props.put(StreamsConfig.REPLICATION_FACTOR_CONFIG, 3);
        props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 4);
        // Limit cache to reduce latency for low-throughput use cases
        props.put(StreamsConfig.STATESTORE_CACHE_MAX_BYTES_CONFIG, 10 * 1024 * 1024L);
        return new KafkaStreamsConfiguration(props);
    }
}
```

### Topology Bean

```java
@Configuration
public class OrderStreamTopology {

    @Bean
    public KStream<String, OrderEvent> orderStream(StreamsBuilder builder) {
        KStream<String, OrderEvent> stream = builder.stream(
            "orders",
            Consumed.with(Serdes.String(), orderEventSerde())
        );

        stream
            .filter((key, order) -> order.getAmount() > 0)
            .mapValues(this::enrichOrder)
            .to("processed-orders", Produced.with(Serdes.String(), enrichedOrderSerde()));

        return stream;
    }

    private OrderEvent enrichOrder(OrderEvent order) {
        // enrichment logic
        return order;
    }
}
```

### Health and Lifecycle

Spring Boot auto-configures `KafkaStreams` lifecycle management. The application's readiness probe reflects the stream state (`RUNNING`, `REBALANCING`, `ERROR`).

```java
@Component
public class StreamsHealthIndicator implements HealthIndicator {

    private final KafkaStreams kafkaStreams;

    @Override
    public Health health() {
        KafkaStreams.State state = kafkaStreams.state();
        if (state == KafkaStreams.State.RUNNING) {
            return Health.up().withDetail("state", state).build();
        }
        return Health.down().withDetail("state", state).build();
    }
}
```

---

## 16. When to Use (and Not Use) Kafka Streams

### ✅ Use Kafka Streams When

| Scenario                             | Why                                    |
| ------------------------------------ | -------------------------------------- |
| Stateful aggregations                | Built-in state management with RocksDB |
| Stream-to-stream joins               | Windowed join semantics built in       |
| Stream enrichment from tables        | KTable / GlobalKTable joins            |
| Exactly-once processing within Kafka | Native transaction support             |
| Real-time materialized views         | KTable + Interactive Queries           |
| High-throughput pipelines            | Partition-based horizontal scaling     |

### ❌ Avoid Kafka Streams When

| Scenario                                              | Better Alternative                    |
| ----------------------------------------------------- | ------------------------------------- |
| Heavy external I/O per record (REST calls, DB writes) | Parallel Consumer (concurrent, async) |
| Simple event forwarding, no state                     | Plain Kafka Consumer                  |
| Complex async workflows                               | Project Reactor / Kotlin Coroutines   |
| Huge state per task (> tens of GB)                    | Apache Flink (external state backend) |
| Cross-team orchestration / saga management            | Saga Orchestrator (Temporal, Axon)    |

---

## 17. Kafka Streams vs Alternatives

### vs Parallel Consumer

| Aspect           | Kafka Streams                     | Parallel Consumer              |
| ---------------- | --------------------------------- | ------------------------------ |
| State management | Built-in (RocksDB)                | Manual (external DB)           |
| Processing model | Sync, per-partition               | Async, concurrent              |
| Primary use case | Data transformation / aggregation | High-throughput I/O-bound work |
| Exactly-once     | Yes (within Kafka)                | At-least-once (typically)      |

### vs Apache Flink

| Aspect                     | Kafka Streams                | Apache Flink                 |
| -------------------------- | ---------------------------- | ---------------------------- |
| Deployment                 | Embedded in application      | Separate cluster             |
| State size                 | Bounded by disk per instance | Scalable (external backends) |
| Operational complexity     | Low                          | High                         |
| Watermarking / late events | Basic                        | Advanced                     |
| SQL support                | None (native)                | Yes (Flink SQL)              |

### vs Project Reactor / WebFlux

| Aspect             | Kafka Streams             | Reactor               |
| ------------------ | ------------------------- | --------------------- |
| Processing model   | Sync, sequential per task | Async, non-blocking   |
| Throughput ceiling | High                      | Very high (I/O-bound) |
| State management   | Built-in                  | Manual                |
| Complexity         | Medium                    | High                  |

---

## 18. Production System Design Examples

### 18.1 Real-Time Fraud Detection

**Problem:** Detect suspicious transaction patterns per user — multiple transactions in a short window, high-value anomalies, unusual locations.

**Architecture:**

```
Transactions Topic
       ↓
Kafka Streams App
       ↓
┌─────────────────────────────────┐
│  groupByKey (userId)            │
│  windowedBy (5-min tumbling)    │
│  aggregate → FraudState         │
│  State: lastTxns, totalAmount,  │
│          locations              │
└─────────────────────────────────┘
       ↓
  .filter(state -> state.isSuspicious())
       ↓
Fraud Alerts Topic → Downstream Alert Service
```

**Implementation:**

```java
transactions
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .aggregate(
        FraudState::new,
        (userId, txn, state) -> state.add(txn),
        Materialized.<String, FraudState, WindowStore<Bytes, byte[]>>as("fraud-store")
            .withValueSerde(fraudStateSerde)
    )
    .toStream()
    .filter((windowedKey, state) -> state.isSuspicious())
    .map((windowedKey, state) -> new KeyValue<>(windowedKey.key(), state.toAlert()))
    .to("fraud-alerts");
```

**Challenges to address in production:**
- State grows unboundedly without windowing — always window or add TTL
- False positives from legitimate bursty users — tune thresholds carefully
- Late events (mobile clients going offline) — add a grace period

---

### 18.2 Order Processing Pipeline with Outbox Pattern

**Problem:** Transform, validate, and enrich orders in real-time for downstream payment, inventory, and shipping services. Guarantee exactly-once end-to-end including external DB writes.

**Architecture:**

```
Service DB (orders table)
        ↓  [CDC / Transactional Outbox]
Outbox Topic (orders-raw)
        ↓
Kafka Streams App
  ├── Validate (filter invalid orders)
  ├── Enrich (join with product KTable)
  └── Route (by order type)
        ↓
Processed Orders Topic
        ↓
Downstream Microservices
```

**Why Outbox Pattern?**

`exactly_once_v2` covers Kafka-internal atomicity. But writing to your own database is outside Kafka's transaction scope. The **Outbox Pattern** ensures:

1. Business logic writes to DB + outbox table in **one local transaction**
2. CDC (Debezium) captures the outbox table → publishes to Kafka
3. Kafka Streams processes the event exactly-once
4. Downstream receives guaranteed delivery

**Implementation:**

```java
KTable<String, Product> products = builder.globalTable(
    "product-catalog",
    Materialized.as("product-store")
);

builder.<String, OrderEvent>stream("orders-raw")
    .filter((key, order) -> order.isValid())
    .join(
        products,
        (orderKey, order) -> order.getProductId(),
        (order, product) -> order.enrichWith(product)
    )
    .to("processed-orders");
```

---

## 19. Failure Scenarios & Mitigation Matrix

| Scenario                        | What Happens                                    | Impact                              | Mitigation                                                       |
| ------------------------------- | ----------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| **Instance crash**              | Tasks reassigned, state restored from changelog | Downtime proportional to state size | Standby replicas                                                 |
| **Rebalance (new instance)**    | Processing pauses during task redistribution    | Temporary latency spike             | Static group membership (`group.instance.id`)                    |
| **Large state restore**         | Slow replay of changelog topic                  | Long recovery window                | Windowing, TTL, SSDs, standby replicas                           |
| **Changelog topic lag**         | State store behind the changelog                | Data inconsistency during restore   | Monitor lag, alert on restore duration                           |
| **Repartition topic growth**    | Hidden topics fill disk                         | Storage exhaustion                  | Topic retention policies, monitor                                |
| **Clock skew across producers** | Out-of-order events relative to event time      | Wrong window assignment             | Grace periods, use processing time not event time where feasible |
| **Zombie task (pre-fence)**     | Old instance continues writing after eviction   | Duplicate output                    | exactly_once_v2 fences zombie producers                          |

---

## Interview Questions

---

**Q: What is the difference between KStream and KTable?**

> A `KStream` is an unbounded, append-only sequence of independent records — every record is a distinct event. A `KTable` is a changelog stream where each new record for a key replaces the previous value — it represents the current state of a key, like a materialized view. `KTable` reads give you the latest value per key; `KStream` reads give you every event that ever occurred.

---

**Q: How does Kafka Streams handle state across restarts?**

> State stores (RocksDB) are backed by Kafka changelog topics. On restart, Kafka Streams reads the checkpoint file to find the last persisted offset, then replays the changelog topic from that point to rebuild local state. This means state is fully recoverable from Kafka without any external state management system.

---

**Q: What is `processing.guarantee=exactly_once_v2` and how does it work internally?**

> It configures Kafka Streams to wrap each read-process-write cycle in a Kafka transaction. Output records and consumer offsets are committed atomically in the same transaction. If processing fails before the transaction commits, it is aborted and retried — ensuring no duplicates. V2 uses one transactional producer per stream thread (rather than per task in V1), improving performance and reducing producer overhead.

---

**Q: Why does Kafka Streams sometimes show a persistent consumer lag of 1 even when caught up?**

> This is caused by transaction control records (commit/abort markers) written to the partition log by Kafka's transaction coordinator. These markers increment `LogEndOffset` but are invisible to normal consumers. The consumer's committed offset doesn't advance past them until a new data record arrives. So `LogEndOffset - CommittedOffset = 1` permanently. This is expected and safe to exclude from lag alerting.

---

**Q: How does repartitioning work and when does it occur?**

> Any operation that changes the record key — `map()`, `selectKey()`, `groupBy()` — causes Kafka Streams to write records to an auto-created repartition topic, partitioned by the new key. Records are then re-consumed from this topic, ensuring correct co-location of keys in the state store. This adds latency (extra Kafka round-trip), storage (extra topic), and network overhead. Prefer `mapValues()` when you only need to transform the value.

---

**Q: What happens during a rebalance and how do standby replicas help?**

> During a rebalance, all instances in the consumer group pause processing. Tasks are redistributed, and each instance must restore state for its newly assigned tasks by replaying changelog topics. With no standby replicas, this replay can take minutes for large state. Standby replicas are shadow tasks that continuously consume the changelog without processing input. On failover, they already have current state and can be promoted instantly, eliminating restore time.

---

**Q: Why is state store size a first-class design concern?**

> State size directly determines recovery time. `Recovery time ≈ state size / replay throughput`. A 100 GB state store with no checkpoint could take 15+ minutes to restore. This means every crash causes 15+ minutes of downtime per affected task. Controlling state size — through windowing, TTL, selective aggregation — is the primary lever for controlling availability.

---

**Q: When would you choose GlobalKTable over KTable for a join?**

> Choose `GlobalKTable` when the data being joined is relatively small, changes infrequently, and the stream you're joining it with is not co-partitioned (different partition count or different key). `GlobalKTable` is replicated to all instances, so no co-partitioning is required. The trade-off is higher memory usage per instance. For large tables or when co-partitioning is feasible, prefer `KTable` to avoid the replication overhead.

---

**Q: How would you design exactly-once end-to-end when writes go to an external database?**

> `exactly_once_v2` only guarantees atomicity within Kafka. For external database writes, use the **Transactional Outbox Pattern**: the consuming service writes its business state and an outbox record in a single local DB transaction. A CDC tool (e.g., Debezium) publishes the outbox record to Kafka. Downstream consumers process these events exactly-once. This achieves true end-to-end exactly-once by anchoring external writes to the same local transaction as the business logic.

---

## Summary — The Mental Model

```
Kafka Streams is:

   Kafka (Event Log — Source of Truth)
         +
   RocksDB (Local Database — Fast State Access)
         +
   Streams Engine (Topology — Query + Transformation)

= Event Sourcing + CQRS + Materialized Views
  running embedded in your application
```

### The Four Golden Rules

1. **State size = recovery time** — design state to be bounded
2. **Partition count = max parallelism** — more partitions = more tasks = more scale
3. **Changelog = source of truth** — everything flows from it on recovery
4. **Design for failure, not success** — rebalances and restores are normal events, not exceptional ones

> *"Design your state before your topology."* — Because state defines performance, scalability, and availability. The topology is just the code. The state is the architecture.
