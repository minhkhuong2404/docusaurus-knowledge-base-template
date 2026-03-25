---
id: redis-rate-limiting
title: "Rate Limiting"
slug: redis-rate-limiting
description: "Comprehensive guide to Rate Limiting algorithms with Redis — Fixed Window, Sliding Window, and Token Bucket."
tags: [redis, rate-limiting, pattern, backend]
---

# Rate Limiting with Redis

Rate limiting controls how many requests a user, IP, or service can make in a given time window. Redis is ideal for this due to its atomic increment operations and TTL support.

## Algorithms

### 1. Fixed Window Counter

Simplest approach: count requests per fixed time window (e.g., per minute).

```java
@Component
public class FixedWindowRateLimiter {

    @Autowired
    private RedisTemplate<String, Long> redisTemplate;

    public boolean isAllowed(String userId, int maxRequests,
                             Duration windowSize) {
        String key = "rate:fixed:" + userId + ":"
            + (System.currentTimeMillis() / windowSize.toMillis());

        Long count = redisTemplate.opsForValue().increment(key);

        if (count == 1) {
            // First request in this window — set TTL
            redisTemplate.expire(key, windowSize);
        }

        return count <= maxRequests;
    }
}
```

**Limitation:** Allows 2× burst at window boundaries.

---

### 2. Sliding Window Log

Track exact timestamps of requests. Most accurate, more memory-intensive.

```java
@Component
public class SlidingWindowRateLimiter {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String SCRIPT = """
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local max = tonumber(ARGV[3])
        local cutoff = now - window
        
        -- Remove old entries outside window
        redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
        
        -- Count remaining
        local count = redis.call('ZCARD', key)
        
        if count < max then
            -- Add current request
            redis.call('ZADD', key, now, now .. '-' .. math.random(100000))
            redis.call('EXPIRE', key, math.ceil(window / 1000))
            return 1   -- allowed
        end
        return 0   -- rejected
        """;

    public boolean isAllowed(String identifier, int maxRequests,
                             Duration window) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(SCRIPT);
        script.setResultType(Long.class);

        long now = System.currentTimeMillis();
        long windowMs = window.toMillis();

        Long result = redisTemplate.execute(
            script,
            Collections.singletonList("rate:sliding:" + identifier),
            String.valueOf(now),
            String.valueOf(windowMs),
            String.valueOf(maxRequests)
        );

        return Long.valueOf(1L).equals(result);
    }
}
```

---

### 3. Token Bucket

Tokens are refilled at a constant rate. Allows controlled bursting.

```java
@Component
public class TokenBucketRateLimiter {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String SCRIPT = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])   -- tokens per second
        local now = tonumber(ARGV[3])
        local requested = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(bucket[1]) or capacity
        local lastRefill = tonumber(bucket[2]) or now
        
        -- Refill tokens based on elapsed time
        local elapsed = (now - lastRefill) / 1000
        tokens = math.min(capacity, tokens + elapsed * refillRate)
        
        if tokens >= requested then
            tokens = tokens - requested
            redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
            redis.call('EXPIRE', key, 86400)
            return 1   -- allowed
        else
            redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
            redis.call('EXPIRE', key, 86400)
            return 0   -- rejected
        end
        """;

    public boolean consume(String identifier, int capacity,
                           int refillPerSecond, int tokensRequired) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(SCRIPT);
        script.setResultType(Long.class);

        Long result = redisTemplate.execute(
            script,
            Collections.singletonList("rate:bucket:" + identifier),
            String.valueOf(capacity),
            String.valueOf(refillPerSecond),
            String.valueOf(System.currentTimeMillis()),
            String.valueOf(tokensRequired)
        );

        return Long.valueOf(1L).equals(result);
    }
}
```

---

## Spring Boot Filter / Interceptor Integration

```java
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    @Autowired
    private SlidingWindowRateLimiter rateLimiter;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String identifier = resolveIdentifier(request);

        if (!rateLimiter.isAllowed(identifier, 100, Duration.ofMinutes(1))) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.addHeader("Retry-After", "60");
            response.getWriter().write("""
                {"error": "Too Many Requests", "retryAfter": 60}
                """);
            return;
        }

        chain.doFilter(request, response);
    }

    private String resolveIdentifier(HttpServletRequest request) {
        // Use API key if present, fall back to IP
        String apiKey = request.getHeader("X-API-Key");
        if (apiKey != null) return "apikey:" + apiKey;

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null) ip = request.getRemoteAddr();
        return "ip:" + ip;
    }
}
```

---

## Tiered Rate Limits

Different limits for different user tiers:

```java
@Service
public class TieredRateLimiter {

    @Autowired
    private FixedWindowRateLimiter rateLimiter;

    private static final Map<String, RateLimit> TIERS = Map.of(
        "free",       new RateLimit(60,   Duration.ofMinutes(1)),
        "pro",        new RateLimit(1000, Duration.ofMinutes(1)),
        "enterprise", new RateLimit(10000, Duration.ofMinutes(1))
    );

    public boolean isAllowed(String userId, String tier) {
        RateLimit limit = TIERS.getOrDefault(tier, TIERS.get("free"));
        return rateLimiter.isAllowed(userId, limit.maxRequests(), limit.window());
    }

    record RateLimit(int maxRequests, Duration window) {}
}
```

---

## Rate Limit Headers

Return standard rate limit headers in responses:

```java
@Component
public class RateLimitHeaderAdvice implements ResponseBodyAdvice<Object> {

    @Autowired
    private RedisTemplate<String, Long> redisTemplate;

    @Override
    public Object beforeBodyWrite(Object body, ...,
            HttpServletRequest request, HttpServletResponse response) {

        String userId = (String) request.getAttribute("userId");
        String key = "rate:fixed:" + userId + ":" + currentWindow();

        Long used = (Long) redisTemplate.opsForValue().get(key);
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);

        response.addHeader("X-RateLimit-Limit", "100");
        response.addHeader("X-RateLimit-Remaining",
            String.valueOf(Math.max(0, 100 - (used != null ? used : 0))));
        response.addHeader("X-RateLimit-Reset",
            String.valueOf(System.currentTimeMillis() / 1000 + (ttl != null ? ttl : 0)));

        return body;
    }
}
```

---

## Choosing an Algorithm

| Algorithm | Accuracy | Memory | Burst Handling | Complexity |
|---|---|---|---|---|
| Fixed Window | Medium | Low | Poor (2× at boundary) | Low |
| Sliding Window Log | High | High | Good | Medium |
| Sliding Window Counter | High | Low | Good | Medium |
| Token Bucket | High | Low | Excellent | Medium |
| Leaky Bucket | High | Low | Strict smoothing | Medium |

> For most APIs: **Token Bucket** is the best balance of accuracy, burst handling, and simplicity.
