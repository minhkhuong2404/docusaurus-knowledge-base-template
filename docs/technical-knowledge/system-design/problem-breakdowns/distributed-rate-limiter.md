---
id: distributed-rate-limiter
title: Design a High-Throughput Distributed Rate Limiter
sidebar_label: 9. Distributed Rate Limiter
description: Staff-level system design breakdown for an ultra-low latency distributed rate limiter protecting microservices against DoS and abusive traffic surges.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a High-Throughput Distributed Rate Limiter

A distributed rate limiter controls the rate of traffic sent or received by a network or API service. When an incoming request rate exceeds a defined threshold (e.g., 100 requests per minute per IP or API key), the rate limiter rejects excess requests with HTTP `429 Too Many Requests`, protecting backend infrastructure from denial-of-service (DoS) attacks, brute-force exploits, and cascading service outages.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Multi-Dimension Throttling**: Rate limit requests based on IP address, authenticated user ID, API key, or specific API route (e.g. `/checkout`).
2. **Standardized HTTP Headers**: Return standard rate limiting headers with every response (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).
3. **Graceful Rejection**: Return HTTP `429 Too Many Requests` with a `Retry-After` header when quotas are exhausted.
4. **Configurable Rules Engine**: Allow dynamic runtime rule updates (e.g., change tiers from 500 req/min to 1,000 req/min) without restarting services.

### Non-Functional Requirements
- **Negligible Latency Overhead**: The rate limiter sits on the critical path of every incoming API request; verification overhead must be `< 2ms` (P99).
- **High Availability & Fault Tolerance**: If the rate limiting cluster crashes, the system should default to **Fail-Open** (allowing traffic rather than taking down the entire business).
- **Distributed Accuracy**: Quota enforcement must be consistent across hundreds of load-balanced API gateway instances without severe race conditions.
- **Memory Efficiency**: The memory footprint per tracked client must be minimal to support tracking hundreds of millions of concurrent IP addresses.

### Capacity Estimations & Sizing
- **Total Ingress Traffic**: 100,000 requests/sec across all global API gateways.
- **Unique Active Entities Tracked Daily**: 50 Million unique IP addresses and API keys.
- **Memory Sizing per Tracked Entity**:
  - Sliding Window Counter metadata: key string (32 bytes) + 2 counter integers (16 bytes) + timestamp (8 bytes) $\approx$ **64 bytes**.
  - 50 Million $\times$ 64 bytes $\approx$ **3.2 GB RAM** (fits easily in a compact Redis cluster).
- **Network & CPU Overhead**:
  - 100,000 requests/sec contacting Redis synchronously means **100,000 Redis queries/sec**.
  - Requires localized token batching or Envoy memory caching to avoid saturating network I/O.

---

## 2. The Set Up

### Rate Limiting Algorithms Comparison

```
┌───────────────────────────┬──────────────────────────────────┬──────────────────────────────────┐
│ ALGORITHM                 │ HOW IT WORKS                     │ TRADE-OFF / DRAWBACK             │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 1. Token Bucket           │ Tokens added at constant rate;   │ Can permit bursts up to bucket   │
│                           │ each request consumes 1 token.   │ capacity, but smooth overall.    │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 2. Leaky Bucket           │ Requests enter a bounded FIFO;   │ Drops bursts aggressively;       │
│                           │ processed at constant out-rate.  │ can delay bursty legitimate apps.│
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 3. Fixed Window Counter   │ Counter resets at fixed clock    │ Boundary Burst Hazard: 2x quota  │
│                           │ intervals (e.g. 10:00, 10:01).   │ at boundary (59s and 01s).       │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 4. Sliding Window Log     │ Stores timestamp of every req    │ High Memory: Storing 1,000       │
│                           │ in a Sorted Set; count in range. │ timestamps per key explodes RAM. │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 5. Sliding Window Counter │ Weighted sum of current window   │ Industry Standard: Low memory    │
│    (Recommended)          │ count and previous window count. │ (2 integers) with 99% accuracy.  │
└───────────────────────────┴──────────────────────────────────┴──────────────────────────────────┘
```

### The API / Response Header Standard

When a request is processed, the rate limiter injects standard headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1774301980
```

When quota is exhausted:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 18
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1774301980

{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "API quota exceeded. Please retry after 18 seconds."
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="rate-limiter" title="Distributed Rate Limiter Gateway & Token Bucket Topology" />

### Core Request Evaluation Lifecycle
1. Client sends request to the **L7 Load Balancer / Reverse Proxy (Envoy / NGINX)**.
2. The Gateway extracts client identification tokens:
   - For authenticated users: `Authorization: Bearer <API_KEY>` $\implies$ Rate limit key = `rate:usr:<user_id>`.
   - For public endpoints: Client IP address + Route $\implies$ Rate limit key = `rate:ip:<ip_address>:<route>`.
3. The Gateway invokes the **Rate Limiter Service / Redis Cluster**:
   - Executes an atomic **Redis Lua script** implementing the **Sliding Window Counter** or **Token Bucket**.
4. **Decision**:
   - **Allowed (`is_allowed = true`)**: Gateway forwards request to downstream microservices and injects `X-RateLimit-*` headers into the response.
   - **Rejected (`is_allowed = false`)**: Gateway short-circuits immediately, returning HTTP `429 Too Many Requests` without touching internal backend microservices.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: The Race Condition Under High Concurrency
What happens when a client with 1 remaining token fires 10 simultaneous requests across 10 different load-balanced Gateway instances?

```
Gateway Instance 1                      Gateway Instance 2
       │                                       │
Read token count: 1                     Read token count: 1
       │                                       │
Decrement token: 0                      Decrement token: 0
       │                                       │
Allow request (OK!)                     Allow request (OK!)
       ➔ BOTH REQUESTS SUCCEEDED! (Quota Violated: 2 allowed instead of 1)
```

#### The Atomic Solution: Redis Lua Script
Redis executes Lua scripts in a single-threaded execution context, guaranteeing that no other command can run concurrently between the read and write:

```lua
-- KEYS[1]: Rate limit key (e.g. rate:user123:2026092222)
-- ARGV[1]: Max tokens permitted in window (100)
-- ARGV[2]: Window TTL in seconds (60)

local current = tonumber(redis.call('GET', KEYS[1]) or '0')

if current < tonumber(ARGV[1]) then
    redis.call('INCRBY', KEYS[1], 1)
    if current == 0 then
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
    end
    return {1, tonumber(ARGV[1]) - (current + 1)} -- {Allowed, Remaining}
else
    return {0, 0} -- {Rejected, Remaining}
end
```

### Deep Dive 2: Sliding Window Counter Approximation Algorithm
How does the Sliding Window Counter provide 99% accuracy with only 2 numbers in memory?

```
Window Size = 1 Minute.
Current Time is 10:01:15 (25% into the current minute).
Previous Window (10:00 - 10:01) count: 80 requests.
Current Window (10:01 - 10:02) count: 30 requests.
Allowed Limit: 100 requests/minute.

Estimated Requests in the Sliding Window:
Requests = (Previous Window Count * (1 - 0.25)) + Current Window Count
Requests = (80 * 0.75) + 30 = 60 + 30 = 90 requests.

90 < 100 ➔ ALLOW REQUEST!
```
**Memory Efficiency**: Requires storing only two integer keys in Redis (`rate:user:prev` and `rate:user:curr`), compared to the Sliding Window Log which requires storing thousands of timestamp elements.

### Deep Dive 3: Local Token Batching & Amortization (Scaling to Millions of QPS)
If our platform grows to 1 Million QPS, sending 1 Million network round trips per second to Redis will saturate network interface cards (NICs) and add 1–2ms of latency to every single API request.
- **The Solution (Local Token Batching)**:
  - Gateway instances do not contact Redis on every single request.
  - Instead, a Gateway requests a **batch of tokens** from Redis (e.g., "Reserve 50 tokens for User A").
  - The Gateway serves the next 50 requests for User A out of local in-memory CPU cache (`AtomicInteger` in memory) in **0.001ms**.
  - Once the 50 tokens are exhausted, the Gateway asynchronously fetches the next batch.
  - **Trade-Off**: If a Gateway instance crashes, the remaining unused local tokens are lost, temporarily permitting a minor variance in rate limiting. In distributed systems, this is a universally accepted trade-off to achieve 100x higher throughput.

### Deep Dive 4: Fault Tolerance: Fail-Open vs Fail-Closed
What happens if the Redis rate limiter cluster becomes partitioned or experiences an outage?

- **Fail-Closed**: Reject all incoming requests.
  - *Result*: A failure in the rate limiting infrastructure causes a **complete, catastrophic global outage** of all business services.
- **Fail-Open (Recommended for Most Services)**: If the rate limiter times out (e.g. after 5ms) or throws a network error, log an alert, increment a Prometheus metric, and **allow the request through to backend services**.
- **Exception (High-Security Routes)**: For critical financial operations (`POST /payments/charge`) or authentication routes (`POST /login`), configure **Fail-Closed** to prevent brute-force credential stuffing and double billing during outages.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Architecture Layer** | Middleware inside application code | Edge Gateway / Sidecar (Envoy) | **Edge Gateway**: Centralizes rate limiting before requests consume application thread pool resources. Protects internal microservices from DoS. |
| **Data Storage** | Relational Database (SQL) | In-Memory Key-Value (Redis) | **Redis**: Sub-millisecond read/write latency. Relational databases cannot handle 100K QPS of continuous counter updates without locking. |
| **Algorithm** | Sliding Window Log | Sliding Window Counter | **Sliding Window Counter**: Reduces memory usage by 90% while preventing the fixed-window boundary burst exploit. |
| **Failure Policy** | Fail-Closed (Strict Security) | Fail-Open (High Availability) | **Fail-Open**: Protects platform uptime. An infrastructure rate limiter outage should never cause total business revenue loss. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Explains the differences between Token Bucket and Fixed Window algorithms.
- Designs basic rate limiting headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`).
- Uses Redis `INCR` and `EXPIRE` for basic counting.
- Identifies HTTP `429 Too Many Requests`.

### Senior (L5 / IC5)
- Solves race conditions under high concurrency using atomic Redis Lua scripts.
- Implements the Sliding Window Counter mathematical approximation to save memory.
- Discusses network latency overhead and introduces local token batching / pre-fetching.
- Defines clear Fail-Open vs Fail-Closed failure recovery policies.

### Staff+ (L6 / Principal)
- Designs multi-datacenter rate limiting: Resolves cross-region clock drift and WAN replication latency without creating split-brain quotas.
- Implements dynamic tiered rate limiting (adaptive rate limiting based on backend CPU / memory pressure signals).
- Architects multi-dimensional hierarchical rate limiting (e.g. 100 req/s per user AND 10,000 req/s across the entire tenant organization AND 50,000 req/s global IP pool).
