---
id: virtual-memory-deep-dive
title: Virtual Memory Deep Dive
description: Address spaces, swap, OOM killer, huge pages, NUMA, and practical Linux memory tuning.
tags:
  - operating-systems
  - virtual-memory
  - swap
  - numa
  - huge-pages
  - linux
  - performance
sidebar_position: 7
---

# Virtual Memory — Deep Dive

## Virtual Address Space Layout (Linux x86-64)

```
0xFFFFFFFFFFFFFFFF ┌────────────────────────┐
                   │  Kernel Space (128TB)   │ ← Not accessible to user processes
0xFFFF800000000000 ├────────────────────────┤
                   │  (Non-canonical hole)   │
0x00007FFFFFFFFFFF ├────────────────────────┤
                   │  Stack                  │ ← grows down; ASLR randomized
                   │  (per thread)           │
                   ├────────────────────────┤
                   │  mmap region            │ ← shared libs, mmap, JVM code cache
                   │  (↓ grows downward)     │
                   ├────────────────────────┤
                   │  Heap                   │ ← malloc/new; brk() grows up
                   ├────────────────────────┤
                   │  BSS                    │ ← Uninitialized globals (zeroed)
                   ├────────────────────────┤
                   │  Data                   │ ← Initialized globals
                   ├────────────────────────┤
0x0000000000400000 │  Text (code)            │ ← Read-only, executable
0x0000000000000000 └────────────────────────┘
```

```bash
# View your process's memory map:
cat /proc/self/maps
pmap -x $$
```

---

## Address Space Layout Randomization (ASLR)

ASLR randomizes base addresses of stack, heap, and mmap regions on each execution, making exploit address prediction harder.

```bash
cat /proc/sys/kernel/randomize_va_space
# 0 = disabled, 1 = partial (stack/mmap), 2 = full (heap too)
```

---

## Swap Space

When physical RAM is full, the kernel moves **cold pages** to **swap** (disk).

```
Page eviction:
  Anonymous pages (heap, stack) → swap device
  File-backed pages (code, mmap) → evicted and re-read from file

Swap types:
  Swap partition: Raw disk partition
  Swap file:      Regular file (more flexible, similar performance)
  zswap:          Compressed in-RAM cache before swap disk write
  zram:           Compressed RAM block device used as swap (no disk I/O)
```

```bash
swapon --show          # Show active swap
free -h                # Memory + swap usage
vmstat 1               # si (swap in) / so (swap out) columns
```

### Swappiness

`/proc/sys/vm/swappiness` (0–100): How aggressively the kernel swaps.
- `swappiness=0`: Only swap when absolutely necessary.
- `swappiness=60`: Default. Balance.
- `swappiness=100`: Aggressively swap to free RAM for cache.

For latency-sensitive Java apps: `sysctl -w vm.swappiness=1`

---

## OOM Killer

When memory is critically low and can't swap, the kernel's **Out-Of-Memory (OOM) killer** selects and kills a process.

### Selection Process

Each process has an **OOM score** (0–1000):
```
/proc/PID/oom_score          # Current score (higher = more likely to be killed)
/proc/PID/oom_score_adj      # Adjust score (-1000 to +1000)
```

```bash
# Protect a critical process from OOM killer:
echo -1000 > /proc/$(pidof critical_service)/oom_score_adj

# Make a process more likely to be killed first:
echo 500 > /proc/$(pidof expendable)/oom_score_adj
```

### Checking OOM events

```bash
dmesg | grep -i "killed process"
journalctl -k | grep OOM
```

---

## Huge Pages

Default page size: **4KB**. Large memory allocations (like JVM heap) need millions of page table entries and TLB entries.

**Huge Pages**: 2MB (x86) or 1GB pages reduce TLB pressure significantly.

### Types

| Type | Description |
|---|---|
| Static Huge Pages | Pre-allocated at boot, reserved exclusively |
| Transparent Huge Pages (THP) | Kernel automatically promotes/demotes pages |

### THP (Transparent Huge Pages)

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
# [always] madvise never

# For latency-sensitive workloads (databases, Java):
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
# Or disable entirely:
echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

**Java + THP**: THP can cause JVM GC pauses when huge pages are promoted/demoted. Recommendation: disable THP for JVM processes or use `madvise` mode with explicit `-XX:+UseHugeTLBFS`.

### Static Huge Pages for Java

```bash
# Allocate 1024 huge pages (2MB each = 2GB):
echo 1024 > /proc/sys/vm/nr_hugepages

# Use in JVM:
java -Xmx4g -XX:+UseLargePages -XX:LargePageSizeInBytes=2m MyApp
```

---

## NUMA (Non-Uniform Memory Access)

In multi-socket systems, each CPU socket has its own RAM. Accessing **local memory** is fast; **remote memory** (other socket's RAM) is slower.

```
Socket 0             Socket 1
┌──────────┐         ┌──────────┐
│  CPUs    │         │  CPUs    │
│  0-15    │◄──QPI───►  16-31   │
├──────────┤         ├──────────┤
│  RAM 0   │         │  RAM 1   │
│  (fast)  │         │  (fast)  │
└──────────┘         └──────────┘
Cross-node memory access: 1.5–2× slower
```

```bash
numactl --hardware          # Show NUMA topology
numactl --show              # Current process's NUMA policy
numastat                    # NUMA allocation stats

# Run process on specific NUMA node:
numactl --cpunodebind=0 --membind=0 java -jar app.jar
```

### NUMA and Java

JVM is NUMA-aware with `-XX:+UseNUMA`:
- Allocates young gen on the NUMA node where threads are running.
- Significantly reduces cross-NUMA memory traffic.

---

## Memory Overcommit

Linux allows processes to `mmap`/`malloc` more memory than physically available (overcommit), banking on the fact that most allocated memory is never touched.

```bash
cat /proc/sys/vm/overcommit_memory
# 0 = heuristic overcommit (default)
# 1 = always overcommit (never fail malloc)
# 2 = never overcommit (fail if exceeds swap + RAM * ratio)

cat /proc/sys/vm/overcommit_ratio  # % of RAM allowed to overcommit (default 50)
```

---

## Memory Pressure and Reclaim

### Page Reclaim

When memory is low, the kernel's **kswapd** daemon reclaims memory:
1. **Page cache**: Drop clean file-backed pages (can re-read from disk).
2. **Dirty pages**: Write to disk, then drop.
3. **Anonymous pages**: Move to swap.

### `/proc/meminfo` Key Fields

```bash
MemTotal:       Total RAM
MemFree:        Unused RAM
MemAvailable:   Estimated available (MemFree + reclaimable cache)
Buffers:        Kernel buffers
Cached:         Page cache
SwapCached:     Pages in both swap and RAM
Active:         Recently used pages
Inactive:       Candidate for reclaim
Dirty:          Pages modified, not yet written to disk
Writeback:      Pages being written to disk
AnonPages:      Anonymous mapped memory
Mapped:         mmap'd files
Shmem:          Shared memory (tmpfs)
```

---

## Memory-Related Linux Tuning

```bash
# Reduce VM writeback threshold (reduce dirty page buildup):
sysctl -w vm.dirty_ratio=10
sysctl -w vm.dirty_background_ratio=5

# How aggressively to reclaim memory from inactive lists:
sysctl -w vm.vfs_cache_pressure=50   # default, higher = more aggressive

# Min free memory before kswapd wakes up (KB):
sysctl -w vm.min_free_kbytes=65536

# Show current vm parameters:
sysctl -a | grep vm
```

---

## Common Interview Questions

### Q1: What is the difference between `MemFree` and `MemAvailable` in `/proc/meminfo`?

`MemFree` is completely unused RAM. `MemAvailable` is an estimate of how much memory is available for new processes — it includes `MemFree` plus reclaimable page cache and slab memory. On a busy server, `MemFree` may be near zero while `MemAvailable` is large (most RAM is in use as cache).

### Q2: What happens when a Linux process exceeds its memory limit (cgroup)?

The cgroup memory controller triggers the OOM killer within the cgroup, killing the most memory-hungry process in that cgroup (not system-wide). This is how Docker containers are killed when they exceed their memory limit.

### Q3: Why does the JVM heap not immediately return memory to the OS after GC?

The JVM holds on to heap memory to avoid repeated allocation/deallocation cycles. After GC, pages are zeroed but not freed. Use `-XX:+UseContainerSupport` (Java 10+) and G1/ZGC with `-XX:+ZUncommit` or Shenandoah to return memory to the OS. `-Xms = -Xmx` also prevents dynamic resizing.

### Q4: What is a memory leak vs. memory bloat?

**Memory leak**: Objects remain reachable (referenced) but are no longer needed — GC cannot collect them. In Java, common causes: static collections, listeners not unregistered, ThreadLocal not removed. **Memory bloat**: Memory usage grows due to legitimate but excessive object creation (e.g., caching too much). Both exhaust heap but require different fixes.

### Q5: What is Transparent Huge Pages and why might you disable it for databases?

THP automatically merges 4KB pages into 2MB pages to reduce TLB pressure. However, it can cause latency spikes: when the kernel promotes/demotes huge pages, it must acquire a lock and possibly copy memory. Databases and Java heaps access memory in unpredictable patterns, causing frequent promotion/demotion. Recommendation: disable THP or set to `madvise` for these workloads.

---

## Advanced Editorial Pass: Virtual Memory Mechanics and Production Resilience

### Senior Engineering Focus
- Translate address-space theory into page-fault and cache behavior expectations.
- Understand TLB, huge pages, and NUMA locality effects on latency.
- Map memory pressure events to service-level degradation patterns.

### Failure Modes to Anticipate
- TLB miss storms and locality regressions after deployment changes.
- Unintended huge page configuration causing resource imbalance.
- OOM killer events with unclear victim selection impact.

### Practical Heuristics
1. Track minor/major faults and NUMA locality metrics.
2. Use memory layout experiments before enabling huge pages broadly.
3. Pair OS memory metrics with GC/runtime telemetry.

### Compare Next
- [Memory Management](./memory-management.md)
- [CPU Scheduling](./cpu-scheduling.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
