---
id: interview-questions
title: Common OS Interview Questions
description: Comprehensive collection of operating systems interview questions with detailed answers, covering all major topics from processes to Linux internals.
tags:
  - operating-systems
  - interview
  - java
  - system-design
  - career
sidebar_position: 9
---

# Common OS Interview Questions

> This page aggregates the most important interview questions across all OS topics. Useful for FAANG-style system design and backend engineering interviews.

---

## Processes & Threads

### Q: What is the difference between a process and a thread?

| | Process | Thread |
|---|---|---|
| Memory space | Independent address space | Shared within process |
| Creation cost | High (`fork()` + copy page tables) | Low |
| Communication | Requires IPC (pipes, sockets, shared memory) | Direct (shared heap/globals) |
| Crash isolation | Crash of one doesn't affect others | One thread crash can kill the whole process |
| Context switch | Expensive (TLB flush, address space change) | Cheaper (same address space) |

---

### Q: What happens step-by-step when you call `fork()` in Linux?

1. Kernel allocates a new PCB (task_struct) for the child.
2. Copies the parent's file descriptor table, signal handlers, memory mappings.
3. Sets up child's page tables as copy-on-write (pages shared, marked read-only).
4. Assigns a new PID to the child.
5. Returns 0 to child, child's PID to parent.
6. Both processes run concurrently from the next instruction.
7. On first write to a shared page → kernel creates a private copy.

---

### Q: What is a zombie process and how do you prevent it?

A zombie process has exited but its PCB remains because the parent hasn't called `wait()`. The entry stays to hold the exit status.

**Prevention**: Always call `wait()`/`waitpid()` in the parent, or use a `SIGCHLD` handler. In Go/Java with `ProcessBuilder`, always call `waitFor()`. If the parent dies first, `init`/`systemd` inherits and reaps the zombie.

```java
Process p = Runtime.getRuntime().exec("ls");
int exitCode = p.waitFor();  // REQUIRED to avoid zombie
```

---

### Q: Explain the concept of context switching and its overhead.

A context switch saves the CPU state of the current process/thread (registers, program counter, stack pointer) into its PCB, selects the next process, and loads its saved state. Overhead includes:
- Direct: saving/loading registers, updating PCB.
- Indirect: TLB flush (if switching processes), CPU cache invalidation.
- Typical cost: **1–10 µs** for thread switch; **5–50 µs** for process switch.

Java Virtual Threads (Loom) reduce this: switching between virtual threads is a function call in user space (~ns), not a kernel context switch.

---

## CPU Scheduling

### Q: Compare FCFS, SJF, RR, and Priority scheduling.

| Algorithm | Preemptive | Starvation | Best For |
|---|---|---|---|
| FCFS | No | No (but convoy effect) | Batch systems |
| SJF | No | Yes (long jobs) | Minimizing avg wait time |
| SRTF | Yes | Yes (long jobs) | Optimal average wait |
| Round Robin | Yes | No | Time-sharing, interactive |
| Priority | Both | Yes (low priority) | Mixed workloads |
| MLFQ | Yes | No (aging) | General-purpose OS |

---

### Q: Why is SJF optimal but impractical?

SJF minimizes average waiting time — provably optimal among non-preemptive algorithms. But: it requires knowing the **next CPU burst duration** in advance, which is impossible. It can only be approximated using exponential averaging of past bursts. Also suffers starvation.

---

### Q: What is the difference between `SCHED_FIFO`, `SCHED_RR`, and `SCHED_OTHER` in Linux?

- `SCHED_FIFO`: Real-time, FIFO. Thread runs until it voluntarily yields or blocks. No time quantum. Highest priority runs indefinitely.
- `SCHED_RR`: Real-time, Round Robin. Like FIFO but with a time quantum; then back to end of same-priority queue.
- `SCHED_OTHER` (`SCHED_NORMAL`): Default. Uses the CFS scheduler with nice values (-20 to +19).

Real-time policies (`FIFO`/`RR`) preempt `SCHED_OTHER` processes. Only root or `CAP_SYS_NICE` can set real-time priority.

---

## Memory Management

### Q: Explain paging and why it's used.

Paging divides physical memory into fixed-size **frames** and logical memory into equal-size **pages**. The OS maintains a **page table** mapping logical pages to physical frames.

**Benefits**: Eliminates external fragmentation; enables virtual address spaces larger than physical RAM (demand paging); allows memory isolation between processes; enables copy-on-write and memory-mapped files.

---

### Q: What is thrashing? How does the OS detect and prevent it?

Thrashing: A process spends more time swapping pages in/out than executing — the working set doesn't fit in available frames.

**Detection**: Monitor page fault rate. If it's high and CPU utilization is low, thrashing is likely.

**Prevention**:
- Working Set Model: Ensure each process has enough frames for its working set.
- Page Fault Frequency: If fault rate too high → allocate more frames; if too low → reclaim frames.
- Reduce multiprogramming: Suspend some processes to give others enough memory.

---

### Q: What is the difference between internal and external fragmentation?

- **Internal fragmentation**: Allocated block is larger than requested. Wasted space *inside* the allocated unit. Caused by paging (partial pages), fixed-size memory pools.
- **External fragmentation**: Total free memory is sufficient but scattered in disconnected pieces — no single contiguous allocation is possible. Caused by variable-size allocation (malloc, segmentation).

**Solutions**: Paging eliminates external fragmentation. Buddy system + slab allocator minimize both.

---

### Q: How does the JVM handle memory differently from a native C++ application?

| | JVM (Java) | Native (C/C++) |
|---|---|---|
| Allocation | `new` → bump-pointer allocation in Eden | `malloc` → `sbrk`/`mmap` |
| Deallocation | Garbage Collector (GC) | Explicit `free()` / RAII |
| Memory layout | Generational heap (Young/Old) | OS-managed, manual |
| Fragmentation | Compacting GC eliminates it | Can accumulate |
| Crash on OOM | `OutOfMemoryError` | `SIGSEGV` or `SIGKILL` (OOM) |
| Overhead | GC pauses | No pauses but risk of leaks/corruption |

---

## Synchronization & Deadlocks

### Q: What are the four conditions for deadlock? How do you prevent each?

1. **Mutual Exclusion** → Make resources sharable (e.g., read-only files). Not always possible.
2. **Hold and Wait** → Request all resources atomically at start; or release all before requesting more.
3. **No Preemption** → Allow OS to preempt resources (works for CPU, not for printers).
4. **Circular Wait** → Impose a total ordering on resources; always request in ascending order.

**Real-world**: Database 2PL uses strict ordering. Java `Lock` documentation recommends acquiring locks in consistent order.

---

### Q: What is the difference between a mutex and a semaphore?

| | Mutex | Semaphore |
|---|---|---|
| Ownership | Only the locking thread can unlock | Any thread can signal |
| Values | 0 (locked) / 1 (unlocked) | 0 to N |
| Use | Mutual exclusion | Resource counting, signaling |
| Priority inversion | Can be avoided (priority inheritance) | Harder to handle |

**Java**: `synchronized`/`ReentrantLock` are mutex-like. `Semaphore` is a counting semaphore.

---

### Q: What is priority inversion? How is it solved?

Priority inversion: A low-priority task holds a lock that a high-priority task needs. A medium-priority task preempts the low-priority one → the high-priority task is blocked indefinitely.

**Solutions**:
- **Priority Inheritance**: The low-priority task temporarily inherits the high-priority task's priority while holding the lock.
- **Priority Ceiling**: Each resource has a ceiling priority; any task acquiring it runs at the ceiling priority.

**Famous example**: Mars Pathfinder (1997) — priority inversion caused watchdog timer reset. Fixed by enabling priority inheritance.

---

### Q: What is the difference between `ReentrantLock` and `synchronized` in Java?

| Feature | `synchronized` | `ReentrantLock` |
|---|---|---|
| Explicit lock/unlock | No | Yes (must use try/finally) |
| Interruptible wait | No | Yes (`lockInterruptibly()`) |
| Timed try | No | Yes (`tryLock(timeout)`) |
| Fairness | No (non-fair) | Optional (fair mode) |
| Multiple conditions | One (`wait`/`notify`) | Multiple (`newCondition()`) |
| Read-write lock | No | `ReentrantReadWriteLock` |
| Performance (uncontested) | Slightly faster (JIT optimized) | Similar |

**Use `synchronized`** for simple cases. **Use `ReentrantLock`** when you need timeouts, interruption, multiple conditions, or fair ordering.

---

### Q: How do you detect a deadlock in a running Java application?

1. **Thread dump**: `kill -3 <pid>` or `jstack <pid>` — outputs "Found one Java-level deadlock" with full trace.
2. **JMX**: `ThreadMXBean.findDeadlockedThreads()` returns deadlocked thread IDs.
3. **Monitoring tools**: VisualVM, JConsole, Async-profiler, Arthas.
4. **In code**: Set `ReentrantLock` fair mode + timeout; log if `tryLock()` fails.

---

## File Systems & I/O

### Q: What happens when you `open()` a file in Linux?

1. Kernel resolves the path (walks the directory tree via dcache/VFS).
2. Checks permissions against the inode (UID, GID, permission bits).
3. Creates a **file description** (kernel object: offset, flags, inode reference).
4. Creates an entry in the process's **file descriptor table** pointing to the file description.
5. Returns the lowest available file descriptor integer to the caller.
6. `O_CREAT` flag: creates the inode if it doesn't exist.

---

### Q: What is `epoll` and how does it work internally?

`epoll` maintains a kernel-side **red-black tree** of registered file descriptors and a **ready list** (linked list of events). When an FD becomes ready (e.g., data arrives), the kernel adds it to the ready list via callback.

`epoll_wait()` sleeps until the ready list is non-empty, then copies events to user space. **O(1) per event**, vs `select`'s O(n) scan of all FDs.

Best for: high-connection servers (Netty, Nginx). Not necessary for small FD counts.

---

### Q: Explain the difference between `write()` and `fsync()`.

- `write()`: Copies data from user buffer to **kernel page cache** (in-memory). Returns immediately. Data is **not** on disk yet. OS will write it to disk asynchronously.
- `fsync(fd)`: Forces all dirty pages for the file to be written to disk. **Blocks** until confirmed by disk hardware. Use for durability (database commits, log writes).

**Intermediate**: `fdatasync()` flushes only data (not metadata like atime), faster than `fsync()`.

---

## Linux Internals

### Q: What is the difference between a hard link and a symbolic link?

| | Hard Link | Symbolic Link |
|---|---|---|
| Points to | Inode directly | Path string |
| Cross-filesystem | No | Yes |
| Broken link | Impossible (inode shared) | Possible (dangling) |
| On deletion of target | Data remains until link count = 0 | Becomes dangling |
| Directories | Not allowed (prevent cycles) | Allowed |
| `ls -la` display | Same size/type as file | `lrwxrwxrwx` + `→ target` |

---

### Q: What are Linux namespaces and cgroups? How do they relate to Docker?

- **Namespaces**: Provide **isolation** — each container gets its own view of PID space, network interfaces, mount points, hostname, IPC, users.
- **cgroups**: Provide **resource limits** — restrict CPU, memory, I/O, network bandwidth.

**Docker = Namespaces + cgroups + Union Filesystem (overlayfs)**. No separate kernel — containers share the host kernel. This is why Docker containers start in milliseconds compared to VMs.

---

### Q: What does `strace` do and when would you use it?

`strace` traces **system calls** made by a process in real time. Shows: which syscalls are called, their arguments, return values, and timing.

**Use cases**: Debug hanging processes (which syscall is blocking?), find which files are opened, diagnose slow programs (unexpected `stat()` calls on every request), verify signal handling.

```bash
strace -c ./myprogram        # Summary: which syscalls, how many, time spent
strace -e trace=network ./p  # Only network syscalls
strace -tt -p 1234           # Live trace with timestamps
```

---

## Performance & Diagnostics

### Q: How would you diagnose high CPU usage on a Linux server?

```bash
# 1. Find which processes are using CPU:
top -H          # -H shows threads
htop

# 2. Find which functions are hot (Java):
async-profiler  # -d 30 -f flame.html -p <pid>
perf record -g -p <pid>; perf report

# 3. System-wide view:
mpstat -P ALL 1   # Per-CPU utilization
vmstat 1          # Context switches, interrupts

# 4. Java-specific:
jstack <pid>      # Thread dump (look for RUNNABLE threads)
jcmd <pid> Thread.print
```

---

### Q: How would you diagnose a memory leak in a Java application?

```bash
# 1. Monitor heap usage over time:
jstat -gcutil <pid> 5000    # GC stats every 5s (is Old Gen growing?)

# 2. Heap dump:
jmap -dump:format=b,file=heap.hprof <pid>
# Or in OOM: -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/

# 3. Analyze with:
# Eclipse MAT (Memory Analyzer Tool)
# IntelliJ Profiler
# VisualVM

# 4. Look for:
# - Objects with large retained heap
# - Collections that keep growing
# - Classes with unexpectedly many instances
```

---

### Q: What is the difference between CPU-bound and I/O-bound workloads? How does this affect thread pool sizing?

- **CPU-bound**: Workload primarily computes (video encoding, ML inference). Optimal threads = number of CPU cores. More threads cause context-switch overhead.
- **I/O-bound**: Workload primarily waits for I/O (DB queries, HTTP calls). Threads can be blocked waiting → need more threads (or async I/O). Rule of thumb: `threads = cores × (1 + wait_ratio/compute_ratio)`.

With **Java Virtual Threads (Java 21+)**: One virtual thread per request is fine even for I/O-bound — the JVM unmounts the virtual thread from an OS thread during blocking I/O.

```java
// Platform threads: size pool carefully
ExecutorService pool = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors() * 2  // I/O-bound heuristic
);

// Virtual threads (Java 21+): don't think about pool sizing
ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();
```

---

## Bonus: Tricky / Advanced Questions

### Q: Can a process have multiple stacks?

Yes. Each thread in a process has its own stack. The process's stack (in a single-threaded process) is allocated by the OS. Additional stacks can be created using `mmap(MAP_ANONYMOUS)` and used as alternate stacks for `sigaltstack()` (needed to handle `SIGSEGV` from stack overflow).

### Q: What happens if two processes try to write to the same file simultaneously?

Without synchronization: writes may interleave at the page or block level → corruption. `O_APPEND` flag makes `write()` atomic for writes ≤ `PIPE_BUF` bytes (4096 on Linux). For larger or structured writes, use advisory locks (`flock()`, `fcntl()`), or a mutex, or a database.

### Q: Why is `malloc(0)` not undefined behavior in C?

`malloc(0)` returns either a unique non-NULL pointer or NULL (implementation-defined). The returned pointer must be passed to `free()`. It's useful in generic code where size is computed and might be 0.

### Q: What is the `LD_PRELOAD` trick?

`LD_PRELOAD` is an environment variable that makes the dynamic linker load a shared library **before all others**, including libc. Your functions override the standard ones. Uses: memory debugging (`valgrind`, `tcmalloc`), mocking syscalls in tests, `faketime` (intercepts `clock_gettime`).

```bash
LD_PRELOAD=/usr/lib/libfaketime.so.1 FAKETIME="-15d" ./myprogram
```

### Q: What is the difference between `mmap(MAP_SHARED)` and `mmap(MAP_PRIVATE)`?

- `MAP_SHARED`: Writes are visible to all processes mapping the same file/region. Written back to the file. Used for IPC.
- `MAP_PRIVATE`: Copy-on-write. Writes create private copies — not visible to other processes, not written to the file. Used for loading executables (modifications don't corrupt the binary).

---

## Advanced Editorial Pass: Interview Depth Through Operational Reasoning

### Senior Engineering Focus
- Answer with context, trade-off, and failure containment strategy.
- Connect OS concepts to real production incidents and diagnostics.
- Prioritize measurable outcomes over textbook-only definitions.

### Failure Modes to Anticipate
- Concept-only answers without system-level implications.
- Ignoring observability and triage workflow in explanations.
- Over-generalizing without workload assumptions.

### Practical Heuristics
1. For each answer, include one bottleneck and one mitigation.
2. Use Linux command evidence in scenario walkthroughs.
3. Practice concise 2-minute narratives: problem, root cause, correction.

### Compare Next
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
- [Memory Management](./memory-management.md)
- [CPU Scheduling](./cpu-scheduling.md)
