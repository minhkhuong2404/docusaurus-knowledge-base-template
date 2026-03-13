---
id: java-overview
title: Java Knowledge Base Overview
description: A comprehensive reference covering Java fundamentals, collections, concurrency, JVM internals, modern language features, and interview preparation.
tags: [java, overview]
sidebar_position: 1
---

# ☕ Java Knowledge Base

A structured guide covering Java from core language foundations to JVM internals and modern features, with interview-oriented guidance.

## Topics Covered

| # | Topic | Description |
|---|-------|-------------|
| 1 | [Java Fundamentals](./java-fundamentals) | Syntax, types, control flow, and core APIs |
| 2 | [Object-Oriented Programming](./java-oop) | Classes, inheritance, polymorphism, encapsulation |
| 3 | [Collections Framework](./java-collections) | Lists, sets, maps, iteration, complexity trade-offs |
| 4 | [Concurrency](./java-concurrency) | Threads, executors, locks, memory model, async patterns |
| 5 | [JVM Internals](./java-jvm) | Class loading, memory areas, GC, JIT, tuning basics |
| 6 | [I/O and NIO](./java-io) | Streams, channels, buffers, file operations |
| 7 | [Modern Java Features](./java-new-features) | Lambdas, streams, records, sealed types, recent updates |
| 8 | [Interview Questions](./java-interview-questions) | Practical Q&A across core and advanced topics |

:::tip Backend Engineering Tip
Use this section as the foundation before diving into Spring, Kafka, and system design topics.
:::

---

## Advanced Editorial Pass: Java as a Production Engineering Platform

### Senior Engineering Focus
- Connect language-level features with runtime behavior and operational impact.
- Balance readability, correctness, and performance in API and service code.
- Treat concurrency and memory behavior as design concerns, not implementation details.

### Failure Modes to Anticipate
- Overusing abstractions without understanding allocation and execution cost.
- Concurrency fixes that hide race conditions instead of removing them.
- JVM tuning without workload-level evidence.

### Practical Heuristics
1. Start with correct, clear code, then optimize with measured evidence.
2. Validate concurrency assumptions with stress tests and production-like load.
3. Document JVM defaults, overrides, and the reason for each tuning change.

### Compare Next
- [Java Fundamentals](./java-fundamentals.md)
- [Java Concurrency](./java-concurrency.md)
- [JVM Internals](./java-jvm.md)
