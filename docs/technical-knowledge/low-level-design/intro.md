---
id: intro
title: Introduction to LLD Interviews
sidebar_label: 🚀 Introduction
slug: /intro
---

# Low Level Design Interview Mastery

> **Goal**: Design and implement a working, extensible, object-oriented system in 45 minutes — while talking through your decisions.

---

## What is a Low Level Design (LLD) Interview?

A **Low Level Design interview** (also called Object-Oriented Design or OOD interview) asks you to model a real-world system using classes, interfaces, and design patterns — and then write working code for it.

Unlike system design interviews (which focus on distributed systems, scalability, and infrastructure), LLD interviews zoom into the **class-level** structure of a solution.

| Aspect | LLD Interview | System Design Interview |
|--------|--------------|------------------------|
| Focus | Classes, objects, patterns | Services, databases, networks |
| Output | Working code | Architecture diagram |
| Duration | 45–60 min | 45–60 min |
| Languages | Java, Python, C++ | Language-agnostic |
| Evaluated on | OOP, code quality, patterns | Scale, reliability, trade-offs |

---

## The Interview Structure (45 minutes)

```
[0:00 – 0:05]  Requirements Clarification
[0:05 – 0:10]  Entity Identification & Relationships
[0:10 – 0:20]  Class Design (interfaces, hierarchy, patterns)
[0:20 – 0:40]  Implementation (core logic, clean Java code)
[0:40 – 0:45]  Edge Cases, Concurrency, Extensions
```

:::tip Interview Gold Rule
**Narrate everything.** Interviewers evaluate your *thinking process*, not just the final code. A great engineer who stays silent scores lower than a good engineer who explains each decision.
:::

---

## What Interviewers Look For

### 🟢 Junior Level (0–3 years)
- Can you identify nouns → classes, verbs → methods?
- Do you use `private`/`public` correctly (encapsulation)?
- Can you avoid one giant class (SRP)?
- Basic working implementation with no glaring bugs?

### 🟡 Mid Level (3–6 years)
- Do you program to **interfaces**, not implementations?
- Do you apply **SOLID principles** naturally?
- Do you choose appropriate **design patterns** (and can justify why)?
- Can you identify where **concurrency** could be an issue?

### 🔴 Senior Level (6+ years)
- Do you immediately consider **thread safety** and make explicit choices?
- Do you know when patterns **add complexity** without value?
- Can you discuss **trade-offs** (e.g., eager vs. lazy loading, locking granularity)?
- Do you proactively ask about **extensibility requirements**?
- Can you sketch a path from class-level design to a distributed system?

---

## Guide Structure

This guide is organized in the order you should learn things:

### 1. Foundation
- **[OOP Concepts](/technical-knowledge/low-level-design/oop/concepts)** — The 4 pillars, with Java examples
- **[Design Principles](/technical-knowledge/low-level-design/oop/principles)** — SOLID + DRY, KISS, YAGNI

### 2. Design Patterns
- **[Overview](/technical-knowledge/low-level-design/design-patterns/overview)** — When to use patterns, common mistakes
- **[Creational Patterns](/technical-knowledge/low-level-design/design-patterns/creational)** — Singleton, Factory, Builder, Prototype
- **[Structural Patterns](/technical-knowledge/low-level-design/design-patterns/structural)** — Adapter, Decorator, Composite, Facade
- **[Behavioral Patterns](/technical-knowledge/low-level-design/design-patterns/behavioral)** — Strategy, Observer, Command, State

### 3. Concurrency
- **[Correctness](/technical-knowledge/low-level-design/concurrency/correctness)** — Atomicity, visibility, data races
- **[Coordination](/technical-knowledge/low-level-design/concurrency/coordination)** — Locks, semaphores, barriers, condition variables
- **[Scarcity](/technical-knowledge/low-level-design/concurrency/scarcity)** — Thread pools, rate limiting, backpressure

### 4. Problems
Full end-to-end walkthroughs of 8 classic LLD problems.

---

## How to Use This Guide

**If you have 2 weeks:** Read everything in order. Do each problem from scratch before reading the solution.

**If you have 3 days:** Read OOP Concepts + Principles, skim Design Patterns overview, then focus on 3-4 problems relevant to your target company.

**If you have 1 day:** Read [SOLID Principles](/technical-knowledge/low-level-design/oop/principles), then do [Parking Lot](/technical-knowledge/low-level-design/problem/parking-lot) and [Rate Limiter](/technical-knowledge/low-level-design/problem/rate-limiter) end-to-end.

---

## Java Conventions Used

All code examples use **Java 17+** with standard library (no frameworks, unless noted).

```java
// Conventions used throughout:
// - Interfaces for all major abstractions
// - Enums for finite states
// - Records for immutable value objects (Java 16+)
// - Optional<T> instead of null returns
// - var for local type inference where it improves readability
```

Let's go! Start with [OOP Concepts →](/technical-knowledge/low-level-design/oop/concepts)
