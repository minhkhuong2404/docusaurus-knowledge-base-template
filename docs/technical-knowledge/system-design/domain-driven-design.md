---
id: domain-driven-design
title: Domain-Driven Design (DDD)
sidebar_label: Domain-Driven Design
description: Practical DDD for system design interviews and production architecture, including bounded contexts, aggregates, context mapping, and migration patterns.
tags: [ddd, bounded-context, aggregate, ubiquitous-language, context-mapping, domain-modeling, microservices]
---

# Domain-Driven Design (DDD)

> DDD helps teams model complex business domains with shared language and clear boundaries.

---

## Beginner View

DDD is not just about entities and repositories. It is about designing software around business concepts:
- **Ubiquitous Language**: one shared vocabulary used by engineers and domain experts
- **Bounded Context**: an explicit boundary where terms and rules have one meaning
- **Model + Code Alignment**: code structure mirrors domain behavior, not just database tables

Example:
- In Checkout context, `Order` means payment lifecycle and fulfillment status
- In Analytics context, `Order` may be immutable event facts

Same word, different meaning. Separate contexts avoid semantic conflicts.

---

## Core Building Blocks

### Entities
Objects with stable identity over time.

```java
public class Customer {
    private final CustomerId id;
    private String email;
}
```

### Value Objects
Immutable types defined by value, not identity.

```java
public record Money(BigDecimal amount, Currency currency) {
    public Money add(Money other) {
        if (!currency.equals(other.currency())) throw new IllegalArgumentException("currency mismatch");
        return new Money(amount.add(other.amount()), currency);
    }
}
```

### Aggregates and Aggregate Root
Aggregate is a consistency boundary. External code should change state via the root only.

```java
public class Order {
    private final OrderId id;
    private final List<OrderLine> lines = new ArrayList<>();

    public void addLine(ProductId productId, int qty) {
        if (qty <= 0) throw new IllegalArgumentException("qty must be positive");
        lines.add(new OrderLine(productId, qty));
    }
}
```

Rule of thumb: enforce invariants inside aggregate transactions.

---

## Senior Deep Dive

### Strategic Design: Context Mapping
Define integration style between contexts:
- **Published Language**: stable contracts/events for consumers
- **Anti-Corruption Layer (ACL)**: translate external model into local model
- **Conformist**: downstream accepts upstream model (fast but coupling risk)

### Aggregate Sizing Tradeoff
- Too large aggregate: heavy contention, low throughput
- Too small aggregate: invariant leakage across transactions

Use aggregate for invariants that must be atomic. Everything else uses async policies/process managers.

### DDD and Microservices
Do not map one entity to one service. Map one **bounded context** to one service boundary when team ownership and change cadence align.

### DDD and Event-Driven Architecture
Use domain events to integrate contexts while preserving autonomy.

```java
public class Order {
    public Order place() {
        // domain mutation
        registerDomainEvent(new OrderPlaced(id));
        return this;
    }
}
```

Pair with Outbox to avoid dual-write inconsistency.

---

## Common Failure Modes

- Team uses DDD vocabulary but keeps shared database schema across contexts
- Over-modeling simple CRUD domains (accidental complexity)
- "One microservice per aggregate" explosion causing operational overhead
- Missing ACL leads to model leakage and tight coupling

---

## Production Checklist

- Every context has explicit owner and glossary
- Context contracts are versioned
- Critical invariants are inside aggregate transactions
- Cross-context workflows use saga/outbox patterns
- Observability includes context-level KPIs (latency, error, drift)

---

## Interview Questions

### Q: What is the difference between an aggregate and an entity?

**A:** An entity has stable identity across state changes, while an aggregate is a consistency boundary containing one or more entities/value objects. Only the aggregate root is modified from outside.

### Q: How do bounded contexts reduce accidental coupling in microservices?

**A:** They define explicit language and model boundaries per domain area, preventing shared ambiguous schemas. Teams evolve independently through contracts instead of hidden cross-service assumptions.

### Q: When should you use an anti-corruption layer?

**A:** Use ACL when integrating with legacy/external models you do not control. It translates concepts and protects your domain from upstream model leakage.

### Q: How do you choose aggregate boundaries for high-write systems?

**A:** Keep aggregates small and aligned to invariants that must be transactionally consistent. Split hot aggregates to reduce lock contention and increase write parallelism.

### Q: Why can one bounded context map to one service, but not always?

**A:** A bounded context is a conceptual boundary, not a mandatory deployment unit. One context may need multiple services for scale, or multiple small contexts may share one service early on.

### Q: How does DDD integrate with outbox and saga patterns?

**A:** Aggregates emit domain events; outbox publishes them reliably after commit; sagas coordinate cross-context workflows. This preserves local consistency while enabling eventual global consistency.

### Q: What are signs a team is over-applying DDD?

**A:** Excessive abstraction, ceremony-heavy modeling, and slow delivery for simple CRUD needs. If domain complexity is low, a simpler modular design is usually better.

### Q: How would you model payment and ledger contexts with different consistency needs?

**A:** Keep ledger as strongly consistent, append-only source of truth; let payment orchestration be eventually consistent with retries/compensation. Bridge with immutable events and strict reconciliation.

