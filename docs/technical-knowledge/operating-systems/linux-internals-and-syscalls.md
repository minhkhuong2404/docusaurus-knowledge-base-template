---
id: linux-internals-and-syscalls
title: Linux Internals & System Calls
description: Linux kernel architecture, system call mechanism, signals, namespaces, cgroups, and essential Linux commands for developers.
tags:
  - linux
  - system-calls
  - kernel
  - namespaces
  - cgroups
  - signals
  - posix
sidebar_position: 6
---

import OsLinuxSyscallsDiagram from '@site/src/components/OsLinuxSyscallsDiagram';

# Linux Internals & System Calls

<OsLinuxSyscallsDiagram />

---

## Linux Kernel Architecture

The Linux kernel is a **monolithic kernel with dynamic module loading**. It runs with full CPU privileges in **Ring 0 (Kernel Mode)**, managing hardware devices, physical RAM allocations, process scheduling, security checks, and network packet routing on behalf of user-space applications executing in **Ring 3 (User Mode)**.

```
+-----------------------------------------------------------------+
|   User Space Applications (Ring 3: Java JVM, NGINX, Postgres)  |
+-----------------------------------------------------------------+
           | System Call Interface (syscall / sysret)
           v
+-----------------------------------------------------------------+
|   Linux Kernel Subsystems (Ring 0: Process, Memory, VFS, Net)   |
+-----------------------------------------------------------------+
           | Device Drivers & Hardware Interrupt Handlers
           v
+-----------------------------------------------------------------+
|   Hardware Devices (CPUs, RAM, NVMe Disks, NIC Networks)       |
+-----------------------------------------------------------------+
```

---

## System Call (Syscall) Internals

A **System Call** is the fundamental mechanism through which a user-space application requests restricted kernel operations (e.g., file reads, network socket IO, process creation).

### Low-Level Execution Flow (x86-64 `syscall`)

1. User program populates CPU register `RAX` with the System Call Number (e.g., `RAX = 0` for `read`, `RAX = 1` for `write`, `RAX = 59` for `execve`).
2. Arguments are placed in registers: `RDI`, `RSI`, `RDX`, `R10`, `R8`, `R9`.
3. Application executes the assembly instruction `syscall`.
4. CPU automatically switches mode from **Ring 3 to Ring 0**, saves user `RIP` and `RFLAGS`, and jumps to the kernel system call handler address configured in MSR (Model-Specific Register) `IA32_LSTAR`.
5. Kernel checks process permissions, executes the operation, writes return value to `RAX`, and invokes `sysret` to switch CPU back to Ring 3.

### vDSO Acceleration (virtual Dynamic Shared Object)
For high-frequency syscalls that only read kernel data (such as `clock_gettime()` or `gettimeofday()`), Linux maps a kernel page directly into user-space memory called the **vDSO**. The libc wrapper reads time directly from vDSO memory, eliminating the Ring 3 $\to$ Ring 0 CPU context switch penalty entirely ($\approx 1\text{--}2\text{ ns}$ execution time vs $\approx 100\text{--}500\text{ ns}$ for a real syscall).

---

## Linux Isolation Primitives: Namespaces & cgroups

Containers (Docker, Kubernetes Pods) are not hardware virtual machines; they are standard Linux processes isolated via two kernel features:

### 1. Namespaces (Isolation)
Namespaces restrict *what a process can see* by creating isolated instances of system resources:

| Namespace Type | Flag | Resource Isolated |
|---|---|---|
| **PID** | `CLONE_NEWPID` | Process IDs (container has its own PID 1). |
| **NET** | `CLONE_NEWNET` | Network devices, IP addresses, routing tables, iptables. |
| **MNT** | `CLONE_NEWMNT` | File system mount points (chroot / rootfs). |
| **IPC** | `CLONE_NEWIPC` | System V IPC & POSIX message queues. |
| **UTS** | `CLONE_NEWUTS` | Hostname and NIS domain name. |
| **USER** | `CLONE_NEWUSER` | User and group IDs (map container root to unprivileged host UID). |
| **CGROUP** | `CLONE_NEWCGROUP` | Virtualized view of cgroup hierarchy. |

### 2. cgroups — Control Groups (Resource Allocation)
Control Groups limit and monitor *how much a process can use*:
- **CPU (`cpu.cfs_quota_us`)**: Limits CPU time allocation per period.
- **Memory (`memory.max` / `memory.high`)**: Sets RSS memory limits and triggers container OOM Killer when exceeded.
- **Block I/O (`io.weight`)**: Controls disk read/write bandwidth priority.

---

## POSIX Signal Handling

Signals are asynchronous notifications sent by the kernel or processes to notify a target process of a system event:

| Signal | Value | Default Action | Catchable? | Description |
|---|---|---|:---:|---|
| **`SIGHUP`** | 1 | Terminate | ✅ Yes | Terminal hangup; used by NGINX/Prometheus for zero-downtime config reload. |
| **`SIGINT`** | 2 | Terminate | ✅ Yes | Interrupt from keyboard (`Ctrl+C`). |
| **`SIGQUIT`** | 3 | Core Dump | ✅ Yes | Quit from keyboard (`Ctrl+\`); triggers JVM thread dump to stdout. |
| **`SIGKILL`** | 9 | Immediate Terminate | ❌ No | Immediate forceful process destruction by kernel. Uncatchable. |
| **`SIGSEGV`** | 11 | Core Dump | ✅ Yes | Invalid memory access (Segmentation Fault). |
| **`SIGTERM`** | 15 | Terminate | ✅ Yes | Graceful termination request (sent by `docker stop` or `kubectl delete`). |

---

## Essential Linux Diagnostic Tools

```bash
# Tracing syscalls of a running JVM process
strace -p <pid> -T -ff -o /tmp/jvm_strace.txt

# Inspecting file descriptor table limit and open files
ls -l /proc/<pid>/fd | wc -l
cat /proc/<pid>/limits | grep "Max open files"

# Performance counters & CPU profiling
perf top -p <pid>
```

---

## Interview Questions

### Q1. What is the fundamental difference between a Linux process and a Docker container?
> A Docker container is not a virtual machine and has no hypervisor or guest kernel. A container is a standard Linux process (or group of processes) executing directly on the host Linux kernel, restricted by Linux kernel isolation primitives: **Namespaces** (which isolate what the process can see, such as PIDs, networks, and mount points) and **cgroups** (which cap how much CPU, RAM, and I/O the process can consume).

### Q2. How does `epoll` scale I/O multiplexing significantly better than legacy `select()` or `poll()`?
> `select()` and `poll()` require user applications to pass the entire array of watched file descriptors from user space to kernel space on every single poll call ($O(N)$ memory transfer and scanning overhead). `epoll` maintains a persistent red-black tree of watched sockets inside kernel space via `epoll_ctl()`. When an I/O event occurs, the NIC interrupt populates a ready list. Calling `epoll_wait()` returns only the active ready descriptors in $O(1)$ time, enabling high-performance servers (NGINX, Netty) to scale to millions of concurrent connections.

### Q3. Why can `SIGKILL` (signal 9) not be caught, blocked, or ignored by an application?
> `SIGKILL` is designed as the kernel's ultimate administrative override. When `SIGKILL` is dispatched, the kernel immediately halts the process's execution thread and reclaims its resources without invoking user-space signal handler code. This guarantees that uncooperative, deadlocked, or malicious processes can always be terminated. For graceful application shutdowns, `SIGTERM` (signal 15) must be used.

### Q4. What is a File Descriptor (FD) and what kernel structures does it point to?
> A File Descriptor is a small non-negative integer returned by `open()` or `socket()` that acts as an index into the process's private **File Descriptor Table** stored in its `task_struct`. Each FD table entry points to an **Open File Description** object in system memory (storing read/write offset, file status flags, and access mode), which in turn references the underlying VFS **Inode** representing the physical file or socket.

### Q5. What is `vDSO` and how does it optimize Linux system calls?
> `vDSO` (virtual Dynamic Shared Object) is a small kernel-provided shared library automatically mapped into every user process's virtual memory space. For non-modifying system calls that simply query kernel data (such as `clock_gettime()`), the application invokes the vDSO wrapper, which reads the data directly from mapped kernel pages in user mode (Ring 3). This avoids the expensive Ring 3 to Ring 0 `syscall` context switch, reducing execution latency from ~100ns to ~2ns.

---

## See Also

- [Processes & Threads](./processes-and-threads.md)
- [File Systems & I/O](./file-systems-and-io.md)
- [Networking & IPC](./networking-and-ipc.md)
