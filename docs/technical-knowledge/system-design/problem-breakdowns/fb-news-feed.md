---
id: fb-news-feed
title: Design Facebook's News Feed
sidebar_label: 5. FB News Feed
description: Staff-level system design breakdown for a social media news feed system supporting billions of users and real-time ML ranking.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design Facebook's News Feed

A social media news feed aggregates a real-time, personalized stream of posts, photos, videos, links, and status updates published by friends, family, and followed pages. It requires delivering relevant content to hundreds of millions of concurrent users with sub-200ms response times.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Publish Post**: Users can publish posts containing text, images, and videos.
2. **View News Feed**: Users can view an aggregated, algorithmically ranked feed of posts from friends and followed entities.
3. **Pagination**: Users can scroll infinitely to load older posts chronologically or by rank.
4. **Social Interactions**: Like, comment on, and share posts in real-time.
5. **Media Storage**: Support seamless photo and video upload and CDN delivery.

### Non-Functional Requirements
- **Ultra-Low Latency**: Feed retrieval must return the first page of 20 posts in `< 200ms`.
- **High Availability**: Read availability is paramount (`99.99%`). Users should still see cached feeds even during downstream ranking degradation.
- **Eventual Consistency**: New posts do not need to appear on all friends' screens instantly; a delay of 2–5 seconds is completely acceptable.
- **Extreme Scale**: Support 2 Billion total users and 500 Million Daily Active Users (DAU).

### Capacity Estimations & Traffic Sizing
- **Daily Active Users (DAU)**: 500 Million users.
- **Average Feed Reads**: Each user views their feed 5 times per day $\implies 500\text{M} \times 5 = \mathbf{2.5\text{ Billion feed reads/day}}$.
  - Read QPS = $2.5\text{B} / 86,400 \approx$ **29,000 QPS average (peaking at 60,000 QPS)**.
- **Average Posts Created**: 10% of users post daily $\implies$ 50 Million new posts/day.
  - Write QPS = $50\text{M} / 86,400 \approx$ **580 posts/sec average (peaking at 2,500 QPS)**.
- **Storage Calculation (5 Years)**:
  - 50M posts/day $\times$ 365 days $\times$ 5 years $\approx$ **91 Billion posts**.
  - Post metadata: `post_id` (16 bytes) + `author_id` (16 bytes) + `content` (500 bytes) + `media_urls` (100 bytes) + `created_at` (8 bytes) $\approx$ **700 bytes**.
  - 91 Billion $\times$ 700 bytes $\approx$ **63.7 TB metadata storage**.
  - Media storage: 20% of posts contain photos (average 500 KB) $\implies 50\text{M} \times 0.20 \times 500\text{ KB} = \mathbf{5\text{ TB/day}}$ (9 Petabytes over 5 years on S3/blob storage).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                          USER                          │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID         │ PRIMARY KEY          │
│ name             │ VARCHAR(100) │ NOT NULL             │
│ follower_count   │ INT          │ Tier classification  │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      SOCIAL_GRAPH                      │
├──────────────────┬──────────────┬──────────────────────┤
│ follower_id      │ UUID         │ COMPOSITE PK, FK     │
│ followee_id      │ UUID         │ COMPOSITE PK, FK     │
│ status           │ VARCHAR(16)  │ ACTIVE / BLOCKED     │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                          POST                          │
├──────────────────┬──────────────┬──────────────────────┤
│ post_id          │ UUID         │ PRIMARY KEY          │
│ author_id        │ UUID         │ INDEX, FK            │
│ text_content     │ TEXT         │ UTF-8                │
│ media_urls       │ JSONB/ARRAY  │ S3 Object URLs       │
│ like_count       │ BIGINT       │ Aggregated Counter   │
│ comment_count    │ BIGINT       │ Aggregated Counter   │
│ created_at       │ TIMESTAMP    │ B+Tree / Partition   │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Publish a Post
```http
POST /api/v1/posts
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "text_content": "Just launched our distributed systems guide!",
  "media_urls": ["https://cdn.fb.com/photos/99a812.jpg"]
}
```
**Response (`201 Created`)**:
```json
{
  "post_id": "b182049e-71b3-4f51-b844-482a0b192801",
  "created_at": "2026-09-22T22:30:00Z"
}
```

#### 2. Get User News Feed
```http
GET /api/v1/feed?limit=20&cursor=eyJwb3N0X2lkIjoiYjE4Mi...
Authorization: Bearer <jwt_token>
```
**Response (`200 OK`)**:
```json
{
  "items": [
    {
      "post_id": "b182049e-71b3-4f51-b844-482a0b192801",
      "author": {"user_id": "usr_991", "name": "Jane Doe"},
      "text": "Just launched our distributed systems guide!",
      "like_count": 412,
      "comment_count": 58,
      "created_at": "2026-09-22T22:30:00Z"
    }
  ],
  "next_cursor": "eyJwb3N0X2lkIjoiYTI4MS..."
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="feed-fanout" title="Facebook News Feed Fan-Out & Real-Time Ranking Architecture" />

### Core Data Flow & Feed Pipelines

#### 1. Write Path (Post Creation & Fan-Out)
1. User publishes a post $\implies$ `POST /api/v1/posts`.
2. **Post Service** writes metadata to the primary PostgreSQL/Cassandra store and publishes a `PostCreatedEvent` to **Apache Kafka**.
3. **Fan-out Worker Cluster** consumes the event:
   - Evaluates the author's follower count.
   - If author is a **standard user** ($< 25,000$ followers): Queries the Social Graph DB for all follower IDs and pushes the `post_id` into each follower's **Redis Timeline Sorted Set** (`ZADD feed:{follower_id} timestamp post_id`).
   - If author is a **celebrity** ($> 25,000$ followers): Does **NOT** fan out to Redis. Instead, stores the post in the celebrity's dedicated outbox.

#### 2. Read Path (Feed Retrieval & Ranking)
1. User opens the Facebook app $\implies$ `GET /api/v1/feed`.
2. **Feed Aggregation Service**:
   - Fetches the pre-computed feed from the user's **Redis Timeline Cache** (contains candidate `post_id`s).
   - Fetches recent posts from all **celebrities** the user follows (fan-out-on-read).
   - Merges candidate post IDs and removes duplicates.
3. **Hydration & Ranking Engine**:
   - Multi-gets post metadata, author details, like counts, and comments in parallel using Redis / Memcached.
   - Scores candidate posts through an ML ranking model based on affinity, recency, content type, and past user engagement.
4. Returns top 20 ranked posts with pagination cursor.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Fan-Out-on-Write (Push) vs Fan-Out-on-Read (Pull) vs Hybrid
This is the single most important architectural trade-off in news feed design.

| Mechanism | How It Works | Strengths | Catastrophic Failure Mode |
|---|---|---|---|
| **Fan-Out-on-Write (Push)** | When author posts, background workers write post ID to **every** follower's feed cache. | Feed reads are instantaneous ($O(1)$ from Redis). | **Celebrity Problem**: A celebrity with 50M followers causes 50 Million Redis writes per post, thrashing the message queue and choking storage. |
| **Fan-Out-on-Read (Pull)** | Feeds are generated on-the-fly only when a user requests their feed. | Zero write amplification on posting. | **Read-Path Exhaustion**: Users following 1,000 accounts must query 1,000 separate inboxes, sort, and merge in real-time, causing multi-second feed latency. |
| **Hybrid Model (Industry Standard)** | Push for standard users; Pull for celebrities; merged on read. | Fast reads for 99% of users; zero write storms for celebrities. | Requires logic to distinguish follower thresholds and dynamic merging. |

#### The Hybrid Fan-Out Architecture:
```
IF author.follower_count < 25,000:
    ➔ Execute Fan-Out-on-Write (Push post_id to all followers' Redis ZSETs)
ELSE:
    ➔ Store post in author's personal celebrity timeline ONLY.
    ➔ When a follower reads their feed:
       Fetch (User Redis Feed) + Pull (Followed Celebrities' recent posts)
       ➔ Merge & Sort in memory via Min-Heap in sub-10ms.
```

### Deep Dive 2: Feed Cache Architecture (Redis Sorted Sets)
How is a user's feed stored in memory?
- **Key**: `feed:{user_id}`
- **Data Structure**: Redis **Sorted Set (ZSET)**.
  - Member = `post_id`
  - Score = `created_at` (epoch timestamp in milliseconds).
- **Trimming**: To prevent memory runaway, each ZSET is capped at the most recent **800 post IDs** via `ZREMRANGEBYRANK feed:{user_id} 0 -801`.
- **Inactive User Eviction**: We only pre-compute feeds for users who have been active within the last 72 hours. Inactive users have their ZSET evicted via Redis TTL. When an inactive user opens the app, their feed is cold-generated on-demand.

### Deep Dive 3: Real-Time ML Feed Ranking Pipeline
Facebook does not show a purely chronological feed; it uses algorithmic ranking.
1. **Candidate Retrieval**: Pull ~500 recent post candidates from the hybrid timeline.
2. **Feature Hydration**: Multi-get features from in-memory cache:
   - *User Features*: Age, location, historical click-through rate, active hours.
   - *Post Features*: Author, format (video vs photo), age decay ($e^{-\lambda t}$).
   - *Interaction Features*: User-author affinity score (how often user likes this author's posts).
3. **ML Scoring Model**: Two-stage scoring:
   - Fast linear model filters 500 candidates down to top 50.
   - Deep neural network computes final probability scores: $P(\text{click}), P(\text{like}), P(\text{comment}), P(\text{share})$.
   - Final Score = $w_1 P(\text{click}) + w_2 P(\text{like}) + w_3 P(\text{comment}) + w_4 P(\text{share}) - \text{Penalty}(\text{clickbait})$.
4. **Diversity Re-Ranking**: Ensures no two consecutive posts are from the same author or media type.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Feed Aggregation** | Pure Push (Write) | Hybrid (Push for standard, Pull for VIPs) | **Hybrid**: Pure push completely breaks under celebrity accounts. Hybrid isolates celebrity write volume while keeping 99% of feed reads sub-50ms. |
| **Feed Storage** | Store full post JSON in Redis | Store only `post_id` in Redis; hydrate on read | **Store `post_id` only**: Saving full JSON for 800 posts per user would require Petabytes of RAM. Storing 64-bit IDs reduces RAM usage by 95% while keeping hydration fast via MGET. |
| **Consistency Model** | Strong Consistency | Eventual Consistency | **Eventual Consistency**: Social feeds do not require strict ACID. A 2-second delay in seeing a friend's post is completely unnoticeable to users. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Clarifies feed scale and read/write ratios.
- Distinguishes between Push and Pull models.
- Designs relational schema for Users, Posts, and Follows.
- Proposes caching recent feeds in Redis.

### Senior (L5 / IC5)
- Solves the Celebrity Problem using a Hybrid Push/Pull architecture with concrete follower cutoffs.
- Details Redis Sorted Set storage with ZREMRANGEBYRANK trimming to 800 items.
- Outlines feed ranking stages (candidate generation, hydration, ML scoring).
- Explains cursor-based pagination over timestamp/post_id to avoid missing posts during infinite scroll.

### Staff+ (L6 / Principal)
- Designs multi-datacenter feed caching: Handles cross-region replication lag without displaying phantom or duplicate posts.
- Details operational resilience: Explains fallback mechanisms if ML ranking times out (graceful degradation to fast chronological order).
- Analyzes privacy and blocklist edge cases: Ensuring unfollows and friend deletions instantly invalidate cached timeline entries without massive full-cache invalidation sweeps.
