---
id: java-object-layout-memory
title: "Java Object Layout (JOL), Mark Word & Hardware Cache Locality"
sidebar_label: "Object Layout & Hardware Cache"
sidebar_position: 6
description: Comprehensive principal engineering guide to HotSpot 64-bit object memory layout, 64-bit Mark Word states, Compressed OOPs, 8-byte word alignment padding, CPU cache line false sharing, and @Contended mechanical sympathy.
tags: [java, jvm, jol, mark-word, compressed-oops, false-sharing, contended, cache-line, hardware-sympathy, memory-layout]
---

import JavaObjectLayoutDiagram from '@site/src/components/JavaObjectLayoutDiagram';

# 🧱 Java Object Layout (JOL), Mark Word & Hardware Cache Locality

In Java, every `new Object()` allocation is an abstraction over raw physical memory managed by the HotSpot Virtual Machine. Understanding how objects are structured at the byte and bit level is the foundation of **mechanical sympathy** — designing software that cooperates with the underlying CPU architecture, L1/L2/L3 hardware caches, and memory controllers.

<JavaObjectLayoutDiagram />

---

## 1. HotSpot 64-Bit Object Structure

On a standard 64-bit JVM, every heap object consists of three distinct regions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. OBJECT HEADER (12 or 16 Bytes)                                           │
│    ├── Mark Word:  8 Bytes (64 bits) - HashCode, Age, Lock Bits             │
│    └── Klass Word: 4 Bytes (Compressed OOPs) or 8 Bytes (Uncompressed)      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. INSTANCE DATA (Variable Bytes)                                           │
│    └── Primitive fields and object reference pointers (ordered by size)     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. ALIGNMENT PADDING (0 to 7 Bytes)                                         │
│    └── Round-up bytes to satisfy the 8-byte address boundary                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The 8-Byte Word Alignment Rule
HotSpot requires every object to begin at a memory address that is a multiple of **8 bytes**. If the sum of the header and instance fields is not evenly divisible by 8, the JVM appends **Alignment Padding** (between 1 and 7 unused bytes).

$$\text{Object Size} = \left\lceil \frac{\text{Header} + \text{Fields}}{8} \right\rceil \times 8$$

---

## 2. Compressed OOPs & Compressed Class Pointers

A 64-bit memory pointer consumes **8 bytes**. In an application managing millions of object references, 64-bit pointers consume substantial heap space and pollute hardware CPU caches.

### The 3-Bit Shift Mathematical Trick
Because every object address in HotSpot is aligned on an 8-byte boundary, the lowest 3 bits of every object reference are guaranteed to be `000`:

```
Physical 64-bit Address: 0x0000_0007_A120_4400 ──► Ends in 000 (Binary)
```

The HotSpot team introduced **Compressed Ordinary Object Pointers (Compressed OOPs)** via `-XX:+UseCompressedOops` (default on heaps &lt; 32GB):
1. **At Storage (Heap Reference)**: The JVM drops the lowest 3 zero bits and stores the reference as a **32-bit unsigned integer**.
2. **At Dereference (CPU Register)**: The CPU executes a single-cycle bitwise left-shift (`<< 3`):

$$\text{Physical Address} = \text{Stored 32-bit Integer} \ll 3$$

* **The 32GB Boundary Limit**: A 32-bit integer can address $2^{32} = 4\text{ GB}$ of distinct offsets. Multiplying by 8 ($2^{32} \times 2^3 = 2^{35}$) enables 32-bit references to address up to **32 GB of RAM**.
* **Production Trap**: Setting `-Xmx32g` or higher forces the JVM to disable Compressed OOPs, immediately expanding all object references and Klass pointers from 4 bytes to 8 bytes. A heap at `-Xmx32g` often holds **less usable data** than a heap at `-Xmx31g` due to pointer inflation!

---

## 3. The 64-Bit Mark Word State Machine

The **Mark Word** is an 8-byte multiplexed bitfield whose interpretation dynamically changes based on the object's synchronization and lifecycle state:

```
64-Bit Mark Word Layout Across States:

1. Unlocked (Tag 01):
   [unused: 25] [identity_hashcode: 31] [unused: 1] [age: 4] [biased_lock: 0] [lock: 01]

2. Lightweight Locked (Tag 00):
   [ptr_to_displaced_mark_word_on_thread_stack: 62 bits                    ] [lock: 00]

3. Heavyweight Inflated Monitor (Tag 10):
   [ptr_to_native_object_monitor_structure: 62 bits                        ] [lock: 10]

4. Marked for GC (Tag 11):
   [cms_free_block / gc_forwarding_pointer: 62 bits                        ] [lock: 11]
```

### The Identity HashCode Gotcha
* When an object is newly instantiated, its Identity HashCode is **not computed**. The 31 bits in the Mark Word remain `0`.
* The first time `System.identityHashCode(obj)` or `Object.hashCode()` is invoked on an un-overridden object, the JVM lazily generates a random hash and **permanently stamps it into the Mark Word**.
* **Impact on Synchronization**: A lightweight lock requires writing a displaced Mark Word pointer into the header. If an object has already computed its identity hashcode, it **cannot use biased locking** and must escalate directly to lightweight or heavyweight locks.

---

## 4. Hardware Cache Lines (64 Bytes) & False Sharing

Modern x86 and ARM CPUs read and write memory in discrete atomic chunks known as **Cache Lines** (standard size: **64 bytes**).

```
┌──────────────────────────────────────────────────────────────┐
│             SINGLE 64-BYTE CPU CACHE LINE                    │
│                                                              │
│  [Core 1 Variable: valueA (8B)]  [Core 2 Variable: valueB (8B)]│
│  └──────────────┬─────────────┘  └─────────────┬─────────────┘│
└─────────────────┼──────────────────────────────┼──────────────┘
                  │                              │
          Modified by Core 1             Modified by Core 2
                  │                              │
                  ▼                              ▼
      [MESI Invalidation Storm: Remote Cache Line Invalidated]
```

### The False Sharing Mechanics
1. Thread 1 running on CPU Core 1 mutates `valueA`.
2. Thread 2 running on CPU Core 2 mutates `valueB`.
3. Even though the two threads mutate completely unrelated logical variables, both variables share the **same 64-byte hardware cache line**.
4. The hardware **MESI / MOESI cache coherency protocol** marks the cache line as *Invalid* on Core 2 every time Core 1 writes to it.
5. Both cores stall, forcing continuous reloads from slow L3 cache or RAM (cache line bouncing). Throughput can drop by **10x to 50x**.

### Mitigations: `@Contended` and Manual Cache Line Padding

Java provides `@jdk.internal.vm.annotation.Contended` (JEP 142) to instruct HotSpot to isolate critical variables onto their own dedicated 64-byte cache line:

```java
import jdk.internal.vm.annotation.Contended;

public class HighThroughputMetrics {

    // Isolated onto its own 64-byte cache line
    @Contended("groupA")
    public volatile long transactionCount;

    // Isolated onto a separate cache line
    @Contended("groupB")
    public volatile long errorCount;
}
```

* *Note: In standard application code outside the JDK, using `@Contended` requires passing the JVM flag `-XX:-RestrictContended`.*
* **Manual Padding in High-Performance Code (LMAX Disruptor Pattern)**:
  ```java
  public class PaddedAtomicLong {
      // 56 bytes of dummy padding to ensure no other variable shares the 64-byte line
      public long p1, p2, p3, p4, p5, p6, p7;
      public volatile long value = 0L;
      public long p8, p9, p10, p11, p12, p13, p14;
  }
  ```

---

## 5. Inspecting Memory Layout with JOL (Java Object Layout)

The OpenJDK tool **JOL** allows developers to print the exact byte offsets, headers, and padding of any class at runtime:

```java
package com.bank.jol;

import org.openjdk.jol.info.ClassLayout;

public class JolMemoryDemo {

    public static class AccountRecord {
        private long accountId;   // 8 bytes
        private int balanceCents; // 4 bytes
        private boolean isActive; // 1 byte
    }

    public static void main(String[] args) {
        System.out.println(ClassLayout.parseClass(AccountRecord.class).toPrintable());
    }
}
```

### JOL Output Breakdown:
```
com.bank.jol.JolMemoryDemo$AccountRecord object internals:
 OFFSET  SIZE      TYPE DESCRIPTION                    VALUE
      0     4           (object header: mark)          0x0000000000000001 (unlocked)
      4     4           (object header: mark)          0x0000000000000000
      8     4           (object header: class)         0x00060938
     12     4       int AccountRecord.balanceCents     0
     16     8      long AccountRecord.accountId        0
     24     1   boolean AccountRecord.isActive         false
     25     7           (loss due to the next object alignment)
Instance size: 32 bytes
Space losses: 0 bytes internal + 7 bytes external = 7 bytes total
```

Notice HotSpot reordered the fields (moving `int` before `long`) to pack fields tightly, followed by **7 bytes of alignment padding** to reach 32 bytes.

---

## 6. Principal Architect Review Checklist

- [ ] **Compressed OOPs Threshold**: Is `-Xmx` kept strictly below 32GB unless a significantly larger heap (e.g. 48GB+) is genuinely required to avoid the uncompressed pointer tax?
- [ ] **Cache Line Padding in Hot Paths**: Are frequently updated concurrent counters (e.g. ring buffer sequence heads, metrics) protected with `@Contended` or manual 64-byte padding?
- [ ] **Array Memory Footprint**: Does the team account for the additional 4-byte array length field in object headers when sizing large primitive arrays?
- [ ] **Wrapper Object Bloat**: Are high-volume telemetry collections using primitive collections (e.g. Eclipse Collections `LongArrayList`) instead of `java.lang.Long` to eliminate the 24-byte per-element object wrapper overhead?

---

## Related Documentation

- [JVM Internals: Memory, GC & Class Loading](./java-jvm.md)
- [Stack vs. Heap Memory Architecture](./java-stack-vs-heap.md)
- [Lock-Free Concurrency & VarHandle](./java-lock-free-varhandle.md)
- [LMAX Disruptor High-Performance Ring Buffer](./java-lmax-disruptor.md)
- [Java Off-Heap Memory & Foreign Function (FFM) API](./java-off-heap-ffm-api.md)
