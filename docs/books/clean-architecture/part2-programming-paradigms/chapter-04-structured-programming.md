---
id: chapter-04-structured-programming
title: "Chapter 4: Structured Programming"
sidebar_position: 2
description: >
  Dijkstra's discovery that unrestrained goto is harmful, and how structured programming's sequence/selection/iteration constructs make software provable — and testable. The scientific method applied to code.
tags:
  - structured-programming
  - dijkstra
  - goto
  - testability
  - tdd
  - functional-decomposition
---

# Chapter 4: Structured Programming

> _"Testing shows the presence, not the absence, of bugs." — Edsger Dijkstra_

## 🎓 For New Learners

### Dijkstra's Problem

Edsger Dijkstra realized in the 1950s that programming is **hard** — too hard for human brains to manage without systematic help. A single overlooked detail in a large program causes subtle, surprising failures.

His proposed solution: apply mathematical **proof** to programs. Prove each function correct, build up a hierarchy of proved units, like Euclidean geometry.

### The `goto` Problem

While attempting to build proofs, Dijkstra found that certain uses of `goto` made programs **impossible to decompose** into smaller provable units. `goto` could jump anywhere — the program's flow became a tangled web that defied analysis.

He identified that "good" control structures — `if/then/else`, `do/while`, `for` — preserved the ability to reason about programs recursively. Programs built from only these constructs could be decomposed into small, manageable, provable pieces.

In 1968 he published "Go To Statement Considered Harmful" in CACM. The programming world erupted. A decade-long argument ended with Dijkstra winning: modern languages removed or severely restricted `goto`.

### Three Control Structures

Dijkstra (building on Böhm and Jacopini's proof) showed that **all programs can be built from just three structures**:

1. **Sequence** — statements execute one after another
2. **Selection** — `if/else`, `switch`
3. **Iteration** — `while`, `for`, `do-while`

This is profound: you don't need `goto`. You never did.

### Science to the Rescue: Tests Instead of Proofs

The formal mathematical proof approach never took off — it's too laborious. Instead, we use a **scientific** approach:

- Science doesn't prove theories **correct** — it proves them **not incorrect** (falsifiable)
- Tests are falsification attempts. A passing test suite means we failed to find bugs, which is the best we can do
- A program that cannot be decomposed into small units cannot be tested meaningfully — it becomes un-falsifiable

> **Structured programming forces recursive decomposition into small, testable units.** This is why it still matters today, not as "don't use goto" but as "design programs that are provable/testable by decomposition."

---

## 🔬 Senior Deep Dive

### Falsifiability as the Architectural Standard

Martin's key architectural extrapolation: **software is a science, not mathematics**. We cannot prove programs correct; we can only fail to prove them incorrect. This means:

- **Testability is not optional** — it is the only mechanism we have for confidence in software
- An architecture that makes code hard to test is an architecture that makes code unverifiable
- "We don't write tests because we know the code works" is epistemologically incoherent

Architects should evaluate every structural decision by: *"Does this make units easier or harder to falsify?"*

### Functional Decomposition at Architectural Scale

Structured programming's core idea — decompose into smaller provable units — applies at every level:

- **Function level**: small functions with one clear behavior, testable in isolation
- **Class level**: classes with cohesive responsibilities, independently testable  
- **Component level**: modules with stable interfaces, independently deployable
- **System level**: services with clear contracts, independently verifiable

The architecture is **fractal**: the same decomposition discipline applies at each scale.

### Java Implications

In Spring, the failure of structured thinking at scale looks like:

```java
// Un-decomposed: Cannot test this without the entire system
@Service
public class OrderProcessor {
    public void process(Long orderId) {
        // 200 lines mixing: DB fetch, business rules, 
        // email sending, Kafka publishing, audit logging
        // No clear units. No testable seams.
    }
}

// Decomposed: Each unit is testable independently
public class OrderValidator { ... }        // testable
public class DiscountCalculator { ... }    // testable
public class OrderPersistenceGateway { ...}// testable with mock
public class NotificationService { ... }   // testable with mock

// Orchestrator is thin and clearly testable
public class ProcessOrderUseCase {
    public void execute(Long orderId) {
        Order order = gateway.findById(orderId);
        validator.validate(order);
        Discount d = calculator.calculate(order);
        order.applyDiscount(d);
        gateway.save(order);
        notifier.notify(order);
    }
}
```

Each of the extracted classes can be tested with a single JUnit test class, no Spring context required.

---

## Summary

| Concept | Key Point |
|---|---|
| Dijkstra's insight | `goto` prevents recursive decomposition; structured control prevents it |
| Three structures | Sequence, selection, iteration — sufficient for all programs |
| Proofs vs Tests | Mathematical proofs failed; scientific falsification (tests) succeeded |
| Architecture lesson | Design for testability at every level — it's the only path to correctness |
