---
id: redis-clustering-replication
title: "Redis Clustering, Replication & High Availability"
slug: redis-clustering-replication
description: Redis replication mechanics, Sentinel for HA failover, Redis Cluster sharding, and production deployment patterns for senior engineers.
tags: [redis, cluster, replication, sentinel, high-availability, backend]
---

import RedisClusterReplicationDiagram from '@site/src/components/RedisClusterReplicationDiagram';

# Redis Clustering, Replication & High Availability

<RedisClusterReplicationDiagram />

---

## Master-Replica Replication Mechanics

Redis uses **asynchronous primary-replica replication** to provide read scaling and data redundancy.

```
+---------------------------------------------------------------+
|  Master Node (Primary) -- Handles 100% of Writes              |
|  - Appends to Replication Backlog Buffer (repl-backlog-size)   |
+-------------------------------+-------------------------------+
                                | Asynchronous Replication Stream
                                v (PSYNC)
+-------------------------------+-------------------------------+
|  Replica 1 (Read-Only)        |  Replica 2 (Read-Only)        |
+-------------------------------+-------------------------------+
```

### Full Synchronization vs Partial Synchronization (`PSYNC`)
- **Partial Synchronization (`PSYNC master_repl_id offset`)**: When a replica temporarily disconnects, it reconnects and requests a partial sync. If the missing byte range exists in the Master's in-memory **Replication Backlog Buffer** (`repl-backlog-size`, default $1\text{ MB}$), the master transmits only the missing delta bytes without disk I/O.
- **Full Synchronization**: If the replica has been disconnected longer than the backlog buffer capacity, the Master executes a `BGSAVE` to write a full `RDB` snapshot to disk, streams the RDB file over the network to the replica, and the replica wipes its existing database to load the RDB file.

---

## Sentinel Architecture (High Availability)

Redis Sentinel is an external monitoring and failover management system operating alongside Redis instances:

1. **Subjective Down (`SDOWN`)**: A single Sentinel node loses ping response from a Master for `down-after-milliseconds`.
2. **Objective Down (`ODOWN`)**: Multiple Sentinel nodes confirm `SDOWN` state by reaching quorum agreement (`quorum 2`).
3. **Failover & Election**: Sentinels vote for a Leader Sentinel via Raft-like voting. The Leader Sentinel selects the healthiest Replica (lowest replication lag, highest offset) and promotes it to Master (`replicaof no one`).

---

## Redis Cluster Sharding (16,384 Hash Slots)

Redis Cluster scales writes horizontally across multiple master nodes using **16,384 Hash Slots**:

$$\text{Slot Index} = \text{CRC16}(\text{key}) \pmod{16384}$$

- **`MOVED` Redirect**: If a client sends a command to Node A for a key belonging to Node B, Node A responds with `-MOVED 14328 10.0.0.5:6379`. Smart clients (Lettuce, Jedis) intercept `MOVED` responses and update local slot mapping tables automatically.
- **`ASK` Redirect**: Returned during active cluster resharding when a slot is currently migrating between nodes.

---

## Split-Brain Prevention (`min-replicas-to-write`)

To prevent a network-partitioned Master from accepting writes that will later be overwritten upon cluster recovery, configure:

```bash
# redis.conf
min-replicas-to-write 1
min-replicas-max-lag 10
```

If a Master loses all active replicas or replica lag exceeds 10 seconds, it immediately rejects incoming writes with a `NOREPLICAS` error.

---

## Interview Questions

### Q1. How does Redis replication work and what is the role of the Replication Backlog Buffer?
> Redis replication is asynchronous. All write operations execute on the Master and are streamed asynchronously to Replicas. The Master maintains an in-memory ring buffer called the **Replication Backlog Buffer** (`repl-backlog-size`). If a replica briefly disconnects, it sends a `PSYNC` command containing its last offset. If the missing offsets are still present in the master's backlog buffer, the master sends only the missing byte delta (Partial Sync), avoiding a heavy full RDB disk snapshot.

### Q2. What is the difference between Redis Sentinel and Redis Cluster?
> **Redis Sentinel** provides High Availability (HA) and automatic failover for single-master deployments. All nodes store the complete dataset (no sharding), and write throughput is limited to one master. **Redis Cluster** provides both High Availability AND Horizontal Write Scaling by partitioning data across 16,384 Hash Slots mapped to multiple master nodes, enabling cluster storage and throughput to scale linearly across nodes.

### Q3. How do Hash Tags `{...}` enable multi-key operations in a sharded Redis Cluster?
> Multi-key Redis commands (`MGET`, `MSET`, Lua scripts) require all target keys to reside on the same cluster node. Hash Tags force Redis to compute the CRC16 slot index strictly using the string inside the braces `{...}` instead of the entire key name. For example, `{user:1001}:profile` and `{user:1001}:orders` yield the identical hash slot, enabling multi-key operations across co-located keys on a single node.

---

## See Also

- [Redis Eviction Policies](./redis-eviction-policies.md)
- [Redis Architecture Overview](./redis-overview.md)
- [Redis Distributed Lock (Redlock)](./redis-distributed-lock.md)
