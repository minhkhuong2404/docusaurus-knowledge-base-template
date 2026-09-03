---
id: chapter-06-functional-programming
title: "Chapter 6: Functional Programming"
sidebar_position: 4
description: >
  Functional programming's core discipline — immutability — eliminates entire classes of concurrency bugs. Learn how immutability, segregation of mutability, and event sourcing shape modern system design.
tags:
  - functional-programming
  - immutability
  - event-sourcing
  - concurrency
  - architecture
---

# Chapter 6: Functional Programming

> _"Functional programming imposes discipline upon assignment."_

## 🎓 For New Learners

### The Oldest Paradigm, Adopted Last

Functional programming is the oldest of the three paradigms — rooted in Alonzo Church's λ-calculus (1936) — yet the last to gain mainstream adoption. Its core idea: **variables don't vary**. Once a value is bound, it never changes. No assignment. No mutation.

This sounds restrictive. It is. But it eliminates an entire universe of bugs.

### Why Immutability Matters for Architecture

Consider every race condition, concurrency bug, or unexpected state corruption you've debugged. What do they share?

**Multiple threads competing to update the same mutable state.**

If state never changes, there is nothing to compete over. Race conditions become impossible by design.

> _"All race conditions, deadlock conditions, and concurrent update problems are due to mutable variables."_

### Segregation of Mutability

Pure immutability is impractical — you eventually write to databases, accept input, publish events. The solution is **segregation**:

- Keep the **core** of the system pure (no side effects)
- Isolate mutation at the **boundaries**
- Data crossing boundaries travels as immutable structures

| Architectural Zone | Mutability State | Operational Behavior | Examples & Boundaries |
|---|---|---|---|
| **Pure Functional Core** | Strictly **Immutable** | Pure transformation functions ($f(input) 	o output$), deterministic, zero side-effects. | Domain entities, business calculations, rule validators. |
| **Mutable Boundary** | Controlled **Mutable** | Handles side-effects, manages I/O, persists state, interacts with external network sockets. | Repository writes, REST controllers, Kafka consumers, DB connections. |

### Event Sourcing

Instead of storing **current state** (mutable), store the **history of events** (immutable). Current state is derived by replaying events.

- Only appends — no updates or deletes
- Complete audit trail preserved
- State at any past moment is reproducible
- CRUD becomes CR

---

## 🔬 Senior Deep Dive

### Immutable Value Objects in Java

```java
// Mutable — dangerous to share
public class Money {
    private BigDecimal amount;
    public void setAmount(BigDecimal a) { this.amount = a; }
}

// Immutable record — safe to share across threads and boundaries
public record Money(BigDecimal amount, Currency currency) {
    public Money add(Money other) {
        return new Money(this.amount.add(other.amount), this.currency);
    }
}
```

### Functional Pipelines vs Mutable Loops

```java
// Mutable — shared mutable list, harder to parallelize safely
List<OrderSummary> results = new ArrayList<>();
for (Order o : orders) {
    if (o.isActive()) results.add(new OrderSummary(o.getId(), o.getTotal()));
}

// Immutable pipeline — pure transformations, parallelizable
List<OrderSummary> results = orders.stream()
    .filter(Order::isActive)
    .map(o -> new OrderSummary(o.getId(), o.getTotal()))
    .toList();
```

### Event Sourcing with Spring + Axon

```java
// Immutable event — a fact that happened
public record OrderPlacedEvent(String orderId, List<LineItem> items, Instant at) {}

@Aggregate
public class Order {
    @AggregateIdentifier private String orderId;
    private OrderStatus status;

    @CommandHandler
    public Order(PlaceOrderCommand cmd) {
        apply(new OrderPlacedEvent(cmd.orderId(), cmd.items(), Instant.now()));
    }

    @EventSourcingHandler
    public void on(OrderPlacedEvent event) {
        this.orderId = event.orderId();
        this.status = OrderStatus.PLACED;
    }
}
```

The aggregate only publishes immutable events; state is always reconstructed from the event log — never stored directly.

### The Architectural Segregation Pattern

Spring's `@Transactional` boundary is exactly the "mutable state fence":

```
Domain / Use Cases       ← Pure: no side effects, fully unit-testable
       ↕  (immutable DTOs / commands / events)
Adapters / Repositories  ← @Transactional: where mutation is committed
       ↕
Database / Message Bus   ← Where state actually persists
```

Everything inside the use case should be a pure function of its inputs. Spring infrastructure handles the commit.

---

## Summary

| Concept | Key Point |
|---|---|
| Immutability | No assignment → no race conditions, no concurrent update bugs |
| Segregation | Isolate mutation at boundaries; keep core logic pure |
| Event Sourcing | Store events (immutable facts), derive state by replay |
| Java tools | Records, stream pipelines, Axon Framework, CQRS |
| Architecture lesson | Immutable data crossing boundaries prevents hidden coupling and state corruption |
