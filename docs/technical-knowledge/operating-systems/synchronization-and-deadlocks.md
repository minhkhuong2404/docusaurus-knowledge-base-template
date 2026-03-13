---
id: synchronization-and-deadlocks
title: Synchronization & Deadlocks
description: Race conditions, critical sections, mutexes, semaphores, monitors, classic synchronization problems, deadlock detection/prevention, and Java concurrency utilities.
tags:
  - operating-systems
  - synchronization
  - deadlocks
  - concurrency
  - java
  - multithreading
sidebar_position: 4
---

# Synchronization & Deadlocks

## The Critical Section Problem

A **critical section** is a code segment that accesses shared data and must not be executed by more than one process simultaneously.

### Requirements for a Valid Solution

1. **Mutual Exclusion**: Only one process can be in its critical section at a time.
2. **Progress**: If no process is in its CS and some want to enter, selection cannot be postponed indefinitely.
3. **Bounded Waiting**: A limit exists on how many times others can enter their CS before a waiting process is allowed in.

---

## Race Conditions

A **race condition** occurs when the outcome depends on the relative order of execution of operations.

```java
// Classic race condition: counter++
// Compiles to:
// LOAD R1, counter
// ADD  R1, 1
// STORE counter, R1
// If two threads interleave between LOAD and STORE → lost update
int counter = 0;
// Thread 1 and Thread 2 both do counter++ 1000 times
// Result is NOT guaranteed to be 2000!
```

---

## Hardware Synchronization Primitives

Modern CPUs provide atomic instructions:

### Test-And-Set

```
boolean TestAndSet(boolean *target) {
    boolean rv = *target;
    *target = true;
    return rv;  // atomically
}
```

### Compare-And-Swap (CAS)

```
int CAS(int *value, int expected, int new_value) {
    if (*value == expected) {
        *value = new_value;
        return expected;
    }
    return *value;
}
```

CAS is the foundation for lock-free data structures and Java's `AtomicInteger`, `AtomicReference`, etc.

---

## Mutex (Binary Semaphore)

A **mutex** (mutual exclusion lock) allows only one thread at a time.

```java
// Java ReentrantLock (explicit mutex)
Lock lock = new ReentrantLock();

lock.lock();
try {
    // critical section
} finally {
    lock.unlock();
}
```

**Spinlock**: Busy-waits (burns CPU) until lock is free. Good for very short critical sections on multiprocessors. Bad for long waits.

---

## Semaphore

A semaphore is a non-negative integer with two atomic operations:
- **wait() / P()**: Decrement; if result < 0, block.
- **signal() / V()**: Increment; if any threads blocked, wake one.

### Types

| | Binary Semaphore | Counting Semaphore |
|---|---|---|
| Values | 0 or 1 | 0 to N |
| Use | Mutual exclusion | Resource counting |

```java
// Java: Semaphore
Semaphore sem = new Semaphore(3);  // 3 permits (e.g., connection pool)

sem.acquire();  // wait
try {
    // use resource
} finally {
    sem.release();  // signal
}
```

---

## Monitors

A **monitor** is a high-level synchronization construct combining:
- A mutex (implicit)
- Condition variables for waiting

Java's `synchronized` keyword implements a monitor:

```java
public class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;

    public synchronized void put(T item) throws InterruptedException {
        while (queue.size() == capacity)
            wait();        // releases lock and waits
        queue.add(item);
        notifyAll();       // wake waiting consumers
    }

    public synchronized T take() throws InterruptedException {
        while (queue.isEmpty())
            wait();
        T item = queue.poll();
        notifyAll();       // wake waiting producers
        return item;
    }
}
```

### `wait()` vs `notify()` vs `notifyAll()`

- `wait()`: Releases lock and suspends thread. **Must be inside `synchronized` block.**
- `notify()`: Wakes one waiting thread (arbitrary).
- `notifyAll()`: Wakes all waiting threads. **Prefer this** to avoid missed wakeup bugs.

### Why `while` not `if` for condition check?

**Spurious wakeups** — threads can wake up without `notify()` being called. Always re-check condition in a `while` loop.

---

## Classic Synchronization Problems

### 1. Producer-Consumer (Bounded Buffer)

Three semaphores:
- `mutex = 1`: Protects buffer access.
- `full = 0`: Counts full slots.
- `empty = N`: Counts empty slots.

```
Producer:              Consumer:
wait(empty)            wait(full)
wait(mutex)            wait(mutex)
  add item               remove item
signal(mutex)          signal(mutex)
signal(full)           signal(empty)
```

### 2. Readers-Writers Problem

Multiple readers can read simultaneously; writers need exclusive access.

- **First variation**: Readers have priority (writers may starve).
- **Second variation**: Writers have priority (readers may starve).
- **Fair variation**: Use a queue to alternate.

```java
// Java ReadWriteLock
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// Reader:
rwLock.readLock().lock();
try { /* read */ } finally { rwLock.readLock().unlock(); }

// Writer:
rwLock.writeLock().lock();
try { /* write */ } finally { rwLock.writeLock().unlock(); }
```

### 3. Dining Philosophers

5 philosophers, 5 forks. Each needs 2 adjacent forks to eat.

**Naive solution deadlocks** (all pick up left fork, wait for right).

**Solutions**:
1. **Asymmetric**: One philosopher picks right fork first.
2. **Resource ordering**: Always pick lower-numbered fork first.
3. **Chandler's solution**: Allow at most 4 philosophers to sit (semaphore initialized to 4).
4. **Monitor with state**: Only allow picking up forks when both are available.

---

## Deadlock

A **deadlock** is a state where a set of processes are each waiting for an event that can only be triggered by another process in the set.

### Four Necessary Conditions (Coffman Conditions)

All four must hold simultaneously for deadlock:

1. **Mutual Exclusion**: Resources cannot be shared.
2. **Hold and Wait**: Process holds ≥1 resource while waiting for others.
3. **No Preemption**: Resources cannot be forcibly taken away.
4. **Circular Wait**: P1 waits for P2, P2 waits for P3, ..., Pn waits for P1.

### Resource Allocation Graph (RAG)

- **Request Edge**: Process → Resource (P wants R).
- **Assignment Edge**: Resource → Process (R held by P).
- **Deadlock**: Cycle in graph (with single-instance resources; for multi-instance, need further analysis).

---

## Deadlock Handling Strategies

### 1. Prevention

Eliminate one of the four conditions:

| Condition | Prevention Strategy |
|---|---|
| Mutual Exclusion | Make resources sharable (e.g., read-only files) |
| Hold and Wait | Request all resources at once; or release before new request |
| No Preemption | Preempt resources (practical for CPU, memory; not for printers) |
| Circular Wait | Impose total ordering on resources; always request in order |

### 2. Avoidance (Banker's Algorithm)

Allow allocation only if the system remains in a **safe state** (there exists a sequence in which all processes can finish).

```
Safe State: A sequence <P1, P2, ..., Pn> exists where each Pi's
needs can be satisfied by current resources + resources held
by all Pj (j < i).
```

**Banker's Algorithm** (Dijkstra):

```
Need[i][j] = Max[i][j] - Allocation[i][j]

Safety Algorithm:
1. Work = Available
2. Find Pi where Finish[i]=false AND Need[i] ≤ Work
3. Work += Allocation[i]; Finish[i] = true
4. If all Finish[i] = true → Safe State
```

### 3. Detection & Recovery

Let deadlocks occur; detect and recover.

**Detection**: Run resource allocation graph cycle detection periodically.

**Recovery Options**:
- **Process termination**: Kill all deadlocked processes; or kill one at a time (by cost: priority, runtime, resources held).
- **Resource preemption**: Take resources away; roll back process to safe state; may cause starvation (use aging to prevent).

### 4. Ignore (Ostrich Algorithm)

Pretend deadlocks don't happen. If deadlocks are rare and recovery is expensive, let the user restart. Used in many general-purpose OS (Linux, Windows). Pragmatic.

---

## Java Concurrency Utilities

### java.util.concurrent (JUC)

```java
// CountDownLatch: wait for N events
CountDownLatch latch = new CountDownLatch(3);
// Workers: latch.countDown();
// Main: latch.await();

// CyclicBarrier: all-or-nothing sync point
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("All arrived"));
// Each thread: barrier.await();

// Phaser: flexible multi-phase barrier
Phaser phaser = new Phaser(3);
phaser.arriveAndAwaitAdvance();

// BlockingQueue: thread-safe producer-consumer
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);
queue.put(task);    // blocks if full
queue.take();       // blocks if empty

// AtomicInteger (lock-free)
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();
counter.compareAndSet(expected, newValue);
```

### Volatile

`volatile` ensures **visibility** (write is flushed to main memory; read comes from main memory) and **ordering** (no instruction reordering across volatile access), but **not atomicity**.

```java
volatile boolean running = true;

// Thread 1:
running = false;  // guaranteed visible to Thread 2

// Thread 2:
while (running) { /* do work */ }
```

### Memory Model (JMM) — Happens-Before

The Java Memory Model defines **happens-before** relationships:
- `synchronized` block exit happens-before entry by another thread.
- `volatile` write happens-before a subsequent volatile read.
- `Thread.start()` happens-before first action in the started thread.
- `Thread.join()` — all actions in joined thread happen-before return of `join()`.

---

## Common Interview Questions

### Q1: What is the difference between a mutex and a semaphore?

A mutex (binary semaphore) is for mutual exclusion — only the thread that locked it can unlock it (ownership). A counting semaphore has no ownership; any thread can signal. Semaphores are used for signaling and resource counting; mutexes for protecting critical sections.

### Q2: What is a deadlock vs. livelock vs. starvation?

- **Deadlock**: Processes are blocked waiting for each other — no progress.
- **Livelock**: Processes keep changing state in response to each other but make no progress (e.g., two people in a corridor both stepping aside in the same direction).
- **Starvation**: A process is perpetually denied resources, though other processes make progress.

### Q3: How does `synchronized` work in Java internally?

`synchronized` uses a **monitor** (intrinsic lock). Each object has one. The JVM uses `monitorenter`/`monitorexit` bytecodes. Since Java 6, locks are optimized: biased locking (no CAS for uncontested), thin locks (CAS-based), and fat locks (OS mutex). JVM can also do **lock elision** and **lock coarsening**.

### Q4: What is the difference between `notify()` and `notifyAll()`?

`notify()` wakes one arbitrary waiting thread — if the wrong thread wakes up, it may wait again and deadlock. `notifyAll()` wakes all — safer but may cause a thundering herd. Prefer `notifyAll()` unless you have a specific reason and all waiting threads are identical.

### Q5: What is a reentrant lock and when is it needed?

A reentrant lock allows the same thread to acquire the lock it already holds (without deadlocking). Java's `synchronized` is reentrant. Needed when a synchronized method calls another synchronized method on the same object.

### Q6: How do you detect a deadlock in Java?

Use `ThreadMXBean`: `findDeadlockedThreads()` or `findMonitorDeadlockedThreads()`. In production, take a thread dump: `kill -3 <pid>` on Linux or `jstack <pid>`. Thread dumps show "Found one Java-level deadlock" sections.

### Q7: What is the ABA problem in lock-free programming?

CAS checks that value is still `A` before swapping. But if value changed A→B→A, CAS succeeds even though state changed. Solution: **stamped references** — include a version counter. In Java: `AtomicStampedReference` or `AtomicMarkableReference`.

### Q8: What is false sharing and how do you avoid it?

Multiple threads access different variables that happen to be in the same CPU cache line (typically 64 bytes). When one thread modifies its variable, the cache line is invalidated for all CPUs — causing unnecessary cache misses. Solution: pad variables to separate cache lines, or use `@Contended` annotation (Java 8+).

---

## Advanced Editorial Pass: Synchronization Strategy for Correctness at Scale

### Senior Engineering Focus
- Choose synchronization model by contention pattern and failure recovery needs.
- Minimize lock scope and cross-component lock ordering complexity.
- Prefer explicit back-pressure over unbounded waiting.

### Failure Modes to Anticipate
- Deadlocks that appear only under rare interleavings.
- Lock convoy effects creating throughput collapse.
- Priority inversion under mixed workload classes.

### Practical Heuristics
1. Define lock ordering policies and enforce in code review.
2. Instrument lock wait time and contention hotspots.
3. Use timeouts and cancellation paths for all blocking coordination.

### Compare Next
- [Processes & Threads](./processes-and-threads.md)
- [CPU Scheduling](./cpu-scheduling.md)
- [Interview Questions](./interview-questions.md)
