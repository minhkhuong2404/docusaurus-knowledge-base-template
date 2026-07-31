---
id: redis-eviction-policies
title: "Redis Eviction Policies"
slug: redis-eviction-policies
description: Comprehensive guide to Redis maxmemory algorithms (LRU, LFU, Random) and how Redis approximates caching algorithms at scale for senior engineers.
tags: [redis, eviction, lru, lfu, cache, backend]
---

import RedisEvictionPoliciesDiagram from '@site/src/components/RedisEvictionPoliciesDiagram';

# 🗑️ Redis Eviction Policies & Maxmemory

What happens when Redis runs exactly out of its assigned RAM? If you don't configure this correctly, your entire caching infrastructure will crash with `OOM command not allowed` exceptions.

Redis utilizes **Eviction Policies** to mathematically determine which keys should be sacrificed to make room for new data.

<RedisEvictionPoliciesDiagram />

---

---

## 🏗️ 1. The Maxmemory Threshold

By default, a 64-bit Redis instance has **no memory limit**. It will continuously consume RAM until the Linux kernel panic-invokes the OOM Killer and brutally murders the Redis process.

You must *always* set `maxmemory` in production.

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

---

## 🧹 2. The Policies

Redis 4.0+ offers 8 distinct eviction policies. They fall into two main categories: `volatile` (only evicts keys that have an explicit TTL set) and `allkeys` (evicts any key regardless of TTL).

### 👶 Beginner Concept: The "Nightclub Line" Analogy
Imagine a crowded nightclub with exactly 100 maximum capacity (Maxmemory).
- **`noeviction`:** The bouncer just says "No". Nobody new can enter.
- **`allkeys-random`:** The bouncer runs inside, blindfolds himself, tackles a random person, throws them out, and lets the new guy in. Fast, but dangerous.
- **`volatile-lru`:** The bouncer looks at everyone wearing a "Guest Pass" (TTL set). He asks: *“Who has been standing still the longest?”* (Least Recently Used), and kicks them out. He ignores the VIPS (no TTL).

### The 8 Policies
| Policy Name | Target Keys | Selection Algorithm | Best Use Case |
|-------------|------------|---------------------|---------------|
| `noeviction` | None | Returns error if out of memory | When using Redis purely as a strict Database, not a cache. |
| `allkeys-lru` | ALL keys | Least Recently Used | **Default for caching.** Safest fallback when all keys are caching data. |
| `volatile-lru` | TTL keys only | Least Recently Used | You mix permanent data and temp cache in the exact same database. |
| `allkeys-lfu` | ALL keys | Least Frequently Used | You have strict hot/cold data sets (e.g. viral tweets vs old news). |
| `volatile-lfu` | TTL keys only | Least Frequently Used | Viral data mixed with permanent session data. |
| `allkeys-random` | ALL keys | Pure Random | You want absolute maximum write speed and don't care what you lose. |
| `volatile-random` | TTL keys only | Pure Random | Same, but protecting VIP permanent keys. |
| `volatile-ttl` | TTL keys only | Shortest TTL remaining | Evicting the keys that were about to naturally die anyway. |

---

## 🧠 3. Senior Deep Dive: LRU/LFU Approximations

Senior engineers must know this: **Redis does not use a true LRU algorithm.**

### Why Not True LRU?
A true LRU requires a massive Doubly-Linked List connecting every single key in the database. Every time someone reads a key, Redis would need to update the pointers to move that key to the "head" of the list. That pointer arithmetic costs too much CPU and RAM overhead for a system designed to be the fastest in the world.

### The Redis Approximation Algorithm
Instead, Redis uses a highly optimized **Probabilistic/Approximated LRU**:
1. When Redis needs to evict, it grabs a random sample of `N` keys (default is 5).
2. It looks at the 24-bit LRU clock embedded strictly in the header of those 5 specific keys.
3. It finds the oldest key out of those 5 and evicts it.
4. Next time, it adds new random keys to an eviction pool and repeats.

**Tuning the Sample Size:**
```bash
maxmemory-samples 5   # Great performance, okay accuracy
maxmemory-samples 10  # Very close to true LRU, costs more CPU 
```

### LFU (Least Frequently Used) vs LRU
- **LRU (Recent):** If I read a useless key 1 second ago, it is safe from eviction, even if I never read it again.
- **LFU (Frequent):** Tracks an 8-bit logarithmic counter. If I read the "Homepage" key 10,000 times an hour ago, and the "Boring Page" key 1 time five seconds ago, LFU correctly identifies that "Homepage" is fundamentally more valuable and evicts the "Boring Page" instead.

**Senior Heuristic:** Move from `allkeys-lru` to `allkeys-lfu` when migrating from a generic cache to a heavily optimized CDN-style power-law distribution cache.
