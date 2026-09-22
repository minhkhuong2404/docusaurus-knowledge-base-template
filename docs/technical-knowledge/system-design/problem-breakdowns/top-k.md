---
id: top-k
title: Design a Real-Time Top K Heavy Hitters System Like YouTube
sidebar_label: 12. YouTube Top K (Heavy Hitters)
description: Staff-level system design breakdown for a real-time streaming Top K heavy hitters system using Count-Min Sketch and distributed stream processing.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Real-Time Top K Heavy Hitters System Like YouTube

A Top K Heavy Hitters system (e.g., YouTube Trending Videos, Twitter/X Trending Hashtags, Spotify Top 50, Google Trending Searches) identifies the most frequent $K$ elements in an unbounded, massive stream of real-time events over a sliding time window (e.g., "Top 100 most watched videos in the last 1 hour").

---

## 1. Understanding the Problem

### Functional Requirements
1. **Real-Time Top K Queries**: Return the top $K$ (e.g. $K=100$) most viewed videos over a configurable sliding time window (e.g., past 1 hour, past 24 hours).
2. **Category & Geo Filtering**: Query Top K globally or filtered by geographic country (e.g., Top 50 in Japan) and category (Gaming, Music, Tech).
3. **Continuous Streaming Updates**: The Top K rankings must refresh continuously (every 10–30 seconds) as new view events stream in.
4. **Data Ingestion**: Ingest high-volume view telemetry pings without dropping events or slowing down video playback.

### Non-Functional Requirements
- **High Ingestion Throughput**: Process up to **1 Million events per second** at peak.
- **Low Query Latency**: Returning the current Top K list must take `< 10ms` (served from memory).
- **Bounded Memory Footprint**: Ingesting billions of events must not exhaust cluster memory; algorithm must run in sub-linear space $O(K)$.
- **Controlled Error Bound (Approximation)**: For big data streaming, exact counts are computationally prohibitive. An approximation error $\epsilon \le 0.1\%$ is acceptable as long as heavy hitters are reliably surfaced.

### Capacity Estimations & Sizing
- **Event Volume**: 10 Billion view events per day.
- **Average Ingestion QPS**: $10\text{B} / 86,400 \approx$ **115,000 events/sec** (peaking at **1,000,000 events/sec** during global live events).
- **Unique Videos Active Daily**: 100 Million distinct video IDs.
- **The Memory Impossibility of Exact Hash Maps**:
  - Tracking 100M videos in a single in-memory hash map with timestamps over a sliding 24-hour window requires **hundreds of gigabytes of RAM** and suffers from severe single-node CPU bottleneck and garbage collection pauses.
  - Requires **Two-Stage Distributed Stream Processing (MapReduce / Apache Flink)** and **Probabilistic Data Structures (Count-Min Sketch + Min-Heap)**.

---

## 2. The Set Up

### Defining the Core Data Structures & Schemas

```
┌────────────────────────────────────────────────────────┐
│                      VIEW_EVENT                        │
├──────────────────┬──────────────┬──────────────────────┤
│ event_id         │ UUID         │ PRIMARY KEY          │
│ video_id         │ VARCHAR(16)  │ PARTITION KEY        │
│ country_code     │ CHAR(2)      │ ISO 3166             │
│ category_id      │ INT          │ Category             │
│ timestamp        │ TIMESTAMP    │ Event Time           │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   TOP_K_RANKING_SNAPSHOT               │
├──────────────────┬──────────────┬──────────────────────┤
│ window_start     │ TIMESTAMP    │ COMPOSITE PK         │
│ dimension        │ VARCHAR(64)  │ "GLOBAL", "JP_MUSIC" │
│ rank_position    │ INT          │ 1 to K               │
│ video_id         │ VARCHAR(16)  │ NOT NULL             │
│ estimated_views  │ BIGINT       │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Ingest View Event (Async Beacon)
```http
POST /api/v1/telemetry/view
Content-Type: application/json

{
  "video_id": "dQw4w9WgXcQ",
  "country_code": "US",
  "category_id": 10,
  "timestamp": 1774301980000
}
```

#### 2. Query Current Top K Videos
```http
GET /api/v1/trending?k=100&timeframe=1h&country=US&category=music
```
**Response (`200 OK`)**:
```json
{
  "timeframe": "1h",
  "country": "US",
  "category": "music",
  "last_updated": "2026-09-22T22:30:00Z",
  "top_k": [
    {"rank": 1, "video_id": "dQw4w9WgXcQ", "estimated_views": 1420500},
    {"rank": 2, "video_id": "9bZkp7q19f0", "estimated_views": 982100}
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="stream-analytics" title="YouTube Top K Real-Time Streaming & Aggregation Topology" />

### Walkthrough of the Two-Stage Stream Processing Pipeline

#### Stage 1: Partitioned Local Aggregation (Map Phase)
1. Ingestion gateways publish raw view events into **Apache Kafka** partitioned by `hash(video_id) % num_partitions`.
2. A cluster of **Stream Processing Workers (Apache Flink / Spark Streaming)** consumes from Kafka.
3. Each worker maintains an in-memory **Count-Min Sketch** and a local **Min-Heap of size K**:
   - For every event, the worker increments the frequency in the Count-Min Sketch.
   - If the new estimated count exceeds the smallest element in the local Min-Heap, the Min-Heap is updated.
4. Every **1 minute** (tumbling window), each worker outputs its local Top K candidates (e.g. top 100 videos) to an intermediate Kafka topic: `local-top-k`.

#### Stage 2: Central Global Reduction (Reduce Phase)
1. A single **Global Aggregator Service** consumes the small, consolidated local Top K lists from all workers.
2. It merges the candidate lists into a global **Min-Heap of size K**.
3. Writes the verified Top K rankings into **Redis Sorted Sets (ZSET)**:
   - Key: `topk:1h:GLOBAL`
   - Score: `estimated_views`
   - Member: `video_id`
4. When a user requests trending videos via `GET /trending`, the API Gateway reads directly from Redis in `< 2ms` via `ZREVRANGEBYSCORE topk:1h:GLOBAL +inf -inf LIMIT 0 100`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Algorithmic Foundations (Exact vs Count-Min Sketch + Min-Heap)
How does a Count-Min Sketch track frequencies of 100 Million videos in only 2 MB of RAM?

```
Count-Min Sketch: 2D Array of integers (d rows, w columns).
Uses d independent hash functions: h1, h2, ..., hd.

When video "V101" arrives:
  Row 1: index = h1("V101") % w ➔ array[1][index]++
  Row 2: index = h2("V101") % w ➔ array[2][index]++
  Row 3: index = h3("V101") % w ➔ array[3][index]++

Query Frequency of "V101":
  Frequency = min(array[1][h1("V101")], array[2][h2("V101")], array[3][h3("V101")])
```
- **Why minimum?** Due to hash collisions, counters can only **over-estimate** frequency, never under-estimate. Taking the minimum across independent rows minimizes the collision error.
- **Space Complexity**: With $w = 2,000$ and $d = 5$, the 2D array requires only **$2,000 \times 5 \times 4\text{ bytes} \approx \mathbf{40\text{ KB of RAM}}$** per worker while guaranteeing an error bound $\epsilon \le 0.1\%$ with $99.9\%$ confidence!

### Deep Dive 2: Sliding Window Aggregation Mechanics
How do we calculate Top K over a **rolling 1-hour window** that slides every **1 minute**?
- **The Problem**: A raw 1-hour window doesn't naturally forget events that occurred 61 minutes ago without re-evaluating the full raw log.
- **Solution (1-Minute Bucket Aggregation)**:
  1. Divide the 1-hour window into **60 discrete 1-minute tumbling buckets**.
  2. Each 1-minute bucket stores its own frequency counts (or Count-Min Sketch snapshot).
  3. The current 1-hour window is simply the sum of the last 60 1-minute buckets:
     $W_{\text{1 hour}} = \sum_{i=0}^{59} B_{t - i}$.
  4. When minute 61 arrives, we simply **drop bucket $B_{t - 60}$** and add the new bucket $B_{t+1}$ in $O(1)$ time!

```
[Bucket 00] [Bucket 01] ... [Bucket 58] [Bucket 59] ➔ Sum = 1-Hour Window
     ▲                                       ▲
  Oldest                                  Newest
(Dropped next min)                    (Added this min)
```

### Deep Dive 3: Out-of-Order Events & Network Latency (Watermarking)
What happens if mobile devices on slow 3G networks upload view events with a 5-minute network delay?
- If we process events strictly by arrival time (wall-clock time), delayed events will artificially inflate the current minute's bucket.
- **Event-Time vs Processing-Time**:
  - We aggregate using **Event Time** (the timestamp recorded when the user actually watched the video).
  - **Flink Watermarks**: We define a bounded out-of-orderness watermark (e.g. 2 minutes).
  - Events arriving up to 2 minutes late are incorporated into their correct historical 1-minute bucket. Events arriving later than 2 minutes are redirected to a side-output dead-letter queue to preserve real-time streaming pipeline throughput.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Accuracy Strategy** | Exact Counting (Global Hash Map) | Approximate Counting (Count-Min Sketch) | **Count-Min Sketch**: Exact counting requires hundreds of GBs of RAM and chokes on garbage collection. Count-Min Sketch uses `< 1 MB` RAM with 99.9% heavy hitter accuracy. |
| **Aggregation Topology** | Single Central Aggregator Node | Two-Stage (Local Flink $\to$ Global Reducer) | **Two-Stage**: Single node collapses at 1M events/sec. Partitioned local aggregation reduces event volume by 99% before hitting the global reducer. |
| **Serving Layer** | Query DB on every user click | Pre-computed Redis Sorted Set (ZSET) | **Redis ZSET**: Serves Top K queries in `< 2ms` directly from RAM. Eliminates database CPU thrashing during viral trending events. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands that real-time heavy hitter counting cannot be done with simple SQL `GROUP BY video_id ORDER BY COUNT(*) DESC`.
- Designs basic two-stage MapReduce aggregation.
- Uses Redis Sorted Sets for caching the top K list.
- Explains basic event batching.

### Senior (L5 / IC5)
- Details the **Count-Min Sketch** probabilistic data structure and its mathematical error guarantees ($w = e/\epsilon, d = \ln(1/\delta)$).
- Implements sliding window aggregation using discrete 1-minute tumbling bucket ring buffers.
- Combines Count-Min Sketch with a Min-Heap of size K to track top candidates in $O(1)$ time.
- Handles out-of-order events using Apache Flink watermarking.

### Staff+ (L6 / Principal)
- Evaluates alternative heavy hitter streaming algorithms (Space-Saving algorithm, Lossy Counting, Misra-Gries).
- Designs multi-dimensional dimensional rollup (Top K by Country, Top K by Category, Top K by Demographics) without duplicating raw event streams.
- Solves anti-gaming and bot view manipulation: Integrating real-time anomaly detection into the Flink pipeline to disqualify bot-farm coordinated click bursts before they pollute trending charts.
