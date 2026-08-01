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

import OsFileSystemsIoDiagram from '@site/src/components/OsFileSystemsIoDiagram';

# File Systems & I/O

<OsFileSystemsIoDiagram />

---

## File System Concepts

A **File System** structures and manages unstructured block storage devices (HDDs, NVMe SSDs), providing:
- **Hierarchical Naming**: Directory tree structures (`/usr/local/bin`).
- **Metadata Management**: File ownership, POSIX permissions, size, modification timestamps (`atime`, `mtime`, `ctime`).
- **Access Control**: Read, Write, Execute permission bits and ACLs.

### Linux File Types

| Indicator | Type | Description | Example |
|:---:|---|---|---|
| `-` | Regular File | Binary or text payload data. | `/var/log/syslog` |
| `d` | Directory | Table linking filenames to Inode numbers. | `/etc/nginx` |
| `l` | Symbolic Link | Path string reference pointing to another file. | `/usr/bin/python` |
| `b` | Block Device | Buffered block I/O device. | `/dev/sda1` |
| `c` | Character Device | Unbuffered stream device. | `/dev/tty0` |
| `p` | Named Pipe (FIFO) | Inter-process communication stream. | `/tmp/my_fifo` |
| `s` | Unix Domain Socket | Local IPC socket endpoint. | `/var/run/docker.sock` |

---

## Virtual File System (VFS) Architecture

Linux decouples user applications from specific disk filesystems (ext4, XFS, Btrfs, ZFS, NFS) via the **Virtual File System (VFS)** layer.

```
+-----------------------------------------------------------------+
|              User Application (Java / C / Python)               |
+-----------------------------------------------------------------+
           | POSIX Syscalls (open, read, write, fsync)
           v
+-----------------------------------------------------------------+
|             Virtual File System (VFS) Layer                     |
|  - struct super_block   - struct inode                          |
|  - struct dentry        - struct file                           |
+-----------------------------------------------------------------+
           | Filesystem Operations Driver Map
           v
+---------------+-----------------+----------------+--------------+
| ext4 Driver   | XFS Driver      | Btrfs Driver   | NFS Driver   |
+---------------+-----------------+----------------+--------------+
```

### VFS Core Objects

1. **`struct super_block`**: Represents a mounted filesystem instance (total block count, block size, inode table location).
2. **`struct inode`**: Stores physical file metadata (size, owner, permissions, block pointers), but *not* the filename.
3. **`struct dentry` (Directory Entry)**: Maps human-readable paths (`/var/log`) to specific Inode numbers. Cached in RAM dentry cache (`dcache`).
4. **`struct file`**: Represents an open file instance created when a process invokes `open()`. Holds current file offset and access mode flags.

---

## Inodes & Hard Links vs Soft Links

```
           +---------------------------------------+
           | Inode #12345 (Size, Owner, Data Ptr)  |
           +---------------------------------------+
             ^                                   ^
             | Hard Link 1                       | Hard Link 2
    +-----------------+                 +-----------------+
    | /tmp/file_a.txt |                 | /tmp/file_b.txt |
    +-----------------+                 +-----------------+
             ^
             | Soft Link (Path String)
    +-----------------+
    | /tmp/symlink    |
    +-----------------+
```

- **Hard Link**: Points directly to the file's **Inode number**. Decrements inode link counter when removed. File data is deleted only when link count reaches zero *and* no process holds an open file handle. Cannot cross filesystem boundaries.
- **Soft (Symbolic) Link**: A small independent file containing the target path string (`/tmp/file_a.txt`). If the target is deleted, the symlink becomes a broken dangling link. Can cross filesystem boundaries.

---

## Journaling & Crash Consistency (ext4)

Without journaling, a power loss or kernel panic while writing metadata results in corrupt filesystem states requiring lengthy `fsck` repair passes. **ext4 Journaling** writes operations to a circular journal prior to modifying physical disk structures:

| Journal Mode | Description | Reliability | Performance |
|---|---|:---:|:---:|
| **`journal`** | Both file data and metadata are written to journal before physical disk. | 🟢 Maximum | 🔴 Slowest |
| **`ordered` (Default)** | File data is flushed to disk *before* metadata is written to journal. | 🟡 High | 🟢 Fast |
| **`writeback`** | Metadata is journaled; data order is unconstrained. | 🔴 Low (stale data risk) | 🟢 Maximum |

---

## Java Zero-Copy I/O (`sendfile`)

Traditional Java file transmission requires four buffer copies and four user/kernel context switches:

```
[ Disk ] --(DMA)--> [ Page Cache ] --(CPU)--> [ JVM Heap Buffer ] --(CPU)--> [ Socket Buffer ] --(DMA)--> [ NIC Hardware ]
```

### Java NIO Zero-Copy: `FileChannel.transferTo()`

Using Java NIO `FileChannel.transferTo()`, the JVM delegates transmission directly to the Linux `sendfile()` system call:

```java
// Zero-Copy transmission directly from disk page cache to socket NIC
try (FileChannel src = FileChannel.open(filePath, StandardOpenOption.READ);
     SocketChannel dst = SocketChannel.open(remoteAddress)) {
    
    long transferred = 0;
    long totalSize = src.size();
    while (transferred < totalSize) {
        // Leverages Linux sendfile() syscall (DMA directly from Page Cache to NIC)
        transferred += src.transferTo(transferred, totalSize - transferred, dst);
    }
}
```

```
[ Disk ] --(DMA)--> [ Page Cache ] =====================(DMA Direct)=====================> [ NIC Hardware ]
```

---

## Interview Questions

### Q1. What is the fundamental difference between a Hard Link and a Symbolic Link in Linux?
> A Hard Link is an additional directory entry (`dentry`) referencing the exact same underlying Inode number as the original file. Hard links share ownership, permissions, and data blocks, and deleting the original file name does not destroy data until all hard links are removed. A Symbolic (Soft) Link is an independent file with its own unique Inode containing a path string pointing to the target path. Symlinks can cross different filesystem partitions, whereas Hard Links cannot.

### Q2. How does `fsync()` guarantee durable disk persistence for database systems?
> Standard file writes (`write()`) return as soon as data is copied into the OS kernel **Page Cache** in RAM. If the system crashes, unwritten dirty page cache bytes are lost. Invoking `fsync(fd)` blocks the executing thread until the kernel flushes all dirty metadata and data pages associated with the file descriptor directly to non-volatile disk storage (and issues a hardware cache flush command to the drive controller).

### Q3. What is Zero-Copy I/O and how does Kafka leverage it for extreme throughput?
> Zero-Copy I/O bypasses copying data bytes through user-space application memory buffers during network transmissions. Kafka uses Java NIO's `FileChannel.transferTo()`, which triggers the Linux `sendfile()` system call. The kernel DMA engine transfers log segment bytes directly from the OS Page Cache into the Network Interface Card (NIC) buffer without bringing bytes into JVM heap memory, saving CPU cycles and memory bus bandwidth.

### Q4. What happens under the hood when a process invokes `unlink()` on a file currently open by another process?
> Invoking `unlink()` removes the file's directory entry and decrements the inode link count. However, if another process holds an open file descriptor referencing that inode, the kernel defers physical data block deallocation. The file remains fully readable and writable by open handles until the last process closes the file descriptor (`close()`), at which point the kernel frees the inode and data blocks.

---

## See Also

- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
- [Networking & IPC](./networking-and-ipc.md)
- [Virtual Memory Deep Dive](./virtual-memory-deep-dive.md)
