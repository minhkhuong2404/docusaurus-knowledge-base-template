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

# CPU Scheduling

CPU scheduling decides which process/thread runs on the CPU at any given time. The **scheduler** is the OS component responsible for this.

## Scheduling Concepts

### CPU–I/O Burst Cycle

Processes alternate between:
- **CPU burst**: Actively executing instructions.
- **I/O burst**: Waiting for I/O to complete.

**CPU-bound** processes: Long CPU bursts, infrequent I/O (e.g., video encoding).  
**I/O-bound** processes: Short CPU bursts, frequent I/O (e.g., web server, database).

### Preemptive vs Non-Preemptive

| | Non-Preemptive | Preemptive |
|---|---|---|
| Description | Process runs until it voluntarily yields or blocks | OS can forcibly remove a running process |
| Latency | Unpredictable | Bounded |
| Complexity | Simple | Complex (need synchronization) |
| Examples | FCFS, SJF (non-preemptive) | Round Robin, SRTF, Linux CFS |

---

## Scheduling Metrics

| Metric | Definition |
|---|---|
| **CPU Utilization** | % of time CPU is busy (target: 40–90%) |
| **Throughput** | Processes completed per unit time |
| **Turnaround Time** | Completion time − Arrival time |
| **Waiting Time** | Time spent in ready queue |
| **Response Time** | First response − Arrival time |

---

## Scheduling Algorithms

### 1. First-Come, First-Served (FCFS)

- **Type**: Non-preemptive
- Processes scheduled in arrival order.
- **Convoy Effect**: Short processes stuck behind a long one.

```
Process: P1(24ms) P2(3ms) P3(3ms), all arrive at t=0
Order:   P1 → P2 → P3
Avg Wait: (0 + 24 + 27) / 3 = 17ms  ← poor
```

### 2. Shortest Job First (SJF)

- **Type**: Non-preemptive (or preemptive → SRTF)
- Selects process with shortest next CPU burst.
- **Optimal average waiting time** (non-preemptive: among non-preemptive algorithms).
- **Problem**: Cannot know burst length in advance → estimate using **exponential averaging**:

```
τ(n+1) = α * t(n) + (1 − α) * τ(n)
```

Where `t(n)` = actual nth burst, `τ(n)` = predicted nth burst, `α ∈ [0, 1]`.

### 3. Shortest Remaining Time First (SRTF)

- **Type**: Preemptive version of SJF.
- When a new process arrives, if its burst < remaining time of current process → preempt.
- **Optimal** average waiting time overall.
- **Starvation** risk for long processes.

### 4. Round Robin (RR)

- **Type**: Preemptive
- Each process gets a fixed **time quantum** (typically 10–100 ms).
- After quantum expires, process goes to end of ready queue.

```
Quantum = 4ms
P1(24ms) P2(3ms) P3(3ms)

P1(4)→P2(3)→P3(3)→P1(4)→...→P1(4)→P1(4)→P1(4)→P1(4)
Avg wait = (6 + 4 + 7) / 3 ≈ 5.67ms
```

**Quantum size matters**:
- Too large → degenerates to FCFS.
- Too small → too many context switches (overhead).
- Rule of thumb: 80% of CPU bursts should be shorter than the quantum.

### 5. Priority Scheduling

- Each process has a priority; highest priority runs first.
- **Preemptive** or non-preemptive.
- **Starvation**: Low-priority processes may never run.
- **Solution**: **Aging** — gradually increase priority of waiting processes.

### 6. Multilevel Queue Scheduling

Ready queue is divided into separate queues (e.g., foreground/background). Each queue has its own scheduling algorithm.

```
┌─────────────────────────────┐ ← Interactive (RR, high priority)
├─────────────────────────────┤ ← System processes
├─────────────────────────────┤ ← Batch (FCFS, low priority)
└─────────────────────────────┘
```

### 7. Multilevel Feedback Queue (MLFQ)

Processes can **move between queues** based on behavior:
- Use a lot of CPU → demoted to lower queue (longer quantum).
- Wait too long → promoted (aging).

This is used in many real OS schedulers.

---

## Linux Completely Fair Scheduler (CFS)

Linux uses **CFS** (since kernel 2.6.23) for normal processes (`SCHED_NORMAL`).

### Core Idea

Each process maintains a **virtual runtime (vruntime)** — how much CPU time it has used, weighted by priority (nice value). The scheduler always picks the process with the **lowest vruntime**.

```
vruntime += actual_runtime * (NICE_0_LOAD / weight)
```

Higher-priority (lower nice) processes have higher weight → vruntime grows slower → they get more CPU.

### Data Structure

CFS uses a **red-black tree** (sorted by vruntime) for O(log n) process selection. The leftmost node is always the next process to run.

### Nice Values

- Range: **−20** (highest priority) to **+19** (lowest priority).
- Each step ≈ 10% more/less CPU time.

```bash
nice -n 10 ./my_program     # start with nice=10
renice -n -5 -p 1234        # change running process
```

### Scheduling Classes (Priority Order)

1. `SCHED_DEADLINE` — EDF (Earliest Deadline First), real-time.
2. `SCHED_FIFO` / `SCHED_RR` — Real-time, fixed priority 1–99.
3. `SCHED_NORMAL` / `SCHED_BATCH` / `SCHED_IDLE` — CFS.

---

## Real-Time Scheduling

### Hard vs Soft Real-Time

| | Hard Real-Time | Soft Real-Time |
|---|---|---|
| Deadline miss | Catastrophic (safety-critical) | Degraded quality |
| Examples | Airbags, pacemakers | Video streaming, audio |

### Algorithms

- **Rate Monotonic (RM)**: Static priority; shorter period → higher priority. Optimal for static-priority preemptive scheduling.
- **Earliest Deadline First (EDF)**: Dynamic priority; closest deadline → highest priority. Optimal for preemptive scheduling (can achieve 100% utilization).

---

## Multiprocessor Scheduling

### Asymmetric vs Symmetric

- **AMP** (Asymmetric): One master CPU handles scheduling, others run user code.
- **SMP** (Symmetric): Each CPU self-schedules from a shared ready queue.

### Processor Affinity

The tendency to keep a process on the same CPU to exploit **warm cache**:
- **Soft affinity**: OS tries but does not guarantee same CPU.
- **Hard affinity**: Process is pinned to specific CPU(s).

```bash
taskset -c 0,1 ./program   # Pin to CPU 0 and 1
```

### Load Balancing

- **Push migration**: Overloaded CPU pushes tasks to idle CPUs.
- **Pull migration**: Idle CPU pulls tasks from busy CPUs.

### NUMA-Aware Scheduling

In Non-Uniform Memory Access systems, accessing local memory is faster. The scheduler tries to keep processes on CPUs near their memory.

---

## Common Interview Questions

### Q1: What is the difference between preemptive and non-preemptive scheduling?

Preemptive: OS can interrupt a running process (e.g., timer interrupt). Non-preemptive: Process runs until it voluntarily yields, completes, or blocks. Preemptive provides better responsiveness but requires synchronization mechanisms.

### Q2: Why is SJF optimal but rarely used in practice?

SJF minimizes average waiting time but requires knowing the next CPU burst length in advance, which is impossible. It can be approximated using exponential averaging of past bursts.

### Q3: What is the convoy effect?

In FCFS, a CPU-bound process with a long burst holds the CPU while many short I/O-bound processes wait. This leads to poor CPU and I/O device utilization.

### Q4: How does Linux CFS prevent starvation?

CFS tracks `vruntime` for all processes. A sleeping process's `vruntime` is set to `min_vruntime` of the tree when it wakes, so it gets scheduled quickly but doesn't completely skip ahead. No process is ever fully starved.

### Q5: What is the difference between `SCHED_FIFO` and `SCHED_RR` in Linux?

Both are real-time. `SCHED_FIFO`: process runs until it blocks or yields — no time quantum. `SCHED_RR`: like FIFO but with a time quantum; when it expires, the process goes to the back of its priority queue.

### Q6: What is processor affinity and why does it matter?

Affinity keeps a process on the same CPU to benefit from hot cache data. Cache misses on migration are expensive (100s of ns). Linux provides `sched_setaffinity()` syscall.

### Q7: How does the time quantum in Round Robin affect performance?

- Large quantum → behaves like FCFS, high turnaround for short jobs.
- Small quantum → more responsive but high context-switch overhead.
- Ideal: quantum just larger than a typical interaction burst.

### Q8: What is aging in scheduling?

Aging incrementally increases the priority of a process that has been waiting a long time, preventing starvation. For example, increase priority by 1 every 15 minutes of waiting.

---

## Advanced Editorial Pass: CPU Scheduling, Fairness, and Tail Latency

### Senior Engineering Focus
- Reason about p99 latency through scheduler behavior, not average CPU utilization.
- Account for cgroup quotas and NUMA effects in containerized deployments.
- Align workload priority policy with business-critical paths.

### Failure Modes to Anticipate
- CPU starvation due to noisy-neighbor effects.
- Misleading utilization metrics masking run-queue congestion.
- Latency regressions after container CPU limit changes.

### Practical Heuristics
1. Track run-queue length and throttling metrics with request latency.
2. Pin high-priority workloads carefully; validate with load tests.
3. Re-check scheduler assumptions after kernel/runtime upgrades.

### Compare Next
- [Processes & Threads](./processes-and-threads.md)
- [Virtual Memory Deep Dive](./virtual-memory-deep-dive.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
