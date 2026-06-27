---
id: java-interview-answers-part-2
title: Java Interview Q&A - Multithreading & Concurrency
description: Comprehensive answers to Java Multithreading and Concurrency interview questions.
sidebar_position: 4
tags: [java, interview, multithreading, concurrency, answers]
---

# Java Interview Questions & Answers: Part 2

This guide covers advanced concepts in multithreading, concurrency, memory models, synchronization primitives, and thread pool design.

---

## Multithreading and Concurrency

### 1. What is a Thread and how does it differ from a Process?

* **Process:** An executing instance of an application, isolated by the Operating System. It has its own dedicated address space, file descriptors, and security context. Communication between processes requires Inter-Process Communication (IPC).
* **Thread:** A lightweight path of execution within a process. Multiple threads share the process's heap memory, file descriptors, and system resources. However, each thread maintains its own private program counter (PC), CPU registers, and call stack (~1MB by default).

---

### 2. Difference between `CountDownLatch` and `CyclicBarrier`?

Both are synchronization utilities that block threads until a specific state is reached, but they differ in design and behavior:

| Feature | CountDownLatch | CyclicBarrier |
|:--------|:---------------|:--------------|
| **Reusability** | **One-time use.** Once the count reaches 0, it cannot be reset. | **Reusable.** The barrier resets automatically (or manually via `.reset()`) after threads are released. |
| **Mechanics** | Threads wait on the latch (`await()`), while other threads decrement the count (`countDown()`). | Threads call `await()` to block themselves at a barrier until a set number of threads arrive. |
| **Barrier Action** | None. | Supports an optionalRunnable action executed when the barrier is tripped. |
| **Use Case** | Waiting for startup dependencies to initialize before launching a service. | Parallel split-merge computations (e.g. multi-agent simulations). |

---

### 3. What is the Java Memory Model (JMM)?

The JMM defines how the JVM interacts with computer hardware memory (CPU registers, CPU caches, RAM). It specifies the rules for variable visibility and instruction ordering across threads.

#### Core Guarantees

1. **Visibility:** Changes made to a variable by one thread must be visible to other threads. Without synchronization or `volatile`, changes can remain buffered in CPU caches.
2. **Ordering:** The compiler, JVM, and CPU can reorder instructions for performance. The JMM defines **Happens-Before** relationships to prevent ordering anomalies.

#### Happens-Before Rules
- **Program Order Rule:** Actions within a single thread happen before subsequent actions in that thread.
- **Monitor Lock Rule:** An unlock on a monitor happens before every subsequent lock on that same monitor.
- **Volatile Variable Rule:** A write to a volatile field happens before every subsequent read of that same field.
- **Thread Start/Join Rule:** `Thread.start()` happens before any action in the started thread. A thread's completion happens before `Thread.join()` returns.

---

### 4. Double-Checked Locking (DCL) & the need for `volatile`

DCL is a lazy-initialization optimization for Singletons:

```java
public class Singleton {
    private static volatile Singleton instance; // volatile is MANDATORY

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                   // 1st Check (No Lock)
            synchronized (Singleton.class) {       // Lock block
                if (instance == null) {             // 2nd Check (With Lock)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

#### Why `volatile` is mandatory
The initialization instruction `instance = new Singleton();` is compiled into three steps:
1. Allocate memory space for the `Singleton` object.
2. Invoke the constructor to initialize fields.
3. Assign the memory address to the `instance` variable.

Without `volatile`, the compiler/CPU can reorder these steps to `1 → 3 → 2`. If Thread A executes 1 and 3, `instance` becomes non-null. If Thread B calls `getInstance()` at this moment, it sees `instance != null` and returns the reference. However, since step 2 has not run yet, Thread B accesses a **partially initialized object**, causing unpredictable runtime errors. `volatile` enforces a memory barrier preventing this reordering.

---

### 5. What is a ThreadLocal variable and its memory leak hazard?

`ThreadLocal` provides thread-confined variables. Each thread holds a hidden map (`ThreadLocalMap`) where the `ThreadLocal` object is the key and the thread's value is the mapped entry.

```java
public class UserContext {
    private static final ThreadLocal<User> context = new ThreadLocal<>();

    public static void set(User user) { context.set(user); }
    public static User get() { return context.get(); }
    public static void clear() { context.remove(); } // CRITICAL!
}
```

#### The Memory Leak Hazard
In application servers (like Tomcat), threads are reused via thread pools. If you write a value to a `ThreadLocal` and do not call `.remove()`, the value remains referenced by the thread's `ThreadLocalMap`. 
Since the thread lives as long as the application server, the class loader and all referenced objects (which can include heavy domain objects) cannot be garbage collected, creating a **ClassLoader memory leak**.

**Best Practice:** Always call `ThreadLocal.remove()` in a `finally` block or filter chain interceptor when a request lifecycle ends.

---

### 6. Thread Pool Rejection Policies

When a task is submitted to an `ExecutorService` but the thread pool queue is full, the configured `RejectedExecutionHandler` is triggered:

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    2, 4, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100),
    new ThreadPoolExecutor.CallerRunsPolicy() // Rejection Policy
);
```

#### Built-in Policies
1. **`AbortPolicy` (Default):** Throws `RejectedExecutionException` immediately.
2. **`CallerRunsPolicy`:** The thread submitting the task (e.g. the HTTP request thread) executes the task itself. This acts as a natural **backpressure** mechanism, slowing down incoming requests.
3. **`DiscardPolicy`:** Silently drops the rejected task without exception.
4. **`DiscardOldestPolicy`:** Discards the oldest unhandled task in the queue and retries executing the new task.

---

### 7. Busy Spin vs. Yield vs. Park

How a thread waits for a condition to be met:

* **Busy Spin:** Continuously evaluates a condition in an empty loop (`while (!condition);`).
  - **Pros:** Ultra-low latency. Avoids the cost of context switching (~1-10 microseconds) and keeps the CPU cache warm.
  - **Cons:** Consumes 100% of a CPU core's cycles, generating significant heat and power overhead. Useful only for ultra-low latency trading systems.
* **`Thread.yield()`:** Hints to the thread scheduler that the thread is willing to give up its remaining slice of CPU time to another thread of equal priority. The scheduler can ignore this hint.
* **`LockSupport.park()`:** Suspends the thread, moving it out of the OS scheduling queue entirely. The thread does not consume any CPU cycles. It is woke up via `LockSupport.unpark(thread)`. This is the mechanism underlying modern concurrency locks.