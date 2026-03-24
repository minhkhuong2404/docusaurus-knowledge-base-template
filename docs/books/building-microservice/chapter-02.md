---
sidebar_position: 3
title: "Chapter 2: How to Model Microservices"
---

# Chapter 2: How to Model Microservices

**Part I — Foundation**

> This chapter explores the foundational concepts needed to draw good service boundaries: information hiding, cohesion, coupling, and Domain-Driven Design.

---

## The Core Question: Where Do You Draw the Line?

The hardest problem in microservices is not technology — it's knowing where to split. Draw the lines wrong and you end up with a tightly coupled distributed monolith that's harder to manage than the original monolith.

Three key concepts guide every boundary decision:

1. **Information Hiding**
2. **Cohesion**
3. **Coupling**

---

## Information Hiding

From David Parnas, this principle says: **hide as much as possible behind the module boundary, and expose as little as possible**.

Benefits of good information hiding:
- **Parallel development** — teams can work on services independently
- **Comprehensibility** — each service can be understood in isolation
- **Flexibility** — internal implementation can change without affecting consumers

> "The connections between modules are the assumptions which the modules make about each other."

Reducing assumptions between services = reducing coupling. The less a service knows about the internals of another service, the more freely both can evolve.

---

## Cohesion

**"The code that changes together, stays together."**

A service has high cohesion when all its functionality is closely related. If you find yourself constantly making changes across multiple services to deliver a single feature, your cohesion is weak — the functionality is spread across the wrong boundaries.

**Goal:** Group related business behavior together so that a feature change touches as few services as possible.

- ✅ High cohesion: Orders service handles all order-related business rules
- ❌ Low cohesion: Order status logic spread across Orders, Notifications, and Payments services

---

## Coupling

Loose coupling means: **a change to one service should not require a change to another**.

Common sources of tight coupling:
- Sharing a database between services
- One service knowing too much about another's internals
- Chatty synchronous call chains (A calls B, B calls C, C calls D — all synchronously)

### Types of Coupling (from least to most dangerous)

| Type | Description | Risk |
|------|-------------|------|
| **Domain coupling** | Service A calls Service B to fulfill a business action | Low — unavoidable in practice |
| **Temporal coupling** | A must be available for B to work (synchronous calls) | Medium — causes cascading failures |
| **Pass-through coupling** | A passes data through B to C (B doesn't need it) | High — changes propagate unnecessarily |
| **Common coupling** | Multiple services share the same global data (shared DB) | Very High — changes cascade everywhere |
| **Content coupling** | A reaches into B's internal data directly | Extreme — breaks all encapsulation |

:::danger
**Shared databases are the most common source of unintended coupling.** If two services share a database table, they cannot be deployed independently. Every schema migration becomes a coordinated multi-team effort.
:::

---

## The Interplay of Coupling and Cohesion

Constantine's Law:
> "A structure is stable if cohesion is strong and coupling is low."

These two properties work in tandem. Spreading related behavior across services (low cohesion) forces more cross-service calls (high coupling). Getting cohesion right is what naturally reduces coupling.

---

## Domain-Driven Design (DDD)

Eric Evans's Domain-Driven Design gives us the most useful vocabulary for finding service boundaries.

### Ubiquitous Language
Within a bounded context, everyone (devs and business stakeholders) uses the same terminology. A "Customer" in the Billing context might mean something different from "Customer" in the Support context — and that's okay.

### Bounded Contexts

A **Bounded Context** is a clear boundary within which a particular domain model applies. This maps almost directly to a microservice boundary.

```
┌─────────────────────┐    ┌─────────────────────┐
│  Orders Context      │    │  Catalog Context     │
│                      │    │                      │
│  Order               │    │  Product             │
│  OrderLine           │    │  Category            │
│  ShippingAddress     │    │  Inventory           │
└──────────┬──────────┘    └────────────┬─────────┘
           │  Product ID (thin ref)      │
           └────────────────────────────┘
```

Each context owns its model. They share only thin references (IDs), not full object graphs.

### Aggregates
Within a bounded context, an **Aggregate** is a cluster of domain objects treated as one unit for data changes. Aggregates have a single root entity and enforce consistency rules.

In Java/Spring terms: an Aggregate Root is typically a JPA Entity that owns a cluster of child entities. You should never access child entities directly — always go through the root.

```java
// Good: Order is the Aggregate Root
Order order = orderRepository.findById(orderId);
order.addItem(productId, quantity);  // mutate via root

// Bad: accessing OrderLine directly
OrderLine line = orderLineRepository.findById(lineId);  // breaks aggregate boundary
```

### Aggregate → Service Mapping
Bounded Contexts map to services. Aggregates within a bounded context can sometimes become services themselves, but start at the Bounded Context level.

---

## Finding Boundaries in Practice

### Volatility-Based Splitting
Group things that change at the same rate. If pricing logic changes weekly but catalog metadata changes monthly, consider separating them.

### Team Ownership
Service boundaries often reflect team boundaries. If the Payments team and the Orders team should work independently, their services must be independent.

### Data Ownership
"Who owns this piece of data?" is a powerful question. The service that owns the data defines its schema and controls mutations. Other services read through the API.

---

## Alternative Decomposition Approaches

Beyond DDD, two technical decomposition patterns are worth knowing:

### Decompose by Business Capability
Map each service to a distinct business capability (what the business *does*): order management, inventory, billing, shipping.

### Decompose by Subdomain
More fine-grained than capability. A billing capability might decompose into invoicing, payment processing, and tax calculation subdomains.

---

## Common Pitfalls

| Pitfall | Description |
|---------|-------------|
| **Entity service** | One service per database table — this is not DDD, it's an anemic API layer |
| **Chatty services** | Services that make dozens of calls to each other per request |
| **Premature splitting** | Splitting before you understand the domain leads to wrong boundaries |
| **Shared kernel without discipline** | Sharing code between services can create hidden coupling |

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| Information Hiding | Expose only stable contracts; keep internals private |
| Cohesion | Related behavior belongs together |
| Coupling | Services should know as little as possible about each other |
| Bounded Context | The DDD unit that maps most naturally to a microservice |
| Aggregate | Group of domain objects with one root, enforced consistency |
