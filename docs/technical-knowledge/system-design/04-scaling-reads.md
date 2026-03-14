---
id: scaling-reads
title: Scaling Reads
sidebar_label: Scaling Reads
description: Strategies for handling high read QPS including caching layers, read replicas, CDN, CQRS, and database indexing. Covers Redis patterns, cache invalidation, and fan-out strategies.
tags: [scaling, reads, caching, redis, cdn, cqrs, read-replicas, performance]
---

# Scaling Reads

> Read-heavy systems (>80% reads) need different strategies than write-heavy ones. The goal: **serve data without hitting the primary database**.

---

## Strategy Hierarchy (Fastest to Slowest)

```
In-process cache (local JVM heap)
  ↓
Distributed cache (Redis)
  ↓
CDN (for static/semi-static content)
  ↓
Read replica (DB)
  ↓
Primary DB
```

---

## Caching Strategies

### Cache-Aside (Lazy Loading)
Most common pattern. Application manages the cache.

```java
// Spring Boot example with Caffeine/Redis
@Service
public class UserService {
    @Autowired private UserRepository repo;
    @Autowired private RedisTemplate<String, User> redis;

    public User getUser(Long id) {
        String key = "user:" + id;
        User cached = redis.opsForValue().get(key);
        if (cached != null) return cached;

        User user = repo.findById(id).orElseThrow();
        redis.opsForValue().set(key, user, Duration.ofMinutes(30));
        return user;
    }
}
```

**Pros:** Only caches what's needed. Cache failure doesn't break reads.  
**Cons:** Cache miss = 3 trips (cache + DB + cache write). Stale data window.

---

### Read-Through
Cache sits in front of DB. On miss, cache fetches from DB automatically.

```
Client → Cache → (on miss) → DB
             ← (populate) ←
```

**Used by:** Redis with read-through plugins, Hibernate 2nd level cache.

---

### Write-Through
Every write goes to cache AND DB synchronously.

**Pros:** Cache always fresh.  
**Cons:** Write latency doubles. Cache polluted with rarely-read data.

---

### Write-Behind (Write-Back)
Write to cache first, async flush to DB.

**Pros:** Low write latency.  
**Cons:** Risk of data loss if cache dies before flush.

---

## Cache Invalidation Strategies

| Strategy | When to Use |
|---|---|
| **TTL-based expiry** | Tolerable staleness (e.g., product catalog, user profiles) |
| **Event-driven invalidation** | Strong freshness needed (publish invalidation event on write) |
| **Write-through** | Low write volume, always-fresh requirement |
| **Cache versioning** | Deployments, bulk invalidation |

### Event-Driven Invalidation with Spring + Kafka
```java
// On write, publish invalidation event
@Transactional
public User updateUser(Long id, UpdateUserRequest req) {
    User user = repo.save(mapper.toEntity(req));
    eventPublisher.publish(new UserUpdatedEvent(id));
    return user;
}

// Consumer invalidates cache
@KafkaListener(topics = "user-updated")
public void onUserUpdated(UserUpdatedEvent event) {
    redis.delete("user:" + event.getUserId());
}
```

---

## Read Replicas

### When to Use
- Read QPS exceeds primary DB capacity
- Reporting / analytics queries that are slow and shouldn't hit primary
- Geo-distributed reads

### Architecture
```
Writes → Primary DB
               ↓ (replication lag: ms to seconds)
Reads  ← Replica 1
Reads  ← Replica 2
Reads  ← Replica 3
```

### Replication Lag Considerations
- **Problem**: Read-your-own-writes consistency broken
- **Solution**: Route writes and immediate reads to primary; background/stale reads to replicas
- **Spring Data JPA**: Use `@Transactional(readOnly = true)` + datasource routing

```java
@Configuration
public class DataSourceRoutingConfig {
    // Route readOnly transactions to replica DataSource
    // Route write transactions to primary DataSource
}
```

---

## CDN (Content Delivery Network)

### What to Cache on CDN
| Content Type | TTL |
|---|---|
| Images, videos | Days to weeks |
| CSS, JS bundles | Long (with cache-busting via hash) |
| API responses (public) | Seconds to minutes |
| User-specific data | **Never** (use private Cache-Control) |

### Cache-Control Headers
```
Cache-Control: public, max-age=86400          # CDN + browser cache for 1 day
Cache-Control: private, no-store              # Never cache (user-specific)
Cache-Control: public, s-maxage=60, max-age=0 # CDN caches 60s, browser doesn't
```

---

## CQRS (Command Query Responsibility Segregation)

Separate read model from write model.

```
Write side: Command → Aggregate → Domain Events → Write DB
                                       ↓
Read side:                      Projection → Read DB (optimized for queries)
                                               ↑
                                            Queries
```

### When to Use CQRS
- Read model needs different shape than write model
- Read and write scale independently
- Complex query requirements (search, aggregations)

### Spring Example (simplified)
```java
// Command side
@CommandHandler
public void handle(CreateOrderCommand cmd) {
    Order order = new Order(cmd.getId(), cmd.getItems());
    orderRepository.save(order);
    eventBus.publish(new OrderCreatedEvent(order));
}

// Query side (separate read model)
@EventHandler
public void on(OrderCreatedEvent event) {
    OrderSummaryView view = mapper.toView(event);
    readModelRepository.save(view); // Denormalized, query-optimized
}

@QueryHandler
public OrderSummaryView handle(GetOrderQuery query) {
    return readModelRepository.findById(query.getOrderId());
}
```

---

## Database Read Optimization

### Indexing
```sql
-- Composite index for common query pattern
CREATE INDEX idx_user_feed ON posts(user_id, created_at DESC);

-- Partial index for active records only
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- Covering index (includes all columns needed)
CREATE INDEX idx_post_cover ON posts(user_id, created_at, title, preview);
```

### Query Optimization
- Use `EXPLAIN ANALYZE` to detect seq scans
- Avoid `SELECT *`
- Use pagination with keyset (cursor) instead of OFFSET for large datasets

```sql
-- Keyset pagination (fast even at page 10,000)
SELECT * FROM posts
WHERE (user_id, created_at) < (:lastUserId, :lastCreatedAt)
ORDER BY created_at DESC
LIMIT 20;
```

---

## Fan-Out Strategies (Social Feed Example)

| Strategy | How | Pros | Cons |
|---|---|---|---|
| **Fan-out on write** | Pre-compute feed on each post | Fast read | Expensive for celebrity users |
| **Fan-out on read** | Merge timelines at read time | Correct for any follower count | Slow read at scale |
| **Hybrid** | Fan-out on write for regular users, on read for celebrities | Best of both | Complex |

---

## Interview Questions

1. Your read QPS grows to 100,000. What do you do?
2. How does cache invalidation work, and why is it considered hard?
3. What's the difference between cache-aside and read-through caching?
4. How do you handle the thundering herd problem on cache expiry?
5. When would you use CQRS? What are its downsides?
6. How do you ensure read-your-own-writes consistency when using read replicas?
7. What is replication lag and how does it affect your design choices?
8. How do you paginate efficiently over millions of records?
