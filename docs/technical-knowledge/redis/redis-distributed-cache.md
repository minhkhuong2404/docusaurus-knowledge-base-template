---
id: redis-distributed-cache
title: "Redis as Distributed Cache"
slug: redis-distributed-cache
description: Distributed caching patterns with Redis — cache-aside, write-through, write-behind, read-through — and production concerns like stampede, warming, invalidation, and Spring Cache integration.
tags: [redis, cache, distributed-cache, backend, spring, performance]
---

# Redis as Distributed Cache

Redis is the most widely used distributed cache because of its speed, rich data structures, and built-in TTL. Understanding caching patterns and their failure modes is one of the most common senior interview topics.

#### 👶 Beginner Concept: The "Fast Lane Desk"
Imagine you run an extremely popular DMV. 
- **The Database:** This is the massive vault in the basement. Every time a citizen asks for a generic form, a worker has to walk down there, find it, and bring it up. It is slow.
- **The Cache:** You buy a quick-access desk right next to the front door (RAM) and put 100 copies of the most popular form on it. 
  - **Cache Hit:** A citizen asks for the popular form. You instantly grab it from the front desk and hand it to them.
  - **Cache Miss:** A citizen asks for a rare, ancient form. It's not on the front desk. You have to walk down to the basement vault (Database Hit), grab it, hand it to the citizen, and *put one copy on your front desk* just in case someone else asks for it today.

---

## Caching Patterns

### 1. Cache-Aside (Lazy Loading)

The most common pattern. The application manages the cache explicitly:

```
Read:
  1. Check cache → HIT → return cached value
  2. Cache MISS → query DB → write to cache → return value

Write:
  1. Update DB
  2. Invalidate cache (or update cache)
```

```java
@Service
public class ProductService {

    public Product getProduct(Long id) {
        String key = "product:" + id;

        // 1. Check cache
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return objectMapper.readValue(cached, Product.class);  // Cache HIT
        }

        // 2. Cache MISS — query DB
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(id));

        // 3. Populate cache with TTL
        redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(product),
            Duration.ofMinutes(30));

        return product;  // Return from DB
    }

    public void updateProduct(Long id, Product product) {
        productRepository.save(product);
        redisTemplate.delete("product:" + id);  // Invalidate cache
    }
}
```

**Pros:** Simple, only caches what's needed (lazy), tolerant of cache failure  
**Cons:** First request always misses (cold start), data can be stale between DB write and cache invalidation

### 2. Write-Through

Write to cache and DB simultaneously on every write:

```
Write:
  1. Update cache
  2. Update DB (synchronous)

Read:
  1. Always hits cache (if key exists)
```

```java
public void updateProduct(Long id, Product product) {
    productRepository.save(product);  // DB write
    String json = objectMapper.writeValueAsString(product);
    redisTemplate.opsForValue().set("product:" + id, json, Duration.ofHours(1));  // Cache write
}
```

**Pros:** Cache always fresh, no stale reads  
**Cons:** Write latency increases (2 writes), cache fills with infrequently-read data (use TTL to evict unused)

### 3. Write-Behind (Write-Back)

Write to cache immediately, then asynchronously flush to DB:

```
Write:
  1. Write to cache
  2. Return OK to client
  3. Background job flushes cache → DB

Read:
  1. Always from cache
```

**Pros:** Extremely fast writes (only cache I/O on critical path)  
**Cons:** Risk of data loss if Redis crashes before flush, complexity of async flush, consistency challenges

**Rarely used without Redis persistence enabled (RDB+AOF).**

### 4. Read-Through

Cache is the primary interface — cache handles its own population:

```
Read:
  1. App asks cache for data
  2. Cache HIT → return
  3. Cache MISS → cache fetches from DB, stores, returns
```

Implemented via Spring's `@Cacheable`:

```java
@Cacheable(value = "products", key = "#id")
public Product getProduct(Long id) {
    return productRepository.findById(id).orElseThrow();
}

@CacheEvict(value = "products", key = "#id")
public void deleteProduct(Long id) {
    productRepository.deleteById(id);
}

@CachePut(value = "products", key = "#result.id")
public Product updateProduct(Product product) {
    return productRepository.save(product);
}
```

---

## 🧠 Senior Deep Dive: The "Holy Trinity" of Cache Failures

Any junior developer can write `redis.set(key, value)`. A senior engineer assumes the cache will fail and designs mitigations for the three most deadly performance killers in distributed caching.

### 1. Cache Stampede (Thundering Herd / Dogpiling)

When a heavily accessed key (like the homepage payload) naturally expires, hundreds of concurrent requests all realize the cache is empty at the exact same millisecond. They all bypass the cache and hammer the database simultaneously.

```
t=0:   product:123 TTL expires
t=0:   100 concurrent requests → cache MISS
t=0:   100 threads all query DB for product:123 simultaneously
t=0:   100 "repopulate cache" operations
```

**Solutions:**

**1. Mutex Lock (only one thread repopulates)**
```java
public Product getProduct(Long id) {
    String key = "product:" + id;
    String lockKey = "lock:" + key;

    String cached = redisTemplate.opsForValue().get(key);
    if (cached != null) return deserialize(cached);

    // Only one thread repopulates — others wait
    Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofSeconds(10));
    if (Boolean.TRUE.equals(acquired)) {
        try {
            Product product = productRepository.findById(id).orElseThrow();
            redisTemplate.opsForValue().set(key, serialize(product), Duration.ofMinutes(30));
            return product;
        } finally {
            redisTemplate.delete(lockKey);
        }
    } else {
        Thread.sleep(50);   // Brief wait
        return getProduct(id);  // Retry — now cache is warm
    }
}
```

**2. Probabilistic Early Expiration (PER)**
```python
def get_product(id):
    cached = redis.get(f"product:{id}")
    ttl = redis.ttl(f"product:{id}")
    # Probabilistically recompute cache before it expires
    if ttl < 60 and random.random() < 0.1:  # 10% chance when <60s left
        product = db.fetch(id)
        redis.set(f"product:{id}", product, ex=1800)
        return product
    return cached if cached else recompute(id)
```

**3. Jitter on TTL (prevents mass expiry)**
```java
int jitterSeconds = ThreadLocalRandom.current().nextInt(0, 300);
redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(1800 + jitterSeconds));
```

### Cache Penetration

Requests for keys that **never exist** bypass cache and hit DB every time:

```
Request: product:99999999 (doesn't exist in DB)
→ Cache MISS → DB query → not found → no caching → next request repeats!
```

**Solutions:**

```java
// Cache null values with short TTL
public Product getProduct(Long id) {
    String key = "product:" + id;
    String cached = redisTemplate.opsForValue().get(key);

    if ("NULL".equals(cached)) return null;  // Cached null — don't hit DB
    if (cached != null) return deserialize(cached);

    Product product = productRepository.findById(id).orElse(null);
    if (product == null) {
        redisTemplate.opsForValue().set(key, "NULL", Duration.ofMinutes(5));  // Cache the miss
        return null;
    }
    redisTemplate.opsForValue().set(key, serialize(product), Duration.ofMinutes(30));
    return product;
}
```

```java
// Bloom Filter (space-efficient membership check before DB hit)
// Guava BloomFilter or Redisson RBloomFilter
BloomFilter<Long> existingProductIds = BloomFilter.create(Funnels.longFunnel(), 1_000_000, 0.01);
// Populated at startup from DB

public Product getProduct(Long id) {
    if (!existingProductIds.mightContain(id)) {
        return null;  // Definitely doesn't exist — skip DB
    }
    return cacheAside(id);
}
```

### Cache Avalanche

Many keys expire at the same time — DB is overwhelmed with concurrent misses.

**Solutions:**
- Jittered TTL (see above)
- Staggered cache warm-up
- Background refresh before expiry
- Circuit breaker on DB calls during high miss rates

---

## Cache Invalidation Strategies

The hardest problem in caching. Choose based on consistency requirements:

| Strategy | Consistency | Complexity | Use Case |
|----------|-------------|------------|----------|
| **TTL only** | Eventual (stale until TTL) | Lowest | Read-heavy, tolerate slight staleness |
| **Invalidation on write** | Strong | Low | Write-behind/write-through patterns |
| **Event-driven invalidation** | Near-real-time | Medium | Microservices, Pub/Sub |
| **Version-tagged keys** | Depends | Medium | Safe migrations, gradual rollout |
| **Two-phase invalidation** | Strong | High | Multi-region consistency |

### Event-Driven Cache Invalidation

```
Service A updates product:123 in DB
→ Publishes "product:updated" event to message bus (Kafka/Redis Streams)
→ All service instances subscribe
→ Each instance invalidates "product:123" from its local + Redis cache
```

### Version-Tagged Keys

```python
# v=2 suffix — safe rollout of schema changes
redis.set("product:123:v2", new_format_data, ex=3600)
# Old key "product:123:v1" expires naturally
# Easy rollback: just read old version key
```

---

## Spring Cache Abstraction

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaultCfg = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
            "products",   defaultCfg.entryTtl(Duration.ofHours(1)),
            "users",      defaultCfg.entryTtl(Duration.ofMinutes(15)),
            "sessions",   defaultCfg.entryTtl(Duration.ofHours(24))
        );

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaultCfg)
            .withInitialCacheConfigurations(cacheConfigs)
            .build();
    }
}
```

---

## Two-Level (L1 + L2) Cache Pattern

Combine in-process cache (L1) with Redis (L2) for maximum performance:

```
Request → L1 (Caffeine, in-process, nanoseconds)
            HIT → return immediately
            MISS → L2 (Redis, milliseconds)
                   HIT → populate L1 → return
                   MISS → DB (tens of milliseconds)
                          → populate L2 → populate L1 → return
```

```java
@Service
public class ProductService {
    private final Cache<Long, Product> localCache = Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(Duration.ofMinutes(5))  // L1 shorter TTL
        .build();

    public Product getProduct(Long id) {
        // L1 check
        Product cached = localCache.getIfPresent(id);
        if (cached != null) return cached;

        // L2 check
        String redisKey = "product:" + id;
        String json = redisTemplate.opsForValue().get(redisKey);
        if (json != null) {
            Product product = deserialize(json);
            localCache.put(id, product);  // Warm L1
            return product;
        }

        // DB
        Product product = productRepository.findById(id).orElseThrow();
        redisTemplate.opsForValue().set(redisKey, serialize(product), Duration.ofHours(1));  // Warm L2
        localCache.put(id, product);  // Warm L1
        return product;
    }
}
```

**L1 invalidation:** When L2 is evicted/updated, L1 needs invalidation too. Use Redis Pub/Sub to broadcast invalidation events to all JVM instances:

```
Redis PUBLISH cache:invalidate "product:123"
→ All service instances: localCache.invalidate(123)
```

---

## Interview Questions

### Q: How do you pick a cache pattern for a write-heavy domain?
**A:** Start with cache-aside plus invalidation-on-write; use write-through only when freshness requirements justify added write latency.

### Q: What is the most common cache stampede mitigation in practice?
**A:** TTL jitter plus single-flight lock per hot key, with short fallback windows.

### Q: How do you design cache keys for long-term maintainability?
**A:** Use stable namespaced keys with explicit versioning and deterministic parameter ordering.

### Q: When should null caching be enabled?
**A:** For high-cardinality miss patterns, with short TTL to limit stale non-existence assumptions.

### Q: How do you keep L1 and L2 cache coherent in microservices?
**A:** Broadcast invalidation events and enforce bounded staleness windows with metrics on stale-hit rate.

### Q: What cache metrics matter most in senior reviews?
**A:** Hit ratio by key family, fill latency, eviction rate, and downstream protection during miss spikes.
