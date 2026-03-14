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

Single entry point for all client requests.

```
Mobile  ╮
Web     ├→ API Gateway → Auth → Rate Limit → Route to Service
Partners╯

API Gateway handles:
  - Authentication / Authorization
  - Rate Limiting
  - Request routing
  - SSL termination
  - Request/response transformation
  - Load balancing
  - Logging & tracing
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

Prevent cascading failures when a downstream service is slow/unavailable.

```
CLOSED (normal) → failures exceed threshold → OPEN (reject all)
                                                    ↓ after timeout
                                              HALF-OPEN (test one request)
                                                    ↓ success → CLOSED
                                                    ↓ failure → OPEN again
```

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

Isolate failure domains. Separate thread pools prevent one service from starving others.

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
See [Multi-Step Processes](./09-multi-step-process) for full coverage.

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
