---
id: processes-and-threads
title: Processes & Threads — Complete Guide
sidebar_label: Processes & Threads
description: A complete guide to processes and threads — memory layout, lifecycles, IPC, threading models, context switching, Java concurrency, virtual threads, thread pool tuning, memory visibility, and production patterns. Beginner through senior depth.
tags: [operating-systems, processes, threads, concurrency, jvm, java, virtual-threads, context-switching, ipc, thread-pool]
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Processes & Threads — Complete Guide

:::info[Who this guide is for]
- **New learners** — start at [What is a Process?](#what-is-a-process) and [What is a Thread?](#what-is-a-thread) to build the foundational mental model before looking at concurrency.
- **Senior engineers** — jump to [Context Switching Internals](#context-switching-internals), [Java Thread Pool Tuning](#java-thread-pool-tuning), [Memory Visibility](#memory-visibility--the-jmm), [Virtual Threads](#virtual-threads-java-21--project-loom), or [Production Patterns](#production-patterns).
:::

---

## What is a Process?

A **process** is a running instance of a program. When you double-click a Java application or run `java -jar app.jar`, the OS loads the program from disk into memory, creates a process to run it, and assigns it resources (memory, CPU time, file handles).

The key word is **isolated** — each process has its own private memory space. Process A cannot read or write Process B's memory without going through the OS. This isolation is both a safety feature and a performance cost.

### The restaurant analogy

| Restaurant concept | OS equivalent |
|------------------|---------------|
| The restaurant building | Your computer |
| One restaurant kitchen | One process (isolated resources) |
| Cooks working in that kitchen | Threads (share the kitchen's tools) |
| Walls between restaurants | Process memory isolation |
| Shouting through a window to the next restaurant | Inter-process communication (IPC) |
| A cook opening the refrigerator | Thread accessing shared heap memory |

Two restaurants cannot share their refrigerators (different process memory). But all cooks in the same kitchen can reach into the same fridge (shared heap within one process).

### Process memory layout

When the OS loads a process, it lays out memory in a specific structure:

```
High Address  (e.g. 0xFFFF_FFFF)
┌─────────────────────────────────────────────────┐
│                   Stack                         │
│   Local variables, function call frames,        │
│   return addresses, function arguments          │
│            ↓  grows downward                    │
├─────────────────────────────────────────────────┤
│                                                 │
│          (free space — stack grows down,        │
│              heap grows up into this)           │
│                                                 │
├─────────────────────────────────────────────────┤
│            ↑  grows upward                      │
│                   Heap                         │
│   Dynamically allocated memory:                 │
│   new MyObject(), malloc(), ArrayList          │
├─────────────────────────────────────────────────┤
│               BSS Segment                       │
│   Uninitialised global/static variables         │
│   (zeroed by OS at startup)                     │
├─────────────────────────────────────────────────┤
│               Data Segment                      │
│   Initialised global/static variables           │
│   e.g. static int MAX = 100;                    │
├─────────────────────────────────────────────────┤
│               Text Segment                      │
│   Compiled program bytecode / machine code      │
│   Read-only — prevents accidental modification  │
Low Address   (e.g. 0x0000_0000)
```

**Important:** the stack and heap grow toward each other. A stack overflow happens when the stack grows so large it collides with the heap region.

### In Java / JVM

```
JVM Process Memory:
┌──────────────────────────────────────────────────────┐
│  JVM Heap (Xmx)                                      │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │  Young Gen   │  │   Old Gen    │  ← GC manages    │
│  │  (Eden,S0,S1)│  │              │    all of this   │
│  └──────────────┘  └──────────────┘                  │
├──────────────────────────────────────────────────────┤
│  Metaspace (class metadata, method bytecodes)        │
├──────────────────────────────────────────────────────┤
│  Thread Stacks (one per thread, ~512KB–1MB each)     │
│  Thread 1 stack │ Thread 2 stack │ Thread 3 stack    │
├──────────────────────────────────────────────────────┤
│  Code Cache (JIT-compiled native code)               │
└──────────────────────────────────────────────────────┘
```

---

## Process Control Block (PCB)

The OS maintains a **PCB** (Process Control Block) data structure for every process. It's the process's "identity card" — everything the OS needs to manage and resume the process.

```c
// Conceptual PCB structure (simplified from Linux task_struct)
struct PCB {
    int   pid;              // Unique process ID (e.g. 4242)
    int   ppid;             // Parent process ID
    int   state;            // RUNNING, READY, WAITING, ZOMBIE

    // CPU context — saved when process is descheduled
    void* program_counter;  // Address of NEXT instruction to execute
    int   registers[16];    // General-purpose register values
    int   stack_pointer;    // Current top of stack
    int   flags_register;   // CPU condition flags (zero, overflow, etc.)

    // Memory management
    PageTable* page_table;  // Maps virtual → physical memory addresses
    void*  heap_start;
    void*  stack_start;

    // Scheduling
    int    priority;        // Scheduling priority
    long   cpu_time_used;   // Total CPU time consumed (for billing/fairness)
    long   last_scheduled;  // When was this process last run

    // I/O and resources
    File*  open_files[1024];// Table of open file descriptors
    Signal signal_handlers[]; // Registered signal handlers
};
```

When a context switch happens, the current process's CPU state is saved into its PCB so it can be resumed later exactly where it left off.

---

## Process States and Lifecycle

```
                     fork() / CreateProcess()
                              │
                              ▼
                           ╔═════╗
                           ║ NEW ║  ← process created but not yet admitted
                           ╚═════╝
                              │  OS admits to memory
                              ▼
                         ╔═════════╗
               ┌─────── ►║  READY  ║◄──────────────────────┐
               │          ╚═════════╝                       │
               │       scheduler dispatches                 │
               │               │                            │
     I/O       │               ▼                   I/O completes /
   completes   │          ╔═════════╗              event occurs
               │          ║ RUNNING ║──────────────────────►│
               │          ╚═════════╝                   ╔═════════╗
               │               │                        ║ WAITING ║
               │        preempted (time slice)          ╚═════════╝
               └───────────────┘
                               │
                            exit()
                               │
                               ▼
                         ╔════════════╗
                         ║ TERMINATED ║  ← PCB kept until parent calls wait()
                         ╚════════════╝
```

| State | What it means |
|-------|--------------|
| **New** | Process created — not yet admitted by scheduler |
| **Ready** | In memory, waiting for CPU time |
| **Running** | Currently executing on a CPU core |
| **Waiting** | Blocked on I/O, sleep, or synchronisation — not using CPU |
| **Terminated** | Finished — PCB kept until parent reads exit status |

### Zombie and Orphan processes

```
Zombie process:
  Child exits → becomes zombie (PCB kept but code no longer running)
  Parent hasn't called wait() → zombie accumulates
  Problem: PCB entries are finite — zombie flood can exhaust them
  Fix: always call wait() or waitpid() in parent; use SIGCHLD handler

Orphan process:
  Parent exits before child → child has no parent to read its exit status
  OS reparents orphan to init (PID 1) / systemd
  init periodically calls wait() to clean up reparented children
  Orphans are harmless — init manages them
```

---

## Process Creation

<Tabs>
  <TabItem value="unix" label="Unix / Linux (fork + exec)">

```c
#include <unistd.h>
#include <sys/wait.h>

int main() {
    pid_t pid = fork();    // Creates a child process

    if (pid == 0) {
        // ── Child process ─────────────────────────────────
        // At this point, child is an exact copy of parent (copy-on-write)
        // Replace child's image with a different program:
        execl("/bin/ls", "ls", "-la", "/tmp", NULL);
        // exec() replaces the process image — code after this never runs
        // if exec() returns, it failed
        perror("exec failed");
        exit(1);

    } else if (pid > 0) {
        // ── Parent process ────────────────────────────────
        int status;
        waitpid(pid, &status, 0);  // Wait for child; prevents zombie
        printf("Child %d exited with status %d\n", pid, WEXITSTATUS(status));

    } else {
        // pid < 0 = fork failed
        perror("fork failed");
        exit(1);
    }
    return 0;
}
```

**fork() + copy-on-write:**

```
Before fork():           After fork():
Parent memory:           Parent memory:       Child memory:
┌─────────────┐          ┌─────────────┐      ┌─────────────┐
│  Code (R/O) │          │  Code (R/O) │──────│  Code (R/O) │ (shared, read-only)
│  Data=42    │          │  Data=42    │──────│  Data=42    │ (shared, copy-on-write)
│  Heap       │          │  Heap       │──────│  Heap       │ (shared until written)
└─────────────┘          └─────────────┘      └─────────────┘

When child writes to Data:
                         ┌─────────────┐      ┌─────────────┐
                         │  Data=42    │      │  Data=99    │ ← OS makes private copy
                         └─────────────┘      └─────────────┘
No upfront copying — pages are copied lazily only when written.
```

  </TabItem>
  <TabItem value="java" label="Java (ProcessBuilder)">

```java
// Java creates child processes via ProcessBuilder
ProcessBuilder pb = new ProcessBuilder("ls", "-la", "/tmp");
pb.redirectErrorStream(true);
pb.directory(new File("/"));

Process process = pb.start();

// Read child's output
try (BufferedReader reader = new BufferedReader(
        new InputStreamReader(process.getInputStream()))) {
    reader.lines().forEach(System.out::println);
}

int exitCode = process.waitFor();
System.out.println("Exit code: " + exitCode);

// On Unix: ProcessBuilder.start() calls fork() + exec() internally
// On Windows: calls CreateProcess()
```

  </TabItem>
  <TabItem value="spring" label="Spring Boot — spawning child processes">

```java
// In Spring Boot: use ProcessBuilder for CLI tools, scripts
@Service
public class ImageProcessingService {

    public void convertImage(Path input, Path output) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
            "convert", input.toString(), "-resize", "800x600", output.toString()
        );
        pb.environment().put("PATH", "/usr/bin:/usr/local/bin");
        pb.redirectErrorStream(true);

        Process process = pb.start();

        // Capture output in a separate thread to avoid blocking
        CompletableFuture.runAsync(() -> {
            try (var reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                reader.lines().forEach(log::debug);
            } catch (IOException ignored) {}
        });

        boolean finished = process.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Image conversion timed out");
        }

        if (process.exitValue() != 0) {
            throw new RuntimeException("Image conversion failed: exit " + process.exitValue());
        }
    }
}
```

  </TabItem>
</Tabs>

---

## Inter-Process Communication (IPC)

Since processes have separate memory spaces, they need OS-mediated mechanisms to communicate:

| Mechanism | Direction | Latency | Persistence | Best for |
|-----------|-----------|---------|-------------|---------|
| **Pipe** | Unidirectional | Very low | In-memory only | Parent→child byte streaming |
| **Named Pipe (FIFO)** | Unidirectional | Very low | Filesystem entry | Unrelated processes same machine |
| **Message Queue** | Bidirectional | Low | Kernel-managed | Structured message passing |
| **Shared Memory** | Bidirectional | Lowest | RAM only | High-speed bulk data transfer |
| **Unix Domain Socket** | Bidirectional | Very low | In-memory | High-perf local IPC (Nginx→PHP-FPM) |
| **TCP Socket** | Bidirectional | Higher | Network-capable | Cross-machine or cross-container |
| **Signal** | Notification | Very low | None | Simple events (SIGTERM, SIGKILL) |
| **Memory-Mapped File** | Bidirectional | Low | File-backed | Large data, database files |

### Shared memory — the fastest IPC

```c
// Process A: creates shared memory segment, writes to it
int shm_id = shmget(IPC_PRIVATE, sizeof(int) * 1000, IPC_CREAT | 0666);
int* data = (int*)shmat(shm_id, NULL, 0);  // attach to address space
data[0] = 42;                               // write directly to RAM

// Process B: attaches to same segment, reads it
int* data = (int*)shmat(shm_id, NULL, 0);  // same physical RAM
printf("%d\n", data[0]);                   // reads 42 — zero copy!

// Warning: no synchronisation — need a semaphore or mutex alongside
```

**Java equivalent:**

```java
// Java NIO MappedByteBuffer (memory-mapped file — OS maps file into address space)
RandomAccessFile file = new RandomAccessFile("shared.dat", "rw");
FileChannel channel = file.getChannel();
MappedByteBuffer buffer = channel.map(FileChannel.MapMode.READ_WRITE, 0, 4096);

buffer.putInt(0, 42);    // write — goes directly to mapped memory
int val = buffer.getInt(0); // read — from mapped memory

// Multiple JVM processes mapping the same file share the same physical RAM pages
// Used by: Kafka (log files), Chronicle Map, off-heap databases
```

---

## What is a Thread?

A **thread** is the smallest unit of CPU execution within a process. All threads in a process share the same memory space — heap, code, global data, open files — but each thread has its own:

```
Process (shared resources)
┌─────────────────────────────────────────────────────┐
│  Heap (shared by all threads)                       │
│  Code Segment (shared)                              │
│  Data Segment (shared)                              │
│  Open File Descriptors (shared)                     │
├──────────────┬──────────────┬──────────────────────┤
│  Thread 1    │  Thread 2    │  Thread 3            │
│  Stack ↓     │  Stack ↓     │  Stack ↓             │
│  PC: 0x4A2F  │  PC: 0x9C10  │  PC: 0x1F03         │
│  Registers   │  Registers   │  Registers           │
│  Thread ID   │  Thread ID   │  Thread ID           │
└──────────────┴──────────────┴──────────────────────┘
```

### Thread vs process — the key difference

```
Creating a new process (fork):
  ✗ Copy the entire address space (even with CoW, page tables are copied)
  ✗ New PCB, file descriptor table, signal handlers
  ✗ Time: ~1ms
  ✓ Complete isolation — crash in one doesn't affect others

Creating a new thread:
  ✓ Share existing address space — only a new stack is allocated
  ✓ Share file descriptors, heap, code
  ✓ Time: ~10µs (100× faster than process creation)
  ✗ Crash in one thread (e.g. StackOverflowError) crashes the whole process
  ✗ Shared memory means synchronisation is required
```

### Why threads exist — the parallelism problem

```
Single-threaded server handling 3 requests:

Request A (100ms DB query) ─────────────────────────────────► response
Request B waits ──────────────────────────────────────────────────► response
Request C waits ──────────────────────────────────────────────────────────► response
Total time: 300ms

Multi-threaded server (3 threads):

Thread 1: Request A (100ms DB query) ──────────────────────────────► response
Thread 2: Request B (100ms DB query) ──────────────────────────────► response
Thread 3: Request C (100ms DB query) ──────────────────────────────► response
Total time: 100ms (3× faster for same work)
```

---

## Threading Models

| Model | Mapping | Parallelism | Used by | Trade-off |
|-------|---------|:-----------:|---------|-----------|
| **1:1** | 1 user thread = 1 kernel thread | ✅ True | Java (modern), pthreads | OS overhead per thread |
| **M:1** | N user threads = 1 kernel thread | ❌ None | Old green threads | One block blocks all |
| **M:N** | M user threads = N kernel threads | ✅ True | Go (goroutines), Erlang | Complex scheduler |

### Java's threading model evolution

```
Java 1–20 (Platform threads, 1:1 model):
  Each Java Thread = one OS kernel thread
  Creating 10,000 threads → 10,000 OS threads → ~10 GB of stack RAM
  OS scheduler manages all 10,000 → context switch overhead

Java 21+ (Virtual threads, M:N model via Project Loom):
  Each Virtual Thread = lightweight JVM-managed thread
  10,000,000 virtual threads → small number of OS carrier threads
  JVM scheduler manages virtual threads; OS only sees carrier threads
  When virtual thread blocks on I/O → unmounted from carrier → carrier does other work
```

---

## Java Thread Lifecycle

### Creating and starting threads

```java
// ── Option 1: Extend Thread (rarely used) ────────────────────────────────
class WorkerThread extends Thread {
    @Override
    public void run() {
        System.out.println("Running in: " + Thread.currentThread().getName());
    }
}
new WorkerThread().start();

// ── Option 2: Implement Runnable (functional style) ───────────────────────
Thread t = new Thread(() -> System.out.println("Lambda thread"));
t.setName("worker-1");
t.setDaemon(true);           // daemon threads don't prevent JVM shutdown
t.setPriority(Thread.NORM_PRIORITY); // 1–10, OS uses as a hint
t.start();                   // don't call run() directly — that runs synchronously

// ── Option 3: ExecutorService (ALWAYS use in production) ─────────────────
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<String> future = pool.submit(() -> "result from thread");
String result = future.get(5, TimeUnit.SECONDS);  // blocks at most 5s
pool.shutdown();             // graceful: wait for running tasks to finish
pool.awaitTermination(30, TimeUnit.SECONDS);
```

### Java thread states

```
NEW
 │  thread.start()
 ▼
RUNNABLE ◄──────────────────────────────────────────┐
 │                                                  │
 ├── tries to enter synchronized block → BLOCKED ──►┤ (lock released)
 │                                                  │
 ├── calls wait() / LockSupport.park() → WAITING ──►┤ (notify/unpark)
 │                                                  │
 ├── calls sleep(n) / wait(n) / join(n) → TIMED_WAITING ──► (timeout expires)
 │
 │  run() completes or exception thrown
 ▼
TERMINATED
```

| State | Trigger | How to resume |
|-------|---------|--------------|
| `NEW` | `new Thread()` called | Call `.start()` |
| `RUNNABLE` | `.start()` called | OS schedules it |
| `BLOCKED` | Waiting for a `synchronized` lock | Other thread releases the lock |
| `WAITING` | `wait()`, `join()`, `park()` | `notify()`, thread completes, `unpark()` |
| `TIMED_WAITING` | `sleep(n)`, `wait(n)`, `join(n)` | Timer expires or interrupted |
| `TERMINATED` | `run()` returns or throws | Cannot restart |

```java
// Inspect thread state programmatically
Thread t = new Thread(() -> {
    try { Thread.sleep(5000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
});
System.out.println(t.getState());   // NEW
t.start();
Thread.sleep(100);
System.out.println(t.getState());   // TIMED_WAITING
t.join();
System.out.println(t.getState());   // TERMINATED
```

---

## Context Switching Internals

A context switch is the OS saving one thread's CPU state and restoring another's. It is **pure overhead** — no useful work happens during a switch.

### What gets saved and restored

```
Thread A is running → time slice expires → context switch → Thread B runs

Step 1: Save Thread A's CPU context to its PCB/TCB:
  program_counter  ← memory address of next instruction Thread A would execute
  stack_pointer    ← current top of Thread A's call stack
  registers[0..15] ← all general-purpose register values (rdx, rsi, r8, ...)
  flags_register   ← condition codes (zero flag, carry flag, etc.)
  FPU state        ← floating-point unit registers (if used)

Step 2: If switching processes (not just threads):
  TLB flush        ← Translation Lookaside Buffer must be invalidated
                     (virtual→physical address mapping changes per process)
  Page table swap  ← new process's page table loaded into CR3 register

Step 3: Load Thread B's CPU context from its PCB/TCB:
  (reverse of step 1 — restore all saved state)

Step 4: CPU resumes executing at Thread B's saved program_counter
```

### Context switch costs

| Switch type | Typical cost | Primary cost driver |
|------------|-------------|-------------------|
| Thread switch (same process) | 1–5 µs | Register save/restore, scheduler |
| Thread switch (different process) | 5–15 µs | + TLB flush, page table swap |
| Virtual thread switch (Java 21) | < 1 µs | JVM-managed — no kernel syscall |

**The TLB flush problem:** the TLB (Translation Lookaside Buffer) caches virtual→physical address translations. When switching between processes, the TLB must be invalidated because the new process has a completely different address space. After the switch, every memory access triggers a TLB miss until the cache warms up again — this is why process switches are more expensive than thread switches within the same process.

**Cache pollution:** CPU L1/L2 caches contain the working set of the running thread. A context switch brings in a different thread's working set, evicting the previous thread's data. When that thread resumes, it faces cache misses until its data is reloaded.

### When context switching hurts performance

```java
// Anti-pattern: more threads than CPU cores on CPU-bound work
// 8 core machine, 200 threads doing CPU-intensive computation:
ExecutorService pool = Executors.newFixedThreadPool(200);

// What actually happens:
// OS constantly context-switches 200 threads across 8 cores
// Each switch: 5µs overhead × thousands of switches/sec = significant CPU waste
// Threads spend more time being switched than doing actual computation

// Fix for CPU-bound work: match threads to available cores
int cpuCores = Runtime.getRuntime().availableProcessors();
ExecutorService pool = Executors.newFixedThreadPool(cpuCores);  // 8 threads, 8 cores
// Each core runs one thread continuously — no context switching needed

// Fix for I/O-bound work: more threads are OK (they spend most time waiting)
// Or better: use virtual threads (Java 21) — no OS thread blocked during I/O wait
```

---

## Java Thread Pool Tuning

### The two workload types

```
CPU-bound work:
  Uses 100% CPU during execution (sorting, encryption, image processing)
  Context-switching between threads wastes CPU cycles
  Optimal threads = CPU cores (1 thread per core, no switching needed)

  ExecutorService cpuPool = Executors.newFixedThreadPool(
      Runtime.getRuntime().availableProcessors()
  );

I/O-bound work:
  Thread spends most time blocked waiting (DB query, HTTP call, file read)
  CPU is idle during the wait — other threads can use it
  Optimal threads = (CPU cores) / (1 - blocking_ratio)
  Example: 8 cores, 90% blocking → 8 / 0.1 = 80 threads
  Or: use virtual threads (Java 21) — no kernel thread blocked during I/O

  ExecutorService ioPool = Executors.newFixedThreadPool(80);
  // OR (Java 21+):
  ExecutorService vtPool = Executors.newVirtualThreadPerTaskExecutor();
```

### ThreadPoolExecutor — full control

```java
// Executors.newFixedThreadPool(n) is just a convenience wrapper.
// For production, use ThreadPoolExecutor directly for full control:

ThreadPoolExecutor executor = new ThreadPoolExecutor(
    10,                         // corePoolSize: always-alive threads
    50,                         // maximumPoolSize: peak thread count
    60, TimeUnit.SECONDS,       // keepAliveTime: idle thread survival time
    new LinkedBlockingQueue<>(1000),  // workQueue: task buffer when all threads busy
    new ThreadFactory() {
        private final AtomicInteger counter = new AtomicInteger(0);
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r);
            t.setName("order-processor-" + counter.incrementAndGet());
            t.setDaemon(false);
            return t;
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy()  // saturation policy
);

// Saturation policies (what to do when queue is full AND all threads busy):
// AbortPolicy (default): throws RejectedExecutionException
// CallerRunsPolicy:      calling thread executes the task (backpressure)
// DiscardPolicy:         silently drops the task
// DiscardOldestPolicy:   drops the oldest queued task, tries again

// Monitor the pool
int active   = executor.getActiveCount();
int queued   = executor.getQueue().size();
long total   = executor.getCompletedTaskCount();
System.out.printf("active=%d queued=%d completed=%d%n", active, queued, total);
```

### Bounded vs unbounded queues — the danger of unbounded

```java
// ❌ DANGEROUS: LinkedBlockingQueue() with no bound
// When producers are faster than consumers:
//   Queue grows without limit → OutOfMemoryError after consuming all heap
ExecutorService pool = Executors.newFixedThreadPool(10); // uses unbounded queue!

// ✅ ALWAYS bound your queues in production:
new ThreadPoolExecutor(10, 10, 0L, MILLISECONDS,
    new LinkedBlockingQueue<>(500),    // max 500 queued tasks
    new ThreadPoolExecutor.AbortPolicy()  // reject if queue full
);
```

### ThreadLocal — per-thread data

```java
// ThreadLocal stores a separate value per thread — no synchronisation needed
// because each thread has its own copy
public class RequestContext {

    private static final ThreadLocal<String> currentUserId = new ThreadLocal<>();
    private static final ThreadLocal<String> requestTraceId = new ThreadLocal<>();

    public static void set(String userId, String traceId) {
        currentUserId.set(userId);
        requestTraceId.set(traceId);
    }

    public static String getUserId()   { return currentUserId.get(); }
    public static String getTraceId()  { return requestTraceId.get(); }

    // CRITICAL: always clean up — thread pool threads are reused!
    // If you don't clear, the next request on this thread sees the previous request's values
    public static void clear() {
        currentUserId.remove();
        requestTraceId.remove();
    }
}

// In a Spring filter:
@Component
public class RequestContextFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {
        try {
            RequestContext.set(
                extractUserId(req),
                req.getHeader("X-Trace-Id")
            );
            chain.doFilter(req, res);
        } finally {
            RequestContext.clear();   // MUST clear in finally block
        }
    }
}
```

:::warning[ThreadLocal with thread pools]
In a thread pool, threads are reused across many requests. If you set a `ThreadLocal` value and don't clear it in a `finally` block, the next request handled by the same thread sees the previous request's stale value. This is a common source of security bugs (wrong user ID) and data leaks.
:::

---

## Memory Visibility & the JMM

The **Java Memory Model (JMM)** defines when one thread's writes are visible to another thread. This is non-trivial because:

```
CPU 1 (Thread A)       L1 Cache (Core 1)       Main RAM
──────────────────      ─────────────────       ─────────
x = 42 ──────────────► x = 42 (cached)
                        (not yet flushed)        x = 0   ← Thread B still sees 0!

CPU 2 (Thread B)       L1 Cache (Core 2)
──────────────────      ─────────────────
read x ────────────────►              ──────────────────► x = 0 (stale!)
```

Modern CPUs and compilers reorder instructions for performance. Without explicit synchronisation, one thread's writes may not be visible to another.

### The happens-before relationship

A **happens-before** relationship guarantees that a write by Thread A is visible to Thread B:

```java
// Guaranteed happens-before relationships:
// 1. Within one thread: each statement happens-before the next
// 2. Thread.start(): all actions before start() happen-before any action in the thread
// 3. Thread.join(): all actions in a thread happen-before join() returns
// 4. Synchronized: release of lock happens-before acquisition by another thread
// 5. volatile: write to a volatile field happens-before any subsequent read
```

### volatile — visibility without locking

```java
// Without volatile: compiler may cache flag in register — other threads don't see update
private boolean running = true;

// Thread A:
running = false;   // writes to local cache — may not flush to RAM

// Thread B:
while (running) {  // reads from its own cache — may loop forever  ❌

// ─────────────────────────────────────────────────────────────────

// With volatile: every read/write goes to main memory — fully visible
private volatile boolean running = true;

// Thread A:
running = false;   // guaranteed to write to main memory immediately

// Thread B:
while (running) {  // reads from main memory — sees false immediately  ✅
```

**volatile guarantees:** visibility (all threads see the latest write) and ordering (no reordering of volatile reads/writes). It does NOT guarantee atomicity — `volatile int counter; counter++` is still not thread-safe (read-modify-write is three operations).

### synchronized — mutual exclusion + visibility

```java
public class Counter {
    private int count = 0;

    // Only one thread at a time can execute this method
    public synchronized void increment() {
        count++;    // read-modify-write is now atomic
    }

    public synchronized int getCount() {
        return count;   // guaranteed to see latest value
    }

    // Equivalent with explicit lock (more flexible):
    private final Object lock = new Object();

    public void increment() {
        synchronized (lock) {   // intrinsic lock on the lock object
            count++;
        }
    }
}
```

### java.util.concurrent.locks.Lock — explicit locking

```java
import java.util.concurrent.locks.*;

public class ReadWriteCounter {

    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock  = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private int count = 0;

    // Many threads can read simultaneously
    public int getCount() {
        readLock.lock();
        try {
            return count;
        } finally {
            readLock.unlock();  // ALWAYS unlock in finally
        }
    }

    // Only one thread can write (exclusive lock, blocks all readers)
    public void increment() {
        writeLock.lock();
        try {
            count++;
        } finally {
            writeLock.unlock();
        }
    }

    // tryLock — non-blocking attempt
    public boolean tryIncrement(long timeout, TimeUnit unit) throws InterruptedException {
        if (writeLock.tryLock(timeout, unit)) {
            try {
                count++;
                return true;
            } finally {
                writeLock.unlock();
            }
        }
        return false;  // lock not acquired within timeout
    }
}
```

### Atomic variables — lock-free thread safety

```java
import java.util.concurrent.atomic.*;

// AtomicInteger uses CAS (Compare-And-Swap) CPU instructions — no lock needed
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();            // atomic: fetch + increment
counter.compareAndSet(5, 10);        // atomic: if current==5, set to 10
int val = counter.getAndAdd(3);      // atomic: returns old value, adds 3

// AtomicReference for objects
AtomicReference<String> ref = new AtomicReference<>("initial");
ref.compareAndSet("initial", "updated");  // safe atomic swap

// LongAdder — better than AtomicLong under high contention
// Maintains multiple internal counters, sums them on read
LongAdder adder = new LongAdder();
adder.increment();      // each thread increments its own cell — no contention
adder.sum();           // aggregates all cells on read
```

---

## Virtual Threads (Java 21 — Project Loom)

### The platform thread problem for I/O-heavy workloads

```
Traditional (platform) thread handling a DB query:

Thread A (OS kernel thread, ~1MB stack):
  receive HTTP request
  call DB query ──────────────────────────────────── DB responds
                 [100ms: thread is BLOCKED, OS thread idle]
                                                              parse + respond

Problems at 10,000 concurrent requests:
  → 10,000 OS threads × 1MB stack = 10 GB RAM just for stacks
  → OS scheduler managing 10,000 threads → massive context switching overhead
  → Thread pool exhaustion → requests queue → latency spikes
```

### How virtual threads solve this

```
Virtual thread handling the same DB query:

Virtual Thread A (JVM-managed, ~few KB):
  receive HTTP request
  call DB query ──────► JVM detects blocking I/O
                         Virtual Thread A is UNMOUNTED from OS carrier thread
                         OS carrier thread is now FREE for other virtual threads
                         Virtual Thread B, C, D... run on the freed carrier thread
                              ↓ DB responds
                         Virtual Thread A is REMOUNTED onto a carrier thread
                                                              parse + respond

Benefits at 10,000 concurrent requests:
  → JVM has ~8 carrier threads (one per CPU core)
  → 10,000 virtual threads share 8 OS threads
  → Only ~8 OS threads total → no OS scheduling overhead
  → No thread pool exhaustion — create one virtual thread per request
```

### Virtual thread implementation

```java
// ── Creating virtual threads ───────────────────────────────────────────────
// Direct creation
Thread vt = Thread.ofVirtual()
    .name("vt-", 0)          // names vt-0, vt-1, vt-2, ...
    .start(() -> doWork());

// Via ExecutorService — preferred for server applications
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Creates one virtual thread per submitted task — no pool size needed
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> handleRequest());
    }
}   // auto-close waits for all tasks to complete

// In Spring Boot 3.2+ — enable virtual threads with one config line:
// application.yaml:
// spring:
//   threads:
//     virtual:
//       enabled: true
// This configures Tomcat to use a virtual thread per HTTP request
```

### Platform threads vs Virtual threads

| | Platform threads | Virtual threads |
|-|:-:|:-:|
| **Managed by** | OS kernel | JVM |
| **Stack size** | ~1 MB (fixed OS allocation) | ~few KB (grows dynamically) |
| **Creation cost** | ~1ms (OS syscall) | ~1µs (JVM allocation) |
| **Max practical count** | ~10,000 | Millions |
| **Blocking I/O behaviour** | OS thread blocked and idle | Unmounted from carrier; carrier does other work |
| **CPU-bound suitability** | ✅ Excellent | ⚠️ Same as platform (still needs carrier thread) |
| **I/O-bound suitability** | ⚠️ Thread-per-request doesn't scale | ✅ Excellent — thread-per-task scales to millions |
| **ThreadLocal support** | ✅ Full | ✅ Full (but consider ScopedValues) |
| **Debuggability** | Thread dump shows all | Thread dump shows all |

### What virtual threads do NOT solve

```java
// ❌ Virtual threads don't help CPU-bound work
// If your task burns CPU, the carrier thread is occupied the entire time
// 1,000,000 virtual threads all doing CPU work → still limited to 8 actual cores

// ❌ Synchronized blocks pin the virtual thread to the carrier thread
// Virtual thread cannot unmount while holding a synchronized lock
// This defeats the purpose — use java.util.concurrent.locks.Lock instead

synchronized (lock) {
    db.query(...)    // virtual thread PINNED — carrier thread blocked too  ❌
}

ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    db.query(...)    // virtual thread can unmount — carrier thread freed  ✅
} finally {
    lock.unlock();
}

// ❌ Thread pool sized for platform threads is wrong for virtual threads
// Don't limit: Executors.newVirtualThreadPerTaskExecutor() — no pool size
// Don't wrap in fixed thread pool — defeats the entire model
```

---

## User-Level vs Kernel-Level Threads

| | User-Level Threads | Kernel-Level Threads |
|-|-------------------|---------------------|
| **Managed by** | User-space library / JVM | OS kernel |
| **Context switch** | Fast — no syscall, just register swap | Slow — kernel transition required |
| **One thread blocks** | Entire process blocks (M:1 model) | Other threads continue (1:1 model) |
| **Parallelism** | No (unless M:N with kernel support) | Yes — one per physical core |
| **Scheduling control** | App has full control | OS decides |
| **Examples** | Java virtual threads (carrier side), Go goroutines | POSIX pthreads, Java platform threads |

---

## Concurrency Primitives Comparison

```java
// The concurrency tool decision tree:

// Need to run something on another thread?
//   → ExecutorService.submit() or CompletableFuture.supplyAsync()

// Need a result from another thread?
//   → Future<T> or CompletableFuture<T>

// Need a simple flag visible across threads?
//   → volatile boolean

// Need to increment/decrement safely without locks?
//   → AtomicInteger / AtomicLong / LongAdder

// Need to swap an object reference safely?
//   → AtomicReference<T>

// Need exclusive access to a block of code?
//   → synchronized or ReentrantLock

// Need many readers, one writer?
//   → ReadWriteLock (ReentrantReadWriteLock)

// Need to wait for N threads to reach a point?
//   → CountDownLatch (one-time) or CyclicBarrier (reusable)

// Need to limit concurrent access to a resource?
//   → Semaphore

// Need a thread-safe queue for producer-consumer?
//   → LinkedBlockingQueue or ArrayBlockingQueue

// Need per-thread isolated data?
//   → ThreadLocal (remember to clear in finally)

// Need to compose async operations?
//   → CompletableFuture.thenApply().thenCompose().exceptionally()
```

---

## IPC in Modern Java / Spring

```java
// ── Pipes: parent-child process communication ─────────────────────────────
ProcessBuilder pb = new ProcessBuilder("wc", "-l");
pb.redirectInput(ProcessBuilder.Redirect.PIPE);
Process process = pb.start();
try (PrintWriter pw = new PrintWriter(process.getOutputStream())) {
    pw.println("line one");
    pw.println("line two");
}
String result = new String(process.getInputStream().readAllBytes());
// result = "2"

// ── Shared memory equivalent in JVM: use concurrent data structures ───────
// Threads share heap — just use thread-safe collections:
ConcurrentHashMap<String, Order> orderCache = new ConcurrentHashMap<>();
BlockingQueue<Event> eventQueue = new LinkedBlockingQueue<>(1000);

// Producer thread:
eventQueue.put(new OrderCreatedEvent(orderId));  // blocks if queue full

// Consumer thread:
Event event = eventQueue.take();  // blocks if queue empty

// ── Cross-process in microservices: use Kafka, Redis, HTTP ────────────────
// "IPC" between microservices is just messaging/APIs
```

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

    // ❌ Sequential: total time = inventory + payment + notification
    public void processOrderSequential(Order order) {
        inventory.reserve(order);    // 50ms
        payment.charge(order);       // 100ms
        notification.send(order);    // 30ms
        // Total: 180ms
    }

    // ✅ Parallel where possible: total time = max(inventory, payment) + notification
    public CompletableFuture<Void> processOrderAsync(Order order) {
        // Reserve inventory and charge payment in parallel
        CompletableFuture<Void> inventoryFuture =
            CompletableFuture.runAsync(() -> inventory.reserve(order));

        CompletableFuture<Void> paymentFuture =
            CompletableFuture.runAsync(() -> payment.charge(order));

        // Wait for BOTH to complete, then send notification
        return CompletableFuture.allOf(inventoryFuture, paymentFuture)
            .thenRunAsync(() -> notification.send(order))
            .exceptionally(ex -> {
                log.error("Order processing failed: {}", ex.getMessage());
                // Compensate: release inventory, refund payment
                return null;
            });
        // Total: max(50ms, 100ms) + 30ms = 130ms — 28% faster
    }
}
```

</details>

<details>
<summary>🔬 Senior deep-dive: ForkJoinPool and parallel streams</summary>

```java
// ForkJoinPool: designed for recursive divide-and-conquer tasks
// Uses work-stealing: idle threads steal tasks from busy threads' queues
ForkJoinPool pool = new ForkJoinPool(
    Runtime.getRuntime().availableProcessors(),
    ForkJoinPool.defaultForkJoinWorkerThreadFactory,
    null,   // exception handler
    true    // async mode (FIFO for unjoined tasks)
);

// Java parallel streams use the common ForkJoinPool by default
// WARNING: all parallel streams share the SAME common pool
// A heavy stream can starve other parallel streams
List<Order> orders = getOrders();
long total = orders.parallelStream()
    .mapToLong(Order::getTotal)
    .sum();

// Use a custom pool to isolate from common pool:
ForkJoinPool customPool = new ForkJoinPool(4);
customPool.submit(() ->
    orders.parallelStream()
          .mapToLong(Order::getTotal)
          .sum()
).get();
```

</details>

<details>
<summary>🔬 Senior deep-dive: diagnosing thread issues in production</summary>

```bash
# Get a thread dump of a running JVM process (non-intrusive)
kill -3 <pid>       # sends SIGQUIT → JVM prints thread dump to stdout/log
jstack <pid>        # prints thread dump to console
jstack -l <pid>     # includes lock information (deadlock detection)

# Look for threads in these states:
# BLOCKED on lock: potential deadlock or lock contention
# WAITING at sun.misc.Unsafe.park: threads waiting on a condition
# RUNNABLE at java.net.SocketInputStream.socketRead: threads blocked on I/O

# Detect deadlocks automatically:
jstack -l <pid> | grep -A 10 "deadlock"

# Example deadlock in thread dump:
# Thread A: waiting to acquire lock 0x00000007d5a44ab8
#   locked 0x00000007d5a44b28
# Thread B: waiting to acquire lock 0x00000007d5a44b28
#   locked 0x00000007d5a44ab8
# ← Thread A holds what B needs; B holds what A needs = deadlock
```

```java
// Programmatic thread monitoring
ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

// Detect deadlocks
long[] deadlockedIds = threadBean.findDeadlockedThreads();
if (deadlockedIds != null) {
    ThreadInfo[] infos = threadBean.getThreadInfo(deadlockedIds, true, true);
    for (ThreadInfo info : infos) {
        log.error("DEADLOCK detected: thread={} state={} blockedOn={}",
            info.getThreadName(), info.getThreadState(),
            info.getLockName());
    }
}

// Get all thread states for monitoring
ThreadInfo[] allThreads = threadBean.dumpAllThreads(false, false);
Map<Thread.State, Long> stateCount = Arrays.stream(allThreads)
    .collect(Collectors.groupingBy(ThreadInfo::getThreadState, Collectors.counting()));
// Alert if BLOCKED count is high (lock contention) or WAITING count is abnormal
```

```yaml
# Spring Boot Actuator — expose thread metrics
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, threaddump

# GET /actuator/threaddump — full thread dump as JSON
# GET /actuator/metrics/jvm.threads.states — thread counts by state
# GET /actuator/metrics/jvm.threads.peak — peak thread count
```

</details>

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `thread.run()` instead of `thread.start()` | `run()` executes synchronously on the current thread — no new thread created | Always call `thread.start()` |
| Unbounded thread creation (`new Thread()` per request) | 10,000 requests → 10,000 OS threads → OOM | Use a bounded `ExecutorService` or virtual threads |
| Not clearing `ThreadLocal` in thread pools | Next request sees previous request's stale values — security bug | Always `threadLocal.remove()` in `finally` |
| `synchronized` on virtual threads | Pins virtual thread to carrier — defeats the purpose | Use `ReentrantLock` instead of `synchronized` |
| Shared mutable state without synchronisation | Race conditions — non-deterministic results, data corruption | Use `synchronized`, `Lock`, `AtomicXxx`, or immutable objects |
| Catching `InterruptedException` and swallowing it | Thread interruption mechanism broken — cannot shut down cleanly | Re-interrupt: `Thread.currentThread().interrupt()` then handle or rethrow |
| Unbounded `LinkedBlockingQueue` in `ThreadPoolExecutor` | Queue grows without limit → OOM under sustained overload | Always bound queues: `new LinkedBlockingQueue<>(capacity)` |
| CPU-bound tasks on virtual threads | Virtual threads don't add parallelism beyond carrier thread count | Use platform threads sized to CPU cores for CPU-bound work |
| Deadlock from acquiring two locks in different orders | Thread A holds lock1, waits for lock2; Thread B holds lock2, waits for lock1 | Always acquire multiple locks in the same order everywhere |
| `parallel()` streams without a custom pool | All parallel streams share one common `ForkJoinPool` — one heavy stream starves others | Use a dedicated `ForkJoinPool` for heavy parallel operations |

---

## 🎯 Interview Questions

**Q1. What is the difference between a process and a thread?**
> A process is an isolated instance of a running program with its own private memory address space — code, heap, stack, and data are all separate from other processes. A thread is a unit of execution within a process; all threads in a process share the same heap, code, and file descriptors but have their own stack, program counter, and registers. Processes communicate via IPC (pipes, sockets, shared memory) — expensive. Threads communicate via shared memory — fast but requiring synchronisation. A crash in one process doesn't affect others; a crash in one thread can kill the entire process.

**Q2. What is a context switch and what are its costs?**
> A context switch is when the OS saves the current thread/process's CPU state (program counter, registers, stack pointer, flags) into its PCB and loads another thread/process's saved state. The cost is pure overhead — no useful work happens. Costs include: saving/restoring 15+ registers (~10ns each), flushing the TLB if switching between processes (causes cache misses on subsequent memory accesses), cache pollution (new thread evicts previous thread's L1/L2 cached data), and kernel overhead. Typical cost: 1–5µs for thread switches, 5–15µs for process switches. Virtual thread switches in Java 21 cost < 1µs as they are entirely JVM-managed with no kernel syscall.

**Q3. What is the difference between BLOCKED, WAITING, and TIMED_WAITING in Java?**
> `BLOCKED`: thread is waiting to acquire a `synchronized` monitor lock — another thread holds the lock. `WAITING`: thread has deliberately given up the CPU using `wait()`, `join()`, or `LockSupport.park()` with no timeout — it will wait indefinitely until explicitly woken by `notify()`, the joined thread completing, or `unpark()`. `TIMED_WAITING`: same as WAITING but with a timeout — `sleep(n)`, `wait(n)`, `join(n)`. BLOCKED is the most dangerous in production because it signals lock contention that can grow into deadlocks. High BLOCKED thread counts in a thread dump indicate excessive synchronisation.

**Q4. What is a race condition and how do you prevent it?**
> A race condition occurs when the correctness of a program depends on the relative timing of thread execution. Classic example: `counter++` is not atomic — it is three operations (read, increment, write). If two threads execute it concurrently, both may read the same value, each increment it, and both write the same result — one increment is lost. Prevention: (1) `synchronized` blocks or methods — mutual exclusion; (2) `AtomicInteger.incrementAndGet()` — CAS-based lock-free atomicity; (3) immutable objects — no shared mutable state; (4) `volatile` for simple visibility (not sufficient for compound operations); (5) confinement — only one thread ever accesses a piece of data.

**Q5. What are virtual threads in Java 21 and how do they differ from platform threads?**
> Virtual threads (Project Loom) are lightweight JVM-managed threads that run on a small number of OS carrier threads. Unlike platform threads (1 Java thread = 1 OS kernel thread), virtual threads are unmounted from their carrier when they block on I/O — the carrier thread is freed to run other virtual threads. This enables millions of concurrent virtual threads on a handful of OS threads. Platform threads are fixed at ~1MB stack (OS allocation), ~1ms to create; virtual threads start at a few KB, ~1µs to create. For I/O-bound workloads (databases, HTTP, file I/O), virtual threads eliminate thread pool sizing concerns — create one per task. For CPU-bound workloads, virtual threads offer no advantage over platform threads — both are limited by physical core count.

**Q6. What is a zombie process and how do you prevent it?**
> A zombie process has completed execution but its PCB entry remains in the process table because its parent hasn't called `wait()` to read its exit status. The child's code no longer runs, but its entry occupies a slot in the process table. Process table slots are finite (typically 32,768 on Linux). A zombie flood can exhaust all slots, preventing any new process creation — a form of DoS. Prevention: always call `wait()` or `waitpid()` in the parent after forking; register a `SIGCHLD` signal handler that calls `waitpid(-1, WNOHANG)` to reap all terminated children asynchronously; or double-fork so the intermediate process exits immediately, reparenting the grandchild to `init` which handles cleanup automatically.

**Q7. (Senior) How does the JVM threading model change with virtual threads, and what pitfalls remain?**
> Virtual threads implement an M:N threading model: M virtual threads multiplex onto N OS carrier threads (N ≈ CPU cores). The JVM scheduler mounts a virtual thread onto a carrier for execution and unmounts it when it blocks. Unmounting requires saving only the virtual thread's stack frame (small, growable) rather than involving the OS. Remaining pitfalls: (1) `synchronized` blocks pin the virtual thread to its carrier — the carrier cannot serve other virtual threads while the pinned virtual thread waits for I/O. Use `ReentrantLock` instead. (2) `ThreadLocal` still works but is potentially wasteful — millions of virtual threads each holding a ThreadLocal value consume significant memory. Consider `ScopedValue` (JEP 446) for immutable per-scope data. (3) CPU-bound tasks still block the carrier thread — virtual threads only help when the task spends time waiting, not computing. (4) Native methods (JNI) may pin the carrier thread if they block.

---

## See Also

- [CPU Scheduling](./cpu-scheduling.md)
- [Synchronization & Deadlocks](./synchronization-and-deadlocks.md)
- [Database Connection Pooling](../database/connection-pooling.md)
- [Spring Batch — Complete Guide](../spring/spring-batch.md)
- [API Design — REST, gRPC & GraphQL](../system-design/api-design.md)