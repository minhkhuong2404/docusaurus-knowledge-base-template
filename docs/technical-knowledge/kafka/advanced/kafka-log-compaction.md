---
id: kafka-log-compaction
title: "Kafka Cleanup Policy & Log Compaction: Delete, Compact & Dual Retention Deep Dive"
sidebar_label: Cleanup Policy & Compaction
description: Principal engineering guide to Kafka cleanup.policy (delete, compact, compact,delete), broker vs topic configs, SkimpyOffsetMap cleaner internals, tombstone resurrection, and production gotchas.
tags:
  - technical-knowledge
  - kafka
  - cleanup-policy
  - log-compaction
  - broker-architecture
  - reliability
---

import KafkaLogCompactionDiagram from '@site/src/components/KafkaLogCompactionDiagram';

# Kafka Cleanup Policy & Log Compaction: Delete, Compact & Dual Retention Deep Dive

In Apache Kafka, message retention is governed by the `cleanup.policy` configuration. While developers frequently treat Kafka as an ephemeral append-only stream bounded by a time-to-live (`retention.ms`), Kafka is equally capable of acting as an **immutable, distributed materialized key-value changelog**.

Understanding how `cleanup.policy` operates—both at the **cluster-wide broker default layer** and at the **granular per-topic override layer**—is essential for designing reliable Change Data Capture (CDC) pipelines, Kafka Streams state stores, bounded auditing topics, and GDPR-compliant deletion workflows.

---

## The Three Modes of `cleanup.policy`

Kafka provides three distinct cleanup behaviors controlled via the topic-level config `cleanup.policy` (or broker default `log.cleanup.policy`):

| Policy Mode | Mechanism | Data Kept | Target Use Cases |
| :--- | :--- | :--- | :--- |
| `delete` *(Default)* | Time & size-based log truncation | All records whose segment timestamp is within `retention.ms` and partition within `retention.bytes` | High-throughput event streams, raw clickstreams, metric telemetry, immutable audit trails. |
| `compact` | Key-based deduplication | The latest record payload for every unique message key; historical duplicates are garbage-collected | CDC changelog topics (Debezium), Kafka Streams KTable state store changelogs, lookup caches, service configs. |
| `compact,delete` | Hybrid dual retention | The latest record for each key, **provided** the record timestamp is within `retention.ms` | GDPR right-to-be-forgotten pipelines, shopping cart sessions, transient user presence, bounded CDC history. |

---

## Interactive Architecture: Log Cleaner & Retention Engine

<KafkaLogCompactionDiagram />

---

## Broker-Level Defaults vs. Topic-Level Overrides

Retention policies operate in a two-tier hierarchy: **cluster-wide broker configurations** dictate baseline system limits, while **per-topic configurations** allow individual topics to override behaviors.

### Broker-Level Configurations (`server.properties`)

The Kafka broker hosts the background daemon threads responsible for log maintenance: the **Log Retention Check Coordinator** (for `delete`) and the **Log Cleaner Thread Pool** (for `compact`).

```properties
# ==============================================================================
# BROKER-LEVEL DEFAULTS: server.properties / KRaft broker quorum
# ==============================================================================

# Default cleanup policy for newly created topics if not explicitly specified
log.cleanup.policy=delete

# Enable background Log Cleaner threads for log compaction (CRITICAL!)
# If set to false, compact topics will NEVER clean, causing silent disk exhaustion
log.cleaner.enable=true

# Number of background worker threads dedicated to log compaction
# Recommended: 1 thread per 2-4 physical CPU cores or fast NVMe drives
log.cleaner.threads=2

# Total off-heap/direct memory allocated across all cleaner threads for the SkimpyOffsetMap
# Default is 128MB. For millions of unique keys, increase to 512MB-2GB to avoid multi-pass thrashing
log.cleaner.dedupe.buffer.size=134217728

# Broker-wide default time retention (7 days)
log.retention.hours=168
log.retention.check.interval.ms=300000

# Default segment file size (1 GB) and roll time (7 days)
log.segment.bytes=1073741824
log.roll.hours=168
```

### Topic-Level Configurations

Per-topic configurations override broker defaults and are altered dynamically via `kafka-configs.sh` or declarative AdminClient APIs:

```properties
# Topic-level cleanup policy (delete, compact, or "compact,delete")
cleanup.policy=compact,delete

# Minimum ratio of dirty log volume to clean log volume required to trigger compaction
# Default: 0.5 (compaction triggers when uncompacted records comprise 50% of the log)
min.cleanable.dirty.ratio=0.5

# Time to retain tombstone records (null values) before garbage collection (Default: 24 hours)
# Guards lagging consumers against missing key deletions
delete.retention.ms=86400000

# Minimum time a message remains uncompacted in a closed segment
# Prevents compaction of newly written records until consumers have had a chance to read them
min.compaction.lag.ms=0

# Maximum time a message can remain in the dirty log before forced compaction
max.compaction.lag.ms=9223372036854775807

# Active segment rollover triggers (Crucial for low-throughput compacted topics!)
segment.bytes=104857600       # 100 MB
segment.ms=86400000           # Force roll active segment every 24 hours
retention.ms=2592000000       # 30 days retention when using dual policy
```

```bash
# Production topic creation with dual retention policy
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create \
  --topic customer-account-state \
  --partitions 12 \
  --replication-factor 3 \
  --config cleanup.policy=compact,delete \
  --config retention.ms=2592000000 \
  --config min.cleanable.dirty.ratio=0.3 \
  --config delete.retention.ms=86400000 \
  --config segment.ms=86400000
```

---

## Under-the-Hood Engine Mechanics: How Compaction Physically Executes

To understand why compaction behaves the way it does, one must examine Kafka's internal storage engine (`kafka.log.LogCleaner`).

```
Partition Log Directory on Disk:
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     0000000000.log      │  │     0000000050.log      │  │     0000000100.log      │
│     CLEAN SEGMENT       │  │     DIRTY SEGMENT       │  │     ACTIVE SEGMENT      │
│  (Already Compacted)    │  │  (Eligible for Cleaner) │  │  (Receiving New Writes) │
│                         │  │                         │  │                         │
│ Offsets: 0, 12, 19, 48  │  │ Offsets: 50, 51 ... 99  │  │ Offsets: 100, 101 ...   │
└────────────┬────────────┘  └────────────┬────────────┘  └────────────┬────────────┘
             │                            │                            │
             │     Pass 1: Cleaner scans  │                            │
             │     dirty segment and fills│                            │
             │     SkimpyOffsetMap        │                            │
             │                            ▼                            │
             │         ┌─────────────────────────────────┐             │
             │         │   SkimpyOffsetMap (In-Memory)   │             │
             │         │  Key Hash (8B) | Offset (8B)    │             │
             │         │  hash("k1")   -> 95             │             │
             │         │  hash("k2")   -> 88             │             │
             │         └────────────────┬────────────────┘             │
             │                          │                              │
             └───────────────┬──────────┘                              │
                             ▼                                         │
                   Pass 2: Rewrite Segments                            │
                   Retain record IF:                                   │
                   record.offset >= map.get(hash(key))                 │
                             │                                         │
                             ▼                                         │
                   Write to 0000000050.swap                            │
                   Atomic rename to .log                               │
                   Unlink old segment files                            │
                                                                       ▼
                                                       IMMUNE TO COMPACTION!
                                                       Active segment is NEVER
                                                       touched by log cleaner.
```

### 1. Active Segment Immunity
A partition's log is divided into sequential segment files named after their base offset (e.g., `00000000000000000000.log`). The segment currently receiving appends from producers is the **active segment**.
* **Engine Invariant**: The active segment is **strictly immune** to log compaction and log deletion.
* **Why**: Appending writes requires lock-free sequential disk throughput via page cache writeback. Allowing cleaner threads to read and rewrite the active segment would induce lock contention and invalidate OS page cache sequential read-ahead.
* **Consequence**: Data in the active segment is **never deduplicated** until the segment fills to `segment.bytes` or ages past `segment.ms` and rolls into an inactive segment.

### 2. The Clean Head vs. Dirty Tail
Inactive closed segments are partitioned into two logical zones:
1. **Clean Head**: Historical segments that have already undergone at least one compaction pass. All records within the clean head have distinct keys (or tombstones within `delete.retention.ms`).
2. **Dirty Tail**: Closed segments appended after the previous compaction cycle. They contain uncompacted duplicate keys.

The cleaner evaluates the **dirty ratio**:
$$\text{Dirty Ratio} = \frac{\text{Bytes in Dirty Tail}}{\text{Bytes in Clean Head} + \text{Bytes in Dirty Tail}}$$

When $\text{Dirty Ratio} \ge \text{min.cleanable.dirty.ratio}$ (default `0.5`), the cleaner thread selects the partition for a compaction cycle.

### 3. The Two-Pass Compaction Algorithm & `SkimpyOffsetMap`
When a cleaner thread claims a partition, it executes a highly optimized two-pass process:

#### Pass 1: Build Key-to-Offset Index (`SkimpyOffsetMap`)
The cleaner allocates memory from the broker's `log.cleaner.dedupe.buffer.size`. It uses a custom, low-overhead linear-probing off-heap hash map called **`SkimpyOffsetMap`**:
* Each slot consumes exactly **24 bytes**: 8 bytes for the 64-bit MD5 truncated key hash, 8 bytes for the 64-bit log offset, and 8 bytes metadata/hash collision chain.
* The cleaner sequentially reads the dirty segments and populates the map with the **latest offset** observed for every key.
* If `log.cleaner.dedupe.buffer.size` fills before all dirty segments are indexed, the cleaner stops Pass 1 and only compacts the subset of segments it managed to index. This causes compaction thrashing.

#### Pass 2: Filter and Rewrite Segments
The cleaner starts from the oldest clean segment and reads through the dirty segments:
1. For each record, it computes `hash(record.key)` and consults `SkimpyOffsetMap`.
2. **Retention Rule**: If `record.offset < map.get(hash(record.key))`, the record is obsolete and **discarded**. If `record.offset >= map.get(...)`, the record is **retained**.
3. Retained records are written sequentially into a replacement segment file with the `.swap` suffix (e.g., `0000000050.log.swap`).
4. Once written, Kafka executes an atomic OS rename syscall (`rename()`) replacing the old segments with the clean `.swap` segment.
5. The obsolete segment files (`.log`, `.index`, `.timeindex`) are unlinked from the filesystem.

---

## Tombstones & The Tombstone Resurrection Disaster

In a key-value store, updating a key is an append with a new payload. But how does a producer delete a key in an append-only log?

### Tombstone Definition
A **tombstone record** is a message written with a valid message key and a **null payload** (`value = null`):

```java
// Producer writing a tombstone to signal deletion of user-804
ProducerRecord<String, String> tombstone = 
    new ProducerRecord<>("user-profiles", "user-804", null);
producer.send(tombstone).get();
```

### The Tombstone Lifecycle
```
Time ─────────────────────────────────────────────────────────────────────────────►
Producer sends:      Live Consumer reads:     delete.retention.ms      Cleaner GC:
Key="k1", Val=null   Key="k1", Val=null       elapses (e.g., 24h)      Tombstone itself
(Tombstone written)  (Deletes from cache)     (Grace period)           is purged from log
```

1. **Emission**: The tombstone is appended to the active segment.
2. **Consumption**: Online consumers reading the partition detect `value == null` and remove the entity from their local caches, relational database read models, or RocksDB state stores.
3. **Preservation Window (`delete.retention.ms`)**: During compaction passes, the cleaner thread discards all prior versions of `k1`. However, the cleaner **must retain the tombstone itself** for at least `delete.retention.ms` (default 24 hours).
4. **Purge**: After `delete.retention.ms` has elapsed AND all clean segments preceding the tombstone have been cleaned, the cleaner discards the tombstone record during the next cycle. The key is now completely gone from disk.

### ⚠️ The Tombstone Resurrection Disaster
What happens if a downstream consumer group goes offline for 48 hours during an incident?

1. At $T_0$, an account is deleted. A tombstone is published.
2. Consumer $C_1$ is down or suffering from severe lag.
3. At $T_{24h}$, `delete.retention.ms` expires. The broker log cleaner runs and purges the tombstone from disk.
4. At $T_{48h}$, consumer $C_1$ recovers and resumes processing.
5. If consumer $C_1$ rebuilds state by replaying from an older snapshot or an external mirror that retained prior records, **the deletion signal is gone**. The consumer never encounters the tombstone and **resurrects the deleted entity**!

> **Principal Rule**: Ensure `delete.retention.ms` is set to exceed your maximum tolerable consumer lag and disaster recovery RTO (e.g., 7 days: `delete.retention.ms=604800000`).

---

## The Null-Key Hazard in Compacted Topics

A classic production failure occurs when developers publish records without keys (`key = null`) to a compacted topic.

* **Under-the-hood reality**: The `SkimpyOffsetMap` indexes records strictly by `hash(key)`. If `record.key == null`, the cleaner **cannot hash the key** and **cannot deduplicate the record**.
* **Behavior**: Unkeyed records are skipped by the cleaner and retained **indefinitely**.
* **Impact**: If an application erroneously emits high-volume heartbeats or unkeyed metrics to a `cleanup.policy=compact` topic, disk utilization climbs monotonically towards 100%, and compaction will **never** reclaim that disk space!

---

## Dual Retention Policy: `cleanup.policy=compact,delete`

Many modern microservice architectures require bounded storage for compacted data. A prime example is **GDPR compliance**: user profile updates must be compacted, but inactive profiles must be purged after 90 days.

```properties
cleanup.policy=compact,delete
retention.ms=7776000000       # 90 days
segment.ms=86400000           # 24 hours
```

### Execution Order & Interaction
When both policies are specified:
1. **Compaction Runs First**: The Log Cleaner thread identifies duplicate keys in closed segments and rewrites them into compacted segments, minimizing file size.
2. **Time/Size Retention Runs Second**: The Log Retention Check Coordinator evaluates each closed segment. If the **maximum record timestamp** in a segment is older than `retention.ms` (or the partition exceeds `retention.bytes`), the entire segment is unlinked.

---

## Critical Production Failure Scenarios & Runbooks

| Failure Scenario | Root Cause | Observable Symptom | Mitigation & Runbook |
| :--- | :--- | :--- | :--- |
| **Dead Cleaner Thread (`DeadThreadCount > 0`)** | Corrupt message payload, schema deserialization crash, or unhandled exception in cleaner thread. | JMX `kafka.log.LogCleaner:DeadThreadCount = 1`. Dirty ratio climbs to 100%. Disk space drops rapidly. | Inspect broker logs for `FATAL ERROR in cleaner thread`. Restart the broker or trigger partition leader election. Verify `log.cleaner.threads >= 2`. |
| **Active Segment Starvation** | Topic has low message velocity; `segment.bytes=1GB` default is never reached, and `segment.ms` is not configured. | Compaction never runs (`Dirty Ratio = 0`). Historical duplicates accumulate indefinitely in the active segment. | Configure `segment.ms=86400000` (24h) or `segment.bytes=104857600` (100MB) on the topic to force regular rollover. |
| **SkimpyOffsetMap Thrashing** | High cardinality of unique keys exceeds memory allocated by `log.cleaner.dedupe.buffer.size`. | Compaction CPU spikes; cleaner takes multiple passes to clean a single segment. JMX `cleaner-recopy-percent` increases. | Increase broker `log.cleaner.dedupe.buffer.size` from 128MB to 512MB or 1GB. Increase `log.cleaner.threads`. |
| **Tombstone Resurrection** | Consumer offline or lagged longer than `delete.retention.ms` (default 24h). | Deleted entities reappear in downstream read models or cache stores after consumer catch-up. | Set `delete.retention.ms` $\ge$ maximum consumer outage SLA (e.g. 7 days: `604800000`). |
| **Unkeyed Record Disk Exhaustion** | Producer published records with `key = null` to a topic with `cleanup.policy=compact`. | Disk space grows linearly. `kafka-log-dirs.sh` shows partition size growing despite compaction running. | Fix producer serialization logic to require non-null keys. Alter topic to `cleanup.policy=compact,delete` temporarily to purge unkeyed records. |

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Cleanup Policy & Log Compaction Interviews

### The Senior Framing Strategy (First 60 Seconds)

When an interviewer asks: *"How does Kafka handle log retention, and how does log compaction work under the hood?"*, distinguish yourself immediately from mid-level engineers who merely recite: *"Delete drops old data by time, and compact keeps the latest key"*. Frame the problem through **storage engine mechanics, memory layout, and failure modes**:

> *"In Kafka, `cleanup.policy` dictates whether partition log segments are treated as temporal streams (`delete`), stateful key-value tables (`compact`), or hybrid bounded changelogs (`compact,delete`).
> 
> As an architect, I evaluate four non-negotiable physical constraints:
> 1. **Active Segment Immunity**: The active segment receiving appends is strictly immune to compaction, meaning `segment.ms` and `segment.bytes` govern the lower bound of compaction latency.
> 2. **Off-Heap Key Indexing**: Cleaner threads rely on `SkimpyOffsetMap`—a 24-byte open-addressing hash table in direct memory. Its size (`log.cleaner.dedupe.buffer.size`) determines whether compaction cleans dirty segments in a single pass or degenerates into multi-pass IO thrashing.
> 3. **Tombstone Deletion Semantics**: Deleting a key requires publishing an explicit tombstone (`value=null`). Its survival window (`delete.retention.ms`) must strictly exceed consumer lag SLAs to prevent silent state resurrection.
> 4. **Key Invariant**: Records with null keys can never be compacted. In a compaction-only topic, unkeyed records cause unbounded disk growth."*

---

### Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Why did our compacted topic run out of disk space even though we only have 10,000 distinct customer keys?"
* **Mid-Level Candidate:** *"Maybe the cleaner thread hasn't run yet, or the dirty ratio threshold hasn't been met."*
* **Principal Rebuttal:** *"There are two primary architectural culprits:
  1. **Null Keys in the Log**: If upstream producers accidentally published telemetry or heartbeat records without keys (`key=null`), `SkimpyOffsetMap` cannot index them. The cleaner thread skips unkeyed records, and they remain in the log permanently.
  2. **Active Segment Starvation**: If write throughput is low and `segment.bytes` is left at the 1GB default without configuring `segment.ms`, all records reside in the active segment. Because the active segment is immune to cleaner threads, compaction never runs until the 1GB threshold is reached. The fix is setting `segment.ms=86400000` (24h) and ensuring strict key validation in the producer serializer."*

#### Trap 2: "Can `cleanup.policy=delete` and `cleanup.policy=compact` be used together on the same topic?"
* **Mid-Level Candidate:** *"No, they are mutually exclusive. You either compact or delete."*
* **Principal Rebuttal:** *"Yes, Kafka explicitly supports `cleanup.policy=compact,delete` (or `[compact, delete]`). Under this dual policy, the broker executes both the Log Cleaner thread and the Log Retention Check Coordinator.
  The cleaner thread deduplicates older closed segments by key, and the retention coordinator purges closed segments once their newest record timestamp exceeds `retention.ms`. This is the gold-standard architecture for GDPR compliance (Right to Be Forgotten) and bounded session state where you want latest-value deduplication while ensuring inactive keys age out after 30 to 90 days."*

#### Trap 3: "A consumer service was halted for 36 hours for an emergency database migration. After catching up, previously deleted user records reappeared in PostgreSQL. What happened?"
* **Mid-Level Candidate:** *"The consumer probably experienced an offset reset to `earliest`."*
* **Principal Rebuttal:** *"This is the classic **Tombstone Resurrection Disaster**. When a user was deleted, a tombstone (`value=null`) was appended to the topic. By default, `delete.retention.ms` is 24 hours.
  Because the consumer was down for 36 hours, the cleaner thread reached the tombstone, observed that `delete.retention.ms` had elapsed and all prior clean segments were compacted, and purged the tombstone from the log segment. When the lagging consumer resumed, the tombstone was gone. If the consumer re-read older segments or restored from a stale database replica, it never received the deletion event, permanently resurrecting the deleted state. The operational fix is configuring `delete.retention.ms` to exceed maximum consumer recovery SLAs (e.g., 7 days)."*

#### Trap 4: "Why did cleaner threads across the cluster die silently (`DeadThreadCount > 0`), causing disk space alarms to fire?"
* **Mid-Level Candidate:** *"The broker ran out of disk space or memory."*
* **Principal Rebuttal:** *"In Kafka, an uncaught exception in `kafka.log.LogCleaner` permanently kills the cleaner thread without terminating the broker process. Common triggers include:
  1. **Message Corruptions / Checksum Failures**: Bitrot or corrupt CRC records in older segments cause the cleaner thread's decompression reader to throw an unhandled exception.
  2. **Schema Registry Evolution Errors**: If an SMT or cleaner process attempts to deserialize invalid Avro/Protobuf records.
  3. **JVM Direct Memory Exhaustion**: If `log.cleaner.dedupe.buffer.size` is over-allocated relative to `-XX:MaxDirectMemorySize`.
  Once dead, the broker stops compacting, dirty ratios climb to 1.0, and disks fill. Production monitoring must alert on JMX `kafka.log.LogCleaner:name=DeadThreadCount,type=LogCleaner` with severity P1."*

#### Trap 5: "If we produce a tombstone (`value=null`) to delete a key, why doesn't disk space decrease immediately?"
* **Mid-Level Candidate:** *"Because Kafka uses asynchronous deletion in the background."*
* **Principal Rebuttal:** *"Four sequential physical conditions must be met before disk space is reclaimed:
  1. **Active Segment Rollover**: The tombstone must move from the active segment into a closed segment via `segment.bytes` or `segment.ms`.
  2. **Dirty Ratio Trigger**: The partition's uncompacted dirty tail must reach `min.cleanable.dirty.ratio` (default 50%) to schedule cleaner execution.
  3. **Tombstone Retention Grace Period**: The cleaner retains the tombstone for `delete.retention.ms` (24h) to protect consumers.
  4. **Clean Segment Precondition**: The tombstone can only be purged once **all** clean segments preceding it have been compacted and do not contain older instances of that key. Only then is the `.swap` file written and the old segment unlinked from the filesystem."*

---

### Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Compaction Trigger** | *"Kafka compacts whenever a new message with the same key arrives."* | *"Compaction is a background batch process triggered when $\text{Dirty Ratio} \ge \text{min.cleanable.dirty.ratio}$ on closed segments. The active segment is strictly immune."* |
| **Deleting Keys** | *"You just delete the record from the topic."* | *"Kafka logs are append-only; deletion requires emitting a tombstone record (`key=k, value=null`). The cleaner retains the tombstone for `delete.retention.ms` before garbage collection."* |
| **Cleaner Memory Footprint** | *"Compaction uses Java Heap memory to track keys."* | *"Cleaner threads allocate off-heap memory via `SkimpyOffsetMap`, a linear-probing 24-byte-per-slot direct buffer mapping 64-bit MD5 key hashes to 64-bit offsets."* |
| **Combining Retention Modes** | *"You have to choose between time retention and key compaction."* | *"You configure `cleanup.policy=[compact, delete]` where compaction deduplicates within closed segments, and retention check threads unlink segments older than `retention.ms`."* |
| **Unkeyed Records** | *"Kafka treats records without keys as key=null and compacts them together."* | *"Unkeyed records cannot be hashed in `SkimpyOffsetMap` and are permanently bypassed by the cleaner, causing fatal unbounded disk leaks in compact-only topics."* |
| **Low-Throughput Topics** | *"Compaction keeps disk usage minimal for small topics."* | *"Small topics suffer from Active Segment Starvation. Without tuning `segment.ms`, records stay in the active segment indefinitely and are never compacted."* |

---

## Production Sizing & SRE Checklist for `cleanup.policy`

- [ ] **Broker `log.cleaner.enable=true`**: Verified enabled cluster-wide in `server.properties`.
- [ ] **Cleaner Thread Pool Sizing**: Configured `log.cleaner.threads` proportional to broker NVMe disk count (typically 2–4).
- [ ] **`SkimpyOffsetMap` Sizing**: Sized `log.cleaner.dedupe.buffer.size` to hold all unique keys during dirty periods:
  $$\text{Buffer Size} \ge (\text{Max Unique Keys in Dirty Log}) \times 24 \text{ bytes} \times 1.5 \text{ (load factor)}$$
- [ ] **Active Segment Rollover Tuning**: Compacted topics configure `segment.ms=86400000` (1 day) or `segment.bytes=104857600` (100MB) to prevent active segment starvation.
- [ ] **Tombstone Grace Window**: `delete.retention.ms` configured to $\ge 7$ days (`604800000`) on business-critical state topics to eliminate tombstone resurrection during consumer outages.
- [ ] **Dead Thread Alerting**: P1 Prometheus/Datadog alert on `kafka.log.LogCleaner:DeadThreadCount > 0`.
- [ ] **Key Validation Guard**: Producer pipelines strictly validate `record.key != null` for all topics where `cleanup.policy=compact`.
- [ ] **Dual Retention for Ephemeral State**: User session and cart topics configured with `cleanup.policy=compact,delete` and explicit `retention.ms`.

---

## Related Documentation

- [Kafka Topic & Partition Internals](../core/topic.md) — Partitioning strategies, segment files, and replication fundamentals.
- [Kafka Broker Architecture](../core/broker.md) — Page Cache, zero-copy `sendfile()`, and storage subsystem.
- [Kafka Streams State Stores & RocksDB](../streams/state-stores-rocksdb.md) — How KTables and stateful streams depend on compacted changelog topics.
- [Kafka Monitoring & Operations](./monitoring-operations.md) — JMX metrics, cleaner lag monitoring, and cluster reliability.
