---
id: service-discovery
title: Service Discovery
sidebar_label: Service Discovery
description: Detailed guide to Service Discovery in microservices, comparing Client-side vs Server-side discovery, Spring Cloud Eureka vs Kubernetes CoreDNS/Kube-proxy.
tags: [system-design, microservices, service-discovery, spring-cloud, kubernetes]
---

# Service Discovery

In a microservices architecture, application instances scale up/down and run on dynamic IP addresses within containers. **Service Discovery** provides a mechanism to dynamically detect and resolve the addresses of these services.

---

## How It Works

Service discovery requires a registry database storing service names and active IP addresses:

```text
┌─────────────────┐
│ Service Registry│ ◄─────────── Register (IP: 10.0.1.5)
│  (Eureka/Consul)│ ◄─────────── Heartbeat / Health Check
└────────┬────────┘
         ▲
         │ Query Location of "order-service"
         ▼
┌─────────────────┐             ┌─────────────────┐
│  Client Service │ ───────────►│  order-service  │
│ (e.g. Gateway)  │  Route call │   (10.0.1.5)    │
└─────────────────┘             └─────────────────┘
```

---

## Client-Side vs. Server-Side Discovery

| Feature | Client-Side (e.g., Spring Cloud Eureka) | Server-Side (e.g., Kubernetes DNS & Service) |
| :--- | :--- | :--- |
| **Routing Entity** | The client application queries the registry and selects an instance. | The client calls a static IP/hostname; platform routes it. |
| **Load Balancing** | Handled in client code (e.g., Spring Cloud LoadBalancer). | Handled by platform proxy (e.g., `kube-proxy` via iptables). |
| **Dependencies** | Requires registry client libraries in code (Spring SDKs). | Language-agnostic. App speaks plain HTTP to a hostname. |
| **Registry Dev Ops** | Must deploy, cluster, and run the Registry (Eureka servers). | Automatically provided and managed by the orchestration platform. |

---

## Setup & Implementation

### Client-Side Discovery (Spring Cloud Netflix Eureka)

#### 1. Eureka Server Setup
Add `@EnableEurekaServer` to the discovery server application class:

```java
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}
```

#### 2. Eureka Client Registration
Add the client dependency and configure registration in microservices:

```yaml
# application.yml of catalog-service
spring:
  application:
    name: catalog-service
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
    registerWithEureka: true
    fetchRegistry: true
  instance:
    preferIpAddress: true
```

#### 3. Client Consumption via RestTemplate / OpenFeign
Load balance calls using the service name instead of hardcoded IPs:

```java
@Configuration
public class ClientConfig {
    @Bean
    @LoadBalanced // Enables client-side load balancing via Eureka metadata
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

// In service code
restTemplate.getForObject("http://catalog-service/items/123", ItemResponse.class);
```

---

### Server-Side Discovery (Kubernetes DNS + Service)

In Kubernetes, you deploy standard manifests. No Java dependencies are needed.

#### 1. Deployment and Service Definition
Create a ClusterIP service to expose the deployment internally:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: catalog-service
  template:
    metadata:
      labels:
        app: catalog-service
    spec:
      containers:
      - name: catalog-service
        image: catalog-service:latest
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: catalog-service # This name registers in Kubernetes DNS
spec:
  type: ClusterIP
  selector:
    app: catalog-service
  ports:
  - port: 80
    targetPort: 8080
```

#### 2. Usage from Caller Pod
Kubernetes automatically handles DNS resolution inside the cluster:

```java
// K8s DNS maps "catalog-service" to the Service virtual IP (VIP)
restTemplate.getForObject("http://catalog-service/items/123", ItemResponse.class);
```

---

## Pros vs. Cons

### Client-Side (Eureka)
- **Pros**: Fast routing (direct client-to-pod, no extra network hop), rich configuration control on client behavior.
- **Cons**: Client libraries bloat the application code, language locking (difficult to integrate non-JVM clients).

### Server-Side (Kubernetes)
- **Pros**: Language agnostic (works for Go, NodeJS, Java, Python), out-of-the-box system configuration, clean separation of concerns.
- **Cons**: Adds a micro-hop at the virtual network level, less control over load-balancing strategies (mostly random or round-robin).

---

## Common Gotchas & Anti-Patterns

1. **Stale Registry Cache**: Clients calling dead instances because the server crashed but the heartbeat TTL hasn't expired yet. Set aggressive client cache refreshes (`eureka.client.registry-fetch-interval-seconds: 10`) and short heartbeats in test environments.
2. **Registry Crash Isolation**: If the Eureka server cluster goes completely offline, client applications must fall back to their local registry cache rather than crashing outright. Configure client resilience parameters.
3. **Hardcoding namespaces in Kubernetes DNS**: Calling `catalog-service.default.svc.cluster.local` from outside the default namespace in production. Always utilize relative naming `catalog-service` if in the same namespace, or reference explicit namespaces correctly.
