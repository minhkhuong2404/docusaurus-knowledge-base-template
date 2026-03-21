---
id: chapter-11
title: "Chapter 11: Stream Processing"
sidebar_label: "Ch 11 — Stream Processing"
sidebar_position: 2
---

# Chapter 11: Stream Processing

## The Big Idea

Batch processing has one problem: **latency**. A job that runs once a day means insights that are 24 hours stale. Stream processing is like a continuous batch job — instead of processing a bounded dataset at scheduled intervals, you process an **unbounded, continuously arriving stream of data** in near-real-time.

> **Stream = data that is produced over time, continuously**

This chapter covers how to transmit, process, and derive insights from streams.

---

## 📨 Transmitting Event Streams

### Events and Streams

An **event** is a small, self-contained, immutable record of something that happened at a specific time. Examples:
- User clicked a button
- Sensor reported a temperature
- A service processed a payment

A **stream** is a sequence of related events. The producer encodes the event; consumers decode and process it.

### Direct Messaging vs Message Brokers

**Direct messaging (UDP multicast, HTTP webhooks, ZeroMQ):**
- Low latency
- ❌ If consumer is down, messages are lost
- ❌ Producer must know about all consumers

**Message brokers (Kafka, RabbitMQ, Kinesis):**
- Producers send to the broker; consumers receive from the broker
- ✅ Durability: messages stored until consumed (or expired)
- ✅ Decoupling: producers don't know about consumers
- ✅ Backpressure: if consumer is slow, messages queue up

### Message Brokers vs Databases

| Aspect | Message Broker | Database |
|---|---|---|
| Retention | Messages deleted after consumption | Data stored indefinitely |
| Querying | Subscribe to new messages | Ad-hoc queries over all data |
| Secondary indexes | No | Yes |
| Ordering | Within partition | Depends on schema |

**Log-based message brokers (Kafka):** A hybrid — messages are stored on disk durably, consumers track their position (offset). Messages are not deleted after consumption — multiple consumers can read independently. Old messages expire based on retention policy.

---

## 🚀 Apache Kafka Deep Dive

Kafka is the dominant log-based message broker. Key design:

```
Producer → Topic → [Partition 0: msg0, msg1, msg2, ...]
                 → [Partition 1: msg0, msg1, msg2, ...]
                 → [Partition 2: msg0, msg1, msg2, ...]
                        ↓
Consumer Group: [Consumer A reads P0, Consumer B reads P1, Consumer C reads P2]
```

- A **topic** is split into **partitions** for parallelism
- Each partition is an **append-only, ordered log**
- Each consumer tracks its **offset** (which message it processed last)
- Messages are retained for a configurable period (days or weeks), regardless of consumption
- Multiple independent consumer groups can read the same topic

**Why this is powerful:**
- Adding consumers doesn't affect producers
- Replay: reset your offset to re-read historical messages (e.g., after fixing a bug in your consumer)
- Fan-out: multiple services subscribe to the same events independently
- Exactly-once and at-least-once delivery semantics (with careful consumer design)

---

## ⚙️ Stream Processing Patterns

### 1. Complex Event Processing (CEP)

Search for event patterns across a stream, similar to a regex matching on a string.

**Example:** Detect credit card fraud — find a pattern like "purchase in New York, then purchase in London, within 5 minutes."

Frameworks: Esper, Siddhi. CEP systems reverse the normal model — queries are stored, data flows through them.

### 2. Stream Analytics

Aggregate metrics over time windows. Unlike CEP, you don't care about individual event sequences — you want statistics:

- Request count per minute
- 95th percentile latency per hour
- Unique user count per day

Frameworks: Apache Flink, Apache Spark Streaming, Apache Storm, Kafka Streams.

### 3. Maintaining Materialized Views

Keep a derived view of data up-to-date in near-real-time. Every change event to the source is applied to the materialized view.

**Example:** Keep a search index (Elasticsearch) synchronized with a database (PostgreSQL) via a CDC stream.

---

## ⏱️ Time in Stream Processing

Time is surprisingly tricky in stream processing:

### Event Time vs Processing Time

- **Event time:** When the event actually occurred (timestamp in the event)
- **Processing time:** When the event arrived at the stream processor

These diverge because of:
- Network delays
- Mobile apps that buffer events when offline (then flush when connected)
- Events arriving out of order

**Example:** A mobile app sends events. If the user is on a plane for 8 hours, all events arrive at processing time T, but event times span T-8 hours to T.

### Windowing

Group events into time windows for aggregation:

| Window Type | Description | Example |
|---|---|---|
| **Tumbling** | Fixed-size, non-overlapping | Events from 10:00–10:01, 10:01–10:02 |
| **Hopping** | Fixed-size, overlapping | 5-min window, every 1 min |
| **Sliding** | Window per event (last N seconds) | "events in the last 5 minutes" |
| **Session** | Variable-size, inactivity-gap-bounded | User session (gap > 30 min = new session) |

### Handling Late-Arriving Events

If you process based on **event time** and events arrive late, you need to decide:
1. **Watermarks:** Declare "I believe all events up to time T have arrived" → close the window and emit results. Risk: some late events exceed the watermark → ignored.
2. **Allow lateness:** Keep windows open for a grace period. When a late event arrives within grace period, update and re-emit the window result.
3. **Retract and re-emit:** Emit a preliminary result, then emit a correction when late events arrive.

**Apache Flink** provides all three mechanisms.

---

## 🔗 Joins in Stream Processing

### Stream-Stream Join (Windowed Join)

Both sides are streams. Join events that occur within the same time window.

**Example:** Match search queries with click events. A user searches, then clicks a result within 1 hour — what search query led to which click?

Both streams must be buffered. Events expire from the buffer after the window.

### Stream-Table Join (Enrichment)

One side is a stream, the other is a slowly-changing database table.

**Example:** Enrich activity events with the user's current profile data.

The database table must be loaded into memory (or efficiently queried). When the table updates, the stream processor must pick up the changes — this is often done via CDC (Change Data Capture) on the database.

### Table-Table Join (Materialized View Maintenance)

Both sides are streams of database changes. Maintain a derived table that joins them.

**Example:** Maintain a user's timeline = join "who they follow" changes with "posts" changes.

---

## ⚡ Fault Tolerance in Stream Processing

Batch jobs are easy to retry — just re-run from the beginning. Streams are infinite — you can't "re-run from the beginning" indefinitely.

### Microbatching and Checkpointing

**Apache Spark Streaming:** Process data in small batches (every 0.5–5 seconds). Each microbatch is a mini-batch job — exactly-once semantics via batch recomputation on failure.

**Apache Flink:** Continuously checkpoint state to durable storage (HDFS/S3) at regular intervals. On failure, restart from the last checkpoint + replay events since then.

### Idempotent Writes

If processing fails and restarts, you might process the same event twice → duplicate writes. Make writes **idempotent** — processing the same event twice has the same effect as processing it once.

Techniques:
- Include a unique event ID in writes; use upsert/ignore-if-exists semantics
- Use a key derived from the event content (content-addressed storage)

### Exactly-Once Semantics

The holy grail. Achieved by combining:
1. Durable, replayable message log (Kafka offset tracking)
2. Idempotent writes (or two-phase commit to output systems)
3. Checkpointed processing state (Flink's distributed snapshots)

**Apache Flink + Kafka** provides end-to-end exactly-once, with caveats.

---

## 🔄 Stream Processing vs Batch Processing

| Aspect | Batch | Stream |
|---|---|---|
| Input | Bounded (finite dataset) | Unbounded (infinite stream) |
| Latency | Minutes to hours | Milliseconds to seconds |
| Fault tolerance | Re-run from scratch | Checkpoint + replay |
| State | No persistent state (functional) | Stateful operators |
| Output | Written on completion | Continuously updated |

**The Lambda Architecture** (formerly popular) ran batch + stream in parallel and merged results. This is now largely replaced by systems like Flink that handle both with one system.

---

## Summary

Stream processing enables:
- Real-time dashboards and monitoring
- Fraud detection and alerting
- Near-real-time search index updates (CDC → Kafka → Elasticsearch)
- Event-driven microservices (choreography via shared event log)
- Continuous ETL pipelines

The key concepts are: **event logs as the source of truth**, **time windowing**, **stateful operators**, and **fault tolerance via checkpointing and replay**. These make stream processing as reliable and deterministic as batch processing — just much faster.
