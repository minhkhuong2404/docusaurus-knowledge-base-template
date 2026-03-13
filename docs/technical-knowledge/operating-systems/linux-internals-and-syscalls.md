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

# Linux Internals & System Calls

## Linux Kernel Architecture

```
User Space
┌─────────────────────────────────────────────────────────────┐
│  Applications: bash, java, nginx, postgres, ...             │
└────────────────────────────┬────────────────────────────────┘
                             │ System Calls (glibc / syscall)
────────────────────────────────────────────────────────────── Kernel Boundary
┌─────────────────────────────────────────────────────────────┐
│  System Call Interface                                       │
│ ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│ │  Process   │ │  Memory  │ │   VFS    │ │   Network    │  │
│ │  Scheduler │ │  Manager │ │  Layer   │ │   Stack      │  │
│ └────────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │            Device Drivers                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│              Hardware Abstraction Layer                      │
└─────────────────────────────────────────────────────────────┘
Hardware: CPU, RAM, NIC, Disk, ...
```

### Kernel Modes

- **Kernel Mode (Ring 0)**: Full hardware access. Kernel code runs here.
- **User Mode (Ring 3)**: Restricted. Applications run here.

Switching to kernel mode is expensive (~1µs) — that's why system calls should be minimized in hot paths.

---

## System Calls

A **system call** is the mechanism by which a user-space process requests a service from the kernel.

### System Call Flow (x86-64 Linux)

```
1. App calls glibc wrapper (e.g., read())
2. glibc sets syscall number in RAX, args in RDI, RSI, RDX, R10, R8, R9
3. Executes syscall instruction
4. CPU switches to Ring 0, jumps to kernel entry point
5. Kernel validates args, performs operation
6. Returns result in RAX (negative = error → errno)
7. CPU switches back to Ring 3
```

### Essential System Calls

#### Process Management

| Syscall | Description |
|---|---|
| `fork()` | Create child process |
| `exec*()` | Replace process image |
| `wait()` / `waitpid()` | Wait for child |
| `exit()` | Terminate process |
| `getpid()` / `getppid()` | Get PID |
| `kill(pid, sig)` | Send signal to process |
| `clone()` | Create thread/process with fine-grained sharing |

#### File I/O

| Syscall | Description |
|---|---|
| `open(path, flags)` | Open/create a file → fd |
| `read(fd, buf, n)` | Read n bytes |
| `write(fd, buf, n)` | Write n bytes |
| `close(fd)` | Release file descriptor |
| `lseek(fd, offset, whence)` | Move file position |
| `mmap(addr, len, prot, flags, fd, off)` | Map file/device into memory |
| `munmap(addr, len)` | Unmap |
| `fsync(fd)` | Flush to disk |
| `stat(path, statbuf)` | Get file metadata |
| `unlink(path)` | Delete file |
| `rename(old, new)` | Rename/move file (atomic within filesystem) |

#### Memory

| Syscall | Description |
|---|---|
| `brk(addr)` | Adjust heap end |
| `mmap(MAP_ANON)` | Allocate anonymous memory |
| `mprotect(addr, len, prot)` | Change memory permissions |
| `madvise(addr, len, advice)` | Advise kernel on memory usage |

#### Network

| Syscall | Description |
|---|---|
| `socket(domain, type, proto)` | Create socket |
| `bind(fd, addr, len)` | Bind to address |
| `listen(fd, backlog)` | Mark as passive |
| `accept(fd, addr, len)` | Accept connection |
| `connect(fd, addr, len)` | Connect to server |
| `send(fd, buf, n, flags)` | Send data |
| `recv(fd, buf, n, flags)` | Receive data |
| `epoll_create/ctl/wait` | Scalable I/O multiplexing |

#### I/O Multiplexing

| | `select` | `poll` | `epoll` |
|---|---|---|---|
| Max FDs | 1024 | Unlimited | Unlimited |
| Complexity | O(n) | O(n) | O(1) amortized |
| API | Bitmask | Array of pollfd | Event list |
| Re-registration | Every call | Every call | Once |
| Best for | ≤few hundred FDs | Medium | Thousands of FDs |

```c
// epoll example
int epfd = epoll_create1(0);
struct epoll_event ev = { .events = EPOLLIN, .data.fd = sock_fd };
epoll_ctl(epfd, EPOLL_CTL_ADD, sock_fd, &ev);

struct epoll_event events[64];
int n = epoll_wait(epfd, events, 64, -1);
for (int i = 0; i < n; i++) {
    handle(events[i].data.fd);
}
```

---

## Signals

Signals are **asynchronous notifications** sent to processes.

### Common Signals

| Signal | Number | Default | Description |
|---|---|---|---|
| SIGHUP | 1 | Terminate | Hangup / config reload |
| SIGINT | 2 | Terminate | Ctrl+C |
| SIGQUIT | 3 | Core dump | Ctrl+\ |
| SIGKILL | 9 | Terminate | **Cannot be caught or ignored** |
| SIGSEGV | 11 | Core dump | Invalid memory access |
| SIGPIPE | 13 | Terminate | Broken pipe (write to closed socket) |
| SIGTERM | 15 | Terminate | Graceful shutdown (catchable) |
| SIGCHLD | 17 | Ignore | Child process changed state |
| SIGSTOP | 19 | Stop | **Cannot be caught or ignored** |
| SIGCONT | 18 | Continue | Resume stopped process |
| SIGUSR1/2 | 10/12 | Terminate | User-defined signals |

```bash
kill -SIGTERM 1234    # Graceful shutdown
kill -9 1234          # Force kill (SIGKILL)
kill -SIGUSR1 1234    # Trigger log rotation in many daemons
```

### Signal Handling in Java

```java
Signal.handle(new Signal("TERM"), signal -> {
    log.info("SIGTERM received, shutting down gracefully");
    shutdown();
});

// Or via Runtime hook (more portable):
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    log.info("Shutdown hook triggered");
    cleanup();
}));
```

---

## Namespaces (Isolation)

Linux namespaces provide **isolation** for system resources — the foundation of containers.

| Namespace | Isolates | Flag |
|---|---|---|
| PID | Process IDs | `CLONE_NEWPID` |
| Network | Interfaces, routes, firewall | `CLONE_NEWNET` |
| Mount | Filesystem mount points | `CLONE_NEWNS` |
| UTS | Hostname, domain name | `CLONE_NEWUTS` |
| IPC | Semaphores, message queues | `CLONE_NEWIPC` |
| User | UIDs, GIDs | `CLONE_NEWUSER` |
| cgroup | cgroup root | `CLONE_NEWCGROUP` |

```bash
# What namespace a process is in:
ls -la /proc/1234/ns/

# Run a process in new namespaces:
unshare --pid --fork --mount-proc bash
```

---

## Control Groups (cgroups)

**cgroups** limit and account for resource usage of process groups.

### Resources Controlled

- **cpu**: CPU time allocation (shares, quota, period).
- **memory**: RAM limit, OOM behavior.
- **blkio**: Block device I/O throttling.
- **net_cls/net_prio**: Network priority.
- **pids**: Limit number of processes.

```bash
# cgroups v2 (modern Linux)
# Create a cgroup:
mkdir /sys/fs/cgroup/myapp

# Set memory limit (512MB):
echo $((512 * 1024 * 1024)) > /sys/fs/cgroup/myapp/memory.max

# Set CPU limit (50% of one core):
echo "50000 100000" > /sys/fs/cgroup/myapp/cpu.max

# Add process to cgroup:
echo 1234 > /sys/fs/cgroup/myapp/cgroup.procs
```

### Docker uses Namespaces + cgroups

```
Container = Namespaces (isolation) + cgroups (resource limits) + Union FS
```

---

## The `/proc` Filesystem

```bash
/proc/
├── [PID]/                  # Per-process info
│   ├── cmdline             # Command line args
│   ├── environ             # Environment variables
│   ├── fd/                 # File descriptors
│   ├── maps                # Virtual memory mappings
│   ├── status              # Process status
│   ├── stat                # Scheduler stats
│   └── net/                # Network stats (process's netns)
├── cpuinfo                 # CPU details
├── meminfo                 # Memory statistics
├── interrupts              # Interrupt counters
├── net/tcp                 # TCP socket table
├── net/dev                 # Network interface stats
├── sys/                    # Kernel tunables (sysctl)
└── loadavg                 # Load averages (1, 5, 15 min)
```

```bash
# Process memory map (virtual memory areas):
cat /proc/1234/maps
# or better:
cat /proc/1234/smaps

# Open file descriptors of a process:
ls -la /proc/1234/fd

# See what files a process has open:
lsof -p 1234
```

---

## Essential Linux Tools

### Process Inspection

```bash
ps aux                     # All processes
ps -ejH                    # Process tree
pstree -p                  # Visual process tree
top / htop                 # Interactive process monitor
pidstat -u 1               # Per-process CPU stats
strace -p 1234             # Trace syscalls of running process
strace -c ./program        # Syscall summary
ltrace ./program           # Trace library calls
```

### Memory

```bash
free -h                    # Memory summary
vmstat 1                   # Virtual memory stats
cat /proc/meminfo          # Detailed memory info
pmap -x 1234               # Process memory map
smem                       # Memory by process (PSS)
```

### I/O & Disk

```bash
iostat -xz 1               # Disk I/O stats
iotop                      # I/O by process
lsof +D /path              # Processes using directory
fuser /path                # Processes using file
df -h                      # Disk space
du -sh /path               # Directory size
```

### Network

```bash
ss -tlnp                   # TCP listening sockets + PID
netstat -tlnp              # (older equivalent)
tcpdump -i eth0 port 8080  # Capture packets
curl -v http://example.com # HTTP debug
nmap -sV host              # Port scan
```

### Performance Analysis

```bash
perf stat ./program        # CPU performance counters
perf top                   # System-wide CPU profiling
perf record ./program      # Record samples
perf report                # Analyze samples
dmesg | tail -50           # Kernel messages
journalctl -u myservice    # Systemd service logs
```

---

## System Call Tracing with `strace`

```bash
# Trace all syscalls:
strace ./myprogram

# Trace specific syscalls:
strace -e trace=open,read,write ./myprogram

# Trace with timestamps:
strace -tt ./myprogram

# Count syscalls:
strace -c ./myprogram

# Attach to running process:
strace -p 1234

# Trace children too:
strace -f ./myprogram
```

### Typical `strace` output

```
execve("./myprogram", [...], [...])        = 0
brk(NULL)                                  = 0x55a3b2000000
mmap(NULL, 4096, PROT_READ|PROT_WRITE,...) = 0x7f9a12000000
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
read(3, "\177ELF\2\1\1\0\0\0...", 832)    = 832
close(3)                                   = 0
...
write(1, "Hello, World!\n", 14)            = 14
exit_group(0)                              = ?
```

---

## Common Interview Questions

### Q1: What is the difference between a process and a container?

A container is not a separate OS — it's a Linux process (or group of processes) running with: namespaces (isolation for PID, network, filesystem, etc.) and cgroups (resource limits). The kernel is shared with the host OS. A VM has its own kernel and hardware emulation.

### Q2: What happens during a `fork()` system call?

The kernel creates a new PCB for the child, copies the parent's page tables (marking pages copy-on-write), assigns a new PID, and returns 0 to the child and the child's PID to the parent. Actual page copying is deferred until a write occurs.

### Q3: Why can't `SIGKILL` be caught?

`SIGKILL` bypasses the process's signal handlers entirely — it's delivered directly by the kernel to terminate the process. This guarantees that a process can always be killed, preventing processes from ignoring termination. `SIGTERM` should be tried first to allow graceful shutdown.

### Q4: What is `epoll` and how does it scale better than `select`?

`select`/`poll` require passing all watched FDs on every call (O(n) scan). `epoll` maintains a kernel-side data structure — you register FDs once, and `epoll_wait` returns only the FDs that are ready. Complexity is O(1) per event, not O(n) per FD. Essential for high-connection servers.

### Q5: What is a file descriptor?

A file descriptor is a small integer (0=stdin, 1=stdout, 2=stderr, then 3+) that's an index into the process's **file descriptor table** — a per-process array of open file descriptions. Each entry points to a kernel file struct containing the current offset, flags, and the underlying inode. Inherited across `fork()`.

### Q6: What does `sysctl` do?

`sysctl` reads and sets kernel parameters at runtime via `/proc/sys/`. Example: `sysctl -w net.core.somaxconn=65535` increases the max TCP connection backlog. Changes are ephemeral unless written to `/etc/sysctl.conf`.

### Q7: What is the difference between `/proc` and `/sys`?

`/proc`: Exposes process and kernel state (memory maps, CPU info, network tables). Historical, somewhat unorganized. `/sys` (sysfs): Structured representation of kernel objects (devices, drivers, buses). Read/write files to configure devices. More organized than `/proc`.

### Q8: How does `mmap` work and what are its advantages?

`mmap()` creates a mapping between a file and the process's virtual address space. The kernel maps file pages on demand (lazy loading). Advantages: avoids double-copying (file → page cache → user buffer), allows multiple processes to share the same physical pages (shared libraries, IPC), and access patterns like random seeks are as efficient as array indexing.

---

## Advanced Editorial Pass: Kernel Boundary Awareness for Backend Engineers

### Senior Engineering Focus
- Model syscall overhead and kernel transitions in hot paths.
- Use namespaces and cgroups as governance tools for isolation and limits.
- Treat procfs and tracing as first-class diagnostics interfaces.

### Failure Modes to Anticipate
- Excessive syscall chatter degrading throughput under load.
- Resource limits misconfigured across cgroups causing false app failures.
- Signal handling bugs leading to unsafe shutdown behavior.

### Practical Heuristics
1. Profile syscall mix before optimization work.
2. Validate container limits with controlled stress tests.
3. Standardize graceful signal handling and shutdown sequencing.

### Compare Next
- [File Systems & I/O](./file-systems-and-io.md)
- [Networking & IPC](./networking-and-ipc.md)
- [Interview Questions](./interview-questions.md)
