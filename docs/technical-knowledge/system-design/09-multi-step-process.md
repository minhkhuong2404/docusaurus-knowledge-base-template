---
id: multi-step-process
title: Multi-Step Processes
sidebar_label: Multi-Step Processes
description: Patterns for managing distributed multi-step workflows including Sagas (orchestration vs choreography), process managers, compensating transactions, and idempotency in long transaction chains.
tags: [saga, orchestration, choreography, distributed-transactions, process-manager, compensating-transaction, workflow]
---

# Multi-Step Processes

> Distributed systems can't use database transactions across service boundaries. **Sagas** replace 2PC with a sequence of local transactions + compensating actions.

---

## The Problem: Distributed Transactions

```
Order Service → Reserve inventory (Service A)
             → Charge credit card (Service B)
             → Notify shipping (Service C)

If step C fails after A and B succeed → inconsistent state!
```

Traditional 2PC (Two-Phase Commit) is too slow, fragile, and unavailable during network partitions.

---

## The Saga Pattern

A Saga is a **sequence of local transactions**. If any step fails, execute **compensating transactions** to undo previous steps.

```
T1 → T2 → T3 → FAIL → C3 → C2 → C1
                       (compensations, in reverse)
```

### Compensating Transactions
| Step | Forward | Compensating |
|---|---|---|
| Reserve inventory | Decrease stock by N | Increase stock by N |
| Charge card | Debit $X | Refund $X |
| Create shipment | Create shipment record | Cancel shipment |

**Compensation ≠ Rollback** — compensation adds a new event; it doesn't undo history.

---

## Orchestration vs Choreography

### Orchestration (Central Coordinator)

```
           Saga Orchestrator (Order Service)
               ↓ command           ↓ command        ↓ command
         Inventory Svc       Payment Svc        Shipping Svc
               ↓ reply             ↓ reply          ↓ reply
```

**Pros**: Easy to understand flow. Centralized error handling.  
**Cons**: Orchestrator becomes a bottleneck. Tight coupling.

```java
// Spring State Machine or Temporal / Axon Framework
@Service
public class OrderSagaOrchestrator {

    @Transactional
    public void startOrderSaga(CreateOrderCommand cmd) {
        Order order = orderRepository.save(new Order(cmd));

        try {
            inventoryClient.reserve(cmd.getItems());
            paymentClient.charge(cmd.getPaymentInfo());
            shippingClient.schedule(order.getId());
            order.markCompleted();
        } catch (InventoryException e) {
            order.markFailed("Insufficient inventory");
        } catch (PaymentException e) {
            inventoryClient.release(cmd.getItems()); // Compensate
            order.markFailed("Payment failed");
        } catch (ShippingException e) {
            paymentClient.refund(cmd.getPaymentInfo()); // Compensate
            inventoryClient.release(cmd.getItems());     // Compensate
            order.markFailed("Shipping unavailable");
        }
        orderRepository.save(order);
    }
}
```

### Choreography (Event-Driven)

Each service reacts to events and emits its own events.

```
OrderPlaced  →  InventoryService reserves → InventoryReserved
                                        →  PaymentService charges → PaymentCharged
                                                               →  ShippingService schedules → OrderCompleted
If fail:
PaymentFailed → InventoryService releases → InventoryReleased
```

**Pros**: Decoupled services. Each service owns its logic.  
**Cons**: Hard to track overall flow. Debugging is complex (distributed trace needed).

```java
// Choreography with Kafka
@KafkaListener(topics = "order-placed")
public void onOrderPlaced(OrderPlacedEvent event) {
    try {
        inventoryRepository.reserve(event.getItems());
        kafkaTemplate.send("inventory-reserved", new InventoryReservedEvent(event.getOrderId()));
    } catch (InsufficientStockException e) {
        kafkaTemplate.send("inventory-reservation-failed",
            new InventoryFailedEvent(event.getOrderId(), e.getMessage()));
    }
}

@KafkaListener(topics = "inventory-reservation-failed")
public void onInventoryFailed(InventoryFailedEvent event) {
    orderRepository.markFailed(event.getOrderId(), event.getReason());
    // No payment was made, no need to compensate payment
}
```

---

## When to Use Each

| Factor | Orchestration | Choreography |
|---|---|---|
| Flow complexity | Simple to understand | Hard to trace |
| Service coupling | Higher (knows all services) | Lower (only knows events) |
| Error handling | Centralized, explicit | Distributed, complex |
| Team structure | Centralized team | Multiple independent teams |
| Observability | Easier | Needs distributed tracing |

---

## Process Manager Pattern

Stateful saga coordinator with explicit state machine.

```java
// Saga state stored in DB
@Entity
public class OrderSagaState {
    @Id UUID sagaId;
    Long orderId;

    @Enumerated(EnumType.STRING)
    SagaStep currentStep;  // PENDING, INVENTORY_RESERVED, PAYMENT_CHARGED, COMPLETED, FAILED

    String failureReason;
    LocalDateTime lastUpdated;
}

public enum SagaStep {
    PENDING, INVENTORY_RESERVED, PAYMENT_CHARGED, SHIPPING_SCHEDULED, COMPLETED, FAILED
}
```

---

## Idempotency in Sagas

Steps must be **idempotent** — safe to retry without side effects.

```java
// Payment charge with idempotency key
public ChargeResult chargeCard(ChargeRequest request) {
    String idempotencyKey = "charge:" + request.getOrderId();

    // Check if already processed
    Optional<ChargeResult> existing = chargeRepository.findByIdempotencyKey(idempotencyKey);
    if (existing.isPresent()) return existing.get();

    ChargeResult result = paymentGateway.charge(request);
    result.setIdempotencyKey(idempotencyKey);
    chargeRepository.save(result);
    return result;
}
```

---

## Transactional Outbox Pattern

Guarantee: **if you commit to DB, the event will be published** (no dual-write problem).

```java
@Transactional
public Order createOrder(CreateOrderCommand cmd) {
    Order order = orderRepository.save(new Order(cmd));

    // Save event in same transaction → atomicity guaranteed
    OutboxEvent event = new OutboxEvent("order-placed", toJson(new OrderPlacedEvent(order)));
    outboxRepository.save(event);

    return order;
    // Outbox poller reads & publishes to Kafka asynchronously
}

// Scheduled poller (or CDC with Debezium)
@Scheduled(fixedDelay = 1000)
public void pollOutbox() {
    List<OutboxEvent> pending = outboxRepository.findUnpublished();
    for (OutboxEvent event : pending) {
        kafkaTemplate.send(event.getTopic(), event.getPayload());
        outboxRepository.markPublished(event.getId());
    }
}
```

---

## Rollback Complexity & Semantic Rollbacks

Some actions can't be truly undone (email sent, payment settled).  
Design compensations that are **semantically equivalent** to rollback:
- Instead of "unsend email" → send a follow-up "cancellation" email
- Instead of "uncharged card" → issue refund
- Instead of "delete audit log" → add a correction entry

---

## Interview Questions

1. What is the Saga pattern and why is it needed in microservices?
2. What is the difference between orchestration and choreography in a Saga?
3. What is a compensating transaction? Give a real-world example.
4. How do you ensure idempotency in saga steps?
5. What is the transactional outbox pattern and what problem does it solve?
6. How would you design a distributed checkout flow that spans inventory, payment, and shipping services?
7. What is the dual-write problem and how do you avoid it?
8. How do you handle a saga that partially completes and the compensating transaction also fails?
