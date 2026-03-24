---
id: redis-pipeline-transactions
title: "Redis Pipeline, Transactions & Lua Scripts"
slug: redis-pipeline-transactions
description: Deep dive into Redis pipelining for throughput optimization, MULTI/EXEC transactions, optimistic locking with WATCH, and atomic Lua scripting — with production patterns and pitfalls.
tags: [redis, pipeline, transactions, lua, backend, performance]
---

# Redis Pipeline, Transactions & Lua Scripts

Understanding the differences and constraints of Redis's three batching mechanisms is critical for senior-level design and debugging.

---

## The Network Round-Trip Problem

Every Redis command normally requires one full round-trip:

```
Client → [NETWORK: 1ms] → Redis → [NETWORK: 1ms] → Client
         RTT = 2ms per command
```

For 1000 commands sequentially: **2000ms of network latency**.

---

## 1. Pipelining

Pipelining batches multiple commands into a single network write, and reads all responses in bulk. It is **not atomic** — commands execute independently on the server.

```
Without pipeline:                 With pipeline:
→ SET k1 v1                       → SET k1 v1
← OK                              → GET k1
→ GET k1                          → INCR counter
← "v1"                            → SET k2 v2
→ INCR counter                    ← OK (SET k1)
← 1                               ← "v1" (GET k1)
                                  ← 1 (INCR)
                                  ← OK (SET k2)
```

```java
// Spring Data Redis pipeline example
List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
    for (String key : keys) {
        connection.get(key.getBytes());
    }
    return null;
});
```

```python
# Jedis/Lettuce/redis-py pipeline
pipe = redis.pipeline(transaction=False)  # No MULTI/EXEC wrapper
pipe.set("k1", "v1")
pipe.get("k1")
pipe.incr("counter")
results = pipe.execute()  # Single round-trip for all 3 commands
```

### Pipeline Performance Impact

| Scenario | Without Pipeline | With Pipeline | Improvement |
|----------|-----------------|----------------|-------------|
| 1000 SET commands (1ms RTT) | ~2000ms | ~5ms | 400× |
| 100 HGETALL commands | ~200ms | ~3ms | 67× |
| Same datacenter (0.1ms RTT) | ~200ms | ~2ms | 100× |

### When to Use (and When NOT To)

✅ **Use pipeline when:**
- Sending many independent commands (bulk import, batch reads)
- Commands don't depend on each other's results
- High latency network (cross-region)

❌ **Don't use pipeline when:**
- Command N depends on result of command N-1 (use Lua or WATCH/MULTI instead)
- You need atomicity (use MULTI/EXEC or Lua)
- Working with Redis Cluster — commands must target the same slot

**Redis Cluster pipeline caveat:** In Cluster mode, all pipelined commands must target the same hash slot (or the same node). Multi-slot pipelines require client-side routing and multiple connections.

---

## 2. Transactions (MULTI / EXEC)

Redis transactions guarantee that a block of commands executes **atomically** — no other client's commands can interleave within the block.

```bash
MULTI          # Start transaction block
SET balance 100
DECRBY balance 30
EXEC           # Execute all commands atomically
# Returns: ["OK", 70]
```

```bash
MULTI
SET k1 v1
SET k2 v2
DISCARD        # Abort — transaction rolled back
```

### Transaction Error Handling

Redis transactions have a **critical difference from SQL transactions**:

| Error Type | Behavior | Example |
|------------|----------|---------|
| **Command error** (compile-time) | Transaction is aborted on EXEC | `SET` with wrong number of args |
| **Runtime error** (exec-time) | **Other commands still execute!** | `LPUSH` on a String key |

```bash
MULTI
SET k1 "Alice"
INCR k1            # Runtime error: k1 is a String, not an integer
SET k2 "Bob"
EXEC
# Result: ["OK", ERR, "OK"]
# ❌ k1 is set to "Alice" AND k2 is set to "Bob" — the error on INCR doesn't abort!
```

> **Critical interview point:** Redis has NO rollback. If a command in MULTI/EXEC fails at runtime, the other commands still execute. Redis transactions guarantee isolation and ordering — not SQL-style all-or-nothing semantics.

### WATCH — Optimistic Locking

`WATCH` implements optimistic concurrency control: if a watched key changes before `EXEC`, the transaction is aborted (returns nil).

```bash
# Pattern: Read-Modify-Write with optimistic locking
WATCH balance

current = GET balance     # Read current value

MULTI
SET balance (current - 30)  # Conditional write
EXEC
# Returns: nil if balance changed by another client → retry
# Returns: ["OK"] if balance was unchanged → success
```

```python
# Python redis-py with WATCH retry loop
def decrement_balance(redis_client, amount, max_retries=3):
    for attempt in range(max_retries):
        with redis_client.pipeline() as pipe:
            try:
                pipe.watch('balance')
                current = int(pipe.get('balance') or 0)
                if current < amount:
                    raise InsufficientFundsError()
                pipe.multi()
                pipe.set('balance', current - amount)
                pipe.execute()
                return current - amount  # Success
            except WatchError:
                if attempt == max_retries - 1:
                    raise RetryExhaustedError()
                continue  # Retry
```

### MULTI/EXEC vs Pipeline

| | Pipeline | MULTI/EXEC |
|---|---|---|
| Atomicity | ❌ No | ✅ Yes (ordered, no interleaving) |
| Rollback on error | N/A | ❌ No (runtime errors don't rollback) |
| Network efficiency | ✅ Yes | ✅ Yes (same batching benefit) |
| Conditional logic | ❌ No | ❌ No (use Lua for that) |
| Cluster support | Same-slot only | Same-slot only |

---

## 3. Lua Scripting

Lua scripts execute **atomically** on the Redis server — no other command can interrupt them. They can contain conditional logic (unlike MULTI/EXEC) and access command results within the script.

```bash
# Basic structure
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue
#     [lua script]                                  [numkeys] [keys...] [args...]
```

```lua
-- Transfer balance atomically (conditional logic impossible in MULTI/EXEC)
local from_balance = tonumber(redis.call('GET', KEYS[1]))
local to_balance   = tonumber(redis.call('GET', KEYS[2]))
local amount       = tonumber(ARGV[1])

if from_balance < amount then
    return redis.error_reply("Insufficient funds")
end

redis.call('DECRBY', KEYS[1], amount)
redis.call('INCRBY', KEYS[2], amount)
return "OK"
```

```bash
EVAL "..." 2 user:1:balance user:2:balance 50
```

### EVALSHA — Production Usage

For performance, load scripts first and call by SHA1 hash:

```bash
SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# → "e0e1f9fabfa9d353a0970aa5c101c53bc0cbf1b4"

EVALSHA e0e1f9fabfa9d353a0970aa5c101c53bc0cbf1b4 1 mykey
```

```java
// Spring Data Redis Lua script
DefaultRedisScript<Long> script = new DefaultRedisScript<>();
script.setScriptText("""
    local current = tonumber(redis.call('GET', KEYS[1])) or 0
    if current < tonumber(ARGV[1]) then
        return 0  -- insufficient
    end
    redis.call('DECRBY', KEYS[1], ARGV[1])
    return 1  -- success
""");
script.setResultType(Long.class);

Long result = redisTemplate.execute(script,
    Collections.singletonList("user:1:credits"),
    "10"  // deduct 10 credits
);
```

### Production Lua Patterns

**Rate limiting (exact sliding window):**
```lua
-- KEYS[1]: rate limit key, ARGV[1]: limit, ARGV[2]: window (seconds)
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window * 1000)
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('PEXPIRE', key, window * 1000)
    return 1  -- allowed
end
return 0  -- rate limited
```

**Conditional SET (idempotent create):**
```lua
-- Set only if key doesn't exist or value matches expected
local current = redis.call('GET', KEYS[1])
if current == false or current == ARGV[1] then
    redis.call('SET', KEYS[1], ARGV[2])
    return 1
end
return 0
```

### Lua Script Constraints

| Constraint | Detail |
|------------|--------|
| Blocking | Script blocks all other commands while running — keep scripts short |
| No async | Cannot call async operations inside Lua |
| Time limit | Default 5 seconds — exceeded scripts are killed with `SCRIPT KILL` |
| Cluster | All KEYS[] must be in the same hash slot (use hash tags) |
| Deterministic | Scripts must be deterministic — no random or time-dependent logic |
| Debug | Use `SCRIPT DEBUG` for development; `redis.log()` for logging |

---

## Comparison Summary

| Feature | Pipeline | MULTI/EXEC | Lua Script |
|---------|---------|-----------|-----------|
| Atomic | ❌ | ✅ | ✅ |
| Conditional logic | ❌ | ❌ | ✅ |
| Access intermediate results | ❌ | ❌ | ✅ |
| Network round-trips | 1 | 1 | 1 |
| Cluster (multi-slot) | ❌ | ❌ | ❌ |
| Rollback on error | N/A | ❌ | ✅ (via error_reply) |
| Production recommendation | Bulk reads | Simple atomic ops | Complex atomic ops |

---

## Production Decision Guide

```
Need to send many independent commands?
  → Pipeline (no atomicity needed)

Need atomicity but no conditional logic?
  → MULTI/EXEC + WATCH for optimistic locking

Need conditional logic ("if X then Y else Z") atomically?
  → Lua script (EVAL/EVALSHA)

Working across multiple hash slots in Cluster?
  → Use hash tags to co-locate keys, or accept application-level orchestration
```
