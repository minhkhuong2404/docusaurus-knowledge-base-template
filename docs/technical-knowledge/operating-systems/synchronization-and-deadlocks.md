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

import OsSyncDeadlockDiagram from '@site/src/components/OsSyncDeadlockDiagram';

# Synchronization & Deadlocks

<OsSyncDeadlockDiagram />

---

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

```c
boolean TestAndSet(boolean *target) {
    boolean rv = *target;
    *target = true;
    return rv;  // atomically executed by CPU bus locking
}
```

### Compare-And-Swap (CAS)

```c
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
2. **Hold and Wait**: Process holds $\ge 1$ resource while waiting for others.
3. **No Preemption**: Resources cannot be forcibly taken away.
4. **Circular Wait**: P1 waits for P2, P2 waits for P3, ..., Pn waits for P1.

### Resource Allocation Graph (RAG)

- **Request Edge**: Process $\to$ Resource (P wants R).
- **Assignment Edge**: Resource $\to$ Process (R held by P).
- **Deadlock**: Cycle in graph (with single-instance resources; for multi-instance, need further analysis).

---

## Deadlock Handling Strategies

### 1. Prevention

Eliminate one of the four conditions:

| Condition | Prevention Strategy |
|---|---|
| Mutual Exclusion | Make resources sharable (e.g., read-only files). |
| Hold and Wait | Request all resources at once; or release before new request. |
| No Preemption | Preempt resources (practical for CPU, memory; not for write streams). |
| Circular Wait | Impose total ordering on resources; always request in order. |

### 2. Avoidance (Banker's Algorithm)

Allow allocation only if the system remains in a **safe state** (there exists a sequence in which all processes can finish).

```
Safe State: A sequence <P1, P2, ..., Pn> exists where each Pi's
needs can be satisfied by current resources + resources held
by all Pj (j < i).
```

### 3. Detection & Recovery

Let deadlocks occur; detect and recover via periodic cycle detection on resource graphs.

---

## Java Concurrency Utilities (JUC)

```java
// CountDownLatch: wait for N events
CountDownLatch latch = new CountDownLatch(3);

// CyclicBarrier: all-or-nothing sync point
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("All arrived"));

// BlockingQueue: thread-safe producer-consumer
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);

// AtomicInteger (lock-free)
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();
```

---

## Interview Questions

### Q1. What is the fundamental difference between a mutex and a semaphore?
> A mutex (mutual exclusion lock) enforces strict ownership — only the thread that acquired the mutex can release it. It is used to protect a critical section. A counting semaphore has no ownership concept; any thread can release a permit (`signal()`). Semaphores are used for signaling and managing bounded resource pools (e.g., connection pools).

### Q2. What is the difference between a deadlock, a livelock, and starvation?
> **Deadlock**: Processes are permanently blocked waiting for resources held by each other; zero CPU is consumed and no progress is made. **Livelock**: Processes actively change state in response to each other (consuming CPU) but fail to make meaningful progress (e.g., two people in a hallway stepping side-to-side in sync). **Starvation**: A runnable process is perpetually denied access to a resource because higher-priority processes keep preempting it.

### Q3. How does `synchronized` work internally in the HotSpot JVM?
> `synchronized` relies on object monitor locks (`markWord` header in Java objects). The JVM uses `monitorenter` and `monitorexit` bytecode instructions. Since Java 6, lock acquisition is optimized through three states: (1) **Biased Locking** (zero CAS overhead for single-threaded access); (2) **Lightweight Locking** (CAS spin-locking for low contention); (3) **Heavyweight Locking** (inflates to OS mutex/futex when contention occurs).

### Q4. What is the difference between `notify()` and `notifyAll()` in Java?
> `notify()` wakes up a single arbitrary thread waiting on the object's monitor. If the woken thread cannot proceed (e.g., condition evaluates to false) and sleeps again, the signal is lost, causing a deadlock. `notifyAll()` wakes up all waiting threads. Although `notifyAll()` incurs a thundering herd context-switch overhead, it guarantees that any thread eligible to proceed will be woken.

### Q5. What is the ABA problem in lock-free CAS operations and how is it solved?
> The ABA problem occurs in lock-free algorithms when a thread reads value `A`, gets preempted, another thread changes `A -> B -> A`, and the first thread's `compareAndSet(A, C)` succeeds because the memory location reads `A` again, ignoring the intermediate state mutation. Solution: attach a version stamp or transaction sequence counter to the reference. In Java, use `AtomicStampedReference` or `AtomicMarkableReference`.

---

## See Also

- [Processes & Threads](./processes-and-threads.md)
- [CPU Scheduling](./cpu-scheduling.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
