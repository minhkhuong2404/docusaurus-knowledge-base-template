---
id: production-runbook
title: Kafka Streams — Production Runbook, Testing & Anti-Patterns
sidebar_label: 7. Production Runbook & Testing
sidebar_position: 7
description: >
  Production operations guide for Kafka Streams: unit testing with TopologyTestDriver,
  observability metrics runbook, 7 fatal anti-patterns, 5-way streaming engine comparison,
  system design architectures, and complete failure mitigation matrix.
tags:
  - kafka
  - kafka-streams
  - production
  - testing
  - monitoring
  - anti-patterns
  - system-design
---

import KafkaStreamsExactlyOnceDiagram from '@site/src/components/KafkaStreamsExactlyOnceDiagram';

# Kafka Streams — Production Runbook, Testing & Anti-Patterns

> **Principal Engineering Overview:** Deploying stateful Kafka Streams topologies to production requires strict operational rigor. Unlike stateless microservices, stream processors carry multi-gigabyte local state stores, interact continuously with broker transaction coordinators, and rely on exact stream-time progression. This runbook details testing methodologies, monitoring signals, architectural anti-patterns, and failure mitigations.

---

## 1. Unit Testing with `TopologyTestDriver`

Testing Kafka Streams topologies does **not** require booting a local Kafka broker, KRaft cluster, or Testcontainers. Apache Kafka provides `TopologyTestDriver`, which executes topologies **100% deterministically in-memory** on a single thread.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TopologyTestDriver ARCHITECTURE                       │
│                                                                             │
│   TestInputTopic<K, V>                    TestOutputTopic<K, V>             │
│   [pipeInput(key, val, ts)]               [readKeyValue(), readValuesToList]│
│             │                                              ▲                │
│             ▼                                              │                │
│   ┌────────────────────────────────────────────────────────┴────────────┐   │
│   │              Synchronous In-Memory Topology Pipeline                │   │
│   │   • Immediate execution (No background threads or poll loops)       │   │
│   │   • Virtual clock advances strictly based on piped timestamps       │   │
│   │   • In-memory KeyValueStore and WindowStore state inspection        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Complete Test Suite: Windowing & Stream-Time Verification

```java
package com.example.kafka.topology;

import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.TestInputTopic;
import org.apache.kafka.streams.TestOutputTopic;
import org.apache.kafka.streams.TopologyTestDriver;
import org.apache.kafka.streams.state.KeyValueStore;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;

public class OrderAggregationTopologyTest {

    private TopologyTestDriver testDriver;
    private TestInputTopic<String, String> inputTopic;
    private TestOutputTopic<String, Long> outputTopic;

    @BeforeEach
    void setUp() {
        StreamsBuilder builder = new StreamsBuilder();
        OrderTopology topology = new OrderTopology();
        topology.buildPipeline(builder);

        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "test-order-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:1234");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass().getName());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass().getName());

        testDriver = new TopologyTestDriver(builder.build(), props);
        inputTopic = testDriver.createInputTopic("orders-raw", new StringSerializer(), new StringSerializer());
        outputTopic = testDriver.createOutputTopic("orders-counted", new StringDeserializer(), new org.apache.kafka.common.serialization.LongDeserializer());
    }

    @AfterEach
    void tearDown() {
        if (testDriver != null) {
            testDriver.close();
        }
    }

    @Test
    @DisplayName("Should verify state store content directly")
    void testDirectStateStoreQuery() {
        inputTopic.pipeInput("CUST-100", "ORDER-A", Instant.parse("2026-06-08T10:00:00Z"));
        inputTopic.pipeInput("CUST-100", "ORDER-B", Instant.parse("2026-06-08T10:01:00Z"));

        KeyValueStore<String, Long> store = testDriver.getKeyValueStore("customer-order-count-store");
        assertNotNull(store);
        assertEquals(2L, store.get("CUST-100"));
    }

    @Test
    @DisplayName("Should advance Stream-Time explicitly to trigger suppressed window emissions")
    void testSuppressedWindowClosing() {
        Instant t0 = Instant.parse("2026-06-08T12:00:00Z");

        // Window size: 10 mins [12:00 - 12:10], Grace: 1 min -> Closes at stream-time >= 12:11
        inputTopic.pipeInput("USER-1", "TX-1", t0.plus(Duration.ofMinutes(2)));
        inputTopic.pipeInput("USER-1", "TX-2", t0.plus(Duration.ofMinutes(5)));

        // Output remains empty because stream-time has not passed window end + grace
        assertTrue(outputTopic.isEmpty(), "Suppressed output should remain buffered while window is open");

        // Advance stream-time past the closing barrier (12:11:01)
        inputTopic.pipeInput("USER-1", "PULSE", t0.plus(Duration.ofMinutes(12)));

        // Window closes and emits exactly one consolidated result
        assertFalse(outputTopic.isEmpty());
        assertEquals(2L, outputTopic.readValue());
    }
}
```

---

## 2. Production Observability & Key Metrics Runbook

Kafka Streams exposes JMX metrics via the `kafka.streams` domain. In production Kubernetes environments, export these via Micrometer or the Prometheus JMX Exporter:

| Metric Name | Subsystem | Alert Threshold | Operational Meaning & Remediation |
|:---|:---|:---|:---|
| `record-e2e-latency-avg` | Processor Node | Spike $> 2000\text{ ms}$ | Lag from initial record creation timestamp to output publication. Indicates processing bottlenecks or thread starvation. |
| `process-rate` | StreamThread | Drops to $0\text{ rec/s}$ | Processing throughput per thread. Zero indicates a rebalance storm, lock contention, or stalled partition. |
| `commit-latency-avg` | StreamThread | $> 250\text{ ms}$ | Duration spent flushing RocksDB memtables and committing broker transaction markers. High latency points to slow broker disks. |
| `active-process-ratio` | StreamThread | $< 0.10$ or $> 0.95$ | Fraction of thread time spent actively processing vs polling. High ($> 0.95$) = CPU saturation; Low ($< 0.10$) = idle thread. |
| `dropped-records-total` | Stream Node | $> 0\text{ (Rate alert)}$ | Records dropped due to grace period expiration or deserialization failures. Investigate late-arriving events or producer clock skew. |
| `block-cache-hit-ratio` | RocksDB | $< 0.85$ | Ratio of reads satisfied from RAM. Values below 85% cause massive NVMe disk I/O read spikes and CPU iowait. |
| `memtable-flush-pending` | RocksDB | $> 2$ | Pending memtables waiting to write to disk. Risk of RocksDB write stalls. Tune `max_background_flushes`. |
| `restore-remaining-records` | StateRestoreListener | Increasing | Backlog of changelog records awaiting replay. Tracks cold restore recovery duration. |

---

## 3. The 7 Fatal Kafka Streams Anti-Patterns

Before promoting any Kafka Streams application to production, audit your topology code against these seven catastrophic anti-patterns:

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

### Detailed Anti-Pattern Mechanics

1. **Synchronous or Reactive Network I/O**: Executing REST, gRPC, or external SQL lookups inside stream operators halts the thread loop. Offsets commit prematurely on async returns, destroying exactly-once guarantees, while blocking threads triggers `max.poll.interval.ms` rebalances.
2. **Unbounded KeyValueStores**: Creating non-windowed stores without periodic purging leads to continuous disk growth and hours-long cold restore times upon node migration.
3. **Unnecessary Key Modifications via `.map()`**: Modifying keys when only values change forces Kafka Streams to provision internal repartition topics (`-repartition`), incurring redundant network roundtrips and disk writes. Always use `.mapValues()`.
4. **Wall-Clock Time Reliance for Aggregations**: Extracting `System.currentTimeMillis()` instead of record timestamps produces inconsistent results during historic replays and cluster recovery.
5. **Static Shared State Across StreamThreads**: StreamThreads run concurrently within the same JVM. Accessing non-thread-safe singletons or raw HashMaps creates race conditions and corrupts memory.
6. **Anonymous Topology Operators**: Omitting explicit `Named.as()` and `Materialized.as()` parameters causes Kafka Streams to auto-generate index names (`KSTREAM-MAP-0000000001`). Minor code edits change these indexes, causing topology naming shifts and full state invalidation.
7. **Mixing Spring Framework Stacks**: Declaring both `@EnableKafkaStreams` and Spring Cloud Stream functional binders in the same classpath results in competing lifecycle managers fighting over client startup.

---

## 4. Exactly-Once Semantics & Transactional Loop

When operating with `processing.guarantee=exactly_once_v2`, Kafka Streams coordinates atomic transactions encompassing consumed partition offsets, RocksDB state changes, and produced downstream events.

<KafkaStreamsExactlyOnceDiagram />

### Zombie Producer Fencing
If an unresponsive stream thread unblocks after being evicted by the group coordinator, broker transaction coordinators reject any writes stamped with stale Producer Epochs, preventing split-brain state pollution.

---

## 5. Streaming Engine Decision Matrix: 5-Way Comparison

Selecting the right streaming engine requires balancing operational overhead, state storage, and latency requirements:

| Architectural Dimension | Kafka Streams | Apache Flink | Apache Spark Structured Streaming | ksqlDB | Raw Consumer API (Parallel Consumer) |
|:---|:---|:---|:---|:---|:---|
| **Deployment Model** | **Embedded Java Library** (Standard microservice) | **Distributed Cluster** (JobManager + TaskManagers) | **Distributed Cluster** (Driver + Executors) | **Standalone Server Cluster** | **Embedded Java Library** |
| **Operational Overhead** | **Lowest** (Standard K8s container deployment) | **High** (Requires Flink Kubernetes Operator) | **High** (Cluster managers, YARN/K8s executors) | **Medium** (Separate cluster infrastructure) | **Lowest** (Standard container) |
| **Processing Latency** | **Sub-millisecond** (Continuous record-by-record) | **Sub-millisecond** (Continuous event-driven) | **100 ms – 1 s** (Micro-batch by default) | **Sub-millisecond** (Continuous) | **Sub-millisecond** (Continuous) |
| **State Storage** | Embedded RocksDB / Heap | Embedded RocksDB (checkpointed to S3/HDFS) | Memory / RocksDB (checkpointed to HDFS/S3) | Embedded RocksDB via Kafka Streams | None (Stateless or external DB) |
| **Fault Recovery** | Local `.checkpoint` file + Compacted changelog topic | Distributed Chandy-Lamport state snapshots | Lineage graph + WAL replay | Compacted changelog topic | Kafka partition offset rewind |
| **SQL Capabilities** | ❌ None (Pure Java/Scala DSL & PAPI) | ✅ First-class ANSI Flink SQL | ✅ First-class Spark SQL | ✅ SQL-first streaming syntax | ❌ None |
| **Elastic Autoscaling** | Bounded by partition count ($N \le \text{partitions}$) | Dynamic task slot allocation | Dynamic executor autoscaling | Bounded by partition count | Key-hash worker concurrency ($N > \text{partitions}$) |
| **Best Production Fit** | Stateful event-driven microservices, CQRS materialized views, low-ops Java teams | Large-scale complex event processing (CEP), cross-stream joins across heterogeneous brokers | Large-scale unified batch + streaming, ML feature engineering | Rapid SQL prototyping, Kafka-native stream ETL | Stateless asynchronous I/O, REST/DB dispatching |

---

## 6. Production System Design Blueprints

### Blueprint 1: Real-Time Fraud Detection Engine

```java
// Architecture: Identify accounts executing > 5 transactions within a 10-minute sliding window
KStream<String, Transaction> transactions = builder.stream("transactions-raw");

KTable<Windowed<String>, Long> suspiciousCounts = transactions
    .groupByKey(Grouped.as("group-by-account"))
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(10), Duration.ofMinutes(1)))
    .count(
        Named.as("count-account-txs"),
        Materialized.as("account-tx-store")
    )
    .suppress(Suppressed.untilWindowCloses(
        Suppressed.BufferConfig.maxBytes(64 * 1024 * 1024L).emitEarlyWhenFull()
    ));

suspiciousCounts.toStream()
    .filter((windowedKey, count) -> count != null && count > 5)
    .map((windowedKey, count) -> KeyValue.pair(
        windowedKey.key(),
        new FraudAlert(windowedKey.key(), count, windowedKey.window().start(), windowedKey.window().end())
    ))
    .to("fraud-alerts", Produced.with(Serdes.String(), fraudAlertSerde));
```

### Blueprint 2: Order Enrichment Pipeline with GlobalKTable

```java
// Architecture: Join high-throughput orders stream against slowly changing product catalog
GlobalKTable<String, Product> productCatalog = builder.globalTable(
    "product-catalog",
    Materialized.as("global-product-store")
);

KStream<String, Order> orders = builder.stream("orders-raw");

orders
    .join(
        productCatalog,
        (orderKey, order) -> order.getProductId(), // Key extractor for GlobalKTable lookup
        (order, product) -> order.withProductDetails(product),
        Named.as("enrich-order-product")
    )
    .to("orders-enriched");
```

---

## 7. Production Failure Scenarios & Mitigation Matrix

| Failure Scenario | Physical Runtime Impact | Latency Impact | Automated Mitigation & Remediation |
|:---|:---|:---|:---|
| **Pod Crash or Hard Kill** | Consumer group rebalance; standby promotion or changelog restore | Downtime proportional to state size | Deploy warm standby replicas (`num.standby.replicas=1`); use Cooperative Sticky Assignor. |
| **Rebalance Storm on Pod Scaling** | Task assignment churn across instances | Periodic processing freezes | Configure `CooperativeStickyAssignor`; tune `probing.rebalance.interval.ms` (10m). |
| **Cold State Restore from Scratch** | Full changelog replay from offset 0 across network | Minutes to hours of pod startup lag | Provision persistent NVMe volumes (`state.dir`); preserve local `.checkpoint` files. |
| **Topology Operator Naming Shift** | State store name mismatch; orphan changelog topics created | Critical startup stall; state loss | Mandate explicit `Named.as()` and `Materialized.as()` on all topology nodes. |
| **Rolling Update Sub-Topology Mismatch** | `v1` and `v2` pods disagree on sub-topology task duties | Continuous cluster-wide rebalance loop | Adopt Blue-Green deployment or Strategy 4 Dummy Stub migration. |
| **Zombie Task Split-Brain** | Stale evicted task attempts writing to output topic | Duplicate records published downstream | Enforce `processing.guarantee=exactly_once_v2`; broker fences stale epochs. |
| **Changelog Topic Consumer Lag** | Local store lags behind source of truth | Degraded read accuracy | Monitor `restore-remaining-records`; attach custom `StateRestoreListener`. |
| **Internal Repartition Topic Growth** | High-churn `.map()` fills broker disks | Cluster disk exhaustion | Validate retention configurations; replace `.map()` with `.mapValues()`. |
| **Idle Partition Window Freeze** | Stream-time halts; window close never triggered | Indefinite pipeline stalling | Inject synthetic heartbeat pulse records or use `WALL_CLOCK_TIME` Punctuator. |
| **RocksDB Cgroup Memory OOMKilled** | Native C++ off-heap allocations exceed pod limit | Kubernetes Exit Code 137 | Implement `CustomRocksDBConfigSetter` enforcing shared Cache and WriteBufferManager. |
