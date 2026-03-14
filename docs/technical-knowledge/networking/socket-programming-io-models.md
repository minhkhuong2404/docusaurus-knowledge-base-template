---
id: socket-programming-io-models
title: Socket Programming & I/O Models
description: Blocking vs non-blocking I/O, Java NIO, epoll, the C10K problem, Netty, and how event-driven servers handle massive concurrency.
tags: [networking, sockets, nio, epoll, netty, async, blocking, non-blocking, reactor, java]
sidebar_position: 10
---

# Socket Programming & I/O Models

## Sockets

A **socket** is a software abstraction for a bidirectional network endpoint — identified by `(IP address, port, protocol)`.

```
Socket = endpoint of a two-way communication link between processes

Identified by 5-tuple:
  (protocol, local_ip, local_port, remote_ip, remote_port)
  (TCP,      10.0.0.1, 54321,     10.0.0.2,  8080)
```

### Socket File Descriptor

In Unix-like systems, sockets are file descriptors (everything is a file):

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);  // TCP socket
bind(fd, &addr, sizeof(addr));              // bind to local address
listen(fd, backlog);                        // listen for connections
int client_fd = accept(fd, &client, &len); // accept a connection
read(client_fd, buf, sizeof(buf));          // read data
write(client_fd, response, len);            // write data
close(client_fd);                           // close
```

---

## I/O Models

### 1. Blocking I/O (BIO)

```
Thread calls read() → blocks until data arrives → processes → repeats

Thread 1: [──accept──][──read──blocking──][process][──write──]
Thread 2: [──accept──][──read──blocking──][process][──write──]
Thread N: [──accept──][──read──blocking──][process][──write──]

→ Need one thread per connection
→ At 10,000 connections: 10,000 threads!
→ Each thread: ~1MB stack → 10GB RAM just for stacks
→ Context switching overhead becomes severe
```

```java
// Java blocking I/O
ServerSocket server = new ServerSocket(8080);
while (true) {
    Socket client = server.accept();  // blocks
    new Thread(() -> {               // new thread per connection
        try (client) {
            byte[] buf = client.getInputStream().readAllBytes(); // blocks
            client.getOutputStream().write(response);
        }
    }).start();
}
```

### 2. Non-Blocking I/O

```
Socket set to non-blocking mode
read() returns immediately:
  - with data (if available)
  - with EAGAIN/EWOULDBLOCK (if no data yet)

Problem: busy polling
while (true) {
    for each socket:
        ret = read(fd, buf, len);   // returns immediately
        if (ret > 0) process(buf);
        // else: no data, try again
}
→ Burns CPU checking thousands of sockets
```

### 3. I/O Multiplexing — select/poll

```
select()/poll() monitors multiple FDs at once:
  - Block until any FD is ready
  - Process only ready FDs

select(max_fd, read_fds, write_fds, except_fds, timeout):
  → Returns when any fd in the set has data

Limitation (select):
  - max 1024 file descriptors (FD_SETSIZE)
  - O(n) scan of all FDs even if only 1 ready
  - FD set rebuilt and passed to kernel each call
```

### 4. epoll (Linux) / kqueue (macOS/BSD)

The solution to the **C10K problem** — handling 10,000+ concurrent connections efficiently.

```
epoll: O(1) per active event (not O(n) per fd)
  - Register interest once, kernel notifies on events
  - Returns only ready FDs (no scanning all FDs)
  - Can handle millions of concurrent connections

Flow:
1. epoll_create() → create epoll instance
2. epoll_ctl(ADD) → register socket FDs with epoll
3. epoll_wait() → block until events, returns ready FDs only
4. Process ready FDs
5. Go to 3
```

```
Comparison:
  select:  O(n) per call, 1024 fd limit
  poll:    O(n) per call, no fd limit
  epoll:   O(1) per event, no fd limit, kernel-maintained ready list
```

---

## Reactor Pattern

epoll + event loop = **Reactor pattern**:

```
        ┌────────────────────────────────────┐
        │           Event Loop               │
        │                                    │
Events  │  epoll_wait() → [fd1, fd3, fd7]   │
───────►│       ↓                            │
        │  Dispatch to handlers:             │
        │    fd1 → onRead() → process        │
        │    fd3 → onAccept() → register new │
        │    fd7 → onWrite() → flush buffer  │
        └────────────────────────────────────┘

One thread handles ALL connections
No context switching per connection
Very low memory overhead
```

**Used by**: Node.js, Nginx, Redis, Netty (Java), Vert.x.

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

## 🎯 Interview Questions

**Q1. What is the difference between blocking and non-blocking I/O?**
> Blocking I/O: a read/write call blocks the calling thread until data is available or the operation completes. One thread is tied up per connection. Non-blocking I/O: calls return immediately — either with data or with `EAGAIN` (no data yet). The thread can do other work while waiting. Combined with event notification (select/poll/epoll), one thread can manage thousands of connections.

**Q2. What is epoll and why is it better than select?**
> epoll is a Linux kernel mechanism for scalable I/O event notification. Unlike `select` (O(n) scan of all FDs per call, 1024 FD limit), epoll: maintains a kernel-side ready list, returns only ready FDs in O(1), has no practical FD limit. `epoll_ctl` registers interest once; `epoll_wait` returns only events that fired. Used by Nginx, Redis, Node.js to handle millions of connections efficiently.

**Q3. What is the Reactor pattern?**
> The Reactor pattern uses a single (or small pool of) thread(s) with an event loop. An event demultiplexer (epoll) waits for I/O events on many channels. When an event fires (new connection, data ready, write complete), it's dispatched to the appropriate handler — which must not block. The same thread handles all connections without context switching. Used by: Nginx, Redis, Node.js, Netty, Spring WebFlux.

**Q4. What is the C10K problem and how is it solved?**
> The C10K problem: handling 10,000 concurrent connections with the traditional thread-per-connection model requires ~10,000 threads consuming ~10 GB of stack memory and enormous context-switching overhead. Solutions: I/O multiplexing with epoll (one thread handles all FDs via event notification), coroutines (lightweight green threads, like Go goroutines), or async/reactive programming (Spring WebFlux, Vert.x). Modern servers routinely handle millions of concurrent connections.

**Q5. What is Netty and why would you use it instead of Java's built-in sockets?**
> Netty is an async, event-driven network framework built on Java NIO. Use Netty instead of raw NIO because: NIO has a notoriously complex, error-prone API; Netty handles buffer management (pooled ByteBufs), codec pipeline (HTTP, WebSocket, Protobuf), zero-copy transfers, connection pooling, and graceful shutdown correctly and efficiently. Used by: gRPC-Java, Cassandra driver, Elasticsearch client, Spring WebFlux/Reactor Netty.

**Q6. What is Nagle's algorithm and when should you disable it?**
> Nagle's algorithm batches small writes: if there's unacknowledged data in flight, buffer new small writes and send them together. Reduces packet count for bulk transfers. Disable it (`TCP_NODELAY=true`) for latency-sensitive protocols: Redis client, database drivers, game servers, any request-response protocol where you send a small request and wait for a response — Nagle adds up to 200ms delay in the worst case.

**Q7. What is the backlog parameter in `ServerSocket` and what happens when it's full?**
> The backlog is the maximum number of pending connections in the **SYN queue** (half-open) and **accept queue** (completed 3-way handshake, not yet accepted by application). When the backlog is full, new SYNs are silently dropped (with SYN cookies, the kernel may still respond). The client retransmits the SYN. Set backlog high enough for your traffic spike; call `accept()` fast enough to drain the queue.

**Q8. What is the difference between Spring MVC and Spring WebFlux from an I/O perspective?**
> Spring MVC uses blocking I/O: one thread-per-request from a thread pool (default: Tomcat, 200 threads). When a request blocks (DB query, HTTP call), the thread waits — limiting throughput to ~200 concurrent long-running requests. Spring WebFlux uses non-blocking I/O via Netty: a small event-loop thread pool handles all I/O; blocking never occurs on those threads. Better for high-concurrency, I/O-bound workloads. WebFlux is more complex — avoid blocking calls (JDBC, synchronous libs) or they'll starve the event loop.
