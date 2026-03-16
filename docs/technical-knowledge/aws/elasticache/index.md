---
id: index
title: Amazon ElastiCache
sidebar_label: "⚡ ElastiCache"
description: >
  Amazon ElastiCache for DVA-C02. Redis vs Memcached comparison, caching
  strategies (lazy loading, write-through, session store), cluster modes,
  Multi-AZ, and common exam patterns.
tags:
  - elasticache
  - redis
  - memcached
  - caching
  - session-store
  - dva-c02
  - domain-1
---

# Amazon ElastiCache

> **Core concept**: ElastiCache is a managed in-memory data store — dramatically reduces database load and latency.

---

## Redis vs Memcached

| Feature | Redis | Memcached |
|---|---|---|
| **Data structures** | Strings, Lists, Sets, Sorted Sets, Hashes, Streams | Strings only |
| **Persistence** | ✅ RDB snapshots + AOF | ❌ |
| **Replication** | ✅ Multi-AZ with failover | ❌ |
| **Cluster mode** | ✅ Sharding across 500 nodes | ✅ Multi-threaded |
| **Pub/Sub** | ✅ | ❌ |
| **Sorted Sets** | ✅ (leaderboards) | ❌ |
| **Sessions** | ✅ | ✅ |
| **Use case** | Most use cases | Simple horizontal scaling |

:::tip Exam rule
**Redis** = exam's preferred answer for almost everything:
- Need **persistence** → Redis
- Need **replication/Multi-AZ** → Redis
- Need **session store with HA** → Redis
- Need **leaderboard / sorted data** → Redis
- Need **pub/sub** → Redis

**Memcached** = simple, multi-threaded, pure caching, no persistence
:::

---

## Caching Strategies

### 1. Lazy Loading (Cache-Aside)

```
App → Cache? 
        ├── HIT → Return data ✅
        └── MISS → Query DB → Write to Cache → Return data
```

```java
// Spring Boot with Redis (Spring Data Redis)
@Service
public class ProductService {

    @Autowired
    private StringRedisTemplate redis;
    @Autowired
    private ProductRepository db;

    public Product getProduct(String id) {
        String cached = redis.opsForValue().get("product:" + id);
        if (cached != null) {
            return objectMapper.readValue(cached, Product.class);  // Cache HIT
        }
        
        Product product = db.findById(id);           // Cache MISS → DB
        redis.opsForValue().set(                      // Populate cache
            "product:" + id,
            objectMapper.writeValueAsString(product),
            Duration.ofMinutes(10)
        );
        return product;
    }
}
```

**Pros**: Only caches requested data, resilient to cache failures  
**Cons**: Cache miss penalty (3 round trips), possible stale data

### 2. Write-Through

```
Write → Update DB → Update Cache
```

**Pros**: Cache always fresh, no stale reads  
**Cons**: Write penalty, unused data wastes cache memory

### 3. Session Store

```java
// Spring Session with Redis — distributed sessions
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800)
public class SessionConfig {}

// In application.properties:
// spring.session.store-type=redis
// spring.data.redis.host=your-elasticache-endpoint
```

All sessions stored in Redis → horizontally scalable stateless app servers.

---

## TTL (Time-To-Live)

```java
// Set key with 5-minute TTL
redis.opsForValue().set("rate-limit:user-123", "100", Duration.ofMinutes(5));

// TTL expires → key deleted → no memory leak
```

---

## Cluster Modes

| Mode | Description |
|---|---|
| **Redis Standalone** | Single node, no HA |
| **Redis with Replicas** | Primary + up to 5 read replicas, Multi-AZ |
| **Redis Cluster Mode** | Sharding — data split across multiple shards, each with replicas |

---

## Security

- **Encryption in-transit**: TLS
- **Encryption at-rest**: KMS
- **AUTH**: Redis token-based auth
- **VPC**: Deploy inside VPC — not publicly accessible

---

## DAX vs ElastiCache

| | DAX | ElastiCache |
|---|---|---|
| **Works with** | DynamoDB only | Any database/API |
| **Setup** | Replace DynamoDB client with DAX client | Manual caching logic |
| **Consistency** | Eventually consistent for reads | You control |
| **Use case** | Drop-in DynamoDB cache | General-purpose cache |

---

## 🧪 Practice Questions

**Q1.** An application needs a caching layer with **automatic failover** across Availability Zones. Which ElastiCache option provides this?

A) Memcached with multiple nodes  
B) Redis with a primary node only  
C) Redis with **Multi-AZ and at least one replica**  
D) Memcached with Multi-AZ  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Redis supports **Multi-AZ with automatic failover**. When the primary fails, a replica is promoted. Memcached doesn't support replication or failover.
</details>

---

**Q2.** A gaming app needs a real-time **leaderboard** sorted by score. Which cache data structure is ideal?

A) Redis String  
B) Redis List  
C) Redis **Sorted Set**  
D) Memcached  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Redis **Sorted Sets** (`ZADD`, `ZRANGE`, `ZRANK`) are purpose-built for leaderboards — elements sorted by score, O(log N) inserts and range queries.
</details>

---

**Q3.** An application's RDS database is under heavy read load. The team adds ElastiCache with **lazy loading**. A user updates their profile and reads it — they get the old data. What happened?

A) ElastiCache replication lag  
B) Stale cache — lazy loading doesn't update cache on writes  
C) RDS Multi-AZ failover  
D) Cache TTL expired  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **Lazy loading only populates the cache on reads** — writes go directly to the database. The cache has the old value until TTL expires or the key is explicitly invalidated. Fix: also update/invalidate the cache key on writes, or use write-through.
</details>

---

## 🔗 Resources

- [ElastiCache for Redis User Guide](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/)
- [Spring Data Redis](https://docs.spring.io/spring-data/redis/docs/current/reference/html/)
- [Spring Session with Redis](https://docs.spring.io/spring-session/docs/current/reference/html5/guides/java-redis.html)
- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)
