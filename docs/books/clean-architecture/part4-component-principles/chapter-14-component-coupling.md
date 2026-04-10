---
id: chapter-14-component-coupling
title: "Chapter 14: Component Coupling"
sidebar_position: 3
description: >
  Three principles govern dependencies between components: ADP (no dependency cycles), SDP (depend in the direction of stability), and SAP (stable components should be abstract). These principles shape large-scale architecture and determine which components can evolve independently.
tags:
  - components
  - coupling
  - ADP
  - SDP
  - SAP
  - stable-dependencies
  - architecture
---

# Chapter 14: Component Coupling

> _"The dependency structure between components must be a directed acyclic graph (DAG). There can be no cycles."_

## 🎓 For New Learners

### The Three Coupling Principles

While cohesion answers "what goes inside a component," coupling principles answer "how should components depend on each other":

| Principle | Rule |
|---|---|
| **ADP** — Acyclic Dependencies | No cycles in the component dependency graph |
| **SDP** — Stable Dependencies | Depend in the direction of stability |
| **SAP** — Stable Abstractions | Stable components should be abstract |

### ADP: The Acyclic Dependencies Principle

Cycles in the dependency graph are catastrophic:

```
ComponentA → ComponentB → ComponentC → ComponentA  (cycle!)
```

To change **any** component in the cycle, you must consider changes to **all** components in the cycle. You cannot test A without B and C. You cannot release A without releasing B and C. The cycle makes the group of components a single monolithic block disguised as separate pieces.

**Breaking cycles** — two solutions:

1. **DIP**: introduce an interface that inverts the dependency. If `ComponentC` depends on `ComponentA`, create an interface in `ComponentC` that `ComponentA` implements. Now the runtime call goes from C → A, but the source code dependency goes from A → C. Cycle broken.

2. **New component**: extract the shared thing that creates the cycle into a brand new component. Both A and C depend on the new component. No cycle.

### SDP: The Stable Dependencies Principle

**Stability** doesn't mean "doesn't change." It means: **hard to change** because many things depend on it.

- A component with many **fan-in** (things depending on it) is stable — changing it breaks many things
- A component with many **fan-out** (it depending on many things) is unstable — it changes frequently because its dependencies change

SDP says: **depend in the direction of stability**. Volatile components (high fan-out, few dependents) should depend on stable components (high fan-in, few dependencies). Never the reverse.

Stability metric: `I = fan-out / (fan-in + fan-out)`
- `I = 0`: maximally stable (nothing depends on anything external; many things depend on it)
- `I = 1`: maximally unstable (depends on many things; nothing depends on it)

SDP: dependencies should point from high-I components to low-I components.

### SAP: The Stable Abstractions Principle

A maximally stable component that is also maximally concrete is maximally rigid — it cannot be extended without modification (OCP violation).

The solution: **stable components should be abstract**. Stability + abstraction = flexible stability.

- **Concrete + Unstable**: fine — volatile details that change freely
- **Abstract + Stable**: ideal — stable policies expressed as interfaces that can be extended
- **Concrete + Stable**: problematic — rigid, hard to extend (the "zone of pain")
- **Abstract + Unstable**: useless — interfaces nobody depends on (the "zone of uselessness")

---

## 🔬 Senior Deep Dive

### Cycle Detection in Maven Projects

Maven's `dependency-check` plugin and ArchUnit can detect cycles:

```java
// ArchUnit: fail the build if cycles exist between packages
@Test
void noCyclesBetweenPackages() {
    JavaClasses classes = new ClassFileImporter()
        .importPackages("com.example");
    slices().matching("com.example.(*)..").should().beFreeOfCycles()
        .check(classes);
}
```

In a multi-module Maven project, cycles between modules cause Maven build failures — Maven enforces DAG structure at the module level, which is one reason multi-module projects improve architecture.

### SDP and the Clean Architecture Layers

The Clean Architecture's concentric rings are ordered by stability:

| Layer | Stability | Instability Metric (I) |
|---|---|---|
| Entities (domain) | Most stable | ~0 |
| Use Cases | Stable | Low |
| Interface Adapters | Unstable | Medium |
| Frameworks & Drivers | Most unstable | ~1 |

Dependencies point inward (toward stability). The domain layer has the highest fan-in (everything depends on it) and nearly zero fan-out (it depends on nothing external). This is SDP + SAP realized as concentric rings.

### SAP Metrics and the Main Sequence

Martin introduces the "Main Sequence" — the ideal line on a graph of Abstractness (A) vs. Instability (I):

```
A
1 │ ●  Zone of Uselessness
  │    (abstract but nobody depends on it)
  │
  │      ╲  Main Sequence
  │       ╲  (ideal)
  │        ╲
  │         ╲
0 │──────────●  Zone of Pain
  0          1  I
             (concrete and maximally stable = rigid)
```

Components should plot near the main sequence. Distance from the main sequence is the metric of architectural health:

`D = |A + I - 1|`

`D` near 0 is ideal. High `D` means either "zone of pain" (stable + concrete) or "zone of uselessness" (abstract + unstable).

### Applying These Metrics in Spring Projects

A typical Spring application's component metrics:

```
Domain model (pure Java)
  fan-in: high (used by everything)
  fan-out: near zero
  Abstractness: high (interfaces, value objects)
  → I ≈ 0, A ≈ 0.7 → near main sequence ✓

Spring Boot starter classes (@SpringBootApplication)
  fan-in: near zero (nothing depends on the main class)
  fan-out: very high (depends on all other components)
  Abstractness: near zero (concrete configuration)
  → I ≈ 1, A ≈ 0 → near main sequence ✓

Spring @Service "God service" class
  fan-in: high (many controllers depend on it)
  fan-out: high (depends on many repos, clients, utils)
  Abstractness: zero (concrete class)
  → I ≈ 0.5, A = 0 → Zone of Pain ✗
```

The God Service is architecturally dangerous: it's concrete (hard to extend) and moderately stable (hard to change without breaking callers), but not abstract enough to be extended cleanly. Breaking it up — making it depend on interfaces, extracting smaller use cases — moves it toward the main sequence.

---

## Summary

| Principle | Core Rule | Violation Consequence |
|---|---|---|
| ADP | No cycles | Cycle = monolith in disguise; cannot release independently |
| SDP | Depend toward stability | Stable component depending on volatile one = unexpected breaks |
| SAP | Stable components should be abstract | Stable + concrete = Zone of Pain (rigid, can't extend) |
| Main Sequence | Balance stability and abstraction | Use D metric to identify architectural problem areas |
