---
id: redis-performance-patterns
title: "Redis Performance, Patterns & Production Design"
slug: redis-performance-patterns
description: Advanced Redis patterns — distributed locking, rate limiting, session management, leaderboards, search, and production performance tuning for senior engineers.
tags: [redis, performance, patterns, distributed-lock, rate-limiting, backend]
---

# Redis Performance, Patterns & Production Design

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
