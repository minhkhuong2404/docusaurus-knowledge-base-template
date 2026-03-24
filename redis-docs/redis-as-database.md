---
id: redis-as-database
title: "Redis as In-Memory Database"
slug: redis-as-database
description: Redis as a primary in-memory database — persistence mechanisms (RDB, AOF), durability guarantees, data modeling patterns, and when to use Redis as your primary store vs cache.
tags: [redis, database, in-memory, persistence, rdb, aof, backend]
---

# Redis as In-Memory Database

While commonly used as a cache, Redis can serve as a **primary database** for workloads where speed matters more than ACID guarantees and where the dataset fits in RAM. Understanding its persistence and durability characteristics is essential for senior engineers.

---

## Redis as Primary DB vs Cache

| Dimension | Redis as Cache | Redis as Primary DB |
|-----------|---------------|---------------------|
| Data loss tolerance | Acceptable | Not acceptable |
| Dataset size | Can exceed RAM (use eviction) | Must fit in RAM |
| Persistence | Optional | Required (RDB + AOF) |
| Consistency | Eventual | Depends on config |
| Recovery time | Fast (warm cache) | Depends on AOF size |
| Use case | Speed layer on top of real DB | Sessions, leaderboards, real-time data |

---

## Persistence Mechanisms

### 1. RDB (Redis Database Snapshot)

Creates a **point-in-time binary snapshot** of the entire dataset via `fork()`.

```bash
# redis.conf
save 3600 1      # Snapshot if 1+ change in last 3600s
save 300 100     # Snapshot if 100+ changes in last 300s
save 60 10000    # Snapshot if 10000+ changes in last 60s

# Manual trigger
BGSAVE           # Forks Redis process, writes snapshot in background
LASTSAVE         # Unix timestamp of last successful save

# Disable all saving
save ""          # Pure cache mode — no persistence
```

**How RDB fork() works:**
```
Main Redis Process (parent)
    ↓ fork()
Child Process (snapshot writer)
    ↓
Writes binary .rdb file to disk

Main process continues serving requests.
Copy-on-Write (CoW): modified pages are copied when written.
Both processes see the same memory initially.
```

**RDB trade-offs:**

| Pro | Con |
|-----|-----|
| Compact single file | Data loss between snapshots |
| Fast DB load on restart | fork() can cause latency spike (large heaps) |
| Good for backups | Not suitable for strict durability |
| Minimal IO during operation | 10GB heap → 100–200ms latency spike on fork |

**Monitoring RDB fork latency:**
```bash
INFO latencystats
LATENCY HISTORY fork
# Or check: rdb_last_bgsave_time_sec
```

### 2. AOF (Append-Only File)

Logs every **write command** to disk. On restart, Redis replays the AOF to rebuild the dataset.

```bash
# redis.conf
appendonly yes
appendfsync everysec    # Recommended — sync to disk every second
# appendfsync always    # Sync after every write (slowest, most durable)
# appendfsync no        # OS decides when to flush (fastest, least safe)
```

**AOF fsync modes:**

| Mode | Durability | Performance | Risk |
|------|-----------|-------------|------|
| `always` | Max (~0 data loss) | Slow (disk write per command) | Low throughput |
| `everysec` | ~1 second of data loss | Good | Recommended |
| `no` | OS-controlled | Fastest | Up to kernel buffer loss on crash |

**AOF Rewrite (compaction):**

```bash
# AOF grows indefinitely — rewrite compresses it
BGREWRITEAOF   # Background AOF rewrite

# Auto-rewrite when AOF grows
auto-aof-rewrite-percentage 100   # Rewrite when AOF doubles in size
auto-aof-rewrite-min-size 64mb   # Minimum size before rewrite
```

During rewrite, Redis forks and writes a new AOF from current in-memory state. Parent continues appending to the old AOF; differences are merged when the child completes.

**AOF trade-offs:**

| Pro | Con |
|-----|-----|
| Near-real-time durability | Larger file than RDB |
| Can reconstruct to exact state | Slower restart (replay all commands) |
| Human-readable format | AOF rewrite causes another fork() spike |
| `everysec` = at most 1s data loss | Old commands not compacted until rewrite |

### 3. RDB + AOF (Recommended for Production)

Use both for the best of both worlds:

```bash
appendonly yes
appendfsync everysec
save 3600 1
save 300 100

# On restart: Redis prefers AOF (more complete); RDB used as backup
aof-use-rdb-preamble yes   # Redis 4.0+: AOF starts with RDB snapshot header → faster rewrite
```

**Recovery scenarios:**

| Failure | RDB only | AOF only | Both |
|---------|----------|---------- |------|
| Server crash | Lose since last snapshot | Lose up to 1s | Lose up to 1s |
| Corrupted AOF | N/A | Need `redis-check-aof` repair | RDB as fallback |
| Disk failure | Lose everything | Lose everything | Same |

---

## Data Modeling for Redis as Primary DB

### Use Case: User Sessions

```bash
# One hash per session (rich structure, partial field update)
HSET session:abc123 userId "1234" role "admin" expiresAt "1700000000"
EXPIRE session:abc123 3600

# Index by userId (for "show all sessions for user")
SADD user:1234:sessions "abc123"
```

### Use Case: Real-Time Leaderboard

```bash
# Sorted Set — atomic, O(log N) updates
ZADD game:leaderboard 15000 "alice"
ZADD game:leaderboard 12500 "bob"
ZINCRBY game:leaderboard 500 "alice"          # Atomic score increment
ZREVRANK game:leaderboard "alice"              # Rank (0-indexed) → 0 (first place)
ZREVRANGEBYSCORE game:leaderboard +inf -inf WITHSCORES LIMIT 0 10   # Top 10
```

### Use Case: Rate Limiting (Primary Store)

```bash
-- Lua script: atomic sliding window rate limit
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window * 1000)
local count = redis.call('ZCARD', key)
if count < limit then
    redis.call('ZADD', key, now, now .. '-' .. math.random())
    redis.call('PEXPIRE', key, window * 1000)
    return 1  -- allowed
end
return 0  -- blocked
```

### Use Case: Distributed Lock (Redlock)

```bash
# Single-node lock (sufficient for most cases)
SET lock:resource "owner-uuid" NX EX 30
# NX: only set if not exists
# EX: auto-release after 30s (prevents deadlock if owner crashes)

# Release lock (Lua for atomicity — don't release if owner changed)
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
```

**Redlock (multi-node):** For stronger guarantees, acquire lock on N/2+1 nodes:
```python
# Redlock algorithm (5 Redis nodes)
nodes = [redis1, redis2, redis3, redis4, redis5]
acquired = sum(1 for r in nodes
               if r.set("lock:key", token, nx=True, ex=30))
if acquired >= 3:  # Majority
    return True  # Lock acquired
```

**Clock drift caveat:** Redlock assumes clocks don't drift significantly. Martin Kleppman's critique: use fencing tokens (monotonic counter) for true linearizability.

---

## Durability Guarantees by Configuration

| Config | Max Data Loss | Throughput | Use Case |
|--------|--------------|------------|----------|
| No persistence | 100% | Highest | Pure cache |
| RDB only (60s) | Up to 60s | High | Cache with backup |
| AOF `no` | OS buffer | High | Balanced |
| AOF `everysec` | Up to 1s | Medium-High | Recommended primary |
| AOF `always` | ~0 | Low | Critical data |
| RDB + AOF `everysec` | Up to 1s | Medium-High | Production DB |

---

## Redis vs Traditional Databases

| | Redis | PostgreSQL / MySQL | MongoDB |
|---|---|---|---|
| Storage | In-memory (optional disk) | Disk-first | Disk-first |
| Throughput | 100K–1M+ ops/sec | 1K–100K ops/sec | 10K–100K ops/sec |
| Query language | Command-based | SQL | Query DSL |
| Joins | ❌ (model differently) | ✅ | ❌ (embed/link) |
| Transactions | Limited (MULTI/EXEC) | Full ACID | Multi-doc (limited) |
| Dataset size | Limited by RAM | Unlimited | Unlimited |
| Full-text search | Limited | pgvector, FTS | Atlas Search |
| Best for | Speed-critical, structured data | Complex queries, ACID | Flexible documents |

---

## When to Use Redis as Primary DB

**Good fit:**
- Sessions, tokens, temporary data with natural TTL
- Leaderboards, rankings, counters
- Rate limiting, quota tracking
- Short-lived job/task queues
- Real-time collaborative features (cursors, presence)
- Configuration/feature flags

**Bad fit:**
- Complex relational queries (joins, aggregations)
- Large datasets that don't fit in RAM
- Long-term audit logs (use Elasticsearch or cold storage)
- Financial transactions requiring ACID guarantees
- Full-text search (use Elasticsearch)
