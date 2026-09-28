---
id: pastebin
title: "Design a Text Sharing Service Like Pastebin"
sidebar_label: "44. Pastebin"
description: "Staff-level system design for a high-throughput, read-heavy text sharing service with syntax highlighting, custom URLs, TTL expiration, and tiered storage."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Text Sharing Service Like Pastebin

A Pastebin service allows users to store plain text or source code snippets online and generate a unique, compact URL (e.g. `https://pastebin.com/a9X4k2`) to share with others. While functionally similar to a URL shortener, Pastebin deals with **significantly larger payloads (up to 10 MB per paste)**, syntax highlighting rendering, configurable Time-to-Live (TTL) expiration schedules, and strict abuse/phishing mitigation.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Create Paste**: Users can paste plain text or code (up to 10 MB), specify an optional expiration date (e.g., 10 minutes, 1 day, 1 month, never), select a programming language for syntax highlighting, and generate a short URL.
2. **Access Paste**: Given a paste ID, retrieve and render the raw text or syntax-highlighted code.
3. **Custom URL Alias (Optional)**: Support custom vanity URLs (e.g., `pastebin.com/my-script`).
4. **Burn After Reading (Optional)**: The paste is permanently deleted from the database immediately after its first read.
5. **Password Protection (Optional)**: Client-side or server-side password-encrypted pastes.

### Non-Functional Requirements
- **High Read-to-Write Ratio**: 100:1 read-to-write ratio (100 reads for every 1 paste uploaded).
- **Sub-20ms Read Latency**: Viewing a paste should resolve in $< 20\text{ms}$ globally.
- **High Availability**: $99.999\%$ availability for reading existing pastes.
- **Storage Durability**: Pastes configured with "Never expire" must persist reliably without data loss.
- **Abuse Prevention**: Scan pastes in real time to prevent hosting malicious scripts, malware payloads, or phishing credentials.

### Capacity Estimations & Sizing (5 Years)
- **New Pastes per Day**: 10 Million new pastes/day $\implies$ **115 writes/second** average (peaking at **1,000 writes/sec**).
- **Read Requests**: 100:1 ratio $\implies$ 1 Billion reads/day $\implies$ **11,500 reads/second** average (peaking at **50,000 reads/sec**).
- **Average Paste Size**: 10 KB.
- **Storage Projections (5 Years)**:
  - Daily Ingestion: $10\text{M pastes} \times 10\text{ KB} = \mathbf{100\text{ GB/day}}$.
  - Annual Ingestion: $100\text{ GB} \times 365 \approx \mathbf{36.5\text{ Terabytes/year}}$.
  - 5-Year Storage: $36.5\text{ TB} \times 5 \approx \mathbf{182.5\text{ Terabytes}}$ (excluding expired pastes).
- **RAM Caching Sizing (80/20 Rule)**:
  - 20% of the pastes generate 80% of total read traffic.
  - Daily read volume: 1 Billion reads/day $\times 20\% \times 10\text{ KB} \approx \mathbf{2\text{ TB RAM}}$ across the Redis cache cluster.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                     PASTE_METADATA                     │
├──────────────────┬──────────────┬──────────────────────┤
│ paste_id         │ VARCHAR(10)  │ PRIMARY KEY (Base62) │
│ title            │ VARCHAR(128) │ Optional Title       │
│ user_id          │ UUID         │ NULLABLE (Anonymous) │
│ language         │ VARCHAR(32)  │ Syntax (e.g. "java") │
│ size_bytes       │ INT          │ Payload byte length  │
│ s3_object_key    │ VARCHAR(256) │ Storage Path / Blob  │
│ is_burn_after_rd │ BOOLEAN      │ Self-destruct flag   │
│ password_hash    │ VARCHAR(128) │ Argon2 hash          │
│ created_at       │ TIMESTAMP    │ Creation Time        │
│ expires_at       │ TIMESTAMP    │ NULL = Never Expire  │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Create Paste
```http
POST /api/v1/pastes
Content-Type: application/json
Idempotency-Key: 9481a-8291-419b-a012

{
  "content": "public class HelloWorld { public static void main(String[] args) {} }",
  "title": "Java Hello",
  "language": "java",
  "ttl_seconds": 86400, // 24 hours (null = never)
  "burn_after_read": false,
  "password": "secret_password" // Optional
}
```
**Response (`201 Created`)**:
```json
{
  "paste_id": "a9X4k2",
  "url": "https://pastebin.com/a9X4k2",
  "size_bytes": 68,
  "expires_at": "2026-10-02T12:00:00Z"
}
```

#### 2. Get Paste
```http
GET /api/v1/pastes/{paste_id}
X-Paste-Password: secret_password // Optional
```
**Response (`200 OK`)**:
```json
{
  "paste_id": "a9X4k2",
  "title": "Java Hello",
  "language": "java",
  "content": "public class HelloWorld { public static void main(String[] args) {} }",
  "created_at": "2026-10-01T12:00:00Z",
  "expires_at": "2026-10-02T12:00:00Z"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="url-shortener" title="Pastebin Distributed Text Storage, Caching & Expiration Pipeline" />

### Walkthrough of Core Flows

#### 1. Create Paste Write Flow
1. Client submits text payload to the **API Gateway**.
2. Gateway verifies rate limits (e.g. max 20 pastes/hour per IP).
3. The **Paste Service** queries an asynchronous **Malware & Phishing Scanner** (ClamAV / ML threat model) to verify the text does not contain malicious code or stolen credentials.
4. The service fetches a unique 64-bit ID from a **Key Generation Service (KGS)** and converts it to a 7-character Base62 string (`paste_id`).
5. **Storage Separation**:
   - The large text payload is compressed via **Zstandard (Zstd)** and written directly to **Distributed Object Storage (Amazon S3 / MinIO)**.
   - The metadata (`paste_id`, `s3_object_key`, `expires_at`, `size_bytes`) is inserted into **PostgreSQL / DynamoDB**.
6. The paste metadata and text are primed into the **Redis Cluster**.
7. Returns the shortened paste URL to the user.

#### 2. Get Paste Read Flow
1. User requests `GET /pastes/{paste_id}`.
2. The request hits **Cloudflare Edge CDN**:
   - **CDN Cache Hit (60%+)**: Returns the cached paste text in $< 5\text{ms}$.
3. On CDN miss, the request routes to the **Paste Service**:
   - Queries **Redis**: If present, returns in $< 1\text{ms}$.
   - If Redis miss, queries the **Metadata DB** to verify the paste has not expired.
   - Streams raw text from **Amazon S3**, primes Redis, and returns to user.
4. **Burn After Reading Check**: If `is_burn_after_read == true`, the service immediately enqueues an asynchronous deletion task to purge the metadata row, Redis key, and S3 object!

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Storage Tiering: Database BLOB vs Object Storage
Should paste text be stored inside database rows or external object storage?

| Storage Alternative | Database BLOB (Postgres / MySQL) | Distributed Object Storage (S3 / GCS) |
|---|---|---|
| **Cost per GB** | High ($0.10 - $0.25 / GB / month on SSD) | Ultra-low ($0.015 - $0.023 / GB / month) |
| **Max Payload Size** | Large payloads bloat DB buffer pools and trigger row-chaining. | Easily handles multi-megabyte payloads up to 10 MB without degradation. |
| **Throughput & IOPS** | High write amplification on DB indexes and WAL logs. | Unlimited horizontal scaling and zero database IOPS consumption. |
| **Decision** | Store only lightweight metadata ($< 500\text{ bytes}$). | Store all raw paste text payloads as compressed blobs. |

### Deep Dive 2: Expiration & TTL Deletion Mechanics
How do we delete expired pastes without running slow database full-table scans?

```
┌────────────────────────────────────────────────────────┐
│           DUAL-TIER EXPIRATION & DELETION ENGINE       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Tier 1: Lazy Deletion on Read Path                    │
│  • When a user reads a paste:                          │
│    IF (expires_at < current_timestamp):                │
│       Return HTTP 404 Not Found!                       │
│       Trigger async deletion event.                    │
│                                                        │
│  Tier 2: Asynchronous Janitor Sweep                    │
│  • Database B+Tree Index on `expires_at`:              │
│    `CREATE INDEX idx_pastes_expiry ON pastes(expires_at)│
│  • Background cron runs every 10 minutes:              │
│    SELECT paste_id, s3_key FROM pastes                 │
│    WHERE expires_at < NOW() LIMIT 5000;                │
│  • Deletes S3 blobs in batch and drops metadata rows.  │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **S3 Object Lifecycle Policies**: Alternatively, we set S3 lifecycle expiration rules based on bucket prefixes (e.g., `s3://pastes/ttl-24h/`, `s3://pastes/ttl-7d/`), allowing AWS to delete underlying storage automatically at zero compute cost!

### Deep Dive 3: Unique Short ID Generation (Range-Based KGS)
To ensure zero collisions and sub-millisecond generation:
- An Apache ZooKeeper cluster maintains global integer counters.
- Each paste server requests a **block of 1,000,000 IDs** at startup.
- The server increments IDs in local memory using `AtomicLong` and converts to Base62:
  $$\text{ID} = 10,000,000 \implies \text{Base62} = \text{"FX6A"}$$
- If a server crashes, the remaining unused IDs in its local memory block are simply discarded (with $62^7 \approx 3.52\text{ Trillion}$ combinations, gaps are completely negligible).

### Deep Dive 4: Syntax Highlighting Caching
Computing syntax highlighting (converting raw code to thousands of colored HTML `<span>` tags via PrismJS or Pygments) is CPU-intensive ($50\text{ms}$ per 100 KB file).
- **The Optimization**: Compute syntax highlighting **once at write time** or on the first read.
- Cache the highlighted HTML directly in the CDN and Redis alongside the raw text. Subsequent reads serve the pre-rendered HTML without burning backend CPU cycles.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Text Storage** | Relational Database TEXT column | Amazon S3 / MinIO Object Storage | **Object Storage**: Slashes database storage cost by 90%; protects database buffer pool from memory churn. |
| **Expiration Method** | Real-time database poll every second | Lazy Read Check + Binned S3 Lifecycle | **Lazy + Binned Lifecycle**: Eliminates database CPU spikes from constant background polling. |
| **ID Generation** | Truncated MD5 Hash | Range-allocated ZooKeeper KGS | **Range KGS**: Guarantees zero hash collisions without expensive uniqueness retry queries. |
| **Syntax Highlighting** | Dynamic Client-side JavaScript | Pre-rendered & Edge Cached HTML | **Pre-rendered & Edge Cached**: Eliminates client-side layout shifts and CPU rendering freezes on low-end mobile phones. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the similarity and differences between Pastebin and a URL shortener (larger text payloads vs simple redirects).
- Designs a clean database schema and calculates storage sizing for text files.
- Implements basic expiration logic and Base62 encoding.

### Senior (L5 / IC5)
- Separates metadata storage (database) from text payload storage (object storage / S3).
- Implements the dual-tier expiration engine (lazy read checks + asynchronous janitor sweeps).
- Designs read caching using CDN edge nodes and Redis (80/20 rule).
- Handles syntax highlighting caching and abuse scanning integration.

### Staff+ (L6 / Principal)
- Evaluates client-side zero-knowledge encryption architecture (encrypting text in browser with AES-GCM before transmission so server cannot read contents).
- Formulates multi-region replication strategies for globally distributed text snippet retrieval.
- Designs defense-in-depth protection against malware payload hosting and crawler scraping.
- Formulates high-throughput "Burn After Reading" race-condition prevention using atomic distributed locks.
