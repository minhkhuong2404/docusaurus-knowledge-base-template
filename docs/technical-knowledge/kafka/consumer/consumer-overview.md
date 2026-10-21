---
id: consumer-overview
title: Kafka Consumer
sidebar_label: Consumer Overview
description: A **consumer** reads messages from Kafka topics. Unlike traditional queues
  (push-based), Kafka consumers **pull** messages at their own pace. This gives.
tags:
- technical-knowledge
- kafka
- consumer
- consumer-overview
---

import KafkaConsumerOverviewDiagram from '@site/src/components/KafkaConsumerOverviewDiagram';
import KafkaListenerIdVsGroupIdDiagram from '@site/src/components/KafkaListenerIdVsGroupIdDiagram';

# Kafka Consumer

---

## What is a Consumer?

A **consumer** reads messages from Kafka topics. Unlike traditional queues (push-based), Kafka consumers **pull** messages at their own pace. This gives consumers full control over throughput, backpressure, and replay.

---

## Consumer Internals

<KafkaConsumerOverviewDiagram />

---

---

## Consumer Internals

The consumer maintains an **offset** per assigned partition, tracking the last processed record.

---

## The Poll Loop

The consumer's core loop:

```java
@Component
public class OrderConsumer {

    @KafkaListener(topics = "orders", groupId = "order-service")
    public void listen(ConsumerRecord<String, OrderEvent> record) {
        log.info("Received: key={}, offset={}, partition={}",
            record.key(), record.offset(), record.partition());
        processOrder(record.value());
    }
}
```

Under the hood, Spring Kafka's `@KafkaListener` runs a poll loop:

```java
// Equivalent manual loop (for understanding)
while (running) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        process(record);
    }
    consumer.commitSync(); // or commitAsync
}
```

---

## `@KafkaListener`: `id` vs `groupId` Architecture & Mechanics

A frequent source of critical bugs and confusion in Spring Kafka applications is the distinction and interaction between the `id` and `groupId` attributes of `@KafkaListener`. While both serve to identify components, they operate across completely separate architectural boundaries.

<KafkaListenerIdVsGroupIdDiagram />

### 1. Architectural Boundaries: Spring Container vs. Kafka Broker

| Architectural Dimension | `@KafkaListener(id = "...")` | `@KafkaListener(groupId = "...")` |
|---|---|---|
| **Managing Authority** | **Spring ApplicationContext** (`KafkaListenerEndpointRegistry`) | **Apache Kafka Broker** (Group Coordinator) |
| **Physical Scope** | **JVM-Local**: Lives inside the single running Spring Boot process | **Distributed / Cluster-Wide**: Shared across all servers, pods, and instances |
| **Uniqueness Requirement** | **Strictly Unique per JVM Context**: Two listeners with identical `id` fail application startup (`IllegalStateException`) | **Shared by Design**: Multiple consumers share the same `groupId` to divide partition load |
| **Primary Responsibility** | Lifecycle management (`pause()`, `resume()`, `stop()`), thread naming, Actuator health metrics | Partition assignment (`Assignor`), offset tracking in `__consumer_offsets`, group rebalances |
| **Thread Naming Impact** | Poll thread is named after the container: `[id]-[concurrencyIndex]-C-1` | Does not directly determine the Spring container worker thread name |

---

### 2. The Critical Default Behavior: `idIsGroup = true`

In Spring Kafka, `@KafkaListener` contains a boolean attribute named `idIsGroup`, which defaults to **`true`**:

```java
public @interface KafkaListener {
    String id() default "";
    String groupId() default "";
    boolean idIsGroup() default true; // <-- THE PRODUCTION GOTCHA!
    ...
}
```

#### What Happens Under the Hood?
1. **Case A: Explicit `id` with NO `groupId`**:
   ```java
   @KafkaListener(id = "orderProcessor", topics = "orders")
   public void handleOrder(OrderEvent event) { ... }
   ```
   - Spring sets the container bean ID to `"orderProcessor"`.
   - Because `idIsGroup = true`, Spring Kafka **automatically copies the `id` value to `group.id`**!
   - **Production Hazard**: This silently **overrides** any `spring.kafka.consumer.group-id` defined in your `application.yml` (e.g. `group-id: billing-service`).
   - If this was deployed unexpectedly, Kafka treats it as an entirely new consumer group with zero committed offsets in `__consumer_offsets`. Depending on `auto.offset.reset`, the service will either reprocess all historical orders from the beginning of time (`earliest`) or skip all unprocessed backlog (`latest`).

2. **Case B: Explicit `id` with `idIsGroup = false`**:
   ```java
   @KafkaListener(id = "orderProcessor", idIsGroup = false, topics = "orders")
   public void handleOrder(OrderEvent event) { ... }
   ```
   - Spring uses `"orderProcessor"` as the container name in `KafkaListenerEndpointRegistry`.
   - The Kafka consumer `group.id` falls back to `spring.kafka.consumer.group-id` from your configuration file.

3. **Case C: Explicit `id` AND explicit `groupId` (Production Gold Standard)**:
   ```java
   @KafkaListener(
       id = "orderProcessorContainer",
       groupId = "order-processing-group",
       topics = "orders"
   )
   public void handleOrder(OrderEvent event) { ... }
   ```
   - Clean, decoupled, and completely unambiguous:
     - Spring manages the container via the unique name `"orderProcessorContainer"`.
     - Kafka coordinates partitions under the shared consumer group `"order-processing-group"`.

---

### 3. Programmatic Container Lifecycle via `KafkaListenerEndpointRegistry`

The primary reason to specify a clean, explicit `id` is to interact with the container programmatically at runtime. Spring Kafka registers all listeners in the `KafkaListenerEndpointRegistry` bean.

#### Graceful Downstream Circuit Breaking (Pause without Rebalance)

When a downstream database or third-party payment gateway fails, continuing to consume messages triggers repeated retries, poison pills, and dead-letter queues. Instead of crashing the pod, a Senior Engineer uses `pause()`:

```java
package com.enterprise.order.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.listener.MessageListenerContainer;
import org.springframework.stereotype.Service;

@Service
public class OrderConsumerManager {

    private static final Logger log = LoggerFactory.getLogger(OrderConsumerManager.class);
    private static final String LISTENER_ID = "orderProcessorContainer";

    private final KafkaListenerEndpointRegistry registry;

    public OrderConsumerManager(KafkaListenerEndpointRegistry registry) {
        this.registry = registry;
    }

    /**
     * Pauses the consumer container without disconnecting from Kafka.
     * The poll thread continues sending heartbeats to the broker coordinator,
     * preventing unnecessary partition rebalances.
     */
    public void pauseProcessing() {
        MessageListenerContainer container = registry.getListenerContainer(LISTENER_ID);
        if (container != null && container.isRunning() && !container.isContainerPaused()) {
            container.pause();
            log.warn("Downstream saturated. PAUSED Kafka consumer: {}", LISTENER_ID);
        }
    }

    /**
     * Resumes partition polling once downstream database health recovers.
     */
    public void resumeProcessing() {
        MessageListenerContainer container = registry.getListenerContainer(LISTENER_ID);
        if (container != null && container.isContainerPaused()) {
            container.resume();
            log.info("Downstream recovered. RESUMED Kafka consumer: {}", LISTENER_ID);
        }
    }
}
```

:::tip[Zero-Rebalance Guarantee on pause()]
When `container.pause()` is executed, the listener container internally calls `consumer.pause(assignedPartitions)`. The consumer background thread continues executing `consumer.poll(0)` solely to **send heartbeats** to the broker Group Coordinator. Because heartbeats continue, the broker knows the consumer is alive, and **no rebalance is triggered**!
:::

---

### 4. Dynamic SpEL Broadcast & Fan-Out Pub-Sub

In Kafka, if you want a **Publish-Subscribe Broadcast** pattern where **every running pod** receives a copy of every event (e.g. distributed in-memory cache eviction, dynamic configuration reloading, or WebSocket real-time fan-out), each pod must belong to its own unique consumer group.

You can achieve this dynamically using Spring Expression Language (SpEL):

```java
@Component
public class CacheEvictionConsumer {

    /**
     * Every JVM instance generates a unique UUID for its groupId,
     * while retaining an identical container id for local Spring management.
     */
    @KafkaListener(
        id = "cacheEvictionListener",
        groupId = "cache-evict-#{T(java.util.UUID).randomUUID().toString()}",
        topics = "cache-invalidations",
        properties = {
            "auto.offset.reset=latest" // Skip historical eviction events on restart
        }
    )
    public void onCacheInvalidate(CacheInvalidationEvent event) {
        localCache.invalidate(event.cacheKey());
    }
}
```

---

```properties
enable.auto.commit=true
auto.commit.interval.ms=5000  # commits every 5 seconds
```

⚠️ Risk: consumer processes record, crashes before next auto-commit → record re-processed after restart (at-least-once). But if commit happens before processing completes → **data loss** (at-most-once).

### Manual Commit (at-least-once)

```java
@KafkaListener(topics = "orders")
public void listen(ConsumerRecord<String, String> record, Acknowledgment ack) {
    try {
        process(record);
        ack.acknowledge(); // commit offset AFTER successful processing
    } catch (Exception e) {
        // Don't ack → message will be redelivered
        log.error("Processing failed, will retry", e);
    }
}
```

```yaml
spring:
  kafka:
    listener:
      ack-mode: MANUAL_IMMEDIATE  # or MANUAL
```

### AckMode Options (Spring Kafka)

| AckMode | Description |
|---------|-------------|
| `BATCH` | Commit after all records in the poll batch are processed |
| `RECORD` | Commit after each individual record |
| `MANUAL` | App calls `ack.acknowledge()`, committed on next poll |
| `MANUAL_IMMEDIATE` | App calls `ack.acknowledge()`, committed immediately |
| `COUNT` | Commit after N records |
| `TIME` | Commit after X milliseconds |
| `COUNT_TIME` | Commit after N records OR X ms, whichever comes first |

---

## Key Consumer Configurations

```properties
bootstrap.servers=localhost:9092
group.id=order-service
key.deserializer=org.apache.kafka.common.serialization.StringDeserializer
value.deserializer=org.apache.kafka.common.serialization.StringDeserializer

# Offset reset for new groups or deleted offsets
auto.offset.reset=earliest       # earliest | latest | none

# Polling
max.poll.records=500              # Max records per poll()
max.poll.interval.ms=300000       # Max time between polls before consumer is kicked out (5 min)
fetch.min.bytes=1                 # Min bytes to fetch (default=1, higher = batch)
fetch.max.wait.ms=500             # Max wait when < fetch.min.bytes available
fetch.max.bytes=52428800          # Max bytes per fetch (50 MB)

# Session/heartbeat
session.timeout.ms=10000          # Consumer considered dead after this
heartbeat.interval.ms=3000        # Heartbeat frequency (must be < session.timeout / 3)

# Offset commit
enable.auto.commit=false          # Prefer manual commits
```

---

## `auto.offset.reset` Explained

| Value | Behavior |
|-------|----------|
| `earliest` | Start from the very first available message (good for new consumers) |
| `latest` | Start from the next new message (skip history) |
| `none` | Throw `NoOffsetForPartitionException` if no committed offset found |

---

## Consumer Lifecycle

```
1. subscribe(topics) or assign(partitions)
2. poll() → triggers group join / partition assignment (first call)
3. Heartbeat thread runs in background
4. Session expires if poll() not called within max.poll.interval.ms
   → Consumer is removed from group → rebalance triggered
```

---

## Dead Letter Topic (DLT) Pattern

```java
@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<?, ?> template) {
    DeadLetterPublishingRecoverer recoverer =
        new DeadLetterPublishingRecoverer(template,
            (r, e) -> new TopicPartition(r.topic() + ".DLT", r.partition()));

    return new DefaultErrorHandler(recoverer,
        new FixedBackOff(1000L, 3L)); // retry 3 times, 1 sec apart
}
```

```java
// Or in ConcurrentKafkaListenerContainerFactory
@Bean
public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> kafkaListenerContainerFactory(
        ConsumerFactory<String, OrderEvent> cf,
        DefaultErrorHandler errorHandler) {
    ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(cf);
    factory.setCommonErrorHandler(errorHandler);
    return factory;
}
```

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Consumer & Listener Interviews

In Staff and Principal Engineering interviews, questions about Kafka consumers are rarely about basic API syntax; interviewers probe whether you understand the physical thread model, distributed group coordination, rebalance storm prevention, and Spring lifecycle isolation.

### 1. The Senior Framing Strategy (The First 60 Seconds)

When an interviewer asks you to design or debug a Kafka consumer architecture, immediately establish clarity across **four physical invariants**:

1. **Dual Boundary Separation (JVM vs. Distributed Cluster)**:
   - Separate Spring-local listener container management (`id` attribute, `KafkaListenerEndpointRegistry`, thread worker pools) from broker-wide distributed partition coordination (`groupId` attribute, Group Coordinator, `__consumer_offsets`).
2. **The Poll-Processing-Commit Contract & Little's Law**:
   - The Kafka consumer poll loop is constrained by:
     $$
     \text{Total Processing Time per Poll} = \text{records\_fetched} \times \text{time\_per\_record} < \text{max.poll.interval.ms}
     $$
   - A Principal Engineer proactively bounds `max.poll.records` (e.g. 50–100) and aligns `max.poll.interval.ms` (e.g. 300s) to guarantee the broker never misidentifies slow processing as a crashed node.
3. **Rebalance Storm Hygiene**:
   - In modern architectures, enforce `CooperativeStickyAssignor` to replace legacy eager stop-the-world rebalances. Static membership (`group.instance.id`) is mandated on Kubernetes to avoid partition churn during rolling updates.
4. **Day-2 Operational Telemetry & Circuit Breaking**:
   - Consumer lag alone is insufficient; you must track `consumer-fetch-manager-metrics` (fetch-latency, records-lag-max), heartbeat latency, and implement programmatic `pause()` / `resume()` for graceful downstream backpressure.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "What is the difference between `id` and `groupId` in `@KafkaListener`? What happens if you only provide `id`?"
* **Junior/Mid Answer:** *"They both identify the consumer group. If you provide `id`, it just acts as the consumer group ID in Kafka."*
* **Principal Rebuttal:** They operate in completely different realms:
  1. `id` is the **Spring ApplicationContext identifier** for the `MessageListenerContainer` bean in `KafkaListenerEndpointRegistry`. It dictates local thread names (`[id]-0-C-1`) and runtime lifecycle management (`pause()`, `resume()`).
  2. `groupId` is the **Kafka Consumer Group ID** sent to the broker for partition assignment and offset commits in `__consumer_offsets`.
  3. **The Hidden Hazard**: In Spring Kafka, `@KafkaListener(id = "orderService")` without `groupId` triggers the default `idIsGroup = true` behavior. Spring **silently copies the `id` value into `group.id`**, completely overriding any `spring.kafka.consumer.group-id` in `application.yml`! This creates a new consumer group with zero committed offsets, triggering `auto.offset.reset` and causing either duplicate processing or skipped backlog.
  4. **The Best Practice**: Always specify both explicitly: `@KafkaListener(id = "orderContainer", groupId = "order-group")`, or set `idIsGroup = false`.

---

#### Trap 2: "If we scale our microservice to 10 Kubernetes pods and every pod runs `@KafkaListener(id = "orderProcessor")`, won't Spring throw an `IllegalStateException: Duplicate ID` on startup?"
* **Junior/Mid Answer:** *"Yes, because Spring bean IDs must be globally unique, so having 10 instances will cause an ID conflict in Kafka."*
* **Principal Rebuttal:** No, this confuses JVM-local scope with distributed cluster scope:
  1. Spring's `KafkaListenerEndpointRegistry` is **local to each individual JVM process (pod)**. Inside Pod 1, there is only one bean named `"orderProcessor"`; inside Pod 2, there is only one bean named `"orderProcessor"`. Therefore, zero `IllegalStateException` occurs during startup.
  2. A duplicate ID exception *only* occurs if two different `@KafkaListener` methods **within the exact same Spring Boot application** declare the same `id`.
  3. Across the 10 Kubernetes pods, each pod runs its own `"orderProcessor"` container locally, and all 10 containers connect to Kafka with the same `groupId`, cooperatively dividing the topic partitions.

---

#### Trap 3: "If our downstream database is saturated, can we just call `Thread.sleep(5000)` inside our `@KafkaListener` to throttle consumption?"
* **Junior/Mid Answer:** *"Yes, sleeping the thread slows down the loop and gives the database time to recover."*
* **Principal Rebuttal:** Calling `Thread.sleep()` inside `@KafkaListener` is a catastrophic anti-pattern that triggers a **Rebalance Storm**:
  1. In Spring Kafka, the listener execution runs inside the consumer poll loop thread (or blocks the container worker).
  2. If the cumulative sleep and processing time across the fetched batch exceeds **`max.poll.interval.ms`** (default: 300,000ms), the Kafka broker coordinator assumes the consumer is dead.
  3. The coordinator kicks the consumer out of the group, revokes its partitions, and triggers a group-wide stop-the-world rebalance.
  4. Once the thread finally wakes up, its commit fails with `CommitFailedException` because its partition assignment was revoked! The messages are redelivered to another pod, repeating the sleep, crashing that pod's consumer, and cascading across the entire cluster.
  5. **The Principal Solution**: Use `KafkaListenerEndpointRegistry.getListenerContainer(id).pause()`. The container calls `consumer.pause(partitions)`, which stops fetching records but **continues sending heartbeats and calling `poll(0)`**, keeping the consumer alive with zero rebalances. Resume processing with `container.resume()` once the database recovers.

---

#### Trap 4: "How can you implement a Publish-Subscribe broadcast pattern using `@KafkaListener` where EVERY running node receives a copy of EVERY event?"
* **Junior/Mid Answer:** *"Kafka only supports competing consumers in a group. To broadcast, you have to create a separate topic for each pod."*
* **Principal Rebuttal:** You do not need separate topics. Kafka natively supports broadcast fan-out by assigning **a distinct, unique Consumer Group ID to each running instance**:
  1. Use Spring Expression Language (SpEL) in the `@KafkaListener` definition:
     ```java
     @KafkaListener(
         id = "localCacheEviction",
         groupId = "cache-evict-#{T(java.util.UUID).randomUUID().toString()}",
         topics = "cache-invalidations",
         properties = {"auto.offset.reset=latest"}
     )
     ```
  2. Because each pod generates a random UUID for its `groupId`, each pod forms a 1-member consumer group that receives all partitions and all messages.
  3. **Critical Invariant**: You must set `auto.offset.reset=latest` so that restarting pods do not re-read months of historical ephemeral events.

---

#### Trap 5: "Can you dynamically pause message consumption on a single `@KafkaListener` without restarting or stopping the entire Spring Boot application?"
* **Junior/Mid Answer:** *"No, to stop consuming Kafka messages you have to shut down the application or destroy the listener bean."*
* **Principal Rebuttal:** Yes, this is the primary operational reason to define an explicit `id`:
  1. Inject `KafkaListenerEndpointRegistry` into an administrative Spring Service or Actuator endpoint.
  2. Retrieve the `MessageListenerContainer` by its explicit container `id`:
     ```java
     registry.getListenerContainer("paymentProcessor").pause();
     ```
  3. The container pauses record fetching immediately while the background thread continues sending heartbeats. The application remains healthy on Kubernetes liveness/readiness probes, and you can resume traffic anytime via `container.resume()`.

---

### 3. Mid-Level vs. Principal Candidate Phrasing Cheat Sheet

| Topic / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
|---|---|---|
| **Listener `id` vs `groupId`** | *"They are both used to identify the listener in Kafka."* | *"The `id` is JVM-local in Spring's `KafkaListenerEndpointRegistry` for lifecycle management and thread naming. The `groupId` is the distributed Kafka consumer group. Omitting `groupId` activates `idIsGroup = true`, silently overriding global group configuration."* |
| **Consumer Throttling** | *"I'll add a `Thread.sleep()` or delay in the listener method to reduce pressure on the database."* | *"Sleeping inside the listener blocks the poll loop, breaches `max.poll.interval.ms`, and triggers a cascading rebalance storm. I programmatically invoke `container.pause()`, which keeps heartbeat loops active while pausing record fetch."* |
| **Consumer Scaling in K8s** | *"We have to ensure each pod has a different `id` to avoid Spring bean collision."* | *"`KafkaListenerEndpointRegistry` is isolated to the single JVM container. 50 pods can safely share `@KafkaListener(id = "orders")` locally while sharing `groupId = "orders-group"` cluster-wide for partition load-balancing."* |
| **Fan-Out / Broadcast** | *"Kafka is a queue, so we need a separate topic per pod for local cache eviction."* | *"We use dynamic SpEL `groupId = "#{...UUID}"` with `auto.offset.reset=latest`. Each pod becomes an independent consumer group reading all partitions in parallel."* |
| **Rebalance Protocol** | *"Rebalances are normal and happen whenever a pod restarts."* | *"Eager rebalances pause consumption globally. We enforce `CooperativeStickyAssignor` for incremental partition handoffs and configure `group.instance.id` for static membership to eliminate rebalances during rolling deployments."* |
| **Offset Commits** | *"We use `enable.auto.commit = true` to save boilerplate code."* | *"Auto-commit creates at-most-once data loss risk if the JVM dies mid-batch. We use `AckMode.MANUAL_IMMEDIATE` with idempotent DB transactions, committing offsets only after successful business persistence."* |

