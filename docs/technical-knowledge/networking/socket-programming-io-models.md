---
id: socket-programming-io-models
title: Socket Programming & I/O Models
description: Blocking vs non-blocking I/O, Java NIO, epoll, the C10K problem, Netty, and how event-driven servers handle massive concurrency.
tags: [networking, sockets, nio, epoll, netty, async, blocking, non-blocking, reactor, java]
sidebar_position: 10
---

import SocketIoModelsDiagram from '@site/src/components/SocketIoModelsDiagram';
import SocketLifecycleDiagram from '@site/src/components/SocketLifecycleDiagram';

# Socket Programming & I/O Models

<SocketIoModelsDiagram />

<SocketLifecycleDiagram />

---

## The 5 Linux I/O Models

Every network application running on Linux interacts with sockets through one of 5 distinct kernel I/O models:

| I/O Model | Phase 1: Wait for Data in Socket Buffer | Phase 2: Copy from Kernel Buffer to User Buffer | Scalability Profile |
|---|---|---|---|
| **1. Blocking I/O (BIO)** | Thread sleeps until data arrives | Thread sleeps while kernel copies bytes | $O(N)$ threads; collapses at high concurrency ($C10K$). |
| **2. Non-Blocking I/O (NIO Polling)** | Returns `EAGAIN` / `EWOULDBLOCK` immediately | Thread blocks during memory copy | Inefficient CPU spin; wastes clock cycles in loops. |
| **3. I/O Multiplexing (`epoll` / `kqueue`)** | Thread blocks on `epoll_wait()` across $100\text{k}+$ FDs | Thread blocks during user-space `read()` | **Industry Standard**: Event-driven (Nginx, Netty, Redis, Node.js). |
| **4. Signal-Driven I/O (`SIGIO`)** | Kernel issues `SIGIO` signal when data arrives | Thread blocks during user-space `read()` | Rare; signal handling overhead is high under load. |
| **5. Asynchronous I/O (Linux `io_uring`)** | Kernel waits for data asynchronously | **Kernel copies data into user buffer directly** | True async; zero context switches on hot path. |

### Under the Hood: `select()` vs `poll()` vs `epoll()`

```
select() / poll() [O(N) Complexity]:
  User Space ──► Copy entire array of 10,000 FDs to Kernel
                 Kernel scans all 10,000 FDs linearly (O(N))
  User Space ◄── Copy array back; user app scans 10,000 FDs to find 2 active sockets

epoll() [O(1) Event-Driven Architecture]:
  1. epoll_create: Allocates Red-Black Tree (monitored FDs) + Ready List (active FDs)
  2. epoll_ctl:    Inserts FD into Red-Black Tree ONCE (O(log N))
  3. Driver Event: When NIC DMA fills buffer, interrupt callback appends FD to Ready List
  4. epoll_wait:   Sleeps only on Ready List; returns ONLY active FDs in O(1)!
```

### Level-Triggered (LT) vs Edge-Triggered (ET) Starvation Hazard

In Linux `epoll`:
- **Level-Triggered (`EPOLLLT` — Java NIO Default)**: `epoll_wait()` continues to return the FD on every invocation as long as the socket buffer has unread bytes. Safe, but generates redundant wake-up notifications if you read in small chunks.
- **Edge-Triggered (`EPOLLET` — Netty Native Transport)**: `epoll_wait()` fires **only once** when new data transitions into the buffer.
  - ⚠️ **The Production Bug Trap**: In Edge-Triggered mode, the application **MUST loop `read()` until it explicitly receives `EAGAIN` or `EWOULDBLOCK`**. If your code reads only 1 KB of a 4 KB arrival and exits, the remaining 3 KB will sit in the buffer forever because no new edge transition occurs!

---

## Java NIO (Non-Blocking I/O)

Java NIO (java.nio) provides non-blocking I/O with selectors (epoll/kqueue underneath).

```java
// Java NIO server
Selector selector = Selector.open();
ServerSocketChannel server = ServerSocketChannel.open();
server.bind(new InetSocketAddress(8080));
server.configureBlocking(false);
server.register(selector, SelectionKey.OP_ACCEPT);  // register interest

while (true) {
    selector.select();  // block until any channel is ready

    Set<SelectionKey> keys = selector.selectedKeys();
    Iterator<SelectionKey> it = keys.iterator();

    while (it.hasNext()) {
        SelectionKey key = it.next();
        it.remove();

        if (key.isAcceptable()) {
            SocketChannel client = server.accept();
            client.configureBlocking(false);
            client.register(selector, SelectionKey.OP_READ);

        } else if (key.isReadable()) {
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buf = ByteBuffer.allocate(1024);
            int n = client.read(buf);
            if (n == -1) { client.close(); continue; }
            buf.flip();
            // process buf...
            client.register(selector, SelectionKey.OP_WRITE);

        } else if (key.isWritable()) {
            SocketChannel client = (SocketChannel) key.channel();
            client.write(ByteBuffer.wrap(response));
        }
    }
}
```

---

## Netty

Netty is an **asynchronous, event-driven network framework** for Java — the standard for building high-performance network servers.

```
Netty Architecture:

EventLoopGroup (boss)  → accepts connections
EventLoopGroup (worker)→ handles I/O + pipeline

ChannelPipeline:
  [SocketChannel]
       ↓
  [ChannelHandler 1: HttpRequestDecoder]
       ↓
  [ChannelHandler 2: HttpResponseEncoder]
       ↓
  [ChannelHandler 3: BusinessLogicHandler]
       ↓
  [write back to channel]
```

```java
// Netty HTTP server
public class NettyServer {
    public void start() throws Exception {
        EventLoopGroup boss   = new NioEventLoopGroup(1);
        EventLoopGroup worker = new NioEventLoopGroup();  // # cores * 2 threads

        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(boss, worker)
             .channel(NioServerSocketChannel.class)
             .option(ChannelOption.SO_BACKLOG, 1024)
             .childOption(ChannelOption.TCP_NODELAY, true)
             .childOption(ChannelOption.SO_KEEPALIVE, true)
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override
                 protected void initChannel(SocketChannel ch) {
                     ch.pipeline()
                       .addLast(new HttpRequestDecoder())
                       .addLast(new HttpResponseEncoder())
                       .addLast(new HttpObjectAggregator(65536))
                       .addLast(new MyBusinessHandler());
                 }
             });

            ChannelFuture f = b.bind(8080).sync();
            f.channel().closeFuture().sync();
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }
}

// Business logic handler
public class MyBusinessHandler extends SimpleChannelInboundHandler<FullHttpRequest> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) {
        FullHttpResponse response = new DefaultFullHttpResponse(
            HTTP_1_1, OK, Unpooled.copiedBuffer("Hello!", UTF_8));
        response.headers().set(CONTENT_TYPE, "text/plain; charset=UTF-8");
        ctx.writeAndFlush(response);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close();
    }
}
```

---

> 📘 **For a complete guide** on Netty's EventLoop internals, how it compares to Tomcat, and production configuration, see **[Thread Pools, Netty, Tomcat & HikariCP](../java/thread-pools-and-connection-pooling)**.

## Spring WebFlux (Reactive I/O)

Spring WebFlux uses Netty and Project Reactor for non-blocking HTTP.

```java
// Reactive controller — never blocks a thread
@RestController
public class OrderController {

    @GetMapping("/orders/{id}")
    public Mono<Order> getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)  // returns Mono (non-blocking)
            .switchIfEmpty(Mono.error(new NotFoundException()));
    }

    @GetMapping(value = "/orders/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Order> streamOrders() {
        return orderRepository.findAll()   // streaming result
            .delayElements(Duration.ofSeconds(1));
    }

    @PostMapping("/orders")
    public Mono<ResponseEntity<Order>> createOrder(@RequestBody Mono<OrderRequest> req) {
        return req
            .flatMap(orderService::create)
            .map(order -> ResponseEntity.created(URI.create("/orders/" + order.getId()))
                .body(order));
    }
}
```

```yaml
# application.yml — Spring WebFlux runs on Netty by default
spring:
  main:
    web-application-type: reactive
```

---

## C10K Problem

The C10K problem: how to handle **10,000 concurrent connections** on a single server.

```
Traditional thread-per-connection at 10K connections:
  - 10,000 threads × 1MB stack = 10 GB RAM (stacks alone)
  - Context switches: ~10μs each → massive CPU overhead
  - Not feasible

Event-driven (epoll + single/few threads):
  - 1 thread, 10,000 connections via epoll
  - Memory: just fd + per-connection state (~1KB) = 10 MB
  - Context switches: near zero
  - Modern servers routinely handle 1M+ connections
```

### C10K Solutions

| Solution | Approach | Examples |
|---------|----------|---------|
| Thread pool | Limited thread count, queue connections | Java thread pool (BIO) |
| NIO + Selector | One thread, select on many FDs | Java NIO |
| epoll | Kernel event notification, O(1) | Nginx, Redis, Node.js |
| Coroutines | Lightweight "green threads" | Go goroutines, Kotlin coroutines |
| Async/reactive | Callback/future chains | Spring WebFlux, Vert.x |

---

## TCP Socket Options

```java
ServerSocket server = new ServerSocket();
server.setReuseAddress(true);        // SO_REUSEADDR: allow bind while TIME_WAIT

Socket socket = new Socket();
socket.setTcpNoDelay(true);          // TCP_NODELAY: disable Nagle's algorithm
socket.setSoTimeout(30_000);         // SO_TIMEOUT: read timeout in ms
socket.setKeepAlive(true);           // SO_KEEPALIVE: enable keep-alive probes
socket.setSendBufferSize(65536);     // SO_SNDBUF: send buffer size
socket.setReceiveBufferSize(65536);  // SO_RCVBUF: receive buffer size
```

**Nagle's Algorithm**: buffers small writes and sends them together to reduce packet count. Good for bulk transfer. Bad for real-time protocols (disable with `TCP_NODELAY`).

---

## The Thundering Herd Problem & `SO_REUSEPORT`

In multi-threaded or multi-process network architectures (such as Nginx workers or multi-threaded Netty acceptors), multiple threads often wait for incoming connections simultaneously.

### The Problem
When multiple threads call `epoll_wait()` or `accept()` on the **same shared listening socket**:
1. A new client TCP connection completes the 3-way handshake.
2. The operating system kernel wakes up **all $N$ waiting worker threads**.
3. The first thread successfully calls `accept()` and receives the client FD.
4. The remaining $N-1$ threads wake up, fail with `EAGAIN` or `EWOULDBLOCK`, and immediately context-switch back to sleep.
5. Under high connection churn (e.g. 50,000 conn/sec), this causes severe CPU thrashing and context-switch overhead.

### The Solution: `SO_REUSEPORT` (Linux 3.9+)

Instead of sharing a single listening socket and a single accept queue, `SO_REUSEPORT` allows **multiple independent sockets** to bind to the exact same IP:port combination:

```
Without SO_REUSEPORT (Contended Shared Accept Queue):
[ SYN Influx ] ──► [ Single Accept Queue (Mutex Lock) ] ──► Wakes ALL N Workers (Thundering Herd)

With SO_REUSEPORT (Kernel 4-Tuple Hashed Load Balancing):
[ SYN Influx ] ──► [ Kernel 4-Tuple Hash ] ──┬──► [ Queue 1 ] ──► Worker 1 (No Mutex Lock)
                                             ├──► [ Queue 2 ] ──► Worker 2 (No Mutex Lock)
                                             └──► [ Queue N ] ──► Worker N (No Mutex Lock)
```

In Netty:
```java
// Enable SO_REUSEPORT in Netty using Linux Epoll native transport
ServerBootstrap b = new ServerBootstrap();
b.group(bossGroup, workerGroup)
 .channel(EpollServerSocketChannel.class)
 .option(EpollChannelOption.SO_REUSEPORT, true);
```

---

## Zero-Copy Architecture: `sendfile()`, `splice()`, and Off-Heap Buffers

When serving static assets, video segments, or Kafka message logs, copying data between kernel buffers and user-space memory creates massive CPU and memory bandwidth bottlenecks.

### Traditional I/O vs Zero-Copy `sendfile()`

```
1. Traditional sys_read / sys_write (4 Context Switches, 2 CPU Copies, 2 DMA Copies):
   [ Disk ] ──(DMA)──► [ OS Page Cache ] ──(CPU Copy)──► [ User Heap Buffer ]
                                                                 │
   [ Network Wire ] ◄──(DMA)── [ Socket Buffer ] ◄──(CPU Copy)───┘

2. Zero-Copy sys_sendfile (2 Context Switches, 0 CPU Copies, 2 DMA Copies via Scatter-Gather):
   [ Disk ] ──(DMA)──► [ OS Page Cache ] ──(Scatter-Gather DMA Descriptor)──► [ NIC DMA ]
```

### Java `FileChannel.transferTo()` and Off-Heap Buffers

Java exposes `sendfile(2)` via `FileChannel.transferTo()`:
```java
try (FileChannel fileChannel = FileChannel.open(filePath, StandardOpenOption.READ);
     SocketChannel socketChannel = SocketChannel.open(serverAddress)) {
    // Directly transfers from disk page cache to socket descriptor with zero JVM memory copy
    fileChannel.transferTo(0, fileChannel.size(), socketChannel);
}
```

#### Why Netty Uses Off-Heap `DirectByteBuffer`
In standard Java I/O, passing a heap `byte[]` to `socketChannel.write()` forces the JVM to copy the data into a temporary **off-heap native C buffer** first. Why? Because the JVM Garbage Collector is free to relocate `byte[]` objects in memory during a GC compaction phase at any moment! Direct ByteBuffers (`ByteBuffer.allocateDirect()` or Netty's `PooledByteBufAllocator`) allocate memory off the JVM heap via `malloc()`, eliminating the JVM GC copy penalty.

---

## Java 21 Virtual Threads (Project Loom) vs Netty EventLoops

Java 21 introduced **Virtual Threads**, allowing developers to write straightforward synchronous blocking code while the JVM schedules millions of lightweight threads onto a small pool of OS **Carrier Threads** (`ForkJoinPool`).

### How Virtual Threads Handle Socket I/O
When code calls `Socket.getInputStream().read()`:
1. Under the hood, the JDK detects blocking and calls `VirtualThread.park()`.
2. The virtual thread's stack frame is copied from the carrier thread onto the JVM heap.
3. The carrier thread is immediately freed to run another virtual thread.
4. An internal JDK `Poller` (backed by `epoll` or `kqueue`) monitors the socket FD. When data arrives, the poller unparks the virtual thread, which resumes on any available carrier thread.

### ⚠️ The Carrier Thread Pinning Trap
A virtual thread is **pinned** to its underlying OS carrier thread when:
1. It executes inside a `synchronized` block or method:
   ```java
   // ❌ DANGEROUS: Carrier thread pinning!
   public synchronized byte[] readPayload(Socket socket) throws IOException {
       return socket.getInputStream().readNBytes(1024); // Pins OS carrier thread while blocked!
   }

   // ✅ SAFE: Use ReentrantLock instead of synchronized
   private final ReentrantLock lock = new ReentrantLock();
   public byte[] readPayloadSafe(Socket socket) throws IOException {
       lock.lock();
       try {
           return socket.getInputStream().readNBytes(1024); // Safely unmounts carrier thread!
       } finally {
           lock.unlock();
       }
   }
   ```
2. It invokes a native method via JNI or Foreign Function & Memory (FFM) API.

**Netty EventLoops vs Virtual Threads**:
- For standard CRUD microservices with relational database calls, Virtual Threads provide superior developer ergonomics.
- For hyper-scale network gateways ($> 100{,}000$ active long-lived WebSocket or TLS connections), Netty's native `epoll` event-loop architecture remains the staff-engineer standard because it completely avoids stack copying, eliminates thread pinning risks, and provides fine-grained control over Linux socket options like `SO_REUSEPORT` and `TCP_DEFER_ACCEPT`.

---

## Interview Questions

### Q1. What is the difference between blocking and non-blocking I/O?
> Blocking I/O: a read/write call blocks the calling thread until data is available or the operation completes. One thread is tied up per connection. Non-blocking I/O: calls return immediately — either with data or with `EAGAIN` (no data yet). The thread can do other work while waiting. Combined with event notification (select/poll/epoll), one thread can manage thousands of connections.

### Q2. What is epoll and why is it better than select?
> epoll is a Linux kernel mechanism for scalable I/O event notification. Unlike `select` (O(n) scan of all FDs per call, 1024 FD limit), epoll: maintains a kernel-side ready list, returns only ready FDs in O(1), has no practical FD limit. `epoll_ctl` registers interest once; `epoll_wait` returns only events that fired. Used by Nginx, Redis, Node.js to handle millions of connections efficiently.

### Q3. What is the Reactor pattern?
> The Reactor pattern uses a single (or small pool of) thread(s) with an event loop. An event demultiplexer (epoll) waits for I/O events on many channels. When an event fires (new connection, data ready, write complete), it's dispatched to the appropriate handler — which must not block. The same thread handles all connections without context switching. Used by: Nginx, Redis, Node.js, Netty, Spring WebFlux.

### Q4. What is the C10K problem and how is it solved?
> The C10K problem: handling 10,000 concurrent connections with the traditional thread-per-connection model requires ~10,000 threads consuming ~10 GB of stack memory and enormous context-switching overhead. Solutions: I/O multiplexing with epoll (one thread handles all FDs via event notification), coroutines (lightweight green threads, like Go goroutines), or async/reactive programming (Spring WebFlux, Vert.x). Modern servers routinely handle millions of concurrent connections.

### Q5. What is Netty and why would you use it instead of Java's built-in sockets?
> Netty is an async, event-driven network framework built on Java NIO. Use Netty instead of raw NIO because: NIO has a notoriously complex, error-prone API; Netty handles buffer management (pooled ByteBufs), codec pipeline (HTTP, WebSocket, Protobuf), zero-copy transfers, connection pooling, and graceful shutdown correctly and efficiently. Used by: gRPC-Java, Cassandra driver, Elasticsearch client, Spring WebFlux/Reactor Netty.

### Q6. What is Nagle's algorithm and when should you disable it?
> Nagle's algorithm batches small writes: if there's unacknowledged data in flight, buffer new small writes and send them together. Reduces packet count for bulk transfers. Disable it (`TCP_NODELAY=true`) for latency-sensitive protocols: Redis client, database drivers, game servers, any request-response protocol where you send a small request and wait for a response — Nagle adds up to 200ms delay in the worst case.

### Q7. What is the backlog parameter in `ServerSocket` and what happens when it's full?
> The backlog is the maximum number of pending connections in the **SYN queue** (half-open) and **accept queue** (completed 3-way handshake, not yet accepted by application). When the backlog is full, new SYNs are silently dropped (with SYN cookies, the kernel may still respond). The client retransmits the SYN. Set backlog high enough for your traffic spike; call `accept()` fast enough to drain the queue.

### Q8. What is the difference between Spring MVC and Spring WebFlux from an I/O perspective?
> Spring MVC uses blocking I/O: one thread-per-request from a thread pool (default: Tomcat, 200 threads). When a request blocks (DB query, HTTP call), the thread waits — limiting throughput to ~200 concurrent long-running requests. Spring WebFlux uses non-blocking I/O via Netty: a small event-loop thread pool handles all I/O; blocking never occurs on those threads. Better for high-concurrency, I/O-bound workloads. WebFlux is more complex — avoid blocking calls (JDBC, synchronous libs) or they'll starve the event loop.

---

:::tip[Master Architecture Guide]
For a complete conceptual breakdown comparing **Sync vs Async**, **Blocking vs Non-blocking (the 2×2 Matrix)**, **Concurrency vs Parallelism**, and **Async vs Multi-threading Models** with interactive diagrams, see the master guide: [Concurrency, Asynchrony, Blocking & Threading Models](../system-design/concurrency-async-threading-models.md).
:::
