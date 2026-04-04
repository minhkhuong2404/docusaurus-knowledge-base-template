---
id: caching-strategies
title: Caching Strategies
sidebar_label: Caching Strategies
description: In-depth guide to caching strategies including cache-aside, write-through, write-behind, eviction policies, cache stampede prevention, hotkeys, Redis data structures, and multi-level caching.
tags: [caching, redis, caffeine, eviction, ttl, cache-invalidation, performance, system-design]
---

# Caching Strategies

> A cache is a **fast, temporary data store** closer to the application than the source of truth. It trades a bit of storage capacity and system complexity for raw speed. 

To understand why this matters, consider the hardware limits: accessing data from a database on disk (like an SSD) takes about 1 millisecond. Accessing data from memory (RAM) takes about 100 nanoseconds. That makes caching roughly **10,000 times faster** than querying a database.

---

## Cache Locations & Levels

When designing a system, caching can be introduced at multiple layers. You should default to external caching in interviews, but understanding the others is critical for specialized use cases.

### 1. Client-Side Caching
Data is stored directly on the user's device (browser HTTP cache, local storage, or native mobile app memory).
* **Pros:** The fastest possible option; the request never leaves the device. Great for offline functionality (e.g., an app like Strava caching run data locally while offline and syncing when reconnected).
* **Cons:** You have the least amount of control over this data. Validation, freshness, and cache invalidation are notoriously difficult.

### 2. CDN (Content Delivery Network)
A geographically distributed network of servers that caches content closer to users, optimizing for network latency rather than disk vs. memory speeds.
* **Example:** If your origin server (like AWS S3) is in Virginia and your user is in Australia, a round trip might take 300–350ms. With a CDN, an edge server a few miles away from the user can serve the asset in 20–40ms.
* **Use Cases:** While famous for static media (images, videos), modern CDNs can also cache public API responses, HTML pages, and even run lightweight edge logic for personalization.

### 3. In-Process Caching (L1)
The cache lives directly inside the memory space of your application server (e.g., a local hash map or JVM heap). 
* **Pros:** Ultra-low latency since there is no network hop required to reach an external cache.
* **Cons:** Memory is not shared across application servers. If Server A caches a value, Server B won't see it, leading to potential inconsistencies and duplicated memory usage. 
* **Best For:** Small lookup tables, static configuration data, or ultra-low latency requirements where a network hop is unacceptable.

### 4. External Caching (L2)
A dedicated caching service (like Redis or Memcached) running on its own server.
* **Pros:** Provides a single, global view of the cache. Once one application server fetches and caches the data, all other application servers instantly benefit from it.
* **Cons:** Introduces a network hop between the application and the cache, making it slightly slower than in-process caching.

---

## Caching Patterns (Architectures)

Cache architectures define the specific order in which reads and writes happen between your application, the cache, and the database.

### Cache-Aside (Lazy Population)
The application controls the cache. **This is the pattern you should default to in system design interviews.**
1. The application checks the cache.
2. If it's a *hit*, data is returned immediately.
3. If it's a *miss*, the application queries the database, writes the result to the cache, and returns the data.

* **Pros:** Keeps the cache lean. You only cache data that users actually request. If a piece of data is never requested, it never takes up precious cache memory.
* **Cons:** A cache miss is expensive. It adds latency because the application must wait for three steps: fail the cache check, hit the database, and write to the cache.

### Write-Through
The application writes directly to the cache, and the cache synchronously writes the data to the database before acknowledging the write to the user.
* **Implementation:** Redis and Memcached do not natively support this out of the box. You generally need specialized caching libraries (like Spring Cache or Hazelcast) to handle the proxying, or you must handle dual-writing in your application code.
* **Pros:** Ensures reads always return completely fresh data.
* **Cons:** Slower write operations. You also risk polluting your cache with data that might never be read again. Furthermore, you face the **Dual-Write Problem**: if the cache write succeeds but the database write fails, your system enters an inconsistent state.

### Write-Behind (Write-Back)
Similar to Write-Through, but the cache flushes the data to the database *asynchronously* in the background (usually in batches).
* **Pros:** Massive write throughput since the application gets an immediate response as soon as data hits the memory layer.
* **Cons:** Data loss. If the cache instance crashes before the background flush completes, the data is gone permanently. 
* **Best For:** Analytics or metric pipelines where occasional, minor data loss is acceptable in exchange for high write speeds.

### Read-Through
Similar to Cache-Aside, but instead of the application orchestrating the cache miss, the cache itself acts as a proxy. If a user asks the cache for data it doesn't have, the cache service fetches it from the database, stores it, and returns it. This is exactly how CDNs operate.

---

## Eviction Policies

Because memory is vastly more expensive and limited than disk storage, you cannot fit your entire dataset into a cache. Eviction policies define what gets removed when the cache fills up. 

| Policy                          | Description & Use Case                                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LRU** (Least Recently Used)   | Evicts items that haven't been accessed recently. Often implemented under the hood with a linked list or priority queue. This is the standard default for most general-purpose caching.                                                 |
| **LFU** (Least Frequently Used) | Evicts items based on total access count. Best for highly skewed access patterns (e.g., a Pareto distribution). Even if an item was accessed 1 second ago, if its overall frequency is low, it gets dropped.                            |
| **FIFO** (First In, First Out)  | The oldest item gets removed to make space for the newest, regardless of access patterns. Rarely the right choice in a production environment.                                                                                          |
| **TTL** (Time to Live)          | Every cached item is given an explicit expiration clock (e.g., 5 minutes). Once time passes, it is automatically purged. Perfect for data where freshness strictly overrides frequency or recency (e.g., user sessions, API responses). |

---

## The "Hard" Problems in Caching

Adding a cache doesn't just speed things up; it introduces complex distributed systems challenges that interviewers love to probe into.

### 1. Cache Stampede (Thundering Herd)
A stampede happens when a highly popular cache entry expires (via its TTL), causing a sudden flood of concurrent requests to experience a cache miss all at the exact same time. 
* **Example:** Imagine you cache the homepage feed of a site with a 60-second TTL. You get 100,000 requests per second. For 60 seconds, the cache absorbs the load. At exactly 61 seconds, the key expires. In that single moment, 100,000 requests miss the cache and simultaneously slam your database, likely taking it offline via cascading failure.

**Solutions:**
* **Request Coalescing (Single Flight):** When multiple requests try to rebuild the same missing cache key, the system allows only the *first* request to query the database. The other 99,999 requests are forced to wait for that first query to finish and populate the cache before they proceed.
* **Proactive Cache Warming:** Instead of waiting for the full 60 seconds to pass, a background process refreshes the key at the 55-second mark. The cache never technically expires, preventing the herd entirely.

### 2. Cache Consistency (Stale Data)
Because most architectures read from the cache but write to the database, you create a window where the two data sources return completely different values.
* **Example:** On a social network, a user updates their profile picture from "Image 1" to "Image 2". The database updates instantly to Image 2, but the cache still holds Image 1. For the duration of the cache TTL, all other users will see the stale profile picture.

**Solutions:**
* **Invalidate on Write:** When the database update completes, the application proactively issues a `DELETE` command to the cache key. The next read request will be forced to fetch the fresh Image 2 from the DB.
* **Short TTLs / Eventual Consistency:** Accept the staleness. If a 5-minute delay on a profile picture update is not business-critical, a simple 5-minute TTL allows the system to resolve the inconsistency naturally without complex invalidation logic.

### 3. Hotkeys
A hotkey is a single cache entry that becomes overwhelmingly popular. Even if your overall cache cluster is scaled well, a hotkey creates an uneven load that can overwhelm a specific shard.
* **Example:** You are building X (Twitter). Your system handles standard user profiles perfectly. Suddenly, millions of users try to view Taylor Swift's profile at the exact same moment. That single user's cache key receives millions of requests, overloading the single Redis node responsible for that partition.

**Solutions:**
* **Replication:** Take the highly popular key (Taylor Swift) and replicate it across every cache node in your cluster. The application can then balance read requests evenly across all cache instances.
* **Local Fallback Cache:** Add an L1 in-process cache to your application servers strictly for ultra-hot items. The application server will serve Taylor Swift's profile straight from its own RAM, completely absorbing the traffic spike before it ever touches your external Redis cluster.

---

## How to Handle Caching in a System Design Interview

Do not blindly drop a cache into your diagram. Interviewers view "adding a cache just to add a cache" without proper justification as a red flag. Follow this framework, typically introduced during the "Deep Dive" or "Scaling" portion of the interview:

1. **Identify and Quantify the Bottleneck:** * *Read-heavy workloads:* "We have 100 million daily active users making 20 requests a day. That's 2 billion reads hitting the database. We need a cache to take that load off the primary DB."
   * *Expensive Queries:* "Generating a user's newsfeed requires joining posts, followers, and likes across multiple tables. That computation is too expensive to do on the fly, so we will cache the compiled feed."
   * *Latency Constraints:* "The NFRs state we need a 100ms response time. The database query alone takes too long, so we must cache the API response."
2. **Define the Scope (What to Cache):** Be incredibly explicit. "I will cache the user's compiled newsfeed using the `user_id` as the cache key."
3. **Choose the Architecture:** Explicitly state: "I will use Cache-Aside. On a read request, we check Redis..."
4. **Define the Eviction Policy:** "We will use LRU eviction, alongside a 60-second TTL to ensure the newsfeed data doesn't grow incredibly stale."
5. **Preemptively Address Downsides:** Impress the interviewer by bringing up edge cases before they ask. "Because this newsfeed key is highly requested and expires every 60 seconds, I am worried about a cache stampede. To prevent taking down the database, we will implement request coalescing."
6. **Bonus - Handle Hotkeys:** "If a celebrity user with millions of followers logs in, their newsfeed becomes a hotkey. To prevent overwhelming the single Redis node that holds that key, we will replicate it across all cache nodes and add an L1 fallback cache for the top 100 hottest users."
