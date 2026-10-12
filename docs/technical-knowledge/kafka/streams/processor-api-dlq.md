---
id: processor-api-dlq
title: Kafka Streams — Processor API (PAPI), DLQ & Deduplication
sidebar_label: 5. Processor API & DLQ
sidebar_position: 5
description: >
  Deep dive into Kafka Streams Modern Processor API (PAPI 3.x+), Wall-Clock vs Stream-Time Punctuators,
  WindowStore event deduplication, Dead Letter Queue (DLQ) DeserializationExceptionHandler,
  the Async Network I/O anti-pattern, and Schema Registry Serdes.
tags:
  - kafka
  - kafka-streams
  - processor-api
  - dlq
  - deduplication
  - serdes
  - async-processing
---

# Kafka Streams — Processor API (PAPI), DLQ & Deduplication

> **Architectural Premise:** While the High-Level DSL (`map`, `filter`, `groupBy`, `join`) satisfies standard event streaming pipelines, advanced requirements—such as custom session timeouts, idempotent event deduplication, scheduled state purging, and robust poison-pill routing—require the low-level **Processor API (PAPI)** and custom broker error handlers.

---

## 1. Modern Processor API (PAPI 3.x+)

Starting in Apache Kafka 3.0, the legacy `Processor<K, V>` interface (which relied on void method parameters and ambient context mutations) was superseded by the type-safe **Modern Processor API**:

- **`org.apache.kafka.streams.processor.api.Processor<KIn, VIn, KOut, VOut>`**: Strongly typed across input and output keys and values.
- **`Record<K, V>`**: Explicit immutable record encapsulation carrying key, value, timestamp, and Kafka headers.
- **`ContextualProcessor<KIn, VIn, KOut, VOut>`**: Abstract base class providing direct access to `context()` without manual field tracking.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MODERN PROCESSOR API PIPELINE                         │
│                                                                             │
│   Record<KIn, VIn>                               Record<KOut, VOut>         │
│   [Key, Val, TS, Headers]                       [Key, Val, TS, Headers]     │
│             │                                              ▲                │
│             ▼                                              │                │
│   ┌────────────────────────────────────────────────────────┴────────────┐   │
│   │  ContextualProcessor<KIn, VIn, KOut, VOut>                          │   │
│   │                                                                     │   │
│   │   init(ProcessorContext context)                                    │   │
│   │     ├── stateStore = context.getStateStore("state-store")           │   │
│   │     └── context.schedule(Duration, PunctuationType, Punctuator)     │   │
│   │                                                                     │   │
│   │   process(Record<KIn, VIn> record)                                  │   │
│   │     ├── stateStore.get() / put()                                    │   │
│   │     └── context().forward(record.withValue(newVal))                 │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│                       ┌─────────────────────────────┐                       │
│                       │ Local RocksDB State Store   │                       │
│                       └─────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Complete Implementation: Stateful Order Aggregator with Punctuator

```java
package com.example.kafka.processor;

import org.apache.kafka.streams.processor.PunctuationType;
import org.apache.kafka.streams.processor.api.ContextualProcessor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;
import org.apache.kafka.streams.state.KeyValueStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

public class OrderAggregationProcessor extends ContextualProcessor<String, Order, String, CustomerSummary> {

    private static final Logger log = LoggerFactory.getLogger(OrderAggregationProcessor.class);
    private KeyValueStore<String, CustomerSummary> stateStore;
    private final String storeName;

    public OrderAggregationProcessor(String storeName) {
        this.storeName = storeName;
    }

    @Override
    public void init(ProcessorContext<String, CustomerSummary> context) {
        super.init(context);
        this.stateStore = context.getStateStore(storeName);

        // Schedule periodic cleanup / flush using WALL_CLOCK_TIME
        context.schedule(Duration.ofMinutes(1), PunctuationType.WALL_CLOCK_TIME, currentTimestamp -> {
            log.info("Wall-clock punctuation triggered at unix-epoch: {}", currentTimestamp);
            flushOrPurgeStaleState(currentTimestamp);
        });
    }

    @Override
    public void process(Record<String, Order> record) {
        if (record.key() == null || record.value() == null) {
            log.warn("Skipping tombstone or unkeyed order record at offset: {}", record.timestamp());
            return;
        }

        CustomerSummary summary = stateStore.get(record.key());
        if (summary == null) {
            summary = new CustomerSummary(record.key());
        }

        summary.accumulate(record.value());
        stateStore.put(record.key(), summary);

        // Forward mutated record downstream, preserving existing headers & partition context
        context().forward(record.withValue(summary));
    }

    private void flushOrPurgeStaleState(long wallClockTimestamp) {
        // Scan state store for customer summaries idle > 24 hours
        // and selectively forward final settlement events
    }

    @Override
    public void close() {
        // State store handles are managed and closed by the Streams engine;
        // release any non-Kafka native resources here.
    }
}
```

---

## 2. Punctuator Mechanics: `WALL_CLOCK_TIME` vs `STREAM_TIME`

The `ProcessorContext.schedule()` method registers a callback invoked periodically by the stream thread. Selecting the wrong `PunctuationType` is one of the most common causes of stalled production topologies.

| Dimension | `PunctuationType.WALL_CLOCK_TIME` | `PunctuationType.STREAM_TIME` |
|:---|:---|:---|
| **Clock Driver** | System clock (`System.currentTimeMillis()`) | Maximum record timestamp observed on the assigned partition |
| **Execution Trigger** | Periodic real-time intervals during thread poll loop | Advances **only** when records with newer timestamps arrive |
| **Behavior on Idle Partition** | **Continues firing** at regular intervals | **Freezes completely**; punctuator never executes |
| **Deterministic Replay** | ❌ **Non-deterministic**: varies with runtime load and reprocessing speed | ✅ **Deterministic**: replay produces exact same ticks as live stream |
| **Primary Use Cases** | State TTL eviction, session timeout alerts, flushing buffered batches | Window closures, watermarking, historical time-based analytics |

```
WALL_CLOCK_TIME Flow:
Wall Clock: ───10:00───10:01───10:02───10:03───10:04───10:05───▶ [Ticks Fire Every Min]
Record Flow:   (Silent / No records arrive for 15 mins)         ▶ [Still Executes!]

STREAM_TIME Flow:
Event TS:   ───10:00──────────10:02────────────────────────────▶ [Freezes at 10:02!]
Stream Time:   10:00          10:02   (No records arriving)     ▶ [NO PUNCTUATION TICK]
```

:::warning[The Idle Partition Trap with STREAM_TIME]
If you rely on `STREAM_TIME` to purge stale customer sessions or close windows, and the upstream producer halts during off-peak hours, your Punctuator will **never fire**. Expired records will sit in RocksDB indefinitely until the first morning transaction arrives. Use `WALL_CLOCK_TIME` if your eviction depends on real-world elapsed time.
:::

---

## 3. Integrating PAPI into the High-Level DSL

You do not need to choose between the DSL and PAPI; you can embed custom processors seamlessly into any `KStream` using `.process()`:

```java
StreamsBuilder builder = new StreamsBuilder();

// 1. Declare and register the backing state store
StoreBuilder<KeyValueStore<String, CustomerSummary>> storeBuilder = Stores.keyValueStoreBuilder(
    Stores.persistentKeyValueStore("customer-summary-store"),
    Serdes.String(),
    new CustomSummarySerde()
);
builder.addStateStore(storeBuilder);

// 2. Attach the processor into the DSL pipeline
KStream<String, Order> orders = builder.stream("orders-raw", Consumed.with(Serdes.String(), orderSerde));

KStream<String, CustomerSummary> summaries = orders.process(
    () -> new OrderAggregationProcessor("customer-summary-store"),
    Named.as("processor-customer-summary"),
    "customer-summary-store" // Explicitly declare stores accessed by this processor
);

summaries.to("customer-summaries", Produced.with(Serdes.String(), summarySerde));
```

:::note[Mandatory Store Declaration]
You must pass the store name `"customer-summary-store"` as the third parameter to `.process()`. Omitting it causes Kafka Streams to throw `TopologyException: Processor processor-customer-summary has no access to StateStore customer-summary-store`.
:::

---

## 4. Production Event Deduplication Pattern

In distributed message brokers with retry semantics (`acks=all`, producer retries), network transient disconnects can inject duplicate records into input topics before broker acknowledgement.

While Kafka transaction coordinators protect within Kafka Streams (`exactly_once_v2`), non-transactional upstream producers require **idempotent event deduplication** at the entry boundary.

### Sliding Window Deduplication Processor

```java
package com.example.kafka.processor;

import org.apache.kafka.common.header.Header;
import org.apache.kafka.streams.processor.api.ContextualProcessor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;
import org.apache.kafka.streams.state.WindowStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

public class EventDeduplicationProcessor<K, V> extends ContextualProcessor<K, V, K, V> {

    private static final Logger log = LoggerFactory.getLogger(EventDeduplicationProcessor.class);
    private final String storeName;
    private final Duration dedupWindow;
    private WindowStore<String, Long> dedupStore;

    public EventDeduplicationProcessor(String storeName, Duration dedupWindow) {
        this.storeName = storeName;
        this.dedupWindow = dedupWindow;
    }

    @Override
    public void init(ProcessorContext<K, V> context) {
        super.init(context);
        this.dedupStore = context.getStateStore(storeName);
    }

    @Override
    public void process(Record<K, V> record) {
        String eventId = extractEventId(record);
        long recordTime = record.timestamp();

        // Check if eventId exists within the sliding window [recordTime - window, recordTime + window]
        Long existingTimestamp = dedupStore.fetch(eventId, recordTime);

        if (existingTimestamp != null) {
            // Duplicate detected: drop record and do not forward downstream
            log.warn("Dropped duplicate event [{}] received at {} (original timestamp: {})",
                eventId, recordTime, existingTimestamp);
            return;
        }

        // Unseen event: remember ID in window store and forward downstream
        dedupStore.put(eventId, recordTime, recordTime);
        context().forward(record);
    }

    private String extractEventId(Record<K, V> record) {
        // Priority 1: Check standard idempotency header
        Header header = record.headers().lastHeader("X-Idempotency-Key");
        if (header != null && header.value() != null) {
            return new String(header.value());
        }
        // Priority 2: Fallback to record key string representation
        return record.key() != null ? record.key().toString() : "UNKNOWN";
    }
}
```

### Topology Registration with Retention Bounding

```java
Duration dedupRetention = Duration.ofHours(2);

StoreBuilder<WindowStore<String, Long>> dedupStoreBuilder = Stores.windowStoreBuilder(
    Stores.persistentWindowStore(
        "dedup-store",
        dedupRetention,       // Total retention time on disk
        dedupRetention,       // Window size
        false                 // Retain duplicates within same window: false
    ),
    Serdes.String(),
    Serdes.Long()
);

builder.addStateStore(dedupStoreBuilder);

stream.process(
    () -> new EventDeduplicationProcessor<>("dedup-store", dedupRetention),
    Named.as("dedup-filter"),
    "dedup-store"
).to("sanitized-events");
```

---

## 5. Dead Letter Queue (DLQ) & Poison Pill Handling

When an upstream producer serializes invalid bytes or schema-violating JSON into an input topic, deserialization happens **before the record ever reaches any topology node**.

```
Input Broker Topic (Raw Bytes)
          │
          ▼
┌─────────────────────────────────┐
│ StreamThread Consumer Poll Loop │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ Deserializer.deserialize()      │ ──[Malformed Bytes]──▶ SerializationException
└─────────────────────────────────┘
          │
          ├── Default: LogAndFailExceptionHandler    ──▶ CRASHES STREAM THREAD!
          ├── Naive:   LogAndContinueExceptionHandler ──▶ SILENT DATA LOSS!
          │
          ▼ (Production Standard)
┌────────────────────────────────────────────────────────┐
│ ProductionDlqDeserializationHandler                     │
│   ├── Extracts raw bytes, offset, partition, headers   │
│   ├── Stamps diagnostic error metadata                 │
│   ├── Dispatches to Dead Letter Queue (DLQ) topic      │
│   └── Returns DeserializationHandlerResponse.CONTINUE  │
└────────────────────────────────────────────────────────┘
```

### Complete Implementation: `ProductionDlqDeserializationHandler`

```java
package com.example.kafka.errors;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.apache.kafka.common.serialization.ByteArraySerializer;
import org.apache.kafka.streams.errors.DeserializationExceptionHandler;
import org.apache.kafka.streams.processor.ProcessorContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class ProductionDlqDeserializationHandler implements DeserializationExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ProductionDlqDeserializationHandler.class);
    private KafkaProducer<byte[], byte[]> dlqProducer;
    private String dlqTopic;

    @Override
    public void configure(Map<String, ?> configs) {
        this.dlqTopic = (String) configs.getOrDefault("dlq.topic.name", "streams-poison-pills-dlq");

        Map<String, Object> producerProps = new HashMap<>(configs);
        producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
        producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
        producerProps.put(ProducerConfig.ACKS_CONFIG, "all");
        producerProps.put(ProducerConfig.RETRIES_CONFIG, 3);

        this.dlqProducer = new KafkaProducer<>(producerProps);
        log.info("Initialized ProductionDlqDeserializationHandler with target DLQ: {}", dlqTopic);
    }

    @Override
    public DeserializationHandlerResponse handle(ProcessorContext context,
                                                ConsumerRecord<byte[], byte[]> record,
                                                Exception exception) {
        log.error("Deserialization failure on topic: {}, partition: {}, offset: {}. Routing to DLQ.",
            record.topic(), record.partition(), record.offset(), exception);

        ProducerRecord<byte[], byte[]> dlqRecord = new ProducerRecord<>(
            dlqTopic,
            record.partition(),
            record.timestamp(),
            record.key(),
            record.value()
        );

        // Stamp comprehensive forensic headers for troubleshooting and replay tooling
        dlqRecord.headers().add(new RecordHeader("x-orig-topic", record.topic().getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-orig-partition", String.valueOf(record.partition()).getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-orig-offset", String.valueOf(record.offset()).getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-error-class", exception.getClass().getName().getBytes(StandardCharsets.UTF_8)));
        dlqRecord.headers().add(new RecordHeader("x-error-message", (exception.getMessage() != null ? exception.getMessage() : "null").getBytes(StandardCharsets.UTF_8)));

        try {
            // Synchronous get() ensures DLQ persistence before advancing consumer offset past poison pill
            dlqProducer.send(dlqRecord).get();
        } catch (Exception e) {
            log.error("FATAL: Failed to dispatch poison pill to DLQ! Halting stream thread to prevent data loss.", e);
            return DeserializationHandlerResponse.FAIL;
        }

        // Signal Streams to acknowledge and continue processing next record
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

### Spring Boot / Kafka Streams Configuration

```yaml
spring:
  kafka:
    streams:
      properties:
        default.deserialization.exception.handler: com.example.kafka.errors.ProductionDlqDeserializationHandler
        dlq.topic.name: orders-deserialization-dlq
        bootstrap.servers: broker1:9092,broker2:9092
```

---

## 6. The Async Processing Anti-Pattern (Network I/O in Streams)

A frequent pitfall when transitioning from microservice REST controllers to Kafka Streams is attempting **asynchronous network calls** (`WebClient`, `CompletableFuture`, reactive `Mono/Flux`) inside stream operators:

```java
// ❌ CATASTROPHIC ANTI-PATTERN: Async HTTP / Database call in StreamThread
stream.mapValues(order -> {
    return httpClient.post()
        .uri("https://credit-card-gateway.internal/v1/charge")
        .bodyValue(order)
        .retrieve()
        .bodyToMono(PaymentResponse.class); // Returns Mono<PaymentResponse>!
});
```

### Why Async Network I/O Breaks Kafka Streams Internals

1. **Uncompleted Futures & Silent Data Loss**: Kafka Streams execution loops are **synchronous**. Once `.mapValues()` returns the `Mono` object, the stream thread proceeds immediately to commit offsets. If the reactive subscription executes 500ms later on an elastic Netty worker thread and fails, the transaction in Kafka has already committed! If the container crashes, **the event is permanently lost**.
2. **Blocking Futures Destroys Throughput**: If you block the stream thread synchronously via `future.get()` or `mono.block()`:
   $$\text{Max Throughput} = \frac{1000\text{ ms}}{\text{Latency (e.g., 50 ms)}} = 20\text{ records/second per StreamThread}$$
   A partition with 2,000 eps will build massive consumer lag within seconds.
3. **Heartbeat Starvation & Infinite Rebalance Storms**: If the downstream service experiences a latency spike or DB lock contention, the stream thread blocks beyond `max.poll.interval.ms` (default: 300,000 ms / 5 minutes). The broker coordinator assumes the client is dead, evicts it from the group, and triggers an application-wide rebalance. When the thread unblocks, it attempts to commit and throws `CommitFailedException`, causing crash-loops.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ASYNC NETWORK I/O ARCHITECTURAL REMEDIES                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. CONFLUENT PARALLEL CONSUMER (Best for high-concurrency external I/O)    │
│    Partition ──▶ Parallel Consumer Fleet ──▶ Key-hash Worker Pool (100 thr) │
│                  Each key processed strictly in-order; concurrent I/O safe. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. TRANSACTIONAL OUTBOX / CDC (Best for database persistence)               │
│    App Service ──▶ Writes DB Local TX ──▶ Debezium WAL ──▶ Kafka Stream In  │
│    Zero HTTP/RPC calls inside the streaming topologies.                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. DECOUPLED ASYNC REQUEST/RESPONSE TOPICS (Best for external RPCs)         │
│    Topology ──▶ Writes to `charge-requests` topic                           │
│    Stateless Worker Pool ──▶ Calls REST Gateway ──▶ Writes `charge-results` │
│    Topology ──▶ Joins `charge-results` stream via Co-partitioned Stream-Join│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Serdes & Schema Registry Integration

Starting with Apache Kafka 3.0 (KIP-741), **default Serdes are completely removed**. Production systems require explicit schema validation using Confluent Schema Registry or Apicurio.

### Production Avro Serde Configuration

```java
package com.example.kafka.config;

import io.confluent.kafka.serializers.AbstractKafkaSchemaSerDeConfig;
import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.KStream;

import java.util.Map;

public class AvroTopologyConfig {

    public KStream<String, OrderEvent> configurePipeline(StreamsBuilder builder, String schemaRegistryUrl) {
        Map<String, Object> serdeConfig = Map.of(
            AbstractKafkaSchemaSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, schemaRegistryUrl,
            AbstractKafkaSchemaSerDeConfig.AUTO_REGISTER_SCHEMAS, "false", // Enforce CI/CD schema evolution!
            "specific.avro.reader", "true"
        );

        SpecificAvroSerde<OrderEvent> orderSerde = new SpecificAvroSerde<>();
        orderSerde.configure(serdeConfig, false); // false = value serde

        return builder.stream(
            "orders-avro",
            Consumed.with(Serdes.String(), orderSerde)
        );
    }
}
```

### Generic Type Erasure Hazard

When building custom JSON or Jackson Serdes, Java's type erasure causes runtime errors if the type reference is lost:

```java
// ❌ WRONG: Java type erasure strips Order class; Jackson deserializes into LinkedHashMap
JsonSerde<Order> orderSerde = new JsonSerde<>();

// ✅ CORRECT: Explicit target class token preserves type mapping
JsonSerde<Order> orderSerde = new JsonSerde<>(Order.class);
orderSerde.ignoreTypeHeaders(); // Prevents class cast exceptions across heterogeneous microservices
```

---

## 8. Summary & Architectural Checklist

| Pattern | Anti-Pattern | Recommended Architectural Pattern |
|:---|:---|:---|
| **Scheduled Tasks** | `Thread.sleep()` or static `Timer` | `context.schedule()` with `WALL_CLOCK_TIME` for TTL or `STREAM_TIME` for deterministic windowing |
| **Idempotency** | Relying on at-least-once with unbounded growth | Sliding `WindowStore` deduplication processor with bounded retention |
| **Poison Pills** | `LogAndFail` (crash) or `LogAndContinue` (loss) | `ProductionDlqDeserializationHandler` with diagnostic tracing headers |
| **External I/O** | `WebClient`, `HttpClient`, or reactive Mono in stream | Confluent Parallel Consumer or asynchronous request/response topic decoupling |
| **Serdes** | Omitting default Serdes (KIP-741 failure) | Explicit typed Serdes with Schema Registry `auto.register=false` |
