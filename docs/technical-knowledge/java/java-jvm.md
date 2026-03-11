---
id: java-jvm
title: "JVM Internals: Memory, GC & Class Loading"
slug: java-jvm
---

# JVM Internals: Memory, GC & Class Loading

A guide to the Java Virtual Machine — runtime memory areas, garbage collection algorithms and collectors, class loading, and monitoring tools.

---

## 1. JVM Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        JVM                                  │
│  ┌──────────┐  ┌──────────────────────────────────────┐    │
│  │ Class    │  │        Runtime Data Areas             │    │
│  │ Loader   │  │  ┌──────────┐  ┌───────────────┐    │    │
│  │ Subsystem│──▶│  │  Method  │  │     Heap      │    │    │
│  └──────────┘  │  │  Area    │  │ (Young + Old) │    │    │
│                │  └──────────┘  └───────────────┘    │    │
│                │  ┌──────────┐  ┌───────────────┐    │    │
│                │  │  VM      │  │  Program      │    │    │
│                │  │  Stack   │  │  Counter      │    │    │
│                │  └──────────┘  └───────────────┘    │    │
│                │  ┌──────────────────────────────┐    │    │
│                │  │     Native Method Stack      │    │    │
│                │  └──────────────────────────────┘    │    │
│                └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Execution Engine                           │  │
│  │  Interpreter + JIT Compiler + Garbage Collector      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Runtime Memory Areas

### Heap (Shared, GC-managed)

The largest memory area. Stores **all object instances and arrays**. Divided into generations for GC efficiency:

```
Heap
├── Young Generation
│   ├── Eden Space        (~80% of young gen)
│   ├── Survivor 0 (S0)  (~10%)
│   └── Survivor 1 (S1)  (~10%)
└── Old Generation (Tenured)
```

- **Eden:** New objects are allocated here.
- **Survivors:** Objects that survive a minor GC move between S0 and S1.
- **Old Generation:** Long-lived objects promoted from young gen after surviving multiple GC cycles (default threshold: 15).

### Method Area / Metaspace (Shared)

Stores **class metadata, static variables, constant pool, and compiled code**.

- **JDK 7 and earlier:** PermGen (permanent generation) — fixed size, prone to `OutOfMemoryError: PermGen space`
- **JDK 8+:** Metaspace — stored in **native memory** (not heap), grows dynamically

```
// PermGen (JDK ≤ 7)
-XX:PermSize=256m -XX:MaxPermSize=512m

// Metaspace (JDK 8+)
-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m
```

### VM Stack (Per-Thread)

Each thread has its own stack. Each method call creates a **stack frame** containing:

- **Local variable array** — method parameters and local variables
- **Operand stack** — intermediate computation values
- **Frame data** — constant pool reference, return address

Errors:
- `StackOverflowError` — too many nested calls (e.g., infinite recursion)
- `OutOfMemoryError` — cannot allocate new thread stacks

### Program Counter (Per-Thread)

A small memory area holding the **address of the current bytecode instruction** being executed. Undefined for native methods.

### Native Method Stack (Per-Thread)

Similar to the VM stack but for **native (JNI) methods**. HotSpot JVM combines native method stack and VM stack.

---

## 3. Object Lifecycle

### Object Creation

When the JVM encounters a `new` instruction:

1. **Class loading check** — Is the class loaded? If not, trigger class loading.
2. **Memory allocation** — Allocate space in Eden. Two strategies:
   - **Bump-the-pointer** — if heap is compacted, just move the pointer forward
   - **Free list** — if heap is fragmented, find a suitable gap
3. **Initialize to zero** — Set all fields to default values (0, null, false)
4. **Set object header** — Store class pointer, hash code, GC age, lock info
5. **Execute `<init>`** — Run the constructor

### Object Memory Layout

```
┌─────────────────────────────────────────┐
│              Object Header              │
│  ┌───────────────┐  ┌───────────────┐  │
│  │  Mark Word    │  │  Class Pointer│  │
│  │  (hash, GC    │  │  (pointer to  │  │
│  │  age, lock)   │  │  Class meta)  │  │
│  └───────────────┘  └───────────────┘  │
├─────────────────────────────────────────┤
│           Instance Data                 │
│  (fields from this class + parents)     │
├─────────────────────────────────────────┤
│           Padding (alignment)           │
└─────────────────────────────────────────┘
```

### Object Access

Two approaches:
- **Direct pointer** (HotSpot): Reference points directly to the object. Faster access.
- **Handle pool:** Reference points to a handle containing pointers to both instance data and class data. More resilient during GC (only handle pointer changes).

---

## 4. Garbage Collection

### How GC Identifies Garbage

#### Reference Counting

Each object has a counter incremented/decremented when references are added/removed. Object is garbage when count = 0.

**Problem:** Cannot detect **circular references** (A → B → A).

#### Reachability Analysis (Used by JVM)

Starting from **GC Roots**, traverse all reachable objects. Anything unreachable is garbage.

**GC Roots include:**
- Objects referenced in VM stack (local variables)
- Static fields in the method area
- Objects referenced by active threads
- JNI references
- Synchronized monitors

### GC Algorithms

#### Mark-Sweep

1. **Mark** all reachable objects
2. **Sweep** (free) unmarked objects

Pros: Simple. Cons: **Memory fragmentation** (scattered free spaces).

#### Mark-Compact (Mark-Sweep-Compact)

1. **Mark** reachable objects
2. **Compact** — move live objects to one end
3. **Clear** the rest

Pros: No fragmentation. Cons: **Slower** (requires moving objects).

#### Copying

Divide memory into two halves. Copy live objects from one half to the other, then clear the first half.

Pros: Fast, no fragmentation. Cons: **Wastes 50% of memory**.

> The Young generation uses a modified copying algorithm with Eden + 2 Survivors (only ~10% wasted).

### Generational Collection

Most objects die young (**weak generational hypothesis**). The JVM exploits this:

| Generation | Algorithm | Trigger | Name |
|-----------|-----------|---------|------|
| **Young** | Copying (Eden → Survivor) | Eden full | **Minor GC** / Young GC |
| **Old** | Mark-Compact or Mark-Sweep | Old gen full | **Major GC** / Old GC |
| **Both** | Full heap collection | Various | **Full GC** (stop-the-world) |

**Minor GC flow:**
1. New objects allocated in Eden
2. Eden fills up → Minor GC triggered
3. Live objects in Eden + active Survivor → copied to the empty Survivor
4. Ages incremented; objects exceeding threshold (default 15) → promoted to Old gen
5. If Survivor can't hold all survivors → overflow to Old gen

---

## 5. Garbage Collectors

### Serial Collector (`-XX:+UseSerialGC`)

Single-threaded, stop-the-world. Suitable for small heaps and single-CPU machines.

### Parallel Collector (`-XX:+UseParallelGC`)

Multi-threaded young + old gen collection. **Throughput-oriented** — minimizes total GC time at the cost of longer individual pauses. Default in JDK 8.

### CMS (Concurrent Mark Sweep) (`-XX:+UseConcMarkSweepGC`)

**Low-latency** collector for old generation. Most work is done **concurrently** with application threads:

1. **Initial Mark** (STW) — mark GC roots
2. **Concurrent Mark** — traverse object graph concurrently
3. **Remark** (STW) — fix changes during concurrent mark
4. **Concurrent Sweep** — free dead objects concurrently

**Downsides:** CPU-intensive, produces fragmentation (no compaction), "concurrent mode failure" if old gen fills during collection. **Deprecated since JDK 9, removed in JDK 14.**

### G1 (Garbage First) (`-XX:+UseG1GC`)

**Region-based** collector. Divides the heap into equal-sized regions (~2048). Each region can be Eden, Survivor, Old, or Humongous (for large objects).

```
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ Eden│ Old │Surv │ Eden│ Old │Hum. │
├─────┼─────┼─────┼─────┼─────┼─────┤
│ Old │ Eden│Free │ Old │ Old │ Eden│
├─────┼─────┼─────┼─────┼─────┼─────┤
│Free │ Old │ Old │Surv │Free │ Old │
└─────┴─────┴─────┴─────┴─────┴─────┘
```

**Key features:**
- **Predictable pause times:** `-XX:MaxGCPauseMillis=200` (target, not guarantee)
- **Mixed collections:** Can collect young + some old regions selectively
- **Compacting:** Copies live objects between regions — no fragmentation
- **Default in JDK 9+**

### ZGC (`-XX:+UseZGC`)

**Ultra-low-latency** collector (sub-millisecond pauses) using colored pointers and load barriers.

- Pauses are **< 1ms** regardless of heap size
- Supports **multi-terabyte heaps**
- Concurrent relocation (moves objects while app runs)
- **Production-ready since JDK 15**

### Collector Selection Guide

| Collector | Pause Target | Heap Size | Use Case |
|-----------|-------------|-----------|----------|
| Serial | N/A | Small (< 100 MB) | Embedded, single-core |
| Parallel | High throughput | Medium | Batch processing |
| G1 | < 200ms | Medium-Large | General purpose (default) |
| ZGC | < 1ms | Any (up to TB) | Latency-critical apps |
| Shenandoah | < 10ms | Large | Low-latency alternative |

---

## 6. Class Loading

### Class Loading Process

```
Loading → Verification → Preparation → Resolution → Initialization
│          │              │              │             │
│          │              │              │             └─ Execute <clinit>
│          │              │              │                (static initializers)
│          │              │              └─ Resolve symbolic
│          │              │                 references to direct
│          │              └─ Allocate memory for
│          │                 static fields (set defaults)
│          └─ Verify bytecode correctness
│             (format, semantics, bytecode, symbol)
└─ Read .class file into memory,
   create Class object
```

### Class Loaders

Java uses a **hierarchical delegation model** (parent delegation):

```
Bootstrap ClassLoader (C/C++)
  └── loads: java.lang.*, java.util.* (core JDK)

Extension ClassLoader (Java)
  └── loads: javax.*, java.ext.dirs

Application ClassLoader (Java)
  └── loads: classpath classes (your code)

Custom ClassLoader (your implementation)
  └── loads: special sources (network, encrypted, etc.)
```

### Parent Delegation Model

When a class needs to be loaded:

1. Check if already loaded
2. Delegate to **parent** class loader first
3. If parent can't load it, try loading it yourself

```java
protected Class<?> loadClass(String name, boolean resolve) {
    // 1. Already loaded?
    Class<?> c = findLoadedClass(name);
    if (c == null) {
        try {
            // 2. Delegate to parent
            c = parent.loadClass(name, false);
        } catch (ClassNotFoundException e) {
            // 3. Parent failed — load it ourselves
            c = findClass(name);
        }
    }
    return c;
}
```

**Why parent delegation?**
- **Security:** Prevents malicious code from replacing core classes (e.g., custom `java.lang.String`)
- **Consistency:** Ensures core classes are loaded by the same loader

---

## 7. Class File Structure

Every `.class` file follows a strict binary format:

```
ClassFile {
    u4             magic;              // 0xCAFEBABE
    u2             minor_version;
    u2             major_version;      // Java 17 = 61
    u2             constant_pool_count;
    cp_info        constant_pool[];    // literals, type refs, method refs
    u2             access_flags;       // public, final, abstract, etc.
    u2             this_class;
    u2             super_class;
    u2             interfaces_count;
    u2             interfaces[];
    u2             fields_count;
    field_info     fields[];
    u2             methods_count;
    method_info    methods[];
    u2             attributes_count;
    attribute_info attributes[];
}
```

Use `javap -verbose MyClass.class` to inspect the structure.

---

## 8. Important JVM Parameters

### Heap Sizing

```bash
# Initial and maximum heap size
-Xms512m         # initial heap (set equal to -Xmx to avoid resizing)
-Xmx2g           # maximum heap

# Young generation size
-Xmn512m         # young gen size
-XX:NewRatio=2   # old:young ratio (default 2 → old is 2x young)

# Metaspace
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m
```

### GC Configuration

```bash
# Select collector
-XX:+UseG1GC                    # G1 (default JDK 9+)
-XX:+UseZGC                     # ZGC
-XX:+UseParallelGC              # Parallel (default JDK 8)

# G1 tuning
-XX:MaxGCPauseMillis=200        # target pause time
-XX:G1HeapRegionSize=4m         # region size (1-32 MB, power of 2)

# GC logging (JDK 9+)
-Xlog:gc*:file=gc.log:time,uptime,level,tags
```

### Thread Stack

```bash
-Xss512k    # thread stack size (default ~1MB)
```

### Troubleshooting

```bash
# Heap dump on OOM
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump.hprof

# Print GC details
-verbose:gc
```

---

## 9. JDK Monitoring & Troubleshooting Tools

### Command-Line Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `jps` | List running JVM processes | `jps -lv` |
| `jstat` | GC and memory statistics | `jstat -gcutil <pid> 1000` |
| `jinfo` | View/modify JVM flags | `jinfo -flags <pid>` |
| `jmap` | Heap dump and histogram | `jmap -dump:format=b,file=heap.hprof <pid>` |
| `jstack` | Thread dump (diagnose deadlocks) | `jstack <pid>` |
| `jcmd` | All-in-one diagnostic tool | `jcmd <pid> GC.heap_info` |

### Graphical Tools

- **JVisualVM** — bundled with JDK (up to JDK 8), monitors heap, threads, CPU
- **JConsole** — JMX-based monitoring console
- **Eclipse MAT** — heap dump analysis, find memory leaks
- **Arthas** — powerful runtime diagnostic tool (bytecode-level debugging)

### Common Troubleshooting Scenarios

**OutOfMemoryError: Java heap space**
1. Generate heap dump: `-XX:+HeapDumpOnOutOfMemoryError`
2. Analyze with Eclipse MAT → find objects consuming most memory
3. Check for memory leaks (growing collections, unclosed resources)

**High CPU usage**
1. `top -H -p <pid>` → find the CPU-intensive thread (note the TID)
2. `jstack <pid>` → find the thread by TID (convert to hex)
3. Analyze the stack trace

**Deadlock detection**
1. `jstack <pid>` → JVM automatically detects and reports deadlocks
2. Look for "Found one Java-level deadlock" in the output

**Frequent Full GC**
1. `jstat -gcutil <pid> 1000` → monitor GC frequency and duration
2. Check if old gen is filling up (memory leak?) or if young gen is too small (premature promotion)
3. Consider switching to G1 or ZGC for better pause behavior

---

## 10. Reference Types & GC

Java provides four reference types that influence garbage collection behavior:

| Reference Type | Class | GC Behavior | Use Case |
|---------------|-------|-------------|----------|
| **Strong** | (default) | Never collected while reachable | Normal references |
| **Soft** | `SoftReference<T>` | Collected when JVM is low on memory | Memory-sensitive caches |
| **Weak** | `WeakReference<T>` | Collected at next GC | `WeakHashMap`, canonicalizing maps |
| **Phantom** | `PhantomReference<T>` | Enqueued after finalization | Resource cleanup tracking |

```java
// Soft reference: cache that yields to memory pressure
SoftReference<byte[]> cache = new SoftReference<>(new byte[1024 * 1024]);
byte[] data = cache.get(); // may be null if GC reclaimed it

// Weak reference: doesn't prevent GC
WeakReference<ExpensiveObject> ref = new WeakReference<>(new ExpensiveObject());
ExpensiveObject obj = ref.get(); // null after GC
```

---

## 11. Common OOM Scenarios & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `OutOfMemoryError: Java heap space` | Heap exhausted | Increase `-Xmx`, fix memory leaks |
| `OutOfMemoryError: Metaspace` | Too many classes loaded | Increase `-XX:MaxMetaspaceSize`, fix classloader leaks |
| `OutOfMemoryError: GC overhead limit` | GC consuming over 98% CPU for under 2% heap recovery | Fix memory leaks, increase heap |
| `StackOverflowError` | Deep/infinite recursion | Fix recursion, increase `-Xss` |
| `OutOfMemoryError: unable to create new native thread` | Too many threads | Use thread pools, reduce stack size |
