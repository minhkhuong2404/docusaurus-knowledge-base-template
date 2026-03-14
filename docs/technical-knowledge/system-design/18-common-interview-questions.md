---
id: common-interview-questions
title: Common System Design Interview Questions
sidebar_label: Interview Questions
description: A comprehensive question bank for system design interviews covering classic system design problems, behavioral questions, and discussion frameworks for FAANG-level interviews.
tags: [interview-prep, questions, system-design, faang, practice]
---

# Common System Design Interview Questions

> Each question includes key discussion points, not just the answer. Interviewers want to see your **thought process**.

---

## Classic System Design Problems

### 1. Design a URL Shortener (bit.ly)

**Key Discussion Points:**
- **Hashing**: MD5/SHA256 → base62 encode → take first 7 chars. Handle collisions.
- **Custom short URLs**: Check uniqueness before storing.
- **Storage**: Key-value store (Redis for cache, DB for persistence). ~1.8 TB in 5 years (see [Capacity Planning](./02-capacity-planning)).
- **Redirect**: 301 (permanent, browser caches) vs 302 (temporary, tracks every click). Use 302 for analytics.
- **Analytics**: Click tracking with Kafka → async aggregation.
- **Read scale**: Cache hot URLs in Redis (top 20% = 80% traffic).
- **Write scale**: Low write QPS (~12 writes/sec for 100M DAU), no sharding needed initially.

---

### 2. Design Twitter / Social Feed

**Key Discussion Points:**
- **Data model**: User, Tweet, Follow, Feed tables.
- **Fan-out strategy**: Fan-out-on-write (pre-populate followers' feeds) vs fan-out-on-read.
- **Celebrity problem**: Beyoncé has 50M followers — fan-out-on-write is too slow. Use hybrid: fan-out-on-write for < 1M followers, fan-out-on-read for celebrities.
- **Timeline storage**: Redis sorted set per user (`ZADD user:feed:{userId} score tweetId`).
- **Media**: S3 + CDN for images/videos.
- **Search**: Elasticsearch for full-text tweet search.
- **Scale**: 100M DAU, ~1,000 write QPS, ~100,000 read QPS → need read replicas + caching.

---

### 3. Design YouTube / Video Streaming

**Key Discussion Points:**
- **Upload pipeline**: Client → API → S3 raw → video processor (Lambda/worker) → encode to multiple resolutions (360p, 720p, 1080p, 4K) → S3 processed.
- **Video encoding**: Transcode to different formats (H.264, AV1) using distributed workers (AWS Elastic Transcoder or custom FFmpeg workers).
- **Streaming**: Adaptive bitrate streaming (HLS/DASH) — client switches quality based on bandwidth.
- **CDN**: Videos served via CDN, not origin. Regional CDN PoPs.
- **Metadata**: Video title, description, tags → Postgres. Views count → Redis INCR → async flush.
- **Recommendations**: ML service, separate from core storage.
- **Storage estimation**: 1M uploads/day × 300MB × 3 resolutions ≈ 900TB/day.

---

### 4. Design WhatsApp / Chat System

**Key Discussion Points:**
- **Message delivery**: Client → WebSocket server → Kafka → recipient WebSocket server.
- **Message persistence**: Store in Cassandra (write-heavy, time-ordered).
- **Offline delivery**: If recipient offline → store in DB → deliver on reconnect.
- **Message ordering**: Sequence number per conversation; Kafka partition per conversation.
- **End-to-end encryption**: Key exchange on first message; server stores encrypted blobs only.
- **Group chat**: Fan-out message to all group members; cap group size for simplicity.
- **Media**: Presigned S3 URL for image/video; send URL in message.
- **Presence**: Redis with TTL (`SETEX user:online:{id} 60 1`).
- **Scale**: 500M DAU, 40 messages/day = 230,000 msg/s.

---

### 5. Design Instagram / Photo Sharing

**Key Discussion Points:**
- **Upload**: Presigned S3 URL → direct upload → notify API → async processing (resize, thumbnail, CDN).
- **Feed**: Hybrid fan-out like Twitter. Cache feed in Redis.
- **Storage**: Images on S3 + CloudFront CDN. Metadata in Postgres.
- **Stories**: Separate from main feed. 24h TTL in Redis sorted set.
- **Explore/Discover**: Recommendation engine, separate service.
- **Counters**: Like/view counts in Redis; async flush to DB.

---

### 6. Design Uber / Ride Sharing

**Key Discussion Points:**
- **Location tracking**: Drivers send GPS every 5s → WebSocket or HTTP → geospatial store.
- **Geospatial queries**: Redis GEO commands (`GEOADD`, `GEORADIUS`) or PostGIS for "drivers near me."
- **Matching**: Trip request → find N nearby drivers → send notification → driver accepts → create trip.
- **Surge pricing**: ML model based on supply/demand per geo-cell.
- **Trip state machine**: REQUESTED → DRIVER_ASSIGNED → DRIVER_EN_ROUTE → TRIP_STARTED → COMPLETED.
- **Payment**: Async, Saga pattern across trip + payment + payout services.
- **ETA calculation**: Road network graph (Dijkstra/A*) with real-time traffic data.

---

### 7. Design a Rate Limiter

**Key Discussion Points:**
- **Algorithms**: Token bucket, sliding window log, sliding window counter.
- **Distributed implementation**: Redis + Lua script for atomic check-and-decrement.
- **Keys**: By API key, user ID, IP, or combination.
- **Response headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Retry-After`.
- **Placement**: API Gateway, service middleware, or library.
- **Multi-tier**: Different limits per endpoint (e.g., /login stricter than /feed).
- **Redis sliding window**:
  ```
  MULTI
    ZADD key timestamp timestamp
    ZREMRANGEBYSCORE key -inf (now - window)
    ZCARD key
  EXEC
  ```

---

### 8. Design a Notification System

**Key Discussion Points:**
- **Channels**: Push (FCM/APNs), Email (SendGrid/SES), SMS (Twilio), In-app.
- **Flow**: Event → Kafka → Notification Service → channel selection → delivery.
- **Channel selection**: User preferences + event type → choose channel.
- **Templating**: Template engine (Freemarker/Thymeleaf) for message rendering.
- **Delivery guarantees**: At-least-once with idempotency. Track delivery status.
- **Retry**: Exponential backoff for failed deliveries.
- **Rate limiting**: Don't spam users — respect quiet hours, daily limits.
- **Batching**: Email digest (hourly/daily) vs instant push.
- **Scale**: 10M notifications/day = ~116/sec average, needs async pipeline.

---

### 9. Design a Web Crawler

**Key Discussion Points:**
- **Seed URLs**: Start with known URLs, expand via discovered links.
- **BFS vs DFS**: BFS better for breadth; prioritize fresh/important pages.
- **URL frontier**: Priority queue (by importance/freshness) backed by disk.
- **Distributed crawlers**: Partition URLs by domain hash across workers.
- **Politeness**: Respect `robots.txt`. Rate limit per domain (1 req/sec).
- **Deduplication**: Bloom filter for URL seen check. Content hash for page dedup.
- **Storage**: HTML in S3; metadata/links in Cassandra.
- **Scale**: 1B pages, 500 bytes avg → 500 GB storage. Crawl 1B pages in 30 days = 385 pages/sec.

---

### 10. Design a Search Autocomplete

**Key Discussion Points:**
- **Trie**: Data structure for prefix matching. Too large to fit in memory at Google scale.
- **Top-K per prefix**: Precompute top 10 queries for each prefix.
- **Data collection**: Log search queries → aggregate frequency → build trie offline.
- **Update frequency**: Rebuild trie weekly (offline) or use streaming aggregation.
- **Storage**: Trie in Redis or Elasticsearch. Cache hot prefixes in memory.
- **Ranking**: By frequency, freshness, personalization.
- **Latency**: P99 < 50ms. Local cache for hot prefixes.

---

### 11. Design a Distributed Cache (Redis)

**Key Discussion Points:**
- **Architecture**: Redis Cluster (sharding via consistent hashing across nodes).
- **Replication**: Primary-replica per shard; replica promotes on primary failure.
- **Eviction**: LRU for general cache; LFU for skewed access patterns.
- **Persistence**: RDB (point-in-time snapshot) or AOF (append-only log) or both.
- **Partitioning**: 16,384 hash slots divided across nodes.
- **Hot key problem**: Single key overwhelms one node → replicate hot keys to multiple slots.
- **Consistency**: Redis Cluster is AP — can have split-brain; use WAIT command for durability.

---

### 12. Design a Payment System

**Key Discussion Points:**
- **Idempotency**: Idempotency keys on every payment API call. Essential.
- **Double-spend prevention**: Pessimistic lock or database constraint on account.
- **Saga**: Saga pattern across payment, inventory, fulfillment (see [Multi-Step Process](./09-multi-step-process)).
- **Reconciliation**: Async job to compare internal records with payment gateway records.
- **Compliance**: PCI-DSS — never store raw card numbers; use tokens from payment gateway.
- **Retry logic**: Exponential backoff with idempotency keys to payment provider.
- **Ledger**: Append-only ledger table (never update balances directly).
- **Exactly-once**: DB-level idempotency check before processing.

---

### 13. Design a Leaderboard

**Key Discussion Points:**
- **Redis Sorted Set**: `ZADD leaderboard score userId`. `ZREVRANK` for position. O(log N).
- **Global leaderboard**: Single sorted set — works up to 100M+ entries in Redis.
- **Friends leaderboard**: Intersect global sorted set with user's friend set.
- **Time windows**: Separate sorted sets for daily/weekly/all-time. Expire daily set after 24h.
- **Score updates**: `ZINCRBY leaderboard delta userId` — atomic increment.
- **Pagination**: `ZREVRANGE leaderboard 0 9 WITHSCORES` for top 10.
- **Scale**: Redis can handle 100K+ ZADD operations/sec.

---

### 14. Design a Key-Value Store

**Key Discussion Points:**
- **Data structures**: Hash table for O(1) get/put. LSM-tree for disk-based (LevelDB, RocksDB).
- **Consistent hashing**: Distribute keys across nodes. Virtual nodes for even distribution.
- **Replication**: 3 replicas per key (configurable N). Quorum reads/writes (W + R > N).
- **Conflict resolution**: Last-write-wins (timestamp) or vector clocks (causal).
- **Partitioning**: Consistent hashing ring. Adding nodes → minimal data migration.
- **Gossip protocol**: Node membership and failure detection.
- **Anti-entropy**: Merkle trees for detecting and repairing inconsistencies between replicas.

---

## Behavioral / Architecture Deep-Dive Questions

### Trade-off Questions
1. When would you use a relational DB vs NoSQL? What's your decision framework?
2. When would you choose microservices over a monolith?
3. When is eventual consistency acceptable? When is it not?
4. How do you decide between synchronous and asynchronous communication?
5. When would you use a message queue vs direct API calls?

### Operational Questions
1. How do you deploy a schema migration with zero downtime?
2. How do you debug a sudden latency spike in production?
3. How do you design a system with 99.99% availability?
4. How do you handle a database that's running out of disk space?
5. How do you approach capacity planning for a new feature?

### Architecture Questions
1. How would you evolve a monolith into microservices incrementally?
2. How do you design for multi-tenancy?
3. How would you design a system that must work offline?
4. How do you design for GDPR compliance (data deletion, data portability)?
5. How would you design a geo-distributed system that serves users globally?

---

## Interview Tips Summary

| Phase | What Interviewers Look For |
|---|---|
| Requirements | Do you ask the right questions? Do you scope properly? |
| Estimation | Can you do back-of-envelope math? Do you validate assumptions? |
| High-level design | Is the design sound? Does it address the requirements? |
| Deep dive | Can you go deep on specific components? Do you know trade-offs? |
| Wrap-up | Do you identify weaknesses? Do you know what to monitor? |

### Red Flags to Avoid
- Jumping to solutions without requirements
- Designing a single-server system
- Not acknowledging trade-offs
- Silence — always think out loud
- Designing perfect system before validating basics
- Ignoring failure modes

### Green Flags to Show
- Explicit assumptions
- Quantitative reasoning ("at 10,000 QPS, a single DB can handle this...")
- Trade-off awareness ("I'm choosing X over Y because...")
- Proactive failure mode discussion
- Incrementally evolving the design

---

## Quick Reference: Technology Selection

| Need | Technology |
|---|---|
| Relational data, ACID | PostgreSQL |
| Document store | MongoDB |
| Key-value / cache | Redis |
| Column-family, time-series | Cassandra |
| Full-text search | Elasticsearch |
| Message queue | Kafka (streaming) / RabbitMQ (task queue) |
| Object storage | S3 / GCS |
| CDN | CloudFront / Fastly |
| Service mesh | Istio / Linkerd |
| Container orchestration | Kubernetes |
| Distributed lock | Redis / Zookeeper |
| API Gateway | Kong / AWS API Gateway / Spring Cloud Gateway |
