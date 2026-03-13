---
id: caching-strategies
title: Caching Strategies
description: Cache patterns, eviction policies, Redis deep dive, cache invalidation strategies, and common pitfalls like cache stampede and cache penetration.
tags: [database, caching, redis, cache-aside, write-through, eviction, performance]
sidebar_position: 8
---

# Caching Strategies

## Why Cache?

- **Reduce DB load**: serve repeated reads from memory, not disk
- **Reduce latency**: RAM access is ~100ns vs disk ~10ms
- **Handle traffic spikes**: absorb bursts without overloading DB
- **Cost savings**: fewer DB read replicas needed

**Rule of thumb**: a cache hit is 100–1000x faster than a DB query.

---

## Cache Tiers

```
Client
  ↓
[CDN Cache]          ← static assets, responses (edge)
  ↓
[App Server Cache]   ← in-process (Caffeine, Guava)
  ↓
[Distributed Cache]  ← Redis, Memcached
  ↓
[Database]           ← source of truth
```

### In-Process Cache (Local)
- Stored in JVM heap (Caffeine, Guava Cache)
- Zero network latency
- Not shared across instances → consistency issues
- Good for: config, reference data, rarely-changing data

### Distributed Cache (Remote)
- Shared across all app instances (Redis, Memcached)
- Network latency (~0.5ms)
- Good for: sessions, user data, computed results

---

## Core Cache Patterns

### Cache-Aside (Lazy Loading) ← Most Common

Application manages the cache explicitly.

```
Read:
  1. Check cache → HIT? return value
  2. MISS → query DB
  3. Store in cache with TTL
  4. Return value

Write:
  1. Write to DB
  2. Invalidate (delete) cache entry
```

```java
// Spring: manual cache-aside
@Service
public class ProductService {
    @Autowired private RedisTemplate<String, Product> redis;
    @Autowired private ProductRepository repo;

    public Product getProduct(Long id) {
        String key = "product:" + id;
        Product cached = redis.opsForValue().get(key);
        if (cached != null) return cached;

        Product product = repo.findById(id).orElseThrow();
        redis.opsForValue().set(key, product, 30, TimeUnit.MINUTES);
        return product;
    }

    public void updateProduct(Product product) {
        repo.save(product);
        redis.delete("product:" + product.getId()); // invalidate
    }
}
```

✅ Only caches what's actually read
✅ Cache failures don't break the app (falls back to DB)
❌ First request (cache miss) is slow
❌ Risk of stale data between write and invalidation

---

### Read-Through

Cache sits between app and DB; cache handles miss automatically.

```
App → Cache → (on miss) → Cache fetches from DB → Cache returns
```

App always talks to cache — DB is invisible to app logic.
Used by: JPA 2nd-level cache, some Redis client libraries.

---

### Write-Through

Every write goes to cache AND DB synchronously.

```
App writes → Cache → DB (synchronous)
Cache always up-to-date
```

✅ Cache never stale
❌ Write latency increased (two writes)
❌ Cache fills with data that may never be read

---

### Write-Behind (Write-Back)

Write to cache immediately, flush to DB asynchronously.

```
App writes → Cache (ack immediately)
                    ↓ async (batch writes to DB)
                  [DB]
```

✅ Lowest write latency
❌ Data loss risk if cache node crashes before flush
❌ Complex consistency guarantees
Used by: InnoDB buffer pool, some CDNs

---

### Write-Around

Writes go directly to DB; cache is not updated on write.

```
Write: App → DB (cache bypassed)
Read: App → Cache (miss) → DB → Cache
```

Good for: data that's written once but read infrequently (logs, audit trails).

---

## Cache Eviction Policies

| Policy | Description | Use Case |
|--------|-------------|---------|
| **LRU** (Least Recently Used) | Evict the least recently accessed item | General purpose |
| **LFU** (Least Frequently Used) | Evict the least often accessed item | Skewed access (popular items stay) |
| **FIFO** | Evict oldest inserted item | Simple queues |
| **TTL** (Time To Live) | Evict after fixed time | Time-sensitive data, sessions |
| **Random** | Evict a random item | Approximates LRU with less overhead |
| **AllKeys-LRU** (Redis) | LRU across all keys when memory full | Default Redis recommendation |
| **Volatile-LRU** (Redis) | LRU among keys with TTL only | Mixed cache |

```bash
# Redis maxmemory policy
CONFIG SET maxmemory 2gb
CONFIG SET maxmemory-policy allkeys-lru
```

---

## Cache Invalidation Strategies

"There are only two hard things in CS: cache invalidation and naming things." — Phil Karlton

### 1. TTL-Based Expiry
```bash
SET product:42 "{...}" EX 300   # expires in 5 minutes
```
Simple but may serve stale data up to TTL.

### 2. Event-Driven Invalidation
Invalidate on write event (most accurate):
```java
// Publish event → consumer deletes cache key
@TransactionalEventListener
public void onProductUpdated(ProductUpdatedEvent event) {
    redis.delete("product:" + event.getProductId());
    redis.delete("products:list:*");  // pattern delete
}
```

### 3. Versioning / Namespacing
```
v3:product:42   → current version
v2:product:42   → stale (still in cache, ignored)
```
Bump version on bulk invalidation instead of deleting individual keys.

### 4. Cache-Aside with Short TTL
Accept up to N seconds of stale data. Simplest strategy.

---

## Cache Problems & Solutions

### Cache Stampede (Thundering Herd)

**Problem**: Many requests hit the DB simultaneously when a popular cache key expires.

```
t=0: key expires
t=1: 1000 concurrent requests find MISS → all query DB → DB overwhelmed
```

**Solutions:**

1. **Probabilistic Early Expiry** (XFetch / jitter)
```java
// Add random jitter to TTL
int ttl = 300 + ThreadLocalRandom.current().nextInt(-30, 30);
redis.setex(key, ttl, value);
```

2. **Mutex/Lock on cache miss**
```java
String lockKey = "lock:product:" + id;
Boolean locked = redis.setIfAbsent(lockKey, "1", 5, TimeUnit.SECONDS);
if (locked) {
    try {
        Product p = db.findById(id);
        redis.set(key, p, 5, TimeUnit.MINUTES);
        return p;
    } finally {
        redis.delete(lockKey);
    }
} else {
    Thread.sleep(50);
    return redis.get(key); // retry — another thread filled it
}
```

3. **Background refresh**: refresh before expiry, serve old value during refresh.

---

### Cache Penetration

**Problem**: Queries for keys that **don't exist** in DB (null result) bypass cache and hammer DB.

```
Attacker: GET /product/999999999 (doesn't exist)
→ Cache miss → DB miss → no caching → repeat
```

**Solutions:**

1. **Cache null results** with short TTL
```java
redis.set(key, "NULL_SENTINEL", 60, TimeUnit.SECONDS);
```

2. **Bloom Filter**: before DB query, check if key could exist
```java
// Guava BloomFilter
BloomFilter<Long> filter = BloomFilter.create(
    Funnels.longFunnel(), expectedInsertions, 0.01);
// Pre-populate with all valid IDs
if (!filter.mightContain(productId)) {
    return null; // definitely doesn't exist
}
```

---

### Cache Avalanche

**Problem**: Many cache keys expire at the same time → mass DB queries.

**Solutions:**
- Add random jitter to TTLs
- Use staggered expiry
- Warm cache before deployment
- Circuit breaker in front of DB

---

## Redis Deep Dive

### Data Types & Commands

```bash
# String
SET counter 0
INCR counter                  # atomic increment → 1
INCRBY counter 5              # → 6
GETSET counter 0              # return old, set new

# Hash
HSET user:1 name Alice age 30
HGET user:1 name              # "Alice"
HMGET user:1 name age         # ["Alice", "30"]
HGETALL user:1

# List
LPUSH queue "task1"
RPUSH queue "task2"
LPOP queue                    # "task1"
LRANGE queue 0 -1             # all elements
BLPOP queue 30                # blocking pop (30s timeout)

# Sorted Set
ZADD rankings 1500 "alice"
ZADD rankings 2000 "bob"
ZREVRANK rankings "alice"     # rank (0-indexed from top)
ZREVRANGEBYSCORE rankings +inf -inf LIMIT 0 10  # top 10

# Pub/Sub
SUBSCRIBE channel1
PUBLISH channel1 "hello"
```

### Redis Persistence

| Mode | Description | Durability |
|------|-------------|------------|
| **RDB** (snapshot) | Point-in-time dump at intervals | Data loss since last snapshot |
| **AOF** (append-only file) | Log every write command | Near-zero data loss (fsync options) |
| **RDB + AOF** | Both enabled | Best durability |
| **No persistence** | Pure cache mode | Fastest; all data lost on restart |

---

## Spring Cache Abstraction

```java
// Enable caching
@SpringBootApplication
@EnableCaching
public class Application { ... }

// Cache operations
@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id")
    public Product getProduct(Long id) { ... }    // cache on first call

    @CachePut(value = "products", key = "#product.id")
    public Product updateProduct(Product product) { ... }  // always updates cache

    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(Long id) { ... }    // removes from cache

    @CacheEvict(value = "products", allEntries = true)
    public void clearAll() { ... }
}

# application.properties
spring.cache.type=redis
spring.redis.host=localhost
spring.redis.port=6379
spring.cache.redis.time-to-live=300000  # 5 min in ms
```

---

## Cache Hit Rate & Sizing

- **Hit rate** = cache hits / (hits + misses)
- Target: >90% for effective caching; >99% for critical paths
- If hit rate < 80%: cache is too small, TTL too short, or access patterns don't repeat

```bash
# Redis: INFO stats
INFO stats
# keyspace_hits: 10000
# keyspace_misses: 500
# hit_rate = 10000 / 10500 = 95.2%
```

---

## 🎯 Interview Questions

**Q1. What is the difference between cache-aside and write-through caching?**
> Cache-aside: app checks cache first; on miss, app loads from DB and populates cache. Writes invalidate the cache. Simple and resilient to cache failures. Write-through: every write updates both cache and DB synchronously. Cache is always fresh, but write latency is higher and cache fills with write-once data.

**Q2. What is a cache stampede and how do you prevent it?**
> A stampede occurs when a popular cache key expires and many concurrent requests simultaneously query the DB. Prevention: add TTL jitter to stagger expiry; use a distributed lock so only one request fetches from DB while others wait; use background refresh to regenerate before expiry.

**Q3. What is cache penetration and how is it different from cache avalanche?**
> Penetration: queries for non-existent keys always bypass cache (no result to cache). Fix: cache null results or use a Bloom filter. Avalanche: many cache keys expire simultaneously, flooding the DB. Fix: random TTL jitter, circuit breakers, staggered warmup.

**Q4. Explain LRU vs LFU eviction. When would you prefer each?**
> LRU evicts the least recently accessed item — good for general workloads where recent = relevant. LFU evicts the least frequently accessed — better for skewed access patterns where popular items should never be evicted regardless of recency (e.g., viral products). LFU is more complex to implement.

**Q5. What are the trade-offs of using Redis for caching vs Memcached?**
> Redis: richer data types (sorted sets, streams, pub/sub), persistence options, clustering, replication, Lua scripting, transactions. Memcached: simpler, multi-threaded, slightly faster for pure key-value with large values, less memory overhead. Redis is almost always preferred for new systems due to versatility.

**Q6. How do you handle cache invalidation in a microservices architecture?**
> Options: event-driven invalidation (publish domain events, consumers delete their cache keys); short TTLs with acceptable stale tolerance; versioned cache keys (change key prefix instead of deleting). The hardest part is ensuring cache updates and DB writes are atomic — use transactional outbox pattern.

**Q7. What is the difference between @Cacheable and @CachePut in Spring?**
> `@Cacheable` skips the method execution if a cache entry exists (read-through). `@CachePut` always executes the method and updates the cache with the result — used for write-through updates. Use `@CachePut` on update methods to keep the cache current after writes.

**Q8. How would you cache a paginated list of items that changes frequently?**
> This is a notoriously hard problem. Options: cache individual items by ID and assemble pages from cache (requires sorted-set tracking); cache the whole page result with short TTL (accept stale data); don't cache paginated results and rely on DB query optimization + read replicas instead. The right answer depends on acceptable staleness and update frequency.

---

## Advanced Editorial Pass: Caching Strategy as Correctness and Latency Design

### Senior Engineering Focus
- Define freshness and staleness budgets explicitly.
- Align cache keys and invalidation model with domain invariants.
- Treat cache failures as normal events with graceful degradation.

### Failure Modes to Anticipate
- Cache stampede under synchronized expiration.
- Stale data bugs from weak invalidation ownership.
- Hidden dependency on cache availability for correctness.

### Practical Heuristics
1. Implement stampede protection and bounded TTL policies.
2. Track hit rate with correctness metrics, not in isolation.
3. Specify fallback behavior for cache miss and outage paths.

### Compare Next
- [Performance & Monitoring](./performance-monitoring.md)
- [Transactions & Concurrency](./transactions-concurrency.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
