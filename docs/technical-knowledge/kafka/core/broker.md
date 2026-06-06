---
id: kafka-broker
title: Kafka Broker — Complete Guide
sidebar_label: Kafka Broker
description: A complete guide to Kafka brokers — what they are, how storage works, partition leadership, replication, ISR, KRaft vs ZooKeeper, log compaction, performance internals, and production monitoring. Beginner through senior depth.
tags: [kafka, broker, distributed-systems, messaging, replication, isr, kraft, log-compaction, partition, performance]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Kafka Broker — Complete Guide

:::info Who this guide is for
- **New learners** — start at [What is Kafka?](#what-is-kafka) and [What is a Broker?](#what-is-a-broker) to understand the foundational model before diving into storage and replication.
- **Senior engineers** — jump to [Replication & ISR](#replication--isr), [Broker Internals](#broker-internals), [KRaft vs ZooKeeper](#kraft-vs-zookeeper), [Log Compaction](#log-retention-and-compaction), or [Performance Tuning](#performance-tuning).
:::

---

## What is Kafka?

Apache Kafka is a **distributed event streaming platform** — a persistent, ordered, replayable log of events that producers write to and consumers read from. Unlike traditional message queues that delete messages after delivery, Kafka retains messages for a configurable period, allowing any consumer to re-read the history.

```
Traditional message queue (RabbitMQ, ActiveMQ):
  Producer → Queue → Consumer
             ↑ deleted after delivery — no replay

Kafka:
  Producer → Topic (log) → Consumer A
                         → Consumer B (independent offset)
                         → Consumer C (replays from beginning)
             ↑ retained for days/weeks — any consumer, any time
```

### When to use Kafka

| Use case | Why Kafka fits |
|---------|--------------|
| **Event streaming** | Immutable, ordered log of events (orders, clicks, transactions) |
| **Async microservice decoupling** | Producer and consumer don't need to be online simultaneously |
| **Change data capture (CDC)** | Database changes streamed as events to other systems |
| **Log aggregation** | Centralise logs from many services; multiple consumers (Elasticsearch, S3) |
| **Real-time analytics** | Flink/Spark Streaming reads from Kafka topics |
| **Event sourcing** | Rebuild state by replaying all events from the beginning |

### When Kafka is overkill

| Scenario | Better choice |
|---------|--------------|
| Simple task queue (fire and forget) | RabbitMQ, SQS |
| RPC-style request-response | REST, gRPC |
| Very low message volume (< 1,000/day) | Database table with polling |
| Needs per-message acknowledgement | RabbitMQ with manual ACK |

---

## What is a Broker?

A **Kafka broker** is a single Kafka server process. It is the fundamental storage and networking unit of Kafka. Brokers:

- Receive messages from producers and persist them to disk
- Serve messages to consumers on request
- Replicate data to/from other brokers for fault tolerance
- Participate in cluster coordination (leader election, metadata)

A Kafka **cluster** is a group of brokers working together. Each broker has a unique integer ID (`broker.id`). Producers and consumers connect to the cluster through any broker — they all share metadata about who owns what data.

```
Kafka Cluster (3 brokers)
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│      Broker 1        │ │      Broker 2        │ │      Broker 3        │
│  ID: 1               │ │  ID: 2               │ │  ID: 3               │
│                      │ │                      │ │                      │
│  Leader:  orders-P0  │ │  Leader:  orders-P1  │ │  Leader:  orders-P2  │
│  Leader:  users-P1   │ │  Leader:  users-P0   │ │  Leader:  users-P2   │
│                      │ │                      │ │                      │
│  Follower: orders-P1 │ │  Follower: orders-P0 │ │  Follower: orders-P0 │
│  Follower: orders-P2 │ │  Follower: orders-P2 │ │  Follower: orders-P1 │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
         ↑ each broker is both a leader and a follower for different partitions
```

### Broker responsibilities

| Responsibility | What it does |
|---------------|-------------|
| **Message storage** | Appends incoming messages to segment files on disk — sequential writes |
| **Partition leadership** | Handles all producer writes and consumer reads for its leader partitions |
| **Replication** | As a follower, fetches data from the leader to stay in sync |
| **Consumer offset tracking** | Stores committed consumer offsets in the `__consumer_offsets` internal topic |
| **Cluster metadata** | Registers itself and reports partition state to the cluster controller |
| **Client request handling** | Processes Produce, Fetch, Metadata, and Admin API requests from clients |

---

## Core Kafka Concepts

Before going deeper into brokers, these terms must be clear:

### Topics and partitions

```
Topic: "orders"  (replication factor = 3, partitions = 3)
                                                                        
  Partition 0 (leader on Broker 1):                                     
  ┌──────┬──────┬──────┬──────┬──────┐                                 
  │ msg0 │ msg1 │ msg2 │ msg3 │ msg4 │ ──► append only, offset 0→4    
  └──────┴──────┴──────┴──────┴──────┘                                 
                                                                        
  Partition 1 (leader on Broker 2):                                     
  ┌──────┬──────┬──────┐                                               
  │ msg0 │ msg1 │ msg2 │ ──► independent offset sequence               
  └──────┴──────┴──────┘                                               
                                                                        
  Partition 2 (leader on Broker 3):                                     
  ┌──────┬──────┬──────┬──────┐                                        
  │ msg0 │ msg1 │ msg2 │ msg3 │                                        
  └──────┴──────┴──────┴──────┘                                        
```

| Concept | Description |
|---------|------------|
| **Topic** | A named, ordered log. Like a table name, but for event streams. |
| **Partition** | A topic is split into N partitions — each is an independent ordered log. Partitions enable parallelism. |
| **Offset** | A monotonically increasing integer per partition. Every message has a unique offset within its partition. |
| **Message key** | Optional. Messages with the same key always go to the same partition (consistent hashing). |
| **Replication factor** | How many copies of each partition exist across brokers. `RF=3` → 3 copies. |

### Producer routing

```python
# No key → round-robin across partitions (or sticky partitioning)
producer.send("orders", value="order_data")

# With key → consistent hashing to the same partition always
# partition = hash(key) % num_partitions
producer.send("orders", key="user-42", value="order_data")
# user-42 always → Partition 1 regardless of which broker you send to
```

### Consumer groups

```
Consumer Group "fulfillment":
  Consumer A reads Partition 0
  Consumer B reads Partition 1
  Consumer C reads Partition 2
  → Each partition consumed by exactly one consumer in the group
  → 3 partitions = max 3 consumers in parallel

Consumer Group "analytics" (independent):
  Consumer D reads Partition 0, 1, 2 independently
  → Different offset, doesn't interfere with "fulfillment" group
```

---

## Broker Storage Layout

Kafka stores data as **segment files** — append-only log files on disk. This is one of the key reasons Kafka is fast: sequential disk writes are orders of magnitude faster than random writes.

```
/var/kafka/logs/
  orders-0/                           ← Topic "orders", Partition 0
    00000000000000000000.log          ← Segment 1: messages at offsets 0 → N
    00000000000000000000.index        ← Offset index for Segment 1
    00000000000000000000.timeindex    ← Timestamp index for Segment 1
    00000000000001048576.log          ← Segment 2: messages at offsets 1048576 → M
    00000000000001048576.index        ← Offset index for Segment 2
    00000000000001048576.timeindex
    leader-epoch-checkpoint           ← Leader epoch history
  orders-1/
    00000000000000000000.log
    ...
  __consumer_offsets-0/              ← Internal topic — stores consumer positions
    ...
```

### Log files explained

Each segment consists of three files:

| File | Purpose | How Kafka uses it |
|------|---------|------------------|
| `.log` | The actual message data (binary, batch-compressed) | Sequential append on produce; sequential read on fetch |
| `.index` | Sparse offset → byte offset mapping | Binary search to find the byte position of a given offset |
| `.timeindex` | Timestamp → offset mapping | Find messages by timestamp for `--from-time` consumers |

### Finding a message by offset — why it's O(log n)

```
Consumer requests: offset 1,048,640

Step 1: Identify the correct segment file
  Files: 000...0000.log (offsets 0–1M), 000...1048576.log (offsets 1M+)
  → The 1,048,640 is in the second segment

Step 2: Binary search the .index file
  .index contains: [offset 1048576 → byte 0], [offset 1048656 → byte 4096], ...
  Binary search finds: 1,048,640 is between entries → start at byte 0

Step 3: Scan forward in the .log file
  Read from byte 0 → scan until offset 1,048,640 found (at most a few KB)

Total: O(log segments) + O(log index entries) + O(small linear scan)
```

### Segment rolling

When a segment grows to `log.segment.bytes` (default 1 GB) or ages past `log.roll.hours` (default 168h), Kafka **rolls** to a new segment file. Only the newest segment is "active" (being written to). Older segments are candidates for deletion or compaction.

---

## Replication & ISR

Replication is what makes Kafka fault-tolerant. Every partition has one **leader** and zero or more **followers** (replicas on other brokers).

### How replication works

```
Topic "orders", Partition 0 — Replication Factor 3

Broker 1 (Leader P0):
  ┌──────────────────────────────────────────┐
  │ offset: 0    1    2    3    4    ← HEAD  │ ← Producer writes here
  └──────────────────────────────────────────┘
           ↓ fetch (followers pull from leader)
Broker 2 (Follower P0):
  ┌──────────────────────────────────────────┐
  │ offset: 0    1    2    3    4            │ ← in sync (ISR)
  └──────────────────────────────────────────┘
           ↓
Broker 3 (Follower P0):
  ┌──────────────────────────────────────────┐
  │ offset: 0    1    2                      │ ← lagging — may leave ISR
  └──────────────────────────────────────────┘
```

Followers continuously **fetch** from the leader (just like a consumer). The leader tracks how far each follower has replicated.

### In-Sync Replicas (ISR)

The **ISR** (In-Sync Replica set) is the list of replicas that are caught up with the leader within `replica.lag.time.max.ms` (default 30 seconds). Only ISR members are eligible to become the new leader in a failover.

```
ISR tracking:
  Leader knows Broker 2 last fetched offset 4 → in ISR  ✅
  Leader knows Broker 3 last fetched offset 2 → 30s ago → removed from ISR  ❌

ISR = [Broker 1 (leader), Broker 2]
```

### Producer acknowledgement levels — the durability contract

The `acks` setting on the producer controls when Kafka considers a write successful:

<Tabs>
  <TabItem value="acks-all" label="acks=all (safest)">

```
Producer sends message → Leader writes to disk
                       → Waits for ALL ISR members to acknowledge
                       → Only then responds "success" to producer

Broker 1 (Leader): ✅ written
Broker 2 (Follower): ✅ fetched and written
→ Leader responds: "acknowledged"

If leader crashes immediately after:
  Broker 2 has the message → elected as new leader → no data loss  ✅

Risk: none for data loss (given sufficient ISR)
Cost: highest latency (waits for slowest replica)
```

  </TabItem>
  <TabItem value="acks-1" label="acks=1 (default)">

```
Producer sends message → Leader writes to disk
                       → Immediately responds "success" to producer
                       → Followers replicate asynchronously

If leader crashes before followers replicate:
  Message is lost — followers don't have it  ❌

Risk: data loss on leader failure
Cost: lower latency (no wait for followers)
Use for: non-critical logs, analytics events where some loss is acceptable
```

  </TabItem>
  <TabItem value="acks-0" label="acks=0 (fire and forget)">

```
Producer sends message → Does not wait for any acknowledgement
                       → Immediately moves to next message

If leader is down, network drops, or broker OOMs:
  Message is silently lost — producer doesn't know  ❌

Risk: highest data loss probability
Cost: maximum throughput, minimum latency
Use for: metrics/telemetry where occasional loss is acceptable
```

  </TabItem>
</Tabs>

### min.insync.replicas — the safety floor

`min.insync.replicas` (default 1) defines the minimum number of ISR replicas that must acknowledge a write when `acks=all`. If the ISR shrinks below this threshold, the broker rejects new produces with `NotEnoughReplicasException`.

```
Setup: replication.factor=3, min.insync.replicas=2, acks=all

Scenario A — 3 brokers healthy:
  ISR = [Broker1, Broker2, Broker3]
  ISR size (3) >= min.insync.replicas (2) → writes succeed  ✅

Scenario B — Broker3 falls behind / crashes:
  ISR = [Broker1, Broker2]
  ISR size (2) >= min.insync.replicas (2) → writes still succeed  ✅

Scenario C — Broker2 also crashes:
  ISR = [Broker1]
  ISR size (1) < min.insync.replicas (2) → writes REJECTED  ❌
  → Cluster sacrifices availability for consistency (no data loss)

The "safe" production formula:
  replication.factor = 3
  min.insync.replicas = 2   (RF - 1)
  acks = all
  → Can tolerate 1 broker failure with zero data loss
```

### Leader election on broker failure

```
Normal state:
  Partition 0 leader = Broker 1 (in ISR)
  ISR = [Broker1, Broker2, Broker3]

Broker 1 crashes:
  ZooKeeper/KRaft detects session expiry → notifies Controller
  Controller selects new leader from ISR (e.g. Broker 2)
  Controller updates partition metadata
  Brokers and clients receive metadata update

  Recovery:
    Broker 2 becomes leader at offset 4 (the last committed offset)
    Producers retry and reconnect to new leader
    Consumers receive metadata update and resume from last committed offset

  Duration: typically 5–30 seconds (depends on session timeout)

If Broker 1 was the ONLY ISR member:
  → No eligible leader → partition goes OFFLINE
  → Reads and writes to this partition fail until Broker 1 recovers
  → Alternatively: enable unclean.leader.election.enable=true to elect a
    lagging follower (possible data loss)
```

---

## Controller Broker

Among all brokers, one is elected as the **Controller**. It is responsible for all cluster-wide administrative decisions:

| Responsibility | Detail |
|---------------|--------|
| **Leader election** | When a broker fails, elects new partition leaders from the ISR |
| **Broker join/leave** | Processes broker registration and deregistration events |
| **Partition reassignment** | Moves partition leadership when you add/remove brokers |
| **Topic management** | Creates and deletes topics (partition + replica assignment) |
| **ISR management** | Propagates ISR change notifications to all brokers |

```
Cluster with 3 brokers — Broker 1 is the Controller:

Broker 2 crashes
    │
    ▼
ZooKeeper/KRaft detects → notifies Controller (Broker 1)
    │
    ▼
Controller:
  1. Identifies partitions where Broker 2 was leader
  2. For each: selects next ISR member as new leader
  3. Sends LeaderAndIsr request to affected brokers
  4. Updates cluster metadata
    │
    ▼
Brokers and clients refresh metadata → resume operations
```

There is **always exactly one active Controller**. `ActiveControllerCount` JMX metric must always equal `1` — if it is `0`, the cluster cannot manage itself; if it is `2`, there is a split-brain condition.

---

## KRaft vs ZooKeeper

Historically, Kafka used **Apache ZooKeeper** as its external coordination service for storing cluster metadata and running Controller elections. Since Kafka 3.3, **KRaft** (Kafka Raft) replaces ZooKeeper entirely.

### The ZooKeeper architecture problem

```
ZooKeeper-based Kafka (legacy):

Producer/Consumer → Kafka Brokers → ZooKeeper (separate cluster)
                                        ↑
                              Stores: broker list, topic config,
                                      ISR, controller election
                                      consumer offsets (old)

Problems:
  ✗ Two separate systems to deploy, monitor, and upgrade
  ✗ ZooKeeper becomes a bottleneck with 100,000+ partitions
  ✗ Controller failover requires ZooKeeper session expiry (slow)
  ✗ Metadata stored in ZooKeeper limited scalability
  ✗ Operational complexity: ZooKeeper quorum, znodes, ACLs
```

### KRaft — Kafka without ZooKeeper

```
KRaft-based Kafka (modern):

Producer/Consumer → Kafka Brokers (also store their own metadata)
                         ↑
              Internal Raft log manages:
                broker registration, topic config,
                ISR, leader election, partition assignment

Benefits:
  ✅ One system instead of two
  ✅ Supports millions of partitions (10× more than ZooKeeper mode)
  ✅ Faster controller failover (milliseconds vs seconds)
  ✅ Simpler operations and deployment
  ✅ Metadata is stored as a Kafka topic (__cluster_metadata)
```

### KRaft deployment modes

<Tabs>
  <TabItem value="combined" label="Combined mode (development / small clusters)">

```yaml
# server.properties — broker also acts as controller
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@broker1:9093,2@broker2:9093,3@broker3:9093

listeners=PLAINTEXT://:9092,CONTROLLER://:9093
listener.security.protocol.map=PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
```

Each node is both a broker (handles client requests) and a controller (manages metadata via Raft). Simpler to run but controller and broker contend for resources.

  </TabItem>
  <TabItem value="isolated" label="Isolated mode (production)">

```yaml
# controller.properties — dedicated controller nodes (no client traffic)
process.roles=controller
node.id=1
controller.quorum.voters=1@controller1:9093,2@controller2:9093,3@controller3:9093

listeners=CONTROLLER://:9093

# broker.properties — dedicated broker nodes (handles client traffic)
process.roles=broker
node.id=4
controller.quorum.voters=1@controller1:9093,2@controller2:9093,3@controller3:9093
listeners=PLAINTEXT://:9092
```

Separate sets of nodes: 3 dedicated controllers (Raft quorum) + N broker nodes. Controllers handle only metadata; brokers handle only client I/O. Better resource isolation and stability for large clusters.

  </TabItem>
</Tabs>

| | ZooKeeper mode | KRaft mode |
|-|---------------|-----------|
| **External dependency** | ZooKeeper cluster required | None — self-contained |
| **Max partitions** | ~200,000 practical limit | Millions |
| **Controller failover** | 15–30 seconds | Milliseconds |
| **Metadata storage** | ZooKeeper znodes | `__cluster_metadata` topic (Raft log) |
| **Supported since** | Kafka 0.x | Kafka 2.8 (preview), 3.3 (production) |
| **Status** | Deprecated — removed in Kafka 4.0 | Default from Kafka 3.3+ |

:::warning ZooKeeper removed in Kafka 4.0
If you are running Kafka 3.x with ZooKeeper, migrate to KRaft before upgrading to 4.0. Use `kafka-storage.sh` to format the metadata log in KRaft mode.
:::

---

## Log Retention and Compaction

Every partition's log is managed by one of two cleanup policies:

### Delete policy (default)

Segments older than `log.retention.hours` or larger than `log.retention.bytes` are deleted:

```
log.retention.hours=168    ← delete segments older than 7 days
log.retention.bytes=10737418240  ← delete old segments if partition > 10 GB
```

When both are set, whichever limit is hit first triggers deletion. Segments are deleted as whole units — Kafka never deletes individual messages.

```
Segment timeline for orders-0:
  [Seg 1: Jan 1–3] [Seg 2: Jan 3–5] [Seg 3: Jan 5–7] [Seg 4: Active]
                                      ↑ Today = Jan 8
  7-day retention: Seg 1 is > 7 days old → deleted
                   Segs 2, 3, 4 kept
```

### Compact policy — the changelog pattern

`cleanup.policy=compact` keeps only the **latest value per message key**, permanently — no time-based deletion.

```
Topic "user-profiles" (compacted):
  offset 0: key=user-42, value={"name":"Alice","city":"HCM"}
  offset 1: key=user-99, value={"name":"Bob","city":"HN"}
  offset 2: key=user-42, value={"name":"Alice","city":"Hanoi"}   ← update
  offset 3: key=user-42, value=null                              ← tombstone (delete)

After compaction:
  offset 1: key=user-99, value={"name":"Bob","city":"HN"}        ← kept
  offset 3: key=user-42, value=null  ← kept temporarily (tombstone)
  (offset 0 and 2 are superseded → deleted)
```

**Tombstone messages** (null value with a key) signal deletion. The compaction process removes the tombstone after `delete.retention.ms` (default 24h), allowing downstream consumers time to process the delete.

### When to use each policy

| Policy | Use for | Example topics |
|--------|---------|----------------|
| **Delete** | Time-series events, logs, analytics — historical data ages out | `clickstream`, `application-logs`, `order-events` |
| **Compact** | Latest state per entity — changelog, cache invalidation, event sourcing state | `user-profiles`, `product-inventory`, `feature-flags` |
| **Compact + Delete** | Keep latest state but also enforce max age | `session-state` (compact, but expire after 30 days) |

---

## Bootstrap Servers and Client Discovery

`bootstrap.servers` is the entry point for all Kafka clients. You only need to list 2–3 brokers — the client fetches the full cluster metadata from them:

```properties
bootstrap.servers=broker1:9092,broker2:9092,broker3:9092
```

```
Client startup sequence:
  1. Connect to any bootstrap broker (e.g. broker1:9092)
  2. Send Metadata request: "what brokers and partitions exist?"
  3. Receive: full cluster topology (all brokers, all topics, partition→broker mapping)
  4. Cache metadata locally
  5. Connect directly to the correct leader broker for each partition
  6. On error (broker down) → refresh metadata → reconnect to new leader
```

:::tip List only 2–3 bootstrap servers
You don't need to list every broker. List 2–3 for redundancy in case one is down during startup. The client discovers the rest automatically from the metadata response.
:::

---

## Key Broker Configurations

```properties
# ── Identity ─────────────────────────────────────────────────────────────
broker.id=1                          # Unique integer per broker in the cluster
node.id=1                            # KRaft mode uses this (same as broker.id)

# ── Storage ───────────────────────────────────────────────────────────────
log.dirs=/var/kafka/logs,/data/kafka # Multiple dirs = JBOD (striped across disks)
log.segment.bytes=1073741824         # Roll to a new segment at 1 GB
log.roll.hours=168                   # Or roll after 7 days even if < 1 GB

# ── Retention ─────────────────────────────────────────────────────────────
log.retention.hours=168              # Delete segments older than 7 days
log.retention.bytes=-1               # -1 = unlimited size-based retention
log.cleanup.policy=delete            # or compact, or delete,compact

# ── Replication ───────────────────────────────────────────────────────────
default.replication.factor=3         # New topics get RF=3 by default
min.insync.replicas=2                # Require 2 ISR acks for acks=all
replica.lag.time.max.ms=30000        # Remove replica from ISR after 30s lag
unclean.leader.election.enable=false # Never elect an out-of-sync replica as leader

# ── Performance ───────────────────────────────────────────────────────────
num.network.threads=8                # Threads handling network I/O
num.io.threads=16                    # Threads executing disk I/O requests
num.replica.fetchers=4               # Threads fetching from leader (follower side)
socket.send.buffer.bytes=102400      # OS TCP send buffer
socket.receive.buffer.bytes=102400   # OS TCP receive buffer
socket.request.max.bytes=104857600   # Max request size (100 MB)

# ── Producer limits ───────────────────────────────────────────────────────
message.max.bytes=1048576            # Max single message size (1 MB default)

# ── Topic defaults ────────────────────────────────────────────────────────
num.partitions=3                     # Default partitions for auto-created topics
auto.create.topics.enable=false      # Disable in production — create topics explicitly

# ── Compression ───────────────────────────────────────────────────────────
compression.type=producer            # Accept whatever compression the producer chose
```

---

## Broker Internals

<details>
<summary>🔬 Senior deep-dive: why Kafka is so fast — page cache and zero-copy</summary>

Kafka achieves high throughput through three OS-level optimisations that most message brokers don't exploit:

### Sequential I/O

All writes to a partition are **append-only sequential writes** to the end of the active segment file. Sequential disk I/O is 50–100× faster than random I/O because:

```
Random I/O (traditional DB):
  Write record A → seek to address 0x4A2F → write 200 bytes
  Write record B → seek to address 0x9C10 → write 200 bytes
  → Disk head physically moves (HDD) or wear-levels across blocks (SSD)

Sequential I/O (Kafka):
  Write record A → append to end of file
  Write record B → append right after A (already positioned)
  → No seeking — 100% sequential, saturates disk bandwidth
```

### OS Page Cache

Kafka does not manage its own memory buffer for recent writes. Instead, it writes to the OS **page cache** (kernel memory that maps file contents into RAM). The OS flushes to disk asynchronously:

```
Producer sends message:
  1. Kafka writes to page cache (RAM) → returns ACK to producer
  2. OS flush daemon writes page cache → disk (async, every ~30s or when memory pressure)

Consumer reads message:
  1. Kafka checks: is this page still in cache? → YES (for recent messages)
  2. Returns from RAM → no disk I/O at all  ✅

Result: recent messages are served from RAM at memory bandwidth speed,
        not disk bandwidth speed.
```

This is why Kafka recommends **giving the OS most of the machine RAM** rather than configuring a large JVM heap — the OS page cache IS Kafka's buffer.

```
Recommended JVM heap: 6 GB (Kafka broker doesn't need much)
Remaining RAM: 26 GB on a 32 GB machine
→ OS page cache holds ~26 GB of recent Kafka data in memory
→ Most reads are served from RAM, not disk
```

### Zero-Copy (sendfile)

When a consumer fetches messages, naive transfer is:

```
Naive (4 copies):
  Disk → Kernel buffer → User space (Kafka JVM) → Kernel socket buffer → Network
                              ↑ copy 1          ↑ copy 2             ↑ copy 3+4

Zero-copy (sendfile syscall, 2 copies):
  Disk → Kernel buffer ──────────────────────────► Network
                    ↑ OS handles directly via DMA — JVM never touches the data
```

Kafka uses Java's `FileChannel.transferTo()` which calls the OS `sendfile()` syscall. This reduces copies from 4 to 2 and eliminates context switches between user space and kernel space. For read-heavy workloads, this is the primary throughput driver.

</details>

<details>
<summary>🔬 Senior deep-dive: batch compression pipeline</summary>

Kafka compresses at the **batch level**, not per-message. The producer accumulates a batch of messages and compresses the entire batch:

```
Producer batch (before compression):
  [msg1: 500 bytes] [msg2: 500 bytes] ... [msg100: 500 bytes] = 50 KB

After LZ4 compression:
  [compressed batch: 8 KB]  ← 83% reduction for structured/repeated data

Single batch write to broker:
  8 KB written (one sequential write)

Consumer receives batch:
  8 KB transferred over network
  Consumer decompresses locally

Result: network and disk I/O 83% lower than uncompressed
```

**Compression algorithm comparison:**

| Algorithm | Compression ratio | Speed | CPU cost | Best for |
|-----------|:----------------:|:-----:|:--------:|---------|
| `none` | 1× | Fastest | None | Already-compressed data (JPEG, video) |
| `lz4` | 2–4× | Very fast | Low | **Default choice — best speed/ratio tradeoff** |
| `snappy` | 2–3× | Fast | Low | Good alternative to LZ4 |
| `gzip` | 3–6× | Slow | High | Archival topics with low throughput |
| `zstd` | 3–7× | Fast | Medium | **Best ratio with acceptable speed — modern choice** |

Set `compression.type=zstd` on the producer for best overall efficiency in 2024+.

</details>

<details>
<summary>🔬 Senior deep-dive: exactly-once semantics (EOS)</summary>

Kafka's default delivery guarantee is **at-least-once** — retries can cause duplicates. Exactly-once semantics (EOS) guarantees each message is processed precisely once end-to-end.

### Idempotent producer

```properties
# Producer config
enable.idempotence=true
acks=all                     # required for idempotence
max.in.flight.requests.per.connection=5  # max 5 for idempotent

# Broker assigns each producer a PID (Producer ID) and tracks sequence numbers.
# Duplicate sends (retries) are detected and deduplicated by the broker.
```

```
Producer sends batch with sequence=42:
  Broker receives and stores it → responds ACK
  Network drops → producer doesn't get ACK → retries
  Broker receives again with sequence=42 → "I already have this" → drops duplicate ✅
```

### Transactional producer (cross-partition atomicity)

```java
producer.initTransactions();

try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("orders", "order-data"));
    producer.send(new ProducerRecord<>("inventory", "reserve-item"));
    producer.send(new ProducerRecord<>("payments", "charge-card"));
    // All three writes are atomic — either all succeed or all are rolled back
    producer.commitTransaction();
} catch (Exception e) {
    producer.abortTransaction();   // rolls back all three writes
}
```

```properties
# Consumer must also set isolation level for EOS reads
isolation.level=read_committed   # only see committed transaction data
# (default is read_uncommitted — sees in-progress transaction data too)
```

**EOS cost:** ~20–30% throughput reduction due to transaction coordination overhead. Use only when you genuinely need exactly-once — most use cases are fine with at-least-once + idempotent consumer logic.

</details>

---

## Performance Tuning

### Broker-side tuning

```properties
# ── Throughput optimisation ────────────────────────────────────────────────
num.network.threads=8            # = number of CPU cores (handles network I/O)
num.io.threads=16                # = 2× CPU cores (handles disk I/O)
num.replica.fetchers=4           # More = faster replication catch-up after restarts

# ── Network buffers ────────────────────────────────────────────────────────
socket.send.buffer.bytes=1048576      # 1 MB — increase for high throughput
socket.receive.buffer.bytes=1048576   # 1 MB
socket.request.max.bytes=104857600    # 100 MB — max request size

# ── OS-level (not in server.properties) ───────────────────────────────────
# Set in /etc/sysctl.conf:
# net.core.rmem_max = 134217728       # 128 MB TCP receive buffer
# net.core.wmem_max = 134217728       # 128 MB TCP send buffer
# vm.swappiness = 1                   # Never swap — protect page cache
```

### JVM tuning

```bash
# KAFKA_HEAP_OPTS — set in kafka-env.sh or systemd unit
KAFKA_HEAP_OPTS="-Xms6g -Xmx6g"   # 6 GB fixed heap (no resize overhead)

# G1GC is the recommended collector for Kafka brokers
KAFKA_JVM_PERFORMANCE_OPTS="
  -server
  -XX:+UseG1GC
  -XX:MaxGCPauseMillis=20          # Target max GC pause: 20ms
  -XX:InitiatingHeapOccupancyPercent=35
  -XX:+ExplicitGCInvokesConcurrent
  -Djava.awt.headless=true"
```

### Disk and filesystem recommendations

```
✅ Use dedicated disks for Kafka data (separate from OS, application logs)
✅ XFS filesystem — better performance for Kafka's large sequential writes
✅ Mount with noatime — don't update access time on every read
✅ For multi-disk setups: use log.dirs with one path per disk (JBOD)
   → Kafka stripes partitions across disks automatically

log.dirs=/disk1/kafka,/disk2/kafka,/disk3/kafka

✅ RAID: avoid RAID5/6 (write penalty) — use RAID10 or JBOD
✅ SSD: use for controller nodes in KRaft mode (metadata I/O)
```

### Partition count guidelines

```
Partitions per topic = max(throughput / per-partition-throughput, consumer-parallelism)

Rule of thumb:
  Per-partition throughput: ~10 MB/s produce, ~50 MB/s consume
  Target topic throughput: 100 MB/s
  → Minimum partitions = 100 / 10 = 10 partitions

  Consumer parallelism: 10 consumers in the group
  → At least 10 partitions (each consumer handles one)

  Choose: max(10, 10) = 10 partitions

Caution:
  ✗ Over-partitioning (10,000+ partitions per broker) increases:
    - Leader election time on restart
    - Memory usage (open file descriptors per segment)
    - End-to-end latency (more files to fsync on flush)

General guideline:
  < 100 MB/s throughput: start with 3–6 partitions
  100 MB/s – 1 GB/s: 10–50 partitions
  > 1 GB/s: profile carefully; consider multiple topics
```

---

## Monitoring & Observability

### Critical JMX metrics

| Metric | Healthy value | Alert condition | What it means |
|--------|:------------:|----------------|--------------|
| `UnderReplicatedPartitions` | `0` | **> 0** | Some partitions have fewer replicas than RF — data at risk |
| `ActiveControllerCount` | `1` | `≠ 1` | No controller or split-brain — cluster cannot manage itself |
| `OfflinePartitionsCount` | `0` | **> 0** | Partitions with no leader — producers and consumers failing |
| `LeaderCount` | Balanced across brokers | Imbalanced | Uneven load — one broker handling all traffic |
| `BytesInPerSec` | Per capacity plan | Approaching disk bandwidth | Disk saturation |
| `BytesOutPerSec` | Per capacity plan | Approaching NIC bandwidth | Network saturation |
| `RequestHandlerAvgIdlePercent` | > 50% | **< 30%** | Broker CPU saturated — add brokers or reduce load |
| `ProducerRequestQueueTimeMs` | < 10ms | > 100ms | Network thread backlog — increase `num.network.threads` |
| `FetchConsumerRequestQueueTimeMs` | < 10ms | > 100ms | Consumer fetch backlog |
| `ISRShrinkRate` | Near 0 | Rising | Replicas frequently leaving ISR — check broker GC, disk I/O |

### Consumer lag monitoring

Consumer lag is the most operationally important Kafka metric — it tells you how far behind consumers are from the latest messages:

```bash
# Check consumer group lag via CLI
kafka-consumer-groups.sh \
  --bootstrap-server broker1:9092 \
  --describe --group fulfillment-service

GROUP               TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
fulfillment-service orders  0          1048600         1048610         10   ✅
fulfillment-service orders  1          524200          524500          300  ⚠️
fulfillment-service orders  2          786000          786000          0    ✅
```

```yaml
# Burrow (LinkedIn) or Kafka Exporter — expose lag as Prometheus metrics
# Alert when lag exceeds SLA threshold
- alert: KafkaConsumerLagHigh
  expr: kafka_consumer_group_lag > 10000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Consumer group {{ $labels.group }} lag > 10,000 on {{ $labels.topic }}"
```

### Prometheus + Grafana setup

```yaml
# docker-compose.yml — Kafka with JMX exporter
services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_JMX_PORT: 9999
      EXTRA_ARGS: "-javaagent:/opt/jmx-exporter.jar=9998:/etc/jmx-exporter.yml"

  kafka-exporter:
    image: danielqsj/kafka-exporter:latest
    command:
      - "--kafka.server=kafka:9092"
      - "--topic.filter=.*"
      - "--group.filter=.*"
    ports:
      - "9308:9308"
```

```promql
# Key PromQL queries for a Kafka Grafana dashboard

# Under-replicated partitions — must be 0
kafka_server_replicamanager_underreplicatedpartitions

# Consumer lag per group/topic/partition
kafka_consumer_group_lag{group="fulfillment-service", topic="orders"}

# Broker throughput in MB/s
rate(kafka_server_brokertopicmetrics_bytesin_total[1m]) / 1024 / 1024

# Request handler idle %  — alert if < 30%
kafka_server_requesthandlerpool_idlepercent
```

---

## Common Failure Scenarios

| Scenario | Symptoms | Root cause | Fix |
|---------|---------|-----------|-----|
| **Broker OOM crash** | `OfflinePartitionsCount` spikes, consumers fall behind | JVM heap too large (eats page cache) | Reduce heap to 6 GB; give remaining RAM to OS |
| **ISR constantly shrinking** | `ISRShrinkRate` rising, `UnderReplicatedPartitions > 0` | Slow disk I/O or GC pauses on follower | Check `iostat`, GC logs; add disks or upgrade instance |
| **Consumer lag growing** | Lag increases indefinitely | Consumer processing too slow | Scale consumer group (add instances up to partition count) |
| **Unclean leader election** | Possible data loss, offsets jump | `unclean.leader.election.enable=true` and leader lost | Set `unclean.leader.election.enable=false` in production |
| **Rebalance storm** | Consumer group repeatedly rebalancing | Session timeout too short or slow `poll()` | Increase `session.timeout.ms`; fix slow processing |
| **Large message rejection** | `RecordTooLargeException` | Message exceeds `message.max.bytes` | Increase limit or split large messages |
| **Disk full** | Broker crashes, `OfflinePartitionsCount` | Retention policy too loose | Reduce `log.retention.hours` or add storage |
| **Split brain (ZooKeeper)** | `ActiveControllerCount = 2` | ZooKeeper network partition | Fix ZooKeeper quorum; prefer KRaft mode |

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `acks=1` for financial transactions | Leader acknowledges, crashes before replication → data loss | Use `acks=all` + `min.insync.replicas=2` for critical topics |
| `unclean.leader.election.enable=true` | Out-of-sync replica becomes leader → silent data loss | Set to `false` in production — accept brief unavailability over data loss |
| Single partition per topic | No consumer parallelism; one broker handles all writes | Partition count ≥ max consumer group size |
| Huge JVM heap (> 8 GB) | Page cache starved — Kafka reads from disk instead of RAM | Keep heap at 6 GB; give remaining RAM to OS for page cache |
| No `auto.create.topics.enable=false` | Typos in topic names silently create empty topics | Disable auto-creation; manage topics explicitly |
| `replication.factor=1` | Single copy — one broker failure = permanent data loss | Always use RF ≥ 2 in production; RF=3 for critical topics |
| Not monitoring consumer lag | Consumer falls hours behind before anyone notices | Alert on lag > threshold per topic SLA |
| Large number of small partitions | Controller election time and memory overhead grow | Keep partitions per broker under 4,000; right-size partition count |
| Blocking `poll()` loop | Session timeout → consumer appears dead → rebalance storm | Process messages asynchronously; keep `poll()` interval < `max.poll.interval.ms` |
| `log.retention.bytes` without `log.retention.hours` | Old data never deleted if size stays under limit | Set both; test retention with realistic data volume |

---

## 🎯 Interview Questions

**Q1. What is a Kafka broker and what does it do?**
> A Kafka broker is a single Kafka server process. It receives messages from producers and appends them to partition segment files on disk, serves messages to consumers on fetch requests, replicates data to and from other brokers to maintain the configured replication factor, and participates in cluster coordination (leader election, metadata management). A Kafka cluster is simply multiple brokers working together — each partition is assigned one leader broker (handles all reads and writes) and zero or more follower brokers (replicate the data for redundancy).

**Q2. What is the ISR and why does it matter?**
> The ISR (In-Sync Replica set) is the list of partition replicas that are fully caught up with the leader within `replica.lag.time.max.ms`. Only ISR members are eligible to become the new leader on failover — this prevents data loss from electing an out-of-date replica. With `acks=all`, the leader waits for all ISR members to acknowledge a write before returning success to the producer. If the ISR shrinks below `min.insync.replicas`, writes are rejected entirely — the cluster sacrifices availability to preserve consistency.

**Q3. What is the difference between `acks=1`, `acks=0`, and `acks=all`?**
> `acks=0`: fire-and-forget — producer doesn't wait for any acknowledgement; highest throughput, highest data loss risk. `acks=1`: leader acknowledges after writing to its local log — good balance of performance and safety, but data can be lost if the leader crashes before followers replicate. `acks=all` (or `-1`): leader waits for all ISR members to write the record before acknowledging — zero data loss given at least one ISR replica survives. For financial or critical data, always use `acks=all` combined with `min.insync.replicas=2`.

**Q4. What happens when a broker fails?**
> The Controller detects the failure via ZooKeeper session expiry (or KRaft heartbeat timeout). For each partition where the failed broker was the leader, the Controller selects a new leader from the ISR. It sends a `LeaderAndIsr` request to all affected brokers with the new leader assignment, then updates cluster metadata. Producers and consumers receive a metadata error on the next request, refresh their metadata, and reconnect to the new leader — typically recovering within 5–30 seconds. If the failed broker was the only ISR member for any partition, those partitions go offline until the broker recovers or `unclean.leader.election.enable=true` is set (which risks data loss).

**Q5. What is the difference between log compaction and log deletion?**
> Log deletion (`cleanup.policy=delete`) removes entire segments after they exceed `log.retention.hours` or `log.retention.bytes`. Useful for time-series or event data where older history is no longer needed. Log compaction (`cleanup.policy=compact`) retains the latest value per message key indefinitely — older records with the same key are deleted, but the most recent record for each key is kept forever. Useful for changelog topics or event-sourced state where you need to reconstruct current entity state by replaying from the beginning. Compaction is ideal for `user-profiles`, `product-inventory`, or any "latest state per entity" use case.

**Q6. Why is Kafka fast? What are the key architectural choices behind its throughput?**
> Three OS-level optimisations: (1) **Sequential I/O** — all partition writes are append-only sequential disk writes, which are 50–100× faster than random I/O (no seeking). (2) **OS page cache** — Kafka writes to the kernel's page cache, not its own buffer. The OS keeps recent data in RAM; consumer reads for recent messages are served from memory at RAM bandwidth speeds, not disk speeds. This is why Kafka recommends a small JVM heap (6 GB) and a large OS page cache. (3) **Zero-copy via sendfile** — when consumers fetch data, Kafka uses the OS `sendfile()` syscall to transfer data directly from kernel buffer to the network socket without copying through the JVM. This halves the number of memory copies and eliminates user-kernel context switches.

**Q7. (Senior) What is the difference between KRaft and ZooKeeper mode, and why was ZooKeeper removed?**
> ZooKeeper mode used an external Apache ZooKeeper cluster to store cluster metadata (broker list, partition leaders, ISR, topic configs) and run Controller elections. Problems: (1) operational complexity of two separate systems; (2) practical partition limit of ~200,000 before ZooKeeper became a bottleneck; (3) Controller failover took 15–30 seconds (ZooKeeper session expiry); (4) metadata scalability limits. KRaft replaces ZooKeeper with an internal Raft consensus protocol — Kafka stores its own metadata in a special `__cluster_metadata` topic replicated via Raft. Benefits: one system to manage, millisecond Controller failover, support for millions of partitions, simpler operations. ZooKeeper was deprecated in Kafka 3.x and removed entirely in Kafka 4.0.

**Q8. (Senior) How does Kafka achieve exactly-once semantics?**
> Exactly-once requires two components: (1) **Idempotent producer** (`enable.idempotence=true`) — the broker assigns each producer a PID and tracks sequence numbers per partition. Duplicate sends (from retries) are detected and deduplicated at the broker. (2) **Transactions** — the transactional producer groups writes across multiple partitions into an atomic unit; either all writes commit or all roll back. Consumers set `isolation.level=read_committed` to see only committed data. The cost is ~20–30% throughput overhead from transaction coordination. For most use cases, idempotent consumers (de-duplicate at the application level using unique message IDs) achieve the same result with less overhead.

---

## See Also

- [Kafka Producer — Complete Guide](../producer/producer-overview)
- [Kafka Consumer — Complete Guide](../consumer/consumer-overview)
- [Kafka Streams — Stream Processing](../advanced/kafka-streams-deep-dive)
- [Database Connection Pooling](../../database/connection-pooling)
- [Database Sharding & Partitioning](../../system-design/sharding-partitioning)