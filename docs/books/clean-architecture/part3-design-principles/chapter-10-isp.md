---
id: chapter-10-isp
title: "Chapter 10: ISP — The Interface Segregation Principle"
sidebar_position: 4
description: >
  No client should be forced to depend on methods it does not use. ISP keeps interfaces focused, prevents unnecessary recompilation, and — at the architectural level — prevents importing modules that drag in unwanted dependencies.
tags:
  - solid
  - isp
  - interface-segregation
  - design-principles
  - fat-interfaces
  - dependencies
---

# Chapter 10: ISP — The Interface Segregation Principle

> _"No client should be forced to depend on methods it does not use."_

## 🎓 For New Learners

### The Fat Interface Problem

Imagine an interface used by three different kinds of clients:

```java
public interface Operations {
    void op1();   // used only by User1
    void op2();   // used only by User2
    void op3();   // used only by User3
}
```

All three users depend on `Operations`. When `op1()` changes (for `User1`), `User2` and `User3` must be **recompiled and redeployed** even though nothing they use changed. They are coupled to code they never call.

### The Fix: Segregate the Interface

Create a focused interface per client:

```java
public interface U1Ops { void op1(); }
public interface U2Ops { void op2(); }
public interface U3Ops { void op3(); }

// One class implements all — but each user depends only on what it needs
public class OpsImpl implements U1Ops, U2Ops, U3Ops { ... }
```

Now `User1` depends only on `U1Ops`. Changes to `op2()` or `op3()` never touch `User1`'s compilation unit.

### The Real Danger: Unnecessary Dependencies

ISP's deeper point isn't about recompilation pain — it's about **what gets dragged in with a dependency**.

When a module depends on a class/interface with more methods than it uses, it pulls in:
- All the **imports** of that class
- All the **transitive dependencies** of those imports
- Potentially entire frameworks or subsystems it should never know about

A stateless business rule module that depends on a fat interface might inadvertently pull in JPA, Jackson, Spring MVC, and half the application — just because those are needed by other methods in the same class.

---

## 🔬 Senior Deep Dive

### ISP at the Architectural Level

Martin's architectural generalization: **avoid depending on modules that contain more than you need**.

This applies to:

| Level | ISP Violation | Fix |
|---|---|---|
| Class | Fat interface with unused methods | Segregated role interfaces |
| Component | Depending on a JAR for one utility class that drags in many transitive deps | Extract the utility to its own minimal library |
| Service | A client service using only 1 of 15 endpoints, still coupling to the whole service's domain model | Separate the DTO contract; only publish what clients need |
| Framework | Importing Spring Data JPA in a domain module to use one annotation | Keep Spring out of the domain entirely |

### Role Interfaces in Spring

Spring repositories are often fat:

```java
// Fat: forces all clients to depend on the full Spring Data interface
public interface OrderRepository extends JpaRepository<Order, Long> {
    // JpaRepository has 20+ methods, most unused by most callers
}
```

ISP-compliant alternative: define narrow role interfaces in the domain layer, implement with Spring Data in the infrastructure layer:

```java
// Domain layer — only what the use case needs
public interface OrderFinder {
    Optional<Order> findById(OrderId id);
    List<Order> findByCustomer(CustomerId customerId);
}

public interface OrderPersistence {
    void save(Order order);
    void delete(OrderId id);
}

// Infrastructure layer — Spring Data implements both
@Repository
public class JpaOrderRepository implements OrderFinder, OrderPersistence {
    // Spring Data magic here; domain layer never imports JPA
}
```

The domain's `PlaceOrderUseCase` depends only on `OrderPersistence`. The `ListOrdersUseCase` depends only on `OrderFinder`. Each use case sees exactly what it needs — and the JPA dependency lives exclusively in the infrastructure layer.

### ISP and Dependency Management in Maven/Gradle

ISP violations at the build level manifest as Maven/Gradle dependency bloat:

```xml
<!-- Violation: entire spring-boot-starter-data-jpa in domain module -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

The domain module has no business importing Hibernate. ISP says: depend only on what you use. In a multi-module Maven project:

```
my-app-domain/         ← pom.xml has ZERO Spring/JPA dependencies
my-app-application/    ← depends on domain only
my-app-infrastructure/ ← depends on domain + Spring Data JPA + Hibernate
my-app-web/            ← depends on application + Spring MVC
```

### ISP and Microservice Contracts

ISP at the service level: when publishing a REST or event-based API, clients should receive only the data they need. Publishing a bloated `OrderEvent` with 40 fields when the downstream subscriber only uses 3 is an ISP violation. It:

- Couples consumers to irrelevant fields
- Breaks consumers when irrelevant fields change
- Bloats network payloads unnecessarily

Solution: **consumer-driven contracts** (Pact) or **event versioning** strategies that keep each consumer's view minimal.

---

## Summary

| Concept | Key Point |
|---|---|
| Fat interface | Forces recompilation of clients that use none of the changed methods |
| Segregation fix | One focused interface per client role |
| Deeper danger | Unused dependencies drag in transitive imports and frameworks |
| Module level | Keep domain modules free of infrastructure dependencies (JPA, Spring) |
| Service level | Publish only what consumers need; consumer-driven contracts |
