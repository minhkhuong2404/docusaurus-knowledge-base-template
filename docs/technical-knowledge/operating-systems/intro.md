---
id: intro
title: Operating Systems Knowledge Base
description: A comprehensive knowledge base covering all major operating system concepts, with a focus on Linux internals and Java/JVM perspective.
tags:
  - operating-systems
  - linux
  - java
  - jvm
sidebar_position: 0
---

# Operating Systems Knowledge Base

A comprehensive reference covering OS fundamentals from first principles through to Linux internals, with a Java/JVM lens throughout.

## 📚 Topics Covered

| # | Topic | Key Concepts |
|---|---|---|
| 1 | [Processes & Threads](./processes-and-threads) | PCB, fork/exec, IPC, Java threads, Virtual Threads |
| 2 | [CPU Scheduling](./cpu-scheduling) | FCFS, RR, SJF, Linux CFS, NUMA scheduling |
| 3 | [Memory Management](./memory-management) | Paging, TLB, demand paging, page replacement, JVM heap |
| 4 | [Synchronization & Deadlocks](./synchronization-and-deadlocks) | Mutex, semaphore, monitors, Coffman conditions, JUC |
| 5 | [File Systems & I/O](./file-systems-and-io) | Inodes, journaling, RAID, VFS, Java NIO |
| 6 | [Linux Internals & Syscalls](./linux-internals-and-syscalls) | Kernel architecture, epoll, signals, namespaces, cgroups |
| 7 | [Virtual Memory Deep Dive](./virtual-memory-deep-dive) | Address spaces, ASLR, huge pages, NUMA, OOM killer |
| 8 | [Networking & IPC](./networking-and-ipc) | TCP internals, sockets, epoll, zero-copy, Netty patterns |
| 9 | [Interview Questions](./interview-questions) | Comprehensive Q&A across all topics |

## 🎯 Who This Is For

- **Backend Engineers** preparing for system design or technical interviews.
- **Java/Spring Developers** wanting to understand what happens under the hood.
- **DevOps/SRE** engineers diagnosing performance issues on Linux.
- **CS Students** needing a practical supplement to textbook theory.

## 🔑 Quick Reference

### Processes
```bash
ps aux                    # All processes
pstree -p                 # Process tree
strace -p <pid>           # Trace syscalls
lsof -p <pid>             # Open files
```

### Memory
```bash
free -h                   # Memory overview
cat /proc/meminfo         # Detailed stats
pmap -x <pid>             # Process memory map
vmstat 1                  # Virtual memory stats
```

### CPU
```bash
top -H                    # Per-thread CPU
mpstat -P ALL 1           # Per-CPU stats
perf stat ./program       # Perf counters
```

### Disk I/O
```bash
iostat -xz 1              # Disk utilization
iotop                     # I/O by process
```

### Network
```bash
ss -tlnp                  # Listening sockets
tcpdump -i eth0           # Packet capture
```

---

> 💡 Each page includes both theory and practical Java/Linux examples, plus interview Q&A at the end.

---

## Advanced Editorial Pass: Operating Systems as Performance and Reliability Foundation

### Senior Engineering Focus
- Connect OS abstractions directly to service-level behavior: latency, throughput, and tail risk.
- Model each layer boundary (CPU, memory, I/O, network) as a potential bottleneck and failure source.
- Use Linux primitives as operational tools, not just interview topics.

### Failure Modes to Anticipate
- Treating kernel behavior as black-box noise during production incidents.
- Optimizing application code while ignoring scheduler, memory, and I/O contention.
- Lack of repeatable diagnostics playbooks across teams.

### Practical Heuristics
1. Define an OS-level observability baseline for every backend service.
2. Correlate JVM/application metrics with CPU scheduling, paging, and I/O telemetry.
3. Document incident triage order: process, memory, disk, network, then app logic.

### Compare Next
- [Processes & Threads](./processes-and-threads.md)
- [Memory Management](./memory-management.md)
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
