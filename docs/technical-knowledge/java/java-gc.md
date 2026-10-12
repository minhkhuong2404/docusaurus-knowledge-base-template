---
id: java-gc
title: "Garbage Collection: Lifecycle, Algorithms & STW"
slug: java-gc
description: Interactive deep dive into HotSpot GC — object lifecycle Eden/S0/S1/Old, Mark-Copy/Sweep/Compact, and collector evolution from Serial to ZGC.
tags: [java, jvm, garbage-collection, performance, g1, zgc]
---

import HeapStructureDiagram from '@site/src/components/HeapStructureDiagram';
import GcObjectLifecycleDiagram from '@site/src/components/GcObjectLifecycleDiagram';
import GcStwEvolutionDiagram from '@site/src/components/GcStwEvolutionDiagram';
import GcMarkCopySimulationDiagram from '@site/src/components/GcMarkCopySimulationDiagram';
import G1HeapDiagram from '@site/src/components/G1HeapDiagram';

# Garbage Collection: Lifecycle, Algorithms & STW

HotSpot reclaims unreachable heap objects automatically. This page is the interactive home for **how an object ages** (Eden → Survivors → Old → reclaimed), **which algorithms** young/old use, and **how collectors evolved** to shrink Stop-The-World (STW) pauses.

For JVM architecture (Heap, Stack, PC, Metaspace) see [JVM Internals](./java-jvm).

---

## 1. Why Generational GC?

**Weak generational hypothesis:**

1. Most objects die young (request DTOs, short-lived builders, temporaries).
2. Objects that survive early collections tend to live a long time (singletons, caches, pools).

HotSpot splits the Java Heap into a **Young** generation (cheap, frequent Mark-Copy) and an **Old** generation (rarer, more expensive cycles). That split is why S0/S1 exist and why Minor GC is usually cheap compared to Full GC.

---

## 2. Heap Layout: Eden, S0, S1, Old

Click regions for ratios, GC role, and flags.

<HeapStructureDiagram />

| Space | Role |
| --- | --- |
| **Eden** | Birthplace of almost all `new` allocations (TLAB) |
| **S0 / S1** | Twin survivor spaces; one is empty (To) before each young GC; roles flip |
| **Old (Tenured)** | Long-lived objects after age threshold or survivor overflow |

**Locals vs objects:** method locals and parameters live on the **stack** and vanish when the frame returns. Only **heap** objects go through Eden → Survivor → Old.

---

## 3. Object Lifecycle (Animate)

Follow one object from allocation to reclamation. Press **▶ Animate** or click a stage.

<GcObjectLifecycleDiagram />

### Lifecycle in one breath

1. Allocate in **Eden**.
2. **Minor GC** copies live Eden objects into a Survivor (**To**); Eden is wiped.
3. Next Minor GC: live objects in **From** + Eden copy into the other Survivor; **age++**; spaces swap.
4. Age ≥ `-XX:MaxTenuringThreshold` (default **15**) or Survivor pressure → **promote** to Old.
5. When unreachable from **GC Roots**, a later Old / mixed / concurrent cycle **reclaims** the memory.

---

## 4. How GC Decides “Garbage”

HotSpot does **not** use reference counting (circular refs would leak). It uses **reachability analysis** from **GC Roots**:

- Locals / parameters on active thread stacks  
- Static fields  
- JNI references  
- Threads / some internal JVM handles  

Anything **not** reachable from a root is garbage — even if objects still point at each other.

A **Java memory leak** is usually “still reachable from a root but forgotten by the app” (static `Map`, `ThreadLocal`, listeners) — GC cannot help until the reference is cleared.

---

## 5. Algorithms & STW Evolution

Select a collector on the timeline, then an algorithm chip. Highlighted chips are the ones that collector relies on.

<GcStwEvolutionDiagram />

Simulate **Mark-Copy** (young Minor GC) or **Mark-Compact** (old slide) with moving arrows — one focused sim, not every collector.

<GcMarkCopySimulationDiagram />

Long STW freezes TCP handling — Kubernetes probes can kill a pod that is only “paused,” not dead. That operational pain is why G1 pause goals and ZGC concurrent relocate exist.

---

## 6. G1 Regions

G1 divides the heap into equal-sized regions. Each region is Eden, Survivor, Old, or Humongous. Click for region semantics.

<G1HeapDiagram />

- **Young GC:** evacuate Eden + Survivors into survivor/old regions.  
- **Concurrent mark:** find reclaimable Old regions.  
- **Mixed GC:** young + high-garbage Old regions in one pause budget (`MaxGCPauseMillis`).  
- **Full GC** in logs (`Pause Full`) means evacuation/concurrent cycle failed to keep up — investigate promotion, humongous objects, or heap size.

---

---

## 7. Tri-Color Marking & Concurrent Collector Barriers

Modern low-latency collectors (G1, Shenandoah, ZGC) perform object marking concurrently while application worker threads (mutators) continue to run. They model object reachability using the **Tri-Color Marking Abstraction**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TRI-COLOR MARKING ABSTRACTION                                               │
│                                                                             │
│ • WHITE: Unvisited objects. At the end of marking, white objects are dead.  │
│ • GREY:  Visited by GC, but its outgoing field references are not yet scanned│
│ • BLACK: Visited AND all outgoing references scanned. Guaranteed live.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Concurrent Invalidation Hazard
Because mutator threads run simultaneously with the GC marking threads, a mutator can break reachability assumptions if:
1. Mutator clears a pointer from a **Grey** object to a **White** object.
2. Mutator attaches that **White** object to an already-scanned **Black** object.
* If unhandled, the GC never visits the white object (since black objects are never rescanned), resulting in **catastrophic silent data corruption** (premature reclamation of live objects!).

### Barriers: SATB vs. Incremental Update vs. Load Barrier
* **Snapshot-At-The-Beginning (SATB - G1 GC)**: Uses a **Pre-Write Barrier**. Before overwriting an old field reference, it logs the old reference into a per-thread SATB buffer. Guarantees that any object that was live at the start of GC remains considered live.
* **Incremental Update (CMS / Shenandoah)**: Uses a **Post-Write Barrier**. When a black object receives a reference to a white object, it downgrades the black object back to grey.
* **Load Barrier (ZGC)**: Intercepts reference **reads** (`getfield`) rather than writes. If an object pointer has not been remapped, the load barrier intercepts the read in ~2 nanoseconds, updates the pointer to its new relocated address, and returns the valid object immediately ("Self-Healing").

---

## 8. ZGC Colored Pointers & Generational ZGC (Java 21)

ZGC achieves **sub-millisecond pause times** on heaps ranging from 8MB to 16TB by executing all mark, evacuate, and relocate phases concurrently.

### Colored Pointers & Virtual Memory Multi-Mapping
On 64-bit platforms, ZGC stores metadata directly inside the unused high-order bits of the 64-bit object reference pointer:

```
+-------------------+-------------+-----------------------------------------------+
| 16 Unused Bits    | 4 Color Bits| 44-bit Object Offset (Addresses up to 16 TB)  |
+-------------------+-------------+-----------------------------------------------+
                    | | | |
                    | | | +-- Finalizable (Weak/Phantom reference tracking)
                    | | +---- Remapped (Address points to new relocated location)
                    | +------ Marked1 (Active live marking phase)
                    +-------- Marked0 (Alternate live marking phase)
```

* **OS Virtual Memory Multi-Mapping (`mmap`)**: The Linux kernel maps the same physical memory page to three separate virtual memory addresses (`Marked0`, `Marked1`, and `Remapped`). When the CPU dereferences a colored pointer, it hits the exact same physical heap page regardless of which color bit is active, avoiding software bitmasking penalties.

### Generational ZGC (JEP 439 - Java 21 LTS)
In Java 21, **Generational ZGC** (`-XX:+UseZGC -XX:+ZGenerational`) separated the ZGC heap into Young and Old generations:
* Young collections run frequently and collect 90%+ of short-lived objects with almost zero CPU overhead.
* Resolves the legacy ZGC "Allocation Stall" issue where high allocation rates outpaced the single-generation concurrent marking cycle.
* Delivers consistent **p99.99 latencies under 1 millisecond** while maintaining throughput comparable to G1 GC.

---

## 9. Flags Cheatsheet

| Flag | Meaning |
| --- | --- |
| `-Xms` / `-Xmx` | Heap size (keep headroom for non-heap RSS in containers) |
| `-Xmn` / `-XX:NewRatio` | Young size |
| `-XX:SurvivorRatio` | Eden vs each Survivor (default 8 → ~8:1:1) |
| `-XX:MaxTenuringThreshold` | Max age before promotion (default 15) |
| `-XX:+UseG1GC` | G1 (default JDK 9+) |
| `-XX:MaxGCPauseMillis` | G1 pause goal (soft, default 200ms) |
| `-XX:InitiatingHeapOccupancyPercent` | When G1 starts concurrent mark (default 45%) |
| `-XX:+UseZGC` / `-XX:+ZGenerational` | Generational ZGC (sub-millisecond pauses on JDK 21+) |
| `-Xlog:gc*,gc+phases=debug:file=gc.log:time,uptime,pid:filecount=5,filesize=100M` | Production Unified GC logging |

---

## 10. Interview Hooks

- Explain **S0/S1 From/To flip** and why one survivor is empty after a young GC.  
- **Parallel vs concurrent:** Parallel = many GC threads but STW; concurrent = mutators run during mark/relocate.  
- Why **Mark-Copy** for Young and why whole-heap copy is a bad Old strategy.  
- **Tri-color marking:** How write barriers (SATB) prevent premature reclamation of live objects.  
- **ZGC Colored Pointers & Load Barriers:** How self-healing pointers achieve sub-millisecond pauses without Stop-The-World relocation phases.  
- When to stay on **G1** (maximum batch throughput) vs move to **Generational ZGC** (strict &lt;1ms SLA requirements).

---

## Related

- [JVM Internals: Memory, GC & Class Loading](./java-jvm)  
- [Java Object Layout (JOL) & Memory Architecture](./java-object-layout-memory)
- [Stack vs Heap](./java-stack-vs-heap)  
- [Diagnostics & Troubleshooting](./java-diagnostics-troubleshooting)
