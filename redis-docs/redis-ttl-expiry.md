---
id: redis-ttl-expiry
title: "Redis TTL, Key Expiry & Memory Management"
slug: redis-ttl-expiry
description: Redis TTL mechanics, expiry policies (lazy vs active), memory eviction strategies (LRU, LFU, volatile, allkeys), and senior-level memory management patterns.
tags: [redis, ttl, expiry, memory, eviction, backend]
---

# Redis TTL, Key Expiry & Memory Management

Understanding how Redis expires keys and manages memory under pressure is essential for designing reliable, cost-effective Redis deployments.

---

## Setting TTL

```bash
# Set with TTL in one command (preferred — atomic)
SET session:abc123 "user-data" EX 3600      # Expire in 3600 seconds
SET session:abc123 "user-data" PX 3600000   # Expire in 3600000 milliseconds
SET session:abc123 "user-data" EXAT 1700000000  # Expire at Unix timestamp (seconds)
SET session:abc123 "user-data" PXAT 1700000000000  # Expire at Unix timestamp (ms)

# Add TTL to existing key
EXPIRE key 3600            # Seconds
PEXPIRE key 3600000        # Milliseconds
EXPIREAT key 1700000000    # Unix timestamp (seconds)
PEXPIREAT key 1700000000000  # Unix timestamp (ms)

# Inspect TTL
TTL key          # Returns seconds remaining; -1 = no expiry; -2 = key doesn't exist
PTTL key         # Returns milliseconds remaining

# Remove TTL (make key persistent)
PERSIST key

# Redis 7.0+ EXPIRETIME: get exact expiry timestamp
EXPIRETIME key    # Returns Unix timestamp when key will expire
```

---

## How Redis Expires Keys

Redis uses a **hybrid expiry strategy** — it does NOT check every key for expiry on every access:

### 1. Lazy Expiry (Passive)

When a key is **accessed**, Redis checks if it's expired and deletes it on the spot:

```
Client: GET expired-key
Redis:  1. Check if key has passed TTL → YES, it's expired
        2. Delete the key
        3. Return (nil)
```

**Problem:** Lazy expiry alone means expired keys continue consuming memory until they're accessed.

### 2. Active Expiry (Periodic)

Every **100ms**, Redis runs a background job that:
1. Samples **20 random keys** with TTLs set
2. Deletes all expired keys from the sample
3. If >25% of sampled keys were expired → repeat immediately
4. Stop when <25% of sampled keys are expired or time budget exhausted

```
Active sampling cycle:
  Sample 20 random keys with TTL
  Delete expired ones
  If expired rate > 25%:
    → Run another cycle (up to ~25% of time budget)
  Else:
    → Wait until next 100ms cycle
```

**Why this matters:** A key with `EXPIRE 300` is **not guaranteed to be deleted exactly at 300 seconds**. Under memory pressure or many expiring keys, deletion can be delayed by 0–200ms typically, sometimes more.

### Active Expiry Budget

Redis limits active expiry to prevent blocking:
```
maxmemory-expire-cycle = ACTIVE_EXPIRE_CYCLE_FAST  # 1ms max per cycle (default)
maxmemory-expire-cycle = ACTIVE_EXPIRE_CYCLE_SLOW  # 25% of CPU time
```

---

## Memory Eviction Policies

When Redis exceeds `maxmemory`, it must evict keys. The policy is configured via `maxmemory-policy`:

```bash
maxmemory 2gb
maxmemory-policy allkeys-lru
```

| Policy | Scope | Algorithm | Use Case |
|--------|-------|-----------|----------|
| `noeviction` | All | Reject writes with OOM error | DB use (no data loss) |
| `allkeys-lru` | All keys | Evict least recently used | General cache (recommend) |
| `allkeys-lfu` | All keys | Evict least frequently used | Non-uniform access patterns |
| `allkeys-random` | All keys | Random eviction | Uniform access patterns |
| `volatile-lru` | Keys with TTL | Evict LRU among keys with TTL | Mixed DB + cache |
| `volatile-lfu` | Keys with TTL | Evict LFU among keys with TTL | Mixed DB + cache |
| `volatile-random` | Keys with TTL | Random among keys with TTL | Simple mixed use |
| `volatile-ttl` | Keys with TTL | Evict keys closest to expiry | Prioritize short-lived keys |

### LRU vs LFU

**LRU (Least Recently Used):**
- Evicts the key that was accessed least recently
- Problem: a key accessed millions of times but not in the last minute gets evicted

**LFU (Least Frequently Used):**
- Counts access frequency with decay over time
- Better for cache with clear "hot" and "cold" data
- Available since Redis 4.0

```bash
# Redis uses approximate LRU/LFU (not exact) for memory efficiency
maxmemory-samples 5    # Sample 5 keys to pick eviction candidate (higher = more accurate)
maxmemory-samples 10   # Better approximation, slightly more CPU
```

### Eviction Policy Decision Guide

```
Is Redis used purely as a cache (no persistence needed)?
  → allkeys-lru or allkeys-lfu

Is Redis a primary store with some cached keys?
  → volatile-lru or volatile-lfu (only evict TTL keys, protect persistent data)

Is OOM rejection acceptable (you want to know when you're over capacity)?
  → noeviction (forces application-level capacity management)

Uniform access patterns (all keys equally likely)?
  → allkeys-random (fastest, no tracking overhead)
```

---

## TTL Antipatterns and Gotchas

### 1. TTL Reset on Write

```bash
SET key "value" EX 3600   # TTL = 3600s
# ... 1800 seconds later ...
SET key "new-value"        # ❌ TTL is REMOVED! key is now persistent
```

```bash
# Fix: always re-set TTL on update
SET key "new-value" KEEPTTL   # Redis 6.0+: preserve existing TTL
# or
SET key "new-value" EX 3600   # Explicitly re-apply TTL
```

### 2. Stampede Attack on TTL

When many keys with the same TTL expire simultaneously, all clients make requests to the backend at once — overwhelming the database.

```
00:00:00 — SET product:* EX 3600 (1000 products cached)
01:00:00 — All 1000 expire simultaneously
01:00:00 — 1000 threads all hit the DB at once!
```

**Fix: Jittered TTL**
```python
import random

def cache_product(product_id, data):
    base_ttl = 3600
    jitter = random.randint(0, 300)   # 0–5 min jitter
    redis.set(f"product:{product_id}", data, ex=base_ttl + jitter)
```

### 3. EXPIRE on Non-Existent Key

```bash
EXPIRE nonexistent-key 3600   # Returns 0 — key doesn't exist (no error, silently fails)
# Always verify the key exists before applying EXPIRE, or use SET ... EX
```

### 4. Volatile Policy with No TTL Keys

```bash
maxmemory-policy volatile-lru
# If all keys have no TTL → Redis CANNOT evict anything → OOM error on writes
# Always ensure cached keys have TTLs when using volatile-* policy
```

---

## Memory Optimization Techniques

### 1. Object Sharing

Redis shares integer objects from 0 to 9999 — no memory allocation needed:
```bash
SET a 1000   # Points to shared integer object
SET b 1000   # Points to SAME shared integer object
# Memory cost: 1 object, not 2
```

### 2. Compact Encodings

Keep collections within encoding thresholds to use listpack:
```bash
# Good: listpack (compact array)
HSET user:1 name "Alice" age "30"        # 2 fields < 128 → listpack

# Bad: full hashtable
HSET user:1 f1 v1 f2 v2 ... f200 v200  # 200 fields → hashtable (much larger)
```

### 3. Key Compression

```bash
# Long key names waste memory
SET user:profile:john.doe@example.com:settings ...   # 43-byte key

# Shorter key names
SET up:12345:s ...   # 10-byte key (use numeric IDs, not emails)
```

### 4. Memory Analysis

```bash
MEMORY USAGE key          # Memory used by one key
MEMORY DOCTOR             # Redis's memory health diagnosis
MEMORY STATS              # Detailed memory statistics

# Find biggest keys (scan-based, safe for production)
redis-cli --bigkeys        # CLI tool — finds top keys by memory

# Object encoding inspection
OBJECT ENCODING key        # See ziplist, hashtable, intset, etc.
OBJECT FREQ key            # LFU frequency counter
OBJECT IDLETIME key        # Seconds since last access (for LRU)
```

---

## Redis Keyspace Notifications

Subscribe to expiry and other key events:

```bash
# Enable in redis.conf
notify-keyspace-events Ex   # E=keyevent, x=expiry events
notify-keyspace-events KEA  # All events

# Subscribe to expired key events
SUBSCRIBE __keyevent@0__:expired

# Subscriber receives: key name when it expires
# Use case: triggers on session expiry, cleanup tasks, delayed processing
```

```java
// Spring Data Redis keyspace notification listener
@Component
public class KeyExpirationListener extends KeyExpirationEventMessageListener {
    public KeyExpirationListener(RedisMessageListenerContainer container) {
        super(container);
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        log.info("Key expired: {}", expiredKey);
        // Trigger cleanup, send notification, etc.
    }
}
```

**Caveat:** Keyspace notifications use Pub/Sub — they are **at-most-once**. If Redis is under load, some expiry notifications may be dropped.
