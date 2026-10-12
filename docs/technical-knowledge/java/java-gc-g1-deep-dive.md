---
id: java-gc-g1-deep-dive
title: "G1 Garbage Collector: Regions, SATB & Pause Prediction"
sidebar_label: "G1 GC Deep Dive"
sidebar_position: 2
description: Comprehensive principal engineering guide to HotSpot Garbage-First (G1) collector — region topology, Remembered Sets (R-Sets), Card Tables, Snapshot-At-The-Beginning (SATB) write barriers, and mixed GC tuning.
tags: [java, jvm, gc, g1, garbage-first, satb, remembered-sets, card-table, mixed-gc, humongous]
---

import G1HeapDiagram from '@site/src/components/G1HeapDiagram';

# ♻️ G1 Garbage Collector: Regions, SATB & Pause Prediction

The **Garbage-First (G1) Garbage Collector** is the default general-purpose collector in HotSpot since Java 9. Designed for multi-core processors with multi-gigabyte heaps, G1 achieves predictable pause times by partitioning the physical heap into thousands of equal-sized **regions** and prioritizing the reclamation of regions containing the most garbage ("Garbage-First").

<G1HeapDiagram />

---

## 1. G1 Region Architecture

Unlike legacy generational collectors (Serial, Parallel, CMS) that allocated large contiguous physical memory blocks for Eden, Survivor, and Old generations, G1 subdivides the heap into approximately **2,048 equal-sized regions** (ranging from 1MB to 32MB based on total heap size):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ G1 REGION TOPOLOGY (Non-Contiguous Generational Assignment)                 │
│                                                                             │
│  [E] [O] [S] [E] [F] [O] [H] [H] [E] [S] [O] [F] [E] [O] [F] [O]             │
│                                                                             │
│  • E: Eden Region (Dynamically expanded during allocation bursts)           │
│  • S: Survivor Region (Holds objects surviving Minor GC)                    │
│  • O: Old Region (Tenured objects surviving tenuring threshold)             │
│  • H: Humongous Region (Objects >= 50% of standard region size)             │
│  • F: Free Region (Uncommitted memory waiting for allocation)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Humongous Objects & Fragmentation Traps
* An object whose size exceeds **50% of a G1 region** is classified as **Humongous**.
* Humongous objects bypass Eden and are allocated directly into a contiguous sequence of Old regions.
* **The Performance Trap**: If a G1 region is 4MB, allocating an array of 2.1MB occupies an entire 4MB region, immediately wasting 1.9MB of un-allocatable internal memory fragmentation. Repeated humongous allocations can prematurely trigger Stop-The-World **`Pause Full` (Full GC)**.
* **Tuning Fix**: Increase region size via `-XX:G1HeapRegionSize=16m` or `-XX:G1HeapRegionSize=32m` so large buffers fit into standard regions.

---

## 2. Remembered Sets (R-Sets) & Card Tables

To collect a Young region without scanning the entire Old generation to find inbound pointers, G1 maintains **Remembered Sets (R-Sets)** and a **Card Table**:

```
[Old Generation Region]
   └── Card (512 Bytes of Heap) ──► Contains pointer to Eden Object
               │
               ▼
   [Card Table: Marked "DIRTY" by Post-Write Barrier]
               │
               ▼
   [Eden Region Remembered Set (R-Set)] ──► Tracks pointing Card address
```

1. **Card Table**: A byte array where each byte represents a 512-byte slice of physical heap memory ("Card").
2. **Post-Write Barrier**: Whenever a thread executes an object reference update (`obj.field = target`), HotSpot runs a lightweight write barrier marking the corresponding Card in the Card Table as **DIRTY**.
3. **Concurrent Refinement Threads**: Background GC threads sweep dirty cards and update the target region's **R-Set**, ensuring young evacuation pauses only inspect dirty cards rather than the entire multi-gigabyte Old space.

---

## 3. Snapshot-At-The-Beginning (SATB) Write Barrier

G1 executes its Old generation marking phase concurrently with application execution. To prevent live objects from being mistakenly collected due to concurrent mutator reference overwrites, G1 enforces **Snapshot-At-The-Beginning (SATB)**:

```
[Application Mutator Overwrites Reference: a.b = c]
                         │
                         ▼
             [SATB Pre-Write Barrier]
                         │
        Logs OLD reference 'b' to per-thread SATB Buffer
                         │
                         ▼
        Guarantees that any object live at start of GC cycle
        is treated as LIVE and scanned!
```

* **Trade-Off**: SATB trades floating garbage (objects that became unreferenced during marking are preserved until the next cycle) for zero STW rescan pauses.

---

## 4. G1 Collection Cycles: Young vs. Mixed GC

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Young GC (STW Pause):                                                    │
│    • Evacuates live objects from Eden and Survivor regions into new         │
│      Survivor or Old regions.                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Concurrent Marking Cycle (Mutators Running):                             │
│    • Triggered when Old heap exceeds InitiatingHeapOccupancyPercent (IHOP). │
│    • Discovers live objects across Old generation without stopping threads. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Mixed GC (STW Pause Budgeted):                                           │
│    • Evacuates all Young regions PLUS candidate Old regions with the        │
│      highest ratio of reclaimable garbage ("Garbage-First").                │
│    • Executed over several iterative pauses to adhere to MaxGCPauseMillis.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Critical G1 Production Tuning Flags

| JVM Flag | Default Value | Architectural Purpose & Tuning Guidance |
|---|---|---|
| `-XX:+UseG1GC` | Default (JDK 9+) | Enables the G1 Garbage Collector. |
| `-XX:MaxGCPauseMillis` | `200` | Soft target pause time goal. Setting too low (&lt;50ms) triggers excessive short collections and throughput collapse. |
| `-XX:G1HeapRegionSize` | Ergonomic (1M-32M) | Explicitly sizes regions. Set to 16M or 32M for heaps &gt;16GB to neutralize humongous fragmentation. |
| `-XX:InitiatingHeapOccupancyPercent` | `45` | IHOP threshold. Triggers concurrent marking when Old generation reaches this percentage of total heap. |
| `-XX:G1ReservePercent` | `10` | Reserve memory headroom (default 10%) kept empty to prevent evacuation failures. |

---

## 6. Principal Architect Review Checklist

- [ ] **Full GC Elimination**: Are production GC logs monitored for `Pause Full`? A Full GC in G1 indicates evacuation failure and must be resolved by tuning IHOP or increasing heap headroom.
- [ ] **Humongous Allocation Audit**: Is `-Xlog:gc*,gc+phases=debug` inspected to verify that humongous allocations do not exceed 1% of total allocations?
- [ ] **Realistic Pause Targets**: Is `-XX:MaxGCPauseMillis` sized realistically (typically 150ms–250ms) rather than over-optimized to 10ms, which degrades steady-state throughput?
- [ ] **G1ReservePercent Headroom**: On bursty allocation workloads, is `G1ReservePercent` raised to 15% to absorb sudden promotion spikes?

---

## Related Documentation

- [Garbage Collection Fundamentals & Memory Lifecycle](./java-gc.md)
- [ZGC & Generational ZGC: Sub-Millisecond Pause Architecture](./java-gc-zgc-generational.md)
- [JVM Internals: Memory, GC & Class Loading](./java-jvm.md)
- [Production OOM Debugging & Heap Analysis](./production-oom-debugging-guide.md)
