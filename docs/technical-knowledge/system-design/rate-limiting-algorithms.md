---
id: rate-limiting-algorithms
title: Rate Limiting Algorithms
sidebar_label: Rate Limiting Algorithms
description: A comprehensive guide to rate-limiting algorithms, including Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, and Sliding Window Counter. Covers workflow mechanics, trade-offs, and distributed scaling.
tags: [system-design, rate-limiting, algorithms, scaling, performance]
---

import RateLimiterDecisionTreeDiagram from '@site/src/components/RateLimiterDecisionTreeDiagram';
import TokenBucketDiagram from '@site/src/components/TokenBucketDiagram';
import LeakyBucketDiagram from '@site/src/components/LeakyBucketDiagram';
import FixedWindowCounterDiagram from '@site/src/components/FixedWindowCounterDiagram';
import FixedWindowSpikeDiagram from '@site/src/components/FixedWindowSpikeDiagram';
import SlidingWindowLogDiagram from '@site/src/components/SlidingWindowLogDiagram';
import SlidingWindowCounterDiagram from '@site/src/components/SlidingWindowCounterDiagram';

# Rate Limiting Algorithms

> **Reference**: [Sujeet Pro — Rate Limiting Strategies: Token Bucket, Leaky Bucket, and Sliding Window](https://sujeet.pro/articles/rate-limiting-strategies)

In high-scale distributed systems, **rate limiting** is a critical defensive pattern. It restricts the volume of requests a client can make within a given timeframe. Rate limiting prevents resource starvation, mitigates Denial of Service (DoS) attacks, manages API monetization tiers, and protects downstream databases and microservices from traffic spikes.

This guide provides a comprehensive breakdown of the core rate-limiting algorithms, explaining their internal mechanics, performance profiles, distributed trade-offs, and concrete use cases.

---

## 🗺️ Algorithmic Comparison Matrix

| Algorithm | Time Complexity (Check) | Space Complexity (Per Client) | Burst Tolerance | Distributed Coordination Cost | Best Suited For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Token Bucket** | $O(1)$ | $O(1)$ (2 fields) | **High** (Allows token accumulation) | Low (Atomic decrement/updates) | General API traffic, handling bursty workloads |
| **Leaky Bucket** | $O(1)$ | $O(1)$ (Queue size) | **None** (Constant outflow rate) | Moderate (Locking on queue) | Throttling database writes, downstream egress |
| **Fixed Window** | $O(1)$ | $O(1)$ (1 counter) | **Poor** (Double limits at boundaries) | Very Low (Atomic increment) | Simple quota-based limits (e.g., max 10,000/day) |
| **Sliding Log** | $O(\log R)$ | $O(R)$ ($R$ is request count) | **None** (Strict enforcement) | High (Requires range deletions in Redis ZSET) | Critical, highly strict security endpoints |
| **Sliding Counter** | $O(1)$ | $O(1)$ (2 counters) | **Moderate** (Smooths boundary spikes) | Moderate (Reads multiple keys) | High-throughput, low-memory distributed APIs |

---

## 🧭 Decision Tree: Which Algorithm to Use?

Use this decision tree to match your workload characteristics to the appropriate rate-limiting algorithm:

<RateLimiterDecisionTreeDiagram />


---

## 1. Token Bucket

The **Token Bucket** algorithm is the most widely adopted general-purpose rate-limiting algorithm. It maintains a centralized bucket of capacity $C$ that is continuously refilled with tokens at a constant rate $r$ per second.

<TokenBucketDiagram />


### Working Mechanics
Instead of running a background thread to add tokens (which is highly inefficient at scale), the refill logic is calculated **lazily** upon each request arrival:

1. Retrieve the timestamp of the last request and current token count.
2. Calculate the elapsed time: $\Delta t = \text{now} - \text{last request time}$.
3. Calculate the newly generated tokens: $\text{new tokens} = \Delta t \times r$.
4. Update token count: $\text{tokens} = \min(C, \text{tokens} + \text{new tokens})$.
5. If $\text{tokens} \ge 1$: consume 1 token, update $\text{last\_request\_time} = \text{now}$, and approve the request. Otherwise, reject the request.

### Java Implementation (Lazy Refill)

```java
public class TokenBucket {
    private final long capacity;
    private final double refillRatePerMs;
    
    private double tokens;
    private long lastRefillTimestamp;

    public TokenBucket(long capacity, double refillRatePerSecond) {
        this.capacity = capacity;
        this.refillRatePerMs = refillRatePerSecond / 1000.0;
        this.tokens = capacity;
        this.lastRefillTimestamp = System.currentTimeMillis();
    }

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        long elapsedMs = now - lastRefillTimestamp;
        
        // Lazily refill tokens
        double tokensToAdd = elapsedMs * refillRatePerMs;
        this.tokens = Math.min(capacity, this.tokens + tokensToAdd);
        this.lastRefillTimestamp = now;

        if (this.tokens >= 1.0) {
            this.tokens -= 1.0;
            return true;
        }
        return false;
    }
}
```

### When to Use
* **General API Gateways**: Ideal for protecting general backend APIs (e.g., Stripe, AWS API Gateway) where clients are allowed occasional bursts of fast requests, but must be throttled over long periods.
* **MONETIZATION TIERS**: Simple to configure (e.g., Free Tier: $C=10, r=2$; Enterprise: $C=100, r=50$).

---

## 2. Leaky Bucket

The **Leaky Bucket** algorithm smooths out traffic surges by queuing incoming requests in a First-In-First-Out (FIFO) buffer and processing them at a constant, stable rate.

<LeakyBucketDiagram />


### Working Mechanics
1. Incoming requests enter a bounded queue of size $Q$.
2. If the queue is full, incoming requests are instantly rejected (dropped).
3. A background consumer drains the queue at a fixed interval (e.g., 1 request every $1/r$ seconds) and processes it.

### Java Implementation

```java
public class LeakyBucket {
    private final BlockingQueue<Runnable> queue;
    private final ScheduledExecutorService leakScheduler;

    public LeakyBucket(int capacity, double leakRatePerSecond) {
        this.queue = new LinkedBlockingQueue<>(capacity);
        this.leakScheduler = Executors.newSingleThreadScheduledExecutor();

        // Drain the queue at a constant frequency
        long delayUs = (long) (1_000_000.0 / leakRatePerSecond);
        this.leakScheduler.scheduleAtFixedRate(this::leak, delayUs, delayUs, TimeUnit.MICROSECONDS);
    }

    public boolean tryAcquire(Runnable requestTask) {
        // Enqueues if capacity is available, returns false instantly if full
        return queue.offer(requestTask);
    }

    private void leak() {
        Runnable task = queue.poll();
        if (task != null) {
            task.run(); // Process request task at fixed rate
        }
    }
}
```

### When to Use
* **Database Write Throttling**: Ideal when protecting downstream relational databases that are susceptible to CPU spikes under sudden write surges. By queuing inserts/updates, writes are applied at a predictable rate.
* **Egress Ingestion Rate Shaping**: Used by payment integrations or email dispatch services that need to stay strictly below target provider ceilings (e.g. max 50 emails/sec).

---

## 3. Fixed Window Counter

The **Fixed Window Counter** partition time into static windows (e.g., 1-minute blocks). A simple counter is incremented for each request within a window.

<FixedWindowCounterDiagram />


### The Boundary Spike (2x Limit) Problem
The main weakness of Fixed Window is that it can allow up to **twice the defined limit** at window boundaries:

<FixedWindowSpikeDiagram />


### Java Implementation

```java
public class FixedWindowCounter {
    private final long windowSizeMs;
    private final int limit;
    
    private int counter;
    private long currentWindowStartTimestamp;

    public FixedWindowCounter(long windowSizeMs, int limit) {
        this.windowSizeMs = windowSizeMs;
        this.limit = limit;
        this.counter = 0;
        this.currentWindowStartTimestamp = System.currentTimeMillis();
    }

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        
        // Reset counter if time has advanced beyond current window boundary
        if (now - currentWindowStartTimestamp >= windowSizeMs) {
            this.counter = 0;
            this.currentWindowStartTimestamp = now;
        }

        if (this.counter < limit) {
            this.counter++;
            return true;
        }
        return false;
    }
}
```

### When to Use
* **Quota-based Billing**: Best suited for simple high-level quotas, such as "maximum 10,000 requests per calendar day" where microsecond precision is not required, and boundary bursts do not cause system failures.

---

## 4. Sliding Window Log

The **Sliding Window Log** algorithm prevents boundary spikes by maintaining a sorted timeline log of all request timestamps for each client.

<SlidingWindowLogDiagram />


### Working Mechanics
1. Upon a new request, delete all logged timestamps older than $(\text{now} - \text{window size})$.
2. Append the current request's timestamp to the log.
3. Count the remaining elements in the log. If the count is less than or equal to the limit, approve the request. Otherwise, remove the newly appended timestamp (as it failed) and reject the request.

### Python/Java Pseudocode (Redis Sorted Set Implementation)
Since maintaining lists in application memory is expensive, this is typically implemented using **Redis Sorted Sets (ZSET)**:

```java
public class RedisSlidingWindowLog {
    private final RedisTemplate<String, String> redisTemplate;

    public RedisSlidingWindowLog(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryAcquire(String clientKey, int limit, long windowSizeMs) {
        long now = System.currentTimeMillis();
        String redisKey = "rate_log:" + clientKey;
        long clearBefore = now - windowSizeMs;

        // Perform transaction using Redis pipeline
        List<Object> results = redisTemplate.executePipelined(new SessionCallback<Object>() {
            @Override
            public Object execute(RedisOperations operations) throws DataAccessException {
                // 1. Remove elements outside window
                operations.opsForZSet().removeRangeByScore(redisKey, 0, clearBefore);
                // 2. Add current timestamp
                operations.opsForZSet().add(redisKey, String.valueOf(now), now);
                // 3. Count remaining timestamps
                operations.opsForZSet().zCard(redisKey);
                return null;
            }
        });

        Long requestCount = (Long) results.get(2);
        if (requestCount != null && requestCount <= limit) {
            return true;
        }
        
        // Cleanup failed element
        redisTemplate.opsForZSet().remove(redisKey, String.valueOf(now));
        return false;
    }
}
```

### When to Use
* **Strict Security Enforcement**: Critical authorization or checkout payment endpoints where boundary spikes cannot be tolerated under any circumstances, and memory overhead is secondary to correctness.
* **Low-Frequency Limits**: Safe when limits are small (e.g. max 5 requests per hour).

---

## 5. Sliding Window Counter

The **Sliding Window Counter** combines Fixed Window's memory efficiency with Sliding Log's accuracy. Instead of storing every timestamp, it aggregates request rates by dynamically interpolating counts from the **previous window** and the **current window**.

<SlidingWindowCounterDiagram />


### Mathematical Model
For a window size of 1 minute, the estimated count is calculated as:

$$\text{Estimated Count} = C_{\text{prev}} \times \left( \frac{\text{window size} - \text{elapsed time}}{\text{window size}} \right) + C_{\text{curr}}$$

Where:
* $C_{\text{prev}}$: Request count in the previous fixed window.
* $C_{\text{curr}}$: Request count in the current fixed window.
* $\text{elapsed time}$: The amount of time elapsed in the current window.

### Java Implementation

```java
public class SlidingWindowCounter {
    private final long windowSizeMs;
    private final int limit;

    private long previousWindowStart;
    private int previousCount;
    
    private long currentWindowStart;
    private int currentCount;

    public SlidingWindowCounter(long windowSizeMs, int limit) {
        this.windowSizeMs = windowSizeMs;
        this.limit = limit;
        long now = System.currentTimeMillis();
        this.currentWindowStart = now;
        this.previousWindowStart = now - windowSizeMs;
        this.currentCount = 0;
        this.previousCount = 0;
    }

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        
        // Check if a new window needs to be initialized
        if (now - currentWindowStart >= windowSizeMs) {
            long windowsPassed = (now - currentWindowStart) / windowSizeMs;
            
            if (windowsPassed == 1) {
                this.previousCount = this.currentCount;
                this.previousWindowStart = this.currentWindowStart;
            } else {
                this.previousCount = 0;
                this.previousWindowStart = now - windowSizeMs;
            }
            this.currentCount = 0;
            this.currentWindowStart = now;
        }

        long timeElapsedInCurrentWindow = now - currentWindowStart;
        double weight = (double) (windowSizeMs - timeElapsedInCurrentWindow) / windowSizeMs;
        double estimatedCount = (previousCount * weight) + currentCount;

        if (estimatedCount < limit) {
            currentCount++;
            return true;
        }
        return false;
    }
}
```

### When to Use
* **High-Throughput Distributed APIs**: The standard for high-performance microservices (e.g., Cloudflare, Kong Gateway). It provides low, constant-space complexity ($O(1)$) with near-exact accuracy, eliminating both sliding log's memory leaks and fixed window's boundary spikes.

---

## 6. Distributed Rate Limiting in Redis: Atomicity, Lua Scripts & Hot-Key Sharding

When running multiple stateless API Gateway pods behind a load balancer, in-memory rate limiters fail because a client's requests are round-robined across pods. Centralizing state in **Redis** solves global state sharing but introduces two critical distributed systems challenges: **Check-Then-Act Race Conditions** and **Hot-Key Bottlenecks**.

### 1. The `GET` + `SET` Race Condition vs. Atomic Redis Lua Scripts
If two gateway pods concurrently read a user's token count via `GET rate:user_123` (both seeing `1` token remaining), compute `1 - 1 = 0` in application memory, and write back `SET rate:user_123 0`, **both requests succeed**—violating the rate limit!

Because Redis executes **Lua scripts (`EVAL` / `EVALSHA`)** atomically on its single-threaded event loop, all read-refill-decrement steps must run inside a single Lua script:

```lua
-- Atomic Token Bucket in Redis Lua (EVALSHA)
-- KEYS[1] = bucket key (e.g. "rl:tb:{user_42}")
-- ARGV[1] = capacity, ARGV[2] = refill_rate_per_ms, ARGV[3] = now_ms, ARGV[4] = requested_tokens
local data = redis.call("HMGET", KEYS[1], "tokens", "last_refill")
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

if tokens == nil then
  tokens = capacity
  last_refill = now
else
  local elapsed = math.max(0, now - last_refill)
  tokens = math.min(capacity, tokens + (elapsed * rate))
  last_refill = now
end

if tokens >= requested then
  tokens = tokens - requested
  redis.call("HMSET", KEYS[1], "tokens", tokens, "last_refill", last_refill)
  redis.call("PEXPIRE", KEYS[1], math.ceil(capacity / rate) * 2)
  return {1, math.floor(tokens)} -- Allowed + remaining tokens
else
  redis.call("HMSET", KEYS[1], "tokens", tokens, "last_refill", last_refill)
  local retry_after_ms = math.ceil((requested - tokens) / rate)
  return {0, retry_after_ms} -- Rejected + ms until next token
end
```

### 2. Solving Redis Hot-Key Bottlenecks: Local Batch Token Reservation & Key Sharding
A single Redis shard maxes out at ~100,000–150,000 ops/sec. If a single viral tenant or flash-sale endpoint generates 500,000 RPS against a single Redis key (`rl:tenant_apple`), that single Redis shard CPU hits 100% while the rest of the Redis Cluster sits idle!
- **Strategy A — Local Batch Token Reservation (Token Leasing)**: Instead of calling Redis on every HTTP request, each API Gateway pod leases a **batch of tokens** (e.g., 50 tokens at a time) from Redis and decrements an in-memory `AtomicLong` locally. Network calls to Redis drop by $50\times$, trading a tiny fraction of boundary accuracy for massive throughput.
- **Strategy B — Randomized Key Sharding (`1..N` Buckets)**: Split a high-volume key into $K$ sub-keys across Redis Cluster hash slots (`rl:tenant_apple:1` .. `rl:tenant_apple:10`), where each sub-key gets $1/K$ of the quota and requests hash to a random shard.

---

## 7. Standard HTTP Rate Limiting Headers & Multi-Tier Defense

### HTTP `429 Too Many Requests` & Response Headers
Well-behaved API Gateways always return transparent rate-limit telemetry on every response (and mandatory backoff directives on `HTTP 429` rejections, standardized in IETF `RateLimit` header specs):

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 12
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1715000060
```

| Header | Meaning & Client Behavior |
| :--- | :--- |
| **`X-RateLimit-Limit`** | Maximum requests permitted in the active window or bucket capacity. |
| **`X-RateLimit-Remaining`** | Remaining tokens/quota before throttling begins. |
| **`X-RateLimit-Reset`** | Unix epoch timestamp (seconds) when the current quota resets to full. |
| **`Retry-After`** | Seconds (or HTTP date) the client **must wait** before issuing another retry (prevents immediate retry storms). |

### Multi-Tier Rate Limiting Architecture (Defense in Depth)
Production architectures enforce rate limiting across three distinct layers:
1. **Tier 1 — Edge / CDN Layer (L3/L4/L7 — Cloudflare, AWS Shield/WAF)**: Absorbs volumetric SYN floods, UDP amplification, and IP-based scraping at the network edge using local per-POP Sliding Window Counters (`eBPF` / `XDP`) before packets ever enter your cloud VPC.
2. **Tier 2 — API Gateway Layer (Kong, Envoy, AWS API Gateway)**: Enforces authenticated business quotas per `API Key`, `Tenant ID`, or `JWT sub` using **Token Bucket** backed by Redis Lua scripts.
3. **Tier 3 — Service / Storage Layer (Resilience4j, Envoy Sidecar, Database Proxy)**: Enforces fine-grained per-endpoint **Leaky Bucket / Adaptive Concurrency Limits** to protect fragile downstream databases and GPU inference pools regardless of which caller originated the traffic.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Rate Limiter Design Interviews

When an interviewer asks *"Design a distributed rate limiter handling 1 million RPS across 50 API Gateway nodes"*, a mid-level candidate says *"Store counters in Redis with `INCR` and `EXPIRE`."* A **Principal Engineer** immediately addresses **Fixed Window $2\times$ boundary bursts**, **`INCR` + `EXPIRE` non-atomic race conditions**, **Redis single-shard hot-key bottlenecks**, and **fail-open vs. fail-closed failure modes**.

### 1. The Senior Framing Strategy (First 60 Seconds)

1. **Select the Right Algorithm for the Workload**: Use **Token Bucket** when legitimate traffic is bursty (user APIs), **Sliding Window Counter** when memory must remain $O(1)$ without $2\times$ boundary spikes (Cloudflare scale), and **Leaky Bucket** when shaping outbound writes to a fragile downstream database.
2. **Enforce Atomic Execution in Redis**: Never execute multi-step read-modify-write across the network (`GET` then `SET`) or unbundled `INCR` + `EXPIRE`; execute a single **Redis Lua script (`EVALSHA`)** so refill calculation, token deduction, and `PEXPIRE` run atomically.
3. **Quantify Network Latency & Redis Hot Keys**: At 1,000,000 RPS, calling a single Redis key per tenant will saturate a single Redis thread (~100k RPS ceiling). Propose **Local Token Batch Leasing** or **Async Local Sync (Gossip / Periodic Flush)** to keep p99 gateway overhead under `< 0.5ms`.
4. **Define Explicit Failure Modes (Fail-Open vs. Fail-Closed)**: Specify what happens when the Redis cluster is unreachable—**Fail-Open** (fallback to local in-memory Token Bucket per pod) for general APIs so Redis downtime doesn't cause a total platform outage, or **Fail-Closed** for high-risk login/OTP endpoints.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Why not just use Fixed Window with Redis `INCR key` followed by `EXPIRE key 60`? It's only two commands!"
* **Junior/Mid Answer:** *"Yes, `INCR` and `EXPIRE` is the standard way to build a Redis rate limiter."*
* **Principal Rebuttal:** *"That approach has two production-breaking flaws:
  1. **The Zombie Key Leak (Atomicity Bug)**: If the gateway pod crashes or experiences a network timeout right after `INCR` succeeds but before `EXPIRE` is sent, that key remains in Redis **forever without a TTL**, permanently blocking the user once it hits the limit! You must wrap `INCR` + `PEXPIRE` in a **Lua script** or `MULTI/EXEC` transaction.
  2. **The $2\times$ Boundary Burst**: If a user has a limit of 100 req/min and sends 100 requests at `00:59` and another 100 requests at `01:01`, Fixed Window permits **200 requests in 2 seconds** ($2\times$ the capacity of your downstream database). Upgrading to **Sliding Window Counter** requires only 2 integers per user ($C_{\text{prev}}$ and $C_{\text{curr}}$) and smooths out boundary spikes completely."*

#### Trap 2: "Why not use Sliding Window Log (Redis `ZSET`) everywhere since it gives 100% exact accuracy?"
* **Junior/Mid Answer:** *"Sliding Window Log is the best choice whenever we want exact rate limiting."*
* **Principal Rebuttal:** *"Sliding Window Log (`ZADD` + `ZREMRANGEBYSCORE` + `ZCARD`) has **$O(R)$ memory complexity per user** and **$O(\log R)$ CPU complexity**. If an enterprise tenant has a quota of 50,000 requests per hour, storing 50,000 64-bit timestamps in a Redis `ZSET` (with skip-list/hashtable overhead of ~64 bytes per entry) consumes **> 3.2 MB of RAM for a single user**! Even worse, when an attacker launches a DDoS attack sending 100,000 rejected requests, a naive `ZADD`-before-check implementation still inserts and deletes all 100,000 timestamps, exhausting Redis memory and CPU. Reserve Sliding Window Log strictly for low-volume, high-security rules (e.g., max 5 password resets/hour)."*

#### Trap 3: "One of our enterprise customers runs a flash sale at 300,000 RPS. Even with a 20-node Redis Cluster, our rate limiter starts timing out! Why?"
* **Junior/Mid Answer:** *"We need to scale the Redis Cluster from 20 nodes to 50 nodes."*
* **Principal Rebuttal:** *"Adding more nodes to a Redis Cluster **will not help at all** because Redis Cluster partitions keys by `CRC16(key) mod 16384`. All 300,000 RPS for `rl:tenant_enterprise_1` hash to the **exact same hash slot on a single Redis primary node**, pegging its single-threaded CPU at 100% while the other 19 nodes sit idle! To solve hot-key saturation, each API Gateway pod should either **lease tokens in batches of 100** from Redis and consume them in local RAM (`AtomicLong`), or shard the key across $N$ slots (`rl:tenant_enterprise_1:shard_[0..9]`)."*

#### Trap 4: "What should our API Gateway do if the Redis Rate Limiter cluster goes down or experiences a network partition?"
* **Junior/Mid Answer:** *"Throw an error and reject requests until Redis comes back online."*
* **Principal Rebuttal:** *"Failing closed on an infrastructure cache outage turns a minor Redis blip into a **100% catastrophic global outage**! Instead, the API Gateway should wrap the Redis call in a tight timeout (`10ms`) and a **Circuit Breaker**. If Redis times out, the gateway immediately degrades to an **in-memory local Token Bucket** inside the gateway pod's JVM/Go memory (setting the pod's local limit to $\text{Global Limit} / N_{\text{pods}}$). Traffic continues flowing safely while ops restores Redis."*

---

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Algorithm Selection** | "Use Fixed Window or Sliding Log." | "**Token Bucket** for burst-friendly APIs; **Sliding Window Counter** for $O(1)$ memory without $2\times$ boundary spikes; **Leaky Bucket** for steady egress." |
| **Redis Concurrency** | "Read the count with `GET`, check in Java, then `SET`." | "Execute refill, check, decrement, and `PEXPIRE` atomically inside a single **Redis Lua script (`EVALSHA`)**." |
| **High-Volume Tenant (300k RPS)** | "Add more shards to the Redis Cluster." | "A single key still hits 1 shard; use **Local Batch Token Reservation** in the gateway or **Key Sharding (`1..K`)**." |
| **Client Backoff Contract** | "Return `429 Too Many Requests`." | "Return `429` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` to prevent blind retry storms." |
| **Redis Outage Handling** | "Block requests until Redis recovers." | "**Fail-Open to Local In-Memory Rate Limiting** ($\text{Quota} / N_{\text{pods}}$) guarded by a 10ms timeout so Redis never becomes a hard SPOF." |

---

## See Also
* **[Redis Distributed Caching](../redis/redis-distributed-cache.md)**: Storing rate limit states.
* **[Redis Rate Limiting](../redis/redis-rate-limiting.md)**: Redis Lua scripts, token buckets, and sliding log implementations.
* **[Scaling Writes](./scaling-writes.md)**: Applying rate limiting and backpressure controls on database ingestion.
* **[API Gateway Guide](./reverse-proxy-load-balancer-api-gateway.md)**: Implementing rate limiting at the API gateway layer.
* **[LLD Rate Limiter Problem Description](../low-level-design/problem/rate-limiter.md)**: Strategy pattern class models and thread-safety interview guidelines.
