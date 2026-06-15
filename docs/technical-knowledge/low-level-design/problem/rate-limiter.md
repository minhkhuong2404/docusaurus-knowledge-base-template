---
id: rate-limiter
title: "Problem: Rate Limiter"
sidebar_label: 🚦 Rate Limiter
---

# Rate Limiter

> **Difficulty:** Hard | **Frequency:** Very High | **Patterns:** Strategy, Decorator, Singleton

---

## Interview Expectation

Rate Limiter is a senior-level problem. The interviewer expects you to:

| Expectation | Details |
|------------|---------|
| Know multiple algorithms | Token Bucket, Fixed Window, Sliding Window Log, Sliding Window Counter |
| Apply Strategy pattern | Swap algorithms without changing the limiter interface |
| Handle concurrency correctly | Atomic check-and-decrement, no TOCTOU bugs |
| Discuss trade-offs | Memory vs accuracy, simplicity vs precision |
| Think about scale | Per-user limiting, distributed limiting |

---

## Step 1: Clarify Requirements

- **Scope:** Per user/IP, or global?
- **Limit:** Requests per second? Per minute?
- **Algorithm preference?** (if none → propose Token Bucket with justification)
- **Behavior on limit exceeded:** reject (429), queue, or shed load?
- **Distributed?** Single node first, mention Redis for distributed

---

## Step 2: Interface Design

```java
public interface RateLimiter {
    /**
     * @return true if the request is allowed, false if rate limited
     */
    boolean isAllowed(String clientId);

    /**
     * Attempt to consume {@code tokens} permits.
     */
    boolean tryConsume(String clientId, int tokens);
}
```

---

## Step 3: Algorithm Implementations

### Algorithm 1 — Fixed Window Counter

Simple but has boundary burst problem.

```java
public class FixedWindowRateLimiter implements RateLimiter {
    private final int limit;
    private final long windowSizeMs;

    // clientId → [windowStart, count]
    private final ConcurrentHashMap<String, long[]> windows = new ConcurrentHashMap<>();

    public FixedWindowRateLimiter(int limit, long windowSizeMs) {
        this.limit        = limit;
        this.windowSizeMs = windowSizeMs;
    }

    @Override
    public boolean isAllowed(String clientId) {
        return tryConsume(clientId, 1);
    }

    @Override
    public boolean tryConsume(String clientId, int tokens) {
        long now = System.currentTimeMillis();

        // Atomic update with compute()
        long[] result = windows.compute(clientId, (id, window) -> {
            if (window == null || now - window[0] >= windowSizeMs) {
                // New or expired window
                return new long[]{now, tokens};
            }
            // Existing window
            window[1] += tokens;
            return window;
        });

        return result[1] <= limit;
    }
}

/*
 * ❌ Flaw: A client can send 100 req at 0:59 and 100 req at 1:01
 * — 200 requests in 2 seconds, but both windows show exactly 100.
 * This is the "boundary burst" problem.
 */
```

### Algorithm 2 — Token Bucket (Recommended)

Smooth rate limiting, allows controlled bursts.

```java
public class TokenBucketRateLimiter implements RateLimiter {
    private final int capacity;          // Burst capacity
    private final double refillRatePerMs; // Tokens added per millisecond

    // Per-client bucket state: [tokens, lastRefillTime]
    private final ConcurrentHashMap<String, double[]> buckets = new ConcurrentHashMap<>();

    public TokenBucketRateLimiter(int capacity, int refillPerSecond) {
        this.capacity         = capacity;
        this.refillRatePerMs  = refillPerSecond / 1000.0;
    }

    @Override
    public boolean isAllowed(String clientId) {
        return tryConsume(clientId, 1);
    }

    @Override
    public boolean tryConsume(String clientId, int tokens) {
        long now = System.currentTimeMillis();

        // Atomic compute ensures no TOCTOU race
        double[] result = new double[1];
        buckets.compute(clientId, (id, bucket) -> {
            double currentTokens;
            if (bucket == null) {
                currentTokens = capacity; // Start full
            } else {
                long elapsedMs  = now - (long) bucket[1];
                double refilled = elapsedMs * refillRatePerMs;
                currentTokens   = Math.min(capacity, bucket[0] + refilled);
            }

            if (currentTokens >= tokens) {
                result[0] = currentTokens - tokens;  // allowed
                return new double[]{currentTokens - tokens, now};
            } else {
                result[0] = -1;  // denied
                return new double[]{currentTokens, now};  // still update timestamp
            }
        });

        return result[0] >= 0;
    }
}
```

### Algorithm 3 — Sliding Window Log

Most accurate, but O(N) memory per client.

```java
public class SlidingWindowLogRateLimiter implements RateLimiter {
    private final int limit;
    private final long windowMs;
    private final ConcurrentHashMap<String, Deque<Long>> logs = new ConcurrentHashMap<>();

    public SlidingWindowLogRateLimiter(int limit, long windowMs) {
        this.limit    = limit;
        this.windowMs = windowMs;
    }

    @Override
    public boolean isAllowed(String clientId) {
        return tryConsume(clientId, 1);
    }

    @Override
    public synchronized boolean tryConsume(String clientId, int tokens) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowMs;

        Deque<Long> log = logs.computeIfAbsent(clientId, id -> new ArrayDeque<>());

        // Remove expired entries
        while (!log.isEmpty() && log.peekFirst() <= windowStart) {
            log.pollFirst();
        }

        if (log.size() + tokens <= limit) {
            for (int i = 0; i < tokens; i++) {
                log.addLast(now);
            }
            return true;
        }
        return false;
    }
}
```

### Algorithm 4 — Sliding Window Counter (Space-Efficient)

Approximates sliding window using two fixed windows.

```java
public class SlidingWindowCounterRateLimiter implements RateLimiter {
    private final int limit;
    private final long windowMs;
    private final ConcurrentHashMap<String, long[]> windows = new ConcurrentHashMap<>();
    // windows[clientId] = [currentWindowStart, currentCount, previousCount]

    public SlidingWindowCounterRateLimiter(int limit, long windowMs) {
        this.limit    = limit;
        this.windowMs = windowMs;
    }

    @Override
    public boolean isAllowed(String clientId) {
        return tryConsume(clientId, 1);
    }

    @Override
    public boolean tryConsume(String clientId, int tokens) {
        long now = System.currentTimeMillis();

        long[] window = windows.compute(clientId, (id, w) -> {
            if (w == null) return new long[]{now, 0, 0};

            long windowStart = w[0];
            long elapsed     = now - windowStart;

            if (elapsed >= 2 * windowMs) {
                // Both windows expired
                return new long[]{now, 0, 0};
            } else if (elapsed >= windowMs) {
                // Current window expired — shift windows
                return new long[]{windowStart + windowMs, 0, w[1]};
            }
            return w; // Same window
        });

        long windowStart = window[0];
        double positionInWindow = (double)(now - windowStart) / windowMs;

        // Weighted count: previousCount * (1 - position) + currentCount
        double weightedCount = window[2] * (1.0 - positionInWindow) + window[1];

        if (weightedCount + tokens <= limit) {
            window[1] += tokens;
            return true;
        }
        return false;
    }
}
```

---

## Step 4: Strategy Pattern + Factory

```java
public enum RateLimitAlgorithm { FIXED_WINDOW, TOKEN_BUCKET, SLIDING_WINDOW_LOG, SLIDING_WINDOW_COUNTER }

public class RateLimiterFactory {
    public static RateLimiter create(RateLimitAlgorithm algorithm, int limit, long windowMs) {
        return switch (algorithm) {
            case FIXED_WINDOW           -> new FixedWindowRateLimiter(limit, windowMs);
            case TOKEN_BUCKET           -> new TokenBucketRateLimiter(limit, (int)(limit * 1000 / windowMs));
            case SLIDING_WINDOW_LOG     -> new SlidingWindowLogRateLimiter(limit, windowMs);
            case SLIDING_WINDOW_COUNTER -> new SlidingWindowCounterRateLimiter(limit, windowMs);
        };
    }
}
```

---

## Step 5: Decorator — Logging & Metrics

```java
public class MetricsRateLimiter implements RateLimiter {
    private final RateLimiter delegate;
    private final AtomicLong allowed  = new AtomicLong();
    private final AtomicLong rejected = new AtomicLong();

    public MetricsRateLimiter(RateLimiter delegate) {
        this.delegate = delegate;
    }

    @Override
    public boolean isAllowed(String clientId) {
        boolean result = delegate.isAllowed(clientId);
        if (result) allowed.incrementAndGet();
        else        rejected.incrementAndGet();
        return result;
    }

    @Override
    public boolean tryConsume(String clientId, int tokens) {
        return delegate.tryConsume(clientId, tokens);
    }

    public double getRejectionRate() {
        long total = allowed.get() + rejected.get();
        return total == 0 ? 0 : (double) rejected.get() / total;
    }
}
```

---

## Algorithm Trade-offs

| Algorithm | Memory | Accuracy | Burst Handling | Best For |
|-----------|--------|----------|----------------|---------|
| Fixed Window | O(1)/client | Low (boundary bursts) | Allows 2x burst at boundary | Simple use cases |
| Token Bucket | O(1)/client | High | Yes, controlled burst | APIs, general use |
| Sliding Window Log | O(N)/client | Perfect | No | Low-traffic, strict SLA |
| Sliding Window Counter | O(1)/client | ~99% accurate | No | High-traffic approximation |

---

## Senior Deep Dive: Distributed Rate Limiting

:::note[Senior Deep Dive 🔴]
**Single node:** The above implementations use in-memory state — fast, but state is lost on restart and doesn't work across multiple service instances.

**Distributed with Redis (Lua script for atomicity):**
```lua
-- token_bucket.lua — runs atomically on Redis
local key       = KEYS[1]
local capacity  = tonumber(ARGV[1])
local refill    = tonumber(ARGV[2])
local tokens    = tonumber(ARGV[3])
local now       = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local current = tonumber(bucket[1]) or capacity
local last    = tonumber(bucket[2]) or now

local elapsed = (now - last) / 1000
local refilled = math.min(capacity, current + elapsed * refill)

if refilled >= tokens then
    redis.call('HMSET', key, 'tokens', refilled - tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 3600)
    return 1
else
    redis.call('HMSET', key, 'tokens', refilled, 'last_refill', now)
    return 0
end
```

**Sticky sessions:** Route each client to the same rate limiter node using consistent hashing — avoids distributed state entirely.
:::

---

## Interview Checklist

- [ ] Clarified: limit number, window size, per-user vs global
- [ ] Defined clean `RateLimiter` interface
- [ ] Implemented at least Token Bucket in detail
- [ ] Used `ConcurrentHashMap.compute()` for atomic check-and-update
- [ ] Applied Strategy pattern for algorithm swappability
- [ ] Compared algorithm trade-offs (memory, accuracy, burst)
- [ ] Mentioned distributed approach (Redis Lua scripts or sticky routing)

## See Also
* **[Rate Limiting Algorithms](../../system-design/rate-limiting-algorithms.md)**: Deep dive into the mathematical models, workflow details, and comparative trade-offs of all core rate-limiting algorithms.

