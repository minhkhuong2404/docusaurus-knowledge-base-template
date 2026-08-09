---
id: redis-overview
title: "Redis: Overview & Architecture"
slug: redis-overview
description: Redis architecture internals, single-threaded model, I/O multiplexing, and use case decision guide for senior engineers.
tags: [redis, in-memory, cache, backend, architecture]
---

import RedisReactorPatternDiagram from '@site/src/components/RedisReactorPatternDiagram';
import RedisClusterReplicationDiagram from '@site/src/components/RedisClusterReplicationDiagram';

# Redis: Overview & Architecture

Redis (Remote Dictionary Server) is an open-source, in-memory key-value data store optimized for sub-millisecond data retrieval. It acts as an in-memory database, cache, message broker, and streaming engine.

---

## Why Redis is Fast: The Single-Threaded Event Loop

Redis processes data commands sequentially using a single-threaded **Reactor Event Loop** (`ae.c`) backed by OS I/O multiplexing (`epoll` on Linux, `kqueue` on macOS):

<RedisReactorPatternDiagram />

### Why Single-Threaded Command Execution Works
1. **Eliminates Thread Lock Contention**: No mutex locks, spinlocks, or context-switching overhead across commands.
2. **CPU Cache Locality**: Operations execute in RAM; CPU cache line invalidations are minimized.
3. **RAM Speed Execution**: Operations access RAM frames directly ($\approx 50\text{--}100\text{ ns}$ access times vs $\approx 10\text{ ms}$ disk seeks).

:::note[Redis 6.0+ Multi-Threaded I/O]
Since Redis 6.0, socket reading, network protocol parsing, and response serialization are delegated to background I/O threads (`io-threads = 4`). However, **command execution on in-memory data structures remains strictly single-threaded**.
:::

---

<details>
<summary>🔬 Senior deep-dive: Memory Allocator (`jemalloc`) & `redisObject` Header</summary>

### 1. `redisObject` Memory Header Layout
Every key-value entry in Redis is wrapped in a 16-byte `redisObject` structure:

```c
typedef struct redisObject {
    unsigned type:4;       // 4 bits: OBJ_STRING, OBJ_LIST, OBJ_SET, OBJ_ZSET, OBJ_HASH
    unsigned encoding:4;   // 4 bits: OBJ_ENCODING_RAW, OBJ_ENCODING_INT, OBJ_ENCODING_ZIPLIST/LISTPACK
    unsigned lru:24;       // 24 bits: LRU clock timestamp or LFU logarithmic counter
    int refcount;          // 4 bytes: Reference count for shared integer objects (0..9999)
    void *ptr;             // 8 bytes: Pointer to actual underlying data structure payload
} robj;
```

### 2. `jemalloc` Memory Allocation & Fragmentation Ratio
Redis defaults to `jemalloc` for memory allocation. `jemalloc` allocates memory in power-of-two bins ($8\text{ B}, 16\text{ B}, 32\text{ B}, 64\text{ B}, \dots$).

- **Memory Fragmentation Ratio**:
  $$\text{Fragmentation Ratio} = \frac{\text{used\_memory\_rss}}{\text{used\_memory}}$$
- **Ratio $> 1.5$**: High fragmentation (RAM wasted due to `jemalloc` bin padding or un-purged allocation holes). Execute `MEMORY PURGE` or enable active defragmentation (`activedefrag yes`).
- **Ratio $< 1.0$**: The system is swapping Redis RAM pages to disk! Expect catastrophic latency spikes.

</details>

---

## Redis Cluster Architecture & Hash Slots

Redis Cluster scales writes horizontally across multiple master nodes using **16,384 Hash Slots**:

<RedisClusterReplicationDiagram />

### Hash Slot Allocation Mechanics
Every key is assigned to one of the 16,384 slots via CRC16:

$$\text{Slot Index} = \text{CRC16}(\text{key}) \pmod{16384}$$

- **Hash Tags (`{...}`)**: Placing `{...}` inside a key name forces Redis to hash *only* the contents of the braces.
  - Keys `{user:1001}:profile` and `{user:1001}:orders` hash to the exact same slot index, enabling multi-key operations (MGET, Lua scripts, transactions) across co-located keys in a cluster.

---

## Redis Deployment Patterns

| Pattern | High Availability | Read/Write Scale | Failover Mechanism |
|---|---|---|---|
| **Standalone** | ❌ None | Single node limit | Manual restart. |
| **Sentinel** | ✅ High | Read scale via replicas; Single Master write | Sentinels monitor nodes, run quorum election, and promote replica ($10\text{--}30\text{ s}$). |
| **Redis Cluster** | ✅ High | Horizontal Write & Read scaling | Sharded across 16,384 slots; master failure triggers automatic replica promotion by peers. |

---

## Redis vs Memcached

| Dimension | Redis | Memcached |
|---|---|---|
| **Data Structures** | Rich (Strings, Hashes, Lists, Sets, Sorted Sets, Bitmaps, HyperLogLog, Streams). | Simple Strings / Raw Bytes only. |
| **Persistence** | RDB Snapshots & AOF Logs. | Volatile memory only (cleared on reboot). |
| **Replication & Sharding** | Native Primary-Replica & Redis Cluster (16,384 slots). | Client-side Consistent Hashing only. |
| **Pub/Sub & Scripting** | Built-in Pub/Sub, Streams, Lua Scripting, Redis Functions. | None. |

---

## Interview Questions

### Q1. Why is Redis described as single-threaded, and how does it handle thousands of concurrent client connections?
> Command execution on Redis data structures is strictly single-threaded to eliminate lock contention, race conditions, and thread context switching. High concurrency is achieved through an OS **I/O Multiplexing Reactor Event Loop** (`epoll` / `kqueue`). A single thread monitors thousands of client sockets, processing readiness events and executing in-memory operations in sub-microsecond bursts. In Redis 6.0+, multi-threading is used only for socket network parsing and response writes.

### Q2. What are Redis Hash Slots and Hash Tags, and why are they important for cluster operations?
> Redis Cluster partitions data across **16,384 Hash Slots** using $\text{CRC16}(key) \pmod{16384}$. Multi-key commands (e.g., `MGET`, `SUNION`, Lua scripts) require all target keys to reside on the same cluster node. **Hash Tags** (braces `{...}`) force Redis to compute the CRC16 hash *only* on the text inside the braces. For example, `{user:1001}:profile` and `{user:1001}:orders` yield the exact same slot, enabling atomic multi-key operations in a sharded cluster.

### Q3. What latency risk occurs when Redis forks a child process during RDB persistence (`BGSAVE`)?
> When Redis invokes `BGSAVE` or `BGREWRITEAOF`, it executes a `fork()` system call to spawn a child process. The child relies on Linux **Copy-on-Write (CoW)** to snapshot memory. If the Redis instance has a large RSS memory footprint (e.g., 15 GB) and high write volume, allocation of parent page tables during `fork()` can freeze the single-threaded event loop for $50\text{--}200\text{ ms}$, causing latency spikes.

---

## See Also

- [Redis Eviction Policies & Memory Management](./redis-eviction-policies.md)
- [Redis Clustering & Replication](./redis-clustering-replication.md)
- [Redis Distributed Cache Patterns](./redis-distributed-cache.md)
