---
id: chapter-30-32-details
title: "Chapters 30–32: The Database, Web & Frameworks Are Details"
sidebar_position: 1
description: >
  Databases, web frameworks, and all third-party frameworks are details — implementation choices that should be deferred and hidden behind boundaries. Learn why treating them as the center of your architecture leads to rigidity and how to protect your business rules from them.
tags:
  - details
  - database
  - web
  - frameworks
  - spring
  - jpa
  - architecture
---

# Chapters 30–32: The Database, Web & Frameworks Are Details

> _"The database is a detail. The web is a detail. The framework is a detail."_

## 🎓 For New Learners

### The Central Claim

These three chapters share one thesis: **none of the things developers spend the most time configuring are architecturally central**.

Databases, web frameworks, Spring — they are **implementation choices** hidden behind boundaries so the business rules at the center never need to know about them.

### Chapter 30: The Database Is a Detail

The data model belongs to the domain. The database is a **performance optimization** for storage. Treating it as the system's center means:

- Business rules are shaped by table schemas
- Changing databases requires rewriting business logic
- Testing requires a running database, making tests slow

**The fix — hide storage behind an interface:**

```java
// Domain contract — the business rule's view of persistence
public interface OrderRepository {
    Optional<Order> findById(OrderId id);
    void save(Order order);
}

// Infrastructure detail — JPA implementation
@Repository
public class JpaOrderRepository implements OrderRepository {
    public Optional<Order> findById(OrderId id) {
        return springRepo.findById(id.value()).map(OrderJpaMapper::toDomain);
    }
}

// Infrastructure detail — MongoDB implementation (swap without touching use cases)
@Repository
public class MongoOrderRepository implements OrderRepository { ... }
```

The use case works with either. The database decision is deferred and swappable.

**The thought experiment**: if there were no disk, you'd build in memory. Everything would work. Persistence would be added as a plugin at the end — not woven throughout. That's the correct relationship: business logic is the system; the database is a plugin.

### Chapter 31: The Web Is a Detail

HTTP is an I/O device — a mechanism to move data in and out. Business rules should know nothing about HTTP, REST conventions, JSON, or URL structure.

```java
// Use case: has NO idea it's being called over HTTP
public class PlaceOrderUseCase {
    public PlaceOrderResult execute(PlaceOrderCommand cmd) { ... }
    // Could be called from REST, gRPC, CLI, tests, message consumers — identical
}

// HTTP detail isolated to the controller adapter
@RestController
public class PlaceOrderController {
    @PostMapping("/orders")
    public ResponseEntity<PlaceOrderResponse> handle(@RequestBody PlaceOrderRequest req) {
        var result = placeOrderUseCase.execute(PlaceOrderCommandMapper.from(req));
        return ResponseEntity.ok(PlaceOrderResponse.from(result));
    }
}
```

Adding a gRPC endpoint means adding a new adapter — not touching the use case.

### Chapter 32: Frameworks Are Details

When you adopt a framework, the framework authors ask you to **commit to them** — inherit their classes, annotate with their annotations, structure code around their conventions.

**The Rule**: frameworks belong in Ring 3 (adapters) and Ring 4 (infrastructure). They must never appear in Ring 1 (entities) or Ring 2 (use cases).

```
✅ Spring annotations: RestController, Repository, Configuration — in adapters/infrastructure
❌ Spring annotations: @Transactional, @Entity, @Autowired — in domain entities/use cases
```

---

## 🔬 Senior Deep Dive

### The Spring Coupling Tax

Spring is excellent, but its annotations carry a coupling tax:

```java
// All of this is Spring — the one line of business logic is buried
@RestController @RequestMapping("/orders") @Validated
public class OrderController {
    @Autowired private OrderService svc;

    @PostMapping @Transactional
    public @ResponseBody ResponseEntity<?> placeOrder(
            @RequestBody @Valid OrderRequest req) {
        // one line of actual business logic
        return ResponseEntity.ok(svc.place(req));
    }
}
```

Nothing wrong here — it's a controller adapter, Spring belongs here. The problem is when this pattern bleeds into domain entities and use cases.

**What a clean domain entity looks like:**

```java
// Zero Spring imports — pure Java business rule
public class Order {
    private final OrderId id;
    private final List<LineItem> items;
    private OrderStatus status;

    public void place() {
        if (items.isEmpty()) throw new EmptyOrderException();
        this.status = OrderStatus.PLACED;
    }

    public Money calculateTotal() {
        return items.stream()
            .map(LineItem::subtotal)
            .reduce(Money.ZERO, Money::add);
    }
}
```

### Framework Replacement Realism

| Replacement | Cost (clean architecture) | Cost (framework-coupled) |
|---|---|---|
| MySQL → PostgreSQL | 1 day (infrastructure only) | Weeks (business logic changes) |
| Spring MVC → WebFlux | Days (controller adapters only) | Months (everything mixed together) |
| RabbitMQ → Kafka | Days (adapter reimplementation) | Weeks (event handling scattered) |
| Full framework swap | Weeks | Years / rewrite |

The architectural payoff is not that you *will* replace frameworks — it's that you **could**, at reasonable cost.

### Testing as the Architectural Litmus Test

The fastest signal that a framework has leaked into the wrong layer:

```java
// Red flag: testing business logic requires Spring context
@SpringBootTest  // ← this should never be needed for pure domain tests
class OrderTest {
    @Autowired Order order;  // ← domain objects should never need injection
    
    @Test void orderCanBePlaced() { ... }
}

// Green flag: domain tests need nothing
class OrderTest {
    @Test void orderCanBePlaced() {
        var order = Order.create(customerId, items);  // just Java
        order.place();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
    }
}
```

If your domain tests require `@SpringBootTest`, your domain has been contaminated by a detail. The boundary is missing.

---

## Summary

| Detail | The Mistake | The Fix |
|---|---|---|
| Database | Treating table schema as the domain model | Repository interface in domain; ORM mapping in infrastructure |
| Web/HTTP | Use cases that parse HTTP requests | Thin controller adapters; use cases receive plain command objects |
| Frameworks | Spring annotations in domain entities | Framework annotations only in adapter/infrastructure rings |
| The test signal | Tests that need the framework to test business logic | Business logic testable with plain JUnit — no Spring context needed |
