---
sidebar_position: 13
title: "Chapter 12: Emergence"
description: Kent Beck's four rules of simple design and how following them leads to emergent good design.
---

# Chapter 12: Emergence

## Good Design Emerges from Simple Rules

This short but powerful chapter presents **Kent Beck's Four Rules of Simple Design**. If your code follows these four rules — in priority order — good design will emerge naturally. You don't need to plan every abstraction up front.

---

## The Four Rules of Simple Design (in Priority Order)

### Rule 1: Runs All the Tests ✅

A system that cannot be verified through tests is not a trustworthy system. Tests must pass — always.

But here's the key insight: **making code testable drives better design**.

- Code that is hard to test is often tightly coupled or has too many responsibilities.
- When you write tests first, you naturally write code with small, focused classes and minimal dependencies.
- High test coverage gives you the confidence to refactor — which leads to rules 2, 3, and 4.

> *"A system that is comprehensively tested and passes all of its tests all of the time is a testable system. That's an obvious statement, but an important one. Systems that aren't testable aren't verifiable. Arguably, a system that cannot be verified should never be deployed."*

This is the most fundamental rule. Without it, the others don't matter.

---

### Rule 2: No Duplication

Duplication is the root of all evil in software design. Every piece of knowledge should have a **single, authoritative representation** in the codebase.

Duplication comes in many forms:

```java
// Obvious duplication — identical code blocks
public void processOrder(Order order) {
    validateCustomer(order.getCustomer());
    int total = 0;
    for (Item item : order.getItems()) { total += item.getPrice(); } // duplicated
}

public void previewOrder(Order order) {
    validateCustomer(order.getCustomer());
    int total = 0;
    for (Item item : order.getItems()) { total += item.getPrice(); } // duplicated
}

// Extracted — single source of truth
private int calculateTotal(List<Item> items) {
    return items.stream().mapToInt(Item::getPrice).sum();
}
```

Less obvious duplication: identical *logic* in different forms.

```java
// Subtle duplication — size() and isEmpty() share an implementation concern
public int size() { return 0; }
public boolean isEmpty() { return elements.length == 0; }

// Better — isEmpty() delegates to avoid duplicate logic
public boolean isEmpty() { return size() == 0; }
```

Even small duplications are worth eliminating. The **Template Method Pattern** is a classic tool for removing higher-level duplication while keeping structure consistent:

```java
// Common structure with varying steps — Template Method
abstract class DataProcessor {
    // Template method — defines the algorithm
    public final void process() {
        readData();    // varies
        processData(); // varies
        writeData();   // varies
    }

    protected abstract void readData();
    protected abstract void processData();
    protected abstract void writeData();
}
```

---

### Rule 3: Expressive

The code should clearly express the **intent** of its author. The biggest cost of software is long-term maintenance. The better the code communicates its purpose, the less time future developers spend deciphering it.

Ways to be expressive:

1. **Good names** — choose names that reveal intent (see Chapter 2)
2. **Small functions and classes** — small things are easier to name and understand
3. **Standard patterns** — using `Command`, `Strategy`, `Decorator` communicates at a higher level: "this is a Strategy"
4. **Well-written tests** — tests document intended behavior better than comments

The most important expressiveness investment: **try**. Most code is not expressive simply because the developer didn't care enough to try a cleaner name or a shorter method. Expressiveness requires attention and effort.

---

### Rule 4: Minimal Classes and Methods

Once you've eliminated duplication and ensured expressiveness, minimize the number of classes and methods.

This rule is **lowest priority** — it should not be used to justify duplication or obscurity. Some developers take SRP or DRY to the extreme, creating classes for every tiny concept or extracting functions so aggressively that the codebase becomes a maze of trivial one-liners.

The goal is **simplicity**, not adherence to a pattern or a metric.

```java
// Taken too far — extracting a one-liner to a named method adds no clarity
private boolean isActive(User user) { return user.getStatus() == Status.ACTIVE; }

// If used once and obvious inline, keep it inline:
if (user.getStatus() == Status.ACTIVE) { ... }
```

Pragmatism rules: if the class or method is truly trivial and its extraction adds no value, don't extract it.

---

## How the Rules Work Together

These four rules reinforce each other:

- **Tests** force small, loosely coupled classes — which are easier to make **expressive**
- **Eliminating duplication** often produces new abstractions — which should be **expressive**
- **Expressiveness** requires small, well-named things — which naturally **minimizes** code

The result: *emergent design*. You don't need to plan the perfect architecture up front. Start with testable code, remove duplication aggressively, name everything clearly, and keep things small. Good design will emerge from this discipline.

---

## Key Takeaways

| Rule | Priority | Core Idea |
|------|----------|-----------|
| Runs all tests | 1 (Highest) | Testable code = better designed code |
| No duplication | 2 | Single source of truth for every piece of knowledge |
| Expressive | 3 | Code should communicate intent clearly |
| Minimal classes and methods | 4 (Lowest) | Don't over-engineer; keep it simple |

Follow these rules in order and clean design will emerge naturally, without needing to predict the future or plan every abstraction.
