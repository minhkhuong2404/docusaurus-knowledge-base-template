---
id: overview
title: Design Patterns Overview
sidebar_label: Overview
---

# Design Patterns Overview

> Design patterns are **reusable solutions to recurring design problems**. They are a vocabulary, not a prescription. Knowing *when not* to use a pattern is as important as knowing the pattern itself.

---

## The Gang of Four (GoF) Patterns

The 23 classic patterns from *Design Patterns: Elements of Reusable Object-Oriented Software* (Gamma et al., 1994) are organized into three categories:

| Category | Purpose | Patterns |
|----------|---------|---------|
| **Creational** | Control object creation | Singleton, Factory Method, Abstract Factory, Builder, Prototype |
| **Structural** | Compose classes/objects | Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy |
| **Behavioral** | Object communication | Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor |

---

## Most Commonly Asked in LLD Interviews

From most to least frequently appearing:

```
🥇 Tier 1 (Must Know — appear in almost every problem)
   Strategy, Observer, Factory, Singleton, Builder

🥈 Tier 2 (High Frequency — know well)
   Decorator, Command, State, Composite, Template Method

🥉 Tier 3 (Know the concept)
   Adapter, Facade, Proxy, Iterator, Chain of Responsibility
```

---

## How to Recognize Which Pattern to Use

| When you see... | Consider... |
|----------------|------------|
| Multiple algorithms that are interchangeable | **Strategy** |
| One event that many objects need to react to | **Observer** |
| Complex object construction with many options | **Builder** |
| Adding behavior to objects without subclassing | **Decorator** |
| A request that should be encapsulated as an object | **Command** |
| An object whose behavior changes based on internal state | **State** |
| A tree of objects (part-whole hierarchy) | **Composite** |
| An incompatible interface you can't change | **Adapter** |
| Exactly one instance of a class needed | **Singleton** |
| Subclasses decide which class to instantiate | **Factory Method** |
| A fixed algorithm with customizable steps | **Template Method** |

---

## Common Mistakes to Avoid

### ❌ Overusing Singleton
Singleton is the most misused pattern. It introduces global state and makes testing hard.

```java
// ❌ Using Singleton just because "there's only one right now"
public class DatabaseConnection {
    private static DatabaseConnection instance;
    // ... is this really a singleton? What about test isolation?
}

// ✅ Better: use dependency injection; let the DI container manage lifecycle
public class DatabaseConnection {
    private final String url;
    public DatabaseConnection(String url) { this.url = url; }
}
// Wire once in main(), inject everywhere
```

:::tip[Interview Tip 🎯]
When you mention Singleton in an interview, proactively say: *"I'd use Singleton here for X, but I'm aware of the downsides — global state makes unit testing harder. In a production codebase I'd prefer to manage this lifecycle through a DI framework."* This shows senior thinking.
:::

### ❌ Pattern Matching
Don't force a pattern onto every problem. The simplest code that expresses intent clearly is always better.

### ❌ Naming Patterns in the Name
`StrategyStrategy`, `FactoryFactory` — these suggest you're thinking about patterns instead of the domain.

---

## The Pattern Selection Framework

When you identify a design decision in an interview, ask yourself:

```
1. What VARIES in this design?
   → The variation point is where a pattern should live.

2. What STAYS THE SAME?
   → This is the stable core — protect it from change.

3. What RELATIONSHIP exists between objects?
   → is-a → inheritance/interface
   → has-a → composition
   → uses-a → dependency injection

4. What CHANGES OVER TIME?
   → State pattern for behavior changes
   → Observer for data propagation
   → Command for action history
```

---

## Pattern Combinations in Real Problems

Real systems use **multiple patterns together**. Here's how they combine in classic LLD problems:

| Problem | Patterns Used |
|---------|-------------|
| Parking Lot | Strategy (pricing), Factory (spot allocation), Observer (availability events) |
| Rate Limiter | Strategy (algorithm), Singleton (per-resource limiter) |
| Elevator | State (door/movement), Strategy (scheduling), Observer (floor requests) |
| Movie Booking | Observer (seat hold expiry), Command (book/cancel), Factory (seat types) |
| File System | Composite (file/folder tree), Iterator (traversal), Decorator (permissions) |

**Next →** [Creational Patterns](./creational)
