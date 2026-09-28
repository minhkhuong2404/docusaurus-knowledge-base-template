---
id: circuit-breaker-pattern
title: Circuit Breaker Pattern
sidebar_label: Circuit Breaker
description: Deep-dive into the Circuit Breaker pattern — state machine internals, sliding window mechanics, Resilience4j configuration, bulkhead integration, fallback strategies, observability, and production failure modes for senior Spring Boot engineers.
tags: [system-design, microservices, resilience, spring-boot, resilience4j, circuit-breaker, bulkhead, fallback]
---

import CircuitBreakerDiagram from '@site/src/components/CircuitBreakerDiagram';
import CascadingFailureDiagram from '@site/src/components/CascadingFailureDiagram';
import CountBasedSlidingWindowDiagram from '@site/src/components/CountBasedSlidingWindowDiagram';
import TimeBasedSlidingWindowDiagram from '@site/src/components/TimeBasedSlidingWindowDiagram';
import DecorationOrderDiagram from '@site/src/components/DecorationOrderDiagram';

# Circuit Breaker Pattern

The **Circuit Breaker** pattern prevents a single failing downstream dependency from triggering cascading thread-exhaustion failure across an entire distributed system.

Named after the electrical component: just as a household circuit breaker cuts power when current exceeds safe levels — protecting wiring from fire — the software circuit breaker cuts traffic when downstream failure rates exceed safe thresholds — protecting thread pools and caller latency from collapse.

---

## The Problem It Solves: Cascading Failure

<CascadingFailureDiagram />


---

## State Machine Internals

<CircuitBreakerDiagram />

### CLOSED State

Normal operating mode. Every call passes through to the downstream service. The circuit breaker records outcomes into a **sliding window** (described below).

When the sliding window accumulates enough calls (`minimumNumberOfCalls`) and the computed failure rate or slow-call rate breaches the configured threshold, the breaker **trips to OPEN**.

### OPEN State

All calls are rejected immediately — **without touching the network**. The breaker throws `CallNotPermittedException` (or invokes a fallback) at nanosecond speed.

This achieves two goals simultaneously:
1. **Protects the caller** — no threads blocked waiting on a dead service
2. **Protects the downstream** — stops retry storms from hammering a struggling service, giving it headroom to recover

### HALF-OPEN State

After `waitDurationInOpenState` elapses, the breaker enters HALF-OPEN and admits exactly `permittedNumberOfCallsInHalfOpenState` probe requests. These are real calls to the downstream service.

- If **all probes succeed** → CLOSED (recovered)
- If **any probe fails** → OPEN again (not yet recovered; reset the cooldown timer)

This avoids premature recovery: a service that looks healthy for one request may still be flapping.

---

## Sliding Window Mechanics

The sliding window is how the circuit breaker computes failure and slow-call rates. Resilience4j supports two modes:

### COUNT_BASED Sliding Window

Tracks the last `N` calls as a circular array of call outcomes. Each new call overwrites the oldest entry.

<CountBasedSlidingWindowDiagram />


**Use when:** Call rate is steady and predictable. The window represents a meaningful number of operations.

### TIME_BASED Sliding Window

Tracks all calls within the last `N` seconds using a circular array of per-second aggregation buckets.

<TimeBasedSlidingWindowDiagram />


**Use when:** Call rate varies significantly (e.g., bursty traffic). Time-based windows prevent a burst of failures from staying in the window indefinitely.

### Minimum Number of Calls

`minimumNumberOfCalls` is a critical guard: the breaker will not compute rates or trip until at least this many calls have been recorded in the current window. Without it, a single failure on startup (1/1 = 100%) would immediately trip the breaker.

---

## Setup: Dependencies

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.2.0</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

:::warning[AOP Dependency is Mandatory]
`resilience4j-spring-boot3` uses Spring AOP for `@CircuitBreaker` annotation processing. Without `spring-boot-starter-aop`, annotations silently do nothing — no error is thrown, calls just pass through unprotected.
:::

---

## Production Configuration

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:

      # Payment service — strict: financial operations must fail fast
      paymentService:
        registerHealthIndicator: true
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 20              # Track last 20 calls
        minimumNumberOfCalls: 10           # Don't trip on the first few calls at startup
        failureRateThreshold: 50           # Trip if >= 50% of calls fail
        slowCallRateThreshold: 80          # Trip if >= 80% of calls exceed slowCallDurationThreshold
        slowCallDurationThreshold: 2s      # A call taking > 2s is "slow"
        waitDurationInOpenState: 30s       # Stay OPEN for 30s before probing
        permittedNumberOfCallsInHalfOpenState: 5
        automaticTransitionFromOpenToHalfOpenEnabled: true
        # Exception classification
        recordExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - org.springframework.web.client.HttpServerErrorException  # 5xx only
        ignoreExceptions:
          - com.example.exceptions.BusinessRuleException   # 400-class — not a circuit failure
          - com.example.exceptions.ResourceNotFoundException  # 404 — not a circuit failure

      # Notification service — lenient: degradation is acceptable
      notificationService:
        registerHealthIndicator: true
        slidingWindowType: TIME_BASED
        slidingWindowSize: 60              # Track calls over last 60 seconds
        minimumNumberOfCalls: 5
        failureRateThreshold: 70
        slowCallRateThreshold: 90
        slowCallDurationThreshold: 5s
        waitDurationInOpenState: 10s
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true

  # Timeout configuration — ALWAYS pair with circuit breaker
  timelimiter:
    instances:
      paymentService:
        timeoutDuration: 3s               # Hard timeout per call
        cancelRunningFuture: true
      notificationService:
        timeoutDuration: 5s
        cancelRunningFuture: true

  # Retry — apply AFTER circuit breaker in the decoration chain
  retry:
    instances:
      paymentService:
        maxAttempts: 3
        waitDuration: 500ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
        ignoreExceptions:
          - com.example.exceptions.BusinessRuleException
```

---

## Java Implementation

### Basic Circuit Breaker with Fallback

```java
@Service
@Slf4j
public class OrderService {

    private final PaymentClient paymentClient;

    public OrderService(PaymentClient paymentClient) {
        this.paymentClient = paymentClient;
    }

    @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
    @TimeLimiter(name = "paymentService")          // Hard timeout
    @Retry(name = "paymentService")                // Retry before tripping the breaker
    public CompletableFuture<PaymentResponse> processPayment(Order order) {
        return CompletableFuture.supplyAsync(() ->
            paymentClient.charge(order.getId(), order.getAmount())
        );
    }

    // Fallback for CallNotPermittedException (circuit OPEN) and runtime errors
    // MUST match processPayment signature + Throwable as last parameter
    public CompletableFuture<PaymentResponse> paymentFallback(Order order, CallNotPermittedException ex) {
        log.warn("Circuit OPEN for paymentService. Returning PENDING state. orderId={}",
            order.getId());
        return CompletableFuture.completedFuture(
            PaymentResponse.pending(order.getId(), "Payment queued — will retry automatically")
        );
    }

    // Separate fallback for general exceptions (timeout, IO errors)
    public CompletableFuture<PaymentResponse> paymentFallback(Order order, Exception ex) {
        log.error("Payment call failed. orderId={}, error={}", order.getId(), ex.getMessage());
        return CompletableFuture.completedFuture(
            PaymentResponse.pending(order.getId(), "Payment temporarily unavailable")
        );
    }
}
```

:::info[Fallback Method Resolution]
Resilience4j resolves fallback methods by **most specific exception type first**. Define separate fallback signatures for `CallNotPermittedException` (circuit open) and `Exception` (call failure) to handle each case with appropriate logging and logic.
:::

### Programmatic Usage (No Annotation)

For fine-grained control — useful in batch jobs, background processors, or when the call is constructed dynamically:

```java
@Service
@Slf4j
public class PaymentProcessor {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final PaymentClient paymentClient;
    private final MeterRegistry meterRegistry;

    public PaymentResponse processWithCircuitBreaker(Order order) {
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");

        // Decorate the supplier — does not execute yet
        Supplier<PaymentResponse> decoratedCall = CircuitBreaker
            .decorateSupplier(cb, () -> paymentClient.charge(order.getId(), order.getAmount()));

        try {
            return Try.ofSupplier(decoratedCall)
                .recover(CallNotPermittedException.class, ex -> handleOpenCircuit(order, ex))
                .recover(Exception.class, ex -> handleCallFailure(order, ex))
                .get();
        } finally {
            // Always emit custom metric regardless of outcome
            meterRegistry.gauge("circuit.breaker.state",
                Tags.of("name", "paymentService"),
                cb.getState().getOrder());
        }
    }

    // Listen to state transition events for alerting
    @PostConstruct
    public void registerEventListeners() {
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");

        cb.getEventPublisher()
            .onStateTransition(event -> {
                log.warn("Circuit breaker state transition: {} → {}",
                    event.getStateTransition().getFromState(),
                    event.getStateTransition().getToState());

                // Alert ops when circuit trips to OPEN
                if (event.getStateTransition().getToState() == CircuitBreaker.State.OPEN) {
                    alertService.warn("CIRCUIT_OPEN", "paymentService circuit breaker tripped");
                }
            })
            .onCallNotPermitted(event ->
                meterRegistry.counter("circuit.breaker.rejected", "name", "paymentService").increment()
            )
            .onError(event ->
                log.error("Circuit breaker recorded failure. duration={}ms error={}",
                    event.getElapsedDuration().toMillis(), event.getThrowable().getMessage())
            );
    }

    private PaymentResponse handleOpenCircuit(Order order, CallNotPermittedException ex) {
        meterRegistry.counter("payment.circuit.open.rejections").increment();
        return PaymentResponse.pending(order.getId(), "Payment service temporarily suspended");
    }

    private PaymentResponse handleCallFailure(Order order, Exception ex) {
        meterRegistry.counter("payment.failures", "error", ex.getClass().getSimpleName()).increment();
        return PaymentResponse.pending(order.getId(), "Payment temporarily unavailable");
    }
}
```

### Decoration Order Matters

When combining multiple Resilience4j decorators, the **order of decoration determines behavior**:

<DecorationOrderDiagram />


With annotations, the order is controlled by `@Order` on the aspect beans or via the `spring.cloud.circuitbreaker.resilience4j.aspect-order` property:

```java
// Explicit programmatic decoration chain
Supplier<PaymentResponse> call = () -> paymentClient.charge(orderId, amount);

Supplier<PaymentResponse> decorated = Decorators.ofSupplier(call)
    .withBulkhead(bulkheadRegistry.bulkhead("paymentService"))
    .withCircuitBreaker(circuitBreakerRegistry.circuitBreaker("paymentService"))
    .withRetry(retryRegistry.retry("paymentService"), scheduledExecutorService)
    .withTimeLimiter(timeLimiterRegistry.timeLimiter("paymentService"), scheduledExecutorService)
    .withFallback(
        List.of(CallNotPermittedException.class, TimeoutException.class),
        ex -> PaymentResponse.pending(orderId, "Temporarily unavailable")
    )
    .decorate();
```

---

## Bulkhead: Complementary Isolation

The circuit breaker controls **whether** calls are allowed. The bulkhead controls **how many concurrent calls** are allowed. They are complementary and should be used together.

Without a bulkhead, even with a circuit breaker closed, a slow downstream can still exhaust the thread pool if concurrent call volume is high enough.

### Semaphore Bulkhead (same thread)

```yaml
resilience4j:
  bulkhead:
    instances:
      paymentService:
        maxConcurrentCalls: 20        # Max 20 concurrent calls to payment service
        maxWaitDuration: 100ms        # Wait up to 100ms for a permit before rejecting
```

```java
@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
@Bulkhead(name = "paymentService", fallbackMethod = "bulkheadFallback")
public PaymentResponse processPayment(Order order) {
    return paymentClient.charge(order.getId(), order.getAmount());
}

public PaymentResponse bulkheadFallback(Order order, BulkheadFullException ex) {
    log.warn("Payment service bulkhead full. Shedding load. orderId={}", order.getId());
    throw new ServiceUnavailableException("Payment service at capacity — please retry");
}
```

### Thread Pool Bulkhead (separate thread pool)

Provides true isolation — the calling thread is released immediately; the actual call runs in a dedicated thread pool. If the payment service is slow, it only exhausts the payment-service-specific pool, not the main request thread pool.

```yaml
resilience4j:
  thread-pool-bulkhead:
    instances:
      paymentService:
        maxThreadPoolSize: 10
        coreThreadPoolSize: 5
        queueCapacity: 20
        keepAliveDuration: 20ms
```

```java
@Bulkhead(name = "paymentService", type = Bulkhead.Type.THREADPOOL, fallbackMethod = "bulkheadFallback")
public CompletableFuture<PaymentResponse> processPayment(Order order) {
    // Runs in paymentService thread pool, not the HTTP request thread
    return CompletableFuture.supplyAsync(() ->
        paymentClient.charge(order.getId(), order.getAmount())
    );
}
```

| | Semaphore Bulkhead | Thread Pool Bulkhead |
|:---|:---|:---|
| **Isolation** | Limits concurrency; same thread | True isolation; dedicated thread pool |
| **Overhead** | Minimal | Thread context switch overhead |
| **Best for** | Non-blocking / reactive calls | Blocking I/O calls |
| **Caller thread released** | No — blocked until permit | Yes — returns immediately |

---

## Exception Classification: The Most Misunderstood Config

Not all exceptions should count as circuit breaker failures. Misconfiguring this is the single most common production mistake.

```java
// WRONG: Default config counts ALL exceptions as failures
// A flood of 404s (user not found) will trip the payment circuit
@CircuitBreaker(name = "paymentService")
public PaymentResponse getPayment(String paymentId) {
    return paymentClient.getById(paymentId);   // Throws NotFoundException on 404
}

// CORRECT: Classify exceptions explicitly
```

```yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        recordExceptions:
          # Infrastructure / transient failures — count toward failure rate
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - java.net.SocketTimeoutException
          - org.springframework.web.client.HttpServerErrorException$InternalServerError  # 500
          - org.springframework.web.client.HttpServerErrorException$ServiceUnavailable   # 503
          - org.springframework.web.client.HttpServerErrorException$GatewayTimeout       # 504

        ignoreExceptions:
          # Business / client errors — NOT infrastructure failures
          - com.example.exception.ResourceNotFoundException      # 404
          - com.example.exception.ValidationException            # 400
          - com.example.exception.BusinessRuleViolationException # 422
          - com.example.exception.UnauthorizedException          # 401
```

For HTTP clients using `RestClient` or `WebClient`, map HTTP status codes to exception types explicitly:

```java
@Configuration
public class PaymentClientConfig {

    @Bean
    public RestClient paymentRestClient(RestClient.Builder builder) {
        return builder
            .baseUrl("https://payment-service")
            .defaultStatusHandler(
                status -> status.is5xxServerError(),
                (request, response) -> {
                    throw new PaymentServiceException(
                        "Payment service error: " + response.getStatusCode()
                    );
                }
            )
            .defaultStatusHandler(
                status -> status == HttpStatus.NOT_FOUND,
                (request, response) -> {
                    throw new PaymentNotFoundException("Payment not found");
                    // This is IGNORED by the circuit breaker — correct
                }
            )
            .build();
    }
}
```

---

## Fallback Strategy Design

A fallback should do one of the following — in priority order:

### 1. Return Cached Data
```java
public ProductResponse productFallback(String productId, Exception ex) {
    // Return last-known-good value from local cache
    return productCache.getIfPresent(productId)
        .map(cached -> cached.withStaleWarning(true))
        .orElseThrow(() -> new ServiceUnavailableException("Product service unavailable"));
}
```

### 2. Return a Degraded but Safe Response
```java
public RecommendationResponse recommendationFallback(String userId, Exception ex) {
    // Return generic bestsellers instead of personalized recommendations
    log.info("Recommendation service unavailable. Returning defaults for userId={}", userId);
    return RecommendationResponse.defaults(DEFAULT_PRODUCT_IDS);
}
```

### 3. Enqueue for Async Retry
```java
public PaymentResponse paymentFallback(Order order, Exception ex) {
    // Queue the payment for retry when the service recovers
    retryQueue.enqueue(RetryablePayment.from(order));
    return PaymentResponse.pending(order.getId(), "Payment queued for processing");
}
```

### 4. Fail Fast with a Meaningful Error
```java
public OrderResponse inventoryFallback(Order order, Exception ex) {
    // Inventory check is mandatory — cannot degrade gracefully
    throw new ServiceUnavailableException(
        "Cannot process order: inventory service temporarily unavailable. Please try again shortly."
    );
}
```

**Never return silent empty responses.** A fallback that returns `Optional.empty()` or `null` without logging causes ghost bugs where callers behave incorrectly with no observable signal.

---

## Observability

Resilience4j exposes metrics to Micrometer automatically when `registerHealthIndicator: true` and Actuator is on the classpath.

### Actuator Endpoint

```bash
# View all circuit breaker states
GET /actuator/health

# Response:
{
  "components": {
    "circuitBreakers": {
      "details": {
        "paymentService": {
          "status": "CIRCUIT_OPEN",
          "details": {
            "failureRate": "65.0%",
            "slowCallRate": "20.0%",
            "bufferedCalls": 20,
            "failedCalls": 13,
            "state": "OPEN"
          }
        }
      }
    }
  }
}
```

### Prometheus / Micrometer Metrics

```
# Automatically exposed metrics:
resilience4j_circuitbreaker_calls_total{name="paymentService", kind="successful"}
resilience4j_circuitbreaker_calls_total{name="paymentService", kind="failed"}
resilience4j_circuitbreaker_calls_total{name="paymentService", kind="not_permitted"}
resilience4j_circuitbreaker_calls_total{name="paymentService", kind="ignored"}
resilience4j_circuitbreaker_state{name="paymentService", state="closed"}    # 1 or 0
resilience4j_circuitbreaker_state{name="paymentService", state="open"}      # 1 or 0
resilience4j_circuitbreaker_state{name="paymentService", state="half_open"} # 1 or 0
resilience4j_circuitbreaker_failure_rate{name="paymentService"}
resilience4j_circuitbreaker_slow_call_rate{name="paymentService"}
resilience4j_circuitbreaker_calls_seconds{name="paymentService", kind="successful"}
```

### Recommended Grafana Alerts

```yaml
# Alert: Circuit breaker tripped to OPEN
- alert: CircuitBreakerOpen
  expr: resilience4j_circuitbreaker_state{state="open"} == 1
  for: 30s
  labels:
    severity: warning
  annotations:
    summary: "Circuit breaker {{ $labels.name }} is OPEN"
    description: "Check downstream service health"

# Alert: High rejection rate (circuit being hammered while open)
- alert: CircuitBreakerHighRejections
  expr: rate(resilience4j_circuitbreaker_calls_total{kind="not_permitted"}[5m]) > 100
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "High circuit breaker rejection rate for {{ $labels.name }}"

# Alert: Failure rate approaching threshold
- alert: CircuitBreakerFailureRateHigh
  expr: resilience4j_circuitbreaker_failure_rate > 40
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Circuit breaker {{ $labels.name }} failure rate is {{ $value }}%"
```

---

## Testing Circuit Breaker Behavior

### Unit Test: Force State Transitions

```java
@SpringBootTest
class OrderServiceCircuitBreakerTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @MockBean
    private PaymentClient paymentClient;

    @Test
    void shouldTripToOpen_whenFailureRateExceedsThreshold() {
        // Simulate payment service failures
        when(paymentClient.charge(any(), any()))
            .thenThrow(new PaymentServiceException("Service unavailable"));

        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");

        // Fire minimumNumberOfCalls to populate the sliding window
        for (int i = 0; i < 10; i++) {
            try {
                orderService.processPayment(testOrder());
            } catch (Exception ignored) {}
        }

        assertThat(cb.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    void shouldReturnFallback_whenCircuitIsOpen() {
        // Manually force OPEN state — no need to generate failures
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");
        cb.transitionToOpenState();

        PaymentResponse response = orderService.processPayment(testOrder());

        assertThat(response.getStatus()).isEqualTo("PENDING_PAYMENT_RETRY");
        verifyNoInteractions(paymentClient);  // confirm no actual call was made
    }

    @Test
    void shouldRecoverToClose_whenProbeSucceedsInHalfOpen() {
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");
        cb.transitionToOpenState();
        cb.transitionToHalfOpenState();

        when(paymentClient.charge(any(), any()))
            .thenReturn(PaymentResponse.success("txn-001", BigDecimal.TEN));

        // Fire permittedNumberOfCallsInHalfOpenState successful probes
        for (int i = 0; i < 5; i++) {
            orderService.processPayment(testOrder());
        }

        assertThat(cb.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    void shouldNotCountBusinessExceptions_asFailures() {
        when(paymentClient.charge(any(), any()))
            .thenThrow(new ResourceNotFoundException("Payment not found"));

        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");

        for (int i = 0; i < 15; i++) {
            try {
                orderService.processPayment(testOrder());
            } catch (ResourceNotFoundException ignored) {}
        }

        // Business exceptions are ignored — circuit should stay CLOSED
        assertThat(cb.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
        assertThat(cb.getMetrics().getNumberOfFailedCalls()).isEqualTo(0);
    }

    private Order testOrder() {
        return Order.builder().id(UUID.randomUUID().toString()).amount(BigDecimal.TEN).build();
    }
}
```

### Integration Test: WireMock for Realistic Failure Simulation

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@WireMockTest
class PaymentCircuitBreakerIntegrationTest {

    @Test
    void shouldTripCircuit_onConsistentServiceUnavailable(WireMockRuntimeInfo wm) {
        // Stub 503 responses from payment service
        stubFor(post(urlEqualTo("/payments"))
            .willReturn(aResponse()
                .withStatus(503)
                .withFixedDelay(100)));

        // Generate enough failures to trip the breaker
        for (int i = 0; i < 10; i++) {
            try { orderService.processPayment(testOrder()); } catch (Exception ignored) {}
        }

        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");
        assertThat(cb.getState()).isEqualTo(CircuitBreaker.State.OPEN);

        // Now stub a recovery
        stubFor(post(urlEqualTo("/payments"))
            .willReturn(aResponse().withStatus(200).withBody("{\"status\":\"SUCCESS\"}")));

        // Fast-forward to HALF-OPEN (in tests, manually transition)
        cb.transitionToHalfOpenState();

        orderService.processPayment(testOrder());

        // After probe succeeds, should close
        assertThat(cb.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
```

---

## Common Gotchas & Anti-Patterns

### 1. Counting Business Errors as Failures

**Problem:** `404 Not Found` or `400 Bad Request` responses from the downstream API count toward the failure rate. A spike in invalid user requests trips the circuit, blocking all traffic including valid requests.

**Fix:** Explicitly configure `ignoreExceptions` for all business/validation exception types. Only infrastructure failures (5xx, timeouts, IOExceptions) should count.

### 2. Omitting Timeouts

**Problem:** Circuit breakers measure failure rate, but if the downstream service hangs indefinitely (no socket timeout set), the call never fails — it just blocks a thread forever. The circuit breaker never sees a failure; the thread pool exhausts silently.

**Fix:** Always configure `TimeLimiter` alongside the circuit breaker, and set socket-level timeouts on the HTTP client:

```java
@Bean
public RestClient paymentRestClient() {
    HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(1))
        .build();

    return RestClient.builder()
        .requestFactory(new JdkClientHttpRequestFactory(httpClient))
        .build();
}
```

### 3. Sharing One Breaker Across Unrelated Services

**Problem:** `@CircuitBreaker(name = "shared")` used for both payment and notification calls. Payment failures trip the circuit and start rejecting notification calls.

**Fix:** One circuit breaker instance per downstream service interface. Never share.

```java
// WRONG
@CircuitBreaker(name = "shared")
public PaymentResponse charge(...) { ... }

@CircuitBreaker(name = "shared")   // shares state with payment — dangerous
public void sendNotification(...) { ... }

// CORRECT
@CircuitBreaker(name = "paymentService")
public PaymentResponse charge(...) { ... }

@CircuitBreaker(name = "notificationService")
public void sendNotification(...) { ... }
```

### 4. Self-Invocation Bypasses AOP

**Problem:** Calling a `@CircuitBreaker`-annotated method from within the same bean bypasses Spring AOP — the circuit breaker does not execute.

```java
@Service
public class OrderService {

    @CircuitBreaker(name = "paymentService")
    public PaymentResponse processPayment(Order order) { ... }

    public void checkout(Order order) {
        processPayment(order);   // BYPASSES circuit breaker — self-invocation!
    }
}
```

**Fix:** Inject the bean into itself via `ApplicationContext` or split into separate beans:

```java
@Service
public class OrderService {

    @Autowired
    private OrderService self;   // Spring injects the proxied version

    public void checkout(Order order) {
        self.processPayment(order);   // Goes through proxy — circuit breaker active
    }

    @CircuitBreaker(name = "paymentService")
    public PaymentResponse processPayment(Order order) { ... }
}
```

### 5. Fallback Swallowing Exceptions Without Logging

**Problem:** Fallback silently returns an empty/default response. Monitoring shows no errors. The downstream service has been dead for hours.

**Fix:** Always log at `WARN` or `ERROR` in the fallback, and emit a metric counter:

```java
public PaymentResponse paymentFallback(Order order, Exception ex) {
    log.warn("Circuit breaker active for paymentService. Returning PENDING. " +
        "orderId={}, cause={}", order.getId(), ex.getClass().getSimpleName());
    meterRegistry.counter("payment.circuit.fallback").increment();
    return PaymentResponse.pending(order.getId(), "Retry in progress");
}
```

### 6. Not Testing HALF-OPEN Recovery

**Problem:** HALF-OPEN behavior is never tested. In production, the breaker trips but never recovers because probe requests are also failing (misconfigured probe count, slow recovery, or flapping service). Alert is generated but no runbook exists for manual recovery.

**Fix:** Test HALF-OPEN → CLOSED transition explicitly (see testing section). Document runbook for manual `cb.transitionToClosedState()` via Actuator:

```bash
# Force circuit breaker to CLOSED via Actuator endpoint
POST /actuator/circuitbreakers/paymentService/close
```

---

## Alternatives Comparison

| Solution | Mechanism | Best For | Not Suitable For |
|:---|:---|:---|:---|
| **Resilience4j CircuitBreaker** | In-process sliding window | Spring Boot microservices; per-client control | Service mesh environments where sidecar handles this |
| **Istio / Envoy (Service Mesh)** | Sidecar proxy, outlier detection | Polyglot environments; infra-managed resilience | When app-level fallback logic is required |
| **Spring Cloud Gateway** | Gateway-level CB for routing | Edge-level protection, API gateway patterns | Per-client business-logic fallbacks |
| **Hystrix** (deprecated) | Thread pool isolation | Legacy systems still on Netflix OSS stack | New projects — use Resilience4j instead |
| **Sentinel (Alibaba)** | Rule-based flow control + CB | High-throughput systems with complex flow rules | Simple per-client circuit breaking |

---

## Decision Matrix

| Scenario | Configuration |
|:---|:---|
| Financial / payment calls (must not double-charge) | Strict: low threshold (40%), `COUNT_BASED`, long `waitDuration` (60s), mandatory fallback queues debit for retry |
| Internal service call (notifications, recommendations) | Lenient: high threshold (70%), `TIME_BASED`, short `waitDuration` (10s), graceful degradation fallback |
| Synchronous blocking HTTP calls | `SEMAPHORE` bulkhead + circuit breaker + `TimeLimiter` |
| Startup / warming period sensitivity | High `minimumNumberOfCalls` (20+) to avoid early false trips |

---

## Advanced Architecture: Shopify Semian & Adaptive Concurrency Limits

### 1. The Multi-Process Pitfall: The Shopify Semian Case Study
In enterprise platforms running multi-process application servers (e.g., Ruby Puma/Unicorn, Python Gunicorn, or Node.js cluster mode), an in-memory circuit breaker lives in **each independent OS worker process**:
- If 100 worker processes each require 5 failures to trip the circuit breaker, the downstream database or Redis cluster must endure **$100 \times 5 = 500$ failing requests** before all workers stop!
- Under high concurrency, 500 stalled queries with 5-second socket timeouts hold 500 worker threads hostage, causing complete upstream HTTP gateway saturation.

**The Semian Solution (Shopify)**:
Shopify created **Semian**, an open-source library that wraps native C client drivers (MySQL, Redis, Net::HTTP) and uses **Linux IPC Shared Memory Semaphores**. When any worker observes failures, it updates the shared IPC state, tripping the circuit breaker atomically across **all local OS worker processes simultaneously**.

---

### 2. Beyond Static Thresholds: Adaptive Concurrency Limits (Netflix)
Traditional circuit breakers are **reactive**: they require calls to fail or breach fixed static duration timeouts (e.g., `slowCallDurationThreshold = 2000ms`) before tripping.

Netflix pioneered a proactive approach via **Adaptive Concurrency Limits** (based on Little's Law and the TCP Vegas congestion avoidance algorithm):

$$\text{Little's Law:} \quad L = \lambda \times W \quad (\text{Concurrency} = \text{Throughput} \times \text{Latency})$$

- **The Problem with Static Thresholds**: As downstream load increases, queueing delay builds up inside the server before timeouts occur. By the time static thresholds trip, the downstream server has thousands of requests queued in memory.
- **The Gradient / Vegas Algorithm**: The client continuously tracks the baseline minimum round-trip time ($\text{RTT}_{\text{no-load}}$). When current $\text{RTT}$ starts rising above baseline due to queuing delay, the client dynamically throttles its in-flight request limit:
  $$\text{Limit}_{t+1} = \text{Limit}_t \times \frac{\text{RTT}_{\text{no-load}}}{\text{RTT}_{\text{actual}}}$$
- This sheds excess load **before** thread pools exhaust, completely avoiding the catastrophic latency cliffs that circuit breakers were designed to survive.