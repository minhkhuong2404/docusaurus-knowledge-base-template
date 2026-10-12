---
id: service-decomposition
title: Service Decomposition — DDD Bounded Contexts, Strangler Fig & Database Extraction
sidebar_label: Service Decomposition
description: Principal engineering guide to microservice decomposition, Domain-Driven Design (DDD) Bounded Contexts, Strangler Fig migration, database decoupling, and distributed transaction strategies.
tags: [system-design, microservices, architecture, Domain-Driven-Design, ddd, strangler-fig, saga]
---

import BoundedContextsDiagram from '@site/src/components/BoundedContextsDiagram';
import DistributedMonolithWarningSignsDiagram from '@site/src/components/DistributedMonolithWarningSignsDiagram';

# Service Decomposition — DDD, Strangler Fig & Data Decoupling

**Service Decomposition** is the architectural practice of dissecting a large software monolith into distinct, cohesive, and independently deployable microservices. 

Decomposing along arbitrary technical boundaries (e.g. by database tables or technical tiers) is the leading cause of microservice failure, culminating in a **Distributed Monolith**—an architecture that inherits all the latency, network unreliability, and operational complexity of distributed systems while forfeiting independent deployments.

To succeed at scale, principal engineers apply **Domain-Driven Design (DDD) Context Mapping**, the **Strangler Fig Pattern**, and **progressive database decoupling strategies**.

---

## 1. Bounded Contexts & Domain-Driven Design (DDD)

The primary tool for establishing resilient service boundaries is Domain-Driven Design. Rather than carving services along database schemas, services must map to business **Bounded Contexts**:

<BoundedContextsDiagram />

### 1.1 The Ubiquitous Language & Polysemic Entities
A single business concept often holds conflicting definitions across different business departments. Attempting to create a universal, unified "User" or "Order" class across the entire enterprise creates an unmaintainable god-class.

In DDD, entities are **polysemic** (having different meanings in different contexts):

| Business Entity | Ordering Context | Fulfillment / Shipping Context | Billing / Invoice Context |
|---|---|---|---|
| **"Order"** | Shopping cart items, applied coupons, customer checkout ID | Weight, volume, shipping pallet dimensions, tracking number | Tax jurisdiction, currency exchange, payment gateway token |
| **"User"** | PII name, delivery address, communication preferences | Recipient address, gate code, dispatch notes | Tax ID, credit card token, legal invoicing entity |

Each Bounded Context maintains its own distinct domain model, class definitions, and database storage.

### 1.2 Context Mapping Patterns
When microservices communicate across boundaries, the relationship between contexts must be explicitly classified:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DDD CONTEXT MAPPING ARCHITECTURES                               │
│                                                                                        │
│   UPSTREAM (Core Domain)                           DOWNSTREAM (Supporting Domain)      │
│   ┌──────────────────────────┐                     ┌──────────────────────────┐        │
│   │ Monolithic Core System   │                     │ Modern Cloud Microservice│        │
│   │ Complex, Legacy Model    │                     │ Clean Domain Model       │        │
│   └────────────┬─────────────┘                     └────────────▲─────────────┘        │
│                │                                                │                      │
│                │ Proprietary Wire Format                        │ Clean DTOs           │
│                ▼                                                │                      │
│   ┌─────────────────────────────────────────────────────────────┴─────────────┐        │
│   │                 ANTICORRUPTION LAYER (ACL)                                │        │
│   │  Translates legacy monolith tables/APIs into clean downstream domain DTOs.│        │
│   │  Prevents legacy monolithic baggage from leaking into the new service.    │        │
│   └───────────────────────────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Anticorruption Layer (ACL)**: A translation adapter placed between the downstream new service and upstream legacy system to translate data models, preventing the new service's domain model from being polluted.
2. **Open Host Service (OHS) / Published Language (PL)**: The upstream service exposes a standardized, versioned public protocol (e.g. gRPC with Protocol Buffers or OpenAPI JSON) rather than allowing callers to read internal database formats.
3. **Customer / Supplier**: Upstream (Supplier) delivers features required by Downstream (Customer), with planning negotiated in lockstep.

---

## 2. Refactoring Playbook: The Strangler Fig Pattern

Never attempt a "Big Bang" rewrite. A complete rewrite of an enterprise monolith almost always runs over budget, fails to achieve feature parity, and risks catastrophic production regressions.

The standard industry approach is the **Strangler Fig Pattern** (incrementally replacing monolithic capabilities until the monolith has withered away):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        STRANGLER FIG MIGRATION PIPELINE                                │
│                                                                                        │
│   CLIENT TRAFFIC                                                                       │
│         │                                                                              │
│         ▼                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────────┐        │
│   │ EDGE API GATEWAY / REVERSE PROXY (Envoy / Kong / AWS ALB)                 │        │
│   │ Routes by Path, Feature Flag, or Percentage Weight                        │        │
│   └──────────────────────┬─────────────────────────────┬──────────────────────┘        │
│                          │                             │                               │
│         Legacy Routes    │                             │ Migrated Routes               │
│         (e.g. /cart)     │                             │ (e.g. /payments)              │
│                          ▼                             ▼                               │
│               ┌───────────────────────┐   CDC / Event  ┌───────────────────────┐       │
│               │   LEGACY MONOLITH     │ ─────────────> │ EXTRACTED MICROSERVICE│       │
│               │   Monolithic Database │   (Debezium)   │ Isolated Microservice │       │
│               │   (Legacy Relational) │                │ Database (Postgres)   │       │
│               └───────────────────────┘                └───────────────────────┘       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The 4 Migration Phases
1. **Phase 1: Intercept & Shadow Traffic (Dark Launching)**:
   - Deploy an API gateway in front of the monolith.
   - Extract the target domain logic into the new microservice.
   - Route production traffic to the monolith, but asynchronously mirror (`shadow`) the request payload to the new microservice. Compare execution outputs, latency, and edge cases with zero client impact.
2. **Phase 2: Dual-Writing with Change Data Capture (CDC)**:
   - Synchronize database state between the legacy database and the new service's database using tools like Debezium reading Postgres/MySQL Write-Ahead Logs (WAL).
3. **Phase 3: Write Cut-Over**:
   - Flip the API Gateway routing to direct 100% of live write traffic to the new microservice.
   - Reverse the CDC stream: stream new microservice writes back to the legacy database to keep legacy reporting systems and batch jobs functioning.
4. **Phase 4: Monolithic Deletion**:
   - Sever the reverse CDC stream.
   - Delete the legacy code paths from the monolith repository.

---

## 3. Database Extraction: Managing Distributed Data Fallout

Extracting application code into microservices is straightforward; extracting the database is where systems break down.

### 3.1 The Foreign Key Trap
In a monolith, referential integrity is enforced at the database engine level via Foreign Keys (`FOREIGN KEY (customer_id) REFERENCES customers(id)`). When `CustomerService` and `OrderService` are split into separate physical databases, **foreign keys across databases are impossible**.

#### Architectural Solutions:
1. **Application-Level Referential Validation**:
   - `OrderService` validates `customerId` via an internal gRPC call or an in-memory Redis cache populated from `CustomerService` change events.
2. **Eventual Consistency with Tombstone Records**:
   - If a customer is deleted in `CustomerService`, it publishes a `CustomerDeletedEvent` over Kafka.
   - `OrderService` consumes the event and marks orders as belonging to an archived/anonymized customer rather than failing with cascading delete constraints.

### 3.2 Cross-Service Queries: API Composition vs. CQRS
How do you display a screen showing "Orders with Customer Name and Delivery Tracking Status"?

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CROSS-SERVICE QUERY ARCHITECTURES                               │
│                                                                                        │
│  APPROACH A: API COMPOSITION (Frontend / BFF Level)                                    │
│  Client / BFF calls OrderService -> CustomerService -> ShippingService sequentially.   │
│  • Pros: Simple to implement.                                                          │
│  • Cons: High network fan-out; latency is the sum of all downstream calls;             │
│          vulnerable to cascading failures if ShippingService goes down.                │
│                                                                                        │
│  APPROACH B: CQRS (Command Query Responsibility Segregation)                           │
│  OrderService, CustomerService, and ShippingService emit Kafka domain events.          │
│  A dedicated "OrderViewProjectionService" consumes these events and updates a denorm-  │
│  alized read-optimized document store (e.g. Elasticsearch / MongoDB).                   │
│  • Pros: Sub-10ms single-query read; resilient to downstream outages.                  │
│  • Cons: Eventual consistency lag; complex projection rebuilding pipelines.            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. The Distributed Monolith: Warning Signs & Diagnostic Matrix

If services are decomposed along the wrong fault lines, the organization ends up with a distributed monolith.

<DistributedMonolithWarningSignsDiagram />

| Anti-Pattern Indicator | Technical Root Cause | Architectural Remediation |
|---|---|---|
| **Lockstep Deployments** | Service A cannot deploy without releasing Service B at the same minute. | Breaking API contracts; establish semantic versioning and consumer-driven contract tests (Pact). |
| **Shared Database Tables** | Multiple microservices connect to the same relational DB tables. | Violates data ownership; enforce strictly isolated database instances per service. |
| **Deep Synchronous Call Chains** | Service A calls B, which calls C, which calls D, resulting in 500ms latency. | Temporal coupling; transition to asynchronous event-driven choreographies via Kafka/RabbitMQ. |
| **Excessive Distributed Transactions** | Frequent cross-service rollbacks requiring complex 2PC logic. | Boundaries are too granular; merge the tightly coupled services back into a single bounded context. |

---

## 5. Organizational Alignment: Conway's Law & Team Topologies

System architecture inevitably mirrors an organization's communication structures (**Conway's Law**). Attempting to deploy 30 fine-grained microservices with a team of 4 engineers creates unmanageable cognitive load and operational burnout.

### Team Topologies Framework
When decomposing services, organize engineering around 4 fundamental team types:
1. **Stream-Aligned Teams**: Dedicated to a continuous flow of work in a single business domain (e.g. Checkout, Onboarding). They own their microservices from cradle to grave ("You build it, you run it").
2. **Platform Teams**: Provide underlying internal infrastructure (e.g. Kubernetes, observability, CI/CD pipelines, service meshes) so stream-aligned teams do not reinvent plumbing.
3. **Enabling Teams**: Cross-functional specialists (e.g. security architects, performance engineers) who upskill stream-aligned teams on new practices.
4. **Complicated-Subsystem Teams**: Formed only when rare domain expertise is required (e.g. algorithmic video transcoding, mathematical options pricing engines).

---

## Related Documentation

- [Split-Brain & Multi-Leader Divergence in Distributed Databases](./split-brain-multi-leader-divergence.md)
- [Caching Strategies & Production Gotchas](./caching-strategies.md)
- [Envoy Proxy Architecture & Dynamic xDS Routing](./envoy-proxy.md)
- [Consumer-Driven Contract Testing in Microservices](./contract-testing.md)
- [On-Us vs. Off-Us Clearing Mechanics](../banking/onus.md)
