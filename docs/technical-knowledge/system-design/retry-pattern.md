---
id: retry-pattern
title: Retry Pattern
sidebar_label: Retry
description: Comprehensive guide to the Retry pattern in microservices — transient vs. persistent errors, exponential backoff, jitter algorithms, idempotency, Resilience4j, distributed retry coordination, and integration with Circuit Breaker and Bulkhead.
tags: [system-design, microservices, resilience, spring-boot, retry, circuit-breaker, resilience4j, backoff, idempotency]
---
import TransientErrorClassifierDiagram from '@site/src/components/TransientErrorClassifierDiagram';
import BackoffStrategiesDiagram from '@site/src/components/BackoffStrategiesDiagram';
import ThunderingHerdDiagram from '@site/src/components/ThunderingHerdDiagram';
import IdempotencyGateDiagram from '@site/src/components/IdempotencyGateDiagram';
import RetryCircuitBreakerInteractionDiagram from '@site/src/components/RetryCircuitBreakerInteractionDiagram';
import RetryDecisionTreeDiagram from '@site/src/components/RetryDecisionTreeDiagram';

# Retry Pattern

The **Retry** pattern automates re-executing a failed operation under the assumption that the failure is **transient** — short-lived and likely to self-correct. Network timeouts, momentary database lock contention, brief upstream overload, and TCP connection drops are all transient. A well-configured retry absorbs these failures silently and delivers a successful result without the caller ever knowing anything went wrong.

The risk is equally well-defined: applied to the wrong class of error, a retry amplifies damage instead of absorbing it — billing a customer twice, flooding an already-overwhelmed service, or masking a bug that requires investigation. Getting retry right means understanding precisely which errors to retry, when to stop, and how to spread retry load across time.

---

## 1. Transient vs. Persistent Errors — The Foundational Decision

The most important decision in retry configuration is **which errors to retry**. Retrying the wrong errors is worse than not retrying at all.

<TransientErrorClassifierDiagram />


**The critical rule**: only retry errors that *could* succeed on a subsequent attempt. `HTTP 400` will return `HTTP 400` on every retry — retrying it wastes time and resources. `HTTP 503` (service temporarily unavailable) may succeed after a brief pause — retrying it is exactly the right response.

### Error Classification Table

| HTTP Status / Exception | Transient? | Retry? | Reason |
|:---|:---|:---|:---|
| `408 Request Timeout` | ✅ Yes | ✅ Yes | Server was busy; may succeed next attempt |
| `429 Too Many Requests` | ✅ Yes | ✅ Yes (honor `Retry-After` header) | Rate limit; backoff until window resets |
| `500 Internal Server Error` | ⚠️ Maybe | ⚠️ Sometimes | Depends — bug (no) vs. transient spike (yes). Check idempotency first |
| `502 Bad Gateway` | ✅ Yes | ✅ Yes | Upstream briefly unavailable |
| `503 Service Unavailable` | ✅ Yes | ✅ Yes | Service overloaded or restarting |
| `504 Gateway Timeout` | ✅ Yes | ✅ Yes (idempotent only) | Network path issue; may clear |
| `400 Bad Request` | ❌ No | ❌ Never | Malformed request — won't change |
| `401 Unauthorized` | ❌ No | ❌ Never | Auth failure — won't change without new token |
| `403 Forbidden` | ❌ No | ❌ Never | Authorization — won't change |
| `404 Not Found` | ❌ No | ❌ Never | Resource doesn't exist |
| `ConnectException` | ✅ Yes | ✅ Yes | Network path failure — transient |
| `SocketTimeoutException` | ✅ Yes | ✅ Yes (idempotent only) | Response timeout — may have processed |
| `NullPointerException` | ❌ No | ❌ Never | Bug — will always throw |

---

## 2. Backoff Strategies

When a failure occurs and a retry is warranted, the caller must wait before retrying — both to give the downstream service time to recover, and to avoid amplifying load during an already-stressed period. The wait duration policy is the **backoff strategy**.

<BackoffStrategiesDiagram />


---

## 3. The Thundering Herd Problem

When a downstream service becomes unavailable and recovers, **every caller that was failing will retry simultaneously** — generating a traffic spike that can overwhelm the service the moment it comes back up, pushing it back into failure. This cycle can repeat indefinitely: service recovers → retry storm → service fails again.

<ThunderingHerdDiagram />


Jitter is not just an optimization — it is the mechanism that allows a service to recover from an incident without being immediately overwhelmed by its own backlog.

---

## 4. Idempotency — The Safety Gate for Retries

**Never retry a non-idempotent operation without an idempotency key.**

An operation is **idempotent** if executing it multiple times produces the same result as executing it once. `GET`, `PUT`, and `DELETE` are idempotent by definition. `POST` is typically not — `POST /payments` called twice creates two payments.

<IdempotencyGateDiagram />


### Implementing Idempotency Keys

The caller generates a unique key per logical operation and sends it as a request header. The server records completed operations indexed by key — if the key has been seen before, it returns the original result instead of processing again.

```java
// Client: generate an idempotency key per logical operation
// The key must be stable across retries for the same logical request
String idempotencyKey = UUID.randomUUID().toString();  // Generated ONCE per operation

@Retry(name = "paymentService")
public PaymentResponse chargeCustomer(String customerId, BigDecimal amount) {
    return restTemplate.exchange(
        RequestEntity.post(URI.create("http://payment-service/payments"))
            .header("Idempotency-Key", idempotencyKey)  // Same key on every retry
            .header("Content-Type", "application/json")
            .body(new PaymentRequest(customerId, amount)),
        PaymentResponse.class
    ).getBody();
}
```

```java
// Server: idempotency enforcement
@RestController
public class PaymentController {

    private final IdempotencyStore idempotencyStore;  // Redis-backed store
    private final PaymentService paymentService;

    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> charge(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody PaymentRequest request) {

        // Check if this key has been processed before
        Optional<PaymentResponse> existing = idempotencyStore.get(idempotencyKey);
        if (existing.isPresent()) {
            log.info("Idempotent replay for key: {}", idempotencyKey);
            return ResponseEntity.ok(existing.get());   // Return original result, no double processing
        }

        // Process the payment
        PaymentResponse response = paymentService.charge(request);

        // Store the result indexed by key (TTL: 24h — idempotency window)
        idempotencyStore.store(idempotencyKey, response, Duration.ofHours(24));

        return ResponseEntity.ok(response);
    }
}
```

### Idempotency Key Design Rules

| Rule | Reason |
|:---|:---|
| Generate the key **once per logical operation**, before the first attempt | The same key must be sent on all retries of the same operation |
| Use a **UUIDv4** or cryptographically random value | Avoids collisions across concurrent callers |
| Do **not** derive the key from request content alone | Two legitimate identical requests (e.g., same customer, same amount) would incorrectly deduplicate |
| Set a **TTL** on the stored result (e.g., 24 hours) | Idempotency keys should not be stored forever; define the window that covers your retry window |
| Store idempotency results in **durable, shared storage** (e.g., Redis, DB) | In-memory stores lose results on restart; per-instance stores miss retries routed to a different instance |

---

## 5. Configuration with Resilience4j and Spring Boot

### Full application.yml Configuration

```yaml
resilience4j:
  retry:
    instances:
      # Standard idempotent service call (safe to retry)
      userService:
        maxAttempts: 3
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2.0       # 200ms → 400ms → 800ms
        exponentialMaxWaitDuration: 5s          # Cap: never wait longer than 5s per attempt
        enableRandomizedWait: true              # Apply full jitter
        randomizedWaitFactor: 0.5              # ±50% variance on the computed backoff
        retryExceptions:
          - java.io.IOException
          - java.net.ConnectException
          - java.net.SocketTimeoutException
          - org.springframework.web.client.ResourceAccessException
          - feign.RetryableException
        ignoreExceptions:
          - org.springframework.web.client.HttpClientErrorException  # 4xx — never retry
          - com.example.exceptions.BusinessRuleException             # Domain errors — never retry
          - com.example.exceptions.ValidationException

      # Payment service — non-idempotent, must use idempotency keys at call site
      # Lower maxAttempts; we're more conservative with money movement
      paymentService:
        maxAttempts: 2
        waitDuration: 500ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2.0
        exponentialMaxWaitDuration: 3s
        enableRandomizedWait: true
        retryExceptions:
          - java.net.ConnectException
          - java.net.SocketTimeoutException
        ignoreExceptions:
          - org.springframework.web.client.HttpClientErrorException
          - com.example.exceptions.PaymentDeclinedException  # Not transient — don't retry

      # External third-party API with Retry-After rate limiting
      externalApiService:
        maxAttempts: 4
        waitDuration: 1s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2.0
        exponentialMaxWaitDuration: 30s
        retryOnResultPredicate: com.example.retry.RetryAfterResultPredicate  # Custom predicate
        retryExceptions:
          - java.io.IOException
          - org.springframework.web.client.HttpServerErrorException
```

### Java Service Implementation

```java
@Service
@Slf4j
public class UserClient {

    private final RestTemplate restTemplate;
    private final MeterRegistry meterRegistry;

    public UserClient(RestTemplate restTemplate, MeterRegistry meterRegistry) {
        this.restTemplate = restTemplate;
        this.meterRegistry = meterRegistry;
    }

    @Retry(name = "userService", fallbackMethod = "getUserFallback")
    public UserResponse getUserProfile(String userId) {
        log.debug("Fetching profile for user: {}", userId);
        return restTemplate.getForObject(
            "http://user-service/users/{id}", UserResponse.class, userId
        );
    }

    // Fallback executes only after ALL retry attempts are exhausted
    // Must have the same return type and parameters as the retried method, plus the Exception
    public UserResponse getUserFallback(String userId, Exception ex) {
        log.error("All retry attempts exhausted for userId={}. Last error: {}", userId, ex.getMessage());
        meterRegistry.counter("retry.fallback.invoked", "service", "userService").increment();
        return UserResponse.empty(userId);   // Return a safe degraded response
    }
}
```

### Programmatic Retry with Event Listeners

For observability and alerting, register event listeners to capture every retry attempt:

```java
@Configuration
public class RetryConfig {

    @Bean
    public RetryRegistry retryRegistry(RetryConfigProperties properties) {
        RetryRegistry registry = RetryRegistry.ofDefaults();

        // Register a listener for all retry instances — emit metrics on every event
        registry.getEventPublisher().onEntryAdded(event -> {
            Retry retry = event.getAddedEntry();
            retry.getEventPublisher()
                .onRetry(e -> {
                    log.warn("Retry attempt #{} for [{}]. Cause: {}",
                        e.getNumberOfRetryAttempts(),
                        e.getName(),
                        e.getLastThrowable().getMessage());
                    Metrics.counter("resilience4j.retry.attempt",
                        "name", e.getName(),
                        "attempt", String.valueOf(e.getNumberOfRetryAttempts())
                    ).increment();
                })
                .onSuccess(e -> log.debug("Retry [{}] succeeded after {} attempt(s)",
                    e.getName(), e.getNumberOfRetryAttempts()))
                .onError(e -> {
                    log.error("All retries exhausted for [{}] after {} attempt(s). Final error: {}",
                        e.getName(), e.getNumberOfRetryAttempts(), e.getLastThrowable().getMessage());
                    Metrics.counter("resilience4j.retry.exhausted", "name", e.getName()).increment();
                })
                .onIgnoredError(e -> log.debug("Non-retryable error ignored for [{}]: {}",
                    e.getName(), e.getLastThrowable().getClass().getSimpleName()));
        });

        return registry;
    }
}
```

### Honoring `Retry-After` Headers

When a third-party API returns `HTTP 429 Too Many Requests`, it typically includes a `Retry-After` header specifying how many seconds to wait before the next attempt. Ignoring this header and retrying on your configured backoff schedule may violate the API's rate limiting contract and result in your API key being suspended.

```java
@Component
public class RetryAfterResultPredicate implements Predicate<ResponseEntity<?>> {

    @Override
    public boolean test(ResponseEntity<?> response) {
        if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
            String retryAfter = response.getHeaders().getFirst("Retry-After");
            if (retryAfter != null) {
                long waitSeconds = Long.parseLong(retryAfter);
                log.warn("Rate limited — Retry-After: {}s", waitSeconds);
                try {
                    Thread.sleep(Duration.ofSeconds(waitSeconds).toMillis());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return true;  // Signal Resilience4j to retry
            }
        }
        return false;
    }
}
```

---

## 6. Retry in Reactive / Async Contexts

Retries in reactive pipelines (Project Reactor / WebFlux) behave differently from blocking retries — they must be expressed as operators in the reactive chain, not as imperative loops.

### Project Reactor — `retryWhen` with Exponential Backoff

```java
@Service
public class ReactiveUserClient {

    private final WebClient webClient;

    public Mono<UserResponse> getUserProfile(String userId) {
        return webClient.get()
            .uri("/users/{id}", userId)
            .retrieve()
            .onStatus(HttpStatusCode::is5xxServerError, response ->
                Mono.error(new TransientServiceException("Server error: " + response.statusCode())))
            .bodyToMono(UserResponse.class)
            .retryWhen(
                Retry.backoff(3, Duration.ofMillis(200))        // maxAttempts=3, initialDelay=200ms
                     .maxBackoff(Duration.ofSeconds(5))          // cap at 5s
                     .jitter(0.5)                                // ±50% jitter
                     .filter(ex -> ex instanceof TransientServiceException)  // only retry transient
                     .onRetryExhaustedThrow((spec, signal) ->    // convert to meaningful exception
                         new ServiceUnavailableException("User service unavailable", signal.failure()))
            )
            .onErrorReturn(ServiceUnavailableException.class, UserResponse.empty(userId));
    }
}
```

### Key Differences from Blocking Retry

| Aspect | Blocking (Resilience4j `@Retry`) | Reactive (`retryWhen`) |
|:---|:---|:---|
| Thread during wait | **Blocked** — occupies a thread during backoff delay | **Non-blocking** — thread released during wait |
| Throughput impact | High — waiting threads are unavailable for other work | Low — virtual scheduling, no thread held |
| Fallback mechanism | `fallbackMethod` annotation parameter | `.onErrorReturn()` / `.onErrorResume()` operator |
| Retry condition | `retryExceptions` / `ignoreExceptions` config | `.filter()` predicate on the exception type |
| Max backoff cap | `exponentialMaxWaitDuration` | `.maxBackoff()` operator |

In a reactive or virtual-thread (JDK 21+) application, always prefer reactive retry operators over blocking `@Retry` annotations — the blocking annotation holds a platform thread for the entire retry wait duration, which degrades throughput under concurrency.

---

## 7. Retry Across Distributed Systems

### The Total Retry Amplification Problem

In a microservice call chain, retries at each layer **multiply** — not add. A 3-hop call chain where each hop retries 3 times can generate up to **27 requests** to the innermost service for a single user request.

```
User Request
    │
    ▼
Service A (3 retries) ──► Service B (3 retries) ──► Service C (3 retries) ──► Database
                                                         ↑
                                         Up to 3 × 3 × 3 = 27 DB calls
                                         for 1 user-facing request
```

This amplification is the primary cause of **retry storms** in microservice architectures — a single downstream degradation triggers a cascade of retried calls that overwhelms the entire system.

### Mitigations

**Option 1: Retry only at the outermost layer**

Configure retries only in the API gateway or the edge service, and have all internal services propagate errors without retrying. This caps the amplification factor at 1x regardless of chain depth.

**Option 2: Propagate a `Retry-Budget` header**

```java
// API Gateway: set the retry budget header for this request
headers.set("X-Retry-Budget", "2");  // This request may be retried up to 2 more times

// Downstream service: decrement and propagate
int budget = Integer.parseInt(request.getHeader("X-Retry-Budget"));
if (budget <= 0) {
    throw new RetryBudgetExhaustedException("No retry budget remaining");
}
// Decrement and forward
outboundRequest.header("X-Retry-Budget", String.valueOf(budget - 1));
```

**Option 3: Use idempotency + non-retry pattern for deep chains**

For deep call chains processing business operations (orders, payments), consider a request-reply pattern with a job queue and polling rather than synchronous retries — the queue absorbs the failure and replays when ready, without tying up threads or cascading retries.

### Retry and Circuit Breaker Interaction

Retry and Circuit Breaker are complementary — they operate at different timescales and protect against different failure modes:

<RetryCircuitBreakerInteractionDiagram />


**Order matters**: the retry should be **inside** (closer to the call) and the circuit breaker **outside**. If you reverse the order, a tripped circuit breaker will reject the call before the retry can fire — defeating the purpose of retry for transient errors.

```java
// Correct order: @Retry wraps the call; @CircuitBreaker wraps the retry
@CircuitBreaker(name = "userService", fallbackMethod = "circuitBreakerFallback")
@Retry(name = "userService", fallbackMethod = "retryFallback")
public UserResponse getUserProfile(String userId) {
    return restTemplate.getForObject("http://user-service/users/{id}", UserResponse.class, userId);
}
```

With this ordering:
- A transient error fires the retry (up to `maxAttempts` times).
- If retries continue to fail, the circuit breaker counts failures.
- When the failure rate threshold is breached, the circuit breaker opens — future calls fail immediately without triggering retries, giving the downstream service time to recover.

For a detailed treatment of circuit breaker states, thresholds, and half-open behavior, see the **[Circuit Breaker Pattern](./circuit-breaker.md)** guide.

---

## 8. Retry Observability

A retry that is invisible in your monitoring is a silent early warning sign being ignored. Instrument every layer.

### Key Metrics to Track

| Metric | What It Tells You | Alert Condition |
|:---|:---|:---|
| `retry.attempt.count` (by service, attempt#) | How frequently each service is being retried | Baseline increase → upstream degradation |
| `retry.exhausted.count` | Retries that hit `maxAttempts` without success | Any increment → potential user impact |
| `retry.fallback.invoked` | Calls that fell back to degraded behavior | Any increment → degraded user experience |
| `retry.success.after.n` | Which attempt number succeeded | Mostly attempt 1 is healthy; mostly attempt 3 = problem |
| `downstream.latency.p99` | P99 latency of the downstream service | Rising latency → precursor to timeouts |

### Prometheus Metrics with Resilience4j

Resilience4j exports metrics automatically when `resilience4j-micrometer` is on the classpath:

```promql
# Rate of retry attempts per service (should be low in normal operation)
sum(rate(resilience4j_retry_calls_seconds_count{kind="failed_with_retry"}[5m])) by (name)

# Rate of exhausted retries (non-zero = active user impact)
sum(rate(resilience4j_retry_calls_seconds_count{kind="failed_without_retry"}[5m])) by (name)

# Success rate on first attempt (declining = upstream degrading)
sum(rate(resilience4j_retry_calls_seconds_count{kind="successful_without_retry"}[5m])) by (name)
/
sum(rate(resilience4j_retry_calls_seconds_count[5m])) by (name)
```

### Structured Logging for Retry Correlation

Log retry attempts with enough context to reconstruct what happened to a single request:

```java
@Retry(name = "orderService")
public OrderResponse getOrder(String orderId) {
    MDC.put("orderId", orderId);  // Correlation ID propagated through all log lines
    try {
        return restTemplate.getForObject("/orders/{id}", OrderResponse.class, orderId);
    } catch (Exception e) {
        // Retry attempt number is available via Resilience4j's RetryContext
        // but simplest is to log in the event listener (see Section 5)
        throw e;
    }
}
```

With structured logging, a failed-after-3-retries event produces correlated log lines:

```json
{"level":"WARN","msg":"Retry attempt #1","service":"orderService","orderId":"ord-123","cause":"ConnectException"}
{"level":"WARN","msg":"Retry attempt #2","service":"orderService","orderId":"ord-123","cause":"ConnectException"}
{"level":"WARN","msg":"Retry attempt #3","service":"orderService","orderId":"ord-123","cause":"ConnectException"}
{"level":"ERROR","msg":"All retries exhausted","service":"orderService","orderId":"ord-123"}
```

This makes it immediately clear whether `ord-123` had a transient blip (succeeded on attempt 2) or a sustained failure (exhausted all 3 attempts).

---

## 9. Common Failure Modes and Anti-Patterns

### 1. Retrying Non-Idempotent Operations Without an Idempotency Key

The most dangerous anti-pattern. A `POST /payments/charge` that times out may have already been processed by the payment provider. Retrying without an idempotency key creates a duplicate charge.

```
Rule: POST operations must use idempotency keys before they may be retried.
      If you cannot add an idempotency key, do not retry — fail and let the
      user decide whether to try again (with a UI-level idempotency key).
```

### 2. Infinite or Extremely High `maxAttempts`

```yaml
# WRONG
maxAttempts: 50   # Ties up caller thread for potentially minutes
maxAttempts: -1   # Infinite retries — caller blocks forever
```

Keep `maxAttempts` between 3 and 5 for synchronous calls. The retry pattern is for transient errors that resolve in milliseconds to seconds — not for outages that last minutes. Sustained unavailability is a circuit breaker concern, not a retry concern.

### 3. Catching `Exception.class` as a Retryable Exception

```yaml
# WRONG — retries NullPointerException, ClassCastException, validation errors
retryExceptions:
  - java.lang.Exception

# CORRECT — retry only network-level transient errors
retryExceptions:
  - java.io.IOException
  - java.net.ConnectException
  - java.net.SocketTimeoutException
```

Retrying a `NullPointerException` will always fail — the bug doesn't fix itself between attempts. These retries waste time and delay the error that a developer needs to see.

### 4. No Maximum Backoff Cap

Without a cap, exponential backoff can grow to absurd wait times:

```
Attempt 1: 200ms
Attempt 2: 400ms
Attempt 3: 800ms
...
Attempt 10: 200 × 2^9 = 102,400ms = 102 seconds
```

Always set `exponentialMaxWaitDuration` to a reasonable cap (typically 5–30 seconds for synchronous calls).

### 5. Retry Without Timeout

If the downstream service is extremely slow (not failing, just slow), a retry may fire while the previous attempt is still in flight, resulting in multiple concurrent in-flight requests. Always configure **connection timeout** and **read timeout** on your HTTP client to guarantee that each attempt has a maximum wall-clock duration:

```java
@Bean
public RestTemplate restTemplate() {
    HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofMillis(1000));   // Max wait to establish connection
    factory.setReadTimeout(Duration.ofMillis(3000));       // Max wait for server response
    return new RestTemplate(factory);
}
```

### 6. Session Affinity Breaking Retry Distribution

If your load balancer uses sticky sessions (IP hash or cookie-based affinity), all retry attempts from the same caller will be routed to the same backend instance — the one that is already failing. Retries will always hit the same broken pod.

```
Fix: disable sticky sessions at the load balancer level for services you want
to retry across, OR implement client-side load balancing (Spring Cloud LoadBalancer,
Ribbon) that re-selects an instance on each retry attempt.
```

---

## 10. Decision Guide — When to Use Retry

<RetryDecisionTreeDiagram />


---

## 🔗 Related Concepts

- [Circuit Breaker Pattern](./circuit-breaker.md)
- [Bulkhead Pattern](./bulkhead.md)
- [Timeout Pattern](./timeout.md)
- [Idempotency in APIs](./idempotency.md)
- [Rate Limiting](./rate-limiting.md)
- [Resilience4j Reference](./resilience4j.md)