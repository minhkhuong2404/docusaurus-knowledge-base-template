---
id: java-interview-answers-part-4
title: Java Interview Q&A - Design Patterns & GC
description: Comprehensive answers to Java Software Design Patterns and Garbage Collection interview questions.
sidebar_position: 6
tags: [java, interview, design-patterns, solid, garbage-collection, jvm, answers]
---

# Java Interview Questions & Answers: Part 4

This guide covers software design patterns, SOLID principles, garbage collection mechanics, and JVM log diagnostics.

---

## Object-Oriented Design Principles and Patterns

### 1. What is the Decorator pattern? Give a real-world example.

The Decorator pattern dynamically attaches new behaviors or responsibilities to an object at runtime without altering its structural classes. It uses composition instead of inheritance to extend functionality.

#### JDK Example: Java I/O Streams
The `java.io` framework is built heavily on decorators:
```java
// FileReader: The Concrete Component (reads bytes)
FileReader fileReader = new FileReader("config.txt");

// BufferedReader: The Decorator (adds buffering capacity to the reader)
BufferedReader bufferedReader = new BufferedReader(fileReader);
```

#### Code Implementation Pattern
```java
interface Coffee { double getCost(); }
class SimpleCoffee implements Coffee { public double getCost() { return 2.0; } }

abstract class CoffeeDecorator implements Coffee {
    protected final Coffee decoratedCoffee;
    protected CoffeeDecorator(Coffee coffee) { this.decoratedCoffee = coffee; }
    public double getCost() { return decoratedCoffee.getCost(); }
}

class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }
    @Override
    public double getCost() { return super.getCost() + 0.5; } // Dynamically add cost
}
```

---

### 2. What is the difference between Decorator and Proxy Pattern?

Although both patterns share the identical structural design (implementing the interface of the wrapped class), their **intents** differ:

* **Decorator Pattern:** Extends the responsibilities of the object. The client directly instantiates the object and then dynamically wraps it in decorators to add functionality.
* **Proxy Pattern:** Controls or restricts access to the underlying object. The client typically interacts only with the proxy. The proxy manages the lifecycle of the real subject internally (e.g., lazy initialization, security check, logging, remote network invocation).

---

### 3. SOLID Design Principles Deep Dive

#### Liskov Substitution Principle (LSP)
Objects of a superclass should be replaceable with objects of its subclasses without breaking the correctness of the application.

```java
// VIOLATION: Square inherits Rectangle but violates the invariant that width != height
class Rectangle {
    protected int width, height;
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
}
class Square extends Rectangle {
    @Override
    public void setWidth(int w) { this.width = w; this.height = w; }
    @Override
    public void setHeight(int h) { this.width = h; this.height = h; }
}
// An assertion expecting setWidth to not alter height will fail when passing a Square.
```

**Correction:** Model them separately or extract a common interface/abstract class that does not enforce rectangle-specific dimensions.

---

## Garbage Collection (GC) and JVM Internals

### 4. How do JVM Garbage Collectors work?

Modern JVMs use **Generational Garbage Collection** based on the empirical observation that **most objects die young**. The heap is split into:

| Generation Partition | Sub-Region Spaces | Purpose & Allocation Model | Promotion & Tenuring Dynamics |
|---|---|---|---|
| **Young Generation** | **Eden Space** (allocations)<br />**S0 (From)** active survivor<br />**S1 (To)** empty survivor | Receives all newly instantiated objects via `new`. Low survival rate (~90% die in Eden). | Surviving objects copied between S0/S1; tenuring age increments with each Minor GC cycle. |
| **Old (Tenured) Generation** | Single continuous or region-based pool | Houses persistent domain entities, singleton services, long-lived caches. | Promoted after surviving 15 Minor GC cycles (`-XX:MaxTenuringThreshold=15`). Major/Mixed GC collects. |

#### The Minor GC Promotion Flow
1. **Allocation:** All new objects are allocated in the **Eden** space.
2. **First Minor GC:** When Eden is full, a Minor GC triggers. The JVM halts application threads (STW pause). Live objects in Eden are moved to **S0 (Survivor space)**, and their age is set to 1. Eden is cleared.
3. **Subsequent GC Cycles:** In the next Minor GC, live objects from Eden and S0 are copied to **S1**. S0 is cleared. The survivor spaces swap roles. The age of surviving objects increments.
4. **Promotion:** When an object survives the threshold age (configured by `-XX:MaxTenuringThreshold=15`), it is promoted to the **Old Generation**.

---

### 5. G1 GC vs. ZGC

Modern production applications choose collectors based on throughput vs. pause-time requirements:

| Aspect | G1 GC (Garbage First) | ZGC (Z Garbage Collector) |
|:-------|:----------------------|:--------------------------|
| **Default Since** | Java 9 | Available since Java 15+ |
| **Max Heap Support**| Tens of GBs | Up to 16TB |
| **STW Pause Target**| User configurable (~200ms default) | **Sub-millisecond** (independent of heap size) |
| **Strategy** | Divides heap into thousands of regions, collects highest-garbage regions first | Concurrent compaction using **Colored Pointers** and **Load Barriers** |
| **Best For** | Balanced throughput and latency workloads | Low-latency applications, large heaps (e.g. caching, microservices) |

---

### 6. Interpret this GC Log Snippet

Consider the following legacy GC log line:
```text
[GC [ParNew: 1512K->64K(1512K), 0.0635032 secs] 15604K->13569K(600345K), 0.0636056 secs] [Times: user=0.03 sys=0.00, real=0.06 secs]
```

#### Diagnostic Breakdown:
1. **Type of GC:** **Minor GC** (signaled by `[GC` prefix; if it were a Full GC, it would read `[Full GC`).
2. **Collector Used:** **ParNew** (Parallel Young Generation collector, running multi-threaded).
3. **Young Generation Memory Change:** `1512K->64K` — Young generation occupancy dropped from 1512KB to 64KB.
4. **Young Generation Max Capacity:** `(1512K)` — The total size allocated to the Young Generation is 1512KB.
5. **Total Heap Occupancy Change:** `15604K->13569K` — The total occupied memory of the entire heap (Young + Old) dropped from 15604KB to 13569KB.
6. **Total Heap Size:** `(600345K)` — The total size of the heap is 600,345KB (~600MB).
7. **Execution Time:** `0.0636056 secs` — The GC pause lasted 63.6 milliseconds.
8. **Time Metrics:**
   - `user=0.03`: CPU time spent in user-space threads.
   - `sys=0.00`: CPU time spent in system (kernel) threads.
   - `real=0.06`: Actual wall-clock time elapsed.