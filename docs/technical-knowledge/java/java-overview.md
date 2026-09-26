---
id: java-overview
title: Java Knowledge Base Overview
description: A comprehensive reference covering Java fundamentals, collections, concurrency, JVM internals, modern language features, and interview preparation.
tags: [java, overview]
sidebar_position: 1
---

# ☕ Java Knowledge Base

:::info[🚀 Career Hub Cho Fresher / Junior Đi Làm]
Dành riêng cho Intern, Fresher và Junior học Java thực chiến để ứng tuyển và đi làm tự tin trong môi trường doanh nghiệp: 
👉 **[Truy cập ngay: Career Hub](/hub)** — Lộ trình 6 giai đoạn, ngân hàng câu hỏi phỏng vấn trúng tủ, chiến trường code thực tế và checklist 60 ngày thử việc!
:::

## Topics Covered

| # | Topic | Description |
|---|-------|-------------|
| 1 | [Java Fundamentals](./java-fundamentals) | Syntax, types, control flow, and core APIs |
| 2 | [Object-Oriented Programming](./java-oop) | Classes, inheritance, polymorphism, encapsulation |
| 3 | [Collections Framework](./java-collections) | Lists, sets, maps, iteration, complexity trade-offs |
| 4 | [Functional Interfaces & Factory Pattern](./java-functional-interfaces-factory) | Supplier, Consumer, Function, Predicate, invokedynamic, and modern functional factory registries |
| 5 | [Concurrency & Utilities](./java-concurrency) | Concurrent utilities, thread pools, async patterns |
|   | └─ [Threads & Processes](./java-threads) | Thread lifecycle, coordination, deadlocks, livelocks |
|   | └─ [Locks & Synchronization](./java-locks) | Monitor locks, ReentrantLock, ReadWriteLock, StampedLock |
| 6 | [Java Memory Model](./java-jmm-memory-model) | Happens-Before relationship, StampedLock, and ThreadLocal internals |
| 7 | [JVM Internals](./java-jvm) | Class loading, memory areas, GC, JIT, tuning basics |
| 8 | [Diagnostics & Troubleshooting](./java-diagnostics-troubleshooting) | Production troubleshooting, thread contention, and memory analysis |
| 9 | [I/O and NIO](./java-io) | Streams, channels, buffers, file operations |
| 10 | [Modern Java Features](./java-new-features) | Lambdas, streams, records, sealed types, recent updates |
| 11 | [Interview Questions](./java-interview-questions) | Practical Q&A across core and advanced topics |

:::tip[Backend Engineering Tip]
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
- [Java Functional Interfaces & Factory Pattern](./java-functional-interfaces-factory.md)
- [Java Threads & Processes](./java-threads.md)
- [Java Locks & Synchronization](./java-locks.md)
- [Java Concurrency](./java-concurrency.md)
- [Java Memory Model](./java-jmm-memory-model.md)
- [JVM Internals](./java-jvm.md)
- [Diagnostics & Troubleshooting](./java-diagnostics-troubleshooting.md)

