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

> **Key Topics:** Platform vs. Virtual Threads, Thread Lifecycle & States, Runnable vs. Callable, ExecutorService (Single-Threaded, Scheduled, Pooled), Future API, Thread Safety (Atomic Classes, synchronized, ReentrantLock, volatile, memory consistency happens-before), Concurrent Collections, Threading Problems (Deadlock, Starvation, Livelock, Race Conditions), and Parallel Streams.

---

## 🟦 New Learner: Threads and Executors

### 1. Platforms Threads vs. Virtual Threads (Java 21)
A **thread** is the smallest unit of execution that can be scheduled by an operating system. A **process** is a group of threads executing in a shared environment (sharing memory and address space).
*   **Platform Threads**: Map one-to-one to operating system threads. They are heavy, resource-intensive (~1MB stack size), and limited in scale (thousands).
*   **Virtual Threads**: Lightweight threads managed by the JVM rather than the OS. They mount to a **carrier thread** (which is a platform thread) only when they are actively running. When blocked (e.g. waiting on I/O or sleep), the virtual thread is unmounted from the carrier thread, freeing it up to run other virtual threads. Scale up to millions.
*   **Virtual Thread Execution**: Always daemon threads. Their priority is always 5 (`Thread.NORM_PRIORITY`) and cannot be changed (calling `setPriority()` has no effect). They do not need to be pooled because they are extremely lightweight and cheap to create.

---

### 2. Creating and Starting Threads

| Thread Type | Creation Method | Starting Method |
| :--- | :--- | :--- |
| **Platform Thread** | `Thread.ofPlatform().unstarted(runnable)` | `.start()` |
| **Platform Thread** | `Thread.ofPlatform().start(runnable)` | Starts immediately |
| **Platform Thread** | `new Thread(runnable)` | `.start()` |
| **Virtual Thread** | `Thread.ofVirtual().unstarted(runnable)` | `.start()` |
| **Virtual Thread** | `Thread.ofVirtual().start(runnable)` | Starts immediately |
| **Virtual Thread** | `Thread.startVirtualThread(runnable)` | Starts immediately |

:::caution[`start()` vs. `run()` Trap]
Calling `run()` on a `Thread` or a `Runnable` executes the task **synchronously** in the *current thread*—it does **not** start a new thread. Always call `start()` to run a task asynchronously in a new thread.
:::

#### Daemon Threads
A Java application terminates when the only threads left running are **daemon threads** (the JVM does not wait for daemon threads to finish). Platform threads are non-daemon by default (can be set via `.daemon(true)`). Virtual threads are always daemons and cannot be changed to non-daemons.

---

### 3. Managing Thread Lifecycles
You can query a thread's state by calling `getState()`, which returns a `Thread.State` enum value:
1.  **`NEW`**: Thread has been created but not yet started (via `start()`).
2.  **`RUNNABLE`**: Thread is executing or ready to execute when scheduled.
3.  **`BLOCKED`**: Thread is waiting to acquire a monitor lock.
4.  **`WAITING`**: Thread is waiting indefinitely for another thread to perform an action (e.g. via `join()`, `wait()`).
5.  **`TIMED_WAITING`**: Thread is waiting for a specified period (e.g. via `sleep(ms)`, `join(ms)`, `wait(ms)`).
6.  **`TERMINATED`**: Thread has completed executing its task or exited due to an uncaught exception.

#### Interruption
Calling `interrupt()` on a thread in a waiting state (`WAITING` or `TIMED_WAITING`) wakes it up, throwing an `InterruptedException`.
If `interrupt()` is called on a running thread, it does not throw an exception but sets the interrupt flag. The thread can check `Thread.interrupted()` (which clears the flag) or `isInterrupted()` (does not clear the flag) to check for interrupts.

---

### 4. The Concurrency API: Executor Services
`ExecutorService` manages task execution and thread pooling, separating task definition from thread creation.

#### Creating Executors (`Executors` Factory)
*   `Executors.newSingleThreadExecutor()`: Single platform thread, runs tasks sequentially.
*   `Executors.newSingleThreadScheduledExecutor()`: Single platform thread for delayed/periodic tasks.
*   `Executors.newCachedThreadPool()`: Grows pool as needed; reuses idle threads.
*   `Executors.newFixedThreadPool(n)`: Reuses a fixed number of platform threads.
*   `Executors.newScheduledThreadPool(n)`: Pooled executor for scheduled/periodic tasks.
*   `Executors.newVirtualThreadPerTaskExecutor()`: Creates a new virtual thread for each task (Java 21).

#### Submitting Tasks
*   `execute(Runnable)`: Fire-and-forget; returns `void`.
*   `submit(Runnable)`: Returns a `Future<?>`. `Future.get()` returns `null` on completion.
*   `submit(Callable<V>)`: Returns a `Future<V>` containing the result.
*   `invokeAll(Collection<Callable>)`: Executes all tasks, blocks until all are complete. Returns list of `Future`s.
*   `invokeAny(Collection<Callable>)`: Executes all tasks, blocks until at least one completes, returns its value, and cancels all others.

#### Shutting Down Executors
Always manage executors in a try-with-resources block (added to `ExecutorService` in Java 19), which calls `close()`, implicitly shutting down and waiting for tasks to finish.
*   `shutdown()`: Stops accepting new tasks, but runs existing queued tasks to completion.
*   `shutdownNow()`: Attempts to stop executing tasks immediately, discards waiting tasks, and returns a list of unstarted tasks.
*   `isShutdown()`: Returns `true` if `shutdown()` or `shutdownNow()` has been called.
*   `isTerminated()`: Returns `true` if all tasks have completed after shutdown.

---

### 5. Future API
A `Future<V>` represents the pending result of an asynchronous task.
*   `get()`: Blocks indefinitely until the task completes. If the task threw an exception, it wraps it in an `ExecutionException` (original retrieved via `.getCause()`).
*   `get(long timeout, TimeUnit unit)`: Blocks up to the timeout. Throws `TimeoutException` if not ready in time.
*   `cancel(boolean mayInterruptIfRunning)`: Attempts to cancel execution.
*   `isDone()` / `isCancelled()`: Checks task completion/cancellation status.

---

### 6. Scheduled Executor Services (`ScheduledExecutorService`)
*   `schedule(Callable/Runnable, delay, unit)`: Runs the task once after the delay.
*   `scheduleAtFixedRate(Runnable, initialDelay, period, unit)`: Runs the task repeatedly at a fixed interval (e.g. every 5 minutes), regardless of how long the task takes. Can crash if tasks queue up faster than they execute.
*   `scheduleWithFixedDelay(Runnable, initialDelay, delay, unit)`: Runs the task repeatedly, ensuring the specified delay passes between the completion of one task and the start of the next (e.g. task finishes, waits 2 minutes, then starts next).

---

## 🟣 Senior Deep Dive

### 1. Writing Thread-Safe Code

#### Atomic Classes
Atomics perform read-and-write operations on a single variable as a single unit without synchronization overhead.
*   Classes: `AtomicBoolean`, `AtomicInteger`, `AtomicLong`, `AtomicReference<V>`
*   Methods: `get()`, `set()`, `getAndSet()`, `incrementAndGet()` (`++x`), `getAndIncrement()` (`x++`), `decrementAndGet()` (`--x`), `getAndDecrement()` (`x--`), and `compareAndSet(expected, newValue)` (sets if current equals expected).

#### Volatile Variables
`volatile` guarantees **visibility** (reads always see the latest write across threads by bypassing CPU local cache) but does **not** guarantee **atomicity** for compound operations (e.g. `count++` is read-modify-write and is **not** safe with `volatile`).

#### Synchronized Blocks and Methods
*   Uses a **monitor lock** to ensure only one thread can execute a block of code at a time.
*   Synchronized method (instance): Locks on `this`.
*   Synchronized method (`static`): Locks on `ClassName.class` object.
*   Synchronized block: Locks on a specific object reference.

```java
// Instance method lock on 'this'
public synchronized void increment() { count++; }

// Equivalent block:
public void incrementBlock() {
    synchronized(this) { count++; }
}
```

#### ReentrantLock (Locks Framework)
An alternative to `synchronized` offering finer control.
*   Must call `unlock()` inside a `finally` block to prevent deadlocks.
*   `tryLock()`: Non-blocking; attempts to acquire lock immediately and returns a boolean.
*   `tryLock(timeout, unit)`: Blocks up to timeout trying to acquire lock.
*   *Virtual Threads Note*: Avoid `synchronized` in I/O-heavy virtual thread tasks as it "pins" the virtual thread to its carrier platform thread, defeating virtual thread scaling. Use `ReentrantLock` instead.

```java
Lock lock = new ReentrantLock();
if (lock.tryLock()) {
    try {
        // critical section
    } finally {
        lock.unlock(); // Always unlock in finally
    }
}
```

---

### 2. Concurrent Collections
Standard collections throw `ConcurrentModificationException` if modified while iterating. Use concurrent versions:
*   `ConcurrentHashMap`: High performance, lock-striping. **Does not allow null keys or values** (throws NPE).
*   `CopyOnWriteArrayList`: Creates a copy of the underlying array whenever modified. Iterators never throw `ConcurrentModificationException`. Best for read-heavy, write-rare scenarios.
*   `ConcurrentSkipListMap` / `ConcurrentSkipListSet`: Sorted concurrent map/set.
*   `BlockingQueue` (`LinkedBlockingQueue`, `ArrayBlockingQueue`): Queues that block on retrieve if empty, or on insert if full.

---

### 3. Threading Problems
*   **Deadlock**: Two or more threads are blocked forever, waiting for a lock held by the other (circular dependency).
*   **Starvation**: A thread is perpetually denied CPU time or lock access because other threads take priority.
*   **Livelock**: Active threads perpetually change state in response to each other, never making actual progress (active deadlock).
*   **Race Conditions**: Two or more threads access a resource simultaneously, resulting in incorrect, unpredictable data.

---

### 4. Parallel Streams
Decomposes stream processing into multiple threads using `ForkJoinPool.commonPool()`.
*   Created via `stream().parallel()` or `collection.parallelStream()`.
*   **Stateful Lambdas Danger**: Do not use stateful lambdas (lambdas that depend on or modify external state) in parallel streams—results will be inconsistent and unordered.
*   **Ordering**: Use `forEachOrdered()` instead of `forEach()` to guarantee original stream order.
*   **Decomposition & Parallel Reduction**:
    *   `reduce(identity, accumulator, combiner)`: The third parameter combines results from parallel subthreads. Must be associative.
    *   `collect(supplier, accumulator, combiner)`: Accumulates parallel results.
    *   `Collectors.toConcurrentMap()` and `groupingByConcurrent()` support parallel reductions.

---

## 📝 Exam Quick Reference

### Runnable vs. Callable
*   `Runnable`: `void run()`, cannot throw checked exceptions.
*   `Callable<V>`: `V call() throws Exception`, returns generic type and throws checked exceptions.

### Happens-Before Relationships
The JMM guarantees memory visibility order:
*   A write to a `volatile` variable happens-before subsequent reads.
*   An `unlock()` on a monitor happens-before subsequent `lock()` on the same monitor.
*   `Thread.start()` happens-before any actions in the started thread.
*   All actions in a thread happen-before a successful return from `join()` on that thread.

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 13]
**Trap 1 — Synchronizing on different objects:**
Threads must coordinate on the *same* monitor object for synchronization to work. Locking on separate objects allows concurrent access.
```java
// ❌ Thread 1 locks on a, Thread 2 locks on b. No mutual exclusion!
synchronized(new Object()) { count++; }
```

**Trap 2 — Null values in ConcurrentHashMap:**
Standard `HashMap` allows one `null` key and `null` values. `ConcurrentHashMap` throws `NullPointerException` on `null` keys or values.
```java
var map = new ConcurrentHashMap<String, String>();
map.put(null, "val"); // ❌ Throws NullPointerException
```

**Trap 3 — Forgetting to call `start()`:**
Creating a `Thread` and calling `.run()` executes code inside the current main thread, not concurrently. Always use `.start()`.

**Trap 4 — Modifying variables in streams:**
Modifying external variables inside stream lambdas causes race conditions. Keep stream lambdas stateless.
```java
// ❌ Race condition on count
List.of(1,2,3).parallelStream().forEach(i -> count++);
```

**Trap 5 — Mixing Single-Thread Executor with concurrent schedule tasks:**
Using `Executors.newSingleThreadScheduledExecutor()` only has *one* thread. If you schedule a repeating task, it cannot execute concurrently with itself or other tasks; they wait in queue.

**Trap 6 — `volatile` is not atomic:**
A `volatile` counter does not make `count++` safe. Use `AtomicInteger` instead.

**Trap 7 — CyclicBarrier count mismatch:**
A `CyclicBarrier(N)` requires exactly `N` threads to call `.await()`. If fewer threads call it (e.g. 9 threads for a barrier of 10), they will wait forever (hang).

**Trap 8 — ReentrantLock `unlock()` without `lock()`:**
Calling `unlock()` on a lock that is not held by the current thread throws an `IllegalMonitorStateException` at runtime.

**Trap 9 — Double-increment / decrement on Atomics:**
Watch out for methods like `incrementAndGet()` (pre-increment) vs `getAndIncrement()` (post-increment) returns.
```java
var atom = new AtomicInteger(5);
System.out.print(atom.getAndIncrement()); // Prints 5 (value is now 6)
```

**Trap 10 — SingleThreadExecutor does not accept new tasks after shutdown:**
Submitting tasks after `shutdown()` throws `RejectedExecutionException`.
:::

:::tip[Spring/Senior Relevance]
*   **Virtual Threads Configuration**: Enabling virtual threads in Spring Boot 3.2 (`spring.threads.virtual.enabled=true`) changes the default Tomcat connector thread pool to use virtual threads. Ideal for microservices that spend most time blocking on SQL or REST client calls.
*   **Pinning Warning**: If your Spring application uses virtual threads, avoid blocking calls inside `synchronized` blocks (like legacy JDBC drivers or synchronization libraries). Refactor them to `ReentrantLock` to avoid platform thread pinning.
:::

---

## 🔗 Review Questions Focus

1.  What is the difference between `Thread.ofPlatform().start(task)` and `new Thread(task).run()`?
2.  Which states does a thread transition between when waiting to acquire a `synchronized` lock vs when executing `Thread.sleep()`?
3.  Why is `volatile boolean flag = true;` safe for thread signaling, but `volatile int count = 0; count++;` is not thread-safe?
4.  Why are virtual threads not pooled?
5.  What exception is thrown if you submit a task to an `ExecutorService` after calling `shutdown()`?
6.  How does `scheduleAtFixedRate()` differ from `scheduleWithFixedDelay()` when the task execution time exceeds the scheduled period?
7.  What is the benefit of `CopyOnWriteArrayList` over a synchronized list? What is the performance trade-off?
8.  How can you safely combine results in parallel streams using `reduce()`?
9.  Under what conditions does `CyclicBarrier` release the waiting threads?
10. Does `ConcurrentHashMap.putIfAbsent("key", null)` succeed? Why?
