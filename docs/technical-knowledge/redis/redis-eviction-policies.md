---
id: redis-eviction-policies
title: "Redis Eviction Policies"
slug: redis-eviction-policies
description: Comprehensive guide to Redis maxmemory algorithms (LRU, LFU, Random, TTL), eviction pool internals, LFU counter mechanics, tuning, monitoring, and production failure modes for senior engineers.
tags: [redis, eviction, lru, lfu, cache, backend, maxmemory]
---

import RedisEvictionPoliciesDiagram from '@site/src/components/RedisEvictionPoliciesDiagram';

# Redis Eviction Policies & Maxmemory

What happens when a Redis instance reaches its configured memory capacity (`maxmemory`)? Without explicit eviction policies, Redis rejects writes with `OOM command not allowed` errors.

<RedisEvictionPoliciesDiagram />

:::info[Architectural Clarification: Eviction vs. Expiration vs. Invalidation]
- **Cache Eviction**: Driven by **RAM capacity limits** (`maxmemory`). Removes keys (even valid ones) using LRU/LFU/FIFO algorithms to free memory space.
- **Cache Expiration**: Driven by the **Clock** (TTL elapsed). Marks keys as stale and deletes them via passive read checks or active periodic background sampling.
- **Cache Invalidation**: Driven by **Source-of-Truth mutations**. Explicitly deletes or overwrites keys when database data changes.
For an in-depth breakdown of the 5 TTL expiration policies, see **[Cache Expiration & TTL Policies](../system-design/caching-strategies.md#cache-expiration--ttl-policies)**.
:::

:::tip[For newcomers]
Think of Redis memory like a fixed-size shelf. When the shelf is full and a new item arrives, you must either refuse it (`noeviction`) or throw something away to make room. An **eviction policy** is just the rule for *which item to throw away*: the one nobody has touched in the longest time (LRU), the one used least often overall (LFU), a random one, or the one about to expire anyway (TTL). The rest of this page explains how Redis implements those rules cheaply, and how to pick the right one.
:::

---

## 1. The `maxmemory` Threshold

By default, 64-bit Redis instances have no memory limit (`maxmemory 0`), and the default policy is **`noeviction`** — not `allkeys-lru`. In containerized Linux environments (Docker, Kubernetes), unconstrained memory growth causes the host kernel OOM Killer to send a `SIGKILL` to the Redis process.

```bash
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 5
```

### When Does Eviction Actually Run?

Eviction is not a background job — it runs **inline, before a command executes**. Every time Redis is about to process a command that may increase memory (flagged internally as `denyoom`, e.g. `SET`, `LPUSH`, `SADD`), it checks `used_memory` against `maxmemory`. If over the limit, it evicts keys per the policy *until memory is back under the limit*, then runs the command.

Consequences worth internalizing:

- **Reads keep working under `noeviction`** — only memory-growing commands are rejected with `OOM command not allowed when used memory > 'maxmemory'`.
- **Eviction latency lands on the writer's request.** A burst of large writes can force many evictions inside one command's latency window. Redis bounds the time spent per cycle (`maxmemory-eviction-tenacity`, default `10`, range 0–100; higher = more aggressive, more latency) to avoid stalling the single-threaded event loop indefinitely — but if eviction can't keep pace with write rate, memory still climbs.
- **Evicted keys are propagated as `DEL`** to replicas and the AOF, so replicas stay consistent with the primary rather than running their own eviction decisions (replicas ignore `maxmemory` by default via `replica-ignore-maxmemory yes`).

### Sizing `maxmemory` Correctly

`maxmemory` limits the dataset Redis accounts for — it does **not** cover everything the process uses. Leave headroom for:

| Overhead | Why it matters |
|---|---|
| **Fragmentation** | RSS can exceed `used_memory` by 10–50% (`mem_fragmentation_ratio` in `INFO memory`) |
| **Fork copy-on-write** | `BGSAVE` / AOF rewrite forks the process; under heavy writes, copied pages can add up to a significant fraction of the dataset |
| **Client/replication buffers** | Output buffers for replicas and pub/sub clients (Redis excludes replica/AOF buffers from the eviction calculation to avoid a feedback loop, but they still consume real RAM) |

**Rule of thumb**: with persistence enabled, set `maxmemory` to roughly 60–75% of the container/host memory limit. Setting it equal to the container limit is the classic way to get OOM-killed by the kernel while Redis believes it is still within budget.

---

## 2. Summary of 8 Eviction Policies

| Policy Name | Target Keys | Selection Algorithm | Best Use Case |
|---|---|---|---|
| **`noeviction`** (**actual default**) | None | Returns `OOM` error on writes when maxmemory is reached. | Redis used as a primary database (zero data loss permitted). |
| **`allkeys-lru`** | ALL keys | Approximated Least Recently Used. | **Recommended starting point for general-purpose application caching** (not the built-in default). |
| **`volatile-lru`** | TTL keys only | Approximated Least Recently Used. | Mixed DB: permanent session records + temporary caches. |
| **`allkeys-lfu`** | ALL keys | Approximated Least Frequently Used (8-bit log counter). | Power-law traffic distributions (viral posts vs cold data). |
| **`volatile-lfu`** | TTL keys only | Approximated Least Frequently Used. | Frequency-based eviction for ephemeral cache keys. |
| **`allkeys-random`** | ALL keys | Uniform Random. | Uniform access patterns where key age is irrelevant. |
| **`volatile-random`** | TTL keys only | Uniform Random. | Random eviction scoped strictly to ephemeral keys. |
| **`volatile-ttl`** | TTL keys only | Evicts key with nearest remaining TTL expire timestamp. | Prioritizes purging keys about to expire naturally. |

> [!WARNING]
> **`volatile-*` policies silently degrade to `noeviction`** when no keys have a TTL (or all TTL keys are already gone). Writes then fail with `OOM` even though the instance is full of "evictable-looking" data. If you choose a `volatile-*` policy, every cache key *must* be written with a TTL — enforce this in your cache abstraction rather than trusting each call site.

---

## 3. Under the Hood: Approximated LRU/LFU

True LRU requires maintaining a globally synchronized Doubly-Linked List across millions of keys, incurring significant memory pointer overhead (at least two extra pointers, i.e. $\approx 16\text{ bytes}$ or more per key) and CPU locking penalties on every read operation.

### Probabilistic Sampled LRU
Redis uses a **probabilistic sampled LRU algorithm**:
1. When a write requires memory eviction, Redis randomly samples $N$ keys (default `maxmemory-samples 5`).
2. It inspects the 24-bit LRU timestamp clock stored inside each key's `redisObject` header (resolution: 1 second; the clock wraps roughly every 194 days, which Redis handles by computing idle time modulo the clock range).
3. It evicts the single key with the oldest idle time from the sample pool.
4. Higher `maxmemory-samples` (e.g. 10) gets very close to true LRU behavior at a modest extra CPU cost; values above ~10 give diminishing returns.

### The Eviction Pool (Why 5 Samples Works Better Than It Sounds)

Since Redis 3.0, sampling isn't memoryless. Redis keeps an **eviction pool of 16 candidates** that persists across eviction cycles: each cycle's fresh samples are merged into the pool sorted by idle time, and the *best* candidate in the pool (the longest-idle) is evicted — not merely the best of the 5 fresh samples. Good candidates found in earlier cycles but not yet evicted stay in the pool, which is why the approximation quality is meaningfully better than "pick the best of 5 random keys" would suggest.

```
Cycle N:   sample 5 random keys ──► merge into pool (max 16, sorted by idle time)
                                         │
                                         └──► evict the pool's longest-idle key
                                              (remaining candidates carry over to cycle N+1)
```

### LFU: How a Single Byte Tracks Frequency

With an LFU policy, the same 24-bit field in the object header is repurposed:

```
 16 bits                    8 bits
┌──────────────────────┬───────────────┐
│ last decrement time  │ log counter   │
│ (minutes)            │ (0–255)       │
└──────────────────────┴───────────────┘
```

An 8-bit counter can't count to millions, so it is **logarithmic and probabilistic**: on each access, the counter increments with probability $p = \frac{1}{(\text{counter} - 5)\times \text{lfu-log-factor} + 1}$ — the higher the counter, the less likely each further hit moves it. New keys start at a counter of **5** (not 0), so a freshly inserted key isn't immediately the lowest-frequency candidate and evicted before it ever gets a chance to prove itself.

Counter growth under the default `lfu-log-factor 10` (from Redis's own `redis.conf`):

| lfu-log-factor | 100 hits | 1,000 hits | 100K hits | 1M hits | 10M hits |
|---|---|---|---|---|---|
| 0 | 104 | 255 | 255 | 255 | 255 |
| 1 | 18 | 49 | 255 | 255 | 255 |
| **10 (default)** | **10** | **18** | **142** | **255** | **255** |
| 100 | 8 | 11 | 49 | 143 | 255 |

**Decay** prevents yesterday's hot key from squatting in memory forever: every `lfu-decay-time` minutes (default `1`) without access, the counter is decremented. Setting `lfu-decay-time 0` disables decay (counter only goes up) — almost never what you want for a cache.

```bash
# redis.conf — LFU tuning
maxmemory-policy allkeys-lfu
lfu-log-factor 10      # higher = counter saturates more slowly, better resolution among very hot keys
lfu-decay-time 1       # minutes of inactivity per decrement of the counter
```

### LRU vs LFU: Failure Modes of Each

| | LRU weakness | LFU weakness |
|---|---|---|
| **Scan pollution** | A one-off full scan (analytics job, `SCAN`-driven export, bulk warmup) touches every key once and makes cold data look "recent," evicting genuinely hot keys | Resistant — a single access barely moves the counter |
| **Cold-start of new keys** | Fine — new keys are "recent" by definition | A brand-new key has a low counter and can be evicted before it earns frequency, despite being about to become hot (mitigated by the initial counter of 5) |
| **Shifting hot sets** | Adapts instantly | Adapts only as fast as `lfu-decay-time` allows — a formerly hot key lingers until its counter decays |

---

## 4. Choosing a Policy: Decision Guide

```
Is Redis your system of record (data must not be lost)?
 ├─ Yes ──► noeviction  (and monitor memory with alerts — do NOT rely on eviction)
 └─ No (it's a cache)
      │
      ├─ Does EVERY key have a TTL, and do you mix durable + cache data in one instance?
      │     └─ Yes ──► volatile-lru / volatile-lfu   (prefer splitting into two instances instead)
      │
      ├─ Skewed (power-law) access — a small hot set gets most reads?
      │     └─ Yes ──► allkeys-lfu
      │
      ├─ Recency-driven access (recent items are the ones re-read; scans are rare)?
      │     └─ Yes ──► allkeys-lru
      │
      └─ Uniform access, no meaningful hot set ──► allkeys-random (cheapest, no tracking overhead)
```

**Prefer two instances over `volatile-*` mixing.** Putting durable data (sessions, rate-limit counters you can't afford to lose) and disposable cache entries in one instance and relying on `volatile-*` to protect the durable half is fragile: one cache write without a TTL (see the warning above) removes the protection silently. A separate cache instance with `allkeys-lru`/`allkeys-lfu` and a separate durable instance with `noeviction` make the failure mode obvious instead of latent.

---

## 5. Monitoring Eviction in Production

Eviction is a **signal, not just a mechanism** — a rising eviction rate means your working set no longer fits in memory, which usually shows up as a falling cache hit ratio and rising load on your primary database *before* anything errors.

```bash
# The metrics that matter
redis-cli INFO stats | grep -E "evicted_keys|expired_keys|keyspace_hits|keyspace_misses"
redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human|mem_fragmentation_ratio"

# Inspect an individual key (policy-dependent)
redis-cli OBJECT FREQ mykey       # only valid under an LFU policy
redis-cli OBJECT IDLETIME mykey   # only valid under non-LFU policies (seconds since last access)
```

Derived signals worth alerting on:

| Signal | Computation | Alert When |
|---|---|---|
| **Eviction rate** | Δ`evicted_keys` per second | Sustained > 0 on a cache you sized to "fit everything" |
| **Hit ratio** | `keyspace_hits / (keyspace_hits + keyspace_misses)` | Drops below your baseline (e.g. 95% → 80%) — often the first symptom of an undersized cache |
| **Memory headroom** | `used_memory / maxmemory` | Pinned at ~100% under `noeviction` (writes about to fail) |
| **Fragmentation** | `mem_fragmentation_ratio` | > 1.5 sustained (RSS growing beyond what `maxmemory` accounts for) |

### Spring Boot: Exposing Eviction Metrics

```java
@Component
public class RedisEvictionMetrics {

    private final StringRedisTemplate redis;

    public RedisEvictionMetrics(StringRedisTemplate redis, MeterRegistry registry) {
        this.redis = redis;
        // Gauge reads the cumulative counter; compute rate() in Prometheus/Grafana
        Gauge.builder("redis.evicted.keys", this, RedisEvictionMetrics::evictedKeys)
             .description("Cumulative keys evicted due to maxmemory")
             .register(registry);
    }

    private double evictedKeys() {
        Properties stats = redis.execute(
            (RedisCallback<Properties>) conn -> conn.serverCommands().info("stats"));
        return stats == null ? 0 : Double.parseDouble(stats.getProperty("evicted_keys", "0"));
    }
}
```

### Keyspace Notifications for Evictions

Redis can publish an event whenever a key is evicted (`notify-keyspace-events` flag `e`), useful for debugging *which* keys are being sacrificed. As with all Pub/Sub, delivery is best-effort and the feature adds CPU overhead — enable temporarily for diagnosis, not as a permanent audit trail. See [Redis Pub/Sub](./redis-pubsub.md#keyspace-notifications-related-but-distinct-mechanism).

---

## 6. Production Failure Modes

1. **Eviction storm → cache stampede.** A sudden memory spike (deploy that doubles value sizes, a bulk import) evicts a large fraction of the hot set at once; every subsequent request misses simultaneously and hammers the database. Mitigations: request coalescing/single-flight loading, jittered TTLs, and alerting on eviction rate *before* the hit ratio collapses (see [Redis Performance Patterns](./redis-performance-patterns.md)).
2. **`volatile-*` + a missing TTL = unexpected `OOM` errors.** One code path writes keys without `EXPIRE`; over weeks the non-expiring set grows until no evictable candidates remain, and writes start failing despite the policy "being configured correctly."
3. **Big-key eviction blocks the event loop.** Evicting a single multi-hundred-MB hash/list/set frees memory synchronously by default, stalling every other client for the duration. Enable `lazyfree-lazy-eviction yes` so large values are freed in a background thread (check the default for your Redis version before assuming it is on), and avoid creating giant keys in the first place.
4. **Hot-key skew in Redis Cluster.** `maxmemory` is per node. A single hot slot can push one node into continuous eviction while its neighbors sit half-empty — the cluster looks "underutilized" in aggregate while one shard thrashes. Watch per-node `evicted_keys`, not the cluster average.
5. **Container OOM-kill despite `maxmemory`.** Fragmentation, fork copy-on-write, and buffers consume memory `maxmemory` doesn't count (see §1) — the kernel kills Redis while Redis believes it has headroom.
6. **Misattributing a miss.** An application-level cache miss isn't necessarily eviction — it may be TTL expiry or explicit invalidation. Compare `evicted_keys` vs `expired_keys` deltas before concluding the cache is undersized.

---

## 7. Validating a Policy Choice Before Production

Don't pick LRU vs LFU on intuition — replay representative traffic and compare hit ratios:

```bash
# Run two instances with identical maxmemory, differing only in policy
redis-server --port 6380 --maxmemory 256mb --maxmemory-policy allkeys-lru
redis-server --port 6381 --maxmemory 256mb --maxmemory-policy allkeys-lfu

# Replay the same captured key-access trace against both (e.g., from MONITOR output
# or application access logs), then compare:
redis-cli -p 6380 INFO stats | grep -E "keyspace_(hits|misses)|evicted_keys"
redis-cli -p 6381 INFO stats | grep -E "keyspace_(hits|misses)|evicted_keys"
```

The winner is whichever yields the higher hit ratio on **your** access distribution — for strongly skewed traffic LFU typically wins; for recency-dominated traffic or workloads with frequent scans, LRU can win or tie.

---

## Interview Questions

### Q1. What is the difference between `allkeys-lru` and `volatile-lru` eviction policies?
> `allkeys-lru` evaluates and evicts the least recently used keys across the **entire keyspace**, regardless of whether keys have an explicit TTL expiration set. `volatile-lru` limits eviction candidate sampling strictly to keys configured with an explicit TTL (`EXPIRE`). If all keys with a TTL are evicted and memory remains full, `volatile-lru` falls back to throwing `OOM command not allowed` errors on new writes.

### Q2. Why does Redis use an Approximated LRU algorithm instead of a True LRU doubly-linked list?
> A true LRU algorithm requires allocating a global Doubly-Linked List connecting every stored key object. Every read operation (`GET`) would require executing $O(1)$ node detach and head-reattachment pointer arithmetic, introducing lock overhead and consuming at least $16\text{ bytes}$ of additional RAM per key for pointers. Redis's sampled LRU (sampling 5–10 random keys, aided by a persistent 16-entry eviction pool) provides nearly identical eviction precision with zero memory pointer overhead.

### Q3. How does `allkeys-lfu` differ from `allkeys-lru` in high-throughput caching environments?
> `allkeys-lru` (Least Recently Used) evaluates keys strictly on idle time since the last access. A key read once 1 second ago will be retained over a key read 1,000 times 10 seconds ago. `allkeys-lfu` (Least Frequently Used) maintains an 8-bit logarithmic access frequency counter alongside a decay timer, accurately identifying and retaining true "hot" keys even if they were not accessed in the last few seconds — and it resists scan pollution, where a one-time sweep over cold data would otherwise flush the hot set under LRU.

### Q4. Why does an 8-bit LFU counter still work for keys accessed millions of times?
> The counter is logarithmic and probabilistic: each access increments it with a probability that shrinks as the counter grows (controlled by `lfu-log-factor`), so 255 represents on the order of a million hits rather than 255 hits. A decay timer (`lfu-decay-time`, in minutes) lowers the counter during inactivity so formerly hot keys eventually become eviction candidates. New keys start at 5 rather than 0 so they aren't evicted before they can accumulate any frequency.

### Q5. Your database load spiked and cache hit ratio dropped, but Redis shows no errors. How do you tell whether eviction is the cause?
> Compare `evicted_keys` against `expired_keys` over the same window. Rising `evicted_keys` with `used_memory` pinned near `maxmemory` means the working set no longer fits — eviction is dropping live keys and you need more memory, a better policy, or smaller values. Rising `expired_keys` with flat evictions points to TTL churn (e.g., synchronized TTLs expiring together) instead, which is fixed with TTL jitter, not more RAM.

### Q6. Why is setting `maxmemory` equal to the container memory limit a mistake?
> `maxmemory` caps only the dataset Redis accounts for. Fragmentation, fork copy-on-write during `BGSAVE`/AOF rewrite, and client or replication buffers consume additional memory outside that budget, so Redis can exceed the container limit while still believing it is under `maxmemory` and get OOM-killed by the kernel. Leave roughly 25–40% headroom when persistence is enabled.

---

## See Also

- [Redis TTL & Key Expiration Mechanics](./redis-ttl-expiry.md)
- [Redis Architecture Overview](./redis-overview.md)
- [Redis Distributed Cache Patterns](./redis-distributed-cache.md)
- [Redis Pub/Sub](./redis-pubsub.md) — keyspace notifications, including eviction events
- [Redis Performance Patterns](./redis-performance-patterns.md) — cache stampede mitigation after mass eviction