---
id: service-decomposition
title: Service Decomposition
sidebar_label: Service Decomposition
description: Strategic guide to microservice decomposition, applying Domain-Driven Design (DDD), high cohesion, loose coupling, and avoiding the distributed monolith.
tags: [system-design, microservices, architecture, Domain-Driven-Design, ddd]
---

# Service Decomposition

**Service Decomposition** is the process of breaking a large software domain (often a monolith) down into a set of distinct, cohesive, and loosely coupled microservices. Defining the boundaries incorrectly is the most common reason microservice migrations fail, resulting in a **distributed monolith** (a system with all the operational complexity of microservices but none of the independent deployment benefits).

---

## Bounded Contexts: Domain-Driven Design (DDD)

The primary tool for establishing service boundaries is Domain-Driven Design (DDD). Instead of designing services based on database tables or technical layers, engineers map the domain into **Bounded Contexts**:

```text
                               ┌────────────────────────────────────────────────────────┐
                               │                 E-Commerce Domain                      │
                               │                                                        │
                               │  ┌───────────────────────┐   ┌──────────────────────┐  │
                               │  │   Ordering Context    │   │  Shipping Context    │  │
                               │  │                       │   │                      │  │
                               │  │  Entity: Order        │   │  Entity: Shipment    │  │
                               │  │  Value: OrderLine     │   │  Value: Address      │  │
                               │  └───────────┬───────────┘   └───────────▲──────────┘  │
                               └──────────────┼───────────────────────────┼─────────────┘
                                              │ (Asynchronous Event)      │
                                              └───────► "OrderPaid" ──────┘
```

A Bounded Context defines a boundary within which a specific domain model applies. Inside the Ordering Context, an "Order" represents items, pricing, and buyer identity. Inside the Shipping Context, the "Order" domain object doesn't exist; it is represented instead by a "Shipment" focusing on package dimensions, tracking numbers, and delivery addresses.

---

## Decomposition Criteria

To decide where to split boundaries, evaluate the domain against five criteria:

| Criterion | Metric / Test | Solution |
| :--- | :--- | :--- |
| **Business Capability** | Group by "what the business does" (e.g., Payments, Billing). | Maps cleanly to functional business departments. |
| **High Cohesion** | "Things that change together, stay together." | Put code that undergoes regular lockstep updates in the same service. |
| **Loose Coupling** | Can a service change its internal database or logic without breaking callers? | Expose interfaces behind strict contracts and APIs. |
| **Scaling & Security** | Do different modules have vastly different performance or compliance needs? | Isolate high-compute or high-security data (e.g., Credit Card vaults). |
| **Conway's Law** | "Organizations design systems that mirror their communication structure." | Match service ownership boundaries to small, independent "Two-Pizza" teams. |

---

## The Distributed Monolith: Warning Signs

If you decompose incorrectly, you build a distributed monolith.

```text
Distributed Monolith (Anti-pattern):
Service A ─────(Sync HTTP)─────► Service B ─────(Sync HTTP)─────► Service C ─────► DB
```

### Warning Signs:
1. **Synchronous Chain Calls**: If Service A calls B, which calls C, which calls D, and a failure in D breaks the whole request chain, your services are temporally coupled.
2. **Shared Database**: Two services reading and writing to the same SQL tables. A database schema change in Service A requires coordinating code deployments for Service B.
3. **Lockstep Deployments**: You cannot deploy Service A without releasing updates to Service B and C at the exact same time.
4. **API Chatty Loops**: Service A must make 15 quick REST calls to Service B to render a single simple landing screen.

---

## Refactoring Playbook: Splitting a Monolith

When extracting a service from a monolith:

1. **Step 1: Code Decoupling**: Refactor the monolithic code internally. Turn spaghetti dependencies into clean Java/Go package boundaries. Use interfaces to communicate between packages rather than direct class instantiations.
2. **Step 2: Database Separation**: Split the database tables logically. Even though they live in the same physical DB, prevent package A from joining tables owned by package B. Ensure all cross-context queries occur via code interfaces.
3. **Step 3: Physical Split**: Move the decoupled package code and database tables into a separate physical microservice repository and run it on isolated containers.

---

## Common Gotchas & Anti-Patterns

1. **Premature Decomposition**: Splitting services in an early-stage startup before the business domain is understood. If the business changes direction, you will spend months rewriting network routes and APIs. Start with a modular monolith.
2. **Technical Layer Decomposition**: Splitting services by technology layer (e.g., having a "Database Service", a "UI Service", and a "Logic Service"). This creates high coupling; every feature change requires modifying all three layers. Split vertically by business context instead.
3. **Entity Services**: Creating a microservice for every database table (e.g., `CustomerService`, `OrderLineService`). This results in chatty REST loops and an overly complex distributed architecture.
