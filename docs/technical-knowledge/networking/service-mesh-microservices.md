---
id: service-mesh-microservices
title: Service Mesh & Microservices Networking
description: Service discovery, circuit breakers, service meshes (Istio, Envoy), sidecar pattern, observability, and microservices communication patterns.
tags: [networking, service-mesh, istio, envoy, circuit-breaker, service-discovery, kubernetes, microservices]
sidebar_position: 14
---

# Service Mesh & Microservices Networking

## Microservices Communication Challenges

Distributing a monolith into microservices introduces networking problems:

```
Service A → Service B → Service C → Service D
         ↑
    Any hop can fail:
    - Service down
    - Network timeout
    - Slow responses (cascading failure)
    - Need auth between services
    - Need observability (traces, metrics)
    - Load balancing between instances
    - Service discovery (where is Service B?)
```

---

## Service Discovery

How does Service A find Service B's IP address?

### Client-Side Discovery

```
Service A → [Service Registry] → gets list of B's IPs → A load balances

Service Registry: Consul, Eureka, etcd, Zookeeper
Service B registers itself on start, deregisters on shutdown
Service A queries registry → gets healthy instances → round-robin

Pros: no extra hop, client controls LB algorithm
Cons: discovery logic in every service (every language)
```

```java
// Spring Cloud Eureka
@SpringBootApplication
@EnableEurekaClient
public class OrderServiceApp { ... }

// application.yml
eureka:
  client:
    service-url:
      defaultZone: http://eureka:8761/eureka
  instance:
    prefer-ip-address: true
    health-check-url-path: /actuator/health

// Feign client — auto-discovers via Eureka
@FeignClient("inventory-service")
public interface InventoryClient {
    @GetMapping("/api/inventory/{productId}")
    InventoryDto checkInventory(@PathVariable Long productId);
}
```

### Server-Side Discovery (Kubernetes)

```
Service A → [kube-proxy/DNS] → routes to healthy pod

Kubernetes Service:
  ClusterIP: stable virtual IP for a set of pods
  DNS: inventory-service.default.svc.cluster.local → ClusterIP
  kube-proxy: iptables/IPVS rules route ClusterIP → actual pod IPs

Service A doesn't need a registry — DNS + kube-proxy handle it
```

```yaml
# Kubernetes Service (server-side discovery)
apiVersion: v1
kind: Service
metadata:
  name: inventory-service
spec:
  selector:
    app: inventory
  ports:
    - port: 8080
      targetPort: 8080
  type: ClusterIP  # internal cluster IP

# Service A accesses: http://inventory-service:8080/api/inventory/42
```

---

## Circuit Breaker Pattern

Prevents **cascading failures** when a downstream service is slow or down.

```
States:
  CLOSED   → requests flow through normally
  OPEN     → requests immediately fail fast (no call to downstream)
  HALF_OPEN → test requests allowed; if successful → CLOSED; if fail → OPEN

                  failures > threshold
CLOSED ─────────────────────────────────────────► OPEN
  ▲                                                 │
  │              test succeeds                      │ timeout expires
  │◄────────────────────────────── HALF_OPEN ◄──────┘
                 test fails → OPEN again
```

```java
// Resilience4j Circuit Breaker with Spring Boot
@Bean
public CircuitBreakerConfig circuitBreakerConfig() {
    return CircuitBreakerConfig.custom()
        .failureRateThreshold(50)              // open when 50% of calls fail
        .waitDurationInOpenState(Duration.ofSeconds(30))  // stay open 30s
        .slidingWindowSize(10)                 // evaluate last 10 calls
        .permittedNumberOfCallsInHalfOpenState(3)
        .slowCallRateThreshold(50)             // also trigger on slow calls
        .slowCallDurationThreshold(Duration.ofSeconds(2))
        .build();
}

@Service
public class InventoryService {

    @CircuitBreaker(name = "inventory", fallbackMethod = "inventoryFallback")
    @Retry(name = "inventory")
    @TimeLimiter(name = "inventory")
    public CompletableFuture<InventoryDto> checkInventory(Long productId) {
        return CompletableFuture.supplyAsync(() ->
            inventoryClient.check(productId));
    }

    public CompletableFuture<InventoryDto> inventoryFallback(Long productId, Exception e) {
        log.warn("Inventory service unavailable, using fallback", e);
        return CompletableFuture.completedFuture(InventoryDto.unknown(productId));
    }
}
```

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

## Bulkhead Pattern

Isolate resources per dependency — one failing service can't exhaust all threads.

```java
// Resilience4j Bulkhead (semaphore)
@Bulkhead(name = "inventory", type = Bulkhead.Type.SEMAPHORE)
public InventoryDto checkInventory(Long productId) { ... }

// Thread pool bulkhead
@Bulkhead(name = "inventory", type = Bulkhead.Type.THREADPOOL)
public CompletableFuture<InventoryDto> checkInventory(Long productId) { ... }

@Bean
public BulkheadConfig bulkheadConfig() {
    return BulkheadConfig.custom()
        .maxConcurrentCalls(10)       // max concurrent calls allowed
        .maxWaitDuration(Duration.ofMillis(50))  // wait if at limit
        .build();
}
```

---

## Service Mesh

A service mesh moves **cross-cutting network concerns** out of application code into infrastructure.

```
Without mesh: every service implements auth, observability, retry, circuit breaking
With mesh: sidecar proxy handles it — app just sends plain HTTP

          ┌─────────────────────────────────────┐
Pod A     │  [App Container] ←→ [Envoy Sidecar] │──── mTLS ────
          └─────────────────────────────────────┘
                                                              │
          ┌─────────────────────────────────────┐            │
Pod B     │  [Envoy Sidecar] ←→ [App Container] │ ───────────┘
          └─────────────────────────────────────┘

Control Plane (Istio): pushes config to all Envoy proxies
Data Plane (Envoy):    actual traffic handling (mTLS, retries, tracing)
```

### Istio Features

| Feature | Description |
|---------|-------------|
| **mTLS** | Auto-provisioned certs, service-to-service encryption |
| **Traffic management** | Load balancing, retries, circuit breaking, timeouts |
| **Observability** | Auto distributed tracing (Jaeger/Zipkin), metrics, access logs |
| **Authorization** | Service-level RBAC policies (which services can talk to whom) |
| **Traffic splitting** | Canary deployments (send 5% to v2) |
| **Fault injection** | Test resilience by injecting delays/errors |

```yaml
# Istio VirtualService: canary deployment
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
    - order-service
  http:
    - route:
        - destination:
            host: order-service
            subset: v1
          weight: 95
        - destination:
            host: order-service
            subset: v2
          weight: 5   # 5% canary traffic

---
# Istio DestinationRule: circuit breaking
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: inventory-service
spec:
  host: inventory-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s    # eject unhealthy pod for 30s
      maxEjectionPercent: 50   # never eject >50% of pods

---
# Istio AuthorizationPolicy: zero trust
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: inventory-policy
spec:
  selector:
    matchLabels:
      app: inventory
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/default/sa/order-service"]  # only order-service
      to:
        - operation:
            methods: ["GET"]
            paths: ["/api/inventory/*"]
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

```yaml
# Kubernetes Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api/orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 8080
          - path: /api/inventory
            pathType: Prefix
            backend:
              service:
                name: inventory-service
                port:
                  number: 8080
```

---

## 🎯 Interview Questions

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
