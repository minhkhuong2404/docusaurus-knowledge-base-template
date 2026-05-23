---
id: scaling-reads
title: Scaling Reads
sidebar_label: Scaling Reads
description: Strategies for handling high read QPS including caching layers, read replicas, CDN, CQRS, and database indexing. Covers Redis patterns, cache invalidation, and fan-out strategies.
tags: [scaling, reads, caching, redis, cdn, cqrs, read-replicas, performance]
---

# Scaling Reads

> Read-heavy systems (>80% reads) need different strategies than write-heavy ones. The goal: **serve data without hitting the primary database**.

## Table of Contents

- [Strategy Hierarchy (Fastest to Slowest)](#strategy-hierarchy-fastest-to-slowest)
- [Caching Strategies](#caching-strategies)
  - [Cache-Aside (Lazy Loading)](#cache-aside-lazy-loading)
  - [Read-Through](#read-through)
  - [Write-Through](#write-through)
  - [Write-Behind (Write-Back)](#write-behind-write-back)
- [Cache Invalidation Strategies](#cache-invalidation-strategies)
  - [TTL-Based Expiry](#ttl-based-expiry)
  - [Event-Driven Invalidation](#event-driven-invalidation)
  - [Write-Through Invalidation]((#write-through-invalidation)
  - [Cache Versioning](#cache-versioning)
- [Read Replicas](#read-replicas)
  - [When to Use](#when-to-use)
  - [Architecture](#architecture)
  - [Replication Lag Considerations](#replication-lag-considerations)
  - [Read Replica Routing](#read-replica-routing)
- [CDN (Content Delivery Network)](#cdn-content-delivery-network)
  - [What to Cache on CDN](#what-to-cache-on-cdn)
  - [Cache-Control Headers](#cache-control-headers)
  - [CDN Edge Computing](#cdn-edge-computing)
  - [CDN Caching Strategies](#cdn-caching-strategies)
- [CQRS (Command Query Responsibility Segregation)](#cqrs-command-query-responsibility-segregation)
  - [When to Use CQRS](#when-to-use-cqrs)
  - [CQRS Architecture](#cqrs-architecture)
  - [Spring Example](#spring-example)
  - [Event Sourcing Integration](#event-sourcing-integration)
- [Database Read Optimization](#database-read-optimization)
  - [Indexing](#indexing)
  - [Query Optimization](#query-optimization)
  - [Materialized Views](#materialized-views)
  - [Denormalization](#denormalization)
- [Fan-Out Strategies (Social Feed Example)](#fan-out-strategies-social-feed-example)
  - [Fan-Out on Write](#fan-out-on-write)
  - [Fan-Out on Read](#fan-out-on-read)
  - [Hybrid Approach](#hybrid-approach)
- [How Read Scaling Works Internally](#how-read-scaling-works-internally)
  - [Cache Storage Structures](#cache-storage-structures)
  - [Replication Mechanisms](#replication-mechanisms)
  - [Load Balancing](#load-balancing)
  - [Connection Pooling](#connection-pooling)
- [Real-World Implementations](#real-world-implementations)
  - [Twitter](#twitter)
  - [Facebook](#facebook)
  - [Instagram](#instagram)
  - [Netflix](#netflix)
- [Integration Patterns](#integration-patterns)
  - [Spring Cache Integration](#spring-cache-integration)
  - [Redis Integration](#redis-integration)
  - [CDN Integration](#cdn-integration)
- [Pros and Cons](#pros-and-cons)
  - [Caching](#caching)
  - [Read Replicas](#read-replicas)
  - [CDN](#cdn)
  - [CQRS](#cqrs)
- [Interview Questions](#interview-questions)
- [Senior Deep Dive: Advanced Topics](#senior-deep-dive-advanced-topics)
  - [Multi-Level Caching](#multi-level-caching)
  - [Cache Coherence](#cache-coherence)
  - [Read-Your-Writes Consistency](#read-your-writes-consistency)
  - [Consistent Hashing for Caching](#consistent-hashing-for-caching)
  - [Edge Computing](#edge-computing)
  - [Server-Side Rendering](#server-side-rendering)
- [Additional Resources](#additional-resources)
- [Best Practices](#best-practices)

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

### Read-Through

Cache sits in front of DB. On miss, cache fetches from DB automatically.

```
Client → Cache → (on miss) → DB
             ← (populate) ←
```

**Used by:** Redis with read-through plugins, Hibernate 2nd level cache.

```java
public class ReadThroughCache<K, V> {
    private final Cache<K, V> cache;
    private final Function<K, V> loader;

    public V get(K key) {
        V value = cache.getIfPresent(key);
        if (value == null) {
            value = loader.apply(key);
            cache.put(key, value);
        }
        return value;
    }
}
```

### Write-Through

Every write goes to cache AND DB synchronously.

**Pros:** Cache always fresh.  
**Cons:** Write latency doubles. Cache polluted with rarely-read data.

```java
@Service
public class WriteThroughCacheService {
    private final Cache<String, Object> cache;
    private final DatabaseService databaseService;

    public void put(String key, Object value) {
        // Write to cache first
        cache.put(key, value);

        // Write to database synchronously
        databaseService.save(key, value);
    }
}
```

### Write-Behind (Write-Back)

Write to cache first, async flush to DB.

**Pros:** Low write latency.  
**Cons:** Risk of data loss if cache dies before flush.

```java
@Service
public class WriteBehindCacheService {
    private final Cache<String, Object> cache;
    private final DatabaseService databaseService;
    private final ScheduledExecutorService executor;

    @PostConstruct
    public void init() {
        // Schedule periodic flush
        executor.scheduleAtFixedRate(
            this::flushToDatabase,
            1, 1, TimeUnit.MINUTES
        );
    }

    public void put(String key, Object value) {
        cache.put(key, value);
    }

    private void flushToDatabase() {
        // Flush all cached items to database
        cache.asMap().forEach((key, value) -> {
            databaseService.save(key, value);
        });
    }
}
```

---

## Cache Invalidation Strategies

| Strategy | When to Use |
|---|---|
| **TTL-based expiry** | Tolerable staleness (e.g., product catalog, user profiles) |
| **Event-driven invalidation** | Strong freshness needed (publish invalidation event on write) |
| **Write-through** | Low write volume, always-fresh requirement |
| **Cache versioning** | Deployments, bulk invalidation |

### TTL-Based Expiry

```java
@Service
public class TtlCacheService {
    private final Cache<String, Object> cache;

    public Object get(String key) {
        return cache.getIfPresent(key);
    }

    public void put(String key, Object value, Duration ttl) {
        cache.put(key, value);
        // Schedule expiration
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
        executor.schedule(() -> cache.invalidate(key), ttl.toMillis(), TimeUnit.MILLISECONDS);
    }
}
```

### Event-Driven Invalidation

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

### Write-Through Invalidation

```java
@Service
public class WriteThroughInvalidationService {
    private final Cache<String, Object> cache;
    private final DatabaseService databaseService;

    public void update(String key, Object value) {
        // Update database
        databaseService.update(key, value);

        // Invalidate cache
        cache.invalidate(key);
    }
}
```

### Cache Versioning

```java
@Service
public class CacheVersioningService {
    private final Cache<String, Object> cache;
    private final AtomicLong version = new AtomicLong(0);

    public void invalidateAll() {
        version.incrementAndGet();
    }

    public Object get(String key) {
        String versionedKey = key + ":" + version.get();
        return cache.getIfPresent(versionedKey);
    }

    public void put(String key, Object value) {
        String versionedKey = key + ":" + version.get();
        cache.put(versionedKey, value);
    }
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

@Service
public class UserService {
    @Transactional(readOnly = true)
    public User getUser(Long id) {
        // Routes to replica
        return userRepository.findById(id).orElseThrow();
    }

    @Transactional
    public User updateUser(Long id, UpdateUserRequest req) {
        // Routes to primary
        User user = userRepository.findById(id).orElseThrow();
        user.update(req);
        return userRepository.save(user);
    }
}
```

### Read Replica Routing

```java
public class ReplicaRoutingDataSource extends AbstractRoutingDataSource {
    private static final ThreadLocal<Boolean> readOnly = new ThreadLocal<>();

    public static void setReadOnly(boolean value) {
        readOnly.set(value);
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return readOnly.get() ? "replica" : "primary";
    }
}

@Service
public class UserService {
    @Transactional(readOnly = true)
    public User getUser(Long id) {
        ReplicaRoutingDataSource.setReadOnly(true);
        try {
            return userRepository.findById(id).orElseThrow();
        } finally {
            ReplicaRoutingDataSource.setReadOnly(false);
        }
    }
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

### CDN Edge Computing

```java
// Cloudflare Workers example
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Check if request is for API
  if (url.pathname.startsWith('/api/')) {
    // Process at edge
    const response = await fetch(request)
    const data = await response.json()

    // Add custom headers
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    })
  }

  // Default behavior
  return fetch(request)
}
```

### CDN Caching Strategies

```java
@Configuration
public class CdnConfig {

    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler("/static/**")
                    .addResourceLocations("classpath:/static/")
                    .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS));
            }
        };
    }
}

@RestController
public class ApiController {

    @GetMapping("/api/products")
    public ResponseEntity<List<Product>> getProducts() {
        List<Product> products = productService.getAll();

        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES))
            .body(products);
    }
}
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

### CQRS Architecture

```
┌─────────────────────────────────────────┐
│           Command Side                  │
│                                         │
│  ┌───────────┐    ┌───────────┐        │
│  │ Commands  │ →  │ Aggregates│ → Events│
│  └───────────┘    └───────────┘        │
└─────────────────────────────────────────┘
                    │
                    ↓ Events
┌─────────────────────────────────────────┐
│           Event Bus                     │
└─────────────────────────────────────────┘
                    │
                    ↓ Events
┌─────────────────────────────────────────┐
│           Query Side                    │
│                                         │
│  ┌───────────┐    ┌───────────┐        │
│  │ Projections│ → │ Read Model│ ← Queries│
│  └───────────┘    └───────────┘        │
└─────────────────────────────────────────┘
```

### Spring Example

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

### Event Sourcing Integration

```java
@Service
public class OrderService {
    private final EventStore eventStore;
    private final EventBus eventBus;

    public Order createOrder(CreateOrderCommand cmd) {
        Order order = new Order(cmd.getId());
        order.create(cmd.getItems());

        List<DomainEvent> events = order.getUncommittedEvents();
        eventStore.save(order.getId(), events);

        events.forEach(eventBus::publish);

        return order;
    }
}

@Service
public class OrderProjection {
    private final OrderViewRepository viewRepository;

    @EventHandler
    public void on(OrderCreatedEvent event) {
        OrderView view = new OrderView();
        view.setId(event.getOrderId());
        view.setStatus(OrderStatus.CREATED);
        view.setItems(event.getItems());
        viewRepository.save(view);
    }

    @EventHandler
    public void on(OrderCancelledEvent event) {
        OrderView view = viewRepository.findById(event.getOrderId());
        view.setStatus(OrderStatus.CANCELLED);
        viewRepository.save(view);
    }
}
```

---

## Database Read Optimization

### Indexing

:::info[Deep Dive: Database Indexing]
For a comprehensive guide on B-Trees, LSM-Trees, Composite Indexes, Partial Indexes, and Query Optimization, see the **[Database Indexing Deep Dive](../database/indexing-query-optimization.md)** page.
:::

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

### Materialized Views

```sql
-- Create materialized view for expensive aggregations
CREATE MATERIALIZED VIEW user_stats AS
SELECT
    user_id,
    COUNT(*) as post_count,
    MAX(created_at) as last_post_at
FROM posts
GROUP BY user_id;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW user_stats;

-- Concurrent refresh (doesn't block reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

### Denormalization

```sql
-- Instead of joining tables every time
SELECT u.name, p.title, p.created_at
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.id = 123;

-- Denormalize for faster reads
CREATE TABLE user_posts (
    user_id BIGINT,
    user_name VARCHAR(255),
    post_title VARCHAR(255),
    post_created_at TIMESTAMP,
    PRIMARY KEY (user_id, post_created_at)
);

-- Simple query
SELECT user_name, post_title, post_created_at
FROM user_posts
WHERE user_id = 123
ORDER BY post_created_at DESC;
```

---

## Fan-Out Strategies (Social Feed Example)

| Strategy | How | Pros | Cons |
|---|---|---|---|
| **Fan-out on write** | Pre-compute feed on each post | Fast read | Expensive for celebrity users |
| **Fan-out on read** | Merge timelines at read time | Correct for any follower count | Slow read at scale |
| **Hybrid** | Fan-out on write for regular users, on read for celebrities | Best of both | Complex |

### Fan-Out on Write

```java
@Service
public class FanOutOnWriteService {
    private final FeedRepository feedRepository;
    private final FollowerRepository followerRepository;

    @Async
    public void onPostCreated(PostCreatedEvent event) {
        Post post = event.getPost();
        List<Long> followerIds = followerRepository.findByFollowedId(post.getUserId());

        // Pre-compute feed for all followers
        for (Long followerId : followerIds) {
            FeedItem item = new FeedItem(followerId, post.getId(), post.getCreatedAt());
            feedRepository.save(item);
        }
    }
}
```

### Fan-Out on Read

```java
@Service
public class FanOutOnReadService {
    private final PostRepository postRepository;
    private final FollowerRepository followerRepository;

    public List<Post> getFeed(Long userId, int limit, int offset) {
        List<Long> followedIds = followerRepository.findFollowedIds(userId);

        // Merge posts from all followed users at read time
        return postRepository.findByUserIdsIn(followedIds, limit, offset);
    }
}
```

### Hybrid Approach

```java
@Service
public class HybridFanOutService {
    private static final int CELEBRITY_THRESHOLD = 10000;

    @Async
    public void onPostCreated(PostCreatedEvent event) {
        Post post = event.getPost();
        int followerCount = followerRepository.countByFollowedId(post.getUserId());

        if (followerCount < CELEBRITY_THRESHOLD) {
            // Fan-out on write for regular users
            fanOutOnWrite(event);
        } else {
            // Fan-out on read for celebrities
            // No action needed
        }
    }

    public List<Post> getFeed(Long userId, int limit, int offset) {
        List<Long> followedIds = followerRepository.findFollowedIds(userId);

        // Check if any followed user is a celebrity
        boolean hasCelebrity = followedIds.stream()
            .anyMatch(id -> followerRepository.countByFollowedId(id) >= CELEBRITY_THRESHOLD);

        if (hasCelebrity) {
            // Fan-out on read for celebrity posts
            return fanOutOnRead(userId, limit, offset);
        } else {
            // Read from pre-computed feed
            return feedRepository.findByUserId(userId, limit, offset);
        }
    }
}
```

---

## How Read Scaling Works Internally

### Cache Storage Structures

```java
// LRU Cache implementation
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
```

### Replication Mechanisms

```
Primary DB:
1. Receive write request
2. Write to WAL (Write-Ahead Log)
3. Apply change to data files
4. Send replication stream to replicas

Replica DB:
1. Receive replication stream
2. Apply changes in order
6. Update replication position
```

### Load Balancing

```java
@Configuration
public class LoadBalancerConfig {

    @Bean
    public LoadBalancerClient loadBalancerClient() {
        return new RoundRobinLoadBalancer();
    }
}

@Service
public class DatabaseService {
    private final LoadBalancerClient loadBalancerClient;
    private final List<DataSource> replicaDataSources;

    public DataSource getReadDataSource() {
        // Load balance across replicas
        ServiceInstance instance = loadBalancerClient.choose("replicas");
        return replicaDataSources.get(instance.getIndex());
    }
}
```

### Connection Pooling

```yaml
# application.yml — HikariCP (Spring Boot default)
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 3000    # 3s max wait for connection
      idle-timeout: 600000        # 10 min
      max-lifetime: 1800000       # 30 min
```

---

## Real-World Implementations

### Twitter

Twitter uses a multi-layer caching strategy:
- **Redis**: For timeline caching
- **Memcached**: For user profile caching
- **CDN**: For static assets
- **Fan-out on write**: For regular users
- **Fan-out on read**: For celebrity users

### Facebook

Facebook's read scaling strategy:
- **Tao**: Graph database for social graph
- **Memcached**: Distributed caching layer
- **MySQL**: Persistent storage
- **HBase**: For messaging and notifications
- **CDN**: For static content

### Instagram

Instagram's read scaling approach:
- **Redis**: For feed caching
- **PostgreSQL**: For persistent storage
- **Cassandra**: For time-series data
- **CDN**: For image delivery
- **Elasticsearch**: For search

### Netflix

Netflix's read scaling strategy:
- **Cassandra**: For user data
- **Elasticsearch**: For search
- **Redis**: For caching
- **S3 + CloudFront**: For content delivery
- **Zuul**: For API gateway and caching

---

## Integration Patterns

### Spring Cache Integration

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

### Redis Integration

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}

@Service
public class CacheService {
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

### CDN Integration

```java
@Configuration
public class CdnConfig {

    @Bean
    public CloudFrontClient cloudFrontClient() {
        return CloudFrontClient.builder()
            .region(Region.US_EAST_1)
            .build();
    }
}

@Service
public class CdnService {
    private final CloudFrontClient cloudFrontClient;

    public void invalidateCache(String distributionId, List<String> paths) {
        CreateInvalidationRequest request = CreateInvalidationRequest.builder()
            .distributionId(distributionId)
            .invalidationBatch(InvalidationBatch.builder()
                .paths(Paths.builder()
                    .items(paths)
                    .quantity(paths.size())
                    .build())
                .callerReference(UUID.randomUUID().toString())
                .build())
            .build();

        cloudFrontClient.createInvalidation(request);
    }
}
```

---

## Pros and Cons

### Caching

**Pros:**
- Dramatically reduces database load
- Improves response times
- Scales horizontally
- Reduces costs

**Cons:**
- Adds complexity
- Risk of stale data
- Cache invalidation challenges
- Additional infrastructure

### Read Replicas

**Pros:**
- Scales read workload
- Improves read performance
- Enables geo-distribution
- Reduces primary load

**Cons:**
- Replication lag
- Eventual consistency
- Additional infrastructure
- Complex routing

### CDN

**Pros:**
- Reduces latency
- Handles high traffic
- Offloads origin server
- Global distribution

**Cons:**
- Limited to cacheable content
- Cache invalidation delay
- Additional cost
- Limited control

### CQRS

**Pros:**
- Optimizes read and write independently
- Enables complex queries
- Scales read and write separately
- Clear separation of concerns

**Cons:**
- Increased complexity
- Eventual consistency
- Duplicate models
- Higher operational overhead

---

## Interview Questions

### Q: Your read QPS grows to 100,000. What do you do?

**A:** Add multi-layer caching (CDN, app cache, DB cache), offload reads to replicas/search stores, and optimize hot queries/indexes. Scale horizontally with load balancing and protect backends with rate limits.

### Q: How does cache invalidation work, and why is it considered hard?

**A:** Invalidation removes or refreshes stale cache entries when source data changes. It is hard because race conditions, distributed delays, and partial failures can serve stale or inconsistent data.

### Q: What's the difference between cache-aside and read-through caching?

**A:** Cache-aside lets application code read DB on miss and then populate cache; read-through delegates miss handling to cache layer. Cache-aside is flexible; read-through centralizes cache behavior.

### Q: How do you handle the thundering herd problem on cache expiry?

**A:** Use jittered TTL, request coalescing/single-flight, and stale-while-revalidate. Warm critical keys proactively before synchronized expiry.

### Q: When would you use CQRS? What are its downsides?

**A:** Use CQRS when read and write workloads diverge significantly and need different models/scaling paths. Downsides are eventual consistency, duplicate models, and higher operational complexity.

### Q: How do you ensure read-your-own-writes consistency when using read replicas?

**A:** After a write, route that user's reads to primary for a bounded time or until replica catches up to a tracked LSN/timestamp. Sticky sessions or client tokens can enforce this.

### Q: What is replication lag and how does it affect your design choices?

**A:** Replication lag is delay between primary commit and replica visibility. It influences UX guarantees, read routing, and whether you need primary reads for freshness-sensitive endpoints.

### Q: How do you paginate efficiently over millions of records?

**A:** Prefer keyset/cursor pagination on indexed sort keys instead of large offsets. It keeps query cost stable and avoids duplicate/missing rows during concurrent writes.

### Q: What is the difference between materialized views and regular views?

**A:** Materialized views store the result of a query physically and must be refreshed, while regular views are virtual and execute the underlying query each time. Materialized views are faster but require maintenance.

### Q: How do you design a caching strategy for a social media feed?

**A:** Use multi-level caching with CDN for static content, Redis for user feeds, and database for persistence. Implement fan-out on write for regular users and fan-out on read for celebrities. Use cache invalidation on updates.

### Q: What are the trade-offs between fan-out on write and fan-out on read?

**A:** Fan-out on write provides fast reads but expensive writes, especially for users with many followers. Fan-out on read provides cheap writes but expensive reads. Hybrid approach balances both.

### Q: How do you handle cache stampede in a high-traffic system?

**A:** Implement request coalescing, use probabilistic early expiration, add jitter to TTL values, and pre-warm critical cache entries before they expire.

### Q: What is the role of CDN in read scaling?

**A:** CDN caches content at edge locations close to users, reducing latency and load on origin servers. It's essential for static assets and can cache API responses for public data.

### Q: How do you optimize database queries for high read throughput?

**A:** Create appropriate indexes, use covering indexes, avoid SELECT *, implement pagination with keyset cursors, use materialized views for complex queries, and denormalize data when appropriate.

### Q: What is the difference between read-through and write-through caching?

**A:** Read-through cache loads data from database on miss, while write-through cache updates both cache and database synchronously on write. Read-through is for reads, write-through is for writes.

### Q: How do you design a multi-level caching strategy?

**A:** Use L1 in-process cache for ultra-fast access, L2 distributed cache for shared access, and CDN for edge caching. Implement cache coherence and appropriate TTL at each level.

### Q: What are the challenges of maintaining cache consistency across multiple nodes?

**A:** Cache consistency requires coordination mechanisms, invalidation messages, versioning, and handling network partitions. Use event-driven invalidation and consider eventual consistency.

### Q: How do you monitor and tune cache performance?

**A:** Track hit rate, miss rate, eviction rate, and response times. Analyze access patterns, adjust cache size and TTL, and implement cache warming for popular items.

---

## Senior Deep Dive: Advanced Topics

### Multi-Level Caching

```java
@Service
public class MultiLevelCacheService {
    private final Cache<String, Object> l1Cache; // In-memory
    private final RedisTemplate<String, Object> l2Cache; // Redis
    private final DatabaseService databaseService;

    public Object get(String key) {
        // Check L1 cache first
        Object value = l1Cache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // Check L2 cache
        value = l2Cache.opsForValue().get(key);
        if (value != null) {
            // Populate L1 cache
            l1Cache.put(key, value);
            return value;
        }

        // Load from database
        value = databaseService.load(key);

        // Populate both caches
        l1Cache.put(key, value);
        l2Cache.opsForValue().set(key, value, Duration.ofHours(1));

        return value;
    }
}
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

### Read-Your-Writes Consistency

```java
@Service
public class ReadYourWritesService {
    private final Cache<String, Long> writeTimestamps;
    private final DatabaseService databaseService;

    public void write(String key, Object value) {
        databaseService.save(key, value);
        writeTimestamps.put(key, System.currentTimeMillis());
    }

    public Object read(String key) {
        Long writeTime = writeTimestamps.getIfPresent(key);

        if (writeTime != null) {
            // Read from primary for consistency
            return databaseService.loadFromPrimary(key);
        } else {
            // Read from replica
            return databaseService.loadFromReplica(key);
        }
    }
}
```

### Consistent Hashing for Caching

```java
public class ConsistentHashCache<K, V> {
    private final TreeMap<Long, CacheNode> ring = new TreeMap<>();
    private final int virtualNodes;

    public ConsistentHashCache(List<CacheNode> nodes, int virtualNodes) {
        this.virtualNodes = virtualNodes;

        for (CacheNode node : nodes) {
            for (int i = 0; i < virtualNodes; i++) {
                long hash = hash(node.getId() + ":" + i);
                ring.put(hash, node);
            }
        }
    }

    public CacheNode getNode(K key) {
        long hash = hash(key.toString());
        Map.Entry<Long, CacheNode> entry = ring.ceilingEntry(hash);

        if (entry == null) {
            entry = ring.firstEntry();
        }

        return entry.getValue();
    }

    private long hash(String key) {
        // Use consistent hash function
        return Hashing.consistentHash(key.hashCode(), ring.size());
    }
}
```

### Edge Computing

```java
// Cloudflare Workers example
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Check if request is for API
  if (url.pathname.startsWith('/api/')) {
    // Process at edge
    const cacheKey = `api:${url.pathname}`

    // Check cache
    const cached = await caches.match(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from origin
    const response = await fetch(request)

    // Cache response
    const cache = await caches.open('api-cache')
    await cache.put(cacheKey, response.clone())

    return response
  }

  // Default behavior
  return fetch(request)
}
```

### Server-Side Rendering

```java
@Controller
public class PageController {

    @GetMapping("/products/{id}")
    public String getProductPage(@PathVariable Long id, Model model) {
        Product product = productService.getProduct(id);

        model.addAttribute("product", product);

        // Cache the rendered page
        return "product-page";
    }
}

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(1000));
        return cacheManager;
    }
}
```

---

## Additional Resources

### Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "High Performance MySQL" by Baron Schwartz
- "Redis in Action" by Josiah L. Carlson

### Papers
- "The Google File System" by Sanjay Ghemawat
- "Dynamo: Amazon's Highly Available Key-value Store" by DeCandia et al.

### Tools
- **Redis**: In-memory data structure store
- **Memcached**: Distributed memory object caching
- **Varnish**: HTTP accelerator
- **CloudFront**: AWS CDN
- **Fastly**: Edge cloud platform

### Standards
- **HTTP Caching**: RFC 7234
- **CDN Interconnect**: RFC 7686

---

## Best Practices

### Cache Design
1. Choose appropriate cache strategy for your use case
2. Implement proper cache invalidation
3. Use appropriate TTL values
4. Monitor cache performance
5. Plan for cache failures

### Read Replica Management
1. Monitor replication lag
2. Implement proper routing
3. Handle replica failures
4. Use connection pooling
5. Optimize read queries

### CDN Configuration
1. Set appropriate cache headers
2. Implement cache invalidation
3. Use edge computing when appropriate
4. Monitor CDN performance
5. Optimize content delivery

### CQRS Implementation
1. Separate read and write models
2. Use events for synchronization
3. Implement proper projections
4. Handle eventual consistency
5. Monitor system performance

### Database Optimization
1. Create appropriate indexes
2. Optimize queries
3. Use materialized views
4. Implement denormalization
5. Monitor query performance

### Monitoring
1. Track cache hit rates
2. Monitor replication lag
3. Measure response times
4. Analyze access patterns
5. Set up alerts

### Testing
1. Test cache behavior
2. Test replica failover
3. Test CDN caching
4. Test CQRS consistency
5. Load test the system
