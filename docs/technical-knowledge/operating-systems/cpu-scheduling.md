---
id: cpu-scheduling
title: CPU Scheduling
description: CPU scheduling algorithms, metrics, multilevel queues, real-time scheduling, and how the Linux CFS scheduler works.
tags:
  - operating-systems
  - cpu-scheduling
  - algorithms
  - linux
  - performance
sidebar_position: 2
---

import OsCpuSchedulingDiagram from '@site/src/components/OsCpuSchedulingDiagram';

# CPU Scheduling

<OsCpuSchedulingDiagram />

---

CPU scheduling decides which process or thread runs on an active CPU core at any given microsecond. The **CPU Scheduler** (or dispatcher) is the OS kernel component responsible for allocating processor execution time to processes in the ready queue while maximizing throughput and minimizing tail latency.

---

## Scheduling Concepts

### CPU–I/O Burst Cycle

Processes alternate between two primary execution phases:
- **CPU burst**: Actively executing CPU machine instructions (ALU math, memory access, register operations).
- **I/O burst**: Waiting for an external input/output device operation to complete (disk block read, network packet receive, user input).

- **CPU-bound processes**: Characterized by long CPU bursts and infrequent I/O operations (e.g., video rendering, matrix multiplication, machine learning training).
- **I/O-bound processes**: Characterized by short CPU bursts and frequent I/O operations (e.g., NGINX web server, PostgreSQL database, microservice REST APIs).

### Preemptive vs Non-Preemptive

| Property | Non-Preemptive Scheduling | Preemptive Scheduling |
|---|---|---|
| **Mechanism** | Process holds CPU until it voluntarily yields (`sched_yield()`), terminates, or blocks on I/O. | OS kernel forcibly interrupts running process via hardware timer interrupts (e.g., 1000 Hz APIC timer). |
| **Latency & Control** | Unpredictable — a long CPU-bound task starves all waiting tasks. | Bounded response time — guarantees fair distribution of CPU time slices. |
| **Kernel Complexity** | Simple — no race conditions in scheduler data structures. | High — requires kernel synchronization (locks, spinlocks) for safe ready-queue access. |
| **Algorithms** | FCFS, Non-Preemptive SJF | Round Robin, SRTF, Multilevel Feedback Queue (MLFQ), Linux CFS |

---

## Scheduling Metrics

When evaluating CPU scheduling performance, system engineers measure five core metrics:

1. **CPU Utilization**: Percentage of time the CPU is actively performing useful work (target: 40% to 90%).
2. **Throughput**: Number of processes or tasks completed per unit of time (e.g., transactions per second).
3. **Turnaround Time**: Total time elapsed from task submission to completion ($T_{\text{turnaround}} = T_{\text{completion}} - T_{\text{arrival}}$).
4. **Waiting Time**: Total cumulative time a process spends waiting in the ready queue ($T_{\text{wait}} = T_{\text{turnaround}} - T_{\text{burst}}$).
5. **Response Time**: Time elapsed from task submission until the first response or execution burst begins ($T_{\text{response}} = T_{\text{first\_exec}} - T_{\text{arrival}}$).

---

## The 7 Core Scheduling Algorithms

### 1. First-Come, First-Served (FCFS)
- **Type**: Non-preemptive.
- **Mechanism**: Tasks are scheduled in exact order of arrival in the ready queue (FIFO).
- **Flaw (Convoy Effect)**: If a long CPU-bound task arrives first, all subsequent short I/O-bound tasks are blocked behind it, severely reducing I/O throughput and responsiveness.

### 2. Shortest Job First (SJF)
- **Type**: Non-preemptive.
- **Mechanism**: Assigns CPU to the process with the shortest predicted next CPU burst length.
- **Optimality**: Provably yields the minimum average waiting time for a static set of processes.
- **Flaw**: Requires knowing the future CPU burst duration in advance. Can cause **starvation** for long tasks if short tasks continually arrive.

### 3. Shortest Remaining Time First (SRTF)
- **Type**: Preemptive version of SJF.
- **Mechanism**: If a newly arrived process has a remaining CPU burst shorter than the currently running process's remaining time, the running process is immediately preempted.

### 4. Round Robin (RR)
- **Type**: Preemptive.
- **Mechanism**: Each process is assigned a small unit of CPU time called a **time quantum** (typically 10ms–100ms). The scheduler cycles through the ready queue in FIFO order. If a process does not complete within its quantum, it is preempted and returned to the tail of the ready queue.
- **Quantum Sizing**:
  - *Too Large*: Degenerates into FCFS (long wait times for short jobs).
  - *Too Small*: Excessive context-switching overhead evicts CPU cache lines, degrading overall throughput.

### 5. Priority Scheduling
- **Type**: Preemptive or Non-Preemptive.
- **Mechanism**: Each process is assigned a priority integer. The CPU is allocated to the process with the highest priority.
- **Starvation Mitigation (Aging)**: Long-waiting lower-priority processes periodically have their priority incremented (aged) until they execute.

### 6. Multilevel Queue (MLQ)
- **Type**: Preemptive / Non-Preemptive.
- **Mechanism**: Partitions the ready queue into separate sub-queues based on task type (e.g., System Processes, Interactive Foreground, Batch Background). Each queue has its own scheduling algorithm and static priority hierarchy.

### 7. Multilevel Feedback Queue (MLFQ)
- **Type**: Preemptive.
- **Mechanism**: Allows processes to move dynamically between queues based on past CPU usage history:
  - New tasks enter the highest-priority queue with a short time quantum.
  - If a task uses its entire quantum without blocking, it is demoted to a lower-priority queue (longer quantum).
  - If a task yields for I/O, it remains in or is promoted to a higher-priority queue.
  - Periodic **Aging Boost**: Moves all processes to the top queue to prevent starvation.

---

## Linux Completely Fair Scheduler (CFS)

Since Linux kernel 2.6.23, the standard scheduler for non-real-time processes (`SCHED_NORMAL`) is the **Completely Fair Scheduler (CFS)**.

### Core Architecture & Virtual Runtime (`vruntime`)

CFS models an "ideal, precise multi-tasking CPU" on hardware. Rather than using fixed time slices, CFS tracks the cumulative virtual execution time of each task via `vruntime`:

$$\text{vruntime}_{\text{new}} = \text{vruntime}_{\text{old}} + \text{actual\_exec\_time} \times \left( \frac{\text{NICE\_0\_LOAD}}{\text{task\_weight}} \right)$$

- **`nice` values**: Range from **$-20$** (highest priority, weight $= 88761$) to **$+19$** (lowest priority, weight $= 15$). Default `nice 0` has weight $1024$.
- Tasks with higher priority (lower nice) have larger weights, causing their `vruntime` to increase at a much slower rate. Consequently, CFS selects them for execution more frequently.

### Red-Black Tree Data Structure

CFS maintains all runnable tasks in a self-balancing **Red-Black Tree** sorted by `vruntime` ($O(\log N)$ insertion and deletion):
- The leftmost node (`rb_leftmost`) represents the runnable process with the absolute smallest `vruntime`.
- The scheduler always picks `rb_leftmost` to execute next ($O(1)$ selection lookup).

```
                      ( Root: vruntime = 45ms )
                             /          \
                            /            \
          ( vruntime = 20ms )            ( vruntime = 80ms )
                 /
                /
    [ Leftmost: vruntime = 5ms ] <--- Next process selected by CFS
```

### Linux Scheduling Classes (Priority Order)

1. `SCHED_DEADLINE`: Earliest Deadline First (EDF) real-time tasks.
2. `SCHED_FIFO` / `SCHED_RR`: POSIX real-time tasks with fixed priorities $1\text{--}99$.
3. `SCHED_NORMAL` (other) / `SCHED_BATCH` / `SCHED_IDLE`: Standard CFS tasks.

---

## Multiprocessor & NUMA Scheduling

### Symmetric Multiprocessing (SMP)
In SMP systems, each CPU core runs its own instance of the scheduler on a per-core ready queue. To balance load across cores, the kernel uses:
- **Push Migration**: Overloaded cores push idle tasks to underutilized cores.
- **Pull Migration**: Idle cores actively pull tasks from busy cores' run-queues.

### Processor Affinity & Cache Warmth
Processor affinity binds a process to specific CPU cores to maintain **CPU L1/L2 cache warmth**:
- **Soft Affinity**: The scheduler prefers keeping a task on the same core.
- **Hard Affinity**: Pins a process to explicit CPU cores via `sched_setaffinity()`.

```bash
# Pin process to CPU cores 0 and 1
taskset -c 0,1 java -jar app.jar
```

### NUMA (Non-Uniform Memory Access)
In multi-socket servers, accessing RAM connected to a local CPU socket is significantly faster than accessing remote RAM connected to another socket over QPI/UPI interconnects. Linux **NUMA-aware scheduling** allocates memory pages from local RAM nodes and schedules processes on CPUs local to those memory nodes.

---

## Common Mistakes

| Mistake | Consequence | Mitigation |
|---|---|---|
| Setting aggressive CPU quotas in Kubernetes containers | CFS throttles container threads (`cpu.cfs_quota_us`), causing p99 tail latency spikes even when overall CPU usage is below 50%. | Prefer CPU requests over tight CPU limits for latency-critical microservices; monitor `container_cpu_cfs_throttled_periods_total`. |
| Running heavy CPU-bound background jobs at `nice 0` | Competes equally with user-facing web requests, causing HTTP request queueing. | Run background workers with `nice -n 19` or `ionice -c 3`. |
| Excessive process pinning (`taskset`) on shared hosts | Destroys OS scheduler load balancing, causing CPU core starvation on pinned cores while adjacent cores sit idle. | Use soft affinity / cgroups instead of hard affinity unless running dedicated HFT/real-time runtimes. |

---

## Interview Questions

### Q1. What is the fundamental difference between preemptive and non-preemptive CPU scheduling?
> Preemptive scheduling allows the kernel to forcibly suspend a running task via hardware timer interrupts when its time slice expires or a higher-priority task wakes up. Non-preemptive scheduling requires the running task to voluntarily yield control (`sched_yield()`), execute a blocking I/O call, or terminate. Preemptive scheduling guarantees predictable response times for interactive applications but incurs context-switching overhead and requires kernel lock synchronization.

### Q2. Why is Shortest Job First (SJF) optimal in theory but difficult to implement in real operating systems?
> SJF is provably optimal because it minimizes the average waiting time across a set of tasks. However, it requires exact advance knowledge of each process's next CPU burst length, which is impossible to predict accurately in non-deterministic operating environments. Production OS schedulers approximate SJF using exponential moving averages of past CPU bursts or dynamic MLFQ priority demotions.

### Q3. How does the Linux Completely Fair Scheduler (CFS) use virtual runtime (`vruntime`) and Red-Black trees?
> CFS tracks each runnable task's cumulative execution time weighted by its `nice` priority value in a variable called `vruntime`. Lower priority tasks (higher nice value) accrue `vruntime` faster than high priority tasks. CFS stores all runnable tasks in a self-balancing Red-Black tree sorted by `vruntime`. The scheduler always picks the leftmost node (`vruntime` minimum) to run next in $O(1)$ time, guaranteeing that all tasks receive a fair proportional share of CPU bandwidth without starvation.

### Q4. What is the Convoy Effect in CPU scheduling and which algorithm suffers from it?
> The Convoy Effect occurs in First-Come, First-Served (FCFS) scheduling when a single CPU-bound process with a massive burst time occupies the CPU head, forcing dozens of short I/O-bound processes to wait behind it. This degrades system performance because I/O devices sit idle while waiting for short processes to execute their tiny CPU bursts.

### Q5. What is CPU throttling in containerized environments (Docker/Kubernetes) and what causes it?
> Container CPU throttling occurs when a containerized application exceeds its allocated Linux cgroups CFS quota (`cpu.cfs_quota_us`) within a tracking period (`cpu.cfs_period_us`, default 100ms). When a multi-threaded application bursts and consumes its quota early in the 100ms period, the kernel suspends all threads in the cgroup for the remainder of the period, causing severe tail-latency spikes even if overall CPU utilization appears low.

---

## See Also

- [Processes & Threads](./processes-and-threads.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
- [Virtual Memory Deep Dive](./virtual-memory-deep-dive.md)
