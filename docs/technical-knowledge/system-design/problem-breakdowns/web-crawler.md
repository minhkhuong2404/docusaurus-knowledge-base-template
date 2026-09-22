---
id: web-crawler
title: Design a Distributed Web Crawler Like Googlebot
sidebar_label: 14. Web Crawler
description: Staff-level system design breakdown for a massive-scale distributed web crawler with politeness queues, Bloom filter deduplication, and DNS optimization.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Distributed Web Crawler Like Googlebot

A distributed web crawler (e.g., Googlebot, Bingbot, Common Crawl) traverses the World Wide Web to discover, fetch, and download web pages for search indexing, data mining, and archiving. The crawler must ingest billions of pages while honoring webmaster politeness constraints (`robots.txt`), avoiding spider traps, and eliminating duplicate URLs and near-duplicate content.

---

## 1. Understanding the Problem

### Functional Requirements
1. **URL Crawling**: Starting from a seed set of known high-quality URLs, fetch web pages, parse HTML, extract hyperlinks, and add new unvisited URLs to the crawl queue.
2. **Politeness Enforcement**: Never overwhelm target websites with excessive concurrent requests; honor `robots.txt` rules and host crawl delays.
3. **Priority & Freshness Crawling**: Prioritize high-importance pages (e.g. Wikipedia, major news sites) and frequently updated pages over static or low-quality sites.
4. **Deduplication**: Eliminate duplicate URLs (URL normalization) and detect near-duplicate page content (e.g., syndicated news articles).
5. **Storage Pipeline**: Store raw downloaded page contents, headers, and metadata in an archive store for downstream search indexing.

### Non-Functional Requirements
- **Massive Scalability**: Crawl **1 Billion web pages per week** (over 1,600 pages/sec continuous).
- **Robustness**: Immune to spider traps (infinite loops, dynamically generated calendars, cyclic redirections).
- **Extensibility**: Support new content types (HTML, PDF, images) and parsing protocols easily.
- **Resource Efficiency**: High-throughput DNS resolution caching and connection reuse.

### Capacity Estimations & Sizing (1 Billion Pages / Week)
- **Crawl Throughput**:
  - $1,000,000,000\text{ pages} / 7\text{ days} \approx \mathbf{1,650\text{ pages/sec}}$ average (peaking at **4,000 pages/sec**).
- **Network Ingress Bandwidth**:
  - Average web page size (HTML only, excluding heavy video) $\approx$ 100 KB.
  - Ingress Bandwidth = $1,650 \times 100\text{ KB} \approx$ **165 MB/s (1.32 Gbps continuous)**.
- **Raw Page Storage Sizing (5 Years)**:
  - 1 Billion pages/week $\times$ 52 weeks $\times$ 5 years $\approx$ **260 Billion pages**.
  - With compression (Zstandard / Snappy $\approx$ 30 KB per page):
    $260\text{B} \times 30\text{ KB} \approx$ **7.8 Petabytes (PB)** stored in distributed object storage (S3 / Ceph / BigTable).
- **URL Frontier Metadata Storage**:
  - Tracking 10 Billion discovered URLs:
  - URL string + metadata $\approx$ 128 bytes $\implies$ **1.28 TB storage**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      CRAWL_METADATA                    │
├──────────────────┬──────────────┬──────────────────────┤
│ url_hash         │ CHAR(64)     │ PRIMARY KEY (SHA-256)│
│ original_url     │ VARCHAR(2048)│ NOT NULL             │
│ domain           │ VARCHAR(255) │ INDEX (Politeness)   │
│ http_status      │ INT          │ 200, 301, 404, etc.  │
│ content_hash     │ CHAR(64)     │ SimHash / Fingerprint│
│ last_crawled_at  │ TIMESTAMP    │ Freshness scheduler  │
│ raw_s3_uri       │ VARCHAR(255) │ Compressed HTML path │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      ROBOTS_CACHE                      │
├──────────────────┬──────────────┬──────────────────────┤
│ domain           │ VARCHAR(255) │ PRIMARY KEY (Redis)  │
│ rules_json       │ TEXT         │ Parsed Disallow paths│
│ crawl_delay_sec  │ INT          │ Default: 1s          │
│ fetched_at       │ TIMESTAMP    │ TTL 24 hours         │
└──────────────────┴──────────────┴──────────────────────┘
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="crawler-frontier" title="Googlebot Distributed Web Crawler & Frontier Topology" />

### Core Component Breakdown & Data Flow

#### 1. The URL Frontier (Politeness & Priority Queues)
The URL Frontier stores and manages all discovered URLs waiting to be crawled. It is architected into two layers:
- **Priority Queues (Freshness & PageRank)**: Assigns higher priority to authoritative domains and frequently changing pages.
- **Politeness Queues (Host-Level Isolation)**:
  - Ensures we never hammer a single domain with multiple simultaneous requests.
  - Maintains **one FIFO queue per target domain hostname**.
  - A thread-safe queue selector assigns a worker thread to a host queue only when the domain's `crawl_delay` interval has elapsed.

#### 2. The Fetcher & Fast DNS Resolver
1. Worker retrieves a URL from the politeness queue.
2. Checks **Robots.txt Cache**: If not cached in Redis, fetches and parses `http://example.com/robots.txt`.
3. Resolves domain IP address via an in-memory **Local DNS Cache** (avoiding standard OS DNS round-trips which take 50–100ms).
4. Issues an HTTP/HTTPS GET request using non-blocking I/O with a strict 5-second socket timeout.

#### 3. Deduplication & Parsing Pipeline
1. **Content Fingerprinting (SimHash)**:
   - Computes a 64-bit SimHash of the page text.
   - If the SimHash already exists in the **Content Deduplication Store**, discard the page as a mirror/duplicate!
2. **Link Extraction & URL Normalization**:
   - Parses HTML DOM, extracts `<a href="...">` tags.
   - Normalizes URLs: converts to lowercase, removes fragments (`#section`), resolves relative paths (`/about` $\to$ `https://example.com/about`), and removes tracking parameters (`?utm_source=...`).
3. **URL Seen Filter (Bloom Filter)**:
   - Checks candidate URLs against a distributed **Counting Bloom Filter**.
   - If URL was already visited or is currently in the frontier, discard.
   - Otherwise, insert into URL Frontier for future crawling.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: URL Frontier Politeness Architecture (Mercator Model)
How do we balance crawling authoritative sites quickly while guaranteeing host politeness?

```
                   Incoming Discovered URLs
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│             PRIORITY ROUTER (Freshness/PageRank)       │
├────────────────────────────────────────────────────────┤
│ Queue P1 (Breaking News) | Queue P2 (Tech) | Queue P3  │
└────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│             POLITENESS ROUTER (Domain Hasher)          │
├────────────────────────────────────────────────────────┤
│ Host Q1 (cnn.com) | Host Q2 (wiki.org) | Host Q3 (mit) │
└────────────────────────────────────────────────────────┘
                              │
                 Worker Selector (Host Delay Lock)
                              │
                              ▼
                        Fetcher Threads
```
- **The Two-Queue Mechanism**:
  1. *Priority Filter*: Determines *what* to crawl next based on PageRank and update frequency.
  2. *Politeness Filter*: Determines *when* to crawl based on domain throttling.
- **Host Queue Lock**: Each host queue has an associated timestamp `next_available_time`. A worker picks up a host queue only when `now() >= next_available_time`, and updates it to `now() + crawl_delay`.

### Deep Dive 2: Deduplication (URL Normalization & Content SimHash)
How do we avoid wasting 50% of our crawl bandwidth on duplicate content?

1. **URL Normalization Rules**:
   - Strip default ports: `example.com:80/` $\to$ `example.com/`.
   - Remove tracking tokens: `?utm_campaign=...` stripped.
   - Resolve case sensitivity: `EXAMPLE.COM/index.html` $\to$ `example.com/index.html`.
2. **Near-Duplicate Detection (SimHash Algorithm)**:
   - Identical articles syndicated across multiple news domains differ only by header/footer templates.
   - **SimHash Mechanics**: Converts token frequencies into a single 64-bit integer where similar documents have small **Hamming distances** (differ by $\le 3$ bits).
   - Allows instant detection of near-duplicate pages without storing full texts in memory.

### Deep Dive 3: Spider Traps & Cyclic Loops Detection
What happens when a crawler encounters an infinite dynamically generated calendar (`/calendar?year=2026&month=13...`) or recursive directories (`/dir/dir/dir/...`)?
- **Max URL Depth**: Enforce a hard limit on directory path depth (e.g. maximum 6 path segments `/a/b/c/d/e/f`).
- **URL Length Ceiling**: Reject URLs longer than 512 characters.
- **Per-Domain Page Cap**: Cap maximum pages crawled from a single domain within a 24-hour cycle (e.g. max 50,000 pages per domain per day) unless explicitly whitelisted.
- **Anomaly Detection**: Flag domains that generate abnormally large numbers of distinct URLs with zero inbound PageRank links.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Crawl Queue** | In-Memory Priority Queue (Single Node) | Hybrid Disk/Memory (Kafka + RocksDB) | **Hybrid Disk/Memory**: Storing 10 Billion discovered URLs in memory is cost-prohibitive. Hot politeness queues reside in RAM; bulk unvisited queues live on NVMe disk. |
| **URL Seen Filter** | Relational Database Primary Key | Counting Bloom Filter + SSD RocksDB | **Bloom Filter**: In-memory Bloom filter provides $O(1)$ sub-millisecond check for 99.9% of duplicate URLs with zero disk I/O. |
| **DNS Resolution** | OS Default DNS Resolver | Custom Async DNS Cache with Prefetching | **Custom Async DNS**: Standard OS `gethostbyname()` blocks the calling thread and takes 50–100ms. Local memory caching reduces DNS latency to `< 0.1ms`. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the basic web crawling loop (Fetch $\to$ Parse $\to$ Extract Links $\to$ Queue).
- Designs schemas for Crawled Pages and URLs.
- Understands `robots.txt` compliance and basic domain politeness.
- Proposes Bloom filters for duplicate URL detection.

### Senior (L5 / IC5)
- Details the Mercator URL Frontier architecture (Priority queues decoupled from Politeness host queues).
- Solves near-duplicate content detection using SimHash and Hamming distance.
- Identifies and neutralizes spider traps (depth limits, URL length caps, calendar loop detection).
- Optimizes network performance via persistent connection pools and custom asynchronous DNS caching.

### Staff+ (L6 / Principal)
- Designs geo-distributed crawling: Deploying crawler worker pods across global cloud regions to bypass geographical CDN geo-blocking and minimize cross-oceanic latency.
- Details dynamic crawl rate budgeting: Adjusting crawl velocity in real-time based on target server HTTP response codes (`429 Too Many Requests`, `503 Service Unavailable`, or rising latency).
- Architects seamless integration with downstream search indexing pipelines: Real-time Delta changelog generation streaming directly into an inverted index builder.
