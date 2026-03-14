---
id: caching-strategies
title: Caching Strategies
sidebar_label: Caching Strategies
description: In-depth guide to caching strategies including cache-aside, write-through, write-behind, eviction policies, cache stampede prevention, Redis data structures, and multi-level caching.
tags: [caching, redis, caffeine, eviction, ttl, cache-invalidation, performance]
---

# Caching Strategies

> A cache is a **fast, temporary data store** closer to the application than the source of truth.

---

## Cache Levels

```
L1: In-process (JVM heap)      → ~nanoseconds, not shared across instances
L2: Distributed cache (Redis)  → ~microseconds, shared across instances
L3: DB read replica            → ~milliseconds, full data available
L4: Primary DB                 → ~milliseconds, authoritative
```

---

## Caching Patterns

### Cache-Aside (Lazy Population)
Application controls cache. Most common pattern.

```java
// Spring Boot + Caffeine (L1) + Redis (L2)
@Service
public class ProductService {
    @Autowired private ProductRepository repo;
    @Autowired private RedisTemplate<String, Product> redis;

    // Spring @Cacheable uses Caffeine for L1 by default
    @Cacheable(value = "products", key = "#id")
    public Product getProduct(Long id) {
        String redisKey = "product:" + id;
        Product cached = redis.opsForValue().get(redisKey);
        if (cached != null) return cached;

        Product product = repo.findById(id).orElseThrow();
        redis.opsForValue().set(redisKey, product, Duration.ofHours(1));
        return product;
    }

    @CacheEvict(value = "products", key = "#product.id")
    public Product updateProduct(Product product) {
        Product saved = repo.save(product);
        redis.delete("product:" + product.getId());
        return saved;
    }
}
```

### Write-Through
Write to cache and DB simultaneously.

```java
@CachePut(value = "products", key = "#product.id")  // Always updates cache
public Product saveProduct(Product product) {
    return repo.save(product); // Saves to DB too
}
```

### Write-Behind (Write-Back)
Write to cache, async flush to DB.

```
Write → Cache (immediate ACK)
              ↓ async (every 5s)
           Flush to DB (batch)
```

**Risk**: Data loss if cache crashes before flush. Use with durable Redis (AOF).

### Refresh-Ahead
Predictively refresh cache before TTL expires.

```java
// Background refresher
@Scheduled(fixedDelay = 3600_000)  // Every hour
public void refreshTopProducts() {
    List<Long> hotProductIds = analyticsService.getTopProductIds(100);
    hotProductIds.forEach(id -> {
        Product product = repo.findById(id).orElseThrow();
        redis.opsForValue().set("product:" + id, product, Duration.ofHours(2));
    });
}
```

---

## Eviction Policies

| Policy | How | Best For |
|---|---|---|
| **LRU** (Least Recently Used) | Evict least recently accessed | General-purpose, temporal locality |
| **LFU** (Least Frequently Used) | Evict least accessed over time | Skewed access (Pareto distribution) |
| **FIFO** | Evict oldest entry | Simple, fair |
| **TTL** | Evict after fixed time | Data with known freshness requirements |
| **Random** | Evict random entry | Simple, low overhead |

```yaml
# Redis maxmemory policy
redis:
  maxmemory: 2gb
  maxmemory-policy: allkeys-lru  # LRU across all keys
  # Options: noeviction, allkeys-lru, allkeys-lfu, volatile-lru, volatile-ttl
```

---

## Redis Data Structures

| Structure | Commands | Use Case |
|---|---|---|
| String | GET/SET/INCR | Session tokens, counters, simple values |
| Hash | HGET/HSET/HMGET | User profiles, objects with fields |
| List | LPUSH/RPOP/LRANGE | Activity feeds, queues |
| Set | SADD/SISMEMBER/SUNION | Tags, unique visitors, permissions |
| Sorted Set | ZADD/ZRANGE/ZRANGEBYSCORE | Leaderboards, rate limiting, expiring sets |
| Bitmap | SETBIT/BITCOUNT | Daily active users, feature flags |
| HyperLogLog | PFADD/PFCOUNT | Approximate unique counts (1% error, ~12KB) |
| Stream | XADD/XREAD | Event log, message queue |

```java
// Leaderboard with Sorted Set
redisTemplate.opsForZSet().add("leaderboard:weekly", userId, score);

// Top 10 players
Set<ZSetOperations.TypedTuple<Long>> top10 = redisTemplate.opsForZSet()
    .reverseRangeWithScores("leaderboard:weekly", 0, 9);

// Approximate unique daily active users
redisTemplate.opsForHyperLogLog().add("dau:" + today, userId);
long dau = redisTemplate.opsForHyperLogLog().size("dau:" + today);
```

---

## Cache Invalidation Strategies

### Time-Based (TTL)
```java
redis.opsForValue().set(key, value, Duration.ofMinutes(30));
```
Simple but stale during TTL window.

### Event-Based
```java
// On product update → publish invalidation event
@Transactional
public void updateProduct(Product product) {
    repo.save(product);
    eventPublisher.publishEvent(new ProductUpdatedEvent(product.getId()));
}

@EventListener
@Async
public void onProductUpdated(ProductUpdatedEvent event) {
    redis.delete("product:" + event.getProductId());
    // Local cache eviction
    cacheManager.getCache("products").evict(event.getProductId());
}
```

### Tag-Based Invalidation
```java
// Associate cache entries with tags
// Invalidate all entries with a given tag
cacheManager.getCache("products-by-category-electronics").clear();
```

---

## Cache Warming

Pre-populate cache before traffic hits (prevents cold start).

```java
@Component
public class CacheWarmer implements ApplicationListener<ApplicationReadyEvent> {
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("Warming cache...");
        // Load top N items into cache
        productRepository.findTopByOrderByViewCountDesc(1000)
            .forEach(p -> redis.opsForValue()
                .set("product:" + p.getId(), p, Duration.ofHours(2)));
        log.info("Cache warm-up complete");
    }
}
```

---

## Spring Cache Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .withCacheConfiguration("products",
                config.entryTtl(Duration.ofHours(1)))   // Override per cache
            .withCacheConfiguration("sessions",
                config.entryTtl(Duration.ofDays(1)))
            .build();
    }
}
```

---

## Cache Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Caching mutable user-specific data globally | Wrong data served to users | Use user-scoped keys |
| No TTL (infinite cache) | Memory leak, stale data forever | Always set TTL |
| Caching exceptions/nulls | Repeated DB hits for non-existent keys | Cache null with short TTL |
| Cache as primary store | Data loss on eviction | Cache is supplemental only |
| Caching in DB transaction | Transactional boundary mismatch | Invalidate after commit |

---

## Cache Hit Rate Calculation

```
Hit Rate = Cache Hits / (Cache Hits + Cache Misses)

Target: > 90% for read-heavy systems
If < 80%: Cache too small, TTL too short, or access pattern too random
```

---

## Interview Questions

1. What is cache-aside vs read-through? When do you use each?
2. Why is cache invalidation considered one of the hardest problems in CS?
3. What is a cache stampede? How do you prevent it?
4. What Redis data structure would you use for a leaderboard? For counting unique visitors?
5. What eviction policy would you choose for a product catalog vs a social feed?
6. How do you ensure cache consistency across multiple application instances?
7. What is the difference between L1 (local) and L2 (distributed) caching?
8. How would you implement rate limiting using Redis?
9. What is HyperLogLog and when would you use it instead of a Set?
10. How do you handle cache warming after a deployment?
