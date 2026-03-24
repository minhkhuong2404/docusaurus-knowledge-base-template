---
sidebar_position: 16
title: "Chapter 15: Organizational Structures"
---

# Chapter 15: Organizational Structures

**Part III — People**

> Technology alone doesn't make microservices work. The team structures around microservices matter as much as the architecture itself. This chapter explores how to organize teams to get the most out of microservice architectures.

---

## Conway's Law Revisited

Chapter 1 introduced Conway's Law: systems mirror the communication structures of the organizations that build them. This chapter explores how to *apply* this insight deliberately.

If you want loosely coupled microservices, you need loosely coupled teams. Team boundaries and service boundaries must align. If Team A must coordinate with Team B to deploy a change, that's a sign either the teams or the services are too tightly coupled.

**Inverse Conway Maneuver:** Intentionally design your team structure to produce the architecture you want.

---

## Team Topologies

The book **Team Topologies** (by Matthew Skelton and Manuel Pais) provides a framework that maps extremely well to microservice architectures. Newman draws on it extensively.

Four fundamental team types:

### 1. Stream-Aligned Team

A small, cross-functional team **aligned to a flow of business value**. Owns end-to-end delivery: frontend, backend, database, deployment, and operations for their domain.

```
Order Team
  ├── Frontend developers
  ├── Backend developers (Java/Spring)
  ├── QA engineer
  └── Product manager
  Owns: order-service, order-query-service, orders UI fragment
```

This is the primary team type in a microservice organization. Most teams should be stream-aligned.

**Characteristics:**
- Small (5–9 people)
- Full ownership including production support
- Low cognitive load — limited scope
- Minimal dependencies on other teams

### 2. Enabling Team

A temporary team that helps stream-aligned teams adopt new capabilities. They don't build production systems — they enable others to do so.

**Examples:**
- A team helping others adopt Kubernetes
- A platform engineering team helping teams implement observability
- A security team helping teams implement zero-trust networking

The key: enabling teams should work themselves out of a job. Once stream-aligned teams are capable, the enabling team moves on.

### 3. Complicated Subsystem Team

Owns a subsystem that requires deep specialist knowledge beyond typical team capacity. Other teams use their component but shouldn't need to understand its internals.

**Examples:**
- A team owning a machine learning recommendation engine
- A team owning a proprietary risk calculation subsystem
- A team owning a complex real-time fraud detection system

### 4. Platform Team

Builds and maintains an **internal platform** (a product used by other teams), abstracting infrastructure complexity.

**Examples:**
- Developer platform: CI/CD pipelines, container orchestration, secrets management
- Data platform: data lake, event streaming infrastructure
- Observability platform: centralized logging, metrics, tracing

```
Platform Team provides:
  ├── Golden path CI/CD templates
  ├── Self-service Kubernetes namespaces
  ├── Pre-configured monitoring dashboards
  └── Shared Kafka cluster

Stream-aligned teams consume:
  ├── Use the CI/CD templates (don't reinvent)
  ├── Provision their own namespaces
  └── Connect their services to shared Kafka
```

:::tip
The platform should feel like a product, not an internal bureaucracy. If stream-aligned teams work around the platform instead of using it, the platform isn't providing value.
:::

---

## Team Interaction Modes

How teams interact is as important as how they're structured.

| Mode | Description | Use When |
|---|---|---|
| **Collaboration** | Teams work together closely, sharing responsibility | Short-term: learning new tech, building something new together |
| **X-as-a-Service** | One team provides a service; others consume it as a product | Ongoing: platform team → stream-aligned teams |
| **Facilitating** | Enabling team helps another team learn/adopt something | Temporary: capability transfer |

The goal is to minimize *collaboration* (high cognitive overhead) and maximize *X-as-a-Service* (low overhead). Collaboration is expensive — it requires constant synchronization.

---

## Team Size and Cognitive Load

### The Two-Pizza Rule
Jeff Bezos famously said a team should be small enough to be fed by two pizzas (5–9 people). Beyond this size, communication overhead grows faster than output.

### Cognitive Load Limits
A team can only hold so much in its head. Service boundaries should be designed so that:
- A single team can own several small services, or one larger service
- A team is never responsible for so many services that they can't understand all of them

If a team owns 20 services and can't confidently describe what each one does, those boundaries are wrong — either consolidate services or split the team.

---

## Ownership and Autonomy

### Who Owns What?

Clear ownership is critical:
- Each service has exactly one owning team
- The owning team decides tech stack, architecture, deployment schedule
- Other teams consume the service's API but have no say in internals

Ownership ambiguity → coordination hell. If two teams both "sort of own" a service, neither will take responsibility for it.

### The "You Build It, You Run It" Model

Werner Vogels (Amazon CTO) coined this: teams that build services also run them in production. They carry the pager.

Benefits:
- Teams build more observable, resilient software (because they suffer when it's not)
- Faster incident response (team with context responds immediately)
- Incentive alignment (team feels production pain)

---

## Shared Services vs. Duplication

A tension arises: should multiple teams share a service (e.g., a notification service), or should each team build their own notification capability?

### When to Share
- The shared service has genuinely complex, specialized logic
- A dedicated team owns and maintains it
- Consumers are loosely coupled (async events, not synchronous calls)

### When to Duplicate
- The "shared" functionality is simple and generic (a thin wrapper around Twilio/SendGrid)
- Sharing would create a bottleneck (every team coordinates with one team)
- Teams need different behavior for their domain

:::caution
A "shared service" with no clear owner and many consumers is a dangerous anti-pattern. It becomes the hardest-to-change service in the system.
:::

---

## Remote and Distributed Teams

Microservices work well for distributed organizations — if service boundaries align with team boundaries, teams can work independently across timezones.

Best practices for distributed microservice teams:
- **Async-first communication** — don't rely on synchronous meetings for every decision
- **Well-documented APIs** — OpenAPI/Swagger specs reduce back-and-forth questions
- **Explicit team contracts** — what SLAs does each service promise? Written down.
- **Transparent roadmaps** — teams publish their planned API changes in advance

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| Stream-Aligned Team | Cross-functional team owning end-to-end business capability |
| Enabling Team | Temporary team helping others adopt new capabilities |
| Platform Team | Builds internal developer platform as a product |
| Complicated Subsystem Team | Deep specialist ownership of complex components |
| Conway's Law (applied) | Design org structure to produce the architecture you want |
| Cognitive Load | Keep team ownership scoped to what a team can understand |
| You Build It, You Run It | Teams own their services in production |
