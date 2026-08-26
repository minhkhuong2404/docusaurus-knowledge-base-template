---
id: java-multithreading-interview
title: Java Multithreading Interview Questions
sidebar_label: Multithreading
description: Senior-level Java multithreading interview questions covering threading models, OS context switching, thread lifecycle, and HotSpot JVM native integration.
tags: [java, interview, multithreading, concurrency]
---

# Java Multithreading Interview Questions & Answers

---

## Technical Overview & Core Questions

### Q1. What is the fundamental difference between Process-based Multitasking and Thread-based Multithreading?
> **Process-based Multitasking** executes independent application processes concurrently, where each process owns an isolated virtual address space (Heap, Stack, File Descriptors). Inter-Process Communication (IPC) requires heavy kernel mediation (sockets, named pipes, shared memory). **Thread-based Multithreading** executes light-weight concurrent execution units within a single process. All threads share the parent process's Heap memory and Metaspace, retaining only private thread-local Stacks and Program Counter (PC) registers. Thread switching is significantly faster as it avoids TLB (Translation Lookaside Buffer) flushes.

### Q2. Why is multithreading preferred over process-based multitasking for internal application concurrency?
> 1. **Lower Creation Overhead**: Allocating a Java thread costs $\approx 512\text{ KB}\text{--}1\text{ MB}$ of stack memory versus copying full process page directory tables.
> 2. **Faster Context Switching**: Context switching between threads in the same process takes $\approx 1\text{--}3\text{ }\mu\text{s}$ (register & stack frame swaps) compared to $\approx 10\text{--}100\text{ }\mu\text{s}$ for process context switching (which requires swapping Page Table Base Registers and invalidating TLB entries).
> 3. **Direct Memory Sharing**: Threads communicate natively by passing object references in shared Heap RAM without serialization overhead.

### Q3. What is the Java "Main Thread" and how does the JVM manage its initialization and shutdown?
> The **Main Thread** is the initial user thread spawned by the JVM native launcher (`java.exe` / `java`). It initializes JVM subsystems (ClassLoader, Metaspace, GC worker threads), loads the entry-point class, and executes `public static void main(String[] args)`. The JVM process remains active until all non-daemon user threads terminate, unless `System.exit()` is explicitly invoked.

### Q4. What is the difference between User Threads and Daemon Threads in Java?
> **User Threads** are high-priority application threads that keep the JVM process alive. The JVM will **not** terminate as long as at least one user thread remains active. **Daemon Threads** (e.g., GC workers, Finalizer, JIT compiler threads) are background support threads. When the last user thread completes, the JVM abruptly shuts down, terminating all daemon threads immediately without waiting for their `finally` blocks to execute.

### Q5. What is CPU Context Switching and what metrics should be monitored to detect thread contention?
> Context switching is the hardware and OS process of storing a running thread's state (Program Counter, CPU registers, Stack Pointer) into its Thread Control Block (TCB) and loading the saved state of the next scheduled thread. Excessive context switching degrades throughput. On Linux, monitor via `vmstat 1` (column `cs`) or `pidstat -w`. A high non-voluntary context switch rate (`nvctxsw/s`) accompanied by high system CPU usage (`%sys`) signals high lock contention.

### Q6. What is the difference between invoking `Thread.start()` vs invoking `Thread.run()` directly?
> Invoking `Thread.start()` executes a native JVM call (`JVM_StartThread` $\to$ `pthread_create`), allocating a new OS kernel thread that asynchronously invokes `run()` on its private call stack. Invoking `run()` directly performs a standard synchronous method call in the **calling thread's context** without spawning a new OS thread.

### Q7. Can a terminated Java thread be restarted by calling `start()` again?
> No. Once a Java thread reaches the `TERMINATED` state, its underlying native OS thread is destroyed. Calling `start()` a second time on the same `Thread` instance throws an `IllegalThreadStateException`. To re-execute tasks, reuse threads via an `ExecutorService` thread pool.

### Q8. What is the difference between `Runnable` and `Callable` in Java?
> - **`Runnable`:** Defines a task with `void run()`. It cannot return a result to the caller and cannot throw checked exceptions.
> - **`Callable<V>`:** Introduced in Java 5 (`java.util.concurrent`), defines a task with `V call() throws Exception`. It returns a parameterized result `V` and can throw checked exceptions. When submitted to an `ExecutorService`, it returns a `Future<V>` representing the asynchronous result.

### Q9. How does `Thread.join()` work internally?
> `Thread.join()` causes the current executing thread to pause (`WAITING` state) until the target thread on which `join()` was called completes execution.
> - **Under the hood:** `join()` is implemented using a `while(isAlive()) { wait(0); }` synchronized loop on the target `Thread` object instance.
> - **JVM Termination Signal:** When a native thread completes its execution, the HotSpot JVM automatically calls `notifyAll()` on that `Thread` object, waking up all threads waiting on its join lock.

### Q10. What is Thread Interruption and how do `isInterrupted()` vs `Thread.interrupted()` differ?
> Thread interruption is a cooperative mechanism: calling `t.interrupt()` sets an internal boolean interrupt status flag on thread `t`. If `t` is currently in a sleeping/waiting state (`sleep()`, `wait()`, `join()`), it clears the flag and throws `InterruptedException`.
> - **`t.isInterrupted()` (Instance Method):** Returns `true` if thread `t` is interrupted. **Does NOT clear** the interrupt status flag.
> - **`Thread.interrupted()` (Static Method):** Checks if the **current thread** is interrupted AND **clears the interrupt flag** (resets it to `false`).

### Q11. What is Deadlock and how can it be diagnosed and prevented?
> Deadlock occurs when two or more threads are blocked forever, each waiting for a lock held by the other (circular dependency).
> - **Diagnosis:** Generate a thread dump via `jcmd <pid> Thread.print`, `jstack <pid>`, or programmatically via `ManagementFactory.getThreadMXBean().findDeadlockedThreads()`.
> - **Prevention Strategies:**
>   1. **Strict Lock Ordering:** Always acquire multiple locks in the exact same predefined global order.
>   2. **Lock Timeouts:** Use `ReentrantLock.tryLock(timeout, unit)` instead of intrinsic `synchronized` blocks.

### Q12. How does the `volatile` keyword work in Java?
> The `volatile` modifier ensures two main memory guarantees:
> 1. **Visibility:** Writes to a `volatile` variable are immediately flushed to main memory, and subsequent reads bypass CPU L1/L2 caches to read directly from main memory.
> 2. **Instruction Reordering Prevention:** The compiler and CPU hardware are forbidden from reordering reads/writes across a volatile access. HotSpot achieves this by inserting **CPU Memory Barriers** (such as `StoreLoad` fences).
> - **Limitation:** `volatile` does NOT guarantee atomicity for compound operations (e.g. `count++` requires read-modify-write, which is NOT atomic and needs `AtomicInteger` or `synchronized`).

---

## Native HotSpot JVM Execution Flow

```
Thread.start()
  └─► JVM_StartThread() (Native C++ Call)
        └─► os::create_thread()
              └─► pthread_create() (Linux/macOS Kernel API)
                    └─► Thread.run() (Executed in new OS Thread Context)
```

---

## See Also

- [Java Locks & Synchronization Primitives](../java/java-locks.md)
- [AbstractQueuedSynchronizer (AQS) Deep Dive](../java/java-aqs-internals.md)
- [Java Concurrent Collections](../interview-questions/java/concurrent-collection-interview.md)

