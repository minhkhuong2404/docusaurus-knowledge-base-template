---
id: connection-pooling
title: Database Connection Pooling
sidebar_label: Connection Pooling
description: A complete guide to database connection pooling — how connections work, pool mechanics, HikariCP tuning, pool sizing formulas, failure modes, PgBouncer, RDS Proxy, and production observability. Beginner through senior depth.
tags: [system-design, connection-pooling, database, spring, performance, hikaricp, pgbouncer, rds-proxy, postgresql]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Database Connection Pooling

:::info[Who this guide is for]
- **New learners** — start at [What is a Database Connection?](#what-is-a-database-connection) and [What is a Connection Pool?](#what-is-a-connection-pool) to understand why this problem exists and how pools solve it.
- **Senior engineers** — jump to [Pool Sizing](#pool-sizing), [Failure Modes](#failure-modes), [PgBouncer](#pgbouncer), [RDS Proxy](#rds-proxy-for-serverless), or [Production Observability](#monitoring--observability).
- **Cross-cutting context** — see **[Thread Pools, Netty, Tomcat & HikariCP](../java/thread-pools-and-connection-pooling)** for how connection pools relate to Tomcat threads, Netty EventLoops, and production sizing.
:::

---

## What is a Database Connection?

A **database connection** is a persistent, stateful communication channel between your application and the database server. It is not just a network socket — it carries:

- An authenticated session (the DB knows who you are)
- A transaction context (what isolation level, what's in-flight)
- Server-side memory allocation (caches, temp buffers, cursor state)
- A dedicated backend process on PostgreSQL (or thread on MySQL)

```
Your App (JVM)                              PostgreSQL Server
─────────────────                           ─────────────────────────────
Thread 1                                    Backend Process 1 (~10MB RAM)
Thread 2          ←── TCP Socket ──►        Backend Process 2 (~10MB RAM)
Thread 3                                    Backend Process 3 (~10MB RAM)
```

Every physical connection consumes resources on **both** sides — not just on the database.

### Why creating a connection is expensive

Opening a new connection from scratch requires a full multi-step handshake before a single SQL query can run:

```
Step 1 — TCP Handshake (1 network round trip)
  Client SYN ──────────────────────────────► Server
  Client ◄────────────────────────────── SYN-ACK
  Client ACK ──────────────────────────────► Server
  Duration: 0.5–10ms (depends on network)

Step 2 — TLS/SSL Negotiation (2–4 round trips)
  ClientHello ─────────────────────────────► Server
  ◄──────────────────────────────── ServerHello + Certificate
  Key Exchange ────────────────────────────► Server
  Duration: 5–50ms

Step 3 — Database Authentication
  Auth request + credentials ──────────────► Server
  ◄───────────────────────── Permission check + session init
  Duration: 2–20ms

Step 4 — Backend Process Allocation (PostgreSQL)
  Server forks a new OS process for this connection
  Allocates ~10MB RAM (work_mem, sort buffers, etc.)
  Duration: 1–5ms

Total: 10–100ms before your first SQL query runs
A typical indexed SQL query: < 1ms
```

**The implication:** if every application request opened a fresh connection, connection setup would dominate your response time — especially under load.

### Connection cost comparison

| Operation | Typical duration |
|-----------|----------------|
| Open a new TCP connection | 0.5–10ms |
| TLS handshake | 5–50ms |
| Database authentication | 2–20ms |
| Borrow from existing pool | < 1ms |
| Simple indexed SQL query | 0.1–5ms |
| **Total new connection cost** | **10–100ms** |

---

## What is a Connection Pool?

A connection pool is a **cache of pre-opened, pre-authenticated database connections** that application threads borrow and return — rather than creating and destroying a new connection on every request.

### The library analogy

| Without pooling | With pooling |
|----------------|-------------|
| Every student registers for a new library card, gets a background check, receives a laminated card — uses it once, and the card is destroyed | The library keeps 20 pre-made cards at the desk. Students borrow one, do their reading, return it — the next student uses the same card immediately |

### How borrowing and returning works

```
Application starts:
  Pool creates 10 connections to the DB (pre-authenticated, warm)
  Pool: [C1] [C2] [C3] [C4] [C5] [C6] [C7] [C8] [C9] [C10]

HTTP request arrives (Thread A needs a connection):
  Thread A borrows C1 ← instantly, no TCP handshake
  Pool: [  ] [C2] [C3] [C4] [C5] [C6] [C7] [C8] [C9] [C10]

Thread A runs queries on C1 (1ms)

Thread A finishes → returns C1 to pool:
  Pool: [C1] [C2] [C3] [C4] [C5] [C6] [C7] [C8] [C9] [C10]

Thread B borrows C1 immediately (no waiting, no handshake)
```

### What happens when all connections are borrowed?

```
10 threads all holding connections simultaneously:
  Pool: [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ] [  ]  ← empty

Thread 11 arrives and asks for a connection:
  → Waits in a queue for connection-timeout (e.g. 30 seconds)
  → If no connection is returned within timeout:
     ✗ Throws SQLTransientConnectionException
     ✗ HTTP request fails with 500

This is called POOL STARVATION — the most common connection pool failure.
```

---

## HikariCP Spring Boot Default Pool

HikariCP is the fastest JVM connection pool. It is the default in Spring Boot since 2.x and is chosen for its extremely low overhead (single-digit microsecond borrow time) and robust failure detection.

### Core parameters explained

```
┌──────────────────────────────────────────────────────────────────────┐
│                      HikariCP Pool (max=10)                          │
│                                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐   ← Active (borrowed by threads)       │
│  │  C1  │ │  C2  │ │  C3  │                                         │
│  └──────┘ └──────┘ └──────┘                                         │
│                                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   ← Idle (warm, ready)       │
│  │  C4  │ │  C5  │ │  C6  │ │  C7  │                               │
│  └──────┘ └──────┘ └──────┘ └──────┘                               │
│                                                                      │
│  ← minimum-idle keeps at least N idle connections warm →            │
│  ← maximum-pool-size is the total ceiling →                         │
└──────────────────────────────────────────────────────────────────────┘
```

| Parameter | Default | What it controls | Recommendation |
|-----------|---------|-----------------|----------------|
| `maximum-pool-size` | 10 | Total connections (active + idle). Hard ceiling the DB sees. | Start at 10–20; tune via load test |
| `minimum-idle` | = max | Minimum idle connections kept warm | Set equal to `maximum-pool-size` (fixed pool) |
| `connection-timeout` | 30,000ms | How long a thread waits to borrow before exception | Reduce to 2,000–5,000ms for OLTP |
| `idle-timeout` | 600,000ms | How long an idle connection lives before removal | Only relevant if min-idle < max |
| `max-lifetime` | 1,800,000ms | Maximum age of any connection before recycling | Set 30s shorter than DB's `wait_timeout` |
| `keepalive-time` | 0 (off) | Sends a test query to keep idle connections alive through firewalls | Set to 30,000–60,000ms in cloud |
| `leak-detection-threshold` | 0 (off) | Logs warning if a connection is held longer than N ms | Set to 2,000–5,000ms in staging |
| `validation-timeout` | 5,000ms | How long to test a connection before declaring it dead | Keep default |

### Recommended production configuration

```yaml
# application.yaml
spring:
  datasource:
    url: jdbc:postgresql://db-host:5432/mydb
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      # Pool size — tune for your DB server's CPU cores
      maximum-pool-size: 20
      minimum-idle: 20          # Fixed-size pool — no dynamic churn

      # Fail fast under load — don't let threads queue for 30s
      connection-timeout: 3000  # 3 seconds

      # Recycle connections before DB kills them
      max-lifetime: 1800000     # 30 minutes (set 30s below DB's wait_timeout)

      # Keep connections alive through cloud firewalls
      keepalive-time: 30000     # ping every 30 seconds

      # Catch transactional leaks in staging
      leak-detection-threshold: 5000

      # Connection validation
      connection-test-query: SELECT 1  # for MySQL; not needed for PostgreSQL
      validation-timeout: 3000

      # Pool name — appears in logs and metrics
      pool-name: HikariPool-Orders
```

### Fixed-size pool vs dynamic pool

```
Dynamic pool (minimum-idle < maximum-pool-size):
  Quiet period: pool shrinks to minimum-idle (e.g. 5 connections)
  Traffic spike arrives: pool must create 15 new connections on demand
  Each new connection: TCP + TLS + auth = 20–80ms
  → First 15 requests of the spike experience high latency
                     ╔═════════════════════╗
  Response time:     ║  spike!             ║____
                     ╚═════════════════════╝

Fixed-size pool (minimum-idle = maximum-pool-size):
  Pool always keeps 20 connections warm regardless of traffic
  Traffic spike arrives: all 20 connections already ready
  → No latency spike on first requests
                     ___________________________
  Response time:
```

**Use a fixed-size pool in production.** The marginal cost of keeping extra connections warm is far less than the latency spike of establishing connections on demand.

---

## Pool Sizing

### The common beginner mistake

> "More connections = more parallel queries = higher performance. I'll set my pool to 500."

This is wrong. Here is why:

**CPU parallelism limit:** a database server with 8 CPU cores can physically execute exactly 8 queries simultaneously. If 500 connections all submit queries, 492 queries queue waiting for a CPU core. The OS spends more time on context switching than executing SQL.

**Disk I/O bottleneck:** a single SSD has a finite IOPS queue depth (typically 32–128 concurrent I/O operations). 500 concurrent write transactions all competing for the same disk cause seek thrashing — latency goes up, throughput goes down.

**Lock contention:** more concurrent transactions increase the probability of two transactions waiting for the same row lock. As active connections grow, lock wait time grows super-linearly.

```
Throughput vs Connection Count:
                     ▲
     Throughput      │         ●
                     │       ●   ●
                     │     ●       ●
                     │   ●           ●●●●●●  ← plateau, then degradation
                     │ ●
                     └──────────────────────►
                            Connection count
                              ▲
                          sweet spot
```

### The sizing formula

A widely-used empirical formula from PostgreSQL and Oracle benchmarks:

```
connections = (CPU_cores × 2) + effective_spindle_count

Where:
  CPU_cores           = physical cores on the DATABASE server (not app server)
  effective_spindle_count = 1 for a single SSD
                          = RAID disk count for spinning disks
                          = 1 for most cloud RDS/Aurora instances

Examples:
  4-core DB server, single SSD:  (4 × 2) + 1 = 9  → start at 10
  8-core DB server, single SSD:  (8 × 2) + 1 = 17 → start at 20
  16-core DB server, SSD RAID-10 (4 disks): (16 × 2) + 4 = 36 → start at 40
```

:::tip[This formula gives you a starting point, not the final answer]
The formula captures CPU and I/O saturation. It does not account for:
- Query mix (read-heavy vs write-heavy)
- Average query duration
- Lock contention patterns
- Number of application instances sharing the pool

Always validate with load testing — find the "knee" where adding connections stops improving throughput and starts increasing latency.
:::

### Sizing across multiple application instances

The database connection capacity formula ($(\text{CPU\_cores} \times 2) + \text{spindle}$) calculates the number of **concurrently executing queries** the database server can handle optimally, not the maximum number of idle/open socket connections.

With multiple application instances (e.g., 5 instances each configured with a Hikari pool size of 17), you will have **85 total connections** open down to the database. However, this is optimal because:
* A database connection is held by a thread for the entire round-trip (e.g., 50ms), but the database engine might only spend a fraction of that time (e.g., 5ms) actually executing the SQL query on CPU. The remaining 45ms is spent waiting on network transit and data transfer.
* Out of 85 open connections, only a fraction are executing queries at any single millisecond:

$$\text{Executing Connections} = 85 \times \frac{5\text{ms}}{50\text{ms}} = 8.5 \text{ concurrent executing queries}$$

This matches a 4-core database capacity perfectly.

For the complete, step-by-step mathematical sizing chain (calculating container limits, Tomcat thread pools, HikariCP pool sizes, database cores, and serverless cgroups constraints), see the [Production Sizing Guide in Thread Pools & Connection Pooling](../java/thread-pools-and-connection-pooling#6-production-sizing-guide).

If you scale application pods dynamically without setting PgBouncer or RDS Proxy, you risk blowing past the database's socket limits (`max_connections`). Always set a container safety buffer or database-side multiplexer.

---

## Failure Modes

### Pool starvation — the cascade failure

Pool starvation occurs when all connections are borrowed and new requests queue, time out, and fail — cascading into a service outage.

```
Normal state (pool size = 10):
  Avg request holds connection for 5ms
  At 200 req/sec: 200 × 0.005s = 1 connection in use at any time
  Pool: 1 active, 9 idle  ✅

Slow query incident (avg hold time jumps to 500ms):
  At 200 req/sec: 200 × 0.5s = 100 connections needed
  Pool only has 10 → 90 threads queue
  Queue fills → requests timeout at connection-timeout (30s by default)
  All 200 req/sec fail with SQLTransientConnectionException
  → Cascade: upstream services retry → more load → starvation deepens  ❌
```

**How to detect it:** `hikaricp.connections.pending > 0` sustained for more than a few seconds.

**How to prevent it:**
1. Eliminate slow queries — add indexes, fix N+1 queries.
2. Reduce `connection-timeout` to 2–5 seconds so threads fail fast and don't pile up.
3. Add a circuit breaker — stop accepting requests when pool is exhausted.
4. Scale the pool (but only after fixing the root cause).

---

### Anti-pattern 1 — Holding connections across slow operations

The most common cause of pool starvation is keeping a connection borrowed during non-database work — external HTTP calls, file I/O, or heavy computation.

```java
// ❌ DANGEROUS: DB connection held for the entire 2-second API call
@Transactional
public void processOrder(Long orderId) {
    Order order = orderRepository.findById(orderId).orElseThrow();
    // ← connection is held from here...

    PaymentResult result = paymentGateway.charge(order);  // ← 2000ms HTTP call
    // ← ...to here. Connection is idle but unavailable to other threads.

    order.setStatus(result.isSuccess() ? PAID : FAILED);
    orderRepository.save(order);
}
// With 10 concurrent requests: 10 threads × 2s = all 10 pool connections
// exhausted for 2 seconds. Request 11 waits 30s then fails.
```

```java
// ✅ CORRECT: Connection is held only during actual DB work (ms, not seconds)
public void processOrder(Long orderId) {
    // Transaction 1: fetch data — holds connection for ~2ms
    Order order = orderService.getOrderById(orderId);

    // Outside any transaction — no connection borrowed
    PaymentResult result = paymentGateway.charge(order);  // 2000ms HTTP call

    // Transaction 2: update status — holds connection for ~2ms
    orderService.updateStatus(orderId, result.isSuccess() ? PAID : FAILED);
}

@Service
public class OrderService {
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) { return repo.findById(id).orElseThrow(); }

    @Transactional
    public void updateStatus(Long id, OrderStatus status) { repo.updateStatus(id, status); }
}
```

**Rule of thumb:** the connection is held from the first database call inside a `@Transactional` method to when the method returns. Every millisecond your method spends on non-DB work is wasted borrowed connection time.

---

### Anti-pattern 2 — N+1 queries depleting the pool

N+1 queries hold a connection while executing N serial round trips. Under load, this multiplies connection hold time by N.

```java
// ❌ N+1: holds the connection for 1 + N DB round trips
@Transactional
public List<OrderDto> getOrdersWithUsers(List<Long> orderIds) {
    List<Order> orders = orderRepository.findAllById(orderIds);  // 1 query
    return orders.stream()
        .map(o -> {
            User user = userRepository.findById(o.getUserId()).orElseThrow(); // N queries
            return new OrderDto(o, user);
        })
        .collect(toList());
}
// 100 orders = 101 queries × (avg 2ms each) = 202ms connection hold time
// vs JOIN FETCH: 1 query × 5ms = 5ms connection hold time — 40× better
```

```java
// ✅ Fix: single JOIN FETCH — one round trip, connection released 40× faster
@Query("SELECT o FROM Order o JOIN FETCH o.user WHERE o.id IN :ids")
List<Order> findAllWithUsers(@Param("ids") List<Long> ids);
```

---

### Anti-pattern 3 — Thread pool / connection pool mismatch deadlock

If your web server has more threads than the pool has connections, you can hit a **deadlock** when threads depend on each other. For a detailed step-by-step thread state walkthrough, see the [Mismatch Deadlock Guide in Thread Pools & Connection Pooling](../java/thread-pools-and-connection-pooling#the-mismatch-deadlock).

```
Setup:
  Tomcat max-threads = 200
  HikariCP maximum-pool-size = 10

Scenario:
  200 requests arrive → Tomcat spawns 200 threads
  Thread 1–10 borrow all 10 connections
  Thread 11–200 queue waiting for connections

  Thread 1 (holding C1) makes an internal REST call to /api/helper
  → That request also needs a connection from the same pool
  → All 10 connections are held by threads 1–10
  → Thread for /api/helper queues at connection-timeout (30s)
  → Thread 1 waits for /api/helper → Thread 1 cannot release C1
  → DEADLOCK — no thread can make progress
```

**Fix options:**

| Fix | Approach |
|-----|---------|
| Increase pool size | Add more connections to break the cycle (increases DB load) |
| Separate pools | Use a dedicated pool for internal sub-calls |
| Reduce `connection-timeout` | Fail fast — threads waiting > 3s throw an exception, breaking the cycle |
| Remove internal synchronous calls | Async messaging (Kafka/RabbitMQ) eliminates the dependency |
| `@Transactional(readOnly = true)` | Ensures sub-requests don't also need write connections |

---

### Anti-pattern 4 — @Transactional on public vs private methods

Spring's `@Transactional` uses AOP proxies — it only intercepts calls through the Spring proxy, not direct `this.method()` calls:

```java
@Service
public class OrderService {

    // ❌ Self-invocation — @Transactional is ignored
    public void processAll(List<Long> ids) {
        for (Long id : ids) {
            this.processSingle(id);  // ← calls directly on 'this', not through proxy
        }
    }

    @Transactional
    public void processSingle(Long id) {
        // This method's @Transactional has no effect when called from processAll()
        // Result: no transaction, dirty reads possible, connection borrowed without transaction scope
        orderRepository.findById(id);
    }

    // ✅ Fix: inject self-reference so calls go through the proxy
    @Autowired
    private OrderService self;

    public void processAll(List<Long> ids) {
        for (Long id : ids) {
            self.processSingle(id);  // goes through Spring proxy → @Transactional works
        }
    }
}
```

---

## PgBouncer

### Why PostgreSQL needs a connection proxy

PostgreSQL's architecture spawns a **dedicated OS process** for every connection — not a lightweight thread. Each process consumes:

- ~10 MB RAM for memory buffers (work_mem, sort buffers, temp storage)
- OS process overhead (context switches, scheduling)
- File descriptor allocation

```
10 connections  → 100 MB RAM used on the DB server for processes alone
100 connections → 1 GB RAM
500 connections → 5 GB RAM → database server starts swapping → performance collapses
```

**PgBouncer** sits between your application and PostgreSQL, multiplexing many application connections onto a small number of real PostgreSQL connections:

```
Without PgBouncer:
[App instance 1] (pool=20) ──►
[App instance 2] (pool=20) ──►  PostgreSQL (60 processes × 10MB = 600MB)
[App instance 3] (pool=20) ──►

With PgBouncer:
[App instance 1] (pool=20) ──┐
[App instance 2] (pool=20) ──┼──► [PgBouncer] ──► PostgreSQL (20 processes × 10MB = 200MB)
[App instance 3] (pool=20) ──┘
         ↑                              ↑
  60 client connections         20 real DB connections
  (cheap — just sockets)        (expensive — OS processes)
```

### PgBouncer pool modes

<Tabs>
  <TabItem value="transaction" label="Transaction mode (most common)">

A real PostgreSQL connection is assigned to a client **only for the duration of one transaction**. Once the transaction commits or rolls back, the connection is returned to PgBouncer's pool.

```
Client 1: BEGIN → INSERT → COMMIT         ← uses real connection C1
                  ↕ (between transactions, C1 is free)
Client 2: BEGIN → SELECT → COMMIT         ← uses real connection C1 (same physical conn!)
```

**Multiplexing ratio:** 3 real connections can serve 10+ clients if transactions are short.

**Gotchas:**

| Feature | Broken in transaction mode? | Fix |
|---------|:--------------------------:|-----|
| Prepared statements (JDBC) | ✅ Yes | Set `prepareThreshold=0` in JDBC URL or disable in Hibernate |
| `SET` session variables | ✅ Yes | Use `SET LOCAL` inside a transaction instead |
| Temporary tables | ✅ Yes | Use regular tables with session-scoped cleanup |
| Advisory locks | ✅ Yes | Avoid or use application-level locks |
| `LISTEN/NOTIFY` | ✅ Yes | Use a dedicated non-pooled connection |

```properties
# Spring datasource URL — disable prepared statement caching for PgBouncer transaction mode
spring.datasource.url=jdbc:postgresql://pgbouncer:5432/mydb?prepareThreshold=0
```

  </TabItem>
  <TabItem value="session" label="Session mode (safest)">

A real connection is assigned to a client for their **entire session** (from connect to disconnect). The connection is only returned when the client disconnects.

```
Client 1 connects → gets C1 → stays on C1 until client 1 disconnects
Client 2 connects → gets C2 → stays on C2 until client 2 disconnects
```

This is safe for all PostgreSQL features but provides minimal connection multiplexing — the gain is mainly in connection setup amortisation across reconnects, not in reducing the number of real DB connections.

**Use when:** you need full PostgreSQL session features (advisory locks, temp tables, `LISTEN`) but want connection setup amortisation.

  </TabItem>
  <TabItem value="statement" label="Statement mode (rarely used)">

A real connection is assigned only for a **single SQL statement** and immediately returned after execution.

```
Client sends: SELECT * FROM users WHERE id = 1
  → PgBouncer assigns C1 for this one statement
  → C1 returned immediately after the result set is sent

Client sends: SELECT * FROM orders WHERE user_id = 1
  → PgBouncer may assign C2 (different physical connection!)
```

**This breaks multi-statement transactions entirely** — you cannot use `BEGIN/COMMIT`. Only useful for purely read-only, statement-by-statement workloads (rare).

  </TabItem>
</Tabs>

### PgBouncer configuration

```ini
# pgbouncer.ini
[databases]
mydb = host=postgres-server port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000       # max clients connecting to PgBouncer
default_pool_size = 20       # real PostgreSQL connections per database
reserve_pool_size = 5        # extra connections for emergencies
reserve_pool_timeout = 3     # seconds before using reserve pool

# Connection to PostgreSQL
server_lifetime = 1800       # recycle real connections after 30 min
server_idle_timeout = 600    # remove idle real connections after 10 min
server_connect_timeout = 5
server_login_retry = 3

# Client connection limits
client_login_timeout = 60
query_timeout = 30           # kill queries running over 30 seconds
transaction_timeout = 300    # kill transactions over 5 minutes

# Auth
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Logging
log_connections = 1
log_disconnections = 1
stats_period = 60            # log pool stats every 60 seconds
```

---

## RDS Proxy (for Serverless)

### The Lambda connection explosion problem

AWS Lambda scales out horizontally — each concurrent invocation is a separate execution environment that opens its own database connections:

```
Normal load:    10 Lambda instances × pool=5 = 50 connections  ✅
Traffic spike: 500 Lambda instances × pool=5 = 2,500 connections

2,500 connections hitting RDS:
  PostgreSQL: 2,500 × 10MB RAM = 25 GB just for connection processes
  Result: RDS runs out of memory → connection refused → all Lambdas fail  ❌
```

**RDS Proxy** solves this by acting as a managed connection pool between Lambda and RDS:

```
[Lambda 1]  ──┐
[Lambda 2]  ──┤
[Lambda 3]  ──┤   All connect to RDS Proxy (thin, cheap connections)
    ...     ──┤
[Lambda 500]──┘
               ↓
          [RDS Proxy]  ← maintains a small fixed pool of real RDS connections
               ↓
          [Amazon RDS]  ← only sees 20–50 real connections, not 2,500
```

### RDS Proxy features

| Feature | Detail |
|---------|--------|
| **Connection multiplexing** | Thousands of Lambda connections → tens of real RDS connections |
| **IAM authentication** | Lambda functions authenticate via IAM role, not hardcoded DB passwords |
| **Failover handling** | On RDS Multi-AZ failover, RDS Proxy queues queries and routes them to the new primary automatically — Lambda functions don't see the failover |
| **Connection pinning** | Some SQL features (temp tables, `SET` session variables) "pin" a Lambda to a specific RDS connection — reduces multiplexing efficiency |
| **Secrets Manager integration** | DB credentials auto-rotated without Lambda redeployment |

### When RDS Proxy helps vs hurts

| Scenario | RDS Proxy helpful? |
|---------|:------------------:|
| Serverless (Lambda, Fargate spot) — many short-lived clients | ✅ Essential |
| Containers on ECS/EKS with fixed instance count | ⚠️ PgBouncer may be cheaper |
| Traditional EC2 application with long-lived pool | ❌ Adds latency with no benefit |
| RDS Multi-AZ with critical failover SLA | ✅ Smooth failover |
| PostgreSQL with heavy use of session features | ⚠️ Connection pinning reduces efficiency |

---

## Connection Validation Strategies

A connection can go stale — the database server closes it (timeout, restart, network interruption) while your pool still considers it valid. Borrowing a stale connection results in an immediate `SQLException`.

### How pools detect stale connections

<Tabs>
  <TabItem value="test-on-borrow" label="Test on borrow (safe, slight overhead)">

Before handing a connection to a thread, the pool sends a lightweight test query (`SELECT 1`). If it fails, the connection is discarded and a new one is created.

```yaml
# HikariCP — enable test on borrow
hikari:
  connection-test-query: SELECT 1    # for older drivers; modern drivers use isValid()
  validation-timeout: 3000           # fail if test takes > 3s
```

**Overhead:** ~0.1ms per borrow (negligible). Recommended for production.

  </TabItem>
  <TabItem value="keepalive" label="Keepalive (preferred)">

Instead of testing on every borrow, send a lightweight heartbeat to idle connections periodically. This prevents stale connections from accumulating without the per-borrow overhead.

```yaml
hikari:
  keepalive-time: 30000    # ping idle connections every 30 seconds
  # HikariCP uses Connection.isValid() as the keepalive probe
```

**Best for:** cloud environments where firewalls kill idle TCP connections after a few minutes.

  </TabItem>
  <TabItem value="max-lifetime" label="Max lifetime (always use)">

Regardless of validation, recycle every connection after a maximum age. This catches connections that have silently degraded (memory leaks in the DB backend process, server-side statement cache pollution).

```yaml
hikari:
  max-lifetime: 1800000    # recycle connections after 30 minutes
  # CRITICAL: set 30 seconds shorter than your DB's wait_timeout/tcp_keepalive_time
```

For PostgreSQL:
```sql
-- Check your DB's connection limit settings
SHOW idle_in_transaction_session_timeout;
SHOW tcp_keepalives_idle;
-- Set max-lifetime in HikariCP to at least 30s shorter than these values
```

  </TabItem>
</Tabs>

---

## Connection Pool Library Comparison

<Tabs>
  <TabItem value="hikari" label="HikariCP (default)">

```xml
<!-- Already included in Spring Boot starter — no extra dependency needed -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

- Fastest borrow/return time (~microseconds)
- Smallest codebase (~130KB jar)
- Best diagnostics (leak detection, metrics)
- Default in Spring Boot 2.x+

**Choose HikariCP** for all new Spring Boot applications.

  </TabItem>
  <TabItem value="c3p0" label="c3p0 (legacy)">

```xml
<dependency>
    <groupId>com.mchange</groupId>
    <artifactId>c3p0</artifactId>
    <version>0.9.5.5</version>
</dependency>
```

- Older pool — still found in legacy codebases
- More configuration options but more complex
- Slower than HikariCP
- Known for memory leaks under certain configurations

**Avoid for new code.** Migrate to HikariCP.

  </TabItem>
  <TabItem value="dbcp2" label="Apache DBCP2">

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-dbcp2</artifactId>
</dependency>
```

- Commons DBCP2 is the Apache pool
- Reliable, well-maintained
- Slower than HikariCP (~2-3×)
- Used in some Apache Tomcat configurations

**Use only if you have a specific Apache ecosystem requirement.**

  </TabItem>
  <TabItem value="r2dbc" label="R2DBC (reactive)">

```xml
<!-- For reactive Spring WebFlux applications -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-r2dbc</artifactId>
</dependency>
<dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-pool</artifactId>
</dependency>
```

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/mydb
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m
      validation-query: SELECT 1
```

R2DBC uses non-blocking I/O — connections are never "held" blocking a thread. A reactive pipeline releases the connection between async database calls automatically.

**Use only with Spring WebFlux.** Do not mix with Spring MVC (blocking) — you will lose the benefits and add complexity.

  </TabItem>
</Tabs>

---

## Monitoring & Observability

### Auto-exposing HikariCP metrics via Actuator

```xml
<!-- pom.xml — Actuator and Micrometer -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

```yaml
# application.yaml — expose metrics endpoint
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus
  metrics:
    tags:
      application: ${spring.application.name}
```

```java
// Register HikariCP metrics with Micrometer
@Configuration
public class HikariMetricsConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> hikariPoolMetrics(DataSource dataSource) {
        return registry -> {
            if (dataSource instanceof HikariDataSource hds) {
                new HikariDataSourcePoolMetrics(hds, registry, Tags.empty()).bindTo(registry);
            }
        };
    }
}
```

### Key metrics and alert thresholds

| Metric | What it measures | Alert threshold |
|--------|----------------|----------------|
| `hikaricp.connections.active` | Currently borrowed connections | Approaching `maximum-pool-size` sustained |
| `hikaricp.connections.pending` | Threads waiting for a connection | **> 0 for more than 5 seconds** → pool starvation |
| `hikaricp.connections.idle` | Warm, available connections | Drops to 0 → imminent starvation |
| `hikaricp.connections.acquire` | Avg time to borrow a connection | P99 > 10ms → pool under pressure |
| `hikaricp.connections.creation` | Time to open a new physical connection | Spike → dynamic pool churn (fix: fixed-size pool) |
| `hikaricp.connections.usage` | Time a connection is held per borrow | Spike → long transactions or slow queries |
| `hikaricp.connections.timeout.total` | Count of `connection-timeout` exceptions | **Any > 0** → pool exhaustion events |

### Grafana dashboard queries (PromQL)

```promql
# Active connections as % of pool capacity — alert at 80%
hikaricp_connections_active / hikaricp_connections_max * 100

# Pending threads — alert if > 0 for > 30 seconds
hikaricp_connections_pending > 0

# Connection acquisition P99 latency
histogram_quantile(0.99, rate(hikaricp_connections_acquire_seconds_bucket[5m]))

# Timeout rate per minute
rate(hikaricp_connections_timeout_total[1m]) * 60
```

### Connection leak detection

```java
// Enable in staging and production
spring:
  datasource:
    hikari:
      leak-detection-threshold: 5000   # warn if held > 5 seconds

// When a leak is detected, HikariCP logs:
// WARN  HikariPool-Orders - Connection leak detection triggered for
//       com.example.OrderService.processOrder(OrderService.java:42),
//       stack trace follows ...
//
// Stack trace shows EXACTLY which method borrowed and didn't return the connection.
```

---

## Production Patterns

<details>
<summary>🔬 Senior deep-dive: connection pool per DataSource in multi-tenant systems</summary>

In a multi-tenant SaaS app where each tenant has their own database schema or database instance, you need a pool per tenant — not one shared pool:

```java
@Configuration
public class MultiTenantDataSourceConfig {

    // Lazily created pool per tenant — created on first request, reused thereafter
    private final ConcurrentHashMap<String, HikariDataSource> pools = new ConcurrentHashMap<>();

    public DataSource getDataSourceForTenant(String tenantId) {
        return pools.computeIfAbsent(tenantId, this::createPool);
    }

    private HikariDataSource createPool(String tenantId) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://db-" + tenantId + ":5432/app");
        config.setUsername(getTenantUser(tenantId));
        config.setPassword(getTenantPassword(tenantId));
        config.setMaximumPoolSize(5);          // smaller pool per tenant
        config.setMinimumIdle(2);
        config.setConnectionTimeout(3000);
        config.setPoolName("HikariPool-" + tenantId);
        return new HikariDataSource(config);
    }

    // Shutdown pools gracefully on application stop
    @PreDestroy
    public void closeAll() {
        pools.values().forEach(HikariDataSource::close);
    }
}
```

**Key consideration:** if you have 1,000 tenants and each pool keeps 2 idle connections, you have 2,000 open connections to your database cluster. Use PgBouncer in front of each database or shared schema isolation to manage this.

</details>

<details>
<summary>🔬 Senior deep-dive: read/write splitting with separate pools</summary>

For read-heavy applications, route read-only queries to replicas and writes to the primary — each with its own pool:

```java
@Configuration
public class ReadWriteDataSourceConfig {

    @Bean
    @Primary
    public DataSource routingDataSource(
            @Qualifier("primaryDs") DataSource primary,
            @Qualifier("replicaDs") DataSource replica) {

        AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                // TransactionSynchronizationManager tells us if we're in a read-only tx
                return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
                    ? "replica" : "primary";
            }
        };
        routing.setTargetDataSources(Map.of("primary", primary, "replica", replica));
        routing.setDefaultTargetDataSource(primary);
        return routing;
    }

    @Bean("primaryDs")
    public DataSource primaryDataSource() {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl("jdbc:postgresql://primary-db:5432/mydb");
        cfg.setMaximumPoolSize(20);
        cfg.setPoolName("HikariPool-Primary");
        return new HikariDataSource(cfg);
    }

    @Bean("replicaDs")
    public DataSource replicaDataSource() {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl("jdbc:postgresql://replica-db:5432/mydb");
        cfg.setMaximumPoolSize(40);   // more connections — reads are higher volume
        cfg.setPoolName("HikariPool-Replica");
        return new HikariDataSource(cfg);
    }
}

// Usage — Spring routes to replica automatically
@Transactional(readOnly = true)   // ← routes to replica pool
public List<OrderDto> listOrders() { return orderRepository.findAll(); }

@Transactional                    // ← routes to primary pool
public OrderDto createOrder(CreateOrderRequest req) { ... }
```

</details>

<details>
<summary>🔬 Senior deep-dive: graceful shutdown and connection draining</summary>

During a rolling deployment, you must drain connections gracefully — in-flight queries must complete before the pool closes:

```java
@Configuration
public class GracefulShutdownConfig {

    @Bean
    public HikariDataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setMaximumPoolSize(20);
        config.setConnectionTimeout(3000);
        return new HikariDataSource(config);
    }

    // Spring Boot calls this before the JVM exits
    @PreDestroy
    public void closeDataSource(HikariDataSource dataSource) {
        // HikariCP close() waits for active connections to be returned
        // before physically closing the underlying TCP sockets.
        // In-flight transactions will complete; new borrows will fail immediately.
        dataSource.close();
        log.info("Connection pool closed gracefully");
    }
}
```

```yaml
# application.yaml — give enough time for in-flight requests to complete
server:
  shutdown: graceful           # wait for active requests before stopping

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s   # 30 seconds to drain
```

**Kubernetes readiness probe:** set the pod to `NotReady` first (so no new traffic is routed), then wait for in-flight requests to drain, then close the pool. The pool's `close()` call blocks until all connections are returned.

</details>

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `minimum-idle < maximum-pool-size` (dynamic pool) | Latency spike on traffic surges while new connections are established | Set `minimum-idle = maximum-pool-size` for a fixed-size pool |
| `connection-timeout: 30000` (default 30s) | Threads queue for 30 seconds before failing — request pile-up under starvation | Reduce to 2,000–5,000ms to fail fast |
| External HTTP call inside `@Transactional` | Connection held idle during slow external call — pool depletes | Move external calls outside `@Transactional` scope |
| N+1 queries inside a transaction | Connection held for N sequential DB round trips | Fix with `JOIN FETCH` or `@EntityGraph` |
| Pool size = 500 "for performance" | DB CPU thrash, context switching, lock contention — performance collapses | Use the sizing formula: `(cores × 2) + spindles` |
| No `max-lifetime` configured | Connections silently stale — DB closes them, JDBC gets `broken pipe` errors | Always set `max-lifetime: 1800000` (30 min) |
| `leak-detection-threshold` disabled in production | Connection leaks silently drain the pool with no log evidence | Enable at 5,000ms; the stack trace shows exactly where the leak is |
| PgBouncer transaction mode + prepared statements | `ERROR: prepared statement "S_1" does not exist` | Add `prepareThreshold=0` to JDBC URL |
| Lambda without RDS Proxy | 500 Lambda instances × pool=5 = 2,500 connections → RDS OOM crash | Use RDS Proxy for serverless; limit pool size on Lambda to 1–2 |
| Not accounting for multiple app instances | 5 instances × pool=20 = 100 connections — exceeds DB formula of 20 | Divide total by instance count; use PgBouncer to centralise pooling |

---

## 🎯 Interview Questions

**Q1. What is connection pooling and why is it needed?**
> Opening a new database connection requires a TCP handshake, TLS negotiation, database authentication, and backend process allocation — typically 10–100ms. A connection pool maintains a cache of pre-opened, pre-authenticated connections. Threads borrow a connection (< 1ms), run their query, and return it. This eliminates the per-request setup cost, enables connection reuse, and caps the total number of connections the database must serve — preventing resource exhaustion.

**Q2. How does HikariCP determine when to time out a connection request?**
> When a thread calls `getConnection()`, HikariCP checks if an idle connection is available. If not, it places the thread in a queue and waits up to `connection-timeout` milliseconds (default 30s). If no connection becomes available within that window, HikariCP throws `SQLTransientConnectionException`. This is pool starvation — the signal that either pool size is too small, queries are holding connections too long, or the system is overloaded.

**Q3. Why is setting the pool size to a very large number a bad idea?**
> More connections does not equal more throughput. A database server with N CPU cores can execute exactly N queries simultaneously. Adding more concurrent connections beyond the optimal point causes: (1) CPU context switching overhead — the OS wastes cycles saving and restoring thread state; (2) disk I/O contention — concurrent writes compete for finite IOPS; (3) increased lock contention — more active transactions mean more row-level and table-level lock waits. Performance peaks at the "knee" of the throughput curve and degrades beyond it. The empirical formula `(CPU_cores × 2) + spindle_count` gives a good starting point — validate with load testing.

**Q4. What is pool starvation and what causes it?**
> Pool starvation is when all connections are borrowed simultaneously, causing new requests to queue at `connection-timeout` and then fail. Common causes: (1) N+1 queries — one request holds a connection across N serial DB round trips; (2) long transactions — a `@Transactional` method makes a slow external HTTP call while holding the connection idle; (3) thread pool / connection pool mismatch — more app threads than DB connections, causing threads waiting for connections to block threads holding them; (4) slow queries — a query suddenly takes 5× longer, multiplying connection hold time across all concurrent threads.

**Q5. What is the difference between PgBouncer session mode and transaction mode?**
> In session mode, a real PostgreSQL connection is assigned to a client for their entire session — returned only when they disconnect. Safe for all features but provides limited multiplexing. In transaction mode, the real connection is assigned only for the duration of a transaction — returned immediately on `COMMIT/ROLLBACK`. Enables 10× multiplexing (one real connection can serve multiple clients interleaved between transactions) but breaks connection-scoped features: prepared statement caching, temporary tables, `SET` session variables, and advisory locks. Transaction mode is the production default; prepared statement caching must be disabled via `prepareThreshold=0` in the JDBC URL.

**Q6. Why does Lambda without RDS Proxy crash the database during traffic spikes?**
> AWS Lambda scales horizontally — each concurrent invocation runs in an isolated execution environment with its own database connections. A traffic spike from 10 to 500 concurrent Lambda invocations causes 500 separate connection pools to try connecting to RDS simultaneously. PostgreSQL spawns one OS process per connection (~10MB RAM each) — 500 connections consume 5GB of RAM just for connection management, often exceeding the RDS instance's available memory. The database crashes with "too many connections" or runs out of memory. RDS Proxy solves this by multiplexing the 500 Lambda connections onto 20–50 real RDS connections.

**Q7. (Senior) How would you diagnose a connection pool leak in production without restarting the application?**
> Step 1: Enable `leak-detection-threshold: 5000` in HikariCP config (requires restart or dynamic config update). This logs a warning with a full stack trace identifying exactly which method borrowed a connection and didn't return it within 5 seconds. Step 2: Check `hikaricp.connections.pending` in Prometheus/Grafana — sustained pending count > 0 confirms starvation. Step 3: Check `hikaricp.connections.active` approaching `maximum-pool-size` — confirm all connections are borrowed. Step 4: Query the database directly: `SELECT pid, query, state, query_start, state_change FROM pg_stat_activity WHERE state = 'idle in transaction'` — connections in "idle in transaction" state have borrowed a connection but are not executing SQL (the leak). Step 5: Correlate the `pid` from `pg_stat_activity` with the `pg_locks` view to see if these connections hold locks blocking other queries.

---

## See Also

- [Spring Data JPA: Custom Queries with @Query](../spring/spring-data-jpa-query-annotation)
- [Spring Batch — Complete Guide](../spring/spring-batch)
- [Database Sharding & Partitioning](../system-design/sharding-partitioning)
- [Spring Exception Handling — @RestControllerAdvice](../spring/spring-exception-handling)