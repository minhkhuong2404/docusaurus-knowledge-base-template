---
id: memory-management
title: Memory Management
description: Virtual memory, paging, segmentation, TLB, page replacement algorithms, and Java heap management with GC fundamentals.
tags:
  - operating-systems
  - memory-management
  - virtual-memory
  - paging
  - garbage-collection
  - jvm
  - java
sidebar_position: 3
---

# Memory Management

## Goals of Memory Management

- **Isolation**: Protect processes from each other.
- **Abstraction**: Give each process its own address space.
- **Efficiency**: Maximize utilization; minimize waste.
- **Sharing**: Allow controlled sharing of memory (e.g., shared libraries).

---

## Address Binding

Programs use **logical (virtual) addresses**; hardware uses **physical addresses**.

| Stage | Description |
|---|---|
| Compile time | Absolute addresses if memory location is known (rare today) |
| Load time | Relocatable code; addresses bound when loaded |
| Execution time | Dynamic binding; requires hardware support (MMU) |

---

## Contiguous Memory Allocation

Early approach: each process gets one contiguous block.

### Fragmentation

- **External Fragmentation**: Total free memory is sufficient, but it's scattered in small holes.
- **Internal Fragmentation**: Allocated block is larger than requested; wasted space inside the block.

### Solutions to External Fragmentation

- **Compaction**: Shuffle memory to consolidate free space. Expensive.
- **Paging** (preferred): Eliminate external fragmentation by design.

---

## Paging

Divide **physical memory** into fixed-size frames and **logical memory** into same-size pages.

```
Logical Address:   [ Page Number (p) | Page Offset (d) ]
Physical Address:  [ Frame Number (f) | Page Offset (d) ]
```

### Page Table

Maps page number → frame number. Each process has its own page table.

```
Page Table:
Page 0 → Frame 3
Page 1 → Frame 7
Page 2 → Frame 2

Logical addr 0x1004 (page=1, offset=0x004) → Physical: 7*4096 + 4 = 0x7004
```

### Page Table Entry (PTE) Fields

| Bit | Purpose |
|---|---|
| Valid/Present | Is this page in physical memory? |
| Dirty | Has the page been written to? |
| Accessed | Has the page been recently used? |
| Protection | Read / Write / Execute permissions |
| Frame Number | Physical frame address |

### Multi-Level Page Tables

For 64-bit address spaces, a flat page table would be enormous. Solution: hierarchical page tables.

```
Virtual Address (48-bit x86-64):
[ PML4 (9) | PDPT (9) | PD (9) | PT (9) | Offset (12) ]

4 levels of page tables, each 4KB = 512 entries of 8 bytes
```

Only allocate page table levels that are actually used.

---

## Translation Lookaside Buffer (TLB)

Page table is in memory — every address translation would require 4+ memory accesses. The **TLB** is a fast hardware cache (typically 32–2048 entries) for recent page translations.

```
CPU → TLB lookup
         │
    TLB Hit (99%+) → Physical Address → Memory
         │
    TLB Miss → Walk page table → Update TLB → Physical Address
```

### TLB Performance: Effective Access Time (EAT)

```
EAT = (TLB hit rate × TLB_time) + (TLB miss rate × (page_table_walk + memory_time))

Example: hit_rate=99%, TLB=1ns, mem=100ns, walk=4×100ns
EAT = 0.99×(1+100) + 0.01×(400+100) = 99.99 + 5 ≈ 105ns
Without TLB: 4×100 + 100 = 500ns  ← 5× slower
```

### ASID (Address Space ID)

TLB entries tagged with ASID avoid full TLB flush on context switch (otherwise every context switch would invalidate all TLB entries).

---

## Segmentation

Divide memory into **variable-size** logical segments (code, stack, heap, etc.) each with a base and limit.

```
Logical Address: [ Segment Number | Offset ]
Physical = Segment Base + Offset  (if Offset < Limit)
```

**x86** historically used segments (CS, DS, SS, ES). Modern 64-bit x86 largely flattens to paging.

**Segmentation + Paging** (e.g., x86 in protected mode): Segments divide the address space logically; paging maps each segment to physical frames.

---

## Virtual Memory & Demand Paging

Not all pages need to be in RAM at once. **Demand paging**: load a page only when it is accessed.

### Page Fault Handling

```
1. CPU accesses virtual address → PTE valid bit = 0 → page fault trap
2. OS checks: is this a valid access? (VMA lookup)
   - No → SIGSEGV (segfault)
   - Yes → continue
3. OS finds a free frame (or evicts one)
4. OS reads the page from disk (swap or file)
5. Update PTE: set valid bit, set frame number
6. Restart the faulting instruction
```

### Page Fault Rate Impact

```
EAT = (1 − p) × memory_access + p × page_fault_time

p = page fault probability
page_fault_time ≈ 8ms (HDD) or ~100µs (SSD)

For EAT ≤ 2× memory_access (100ns): p ≤ 0.0000125
→ Less than 1 page fault per 800,000 accesses!
```

---

## Page Replacement Algorithms

When no free frame exists, OS must **evict** a page.

### 1. Optimal (OPT / Bélády's)
Replace the page that will **not be used for the longest time**. Theoretical minimum page faults. Used as benchmark.

### 2. FIFO
Replace the oldest page (the one loaded earliest).
- **Bélády's Anomaly**: More frames can lead to *more* page faults with FIFO!

### 3. Least Recently Used (LRU)
Replace the page not used for the longest time. Approximates OPT. No Bélády's anomaly.
- **Full implementation**: Requires hardware counter per page access (expensive).

### 4. Clock (Second-Chance)
FIFO with a reference bit (set on access). When evicting: if reference bit=1, clear it and skip; if reference bit=0, evict. Cheap LRU approximation. Used in Linux.

### 5. LRU Approximations in Practice

**Enhanced Second-Chance (NRU)**:

| Reference bit | Dirty bit | Class | Action |
|---|---|---|---|
| 0 | 0 | Best to replace | Evict first |
| 0 | 1 | Dirty, not recent | Evict second |
| 1 | 0 | Recent, clean | Evict third |
| 1 | 1 | Recent, dirty | Evict last |

### 6. Working Set Model

**Locality of reference**: Processes access a limited set of pages (working set) at any time.

```
Working set W(t, Δ) = set of pages accessed in the interval (t-Δ, t)

If Σ |W_i| > total frames → thrashing
```

**Thrashing**: Process spends more time paging than executing. Solution: reduce degree of multiprogramming.

---

## Memory Allocation Strategies

### Contiguous Allocation

- **First Fit**: Allocate first hole that's big enough. Fast.
- **Best Fit**: Allocate smallest hole that fits. Minimizes wasted space but slow + tiny holes.
- **Worst Fit**: Allocate largest hole. Leaves large remnants. Usually worst.

### Buddy System

Split memory in powers of 2. Easy merging of adjacent buddies when freed. Used in Linux for page allocation (`kmalloc`).

### Slab Allocator

Pre-allocate **slabs** (caches) of same-size objects. Very fast allocation for kernel objects. Eliminates fragmentation for fixed-size allocations.

---

## Java / JVM Memory Model

### JVM Memory Areas

```
┌────────────────────────────────────────────────┐
│                    JVM Process                  │
│  ┌──────────────────────────────────────────┐  │
│  │               Heap                        │  │
│  │  ┌─────────────┐  ┌────────────────────┐ │  │
│  │  │   Young Gen  │  │    Old Gen (Tenured)│ │  │
│  │  │ Eden|S0|S1  │  │                    │ │  │
│  │  └─────────────┘  └────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────┐  ┌─────────────┐  ┌──────────┐  │
│  │ Metaspace│  │  Code Cache  │  │  Stacks  │  │
│  └──────────┘  └─────────────┘  └──────────┘  │
└────────────────────────────────────────────────┘
```

### GC Generations

- **Eden**: New objects allocated here.
- **Survivor (S0/S1)**: Objects that survive minor GC.
- **Old Gen**: Long-lived objects (promoted after N GC cycles).
- **Minor GC**: Collects Young Gen. Fast, frequent.
- **Major/Full GC**: Collects Old Gen. Slow, infrequent.

### Key JVM Flags

```bash
-Xms512m          # Initial heap size
-Xmx2g            # Max heap size
-Xss256k          # Thread stack size
-XX:+UseG1GC      # Use G1 garbage collector
-XX:+PrintGCDetails
```

### GC Algorithms

| GC | Java Version | Description |
|---|---|---|
| Serial GC | All | Single-threaded. For small heaps. |
| Parallel GC | All | Multi-threaded minor GC. Default pre-Java 9. |
| G1 GC | Java 9+ default | Region-based, predictable pause times. |
| ZGC | Java 15+ | Ultra-low latency (under 10ms pauses), scalable. |
| Shenandoah | Java 12+ | Concurrent compaction, low pauses. |

---

## Common Interview Questions

### Q1: What is the difference between paging and segmentation?

Paging: fixed-size blocks (no external fragmentation, may have internal fragmentation). Segmentation: variable-size logical units (can have external fragmentation, no internal fragmentation). Modern systems combine both.

### Q2: What is thrashing and how do you prevent it?

Thrashing occurs when a process spends more time swapping pages than executing, because it doesn't have enough frames for its working set. Prevention: working set model, page-fault frequency algorithm, reduce degree of multiprogramming.

### Q3: Why does LRU not suffer from Bélády's Anomaly?

LRU is a **stack algorithm** — the set of pages in memory with n frames is always a subset of pages with n+1 frames. Stack algorithms are immune to Bélády's Anomaly.

### Q4: What is the difference between `malloc` and `calloc`?

`malloc(n)`: allocates n bytes, uninitialized. `calloc(count, size)`: allocates count×size bytes, **zero-initialized** (also sets up lazy allocation pages that OS can share via CoW).

### Q5: What causes a segmentation fault?

Accessing a virtual address that is not mapped (no valid VMA), accessing a page with insufficient permissions (e.g., writing to read-only), or stack overflow. The OS sends `SIGSEGV`.

### Q6: What is copy-on-write (CoW) in the context of memory?

After `fork()`, parent and child share physical pages marked read-only. On first write, the OS creates a private copy of just that page for the writing process. This makes `fork()` very fast.

### Q7: How does the JVM GC decide when to perform a full GC?

G1 GC triggers a full GC when: the old generation is close to full, allocation failure even after minor GC, explicit `System.gc()` call, or humongous object allocation fails. Full GC is stop-the-world and should be minimized.

### Q8: What is memory-mapped I/O (`mmap`)?

`mmap()` maps a file or device into the process's virtual address space. Reads/writes to that region directly read/write the file. The OS handles paging; no explicit `read()`/`write()` syscalls needed. Used for large files, shared memory, and loading executables.

---

## Advanced Editorial Pass: Memory Management and Latency Stability

### Senior Engineering Focus
- Treat memory as a latency control problem, not only a capacity number.
- Understand page cache, swapping, and allocator behavior under pressure.
- Link object lifetime patterns to kernel paging and reclaim behavior.

### Failure Modes to Anticipate
- Sudden swap activity causing severe latency cliffs.
- Memory fragmentation and allocator contention in long-lived services.
- OOM kills triggered by bursty load without headroom policy.

### Practical Heuristics
1. Set alerting on major faults, reclaim pressure, and swap in/out.
2. Test memory limits with realistic spikes and warm cache behavior.
3. Document OOM response procedures including safe restart and replay.

### Compare Next
- [Virtual Memory Deep Dive](./virtual-memory-deep-dive.md)
- [File Systems & I/O](./file-systems-and-io.md)
- [Interview Questions](./interview-questions.md)
