---
id: interview-advanced
title: Interview Questions — Advanced Topics
sidebar_label: Advanced Topics Q&A
---

# Interview Questions — Advanced Topics

---

## Exactly-Once & Transactions

**Q1: What are the three layers required for end-to-end exactly-once in Kafka?**

> 1. **Idempotent Producer** (`enable.idempotence=true`): prevents duplicate broker writes when the producer retries due to network failures or timeouts, within the same session.
> 2. **Transactions** (`transactional.id` + `beginTransaction`/`commitTransaction`): enables atomic multi-partition writes and atomic offset commits via `sendOffsetsToTransaction`.
> 3. **`read_committed` Consumer** (`isolation.level=read_committed`): consumers only see records from committed transactions, ignoring aborted or in-flight transactions.

---

**Q2: Why is exactly-once harder to achieve with external systems (databases, REST APIs)?**

> Kafka's EOS only covers the Kafka cluster itself (producer → broker → consumer). When a consumer writes to an external database, Kafka cannot roll back that database write if the Kafka transaction aborts. To achieve EOS with external systems you need: (1) **Idempotent external writes** — use upserts with a unique event ID key so reprocessed messages don't cause duplicates. (2) **Two-phase commit** with an external coordinator (XA protocol) — complex and rarely practical. (3) **Outbox pattern** — write to DB and Kafka in a single DB transaction using CDC to sync to Kafka.

---

**Q3: What is the performance overhead of Kafka Transactions?**

> Each transaction commit involves: (1) A PREPARE_COMMIT write to the `__transaction_state` topic (one coordinator round-trip). (2) COMMIT markers written to each partition involved in the transaction. (3) Consumers with `read_committed` must buffer records from open transactions, adding memory pressure and delaying consumer advance.
>
> In practice, the overhead is ~2–5ms per transaction. The key optimization is **batching**: include many records in a single transaction rather than one transaction per record. For high-throughput pipelines, transaction overhead is typically 5–15% latency increase.

---

## Kafka Streams

**Q4: What is a KTable and how is it different from a KStream?**

> A `KStream` is an unbounded event stream — every record is an independent event and all records are processed. A `KTable` is a changelog stream — it represents a materialized view where each new record for a key **replaces** the previous value. Internally, a KTable is backed by a RocksDB state store and a changelog Kafka topic. Reading a KTable gives you the current state per key; reading a KStream gives you every historical event.

---

**Q5: How does Kafka Streams handle joins between two KStreams?**

> A KStream-KStream join is a **windowed join** — two events must arrive within a configurable time window to be joined. Kafka Streams buffers events in a **window store** (backed by RocksDB) and attempts to match events from both streams within the window. The join is commutative — it doesn't matter which stream's event arrives first, as long as both arrive within the window. Records outside the window are not joined and are typically dropped.

---

**Q6: What is `processing.guarantee=exactly_once_v2` in Kafka Streams?**

> It configures Kafka Streams to use transactional producers for each stream task. Every read-process-write cycle is wrapped in a Kafka transaction: input offset commits and output records are committed atomically. If the task fails, the transaction is aborted, and the task retries from the last committed offset. V2 (EOS V2) uses one transactional producer per **thread** (rather than per task as in V1), significantly reducing the number of open transactions and improving throughput.

---

**Q7: How does Kafka Streams recover from failures?**

> State stores are backed by **changelog topics** — every state update is written as a record to a Kafka topic. On failure, a new task instance replays the changelog topic to rebuild its local RocksDB state store. To speed up recovery, Kafka Streams can maintain **standby replicas** — additional task instances that shadow the active task by continuously applying changelog updates. With standby replicas, failover is near-instant (the standby already has the state up to date).

---

## Kafka Connect

**Q8: What is Change Data Capture (CDC) and how does Debezium implement it?**

> CDC captures every database row change (INSERT/UPDATE/DELETE) in real time. Debezium reads the database's binary transaction log directly — MySQL binlog, PostgreSQL WAL, MongoDB oplog — rather than polling tables with queries. This approach has several advantages: captures deletes (which polling misses), sub-second latency, minimal database load (no extra queries), and preserves event order per row.

---

**Q9: What is the difference between Kafka Connect and a custom Kafka producer/consumer?**

> Kafka Connect provides a standardized framework with built-in features: distributed task management, automatic rebalancing, offset tracking, exactly-once support for some connectors, REST API management, monitoring, and a rich ecosystem of existing connectors. A custom producer/consumer requires implementing all of this yourself. Use Connect for data integration with standard systems (databases, object stores, search engines); use custom producers/consumers for business logic, transformations, or when no connector exists.

---

## Message Ordering

**Q10: How do you maintain strict message ordering in Kafka while also having high throughput?**

> Use the entity ID (e.g., `orderId`) as the partition key — all messages for the same entity go to the same partition, preserving per-entity order. For throughput, increase partition count to scale horizontally. The trade-off: you get N-way parallelism (one per partition) while maintaining per-key ordering within each partition.
>
> If global ordering is required (rare), you must use a single partition, which eliminates horizontal scalability. In that case, consider whether you truly need global ordering or only per-entity ordering.

---

**Q11: How can retries cause message reordering and how do you prevent it?**

> With `max.in.flight.requests.per.connection > 1` and retries enabled, a failed batch can be retried after a later batch has already succeeded, resulting in the retried batch being appended after the later batch — out of order. Fix: either set `max.in.flight.requests.per.connection=1` (safe ordering, lower throughput) or enable `enable.idempotence=true` which safely handles reordering up to 5 in-flight requests using sequence numbers.

---

## Performance & Tuning

**Q12: How would you tune Kafka for maximum throughput?**

> **Producer side**: Increase `batch.size` (e.g., 64KB–1MB), increase `linger.ms` (e.g., 10–50ms), enable compression (`snappy` or `lz4`), increase `buffer.memory`, use `acks=1` if some data loss is acceptable.
>
> **Broker side**: Increase `num.io.threads` and `num.network.threads`, use fast SSDs for log directories, tune OS `vm.dirty_ratio` for write buffering, increase `socket.send.buffer.bytes`.
>
> **Consumer side**: Increase `fetch.min.bytes` and `fetch.max.wait.ms` to batch fetches, increase `max.poll.records`, add more consumer threads/instances.

---

**Q13: What is the impact of enabling compression on Kafka?**

> Compression reduces network bandwidth and disk usage, often improving throughput significantly for text/JSON payloads (50–80% size reduction). The CPU cost is minimal with `snappy` or `lz4`. `gzip` achieves better ratios but uses more CPU. `zstd` (Kafka 2.1+) offers the best compression ratio with moderate CPU.
>
> Compression is done at the **batch level** on the producer side and decompressed by the consumer. The broker stores compressed data as-is (no decompress/recompress unless the consumer requests a different format).

---

**Q14: What is `fetch.min.bytes` and `fetch.max.wait.ms`?**

> `fetch.min.bytes` (default 1 byte) tells the broker the minimum amount of data to accumulate before responding to a fetch request. Setting it higher (e.g., 1MB) reduces fetch requests but increases latency. `fetch.max.wait.ms` (default 500ms) is the maximum time the broker will wait if there's less data available than `fetch.min.bytes` before responding anyway. Together they implement **consumer-side batching**: wait up to `fetch.max.wait.ms` or until `fetch.min.bytes` is available.

---

## Design & Architecture

**Q15: When would you choose Kafka over RabbitMQ?**

> Choose Kafka when: (1) You need to **replay** messages (consumers can re-read history). (2) Multiple independent systems need to consume the **same stream** (fan-out). (3) High throughput (millions of msg/sec) is required. (4) You need **long-term retention** of event history. (5) You're building event-sourced systems or audit logs. (6) You need **stream processing** (Kafka Streams).
>
> Choose RabbitMQ when: (1) You need push-based delivery with immediate routing flexibility. (2) Complex routing logic (topic exchanges, dead letter exchanges) is needed. (3) Message ordering within a single consumer matters more than scalability. (4) Low operational complexity is paramount.

---

**Q16: What is the Outbox Pattern and how does it relate to Kafka?**

> The Outbox Pattern solves the dual-write problem: atomically writing to both a database and publishing to Kafka. Instead of writing to DB + Kafka in separate operations (which can fail independently), you write only to a DB `outbox` table within the same DB transaction. A separate process (or Debezium CDC) reads the outbox table and publishes events to Kafka. This guarantees: either both the DB write and the Kafka message happen, or neither does.

---

**Q17: How do you handle schema evolution in a live Kafka pipeline?**

> Use Schema Registry with a compatibility policy (typically `BACKWARD` or `FULL_TRANSITIVE`). Design schemas with evolution in mind: use optional fields with defaults (never required fields that can be removed). When adding a field, provide a default value. When removing a field, deprecate it first (mark in docs, stop producing it) and remove only when all consumers have been updated. Never rename fields — add a new field and deprecate the old. Use `FULL_TRANSITIVE` for the strictest safety: new schema is both backward and forward compatible with all historical versions.

---

**Q18: How would you design a Kafka-based event-driven order processing system?**

> ```
> OrderService → "order.created" (key: orderId)
>                     │
>              ┌──────┴──────┐
>              ▼             ▼
>     PaymentService    InventoryService
>     → "payment.processed"  → "inventory.reserved"
>              │                     │
>              └──────┬──────────────┘
>                     ▼
>             FulfillmentService
>             (joins payment + inventory events)
>             → "order.fulfilled"
>                     │
>                     ▼
>             NotificationService
>             → sends email/push
> ```
>
> Key design decisions: (1) Use `orderId` as partition key for all events — ensures per-order ordering. (2) Each service has its own consumer group — independent scaling. (3) Use Schema Registry with FULL_TRANSITIVE for schema safety. (4) Each service publishes to its own topic with `acks=all` + idempotence. (5) Use DLT (Dead Letter Topic) for failed processing. (6) Consider Kafka Streams for the join between payment and inventory events.
