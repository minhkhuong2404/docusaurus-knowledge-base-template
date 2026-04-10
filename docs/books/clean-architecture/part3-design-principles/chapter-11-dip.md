---
id: chapter-11-dip
title: "Chapter 11: DIP — The Dependency Inversion Principle"
sidebar_position: 5
description: >
  High-level policy should not depend on low-level details. Both should depend on abstractions. DIP is the mechanism that makes Clean Architecture possible — and the most architecturally consequential of all SOLID principles.
tags:
  - solid
  - dip
  - dependency-inversion
  - design-principles
  - abstractions
  - factories
---

# Chapter 11: DIP — The Dependency Inversion Principle

> _"High-level policy should not depend on low-level details. Details should depend on policies."_

## 🎓 For New Learners

### The Problem with Depending on Concretions

When a high-level business module directly imports a low-level implementation module, a change in the low-level module forces a change in the high-level one. The high-level policy is **held hostage** by the details.

```java
// High-level use case directly depends on a concrete, low-level detail
public class ProcessOrderUseCase {
    private MySQLOrderRepository repo;  // concrete! volatile!
    private StripePaymentClient stripe; // concrete! volatile!
}
```

If you switch from MySQL to PostgreSQL, or from Stripe to PayPal, the use case **must change** — even though no business logic changed.

### DIP Says: Invert the Dependencies

The solution: define abstractions in the high-level layer. Let low-level details depend on those abstractions, not the other way around:

```java
// High-level use case depends on abstractions — stable
public class ProcessOrderUseCase {
    private OrderRepository repo;     // interface, stable
    private PaymentGateway payment;   // interface, stable
}

// Low-level details depend on the interface — volatile, but isolated
public class MySQLOrderRepository implements OrderRepository { ... }
public class StripePaymentGateway implements PaymentGateway { ... }
```

Now the source-code dependency arrow between the use case and MySQL **points the wrong direction** compared to the runtime call. At runtime, the use case calls MySQL — but at compile time, it only knows about the interface. MySQL depends on the interface, not vice versa.

### Stable Abstractions Rule

DIP's corollary: **depend on stable things**. Interfaces and abstract classes change far less often than concrete implementations. Depending on an interface insulates you from implementation changes.

Corollary: **never name a concrete class** in code you want to protect. Use interfaces. Use factories (below) to create concrete objects.

### Abstract Factories

If you must create a concrete object, use an **Abstract Factory** — an interface whose job is to create other objects:

```java
public interface ServiceFactory {
    PaymentGateway createPaymentGateway();
    NotificationService createNotificationService();
}

// Production implementation wires real objects
// Test implementation wires fakes — same interface
```

The factory interface lives in the inner layer. The concrete factory lives in the outer layer (infrastructure). The inner layer never touches a `new ConcreteClass()` call.

---

## 🔬 Senior Deep Dive

### DIP as the Enabler of the Dependency Rule

Clean Architecture's "dependency rule" (all dependencies point inward) **is** DIP applied at architectural scale. Every boundary in Clean Architecture is maintained by applying DIP: the inner layer defines interfaces; the outer layer provides implementations.

Without DIP, the dependency rule would be impossible to enforce. With it, you can draw a strict boundary between business logic and infrastructure, then place whatever implementation you want outside the boundary.

### The Three DIP Prescriptions

Martin identifies three practices:

1. **Don't refer to volatile concrete classes** — refer to abstract interfaces instead; use abstract factories to create instances
2. **Don't derive from volatile concrete classes** — inheritance is the strongest coupling; avoid it for volatile classes
3. **Don't override concrete functions** — concrete functions often carry source code dependencies; prefer abstract functions with multiple implementations

### DIP Violations in Spring — and How Spring Helps and Hurts

Spring's Dependency Injection is literally "dependency inversion" — you declare interfaces, Spring wires the concrete implementations. This is DIP done right:

```java
@Service
public class ProcessOrderUseCase {
    private final OrderRepository repo;        // interface
    private final PaymentGateway payment;      // interface

    public ProcessOrderUseCase(OrderRepository repo, PaymentGateway payment) {
        this.repo = repo;
        this.payment = payment;
    }
}
```

Spring resolves the concrete implementations at startup. The use case never knows which concrete classes it's using.

However, Spring also enables DIP violations — the annotations:

```java
// DIP violation: @Autowired, @Repository, @Transactional in the domain
@Entity                        // JPA in domain ← violation
@Table(name = "orders")        // JPA in domain ← violation
public class Order {
    @Id @GeneratedValue         // JPA in domain ← violation
    private Long id;

    @Transactional             // Spring in domain ← violation
    public void complete() { ... }
}
```

The domain entity now depends on JPA and Spring. Swap JPA for MongoDB, or test without a database — you can't. The domain is coupled to volatile infrastructure.

**DIP-compliant domain entity:**

```java
// Pure Java, no imports from Spring or JPA
public class Order {
    private final OrderId id;
    private OrderStatus status;
    private final List<DomainEvent> events = new ArrayList<>();

    public void complete() {
        if (status != OrderStatus.PLACED) throw new InvalidOrderStateException();
        status = OrderStatus.COMPLETED;
        events.add(new OrderCompletedEvent(id, Instant.now()));
    }

    public List<DomainEvent> pullEvents() {
        var copy = List.copyOf(events);
        events.clear();
        return copy;
    }
}
```

Testable with plain JUnit. No Spring context. No database. DIP satisfied.

### The Concrete Component Exception

Martin acknowledges that **somewhere**, concrete objects must be created. The `main` component — the entry point of the application — is the one place that knows about all concretions. It is the dirty place:

```java
// Main: the one concrete factory — lives in the outermost ring
@SpringBootApplication
public class MainApplication {
    // Spring auto-configuration creates and wires all concrete implementations
    // This is the only place that "knows" about JPA, Stripe, etc.
}
```

The `@SpringBootApplication` class is the application's "concrete component." Everything it wires together is pure abstraction from the business logic's point of view. This is the architecture's safety valve: all concretion is pushed to the furthest outer ring.

---

## Summary

| Concept | Key Point |
|---|---|
| DIP core rule | High-level policy depends on abstractions; details depend on abstractions |
| Stable abstractions | Interfaces change rarely; concrete classes change often; depend on the stable |
| Abstract Factory | Create objects through interfaces so inner layers never say `new ConcreteClass()` |
| Spring DI | Spring's container is DIP done right — but annotations in domain are DIP violations |
| Clean domain | Domain entities and use cases: zero Spring/JPA imports |
| Main component | One "dirty" entry point that wires concretions; everything else is abstraction |
