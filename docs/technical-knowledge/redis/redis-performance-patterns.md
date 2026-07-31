---
id: redis-performance-patterns
title: "Redis Performance, Patterns & Production Design"
slug: redis-performance-patterns
description: Advanced Redis patterns — distributed locking, rate limiting, session management, leaderboards, search, and production performance tuning for senior engineers.
tags: [redis, performance, patterns, distributed-lock, rate-limiting, backend]
---

import RedisDistributedLockDiagram from '@site/src/components/RedisDistributedLockDiagram';

# Redis Performance, Patterns & Production Design

<RedisDistributedLockDiagram />

---

## Distributed Lock with Redis

### Single-Node Lock

```bash
# Acquire: atomic SET NX (only sets if key doesn't exist) + EX (auto-release)
SET lock:payment:order123 "owner-uuid-abc" NX EX 30
# Returns OK on success, nil if lock already held

# Release: Lua script ensures only the lock owner can release it
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
```

```java
@Service
public class DistributedLockService {
    private static final String LOCK_SCRIPT = """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        end
        return 0
        """;

    public boolean tryLock(String resource, String owner, Duration ttl) {
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent("lock:" + resource, owner, ttl);
        return Boolean.TRUE.equals(acquired);
    }

    public void unlock(String resource, String owner) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>(LOCK_SCRIPT, Long.class);
        redisTemplate.execute(script, List.of("lock:" + resource), owner);
    }
}
```

### Lock Renewal (Watchdog Pattern)

For long-running operations, renew the lock before it expires:

```java
ScheduledFuture<?> watchdog = scheduler.scheduleAtFixedRate(() -> {
    // Extend TTL if we still own the lock
    String currentOwner = redisTemplate.opsForValue().get("lock:" + resource);
    if (owner.equals(currentOwner)) {
        redisTemplate.expire("lock:" + resource, Duration.ofSeconds(30));
    }
}, 10, 10, TimeUnit.SECONDS);  // Renew every 10s (lock is 30s)

try {
    performLongOperation();
} finally {
    watchdog.cancel(true);
    unlock(resource, owner);
}
```

### Fencing Tokens (for True Linearizability)

Distributed locks with Redis are not perfectly safe — a slow client could hold a lock past TTL while a second client acquires it. Use **fencing tokens** for strict correctness:

```bash
# Lock + monotonic token
SET lock:resource "owner" NX EX 30
INCR lock:resource:fence   # Atomic increment → returns token (e.g., 42)

# Client uses token 42 for all DB operations
# DB rejects writes with token < max seen token
# → Prevents stale client from committing
```

---

## Rate Limiting Patterns

### Fixed Window Counter

```python
def is_allowed(user_id, limit=100, window=60):
    key = f"rate:{user_id}:{int(time.time() / window)}"
    count = redis.incr(key)
    if count == 1:
        redis.expire(key, window)
    return count <= limit
```

**Problem:** Allows 2x limit at window boundaries.

### Sliding Window with Sorted Set

```lua
-- KEYS[1]: rate limit key, ARGV[1]: limit, ARGV[2]: window ms, ARGV[3]: now ms
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count < limit then
    redis.call('ZADD', key, now, now .. '-' .. math.random(1, 1000000))
    redis.call('PEXPIRE', key, window)
    return 1  -- allowed
end
return 0  -- rate limited
```

### Token Bucket (Leaky Bucket)

```lua
-- KEYS[1]: bucket key, ARGV[1]: capacity, ARGV[2]: rate (tokens/sec), ARGV[3]: now
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'last')
local tokens = tonumber(bucket[1]) or capacity
local last = tonumber(bucket[2]) or now

-- Refill based on elapsed time
local elapsed = (now - last) / 1000
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
    redis.call('PEXPIRE', KEYS[1], math.ceil(capacity / rate) * 1000 * 2)
    return 1  -- allowed
end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
return 0  -- rate limited
```

---

## Session Management

```java
// Spring Session + Redis (automatic distributed session management)
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 3600)
public class SessionConfig {
    // Spring automatically serializes HttpSession to Redis
    // Key: spring:session:sessions:{sessionId}
}

// Custom session store with explicit control
@Service
public class SessionService {

    public String createSession(User user) {
        String sessionId = UUID.randomUUID().toString();
        String key = "session:" + sessionId;

        Map<String, String> sessionData = Map.of(
            "userId", user.getId().toString(),
            "username", user.getUsername(),
            "roles", String.join(",", user.getRoles()),
            "createdAt", Instant.now().toString()
        );

        redisTemplate.opsForHash().putAll(key, sessionData);
        redisTemplate.expire(key, Duration.ofHours(24));
        return sessionId;
    }

    public Optional<SessionData> getSession(String sessionId) {
        String key = "session:" + sessionId;
        Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
        if (data.isEmpty()) return Optional.empty();

        // Sliding session: extend TTL on every access
        redisTemplate.expire(key, Duration.ofHours(24));
        return Optional.of(SessionData.from(data));
    }

    public void invalidateSession(String sessionId) {
        redisTemplate.delete("session:" + sessionId);
    }

    // Invalidate all sessions for a user (force logout all devices)
    public void invalidateAllSessions(Long userId) {
        Set<String> sessionIds = redisTemplate.opsForSet()
            .members("user:" + userId + ":sessions");
        redisTemplate.delete(sessionIds.stream()
            .map(id -> "session:" + id)
            .collect(Collectors.toList()));
        redisTemplate.delete("user:" + userId + ":sessions");
    }
}
```

---

## Leaderboard Pattern

```java
@Service
public class LeaderboardService {

    private static final String BOARD_KEY = "game:leaderboard";

    public void submitScore(String playerId, double score) {
        redisTemplate.opsForZSet().add(BOARD_KEY, playerId, score);
    }

    public void incrementScore(String playerId, double delta) {
        redisTemplate.opsForZSet().incrementScore(BOARD_KEY, playerId, delta);
    }

    public Long getRank(String playerId) {
        // ZREVRANK: rank from highest score (0 = top)
        return redisTemplate.opsForZSet().reverseRank(BOARD_KEY, playerId);
    }

    // Top N leaderboard
    public List<LeaderboardEntry> getTopN(int n) {
        Set<ZSetOperations.TypedTuple<String>> entries =
            redisTemplate.opsForZSet().reverseRangeWithScores(BOARD_KEY, 0, n - 1);

        AtomicLong rank = new AtomicLong(1);
        return entries.stream()
            .map(e -> new LeaderboardEntry(rank.getAndIncrement(), e.getValue(), e.getScore()))
            .collect(Collectors.toList());
    }

    // Get player's surrounding context (player + neighbors)
    public List<LeaderboardEntry> getSurroundingContext(String playerId, int radius) {
        Long rank = getRank(playerId);
        long from = Math.max(0, rank - radius);
        long to = rank + radius;
        return getRange(from, to);
    }
}
```

---

## Redis Search (RediSearch / Redis Stack)

Redis Stack extends Redis with full-text search, vector similarity, and JSON documents:

```bash
# Create search index
FT.CREATE product-idx ON JSON PREFIX 1 product:
    SCHEMA $.name AS name TEXT WEIGHT 5.0
           $.price AS price NUMERIC SORTABLE
           $.category AS category TAG
           $.embedding AS embedding VECTOR FLAT 6 TYPE FLOAT32 DIM 384 DISTANCE_METRIC COSINE

# Full-text search
FT.SEARCH product-idx "wireless headphones" LIMIT 0 10

# Filtered search
FT.SEARCH product-idx "@category:{electronics} @price:[100 500]" SORTBY price ASC

# Vector similarity search (semantic search)
FT.SEARCH product-idx "*=>[KNN 10 @embedding $vec AS score]"
    PARAMS 2 vec (query-embedding-bytes)
    SORTBY score LIMIT 0 10

# Aggregations
FT.AGGREGATE product-idx "*"
    GROUPBY 1 @category
    REDUCE COUNT 0 AS count
    REDUCE AVG 1 @price AS avg_price
    SORTBY 2 @count DESC
```

---

## Redis Hot Keys

A **Hot Key** is a specific cache key that receives a disproportionately large share of total requests (extreme QPS). While a high cache hit rate (e.g., 95%–99%) is generally positive, a system can still degrade or fail if those hits are concentrated on a few hot keys.

### Why High Cache Hit Rate is Deceptive

A standard dashboard showing a high cache hit rate only indicates that Redis successfully returned data. It does not measure the distribution of requests or resource consumption per key. A hot key causes bottlenecks through four main mechanisms:

1. **Network Bandwidth Saturation (NIC Bottleneck):**
   If a cached JSON payload is 700 KB (e.g., a detailed homepage layout or product page) and is requested 5,000 times per second, the network throughput required is:
   $$\text{700 KB} \times \text{5,000 req/sec} = 3.5 \text{ GB/sec} \approx 28 \text{ Gbps}$$
   This quickly saturates the network interface card (NIC) of both the Redis node and the application instances, leading to packet drops, TCP retransmissions, and latency spikes.

2. **Redis Single-Threaded CPU Blockage:**
   Redis command execution is single-threaded. If a hot key contains a large collection (Hash, Set, List) and is queried using $O(N)$ operations (like `HGETALL`, `SMEMBERS`, or `LRANGE`), that single command can block the event loop for milliseconds. Because Redis handles all commands sequentially, this blocks all other incoming requests, causing P99 latency to jump and clients to timeout.

3. **Application Deserialization Overhead:**
   Every client instance fetching a large hot key must allocate memory, copy bytes from network buffers, and deserialize the payload (e.g., from raw bytes/JSON to Java Objects). Under high QPS, this causes client-side garbage collection (GC) pressure and high CPU utilization.

4. **Cluster Shard Imbalance (Hot Shards):**
   In a Redis Cluster, keys are distributed across 16,384 hash slots, and each slot belongs to a specific master shard. If traffic is heavily skewed towards one hot key, all requests land on the single shard hosting that key. While the cluster as a whole might show low CPU usage, that single master shard is saturated.

---

### Classification of Hot Keys

| Hot Key Type | Examples | Primary Bottleneck | Primary Mitigation |
| :--- | :--- | :--- | :--- |
| **Small Payload, Extreme QPS** | `feature_flags:global`, `config:maintenance_mode`, `public_key:payment` | Redis client connection limits, network packet overhead. | L1 Near Cache (in-memory JVM cache with short TTL). |
| **Large Payload, High QPS** | `homepage:layout:v2`, `flash_sale:product:98231` | Network bandwidth saturation, application deserialization CPU. | Payload compression, local L1 cache, payload splitting. |
| **Heavy Command on Large Collection** | `HGETALL user:roles:admin`, `SMEMBERS tenant:permissions:active` | Redis single-thread CPU blockage (blocked event loop). | Avoid $O(N)$ commands; use `HSCAN`/`HMGET`/`HGET` or separate String keys. |

---

### Detection and Monitoring

To locate hot keys on production systems:

1. **Redis Stats (`redis-cli INFO stats`):**
   Monitor `total_net_output_bytes` and `instantaneous_ops_per_sec`. A sharp rise in output bandwidth with static CPU/memory points to heavy reads on large keys.

2. **Command Stats (`redis-cli INFO commandstats`):**
   Look at `usec_per_call` for commands like `hgetall`, `smembers`, and `lrange`. If these show high average times, check which keys they query.

3. **Slow Log (`redis-cli SLOWLOG GET 20`):**
   Redis logs commands exceeding `slowlog-log-slower-than` (default 10ms). Hot keys accessed via heavy operations will immediately appear here.

4. **Built-in Scanner Tools:**
   - `redis-cli --bigkeys`: Scans the keyspace and reports the largest keys per data type.
   - `redis-cli --hotkeys`: Scans using the **LFU (Least Frequently Used)** algorithm to find keys with the highest access frequency. 
     *(Requires LFU eviction policy enabled, e.g., `maxmemory-policy allkeys-lfu` or `volatile-lfu`).*

5. **Client-Side/Application Monitoring:**
   Standardize key schemas and instrument the cache client wrapper to record QPS and payload sizes by key prefixes (e.g., `product:detail:*`).

---

### Mitigation and Solutions

#### 1. L1 Local Cache (Near Cache)
The most effective way to protect Redis from hot keys is to serve them before the request leaves the application process. Add a short-lived local cache (e.g., Caffeine or Guava) in front of Redis. Even a 2-second TTL for hot keys can absorb 99% of the traffic.

#### 2. Key Splitting & Replication (Replicated Hot Keys)
If a key must be read from Redis directly and cannot be cached locally due to real-time consistency requirements, replicate it across multiple shards by appending a random suffix:
- Original key: `global_config`
- Replicated keys: `global_config:0`, `global_config:1`, `global_config:2`, `global_config:3`
When writing, update all replicas. When reading, randomly query one of the replicas: `global_config: + random(0, 3)`. This distributes the QPS evenly across different slots and cluster shards.

#### 3. Command Optimization
Never fetch entire collections when only a few fields are needed.
- Replace `HGETALL key` with `HMGET key field1 field2` or `HGET key field1`.
- Replace `SMEMBERS key` with `SISMEMBER key member` or paginate using `SSCAN`.

#### 4. Payload Compression and Field Pruning
Store only the minimum required fields. For large JSON blocks, compress the payload on the client side using GZIP or Brotli before writing to Redis. This trade-off shifts CPU load to the application layer to save critical network bandwidth.

#### 5. Request Coalescing (Singleflight)
For cache updates or fallback DB lookups, use a Singleflight pattern. If 1,000 threads request the same missing hot key, only the first thread executes the lookup and writes it to cache, while the remaining 999 threads await that single result.

---

### Implementation: Defensive 2-Level Cache (Caffeine + Redis)

Below is a robust Java implementation utilizing Caffeine as a local L1 cache and Spring Boot's `RedisTemplate` as L2, incorporating defensive checks, local short-term caching for hot keys, and network recovery protection.

```java
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class ProductCacheService {

    private final RedisTemplate<String, byte[]> redisTemplate;
    private final ProductRepository productRepository;

    // L1 Local Cache: Caffeine
    // We enforce a small maximum size and short TTL to protect against stale data,
    // which serves as our first line of defense against Hot Keys.
    private final Cache<Long, Product> l1CaffeineCache = Caffeine.newBuilder()
            .maximumSize(5000)
            .expireAfterWrite(5, TimeUnit.SECONDS) // Very short L1 TTL (5s) to mitigate hot key QPS
            .recordStats()
            .build();

    public ProductCacheService(RedisTemplate<String, byte[]> redisTemplate, 
                               ProductRepository productRepository) {
        this.redisTemplate = redisTemplate;
        this.productRepository = productRepository;
    }

    public Product getProduct(Long id) {
        // 1. Read from L1 Cache (In-Memory JVM Heap)
        Product product = l1CaffeineCache.getIfPresent(id);
        if (product != null) {
            log.debug("L1 Cache Hit for product id: {}", id);
            return product;
        }

        // 2. Read from L2 Cache (Redis)
        String redisKey = "product:detail:" + id;
        byte[] rawBytes = null;
        try {
            rawBytes = redisTemplate.opsForValue().get(redisKey);
        } catch (Exception e) {
            // Redis failure should NOT break the application.
            // Degrade gracefully by falling back directly to DB.
            log.error("Redis unreachable while reading key: {}. Degrading to DB.", redisKey, e);
            return fetchFromDbAndFallback(id);
        }

        if (rawBytes != null) {
            log.debug("L2 Cache Hit (Redis) for product id: {}", id);
            product = deserialize(rawBytes);
            
            // Warm L1 cache to absorb subsequent QPS immediately
            l1CaffeineCache.put(id, product);
            return product;
        }

        // 3. Cache Miss (L1 & L2) - Load from Database
        return loadAndWarmCache(id, redisKey);
    }

    private synchronized Product loadAndWarmCache(Long id, String redisKey) {
        // Double-check L1 in case another thread populated it while waiting for the lock
        Product product = l1CaffeineCache.getIfPresent(id);
        if (product != null) return product;

        log.info("L1 & L2 Cache Miss. Querying DB for product: {}", id);
        product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        // Warm both L1 (sync) and L2 (async to avoid blocking response)
        l1CaffeineCache.put(id, product);
        
        byte[] serializedProduct = serialize(product);
        CompletableFuture.runAsync(() -> {
            try {
                // Set key with a jittered L2 TTL to avoid Cache Avalanche
                long jitter = java.util.concurrent.ThreadLocalRandom.current().nextLong(60, 300);
                Duration ttl = Duration.ofMinutes(30).plusSeconds(jitter);
                
                redisTemplate.opsForValue().set(redisKey, serializedProduct, ttl);
            } catch (Exception e) {
                log.error("Failed to write key {} to Redis", redisKey, e);
            }
        });

        return product;
    }

    private Product fetchFromDbAndFallback(Long id) {
        // Under Redis outage, we bypass cache warming to avoid piling writes on a dead socket
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    private byte[] serialize(Product product) {
        // Implement fast client-side serialization (e.g. Kryo, Protobuf, or Jackson JSON bytes)
        return JacksonSerializer.toBytes(product);
    }

    private Product deserialize(byte[] bytes) {
        return JacksonSerializer.fromBytes(bytes, Product.class);
    }
}
```

---

## Performance Tuning

### Key Settings

```bash
# tcp-backlog: incoming connection queue size
tcp-backlog 511    # Increase for high-connection servers

# Disable transparent huge pages (causes latency spikes)
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# tcp-keepalive: detect dead clients
tcp-keepalive 300

# hz: event loop frequency (background tasks)
hz 10    # 10 iterations/sec (increase for more responsive expiry)
dynamic-hz yes    # Adjust hz based on connected clients load

# latency monitoring
latency-monitor-threshold 100    # Log events > 100ms
latency-tracking yes
```

### Avoid `KEYS` in Production

Never use `KEYS` in production (it blocks the single thread). Use `SCAN`.

```java
// ❌ Bad — blocks Redis server
Set<String> keys = redisTemplate.keys("product:*");

// ✅ Good — use SCAN cursor
ScanOptions options = ScanOptions.scanOptions()
    .match("product:*")
    .count(100)
    .build();

Cursor<byte[]> cursor = redisTemplate.executeWithStickyConnection(
    conn -> conn.keyCommands().scan(options)
);

List<String> keys = new ArrayList<>();
while (cursor.hasNext()) {
    keys.add(new String(cursor.next()));
}
cursor.close();
```

### Serialization and Compression

Avoid default JDK serialization. It is bloated and vulnerable to deserialization attacks.

```java
// ✅ JSON Serialization
template.setValueSerializer(new GenericJackson2JsonRedisSerializer());

// ✅ String template to avoid metadata overhead
// Use StringRedisTemplate instead of RedisTemplate<String, String>
```

For large JSON payloads, use application-level compression to save RAM and network bandwidth:

```java
public void setCompressed(String key, Object value, Duration ttl) throws IOException {
    byte[] json = new ObjectMapper().writeValueAsBytes(value);
    
    // GZIP compress
    ByteArrayOutputStream bos = new ByteArrayOutputStream();
    try (GZIPOutputStream gzip = new GZIPOutputStream(bos)) {
        gzip.write(json);
    }
    byte[] compressed = bos.toByteArray();
    
    redisTemplate.opsForValue().set(key, compressed, ttl);
}
```

### Connection Pooling

```java
// Lettuce connection pool (Spring Boot)
@Bean
public LettuceConnectionFactory redisConnectionFactory() {
    GenericObjectPoolConfig<StatefulRedisConnection<String, String>> poolConfig =
        new GenericObjectPoolConfig<>();
    poolConfig.setMaxTotal(50);      // Max connections
    poolConfig.setMaxIdle(10);       // Max idle connections
    poolConfig.setMinIdle(5);        // Min idle (pre-warmed)
    poolConfig.setMaxWait(Duration.ofMillis(500));  // Wait for connection

    LettucePoolingClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
        .poolConfig(poolConfig)
        .commandTimeout(Duration.ofSeconds(2))
        .build();

    return new LettuceConnectionFactory(new RedisStandaloneConfiguration("localhost", 6379), clientConfig);
}
```

### Monitoring

```bash
# Real-time command monitoring (use with caution in production)
MONITOR    # Dumps every command — high overhead

# Statistics
INFO all              # All stats
INFO server           # Server info
INFO clients          # Connected clients, blocked
INFO memory           # Memory usage
INFO stats            # Commands processed, hits/misses
INFO replication      # Master/replica state
INFO keyspace         # Per-DB key counts and expiry stats

# Key metrics to alert on:
# - used_memory_rss > maxmemory * 1.5  → external fragmentation
# - keyspace_misses / (keyspace_hits + keyspace_misses)  → cache hit rate
# - connected_clients approaching maxclients
# - rdb_last_bgsave_status != ok → RDB failing
# - aof_last_write_status != ok  → AOF failing
# - blocked_clients > 0 → clients waiting on BLPOP/BRPOP

CLIENT LIST           # All connected clients
CLIENT INFO           # Individual client info
CLIENT KILL ID ...    # Kill rogue clients

# Memory fragmentation ratio (should be 1.0–1.5)
# > 1.5 = significant fragmentation → restart or jemalloc
INFO memory | grep mem_fragmentation_ratio
```

---

## Interview Questions

### Q: How do you tune Redis for latency-sensitive workloads?
**A:** Control payload size, use pipelining, avoid blocking commands, and monitor tail latency not just averages.

### Q: Why is KEYS dangerous in production?
**A:** It is blocking and can stall the single-threaded event loop under large keyspaces.

### Q: How do you choose between Streams and Lists for queueing?
**A:** Use Streams for consumer groups and replay semantics; use Lists for simpler lightweight queue flows.

### Q: What is your strategy for safe rate limiter rollout?
**A:** Start with shadow metrics, validate false-positive rate, then progressively enforce by endpoint tier.

### Q: When should payload compression be introduced?
**A:** For large values where network and memory savings outweigh CPU compression overhead.

### Q: Which three metrics best predict Redis incidents?
**A:** Memory fragmentation, command latency spikes, and cache miss surge against backend dependencies.
