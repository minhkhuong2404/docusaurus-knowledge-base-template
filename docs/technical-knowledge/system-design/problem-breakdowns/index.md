---
id: index
title: 🎯 System Design Interview Problem Breakdowns
sidebar_label: 🎯 Master Breakdown Directory
description: Master syllabus of 45 real-world System Design interview breakdowns engineered to Staff & Principal Architect standards.
---

# 🎯 System Design Interview Problem Breakdowns

Welcome to the **System Design Interview Problem Breakdowns** master repository. This comprehensive directory covers **45 battle-tested real-world system design interview questions** frequently asked at FAANG/MAMAA (Meta, Apple, Amazon, Netflix, Google), Uber, Stripe, ByteDance, and high-growth infrastructure startups.

Every breakdown is engineered through the lens of a **Staff / Principal Architect** (`senior-architect-review`), providing:
1. **Mathematical Capacity Sizing**: Quantitative calculations for QPS, bandwidth, RAM, and 5-year storage projections.
2. **Deterministic Data Models**: Exact relational and NoSQL schemas with physical primary/secondary indexes and sharding keys.
3. **Physical Engine Mechanics**: B+Tree page traversal, LSM compaction (memtable, WAL, SSTable), buffer pools, and kernel syscalls.
4. **Distributed Realism & Concurrency**: Redis Lua scripts, distributed locks, optimistic vs pessimistic locking, 2PC, Saga compensation, and idempotent deduplication.
5. **Architectural Trade-Off Matrix**: Quantitative evaluations of competing design decisions (e.g. Fan-out-on-write vs Fan-out-on-read, Push vs Pull).
6. **Candidate Level Expectations**: Granular performance bars expected from Mid-Level (L4), Senior (L5), and Staff+ (L6/Principal) engineers.

---

## 🧭 The 45-Minute System Design Interview Blueprint

Mastering system design requires disciplined time management and active conversation leadership:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                   45-MINUTE SYSTEM DESIGN TIMELINE BREAKDOWN                   │
├──────────────┬─────────────────────────────┬───────────────────────────────────┤
│ Minute 00-05 │ Scope & Requirements        │ Clarify functional requirements,  │
│              │ (Clarification)             │ non-functional SLAs, and scale.   │
├──────────────┼─────────────────────────────┼───────────────────────────────────┤
│ Minute 05-10 │ High-Level Design           │ Core entities, REST/gRPC API, and │
│              │ (The Backbone)              │ initial end-to-end block flow.    │
├──────────────┼─────────────────────────────┼───────────────────────────────────┤
│ Minute 10-30 │ Detailed Component Design   │ Deep dive into storage engines,   │
│              │ (The Engine)                │ caching tiers, message brokers.   │
├──────────────┼─────────────────────────────┼───────────────────────────────────┤
│ Minute 30-40 │ Bottlenecks & Failure Modes │ Hotspots, split-brain, network    │
│              │ (Staff-Level Depth)         │ partitions, backpressure, quorum. │
├──────────────┼─────────────────────────────┼───────────────────────────────────┤
│ Minute 40-45 │ Summary & Trade-Off Matrix  │ Honest pros/cons, metrics review, │
│              │ (Wrap-Up)                   │ and candidate Q&A.                │
└──────────────┴─────────────────────────────┴───────────────────────────────────┘
```

---

## 📊 Master Problem Breakdown Matrix (45 Real-World Systems)

The problems below are categorized by primary architectural challenge and ordered from foundational classics to ultra-scale distributed infrastructure:

### 1. High-Frequency Classics

| # | System Design Problem | Category | Complexity | Core Mechanics & Distributed Patterns |
|---|---|---|---|---|
| 1 | [Bitly (URL Shortener)](./bitly.md) | Distributed Storage | Medium | Base62 vs Hashing, Range-based KGS, 301 vs 302 caching, Redis read cache |
| 2 | [Dropbox (File Storage & Sync)](./dropbox.md) | Cloud Storage | Hard | Chunking, Rolling Hash (Rabin Fingerprint), Merkle Tree sync, S3 + Metadata DB |
| 3 | [Local Delivery Service (Gopuff)](./gopuff.md) | E-Commerce / Logistics | Hard | Dark store inventory reservation, Redis Lua 2-phase lock, batching & dispatch |
| 4 | [Ticketmaster (Ticket Booking)](./ticketmaster.md) | Concurrency / Booking | Hard | High-concurrency seat locking, distributed waiting room, seat release TTL |
| 5 | [Facebook News Feed](./fb-news-feed.md) | Social Networks | Hard | Push vs Pull vs Hybrid fanout, Redis timeline cache, ML ranking pipeline |
| 6 | [Tinder (Proximity Matchmaking)](./tinder.md) | Geospatial / Matching | Hard | Geohash/Quadtree indexing, swipe write-buffer, mutual match detection |

### 2. Real-Time & High-Throughput Streams

| # | System Design Problem | Category | Complexity | Core Mechanics & Distributed Patterns |
|---|---|---|---|---|
| 7 | [LeetCode (Code Execution Engine)](./leetcode.md) | Sandboxing / Compute | Hard | gVisor/Docker isolation, async judge worker pool, security jail, timeout aborts |
| 8 | [WhatsApp (Real-Time Messaging)](./whatsapp.md) | Real-Time Comm | Hard | Netty/Erlang WebSocket gateways, ephemeral queues, offline store, E2EE |
| 9 | [Distributed Rate Limiter](./distributed-rate-limiter.md) | Infra / API Security | Medium | Token bucket vs Sliding window counter, Redis Lua script, local token batching |
| 10 | [YouTube (Video Streaming)](./youtube.md) | Media / Streaming | Hard | Transcoding DAG, chunked upload, HLS/DASH manifests, CDN edge caching |
| 11 | [Facebook Live Comments](./fb-live-comments.md) | Streaming / Fan-Out | Hard | High-velocity comment ingestion, sliding-window throttling, WebSockets |
| 12 | [YouTube Top K / Trending](./top-k.md) | Stream Processing | Hard | Count-Min Sketch, Min-Heap, Flink sliding window streaming, Lamport clocks |

### 3. Location, Search & Data Ingestion

| # | System Design Problem | Category | Complexity | Core Mechanics & Distributed Patterns |
|---|---|---|---|---|
| 13 | [Uber (Ride-Hailing & Dispatch)](./uber.md) | Geospatial / Dispatch | Hard | Uber H3 hexagonal spatial indexing, driver location stream, trip state machine |
| 14 | [Web Crawler](./web-crawler.md) | Distributed Scraping | Hard | Distributed URL frontier, politeness queues, Bloom filter deduplication, DNS |
| 15 | [Ad Click Aggregator](./ad-click-aggregator.md) | Big Data / Analytics | Hard | Kafka event stream, Flink window aggregation, exact-once deduplication, OLAP |
| 16 | [Facebook Post Search](./fb-post-search.md) | Search / Information Retrieval | Hard | Distributed inverted index, partition by post vs term, real-time search engine |
| 17 | [Yelp (Local Business Reviews)](./yelp.md) | Geospatial / Search | Medium | Proximity search (Google S2/QuadTree), business review rollup, read caching |
| 18 | [Instagram (Photo Sharing & Feed)](./instagram.md) | Media / Social | Hard | Photo upload pipeline, S3/CloudFront, hybrid feed generation, follower graph |

### 4. Workflows, Schedulers & Aggregation

| # | System Design Problem | Category | Complexity | Core Mechanics & Distributed Patterns |
|---|---|---|---|---|
| 19 | [Strava (GPS Activity & Segments)](./strava.md) | Geospatial / Telemetry | Hard | GPS polyline map matching (R-Tree/PostGIS), segment leaderboards, Redis ZSET |
| 20 | [Distributed Cache (Redis/Memcached)](./distributed-cache.md) | Infra / Distributed Memory | Hard | Consistent hashing ring, virtual nodes, W-TinyLFU eviction, Raft consensus |
| 21 | [Online Auction Platform (eBay)](./online-auction.md) | Real-Time / Concurrency | Hard | Real-time bidding engine, countdown clock extension, high-contention mutex |
| 22 | [Distributed Job Scheduler](./job-scheduler.md) | Infra / Async Compute | Hard | Hierarchical timing wheel, Redis ZSET delay queue, worker lease & heartbeat |
| 23 | [Google News (News Aggregator)](./google-news.md) | Aggregation / ML | Hard | Feed scraper, SimHash near-duplicate clustering, TF-IDF / vector ranking |
| 24 | [CamelCamelCamel (Price Tracker)](./camelcamelcamel.md) | Crawling / Time-Series | Medium | Product price scraper, time-series storage, alert trigger engine, webhooks |

### 5. Enterprise, Finance & AI Systems

| # | System Design Problem | Category | Complexity | Core Mechanics & Distributed Patterns |
|---|---|---|---|---|
| 25 | [Notification System](./notification-system.md) | Infra / Messaging | Medium | Priority queues, provider failover (APNS/FCM/Twilio), rate limiting, templates |
| 26 | [Robinhood (Stock Trading)](./robinhood.md) | Fintech / Low-Latency | Hard | Order matching engine (LMAX Disruptor), double-entry ledger, FIX protocol |
| 27 | [Google Docs (Collaborative Editor)](./google-docs.md) | Distributed Consistency | Hard | Operational Transformation (OT) vs CRDT (Yjs), client-server sync, cursor state |
| 28 | [Payment System (Stripe)](./payment-system.md) | Fintech / Transactions | Hard | Double-entry ledger, idempotency keys, PSP orchestration, reconciliation cron |
| 29 | [Metrics Monitoring (Datadog)](./metrics-monitoring.md) | Observability / TSDB | Hard | TSDB LSM-tree (Gorilla compression), PromQL engine, alert rule evaluator |
| 30 | [Online Chess Platform](./online-chess.md) | Gaming / Real-Time | Medium | Move validation engine, chess clock synchronization, WebSocket game room, Elo |
| 31 | [ChatGPT (LLM Inference Gateway)](./chatgpt.md) | AI / Streaming | Hard | SSE token streaming, prompt queuing, KV cache routing, vLLM / Triton |
| 32 | [Flash Sale System](./flash-sale.md) | Concurrency / Peak Load | Hard | Traffic surge absorption, Redis token bucket gating, atomic inventory CAS |

### 6. Storage Engines, Distributed Primitives & Enterprise Platforms

| # | System Design Problem | Category | Complexity | Core Mechanics & Distributed Patterns |
|---|---|---|---|---|
| 33 | [Key-Value Store (Dynamo/Cassandra)](./key-value-store.md) | Distributed Storage | Hard | Consistent hashing ring, virtual nodes, vector clocks, tunable quorum ($R+W>N$), hinted handoff, Merkle trees |
| 34 | [Distributed File System (GFS/HDFS)](./distributed-file-system.md) | Large-Scale Storage | Hard | Master/Chunkserver architecture, 64MB chunking, in-memory metadata WAL, pipelined data chain, atomic appends |
| 35 | [Netflix (Video Streaming)](./netflix.md) | Media / Streaming | Hard | Open Connect CDN (OCA), VMAF per-title encoding ladder, DASH/CMAF 2-4s chunks, Multi-DRM, buffer-based ABR |
| 36 | [Spotify (Audio Streaming)](./spotify.md) | Media / Audio | Hard | Ogg Vorbis/AAC chunking (first 10s instant buffer), collaborative playlist fractional indexing, Annoy vector search |
| 37 | [Email System (Gmail)](./email-system.md) | Enterprise Messaging | Hard | SMTP/IMAP/POP3 gateways, SPF/DKIM/DMARC, distributed mail spooling, LSM mailbox, per-user search index |
| 38 | [Google Maps (Routing Engine)](./google-maps.md) | Geospatial / Routing | Hard | Vector map tiles (Protobuf), Contraction Hierarchies (CH), bidirectional A*, live traffic speed aggregation |
| 39 | [Search Autocomplete (Typeahead)](./search-autocomplete.md) | Search / Low-Latency | Medium | Prefix Trie with precomputed Top-5, serialized Trie cache, client debouncing, Flink sampling pipeline |
| 40 | [Google Search Engine](./google-search.md) | Search / Big Data | Hard | Document-centric inverted index sharding, delta compression, skip lists, PageRank + BM25, SimHash |
| 41 | [Google Calendar](./google-calendar.md) | Scheduling / Productivity | Hard | RFC 5545 iCalendar RRULE dynamic expansion, timezone/DST handling, RSVP state machine, room conflict locking |
| 42 | [Issue Tracker (Jira / Linear)](./issue-tracker.md) | Enterprise / Workflows | Hard | Configurable workflow state machine, optimistic concurrency control, real-time WebSocket board sync, JQL parser |
| 43 | [Shopping Cart (Amazon)](./amazon-shopping-cart.md) | E-Commerce / Storage | Hard | Always-writable Dynamo AP model ($W=1$), guest-to-user session merge, vector clocks Add-Wins, CRDT PN-Counter |
| 44 | [Pastebin (Text Sharing)](./pastebin.md) | Distributed Storage | Medium | Base62 unique IDs, tiered storage (hot Redis vs cold S3), dual-tier TTL expiration, syntax highlight caching |
| 45 | [Cookie Consent Platform (CMP)](./cookie-consent.md) | Infra / Privacy & Compliance | Hard | Edge CDN policy evaluation (&lt;10ms via Cloudflare Workers), Geo-IP matching, IAB TCF v2.2 encoding, Merkle audit trail |

---

## 🛠️ Fundamental Numbers Every Candidate Must Know

Keep these hardware and latency figures at your fingertips during capacity planning:

```
┌─────────────────────────────────────────────────────────────┐
│               LATENCY NUMBERS EVERY ARCHITECT KNOWS         │
├─────────────────────────────────────────┬───────────────────┤
│ L1 cache reference                      │ 0.5 ns            │
│ Branch mispredict                       │ 5 ns              │
│ L2 cache reference                      │ 7 ns              │
│ Mutex lock/unlock                       │ 25 ns             │
│ Main memory reference                   │ 100 ns            │
│ Compress 1K bytes with Zstandard        │ 2,000 ns (2 µs)   │
│ Send 1K bytes over 10 Gbps network      │ 1,000 ns (1 µs)   │
│ Read 1 MB sequentially from memory      │ 250,000 ns (250µs)│
│ Round trip within same datacenter       │ 500,000 ns (0.5ms)│
│ Read 1 MB sequentially from NVMe SSD    │ 1,000,000 ns (1ms)│
│ Read 1 MB sequentially from Magnetic HDD│ 20,000,000 ns(20ms│
│ Send packet CA to Netherlands & back    │ 150 ms            │
└─────────────────────────────────────────┴───────────────────┘
```

---

## 🔗 Related Architecture Resources

- [System Design Foundations](../architecture-fundamentals.md)
- [Distributed Caching Strategies](../caching-strategies.md)
- [CAP Theorem & PACELC Trade-Offs](../cap-theorem.md)
- [Data Consistency & Consensus](../data-consistency.md)
- [Petabyte Data Stores & Zero-Downtime Migrations Case Studies](../case-studies-data-migrations.md)
- [Hyper-Scale Architecture Case Studies](../case-studies-architecture-scaling.md)
- [Catastrophic Outages & Post-Mortem Reliability Case Studies](../case-studies-outages-reliability.md)
