---
id: chapter-13-component-cohesion
title: "Chapter 13: Component Cohesion"
sidebar_position: 2
description: >
  Three principles govern which classes belong in which component: REP (Reuse/Release Equivalence), CCP (Common Closure), and CRP (Common Reuse). They form a tension triangle — understanding the trade-offs helps you choose the right grouping strategy for your project's stage.
tags:
  - components
  - cohesion
  - REP
  - CCP
  - CRP
  - component-principles
  - architecture
---

# Chapter 13: Component Cohesion

> _"Which classes belong in which components? This is an important decision, and requires guidance from good software engineering principles."_

## 🎓 For New Learners

### The Three Cohesion Principles

When deciding which classes to group into a single deployable component (JAR), three principles guide the decision:

| Principle | Rule | Focus |
|---|---|---|
| **REP** — Reuse/Release Equivalence | Group for reusers | Classes that are released together should be reused together |
| **CCP** — Common Closure | Group for maintainers | Classes that change together should live together |
| **CRP** — Common Reuse | Don't force unnecessary dependencies | Classes not used together should not be in the same component |

### REP: Reuse/Release Equivalence Principle

> _"The granule of reuse is the granule of release."_

If you publish a library for others to reuse, everything in that library should make sense as a coherent release unit. You shouldn't bundle unrelated things in a single versioned release.

When you put `2.3.0` on a JAR, users trust that all classes in that JAR changed together for related reasons. If you bundle a web client and a PDF generator in the same library, upgrading for a PDF fix drags in web client changes — even if the consumer doesn't use the web client.

**From the consumer's perspective**: only depend on libraries where most of what they contain is useful to you. Importing a 50-class JAR for one utility class is an ISP violation at the component level.

### CCP: Common Closure Principle

> _"Gather into components those classes that change for the same reasons and at the same times."_

CCP is SRP applied to components. A component should have only one reason to change — changes caused by the same forces should be localized to a single component.

If a business rule change forces modifications across five different JARs, you have five JARs to rebuild, test, and redeploy. That's expensive. Group the business rule's classes into one component, and a rule change means one JAR changes.

CCP is the dominant principle for **applications** (as opposed to reusable libraries). Applications care more about ease of maintenance than reusability.

### CRP: Common Reuse Principle

> _"Don't force users of a component to depend on things they don't need."_

Don't put classes together if they're not used together. When one class in a component changes, the whole component must be rereleased — and everyone who depends on that component must update, even if they use none of the changed classes.

CRP says: split components at natural usage seams, so that users only depend on what they actually use.

### The Tension Triangle

These three principles are in tension with each other:

```
          REP
         (group for reuse)
        /       \
       /         \
      /           \
    CRP --------- CCP
(don't over-bundle) (group for change)
```

- **REP + CCP** (ignoring CRP): Too many unnecessary classes in components; consumers drag in things they don't use
- **REP + CRP** (ignoring CCP): Changes ripple across many components; maintenance is painful
- **CCP + CRP** (ignoring REP): Components are too fine-grained; hard to reuse as units

The right balance depends on your project's stage:
- **Early project**: CCP dominates — ease of development and change matters most
- **Mature library**: REP + CRP dominate — reusability and clean dependency contracts matter

---

## 🔬 Senior Deep Dive

### CCP in Practice: Feature Packaging vs Layer Packaging

CCP directly argues against **package by layer** (all controllers together, all services together, all repositories together) in favor of **package by feature** or **package by component**.

```
// Package by layer — CCP violation: a feature change touches all layers
com.example.controllers.OrderController
com.example.services.OrderService
com.example.repositories.OrderRepository

// Package by component/feature — CCP compliant: feature change is local
com.example.orders.OrderController
com.example.orders.OrderService
com.example.orders.OrderRepository
```

When `Order` rules change, the second structure localizes the change to `com.example.orders`. In the first structure, you touch three packages, potentially affecting other features that share those layers.

### REP Applied to Spring Starters

Spring Boot starters are a perfect application of REP:

- `spring-boot-starter-web` — Spring MVC, Jackson, Tomcat. You use these together.
- `spring-boot-starter-data-jpa` — Spring Data, Hibernate, JDBC. You use these together.

Each starter is released as a unit. Upgrading `spring-boot-starter-web` doesn't force you to change your JPA configuration. The starters are designed so their contained classes are naturally reused together.

When building your own internal libraries, apply REP the same way: release things together that are naturally used together.

### CRP and Maven Dependency Analysis

CRP violations manifest as **unused transitive dependencies**. Maven's `dependency:analyze` goal reveals them:

```bash
mvn dependency:analyze

# Output example:
# [WARNING] Used undeclared dependencies:
#   com.example:some-util:jar:1.0.0
# [WARNING] Unused declared dependencies:
#   com.example:kitchen-sink-library:jar:3.2.0
```

`kitchen-sink-library` is a CRP violation: it packages classes you don't use, but you're forced to version-track it anyway. Extract only what you need into a focused dependency.

### Component Cohesion and Microservices

The same principles apply at the service level:

- **REP**: Services that are always deployed together should perhaps be one service (or share a deployment pipeline)
- **CCP**: Business rules that change together for the same business reasons should be in the same service (the basis for bounded contexts in DDD)
- **CRP**: Don't put in one service what different consumers need separately — they'll step on each other's deployments

The tension triangle helps explain why "one microservice per database table" (all CRP, no CCP) produces systems where every business change requires coordinating five service teams.

---

## Summary

| Principle | Force | "Don't..." |
|---|---|---|
| REP | Reuse granule = release granule | Don't release things together that aren't used together |
| CCP | Changes cluster in one component | Don't spread one reason to change across many components |
| CRP | Don't drag in unused classes | Don't put things in the same component that users need to take separately |
| Tension | All three conflict; balance depends on project maturity | Early projects: CCP first; libraries: REP+CRP first |
