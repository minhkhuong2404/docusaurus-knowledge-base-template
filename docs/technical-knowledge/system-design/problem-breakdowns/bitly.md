---
id: bitly
title: Design a URL Shortener Like Bitly
sidebar_label: 1. Bitly (URL Shortener)
description: Staff-level system design breakdown for a globally distributed URL shortener service handling 100K+ QPS.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a URL Shortener Like Bitly

A URL shortener converts long, cumbersome URLs into compact, human-readable aliases (e.g., `https://bit.ly/3xY7k9`). When users click the shortened URL, the service resolves the alias and redirects the user to the original destination with minimal latency.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Shorten URL**: Given a long URL, the service returns a unique short URL alias (e.g., 7-character alphanumeric string).
2. **Redirection**: Given a short URL alias, the service redirects the user to the original long URL with sub-15ms latency.
3. **Custom Alias (Optional/Paid)**: Users can optionally specify a custom alias (e.g., `bit.ly/my-cool-link`).
4. **Analytics & Metrics**: Track total click counts, geographic location, referrers, and timestamps for analytics dashboards.
5. **Link Expiration**: URLs can optionally expire after a configurable TTL (defaults to 2 years).

### Non-Functional Requirements
- **Ultra-Low Latency**: Redirects must resolve in `< 15ms` (P99).
- **High Availability**: `99.999%` availability for read redirection. Reads must never fail even if analytics logging degrades.
- **Read-Heavy Ratio**: 100:1 read-to-write ratio (100 redirects for every 1 URL generated).
- **Data Durability**: Generated short links must be permanent (or adhere strictly to configured TTL).
- **Security & Abuse Prevention**: Prevent URL collision attacks, brute-force enumeration, and hosting of malicious phishing links.

### Capacity Estimations & Sizing (5 Years)
- **Daily Active Users (DAU)**: 100M users.
- **New Short URLs**: 100M new URLs per month $\approx$ ~40 URLs/sec average write QPS (peak write $\approx$ 1,000 QPS).
- **Redirection Requests**: 100:1 ratio $\implies$ 4,000 reads/sec average, peaking at **100,000 QPS**.
- **Storage Calculation (5 Years)**:
  - 100M URLs/month $\times$ 12 months $\times$ 5 years = **6 Billion URLs**.
  - Average record size: `short_code` (7 bytes) + `long_url` (500 bytes) + `user_id` (16 bytes) + `created_at` (8 bytes) + metadata $\approx$ **600 bytes**.
  - 6 Billion $\times$ 600 bytes = **3.6 TB** total database storage across 5 years.
- **Memory / Caching Sizing (80/20 Rule)**:
  - 20% of the URLs generate 80% of total read traffic.
  - Daily read volume = 100,000 QPS $\times$ 86,400s $\approx$ 8.64 Billion requests/day.
  - Caching top 20% of daily active URLs: 8.64B $\times$ 0.20 $\times$ 600 bytes $\approx$ **1.03 TB RAM** across the Redis cache cluster.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      URL_RECORD                        │
├──────────────────┬──────────────┬──────────────────────┤
│ short_code       │ VARCHAR(10)  │ PRIMARY KEY (Base62) │
│ long_url         │ VARCHAR(2048)│ NOT NULL             │
│ user_id          │ UUID         │ NULLABLE (Anonymous) │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
│ expires_at       │ TIMESTAMP    │ NULLABLE             │
│ click_count      │ BIGINT       │ DEFAULT 0            │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     CLICK_EVENT                        │
├──────────────────┬──────────────┬──────────────────────┤
│ event_id         │ UUID         │ PRIMARY KEY          │
│ short_code       │ VARCHAR(10)  │ INDEX, FK            │
│ timestamp        │ TIMESTAMP    │ NOT NULL             │
│ ip_address       │ VARCHAR(45)  │ IPv4 / IPv6          │
│ country_code     │ CHAR(2)      │ ISO 3166             │
│ user_agent       │ VARCHAR(256) │ Browser / OS info    │
│ referrer         │ VARCHAR(512) │ HTTP Referer header  │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Create Short URL
```http
POST /api/v1/urls
Content-Type: application/json
Idempotency-Key: 7b3e2a10-8021-4a56-b088-299cb84f679e

{
  "long_url": "https://antigravity.google.com/deepmind/advanced-agentic-coding",
  "custom_alias": "deepmind-code", // Optional
  "ttl_seconds": 63072000          // Optional (Default: 2 years)
}
```
**Response (`201 Created`)**:
```json
{
  "short_code": "deepmind-code",
  "short_url": "https://bit.ly/deepmind-code",
  "long_url": "https://antigravity.google.com/deepmind/advanced-agentic-coding",
  "expires_at": "2028-09-22T22:00:00Z"
}
```

#### 2. Resolve Short URL (Redirect)
```http
GET /{short_code}
```
**Response (`302 Found` or `301 Moved Permanently`)**:
```http
HTTP/1.1 302 Found
Location: https://antigravity.google.com/deepmind/advanced-agentic-coding
Cache-Control: private, max-age=90
```

#### 3. Fetch URL Click Analytics
```http
GET /api/v1/urls/{short_code}/analytics?timeframe=7d
```
**Response (`200 OK`)**:
```json
{
  "short_code": "deepmind-code",
  "total_clicks": 142580,
  "top_countries": [
    {"country": "US", "clicks": 82100},
    {"country": "VN", "clicks": 31400}
  ],
  "top_referrers": [
    {"source": "twitter.com", "clicks": 94000},
    {"source": "linkedin.com", "clicks": 32000}
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="url-shortener" title="Bitly Distributed URL Shortener Topology" />

### Walkthrough of Core Flows

#### 1. Shorten URL Write Path
1. The client sends a `POST /api/v1/urls` with `long_url`.
2. The **API Gateway** checks rate limits (e.g. 10 requests/minute per IP) using a Redis token bucket.
3. The request hits the **URL Shortener Service**.
4. The service fetches a 64-bit monotonically increasing unique ID from a distributed **Key Generation Service (KGS)** or pre-allocated Zookeeper range token.
5. The 64-bit integer is encoded into Base62 characters (`[0-9, a-z, A-Z]`).
6. The record is persisted into the **Primary SQL / NoSQL Database** (PostgreSQL / DynamoDB).
7. The mapping is asynchronously primed into the **Redis Cache** cluster.
8. Returns the shortened URL to the user.

#### 2. Redirection Read Path
1. The user browser issues `GET /{short_code}`.
2. The **Cloudflare CDN** checks edge cache. If found, returns `302 Redirect` immediately in `< 5ms`.
3. On CDN miss, the request routes to the **API Gateway** $\to$ **URL Service**.
4. The service queries **Redis Cluster**:
   - **Cache Hit (90%+)**: Fetches `long_url` in `< 1ms`.
   - **Cache Miss**: Queries the **Database** primary key index (`B+Tree index on short_code`), primes Redis, and returns.
5. Emits an asynchronous click event to **Apache Kafka** for click analytics processing.
6. Returns HTTP `302 Found` with `Location: <long_url>`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Base62 Encoding vs MD5/SHA-256 Hashing vs KGS
How do we generate unique 7-character aliases without collisions?

| Approach | Mechanics | Collision Risk | Pros & Cons |
|---|---|---|---|
| **MD5 / SHA-256 Hashing** | Hash `long_url` $\to$ take first 7 chars $\to$ Base62 | **High**: MD5 has $2^{128}$ space; truncating to 7 chars ($62^7 \approx 3.5 \times 10^{12}$) produces frequent hash collisions. | Requires retry loops with salting: `hash(url + salt)`. Adds query latency on collisions. |
| **UUID / Random String** | Generate random 7-char string $\to$ insert DB | **Medium**: Birthday paradox collision grows as DB fills. | Requires checking database uniqueness (`SELECT short_code FROM urls WHERE short_code = ?`). Write amplification. |
| **Distributed Counter + Base62 (KGS)** | Incrementing 64-bit ID $\to$ Base62 conversion | **Zero Collisions**: Monotonically unique ID guarantees unique string. | Requires a resilient ID generation coordinator (e.g. Snowflake or Range-allocated Zookeeper). |

#### Range-Based Key Generation Service (KGS) Architecture
To prevent a single database counter from becoming a single-point-of-failure or bottleneck:
- **Central Coordinator (Apache ZooKeeper / etcd)** maintains a global counter.
- Each application worker requests a **block allocation** (e.g. Worker 1 receives range `[1,000,000 - 2,000,000]`, Worker 2 receives `[2,000,001 - 3,000,000]`).
- The worker increments IDs purely in local memory using `AtomicLong` without contacting the network.
- When the worker exhausts 80% of its range, it asynchronously fetches the next block from ZooKeeper.
- **Node Crash Recovery**: If a worker crashes, the unused portion of its range is simply dropped. Because $62^7 = 3.52$ Trillion combinations, discarding small gaps in IDs is completely negligible.

```java
// Production-grade Base62 Encoder in Java 21
public final class Base62Encoder {
    private static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = ALPHABET.length(); // 62

    public static String encode(long id) {
        if (id <= 0) return "0";
        StringBuilder sb = new StringBuilder(7);
        while (id > 0) {
            sb.append(ALPHABET.charAt((int) (id % BASE)));
            id /= BASE;
        }
        return sb.reverse().toString();
    }
}
```

### Deep Dive 2: HTTP 301 vs HTTP 302 Redirection Strategy
Which HTTP status code should we return?

- **HTTP 301 Moved Permanently**:
  - The browser caches the redirection aggressively. Subsequent clicks on the short link resolve entirely in the client browser cache without hitting the Bitly server.
  - **Trade-Off**: Significantly reduces backend server load, but **breaks click tracking and analytics** because subsequent visits never reach our analytics pipeline.
- **HTTP 302 Found (Temporary Redirect)**:
  - The browser does not cache the redirect permanently. Every subsequent click must hit our server.
  - **Trade-Off**: Higher traffic load on Redis and edge gateways, but provides **100% accurate click analytics and geotracking**.
- **Architectural Decision**: Return **HTTP 302 Found** with `Cache-Control: private, max-age=90` (allowing brief 90-second client caching to smooth micro-bursts without sacrificing long-term analytics accuracy).

### Deep Dive 3: Cache Penetration & Bloom Filter Protection
What happens when malicious actors flood the service with non-existent short links (`GET /fake123`, `GET /fake999`)?
- **Problem (Cache Penetration)**: Non-existent keys miss Redis and hit the primary database directly, causing connection pool exhaustion and disk I/O saturation.
- **Solution**:
  1. **Cache Null Values**: Cache `(short_code -> null)` with a short 60-second TTL in Redis.
  2. **Bloom Filter at Edge**: Maintain a counting Bloom filter in front of Redis. If the Bloom filter returns `false`, the short code definitely does not exist $\implies$ return `404 Not Found` immediately at the API gateway without touching the cache or database.

### Deep Dive 4: Distributed Database Partitioning & Sharding
With 6 Billion URLs, how should we shard the database?
- **Sharding Key**: Shard by `hash(short_code) % number_of_shards` using **Consistent Hashing**.
  - **Why short_code?** 99% of queries are lookups by `short_code`. Sharding by `short_code` guarantees that any redirect request is routed to exactly one database shard without scatter-gather overhead.
  - **Secondary Query Hazard**: Looking up all URLs created by a `user_id` requires querying all shards or maintaining a separate index table mapping `user_id -> List<short_code>`.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Storage Engine** | PostgreSQL (Relational) | DynamoDB / Cassandra (NoSQL) | **DynamoDB / Cassandra**: Key-value lookup by primary key (`short_code`). No complex joins or relational transactions required. Infinite horizontal scalability. |
| **Analytics Processing** | Synchronous DB counter increment | Asynchronous Kafka $\to$ Flink $\to$ ClickHouse | **Asynchronous Kafka**: Synchronous DB increments cause row-lock contention and add 10-20ms to redirect latency. Decoupling read path from analytics is critical for sub-15ms SLAs. |
| **Redirection Code** | HTTP 301 (Permanent) | HTTP 302 (Temporary) | **HTTP 302**: Preserves revenue-critical business analytics and tracking. |
| **Short ID Generation** | MD5 Truncation | Range-based ZooKeeper KGS | **Range-based KGS**: Zero hash collisions, deterministic runtime, eliminates collision retry queries. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Clarifies functional and non-functional requirements.
- Designs basic schema (`short_code`, `long_url`, `created_at`).
- Proposes Base62 encoding and understands 301 vs 302 redirect differences.
- Introduces Redis cache for read acceleration.

### Senior (L5 / IC5)
- Performs rigorous capacity estimations (bandwidth, 5-year storage, RAM sizing).
- Explains collision drawbacks of truncated hashing (MD5) vs Range-allocated KGS.
- Implements asynchronous click analytics using message queues (Kafka) to decouple the critical read path.
- Handles cache penetration using Bloom filters and null caching.
- Designs consistent hashing sharding key strategy on `short_code`.

### Staff+ (L6 / Principal)
- Evaluates operational trade-offs of ZooKeeper range block crashes and gap tolerance.
- Designs geo-distributed multi-region active-active deployment with DNS Anycast and localized Redis read replicas.
- Discusses edge redirection capabilities using Cloudflare Workers or Lambda@Edge for zero-origin redirects.
- Analyzes security threat vectors: phishing URL detection via Google Safe Browsing API integration, rate-limiting scrapers, and tenant isolation.
