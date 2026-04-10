---
id: chapter-16-independence
title: "Chapter 16: Independence"
sidebar_position: 2
description: >
  A good architecture supports independent developability, deployability, and operability. Martin explains the use-case, operational, and deployment decoupling modes and why the monolith-vs-microservices decision can and should be deferred.
tags:
  - architecture
  - independence
  - decoupling
  - microservices
  - monolith
  - use-cases
---

# Chapter 16: Independence

> _"A good architecture must support... the independent developability of the system's components."_

## 🎓 For New Learners

### Three Kinds of Independence

A well-structured system enables three types of independence:

1. **Use-case independence** — adding a new use case doesn't require modifying existing ones
2. **Development independence** — different teams can work on different use cases simultaneously without stepping on each other
3. **Deployment independence** — components can be deployed independently, without deploying the entire system

### Use-Case Decoupling

Each use case should be a separate, isolatable slice through the system. A use case should touch only the layers it needs to:

```
Use Case: Place Order
  → Controller (web adapter)
  → PlaceOrderUseCase (application layer)
  → Order (domain entity)
  → OrderRepository (persistence)

Use Case: Cancel Order
  → Different controller
  → CancelOrderUseCase (separate class)
  → Same Order entity
  → Same OrderRepository
```

These two use cases share the domain entity and repository interface but are otherwise independent. A bug in `CancelOrderUseCase` cannot affect `PlaceOrderUseCase`.

### Operational Decoupling (Scaling)

Some use cases need to run at different scales:

- Processing orders: high volume, must scale
- Generating PDF invoices: low volume, can be slow
- Administrative reports: rare, resource-intensive

If these are decoupled, you can scale order processing independently of invoice generation. If they're coupled in one monolithic process, you must scale everything together.

### The Decoupling Mode Dilemma

Martin presents a key insight: the right decoupling mode depends on factors you often don't know at design time:

| Mode | Deployment Unit | Communication |
|---|---|---|
| Source level | Single process | In-memory calls |
| Deployment level | Separate JARs, same process | In-memory calls |
| Service level | Separate processes | Network calls |

Starting with source-level decoupling (clean boundaries in a monolith) lets you migrate to service-level decoupling later — without rewriting business logic.

---

## 🔬 Senior Deep Dive

### The Fallacy of "Start with Microservices"

The popular advice "build microservices from day one" violates the principle of deferring decisions. Martin argues:

- Microservice boundaries require understanding the domain's natural seams
- Natural seams only become apparent after working with the domain for months
- Premature service boundaries are hard to change — network calls don't refactor as easily as method calls
- A well-structured monolith can be extracted into microservices later; a poorly structured microservice system cannot be consolidated without a rewrite

**The Modular Monolith** is an underrated intermediate:
- Single deployable unit (operational simplicity)
- Strict module boundaries enforced by Maven modules
- Use cases independent at the code level
- Can be split into services exactly where the seams are proven

### Decoupling in Spring: The Progression

**Stage 1: Source-level decoupling (monolith)**
```java
// All in one Spring Boot application
// Boundaries enforced by package/module structure
// Communication: direct method calls
orderService.place(command);
```

**Stage 2: Deployment-level decoupling (modular monolith)**
```
// Separate Maven modules, single deployable JAR
// domain-jar, application-jar, web-jar → assembled into app.jar
// Communication: still method calls
```

**Stage 3: Service-level decoupling (microservices)**
```java
// Separate Spring Boot applications
// Communication: REST or messaging
orderServiceClient.place(command);  // HTTP call to order-service
// OR
eventPublisher.publish(new PlaceOrderCommand(command));  // async message
```

The business logic in each stage is **identical**. Only the communication mechanism and deployment unit change.

### Duplication: Real vs. Accidental

Martin warns against conflating two types of duplication:

**Accidental duplication**: two pieces of code that look similar but change for different reasons. They should NOT be combined — they will diverge.

**Real duplication**: two pieces of code that are truly the same concept. They SHOULD be extracted and shared.

Prematurely deduplicating accidental duplication is a common coupling mistake. Two use cases that have similar request/response structures might look like they share a DTO — but if they evolve independently, coupling them via a shared DTO causes unnecessary friction later.

---

## Summary

| Concept | Key Point |
|---|---|
| Three independence types | Use-case, development, deployment |
| Decoupling modes | Source → deployment → service level |
| Monolith first | Defer service extraction until seams are understood |
| Modular monolith | Clean module boundaries + single deployment = best of both worlds |
| Accidental vs. real duplication | Don't deduplicate things that merely look similar but evolve separately |
