---
sidebar_position: 17
title: 'Chapter 16: The Evolutionary Architect'
description: '**Part III — People**'
tags:
- books
- building-microservice
- chapter-16
---
# Chapter 16: The Evolutionary Architect

**Part III — People**

> This final chapter reframes what it means to be an architect in a microservice organization — less like a construction architect designing a fixed blueprint, and more like a town planner shaping an evolving ecosystem.

---

## Rethinking the Role of Architect

Traditional software architecture often implies a "big upfront design" — an architect creates a detailed blueprint that teams implement. This doesn't work for microservices, where:
- The system constantly evolves
- Teams make local decisions every day
- No one person can understand all the details

The metaphor shift: **from architect as building designer to architect as town planner**.

A building architect designs every detail of one building. A town planner doesn't design every building — they set **zoning rules, utilities infrastructure, and general standards** that guide how individual property owners build their own structures. The result is an emergent, liveable city — not a rigid, centrally designed plan.

---

## The Architect's Core Responsibilities

### 1. Define the System's Overall Shape

The architect defines high-level structural decisions:
- Service boundaries (in collaboration with teams)
- Inter-service communication standards (REST vs. gRPC vs. messaging)
- Technology guardrails (approved languages, databases, frameworks)
- Data ownership rules

These decisions shape the landscape. Individual services make their own local decisions within this landscape.

### 2. Set the "Paved Road" (Golden Paths)

The most effective architecture governance is not enforcement — it's making the right way the easy way.

A **paved road** is a set of opinionated, well-supported defaults:
- Service template with CI/CD, observability, security configured
- Spring Boot starter with standard logging, metrics, circuit breakers pre-configured
- Terraform module for standard service infrastructure

Teams *can* deviate from the paved road — but they take on the burden of maintaining their deviation.

```
# Service template includes pre-configured:
spring-boot-starter-web
spring-boot-starter-actuator          # /health, /metrics
micrometer-registry-prometheus        # metrics export
spring-cloud-starter-sleuth           # distributed tracing
resilience4j-spring-boot-starter      # circuit breaker, retry
spring-boot-starter-security          # auth
```

### 3. Govern Without Micromanaging

Governance is about **outcomes**, not dictating implementation details.

Bad governance: "All services must use Java 17 with Spring Boot 3.1 and PostgreSQL."
Good governance: "All services must expose health checks, export metrics in Prometheus format, and use structured logging with correlation IDs."

The first prescribes *how*. The second prescribes *what* (outcomes) while leaving teams free in *how* they achieve it.

### 4. Be the Glue Between Teams

The architect sees across all teams. In a microservice organization with many stream-aligned teams, this cross-cutting view is valuable:
- Spotting duplication of effort across teams
- Identifying emerging patterns that should become standards
- Communicating upcoming changes that will affect multiple teams
- Facilitating decisions that require cross-team input

---

## The Technology Radar

Inspired by ThoughtWorks' Technology Radar, teams maintain a radar of technologies:

| Zone | Meaning |
|---|---|
| **Adopt** | Proven, recommended for use |
| **Trial** | Worth evaluating; proceed with caution |
| **Assess** | Worth researching; don't use in production yet |
| **Hold** | Don't start new work with this |

This shared visibility prevents teams from independently adopting incompatible technologies or relitigating technology choices.

---

## Evolutionary Architecture

Architecture must evolve. Requirements change. Technology changes. Team sizes change. The architecture you have today should be adaptable, not permanent.

### Fitness Functions

**Fitness functions** are automated tests for architectural properties — they verify the architecture is staying true to its intentions.

Examples:
- **Coupling fitness function:** A CI check that fails if a service imports from another service's package
- **Latency fitness function:** A performance test that fails if P99 latency exceeds SLA
- **Security fitness function:** A check that all services use approved TLS configurations
- **Observability fitness function:** A check that all services expose `/actuator/health` and export metrics

```java
// ArchUnit — test architectural rules in Java
@Test
void servicesShouldNotDependOnOtherServicesInternals() {
    JavaClasses classes = new ClassFileImporter().importPackages("com.example");
    
    ArchRule rule = noClasses()
        .that().resideInAPackage("com.example.orders..")
        .should().dependOnClassesThat()
        .resideInAPackage("com.example.inventory.internal..");
    
    rule.check(classes);
}
```

ArchUnit lets you codify architectural rules as unit tests. If a developer accidentally imports an internal class from another service's package, the build fails.

---

## Common Anti-Patterns for Architects

### The Ivory Tower Architect
Designs systems from above without talking to the teams building them. Produces architectures that look great on paper but are impossible to implement in practice.

**Fix:** Architects should regularly code. Join teams for sprints. Understand the constraints they face.

### The Committee Architect
Every decision requires committee approval. Teams must get architecture sign-off for anything non-trivial. Everything slows down.

**Fix:** Push decisions down. Teams should be empowered to make most decisions. Architects get involved for cross-cutting concerns or truly novel problems.

### The Accidental Architect
No one is making architecture decisions. Each team makes isolated local decisions that accumulate into an incoherent global architecture.

**Fix:** Designate architects. Hold regular architecture reviews. Make the radar visible.

---

## When to Standardize, When to Allow Variation

| Standardize | Allow Variation |
|---|---|
| Observability (logging format, metrics) | Programming language (if teams have strong preferences) |
| Service contract format (JSON/Protobuf) | Internal framework choices |
| Security standards (auth mechanism) | Database per service |
| Deployment process (CI/CD pipeline structure) | Testing strategies |
| On-call and incident management | Code structure within a service |

The rule: standardize things that **cross service boundaries** (interfaces, observability, security). Allow variation in things that **stay within a service boundary**.

---

## The Architect's Mindset: Build to Change

The overriding principle: **build for changeability, not permanence**.

- Prefer reversible decisions over irreversible ones
- Design service boundaries that can be split or merged as understanding grows
- Accept that today's architecture will need to evolve; that's not failure, that's success

> "Architecture is the decisions that are hard to change." — Martin Fowler

This means minimizing the decisions that are hard to change, and being intentional about the ones you do commit to.

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| Town Planner | Architect as ecosystem guide, not blueprint designer |
| Paved Road | Make the right way the easy way; opinionated defaults teams can deviate from |
| Governance by outcomes | Define what (standards), not how (implementation) |
| Fitness Functions | Automated architectural tests built into CI |
| ArchUnit | Enforce Java architectural rules as unit tests |
| Technology Radar | Shared visibility on approved, trial, and deprecated technologies |
| Build to change | Prefer reversible decisions; accept evolution as success |
