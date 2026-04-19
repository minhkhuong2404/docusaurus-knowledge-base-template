---
id: chapter-13
title: "Chapter 13 — Concurrency"
sidebar_label: "Ch 13 · Concurrency"
description: "Full coverage of Java concurrency: platform threads, virtual threads (Java 21), Runnable vs Callable, ExecutorService, Future, atomic classes, synchronized, ReentrantLock, volatile, concurrent collections, deadlock, and parallel streams — with real-world thread-safety traps."
tags:
  - concurrency
  - threads
  - virtual-threads
  - executor-service
  - future
  - atomic
  - synchronized
  - reentrant-lock
  - volatile
  - deadlock
  - java-21
---

# Chapter 13 — Concurrency

<span class="chapter-badge">Exam Domain: Managing Concurrent Code Execution</span>

> **Key Topics:** Platform threads, virtual threads, `Runnable`, `Callable`, `ExecutorService`, `Future`, atomic classes, locks, concurrent collections, parallel streams.

---

## 🟦 New Learner: Threads and Executors

### Creating Threads

```java
// Option 1: Extend Thread
class MyThread extends Thread {
    @Override
    public void run() { System.out.println("Running in: " + Thread.currentThread().getName()); }
}
new MyThread().start(); // start() — NOT run()!

// Option 2: Implement Runnable (preferred)
Runnable task = () -> System.out.println("Running!");
Thread t = new Thread(task);
t.start();

// Option 3: Virtual Thread (Java 21)
Thread vt = Thread.ofVirtual().start(() -> System.out.println("Virtual!"));
```

:::caution[`start()` vs `run()`]
Calling `run()` directly executes in the **current thread** — no new thread is created!  
Always call `start()` to create a new thread.
:::

---

### Thread Lifecycle

```
NEW → RUNNABLE → [BLOCKED/WAITING/TIMED_WAITING] → TERMINATED
```

```java
Thread t = new Thread(() -> { ... });
t.getState();    // NEW
t.start();
t.getState();    // RUNNABLE

// Wait for thread to finish
t.join();        // calling thread blocks until t terminates
t.join(1000);    // wait at most 1 second
```

---

### ExecutorService

`ExecutorService` manages a thread pool — preferred over raw threads:

```java
ExecutorService executor = Executors.newFixedThreadPool(4);

// Submit Runnable (no return value)
executor.execute(() -> System.out.println("Task 1"));

// Submit Callable (returns a value)
Future<Integer> future = executor.submit(() -> {
    Thread.sleep(1000);
    return 42;
});

// Get result (blocks until ready)
Integer result = future.get();         // waits indefinitely
Integer result2 = future.get(2, TimeUnit.SECONDS); // with timeout

// Shutdown
executor.shutdown();            // no new tasks; waits for current to finish
executor.shutdownNow();         // tries to stop all running tasks
executor.awaitTermination(30, TimeUnit.SECONDS);
```

---

### Types of Executors

| Factory Method | Description |
|----------------|-------------|
| `newSingleThreadExecutor()` | Single thread, tasks queued |
| `newFixedThreadPool(n)` | Fixed number of threads |
| `newCachedThreadPool()` | Grows/shrinks as needed |
| `newScheduledThreadPool(n)` | For scheduled/recurring tasks |
| `newVirtualThreadPerTaskExecutor()` | One virtual thread per task (Java 21) |

```java
// Scheduled tasks
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);
scheduled.schedule(() -> System.out.println("Delayed!"), 3, TimeUnit.SECONDS);
scheduled.scheduleAtFixedRate(() -> System.out.println("Repeating"), 0, 1, TimeUnit.SECONDS);
```

---

### Virtual Threads (Java 21)

Virtual threads are **lightweight** threads managed by the JVM, not the OS:

```java
// Create virtual threads
Thread vt = Thread.ofVirtual().start(runnable);
Thread.startVirtualThread(runnable); // shortcut

// Virtual thread executor (best practice for I/O-bound tasks)
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> doIoWork());
    }
} // auto-closes and waits
```

| | Platform Thread | Virtual Thread |
|--|---------------|----------------|
| Managed by | OS | JVM |
| Cost per thread | ~1MB stack | ~few KB |
| Scale | Thousands | Millions |
| Best for | CPU-bound | I/O-bound |

---

### Thread Safety Problems

**Race Condition** — Two threads access shared data simultaneously with incorrect results:

```java
class Counter {
    int count = 0;
    void increment() { count++; } // NOT thread-safe: read-modify-write
}
// Two threads running increment() 1000 times may not give 2000!
```

---

### Atomic Classes

Atomic classes provide **lock-free thread-safe** operations:

```java
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();          // atomic ++
counter.getAndIncrement();          // atomic (returns old value) then ++
counter.addAndGet(5);               // atomic += 5
counter.compareAndSet(10, 20);      // if value==10, set to 20

AtomicBoolean flag = new AtomicBoolean(false);
AtomicLong longVal = new AtomicLong(0L);
AtomicReference<String> ref = new AtomicReference<>("initial");
```

---

### Synchronization

```java
class SafeCounter {
    private int count = 0;

    // Option 1: synchronized method
    public synchronized void increment() { count++; }

    // Option 2: synchronized block (finer-grained)
    public void incrementBlock() {
        synchronized (this) { count++; }
    }
}
```

---

### Locks

`ReentrantLock` gives more control than `synchronized`:

```java
ReentrantLock lock = new ReentrantLock();

lock.lock();
try {
    // critical section
} finally {
    lock.unlock(); // ALWAYS unlock in finally!
}

// Try to acquire without blocking
if (lock.tryLock()) {
    try { ... }
    finally { lock.unlock(); }
}
```

---

### Concurrent Collections

| Type | Thread-Safe Alternative |
|------|------------------------|
| `ArrayList` | `CopyOnWriteArrayList` |
| `HashMap` | `ConcurrentHashMap` |
| `LinkedList` | `ConcurrentLinkedQueue` |
| `TreeMap` | `ConcurrentSkipListMap` |
| `PriorityQueue` | `PriorityBlockingQueue` |

```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.put("a", 1);
map.computeIfAbsent("b", k -> k.length()); // thread-safe compute

CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
// Iteration never throws ConcurrentModificationException
```

---

## 🟣 Senior Deep Dive

### `volatile` Keyword

`volatile` ensures **visibility** — reads always see the latest written value from any thread:

```java
class FlagHolder {
    volatile boolean running = true; // without volatile, other threads may see stale value

    void stop() { running = false; }
    void run() { while (running) { /* process */ } }
}
```

`volatile` does NOT provide atomicity. For compound operations (check-then-act, read-modify-write), use `synchronized` or atomics.

### Memory Consistency and Happens-Before

Java Memory Model defines **happens-before** relationships:
- Actions in a thread happen-before `thread.join()`
- `lock.unlock()` happens-before subsequent `lock.lock()`
- `volatile` write happens-before subsequent reads of same variable
- `Thread.start()` happens-before any action in the started thread

### `CompletableFuture` (Java 8+)

```java
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchData())           // run async
    .thenApply(data -> transform(data))       // chain non-blocking
    .thenCompose(result -> fetchMore(result)) // async chain
    .exceptionally(ex -> "Error: " + ex.getMessage()); // handle errors

cf.thenAccept(System.out::println);  // consume when done
String result = cf.join();           // block and get result
```

### Deadlock

```java
// Classic deadlock pattern
Object lock1 = new Object(), lock2 = new Object();

Thread t1 = new Thread(() -> {
    synchronized (lock1) {
        synchronized (lock2) { /* work */ }
    }
});
Thread t2 = new Thread(() -> {
    synchronized (lock2) {       // reversed order!
        synchronized (lock1) { /* work */ }
    }
});
// t1 and t2 can deadlock — always acquire locks in the SAME order
```

### `CyclicBarrier` and `CountDownLatch`

```java
// CountDownLatch — wait for N events
CountDownLatch latch = new CountDownLatch(3);
// 3 threads each call latch.countDown() when done
// Main thread:
latch.await(); // blocks until count reaches 0

// CyclicBarrier — wait for N threads to reach a point, then reset
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("All ready!"));
// Each thread calls barrier.await(); when all 3 have called it, they all proceed
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| `start()` vs `run()` | `start()` creates new thread; `run()` runs in current thread |
| `Callable` vs `Runnable` | `Callable` returns a value and can throw checked exceptions |
| `Future.get()` | Blocks until result available; wraps task exception in `ExecutionException` |
| `shutdown()` | No new tasks; waits for running ones to finish |
| `shutdownNow()` | Attempts to interrupt running tasks; returns pending task list |
| `AtomicInteger` | Lock-free thread-safe integer operations |
| `synchronized` | Provides mutual exclusion + visibility |
| `volatile` | Visibility only — NOT atomicity; no compound-action safety |
| `ConcurrentHashMap` | Thread-safe, segment-locked, no null keys or values |
| Virtual thread | Lightweight, best for blocking I/O; `Thread.ofVirtual()` |
| Deadlock | Two threads each hold a lock the other needs — circular wait |
| `ReentrantLock` | Must unlock in `finally`; supports `tryLock()` and `lockInterruptibly()` |
| `CountDownLatch` | One-time; counts down to zero, then all waiting threads proceed |
| `CyclicBarrier` | Reusable; all threads must reach barrier before any proceed |
| `CompletableFuture` | Async composition: `supplyAsync`, `thenApply`, `thenAccept`, `exceptionally` |
| `ForkJoinPool.commonPool()` | Shared by parallel streams; parallelism tied to available processors |
| `parallel()` / `parallelStream()` | Uses common pool; avoid blocking/synchronized work in tasks |
| `Thread.interrupted()` | Clears interrupted flag; static `Thread.interrupted()` vs instance `isInterrupted()` |
| `ExecutorService.invokeAll` | Submits collection of `Callable`s; blocks until all complete or timeout |
| `ScheduledExecutorService` | `schedule`, `scheduleAtFixedRate`, `scheduleWithFixedDelay` |
| `Thread.setDaemon(true)` | JVM exits when only daemon threads remain |
| `synchronized` reentrancy | Same thread can re-acquire lock it holds |
| `ReadWriteLock` | Multiple readers OR one writer — `ReentrantReadWriteLock` |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 13]
**Trap 1 — Calling `run()` instead of `start()`:**
```java
Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()));
t.run();   // prints "main" — NOT a new thread!
t.start(); // prints "Thread-0" — creates a new thread ✅
```

**Trap 2 — `Future.get()` exception wrapping:**
```java
Future<Integer> f = executor.submit(() -> { throw new IOException("oops"); });
try {
    f.get(); // ❌ throws ExecutionException, not IOException!
} catch (ExecutionException e) {
    Throwable cause = e.getCause(); // the original IOException
}
```

**Trap 3 — `volatile` does NOT make compound operations atomic:**
```java
volatile int count = 0;
// This is NOT thread-safe!
count++; // read-modify-write: 3 operations, not atomic despite volatile

// Use AtomicInteger instead:
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet(); // ✅ atomic
```

**Trap 4 — Forgetting to unlock `ReentrantLock`:**
```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
// ❌ If exception thrown here, unlock never called → deadlock!
doWork();
lock.unlock();

// ✅ Always use try/finally:
lock.lock();
try { doWork(); }
finally { lock.unlock(); }
```

**Trap 5 — Thread pool shutdown timing:**
```java
ExecutorService exec = Executors.newFixedThreadPool(4);
exec.submit(() -> heavyWork());
exec.shutdown(); // signals shutdown — tasks already submitted still run!
// exec.submit(newTask); // ❌ RejectedExecutionException after shutdown

boolean done = exec.awaitTermination(10, TimeUnit.SECONDS);
// done = true if all tasks finished within 10 sec, false if timeout
```

**Trap 6 — Virtual threads and pinning:**
```java
// Virtual threads should NOT use synchronized on I/O-heavy code
// Using synchronized with blocking I/O "pins" the virtual thread to a platform thread
// Use ReentrantLock instead of synchronized for I/O-heavy virtual thread code

// ✅ Best for virtual threads:
ReentrantLock lock = new ReentrantLock();
lock.lock();
try { doIoWork(); }
finally { lock.unlock(); }
```

**Trap 7 — `ConcurrentHashMap` does NOT allow null keys/values:**
```java
ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
map.put(null, "value"); // ❌ NullPointerException
map.put("key", null);   // ❌ NullPointerException
// HashMap allows one null key; ConcurrentHashMap does NOT
```

**Trap 8 — Race condition with check-then-act:**
```java
// NOT thread-safe even with synchronized get/put separately:
if (!map.containsKey("key")) {       // check
    map.put("key", computeValue());  // act ← another thread may have inserted between!
}
// ✅ Use atomic operation:
map.computeIfAbsent("key", k -> computeValue());
```

**Trap 9 — `ExecutorService.submit(Runnable)` return value:**
```java
Future<?> f = exec.submit(() -> { work(); });
f.get(); // returns null for Runnable — use Callable for results
```

**Trap 10 — `InterruptedException` clears interrupt status:**
```java
try { Thread.sleep(1000); }
catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // ✅ restore interrupt flag
}
```

**Trap 11 — `parallelStream()` on small data:**
```java
List.of(1,2,3).parallelStream().map(n -> n * 2); // overhead may dominate — not always faster
```
:::

### Exam vignettes

```java
// Vignette 1 — Virtual thread factory
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    ex.submit(() -> System.out.println(Thread.currentThread().isVirtual()));
}

// Vignette 2 — latch
CountDownLatch latch = new CountDownLatch(1);
new Thread(() -> { doWork(); latch.countDown(); }).start();
latch.await();
```

:::tip[Spring/Senior Relevance]
- Spring's `@Async` methods run in a thread pool — `Future` and `CompletableFuture` are the return types; understanding `ExecutionException` unwrapping is key for proper error handling in async Spring services.
- Virtual threads (Java 21 + Spring Boot 3.2+) are enabled via `spring.threads.virtual.enabled=true`. Understanding that virtual threads are best for blocking I/O (JDBC, HTTP calls) explains why Spring's traditional thread-per-request model benefits most.
- `ConcurrentHashMap.computeIfAbsent()` is the standard pattern for Spring's component registry, cache managers, and bean scope caches — avoiding the check-then-act race condition that plagues naive `HashMap` usage in `@Component` singletons.
:::

---

## 🔗 Review Questions Focus

1. What is the difference between `shutdown()` and `shutdownNow()`?
2. What is a race condition and give an example with `count++`?
3. What does `volatile` guarantee? What does it NOT guarantee?
4. When should you use virtual threads vs platform threads?
5. What does `AtomicInteger.compareAndSet()` do?
6. Why must `ReentrantLock.unlock()` be called in a `finally` block?
7. What exception does `Future.get()` throw if the task threw an exception?
8. What is the difference between `CountDownLatch` and `CyclicBarrier`?
9. What happens when you call `t.run()` instead of `t.start()`?
10. Why does `ConcurrentHashMap` not allow null keys?
