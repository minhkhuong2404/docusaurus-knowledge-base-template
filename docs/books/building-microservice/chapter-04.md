---
sidebar_position: 5
title: 'Chapter 4: Microservice Communication Styles'
description: '**Part I — Foundation**'
tags:
- books
- building-microservice
- chapter-04
---
# Chapter 4: Microservice Communication Styles

**Part I — Foundation**

> Services must talk to each other. This chapter surveys the landscape of inter-service communication — synchronous vs. asynchronous, request/response vs. event-driven — and the trade-offs of each.

---

## The Communication Landscape

When one microservice needs something from another, it has two fundamental choices:

1. **Synchronous** — caller waits for a response
2. **Asynchronous** — caller sends a message and continues; it may get a response later or not at all

And two interaction styles:

1. **Request/Response** — caller explicitly asks; receives an answer
2. **Event-Driven** — services react to things that have happened

These two axes combine into four styles. Understanding them is essential to making the right architecture choices.

---

## Synchronous Blocking Communication

The caller sends a request and **waits** until it gets a response before continuing.

```
Service A  ──── request ────►  Service B
Service A  ◄─── response ────  Service B
(A is blocked until B replies)
```

### Advantages
- Simple mental model — works like a method call
- Easy to reason about success/failure
- Natural for request/response use cases (e.g., "get product details")

### Disadvantages
- **Temporal coupling** — if B is slow or unavailable, A is stuck
- Cascading failures — a slow downstream service can exhaust A's thread pool
- Scales poorly under latency

### Common technologies
- **REST over HTTP** — the default for most Java/Spring teams
- **gRPC** — binary, schema-driven, very efficient; good for internal service-to-service calls
- **GraphQL** — useful for aggregating data for UI clients

---

## Asynchronous Non-Blocking Communication

The caller sends a message and **does not wait**. Work continues independently. This decouples services in time.

```
Service A  ──── message ────►  Message Broker  ──── delivers ────►  Service B
(A continues immediately)
```

### Advantages
- No temporal coupling — B can be offline; messages queue up
- Better resilience — downstream slowness doesn't block the caller
- Natural for long-running processes

### Disadvantages
- More complex mental model
- Harder to trace failures end-to-end
- Requires message broker infrastructure (Kafka, RabbitMQ, etc.)

---

## Communication Patterns

### 1. Request/Response (Synchronous or Async)

The caller explicitly requests something and expects a result. Can be done synchronously (HTTP) or asynchronously (request sent to queue; response comes back on reply queue).

**Synchronous example (Spring):**
```java
// RestTemplate or WebClient
ResponseEntity<OrderDto> response = restTemplate.getForEntity(
    "http://order-service/orders/{id}", OrderDto.class, orderId);
```

**Asynchronous request-response:**
- Caller sends a message with a `correlationId` and `replyTo` address
- Responder processes and sends result to `replyTo` queue
- Caller picks up result by matching `correlationId`

### 2. Event-Driven Communication

Services publish events when something happens. Other services subscribe and react. No direct coupling — the publisher doesn't know who's listening.

```
Order Service ──► "OrderPlaced" event ──► [ Broker ]
                                              │
                              ┌───────────────┼─────────────────┐
                              ▼               ▼                 ▼
                     Notification       Inventory         Recommendation
                       Service           Service             Service
```

**Example (Spring + Kafka):**
```java
// Publisher
kafkaTemplate.send("order-events", new OrderPlacedEvent(orderId, customerId));

// Subscriber
@KafkaListener(topics = "order-events")
public void onOrderPlaced(OrderPlacedEvent event) {
    notificationService.sendConfirmation(event.getCustomerId());
}
```

Events are the most powerful form of decoupling. The Order service doesn't know or care about Notifications, Inventory, or Recommendations.

### 3. Common Data (Event Collaboration via Shared Store)
Services communicate by reading and writing to shared data stores (e.g., a data lake or S3). Less common in real-time microservices, more common in data pipeline architectures.

---

## Choosing a Style

| Question | Recommendation |
|----------|----------------|
| Do you need an immediate response? | Synchronous request/response |
| Is the operation long-running? | Async + polling or callback |
| Does one event need to trigger many services? | Event-driven |
| Are services from different teams? | Prefer async; reduces inter-team coordination |
| Is the domain transactional (e.g., payment)? | Be careful — consider sagas (Chapter 6) |

---

## The Choreography vs. Orchestration Debate

Two patterns for coordinating multi-service workflows:

### Orchestration (Centralized)
One service explicitly tells others what to do, step by step.

```
Order Service (Orchestrator)
  ├── calls Inventory: "reserve stock"
  ├── calls Payments: "charge customer"
  └── calls Shipping: "dispatch"
```

Pros: Easy to see the full workflow in one place.
Cons: The orchestrator becomes tightly coupled to all other services.

### Choreography (Decentralized)
Services react to events emitted by others. No central controller.

```
Order Service emits "OrderCreated"
  → Inventory reacts: reserves stock, emits "StockReserved"
  → Payments reacts to "StockReserved": charges customer, emits "PaymentTaken"
  → Shipping reacts to "PaymentTaken": dispatches
```

Pros: True decoupling; services don't know about each other.
Cons: Harder to see the full workflow; debugging requires event tracing tools.

:::info
Most real systems use a mix. Start with choreography for loose coupling; use orchestration only where visibility into the workflow is critical (e.g., user-facing checkout).
:::

---

## Schema and Contract Evolution

No matter which style you choose, you need a strategy for changing APIs without breaking consumers.

### Backward Compatible Changes (Safe)
- Adding new optional fields to a response
- Adding new endpoints

### Breaking Changes (Dangerous)
- Removing fields consumers rely on
- Renaming fields
- Changing field types

### Strategies
1. **Semantic Versioning** of APIs: `/v1/orders`, `/v2/orders`
2. **Expand and Contract**: add new field + old field together; migrate consumers; then remove old field
3. **Tolerant Reader**: consumers ignore unknown fields (default in JSON; use `@JsonIgnoreProperties(ignoreUnknown = true)` in Jackson)

```java
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderDto {
    private String orderId;
    private String status;
    // Ignores any new fields added by the server — safe to evolve
}
```

---

## Summary

| Style | Blocking? | Use When |
|-------|-----------|----------|
| Sync Request/Response | Yes | Need immediate answer; simple use case |
| Async Request/Response | No | Long-running; caller doesn't need to wait |
| Event-Driven | No | One change should trigger many services |
| Common Data | No | Batch/data pipeline scenarios |
| Orchestration | — | Workflow visibility is important |
| Choreography | — | Maximum decoupling between teams |
