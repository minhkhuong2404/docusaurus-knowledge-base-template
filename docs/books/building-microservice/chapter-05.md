---
sidebar_position: 6
title: 'Chapter 5: Implementing Microservice Communication'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-05
---
# Chapter 5: Implementing Microservice Communication

**Part II — Implementation**

> Theory is good; implementation is reality. This chapter dives into the specific technologies and patterns you'll use to make services talk to each other, covering REST, gRPC, message brokers, API gateways, and service meshes.

---

## From Style to Technology

Chapter 4 covered *communication styles*. Now we get to the concrete technologies. For Java/Spring teams, the main choices are:

| Style | Technologies |
|-------|-------------|
| Sync REST | Spring MVC, Spring WebFlux, RestTemplate, WebClient, OpenFeign |
| Sync RPC | gRPC + protobuf |
| Async messaging | Apache Kafka, RabbitMQ, AWS SQS, Spring Cloud Stream |
| API Gateway | Spring Cloud Gateway, Kong, AWS API Gateway |

---

## Synchronous REST

The most common choice. Services expose HTTP endpoints; others call them with HTTP clients.

### Designing Good REST APIs

- Use nouns for resources: `/orders`, `/customers/{id}`
- Use HTTP verbs semantically: `GET` (read), `POST` (create), `PUT`/`PATCH` (update), `DELETE`
- Return appropriate status codes: `200`, `201`, `404`, `400`, `409`, `500`
- Version your APIs: `/v1/orders`

### Spring WebClient (Reactive, Non-Blocking)
Preferred for new Spring Boot services — non-blocking and composable:
```java
WebClient client = WebClient.create("http://order-service");

Mono<OrderDto> order = client.get()
    .uri("/orders/{id}", orderId)
    .retrieve()
    .onStatus(HttpStatus::is4xxClientError, resp -> 
        Mono.error(new OrderNotFoundException(orderId)))
    .bodyToMono(OrderDto.class);
```

### OpenFeign (Declarative REST Client)
Spring Cloud OpenFeign lets you define REST clients as interfaces:
```java
@FeignClient(name = "order-service", url = "${order-service.url}")
public interface OrderClient {
    @GetMapping("/orders/{id}")
    OrderDto getOrder(@PathVariable String id);

    @PostMapping("/orders")
    OrderDto createOrder(@RequestBody CreateOrderRequest request);
}
```
Clean, testable, and integrates with Spring's dependency injection.

---

## gRPC

gRPC is a high-performance RPC framework using Protocol Buffers (binary format). Excellent for internal service-to-service communication where performance and strict contracts matter.

### Defining a Service Contract (.proto file)
```protobuf
syntax = "proto3";

service OrderService {
    rpc GetOrder (GetOrderRequest) returns (Order);
    rpc CreateOrder (CreateOrderRequest) returns (Order);
}

message Order {
    string order_id = 1;
    string customer_id = 2;
    string status = 3;
    repeated OrderLine lines = 4;
}
```

The `.proto` file is compiled to generate Java client and server stubs. Schema-first design enforces explicit contracts between services.

### Advantages over REST
- Smaller payload (binary vs. JSON)
- Strongly typed contracts — breaking changes caught at compile time
- Supports streaming (server-side, client-side, bidirectional)

### Disadvantages
- Not human-readable (no curl debugging)
- Harder to consume from browsers
- Additional build tooling required (protoc compiler)

---

## Message Brokers: Kafka and RabbitMQ

### Apache Kafka

Kafka is a distributed event log. Services publish to **topics**; consumers read from topics at their own pace. Messages are retained for a configurable period, allowing replay.

**Spring Boot + Kafka:**
```java
// Producer
@Service
public class OrderEventPublisher {
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void publishOrderPlaced(Order order) {
        kafkaTemplate.send("order-events", order.getId(), 
            new OrderPlacedEvent(order.getId(), order.getCustomerId()));
    }
}

// Consumer
@Component
public class InventoryEventHandler {
    @KafkaListener(topics = "order-events", groupId = "inventory-service")
    public void handleOrderPlaced(OrderPlacedEvent event) {
        inventoryService.reserveStock(event.getOrderId());
    }
}
```

**Key Kafka concepts:**
- **Topic** — named category of messages
- **Partition** — unit of parallelism; messages in one partition are ordered
- **Consumer Group** — multiple instances of a service share a group; each partition consumed by one instance
- **Offset** — position in the partition; committed after processing

### RabbitMQ
Message queue with more routing flexibility (exchanges, routing keys). Better suited for task queues and request/reply patterns. Kafka is better for high-throughput event streaming.

---

## Service Discovery

In microservices, instances come and go. Hard-coded URLs break. Service discovery solves this.

### Client-Side Discovery (Spring Cloud + Eureka)
```java
// Service registers itself
@SpringBootApplication
@EnableEurekaClient
public class OrderServiceApplication { ... }

// Client discovers and calls
@FeignClient(name = "order-service")  // resolved via Eureka
public interface OrderClient { ... }
```

### Server-Side Discovery (Kubernetes)
In Kubernetes, a `Service` object provides a stable DNS name. The cluster routes to healthy pods automatically. Spring apps call `http://order-service/orders` — Kubernetes handles the rest.

---

## API Gateway

The API Gateway is the single entry point for external clients (browsers, mobile apps). It handles:
- **Routing** — direct requests to appropriate services
- **Authentication** — validate tokens before forwarding
- **Rate limiting** — protect services from abuse
- **SSL termination** — handle HTTPS at the edge
- **Request aggregation** — combine multiple service calls into one response

### Spring Cloud Gateway
```java
@Bean
public RouteLocator routes(RouteLocatorBuilder builder) {
    return builder.routes()
        .route("order-service", r -> r.path("/api/orders/**")
            .filters(f -> f.stripPrefix(1)
                          .addRequestHeader("X-Source", "gateway"))
            .uri("lb://order-service"))
        .route("catalog-service", r -> r.path("/api/catalog/**")
            .uri("lb://catalog-service"))
        .build();
}
```

:::warning[Don't let your API gateway become a smart router with business logic. Keep it as a dumb pipe. Business logic belongs in microservices, not the gateway.]
:::

---

## Service Mesh

A service mesh (Istio, Linkerd) handles communication concerns at the infrastructure level, outside application code:
- Mutual TLS between services (automatic)
- Circuit breaking and retries
- Distributed tracing
- Traffic management (A/B testing, canary releases)

The application code becomes simpler; the infrastructure handles cross-cutting concerns. The trade-off is operational complexity of the mesh itself.

---

## Handling Partial Failures

In synchronous communication, downstream failures propagate up. Mitigation strategies:

### Timeouts
Always set timeouts. Never let a downstream service hold your threads forever.
```java
WebClient.builder()
    .baseUrl("http://order-service")
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create()
            .responseTimeout(Duration.ofSeconds(2))
    ))
    .build();
```

### Retries
Retry transient failures — but only for **idempotent** operations.
```java
// Spring Retry
@Retryable(value = {RemoteServiceException.class}, maxAttempts = 3,
           backoff = @Backoff(delay = 500, multiplier = 2))
public OrderDto getOrder(String orderId) { ... }
```

### Circuit Breaker (Resilience4j)
After a threshold of failures, "open" the circuit and return a fallback immediately. Prevents cascading failures.
```java
@CircuitBreaker(name = "orderService", fallbackMethod = "fallbackGetOrder")
public OrderDto getOrder(String orderId) {
    return orderClient.getOrder(orderId);
}

public OrderDto fallbackGetOrder(String orderId, Exception ex) {
    return OrderDto.empty();  // graceful degradation
}
```

---

## Summary

| Technology | Best For |
|------------|----------|
| Spring WebClient / OpenFeign | Sync REST calls between services |
| gRPC | High-performance internal RPC with strict contracts |
| Kafka | High-throughput event streaming and async communication |
| RabbitMQ | Task queues and complex message routing |
| Spring Cloud Gateway | API Gateway — routing, auth, rate limiting |
| Resilience4j | Circuit breaking, retries, timeouts |
| Service Mesh | Cross-cutting network concerns at infrastructure level |
