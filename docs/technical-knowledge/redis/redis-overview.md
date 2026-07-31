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

Redis (Remote Dictionary Server) is an open-source, in-memory data structure store used as a database, cache, message broker, and streaming engine. Its combination of simplicity, speed, and rich data structures makes it ubiquitous in production systems.

#### 👶 Beginner Concept: The "Librarian's Memory" Analogy
Imagine you ask a massive library for a specific book on 18th Century Rome.
- **Traditional Database (Disk):** The librarian takes your request, physically walks 5 floors down into the basement (the Hard Drive), pulls out a ledger, finds the row, writes it down, and walks back up. It takes SECONDS.
- **Redis (In-Memory):** The librarian instantly snaps her fingers and recites the exact paragraph you asked for strictly from her own Short-Term Memory (RAM). It takes MILLISECONDS.

The tradeoff? When the librarian leaves work (the server reboots), her short-term memory is wiped. That's why Redis is perfect for *caching* and active sessions, but dangerous as the sole source of truth for critical long-term billing data.

---

## Why Redis is Fast

Redis is often described as "single-threaded" — but this requires nuance:

<RedisReactorPatternDiagram />

---

## Redis Architecture Patterns

<RedisClusterReplicationDiagram />() latency:** When Redis forks to create a snapshot, the kernel must copy page tables. On a 10 GB instance, this fork can cause a **50–100ms latency spike**. Use `latency monitor` to detect this.

---

## Redis Architecture Patterns

### Standalone
Single Redis instance — simple but single point of failure.

### Sentinel (High Availability)

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

## Quick Start with Docker

```bash
# Run Redis locally
docker run --name redis -p 6379:6379 -d redis:latest

# Connect via CLI
docker exec -it redis redis-cli
```

## Spring Boot Integration

Add the dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

Configure in `application.yml`:

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: your_password  # if set
      timeout: 2000ms
```

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
