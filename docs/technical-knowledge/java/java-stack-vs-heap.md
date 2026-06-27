---
title: Stack vs Heap Memory in Java
description: An in-depth guide to understanding what data is stored in stack memory and heap memory in the Java Virtual Machine (JVM), including memory tuning and garbage collection.
tags: [java, jvm, memory, stack, heap, garbage-collection]
---

# Stack vs Heap Memory in Java

In Java, memory management is handled automatically by the Java Virtual Machine (JVM). While you don't manually allocate and free memory like in C or C++, understanding how the JVM divides memory is crucial for writing performant, bug-free applications. 

Memory is broadly divided into two primary areas you interact with daily:

- **Stack memory:** Per-thread memory used for execution call frames and method-local execution data.
- **Heap memory:** Shared memory space used for dynamic object storage, managed by the Garbage Collector (GC).

---

## 🎯 Why Should I Care?

Most Java developers can write code for years without thinking about stack vs heap. So why does it matter?

### For Beginners: Avoiding Mysterious Crashes

You'll eventually encounter one of these errors — and without understanding memory, they're baffling:

```
java.lang.StackOverflowError          ← stack ran out
java.lang.OutOfMemoryError: Java heap space   ← heap ran out
java.lang.OutOfMemoryError: Metaspace         ← class metadata area ran out
```

Knowing **where** your data lives tells you **what** went wrong and **how** to fix it.

### For Intermediate Developers: Writing Efficient Code

Understanding memory layout helps you make smarter choices:

| Decision | Stack-Aware Choice | Impact |
|---|---|---|
| Use `int` or `Integer`? | `int` stays on the stack (if local) | Avoids heap allocation + GC overhead |
| Create objects in a hot loop? | Reuse or use primitives | Reduces GC pressure by millions of allocations |
| Pass a large list to a method? | Only the reference is copied (8 bytes), not the list | Passing objects is cheap |
| Use `StringBuilder` in a loop? | One heap object vs N concatenated strings | Massive memory savings |

### For Senior Engineers: Diagnosing Production Issues

In production, memory problems manifest as:
- **High GC pause times** — the heap is churning too many short-lived objects
- **Memory leaks** — objects on the heap that should be dead but aren't (still referenced)
- **Thread exhaustion** — each thread consumes ~1MB of stack; 5,000 threads = 5GB just for stacks
- **OOM crashes** — the heap or metaspace fills up under load

Understanding stack vs heap is the foundation of JVM tuning, heap dump analysis, and performance optimization.

---

## 🏢 JVM Process Memory: The -Xmx Illusion

A common misconception among Java developers is that **JVM Memory = Heap Memory**. Developers often set the maximum heap size via `-Xmx` (e.g., `-Xmx1g`), allocate a slightly larger memory limit to their container (e.g., `1.5GB`), and are surprised when the container is abruptly terminated by Kubernetes with an `OOMKilled` status—even when Heap usage remains under 900MB.

This happens because the heap is only a portion of the total memory consumed by a Java process. The physical memory (RAM) consumed by a JVM process is:

$$\text{RAM Process} = \text{Heap (On-Heap)} + \text{Metaspace} + \text{Thread Stacks} + \text{Code Cache} + \text{Direct Memory} + \text{JVM Overhead (Off-Heap)}$$

For a detailed visual architectural diagram, complete side-by-side comparison, and Kubernetes container sizing heuristics, see the [JVM On-Heap vs. Off-Heap Memory Layout](./java-jvm.md#2-on-heap-vs-off-heap-memory-layout).

### 🚨 The Monitoring Blind Spot
Tools like JConsole or VisualVM have a "Non-Heap" visualization tab. However, **this tab only tracks Metaspace and Code Cache**. It completely ignores **Thread Stacks** and **Direct Memory buffers**—which are often the heaviest consumers of off-heap RAM. Relying purely on basic JVM monitors will hide the true memory footprint from your view.

### 💀 Linux OOM Killer vs. JVM OutOfMemoryError
When memory limits are exceeded, there are two completely different failure modes:

1. **`java.lang.OutOfMemoryError: Java heap space` (JVM-Level):**
   - **Cause:** The Heap memory fills up, and the GC cannot reclaim enough space to allocate a new object.
   - **Behavior:** The JVM remains alive. It throws a standard Java exception, logs a stack trace, and allows you to capture diagnostic information (like heap dumps).
2. **`OOMKilled` (OS/Container-Level):**
   - **Cause:** The total process memory (Heap + Off-Heap) exceeds the container's cgroup memory limit.
   - **Behavior:** The Linux kernel's Out-Of-Memory (OOM) Killer immediately sends a `SIGKILL` to the process. The JVM is terminated instantly without any warning. No Java stack trace is logged. The application logs simply stop mid-execution. You can only confirm this by checking container events (`kubectl describe pod`) or system logs (`dmesg`).

### 🔍 Diagnosing Native Memory Issues
To track off-heap memory consumption, enable **Native Memory Tracking (NMT)** by adding this flag to your JVM startup parameters:
```bash
-XX:NativeMemoryTracking=summary
```
Then, query the running JVM in real-time using `jcmd`:
```bash
jcmd <PID> VM.native_memory summary
```
### 🚀 Direct Memory & Buffers: Tomcat vs. Netty
Because Java's GC moves heap objects during compaction, the Operating System's `read()` system call cannot write directly to heap buffers—the memory addresses must be fixed. To bridge this, Java uses **Direct Memory (Off-Heap)** as an intermediate static landing pad. 

How different application server architectures manage this off-heap buffer impacts your native memory footprint:

#### A. Tomcat (Temporary Thread-Local Cache)
Tomcat uses blocking I/O and reads incoming request bytes through a **temporary thread-local buffer cache** managed by the JDK (`sun.nio.ch.Util`):
* **Path:** NIC ──▶ OS Socket Buffer ──▶ Temporary Direct Buffer (Off-Heap) ──▶ Heap Byte Array (On-Heap) ──▶ Java Object (Two copies)
* **Footprint:** Each worker thread is allocated a small cached buffer (typically `8KB`). For 200 default worker threads, this uses only **1.6MB** of native memory, which is negligible and rarely leaks.
* **The Thread-Local Trap:** If business logic running on a Tomcat thread reads a large file (e.g., 50MB) via an NIO `FileChannel` into a heap array, the JDK NIO utility automatically resizes that thread's local direct buffer cache to **50MB** and caches it permanently. Under load, 100 threads doing this will leak **5GB** of native RAM.
* **Remediation:** Pass the JVM flag `-Djdk.nio.maxCachedBufferSize=262144` (256KB) to prevent threads from caching excessively large buffers.

#### B. Netty (Pooled Chunks & Reference Counting)
Netty (the engine behind Spring WebFlux and gRPC) bypasses the second heap copy, parsing data directly from the off-heap buffer to save CPU cycles and reduce heap GC garbage.
* **Path:** NIC ──▶ OS Socket Buffer ──▶ Pooled Direct Buffer (Off-Heap) ──▶ Java Object (On-Heap) (One copy)
* **Footprint:** Netty allocates large native memory blocks called **chunks** (defaulting to **4MB** each) and rents out small slices to individual active connections. Direct memory scales with the **volume of concurrent active data** rather than thread count.
* **The Reference Counting Leak Trap:** Because GC cannot track off-heap chunks, Netty uses manual reference counting. When a request is completed, `.release()` must be called to return the slice to the pool. If code drops the heap wrapper without calling `release()`, the GC reclaims the heap wrapper (keeping heap memory green), but the native memory slice is **leaked permanently**.
* **The Pinning Effect:** Netty cannot return a 4MB chunk to the OS until *every single slice* allocated from it is released. A single unreleased slice pins the entire 4MB chunk in RAM.
* **Remediation:** Run JVM with `-Dio.netty.leakDetection.level=ADVANCED` in staging to log stack traces of unreleased buffers.

For configuration details and thread pool integration context, see [Tomcat vs. Netty Direct Memory Behaviors](./thread-pools-and-connection-pooling.md#tomcat-and-direct-memory-the-temporary-cache).

---

## What Is Stored in Stack Memory

According to the **JVM Specification**, the runtime memory layout (Runtime Data Areas) is split into two major groups depending on whether they are private to each thread or shared globally across the process:

1. **Per-Thread (Private) Data Areas:**
   - **JVM Stack:** Stores stack frames for Java method invocations.
   - **Native Method Stack:** Holds execution frames for native (C/C++) methods called via JNI (Java Native Interface).
   - **PC (Program Counter) Register:** Holds the memory address of the JVM bytecode instruction currently being executed by the thread.
2. **Shared (Process-Wide) Data Areas:**
   - **Heap:** Stores objects and arrays.
   - **Method Area (Metaspace):** Stores class structures, constant pools, metadata, and bytecode.

### Why is Stack Memory Thread-Safe?
Unlike the heap, which is shared globally, the **JVM Stack is per-thread**. Each thread has its own private stack that cannot be accessed, read, or modified by any other thread. Because there is no concurrency or data sharing, local variables are inherently thread-safe without the need for synchronization, lock primitives, or volatile memory barriers.

### Stack Content Breakdown
Stack memory stores data tied tightly to method execution. It represents the "execution trace" of a specific thread, including:
- **Method Call Frames:** Every time a method is invoked, a new block (frame) is created on top of the stack.
- **Primitive Local Variables:** Primitives (`int`, `double`, `float`, `boolean`, `char`, etc.) declared directly inside a method.
- **Object References:** The memory address pointer (reference) that points to an object sitting in the heap.
- **Method Parameters:** Arguments passed into the method.
- **Return Addresses:** Information instructing the CPU where to resume execution after the current method finishes.

### Key Properties of Stack Memory
- **LIFO Order & Instant Reclaim:** Follows a strict Last-In, First-Out execution pattern. When a method returns or throws an exception, its corresponding stack frame is immediately popped and discarded. Memory is reclaimed in an $O(1)$ pointer shift without needing the GC.
- **Continuous Memory:** Allocated in contiguous blocks of virtual memory, which maximizes CPU cache locality and performance.
- **Strict Size Limits:** The stack is relatively small compared to the heap (defaults to **1MB** on 64-bit Linux JVMs). Deep or infinite recursion will exhaust this space and throw a `java.lang.StackOverflowError`.
- **Tuning Flag:** Configured using the `-Xss` flag (e.g., `-Xss512k`).

### 🔍 Stack Frame Anatomy

When a method is called, a **stack frame** is pushed onto the thread's stack:

```
Thread Stack (growing downward)
┌──────────────────────────────────┐
│  main() frame                    │
│  ├── int count = 10              │  ← primitive stored directly
│  ├── String label = 0xABC...     │  ← reference (8 bytes, points to heap)
│  └── Person p = 0xDEF...        │  ← reference (8 bytes, points to heap)
├──────────────────────────────────┤
│  p.sayHello() frame             │
│  ├── int greetingCount = 1       │  ← primitive stored directly
│  ├── String msg = 0x123...       │  ← reference (points to "Hi" in String Pool)
│  └── [return address → main()]   │  ← where to resume after this method
└──────────────────────────────────┘
```

When `sayHello()` returns, its entire frame is **instantly popped** — no garbage collection needed. This is why stack allocation is blazing fast.

---

## What Is Stored in Heap Memory

Heap memory is the runtime data area from which memory for all class instances (objects) and arrays is allocated. It is designed to store data that outlives a single method call.

- **Objects created with `new`:** Any instance of a class (e.g., `new ArrayList<>()`, `new Person()`).
- **Object Fields (Instance Variables):** Both primitive and reference variables declared at the class level live on the heap *inside* their parent object.
- **Arrays:** Arrays are always objects in Java, meaning both the array itself and its elements (if they are primitives) live on the heap.
- **String Pool:** A special storage area in the heap specifically for String literals to optimize memory usage and avoid creating duplicate Strings.

### Key Properties of Heap Memory

- **Shared Across Threads:** All threads share the same heap. Objects here can be accessed globally, meaning you must use synchronization or concurrent collections to maintain thread safety.
  - **Thread-Local Allocation Buffer (TLAB):** Because the heap is shared, having multiple threads allocate objects concurrently would require global locking, severely degrading performance. To prevent this, the JVM allocates a small, thread-private buffer (TLAB) within the Eden space for each thread. Threads allocate objects inside their own TLABs lock-free. They only synchronize with the global heap allocator when their TLAB is full and they need to request a new buffer chunk.
- **Generational Structure:** Modern JVMs divide the heap to optimize garbage collection:
  - **Young Generation:** Where newly created objects start. It is divided into Eden Space and Survivor Spaces. Most objects die young here (Minor GC).
  - **Old (Tenured) Generation:** Objects that survive multiple GC cycles in the Young Generation are moved here (Major GC).
- **Garbage Collection (GC):** Dead objects (those with no active references pointing to them) are automatically cleared by the GC.
- **Size Constraints:** If the heap fills up and the GC cannot free enough space, the JVM throws a `java.lang.OutOfMemoryError: Java heap space`.
- **Tuning Flags:** You can configure the heap size using `-Xms` (initial heap size) and `-Xmx` (maximum heap size).

*(Note: Prior to Java 8, class metadata was stored in the heap in an area called PermGen. Since Java 8, this was moved to a native memory area called **Metaspace**, separate from the heap).*

### 🔍 Heap Generational Layout

```
Heap Memory
┌────────────────────────────────────────────────────────┐
│                    Young Generation                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Eden    │  │Survivor 0│  │Survivor 1│             │
│  │  Space   │  │  (From)  │  │   (To)   │             │
│  │          │  │          │  │          │             │
│  │ new      │  │ survived │  │          │             │
│  │ objects  │  │ 1+ GC    │  │  (empty) │             │
│  │ created  │  │ cycles   │  │          │             │
│  │ here     │  │          │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
├────────────────────────────────────────────────────────┤
│                    Old Generation                       │
│  ┌────────────────────────────────────────────────┐    │
│  │  Long-lived objects that survived many GC      │    │
│  │  cycles in Young Generation                    │    │
│  │  (e.g., cached data, singletons, Spring beans) │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘

Outside Heap:
┌────────────────────────────┐
│  Metaspace (Java 8+)       │
│  Class metadata, method    │
│  bytecode, constant pool   │
│  (in native memory)        │
└────────────────────────────┘
```

**Object lifecycle:**
1. **Born** in Eden → Minor GC runs
2. **Survived** → moved to Survivor space
3. **Survived N times** → promoted to Old Generation (tenured)
4. **Unreachable** → garbage collected

---

## 🧹 Garbage Collection & Heap Management

While the stack manages its own cleanup instantaneously as frames are popped, the heap relies on the **Garbage Collector (GC)**. 
- **The Lifecycle Boundary:** Objects allocated on the heap remain in memory as long as they are **reachable** via a path of references starting from active variables (like references currently held on a Thread Stack) or static scopes, known as **GC Roots**.
- **Generation Division:** The heap is partitioned into Young (Eden, S0, S1) and Old (Tenured) generations because of the *Weak Generational Hypothesis* (most objects die young, while survivors live for a long time). 

For a complete deep dive into how the JVM identifies garbage (reachability analysis vs. reference counting), detailed step-by-step algorithms (Mark-Sweep-Compact vs. Copying), Stop-The-World (STW) latency impacts in containers, and how coding practices create memory leaks, see [JVM Garbage Collection Internals](./java-jvm.md#4-garbage-collection).

---

## Quick Example: Stack vs. Heap in Action

```java
public class MemoryExample {
    public static void main(String[] args) {
        int count = 10;               // primitive local -> Stack
        
        // local reference 'label' -> Stack
        // actual String object "Java" -> Heap (String Pool)
        String label = "Java";        
        
        // local reference 'p' -> Stack
        // actual Person object -> Heap
        Person p = new Person("Ana"); 
        p.sayHello();
    }
}

class Person {
    // 'name' is a reference variable. Because it's an instance field, 
    // the reference itself lives inside the Person object on the Heap.
    private String name;              

    Person(String name) {
        this.name = name;
    }

    void sayHello() {
        // primitive local -> Stack
        int greetingCount = 1;       
        
        // local reference 'msg' -> Stack
        // actual String object "Hi" -> Heap (String Pool)
        String msg = "Hi";           
        
        System.out.println(msg + ", " + name);
    }
}
```

### Visual Memory Map for This Example

```
        STACK (main thread)                    HEAP
   ┌──────────────────────┐        ┌──────────────────────┐
   │ main() frame         │        │                      │
   │  count = 10          │        │  Person object       │
   │  label ─────────────────────▶ │  ┌────────────────┐  │
   │  p ─────────────────────────▶ │  │ name ──────┐   │  │
   │                      │        │  └────────────│───┘  │
   ├──────────────────────┤        │               ▼      │
   │ sayHello() frame     │        │  String Pool         │
   │  greetingCount = 1   │        │  ┌──────────────┐    │
   │  msg ───────────────────────▶ │  │ "Java"       │    │
   │                      │        │  │ "Ana"        │    │
   └──────────────────────┘        │  │ "Hi"         │    │
                                   │  └──────────────┘    │
                                   └──────────────────────┘
```

---

## 🏢 Real-World Use Cases & Common Pitfalls

### 1. The Infinite Recursion StackOverflow

```java
// ❌ Classic StackOverflowError — each call adds a frame, stack fills up
public int factorial(int n) {
    return n * factorial(n - 1); // forgot base case!
}

// ✅ Fixed with base case
public int factorial(int n) {
    if (n <= 1) return 1;       // base case — stops recursion
    return n * factorial(n - 1);
}

// ✅ Even better — iterative (no stack growth at all)
public int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
```

**Stack impact:** Each recursive call adds ~100-200 bytes to the stack. With default `-Xss512k`, you can make roughly 3,000-5,000 recursive calls before overflow.

### 2. Memory Leak from Static Collections

```java
// ❌ Classic heap memory leak — the map grows forever
public class EventTracker {
    // static → lives as long as the class → as long as the JVM
    private static final Map<String, List<Event>> events = new HashMap<>();

    public void trackEvent(String userId, Event event) {
        events.computeIfAbsent(userId, k -> new ArrayList<>()).add(event);
        // Events are NEVER removed! Map grows until OOM.
    }
}
```

```java
// ✅ Fixed — use bounded cache or weak references
public class EventTracker {
    // LRU cache with max 10,000 entries
    private static final Map<String, List<Event>> events =
        Collections.synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, List<Event>> eldest) {
                return size() > 10_000;
            }
        });
}

// ✅ Or use Caffeine/Guava cache with TTL
private static final Cache<String, List<Event>> events = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofHours(1))
    .build();
```

### 3. Autoboxing in Hot Loops

```java
// ❌ Slow — creates ~1,000,000 Integer objects on the heap!
public long sumWithAutoboxing(List<Integer> numbers) {
    Long sum = 0L;  // Long (boxed!) — every += creates a new Long object
    for (Integer n : numbers) {
        sum += n;   // autoboxing + unboxing on every iteration
    }
    return sum;
}

// ✅ Fast — uses primitives, stays on the stack
public long sumWithPrimitives(List<Integer> numbers) {
    long sum = 0L;  // primitive long — lives on the stack
    for (int i = 0; i < numbers.size(); i++) {
        sum += numbers.get(i); // one unboxing per iteration, no new objects
    }
    return sum;
}
```

**Memory impact:** In a list of 1,000,000 elements, the boxed version creates ~1M temporary `Long` objects (16 bytes each = ~16MB of garbage per call), putting massive pressure on the GC.

### 4. String Concatenation vs StringBuilder

```java
// ❌ O(n²) memory — creates N intermediate String objects on the heap
public String buildReport(List<String> lines) {
    String result = "";
    for (String line : lines) {
        result = result + line + "\n"; // new String object every iteration!
    }
    return result;
}

// ✅ O(n) memory — one StringBuilder, one final String
public String buildReport(List<String> lines) {
    StringBuilder sb = new StringBuilder(lines.size() * 80); // estimated capacity
    for (String line : lines) {
        sb.append(line).append('\n');
    }
    return sb.toString();
}
```

---

## 🏗️ Architecture Deep Dive

### The Complete JVM Memory Model

The stack and heap are just two parts of a larger picture. For a comprehensive, detailed architectural diagram illustrating the differences and relationships between On-Heap and Off-Heap (Native) memory regions, see the [JVM Memory Layout Section](./java-jvm.md#2-on-heap-vs-off-heap-memory-layout).

```
JVM Memory Layout
├── Thread Stacks              (per thread, -Xss)
│   ├── Stack frames
│   ├── Local variables
│   └── Operand stack
├── Heap                       (shared, -Xms/-Xmx)
│   ├── Young Generation
│   │   ├── Eden Space
│   │   └── Survivor Spaces (S0, S1)
│   ├── Old Generation
│   └── String Pool (interned strings)
├── Metaspace                  (native memory, -XX:MaxMetaspaceSize)
│   ├── Class metadata
│   ├── Method bytecode
│   └── Constant pool
├── Code Cache                 (JIT-compiled native code, -XX:ReservedCodeCacheSize)
├── Direct ByteBuffers         (off-heap, NIO, -XX:MaxDirectMemorySize)
└── Native Memory              (JNI, thread stacks, GC internal structures)
```

### Escape Analysis: When Objects Skip the Heap

While the general rule is "objects go to the heap," modern JVMs (using the C2 JIT compiler) employ a technique called **Escape Analysis**. If the compiler determines that an object created inside a method never "escapes" that method (i.e., it is never returned, passed to another thread, or assigned to a global variable), the JVM may optimize it in three ways:

#### 1. Scalar Replacement (Stack Allocation)

The object is broken down into its primitive fields and allocated directly on the **stack**:

```java
// The JIT compiler might optimize this...
public double calculateDistance(double x1, double y1, double x2, double y2) {
    Point p1 = new Point(x1, y1);  // Point object never leaves this method
    Point p2 = new Point(x2, y2);  // Point object never leaves this method
    return p1.distanceTo(p2);
}

// ...into something like this (no heap allocation!)
public double calculateDistance(double x1, double y1, double x2, double y2) {
    // "Point" is dissolved — fields stored directly on stack
    double p1_x = x1, p1_y = y1;
    double p2_x = x2, p2_y = y2;
    return Math.sqrt(Math.pow(p2_x - p1_x, 2) + Math.pow(p2_y - p1_y, 2));
}
```

#### 2. Lock Elimination

If the object doesn't escape, synchronization on it is pointless — the JIT removes it:

```java
public void process() {
    // StringBuffer is synchronized, but it doesn't escape this method
    StringBuffer sb = new StringBuffer();
    sb.append("hello");
    sb.append(" world");
    // JIT eliminates all synchronization overhead
}
```

#### 3. Lock Coarsening

Multiple consecutive lock/unlock operations on the same object are merged into one:

```java
// Before coarsening: lock → unlock → lock → unlock → lock → unlock
sb.append("a"); sb.append("b"); sb.append("c");

// After coarsening: lock → append, append, append → unlock
```

**Important:** Escape analysis is a JIT optimization — it only kicks in after the method has been called enough times to be compiled (typically ~10,000 invocations). Cold code paths still allocate on the heap.

### Garbage Collectors and Heap Strategy

Different GC algorithms optimize for different scenarios:

| GC | Heap Strategy | Best For | Pause Characteristics |
|---|---|---|---|
| **G1GC** (default since Java 9) | Region-based, divides heap into ~2,048 regions | General purpose, balanced latency/throughput | Predictable pauses (~200ms target) |
| **ZGC** (Java 15+) | Colored pointers, concurrent compaction | Ultra-low latency, very large heaps (TB-scale) | Sub-millisecond pauses |
| **Shenandoah** | Brooks forwarding pointers | Low latency, Red Hat ecosystems | Sub-10ms pauses |
| **Serial GC** | Simple stop-the-world, single-threaded | Small heaps, containerized microservices | Long pauses but low overhead |
| **Parallel GC** | Multi-threaded stop-the-world | Maximum throughput, batch processing | Longer pauses, higher throughput |

### Memory Sizing for Production

| Application Type | Typical Heap | Typical Stack | Why |
|---|---|---|---|
| Microservice (REST API) | 256MB–1GB | 256KB–512KB | Small, stateless, many instances |
| Monolith (Spring Boot) | 2GB–8GB | 512KB–1MB | Large object graphs, caching |
| Batch processing | 4GB–32GB | 256KB–512KB | Large datasets in memory |
| High-throughput (Kafka consumer) | 1GB–4GB | 256KB | Minimize GC pauses |
| Data-intensive (Spark driver) | 8GB–64GB | 1MB | Large shuffles, aggregations |

---

## ⚖️ Trade-offs & Common Misconceptions

### Misconception 1: "Objects are always on the heap"

**Not always.** Escape analysis + scalar replacement can put short-lived objects on the stack. But don't rely on this — it's a JIT optimization, not a guarantee.

### Misconception 2: "Stack is always faster"

**Usually true, but nuanced.** Stack allocation is O(1) (just move a pointer), while heap allocation involves finding free space and eventual GC. However, for large data structures, the stack is the wrong choice anyway — it's limited to ~512KB–1MB per thread.

### Misconception 3: "Increasing heap size always helps"

**Not true.** A larger heap means the GC has more work to scan. An application with a 32GB heap and G1GC might have longer pause times than the same app with a 4GB heap. The solution is often to **reduce allocation rate**, not increase heap size.

### Misconception 4: "Primitives always live on the stack"

**Only local primitives.** Instance fields that are primitives (e.g., `private int count` in a class) live on the **heap** inside their parent object. Array elements of primitive type also live on the heap.

### When Stack Thinking Matters vs When It Doesn't

| Matters | Doesn't Matter |
|---|---|
| Hot loops processing millions of items | Occasional method calls during request handling |
| Low-latency systems (trading, gaming) | CRUD web applications |
| Memory-constrained environments (containers with 256MB) | Applications with generous memory |
| Deep recursive algorithms | Typical business logic (5-10 call depth) |

---

## 🧪 Diagnosing Memory Issues

### Tools for Stack Analysis

```bash
# Thread dump — shows all thread stacks
jstack <pid>

# Or trigger from within the app
kill -3 <pid>

# JVM flag to print stack trace on StackOverflowError
-XX:+ShowMessageBoxOnError
```

### Tools for Heap Analysis

```bash
# Heap dump — snapshot of all objects on the heap
jmap -dump:format=b,file=heap.hprof <pid>

# Or trigger automatically on OOM
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/

# Monitor heap usage in real-time
jstat -gcutil <pid> 1000  # prints GC stats every 1 second

# Visual tools
jvisualvm                 # built-in JDK tool
# Eclipse MAT             # best for analyzing heap dumps
# async-profiler          # low-overhead CPU + allocation profiling
```

### Key Metrics to Monitor in Production

| Metric | What It Tells You | Alarm Threshold |
|---|---|---|
| **Heap used after GC** | Memory that survives garbage collection (potential leak) | Steadily increasing over hours |
| **GC pause time** | How long your app freezes during GC | > 200ms for latency-sensitive apps |
| **GC frequency** | How often GC runs | Minor GC > 10/sec indicates high allocation rate |
| **Thread count** | Number of active threads (each consuming stack) | Unexpectedly high (> 1000 for typical apps) |
| **Metaspace used** | Class metadata size | Steadily increasing (classloader leak) |

### Reading a Heap Dump (Quick Guide)

When you open a heap dump in Eclipse MAT or VisualVM:

1. **Dominator tree** — shows which objects retain the most memory
2. **Histogram** — counts of each object type (look for unexpected millions of instances)
3. **Leak suspects** — automated analysis of likely memory leaks
4. **GC roots** — trace why an object isn't being collected (who's holding the reference?)

```
Example leak scenario:
GC Root → static field EventTracker.events
  → HashMap (1.2GB)
    → 500,000 entries
      → each entry holds List<Event> with 100+ events
        → Total retained: 1.2GB of events that should have been evicted
```

---

## Stack vs Heap Summary

| Aspect            | Stack Memory                               | Heap Memory                                   |
| ----------------- | ------------------------------------------ | --------------------------------------------- |
| **Ownership**     | Per thread                                 | Shared by all threads                         |
| **Lifetime**      | Method scope (destroyed when method ends)  | Until unreachable + Garbage Collected         |
| **Stores**        | Frames, local primitives, local references | Objects, arrays, instance fields, String Pool |
| **Thread Safety** | Inherently thread-safe                     | Requires manual synchronization               |
| **Performance**   | Extremely fast (push/pop)                  | Slower allocation, subject to GC pauses       |
| **Typical Error** | `StackOverflowError`                       | `OutOfMemoryError`                            |
| **JVM Flags**     | `-Xss`                                     | `-Xms`, `-Xmx`                                |

---

## 🔗 Relationship to Other Java Concepts

| Concept | How It Relates to Stack/Heap |
|---|---|
| **Garbage Collection** | Only the heap is garbage collected; stack memory is reclaimed automatically on method return |
| **Thread Safety** | Stack variables are inherently thread-safe; heap objects require `synchronized`, `volatile`, or concurrent collections |
| **Virtual Threads** | Virtual threads use tiny stacks stored on the heap (as continuations), dramatically reducing thread memory overhead |
| **Generics & Type Erasure** | Generic types are erased at runtime — `List<String>` and `List<Integer>` share the same class on the heap |
| **Records (Java 16+)** | Records are still objects on the heap, but their immutability helps escape analysis optimize better |
| **Value Types (Valhalla)** | Future Java feature — will allow user-defined types to be stored inline (on stack or embedded in objects) like primitives |

---

## Interview Questions

### Q: Where does a local `int` live vs an instance `int`?
**A:** A local `int` lives on the **stack** inside the current method frame. An instance `int` (field in a class) lives on the **heap** inside its parent object. The difference is scope: local variables are tied to method execution, instance variables are tied to object lifetime.

### Q: Can an object ever live on the stack?
**A:** Yes, through **Escape Analysis + Scalar Replacement**. If the JIT compiler determines an object never escapes the method (not returned, not stored in a field, not passed to another thread), it may dissolve the object into its primitive fields and allocate them on the stack. This is a JIT optimization, not something you can force.

### Q: What's the difference between `StackOverflowError` and `OutOfMemoryError`?
**A:** `StackOverflowError` means a single thread's stack ran out of space (usually from deep/infinite recursion). `OutOfMemoryError` means the shared heap (or metaspace) is full and the GC can't reclaim enough memory. Stack issues affect one thread; heap issues affect the entire JVM.

### Q: Why does increasing heap size sometimes make things worse?
**A:** A larger heap means the GC has more memory to scan during major collections, potentially causing **longer pause times**. The better fix is often reducing allocation rate (fewer temporary objects), choosing a low-pause GC (ZGC/Shenandoah), or right-sizing the heap for your actual working set.

### Q: How would you diagnose a memory leak in production?
**A:** Enable `-XX:+HeapDumpOnOutOfMemoryError`, then analyze the heap dump with Eclipse MAT. Look at the **dominator tree** to find which objects retain the most memory, trace GC roots to find why they're not collected. Common culprits: static collections, unclosed resources, listener/callback registrations that are never removed.

### Q: How do Virtual Threads change the stack/heap relationship?
**A:** Virtual threads store their stack frames as **continuations on the heap** instead of using a dedicated OS thread stack. This means virtual thread stacks grow and shrink dynamically (starting at ~1KB instead of ~1MB) and are garbage-collectible. The trade-off: heap pressure increases but thread count is no longer limited by stack memory.

### Q: When would you increase `-Xss` (stack size)?
**A:** When you have legitimately deep call chains — e.g., recursive algorithms, deeply nested framework interceptor/filter chains, or heavy use of AOP proxies. Typical range: 256KB–1MB. Increasing `-Xss` means each thread uses more memory, so balance it against your thread count.

### Q: What is the String Pool and why does it matter?
**A:** The String Pool is a deduplicated storage area in the heap for String literals. `"hello"` and `"hello"` share the same object in the pool, saving memory. `new String("hello")` creates a **separate** object on the heap. Use `String.intern()` to add a runtime string to the pool, but be cautious — an oversized string pool causes GC issues.

### Q: How do you choose between G1GC, ZGC, and Shenandoah?
**A:** **G1GC** (default): good for most applications with 2–16GB heaps. **ZGC**: ultra-low latency needs, very large heaps (tens of GB to TB), max pause &lt;1ms. **Shenandoah**: similar to ZGC, available in Red Hat builds. For batch processing where throughput matters more than latency, **Parallel GC** may still be best.