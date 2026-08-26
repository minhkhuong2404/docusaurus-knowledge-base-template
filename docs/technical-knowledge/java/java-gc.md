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

## 7. Flags Cheatsheet

| Flag | Meaning |
| --- | --- |
| `-Xms` / `-Xmx` | Heap size (keep headroom for non-heap RSS in containers) |
| `-Xmn` / `-XX:NewRatio` | Young size |
| `-XX:SurvivorRatio` | Eden vs each Survivor (default 8 → ~8:1:1) |
| `-XX:MaxTenuringThreshold` | Max age before promotion (default 15) |
| `-XX:+UseG1GC` | G1 (default JDK 9+) |
| `-XX:MaxGCPauseMillis` | G1 pause goal (soft) |
| `-XX:InitiatingHeapOccupancyPercent` | When G1 starts concurrent mark |
| `-XX:+UseZGC` / `-XX:+ZGenerational` | ZGC (+ generational on JDK 21+) |
| `-Xlog:gc*` | Unified GC logging |

---

## 8. Interview Hooks

- Explain **S0/S1 From/To flip** and why one survivor is empty after a young GC.  
- **Parallel vs concurrent:** Parallel = many GC threads but STW; concurrent = mutators run during mark/relocate.  
- Why **Mark-Copy** for Young and why whole-heap copy is a bad Old strategy.  
- **Premature promotion** symptoms and how Survivor sizing / tenuring threshold interact.  
- When to stay on **G1** vs move to **ZGC** for p99 latency.

---

## Related

- [JVM Internals: Memory, GC & Class Loading](./java-jvm)  
- [Stack vs Heap](./java-stack-vs-heap)  
- [Diagnostics & Troubleshooting](./java-diagnostics-troubleshooting)
