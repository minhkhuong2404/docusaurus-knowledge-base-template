---
id: spotify
title: "Design a Music Streaming Platform Like Spotify"
sidebar_label: "36. Spotify (Audio Streaming)"
description: "Staff-level breakdown of audio streaming, Ogg Vorbis/AAC chunked playback, hybrid CDN caching, collaborative real-time playlists, and music recommendation vectors."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Music Streaming Platform Like Spotify

Spotify delivers high-fidelity audio streaming to over 600 million monthly active users across a catalog of 100+ million songs. Unlike video streaming (where chunk sizes are large and video starts within 1–2 seconds), audio streaming demands **near-instantaneous playback startup ($< 200\text{ms}$)**, low bandwidth consumption, seamless offline synchronization, and real-time collaborative playlists.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Audio Streaming**: Stream music with instant playback start and seamless quality switching (96 kbps, 160 kbps, 320 kbps in Ogg Vorbis / AAC).
2. **Catalog Search & Discovery**: Search by track, artist, album, or podcast in $< 50\text{ms}$.
3. **Collaborative Playlists**: Multiple users can edit, add, delete, and re-order songs in a playlist concurrently with real-time updates.
4. **Offline Listening**: Premium users can download encrypted tracks to local device storage with a 30-day license check.
5. **Personalized Recommendations**: Daily Mixes, Discover Weekly, and real-time radio streams generated via vector embeddings.

### Non-Functional Requirements
- **Sub-200ms Playback Startup**: Clicking "Play" must begin sound output within 200ms.
- **Zero Audio Glitches / Jitter**: Audio buffer underrun rate $< 0.05\%$ of streams.
- **High Concurrency & Scale**: 600M Monthly Active Users (MAU), 100M+ songs.
- **Storage Durability**: 100% durability for artist catalogs and audio masters.

### Capacity Estimations & Sizing (5 Years)
- **Active User Base**: 600 Million MAU, 200 Million Daily Active Users (DAU).
- **Concurrent Active Streams**: Peak 20 Million simultaneous audio listeners.
- **Audio Catalog Sizing**:
  - 100 Million tracks.
  - Average song length: 3.5 minutes (210 seconds).
  - Bitrates: Standard (96 kbps $\approx 2.5\text{ MB}$), High (160 kbps $\approx 4.2\text{ MB}$), Very High (320 kbps Ogg Vorbis $\approx 8.4\text{ MB}$).
  - Storage per track across 3 tiers: $\sim 15\text{ MB}$.
  - Catalog Storage: $100\text{M tracks} \times 15\text{ MB} = \mathbf{1.5\text{ Petabytes}}$ (excluding raw lossless master backups $\approx 5\text{ PB}$).
- **Peak Streaming Bandwidth**:
  - $20\text{ Million concurrent streams} \times 160\text{ kbps average} = \mathbf{3.2\text{ Terabits per second (Tbps)}} = \mathbf{400\text{ Gigabytes/sec}}$.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                         TRACK                          │
├──────────────────┬──────────────┬──────────────────────┤
│ track_id         │ UUID         │ PRIMARY KEY          │
│ isrc_code        │ VARCHAR(32)  │ Global Industry ID   │
│ title            │ VARCHAR(256) │ Song Name            │
│ artist_id        │ UUID         │ Primary Artist       │
│ duration_ms      │ INT          │ Milliseconds         │
│ audio_hash       │ CHAR(64)     │ SHA-256 Audio ID     │
│ explicit         │ BOOLEAN      │ Parental Advisory    │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     AUDIO_FILE                         │
├──────────────────┬──────────────┬──────────────────────┤
│ file_id          │ UUID         │ PRIMARY KEY          │
│ track_id         │ UUID         │ FOREIGN KEY          │
│ format           │ ENUM         │ OGG_VORBIS, AAC, FLAC│
│ bitrate_kbps     │ INT          │ 96, 160, 320         │
│ s3_uri           │ VARCHAR(512) │ Object Storage Path  │
│ encryption_key_id│ UUID         │ AES-128 Key ID       │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   PLAYLIST_ENTRY                       │
├──────────────────┬──────────────┬──────────────────────┤
│ playlist_id      │ UUID         │ Composite PK         │
│ track_id         │ UUID         │ Track Reference      │
│ added_by_user_id │ UUID         │ Creator of Entry     │
│ fractional_pos   │ DOUBLE       │ Fractional Index     │
│ added_at         │ TIMESTAMP    │ Sort Timestamp       │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Request Audio Stream Chunk
```http
GET /api/v1/storage/tracks/{track_id}/stream
Range: bytes=0-163839  // Fetch first 160 KB (first 8-10 seconds)
Authorization: Bearer <user_session_token>
```
**Response (`206 Partial Content`)**:
```http
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-163839/4404019
Content-Type: audio/ogg
Cache-Control: public, max-age=31536000, immutable
X-Encryption-IV: 8f4a9b...

<binary audio bytes>
```

#### 2. Re-Order Song in Collaborative Playlist
```http
PATCH /api/v1/playlists/{playlist_id}/tracks/{track_id}/position
Content-Type: application/json
If-Match: "rev_4210"

{
  "prev_fractional_pos": 2.0,
  "next_fractional_pos": 3.0
}
```
**Response (`200 OK`)**:
```json
{
  "playlist_id": "7b8e...",
  "track_id": "9a12...",
  "new_fractional_pos": 2.5,
  "revision": "rev_4211"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="video-pipeline" title="Spotify Audio Ingestion, Chunk Streaming & Collaborative Playlist Architecture" />

### Walkthrough of Core Flows

#### 1. Audio Ingestion & Transcoding
1. Record labels upload lossless FLAC audio masters to Spotify's Ingestion Gateway via SFTP/S3.
2. The ingestion worker parses audio metadata, calculates acoustic loudness (LUFS normalization to $-14\text{ LUFS}$), and computes the **Audio Fingerprint** (AcoustID) for deduplication.
3. Transcoding workers convert the master into **Ogg Vorbis** (desktop/Android) and **AAC** (iOS/Web) across 96 kbps, 160 kbps, and 320 kbps.
4. Each file is encrypted using **AES-128 CTR mode** and stored in Amazon S3 / Google Cloud Storage, with metadata indexed in PostgreSQL / Cassandra.

#### 2. The Playback Start Flow (Sub-200ms)
1. When a user clicks a song, the client checks its local persistent disk cache:
   - **Local Cache Hit (30–40% of plays)**: Plays immediately from disk ($< 10\text{ms}$).
   - **Local Cache Miss**: Client sends an HTTP range request `Range: bytes=0-163839` to the nearest Cloudflare/Fastly CDN edge.
2. The CDN returns the first **160 KB chunk** (representing the first 8–10 seconds of the song).
3. The client player initializes the audio decoder with the Ogg Vorbis header and begins sound output within **150ms**.
4. While the first 10 seconds play, the background worker progressively streams the remainder of the file in larger 512 KB chunks over an HTTP/2 or HTTP/3 multiplexed connection.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: How Spotify Achieves Sub-200ms Latency
Why does Spotify feel instantaneous while YouTube takes 1–2 seconds to start?

```
┌────────────────────────────────────────────────────────┐
│            SUB-200MS AUDIO STARTUP PIPELINE            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1. Predictive Pre-Buffering                           │
│     When Track N plays, client pre-fetches the first   │
│     160 KB of Track N+1 in the background.             │
│                                                        │
│  2. Local Disk Cache (LRU on Device)                   │
│     Frequently played tracks (liked songs, playlists)  │
│     are stored encrypted in local flash storage.       │
│                                                        │
│  3. Ogg Vorbis Stream Header Separation                │
│     Codec initialization headers (Ogg Page 0) are     │
│     embedded in the first 4 KB, allowing audio hardware│
│     DAC to initialize before the full file loads.      │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **Range Request Chunking**: Fetching the entire 5 MB file blocks playback until the whole download finishes. By splitting the request into an urgent initial 160 KB chunk followed by larger background chunks, the network download completes well ahead of real-time playback speed ($160\text{ kbps} = 20\text{ KB/sec}$).
- **HTTP/3 Connection Multiplexing**: Eliminates TCP head-of-line blocking and saves 1 RTT during connection handshakes.

### Deep Dive 2: Collaborative Real-Time Playlists: Fractional Indexing
When multiple friends edit a shared playlist simultaneously, how do we support moving song $X$ between song $Y$ and song $Z$ without re-indexing all entries?

```
Traditional Array Problem:
[Song A (Index 0), Song B (Index 1), Song C (Index 2), Song D (Index 3)]
Inserting between B and C requires shifting C and D (O(N) database write cascade).
Concurrent inserts cause identical collision indexes!

Fractional Indexing Solution:
[Song A (Pos: 1.0), Song B (Pos: 2.0), Song C (Pos: 3.0)]
Insert between B (2.0) and C (3.0):
New Pos = (2.0 + 3.0) / 2 = 2.5
✓ Exactly ONE row updated in the database.
✓ Commutative and conflict-free for concurrent operations.
```
- **Precision Exhaustion (Rebalancing)**: Over time, repeated insertions between adjacent items produce tiny fractional deltas ($2.000000000000001$). When floating-point precision drops below $10^{-9}$, a background worker executes a rebalancing transaction, resetting positions to clean integers ($1.0, 2.0, 3.0$).

### Deep Dive 3: Offline Sync Licensing & DRM
How does Spotify prevent users from extracting raw MP3s or keeping songs forever after cancelling Premium?
- **Symmetric Key Wrapping**: Audio files on device storage are encrypted with unique AES-128 keys.
- **Client Key Store**: The AES-128 decryption key is never stored in plaintext on disk; it is requested from Spotify's KMS and held only in volatile device RAM or the OS Secure Enclave / KeyStore.
- **30-Day Lease Token**: When downloading for offline listening, the server issues a signed cryptographic lease token expiring in 30 days. The mobile app must connect to the Internet at least once every 30 days to renew the lease; if not renewed, the local decryption keys are purged from the device.

### Deep Dive 4: Music Recommendation Engine (Two-Tower Model + Annoy Index)
How does Spotify generate personalized recommendations from 100M songs in $< 50\text{ms}$?

```
User Context (History, Time, Likes) ──► [User Neural Tower] ──► 128-D Vector U
                                                                        │ Dot
Candidate Song (Audio, Genre, BPM)  ──► [Item Neural Tower] ──► 128-D Vector I │ Product
                                                                        ▼
                                                         Cosine Similarity Score
```
1. **Offline Training**: Two-Tower deep neural networks project users and songs into a shared 128-dimensional latent embedding space.
2. **Approximate Nearest Neighbor (ANN)**: Spotify developed and open-sourced **Annoy (Approximate Nearest Neighbors Oh Yeah)**, which creates a forest of random projection trees in memory.
3. **Real-Time Serving**: When a user opens Spotify, their user vector is queried against the in-memory Annoy index. Annoy traverses the binary trees to retrieve the top 100 candidate tracks in **$< 10\text{ms}$**, which are then ranked by a final multi-task scoring model.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Audio Format** | MP3 (Legacy standard) | Ogg Vorbis / AAC | **Ogg Vorbis / AAC**: Superior acoustic compression efficiency; 160 kbps Ogg sounds identical to 320 kbps MP3, saving 50% CDN egress bandwidth. |
| **Playlist Ordering** | Integer Array Indices ($0, 1, 2$) | Fractional Indexing ($1.0, 1.5, 2.0$) | **Fractional Indexing**: Enables concurrent insertion and reordering without updating millions of sibling rows. |
| **Streaming Protocol** | Stateful WebSockets / RTMP | Chunked HTTP/2 Range Requests | **HTTP/2 Range Requests**: Highly cacheable at standard CDN edge caches; avoids maintaining expensive stateful streaming servers. |
| **Recommendation Search** | Exact Cosine Matrix Multiplication | Approximate Nearest Neighbors (Annoy) | **Annoy (ANN)**: Trades 1% precision for a $1,000\text{x}$ speedup, serving recommendations in $< 10\text{ms}$. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Clarifies functional requirements, understanding the difference between audio streaming and progressive downloading.
- Designs basic relational schemas for users, tracks, albums, and playlists.
- Explains why audio files are cached on client devices and CDN edges.

### Senior (L5 / IC5)
- Explains the sub-200ms playback startup optimization (first 160 KB chunk range request).
- Analyzes collaborative playlist concurrency using fractional indexing to eliminate write cascades.
- Designs offline playback security with AES-128 encryption and 30-day lease token expirations.
- Details the acoustic normalization and transcoding pipeline.

### Staff+ (L6 / Principal)
- Evaluates peer-to-peer (P2P) vs pure CDN economics for audio delivery.
- Formulates Approximate Nearest Neighbor (ANN) vector search topologies using Annoy/HNSW for real-time recommendations.
- Analyzes audio streaming over lossy cellular networks using HTTP/3 QUIC connection migration (switching from Wi-Fi to 5G without stream interruption).
- Designs global multi-region active-active playlist synchronization with CRDT conflict resolution.
