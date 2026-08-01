---
id: memory-management
title: Memory Management — OS & Java
sidebar_label: Memory Management
description: A complete guide to memory management — virtual memory, paging, TLB, page replacement, fragmentation, Linux allocators, JVM heap regions, GC algorithms, tuning, and production memory profiling. Beginner through senior depth.
tags: [operating-systems, memory-management, virtual-memory, paging, garbage-collection, jvm, java, tlb, gc-tuning, off-heap]
sidebar_position: 3
---

import OsMemoryManagementDiagram from '@site/src/components/OsMemoryManagementDiagram';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Memory Management — OS & Java

<OsMemoryManagementDiagram />

---

:::info[Who this guide is for]
- **New learners** — start at [Why Memory Management?](#why-memory-management) and [Virtual Memory](#virtual-memory) to understand the problem and the elegant solution.
- **Senior engineers** — jump to [Multi-Level Page Tables](#multi-level-page-tables), [Page Replacement Algorithms](#page-replacement-algorithms), [Linux Memory Internals](#linux-memory-internals), [JVM GC Deep Dive](#jvm-gc-deep-dive), or [Production Tuning](#production-memory-tuning).
:::

---

## Why Memory Management?

A modern operating system runs hundreds of processes simultaneously. RAM is a finite resource. Without a sophisticated memory management subsystem, every memory allocation carries catastrophic risks: processes overwriting each other's state, malicious code reading secret keys from neighboring memory, or a memory leak in one app crashing the host.

### Why not just give each process direct physical RAM?

In a 64-bit architecture, the virtual address space per process is $2^{64}$ bytes ($18\text{ exabytes}$). No hardware possesses that much physical RAM. Virtual memory solves this by:

1. **Isolation**: Guaranteeing that Process A cannot reference Process B's memory addresses directly.
2. **Overcommit & Demand Paging**: Allocating physical RAM frames only when virtual pages are actually read or written.
3. **Paging to Disk (Swap)**: Evicting cold, inactive pages to swap storage when physical RAM is constrained.
4. **Memory Sharing**: Mapping identical physical RAM frames across processes for shared dynamic libraries (`libc.so`) and Copy-on-Write (`fork()`) pages.

---

## Address Binding

Before a program executes, machine instruction addresses undergo three binding stages:

| Stage | Responsible Component | Description | Example |
|-------|------------|-------------|---------|
| **Compile Time** | Compiler / Assembler | Absolute physical addresses embedded directly into binary machine code. | Legacy MS-DOS `.COM` files — must load at fixed address `0x0100`. |
| **Load Time** | OS Linker / Loader | Relocatable machine code — instruction addresses are calculated when loaded into memory. | Static linking before hardware virtual memory MMUs. |
| **Execution Time** | Hardware MMU | Dynamic address translation on every instruction execution. Virtual address $\to$ Physical address. | All modern operating systems (Linux, macOS, Windows). |

Modern operating systems use **execution-time binding** exclusively. The CPU Memory Management Unit (MMU) translates every virtual address accessed by a process into a physical RAM address on the fly.

---

## Paging

**Paging** eliminates external memory fragmentation by partitioning physical RAM into fixed-size chunks called **frames** (typically $4\text{ KB}$ or $2\text{ MB}$ huge pages) and virtual memory into matching fixed-size **pages**.

```
+------------------------+                     +------------------------+
| Virtual Address Space  |                     |  Physical RAM (Frames) |
|   (Process View)       |   Page Table Map    |     (Hardware RAM)     |
+------------------------+  +---------------+  +------------------------+
| Page 0 (0x0000..0x0FFF)|->| Page 0 -> Frame 5|->| Frame 0 (0x0000..0x0FFF)|
| Page 1 (0x1000..0x1FFF)|->| Page 1 -> Frame 2|->| Frame 1 (0x1000..0x1FFF)|
| Page 2 (0x2000..0x2FFF)|->| Page 2 -> Frame 9|->| Frame 2 (Page 1 Data)  |
+------------------------+  +---------------+  +------------------------+
```

### Page Table Entry (PTE) Bit Structure

Each process has a kernel-managed Page Table. A 64-bit PTE contains both frame pointers and control bits:

| Bit | Name | Purpose |
|-----|------|---------|
| `P` | Present / Valid | `1` = Page resides in physical RAM; `0` = Page fault trap (swapped to disk or unmapped). |
| `R/W` | Read / Write | `1` = Read-Write allowed; `0` = Read-Only (triggers Segmentation Fault on write attempt). |
| `U/S` | User / Supervisor | `1` = User mode (Ring 3) accessible; `0` = Kernel mode (Ring 0) restricted only. |
| `A` | Accessed | Set to `1` by hardware MMU when page is read/written. Used by LRU page replacement algorithms. |
| `D` | Dirty | Set to `1` by hardware MMU when page is written to. Must write back to disk before frame eviction. |
| `NX` | No-Execute | `1` = Executing code from this page causes CPU trap (prevents stack buffer overflow attacks). |
| **PFN** | Physical Frame Number | High 40 bits containing physical RAM frame base address. |

### Fragmentation Comparison

| Allocation Strategy | External Fragmentation | Internal Fragmentation |
|---|:---:|:---:|
| **Contiguous Allocation** | ✅ Severe — variable free holes too small for new allocations. | ❌ None |
| **Paging ($4\text{ KB}$ fixed)** | ❌ None — any free frame can hold any virtual page. | ✅ Minimal — average half-page ($2\text{ KB}$) wasted per segment. |
| **Segmentation** | ✅ High — variable length segments leave unusable gaps over time. | ❌ None |

---

## Multi-Level Page Tables

On a 64-bit x86-64 CPU with $4\text{ KB}$ pages, a single flat page table per process would require over $2^{52}$ entries ($32\text{ Petabytes}$ of RAM just for the page table).

Linux uses **4-Level (or 5-Level) Page Tables** to keep page table overhead proportional to *allocated* virtual memory rather than total potential virtual address space:

```
Virtual Address (64-bit):
+----------+----------+----------+----------+-------------------+
|  PGD/P4D |   PUD    |    PMD   |    PTE   |  Offset (12 bits) |
| (9 bits) | (9 bits) | (9 bits) | (9 bits) |   (0..4095 bytes) |
+----------+----------+----------+----------+-------------------+
     |          |          |          |
     v          v          v          v
  Level 4    Level 3    Level 2    Level 1      Physical Frame
  (CR3 reg)                          (PTE) ----> (4KB RAM Frame)
```

1. **Page Global Directory (PGD)**: Top-level table pointer stored in CPU `CR3` register.
2. **Page Upper Directory (PUD)**
3. **Page Middle Directory (PMD)**
4. **Page Table Entry (PTE)**: Contains final Physical Frame Number (PFN).

---

## Translation Lookaside Buffer (TLB)

Walking a 4-level page table requires 4 separate memory accesses for every single virtual memory read or write. To eliminate this bottleneck, CPU hardware includes a **Translation Lookaside Buffer (TLB)** — a high-speed, fully associative hardware cache built directly into the processor core.

- **TLB Hit**: MMU resolves physical frame in $\approx 1\text{ ns}$ (0 extra memory reads).
- **TLB Miss**: MMU walks the 4-level page table in RAM ($\approx 30\text{--}100\text{ ns}$ penalty) and populates the TLB entry.
- **ASID (Address Space Identifier)**: Tags TLB entries with process IDs so TLB entries persist across context switches without complete flushes.

---

## Virtual Memory & Demand Paging

**Demand Paging** loads pages into physical RAM only when a process attempts to access them for the first time:

1. Process accesses virtual address `0x7fff1234`.
2. MMU looks up PTE; discovers **Present Bit = 0**.
3. Hardware generates a **Page Fault Exception (Trap 14)** to the OS Kernel.
4. OS Kernel locates page in file/swap storage, allocates a free physical RAM frame, reads page data into RAM, updates PTE (**Present Bit = 1**), and restarts the faulting CPU instruction.

---

## Linux Memory Internals & The Page Cache

Linux manages physical memory through several subsystems:

- **SLAB / SLUB Allocator**: Kernel object memory pool manager (`struct task_struct`, `struct mm_struct`) preventing internal fragmentation of kernel objects.
- **Page Cache**: Transparent OS memory buffer that caches disk files in free RAM. Consecutive file reads execute at RAM speed ($\mu\text{s}$) rather than disk speed ($\text{ms}$).
- **OOM Killer (`oom_score`)**: When physical RAM + Swap is exhausted, the Out-Of-Memory Killer evaluates process `oom_score` values (calculated from memory usage percentage vs `oom_score_adj`) and sends `SIGKILL` (`kill -9`) to the process with highest score.

---

## JVM Garbage Collection & Heap Architecture

The JVM manages its heap memory independently on top of the OS virtual address space:

```
+-------------------------------------------------------------------------+
|                              JVM Heap Memory                            |
+------------------------------------+------------------------------------+
|       Young Generation             |          Old Generation            |
| +--------------+----+----+         |          (Tenured)                 |
| | Eden Space   | S0 | S1 |         |                                    |
| +--------------+----+----+         |                                    |
+------------------------------------+------------------------------------+
|  Metaspace (Off-Heap Native RAM)   | Code Cache (Native JIT Machine Code)|
+------------------------------------+------------------------------------+
```

### Weak Generational Hypothesis
Most objects die young (temporary strings, DTOs, stream buffers).
- **Eden Space**: New Java objects are allocated here via $O(1)$ Bump-the-Pointer allocations (Thread Local Allocation Buffers - TLAB).
- **Survivor Spaces (S0 / S1)**: Objects that survive a Minor GC are copied between S0 and S1.
- **Tenured (Old) Generation**: Objects surviving $N$ GC cycles (tenuring threshold, default 15) are promoted to Old Gen.

### Collector Comparison

| GC Collector | Target Heaps | STW Pause Target | Strategy |
|---|---|---|---|
| **G1 GC** | $4\text{ GB}\text{--}64\text{ GB}$ | $200\text{ ms}$ (configurable) | Region-based parallel compaction; collects garbage-dense regions first. |
| **ZGC** | $16\text{ GB}\text{--}16\text{ TB}$ | $< 1\text{ ms}$ | Concurrent colored pointers and load barriers; zero pause scaling with heap size. |
| **Shenandoah** | $4\text{ GB}\text{--}100\text{ GB}+$ | $< 10\text{ ms}$ | Ultra-low pause concurrent Brooks pointer compaction. |

---

## Sizing the JVM Heap Correctly

```
Heap Sizing Heuristic Formula:
  1. Measure Live Data Size (LD) = Heap memory usage immediately after Full GC.
  2. Max Heap (-Xmx) = LD * 3 to LD * 4 (provides 200% headroom for GC throughput).
  3. Set Min Heap (-Xms) = Max Heap (-Xmx) to eliminate runtime heap expansion pauses.
  4. Max RAM Limit = Ensure -Xmx + Off-Heap Memory <= 75% of Container/System RAM.

Example Sizing for 8 GB RAM Container:
  Measured Live Data (LD) = 1.5 GB
  Set -Xmx4g -Xms4g
  Off-Heap Reserved:
    - Metaspace: -XX:MaxMetaspaceSize=256m
    - Code Cache: -XX:ReservedCodeCacheSize=256m
    - Direct Memory: -XX:MaxDirectMemorySize=512m
    - Thread Stacks: 200 threads * 1MB = 200m
  Total RAM Footprint = 4.0GB (Heap) + 1.2GB (Off-Heap) = 5.2 GB (Safely within 8GB limit).
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Setting `-Xmx` equal to total Docker container RAM limit | JVM off-heap memory (Metaspace, Thread Stacks, Direct Buffers) pushes total RAM above limit, causing OS `OOM Killer` `SIGKILL`. | Cap `-Xmx` to $\le 75\%$ of container RAM (`-XX:MaxRAMPercentage=75.0`). |
| Swapping enabled on production JVM hosts | GC STW phases scan swapped-out heap pages on disk, causing STW pauses to jump from milliseconds to 60+ seconds. | Disable swap (`swapoff -a`) or set `vm.swappiness=0`. |
| Unbounded `ThreadLocal` or static collection storage | Retains object references indefinitely across request threads, causing progressive heap growth. | Always clear `ThreadLocal` in `finally` block or use bounded caches (`Caffeine`). |

---

## Interview Questions

### Q1. What is the role of the MMU and TLB in virtual memory address translation?
> The Memory Management Unit (MMU) is the CPU hardware component that translates virtual memory addresses accessed by a process into physical RAM addresses using multi-level page tables. Because walking 4-level page tables in RAM adds a 4x latency penalty (~40–100ns per read), the MMU relies on the Translation Lookaside Buffer (TLB) — an ultra-fast hardware cache storing recent virtual-to-physical address mappings. A TLB hit resolves addresses in ~1ns with zero additional RAM reads.

### Q2. What is a Page Fault trap and how does the OS handle major vs minor page faults?
> A Page Fault is a CPU hardware trap (Trap 14) raised when a process accesses a virtual page whose Page Table Entry has Present Bit = 0. A **Minor Page Fault** occurs when the required physical frame is already in RAM (e.g., shared library memory or freshly allocated demand page); the kernel updates the PTE valid bit without disk I/O. A **Major Page Fault** occurs when the page resides on swap disk or secondary storage; the kernel suspends the thread, initiates asynchronous disk reads (~10ms), populates a free RAM frame, updates the PTE, and resumes thread execution.

### Q3. How does internal fragmentation differ from external fragmentation?
> External fragmentation occurs when total unallocated physical memory is sufficient to satisfy a request, but the memory is split into non-contiguous small gaps, preventing contiguous allocation (common in pure segmentation). Internal fragmentation occurs when memory is allocated in fixed-size blocks (e.g., 4 KB pages); if a process requests 1 KB, the remaining 3 KB of the 4 KB page frame goes unused and cannot be allocated to another process. Paging completely eliminates external fragmentation at the cost of minor internal fragmentation.

### Q4. What is the Weak Generational Hypothesis in garbage collection?
> The Weak Generational Hypothesis states that in the vast majority of software applications, most allocated objects die shortly after creation (e.g., HTTP request DTOs, string builders, method variables). JVM garbage collectors exploit this by partitioning the heap into Young and Old generations: Young Gen collections (Minor GC) occur frequently over a small memory footprint with low STW pause times, while surviving objects are promoted to Old Gen for infrequent Major GC passes.

### Q5. What is the difference between Heap memory and Off-Heap (Direct) memory in Java?
> Heap memory is allocated inside the JVM's managed memory pool (`-Xmx`) and is subject to Garbage Collection passes and STW pause overhead. Off-Heap memory (e.g., `ByteBuffer.allocateDirect()`) is allocated directly from the OS virtual address space via native `malloc()`. Off-Heap memory allows Zero-Copy network and disk I/O (OS kernel DMA reads directly from off-heap RAM without copying bytes through the JVM heap), but requires explicit lifecycle management or Native `Cleaner` hooks to prevent native memory leaks.

---

## See Also

- [Processes & Threads — Complete Guide](./processes-and-threads.md)
- [CPU Scheduling](./cpu-scheduling.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
