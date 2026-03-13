---
id: file-systems-and-io
title: File Systems & I/O
description: File system structures, disk scheduling, VFS, inodes, journaling, RAID, and Java NIO for high-performance I/O.
tags:
  - operating-systems
  - file-systems
  - io
  - disk-scheduling
  - linux
  - java-nio
sidebar_position: 5
---

# File Systems & I/O

## File System Concepts

### What is a File System?

A file system organizes data on storage devices, providing:
- **Naming**: Human-readable names mapped to data locations.
- **Hierarchy**: Directories and subdirectories.
- **Metadata**: Permissions, timestamps, size, ownership.
- **Access control**: Read/write/execute permissions.

### File Types

| Type | Description | Linux Indicator |
|---|---|---|
| Regular file | Data (text, binary) | `-` |
| Directory | Contains entries (name → inode) | `d` |
| Symbolic link | Pointer to another path | `l` |
| Hard link | Another name for same inode | (same `-`) |
| Block device | Disk, SSD (block I/O) | `b` |
| Character device | Terminal, keyboard (stream I/O) | `c` |
| Named pipe (FIFO) | IPC mechanism | `p` |
| Socket | Network/IPC endpoint | `s` |

### File Access Methods

| Method | Description | Use Case |
|---|---|---|
| Sequential | Read/write in order | Logs, streaming |
| Direct (Random) | Access any record by position | Databases |
| Memory-mapped | Map file into address space | Large files, shared memory |
| Index-based | Index points to data blocks | Database indexes |

---

## Disk Structure & Geometry

```
Disk:
┌──────────────────────┐
│  Track 0  ──────────── ◄── Cylinders (stack of tracks)
│  Track 1
│  ...
│  Track N
└──────────────────────┘

Sector = smallest unit (512B or 4096B)
Block  = OS unit (multiple sectors, typically 4KB)
```

### Disk Access Time

```
Total time = Seek Time + Rotational Latency + Transfer Time

HDD:
  Seek:     1–15ms (avg ~5ms)
  Rotation: 0–8ms  (avg ~4ms for 7200 RPM)
  Transfer: <1ms
  Total avg: ~10ms

SSD (NVMe):
  Seek: ~0.1ms
  Read latency: 20–100µs
  Write: 100–500µs
```

---

## Disk Scheduling Algorithms

### 1. FCFS (First Come First Served)
Requests served in arrival order. Fair but high seek time.

### 2. SSTF (Shortest Seek Time First)
Service request closest to current head position. Low seek time but starvation of far requests.

### 3. SCAN (Elevator Algorithm)
Head moves in one direction, services requests, reaches end, reverses. Like an elevator.

```
Head at 53, requests: 98,183,37,122,14,124,65,67
Direction: ↑
53→65→67→98→122→124→183 (end)→183→124→...→14

Better than FCFS; no starvation
```

### 4. C-SCAN (Circular SCAN)
Like SCAN but only services in one direction; jumps to start after reaching end. More uniform wait times than SCAN.

### 5. C-LOOK
Like C-SCAN but only goes as far as the last request (doesn't go to disk end).

**Used in practice**: Linux uses a **deadline scheduler** (for HDDs) or **mq-deadline**, **bfq**, **kyber** (for NVMe).

---

## File System Implementation

### Inode (Index Node)

An **inode** stores all file metadata except the filename:

```
Inode:
  - File type, permissions
  - Owner UID, GID
  - Size in bytes
  - Timestamps: atime, mtime, ctime
  - Link count
  - Block pointers:
      Direct blocks: 12 × block address
      Single indirect: → block of addresses
      Double indirect: → block → block of addresses
      Triple indirect: → block → block → block of addresses
```

```bash
stat /etc/passwd          # Show inode info
ls -i /etc/passwd         # Show inode number
```

### Directory Structure

A directory is a file containing **(name → inode number)** mappings.

```
Directory entry:
[ inode_number (4B) | name_length (1B) | file_type (1B) | name (variable) ]
```

### Hard Links vs Symbolic Links

| | Hard Link | Symbolic Link |
|---|---|---|
| Points to | Inode | Path string |
| Across filesystems | No | Yes |
| If original deleted | Still works | Dangling link |
| Works on directories | No | Yes |
| `ls -l` shows | Same size as original | Link path |

```bash
ln source hardlink         # Hard link
ln -s source symlink       # Symbolic link
```

### Free Space Management

| Method | Description |
|---|---|
| Bit vector (bitmap) | 1 bit per block; fast to find contiguous free blocks |
| Linked list | Free blocks chained together; no random access |
| Grouping | Linked list with groups of n free block addresses |
| Counting | Run-length encoding of free block runs |

---

## Common File Systems

### ext4 (Linux default)

- Uses **extents** (contiguous block ranges) for efficiency.
- **Journaling**: Logs metadata changes before applying → crash recovery.
- Max file size: 16TB; max FS size: 1EB.
- Features: delayed allocation, multiblock allocation.

### XFS

- High-performance, designed for large files and parallel I/O.
- Uses **B+ tree** for extent tracking.
- Default on RHEL/CentOS.

### Btrfs

- Copy-on-write (CoW) filesystem.
- Built-in snapshots, RAID, checksums, compression.
- Subvolumes.

### FAT32 / exFAT

- Simple File Allocation Table.
- exFAT: used for flash drives, cross-platform compatible.
- No permissions, no journaling.

### NTFS (Windows)

- Master File Table (MFT) instead of inodes.
- Journaling, ACLs, compression, encryption.

---

## Journaling

Prevents file system corruption on crash by recording changes to a **journal** (log) before applying them.

### Modes (ext4)

| Mode | What's journaled | Speed | Safety |
|---|---|---|---|
| `writeback` | Metadata only (no order guarantee) | Fastest | Least safe |
| `ordered` | Metadata + data written before metadata commit | Default | Good |
| `journal` | Both metadata and data | Slowest | Safest |

### Log-Structured File System (LFS)

All writes go to a sequential log. No seeks on write. Garbage collection reclaims old segments. Used in SSDs, JFFS2, F2FS.

---

## RAID (Redundant Array of Independent Disks)

| Level | Description | Redundancy | Speed | Min Disks |
|---|---|---|---|---|
| RAID 0 | Striping | None | ↑↑ Read & Write | 2 |
| RAID 1 | Mirroring | Full copy | ↑ Read | 2 |
| RAID 5 | Striping + distributed parity | 1 disk | ↑ Read | 3 |
| RAID 6 | Striping + 2 parity | 2 disks | ↑ Read | 4 |
| RAID 10 | RAID 1 + RAID 0 | Full copy | ↑↑ Both | 4 |

---

## Virtual File System (VFS)

VFS provides a **uniform interface** regardless of underlying filesystem type.

```
Application (open/read/write/close)
       ↓
   VFS Layer (vfs_open, vfs_read, ...)
       ↓
┌───────────┬──────────┬─────────────┐
│  ext4     │   xfs    │  tmpfs/proc │
└───────────┴──────────┴─────────────┘
```

VFS abstractions: `superblock`, `inode`, `dentry` (directory entry), `file`.

### `/proc` and `/sys` Filesystems

- `/proc`: Virtual filesystem exposing kernel and process information as files.
- `/sys` (sysfs): Exposes kernel objects (devices, drivers).

```bash
cat /proc/cpuinfo          # CPU info
cat /proc/meminfo          # Memory stats
cat /proc/net/tcp          # TCP connections
ls /proc/1234/             # Process 1234 info
```

---

## I/O Subsystem

### I/O Methods

| Method | Description | CPU Use |
|---|---|---|
| Programmed I/O (polling) | CPU busy-waits for I/O to complete | 100% |
| Interrupt-driven I/O | CPU does other work; device raises interrupt | Low |
| DMA (Direct Memory Access) | Device transfers data directly to RAM | Minimal |

### I/O Scheduling

Linux block I/O schedulers:
- **mq-deadline**: Deadline-based scheduling, prevents starvation.
- **BFQ** (Budget Fair Queuing): Fair bandwidth, good for interactive use.
- **Kyber**: Low-latency for NVMe.
- **None**: No reordering (fastest for NVMe where seek time is negligible).

```bash
cat /sys/block/sda/queue/scheduler    # Current scheduler
echo mq-deadline > /sys/block/sda/queue/scheduler  # Change it
```

### Page Cache

OS caches disk reads in RAM (page cache). Writes are buffered (**write-back**). Dramatically reduces I/O.

```bash
sync                        # Flush dirty pages to disk
echo 3 > /proc/sys/vm/drop_caches  # Drop page cache (for benchmarking)
```

---

## Java I/O & NIO

### Traditional I/O (java.io)

```java
// Blocking, stream-based
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    String line;
    while ((line = br.readLine()) != null) { process(line); }
}
```

### Java NIO (Non-blocking I/O)

```java
// Channel + Buffer model
Path path = Paths.get("file.txt");
try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
    ByteBuffer buffer = ByteBuffer.allocateDirect(4096);
    while (channel.read(buffer) > 0) {
        buffer.flip();
        // process buffer
        buffer.clear();
    }
}
```

### Java NIO Selector (Multiplexed I/O)

```java
Selector selector = Selector.open();
ServerSocketChannel server = ServerSocketChannel.open();
server.configureBlocking(false);
server.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    selector.select();
    Set<SelectionKey> keys = selector.selectedKeys();
    for (SelectionKey key : keys) {
        if (key.isAcceptable()) { /* accept */ }
        if (key.isReadable())   { /* read */   }
    }
    keys.clear();
}
```

### Memory-Mapped Files (Java)

```java
try (FileChannel fc = FileChannel.open(path)) {
    MappedByteBuffer buf = fc.map(
        FileChannel.MapMode.READ_ONLY, 0, fc.size());
    // Direct memory access — no copy to JVM heap
    byte b = buf.get(1000);
}
```

---

## Common Interview Questions

### Q1: What is the difference between a hard link and a symbolic link?

Hard link: another name pointing to the same inode — deleting the original doesn't affect it; can't cross filesystems; can't link directories. Symbolic link: a file containing a path string — if the target is deleted, the link is broken; can cross filesystems.

### Q2: How does journaling prevent file system corruption?

Journaling writes a record of intended changes to a journal log before modifying the actual file system structures. On crash recovery, the OS replays or discards incomplete journal entries, ensuring the file system remains consistent.

### Q3: What is the difference between `read()` and `mmap()`?

`read()` copies data from kernel page cache into a user-space buffer (two copies: disk→page cache, page cache→user buffer). `mmap()` maps the page cache directly into the process address space — access requires only one copy. For large files or shared access, `mmap()` is significantly faster.

### Q4: What happens when you `delete` a file on Linux?

`unlink()` decrements the inode's link count. When it reaches 0 AND no process has the file open, the inode and data blocks are freed. If a process has it open, the data remains accessible until the last `close()`.

### Q5: What is a buffer cache and a page cache?

The **page cache** (modern Linux) caches file data in memory pages. The old **buffer cache** cached raw disk blocks. Since Linux 2.4, they are unified: file I/O goes through the page cache, which also serves as the buffer cache.

### Q6: What is `fsync()` and when should you call it?

`fsync(fd)` flushes dirty pages for a file to disk, blocking until complete. Call it when you need durable writes (e.g., database transaction commit). Without it, a crash can lose recently written data still in the page cache.

### Q7: What is RAID 5 and what are its limitations?

RAID 5 stripes data with distributed parity across N disks — can tolerate one disk failure. Limitation: during rebuild (after a failure), every block is read from all remaining disks. If a second disk fails during rebuild, all data is lost. For critical data, prefer RAID 6 (tolerates 2 failures) or RAID 10.

### Q8: What is the difference between blocking and non-blocking I/O?

Blocking I/O: the calling thread blocks until the I/O operation completes (e.g., `read()` waits for data). Non-blocking I/O: the call returns immediately with `EAGAIN`/`EWOULDBLOCK` if data isn't ready. Non-blocking I/O with `select()`/`poll()`/`epoll()` is the basis for high-performance event-driven servers (Netty, Node.js).

---

## Advanced Editorial Pass: File System and I/O Path Engineering

### Senior Engineering Focus
- Design I/O behavior for durability goals and performance budgets together.
- Understand journaling, fsync semantics, and write amplification trade-offs.
- Account for disk scheduler and storage class variability.

### Failure Modes to Anticipate
- Assuming write completion implies durable persistence.
- Unbounded synchronous I/O in request paths.
- I/O saturation hidden behind application retries.

### Practical Heuristics
1. Set explicit durability levels per operation type.
2. Measure queue depth and disk latency alongside app latency.
3. Use batching and async pipelines with strict failure semantics.

### Compare Next
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
- [Networking & IPC](./networking-and-ipc.md)
- [Virtual Memory Deep Dive](./virtual-memory-deep-dive.md)
