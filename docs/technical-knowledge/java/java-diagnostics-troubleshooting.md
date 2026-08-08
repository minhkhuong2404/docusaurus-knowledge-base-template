---
id: java-diagnostics-troubleshooting
title: "JVM Diagnostics & Troubleshooting in Production"
slug: java-diagnostics-troubleshooting
description: A practical guide to JVM monitoring and diagnostics — jcmd, jstack, jmap, jstat, JFR, async-profiler, heap dump analysis, GC tuning, off-heap leaks, and a field-tested runbook for CPU spikes, deadlocks, and OOM errors.
tags: [java, jvm, troubleshooting, diagnostics, heap-dump, gc, profiling, ops]
---

# JVM Diagnostics & Troubleshooting in Production

When backend systems degrade in production — CPU pinned at 100%, heap growing without bound, threads frozen, containers killed by the OS — you need a systematic diagnostic process, not trial-and-error restarts. This guide covers every layer: thread contention, CPU spikes, heap leaks, off-heap leaks, GC pathology, and continuous profiling with JFR and async-profiler.

---

## 1. Core JVM Command-Line Tools

The JDK ships a suite of diagnostic utilities. `jcmd` is the modern umbrella tool that subsumes most of the others — prefer it when available.

| Tool | Purpose | Key Commands |
| :--- | :--- | :--- |
| **`jcmd`** | Universal command tool (recommended over individual tools) | `jcmd <pid> help` to list all commands |
| **`jstack`** | Prints thread stack traces (use `jcmd Thread.print` instead) | `jstack -l <pid>` |
| **`jmap`** | Generates heap dumps and class histograms | `jmap -dump:live,format=b,file=heap.hprof <pid>` |
| **`jstat`** | Real-time GC and compilation statistics | `jstat -gcutil <pid> 1000` |
| **`jinfo`** | Views/modifies JVM flags at runtime | `jinfo -flags <pid>` |
| **`jps`** | Lists running JVM processes | `jps -lv` |
| **`jhsdb`** | Post-mortem debugger for core dumps (JDK 9+) | `jhsdb jstack --core core.dump` |

### Quick PID Lookup

```bash
# List all JVM processes with their main class and arguments
jps -lv

# Or with system tool
ps aux | grep java

# jcmd with no args lists all JVMs visible to the current user
jcmd
```

### `jcmd` Command Reference

```bash
# JVM summary — uptime, flags, system properties
jcmd <pid> VM.uptime
jcmd <pid> VM.flags
jcmd <pid> VM.system_properties

# Thread dump (equivalent to jstack)
jcmd <pid> Thread.print

# Class histogram — top objects by count and size
jcmd <pid> GC.class_histogram

# Heap dump
jcmd <pid> GC.heap_dump /var/logs/heap.hprof

# Run a GC cycle
jcmd <pid> GC.run

# JFR recording
jcmd <pid> JFR.start name=profile duration=60s filename=/tmp/profile.jfr
jcmd <pid> JFR.stop name=profile
```

---

## 2. Troubleshooting CPU Spikes

A JVM process consuming near-100% CPU typically has one of three causes: an infinite loop or a hot code path (most common), a GC storm (the JVM spending more time collecting than running application code), or excessive thread contention with spin-waiting.

### Runbook: Identify the Offending Thread

```
STEP 1  Find which OS thread is consuming CPU
STEP 2  Convert its decimal TID to hex
STEP 3  Capture a thread dump
STEP 4  Match nid in the dump to find the stack trace
STEP 5  Identify the code, determine root cause
```

#### Step 1 — Find the hot thread

```bash
# -H shows per-thread CPU; -p filters to your JVM's PID
top -H -p <pid>

# Note the TID (thread ID) of the thread with highest CPU — e.g., TID 18742
```

#### Step 2 — Convert TID to hex

```bash
# In bash
printf '%x\n' 18742
# Output: 0x4936
```

#### Step 3 — Capture a thread dump

```bash
jcmd <pid> Thread.print > /tmp/threads.txt
# Or legacy:
jstack -l <pid> > /tmp/threads.txt
```

#### Step 4 — Match the `nid` in the dump

```bash
grep -A 20 "nid=0x4936" /tmp/threads.txt
```

#### Step 5 — Read the stack trace

```text
"pool-worker-7" #47 daemon prio=5 os_prio=0 cpu=98.7% elapsed=142.3s
   tid=0x00007f3c8c001000 nid=0x4936 runnable [0x00007f3c7e9fe000]
   java.lang.Thread.State: RUNNABLE
        at com.example.OrderService.computePrice(OrderService.java:312)
        at com.example.OrderService.processOrder(OrderService.java:201)
        at com.example.worker.OrderWorker.run(OrderWorker.java:58)
```

> **Line 312 of `OrderService` is your target.** The most common causes: an infinite loop with a missing termination condition, a regex with catastrophic backtracking, or a hash collision creating an O(n) linked-list traversal inside a `HashMap` (relevant for pre-JDK 8 or non-`String` key types).

### CPU Spike: GC Storm vs. Hot Code

If `top -H` shows *multiple* JVM threads all at high CPU simultaneously — rather than one thread at 100% — the culprit is usually GC, not application code.

```bash
# Check GC activity — output refreshes every second
jstat -gcutil <pid> 1000

# Sample output:
#  S0     S1     E      O      M     YGC   YGCT    FGC   FGCT     GCT
#   0.0   82.3   97.4   98.1  95.6   312   18.432   47   89.114  107.546

# FGC=47 in a short window and FGCT >> YGCT means Full GC is dominating
```

If `FGC` is incrementing rapidly and `O` (Old gen) stays near 100% after each cycle, you have a heap exhaustion problem — the JVM is spending more time in Full GC than running your application. This is the GC death spiral and requires heap analysis (see Section 3).

### CPU Spike: Excessive Lock Spinning

If the hot thread shows `java.lang.Thread.State: BLOCKED` or the stack trace contains `sun.misc.Unsafe.park`:

```text
"worker-12" nid=0x4937 waiting on condition [0x...]
   java.lang.Thread.State: WAITING (parking)
        at sun.misc.Unsafe.park(Native Method)
        at java.util.concurrent.locks.LockSupport.park(LockSupport.java:175)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(...)
```

This means threads are contended on a lock — CPU usage per thread won't be extreme, but aggregate CPU is high due to context switching. Check the thread dump for lock ownership chains (see Section 3).

---

## 3. Troubleshooting Thread Contention & Deadlocks

### Understanding Thread States in a Dump

```text
Thread State   Meaning
─────────────────────────────────────────────────────────────
RUNNABLE       Executing on CPU, or ready to execute (includes syscalls)
BLOCKED        Waiting to acquire a monitor (synchronized block)
WAITING        Parked indefinitely — waiting for notify/signal
TIMED_WAITING  Parked with a timeout — sleep(), wait(timeout), join(timeout)
TERMINATED     Thread has exited
```

A thread dump is a **snapshot** — one dump is rarely enough. Take 3–5 dumps at 5-second intervals to distinguish:
- **Consistently BLOCKED**: real contention or deadlock
- **Momentarily BLOCKED**: normal, transient lock handoff
- **RUNNABLE at same stack frame across all dumps**: genuine CPU-burning hot path

### Deadlock Detection with `jstack`

A deadlock occurs when Thread A holds Lock X and waits for Lock Y, while Thread B holds Lock Y and waits for Lock X — a circular wait with no way to break without external intervention.

```bash
jcmd <pid> Thread.print > thread_dump.txt
grep -A 50 "Found one Java-level deadlock" thread_dump.txt
```

`jstack` automatically detects `synchronized`-based deadlocks and prints them clearly:

```text
Found one Java-level deadlock:
=============================
"Thread-2":
  waiting to lock monitor 0x00007f8b6c003a28 (object 0x000000076b8a3e10, a java.lang.Object),
  which is held by "Thread-1"

"Thread-1":
  waiting to lock monitor 0x00007f8b6c001b08 (object 0x000000076b8a3e28, a java.lang.Object),
  which is held by "Thread-2"

Java stack information for the threads listed above:
===================================================
"Thread-2":
  at com.example.TransferService.withdraw(TransferService.java:54)
  - waiting to lock <0x000000076b8a3e10> (a java.lang.Object)
  - locked <0x000000076b8a3e28> (a java.lang.Object)
  at com.example.TransferService.transfer(TransferService.java:31)

"Thread-1":
  at com.example.TransferService.deposit(TransferService.java:67)
  - waiting to lock <0x000000076b8a3e28> (a java.lang.Object)
  - locked <0x000000076b8a3e10> (a java.lang.Object)
  at com.example.TransferService.transfer(TransferService.java:29)
```

:::warning[`jstack` only detects `synchronized` deadlocks automatically]
Deadlocks on `ReentrantLock` are NOT automatically detected and printed in the "Found deadlock" section. You must manually trace the `- locked` and `- waiting to lock` lines throughout the full dump to reconstruct the wait-for graph.
:::

#### Manually Tracing a ReentrantLock Deadlock

```bash
# Search for all locked and waiting entries in the dump
grep -E "(locked|waiting to lock|parking to wait)" thread_dump.txt
```

Look for patterns where Thread A's "waiting" address matches Thread B's "locked" address, and vice versa:

```text
"Thread-1":
  at ...
  - parking to wait for <0x000000076b8a4000>    ← Thread-1 waiting FOR this address
  - locked <0x000000076b8a3e10>                  ← Thread-1 HOLDS this address

"Thread-2":
  at ...
  - parking to wait for <0x000000076b8a3e10>    ← Thread-2 waiting for what Thread-1 holds
  - locked <0x000000076b8a4000>                  ← Thread-2 holds what Thread-1 wants
```

This is a deadlock — reconstruct it manually as a wait-for graph when the JVM doesn't surface it automatically.

### High Thread Count / Thread Leaks

```bash
# Count total threads
jcmd <pid> Thread.print | grep -c "java.lang.Thread.State"

# Count by state
jcmd <pid> Thread.print | grep "java.lang.Thread.State" | sort | uniq -c | sort -rn

# Sample output:
#  523 WAITING
#  104 TIMED_WAITING
#   18 RUNNABLE
#    2 BLOCKED
```

A high WAITING count typically indicates a thread pool whose queue is draining, or threads blocked on I/O. A thread count that grows continuously over hours is a **thread leak** — threads are being created but never terminated. Common causes: `ExecutorService` instances created inside request handlers without being shared, or `Thread.start()` calls inside loops.

---

## 4. Troubleshooting Memory Leaks & OutOfMemoryError

Memory leaks in Java happen when the application holds strong references to objects it no longer needs, preventing GC from reclaiming them. The heap grows continuously, GC takes longer and longer, and eventually the JVM throws `OutOfMemoryError`.

### Understanding What OOM Message Tells You

```text
OutOfMemoryError: Java heap space
  → Classic heap exhaustion. Objects are being allocated faster than GC can reclaim.
    Could be a genuine leak, or simply undersized heap (-Xmx too low).

OutOfMemoryError: GC overhead limit exceeded
  → JVM spent >98% of CPU time in GC but recovered `<2%` of heap in the last 5 attempts.
    The JVM is choosing to fail fast rather than continue thrashing. Nearly always a leak.

OutOfMemoryError: Metaspace
  → Class metadata space is exhausted. Usually: dynamic class generation (cglib proxies,
    Groovy/Kotlin compilation at runtime), or a classloader leak (see Section 5).

OutOfMemoryError: Unable to create new native thread
  → OS-level thread limit hit. Too many threads — see thread leak troubleshooting above.
    On Linux, check /proc/sys/kernel/threads-max and ulimit -u.

OutOfMemoryError: Direct buffer memory
  → Off-heap ByteBuffer pool exhausted. See Section 5.
```

### Step 1 — Real-time GC Monitoring with `jstat`

```bash
jstat -gcutil <pid> 1000 20
# Samples every 1000ms, 20 times

# Output columns:
# S0    S1    E      O      M     CCS   YGC   YGCT    FGC  FGCT     GCT
#  0.0  45.2  71.3   89.4  92.1  88.3   241  12.431   18  43.218  55.649
```

| Column | Meaning | Red Flag |
|:---|:---|:---|
| `E` | Eden space % full | Rapid oscillation is normal |
| `O` | Old gen % full | Stays >90% after FGC = leak |
| `M` | Metaspace % full | Grows unboundedly = classloader leak |
| `YGC` / `FGC` | Young / Full GC count | FGC incrementing frequently = heap pressure |
| `FGCT` | Total time in Full GC | If FGCT ≈ GCT, app is GC-storming |

If `O` (Old gen) is at 95%+ and the FGC count keeps incrementing without `O` dropping, your application has a classic heap leak.

### Step 2 — Quick Class Histogram (Without a Full Heap Dump)

Before capturing a full heap dump (which stops the JVM), get a fast class histogram to identify the dominant object types:

```bash
jcmd <pid> GC.class_histogram | head -30

# Or with jmap (also causes a brief pause):
jmap -histo:live <pid> | head -30

# Output:
#  num     #instances         #bytes  class name
#  ---    -----------     ----------  ----------
#    1:       8432194     2021326560  byte[]
#    2:       8432170     1010360400  java.lang.String
#    3:       2134556      512293440  com.example.model.SessionData
#    4:         91204       43297728  java.util.HashMap$Node
```

`SessionData` at 2M instances when you have 10K active users is a signal — something is accumulating `SessionData` objects and not releasing them. This is the class to investigate in MAT.

### Step 3 — Capture a Heap Dump

#### Automatic dump on OOM (add to JVM startup args):

```bash
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/logs/heap_dump.hprof
```

#### Manual dump on a live process:

```bash
# Preferred — via jcmd (triggers GC to remove dead objects first if using GC.heap_dump)
jcmd <pid> GC.heap_dump /var/logs/heap.hprof

# Via jmap — the `live` flag triggers a Full GC before dumping, giving a clean view
jmap -dump:live,format=b,file=/var/logs/heap.hprof <pid>
```

:::warning[Heap Dump Performance Impact]
Writing a heap dump **stops the JVM** (stop-the-world pause) for the entire duration of the write. A 4GB heap takes 15–60 seconds to write depending on disk I/O speed. On a live production service, this causes a full outage for that instance. Mitigations:
- Enable `HeapDumpOnOutOfMemoryError` and let the instance die — then analyze offline.
- Route traffic away from one instance before triggering a manual dump.
- Use JFR (Section 6) for lower-impact continuous profiling without full dumps.
:::

### Step 4 — Analyze with Eclipse MAT (Memory Analyzer Tool)

Open `.hprof` in [Eclipse MAT](https://eclipse.dev/mat/). For heap dumps larger than 8GB, increase MAT's own heap: edit `MemoryAnalyzer.ini` → `-Xmx16g`.

#### Leak Suspects Report

The starting point. MAT groups objects by their "accumulation point" — the single object that is keeping a large cluster of otherwise-unreachable objects alive.

```
File → Open Heap Dump → Run "Leak Suspects Report"

MAT output example:
  Problem Suspect 1:
  One instance of "com.example.cache.LocalCache" loaded by "jdk.internal.loader"
  occupies 1,847,293,440 (78.4%) bytes.
  The memory is accumulated in one instance of "java.util.HashMap"
  loaded by "jdk.internal.loader".
```

A single `LocalCache` holding 78% of your heap is your leak. It's holding onto a `HashMap` that is growing without bound.

#### Dominator Tree

Lists every object in the heap sorted by **retained heap** — the total bytes that would be freed if this object were garbage collected (itself plus everything it exclusively keeps alive). The dominator tree is the fastest way to identify the top memory consumers.

```
Dominator Tree (sorted by Retained Heap):
  Class                            Shallow Heap    Retained Heap
  LocalCache                            48 B       1,847,293,440 B  ← 78% of heap
  └── HashMap                          48 B       1,847,293,392 B
      └── HashMap$Node[]           16,777,232 B   1,847,293,344 B
          └── SessionData (×2.1M)  [multiple]       950,000,000 B
```

#### Path to GC Roots

Once you know *what* is leaking (e.g., `SessionData`), find *why* it isn't being collected — what strong reference chain is keeping it alive.

```
Right-click SessionData instance
  → Path to GC Roots
  → Exclude all phantom/weak/soft references

Result:
  SessionData  ← HashMap$Node  ← HashMap  ← LocalCache  ← static field "CACHE"
    in class com.example.cache.LocalCache

Root cause: a static HashMap that accumulates SessionData objects and is never evicted.
```

The path from a leaking object back to a GC root (a static field, a thread-local, an active thread's stack frame, or a JNI reference) is *exactly the reference that prevents collection*. That's the reference that needs to be broken — either by eviction (TTL, weak references), explicit removal, or bounded capacity.

#### OQL — Object Query Language

For programmatic investigation within MAT:

```sql
-- Find all SessionData objects with a specific userId field
SELECT * FROM com.example.model.SessionData s WHERE s.userId = "user-12345"

-- Find all char[] larger than 1MB (detecting large String accumulation)
SELECT * FROM char[] c WHERE c.@retainedHeapSize > 1048576

-- Count objects by class
SELECT c.@displayName, c.@numberOfObjects, c.@usedHeapSize
FROM OBJECTS (SELECT DISTINCT OBJECTS s.@clazz FROM com.example.model.SessionData s) c
```

---

## 5. Off-Heap Memory Leak Troubleshooting

Off-heap (native) memory leaks are more insidious than heap leaks — the JVM's GC cannot collect them, and the container process grows silently until the OS kills it with `SIGKILL` (the Linux OOM Killer), with no `OutOfMemoryError` in your logs to guide you.

**Typical off-heap consumers:**
- **Direct ByteBuffers** (`ByteBuffer.allocateDirect()`) — used by Netty, NIO, Kafka clients, and file transfer code.
- **Memory-mapped files** (`MappedByteBuffer`) — used by memory-mapped I/O, RocksDB, Chronicle Map.
- **Metaspace / class metadata** — unreleased classloaders (common in hot-reload frameworks, OSGi, and heavily proxy-based Spring apps).
- **JNI native libraries** — any native code allocating memory without a corresponding free.
- **Thread stacks** — each thread reserves `~512KB–1MB` of native stack (`-Xss`); thread leaks cause native memory growth.
- **Code cache** — JIT-compiled native code. Can grow large under sustained load with tiered compilation enabled.

For a structural diagram of all JVM memory regions, see the [JVM Memory Layout Guide](./java-jvm.md#2-on-heap-vs-off-heap-memory-layout).

### Step 1 — Enable Native Memory Tracking (NMT)

NMT must be enabled at JVM startup — it cannot be enabled on a running process:

```bash
-XX:NativeMemoryTracking=detail
```

:::warning[NMT Performance Cost]
`summary` mode adds ~5–10% CPU overhead. `detail` mode adds ~10–20%. Use `summary` in long-running production profiling and `detail` only during active investigation.
:::

### Step 2 — Establish Baseline

Immediately after the process starts (before the leak can accumulate):

```bash
jcmd <pid> VM.native_memory baseline
```

### Step 3 — Capture Diff After Leak Grows

Let the process run under load for minutes to hours until native memory has visibly grown, then:

```bash
jcmd <pid> VM.native_memory detail.diff

# Sample output:
# Total: reserved=8523456KB +3241856KB, committed=4231124KB +2987344KB
#
# -                 Java Heap (reserved=4096000KB, committed=3072000KB)
#                             (mmap: reserved=4096000KB, committed=3072000KB)
#
# -                    Thread (reserved=612352KB +204800KB, committed=612352KB +204800KB)
#                             (thread #598 +200)           ← 200 new threads!
#
# -                  Internal (reserved=2145280KB +2145280KB, committed=2145280KB +2145280KB)
#                             (malloc=2145280KB #34521 +34521)  ← Direct ByteBuffer growth
```

### Step 4 — Interpret the Diff

| NMT Region | Common cause of growth |
|:---|:---|
| **Thread** | Thread leak — count growing, each costing ~1MB native stack |
| **Internal** | Direct `ByteBuffer` allocation or JNI malloc without free |
| **Class** | Classloader leak — Metaspace growing from dynamic class generation |
| **Code** | JIT code cache growth — usually self-limiting, rarely a true leak |
| **GC** | GC internal bookkeeping — grows proportionally with heap size |

### Direct ByteBuffer Leak — Deep Dive

Direct ByteBuffers are allocated off-heap and freed either when the `DirectByteBuffer` Java object is GC'd (which triggers a `Cleaner` thread) or when `sun.misc.Cleaner.clean()` is called explicitly. The leak happens when:

1. **Direct ByteBuffers are created faster than GC reclaims their Java wrappers** — the off-heap memory is freed, but only when the Java heap object dies. If you're creating millions of tiny `ByteBuffer.allocateDirect()` calls but the Java objects are young-gen promoted to old-gen and rarely GC'd, off-heap accumulates.
2. **Held by a `ThreadLocal`** — Netty's `PooledByteBufAllocator` pools buffers per-thread. Threads that die without clearing their thread-local pools leak the underlying direct memory.

```bash
# Check current direct buffer usage via JMX / MBeans
jcmd <pid> ManagementAgent.start_local
# Then use jconsole or VisualVM → MBeans → java.nio → BufferPool → direct
# Key metrics: Count, MemoryUsed, TotalCapacity

# Or programmatically:
BufferPoolMXBean directPool = ManagementFactory
    .getPlatformMXBeans(BufferPoolMXBean.class)
    .stream()
    .filter(b -> b.getName().equals("direct"))
    .findFirst().orElseThrow();

System.out.printf("Direct buffers: count=%d, used=%dMB%n",
    directPool.getCount(),
    directPool.getMemoryUsed() / (1024 * 1024));
```

### Classloader Leak — Deep Dive

Classloader leaks are common in application servers, OSGi containers, and frameworks that hot-reload classes (e.g., JRebel, Spring DevTools). When a classloader is not GC'd, every class it loaded, and every static field in every class, is retained.

**Diagnosis via MAT**:
```
Heap Dump → OQL:

SELECT cl FROM java.lang.ClassLoader cl
  WHERE cl.@retainedHeapSize > 10485760

-- A classloader retaining >10MB is suspect
-- Drill into it: Path to GC Roots → what is keeping this classloader alive?
```

Common roots for stuck classloaders:
- A `ThreadLocal` in a thread that outlives the webapp (e.g., a container thread pool thread).
- A static field in a parent-classloader-loaded class holding a reference to a child-classloader-loaded object.
- An MBean registered in the platform `MBeanServer` without being unregistered on undeploy.

---

## 6. Continuous Profiling with JFR and async-profiler

For production profiling without the catastrophic overhead of a heap dump, use Java Flight Recorder (JFR) or async-profiler.

### Java Flight Recorder (JFR)

JFR is built into the JDK (JDK 11+ open source, JDK 8u272+ with commercial license). It records CPU, allocation, lock contention, GC, I/O, and more with typically **&lt;2% overhead**.

#### Start a JFR recording on a running process:

```bash
# Start recording (60 seconds, profile configuration)
jcmd <pid> JFR.start name=prod-profile duration=60s \
  settings=profile \
  filename=/tmp/app-profile.jfr

# Or dump a continuous recording that started at JVM startup
jcmd <pid> JFR.dump name=continuous filename=/tmp/snapshot.jfr

# Check status
jcmd <pid> JFR.check
```

#### Enable at JVM startup for continuous recording:

```bash
-XX:StartFlightRecording=name=continuous,settings=profile,maxsize=512m,maxage=1h
```

This maintains a rolling 1-hour, 512MB ring buffer of JFR data. When an incident occurs, dump it immediately:

```bash
jcmd <pid> JFR.dump filename=/tmp/incident.jfr
```

#### Analyze in JDK Mission Control (JMC):

Open `incident.jfr` in [JDK Mission Control](https://adoptium.net/jmc):

- **Automated Analysis**: JMC surfaces its top findings automatically (hot methods, lock contention, allocation pressure).
- **Method Profiling**: shows CPU flame graph by method — find hot methods without any agent overhead.
- **Allocation Profiling**: shows which code paths are allocating the most objects — critical for GC pressure.
- **Lock Instances**: shows which monitors/locks are most contended, with thread wait times.
- **GC View**: visualizes each GC pause — duration, cause, which generation was collected.

### async-profiler

[async-profiler](https://github.com/async-profiler/async-profiler) produces **flame graphs** for CPU, allocation, and wall-clock time using async-signal-safe sampling — avoiding the safepoint bias problem that plagues JVM-internal profilers (JFR samples only at safepoints, potentially missing hot native code).

```bash
# Download and attach to a running process for 30 seconds
./asprof -d 30 -f /tmp/flamegraph.html <pid>

# Allocation profiling (find what's creating GC pressure)
./asprof -e alloc -d 30 -f /tmp/alloc.html <pid>

# Wall-clock profiling (includes threads blocked on I/O — useful for latency)
./asprof -e wall -d 30 -f /tmp/wall.html <pid>

# Lock profiling (find most contended locks)
./asprof -e lock -d 30 -f /tmp/locks.html <pid>
```

Open the generated `.html` directly in a browser — it renders as an interactive flame graph.

#### Reading a Flame Graph

```
 ┌────────────────────────────────────────────────────────────┐
 │                    main()                                  │  ← bottom = bottom of call stack
 │      processOrder()     │    handleRequest()               │
 │   computePrice()  │ ...  │  serialize()  │  ...            │
 │  regex.match()           │  ObjectMapper.writeValue()      │  ← narrow = less time
 └────────────────────────────────────────────────────────────┘
   wider = more samples = more CPU time spent in this frame
   flat top = this frame itself is hot (not its callees)
   tall narrow spike = deep call chain, hot at a leaf
```

A **wide plateau at the top** of the flame means that function itself (not its children) is where CPU time is being spent — that's your optimization target.

---

## 7. GC Tuning Reference

Understanding why the JVM GC is under pressure is a prerequisite for tuning it.

### GC Log Analysis

Enable GC logging in production — it's extremely low overhead and invaluable for post-mortem analysis:

```bash
# JDK 9+ unified logging
-Xlog:gc*:file=/var/logs/gc.log:time,uptime,level,tags:filecount=10,filesize=50m

# JDK 8
-XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:/var/logs/gc.log
```

Use [GCEasy](https://gceasy.io) or [GCViewer](https://github.com/chewiebug/GCViewer) to visualize GC logs. Key metrics to look for:

| Metric | Healthy | Concerning |
|:---|:---|:---|
| Young GC frequency | Every 10–60s | Every &lt;1s |
| Young GC pause | &lt;50ms | >200ms |
| Full GC frequency | Rare (hours/days) | Every few minutes |
| Full GC pause | &lt;1s | >5s |
| Old gen % after Full GC | Drops to &lt;50% | Stays >80% (leak) |
| GC throughput | >99% | &lt;95% |

### Choosing a GC Algorithm

| GC | JDK | Pause behavior | Best for |
|:---|:---|:---|:---|
| **G1GC** | JDK 9+ default | Low-pause, soft pause targets | Most production workloads, heap 4–32GB |
| **ZGC** | JDK 15+ production | Sub-millisecond pauses | Latency-critical, large heaps (>32GB) |
| **Shenandoah** | JDK 12+ (RedHat) | Sub-millisecond pauses | Similar to ZGC, alternative low-pause |
| **ParallelGC** | Legacy default | Throughput-optimized, longer pauses | Batch jobs, throughput > latency |
| **SerialGC** | Always | Single-threaded | Containers with &lt;1 CPU, tiny heaps |

```bash
# Enable G1GC with a 200ms pause-time target
-XX:+UseG1GC -XX:MaxGCPauseMillis=200

# Enable ZGC
-XX:+UseZGC

# Enable Shenandoah
-XX:+UseShenandoahGC
```

### G1GC Tuning Quick Reference

```bash
# Core sizing
-Xms4g -Xmx4g                          # Set min=max to avoid heap resizing pauses
-XX:NewRatio=2                          # Old:Young ratio (default: old gen is 2x young)
-XX:MaxGCPauseMillis=200                # Soft pause target (G1 tries to honor this)

# Metaspace
-XX:MetaspaceSize=256m                  # Initial Metaspace — avoids early Full GC on startup
-XX:MaxMetaspaceSize=512m               # Cap Metaspace growth to detect leaks

# GC thread concurrency
-XX:ParallelGCThreads=8                 # STW GC threads (default: ~CPU count)
-XX:ConcGCThreads=4                     # Concurrent marking threads (default: ~1/4 ParallelGCThreads)

# Humongous object threshold (G1 specific)
# Objects > 50% of region size go straight to Old gen — avoid if possible
-XX:G1HeapRegionSize=16m                # Increase region size to raise humongous threshold
```

---

## 8. Production Incident Runbook

A systematic process to follow when a JVM instance is misbehaving in production.

### Decision Tree

```
JVM incident reported
│
├── Is the container being killed by the OS (no OutOfMemoryError in logs)?
│   └──► Native/Off-heap memory leak → Section 5 (NMT, direct buffer analysis)
│
├── OutOfMemoryError in logs?
│   ├── "Java heap space" / "GC overhead limit exceeded"
│   │   └──► Heap leak → Sections 3 & 4 (jstat, histogram, heap dump, MAT)
│   ├── "Metaspace"
│   │   └──► Classloader leak → Section 5 (MAT classloader OQL)
│   ├── "Unable to create new native thread"
│   │   └──► Thread leak → Section 3 (thread dump, count by state)
│   └── "Direct buffer memory"
│       └──► DirectByteBuffer leak → Section 5 (NMT diff, BufferPool MBean)
│
├── CPU at 100%?
│   ├── Single thread high?
│   │   └──► Hot code path → Section 2 (top -H, nid correlation, jstack)
│   ├── Many GC threads high?
│   │   └──► GC storm → Section 7 (jstat, GC logs, tune or increase heap)
│   └── Many worker threads blocked/spinning?
│       └──► Lock contention → Section 3 (thread dump analysis)
│
├── Latency high but CPU normal?
│   └──► Likely: I/O blocking, lock contention, or thread starvation
│       → async-profiler wall-clock mode (Section 6)
│
└── Need continuous profiling without production impact?
    └──► JFR continuous recording + JMC (Section 6)
```

### Quick Command Cheatsheet

```bash
# --- Process Discovery ---
jps -lv                                           # List JVM PIDs and args
jcmd                                              # List all visible JVM processes

# --- Thread Analysis ---
jcmd <pid> Thread.print > /tmp/threads.txt        # Full thread dump
grep -c "java.lang.Thread.State" /tmp/threads.txt # Total thread count
grep "java.lang.Thread.State" /tmp/threads.txt | sort | uniq -c   # By state
grep -A 50 "Found one Java-level deadlock" /tmp/threads.txt       # Deadlock summary

# --- CPU Spike ---
top -H -p <pid>                                   # Per-thread CPU
printf '%x\n' <decimal-tid>                       # Dec to hex for nid match
grep -A 20 "nid=0x<hex>" /tmp/threads.txt         # Find hot thread stack

# --- Memory / GC ---
jstat -gcutil <pid> 1000 20                       # GC stats, 20 samples
jcmd <pid> GC.class_histogram | head -40          # Top object types by count
jcmd <pid> GC.heap_dump /tmp/heap.hprof           # Heap dump (live process)

# --- Off-Heap / NMT ---
jcmd <pid> VM.native_memory baseline              # Set NMT baseline
jcmd <pid> VM.native_memory detail.diff           # Print growth since baseline

# --- JFR ---
jcmd <pid> JFR.start name=p duration=60s settings=profile filename=/tmp/p.jfr
jcmd <pid> JFR.dump filename=/tmp/snapshot.jfr    # Dump continuous recording

# --- async-profiler ---
./asprof -d 30 -f /tmp/cpu.html <pid>             # CPU flame graph
./asprof -e alloc -d 30 -f /tmp/alloc.html <pid>  # Allocation flame graph
./asprof -e wall -d 30 -f /tmp/wall.html <pid>    # Wall-clock (I/O + CPU)
```