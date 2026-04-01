---
id: java-threads-and-locks
title: "Java Threads, Locks, and Thread Safety"
slug: java-threads-and-locks
description: Practical guide to Java threads, synchronization, lock types, and writing thread-safe code in multithreaded environments.
tags: [java, concurrency, threads, locks, multithreading]
---

# Java Threads, Locks, and Thread Safety

This page focuses on the core pieces you use daily in multithreaded Java systems: thread lifecycle, race conditions, lock selection, and safe shared-state design.

## 1. What Problems Locks Solve

When two or more threads read and write shared mutable state, you can get:

- Race conditions
- Lost updates
- Visibility bugs
- Data corruption

Locking and synchronization create a critical section so only safe interleavings are possible.

## 2. Thread Lifecycle in Practice

Key states you should reason about:

- NEW
- RUNNABLE
- BLOCKED
- WAITING or TIMED_WAITING
- TERMINATED

In production debugging, most incidents come from too many threads in BLOCKED or WAITING due to lock contention, deadlock, or missed signals.

## 3. Choosing a Locking Primitive

### synchronized

Use when you want simple mutual exclusion and clear boundaries.

```java
public synchronized void increment() {
    count++;
}
```

### ReentrantLock

Use when you need timeout, interruptible acquisition, fairness configuration, or multiple conditions.

```java
private final ReentrantLock lock = new ReentrantLock();

public void update() {
    lock.lock();
    try {
        sharedState++;
    } finally {
        lock.unlock();
    }
}
```

### ReadWriteLock

Use when reads are much more frequent than writes.

### StampedLock

Use carefully for very read-heavy workloads where optimistic reads are beneficial.

## 4. Thread Safety Patterns

- Prefer immutable objects for shared data.
- Keep lock scope small and predictable.
- Never call remote I/O while holding a lock.
- Use one lock per invariant, not one lock per field.
- Always unlock in a finally block.

## 5. Deadlock Prevention Rules

- Acquire locks in a global, fixed order.
- Use lock timeouts where appropriate.
- Avoid nested locks unless design requires them.
- Keep critical sections short.

## 6. Common Interview and Production Pitfalls

- volatile does not make compound actions atomic.
- synchronized on mutable or externally visible objects can be dangerous.
- Blocking queue operations can appear as CPU idle while throughput drops.
- Thread pools with unbounded queues can hide overload until latency explodes.

## 7. Quick Checklist

- Shared mutable state identified
- Synchronization strategy documented
- Lock ordering defined
- Timeouts and interruption handled
- Metrics for queue depth, blocked threads, and task latency in place
