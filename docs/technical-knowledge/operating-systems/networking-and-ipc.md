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

# Networking & IPC

## OS Network Stack Overview

```
Application Layer    HTTP, gRPC, SMTP, DNS
                          ↕
Transport Layer      TCP / UDP  (src port, dst port, seq/ack)
                          ↕
Network Layer        IP  (src IP, dst IP, routing)
                          ↕
Data Link Layer      Ethernet  (MAC addresses, frames)
                          ↕
Physical Layer       Electrical signals / photons
```

### Kernel Network Path (Receive)

```
NIC → DMA → Ring Buffer → NAPI poll → sk_buff → 
IP routing → TCP → Socket receive buffer → 
application read()
```

---

## Sockets

A **socket** is a bidirectional communication endpoint. Represented as a file descriptor in Unix.

### Socket Types

| Type | Protocol | Description |
|---|---|---|
| `SOCK_STREAM` | TCP | Reliable, ordered, connection-oriented |
| `SOCK_DGRAM` | UDP | Unreliable, connectionless, fast |
| `SOCK_RAW` | IP/custom | Direct access to IP layer |
| `AF_UNIX` | Unix Domain | Local IPC (no network) |

### TCP Server Lifecycle

```
Server:
  socket() → bind() → listen() → loop: accept() → read/write → close()

Client:
  socket() → connect() → read/write → close()
```

### Backlog Queue

`listen(fd, backlog)`: The `backlog` defines the size of the **completed connection queue** (TCP 3-way handshake done, waiting for `accept()`).

```bash
# System max:
cat /proc/sys/net/core/somaxconn      # Default 128, often tuned to 1024–65535
sysctl -w net.core.somaxconn=65535
```

---

## TCP Deep Dive

### Three-Way Handshake

```
Client              Server
  │──── SYN ─────────→│
  │←─── SYN-ACK ──────│
  │──── ACK ─────────→│
  │    Connection Established
```

### TCP Connection Termination (4-Way)

```
Client              Server
  │──── FIN ─────────→│
  │←─── ACK ──────────│
  │←─── FIN ──────────│
  │──── ACK ─────────→│

Client enters TIME_WAIT (2×MSL, usually 60–120s)
```

**TIME_WAIT**: Prevents old packets from a previous connection being accepted by a new one. Can be a problem if you run out of ephemeral ports.

```bash
ss -s                          # Socket summary
ss -tan state time-wait        # Count TIME_WAIT sockets
sysctl net.ipv4.tcp_fin_timeout  # Default 60s
```

### TCP Congestion Control

| Algorithm | Description | Use Case |
|---|---|---|
| CUBIC | Default on Linux; slow start + cubic growth | General internet |
| BBR | Bandwidth-Delay Product based; ignores loss | High-BDP networks (GCP) |
| RENO | Classic; additive increase, multiplicative decrease | Legacy |

```bash
sysctl net.ipv4.tcp_congestion_control   # Current algorithm
sysctl -w net.ipv4.tcp_congestion_control=bbr
```

### Nagle's Algorithm vs TCP_NODELAY

**Nagle**: Buffers small writes until a full segment or ACK received. Reduces packet count, increases latency.

```java
// Disable for low-latency (e.g., game servers, trading systems):
socket.setTcpNoDelay(true);
// Or via ServerSocket:
serverSocket.setOption(StandardSocketOptions.TCP_NODELAY, true);
```

### TCP Keep-Alive

Detects dead connections by sending probes after idle time.

```bash
sysctl net.ipv4.tcp_keepalive_time      # Idle time before first probe (default 7200s)
sysctl net.ipv4.tcp_keepalive_intvl     # Interval between probes (default 75s)
sysctl net.ipv4.tcp_keepalive_probes    # Probes before giving up (default 9)
```

```java
// Java Socket:
socket.setKeepAlive(true);
// Fine-grained (Java 11+):
socket.setOption(ExtendedSocketOptions.TCP_KEEPIDLE, 30);
socket.setOption(ExtendedSocketOptions.TCP_KEEPINTERVAL, 5);
socket.setOption(ExtendedSocketOptions.TCP_KEEPCOUNT, 3);
```

---

## Socket Options

```java
ServerSocketChannel ssc = ServerSocketChannel.open();
ssc.setOption(StandardSocketOptions.SO_REUSEADDR, true);  // Reuse port in TIME_WAIT
ssc.setOption(StandardSocketOptions.SO_REUSEPORT, true);  // Multiple sockets on same port (Linux 3.9+)
ssc.setOption(StandardSocketOptions.SO_RCVBUF, 1024 * 1024); // Receive buffer size
ssc.setOption(StandardSocketOptions.SO_SNDBUF, 1024 * 1024); // Send buffer size
```

### `SO_REUSEPORT`

Allows multiple sockets to bind to the same port — kernel load-balances incoming connections. Used by Nginx/Redis for multi-process accept.

---

## Zero-Copy Networking

Traditional `send(file)`:
```
Disk → page cache → kernel buffer → user buffer → socket buffer → NIC
         (2 copies)
```

`sendfile()` system call:
```
Disk → page cache → socket buffer → NIC
         (0 user-space copies)
```

```java
// Java: FileChannel.transferTo()
try (FileChannel in = FileChannel.open(path);
     SocketChannel out = socketChannel) {
    in.transferTo(0, in.size(), out);  // Uses sendfile() on Linux
}
```

---

## UDP and Multicast

UDP is connectionless, no reliability guarantees. Used for:
- Real-time video/audio streaming
- DNS queries
- DHCP
- Game state updates

```java
DatagramChannel channel = DatagramChannel.open();
channel.bind(new InetSocketAddress(9999));
ByteBuffer buf = ByteBuffer.allocate(1024);
SocketAddress sender = channel.receive(buf);
```

### Multicast

Send one packet to a group of subscribers. Used in market data feeds, service discovery.

```java
NetworkInterface ni = NetworkInterface.getByName("eth0");
InetAddress group = InetAddress.getByName("224.0.0.1");
channel.join(group, ni);
```

---

## IPC Mechanisms Comparison

| Mechanism | Direction | Scope | Performance | Notes |
|---|---|---|---|---|
| Pipe | Unidirectional | Related processes | Fast | `pipe()` syscall |
| Named Pipe (FIFO) | Unidirectional | Any local process | Fast | Has a filesystem name |
| Unix Domain Socket | Bidirectional | Same host | Fastest | Like TCP but no TCP overhead |
| Message Queue | Bidirectional | Same host | Medium | Kernel-managed; POSIX or SysV |
| Shared Memory | Bidirectional | Same host | Fastest | Needs explicit sync (mutex/semaphore) |
| TCP Socket | Bidirectional | Network | Variable | Portable across hosts |
| Signal | Notification only | Same host | Very fast | No data payload (except `sigqueue`) |
| Memory-mapped File | Bidirectional | Same host | Fast | Persistent; survives process death |

### Shared Memory (POSIX)

```c
// Create/open shared memory:
int fd = shm_open("/my_shm", O_CREAT | O_RDWR, 0666);
ftruncate(fd, SIZE);
void *ptr = mmap(0, SIZE, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);

// Write:
strcpy((char *)ptr, "hello");

// Another process: shm_open with same name, mmap, read
```

### Unix Domain Socket vs TCP Loopback

Unix domain socket:
- Directly copies between kernel socket buffers (no TCP/IP stack).
- ~30–50% faster than TCP loopback.
- Supports credential passing (`SO_PEERCRED`).

```bash
# Benchmark comparison:
iperf3 -s -D && iperf3 -c 127.0.0.1   # TCP loopback
socat UNIX-LISTEN:/tmp/s.sock,fork -  # Unix socket
```

---

## High-Performance Server Patterns

### Reactor Pattern (Java NIO)

```java
// Single-threaded Reactor with Selector:
Selector selector = Selector.open();
ServerSocketChannel server = ServerSocketChannel.open();
server.configureBlocking(false);
server.bind(new InetSocketAddress(8080));
server.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    selector.select();
    for (SelectionKey key : selector.selectedKeys()) {
        if (key.isAcceptable()) {
            SocketChannel client = server.accept();
            client.configureBlocking(false);
            client.register(selector, SelectionKey.OP_READ, ByteBuffer.allocate(4096));
        }
        if (key.isReadable()) {
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buf = (ByteBuffer) key.attachment();
            client.read(buf);
            // process request...
        }
    }
    selector.selectedKeys().clear();
}
```

### Proactor Pattern

Uses async I/O (AIO) — kernel notifies on completion, not readiness. Java's `AsynchronousSocketChannel`:

```java
AsynchronousServerSocketChannel server = 
    AsynchronousServerSocketChannel.open().bind(new InetSocketAddress(8080));

server.accept(null, new CompletionHandler<AsynchronousSocketChannel, Void>() {
    public void completed(AsynchronousSocketChannel client, Void att) {
        server.accept(null, this);  // accept next
        ByteBuffer buf = ByteBuffer.allocate(4096);
        client.read(buf, buf, new ReadHandler(client));
    }
    public void failed(Throwable exc, Void att) { }
});
```

### Thread Per Request vs. Event Loop

| | Thread Per Request | Event Loop (NIO) |
|---|---|---|
| Simplicity | High | Lower |
| Memory | High (each thread ~256KB–1MB stack) | Low |
| Throughput | Limited by thread count | Very high |
| Blocking I/O | Natural | Problematic |
| Examples | Tomcat blocking, Java EE | Netty, Vert.x, Node.js |
| Java 21+ | Virtual threads solve this | Still valid for CPU work |

---

## Common Interview Questions

### Q1: What is the difference between TCP and UDP?

TCP: Connection-oriented, reliable (retransmits lost packets), ordered, flow/congestion control, higher overhead. UDP: Connectionless, unreliable, unordered, no flow control, low overhead. Use TCP for correctness (HTTP, databases); UDP for latency (DNS, gaming, streaming where a dropped frame is acceptable).

### Q2: What is the `TIME_WAIT` state and why does it exist?

After a connection is closed by the initiating side, it enters `TIME_WAIT` for 2×MSL (Maximum Segment Lifetime, typically 60s). Purpose: ensures the final ACK is received by the peer (re-sends if needed) and prevents old duplicate packets from contaminating a new connection on the same 4-tuple.

### Q3: What happens when the receive buffer of a TCP socket is full?

TCP advertises a **receive window** of 0 to the sender (zero-window probe). The sender stops sending until the window opens. This is **flow control**. If the application doesn't read fast enough, this backs pressure up through the entire connection.

### Q4: What is `SO_REUSEADDR` vs `SO_REUSEPORT`?

`SO_REUSEADDR`: Allows a new socket to bind to a port that's in `TIME_WAIT` state. Essential for server restarts. `SO_REUSEPORT`: Allows multiple sockets to bind the same port — the kernel distributes connections among them. Used for multi-process accept (Nginx) or per-thread accept.

### Q5: How does epoll handle thundering herd?

Classic problem: multiple threads/processes block on `accept()`, a new connection arrives, all are woken up, only one succeeds, others go back to sleep — wasted context switches. With `EPOLLEXCLUSIVE` flag (Linux 4.5+) or `SO_REUSEPORT`, only one thread/process is woken per event.

### Q6: What is a Unix domain socket and when would you use it?

A Unix domain socket provides socket-like communication between processes on the same machine, but bypasses the network stack — much faster than TCP loopback. Use it for local inter-process communication (e.g., Nginx → PHP-FPM, PostgreSQL local connections, Docker daemon socket).

### Q7: What is the difference between blocking, non-blocking, and async I/O?

- **Blocking I/O**: `read()` blocks until data is available.
- **Non-blocking I/O**: `read()` returns immediately with `EAGAIN` if no data; requires polling.
- **I/O Multiplexing** (`select/poll/epoll`): Block until any of multiple FDs are ready, then do non-blocking I/O.
- **Async I/O (AIO)**: Initiate I/O, continue executing, get notified on completion. Kernel does the I/O in the background.

### Q8: How does Netty achieve high performance?

Netty uses: NIO with event loops (one thread per selector, no blocking), zero-copy (direct ByteBuffers, `sendfile`), memory pooling (PooledByteBufAllocator to avoid GC pressure), pipeline architecture (chain of handlers), and efficient encoding/decoding. It avoids context switches by keeping I/O in dedicated event loop threads.

---

## Advanced Editorial Pass: Networking and IPC for High-Concurrency Services

### Senior Engineering Focus
- Design connection lifecycle and back-pressure policy explicitly.
- Choose IPC and socket models by ordering, throughput, and failure semantics.
- Understand kernel network queues and zero-copy constraints.

### Failure Modes to Anticipate
- Connection storms exhausting file descriptors and accept queues.
- Head-of-line blocking in poorly partitioned message channels.
- Packet loss and retransmission patterns misdiagnosed as app bugs.

### Practical Heuristics
1. Set FD and backlog budgets with monitoring thresholds.
2. Instrument queue depths and retransmit rates.
3. Apply load shedding before saturation cascades.

### Compare Next
- [Linux Internals & Syscalls](./linux-internals-and-syscalls.md)
- [Processes & Threads](./processes-and-threads.md)
- [Interview Questions](./interview-questions.md)
