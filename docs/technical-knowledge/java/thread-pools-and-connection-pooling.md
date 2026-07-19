---
id: thread-pools-and-connection-pooling
title: "Thread Pools, Netty, Tomcat & HikariCP — The Complete Guide"
slug: thread-pools-and-connection-pooling
description: "A comprehensive deep dive into Java thread pools, Netty's event loop model, Tomcat's connector architecture, HikariCP connection pooling, and how they all relate in a Spring Boot application."
tags: [java, concurrency, thread-pool, netty, tomcat, hikaricp, connection-pool, spring-boot, performance]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import TomcatArchitectureDiagram from '@site/src/components/TomcatArchitectureDiagram';
import NettyArchitectureDiagram from '@site/src/components/NettyArchitectureDiagram';
import RequestPipelineModelDiagram from '@site/src/components/RequestPipelineModelDiagram';
import AppServerThreadTopologyDiagram from '@site/src/components/AppServerThreadTopologyDiagram';
import ThreadPoolLifecycleDiagram from '@site/src/components/ThreadPoolLifecycleDiagram';
import TomcatRequestFlowDiagram from '@site/src/components/TomcatRequestFlowDiagram';
import TomcatDirectMemoryDiagram from '@site/src/components/TomcatDirectMemoryDiagram';
import NettyThreadModelDiagram from '@site/src/components/NettyThreadModelDiagram';
import ThreadPoolTimelineDiagram from '@site/src/components/ThreadPoolTimelineDiagram';
import ThreadPoolIntroDiagram from '@site/src/components/ThreadPoolIntroDiagram';
import NettyDirectMemoryDiagram from '@site/src/components/NettyDirectMemoryDiagram';
import HikariCPPoolDiagram from '@site/src/components/HikariCPPoolDiagram';
import MismatchDeadlockDiagram from '@site/src/components/MismatchDeadlockDiagram';
import TimeoutExceptionsDiagram from '@site/src/components/TimeoutExceptionsDiagram';
import MathFormula from '@site/src/components/MathFormula';

# Thread Pools, Netty, Tomcat & HikariCP

:::info[Who this guide is for]
- **New learners** — start at [What is a Thread Pool?](#1-thread-pools--threadpoolexecutor) to understand why pooling exists and how it works internally.
- **Intermediate** — jump to [Tomcat](#2-tomcat--embedded-server-threads) or [Netty](#3-netty--event-loop-architecture) to understand the server layer.
- **Senior engineers** — see [How They All Relate](#5-how-they-all-relate), [Production Sizing](#6-production-sizing-guide), and [Troubleshooting](#7-troubleshooting--common-failures).
:::

:::tip[Core Prerequisite]
Before learning how threads and connections are pooled, make sure you understand the fundamental difference between logical multi-tasking and physical simultaneous execution. Check out the dedicated guide: **[Concurrency vs. Parallelism](./concurrency-vs-parallelism)**.
:::

---

## 1. Thread Pools — `ThreadPoolExecutor`

### What is a Thread Pool?

A **thread pool** is a managed collection of pre-created threads that are reused to execute tasks. Instead of creating a new OS thread for every task (expensive: ~1MB stack + kernel call), the pool maintains a fixed number of threads that pick tasks from a queue.

<ThreadPoolIntroDiagram />

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

<ThreadPoolLifecycleDiagram />

<ThreadPoolTimelineDiagram />

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

<TomcatArchitectureDiagram />

#### How Tomcat Processes a Request

<TomcatRequestFlowDiagram />

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

### Tomcat and Direct Memory: The Temporary Cache

Like all Java network libraries, Tomcat relies on **Direct Memory** (off-heap memory) to transmit data between the OS socket buffers and the JVM. Because the Operating System's `read()` system call requires a static, absolute physical memory address, it cannot write directly to Java heap objects (which are constantly relocated by the Garbage Collector during compaction). A static, off-heap native buffer acts as the intermediate landing pad.

Tomcat's I/O pipeline uses two copy operations:
<TomcatDirectMemoryDiagram />

#### The Per-Thread Cache Footprint
Tomcat manages this direct memory using a **temporary thread-local cache** inside the JDK (`sun.nio.ch.Util`).
- Every worker thread is assigned a single direct buffer.
- This buffer is initially sized to Tomcat's default buffer size (configured by `appReadBufSize`, usually `8KB`).
- When a request is read, Tomcat reuses the same 8KB direct buffer repeatedly instead of allocating new blocks or releasing it to the OS.
- For 200 default worker threads, this consumes only 200 &times; 8KB = 1.6MB of direct memory, which is negligible and virtually immune to out-of-memory issues.

#### The Thread-Local Cache Trap (e.g., The Ehcache Trap)
Although Tomcat's HTTP reading is safe, a major memory leak trap occurs if your business logic uses the same worker thread to perform a large file or socket channel operation:
- The JDK NIO utility (`sun.nio.ch.Util`) caches the **largest buffer ever requested** by that thread.
- If your business code reads a 50MB file into a heap byte array using a `FileChannel` on a Tomcat worker thread, the JIT/NIO allocates and caches a **50MB native direct buffer** on that thread's local storage.
- The buffer remains bound to the thread forever and is never resized down. If 100 worker threads run this code path once, your application will silently bleed **5GB of off-heap native memory**, leading to container-level `OOMKilled` crashes while heap usage looks perfectly normal.
- **Remediation:** Set the JVM flag `-Djdk.nio.maxCachedBufferSize=262144` (e.g., 256KB) to restrict the maximum size of cached thread-local direct buffers, forcing large buffers to be discarded instead of cached.

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

<NettyThreadModelDiagram />

### Netty Architecture (Boss-Worker Model)

<NettyArchitectureDiagram />

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

### Netty and Direct Memory: Pooled Chunks & Reference Counting

Netty optimizes network performance by bypassing the secondary copy operation of Tomcat:
<NettyDirectMemoryDiagram />
By parsing packets directly on the off-heap direct buffer, Netty saves CPU cycles and prevents heap garbage accumulation, resulting in higher throughput and smoother p99 latency. However, because Netty maintains permanent residency on direct memory, it introduces critical off-heap management responsibilities.

#### Netty's Pooled Allocator (`PooledByteBufAllocator`)
Direct memory allocations via the OS are expensive system operations. To avoid doing this on every request, Netty grabs large blocks of native memory called **chunks** (defaulting to **4MB** a chunk since Netty 4.1.75) and manages them using a custom allocator.
- Each HTTP/gRPC request is leased a tiny slice (e.g., 64KB) of a 4MB chunk.
- Unlike Tomcat (which scales direct memory with thread count), Netty scales direct memory with the **volume of concurrent active data** across all connections at a given moment.
- If client connections slow down or backpressure builds up, data accumulates in these direct buffers, causing the allocator to request more 4MB chunks from the OS.

#### The GC Blind Spot & Reference Counting Leak
Because the Garbage Collector cannot see or clean off-heap chunks, Netty implements manual **Reference Counting**:
- Each `ByteBuf` wrapper on the heap holds a reference counter. When you call `.release()`, the reference count drops. When it hits zero, the off-heap memory slice is immediately returned to the pool.
- **The Wrapper Leak Trap:** If your code forgets to call `release()` (or fails to call it inside a `finally` block), the heap wrapper object eventually goes out of scope and is garbage collected. The heap remains completely clean, but the off-heap slice is **never returned** to the Netty pool.
- **The Pinning Effect:** Netty can only return a 4MB chunk to the OS when *every single slice* leased from it has been released. A leak of a single 64KB slice is enough to pin the entire 4MB chunk in physical memory forever.
- **Remediation:** Always run with Netty's leak detection enabled in development and staging:
  ```bash
  -Dio.netty.leakDetection.level=ADVANCED
  ```
  This tracks resource allocations and prints detailed stack traces when a `ByteBuf` is garbage-collected without being released.

> **See also:** [Socket Programming & I/O Models](../networking/socket-programming-io-models) for epoll, the Reactor pattern, and how Netty uses them under the hood.

---

## 4. HikariCP — Database Connection Pooling

### What is HikariCP?

HikariCP is the **fastest JVM connection pool** and the **default in Spring Boot 2.x+**. It manages a cache of pre-opened, pre-authenticated database connections that threads borrow and return — eliminating the 10–100ms overhead of establishing a new connection per request.

### How HikariCP Works Internally

<HikariCPPoolDiagram />

### HikariCP Configuration & Sizing

For details on how to configure HikariCP for production, fixed-size vs dynamic pools, and the baseline database sizing metrics, see the comprehensive [Database Connection Pooling Guide](../database/connection-pooling#hikaricp-spring-boot-default-pool).

For the step-by-step mathematical calculation of Tomcat thread pools vs. HikariCP pool sizes and database cores, see the [Production Sizing Guide](#6-production-sizing-guide) below.

---

## 5. How They All Relate

### The Full Request Flow

Understanding how thread pools, Tomcat, Netty, and HikariCP interact in a single HTTP request is the key to diagnosing performance issues.

<RequestPipelineModelDiagram />

### The Relationship Diagram

<AppServerThreadTopologyDiagram />

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

Sizing thread pools and connection pools is not about choosing arbitrary numbers. It is a mathematical chain of constraints extending from your user request rates down to your physical database cores. 

---

### 1. Tomcat Thread Pool Sizing

Tomcat's default pool size of `200` worker threads is often an anti-pattern when running in modern containerized environments (Kubernetes pods or Docker containers) capped at 1 or 2 vCPUs. Too many active threads cause context-switching overhead, CPU throttling, and cache invalidation.

To calculate the optimal worker thread count, use the **Brian Goetz formula** (from *Java Concurrency in Practice*):

<MathFormula id="optimal-threads" />

* **Available Cores:** The CPU core limits allocated to your container (e.g. `resources.limits.cpu` in Kubernetes).
* **Target CPU Utilization:** The desired average CPU load (typically `0.8` or 80% to leave headroom for GC, serialization, and traffic spikes).
* **Wait Time / Compute Time (Blocking Coefficient):** The ratio of time a request spends waiting for off-thread I/O (database, cache, HTTP downstream calls) vs. actually processing on the CPU.

#### Sizing Example
Suppose a Spring Boot microservice is deployed inside a container with **2 vCPUs**. Performance profiling shows that a typical request takes **55ms** total: **50ms** waiting for the database (Wait Time) and **5ms** computing JSON serialization and business logic (Compute Time).

<MathFormula id="tomcat-threads-calc" />

Instead of the default `200` threads, setting `server.tomcat.threads.max = 18` is the correct, mathematically derived starting point for performance testing.

#### Calculating Throughput Capacity (Little's Law)
Using **Little's Law** (L = &lambda; &times; W), we can calculate the theoretical throughput of a single instance:
* L (Number of concurrent requests in-flight) = `18` (our max threads).
* W (Latency per request) = `55ms` (0.055 seconds).
* &lambda; (Throughput / Requests Per Second) = L / W.

<MathFormula id="throughput-calc" />

If your business requirement is to handle **1,600 RPS**, you will need to scale out to at least 5 application instances (1600 / 327).

#### ⚠️ Container Core-Counting Warning
In Java versions prior to 8u191, the JVM was unaware of container limits and read the host's physical cores (e.g. 64 cores). This caused the JVM to spawn too many internal threads (GC, JIT, ForkJoinPool), leading to massive CPU throttling. 
* **Fix:** Use modern JVMs (Java 11, 17, 21, or 25) which are container-aware by default and properly read cgroups memory and CPU limits.

#### ⚡ Cloud Run Concurrency Aligning
If you deploy to serverless containers like Google Cloud Run, there is a `concurrency` setting (max concurrent requests routed per instance). 
* If you set `concurrency = 80` (default) but configure Tomcat `threads.max = 18`, Cloud Run will route up to 80 requests to a single instance. Tomcat will process 18, and the remaining 62 will sit in Tomcat's `TaskQueue`, causing request latency to explode.
* **Fix:** Keep `concurrency` aligned closely with your Tomcat `threads.max` (e.g., `20`). This forces Cloud Run's native load balancer to scale-out horizontally to a new pod immediately rather than queuing requests internally.

---

### 2. Database Connection Pool Sizing (HikariCP)

Once the application threads are sized, the connection pool must be sized to support them. In a thread-per-request architecture, a worker thread only needs a database connection during the database execution phase of the request, not for the entire request lifecycle (e.g. not during CPU-bound serialization or external HTTP calls).

To calculate the connection pool size per instance, use the formula:

<MathFormula id="hikari-pool-size" />

Using our 2 vCPU example (18 threads, total request 55ms, connection held for 50ms):

<MathFormula id="hikari-pool-calc" />

Set `maximum-pool-size: 17` and `minimum-idle: 17` to keep the pool warm and avoid connection handshake latency during traffic spikes.

#### 📉 Why Smaller Pools are Faster
A common trap is assuming that more connections equal higher throughput. The database engine can only process queries in parallel up to its hardware limits. Excess active connections result in disk spindle thrashing, lock contention, and OS thread context switching, which degrades throughput and causes latency spikes.

The optimal connection limit for a database is defined by the PostgreSQL/HikariCP formula:

<MathFormula id="optimal-exec-conns" />

* **Spindle:** The number of physical hard disks. On modern SSDs or NVMe drives where the working set fits in cache, this is essentially `0`.
* A **4-Core DB** running on SSDs can only run (4 &times; 2) + 0 = 8 queries in parallel optimally.

#### Resolving the Mismatch
If 5 application instances each open 17 connections, the database has **85 total connections** open. How does this align with the DB's optimal limit of 8-9 executing queries?

The key is distinguishing between **open connections** (idle/waiting on network) and **executing queries** (utilizing database CPU). 
* Out of the 50ms database phase, the database CPU might only spend **5ms** executing the query. The other 45ms is network transit, connection checkout, and client-side data buffering.
* Out of the 85 connections open from the cluster, the concurrent active executing queries are:

<MathFormula id="active-queries-calc" />

This matches the 4-core database capacity perfectly! 

#### Complete Sizing Chain Example
To support **1,600 RPS** under the 55ms total latency profile:
1. **Instances:** 1600 / 327 &approx; 5 instances.
2. **Hikari Pool size per instance:** 18 &times; (50 / 55) &approx; 17. (Total cluster connections = 17 &times; 5 = 85).
3. **Database execution load:** 85 &times; (5ms / 50ms) = 8.5 active executing connections.
4. **Database sizing:** Cores = Executing Connections / 2 = 8.5 / 2 &approx; 4.25 &approx; 4 to 8 cores.

*Recommendation:* Set the database `max_connections` limit significantly higher (e.g., `150` to `200`) to provide headroom for administrator logins, indexing jobs, and monitoring metrics, even though the cluster pool only checks out 85.

#### ⏳ Connection Hold Time Leaks
If connection usage spikes in production while the database CPU is idle, check for hold time leaks:
* **The Transaction Trap:** Placing `@Transactional` annotations on outer service methods that call slow external REST APIs keeps the database connection checked out doing absolutely nothing while waiting for the network call.
* **Fix:** Keep transactions short. Only hold connections during database operations. Use Hikari's `leak-detection-threshold` to log warnings for connections held longer than a specific limit (e.g. 5 seconds).

---

### 3. Virtual Threads (Project Loom) Sizing Impact

When virtual threads are enabled (`spring.threads.virtual.enabled=true`), the Tomcat thread pool bottleneck disappears because virtual threads do not require a 1MB native OS stack. 

* **The Trap:** If you have 5,000 concurrent requests, Spring will spawn 5,000 virtual threads. However, your database connection pool **does not scale**. 
* **The Result:** All 5,000 virtual threads will block at the gates of the HikariCP pool waiting for a connection, leading to connection timeouts. Virtual threads shift the application concurrency bottleneck entirely down to the database connection layer.
* **Fix:** Use semaphores, rate limiters, or Spring's `@ConcurrencyLimit` annotations to cap downstream resource access, preventing database pool exhaustion under Loom.

---

### The Mismatch Deadlock

A critical failure mode when thread pool and connection pool sizes don't match:

<MismatchDeadlockDiagram />

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

---

### 🌐 Timeout Exceptions Deep Dive

When connections start failing under load, clients will log network exceptions. Rather than treating them as unrelated glitches, recognize that **Connection refused, Connect timed out, Read timed out, and Connection reset** are different phases of the same congestion problem.

<TimeoutExceptionsDiagram />

Understanding these clocks and server settings allows you to pinpoint precisely where a request fails:

#### 1. Connection refused vs. Connect timed out (TCP Handshake)
* **What it means:** The client attempts to initiate the 3-way TCP handshake (sends a `SYN` packet) but cannot complete the connection.
* **The Root Cause:**
  * **`Connection refused` (`ConnectException`):** The server kernel actively rejects the connection by replying with a `RST` (Reset) packet. This happens if the target port has no process listening on it, or if the server process has completely shut down.
  * **`Connect timed out` (`SocketTimeoutException: connect timed out`):** The target port is open, but Tomcat's connection capacity is exceeded.
* **The Tomcat Mechanism:**
  * Tomcat accepts up to `server.tomcat.max-connections` (default `8192`) active sockets.
  * Sockets beyond this are queued in the OS Kernel TCP Accept Queue, sized by `server.tomcat.accept-count` (default `100`).
  * **Request 8293+:** When both the 8192 active slots and the 100 queue spots are full, the Linux kernel silent drops incoming `SYN` packets. The client receives no response, retries the handshake, and eventually gives up when its client-side `connectTimeout` clock expires.
* **Troubleshooting:**
  * If logging `Connect timed out`, check if your cluster is undersized (RPS is exceeding cluster capacity). 
  * *Trap:* Increasing `accept-count` to a massive number (e.g., `5000`) just creates a longer queue, which eventually converts into `Read timed out` exceptions as clients wait too long for their turn in the queue.

#### 2. Read timed out (Socket Wait State)
* **What it means:** The TCP handshake completed successfully, the connection was checked out, and the client sent the HTTP request payload. However, the client-side `readTimeout` expired before the server sent back a response.
* **The Root Cause:** The Tomcat thread pool (`threads.max`, default `200`) is fully saturated. Threads are blocked waiting on slow downstream microservices, unindexed database queries, or connection pools.
* **The Mechanism:**
  * Tomcat accepted the connection into its `max-connections` buffer, but no worker thread is free to parse or process the HTTP headers. The request sits idle.
  * The client waits, its `readTimeout` expires, and the client throws `SocketTimeoutException: Read timed out` and terminates the socket.
  * *Nghịch lý:* The client reports timeouts, but Tomcat logs remain blank and CPU utilization is low. The client aborted the request, but the blocked Tomcat thread is still running the query in the background, unaware the client has departed.
* **Troubleshooting:**
  * Do not blindly increase the client `readTimeout`. This simply holds resources (sockets and client threads) blocked for longer. 
  * Locate the thread bottleneck: take a thread dump (`jstack`) and inspect why Tomcat threads are in `WAITING` or `BLOCKED` states.

#### 3. Connection reset / Broken pipe (Server-Side Eviction)
* **What it means:** The TCP socket was open, but the server unilaterally closed the connection, causing the client's next write operation to fail.
* **The Root Cause:** The client opened a socket but did not send any bytes within Tomcat's configured `server.tomcat.connection-timeout` limit (default `20000ms` / 20 seconds).
* **The Mechanism:**
  * Tomcat keeps open idle TCP connections to support Keep-Alive. However, if a client holds a socket open but doesn't send HTTP headers (e.g., slow clients, network hiccups, port scanning scripts), Tomcat closes the socket to free up resources.
  * If the client tries to send data on this closed socket, the OS returns a `RST` packet, throwing `IOException: Connection reset by peer` or `Broken pipe` on the client.
* **Troubleshooting:**
  * Verify if clients are experiencing high network latency or sending headers slowly. If keep-alive connections are being recycled too quickly, tune `server.tomcat.connection-timeout` carefully.

---

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

### 🧠 Senior Deep Dive: The RUNNABLE Database Call Illusion

When database queries slow down, you might take a thread dump to diagnose the issue, only to find a paradox: dozens of threads are blocked waiting for database results, yet their JVM state is reported as **`RUNNABLE`** rather than `WAITING` or `BLOCKED`. 

#### 1. Why JVM States Mismatch Reality
To understand why a waiting thread reports as runnable, we must look at where thread states are managed:
* **JVM-Managed States (`BLOCKED`, `WAITING`, `TIMED_WAITING`):** These states represent synchronization queues controlled entirely inside the JVM's memory boundary. 
  * `BLOCKED` means a thread is waiting to acquire a Java monitor lock (to enter a `synchronized` block).
  * `WAITING` / `TIMED_WAITING` means the thread is parked inside the JVM via `Object.wait()`, `Thread.join()`, or `LockSupport.park()`, waiting for another Java thread to wake it up.
* **OS-Level Blocking (The JVM Blind Spot):** When a Java thread issues a blocking database query via JDBC, the JVM execution engine drops down into native code to perform an OS kernel system call (syscall) to read from a TCP socket (seen in thread dumps as `socketRead0`). 
  * The thread is blocked at the **Operating System kernel level**, waiting for the network card to receive TCP database packets.
  * Because the wait occurs outside the JVM's synchronization structures, the JVM cannot track it portably across different operating systems.
  * Therefore, the JVM maintains the thread state as **`RUNNABLE`** (defined by the Java spec as *"executing in the JVM but may be waiting for other resources from the operating system"*).

> **The Timesheet Analogy:** Imagine an office check-in sheet. When an employee quets their card, they are marked "In Office / Working" on the timesheet. If they sit at their desk staring at a loading screen waiting for an external vendor to email them files, the HR department (JVM) still marks them as "Working" because they haven't checked out. They are only marked "Away" when in an official internal state (e.g. locked out of a meeting room — `BLOCKED`, or waiting for a colleague — `WAITING`).

#### 2. The Traditional Platform Thread Bottleneck
In classic Java, each platform thread maps **1:1 to a physical OS thread** (each consuming a fixed **1MB native stack**). 
* When a database query blocks, the underlying OS thread is pinned in the kernel. It cannot do any other work.
* An I/O-bound microservice spending 90% of its time waiting on network round-trips will quickly exhaust its Tomcat thread pool (`threads.max = 200`).
* **The Symptom:** You observe 200 threads in `RUNNABLE` (actually blocked in `socketRead0` syscalls), CPU utilization is idle at 10-20%, but the application is starved, throwing connection timeouts.

#### 3. How Java 21+ Virtual Threads Resolve the Illusion
Virtual Threads (Project Loom) decouple logical threads from OS threads, running thousands of virtual threads on a small pool of platform **carrier threads**:
* **Unmounting on I/O:** When a virtual thread executes a blocking socket read (like database queries), the JDK intercepts the call. Instead of blocking the carrier OS thread, the JDK **unmounts** the virtual thread, serializes its stack frame onto the Java Heap as a continuation, and frees the carrier thread to run other virtual threads.
* **Accurate States:** Because the JVM scheduler now manages the block, the virtual thread's state changes to **`WAITING`** (and `Thread.getState()` correctly returns `WAITING`).
* **Pinning Limit in Java 21/23:** If a virtual thread blocks inside a `synchronized` block or native method, it gets **pinned** to the carrier thread, reverting to the old 1:1 behavior.
* **Java 24+ Fix (JEP 491):** Java 24 completely resolves pinning inside `synchronized` blocks, allowing virtual threads to unmount freely.

#### 4. Diagnostic Caveat: The `jstack` Blind Spot
Traditional profiling tools like `jstack` only display platform/carrier threads. If your service uses virtual threads and hangs, a standard `jstack` output will show a completely idle, clean JVM.
* **To dump virtual threads:** Run the following `jcmd` command to output all virtual thread stacks:
  ```bash
  jcmd <PID> Thread.dump_to_file -format=json threads.json
  # Or plain text format:
  jcmd <PID> Thread.dump_to_file threads.txt
  ```

---

## Interview Questions

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
| Concurrency vs. Parallelism beginner guide | [Concurrency vs. Parallelism](./concurrency-vs-parallelism) |
| ThreadPoolExecutor & Fork/Join details | [Java Concurrency](./java-concurrency) |
| Virtual Threads deep dive | [Virtual Threads (Project Loom)](./java-virtual-threads) |
| HikariCP anti-patterns & PgBouncer | [Database Connection Pooling](../database/connection-pooling) |
| Netty, epoll, and the Reactor pattern | [Socket Programming & I/O Models](../networking/socket-programming-io-models) |
| Tomcat embedded server internals | [Spring Boot Internals](../spring/spring-boot-internals) |
| JVM memory & thread stacks | [JVM Memory Architecture](./java-jvm) |
| Spring Boot server tuning | [Spring Boot Advanced](../spring/spring-boot-advanced#performance-tuning) |
