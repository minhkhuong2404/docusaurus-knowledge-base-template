---
id: kafka-streams
title: "Kafka Streams: Topology & Branching"
slug: kafka-streams
---

# Kafka Streams: Topology & Branching

Kafka Streams is a lightweight client library for building real-time stream-processing applications on top of Apache Kafka. This guide covers its programming model, the topology concept, and branching patterns.

---

## 1. What Is Kafka Streams?

Kafka Streams lets you read from Kafka topics, process the data, and write results back to Kafka — all within your application process.

**Key advantages:**

- **No separate cluster** — runs inside your Java/Kotlin application (no Flink, Spark, etc.)
- **Exactly-once semantics** — built-in support via transactional APIs
- **Stateful processing** — local state stores backed by changelog topics
- **Elastic scaling** — add/remove instances; partitions rebalance automatically
- **Fault-tolerant** — state stores are replicated and recoverable

---

## 2. Core Abstractions

### KStream

An unbounded, continuously updating stream of records (key-value pairs). Each record represents an **event**.

```java
KStream<String, String> events = builder.stream("input-topic");
```

### KTable

A changelog stream where each record represents an **update** to a key. Only the latest value per key is retained.

```java
KTable<String, Long> counts = builder.table("counts-topic");
```

### GlobalKTable

Like a KTable but fully replicated on every application instance. Useful for small, read-heavy lookup datasets (e.g., reference data).

```java
GlobalKTable<String, String> regions = builder.globalTable("region-lookup");
```

---

## 3. Topology

A **topology** is a directed acyclic graph (DAG) of stream processors (nodes) connected by streams (edges). It defines the complete data flow of your application.

### Topology Structure

```
Source Processor(s)  →  Stream Processor(s)  →  Sink Processor(s)
    (read from         (filter, map, join,       (write to
     Kafka topics)      aggregate, branch)        Kafka topics)
```

### Building a Topology

```java
StreamsBuilder builder = new StreamsBuilder();

// Source: read from topic
KStream<String, String> input = builder.stream("raw-events");

// Process: filter + transform
KStream<String, String> processed = input
    .filter((key, value) -> value != null && !value.isEmpty())
    .mapValues(value -> value.toUpperCase());

// Sink: write to output topic
processed.to("processed-events");

// Build and inspect the topology
Topology topology = builder.build();
System.out.println(topology.describe());
```

### Inspecting the Topology

`topology.describe()` prints a human-readable representation:

```
Topologies:
   Sub-topology: 0
    Source: KSTREAM-SOURCE-0000000000 (topics: [raw-events])
      --> KSTREAM-FILTER-0000000001
    Processor: KSTREAM-FILTER-0000000001 (stores: [])
      --> KSTREAM-MAPVALUES-0000000002
      <-- KSTREAM-SOURCE-0000000000
    Processor: KSTREAM-MAPVALUES-0000000002 (stores: [])
      --> KSTREAM-SINK-0000000003
      <-- KSTREAM-FILTER-0000000001
    Sink: KSTREAM-SINK-0000000003 (topic: processed-events)
      <-- KSTREAM-MAPVALUES-0000000002
```

### Visualizing the Topology

You can paste the output of `topology.describe()` into tools like [Kafka Streams Topology Visualizer](https://zz85.github.io/kafka-streams-viz/) to get a graphical DAG.

---

## 4. Stateless Operations

These operations process each record independently, without maintaining state.

| Operation      | Description                                          | Example                                           |
|---------------|------------------------------------------------------|---------------------------------------------------|
| `filter`       | Keep records matching a predicate                    | `.filter((k, v) -> v.contains("ERROR"))`         |
| `filterNot`    | Remove records matching a predicate                  | `.filterNot((k, v) -> v.isEmpty())`              |
| `map`          | Transform both key and value                         | `.map((k, v) -> KeyValue.pair(k, v.length()))`   |
| `mapValues`    | Transform value only (preserves key and partition)   | `.mapValues(v -> v.toUpperCase())`               |
| `flatMap`      | One record → zero or more records (new key-value)    | `.flatMap((k, v) -> splitIntoMultiple(k, v))`    |
| `flatMapValues`| One value → zero or more values                      | `.flatMapValues(v -> Arrays.asList(v.split(",")))`|
| `selectKey`    | Change the key (triggers repartition)                | `.selectKey((k, v) -> extractNewKey(v))`         |
| `peek`         | Side effect (logging, metrics) without modifying     | `.peek((k, v) -> log.info("key={}", k))`        |
| `merge`        | Combine two KStreams into one                        | `stream1.merge(stream2)`                         |

---

## 5. Branching (split)

Branching allows you to **split a single stream into multiple sub-streams** based on predicates. This is essential when different records need different processing pipelines.

### Modern API: `split()` (Kafka 2.8+, recommended)

```java
KStream<String, OrderEvent> orders = builder.stream("orders");

Map<String, KStream<String, OrderEvent>> branches = orders
    .split(Named.as("order-"))
    .branch(
        (key, order) -> order.getStatus().equals("CREATED"),
        Branched.as("created")
    )
    .branch(
        (key, order) -> order.getStatus().equals("SHIPPED"),
        Branched.as("shipped")
    )
    .branch(
        (key, order) -> order.getStatus().equals("CANCELLED"),
        Branched.as("cancelled")
    )
    .defaultBranch(Branched.as("other"));

// Access individual branches by name
KStream<String, OrderEvent> createdOrders  = branches.get("order-created");
KStream<String, OrderEvent> shippedOrders  = branches.get("order-shipped");
KStream<String, OrderEvent> cancelledOrders = branches.get("order-cancelled");
KStream<String, OrderEvent> otherOrders    = branches.get("order-other");

// Process each branch independently
createdOrders.to("orders-created");
shippedOrders.to("orders-shipped");
cancelledOrders.mapValues(order -> createRefund(order)).to("refunds");
otherOrders.to("orders-dlq");
```

### How Branching Works

```
                        ┌─── status=CREATED ──▶ orders-created topic
                        │
orders topic ──▶ split ─┼─── status=SHIPPED ──▶ orders-shipped topic
                        │
                        ├─── status=CANCELLED ▶ refunds topic
                        │
                        └─── default ──────────▶ orders-dlq topic
```

**Rules:**
- Predicates are evaluated **in order** — a record goes to the **first** matching branch.
- `defaultBranch()` catches everything that didn't match any predicate.
- If no default branch is defined, unmatched records are **dropped**.

### Legacy API: `branch()` (before Kafka 2.8)

```java
// Returns an array of KStreams — harder to work with
@SuppressWarnings("unchecked")
KStream<String, OrderEvent>[] branches = orders.branch(
    (key, order) -> order.getStatus().equals("CREATED"),
    (key, order) -> order.getStatus().equals("SHIPPED"),
    (key, order) -> true  // default catch-all
);

KStream<String, OrderEvent> created = branches[0];
KStream<String, OrderEvent> shipped = branches[1];
KStream<String, OrderEvent> other   = branches[2];
```

> **Prefer `split()` over `branch()`** — the named map return is type-safe and more readable.

---

## 6. Stateful Operations

These operations maintain state and enable powerful aggregations, joins, and windowing.

### Aggregation

```java
KTable<String, Long> orderCounts = orders
    .groupByKey()
    .count(Materialized.as("order-count-store"));
```

### Windowed Aggregation

```java
TimeWindows fiveMinWindow = TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5));

KTable<Windowed<String>, Long> windowedCounts = orders
    .groupByKey()
    .windowedBy(fiveMinWindow)
    .count(Materialized.as("windowed-order-count"));
```

### Window Types

| Window Type       | Description                                                     |
|------------------|-----------------------------------------------------------------|
| **Tumbling**      | Fixed-size, non-overlapping (e.g., every 5 min)                |
| **Hopping**       | Fixed-size, overlapping (e.g., 5 min window, advance 1 min)    |
| **Sliding**       | Triggered by record arrival within a time difference            |
| **Session**       | Activity-based; closes after inactivity gap                     |

### Joins

```java
// KStream-KStream join (windowed)
KStream<String, EnrichedOrder> enriched = orders.join(
    payments,
    (order, payment) -> new EnrichedOrder(order, payment),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(5)),
    StreamJoined.with(Serdes.String(), orderSerde, paymentSerde)
);

// KStream-KTable join (lookup enrichment)
KStream<String, EnrichedOrder> enriched = orders.leftJoin(
    customerTable,
    (order, customer) -> enrichWithCustomer(order, customer)
);

// KStream-GlobalKTable join (broadcast lookup)
KStream<String, EnrichedOrder> enriched = orders.join(
    regionTable,
    (key, order) -> order.getRegionId(),  // foreign key extractor
    (order, region) -> enrichWithRegion(order, region)
);
```

### Join Types Summary

| Join                          | Windowed? | Use Case                          |
|------------------------------|-----------|-----------------------------------|
| KStream–KStream              | Yes       | Correlate two event streams       |
| KStream–KTable               | No        | Enrich events with latest state   |
| KStream–GlobalKTable         | No        | Enrich with fully-replicated data |
| KTable–KTable                | No        | Join two changelog streams        |

---

## 7. State Stores

Kafka Streams uses **RocksDB** as the default local state store engine.

- State is partitioned — each task manages state for its assigned partitions.
- State is backed by a **changelog topic** in Kafka for fault tolerance.
- On restart, state is restored from the changelog topic.
- **Standby replicas** (`num.standby.replicas`) reduce restore time on failover.

### Interactive Queries

You can query state stores directly from your application (read-only):

```java
ReadOnlyKeyValueStore<String, Long> store =
    streams.store(
        StoreQueryParameters.fromNameAndType(
            "order-count-store",
            QueryableStoreTypes.keyValueStore()
        )
    );

Long count = store.get("order-123");
```

---

## 8. Error Handling

### Deserialization Errors

```java
props.put(
    StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG,
    LogAndContinueExceptionHandler.class  // skip bad records
);
```

Options:
- `LogAndContinueExceptionHandler` — log and skip
- `LogAndFailExceptionHandler` — log and shut down (default)

### Production Errors

```java
props.put(
    StreamsConfig.DEFAULT_PRODUCTION_EXCEPTION_HANDLER_CLASS_CONFIG,
    DefaultProductionExceptionHandler.class
);
```

### Uncaught Exceptions (Kafka 2.8+)

```java
streams.setUncaughtExceptionHandler(exception -> {
    log.error("Uncaught exception", exception);
    return StreamsUncaughtExceptionHandler.StreamThreadExceptionResponse.REPLACE_THREAD;
});
```

Options: `REPLACE_THREAD`, `SHUTDOWN_CLIENT`, `SHUTDOWN_APPLICATION`.

---

## 9. Testing

Kafka Streams provides `TopologyTestDriver` for unit testing without a running Kafka cluster:

```java
@Test
void shouldUppercaseValues() {
    StreamsBuilder builder = new StreamsBuilder();
    KStream<String, String> input = builder.stream("input");
    input.mapValues(v -> v.toUpperCase()).to("output");

    try (TopologyTestDriver driver = new TopologyTestDriver(builder.build(), props)) {
        TestInputTopic<String, String> inputTopic =
            driver.createInputTopic("input", new StringSerializer(), new StringSerializer());
        TestOutputTopic<String, String> outputTopic =
            driver.createOutputTopic("output", new StringDeserializer(), new StringDeserializer());

        inputTopic.pipeInput("key1", "hello");

        assertEquals("HELLO", outputTopic.readValue());
    }
}
```

---

## 10. Configuration Essentials

| Property                          | Description                                           |
|----------------------------------|-------------------------------------------------------|
| `application.id`                 | Unique ID for the Streams app (also used as group.id) |
| `bootstrap.servers`             | Kafka broker addresses                                |
| `default.key.serde`             | Default key serializer/deserializer                   |
| `default.value.serde`           | Default value serializer/deserializer                 |
| `processing.guarantee`          | `at_least_once` (default) or `exactly_once_v2`       |
| `num.stream.threads`            | Number of processing threads per instance             |
| `num.standby.replicas`          | Standby copies of state stores for fast failover      |
| `state.dir`                      | Directory for local RocksDB state stores              |
| `commit.interval.ms`            | How often to commit offsets and flush state            |

---

## 11. Best Practices

1. **Design your topology first** — sketch the DAG before coding.
2. **Use `split()` for branching** — prefer the named API over the legacy `branch()` array.
3. **Keep state stores small** — use windowed aggregations or compacted topics to bound state size.
4. **Use `TopologyTestDriver`** — unit test your topology without spinning up Kafka.
5. **Scale with `num.stream.threads`** — increase threads up to your partition count per instance.
6. **Enable standby replicas** — reduces downtime during rebalancing.
7. **Name your processors** — use `Named.as(...)` to make topology descriptions readable.
8. **Monitor processing lag** — track `records-lag-max` and `commit-latency-avg` metrics.

---

## Further Reading

- [Kafka Streams Documentation](https://kafka.apache.org/documentation/streams/)
- [Kafka Streams Developer Guide](https://docs.confluent.io/platform/current/streams/developer-guide/index.html)
- [Topology Visualizer](https://zz85.github.io/kafka-streams-viz/)
