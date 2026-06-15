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

## Table of Contents

- [Cache Locations & Levels](#cache-locations--levels)
  - [Client-Side Caching](#client-side-caching)
  - [CDN (Content Delivery Network)](#cdn-content-delivery-network)
  - [In-Process Caching (L1)](#in-process-caching-l1)
  - [External Caching (L2)](#external-caching-l2)
- [Caching Patterns (Architectures)](#caching-patterns-architectures)
  - [Cache-Aside (Lazy Population)](#cache-aside-lazy-population)
  - [Write-Through](#write-through)
  - [Write-Behind (Write-Back)](#write-behind-write-back)
  - [Read-Through](#read-through)
- [Eviction Policies](#eviction-policies)
  - [LRU (Least Recently Used)](#lru-least-recently-used)
  - [LFU (Least Frequently Used)](#lfu-least-frequently-used)
  - [FIFO (First In, First Out)](#eviction-policies)
  - [TTL (Time to Live)](#ttl-time-to-live)
  - [Random Eviction](#eviction-policies)
  - [ARC (Adaptive Replacement Cache)](#eviction-policies)
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

Cache architectures define the specific order in which reads and writes happen between your application, the cache, and the database.

### Cache-Aside (Lazy Population)

The application controls the cache. **This is the pattern you should default to in system design interviews.**

1. The application checks the cache.
2. If it's a *hit*, data is returned immediately.
3. If it's a *miss*, the application queries the database, writes the result to the cache, and returns the data.

* **Pros:** Keeps the cache lean. You only cache data that users actually request. If a piece of data is never requested, it never takes up precious cache memory.
* **Cons:** A cache miss is expensive. It adds latency because the application must wait for three steps: fail the cache check, hit the database, and write to the cache.

**Implementation:**

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

            // Populate cache
            cache.put(productId, product);
        }

        return product;
    }

    public void updateProduct(Product product) {
        productRepository.save(product);

        // Invalidate cache
        Cache cache = cacheManager.getCache("products");
        cache.evict(product.getId());
    }
}

// Spring Cache annotation approach
@Service
public class ProductService {
    private final ProductRepository productRepository;

    @Cacheable(value = "products", key = "#productId")
    public Product getProduct(String productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
    }

    @CacheEvict(value = "products", key = "#product.id")
    public void updateProduct(Product product) {
        productRepository.save(product);
    }
}
```

### Write-Through

The application writes directly to the cache, and the cache synchronously writes the data to the database before acknowledging the write to the user.

* **Implementation:** Redis and Memcached do not natively support this out of the box. You generally need specialized caching libraries (like Spring Cache or Hazelcast) to handle the proxying, or you must handle dual-writing in your application code.
* **Pros:** Ensures reads always return completely fresh data.
* **Cons:** Slower write operations. You also risk polluting your cache with data that might never be read again. Furthermore, you face the **Dual-Write Problem**: if the cache write succeeds but the database write fails, your system enters an inconsistent state.

**Implementation:**

```java
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final CacheManager cacheManager;

    @Transactional
    public Order createOrder(Order order) {
        // Write to cache first
        Cache cache = cacheManager.getCache("orders");
        cache.put(order.getId(), order);

        try {
            // Write to database
            return orderRepository.save(order);
        } catch (Exception e) {
            // Rollback cache on database failure
            cache.evict(order.getId());
            throw e;
        }
    }
}
```

### Write-Behind (Write-Back)

Similar to Write-Through, but the cache flushes the data to the database *asynchronously* in the background (usually in batches).

* **Pros:** Massive write throughput since the application gets an immediate response as soon as data hits the memory layer.
* **Cons:** Data loss. If the cache instance crashes before the background flush completes, the data is gone permanently.
* **Best For:** Analytics or metric pipelines where occasional, minor data loss is acceptable in exchange for high write speeds.

**Implementation:**

```java
@Service
public class AnalyticsService {
    private final CacheManager cacheManager;
    private final AnalyticsRepository analyticsRepository;
    private final ScheduledExecutorService scheduler;

    @PostConstruct
    public void init() {
        // Schedule periodic flush to database
        scheduler.scheduleAtFixedRate(
            this::flushToDatabase,
            1, 1, TimeUnit.MINUTES
        );
    }

    public void recordEvent(AnalyticsEvent event) {
        // Write to cache immediately
        Cache cache = cacheManager.getCache("analytics");
        cache.put(event.getId(), event);
    }

    private void flushToDatabase() {
        Cache cache = cacheManager.getCache("analytics");
        // Flush all cached events to database
        // ...
    }
}
```

### Read-Through

Similar to Cache-Aside, but instead of the application orchestrating the cache miss, the cache itself acts as a proxy. If a user asks the cache for data it doesn't have, the cache service fetches it from the database, stores it, and returns it. This is exactly how CDNs operate.

**Implementation:**

```java
public class ReadThroughCache<K, V> {
    private final Cache<K, V> cache;
    private final Function<K, V> loader;

    public ReadThroughCache(Cache<K, V> cache, Function<K, V> loader) {
        this.cache = cache;
        this.loader = loader;
    }

    public V get(K key) {
        V value = cache.getIfPresent(key);

        if (value == null) {
            // Cache miss - load from source
            value = loader.apply(key);
            cache.put(key, value);
        }

        return value;
    }
}

// Usage
ReadThroughCache<String, Product> productCache = new ReadThroughCache<>(
    Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .build(),
    productId -> productRepository.findById(productId)
        .orElseThrow(() -> new ProductNotFoundException(productId))
);
```

---

## Eviction Policies

Because memory is vastly more expensive and limited than disk storage, you cannot fit your entire dataset into a cache. Eviction policies define what gets removed when the cache fills up.

| Policy                          | Description & Use Case                                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LRU** (Least Recently Used)   | Evicts items that haven't been accessed recently. Often implemented under the hood with a linked list or priority queue. This is the standard default for most general-purpose caching.                                                 |
| **LFU** (Least Frequently Used) | Evicts items based on total access count. Best for highly skewed access patterns (e.g., a Pareto distribution). Even if an item was accessed 1 second ago, if its overall frequency is low, it gets dropped.                            |
| **FIFO** (First In, First Out)  | The oldest item gets removed to make space for the newest, regardless of access patterns. Rarely the right choice in a production environment.                                                                                          |
| **TTL** (Time to Live)          | Every cached item is given an explicit expiration clock (e.g., 5 minutes). Once time passes, it is automatically purged. Perfect for data where freshness strictly overrides frequency or recency (e.g., user sessions, API responses). |
| **Random Eviction**             | Randomly selects items to evict. Simple to implement but can lead to poor cache hit rates.                                                                                                                                              |
| **ARC** (Adaptive Replacement Cache) | Dynamically adapts between recency and frequency based on workload patterns. More complex but can provide better hit rates for mixed workloads.                                                                                      |

### LRU (Least Recently Used)

```java
// LRU Cache implementation using LinkedHashMap
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxSize;

    public LRUCache(int maxSize) {
        super(maxSize, 0.75f, true); // access-order mode
        this.maxSize = maxSize;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxSize;
    }
}

// Usage
LRUCache<String, String> cache = new LRUCache<>(100);
cache.put("key1", "value1");
cache.put("key2", "value2");
String value = cache.get("key1"); // key1 becomes most recently used
```

### LFU (Least Frequently Used)

```java
// LFU Cache implementation
public class LFUCache<K, V> {
    private final int capacity;
    private final Map<K, CacheNode<K, V>> cache;
    private final TreeMap<Integer, LinkedHashSet<CacheNode<K, V>>> frequencyMap;
    private int minFrequency;

    private static class CacheNode<K, V> {
        K key;
        V value;
        int frequency;

        CacheNode(K key, V value) {
            this.key = key;
            this.value = value;
            this.frequency = 1;
        }
    }

    public LFUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new HashMap<>();
        this.frequencyMap = new TreeMap<>();
        this.minFrequency = 1;
    }

    public V get(K key) {
        CacheNode<K, V> node = cache.get(key);
        if (node == null) {
            return null;
        }

        // Update frequency
        updateFrequency(node);
        return node.value;
    }

    public void put(K key, V value) {
        if (capacity == 0) {
            return;
        }

        CacheNode<K, V> existingNode = cache.get(key);
        if (existingNode != null) {
            existingNode.value = value;
            updateFrequency(existingNode);
            return;
        }

        if (cache.size() >= capacity) {
            // Evict least frequently used item
            LinkedHashSet<CacheNode<K, V>> nodes = frequencyMap.get(minFrequency);
            CacheNode<K, V> toRemove = nodes.iterator().next();
            nodes.remove(toRemove);
            cache.remove(toRemove.key);

            if (nodes.isEmpty()) {
                frequencyMap.remove(minFrequency);
            }
        }

        CacheNode<K, V> newNode = new CacheNode<>(key, value);
        cache.put(key, newNode);
        frequencyMap.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(newNode);
        minFrequency = 1;
    }

    private void updateFrequency(CacheNode<K, V> node) {
        int oldFreq = node.frequency;
        int newFreq = oldFreq + 1;

        LinkedHashSet<CacheNode<K, V>> oldSet = frequencyMap.get(oldFreq);
        oldSet.remove(node);

        if (oldSet.isEmpty()) {
            frequencyMap.remove(oldFreq);
            if (minFrequency == oldFreq) {
                minFrequency++;
            }
        }

        node.frequency = newFreq;
        frequencyMap.computeIfAbsent(newFreq, k -> new LinkedHashSet<>()).add(node);
    }
}
```

### TTL (Time to Live)

```java
// TTL Cache implementation
public class TTLCache<K, V> {
    private final ConcurrentHashMap<K, CacheEntry<V>> cache;
    private final long ttlMillis;
    private final ScheduledExecutorService cleanupExecutor;

    private static class CacheEntry<V> {
        final V value;
        final long expiryTime;

        CacheEntry(V value, long ttlMillis) {
            this.value = value;
            this.expiryTime = System.currentTimeMillis() + ttlMillis;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }

    public TTLCache(long ttlMillis) {
        this.cache = new ConcurrentHashMap<>();
        this.ttlMillis = ttlMillis;
        this.cleanupExecutor = Executors.newSingleThreadScheduledExecutor();

        // Schedule periodic cleanup
        cleanupExecutor.scheduleAtFixedRate(
            this::cleanup,
            ttlMillis / 2,
            ttlMillis / 2,
            TimeUnit.MILLISECONDS
        );
    }

    public void put(K key, V value) {
        cache.put(key, new CacheEntry<>(value, ttlMillis));
    }

    public V get(K key) {
        CacheEntry<V> entry = cache.get(key);
        if (entry == null || entry.isExpired()) {
            cache.remove(key);
            return null;
        }
        return entry.value;
    }

    private void cleanup() {
        Iterator<Map.Entry<K, CacheEntry<V>>> it = cache.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<K, CacheEntry<V>> entry = it.next();
            if (entry.getValue().isExpired()) {
                it.remove();
            }
        }
    }

    public void shutdown() {
        cleanupExecutor.shutdown();
    }
}
```

---

## The "Hard" Problems in Caching

Adding a cache doesn't just speed things up; it introduces complex distributed systems challenges that interviewers love to probe into.

### 1. Cache Stampede (Thundering Herd)

A stampede happens when a highly popular cache entry expires (via its TTL), causing a sudden flood of concurrent requests to experience a cache miss all at the exact same time.

* **Example:** Imagine you cache the homepage feed of a site with a 60-second TTL. You get 100,000 requests per second. For 60 seconds, the cache absorbs the load. At exactly 61 seconds, the key expires. In that single moment, 100,000 requests miss the cache and simultaneously slam your database, likely taking it offline via cascading failure.

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

```
┌─────────────────────────────────────────┐
│         Application Server               │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         L1 Cache (Memory)        │  │
│  │  - Fastest (nanoseconds)         │  │
│  │  - Local to server               │  │
│  │  - Small capacity                │  │
│  └───────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌───────────────────────────────────┐  │
│  │         L2 Cache (Redis)          │  │
│  │  - Fast (microseconds)            │  │
│  │  - Shared across servers         │  │
│  │  - Medium capacity               │  │
│  └───────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌───────────────────────────────────┐  │
│  │         Database                  │  │
│  │  - Slow (milliseconds)           │  │
│  │  - Persistent storage             │  │
│  │  - Large capacity               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

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
        expr: cache_hit_rate < 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Low cache hit rate for {{ $labels.cache }}

      - alert: HighCacheMissRate
        expr: rate(cache_misses[5m]) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High cache miss rate for {{ $labels.cache }}

      - alert: HighCacheEvictionRate
        expr: rate_cache_evictions[5m] > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High cache eviction rate for {{ $labels.cache }}
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

### Q: How do you optimize cache performance?

**A:** Choose appropriate eviction policies, optimize cache size, use efficient data structures, implement cache warming, monitor performance metrics, and tune configuration based on access patterns.

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

