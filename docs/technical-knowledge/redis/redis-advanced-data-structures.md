---
id: redis-advanced-data-structures
title: "Redis Advanced Data Structures & Algorithms"
slug: redis-advanced-data-structures
description: A senior deep dive into Redis advanced data types — Bitmaps, HyperLogLog, Geospatial, Streams, Sorted Sets, and Bloom Filters — with internals, memory math, production patterns, and when to use each.
tags: [redis, bitmap, hyperloglog, geospatial, streams, sorted-sets, bloom-filter, backend, architecture, performance]
---

import RedisAdvancedDataStructuresDiagram from '@site/src/components/RedisAdvancedDataStructuresDiagram';
import RedisSkipListDiagram from '@site/src/components/RedisSkipListDiagram';
import RedisGeospatialDiagram from '@site/src/components/RedisGeospatialDiagram';
import RedisBitmapBitopDiagram from '@site/src/components/RedisBitmapBitopDiagram';
import RedisBloomFilterDiagram from '@site/src/components/RedisBloomFilterDiagram';

# Redis Advanced Data Structures & Algorithms

<RedisAdvancedDataStructuresDiagram />

---

Standard Redis Strings, Lists, Hashes, and Sets handle the majority of use cases elegantly. But operating at genuine scale — millions of users, billions of events, real-time leaderboards, geolocation queries — exposes the limits of naive data modeling. Tracking unique visitors with a `SET` of user IDs costs gigabytes of RAM. Computing "users active in the last 30 days" with a loop is catastrophically slow.

Advanced Redis data structures solve these problems using specialized algorithms that trade a small amount of precision for orders-of-magnitude improvements in memory efficiency and query speed. This guide covers the internals, memory mathematics, production patterns, and the trade-offs engineers must own when choosing each structure.

---

## 1. Sorted Sets (ZSET) — Ranked Data at Scale

<RedisSkipListDiagram />

Sorted Sets are one of Redis's most powerful general-purpose structures, underpinning several of the specialized structures below (GEO, leaderboards). Understanding their internals is foundational.

### How Sorted Sets Work Internally

A Sorted Set stores `(member, score)` pairs. Members are unique strings; scores are 64-bit IEEE 754 floating-point numbers. Redis maintains two internal data structures simultaneously:

**Skip List**: a probabilistic linked list with multiple "express lanes" that allow O(log N) range traversal. When you ask "give me rank 1–100," Redis traverses the skip list — not a B-tree (no disk seeks), not a full scan.

**Hash Table**: for O(1) individual score lookups by member name.

This dual structure means: `ZSCORE` = O(1), `ZRANK` = O(log N), `ZRANGE` = O(log N + M) where M is the number of results returned.

:::tip[Encoding optimization]
When a Sorted Set has fewer than 128 members AND all member strings are shorter than 64 bytes, Redis uses a compact `listpack` encoding instead of skip list + hash table — saving significant memory. Once either threshold is crossed, Redis transparently upgrades to the full dual structure.
:::

### Core Operations

---

## 5. Redis Streams — Event Log and Message Queue

Redis Streams (`XADD`, `XREAD`, `XREADGROUP`) implement an **append-only log** — the same data structure underlying Kafka. Unlike Pub/Sub (fire-and-forget), Streams are persistent, replayable, and support consumer groups for distributed processing.

### How Streams Work Internally

---

## 8. Memory and Performance Reference

### Memory Comparison for 100 Million Users

| Use Case | Data Structure | Memory |
|:---|:---|:---|
| Track which users logged in today | Redis SET (user IDs as strings) | ~6 GB |
| Track which users logged in today | Bitmap | 12.5 MB |
| Count unique users (approximate) | HyperLogLog | 12 KB |
| Check if email was seen before | Bloom Filter (0.1% error) | ~143 MB |
| Check if email was seen before | Redis SET (exact) | ~6–10 GB |

### Time Complexity at a Glance

| Structure | Insert | Query | Range | Notes |
|:---|:---|:---|:---|:---|
| Sorted Set | O(log N) | O(1) score lookup | O(log N + M) | M = result count |
| GEO | O(log N) | O(N+log N) radius | O(N+log N) | N = results examined |
| Bitmap | O(1) | O(1) per bit | O(N) BITCOUNT | N = byte range |
| HyperLogLog | O(1) | O(1) | O(K) PFMERGE | K = HLLs merged |
| Bloom Filter | O(K) | O(K) | N/A | K = hash functions (~7) |
| Streams | O(1) append | O(log N) by ID | O(N) range | N = entries in range |

---

## Interview Questions

**Q: Why is HyperLogLog always 12 KB regardless of how many unique items you add?**

> HLL doesn't store the actual items — it stores only the maximum number of leading zeros seen in each of its 16,384 registers (buckets). Each register needs at most 6 bits (to store a value 0–63). Total: 16,384 × 6 bits = 98,304 bits = 12 KB. Adding a new item updates at most one register (if the new leading-zero count exceeds the current maximum for that register). The estimate is derived from these 16,384 running maxima via a harmonic mean calculation — independent of how many items have been added.

**Q: When would you use a Bitmap over a Set for tracking user activity?**

> Bitmaps are the right choice when user IDs are dense integers and the population is large. For 100M users, a Set storing user IDs as strings costs ~6 GB, while a Bitmap costs a fixed 12.5 MB (based on max user ID, not active user count). The crossover point is roughly when the SET would cost more memory than the Bitmap — for sparse user IDs or small populations, a SET may be comparable or simpler. The additional advantage of Bitmaps is the ability to compute set operations (AND for retention, OR for weekly active users, NOT for churn) using BITOP in a single command — these would require multiple SINTERSTORE/SUNIONSTORE operations with Sets.

**Q: What is the difference between Redis Streams and Pub/Sub?**

> Redis Pub/Sub is fire-and-forget: if no subscriber is connected when a message is published, the message is permanently lost. There is no persistence, no replay, and no acknowledgment. Redis Streams are an append-only log — messages persist until explicitly trimmed, consumers can replay from any offset, and consumer groups provide at-least-once delivery via the Pending Entries List (PEL) and XCLAIM for crashed consumer recovery. Streams are the correct choice when message delivery guarantees matter; Pub/Sub is appropriate only for truly ephemeral real-time notifications where loss is acceptable.

**Q: A Bloom Filter says an item "probably exists." How do you handle that false positive?**

> The standard pattern is a two-layer check: use the Bloom Filter as a fast pre-filter, and fall back to the authoritative source (database) only when the filter returns a positive result. If the filter says "definitely does not exist" (all hash positions are 0), skip the DB query entirely — this is the common case and the source of the performance benefit. If the filter says "probably exists," execute the DB query to confirm. The false positive rate is configurable at creation time (e.g., 0.1%) — choose it based on the cost of a false positive (one unnecessary DB query) vs. the memory cost of a lower error rate. Bloom Filters cannot have false negatives, so if the filter says "no," you can trust it completely.