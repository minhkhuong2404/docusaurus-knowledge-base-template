---
id: java-multithreading-interview
title: Java Multithreading Interview Questions
sidebar_label: Multithreading
description: "Java multithreading interview questions covering threading models, lifecycle, and synchronization basics."
tags: [java, interview, multithreading, concurrency]
---

# Java Multithreading Interview Questions & Answers

These questions cover multitasking, multithreading, thread lifecycle, and internal mechanics of thread management in Java.

## 1. What is the difference between Multitasking and Multithreading?

* **Process-based Multitasking:** Executing several tasks simultaneously where each task is a separate independent process with its own memory space (e.g., running Chrome and an IDE at the same time). Processes communicate via IPC (pipes, sockets, shared memory).
* **Thread-based Multitasking (Multithreading):** Executing several tasks simultaneously where each task is a separate thread within the **same process**, sharing the same memory space (heap). Threads communicate by reading/writing shared variables.

### Key Distinction

| Aspect | Process | Thread |
|:-------|:--------|:-------|
| **Memory** | Separate address space | Shared heap, separate stack |
| **Creation cost** | Heavy (fork/exec, page table copy) | Light (~1MB stack allocation) |
| **Context switch** | Expensive (TLB flush, page table swap) | Cheap (only register/stack swap) |
| **Communication** | IPC (slow, serialization needed) | Shared memory (fast, but needs synchronization) |
| **Crash isolation** | One process crash doesn't affect others | One thread crash can kill the entire process |

## 2. Why is Multithreading better than Process-based Multitasking?

Multithreading is more efficient **for tasks within the same application** because:

* **Lightweight:** Threads share the heap memory of the parent process. Creating a thread in Java typically costs ~1MB of stack space vs. an entire address space copy for a process.
* **Lower Overhead:** Context switching between threads in the same process is ~100x faster than between processes because the CPU doesn't need to flush the TLB (Translation Lookaside Buffer) or swap page tables.
* **Inexpensive Communication:** Threads share the same heap, so data exchange is a simple pointer/reference share. Inter-process communication requires serialization → kernel buffer → deserialization.

**Caveat:** Multithreading introduces **shared-state complexity** — race conditions, deadlocks, and memory visibility issues that don't exist in process-based isolation.

## 3. What is the "Main Thread" in Java?

Every Java program has at least one thread called the **main thread**. It is created by the JVM when the program starts and is responsible for executing the `public static void main(String[] args)` method.

### What the main thread actually does:
1. Initializes the JVM (class loading, memory areas)
2. Loads the main class
3. Executes `main()` method
4. Spawns any child threads defined in the program
5. Waits for all non-daemon user threads to finish before allowing JVM shutdown

### Main thread properties:
```java
Thread mainThread = Thread.currentThread();
System.out.println(mainThread.getName());      // "main"
System.out.println(mainThread.getPriority());  // 5 (NORM_PRIORITY)
System.out.println(mainThread.isDaemon());     // false
System.out.println(mainThread.getThreadGroup().getName()); // "main"
```

## 4. User Threads vs. Daemon Threads

* **User Threads:** High-priority threads that keep the JVM alive. The JVM will **not** shut down until all user threads have finished execution. Examples: the main thread, any thread you create without calling `setDaemon(true)`.
* **Daemon Threads:** Background service threads. The JVM **will** exit as soon as all user threads have completed, forcefully terminating any remaining daemon threads (without calling finally blocks!).

### Built-in Daemon Threads
| Thread | Purpose |
|:-------|:--------|
| GC thread(s) | Garbage Collection |
| Finalizer thread | Calls `finalize()` methods |
| Signal Dispatcher | Handles OS signals (SIGTERM, etc.) |
| JIT Compiler threads | Background JIT compilation |

### Important Behaviors
```java
Thread t = new Thread(() -> {
    try {
        // This WILL be interrupted if all user threads finish
        Thread.sleep(Long.MAX_VALUE);
    } finally {
        // WARNING: This finally block MAY NOT execute for daemon threads!
        closeResources();
    }
});
t.setDaemon(true); // Must be called BEFORE start()
t.start();
```

**Production gotcha:** Never use daemon threads for tasks that require guaranteed cleanup (writing to files, flushing buffers, closing connections). Use shutdown hooks or `ExecutorService.shutdown()` instead.

## 5. How do you create a Thread in Java?

There are multiple ways, each with different trade-offs:

### Option 1: Extending the `Thread` class
```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Running in: " + Thread.currentThread().getName());
    }
}
MyThread t = new MyThread();
t.start(); // Creates a new OS thread
```
**Limitation:** Java doesn't support multiple inheritance. If your class already extends another class, this approach is impossible.

### Option 2: Implementing the `Runnable` interface
```java
class MyTask implements Runnable {
    @Override
    public void run() {
        System.out.println("Running in: " + Thread.currentThread().getName());
    }
}
Thread t = new Thread(new MyTask());
t.start();
```

### Option 3: Lambda expression (Java 8+)
```java
Thread t = new Thread(() -> System.out.println("Lambda thread"));
t.start();
```

### Option 4: `Callable` + `Future` (returns a result)
```java
ExecutorService executor = Executors.newSingleThreadExecutor();
Future<Integer> future = executor.submit(() -> {
    // Callable can return a value and throw checked exceptions
    return computeExpensiveResult();
});
Integer result = future.get(); // Blocks until result is ready
executor.shutdown();
```

### Option 5: `CompletableFuture` (non-blocking, composable)
```java
CompletableFuture.supplyAsync(() -> fetchUserFromDB(userId))
    .thenApply(user -> enrichWithProfile(user))
    .thenAccept(enrichedUser -> sendNotification(enrichedUser))
    .exceptionally(ex -> { log.error("Failed", ex); return null; });
```

## 6. Which is better: Extending `Thread` or Implementing `Runnable`?

**Implementing `Runnable` (or `Callable`) is always preferred** because:

1. **Composition over Inheritance:** Java doesn't support multiple inheritance. By implementing `Runnable`, your class can still extend another class.
2. **Separation of Concerns:** The task definition (`Runnable`) is decoupled from the execution mechanism (`Thread` or `ExecutorService`). The same `Runnable` can run in a thread pool without code changes.
3. **Thread Pool Compatibility:** `ExecutorService.submit()` accepts `Runnable`/`Callable`, not `Thread` subclasses. Modern Java code should almost never create raw threads.

**Modern best practice:** Don't create threads directly at all. Use `ExecutorService` for thread pool management:
```java
// DON'T: new Thread(task).start();
// DO:
ExecutorService pool = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors()
);
pool.submit(myRunnable);
```

## 7. What is Context Switching?

Context switching is the process of the CPU saving the state of the current thread and loading the state of the next thread to run.

### What gets saved/restored:
- **Program Counter (PC):** Which instruction to execute next
- **CPU Registers:** All general-purpose and floating-point register values
- **Stack Pointer:** Points to the thread's stack frame
- **Thread state:** RUNNABLE, WAITING, etc.

### Performance Cost

| Switch Type | Approximate Cost | Why |
|:-----------|:----------------|:----|
| Thread → Thread (same process) | ~1-10 μs | Register save/restore + scheduler overhead |
| Process → Process | ~10-100 μs | Above + TLB flush + page table swap |
| User → Kernel mode | ~0.1-1 μs | System call overhead |

**Why this matters in production:** Excessive context switching (thousands per second) is a sign of thread contention. Monitor with `vmstat` (Linux) or `pidstat -w`. Symptoms include high `%sys` CPU time and degraded throughput despite available CPU.

### The Thread Lifecycle (States)

```
NEW ──start()──→ RUNNABLE ──scheduler──→ RUNNING
                    ↑                       │
                    │                       ├── sleep()/wait()/join() → TIMED_WAITING/WAITING
                    │                       ├── synchronized (blocked) → BLOCKED
                    │                       │
                    └── notify()/timeout ───┘
                                            │
                                         run() completes → TERMINATED
```

Java `Thread.State` enum values:
- **NEW:** Created but `start()` not called yet
- **RUNNABLE:** Eligible to run (may or may not be on a CPU core)
- **BLOCKED:** Waiting to acquire a monitor lock (`synchronized`)
- **WAITING:** Indefinite wait (`wait()`, `join()`, `LockSupport.park()`)
- **TIMED_WAITING:** Bounded wait (`sleep(ms)`, `wait(ms)`, `join(ms)`)
- **TERMINATED:** `run()` method has completed

---

# Java Multithreading Interview Questions - Part 2

This section covers Daemon threads and the internal mechanics of starting threads in Java.

## 1. What is a Daemon Thread and how to create one?

A **Daemon thread** is a background service thread that does not prevent the JVM from exiting when the program finishes.

* **To Create:** Call `setDaemon(true)` on a thread object **before** calling `start()`.
* **To Check:** Use the `isDaemon()` method.
* **Important:** Calling `setDaemon(true)` after `start()` throws `IllegalThreadStateException`.

### Daemon Inheritance Rule
A thread created by a daemon thread is also a daemon thread by default. Similarly, a thread created by a user thread is a user thread by default. The child inherits the daemon status of its parent.

```java
Thread parent = new Thread(() -> {
    Thread child = new Thread(() -> {
        System.out.println("Child isDaemon: " + Thread.currentThread().isDaemon());
    });
    child.start(); // Child inherits parent's daemon status
});
parent.setDaemon(true);
parent.start();
// Output: "Child isDaemon: true"
```

## 2. Difference between `start()` and `run()` methods

This is a very common interview question that tests understanding of thread mechanics.

* **`start()`**: Performs three critical operations:
  1. Allocates a new native OS thread (via `pthread_create` on Linux/Mac or `CreateThread` on Windows)
  2. Transitions the thread from `NEW` to `RUNNABLE` state
  3. Schedules the thread for execution — the OS scheduler eventually calls `run()` in the new thread's context

* **`run()`**: Calling `run()` directly does **not** create a new thread. The code inside `run()` executes in the context of the **current thread** (usually the main thread), behaving like a normal method call.

```java
Thread t = new Thread(() -> 
    System.out.println("Thread: " + Thread.currentThread().getName())
);

t.run();   // Prints "Thread: main"     — NO new thread created
t.start(); // Prints "Thread: Thread-0" — new OS thread created
```

### What `start()` does internally (HotSpot JVM)
```
Thread.start() 
  → JVM_StartThread()  (native method)
    → new JavaThread()  (C++ thread object)
      → os::create_thread()  (OS-level thread)
        → pthread_create()  (Linux/Mac)
          → Thread.run()  (called by the new OS thread)
```

## 3. What happens if we override the `start()` method?

If you override `start()`, the standard thread creation process will **not** happen:
* Your custom `start()` runs like a regular method in the calling thread
* No new OS thread is created unless you call `super.start()`

```java
class BadThread extends Thread {
    @Override
    public void start() {
        // This runs in the CALLER'S thread, not a new thread
        System.out.println("Custom start: " + Thread.currentThread().getName());
        // super.start(); // Uncomment to actually create a thread
    }
    
    @Override
    public void run() {
        System.out.println("Run: " + Thread.currentThread().getName());
    }
}

new BadThread().start(); 
// Output: "Custom start: main" — run() is NEVER called!
```

**Rule:** Never override `start()`. Always override `run()` to define the thread's task.

## 4. Can we overload the `run()` method?

**Yes**, you can overload `run()` (e.g., `run(int i)`). However, `Thread.start()` will only ever call the **no-argument `run()`** method. Overloaded versions are treated as normal methods and must be called explicitly — they have nothing to do with the threading mechanism.

```java
class MyThread extends Thread {
    public void run() {
        System.out.println("Default run");
    }
    
    public void run(int x) {
        System.out.println("Overloaded run: " + x);
    }
}

MyThread t = new MyThread();
t.start();    // Calls run()     — "Default run" (in new thread)
t.run(42);    // Calls run(int)  — "Overloaded run: 42" (in current thread)
```

## 5. Can we restart a thread that has already finished?

**No.** Once a thread has completed its execution (reached the `TERMINATED` state), it cannot be restarted. Calling `start()` on the same thread object a second time throws `IllegalThreadStateException`.

### Why?
The underlying OS thread is destroyed when `run()` completes. The Java `Thread` object is just a wrapper — once the native thread is gone, there's nothing to restart. The thread's internal state machine is a one-way flow: `NEW → RUNNABLE → TERMINATED`.

### Solution: Thread Pools
If you need to re-execute the same task, use an `ExecutorService`. The pool manages thread lifecycle for you:
```java
ExecutorService pool = Executors.newFixedThreadPool(4);
Runnable task = () -> System.out.println("Working...");

pool.submit(task);  // First execution
pool.submit(task);  // Re-execution (different thread, same task)
pool.shutdown();
```

## 6. How to name a thread?

Java provides default names like `Thread-0`, `Thread-1`, etc. Custom names are **essential** for production debugging — when analyzing thread dumps or logs, `"OrderProcessorThread-1"` is infinitely more useful than `"Thread-47"`.

```java
// Via Constructor:
Thread t = new Thread(runnable, "PaymentProcessor-1");

// Via Setter:
t.setName("PaymentProcessor-1");

// Via Thread Factory (for pools — RECOMMENDED):
ExecutorService pool = Executors.newFixedThreadPool(4, new ThreadFactory() {
    private final AtomicInteger counter = new AtomicInteger(1);
    @Override
    public Thread newThread(Runnable r) {
        Thread t = new Thread(r, "OrderWorker-" + counter.getAndIncrement());
        t.setDaemon(false);
        return t;
    }
});
```

**Modern alternative:** Use Guava's `ThreadFactoryBuilder`:
```java
ThreadFactory factory = new ThreadFactoryBuilder()
    .setNameFormat("payment-worker-%d")
    .setDaemon(true)
    .build();
```

## 7. Thread Priority

Each thread has a priority value from 1 (MIN_PRIORITY) to 10 (MAX_PRIORITY), with 5 (NORM_PRIORITY) as default.

```java
thread.setPriority(Thread.MAX_PRIORITY); // 10
```

**Important:** Thread priority is a **hint** to the OS scheduler, not a guarantee. On most modern operating systems (Linux with CFS, Windows), Java thread priorities have minimal or no effect. The OS scheduler considers many factors beyond Java priority. **Never rely on thread priority for correctness.**

---
