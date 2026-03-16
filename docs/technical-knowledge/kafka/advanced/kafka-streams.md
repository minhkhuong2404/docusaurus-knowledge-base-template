---
id: kafka-streams
title: Kafka Streams
sidebar_label: Kafka Streams
---

# Kafka Streams

## What is Kafka Streams?

**Kafka Streams** is a client library for building **stream processing applications** directly on top of Kafka. Unlike batch processing (Spark, Flink running separately), Kafka Streams runs **inside your application** — no separate cluster needed.

```
Input Topic(s) → [Kafka Streams App] → Output Topic(s)
                        │
                 KTable / KStream
                 Stateful operations
                 Windowing / Joins
```

---

## Key Abstractions

### KStream
An unbounded, append-only stream of records. Every record is processed independently.

```java
KStream<String, OrderEvent> orders = builder.stream("orders");
orders
    .filter((key, order) -> order.getAmount() > 100)
    .mapValues(order -> enrich(order))
    .to("high-value-orders");
```

### KTable
A changelog stream — each record represents an update to a key's current value (like a database table).

```java
KTable<String, UserProfile> users = builder.table("user-profiles");
```

### GlobalKTable
Like KTable but **replicated to all instances** — useful for lookup/enrichment without partition co-location.

```java
GlobalKTable<String, Product> products = builder.globalTable("product-catalog");
```

---

## Topology

A Kafka Streams application is a **directed acyclic graph (DAG)** of processors:

```
[Source Processor]
      │
[Filter Processor]
      │
[MapValues Processor]
      │
[Sink Processor]
```

```java
StreamsBuilder builder = new StreamsBuilder();

KStream<String, String> source = builder.stream("input-topic");
source
    .filter((k, v) -> v != null)
    .mapValues(String::toUpperCase)
    .to("output-topic");

Topology topology = builder.build();
System.out.println(topology.describe()); // print DAG

KafkaStreams streams = new KafkaStreams(topology, props);
streams.start();
```

---

## Stream Operations

### Stateless Transformations

```java
stream
    .filter((k, v) -> v.getStatus().equals("ACTIVE"))
    .filterNot((k, v) -> v.isDeleted())
    .map((k, v) -> new KeyValue<>(v.getUserId(), v))
    .mapValues(event -> transform(event))
    .flatMapValues(event -> expand(event))
    .selectKey((k, v) -> v.getPartitionKey());
```

### Stateful Transformations

#### Aggregation
```java
KGroupedStream<String, OrderEvent> grouped = orders.groupByKey();

KTable<String, Long> orderCounts = grouped
    .count(Materialized.as("order-count-store"));

KTable<String, Double> totalRevenue = grouped
    .aggregate(
        () -> 0.0,                                    // initializer
        (key, order, aggregate) -> aggregate + order.getAmount(), // aggregator
        Materialized.<String, Double, KeyValueStore<Bytes, byte[]>>as("revenue-store")
            .withKeySerde(Serdes.String())
            .withValueSerde(Serdes.Double())
    );
```

#### Windowed Aggregation
```java
KTable<Windowed<String>, Long> windowedCounts = orders
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count(Materialized.as("windowed-order-count"));
```

### Joins

```java
// KStream-KTable join (enrichment)
KStream<String, EnrichedOrder> enriched = orders.join(
    users,
    (order, user) -> new EnrichedOrder(order, user),
    Joined.with(Serdes.String(), orderSerde, userSerde)
);

// KStream-KStream join (co-occurring events within a time window)
KStream<String, MatchedEvent> matched = payments.join(
    orders,
    (payment, order) -> new MatchedEvent(payment, order),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofSeconds(30)),
    StreamJoined.with(Serdes.String(), paymentSerde, orderSerde)
);
```

---

## State Stores

Kafka Streams maintains **local state stores** (RocksDB by default) backed by changelog topics:

```java
// Define a store
StoreBuilder<KeyValueStore<String, Long>> storeBuilder =
    Stores.keyValueStoreBuilder(
        Stores.persistentKeyValueStore("my-state-store"),
        Serdes.String(),
        Serdes.Long()
    );
builder.addStateStore(storeBuilder);

// Access in a processor
stream.process(() -> new Processor<String, Long, String, Long>() {
    private KeyValueStore<String, Long> store;

    @Override
    public void init(ProcessorContext<String, Long> context) {
        store = context.getStateStore("my-state-store");
    }

    @Override
    public void process(Record<String, Long> record) {
        Long current = store.get(record.key());
        store.put(record.key(), (current == null ? 0L : current) + record.value());
    }
}, "my-state-store");
```

### Interactive Queries
Query state stores from outside the Streams app:
```java
ReadOnlyKeyValueStore<String, Long> store =
    streams.store(StoreQueryParameters.fromNameAndType(
        "order-count-store", QueryableStoreTypes.keyValueStore()));

Long count = store.get("ORD-100");
```

---

## Spring Boot Integration

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
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-stream-processor");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
        props.put(StreamsConfig.REPLICATION_FACTOR_CONFIG, 3);
        props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 4);
        return new KafkaStreamsConfiguration(props);
    }

    @Bean
    public KStream<String, OrderEvent> orderStream(StreamsBuilder builder) {
        KStream<String, OrderEvent> stream = builder.stream("orders");
        stream
            .filter((k, v) -> v.getAmount() > 0)
            .mapValues(this::enrichOrder)
            .to("processed-orders");
        return stream;
    }
}
```

---

## Exactly-Once in Kafka Streams

```properties
processing.guarantee=exactly_once_v2
```

This configures:
- Transactional producers per stream task
- Atomic commit of output records + consumer offsets
- Fencing of zombie tasks

---

## Interview Questions — Kafka Streams

**Q: What is the difference between KStream and KTable?**

> A `KStream` represents an append-only stream where every record is an independent event. A `KTable` represents a changelog where each new record for a key replaces the previous value — like a materialized view of the latest state. Reading from a `KTable` gives you the current value for each key, not the history.

**Q: How does Kafka Streams handle state across application restarts?**

> State stores are backed by Kafka changelog topics. On restart, Kafka Streams rebuilds local state by replaying the changelog topic from the beginning (or from a local RocksDB snapshot if available, called a standby replica). This makes the application fault-tolerant without external state management.

**Q: What is `processing.guarantee=exactly_once_v2`?**

> It enables exactly-once semantics in Kafka Streams using transactional producers. Each stream task wraps its read-process-write cycle in a Kafka transaction, atomically committing output records and input offsets. V2 (since Kafka 2.6) uses one producer per thread rather than per task, improving performance.

**Q: What is the difference between a windowed aggregation and a sessionized aggregation?**

> A **windowed aggregation** (tumbling, hopping, sliding) groups events into fixed or overlapping time buckets. A **session window** groups events by activity gap — all events for a key with no gap longer than `inactivityGap` are grouped together, creating variable-length windows based on actual activity patterns. Session windows are useful for user session analytics.

**Q: How does Kafka Streams scale?**

> Kafka Streams parallelism is based on partition count. Each stream task processes one input partition. Multiple tasks run in parallel on available stream threads. Scaling out (more instances) causes Kafka's internal topic partitions to be redistributed across instances. The max parallelism is limited by the partition count of the input topics.

---

## Advanced Editorial Pass: Stream Processing as Stateful System Design

### What Matters Beyond API Usage
- Topology design is a resilience and operability decision, not only functional flow.
- State store strategy influences recovery time and resource footprint.
- Windowing and join semantics must reflect business time and late-arrival behavior.

### Production Failure Modes
- Repartition topics and state stores growing without lifecycle controls.
- Event-time assumptions breaking under clock skew and delayed producers.
- Exactly-once expectations invalidated by external side effects.

### Engineering Heuristics
1. Make topology naming and processor intent explicit for debugging.
2. Size state and retention with recovery objectives in mind.
3. Test with out-of-order and late events, not only ordered happy paths.
