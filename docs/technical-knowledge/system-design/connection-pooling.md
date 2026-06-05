---
id: connection-pooling
title: Database Connection Pooling
sidebar_label: 🔌 Connection Pooling
description: Comprehensive guide to database connection pooling, pool sizing formulas, HikariCP parameters, failure modes, pool starvation, and proxies like PgBouncer/RDS Proxy.
tags: [system-design, connection-pooling, database, spring, performance, hikaricp]
---

# Database Connection Pooling

Database connection pooling is a critical optimization pattern for relational databases (like PostgreSQL, MySQL, and Oracle). This guide details the mechanics of connection reuse, core tuning parameters, sizing heuristics, common failure modes, and database proxies.

---

## 1. What is Connection Pooling?

### The Overhead of New Connections
Opening a physical database connection is one of the most expensive operations in an application lifecycle. Every time a client connects to a database:
1. **TCP Handshake**: A 3-way handshake to establish a network connection.
2. **TLS/SSL Negotiation**: Cryptographic key exchange for secure transit (adds multiple network round-trips).
3. **Database Authentication**: Credentials verification, authorization checks, and session initialization.
4. **Process/Thread Allocation**: The database must spawn a backend process or allocate thread-local memory (e.g., ~5–10MB of RAM per connection in PostgreSQL).

This handshake sequence typically takes **10–100ms** depending on network latency, which is often orders of magnitude slower than a simple SQL query (which can execute in $<5$ms).

```
[Application Thread]                                     [Database Server]
        │                                                        │
        ├─────────────── 1. TCP Handshake ──────────────────────>│ (Syn/Ack)
        ├─────────────── 2. TLS/SSL Handshake ──────────────────>│ (Key Exchange)
        ├─────────────── 3. Auth & Credentials ─────────────────>│ (Verify)
        ├─────────────── 4. Allocate Process/RAM ───────────────>│ (Resource Prep)
        │                                                        │
        │ <───────────── Connection Established (10-100ms) ──────┘
```

### The Pool Analogy
Instead of creating and destroying connections for every request, a **Connection Pool** maintains a cache of active database connections. When an application thread needs to execute a query, it borrows an existing connection from the pool, runs the query, and immediately returns the connection back to the pool.

> **Library Study Card Analogy**
> Think of database connections as a limited set of *study cards* at a library. Instead of a student filling out registration forms, getting background checks, and printing a new card every time they want to read a book (and burning/shredding the card when done), they borrow a card from the librarian's desk, do their work, and return it for the next student to reuse.

---

## 2. Core Tuning Parameters (HikariCP Focus)

HikariCP is the default, high-performance connection pool implementation in Spring Boot. Tuning its parameters is essential for production stability.

```
       ┌────────────────────────────────────────────────────────┐
       │                 HikariCP Connection Pool               │
       │                                                        │
       │    [Active Conn]   [Active Conn]   [Active Conn]       │ ◄── borrowed by threads
       │                                                        │
       │    [Idle Conn]     [Idle Conn]                     │ ◄── kept warm (minimum-idle)
       └────────────────────────────────────────────────────────┘
        ◄──────────────────── maximum-pool-size ────────────────>
```

| Parameter | Default | Purpose & Recommendation |
| :--- | :--- | :--- |
| `maximum-pool-size` | `10` | The maximum number of physical connections the pool can hold. Limits database concurrency. |
| `minimum-idle` | Same as max | The minimum number of idle connections HikariCP tries to maintain. Recommended to keep equal to `maximum-pool-size` (fixed-size pool) to avoid connection churn and latency spikes. |
| `connection-timeout` | `30000` (30s) | How long a thread will wait to borrow a connection from the pool before throwing a `SQLTransientConnectionException`. **For OLTP, reduce to 2000–5000ms (2–5s)** to fail fast under load. |
| `idle-timeout` | `600000` (10m) | Max time an idle connection can sit in the pool before being retired. (Only active if `minimum-idle` is less than `maximum-pool-size`). |
| `max-lifetime` | `1800000` (30m) | The maximum lifetime of a connection in the pool. It is critical to recycle connections to release memory leaks, clean up statement caches on the DB side, and bypass firewall TCP timeout drops. **Must be 30 seconds shorter than any database-level connection age limit.** |
| `leak-detection-threshold` | `0` (Disabled) | Logs a warning if a thread holds a connection longer than this threshold. **Set to 2000–5000ms (2–5s) in staging/production** to detect transactional leaks and unclosed resources. |

### Fixed-Size Pool Recommendation
In production, it is highly recommended to configure a **fixed-size pool** by setting `minimum-idle` equal to `maximum-pool-size`:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 20  # Matches maximum-pool-size
```
*Why?* Dynamic pools cause latency spikes for incoming requests because threads must wait for the pool to establish new TCP/TLS connections to the database on demand. A fixed pool keeps all connections pre-warmed.

---

## 3. Pool Sizing Heuristics

A common beginner mistake is thinking: *"More connections mean more concurrent queries, which means higher performance. Let's set the pool size to 500."*

### Why Huge Pools Are an Anti-Pattern
1. **Disk Seek Limits**: A single hard disk spindle can only read/write one sector at a time. Even modern SSDs have finite I/O queue depths. If 100 threads execute database writes concurrently, the disk heads spend more time seeking than writing, causing I/O wait times to skyrocket.
2. **CPU Context Switching**: If your database server has 4 CPU cores, it can execute exactly 4 queries at the exact same physical instant. If 100 active connections submit queries simultaneously, the OS kernel wastes massive CPU cycles saving and restoring thread states (context switching) instead of executing database logic.
3. **Database Lock Contention**: More active transactions increase the likelihood of transactions waiting for the same row or table locks, leading to thread blocking and starvation.

### The Sizing Formula
PostgreSQL and Oracle benchmark results yielded a widely used empirical sizing formula:

$$\text{connections} = (\text{CPU Cores} \times 2) + \text{Effective Spindle Count}$$

* **CPU Cores**: The number of physical CPU cores on the database server.
* **Effective Spindle Count**: The number of active disk spindles (e.g., spindle count is 1 for a single SSD, or equal to RAID disk counts).

For example, a database server with a 4-core CPU and a fast SSD RAID setup:

$$\text{connections} = (4 \times 2) + 1 = 9$$

> **Real-World Calibration**
> Start with the formula (e.g., 10–20 connections). To optimize, perform load testing:
> 1. Run a constant workload against your staging system.
> 2. Gradually increase the connection pool size.
> 3. Plot the **Throughput vs Latency** curve.
> 4. You will reach a "knee" where adding connections no longer increases throughput, but latency begins to spike exponentially. Set your pool size slightly below this threshold.

---

## 4. Failure Modes & Pool Starvation

### A. Pool Starvation under N+1 Queries
When a transaction triggers an N+1 query scenario, a single thread borrows a database connection and holds it while executing N serial queries sequentially.
* Under load, many concurrent threads do this simultaneously.
* The connection pool is rapidly depleted (all 10–20 connections are locked by active N+1 loops).
* New incoming requests block waiting for a connection at `connection-timeout`, leading to cascade timeouts and service failures.

:::tip[Mitigation]
Eliminate N+1 queries using `JOIN FETCH`, `@EntityGraph`, or separate multi-ID query fetching.
:::

### B. Transactional Leaks (Long Non-Database Operations)
A common anti-pattern is holding a connection open while performing heavy calculations or calling external web APIs inside a `@Transactional` block.

```java
// ❌ ANTI-PATTERN: DB connection is held open during 2000ms external call
@Transactional
public void processOrder(Long orderId) {
    Order order = orderRepository.findById(orderId).orElseThrow();
    
    // DB connection acquired here and held idle...
    PaymentResult result = paymentGatewayClient.charge(order.getAmount()); // 2s API Call
    
    order.setStatus(result.isSuccess() ? OrderStatus.PAID : OrderStatus.FAILED);
    orderRepository.save(order);
} // Connection released here
```

If 10 concurrent requests arrive, they will lock all 10 pool connections for 2 seconds. The application will immediately starve and refuse other traffic, even if the database itself is idle.

:::tip[Best Practice: Separate DB and Non-DB operations]
```java
// ✅ CORRECT: Connection is acquired and released in two short transactions
public void processOrder(Long orderId) {
    // 1. Fetch data in short transaction
    Order order = orderService.getOrderForProcessing(orderId);
    
    // 2. Perform slow HTTP call outside of transaction
    PaymentResult result = paymentGatewayClient.charge(order.getAmount());
    
    // 3. Update status in another short transaction
    orderService.updateOrderStatus(orderId, result);
}
```
:::

### C. Thread Pool vs. Connection Pool Mismatch
If your web server (e.g., Tomcat) is configured with `max-threads: 200` and your connection pool is configured with `maximum-pool-size: 10`, you can hit thread blocking scenarios:
* If 100 requests arrive, Tomcat spawns 100 threads.
* 10 threads get database connections.
* 90 threads block waiting for database connections.
* If those 10 active connections depend on signals or responses from other threads (e.g., nested REST calls back to the same server), the system deadlocks.

---

## 5. Connection Proxies & Serverless

### A. PgBouncer (PostgreSQL Connection Pooler)
PostgreSQL spawns a separate OS process for every connection, consuming about 10MB of RAM per connection. This makes scaling past a few hundred connections expensive. 

**PgBouncer** is a lightweight connection proxy that sits between your application and PostgreSQL. It maintains a small pool of actual connections to PostgreSQL and multiplexes thousands of client connections onto them.

```
[App Instance 1] ──(100 client conns)──┐
[App Instance 2] ──(100 client conns)──┼──> [PgBouncer Proxy] ──(20 real conns)──> [PostgreSQL]
[App Instance 3] ──(100 client conns)──┘
```

#### PgBouncer Pool Modes
* **Session Pooling** (Safest): PgBouncer assigns a database connection to the client for the entire duration of the client session. Once the client disconnects, the connection is returned. (Minimal scalability improvement).
* **Transaction Pooling** (Most Common): PgBouncer assigns a database connection to the client **only for the duration of a transaction**. When the transaction commits, the connection is returned to the pool.
* **Statement Pooling**: Connection is assigned for a single statement. (Cannot use multi-statement transactions).

:::warning[Spring Boot & PgBouncer Transaction Mode gotcha]
In Transaction Mode, subsequent queries in the same connection session might run on different physical database connections. This breaks features that rely on connection-level state:
1. **Prepared Statement Caching**: Hibernate/JDBC pre-compiles queries and caches their handles. If routed to a different connection, it throws an error. **Fix**: Set `spring.datasource.hikari.prepared-statements-cache` to `false` or set PgBouncer config to use `server_reset_query`.
2. **Temporary Tables and Advisory Locks**: These are scoped to a session and will be leaked or visible to other threads incorrectly.
:::

### B. AWS RDS Proxy
In serverless architectures (e.g., AWS Lambda), functions scale out dynamically. If 1,000 Lambda instances spawn in response to a traffic spike, they will try to open 1,000 separate connections to RDS, instantly crashing the database.

**RDS Proxy** acts as a managed serverless connection pooler. It handles:
* Multiplexing and connection pooling.
* **IAM Database Authentication** authorization passthrough.
* Seamless failover routing: If an RDS Multi-AZ failover occurs, RDS Proxy holds the application queries in a queue and routes them to the new master without dropping the connection to the Lambda function.

```
[Lambda 1] ──┐
[Lambda 2] ──┼──> [RDS Proxy] ──(Small pool of persistent conns)──> [Amazon RDS]
[Lambda 3] ──┘
```

---

## 6. Monitoring & Metrics

To capture connection pool saturation, thread starvation, and connection leaks in real-time, configure pool metrics via Actuator and Micrometer.

### Spring Boot HikariCP Metrics Bean
Registering a customizer exposes `hikaricp.connections.active`, `hikaricp.connections.pending`, `hikaricp.connections.idle`, and acquisition timeout counts:

```java
@Configuration
public class HikariMetricsConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> hikariMetrics(DataSource dataSource) {
        return registry -> {
            if (dataSource instanceof HikariDataSource hds) {
                HikariDataSourcePoolMetrics metrics =
                    new HikariDataSourcePoolMetrics(hds, registry, Tags.empty());
                metrics.bindTo(registry);
            }
        };
    }
}
```

### Key Metrics to Alert On
* `hikaricp.connections.pending`: Sustained values $> 0$ indicate thread queueing for database connections (starvation).
* `hikaricp.connections.acquire`: The average and maximum time taken to borrow a connection. Spikes indicate pool pressure.
* `hikaricp.connections.creation`: The time taken to establish new physical connections. Spikes indicate dynamic pool connection churn (tune `minimum-idle`).
