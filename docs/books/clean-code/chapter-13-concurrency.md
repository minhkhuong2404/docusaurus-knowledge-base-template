---
sidebar_position: 14
title: "Chapter 13: Concurrency"
description: The challenges of concurrent programming and principles for writing safe, clean concurrent code.
---

# Chapter 13: Concurrency

## Why Concurrency Is Hard

Concurrency is one of the most difficult areas of software engineering. It introduces a class of bugs that are timing-dependent, non-deterministic, and extremely hard to reproduce. This chapter explains the fundamental challenges and gives principles for writing cleaner concurrent code.

---

## Why Concurrency?

Concurrency is about **decoupling what gets done from when it gets done**. There are two main motivations:

### 1. Performance
- A single-threaded web server handles one request at a time. Concurrency lets it handle many.
- Long I/O operations (database calls, network requests, file reads) block a thread. Other threads can do useful work while one is blocked.

### 2. Structure
- Some problems are naturally modeled as multiple independent entities (e.g., a chat server where each user connection is its own entity).

---

## Myths and Misconceptions

Martin lists several common misconceptions:

| Myth | Reality |
|------|---------|
| Concurrency always improves performance | Only if there's meaningful wait time to overlap, or multiple processors available |
| Design doesn't change with threads | Concurrent design is fundamentally different from single-threaded design |
| It's not a big deal if the container handles threads | You must understand what your container does — Spring/Tomcat threads can cause subtle bugs |

---

## Concurrency Defense Principles

### Single Responsibility Principle for Threads

Concurrent code is complex enough on its own. **Keep concurrency code separate from other code.**

```java
// Bad — business logic mixed with thread management
public class OrderProcessor implements Runnable {
    private final List<Order> orders;

    public void run() {
        for (Order order : orders) {
            // business logic entangled with threading
            synchronized (this) {
                process(order); // is this thread-safe?
            }
        }
    }
}

// Better — separate concerns
public class OrderProcessor {
    public void process(Order order) { /* pure business logic */ }
}

public class OrderProcessorThread implements Runnable {
    private final OrderProcessor processor;
    // threading concerns live here
}
```

### Limit the Scope of Shared Data

The more places that access shared data, the more likely a race condition. **Minimize the number of critical sections** and the amount of data they share.

```java
// Bad — shared mutable state accessed from many places
public class Counter {
    public int count = 0; // public mutable state — dangerous
}

// Better — encapsulate and control access
public class Counter {
    private int count = 0;

    public synchronized void increment() { count++; }
    public synchronized int getCount() { return count; }
}

// Best in Java — use atomic types
import java.util.concurrent.atomic.AtomicInteger;

public class Counter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() { count.incrementAndGet(); }
    public int getCount() { return count.get(); }
}
```

### Use Copies of Data

If you can copy data rather than sharing it, you eliminate the need for synchronization entirely:

```java
// Each thread works on its own copy — no shared state, no locking needed
List<Order> myOrders = new ArrayList<>(sharedOrders); // defensive copy
for (Order order : myOrders) {
    process(order);
}
```

### Threads Should Be as Independent as Possible

Write threads that operate on their **own local data** and don't share state with other threads. Stateless objects are inherently thread-safe.

```java
// Stateless service — thread-safe by design
@Service
public class TaxCalculator {
    public BigDecimal calculate(Order order) {
        // uses only the method argument — no shared state
        return order.getSubtotal().multiply(TAX_RATE);
    }
}
```

---

## Know Your Library

Java 5+ introduced `java.util.concurrent` with powerful tools. Use them:

| Tool | Use Case |
|------|----------|
| `ReentrantLock` | More flexible than `synchronized` |
| `Semaphore` | Count-based locking |
| `CountDownLatch` | Wait for multiple threads to complete |
| `ConcurrentHashMap` | Thread-safe map, better than `Collections.synchronizedMap` |
| `AtomicInteger`, `AtomicLong` | Lock-free atomic operations |
| `ExecutorService` | Thread pool management |
| `CopyOnWriteArrayList` | Thread-safe list for read-heavy workloads |

```java
// Don't manage threads manually
Thread thread = new Thread(() -> process(task));
thread.start();

// Use ExecutorService
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(() -> process(task));
executor.shutdown();
```

---

## Know Your Execution Models

### Producer-Consumer

One or more producer threads add to a queue; one or more consumer threads take from it. The queue is the boundary:

```java
BlockingQueue<Order> queue = new LinkedBlockingQueue<>(100);

// Producer
queue.put(newOrder); // blocks if queue is full

// Consumer
Order order = queue.take(); // blocks if queue is empty
process(order);
```

### Readers-Writers

Multiple readers can access shared data simultaneously; writers need exclusive access:

```java
ReadWriteLock lock = new ReentrantReadWriteLock();

// Reader
lock.readLock().lock();
try { return data.get(key); }
finally { lock.readLock().unlock(); }

// Writer
lock.writeLock().lock();
try { data.put(key, value); }
finally { lock.writeLock().unlock(); }
```

### Dining Philosophers

A classic illustration of **deadlock**: multiple threads competing for multiple shared resources, each waiting for a resource held by another. Always acquire locks in a **consistent order** to prevent deadlock.

---

## Beware Dependencies Between Synchronized Methods

Multiple `synchronized` methods on the same shared class can create subtle bugs:

```java
// Each method is synchronized individually — but together they have a race condition
if (!stack.isEmpty())      // thread A checks
    stack.pop();           // thread B pops between the check and this line!

// Better — synchronize the client code
synchronized (stack) {
    if (!stack.isEmpty())
        stack.pop();
}
```

Prefer **server-side locking**: the class itself should be responsible for thread safety, not the callers.

---

## Testing Concurrent Code

Concurrent bugs are notoriously hard to test because they're timing-dependent.

Strategies:
1. **Write tests that expose potential failures** — run them many times
2. **Make thread-based code pluggable** — run with 1 thread, then many
3. **Run on different platforms** — thread scheduling varies by OS and JVM
4. **Instrument code to force failures** — use `Thread.yield()` or `Thread.sleep()` at critical points to trigger race conditions during testing
5. **Use stress testing tools** — tools like Java PathFinder (JPF) can explore thread interleavings

---

## Key Takeaways

- Concurrency is hard — treat it with respect
- **Separate concurrent code** from business logic (SRP)
- **Minimize shared mutable state** — immutable and stateless objects are thread-safe by definition
- Use **copies of data** to avoid sharing altogether
- Know and use **`java.util.concurrent`** instead of rolling your own
- Understand the common patterns: Producer-Consumer, Readers-Writers, Dining Philosophers
- Avoid dependencies between synchronized methods on a shared object
- Testing concurrent code requires deliberate effort — run tests many times, on multiple platforms
