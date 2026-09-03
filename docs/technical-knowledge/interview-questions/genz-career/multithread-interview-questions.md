---
id: java-multithreading-interview-guide
title: 40+ Java Multithreading & Concurrency Interview Questions
sidebar_label: Java Multithreading Interview Questions Tricky
tags:
  - Java
  - Multithreading
  - Concurrency
  - Interview Prep
  - Backend Development
description: A comprehensive, detailed list of tricky and real-world Java Multithreading interview questions for experienced developers (2–7 years).
---

# Java Multithreading & Concurrency Interview Questions

This guide provides an exhaustive list of detailed interview questions and answers focused on Java Multithreading, specifically curated for developers with 2 to 7 years of experience.

---

## 1. Fundamentals of Threads and Processes

**Q: Is a thread lighter than a process and can it exist without it?**
**A:** Yes, a thread is significantly lighter than a process. A **process** is an isolated execution environment with its own address space, file descriptors, and heap — created by the OS with a heavy fork/exec. A **thread** is the smallest unit of execution within a process, sharing the process's heap, code segment, and file descriptors. Threads only need their own **stack** (default 1 MB on Linux, configurable via `-Xss`), **program counter**, and **register set**.

Key differences:

| Aspect | Process | Thread |
|--------|---------|--------|
| Memory | Isolated address space | Shares heap with other threads |
| Creation cost | ~10-100ms (fork + exec) | ~1ms (stack allocation) |
| Context switch | ~3-5μs (TLB flush, page table swap) | ~1-3μs (register swap only) |
| Communication | IPC (pipes, sockets, shared memory) | Direct shared memory access |

A thread **cannot exist without a process** — it lives within the process boundary. When the last thread of a process terminates, the process terminates. In Java, the JVM process contains the `main` thread, GC threads, JIT compilation threads, and any user-created threads.

**Q: Multiple users hit the same REST API at the same time. Are they served by one thread or multiple?**
**A:** Multiple threads. In a Spring Boot application with embedded Tomcat, each incoming HTTP request is assigned to a **separate worker thread** from Tomcat's thread pool. By default, Tomcat uses:
- `server.tomcat.threads.max=200` — maximum worker threads.
- `server.tomcat.threads.min-spare=10` — minimum idle threads kept alive.
- `server.tomcat.max-connections=8192` — maximum simultaneous TCP connections accepted.
- `server.tomcat.accept-count=100` — OS-level backlog queue when all connections are busy.

When 200 threads are all busy, additional requests wait in the accept queue. If the accept queue (100) is also full, the OS sends **TCP RST** (Connection Refused). This is why thread pool sizing matters — use **Little's Law**: `threads_needed = throughput × average_latency`. For a service handling 300 RPS with 50ms average response time: `300 × 0.05 = 15 threads` minimum.

**Q: What are the different ways to create a thread?**
**A:**
1. **Extending `Thread`** — Older approach, limited by single inheritance.
2. **Implementing `Runnable`** — Preferred, task is separate from execution mechanism.
3. **Implementing `Callable<V>`** — Returns a result and can throw checked exceptions. Used with `ExecutorService.submit()`.
4. **Lambda expressions (Java 8+)** — Concise `Runnable` or `Callable` implementation.
5. **`CompletableFuture` (Java 8+)** — Declarative async task chaining.
6. **Virtual Threads (Java 21+)** — Lightweight threads managed by the JVM, not the OS.

```java
// Modern approaches
// Callable with ExecutorService
Future<String> future = executor.submit(() -> fetchData());

// CompletableFuture
CompletableFuture.supplyAsync(() -> fetchData())
    .thenApply(data -> transform(data))
    .thenAccept(result -> save(result));

// Virtual Thread (Java 21+)
Thread.startVirtualThread(() -> handleRequest());
```

**Q: Can you tell me the difference between extending `Thread` and implementing `Runnable` and when to use each?**
**A:**

| Aspect | `extends Thread` | `implements Runnable` |
|--------|------------------|----------------------|
| Inheritance | Consumes the single class inheritance slot | Class can still extend another class |
| Separation | Task and thread mechanism are coupled | Task is decoupled from thread |
| Reusability | Task can't be reused with `ExecutorService` | Task can be submitted to any executor |
| Memory | Each `Thread` object is ~1 KB + 1 MB stack | `Runnable` is a lightweight object |

**Always prefer `Runnable`** (or `Callable`) in production. `Thread` subclassing is acceptable only for learning or trivial scripts. In enterprise code, you never create threads manually — you submit tasks to an `ExecutorService`.

**Q: Can a class extend `Thread` and implement `Runnable` together?**
**A:** Technically yes, but it's redundant. `Thread` already implements `Runnable`. The `run()` method from `Runnable` is the same one `Thread` uses. If you override `run()` in both hierarchies, only the class's own `run()` method executes.

**Q: Why is `Runnable` preferred in real-world applications?**
**A:** Beyond the inheritance advantage, `Runnable` follows the **Strategy pattern** — the task (what to do) is separated from the execution mechanism (how to run it). This means:
1. The same `Runnable` can run on a `Thread`, an `ExecutorService`, a `ForkJoinPool`, or a virtual thread.
2. Tasks are testable in isolation — just call `run()` directly in tests.
3. Thread pooling works: executors reuse threads across many `Runnable` instances.

**Q: What happens internally when we call the `run()` method instead of the `start()` method?**
**A:** Calling `run()` directly executes the method synchronously on the **current thread** — no new thread is created. It behaves like any other method call. The `start()` method does the critical work:
1. Transitions the thread from `NEW` to `RUNNABLE` state.
2. Calls the native `start0()` method, which asks the **OS** to create a new kernel thread (via `pthread_create` on Linux).
3. The OS schedules the new thread, which eventually invokes `run()`.

This is why `start()` can only be called once — the OS thread lifecycle is one-shot.

**Q: Can one `Runnable` instance be used by multiple threads?**
**A:** Yes, but with caution. If the `Runnable` is **stateless** (no instance fields) or only reads shared state, it's safe. If the `Runnable` has **mutable instance fields**, multiple threads running it simultaneously will cause race conditions unless properly synchronized.

```java
// SAFE: stateless Runnable
Runnable printer = () -> System.out.println(Thread.currentThread().getName());
new Thread(printer).start();
new Thread(printer).start(); // Both threads run the same task safely

// UNSAFE: stateful Runnable without synchronization
class Counter implements Runnable {
    int count = 0; // Shared mutable state — race condition!
    public void run() { count++; }
}
```

**Q: What happens if the `start()` method is called twice on the same thread?**
**A:** Java throws `IllegalThreadStateException`. A thread's lifecycle is one-way: `NEW → RUNNABLE → ... → TERMINATED`. Once terminated, it cannot be restarted because the underlying OS thread has been destroyed. If you need to re-execute the same task, create a new `Thread` instance or, better yet, use an `ExecutorService` that manages thread reuse internally.

---

## 2. Thread Lifecycle and Synchronization

**Q: Can you please explain the life cycle of a thread?**
**A:** Java defines **6 thread states** in `Thread.State` (note: the JLS combines RUNNABLE to cover both "ready" and "running"):

| State | Trigger | Exit Condition |
|-------|---------|----------------|
| **NEW** | `Thread t = new Thread()` | `t.start()` |
| **RUNNABLE** | `start()` called, or lock acquired | CPU scheduler assigns time slice |
| **BLOCKED** | Waiting to enter `synchronized` block | Monitor lock becomes available |
| **WAITING** | `wait()`, `join()`, `LockSupport.park()` | `notify()`, `notifyAll()`, thread completes |
| **TIMED_WAITING** | `sleep(ms)`, `wait(ms)`, `join(ms)` | Timeout expires or notification |
| **TERMINATED** | `run()` completes or throws uncaught exception | Final state — no exit |

> **Critical interview point:** A thread waiting on a **database call** or **socket I/O** still shows as `RUNNABLE` in `jstack`, not `WAITING`. This is because the JVM considers OS-level blocking (kernel I/O wait) as "runnable from Java's perspective" — the thread isn't waiting on a Java monitor. This confuses many developers during thread dump analysis.

**Q: Can a thread re-enter the Runnable state after it is Terminated?**
**A:** No. The `TERMINATED` state is **final and irreversible**. The underlying OS thread has been destroyed, and the JVM-side `Thread` object is simply a dead reference. Calling `start()` on a terminated thread throws `IllegalThreadStateException`. To re-execute the task, create a new `Thread` object or submit the task to an `ExecutorService`.

**Q: If two threads are trying to update a counter variable simultaneously, what will happen and how do we solve it?**
**A:** This is a classic **race condition**. The increment operation `counter++` is **not atomic** — it compiles to three separate operations:
1. **READ:** Load `counter` value from memory.
2. **MODIFY:** Increment the value by 1.
3. **WRITE:** Store the new value back to memory.

If Thread A reads `counter = 5` and Thread B reads `counter = 5` before either writes, both write `6`. The counter should be `7` but is `6` — a **lost update**.

**Solutions (ordered by recommendation):**

| Approach | Mechanism | Performance | Use When |
|----------|-----------|-------------|----------|
| `AtomicInteger` | CAS (Compare-And-Swap) hardware instruction | Best — lock-free | Simple counters, accumulators |
| `LongAdder` | Striped CAS cells | Best under high contention | Statistics, metrics |
| `synchronized` | Monitor lock (mutex) | Good — OS-level | Compound operations |
| `ReentrantLock` | AQS-based lock | Good — more flexible | Timeouts, fairness, condition variables |

```java
// Best approach for simple counters
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet(); // Atomic, lock-free, thread-safe
```

**Q: How can we use the `synchronized` keyword?**
**A:** Three scopes, each locking on a different monitor object:

```java
// 1. Synchronized instance method — locks on `this`
public synchronized void increment() { counter++; }

// 2. Synchronized block — locks on specified object (finer control)
public void increment() {
    synchronized (lockObject) {   // Only this block is locked
        counter++;
    }
}

// 3. Synchronized static method — locks on the Class object (MyClass.class)
public static synchronized void globalIncrement() { globalCounter++; }
```

> **Best practice:** Prefer synchronized blocks with a **private final** lock object over synchronized methods. This prevents external code from accidentally acquiring your lock via the publicly visible `this` reference.

**Q: Is `synchronized` applied to code or to objects?**
**A:** To **objects** (monitors), not code. The `synchronized` keyword acquires the **intrinsic lock (monitor)** of a specific object before executing the protected code. For instance methods, the lock is `this`. For static methods, the lock is the `Class<?>` object. For synchronized blocks, you explicitly specify the lock object. Two different threads can execute the same synchronized method simultaneously if they're operating on **different object instances** — each instance has its own monitor.

**Q: What happens if an exception occurs inside a synchronized block?**
**A:** The JVM **automatically releases the monitor lock** when the thread exits the block, whether normally or due to an exception. This is guaranteed by the JVM specification (the `monitorexit` bytecode instruction is placed in a finally-equivalent handler). This is a significant advantage over `ReentrantLock`, where forgetting `unlock()` in a `finally` block causes permanent lock holding.

**Q: Can synchronization guarantee thread ordering?**
**A:** No. `synchronized` guarantees **mutual exclusion** (only one thread in the critical section) and **visibility** (changes made by one thread are visible to the next thread that acquires the lock). It does **not** guarantee the order in which threads acquire the lock. Thread scheduling is controlled by the OS scheduler, which uses preemptive scheduling with priority hints. For ordered execution, use `ReentrantLock(true)` (fair lock, FIFO order) or explicit coordination with `CountDownLatch`, `CyclicBarrier`, or `Phaser`.

**Q: What are the limitations of synchronization?**
**A:**
1. **No timeout:** A thread waiting for a `synchronized` lock waits **forever** — no way to back out.
2. **No fairness:** The JVM doesn't guarantee FIFO ordering; a thread can starve indefinitely.
3. **Deadlock risk:** If thread A holds lock X and waits for lock Y, while thread B holds lock Y and waits for lock X, both freeze permanently.
4. **Coarse-grained:** You can only lock entire methods or blocks; no read/write differentiation.
5. **Not interruptible:** `Thread.interrupt()` cannot wake a thread blocked on `synchronized` — only on `wait()`, `sleep()`, or `Lock.lockInterruptibly()`.
6. **No condition variables:** You can't have multiple wait conditions on the same lock (unlike `ReentrantLock` with `Condition`).

---

## 3. Advanced Locking and Volatile

**Q: What is `ReentrantLock` and why do we need it?**
**A:** `ReentrantLock` (from `java.util.concurrent.locks`) provides the same mutual exclusion as `synchronized` with **additional capabilities**:

| Feature | `synchronized` | `ReentrantLock` |
|---------|---------------|-----------------|
| Timeout | ❌ Waits forever | ✅ `tryLock(5, TimeUnit.SECONDS)` |
| Fairness | ❌ No FIFO guarantee | ✅ `new ReentrantLock(true)` |
| Interruptible | ❌ | ✅ `lockInterruptibly()` |
| Try without blocking | ❌ | ✅ `tryLock()` returns `false` immediately |
| Multiple conditions | ❌ One wait-set per monitor | ✅ `lock.newCondition()` (multiple wait-sets) |
| Lock across methods | ❌ Must be same block | ✅ Lock in method A, unlock in method B |

**"Reentrant"** means the same thread can acquire the same lock multiple times without deadlocking itself. Each `lock()` increments a hold counter; each `unlock()` decrements it. The lock is released when the counter reaches zero.

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // Critical section
} finally {
    lock.unlock(); // ALWAYS in finally — prevents permanent lock hold
}
```

**Q: How does the `tryLock()` method prevent deadlocks?**
**A:** Deadlocks require **circular wait** — threads holding locks and waiting for each other indefinitely. `tryLock()` breaks this cycle by making lock acquisition **non-blocking**:

```java
// Deadlock-free pattern
if (lock1.tryLock(100, TimeUnit.MILLISECONDS)) {
    try {
        if (lock2.tryLock(100, TimeUnit.MILLISECONDS)) {
            try {
                // Both locks acquired — proceed
            } finally { lock2.unlock(); }
        } else {
            // lock2 unavailable — release lock1 and retry later
        }
    } finally { lock1.unlock(); }
}
```

If `tryLock()` fails, the thread releases its already-held locks, performs a **randomized backoff** (to avoid livelock), and retries. This eliminates the "hold and wait" condition that's prerequisite for deadlock.

**Q: What happens if you forget to unlock a `ReentrantLock`?**
**A:** The lock is **permanently held** by the thread. All other threads calling `lock()` on the same instance will block forever, causing **thread starvation** or effective deadlock. Unlike `synchronized` (where the JVM auto-releases the monitor on block exit/exception), `ReentrantLock` requires **explicit `unlock()`**. This is why the `try/finally` pattern is mandatory — any exception in the critical section must still trigger `unlock()`.

> **Production gotcha:** A common bug is locking in one method and unlocking in another, with an exception path between them that skips the unlock. Use tools like **FindBugs/SpotBugs** to detect unreleased locks.

**Q: When should you prefer `ReentrantLock` over `synchronized`?**
**A:**
* **Use `synchronized`:** For simple, short critical sections where automatic lock release and readability are priorities. It's less error-prone (no risk of forgetting `unlock()`).
* **Use `ReentrantLock`:** When you need timeouts, fairness, interruptibility, multiple conditions, or lock across methods. Also prefer it when you need `ReadWriteLock` (allowing concurrent readers with exclusive writers).

In practice, most production code uses `synchronized` for simple cases and `java.util.concurrent` utilities (`Atomic*`, `ConcurrentHashMap`, `CountDownLatch`) instead of explicit `ReentrantLock`.

**Q: What is the `volatile` keyword?**
**A:** `volatile` solves the **visibility problem**. Without it, each thread may cache variable values in CPU registers or L1/L2 cache, never seeing updates from other threads. `volatile` enforces:

1. **Visibility:** Every read of a volatile variable reads from **main memory** (not CPU cache). Every write flushes to main memory immediately.
2. **Happens-before:** A write to a volatile variable **happens-before** every subsequent read of that variable by any thread. This establishes a memory ordering guarantee defined by the **Java Memory Model (JMM)**.
3. **Prevents reordering:** The compiler and CPU cannot reorder instructions across a volatile read/write (acts as a **memory fence/barrier**).

```java
// Classic use: shutdown flag
private volatile boolean running = true;

// Thread 1
public void stop() { running = false; } // Write → flushed to main memory

// Thread 2
public void run() {
    while (running) { /* ... */ } // Read → always from main memory
}
```

**Q: Why doesn't `volatile` guarantee atomicity?**
**A:** `volatile` ensures that reads and writes to the variable itself are atomic (for `long` and `double`, which are normally non-atomic on 32-bit JVMs). But **compound operations** like `counter++` involve multiple steps (read → increment → write). `volatile` makes each step individually visible but doesn't prevent interleaving:

```
Thread A: READ counter = 5          // volatile read from main memory
Thread B: READ counter = 5          // volatile read from main memory (same value!)
Thread A: WRITE counter = 6         // volatile write to main memory
Thread B: WRITE counter = 6         // volatile write — OVERWRITES Thread A's update!
```

Result: counter is 6, not 7. For atomic compound operations, use `AtomicInteger.incrementAndGet()`.

**Q: Can `volatile` fix race conditions?**
**A:** No. Race conditions occur when **multiple operations** need to be atomic (check-then-act, read-modify-write). `volatile` only fixes **visibility** issues — ensuring one thread's writes are seen by other threads. Use `AtomicInteger`, `synchronized`, or `ReentrantLock` for atomicity.

> **Valid `volatile` use cases:** Boolean flags (start/stop), double-checked locking (DCL) for lazy initialization, publishing immutable objects.

**Q: What are Atomic classes and how do they work internally?**
**A:** Classes like `AtomicInteger`, `AtomicLong`, `AtomicReference<V>` provide **lock-free thread-safe operations** using hardware-level **CAS (Compare-And-Swap)** instructions:

```
CAS(expected, newValue):
  1. Read current value from memory
  2. If current == expected → swap to newValue, return true
  3. If current != expected → return false (another thread modified it)
  4. On failure → retry in a spin loop
```

Under the hood, `AtomicInteger.incrementAndGet()` compiles to a `lock cmpxchg` x86 instruction — a single atomic CPU instruction that locks the cache line (not the entire bus). This is ~10-100× faster than `synchronized` for simple operations because there's no OS-level thread parking/unparking.

```java
// Internal loop (simplified)
public int incrementAndGet() {
    int oldVal, newVal;
    do {
        oldVal = get();           // volatile read
        newVal = oldVal + 1;
    } while (!compareAndSet(oldVal, newVal)); // CAS retry loop
    return newVal;
}
```

**Q: Why are Atomics faster than `synchronized`?**
**A:** `synchronized` involves:
1. **Monitor acquisition:** Entering a heavyweight lock requires OS kernel intervention (futex on Linux).
2. **Thread parking:** Blocked threads are put to sleep and woken up — each context switch costs ~1-3μs.
3. **Memory barriers:** Full fence on lock acquire/release.

Atomics use **spin-wait CAS** — the thread never sleeps, just retries. Under low contention, CAS succeeds on the first try. Under high contention, `LongAdder` (which stripes CAS cells across CPU cores) significantly outperforms both `AtomicLong` and `synchronized`:

| Approach | 1 Thread | 8 Threads |
|----------|----------|-----------|
| `synchronized` | ~25ns/op | ~200ns/op |
| `AtomicLong` | ~8ns/op | ~60ns/op |
| `LongAdder` | ~8ns/op | ~15ns/op |

---

## 4. Executor Framework and Thread Pools

**Q: What is the Executor framework and why do we need it?**
**A:** The Executor framework (`java.util.concurrent`) decouples **task submission** from **task execution**. Instead of manually creating threads (`new Thread(task).start()`), you submit tasks to an executor that manages a pool of reusable threads.

**Why manual thread creation is bad:**
1. **Thread creation cost:** ~1ms + 1 MB stack per thread. Creating 1000 threads for 1000 tasks wastes time and memory.
2. **No reuse:** Threads die after `run()` completes, requiring new threads for new tasks.
3. **No backpressure:** Unlimited thread creation can exhaust OS resources (Linux default: ~32K threads per process).
4. **No task queuing:** No way to queue tasks when all threads are busy.

The Executor framework solves all of these with configurable thread pools, task queues, and rejection policies.

**Q: Explain the concept of a Thread Pool.**
**A:** A thread pool is a pre-allocated set of worker threads that pull tasks from a shared **blocking queue**:

| Pipeline Component | Role in Thread Pool | Internal Behavior & Sizing | Overflow & Exception Handling |
|---|---|---|---|
| **Task Submission** | Producer API | `execute(Runnable)` or `submit(Callable<T>)` | If pool `< corePoolSize`, spawn core thread immediately. |
| **Work Queue** | `BlockingQueue<Runnable>` | Buffers pending tasks (`ArrayBlockingQueue`, `LinkedBlockingQueue`, `SynchronousQueue`). | Once queue reaches capacity, spawns up to `maximumPoolSize`. |
| **Worker Threads** | `Worker` (extends AQS) | Pre-spawned OS threads looping on `workQueue.take()` or `poll(keepAliveTime)`. | When idle beyond `keepAliveTime`, threads above core are reclaimed. |
| **Rejection Handler** | `RejectedExecutionHandler` | Invoked when queue is saturated AND worker count = `maximumPoolSize`. | `AbortPolicy` (default), `CallerRunsPolicy`, `DiscardPolicy`, `DiscardOldestPolicy`. |

When a worker finishes a task, it goes back to the queue and picks up the next one. The thread is **never destroyed** — it's reused, eliminating creation overhead. The `ThreadPoolExecutor` constructor exposes:
- `corePoolSize`: Minimum threads kept alive (even if idle).
- `maximumPoolSize`: Maximum threads when queue is full.
- `keepAliveTime`: How long excess threads (above core) survive when idle.
- `workQueue`: The `BlockingQueue<Runnable>` implementation (bounded, unbounded, synchronous).

**Q: Who manages the thread lifecycle in Executors?**
**A:** The `ThreadPoolExecutor` manages the entire lifecycle:
1. **Creation:** Core threads are created on first task submission (or eagerly via `prestartAllCoreThreads()`).
2. **Assignment:** The executor polls the work queue and assigns tasks to idle threads.
3. **Scaling:** If the queue is full and threads < `maxPoolSize`, new threads are created.
4. **Shrinking:** Excess threads (above core) idle beyond `keepAliveTime` are terminated.
5. **Shutdown:** `shutdown()` stops accepting new tasks and waits for running tasks to finish. `shutdownNow()` interrupts running tasks and drains the queue.

**Q: What happens if the Executor queue is full?**
**A:** When the queue is full AND all threads are busy, the executor applies a **RejectionPolicy**:

| Policy | Behavior |
|--------|----------|
| `AbortPolicy` (default) | Throws `RejectedExecutionException` |
| `CallerRunsPolicy` | Runs the task on the **submitting thread** (backpressure!) |
| `DiscardPolicy` | Silently drops the task |
| `DiscardOldestPolicy` | Drops the oldest queued task and retries |

> **Production recommendation:** `CallerRunsPolicy` is often the best choice — it naturally applies backpressure. When the pool is overwhelmed, the calling thread (e.g., Tomcat worker) slows down, which propagates backpressure upstream.

**Q: What is the difference between `execute()` and `submit()`?**
**A:**

| Aspect | `execute(Runnable)` | `submit(Runnable/Callable)` |
|--------|--------------------|-----------------------------|
| Return | `void` | `Future<?>` / `Future<V>` |
| Exceptions | Propagates to `UncaughtExceptionHandler` | Captured in `Future`, thrown on `get()` |
| Task type | `Runnable` only | `Runnable` or `Callable<V>` |
| Use case | Fire-and-forget | Need result, cancellation, or exception handling |

> **Gotcha:** If you `submit()` a task and never call `future.get()`, exceptions are **silently swallowed**. The task fails, but no error is logged. Always handle `Future` results or use `CompletableFuture` which has explicit exception handling chains.

**Q: Difference between `Runnable` and `Callable`?**
**A:**

| Feature | `Runnable` | `Callable<V>` |
|---------|-----------|---------------|
| Return value | `void` — no result | `V` — returns a value |
| Checked exceptions | Cannot throw | Can throw any checked exception |
| Method | `run()` | `call()` |
| Introduced | Java 1.0 | Java 5 |

```java
// Callable with result
Callable<Integer> task = () -> {
    TimeUnit.SECONDS.sleep(2);
    return 42;
};
Future<Integer> future = executor.submit(task);
int result = future.get(); // Blocks until result is available (or throws)
```

**Q: Explain the types of Thread Executors.**
**A:**

| Executor | Pool Size | Queue | Best For |
|----------|-----------|-------|----------|
| `FixedThreadPool(n)` | Fixed `n` | Unbounded `LinkedBlockingQueue` | Stable, predictable workloads |
| `SingleThreadExecutor` | 1 | Unbounded `LinkedBlockingQueue` | Sequential task ordering |
| `CachedThreadPool` | 0 → Integer.MAX_VALUE | `SynchronousQueue` (no queue!) | Many short-lived tasks |
| `ScheduledThreadPool(n)` | Fixed `n` | `DelayedWorkQueue` | Delayed/periodic execution |
| `ForkJoinPool` | Default: `availableProcessors()` | Per-thread work-stealing deques | Recursive divide-and-conquer |
| `newVirtualThreadPerTaskExecutor()` (Java 21) | Unlimited virtual threads | None | I/O-bound tasks at massive scale |

> **⚠️ Production warning:** Never use `CachedThreadPool` for I/O-bound tasks — if 10,000 requests arrive, it creates 10,000 OS threads (each consuming 1 MB stack), potentially crashing the JVM with `OutOfMemoryError: unable to create new native thread`. Always use `FixedThreadPool` with a bounded queue.

---

## 5. CompletableFuture

**Q: What is `CompletableFuture` and how does it work?**
**A:** `CompletableFuture` (Java 8) is the foundation for **declarative async programming** in Java. Unlike `Future` (which requires blocking `get()` to retrieve results), `CompletableFuture` supports non-blocking **chaining**, **combining**, and **exception handling**:

```java
CompletableFuture.supplyAsync(() -> fetchUserFromDB(userId))   // Async task
    .thenApply(user -> enrichWithPreferences(user))            // Transform result
    .thenCompose(user -> fetchOrdersAsync(user))               // Chain another async call
    .thenAccept(orders -> updateUI(orders))                    // Consume final result
    .exceptionally(ex -> { log.error("Failed", ex); return fallback(); });
```

Each `then*` method returns a new `CompletableFuture`, forming a **pipeline**. The pipeline executes stages as results become available, without blocking any thread.

**Q: How do you handle exceptions in `CompletableFuture`?**
**A:**

| Method | When to Use | Behavior |
|--------|------------|----------|
| `exceptionally(fn)` | Recovery with fallback value | Only runs on failure; returns replacement value |
| `handle(fn)` | Need to handle both success and failure | Always runs; receives `(result, exception)` |
| `whenComplete(fn)` | Side effects (logging) without changing result | Always runs; cannot modify the result |

```java
CompletableFuture.supplyAsync(() -> riskyOperation())
    .handle((result, ex) -> {
        if (ex != null) {
            log.error("Operation failed", ex);
            return defaultValue;  // Recover
        }
        return result;
    });
```

> **Trap:** `exceptionally()` only catches exceptions from the stage **directly before it** in the chain. If you have `A.thenApply(B).thenApply(C).exceptionally(handler)`, the handler catches exceptions from C, B, **and** A (exceptions propagate down the chain).

**Q: Can `CompletableFuture` cause thread starvation?**
**A:** Yes. By default, `supplyAsync()` and `runAsync()` use `ForkJoinPool.commonPool()`, which has `Runtime.getRuntime().availableProcessors() - 1` threads (e.g., 7 threads on an 8-core machine). If you submit blocking I/O tasks (database calls, HTTP requests), these threads get stuck waiting, and new async tasks queue up indefinitely.

**Fix:** Always supply a **custom executor** for blocking operations:
```java
ExecutorService ioExecutor = Executors.newFixedThreadPool(20);

CompletableFuture.supplyAsync(() -> blockingDbCall(), ioExecutor)
    .thenApplyAsync(result -> cpuIntensiveTransform(result)); // Uses commonPool (CPU-bound)
```

In Java 21+, virtual threads eliminate this problem entirely: `Executors.newVirtualThreadPerTaskExecutor()` can handle millions of blocking tasks without pool exhaustion.

**Q: Why is `CompletableFuture` better than `Future`?**
**A:**

| Feature | `Future` | `CompletableFuture` |
|---------|----------|---------------------|
| Get result | `get()` blocks the caller | Non-blocking `thenApply()`, `thenAccept()` |
| Chain tasks | ❌ Must call `get()` between tasks | ✅ `thenApply`, `thenCompose` |
| Combine results | ❌ Manual coordination | ✅ `thenCombine()`, `allOf()`, `anyOf()` |
| Exception handling | ❌ `ExecutionException` wrapper | ✅ `exceptionally()`, `handle()` |
| Complete manually | ❌ | ✅ `complete(value)`, `completeExceptionally()` |
| Timeout | ❌ (only `get(timeout)`) | ✅ `orTimeout()`, `completeOnTimeout()` (Java 9+) |

**Q: What are common methods in `CompletableFuture`?**
**A:**
* **Creation:** `supplyAsync(supplier)` (returns value), `runAsync(runnable)` (no return).
* **Transform:** `thenApply(fn)` — transform result synchronously.
* **Chain async:** `thenCompose(fn)` — chain another `CompletableFuture` (flatMap equivalent).
* **Consume:** `thenAccept(consumer)` — consume result, return void.
* **Side effect:** `thenRun(runnable)` — run action after completion, ignore result.
* **Combine:** `thenCombine(other, biFunction)` — combine two independent results.
* **Wait for all:** `CompletableFuture.allOf(cf1, cf2, cf3)` — complete when all finish.
* **Wait for any:** `CompletableFuture.anyOf(cf1, cf2, cf3)` — complete when first finishes.
* **Timeout (Java 9+):** `orTimeout(5, TimeUnit.SECONDS)` — fail if not done in time.

**Q: What is a `ForkJoinPool` and give a real example?**
**A:** `ForkJoinPool` is designed for **recursive divide-and-conquer** tasks. It uses a **work-stealing algorithm**: each thread has its own **deque** (double-ended queue). When a thread's deque is empty, it **steals** tasks from the tail of another thread's deque, maximizing CPU utilization.

```
  Thread-1 deque: [A1] [A2] [A3]
  Thread-2 deque: [B1]             ← Thread-2 idle, steals A3 from Thread-1
  Thread-3 deque: []               ← Thread-3 idle, steals A2 from Thread-1
```

```java
// Parallel merge sort using ForkJoinPool
class MergeSortTask extends RecursiveAction {
    private final int[] array;
    private final int lo, hi;
    
    @Override
    protected void compute() {
        if (hi - lo < THRESHOLD) {
            Arrays.sort(array, lo, hi); // Base case: small array
            return;
        }
        int mid = (lo + hi) / 2;
        invokeAll(
            new MergeSortTask(array, lo, mid),   // Fork left half
            new MergeSortTask(array, mid, hi)     // Fork right half
        );
        merge(array, lo, mid, hi);               // Join results
    }
}
```

> **Production context:** `ForkJoinPool.commonPool()` is used by `parallelStream()` and `CompletableFuture`. Its size = `availableProcessors() - 1`. Override with `-Djava.util.concurrent.ForkJoinPool.common.parallelism=N` if needed — but be cautious, as all parallel streams in the JVM share this single pool.
