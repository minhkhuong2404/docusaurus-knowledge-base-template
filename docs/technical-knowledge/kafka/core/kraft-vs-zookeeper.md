---
id: kraft-vs-zookeeper
title: "KRaft vs ZooKeeper: Kafka Metadata Architecture"
sidebar_label: KRaft vs ZooKeeper
description: A comprehensive guide comparing Apache Kafka's legacy ZooKeeper architecture with the modern KRaft (Kafka Raft) metadata mode — covering internal mechanics, failure scenarios, migration strategies, and production deep dives for senior engineers.
tags:
  - kafka
  - architecture
  - kraft
  - zookeeper
  - distributed-systems
  - consensus
  - raft
  - system-design
---

import KraftVsZookeeperDiagram from '@site/src/components/KraftVsZookeeperDiagram';

# KRaft vs ZooKeeper: Kafka Metadata Architecture

<KraftVsZookeeperDiagram />

---

> Apache Kafka relied on **Apache ZooKeeper** for over a decade to manage cluster metadata, broker registration, and leader election. Starting with KIP-500, Kafka introduced **KRaft (Kafka Raft Metadata mode)** — replacing ZooKeeper with an internal Raft-based consensus protocol. As of Kafka 3.3, KRaft is production-ready. ZooKeeper mode is officially deprecated and was **removed in Kafka 4.0**.

Understanding this architectural shift is essential for senior backend engineers: it demonstrates fundamental distributed systems principles including consensus protocols, split-brain fencing, event-sourced metadata logs, and zero-downtime control plane migration.

:::info[Who this guide is for]
- **New learners** — start at [The City Hall Analogy](#-the-city-hall-analogy) and [How ZooKeeper Works](#1-the-legacy-architecture-kafka-with-zookeeper).
- **Senior engineers** — jump to [Raft Consensus Deep Dive](#3-the-raft-consensus-protocol-how-kraft-achieves-agreement), [Failure Scenario Comparison](#4-failure-scenario-walkthrough), [Migration Strategy](#migrating-from-zookeeper-to-kraft), or [Production Configuration](#production-configuration--tuning).
:::

---

## 👶 The City Hall Analogy

**ZooKeeper Mode — The External Registry:**
Imagine a city where official records (property deeds, business licenses) are kept in an **external building across town** (ZooKeeper). The mayor (Active Controller Broker) manages the city, but whenever they query records, they must travel across town to read ZNode trees. When the mayor steps down, the new mayor must travel to the registry and read *all* city records from scratch before executing a single transaction.

**KRaft Mode — The Internal Ledger:**
The city maintains an **internal master ledger** (the `__cluster_metadata` topic). Every metadata change is an event appended to a Raft log replicated among council members (Controller Quorum). When the mayor steps down, standby council members already possess an up-to-date in-memory copy of every record — allowing a new mayor to take office in milliseconds.

---

## 1. Legacy Architecture: Kafka with ZooKeeper

### What ZooKeeper Stored
In ZooKeeper mode, cluster metadata lived in hierarchical ZNodes:
- `/brokers/ids/[broker_id]`: Ephemeral ZNodes representing active brokers.
- `/brokers/topics/[topic_name]/partitions/[partition_id]/state`: Stores leader ID, ISR list, and leader epoch.
- `/controller`: Ephemeral ZNode created by the single active Controller broker.
- `/controller_epoch`: Monotonically increasing integer preventing split-brain execution.

```
ZooKeeper ZNode Tree Layout:
/
├── brokers
│   ├── ids
│   │   ├── 1  (ephemeral)
│   │   └── 2  (ephemeral)
│   └── topics
│       └── orders
│           └── partitions
│               └── 0
│                   └── state -> {"leader": 1, "isr": [1, 2], "leader_epoch": 3}
└── controller -> {"brokerid": 1, "timestamp": 1620000000}
```

### Why ZooKeeper Was Deprecated
1. **Double System Overhead**: Operating two independent distributed systems (Kafka + ZooKeeper), two JVM runtimes, and two security configurations.
2. **Metadata Scale Ceiling**: Partition counts were capped at $\approx 200,000$ per cluster because ZooKeeper watch notifications saturated controller CPU.
3. **High Failover Latency**: When a Controller broker crashed, the newly elected Controller had to read the entire ZNode tree from ZooKeeper before handling requests, freezing metadata operations for $15\text{--}30\text{ seconds}$.

---

## 2. Modern Architecture: KRaft (Kafka Raft)

In KRaft mode, metadata is stored as event records in an internal log (`__cluster_metadata`) managed by an internal Raft controller quorum.

```
KRaft Controller Quorum (Raft Replication):
+-----------------------------------------------------------------+
|  Active Controller (Node 1) -- Writes __cluster_metadata Log   |
+--------------------------------+--------------------------------+
                                 | Raft Consensus
                                 v
+--------------------------------+--------------------------------+
| Standby Controller (Node 2)    | Standby Controller (Node 3)    |
+--------------------------------+--------------------------------+
                                 | In-Memory Push Streaming
                                 v
+-----------------------------------------------------------------+
|  Broker Nodes (Nodes 4, 5, 6) -- Active Metadata Observers      |
+-----------------------------------------------------------------+
```

### Key Differences Comparison

| Feature | ZooKeeper Mode (Legacy) | KRaft Mode (Modern Kafka 3.3+) |
|---|---|---|
| **External Dependency** | Requires 3–5 node ZooKeeper cluster. | None (100% native Kafka process). |
| **Max Partition Limit** | $\approx 200,000$ partitions. | $> 1,000,000$ partitions. |
| **Controller Failover Time** | $15\text{--}30\text{ seconds}$ (ZNode re-reading). | $< 200\text{ ms}$ (in-memory state ready). |
| **Metadata Storage** | ZooKeeper Memory ZNode tree. | Event-sourced `__cluster_metadata` topic. |
| **Metadata Distribution** | Push RPCs from Controller to Brokers. | Streaming consumer pull by Brokers from Metadata topic. |

---

## 3. KRaft Metadata Snapshots (`.checkpoint`)

To prevent the `__cluster_metadata` topic from growing indefinitely, KRaft periodically creates **Metadata Snapshots**:

1. The Active Controller serializes its complete in-memory cluster metadata tree to a `.checkpoint` snapshot file.
2. When a new or offline broker starts, it loads the latest `.checkpoint` file into RAM in milliseconds, then consumes only recent log records appended after the snapshot timestamp.

```bash
# Diagnostic inspection of KRaft metadata snapshot
kafka-metadata-shell.sh \
  --snapshot /var/lib/kafka/data/__cluster_metadata-0/00000000000100000-0000002468.checkpoint
```

---

## 4. Production KRaft Configuration (`KAFKA_PROCESS_ROLES`)

In production environments, assign explicit process roles using `process.roles`:

```properties
# Node 1 (Dedicated KRaft Controller)
process.roles=controller
node.id=1
controller.quorum.voters=1@controller1.example.com:9093,2@controller2.example.com:9093,3@controller3.example.com:9093
listeners=CONTROLLER://controller1.example.com:9093

# Node 4 (Dedicated Data Broker)
process.roles=broker
node.id=4
controller.quorum.voters=1@controller1.example.com:9093,2@controller2.example.com:9093,3@controller3.example.com:9093
listeners=PLAINTEXT://broker4.example.com:9092
```

---

## Interview Questions

### Q1. Why did Apache Kafka deprecate ZooKeeper and transition to KRaft?
> ZooKeeper created three major bottlenecks: (1) **Operational Complexity** — requiring two separate distributed systems and JVM runtimes; (2) **Scale Limits** — ZooKeeper watch notifications capped cluster partition counts at $\approx 200,000$; (3) **Failover Latency** — when a Controller failed, the newly elected Controller had to re-read the entire ZNode tree from ZooKeeper, freezing metadata operations for up to 30 seconds. KRaft stores metadata in a native Raft-replicated log, supporting over 1,000,000 partitions with sub-second Controller failovers.

### Q2. How does KRaft prevent split-brain Controller scenarios?
> KRaft uses the **Raft Consensus Protocol** with strict Leader Epoch (Term) fencing. When a new Controller leader is elected by a majority quorum vote ($F+1$ out of $2F+1$ nodes), it increments the `LeaderEpoch`. Any RPCs issued by a stale, isolated former Controller containing a lower epoch number are rejected by all brokers and quorum members.

### Q3. How do Kafka data brokers stay updated with cluster metadata changes in KRaft mode?
> Data brokers act as active metadata consumers. They establish a continuous streaming connection to the active KRaft Controller, fetching records from the `__cluster_metadata` topic. Brokers apply metadata updates locally to maintain an up-to-date in-memory routing table, eliminating Controller-to-broker push RPC storms.

---

## See Also

- [Kafka Broker Architecture](./broker.md)
- [Raft Consensus Deep Dive](./raft-consensus.md)
- [Kafka Topic Architecture](./topic.md)
