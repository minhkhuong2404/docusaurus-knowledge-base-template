---
id: instagram
title: Design a Photo Sharing & Social Feed App Like Instagram
sidebar_label: 18. Instagram (Photo Sharing & Feed)
description: Staff-level system design breakdown for a high-scale photo sharing platform with media processing pipelines, hybrid timelines, and sharded like counters.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Photo Sharing & Social Feed App Like Instagram

A photo-sharing social platform (e.g., Instagram, Pinterest, Threads) enables hundreds of millions of users to capture, edit, and upload photos and short videos, follow friends and influencers, and browse a real-time, personalized visual feed. The platform requires high-speed image processing pipelines, global CDN media delivery, scalable feed generation, and high-concurrency engagement counters.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Photo Upload & Processing**: Users upload high-resolution photos; the system automatically compresses them and generates multiple responsive resolutions.
2. **Personalized Timeline Feed**: Users view a scrollable feed of photos from accounts they follow.
3. **User Profile Grid**: Fast browsing of a user's uploaded photo grid.
4. **Social Graph**: Follow and unfollow accounts.
5. **Engagement & Likes**: Like and comment on photos with real-time aggregated counts.
6. **Ephemeral Stories**: Photos/videos that automatically expire and disappear after 24 hours.

### Non-Functional Requirements
- **Ultra-Fast Feed Delivery**: Timeline feed loads in `< 200ms` globally.
- **Global Media Latency**: Images load in `< 500ms` via edge CDN caching.
- **High Availability**: 99.99% availability for photo viewing and feed browsing.
- **Extreme Scale**: Support 1 Billion Monthly Active Users (MAU) and 500 Million Daily Active Users (DAU).

### Capacity Estimations & Sizing (Global Scale)
- **Daily Active Users (DAU)**: 500 Million users.
- **Daily Photo Uploads**: 100 Million new photos uploaded every day.
  - Upload QPS = $100\text{M} / 86,400 \approx$ **1,150 uploads/sec average (peaking at 3,000 QPS)**.
- **Media Storage Sizing (5 Years)**:
  - Average photo size (compressed web formats: WebP / JPEG at multiple resolutions: thumbnail 150x150, standard 640x640, HD 1080x1080) $\approx$ **300 KB total**.
  - Daily storage = $100\text{M} \times 300\text{ KB} \approx$ **30 Terabytes / day**.
  - 5-Year Media Storage = $30\text{ TB} \times 365 \times 5 \approx$ **55 Petabytes (PB)** on Amazon S3.
- **Feed Read Traffic**:
  - 500M users browse an average of 40 photos daily $\implies$ **20 Billion photo views/day** (peaking at **350,000 read requests/sec**).
  - 98%+ of image requests must be served directly from **CDN Edge Caches**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                          USER                          │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID         │ PRIMARY KEY          │
│ username         │ VARCHAR(30)  │ UNIQUE, NOT NULL     │
│ follower_count   │ INT          │ Celebrity threshold  │
│ profile_pic_url  │ VARCHAR(255) │ S3 / CDN URL         │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                         PHOTO                          │
├──────────────────┬──────────────┬──────────────────────┤
│ photo_id         │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK (Author)   │
│ original_s3_url  │ VARCHAR(255) │ Raw uploaded file    │
│ cdn_hd_url       │ VARCHAR(255) │ 1080x1080 WebP       │
│ cdn_thumb_url    │ VARCHAR(255) │ 150x150 WebP         │
│ caption          │ VARCHAR(2200)│ Text caption         │
│ like_count       │ BIGINT       │ Aggregated Counter   │
│ comment_count    │ BIGINT       │ Aggregated Counter   │
│ created_at       │ TIMESTAMP    │ B+Tree Index         │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                        LIKE_EVENT                      │
├──────────────────┬──────────────┬──────────────────────┤
│ photo_id         │ UUID         │ COMPOSITE PK, FK     │
│ user_id          │ UUID         │ COMPOSITE PK, FK     │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="feed-fanout" title="Instagram Media Processing, Feed Generation & CDN Architecture" />

### Walkthrough of Core Pipelines

#### 1. Photo Upload & Responsive Image Processing
1. User captures a photo. Client requests a pre-signed S3 upload URL $\implies$ `POST /api/v1/photos/upload-url`.
2. Client uploads raw image binary directly to **Raw S3 Bucket**, bypassing API servers.
3. S3 triggers an event to **Apache Kafka**.
4. **Image Processing Worker Pool**:
   - Downloads raw master photo.
   - Strips EXIF metadata (protecting user GPS privacy).
   - Generates responsive WebP derivatives:
     - `thumbnail`: 150x150
     - `medium`: 640x640
     - `hd`: 1080x1080
   - Uploads compressed derivatives to **Public CDN-backed S3 Bucket**.
5. Persists `PHOTO` record to PostgreSQL and notifies the **Feed Fan-Out Service**.

#### 2. Hybrid Feed Generation Pipeline
1. The **Feed Fan-Out Service** checks the author's follower count:
   - **Standard Author ($< 25,000$ followers)**: Pushes `photo_id` into all followers' **Redis Feed Sorted Sets** (`ZADD feed:{follower_id} timestamp photo_id`).
   - **Celebrity Author ($> 25,000$ followers)**: Stored in the author's personal timeline only (fan-out-on-read).
2. When a user opens Instagram $\implies$ `GET /api/v1/feed`:
   - Fetches pre-computed feed from user's Redis ZSET.
   - Merges recent posts from followed celebrities in memory via a Min-Heap.
   - Batch-hydrates photo metadata and author profile info via **Redis Multi-Get (MGET)**.
3. Returns top 20 ranked posts in `< 100ms`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: High-Contention Sharded Like Counters
When a celebrity (e.g. Lionel Messi winning the World Cup) posts a photo, it receives **10 Million likes in 1 hour (over 2,500 likes/sec)**. How do we prevent database row locks on the `PHOTO` table?

- **The Row-Lock Bottleneck**: Executing `UPDATE photo SET like_count = like_count + 1 WHERE photo_id = ?` under 2,500 concurrent transactions causes InnoDB row-lock exhaustion and severe database thrashing.
- **Solution (Distributed Sharded Counters in Redis)**:
  1. For each popular photo, maintain $N$ independent counter keys in Redis (e.g., $N=10$ shards):
     `photo:{id}:likes:0`, `photo:{id}:likes:1`, ..., `photo:{id}:likes:9`.
  2. When a user likes the photo:
     - Select shard randomly: `shard = rand() % 10`.
     - Increment atomically: `INCR photo:{id}:likes:{shard}` (instantaneous in memory).
  3. **Reading Total Likes**: Sum the 10 shards via `MGET photo:{id}:likes:*`.
  4. **Async DB Flush**: A background worker flushes the aggregate sum to PostgreSQL every 30 seconds in a single batch query.

### Deep Dive 2: Ephemeral Stories Architecture (24-Hour TTL)
How do Instagram Stories automatically disappear after exactly 24 hours without running massive, slow deletion sweeps across the database?

- **The Naive Deletion Sweep Hazard**: Running `DELETE FROM stories WHERE created_at < NOW() - INTERVAL '24 HOURS'` every minute causes massive disk write spikes, table locks, and index fragmentation.
- **Production Architecture**:
  1. **Partition by Day (Time-Based Partitioning)**:
     - The `STORIES` table in PostgreSQL / Cassandra is partitioned by day: `stories_2026_09_21`, `stories_2026_09_22`.
     - To expire stories, the database simply drops the entire old partition instantly via `DROP TABLE stories_2026_09_20;` ($O(1)$ zero disk I/O fragmentation).
  2. **In-Memory Redis Story Ring**:
     - Stories are stored in Redis with an exact 24-hour expiration (`EXPIRE story:{id} 86400`).
     - The client app queries the user's active story ring from Redis; once expired, the key evaporates automatically.
  3. **S3 Object Lifecycle Policy**:
     - S3 bucket configured with an automatic lifecycle rule: delete objects with tag `type=story` after 24 hours.

### Deep Dive 3: Client Data Usage & Edge Media Delivery (WebP & AVIF)
Serving 55 Petabytes of images over mobile cellular networks can exhaust user data plans and drain phone batteries.
- **Next-Gen Image Formats**:
  - Convert JPEG $\to$ **WebP / AVIF**.
  - WebP achieves **30% smaller file sizes** than JPEG at identical visual SSIM quality.
  - AVIF achieves **50% smaller file sizes**.
- **Progressive JPEG / Low-Quality Image Placeholders (LQIP)**:
  - Generate a microscopic 10x10 blurred thumbnail (encoded as a tiny 20-byte Base64 string in the feed JSON payload).
  - The client displays the blurred placeholder instantly while the high-resolution image streams in over the CDN.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Feed Architecture** | Pure Fan-out-on-Write | Hybrid Push/Pull Model | **Hybrid Push/Pull**: Pure push breaks under celebrities with 100M+ followers. Hybrid insulates storage from celebrity write storms while keeping 99% of feeds instant. |
| **Like Counter Storage** | Single Relational Column | In-Memory Distributed Sharded Counter | **Distributed Sharded Counters**: Eliminates row-level database lock contention on viral posts while surviving 10K+ likes/sec. |
| **Image Delivery** | Application Server File Proxy | Cloudflare / Fastly Edge CDN directly to S3 | **Edge CDN**: Offloads 98%+ of egress bandwidth from origin infrastructure, delivering sub-100ms image loads worldwide. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands image resizing and multiple resolution generation.
- Designs basic relational schemas for Users, Photos, Follows, and Likes.
- Identifies the role of CDNs in caching static media.
- Proposes basic feed generation using follower relationships.

### Senior (L5 / IC5)
- Solves viral post write-contention using in-memory distributed sharded counters.
- Designs the hybrid push/pull timeline architecture to solve the Celebrity Problem.
- Implements Ephemeral Stories using time-based partition dropping and Redis TTLs.
- Optimizes media delivery using modern image formats (WebP/AVIF) and Low-Quality Image Placeholders (LQIP).

### Staff+ (L6 / Principal)
- Designs an automated copyright, NSFW, and safety content-moderation pipeline operating asynchronously during image ingestion.
- Details multi-region active-active storage replication across continents with read-local S3 edge buckets.
- Architects graceful degradation during CDN outages: Origin shield protection using dynamic request collapsing (single-flight deduplication) to prevent origin meltdown.
