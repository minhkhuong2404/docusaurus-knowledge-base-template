---
id: spring-boot
title: Kafka Streams — Spring Boot Integration Deep Dive
sidebar_label: 6. Spring Boot Integration
sidebar_position: 6
description: >
  Comprehensive guide to running Kafka Streams in Spring Boot: spring-kafka vs Spring Cloud Stream,
  StreamsBuilderFactoryBean lifecycle, topology composition across @Bean methods,
  branching with split() vs onTopOf(), safe Interactive Queries, and health probes.
tags:
  - kafka
  - kafka-streams
  - spring-boot
  - spring-kafka
  - spring-cloud-stream
  - interactive-queries
---

# Kafka Streams — Spring Boot Integration Deep Dive

> **Architectural Premise:** In modern Java enterprise environments, Kafka Streams applications are rarely executed as bare `public static void main` invocations. Instead, they run within the **Spring Boot** ecosystem. Understanding the boundary between Spring's dependency injection container and Kafka Streams' native client threads is essential for building production-grade event streaming systems.

---

## 1. Two Libraries, One Engine

There are two primary paradigms for running Kafka Streams in Spring Boot:
1. **Spring for Apache Kafka (`spring-kafka`)**: Explicit topology definitions leveraging `@EnableKafkaStreams` and `StreamsBuilder`.
2. **Spring Cloud Stream (KStream Binder)**: Declarative, functional microservice bindings using `java.util.function.Function`.

Both frameworks wrap the exact same Apache Kafka client library (`kafka-streams.jar`), but provide vastly different levels of control:

| Architectural Dimension | Spring for Apache Kafka (`spring-kafka`) | Spring Cloud Stream (KStream Binder) |
|:---|:---|:---|
| **Programming Paradigm** | Explicit `StreamsBuilder` Topology DAG | Declarative Functional `Function<KStream, KStream>` |
| **Topic Resolution** | Programmatic in Java (`builder.stream("topic")`) | Configuration-driven in YAML (`bindings.*.destination`) |
| **Configuration Namespace** | `spring.kafka.streams.*` | `spring.cloud.stream.kafka.streams.binder.*` |
| **Lifecycle Manager** | `StreamsBuilderFactoryBean` | Spring Cloud Stream Binder Lifecycle |
| **DAG Visibility & Control** | **Full**: Custom PAPI nodes, explicit names, state stores | **Abstracted**: High-level functional composition |
| **Branching Capabilities** | Native `.split()` & `KafkaStreamBrancher.onTopOf()` | High-level function routing or multiple output tuples |
| **Interactive Queries** | Direct access via `factoryBean.getKafkaStreams()` | Complex; requires internal state store extractors |
| **Best Fit** | High-performance stateful topologies, complex joins, PAPI | Multi-cloud event meshes, multi-binder microservices |

```
                     ┌──────────────────────────────────────┐
                     │          Spring Application          │
                     └──────────────────┬───────────────────┘
                                        │
           ┌────────────────────────────┴───────────────────────────┐
           ▼                                                         ▼
┌───────────────────────────────┐         ┌───────────────────────────────────────┐
│         spring-kafka          │         │          Spring Cloud Stream          │
│   @EnableKafkaStreams         │         │   Functional Binder (v4.0+)           │
│   StreamsBuilderFactoryBean   │         │   Function<KStream, KStream>          │
└──────────────┬────────────────┘         └───────────────────┬───────────────────┘
               │                                              │
               │ (Injects StreamsBuilder)                     │ (Wires Bindings)
               ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       Apache Kafka Streams Engine (JVM)                         │
│   • StreamThreads Pool            • RocksDB Local State Stores                  │
│   • Task & Partition Assignment   • Transactional Producer (EOS V2)             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Spring for Apache Kafka (`spring-kafka`)

### Maven / Gradle Dependencies

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
<!-- Optional for Jackson JSON serialization -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### Production Configuration (`application.yml`)

```yaml
spring:
  kafka:
    bootstrap-servers: broker1:9092,broker2:9092
    streams:
      application-id: order-enrichment-service
      properties:
        # Mandatory in Kafka 3.0+ (KIP-741): No default serdes provided!
        default.key.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
        default.value.serde: org.springframework.kafka.support.serializer.JsonSerde
        spring.json.trusted.packages: "com.example.orders.model"
        
        # Reliability & Exactly-Once Semantics
        processing.guarantee: exactly_once_v2
        num.stream.threads: 4
        num.standby.replicas: 1
        
        # Performance & State Tuning
        commit.interval.ms: 100
        cache.max.bytes.buffering: 67108864 # 64 MB RecordAccumulator cache
        state.dir: /var/data/kafka-streams/state
        rocksdb.config.setter: com.example.kafka.config.CustomRocksDBConfigSetter
```

:::caution[The KIP-741 Missing Default Serde Trap]
Starting in Apache Kafka 3.0 (KIP-741), Kafka Streams **eliminated default key and value serdes**.
If you omit `spring.kafka.streams.properties[default.key.serde]` and `[default.value.serde]`, Spring Boot crashes on startup with:
```
org.apache.kafka.common.config.ConfigException: Missing required configuration "default.key.serde"
```
:::

---

## 3. Topology Composition Across Multiple `@Bean` Methods

A major advantage of `spring-kafka` is modular topology composition. You do not need to pack your entire enterprise pipeline into a single massive 1,000-line configuration method.

Spring passes the **same shared `StreamsBuilder` instance** to all `@Bean` methods requiring it during application context startup:

```java
package com.example.kafka.topology;

import com.example.orders.model.Customer;
import com.example.orders.model.Order;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.common.utils.Bytes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.kstream.Named;
import org.apache.kafka.streams.kstream.Produced;
import org.apache.kafka.streams.state.KeyValueStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import org.springframework.kafka.support.serializer.JsonSerde;

@Configuration
@EnableKafkaStreams
public class ModularTopologyConfiguration {

    // Sub-Topology 1: Process and enrich orders
    @Bean
    public KStream<String, Order> orderProcessingPipeline(StreamsBuilder builder,
                                                          JsonSerde<Order> orderSerde) {
        KStream<String, Order> orders = builder.stream(
            "orders-raw",
            Consumed.with(Serdes.String(), orderSerde).withName("source-orders-raw")
        );

        orders
            .filter((k, v) -> v != null && v.isValid(), Named.as("filter-valid-orders"))
            .to("orders-validated", Produced.with(Serdes.String(), orderSerde));

        return orders;
    }

    // Sub-Topology 2: Maintain customer state table
    @Bean
    public KTable<String, Customer> customerTablePipeline(StreamsBuilder builder,
                                                          JsonSerde<Customer> customerSerde) {
        return builder.table(
            "customers-changelog",
            Consumed.with(Serdes.String(), customerSerde).withName("source-customers"),
            Materialized.<String, Customer, KeyValueStore<Bytes, byte[]>>as("customer-store")
                .withKeySerde(Serdes.String())
                .withValueSerde(customerSerde)
        );
    }
}
```

### Under-the-Hood Synthesis
When `StreamsBuilderFactoryBean.start()` is triggered by the Spring lifecycle:
1. It executes `builder.build()`.
2. Both `orderProcessingPipeline` and `customerTablePipeline` are synthesized into a **single unified `Topology` DAG**.
3. All registered sub-topologies are scheduled across the same pool of `StreamThreads` configured via `num.stream.threads`.

---

## 4. Stream Branching: Native `split()` vs `KafkaStreamBrancher.onTopOf()`

Prior to Kafka 2.8, splitting a `KStream` into multiple routes relied on `.branch()`, which returned an untyped, brittle array `KStream<K, V>[]`:

```java
// ❌ OBSOLETE & BRITTLE: Array indexing causes IndexOutOfBoundsExceptions on topology changes
KStream<String, Order>[] branches = stream.branch(
    (k, v) -> v.isVip(),
    (k, v) -> true
);
branches[0].to("vip-orders");
branches[1].to("regular-orders");
```

### Option A: Modern Kafka Streams DSL `split()` (Kafka 2.8+)

The modern DSL provides a fluent, type-safe builder:

```java
stream
    .split(Named.as("branch-"))
    .branch((k, v) -> v.isVip(), Branched.withConsumer(
        s -> s.to("vip-orders", Produced.as("sink-vip"))
    ))
    .branch((k, v) -> v.isFraudSuspect(), Branched.withConsumer(
        s -> s.to("review-orders", Produced.as("sink-review"))
    ))
    .defaultBranch(Branched.withConsumer(
        s -> s.to("standard-orders", Produced.as("sink-standard"))
    ));
```

### Option B: Spring Kafka `KafkaStreamBrancher.onTopOf()`

Spring for Apache Kafka provides `KafkaStreamBrancher`, which offers fluent method chaining that attaches directly onto a base stream:

```java
import org.springframework.kafka.support.KafkaStreamBrancher;

new KafkaStreamBrancher<String, Order>()
    .branch((k, v) -> v.isVip(), s -> s.to("vip-orders"))
    .branch((k, v) -> v.isFraudSuspect(), s -> s.to("review-orders"))
    .defaultBranch(s -> s.to("standard-orders"))
    .onTopOf(ordersStream); // Attaches branch logic and returns original ordersStream
```

`KafkaStreamBrancher.onTopOf()` is particularly useful when you need to continue downstream processing on the unmodified parent stream while simultaneously routing events to side sinks.

---

## 5. Lifecycle Management & KIP-663 Error Handling

The `StreamsBuilderFactoryBean` coordinates thread startup, graceful shutdowns, and error recovery. Use `StreamsBuilderFactoryBeanCustomizer` to configure runtime listeners:

```java
package com.example.kafka.config;

import io.micrometer.core.instrument.MeterRegistry;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.errors.StreamsUncaughtExceptionHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.StreamsBuilderFactoryBeanCustomizer;

@Configuration
public class StreamsLifecycleConfiguration {

    private static final Logger log = LoggerFactory.getLogger(StreamsLifecycleConfiguration.class);

    @Bean
    public StreamsBuilderFactoryBeanCustomizer streamsCustomizer(MeterRegistry meterRegistry) {
        return factoryBean -> {
            // 1. Observe state transitions (REBALANCING, RUNNING, PENDING_SHUTDOWN, ERROR)
            factoryBean.setStateListener((newState, oldState) -> {
                log.info("Kafka Streams State Changed: {} -> {}", oldState, newState);
                meterRegistry.gauge("kafka.streams.state.code", newState.ordinal());

                if (newState == KafkaStreams.State.ERROR) {
                    log.error("💥 CRITICAL: Kafka Streams transitioned to ERROR! Alerting on-call.");
                }
            });

            // 2. KIP-663 Uncaught Exception Handler
            factoryBean.setStreamsUncaughtExceptionHandler(throwable -> {
                log.error("Uncaught exception in StreamThread: {}", throwable.getMessage(), throwable);

                // Options:
                // - REPLACE_THREAD: Restarts only the crashed StreamThread (instance remains running)
                // - SHUTDOWN_CLIENT: Closes this KafkaStreams instance (Kubernetes detects and restarts pod)
                // - SHUTDOWN_APPLICATION: Signals all group instances to stop
                return StreamsUncaughtExceptionHandler.StreamThreadExceptionResponse.REPLACE_THREAD;
            });
        };
    }
}
```

---

## 6. Accessing State Stores via Safe Interactive Queries

A frequent bug in Spring REST controllers querying local state stores is invoking `store()` before the topology is fully running, leading to `InvalidStateStoreException`.

```java
package com.example.kafka.controller;

import com.example.orders.model.Customer;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StoreQueryParameters;
import org.apache.kafka.streams.state.QueryableStoreTypes;
import org.apache.kafka.streams.state.ReadOnlyKeyValueStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.config.StreamsBuilderFactoryBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerQueryController {

    private final StreamsBuilderFactoryBean factoryBean;

    public CustomerQueryController(StreamsBuilderFactoryBean factoryBean) {
        this.factoryBean = factoryBean;
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<?> getCustomerProfile(@PathVariable String customerId) {
        KafkaStreams streams = factoryBean.getKafkaStreams();

        // Guard 1: Verify factory bean has initialized KafkaStreams instance
        if (streams == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Kafka Streams client not yet created"));
        }

        // Guard 2: Verify state is RUNNING (throws InvalidStateStoreException if REBALANCING)
        KafkaStreams.State currentState = streams.state();
        if (currentState != KafkaStreams.State.RUNNING) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "error", "State store unavailable during rebalance or startup",
                    "currentState", currentState.name()
                ));
        }

        try {
            ReadOnlyKeyValueStore<String, Customer> store = streams.store(
                StoreQueryParameters.fromNameAndType("customer-store", QueryableStoreTypes.keyValueStore())
            );

            Customer customer = store.get(customerId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Customer ID not found in local materialized view"));
            }

            return ResponseEntity.ok(customer);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", ex.getMessage()));
        }
    }
}
```

---

## 7. Approach 2: Spring Cloud Stream Functional Model

In Spring Cloud Stream 4.0+, the legacy `@StreamListener` and `@EnableBinding` annotations are **completely removed**. The functional programming model uses `java.util.function.Function`:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-stream-binder-kafka-streams</artifactId>
</dependency>
```

### Functional Bean Definition

```java
package com.example.kafka.functional;

import com.example.orders.model.Order;
import org.apache.kafka.streams.kstream.KStream;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Function;

@Configuration
public class OrderStreamFunctions {

    @Bean
    public Function<KStream<String, Order>, KStream<String, Order>> processOrders() {
        return input -> input
            .filter((k, v) -> v != null && v.getAmount() > 0)
            .mapValues(Order::applyDiscounts);
    }
}
```

### Declarative YAML Configuration

```yaml
spring:
  cloud:
    function:
      definition: processOrders
    stream:
      bindings:
        processOrders-in-0:
          destination: raw-orders-topic
        processOrders-out-0:
          destination: discounted-orders-topic
      kafka:
        streams:
          binder:
            application-id: scs-order-service
            brokers: localhost:9092
            configuration:
              processing.guarantee: exactly_once_v2
              default.key.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
              default.value.serde: org.springframework.kafka.support.serializer.JsonSerde
```

---

## 8. Kubernetes Health Probes & Actuator Integration

By default, Spring Boot Actuator can flag the entire pod as `DOWN` if Kafka Streams enters the transient `REBALANCING` state. To prevent Kubernetes from terminating pods during normal rebalances:

```yaml
management:
  endpoint:
    health:
      show-details: always
  health:
    binders:
      enabled: false # Do not mark web service unhealthy during rebalance
    defaults:
      enabled: true

# Graceful shutdown timeout
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

### Summary of Best Practices
1. **Always specify explicit Serdes** in `application.yml` to satisfy KIP-741.
2. **Modularize large topologies** across multiple `@Bean` methods injecting `StreamsBuilder`.
3. **Prefer `split()` or `KafkaStreamBrancher.onTopOf()`** over legacy array-indexed branching.
4. **Guard Interactive Query endpoints** by verifying `streams.state() == RUNNING`.
5. **Set `REPLACE_THREAD`** in `StreamsUncaughtExceptionHandler` to survive single-thread deserialization bugs.
