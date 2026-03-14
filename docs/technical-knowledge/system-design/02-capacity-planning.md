---
id: capacity-planning
title: Capacity Planning & Estimation
sidebar_label: Capacity Planning
description: Back-of-envelope estimation techniques for traffic, storage, bandwidth, and memory. Essential for system design interviews and production capacity planning.
tags: [capacity-planning, estimation, back-of-envelope, qps, storage, interview-prep]
---

# Capacity Planning & Estimation

> The goal is **order-of-magnitude accuracy**, not precision. Round aggressively.

---

## Essential Numbers to Memorize

### Data Sizes
| Unit | Bytes |
|---|---|
| KB | 10^3 |
| MB | 10^6 |
| GB | 10^9 |
| TB | 10^12 |
| PB | 10^15 |

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

1. Estimate the QPS and storage for a Twitter-like service with 300M DAU.
2. You need to store 1M images per day. How much storage do you need in 5 years?
3. A feature requires reading 1 KB per request at 50,000 RPS. What's the bandwidth? Can a single server handle it?
4. How would you estimate the number of servers needed for a new service?
5. What's the working set size of a database and why does it matter for memory planning?
6. How do you estimate cache hit rate and what affects it?
