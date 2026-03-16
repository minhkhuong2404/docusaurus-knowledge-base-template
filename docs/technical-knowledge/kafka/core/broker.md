---
id: broker
title: Kafka Broker
sidebar_label: Broker
---

# Kafka Broker

## What is a Broker?

A **broker** is a single Kafka server. It receives messages from producers, stores them on disk, and serves them to consumers. A Kafka **cluster** consists of multiple brokers working together.

```
Kafka Cluster
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Broker 1  │  │  Broker 2  │  │  Broker 3  │
│ (leader P0)│  │ (leader P1)│  │ (leader P2)│
│ (follower) │  │ (follower) │  │ (follower) │
└────────────┘  └────────────┘  └────────────┘
```

Each broker is identified by a unique `broker.id` integer.

---

## Broker Responsibilities

| Responsibility | Details |
|---|---|
| **Message storage** | Appends to segment files on disk |
| **Partition leadership** | Handles all reads/writes for its leader partitions |
| **Replication** | Replicates data to/from follower partitions |
| **Consumer offset management** | Stores offsets in `__consumer_offsets` topic |
| **Cluster metadata** | Registers itself in ZooKeeper or KRaft |

---

## Broker Storage Layout

Kafka stores data as **segment files** on disk:

```
/var/kafka/logs/
  orders-0/                   ← Topic "orders", Partition 0
    00000000000000000000.log  ← Segment file (messages)
    00000000000000000000.index← Offset index
    00000000000000000000.timeindex ← Timestamp index
  orders-1/
    ...
```

Each segment file has a configurable max size (default 1 GB) or time (default 7 days). Old segments are deleted or compacted based on cleanup policy.

---

## Controller Broker

Among all brokers, one is elected as the **Controller**. It's responsible for:

- Electing partition leaders
- Handling broker join/leave events
- Managing partition reassignment

In KRaft mode, controller functions are dedicated to a quorum of controller nodes (can overlap with broker roles in combined mode).

---

## Bootstrap Servers

`bootstrap.servers` is the entry point for clients. You only need to list a few brokers — Kafka clients will discover the full cluster from them:

```properties
bootstrap.servers=broker1:9092,broker2:9092,broker3:9092
```

:::tip
You don't need all brokers listed. Just enough for fault tolerance during initial connection.
:::

---

## Key Broker Configurations

```properties
# Unique broker identifier
broker.id=1

# Storage directory for logs
log.dirs=/var/kafka/logs

# Default number of partitions for new topics
num.partitions=3

# Default replication factor
default.replication.factor=3

# Message retention (7 days)
log.retention.hours=168

# Segment size (1 GB)
log.segment.bytes=1073741824

# Max message size
message.max.bytes=1048576

# Network threads
num.network.threads=3

# I/O threads
num.io.threads=8
```

---

## Broker Health & Metrics

Key JMX metrics to monitor:

| Metric | What it tells you |
|---|---|
| `UnderReplicatedPartitions` | Partitions not fully replicated — sign of trouble |
| `ActiveControllerCount` | Should be exactly 1 across the cluster |
| `OfflinePartitionsCount` | Must be 0 in a healthy cluster |
| `BytesInPerSec` / `BytesOutPerSec` | Throughput per broker |
| `RequestHandlerAvgIdlePercent` | Low values = broker under load |

---

## Interview Questions — Broker

**Q: What happens when a Kafka broker goes down?**

> The Controller detects the broker's disappearance via ZooKeeper session expiry (or KRaft heartbeat). For each partition where the failed broker was the leader, the Controller elects a new leader from the ISR (In-Sync Replicas). Producers and consumers reconnect automatically via metadata refresh. If the broker was not in the ISR for some partitions, those partitions may become temporarily unavailable.

**Q: What is the role of the Controller broker?**

> The Controller is a special broker that manages cluster metadata operations: it elects partition leaders, handles broker join/failure events, and manages replica assignment. There is always exactly one active Controller. In KRaft mode, controller duties are handled by a dedicated quorum using the Raft consensus algorithm.

**Q: How does Kafka achieve durability at the broker level?**

> Kafka uses sequential disk I/O and OS page cache for fast writes. Durability is achieved through replication — with `acks=all` and appropriate `min.insync.replicas`, a message is only acknowledged after it has been written to all in-sync replicas. The OS `fsync` is typically not called per-message for performance; instead, replication itself is the durability mechanism.

**Q: What is `log.retention.bytes` vs `log.retention.hours`?**

> `log.retention.hours` (default 168 = 7 days) controls time-based retention — segments older than this are deleted. `log.retention.bytes` controls size-based retention — if the log size exceeds this, old segments are deleted. When both are set, whichever limit is hit first triggers deletion.

**Q: What is log compaction?**

> Log compaction (`cleanup.policy=compact`) retains the **latest value per key** indefinitely, deleting older records with the same key. This is ideal for changelog or state-store topics where only the latest state per entity matters. It guarantees that a consumer can always reconstruct the current state by reading from the beginning. Regular topics use `cleanup.policy=delete`.
