---
id: chapter-02-two-values
title: "Chapter 2: A Tale of Two Values"
sidebar_position: 2
description: >
  Every software system delivers two values — behavior and structure. Martin argues that structure (architecture) is almost always the more important of the two, yet teams chronically neglect it. Learn to use Eisenhower's Matrix to fight for architectural health.
tags:
  - architecture
  - values
  - behavior
  - structure
  - eisenhower-matrix
  - stakeholders
---

# Chapter 2: A Tale of Two Values

> _"The first value of software—behavior—is urgent but not always particularly important. The second value—architecture—is important but never particularly urgent."_

## 🎓 For New Learners

### Two Things Your Software Delivers

Every piece of software delivers exactly two values to the people who pay for it:

1. **Behavior** — does it do what it's supposed to do right now?
2. **Structure** (Architecture) — can it be changed to do new things later?

Both matter. But most development teams treat them as if only behavior matters.

### Why Behavior Is Not Enough

Behavior is what you implement when you write a feature. Behavior is what you fix when you patch a bug. It seems like the whole job. But Martin challenges this with a thought experiment:

- **Program A**: Works perfectly today, but impossible to change.
- **Program B**: Doesn't work today, but is easy to change.

Which would you choose? **Program B** — because you can make it work, and keep it working as requirements evolve. Program A becomes useless the moment requirements change (and they always do).

This is not a hypothetical. Systems reach a state where the cost of change exceeds its benefit. At that point, the system is _effectively_ impossible to change, regardless of how well it works today.

### The Shape Problem

Martin introduces a subtle but powerful concept: **scope vs. shape**.

When stakeholders request changes, they appear to be a "stream of similar-sized requests." From the developer side, each request has a different **shape** — and as the system grows rigid, fewer and fewer shapes fit without major surgery.

The system's architecture "prefers" the shapes of earlier decisions. New features increasingly require hammering square pegs into round holes. The fix is building architecture that is **shape-agnostic** — easily reshaped for whatever direction the business needs to go.

### Eisenhower's Matrix Applied to Software

Dwight Eisenhower famously said: _"The urgent are not important, and the important are never urgent."_ Applied to software:

| | **Urgent** | **Not Urgent** |
|---|---|---|
| **Important** | ① Behavior bugs breaking production | ② Architecture — keeping the system changeable |
| **Not Important** | ③ Most feature requests | ④ Trivial tasks |

The common mistake: teams elevate **③ (urgent but not important features)** above **② (important architecture)**, ignoring the foundation until it crumbles.

### Fighting for the Architecture

Martin is direct: developers must **fight** for architecture. Not passive resistance — active advocacy. You are a stakeholder in the software. That's part of why you were hired.

Letting architecture rot isn't "going along with the business." It's failing at your professional responsibility.

---

## 🔬 Senior Deep Dive

### The Calculus of Changeability

Martin frames this economically. The value of architecture is its **option value** — it preserves the ability to respond to future requirements without prohibitive cost. This maps directly to financial options theory: architecture is the premium you pay to keep future decisions open.

The counterintuitive consequence: **a system that works perfectly but cannot be changed has zero long-term value.** The business value of software is its ability to evolve, not its current behavior.

This framing is powerful in executive conversations. When a CTO resists "refactoring sprints," reframe: "We're purchasing future capacity. The cost of this investment is lower than the interest we'll pay on this architectural debt compounding every quarter."

### Scope vs. Shape — A Deeper Look

The scope/shape distinction is Martin's explanation for why cost grows non-linearly with system age, even when individual change requests stay constant in scope.

Consider a layered Spring application that was originally designed for a REST + MySQL use case. Every class is shaped around HTTP and JPA. When a new requirement arrives (export data to Kafka, expose gRPC endpoint, integrate a new payment system), the cost explodes — not because the requirement is large, but because its **shape** doesn't fit the existing system architecture.

Shape-agnostic architecture (Clean Architecture, Ports & Adapters) solves this by decoupling core logic from any particular delivery mechanism or persistence technology.

```java
// Shape-agnostic use case - doesn't care how it's called or where data goes
public interface ProcessPaymentUseCase {
    PaymentResult execute(PaymentCommand command);
}

// Today: REST + MySQL
// Tomorrow: gRPC + Kafka + PostgreSQL
// The use case implementation changes NOT AT ALL
```

### The Eisenhower Failure Mode

In practice, the Eisenhower failure is institutional, not individual. Sprint planning naturally surfaces urgent work (user-reported bugs, business feature requests). Architecture work is **never** in a support ticket. It has no story points, no stakeholder, no acceptance criteria.

The architect's role is to make architectural work visible and schedulable. Techniques:
- **Architecture fitness functions** (measure coupling, test coverage by layer, dependency direction violations in CI/CD)
- **Architecture decision records (ADRs)** — make implicit decisions explicit and trackable
- **Tech debt sprints** (10-20% capacity reserved for structural work in every cycle)

### The Responsibility Argument

Martin makes an ethical claim: software developers who let architecture decay are **professionally negligent**. This parallels the obligation of a structural engineer who would not sign off on a building they knew was unsound just because the client wanted to move in quickly.

This is a sharp edge for senior engineers and architects. When you let a release ship with known architectural violations because of sprint pressure, you have made a professional choice with long-term consequences for everyone who inherits that system.

### Java/Spring Application

Spring applications commonly suffer from **anemic domain models** — all logic lives in `@Service` classes that directly orchestrate `@Repository` calls. This feels productive initially but produces the worst of both values:
- Behavior is implemented quickly
- Structure grows rigid immediately

The behavior/structure balance is maintained by ensuring that business logic lives in **domain objects** (not in `@Service` orchestrators), and that use cases are thin coordinators of domain behavior — not repositories of it.

```java
// Anemic: Service owns all logic, domain is just data
@Service
public class OrderService {
    public void applyDiscount(Long orderId, double pct) {
        Order order = repo.findById(orderId);
        order.setTotal(order.getTotal() * (1 - pct));  // logic in service
        repo.save(order);
    }
}

// Rich domain: Logic in the entity, service is coordinator
public class Order {
    public void applyDiscount(Discount discount) {
        // validate, enforce invariants, update state
        this.total = discount.apply(this.total);
        this.discountHistory.add(discount);
    }
}
```

---

## Summary

| Concept | Key Point |
|---|---|
| Behavior | Urgent, sometimes important — makes machine do things |
| Structure | Important, never urgent — keeps machine changeable |
| The Greater Value | Structure, because a changeable system can always be made to work |
| Shape Problem | Architecture rigidity makes new features increasingly expensive regardless of their scope |
| Eisenhower Failure | Teams chronically treat urgent-not-important above important-not-urgent |
| Your Responsibility | Fight for architecture as a professional obligation, not a preference |
