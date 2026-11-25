---
id: capacity-planning
title: Capacity Planning & Estimation
sidebar_label: Capacity Planning
description: Back-of-envelope estimation techniques for traffic, storage, bandwidth, and memory. Essential for system design interviews and production capacity planning.
tags: [capacity-planning, estimation, back-of-envelope, qps, storage, interview-prep]
---

# Capacity Planning & Estimation

> **Reference**: [Sujeet Pro — Capacity Planning and Back-of-the-Envelope Estimates](https://sujeet.pro/articles/capacity-planning-and-estimation)

> The goal is **order-of-magnitude accuracy**, not precision. Round aggressively.

---

## Essential Numbers to Memorize

### Reference Latency Numbers Every Engineer Should Know (Jeff Dean / Sujeet Pro)

| Operation / Hardware Boundary | Typical Latency | Order-of-Magnitude Human Scale ($1\text{ ns} \equiv 1\text{ sec}$) |
| :--- | :--- | :--- |
| **L1 CPU Cache Reference** | $0.5\text{ ns} - 1\text{ ns}$ | $1\text{ second}$ |
| **Branch Mispredict** | $3\text{ ns} - 5\text{ ns}$ | $5\text{ seconds}$ |
| **L2 CPU Cache Reference** | $4\text{ ns} - 7\text{ ns}$ | $7\text{ seconds}$ |
| **Mutex Lock / Unlock (Uncontended CAS)** | $15\text{ ns} - 25\text{ ns}$ | $25\text{ seconds}$ |
| **Main Memory (DDR5 DRAM) Reference** | $80\text{ ns} - 100\text{ ns}$ | $1.5\text{ minutes}$ |
| **Compress 1 KB with Snappy / LZ4** | $2,000\text{ ns}$ ($2\ \mu\text{s}$) | $33\text{ minutes}$ |
| **NVMe SSD Random 4 KB Read** | $16,000\text{ ns} - 100,000\text{ ns}$ ($16 - 100\ \mu\text{s}$) | $1\text{ day}$ |
| **Intra-Datacenter Round Trip (Same AZ)** | $500,000\text{ ns}$ ($0.5\text{ ms}$) | $5.8\text{ days}$ |
| **Read 1 MB Sequentially from NVMe SSD** | $1,000,000\text{ ns}$ ($1\text{ ms}$) | $11.5\text{ days}$ |
| **Cross-AZ Round Trip (Same Region)** | $1\text{ ms} - 2\text{ ms}$ | $23\text{ days}$ |
| **Cross-Region Round Trip (US-East $\leftrightarrow$ US-West)** | $60\text{ ms} - 75\text{ ms}$ | $2.4\text{ years}$ |
| **Cross-Continental RTT (US $\leftrightarrow$ Europe / Asia)** | $120\text{ ms} - 180\text{ ms}$ | $5\text{ years}$ |

### Power-of-2 Byte Conversions & Data Sizes
| Power of 2 | Exact Value | Decimal Approximation | Unit | Bytes |
|---|---|---|---|---|
| $2^{10}$ | $1,024$ | $10^3$ | **1 KB (KiB)** | $10^3$ |
| $2^{20}$ | $1,048,576$ | $10^6$ | **1 MB (MiB)** | $10^6$ |
| $2^{30}$ | $1,073,741,824$ | $10^9$ | **1 GB (GiB)** | $10^9$ |
| $2^{40}$ | $1,099,511,627,776$ | $10^{12}$ | **1 TB (TiB)** | $10^{12}$ |
| $2^{50}$ | $1.125 \times 10^{15}$ | $10^{15}$ | **1 PB (PiB)** | $10^{15}$ |

### Time Conversions
| Period | Seconds |
|---|---|
| 1 minute | 60 |
| 1 hour | 3,600 |
| 1 day | ~86,400 ≈ **10^5** |
| 1 month | ~2.6M ≈ **2.5 × 10^6** |
| 1 year | ~31.5M ≈ **3 × 10^7** |

### Common Throughput Rules of Thumb
| Technology | Throughput |
|---|---|
| Single RDBMS (Postgres/MySQL) | ~1,000–5,000 QPS |
| Single Redis instance | ~100,000 QPS |
| Single Kafka partition | ~10 MB/s write |
| Single HTTP server (Spring Boot) | ~5,000–20,000 RPS |
| CDN edge node | ~100,000+ RPS |

---

## Estimation Framework

### Step 1 — Clarify Scale
- DAU (Daily Active Users)
- Read/write ratio
- Peak multiplier (usually 2–5× average)

### Step 2 — Estimate QPS
```
avg QPS = DAU × requests_per_user / seconds_per_day
peak QPS = avg QPS × peak_multiplier
```

**Example — Twitter-like feed:**
```
DAU = 100M
Avg requests/user/day = 10 (reads) + 1 (write)
Avg read QPS  = 100M × 10 / 100,000 = 10,000 QPS
Avg write QPS = 100M × 1  / 100,000 = 1,000 QPS
Peak read QPS = 10,000 × 3 = 30,000 QPS
```

### Step 3 — Estimate Storage
```
storage = daily_writes × record_size × retention_days
```

**Example — Tweet storage:**
```
Tweets/day = 1,000 QPS × 86,400 = ~86M tweets/day
Record size = 280 bytes text + 200 bytes metadata ≈ 500 bytes
Storage/day = 86M × 500B = ~43 GB/day
5-year storage = 43 GB × 365 × 5 ≈ 78 TB
```

### Step 4 — Estimate Bandwidth
```
bandwidth = QPS × avg_payload_size
```

**Example — Image upload service:**
```
Write QPS = 1,000
Avg image size = 2 MB
Write bandwidth = 1,000 × 2 MB = 2 GB/s  ← needs chunking + CDN!
```

### Step 5 — Estimate Memory (for caching)
```
cache_size = hot_data_fraction × total_dataset_size
```

**Example — URL shortener (60M URLs, 20% hot):**
```
Avg URL size = 100 bytes
Total = 60M × 100 = 6 GB
Cache (20%) = 1.2 GB  ← fits in one Redis node
```

---

## Worked Examples

### URL Shortener (bit.ly)
- 100M DAU, 1% write, 99% read
- Write QPS: `100M × 0.01 / 86400 ≈ 12 QPS`
- Read QPS: `100M × 99 × 0.01 / 86400 ≈ 1,150 QPS`
- Storage: `12 QPS × 86400 × 365 × 5 years × 100 bytes ≈ 1.8 TB`
- Cache: top 20% URLs = small, single Redis node sufficient

### Video Streaming (YouTube-like)
- 1B DAU, 0.1% upload, 10 views/user/day, avg 5 min video
- Uploads/day: `1B × 0.001 = 1M uploads`
- Upload bandwidth: `1M × 300 MB / 86400 ≈ 3.5 TB/s` (needs massive CDN)
- Storage (with 3 encoding resolutions): `1M × 300 MB × 3 ≈ 900 TB/day`

### Chat App (WhatsApp-like)
- 500M DAU, 40 messages/user/day, avg 100 bytes/message
- Message QPS: `500M × 40 / 86400 ≈ 230,000 msg/s`
- Storage: `500M × 40 × 100 = 2 TB/day`
- With 30-day retention: `60 TB`

---

## Capacity Planning Checklist

- [ ] Estimated peak QPS (read & write)
- [ ] Storage growth rate (daily, annually)
- [ ] Network bandwidth requirement
- [ ] Number of servers needed (`QPS / throughput_per_server`)
- [ ] Cache size requirement
- [ ] Database sizing (RAM for working set)
- [ ] Identify bottleneck component

## Number of Servers Estimation
```
servers = peak_QPS / QPS_per_server
```
For Spring Boot service at ~10,000 RPS per instance:
```
30,000 peak QPS → 3 instances + headroom → 5 instances
```

---

## Interview Questions

### Q: Estimate the QPS and storage for a Twitter-like service with 300M DAU.

**A:** Start with actions per user per day, convert to average and peak QPS (for example peak factor $5$-$10$x), then apply read/write split. For storage, multiply daily write volume by retention and replication/compression factors.

### Q: You need to store 1M images per day. How much storage do you need in 5 years?

**A:** Compute $1,000,000 \times 365 \times 5 \times$ average image size, then add replicas/erasure overhead and metadata/index space. Include growth buffer for derivative sizes (thumbnails/transcodes).

### Q: A feature requires reading 1 KB per request at 50,000 RPS. What's the bandwidth? Can a single server handle it?

**A:** Raw egress is about $50,000 \times 1\ KB \approx 50\ MB/s$ before protocol overhead. A single server might handle it on modern NICs, but headroom, TLS, and tail latency usually require horizontal scaling.

### Q: How would you estimate the number of servers needed for a new service?

**A:** Derive peak QPS and per-request CPU/memory/IO cost from benchmarks, then calculate instances at target utilization (for example 60%-70%). Add redundancy for failures, maintenance, and regional capacity.

### Q: What's the working set size of a database and why does it matter for memory planning?

**A:** Working set is the hot subset accessed frequently enough to justify memory residency. If it fits in RAM, latency is stable; if not, random disk I/O and cache churn increase p99.

### Q: How do you estimate cache hit rate and what affects it?

**A:** Use access distribution (often Zipf-like), TTL, and cache size relative to hot keys to model hit rate. Key cardinality growth, invalidation frequency, and burstiness strongly affect real outcomes.


---

## Course Worked Examples: Hotel Booking and Messaging

From the freeCodeCamp *Design Software Systems Like a Senior Engineer* course. The point of estimation is to **choose the architecture**.

| System | Inputs | Result | Architectural conclusion |
|---|---|---|---|
| Hotel search | 10M DAU x 20 searches / 86,400 s | about 2,300 QPS avg, about 10k peak | Search needs caching and a dedicated index (Elasticsearch) |
| Hotel booking | 10M DAU x 1% = 100k bookings/day | about 1.2 QPS avg, about 10 to 50 peak | Write throughput is trivial. The hard part is correctness under contention |
| Hotel inventory | 500k hotels x 10 room types x 365 nights | about 1.8B rows/year | Needs sharding by `hotel_id` plus partition pruning by date |
| Messaging | 500M DAU x 40 msgs = 20B/day | about 230k QPS avg, about 700k peak | Needs sharded gateways, partitioned queues, and short server retention |
| Message storage | 20B x about 100 B | about 2 TB/day text | Delete after delivery and keep media in object storage |

Rule of thumb: a read:write ratio of 100:1 means optimise reads (cache, replicas, search index). A tiny write QPS with strict invariants means optimise correctness, not throughput.

See also: [Senior Engineer Design Course](./senior-engineer-design-course.md).

---

## Mathematical Laws of Capacity Planning & Scalability

Beyond basic arithmetic, Principal Engineers size thread pools, database connections, storage clusters, and CPU utilization targets using three fundamental mathematical laws detailed in [Sujeet Pro — Capacity Planning and Back-of-the-Envelope Estimates](https://sujeet.pro/articles/capacity-planning-and-estimation):

### 1. Little's Law ($L = \lambda \times W$) for Thread & Connection Pool Sizing

In queueing theory, **Little's Law** states that the long-term average number of concurrent requests in a stationary system ($L$) equals the average arrival rate ($\lambda$) multiplied by the average time a request spends in the system ($W$):

$$L = \lambda \times W$$

- **Application 1 — Sizing Thread Pools**: Suppose your microservice handles $\lambda = 2,000\text{ RPS}$ and each request takes $W = 50\text{ ms}$ ($0.05\text{ s}$) waiting on downstream I/O. The minimum number of active worker threads required just to keep up with average load is:
  $$L = 2,000 \times 0.05 = 100\text{ concurrent threads}$$
  If downstream latency degrades to $W = 500\text{ ms}$ ($0.5\text{ s}$), required concurrency jumps to $L = 2,000 \times 0.5 = 1,000\text{ threads}$—instantly saturating a default 200-thread Tomcat pool!
- **Application 2 — HikariCP Database Connection Pool Sizing**: Why should a database connection pool be small ($10 - 50$ connections) rather than $500$? Because physical CPU cores execute SQL queries sequentially (`connections = (core_count * 2) + effective_spindle_count`), keeping $W_{\text{query}}$ around $1 - 2\text{ ms}$. At $W = 2\text{ ms}$ ($0.002\text{ s}$), just $L = 20$ physical database connections can serve:
  $$\lambda = \frac{L}{W} = \frac{20}{0.002\text{ s}} = 10,000\text{ QPS}$$

---

### 2. Universal Scalability Law (USL — Contention $\sigma$ & Coherency $\kappa$)

Why doesn't adding $2\times$ more servers or CPU cores yield $2\times$ more throughput? Neil Gunther's **Universal Scalability Law (USL)** extends Amdahl's Law by modeling both **serialization contention ($\sigma$)** and **cross-node cache/lock coherency delay ($\kappa$)** as concurrency/nodes ($N$) increase:

$$C(N) = \frac{N}{1 + \sigma(N - 1) + \kappa N(N - 1)}$$

- **Linear Scaling ($\sigma = 0, \kappa = 0$)**: $C(N) = N$ (embarrassingly parallel, completely stateless).
- **Amdahl's Serialization Penalty ($\sigma > 0, \kappa = 0$)**: Shared queues, load balancer bottlenecks, or single-leader write locks cause throughput to asymptotically plateau at $1 / \sigma$.
- **Retrograde Scaling Penalty ($\kappa > 0$)**: Because the coherency term $\kappa N(N - 1)$ grows **quadratically ($O(N^2)$)** (e.g., Paxos/Raft quorum broadcasts, distributed lock chattering, CPU L3 cache-line bouncing / false sharing), increasing cluster size $N$ past the critical inflection point $N_{\text{max}} = \sqrt{(1 - \sigma) / \kappa}$ actually causes total throughput to **drop**!

---

### 3. M/M/1 Queueing Theory: Why Running CPU $> 70\%$ Causes Latency Explosion

Why do SRE teams enforce a strict **60%–70% CPU utilization target** instead of running servers at 95% to save cloud costs?

In an **M/M/1 queue** (Poisson arrivals, exponential service times), the total response time $R$ (Wait time in queue + Service time $S$) as a function of server utilization $\rho$ ($0 \le \rho < 1$) is:

$$R = \frac{S}{1 - \rho} \quad \implies \quad \text{Queueing Multiplier} = \frac{1}{1 - \rho}$$

| CPU Utilization ($\rho$) | $1 / (1 - \rho)$ Multiplier | If Base Service Time $S = 10\text{ ms}$, Actual Latency $R$ is: |
| :--- | :--- | :--- |
| **$50\%$ ($\rho = 0.50$)** | $2.0\times$ | $20\text{ ms}$ (Healthy headroom) |
| **$70\%$ ($\rho = 0.70$)** | $3.3\times$ | $33\text{ ms}$ (**The "Hockey Stick" Knee of the Curve**) |
| **$80\%$ ($\rho = 0.80$)** | $5.0\times$ | $50\text{ ms}$ |
| **$90\%$ ($\rho = 0.90$)** | $10.0\times$ | $100\text{ ms}$ (Severe queuing delay) |
| **$95\%$ ($\rho = 0.95$)** | $20.0\times$ | $200\text{ ms}$ (Any micro-burst causes instant timeout collapse) |
| **$99\%$ ($\rho = 0.99$)** | $100.0\times$ | $1,000\text{ ms}$ (Catastrophic saturation) |

Because arrival traffic is bursty (Poisson distribution rather than uniform), operating above $\rho = 0.70$ puts the system on the vertical asymptote of $1 / (1 - \rho)$, where a mere 10% traffic bump doubles or triples $p99$ latency!

---

### 4. Real-World Storage Multipliers (Replication, Erasure Coding, Index Bloat & Compaction)

Never stop a storage estimate at `raw_records × bytes_per_record`. In production storage engines, physical disk provisioning requires multiplying raw logical data by four physical overhead factors:
1. **Replication Factor ($RF = 3$) vs. Reed-Solomon Erasure Coding ($EC \approx 1.33\times - 1.5\times$)**:
   - Hot transactional databases (PostgreSQL, Cassandra, Kafka) use **$3\times$ replication** across 3 Availability Zones ($1\text{ TB logical} \to 3\text{ TB physical}$).
   - Cold/warm blob stores (S3, HDFS, MinIO) split objects into $k$ data chunks + $m$ parity chunks (e.g., Reed-Solomon `8+4` or `6+3`), achieving multi-AZ durability at only **$1.5\times$ storage overhead** instead of $3\times$.
2. **B+Tree Index & MVCC Bloat ($1.3\times - 2.0\times$)**:
   - Every secondary B+Tree index adds 15%–30% storage overhead, and B+Tree page splits leave an average **~70% page fill factor** (~30% free space fragmentation), plus PostgreSQL MVCC dead tuples awaiting `AUTOVACUUM`.
3. **LSM-Tree Compaction Headroom (RocksDB / Cassandra)**:
   - **Size-Tiered Compaction Strategy (STCS)** requires up to **$50\%$ free disk space** temporarily to merge the largest SSTable tiers without throwing `No space left on device`. **Leveled Compaction (LCS)** lowers free-space overhead to ~10%–15% at the cost of higher write amplification.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Capacity Planning & Estimation Interviews

When an interviewer asks *"Estimate the QPS, storage, and server count for this system"*, a mid-level candidate spends 10 minutes doing long division on a whiteboard and stops at raw averages. A **Principal Engineer** finishes the math in **90 seconds** using powers of 10 ($1\text{ day} \approx 10^5\text{ s}$), translates **Peak QPS + Little's Law** into concurrency limits, applies **storage replication/index overhead multipliers**, and uses the numbers to **justify architectural trade-offs**.

### 1. The Senior Framing Strategy (First 60 Seconds)

1. **State That Math Drives Architecture (Not Trivia)**: Tell the interviewer: *"I will spend 90 seconds bounding Peak QPS, Working-Set RAM, and Storage Growth so we know whether this fits on a single PostgreSQL primary or requires sharding and edge caching."*
2. **Always Size for Peak + $N+1$ Failover Headroom**: Convert DAU to Average QPS ($\div 10^5$), multiply by a **Peak-to-Average Ratio ($2\times - 5\times$, or $10\times$ for flash events)**, and size server fleets so CPU utilization stays $\rho \le 65\%$ even if an entire Availability Zone (1/3 of capacity) fails!
3. **Separate Hot Working Set (RAM) from Cold Archive (Disk/Object Store)**: Calculate the 20% active working set (or last 7 days of data) to size Redis/Buffer Pool RAM, and tier multi-year historical data to S3/Erasure-Coded storage.
4. **Apply Physical Storage Multipliers**: Multiply raw logical storage by **$3\times$ for RF=3 replication** and **$1.5\times$ for B-Tree index/MVCC overhead** (or $1.5\times$ Erasure Coding for object storage).

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Our system processes 86.4 million requests per day, which is 1,000 QPS. Since one server handles 1,000 QPS at 95% CPU, can we run this in production on 2 servers for high availability?"
* **Junior/Mid Answer:** *"Yes, 2 servers gives us 2,000 QPS capacity, which is $2\times$ our 1,000 QPS average load and survives 1 server crashing."*
* **Principal Rebuttal:** *"That deployment will crash every single day during peak hours for three reasons:
  1. **Peak-to-Average Ratio**: 86.4M/day is 1,000 QPS **average**, but real user traffic follows a diurnal curve with a $3\times$ to $5\times$ peak—meaning daily peak traffic is **3,000 to 5,000 QPS**.
  2. **M/M/1 Queueing Latency Cliff ($1 / (1 - \rho)$)**: A server benchmarked at 1,000 QPS at 95% CPU has a $20\times$ queueing delay multiplier. To keep $p99$ latency stable, each server should run at $\le 65\%$ utilization (~650 QPS effective capacity).
  3. **AZ Failover Headroom**: To survive losing 1 of 3 Availability Zones during peak load (3,000 QPS) while keeping surviving nodes under 65% CPU, we need $\lceil 3,000 / 650 \rceil = 5$ active nodes Representing 2/3 of the fleet $\implies$ **7 to 8 instances across 3 AZs**."*

#### Trap 2: "We calculated that 100M users generating 1 KB of data per day equals 100 GB/day, or 36.5 TB/year. So we just provision a 36.5 TB database disk for Year 1, right?"
* **Junior/Mid Answer:** *"Yes, 36.5 TB (maybe 40 TB to be safe) covers Year 1 storage."*
* **Principal Rebuttal:** *"36.5 TB is only the **raw logical payload**. On a real database cluster, physical storage required is **$4\times$ to $6\times$ higher**:
  - **Primary + Secondary Indexes + B-Tree Fragmentation**: 3 secondary indexes plus a 70% B-Tree page fill factor and WAL logs easily multiply logical table size by **$1.8\times$** ($36.5\text{ TB} \to 65.7\text{ TB}$).
  - **3-Way Multi-AZ Replication ($RF = 3$)**: Triples cluster disk footprint ($65.7\text{ TB} \times 3 \approx 197\text{ TB}$).
  - **Compaction / Vacuum Headroom (30%)**: Storage engines panic if disk utilization crosses 75%–80% during compaction or `VACUUM FULL`. Provisioning ~**250 TB of physical cluster storage** (or sharding across eight 10 TB shards with 3 replicas each) is the realistic Day-1 capacity plan."*

#### Trap 3: "If 8 servers handle 40,000 QPS, then scaling our cluster to 64 servers will linearly handle 320,000 QPS, right?"
* **Junior/Mid Answer:** *"Yes, horizontal scaling is linear if the application is stateless."*
* **Principal Rebuttal:** *"Only if the **Universal Scalability Law (USL)** contention ($\sigma$) and coherency ($\kappa$) coefficients are literally zero! In reality, 64 stateless app servers still contend on shared downstream bottlenecks ($\sigma$): database connection pools, shared Redis keys, or NAT gateway limits. Worse, if the 64 nodes are stateful consensus or cache nodes that exchange gossip or quorum heartbeats ($\kappa > 0$), the $O(N^2)$ coherency penalty $\kappa N(N - 1)$ will cause throughput to **plateau and then degrade** unless we partition the cluster into independent **Cells or Shards** where $\kappa = 0$ across shards."*

#### Trap 4: "Our service receives 5,000 RPS. Each request calls an external LLM API that takes 4 seconds to respond. How many worker threads or pods do we need?"
* **Junior/Mid Answer:** *"Since the LLM does the heavy work and our CPU is idle waiting on I/O, 2 or 3 pods with standard 200-thread pools are enough."*
* **Principal Rebuttal:** *"Apply **Little's Law ($L = \lambda \times W$)**: at $\lambda = 5,000\text{ RPS}$ and $W = 4\text{ seconds}$, there are **$L = 5,000 \times 4 = 20,000$ concurrent requests in flight at every instant**! Three pods with 200 OS threads only provide 600 threads—meaning 19,400 requests will queue up and time out immediately! Because the workload is I/O-bound with high $W$, we must use **Non-Blocking Event Loops (Netty/WebFlux)** or **Java 21 Virtual Threads** (or decouple via an async queue + SSE) so a single pod can hold 10,000+ concurrent open sockets in a few megabytes of heap without OS thread exhaustion."*

---

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **QPS Estimation** | "Divide daily requests by 86,400 with exact decimals." | "Divide by $10^5\text{ s/day}$ for **Average QPS**, then multiply by **$3\times - 5\times$ for Peak QPS** (architecture is always sized for Peak)." |
| **Thread / Connection Pool Sizing** | "Set thread pool to 500 and DB pool to 200." | "Use **Little's Law ($L = \lambda \times W$)** for caller concurrency, and keep DB pools tightly bounded (`cores * 2`) behind PgBouncer." |
| **Server Utilization Target** | "Run servers at 90% CPU to optimize cost." | "Cap target CPU at **60%–70%** because **M/M/1 queueing delay ($1 / (1 - \rho)$)** explodes exponentially above $\rho = 0.70$." |
| **Storage Provisioning** | "Raw row size $\times$ number of rows." | "Raw size $\times$ **$1.5\times$ index/MVCC bloat** $\times$ **$3\times$ replication** (or **$1.5\times$ Erasure Coding** for blob storage) + **30% compaction headroom**." |
| **Cluster Horizontal Scaling** | "Doubling nodes always doubles throughput." | "Account for the **Universal Scalability Law (USL)**: contention ($\sigma$) plateaus throughput and $O(N^2)$ coherency ($\kappa$) causes retrograde scaling." |

