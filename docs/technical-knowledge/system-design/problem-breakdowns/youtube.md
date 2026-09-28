---
id: youtube
title: Design a Global Video Streaming Platform Like YouTube
sidebar_label: 10. YouTube (Video Streaming)
description: Staff-level system design breakdown for a large-scale video hosting and adaptive bitrate streaming platform like YouTube or Netflix.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Global Video Streaming Platform Like YouTube

A global video streaming platform (e.g., YouTube, Netflix, TikTok) allows creators to upload videos and enables billions of viewers worldwide to stream them smoothly across varied network connections and devices. The platform requires high-throughput video ingestion, distributed transcoding pipelines, adaptive bitrate streaming (HLS/DASH), and geo-distributed CDN caching.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Resumable Video Upload**: Creators can upload video files (up to 128 GB) reliably over unstable network connections.
2. **Video Transcoding & Processing**: Convert uploaded videos into multiple resolutions (4K, 1080p, 720p, 480p, 360p) and modern codecs (H.264/AVC, VP9, AV1).
3. **Adaptive Bitrate Streaming**: Smooth playback dynamically switching resolutions according to the viewer's real-time bandwidth (Apple HLS / MPEG-DASH).
4. **Video Metadata & Search**: Users can view video titles, descriptions, view counts, like/subscribe counters, and search videos by keywords.
5. **View Counting & Analytics**: Accurately track video views with deduplication to prevent view-count fraud.

### Non-Functional Requirements
- **High Video Availability**: `99.99%` availability for video streaming.
- **Low Playback Start Latency**: Video playback must begin in `< 1.5 seconds` (P95).
- **Smooth Playback**: Zero buffering or stuttering during active video playback.
- **Scalability & Cost Optimization**: Billions of hours of video stored cheaply using tiered cloud storage and edge caching.

### Capacity Estimations & Sizing (Global Scale)
- **Daily Active Users (DAU)**: 1 Billion viewers.
- **New Videos Uploaded**: 500 hours of video uploaded every minute.
  - $500\text{ hours/min} \times 60\text{ mins} = \mathbf{30,000\text{ hours of video uploaded/hour}}$ (720,000 hours/day).
- **Daily Storage Ingress (Raw Video)**:
  - 1 hour of raw 1080p video $\approx$ 3 GB (high bitrate master).
  - Daily raw ingress = $720,000 \times 3\text{ GB} \approx$ **2.16 Petabytes (PB) per day**.
- **Post-Transcoding Storage**:
  - Transcoding into multiple resolutions (4K, 1080p, 720p, 480p, 360p) with modern compression produces ~1.5 GB total per hour across all formats.
  - Daily transcoded storage = $720,000 \times 1.5\text{ GB} \approx$ **1.08 PB / day** $\implies$ **~2 Exabytes over 5 years**.
- **Streaming Egress Bandwidth**:
  - 1 Billion viewers watch an average of 30 minutes daily.
  - Average bitrate across mobile and desktop $\approx$ 2.5 Mbps (0.3125 MB/s).
  - Peak Concurrent Viewers = 100 Million streaming simultaneously.
  - Peak Egress Bandwidth = $100\text{M} \times 2.5\text{ Mbps} =$ **250 Terabits/sec (Tbps)**.
  - *Architectural Mandate*: **99%+ of streaming traffic must be served by Content Delivery Networks (CDNs) and ISP edge caches (Google Global Cache - GGC)**; origin servers would instantly melt under 250 Tbps.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                         VIDEO                          │
├──────────────────┬──────────────┬──────────────────────┤
│ video_id         │ VARCHAR(16)  │ PRIMARY KEY (Base64) │
│ creator_id       │ UUID         │ INDEX, FK            │
│ title            │ VARCHAR(255) │ NOT NULL             │
│ description      │ TEXT         │ Full-Text Index      │
│ duration_seconds │ INT          │ NOT NULL             │
│ status           │ VARCHAR(32)  │ UPLOADING/PROCESSING/│
│                  │              │ READY / FAILED       │
│ master_s3_path   │ VARCHAR(255) │ Raw uploaded file    │
│ manifest_url     │ VARCHAR(255) │ HLS .m3u8 playlist   │
│ thumbnail_url    │ VARCHAR(255) │ CDN Image URL        │
│ view_count       │ BIGINT       │ Aggregated View Count│
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     VIDEO_STREAM                       │
├──────────────────┬──────────────┬──────────────────────┤
│ stream_id        │ UUID         │ PRIMARY KEY          │
│ video_id         │ VARCHAR(16)  │ INDEX, FK            │
│ resolution       │ VARCHAR(16)  │ 1080p, 720p, 480p    │
│ codec            │ VARCHAR(16)  │ H.264, VP9, AV1      │
│ bitrate_kbps     │ INT          │ e.g. 4500            │
│ segment_duration │ INT          │ e.g. 5 seconds       │
│ manifest_path    │ VARCHAR(255) │ Resolution sub-index │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Initiate Resumable Upload
```http
POST /api/v1/videos/upload/initiate
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "title": "Staff Engineer System Design Masterclass",
  "file_size": 4294967296, // 4 GB
  "mime_type": "video/mp4"
}
```
**Response (`200 OK`)**:
```json
{
  "video_id": "v_88192a01",
  "upload_id": "s3_upload_sess_991203",
  "chunk_size_bytes": 10485760, // 10 MB per chunk
  "upload_urls": [
    "https://storage.youtube.com/raw/v_88192a01/part1?signature=...",
    "https://storage.youtube.com/raw/v_88192a01/part2?signature=..."
  ]
}
```

#### 2. Get Video Playback Manifest (HLS / DASH)
```http
GET /api/v1/videos/{video_id}/playback.m3u8
```
**Response (`200 OK`)**:
```http
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080,CODECS="avc1.64002a,mp4a.40.2"
1080p/manifest.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"
720p/manifest.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480,CODECS="avc1.4d401e,mp4a.40.2"
480p/manifest.m3u8
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="video-pipeline" title="YouTube Video Ingestion, Transcoding DAG & CDN Delivery Architecture" />

### Core Data & Video Processing Pipelines

#### 1. Resumable Upload Path
1. The creator initiates an upload session $\implies$ The API returns pre-signed S3 upload URLs for 10 MB parts.
2. The client chunks the video locally and uploads parts in parallel directly to **Raw Video Object Storage (S3)**, completely bypassing application servers.
3. Once all parts are uploaded, the client calls `POST /upload/complete`. S3 assembles the parts and fires an `S3ObjectCreated` notification to **Apache Kafka**.

#### 2. Distributed Transcoding DAG (Directed Acyclic Graph)
1. A **Transcoding Orchestrator** reads the event from Kafka and generates a processing DAG:
   - **Step 1: Audio Extraction & Normalization**: Strips audio track and generates stereo/surround streams.
   - **Step 2: Video Chunking**: Splits video into 5-second GOP (Group of Pictures) segment chunks.
   - **Step 3: Parallel Transcoding Workers**: Encodes chunks into 4K, 1080p, 720p, 480p, 360p across AVC/VP9/AV1 codecs concurrently on GPU clusters.
   - **Step 4: Thumbnail Generation**: Extracts keyframes and creates preview sprites.
   - **Step 5: Manifest Generation**: Compiles master `.m3u8` (HLS) and `.mpd` (DASH) playlist files.
2. Transcoded segments and playlists are persisted to the **Public Transcoded Storage (S3)**.
3. Video status in the database is updated to `READY`.

#### 3. Playback & CDN Streaming Path
1. The user presses play. The video player fetches the master manifest `playback.m3u8` from the **CDN edge**.
2. The video player inspects current network speed and screen size, selecting the 1080p stream.
3. The player begins downloading consecutive **5-second video chunks** (`segment_001.ts`, `segment_002.ts`) via standard HTTP GET requests from the CDN.
4. If network bandwidth degrades (e.g. user enters a tunnel), the player detects buffer depletion and seamlessly requests the next segment from the **480p stream** with **zero interruption in playback**.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Adaptive Bitrate Streaming (HLS vs DASH Mechanics)
How does YouTube seamlessly transition from 1080p to 480p without stopping the video?

```
Master Playlist (playback.m3u8)
├── 1080p/manifest.m3u8 ➔ segment_001.ts (5s) | segment_002.ts (5s) | ...
├── 720p/manifest.m3u8  ➔ segment_001.ts (5s) | segment_002.ts (5s) | ...
└── 480p/manifest.m3u8  ➔ segment_001.ts (5s) | segment_002.ts (5s) | ...

Client Video Player Playback Loop:
- Measures download time of segment_001.ts (e.g. 5s chunk downloaded in 1s ➔ 5x realtime ➔ High Bandwidth).
- Requests segment_002.ts in 1080p.
- Sudden network drop! segment_003.ts takes 4.5s to download ➔ Buffer running low!
- Video player dynamically switches: Requests segment_004.ts from 480p playlist.
- Result: Visual resolution adjusts slightly, but playback NEVER halts!
```
- **HLS (HTTP Live Streaming)**: Standardized by Apple; uses `.m3u8` manifests and `.ts` / fragmented `.mp4` chunks. Ubiquitous across iOS, Android, and browsers.
- **MPEG-DASH**: International open standard; uses XML-based `.mpd` manifests.

### Deep Dive 2: CDN Edge Caching & Long-Tail Storage Sizing
99% of global video bandwidth must be absorbed by CDNs. But how do we avoid bankrupting storage costs on video that only gets 2 views?
- **The 80/20 (and 95/5) Rule in Video**:
  - The top **5% of popular/trending videos** account for **90%+ of all playback bandwidth**.
  - The remaining 95% of videos represent the "long tail" (rarely watched home videos).
- **Tiered CDN Architecture**:
  1. **Edge POPs (Edge Caches & ISP GGC)**: Cache only the master manifests and chunks for trending/viral videos (LRU eviction).
  2. **Regional Origin Shield**: Aggregates cache misses before hitting primary storage.
  3. **Tiered Cold Storage**: Videos with zero views in 6 months have their high-bitrate raw master files moved to **S3 Glacier / Coldline Storage**, retaining only low-bitrate compressed formats on active storage.

### Deep Dive 3: Real-Time View Count Aggregation & Anti-Fraud
Why can't we just run `UPDATE videos SET view_count = view_count + 1 WHERE video_id = ?`?
- **Row-Lock Contention**: For a viral video with 100,000 views per second, locking the row in MySQL or PostgreSQL causes immediate database deadlock and CPU collapse.
- **View Fraud**: Malicious bots refreshing a page or looping a 1-second view should not count as valid views.
- **Production Solution (Kafka + Flink Streaming Pipeline)**:
  1. Client sends a view beacon only after watching at least **30 seconds** of continuous video.
  2. The beacon publishes an event to **Apache Kafka**: `{video_id, user_id, ip_address, watch_duration, timestamp}`.
  3. **Apache Flink Stream Processor**:
     - Deduplicates views from the same IP/user within a sliding 24-hour window using a stateful RocksDB backend.
     - Aggregates valid views into 1-minute tumbling windows.
  4. Flushes aggregated batch increments to Redis and Cassandra in a single bulk write:
     `UPDATE videos SET view_count = view_count + 1420 WHERE video_id = ?`.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Video Delivery Protocol** | Custom RTMP / WebRTC | HTTP-Based Adaptive Streaming (HLS/DASH) | **HLS/DASH**: Leverages existing standard HTTP infrastructure and internet CDNs. Bypasses corporate firewalls and runs on any standard HTTP web server without stateful socket overhead. |
| **Transcoding Architecture** | Monolithic Single-Worker Transcode | Distributed DAG Chunk-Level Transcoding | **Chunk-Level DAG**: Monolithic transcoding of a 2-hour 4K movie takes 3 hours. Splitting into 5-second chunks allows 500 GPU workers to transcode in parallel, finishing in under 3 minutes. |
| **Upload Path** | Upload through Application Server | Direct-to-S3 Pre-Signed Multipart Upload | **Direct-to-S3**: Prevents Petabytes of heavy video traffic from saturating API gateway memory and bandwidth. S3 automatically scales to massive parallel chunk uploads. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the role of CDNs in offloading video streaming traffic.
- Understands the need for video compression and multiple resolutions.
- Designs schemas for Videos, Users, and Metadata.
- Proposes asynchronous transcoding using message queues.

### Senior (L5 / IC5)
- Details Adaptive Bitrate Streaming (HLS/DASH) mechanics and manifest structures (`.m3u8`).
- Explains the Distributed Chunk-Level Transcoding DAG pipeline.
- Solves viral view counting using Kafka streaming and sliding-window deduplication (Flink).
- Designs direct-to-S3 multipart upload with pre-signed URLs to protect backend servers.

### Staff+ (L6 / Principal)
- Evaluates video codec trade-offs: Compression efficiency vs licensing fees vs client decoding hardware (AVC vs HEVC vs VP9 vs AV1 royalty-free).
- Designs custom ISP edge caching infrastructure (e.g. Google Global Cache / Netflix Open Connect appliances placed directly inside ISP datacenters).
- Architects copyright and safety content scanning pipelines (audio fingerprinting via Content ID and neural network frame classification) operating concurrently during the transcoding DAG.
