---
id: virtual-memory-deep-dive
title: "Virtual Memory — Deep Dive"
description: A comprehensive guide to virtual memory — covering address spaces, paging mechanics, swap, OOM killer, huge pages, NUMA, and practical Linux/JVM tuning for senior engineers.
tags:
  - operating-systems
  - virtual-memory
  - swap
  - numa
  - huge-pages
  - linux
  - performance
  - jvm
  - java
sidebar_position: 7
---

import OsVirtualMemoryDiagram from '@site/src/components/OsVirtualMemoryDiagram';

# Virtual Memory — Deep Dive

<OsVirtualMemoryDiagram />

---

> **Virtual Memory** is the operating system abstraction that provides every process with the illusion of possessing an exclusive, flat, contiguous memory address space. The OS kernel, assisted by processor MMU hardware, translates virtual addresses to physical RAM addresses on every single instruction execution, multiplexing hardware RAM among all running processes safely.

Understanding virtual memory at the kernel level is essential for senior backend engineers diagnosing production latency spikes, major page fault storms, container OOM kills, and GC pause anomalies.

:::info[Who this guide is for]
- **New learners** — start at [The Hotel Analogy](#the-hotel-analogy) and [How Paging Works](#how-paging-works-the-core-mechanism).
- **Senior engineers** — jump to [TLB and Huge Pages](#tlb-and-huge-pages), [NUMA Architecture](#numa-non-uniform-memory-access), [OOM Killer Internals](#oom-killer), [JVM Memory Model](#jvm-and-virtual-memory), or [Production Tuning](#production-linux-memory-tuning).
:::

---

## The Hotel Analogy

Consider a hotel with 200 physical rooms (Physical RAM). The hotel front desk accepts reservations for 500 future guests (Virtual Address Space overcommit). Most guests do not occupy their rooms simultaneously.

- **Without Virtual Memory**: Every guest is assigned a permanent, hard-coded room number (`0x0040...`). If two guests try to use the same room number, a collision occurs and the system crashes.
- **With Virtual Memory**: The front desk maintains a **guest mapping ledger** (the Page Table). Guests only request virtual numbers (e.g., "Suite 1"). The MMU front-desk translates: *"Guest A's Suite 1 is physical Room 47. Guest B's Suite 1 is physical Room 103."*

When a guest requests a Suite not currently ready in RAM (a **Page Fault**), the manager moves inactive guest luggage to secondary warehouse storage (Swap), prepares the physical room, updates the ledger, and allows the guest to enter.

---

## Virtual Address Space Layout (Linux x86-64)

On a 64-bit Linux architecture, the $48\text{-bit}$ virtual address space is partitioned into canonical user and kernel ranges:

```
+-------------------------------------------------------------+ 0xFFFFFFFFFFFFFFFF
|                Kernel Virtual Address Space                 |
|               (128 TB - Direct RAM Map, Modules)            |
+-------------------------------------------------------------+ 0xFFFF800000000000
|                Non-Canonical Unmapped Hole                  |
|                 (16,777,216 Terabytes)                      |
+-------------------------------------------------------------+ 0x00007FFFFFFFFFFF
|                User Virtual Address Space                   |
|  - Environment & Stack (Grows Down v)                       |
|  - Memory Mappings (mmap, Shared Libraries)                 |
|  - Heap Segment (malloc / JVM Heap) (Grows Up ^)           |
|  - BSS & Data Segments                                      |
|  - Text Segment (Binary Executable)                         |
+-------------------------------------------------------------+ 0x0000000000000000
```

### 🔬 Senior Deep-Dive: 4-Level Page Table Walking Math

On x86-64 Linux, translating a 48-bit virtual address into a physical address requires walking 4 page directory levels:

$$\text{Virtual Address (48 bits)} = \text{PML4 (9 bits)} \ \Vert \ \text{PUD (9 bits)} \ \Vert \ \text{PMD (9 bits)} \ \Vert \ \text{PTE (9 bits)} \ \Vert \ \text{Offset (12 bits)}$$

```
CR3 Register (Base Physical Address of PML4)
   |
   +---> PML4 Table [9 bits] ---> PUD Table [9 bits] ---> PMD Table [9 bits] ---> PTE Entry [9 bits]
                                                                                     |
                                                                                     v
                                                                          Physical Frame + Offset (12 bits)
```

- Each directory level contains $2^9 = 512$ entries ($8\text{ bytes}$ per entry $\to 4\text{ KB}$ table size).
- The low 12 bits select the exact byte offset within the $4\text{ KB}$ physical frame ($2^{12} = 4096\text{ bytes}$).
- **5-Level Paging (P4D)**: Modern kernels support 57-bit virtual address spaces ($128\text{ PB}$ limit) adding a 5th directory level.

### Page Table Entry (PTE) Hardware Flags

Every $4\text{ KB}$ virtual page has a corresponding 64-bit Page Table Entry containing hardware control flags:

```
+-------------------+---+---+---+---+---+---+---+------------------+
| Physical Frame    | N | G | D | A | C | W | U | R | Present Bit |
|  Number (PFN)     | X |   |   |   | D | T | S | W | (1=RAM, 0=Swap) |
+-------------------+---+---+---+---+---+---+---+------------------+
```

- **Present Bit (P=1)**: Page is resident in physical RAM. If `P=0`, CPU hardware raises an Interrupt 14 Page Fault Trap to the kernel.
- **Read/Write Bit (R/W)**: `0` = Read-only page (e.g., Code Text segment); `1` = Read-Write (e.g., Heap/Stack). Writes to `R/W=0` pages trigger a `Segmentation Fault` (SIGSEGV).
- **User/Supervisor Bit (U/S)**: `0` = Kernel ring 0 access only; `1` = User ring 3 access permitted.
- **Dirty Bit (D=1)**: Page modified since load. Must write to disk/swap before reclaiming frame.
- **Accessed Bit (A=1)**: Page referenced recently. Used by kernel page reclaim (`kswapd`).
- **No-Execute (NX Bit)**: Prevents executing machine instructions from Heap or Stack (mitigates buffer overflow exploits).

---

## TLB & Huge Pages (Static vs THP)

### Translation Lookaside Buffer (TLB)
The CPU TLB is an associative hardware L1 cache for virtual-to-physical address mappings.
- A standard 64-bit Linux page is $4\text{ KB}$.
- A $32\text{ GB}$ JVM Heap requires $8,388,608$ page table entries.
- Hardware L2 TLBs hold only $\approx 2,048$ entries. Consequently, a large heap incurs massive TLB miss rates, causing $\approx 10\text{--}20\%$ CPU overhead spent solely walking page tables in RAM (`page_walk` latency).

### Solution: Huge Pages ($2\text{ MB}$ / $1\text{ GB}$)
Using $2\text{ MB}$ Huge Pages reduces the page table entry count for a $32\text{ GB}$ heap from $8.3\text{M}$ entries to just $16,384$ entries, allowing the entire heap mapping to fit cleanly inside hardware TLB caches.

- **Static Huge Pages (`-XX:+UseLargePages`)**: Pre-allocated at OS boot (`vm.nr_hugepages`). Guarantees TLB acceleration with zero runtime compaction overhead.
- **Transparent Huge Pages (THP)**: OS automatically attempts to merge $4\text{ KB}$ pages into $2\text{ MB}$ pages via `khugepaged`.
  - ⚠️ **Gotcha**: `khugepaged` acquires memory locks during background page defragmentation, introducing random $50\text{--}500\text{ ms}$ latency freezes that mimic severe JVM GC STW pauses.
  - **Production Recommendation**: Disable THP (`echo never > /sys/kernel/mm/transparent_hugepage/enabled`) for Java, Kafka, and Redis servers.

---

## NUMA (Non-Uniform Memory Access)

In multi-socket enterprise servers, each CPU socket connects directly to its local RAM bank via a local memory controller:

```
+------------------------+             +------------------------+
|   CPU Socket 0         |             |   CPU Socket 1         |
|   (Core 0 .. Core 15)  |             |   (Core 16 .. Core 31) |
+-----------+------------+             +-----------+------------+
            |  Local                                |  Local
            v                                       v
+------------------------+   Interconnect   +------------------------+
|  NUMA Memory Node 0    |<===============>|  NUMA Memory Node 1    |
|   (64 GB RAM)          |    (UPI / QPI)   |   (64 GB RAM)          |
+------------------------+                  +------------------------+
```

- **Local RAM Access**: $\approx 60\text{ ns}$ latency.
- **Remote Socket RAM Access**: $\approx 120\text{ ns}$ latency (traverses cross-socket UPI interconnect).
- **JVM NUMA Tuning**: Enable `-XX:+UseNUMA` so the JVM allocates Eden space regions locally across NUMA nodes matching thread core affinity.

---

## Swap Mechanics & `vm.swappiness`

Swap allows Linux to write inactive memory pages to disk when physical RAM is exhausted.

- **`vm.swappiness` (Range: 0–200)**: Controls the kernel's relative preference for reclaiming page cache memory vs swapping out anonymous application heap pages.
- Default `swappiness = 60` is optimized for desktop responsiveness, but dangerous for JVM database and backend servers: if the kernel swaps JVM heap pages to disk, subsequent GC passes scanning those pages will trigger major page faults, causing GC pause times to inflate from $50\text{ ms}$ to $30\text{ seconds}$.
- **Production Recommendation**: Set `vm.swappiness = 1` for backend Java, Kafka, and Redis servers (tells kernel to prefer evicting file page cache over swapping heap memory, while retaining emergency swap capacity).

---

## OOM Killer Mechanics (`oom_score_adj`)

When physical RAM and swap space are completely exhausted, the Linux kernel invokes the **Out-Of-Memory (OOM) Killer**.

1. The kernel calculates `oom_score` for every process:
$$\text{oom\_score} = \left( \frac{\text{process\_rss}}{\text{total\_ram}} \times 1000 \right) + \text{oom\_score\_adj}$$
2. The process with the highest `oom_score` receives a SIGKILL (`kill -9`).

```bash
# Protect critical master process from OOM Killer
echo -1000 > /proc/<pid>/oom_score_adj

# Force process to be sacrificed first under memory pressure
echo 500 > /proc/<pid>/oom_score_adj
```

---

## Interview Questions

### Q1. What is the difference between `MemFree` and `MemAvailable` in `/proc/meminfo`?
> `MemFree` represents memory frames that are completely unallocated and idle. `MemAvailable` is an estimate of how much memory is available for starting new applications without swapping — combining `MemFree` with reclaimable page caches and slab allocations. On healthy Linux servers, `MemFree` is often low because the kernel utilizes unused RAM as page cache.

### Q2. How do Minor Page Faults differ from Major Page Faults?
> A **Minor Page Fault** occurs when the requested page is already resident in physical RAM but lacks a valid hardware mapping in the process's page table (e.g., Copy-on-Write frame allocation, initial `mmap` zero page mapping), taking microseconds. A **Major Page Fault** occurs when the requested page must be read from disk (e.g., swapping a page back into RAM or loading a file segment), taking milliseconds and causing CPU stalls.

### Q3. Why should Transparent Huge Pages (THP) be disabled on high-throughput database and JVM servers?
> THP relies on the kernel thread `khugepaged` to continuously scan and defragment $4\text{ KB}$ pages into $2\text{ MB}$ contiguous blocks. During defragmentation, `khugepaged` acquires memory locks on heap regions, introducing random $50\text{--}500\text{ ms}$ application latency stalls that mimic severe Garbage Collection Stop-The-World (STW) pauses.

### Q4. Why is `vm.swappiness=1` recommended for Java applications instead of `swappiness=0`?
> Setting `swappiness=1` instructs the Linux kernel to strongly prefer reclaiming file-backed page caches over swapping anonymous application heap pages to disk. This prevents JVM Garbage Collection passes from encountering major page faults when traversing heap objects. `swappiness=1` is preferred over `0` because it retains a minimal emergency swap channel to prevent kernel OOM panics.

---

## See Also

- [Linux Process Virtual Memory Layout](./processes-and-threads.md)
- [Linux Memory Management & Page Allocator](./memory-management.md)
- [Linux System Calls & Ring 0 Execution](./linux-internals-and-syscalls.md)