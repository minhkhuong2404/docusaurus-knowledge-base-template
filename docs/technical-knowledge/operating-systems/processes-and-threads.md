---
id: processes-and-threads
title: Processes & Threads
description: Deep dive into processes, threads, their lifecycle, memory layout, context switching, and Java/JVM perspective on concurrency primitives.
tags:
  - operating-systems
  - processes
  - threads
  - concurrency
  - jvm
  - java
sidebar_position: 1
---

# Processes & Threads

## Process

A **process** is an instance of a program in execution. It is the fundamental unit of work managed by the OS.

### Process Memory Layout

```
High Address
┌──────────────────────┐
│       Stack          │ ← grows downward (local vars, call frames)
├──────────────────────┤
│          ↓           │
│                      │
│          ↑           │
├──────────────────────┤
│        Heap          │ ← grows upward (dynamic allocation)
├──────────────────────┤
│   BSS Segment        │ ← uninitialized global/static variables
├──────────────────────┤
│   Data Segment       │ ← initialized global/static variables
├──────────────────────┤
│   Text Segment       │ ← program code (read-only)
Low Address
```

### Process Control Block (PCB)

The OS maintains a **PCB** for each process containing:

| Field | Description |
|---|---|
| PID | Unique process identifier |
| Process State | Running, Ready, Waiting, etc. |
| Program Counter | Address of next instruction |
| CPU Registers | Saved register values |
| Memory Info | Page tables, limits |
| I/O Status | Open files, devices |
| Scheduling Info | Priority, CPU time used |

### Process States

```
         fork()
New ──────────────► Ready ◄─────────────────────────┐
                      │                              │
               scheduler                       I/O complete /
               dispatch                        event occurs
                      │                              │
                      ▼                              │
                  Running ──── I/O request ──► Waiting
                      │
                   exit()
                      │
                      ▼
                 Terminated
```

### Process Creation

- **Unix/Linux**: `fork()` creates a child process (copy-on-write); `exec()` replaces the process image.
- **Windows**: `CreateProcess()` API.

```c
pid_t pid = fork();
if (pid == 0) {
    // child process
    execl("/bin/ls", "ls", "-l", NULL);
} else {
    // parent process
    wait(NULL);
}
```

### Inter-Process Communication (IPC)

| Mechanism | Description | Latency |
|---|---|---|
| Pipes | Unidirectional byte stream | Low |
| Named Pipes (FIFOs) | Pipe with a name in filesystem | Low |
| Message Queues | Kernel-managed queue of messages | Medium |
| Shared Memory | Processes map the same physical pages | Lowest |
| Sockets | Network-capable, bidirectional | High |
| Signals | Asynchronous notifications | Very Low |
| Semaphores | Synchronization primitive | Low |

---

## Threads

A **thread** is the smallest unit of CPU execution. Threads within the same process share:
- Code segment
- Data segment
- Heap
- Open file descriptors

Each thread has its own:
- Stack
- Program Counter
- Register set
- Thread ID

### Why Threads?

- **Responsiveness**: UI thread stays live while worker threads process.
- **Resource Sharing**: Cheaper than fork (no address-space copy).
- **Economy**: Thread creation is ~10–100× faster than process creation.
- **Scalability**: Exploit multi-core CPUs.

### User-Level vs Kernel-Level Threads

| | User-Level Threads | Kernel-Level Threads |
|---|---|---|
| Management | By user-space library | By OS kernel |
| Context Switch | Fast (no syscall) | Slow (syscall required) |
| Blocking | One block blocks all | Independent blocking |
| Parallelism | No (unless M:N) | Yes (one per core) |
| Examples | Green threads (old JVM) | POSIX pthreads, Java threads (modern) |

### Threading Models

- **1:1** (One-to-One): Each user thread maps to one kernel thread. (**Java uses this**.)
- **M:1** (Many-to-One): Many user threads → one kernel thread. No true parallelism.
- **M:N** (Many-to-Many): M user threads → N kernel threads. Best of both worlds (e.g., Go goroutines with GOMAXPROCS).

---

## Context Switching

When the CPU switches from one process/thread to another:

1. Save current process state → PCB.
2. Update PCB state (Running → Ready/Waiting).
3. Select next process (scheduler).
4. Load state from new process's PCB.
5. Resume execution.

**Cost**: Pure overhead — no useful work during a context switch. Typical cost: 1–10 µs.

---

## Java / JVM Perspective

### Java Threads

```java
// Option 1: extend Thread
class MyThread extends Thread {
    public void run() { /* ... */ }
}

// Option 2: implement Runnable (preferred)
Thread t = new Thread(() -> System.out.println("Hello"));
t.start();

// Option 3: ExecutorService (production use)
ExecutorService pool = Executors.newFixedThreadPool(4);
pool.submit(() -> doWork());
pool.shutdown();
```

### Java Thread States

```
NEW → RUNNABLE ⇌ BLOCKED / WAITING / TIMED_WAITING → TERMINATED
```

- **NEW**: Thread created but not started.
- **RUNNABLE**: Running or ready in JVM.
- **BLOCKED**: Waiting for monitor lock.
- **WAITING**: `wait()`, `join()`, `LockSupport.park()` — no timeout.
- **TIMED_WAITING**: `sleep(n)`, `wait(n)`, `join(n)`.
- **TERMINATED**: `run()` completed.

### Virtual Threads (Java 21+)

Java 21 introduced **Virtual Threads** (Project Loom) — lightweight user-mode threads managed by the JVM, not the OS:

```java
// Create a virtual thread
Thread vt = Thread.ofVirtual().start(() -> doBlockingWork());

// Via ExecutorService
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> doWork());
}
```

- Millions can exist concurrently.
- Automatically unmount from OS thread when blocking (I/O, sleep, etc.).
- Great for high-throughput server applications.

---

## Common Interview Questions

### Q1: What is the difference between a process and a thread?

| | Process | Thread |
|---|---|---|
| Memory | Separate address space | Shared address space |
| Creation cost | High (fork + copy) | Low |
| Communication | IPC required | Shared memory directly |
| Crash isolation | Independent | One crash can kill all threads |

### Q2: What is a context switch and what are its costs?

A context switch saves CPU state of running process/thread and loads state of the next. Costs include: saving/restoring registers, potential TLB flush (address space change), cache pollution, and kernel overhead.

### Q3: What is a zombie process?

A process that has completed execution but its entry remains in the process table because the parent hasn't called `wait()` to read its exit status. Fix: always `wait()` or `waitpid()` in the parent.

### Q4: What is an orphan process?

A process whose parent has terminated before it. The OS re-parents it to `init` (PID 1) / `systemd`, which periodically calls `wait()`.

### Q5: How does `fork()` work with copy-on-write?

After `fork()`, parent and child share the same physical pages marked read-only. On the first write by either process, the OS creates a private copy of that page — no unnecessary copying upfront.

### Q6: What is the difference between `wait()` and `waitpid()`?

- `wait()`: Blocks until *any* child terminates.
- `waitpid(pid, ...)`: Blocks for a *specific* child; supports `WNOHANG` for non-blocking check.

### Q7: Can two threads in the same process have different priorities?

Yes. In Java: `thread.setPriority(Thread.MAX_PRIORITY)`. However, actual scheduling depends on the OS; priority is a hint, not a guarantee.

---

## Advanced Editorial Pass: Process and Thread Model Under Real Workloads

### Senior Engineering Focus
- Choose concurrency boundaries around isolation and recovery semantics, not only speed.
- Understand context-switch and scheduling cost in queue-heavy systems.
- Map thread ownership and lifecycle to service responsibilities.

### Failure Modes to Anticipate
- Thread-per-request models that collapse under blocking dependencies.
- Runaway thread growth causing memory pressure and scheduler thrashing.
- Hidden shared state producing non-deterministic failures.

### Practical Heuristics
1. Set explicit thread pool budgets and saturation behavior.
2. Separate CPU-bound and I/O-bound executors.
3. Track runnable/blocked states in production continuously.

### Compare Next
- [CPU Scheduling](./cpu-scheduling.md)
- [Synchronization & Deadlocks](./synchronization-and-deadlocks.md)
- [Interview Questions](./interview-questions.md)
