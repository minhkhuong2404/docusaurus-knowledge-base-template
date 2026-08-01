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

import OsInterviewScenariosDiagram from '@site/src/components/OsInterviewScenariosDiagram';

# Common OS Interview Questions

<OsInterviewScenariosDiagram />

---

> This page aggregates the most important interview questions across all OS topics. Useful for FAANG-style system design and backend engineering interviews.

---

## Processes & Threads

### Q1. What is the difference between a process and a thread?
> A process is an isolated execution environment with its own private virtual memory address space (code, heap, stack, data, file descriptors) managed by the OS MMU. A thread is a lightweight execution context within a process; threads in the same process share the heap, text, and data segments but maintain private stacks, registers, and program counters. Process communication requires kernel-managed IPC (pipes, sockets, shared memory), whereas threads communicate directly via shared heap memory.

### Q2. What happens step-by-step when you call `fork()` in Linux?
> 1. The kernel allocates a new `task_struct` (PCB) for the child process.
> 2. Copies the parent's file descriptor table, signal handlers, and virtual memory mappings.
> 3. Configures child page tables as Copy-on-Write (pages shared read-only).
> 4. Assigns a new unique PID to the child.
> 5. Returns `0` to the child process and the child's `PID` to the parent process.
> 6. Both processes execute concurrently from the next instruction following `fork()`.
> 7. On the first write attempt to a shared page by either process, the hardware page fault handler triggers a private physical page allocation.

### Q3. What is a Zombie Process and how do you prevent Zombie leaks?
> A zombie process is a process that has completed execution via `exit()` but retains its entry in the kernel's process table because its parent process has not yet executed `wait()` or `waitpid()` to read its exit status. To prevent zombie leaks, parent processes must handle `SIGCHLD` signals and reap child processes via `waitpid(-1, WNOHANG)`. If a parent process terminates, the kernel automatically reparents orphaned zombies to `init` (PID 1) for automatic cleanup.

### Q4. Explain context switching and its direct and indirect costs.
> A context switch saves the executing thread/process's CPU register state into its PCB and loads another process/thread's saved register state. Direct costs include saving/restoring registers (1–5µs). Indirect costs include CPU L1/L2 cache invalidation and TLB flushes across process boundaries, degrading memory access latency.

---

## CPU Scheduling

### Q5. Why is Shortest Job First (SJF) optimal in theory but impractical in production systems?
> SJF minimizes average waiting time across a set of tasks. However, it requires exact advance knowledge of each process's next CPU burst length, which is impossible to predict accurately in non-deterministic operating environments. Production OS schedulers approximate SJF using exponential moving averages of past CPU bursts or dynamic MLFQ priority demotions.

### Q6. What is the difference between `SCHED_FIFO`, `SCHED_RR`, and `SCHED_OTHER` in Linux?
> `SCHED_FIFO` is a real-time policy where a thread runs until it voluntarily yields or blocks (no time quantum). `SCHED_RR` is a real-time policy with a fixed time quantum. `SCHED_OTHER` (`SCHED_NORMAL`) is the default non-real-time policy managed by the Completely Fair Scheduler (CFS) using virtual runtime (`vruntime`) and nice values. Real-time policies always preempt `SCHED_OTHER` tasks.

---

## Memory Management

### Q7. How does Virtual Memory eliminate external memory fragmentation?
> Virtual Memory uses Paging to partition physical RAM into fixed-size frames (typically 4 KB) and virtual address spaces into matching fixed-size pages. The MMU maps any virtual page to any available physical frame, eliminating external fragmentation because any free frame can fulfill an allocation request regardless of contiguous physical alignment.

### Q8. What is Memory Thrashing and how is it detected and prevented?
> Thrashing occurs when a process's active working set exceeds available physical RAM frames, causing the system to spend more time swapping pages to disk than executing instructions. Diagnosis: high swap-in/swap-out activity (`vmstat`) with low CPU utilization. Prevention: increase physical RAM, reduce concurrency limits, or use `mlock()` to pin critical memory pages in RAM.

---

## Synchronization & Deadlocks

### Q9. What are the four Coffman conditions for Deadlock and how can each be prevented?
> 1. **Mutual Exclusion**: Make resources sharable (e.g., read-only files).
> 2. **Hold and Wait**: Require processes to request all needed resources simultaneously.
> 3. **No Preemption**: Allow the OS to preempt resources held by a waiting process.
> 4. **Circular Wait**: Enforce a strict global ordering on resource acquisition across all threads.

### Q10. What is Priority Inversion and how is it resolved?
> Priority Inversion occurs when a low-priority thread holds a lock needed by a high-priority thread, and a medium-priority thread preempts the low-priority thread, indirectly delaying the high-priority thread. Solution: **Priority Inheritance**, where the low-priority thread temporarily inherits the high-priority thread's priority while holding the lock.

---

## Linux Internals & I/O

### Q11. How do Linux Namespaces and cgroups enable container isolation?
> Namespaces isolate *what a process can see* (providing virtualized views of PIDs, Network interfaces, Mount points, Hostnames, and User IDs). Control Groups (cgroups) restrict *how much a process can consume* (enforcing strict limits on CPU quota, RAM RSS memory limits, and Block I/O bandwidth). Containers are standard Linux processes governed by Namespaces and cgroups.

### Q12. What is the internal difference between `write()` and `fsync()`?
> `write()` copies data from user space buffers into the OS kernel **Page Cache** in RAM and returns immediately (non-durable write). `fsync(fd)` forces the kernel to flush all dirty page cache bytes and metadata associated with the file descriptor directly to non-volatile physical disk storage, blocking until hardware confirmation is received.

---

## See Also

- [Processes & Threads](./processes-and-threads.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
- [Memory Management](./memory-management.md)
