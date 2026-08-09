---
id: java-locks
title: "Java Locks & Synchronization"
slug: java-locks
description: Deep dive into Java locks and synchronization primitives — synchronized, volatile, ReentrantLock, ReadWriteLock, StampedLock, AQS, CountDownLatch, CyclicBarrier, Semaphore, Exchanger, and Phaser.
tags: [java, concurrency, locks, synchronization, countdown-latch, semaphore, cyclic-barrier, phaser]
---

import LockEscalationDiagram from '@site/src/components/LockEscalationDiagram';
import ConcurrencyCoordinationDiagram from '@site/src/components/ConcurrencyCoordinationDiagram';
import AQSArchitectureDiagram from '@site/src/components/AQSArchitectureDiagram';
import LockDecisionTreeDiagram from '@site/src/components/LockDecisionTreeDiagram';

# Java Locks & Synchronization

To coordinate thread execution and protect shared mutable state, Java provides synchronization primitives and highly flexible locking structures built on top of a common framework — AQS. Understanding these tools at a mechanical level is what separates engineers who "know the APIs" from engineers who can diagnose a deadlock in production at 2am.

This guide covers two conceptual groups:

- **Mutual-exclusion locks** (`synchronized`, `volatile`, `ReentrantLock`, `ReadWriteLock`, `StampedLock`) — control *which thread can run* in a given critical section.
- **Coordination utilities** (`CountDownLatch`, `CyclicBarrier`, `Semaphore`, `Exchanger`, `Phaser`) — control *when threads run relative to each other*, without necessarily protecting shared state.

Both groups ultimately build on the same foundation: **AQS**.

---

## Synchronization Primitives

### 👶 Beginner: Race Condition in Action

Before learning synchronization, you must *see* what breaks without it:

```java
public class RaceConditionDemo {
    private static int counter = 0;

    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> {
            for (int i = 0; i < 100_000; i++) {
                counter++;  // NOT atomic: read → increment → write (3 separate steps)
            }
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start(); t2.start();
        t1.join();  t2.join();

        // Expected: 200,000
        // Actual:   ~130,000–190,000 (varies every run!)
        System.out.println("Counter: " + counter);
    }
}
```

> **Why?** Both threads read `counter = 5`, both compute `5 + 1 = 6`, both write `6`. One increment is **lost**. This is the classic "lost update" — the root cause of most concurrency bugs in production.

---

### `synchronized`

Java's built-in monitor lock. Every Java object has an implicit monitor — `synchronized` gates entry to a block or method by acquiring that monitor.

```java
// Synchronized method — implicitly locks on `this`
public synchronized void increment() { count++; }

// Synchronized block — more granular; choose any Object as the lock
public void increment() {
    synchronized (this) { count++; }
}

// Static synchronized — locks on the Class object, not on `this`
public static synchronized void staticMethod() { }
```

#### 🧠 Senior Deep Dive: Lock Escalation (JDK 1.6+)

Naïve `synchronized` delegates to an OS-level mutex on every use — an expensive context switch. JDK 1.6 introduced **lock escalation** to minimize this cost through three progressive states stored in the object header (`mark word`):

1. **Biased Locking**: Assumes the block is accessed by only one thread. The JVM stamps the object header with the acquiring thread's ID. Subsequent lock/unlock by the *same* thread is essentially free — no CAS, no atomics, no OS call.
2. **Lightweight Locking**: A second thread requests the lock. Biased locking is revoked (costly — requires a safepoint). The new thread uses **CAS (Compare-And-Swap)** to spin-wait for the lock, burning CPU cycles rather than blocking.
3. **Heavyweight Locking**: If spinning fails beyond a threshold (default: ~10 iterations), the JVM escalates to a kernel-level mutex. The waiting thread is **descheduled** by the OS — no CPU wasted, but context-switch overhead is significant (~1–10μs).

<LockEscalationDiagram />

:::warning[JDK 15+ Note]
Biased locking was **deprecated in JDK 15** and **removed in JDK 21** because modern multi-threaded applications rarely exhibit single-thread access patterns, making the revocation overhead rarely worthwhile. If you're on JDK 21+, lock escalation starts directly at lightweight locking.
:::

---

### `volatile`

Ensures two things — **visibility** (a write in one thread is immediately visible to all other threads) and **ordering** (prevents CPU/JIT instruction reordering around the variable).

#### 👶 Beginner: The Whiteboard vs. Pocket Notebook

Each CPU core has its own cache (L1/L2). When a thread writes a variable, it first writes to *its core's cache*, not directly to main RAM. Other threads, reading from *their* caches, may see a stale value — a visibility problem.

`volatile` tells the JVM: "every read must come from main memory, every write must flush to main memory immediately." Think of it as replacing each thread's private pocket notebook with a shared public whiteboard.

```java
private volatile boolean running = true;

// Writer thread
running = false;   // flushes to main RAM; all cores see it immediately

// Reader thread
while (running) { /* do work */ }  // always reads from main RAM
```

#### 🧠 Senior Deep Dive: Memory Barriers and the MESI Protocol

At the hardware level, `volatile` translates to **memory barrier instructions** (e.g., `MFENCE` on x86, `DMB` on ARM) around reads and writes.

The underlying cache coherence mechanism is the **MESI protocol** — each cache line is in one of four states:

| State | Meaning |
|:---|:---|
| **M**odified | Line is dirty; only this core has it; main RAM is stale |
| **E**xclusive | Line is clean; only this core has it |
| **S**hared | Line is clean; multiple cores have copies |
| **I**nvalid | Line is stale; must be fetched before use |

When a volatile write occurs, the writing core broadcasts an **invalidation message** on the memory bus, forcing every other core's cached copy of that cache line to transition to `Invalid`. Their next read must then fetch from main RAM — which is the visibility guarantee `volatile` provides.

**False Sharing**: CPU caches operate on 64-byte chunks called **cache lines**. If two unrelated variables happen to reside on the same 64-byte line, a write to *either* one invalidates the entire line for all cores — even if the other variable never changed. This silently destroys cache efficiency for the innocent variable.

```java
// PROBLEM: counter1 and counter2 likely share a cache line
class Counters {
    volatile long counter1 = 0;
    volatile long counter2 = 0;   // Same cache line! Writing counter1 invalidates counter2's cache
}

// FIX: @Contended pads the field with extra bytes, forcing it onto its own cache line
// Requires JVM flag: -XX:-RestrictContended
class Counters {
    @jdk.internal.vm.annotation.Contended
    volatile long counter1 = 0;
    
    @jdk.internal.vm.annotation.Contended
    volatile long counter2 = 0;   // Now on its own cache line
}
```

:::danger[Interview Trap: Volatile Does NOT Guarantee Atomicity]
`volatile` ensures **visibility** and **ordering**, but NOT **atomicity**. `count++` is three steps: read, increment, write. Multiple threads can still read the same stale value simultaneously. Use `AtomicInteger` or `synchronized` for atomic compound operations.
:::

---

## ReentrantLock vs synchronized

| Feature | `synchronized` | `ReentrantLock` |
|---|---|---|
| **Acquisition** | Implicit (block entry) | Explicit (`lock.lock()`) |
| **Release** | Implicit (block exit) | Explicit (`lock.unlock()` in `finally`) |
| **Timed Try-Lock** | ❌ Impossible | ✅ `tryLock(time, unit)` |
| **Interruptible** | ❌ Impossible | ✅ `lockInterruptibly()` |
| **Fairness Policy** | ❌ Non-fair only | ✅ Fair or Non-fair (`new ReentrantLock(true)`) |
| **Multiple Conditions** | ❌ 1 condition per monitor | ✅ Multiple `Condition` objects via `newCondition()` |

---

## AQS (AbstractQueuedSynchronizer)

AQS is the **internal backbone** for `ReentrantLock`, `Semaphore`, `CountDownLatch`, `CyclicBarrier`, and `Phaser`.

<AQSArchitectureDiagram />

### How AQS Works
AQS maintains a single volatile integer `state` and a FIFO variant of a **CLH Queue**:
- **`ReentrantLock`**: `state` represents hold count ($0 = \text{unlocked}$, $>0 = \text{reentrant lock depth}$).
- **`Semaphore`**: `state` represents available permit count.
- **`CountDownLatch`**: `state` represents remaining latch count.

---

## Choosing the Right Lock — Decision Tree

<LockDecisionTreeDiagram />

---

## Interview Questions

### Q1. What is the difference between `synchronized` and `ReentrantLock` in Java?
> `synchronized` is a language keyword providing implicit, block-scoped monitor locking managed automatically by the JVM. `ReentrantLock` is an explicit API implementation of the `Lock` interface backed by AbstractQueuedSynchronizer (AQS). `ReentrantLock` offers advanced capabilities unavailable in `synchronized`, such as interruptible lock acquisition (`lockInterruptibly()`), non-blocking or timed attempts (`tryLock()`), configurable fairness policies, and multiple wait-set conditions (`newCondition()`).

### Q2. How does lock escalation work for `synchronized` monitors in the JVM?
> Prior to JDK 15, the JVM escalated monitor locks through three stages stored in the object header's Mark Word: (1) **Biased Locking** (stamped with the owning thread ID, eliminating CAS overhead for single-thread locks); (2) **Lightweight Locking** (uses CAS spin-locking when a second thread contends for the monitor); (3) **Heavyweight Locking** (escalates to an OS-level kernel mutex when CAS spinning exceeds a threshold, parking waiting threads).

### Q3. Why does `volatile` guarantee visibility and ordering, but NOT atomicity?
> `volatile` forces memory reads and writes to bypass CPU L1/L2 caches and interact directly with main memory via memory barriers (preventing compiler and CPU reordering). However, compound operations like `count++` involve three distinct steps: read, modify, write. If two threads execute `count++` concurrently, both can read the same volatile value before either writes back, resulting in a lost update. Atomicity requires CAS primitives (`AtomicInteger`) or mutual exclusion (`ReentrantLock`).

### Q4. What is the difference between `CountDownLatch` and `CyclicBarrier`?
> `CountDownLatch` is a **one-shot** coordination utility where one or more threads wait until a counter reaches zero via `countDown()`. It cannot be reset. `CyclicBarrier` is a **reusable** synchronization point where a fixed number of threads must meet at a barrier via `await()` before any thread is allowed to proceed. `CyclicBarrier` automatically resets after all threads arrive and supports an optional barrier action runnable.

---

## See Also

- [AbstractQueuedSynchronizer (AQS) Deep Dive](./java-aqs-internals.md)
- [Java Concurrent Collections](../interview-questions/java/concurrent-collection-interview.md)
- [Java Virtual Threads & Concurrency](./virtual-threads.md)