---
id: fb-live-comments
title: Design Facebook's Live Comments System
sidebar_label: 11. FB Live Comments
description: Staff-level system design breakdown for an ultra-high concurrency live stream comment ingestion and broadcast fan-out system.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design Facebook's Live Comments System

A live comments system (e.g., Facebook Live, TikTok Live, Twitch Chat, YouTube Live Stream) enables viewers of a real-time broadcast to post comments and reactions (hearts, emojis) that appear synchronously on the screens of millions of concurrent viewers. The system must ingest high-velocity comment bursts, filter abuse, and broadcast updates to millions of active sockets without UI freezes or socket disconnect storms.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Post Live Comment**: Viewers watching a live video stream can post comments and emoji reactions in real-time.
2. **Stream Live Comments**: Viewers receive a continuous real-time stream of incoming comments associated with the live broadcast.
3. **Celebrity / Mega-Stream Scaling**: Seamlessly handle both small streams (10 viewers, 1 comment/min) and mega-broadcasts (5 Million concurrent viewers, 50,000 comments/sec).
4. **Content Moderation & Spam Filtering**: Real-time profanity and abusive spam filtering before comments are broadcast to viewers.
5. **Replay Persistence**: Comments must be stored with video playback timestamps so that viewers watching the recorded VOD (Video On Demand) see comments synchronized with video timeline.

### Non-Functional Requirements
- **Sub-Second Delivery Latency**: Live comments must appear on viewer screens in `< 500ms` from submission.
- **Client UI Stability & Perceptual Playback**: The human eye cannot process 50,000 comments scrolling down a phone screen per second. The system must deliver a smooth, readable stream (e.g. 10–20 comments/sec max per client).
- **High Ingress Availability**: Read/write paths must not degrade the primary video stream if comment ingestion encounters backpressure.
- **Ordered Playback**: Comments within a broadcast should appear in roughly chronological order.

### Capacity Estimations & Mega-Stream Surge Sizing
- **Mega Broadcast Scale**: A viral celebrity live stream (e.g. World Cup final or global concert) with **5 Million concurrent viewers**.
- **Comment Ingress Surge**: 1% of viewers commenting every second $\implies$ **50,000 comments/sec peak ingress**.
- **Naive Egress Fan-Out (The Catastrophic Math)**:
  - If 50,000 comments/sec are broadcast to 5,000,000 viewers:
    $\text{Egress Messages} = 50,000 \times 5,000,000 = \mathbf{250\text{ Billion messages/sec!}}$
  - Average comment JSON payload $\approx$ 200 bytes.
  - Egress Bandwidth = $250\text{B} \times 200\text{ bytes} \approx$ **50 Terabytes/sec (400 Terabits/sec)**!
  - *Architectural Mandate*: **Broadcasting every comment to every viewer is physically impossible and perceptually useless**. The system must implement **dynamic server-side sampling, priority scoring, and client-side rate throttling**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      LIVE_STREAM                       │
├──────────────────┬──────────────┬──────────────────────┤
│ stream_id        │ UUID         │ PRIMARY KEY          │
│ broadcaster_id   │ UUID         │ INDEX, FK            │
│ status           │ VARCHAR(16)  │ LIVE / ENDED         │
│ viewer_count     │ INT          │ Real-time gauge      │
│ started_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      LIVE_COMMENT                      │
├──────────────────┬──────────────┬──────────────────────┤
│ comment_id       │ UUID         │ PRIMARY KEY          │
│ stream_id        │ UUID         │ PARTITION KEY        │
│ author_id        │ UUID         │ FK                   │
│ text             │ VARCHAR(280) │ UTF-8                │
│ offset_ms        │ BIGINT       │ Milliseconds into vid│
│ score            │ FLOAT        │ ML Quality / Affinity│
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API / WebSocket Protocol Design

#### 1. Ingest Comment (HTTP / WebSocket)
```http
POST /api/v1/streams/{stream_id}/comments
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "text": "Incredible performance! 🔥",
  "client_timestamp_ms": 1774301980120
}
```
**Response (`202 Accepted`)**:
```json
{
  "comment_id": "cmt_99a81-1029",
  "status": "INGESTED"
}
```

#### 2. Live Comment Stream (WebSocket Frame to Client)
```json
{
  "type": "COMMENT_BATCH",
  "stream_id": "str_441029",
  "comments": [
    {
      "comment_id": "cmt_99a81-1029",
      "author": {"name": "Mark Z.", "is_verified": true},
      "text": "Incredible performance! 🔥",
      "offset_ms": 84120
    }
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="realtime-chat" title="Facebook Live Comments Ingestion, Sampling & Broadcast Topology" />

### Walkthrough of the Live Comment Pipeline

#### 1. Ingestion & Moderation
1. Viewer posts a comment. The request hits the **Comment Ingestion Gateway**.
2. Fast in-memory evaluation:
   - **User Rate Limiting**: Redis Token Bucket limits each individual user to 1 comment every 3 seconds.
   - **Automated Moderation**: Fast trie/automaton algorithm checks text against banned profanity keywords in `< 1ms`.
3. Ingested comments are written to an **Apache Kafka Cluster** partitioned by `stream_id`.

#### 2. Dynamic Sampling & Prioritization Engine
1. A **Stream Aggregator Service** consumes comments from the stream's Kafka partition.
2. The Aggregator evaluates current stream velocity:
   - If stream has $< 50$ comments/sec $\implies$ All comments are forwarded.
   - If stream has $50,000$ comments/sec $\implies$ **Sampling Algorithm** is activated:
     - Retains 100% of comments from VIPs, friends of the broadcaster, and verified badges.
     - Uniformly samples the remaining general viewer comments down to a target delivery rate (e.g. 100 comments/second per stream channel).
3. The selected comments are published to **Redis Pub/Sub** or a specialized high-throughput memory broker.

#### 3. Edge WebSocket Fan-Out
1. Hundreds of regional **WebSocket Edge Servers** maintain open connections with millions of viewers.
2. Each WebSocket server subscribes to the Redis Pub/Sub topic for `stream_id`.
3. The WebSocket server receives the sampled comment batch, bundles comments into a single message every 200ms, and pushes the frame down the open sockets to connected viewers.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Surviving 50,000 Comments/sec (The Sampling Engine)
How do we decide which comments to drop when 50,000 comments arrive in a single second?

```
RAW INCOMING STREAM: 50,000 Comments/sec
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│            PRIORITIZED SAMPLING PIPELINE               │
├────────────────────────────────────────────────────────┤
│ 1. Broadcaster & Verified Comments  ➔ 100% Retained   │
│ 2. High Engagement / Pinned Users   ➔ 100% Retained   │
│ 3. Broadcaster's Close Friends      ➔ 100% Retained   │
│ 4. General Audience Comments        ➔ Sampled at 0.2% │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
FILTERED STREAM: 100 Quality Comments/sec
                   │
                   ▼
Client Mobile App batches and animates 10-15 comments/sec smoothly!
```
- **Why this works**: Viewers do not know or care that 49,900 other comments were discarded; they see an active, vibrant, perfectly readable live stream of high-quality interactions.
- **Sender Feedback Guarantee**: To avoid confusing the commenter, the author's own comment is **always rendered locally on their device immediately** (optimistic UI), even if the backend sampling engine drops it from the global broadcast!

### Deep Dive 2: Fan-Out Architecture (Hierarchical Distribution Tree)
How do 5,000,000 connected viewers receive comment frames without overloading the central message broker?

```
Broadcaster / Ingestion Gateway
               │
               ▼
      Apache Kafka Partition (stream_101)
               │
               ▼
     Central Aggregator & Sampling Engine
               │
               ▼
      Redis Pub/Sub / Regional Relays
         ┌─────┴──────────────────┐
         ▼                        ▼
  US-East Gateway           EU-West Gateway
  (50 WS Nodes)             (40 WS Nodes)
         │                        │
         ▼                        ▼
  2.5M US Viewers          2.5M EU Viewers
```
- **Regional Edge Clustering**: WebSocket servers are deployed at edge points of presence (POPs) close to users.
- A single regional relay node consumes from the central broker and broadcasts locally across the edge WebSocket nodes in that datacenter, eliminating cross-continental WAN bandwidth exhaustion.

### Deep Dive 3: Video On Demand (VOD) Replay Synchronization
How do comments synchronize with video playback when someone watches the recorded video 3 days later?
- During live ingestion, every comment is tagged with `offset_ms` (milliseconds elapsed since stream start: `created_at - stream.started_at`).
- All comments (both sampled and unsampled) are saved asynchronously into an **SSTable / Cassandra Database** keyed by:
  - **Partition Key**: `stream_id`
  - **Clustering Key**: `offset_ms ASC`
- When a VOD user watches the replay, the video player pre-fetches comments in 30-second blocks using range queries:
  `SELECT * FROM live_comments WHERE stream_id = ? AND offset_ms >= ? AND offset_ms < ?`.
- The video player displays comments precisely when the video timeline reaches that millisecond offset.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Egress Delivery** | Broadcast 100% of comments | Dynamic Sampling & Prioritization | **Dynamic Sampling**: Pure broadcast requires 400 Tbps of network egress, melting servers and causing mobile apps to freeze. Sampling preserves readability and infrastructure sanity. |
| **Connection Protocol** | Short HTTP Polling (every 1s) | Persistent WebSockets / HTTP/2 SSE | **WebSockets / SSE**: HTTP polling creates massive connection establishment overhead. Persistent sockets reduce header overhead by 95% and deliver sub-500ms latency. |
| **Data Persistence** | Synchronous Relational DB Write | Kafka $\to$ Stream Sampler $\to$ Cassandra | **Kafka + Cassandra**: Relational databases collapse under 50K QPS write contention on a single stream row. Cassandra handles high-throughput append-only time series writes easily. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the role of WebSockets in bidirectional live streaming.
- Understands why traditional HTTP polling fails under live broadcast scale.
- Designs schemas for Streams and Comments with timestamp offsets.
- Proposes basic rate limiting on client comment submissions.

### Senior (L5 / IC5)
- Performs the math revealing why 100% comment fan-out is physically impossible at scale (250B messages/sec).
- Implements dynamic server-side sampling prioritizing VIPs, friends, and high-quality comments.
- Uses optimistic UI rendering so the author always sees their own comment immediately.
- Designs the VOD replay synchronization pipeline using Cassandra clustering keys on `offset_ms`.

### Staff+ (L6 / Principal)
- Designs the hierarchical regional distribution tree to prevent cross-datacenter WAN saturation.
- Addresses mobile client performance: Explains memory leaks, thread pool contention, and DOM rendering thrashing when animating comments on low-end mobile devices.
- Outlines automated real-time anti-toxicity ML inference at 50,000 QPS using quantized on-edge models.
