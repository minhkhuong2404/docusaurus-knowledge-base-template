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

:::tip[Reverse Proxy vs. Load Balancer vs. API Gateway]
API Gateways are often confused with reverse proxies and load balancers. To see a detailed comparison of their roles and how they coexist in a production topology, check out the [Reverse Proxy vs. Load Balancer vs. API Gateway Guide](./reverse-proxy-load-balancer-api-gateway.md).
:::

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

### Beginner View
The Strangler pattern avoids a risky "big-bang" rewrite. New features are built in services, and selected old endpoints are routed away from the monolith over time.

### Senior Deep Dive
Use an explicit migration blueprint:
1. Edge routing layer (gateway/proxy) decides old vs new path
2. Anti-corruption layer (ACL) shields new services from monolith schema/domain leaks
3. Contract tests ensure old/new behavior parity
4. Cutover metrics define when a route can be fully switched

```
Client -> Gateway
           |- /orders/* -> New Order Service
           |- /legacy/* -> Monolith
```

### Migration Playbook
- Phase 0: Identify bounded context seams and ownership
- Phase 1: Route read-only endpoints first (lower blast radius)
- Phase 2: Migrate writes with idempotency and outbox events
- Phase 3: Decommission monolith modules after zero-traffic burn-in

### Failure Modes
- Shared DB coupling keeps hidden runtime dependencies
- Cross-service transactions recreated as synchronous chains
- Incomplete parity checks create data drift after cutover

### Operational Guardrails
- Keep rollback switch at gateway level
- Track golden metrics per migrated route: error rate, latency, data mismatch
- Run dual-read/compare for critical paths before full write cutover

---

## Saga Pattern (Cross-Service Transactions)
See [Data Consistency & Transactions](./data-consistency#saga-pattern) for full coverage.

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


## Retry Pattern

```java
// Resilience4j Retry
@Bean
public RetryConfig retryConfig() {
    return RetryConfig.custom()
        .maxAttempts(3)
        .waitDuration(Duration.ofMillis(500))
        .retryExceptions(ConnectTimeoutException.class, IOException.class)
        .ignoreExceptions(BadRequestException.class)  // don't retry 4xx
        .build();
}

// Exponential backoff with jitter
RetryConfig.custom()
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
        Duration.ofMillis(200),   // initial
        2.0,                       // multiplier
        Duration.ofSeconds(10)))   // max
    .build();
```

---


## Envoy Proxy

Envoy is the data plane proxy used by Istio, AWS App Mesh, and many others.

```
Envoy capabilities:
  L3/L4: TCP proxy, TLS termination/origination
  L7:    HTTP/1.1, HTTP/2, gRPC, WebSocket
  Observability: distributed tracing (Zipkin, Jaeger, X-Ray), stats
  Service discovery: via xDS API from control plane
  Load balancing: round-robin, least-request, ring hash, Maglev
  Fault injection: inject delays and errors for testing
```

---


## Kubernetes Networking Concepts

```
Pod networking:
  Every pod gets its own IP (flat network)
  Pods can reach each other directly across nodes
  CNI plugin handles this (Calico, Flannel, Cilium, Weave)

Service types:
  ClusterIP:    internal-only VIP, reachable within cluster
  NodePort:     exposes on every node's IP:port (30000-32767)
  LoadBalancer: provisions cloud LB (AWS ELB, GCP NLB)
  ExternalName: maps to external DNS name

Ingress:
  L7 HTTP routing → backend Services
  nginx Ingress, Traefik, AWS ALB Ingress Controller
```

```

## Interview Questions


### Q: What is an API Gateway? What responsibilities should it have?

**A:** An API gateway is the entry point that centralizes cross-cutting concerns for external traffic. It should handle routing, auth, rate limiting, request shaping, and observability, not domain business logic.

### Q: Explain the Circuit Breaker pattern. What are its states?

**A:** Circuit breaker stops calling unhealthy dependencies after failures exceed a threshold. States are closed (normal), open (fail fast), and half-open (probe recovery).

### Q: How does service discovery work in a microservices environment?

**A:** Instances register their endpoints in a registry or are discovered via platform DNS. Clients or sidecars resolve healthy endpoints dynamically to avoid hardcoded addresses.

### Q: What is a service mesh and what problems does it solve?

**A:** A service mesh moves retries, mTLS, traffic policy, and telemetry to sidecars/control plane. It standardizes service-to-service networking without rewriting each app.

### Q: How would you migrate a monolith to microservices?

**A:** Start with domain boundaries, extract one vertical slice, and route traffic gradually using strangler pattern. Keep contracts explicit and use observability + rollback at every cutover.

### Q: What is the Bulkhead pattern and how does it prevent cascading failures?

**A:** Bulkheads isolate resources like thread pools/queues per dependency. A failing downstream then consumes only its partition and cannot starve unrelated traffic.

### Q: How do you handle data consistency when each microservice has its own database?

**A:** Prefer local ACID per service and coordinate cross-service workflows with saga/outbox patterns. Accept eventual consistency and design idempotent handlers plus compensation.

### Q: What is the difference between orchestration and choreography in microservices?

**A:** Orchestration uses a central coordinator to direct steps; choreography relies on event reactions among services. Orchestration improves flow visibility, while choreography reduces central coupling.

### Q: How do you implement distributed tracing in a Spring Boot microservices system?

**A:** Propagate W3C trace context across HTTP/Kafka and instrument via OpenTelemetry auto/manual spans. Export to Jaeger/Tempo/Zipkin and correlate with logs/metrics.

### Q: What are the signs that you should NOT be using microservices?

**A:** Small team, unstable domain boundaries, and low scale usually favor a modular monolith. If ops overhead dominates feature delivery, microservices are premature.


### Microservices Networking & Mesh Questions


**Q1. What is a circuit breaker and why is it needed in microservices?**
> A circuit breaker prevents cascading failures: if Service A calls Service B and B is slow/down, without a circuit breaker, A's threads fill up waiting for B's timeouts — eventually A becomes unavailable too. The circuit breaker opens after N failures, immediately failing calls with a fallback (rather than waiting for timeout). After a recovery period, it lets test calls through — if successful, closes and resumes normal operation.

**Q2. What is a service mesh and what problems does it solve?**
> A service mesh adds a sidecar proxy (Envoy) to every pod, intercepting all network traffic. It moves cross-cutting concerns out of application code: automatic mTLS between services (zero-trust), observability (distributed tracing, metrics without code changes), traffic management (retries, circuit breaking, timeouts), canary deployments, and authorization policies. The app just speaks plain HTTP — the sidecar handles everything.

**Q3. What is the difference between client-side and server-side service discovery?**
> Client-side: the service queries a registry (Eureka, Consul) to get a list of healthy instances and load-balances among them. Client needs registry client library. Server-side: the client sends to a stable address (Kubernetes Service ClusterIP), and the infrastructure (kube-proxy, load balancer) routes to a healthy instance. Client has no discovery logic. Kubernetes uses server-side discovery — DNS resolves to ClusterIP, kube-proxy routes to pods.

**Q4. What is the bulkhead pattern?**
> Named after ship compartments, bulkheads isolate resources per dependency. Each downstream service gets its own thread pool (or semaphore limit). If one service is slow and exhausts its thread pool, other services' thread pools are unaffected — the failure is contained. Without bulkheads, one slow service can consume all application threads, bringing down all other endpoints.

**Q5. How does Istio implement mTLS without changing application code?**
> Istio's control plane (Istiod) automatically provisions X.509 certificates for every service account. The Envoy sidecar intercepts all inbound/outbound traffic — it terminates incoming mTLS and initiates outgoing mTLS, transparently to the application. The app speaks plain HTTP to the sidecar on localhost. The sidecar upgrades to mTLS for inter-service calls. Certificate rotation is also automatic.

**Q6. What is a Kubernetes ClusterIP service and how does kube-proxy route traffic to it?**
> A ClusterIP is a virtual IP (VIP) — it doesn't correspond to any actual network interface. kube-proxy watches the Kubernetes API and programs iptables (or IPVS) rules on every node: packets destined for the ClusterIP:port are DNAT'd to a randomly selected healthy pod IP:port. This happens in the Linux kernel before the packet reaches any application, with no extra network hops.

**Q7. What is a canary deployment in the context of a service mesh?**
> A canary deployment gradually routes a small percentage of traffic to a new version of a service while the rest continues to the stable version. Istio VirtualService weight routing allows this: `v1: 95%, v2: 5%`. Monitor v2's error rate and latency. If healthy, increase to 20%, 50%, 100%. If problems appear, instantly route 100% back to v1. The service mesh makes this seamless — no DNS changes, no infrastructure changes, just a YAML update.

**Q8. What is the difference between retry and circuit breaker patterns?**
> Retries handle **transient failures** — try again immediately or with backoff, hoping the next attempt succeeds (network blip, momentary unavailability). Circuit breakers handle **sustained failures** — stop trying when a service is clearly down, instead failing fast and returning a fallback immediately. They work together: retry handles flickers; circuit breaker trips when retries consistently fail, preventing retry storms from overwhelming a struggling service.

---

## Deployment Strategies: Zero-Downtime Releases

:::info[Chapter 8 Reference]
Building Microservices dedicates substantial coverage to deployment strategies, noting that independent deployability is one of the key benefits of microservices — but it requires sophisticated deployment infrastructure.
:::

### Blue-Green Deployment

```
Blue (current production) ←── 100% traffic
Green (new version)        ←── 0% traffic (being tested)

Switch:
Blue ←── 0% traffic
Green←── 100% traffic

Rollback: instant (just flip back)
Requires: 2x infrastructure
```

```yaml
# Kubernetes blue-green via service selector swap
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
    version: blue    # ← change to "green" to switch
  ports:
  - port: 80
    targetPort: 8080
---
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-blue
spec:
  replicas: 5
  selector:
    matchLabels:
      app: order-service
      version: blue
---
# Green deployment (new version, deployed before cutover)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-green
spec:
  replicas: 5
  selector:
    matchLabels:
      app: order-service
      version: green
  template:
    spec:
      containers:
      - name: order-service
        image: order-service:v2.0.0    # New version
```

### Canary Deployment

```
v1 stable  ←── 95% traffic
v2 canary  ←── 5% traffic (monitor error rate, latency)

If v2 healthy:
  v1 ←── 80%, v2 ←── 20%
  v1 ←── 0%,  v2 ←── 100%

If v2 degraded:
  v1 ←── 100% (instant rollback via weight change)
```

```yaml
# Istio VirtualService: canary with header-based routing
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  # Internal QA team sees new version 100%
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: order-service
        subset: v2
      weight: 100
  # Everyone else: 95/5 split
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 95
    - destination:
        host: order-service
        subset: v2
      weight: 5
```

### Shadow (Dark Launch) Deployment

```
Production traffic → v1 (responses served to users)
                  ↓ (mirrored copy)
                  → v2 (response DISCARDED — never sent to users)

Purpose: Compare v1 vs v2 behavior under real production traffic
without risking user experience
```

```yaml
# Istio traffic mirroring
http:
- route:
  - destination:
      host: order-service
      subset: v1
    weight: 100
  mirror:
    host: order-service
    subset: v2
  mirrorPercentage:
    value: 100.0    # Mirror 100% of requests to v2
```

### Deployment Strategy Comparison

| Strategy | Rollback Speed | Risk | Infrastructure Cost | Use Case |
|---|---|---|---|---|
| **Rolling** | Slow (re-roll forward) | Medium | 1x | Standard deployments |
| **Blue-Green** | Instant (flip selector) | Low | 2x | Critical services, DB migrations |
| **Canary** | Fast (reduce weight to 0) | Very Low | ~1.1x | User-facing feature flags |
| **Shadow** | N/A (no user impact) | None | ~2x | Algorithm comparison, load testing |
| **Feature Flag** | Instant (toggle flag) | Very Low | 1x | Behavioral changes, gradual rollout |

---

## Service Decomposition: Decision Framework

:::info[Chapter 2 Reference]
Building Microservices Chapter 2 provides the foundational guidance for finding service boundaries using Domain-Driven Design bounded contexts and the concepts of loose coupling and high cohesion.
:::

### Decomposition Criteria

```
High Cohesion: Things that change together stay together
Loose Coupling: Services need to know as little as possible about each other

Right-size a service by asking:
  1. Can this service be deployed without coordinating with other teams?
  2. Does it have a single, well-defined bounded context?
  3. Can a small team (2-3 engineers) own it independently?
  4. Does it have data that only it should write to?
```

### Decomposition Patterns

| Pattern | Split By | Best For | Risk |
|---|---|---|---|
| **By Business Capability** | What the business does (Orders, Payments, Inventory) | Aligns with org structure | Requires understanding the domain |
| **By Subdomain (DDD)** | Core, Supporting, Generic subdomains | Strategic alignment | Needs domain expertise |
| **By Volatility** | How often things change (stable vs. frequently changing) | Reduces deployment friction | Can create odd boundaries |
| **By Scale** | Which parts need to scale independently | Performance optimization | May create tight coupling |
| **By Team** | Conway's Law — mirror the team structure | Reduces coordination overhead | Risk of wrong boundaries if teams change |

### The Distributed Monolith: Warning Signs

```
❌ Signs you've built a distributed monolith:

  1. Services must be deployed in a specific order
  2. One service failing takes down others synchronously
  3. Services share a database schema (integration database)
  4. API changes require coordinating releases across 5+ services
  5. Testing requires running the full system
  6. No service can be scaled independently
  7. Services call each other in synchronous chains (A→B→C→D→E)

✅ Signs of healthy microservices:

  1. Any service can be deployed alone, any day
  2. Services have well-defined, versioned APIs
  3. Each service owns its own data store
  4. Services are independently testable in isolation
  5. A service failure degrades gracefully (circuit breaker + fallback)
  6. Teams deploy 10+ times per day independently
```

---

## Database-per-Service: Data Management Patterns

### The Integration Database Problem

```
Integration Database (anti-pattern):
  Order Service   ─┐
  Payment Service  ├──→ Single shared DB schema
  User Service    ─┘

Problems:
  - Schema changes require coordinating all teams
  - No service can optimize its DB technology for its workload
  - Any service can read/write any other service's tables
  - Tight runtime coupling — one service's query can starve others

Database-per-Service (correct pattern):
  Order Service   → Orders DB (Postgres)
  Payment Service → Payments DB (Postgres)
  User Service    → Users DB (Postgres + Redis cache)
  Search Service  → Elasticsearch
```

### Cross-Service Data Access Patterns

| Pattern | Mechanism | Consistency | Complexity | Use Case |
|---|---|---|---|---|
| **API Composition** | Aggregate data via API calls at query time | Strong | Low | Simple joins across 2-3 services |
| **CQRS + Event Sourcing** | Read model built from events | Eventual | High | Complex queries across many services |
| **Saga Pattern** | Choreography/Orchestration for writes | Eventual | Medium-High | Cross-service transactions |
| **Shared Read Replica** | Services export data to a common analytics DB | Eventual | Medium | Reporting, analytics |
| **GraphQL Federation** | Each service owns its GraphQL schema, gateway federates | Strong | Medium | BFF/aggregation for frontends |

### Handling Cross-Service Queries

```java
// Pattern: API Composition — aggregate in the gateway/BFF layer
@Service
public class OrderSummaryService {

    public OrderSummaryResponse getSummary(Long orderId) {
        // Parallel fetch from multiple services
        CompletableFuture<Order> orderFuture =
            CompletableFuture.supplyAsync(() -> orderClient.getOrder(orderId));

        CompletableFuture<PaymentStatus> paymentFuture =
            CompletableFuture.supplyAsync(() -> paymentClient.getStatus(orderId));

        CompletableFuture<ShipmentInfo> shipmentFuture =
            CompletableFuture.supplyAsync(() -> shipmentClient.getInfo(orderId));

        // Wait for all with timeout
        CompletableFuture.allOf(orderFuture, paymentFuture, shipmentFuture)
            .get(2, TimeUnit.SECONDS);

        return OrderSummaryResponse.builder()
            .order(orderFuture.get())
            .payment(paymentFuture.get())
            .shipment(shipmentFuture.get())
            .build();
    }
}
```

---

## Contract Testing: Preventing Breaking Changes

### Consumer-Driven Contract Testing

```
Problem: Service A depends on Service B's API.
  How do you verify Service B's changes don't break Service A
  without requiring both to be deployed together?

Solution: Consumer-Driven Contracts (Pact)
  1. Consumer (A) writes a contract: "I expect B to respond with X to request Y"
  2. Contract is published to Pact Broker
  3. Provider (B) verifies it can fulfill all consumer contracts
     before merging any API change
  4. CI/CD blocks: B's PR fails if any consumer contract breaks
```

```java
// Consumer (Order Service) — define contract
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "payment-service")
class OrderServiceContractTest {

    @Pact(consumer = "order-service")
    public RequestResponsePact paymentChargePact(PactDslWithProvider builder) {
        return builder
            .given("Payment service is available")
            .uponReceiving("a charge request")
                .path("/api/payments/charge")
                .method("POST")
                .body(new PactDslJsonBody()
                    .stringType("orderId")
                    .numberType("amount"))
            .willRespondWith()
                .status(200)
                .body(new PactDslJsonBody()
                    .stringType("transactionId")
                    .stringValue("status", "SUCCESS"))
            .toPact();
    }

    @Test
    @PactTestFor(pactMethod = "paymentChargePact")
    void shouldChargePayment(MockServer mockServer) {
        paymentClient = new PaymentClient(mockServer.getUrl());
        PaymentResult result = paymentClient.charge(
            new ChargeRequest("order-123", 99.99));
        assertThat(result.getStatus()).isEqualTo("SUCCESS");
    }
}
```

### API Versioning Strategy

```
Versioning approaches:

1. URI versioning: /api/v1/orders, /api/v2/orders
   Pros: Explicit, easy to route
   Cons: URL fragmentation, clients must update URLs

2. Header versioning: Accept: application/vnd.myapp.v2+json
   Pros: Clean URLs
   Cons: Hidden, hard to test in browser

3. Semantic versioning + backwards compatibility:
   Never break: existing response fields
   Safe to add: new optional fields
   Breaking: removing/renaming fields, changing types

4. Hypermedia (HATEOAS):
   Responses include links to next actions
   Clients navigate by following links, not hardcoded URLs
```

```java
// Additive change (safe — does not break consumers):
// Old:  { "orderId": "123", "status": "COMPLETED" }
// New:  { "orderId": "123", "status": "COMPLETED", "completedAt": "2024-01-01" }

// Breaking change (requires new version):
// Old:  { "price": 99.99 }              (number)
// New:  { "price": { "amount": 99.99, "currency": "USD" } }  (object)

// Tolerate unknowns in consumers
@JsonIgnoreProperties(ignoreUnknown = true)   // ← always configure this
public class PaymentResponse {
    private String transactionId;
    private String status;
    // new fields from provider are safely ignored
}
```

---

## Rate Limiting Patterns: Deep Dive

:::info[Chapter 12 Reference]
Building Microservices Chapter 12 on resilience covers rate limiting as a key stability pattern protecting services from both internal and external overload.
:::

### Algorithm Comparison

| Algorithm | Memory | Burst Handling | Fairness | Use Case |
|---|---|---|---|---|
| **Fixed Window** | O(1) | Allows 2x burst at window edge | Poor | Simple, low accuracy needed |
| **Sliding Window Log** | O(requests) | Precise, no burst | Good | Low traffic, high precision |
| **Sliding Window Counter** | O(1) | Smooth (weighted interpolation) | Good | Production APIs |
| **Token Bucket** | O(1) | Configurable burst capacity | Good | Network bandwidth limiting |
| **Leaky Bucket** | O(queue size) | Smooths bursts into constant rate | Fair | Backend protection |

```
Token Bucket:
  Tokens refill at steady rate (e.g., 100/sec)
  Each request consumes 1 token
  Burst allowed up to bucket capacity (e.g., 500 tokens)
  Empty bucket → 429 Too Many Requests

Leaky Bucket:
  Requests enter queue regardless of rate
  Queue drains at fixed rate (e.g., 100/sec)
  Queue full → 429 Too Many Requests
  Output is always smooth — protects backend
```

### Distributed Rate Limiting with Redis

```java
// Sliding window rate limiter using Redis sorted set
@Service
public class RateLimiter {
    private final RedisTemplate<String, String> redis;

    public boolean isAllowed(String userId, int limitPerMinute) {
        String key = "rate:" + userId;
        long now = System.currentTimeMillis();
        long windowStart = now - 60_000; // 1-minute window

        // Atomic: remove old entries + add current + count
        List<Object> results = redis.execute(new SessionCallback<>() {
            @Override
            public List<Object> execute(RedisOperations ops) {
                ops.multi();
                ops.opsForZSet().removeRangeByScore(key, 0, windowStart);
                ops.opsForZSet().add(key, String.valueOf(now), now);
                ops.opsForZSet().size(key);
                ops.expire(key, Duration.ofMinutes(2));
                return ops.exec();
            }
        });

        Long count = (Long) results.get(2);
        return count <= limitPerMinute;
    }
}
```

---

## Interview Questions: Senior Level

### Q: How do you decide if something should be one service or two?

**A:** Apply two tests from Building Microservices: loose coupling and high cohesion. If two capabilities share the same deployment cycle, same data, and the same team owns them, they belong together. If they have different scaling requirements, different change rates, or different team ownership, split them. The practical test: can each be deployed independently without coordination? If not, they are too coupled. A key smell for premature splitting is synchronous chains — if Service A always calls Service B, they may be better as one service.

### Q: Explain canary deployments and how you automate them safely.

**A:** A canary routes a small percentage of traffic (5%) to the new version while monitoring its error rate and latency against the baseline. Automation requires: (1) routing infrastructure (Istio VirtualService weights), (2) SLO-aligned success criteria, (3) automated promotion (increase weight) and rollback (reduce weight to 0) triggered by metric thresholds. Argo Rollouts implements this with a ProgressiveDelivery controller that automatically steps from 5% to 20% to 50% to 100% if each stage passes the analysis metrics, or rolls back if any stage breaches the error budget.

### Q: What is consumer-driven contract testing? How does it differ from end-to-end testing?

**A:** Consumer-driven contract tests verify that a service honors the expectations its consumers have documented. The consumer writes the contract (expected request/response), and the provider's CI verifies it can fulfill that contract in isolation. This is far cheaper than end-to-end tests that require all services to be running, and catches breaking API changes before they reach production. The key benefit is that providers get immediate feedback if their change breaks a consumer, without needing a shared integration environment.

### Q: How do you handle the need for cross-service transactions in a microservices system?

**A:** Distributed transactions with 2PC are fragile and blocking — avoid them. Instead, use the Saga pattern: decompose the transaction into a sequence of local ACID transactions, each publishing an event on success, or triggering a compensating transaction on failure. For orchestration sagas, a central Saga Orchestrator (e.g., Temporal workflow) manages the sequence and compensations explicitly. For choreography, each service reacts to events and emits its own events. The Outbox pattern ensures events are published atomically with the database write, preventing the dual-write problem.

### Q: What are the operational challenges of microservices that monoliths avoid?

**A:** (1) Distributed tracing — request debugging requires correlating logs across services. (2) Data consistency — no cross-service transactions; eventual consistency adds complexity. (3) Network overhead — every call is a network hop with latency, failure probability, and serialization cost. (4) Testing — integration tests require running many services. (5) Operational overhead — N services means N CI pipelines, N dashboards, N alert pages. (6) Service discovery — dynamic instance registration required. (7) API versioning — cannot do breaking changes freely. Building Microservices emphasizes: these costs are real and must be justified by the scale and team-size benefits microservices provide.