---
id: chapter-11-concurrency
title: "Chapter 11: Concurrency"
sidebar_label: "11. Concurrency"
---

# Chapter 11: Concurrency

Threads allow multiple activities to proceed concurrently. Concurrent programming is harder than single-threaded programming because more things can go wrong and failures are harder to reproduce. This chapter contains advice to help you write clear, correct, and well-documented concurrent programs.

---

## Item 78: Synchronize Access to Shared Mutable Data

The `synchronized` keyword ensures that only one thread at a time can execute a method or block. Without synchronization, one thread's changes may not be visible to other threads, and operations that appear atomic may not be.

### The Visibility Problem

```java
// BROKEN: may loop forever without synchronization
public class StopThread {
    private static boolean stopRequested;

    public static void main(String[] args) throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested) i++; // JIT may hoist this check out of the loop!
        });
        backgroundThread.start();
        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

The JIT may transform the loop body into `if (!stopRequested) while (true) i++;` (hoist optimization). Fix with synchronization:

```java
private static synchronized void requestStop() { stopRequested = true; }
private static synchronized boolean stopRequested() { return stopRequested; }
```

**Note:** Both the read and write must be synchronized for correct visibility.

### volatile

`volatile` guarantees visibility but not atomicity:

```java
private static volatile boolean stopRequested; // Visibility only, no atomicity
```

`volatile` is safe for flags and single independent reads/writes. It is **not safe** for compound operations like increment (`++`):

```java
// BROKEN: race condition even with volatile
private static volatile int nextSerialNumber = 0;
public static int generateSerialNumber() {
    return nextSerialNumber++; // read-modify-write is NOT atomic!
}
```

Fix: use `synchronized` on the method, or use `AtomicLong`:

```java
private static final AtomicLong nextSerialNum = new AtomicLong();
public static long generateSerialNumber() { return nextSerialNum.getAndIncrement(); }
```

**Rule:** Confine mutable data to a single thread, or share only immutable data. If you must share mutable data, **synchronize every access** — reads AND writes.

---

## Item 79: Avoid Excessive Synchronization

Too much synchronization can cause reduced performance, deadlock, or indeterminate behavior.

**Never call an alien method (one you don't control) from within a synchronized region.** The alien method might acquire another lock, causing deadlock, or be a long-running operation, degrading performance.

```java
// BAD: calls notifyElementAdded (alien method) from synchronized block
private void notifyElementAdded(E element) {
    List<SetObserver<E>> snapshot = null;
    synchronized (observers) {
        snapshot = new ArrayList<>(observers); // copy first!
    }
    for (SetObserver<E> observer : snapshot) // call outside synchronized
        observer.added(this, element);
}
```

The solution: do as little work in synchronized regions as possible. Move expensive operations (file I/O, network calls, computation) outside the synchronized region.

### Open Calls

An **open call** is an invocation of an alien method without any lock held. Open calls are far safer than calls from synchronized regions.

### Synchronization Policies

For mutable classes, choose one policy:
1. **Thread-safe internally** (e.g., `java.util.concurrent` classes) — every access is synchronized internally
2. **Externally synchronized** (e.g., `ArrayList`) — document that external synchronization is required
3. **Thread-confined** — accessible only from a single thread

Document the choice in the class's Javadoc.

---

## Item 80: Prefer Executors, Tasks, and Streams to Threads

The `java.util.concurrent.Executors` framework replaced the old approach of managing `Thread` objects directly.

```java
// Old way: create and manage threads manually
// New way: use ExecutorService
ExecutorService exec = Executors.newSingleThreadExecutor();
exec.execute(runnable);
exec.shutdown();
```

Key choices:

| Need | Recommendation |
|---|---|
| Small programs / lightly loaded servers | `Executors.newCachedThreadPool()` |
| Production server under heavy load | `Executors.newFixedThreadPool(nThreads)` |
| Scheduled tasks | `ScheduledThreadPoolExecutor` |
| Fork-join work | `ForkJoinPool` |

The `Executor Framework` separates:
- **Tasks** — units of work (`Runnable`, `Callable`)
- **Executor** — mechanism for executing tasks

`Callable` is like `Runnable` but returns a value and can throw exceptions. `Future` represents the result of a task.

**For parallel streams**, the common pool (`ForkJoinPool.commonPool()`) is used automatically.

> **For Spring developers:** Use Spring's `TaskExecutor` abstraction and `@Async` annotation, which wraps the executor framework. Prefer `@EnableAsync` + `@Async` for background tasks in Spring.

---

## Item 81: Prefer Concurrency Utilities to wait and notify

Given the difficulty of using `wait` and `notify` correctly, **use the higher-level concurrency utilities** in `java.util.concurrent` instead.

The three categories to know:
1. **Executor Framework** (Item 80)
2. **Concurrent Collections** — highly optimized thread-safe implementations of standard collection interfaces
3. **Synchronizers** — objects that enable threads to coordinate

### Concurrent Collections

```java
// Use ConcurrentHashMap instead of Collections.synchronizedMap(hashMap)
private static final ConcurrentMap<String, String> map = new ConcurrentHashMap<>();

// Use putIfAbsent for atomic check-then-act
public static String intern(String s) {
    String previousValue = map.putIfAbsent(s, s);
    return previousValue == null ? s : previousValue;
}
// OR with computeIfAbsent:
public static String intern(String s) {
    return map.computeIfAbsent(s, k -> k);
}
```

Prefer `ConcurrentHashMap` to `Collections.synchronizedMap`. For blocking queues (producer-consumer), use `BlockingQueue`.

### Synchronizers

| Synchronizer | Purpose |
|---|---|
| `CountDownLatch` | One or more threads wait for other threads |
| `Semaphore` | Controls access to shared resources |
| `CyclicBarrier` | Threads wait for each other at a barrier |
| `Exchanger` | Two threads exchange objects at a rendezvous |
| `Phaser` | Flexible barrier with phases |

```java
// Timing concurrent execution with CountDownLatch
public static long time(Executor executor, int concurrency, Runnable action)
        throws InterruptedException {
    CountDownLatch ready = new CountDownLatch(concurrency);
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done  = new CountDownLatch(concurrency);

    for (int i = 0; i < concurrency; i++) {
        executor.execute(() -> {
            ready.countDown(); // tell timer we're ready
            try {
                start.await(); // wait till peers are ready
                action.run();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                done.countDown();
            }
        });
    }

    ready.await();
    long startNanos = System.nanoTime();
    start.countDown(); // off we go!
    done.await();
    return System.nanoTime() - startNanos;
}
```

**If you must use `wait` and `notify`:** always use `wait` inside a loop testing the condition:
```java
synchronized (obj) {
    while (<condition does not hold>)
        obj.wait(); // releases lock, reacquired on wakeup
    // Perform action appropriate to condition
}
```

---

## Item 82: Document Thread Safety

How a class behaves when its methods are used concurrently is an important part of its contract. **Failing to document thread safety is a bug waiting to happen.**

The thread-safety levels (from most to least thread-safe):

| Level | Description | Examples |
|---|---|---|
| **Immutable** | No external synchronization needed | `String`, `Long`, `BigInteger` |
| **Unconditionally thread-safe** | Mutable but with sufficient internal synchronization | `AtomicLong`, `ConcurrentHashMap` |
| **Conditionally thread-safe** | Some methods require external sync | `Collections.synchronized` wrappers |
| **Not thread-safe** | Clients must externally synchronize all accesses | `ArrayList`, `HashMap` |
| **Thread-hostile** | Unsafe even with external synchronization | Rare; usually a bug |

Document which methods require synchronized use and which locks must be held.

**Lock fields should be `private final`:**
```java
private final Object lock = new Object(); // private lock object idiom

public void foo() {
    synchronized(lock) { ... }
}
```

Using a private lock object instead of `this` prevents clients from interfering with synchronization.

---

## Item 83: Use Lazy Initialization Judiciously

Lazy initialization — delaying initialization of a field until it is needed — can improve performance if the field is never needed, but adds synchronization overhead otherwise.

**For most situations, normal (eager) initialization is preferable.** Apply lazy initialization only if the field is accessed infrequently and the initialization is expensive.

```java
// Normal initialization for instance fields
private final FieldType field = computeFieldValue();

// Synchronized lazy initialization for instance fields
private FieldType field;
private synchronized FieldType getField() {
    if (field == null) field = computeFieldValue();
    return field;
}

// Static fields: use the initialization-on-demand holder class idiom
private static class FieldHolder {
    static final FieldType field = computeFieldValue(); // initialized when class is loaded
}
private static FieldType getField() { return FieldHolder.field; }

// Double-check idiom for instance fields (highest performance)
private volatile FieldType field;
private FieldType getField() {
    FieldType result = field;
    if (result != null) return result; // first check — no locking
    synchronized (this) {
        if (field == null) // second check — with locking
            field = computeFieldValue();
        return field;
    }
}
```

---

## Item 84: Don't Depend on the Thread Scheduler

Any program that relies on the thread scheduler for correctness or performance is likely to be fragile and non-portable. Thread scheduling policies vary across JVMs and operating systems.

**If threads aren't doing useful work, they shouldn't be running.** The best way to ensure this: keep the number of runnable threads low. Threads should not run in a busy-wait loop:

```java
// TERRIBLE: busy-wait
public void run() {
    while (true) {
        synchronized (this) {
            if (workToBeDone()) {
                doWork();
            }
        }
    }
}
```

**`Thread.yield`** should never be used as a workaround for correctness problems. Its behavior is JVM-specific and may be ignored.

**`Thread.sleep(1)`** (sleeping for 1ms) is occasionally useful for testing — it slows down a fast thread without relying on thread priorities. But even this is fragile.

Design concurrency using the executor framework, concurrent utilities, and proper synchronization — not thread priorities or `yield`.
