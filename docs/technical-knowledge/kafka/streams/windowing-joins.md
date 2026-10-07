---
id: windowing-joins
title: Kafka Streams — Windowing & Stream Joins
sidebar_label: 4. Windowing & Joins
sidebar_position: 4
description: >
  In-depth guide to Kafka Streams window types, the suppress() stalled stream-time trap,
  stream-stream and stream-table joins, and the co-partitioning troubleshooting checklist.
tags:
  - kafka
  - kafka-streams
  - windowing
  - joins
  - suppress
---

import KafkaStreamsWindowJoinDiagram from '@site/src/components/KafkaStreamsWindowJoinDiagram';

# Kafka Streams — Windowing & Stream Joins

Windowing and joins form the backbone of temporal stream processing in Kafka Streams. Both rely strictly on **Event-Time** semantics and **co-partitioning alignment**.

---

## 1. Windowing Types

<KafkaStreamsWindowJoinDiagram initialMode="tumbling" />

### 1. Tumbling Windows (Fixed-size, Non-overlapping)

Every event falls into exactly one window based on its record timestamp.

```
Window [10:00 - 10:05]    Window [10:05 - 10:10]    Window [10:10 - 10:15]
├────────────────────────┼────────────────────────┼────────────────────────┤
```

```java
TimeWindows tumblingWindow = TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5));

KTable<Windowed<String>, Long> orderCounts = stream
    .groupByKey(Grouped.as("group-by-user"))
    .windowedBy(tumblingWindow)
    .count(Materialized.as("tumbling-counts-store"));
```

### 2. Hopping Windows (Fixed-size, Overlapping)

Defined by window size and an advance hop interval. Records fall into multiple concurrent windows.

```java
// 5-minute window that advances every 1 minute
TimeWindows hoppingWindow = TimeWindows
    .ofSizeWithNoGrace(Duration.ofMinutes(5))
    .advanceBy(Duration.ofMinutes(1));
```

### 3. Sliding Windows (Data-Driven, Record-Relative)

Evaluated dynamically based on the time difference between records, not fixed clock boundaries. Used primarily in joins.

```java
SlidingWindows slidingWindow = SlidingWindows
    .ofTimeDifferenceWithNoGrace(Duration.ofMinutes(5));
```

### 4. Session Windows (Inactivity-Gap Bounded)

Groups events into sessions that close after a configurable period of inactivity.

```java
SessionWindows sessionWindow = SessionWindows
    .ofInactivityGapWithNoGrace(Duration.ofMinutes(5));

KTable<Windowed<String>, Long> sessionCounts = stream
    .groupByKey()
    .windowedBy(sessionWindow)
    .count(Materialized.as("session-activity-store"));
```

---

## 2. Suppress — Emit Only Final Window Results

By default, windowed aggregations emit intermediate updates **every time an incoming record updates the aggregate**. `suppress()` buffers intermediate states and emits **exactly once per window** when the window definitively closes:

```java
KTable<Windowed<String>, Long> finalCounts = stream
    .groupBy((k, v) -> v.getCategory(), Grouped.as("group-cat"))
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofSeconds(10)))
    .count(Materialized.as("suppress-counts"))
    .suppress(
        Suppressed.untilWindowCloses(
            Suppressed.BufferConfig.maxBytes(50 * 1024 * 1024L) // 50MB buffer
                .shutDownWhenFull() // StrictBufferConfig: fail fast if memory cap hit
        )
    );
```

---

## 3. The `suppress()` Stalled Stream-Time Trap (`suppress-not-emitting`)

The single most frequent production problem reported with `suppress(untilWindowCloses)` is that **the downstream output topic remains completely silent**.

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

### 1. Why Stream-Time Freezes on Quiet Partitions
- **Stream-Time is purely data-driven**: Stream-time advances **only when a new record arrives on that partition carrying a timestamp later than the current stream-time**.
- If a partition receives its last record at 10:58 and traffic stops, stream-time stays at 10:58. Even if days of wall-clock time pass, the window `[10:00 - 11:00]` cannot close! `suppress()` continues buffering the result in memory indefinitely.
- **Sparse Keys vs Quiet Partitions**: While state is partitioned by key, window closing is evaluated per **partition/task**. If other keys on that partition generate traffic, their events advance stream-time and flush the quiet key's window. But on low-traffic topics or unevenly keyed partitions, everything freezes.

### 2. Lagging Partition Holdback in Multi-Source Tasks
- In joins or `merge()`, Kafka Streams synchronizes inputs by processing the record with the **lowest timestamp** among buffered queues.
- A lagging partition anchors the entire task's stream-time, preventing windows fed by faster partitions from closing.

### 3. The `TopologyTestDriver` Illusion
In unit tests, developers pipe a future event to verify output:
```java
inputTopic.pipeInput("k", "v1", Instant.parse("2026-06-08T10:30:00Z"));
inputTopic.pipeInput("k", "v2", Instant.parse("2026-06-08T10:58:00Z"));
assertTrue(outputTopic.isEmpty()); // Open window

// Piping a record at 11:06 forces stream-time past 11:05:
inputTopic.pipeInput("k", "v3", Instant.parse("2026-06-08T11:06:00Z"));
assertFalse(outputTopic.isEmpty()); // Passed in test!
```
In production, if customer traffic pauses after 10:58, that 11:06 event never arrives, and output remains silent.

### 4. The BufferConfig Strictness Compile Trap
`untilWindowCloses` requires a `StrictBufferConfig`. Calling `emitEarlyWhenFull()` returns an `EagerBufferConfig`, which **fails to compile**. You cannot use `emitEarlyWhenFull()` to force output on an idle stream without abandoning `untilWindowCloses` semantics.

### 5. Production Solutions: Heartbeats vs Wall-Clock Punctuator

#### Approach A: Synthetic Pulse Topic
Produce a synthetic dummy message with current wall-clock timestamp into every partition at regular intervals (e.g. every minute) to force stream-time forward.
- *Downside*: Operational smell; pollutes topologies with fake data that processors must filter out.

#### Approach B: Processor API Wall-Clock Punctuator (Clean Architecture)
If you require deterministic real-time flushes on low-traffic streams, use a `WALL_CLOCK_TIME` Punctuator in the Processor API:

```java
context.schedule(Duration.ofMinutes(1), PunctuationType.WALL_CLOCK_TIME, currentWallTime -> {
    try (KeyValueIterator<String, ValueAndTimestamp<Long>> iter = store.all()) {
        while (iter.hasNext()) {
            KeyValue<String, ValueAndTimestamp<Long>> entry = iter.next();
            if (currentWallTime >= entry.value.timestamp() + windowDurationMs) {
                context().forward(new Record<>(entry.key, entry.value.value(), currentWallTime));
                store.delete(entry.key);
            }
        }
    }
});
```

---

## 4. Stream Joins

### Stream-Stream Join
Both streams are temporal — records join if they arrive within the specified `JoinWindows`:

```java
KStream<String, Order> orders = builder.stream("orders");
KStream<String, Payment> payments = builder.stream("payments");

JoinWindows joinWindow = JoinWindows
    .ofTimeDifferenceAndGrace(Duration.ofMinutes(5), Duration.ofSeconds(30));

KStream<String, OrderWithPayment> joined = orders.join(
    payments,
    OrderWithPayment::of,
    joinWindow,
    StreamJoined.with(Serdes.String(), orderSerde, paymentSerde)
        .withName("order-payment-join")
);
```

### Stream-KTable Join
The stream is temporal; the KTable represents current state. The stream record joins with the KTable's current value for the same key at the time of processing:

```java
KStream<String, Order> orders = builder.stream("orders");
KTable<String, CustomerProfile> customers = builder.table("customer-profiles");

KStream<String, EnrichedOrder> enriched = orders.join(
    customers,
    (order, profile) -> order.enrichWith(profile),
    Joined.as("order-customer-join")
);
```

### Stream-GlobalKTable Join
A `GlobalKTable` is fully replicated to all instances — **no co-partitioning required**. The join key is dynamically extracted from the stream record:

```java
GlobalKTable<String, Product> products = builder.globalTable("product-catalog");
KStream<String, Order> orders = builder.stream("orders");

KStream<String, EnrichedOrder> enriched = orders.join(
    products,
    (orderKey, order) -> order.getProductId(), // Dynamic key extractor
    (order, product) -> order.enrichWith(product)
);
```

---

## 5. Join Debugging & Troubleshooting Checklist

```
┌────────────────────────────────────────────────────────────────────────┐
│ Join Troubleshooting Pipeline:                                         │
│ 1. Co-partitioning Check ──► Same Partition Count? Same Hasher (Murmur)?│
│ 2. Timestamp Alignment   ──► Event-Time vs Wall-Clock skew?            │
│ 3. Asymmetric Windows    ──► before() and after() boundaries correct?  │
│ 4. Grace Period Drops    ──► Check metric: dropped-records-total       │
└────────────────────────────────────────────────────────────────────────┘
```

1. **The Co-Partitioning Tri-Contract**:
   - **Identical Partition Count**: If `orders` has 12 partitions and `payments` has 8, records for `user-42` hash to different partitions and tasks. They never meet in memory!
   - **Identical Key SerDes**: Strings vs Big-Endian Integers hash to completely different buckets.
   - **Identical Partitioner Strategy**: Upstream custom partitioners break co-partitioning.
2. **Asymmetric Window Boundaries (`before()` vs `after()`)**:
   - In real systems, payments happen *after* orders, not before:
     ```java
     JoinWindows asymmetric = JoinWindows.ofTimeDifferenceAndGrace(Duration.ofMinutes(10), Duration.ofMinutes(1))
         .before(Duration.ofSeconds(30))  // Clock skew tolerance
         .after(Duration.ofMinutes(10));  // Allow payment up to 10m later
     ```
3. **Late-Arriving Records & Grace Period Drops**:
   - Records arriving older than `stream_time - (windowSize + gracePeriod)` are dropped without error.
   - Monitor the JMX metric `dropped-records-total` to identify dropped records.
