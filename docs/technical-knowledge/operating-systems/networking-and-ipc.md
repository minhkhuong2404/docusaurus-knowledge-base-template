---
id: networking-and-ipc
title: Networking & IPC
description: Network stack internals, socket programming, TCP deep dive, IPC mechanisms, and high-performance networking with Java NIO and Netty patterns.
tags:
  - operating-systems
  - networking
  - sockets
  - tcp
  - ipc
  - java
  - netty
sidebar_position: 8
---

import OsIpcNetworkingDiagram from '@site/src/components/OsIpcNetworkingDiagram';

# Networking & IPC

<OsIpcNetworkingDiagram />

---

## OS Network Stack & TCP Internals

The Linux kernel network subsystem processes network traffic across the OSI layers: Network Interface Card (NIC) hardware interrupts, Ring Buffers, IP routing, TCP/UDP transport protocol handling, and socket buffer queues.

### TCP 3-Way Handshake & Connection Queues

```
Client                                                  Server
  |                                                       |
  | -------------- SYN (seq = x) -----------------------> |  Enters SYN_RECV
  |                                                       |  Pushed to SYN Backlog Queue
  | <------------- SYN-ACK (seq = y, ack = x+1) --------- |
  | Enters ESTABLISHED                                    |
  |                                                       |
  | -------------- ACK (ack = y+1) ---------------------> |  Moved to Accept Queue
  |                                                       |  Enters ESTABLISHED
  |                                                       |  (app calls accept())
```

1. **SYN Backlog Queue (`net.ipv4.tcp_max_syn_backlog`)**: Holds embryonic connections during the 3-Way Handshake. If flooded, the server sends `SYN Cookies`.
2. **Accept Queue (`net.core.somaxconn`)**: Holds fully established connections waiting for the application thread to call `accept()`. If full, incoming ACKs are dropped, causing client connect timeouts.

### TCP 4-Way Connection Termination

```
Client (Initiator)                                      Server (Peer)
  |                                                       |
  | -------------- FIN (seq = u) -----------------------> |  Enters CLOSE_WAIT
  | Enters FIN_WAIT_1                                     |
  | <------------- ACK (ack = u+1) ---------------------- |
  | Enters FIN_WAIT_2                                     |
  |                                                       |
  | <------------- FIN (seq = v) ------------------------ |  Enters LAST_ACK
  | Enters TIME_WAIT                                      |
  | -------------- ACK (ack = v+1) ---------------------> |  Enters CLOSED
  | (Waits 2 * MSL = 60s)                                 |
  v                                                       v
CLOSED                                                 CLOSED
```

- **`TIME_WAIT` State**: Lasts for $2 \times \text{MSL}$ ($60\text{ seconds}$). Guarantees that the final ACK was delivered and prevents delayed duplicate packets from a previous connection corrupting a new connection reusing the same 4-tuple (`Source IP`, `Source Port`, `Dest IP`, `Dest Port`).

---

## Socket Options for High Performance

```java
ServerSocketChannel channel = ServerSocketChannel.open();

// Allows fast restart of server application without port collision during TIME_WAIT
channel.setOption(StandardSocketOptions.SO_REUSEADDR, true);

// Enables multiple worker processes to bind to the same port for kernel load-balancing (Linux 3.9+)
channel.setOption(StandardSocketOptions.SO_REUSEPORT, true);

// Disables Nagle's algorithm for low-latency immediate packet transmission
channel.setOption(StandardSocketOptions.TCP_NODELAY, true);

// Configures OS socket buffer sizes
channel.setOption(StandardSocketOptions.SO_RCVBUF, 2 * 1024 * 1024); // 2 MB Receive Window
channel.setOption(StandardSocketOptions.SO_SNDBUF, 2 * 1024 * 1024); // 2 MB Send Window
```

---

## Inter-Process Communication (IPC) Mechanisms

When processes on the same host system communicate, selecting the appropriate IPC primitive directly impacts throughput and latency:

| Mechanism | Scope | Data Structure | Performance | Use Case |
|---|---|---|:---:|---|
| **Anonymous Pipe** | Parent / Child Processes | Unidirectional Byte Stream | ⚡ Fast | Shell pipelines (`ps aux \| grep java`). |
| **Named Pipe (FIFO)** | Unrelated Local Processes | Unidirectional Byte Stream | ⚡ Fast | Filesystem-backed unidirectional streams. |
| **Unix Domain Socket** | Unrelated Local Processes | Bidirectional Stream / Datagram | 🚀 Ultra-Fast ($30\text{--}50\%$ faster than loopback) | NGINX to PHP-FPM, Docker Daemon to CLI, local Redis. |
| **Shared Memory (`shmget`/`mmap`)** | Unrelated Local Processes | Zero-Copy Shared RAM Segment | 💥 Fastest (Zero Syscall) | High-Frequency Trading (HFT), shared video frames. Must use spinlocks/mutexes. |
| **POSIX Message Queue** | Unrelated Local Processes | Structured Priority Queue | ⚡ Fast | Kernel-managed message passing. |
| **TCP Loopback (`127.0.0.1`)** | Network / Host Processes | Full TCP/IP Stack Stream | 🐢 Slower | Local microservices requiring network protocol compatibility. |

---

## Netty & The Reactor Pattern

High-performance event-driven networking frameworks like **Netty** use the **Multithreaded Reactor Pattern** built on top of Java NIO `Selector` and Linux `epoll`:

```
                    +------------------------------------+
                    |  Boss EventLoopGroup (Acceptor)    |
                    |  - Listens on Port 8080 (epoll)    |
                    +-----------------+------------------+
                                      |
                                      | Registers new SocketChannel
                                      v
                    +------------------------------------+
                    |  Worker EventLoopGroup (Workers)   |
                    |  - Worker Thread 0 (Selector)      |
                    |  - Worker Thread 1 (Selector)      |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |  ChannelPipeline Execution Chain   |
                    |  Decoder -> Handler -> Encoder     |
                    +------------------------------------+
```

1. **Boss EventLoopGroup**: Single-threaded selector accepting incoming TCP connections and registering sockets to workers.
2. **Worker EventLoopGroup**: Thread pool (typically $2 \times \text{CPU Cores}$) handling non-blocking read/write operations for thousands of concurrent client channels via `epoll_wait()`.

---

## Interview Questions

### Q1. What is the difference between TCP and UDP, and when should each be used?
> TCP is a connection-oriented, reliable protocol providing ordered byte-stream delivery, automatic retransmissions, flow control (receive window), and congestion control (CUBIC/BBR). UDP is a connectionless, lightweight protocol with zero delivery or ordering guarantees. Use TCP for applications requiring data integrity (HTTP, database connections, SSH). Use UDP for real-time applications where low latency is critical and occasional packet loss is acceptable (voice/video streaming, DNS queries, online gaming).

### Q2. What is the `TIME_WAIT` state in TCP and why is setting `SO_REUSEADDR` important for server applications?
> `TIME_WAIT` is the final connection state entered by the side initiating a graceful TCP close (`FIN`). It lasts for $2 \times \text{MSL}$ ($60\text{ seconds}$) to ensure the final `ACK` is received by the peer and to prevent delayed in-flight packets from corrupting new connections sharing the same 4-tuple. `SO_REUSEADDR` allows a restarting server process to immediately rebind to its listening port even if previous sockets remain in `TIME_WAIT`.

### Q3. How does Nagle's algorithm interact with TCP Delayed ACKs, and why is `TCP_NODELAY` set in low-latency systems?
> Nagle's algorithm buffers small outbound write requests until a full MSS (Maximum Segment Size) packet is accumulated or an outstanding ACK arrives. TCP Delayed ACKs delay sending an ACK by up to $200\text{ ms}$ hoping to piggyback on response data. When combined, Nagle waits for an ACK while the remote side waits for data before sending an ACK, causing a $200\text{ ms}$ latency freeze. Enabling `TCP_NODELAY` disables Nagle, sending small packets immediately for low-latency microservices.

### Q4. Why is a Unix Domain Socket significantly faster than TCP Loopback (`127.0.0.1`) for local IPC?
> A Unix Domain Socket bypasses the entire TCP/IP network stack — there are no IP header construction, checksum calculations, TCP sequence tracking, ACK generations, or routing table lookups. The kernel directly copies bytes from the sender's socket buffer into the receiver's socket buffer, executing $30\text{--}50\%$ faster with lower CPU overhead than TCP loopback connections.

---

## See Also

- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
- [File Systems & I/O](./file-systems-and-io.md)
- [Processes & Threads](./processes-and-threads.md)
