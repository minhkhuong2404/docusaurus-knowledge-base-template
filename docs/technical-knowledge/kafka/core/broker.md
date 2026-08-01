---
id: kafka-broker
title: Kafka Broker — Complete Guide
sidebar_label: Kafka Broker
description: A complete guide to Kafka brokers — what they are, how storage works, partition leadership, replication, ISR, KRaft vs ZooKeeper, log compaction, performance internals, and production monitoring. Beginner through senior depth.
tags: [kafka, broker, distributed-systems, messaging, replication, isr, kraft, log-compaction, partition, performance]
sidebar_position: 2
---

import KafkaBrokerStorageDiagram from '@site/src/components/KafkaBrokerStorageDiagram';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Kafka Broker — Complete Guide

<KafkaBrokerStorageDiagram />

---

:::info[Who this guide is for]
- **New learners** — start at [What is Kafka?](#what-is-kafka) and [What is a Broker?](#what-is-a-broker) to understand the foundational model before diving into storage and replication.
- **Senior engineers** — jump to [Replication & ISR](#replication--isr), [Broker Internals](#broker-internals), [KRaft vs ZooKeeper](#kraft-vs-zookeeper), [Log Compaction](#log-retention-and-compaction), or [Performance Tuning](#performance-tuning).
:::

---

## What is a Kafka Broker?

A **Kafka Broker** is a dedicated server process executing within an Apache Kafka cluster. The broker's primary duty is to receive incoming event streams from producers, append them to sequential partition log segment files on disk, serve messages to consumer groups, manage data replication across cluster nodes, and maintain cluster metadata state.

### Broker Responsibilities

| Responsibility | Architectural Mechanism |
|---------------|-------------|
| **Message Storage** | Appends incoming record batches to append-only `.log` segment files on disk. |
| **Partition Leadership** | Handles 100% of producer writes and consumer reads for its assigned leader partitions. |
| **Data Replication** | Fetches records from leader partitions as a follower to maintain configured Replication Factors. |
| **Offset Management** | Manages consumer group commit offsets inside the internal `__consumer_offsets` system topic. |
| **Metadata Coordination** | Communicates with the cluster Controller node (via KRaft or ZooKeeper) to manage topology changes. |

---

## Core Broker Storage Engine Internals

Kafka stores partition records on disk in dedicated topic-partition directories (`/var/lib/kafka/data/<topic>-<partition_id>/`). Each partition directory contains a sequence of **Log Segments**:

```
/var/lib/kafka/data/orders-0/
├── 00000000000000000000.log         # Raw binary RecordBatches
├── 00000000000000000000.index       # Sparse offset -> physical position index
├── 00000000000000000000.timeindex   # Timestamp -> offset index
├── 00000000000000001048.log         # Active segment currently accepting writes
├── 00000000000000001048.index
└── leader-epoch-checkpoint          # Tracks leader epoch history for fencing
```

1. **Segment Log (`.log`)**: Stores serialized Kafka `RecordBatch` structures containing payloads, headers, timestamps, and sequence numbers.
2. **Offset Index (`.index`)**: A sparse index mapping logical record offsets to exact physical byte positions inside the `.log` file. Instead of indexing every record, Kafka inserts an entry every $4\text{ KB}$ (`index.interval.bytes`).
3. **Time Index (`.timeindex`)**: Maps timestamps to logical offsets, supporting time-based consumer seeking (`KafkaConsumer.offsetsForTimes()`).

---

## KRaft (Kafka Raft) Metadata Architecture

Historically, Kafka relied on external **Apache ZooKeeper** clusters for metadata storage and active controller elections.

```
Legacy ZooKeeper Mode:                    Modern KRaft Mode (Kafka 3.3+):
+--------------------+                    +------------------------------------+
|  ZooKeeper Quorum  |                    |  Active KRaft Controller Broker    |
| (External 3 nodes) |                    |  - Stores __cluster_metadata Log   |
+---------+----------+                    +-----------------+------------------+
          |                                                 |
          v                                                 v  Quorum Replication
+--------------------+                    +-----------------+------------------+
|  Kafka Controller  |                    |  Broker 2       | Broker 3         |
|  (Broker Node 1)   |                    |  (Controller)   | (Controller)     |
+--------------------+                    +-----------------+------------------+
```

### Why ZooKeeper Was Removed
- **Scale Limit**: ZooKeeper capped total cluster partition counts at $\approx 200,000$ due to znode memory and watch notification overhead.
- **Failover Latency**: When a Controller broker crashed, electing a new Controller and repopulating metadata took $15\text{--}30\text{ seconds}$.
- **KRaft Advantage**: Stores metadata directly in a specialized internal partition (`__cluster_metadata`). KRaft Controller failovers execute in sub-second timeframes, supporting clusters with over $1,000,000$ partitions.

---

## Performance Mechanics: Why Kafka is Fast

<details>
<summary>🔬 Senior deep-dive: Page Cache and Zero-Copy System Calls</summary>

### 1. Sequential Disk I/O
Kafka performs append-only sequential writes to log segments. Sequential disk throughput ($100\text{--}500\text{ MB/sec}$) approaches raw disk hardware limits because physical disk heads eliminate seek times.

### 2. OS Page Cache Utilization
Kafka does not cache messages inside the JVM heap. Instead, writes go directly into the Linux OS **Page Cache** in kernel RAM. Recent records are read directly from RAM by consumers without touching physical disk.

### 3. Zero-Copy `sendfile()` Syscall
When a consumer requests data, the broker executes `FileChannel.transferTo()`, invoking the Linux `sendfile()` syscall. The OS kernel transfers data bytes directly from the Page Cache to the NIC buffer via DMA (Direct Memory Access), eliminating JVM heap memory copying and user/kernel context switches.

```
Traditional I/O (4 Copies, 4 Context Switches):
Disk -> Page Cache -> JVM Heap Buffer -> Socket Buffer -> NIC

Zero-Copy sendfile() (0 User Copies, 2 Context Switches):
Disk -> Page Cache ======================================> NIC
```

</details>

---

## Monitoring & Observability Matrix

| Metric | Target Value | Alert Condition | Operational Meaning |
|--------|:------------:|----------------|--------------|
| `UnderReplicatedPartitions` | `0` | **$> 0$** | Partitions have lost ISR members — data loss risk. |
| `ActiveControllerCount` | `1` | **$\neq 1$** | Cluster has no controller or is in split-brain state. |
| `OfflinePartitionsCount` | `0` | **$> 0$** | Partitions have no active leader — reads/writes failing. |
| `BytesInPerSec` | Nominal baseline | Approaching NIC bandwidth | Network ingress saturation. |
| `RequestHandlerAvgIdlePercent` | $> 50\%$ | **$< 30\%$** | Broker handler thread pool is exhausted. |

---

## Common Failure Scenarios

| Failure | Root Cause | Remediation |
|---|---|---|
| **Broker OOM Kill** | JVM heap sized too large, starving OS Page Cache and native memory. | Cap JVM heap at $6\text{ GB}$ (`-Xmx6g`); reserve remaining host RAM for Linux Page Cache. |
| **ISR Flapping** | Replica network lag or G1GC pauses exceeding `replica.lag.time.max.ms`. | Tune G1GC pause targets (`-XX:MaxGCPauseMillis=20`) and check disk latency (`iostat -xz 1`). |
| **Unclean Leader Election Data Loss** | Out-of-sync follower elected as leader when all ISR members crash. | Set `unclean.leader.election.enable=false` in production. |

---

## Interview Questions

### Q1. What is a Kafka broker and what are its primary responsibilities?
> A Kafka broker is a single server node running the Kafka process. Its duties include: appending records to sequential partition log segment files on disk, serving fetch requests from consumers, executing follower replication from leader brokers, and storing consumer group offsets in the `__consumer_offsets` topic.

### Q2. What is the In-Sync Replicas (ISR) set and why is it critical for consistency?
> The ISR set consists of all partition replicas (leader + followers) currently caught up with the leader within `replica.lag.time.max.ms`. When a producer writes with `acks=all`, the leader waits for acknowledgements from all current ISR members before returning success. If the leader fails, only an ISR member is eligible for leader election, guaranteeing zero data loss.

### Q3. How does Zero-Copy data transfer work in Kafka?
> Zero-Copy leverages the Linux `sendfile()` system call (exposed via Java's `FileChannel.transferTo()`). Data stored in the OS Page Cache is transferred directly to the Network Interface Card (NIC) buffer via Direct Memory Access (DMA), bypassing the JVM heap and eliminating user-kernel context switches.

### Q4. What is the difference between `log.retention.hours` (deletion) and `log.cleanup.policy=compact`?
> Log deletion (`delete`) purges old log segments once they exceed time or size thresholds. Log compaction (`compact`) retains the single latest record payload for every message key indefinitely while deleting earlier historical updates for that key. Compaction is ideal for event-sourced state and lookup changelogs.

---

## See Also

- [KRaft vs ZooKeeper](./kraft-vs-zookeeper.md)
- [Kafka Replication & ISR](./replication.md)
- [Kafka Topic & Partition Scaling](./scaling-partitions.md)
