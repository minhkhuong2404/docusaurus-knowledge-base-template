---
id: kraft-vs-zookeeper
title: KRaft vs ZooKeeper
sidebar_label: KRaft vs ZooKeeper
description: A deep dive comparison between Apache Kafka's legacy ZooKeeper architecture and the modern KRaft (Kafka Raft) metadata quorum mode.
tags:
  - technical-knowledge
  - kafka
  - core
  - architecture
  - kraft
  - zookeeper
---

# KRaft vs ZooKeeper: Deep Dive Comparison

For a long time, Apache Kafka relied on **Apache ZooKeeper** to manage cluster metadata, leader election, and broker registration. Starting in KIP-500, Kafka introduced **KRaft (Kafka Raft Metadata mode)** to remove this dependency and manage metadata internally using a Raft-based consensus protocol. As of Kafka 3.3, KRaft became production-ready, and ZooKeeper is now officially deprecated and will be removed in Kafka 4.0.

This guide explores both architectures in detail and explains why the shift to KRaft is a massive leap forward for Kafka.

---

## 1. The Legacy Architecture: Kafka with ZooKeeper

In the traditional architecture, a Kafka cluster requires a separate ZooKeeper cluster (usually an odd number of nodes like 3, 5, or 7) running alongside it.

### How it Works
1. **The Controller Broker:** One Kafka broker is elected as the "Active Controller" by grabbing a lock in ZooKeeper.
2. **Metadata Storage:** ZooKeeper stores all cluster metadata:
   - Broker IDs and endpoints
   - Topics, partitions, and their configurations
   - Replica assignments (Leader, Follower, ISR - In-Sync Replicas)
   - Temporary ACLs and quotas
3. **Write Path:** When an admin creates a topic, the Controller updates ZooKeeper, then propagates the state to all other brokers via RPC calls.
4. **Read Path:** Brokers cache the metadata in memory to serve client requests fast.

### Limitations of ZooKeeper
- **Two Systems to Manage:** Operators must deploy, secure, monitor, and tune two entirely different distributed systems (Kafka and ZooKeeper), each with its own JVM and configurations.
- **Controller Bottleneck:** The Controller must load the *entire* cluster state from ZooKeeper on startup or failover. If a cluster has hundreds of thousands of partitions, electing a new controller can take several minutes, causing a cluster-wide metadata freeze.
- **Split-Brain Risk:** The state in ZooKeeper and the state cached in the Controller/Brokers can drift out of sync, leading to "split-brain" scenarios.
- **Scalability Limit:** Because of the metadata propagation bottleneck, ZK-backed Kafka clusters are practically limited to around 200,000 partitions.

---

## 2. The Modern Architecture: KRaft (Kafka Raft)

KRaft removes the need for ZooKeeper entirely. Instead of an external system, metadata is managed internally as an **event-sourced log** using the Raft consensus protocol.

### How it Works
1. **Quorum Controllers:** A subset of brokers (or dedicated nodes) act as "Controllers". They form a Raft quorum. One is the Active Controller; the others are hot standbys.
2. **The Metadata Topic (`__cluster_metadata`):** Instead of saving state in a hierarchical database like ZK, KRaft stores metadata as a standard Kafka log. Every change (e.g., partition creation, leader change) is appended as a record to this topic.
3. **Event-Sourced Architecture:**
   - Brokers consume the `__cluster_metadata` topic just like normal consumers.
   - When the Active Controller writes a metadata change, all brokers continuously replicate it.
   - Brokers always have the most up-to-date state in memory by simply replaying the log.

### Deployment Modes
KRaft supports two deployment models:
- **Combined Mode:** The same JVM process acts as both a Broker (handling client traffic) and a Controller. Great for smaller clusters to save resources.
- **Isolated Mode:** Dedicated nodes run only as Controllers, while other nodes run only as Brokers. Recommended for large production clusters to isolate metadata I/O from heavy client I/O.

---

## 3. Deep Dive Comparison

| Feature | ZooKeeper Architecture | KRaft Architecture |
| :--- | :--- | :--- |
| **System Dependency** | External (Apache ZooKeeper) | **Internal** (Self-managed via Raft) |
| **Data Propagation** | RPC calls push state from Controller to Brokers | **Event-driven** (Brokers consume metadata log) |
| **Metadata Representation**| Hierarchical Nodes (ZNodes) | **Event Sourced** (Append-only log) |
| **Controller Failover** | Slow (Minutes). Must load entire state from ZK. | **Instant** (Sub-second). Standbys are already fully synced via the log. |
| **Scalability Limit** | ~200,000 partitions | **1,000,000+** partitions |
| **Split-Brain Risk** | High. ZK state and Broker memory can diverge. | **None**. The metadata log *is* the single source of truth. |
| **Security Setup** | Double effort (SASL/TLS for ZK + Kafka) | **Single unified security model** |
| **Startup Time** | Slow (Metadata propagation takes time) | **Fast** (Brokers just read local snapshot + log tail) |

---

## 4. Why KRaft is a Game Changer

### Event-Sourced Metadata
In ZooKeeper mode, the Controller computes the steady state and pushes it out. If a broker misses the push, it's out of sync. In KRaft, metadata *is data*. The metadata log is exactly the same append-only, sequential data structure Kafka uses for normal messages. This allows Kafka to use its core competency (replicating logs efficiently) to manage itself. 

### Sub-Second Controller Failover
Because standby KRaft controllers are continuously consuming the metadata log, they already have the entire cluster state loaded in memory. If the Active Controller dies, a standby is elected in milliseconds and can begin accepting writes immediately. This completely eliminates the dreaded "metadata freeze" during failovers.

### Snapshots for Fast Startup
To prevent the metadata log from growing infinitely, KRaft periodically writes **Metadata Snapshots** to disk. When a new broker starts up, it doesn't need to read the log from the very beginning; it simply loads the latest snapshot into memory and starts consuming the log from that point forward.

### Simpler Operations
Operating one system is easier than operating two. With KRaft, there are no ZooKeeper ensemble configurations, no complex JMX metrics to decode across different systems, and a unified security model (TLS/SASL config is the same for the whole cluster).

---

## 5. Interview Questions — KRaft vs ZooKeeper

**Q: Why did Kafka move away from ZooKeeper?**

> Kafka moved away from ZooKeeper primarily to solve **scalability and operational bottlenecks**. ZooKeeper limited Kafka clusters to roughly 200k partitions because the Active Controller had to load the entire state from ZK on failover and push state changes synchronously via RPCs to all brokers. Furthermore, managing two distinct distributed systems doubled the operational burden (security, monitoring, deployment). KRaft solves this by managing metadata internally using an event-sourced log.

**Q: In KRaft mode, how do normal brokers get metadata updates?**

> In KRaft mode, metadata is stored in an internal Kafka topic called `__cluster_metadata`. Normal brokers act as consumers of this topic. When the Active Controller makes a metadata change (like electing a new partition leader), it appends a record to this log. Brokers asynchronously consume this log and update their in-memory state, ensuring they are always in sync with the controller quorum.

**Q: What happens if the Active Controller fails in KRaft vs ZooKeeper?**

> In ZooKeeper mode, a new Controller must be elected, which then has to read the entire cluster state from ZooKeeper before it can function. In large clusters, this causes a "metadata freeze" lasting minutes. In KRaft mode, the other nodes in the controller quorum are continuously consuming the metadata log, so their in-memory state is already perfectly up to date. Controller failover happens almost instantaneously (under a second).

**Q: What is a KRaft snapshot and why is it necessary?**

> Because KRaft treats cluster metadata as an append-only log, the log could theoretically grow forever, increasing broker startup times as they replay the entire history. A KRaft snapshot is a point-in-time compaction of the state. Brokers read the latest snapshot to establish the baseline state in memory, and then only stream the tail of the log that occurred after the snapshot.
