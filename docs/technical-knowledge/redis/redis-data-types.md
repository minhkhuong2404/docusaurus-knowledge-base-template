---
id: redis-data-types
title: "Redis Data Types & Value Types"
slug: redis-data-types
description: Complete guide to Redis data types — Strings, Hashes, Lists, Sets, Sorted Sets, Bitmaps, HyperLogLog, Geospatial, and Streams — with senior-level use cases and encoding internals.
tags: [redis, data-types, backend, cache]
---

import RedisDataTypesDiagram from '@site/src/components/RedisDataTypesDiagram';

# Redis Data Types & Value Types

Redis supports 10 distinct data types, each with specific encoding strategies and use cases. Understanding which type to use — and how Redis encodes it internally — is critical for performance and memory optimization.

<RedisDataTypesDiagram />

---

---

## 1. String

The most fundamental type. A Redis String is a binary-safe byte sequence — not just text. It can hold:
- Text, JSON
- Integers (with atomic increment/decrement)
- Binary data (images, serialized objects)
- **Max size: 512 MB**

```bash
SET user:1 "Alice"                     # Simple string
SET counter 0
INCR counter                           # Atomic increment → 1
INCRBY counter 10                      # → 11
INCRBYFLOAT price 1.50                 # Float increment

SETNX lock "owner"                     # Set if Not eXists (atomic CAS)
SET lock "owner" NX EX 30              # Set + TTL in one command (preferred)

GETSET key newvalue                    # Atomic get-and-set (deprecated: use GETDEL + SET)
MSET k1 v1 k2 v2 k3 v3               # Set multiple (not atomic across keys)
MGET k1 k2 k3                         # Get multiple (single round-trip)
```

### Java (Spring Data Redis)

```java
@Autowired
private StringRedisTemplate stringRedisTemplate;

public void stringExamples() {
    ValueOperations<String, String> ops = stringRedisTemplate.opsForValue();
    ops.set("user:1:name", "Alice");
    ops.set("session:abc", "data", Duration.ofHours(1));

    String name = ops.get("user:1:name");
    Long views = ops.increment("page:views");
}
```

### Internal Encoding

| Value | Encoding | Memory |
|-------|----------|--------|
| Integer ≤ 2^63 | `int` | Shared integer pool for 0–9999 |
| String ≤ 44 bytes | `embstr` | Single allocation, immutable |
| String > 44 bytes | `raw` | Two allocations (robj + SDS) |

```bash
OBJECT ENCODING mykey   # See which encoding Redis chose
```

**Senior insight:** `embstr` is immutable — any modification to a string ≤44 bytes promotes it to `raw`. If you frequently `APPEND` to a key, it immediately becomes `raw`, wasting the embstr optimization.

---

## 2. Hash

A Redis Hash is a dictionary of field→value pairs within a single key. Perfect for representing objects without deserializing the entire value.

```bash
HSET user:1 name "Alice" email "alice@example.com" age 30
HGET user:1 name                        # "Alice"
HMGET user:1 name email                 # Multiple fields, single round-trip
HGETALL user:1                          # All fields (O(n) — avoid on large hashes)
HINCRBY user:1 age 1                    # Atomic field increment
HSETNX user:1 email "new@example.com"  # Set field if not exists
HDEL user:1 email                       # Delete field
HEXISTS user:1 name                     # Check field existence

# Scan through hash fields (avoid HGETALL on huge hashes)
HSCAN user:1 0 MATCH "*" COUNT 100
```

### Java (Spring Data Redis)

```java
public void hashExamples() {
    HashOperations<String, String, String> hashOps = redisTemplate.opsForHash();

    Map<String, String> user = new HashMap<>();
    user.put("name", "Alice");
    user.put("age", "30");
    hashOps.putAll("user:1", user);

    String name = hashOps.get("user:1", "name");
    Map<String, String> allFields = hashOps.entries("user:1");
}
```

### Hash vs String Serialization Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| `SET user:1 "{json}"` | Single GET, simple | Must deserialize everything; can't update one field |
| `HSET user:1 field val` | Atomic per-field update; partial reads | HGETALL is O(n); more commands for complex objects |

**Memory optimization:** Keep hashes under the `hash-max-listpack-entries` threshold (128 by default) to use the compact `listpack` encoding — dramatically lower memory than a full hash table.

```bash
hash-max-listpack-entries 128   # Use listpack up to 128 fields
hash-max-listpack-value 64      # Use listpack if each value ≤ 64 bytes
```

---

## 3. List

A doubly-linked list (internally `quicklist` — a linked list of `listpack` nodes). Supports O(1) push/pop from both ends.

```bash
RPUSH queue "task1" "task2" "task3"     # Push to tail (queue producer)
LPOP queue                              # Pop from head (queue consumer) → "task1"
RPOPLPUSH queue processing             # Atomic: pop from queue, push to processing list
LRANGE queue 0 -1                      # Get all elements (0 to last)
LLEN queue                             # List length
LINDEX queue 0                         # Get element by index (O(n))

# Blocking operations — essential for queue patterns
BLPOP queue 30                          # Block up to 30 seconds waiting for an element
BRPOPLPUSH queue dead-letter 30        # Blocking reliable queue pattern
```

### Java (Spring Data Redis)

```java
public void listExamples() {
    ListOperations<String, String> listOps = redisTemplate.opsForList();

    listOps.rightPush("queue:jobs", "job1");
    listOps.rightPush("queue:jobs", "job2");

    String job = listOps.leftPop("queue:jobs");
    List<String> all = listOps.range("queue:jobs", 0, -1);
}
```

### List as Queue vs Stack

```bash
# Queue (FIFO):
RPUSH queue item    # Producer: push to tail
LPOP  queue         # Consumer: pop from head

# Stack (LIFO):
LPUSH stack item    # Push to head
LPOP  stack         # Pop from head
```

### Reliable Queue Pattern

```bash
# Consumer atomically moves item to processing list
RPOPLPUSH messages:pending messages:processing

# After successful processing:
LREM messages:processing 1 "task-id"

# Recovery: items in messages:processing without heartbeat are re-queued
# This prevents message loss if consumer crashes
```

**Internal encoding:** `quicklist` = doubly-linked list of `listpack` nodes. Each node holds up to `list-max-listpack-size` entries (default: -2 = up to 8 KB per node). This balances memory (compact listpack) with O(1) head/tail operations.

---

## 4. Set

An unordered collection of unique strings. Uses hash table internally (or `listpack`/`intset` for small sets).

```bash
SADD tags "java" "backend" "redis"
SISMEMBER tags "java"                   # O(1) membership check
SCARD tags                              # Size → 3
SMEMBERS tags                           # All members (avoid on large sets)
SRANDMEMBER tags 2                      # 2 random members (no removal)
SPOP tags                               # Remove and return random member

# Set operations — great for social graphs, feature flags
SINTER set1 set2                        # Intersection
SUNION set1 set2                        # Union
SDIFF set1 set2                         # Difference (in set1 but not set2)
SINTERSTORE dest set1 set2              # Store intersection result
```

### Java (Spring Data Redis)

```java
public void setExamples() {
    SetOperations<String, String> setOps = redisTemplate.opsForSet();

    setOps.add("tags:post:1", "redis", "java", "backend");
    Boolean isMember = setOps.isMember("tags:post:1", "redis");
    Set<String> members = setOps.members("tags:post:1");
}
```

### Use Cases

| Use Case | Pattern |
|----------|---------|
| Unique visitors | `SADD visitors:2024-01-15 user:123` |
| Tags / labels | `SADD article:42:tags "redis" "backend"` |
| Friend lists | `SINTERSTORE mutual user:1:friends user:2:friends` |
| Permission flags | `SADD user:1:permissions "READ" "WRITE"` |
| Deduplication | `SADD processed:emails "email-hash"` |

**`intset` encoding:** If a Set contains only integers and has ≤ 512 members, Redis uses a compact sorted integer array instead of a hash table — 5–10x more memory efficient.

---

## 5. Sorted Set (ZSet)

The most powerful Redis type — a Set where every member has a **score** (float). Members are stored in score order. Backed by both a **skip list** (for ordered operations) and a **hash table** (for O(1) score lookup).

```bash
ZADD leaderboard 1500.5 "alice"
ZADD leaderboard 2300 "bob" 1200 "charlie"
ZSCORE leaderboard "alice"              # Get score → 1500.5
ZINCRBY leaderboard 100 "alice"        # Increment score atomically
ZRANK leaderboard "alice"              # Rank (0-indexed, lowest score first) → 1
ZREVRANK leaderboard "alice"           # Rank from highest score → 1

ZRANGE leaderboard 0 2                 # Top 3 by score ascending
ZREVRANGE leaderboard 0 2              # Top 3 by score descending  
ZRANGEBYSCORE leaderboard 1000 2000   # Members with score 1000–2000
ZRANGEBYSCORE leaderboard -inf +inf WITHSCORES LIMIT 0 10  # Paginated

ZREM leaderboard "charlie"
ZCARD leaderboard                      # Number of members
ZCOUNT leaderboard 1000 2000          # Count members in score range
```

### Java (Spring Data Redis)

```java
public void sortedSetExamples() {
    ZSetOperations<String, String> zsetOps = redisTemplate.opsForZSet();

    zsetOps.add("leaderboard", "alice", 1500);
    zsetOps.add("leaderboard", "bob", 2300);

    Set<ZSetOperations.TypedTuple<String>> top3 =
        zsetOps.reverseRangeWithScores("leaderboard", 0, 2);
}
```

### Advanced Sorted Set Patterns

```bash
# Rate limiting with Sorted Set (sliding window)
ZADD user:1:requests (timestamp) (timestamp)    # Add request timestamp as score
ZREMRANGEBYSCORE user:1:requests -inf (now - window)  # Remove old entries
ZCARD user:1:requests                            # Count recent requests

# Priority queue (lower score = higher priority)  
ZADD pq 1 "urgent-task"
ZADD pq 10 "low-priority-task"
ZPOPMIN pq                              # Pop lowest score (highest priority)

# Leaderboard with tie-breaking
ZADD board 1000 "alice_user:1"          # Secondary sort by lexicographic member name
ZRANGEBYLEX board "[" "+" LIMIT 0 10   # When all scores equal, sort lexicographically
```

---

## 6. Bitmap

Not a distinct type — bitmaps are stored as Strings but operated on at the bit level. Extremely memory-efficient for boolean per-user data.

```bash
SETBIT user:active:20240115 1234 1      # User 1234 was active on Jan 15
GETBIT user:active:20240115 1234        # → 1
BITCOUNT user:active:20240115           # Count active users on Jan 15

# Bitwise operations across bitmaps
BITOP AND dest active:jan active:feb    # Users active both months
BITOP OR  dest active:jan active:feb    # Users active in either month
BITOP XOR dest active:jan active:feb    # Users active in one but not both

BITPOS user:active:20240115 1           # First active user ID
BITPOS user:active:20240115 0           # First inactive user ID
```

### Memory Efficiency

Tracking 1 million users' daily activity:
- **Without Bitmap:** 1M hashes or strings → ~100 MB
- **With Bitmap:** 1M bits = **125 KB** (800x compression)

**Use case:** Daily active user (DAU) tracking, feature flag rollouts (bit = user has feature), attendance systems.

---

## 7. HyperLogLog

A probabilistic data structure for counting **unique items** with fixed memory (~12 KB) regardless of the number of unique elements. Error rate: **~0.81%**.

```bash
PFADD page:/home visitor:123 visitor:456 visitor:789
PFADD page:/home visitor:123             # Duplicate — not counted
PFCOUNT page:/home                       # Approximate unique count → 3

# Merge multiple HyperLogLogs
PFMERGE total page:/home page:/about page:/products
PFCOUNT total                            # Approximate total unique visitors across all pages
```

**When to use:** When you need cardinality estimates and can tolerate ~1% error — analytics dashboards, unique visitor counts, distinct search queries. **Not for exact counts** — use a Set for that.

---

## 8. Geospatial

Stored internally as a Sorted Set with encoded coordinates as scores (using Geohash encoding).

```bash
GEOADD restaurants 103.8198 1.3521 "Hawker Centre"    # longitude, latitude, name
GEOADD restaurants 103.8554 1.2800 "Marina Bay Sands"

GEODIST restaurants "Hawker Centre" "Marina Bay Sands" km   # → ~8.2 km

# Find restaurants within 5 km of a point
GEOSEARCH restaurants FROMMEMBER "Hawker Centre" BYRADIUS 5 km ASC
GEOSEARCH restaurants FROMLONLAT 103.85 1.28 BYRADIUS 5 km ASC COUNT 10 WITHCOORD WITHDIST

GEOPOS restaurants "Hawker Centre"       # Get stored coordinates back
GEOHASH restaurants "Hawker Centre"      # Geohash string
```

**Senior note:** Geospatial data is stored in a Sorted Set — you can use all ZSet commands (`ZRANGE`, `ZREM`, etc.) on geospatial keys. Precision is approximately 0.0001°, good to ~11 meters.

---

## 9. Stream

A log-like data structure for append-only sequences of messages. Combines the best of Kafka-style streams with Redis simplicity. [→ See dedicated redis-streams.md]

---

## 10. Type Comparison Summary

| Type | Best For | Time Complexity | Memory |
|------|---------|----------------|--------|
| String | Single values, counters, cache | O(1) all ops | Lowest |
| Hash | Objects with many fields | O(1) per field, O(n) for all | Low (listpack) |
| List | Queues, stacks, timelines | O(1) head/tail, O(n) middle | Medium |
| Set | Unique items, membership, set ops | O(1) add/check, O(n) ops | Medium |
| Sorted Set | Leaderboards, ranges, priority queues | O(log N) add, O(log N + M) range | Highest |
| Bitmap | Per-user boolean tracking | O(1) per bit, O(n) for BITCOUNT | Minimal |
| HyperLogLog | Approximate cardinality | O(1) all ops | Fixed ~12 KB |
| Geospatial | Location-based queries | O(log N) add, O(N+M log M) search | Like Sorted Set |
| Stream | Event streaming, message queues | O(1) add, O(log N) read by ID | Moderate |

---

## Interview Questions

### Q: How do you select the right Redis data type for a new feature?
**A:** Start from access pattern and operation complexity, then optimize for memory and consistency needs.

### Q: Why are Sorted Sets common in senior interview scenarios?
**A:** They model rank, range queries, and priority semantics efficiently with predictable performance.

### Q: When should HyperLogLog be avoided?
**A:** When exact distinct counts are required for billing, quotas, or compliance logic.

### Q: What is a key risk when using Hash for object storage?
**A:** Unbounded field growth can make full reads expensive and increase memory unexpectedly.

### Q: How do hash tags help cluster-safe multi-key operations?
**A:** They force related keys into the same slot so multi-key commands remain valid.

### Q: Why should teams care about internal encodings like listpack or embstr?
**A:** Encoding choices directly affect memory footprint and command latency under scale.
