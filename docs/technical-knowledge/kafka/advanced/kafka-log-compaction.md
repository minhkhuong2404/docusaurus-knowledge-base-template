---
id: kafka-log-compaction
title: Kafka Log Compaction Explained
sidebar_label: Log Compaction
description: How Kafka log compaction preserves the latest value per key, enabling state stores, CDC changelog topics, and materialized views. Covers cleaner internals, tombstones, tiered storage, and KTable integration.
tags:
- technical-knowledge
- kafka
- advanced
- log-compaction
---

import KafkaLogCompactionDiagram from '@site/src/components/KafkaLogCompactionDiagram';

# Kafka Log Compaction Explained

<KafkaLogCompactionDiagram />

---

Kafka is widely known for time-based retention — messages older than `retention.ms` are deleted. But there is a second retention mode that serves an entirely different purpose: **log compaction**.

Log compaction preserves at least the **latest value for each message key** within a partition, transforming a Kafka topic from an append-only event log into something closer to a table of current states.

---

## What Is Log Compaction?

Log compaction is a retention policy (enabled via `cleanup.policy=compact`) that ensures a partition retains, indefinitely, the most recent update for every key. Unlike deletion-based retention (which removes old data after a time or size limit), compaction keeps the most recent record per key regardless of age.

```
Before compaction (raw partition):
  [K1:v1] [K2:v1] [K1:v2] [K3:v1] [K2:v2] [K1:v3]

After compaction:
  [K2:v2] [K3:v1] [K1:v3]
```

Key properties:
- **Immutable offsets**: Offsets are never renumbered. Consumers can still track their position reliably.
- **Tombstone records**: A message with a **null value** for a key marks it for deletion. The compaction process eventually removes both the tombstone and all prior versions.
- **Active segment is never compacted**: The segment currently being written to is always excluded from compaction.

---

## How Compaction Works Internally

Kafka partitions are divided into **segments** — immutable files containing a time/size-bounded chunk of messages. A background **cleaner thread** periodically scans the "dirty" portion of the log (not yet compacted) and builds a hash map of the latest offset for each key. It then creates new clean segments containing only the most recent records, deleting the old ones.

The log is conceptually split into two regions:

| Section | Content |
|---------|---------|
| **Clean** | Segments already compacted — one value per key |
| **Dirty** | Segments with duplicate keys that haven't been compacted yet |

Log compaction works identically in both ZooKeeper-based Kafka and modern **KRaft mode (Kafka 4.0+)**. The compaction process is entirely broker-side and doesn't depend on the metadata management layer.

### Key Configuration Parameters

| Config | Default | Description |
|--------|---------|-------------|
| `cleanup.policy` | `delete` | Set to `compact` or `compact,delete` |
| `min.cleanable.dirty.ratio` | `0.5` | Fraction of dirty records before compaction triggers |
| `min.compaction.lag.ms` | `0` | Minimum time a message stays uncompacted |
| `max.compaction.lag.ms` | `Long.MAX_VALUE` | Maximum delay before a message must be compacted |
| `delete.retention.ms` | `86400000` (1 day) | How long tombstones are retained |
| `segment.ms` / `segment.bytes` | `604800000` / `1GB` | Segment rotation controls compaction granularity |

:::tip
Compaction is **not immediate**. Messages remain in the log until the cleaner thread runs. For time-critical state stores, ensure `min.compaction.lag.ms` allows fresh data to settle before compaction.
:::

---

## Log Compaction vs. Time-Based Retention

| | Time-Based Deletion | Log Compaction |
|--|--|--|
| **Policy** | `cleanup.policy=delete` | `cleanup.policy=compact` |
| **What's kept** | All messages within retention window | Latest value per key |
| **Best for** | Event streams, audit logs, clickstreams | State stores, CDC changelogs, config topics |
| **Supports tombstones?** | No | ✅ Yes (null value = delete key) |
| **Bounded storage?** | ✅ Yes | Unbounded (unless combined with `delete`) |

You can **combine both** with `cleanup.policy=compact,delete` — compacts the log while also removing old compacted segments that exceed retention limits.

---

## Configuring Log Compaction

```bash
# Enable compaction at topic creation
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create \
  --topic user-profiles \
  --partitions 6 \
  --replication-factor 3 \
  --config cleanup.policy=compact \
  --config min.cleanable.dirty.ratio=0.3 \
  --config delete.retention.ms=3600000

# Enable compaction on existing topic
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name user-profiles \
  --alter --add-config cleanup.policy=compact

# Inspect current topic configs
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name user-profiles --describe
```

---

## Use Cases

### Change Data Capture (CDC) Changelogs

CDC pipelines (e.g., Debezium) capture database row changes into Kafka, keyed by primary key. Log compaction ensures the topic always contains the current state of each row without storing full history indefinitely.

```
Key: user_123 | Value: {"name": "Alice", "email": "alice@old.com"}  → compacted away
Key: user_123 | Value: {"name": "Alice", "email": "alice@new.com"}  → retained
```

After compaction, downstream services only need to read the final value per key to rebuild current database state.

### Configuration / Reference Data Distribution

Distributed systems publish configuration to a compacted topic so services can reconstruct the full current config by reading only the latest value per key — without replaying the entire history.

### State Stores in Kafka Streams

Kafka Streams uses **compacted changelog topics** to back state stores. When a stream processor updates local state, it writes changes to a compacted topic. On restart or rebalance, the application rebuilds state by consuming only latest values — much faster than replaying full history.

---

## KTables and Compacted Topics

In Kafka Streams, a **KTable** is semantically backed by a compacted topic — the last value for each key represents the current state.

```java
StreamsBuilder builder = new StreamsBuilder();

// KTable automatically interprets the compacted topic as a table
KTable<String, User> usersTable = builder.table(
    "users-compacted",
    Consumed.with(Serdes.String(), userSerde)
);

// When you materialize aggregations, Kafka Streams creates
// compacted changelog topics automatically:
KTable<String, Long> orderCounts = ordersStream
    .groupByKey()
    .count(Materialized.as("order-counts-store"));
    // Internally creates: app-id-order-counts-store-changelog (compacted)
```

**Tombstone deletion in a KTable:**
```java
// Producing a null value to a compacted topic signals key deletion
usersTable
    .toStream()
    .filter((key, user) -> user.shouldDelete())
    .mapValues(user -> (User) null)  // null value = tombstone
    .to("users-compacted");
```

After `delete.retention.ms`, the key is fully removed from the compacted log.

---

## Log Compaction and Tiered Storage (Kafka 3.6+)

Kafka 3.6+ introduced **tiered storage**, offloading cold segments to object storage (S3, GCS, Azure Blob). This interacts with compaction in important ways:

- **Compaction only applies to local segments**: The cleaner thread compacts segments on broker disk. Once a segment is uploaded to remote storage, it is no longer compacted — retaining all its original messages (including older values for a key).
- **State reconstruction implications**: Rebuilding state from a compacted topic with tiered storage may require reading and deduplicating remote segments.

**Best practices when combining compaction and tiered storage:**

1. Set `local.retention.ms` high enough that segments get compacted before being tiered.
2. Monitor dirty ratios to ensure compaction runs before data moves to remote storage.
3. For true state store topics, consider compaction-only (no tiered storage) or very long local retention.

---

## Monitoring Log Compaction

### Key JMX Metrics

| Metric | Description |
|--------|-------------|
| `kafka.log.LogCleanerManager:max-dirty-percent` | Dirty ratio per partition — trigger threshold |
| `kafka.log.LogCleaner:cleaner-recopy-percent` | Compaction efficiency (lower is better) |
| `kafka.log.LogCleaner:max-compaction-delay-secs` | Max time any partition waited for compaction |
| `kafka.log.LogCleaner:DeadThreadCount` | Cleaner thread health |

```bash
# Check cleaner thread metrics via CLI
kafka-log-dirs.sh --bootstrap-server localhost:9092 \
  --topic-list user-profiles --describe
```

### Common Issues

| Problem | Symptom | Fix |
|---------|---------|-----|
| Compaction lag | Dirty ratio stays high | Increase `log.cleaner.threads` or lower `min.cleanable.dirty.ratio` |
| Missing keys after compaction | Data disappears unexpectedly | Check for accidental tombstone records (null values) |
| No keys on messages | Messages accumulate, never compact | Compaction only works on keyed messages. Ensure all producers set a key |
| Slow state restoration | Consumer takes long to rebuild | With tiered storage: ensure adequate local retention before segments are tiered |

---

## Interview Questions

### Q: What is the difference between `cleanup.policy=delete` and `cleanup.policy=compact`?

> `delete` removes messages after `retention.ms` or `retention.bytes` — all messages regardless of key. `compact` retains the latest value for each unique key indefinitely, deleting older duplicates. `compact` is appropriate when you need "current state" semantics (e.g., CDC changelogs, state stores); `delete` is appropriate when you need bounded time-window storage (event streams, logs). You can combine both with `cleanup.policy=compact,delete`.

### Q: What is a tombstone record and how does it affect compaction?

> A tombstone is a record with a **null value**. When a producer writes a null-value message for a key to a compacted topic, it signals that the key should be deleted. The compaction cleaner will eventually remove both the tombstone and all prior records for that key. Tombstones are retained for `delete.retention.ms` (default 24 hours) to give downstream consumers time to observe the deletion before it's purged.

### Q: How does Kafka Streams use compacted topics for state stores?

> Kafka Streams backs each state store (used for aggregations, joins, windowing) with a compacted changelog topic. Every update to the state store is written as a keyed message to this changelog. If the application crashes or a partition rebalances to a new consumer, the state store is rebuilt by replaying the compacted topic from the beginning — only the latest value per key is needed, so restoration is efficient. This is how Kafka Streams achieves fault-tolerant stateful processing without an external database.

### Q: Will compaction happen immediately after enabling it on a topic?

> No. Compaction runs asynchronously in a background cleaner thread and only triggers when the dirty ratio exceeds `min.cleanable.dirty.ratio` (default 0.5 = 50%). Additionally, the **active segment** (the one currently being written to) is never compacted. Depending on write volume and cleaner thread workload, there can be a significant delay between enabling compaction and the first cleanup pass running.

---

## Related Topics

- [Kafka Streams Deep Dive](./kafka-streams-deep-dive.md) — KTables and state stores that depend on compacted changelog topics
- [Exactly-Once Semantics](./exactly-once.md) — State store recovery integrates with EOS via compacted topics
- [Monitoring & Operations](./monitoring-operations.md) — JMX metrics for cleaner thread health
- [Schema Registry](./schema-registry.md) — Schema compatibility for compacted topic consumers

## Sources

1. [Apache Kafka Documentation: Log Compaction](https://kafka.apache.org/documentation/#compaction)
2. [Kafka Streams Documentation: State Stores](https://kafka.apache.org/documentation/streams/developer-guide/processor-api#state-stores)
3. Narkhede, N., Shapira, G., & Palino, T. — *Kafka: The Definitive Guide* (O'Reilly)
4. Kleppmann, M. — *Designing Data-Intensive Applications* (O'Reilly)
