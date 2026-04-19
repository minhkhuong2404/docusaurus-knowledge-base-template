---
id: intro
title: Welcome to OCP Java SE 21 Study Guide
sidebar_label: 🏠 Introduction
description: "A structured Docusaurus study guide covering all 14 chapters of the OCP Oracle Certified Professional Java SE 21 Developer exam (1Z0-830), with beginner explanations, senior deep-dives, exam tips, and Spring framework context."
tags:
  - ocp
  - java-21
  - exam-1z0-830
  - study-guide
  - overview
slug: /books/ocp
---

# OCP Java SE 21 Developer Study Guide

> **Exam:** 1Z0-830 — Oracle Certified Professional Java SE 21 Developer  
> **Based on:** *OCP Oracle Certified Professional Java SE 21 Developer Study Guide* by Jeanne Boyarsky & Scott Selikoff (2024)

---

## How to Use This Guide

This guide is structured for **two types of learners**:

| 🟦 New Learner | 🟣 Senior Deep Dive |
|---|---|
| Clear explanations with analogies | JVM internals, edge cases, traps |
| Step-by-step code walkthroughs | Advanced patterns and performance |
| Exam focus with mnemonic tips | Why things work the way they do |

Each chapter page is split into these two sections so you can read at your level.

### Study resources

- **Chapter deep dives** — Use the numbered chapters below for explanations, **Exam Quick Reference** tables, and chapter-specific traps.
- **[Exam Tips & Quick Reference](./exam-tips.md)** — Use this page for a **single cram sheet**: mnemonics, cross-chapter traps, stream/collections matrices, and a last-minute checklist before exam day.

---

## Exam Blueprint (1Z0-830)

| Domain | Topics | Chapters |
|---|---|---|
| Handling Date, Time, Text, Numeric & Boolean Values | Primitives, Wrappers, Math API, Strings, Date-Time API | 1, 2, 4 |
| Controlling Program Flow | if/else, switch, loops, break/continue | 3 |
| Using Object-Oriented Concepts | Classes, records, inheritance, polymorphism, interfaces, enums | 1, 5, 6, 7 |
| Handling Exceptions | try/catch/finally, try-with-resources, multi-catch | 11 |
| Working with Arrays and Collections | Arrays, List, Set, Map, Deque | 4, 9 |
| Working with Streams & Lambdas | Functional interfaces, streams, collectors | 8, 10 |
| Packaging and Deploying Java Code | Modules, jars, jlink, jpackage | 12 |
| Managing Concurrent Code Execution | Threads, executors, concurrent APIs, parallel streams | 13 |
| Using Java I/O API | I/O streams, NIO.2, serialization | 14 |
| Implementing Localization | Locales, resource bundles, formatting | 11 |

---

## 14 Chapters at a Glance

1. [Chapter 1 — Building Blocks](./chapters/chapter-01.md) — JDK setup, classes, primitives, var — **Exam focus:** defaults, `var`, literals, text blocks, GC eligibility
2. [Chapter 2 — Operators](./chapters/chapter-02.md) — Arithmetic, logical, bitwise operators — **Exam focus:** pre/post increment, compound assignment casts, `String` `+` ordering
3. [Chapter 3 — Making Decisions](./chapters/chapter-03.md) — if/else, switch expressions, loops — **Exam focus:** exhaustiveness, `yield`, pattern/`when`, labeled break/continue
4. [Chapter 4 — Core APIs](./chapters/chapter-04.md) — String, StringBuilder, arrays, Date-Time — **Exam focus:** immutability, `Period` vs `Duration`, zones, array/binary search rules
5. [Chapter 5 — Methods](./chapters/chapter-05.md) — Method design, access modifiers, overloading — **Exam focus:** overload resolution, varargs, `static`/instance access rules
6. [Chapter 6 — Class Design](./chapters/chapter-06.md) — Inheritance, abstract classes, polymorphism — **Exam focus:** override vs hide, covariant returns, `equals`/`hashCode`
7. [Chapter 7 — Beyond Classes](./chapters/chapter-07.md) — Interfaces, enums, records, sealed classes — **Exam focus:** records, sealed exhaustive switch, `instanceof` patterns, enums
8. [Chapter 8 — Lambdas & Functional Interfaces](./chapters/chapter-08.md) — Lambdas, method references, built-in FIs — **Exam focus:** SAM rules, capture, `andThen`/`compose`, method ref forms
9. [Chapter 9 — Collections & Generics](./chapters/chapter-09.md) — List, Set, Map, Deque, generics, Comparable — **Exam focus:** `SequencedCollection`, wildcards, `null` rules per implementation, factories
10. [Chapter 10 — Streams](./chapters/chapter-10.md) — Stream pipelines, Optional, collectors — **Exam focus:** lazy/single-use, short-circuit terminals, empty-stream match behavior, collectors
11. [Chapter 11 — Exceptions & Localization](./chapters/chapter-11.md) — Exception hierarchy, formatting, resource bundles — **Exam focus:** try-with-resources order, suppressed exceptions, `ResourceBundle` chain
12. [Chapter 12 — Modules](./chapters/chapter-12.md) — JPMS, module-info, services, jlink — **Exam focus:** `exports` vs `opens`, transitive requires, automatic/unnamed modules, services
13. [Chapter 13 — Concurrency](./chapters/chapter-13.md) — Threads, executors, atomic, locks, virtual threads — **Exam focus:** `start` vs `run`, virtual threads & pinning, `ConcurrentHashMap`, atomics vs `volatile`
14. [Chapter 14 — I/O](./chapters/chapter-14.md) — File I/O, NIO.2, serialization, streams — **Exam focus:** `Path` vs I/O, closing stream APIs, serialization contracts

---

## Quick Tips for Exam Day

:::tip[Exam Strategy]
- The exam has **50 questions** and you have **90 minutes**.
- Expect lots of **"What is the output?"** style questions — practice tracing code mentally.
- Watch for **trick questions**: uninitialized variables, unreachable code, missing `break` in switch.
- Java 21 features heavily tested: **records, sealed classes, pattern matching, virtual threads, switch expressions**.
:::

:::caution[Common Traps]
- `String` is **immutable** — methods return a new object, the original doesn't change.
- `==` compares **references** for objects, not values. Use `.equals()`.
- Checked exceptions **must** be handled or declared. Unchecked ones don't.
- Module system: `exports` ≠ `opens`. Know the difference.
:::

---

Good luck with your studies! 🎯 Start with [Chapter 1 →](./chapters/chapter-01.md)
