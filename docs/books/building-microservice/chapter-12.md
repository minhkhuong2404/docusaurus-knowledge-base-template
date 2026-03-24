---
sidebar_position: 13
title: 'Chapter 12: Resiliency'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-12
---
# Chapter 12: Resiliency

**Part II — Implementation**

> Distributed systems fail. Networks drop. Services slow down. This chapter covers the patterns and practices that help your system degrade gracefully rather than collapse catastrophically.

---

## What Is Resiliency?

Resiliency is the ability of a system to handle and recover from failures. In a microservice architecture, failure is not a question of *if* but *when*. Your system must be designed to:

1. **Survive partial failures** — one service failing shouldn't bring down the whole system
2. **Degrade gracefully** — show reduced functionality rather than nothing
3. **Recover automatically** — self-heal without human intervention

> Resiliency is not about preventing all failures — it's about surviving them.

---

## The Four Failure Modes

### 1. Slow Downstream Service
The most insidious failure. Service B doesn't fail — it just becomes very slow. Service A's threads pile up waiting. Eventually Service A runs out of threads and fails too. This is a **cascading failure**.

### 2. Downstream Service Completely Down
Service B is unreachable. If Service A doesn't handle this, calls fail immediately. Better than slow, but still needs handling.

### 3. Incorrect Response
Service B returns data that looks correct but is wrong. Hardest to detect. Requires validation and monitoring.

### 4. Increased Latency Spikes
Periodic slow responses cause timeouts. Requires timeout + retry configuration.

---

## Resiliency Patterns

### 1. Timeouts

**Always set timeouts on every network call.** Without timeouts, a single slow service can exhaust your thread pool.

```java
// Spring WebClient with timeout
WebClient client = WebClient.builder()
    .baseUrl("http://inventory-service")
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create()
            .responseTimeout(Duration.ofSeconds(2))  // 2 second max
            .connectionTimeout(Duration.ofMillis(500))
    ))
    .build();
```

Rule of thumb: set timeouts based on your SLA. If your API must respond in 3 seconds, downstream calls should timeout at 1–2 seconds.

### 2. Retries

Retry transient failures — but only for **idempotent** operations. Never retry non-idempotent calls without an idempotency key.

```java
// Resilience4j Retry
RetryConfig retryConfig = RetryConfig.custom()
    .maxAttempts(3)
    .waitDuration(Duration.ofMillis(500))
    .retryExceptions(ConnectException.class, SocketTimeoutException.class)
    .ignoreExceptions(BusinessException.class)  // Don't retry business errors
    .build();

@Retry(name = "inventoryService", fallbackMethod = "fallbackReserve")
public ReservationResult reserve(String sku, int quantity) {
    return inventoryClient.reserve(sku, quantity);
}
```

**Exponential backoff with jitter** — don't retry all at the same time (thundering herd):
```java
RetryConfig.custom()
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(500, 2, 0.5, 10_000))
    .build();
```

### 3. Circuit Breaker

The circuit breaker stops calling a failing service for a period, allowing it to recover. Three states:

```
CLOSED (normal) → too many failures → OPEN (stop calling) → timeout → HALF-OPEN (probe) → success → CLOSED
```

```java
// Resilience4j Circuit Breaker
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)           // Open when 50% of calls fail
    .slowCallRateThreshold(80)          // Also open when 80% of calls are slow
    .slowCallDurationThreshold(Duration.ofSeconds(2))
    .waitDurationInOpenState(Duration.ofSeconds(30))
    .permittedNumberOfCallsInHalfOpenState(3)
    .build();

@CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackReserve")
public ReservationResult reserve(String sku, int quantity) {
    return inventoryClient.reserve(sku, quantity);
}

public ReservationResult fallbackReserve(String sku, int quantity, Exception ex) {
    // Graceful degradation: return a "pending" reservation
    return ReservationResult.pending(sku, quantity);
}
```

### 4. Bulkhead

Isolate resources for different services. If calls to Service B take all available threads, calls to Service C shouldn't be affected.

```java
// Separate thread pool per downstream service
BulkheadConfig bulkheadConfig = BulkheadConfig.custom()
    .maxConcurrentCalls(20)    // Max 20 concurrent calls to this service
    .maxWaitDuration(Duration.ofMillis(100))
    .build();
```

In ships, bulkheads are the walls between compartments. A hull breach floods one compartment — not the whole ship. Same principle applies here.

### 5. Rate Limiting

Protect your service from being overwhelmed by too many incoming requests.

```java
@Bean
public RateLimiter rateLimiter() {
    RateLimiterConfig config = RateLimiterConfig.custom()
        .limitForPeriod(100)                    // 100 requests
        .limitRefreshPeriod(Duration.ofSeconds(1)) // per second
        .timeoutDuration(Duration.ofMillis(50))
        .build();
    return RateLimiter.of("order-api", config);
}
```

---

## Stability Patterns in Combination

Real resilience comes from combining patterns:

```java
// Full resilience stack: Bulkhead → CircuitBreaker → Retry → TimeLimiter
@Bulkhead(name = "inventoryService")
@CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackReserve")
@Retry(name = "inventoryService")
@TimeLimiter(name = "inventoryService")
public CompletableFuture<ReservationResult> reserve(String sku, int quantity) {
    return CompletableFuture.supplyAsync(() -> inventoryClient.reserve(sku, quantity));
}
```

**Resilience4j** with Spring Boot Starter is the go-to library for all these patterns.

---

## Fallbacks and Graceful Degradation

A circuit breaker without a good fallback just converts a slow failure into a fast failure. Design for degradation:

| Service | Primary | Fallback |
|---|---|---|
| Recommendation Service | Personalized recommendations | Show top-10 bestsellers |
| Inventory Service | Real-time stock check | Show "Check availability at checkout" |
| Review Service | User reviews | Show no reviews (hide section) |
| Pricing Service | Dynamic pricing | Show last-known cached price |

### Caching as a Fallback
Cache responses from downstream services. If the service is unavailable, serve stale cache:

```java
@Cacheable(value = "productPrices", key = "#productId")
public Price getPrice(String productId) {
    return pricingClient.getPrice(productId);
}

// Fallback uses the same cache
public Price fallbackGetPrice(String productId, Exception ex) {
    return cacheManager.getCache("productPrices").get(productId, Price.class);
}
```

---

## Load Shedding

When overwhelmed, actively reject non-critical traffic rather than trying to process everything and failing everything. Use rate limiting + priority queues:
- High-priority: payment completion requests
- Low-priority: analytics, reporting, recommendation refreshes

---

## Testing Resilience: Chaos Engineering

Don't wait for production failures to discover your resilience gaps. **Deliberately inject failures** in controlled ways.

**Chaos Monkey (Netflix OSS):** Randomly terminates service instances.

**Chaos Toolkit / Gremlin:** Structured chaos experiments:
- Kill a service instance
- Introduce 200ms network latency
- Saturate a service's CPU
- Drop network packets

**Spring Boot + Chaos Monkey for Spring Boot:**
```yaml
chaos:
  monkey:
    enabled: true
    assaults:
      level: 3
      latency-active: true
      latency-range-start: 1000
      latency-range-end: 3000
```

---

## Summary

| Pattern | Purpose |
|---|---|
| Timeout | Prevent slow downstream from blocking threads |
| Retry (with backoff) | Handle transient failures for idempotent operations |
| Circuit Breaker | Stop hammering a failing service; allow recovery |
| Bulkhead | Isolate resources; prevent cascading failures |
| Rate Limiter | Protect service from overload |
| Fallback | Graceful degradation when primary fails |
| Chaos Engineering | Proactively find resilience gaps |
