---
id: caching-strategies
title: Caching Strategies
sidebar_label: Caching Strategies
description: In-depth guide to caching strategies including cache-aside, write-through, write-behind, eviction policies, cache stampede prevention, hotkeys, Redis data structures, and multi-level caching.
tags: [caching, redis, caffeine, eviction, ttl, cache-invalidation, performance, system-design]
---

# Caching Strategies

import CacheAsideSequenceDiagram from '@site/src/components/CacheAsideSequenceDiagram';
import WriteThroughSequenceDiagram from '@site/src/components/WriteThroughSequenceDiagram';
import WriteBehindSequenceDiagram from '@site/src/components/WriteBehindSequenceDiagram';
import ReadThroughSequenceDiagram from '@site/src/components/ReadThroughSequenceDiagram';
import CacheStampedeThunderingHerdDiagram from '@site/src/components/CacheStampedeThunderingHerdDiagram';
import HotKeySaturationDiagram from '@site/src/components/HotKeySaturationDiagram';
import CacheHierarchiesDiagram from '@site/src/components/CacheHierarchiesDiagram';
import LruEvictionDiagram from '@site/src/components/LruEvictionDiagram';
import LfuEvictionDiagram from '@site/src/components/LfuEvictionDiagram';
import TtlExpirationDiagram from '@site/src/components/TtlExpirationDiagram';
import CacheConsistencyDiagram from '@site/src/components/CacheConsistencyDiagram';
import CachePenetrationDiagram from '@site/src/components/CachePenetrationDiagram';
import CacheAvalancheDiagram from '@site/src/components/CacheAvalancheDiagram';
import CacheStack8LayersDiagram from '@site/src/components/CacheStack8LayersDiagram';
import RedisCachePatternsDiagram from '@site/src/components/RedisCachePatternsDiagram';

> A cache is a **fast, temporary data store** closer to the application than the source of truth. It trades a bit of storage capacity and system complexity for raw speed.

To understand why this matters, consider the hardware limits: accessing data from a database on disk (like an SSD) takes about 1 millisecond. Accessing data from memory (RAM) takes about 100 nanoseconds. That makes caching roughly **10,000 times faster** than querying a database.

## Table of Contents

- [The 8-Layer Cache Stack (From CPU L1 to CDN)](#the-8-layer-cache-stack-from-cpu-l1-to-cdn)
  - [The 4 "Invisible" Cache Layers](#the-4-invisible-cache-layers)
  - [The 8 Layers Architectural Breakdown](#the-8-layers-architectural-breakdown)
  - [Execution Boundaries](#execution-boundaries)
- [Jeff Dean's Latency Hierarchy & Memory vs Network Myth](#jeff-deans-latency-hierarchy--memory-vs-network-myth)
- [The Mathematical Economics of Caching: AMAT & Break-Even Hit Ratio](#the-mathematical-economics-of-caching-amat--break-even-hit-ratio)
  - [Baseline Request Parameters & Network RTT Overhead](#baseline-request-parameters--network-rtt-overhead)
  - [AMAT (Average Memory Access Time) Formula](#amat-average-memory-access-time-formula)
  - [Deriving the Break-Even Hit Ratio](#deriving-the-break-even-hit-ratio)
  - [Case Studies: Heavy vs. Ultra-Fast Query Scenarios](#case-studies-heavy-vs-ultra-fast-query-scenarios)
  - [RAM Sizing Trap & Zipf's Law (Working Set vs. Dataset)](#ram-sizing-trap--zipfs-law-working-set-vs-dataset)
- [The Invalidation Paradox & Browser Cache Busting](#the-invalidation-paradox--browser-cache-busting)
  - [The Invalidation Paradox](#the-invalidation-paradox)
  - [The Content Hashing & URL Immutability Solution](#the-content-hashing--url-immutability-solution)
- [Cache Placement Safety Rules & Decision Matrix](#cache-placement-safety-rules--decision-matrix)
- [Cache Locations & Levels](#cache-locations--levels)
  - [Client-Side Caching](#client-side-caching)
  - [CDN (Content Delivery Network)](#cdn-content-delivery-network)
  - [In-Process Caching (L1)](#in-process-caching-l1)
  - [External Caching (L2)](#external-caching-l2)
- [Caching Patterns (Architectures)](#caching-patterns-architectures)
  - [1. Cache-Aside (Lazy Population)](#1-cache-aside-lazy-population)
  - [2. Read-Through](#2-read-through)
  - [3. Write-Through](#3-write-through)
  - [4. Write-Behind (Write-Back)](#4-write-behind-write-back)
  - [5. Write-Around](#5-write-around)
  - [6. Refresh-Ahead](#6-refresh-ahead)
- [Cache Eviction & Admission Policies](#cache-eviction--admission-policies)
  - [The Core of Cache Eviction: Working Set vs. Dataset](#the-core-of-cache-eviction-working-set-vs-dataset)
  - [The Two Memory Gates: Admission Policy vs. Eviction Policy](#the-two-memory-gates-admission-policy-vs-eviction-policy)
  - [The 3 Families of Eviction Policies & Engineering Trade-Offs](#the-3-families-of-eviction-policies--engineering-trade-offs)
  - [W-TinyLFU: State-of-the-Art Architecture (Caffeine Cache)](#w-tinylfu-state-of-the-art-architecture-caffeine-cache)
- [Cache Expiration & TTL Policies](#cache-expiration--ttl-policies)
  - [The Core Architectural Triad: Expiration vs. Eviction vs. Invalidation](#the-core-architectural-triad-expiration-vs-eviction-vs-invalidation)
  - [How Cache Engines Clean Up Expired Keys (Dual-Mechanism)](#how-cache-engines-clean-up-expired-keys-dual-mechanism)
  - [Taxonomy: The 5 Cache Expiration Policies](#taxonomy-the-5-cache-expiration-policies)
- [The "Hard" Problems in Caching](#the-hard-problems-in-caching)
  - [Cache Stampede (Thundering Herd)](#1-cache-stampede-thundering-herd)
  - [Cache Consistency (Stale Data)](#2-cache-consistency-stale-data)
  - [Hotkeys](#3-hotkeys)
  - [Cache Penetration](#4-cache-penetration)
  - [Cache Avalanche](#5-cache-avalanche)
- [How to Handle Caching in a System Design Interview](#how-to-handle-caching-in-a-system-design-interview)
- [How Caching Works Internally](#how-caching-works-internally)
  - [Cache Storage Structures](#cache-storage-structures)
  - [Hash Functions](#hash-functions)
  - [Memory Management](#memory-management)
  - [Concurrency Control](#concurrency-control)
- [Redis Caching Implementation](#redis-caching-implementation)
  - [Basic Redis Operations](#basic-redis-operations)
  - [Redis Data Structures for Caching](#redis-data-structures-for-caching)
  - [Redis Cluster and Sharding](#redis-cluster-and-sharding)
  - [Redis Persistence](#redis-persistence)
- [Multi-Level Caching](#multi-level-caching)
  - [L1 + L2 Caching](#l1--l2-caching)
  - [Cache Hierarchies](#cache-hierarchies)
  - [Cache Coherence](#cache-coherence)
- [Cache Invalidation Strategies](#cache-invalidation-strategies)
  - [Time-Based Invalidation](#time-based-invalidation)
  - [Event-Based Invalidation](#event-based-invalidation)
  - [Write-Through Invalidation](#write-through-invalidation)
  - [Cache Aside Invalidation](#cache-aside-invalidation)
- [Cache Warming Strategies](#cache-warming-strategies)
  - [Lazy Loading](#lazy-loading)
  - [Eager Loading](#eager-loading)
  - [Scheduled Refresh](#scheduled-refresh)
  - [Predictive Preloading](#predictive-preloading)
- [Cache Monitoring and Metrics](#cache-monitoring-and-metrics)
  - [Key Metrics](#key-metrics)
  - [Cache Performance Analysis](#cache-performance-analysis)
  - [Alerting](#alerting)
- [Real-World Implementations](#real-world-implementations)
  - [Redis](#redis)
  - [Memcached](#memcached)
  - [Varnish](#varnish)
  - [CDN Providers](#cdn-providers)
  - [Application-Level Caching](#application-level-caching)
- [Integration Patterns](#integration-patterns)
  - [Spring Cache](#spring-cache)
  - [Caffeine Cache](#caffeine-cache)
  - [Hazelcast](#hazelcast)
  - [Ehcache](#ehcache)
- [Pros and Cons](#pros-and-cons)
  - [Cache-Aside](#cache-aside)
  - [Write-Through](#write-through)
  - [Write-Behind](#write-behind)
  - [Read-Through](#read-through)
- [Interview Questions](#interview-questions)
- [Senior Deep Dive: Advanced Topics](#senior-deep-dive-advanced-topics)
  - [Cache Partitioning](#cache-partitioning)
  - [Cache Sharding](#cache-sharding)
  - [Distributed Caching](#distributed-caching)
  - [Cache Consistency Models](#cache-consistency-models)
  - [Cache Security](#cache-security)
  - [Cache Performance Optimization](#cache-performance-optimization)
- [Additional Resources](#additional-resources)
- [Best Practices](#best-practices)

---

## The 8-Layer Cache Stack (From CPU L1 to CDN)

When engineers say "we added Redis to cache queries," they often overlook the fact that an incoming HTTP request has already navigated **up to seven other caching layers** before hitting the database disk. Caching is not a single tool—it is a continuous 8-tier stack stretching from hardware silicon up to the user's web browser.

<CacheStack8LayersDiagram initialTab="stack" />

### The 4 "Invisible" Cache Layers

Before an incoming request ever reaches a physical storage drive (NVMe/SSD/HDD), four distinct memory stores can answer it:
1. **Browser HTTP Cache** (User local disk/RAM memory)
2. **CDN Edge Server** (Geographically distributed PoP)
3. **In-Process Application Cache** (JVM / Node.js Process Heap)
4. **Database Buffer Pool** (InnoDB Buffer Pool / Postgres Shared Buffers)

> **The Return-Path Principle**: When a request experiences a cache miss across all layers and hits physical storage, the returning response writes a fresh copy back into **every single layer on its way out**. Subsequent reads will short-circuit earlier in the pipeline.

### The 8 Layers Architectural Breakdown

1. **Browser HTTP Cache**: Client-side storage managed by the browser. Zero network hop when hit.
2. **CDN / Edge Network**: Distributed PoPs (Cloudflare, AWS CloudFront) caching static media and public API responses close to the user (~10-30 ms).
3. **Reverse Proxy Gateway**: Perimeter cache (NGINX, Varnish, Envoy) serving full HTML pages, static bundles, or micro-cached responses (~1-5 ms).
4. **In-Process App Cache (L1)**: Process-local heap memory (Caffeine, Guava) providing sub-microsecond access (`<100 ns`). High speed, but isolated per server instance.
5. **Distributed Cache (L2)**: External shared cache (Redis Cluster, Memcached) accessible by all application instances over network TCP (~0.5-2 ms).
6. **Database Buffer Pool**: DBMS shared memory (InnoDB Buffer Pool) caching database data pages and index pages in RAM (~100-500 µs).
7. **OS Page Cache**: Linux VFS page cache using unallocated system RAM to store filesystem disk blocks (~1-10 µs).
8. **CPU L1 / L2 / L3 Caches**: Hardware SRAM integrated directly into CPU dies (L1 ~0.5 ns, L2 ~7 ns, L3 ~15 ns) running cache coherence protocols (MESI/MOESI).

### Execution Boundaries

The 8 layers are demarcated by three distinct operational zones:
* **Before Application Code Runs (Layers 1-3)**: Browser, CDN, and Reverse Proxy answer requests before your application process receives a single packet.
* **Controlled directly by Application Code (Layers 4-5)**: In-Process Caffeine and Distributed Redis are the **only two layers** application developers write explicit code to read and write.
* **Below Application Code (Layers 6-8)**: DB Buffer Pool, OS Page Cache, and CPU SRAM operate autonomously in kernel and hardware space.

---

## Jeff Dean's Latency Hierarchy & Memory vs Network Myth

Understanding the orders of magnitude of hardware and network latency is essential for system design decisions. Below are Jeff Dean's classic numbers (circa 2012) scaled to modern hardware:

<CacheStack8LayersDiagram initialTab="latency" />

### The Classic Latency Numbers

| Operation | Typical Latency | Scale Ratio |
|---|---|---|
| **CPU L1 Cache Reference** | `0.5 ns` | `1x (Baseline)` |
| **CPU L2 Cache Reference** | `7 ns` | `14x` |
| **Main System RAM Memory Read** | `100 ns` | `200x` |
| **NVMe SSD Random 4KB Read** | `20 – 70 µs` | `40,000x – 140,000x` |
| **Redis Network Round-Trip (Same DC)** | `500 µs (0.5 ms)` | `1,000,000x` |
| **Rotational Hard Disk Seek** | `10 ms` | `20,000,000x` |
| **Transatlantic Packet (CA ↔ NL ↔ CA)** | `150 ms` | `300,000,000x` |

### The "Redis is RAM Speed" Misconception

> **WARNING**: A common pitfall in system design interviews is assuming Redis runs at "RAM memory speed" (~100 ns). Redis stores data in RAM, but accessing it requires a **Network Round-Trip Time (RTT)**.
>
> * **In-Process RAM (Caffeine)**: ~100 ns (Direct pointer dereference)
> * **Distributed Cache (Redis)**: ~500,000 ns (0.5 ms network socket RTT)
>
> Redis is **5,000 times slower** than in-process heap RAM! While Redis is significantly faster than database queries, calling Redis inside a loop of 100 items introduces 50ms of network latency. For ultra-hot data, combine In-Process L1 (Caffeine) with Distributed L2 (Redis).

---

## The Mathematical Economics of Caching: AMAT & Break-Even Hit Ratio

A common knee-jerk reaction among backend engineers when facing slow API responses is: *"Let's just put a cache in front of it!"*. 

However, **cache is never free**. In a standard Cache-Aside architecture, reading from a remote cache server (e.g. Redis) requires a network Round Trip Time (RTT, typically ~1ms). If a cache miss occurs, the application must query the database and perform a synchronous write back to the cache (+1ms RTT). Consequently, **every cache miss incurs an additional +2ms network RTT penalty compared to having no cache at all**.

```
Request Lifecycle Comparison:

1. No Cache:
   Client ──► App (5ms) ──► DB (T_db) ──► Total: T_db + 5ms

2. Cache Hit:
   Client ──► App (5ms) ──► Cache Read RTT (1ms) ──► Total: 6ms
   (Saves: T_db - 1ms)

3. Cache Miss (Sync Write):
   Client ──► App (5ms) ──► Cache Read (1ms) ──► DB (T_db) ──► Cache Write (1ms) ──► Total: T_db + 7ms
   (Penalty: +2ms Network RTT overhead vs No Cache!)
```

---

### Baseline Request Parameters & Network RTT Overhead

To analyze the performance mathematically, we establish standard baseline parameters for a single backend request:
- **$\text{App Overhead}$**: `5ms` (HTTP routing, authentication, validation, JSON serialization/deserialization).
- **$\text{Cache Latency}$**: `1ms` Network RTT for Read, `1ms` Network RTT for Write.
- **$T_{\text{db}}$**: Database execution time + DB network latency.

| Execution Path | Composition | Total Latency | Latency Delta vs. No Cache |
|---|---|---|---|
| **No Cache** | $\text{App}(5\text{ms}) + T_{\text{db}}$ | $T_{\text{db}} + 5\text{ms}$ | Baseline ($0\text{ms}$) |
| **Cache Hit** | $\text{App}(5\text{ms}) + \text{Cache Read}(1\text{ms})$ | $6\text{ms}$ | **Saved: $T_{\text{db}} - 1\text{ms}$** |
| **Cache Miss** | $\text{App}(5\text{ms}) + \text{Cache Read}(1\text{ms}) + T_{\text{db}} + \text{Cache Write}(1\text{ms})$ | $T_{\text{db}} + 7\text{ms}$ | **Penalized: $+2\text{ms}$** |

---

### AMAT (Average Memory Access Time) Formula

In computer architecture (Hennessy & Patterson), the average access latency of a hierarchical memory system is governed by the **AMAT formula**:

$$\mathbf{\text{AMAT} = \text{Time}_{\text{Hit}} + (\text{Miss Rate} \times \text{Miss Penalty})}$$

Where:
- **$\text{Time}_{\text{Hit}}$**: Latency when data is cached = $\text{App}(5\text{ms}) + \text{Cache Read RTT}(1\text{ms}) = \mathbf{6\text{ms}}$.
- **$\text{Miss Rate}$**: $1 - H$ (where $H$ is the **Hit Ratio**, $0 \le H \le 1$).
- **$\text{Miss Penalty}$**: Difference between Miss Latency and Hit Latency:
  $$\text{Miss Penalty} = (T_{\text{db}} + 7\text{ms}) - 6\text{ms} = \mathbf{T_{\text{db}} + 1\text{ms}}$$

Thus, the average request latency with caching is:
$$\text{AMAT} = 6 + (1 - H) \cdot (T_{\text{db}} + 1)$$

---

### Deriving the Break-Even Hit Ratio

For caching to be mathematically viable (reducing latency rather than degrading it), the average response time with cache must be strictly less than or equal to the response time without cache:

$$\text{AMAT} \le T_{\text{No-Cache}}$$

$$6 + (1 - H) \cdot (T_{\text{db}} + 1) \le T_{\text{db}} + 5$$

$$(1 - H) \cdot (T_{\text{db}} + 1) \le T_{\text{db}} - 1$$

$$1 - H \le \frac{T_{\text{db}} - 1}{T_{\text{db}} + 1}$$

$$H \ge 1 - \frac{T_{\text{db}} - 1}{T_{\text{db}} + 1}$$

$$H \ge \frac{(T_{\text{db}} + 1) - (T_{\text{db}} - 1)}{T_{\text{db}} + 1}$$

$$\mathbf{H_{\text{break-even}} = \frac{2}{T_{\text{db}} + 1}}$$

:::tip[Generalized Break-Even Formula]
If cache read RTT is $R_{\text{read}}$ and sync write RTT is $R_{\text{write}}$, the generalized break-even hit ratio is:
$$H_{\text{break-even}} = \frac{R_{\text{read}} + R_{\text{write}}}{T_{\text{db}} + R_{\text{write}}}$$
:::

---

### Case Studies: Heavy vs. Ultra-Fast Query Scenarios

```
Break-Even Hit Ratio vs Database Query Latency:

   100% ┼─────────────────────────────────────────────
        │   ┌─── 66.7% (Fast Query: T_db = 2ms)
    80% │   │
    60% │   │
    40% │   │
    20% │   │               ┌─── 3.9% (Heavy Query: T_db = 50ms)
     0% ┴───┴───────────────┴─────────────────────────
           2ms             50ms                T_db
```

#### Scenario A: Expensive Database Query ($T_{\text{db}} = 50\text{ms}$)
- **No Cache**: $5\text{ms} + 50\text{ms} = 55\text{ms}$.
- **Cache Hit**: $6\text{ms}$ (Saves $49\text{ms}$).
- **Cache Miss**: $57\text{ms}$ (Penalty: $+2\text{ms}$).
- **Break-Even Hit Ratio**:
  $$H \ge \frac{2}{50 + 1} = \frac{2}{51} \approx \mathbf{3.9\%}$$
- **Takeaway**: Because the database query is slow ($50\text{ms}$), only **1 hit out of 25 requests (3.9%)** is needed to overcome the $2\text{ms}$ penalty of the other 24 misses ($1 \times 49\text{ms} \text{ saved} > 24 \times 2\text{ms} = 48\text{ms} \text{ lost}$). Caching heavy queries is virtually always profitable.

#### Scenario B: Ultra-Fast Indexed Query ($T_{\text{db}} = 2\text{ms}$)
- **No Cache**: $5\text{ms} + 2\text{ms} = 7\text{ms}$.
- **Cache Hit**: $6\text{ms}$ (Saves only $1\text{ms}$).
- **Cache Miss**: $9\text{ms}$ (Penalty: $+2\text{ms}$).
- **Break-Even Hit Ratio**:
  $$H \ge \frac{2}{2 + 1} = \frac{2}{3} \approx \mathbf{66.7\%}$$
- **Takeaway**: If your query is already indexed and returns in $2\text{ms}$, you must achieve **at least 66.7% Hit Ratio** just to break even! If your cache hits only 50% of the time, **adding a cache makes your API slower on average** while unnecessarily burning expensive RAM.

:::important[Golden Architecture Rule #1]
**Only cache heavy, computationally expensive, or I/O-bound queries**. Avoid caching queries that already execute in under $2\text{ms}$ unless the primary goal is protecting the database from extreme concurrent QPS spikes.
:::

---

### RAM Sizing Trap & Zipf's Law (Working Set vs. Dataset)

When planning cache capacity, engineers frequently ask: *"How many gigabytes of RAM do we need to provision?"*

In real-world web applications (e-commerce, social media, content platforms), request distributions follow **Zipf's Law** (power-law distribution where access probability $P(k) \propto 1/k^\alpha$, with $\alpha \approx 1$).

```
Total Dataset: 2,000,000 Products (10GB)
Active Peak Working Set: 200,000 Products (1GB)

Hit Ratio Curve under Zipf Distribution (Harmonic CDF):
100% ┼──────────────────────────────┬─────────────── [Efficiency Wall]
     │                       ┌──────┘ 100% Hit Ratio
 95% │                ┌──────┘ 94.6% (500MB)
 90% │         ┌──────┘ 89.2% (250MB)
 85% │  ┌──────┘ 83.7% (125MB)
     ┴──┴──────────────┴──────────────┴──────────────┴──────────────► RAM Size
       125MB         250MB          500MB           1GB            2GB
```

#### The Zipf Capacity-to-Hit-Ratio Progression:
Suppose a catalog has 2,000,000 products ($10\text{GB}$ total dataset), but peak traffic concentrates heavily on the top 200,000 hot items (**$1\text{GB}$ Working Set**):

| Provisioned RAM | Cached Hot Items | Theoretical Hit Ratio (Zipf $\alpha=1$) | Marginal Gain |
|---|---|---|---|
| **125 MB** | 25,000 items | **83.7%** | Base |
| **250 MB** | 50,000 items | **89.2%** | $+5.5\%$ |
| **500 MB** | 100,000 items | **94.6%** | $+5.4\%$ |
| **1 GB** | 200,000 items *(Working Set)* | **~100%** | $+5.4\%$ |
| **2 GB** | 400,000 items | **~100%** | **$0.0\%$ (Zero Marginal Return!)** |

:::caution[The Diminishing Returns Wall]
Once provisioned RAM covers the active **Working Set** ($1\text{GB}$), allocating additional RAM (e.g. scaling from $1\text{GB}$ to $2\text{GB}$ or $10\text{GB}$) yields **virtually zero increase in Hit Ratio**. Always profile and calculate the working set size before scaling cache cluster hardware.
:::

---

## The Invalidation Paradox & Browser Cache Busting

<CacheStack8LayersDiagram initialTab="busting" />

### The Invalidation Paradox

Managing invalidation across the cache stack presents asymmetric control challenges:
* **Redis Key Eviction**: Instant. Execute `DEL key` or `EVAL` script in 1 ms.
* **CDN Purge**: Fast API call, but takes 2–5 seconds to invalidate edge PoPs globally.
* **Browser Cache**: **Zero remote control!** There is no API channel or webhook to forcibly purge a file stored in a user's browser cache.

If you serve a JavaScript or CSS file with `Cache-Control: max-age=86400` (24 hours), you relinquish control over that asset for 24 hours. Deploying a hotfix will **not reach users** whose browsers are serving the cached file.

### The Content Hashing & URL Immutability Solution

Instead of attempting to "evict" browser cache, **change the resource URL**:

1. **Build Time**: Append a cryptographic content hash to the output asset filename:
   ```text
   app.9f3c2b.js   (Hash of asset binary content)
   ```
2. **Server Headers**: Serve hashed assets with aggressive immutability headers:
   ```http
   Cache-Control: public, max-age=31536000, immutable
   ```
3. **The Essential Prerequisite**: Set `index.html` (the root document) to **`no-cache`**:
   ```http
   Cache-Control: no-cache
   ```
   `index.html` acts as the single source of truth containing updated script tags. Because `index.html` forces revalidation, any application deployment generates new asset hashes (`app.7d81e4.js`), causing all 4 caching layers to miss **exactly once** and cleanly load the new code.

---

## Cache Placement Safety Rules & Decision Matrix

Caching data at the wrong layer causes severe vulnerabilities, such as **Cross-User Session Leaks** (e.g., User A receiving User B's profile page cached on a shared CDN).

<CacheStack8LayersDiagram initialTab="matrix" />

### Golden Question Before Caching

Before introducing a cache at any layer, do not merely ask *"How fast will this be?"*. Always ask:

> **"Which layer will answer this request, and can I invalidate or revoke it if the data changes?"**

### Placement Safety Decision Matrix

| Data Category | Target Cache Layer | TTL & Cache Policy | Invalidation Strategy & Safety Rule |
|---|---|---|---|
| **Static Assets** (JS, CSS, Images, Fonts) | CDN + Browser HTTP Cache | `1 Year` (`max-age=31536000, immutable`) | URL Content Hashing (`app.hash.js`). `index.html` must be `no-cache`. |
| **Public HTML & Shared Feeds** | Reverse Proxy (NGINX/Varnish) / CDN | `30 – 60s` (`stale-while-revalidate`) | Micro-caching. **Must NOT** contain session cookies, auth headers, or user PII. |
| **User Private Profile & Auth Sessions** | Distributed Redis / App Session Store | Short TTL (`5–15m`) or sliding window | **CRITICAL**: Use `Cache-Control: private`. Never allow public CDNs to store per-user data. |
| **Config & Feature Flags** | In-Process App Cache (L1 Caffeine) | `1 – 5m` with background refresh | Use Redis Pub/Sub or Webhooks to broadcast instant invalidation across node clusters. |

---

## Cache Locations & Levels

When designing a system, caching can be introduced at multiple layers. You should default to external caching in interviews, but understanding the others is critical for specialized use cases.

### Client-Side Caching

Data is stored directly on the user's device (browser HTTP cache, local storage, or native mobile app memory).

* **Pros:** The fastest possible option; the request never leaves the device. Great for offline functionality (e.g., an app like Strava caching run data locally while offline and syncing when reconnected).
* **Cons:** You have the least amount of control over this data. Validation, freshness, and cache invalidation are notoriously difficult.

**Implementation:**

```javascript
// Browser HTTP Cache
// Server-side headers
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT

// Client-side JavaScript
// Local Storage
localStorage.setItem('userProfile', JSON.stringify(profile));
const cachedProfile = JSON.parse(localStorage.getItem('userProfile'));

// Session Storage
sessionStorage.setItem('tempData', JSON.stringify(data));

// IndexedDB (for larger datasets)
const request = indexedDB.open('MyDatabase', 1);
```

### CDN (Content Delivery Network)

A geographically distributed network of servers that caches content closer to users, optimizing for network latency rather than disk vs. memory speeds.

* **Example:** If your origin server (like AWS S3) is in Virginia and your user is in Australia, a round trip might take 300–350ms. With a CDN, an edge server a few miles away from the user can serve the asset in 20–40ms.
* **Use Cases:** While famous for static media (images, videos), modern CDNs can also cache public API responses, HTML pages, and even run lightweight edge logic for personalization.

**Implementation:**

```yaml
# CloudFront CDN Configuration
Resources:
  MyDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      Origins:
        - DomainName: mybucket.s3.amazonaws.com
          Id: S3Origin
          S3OriginConfig: {}
      DefaultCacheBehavior:
        TargetOriginId: S3Origin
        ViewerProtocolPolicy: allow-all
        AllowedMethods:
          - GET
          - HEAD
        CachedMethods:
          - GET
          - HEAD
        ForwardedValues:
          QueryString: false
        MinTTL: 0
        DefaultTTL: 3600
        MaxTTL: 86400
```

### In-Process Caching (L1)

The cache lives directly inside the memory space of your application server (e.g., a local hash map or JVM heap).

* **Pros:** Ultra-low latency since there is no network hop required to reach an external cache.
* **Cons:** Memory is not shared across application servers. If Server A caches a value, Server B won't see it, leading to potential inconsistencies and duplicated memory usage.
* **Best For:** Small lookup tables, static configuration data, or ultra-low latency requirements where a network hop is unacceptable.

**Implementation:**

```java
// Java ConcurrentHashMap
public class InMemoryCache<K, V> {
    private final ConcurrentHashMap<K, V> cache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<K, Long> timestamps = new ConcurrentHashMap<>();
    private final long ttlMillis;

    public InMemoryCache(long ttlMillis) {
        this.ttlMillis = ttlMillis;
    }

    public void put(K key, V value) {
        cache.put(key, value);
        timestamps.put(key, System.currentTimeMillis());
    }

    public V get(K key) {
        Long timestamp = timestamps.get(key);
        if (timestamp == null) {
            return null;
        }

        if (System.currentTimeMillis() - timestamp > ttlMillis) {
            cache.remove(key);
            timestamps.remove(key);
            return null;
        }

        return cache.get(key);
    }
}

// Caffeine Cache (more sophisticated)
public class CaffeineCacheExample {
    private final Cache<String, String> cache = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .build();

    public String get(String key) {
        return cache.get(key, k -> loadFromDatabase(k));
    }

    private String loadFromDatabase(String key) {
        // Load from database
        return "value";
    }
}
```

### External Caching (L2)

A dedicated caching service (like Redis or Memcached) running on its own server.

* **Pros:** Provides a single, global view of the cache. Once one application server fetches and caches the data, all other application servers instantly benefit from it.
* **Cons:** Introduces a network hop between the application and the cache, making it slightly slower than in-process caching.

**Implementation:**

```java
// Redis with Spring Data Redis
@Service
public class RedisCacheService {
    private final RedisTemplate<String, Object> redisTemplate;

    public void put(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }
}
```

---

## Caching Patterns (Architectures)

> **The Core Axiom**: Adding a cache does not magically make a system simpler or faster. It trades data freshness and memory for speed, **shifting architectural complexity somewhere else**.
>
> All six major caching patterns differ based on a single fundamental question:
> **Who is responsible for populating/writing data into the cache, and WHEN does that write happen?**

<RedisCachePatternsDiagram />

### 1. Cache-Aside (Lazy Population)

The application directly manages both the cache and the database. This is the **most widely deployed pattern** in production engineering.

* **Who Writes & When**: The application process lazily populates the cache *only after a read request misses*.
* **Flow**: Check Cache &rarr; HIT: Return data. MISS: Query Database &rarr; Write result to Cache (with TTL) &rarr; Return data to caller.
* **Pros**: 
  * High Resilience: If the cache crashes, the application automatically falls back to querying the database directly (degraded, but operational).
  * Lean Memory: Only requested data occupies cache RAM.
* **Cons**: 
  * Cache Miss Penalty: A cache miss requires 3 network hops (Cache read fail &rarr; DB query &rarr; Cache write).
  * Cold Start Latency: First access to any record is always slow.
* **Best For**: Read-heavy, write-light workloads (e.g., user profile lookups, article content).

<CacheAsideSequenceDiagram />

**Implementation**:

```java
@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final CacheManager cacheManager;

    public Product getProduct(String productId) {
        Cache cache = cacheManager.getCache("products");
        Product product = cache.get(productId, Product.class);

        if (product == null) {
            // Cache miss - load from database
            product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

            // Populate cache lazily
            cache.put(productId, product);
        }

        return product;
    }

    public void updateProduct(Product product) {
        productRepository.save(product);

        // Invalidate cache key
        Cache cache = cacheManager.getCache("products");
        cache.evict(product.getId());
    }
}
```

---

### 2. Read-Through

The application communicates exclusively with the Cache Abstraction Layer. The cache provider acts as a proxy that transparently loads missing data from the database.

* **Who Writes & When**: The Cache Provider/Loader automatically fetches missing data from the database on behalf of the application during a cache miss.
* **Flow**: App asks Cache Provider &rarr; Provider checks Cache &rarr; MISS: Provider queries DB &rarr; Provider populates Cache &rarr; Provider returns data to App.
* **Pros**:
  * Clean Application Code: Database fallback and loading logic are isolated inside the cache provider.
  * Request Coalescing: Sophisticated cache loaders (e.g., Caffeine `LoadingCache`) coalesce concurrent requests to prevent thundering herd DB stampedes.
* **Cons**:
  * Infrastructure Lock-In: Requires cache framework support (e.g., Spring `@Cacheable`, Caffeine, Guava).
  * Single Point of Failure: If the cache provider crashes or its DB connection pool exhausts, application reads fail.
* **Best For**: Microservices with centralized data access layers or CDN edge caching.

<ReadThroughSequenceDiagram />

**Implementation**:

```java
// Read-Through using Caffeine LoadingCache
public class ReadThroughProductService {
    private final LoadingCache<String, Product> cache;

    public ReadThroughProductService(ProductRepository productRepository) {
        this.cache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .build(productId -> productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId)));
    }

    public Product getProduct(String productId) {
        // App never calls database directly; Caffeine handles DB fetches on miss
        return cache.get(productId);
    }
}
```

---

### 3. Write-Through

Every mutation updates BOTH the Cache and the Database synchronously before returning a success status to the client.

* **Who Writes & When**: The Application/Cache layer synchronously writes updated entities to BOTH the Cache and Database on every write operation.
* **Flow**: App sends Write Request &rarr; Synchronously write to Cache &rarr; Synchronously write to SQL Database &rarr; Return success to Client.
* **Pros**:
  * Zero Stale Data: Cache and Database are strictly synchronized at all times. No cache invalidation logic needed.
  * No Cache Miss Latency: Subsequent reads immediately hit updated data in memory.
* **Cons**:
  * High Write Latency: Every write must wait for double round-trips (Cache write + DB transaction commit).
  * Cache Pollution: Stores written entities that may never be read again, wasting memory.
  * Dual-Write Fragility: If the cache write succeeds but the database transaction rolls back, data inconsistency occurs without two-phase commit (2PC) or compensating transactions.

<WriteThroughSequenceDiagram />

**Implementation**:

```java
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public Order createOrder(Order order) {
        // Write to database
        Order savedOrder = orderRepository.save(order);

        // Synchronously update cache before returning
        redisTemplate.opsForValue().set("order:" + savedOrder.getId(), savedOrder, Duration.ofHours(1));

        return savedOrder;
    }
}
```

---

### 4. Write-Behind (Write-Back)

Writes update the Cache instantly and return success immediately. A background worker process flushes queued updates down to the database asynchronously in batches.

* **Who Writes & When**: Background async workers batch and flush cached updates to the database on a scheduled timer or queue size threshold.
* **Flow**: App writes to Cache (`<1 ms` response) &rarr; Write event pushed to Queue/Stream &rarr; Background worker aggregates writes &rarr; Worker executes bulk batch SQL update to DB.
* **Pros**:
  * Unrivaled Write Performance: Sub-millisecond write response times.
  * DB Load Smoothing: Batches 1,000 individual counter increments into a single bulk `UPDATE` statement, protecting databases from IOPS saturation.
* **Cons**:
  * **CRITICAL DATA LOSS RISK**: If the cache node crashes or power fails before the background worker flushes queued writes, **data is lost permanently**. This is the **ONLY** pattern where data loss can occur.
  * Eventual Consistency: Database reads will lag behind cache state until flush completes.

> **WARNING**: Use Write-Behind ONLY for non-critical, high-throughput metrics (e.g., page view counts, video watch position, telemetry). **NEVER use Write-Behind for financial balances, user credentials, or order checkouts!**

<WriteBehindSequenceDiagram />

**Implementation**:

```java
@Service
public class PageViewCounterService {
    private final RedisTemplate<String, String> redisTemplate;

    public void incrementPageView(String pageId) {
        // Instant write to Redis memory (<1ms response time)
        redisTemplate.opsForValue().increment("page:views:" + pageId);
    }

    // Scheduled background worker flushes aggregated totals to MySQL every 10 seconds
    @Scheduled(fixedRate = 10000)
    public void flushPageViewsToDatabase() {
        Set<String> keys = redisTemplate.keys("page:views:*");
        if (keys == null || keys.isEmpty()) return;

        for (String key : keys) {
            String pageId = key.replace("page:views:", "");
            String viewsStr = redisTemplate.opsForValue().getAndDelete(key);
            if (viewsStr != null) {
                long count = Long.parseLong(viewsStr);
                // Bulk batch SQL update: UPDATE pages SET views = views + ? WHERE id = ?
                pageRepository.incrementViews(pageId, count);
            }
        }
    }
}
```

---

### 5. Write-Around

Writes go directly to the Database, completely bypassing the Cache. Data is loaded into the cache only when a subsequent read request is made.

* **Who Writes & When**: The cache is NOT updated during writes. It is populated lazily on subsequent reads via Cache-Aside.
* **Flow**: App writes update directly to Database &rarr; Cache is untouched &rarr; Next read request triggers Cache Miss &rarr; Cache-Aside populates Cache for future reads.
* **Pros**:
  * Eliminates Cache RAM Waste: Prevents populating cache memory with write-once-never-read data (e.g., raw log files, archived reports).
  * Simple Write Logic: Writes do not need to coordinate with or invalidate cache entities.
* **Cons**:
  * Guaranteed First-Read Cache Miss: The first read immediately following an update will always miss the cache and hit the database.

> **Real-World Combo Pattern**: **Write-Around + Cache-Aside** is the most widely implemented production pattern in enterprise web systems. Writes update SQL directly (bypassing cache), and reads lazily load missing keys into Redis.

---

### 6. Refresh-Ahead

Background worker processes predict which hot keys are about to expire and proactively refresh them from the database before their TTL reaches zero.

* **Who Writes & When**: Background analytics workers refresh hot cache entries before TTL expiration based on access frequency algorithms.
* **Flow**: Worker monitors key TTL & access probability &rarr; Before TTL expires (e.g., at 85% TTL mark), worker queries DB &rarr; Silent update to Cache &rarr; End users experience 100% cache hit rate.
* **Pros**:
  * Eliminates Cold-Start Misses: Users never experience cache miss latency for popular items.
  * Prevents Cache Stampedes: Eliminates thundering herd spikes on key expiration because keys never technically expire while active.
* **Cons**:
  * Wasted System Resources: If the access prediction algorithm miscalculates, unnecessary database queries are executed for keys no one reads.
  * Complex Implementation: Requires background job monitoring, predictive metrics, and queue coordination.
* **Best For**: Highly predictable hot keys (e.g., homepage feeds, trending news, top 100 leaderboards, flash sale items).

**Implementation**:

```java
@Service
public class TrendingFeedCacheWarmer {
    private final FeedRepository feedRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    // Refresh hot feed every 55 seconds (for a key configured with a 60-second TTL)
    @Scheduled(fixedRate = 55000)
    public void refreshTrendingFeedProactively() {
        List<FeedItem> trending = feedRepository.getTopTrendingItems();
        // Silent proactive update before key expires
        redisTemplate.opsForValue().set("feed:trending", trending, Duration.ofSeconds(60));
    }
}
```

---

---

---

## Cache Eviction & Admission Policies

When memory capacity reaches its limit, a cache must discard entries to accommodate incoming data. However, modern high-scale cache architecture is not merely about "kicking out old keys"—it is a coordinated interplay between **The Working Set**, **The Entrance Gate (Admission Policy)**, and **The Exit Gate (Eviction Policy)**.

---

### 1. The Core of Cache Eviction: Working Set vs. Dataset

To design effective caching capacity, engineers must distinguish between the total dataset and the active working set:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE TOTAL DATASET (e.g. 500 GB)                  │
│  (Grows continuously over time with every historical write)                 │
│                                                                             │
│         ┌─────────────────────────────────────────────────────────┐         │
│         │          ACTIVE WORKING SET (e.g. 8 GB)                 │         │
│         │  (Subset accessed by 95% of active peak users)          │         │
│         │                                                         │         │
│         │     ┌─────────────────────────────────────────────┐     │         │
│         │     │         CACHE MEMORY CAPACITY (e.g. 10 GB)  │     │         │
│         │     │    [ Working Set fits cleanly in RAM! ]     │     │         │
│         │     └─────────────────────────────────────────────┘     │         │
│         └─────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Dataset**: The complete volume of data stored in the authoritative database (e.g. 500 GB). This grows monotonically over time with writes.
- **Working Set**: The active subset of data queried by concurrent users within a given operational window (e.g. 8 GB during peak hours). The working set expands or contracts primarily based on active user concurrency.

#### The Fundamental Objective of Eviction
Memory (RAM) is finite and expensive; attempting to hold the entire dataset in RAM is impossible and wasteful. **The ultimate goal of cache eviction is to retain the active Working Set in memory by identifying and expelling items with the least future utility**, maximizing the Cache Hit Ratio while minimizing CPU, memory, and lock contention overhead.

| Capacity Sizing Dynamic | Eviction Behavior | Hit Ratio Impact |
|---|---|---|
| **`Cache Size > Working Set Size`** | Eviction **rarely occurs**. | Any eviction policy (LRU, LFU, FIFO) achieves nearly identical hit ratios. |
| **`Cache Size < Working Set Size`** | Eviction **occurs continuously**. | The choice of **Eviction Policy & Admission Policy** directly determines system survival and hit ratio. |

:::tip[Diagnosing Low Hit Ratios]
If your cache exhibits a poor Hit Ratio while **memory capacity is NOT full**, the root cause is **TTL/Expiration** or **Premature Invalidation**, never Eviction!
:::

---

### 2. The Two Memory Gates: Admission Policy vs. Eviction Policy

Standard cache tutorials focus exclusively on *Eviction* (the exit gate). However, modern production architectures govern memory through **Two Distinct Gates**:

```
                  ┌────────────────────────┐
                  │    INCOMING REQUEST    │
                  └───────────┬────────────┘
                              │
                              ▼
           ╔══════════════════════════════════════╗
           ║    GATE 1: ADMISSION POLICY (IN)     ║
           ║ "Does this key deserve to enter RAM?"║
           ╚══════════════════┬═══════════════════╝
                      ┌───────┴───────┐
             Qualified│               │Rejected (Drop)
                      ▼               ▼
          ┌──────────────────────┐  ┌───────────────────┐
          │   CACHE MEMORY RAM   │  │ Bypass / No-Store │
          └───────────┬──────────┘  └───────────────────┘
                      │ (If Memory Full)
                      ▼
           ╔══════════════════════════════════════╗
           ║    GATE 2: EVICTION POLICY (OUT)     ║
           ║ "Who is the victim to kick out?"     ║
           ╚══════════════════┬═══════════════════╝
                              │
                              ▼
                      [ EVICTED VICTIM ]
```

1. **Admission Policy (The Entrance Gate)**: When new data arrives, evaluates whether the incoming candidate possesses sufficient long-term value to occupy valuable RAM.
2. **Eviction Policy (The Exit Gate)**: When memory is saturated, selects the optimal "victim" entry to expel to make room.

#### The Problem of Cache Pollution & One-Hit Wonders
In systems with **No Admission Policy** (such as standard Redis where the entrance gate is wide open):
1. At midnight, a background batch job or analytical query executes a **Full Table Scan**, reading millions of rows exactly once (*One-Hit Wonders*).
2. Naive LRU treats every freshly read row as "most recently used", populating the head of the cache.
3. **The Disaster (Cache Pollution)**: The entire genuine hot **Working Set** is completely evicted from memory.
4. The next morning, when active users return, the Cache Hit Ratio collapses to near 0%, slamming the primary database with an unmitigated traffic spike.

**Scan Resistance** is the benchmark of whether a caching algorithm can withstand full table scans without evicting its active working set.

#### 4 Common Admission Policies:
1. **No Admission**: Default for most distributed caches (open entrance gate).
2. **N-Hit Admission**: A key is only admitted to cache if it experiences $\ge N$ misses within a time window (tracked via a compact Bloom Filter).
3. **Size-Aware Admission**: Rejects oversized payloads whose memory footprint exceeds their marginal hit ratio value (standard in CDNs).
4. **Frequency-Based Admission (TinyLFU)**: Compares the historical access frequency of the incoming candidate against the eviction victim using a compressed Count-Min Sketch. If the candidate is weaker, it is rejected at the gate.

---

### 3. The 3 Families of Eviction Policies & Engineering Trade-Offs

Every eviction policy attempts to solve one predictive question: *Based on past behavior, which key is least likely to be accessed again in the future?*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    3 Families of Eviction Algorithms                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Recency-Based (LRU)        ──► Temporal Locality (Blind to frequency)    │
│ 2. Frequency-Based (LFU)      ──► Long-term Popularity (Historical bias)    │
│ 3. Hybrid / Multi-Tier (SLRU) ──► Multi-segment Scan Resistance             │
│    └─► W-TinyLFU (Caffeine)   ──► Window LRU + TinyLFU Admission Duel       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1️⃣ Recency-Based: LRU (Least Recently Used)
- **Philosophy**: If an item was accessed recently, it will be accessed again soon (**Temporal Locality**). Adapts very rapidly to sudden shifts in user traffic.
- **Blind Spot**: Highly vulnerable to **Cache Pollution** during table scans or one-hit wonders.
- **Code Implementation**:
  ```java
  public class LRUCache<K, V> extends LinkedHashMap<K, V> {
      private final int maxSize;
      public LRUCache(int maxSize) {
          super(maxSize, 0.75f, true); // true = access-order mode
          this.maxSize = maxSize;
      }
      @Override
      protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
          return size() > maxSize;
      }
  }
  ```

<LruEvictionDiagram />

---

#### 2️⃣ Frequency-Based: LFU (Least Frequently Used)
- **Philosophy**: Items accessed frequently in the past will continue to be popular. Excellent for retaining persistent hot data.
- **Blind Spot**: **Historical Bias & Lack of Decay (Aging)**. An item that went viral during last week's promotional campaign retains an artificially massive counter and sits permanently in memory, preventing new emerging hot items from entering.
- **Code Implementation**:

<LfuEvictionDiagram />

```java
public class LFUCache<K, V> {
    private final int capacity;
    private final Map<K, CacheNode<K, V>> cache = new HashMap<>();
    private final TreeMap<Integer, LinkedHashSet<CacheNode<K, V>>> frequencyMap = new TreeMap<>();
    private int minFrequency = 1;

    private static class CacheNode<K, V> {
        K key; V value; int frequency = 1;
        CacheNode(K key, V value) { this.key = key; this.value = value; }
    }

    public LFUCache(int capacity) { this.capacity = capacity; }

    public V get(K key) {
        CacheNode<K, V> node = cache.get(key);
        if (node == null) return null;
        updateFrequency(node);
        return node.value;
    }

    public void put(K key, V value) {
        if (capacity == 0) return;
        CacheNode<K, V> node = cache.get(key);
        if (node != null) {
            node.value = value;
            updateFrequency(node);
            return;
        }
        if (cache.size() >= capacity) {
            LinkedHashSet<CacheNode<K, V>> minNodes = frequencyMap.get(minFrequency);
            CacheNode<K, V> victim = minNodes.iterator().next();
            minNodes.remove(victim);
            if (minNodes.isEmpty()) frequencyMap.remove(minFrequency);
            cache.remove(victim.key);
        }
        CacheNode<K, V> newNode = new CacheNode<>(key, value);
        cache.put(key, newNode);
        frequencyMap.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(newNode);
        minFrequency = 1;
    }

    private void updateFrequency(CacheNode<K, V> node) {
        int freq = node.frequency;
        LinkedHashSet<CacheNode<K, V>> nodes = frequencyMap.get(freq);
        nodes.remove(node);
        if (nodes.isEmpty()) {
            frequencyMap.remove(freq);
            if (minFrequency == freq) minFrequency++;
        }
        node.frequency++;
        frequencyMap.computeIfAbsent(node.frequency, k -> new LinkedHashSet<>()).add(node);
    }
}
```

---

#### 3️⃣ Hybrid & Multi-Tier Architectures (Scan-Resistant Designs)

| Algorithm | Architecture & Mechanism | Real-World Production Implementations |
|---|---|---|
| **SLRU** *(Segmented LRU)* | Divides cache into **Probation (Trial)** and **Protected (Official)** segments. New keys enter Probation; only promoted to Protected on a 2nd hit. | **Memcached** (3-tier: HOT, WARM, COLD); **MySQL InnoDB Buffer Pool** (3/8 Midpoint Insertion Rule). |
| **ARC** *(Adaptive Replacement Cache)* | Maintains 4 lists (including 2 Ghost Lists that track evicted keys without payload) to dynamically tune the balance between Recency and Frequency in real-time. | **ZFS File System**, IBM Enterprise Storage Subsystems. |
| **CLOCK / Second-Chance** | Approximates LRU via a circular buffer and 1-bit usage flags, eliminating lock contention and pointer overhead. | **PostgreSQL Shared Buffer Pool**, **Linux OS Kernel Page Replacement**. |

---

### 4. W-TinyLFU: State-of-the-Art Architecture (Caffeine Cache)

The most advanced cache architecture available today is **Window TinyLFU (W-TinyLFU)**, designed by Ben Manes and implemented in Java's industry-standard **Caffeine Cache**:

```
                               W-TinyLFU ARCHITECTURE
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   New Key ──► ┌───────────────────┐                                         │
│               │    WINDOW LRU     │ (Allows new keys to prove utility)      │
│               │ (e.g. 1% Capacity)│                                         │
│               └─────────┬─────────┘                                         │
│                         │ Candidate dropped from Window                     │
│                         ▼                                                   │
│             ╔═══════════════════════╗                                       │
│             ║    ADMISSION DUEL     ║ ◄── Count-Min Sketch (4-bit counter)  │
│             ║ Candidate vs. Victim  ║                                       │
│             ╚═══════════┬═══════════╝                                       │
│                Wins     │     Loses (Rejected)                              │
│         ┌───────────────┴───────────────┐                                   │
│         ▼                               ▼                                   │
│  ┌──────────────────────────────┐  [ DISCARD ]                              │
│  │     MAIN CACHE (SLRU)        │                                           │
│  │ ┌──────────────┬───────────┐ │                                           │
│  │ │  Probation   │ Protected │ │                                           │
│  │ │    (20%)     │   (80%)   │ │                                           │
│  │ └──────────────┴───────────┘ │                                           │
│  └──────────────────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Core Components of W-TinyLFU:
1. **Window LRU (1% Cache Size)**: New keys enter an initial admission window unconditionally. This gives brand-new hot keys time to build up frequency before facing admission scrutiny.
2. **Admission Duel via TinyLFU**: When a key falls out of the Window LRU, it challenges the weakest victim at the bottom of the Main Cache (SLRU Probation). Frequencies are estimated using a 4-bit **Count-Min Sketch** with periodic aging reset. If the candidate has higher frequency, it replaces the victim in Main Cache; otherwise, it is immediately discarded.
3. **Adaptive Window (Hill Climbing)**: The size of the Window LRU is not static; Caffeine dynamically resizes the window in real-time using a **Hill Climbing algorithm** to optimize the measured Hit Ratio based on shifting workload characteristics.

```java
// Production Caffeine Configuration (W-TinyLFU)
Cache<String, Product> productCache = Caffeine.newBuilder()
    .maximumSize(50_000)                // Enforces W-TinyLFU eviction
    .recordStats()                      // Observability metrics
    .build();
```

---

---

## Cache Expiration & TTL Policies

<TtlExpirationDiagram />

While Cache Eviction is driven by **memory capacity pressure**, **Cache Expiration** determines the temporal lifecycle of cached data. To design robust architectures, engineers must first establish a clear distinction across the three core cache lifecycle mechanisms:

### The Core Architectural Triad: Expiration vs. Eviction vs. Invalidation

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│    Cache Expiration     │      Cache Eviction     │    Cache Invalidation   │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Driven by: CLOCK (Time) │ Driven by: RAM (Memory) │ Driven by: SOURCE DATA  │
│ TTL period has elapsed  │ Memory limit is reached │ Source of Truth mutated │
│ Marks data as Stale     │ Reclaims memory space   │ Explicit purge / update │
│ Passive/Active cleanup  │ LRU, LFU, FIFO, ARC     │ Event / CDC / Mutation  │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

| Dimension | Cache Expiration | Cache Eviction | Cache Invalidation |
|---|---|---|---|
| **Primary Trigger** | **Time (Clock-driven)** | **Memory Pressure (RAM-driven)** | **Data Mutation (State-driven)** |
| **Why It Happens** | Key's Time-To-Live (TTL) duration or target timestamp has expired. | Cache storage hits `maxmemory` threshold. | Authoritative database record was updated, deleted, or inserted. |
| **Data State** | Data becomes **Stale / Obsolete**. | Data may still be **Fresh and Valid**, but sacrificed to free RAM. | Data becomes **Inconsistent**. |
| **Mechanism / Algorithm** | Passive (Lazy on `GET`) & Active (Periodic Sampling). | LRU, LFU, FIFO, Random, ARC replacement algorithms. | Event-driven pub/sub, CDC pipelines (Debezium), Dual-Delete. |

:::important[The Core Heuristic]
- **Expiration** is governed by the **Clock** (Time).
- **Eviction** is governed by **RAM Capacity** (Memory).
- **Invalidation** is governed by **Source-of-Truth Mutations** (Events).
:::

---

### How Cache Engines Clean Up Expired Keys (Dual-Mechanism)

High-performance cache engines (such as Redis, Memcached, and Caffeine) **never attach an individual hardware/software timer to each key**. Managing millions of concurrent active timers would cause massive CPU scheduling thrashing and memory heap overhead. 

Instead, cache engines combine **two complementary cleanup mechanisms**:

```
1. Passive / Lazy Expiration (Triggered on Client Read):
   Client ──► GET user:100 ──► Engine checks key metadata
                               ├─ Expired? ──► DELETE from RAM ──► Return Cache Miss (nil)
                               └─ Valid?   ──► Return Value

2. Active / Periodic Expiration (Triggered by Background Daemon):
   Background Thread (e.g. 10Hz) ──► Randomly sample 20 keys with TTL
                                     ├─ Scan & delete expired keys
                                     └─ If >25% expired ──► Repeat immediately!
```

#### 1. Passive / Lazy Expiration (On-Access)
- When a client issues a read (`GET key`), the engine inspects the expiration timestamp metadata stored in the key's header.
- If the current time exceeds the expiration timestamp, the engine synchronously deletes the key from memory and returns a **Cache Miss** (`nil` / `null`).
- *Limitation*: Cold, orphaned keys that are never read again would linger in RAM indefinitely if this were the only cleanup path.

#### 2. Active / Periodic Expiration (Probabilistic Sampling)
- A background worker runs periodically (e.g., Redis executes `activeExpireCycle()` 10 times per second, every 100ms).
- In each cycle, it randomly tests **20 keys** with an active TTL from the expiration dictionary.
- All expired keys in the sample are immediately purged from RAM.
- If **more than 25% (5 keys)** of the sample were expired, the engine immediately repeats the sampling cycle to aggressively free memory without blocking the primary event loop.

---

### Taxonomy: The 5 Cache Expiration Policies

Depending on the business domain, access patterns, and failure tolerance, systems must select the appropriate expiration policy:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       5 Cache Expiration Policies                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Absolute Expiration (Expire-After-Write)  ──► Fixed TTL from write time  │
│ 2. Sliding Expiration (Expire-After-Access) ──► TTL resets on every read   │
│ 3. Absolute Point-in-Time (Expire-At)       ──► Target Epoch timestamp      │
│ 4. Variable / Jittered (Entropy-based TTL)  ──► TTL ± Random(Jitter)        │
│ 5. Dynamic / Contextual (Adaptive SLA)      ──► Runtime computed by load/SLA│
└─────────────────────────────────────────────────────────────────────────────┘
```

#### ① Absolute Expiration (Expire-After-Write / Fixed TTL)
- **Mechanism**: TTL is fixed at the moment the entry is written (`PUT`/`SET`). Read operations (`GET`) have **zero effect** on the expiration timestamp. The key expires exactly after duration $T$.
- **Best Use Cases**: Data that changes on a predictable schedule (e.g. daily exchange rates, catalog pricing, public leaderboards refreshed every 10 minutes).
- **Code Example**:
  ```bash
  # Redis: Expire 600 seconds after write
  SET product:450 '{"name":"Laptop"}' EX 600
  ```
  ```java
  // Caffeine: Expire 10 minutes after creation
  Cache<String, Product> cache = Caffeine.newBuilder()
      .expireAfterWrite(10, TimeUnit.MINUTES)
      .build();
  ```

---

#### ② Sliding Expiration (Expire-After-Access / Inactivity Timeout)
- **Mechanism**: The expiration countdown resets back to the full TTL on **every read or write access**. The key remains in cache as long as it is actively used, and only expires after a continuous idle period equal to the sliding window.
- **Best Use Cases**: User authentication sessions, active shopping carts, user presence/activity tracking.
- **Code Example**:
  ```bash
  # Redis 6.2+: Get and atomically reset TTL to 1800s (30 mins)
  GETEX session:token_abc EX 1800
  ```
  ```java
  // Caffeine: Expire 30 minutes after last read or write
  Cache<String, UserSession> sessionCache = Caffeine.newBuilder()
      .expireAfterAccess(30, TimeUnit.MINUTES)
      .build();
  ```

---

#### ③ Absolute Point-in-Time Expiration (Expire-At / Target Timestamp)
- **Mechanism**: Rather than counting down a relative duration, the entry is assigned an explicit **absolute Unix Epoch timestamp** or calendar cutoff.
- **Best Use Cases**: Business deadlines and daily resets (e.g. Daily API rate limits resetting exactly at `23:59:59 UTC`, flash sale promotional pricing ending precisely at `12:00:00`).
- **Code Example**:
  ```bash
  # Redis: Expire exactly at Unix timestamp 1735689599 (23:59:59 UTC)
  SET quota:user_123 "500" EXAT 1735689599
  # Or update existing key:
  EXPIREAT quota:user_123 1735689599
  ```

---

#### ④ Variable / Jittered Expiration (Entropy-Based TTL)
- **Mechanism**: Adds randomized numerical entropy to the base TTL to desynchronize expiration timestamps across keys:
  $$\mathbf{\text{TTL}_{\text{actual}} = \text{TTL}_{\text{base}} \pm \text{Random}(\text{Jitter})}$$
- **Best Use Cases**: Essential when **batch-loading or pre-warming thousands of keys** simultaneously. Prevents **Cache Avalanche / Cache Stampede** where thousands of keys expire in the same second, overwhelming the primary database.
- **Code Example**:
  ```java
  public void cacheBatchProducts(List<Product> products) {
      int baseTtlSeconds = 3600; // 1 hour base
      for (Product p : products) {
          // Add ± 10 minutes (600s) random jitter
          int jitter = ThreadLocalRandom.current().nextInt(-600, 601);
          int actualTtl = baseTtlSeconds + jitter;
          redisTemplate.opsForValue().set("product:" + p.getId(), p, actualTtl, TimeUnit.SECONDS);
      }
  }
  ```

---

#### ⑤ Dynamic / Contextual Expiration (Adaptive SLA)
- **Mechanism**: TTL is computed at runtime via a business function based on external context, such as current database CPU load, payload size, or customer subscription tier.
- **Best Use Cases**:
  - **Adaptive Load Shedding**: When database CPU load exceeds 80%, dynamically double cache TTLs to reduce database read pressure.
  - **Tiered SLAs**: VIP / Enterprise users receive longer session cache lifetimes than free-tier users.
- **Code Example**:
  ```java
  public long calculateDynamicTtl(UserTier tier, double currentDbCpuUsage) {
      long baseTtl = (tier == UserTier.VIP) ? 7200 : 1800; // 2h vs 30m
      if (currentDbCpuUsage > 0.80) {
          // Double cache TTL during high database load to protect DB
          return baseTtl * 2;
      }
      return baseTtl;
  }
  ```

---

## The "Hard" Problems in Caching

Adding a cache doesn't just speed things up; it introduces complex distributed systems challenges that interviewers love to probe into.

### 1. Cache Stampede (Thundering Herd)

A stampede happens when a highly popular cache entry expires (via its TTL), causing a sudden flood of concurrent requests to experience a cache miss all at the exact same time.

* **Example:** Imagine you cache the homepage feed of a site with a 60-second TTL. You get 100,000 requests per second. For 60 seconds, the cache absorbs the load. At exactly 61 seconds, the key expires. In that single moment, 100,000 requests miss the cache and simultaneously slam your database, likely taking it offline via cascading failure.

<CacheStampedeThunderingHerdDiagram />

**Solutions:**

* **Request Coalescing (Single Flight):** When multiple requests try to rebuild the same missing cache key, the system allows only the *first* request to query the database. The other 99,999 requests are forced to wait for that first query to finish and populate the cache before they proceed.

```java
// Request coalescing implementation
public class CoalescingCache<K, V> {
    private final Cache<K, V> cache;
    private final ConcurrentMap<K, CompletableFuture<V>> inFlight = new ConcurrentHashMap<>();
    private final Function<K, V> loader;

    public V get(K key) {
        // Check cache first
        V value = cache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Check if there's already a request in flight
        CompletableFuture<V> future = inFlight.computeIfAbsent(key, k -> {
            // Start loading
            return CompletableFuture.supplyAsync(() -> loader.apply(k))
                .whenComplete((result, error) -> {
                    if (error == null) {
                        cache.put(key, result);
                    }
                    inFlight.remove(key);
                });
        });

        try {
            return future.get(); // Wait for the in-flight request
        } catch (InterruptedException | ExecutionException e) {
            inFlight.remove(key);
            throw new RuntimeException("Failed to load value", e);
        }
    }
}
```

* **Proactive Cache Warming:** Instead of waiting for the full 60 seconds to pass, a background process refreshes the key at the 55-second mark. The cache never technically expires, preventing the herd entirely.

```java
// Proactive cache warming
@Service
public class CacheWarmer {
    private final CacheManager cacheManager;
    private final ProductRepository productRepository;
    private final ScheduledExecutorService scheduler;

    @PostConstruct
    public void init() {
        // Schedule cache warming every 55 seconds
        scheduler.scheduleAtFixedRate(
            this::warmCache,
            0, 55, TimeUnit.SECONDS
        );
    }

    private void warmCache() {
        List<String> popularProductIds = getPopularProductIds();

        for (String productId : popularProductIds) {
            Product product = productRepository.findById(productId)
                .orElse(null);

            if (product != null) {
                Cache cache = cacheManager.getCache("products");
                cache.put(productId, product);
            }
        }
    }
}
```

### 2. Cache Consistency (Stale Data)

Because most architectures read from the cache but write to the database, you create a window where the two data sources return completely different values.

* **Example:** On a social network, a user updates their profile picture from "Image 1" to "Image 2". The database updates instantly to Image 2, but the cache still holds Image 1. For the duration of the cache TTL, all other users will see the stale profile picture.

<CacheConsistencyDiagram />

**Solutions:**

* **Invalidate on Write:** When the database update completes, the application proactively issues a `DELETE` command to the cache key. The next read request will be forced to fetch the fresh Image 2 from the DB.

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    @Transactional
    public void updateProfilePicture(String userId, String newPictureUrl) {
        // Update database
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));
        user.setProfilePictureUrl(newPictureUrl);
        userRepository.save(user);

        // Invalidate cache
        Cache cache = cacheManager.getCache("users");
        cache.evict(userId);
    }
}
```

* **Short TTLs / Eventual Consistency:** Accept the staleness. If a 5-minute delay on a profile picture update is not business-critical, a simple 5-minute TTL allows the system to resolve the inconsistency naturally without complex invalidation logic.

### 3. Hotkeys

A hotkey is a single cache entry that becomes overwhelmingly popular. Even if your overall cache cluster is scaled well, a hotkey creates an uneven load that can overwhelm a specific shard.

* **Example:** You are building X (Twitter). Your system handles standard user profiles perfectly. Suddenly, millions of users try to view Taylor Swift's profile at the exact same moment. That single user's cache key receives millions of requests, overloading the single Redis node responsible for that partition.

<HotKeySaturationDiagram />

**Solutions:**

* **Replication:** Take the highly popular key (Taylor Swift) and replicate it across every cache node in your cluster. The application can then balance read requests evenly across all cache instances.

```java
// Hotkey replication
@Service
public class HotkeyReplicationService {
    private final List<RedisTemplate<String, Object>> redisTemplates;
    private final Set<String> hotkeys = new HashSet<>();

    public void markAsHotkey(String key) {
        hotkeys.add(key);
    }

    public Object get(String key) {
        if (hotkeys.contains(key)) {
            // Read from any replica
            return redisTemplates.get(0).opsForValue().get(key);
        } else {
            // Read from specific shard
            int shard = getShard(key);
            return redisTemplates.get(shard).opsForValue().get(key);
        }
    }

    public void put(String key, Object value) {
        if (hotkeys.contains(key)) {
            // Replicate to all nodes
            for (RedisTemplate<String, Object> template : redisTemplates) {
                template.opsForValue().set(key, value);
            }
        } else {
            // Write to specific shard
            int shard = getShard(key);
            redisTemplates.get(shard).opsForValue().set(key, value);
        }
    }

    private int getShard(String key) {
        return Math.abs(key.hashCode()) % redisTemplates.size();
    }
}
```

* **Local Fallback Cache:** Add an L1 in-process cache to your application servers strictly for ultra-hot items. The application server will serve Taylor Swift's profile straight from its own RAM, completely absorbing the traffic spike before it ever touches your external Redis cluster.

```java
// Local fallback cache for hotkeys
@Service
public class HotkeyLocalCache {
    private final Cache<String, Object> localCache;
    private final RedisTemplate<String, Object> redisTemplate;
    private final Set<String> hotkeys = new HashSet<>();

    public HotkeyLocalCache() {
        this.localCache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();
    }

    public Object get(String key) {
        if (hotkeys.contains(key)) {
            // Check local cache first
            Object value = localCache.getIfPresent(key);
            if (value != null) {
                return value;
            }

            // Load from Redis and cache locally
            value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                localCache.put(key, value);
            }
            return value;
        } else {
            return redisTemplate.opsForValue().get(key);
        }
    }
}
```

### 4. Cache Penetration

Cache penetration occurs when the cache is repeatedly queried for data that doesn't exist, causing every request to hit the database.

* **Example:** A malicious user repeatedly queries for non-existent user IDs. Each request misses the cache and hits the database, potentially overwhelming it.

<CachePenetrationDiagram />

**Solutions:**

* **Cache Null Values:** Cache null results for non-existent data with a short TTL.

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    public User getUser(String userId) {
        Cache cache = cacheManager.getCache("users");
        User user = cache.get(userId, User.class);

        if (user == null) {
            user = userRepository.findById(userId).orElse(null);

            // Cache null result with short TTL
            if (user == null) {
                cache.put(userId, NULL_USER);
            } else {
                cache.put(userId, user);
            }
        }

        return user == NULL_USER ? null : user;
    }

    private static final User NULL_USER = new User();
}
```

* **Bloom Filter:** Use a Bloom filter to quickly check if a key might exist before querying the cache or database.

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final CacheManager cacheManager;
    private final BloomFilter<String> userIdFilter;

    public User getUser(String userId) {
        // Check Bloom filter first
        if (!userIdFilter.mightContain(userId)) {
            return null; // Definitely doesn't exist
        }

        Cache cache = cacheManager.getCache("users");
        User user = cache.get(userId, User.class);

        if (user == null) {
            user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                cache.put(userId, user);
            }
        }

        return user;
    }
}
```

### 5. Cache Avalanche

Cache avalanche occurs when a large number of cache entries expire at the same time, causing a sudden spike in database load.

* **Example:** You set all cache entries to expire at the top of every hour. At 10:00:00, thousands of entries expire simultaneously, overwhelming the database.

<CacheAvalancheDiagram />

**Solutions:**

* **Randomized TTL:** Add random jitter to TTL values to prevent synchronized expiration.

```java
@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final CacheManager cacheManager;
    private final Random random = new Random();

    public Product getProduct(String productId) {
        Cache cache = cacheManager.getCache("products");
        Product product = cache.get(productId, Product.class);

        if (product == null) {
            product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

            // Add random jitter to TTL (60 minutes ± 10 minutes)
            long ttlMinutes = 60 + random.nextInt(20) - 10;
            cache.put(productId, product);
        }

        return product;
    }
}
```

* **Multi-Level Caching:** Use multiple cache layers with different TTLs to spread out the load.

---

## How to Handle Caching in a System Design Interview

Do not blindly drop a cache into your diagram. Interviewers view "adding a cache just to add a cache" without proper justification as a red flag. Follow this framework, typically introduced during the "Deep Dive" or "Scaling" portion of the interview:

1. **Identify and Quantify the Bottleneck:**
   * *Read-heavy workloads:* "We have 100 million daily active users making 20 requests a day. That's 2 billion reads hitting the database. We need a cache to take that load off the primary DB."
   * *Expensive Queries:* "Generating a user's newsfeed requires joining posts, followers, and likes across multiple tables. That computation is too expensive to do on the fly, so we will cache the compiled feed."
   * *Latency Constraints:* "The NFRs state we need a 100ms response time. The database query alone takes too long, so we must cache the API response."

2. **Define the Scope (What to Cache):** Be incredibly explicit. "I will cache the user's compiled newsfeed using the `user_id` as the cache key."

3. **Choose the Architecture:** Explicitly state: "I will use Cache-Aside. On a read request, we check Redis..."

4. **Define the Eviction Policy:** "We will use LRU eviction, alongside a 60-second TTL to ensure the newsfeed data doesn't grow incredibly stale."

5. **Preemptively Address Downsides:** Impress the interviewer by bringing up edge cases before they ask. "Because this newsfeed key is highly requested and expires every 60 seconds, I am worried about a cache stampede. To prevent taking down the database, we will implement request coalescing."

6. **Bonus - Handle Hotkeys:** "If a celebrity user with millions of followers logs in, their newsfeed becomes a hotkey. To prevent overwhelming the single Redis node that holds that key, we will replicate it across all cache nodes and add an L1 fallback cache for the top 100 hottest users."

---

## How Caching Works Internally

### Cache Storage Structures

Caches use various data structures to store and retrieve data efficiently.

**Hash Table:**

```java
// Simple hash table implementation
public class HashTableCache<K, V> {
    private final Entry<K, V>[] table;
    private final int capacity;

    private static class Entry<K, V> {
        K key;
        V value;
        Entry<K, V> next;

        Entry(K key, V value) {
            this.key = key;
            this.value = value;
        }
    }

    @SuppressWarnings("unchecked")
    public HashTableCache(int capacity) {
        this.capacity = capacity;
        this.table = (Entry<K, V>[]) new Entry[capacity];
    }

    public void put(K key, V value) {
        int index = hash(key) % capacity;
        Entry<K, V> entry = table[index];

        while (entry != null) {
            if (entry.key.equals(key)) {
                entry.value = value;
                return;
            }
            entry = entry.next;
        }

        Entry<K, V> newEntry = new Entry<>(key, value);
        newEntry.next = table[index];
        table[index] = newEntry;
    }

    public V get(K key) {
        int index = hash(key) % capacity;
        Entry<K, V> entry = table[index];

        while (entry != null) {
            if (entry.key.equals(key)) {
                return entry.value;
            }
            entry = entry.next;
        }

        return null;
    }

    private int hash(K key) {
        return key == null ? 0 : Math.abs(key.hashCode());
    }
}
```

### Hash Functions

Hash functions determine where data is stored in the cache.

```java
public class CacheHashFunction {
    // Simple hash function
    public static int simpleHash(String key, int buckets) {
        return Math.abs(key.hashCode()) % buckets;
    }

    // Better hash function (MurmurHash simplified)
    public static int murmurHash(String key, int buckets) {
        int hash = 0;
        for (int i = 0; i < key.length(); i++) {
            hash = (hash * 31) + key.charAt(i);
        }
        return Math.abs(hash) % buckets;
    }

    // Consistent hashing for distributed caches
    public static int consistentHash(String key, int buckets) {
        // Use MD5 or SHA-1 for better distribution
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(key.getBytes());
            int hash = ((digest[0] & 0xFF) << 24) |
                      ((digest[1] & 0xFF) << 16) |
                      ((digest[2] & 0xFF) << 8) |
                      (digest[3] & 0xFF);
            return Math.abs(hash) % buckets;
        } catch (NoSuchAlgorithmException e) {
            return simpleHash(key, buckets);
        }
    }
}
```

### Memory Management

Caches must manage memory efficiently to prevent OOM errors.

```java
public class MemoryAwareCache<K, V> {
    private final ConcurrentHashMap<K, CacheEntry<V>> cache;
    private final AtomicLong currentSize = new AtomicLong(0);
    private final long maxSizeBytes;

    private static class CacheEntry<V> {
        V value;
        long sizeBytes;

        CacheEntry(V value, long sizeBytes) {
            this.value = value;
            this.sizeBytes = sizeBytes;
        }
    }

    public MemoryAwareCache(long maxSizeBytes) {
        this.cache = new ConcurrentHashMap<>();
        this.maxSizeBytes = maxSizeBytes;
    }

    public void put(K key, V value) {
        long sizeBytes = estimateSize(value);

        // Check if we need to evict
        while (currentSize.get() + sizeBytes > maxSizeBytes) {
            evictOne();
        }

        CacheEntry<V> entry = new CacheEntry<>(value, sizeBytes);
        cache.put(key, entry);
        currentSize.addAndGet(sizeBytes);
    }

    public V get(K key) {
        CacheEntry<V> entry = cache.get(key);
        return entry != null ? entry.value : null;
    }

    private void evictOne() {
        // Simple LRU eviction
        Iterator<Map.Entry<K, CacheEntry<V>>> it = cache.entrySet().iterator();
        if (it.hasNext()) {
            Map.Entry<K, CacheEntry<V>> entry = it.next();
            currentSize.addAndGet(-entry.getValue().sizeBytes);
            it.remove();
        }
    }

    private long estimateSize(V value) {
        // Rough estimation
        if (value instanceof String) {
            return ((String) value).length() * 2L; // 2 bytes per char
        } else if (value instanceof byte[]) {
            return ((byte[]) value).length;
        } else {
            return 100L; // Default estimate
        }
    }
}
```

### Concurrency Control

Caches must handle concurrent access safely.

```java
public class ConcurrentCache<K, V> {
    private final ConcurrentHashMap<K, CompletableFuture<V>> cache;
    private final Function<K, V> loader;

    public ConcurrentCache(Function<K, V> loader) {
        this.cache = new ConcurrentHashMap<>();
        this.loader = loader;
    }

    public V get(K key) {
        CompletableFuture<V> future = cache.computeIfAbsent(key, k -> {
            // Only one thread will execute this for each key
            return CompletableFuture.supplyAsync(() -> loader.apply(k));
        });

        try {
            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            cache.remove(key);
            throw new RuntimeException("Failed to load value", e);
        }
    }

    public void invalidate(K key) {
        cache.remove(key);
    }

    public void invalidateAll() {
        cache.clear();
    }
}
```

---

## Redis Caching Implementation

### Basic Redis Operations

```java
@Service
public class RedisCacheService {
    private final RedisTemplate<String, Object> redisTemplate;

    // Set value with TTL
    public void set(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    // Get value
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    // Delete key
    public void delete(String key) {
        redisTemplate.delete(key);
    }

    // Check if key exists
    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    // Set TTL for existing key
    public boolean expire(String key, Duration ttl) {
        return Boolean.TRUE.equals(redisTemplate.expire(key, ttl));
    }

    // Get remaining TTL
    public Duration getTtl(String key) {
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null && ttl > 0 ? Duration.ofSeconds(ttl) : null;
    }
}
```

### Redis Data Structures for Caching

**String:**

```java
// Simple key-value caching
redisTemplate.opsForValue().set("user:123", user, Duration.ofHours(1));
User user = (User) redisTemplate.opsForValue().get("user:123");

// Atomic increment
redisTemplate.opsForValue().increment("counter:views");
```

**Hash:**

```java
// Store object fields
redisTemplate.opsForHash().put("user:123", "name", "John");
redisTemplate.opsForHash().put("user:123", "email", "john@example.com");

// Get specific field
String name = (String) redisTemplate.opsForHash().get("user:123", "name");

// Get all fields
Map<Object, Object> user = redisTemplate.opsForHash().entries("user:123");
```

**List:**

```java
// Push to list
redisTemplate.opsForList().rightPush("recent:users", userId);

// Get recent items
List<Object> recentUsers = redisTemplate.opsForList().range("recent:users", 0, 9);

// Trim list
redisTemplate.opsForList().trim("recent:users", 0, 99);
```

**Set:**

```java
// Add to set
redisTemplate.opsForSet().add("user:123:followers", followerId1, followerId2);

// Check membership
boolean isFollower = redisTemplate.opsForSet().isMember("user:123:followers", followerId1);

// Get all members
Set<Object> followers = redisTemplate.opsForSet().members("user:123:followers");
```

**Sorted Set:**

```java
// Add with score
redisTemplate.opsForZSet().add("leaderboard", userId1, 1000);
redisTemplate.opsForZSet().add("leaderboard", userId2, 1500);

// Get top N
Set<Object> topUsers = redisTemplate.opsForZSet().reverseRange("leaderboard", 0, 9);

// Get rank
Long rank = redisTemplate.opsForZSet().reverseRank("leaderboard", userId1);
```

### Redis Cluster and Sharding

```java
@Configuration
public class RedisClusterConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory());
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisClusterConfiguration clusterConfig = new RedisClusterConfiguration()
            .clusterNode("redis-node1", 6379)
            .clusterNode("redis-node2", 6379)
            .clusterNode("redis-node3", 6379);

        return new JedisConnectionFactory(clusterConfig);
    }
}
```

### Redis Persistence

```yaml
# Redis configuration for persistence
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec
```

---

## Multi-Level Caching

### L1 + L2 Caching

```java
@Service
public class MultiLevelCacheService {
    private final Cache<String, Object> l1Cache; // In-memory
    private final RedisTemplate<String, Object> l2Cache; // Redis
    private final ProductRepository productRepository;

    public Product getProduct(String productId) {
        // Check L1 cache first
        Product product = (Product) l1Cache.getIfPresent(productId);
        if (product != null) {
            return product;
        }

        // Check L2 cache
        product = (Product) l2Cache.opsForValue().get("product:" + productId);
        if (product != null) {
            // Populate L1 cache
            l1Cache.put(productId, product);
            return product;
        }

        // Load from database
        product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));

        // Populate both caches
        l1Cache.put(productId, product);
        l2Cache.opsForValue().set("product:" + productId, product, Duration.ofHours(1));

        return product;
    }

    public void updateProduct(Product product) {
        // Update database
        productRepository.save(product);

        // Invalidate both caches
        l1Cache.invalidate(product.getId());
        l2Cache.delete("product:" + product.getId());
    }
}
```

### Cache Hierarchies

<CacheHierarchiesDiagram />

### Cache Coherence

```java
@Service
public class CacheCoherenceService {
    private final Cache<String, Object> l1Cache;
    private final RedisTemplate<String, Object> l2Cache;
    private final RedisMessageListenerContainer listenerContainer;

    @PostConstruct
    public void init() {
        // Subscribe to cache invalidation messages
        listenerContainer.addMessageListener(
            (message, pattern) -> {
                String key = new String(message.getBody());
                l1Cache.invalidate(key);
            },
            new ChannelTopic("cache:invalidation")
        );
    }

    public void invalidate(String key) {
        // Invalidate local cache
        l1Cache.invalidate(key);

        // Invalidate distributed cache
        l2Cache.delete(key);

        // Notify other servers
        l2Cache.convertAndSend("cache:invalidation", key);
    }
}
```

---

## Cache Invalidation Strategies

### Time-Based Invalidation

```java
@Service
public class TimeBasedCacheService {
    private final Cache<String, Object> cache;

    public Product getProduct(String productId) {
        Product product = (Product) cache.getIfPresent(productId);

        if (product == null) {
            product = loadFromDatabase(productId);
            cache.put(productId, product);
        }

        return product;
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void refreshCache() {
        // Refresh popular items
        List<String> popularIds = getPopularProductIds();
        for (String id : popularIds) {
            Product product = loadFromDatabase(id);
            cache.put(id, product);
        }
    }
}
```

### Event-Based Invalidation

```java
@Service
public class EventBasedCacheService {
    private final Cache<String, Object> cache;

    @EventListener
    public void handleProductUpdated(ProductUpdatedEvent event) {
        // Invalidate cache when product is updated
        cache.invalidate(event.getProductId());
    }

    @EventListener
    public void handleProductDeleted(ProductDeletedEvent event) {
        // Remove from cache when product is deleted
        cache.invalidate(event.getProductId());
    }
}
```

### Write-Through Invalidation

```java
@Service
public class WriteThroughCacheService {
    private final ProductRepository productRepository;
    private final Cache<String, Object> cache;

    @Transactional
    public Product updateProduct(Product product) {
        // Update database
        Product updated = productRepository.save(product);

        // Update cache
        cache.put(product.getId(), updated);

        return updated;
    }
}
```

### Cache Aside Invalidation

```java
@Service
public class CacheAsideInvalidationService {
    private final ProductRepository productRepository;
    private final Cache<String, Object> cache;

    @Transactional
    public Product updateProduct(Product product) {
        // Update database
        Product updated = productRepository.save(product);

        // Invalidate cache
        cache.invalidate(product.getId());

        return updated;
    }
}
```

---

## Cache Warming Strategies

### Lazy Loading

```java
@Service
public class LazyLoadingCacheService {
    private final Cache<String, Object> cache;
    private final ProductRepository productRepository;

    public Product getProduct(String productId) {
        Product product = (Product) cache.getIfPresent(productId);

        if (product == null) {
            // Load on demand
            product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
            cache.put(productId, product);
        }

        return product;
    }
}
```

### Eager Loading

```java
@Service
public class EagerLoadingCacheService {
    private final Cache<String, Object> cache;
    private final ProductRepository productRepository;

    @PostConstruct
    public void warmCache() {
        // Load all products at startup
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            cache.put(product.getId(), product);
        }
    }
}
```

### Scheduled Refresh

```java
@Service
public class ScheduledRefreshCacheService {
    private final Cache<String, Object> cache;
    private final ProductRepository productRepository;

    @Scheduled(fixedRate = 3600000) // Every hour
    public void refreshCache() {
        // Refresh all cached items
        List<String> cachedIds = getCachedIds();
        for (String id : cachedIds) {
            Product product = productRepository.findById(id).orElse(null);
            if (product != null) {
                cache.put(id, product);
            } else {
                cache.invalidate(id);
            }
        }
    }
}
```

### Predictive Preloading

```java
@Service
public class PredictivePreloadingService {
    private final Cache<String, Object> cache;
    private final ProductRepository productRepository;
    private final AnalyticsService analyticsService;

    @Scheduled(fixedRate = 60000) // Every minute
    public void preloadTrendingItems() {
        // Get trending products
        List<String> trendingIds = analyticsService.getTrendingProducts();

        // Preload into cache
        for (String id : trendingIds) {
            if (!cache.getIfPresent(id)) {
                Product product = productRepository.findById(id).orElse(null);
                if (product != null) {
                    cache.put(id, product);
                }
            }
        }
    }
}
```

---

## Cache Monitoring and Metrics

### Key Metrics

```java
@Component
public class CacheMetrics {
    private final MeterRegistry meterRegistry;
    private final Cache<String, Object> cache;

    public CacheMetrics(MeterRegistry meterRegistry, Cache<String, Object> cache) {
        this.meterRegistry = meterRegistry;
        this.cache = cache;

        // Register metrics
        Gauge.builder("cache.size", cache, Cache::size)
            .tags("cache", "products")
            .register(meterRegistry);

        Counter.builder("cache.hits")
            .tags("cache", "products")
            .register(meterRegistry);

        Counter.builder("cache.misses")
            .tags("cache", "products")
            .register(meterRegistry);
    }

    public void recordHit() {
        meterRegistry.counter("cache.hits", "cache", "products").increment();
    }

    public void recordMiss() {
        meterRegistry.counter("cache.misses", "cache", "products").increment();
    }

    public double getHitRate() {
        long hits = meterRegistry.counter("cache.hits", "cache", "products").count();
        long misses = meterRegistry.counter("cache.misses", "cache", "products").count();
        long total = hits + misses;
        return total > 0 ? (double) hits / total : 0;
    }
}
```

### Cache Performance Analysis

```java
@Service
public class CachePerformanceAnalyzer {
    private final Cache<String, Object> cache;

    public CachePerformanceReport analyze() {
        CacheStats stats = cache.stats();

        return CachePerformanceReport.builder()
            .hitRate(stats.hitRate())
            .hitCount(stats.hitCount())
            .missCount(stats.missCount())
            .loadSuccessCount(stats.loadSuccessCount())
            .loadFailureCount(stats.loadFailureCount())
            .totalLoadTime(stats.totalLoadTime())
            .evictionCount(stats.evictionCount())
            .size(cache.size())
            .build();
    }
}
```

### Alerting

```yaml
# Prometheus alert rules
groups:
  - name: cache_alerts
    rules:
      - alert: LowCacheHitRate
        expr: (sum(rate(cache_gets_total{result="hit"}[5m])) / sum(rate(cache_gets_total[5m]))) < 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Low cache hit rate (< 80%) for {{ $labels.cache }}

      - alert: HighCacheMissRate
        expr: rate(cache_gets_total{result="miss"}[5m]) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High cache miss rate for {{ $labels.cache }}

      - alert: HighCacheEvictionRate
        expr: rate(cache_evictions_total[5m]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High cache eviction rate for {{ $labels.cache }}
```

---

### Observability Pitfalls: Measuring Cache Health Accurately

#### Trap 1: Request Hit Ratio vs. Key Hit Ratio (The P99 Latency Deception)
Suppose you allocate $250\text{MB}$ RAM for a catalog with 200,000 active products.
- **Request Hit Ratio**: **$89.2\%$** (looks great on high-level executive dashboards!).
- **Key Hit Ratio**: $250\text{MB}$ only holds 50,000 items $\rightarrow$ **only $25\%$ of unique product keys are cached**.

```
Request Stream:
┌───────────────────────────────────────────────────────────┐
│ 89.2% of Requests (Hot 25% Keys) ──► Hit Cache (6ms)      │
│ 10.8% of Requests (Cold 75% Keys) ──► Miss Cache (57ms!)  │
└───────────────────────────────────────────────────────────┘
Average Latency: ~11.5ms  (Looks acceptable)
P90 Latency:     ~6ms     (Looks fast)
P99 / P99.9 Latency: 57ms (Catastrophic tail latency degradation!)
```
**Consequence**: The $75\%$ of less popular, long-tail products continuously miss the cache. Users browsing niche or long-tail items consistently suffer $57\text{ms}$ latency ($+2\text{ms}$ RTT overhead on top of the DB query), causing severe **P99 tail latency degradation**. Always monitor P95, P99, and P99.9 latencies alongside average hit ratio.

---

#### Trap 2: The Redis `INFO stats` Cumulative Counter Trap
Many operations teams monitor cache health by querying `keyspace_hits` and `keyspace_misses` from Redis `INFO stats`:

```bash
# Redis CLI
127.0.0.1:6379> INFO stats
keyspace_hits:84920194
keyspace_misses:4102910
# Calculated Hit Ratio = 84920194 / (84920194 + 4102910) = 95.3%
```

**Why this is dangerously misleading:**
1. **Cumulative Lifetime Bias**: `INFO stats` counters accumulate continuously from the moment the Redis process started (weeks or months). A 95.3% multi-week average completely **masks a catastrophic localized hit ratio collapse (e.g. down to 20%)** during a high-traffic flash sale.
2. **Cross-Domain Cache Obfuscation**: `INFO stats` aggregates all keys across the entire Redis instance. If you have 10 distinct application caches in the same Redis cluster, a hot, high-volume cache (e.g. session tokens with 99% hit rate) will completely hide a broken or misconfigured secondary cache (e.g. product catalog with 0% hit rate).

#### The Production Solution: Application-Level Tagged Metrics via Micrometer
Always measure cache telemetry at the **application layer** per cache region, evaluated over a sliding time window (e.g. `rate(...[1m])` or `rate(...[5m])`):

```java
// Spring Boot with Micrometer & Redis / Caffeine
@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id")
    public ProductDto getProduct(String id) {
        // Micrometer automatically records cache.gets with tags:
        // name="products", result="hit" | "miss"
        return productRepository.findById(id).map(this::toDto).orElse(null);
    }
}
```

```promql
# Prometheus Query for Real-Time 5-minute Sliding Window Hit Rate per Cache:
sum(rate(cache_gets_total{name="products", result="hit"}[5m]))
/
sum(rate(cache_gets_total{name="products"}[5m]))
```

---

## Real-World Implementations

### Redis

Redis is an in-memory data structure store used as a cache, message broker, and database.

**Features:**
- In-memory storage for fast access
- Rich data structures (strings, hashes, lists, sets, sorted sets)
- Persistence options (RDB, AOF)
- Replication and clustering
- Pub/sub messaging

**Use Cases:**
- Caching
- Session storage
- Real-time analytics
- Leaderboards
- Rate limiting

### Memcached

Memcached is a high-performance, distributed memory object caching system.

**Features:**
- Simple key-value store
- Distributed caching
- LRU eviction
- Multi-threaded

**Use Cases:**
- Caching database query results
- Caching API responses
- Session storage

### Varnish

Varnish is a HTTP accelerator and reverse proxy cache.

**Features:**
- HTTP caching
- Edge side includes
- VCL configuration language
- Health checking

**Use Cases:**
- Web page caching
- API response caching
- Load balancing

### CDN Providers

**CloudFront (AWS):**
- Global edge network
- Dynamic content caching
- Lambda@Edge for edge computing

**Cloudflare:**
- DDoS protection
- Web application firewall
- Edge computing

**Fastly:**
- Real-time logging
- Edge computing
- Instant purging

### Application-Level Caching

**Caffeine (Java):**
- High-performance in-memory cache
- Automatic loading
- Size-based eviction
- Time-based eviction

**Guava Cache (Java):**
- In-memory caching
- Automatic loading
- Eviction policies
- Statistics collection

---

## Integration Patterns

### Spring Cache

Spring's `@Cacheable` / `@CachePut` / `@CacheEvict` annotations let you add caching without changing method logic.

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(10_000));
        return cacheManager;
    }
}

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Cache on first call; skip method on subsequent calls with same key
    @Cacheable(value = "products", key = "#id")
    public Product getProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }

    // Always execute method AND update cache (use on update operations)
    @CachePut(value = "products", key = "#product.id")
    public Product updateProduct(Product product) {
        return productRepository.save(product);
    }

    // Remove cache entry
    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    // Evict all entries in the "products" cache
    @CacheEvict(value = "products", allEntries = true)
    public void bulkUpdate(List<Product> products) {
        productRepository.saveAll(products);
    }

    // Combine multiple cache operations
    @Caching(
        evict = { @CacheEvict("products"), @CacheEvict("productSummaries") }
    )
    public void deleteWithRelated(Long id) {
        productRepository.deleteById(id);
    }
}
```

```properties
# application.properties
spring.cache.type=redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.cache.redis.time-to-live=300000   # 5 min in ms
spring.cache.redis.cache-null-values=true # cache null results (prevents penetration)
```

:::warning[Self-invocation trap: @Cacheable does NOT work within the same bean]
Spring's cache proxy is applied at the bean boundary. If `methodA()` in `ProductService` calls `methodB()` in the **same** bean, `@Cacheable` on `methodB` is not triggered because the call bypasses the Spring proxy. To work around this, inject the service into itself via the Spring proxy (e.g., `@Autowired private ProductService self`) and call it via `self.methodB()`.
:::

### Caffeine Cache

```java
public class CaffeineCacheExample {
    private final Cache<String, Product> cache = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .refreshAfterWrite(5, TimeUnit.MINUTES)
        .recordStats()
        .build();

    public Product getProduct(String productId) {
        return cache.get(productId, id -> loadFromDatabase(id));
    }

    private Product loadFromDatabase(String productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
    }

    public CacheStats getStats() {
        return cache.stats();
    }
}
```

### Hazelcast

```java
@Configuration
public class HazelcastConfig {

    @Bean
    public Config hazelcastConfig() {
        return new Config()
            .setInstanceName("hazelcast-instance")
            .addMapConfig(
                new MapConfig()
                    .setName("products")
                    .setTimeToLiveSeconds(600)
                    .setMaxSizeConfig(new MaxSizeConfig(10000, MaxSizeConfig.MaxSizePolicy.PER_NODE))
                    .setEvictionConfig(new EvictionConfig()
                        .setSize(10000)
                        .setEvictionPolicy(EvictionPolicy.LRU))
            );
    }

    @Bean
    public HazelcastInstance hazelcastInstance(Config config) {
        return Hazelcast.newHazelcastInstance(config);
    }
}

@Service
public class HazelcastCacheService {
    private final HazelcastInstance hazelcastInstance;

    public Product getProduct(String productId) {
        IMap<String, Product> productsMap = hazelcastInstance.getMap("products");
        return productsMap.get(productId);
    }

    public void putProduct(Product product) {
        IMap<String, Product> productsMap = hazelcastInstance.getMap("products");
        productsMap.put(product.getId(), product);
    }
}
```

### Ehcache

```java
@Configuration
@EnableCaching
public class EhcacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CachingProvider provider = Caching.getCachingProvider();
        CacheManager cacheManager = provider.getCacheManager();

        MutableConfiguration<String, Product> config = new MutableConfiguration<>()
            .setExpiryPolicyFactory(CreatedExpiryPolicy.factoryOf(new Duration(Duration.MINUTES, 10)))
            .setStoreByValue(false)
            .setStatisticsEnabled(true);

        cacheManager.createCache("products", config);
        return new JCacheCacheManager(cacheManager);
    }
}
```

---

## Pros and Cons

### Cache-Aside

**Pros:**
- Simple to implement
- Only caches data that's actually used
- Flexible cache management
- Works with any cache backend

**Cons:**
- Cache misses are expensive
- Risk of stale data
- Requires manual cache management
- Potential for cache stampede

### Write-Through

**Pros:**
- Data always consistent between cache and database
- No stale reads
- Simple to understand

**Cons:**
- Slower write operations
- Risk of polluting cache with unused data
- Dual-write problem
- Higher latency

### Write-Behind

**Pros:**
- High write throughput
- Low write latency
- Can batch writes

**Cons:**
- Risk of data loss
- Complex to implement
- Eventual consistency
- Harder to debug

### Read-Through

**Pros:**
- Simpler application code
- Cache handles loading
- Consistent cache population

**Cons:**
- Less control over cache behavior
- Cache becomes more complex
- Potential for cache stampede
- Harder to implement custom logic

---

## Interview Questions

### Q: What is the difference between cache-aside and read-through caching?

**A:** In cache-aside, the application manages the cache directly - checking cache, loading from database on miss, and populating cache. In read-through, the cache itself handles loading data from the database when there's a miss, making the application code simpler but the cache more complex.

### Q: How do you handle cache invalidation in a distributed system?

**A:** Use event-driven invalidation with pub/sub messaging, implement cache versioning, use TTL-based expiration, and consider write-through invalidation. For critical data, use cache invalidation messages broadcast to all cache nodes.

### Q: What is a cache stampede and how do you prevent it?

**A:** A cache stampede occurs when multiple concurrent requests miss the cache and all try to load the same data from the database simultaneously. Prevent it with request coalescing (single flight), proactive cache warming, or using a lock to ensure only one request loads the data.

### Q: How do you choose between LRU and LFU eviction policies?

**A:** Use LRU for general-purpose caching where recency matters more than frequency. Use LFU for workloads with highly skewed access patterns where popular items should stay in cache regardless of when they were last accessed.

### Q: What is the difference between write-through and write-behind caching?

**A:** Write-through synchronously writes to both cache and database before acknowledging the write, ensuring consistency but adding latency. Write-behind asynchronously writes to the database after acknowledging the write, providing high throughput but risking data loss.

### Q: How do you handle hotkeys in a distributed cache?

**A:** Replicate hotkeys across all cache nodes, use local fallback caches for hot items, implement request coalescing, and consider sharding strategies that distribute load more evenly.

### Q: What is cache penetration and how do you prevent it?

**A:** Cache penetration occurs when repeated requests for non-existent data bypass the cache and hit the database. Prevent it by caching null values with short TTL, using Bloom filters to quickly reject non-existent keys, and implementing rate limiting.

### Q: How do you implement multi-level caching?

**A:** Use L1 in-memory cache for ultra-fast access, L2 distributed cache for shared access, and database as the source of truth. Implement cache coherence with invalidation messages and consider read-through patterns for automatic population.

### Q: What is the difference between Redis and Memcached?

**A:** Redis supports rich data structures, persistence, replication, and pub/sub, while Memcached is a simpler key-value store focused on caching. Redis is more feature-rich but slightly slower, while Memcached is simpler and faster for basic caching.

### Q: How do you monitor cache performance?

**A:** Track metrics like hit rate, miss rate, eviction rate, load time, and cache size. Use these metrics to identify performance issues, optimize cache configuration, and set up alerts for abnormal behavior.

### Q: What is cache coherence and why is it important?

**A:** Cache coherence ensures that all cache nodes have consistent data. It's important in distributed systems to prevent stale reads and ensure data consistency across multiple cache instances.

### Q: How do you handle cache warming in production?

**A:** Use eager loading at startup, scheduled refresh for popular items, predictive preloading based on access patterns, and lazy loading for less frequently accessed data.

### Q: What is the dual-write problem in caching?

**A:** The dual-write problem occurs when writing to both cache and database without atomicity, potentially leading to inconsistent state if one write succeeds and the other fails.

### Q: How do you choose TTL values for cached data?

**A:** Consider data freshness requirements, access patterns, and system load. Use shorter TTLs for frequently changing data and longer TTLs for relatively static data. Add random jitter to prevent cache avalanche.

### Q: What is the difference between client-side and server-side caching?

**A:** Client-side caching stores data on the client device (browser, mobile app) for fastest access but with limited control. Server-side caching stores data on the server for better control and consistency but with higher latency.

### Q: How do you implement cache invalidation with events?

**A:** Use domain events to trigger cache invalidation, publish events to a message broker, and have cache nodes subscribe to invalidation events. This ensures consistent cache updates across distributed systems.

### Q: What is cache sharding and when would you use it?

**A:** Cache sharding distributes cache data across multiple nodes based on a hash function. Use it when a single cache node can't handle the load or when you need to scale cache capacity horizontally.

### Q: How do you handle cache consistency in a microservices architecture?

**A:** Use event-driven architecture for cache invalidation, implement versioned cache keys, use TTL-based expiration, and consider eventual consistency for non-critical data.

### Q: What is the difference between CDN caching and application caching?

**A:** CDN caching stores content at edge locations close to users for low latency, while application caching stores data closer to the application for faster access. CDN is best for static content, while application caching is better for dynamic data.

### Q: How do you mathematically determine whether adding a cache will improve API latency using AMAT?

**A:** Use the Average Memory Access Time formula: $\text{AMAT} = \text{Time}_{\text{Hit}} + (\text{Miss Rate} \times \text{Miss Penalty})$. Because every cache miss incurs an extra network round-trip overhead (typically $+2\text{ms}$ in Cache-Aside for read check + sync write) compared to running directly against the DB, caching only reduces average latency if $\text{AMAT} \le T_{\text{No-Cache}}$. This derives the **Break-Even Hit Ratio** formula: $H_{\text{break-even}} = \frac{2}{T_{\text{db}} + 1}$.

### Q: Why can adding a cache to an ultra-fast query (1–2ms) degrade overall system performance?

**A:** If an indexed database query already executes in $2\text{ms}$, the break-even hit ratio is $H \ge \frac{2}{2+1} = 66.7\%$. If the hit ratio is below $66.7\%$ (e.g. $50\%$), the $+2\text{ms}$ network RTT penalty on every miss outweighs the minor $1\text{ms}$ saved on hits, making the average API latency **slower** than querying the database directly while wasting expensive RAM. Caching should only be applied to expensive queries or to protect DB capacity under massive QPS.

### Q: How does Zipf's Law impact cache RAM sizing and capacity planning?

**A:** Internet traffic follows a power-law Zipf distribution ($\alpha \approx 1$), where the vast majority of requests hit a small fraction of items (the **Working Set**). Sizing RAM to hold the active Working Set (e.g. 200,000 hot items / 1GB in a 10GB catalog) yields near 100% theoretical hit ratio. Scaling RAM beyond the working set (e.g. 2GB or 10GB) hits an "efficiency wall" with **zero marginal return** because the long tail of items receives virtually no repeat traffic before eviction/TTL expiration.

### Q: Why can an application with an 89% cache hit ratio still suffer from poor P99 tail latency?

**A:** Because of the discrepancy between **Request Hit Ratio** and **Key Hit Ratio**. An 89% request hit ratio might only cover 25% of unique product keys. The remaining 75% of long-tail product keys continuously experience cache misses, incurring full database execution plus network cache-write penalties ($57\text{ms}$ vs $6\text{ms}$). While average and P50/P90 latencies look fast, the $11\%$ of users requesting long-tail items suffer degraded **P99 and P99.9 tail latencies**.

### Q: Why are Redis `INFO stats` counters dangerous for measuring cache hit rates in production?

**A:** `INFO stats` counters (`keyspace_hits`, `keyspace_misses`) are cumulative across the lifetime of the Redis instance and aggregate all cache keys globally. Multi-week cumulative counters completely hide transient hit ratio collapses during peak traffic hours, and high-traffic hot caches (like session tokens) mask failing secondary caches. Production telemetry must measure application-level metrics (e.g. Spring Boot Micrometer `cache.gets` tagged by cache name and result) over short sliding windows (1m/5m rate).

### Q: What is the difference between Cache Dataset and Working Set, and how does that dictate eviction behavior?

**A:** The **Dataset** is the total volume of data in the persistent database (e.g. 500GB, growing over time with writes). The **Working Set** is the active subset queried by concurrent users within a given window (e.g. 8GB at peak hours). When $\text{Cache Size} > \text{Working Set}$, evictions rarely occur and policy choices have negligible impact. When $\text{Cache Size} < \text{Working Set}$, evictions occur continuously, and algorithm choice directly determines hit ratio and database protection.

### Q: What are the Two Memory Gates (Admission vs. Eviction) and how does Scan Resistance prevent Cache Pollution?

**A:** Caching architectures govern memory via two gates: **Admission Policy (Entrance Gate)** decides if a new key qualifies to enter RAM; **Eviction Policy (Exit Gate)** decides which victim to drop when memory is full. Without an admission policy (e.g. standard Redis), a midnight full table scan / batch job reads millions of "one-hit wonders", flooding LRU cache and evicting the genuine hot working set (**Cache Pollution**). **Scan Resistance** (achieved via N-Hit admission, SLRU probation segments, or TinyLFU admission duels) blocks transient scan keys from polluting the main cache.

### Q: How does W-TinyLFU (Caffeine Cache) combine Admission and Eviction to outperform classical LRU/LFU?

**A:** W-TinyLFU divides cache into a small **Window LRU (1%)** and a **Main SLRU Cache (99%)**. New keys enter the Window LRU unconditionally to prove their utility. When evicted from the Window, the candidate enters an **Admission Duel** against the weakest victim in the Main Cache using a 4-bit Count-Min Sketch frequency estimator. If the candidate has higher frequency, it enters the Main Cache; otherwise, it is discarded. Furthermore, an adaptive **Hill Climbing** algorithm continuously tunes the Window size in real-time based on observed hit ratio.

---

## Senior Deep Dive: Advanced Topics

### Cache Partitioning

```java
public class PartitionedCache<K, V> {
    private final List<Cache<K, V>> partitions;
    private final int numPartitions;

    public PartitionedCache(int numPartitions, Function<Integer, Cache<K, V>> cacheFactory) {
        this.numPartitions = numPartitions;
        this.partitions = new ArrayList<>();

        for (int i = 0; i < numPartitions; i++) {
            partitions.add(cacheFactory.apply(i));
        }
    }

    private int getPartition(K key) {
        return Math.abs(key.hashCode()) % numPartitions;
    }

    public V get(K key) {
        int partition = getPartition(key);
        return partitions.get(partition).getIfPresent(key);
    }

    public void put(K key, V value) {
        int partition = getPartition(key);
        partitions.get(partition).put(key, value);
    }

    public void invalidate(K key) {
        int partition = getPartition(key);
        partitions.get(partition).invalidate(key);
    }
}
```

### Cache Sharding

```java
public class ShardedCache<K, V> {
    private final Map<String, Cache<K, V>> shards;
    private final HashFunction hashFunction;

    public ShardedCache(List<String> shardIds, HashFunction hashFunction) {
        this.shards = new ConcurrentHashMap<>();
        this.hashFunction = hashFunction;

        for (String shardId : shardIds) {
            shards.put(shardId, createCache(shardId));
        }
    }

    private String getShard(K key) {
        int hash = hashFunction.hash(key);
        List<String> shardIds = new ArrayList<>(shards.keySet());
        return shardIds.get(Math.abs(hash) % shardIds.size());
    }

    public V get(K key) {
        String shardId = getShard(key);
        return shards.get(shardId).getIfPresent(key);
    }

    public void put(K key, V value) {
        String shardId = getShard(key);
        shards.get(shardId).put(key, value);
    }
}
```

### Distributed Caching

```java
@Service
public class DistributedCacheService {
    private final List<RedisTemplate<String, Object>> redisNodes;
    private final ConsistentHash<String> consistentHash;

    public Object get(String key) {
        String nodeId = consistentHash.getNode(key);
        return redisNodes.stream()
            .filter(node -> getNodeId(node).equals(nodeId))
            .findFirst()
            .map(node -> node.opsForValue().get(key))
            .orElse(null);
    }

    public void put(String key, Object value, Duration ttl) {
        String nodeId = consistentHash.getNode(key);
        redisNodes.stream()
            .filter(node -> getNodeId(node).equals(nodeId))
            .findFirst()
            .ifPresent(node -> node.opsForValue().set(key, value, ttl));
    }

    private String getNodeId(RedisTemplate<String, Object> node) {
        // Extract node ID from Redis template
        return "node-" + node.hashCode();
    }
}
```

### Cache Consistency Models

```java
public enum CacheConsistency {
    STRONG,      // All reads return latest write
    EVENTUAL,    // Reads may return stale data
    READ_YOUR_WRITES, // Always see your own writes
    MONOTONIC_READS,  // Never see older data
    CAUSAL       // Causally related operations seen in order
}

@Service
public class ConsistentCacheService {
    private final Cache<String, Object> cache;
    private final CacheConsistency consistency;

    public Object get(String key, String clientId) {
        switch (consistency) {
            case STRONG:
                return getStrongConsistent(key);
            case READ_YOUR_WRITES:
                return getReadYourWrites(key, clientId);
            case MONOTONIC_READS:
                return getMonotonicReads(key, clientId);
            default:
                return cache.getIfPresent(key);
        }
    }

    private Object getStrongConsistent(String key) {
        // Always check source of truth
        return loadFromSource(key);
    }

    private Object getReadYourWrites(String key, String clientId) {
        // Check if client has recent write
        if (hasRecentWrite(key, clientId)) {
            return cache.getIfPresent(key);
        }
        return loadFromSource(key);
    }

    private Object getMonotonicReads(String key, String clientId) {
        // Ensure client never sees older data
        Long lastVersion = getLastSeenVersion(key, clientId);
        Object current = cache.getIfPresent(key);

        if (current != null && getVersion(current) >= lastVersion) {
            return current;
        }
        return loadFromSource(key);
    }
}
```

### Cache Security

```java
@Service
public class SecureCacheService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final EncryptionService encryptionService;

    public void put(String key, Object value, Duration ttl) {
        // Encrypt sensitive data
        if (isSensitive(value)) {
            value = encryptionService.encrypt(value);
        }

        // Add authentication tag
        String authKey = key + ":auth";
        String authToken = generateAuthToken(key);

        redisTemplate.opsForValue().set(key, value, ttl);
        redisTemplate.opsForValue().set(authKey, authToken, ttl);
    }

    public Object get(String key) {
        // Verify authentication
        String authKey = key + ":auth";
        String expectedToken = generateAuthToken(key);
        String actualToken = (String) redisTemplate.opsForValue().get(authKey);

        if (!expectedToken.equals(actualToken)) {
            throw new SecurityException("Cache authentication failed");
        }

        Object value = redisTemplate.opsForValue().get(key);

        // Decrypt if necessary
        if (value != null && isEncrypted(value)) {
            value = encryptionService.decrypt(value);
        }

        return value;
    }
}
```

### Cache Performance Optimization

```java
@Service
public class OptimizedCacheService {
    private final Cache<String, Object> cache;
    private final MeterRegistry meterRegistry;

    @Cacheable(value = "products", key = "#productId")
    public Product getProduct(String productId) {
        Timer.Sample sample = Timer.start(meterRegistry);

        try {
            Product product = loadFromDatabase(productId);

            // Record metrics
            sample.stop(Timer.builder("cache.load.time")
                .tag("cache", "products")
                .register(meterRegistry));

            return product;
        } catch (Exception e) {
            // Record failure
            meterRegistry.counter("cache.load.failures",
                "cache", "products").increment();
            throw e;
        }
    }

    @CacheEvict(value = "products", key = "#product.id")
    public void updateProduct(Product product) {
        // Update database
        productRepository.save(product);

        // Record update
        meterRegistry.counter("cache.updates",
            "cache", "products").increment();
    }

    @Scheduled(fixedRate = 60000)
    public void optimizeCache() {
        CacheStats stats = cache.stats();

        // Adjust cache size based on hit rate
        if (stats.hitRate() < 0.8) {
            increaseCacheSize();
        } else if (stats.hitRate() > 0.95) {
            decreaseCacheSize();
        }

        // Record optimization
        meterRegistry.gauge("cache.size", cache, Cache::size);
    }
}
```

---

## Additional Resources

### Books
- "High Performance Browser Networking" by Ilya Grigorik
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Redis in Action" by Josiah L. Carlson

### Papers
- "Caching in the World Wide Web" by Ari Luotonen
- "Web Caching and Cache Consistency" by Duane Wessels

### Tools
- **Redis**: In-memory data structure store
- **Memcached**: Distributed memory object caching
- **Varnish**: HTTP accelerator
- **Caffeine**: High-performance Java caching library
- **Hazelcast**: Distributed in-memory data grid

### Standards
- **HTTP Caching**: RFC 7234
- **CDN Interconnect**: RFC 7686

---

## Best Practices

### Cache Design
1. Choose appropriate cache architecture for your use case
2. Define clear cache keys and TTL values
3. Implement proper eviction policies
4. Monitor cache performance metrics
5. Plan for cache invalidation

### Cache Implementation
1. Use cache-aside as default pattern
2. Implement request coalescing for hot keys
3. Add random jitter to TTL values
4. Use multi-level caching for performance
5. Implement cache warming strategies

### Cache Operations
1. Always handle cache misses gracefully
2. Implement proper error handling
3. Use atomic operations for consistency
4. Implement cache coherence in distributed systems
5. Plan for cache failures

### Cache Monitoring
1. Track hit rate and miss rate
2. Monitor eviction rates
3. Measure load times
4. Set up alerts for abnormal behavior
5. Analyze access patterns

### Cache Security
1. Encrypt sensitive cached data
2. Implement authentication
3. Use secure connections
4. Validate cache keys
5. Implement rate limiting

### Cache Testing
1. Test cache hit and miss scenarios
2. Test cache invalidation
3. Test cache expiration
4. Test concurrent access
5. Test cache failure scenarios

### Cache Optimization
1. Optimize cache size based on workload
2. Tune eviction policies
3. Implement cache warming
4. Use efficient data structures
5. Minimize cache overhead

## See Also
* **[Scaling Reads](./scaling-reads.md)**: Explore how caching strategies fit into a broader high-scale read architecture.

