---
id: memory-management
title: Memory Management — OS & Java
sidebar_label: Memory Management
description: A complete guide to memory management — virtual memory, paging, TLB, page replacement, fragmentation, Linux allocators, JVM heap regions, GC algorithms, tuning, and production memory profiling. Beginner through senior depth.
tags: [operating-systems, memory-management, virtual-memory, paging, garbage-collection, jvm, java, tlb, gc-tuning, off-heap]
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Memory Management — OS & Java

:::info[Who this guide is for]
- **New learners** — start at [Why Memory Management?](#why-memory-management) and [Virtual Memory](#virtual-memory) to understand the problem and the elegant solution.
- **Senior engineers** — jump to [Multi-Level Page Tables](#multi-level-page-tables), [Page Replacement Algorithms](#page-replacement-algorithms), [Linux Memory Internals](#linux-memory-internals), [JVM GC Deep Dive](#jvm-gc-deep-dive), or [Production Tuning](#production-memory-tuning).
:::

---

## Why Memory Management?

A modern computer runs dozens of processes simultaneously. RAM is finite. Without memory management, every problem is catastrophic:

```
Without memory management (bare metal):
  Process A: writes to address 0x4000 → Hello, World!
  Process B: writes to address 0x4000 → [corrupts Process A's data]
  Process C: crashes → writes garbage to 0x0000 → kernel panic
  Result: no isolation, no security, no stability  ❌

With memory management (virtual memory):
  Process A: sees its own private "address 0x4000" → isolated  ✅
  Process B: sees its own private "address 0x4000" → isolated  ✅
  Process C: crashes → kernel detects the segfault → kills only C  ✅
  Each process believes it has the entire address space to itself
```

### The four goals of memory management

| Goal | What it means | Mechanism |
|------|--------------|-----------|
| **Isolation** | Processes cannot access each other's memory | Virtual address spaces, page protection bits |
| **Abstraction** | Each process sees a large, contiguous address space | Virtual memory |
| **Efficiency** | Maximise RAM utilisation; minimise waste | Demand paging, page replacement, compaction |
| **Sharing** | Allow controlled sharing (shared libs, IPC) | Shared memory mappings, copy-on-write |

---

## Virtual Memory

**Virtual memory** is the illusion given to each process that it has the entire address space to itself. The OS and hardware translate virtual addresses to physical RAM addresses transparently.

```
Process A's view (virtual):          Physical RAM (real):
┌────────────────────────┐           ┌────────────────────────┐
│ 0x0000 - 0xFFFF_FFFF  │           │ Frame 0  (4 KB)        │
│  (4 GB address space)  │           │ Frame 1  (4 KB)        │
│                         │           │ Frame 2  (4 KB) ←── Process A's Page 0
│ Page 0 (Stack)         │──────────►│ Frame 7  (4 KB) ←── Process A's Page 1
│ Page 1 (Heap)          │──────────►│ Frame 3  (4 KB) ←── Process B's Page 0
│ Page 2 (Code)          │──────────►│ Frame 9  (4 KB) ←── Process A's Page 2
│ ...                    │           │ ...                    │
└────────────────────────┘           │ Swap space (disk) ←── evicted pages
                                     └────────────────────────┘
Process B sees its own 4 GB — different pages map to different frames
```

### Why not just give each process its own RAM?

A 64-bit address space is `2^64` bytes = 18 exabytes. No computer has that much RAM. Virtual memory solves this by:

1. Only allocating physical RAM for pages that are actually used.
2. Swapping inactive pages to disk when RAM is full.
3. Sharing physical pages between processes (shared libraries, copy-on-write).

---

## Address Binding

Before a program runs, addresses go through three potential binding stages:

| Stage | Who does it | Description | Example |
|-------|------------|-------------|---------|
| **Compile time** | Compiler | Absolute addresses embedded in code | DOS `.COM` files — only run at address 0x100 |
| **Load time** | Linker/loader | Relocatable code — addresses adjusted when loaded | Static linking before virtual memory |
| **Execution time** | Hardware MMU | Dynamic translation on every memory access | All modern OSes — virtual → physical |

Modern OSes use **execution-time binding** exclusively. The MMU (Memory Management Unit) translates every virtual address to a physical address in hardware, invisible to the running program.

---

## Paging

**Paging** is the solution to external fragmentation. Physical RAM is divided into fixed-size **frames** (typically 4 KB). Each process's virtual address space is divided into same-size **pages**. The OS maps pages to frames arbitrarily — no contiguous allocation required.

```
Virtual address breakdown (32-bit, 4 KB pages):
┌──────────────────────┬──────────────────────────┐
│   Page Number (20b)  │   Page Offset (12b)       │
│   Which page?        │   Where inside the page?  │
└──────────────────────┴──────────────────────────┘
 2^20 = 1M pages          2^12 = 4096 bytes (one page)

Address translation:
  Virtual addr  0x0001004 → page=1, offset=0x004
  Page table: page 1 → frame 7
  Physical addr = 7 × 4096 + 0x004 = 0x7004
```

### Page Table

Each process has its own page table — a data structure mapping page numbers to frame numbers:

```
Process A's Page Table:          Physical RAM:
┌────────┬──────────┬──────┐    ┌──────────────────┐
│ Page # │ Frame #  │Flags │    │ Frame 0  (used)  │
├────────┼──────────┼──────┤    │ Frame 1  (free)  │
│   0    │    3     │ V,R  │───►│ Frame 2  (used)  │
│   1    │    7     │ V,RW │───►│ Frame 3 ←── P.A Page 0
│   2    │    2     │ V,R  │───►│ Frame 4  (free)  │
│   3    │    -     │  -   │    │ Frame 5  (used)  │
│  ...   │   ...    │ ...  │    │ Frame 6  (used)  │
└────────┴──────────┴──────┘    │ Frame 7 ←── P.A Page 1
                                │ ...              │
                                └──────────────────┘
```

### Page Table Entry (PTE) fields

| Bit | Name | Purpose |
|-----|------|---------|
| `V` | Valid/Present | Is this page currently in physical RAM? 0 = page fault |
| `D` | Dirty | Has this page been written to since loaded? (matters for eviction) |
| `A` | Accessed | Has this page been read or written recently? (used by LRU approximation) |
| `R/W` | Read/Write | Can this page be written? (read-only = code segment) |
| `U/S` | User/Supervisor | Can user-mode code access this? 0 = kernel only |
| `X` | Execute | Can code be executed from this page? (NX bit prevents shellcode) |
| Frame# | Physical frame | The actual physical RAM frame address |

### Fragmentation comparison

| | External Fragmentation | Internal Fragmentation |
|-|:---------------------:|:---------------------:|
| **Contiguous allocation** | ✅ Yes — free holes too small | ❌ No |
| **Paging** | ❌ No — any frame can serve any page | ✅ Yes — last page may not fill the frame |
| **Segmentation** | ✅ Yes — variable-size segments leave gaps | ❌ No |

**Paging eliminates external fragmentation** at the cost of a small amount of internal fragmentation (on average, half a page wasted per process per segment).

---

## Multi-Level Page Tables

A flat page table for a 64-bit address space would require `2^52` entries (each 8 bytes) = 32 PB per process. Completely impractical.

**Solution:** Hierarchical page tables — only allocate the levels that are actually needed.

```
x86-64 Virtual Address (48 bits used, 4 KB pages):
┌────────┬────────┬────────┬────────┬─────────────────┐
│ PML4   │  PDPT  │   PD   │   PT   │     Offset      │
│ 9 bits │ 9 bits │ 9 bits │ 9 bits │    12 bits      │
│ (512)  │ (512)  │ (512)  │ (512)  │   (4096 bytes)  │
└────────┴────────┴────────┴────────┴─────────────────┘
   L4       L3       L2       L1

Translation:
  CR3 register ──► PML4 table (4KB)
    PML4[index] ──► PDPT table (4KB)
      PDPT[index] ──► PD table (4KB)
        PD[index] ──► PT table (4KB)
          PT[index] ──► Physical Frame + Offset = Physical Address

4 memory reads for one virtual→physical translation (without TLB)
```

**Key insight:** a sparse process (many unmapped regions like the gap between stack and heap) only allocates the page table entries it actually uses. A process using 100 MB of memory doesn't allocate page table space for the unused 99.99% of its 128 TB virtual address space.

---

## Translation Lookaside Buffer (TLB)

Without the TLB, every memory access requires 4+ additional memory reads (to walk the page table). This would make virtual memory 5× slower than direct physical memory.

The **TLB** is a small, extremely fast hardware cache (32–2048 entries) for recent virtual→physical translations, located inside the CPU:

```
CPU needs to access virtual address VA:

Step 1: Check TLB
  TLB Hit (99%+ of the time):
    Physical address found in TLB → directly accesses RAM
    Cost: ~1–5 ns (just the TLB lookup)

  TLB Miss (~1% of the time):
    Walk the 4-level page table in RAM:
      Read PML4 entry → PDPT entry → PD entry → PT entry
      4 × ~100ns = ~400ns
    Store result in TLB for future
    Access RAM: ~100ns
    Total: ~500ns

Effective Access Time with TLB:
  EAT = (0.99 × 105ns) + (0.01 × 500ns) = 103.95 + 5 = ~105ns
  Without TLB: 4 × 100ns + 100ns = 500ns  ← 5× slower
```

### Context switches and TLB flushing

When the OS context-switches to a different **process** (not just a different thread in the same process), the entire virtual address space changes. Old TLB entries are invalid for the new process.

```
Naive approach: flush all TLB entries on every context switch
  Problem: 100 context switches/sec × ~1000 TLB entries each = massive overhead
  Every post-switch memory access is a TLB miss until cache warms up

Smart approach: ASID (Address Space Identifier)
  Each TLB entry is tagged with the process's ASID (e.g. 8-bit = 256 IDs)
  TLB hit only if: virtual address matches AND ASID matches current process
  → No TLB flush on context switch — entries from old process simply don't match
  → Used in: ARM (ASID), x86 (PCID), RISC-V (ASID)
```

---

## Segmentation

**Segmentation** divides the address space into variable-size logical units (segments): code, stack, heap, shared library, etc. Each segment has a **base address** and a **limit** (size).

```
Segment Table:
┌─────────┬────────────┬────────┐
│ Seg #   │   Base     │ Limit  │
├─────────┼────────────┼────────┤
│  0 (CS) │ 0x0040_0000│ 0x1000 │ ← code segment
│  1 (DS) │ 0x00A0_0000│ 0x2000 │ ← data segment
│  2 (SS) │ 0xFFFF_0000│ 0x8000 │ ← stack segment
└─────────┴────────────┴────────┘

Logical address: [segment=1, offset=0x500]
Physical = Base[1] + offset = 0x00A0_0000 + 0x500 = 0x00A0_0500
If offset ≥ Limit[1]: segfault!
```

### Modern usage

Pure segmentation (without paging) is largely deprecated. x86-64 in 64-bit mode largely ignores segment registers (all base=0, limit=max). Modern OSes use **paging** for memory isolation. Segmentation survives in:

- The conceptual model of process memory regions (VMA — Virtual Memory Areas in Linux)
- x86 protection rings (kernel vs user mode via CS segment privilege level)
- Some embedded systems with simpler MMUs

---

## Virtual Memory & Demand Paging

**Demand paging**: a page is loaded into RAM only when the process actually accesses it — not at process startup.

```
Process starts with 100 MB of code and data:
  Without demand paging: load all 100 MB into RAM before first instruction
  With demand paging: load NOTHING → start executing → load pages as needed

Result: process starts instantly; only the actually-accessed pages use RAM
  Typical web server: may load 20% of its code pages during normal operation
  The 80% of never-executed paths (error handlers, rare features) never touch RAM
```

### Page fault handling — step by step

```
CPU accesses virtual address 0x7FFF_1234:
  MMU checks TLB → miss
  MMU walks page table → PTE valid bit = 0 (page not in RAM)
  MMU raises a page fault exception → control transfers to OS

OS page fault handler:
  Step 1: Is this a valid access?
    Look up the VMA (Virtual Memory Area) for this address
    Is the address within a mapped region? Is the access type (R/W/X) permitted?
    NO → send SIGSEGV to the process → segfault / NullPointerException in Java
    YES → continue

  Step 2: Find a free frame
    Free frame available → use it
    No free frame → must evict a page (see Page Replacement Algorithms)

  Step 3: Load the page
    Anonymous page (heap/stack) → zero-fill the frame
    File-backed page → read from disk file (100µs–8ms depending on SSD/HDD)
    Swap-backed page → read from swap file (same disk latency)

  Step 4: Update the PTE
    Set valid bit = 1, set frame number = new frame
    Invalidate TLB entry for this address (if stale entry existed)

  Step 5: Restart the faulting instruction
    The CPU re-executes the memory access — now succeeds
```

### Page fault performance impact

```
EAT = (1 − p) × mem_access + p × page_fault_time

p = page fault rate
mem_access ≈ 100ns
page_fault_time ≈ 100µs (NVMe SSD) to 8ms (HDD)

To keep EAT ≤ 2 × 100ns = 200ns:
  With SSD: p ≤ (200-100)/(100,000-100) ≈ 0.001 (1 fault per 1,000 accesses) — tolerable
  With HDD: p ≤ (200-100)/(8,000,000-100) ≈ 0.0000125 (1 fault per 80,000 accesses)
```

**Implication:** HDD-backed swap is catastrophic for interactive performance. SSD swap is tolerable but still undesirable for latency-sensitive applications.

---

## Page Replacement Algorithms

When RAM is full and a new page must be loaded, the OS must **evict** an existing page. The eviction choice determines page fault rate.

### Reference string example

All algorithms evaluated against this reference string (page requests in order):

```
Reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5
Available frames: 3
```

### Algorithm comparison

<Tabs>
  <TabItem value="opt" label="OPT — Optimal">

**Replace the page that won't be used for the longest time in the future.**

```
Frame state and page faults:
Ref:  1    2    3    4    1    2    5    1    2    3    4    5
      [1]  [1]  [1]  [4]  [4]  [4]  [5]  [5]  [5]  [5]  [4]  [4]
           [2]  [2]  [2]  [1]  [1]  [1]  [1]  [1]  [1]  [1]  [1]
                [3]  [3]  [3]  [2]  [2]  [2]  [2]  [3]  [3]  [5]
      F    F    F    F    -    -    F    -    -    F    F    F
Page faults: 6 (theoretical minimum)
```

**Not implementable** — requires knowledge of future accesses. Used as a benchmark to evaluate other algorithms.

  </TabItem>
  <TabItem value="fifo" label="FIFO">

**Replace the page that has been in memory the longest (oldest arrival).**

```
Ref:  1    2    3    4    1    2    5    1    2    3    4    5
Queue (oldest first):
      [1]  [1,2][1,2,3][2,3,4][3,4,1][4,1,2][1,2,5][2,5,1][5,1,2][1,2,3][2,3,4][3,4,5]
      F    F    F      F      F      F      F      -      -      F      F      F
Page faults: 9
```

**Bélády's Anomaly:** with FIFO, adding more frames can sometimes *increase* page faults! (Adding frame 4 to this example → 10 faults instead of 9)

  </TabItem>
  <TabItem value="lru" label="LRU">

**Replace the page that hasn't been used for the longest time.**

```
Ref:  1    2    3    4    1    2    5    1    2    3    4    5
      [1]  [1,2][1,2,3][2,3,4][3,4,1][4,1,2][1,2,5][2,5,1][5,1,2][1,2,3][2,3,4][3,4,5]
      F    F    F      F      F      F      F      -      -      F      F      F
Page faults: 8
```

LRU never suffers from Bélády's Anomaly because it is a **stack algorithm** — the set of pages with N frames is always a subset of the set with N+1 frames.

**Full LRU cost:** requires a timestamp on every page access (hardware counter). Expensive in practice.

  </TabItem>
  <TabItem value="clock" label="Clock (Second-Chance)">

**FIFO with a reference bit — cheap LRU approximation. Used in Linux.**

```
Pages arranged in a circular buffer. A clock hand scans them.
Each page has a reference bit (R) set to 1 on every access.

On eviction:
  If R = 1: set R = 0, advance clock hand (give the page a second chance)
  If R = 0: evict this page (it hasn't been used since last scan)

Example (3 frames, clock hand starts at position 0):
Load 1: [1,R=1] [_] [_]
Load 2: [1,R=1] [2,R=1] [_]
Load 3: [1,R=1] [2,R=1] [3,R=1]
Load 4 (evict): scan: 1 has R=1 → clear R → 2 has R=1 → clear R → 3 has R=1 → clear R
                scan again: 1 has R=0 → EVICT 1, load 4
        [4,R=1] [2,R=0] [3,R=0]   (clock hand at position 1)
```

Clock is O(1) per eviction and requires only one bit per page. Much cheaper than true LRU.

  </TabItem>
</Tabs>

### Enhanced Second-Chance (NRU) — Linux uses this

Combines Reference bit (R) and Dirty bit (D) for smarter eviction:

| R | D | Class | Eviction priority |
|:-:|:-:|-------|:----------------:|
| 0 | 0 | Not recently used, not dirty | **1st — evict first** (cleanest option) |
| 0 | 1 | Not recently used, dirty | **2nd** (must write to disk first) |
| 1 | 0 | Recently used, not dirty | **3rd** (needed, but clean) |
| 1 | 1 | Recently used, dirty | **4th — evict last** (needed AND must write back) |

Dirty pages that are evicted must be written to disk first — this is why evicting a dirty page is more expensive than a clean page.

---

## Thrashing

**Thrashing** occurs when a process (or the whole system) spends more time handling page faults than doing useful work — the working set doesn't fit in available RAM.

```
Normal operation:
  Process has 3 pages in working set, 3 frames available
  CPU utilisation: 95% useful work, 5% page fault handling

Thrashing:
  Process needs 10 pages in working set, only 4 frames available
  Every few instructions → page fault → read from disk (8ms each)
  CPU utilisation: 5% useful work, 95% waiting for disk
  If 10 processes thrash simultaneously → disk I/O saturated → entire system stalls

Signs of thrashing in production:
  → CPU usage low but throughput is also low (CPU is waiting for disk)
  → High `si` (swap-in) and `so` (swap-out) in `vmstat` output
  → `page fault` rate very high in process metrics
  → Response time spikes from milliseconds to seconds
```

### Prevention strategies

| Strategy | How | Trade-off |
|---------|-----|-----------|
| **Working set model** | Track recently accessed pages; give each process enough frames for its working set | Complex to implement correctly |
| **Page-fault frequency (PFF)** | If fault rate too high → add frames; if too low → reclaim frames | Reactive, not proactive |
| **Reduce multiprogramming** | Run fewer processes simultaneously | Reduced throughput |
| **Lock critical pages** | `mlock()` — pin pages in RAM, never swap | Reduces available RAM for others |
| **Use more RAM** | Add physical RAM to the machine | Cost |
| **Use faster storage** | Replace HDD swap with NVMe SSD swap | Reduces fault penalty |

---

## Memory Allocation Strategies

### Contiguous allocation (for OS-managed free lists)

```
Free memory: [20KB] [5KB] [15KB] [30KB] [10KB]
Request: 12 KB

First Fit:   allocate from [20KB] → [8KB] + [5KB] + [15KB] + [30KB] + [10KB]
  Fast O(n) scan; leaves moderate fragments

Best Fit:    allocate from [15KB] → [20KB] + [5KB] + [3KB] + [30KB] + [10KB]
  Slowest (must scan all holes); minimises wasted space but creates many tiny unusable holes

Worst Fit:   allocate from [30KB] → [20KB] + [5KB] + [15KB] + [18KB] + [10KB]
  Leaves largest remnants; generally performs worst in practice
```

### Buddy system (Linux kernel page allocator)

```
Total: 512 KB

Request 100 KB:
  Split 512 → [256 | 256]
  Split 256 → [128 | 128]
  Allocate 128 (smallest buddy that fits 100 KB)

Request 200 KB:
  Allocate 256

Free 100 KB:
  128 KB freed → check if its "buddy" (adjacent equal-size block) is free
  If buddy is free → merge → 256 KB
  If buddy also free → merge → 512 KB
  (Merging is O(log n))
```

The buddy system ensures adjacent free blocks of the same size are quickly merged, preventing fragmentation. Linux uses it for physical page allocation (`alloc_pages()`).

### Slab allocator (Linux kernel object cache)

```
Problem: allocating/freeing many small same-size kernel objects (task_struct, inode, socket)
  Each alloc/free from general allocator is slow + causes fragmentation

Slab solution:
  Pre-allocate slabs (one or more pages) for each object type
  Each slab contains N pre-initialised objects
  Allocation = take from free list (O(1))
  Deallocation = return to free list (O(1), object kept initialised)

Cache (per object type):
  ┌──────────────────────────────────────────────────────┐
  │  task_struct cache                                   │
  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
  │  │ Full slab  │  │Partial slab│  │ Empty slab │    │
  │  │ OOOOOOOOOO │  │ OOOO__OOOO │  │ __________ │    │
  │  └────────────┘  └────────────┘  └────────────┘    │
  │  O = allocated   _ = free                          │
  └──────────────────────────────────────────────────────┘
```

In Java, the JVM's young generation allocator uses a similar bump pointer approach — allocation is just incrementing a pointer (O(1), no fragmentation).

---

## Linux Memory Internals

<details>
<summary>🔬 Senior deep-dive: the Linux page cache and reclaim</summary>

### The page cache

Linux keeps recently accessed file data in the **page cache** — free RAM that caches disk content. This makes repeated file reads serve from RAM (microseconds) instead of disk (milliseconds):

```
Application reads /data/orders.csv (10 MB):
  First read:  OS reads from disk → caches pages in page cache
                                    returns data to application
  Second read: OS checks page cache → HIT → returns from RAM immediately
               No disk I/O at all  ✅

Page cache grows to fill all available RAM:
  "Free" memory on Linux ≈ page cache (reclaimed instantly on demand)
  true_free = MemFree + Buffers + Cached   (from /proc/meminfo)
  "used" in `free -h` includes page cache — not all of it is "actually needed"
```

Kafka, PostgreSQL, and most databases intentionally exploit the page cache — they write data and trust the OS to serve it from RAM on subsequent reads.

### Memory reclaim — kswapd

When RAM pressure rises, the kernel's `kswapd` daemon reclaims pages:

```
Reclaim priority (cleanest/cheapest first):
  1. Clean page cache pages → evict (data is still on disk, no write needed)
  2. Anonymous pages with swap space → write to swap, evict (expensive: disk write)
  3. Dirty page cache pages → write back to disk, evict (expensive: disk write)
  4. Locked pages (mlock'd) → never reclaimed

Reclaim triggers:
  High watermark: kswapd wakes, reclaims proactively (background)
  Low watermark:  direct reclaim — application thread stalls to free memory
  Min watermark:  OOM killer activated
```

### OOM Killer

When the kernel cannot reclaim enough memory, the **OOM (Out-Of-Memory) Killer** selects and kills a process:

```bash
# OOM kill in /var/log/kern.log:
Out of memory: Kill process 4242 (java) score 902 or sacrifice child
Killed process 4242 (java) total-vm:8196800kB, anon-rss:7921540kB

# oom_score: 0-1000, higher = more likely to be killed
# Score based on: RSS (resident set size), process age, nice value
# Java heaps score very high due to large RSS

# Prevent specific processes from being OOM-killed:
echo -17 > /proc/$(pidof critical-service)/oom_adj   # legacy
echo -1000 > /proc/$(pidof critical-service)/oom_score_adj  # modern
```

### mmap — memory-mapped files

```c
// Map a file directly into virtual address space
void* addr = mmap(NULL, file_size, PROT_READ, MAP_SHARED, fd, 0);

// Now 'addr' looks like a pointer to a byte array in RAM
// BUT: pages are only loaded when accessed (demand paging)
// OS handles reading from disk transparently via page fault

// Benefits:
// → Zero-copy: no read() syscall, no kernel→user copy
// → Page cache: same physical pages shared between all processes mapping the file
// → Random access: seek to any offset instantly (just pointer arithmetic)

// Used by: Kafka (log files), PostgreSQL (shared buffer pool), mmap'd databases
```

</details>

<details>
<summary>🔬 Senior deep-dive: huge pages (THP)</summary>

```
Standard page size: 4 KB
Huge page size:     2 MB (x86-64), 1 GB (x86-64 with 1G pages)

TLB has ~64 entries. With 4 KB pages:
  64 entries × 4 KB = 256 KB of TLB coverage per process
  A Java heap of 4 GB needs 4 GB / 4 KB = 1M page table entries
  TLB hit rate falls → frequent page table walks → latency

With 2 MB huge pages:
  64 entries × 2 MB = 128 MB of TLB coverage
  4 GB heap needs only 2048 huge page entries
  TLB covers much more memory → fewer page table walks → lower latency

Transparent Huge Pages (THP) — Linux auto-promotes 4KB pages to 2MB:
  Pros: automatic, no app changes, reduces TLB pressure
  Cons: compaction of huge pages causes latency spikes
  Recommendation for Java: disable THP → manually use HugeTLBfs

# Check THP status
cat /sys/kernel/mm/transparent_hugepage/enabled

# Disable THP (recommended for latency-sensitive Java apps like Kafka, Cassandra)
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# Enable explicit huge pages for Java:
java -XX:+UseLargePages -XX:LargePageSizeInBytes=2m -jar app.jar
```

</details>

---

## JVM Memory Model

### JVM memory areas

```
JVM Process (example: -Xmx4g)
┌───────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                        HEAP (Xmx)                       │  │
│  │  ┌──────────────────────────┐  ┌─────────────────────┐  │  │
│  │  │       Young Gen          │  │   Old Gen (Tenured)  │  │  │
│  │  │  ┌───────┬────┬────┐    │  │                      │  │  │
│  │  │  │ Eden  │ S0 │ S1 │    │  │  Long-lived objects  │  │  │
│  │  │  │(alloc)│    │    │    │  │  Promoted from Young  │  │  │
│  │  │  └───────┴────┴────┘    │  │                      │  │  │
│  │  └──────────────────────────┘  └─────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Metaspace     │  │  Code Cache  │  │  Thread Stacks  │  │
│  │  Class metadata │  │ JIT-compiled │  │  One per thread │  │
│  │  Method bytecode│  │ native code  │  │  ~512KB–1MB ea  │  │
│  └─────────────────┘  └──────────────┘  └─────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Off-heap / Direct Memory (ByteBuffer)           │  │
│  │  Not managed by GC — developer-managed via Cleaner       │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Object lifecycle — generational hypothesis

Most objects die young (the **weak generational hypothesis**): temporary string buffers, request DTOs, intermediate computation results:

```
New object allocated in Eden:
  If Eden fills → Minor GC (stop-the-world, very fast: ~1-10ms)
  Surviving objects → Survivor space (S0 or S1), age incremented
  After N minor GCs survived (default age=15) → promoted to Old Gen

  Young Gen collected frequently (every few seconds in busy app)
  Old Gen collected rarely (minutes to hours)
```

```java
// This object dies young (good):
void handleRequest() {
    String response = buildResponse(...);  // allocated in Eden
    sendResponse(response);
}   // response unreachable → collected in next minor GC

// This object lives long (promoted to Old Gen):
@Service
public class CacheService {
    private final Map<String, Object> cache = new HashMap<>();  // lives as long as the app
    // cache entries promoted to Old Gen → only cleaned in full GC
}
```

---

## JVM GC Deep Dive

### GC algorithm comparison

<Tabs>
  <TabItem value="g1" label="G1GC (Java 9+ default)">

**Garbage-First** — designed for large heaps (>4 GB) with predictable pause time targets.

**Key innovation:** divides the heap into equal-sized **regions** (1–32 MB each) rather than fixed young/old areas. Any region can be Eden, Survivor, or Old.

```
G1 Heap (32 regions shown):
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ E  │ E  │ S  │ O  │ O  │ O  │ F  │ E  │
├────┼────┼────┼────┼────┼────┼────┼────┤
│ O  │ O  │ F  │ F  │ E  │ H* │ O  │ O  │
├────┼────┼────┼────┼────┼────┼────┼────┤
│ F  │ O  │ O  │ S  │ E  │ E  │ O  │ F  │
├────┼────┼────┼────┼────┼────┼────┼────┤
│ O  │ F  │ O  │ E  │ F  │ O  │ O  │ F  │
└────┴────┴────┴────┴────┴────┴────┴────┘
E=Eden, S=Survivor, O=Old, F=Free, H=Humongous (large object)
```

G1 collects the regions with the most garbage first ("Garbage First") — maximising reclaim per pause.

```bash
# G1GC key tuning flags
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200      # target max pause time (default 200ms)
-XX:G1HeapRegionSize=16m      # region size (1–32MB, power of 2)
-XX:G1NewSizePercent=5        # min young gen %
-XX:G1MaxNewSizePercent=60    # max young gen %
-XX:InitiatingHeapOccupancyPercent=45  # start concurrent mark when heap 45% full
-XX:G1ReservePercent=10       # headroom to avoid evacuation failures
```

  </TabItem>
  <TabItem value="zgc" label="ZGC (Java 15+ — ultra-low latency)">

**Z Garbage Collector** — sub-millisecond pause times, scales to multi-terabyte heaps.

**Key innovation:** all heavy work (marking, compaction, relocation) is done **concurrently** while the application runs. Stop-the-world phases take < 1ms regardless of heap size.

```
ZGC phases:
  1. STW: Initial mark root references (< 1ms)
  2. Concurrent: Mark all live objects (app runs simultaneously)
  3. STW: Remap roots after relocation (< 1ms)
  4. Concurrent: Relocate objects to compact heap (app runs simultaneously)
  5. Concurrent: Remap remaining pointers to relocated objects

Total STW: < 1ms even on 16 TB heaps
Trade-off: ~5–15% throughput reduction vs G1 (concurrent work competes with app)
```

```bash
# ZGC configuration
-XX:+UseZGC
-XX:+ZGenerational           # Java 21: generational ZGC (better throughput)
-XX:MaxGCPauseMillis=1       # target max pause (ZGC can achieve this)
-XX:ZCollectionInterval=0    # adaptive (or set fixed interval in seconds)
-Xmx64g                      # ZGC shines on very large heaps
```

  </TabItem>
  <TabItem value="shenandoah" label="Shenandoah (Java 12+)">

**Shenandoah** — similar goals to ZGC but different implementation. Concurrent compaction via Brooks forwarding pointers.

```bash
-XX:+UseShenandoahGC
-XX:ShenandoahGCMode=adaptive  # (or "compact", "aggressive")
```

ZGC and Shenandoah are alternatives — try both and benchmark for your workload.

  </TabItem>
  <TabItem value="serial-parallel" label="Serial / Parallel GC">

```bash
# Serial GC — single threaded, for very small heaps / embedded
-XX:+UseSerialGC

# Parallel GC — multi-threaded stop-the-world, high throughput, larger pauses
# Default before Java 9; good for batch processing
-XX:+UseParallelGC
-XX:ParallelGCThreads=8       # GC threads (default: # CPUs)
```

  </TabItem>
</Tabs>

### GC algorithm selection guide

| Use case | Recommended GC | Why |
|---------|---------------|-----|
| Batch processing (ETL, offline jobs) | Parallel GC | Maximum throughput; pauses don't matter |
| Standard web applications | G1GC (default) | Good balance of throughput and pause times |
| Low-latency APIs (< 200ms SLA) | G1GC with `MaxGCPauseMillis=100` | Predictable bounded pauses |
| Real-time / sub-10ms SLA | ZGC or Shenandoah | < 1ms pauses concurrent GC |
| Very large heaps (> 32 GB) | ZGC | Scales to multi-TB with consistent pauses |
| Tiny microservices (< 512MB heap) | Serial GC or G1GC | Minimal overhead |

---

## Production Memory Tuning

### Essential JVM flags

```bash
# ── Heap sizing ────────────────────────────────────────────────────────────
-Xms4g               # Initial heap (set equal to Xmx to avoid resize overhead)
-Xmx4g               # Max heap (typically 75% of available RAM for the JVM)
-Xss512k             # Thread stack size (default 512k–1m; reduce if many threads)

# ── GC selection ──────────────────────────────────────────────────────────
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200    # target max pause time

# ── Metaspace ─────────────────────────────────────────────────────────────
-XX:MetaspaceSize=256m      # initial metaspace (triggers GC on first expansion)
-XX:MaxMetaspaceSize=512m   # cap metaspace (prevents unbounded class loading leak)

# ── GC logging (Java 11+) ─────────────────────────────────────────────────
-Xlog:gc*:file=/var/log/app/gc.log:time,tags,uptime:filecount=5,filesize=50m

# ── OOM diagnosis ─────────────────────────────────────────────────────────
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/dumps/app-$(date +%Y%m%d-%H%M%S).hprof
-XX:OnOutOfMemoryError="kill -9 %p"   # restart the JVM on OOM

# ── Native memory ─────────────────────────────────────────────────────────
-XX:MaxDirectMemorySize=1g  # cap ByteBuffer.allocateDirect() total
```

### Sizing the heap correctly

```
Heap sizing rule:
  1. Measure live data set size (LD) = heap usage after a full GC
  2. Xmx = LD × 3   (gives GC 2× headroom — less than this → too frequent GC)
  3. Leave headroom for OS: don't exceed 75% of physical RAM
  4. Account for off-heap: Metaspace + Code Cache + Direct Memory + Thread Stacks

Example: 8 GB container
  LD = 1.5 GB (measured from GC log after steady state)
  Xmx = 1.5 × 3 = 4.5 GB → round to -Xmx4g
  OS + other: 8 - 4 = 4 GB remaining (generous)

  Thread stacks: 100 threads × 512KB = 50 MB
  Metaspace: -XX:MaxMetaspaceSize=256m
  Code Cache: ~256m (default)
  Direct: -XX:MaxDirectMemorySize=512m
  Total non-heap: ~1 GB
  Final: -Xmx4g -XX:MaxMetaspaceSize=256m -XX:MaxDirectMemorySize=512m
```

### Detecting memory leaks in Java

```java
// Common leak pattern 1: static collections that grow unboundedly
@Service
public class EventTracker {
    private static final List<Event> ALL_EVENTS = new ArrayList<>();   // ← LEAK

    public void track(Event e) {
        ALL_EVENTS.add(e);   // grows forever, never cleared
    }
}

// Fix: use a bounded cache or clear periodically
private static final Map<String, Event> recentEvents =
    Collections.synchronizedMap(new LinkedHashMap<>(1000, 0.75f, true) {
        protected boolean removeEldestEntry(Map.Entry eldest) {
            return size() > 1000;   // evict when over 1000 entries
        }
    });

// Common leak pattern 2: ThreadLocal not cleared in thread pool
@Service
public class RequestService {
    private static final ThreadLocal<User> CURRENT_USER = new ThreadLocal<>();

    public void handle(Request req) {
        CURRENT_USER.set(req.getUser());   // set for this thread
        doWork();
        // ← MISSING: CURRENT_USER.remove()   → thread pool thread retains reference
        // User object cannot be GC'd while thread is alive (thread pool threads live forever)
    }
}

// Common leak pattern 3: listeners/callbacks not unregistered
eventBus.register(myListener);   // myListener held by eventBus
// If myListener is not unregistered before it's "done", eventBus holds a reference
// preventing GC even after the rest of the system considers it dead
```

### Off-heap memory — DirectByteBuffer

```java
// Direct (off-heap) ByteBuffer — allocated outside the JVM heap
// Not GC'd automatically — freed when the ByteBuffer is garbage collected
// and its Cleaner runs (non-deterministic!)

ByteBuffer direct = ByteBuffer.allocateDirect(1024 * 1024);  // 1 MB off-heap

// Use case: zero-copy I/O — OS can DMA directly from this buffer without copying
FileChannel channel = FileChannel.open(path, READ);
channel.read(direct);   // OS writes directly into the off-heap buffer

// Manual control of lifecycle (Java 9+):
if (direct instanceof sun.nio.ch.DirectBuffer db) {
    db.cleaner().clean();   // explicitly free — don't wait for GC
}

// Monitoring off-heap:
BufferPoolMXBean directPool = ManagementFactory.getPlatformMXBeans(BufferPoolMXBean.class)
    .stream().filter(b -> b.getName().equals("direct")).findFirst().orElseThrow();
long usedBytes = directPool.getMemoryUsed();   // current direct memory used
```

---

## Memory Monitoring & Profiling

### JVM metrics via JMX / Actuator

```java
// Memory pool monitoring
MemoryMXBean memBean = ManagementFactory.getMemoryMXBean();
MemoryUsage heap = memBean.getHeapMemoryUsage();

log.info("Heap: used={} MB, committed={} MB, max={} MB",
    heap.getUsed()      / 1024 / 1024,
    heap.getCommitted() / 1024 / 1024,
    heap.getMax()       / 1024 / 1024);

// GC metrics
ManagementFactory.getGarbageCollectorMXBeans().forEach(gc -> {
    log.info("GC: name={} count={} time={}ms",
        gc.getName(), gc.getCollectionCount(), gc.getCollectionTime());
});
```

```yaml
# Spring Boot Actuator — expose memory metrics to Prometheus
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus
  metrics:
    tags:
      app: payment-service
```

```promql
# Key PromQL queries for JVM memory dashboard

# Heap usage % — alert if > 80% for 5 minutes
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100 > 80

# GC pause rate — alert if G1 young GC > 1/sec
rate(jvm_gc_pause_seconds_count{action="end of minor GC"}[1m]) > 1

# GC pause duration — alert if P99 > 500ms
histogram_quantile(0.99, rate(jvm_gc_pause_seconds_bucket[5m])) > 0.5

# Metaspace % full — alert if > 90%
jvm_memory_used_bytes{id="Metaspace"} / jvm_memory_max_bytes{id="Metaspace"} * 100

# Thread count — alert if rising unboundedly (thread leak)
jvm_threads_live_threads > 500
```

### OS-level memory commands

```bash
# Process memory breakdown
cat /proc/<pid>/status | grep -E "VmRSS|VmSwap|VmPeak|VmSize"
# VmRSS: Resident Set Size (actual RAM used)
# VmSwap: how much is swapped to disk (should be 0 for healthy JVM)

# System memory overview
free -h
# buff/cache column includes page cache — not truly "used"
# available column = what applications can actually use

# Real-time memory pressure
vmstat 1
# si (swap-in): pages read from swap → if > 0, system is thrashing
# so (swap-out): pages written to swap → if > 0, memory pressure

# Which processes use the most memory
ps aux --sort=-%mem | head -20

# Page fault rates per process
/usr/bin/time -v java -jar app.jar 2>&1 | grep "Page faults"
# Major page faults: required disk I/O (expensive)
# Minor page faults: page table update only (cheap)
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `-Xmx` set too high for the container | JVM allocates more RAM than container limit → OOM kill by container runtime | Set `-Xmx` to ~75% of container memory limit; use `-XX:MaxRAMPercentage=75` |
| `-Xms` much lower than `-Xmx` | JVM grows heap dynamically → GC pauses during heap expansion at startup | Set `-Xms = -Xmx` for predictable performance |
| Heap dump path not configured | OOM occurs → no heap dump → can't diagnose the leak | Always set `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/path/` |
| `ThreadLocal` not cleared in thread pools | Memory leak — user objects retained by pool threads → heap grows over time | Always `threadLocal.remove()` in `finally` block |
| Ignoring `-XX:MaxMetaspaceSize` | Dynamic class loading (Spring, CGLIB, Groovy) fills Metaspace → `OutOfMemoryError: Metaspace` | Set `-XX:MaxMetaspaceSize=512m` to cap and alert early |
| Too many threads with large stacks | 1000 threads × 1MB stack = 1 GB RAM — not in heap, not monitored | Use virtual threads (Java 21) or reduce `-Xss` to 256k for I/O-heavy threads |
| Swapping enabled in production | JVM heap pages paged to disk → stop-the-world of 10–100 seconds | Disable swap or use `mlockall`; size RAM so swap is never needed |
| Not monitoring GC pause frequency | Long GC pauses cause intermittent timeouts — invisible without metrics | Enable GC logging and alert on P99 pause time and full GC count |
| Huge static `Map` / `List` as in-memory cache | Grows unboundedly → eventual OOM | Use `Caffeine` cache with size and expiry limits |
| Using `finalize()` for resource cleanup | Finalisation is non-deterministic — may never run under GC pressure | Use `AutoCloseable` + `try-with-resources` or `Cleaner` API |

---

## 🎯 Interview Questions

**Q1. What is virtual memory and why does every modern OS use it?**
> Virtual memory gives each process the illusion of a private, contiguous address space much larger than physical RAM. The OS (via the MMU) maps each process's virtual addresses to physical RAM frames through page tables. Benefits: (1) isolation — processes cannot access each other's memory; (2) overcommit — processes can allocate more memory than physically available (demand paging loads pages on first access); (3) sharing — multiple processes can map the same physical page (shared libraries, copy-on-write after fork); (4) protection — page table entries carry read/write/execute permission bits, enforced in hardware.

**Q2. What is the difference between paging and segmentation?**
> Paging divides both physical memory and virtual address spaces into fixed-size blocks (typically 4 KB). No external fragmentation (any frame can hold any page), but slight internal fragmentation (last page of a segment may not fill a frame). Segmentation divides the virtual address space into variable-size logical units (code, heap, stack). No internal fragmentation, but external fragmentation accumulates over time. Modern systems (x86-64) use paging primarily; segmentation exists conceptually in the VMA (Virtual Memory Area) structure but the hardware largely uses flat paging.

**Q3. What is the TLB and what happens when the CPU context-switches between processes?**
> The TLB (Translation Lookaside Buffer) is a fast hardware cache of recent virtual→physical address translations, located in the CPU. Without it, every memory access would require 4 page table reads (adding ~400ns overhead). On a context switch between different processes, TLB entries from the old process are invalid (the new process has a completely different address space). The naive approach flushes all TLB entries (expensive). Modern CPUs use ASID (Address Space Identifiers) to tag TLB entries with the process ID — on a context switch, the new ASID is loaded into a register and the CPU automatically ignores stale entries from the old process without flushing.

**Q4. What is thrashing and how do you diagnose and prevent it?**
> Thrashing occurs when a process's working set (the pages it actively needs) exceeds the available physical frames. Every few instructions causes a page fault, requiring a disk read — the process spends more time paging than computing. Diagnosis: low CPU utilisation despite low throughput; high `si`/`so` (swap-in/swap-out) in `vmstat`; rising major page fault rate. Prevention: (1) add RAM; (2) reduce multiprogramming (fewer concurrent processes); (3) use the working set model to give each process enough frames for its current locality; (4) use `mlock()` to pin critical data in RAM; (5) profile and reduce the working set size (fewer, smaller objects).

**Q5. What is the difference between G1GC and ZGC?**
> Both are low-pause collectors but with different trade-offs. G1GC is region-based: it divides the heap into equal regions and collects the "most garbage" regions first. Stop-the-world pauses are bounded by `MaxGCPauseMillis` (default 200ms) but actual pauses can exceed this under load. Works well for heaps up to ~32 GB. ZGC does all major work (marking, compaction) concurrently while the application runs. Stop-the-world phases take < 1ms regardless of heap size (tested up to 16 TB). Cost: ~10–15% throughput reduction due to concurrent work competing with the application. ZGC is the choice when P99 latency SLAs require sub-10ms GC pauses; G1GC is the safe default for most workloads.

**Q6. What causes `OutOfMemoryError: GC overhead limit exceeded`?**
> This error fires when the JVM spends more than 98% of CPU time on GC but recovers less than 2% of the heap in the last several GCs. It is a liveness signal — the JVM decides the application is effectively dead and throws OOM rather than continuing to thrash. Common causes: (1) heap too small for the live data set — increase `-Xmx`; (2) a memory leak — some data structure growing unboundedly (static collections, caches without eviction, ThreadLocal not cleared); (3) sudden spike in live objects exceeding heap capacity — add headroom or fix the allocation pattern. Always capture a heap dump on OOM (`-XX:+HeapDumpOnOutOfMemoryError`) and analyse with Eclipse MAT or VisualVM to find the retention path.

**Q7. (Senior) How does the JVM's generational garbage collection exploit the weak generational hypothesis, and what happens when it breaks down?**
> The weak generational hypothesis observes that most objects die young — request DTOs, string buffers, intermediate results. GC exploits this by collecting the small young generation frequently (minor GC, ~1–10ms, stop-the-world) and the large old generation rarely (major GC, more expensive). Objects that survive enough minor GCs are promoted to the old generation. This works well when the hypothesis holds. It breaks down when: (1) many objects escape from request scope into long-lived caches or collections — they flood the old generation, triggering frequent full GCs; (2) large objects ("humongous" in G1 > 50% of region size) bypass the young generation entirely, allocating directly in old gen and forcing premature old gen GCs; (3) promotion failure — the old generation fills faster than GC can reclaim it, causing "concurrent mode failure" (G1) or evacuation failure, which may degrade into a stop-the-world full GC. Solution: ensure short-lived objects truly die young (review cache lifetimes, builder patterns, and object pooling).

---

## See Also

- [Processes & Threads — Complete Guide](./processes-and-threads.md)
- [CPU Scheduling](./cpu-scheduling.md)
- [Database Connection Pooling](../database/connection-pooling.md)
- [Spring Batch — Complete Guide](../spring/spring-batch.md)