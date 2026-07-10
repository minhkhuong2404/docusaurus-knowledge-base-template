---
id: java-jmm-memory-model
title: "Java Memory Model & Concurrency Guarantees"
slug: java-jmm-memory-model
description: Covers the Java Memory Model (JMM), Happens-Before relationships, instruction reordering, StampedLock optimistic locking, and ThreadLocal internals.
tags: [java, concurrency, memory-model, advanced]
---

import CPUCacheHierarchyDiagram from '@site/src/components/CPUCacheHierarchyDiagram';

# Java Memory Model & Concurrency Guarantees

To write correct, high-performance concurrent code in Java, developers must understand how memory is shared, modified, and synchronized across threads. The **Java Memory Model (JMM)** defines these specifications.

---

## 1. The Java Memory Model (JMM)

The JMM defines how the Java Virtual Machine interacts with computer memory (CPUs, caches, and main RAM). In a multi-core processor system, threads run on different CPUs, each with its own local cache registers.

<CPUCacheHierarchyDiagram />

Without synchronization, changes made by Thread 1 might only live in its CPU cache and never be flushed to main memory, leaving Thread 2 with stale values.

### Visibility vs. Ordering vs. Atomicity

- **Visibility:** When a thread modifies a variable, do other threads see the updated value? (Solved by `volatile`, `synchronized`, and `Lock`).
- **Ordering:** Can instruction execution sequence change? (Prevented by Happens-Before rules).
- **Atomicity:** Can operations execute as a single, uninterrupted unit? (Solved by `synchronized` and `java.util.concurrent.atomic`).

---

## 2. The Happens-Before Relationship

The core of the JMM is the **Happens-Before** contract. It defines a partial ordering of memory actions. If action $A$ *happens-before* action $B$, the memory changes made by $A$ are guaranteed to be visible to the thread performing $B$, and the JVM cannot reorder them.

### Key Rules of Happens-Before

1. **Program Order Rule:** Within a single thread, each action happens-before any subsequent action in source code order.
2. **Monitor Lock Rule:** An unlock on a monitor (releasing `synchronized` or a Lock) happens-before every subsequent lock acquisition on that same monitor.
3. **Volatile Variable Rule:** A write to a `volatile` field happens-before every subsequent read of that same field.
4. **Thread Start Rule:** A call to `Thread.start()` happens-before any actions inside the started thread.
5. **Thread Join Rule:** All actions inside a thread happen-before any other thread successfully returns from a `join()` on that thread.
6. **Transitivity:** If $A$ happens-before $B$, and $B$ happens-before $C$, then $A$ happens-before $C$.

> [!IMPORTANT]
> Without a Happens-Before relationship between a write to a variable and a subsequent read, the JVM (compiler and hardware) is free to optimize, cache, and reorder, resulting in undefined behavior.

---

## 3. Instruction Reordering

To maximize performance, compilers (JIT) and hardware (CPU pipelines) reorder instructions as long as the end result in a single-threaded context remains identical (preserving **as-if-serial** semantics).

### Reordering Example
```java
// Thread 1
a = 1;      // (1)
x = b;      // (2)

// Thread 2
b = 1;      // (3)
y = a;      // (4)
```
If we run this concurrently without synchronization, it is physically possible to get $x = 0$ and $y = 0$. The compiler or CPU can reorder the execution:
- Thread 1 runs (2) then (1)
- Thread 2 runs (4) then (3)

### Memory Barriers (Fences)
The JVM inserts CPU-level instructions called **Memory Barriers** (e.g., LoadLoad, LoadStore, StoreStore, StoreLoad) when accessing volatile fields to prevent CPU reordering across the barrier boundary.

---

## 4. StampedLock (Optimistic Reading)

Introduced in Java 8, `StampedLock` is an advanced locking utility that offers three locking modes. It can dramatically outperform `ReentrantReadWriteLock` under high-read, low-write workloads.

### Three Modes:
1. **Writing (Exclusive):** Similar to a normal write lock.
2. **Reading (Non-exclusive):** Similar to a normal read lock.
3. **Optimistic Reading:** A non-blocking, lock-free read mode.

### How Optimistic Reading Works
Instead of acquiring a read lock (which blocks writers), an optimistic read gets a numeric "stamp." You read the fields, and then validate if a write lock was acquired in the meantime. If the stamp is invalid, you fall back to a blocking read lock.

```java
import java.util.concurrent.locks.StampedLock;

public class Point {
    private double x, y;
    private final StampedLock sl = new StampedLock();

    public void move(double deltaX, double deltaY) {
        long stamp = sl.writeLock(); // Blocking exclusive write lock
        try {
            x += deltaX;
            y += deltaY;
        } finally {
            sl.unlockWrite(stamp);
        }
    }

    public double distanceFromOrigin() {
        long stamp = sl.tryOptimisticRead(); // Non-blocking!
        double currentX = x;
        double currentY = y;

        if (!sl.validate(stamp)) { // Check if a write occurred
            stamp = sl.readLock(); // Fallback: acquire blocking read lock
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }
}
```

---

## 5. ThreadLocal Map Internals & Leaks

`ThreadLocal` allows you to bind a variable's value to the current thread.

### Internal Architecture
- Every `Thread` instance contains a package-private field `threadLocals` of type `ThreadLocal.ThreadLocalMap`.
- The key of the map is a **`WeakReference<ThreadLocal<?>>`**.
- The value of the map is the actual object stored.

```
Thread
  └─ ThreadLocalMap
       ├─ Key: WeakReference<ThreadLocal> ──► (Garbage Collected)
       └─ Value: Strongly Reference ────────► Value Object (Stuck in memory!)
```

### The Memory Leak Scenario
1. In web containers (e.g., Tomcat, Spring Boot), threads are pooled and reused for many HTTP requests.
2. A request sets a value in a `ThreadLocal`.
3. After the request completes, the `ThreadLocal` reference is garbage collected because the local stack frame exits.
4. However, the thread is returned to the pool and remains alive. The map key becomes `null` (since it was a WeakReference), but the value remains strongly reachable via the `Thread` instance.
5. This value remains in memory forever, leading to a silent **memory leak**.

### Mitigation
Always clean up `ThreadLocal` values in a `finally` block before returning threads to a pool:

```java
private static final ThreadLocal<UserContext> context = new ThreadLocal<>();

public void handleRequest() {
    try {
        context.set(new UserContext("user_123"));
        process();
    } finally {
        context.remove(); // CRITICAL: prevents memory leak
    }
}
```
