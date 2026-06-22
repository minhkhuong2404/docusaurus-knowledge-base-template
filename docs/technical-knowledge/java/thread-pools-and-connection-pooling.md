---
id: thread-pools-and-connection-pooling
title: "Thread Pools, Netty, Tomcat & HikariCP — The Complete Guide"
slug: thread-pools-and-connection-pooling
description: "A comprehensive deep dive into Java thread pools, Netty's event loop model, Tomcat's connector architecture, HikariCP connection pooling, and how they all relate in a Spring Boot application."
tags: [java, concurrency, thread-pool, netty, tomcat, hikaricp, connection-pool, spring-boot, performance]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Thread Pools, Netty, Tomcat & HikariCP

:::info[Who this guide is for]
- **New learners** — start at [What is a Thread Pool?](#1-thread-pools--threadpoolexecutor) to understand why pooling exists and how it works internally.
- **Intermediate** — jump to [Tomcat](#2-tomcat--embedded-server-threads) or [Netty](#3-netty--event-loop-architecture) to understand the server layer.
- **Senior engineers** — see [How They All Relate](#5-how-they-all-relate), [Production Sizing](#6-production-sizing-guide), and [Troubleshooting](#7-troubleshooting--common-failures).
:::

---

## 1. Thread Pools — `ThreadPoolExecutor`

### What is a Thread Pool?

A **thread pool** is a managed collection of pre-created threads that are reused to execute tasks. Instead of creating a new OS thread for every task (expensive: ~1MB stack + kernel call), the pool maintains a fixed number of threads that pick tasks from a queue.

```
Without a pool:
  Task 1 → create Thread → run → destroy Thread
  Task 2 → create Thread → run → destroy Thread
  Task 3 → create Thread → run → destroy Thread
  Cost: 3 × (1ms create + 1ms destroy) = 6ms overhead

With a pool:
  Pool: [Thread-1] [Thread-2] [Thread-3]  ← pre-created, reused
  Task 1 → Thread-1 picks it up → runs → Thread-1 returns to pool
  Task 2 → Thread-2 picks it up → runs → Thread-2 returns to pool
  Cost: 0ms overhead (threads already exist)
```

### How `ThreadPoolExecutor` Works Internally

`java.util.concurrent.ThreadPoolExecutor` is the engine behind all Java thread pools. Understanding its internals prevents catastrophic production failures.

#### Constructor Parameters

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                                // corePoolSize
    8,                                // maximumPoolSize
    60, TimeUnit.SECONDS,             // keepAliveTime
    new ArrayBlockingQueue<>(100),    // workQueue
    new ThreadFactory() { ... },      // threadFactory
    new CallerRunsPolicy()            // rejectionHandler
);
```

| Parameter | What It Controls | Why It Matters |
|-----------|-----------------|----------------|
| `corePoolSize` | Threads that stay alive even when idle | Too low → tasks queue; too high → wasted RAM |
| `maximumPoolSize` | Absolute thread ceiling under burst load | Safety valve — prevents unbounded thread creation |
| `keepAliveTime` | How long non-core threads survive idle | Lets burst threads die after the spike passes |
| `workQueue` | Buffer for tasks when all core threads are busy | **Bounded** = backpressure; **Unbounded** = OOM risk |
| `threadFactory` | Custom thread naming and daemon settings | Named threads = readable thread dumps |
| `rejectionHandler` | What happens when pool AND queue are full | `CallerRunsPolicy` = natural backpressure |

#### Task Submission Flow (Critical for Interviews)

```
Task submitted to ThreadPoolExecutor
│
├── Are there idle core threads?
│   YES → Assign task to an idle core thread
│   NO ↓
│
├── Is the work queue full?
│   NO → Add task to the queue (waits for a thread)
│   YES ↓
│
├── Is maximumPoolSize reached?
│   NO → Create a new non-core thread to handle the task
│   YES ↓
│
└── Execute the RejectionPolicy
    ├── AbortPolicy (default): throw RejectedExecutionException
    ├── CallerRunsPolicy: run task in the caller's thread ← backpressure
    ├── DiscardPolicy: silently drop the task
    └── DiscardOldestPolicy: drop oldest queued task, retry
```

```
Visual timeline:

corePoolSize=2, maxPoolSize=4, queue=3

Tasks:  T1  T2  T3  T4  T5  T6  T7  T8
        │   │   │   │   │   │   │   │
Core:  [T1][T2]                         ← Core threads handle T1, T2
Queue:      [T3][T4][T5]                ← Queue absorbs T3–T5
Non-core:            [T6][T7]           ← Non-core threads created for T6, T7
Reject:                   [T8] ← RejectionPolicy triggered
```

:::danger[Why `Executors` Factory Methods Are Dangerous]
| Factory Method | Hidden Danger |
|---|---|
| `Executors.newFixedThreadPool(n)` | Uses **unbounded** `LinkedBlockingQueue` → tasks pile up → OOM |
| `Executors.newCachedThreadPool()` | `maximumPoolSize = Integer.MAX_VALUE` → creates unlimited threads → OOM |
| `Executors.newSingleThreadExecutor()` | Unbounded queue → same OOM risk as fixed pool |

**Always** use `ThreadPoolExecutor` directly with bounded queues in production.
:::

### Sizing Thread Pools

#### CPU-Bound Tasks

Tasks that compute without waiting (sorting, encryption, JSON parsing):

```
Optimal threads = CPU_cores + 1

Why +1? Insurance against page faults. If one thread stalls on
a memory page fault, the extra thread keeps the CPU busy.

Example: 8-core server → 9 threads for CPU-bound work
```

#### I/O-Bound Tasks

Tasks that spend most of their time waiting (DB queries, HTTP calls, file reads):

```
Optimal threads = CPU_cores × target_utilization × (1 + wait_time / compute_time)

Example:
  8 cores, 70% CPU target
  Average HTTP call: 200ms wait, 2ms compute
  = 8 × 0.7 × (1 + 200/2) = 8 × 0.7 × 101 = 565 threads

Rule of thumb: if tasks are 99% waiting, you need ~100× more
threads than cores to keep the CPU busy.
```

### Spring Boot `@Async` Thread Pool

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("async-worker-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

> **See also:** [Java Concurrency — Thread Pools & Executors](./java-concurrency#5-thread-pools--executors) for `ThreadPoolExecutor` constructor walkthrough, starvation math, and `ScheduledExecutorService`.

---

## 2. Tomcat — Embedded Server Threads

### What is Tomcat?

Apache Tomcat is the **default embedded servlet container** in Spring Boot. It handles HTTP connections and dispatches requests to your controllers. Tomcat uses a **thread-per-request** model: each incoming HTTP request gets a dedicated thread from a pool.

### Tomcat's Internal Architecture

```
                        Internet
                           │
                           ▼
┌─────────────────────────────────────────────────┐
│                    TOMCAT                         │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │              Connector (HTTP/1.1)            │ │
│  │                                              │ │
│  │  Acceptor Thread ←── OS socket backlog       │ │
│  │       │                                      │ │
│  │       ▼                                      │ │
│  │  Poller Thread(s) ←── NIO selector           │ │
│  │       │              (epoll/kqueue)          │ │
│  │       ▼                                      │ │
│  │  ┌──────────────────────────────────────┐    │ │
│  │  │        Worker Thread Pool            │    │ │
│  │  │  [T1] [T2] [T3] ... [T200]          │    │ │
│  │  │  max-threads=200 (default)           │    │ │
│  │  └──────────┬───────────────────────────┘    │ │
│  └─────────────┼────────────────────────────────┘ │
│                ▼                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │         DispatcherServlet (Spring)           │ │
│  │              → Controller                    │ │
│  │              → Service                       │ │
│  │              → Repository (JDBC → HikariCP)  │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### How Tomcat Processes a Request

```
1. Acceptor Thread
   - Calls ServerSocketChannel.accept()
   - Accepts TCP connections from the OS accept queue
   - Registers the new socket with the Poller

2. Poller Thread (NIO)
   - Monitors all registered sockets via Selector (epoll/kqueue)
   - Waits for data to arrive on any socket
   - When data is ready, hands the socket to a Worker Thread

3. Worker Thread (from the pool)
   - Reads the HTTP request
   - Invokes the servlet (DispatcherServlet → your @Controller)
   - Writes the HTTP response
   - Returns to the pool

The worker thread is OCCUPIED for the entire request lifecycle.
If your controller makes a 2-second DB query, the thread is
blocked for 2 seconds doing nothing.
```

### Tomcat Configuration

```yaml
server:
  tomcat:
    # === Worker Thread Pool ===
    threads:
      max: 200           # Maximum worker threads (default: 200)
      min-spare: 10      # Minimum idle threads kept warm (default: 10)

    # === Connection Limits ===
    max-connections: 8192 # Max simultaneous connections the Poller can track (default: 8192)
    accept-count: 100     # OS-level TCP backlog queue when max-connections is reached (default: 100)

    # === Timeouts ===
    connection-timeout: 20000  # ms to wait for first byte after TCP connect (default: 20s)

    # === Keep-Alive ===
    keep-alive-timeout: 20000  # ms to keep an idle connection open for reuse
    max-keep-alive-requests: 100  # requests per keep-alive connection before closing
```

#### Understanding the Numbers

```
max-connections (8192)          → Poller can track this many sockets
  ↓
max-threads (200)               → Only 200 can be actively processed
  ↓
accept-count (100)              → OS queues 100 more when max-connections hit
  ↓
Beyond that                     → TCP RST (connection refused)

In steady state with short requests:
  200 threads × 10ms avg response = 20,000 requests/sec throughput

With slow requests (2s average):
  200 threads × 2000ms = 200 concurrent users max
  User #201 waits in the Poller queue
```

### Tomcat vs Jetty vs Undertow

| Feature | Tomcat | Jetty | Undertow |
|---------|--------|-------|----------|
| **Default in Spring Boot** | ✅ Yes | No | No |
| **Threading model** | Thread-per-request (NIO) | Thread-per-request (NIO) | XNIO (non-blocking) |
| **WebSocket support** | ✅ | ✅ | ✅ |
| **HTTP/2** | ✅ | ✅ | ✅ |
| **Memory footprint** | Medium | Lower | Lowest |
| **Best for** | General purpose | Lightweight apps | High-performance, reactive |

> **See also:** [Spring Boot Internals — Embedded Server Architecture](../spring/spring-boot-internals#embedded-server-architecture) for how Spring Boot auto-configures the servlet container.

---

## 3. Netty — Event Loop Architecture

### What is Netty?

Netty is an **asynchronous, event-driven network application framework** for building high-performance protocol servers and clients. Unlike Tomcat's thread-per-request model, Netty uses a small number of **event loop threads** to handle thousands of connections simultaneously.

Netty is the engine behind: **Spring WebFlux**, **gRPC-Java**, **Cassandra Driver**, **Elasticsearch transport**, **Vert.x**, and **Kafka clients**.

### How Netty Works Internally

```
Traditional (Tomcat): 1 Thread = 1 Connection
  Thread-1 → [read][process][write]  ← blocked during I/O
  Thread-2 → [read][process][write]  ← blocked during I/O
  ...
  Thread-200 → [read][process][write]
  → 200 threads = 200 concurrent connections max

Netty: 1 Thread = MANY Connections
  EventLoop-1 → [read fd1][read fd5][write fd3][read fd9][write fd1]...
  EventLoop-2 → [read fd2][read fd7][write fd4][read fd8][write fd6]...
  ...
  EventLoop-8 → [read fd10][write fd12][read fd15]...
  → 8 threads = 10,000+ concurrent connections
```

### Netty Architecture (Boss-Worker Model)

```
┌──────────────────────────────────────────────────────────────┐
│                         NETTY                                 │
│                                                               │
│  Boss EventLoopGroup (1 thread typically)                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ BossEventLoop                                         │    │
│  │   Selector.select() → accept new connections          │    │
│  │   Register accepted channels with Worker EventLoop    │    │
│  └──────────────────────────────────────────────────────┘    │
│       │                                                       │
│       ▼  (hand off new channel)                              │
│                                                               │
│  Worker EventLoopGroup (N threads, default = 2 × CPU cores)  │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │ WorkerLoop-1   │ │ WorkerLoop-2   │ │ WorkerLoop-N   │   │
│  │                │ │                │ │                │   │
│  │ Channels:      │ │ Channels:      │ │ Channels:      │   │
│  │ [fd1,fd5,fd9]  │ │ [fd2,fd6,fd10] │ │ [fd4,fd8,fd12] │   │
│  │                │ │                │ │                │   │
│  │ Event Loop:    │ │ Event Loop:    │ │ Event Loop:    │   │
│  │ select()       │ │ select()       │ │ select()       │   │
│  │ → read events  │ │ → read events  │ │ → read events  │   │
│  │ → run pipeline │ │ → run pipeline │ │ → run pipeline │   │
│  │ → write events │ │ → write events │ │ → write events │   │
│  └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                               │
│  Each channel has a ChannelPipeline:                          │
│  ┌───────────┬───────────┬───────────┬───────────────────┐   │
│  │ Decoder   │ Encoder   │ Idle      │ Business Logic    │   │
│  │ (bytes→   │ (object→  │ Handler   │ Handler           │   │
│  │  object)  │  bytes)   │           │                   │   │
│  └───────────┴───────────┴───────────┴───────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Key Netty Concepts

| Concept | What It Is | Analogy |
|---------|-----------|---------|
| **Channel** | An open connection (socket) | A phone line |
| **EventLoop** | A single thread running an infinite `select()` loop | A switchboard operator |
| **EventLoopGroup** | A pool of EventLoops | The operator team |
| **ChannelPipeline** | Chain of handlers processing data | Assembly line |
| **ChannelHandler** | A processing step (decode, encode, business logic) | A station on the assembly line |
| **ByteBuf** | Netty's buffer (replaces `java.nio.ByteBuffer`) | A smarter byte array with read/write indexes |

### Netty Configuration

```java
EventLoopGroup bossGroup = new NioEventLoopGroup(1);    // 1 thread for accepting
EventLoopGroup workerGroup = new NioEventLoopGroup();   // default: 2 × CPU cores

ServerBootstrap b = new ServerBootstrap();
b.group(bossGroup, workerGroup)
 .channel(NioServerSocketChannel.class)

 // TCP backlog — OS-level queue for pending connections
 .option(ChannelOption.SO_BACKLOG, 1024)

 // Child channel options (per-connection settings)
 .childOption(ChannelOption.TCP_NODELAY, true)     // Disable Nagle's algorithm
 .childOption(ChannelOption.SO_KEEPALIVE, true)    // Enable TCP keep-alive
 .childOption(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT) // Pooled memory

 .childHandler(new ChannelInitializer<SocketChannel>() {
     @Override
     protected void initChannel(SocketChannel ch) {
         ch.pipeline()
           .addLast(new HttpServerCodec())              // HTTP encode/decode
           .addLast(new HttpObjectAggregator(65536))    // Aggregate HTTP chunks
           .addLast(new IdleStateHandler(60, 30, 0))    // Detect idle connections
           .addLast(new MyBusinessHandler());            // Your logic
     }
 });
```

:::warning[The Golden Rule of Netty]
**NEVER block an EventLoop thread.** If your handler does blocking I/O (JDBC query, synchronous HTTP call, `Thread.sleep()`), you block that EventLoop — and ALL channels assigned to it are frozen.

```java
// ❌ NEVER DO THIS in a ChannelHandler
@Override
public void channelRead(ChannelHandlerContext ctx, Object msg) {
    // This blocks the EventLoop → freezes hundreds of connections
    String result = jdbcTemplate.queryForObject("SELECT ...", String.class);
    ctx.writeAndFlush(result);
}

// ✅ Offload blocking work to a separate thread pool
private final EventExecutorGroup blockingGroup =
    new DefaultEventExecutorGroup(16);  // dedicated pool for blocking ops

ch.pipeline().addLast(blockingGroup, new MyBlockingHandler());
```
:::

> **See also:** [Socket Programming & I/O Models](../networking/socket-programming-io-models) for epoll, the Reactor pattern, and how Netty uses them under the hood.

---

## 4. HikariCP — Database Connection Pooling

### What is HikariCP?

HikariCP is the **fastest JVM connection pool** and the **default in Spring Boot 2.x+**. It manages a cache of pre-opened, pre-authenticated database connections that threads borrow and return — eliminating the 10–100ms overhead of establishing a new connection per request.

### How HikariCP Works Internally

```
                    HikariCP Internals
┌──────────────────────────────────────────────────────┐
│                                                       │
│  ConcurrentBag (lock-free data structure)             │
│  ┌──────────────────────────────────────────────┐    │
│  │ Thread-local list → try borrow from own list  │    │
│  │    ↓ miss                                     │    │
│  │ Shared list → CAS-based steal from shared     │    │
│  │    ↓ miss                                     │    │
│  │ Handoff queue → wait with park/unpark         │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  HouseKeeper Thread (every 30s):                      │
│  ├── Evict idle connections beyond minimum-idle       │
│  ├── Retire connections older than max-lifetime       │
│  └── Create new connections if below minimum-idle     │
│                                                       │
│  Connection validation:                               │
│  ├── On borrow: Connection.isValid(timeout)           │
│  ├── Keepalive: periodic ping (keepalive-time)        │
│  └── Max-lifetime: recycle after age limit            │
│                                                       │
│  Metrics (Micrometer integration):                    │
│  ├── hikaricp.connections.active                      │
│  ├── hikaricp.connections.idle                        │
│  ├── hikaricp.connections.pending                     │
│  ├── hikaricp.connections.timeout                     │
│  └── hikaricp.connections.usage (histogram)           │
└──────────────────────────────────────────────────────┘
```

#### The ConcurrentBag — Why HikariCP Is So Fast

HikariCP's secret weapon is `ConcurrentBag`, a lock-free data structure:

```
Step 1: Thread-Local Borrow (fastest path — no contention)
  Thread A previously returned Connection C1
  Thread A requests a connection
  → ConcurrentBag checks Thread A's thread-local list
  → C1 is there! Borrow it in ~250 nanoseconds
  
Step 2: Shared List Steal (fast — CAS operation)
  Thread B requests a connection (first time, no thread-local history)
  → Check shared connection list
  → CAS (compare-and-swap) to claim an idle connection
  → ~500 nanoseconds

Step 3: Handoff Queue (slowest — waits for a return)
  All connections are borrowed
  Thread C requests a connection
  → Parks the thread (waits up to connection-timeout)
  → When any thread returns a connection, C is unparked
  → If timeout expires → SQLTransientConnectionException
```

### HikariCP Configuration (Production-Ready)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db-host:5432/mydb
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      # === Pool Size ===
      maximum-pool-size: 20      # Total connections (active + idle)
      minimum-idle: 20           # Fixed-size pool (no dynamic churn)

      # === Timeouts ===
      connection-timeout: 3000   # 3s — fail fast, don't queue for 30s
      idle-timeout: 600000       # 10min — only matters if min-idle < max
      max-lifetime: 1800000      # 30min — recycle before DB kills them
      validation-timeout: 3000   # 3s — how long to test a connection

      # === Health ===
      keepalive-time: 30000      # Ping idle connections every 30s
      leak-detection-threshold: 5000  # Warn if connection held > 5s

      # === Identity ===
      pool-name: HikariPool-Orders
```

### Pool Sizing Formula

```
connections = (CPU_cores × 2) + effective_spindle_count

Where:
  CPU_cores             = physical cores on the DATABASE server
  effective_spindle_count = 1 for SSD, disk count for RAID

Examples:
  4-core DB, SSD:   (4 × 2) + 1 = 9  → set to 10
  8-core DB, SSD:   (8 × 2) + 1 = 17 → set to 20
  
Divide by app instances:
  20 total connections, 4 pods → 5 per pod
```

:::tip[Fixed-Size Pool is Best for Production]
Set `minimum-idle = maximum-pool-size`. A dynamic pool that shrinks during quiet periods means cold-start latency during the next traffic spike (new connections take 10–100ms each).
:::

> **See also:** [Database Connection Pooling](../database/connection-pooling) for the complete guide on pool starvation, failure modes, PgBouncer, RDS Proxy, and anti-patterns.

---

## 5. How They All Relate

### The Full Request Flow

Understanding how thread pools, Tomcat, Netty, and HikariCP interact in a single HTTP request is the key to diagnosing performance issues.

<Tabs>
  <TabItem value="spring-mvc" label="Spring MVC (Tomcat)" default>

```
HTTP Request arrives
│
▼
┌─────────────────────────────────┐
│  TOMCAT                          │
│  Acceptor → Poller → Worker Pool │
│  Thread "http-nio-8080-exec-42"  │──────────────────────────────────┐
└─────────────────────────────────┘                                   │
│                                                                      │
▼                                                                      │
┌──────────────────────────────────┐                                   │
│  Spring DispatcherServlet         │                                   │
│  @Controller → @Service           │                                   │
│                                    │                                   │
│  orderService.getOrder(42)         │                                   │
│       │                            │                                   │
│       ▼                            │                                   │
│  ┌──────────────────────────────┐ │                                   │
│  │  HikariCP                     │ │  Tomcat worker thread is         │
│  │  Borrow connection            │ │  BLOCKED during the entire       │
│  │  → Execute SQL query          │ │  DB query + response write       │
│  │  → Return connection          │ │                                   │
│  └──────────────────────────────┘ │                                   │
│                                    │                                   │
│  Build response → return           │                                   │
└──────────────────────────────────┘                                   │
│                                                                      │
▼                                                                      │
Response sent back ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
Thread "http-nio-8080-exec-42" returns to Tomcat's pool
```

**Key insight:** The Tomcat worker thread is occupied for the **entire** request lifecycle — including time spent waiting for the DB.

  </TabItem>
  <TabItem value="webflux" label="Spring WebFlux (Netty)">

```
HTTP Request arrives
│
▼
┌──────────────────────────────────┐
│  NETTY                            │
│  Boss EventLoop → Worker EventLoop │
│  Thread "reactor-http-nio-3"       │──────────────────┐
└──────────────────────────────────┘                    │
│                                                        │
▼                                                        │
┌──────────────────────────────────┐                    │
│  Spring WebFlux                    │                    │
│  RouterFunction / @Controller      │                    │
│                                    │                    │
│  orderService.getOrder(42)         │                    │
│       │                            │   EventLoop thread │
│       ▼  returns Mono<Order>       │   is FREE here!    │
│  ┌──────────────────────────────┐ │   It handles other  │
│  │  R2DBC (reactive DB driver)   │ │   connections while │
│  │  Non-blocking query           │ │   waiting for DB.   │
│  │  → DB responds asynchronously │ │                    │
│  └──────────────────────────────┘ │                    │
│                                    │                    │
│  Mono completes → write response   │←─ EventLoop picks  │
└──────────────────────────────────┘   this up again      │
│                                                        │
▼                                                        │
Response sent back ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Key insight:** The Netty EventLoop thread is **never blocked**. It handles other connections while the DB query is in-flight.

  </TabItem>
  <TabItem value="virtual" label="Spring MVC + Virtual Threads">

```
HTTP Request arrives
│
▼
┌─────────────────────────────────┐
│  TOMCAT (with Virtual Threads)    │
│  Worker = Virtual Thread           │
│  VThread "vt-http-42"              │
└─────────────────────────────────┘
│
▼
┌──────────────────────────────────┐
│  Spring DispatcherServlet         │
│  @Controller → @Service           │
│                                    │
│  orderService.getOrder(42)         │
│       │                            │
│       ▼                            │
│  ┌──────────────────────────────┐ │
│  │  HikariCP                     │ │  Virtual thread UNMOUNTS
│  │  Borrow connection            │ │  from carrier thread.
│  │  (if pool full → VT parks)    │ │  Carrier is free to run
│  │  → Execute SQL query          │ │  other virtual threads!
│  │  (VT unmounts during I/O)     │ │
│  │  → Return connection          │ │
│  └──────────────────────────────┘ │
│                                    │
│  Build response → return           │
└──────────────────────────────────┘
│
▼
Response sent back
Virtual thread is garbage collected (not returned to a pool)
```

**Key insight:** Virtual threads give you Tomcat's simple programming model (blocking code) with Netty-like efficiency (threads aren't wasted during I/O).

  </TabItem>
</Tabs>

### The Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                       │
│                                                           │
│  ┌───────────────────┐    ┌───────────────────────────┐  │
│  │   HTTP Server       │    │   Database Access          │  │
│  │                     │    │                             │  │
│  │ ┌──── Tomcat ─────┐│    │  ┌─── HikariCP ──────────┐│  │
│  │ │ Thread Pool     ││    │  │ Connection Pool        ││  │
│  │ │ (200 workers)   ││    │  │ (20 connections)       ││  │
│  │ └────────────────┘││    │  └────────────────────────┘│  │
│  │ ┌──── Netty ──────┐│    │                             │  │
│  │ │ EventLoopGroup  ││    │  ┌─── R2DBC Pool ─────────┐│  │
│  │ │ (8 event loops) ││    │  │ Reactive connections    ││  │
│  │ └────────────────┘││    │  └────────────────────────┘│  │
│  └───────────────────┘    └───────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │   Application Thread Pools                            ││
│  │   ┌────────────────┐  ┌─────────────────────────┐   ││
│  │   │ @Async pool     │  │ @Scheduled pool          │   ││
│  │   │ (business logic)│  │ (cron/timer tasks)       │   ││
│  │   └────────────────┘  └─────────────────────────┘   ││
│  │   ┌────────────────┐  ┌─────────────────────────┐   ││
│  │   │ ForkJoinPool    │  │ Virtual Thread Executor  │   ││
│  │   │ (parallelStream)│  │ (Java 21+)               │   ││
│  │   └────────────────┘  └─────────────────────────┘   ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Concurrency Model Comparison

| Aspect | Tomcat (BIO/NIO) | Netty | Virtual Threads |
|--------|-----------------|-------|-----------------|
| **Model** | Thread-per-request | Event loop | Virtual-thread-per-request |
| **Threads needed** | ~200 for 200 concurrent | ~8 for 10,000+ concurrent | Millions possible |
| **Blocking I/O** | Blocks a worker thread | ❌ Must never block | ✅ Safe — unmounts from carrier |
| **Code style** | Simple imperative | Callback/reactive | Simple imperative |
| **Memory per connection** | ~1MB (thread stack) | ~1KB (channel state) | ~1KB (heap continuation) |
| **Spring integration** | Spring MVC | Spring WebFlux | Spring MVC (3.2+) |
| **DB access** | JDBC + HikariCP | R2DBC (reactive) | JDBC + HikariCP |
| **Best for** | Traditional CRUD APIs | High-connection servers | I/O-heavy APIs on Java 21+ |

---

## 6. Production Sizing Guide

### The Bottleneck Chain

```
Internet → Load Balancer → Tomcat Threads → HikariCP Connections → Database CPU
                                ↑                    ↑                    ↑
                           Bottleneck 1         Bottleneck 2         Bottleneck 3

If Tomcat has 200 threads but HikariCP has 10 connections:
  → 190 threads will queue waiting for a connection
  → If those threads also serve other endpoints, the ENTIRE API stalls

If HikariCP has 200 connections but the DB only has 8 CPU cores:
  → 192 queries queue in the DB waiting for CPU
  → Query latency spikes → connection hold time increases → pool exhaustion
```

### Sizing Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│ Component          │ Formula / Rule                              │
├────────────────────┼────────────────────────────────────────────┤
│ Tomcat max-threads │ Start at 200 (default). Tune down if CPU   │
│                    │ context-switching dominates.                │
├────────────────────┼────────────────────────────────────────────┤
│ HikariCP pool-size │ (DB_CPU × 2) + 1, divided by # app pods   │
│                    │ Example: 8-core DB, 4 pods → 5 per pod     │
├────────────────────┼────────────────────────────────────────────┤
│ Netty workers      │ 2 × CPU cores (default). Rarely needs      │
│                    │ adjustment.                                 │
├────────────────────┼────────────────────────────────────────────┤
│ @Async pool        │ CPU-bound: cores + 1                       │
│                    │ I/O-bound: cores × (1 + wait/compute)      │
├────────────────────┼────────────────────────────────────────────┤
│ ForkJoinPool       │ Defaults to CPU cores. Only for CPU-bound   │
│                    │ parallel work (parallel streams).           │
├────────────────────┼────────────────────────────────────────────┤
│ Virtual Threads    │ Don't pool them. Unlimited. Use Semaphore   │
│                    │ to guard downstream resources.              │
└─────────────────────────────────────────────────────────────────┘
```

### The Mismatch Deadlock

A critical failure mode when thread pool and connection pool sizes don't match:

```
Scenario:
  Tomcat max-threads = 200
  HikariCP maximum-pool-size = 10
  connection-timeout = 30s (default)

Step 1: 200 requests arrive simultaneously
Step 2: Threads 1–10 borrow all 10 connections
Step 3: Threads 11–200 queue for connections (up to 30s each)
Step 4: Thread 1 (holding C1) makes an internal REST call to /api/helper
Step 5: /api/helper request arrives → needs a connection too
Step 6: All connections are held → /api/helper waits 30s
Step 7: Thread 1 waits for /api/helper → can't release C1
Step 8: DEADLOCK — nobody makes progress

Fix:
  1. Set connection-timeout to 3s (fail fast)
  2. Use separate pools for internal sub-requests
  3. Ensure pool size ≥ max threads that need concurrent connections
```

---

## 7. Troubleshooting & Common Failures

### Symptoms → Diagnosis → Fix

| Symptom | Likely Cause | Diagnosis | Fix |
|---------|-------------|-----------|-----|
| Response times spike under load | Pool starvation (thread or connection) | Check `hikaricp.connections.pending > 0` or high thread count | Reduce `connection-timeout`, fix slow queries |
| `SQLTransientConnectionException` | All connections borrowed, timeout expired | `hikaricp.connections.timeout` counter increasing | Increase pool size OR fix connection hold time |
| `RejectedExecutionException` | Thread pool + queue both full | Thread dump shows all threads busy | Increase queue or threads; fix slow handlers |
| CPU at 100% with no useful work | Too many threads → context switching | `vmstat` shows high `cs` (context switch) rate | Reduce thread count |
| Memory growing (OOM) | Unbounded queue or thread count | Heap dump shows many task objects or threads | Use bounded queues; explicit `ThreadPoolExecutor` |
| Tomcat stops accepting requests | All 200 worker threads blocked | Thread dump shows all threads in `WAITING` on HikariCP | Fix connection leak; reduce connection-timeout |
| Netty EventLoop blocked | Blocking call in a ChannelHandler | Slow channel handlers, increasing event loop latency | Offload blocking work to separate executor |

### Essential Metrics to Monitor

```yaml
# Spring Boot Actuator + Micrometer

# Tomcat thread pool
tomcat.threads.current          # Current thread count
tomcat.threads.busy             # Threads actively processing requests
tomcat.threads.config.max       # Maximum configured threads

# HikariCP connection pool
hikaricp.connections.active     # Connections currently in use
hikaricp.connections.idle       # Connections sitting idle
hikaricp.connections.pending    # Threads waiting for a connection ← ALERT if > 0
hikaricp.connections.timeout    # Connection borrow timeouts (cumulative)
hikaricp.connections.usage      # Connection hold time histogram

# JVM threads
jvm.threads.live                # Total live threads
jvm.threads.peak                # Peak thread count since startup
jvm.threads.daemon              # Daemon threads
```

### Thread Dump Analysis

```bash
# Get a thread dump of your Java process
jstack <pid> > threaddump.txt

# What to look for:
# 1. Many threads in WAITING state on HikariCP
"http-nio-8080-exec-42" WAITING
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)
  → Pool starvation — all connections are borrowed

# 2. Many threads BLOCKED on synchronized
"http-nio-8080-exec-15" BLOCKED
  at com.example.LegacyService.criticalSection(LegacyService.java:42)
  → Lock contention — single synchronized method is a bottleneck

# 3. Deadlock detected
"Found one Java-level deadlock:"
  → Thread A holds Lock 1, waits for Lock 2
  → Thread B holds Lock 2, waits for Lock 1
```

---

## 8. Interview Questions

### Q: Explain the relationship between Tomcat's thread pool and HikariCP's connection pool.

**A:** Tomcat's thread pool handles HTTP requests — each request gets a worker thread. When that request needs the database, the worker thread borrows a connection from HikariCP. The Tomcat thread is **blocked** until the DB query completes and the connection is returned. If HikariCP has fewer connections than Tomcat has threads (common: 200 threads vs 10–20 connections), excess threads queue. This is fine for fast queries (under 5ms) but dangerous for slow queries — threads pile up waiting, leading to pool starvation and cascading timeouts.

### Q: Why does Netty need far fewer threads than Tomcat?

**A:** Tomcat uses thread-per-request: each thread blocks during I/O. With 200 threads, you handle 200 concurrent requests max. Netty uses the Reactor pattern: a few EventLoop threads multiplex thousands of connections via `epoll`/`kqueue`. When data isn't ready on a socket, the EventLoop serves another channel instead of blocking. This means 8 threads can handle 10,000+ concurrent connections — but you must never block an EventLoop thread, or all its channels freeze.

### Q: What happens when you enable virtual threads in Spring Boot 3.2+?

**A:** Setting `spring.threads.virtual.enabled=true` makes Tomcat use virtual threads instead of platform threads for request handling. Each request gets its own virtual thread (not from a fixed pool). When the virtual thread blocks on I/O (JDBC query, HTTP call), it **unmounts** from the carrier thread — the carrier is free to run other virtual threads. This gives Tomcat-like simplicity (blocking code) with Netty-like efficiency (threads aren't wasted during I/O). The new bottleneck shifts from threads to **connection pools** — you must size HikariCP and use Semaphores to prevent 100K virtual threads from overwhelming the database.

### Q: How would you size a HikariCP pool for a 4-pod deployment against an 8-core RDS instance?

**A:** Use the formula: `connections = (CPU_cores × 2) + 1 = 17`. Round to 20 total connections. With 4 pods: `20 / 4 = 5 connections per pod`. Set `maximum-pool-size: 5` and `minimum-idle: 5` (fixed pool). If you scale to 8 pods without adjusting, you'd get 40 total connections — overloading the DB. Either reduce per-pod pool size or add PgBouncer/RDS Proxy as a connection multiplexer.

### Q: Why is `Executors.newFixedThreadPool()` considered dangerous?

**A:** It uses an **unbounded** `LinkedBlockingQueue`. If tasks arrive faster than threads can process them, the queue grows without limit — consuming heap memory until `OutOfMemoryError`. In production, always use `ThreadPoolExecutor` directly with a **bounded** `ArrayBlockingQueue` and a rejection policy like `CallerRunsPolicy` for backpressure.

### Q: How do you diagnose pool starvation?

**A:** Monitor `hikaricp.connections.pending` (threads waiting for connections) and `hikaricp.connections.timeout` (failed borrows). Take a thread dump — if many threads are in `WAITING` state at `HikariPool.getConnection()`, the pool is starved. Root causes: slow queries (N+1, missing indexes), connections held during non-DB work (`@Transactional` wrapping HTTP calls), or pool too small for the workload. Fix the query first; increase pool size only as a last resort.

---

## 🔗 Cross-References

| Topic | Link |
|-------|------|
| ThreadPoolExecutor & Fork/Join details | [Java Concurrency](./java-concurrency) |
| Virtual Threads deep dive | [Virtual Threads (Project Loom)](./java-virtual-threads) |
| HikariCP anti-patterns & PgBouncer | [Database Connection Pooling](../database/connection-pooling) |
| Netty, epoll, and the Reactor pattern | [Socket Programming & I/O Models](../networking/socket-programming-io-models) |
| Tomcat embedded server internals | [Spring Boot Internals](../spring/spring-boot-internals) |
| JVM memory & thread stacks | [JVM Memory Architecture](./java-jvm) |
| Spring Boot server tuning | [Spring Boot Advanced](../spring/spring-boot-advanced#performance-tuning) |
