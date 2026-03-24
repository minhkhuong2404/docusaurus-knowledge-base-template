---
id: redis-overview
title: "Redis: Overview & Architecture"
slug: redis-overview
description: Redis architecture internals, single-threaded model, I/O multiplexing, and use case decision guide for senior engineers.
tags: [redis, in-memory, cache, backend, architecture]
---

# Redis: Overview & Architecture

Redis (Remote Dictionary Server) is an open-source, in-memory data structure store used as a database, cache, message broker, and streaming engine. Its combination of simplicity, speed, and rich data structures makes it ubiquitous in production systems.

---

## Why Redis is Fast

Redis is often described as "single-threaded" — but this requires nuance:

```
Single-threaded event loop (command processing)
         ↓
    Epoll/Kqueue (I/O multiplexing — handles thousands of connections)
         ↓
    Background threads (AOF fsync, object eviction, lazy delete)
```

### Single-Threaded Command Execution

All Redis commands execute **sequentially in a single thread**. This design:
- Eliminates locking overhead (no mutexes needed for data structures)
- Makes all operations **atomic by default**
- Simplifies reasoning about state consistency
- Avoids context-switching overhead between threads

**Redis 6.0+:** Added **I/O threading** — network reads/writes are parallelized while command *execution* remains single-threaded. This removes the I/O bottleneck for high-connection workloads.

### I/O Multiplexing with Epoll

Redis uses `epoll` (Linux) / `kqueue` (macOS) / `IOCP` (Windows) to handle thousands of simultaneous client connections with a single thread:

```
Thousands of client connections
        ↓
    epoll (single syscall monitors all file descriptors)
        ↓
    Event loop: "these 47 clients have data ready"
        ↓
    Process each client request sequentially
```

This is the same model used by Node.js and Nginx — efficient for I/O-bound workloads where commands are fast.

---

## Memory Architecture

Redis stores all data in RAM (optionally persisted to disk):

```
Memory Layout:
┌─────────────────────────────────────┐
│  Redis Object (robj)                │
│  ├── type  (string, list, hash...)  │
│  ├── encoding (ziplist, hashtable)  │
│  └── ptr → actual data              │
└─────────────────────────────────────┘
```

### Memory Encoding Optimization

Redis automatically uses **compact encodings** for small collections to save memory:

| Data Type | Small Encoding | Large Encoding | Threshold |
|-----------|---------------|----------------|-----------|
| Hash | `ziplist`/`listpack` | `hashtable` | >128 fields or field >64 bytes |
| List | `listpack`/`quicklist` | `quicklist` | >128 elements or element >64 bytes |
| Set | `listpack`/`intset` | `hashtable` | >128 elements |
| Sorted Set | `listpack` | `skiplist` + `hashtable` | >128 elements |
| String | `int` (raw int) | `embstr`/`raw` | >20 chars |

**Why this matters:** A Redis hash with <64 fields uses a flat array (`ziplist`) instead of a full hash table — dramatically reducing memory overhead. Designing your key structure to stay within these thresholds is a key performance optimization.

---

## Redis Data Persistence

| Mode | Mechanism | Recovery Point | Use Case |
|------|-----------|----------------|----------|
| **RDB** (Snapshot) | Fork + binary dump at intervals | At last snapshot | Fast recovery, small files |
| **AOF** (Append-Only File) | Log every write command | Near real-time | Durability, audit trail |
| **No persistence** | Pure in-memory | Data lost on restart | Cache-only deployments |
| **RDB + AOF** | Both modes combined | AOF granularity | Production recommended |

```bash
# RDB: save snapshot every 60s if ≥1000 changes
save 60 1000

# AOF: sync every second (compromise between durability and performance)
appendfsync everysec
# Options: always (safest), everysec (default), no (fastest, risky)
```

**RDB fork() latency:** When Redis forks to create a snapshot, the kernel must copy page tables. On a 10 GB instance, this fork can cause a **50–100ms latency spike**. Use `latency monitor` to detect this.

---

## Redis Architecture Patterns

### Standalone
Single Redis instance — simple but single point of failure.

### Sentinel (High Availability)
```
Master ──→ Replica 1
       ──→ Replica 2
Sentinel 1 / Sentinel 2 / Sentinel 3  (quorum-based monitoring)
```
- Sentinels vote to promote a replica if master fails
- Client libraries use Sentinel to discover the current master
- **Failover time:** typically 10–30 seconds

### Cluster (Horizontal Scaling)
```
   Slot 0–5460        Slot 5461–10922     Slot 10923–16383
   [Master A]          [Master B]          [Master C]
   [Replica A]         [Replica B]         [Replica C]
```
- Hash slots (0–16383) sharded across masters
- `CLUSTER KEYSLOT mykey` → tells you which slot a key maps to
- Keys in different slots cannot be used in multi-key operations
- Use **hash tags** `{user}.orders` and `{user}.profile` to force co-location on same slot

---

## Common Use Cases

| Use Case | Redis Features Used | Senior Consideration |
|----------|--------------------|--------------------|
| Session store | Strings + TTL | Sticky sessions vs distributed session |
| Rate limiting | INCR + EXPIRE or Sorted Sets | Token bucket vs sliding window |
| Distributed locks | SET NX EX (Redlock) | Clock drift, lock renewal, fencing tokens |
| Leaderboards | Sorted Sets | ZRANGEBYSCORE vs ZRANGEBYRANK |
| Real-time feeds | Streams or Pub/Sub | At-most-once vs at-least-once delivery |
| Cache | Strings/Hashes + TTL + eviction | Stampede, dogpile, warm-up strategy |
| Queue | Lists (BLPOP/RPUSH) or Streams | Visibility timeout, dead-letter queue |
| Geospatial | GEO commands | GEORADIUS for proximity queries |

---

## Redis vs Memcached

| | Redis | Memcached |
|---|---|---|
| Data types | Rich (12+ types) | Strings only |
| Persistence | RDB + AOF | None |
| Replication | Built-in | None (requires client) |
| Pub/Sub | Yes | No |
| Lua scripting | Yes | No |
| Cluster | Native cluster | Consistent hash (client-side) |
| Threading | Single-threaded exec + I/O threads | Multi-threaded |
| Memory efficiency | Slightly higher overhead | Lower overhead for simple strings |

**Choose Redis** for almost all new projects. **Choose Memcached** only for pure string caching at extreme throughput where Redis Cluster latency is measurable.

---

## Redis Command Complexity Reference

| Command | Complexity | Notes |
|---------|-----------|-------|
| GET, SET, INCR | O(1) | Hash table lookup |
| HGETALL | O(n) | n = number of fields |
| LRANGE | O(S+N) | S = offset from head, N = elements returned |
| ZADD | O(log N) | Skip list insertion |
| SMEMBERS | O(n) | Returns all members |
| SORT | O(N+M*log(M)) | N = elements, M = returned elements — **dangerous on large sets** |
| KEYS pattern | O(n) | **Never use in production** — use SCAN instead |

> **Production rule:** Never run `KEYS *` in production — it blocks the single-threaded event loop and causes latency spikes. Use `SCAN` with a cursor instead.

---

## Key Naming Conventions

```bash
# Pattern: object-type:id:field
user:1234:profile
user:1234:sessions

# Hash tag for cluster slot co-location
{user:1234}:profile
{user:1234}:orders   # same slot as above
{user:1234}:sessions

# Versioned keys for safe migrations
user:v2:1234:profile

# Avoid: key names longer than 100 bytes waste memory
# Avoid: key names with spaces or special chars (use : and _ as delimiters)
```
