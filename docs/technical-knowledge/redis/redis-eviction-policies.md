---
id: redis-eviction-policies
title: "Redis Eviction Policies"
slug: redis-eviction-policies
description: Comprehensive guide to Redis maxmemory algorithms (LRU, LFU, Random) and how Redis approximates caching algorithms at scale for senior engineers.
tags: [redis, eviction, lru, lfu, cache, backend]
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

---

## 1. The `maxmemory` Threshold

By default, 64-bit Redis instances have no memory limit (`maxmemory 0`). In containerized Linux environments (Docker, Kubernetes), unconstrained memory growth causes the host kernel OOM Killer to send a `SIGKILL` to the Redis process.

```bash
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 5
```

---

## 2. Summary of 8 Eviction Policies

| Policy Name | Target Keys | Selection Algorithm | Best Use Case |
|---|---|---|---|
| **`noeviction`** | None | Returns `OOM` error on writes when maxmemory is reached. | Redis used as a primary database (zero data loss permitted). |
| **`allkeys-lru`** | ALL keys | Approximated Least Recently Used. | **Default for general-purpose application caching.** |
| **`volatile-lru`** | TTL keys only | Approximated Least Recently Used. | Mixed DB: permanent session records + temporary caches. |
| **`allkeys-lfu`** | ALL keys | Approximated Least Frequently Used (8-bit log counter). | Power-law traffic distributions (viral posts vs cold data). |
| **`volatile-lfu`** | TTL keys only | Approximated Least Frequently Used. | Frequency-based eviction for ephemeral cache keys. |
| **`allkeys-random`** | ALL keys | Uniform Random. | Uniform access patterns where key age is irrelevant. |
| **`volatile-random`** | TTL keys only | Uniform Random. | Random eviction scoped strictly to ephemeral keys. |
| **`volatile-ttl`** | TTL keys only | Evicts key with nearest remaining TTL expire timestamp. | Prioritizes purging keys about to expire naturally. |

---

## 3. Under the Hood: Approximated LRU/LFU

True LRU requires maintaining a globally synchronized Doubly-Linked List across millions of keys, incurring significant memory pointer overhead ($\approx 16\text{--}24\text{ bytes}$ per key) and CPU locking penalties on every read operation.

### Probabilistic Sampled LRU
Redis uses a **probabilistic sampled LRU algorithm**:
1. When a write requires memory eviction, Redis randomly samples $N$ keys (default `maxmemory-samples 5`).
2. It inspects the 24-bit LRU timestamp clock stored inside each key's `redisObject` header.
3. It evicts the single key with the oldest idle time from the sample pool.
4. Setting `maxmemory-samples 10` achieves $99\%$ mathematical equivalence to true LRU at a minimal CPU cost.

---

## Interview Questions

### Q1. What is the difference between `allkeys-lru` and `volatile-lru` eviction policies?
> `allkeys-lru` evaluates and evicts the least recently used keys across the **entire keyspace**, regardless of whether keys have an explicit TTL expiration set. `volatile-lru` limits eviction candidate sampling strictly to keys configured with an explicit TTL (`EXPIRE`). If all keys with a TTL are evicted and memory remains full, `volatile-lru` falls back to throwing `OOM command not allowed` errors on new writes.

### Q2. Why does Redis use an Approximated LRU algorithm instead of a True LRU doubly-linked list?
> A true LRU algorithm requires allocating a global Doubly-Linked List connecting every stored key object. Every read operation (`GET`) would require executing $O(1)$ node detach and head-reattachment pointer arithmetic, introducing lock overhead and consuming $16\text{--}24\text{ bytes}$ of additional RAM per key for pointers. Redis's sampled LRU (sampling 5–10 random keys) provides nearly identical eviction precision with zero memory pointer overhead.

### Q3. How does `allkeys-lfu` differ from `allkeys-lru` in high-throughput caching environments?
> `allkeys-lru` (Least Recently Used) evicts keys based strictly on idle time since the last access. A key read once 1 second ago will be retained over a key read 1,000 times 10 seconds ago. `allkeys-lfu` (Least Frequently Used) maintains an 8-bit logarithmic access frequency counter alongside a decay timer, accurately identifying and retaining true "hot" keys even if they were not accessed in the last few seconds.

---

## See Also

- [Redis TTL & Key Expiration Mechanics](./redis-ttl-expiry.md)
- [Redis Architecture Overview](./redis-overview.md)
- [Redis Distributed Cache Patterns](./redis-distributed-cache.md)
