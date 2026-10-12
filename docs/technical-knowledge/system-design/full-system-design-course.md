---
id: full-system-design-course
title: "System Design Master Course: From Single Server to Production Infrastructure"
sidebar_label: Full System Design Course
description: Comprehensive production-grade guide based on the complete System Design Course (APIs, Databases, Caching, CDNs, Load Balancing & Production Infra). Covers single-server limits, SQL vs NoSQL vs Graph databases, horizontal scaling, L4/L7 load balancing, health checks, SPOF mitigation, API protocols, TCP/UDP, REST vs GraphQL vs gRPC, authentication (JWT/OAuth2/OIDC), and multi-tier caching defense-in-depth.
tags: [system-design, architecture, databases, load-balancing, apis, networking, security, caching, course]
---

import SystemDesignCourseFullDiagram from '@site/src/components/SystemDesignCourseFullDiagram';

# System Design Master Course: From Single Server to Production Infrastructure

> Based on the complete curriculum of the **System Design Course** (Video Reference: [YouTube C842vFY5kRo](https://www.youtube.com/watch?v=C842vFY5kRo) by Hayk Simonyan on freeCodeCamp).

In senior software engineering and system architecture, designing scalable systems is not about memorizing buzzwords or blindly adopting microservices. It is about **understanding physical hardware limits, identifying system bottlenecks, and making mathematically sound architectural trade-offs**. 

Every large-scale architecture powering modern tech companies began as a humble single server. Systems evolve incrementally: **you only introduce new infrastructure tiers when an existing component hits a measurable physical bottleneck (CPU saturation, Memory exhaustion, Disk I/O limits, or Network socket starvation).**

---

## Interactive Master Course Architecture Visualizer

Explore the interactive curriculum modules, compare database paradigms, test load balancer failovers, and examine production multi-tier caching topologies:

<SystemDesignCourseFullDiagram />

---

## 1. High-Level Design (HLD) vs Low-Level Design (LLD)

Before diving into hardware and protocols, software engineers must establish the boundary between the two primary phases of architectural design:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM DESIGN SPECTRUM                            │
├──────────────────────────────────────┬──────────────────────────────────────┤
│       HIGH-LEVEL DESIGN (HLD)        │        LOW-LEVEL DESIGN (LLD)        │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Focus: System topology & boundaries │ • Focus: Code-level implementation  │
│ • Components: Services, DBs, Caches  │ • Components: Classes, interfaces   │
│ • Protocols: HTTP, gRPC, TCP, Kafka  │ • Patterns: Factory, Strategy, DTOs │
│ • Non-Functionals: SLA, SLO, Latency │ • Concurrency: Locks, CAS, Threads  │
│ • Audience: Staff Architects, Leads  │ • Audience: Software Developers     │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Functional vs Non-Functional Requirements
Every robust architecture begins with requirements classification:
1. **Functional Requirements:** What the system **must do** from a business feature perspective (e.g., *"Users can place an order, cancel an order, and view their order history."*).
2. **Non-Functional Requirements (NFRs):** How the system **behaves** under operational load. These govern the architectural choices:
   - **Latency:** p99 response time must be under 50ms for read endpoints.
   - **Availability:** 99.99% uptime ("Four Nines" allows no more than 52.6 minutes of unscheduled downtime per year).
   - **Throughput:** System must handle 50,000 peak writes per second during sales events.
   - **Consistency:** Financial balances require strict immediate consistency (ACID); social comments accept eventual consistency (BASE).

---

## 2. Module 1: The Single Server Setup & Physical Bottlenecks

### The Anatomy of a Single Server
At the initial stage of any application, the web application server, relational database, and caching layer all reside on a **single physical or virtual server (VPS)**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SINGLE SERVER (VPS / INSTANCE)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [ Web / Mobile Client ]                                                    │
│            │                                                                │
│            │ 1. DNS Resolution (domain -> IP)                               │
│            ▼                                                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Single Host Operating System (Linux Kernel)                           │  │
│  │                                                                       │  │
│  │  ┌───────────────────────┐   ┌──────────────────────────────────────┐ │  │
│  │  │ Web Application       │   │ Relational Database                  │ │  │
│  │  │ (Node / Spring / Go)  │◀─▶│ (PostgreSQL / MySQL)                 │ │  │
│  │  │ Port :80 / :443       │   │ Port :5432                           │ │  │
│  │  └───────────────────────┘   └──────────────────────────────────────┘ │  │
│  │             ▲                                                         │  │
│  │             │ (Unix Socket / Localhost)                               │  │
│  │             ▼                                                         │  │
│  │  ┌───────────────────────┐                                            │  │
│  │  │ Local In-Memory Cache │                                            │  │
│  │  │ (Redis / Memcached)   │                                            │  │
│  │  └───────────────────────┘                                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The 4 Physical Hardware Bottlenecks
Every computer server is bounded by 4 physical hardware constraints:
1. **CPU (Compute & Threads):**
   - High concurrent user traffic causes thread contention and OS context-switching overhead.
   - CPU throttling occurs when application worker threads saturate all available cores.
2. **RAM (Volatile Memory):**
   - Both the application runtime (JVM heap, Node V8 memory) and the database buffer pool compete for physical RAM.
   - If memory is exhausted, the Linux kernel invokes the `oom-killer` (Out-of-Memory Killer), terminating processes abruptly, or begins memory paging to swap space on disk, degrading performance by $10,000\times$.
3. **Disk I/O (Storage IOPS & Latency):**
   - Databases rely on disk persistence. Relational indexes (B+Trees) require random reads, while transaction logs (WAL) require sequential writes.
   - When IOPS (Input/Output Operations Per Second) saturate, queries queue up in kernel disk wait queues (`iowait`), causing connection pools to stall.
4. **Network Bandwidth & Sockets:**
   - Network Interface Cards (NICs) have finite throughput (e.g., 1 Gbps or 10 Gbps).
   - The OS can only maintain a finite number of concurrent TCP connections before running into file descriptor limits (`ulimit -n`) or ephemeral port exhaustion (maximum 65,535 TCP ports).

### The Inevitable Single Point of Failure (SPOF)
A single server setup is the ultimate **Single Point of Failure (SPOF)**:
- A single unhandled exception or memory leak in the application crashes the entire machine.
- Operating system updates or hardware reboots guarantee 100% service outage.
- Database disk corruption destroys both live transactions and active user sessions.

---

## 3. Module 2: Databases — SQL, NoSQL & Graph

When traffic grows, the database must be decoupled from the application server onto a dedicated managed instance. Choosing the correct database paradigm requires understanding the underlying data structures:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE PARADIGM MATRIX                          │
├───────────────────┬──────────────────────┬──────────────────────────────────┤
│ CATEGORY          │ PRIMARY DATA MODEL   │ BEST USE CASES                   │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ Relational (SQL)  │ Normalized Tables,   │ Financial ledgers, ACID ledger,  │
│                   │ B+Tree Indexes       │ complex relational joins         │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ NoSQL Document    │ JSON/BSON Documents, │ Product catalogs, user profiles, │
│                   │ Dynamic Schema       │ content management systems       │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ NoSQL Key-Value   │ Hash Map,            │ User sessions, caching, rate     │
│                   │ In-Memory Key Store  │ limiting, leaderboards           │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ NoSQL Wide-Column │ LSM-Tree,            │ High-velocity IoT telemetry,     │
│                   │ Sparse Matrix        │ time-series metrics, write logs  │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ Graph Database    │ Nodes & Edges,       │ Social networks, fraud rings,    │
│                   │ Index-Free Adjacency │ recommendation engines           │
└───────────────────┴──────────────────────┴──────────────────────────────────┘
```

### 1. Relational Databases (SQL - PostgreSQL, MySQL)
- **ACID Guarantees:**
  - **Atomicity:** All statements inside a transaction succeed, or the entire transaction is rolled back via undo logs.
  - **Consistency:** Transactions transition the database from one valid state to another, enforcing foreign keys, check constraints, and unique indices.
  - **Isolation:** Concurrency control via Multi-Version Concurrency Control (MVCC) and Two-Phase Locking (2PL), preventing dirty reads and phantom reads.
  - **Durability:** Committed transactions are guaranteed to survive power outages by flushing to Write-Ahead Logs (WAL) on disk.
- **Storage Engine:** Relational databases organize records into 8KB or 16KB disk pages arranged as balanced search trees (**B+Trees**), providing $O(\log N)$ search, insertion, and range scans.

### 2. NoSQL Document Databases (MongoDB, Couchbase)
- Stores data as semi-structured, nested documents (JSON/BSON).
- **Schema-on-Read:** Different documents in the same collection can have different fields, avoiding costly `ALTER TABLE` locks during schema evolution.
- **Scaling:** Scales horizontally using partition keys (shards). Eliminates relational joins by embedding child entities directly into parent documents (e.g., embedding order line items directly inside the order document).

### 3. NoSQL Key-Value Stores (Redis, AWS DynamoDB)
- The simplest and fastest storage abstraction: maps a unique string key to a raw value.
- **Redis Under the Hood:** Runs as an in-memory single-threaded event loop (multiplexed via `epoll`), executing operations in sub-millisecond time ($O(1)$ lookup). Offers rich data structures: Strings, Hashes, Lists, Sets, Sorted Sets (`ZSET` backed by Skip Lists), and HyperLogLog.

### 4. Graph Databases (Neo4j, Amazon Neptune)
- In relational databases, traversing relationships (e.g., finding friends of friends) requires recursive SQL joins (`JOIN` on foreign keys). With $K$ levels of depth, relational query latency explodes exponentially: $O(N^K)$.
- **Index-Free Adjacency:** Graph databases store edges as direct physical pointers in memory/disk. Traversing from one node to its connected neighbor is an $O(1)$ pointer dereference.
- **Production Fit:**
  - Social network relationship mapping (LinkedIn 2nd and 3rd-degree connections).
  - Financial anti-money laundering (detecting cyclical transaction rings between shell accounts).
  - Knowledge graphs and identity resolution.

---

## 4. Module 3: Vertical vs Horizontal Scaling

When compute demand exceeds single-server capacity, engineering teams must evaluate scaling dimensions:

```
    VERTICAL SCALING (SCALE UP)              HORIZONTAL SCALING (SCALE OUT)
    ┌─────────────────────────┐               ┌───────┐ ┌───────┐ ┌───────┐
    │  BIGGER SERVER          │               │ Pod 1 │ │ Pod 2 │ │ Pod 3 │
    │  • 128 vCPUs            │               └───────┘ └───────┘ └───────┘
    │  • 512 GB RAM           │                   ▲         ▲         ▲
    │  • 10 Gbps NIC          │                   │         │         │
    │                         │               ┌───┴─────────┴─────────┴───┐
    │  ❌ Hardware Ceiling    │               │    LOAD BALANCER (ALB)    │
    │  ❌ Exponential Cost    │               └───────────────────────────┘
    │  ❌ Downtime on Upgrade │               ✅ Infinite elastic scaling
    │  ❌ Single Point of Fail│               ✅ Zero downtime deployments
    └─────────────────────────┘               ✅ Commodity hardware economics
```

### The Rules of Horizontal Scalability
To successfully scale horizontally, application architectures must adhere to strict principles:
1. **Stateless Application Tier:** Application servers must not store client session data, uploaded files, or in-memory state on local disk. If Pod 1 crashes, Pod 2 must be capable of processing the user's next request without disruption.
2. **Externalized Session State:** User sessions are offloaded to an external distributed cache cluster (e.g., Redis Cluster) or passed statelessly as signed cryptographic JSON Web Tokens (JWT).
3. **Automated Elasticity:** Horizontal Pod Autoscalers (HPA) monitor metrics (CPU utilization > 70%, p95 latency > 200ms) to spin up new pods or terminate idle compute dynamically.

---

## 5. Module 4: Load Balancing & Health Checks

A **Load Balancer (LB)** sits between incoming clients and backend server fleets. It acts as the traffic cop, routing requests across healthy instances while providing SSL/TLS offloading and defense against denial-of-service traffic.

### Layer 4 vs Layer 7 Load Balancing

| Dimension | Layer 4 (Transport / NLB) | Layer 7 (Application / ALB) |
| :--- | :--- | :--- |
| **OSI Layer** | Transport Layer (TCP / UDP) | Application Layer (HTTP / HTTPS / gRPC) |
| **Data Inspected** | Source/Destination IP, TCP Port | URL Path, HTTP Headers, Cookies, JSON Body |
| **Routing Intelligence** | Packet forwarding only | Smart routing (e.g. `/orders` $\rightarrow$ Order Service) |
| **Throughput & Speed** | Extreme (Millions of RPS, sub-ms) | Moderate (Higher CPU due to TLS & HTTP parsing) |
| **SSL/TLS Termination** | Passes raw TCP or offloads TLS | Full TLS termination, SNI certificates, HTTP/2 |
| **Production Tools** | AWS NLB, HAProxy (TCP mode), IPVS | AWS ALB, NGINX, Envoy Proxy, Traefik |

### Core Load Balancing Algorithms
1. **Round Robin:** Requests are distributed sequentially across the server list ($1 \rightarrow 2 \rightarrow 3 \rightarrow 1$). Best when all servers have identical hardware and requests have uniform processing costs.
2. **Weighted Round Robin:** Assigns higher request quotas to servers with superior CPU/RAM specifications.
3. **Least Connections:** Directs incoming traffic to the server with the fewest active TCP connections. Ideal for long-lived connections (WebSockets, database proxies).
4. **IP Hash:** Hashes the client's source IP address (`hash(client_ip) % N`) to map a user deterministically to the same backend server.
5. **Consistent Hashing:** Uses a logical 360-degree hash ring with virtual nodes. When a server node is added or removed, only $1/N$ keys are remapped, preventing cache-flush stampedes.

### Health Check Strategy: Liveness vs Readiness
Load balancers maintain active target groups by probing application endpoints:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HEALTH PROBE SPECIFICATION                            │
├──────────────────────────────────────┬──────────────────────────────────────┤
│        LIVENESS PROBE (/healthz)     │       READINESS PROBE (/readyz)      │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Goal: Detect hung or deadlocked    │ • Goal: Detect if instance is ready   │
│   threads, out-of-memory states      │   to accept live user traffic        │
│ • Action on Failure: Kill container  │ • Action on Failure: Remove from LB  │
│   and trigger immediate restart      │   pool; KEEP CONTAINER RUNNING       │
│ • Check Scope: Ultra-lightweight     │ • Check Scope: Warming caches, DB    │
│   internal runtime ping              │   connection pools, migration status │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

> **Production Warning: The Deep Health Check Trap**  
> Never configure a load balancer health check to execute a heavy database query (e.g., `SELECT 1 FROM orders`). If the database slows down, all 50 application pods will fail their health checks simultaneously. The load balancer will mark the entire fleet as dead, turning a transient database slow-down into a complete application-wide blackout!

---

## 6. Module 5: API Design & Protocol Lifecycle

APIs represent the public contract between consumers and backend services. Professional API design requires standardization across endpoints, idempotency, and pagination.

### HTTP Verbs & Idempotency Rules
An HTTP method is **idempotent** if making multiple identical requests has the exact same side-effect on the server as making a single request:

```
   GET /orders/101      ▶ IDEMPOTENT     (Safe read, no state mutated)
   PUT /orders/101      ▶ IDEMPOTENT     (Overwrites complete state to value X)
   DELETE /orders/101   ▶ IDEMPOTENT     (Resource is deleted; repeated calls do nothing)
   POST /orders         ▶ NON-IDEMPOTENT (Creates a new order on every submission!)
```

#### Enforcing Idempotency on POST Mutations
To prevent double-billing during network timeouts, clients supply an `Idempotency-Key` UUID in the request header:
1. Client generates UUID: `Idempotency-Key: 7b2e3a1f-4c91-4d82`.
2. Server attempts an atomic insert into an idempotency table:
   ```sql
   INSERT INTO idempotency_records (key, status, response_body)
   VALUES ('7b2e3a1f-4c91-4d82', 'PROCESSING', NULL);
   ```
3. If the insert violates a unique constraint, the server recognizes a duplicate request and either waits for completion or returns the cached response immediately.

### Pagination at Scale: Offset vs Cursor Pagination

```sql
-- 1. OFFSET PAGINATION (Slow & Drifting)
SELECT * FROM products ORDER BY created_at DESC LIMIT 20 OFFSET 500000;
-- Bottleneck: The database must scan through 500,000 index entries, discard them,
-- and return only the next 20. Performance degrades linearly: O(N).

-- 2. CURSOR / KEYSET PAGINATION (Fast & Constant Time)
SELECT * FROM products 
WHERE id > 'prod_90210' 
ORDER BY id ASC 
LIMIT 20;
-- Engine Truth: Uses B+Tree index seek directly to the cursor key.
-- Executes in constant time: O(1) regardless of page depth!
```

---

## 7. Module 6: Transport Layer (TCP vs UDP) & The Modern Web

Every API call relies on transport protocols operating at Layer 4 of the OSI model:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TRANSPORT LAYER COMPARISON                            │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  TCP (TRANSMISSION CONTROL PROTOCOL) │     UDP (USER DATAGRAM PROTOCOL)     │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Connection-oriented (3-Way Handshake)│ • Connectionless (Fire and Forget)  │
│ • Guaranteed delivery via ACK packets │ • No acknowledgments or retries     │
│ • Strict in-order byte stream        │ • Packets may arrive out of order    │
│ • Flow control (Sliding Window)      │ • Zero connection overhead           │
│ • Congestion control (Cubic / BBR)   │ • 8-byte fixed header (vs 20–60B)    │
│ • Head-of-Line (HoL) blocking        │ • Immune to connection stalls        │
│ • Best For: Web, APIs, Banking, SSH  │ • Best For: DNS, VoIP, Gaming, QUIC  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### The TCP 3-Way Handshake
Before sending a single byte of HTTP data over TCP, client and server must establish synchronization:
1. **SYN:** Client sends Synchronize packet with initial sequence number ($ISN_c$).
2. **SYN-ACK:** Server acknowledges ($ACK = ISN_c + 1$) and sends its own sequence number ($ISN_s$).
3. **ACK:** Client acknowledges server sequence number ($ACK = ISN_s + 1$).
4. **Data Transfer Begins:** Introduces 1 full Round-Trip Time (RTT) of latency before payload transmission.

### Evolution to HTTP/3 and QUIC
- **HTTP/1.1:** Textual protocol, suffers from Head-of-Line (HoL) blocking at the application layer.
- **HTTP/2:** Introduces binary framing and multiplexes multiple streams over a **single TCP connection**.  
  *The Flaw:* If a single packet drops on the network, the underlying TCP connection stalls **all multiplexed streams** until that packet is retransmitted (TCP-level HoL blocking).
- **HTTP/3 (QUIC):** Replaces TCP with **QUIC over UDP**:
  - Independent byte streams: A dropped packet on stream 1 does not stall streams 2, 3, or 4.
  - **0-RTT Handshakes:** Clients reuse cryptographic keys to transmit HTTP data on the very first packet.
  - **Connection Migration:** Connection ID is decoupled from the client's IP address. When a mobile device switches from Wi-Fi to 5G, the connection persists seamlessly without reconnecting!

---

## 8. Module 7: API Architectural Styles (REST vs GraphQL vs gRPC)

Choosing an API style involves balancing developer ergonomics, payload serialization overhead, and network topologies:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API PARADIGM COMPARISON MATRIX                         │
├───────────────────┬──────────────────────┬──────────────────────────────────┤
│ ARCHITECTURE      │ COMMUNICATION MODEL  │ PROS & CONS                      │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ RESTful APIs      │ Resource-Oriented    │ Pro: Universal HTTP caching,     │
│                   │ CRUD endpoints       │      simple, widely adopted.     │
│                   │ (JSON over HTTP)     │ Con: Over/under-fetching data.   │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ GraphQL           │ Client-Specified     │ Pro: Client requests exact fields│
│                   │ Graph Queries        │      needed. Single endpoint.    │
│                   │ (POST over HTTP)     │ Con: N+1 query problem, complex  │
│                   │                      │      caching, denial-of-service. │
├───────────────────┼──────────────────────┼──────────────────────────────────┤
│ gRPC              │ Remote Procedure Call│ Pro: Binary Protobuf (tiny wire  │
│                   │ over HTTP/2          │      footprint), high CPU speed. │
│                   │ (Binary Streaming)   │ Con: Poor browser ergonomics,    │
│                   │                      │      requires gRPC-Web proxies.  │
└───────────────────┴──────────────────────┴──────────────────────────────────┘
```

### The GraphQL N+1 Query Problem & DataLoader
In GraphQL, nested resolvers execute independently. For example, querying 10 authors and their books:
```graphql
query {
  authors(limit: 10) {
    id
    name
    books { title } # Executes 1 query for authors + 10 individual queries for books!
  }
}
```
- **The Bug:** 1 query fetches 10 authors; 10 individual SQL queries fetch each author's books ($1 + 10 = 11$ total database queries).
- **The Solution:** Facebook's **DataLoader** pattern batches all book requests into a single grouped query (`SELECT * FROM books WHERE author_id IN (1, 2, ..., 10)`) within the same tick of the Node/JVM event loop.

---

## 9. Module 8: Authentication, Authorization & Identity Security

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION VS AUTHORIZATION                      │
├──────────────────────────────────────┬──────────────────────────────────────┤
│         AUTHENTICATION (AuthN)       │         AUTHORIZATION (AuthZ)        │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • "Who are you?"                     │ • "What are you permitted to do?"    │
│ • Verifies user identity via creds,  │ • Verifies access rights to specific │
│   passwords, biometric, or MFA       │   resources or actions               │
│ • Mechanisms: JWT, Session Cookie,   │ • Mechanisms: RBAC, ABAC, ReBAC,     │
│   OpenID Connect (OIDC) id_token     │   OAuth 2.0 scopes                   │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Stateful Sessions vs Stateless JWTs
1. **Stateful Session Authentication:**
   - Server creates a cryptographic session ID on login and stores user session attributes in an in-memory Redis cluster.
   - Client receives the session ID in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
   - **Trade-off:** Instant revocation (just delete the Redis key), but requires every request to query Redis.
2. **Stateless JSON Web Tokens (JWT):**
   - Contains three Base64URL encoded segments: `Header.Payload.Signature`.
   - Signed using asymmetric keys (`RS256` - private key signs, public key verifies).
   - **Trade-off:** Fast and stateless verification (no database lookup needed), but impossible to revoke before expiration without maintaining a token blacklist.

#### Production Standard: Short-Lived Access Tokens + Refresh Rotation
```
Client                      API Gateway / Auth Server                Redis Store
  │                                     │                                 │
  │─── 1. API Call (Access Token) ─────▶│ (Verifies Signature Locally)   │
  │    (Expires in 10 minutes)          │── Valid: Process Request        │
  │                                     │                                 │
  │─── 2. Access Token Expired ────────▶│ (Returns 401 Unauthorized)      │
  │                                     │                                 │
  │─── 3. POST /auth/refresh ──────────▶│── 4. Verify & Invalidate Key ──▶│
  │    (Sends Refresh Token)            │   (Generates NEW Access Token   │
  │                                     │    + NEW Refresh Token)         │
  │◀── 5. Returns Token Pair ───────────│                                 │
```

---

## 10. Module 9: Production Infrastructure, Edge Security & Multi-Tier Caching

High-performance production architectures implement a **Defense-in-Depth Caching & Security Hierarchy**, shielding internal services and the primary database from malicious traffic and load spikes:

```
[ Client Browser ] ──▶ [ CDN Edge + WAF (CloudFront) ] ──▶ [ API Gateway (Rate Limiter) ]
                                                                      │
                                                                      ▼
[ Primary Database ] ◀── [ Redis Cluster (L2) ] ◀── [ App In-Memory (L1 Caffeine) ]
```

### 1. Web Application Firewall (WAF) & DDoS Protection
At the perimeter edge, incoming traffic is scrubbed before reaching backend compute:
- **Layer 3/4 DDoS Mitigation:** Volumetric attacks (SYN floods, UDP amplification) are scrubbed at Edge Points of Presence (PoPs) using Anycast network routing and BGP Anycast scrubbing centers.
- **Layer 7 WAF (Web Application Firewall):** Inspects HTTP application payloads to block:
  - **SQL Injection (SQLi) & Cross-Site Scripting (XSS):** Evaluates URI query parameters and request bodies against OWASP Core Rule Sets (CRS).
  - **Layer 7 HTTP Floods & Scraping:** Identifies headless browser signatures, suspicious JA3/JA4 TLS fingerprints, and malicious user agents.
  - **Geo-Blocking & IP Reputation:** Restricts requests originating from known botnets, Tor exit nodes, or high-risk geographic regions.

### 2. Distributed Rate Limiting
Rate limiters protect downstream APIs from starvation and brute-force abuse.
- **Token Bucket Algorithm:** Tokens are added to a bucket at a fixed fill rate (e.g., 100 tokens/sec). Each request consumes 1 token. Allows burst traffic while maintaining an average rate ceiling.
- **Leaky Bucket Algorithm:** Requests enter a FIFO queue and leak out at a constant rate. Smooths out traffic spikes into steady processing flow.
- **Sliding Window Counter:** Implemented in Redis using Lua scripts: tracks request counts across overlapping time windows, preventing the 2x burst vulnerability of Fixed Window counters at boundary transitions.

### 3. The 5 Multi-Tier Caching Layers
1. **Browser Cache:** HTTP cache headers (`Cache-Control: max-age=31536000, immutable`, `ETag`) prevent round trips entirely for static bundles.
2. **CDN Edge Point of Presence (PoP):** Geographically distributed servers (CloudFront, Cloudflare) serve images, video chunks, and cached API responses within 10–20ms of end users.
3. **API Gateway Cache:** Responses for idempotent public endpoints (e.g., product catalog queries) are cached at the ingress proxy layer.
4. **Application L1 Cache (In-Memory):** In-process caching libraries (Caffeine in Java, Go-cache) store hot metadata in process heap memory, serving reads in &lt; 100 nanoseconds without network hops.
5. **Distributed L2 Cache (Redis Cluster):** Centralized in-memory store shared across all application pods.

### Caching Strategies & Failure Traps

#### 1. Cache-Aside (Lazy Loading)
- **Read Path:** Application checks Redis. If hit, return. If miss, query database, populate Redis, and return.
- **Write Path:** Application mutates the database first, then **deletes (invalidates)** the cache key in Redis. (Never write directly to cache during DB mutation to prevent race conditions).

#### 2. The Cache Stampede (Thundering Herd)
- **The Problem:** When a high-traffic cache key expires (e.g., the homepage configuration with 10,000 RPS), thousands of concurrent requests miss simultaneously and overwhelm the database with identical queries.
- **The Solution:** Use **Distributed Mutex Locking** on cache misses (only the single thread that acquires the Redis lock queries the database; other threads wait) or implement **Probabilistic Early Expiration (XFetch algorithm)**.

#### 3. Cache Penetration
- **The Problem:** An attacker queries non-existent IDs (`GET /users/-999999`), bypassing cache and hitting the database every time.
- **The Solution:** Cache empty results with a short TTL (`null` value with 30s TTL) or place a **Bloom Filter** in front of the cache to reject invalid keys in $O(1)$ time without database I/O.

---

## 11. Summary & Architecture Blueprint Checklist

When reviewing any production system design, evaluate this master operational checklist:

- [x] **Compute Statelessness:** Are application servers 100% stateless with sessions externalized to Redis or signed JWTs?
- [x] **No Single Point of Failure (SPOF):** Is every tier (DNS, Load Balancer, Web Fleet, Database, Cache) deployed with active redundancy across multiple Availability Zones?
- [x] **Correct Database Paradigm:** Are relational databases used for ACID invariants, document stores for polymorphic data, and graph databases for multi-hop network traversals?
- [x] **Layer 4 vs Layer 7 Load Balancing:** Is Layer 4 utilized for high-throughput packet routing and Layer 7 for intelligent path-based API dispatching?
- [x] **Health Check Safety:** Are liveness probes kept lightweight while deep database checks are strictly excluded from automated traffic kill-switches?
- [x] **Idempotent Mutations:** Do all non-idempotent endpoints (POST) enforce idempotency keys to eliminate duplicate financial transactions?
- [x] **Modern Transport Protocols:** Is HTTP/2 or HTTP/3 (QUIC) deployed to eliminate TCP-level head-of-line blocking for mobile clients?
- [x] **Multi-Tier Caching:** Is the database shielded by CDN edge caches, application in-memory caches, and Redis clusters using safe Cache-Aside invalidation?

---

## Related Guides & Deep Dives
- [Architecture Fundamentals & Evolutionary Scaling](/technical-knowledge/system-design/architecture-fundamentals)
- [Load Balancing Reliability & NGINX Internals](/technical-knowledge/system-design/load-balancing-reliability)
- [Rate Limiting Algorithms Deep Dive](/technical-knowledge/system-design/rate-limiting-algorithms)
- [Caching Strategies & Cache-Aside Mechanics](/technical-knowledge/system-design/caching-strategies)
- [API Design Standards & Contract Testing](/technical-knowledge/system-design/api-design)
- [Data-Driven vs Event-Driven Architecture](/technical-knowledge/system-design/data-driven-vs-event-driven)
