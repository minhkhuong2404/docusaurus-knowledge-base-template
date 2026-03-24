---
sidebar_position: 7
title: 'Chapter 6: Workflow'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-06
---
# Chapter 6: Workflow

**Part II — Implementation**

> When a business process spans multiple services, how do you coordinate them reliably? This chapter covers the pitfalls of distributed transactions and the saga pattern as a practical alternative.

---

## The Problem: Multi-Service Business Processes

In a monolith, a business operation that touches multiple tables is wrapped in a single ACID database transaction. In microservices, each service has its own database. There is no single transaction.

Consider a customer checkout flow:
1. Reserve inventory (Inventory Service)
2. Charge the customer (Payment Service)
3. Create the order (Order Service)
4. Dispatch shipping (Shipping Service)

If step 3 fails, how do you un-charge the customer (step 2) and un-reserve the stock (step 1)?

---

## ACID Transactions — The Monolith Luxury

**ACID** = Atomicity, Consistency, Isolation, Durability

In a single database, ACID gives you a safety net: either all changes succeed, or none do. With separate databases per microservice, this guarantee disappears at the system level. Each service still has ACID within its own database — you just lose cross-service atomicity.

---

## Why Distributed Transactions Don't Work Well

The seemingly obvious solution — a distributed transaction spanning multiple services — is not recommended.

### Two-Phase Commit (2PC)

The classic distributed transaction algorithm:

**Phase 1 (Vote):** Coordinator asks all participants: "Can you commit?"
- Each participant locks its data and responds "Yes" or "No"

**Phase 2 (Commit/Rollback):** If all say Yes, coordinator sends "Commit". Otherwise, "Rollback".

```
Coordinator
  ├── → Inventory: "Can you reserve stock?" → "Yes" (locks record)
  ├── → Payments: "Can you charge?" → "Yes" (locks record)
  └── → All: "Commit now"
```

### Why 2PC is Problematic in Microservices
- **Locks are held** between phases — reduces throughput significantly
- **Coordinator is a SPOF** — if it fails mid-way, participants are stuck with locks
- **Increased latency** — multiple round trips between services
- **Complex failure handling** — network timeouts between phases create ambiguous states
- **Requires XA-capable databases** — not all modern datastores support this

:::danger
Avoid distributed transactions (2PC/XA) in microservices. The performance and reliability costs are not worth it.
:::

---

## The Saga Pattern — The Alternative

A **Saga** is a sequence of local transactions, each in a separate service, coordinated without a global transaction. If a step fails, the saga executes **compensating transactions** to undo prior completed steps.

### Two Types of Sagas

#### 1. Choreography-Based Saga
Services react to events. Each service does its local transaction and emits an event. The next service listens and acts.

```
1. Order Service: creates order → emits "OrderCreated"
2. Inventory Service: listens to "OrderCreated" → reserves stock → emits "StockReserved"
3. Payment Service: listens to "StockReserved" → charges customer → emits "PaymentTaken"
4. Shipping Service: listens to "PaymentTaken" → dispatches
```

**Failure path (compensating transactions):**
```
Payment fails → emits "PaymentFailed"
  → Inventory Service listens: releases reserved stock
  → Order Service listens: cancels order
```

**Spring + Kafka example:**
```java
// Inventory Service
@KafkaListener(topics = "order-events")
public void onOrderCreated(OrderCreatedEvent event) {
    try {
        inventory.reserve(event.getOrderId(), event.getItems());
        kafkaTemplate.send("inventory-events", 
            new StockReservedEvent(event.getOrderId()));
    } catch (InsufficientStockException e) {
        kafkaTemplate.send("inventory-events", 
            new StockReservationFailedEvent(event.getOrderId()));
    }
}
```

#### 2. Orchestration-Based Saga
A central **saga orchestrator** explicitly coordinates the steps, calling each service and handling failures.

```java
public class OrderSaga {
    public void execute(CreateOrderCommand cmd) {
        try {
            inventoryClient.reserve(cmd.getItems());      // Step 1
            paymentClient.charge(cmd.getCustomerId());     // Step 2
            orderRepository.save(new Order(cmd));          // Step 3
            shippingClient.dispatch(cmd.getOrderId());     // Step 4
        } catch (PaymentException e) {
            inventoryClient.release(cmd.getItems());       // Compensate Step 1
            throw new OrderCreationFailedException(e);
        }
    }
}
```

The orchestrator can be implemented as a Spring `@Service` or as a durable workflow using tools like **Axon Framework**, **Temporal**, or **Camunda**.

---

## Choreography vs. Orchestration Comparison

| | Choreography | Orchestration |
|---|---|---|
| **Coupling** | Low — services don't know each other | Medium — orchestrator knows all services |
| **Visibility** | Hard to see end-to-end flow | Easy — orchestrator is the source of truth |
| **Debugging** | Hard — requires event tracing | Easier — one place to look |
| **Failure handling** | Distributed across services | Centralized in orchestrator |
| **Scalability** | High — services scale independently | Limited by orchestrator |
| **Best for** | Loosely coupled workflows | Complex workflows with many failure scenarios |

---

## Eventual Consistency

Sagas introduce **eventual consistency** — the system will *eventually* reach a consistent state, but there may be a window where intermediate states are visible.

For example, after step 1 (stock reserved) but before step 4 (shipping dispatched), the system is in an intermediate state. This is acceptable — but you need to:

1. **Design your UI** to show intermediate states ("Order being processed...")
2. **Expose saga status** so customers can track progress
3. **Handle idempotency** — if a message is replayed, re-processing it shouldn't cause double-charges

### Idempotency Keys

Always include an idempotency key in requests. If a service receives the same request twice (due to network retry), it should handle it gracefully:

```java
// Before processing, check if already processed
if (processedEventRepository.exists(event.getSagaId())) {
    return;  // Already handled — idempotent
}
processedEventRepository.save(event.getSagaId());
// ... process the event
```

---

## The Outbox Pattern (Transactional Messaging)

A subtle but critical problem: how do you atomically save to your database AND publish an event to Kafka?

```java
// WRONG — non-atomic: DB succeeds but Kafka fails
orderRepository.save(order);           // succeeds
kafkaTemplate.send("events", event);   // might fail!
```

**Solution: Outbox Pattern**

1. Write the event to an `outbox` table *in the same transaction* as your entity save
2. A separate background process reads the outbox and publishes to Kafka
3. After successful publish, mark the outbox entry as processed

```sql
-- Same transaction
INSERT INTO orders (...) VALUES (...);
INSERT INTO outbox (event_type, payload) VALUES ('OrderCreated', '{"orderId":"..."}');
```

Tools like **Debezium** (CDC — Change Data Capture) can read the outbox table from PostgreSQL's WAL and publish to Kafka automatically.

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| ACID (per-service) | Each service still has ACID locally; cross-service ACID is gone |
| Two-Phase Commit | Distributed transaction algorithm — avoid due to locks and SPOF issues |
| Saga | Sequence of local transactions with compensating actions for failures |
| Choreography Saga | Event-driven coordination — no central controller |
| Orchestration Saga | Central controller explicitly calls each step |
| Eventual Consistency | System reaches consistency over time, not instantly |
| Outbox Pattern | Atomically write to DB and guarantee event publication |
