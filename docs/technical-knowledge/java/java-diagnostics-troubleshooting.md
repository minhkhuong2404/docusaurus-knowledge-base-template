---
id: java-diagnostics-troubleshooting
title: "JVM Diagnostics & Troubleshooting in Production"
slug: java-diagnostics-troubleshooting
description: A practical guide to JVM monitoring and diagnostics tools (jcmd, jstack, jmap, jstat) and troubleshooting CPU spikes, deadlocks, and memory leaks.
tags: [java, jvm, troubleshooting, diagnostics, ops]
---

# JVM Diagnostics & Troubleshooting in Production

When backend systems suffer from performance issues in production (e.g., memory leaks, high CPU usage, or stuck threads), developers must know how to inspect the running JVM.

---

## 1. Core JVM Command-Line Tools

The JDK includes several utilities for querying and analyzing running Java processes.

| Tool | Purpose | Key Commands |
| :--- | :--- | :--- |
| **`jcmd`** | Universal command tool (recommended) | `jcmd <pid> VM.uptime`, `jcmd <pid> Thread.print` |
| **`jstack`** | Prints thread stack traces | `jstack -l <pid>` |
| **`jmap`** | Generates heap dumps and statistics | `jmap -dump:live,format=b,file=heap.hprof <pid>` |
| **`jstat`** | Monitors garbage collection and compilation | `jstat -gcutil <pid> 1000` |
| **`jinfo`** | Views/modifies JVM system properties and flags | `jinfo -flags <pid>` |

---

## 2. Troubleshooting Thread Contention & Deadlocks

When system performance slows down, threads are often waiting on locks or external resources.

### Identifying Deadlocks with `jstack`
A deadlock happens when Thread 1 holds Lock A and waits for Lock B, while Thread 2 holds Lock B and waits for Lock A.

1. Find the Java process ID (PID):
   ```bash
   jps -l
   # or
   jcmd
   ```
2. Print the thread dump:
   ```bash
   jstack <pid> > thread_dump.txt
   ```
3. Search `thread_dump.txt` for `"Found one Java-level deadlock:"`. The JVM automatically identifies deadlocks and prints the exact locks and threads involved:
   ```text
   Found one Java-level deadlock:
   =============================
   "Thread-1":
     waiting to lock monitor 0x00007f (object 0x00a1, a java.lang.Object),
     which is held by "Thread-2"
   "Thread-2":
     waiting to lock monitor 0x00007e (object 0x00a2, a java.lang.Object),
     which is held by "Thread-1"
   ```

### Troubleshooting CPU Spikes
If a JVM container exhibits 100% CPU usage:
1. Find which thread ID (TID) is consuming the CPU using `top -H -p <pid>`. Note down the TID in decimal (e.g., `12345`).
2. Convert the decimal TID to hexadecimal: `12345` $\rightarrow$ `0x3039`.
3. Capture a thread dump: `jstack <pid> > threads.txt`.
4. Look for the `nid` (native thread ID) matching `0x3039` in the thread dump. This points you directly to the offending line of code:
   ```text
   "Pool-worker-1" #23 prio=5 os_prio=0 cpu=45.2% ... nid=0x3039 runnable [0x00007f...]
      java.lang.Thread.State: RUNNABLE
      at com.example.service.HeavyTask.loopForever(HeavyTask.java:42)
   ```

---

## 3. Troubleshooting Memory Leaks & OutOfMemoryError (OOM)

If heap usage continues to grow without dropping after garbage collection, the application has a memory leak.

### 1. Real-time GC Tracking with `jstat`
Run `jstat` to check if memory is reclaimed after Full GC (FGC):
```bash
jstat -gcutil <pid> 1000
```
- Look at the `O` (Old gen percentage) and `M` (Metaspace percentage).
- If `O` stays close to `100%` after consecutive `FGC` counts increment, memory is leaked.

### 2. Capture a Heap Dump
If an OOM occurs, you want a heap dump. Enable automatic dumps in your JVM arguments:
```bash
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/logs/heap.hprof
```
To trigger a heap dump manually on a running process:
```bash
jcmd <pid> GC.heap_dump /var/logs/manual_heap.hprof
# or
jmap -dump:live,format=b,file=/var/logs/manual_heap.hprof <pid>
```
> **Note:** Capture dumps during low-traffic periods if possible, as writing gigabytes of heap data freezes the JVM during the write.

### 3. Analyze Dumps using Eclipse MAT (Memory Analyzer Tool)
Open the `.hprof` file in MAT:
- **Leak Suspects Report:** MAT automatically group instances and identifies dominant memory consumers.
- **Dominator Tree:** Lists objects sorted by their retained size (how much memory is freed if the object is garbage collected).
- **Paths to GC Roots:** Right-click on a leaking object $\rightarrow$ `Path To GC Roots` $\rightarrow$ `exclude all phantom/weak/soft references`. This shows which strong reference keeps the object in memory.

---

## 4. Off-Heap Memory Leak Troubleshooting

Sometimes, memory leaks happen outside the heap, causing the container process to get killed by the OS (OOM Killer) even though heap usage is low.

### Diagnostic Steps
1. **Enable Native Memory Tracking (NMT):** Start your JVM with NMT enabled:
   ```bash
   -XX:NativeMemoryTracking=detail
   ```
2. **Establish Baseline:**
   ```bash
   jcmd <pid> VM.native_memory baseline
   ```
3. **Check Differences:** After the leak grows, print the NMT diff:
   ```bash
   jcmd <pid> VM.native_memory detail.diff
   ```
4. **Interpret Output:** Look for growth in the **Internal** or **Symbol** sections. Large allocations here are typically:
   - Direct ByteBuffers (`ByteBuffer.allocateDirect()`) from netty or file transfers.
   - Unreleased class loaders creating class definition leaks.
