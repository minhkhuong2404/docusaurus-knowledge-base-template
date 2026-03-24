---
sidebar_position: 14
title: 'Chapter 13: Scaling'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-13
---
# Chapter 13: Scaling

**Part II — Implementation**

> Microservices enable targeted, independent scaling. But not all scaling problems are the same. This chapter introduces the four axes of scaling and how to apply them intelligently.

---

## Why Scale?

Scaling isn't just about handling more traffic. You scale for:
- **Performance** — reduce response latency
- **Throughput** — handle more requests per second
- **Availability** — survive the failure of individual nodes

Microservices enable *selective* scaling: if the Catalog service is under load, scale just the Catalog service — not everything.

---

## The Four Axes of Scaling

Sam Newman adapts Martin Abbott and Michael Fisher's **Scale Cube** into four axes:

### Axis 1: Vertical Scaling (Scale Up)
Add more resources (CPU, RAM) to existing instances.

```
Before: 2 CPU, 4GB RAM
After:  8 CPU, 16GB RAM
```

Simple to implement, no code changes. But there's a ceiling — you can't vertically scale forever, and it can get expensive fast.

**Best for:** Quick short-term relief for resource-constrained services.

### Axis 2: Horizontal Duplication (Scale Out)
Run multiple identical instances behind a load balancer.

```
              Load Balancer
             /       |       \
    Instance 1  Instance 2  Instance 3
```

This is the primary scaling mechanism for stateless microservices. Kubernetes makes this trivial:
```bash
kubectl scale deployment order-service --replicas=5
```

Or with Horizontal Pod Autoscaler (HPA):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

**Requirement:** The service must be **stateless** — no in-memory state that differs between instances. Use Redis for shared session/cache.

### Axis 3: Data Partitioning (Shard / Functional Decomposition)
Split by data characteristics — route different subsets of data to different instances.

**Example — Sharding by customer region:**
```
Requests for EU customers → EU Order Service cluster → EU database
Requests for US customers → US Order Service cluster → US database
```

**Example — Functional decomposition:**
Split a large service into smaller, focused services. Order Service splits into:
- `order-creation-service` (write-heavy)
- `order-query-service` (read-heavy, backed by a read replica or Elasticsearch)

This is Command Query Responsibility Segregation (CQRS) — reads and writes scale independently.

**CQRS with Spring:**
```java
// Command side — writes to PostgreSQL
@Service
public class OrderCommandService {
    public void createOrder(CreateOrderCommand cmd) {
        Order order = new Order(cmd);
        orderRepository.save(order);
        eventPublisher.publish(new OrderCreatedEvent(order));
    }
}

// Query side — reads from denormalized Elasticsearch index
@Service
public class OrderQueryService {
    public List<OrderSummary> getOrdersForCustomer(String customerId) {
        return elasticsearchTemplate.search(
            Query.of(q -> q.term(t -> t.field("customerId").value(customerId))),
            OrderSummary.class
        ).getSearchHits().stream()
            .map(SearchHit::getContent)
            .collect(toList());
    }
}
```

### Axis 4: Caching
Reduce load by storing frequently accessed, infrequently changing data in a fast cache.

**Types of caches:**

| Type | Example | Use |
|---|---|---|
| In-process | Caffeine | Per-instance cache; invalidation tricky with multiple instances |
| Distributed | Redis | Shared across instances; consistent |
| HTTP cache | CDN, Varnish | Cache public HTTP responses at the edge |

**Spring Boot + Redis:**
```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public RedisCacheConfiguration cacheConfig() {
        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));
    }
}

@Service
public class ProductService {
    @Cacheable(value = "products", key = "#productId")
    public Product getProduct(String productId) {
        return productRepository.findById(productId).orElseThrow();
    }

    @CacheEvict(value = "products", key = "#product.id")
    public void updateProduct(Product product) {
        productRepository.save(product);
    }
}
```

---

## Autoscaling

Manual scaling is reactive; autoscaling is proactive.

### Metrics-Based Autoscaling
Scale based on CPU, memory, or custom metrics:

```yaml
# Scale on custom Kafka consumer lag metric
- type: External
  external:
    metric:
      name: kafka_consumer_group_lag
      selector:
        matchLabels:
          topic: order-events
          group: inventory-service
    target:
      type: AverageValue
      averageValue: "1000"  # Scale up when average lag > 1000 messages
```

### KEDA (Kubernetes Event-Driven Autoscaling)
KEDA scales based on event sources — Kafka lag, SQS queue depth, Cron schedule:
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: inventory-service-scaler
spec:
  scaleTargetRef:
    name: inventory-service
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka:9092
        consumerGroup: inventory-service
        topic: order-events
        lagThreshold: "100"
```

---

## Database Scaling

The database is often the bottleneck when scaling microservices. Options:

### Read Replicas
Direct read traffic to replicas; writes go to the primary. Useful for read-heavy workloads.

```yaml
# Spring datasource routing
spring:
  datasource:
    primary:
      url: jdbc:postgresql://primary-db:5432/orders
    replica:
      url: jdbc:postgresql://replica-db:5432/orders
```

### Connection Pooling
Each microservice instance needs database connections. With 20 instances of order-service, you quickly exhaust PostgreSQL's default 100 connection limit. Use **PgBouncer** as a connection pooler in front of PostgreSQL.

### Database Sharding
Partition data across multiple database instances by a shard key (e.g., customer ID). Complex to implement; avoid until truly necessary.

---

## CAP Theorem and Scaling Trade-offs

When scaling distributed systems, you inevitably face trade-offs defined by the CAP theorem:
- **C**onsistency — every read receives the most recent write
- **A**vailability — every request receives a response
- **P**artition Tolerance — system continues to operate despite network partition

In practice, partition tolerance is unavoidable in distributed systems. So you choose between Consistency and Availability when a partition occurs.

**Most microservice use cases favor Availability + Eventual Consistency** — be available and eventually become consistent, rather than blocking operations to guarantee immediate consistency.

---

## Summary

| Axis | Technique | Best For |
|---|---|---|
| Vertical | Scale up CPU/RAM | Quick relief; early-stage scaling |
| Horizontal | Multiple instances + LB | Stateless services — the primary scaling mechanism |
| Data Partitioning | Sharding, CQRS | Read/write imbalance; region-based data |
| Caching | Redis, CDN, Caffeine | Frequently-read, rarely-changed data |
| Autoscaling | HPA, KEDA | Dynamic workloads, cost efficiency |
