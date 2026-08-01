---
id: processes-and-threads
title: Processes & Threads — Complete Guide
sidebar_label: Processes & Threads
description: A complete guide to processes and threads — memory layout, lifecycles, IPC, threading models, context switching, Java concurrency, virtual threads, thread pool tuning, memory visibility, and production patterns. Beginner through senior depth.
tags: [operating-systems, processes, threads, concurrency, jvm, java, virtual-threads, context-switching, ipc, thread-pool]
sidebar_position: 1
---

import OsProcessesThreadsDiagram from '@site/src/components/OsProcessesThreadsDiagram';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Processes & Threads — Complete Guide

<OsProcessesThreadsDiagram />

---

:::info[Who this guide is for]
- **New learners** — start at [What is a Process?](#what-is-a-process) and [What is a Thread?](#what-is-a-thread) to build the foundational mental model before looking at concurrency.
- **Senior engineers** — jump to [Context Switching Internals](#context-switching-internals), [Java Thread Pool Tuning](#java-thread-pool-tuning), [Memory Visibility](#memory-visibility--the-jmm), [Virtual Threads](#virtual-threads-java-21--project-loom), or [Production Patterns](#production-patterns).
:::

---

## What is a Process?

A **process** is a running instance of a program. When you double-click a Java application or run `java -jar app.jar`, the OS loads the executable binary from disk into memory, creates a dedicated process structure to execute it, and assigns it isolated system resources (virtual address space, CPU time slices, open file descriptors, and security tokens).

The key word is **isolated** — each process operates within its own private virtual memory space mapped by the CPU Memory Management Unit (MMU). Process A cannot read or write Process B's memory without explicit kernel authorization (IPC). This strict isolation prevents faulty applications from corrupting each other's memory or crashing the host system.

### The restaurant analogy

| Restaurant concept | OS equivalent |
|------------------|---------------|
| The restaurant building | Your computer |
| One restaurant kitchen | One process (isolated resources) |
| Cooks working in that kitchen | Threads (share the kitchen's tools) |
| Walls between restaurants | Process memory isolation |
| Shouting through a window to the next restaurant | Inter-process communication (IPC) |
| A cook opening the refrigerator | Thread accessing shared heap memory |

Two restaurants cannot share their refrigerators directly (different process memory). But all cooks in the same kitchen can reach into the same fridge (shared heap within one process).

### Process memory layout

When the OS loads an ELF binary into virtual memory on Linux (x86_64), it structures the virtual memory address space from low to high memory addresses:

1. **Text Segment (Code)**: Read-only memory containing compiled machine instructions. Shared across process instances running the same executable binary.
2. **Data Segment (Initialized)**: Global and static variables explicitly initialized in source code (e.g., `static int count = 10;`).
3. **BSS Segment (Uninitialized)**: Global and static variables initialized to zero or uninitialized in code (`static int buffer[1024];`). Occupies zero disk space in binary executable.
4. **Heap Segment**: Dynamically allocated memory created at runtime (`malloc()` in C, `new` in Java). Grows upward toward higher addresses.
5. **Memory Mapping Segment (mmap)**: Shared libraries (`libc.so`), mapped files, and anonymous shared memory regions.
6. **Stack Segment**: Stores function stack frames, local variables, return addresses, and register states. Grows downward toward lower addresses.

```
+-----------------------------------+  High Memory (0x7FFF...)
| Kernel Space (Restricted Ring 0)  |
+-----------------------------------+  User/Kernel Boundary
| Stack Segment (Grows Downward v)  |
|   - Local Variables               |
|   - Function Frame Pointers       |
|                                   |
|   v   v   v   v   v   v   v   v   |
|                                   |
|   ^   ^   ^   ^   ^   ^   ^   ^   |
| Memory Mapping Segment (mmap)     |
| Heap Segment (Grows Upward ^)     |
|   - Dynamic Memory Allocations    |
+-----------------------------------+
| BSS Segment (Uninitialized Data)  |
+-----------------------------------+
| Data Segment (Initialized Data)   |
+-----------------------------------+
| Text Segment (Compiled Code)      |  Low Memory (0x0040...)
+-----------------------------------+
```

**Important:** The stack and heap grow toward each other. A **StackOverflowError** occurs when recursive function calls push stack frames past the thread's allocated stack limit, colliding with heap or invalid memory pages.

---

## Process Control Block (PCB)

The OS kernel maintains a **Process Control Block (PCB)** (`struct task_struct` in Linux) for every process. It acts as the process's identity card — storing all execution state needed by the CPU scheduler to suspend and resume the process seamlessly.

### Contents of PCB
- **Process ID (PID)** & Parent Process ID (PPID).
- **Process State**: New, Ready, Running, Waiting (Blocked), Terminated (Zombie).
- **CPU Registers**: Program Counter (PC), Accumulator, Stack Pointer (SP), General Purpose Registers.
- **CPU Scheduling Info**: Priority (`nice` value), virtual runtime (`vruntime`), remaining time slice.
- **Memory Management Info**: Page table base register (CR3 in x86), page directory pointers.
- **Accounting & Resource Info**: CPU time consumed, memory limits, cgroups resource controls.
- **I/O State**: Open File Descriptor table (0: stdin, 1: stdout, 2: stderr), socket pointers, locking state.

### Process Lifecycle States

| State | What it means |
|-------|--------------|
| **New** | Process being created by kernel — loading code, allocating PCB, not yet admitted to ready queue. |
| **Ready** | Process loaded in RAM, fully initialized, waiting in scheduler queue for CPU time slice. |
| **Running** | Currently executing machine instructions on an active CPU core. |
| **Waiting (Blocked)** | Suspended by OS while waiting for an asynchronous event (disk I/O, socket data, mutex lock). Does not consume CPU cycles. |
| **Terminated (Zombie)** | Execution completed (`exit()`). Resources released, but entry remains in kernel process table until parent reads exit code via `waitpid()`. |

### Zombie and Orphan processes

- **Zombie Process**: A process that has finished execution via `exit()` but still occupies an entry in the kernel's process table because its parent process has not yet executed `wait()` or `waitpid()` to read its return status code. Zombies consume zero RAM or CPU, but exhaust limited Process Table entries (`/proc/sys/kernel/pid_max`). If all PIDs are consumed by zombies, no new processes can spawn.
- **Orphan Process**: A process whose parent process crashed or terminated before calling `wait()`. The Linux kernel automatically reparents orphan processes to `init` (PID 1) or systemd, which periodically invokes `wait()` to reap orphaned child processes cleanly.

```bash
# Find zombie processes on Linux
ps aux | grep 'Z'

# Inspect zombie count in process table
ps -eo state,pid,ppid,cmd | grep '^Z'
```

---

## Threading Models

A **thread** is the smallest unit of execution that the OS kernel can schedule. Threads within the same process share the same virtual address space (Heap, Text, Data, Open File Descriptors), but each thread retains its own private:
- Program Counter (PC)
- CPU Register Set
- Call Stack (local variables, frame pointers)

| Model | Mapping | Parallelism | Used by | Trade-off |
|-------|---------|:-----------:|---------|-----------|
| **1:1 (Kernel Level)** | 1 user thread = 1 kernel thread | ✅ True Multi-Core | Modern Java, Linux `nptl`, C++ `std::thread` | OS kernel overhead per thread (~1MB stack, context switch costs). |
| **M:1 (User Level)** | N user threads = 1 kernel thread | ❌ Single-Core Only | Legacy Green Threads, early Python | Fast creation, but one blocking call blocks all N user threads. |
| **M:N (Hybrid)** | M user threads = N kernel threads | ✅ True Multi-Core | Go (Goroutines), Erlang, Java 21 Virtual Threads | Maximum concurrency, complex JVM/runtime scheduler mechanics. |

### Java's threading model evolution

1. **Java 1.1 (Green Threads)**: M:1 threading. The JVM scheduled all user threads on a single OS kernel thread. Fast creation, but could not utilize multi-core CPUs.
2. **Java 1.2 – 20 (Platform Threads)**: 1:1 threading. Each `java.lang.Thread` maps directly to an OS kernel thread (`pthread`). Provides true multi-core parallel execution, but scaling is capped at ~5,000–10,000 threads per JVM due to OS stack allocation (~1MB per thread) and context switching overhead.
3. **Java 21+ (Virtual Threads / Project Loom)**: M:N threading. Millions of lightweight virtual threads run on top of a small pool of OS carrier threads (N = available CPU cores). When a virtual thread blocks on network or database I/O, the JVM unmounts it from the carrier thread, freeing the carrier thread to execute other virtual threads.

### Java Thread States

```
                 +-------------+
                 |     NEW     |
                 +------+------+
                        | .start()
                        v
                 +-------------+
        +------->|  RUNNABLE   |<-------+
        |        +------+------+        |
        |               |               |
Lock    |               | Blocked on    | Timed wait /
Acquired|               | synchronized  | Notification
        |               v               |
        |        +-------------+        |
        |        |   BLOCKED   |        |
        |        +-------------+        |
        |                               |
        |        +-------------+        |
        +--------+   WAITING   +--------+
                 | TIMED_WAIT  |
                 +-------------+
                        |
                        | run() returns
                        v
                 +-------------+
                 | TERMINATED  |
                 +-------------+
```

| State | Trigger | How to resume |
|-------|---------|--------------|
| `NEW` | `new Thread()` instantiated | Call `.start()` |
| `RUNNABLE` | `.start()` invoked | OS CPU scheduler selects it for execution |
| `BLOCKED` | Waiting to enter a `synchronized` block/method locked by another thread | Holds thread until owner releases monitor lock |
| `WAITING` | `Object.wait()`, `Thread.join()`, or `LockSupport.park()` | Woken by `notify()`, `notifyAll()`, or `unpark()` |
| `TIMED_WAITING` | `Thread.sleep(ms)`, `Object.wait(ms)`, `Thread.join(ms)` | Timer expires or thread is interrupted |
| `TERMINATED` | `run()` method returns normally or throws unhandled exception | Cannot be restarted |

---

## Memory Visibility & The Java Memory Model (JMM)

Modern multi-core CPUs use multi-level hardware caches (L1, L2, L3) and out-of-order execution to maximize performance. Without memory synchronization barriers, CPU cores store writes in local store buffers before flushing them to main memory (RAM).

```
+------------------------+      +------------------------+
|  CPU Core 0 (Thread A) |      |  CPU Core 1 (Thread B) |
|  - L1/L2 Cache         |      |  - L1/L2 Cache         |
|  - Store Buffer        |      |  - Store Buffer        |
+-----------+------------+      +-----------+------------+
            |                               |
            +---------------+---------------+
                            |
                            v
            +-------------------------------+
            |  Shared L3 Cache & Main RAM   |
            +-------------------------------+
```

### The happens-before relationship

The **Java Memory Model (JMM)** defines a formal specification guaranteeing that memory writes by Thread A are visible to reads by Thread B if a **happens-before** edge exists:

1. **Volatile Rule**: A write to a `volatile` variable happens-before every subsequent read of that same `volatile` variable.
2. **Monitor Lock Rule**: An unlock of a `synchronized` block/method happens-before every subsequent lock acquisition on the same monitor.
3. **Thread Start Rule**: A call to `Thread.start()` happens-before any action in the started thread.
4. **Thread Join Rule**: All actions in a thread happen-before any other thread successfully returns from `Thread.join()` on that thread.

### volatile vs synchronized vs AtomicXxx

- **`volatile`**: Guarantees **visibility** (flushes store buffers to main RAM) and **ordering** (prevents instruction reordering across volatile memory barriers). Does NOT guarantee **atomicity** — compound operations like `count++` (read-modify-write) are not thread-safe with `volatile` alone.
- **`synchronized`**: Guarantees **mutual exclusion** (only one thread inside critical section) AND **visibility** AND **ordering**.
- **`java.util.concurrent.atomic.AtomicInteger`**: Uses low-level CPU Compare-And-Swap (`CAS`) hardware instructions for lock-free atomic updates (`LOCK CMPXCHG` on x86).

---

## Virtual Threads (Java 21+ / Project Loom)

Virtual threads are lightweight threads managed entirely by the JVM runtime rather than the OS kernel.

### Platform threads vs Virtual threads

| Metric | Platform threads | Virtual threads |
|---|:-:|:-:|
| **Managed by** | OS Kernel (`pthread`) | JVM Runtime (`Continuation`) |
| **Default Stack Size** | ~1 MB (fixed OS memory page) | ~Few KB (dynamic chunked heap allocation) |
| **Creation Latency** | ~1 ms (kernel syscall) | ~1 µs (JVM memory allocation) |
| **Concurrency Ceiling** | ~10,000 per JVM | Millions per JVM |
| **Blocking I/O Handling** | OS thread blocked & idle | Virtual thread unmounted; OS carrier thread processes other work |
| **Ideal Workload** | CPU-heavy computations | I/O-heavy operations (DB queries, REST APIs) |

```java
// Create and launch 100,000 virtual threads concurrently
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -> {
        executor.submit(() -> {
            // Simulate blocking HTTP or DB query
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
} // Automatically waits for all 100,000 tasks to complete
```

### Carrier Thread Pinning Gotcha
A virtual thread is **pinned** to its underlying OS carrier thread when executing inside a native C method (JNI) or a `synchronized` block/method. While pinned, blocking I/O will block the OS carrier thread, negating virtual thread concurrency gains.
- **Fix**: Replace `synchronized` with `java.util.concurrent.locks.ReentrantLock` in virtual thread codebases.

---

## Production Patterns

<details>
<summary>🔬 Senior deep-dive: CompletableFuture for async orchestration</summary>

```java
@Service
public class OrderService {

    @Autowired private InventoryClient inventory;
    @Autowired private PaymentClient payment;
    @Autowired private NotificationClient notification;

    // ❌ Sequential: total time = inventory + payment + notification (180ms)
    public void processOrderSequential(Order order) {
        inventory.reserve(order);    // 50ms
        payment.charge(order);       // 100ms
        notification.send(order);    // 30ms
    }

    // ✅ Parallel: total time = max(inventory, payment) + notification (130ms)
    public CompletableFuture<Void> processOrderAsync(Order order) {
        CompletableFuture<Void> inventoryFuture =
            CompletableFuture.runAsync(() -> inventory.reserve(order));

        CompletableFuture<Void> paymentFuture =
            CompletableFuture.runAsync(() -> payment.charge(order));

        return CompletableFuture.allOf(inventoryFuture, paymentFuture)
            .thenRunAsync(() -> notification.send(order))
            .exceptionally(ex -> {
                log.error("Order processing failed: {}", ex.getMessage());
                return null;
            });
    }
}
```

</details>

<details>
<summary>🔬 Senior deep-dive: Thread dump inspection and deadlock diagnosis</summary>

```bash
# Generate non-intrusive JVM thread dump
jstack -l <pid> > thread_dump.txt

# Inspect thread counts by state
grep "java.lang.Thread.State" thread_dump.txt | sort | uniq -c

# Detect deadlocks automatically in dump
jstack -l <pid> | grep -A 15 "Found one Java-level deadlock"
```

</details>

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Calling `thread.run()` instead of `thread.start()` | Executes code synchronously on caller thread — no new OS/virtual thread created. | Always invoke `thread.start()`. |
| Unbounded thread creation (`new Thread()`) | Spawns thousands of OS threads, leading to memory exhaustion and kernel panics. | Use bounded `ThreadPoolExecutor` or virtual threads. |
| Leaking `ThreadLocal` in thread pools | Thread pool reuse exposes previous user's data to subsequent requests. | Always invoke `threadLocal.remove()` in a `finally` block. |
| Using `synchronized` in Virtual Threads | Pins virtual thread to carrier OS thread during blocking I/O operations. | Replace `synchronized` with `ReentrantLock`. |
| Unbounded queues in ThreadPoolExecutor | Queue grows indefinitely under heavy load, concealing latency spikes until OOM. | Always set queue capacity: `new ArrayBlockingQueue<>(1000)`. |

---

## Interview Questions

### Q1. What is the fundamental difference between a process and a thread?
> A process is an isolated execution environment with its own private virtual memory space (code, heap, stack, data, file descriptors) managed by the OS MMU. A thread is an execution context within a process; threads in the same process share the heap, text, and data segments but maintain private stacks, registers, and program counters. Process communication requires kernel-managed IPC (pipes, sockets, shared memory), whereas threads communicate directly via shared heap memory.

### Q2. What happens during a thread context switch and what are its costs?
> A thread context switch occurs when the OS CPU scheduler saves the executing thread's register state (Program Counter, Stack Pointer, general-purpose registers) into its task structure and restores another thread's saved register state. Costs include: (1) Direct CPU cycle overhead saving/restoring register state (1–5µs); (2) CPU L1/L2 cache invalidation and pollution as the new thread populates cache lines; (3) TLB (Translation Lookaside Buffer) flushes if switching across process boundaries.

### Q3. What is the difference between BLOCKED, WAITING, and TIMED_WAITING in Java?
> `BLOCKED` indicates a thread is waiting to acquire a Java monitor lock (`synchronized` block) currently held by another thread. `WAITING` indicates a thread is indefinitely suspended waiting for another thread to perform a specific action (`Object.wait()`, `Thread.join()`, `LockSupport.park()`). `TIMED_WAITING` is identical to WAITING but includes a maximum sleep timeout (`Thread.sleep(ms)`, `Object.wait(ms)`).

### Q4. What are Virtual Threads in Java 21 and how do they handle blocking I/O?
> Virtual threads (Project Loom) are JVM-managed lightweight threads multiplexed over a small pool of OS carrier threads (1 per CPU core). When a virtual thread executes a blocking I/O call (socket read, JDBC query, sleep), the JVM intercepts the call, unmounts the virtual thread's stack frames from the carrier thread, and parks it in the JVM heap. The carrier thread immediately executes other virtual threads. Once I/O completes, the JVM remounts the virtual thread onto an available carrier thread.

### Q5. What is a Zombie Process and how do you prevent Zombie leaks?
> A zombie process is a process that has completed execution via `exit()` but retains its entry in the kernel's process table because its parent process has not yet executed `wait()` or `waitpid()`. To prevent zombie leaks, parent processes must handle `SIGCHLD` signals and reap child processes via `waitpid(-1, WNOHANG)`. If a parent process terminates, the kernel automatically reparents orphaned zombies to `init` (PID 1) for automatic cleanup.

---

## See Also

- [CPU Scheduling](./cpu-scheduling.md)
- [Synchronization & Deadlocks](./synchronization-and-deadlocks.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
