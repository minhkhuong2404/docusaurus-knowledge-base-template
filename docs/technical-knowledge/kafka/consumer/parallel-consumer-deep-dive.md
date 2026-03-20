---
id: parallel-consumer-deep-dive
title: Parallel Consumer Deep Dive
sidebar_label: Parallel Consumer
description: "Deep dive into the Parallel Consumer model for increasing Kafka consumer throughput safely."
tags: [kafka, consumer, parallel-consumer, performance]
---

# Parallel Consumer — Deep Dive

## TL;DR

- Kafka default consumer = **1 partition → 1 thread**
- Parallel Consumer = **process multiple records concurrently while preserving ordering guarantees**
- Solves: **low throughput, I/O blocking, inefficient partition utilization**

---

# 1. The Problem with Default Kafka Consumer

## Default Model

```

Partition 0 → Thread 1
Partition 1 → Thread 2
Partition 2 → Thread 3

```

👉 Limitation:

- Max parallelism = number of partitions
- If partitions = 3 → only 3 concurrent executions
- If processing is slow (API call, DB call) → CPU underutilized

---

## Real Problem

```java
@KafkaListener(topics = "orders")
public void consume(Order order) {
    callExternalAPI(order); // slow I/O
}
```

👉 Issues:

* Thread blocked by I/O
* Partition throughput drops
* Increasing partitions = expensive + not always possible

---

# 2. What is Parallel Consumer?

Parallel Consumer is a **library (by Confluent)** that:

* Decouples **polling** from **processing**
* Allows **multiple records per partition to be processed concurrently**
* Maintains **ordering guarantees**

---

## Core Idea

```
Kafka Poll → Work Queue → Thread Pool → Process → Commit Offset
```

👉 Instead of:

```
Poll → Process → Commit (blocking)
```

---

# 3. Execution Model

## Internal Flow

```
Consumer.poll()
      ↓
Fetch batch of records
      ↓
Submit to Work Queue
      ↓
Parallel Processing (Thread Pool)
      ↓
Track completion
      ↓
Commit offsets safely
```

---

## Key Components

### 1. Poller Thread

* Reads from Kafka
* Pushes records into internal queue

---

### 2. Work Queue

* Buffers records
* Enables backpressure

---

### 3. Worker Threads

* Execute business logic
* Can run in parallel even within same partition

---

### 4. Offset Manager

* Tracks completed records
* Ensures safe commit

---

# 4. Ordering Guarantees

Parallel Consumer supports multiple modes:

---

## 1. Partition Ordering (Default Kafka)

```
Partition A:
  msg1 → msg2 → msg3 (strict order)
```

👉 No parallelism inside partition

---

## 2. Key Ordering (Most Useful)

```
Key A → sequential
Key B → parallel
Key C → parallel
```

👉 Example:

```
Order-1 → sequential
Order-2 → parallel
Order-3 → parallel
```

---

## 3. Unordered

```
All messages processed in parallel
```

👉 Highest throughput, lowest guarantees

---

## Trade-off

| Mode      | Ordering Guarantee | Throughput |
| --------- | ------------------ | ---------- |
| Partition | Strong             | Low        |
| Key       | Medium             | High       |
| Unordered | None               | Highest    |

---

# 5. Offset Management (Critical)

## Problem

Kafka requires:

```
Offsets must be committed in order
```

But processing is parallel → out-of-order completion.

---

## Solution

Parallel Consumer uses:

### Offset Tracking Graph

```
Offset 1 → done
Offset 2 → done
Offset 3 → NOT done
Offset 4 → done
```

👉 Commit only up to:

```
Offset 2
```

---

## Rule

> Only commit the **highest contiguous completed offset**

---

## Example

```
Processed: 1,2,4,5
Pending:   3
```

👉 Commit offset = 2

---

# 6. Java Example

## Dependency

```xml
<dependency>
  <groupId>io.confluent.parallelconsumer</groupId>
  <artifactId>parallel-consumer-core</artifactId>
</dependency>
```

---

## Basic Usage

```java
ParallelConsumerOptions<String, Order> options =
    ParallelConsumerOptions.<String, Order>builder()
        .ordering(ParallelConsumerOptions.ProcessingOrder.KEY)
        .maxConcurrency(100)
        .build();

ParallelStreamProcessor<String, Order> pc =
    ParallelStreamProcessor.createEosStreamProcessor(options);

pc.subscribe(List.of("orders"));

pc.poll(record -> {
    processOrder(record.value());
});
```

---

## Key Config

| Config         | Meaning                  |
| -------------- | ------------------------ |
| maxConcurrency | number of parallel tasks |
| ordering       | ordering strategy        |
| batchSize      | records per poll         |

---

# 7. Exactly-Once Support

Parallel Consumer supports EOS:

```java
createEosStreamProcessor(options);
```

## Flow

```
BEGIN TX
  → Process records
  → Produce output
  → Commit offsets
END TX
```

---

## Limitation

Still does NOT solve:

* External API duplication
* Side effects

👉 Need **deduplication**

---

# 8. Deduplication with Parallel Consumer

## Why Needed?

Parallelism increases chance of:

* Retry
* Duplicate execution

---

## Pattern

```java
pc.poll(record -> {
    if (isProcessed(record.key())) return;

    process(record);

    markProcessed(record.key());
});
```

---

## Storage Options

* Redis (fast)
* DB (strong consistency)
* Kafka State Store

---

# 9. Backpressure & Flow Control

Parallel Consumer automatically:

* Stops polling if queue is full
* Resumes when capacity available

---

## Key Insight

```
Kafka → controlled ingestion → stable system
```

---

# 10. Failure Handling

## Scenario

```
Task fails → retry
```

Options:

* Retry with backoff
* Send to DLQ
* Skip

---

## Important

Retry MUST be idempotent

---

# 11. Performance Characteristics

## Benefits

* Fully utilize CPU
* Maximize throughput
* Reduce latency for I/O-bound tasks

---

## Costs

* More memory (queue)
* More complexity
* Ordering trade-offs

---

# 12. When to Use Parallel Consumer

## Use When

* I/O heavy processing (API, DB)
* Few partitions but need high throughput
* Need key-level ordering

---

## Avoid When

* CPU-bound tasks only
* Strict partition ordering required
* Simple pipelines

---

# 13. Comparison

| Approach          | Parallelism     | Complexity |
| ----------------- | --------------- | ---------- |
| Kafka Default     | Partition-based | Low        |
| More Partitions   | Scales          | Medium     |
| Parallel Consumer | Flexible        | High       |

---

# 14. Production Pitfalls

## 1. Hot Keys

* One key dominates → no parallelism

## 2. Memory Pressure

* Large work queue

## 3. Offset Lag Confusion

* Processing done ≠ committed

## 4. Duplicate Processing

* Retry without dedup

---

# 15. Advanced Insight

## Parallel Consumer = Async Execution Layer on top of Kafka

```
Kafka → Reliable Input
Parallel Consumer → Concurrency Engine
Your Code → Business Logic
```

---

## Mental Model

> "Kafka controls ordering. Parallel Consumer controls concurrency."

---

# 16. Interview Answer

**Q: How does Parallel Consumer increase throughput without breaking ordering?**

> It decouples polling from processing and uses a work queue with a thread pool to process records concurrently. It maintains ordering guarantees by grouping records based on partition or key and uses an offset tracking mechanism to ensure only contiguous completed offsets are committed.

---

# 17. Final Takeaway

```
Default Kafka Consumer = Partition Parallelism
Parallel Consumer = Record-Level Parallelism
```

👉 This is a **fundamental throughput unlock** in event-driven systems.

---

# 18. Benchmark: Default Kafka Consumer vs Parallel Consumer

## Benchmark Setup

### Scenario

- Topic: `orders`
- Partitions: 6
- Message size: ~1KB
- Processing:
  - External API call (~50ms latency)
- Hardware:
  - 8 CPU cores
  - SSD disk

---

## Throughput Comparison

| Approach          | Throughput (msg/sec) | CPU Utilization | Latency (p95) |
| ----------------- | -------------------- | --------------- | ------------- |
| Default Consumer  | ~120                 | ~15%            | High          |
| Parallel Consumer | ~1800                | ~75%            | Lower         |

---

## Why Default Consumer is Slow

```text
Thread per partition → blocking I/O → idle CPU
```

* Each partition handled sequentially
* External API blocks thread
* CPU mostly idle

---

## Why Parallel Consumer is Faster

```text
Poll → Queue → Thread Pool → Concurrent Execution
```

* Multiple records processed concurrently
* CPU fully utilized
* I/O latency hidden by parallelism

---

## Key Insight

> Throughput is limited by **I/O latency × concurrency**

---

## Formula (Simplified)

```text
Throughput ≈ Concurrency / Latency
```

Example:

```text
Concurrency = 100
Latency = 50ms

→ 100 / 0.05 = 2000 msg/sec
```

---

## Important Caveat

Parallel Consumer improves:

* I/O-bound workloads ✅

But NOT:

* CPU-bound workloads ❌

---

# 19. Parallel Consumer vs Kafka Streams

## Core Difference

| Aspect           | Parallel Consumer   | Kafka Streams               |
| ---------------- | ------------------- | --------------------------- |
| Type             | Consumer library    | Stream processing framework |
| Abstraction      | Low-level (records) | High-level (DSL, topology)  |
| State management | Manual              | Built-in (state store)      |
| Scaling model    | Consumer group      | Task + partition            |
| Use case         | Async processing    | Stateful stream processing  |

---

## Execution Model

### Parallel Consumer

```text
Poll → Queue → Thread Pool → Process → Commit
```

---

### Kafka Streams

```text
Source → Processor → State Store → Sink
```

---

## Key Differences

### 1. State Handling

* Parallel Consumer:

  * You manage state manually
  * Often external DB / Redis

* Kafka Streams:

  * Built-in RocksDB state store
  * Changelog for recovery

---

### 2. Ordering

* Parallel Consumer:

  * Configurable (partition / key / unordered)

* Kafka Streams:

  * Partition-based
  * Strict processing semantics

---

### 3. Complexity

* Parallel Consumer:

  * Easier to integrate
  * Harder to reason about correctness

* Kafka Streams:

  * More structured
  * Steeper learning curve

---

## When to Use Each

### Use Parallel Consumer

* You already have consumer logic
* Need to increase throughput quickly
* Heavy I/O processing
* No complex stateful logic

---

### Use Kafka Streams

* Stateful processing (aggregation, joins)
* Event-driven pipelines
* Exactly-once processing required
* Need built-in fault tolerance

---

## Mental Model

```text
Parallel Consumer = Concurrency Tool
Kafka Streams = Data Processing Engine
```

---

# 20. Parallel Consumer vs Reactor (WebFlux)

## Core Difference

| Aspect       | Parallel Consumer        | Reactor (WebFlux)         |
| ------------ | ------------------------ | ------------------------- |
| Model        | Thread-based concurrency | Event-loop (non-blocking) |
| Execution    | Thread pool              | Async pipeline            |
| Backpressure | Queue-based              | Reactive streams          |
| Complexity   | Medium                   | High                      |
| Performance  | High                     | Very high (if done right) |

---

## Execution Model

### Parallel Consumer

```text
Thread Pool → Blocking I/O → Parallel execution
```

---

### Reactor

```text
Event Loop → Non-blocking I/O → Callback execution
```

---

## Example

### Parallel Consumer

```java
pc.poll(record -> {
    callExternalAPI(record.value()); // blocking
});
```

---

### Reactor

```java
Flux.fromIterable(records)
    .flatMap(record ->
        webClient.post()
            .bodyValue(record)
            .retrieve()
            .bodyToMono(Void.class)
    )
    .subscribe();
```

---

## Key Differences

### 1. Blocking vs Non-blocking

* Parallel Consumer:

  * Works well with blocking APIs

* Reactor:

  * Requires non-blocking APIs

---

### 2. Throughput

* Reactor can outperform:

  * If fully non-blocking
  * Lower thread overhead

---

### 3. Complexity

* Parallel Consumer:

  * Easier to adopt

* Reactor:

  * Harder debugging
  * Requires reactive mindset

---

## Hybrid Pattern (Very Powerful 🔥)

```text
Kafka → Parallel Consumer → Reactor → External API
```

Example:

```java
pc.poll(record -> {
    return webClient.post()
        .bodyValue(record.value())
        .retrieve()
        .bodyToMono(Void.class);
});
```

---

## When to Use Each

### Use Parallel Consumer

* Legacy blocking systems
* Quick performance improvement
* Simpler mental model

---

### Use Reactor

* High-scale systems
* Non-blocking APIs
* Need extreme throughput

---

# 21. Final Architecture Decision Guide

## Decision Matrix

| Requirement              | Recommendation         |
| ------------------------ | ---------------------- |
| Simple consumer          | Default Kafka Consumer |
| High throughput (I/O)    | Parallel Consumer      |
| Stateful processing      | Kafka Streams          |
| Ultra high scale (async) | Reactor                |
| Financial correctness    | EOS + Dedup            |

---

# 22. Final Takeaway

```text
Default Consumer → Partition parallelism
Parallel Consumer → Record-level parallelism
Reactor → Non-blocking concurrency
Kafka Streams → Stateful processing
```

---

## Golden Rule

> "Choose based on bottleneck:
>
> * CPU → optimize computation
> * I/O → use Parallel Consumer or Reactor
> * State → use Kafka Streams"
