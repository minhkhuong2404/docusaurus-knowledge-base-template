---
id: bulkhead-pattern
title: Bulkhead Pattern
sidebar_label: Bulkhead
description: Guide to the Bulkhead pattern for microservice resource isolation, Thread Pool vs Semaphore strategies, and configuration with Resilience4j.
tags: [system-design, microservices, resilience, spring-boot, bulkhead]
---

# Bulkhead Pattern

The **Bulkhead** pattern isolates resources (such as thread pools or connection pools) allocated for specific downstream services. This prevents a failure in one downstream dependency from exhausting all system resources and starving traffic to healthy parts of the system.

The pattern is named after the watertight compartments (bulkheads) of a ship's hull: if one partition is breached, it floods locally without sinking the entire ship.

---

## How It Works

Without bulkheads, all remote calls share the main application thread pool. If one service becomes slow, all threads are eventually consumed blocking on it:

```text
[Incoming Requests] ───► [Shared Thread Pool] ───► Call Service A (Healthy)
                                              └───► Call Service B (SLOW - Blocks all threads)
```

With bulkheads, resources are partitioned so that a slow service can only exhaust its dedicated slice:

```text
                        ┌────────────────────────┐
                        │   Thread Pool A        │ ───► Call Service A (Healthy)
[Incoming Requests] ───►│   (10 Threads Max)     │
                        ├────────────────────────┤
                        │   Thread Pool B        │ ───► Call Service B (SLOW - Blocks here only)
                        │   (5 Threads Max)      │
                        └────────────────────────┘
```

---

## Setup & Implementation

### Thread Pool vs. Semaphore Bulkheads

1. **Thread Pool Bulkhead**:
   - Assigns a dedicated thread pool and queue for the target execution.
   - Run calls on separate threads (asynchronous).
   - **Best For**: Synchronous blocking calls.
   - **Trade-off**: High context switching overhead and memory usage.

2. **Semaphore Bulkhead**:
   - Uses atomic counters to limit concurrent executions on the calling thread.
   - Reject new calls once the limit is reached.
   - **Best For**: Asynchronous non-blocking/reactive systems (e.g., Spring WebFlux, Project Reactor).
   - **Trade-off**: Cannot isolate slow threads; only limits count.

---

### Resilience4j Config with Spring Boot

Configure both bulkhead strategies in Spring Boot:

```yaml
# application.yml
resilience4j:
  # Thread Pool Bulkhead Configuration
  thread-pool-bulkhead:
    instances:
      paymentService:
        maxThreadPoolSize: 10     # Max threads in isolated pool
        coreThreadPoolSize: 5      # Core threads in isolated pool
        queueCapacity: 50          # Queue capacity for waiting tasks
        keepAliveDuration: 20ms
  # Semaphore Bulkhead Configuration
  bulkhead:
    instances:
      userService:
        maxConcurrentCalls: 20     # Max concurrent calls on caller threads
        maxWaitDuration: 100ms     # Time caller thread is allowed to wait for slot
```

### Java Code Example (Thread Pool Bulkhead)

Use standard Resilience4j annotations for thread pool execution:

```java
@Service
@Slf4j
public class PaymentService {

    private final PaymentClient paymentClient;

    public PaymentService(PaymentClient paymentClient) {
        this.paymentClient = paymentClient;
    }

    // Must return CompletableFuture for Thread Pool execution
    @Bulkhead(name = "paymentService", type = Bulkhead.Type.THREADPOOL, fallbackMethod = "paymentFallback")
    public CompletableFuture<PaymentResult> processPayment(PaymentRequest request) {
        return CompletableFuture.supplyAsync(() -> paymentClient.charge(request));
    }

    public CompletableFuture<PaymentResult> paymentFallback(PaymentRequest request, Throwable ex) {
        log.warn("Payment pool exhausted or failed. Error: {}", ex.getMessage());
        return CompletableFuture.completedFuture(PaymentResult.failed("Temporary resource exhaustion"));
    }
}
```

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Fault Isolation**: Outages in one service do not impact completely unrelated flows. | **Resource Overhead**: Creating separate thread pools consumes memory and increases CPU context-switching. |
| **Graceful Saturation**: Predictably rejects traffic for over-capacity integrations. | **Tuning Complexity**: Hard to determine correct thread pool sizes and queue capacities without load testing. |
| **Protects Local Runtime**: Guarantees that internal read paths/caches are always accessible. | **Callback/Reactive Refactoring**: Requires wrapping blocking APIs into asynchronous structures (`CompletableFuture`). |

---

## Common Gotchas & Anti-Patterns

1. **Queue Capacity Too Large**: Setting the `queueCapacity` too high. If the downstream is slow, requests will pile up in the queue, adding massive latency before failing. Keep queue sizes small to fail-fast quickly when overloaded.
2. **Double Threading**: Wrapping a thread pool bulkhead around a method that already executes on a separate pool (e.g., Spring's `@Async` or custom executors). This wastes threads and CPU cycles.
3. **Sharing pools for different SLA dependencies**: Grouping a fast, critical endpoint with a slow, non-critical database sync endpoint in the same thread pool.
