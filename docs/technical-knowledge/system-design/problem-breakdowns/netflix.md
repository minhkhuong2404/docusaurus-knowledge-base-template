---
id: netflix
title: "Design a Video Streaming Platform Like Netflix"
sidebar_label: "35. Netflix (Video Streaming)"
description: "Staff-level architecture for global adaptive bitrate video streaming, Open Connect Appliance (OCA) CDN edge caching, multi-DRM licensing, and per-title video encoding pipelines."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Video Streaming Platform Like Netflix

Netflix streams millions of hours of ultra-high-definition video content daily to over 250 million global subscribers across thousands of device types (Smart TVs, mobile phones, game consoles, browsers). Netflix operates a distinct **two-tier architecture**: the **Control Plane** (user authentication, recommendations, billing, and metadata running in AWS) and the **Data Plane** (video storage, caching, and streaming executed directly by Netflix’s custom global CDN called **Open Connect**).

---

## 1. Understanding the Problem

### Functional Requirements
1. **Adaptive Bitrate Streaming (ABR)**: Stream video dynamically across fluctuating network bandwidths without buffering stalls.
2. **Per-Title Video Encoding Ladder**: Ingest raw source mezzanine video files and transcode them into multiple resolutions, codecs, and bitrates.
3. **Multi-Device Playback State (Resume/Bookmark)**: Synchronize playback timestamp every 5–10 seconds so users can resume seamlessly across devices.
4. **Content Protection (Multi-DRM)**: Protect copyrighted assets against piracy via hardware-backed DRM licensing.
5. **Search & Recommendations**: Provide personalized discovery feeds and fast catalog search.

### Non-Functional Requirements
- **Instant Video Playback**: Video startup latency $< 1.5\text{ seconds}$ (P95).
- **Zero Buffering Guarantee**: Playback rebuffer ratio $< 0.1\%$ of total streaming sessions.
- **Global High Availability**: $99.999\%$ streaming availability, resilient to single-datacenter or Tier-1 transit fiber cuts.
- **Massive Bandwidth Throughput**: Sustain peak global streaming traffic exceeding **100 Terabits per second (Tbps)**.

### Capacity Estimations & Sizing (5 Years)
- **Subscribers**: 250 Million global subscribers.
- **Active Daily Streaming**: 100 Million daily streaming hours.
- **Average Bitrate**: $3.5\text{ Mbps}$ (weighted mix of 1080p, 4K HDR, and mobile 720p).
- **Peak Bandwidth Calculation**:
  $$\text{Peak Egress} = 25\text{M concurrent streams} \times 4.0\text{ Mbps} = \mathbf{100\text{ Terabits/sec (Tbps)}} = \mathbf{12.5\text{ Terabytes/sec}}$$
- **Storage Projections**:
  - Netflix catalog: $\sim 15,000$ titles.
  - Average movie length: 100 minutes.
  - Per-title encoding ladder: 120 different representations (resolutions: 480p to 4K; codecs: AVC/H.264, HEVC/H.265, AV1, VP9; audio: stereo, 5.1 surround, Dolby Atmos, 30+ language dubs).
  - Storage per title: $\sim 2.5\text{ TB}$ across all encoded assets.
  - Catalog Storage: $15,000 \times 2.5\text{ TB} \approx \mathbf{37.5\text{ Petabytes}}$.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      VIDEO_MASTER                      │
├──────────────────┬──────────────┬──────────────────────┤
│ video_id         │ UUID         │ PRIMARY KEY          │
│ title            │ VARCHAR(256) │ Content Title        │
│ duration_seconds │ INT          │ Exact runtime        │
│ rating           │ VARCHAR(10)  │ PG-13, TV-MA, etc.   │
│ s3_source_uri    │ VARCHAR(512) │ Raw Mezzanine file   │
│ status           │ ENUM         │ INGESTING, READY     │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      VIDEO_ENCODING                    │
├──────────────────┬──────────────┬──────────────────────┤
│ encoding_id      │ UUID         │ PRIMARY KEY          │
│ video_id         │ UUID         │ FOREIGN KEY          │
│ codec            │ ENUM         │ H264, HEVC, AV1      │
│ resolution       │ VARCHAR(16)  │ 1080p, 4K, 720p      │
│ bitrate_kbps     │ INT          │ Target Bitrate       │
│ manifest_url     │ VARCHAR(512) │ MPD / M3U8 URI       │
│ drm_key_id       │ UUID         │ KMS Key Identifier   │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     PLAYBACK_STATE                     │
├──────────────────┬──────────────┬──────────────────────┤
│ session_id       │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ Account Profile ID   │
│ video_id         │ UUID         │ Current Title        │
│ bookmark_sec     │ INT          │ Last watched second  │
│ device_type      │ VARCHAR(64)  │ SmartTV, iOS, Chrome │
│ updated_at       │ TIMESTAMP    │ Periodic Heartbeat   │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Fetch Playback Manifest (DASH / HLS)
```http
POST /api/v1/playback/manifest
Content-Type: application/json
Authorization: Bearer <user_jwt_token>

{
  "video_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "client_capabilities": {
    "supported_codecs": ["av01", "hvc1", "avc1"],
    "max_resolution": "3840x2160",
    "hdr_format": "DolbyVision",
    "drm_system": "com.apple.fps" // FairPlay
  }
}
```
**Response (`200 OK`)**:
```json
{
  "manifest_url": "https://oca-lax1.netflix.com/manifests/9b1deb4d.mpd",
  "recommended_oca_nodes": [
    "https://oca-lax1-01.isp-comcast.net/video/",
    "https://oca-lax1-02.isp-comcast.net/video/"
  ],
  "drm_license_server": "https://license.netflix.com/v2/fairplay",
  "bookmark_seconds": 1420
}
```

#### 2. Playback State Heartbeat (Bookmark)
```http
POST /api/v1/playback/heartbeat
Content-Type: application/json

{
  "session_id": "7a3e201b-...",
  "video_id": "9b1deb4d-...",
  "current_timestamp_seconds": 1450,
  "buffered_seconds": 45.2,
  "dropped_frames": 0,
  "current_bitrate_kbps": 5400
}
```
**Response (`204 No Content`)**

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="video-pipeline" title="Netflix Global Video Ingestion, Encoding Ladder & Open Connect CDN Delivery" />

### Walkthrough of Core Flows

#### 1. The Video Ingestion & Encoding Pipeline
1. Production studios upload high-resolution **ProRes mezzanine files** (often 500 GB+ per feature film) directly to an Amazon S3 staging bucket.
2. The upload event triggers an **Asynchronous Transcoding DAG** orchestrated by Netflix Maestro/Titus.
3. The video is chopped into small chunk shots. Each shot is evaluated using **Per-Title & Per-Shot Optimization** to calculate the optimal bitrate needed to hit a target **VMAF (Video Multi-Method Assessment Fusion)** quality score of 95.
4. Chunks are transcoded concurrently across thousands of AWS EC2 / GPU instances into AV1, HEVC, and H.264 formats, segmented into 2-second to 4-second **CMAF (Common Media Application Format)** chunks, and packaged with DRM encryption.
5. The master MPD (DASH) and M3U8 (HLS) manifest files are published to S3.

#### 2. Open Connect Appliance (OCA) Caching & Proactive Pushing
1. Netflix does not stream video from AWS; AWS egress bandwidth would cost billions of dollars.
2. Instead, Netflix embeds custom hardware servers called **Open Connect Appliances (OCAs)** directly inside the datacenters of thousands of Internet Service Providers (ISPs) worldwide (Comcast, AT&T, Deutsche Telekom, Telstra).
3. **Proactive Off-Peak Pre-warming**: Every night during ISP off-peak hours (2:00 AM – 5:00 AM), Netflix machine learning models predict what subscribers in that specific city or ISP will watch tomorrow. The master control plane pushes those popular video files to the local OCAs ahead of time.
4. When a user in Los Angeles clicks "Play", the video streams directly from an OCA located within their own local ISP network, traversing zero transit backbone hops!

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Open Connect Appliances (OCA) CDN Architecture
How do OCAs deliver 100+ Gbps per 2U server?

```
┌────────────────────────────────────────────────────────┐
│               OPEN CONNECT APPLIANCE (OCA)             │
├────────────────────────────────────────────────────────┤
│  Hardware: 2U Server with 36 NVMe/SATA SSDs (300TB+)   │
│  OS: FreeBSD with kTLS (Kernel TLS) + sendfile()       │
│                                                        │
│  User GET Request ──► NGINX ──► sendfile() Syscall     │
│                                       │                │
│  SSD Storage ──► Zero-Copy DMA ───────┴──► 100 Gbps NIC│
│                  (Zero User-Space CPU Copies)          │
└────────────────────────────────────────────────────────┘
```
- **Zero-Copy Streaming with kTLS**: Traditional web servers decrypt TLS in user-space, copying video bytes between kernel buffers, application buffers, and network buffers. Netflix engineered **kTLS (Kernel TLS)** in FreeBSD. The `sendfile()` system call streams encrypted video chunks directly from the NVMe disk controller into the Network Interface Card (NIC) via DMA without passing through user-space CPU memory, allowing a single server to saturate **100 Gbps to 200 Gbps network interfaces at $< 15\%$ CPU usage**.
- **BGP Anycast Routing**: Directs client DNS queries to the topologically closest OCA based on BGP AS-path routing.

### Deep Dive 2: Per-Title & Per-Shot Encoding (VMAF Optimization)
Why is fixed-bitrate encoding (e.g. 5 Mbps for 1080p) considered an architectural anti-pattern?
- A simple cartoon (e.g. *BoJack Horseman*) has flat colors and low motion; encoding it at 5 Mbps wastes 70% of bandwidth without improving visual quality. A high-action scene in *Stranger Things* requires 7 Mbps to avoid macroblocking.
- **VMAF (Video Multi-Method Assessment Fusion)**: An open-source machine learning perceptual quality metric developed by Netflix that scores video from 0 to 100 based on human visual perception.
- **Dynamic Optimization**: The encoding pipeline compresses video to the lowest possible bitrate that achieves a VMAF score $\ge 95$, cutting total global CDN bandwidth by **20–30%** without perceptible quality loss.

### Deep Dive 3: Adaptive Bitrate (ABR) Algorithms: Throughput vs Buffer-Based
How does the client player dynamically select which bitrate chunk to download next?

1. **Throughput-Based ABR (Legacy)**:
   - Measures the download time of the last chunk: $\text{Bandwidth} = \text{Chunk Size} / \text{Download Time}$.
   - **Flaw**: Network spikes or TCP slow-start cause rapid oscillations between 1080p and 480p ("rate hunting").
2. **Buffer-Based Adaptation (BBA - Netflix Architecture)**:
   - Ignores instantaneous network throughput estimates.
   - Monitors only the **client playback buffer occupancy** (e.g., in seconds of video loaded in RAM):
     - If Buffer $< 5\text{ seconds}$ (reservoir zone): Download lowest bitrate to prevent buffer underrun/stalling.
     - If Buffer is between $5\text{s}$ and $30\text{s}$ (cushion zone): Bitrate is a smooth function of buffer depth.
     - If Buffer $> 30\text{ seconds}$ (upper reservoir): Safely step up to maximum 4K HDR bitrate.
   - **Outcome**: Eliminates 90% of rebuffering events and prevents jarring visual quality oscillations.

### Deep Dive 4: Multi-DRM Licensing Handshake
How is content protected across diverse operating systems?

```
Browser / Device              License Server (AWS)           Open Connect OCA
      │                                │                            │
      │ 1. Request Manifest            │                            │
      ├────────────────────────────────────────────────────────────►│
      │ 2. Return Encrypted MPD        │                            │
      │◄────────────────────────────────────────────────────────────┤
      │                                │                            │
      │ 3. Fetch Init Segment (PSSH)   │                            │
      ├────────────────────────────────────────────────────────────►│
      │ 4. Extract Key ID & Challenge  │                            │
      │                                │                            │
      │ 5. POST /license (Client Cert) │                            │
      ├───────────────────────────────►│                            │
      │ 6. Verify Subscription & Token │                            │
      │ 7. Return Encrypted CEK Key    │                            │
      │◄───────────────────────────────┤                            │
      │                                │                            │
      │ 8. Stream Encrypted Chunks     │                            │
      ├────────────────────────────────────────────────────────────►│
      │ 9. Decrypt inside Hardware Enc │                            │
```
- **The Fragmentation Problem**: Apple devices require **FairPlay** (HLS); Android/Chrome require **Google Widevine** (DASH); Windows/Xbox require **Microsoft PlayReady**.
- **Common Encryption (CENC - ISO/IEC 23001-7)**: Video files are encoded once with standard AES-128 counter mode (CTR) encryption. The file contains a Protection System Specific Header (PSSH) supporting all three DRM systems simultaneously, allowing the same encrypted byte chunks to be served to all platforms!

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **CDN Architecture** | Commercial Cloud CDN (Cloudflare/Akamai) | Proprietary In-ISP CDN (Open Connect) | **Open Connect**: Bypasses billions in public cloud transit fees; placing hardware directly in ISP datacenters guarantees single-digit millisecond latency. |
| **Media Chunking** | Monolithic File Streaming | Small 2–4s Chunks (DASH/CMAF) | **CMAF Chunks**: Enables instantaneous dynamic bitrate switching and fast client buffer filling. |
| **Encoding Strategy** | Static Bitrate Ladder | Per-Title / Per-Shot VMAF Encoding | **Per-Title VMAF**: Saves up to 30% global CDN bandwidth while maintaining perceptual visual quality. |
| **Streaming Protocol** | Real-Time WebRTC | HTTP-based Chunk Streaming (DASH/HLS) | **HTTP DASH/HLS**: Works cleanly over standard HTTP caching proxies, firewalls, and ISP transparent caches without maintaining stateful UDP servers. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Clarifies functional requirements, understanding the difference between video ingestion and streaming playback.
- Explains adaptive bitrate streaming (ABR) and how manifest files (HLS/DASH) coordinate chunk selection.
- Designs basic relational schemas for users, titles, and playback bookmarks.

### Senior (L5 / IC5)
- Details the architectural split between the AWS Control Plane and the Open Connect Data Plane.
- Explains the video transcoding pipeline DAG and per-title encoding optimization using VMAF.
- Analyzes buffer-based adaptation (BBA) vs throughput-based rate control.
- Formulates multi-DRM architectures using Common Encryption (CENC).

### Staff+ (L6 / Principal)
- Evaluates kernel-level streaming throughput mechanics (FreeBSD kTLS, zero-copy `sendfile()`, DMA).
- Designs proactive off-peak CDN cache pre-warming algorithms based on predictive subscriber modeling.
- Analyzes ISP peering topologies (Private Network Interconnects - PNIs vs Internet Exchange Points - IXPs).
- Formulates multi-region active-active control plane failover strategies with sub-second bookmark state synchronization.
