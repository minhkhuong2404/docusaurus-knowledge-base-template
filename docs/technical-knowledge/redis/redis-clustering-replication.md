---
id: redis-clustering-replication
title: "Redis Clustering, Replication & High Availability"
slug: redis-clustering-replication
description: Deep architectural guide to Redis replication (PSYNC 2.0), replication backlog sizing, Sentinel quorum failovers, split-brain mitigations, and Redis Cluster 16,384 hash slot sharding.
tags: [redis, cluster, replication, sentinel, high-availability, backend, architecture]
---

import RedisClusterReplicationDiagram from '@site/src/components/RedisClusterReplicationDiagram';

# Redis Clustering, Replication & High Availability

<RedisClusterReplicationDiagram />

Scaling Redis beyond a single standalone node requires choosing between two distinct architectural paradigms:
1. **Redis Sentinel**: Provides automated failover and high availability for a single primary node with read-only replicas (vertical scale with automated recovery).
2. **Redis Cluster**: Provides distributed horizontal sharding across multiple primary nodes using **16,384 hash slots** with decentralized gossip-based failover.

Operating these architectures under high throughput requires mastering **PSYNC 2.0 replication internals**, **replication backlog sizing formulas**, **split-brain data loss defenses**, and **cross-slot transaction constraints**.

---

## 1. Master-Replica Asynchronous Replication Internals

Redis replication is fundamentally **asynchronous**. When a primary receives a write command, it writes to memory, appends to the replication backlog, and acknowledges the client *before* the write is propagated to replicas.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        REDIS MASTER-REPLICA REPLICATION ENGINE                         │
│                                                                                        │
│   CLIENT                   MASTER (PRIMARY)                    REPLICA (SECONDARY)     │
│   ┌────────┐               ┌───────────────────────────────┐   ┌───────────────────┐   │
│   │ SET k v│ ────────────> │ 1. Executes in Memory         │   │                   │   │
│   │        │ <──────────── │ 2. Acks Client (Latency < 1ms)│   │                   │   │
│   └────────┘               │ 3. Appends to Repl Backlog    │   │                   │   │
│                            │    Circular Buffer: 64MB      │   │                   │   │
│                            └───────────────┬───────────────┘   │                   │   │
│                                            │                   │                   │   │
│                                            │ Asynchronous      │                   │   │
│                                            │ Stream (RESP)     │                   │   │
│                                            ▼                   │                   │   │
│                            ┌───────────────────────────────┐   │                   │   │
│                            │ Socket Output Buffer          │ ─>│ 4. Applies Delta  │   │
│                            └───────────────────────────────┘   │    Offset += len  │   │
│                                                                └───────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Partial Synchronization (PSYNC 2.0)
When a replica temporarily disconnects (e.g. transient network glitch), reconnecting using full database snapshots is catastrophically slow. Redis implements **PSYNC 2.0**:
- **Replication ID (`master_replid`)**: A 40-character pseudo-random string representing the primary's history epoch.
- **Replication Offset (`master_repl_offset`)**: A monotonically increasing 64-bit byte counter representing the total stream bytes processed.
- **Secondary Replication ID (`master_replid2`)**: When a replica is promoted to primary during failover, it sets `master_replid2` to the previous master's ID and records the offset where failover occurred. This allows other sibling replicas to partially sync with the newly promoted master without triggering a full RDB resynchronization!

```bash
# Handshake on Reconnect
REPLICA -> MASTER: PSYNC <master_replid> <offset>
# Case A: Offset exists within master's circular buffer
MASTER -> REPLICA: +CONTINUE <master_replid> (Streams only delta bytes)
# Case B: Offset fell off circular buffer
MASTER -> REPLICA: +FULLRESYNC <master_replid> <offset> (Triggers full RDB snapshot)
```

### 1.2 The Replication Backlog Sizing Formula
The primary maintains an in-memory circular ring buffer: the **Replication Backlog** (`repl-backlog-size`). If a disconnected replica cannot reconnect before its offset is overwritten in the ring buffer, Redis is forced into a **Full Resynchronization (`FULLRESYNC`)**.

A full resync executes a fork (`BGSAVE`), writes a multi-gigabyte RDB snapshot to disk, saturates the network pipe, and causes the replica to flush its entire dataset—often triggering cascading failovers.

$$\text{Replication Backlog Size} = \text{Peak Write Rate (bytes/sec)} \times \text{Max Expected Network Outage Duration (sec)}$$

```text
EXAMPLE CALCULATION:
Peak write volume: 15,000 writes/second @ 1 KB average payload = 15 MB/second
Target resilience window: Survive a 120-second transient network partition
Required repl-backlog-size = 15 MB/s * 120s = 1.8 GB (Default 1 MB is catastrophically inadequate!)
```

### 1.3 Diskless Replication (`repl-diskless-sync`)
In environments with slow disk I/O (e.g. AWS EBS gp2/gp3 volumes):
- Standard replication forks `BGSAVE`, writes the RDB file to disk, and then streams the file to the network socket.
- Setting `repl-diskless-sync yes` instructs the primary process to spawn a child process that streams RDB serialized bytes **directly into replica sockets** without touching the local disk, eliminating disk I/O bottlenecks.

---

## 2. Redis Sentinel: Quorum-Based High Availability

Redis Sentinel is a distributed monitoring consensus cluster operating alongside Redis instances.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        REDIS SENTINEL FAILOVER CHOREOGRAPHY                            │
│                                                                                        │
│   SENTINEL 1                   SENTINEL 2                      SENTINEL 3              │
│   ┌──────────────┐             ┌──────────────┐                ┌──────────────┐        │
│   │ Detects      │             │ Confirms     │                │ Confirms     │        │
│   │ SDOWN        │ ──────────> │ SDOWN        │ ─────────────> │ SDOWN        │        │
│   └──────┬───────┘             └──────────────┘                └──────────────┘        │
│          │                                                                             │
│          ▼ Quorum Reached (2 of 3)                                                     │
│   ┌───────────────────────────────────────────────────────────────────────────┐        │
│   │ Transition to ODOWN (Objective Down)                                      │        │
│   │ Sentinels run Raft-like election to choose Leader Sentinel                │        │
│   │ Leader Sentinel executes Failover on Redis instances                      │        │
│   └─────────────────────────────────────┬─────────────────────────────────────┘        │
│                                         │                                              │
│                                         ▼                                              │
│                        PROMOTION CRITERIA RANKING:                                     │
│                        1. Lowest `replica-priority` (0 = never promote)               │
│                        2. Highest replication offset (least data lost)                 │
│                        3. Lowest run ID (deterministic tie-breaker)                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 The Split-Brain Data Loss Hazard
A classic failure mode occurs when a network partition separates the Master from the Sentinels:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    THE PARTITION SPLIT-BRAIN FAILURE SCENARIO                          │
│                                                                                        │
│   PARTITION A (Isolated Minority)                  PARTITION B (Majority Quorum)       │
│   ┌────────────────────────────────┐               ┌─────────────────────────────────┐ │
│   │ Rogue Client writes to Old M1  │               │ Sentinels (2 of 3) reach quorum │ │
│   │ (M1 still thinks it is Master) │               │ Promote Replica R1 -> New M2    │ │
│   │ M1 executes writes in memory   │               │ App Client 2 writes to New M2   │ │
│   └────────────────────────────────┘               └─────────────────────────────────┘ │
│                                                                                        │
│   WHEN PARTITION HEALS:                                                                │
│   M1 is demoted to a replica of M2.                                                    │
│   M1 flushes its entire dataset to sync with M2!                                       │
│   ALL WRITES EXECUTED BY CLIENT 1 ON M1 ARE PERMANENTLY DESTROYED!                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Production Defense: Guarding Write Quorum
Configure Redis to reject writes if it loses communication with replicas:
```bash
# redis.conf on Master nodes
# Require at least 1 replica acknowledged within 10 seconds to allow writes
min-replicas-to-write 1
min-replicas-max-lag 10
```
If a network partition isolates the primary, after 10 seconds it will reject all subsequent write commands with an error (`NOREPLICAS`), preventing rogue writes that would later be overwritten.

---

## 3. Redis Cluster: Horizontal Sharding across 16,384 Hash Slots

Redis Cluster partitions the dataset horizontally across multiple primary nodes using a deterministic hash slot algorithm:

$$\text{Slot Index} = \text{CRC16}(\text{key}) \pmod{16384}$$

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        REDIS CLUSTER HASH SLOT TOPOLOGY                                │
│                                                                                        │
│      NODE 1 (Primary)            NODE 2 (Primary)            NODE 3 (Primary)          │
│      Slots: 0 – 5460             Slots: 5461 – 10922         Slots: 10923 – 16383      │
│      ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐       │
│      │ Handles 1/3 keys│         │ Handles 1/3 keys│         │ Handles 1/3 keys│       │
│      └────────┬────────┘         └────────┬────────┘         └────────┬────────┘       │
│               │ Replication               │ Replication               │ Replication     │
│               ▼                           ▼                           ▼                │
│      ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐       │
│      │ Node 1 Replica  │         │ Node 2 Replica  │         │ Node 3 Replica  │       │
│      └─────────────────┘         └─────────────────┘         └─────────────────┘       │
│                                                                                        │
│      CLUSTER BUS: Gossip Protocol over port 16379 (Node PING/PONG, Fail Detection)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Why Exactly 16,384 Slots?
While CRC16 can generate $2^{16} = 65,536$ unique values, Redis deliberately constrains slots to **16,384**:
1. **Heartbeat Packet Bitmap Overhead**: Nodes continually gossip their slot allocation using a bitmap. A 16,384-slot bitmap takes exactly $16,384 / 8 = 2,048\text{ bytes}$ ($2\text{ KB}$). A 65,536-slot bitmap would require 8 KB per heartbeat packet, saturating cluster network interfaces.
2. **Cluster Scale Limits**: Redis clusters rarely exceed 1,000 master nodes. 16,384 provides roughly 16 slots per node at maximum scale, preserving optimal distribution.

### 3.2 The Hash Tag Mechanism (`{hashtag}`)
By default, operations spanning multiple keys (such as transactions `MULTI/EXEC` or `MGET`) fail with a `CROSSSLOT Keys in request don't hash to the same slot` error if keys map to different slots.
- **The Solution**: Wrap the co-locating identifier in curly braces `{}`:
  ```bash
  # Key 1: user:{1004}:profile  -> CRC16 runs ONLY on "1004" -> Slot 8812
  # Key 2: user:{1004}:orders   -> CRC16 runs ONLY on "1004" -> Slot 8812
  # Now atomic Lua scripts and multi-key commands execute safely on the same node!
  ```

### 3.3 Redirection Mechanics: `MOVED` vs. `ASK`
When a client contacts a cluster node with a key that belongs elsewhere:
- **`MOVED <slot> <ip>:<port>`**: Permanent redirect. The slot has moved permanently. Smart clients (e.g. Lettuce, Jedis) intercept this, execute the command on the target node, and update their local client-side slot routing cache table.
- **`ASK <slot> <ip>:<port>`**: Temporary redirect during active online slot migration. The client must send an `ASKING` command to the target node, followed immediately by the query, but **does not** update its permanent slot cache.

---

## 4. Architectural Comparison: Standalone vs. Sentinel vs. Cluster

| Dimension | Standalone Redis | Redis Sentinel | Redis Cluster |
|---|---|---|---|
| **Primary Focus** | Simplicity, caching | High Availability (Automated failover) | Horizontal write scalability & HA |
| **Max Memory Capacity** | Limited to single host RAM | Limited to single host RAM | Aggregated RAM across all masters (TBs) |
| **Failover Mechanism** | Manual human intervention | Sentinels achieve quorum consensus | Decentralized node gossip voting |
| **Multi-Key Operations** | Fully supported | Fully supported | Supported only if keys share `{hashtag}` |
| **Network Architecture** | 1 port (6379) | 2 tiers (6379 for Redis, 26379 for Sentinel)| 2 ports per node (6379 client, 16379 bus)|
| **Client Complexity** | Simple single-connection client | Sentinel-aware connection pool | Smart routing client with slot caching |

---

## Related Documentation

- [Redis Eviction Policies & Memory Management](./redis-eviction-policies.md)
- [Redis Advanced Data Structures & Memory Math](./redis-advanced-data-structures.md)
- [Redis Lua Scripting & Distributed Locks](./redis-lua-scripting-distributed-locks.md)
- [Split-Brain & Multi-Leader Divergence in Distributed Databases](../system-design/split-brain-multi-leader-divergence.md)
