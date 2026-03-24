---
sidebar_position: 4
title: "Chapter 3: Splitting the Monolith"
---

# Chapter 3: Splitting the Monolith

**Part I — Foundation**

> Most teams don't start from scratch. This chapter gives practical, pattern-driven guidance on how to decompose an existing monolith into microservices — incrementally and safely.

---

## Start With a Goal

**Microservices are not the goal. The goal is what microservices enable.**

Before splitting anything, ask: *What problem am I trying to solve?*
- Need to scale a specific component under load?
- Want independent team deployments?
- Need to replace a dying technology?

Without a clear goal, you'll create microservices that don't deliver value. You'll confuse *activity* (creating services) with *outcome* (faster delivery, better scaling).

:::tip
Try the simple things first. Vertical slicing, better modular structure, or simply adding capacity to the monolith may be faster and cheaper than a full decomposition.
:::

---

## The Case for Incremental Migration

> "If you do a big-bang rewrite, the only thing you're guaranteed of is a big bang." — Martin Fowler

Incremental migration (chip away, one service at a time) is almost always better than a full rewrite because:

1. You learn as you go — early mistakes stay small
2. You can stop at any time if the value isn't materializing
3. You can deploy and get production feedback from each new service
4. Teams build operational confidence gradually

**Think of the monolith as a block of marble.** You don't detonate it — you chip away carefully.

---

## The Monolith Is Not the Enemy

This is a key message in this edition. Many successful systems remain monolithic throughout their entire lives. A well-structured modular monolith can outperform a poorly designed microservice architecture.

The monolith commonly *remains* even after microservice extraction — it just shrinks. For example, if 10% of the system is the scaling bottleneck, extracting that 10% as a microservice may solve the problem completely. The remaining 90% can stay in the monolith indefinitely.

:::caution
Don't set out to "destroy the monolith." Set out to achieve a specific goal. Stop when the goal is met.
:::

---

## Dangers of Premature Decomposition

The Snap CI case study from Thoughtworks illustrates this perfectly:

- Team had prior domain knowledge from GoCD and moved quickly to microservices
- After a few months, use cases proved different enough that boundaries were wrong
- The team merged services back into a monolith, worked to understand the domain better
- A year later, split again — this time with stable, correct boundaries

**Lesson:** Deep domain understanding is a prerequisite to stable service boundaries. If you're building something new, a monolith-first approach lets you learn the domain before committing to split points.

---

## What to Split First?

Balance two forces:
1. **Benefit** — how much value does extracting this give you?
2. **Feasibility** — how deeply embedded is this functionality?

### High-Value Candidates
- Parts that need to scale independently (the bottleneck)
- Parts that change most frequently (volatile code)
- Parts that many teams need to touch simultaneously (coordination bottleneck)

### Tools to Find Hotspots
Static analysis tools like **CodeScene** can visualize "hotspot" files — code that changes frequently AND is highly coupled. These are prime candidates for extraction.

### Easy Wins First
Functionality that is already somewhat self-contained makes for an easier first microservice. Early wins build team confidence and demonstrate value.

---

## Key Decomposition Patterns

### Strangler Fig Pattern
From Martin Fowler. Wrap the monolith behind a facade/proxy. Redirect specific routes/calls to new microservices. As new services absorb functionality, the monolith shrinks.

```
                      ┌──────────────────┐
HTTP Request ──────►  │ Facade / Proxy   │
                      └────┬───────┬─────┘
                           │       │
              ┌────────────▼─┐  ┌──▼─────────────┐
              │  New Service  │  │  Old Monolith   │
              │ (Catalog)     │  │ (everything     │
              └───────────────┘  │  else)          │
                                 └─────────────────┘
```

The proxy intercepts requests. Over time, more and more routes are directed to new services.

### Branch by Abstraction
Used when the code you want to extract is deeply tangled in the monolith:
1. Create an abstraction (interface) over the functionality to extract
2. Make the existing monolith code implement the abstraction
3. Build the new microservice also implementing the abstraction
4. Switch over and remove the old implementation

### Parallel Run
Run old monolith code and new microservice side by side. Compare outputs. Useful for high-risk extractions where correctness is critical before fully committing.

### Decorating Collaborator
Add behavior to existing calls without modifying the monolith. A separate service intercepts and decorates calls, adding new business logic.

---

## Database Decomposition

The hardest part of decomposing a monolith is often the database, not the code.

### Pattern: Database-per-Service (Goal State)
Each microservice has its own database (or schema). No sharing.

### Getting There: Migration Strategies

**Step 1: Separate the schema first**
Before moving service code, create separate schemas within the same database. Introduce a join via application code (or service calls) instead of SQL joins.

**Step 2: Move the service code**
Once the schema is logically separated, extract the service code. The service now owns its schema.

**Step 3: Separate the database server (optional)**
For full isolation, move each schema to its own database server.

:::warning
Removing shared database tables is the highest-risk step. Do it last, and do it incrementally. Introduce an **integration database** period where both old and new code access the same data, then migrate.
:::

### Shared Static Data
Reference data (e.g., country codes, currency codes) shared across services is a common problem. Options:
- Duplicate the data in each service (simple, cheap, eventually consistent)
- Create a dedicated reference data service (adds a dependency)
- Share via configuration or a read-only data store

---

## Incremental Migration Checklist

Before extracting a microservice:

- [ ] You have a clear goal for why this extraction adds value
- [ ] You understand the domain well enough to draw stable boundaries
- [ ] The team has basic CI/CD pipeline capability
- [ ] You've identified all database tables owned by this service
- [ ] You've mapped all upstream callers (what currently calls this code?)
- [ ] You have a rollback plan

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| Incremental migration | Chip away one service at a time; don't big-bang rewrite |
| Goal-first | Know *why* you're splitting before you split |
| Strangler Fig | Proxy pattern to intercept and redirect traffic to new services |
| Database decomposition | Hardest step; do schema separation before code extraction |
| Premature splitting | Splitting too early locks you into wrong boundaries |
