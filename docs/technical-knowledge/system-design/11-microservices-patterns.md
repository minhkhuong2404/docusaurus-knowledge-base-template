---
id: microservices-patterns
title: Microservices Design Patterns
sidebar_label: Microservices Patterns
description: Comprehensive guide to microservices design patterns including API Gateway, Circuit Breaker, Service Mesh, Sidecar, Strangler Fig, Bulkhead, and service discovery in Spring Cloud.
tags: [microservices, api-gateway, circuit-breaker, service-mesh, spring-cloud, kubernetes, resilience]
---

# Microservices Design Patterns

---

## When to Use Microservices

**Use microservices when:**
- Different services have vastly different scaling needs
- Teams are large and need independent deployment
- Different services need different tech stacks

**Stick with monolith when:**
- Small team (< 10 engineers)
- Early-stage startup (complexity kills speed)
- Domain isn't well-understood yet

> "Start with a monolith, split when you feel the pain." — Martin Fowler

---

## API Gateway Pattern

**The Problem:** In a microservices architecture, a client application frequently needs to consume data from dozens of distinct services to render a single screen. If the client communicates directly with each service, it leads to chatty communication, tight coupling to backend infrastructure, and security nightmares (since every internal service must be exposed to the public internet and handle its own authentication).

**The Solution:** Implement an API Gateway as the single, unified entry point for all client requests. It acts as a highly resilient reverse proxy, routing requests to appropriate backend services and aggregating results.

### Key Responsibilities
- **Security & Gateway Offloading:** SSL termination, token validation, and IP allowlisting at the edge so backend services remain securely hidden in private subnets.
- **Routing & Composition:** Fan-out requests to multiple services concurrently, aggregate the responses, and prune out internal data to reduce round-trips over slow mobile networks.
- **Cross-Cutting Concerns:** Centralized rate limiting, global caching, distributed trace ID generation, and CORS management.

### Backend for Frontend (BFF) Variant
Instead of a single monolithic API Gateway for all clients, the **BFF pattern** uses multiple smaller gateways tailored to specific client form factors (e.g., one BFF for the iOS app, one BFF for the Web Portal). This prevents the master API Gateway from becoming a bloated bottleneck and allows individual frontend client teams to own and iterate on their specific gateway.

### Advantages & Disadvantages

| Advantages | Disadvantages |
|---|---|
| **Encapsulation:** Hides the internal structure of the application from clients. Clients don't need to know if an endpoint is powered by 1 service or 10. | **Single Point of Failure:** If the gateway goes down, the entire application becomes inaccessible. It must be highly available. |
| **Reduced Chatter:** Aggregating data at the gateway significantly reduces the number of network round-trips for mobile clients. | **Latency Bottleneck:** Adds an extra network hop and potential processing overhead to every single request. |
| **Centralized Governance:** A single place to enforce authentication, rate limiting, and standard observability headers. | **Deployment Bottleneck:** A single massive gateway can become a tight coupling point where multiple teams step on each other's toes to deploy routing rules. |

### Popular API Gateway Technologies
- **Spring Cloud Gateway:** Java/Spring-based, highly customizable, uses non-blocking Netty.
- **Kong API Gateway:** Nginx-based, extremely fast, highly extensible via Lua plugins.
- **AWS API Gateway:** fully managed serverless proxy, natively deeply integrated with AWS Lambda and IAM.
- **Traefik / NGINX:** Standard highly performant reverse proxies.

```text
Mobile  ╮
Web     ├→ API Gateway → Auth → Rate Limit → Route to Service
Partners╯
```

```java
// Spring Cloud Gateway
@Configuration
public class GatewayConfig {
    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("user-service", r -> r
                .path("/api/users/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Internal-Source", "gateway")
                    .circuitBreaker(c -> c.setName("user-cb").setFallbackUri("forward:/fallback"))
                )
                .uri("lb://user-service") // Load-balanced via Eureka
            )
            .route("order-service", r -> r
                .path("/api/orders/**")
                .filters(f -> f.requestRateLimiter(rl -> rl
                    .setRateLimiter(redisRateLimiter())
                    .setKeyResolver(userKeyResolver())
                ))
                .uri("lb://order-service")
            )
            .build();
    }
}
```

---

## Circuit Breaker Pattern

**The Problem:** When one microservice synchronously calls another over a network, network glitches or heavy downstream load can cause timeouts. If Service A calls a struggling Service B, Service A's worker threads block while waiting. Eventually, Service A runs completely out of threads responding to incoming requests, causing a cascading failure that rips across the entire distributed system.

**The Solution:** Wrap remote calls in a Circuit Breaker object, which actively monitors for failures and prevents cascading collapse.

### How It Works
The circuit breaker operates in three distinct states, acting as an automated electrical safeguard:

```text
CLOSED (normal) → failures exceed threshold → OPEN (reject all)
                                                    ↓ after timeout
                                              HALF-OPEN (test few requests)
                                                    ↓ success → CLOSED
                                                    ↓ failure → OPEN again
```

- **CLOSED (Normal):** Requests flow freely. The circuit breaker counts consecutive failures or timeouts.
- **OPEN (Failing):** If the failure/slowness rate exceeds a configured threshold, the circuit "trips". All subsequent calls immediately **fail fast** (throwing a `CallNotPermittedException` or returning a fallback) *without* attempting the network call. This completely lifts the load off the struggling downstream service, giving it breathing room to recover.
- **HALF-OPEN (Testing):** After a predefined cooldown period, the circuit allows a small number of probing test requests through. If they succeed, the circuit resets to CLOSED. If they fail, it trips back to OPEN.

### Best Practices
- **Graceful Fallbacks:** Always provide a logical fallback method. Return a sensible default value, an empty list, a cached stale response, or a simplified UI model so the user barely notices the outage.
- **Low Timeouts:** Circuit breakers must be paired with aggressive HTTP timeouts. Don't wait 30 seconds for a doomed request to fail.

```java
// Resilience4j Circuit Breaker with Spring Boot
@CircuitBreaker(name = "inventoryService", fallbackMethod = "inventoryFallback")
@TimeLimiter(name = "inventoryService")
@Retry(name = "inventoryService")
public CompletableFuture<InventoryResponse> checkInventory(Long itemId) {
    return CompletableFuture.supplyAsync(() ->
        inventoryClient.check(itemId)
    );
}

public CompletableFuture<InventoryResponse> inventoryFallback(Long itemId, Exception ex) {
    log.warn("Inventory service unavailable, using fallback for item {}", itemId);
    return CompletableFuture.completedFuture(
        InventoryResponse.assumeAvailable(itemId) // Graceful degradation
    );
}
```

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      inventoryService:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
  retry:
    instances:
      inventoryService:
        maxAttempts: 3
        waitDuration: 500ms
        enableExponentialBackoff: true
```

---

## Bulkhead Pattern

**The Problem:** If a service uses a single shared thread pool or connection pool to execute all outgoing network requests, a single slow downstream dependency will exhaust the entire pool. For example, if the Payment Integration is experiencing severe lag, all available application threads will eventually get stuck blocking on the Payment call. This leaves zero threads available to process incoming requests for completely unrelated, perfectly healthy endpoints (like viewing a user profile entirely read from a local cache).

**The Solution:** Isolate failure domains by partitioning system resources. The name comes from shipbuilding: a ship's hull is divided into isolated watertight compartments (bulkheads). If one compartment gets punctured and floods, the water is contained strictly to that section, preventing the entire ship from sinking.

By partitioning threads, memory, or connection pools, a catastrophic failure in one integration only exhausts the resources allocated specifically to that partition. The rest of the application remains highly responsive.

### Types of Bulkheads
- **Thread Pool Bulkhead:** Assigns dedicated, physically isolated thread pools to specific downstream services. If the 10 threads allocated for `PaymentService` fill up, the 50 threads allocated for `ProductCatalog` continue operating flawlessly. Preferred for synchronous/blocking calls, though it introduces context-switching thread overhead.
- **Semaphore Bulkhead:** Uses atomic counters (semaphores) to limit the number of concurrent requests to a specific service, executing within the existing caller thread. Extremely lightweight and preferred for non-blocking reactive architectures.

```java
// Resilience4j Bulkhead
@Bulkhead(name = "paymentService", type = Bulkhead.Type.THREADPOOL)
public CompletableFuture<PaymentResult> charge(PaymentRequest req) {
    return CompletableFuture.supplyAsync(() -> paymentGateway.charge(req));
}
```

```yaml
resilience4j:
  thread-pool-bulkhead:
    instances:
      paymentService:
        maxThreadPoolSize: 10     # Isolated pool for payment
        coreThreadPoolSize: 5
        queueCapacity: 100
```

---

## Service Discovery

### Client-Side (Eureka)
```java
// Register service
@SpringBootApplication
@EnableEurekaClient
public class InventoryServiceApplication { ... }

// Discover and call
@LoadBalanced
@Bean
public RestTemplate restTemplate() { return new RestTemplate(); }

// Usage — service name resolved by Eureka
restTemplate.getForObject("http://inventory-service/items/{id}", Item.class, id);
```

### Server-Side (Kubernetes)
- K8s DNS: `inventory-service.default.svc.cluster.local`
- No client-side library needed — handled by kube-proxy

---

## Sidecar Pattern

Attach a proxy container to each service for cross-cutting concerns.

```
┌──────────────────────────────┐
│  Pod                         │
│  ┌──────────────┐  ┌───────┐ │
│  │ Your Service │←→│ Envoy │←──── Observability, mTLS, retries
│  └──────────────┘  │ Proxy │ │
│                    └───────┘ │
└──────────────────────────────┘
```

**Used by**: Istio (Envoy sidecar), Linkerd, Dapr.

---

## Service Mesh

Automates service-to-service communication: retries, timeouts, mTLS, load balancing, observability.

| Feature | Without Service Mesh | With Service Mesh (Istio) |
|---|---|---|
| mTLS | Manual cert management | Automatic |
| Retries | In every service | Centralized policy |
| Traffic splitting | Manual deployment | VirtualService rules |
| Observability | Manual instrumentation | Automatic traces/metrics |

```yaml
# Istio VirtualService — canary deployment
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: user-service
spec:
  http:
  - route:
    - destination:
        host: user-service
        subset: v1
      weight: 90
    - destination:
        host: user-service
        subset: v2        # New version
      weight: 10
```

---

## Strangler Fig Pattern

Incrementally migrate a monolith to microservices.

```
Phase 1: Monolith handles all traffic
Phase 2: New service handles feature X → Route /feature-x to microservice
Phase 3: Expand — route more features to microservices
Phase 4: Monolith retired
```

---

## Saga Pattern (Cross-Service Transactions)
See [Multi-Step Processes](./multi-step-process) for full coverage.

---

## Event-Driven Microservices

```
Service A (producer) → Kafka → Service B (consumer)
                             → Service C (consumer)
```

### Domain Events
```java
// Publish domain events via Spring ApplicationEventPublisher
@Entity
public class Order extends AbstractAggregateRoot<Order> {
    public Order complete() {
        this.status = COMPLETED;
        registerEvent(new OrderCompletedEvent(this)); // Collected by Spring
        return this;
    }
}

// Spring Data auto-publishes events on save
orderRepository.save(order); // → OrderCompletedEvent fired

// Listen in another service via Kafka
@KafkaListener(topics = "order-completed")
public void onOrderCompleted(OrderCompletedEvent event) {
    inventoryService.releaseReservation(event.getOrderId());
}
```

---

## Distributed Tracing

Track requests across services.

```java
// Spring Boot + Micrometer + Zipkin/Jaeger
// Auto-propagates trace/span IDs via HTTP headers
// No manual code needed with Spring Cloud Sleuth

// Logs automatically include traceId, spanId
// [traceId=abc123, spanId=def456] Processing order 789
```

```yaml
spring:
  sleuth:
    sampler:
      probability: 1.0  # 100% sampling (reduce in prod)
  zipkin:
    base-url: http://zipkin:9411
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|---|---|---|
| **Distributed monolith** | Services tightly coupled, deployed together | Define clear bounded contexts |
| **Shared DB** | Services share same schema | Each service owns its data |
| **Chatty services** | Many fine-grained calls per request | Aggregate API or BFF pattern |
| **No API versioning** | Breaking changes kill consumers | Version APIs from day 1 |
| **Synchronous chain** | A→B→C→D, one failure kills all | Break with async events |

---

## Interview Questions

1. What is an API Gateway? What responsibilities should it have?
2. Explain the Circuit Breaker pattern. What are its states?
3. How does service discovery work in a microservices environment?
4. What is a service mesh and what problems does it solve?
5. How would you migrate a monolith to microservices?
6. What is the Bulkhead pattern and how does it prevent cascading failures?
7. How do you handle data consistency when each microservice has its own database?
8. What is the difference between orchestration and choreography in microservices?
9. How do you implement distributed tracing in a Spring Boot microservices system?
10. What are the signs that you should NOT be using microservices?
