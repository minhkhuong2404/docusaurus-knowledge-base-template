---
sidebar_position: 9
title: 'Chapter 8: Deployment'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-08
---
# Chapter 8: Deployment

**Part II — Implementation**

> Microservices create many more deployment units than a monolith. This chapter surveys deployment options from containers to Kubernetes to FaaS, and introduces the key principles for managing deployments at scale.

---

## The Deployment Challenge

Each microservice needs to be deployed independently. With 20 services, you have 20 deployment pipelines to manage. Deployment decisions become critical architectural decisions, not just infrastructure details.

The guiding principle: **you want the ability to deploy any service to production at any time, independently, with minimal risk**.

---

## The Evolution of Deployment Targets

### 1. Physical Machines
Each service runs on dedicated hardware. Simple but wasteful, slow to provision, expensive.

### 2. Virtual Machines (VMs)
Multiple VMs per physical machine. Better utilization. Still relatively slow to spin up (minutes). Each VM carries a full OS.

### 3. Containers
A container shares the host OS kernel but has its own filesystem, process space, and networking. Start in seconds. Much more efficient than VMs.

**Docker is the dominant container runtime** for microservices. Every Spring Boot service should have a Dockerfile.

### 4. Container Orchestration (Kubernetes)
When you have dozens of services running in containers across multiple hosts, you need orchestration — automated deployment, scaling, health management, and networking.

**Kubernetes (K8s)** has become the de-facto standard.

### 5. Function-as-a-Service (FaaS)
Individual functions deployed to platforms like AWS Lambda, Google Cloud Functions, or Azure Functions. No servers to manage. Pay per invocation. Best for event-driven, intermittent workloads.

---

## Containers and Docker

### Why Containers for Microservices?
- **Isolation** — each service has its own dependencies, no conflicts
- **Consistency** — same container runs in dev, staging, and production
- **Speed** — start in seconds vs. minutes for VMs
- **Portability** — runs anywhere Docker runs

### Dockerfile for a Spring Boot Service
```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the fat JAR
COPY build/libs/order-service-*.jar app.jar

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

# Use layered JAR for better Docker caching
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Spring Boot Docker Layers (Optimization)
Spring Boot 2.3+ supports layered JARs for efficient Docker image caching:
```bash
# Build layered JAR
./gradlew bootJar

# Extract layers
java -Djarmode=layertools -jar build/libs/app.jar extract
```

This splits the JAR into layers (dependencies, snapshot-dependencies, application) so Docker only rebuilds changed layers.

---

## Kubernetes

Kubernetes is an open-source container orchestration platform. It manages the lifecycle of containers across a cluster of machines.

### Core Kubernetes Concepts

| Resource | Purpose |
|---|---|
| **Pod** | Smallest deployable unit — one or more containers |
| **Deployment** | Manages Pods; handles rolling updates and rollbacks |
| **Service** | Stable network endpoint for a set of Pods (DNS + load balancing) |
| **ConfigMap** | Inject non-secret configuration into Pods |
| **Secret** | Inject sensitive configuration (passwords, tokens) |
| **Namespace** | Logical isolation within a cluster |
| **Ingress** | HTTP routing from outside the cluster to Services |

### Spring Boot Service Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-service
          image: registry.example.com/order-service:abc1234
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: order-service-secrets
                  key: database-url
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
    - port: 80
      targetPort: 8080
```

### Spring Boot Actuator Health Endpoints
Kubernetes relies on health probes. Spring Actuator makes this easy:
```yaml
# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
```
- `/actuator/health/liveness` — is the process alive? (restart if not)
- `/actuator/health/readiness` — is it ready to serve traffic? (stop routing if not)

---

## Deployment Strategies

### Rolling Update (Default in K8s)
Gradually replace old pods with new ones. Zero downtime if done correctly. K8s default.

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # Allow 1 extra pod during update
      maxUnavailable: 0    # Never reduce capacity below desired
```

### Blue/Green Deployment
Run two identical environments (blue = current, green = new). Switch traffic all at once. Allows instant rollback.

```
           ┌──────────────────────────────────────┐
           │          Load Balancer               │
           └────────────┬─────────────────────────┘
              (traffic) │
                        ▼
               ┌────────────────┐    ┌────────────────┐
               │  Blue (v1.0)   │    │  Green (v1.1)  │
               │  (live)        │    │  (standby)     │
               └────────────────┘    └────────────────┘
                          Switch traffic to green, keep blue for rollback
```

### Canary Release
Route a small percentage of traffic (e.g., 5%) to the new version. Monitor metrics. Gradually increase if healthy.

### Feature Flags
Deploy new code but keep it disabled via a feature flag. Enables deployment to be separated from feature release.

---

## Function-as-a-Service (FaaS)

FaaS platforms like AWS Lambda let you deploy individual functions without managing servers.

### When FaaS Works Well for Microservices
- Event-driven processing (S3 uploads, Kafka events, HTTP webhooks)
- Intermittent workloads (no traffic most of the time)
- Simple, stateless operations

### When FaaS Doesn't Work Well
- Long-running processes (Lambda has 15-minute max execution)
- Low-latency requirements (cold starts add 100ms–1s latency)
- Complex stateful workflows

### Spring Cloud Function
Spring Cloud Function abstracts away the target runtime:
```java
@Bean
public Function<OrderEvent, ShippingRequest> processOrder() {
    return event -> new ShippingRequest(event.getOrderId(), event.getAddress());
}
```
This function can be deployed to AWS Lambda, Azure Functions, or run as a standard Spring Boot app — without code changes.

---

## GitOps

GitOps treats infrastructure and deployment configuration as code, stored in Git. A GitOps operator (Argo CD, Flux) watches Git and automatically applies changes to the cluster.

```
Developer pushes to Git
  → Argo CD detects change
  → Argo CD applies Kubernetes manifests
  → Cluster reaches desired state
```

Benefits: auditable history, rollback = git revert, no manual kubectl commands in production.

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| Containers | Lightweight isolated runtime; use Docker for every microservice |
| Kubernetes | Container orchestration — deployment, scaling, health, networking |
| Rolling update | Gradually replace old pods — zero downtime by default |
| Blue/Green | Run two environments; instant traffic switch and rollback |
| Canary | Gradually shift traffic to the new version; monitor before full rollout |
| FaaS | Serverless functions — great for event-driven, intermittent workloads |
| GitOps | Git as the source of truth for deployments; automated reconciliation |
