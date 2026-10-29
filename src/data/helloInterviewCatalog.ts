// AUTO-GENERATED COMPLETE HELLOINTERVIEW SPECIFICATION CATALOG (ALL 100 SCENARIOS)
// Inspired by HelloInterview Problem Breakdowns (hellointerview.com)
// Every scenario includes authentic In-Scope FRs, Out-of-Scope boundaries, capacity math,
// API contracts with JSON samples, Core Entities, Write vs Read Data Flow Paths,
// and Classic Interviewer Traps with Staff/Principal Rebuttals.

import { HelloInterviewSpec } from './helloInterviewSpecEngine';

export const HELLO_INTERVIEW_CATALOG: Record<string, HelloInterviewSpec> = {
  "bitly_url_shortener": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Collision-Free URL Shortening (Base62 Encoding)",
        "detail": "Encode long URLs into compact 7-character Base62 alphanumeric aliases supporting up to 3.52 trillion unique combinations."
      },
      {
        "id": "FR2",
        "title": "Sub-10ms High-Throughput Redirection (301 vs 302)",
        "detail": "Redirect incoming short URLs to destination targets with <10ms latency using Edge CDN and Redis caching, supporting 100:1 read/write ratios."
      },
      {
        "id": "FR3",
        "title": "Distributed Pre-Allocated Unique ID Generation (KGS / Snowflake)",
        "detail": "Pre-allocate monotonically increasing 64-bit integer ID ranges in memory to prevent database auto-increment lock contention."
      }
    ],
    "outOfScope": [
      "Deep real-time clickstream analytics and geographic user demographic dashboards",
      "Custom vanity alias bidding and domain registration marketplace",
      "Real-time phishing, malware, and malicious link URL scanning (handled out-of-band)"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Read QPS • 40 Write QPS Peak • 100M URLs/Mo • 10B Redirects/Mo",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/shorten",
        "purpose": "Generate compact 7-character Base62 alias from destination URL",
        "requestSample": "{ \"longUrl\": \"https://example.com/system-design/deep-dive\", \"customAlias\": null }",
        "responseSample": "{ \"shortCode\": \"xyz789\", \"shortUrl\": \"https://bit.ly/xyz789\", \"expiresAt\": \"2030-01-01T00:00:00Z\" }"
      },
      {
        "method": "GET",
        "endpoint": "/:shortCode",
        "purpose": "Resolve short alias to long URL and return HTTP 301/302 redirect",
        "responseSample": "HTTP 302 Found (Location: https://example.com/system-design/deep-dive)"
      }
    ],
    "coreEntities": [
      {
        "name": "UrlMapping",
        "attributes": "short_code (PK VARCHAR(7)), destination_url (VARCHAR(2048)), user_id (UUID), created_at (TIMESTAMP), expires_at (TIMESTAMP)",
        "description": "Primary short URL index mapping short alphanumeric code to destination target."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Bitly / High-Throughput URL Shortener)",
        "steps": [
          "1. Client (User Browser / Mobile App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Cloudflare Anycast Edge CDN) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (URL Shortener Service) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Distributed NoSQL DB (DynamoDB / Cassandra)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Bitly / High-Throughput URL Shortener)",
        "steps": [
          "1. Client (User Browser / Mobile App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Cloudflare Anycast Edge CDN) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (URL Shortener Service) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Distributed NoSQL DB (DynamoDB / Cassandra)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The 301 vs 302 Redirect Trap: 'Should we return HTTP 301 or HTTP 302?'",
        "juniorAnswer": "Use HTTP 301 because it is permanently cached by browsers and reduces server load.",
        "staffRebuttal": "HTTP 301 is permanently cached by client browsers, meaning subsequent visits bypass your servers entirely, destroying click analytics. Staff engineers use HTTP 302 Found for monetized/tracked URLs so all visits pass through the gateway, or 301 with edge worker telemetry."
      },
      {
        "trapTitle": "The MD5 / Hash Prefix Collision Trap: 'Why not take MD5(longUrl) and take the first 7 characters?'",
        "juniorAnswer": "Compute MD5 or SHA-256 of the long URL and truncate to the first 7 characters.",
        "staffRebuttal": "Truncating a 128-bit hash to 7 characters guarantees hash collisions at scale due to the Birthday Paradox. Detecting collisions requires slow database checks and appending salts. Staff engineers pre-generate unique 64-bit integer IDs via distributed Snowflake/KGS and encode directly with Base62 (zero collisions, O(1) determinism)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Read QPS • 40 Write QPS, 100M URLs/Mo • 10B Redirects/Mo)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "netflix_streaming": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Direct-to-S3 Resumable Multipart Video Upload",
        "detail": "Content creators can upload high-resolution video files (up to several GBs) reliably with chunked resumable upload directly to Object Storage, completely bypassing backend application servers."
      },
      {
        "id": "FR2",
        "title": "Global Low-Latency Adaptive Bitrate Streaming (ABR)",
        "detail": "Viewers across the globe can stream video smoothly with <200ms time-to-first-frame and zero re-buffering across diverse devices (1080p, 720p, 480p, 360p) via HLS/DASH."
      },
      {
        "id": "FR3",
        "title": "Asynchronous DAG Chunk Transcoding & Manifest Assembly",
        "detail": "The system splits raw videos into 10-second GOP-aligned segments and transcodes them in parallel across worker fleets, generating the master .m3u8 playlist and marking catalog status READY."
      }
    ],
    "outOfScope": [
      "Real-time personalized video recommendations and collaborative filtering ranking models",
      "User comments, discussion threads, nested replies, and live comment moderation",
      "Real-time live streaming broadcasts (WebRTC / RTMP ingestion)",
      "Digital Rights Management (DRM) licensing exchanges and automated copyright fingerprinting (Content ID)"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1M Concurrent Streams • 11.6k Streams/s Peak • 500M Viewers • 10M Uploads/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/videos/upload-session",
        "purpose": "Creator requests upload slot; API Gateway authenticates and issues S3 presigned multipart URLs",
        "requestSample": "{ \"title\": \"Staff System Design\", \"fileSizeBytes\": 2147483648, \"mimeType\": \"video/mp4\" }",
        "responseSample": "{ \"videoId\": \"vid_9a8b7c\", \"uploadSessionId\": \"sess_123\", \"partSizeBytes\": 10485760, \"presignedUrls\": [\"https://s3.us-east-1.amazonaws.com/raw/part1?...\"] }"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/videos/:videoId/master.m3u8",
        "purpose": "Viewer player retrieves HLS master playlist with variant bitrate stream definitions",
        "responseSample": "#EXTM3U\\n#EXT-X-STREAM-INF:BANDWIDTH=4500000,RESOLUTION=1920x1080\\n1080p/playlist.m3u8\\n#EXT-X-STREAM-INF:BANDWIDTH=2200000,RESOLUTION=1280x720\\n720p/playlist.m3u8"
      }
    ],
    "coreEntities": [
      {
        "name": "VideoMetadata",
        "attributes": "id (PK UUID), creator_id, title, status (UPLOADING|PROCESSING|READY|FAILED), duration_sec, raw_s3_uri, hls_manifest_uri, created_at",
        "description": "Primary relational catalog entity tracking video state and storage endpoints."
      },
      {
        "name": "TranscodingJob",
        "attributes": "job_id (PK), video_id (FK), resolution (1080p|720p|480p), segment_index, status, worker_id, attempts",
        "description": "Tracks state of individual chunk tasks in the distributed FFmpeg DAG worker fleet."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design YouTube & Netflix / Video Ingestion & Streaming Platform)",
        "steps": [
          "1. Client (Creator Upload Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway & Auth Service) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Transcoding Task Queue (Kafka / SQS)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Viewer Video Player (Adaptive Bitrate)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design YouTube & Netflix / Video Ingestion & Streaming Platform)",
        "steps": [
          "1. Client (Creator Upload Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway & Auth Service) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Transcoding Task Queue (Kafka / SQS)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Viewer Video Player (Adaptive Bitrate)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The API Server Upload Trap: 'Why not stream the video directly through your application servers to S3?'",
        "juniorAnswer": "The client sends a standard multipart/form-data POST request to our Spring Boot or Node.js web server, which buffers it and uploads it to S3.",
        "staffRebuttal": "Multi-gigabyte video files will exhaust application server heap memory, saturate network NICs, and tie up worker threads for minutes, causing cascading HTTP 504 gateway timeouts. The Staff solution is Presigned S3 Multipart URLs: clients upload raw bytes directly to Object Storage, while application servers only handle tiny JSON metadata payloads."
      },
      {
        "trapTitle": "The Monolithic Transcoder Trap: 'How do you transcode a 2-hour 4K video without making the creator wait for hours?'",
        "juniorAnswer": "Spin up a massive 128-core EC2 instance and run `ffmpeg -i input.mp4 output.mp4` on the full file.",
        "staffRebuttal": "Monolithic transcoding takes hours and fails completely if the machine crashes at 99%. A Staff engineer builds a chunked DAG pipeline: split the raw master into 5-10 second GOP-aligned segments, dispatch parallel transcoding tasks across 100+ spot worker nodes via Kafka/SQS, and reassemble the playlist. A 2-hour video finishes in ~3 minutes."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1M Concurrent Streams • 11.6k Streams/s, 500M Viewers • 10M Uploads/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "twitter_news_feed": {
    "inScope": [
      {
        "id": "FR1",
        "title": "High-Throughput Tweet Publication & Ingestion",
        "detail": "Accept incoming tweets (6,000 writes/sec avg, 25,000 peak) with Snowflake ID generation and asynchronous fan-out processing."
      },
      {
        "id": "FR2",
        "title": "Sub-50ms Home Newsfeed Serving via In-Memory Timelines",
        "detail": "Deliver personalized reverse-chronological feeds to 300M DAU with <50ms P99 latency by pre-computing timelines in Redis lists."
      },
      {
        "id": "FR3",
        "title": "Hybrid Fan-Out on Write vs Fan-Out on Read (Celebrity Fallback)",
        "detail": "Push tweets to follower Redis timelines for normal users, but pull tweets at read time for celebrity accounts (>100k followers) to prevent write fan-out explosion."
      }
    ],
    "outOfScope": [
      "Algorithmic machine-learning ranking and engagement scoring models ('For You' tab)",
      "Direct Messaging (DM) end-to-end encrypted chat",
      "Real-time ad auction bidding and sponsored tweet placement"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "6,000 Tweet QPS • 600,000 Timeline Read QPS Peak • 300M DAU • 500M Tweets/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/tweets",
        "purpose": "User posts a new tweet with optional media attachments",
        "requestSample": "{ \"userId\": \"usr_101\", \"text\": \"Excited to share our new system design course!\", \"mediaIds\": [\"med_1\"] }",
        "responseSample": "{ \"tweetId\": \"twt_5001\", \"status\": \"PUBLISHED\", \"createdAt\": \"2026-10-29T00:00:00Z\" }"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/timeline/home",
        "purpose": "Retrieve user home newsfeed ordered reverse-chronologically",
        "responseSample": "{ \"timeline\": [{ \"tweetId\": \"twt_5001\", \"authorId\": \"usr_101\", \"text\": \"...\", \"likeCount\": 420 }], \"nextCursor\": \"cur_987\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "Tweet",
        "attributes": "tweet_id (PK 64-bit Snowflake ID), author_id (UUID), text (VARCHAR(280)), media_uris (JSON), created_at (TIMESTAMP)",
        "description": "Immutable tweet record stored in primary distributed KV store."
      },
      {
        "name": "TimelineCache",
        "attributes": "user_id (PK), tweet_ids (LIST of 64-bit IDs in Redis, capped at 800 items)",
        "description": "Pre-computed in-memory feed materialized per active follower."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Twitter / X Scalable Newsfeed)",
        "steps": [
          "1. Client (Twitter Web / Mobile Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway & Auth Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Fan-Out Message Bus (Kafka / Pulsar)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Home Timeline Aggregator) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Twitter / X Scalable Newsfeed)",
        "steps": [
          "1. Client (Twitter Web / Mobile Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway & Auth Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Fan-Out Message Bus (Kafka / Pulsar)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Home Timeline Aggregator) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Celebrity Fan-out Explosion Trap: 'What happens when Elon Musk (150M followers) posts a tweet?'",
        "juniorAnswer": "Iterate through all 150 million followers and push the tweet ID into 150 million Redis lists.",
        "staffRebuttal": "Writing to 150 million Redis keys takes minutes, exhausts network buffers, and starves other background jobs. The Staff solution is a Hybrid Fan-Out Architecture: normal users use Fan-Out on Write (push to followers). Celebrities (>100k followers) do NOT fan out; instead, when a user opens their feed, the system pulls recent tweets from celebrities they follow and merges them in RAM with their pre-computed Redis timeline (Fan-Out on Read)."
      },
      {
        "trapTitle": "The Inactive User Memory Bloat Trap: 'Do we store Redis timeline lists for all 1 billion registered accounts?'",
        "juniorAnswer": "Yes, maintain a Redis list for every registered user in the database.",
        "staffRebuttal": "Maintaining 1 billion Redis lists requires hundreds of terabytes of expensive RAM for users who haven't logged in for years. Staff engineers apply an LRU TTL on timeline caches (e.g. 7 days). If an inactive user logs in after 6 months, their timeline is hydrated on-demand (lazy load) by querying the social graph and fetching tweets from followed accounts."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (6,000 Tweet QPS • 600,000 Timeline Read QPS, 300M DAU • 500M Tweets/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "dropbox_file_sync": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Block-Level Delta Synchronization (4MB Chunking)",
        "detail": "Split large files into 4MB chunks using Rabin fingerprinting / Content-Defined Chunking, synchronizing only modified delta blocks to save 90%+ upload bandwidth."
      },
      {
        "id": "FR2",
        "title": "Content-Addressable Storage (CAS) Deduplication",
        "detail": "Identify chunks by their SHA-256 hash so identical blocks across users and folders are stored only once in cloud Object Storage."
      },
      {
        "id": "FR3",
        "title": "Cross-Device Version Vector Conflict Resolution",
        "detail": "Track concurrent multi-device modifications using Lamport timestamps / Version Vectors, automatically creating conflict copies when concurrent offline edits collide."
      }
    ],
    "outOfScope": [
      "In-browser collaborative rich-text editing (Google Docs style)",
      "Fine-grained enterprise directory permission ACLs",
      "Optical Character Recognition (OCR) full-text document indexing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Sync QPS • 50 PB Storage Peak • 700M Users • 100M Sync Events/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/files/upload-session",
        "purpose": "Client initiates block sync session submitting SHA-256 hashes of changed chunks",
        "requestSample": "{ \"filePath\": \"/work/notes.txt\", \"chunkHashes\": [\"sha256_chunk1\", \"sha256_chunk2\"] }",
        "responseSample": "{ \"sessionId\": \"sync_123\", \"missingChunkHashes\": [\"sha256_chunk2\"] }"
      },
      {
        "method": "PUT",
        "endpoint": "/api/v1/chunks/:chunkHash",
        "purpose": "Upload missing binary delta block directly to Content-Addressable Storage",
        "responseSample": "{ \"status\": \"STORED\", \"chunkHash\": \"sha256_chunk2\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "FileMetadata",
        "attributes": "file_id (PK UUID), user_id, path, version_vector, is_deleted, updated_at",
        "description": "Hierarchical filesystem metadata and multi-device version vector."
      },
      {
        "name": "ChunkIndex",
        "attributes": "chunk_hash (PK SHA-256), size_bytes, storage_s3_uri, reference_count",
        "description": "Content-Addressable Storage deduplication registry."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Dropbox / Cloud File Synchronization)",
        "steps": [
          "1. Client (Desktop Sync Daemon) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Sync API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Block Storage Engine (S3 / CAS)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Secondary Synced Device) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Dropbox / Cloud File Synchronization)",
        "steps": [
          "1. Client (Desktop Sync Daemon) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Sync API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Block Storage Engine (S3 / CAS)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Secondary Synced Device) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Whole File Re-upload Trap: 'A user modifies 1 sentence in a 2GB PDF. Do you upload the 2GB file?'",
        "juniorAnswer": "Upload the modified 2GB PDF file back to S3 and replace the previous version.",
        "staffRebuttal": "Re-uploading 2GB for a 10-byte change wastes user mobile data and server bandwidth. Staff engineers use Content-Defined Chunking (CDC) via Rabin Fingerprinting: only the single 4MB block containing the edited sentence has a changed hash. The desktop daemon uploads only that single 4MB chunk, reducing network transit by 99.8%."
      },
      {
        "trapTitle": "The Offline Conflict Race Condition: 'User edits the same file on phone and laptop offline simultaneously.'",
        "juniorAnswer": "Last Write Wins (LWW): whichever device reconnects last overwrites the file.",
        "staffRebuttal": "Last Write Wins silently deletes user data without consent. Staff engineers maintain Version Vectors on every device: when the second device connects, the server detects that the vector is concurrent (not causally dependent). The server saves the second edit as 'Filename (Conflicted Copy from MacBook)', preserving both edits."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Sync QPS • 50 PB Storage, 700M Users • 100M Sync Events/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "typeahead_search_autocomplete": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-10ms Prefix Autocomplete Querying",
        "detail": "Deliver top 5 relevant search suggestions as user types each keystroke with P99 latency under 10ms."
      },
      {
        "id": "FR2",
        "title": "Pre-Computed Top-K Trie In-Memory Traversal",
        "detail": "Serve prefix matches from RAM using an in-memory Trie where each prefix node caches top 5 ranked completions."
      },
      {
        "id": "FR3",
        "title": "Asynchronous Query Frequency Aggregation",
        "detail": "Collect query telemetry into Kafka and recalculate popularity ranks in batch without degrading live query latency."
      }
    ],
    "outOfScope": [
      "Personalized user search history blending",
      "Real-time spelling error fuzzy auto-correction",
      "Sponsored ad ranking and real-time ad keyword auction"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Keystroke QPS • P99 < 10ms Peak • 5B Searches/Day • 50,000 QPS",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/api/v1/search/autocomplete?q=sys",
        "purpose": "Return top 5 query suggestions for typed prefix",
        "responseSample": "{ \"prefix\": \"sys\", \"suggestions\": [\"system design\", \"system design interview\", \"system preferences\", \"system 32\", \"system update\"] }"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/search/telemetry",
        "purpose": "Client logs confirmed search query for offline popularity weighting",
        "requestSample": "{ \"query\": \"system design interview\", \"selectedRank\": 2, \"timestamp\": 1729000000 }",
        "responseSample": "HTTP 202 Accepted"
      }
    ],
    "coreEntities": [
      {
        "name": "TrieNode",
        "attributes": "char, is_end_of_word, children_map, top_k_suggestions (ARRAY of string[5])",
        "description": "Serialized in-memory prefix node optimized for zero-traversal lookup."
      },
      {
        "name": "SearchQueryFrequency",
        "attributes": "query_string (PK), frequency_count, window_start, trending_score",
        "description": "Aggregated query frequency in Spark / ClickHouse."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Search Autocomplete / Typeahead)",
        "steps": [
          "1. Client (Search Box Input Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Cloudflare Edge CDN) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (In-Memory Trie Cluster (RAM)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Trie Snapshot Storage (S3 / Redis)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Search Autocomplete / Typeahead)",
        "steps": [
          "1. Client (Search Box Input Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Cloudflare Edge CDN) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (In-Memory Trie Cluster (RAM)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Trie Snapshot Storage (S3 / Redis)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The SQL LIKE Query Trap: 'Can we query SELECT query FROM searches WHERE query LIKE sys% in SQL?'",
        "juniorAnswer": "Run a SQL query with `WHERE query LIKE 'prefix%' ORDER BY count DESC LIMIT 5`.",
        "staffRebuttal": "Running LIKE prefix queries on 5 billion daily searches at 50,000 QPS will destroy relational database disks and CPU. Staff engineers use an in-memory Trie data structure with pre-computed top 5 queries stored on each node, achieving O(1) response times in <2ms."
      },
      {
        "trapTitle": "The Live Trie Mutation Lock Contention: 'Can we update the Trie in memory on every user search query?'",
        "juniorAnswer": "Increment the query count directly in the in-memory Trie on every incoming search.",
        "staffRebuttal": "Mutating the Trie in real time requires write locks that block 50,000 concurrent reader threads. Staff engineers decouple write collection: stream queries to Kafka, calculate frequency weights in offline Spark batch jobs, and deploy read-only Trie snapshots atomically using double-buffering pointer swaps."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Keystroke QPS • P99 < 10ms, 5B Searches/Day • 50,000 QPS)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "ad_click_aggregator": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Click Beacon Ingestion & Verification",
        "detail": "Ingest 100,000 clicks/sec, validating cryptographic token authenticity and redirecting user to target URL in <20ms."
      },
      {
        "id": "FR2",
        "title": "Duplicate & Fraudulent Click Filtering",
        "detail": "Drop rapid repeated clicks from the same user/IP within 10 minutes using Redis Bloom filters and sliding window caches."
      },
      {
        "id": "FR3",
        "title": "Real-Time Campaign Budget Depletion & Aggregation",
        "detail": "Aggregate click spend in 1-minute tumbling windows via Flink, auto-pausing exhausted campaigns within 2 seconds."
      }
    ],
    "outOfScope": [
      "Machine learning click-through rate (CTR) prediction models",
      "Real-Time Bidding (RTB) second-price auction DSP integration",
      "Advertiser creative banner image upload and asset management"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Click Events/Sec • Real-Time Billing Peak • 100B Ad Impressions/Day • 1B Clicks/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/ads/click",
        "purpose": "Ingest and verify ad click beacon",
        "requestSample": "{ \"clickToken\": \"tok_sig_abc123\", \"adId\": \"ad_999\", \"campaignId\": \"cmp_888\", \"timestamp\": 1729000000 }",
        "responseSample": "{ \"status\": \"RECORDED\", \"redirectUrl\": \"https://advertiser.com/product\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "ClickEvent",
        "attributes": "click_id (PK), ad_id, campaign_id, advertiser_id, cost_per_click_cents, ip_hash, user_agent, clicked_at",
        "description": "Raw verified click log stored in OLAP storage."
      },
      {
        "name": "CampaignBudget",
        "attributes": "campaign_id (PK), advertiser_id, daily_budget_cents, spent_cents, status (ACTIVE|PAUSED)",
        "description": "Transactional balance table updated by stream processor."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Ad Click Aggregator & Real-Time Bidding)",
        "steps": [
          "1. Client (Ad Viewer Browser / App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Ad Tracking Edge Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Click Event Log Bus (Kafka)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (OLAP Analytics Engine (ClickHouse)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Ad Click Aggregator & Real-Time Bidding)",
        "steps": [
          "1. Client (Ad Viewer Browser / App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Ad Tracking Edge Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Click Event Log Bus (Kafka)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (OLAP Analytics Engine (ClickHouse)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Duplicate Click Charge Trap: 'User accidentally clicks an ad 10 times in 2 seconds. Does advertiser get charged 10 times?'",
        "juniorAnswer": "Charge the advertiser for each click received by the API.",
        "staffRebuttal": "Charging for rapid duplicate clicks violates advertising contracts and causes advertiser churn. Staff engineers issue unique signed click tokens with ad impressions. At click ingestion, Redis checks if the token was redeemed within a 10-minute window; only the first click debits budget, while subsequent duplicates are recorded for analytics but billed at $0."
      },
      {
        "trapTitle": "The Campaign Budget Overshoot Trap: 'What happens when a viral ad burns through its $1,000 budget in 3 seconds?'",
        "juniorAnswer": "Run a cron job every 10 minutes checking `SELECT SUM(cost) FROM clicks WHERE campaign_id = ?`.",
        "staffRebuttal": "A 10-minute cron job will allow high-traffic ads to spend $10,000 before being paused, resulting in massive billing disputes. Staff engineers maintain in-memory budget counters in Redis / Flink: each click decrements in-memory balance atomically. When budget hits zero, the ad server immediately marks the campaign PAUSED across all edge nodes in <1 second."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Click Events/Sec • Real-Time Billing, 100B Ad Impressions/Day • 1B Clicks/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "music_streaming_spotify": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Instant Audio Playback with Zero Gap Transitions",
        "detail": "Stream encrypted high-fidelity audio chunks (320kbps Ogg Vorbis) with <100ms startup latency and gapless song transitions."
      },
      {
        "id": "FR2",
        "title": "Global Edge CDN Audio Chunk Caching",
        "detail": "Distribute audio chunks across global edge CDN PoPs inside ISP networks, caching top 20% tracks to serve 90%+ traffic from edge."
      },
      {
        "id": "FR3",
        "title": "Accurate Playback Telemetry & Royalty Tracking",
        "detail": "Log verified 30-second playback pulses into Kafka to calculate artist streaming royalties without duplicates."
      }
    ],
    "outOfScope": [
      "Collaborative real-time Jam listening sessions via WebSockets",
      "Automated audio podcast transcript generation",
      "Personalized Discover Weekly machine learning recommendation pipeline"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "200,000 Audio Streams/Sec • 50 Gbps Egress Peak • 600M Active Users • 100M Tracks",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/api/v1/tracks/:trackId/manifest",
        "purpose": "Retrieve audio chunk manifest and CDN segment URLs",
        "responseSample": "{ \"trackId\": \"trk_456\", \"durationSec\": 215, \"format\": \"OGG_VORBIS\", \"bitrate\": 320000, \"chunkUrls\": [\"https://cdn.spotify.com/chunks/trk_456_0.ogg\", \"...\"] }"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/telemetry/playback-pulse",
        "purpose": "Log 30-second listening pulse for artist royalty and Wrapped calculations",
        "requestSample": "{ \"trackId\": \"trk_456\", \"userId\": \"usr_777\", \"listenedSec\": 32 }",
        "responseSample": "HTTP 202 Accepted"
      }
    ],
    "coreEntities": [
      {
        "name": "TrackRecord",
        "attributes": "track_id (PK), title, artist_id, album_id, duration_sec, isrc_code, s3_audio_uri",
        "description": "Relational audio catalog record."
      },
      {
        "name": "StreamLog",
        "attributes": "stream_id (PK), track_id, user_id, timestamp, played_sec, is_qualified_royalty",
        "description": "Royalty payout audit record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Spotify / Global Audio Streaming Platform)",
        "steps": [
          "1. Client (Spotify Mobile / Desktop App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Edge Gateway & Auth Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Global Audio CDN (Cloudflare / Edge PoP)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Playback Telemetry & Royalty Kafka) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Spotify / Global Audio Streaming Platform)",
        "steps": [
          "1. Client (Spotify Mobile / Desktop App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Edge Gateway & Auth Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Global Audio CDN (Cloudflare / Edge PoP)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Playback Telemetry & Royalty Kafka) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Full Song Download Latency Trap: 'Should the player download the entire 10MB audio file before playing?'",
        "juniorAnswer": "Download the complete 320kbps MP3 file over HTTP and then start playback.",
        "staffRebuttal": "Downloading 10MB on a flaky 3G/4G connection takes several seconds, causing unbearable startup buffering. Staff engineers chunk audio into 5-10 second Ogg Vorbis / AAC segments: the player fetches only the first 5-second chunk (<200KB) to begin playback instantly in <100ms, streaming subsequent chunks in the background."
      },
      {
        "trapTitle": "The Song Skip Bandwidth Waste Trap: 'What happens if a user skips through 20 songs in 10 seconds?'",
        "juniorAnswer": "Download the full audio of all 20 songs as soon as they are clicked.",
        "staffRebuttal": "Downloading full files for skipped songs wastes hundreds of megabytes of cellular data and CDN egress costs. Staff engineers implement conservative pre-buffering: download only the first 5 seconds; only once the user listens past 3 seconds does the player buffer the rest of the track."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (200,000 Audio Streams/Sec • 50 Gbps Egress, 600M Active Users • 100M Tracks)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "notification_system_push": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Multi-Channel Notification Dispatch (Push, SMS, Email)",
        "detail": "Deliver notifications across iOS (APNs), Android (FCM), and SMS with dynamic channel fallback based on user preferences."
      },
      {
        "id": "FR2",
        "title": "Strict Priority Queue Isolation (OTP vs Marketing)",
        "detail": "Guarantee sub-second delivery for High-Priority transactional alerts (OTP) even during 100M-recipient marketing blasts."
      },
      {
        "id": "FR3",
        "title": "Per-User Notification Capping & Quiet Hours",
        "detail": "Enforce anti-spam frequency limits (e.g. max 3 marketing alerts/hour) and respect user time-zone quiet hours."
      }
    ],
    "outOfScope": [
      "WYSIWYG email marketing drag-and-drop template visual editor",
      "In-app inbox feed notification center component UI",
      "Multi-language natural language translation of custom notification bodies"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Push/Sec • Multi-Provider Peak • 1B Notifications/Day • Multi-Channel",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/notifications/dispatch",
        "purpose": "Internal service dispatches notification to user across channels",
        "requestSample": "{ \"userId\": \"usr_999\", \"channel\": \"PUSH\", \"priority\": \"HIGH\", \"templateId\": \"RIDE_ARRIVED\", \"params\": { \"driverName\": \"Alex\" } }",
        "responseSample": "{ \"notificationId\": \"notif_1001\", \"status\": \"QUEUED\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "NotificationRecord",
        "attributes": "notification_id (PK), user_id, channel (PUSH|SMS|EMAIL), priority, status (QUEUED|SENT|FAILED), created_at",
        "description": "Delivery status audit record."
      },
      {
        "name": "UserNotificationSettings",
        "attributes": "user_id (PK), push_enabled, quiet_hours_start, quiet_hours_end, marketing_opt_in",
        "description": "User preference settings."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Scalable Notification Service (APNs/FCM/SMS))",
        "steps": [
          "1. Client (Upstream Product Microservice) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Notification Ingestion Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Template & Localization Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (User Mobile / Web Device) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Scalable Notification Service (APNs/FCM/SMS))",
        "steps": [
          "1. Client (Upstream Product Microservice) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Notification Ingestion Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Template & Localization Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (User Mobile / Web Device) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Single Queue Head-of-Line Blocking Trap: 'Marketing team sends 50M push notifications at 9:00 AM. What happens to login OTP codes?'",
        "juniorAnswer": "Put all notifications into a single Kafka topic or RabbitMQ queue.",
        "staffRebuttal": "A single queue creates catastrophic Head-of-Line Blocking: 50 million promotional notifications will delay critical 2FA login OTP codes by 45 minutes, locking users out of the application. Staff engineers enforce Separate Priority Queues: High-Priority (OTP, security, ride arrival) has dedicated worker pools with 0 queue lag, while Low-Priority marketing campaigns process at controlled throttle rates."
      },
      {
        "trapTitle": "The Downstream Provider Throttling Crash: 'Apple APNs or Twilio returns HTTP 429 Too Many Requests.'",
        "juniorAnswer": "Immediately retry failed requests in a tight loop.",
        "staffRebuttal": "Retrying in a tight loop creates an avalanche that completely crashes the connection. Staff engineers implement Token Bucket rate-limiters matched to each provider's contract, paired with Circuit Breakers and exponential backoff with jitter to smooth provider retry bursts."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Push/Sec • Multi-Provider, 1B Notifications/Day • Multi-Channel)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "instagram_feed_stories": {
    "inScope": [
      {
        "id": "FR1",
        "title": "24-Hour Ephemeral Story Publishing",
        "detail": "Publish photo and 15-second video stories that are viewable by followers for exactly 24 hours before automatic expiration."
      },
      {
        "id": "FR2",
        "title": "Real-Time Unviewed Story Tray (Colored Ring)",
        "detail": "Deliver personalized top story trays showing active friend story rings with unviewed indicator in <50ms."
      },
      {
        "id": "FR3",
        "title": "Deduplicated Story Viewer Tracking",
        "detail": "Record who viewed each story, displaying view counts and viewer profile lists without double-counting repeat views."
      }
    ],
    "outOfScope": [
      "Interactive AR face filters and dynamic sticker rendering engine",
      "Music sticker licensing catalog integration and audio sync",
      "Story reply direct messaging and interactive poll analytics"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "20,000 Story Uploads/Sec • 24h Ephemeral Peak • 500M Daily Active Users • 1B Stories/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/stories",
        "purpose": "Publish a new 24-hour ephemeral photo or video story",
        "requestSample": "{ \"mediaUrl\": \"https://s3.../story.jpg\", \"mediaType\": \"IMAGE\", \"caption\": \"Hello world!\" }",
        "responseSample": "{ \"storyId\": \"sty_101\", \"expiresAt\": \"2026-10-30T00:00:00Z\" }"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/stories/tray",
        "purpose": "Fetch active story tray avatars for user home screen",
        "responseSample": "{ \"tray\": [{ \"authorId\": \"usr_55\", \"hasUnviewedStories\": true, \"latestStoryId\": \"sty_101\" }] }"
      }
    ],
    "coreEntities": [
      {
        "name": "StoryMetadata",
        "attributes": "story_id (PK), author_id, media_url, media_type, created_at, expires_at",
        "description": "Ephemeral 24-hour story catalog record."
      },
      {
        "name": "StoryViewRecord",
        "attributes": "story_id, viewer_id (Compound PK), viewed_at",
        "description": "Deduplicated viewer registry."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Instagram / Stories & Photo Feed Publishing)",
        "steps": [
          "1. Client (Instagram Mobile App Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Media Upload API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Story Metadata & State Service) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Instagram Anycast CDN) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Instagram / Stories & Photo Feed Publishing)",
        "steps": [
          "1. Client (Instagram Mobile App Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Media Upload API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Story Metadata & State Service) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Instagram Anycast CDN) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Deletion Avalanche Trap: 'How do you delete 1 billion expired stories every day?'",
        "juniorAnswer": "Run a cron job every hour: `DELETE FROM stories WHERE created_at < NOW() - INTERVAL 24 HOUR`.",
        "staffRebuttal": "Running mass SQL DELETE statements on 1 billion rows locks index pages, destroys replication lag, and saturates disk I/O. Staff engineers use Time-To-Live (TTL) mechanisms: S3 Object Lifecycle rules automatically expire media objects without server intervention; Redis story lists expire via TTL; database queries append `WHERE expires_at > NOW()` and purge old partition tables via fast `DROP TABLE partition_20261028`."
      },
      {
        "trapTitle": "The Story Viewer List Memory Explosion: 'A celebrity story gets 20 million views. How do you store who viewed it?'",
        "juniorAnswer": "Insert 20 million rows into a `story_views` table with user_id and timestamp.",
        "staffRebuttal": "Inserting 20 million rows per celebrity story bloats relational databases rapidly. Staff engineers use Redis HyperLogLog for the public view count (takes only 12 KB memory with 99% accuracy), and paginate recent viewer IDs using Redis Sorted Sets capped at the latest 1,000 viewers."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (20,000 Story Uploads/Sec • 24h Ephemeral, 500M Daily Active Users • 1B Stories/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "linkedin_social_graph": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Degree of Separation Lookup (1st, 2nd, 3rd+)",
        "detail": "Determine if two members are 1st, 2nd, or 3rd degree connections in <50ms when viewing any profile."
      },
      {
        "id": "FR2",
        "title": "Mutual Connection List & Count Calculation",
        "detail": "Compute shared mutual connections between any two members via fast in-memory bitwise intersection."
      },
      {
        "id": "FR3",
        "title": "Real-Time Connection Edge Mutation Ingestion",
        "detail": "Accept and index new connection invite approvals in <1s across distributed graph shards."
      }
    ],
    "outOfScope": [
      "People You May Know (PYMK) offline collaborative filtering recommendation pipeline",
      "Enterprise Sales Navigator lead tracking and CRM integration",
      "Full company alumni organizational graph visualization"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "20,000 Graph Traversal QPS • Sub-50ms Peak • 900M Members • 50B Connection Edges",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/api/v1/graph/distance?sourceId=usr_1&targetId=usr_2",
        "purpose": "Calculate degree of separation and mutual connection count",
        "responseSample": "{ \"degree\": 2, \"mutualConnectionsCount\": 14, \"mutualSample\": [\"usr_10\", \"usr_20\"] }"
      }
    ],
    "coreEntities": [
      {
        "name": "ConnectionEdge",
        "attributes": "member_id_a, member_id_b (Compound PK), status (CONNECTED), established_at",
        "description": "Undirected graph connection edge stored in adjacency lists."
      },
      {
        "name": "MemberGraphIndex",
        "attributes": "member_id (PK), first_degree_bitmap (BLOB), connection_count",
        "description": "Roaring bitmap in Redis cluster."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design LinkedIn / 2nd & 3rd Degree Connection Graph)",
        "steps": [
          "1. Client (LinkedIn Web / Mobile Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway & Session Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Distributed Graph Engine (Neo4j / GraphX)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Member Profile Hydration Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design LinkedIn / 2nd & 3rd Degree Connection Graph)",
        "steps": [
          "1. Client (LinkedIn Web / Mobile Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway & Session Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Distributed Graph Engine (Neo4j / GraphX)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Member Profile Hydration Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Combinatorial Explosion Graph Traversal Trap: 'Can you run standard BFS up to 6 degrees of separation?'",
        "juniorAnswer": "Run standard Breadth-First Search from user A until you hit user B.",
        "staffRebuttal": "Average user has 500 connections. At 6 hops, 500^6 = 15.6 quintillion nodes—completely crashing the graph server. Staff engineers enforce strict boundaries: max 3 degrees of separation, executed via Bidirectional BFS (from both A and B inwards) with Redis Roaring Bitmap intersections to eliminate tree expansions."
      },
      {
        "trapTitle": "The High-Degree Celebrity Supernode Trap: 'What happens when traversing through an influencer with 10 million followers?'",
        "juniorAnswer": "Expand all 10 million edges into the search queue.",
        "staffRebuttal": "Expanding 10 million edges exhausts thread memory and introduces high latency spikes. Staff engineers implement Supernode Pruning: nodes with >50k connections are sampled or deprioritized in intermediate BFS hops, as high-degree public figures provide low signal for meaningful mutual connections."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (20,000 Graph Traversal QPS • Sub-50ms, 900M Members • 50B Connection Edges)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "news_aggregator_ranking": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Algorithmic Time-Decayed Story Ranking (Gravity Formula)",
        "detail": "Rank stories dynamically based on upvotes and age using Hacker News gravity decay formula with continuous re-ranking."
      },
      {
        "id": "FR2",
        "title": "High-Throughput Sub-5ms Frontpage Serving",
        "detail": "Serve top 30 stories to 50,000 QPS with <5ms response times via Redis Sorted Sets and Edge CDN caching."
      },
      {
        "id": "FR3",
        "title": "Deeply Nested Comment Tree Querying in 1 Single Query",
        "detail": "Support arbitrary depth threaded comment hierarchies retrieved efficiently using MPTT / tree path indexing."
      }
    ],
    "outOfScope": [
      "Personalized user recommendation feed customization",
      "Automated natural language sentiment analysis on comments",
      "User-to-user private direct messaging"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "5,000 Upvote Writes/Sec • 50,000 Homepage Reads/Sec Peak • 50M Pageviews/Day • 10M Upvotes",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/posts/:postId/upvote",
        "purpose": "Cast upvote on story with karma validation",
        "requestSample": "{ \"userId\": \"usr_99\", \"postId\": \"post_777\" }",
        "responseSample": "{ \"status\": \"UPVOTED\", \"newScore\": 142 }"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/posts/frontpage?page=1",
        "purpose": "Fetch top ranked stories with gravity score ordering",
        "responseSample": "{ \"posts\": [{ \"id\": \"post_777\", \"title\": \"Show HN: Modern System Design\", \"points\": 142, \"commentCount\": 38 }] }"
      }
    ],
    "coreEntities": [
      {
        "name": "Post",
        "attributes": "post_id (PK), author_id, title, url, upvotes, created_at, gravity_score",
        "description": "Story record with pre-computed gravity ranking score."
      },
      {
        "name": "Comment",
        "attributes": "comment_id (PK), post_id, author_id, parent_id, lft, rgt, content, created_at",
        "description": "Nested tree comment using MPTT indexing."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Hacker News / Algorithmic Ranking & Comments)",
        "steps": [
          "1. Client (Reader Web Browser / App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Fastly / Cloudflare Edge CDN) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Hacker News Ranking Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Post & Nested Comment DB (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Hacker News / Algorithmic Ranking & Comments)",
        "steps": [
          "1. Client (Reader Web Browser / App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Fastly / Cloudflare Edge CDN) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Hacker News Ranking Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Post & Nested Comment DB (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Recursive Comment Query Trap: 'How do you query a 10-level nested comment tree in SQL?'",
        "juniorAnswer": "Use recursive SQL CTE queries: `WITH RECURSIVE comment_tree AS (...)`.",
        "staffRebuttal": "Recursive CTEs lock tables and burn high CPU when thousands of users read popular threads with 5,000+ comments. Staff engineers use Modified Preorder Tree Traversal (MPTT) or Materialized Path (`path = 0001.0003.0012`): fetching the entire nested thread requires a single lightning-fast index range query `WHERE lft BETWEEN parent_lft AND parent_rgt`."
      },
      {
        "trapTitle": "The Constant Frontpage Re-sorting CPU Burn: 'Recalculating gravity for 500,000 posts every second burns 100% CPU.'",
        "juniorAnswer": "Run a query sorting all posts in the database every second.",
        "staffRebuttal": "99% of older posts will never reach the frontpage again. Staff engineers only re-evaluate gravity scores for posts created within the last 48 hours that have >= 3 upvotes. Furthermore, score recalculation is triggered lazily upon upvote events, plus an hourly background decay sweep on top 1,000 active candidates in Redis ZSET."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (5,000 Upvote Writes/Sec • 50,000 Homepage Reads/Sec, 50M Pageviews/Day • 10M Upvotes)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "shazam_audio_recognition": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Robust Audio Landmark Hash Extraction (FFT Spectrogram)",
        "detail": "Extract noise-resilient frequency peak landmark pairs from 5-second compressed audio samples using Fast Fourier Transform."
      },
      {
        "id": "FR2",
        "title": "Sub-Second Inverted Fingerprint Index Lookup",
        "detail": "Query 100M-song inverted index across distributed RAM nodes in <200ms using 32-bit landmark hashes."
      },
      {
        "id": "FR3",
        "title": "Temporal Coherence Offset Verification (Histogram Match)",
        "detail": "Verify candidate matches via time-difference histogram clustering, guaranteeing zero false positives in noisy environments."
      }
    ],
    "outOfScope": [
      "Hum-to-search melodic pitch matching (handled via separate monophonic pitch tracker)",
      "Real-time synchronized scrolling lyrics karaoke visualizer",
      "Live streaming radio broadcast continuous monitor compliance"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "2,000 Match Requests/Sec • P99 < 1s Peak • 1B Song Identifications/Mo • 100M Audio Catalog",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/audio/match",
        "purpose": "Submit audio fingerprint hashes to identify playing song",
        "requestSample": "{ \"fingerprints\": [{ \"hash\": 38491024, \"sampleOffsetMs\": 1200 }, { \"hash\": 91823012, \"sampleOffsetMs\": 1850 }] }",
        "responseSample": "{ \"matched\": true, \"songId\": \"sng_456\", \"title\": \"Bohemian Rhapsody\", \"artist\": \"Queen\", \"confidence\": 0.98 }"
      }
    ],
    "coreEntities": [
      {
        "name": "AudioFingerprintIndex",
        "attributes": "hash_32bit (PK), entries (LIST of SongID_uint32, Offset_uint32)",
        "description": "Inverted index mapping audio frequency landmark to track offsets."
      },
      {
        "name": "SongCatalog",
        "attributes": "song_id (PK), title, artist, album, duration_sec, spotify_uri, apple_music_uri",
        "description": "Track metadata store."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Shazam / Audio Fingerprint Matching Engine)",
        "steps": [
          "1. Client (Mobile Audio Capture Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Shazam Matching Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Peak Landmark & Combinatorial Hash Generator) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Song & Streaming Metadata DB) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Shazam / Audio Fingerprint Matching Engine)",
        "steps": [
          "1. Client (Mobile Audio Capture Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Shazam Matching Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Peak Landmark & Combinatorial Hash Generator) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Song & Streaming Metadata DB) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Raw Waveform Cross-Correlation Trap: 'Can we compare raw audio WAV bytes directly?'",
        "juniorAnswer": "Compare raw audio waveforms using cross-correlation or Euclidean distance in time domain.",
        "staffRebuttal": "Background noise (chatter, traffic), phase shifts, and phone mic distortion completely alter time-domain wave shapes, causing 0% match accuracy. Staff engineers use Frequency-Domain Spectrograms: audio peaks (loudest frequencies at specific times) survive ambient noise and compression artifacts."
      },
      {
        "trapTitle": "The False Positive Count Trap: 'Can we simply pick the song with the most matching hashes?'",
        "juniorAnswer": "Count matching hashes per song; the song with the highest count wins.",
        "staffRebuttal": "Common musical chords (e.g. C-major) will match thousands of unrelated songs, causing frequent false positives. Staff engineers require Temporal Coherence: the time difference between the sample offset and the catalog offset must be CONSTANT across all matching points. In a scatter plot of `(t_sample - t_track)`, the true match forms a sharp peak in the histogram."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (2,000 Match Requests/Sec • P99 < 1s, 1B Song Identifications/Mo • 100M Audio Catalog)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "content_moderation_ai": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-10ms Known-Bad Perceptual Hash Matching",
        "detail": "Instantly intercept previously identified harmful content using perceptual hashing (PhotoDNA / PDQ / TMK) without calling expensive AI models."
      },
      {
        "id": "FR2",
        "title": "High-Throughput Multi-Modal AI Classification",
        "detail": "Process 25,000 media items/sec through GPU inference clusters running computer vision and NLP models within 2 seconds."
      },
      {
        "id": "FR3",
        "title": "Borderline Human Review Escalation Workflow",
        "detail": "Automatically triage ambiguous predictions (confidence 0.40 - 0.75) into prioritized human review queues with strict SLA tracking."
      }
    ],
    "outOfScope": [
      "Law enforcement legal subpoena automated portal integration",
      "User ban appeal dispute resolution ticket system",
      "Model training data labeling annotation studio interface"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Media Uploads/Sec • Async Queue Peak • 1B Uploads/Day • Sub-Second Triage",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/moderation/scan",
        "purpose": "Submit media URL or text for automated safety classification",
        "requestSample": "{ \"contentId\": \"cnt_999\", \"contentType\": \"IMAGE\", \"mediaUrl\": \"https://s3.../photo.jpg\" }",
        "responseSample": "{ \"verdict\": \"APPROVED\", \"confidence\": 0.98, \"categories\": { \"nsfw\": 0.01, \"violence\": 0.02 } }"
      }
    ],
    "coreEntities": [
      {
        "name": "ModerationJob",
        "attributes": "job_id (PK), content_id, perceptual_hash, status (PENDING|APPROVED|REJECTED|HUMAN_REVIEW), ai_confidence, policy_code",
        "description": "Moderation ticket audit trail."
      },
      {
        "name": "KnownViolationHash",
        "attributes": "hash (PK), violation_category, legal_reference, flagged_at",
        "description": "Perceptual hash blocklist."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Meta / Automated Image & Video Safety Moderation)",
        "steps": [
          "1. Client (User Content Upload Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Content Ingestion Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Moderation Task Stream (Kafka)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Moderation Verdict DB & Audit Log) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Meta / Automated Image & Video Safety Moderation)",
        "steps": [
          "1. Client (User Content Upload Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Content Ingestion Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Moderation Task Stream (Kafka)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Moderation Verdict DB & Audit Log) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Synchronous AI Inference Latency Trap: 'Should the upload API wait synchronously for the GPU model to finish?'",
        "juniorAnswer": "Block the user HTTP request until the ResNet/Transformer model finishes inference and returns a verdict.",
        "staffRebuttal": "Complex multi-modal neural network inference takes 500ms to 2s per video. Blocking user HTTP uploads ties up web server threads and leads to mass timeouts. Staff engineers use Asynchronous Staged Pipeline: upload immediately succeeds to private staging storage; Kafka dispatches AI jobs; content is made visible to other users only after passing the moderation gate."
      },
      {
        "trapTitle": "The Cryptographic Hash Trap: 'Why not use SHA-256 to detect re-uploaded banned images?'",
        "juniorAnswer": "Hash banned images with SHA-256; if a new image matches the hash, block it.",
        "staffRebuttal": "Cryptographic hashes (SHA-256) exhibit the avalanche effect: changing 1 single pixel or resizing by 1% creates a completely different hash, allowing bad actors to easily evade detection. Staff engineers use Perceptual Hashing (PDQ, pHash, PhotoDNA) where visually similar images produce nearly identical Hamming-distance hashes."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Media Uploads/Sec • Async Queue, 1B Uploads/Day • Sub-Second Triage)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "realtime_audio_translation": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second End-to-End Streaming Translation (<800ms)",
        "detail": "Deliver end-to-end voice-to-voice translation (Audio In -> Text -> Translated Text -> Audio Out) with under 800ms total latency."
      },
      {
        "id": "FR2",
        "title": "Streaming ASR with Voice Activity Detection (VAD)",
        "detail": "Convert continuous audio streams into interim transcriptions, filtering background silence and pauses automatically."
      },
      {
        "id": "FR3",
        "title": "Fluid Text-to-Speech Audio Stream Synthesis",
        "detail": "Generate natural-sounding translated speech waveforms in real-time chunks matching the speaker cadence."
      }
    ],
    "outOfScope": [
      "Speaker voice cloning and biometric timbre replication",
      "Multi-speaker simultaneous overlapping conversational diarization",
      "Offline translation dictionary download pack generation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "15,000 Concurrent Audio Streams • Sub-Second Peak • 100M Audio Minutes/Day • Multi-Lingual",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/ws/v1/voice/translate?sourceLang=en&targetLang=es",
        "purpose": "Bi-directional streaming connection: upload raw audio, receive translated audio",
        "requestSample": "Binary PCM audio chunk (16kHz, 16-bit mono, 100ms frame)",
        "responseSample": "{ \"partialText\": \"Hola, ¿cómo estás?\", \"audioChunkBase64\": \"...\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "TranslationSession",
        "attributes": "session_id (PK), user_id, source_lang, target_lang, sample_rate, status, started_at",
        "description": "Active streaming voice session context."
      },
      {
        "name": "PhraseCache",
        "attributes": "source_hash (PK), source_lang, target_lang, translated_text, tts_audio_uri",
        "description": "Common phrase memoization cache."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Google Translate / Real-Time Voice Translation)",
        "steps": [
          "1. Client (Speech Input Client (Browser / Phone)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Streaming Voice Gateway (gRPC / WS)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Neural Machine Translation (NMT)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Translated Audio Output Player) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Google Translate / Real-Time Voice Translation)",
        "steps": [
          "1. Client (Speech Input Client (Browser / Phone)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Streaming Voice Gateway (gRPC / WS)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Neural Machine Translation (NMT)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Translated Audio Output Player) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Full Sentence Blocking Trap: 'Wait for the user to finish speaking before starting translation.'",
        "juniorAnswer": "Wait until user stops talking for 2 seconds, then send the whole audio file through translation.",
        "staffRebuttal": "Waiting for a 15-second speech to finish before starting translation introduces 17+ seconds of latency, destroying conversational flow. Staff engineers build a Streaming Pipeline: ASR emits partial tokens every 200ms; NMT translates incrementally using sliding word-windows; TTS begins streaming the first synthesized words while the speaker is still finishing their sentence."
      },
      {
        "trapTitle": "The Word-Order Grammatical Flip Trap: 'Translating word-by-word causes incorrect grammatical structure.'",
        "juniorAnswer": "Translate each word independently as soon as it is transcribed.",
        "staffRebuttal": "Word-by-word translation destroys syntax in language pairs with different grammatical rules (e.g. English Subject-Verb-Object vs Japanese Subject-Object-Verb). Staff engineers use Speculative Chunk Translation with Revision: emit interim translated hypotheses, but allow the decoder to revise the tail tokens when boundary punctuation or verbs arrive."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (15,000 Concurrent Audio Streams • Sub-Second, 100M Audio Minutes/Day • Multi-Lingual)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "people_you_may_know": {
    "inScope": [
      {
        "id": "FR1",
        "title": "High-Quality Friend Candidate Generation (Triadic Closure)",
        "detail": "Identify high-probability social connections based on 2nd-degree friend-of-friends overlap and address book sync."
      },
      {
        "id": "FR2",
        "title": "Sub-20ms Recommendation Serving from Precomputed Cache",
        "detail": "Serve top 10 ranked friend suggestions with mutual friend previews to active users in <20ms from precomputed stores."
      },
      {
        "id": "FR3",
        "title": "Negative Feedback Dismissal Suppression",
        "detail": "Instantly record dismissed suggestions and suppress those profiles across all feeds for at least 90 days."
      }
    ],
    "outOfScope": [
      "Graph structural clustering community detection visualization",
      "Automated fraud sockpuppet multi-account detection",
      "Sponsored influencer suggested follow monetization"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "20,000 Feed Recommendation QPS Peak • 2B Users • 10B Daily Recommendations",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/api/v1/friends/suggestions?limit=10",
        "purpose": "Fetch top ranked People You May Know recommendations",
        "responseSample": "{ \"suggestions\": [{ \"userId\": \"usr_456\", \"name\": \"Sarah Connor\", \"mutualFriendsCount\": 8, \"mutualFriendsSample\": [\"John\", \"Kyle\"] }] }"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/friends/suggestions/:candidateId/dismiss",
        "purpose": "User dismisses friend suggestion; adds to negative feedback blacklist",
        "responseSample": "{ \"success\": true, \"cooldownDays\": 90 }"
      }
    ],
    "coreEntities": [
      {
        "name": "FriendSuggestionCache",
        "attributes": "user_id (PK), candidate_list (JSON array of [candidate_id, score, mutual_count]), updated_at",
        "description": "Pre-computed top suggestions in Cassandra."
      },
      {
        "name": "DismissedSuggestion",
        "attributes": "user_id, candidate_id (Compound PK), dismissed_at, expires_at",
        "description": "Negative feedback blacklist."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Facebook / People You May Know Recommendation)",
        "steps": [
          "1. Client (Facebook Mobile App Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Social Discovery API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Contact Book & Phonebook Ingester) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Precomputed Suggestions Cache (Cassandra)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Facebook / People You May Know Recommendation)",
        "steps": [
          "1. Client (Facebook Mobile App Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Social Discovery API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Contact Book & Phonebook Ingester) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Precomputed Suggestions Cache (Cassandra)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Real-Time Social Graph Traversal Trap: 'Can we query 2nd-degree friends live on every feed request?'",
        "juniorAnswer": "Query `SELECT friend_of_friend FROM graph WHERE user_id = ?` directly when user loads their feed.",
        "staffRebuttal": "Running 2nd-degree friend-of-friends graph queries for 2 billion daily users in real time requires traversing millions of edges per user, causing 10+ second latency spikes. Staff engineers use Offline Precomputation: nightly Spark/GraphX batch jobs calculate candidate pools, score them with ML models, and store the top 100 recommendations in Cassandra ready for instant retrieval."
      },
      {
        "trapTitle": "The Zombie Recommendation Trap: 'User clicks Remove on a suggestion, but it reappears 2 minutes later.'",
        "juniorAnswer": "Since suggestions are precomputed overnight, wait for the next nightly batch run to remove them.",
        "staffRebuttal": "Showing a rejected suggestion again infuriates users and degrades trust. Staff engineers use Write-Through Negative Cache: when a user clicks 'X', write the pair `(user_id, candidate_id)` immediately to a Redis Set. The read API fetches precomputed suggestions from Cassandra and filters them against the Redis negative set in RAM before rendering."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (20,000 Feed Recommendation QPS, 2B Users • 10B Daily Recommendations)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "anti_spam_email_filter": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Perimeter Cryptographic Authentication (SPF, DKIM, DMARC)",
        "detail": "Verify email sender identity and drop domain spoofing attacks in <5ms using DNS records and cryptographic signatures."
      },
      {
        "id": "FR2",
        "title": "High-Throughput ML Phishing & Spam Classification",
        "detail": "Classify 120,000 inbound emails/sec within 200ms using multi-stage feature extraction and NLP classification."
      },
      {
        "id": "FR3",
        "title": "Personal Contact Whitelist Override",
        "detail": "Guarantee zero false positives for trusted sender contacts by cross-referencing recipient personal address books."
      }
    ],
    "outOfScope": [
      "Zero-day executable malware hypervisor sandbox reverse engineering",
      "Enterprise email compliance discovery legal hold retention",
      "Outbound marketing bulk email warm-up IP reputation builder"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "120,000 Inbound Emails/Sec Peak • 10B Emails/Day • Sub-Second Triage",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/mail/filter",
        "purpose": "Evaluate inbound raw email headers and body for spam/phishing score",
        "requestSample": "{ \"senderIp\": \"198.51.100.1\", \"from\": \"support@bank-security.com\", \"subject\": \"Urgent: Account Suspended\", \"rawBody\": \"Click here...\" }",
        "responseSample": "{ \"verdict\": \"SPAM\", \"spamScore\": 0.96, \"flags\": [\"SUSPICIOUS_DOMAIN\", \"URGENT_CREDENTIAL_PHISH\"] }"
      }
    ],
    "coreEntities": [
      {
        "name": "EmailFilterAudit",
        "attributes": "message_id (PK), sender_email, sender_ip, dkim_valid, spf_valid, spam_score, destination (INBOX|SPAM|DROPPED), processed_at",
        "description": "Email triage classification audit log."
      },
      {
        "name": "DomainReputationRecord",
        "attributes": "domain_name (PK), reputation_score, total_sent, total_marked_spam, updated_at",
        "description": "Aggregated domain trustworthiness index."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Gmail / Real-Time Anti-Spam & Phishing Filter)",
        "steps": [
          "1. Client (Inbound SMTP Mail Transfer Agent (MTA)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (DNS Authentication & IP Reputation (SPF/DKIM/DMARC)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (MIME Parser & Attachment Sandbox) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Mailbox Delivery Router (Inbox vs Spam Folder)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Gmail / Real-Time Anti-Spam & Phishing Filter)",
        "steps": [
          "1. Client (Inbound SMTP Mail Transfer Agent (MTA)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (DNS Authentication & IP Reputation (SPF/DKIM/DMARC)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (MIME Parser & Attachment Sandbox) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Mailbox Delivery Router (Inbox vs Spam Folder)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Run Deep Learning on Every Email Trap: 'Can we run a 1B parameter BERT model on all 10 billion emails?'",
        "juniorAnswer": "Feed every incoming email directly into a large language model on GPUs.",
        "staffRebuttal": "Running heavy LLM inference on 120,000 emails/second would require tens of millions of dollars in GPU clusters and introduce massive latency. Staff engineers use a Filter Funnel: Stage 1 drops 80% via cheap IP blocklists and SPF/DKIM checks (microseconds); Stage 2 runs fast Naive Bayes and URL blocklists (milliseconds); only the top 5% ambiguous emails reach deep learning classifiers."
      },
      {
        "trapTitle": "The False Positive Disaster Trap: 'What happens if a legitimate urgent email from a boss is marked as spam?'",
        "juniorAnswer": "Tune the spam threshold to be extremely aggressive so zero spam reaches the inbox.",
        "staffRebuttal": "In email systems, False Positives (legitimate email sent to spam) are 100x worse than False Negatives (a spam email reaching the inbox). Staff engineers calibrate models with high precision thresholds (>0.98 for auto-spam), and apply hard whitelisting: if the sender is in the recipient's Google Contacts or has a previous reply history, the email is guaranteed Inbox delivery."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (120,000 Inbound Emails/Sec, 10B Emails/Day • Sub-Second Triage)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "podcasts_distribution": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Distributed Adaptive RSS Feed Polling (5M Shows)",
        "detail": "Poll 5 million decentralized creator RSS feeds with adaptive schedules and HTTP 304 ETag caching."
      },
      {
        "id": "FR2",
        "title": "Fast XML Metadata & Enclosure Extraction",
        "detail": "Parse and sanitize episode audio enclosures, episode notes, and cover art within 2 seconds of feed update."
      },
      {
        "id": "FR3",
        "title": "Global Audio Streaming with HTTP Byte-Range Resume",
        "detail": "Deliver podcast audio files globally via CDN with HTTP 206 partial content support for resumable playback."
      }
    ],
    "outOfScope": [
      "Dynamic mid-roll audio ad insertion (DAI) auction engine",
      "Automated speech-to-text transcript time-synchronized karaoke display",
      "In-app podcast creator monetization subscription billing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 RSS Feed Polls/Sec • 100 Gbps Audio Egress Peak • 5M Podcast Shows • 100M Episodes",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/podcasts/submit-feed",
        "purpose": "Submit creator RSS feed URL for indexing into podcast directory",
        "requestSample": "{ \"feedUrl\": \"https://feeds.simplecast.com/54nAGcIl\" }",
        "responseSample": "{ \"podcastId\": \"pod_888\", \"status\": \"VERIFYING\", \"title\": \"System Design Mastery\" }"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/podcasts/:podcastId/episodes",
        "purpose": "Fetch paginated episode list for show",
        "responseSample": "{ \"episodes\": [{ \"episodeId\": \"ep_1\", \"title\": \"Episode 1: Scalability\", \"audioUrl\": \"https://cdn.podcasts.com/ep1.mp3\", \"durationSec\": 3600 }] }"
      }
    ],
    "coreEntities": [
      {
        "name": "PodcastShow",
        "attributes": "podcast_id (PK), feed_url, title, author, etag, last_modified, crawl_frequency_min",
        "description": "RSS feed polling configuration record."
      },
      {
        "name": "Episode",
        "attributes": "episode_id (PK), podcast_id, title, audio_enclosure_url, duration_sec, published_at",
        "description": "Episode metadata record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Apple Podcasts / Global RSS Audio Ingestion)",
        "steps": [
          "1. Client (Podcast Creator RSS Feed Host) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Distributed RSS Crawler & Poller) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Podcast Episode Catalog DB (Postgres)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Podcast Listener Mobile App) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Apple Podcasts / Global RSS Audio Ingestion)",
        "steps": [
          "1. Client (Podcast Creator RSS Feed Host) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Distributed RSS Crawler & Poller) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Podcast Episode Catalog DB (Postgres)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Podcast Listener Mobile App) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Fixed-Interval Polling Thundering Herd: 'Polling all 5 million RSS feeds every 1 hour.'",
        "juniorAnswer": "Run a cron job every 60 minutes that loops through all 5 million RSS URLs.",
        "staffRebuttal": "Polling 5 million external servers simultaneously creates a massive outbound network spike that gets your IP ranges blocked by podcast hosts (Cloudflare, Libsyn). Staff engineers use an Adaptive Distributed Priority Queue: each show has an exponential backoff crawl interval based on historical release patterns; requests are jittered evenly across the day."
      },
      {
        "trapTitle": "The Re-Downloading Unchanged Feeds Trap: 'Downloading full XML feeds on every poll burns terabytes of transit.'",
        "juniorAnswer": "Download the full XML file, parse it, and compare it with the database.",
        "staffRebuttal": "Downloading 5 million XML feeds (avg 500KB) every hour wastes 2.5 TB of bandwidth per hour on unchanged content. Staff engineers send HTTP conditional headers (`If-None-Match: <etag>` and `If-Modified-Since: <timestamp>`). If the feed hasn't changed, the host server returns a tiny 100-byte `HTTP 304 Not Modified` header with 0 payload bytes."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 RSS Feed Polls/Sec • 100 Gbps Audio Egress, 5M Podcast Shows • 100M Episodes)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "netflix_vector_ann_rec": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-15ms Approximate Nearest Neighbor (ANN) Vector Search",
        "detail": "Retrieve top 50 similar movie candidates across 10M embeddings in <15ms using HNSW / ScaNN vector indexing."
      },
      {
        "id": "FR2",
        "title": "Real-Time User Taste Vector Hydration",
        "detail": "Update and cache 256-dimensional user taste embeddings in Redis based on recent watch history."
      },
      {
        "id": "FR3",
        "title": "Contextual Re-Ranking & License Filtering",
        "detail": "Filter country licensing restrictions and re-rank top candidates using lightweight GBDT models in <5ms."
      }
    ],
    "outOfScope": [
      "Offline multi-day deep neural network embedding training pipeline",
      "A/B testing dynamic box art image visual generation",
      "Real-time video encoding parameter tuning"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "30,000 Vector Search QPS • P99 < 15ms Peak • 300M Users • 10M Movie Embeddings",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/recommendations/ann-search",
        "purpose": "Find similar movies based on vector embedding cosine similarity",
        "requestSample": "{ \"userVector\": [0.042, -0.125, 0.891, \"...\"], \"topK\": 50, \"country\": \"US\" }",
        "responseSample": "{ \"candidateIds\": [\"mov_101\", \"mov_204\", \"mov_309\"], \"searchLatencyMs\": 4.2 }"
      }
    ],
    "coreEntities": [
      {
        "name": "MovieEmbedding",
        "attributes": "movie_id (PK), vector_256d (FLOAT ARRAY), genre_tags, licensed_countries, updated_at",
        "description": "Vector embedding stored in HNSW graph."
      },
      {
        "name": "UserProfileVector",
        "attributes": "user_id (PK), profile_vector (FLOAT ARRAY), last_watched_ids, updated_at",
        "description": "Real-time user taste vector in Redis."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Netflix / Vector Embedding Recommendation Engine)",
        "steps": [
          "1. Client (Netflix Viewer UI Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Recommendation API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Vector ANN Search Engine (Milvus / HNSW / Faiss)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Movie Catalog Store (CockroachDB)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Netflix / Vector Embedding Recommendation Engine)",
        "steps": [
          "1. Client (Netflix Viewer UI Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Recommendation API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Vector ANN Search Engine (Milvus / HNSW / Faiss)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Movie Catalog Store (CockroachDB)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Exact Cosine Distance O(N) Trap: 'Can we compute exact dot product against all 10 million vectors?'",
        "juniorAnswer": "Loop through all 10 million vectors in the database, calculate cosine similarity, and take the top 50.",
        "staffRebuttal": "Computing dot products across 10 million 256-dimensional vectors requires billions of floating-point operations, taking 2 to 5 seconds per request. Staff engineers use Approximate Nearest Neighbor (ANN) algorithms (HNSW, ScaNN, Faiss): by navigating a multi-layer graph index in logarithmic time O(log N), candidate retrieval completes in <5ms with 98%+ recall accuracy."
      },
      {
        "trapTitle": "The Post-Query Filtering Disaster: 'Query top 50 movies by vector, then filter out already-watched titles.'",
        "juniorAnswer": "Perform ANN search for top 50; if 48 of them were already watched by the user, you only have 2 left.",
        "staffRebuttal": "Post-filtering leads to empty carousels for active binge-watchers. Staff engineers use Hybrid Filtered Vector Search: the vector index applies a boolean bitmask filter (e.g. `watched = false`) during graph traversal, guaranteeing that all returned top K candidates are fresh, unviewed, and licensed."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (30,000 Vector Search QPS • P99 < 15ms, 300M Users • 10M Movie Embeddings)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "leetcode_code_judge": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Secure Isolated Untrusted Code Execution",
        "detail": "Execute arbitrary user code across 50+ programming languages securely in isolated sandboxes with zero host access and disabled networking."
      },
      {
        "id": "FR2",
        "title": "Strict Time & Memory Quota Enforcement (TLE / MLE)",
        "detail": "Enforce sub-millisecond CPU execution timers and strict memory cgroups boundaries, terminating infinite loops instantly."
      },
      {
        "id": "FR3",
        "title": "High-Throughput Submission Queueing & Priority Scheduling",
        "detail": "Queue and grade 2,000 submissions/sec, prioritizing interactive runs over background submissions."
      }
    ],
    "outOfScope": [
      "Interactive pair programming video interview studio WebRTC integration",
      "Automated plagiarism and cheat detection AST comparison engine",
      "Gamified contest global live score ranking recalculation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "2,000 Code Executions/Sec • Sub-Second Verdict Peak • 10M Submissions/Day • 50+ Languages",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 100ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Availability and low-latency rendering prioritized for millions of simultaneous viewers."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Petabyte-Scale Sharded Storage • CDN Edge Caching",
        "derivation": "90%+ of read requests served by global Edge CDNs, offloading primary datastores."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/judge/submissions",
        "purpose": "Submit code solution for execution and test case evaluation",
        "requestSample": "{ \"problemId\": \"p_two_sum\", \"language\": \"python3\", \"code\": \"class Solution: ...\", \"isRunCode\": false }",
        "responseSample": "{ \"submissionId\": \"sub_555\", \"status\": \"QUEUED\" }"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/judge/submissions/:submissionId",
        "purpose": "Poll or receive WebSocket verdict result for submission",
        "responseSample": "{ \"status\": \"ACCEPTED\", \"runtimeMs\": 42, \"memoryMb\": 16.4, \"testCasesPassed\": 58, \"totalTestCases\": 58 }"
      }
    ],
    "coreEntities": [
      {
        "name": "Submission",
        "attributes": "submission_id (PK), user_id, problem_id, language, code_text, status (QUEUED|RUNNING|ACCEPTED|WRONG_ANSWER|TLE|MLE), runtime_ms, memory_mb, created_at",
        "description": "Code execution result record."
      },
      {
        "name": "ProblemTestCase",
        "attributes": "problem_id (PK), test_case_id, input_path, expected_output_path, time_limit_ms, memory_limit_mb",
        "description": "Official evaluation test suite."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design LeetCode / Online Code Execution Engine)",
        "steps": [
          "1. Client (Web Code Editor Client (Monaco)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Code Judge API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Sandbox Orchestrator Worker) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Verdict & Leaderboard DB (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design LeetCode / Online Code Execution Engine)",
        "steps": [
          "1. Client (Web Code Editor Client (Monaco)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Code Judge API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Sandbox Orchestrator Worker) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Verdict & Leaderboard DB (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Standard Docker Container Escape Trap: 'Why not just run user code in a standard Docker container?'",
        "juniorAnswer": "Spin up a standard Ubuntu Docker container and execute `python main.py`.",
        "staffRebuttal": "Standard Docker containers share the host Linux kernel. Malicious users can exploit kernel privilege escalation vulnerabilities, read `/etc/shadow`, mount host disk drives, or fork-bomb the host server. Staff engineers use Hardened Sandboxes: gVisor (user-space kernel that intercepts all syscalls) or AWS Firecracker microVMs with seccomp profiles, zero network interfaces, and read-only root filesystems."
      },
      {
        "trapTitle": "The Wall-Clock vs CPU Time Trap: 'How do you measure execution time accurately?'",
        "juniorAnswer": "Use `System.currentTimeMillis()` before and after the code executes.",
        "staffRebuttal": "Wall-clock time includes OS context switches, disk I/O, and CPU scheduling delays, causing erratic verdicts for identical code on multi-tenant servers. Staff engineers measure CPU Cycles / User-Space Process Execution Time via Linux `getrusage()` or `cgroups cpuacct.usage`, ensuring 100% deterministic, repeatable runtime measurements."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (2,000 Code Executions/Sec • Sub-Second Verdict, 10M Submissions/Day • 50+ Languages)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "amazon_flash_sale": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Zero-Overselling Atomic Stock Decrement",
        "detail": "Guarantee exactly zero overselling across 100k items under 200,000 concurrent claim requests/sec using atomic Redis Lua scripts."
      },
      {
        "id": "FR2",
        "title": "15-Minute Temporary Checkout Reservation Lease",
        "detail": "Lock inventory for 15 minutes to allow buyer to enter payment details, auto-releasing stock if payment is not completed."
      },
      {
        "id": "FR3",
        "title": "Asynchronous Order Creation Queueing",
        "detail": "Decouple inventory claims from relational database writes using Kafka to protect primary datastores from connection exhaustion."
      }
    ],
    "outOfScope": [
      "Personalized product recommendation carousel integration",
      "Third-party marketplace multi-seller fulfillment logistics",
      "Automated promotional coupon code stacking engine"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "200,000 Checkout Claims/Sec • Zero Oversell Peak • 100k Items • 10M Concurrent Buyers",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/flash-sale/claim",
        "purpose": "Claim limited flash sale inventory item with unique user idempotency token",
        "requestSample": "{ \"userId\": \"usr_777\", \"dealId\": \"deal_ps5_01\", \"idempotencyKey\": \"9b1deb4d-3b7d\" }",
        "responseSample": "{ \"status\": \"RESERVED\", \"reservationId\": \"res_888\", \"expiresAt\": \"2026-10-29T10:15:00Z\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "FlashDealInventory",
        "attributes": "deal_id (PK), total_quantity, available_quantity, reserved_quantity, starts_at, ends_at",
        "description": "Deal configuration and stock state."
      },
      {
        "name": "InventoryReservation",
        "attributes": "reservation_id (PK), deal_id, user_id, status (PENDING_PAYMENT|PAID|EXPIRED), created_at, expires_at",
        "description": "15-minute temporary checkout hold."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Amazon / Lightning Deals Flash Sale)",
        "steps": [
          "1. Client (Shopper Mobile / Web Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Flash Sale Edge Gateway & Rate Limiter) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Order Creation Bus (Kafka / SQS)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Payment Gateway Adapter) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Amazon / Lightning Deals Flash Sale)",
        "steps": [
          "1. Client (Shopper Mobile / Web Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Flash Sale Edge Gateway & Rate Limiter) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Order Creation Bus (Kafka / SQS)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Payment Gateway Adapter) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Row Lock Contention Trap: 'Can we run UPDATE inventory SET stock = stock - 1 in SQL?'",
        "juniorAnswer": "Wrap the update in a SQL transaction with `SELECT stock FROM inventory FOR UPDATE`.",
        "staffRebuttal": "Running row-level write locks across 100,000 concurrent threads on a single database row creates catastrophic lock-wait queues, thread exhaustion, and database downtime. Staff engineers decrement inventory atomically in RAM using Redis Lua scripts (`redis.call('decrby', key, 1)`), processing 200k operations/sec in sub-millisecond time."
      },
      {
        "trapTitle": "The Phantom Reservation Leak Trap: 'What if user claims an item but closes their laptop without paying?'",
        "juniorAnswer": "Wait until an administrator manually cancels abandoned orders at the end of the day.",
        "staffRebuttal": "If users hold items without paying, limited stock sits locked while real buyers are turned away. Staff engineers enforce strict 15-minute lease timers using Redis TTL keys with keyspace notification events or delayed Kafka message queues: if payment confirmation does not arrive within 15 minutes, the reservation expires and stock increments back to available inventory automatically."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (200,000 Checkout Claims/Sec • Zero Oversell, 100k Items • 10M Concurrent Buyers)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "stock_matching_engine": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Microsecond Price-Time Priority Order Matching",
        "detail": "Match limit and market orders following strict Price-Time priority in <1 microsecond with zero GC pauses."
      },
      {
        "id": "FR2",
        "title": "Deterministic Sequential WAL Journaling",
        "detail": "Persist all incoming order events and executions sequentially to NVMe write-ahead logs for 100% crash recovery."
      },
      {
        "id": "FR3",
        "title": "Low-Latency Market Depth Dissemination (Level 2)",
        "detail": "Broadcast incremental book updates and executed trades over UDP Multicast / WebSockets to market participants."
      }
    ],
    "outOfScope": [
      "Regulatory SEC/FINRA multi-year cold compliance archive tape backup",
      "Complex cross-asset option Greek risk matrix calculation",
      "Retail user web trading frontend mobile design"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,000,000 Orders/Sec • Sub-Microsecond Peak • 100M Orders/Day • Multi-Asset",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/orders/limit",
        "purpose": "Submit limit order into high-frequency matching engine",
        "requestSample": "{ \"symbol\": \"AAPL\", \"side\": \"BUY\", \"priceCents\": 15000, \"quantity\": 100, \"traderId\": \"hf_001\" }",
        "responseSample": "{ \"orderId\": \"ord_9901\", \"status\": \"FILLED\", \"filledQuantity\": 100, \"fillPriceCents\": 15000, \"latencyNanos\": 480 }"
      }
    ],
    "coreEntities": [
      {
        "name": "LimitOrder",
        "attributes": "order_id (PK uint64), symbol (uint32), side (BUY|SELL), price (uint64), quantity (uint32), timestamp_ns",
        "description": "Fixed-size 64-byte binary order structure."
      },
      {
        "name": "TradeExecution",
        "attributes": "trade_id (PK uint64), buy_order_id, sell_order_id, execution_price, matched_quantity, executed_at_ns",
        "description": "Matched execution ticket."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Stock Exchange Matching Engine)",
        "steps": [
          "1. Client (Algorithmic Trader / FIX Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (FIX Protocol Gateway & Risk Check) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (In-Memory Order Book (Price-Time Priority)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Post-Trade Clearing & Settlement Ledger) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Stock Exchange Matching Engine)",
        "steps": [
          "1. Client (Algorithmic Trader / FIX Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (FIX Protocol Gateway & Risk Check) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (In-Memory Order Book (Price-Time Priority)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Post-Trade Clearing & Settlement Ledger) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Synchronous Persistence Trap: 'Can we insert each stock order into PostgreSQL before matching?'",
        "juniorAnswer": "Write each order to a relational database with an ACID transaction, then run matching.",
        "staffRebuttal": "Disk transactions in PostgreSQL take 5 to 20 milliseconds—20,000 times too slow for electronic stock exchanges that require sub-microsecond latency. Staff engineers execute order matching 100% in CPU memory, using single-threaded lock-free ring buffers, while asynchronously streaming trade logs to sequential NVMe WAL journals."
      },
      {
        "trapTitle": "The Multi-Threaded Order Book Lock Trap: 'Why not use 32 threads with ConcurrentHashMap to match orders faster?'",
        "juniorAnswer": "Use a multi-threaded thread pool with ConcurrentHashMap and synchronized locks.",
        "staffRebuttal": "Multi-threaded locking on a single order book creates severe CPU cache-line bouncing (False Sharing) and mutex contention, degrading throughput by 90%. Staff engineers pin 1 single thread to 1 dedicated CPU core per ticker symbol (e.g. Core 1 matches AAPL, Core 2 matches TSLA). Single-threaded execution eliminates locks entirely, processing 5M+ matches/second per core."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,000,000 Orders/Sec • Sub-Microsecond, 100M Orders/Day • Multi-Asset)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "hotel_booking_airbnb": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Guaranteed Zero Overlapping Double-Bookings",
        "detail": "Prevent overlapping date range reservations across millions of listings using database range exclusion constraints."
      },
      {
        "id": "FR2",
        "title": "Sub-50ms Date Range Availability Search",
        "detail": "Filter millions of available properties for specific check-in/check-out dates using in-memory 365-bit calendar bitmaps."
      },
      {
        "id": "FR3",
        "title": "Two-Phase Reservation Hold & Payment Saga",
        "detail": "Hold dates for 10 minutes while customer completes payment, automatically releasing held dates on failure or timeout."
      }
    ],
    "outOfScope": [
      "Dynamic pricing machine learning revenue optimization models",
      "Host damage deposit insurance dispute arbitration portal",
      "Multi-calendar external iCal / Google Calendar two-way synchronization"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "10,000 Availability Searches/Sec • 200 Booking/s Peak • 10M Listings • 100M Bookings/Year",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/reservations/hold",
        "purpose": "Reserve room for specific date range with temporary 10-minute hold",
        "requestSample": "{ \"listingId\": \"lst_999\", \"checkIn\": \"2026-10-10\", \"checkOut\": \"2026-10-15\", \"guestId\": \"gst_123\" }",
        "responseSample": "{ \"holdToken\": \"hld_555\", \"expiresAt\": \"2026-10-29T00:10:00Z\", \"totalPriceCents\": 75000 }"
      }
    ],
    "coreEntities": [
      {
        "name": "ListingReservation",
        "attributes": "reservation_id (PK), listing_id, guest_id, stay_range (TSRANGE), status (HOLD|CONFIRMED|CANCELLED), total_cents",
        "description": "Reservation record with PostgreSQL GiST exclusion constraint."
      },
      {
        "name": "ListingCalendar",
        "attributes": "listing_id (PK), year, availability_bitmap (BIT(365)), nightly_price_cents",
        "description": "365-day availability cache."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Airbnb / Hotel Reservation System)",
        "steps": [
          "1. Client (Guest Mobile App / Web Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway & Auth Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Booking Orchestrator Service) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Host Notification Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Airbnb / Hotel Reservation System)",
        "steps": [
          "1. Client (Guest Mobile App / Web Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway & Auth Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Booking Orchestrator Service) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Host Notification Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Date Overlap Race Condition Trap: 'Two users try to book Oct 10 - Oct 14 simultaneously.'",
        "juniorAnswer": "Check with `SELECT count(*) FROM bookings WHERE check_in < end AND check_out > start`; if 0, then INSERT.",
        "staffRebuttal": "Between the SELECT and the INSERT, both transactions see 0 conflicts and both execute the INSERT, creating a double-booking disaster. Staff engineers use PostgreSQL GiST Exclusion Constraints: `ADD CONSTRAINT no_overlap EXCLUDE USING gist (listing_id WITH =, stay_range WITH &&)`. The database engine guarantees at the storage engine level that two overlapping ranges for the same listing can NEVER be inserted concurrently."
      },
      {
        "trapTitle": "The 365 Days Row Explosion Trap: 'Storing 365 rows per listing in an availability table.'",
        "juniorAnswer": "Create an `availability` table with 365 rows per year for every listing (3.65 billion rows).",
        "staffRebuttal": "Querying billions of calendar rows for simple date searches causes massive disk I/O and cache misses. Staff engineers store availability as a 365-bit string (46 bytes!) in Redis / PostgreSQL: bit 0 is Jan 1st, bit 364 is Dec 31st. Checking if 5 days are open is a single bitwise AND operation that executes in nanoseconds."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (10,000 Availability Searches/Sec • 200 Booking/s, 10M Listings • 100M Bookings/Year)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "crypto_wallet_ledger": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Zero-Loss Multi-Party Computation (MPC) Key Custody",
        "detail": "Sign cryptocurrency withdrawals using threshold cryptography (2-of-3 shards) across isolated HSMs with zero single points of private key failure."
      },
      {
        "id": "FR2",
        "title": "Immutable Cryptographic Ledger Accounting",
        "detail": "Maintain append-only double-entry balance accounting with SHA-256 hash chaining to guarantee mathematical zero-sum balance integrity."
      },
      {
        "id": "FR3",
        "title": "Deep Block Confirmation Re-org Protection",
        "detail": "Track on-chain mempool status and enforce minimum block confirmations before crediting user balances."
      }
    ],
    "outOfScope": [
      "Automated high-frequency market making algorithmic bot strategies",
      "Fiat currency bank wire SWIFT settlement integration",
      "Decentralized exchange (DEX) AMM liquidity pool smart contract deployment"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "10,000 Transfers/Sec • Strict Cold/Hot Security Peak • 100M Wallets • $100B Assets Under Custody",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/wallets/withdraw",
        "purpose": "Initiate cryptocurrency withdrawal to external blockchain address",
        "requestSample": "{ \"asset\": \"BTC\", \"amount\": \"1.50000000\", \"destinationAddress\": \"bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\", \"totpCode\": \"491823\" }",
        "responseSample": "{ \"withdrawalId\": \"wth_101\", \"status\": \"PENDING_CONFIRMATION\", \"txHash\": \"0x4a8f9...\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "CustodyLedgerEntry",
        "attributes": "entry_id (PK), wallet_id, currency, type (DEBIT|CREDIT), amount_satoshis, prev_hash, curr_hash, created_at",
        "description": "Cryptographically chained immutable ledger."
      },
      {
        "name": "BlockchainTx",
        "attributes": "tx_hash (PK), asset, broadcast_status, block_height, confirmations, fee_satoshis",
        "description": "On-chain transaction tracking record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Coinbase / Crypto Custody Ledger)",
        "steps": [
          "1. Client (Crypto App Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Zero-Trust Security Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Transfer Verification & Double-Spend Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Block Confirmation Indexer) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Coinbase / Crypto Custody Ledger)",
        "steps": [
          "1. Client (Crypto App Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Zero-Trust Security Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Transfer Verification & Double-Spend Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Block Confirmation Indexer) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Single Private Key Storage Catastrophe: 'Store private keys encrypted in a database with KMS.'",
        "juniorAnswer": "Encrypt private keys with AWS KMS and store them in PostgreSQL.",
        "staffRebuttal": "If a rogue engineer or compromised server obtains the database and KMS decrypt permission, 100% of customer funds ($100B) can be drained in one second with zero recovery. Staff engineers use Multi-Party Computation (MPC) or Multi-Sig: private keys are split into mathematical shares across air-gapped enclaves; signing requires a threshold quorum and cannot be triggered by a single compromised database."
      },
      {
        "trapTitle": "The Blockchain Reorganization (Re-org) Trap: 'Credit user account immediately when transaction appears in mempool.'",
        "juniorAnswer": "Credit user balance as soon as the transaction is visible on the blockchain (0 or 1 confirmation).",
        "staffRebuttal": "Miners can produce competing blocks, causing a 1-to-3 block reorganization (re-org) where the unconfirmed transaction is orphaned. Attackers can execute a Double-Spend Attack: deposit on 1 confirmation, withdraw instantly, and re-org the deposit away. Staff engineers require 6+ confirmations on Bitcoin and 32+ on Ethereum before crediting user balances."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (10,000 Transfers/Sec • Strict Cold/Hot Security, 100M Wallets • $100B Assets Under Custody)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "digital_wallet_p2p": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second P2P Internal Wallet Transfers",
        "detail": "Transfer funds between peer user wallets in under 200ms with strict ACID transactional guarantees."
      },
      {
        "id": "FR2",
        "title": "Guaranteed Idempotency & Zero Double-Transfer Protection",
        "detail": "Prevent duplicate fund deductions on mobile network retries via client-side idempotency keys."
      },
      {
        "id": "FR3",
        "title": "Automated Linked Bank Top-Up (ACH / FedNow)",
        "detail": "Seamlessly bridge wallet deficits by orchestrating automated bank pulls over national payment rails."
      }
    ],
    "outOfScope": [
      "International multi-currency cross-border FX spot trading desk",
      "Cryptocurrency trading and decentralized liquidity swap",
      "Physical plastic debit card chip-and-PIN POS issuing infrastructure"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "20,000 Transfer Requests/Sec • Strict ACID Peak • 400M Users • 1B Transfers/Mo",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/transfers",
        "purpose": "Transfer money from sender wallet to recipient wallet with idempotency guarantee",
        "requestSample": "Header: Idempotency-Key: e4b2d1-9988\\nBody: { 'recipientEmail': 'alice@example.com', 'amountCents': 5000, 'currency': 'USD', 'note': 'Dinner' }",
        "responseSample": "{ \"transferId\": \"txn_888\", \"status\": \"COMPLETED\", \"senderNewBalanceCents\": 12500 }"
      }
    ],
    "coreEntities": [
      {
        "name": "WalletAccount",
        "attributes": "account_id (PK), user_id, currency, balance_cents, status (ACTIVE|FROZEN), updated_at",
        "description": "User wallet account profile."
      },
      {
        "name": "LedgerJournal",
        "attributes": "journal_id (PK), transfer_id, from_account_id, to_account_id, amount_cents, currency, timestamp",
        "description": "Immutable financial audit record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design PayPal / Peer-to-Peer Balance Transfer)",
        "steps": [
          "1. Client (Sender Mobile Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway with Idempotency Guard) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Two-Phase Balance Transfer Orchestrator) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Recipient Instant Transfer Alert Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design PayPal / Peer-to-Peer Balance Transfer)",
        "steps": [
          "1. Client (Sender Mobile Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway with Idempotency Guard) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Two-Phase Balance Transfer Orchestrator) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Recipient Instant Transfer Alert Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Deadlock on Cross-Transfers Trap: 'User A sends $10 to User B while User B sends $10 to User A.'",
        "juniorAnswer": "Lock account A, then lock account B in code.",
        "staffRebuttal": "If Thread 1 locks A and waits for B, while Thread 2 locks B and waits for A, a classic Database Deadlock crashes both transactions. Staff engineers enforce Global Lock Ordering: always acquire locks in ascending order of Account ID (`min(A, B)` then `max(A, B)`), mathematically eliminating deadlocks."
      },
      {
        "trapTitle": "The Negative Balance Overdraft Race Condition: 'User sends $50 twice simultaneously with only $50 in their account.'",
        "juniorAnswer": "Read balance with SELECT; if >= $50, perform two separate transfers.",
        "staffRebuttal": "Both transactions check the balance simultaneously, see $50, and both deduct $50, leaving the account at -$50. Staff engineers use database atomic check-and-update: `UPDATE accounts SET balance = balance - 50 WHERE account_id = ? AND balance >= 50`. The second query matches 0 rows and fails cleanly."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (20,000 Transfer Requests/Sec • Strict ACID, 400M Users • 1B Transfers/Mo)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "credit_card_fraud_detection": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Real-Time Payment Fraud Scoring",
        "detail": "Score incoming card transactions (25,000 QPS) for fraud risk and return an auth decision in <50ms."
      },
      {
        "id": "FR2",
        "title": "Real-Time Streaming Feature Calculation (<5ms)",
        "detail": "Compute rolling velocity features (velocity, geographic travel speed) using in-memory Redis feature stores."
      },
      {
        "id": "FR3",
        "title": "Deterministic Anti-Fraud Rules & Fallback",
        "detail": "Enforce hard blacklist and card status rules in parallel with ML inference to catch stolen cards instantly."
      }
    ],
    "outOfScope": [
      "Chargeback dispute document evidence submission portal",
      "Offline multi-week neural network model hyperparameter retraining",
      "Physical plastic card manufacturing and embosser integration"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Payment Authorizations/Sec Peak • 100M Transactions/Day • Sub-50ms Decision",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/fraud/score",
        "purpose": "Evaluate transaction for fraud probability and return auth decision",
        "requestSample": "{ \"cardToken\": \"tok_991823\", \"amountCents\": 125000, \"merchantCategory\": \"JEWELRY\", \"lat\": 40.7128, \"lng\": -74.0060 }",
        "responseSample": "{ \"verdict\": \"CHALLENGE_3DS\", \"fraudScore\": 742, \"reason\": \"IMPOSSIBLE_TRAVEL_VELOCITY\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "AuthTransaction",
        "attributes": "tx_id (PK), card_token, amount_cents, merchant_id, fraud_score, decision (APPROVE|DECLINE|CHALLENGE), created_at",
        "description": "Payment authorization audit log."
      },
      {
        "name": "CardholderFeatureSnapshot",
        "attributes": "card_token (PK), tx_count_5m, total_amount_1h, last_lat, last_lng, last_tx_timestamp",
        "description": "Real-time velocity features in Redis."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Visa / Real-Time Credit Card Fraud Scorer)",
        "steps": [
          "1. Client (Merchant POS / Payment Terminal) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Card Network Ingestion Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Real-Time Feature Store (Feast / Redis)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Authorization Decision Issuer) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Visa / Real-Time Credit Card Fraud Scorer)",
        "steps": [
          "1. Client (Merchant POS / Payment Terminal) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Card Network Ingestion Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Real-Time Feature Store (Feast / Redis)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Authorization Decision Issuer) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The SQL History Scan Latency Trap: 'Querying historical transactions in PostgreSQL to calculate 5-minute velocity.'",
        "juniorAnswer": "Query `SELECT COUNT(*) FROM transactions WHERE card_id = ? AND created_at > NOW() - INTERVAL 5 MINUTE` in SQL.",
        "staffRebuttal": "Running historical range scans in a relational database for 25,000 transactions per second will exhaust database disk I/O and take 50ms to 200ms—violating the payment network SLA. Staff engineers use Real-Time Streaming Feature Stores (Feast on Redis): a sliding window counter is maintained in Redis RAM using Redis hashes or sorted sets, returning current velocity in <2ms."
      },
      {
        "trapTitle": "The ML Engine Downtime Black Hole: 'What happens if the GPU ML inference cluster crashes?'",
        "juniorAnswer": "Block all payments until the ML model servers restart.",
        "staffRebuttal": "Halting payments halts commerce globally, causing millions of dollars in fines and reputational ruin. Staff engineers implement Fail-Safe Standby Rule Engine: if the ML inference cluster times out (>30ms) or goes offline, the gateway falls back immediately to deterministic heuristic rules (e.g. allow transactions under $50 for low-risk merchants, challenge higher amounts via SMS OTP)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Payment Authorizations/Sec, 100M Transactions/Day • Sub-50ms Decision)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "usage_based_billing_stripe": {
    "inScope": [
      {
        "id": "FR1",
        "title": "High-Throughput Usage Event Ingestion (50k QPS)",
        "detail": "Ingest 1 billion daily API consumption events reliably with sub-5ms gateway response times."
      },
      {
        "id": "FR2",
        "title": "Exactly-Once Stream Window Aggregation",
        "detail": "Aggregate usage metrics across hourly and daily windows with zero double-counting using Flink checkpoints."
      },
      {
        "id": "FR3",
        "title": "Complex Tiered Pricing & Monthly Invoice Generation",
        "detail": "Evaluate volume tiers, overages, and minimum commitments at billing cycle cutoff to generate invoices."
      }
    ],
    "outOfScope": [
      "Custom enterprise manual invoice PDF design layout visualizer",
      "Corporate debt collection agency legal referral workflow",
      "Prepaid enterprise credits bank wire currency conversion"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Metered Events/Sec • Exactly-Once Peak • 1B API Events/Day • Complex Pricing Tiers",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/metering/events",
        "purpose": "Ingest usage-based consumption event with idempotency deduplication",
        "requestSample": "{ \"customerId\": \"cus_99\", \"eventName\": \"ai_tokens\", \"value\": 500, \"idempotencyKey\": \"evt_abc_123\", \"timestamp\": 1729000000 }",
        "responseSample": "HTTP 202 Accepted"
      }
    ],
    "coreEntities": [
      {
        "name": "UsageEvent",
        "attributes": "event_id (PK), customer_id, event_name, value, idempotency_key, timestamp",
        "description": "Raw metered usage record."
      },
      {
        "name": "UsageRollup",
        "attributes": "customer_id, event_name, window_start (Compound PK), total_value, is_billed",
        "description": "Pre-aggregated hourly billing bucket in ClickHouse."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Stripe / Usage-Based API Metering & Invoicing)",
        "steps": [
          "1. Client (Customer SaaS API Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Metering Ingestion Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Flink Window Aggregator (Hourly / Daily)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Invoice Generator & Auto-Collector) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Stripe / Usage-Based API Metering & Invoicing)",
        "steps": [
          "1. Client (Customer SaaS API Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Metering Ingestion Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Flink Window Aggregator (Hourly / Daily)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Invoice Generator & Auto-Collector) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Write Amplification Trap: 'Writing 50,000 usage events directly to PostgreSQL every second.'",
        "juniorAnswer": "Insert each usage event into a PostgreSQL table with an INSERT query.",
        "staffRebuttal": "50,000 writes/sec will saturate PostgreSQL disk I/O, blow up WAL size, and lock tables during monthly invoice generation. Staff engineers stream raw events to Kafka, process and aggregate in memory with Apache Flink, and write bulk 1-minute rollups to ClickHouse, reducing database write operations by 99.9%."
      },
      {
        "trapTitle": "The Late-Arriving Event Billing Skew: 'Customer submits events for yesterday after the invoice is already closed.'",
        "juniorAnswer": "Silently discard any events that arrive after the midnight billing cutoff.",
        "staffRebuttal": "Discarding events causes under-billing and contract disputes. Staff engineers implement an Adjustment Ledger: closed invoices are immutable. Any late-arriving events within a 72-hour window are captured and added as an 'Invoice Adjustment / Overage Correction' credit or debit line item on the customer's NEXT monthly invoice."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Metered Events/Sec • Exactly-Once, 1B API Events/Day • Complex Pricing Tiers)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "bank_wire_transfer_iso20022": {
    "inScope": [
      {
        "id": "FR1",
        "title": "ISO 20022 XML Schema Validation & Ingestion",
        "detail": "Parse and validate high-value interbank credit transfer XML payloads (pacs.008) with cryptographic mTLS authentication."
      },
      {
        "id": "FR2",
        "title": "Mandatory Dual-Control (Four-Eyes) Authorization",
        "detail": "Enforce corporate policy requiring secondary executive cryptographic signature for wires exceeding thresholds."
      },
      {
        "id": "FR3",
        "title": "Zero-Loss SWIFT Settlement & End-of-Day Reconciliation",
        "detail": "Transmit wires to central bank payment rails (Fedwire/SWIFT) and reconcile daily debit/credit zero-sum balances."
      }
    ],
    "outOfScope": [
      "Retail micro-payment peer-to-peer mobile app UI",
      "Foreign exchange algorithmic currency market making",
      "Physical paper check imaging and MICR optical scan clearing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "2,000 High-Value Wires/Sec • Strict CP Peak • 10M Wires/Day • $10 Trillion Daily Volume",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/wires/iso20022/dispatch",
        "purpose": "Submit ISO 20022 pacs.008 payment instruction for interbank wire settlement",
        "requestSample": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08\">...</Document>",
        "responseSample": "{ \"wireReference\": \"WIRE_20261029_001\", \"status\": \"PENDING_APPROVAL\", \"pacsStatus\": \"ACTC\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "WireInstruction",
        "attributes": "end_to_end_id (PK), uetr (UUID), debtor_iban, creditor_iban, amount_cents, currency, status (SUBMITTED|APPROVED|CLEARED|REJECTED)",
        "description": "ISO 20022 payment instruction record."
      },
      {
        "name": "SanctionsScreeningAudit",
        "attributes": "uetr (PK), debtor_match_score, creditor_match_score, matched_entity_id, cleared_by_officer",
        "description": "OFAC compliance audit record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Core Banking / ISO 20022 High-Value Wire Settlement)",
        "steps": [
          "1. Client (Corporate Treasury ERP Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (ISO 20022 XML Schema & mTLS Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (OFAC Sanctions & AML Watchlist Screener) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (End-of-Day Pacs.002 Acknowledgment & Recon Daemon) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Core Banking / ISO 20022 High-Value Wire Settlement)",
        "steps": [
          "1. Client (Corporate Treasury ERP Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (ISO 20022 XML Schema & mTLS Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (OFAC Sanctions & AML Watchlist Screener) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (End-of-Day Pacs.002 Acknowledgment & Recon Daemon) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The High-Value In-Flight Lost Message Trap: 'Network connection drops while transmitting a $100M wire to SWIFT.'",
        "juniorAnswer": "Retry sending the wire request again immediately.",
        "staffRebuttal": "Blindly retrying a $100M wire can result in duplicate settlement, causing massive financial catastrophe. Staff engineers enforce Unique End-to-End Transaction References (UETR): the UETR UUID is generated once and embedded into the pacs.008 message. SWIFT network gateways deduplicate by UETR. If a timeout occurs, the system polls the SWIFT confirmation tracking API (`pacs.002`) before ever retransmitting."
      },
      {
        "trapTitle": "The Sanctions Screener False Negative Trap: 'Attacker slightly misspell a sanctioned terrorist name to evade filter.'",
        "juniorAnswer": "Run exact string matching: `if (beneficiary_name == sanctioned_name)`.",
        "staffRebuttal": "Exact matching is easily bypassed by typos (e.g. 'Osama' vs 'Usama'). Staff engineers use Fuzzy String Matching (Jaro-Winkler, Levenshtein distance, Soundex) and transliteration tokenizers running against OFAC/UN sanction lists, generating an alert if fuzzy similarity exceeds 85%."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (2,000 High-Value Wires/Sec • Strict CP, 10M Wires/Day • $10 Trillion Daily Volume)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "e_commerce_cart_service": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-20ms High-Throughput Cart CRUD Operations",
        "detail": "Add, remove, and update cart item quantities with <20ms latency across 100M active shopping carts."
      },
      {
        "id": "FR2",
        "title": "Seamless Anonymous-to-Authenticated Cart Merge",
        "detail": "Automatically merge guest shopping carts into user account carts upon customer login without dropping items."
      },
      {
        "id": "FR3",
        "title": "Dynamic Coupon & Discount Subtotal Calculation",
        "detail": "Recalculate promotional discounts and line-item subtotals instantly upon cart mutation."
      }
    ],
    "outOfScope": [
      "Payment credit card tokenization and bank authorization",
      "Warehouse physical picking and packing routing",
      "Customer product review rating submission"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Cart Updates/Sec • Sub-20ms Peak • 100M Active Carts • 50M Merchants",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "PUT",
        "endpoint": "/api/v1/cart/items",
        "purpose": "Add or update quantity of product variant in active shopping cart",
        "requestSample": "{ \"cartId\": \"crt_123\", \"variantId\": \"var_999\", \"quantity\": 2 }",
        "responseSample": "{ \"cartId\": \"crt_123\", \"itemCount\": 2, \"subtotalCents\": 5000, \"items\": [{ \"variantId\": \"var_999\", \"quantity\": 2, \"priceCents\": 2500 }] }"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/cart/merge",
        "purpose": "Merge anonymous guest cart into user account cart upon login",
        "requestSample": "{ \"guestCartId\": \"crt_guest_111\", \"userCartId\": \"crt_user_222\" }",
        "responseSample": "{ \"cartId\": \"crt_user_222\", \"itemCount\": 5, \"mergedStatus\": \"SUCCESS\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "ShoppingCart",
        "attributes": "cart_id (PK), customer_id, items (JSON array of [variant_id, qty, price]), coupon_code, updated_at, expires_at",
        "description": "Active shopping cart document in DynamoDB."
      },
      {
        "name": "CheckoutSnapshot",
        "attributes": "checkout_id (PK), cart_id, frozen_items_json, locked_subtotal_cents, tax_cents, shipping_cents",
        "description": "Immutable checkout state."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Shopify / High-Scale Shopping Cart Service)",
        "steps": [
          "1. Client (Shopper Mobile / Web Browser) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway & Edge Session Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Distributed In-Memory Cart DB (DynamoDB / Redis)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Checkout State Handoff Coordinator) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Shopify / High-Scale Shopping Cart Service)",
        "steps": [
          "1. Client (Shopper Mobile / Web Browser) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway & Edge Session Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Distributed In-Memory Cart DB (DynamoDB / Redis)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Checkout State Handoff Coordinator) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Cart Inventory Lock Hoarding Trap: 'Locking inventory stock whenever a user adds an item to cart.'",
        "juniorAnswer": "Decrement inventory stock immediately when user adds item to cart.",
        "staffRebuttal": "Locking stock on add-to-cart allows competitors or bots to add all inventory to carts and abandon them, taking entire stores out of stock without paying a dime. Staff engineers never lock stock in cart: cart only holds desired quantities; inventory is only hard-reserved during checkout with a strict 10-minute hold timer."
      },
      {
        "trapTitle": "The Multi-Tab Cart Overwrite Race Condition: 'User opens two browser tabs and modifies the cart concurrently.'",
        "juniorAnswer": "Whichever tab sends the last HTTP PUT overwrites the cart document in database.",
        "staffRebuttal": "Overwriting carts causes items added in Tab 1 to disappear when Tab 2 saves. Staff engineers use Optimistic Locking with version numbers (`version = version + 1`) or CRDTs: each cart item mutation is treated as an atomic operation (e.g. `ADD(variant_123, qty: 1)`), merging concurrent additions cleanly."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Cart Updates/Sec • Sub-20ms, 100M Active Carts • 50M Merchants)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "buy_now_pay_later_klarna": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-500ms Real-Time Credit Underwriting",
        "detail": "Evaluate shopper fraud and repayment risk in under 500ms during checkout without degrading merchant conversion."
      },
      {
        "id": "FR2",
        "title": "Automated Pay-in-4 Installment Schedule Generation",
        "detail": "Split order into 4 equal bi-weekly payments, charging first 25% down payment at checkout."
      },
      {
        "id": "FR3",
        "title": "Guaranteed Immediate Merchant Settlement",
        "detail": "Disburse full payment (minus merchant fee) to merchant escrow ledger regardless of customer default risk."
      }
    ],
    "outOfScope": [
      "Long-term 36-month high-interest revolving loan financing",
      "Physical plastic BNPL credit card issuing",
      "Third-party collection agency legal debt sale syndication"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "5,000 Checkout Underwriting Decisions/Sec • Sub-Second Peak • 50M Shoppers • 1M Orders/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/bnpl/underwrite",
        "purpose": "Evaluate customer creditworthiness and approve Pay-in-4 installment plan",
        "requestSample": "{ \"userId\": \"usr_99\", \"orderAmountCents\": 20000, \"merchantId\": \"mch_nike\", \"billingAddress\": { \"zip\": \"94105\" } }",
        "responseSample": "{ \"decision\": \"APPROVED\", \"planId\": \"pln_101\", \"schedule\": [{ \"dueDate\": \"2026-10-29\", \"amountCents\": 5000 }, { \"dueDate\": \"2026-11-12\", \"amountCents\": 5000 }] }"
      }
    ],
    "coreEntities": [
      {
        "name": "BnplPlan",
        "attributes": "plan_id (PK), customer_id, merchant_id, total_amount_cents, remaining_balance_cents, status (ACTIVE|PAID_OFF|DEFAULTED)",
        "description": "Installment loan master contract."
      },
      {
        "name": "InstallmentSchedule",
        "attributes": "installment_id (PK), plan_id, installment_number (1..4), due_date, amount_cents, status (PAID|PENDING|FAILED)",
        "description": "Individual payment schedule record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Klarna / Buy Now Pay Later Instant Underwriting)",
        "steps": [
          "1. Client (Merchant BNPL Checkout Widget) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (BNPL Ingestion & Device Fingerprinting Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Installment Schedule & Fee Calculator) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Dunning & Late Payment Collection Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Klarna / Buy Now Pay Later Instant Underwriting)",
        "steps": [
          "1. Client (Merchant BNPL Checkout Widget) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (BNPL Ingestion & Device Fingerprinting Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Installment Schedule & Fee Calculator) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Dunning & Late Payment Collection Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Multi-Merchant Fraud Attack Trap: 'Fraudster opens 10 checkout tabs across 10 merchants and spends $10,000 simultaneously.'",
        "juniorAnswer": "Check user current outstanding balance; if under $1,000 limit, approve each loan.",
        "staffRebuttal": "If all 10 checkouts happen within 5 seconds, all 10 see $0 outstanding balance and approve $10,000 in fraudulent loans (loan stacking). Staff engineers implement Global Distributed Reservations: the first request locks the user's credit line in Redis with an atomic hold. Subsequent concurrent underwriting requests detect the in-flight reservation and reject or queue."
      },
      {
        "trapTitle": "The Expired Card Installment Failure Trap: 'Customer debit card expires or is cancelled before installment #3.'",
        "juniorAnswer": "Send 1 error email; if no reply, write off the loan as bad debt.",
        "staffRebuttal": "Writing off loans prematurely causes massive credit loss. Staff engineers implement Smart Dunning Workflows: integrate with Visa/Mastercard Account Updater to automatically fetch refreshed card expiration dates; send automated SMS payment links; and apply progressive restrictions (pause customer account from new checkouts until resolved)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (5,000 Checkout Underwriting Decisions/Sec • Sub-Second, 50M Shoppers • 1M Orders/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "e_signature_docusign": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Cryptographic X.509 PKI Document Sealing",
        "detail": "Apply tamper-evident cryptographic digital signatures via HSMs such that any modification breaks the PDF validity."
      },
      {
        "id": "FR2",
        "title": "Multi-Party Sequential Signing State Machine",
        "detail": "Orchestrate sequential signing flows across multiple recipients with automatic routing upon each signature."
      },
      {
        "id": "FR3",
        "title": "Immutable WORM Storage & Audit Certificate",
        "detail": "Archive completed documents in Write-Once-Read-Many storage and issue legal Certificates of Completion."
      }
    ],
    "outOfScope": [
      "Real-time webcam biometric face recognition identity verification",
      "Automated contract legal clause semantic NLP comparison",
      "Printed paper physical mail notary dispatch"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "2,000 Signing Events/Sec • Strict Tamper-Proof Peak • 100M Contracts/Year • Legally Binding",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/envelopes/:envelopeId/sign",
        "purpose": "Apply signature and cryptographically seal document",
        "requestSample": "{ \"recipientId\": \"rec_01\", \"signatureImageBase64\": \"...\", \"clientIp\": \"198.51.100.1\" }",
        "responseSample": "{ \"status\": \"COMPLETED\", \"sha256Digest\": \"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "Envelope",
        "attributes": "envelope_id (PK), sender_id, status (SENT|DELIVERED|COMPLETED|DECLINED), sha256_hash, created_at, completed_at",
        "description": "Contract transaction envelope."
      },
      {
        "name": "EnvelopeRecipient",
        "attributes": "recipient_id (PK), envelope_id, routing_order, status, signed_at, ip_address",
        "description": "Signer tracking record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design DocuSign / Cryptographic Contract Signing)",
        "steps": [
          "1. Client (Signer Web / Mobile Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Signature API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Hardware Security Module (HSM) PKI Signer) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Certificate of Completion Auditor) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design DocuSign / Cryptographic Contract Signing)",
        "steps": [
          "1. Client (Signer Web / Mobile Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Signature API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Hardware Security Module (HSM) PKI Signer) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Certificate of Completion Auditor) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Visual Image as Signature Trap: 'Saving a PNG image of the user signature on top of the PDF.'",
        "juniorAnswer": "Draw the signature image on the canvas and save it as a new PDF.",
        "staffRebuttal": "An image pasted onto a PDF has zero legal standing in court because anyone with Acrobat can edit the text underneath while leaving the signature image intact. Staff engineers use Cryptographic Digital Signatures (PKI / X.509): the HSM hashes the entire PDF byte content with SHA-256 and encrypts the hash with the private key. If even 1 comma in the document is altered, Adobe Acrobat flags 'DOCUMENT TAMPERED AND INVALID'."
      },
      {
        "trapTitle": "The Overwriting Signed Contract Trap: 'Overwriting the contract in S3 when the next signer signs.'",
        "juniorAnswer": "Overwrite `contract.pdf` in S3 with the new signed version.",
        "staffRebuttal": "Overwriting destroys the intermediate legal audit trail. Staff engineers maintain an immutable version history: each signature creates a new cryptographically chained revision (`contract_v1.pdf`, `contract_v2.pdf`), culminating in a finalized WORM (Write Once Read Many) locked document that cannot be deleted or overwritten by anyone, including root administrators."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (2,000 Signing Events/Sec • Strict Tamper-Proof, 100M Contracts/Year • Legally Binding)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "credit_scoring_engine": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-100ms FICO / VantageScore Credit Scoring",
        "detail": "Calculate credit scores (300 to 850) dynamically in <100ms using multi-pillar actuarial models across 10,000 QPS."
      },
      {
        "id": "FR2",
        "title": "Permissible Purpose & FCRA Compliance Gatekeeper",
        "detail": "Enforce strict legal compliance, auditing lender consent and recording hard vs soft inquiries."
      },
      {
        "id": "FR3",
        "title": "Fuzzy Consumer Identity Resolution",
        "detail": "Match consumer trade lines across maiden names, address typos, and SSN verification."
      }
    ],
    "outOfScope": [
      "Direct consumer credit freeze and fraud alert self-service portal",
      "Manual credit bureau dispute paper investigation workflow",
      "Commercial corporate Dunn & Bradstreet rating underwriting"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "10,000 Score Calculations/Sec • P99 < 100ms Peak • 200M Consumers • Hundreds of Credit Bureaus",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/credit/score",
        "purpose": "Calculate consumer credit score and return risk factors",
        "requestSample": "{ \"ssn\": \"xxx-xx-1234\", \"dob\": \"1985-05-15\", \"inquiryType\": \"HARD\", \"lenderId\": \"chase_bank\" }",
        "responseSample": "{ \"score\": 745, \"rating\": \"VERY_GOOD\", \"factors\": [\"LENGTH_OF_CREDIT_HISTORY\", \"LOW_DELINQUENCY\"], \"inquiryId\": \"inq_99\" }"
      }
    ],
    "coreEntities": [
      {
        "name": "CreditTradeLine",
        "attributes": "trade_id (PK), consumer_pin, lender_name, account_type, credit_limit_cents, current_balance_cents, payment_status_history",
        "description": "Individual credit line record."
      },
      {
        "name": "ConsumerInquiry",
        "attributes": "inquiry_id (PK), consumer_pin, lender_id, inquiry_type (HARD|SOFT), timestamp",
        "description": "Inquiry audit log."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Experian / Real-Time Credit Score Calculation)",
        "steps": [
          "1. Client (Lender Underwriting Client (Bank / Card)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Credit Bureau Secure API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Credit History DB (ScyllaDB / CockroachDB)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Inquiry Logging & Audit Trail Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Experian / Real-Time Credit Score Calculation)",
        "steps": [
          "1. Client (Lender Underwriting Client (Bank / Card)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Credit Bureau Secure API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Credit History DB (ScyllaDB / CockroachDB)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Inquiry Logging & Audit Trail Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Hard Inquiry Race Condition Trap: 'Consumer applies for 10 credit cards in 60 seconds.'",
        "juniorAnswer": "Read inquiry count, calculate score, then write the inquiry to the database later.",
        "staffRebuttal": "Writing inquiries asynchronously allows consumers to apply at 10 banks simultaneously before any inquiry registers, enabling massive loan stacking fraud. Staff engineers execute an atomic read-and-log transaction: the hard inquiry is recorded and committed BEFORE the score calculation returns, immediately updating the consumer's inquiry count."
      },
      {
        "trapTitle": "The Floating Point Calculation Drift: 'Calculating credit utilization percentages with IEEE 754 floats.'",
        "juniorAnswer": "Use `float balance / limit` to calculate credit card utilization ratio.",
        "staffRebuttal": "Binary floating-point arithmetic (IEEE 754) introduces precision errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), causing rounding errors that change FICO scores by 1 point and trigger regulatory audits. Staff engineers use fixed-point arithmetic (`BigDecimal` / integer cents) for all credit calculations."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (10,000 Score Calculations/Sec • P99 < 100ms, 200M Consumers • Hundreds of Credit Bureaus)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "digital_signature_pki": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Automated X.509 Certificate Issuance via ACME Protocol",
        "detail": "Issue TLS certificates automatically within 10 seconds following automated domain ownership verification."
      },
      {
        "id": "FR2",
        "title": "Sub-5ms OCSP Revocation Status Responding",
        "detail": "Serve Online Certificate Status Protocol (OCSP) revocation checks globally with sub-5ms latency from edge caches."
      },
      {
        "id": "FR3",
        "title": "Mandatory Certificate Transparency (CT) Log Submission",
        "detail": "Publish all issued certificates to public append-only cryptographic Merkle trees before delivery."
      }
    ],
    "outOfScope": [
      "Physical smartcard / YubiKey hardware token injection",
      "Manual enterprise Extended Validation (EV) corporate document verification",
      "Quantum-safe lattice-based post-quantum cryptography transition"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 OCSP Status Checks/Sec • Sub-5ms Peak • 1B Issued Certificates • Zero Private Key Leaks",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/acme/order",
        "purpose": "Initiate automated certificate order and receive domain verification challenge",
        "requestSample": "{ \"domains\": [\"example.com\", \"www.example.com\"] }",
        "responseSample": "{ \"orderId\": \"ord_77\", \"challenge\": { \"type\": \"dns-01\", \"dnsRecord\": \"_acme-challenge.example.com\", \"expectedValue\": \"abc123token\" } }"
      }
    ],
    "coreEntities": [
      {
        "name": "IssuedCertificate",
        "attributes": "serial_number (PK), domains_json, not_before, not_after, sct_proof, status (ACTIVE|REVOKED), issued_at",
        "description": "X.509 certificate record."
      },
      {
        "name": "RevocationList",
        "attributes": "serial_number (PK), revocation_reason, revoked_at",
        "description": "CRL / OCSP revocation index."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Cloud Cryptographic PKI Certificate Authority)",
        "steps": [
          "1. Client (ACME Protocol Client (Certbot / K8s)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Certificate Authority API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Issuing CA (Hardware Security Module HSM)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Certificate Inventory DB (CockroachDB)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Cloud Cryptographic PKI Certificate Authority)",
        "steps": [
          "1. Client (ACME Protocol Client (Certbot / K8s)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Certificate Authority API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Issuing CA (Hardware Security Module HSM)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Certificate Inventory DB (CockroachDB)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Online Root CA Private Key Disaster: 'Storing the Root CA private key on a production Linux server.'",
        "juniorAnswer": "Store `root_ca.key` on an EC2 instance with restricted chmod 400 permissions.",
        "staffRebuttal": "If a hacker compromises the server, the entire global Public Key Infrastructure is compromised, forcing the revocation of hundreds of millions of websites. Staff engineers keep Root CAs completely offline in air-gapped physical safes inside tamper-responsive HSMs. Online issuance is delegated to short-lived Intermediate CAs that can be revoked without invalidating the Root."
      },
      {
        "trapTitle": "The Missing Certificate Transparency Proof: 'Delivering the certificate before submitting to CT logs.'",
        "juniorAnswer": "Sign the certificate and return it immediately to the client.",
        "staffRebuttal": "Google Chrome and Apple Safari immediately reject any public TLS certificate that lacks Signed Certificate Timestamps (SCT) proof from public CT logs. Staff engineers submit the pre-certificate to at least 3 independent CT logs, embed the cryptographic SCT proofs directly into the certificate extensions, and only then return it to the client."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 OCSP Status Checks/Sec • Sub-5ms, 1B Issued Certificates • Zero Private Key Leaks)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "stock_portfolio_pnl": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Real-Time Portfolio PnL Updates (<100ms)",
        "detail": "Recalculate and stream live portfolio valuations and daily percentage returns over WebSockets as market prices change."
      },
      {
        "id": "FR2",
        "title": "Inverted Symbol-to-User Position Indexing",
        "detail": "Efficiently trigger PnL updates only for active investors holding tickers that moved in the latest price tick."
      },
      {
        "id": "FR3",
        "title": "Real-Time Margin Call Risk Evaluation",
        "detail": "Continuously evaluate investor margin debt against current portfolio equity, auto-alerting accounts breaching maintenance margin."
      }
    ],
    "outOfScope": [
      "Complex options multi-leg Black-Scholes volatility surface modeling",
      "Multi-year tax optimization automated tax-loss harvesting algorithm",
      "Cryptocurrency on-chain staking yield aggregation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Real-Time PnL Updates/Sec • Sub-Second Peak • 25M Portfolios • 10,000 Live Market Tickers",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/ws/v1/portfolio/realtime",
        "purpose": "Stream continuous real-time portfolio balance and PnL updates to active investor",
        "requestSample": "{ \"token\": \"jwt_user_123\", \"subscribe\": [\"TOTAL_EQUITY\", \"POSITIONS\"] }",
        "responseSample": "{ \"totalEquityCents\": 1542000, \"dayChangeCents\": 32500, \"dayChangePercent\": 2.15, \"timestamp\": 1729000000 }"
      }
    ],
    "coreEntities": [
      {
        "name": "UserPosition",
        "attributes": "user_id, symbol (Compound PK), quantity, avg_cost_basis_cents, updated_at",
        "description": "Active stock holding record."
      },
      {
        "name": "PriceTick",
        "attributes": "symbol (PK), last_price_cents, high_cents, low_cents, updated_at_ms",
        "description": "Real-time exchange market quote."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Robinhood / Real-Time Portfolio PnL Calculation)",
        "steps": [
          "1. Client (Investor Mobile App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Streaming Portfolio Gateway (WebSocket)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Market Price Ticker Stream (Kafka)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Real-Time Margin Call Monitor) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Robinhood / Real-Time Portfolio PnL Calculation)",
        "steps": [
          "1. Client (Investor Mobile App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Streaming Portfolio Gateway (WebSocket)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Market Price Ticker Stream (Kafka)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Real-Time Margin Call Monitor) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Fan-Out Broadcast Storm Trap: 'Recalculating all 25 million portfolios on every single stock price tick.'",
        "juniorAnswer": "When AAPL moves 1 cent, loop through all 25 million user portfolios and recalculate balance.",
        "staffRebuttal": "With 10,000 stocks moving 50 times per second, recalculating 25M portfolios continuously requires 12.5 billion calculations per second—instantly crashing servers. Staff engineers use an Inverted Index + Session Filter: only users currently watching their app screen (WebSocket connected) have their PnL recalculated, and only if they hold AAPL, reducing computation by 99.9%."
      },
      {
        "trapTitle": "The Database Calculation Locking Trap: 'Running SQL SUM queries to calculate user portfolio balance.'",
        "juniorAnswer": "Query `SELECT SUM(p.quantity * q.price) FROM positions p JOIN quotes q ...` on every market tick.",
        "staffRebuttal": "Running complex SQL JOIN queries on market ticks will saturate the database within 1 second. Staff engineers maintain position vectors entirely in Redis / Flink memory: a user's portfolio is a simple array `[ {AAPL: 10}, {TSLA: 5} ]`. When price updates arrive, calculating total value is a pure CPU vector dot product that executes in nanoseconds."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Real-Time PnL Updates/Sec • Sub-Second, 25M Portfolios • 10,000 Live Market Tickers)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "car_rental_reservation": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Category-Based Fleet Availability Search",
        "detail": "Search available vehicle categories across 10,000 airport/city locations for specific date ranges in <50ms."
      },
      {
        "id": "FR2",
        "title": "Zero Double-Allocation Booking Guarantee",
        "detail": "Manage category inventory counts with optimistic locking, preventing over-allocation beyond authorized capacity."
      },
      {
        "id": "FR3",
        "title": "Physical VIN Assignment & Gate Clearance",
        "detail": "Assign physical vehicles on arrival and authorize keyless gate access with pre-auth security deposit holds."
      }
    ],
    "outOfScope": [
      "Physical vehicle damage inspection computer vision scanner",
      "Used rental fleet auction remarketing trade platform",
      "Airport shuttle bus GPS real-time route tracker"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "5,000 Search QPS • 500 Bookings/Sec Peak • 1M Vehicles • 10,000 Locations Worldwide",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/rentals/reserve",
        "purpose": "Reserve car category for pickup location and dates",
        "requestSample": "{ \"locationId\": \"SFO_AIRPORT\", \"category\": \"SUV\", \"pickupDate\": \"2026-11-01\", \"returnDate\": \"2026-11-05\" }",
        "responseSample": "{ \"reservationId\": \"res_car_101\", \"category\": \"SUV\", \"status\": \"CONFIRMED\", \"estimatedTotalCents\": 32000 }"
      }
    ],
    "coreEntities": [
      {
        "name": "VehicleReservation",
        "attributes": "reservation_id (PK), customer_id, location_id, car_category, pickup_at, return_at, assigned_vin, status (RESERVED|ACTIVE|RETURNED)",
        "description": "Rental reservation record."
      },
      {
        "name": "VehicleAsset",
        "attributes": "vin (PK), location_id, category, mileage, status (AVAILABLE|RENTED|MAINTENANCE|DIRTY)",
        "description": "Physical car asset record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Hertz / Global Car Rental Fleet Reservation)",
        "steps": [
          "1. Client (Renter Mobile / Web App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Rental API Gateway & Auth Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Reservation Orchestrator Service) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Connected Vehicle / FastLane Gate Access) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Hertz / Global Car Rental Fleet Reservation)",
        "steps": [
          "1. Client (Renter Mobile / Web App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Rental API Gateway & Auth Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Reservation Orchestrator Service) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Connected Vehicle / FastLane Gate Access) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Individual VIN Booking Trap: 'Reserving specific car VIN numbers months in advance.'",
        "juniorAnswer": "Assign Car #104 (VIN: 1HGCR2...) to the user when they book 3 months before their trip.",
        "staffRebuttal": "If Car #104 gets into an accident, has engine failure, or is returned late by the previous renter, the booking breaks. Staff engineers book at the Category Level (e.g. 'Standard SUV - Ford Explorer or similar'). Specific physical VINs are assigned dynamically 2 hours before pickup based on clean, available vehicles on the lot."
      },
      {
        "trapTitle": "The Airport No-Show Inventory Waste: '15% of airport reservations are abandoned no-shows.'",
        "juniorAnswer": "Hold 100% of vehicles strictly empty for all reservations.",
        "staffRebuttal": "Holding empty cars for no-shows burns millions in lost rental revenue. Staff engineers implement Statistical Overbooking with Guaranteed Upgrade Hierarchy: overbook categories by historical no-show margins (e.g. 5-10%). If all renters show up, the reservation system automatically upgrades Economy renters to Midsize or Luxury at no extra charge."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (5,000 Search QPS • 500 Bookings/Sec, 1M Vehicles • 10,000 Locations Worldwide)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "crypto_order_book": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Millisecond 24/7 Limit Order Matching",
        "detail": "Match buy and sell orders following Price-Time priority in memory in <50 microseconds with zero maintenance windows."
      },
      {
        "id": "FR2",
        "title": "Zero-Rounding Fixed-Point Integer Balance Accounting",
        "detail": "Guarantee exact financial balances using integer base units (Satoshis / Wei) to eliminate floating point rounding errors."
      },
      {
        "id": "FR3",
        "title": "Real-Time WebSocket L2 Order Book Depth Streaming",
        "detail": "Broadcast incremental bid/ask depth updates to millions of concurrent algorithmic traders in real time."
      }
    ],
    "outOfScope": [
      "Decentralized AMM smart contract cross-chain bridge integration",
      "Physical cash bank wire deposit OTC concierge service",
      "Complex regulatory tax jurisdiction 1099 form generation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Orders/Sec • 24/7/365 Continuous Peak • 100M Daily Trades • Sub-Millisecond Matching",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/crypto/orders",
        "purpose": "Submit limit or market order for cryptocurrency trading pair",
        "requestSample": "{ \"pair\": \"BTCUSDT\", \"side\": \"BUY\", \"priceSatoshis\": 6500000000, \"qtySatoshis\": 100000000 }",
        "responseSample": "{ \"orderId\": \"co_888\", \"status\": \"FILLED\", \"executedQty\": 100000000, \"avgPrice\": 6500000000 }"
      }
    ],
    "coreEntities": [
      {
        "name": "CryptoOrder",
        "attributes": "order_id (PK uint64), pair, side (BUY|SELL), price_satoshis, qty_satoshis, sequence_id, timestamp_ns",
        "description": "In-memory order book node."
      },
      {
        "name": "CryptoBalance",
        "attributes": "user_id, asset (Compound PK), free_satoshis, locked_satoshis, updated_at",
        "description": "User crypto balance ledger."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Binance / High-Frequency Crypto Order Book)",
        "steps": [
          "1. Client (Crypto Trader / API Bot Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Crypto Exchange API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (In-Memory Matching Core (SkipList / Red-Black Tree)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (WebSocket Market Depth Broadcaster) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Binance / High-Frequency Crypto Order Book)",
        "steps": [
          "1. Client (Crypto Trader / API Bot Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Crypto Exchange API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (In-Memory Matching Core (SkipList / Red-Black Tree)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (WebSocket Market Depth Broadcaster) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Floating Point Currency Precision Trap: 'Using float or double in Go/Java for crypto balances.'",
        "juniorAnswer": "Use `double balance = 0.00000001` to store Bitcoin satoshis.",
        "staffRebuttal": "Floating-point numbers cannot accurately represent decimals like `0.1` or `0.00000001` due to binary fraction limitations, causing tiny precision leaks that lose money on millions of trades. Staff engineers use Fixed-Point Integers (BigInteger in Java, int64 in Go) where 1 BTC is represented as `100,000,000` Satoshis and 1 ETH is `10^18` Wei, ensuring 100% exact mathematical balance accounting."
      },
      {
        "trapTitle": "The Order Book State Persistence Failure: 'How do you persist order book state 24/7 without pausing matching?'",
        "juniorAnswer": "Pause incoming orders for 5 seconds every night to dump the order book to a database.",
        "staffRebuttal": "Pausing trading in crypto causes massive market dislocations, arbitrage exploits, and client fury. Staff engineers use Asynchronous Write-Ahead Log (WAL) + Copy-on-Write (COW) Memory Snapshots: the single-threaded matching core appends order inputs to a sequential NVMe WAL in nanoseconds; a background thread forks memory (COW) to create periodic base snapshots without blocking trading for a single microsecond."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Orders/Sec • 24/7/365 Continuous, 100M Daily Trades • Sub-Millisecond Matching)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "stripe_payments": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Tokenized End-to-End Payment Intent Creation",
        "detail": "Process credit card authorizations across global acquirers with tokenized payment method IDs, achieving <500ms authorization latency."
      },
      {
        "id": "FR2",
        "title": "Bulletproof Exactly-Once Idempotency Enforcement",
        "detail": "Prevent duplicate billing caused by client network retries or mobile timeouts using header-based idempotency keys with payload hashing."
      },
      {
        "id": "FR3",
        "title": "ACID Compliant Double-Entry Accounting Ledger",
        "detail": "Ensure that every captured transaction records balanced debit and credit entries with mathematical zero-sum verification."
      }
    ],
    "outOfScope": [
      "Hardware point-of-sale (POS) terminal firmware over-the-air updates",
      "Multi-currency forex FX hedging and liquidity trading desks",
      "Merchant chargeback dispute evidence collection workflow portal"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "15,000 Payment Charges/Sec • 99.999% Availability Peak • $1 Trillion Volume • 500M Transactions/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/v1/payment_intents",
        "purpose": "Create and immediately confirm a payment charge with client idempotency key",
        "requestSample": "{\n  \"amount\": 2000,\n  \"currency\": \"usd\",\n  \"payment_method\": \"pm_card_visa_4242\",\n  \"confirm\": true,\n  \"idempotency_key\": \"idem_8f7b2c1a-9921\"\n}",
        "responseSample": "{\n  \"id\": \"pi_1Mtxxxx\",\n  \"status\": \"succeeded\",\n  \"amount\": 2000,\n  \"currency\": \"usd\",\n  \"charges\": { \"data\": [{ \"id\": \"ch_3Nyyyy\", \"paid\": true }] }\n}"
      },
      {
        "method": "GET",
        "endpoint": "/v1/payment_intents/:id",
        "purpose": "Retrieve real-time payment intent settlement state and dispute status",
        "responseSample": "{\n  \"id\": \"pi_1Mtxxxx\",\n  \"status\": \"succeeded\",\n  \"amount_received\": 2000,\n  \"livemode\": true\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "PaymentIntent",
        "attributes": "id (PK VARCHAR), customer_id, amount (BIGINT cents), currency (CHAR(3)), status (ENUM), idempotency_key (UNIQUE), created_at",
        "description": "Represents the lifecycle of a customer checkout session."
      },
      {
        "name": "LedgerEntry",
        "attributes": "entry_id (PK UUID), transaction_id (FK), account_id (FK), direction (DEBIT|CREDIT), amount (BIGINT), created_at",
        "description": "Immutable double-entry journal entry."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Stripe / Core Payment Gateway)",
        "steps": [
          "1. Client (Merchant Web / Mobile SDK) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Stripe Edge Gateway (mTLS)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Payment Orchestrator (Saga Engine)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Immutable Double-Entry Ledger (Postgres)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Stripe / Core Payment Gateway)",
        "steps": [
          "1. Client (Merchant Web / Mobile SDK) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Stripe Edge Gateway (mTLS)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Payment Orchestrator (Saga Engine)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Immutable Double-Entry Ledger (Postgres)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Auto-Increment Primary Key Trap: 'Can we use SERIAL/auto-increment for payment IDs?'",
        "juniorAnswer": "Use auto-incrementing integer IDs in MySQL/PostgreSQL as the primary key for transactions.",
        "staffRebuttal": "Auto-incrementing IDs leak business transaction volume to competitors, create a centralized DB lock bottleneck, and cause ID collisions during multi-region shard failover. Staff engineers use distributed type-prefixed K-sortable IDs (e.g. `pi_` + Snowflake / UUIDv7)."
      },
      {
        "trapTitle": "The Single-Table Balance Update Trap: 'Can we update user balance with UPDATE accounts SET balance = balance + amount?'",
        "juniorAnswer": "Update user balance in-place on the account record using a SQL UPDATE statement.",
        "staffRebuttal": "Mutating a balance column directly is an accounting violation that destroys auditability and creates race conditions under concurrent transactions. Financial systems use an immutable append-only ledger where balance is dynamically computed as `SUM(credits) - SUM(debits)` with periodic materialized snapshots."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (15,000 Payment Charges/Sec • 99.999% Availability, $1 Trillion Volume • 500M Transactions/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "ticketmaster_booking": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Zero Double-Booking Seat Selection",
        "detail": "Guarantee strict exclusive seat allocation during high-demand concert ticket drops with zero double-selling across 100k seats."
      },
      {
        "id": "FR2",
        "title": "10-Minute Temporary Seat Hold with Auto-Release",
        "detail": "Lock seats exclusively for 10 minutes to allow fans to complete checkout, releasing seats back to the inventory pool upon timeout."
      },
      {
        "id": "FR3",
        "title": "Virtual Waiting Room Traffic Regulation",
        "detail": "Buffer up to 5 million concurrent fans in an edge queue, admitting users into checkout at a controlled rate matching backend database capacity."
      }
    ],
    "outOfScope": [
      "Secondary peer-to-peer ticket resale exchange marketplace",
      "Dynamic stadium venue 3D seating chart CAD vector rendering engine",
      "Physical paper ticket thermal printing and postal fulfillment dispatch"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Seat Requests/Sec • Zero Double Booking Peak • 100k Arena Capacity • 5M Fans in Waiting Room",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 500ms P99 • 99.999% Availability (CP in CAP)",
        "derivation": "Strong linearizable consistency is required for double-entry ledger balance integrity."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Immutable Ledger Storage • Multi-Year WORM Compliance",
        "derivation": "Every ledger debit and credit row is immutable and append-only with cryptographic audit checksums."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/events/:eventId/seats/hold",
        "purpose": "Acquire 10-minute exclusive lock on specified stadium seat numbers",
        "requestSample": "{\n  \"seatIds\": [\"SEC102_ROW12_SEAT1\", \"SEC102_ROW12_SEAT2\"],\n  \"queueToken\": \"jwt_signed_waiting_room_pass\"\n}",
        "responseSample": "{\n  \"reservationId\": \"res_tm_9921\",\n  \"status\": \"HELD\",\n  \"expiresAt\": \"2026-10-29T10:10:00Z\",\n  \"holdDurationSeconds\": 600\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/bookings/:reservationId/checkout",
        "purpose": "Finalize payment and issue cryptographically verifiable barcodes",
        "requestSample": "{\n  \"paymentMethodId\": \"pm_tok_visa\",\n  \"idempotencyKey\": \"tm_idem_5512\"\n}",
        "responseSample": "{\n  \"ticketId\": \"tkt_88123\",\n  \"status\": \"CONFIRMED\",\n  \"barcodePayload\": \"encrypted_rotating_token\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "SeatInventory",
        "attributes": "seat_id (PK), event_id, section, row, number, status (AVAILABLE|HELD|SOLD), lock_version, held_by_user_id, hold_expires_at",
        "description": "Physical stadium seat state."
      },
      {
        "name": "TicketBooking",
        "attributes": "booking_id (PK), event_id, user_id, seat_ids (ARRAY), status (PENDING|CONFIRMED|EXPIRED), total_cents, created_at",
        "description": "Customer purchase transaction record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Ticketmaster / High-Concurrency Booking)",
        "steps": [
          "1. Client (Fan Mobile / Web App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Virtual Waiting Room (Queue-it / Redis)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Distributed Seat Lock Store (Redis Redlock)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Payment Settlement Worker) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Ticketmaster / High-Concurrency Booking)",
        "steps": [
          "1. Client (Fan Mobile / Web App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Virtual Waiting Room (Queue-it / Redis)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Distributed Seat Lock Store (Redis Redlock)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Payment Settlement Worker) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Relational Database SELECT FOR UPDATE Trap: 'Can we lock seats with SELECT ... FOR UPDATE in Postgres?'",
        "juniorAnswer": "Use PostgreSQL SELECT ... FOR UPDATE on seat rows to prevent concurrent transactions from selecting the same seat.",
        "staffRebuttal": "500,000 fans competing for the same 50 front-row seats will cause 500,000 concurrent transactions to block on the same row lock, causing database connection exhaustion, massive CPU spikes, and query timeouts. Staff engineers use atomic Redis `SET NX EX` to absorb 99.9% of seat hold requests in memory, only writing to Postgres when a hold is successfully granted."
      },
      {
        "trapTitle": "The Expired Seat Release Cron Job Trap: 'Can we run a cron job every minute to release expired seats?'",
        "juniorAnswer": "Run a background cron job every 60 seconds that runs `UPDATE seats SET status = 'AVAILABLE' WHERE status = 'HELD' AND hold_expires_at < NOW()`.",
        "staffRebuttal": "A 1-minute batch cron creates spiky database load, locks table rows, and leaves seats unavailable for up to 60 seconds after expiry. Staff engineers use Redis TTL keys with keyspace notifications or an event-driven delayed task queue (RabbitMQ / SQS delay message) to release the exact seat at millisecond precision."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Seat Requests/Sec • Zero Double Booking, 100k Arena Capacity • 5M Fans in Waiting Room)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "uber_ride_matching": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Ingestion of 1.25M GPS Pings/Sec",
        "detail": "Ingest real-time location telemetry from 5M active drivers every 4 seconds with sub-50ms latency using Netty WebSockets."
      },
      {
        "id": "FR2",
        "title": "Nearby Driver Proximity Search (H3 Hexagonal Grid)",
        "detail": "Find the closest top 10 available drivers within a 3km radius of a rider's pickup location in <100ms using Uber H3 k-ring traversal."
      },
      {
        "id": "FR3",
        "title": "Atomic Dispatch Matchmaking & State Machine",
        "detail": "Coordinate exclusive driver assignment with 15-second acceptance countdown and zero dual-assignment race conditions."
      }
    ],
    "outOfScope": [
      "In-app VoIP calling between rider and driver",
      "Fleet vehicle maintenance telemetry and tire pressure monitoring",
      "Autonomous self-driving vehicle lidar sensor data processing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,250,000 Driver GPS Pings/Sec • <1s Dispatch Latency Peak • 5M Active Drivers • 100M Daily Trips",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/ws/v1/driver/telemetry",
        "purpose": "Driver streams continuous GPS location coordinates and availability status",
        "requestSample": "{\n  \"driverId\": \"drv_8812\",\n  \"latitude\": 37.774929,\n  \"longitude\": -122.419416,\n  \"heading\": 182,\n  \"status\": \"AVAILABLE\",\n  \"timestamp\": 1729001200\n}",
        "responseSample": "{\n  \"status\": \"ACK\",\n  \"serverEpoch\": 1729001200\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/rides/request",
        "purpose": "Rider initiates ride booking and triggers dispatch matching engine",
        "requestSample": "{\n  \"riderId\": \"rdr_441\",\n  \"pickup\": { \"lat\": 37.775, \"lng\": -122.418 },\n  \"dropoff\": { \"lat\": 37.789, \"lng\": -122.401 },\n  \"rideTier\": \"UBERX\"\n}",
        "responseSample": "{\n  \"tripId\": \"trip_9921\",\n  \"status\": \"SEARCHING_FOR_DRIVERS\",\n  \"searchRadiusKm\": 2.5\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "DriverLocation",
        "attributes": "driver_id (PK), h3_index (BIGINT), lat (FLOAT), lng (FLOAT), status (AVAILABLE|BUSY), updated_at",
        "description": "High-frequency ephemeral geospatial coordinates."
      },
      {
        "name": "Trip",
        "attributes": "trip_id (PK UUID), rider_id (FK), driver_id (FK NULLABLE), status (REQUESTED|ACCEPTED|IN_TRANSIT|COMPLETED), pickup_h3, dropoff_h3, fare_cents, created_at",
        "description": "Core ride lifecycle entity."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Uber / Real-Time Ride Dispatching)",
        "steps": [
          "1. Client (Driver GPS Client App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (WebSocket Connection Gateway (Netty)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Rider Ride Request Service) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Dynamic Routing & ETA Engine) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Uber / Real-Time Ride Dispatching)",
        "steps": [
          "1. Client (Driver GPS Client App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (WebSocket Connection Gateway (Netty)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Rider Ride Request Service) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Dynamic Routing & ETA Engine) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The SQL ST_DWithin Geospatial Query Trap: 'Can we query nearby drivers with PostgreSQL PostGIS?'",
        "juniorAnswer": "Store driver coordinates in PostgreSQL with PostGIS and run `ST_DWithin(geom, ST_MakePoint(lat, lng), 3000)` on every ride request.",
        "staffRebuttal": "Running 1.25M PostGIS updates/sec and hundreds of thousands of spatial scans will exhaust PostgreSQL IOPS and lock R-Tree indexes. Staff engineers partition space into discrete discrete in-memory cell IDs (H3 / S2) stored in Redis sets, turning complex polygon geometry math into simple O(1) set union operations."
      },
      {
        "trapTitle": "The Polling vs WebSocket Connection Trap: 'Why not have driver app send HTTP POST pings?'",
        "juniorAnswer": "Have the mobile driver app send HTTP POST /api/location every 4 seconds.",
        "staffRebuttal": "Sending HTTP POST every 4 seconds from 5M drivers requires 1.25M TLS handshakes and massive HTTP header overhead (800 bytes headers vs 40 bytes payload). Staff engineers maintain long-lived bi-directional WebSocket connections, multiplexing binary Protobuf packets over TCP."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,250,000 Driver GPS Pings/Sec • <1s Dispatch Latency, 5M Active Drivers • 100M Daily Trips)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "whatsapp_chat": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-100ms End-to-End Encrypted Message Delivery",
        "detail": "Deliver 1-on-1 and group messages with <100ms global latency when both parties are connected via persistent TCP sockets."
      },
      {
        "id": "FR2",
        "title": "Store-and-Forward Ephemeral Offline Queueing",
        "detail": "Safely spool messages for offline users up to 30 days in Cassandra, auto-deleting upon recipient acknowledgment receipt."
      },
      {
        "id": "FR3",
        "title": "Three-Tier Delivery Status Receipts",
        "detail": "Propagate Sent (single check), Delivered (double grey), and Read (double blue) states back to original sender in real time."
      }
    ],
    "outOfScope": [
      "Long-term server-side plaintext search indexing (impossible with E2EE)",
      "Multi-party 32-person video conferencing media mixing (handled by WebRTC mesh/SFU)",
      "Third-party payment bot automated processing inside chat threads"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,200,000 Msg/Sec Peak • End-to-End Encrypted (Signal Protocol) Peak • 2 Billion Users • 100 Billion Messages/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/chat/v1/stream",
        "purpose": "Bi-directional real-time message stream and delivery receipts",
        "requestSample": "{\n  \"messageId\": \"msg_9921\",\n  \"toUserId\": \"usr_42\",\n  \"cipherPayload\": \"0x4a9f...encrypted_bytes\",\n  \"preKeyId\": 4,\n  \"timestamp\": 1729001200\n}",
        "responseSample": "{\n  \"messageId\": \"msg_9921\",\n  \"status\": \"DELIVERED_TO_SERVER\",\n  \"serverTimestamp\": 1729001200\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/users/:id/presence",
        "purpose": "Fetch user online presence, typing status, and last seen timestamp",
        "responseSample": "{\n  \"userId\": \"usr_42\",\n  \"isOnline\": true,\n  \"lastSeen\": 1729001195\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ActiveSession",
        "attributes": "user_id (PK), gateway_server_id, socket_descriptor, connected_at, last_heartbeat",
        "description": "Ephemeral Redis connection routing record."
      },
      {
        "name": "OfflineMessageSpool",
        "attributes": "recipient_id (PK), message_id (CLUSTER KEY), sender_id, encrypted_payload (BLOB), created_at",
        "description": "Cassandra temporary mailbox for offline delivery."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design WhatsApp / Real-Time Messenger)",
        "steps": [
          "1. Client (Sender Mobile Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Chat Gateway Cluster (Erlang / BEAM)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Message Dispatcher & Routing Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Push Notification Service (APNs / FCM)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design WhatsApp / Real-Time Messenger)",
        "steps": [
          "1. Client (Sender Mobile Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Chat Gateway Cluster (Erlang / BEAM)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Message Dispatcher & Routing Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Push Notification Service (APNs / FCM)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Permanent Relational Database Chat History Trap: 'Where do we store all user chat logs?'",
        "juniorAnswer": "Store all sent and received chat messages in a partitioned MySQL or MongoDB database so users can view chat history.",
        "staffRebuttal": "Storing 100B messages/day permanently would require 50 petabytes of high-throughput DB storage per day and violates WhatsApp's core privacy guarantee. In WhatsApp, chats are stored exclusively on the user's mobile device (SQLite/CoreData). Servers operate as a store-and-forward pipe: once delivered, messages are deleted forever."
      },
      {
        "trapTitle": "The Group Chat N^2 Fanout Trap: 'How do we send a message to a 1,000-person group?'",
        "juniorAnswer": "The sender client encrypts 1,000 separate copies of the message with each recipient's public key and sends 1,000 requests over cellular network.",
        "staffRebuttal": "Encrypting and uploading 1,000 messages from a phone will drain the user's battery and exceed mobile bandwidth limits. WhatsApp uses the Signal Sender Key protocol: the sender encrypts the message once with a symmetric Group Sender Key, uploads 1 ciphertext to the server, and the server fans out the same ciphertext to all 1,000 group member connections."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,200,000 Msg/Sec Peak • End-to-End Encrypted (Signal Protocol), 2 Billion Users • 100 Billion Messages/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "google_docs_crdt": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Collaborative Real-Time Conflict Resolution",
        "detail": "Enable up to 100 simultaneous users to edit the same paragraph without race conditions, lost characters, or cursor desynchronization using CRDT/OT."
      },
      {
        "id": "FR2",
        "title": "Real-Time Caret & Presence Synchronization",
        "detail": "Broadcast collaborator caret coordinates, text selection ranges, and user color avatars at 30 FPS across all active editor sessions."
      },
      {
        "id": "FR3",
        "title": "Infinite Revision History & Time-Travel Rollback",
        "detail": "Reconstruct document state at any historical revision by replaying compacted snapshots and subsequent append-only mutation logs."
      }
    ],
    "outOfScope": [
      "Real-time video chat sidebar embedded inside document window",
      "Complex semantic spell-checking and generative AI grammar rewrite models",
      "Multi-language text translation engine during real-time typing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "250,000 Character Edits/Sec • Sub-50ms Sync Latency Peak • 100 Concurrent Editors/Doc • 1B Daily Edits",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/docs/v1/sessions/:docId",
        "purpose": "Bi-directional WebSocket streaming CRDT operations and cursor states",
        "requestSample": "{\n  \"opType\": \"INSERT\",\n  \"clock\": 42,\n  \"char\": \"H\",\n  \"positionId\": \"0.1542\",\n  \"authorId\": \"usr_99\"\n}",
        "responseSample": "{\n  \"opType\": \"ACK\",\n  \"revision\": 104\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/docs/:docId/snapshot",
        "purpose": "Fetch latest consolidated document snapshot and current vector clock",
        "responseSample": "{\n  \"docId\": \"doc_4242\",\n  \"revision\": 100,\n  \"content\": \"Hello World...\",\n  \"stateVector\": \"0x8fa1...\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "DocumentOperation",
        "attributes": "doc_id (PK), revision_id (CLUSTER KEY), op_type (INSERT|DELETE), char, position_id (VARCHAR), author_id, vector_clock",
        "description": "Immutable CRDT operation record."
      },
      {
        "name": "DocumentSnapshot",
        "attributes": "doc_id (PK), revision_id, full_content_blob, vector_state, updated_at",
        "description": "Compacted point-in-time full document state."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Google Docs / Real-Time Collaborative Document)",
        "steps": [
          "1. Client (Browser Rich Text Editor) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Document WebSocket Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Collaborator Cursor & Presence Service) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Append-Only Mutation Log (ScyllaDB / Postgres)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Google Docs / Real-Time Collaborative Document)",
        "steps": [
          "1. Client (Browser Rich Text Editor) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Document WebSocket Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Collaborator Cursor & Presence Service) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Append-Only Mutation Log (ScyllaDB / Postgres)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Distributed Locking Trap: 'Can we acquire a lock on the paragraph before a user types?'",
        "juniorAnswer": "Lock the paragraph or sentence in Redis with a distributed mutex so only one user can type at a time.",
        "staffRebuttal": "Paragraph locking destroys the fluid collaborative Google Docs experience. Users will experience typing lag, deadlocks if a user walks away with the lock, and cannot edit simultaneously. Modern collaborative engines use lock-free CRDTs (like YATA or LSEQ) with deterministic conflict resolution."
      },
      {
        "trapTitle": "The Array Index Shifting Trap: 'Why not represent character position as a simple integer index?'",
        "juniorAnswer": "Send character index as an integer, e.g., Insert 'A' at index 5.",
        "staffRebuttal": "If User 1 inserts a character at index 2 while User 2 inserts at index 5 concurrently, User 2's insertion will be placed at the wrong index because the underlying string array shifted. Staff engineers use fractional indexing (e.g. between 'B' at 0.2 and 'C' at 0.3, allocate '0.25') so positions are globally unique and immutable."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (250,000 Character Edits/Sec • Sub-50ms Sync Latency, 100 Concurrent Editors/Doc • 1B Daily Edits)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "yelp_proximity_search": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Radial Proximity Venue Search",
        "detail": "Search top 50 businesses matching query terms within a 1km - 20km radius of user GPS coordinates in <50ms P99 latency."
      },
      {
        "id": "FR2",
        "title": "Multi-Faceted Filtering & Sorting",
        "detail": "Support real-time filtering by 'Open Now', price tier ($$), star rating (4+ stars), and sorting by distance vs relevance."
      },
      {
        "id": "FR3",
        "title": "Fast Spatial Index Regeneration on Venue Updates",
        "detail": "Propagate newly registered businesses and edited operating hours to the spatial index within 60 seconds."
      }
    ],
    "outOfScope": [
      "In-app table reservation booking engine and deposit payment gateway",
      "Turn-by-turn driving navigation voice guidance",
      "User video review upload and automated transcoding pipeline"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Search QPS • <50ms P99 Latency Peak • 100M Businesses • 50M Active Searchers",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/api/v1/search/nearby",
        "purpose": "Query businesses within a specified radius with category filters",
        "requestSample": "GET /api/v1/search/nearby?lat=37.7749&lng=-122.4194&radius_m=3000&category=restaurants&term=sushi",
        "responseSample": "{\n  \"total\": 48,\n  \"businesses\": [\n    { \"id\": \"biz_881\", \"name\": \"Akiko Sushi\", \"rating\": 4.8, \"distanceMeters\": 420, \"is_open_now\": true }\n  ]\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/businesses",
        "purpose": "Create or update business location and operating profile",
        "requestSample": "{\n  \"name\": \"Izakaya Ginji\",\n  \"lat\": 37.781,\n  \"lng\": -122.411,\n  \"categories\": [\"japanese\", \"bar\"]\n}",
        "responseSample": "{\n  \"id\": \"biz_9941\",\n  \"geohash\": \"9q8yyk\",\n  \"status\": \"INDEXED\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "Business",
        "attributes": "business_id (PK), name, lat (FLOAT), lng (FLOAT), geohash (INDEX VARCHAR(8)), category_ids (ARRAY), avg_rating (DECIMAL), review_count, updated_at",
        "description": "Persistent business venue profile."
      },
      {
        "name": "SpatialTile",
        "attributes": "geohash_prefix (PK), business_ids (SET), count, updated_at",
        "description": "In-memory spatial index partition mapping geo-tile to venues."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Yelp / Proximity Venue Search)",
        "steps": [
          "1. Client (Yelp Mobile / Web Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway & Edge Cache) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Search & Ranking Engine (Elasticsearch)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Review & Rating Aggregator (Kafka / Spark)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Yelp / Proximity Venue Search)",
        "steps": [
          "1. Client (Yelp Mobile / Web Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway & Edge Cache) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Search & Ranking Engine (Elasticsearch)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Review & Rating Aggregator (Kafka / Spark)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Quadtree Rebalancing Trap: 'How do you handle Quadtree leaf node splits dynamically?'",
        "juniorAnswer": "Update the in-memory Quadtree dynamically on every single business review or metadata update.",
        "staffRebuttal": "Mutating a distributed Quadtree dynamically in memory creates write-lock contention across concurrent reader threads. Because venue locations change rarely, staff engineers keep the Quadtree read-only in memory, rebuilding or swapping segments atomically via double-buffering, or use Geohashes/Google S2 cells stored in Redis keys."
      },
      {
        "trapTitle": "The Boundary Boundary Geohash Neighbor Trap: 'Why is searching for geohash prefix 9q8y not enough?'",
        "juniorAnswer": "Query for all venues where geohash begins with the user's current geohash prefix.",
        "staffRebuttal": "Two locations can be 5 meters apart but have completely different Geohash prefixes if they sit across a boundary line. Staff engineers always query the target cell PLUS its 8 adjacent neighbor cells (the 9-box neighborhood) to guarantee zero boundary blind spots."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Search QPS • <50ms P99 Latency, 100M Businesses • 50M Active Searchers)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "twitch_live_chat": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-200ms Fanout to 10M Concurrent Viewers",
        "detail": "Broadcast verified chat messages to millions of viewers in the same room with <200ms end-to-end latency."
      },
      {
        "id": "FR2",
        "title": "Automated Content Moderation & Slow-Mode Enforcer",
        "detail": "Filter banned terms and enforce dynamic per-user slow-mode timers before message enters fanout queue."
      },
      {
        "id": "FR3",
        "title": "Client-Adaptive Rate Sampling Under Megathread Spikes",
        "detail": "Intelligently drop or batch messages when room volume exceeds 1,000 msgs/sec to maintain 30 FPS client rendering."
      }
    ],
    "outOfScope": [
      "Real-time video/audio ingestion and transcode pipeline (separate system)",
      "Channel bits and monetary tipping credit card processing",
      "Whisper private direct messaging between offline users"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Chat Messages/Sec Peak • Sub-200ms Global Broadcast Peak • 100k Concurrent Channels • 10M Viewers on Top Channel",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/ws/v1/channels/:channelId/chat",
        "purpose": "Bi-directional WebSocket for sending and receiving live chat stream",
        "requestSample": "{\n  \"action\": \"SEND_MESSAGE\",\n  \"content\": \"POGGERS clip that play!\",\n  \"emotes\": [\"emote_pog_01\"]\n}",
        "responseSample": "{\n  \"id\": \"chat_msg_7712\",\n  \"sender\": \"Gamer123\",\n  \"color\": \"#9146FF\",\n  \"badges\": [\"subscriber_12mo\"],\n  \"timestamp\": 1729001200\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/channels/:channelId/slowmode",
        "purpose": "Moderator activates slow mode rate limit for channel",
        "requestSample": "{\n  \"slowModeSeconds\": 30,\n  \"subscribersExempt\": true\n}",
        "responseSample": "{\n  \"status\": \"UPDATED\",\n  \"effectiveImmediately\": true\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ChatMessage",
        "attributes": "message_id (PK), channel_id (PARTITION KEY), user_id, content, emotes (ARRAY), timestamp, flags",
        "description": "Individual live chat message record."
      },
      {
        "name": "ChannelChatConfig",
        "attributes": "channel_id (PK), slow_mode_sec, followers_only_min, emote_only_bool, automod_level",
        "description": "Room moderation rules and throttling state."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Twitch / Live Stream Chat with Millions of Viewers)",
        "steps": [
          "1. Client (Stream Viewer / Chatter) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Edge Chat Gateway Cluster) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Channel Message Broker (Kafka / Redis)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (VOD Chat History DB (ScyllaDB / DynamoDB)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Twitch / Live Stream Chat with Millions of Viewers)",
        "steps": [
          "1. Client (Stream Viewer / Chatter) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Edge Chat Gateway Cluster) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Channel Message Broker (Kafka / Redis)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (VOD Chat History DB (ScyllaDB / DynamoDB)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Linear Client Delivery Trap: 'Can we deliver every single message to all 500,000 viewers in a room?'",
        "juniorAnswer": "Deliver every message to every connected WebSocket so nobody misses any chat message.",
        "staffRebuttal": "If 10,000 people chat per second in a room with 500,000 viewers, the server must emit 5,000,000,000 messages/sec (5 Gbps+ outbound per room), which will crash the client browser's DOM rendering engine. Staff engineers apply client-side throttling or server-side sampling: when chat speed exceeds 20 msgs/sec, randomly sample messages so clients receive only readable volume."
      },
      {
        "trapTitle": "The Centralized Redis Pub/Sub Single Node Trap: 'Can we use one Redis instance for all channel pub/sub?'",
        "juniorAnswer": "Subscribe all web servers to a Redis Pub/Sub channel for each streamer.",
        "staffRebuttal": "Redis Pub/Sub has no backpressure and copies every message to every subscriber connection. For 500,000 viewers spread across 500 web servers, a high-volume channel will saturate the single Redis server's network card. Staff engineers use a multi-tiered distribution tree (Kafka partitions -> intermediate relay brokers -> edge workers)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Chat Messages/Sec Peak • Sub-200ms Global Broadcast, 100k Concurrent Channels • 10M Viewers on Top Channel)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "uber_surge_pricing": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Minute Reactive Surge Recalculation",
        "detail": "Recalculate dynamic surge multipliers for all city H3 hexagonal cells every 10-15 seconds based on real-time supply/demand shifts."
      },
      {
        "id": "FR2",
        "title": "Spatial Smoothing Across Adjacent Hexagonal Cells",
        "detail": "Apply spatial kernel smoothing to prevent abrupt pricing boundaries across adjacent geographic blocks."
      },
      {
        "id": "FR3",
        "title": "Sub-5ms Fare Quote Hydration at 250k QPS",
        "detail": "Serve active surge multipliers to rider booking apps with sub-5ms latency from distributed in-memory cache."
      }
    ],
    "outOfScope": [
      "Driver weekly payroll tax withholding and bank direct deposit transfers",
      "Physical vehicle insurance claims processing",
      "Promotional affiliate coupon marketing campaign attribution"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "250,000 Pricing Quotes/Sec • 10-Second Recalculation Cadence Peak • 100M Daily Trips • 10,000 Hexagonal City Zones",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/api/v1/pricing/surge",
        "purpose": "Fetch current surge multiplier for a specific H3 hexagonal location cell",
        "requestSample": "GET /api/v1/pricing/surge?h3_index=8828308281fffff",
        "responseSample": "{\n  \"h3Index\": \"8828308281fffff\",\n  \"multiplier\": 1.75,\n  \"confidence\": 0.95,\n  \"validUntil\": 1729001215\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/telemetry/app-open",
        "purpose": "Log rider app open demand signal from mobile client",
        "requestSample": "{\n  \"riderId\": \"rdr_129\",\n  \"h3Index\": \"8828308281fffff\",\n  \"timestamp\": 1729001200\n}",
        "responseSample": "{\n  \"status\": \"RECORDED\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "SurgeCellState",
        "attributes": "h3_index (PK), current_multiplier (DECIMAL), supply_count, demand_count, computed_at, expires_at",
        "description": "Zone pricing multiplier state."
      },
      {
        "name": "SurgeAuditLog",
        "attributes": "audit_id (PK), h3_index, multiplier, supply_val, demand_val, algorithm_version, logged_at",
        "description": "Historical audit record for regulatory compliance."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Uber / Dynamic Surge Pricing Engine)",
        "steps": [
          "1. Client (Rider Open App & Driver Pings) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Streaming Telemetry Ingest (Kafka)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Dynamic Surge Multiplier Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Upfront Fare Quote Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Uber / Dynamic Surge Pricing Engine)",
        "steps": [
          "1. Client (Rider Open App & Driver Pings) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Streaming Telemetry Ingest (Kafka)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Dynamic Surge Multiplier Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Upfront Fare Quote Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Completed Rides as Demand Trap: 'Can we calculate demand by counting ride requests?'",
        "juniorAnswer": "Count the number of riders who clicked 'Request Ride' in the last 5 minutes.",
        "staffRebuttal": "By the time a user clicks 'Request Ride', prices must already be shown. Furthermore, if prices are 3.0x, many users abandon the app without requesting. Staff engineers capture 'top-of-funnel' demand: count app opens, destination searches, and fare quote requests in real time to capture true market appetite."
      },
      {
        "trapTitle": "The Surge Border Gaming Trap: 'Why do riders walk 50 meters to avoid a surge multiplier?'",
        "juniorAnswer": "Draw strict square geographic boundaries for each city neighborhood.",
        "staffRebuttal": "Hard grid boundaries create extreme pricing cliffs (e.g. 2.5x on one side of Main St, 1.0x across the street), causing riders to walk across the street and drivers to sit on the surge side gaming the system. Staff engineers use Uber H3 hexagons with spatial convolution smoothing so prices scale smoothly as a continuous mathematical gradient."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (250,000 Pricing Quotes/Sec • 10-Second Recalculation Cadence, 100M Daily Trips • 10,000 Hexagonal City Zones)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "zoom_video_signaling": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-100ms Global Audio/Video Routing via SFU",
        "detail": "Route real-time audio and video tracks for up to 1,000 attendees in a single room with sub-100ms latency using SFUs."
      },
      {
        "id": "FR2",
        "title": "Simulcast Dynamic Bandwidth Adaptation",
        "detail": "Adapt transmitted video quality dynamically based on client viewport size (active speaker vs gallery grid) and packet loss."
      },
      {
        "id": "FR3",
        "title": "Resilient Signaling & ICE NAT Traversal",
        "detail": "Achieve 99.5%+ connection success rate through corporate enterprise firewalls using STUN and TURN UDP/TCP relay fallback."
      }
    ],
    "outOfScope": [
      "Real-time closed-caption multilingual speech-to-text translation",
      "Virtual background segmentation machine learning models executing on phone GPU",
      "Cloud recording MP4 post-meeting archival and permanent video hosting"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Signaling Handshakes/Sec • Sub-100ms Media Latency Peak • 300M Daily Meeting Participants • 1,000 Attendees/Room",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/signal/v1/meetings/:meetingId",
        "purpose": "Signaling WebSocket for exchanging WebRTC SDP offers and ICE candidates",
        "requestSample": "{\n  \"type\": \"SDP_OFFER\",\n  \"sdp\": \"v=0\\r\\no=- 42...m=video 9 UDP/TLS/RTP/SAVPF 96...\",\n  \"simulcast\": true\n}",
        "responseSample": "{\n  \"type\": \"SDP_ANSWER\",\n  \"sfuEndpoint\": \"sfu-us-west-04.zoom.us:10004\",\n  \"assignedTrackId\": \"trk_vid_441\"\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/meetings",
        "purpose": "Create a new scheduled meeting room with security passcodes",
        "requestSample": "{\n  \"hostId\": \"usr_991\",\n  \"topic\": \"Staff Architecture Review\",\n  \"isWaitingRoomEnabled\": true\n}",
        "responseSample": "{\n  \"meetingId\": \"829-192-441\",\n  \"joinUrl\": \"https://zoom.us/j/829192441\",\n  \"passcode\": \"771829\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MeetingRoom",
        "attributes": "meeting_id (PK), host_user_id, status (SCHEDULED|IN_PROGRESS|ENDED), sfu_node_id, participant_count, started_at",
        "description": "Active meeting session metadata."
      },
      {
        "name": "ParticipantSession",
        "attributes": "participant_id (PK), meeting_id (FK), user_id, sfu_endpoint, media_role (SPEAKER|LISTENER), connected_at",
        "description": "Active WebRTC connection context."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Zoom / Video Conference Signaling & SFU Router)",
        "steps": [
          "1. Client (Participant WebRTC App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Signaling Gateway (WebSocket / WSS)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Selective Forwarding Unit (SFU)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Meeting & Roster DB (CockroachDB)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Zoom / Video Conference Signaling & SFU Router)",
        "steps": [
          "1. Client (Participant WebRTC App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Signaling Gateway (WebSocket / WSS)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Selective Forwarding Unit (SFU)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Meeting & Roster DB (CockroachDB)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Peer-to-Peer Mesh Scaling Trap: 'Can we connect all 100 meeting participants directly peer-to-peer?'",
        "juniorAnswer": "Establish direct WebRTC peer connections between every participant in the room.",
        "staffRebuttal": "A full P2P mesh requires N*(N-1) connections. In a 50-person meeting, each person must upload 49 video streams, requiring ~50 Mbps upload bandwidth and melting the user's laptop. Staff engineers use a Selective Forwarding Unit (SFU): each client uploads only 1 stream to the SFU, which intelligently forwards packets to others."
      },
      {
        "trapTitle": "The TCP Retransmission Trap: 'Why not transmit video frames over reliable TCP or WebSockets?'",
        "juniorAnswer": "Use TCP so no video packets get lost.",
        "staffRebuttal": "TCP enforces in-order delivery and retransmits lost packets. If a single packet drops on a flaky Wi-Fi connection, TCP Head-of-Line blocking freezes the entire video stream for 500ms while waiting for retransmission. Real-time video must use UDP/SRTP: it is better to drop a frame than freeze real-time conversation."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Signaling Handshakes/Sec • Sub-100ms Media Latency, 300M Daily Meeting Participants • 1,000 Attendees/Room)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "chess_matchmaking_engine": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5s Fair Skill-Based ELO Matchmaking",
        "detail": "Pair players of similar skill within +/- 50 ELO in under 5 seconds using expanding search window queues."
      },
      {
        "id": "FR2",
        "title": "Authoritative Millisecond-Precision Move Validation",
        "detail": "Validate all chess moves against FEN board state and synchronize clocks with network lag compensation."
      },
      {
        "id": "FR3",
        "title": "Atomic Post-Game Rating Settlement",
        "detail": "Calculate and commit Glicko-2 rating adjustments and update global leaderboards immediately upon checkmate or timeout."
      }
    ],
    "outOfScope": [
      "Stockfish 16 deep neural network cheat detection engine analysis",
      "Live video commentary streaming for world championship events",
      "Tournament bracket Swiss pairing automation for 10,000 simultaneous players"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Move Validations/Sec • Sub-5s ELO Matchmaking Peak • 100M Games/Day • 500k Concurrent Matches",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/matchmaking/join",
        "purpose": "Join the matchmaking queue for a specified game mode and time control",
        "requestSample": "{\n  \"userId\": \"usr_chess_44\",\n  \"timeControl\": \"3+2\",\n  \"gameType\": \"RATED_BLITZ\"\n}",
        "responseSample": "{\n  \"ticketId\": \"tkt_mm_9912\",\n  \"status\": \"QUEUED\",\n  \"estimatedWaitSeconds\": 3\n}"
      },
      {
        "method": "WS",
        "endpoint": "/game/v1/play/:gameId",
        "purpose": "Bi-directional move transmission and millisecond clock synchronization",
        "requestSample": "{\n  \"action\": \"MOVE\",\n  \"move\": \"e2e4\",\n  \"clockRemainingMs\": 178200,\n  \"moveNumber\": 1\n}",
        "responseSample": "{\n  \"status\": \"VALID\",\n  \"fen\": \"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1\",\n  \"whiteClockMs\": 178200\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "LiveChessGame",
        "attributes": "game_id (PK), white_user_id, black_user_id, current_fen, move_history_pgn (TEXT), white_clock_ms, black_clock_ms, status (ACTIVE|WHITE_WON|BLACK_WON|DRAW), started_at",
        "description": "Authoritative live match state."
      },
      {
        "name": "PlayerRating",
        "attributes": "user_id (PK), game_mode (PK), elo_rating (INT), rating_deviation (FLOAT), volatility, games_played, updated_at",
        "description": "Glicko-2 player rating record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Chess.com / Multiplayer Chess Engine & ELO)",
        "steps": [
          "1. Client (Chess Player Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Match WebSocket Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Matchmaking Worker (ELO Radius Expansion)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Glicko-2 / ELO Rating Calculator) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Chess.com / Multiplayer Chess Engine & ELO)",
        "steps": [
          "1. Client (Chess Player Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Match WebSocket Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Matchmaking Worker (ELO Radius Expansion)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Glicko-2 / ELO Rating Calculator) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Client-Side Clock Trust Trap: 'Can we let the mobile phone track the 3-minute game clock?'",
        "juniorAnswer": "Let the client app decrement its clock locally and notify the server when time reaches 00:00.",
        "staffRebuttal": "Trusting the client for game time allows malicious players to pause their clock or alter system time to never lose on time. The server must remain the sole authoritative timekeeper, tracking clock state with millisecond timestamps and applying ping (RTT/2) lag compensation for network transit."
      },
      {
        "trapTitle": "The Matchmaking Deadlock Race Condition Trap: 'What happens if two workers match the same player simultaneously?'",
        "juniorAnswer": "Query the database for available players and update their status to MATCHED.",
        "staffRebuttal": "Concurrent matchmaking workers will pick the same high-ELO player simultaneously, creating double matches. Staff engineers use atomic Redis Lua scripts with `ZPOPMIN` or distributed locks to pop paired candidates atomically in a single atomic step."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Move Validations/Sec • Sub-5s ELO Matchmaking, 100M Games/Day • 500k Concurrent Matches)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "google_maps_navigation": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-100ms Continental Route Calculation",
        "detail": "Compute fastest driving route between any two continental coordinates in <100ms using Contraction Hierarchies graph algorithms."
      },
      {
        "id": "FR2",
        "title": "Dynamic Real-Time Traffic Edge Updating",
        "detail": "Continuously update road travel speeds across millions of road segments from live fleet speed telemetry."
      },
      {
        "id": "FR3",
        "title": "Sub-2s Automatic Off-Route Rerouting",
        "detail": "Detect missed turns within 2 seconds using Hidden Markov Model map matching and push instant recalculations to client."
      }
    ],
    "outOfScope": [
      "Real-time 3D photorealistic satellite image 4K rendering engine",
      "Indoor mall floor-by-floor walking navigation and Bluetooth beacon triangulation",
      "Autonomous vehicle collision detection radar sensor processing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Route Requests/Sec • Sub-2s Dynamic Rerouting Peak • 1 Billion Daily Users • 50M Active Routes",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/directions",
        "purpose": "Compute fastest route options between origin and destination with traffic",
        "requestSample": "{\n  \"origin\": { \"lat\": 37.7749, \"lng\": -122.4194 },\n  \"destination\": { \"lat\": 37.3382, \"lng\": -121.8863 },\n  \"avoidTolls\": false\n}",
        "responseSample": "{\n  \"routes\": [\n    {\n      \"durationSeconds\": 3120,\n      \"distanceMeters\": 77200,\n      \"summary\": \"via US-101 S\",\n      \"encodedPolyline\": \"_p~iF~ps|U_ulLnnqC_mqN...\",\n      \"maneuvers\": [{ \"instruction\": \"Head south on Van Ness Ave\", \"distanceMeters\": 400 }]\n    }\n  ]\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/navigation/reroute-check",
        "purpose": "Validate if driver is still on designated route path",
        "requestSample": "{\n  \"routeId\": \"rt_8812\",\n  \"currentLocation\": { \"lat\": 37.771, \"lng\": -122.415 },\n  \"bearing\": 182\n}",
        "responseSample": "{\n  \"isOnRoute\": true,\n  \"nextManeuverDistanceMeters\": 150,\n  \"rerouteRequired\": false\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "RoadSegment",
        "attributes": "edge_id (PK), from_node_id, to_node_id, base_length_meters, speed_limit_kmh, current_speed_kmh, road_class (HIGHWAY|LOCAL), updated_at",
        "description": "Directed graph road edge with dynamic traffic weight."
      },
      {
        "name": "NavigationSession",
        "attributes": "session_id (PK), user_id, origin, destination, current_route_polyline, next_waypoint_idx, created_at",
        "description": "Active in-progress trip context."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Google Maps / Real-Time Turn-by-Turn Navigation)",
        "steps": [
          "1. Client (Driver Navigation App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Edge Gateway & Tile CDN) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Live Traffic Ingestion (Kafka / Flink)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Route Session Store (Redis / DynamoDB)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Google Maps / Real-Time Turn-by-Turn Navigation)",
        "steps": [
          "1. Client (Driver Navigation App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Edge Gateway & Tile CDN) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Live Traffic Ingestion (Kafka / Flink)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Route Session Store (Redis / DynamoDB)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Raw Dijkstra Graph Search Trap: 'Can we run Dijkstra's algorithm on the live road graph?'",
        "juniorAnswer": "Run Dijkstra's shortest path algorithm directly on the road database to find the shortest path.",
        "staffRebuttal": "The global road network has hundreds of millions of intersections and roads. Running standard Dijkstra explores millions of nodes in all directions, taking 5-10 seconds per query and consuming gigabytes of RAM. Staff engineers use Contraction Hierarchies or Custom Contraction Hierarchies (CCH): precomputing shortcuts between major highway nodes reduces search to <5ms."
      },
      {
        "trapTitle": "The Jittery Raw GPS Snapping Trap: 'Why not match the car directly to the closest road segment?'",
        "juniorAnswer": "Find the road segment with the smallest Euclidean distance to the driver's GPS coordinate.",
        "staffRebuttal": "GPS jitter of 5-10 meters causes the location to jump onto parallel service roads, overpasses, or opposite-direction lanes, causing navigation to scream 'Make a U-Turn!'. Staff engineers use Hidden Markov Models (HMM) considering both distance and vehicle heading/historical trajectory to probabilistically snap to the true road."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Route Requests/Sec • Sub-2s Dynamic Rerouting, 1 Billion Daily Users • 50M Active Routes)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "telemedicine_webrtc": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-150ms HIPAA-Compliant WebRTC Video Stream",
        "detail": "Deliver high-fidelity encrypted video visits with sub-150ms latency adhering to strict zero-leakage security boundaries."
      },
      {
        "id": "FR2",
        "title": "Virtual Clinic Triage & Waiting Room Queue",
        "detail": "Manage virtual patient check-in, dynamic doctor queue assignment, and emergency transfer escalation."
      },
      {
        "id": "FR3",
        "title": "Cryptographically Sealed Audit Trail & EHR Ingestion",
        "detail": "Store consultation diagnoses and electronic prescriptions with AES-256 encryption and immutable access logging."
      }
    ],
    "outOfScope": [
      "Physical robotic remote surgery tele-manipulation hardware protocols",
      "Third-party health insurance claim adjudication clearinghouse automation",
      "Medical laboratory blood sample courier dispatch logistics"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "15,000 Visit Requests/Sec • Strict HIPAA Cryptographic Isolation Peak • 1M Consultations/Day • 100k Concurrent Doctor Visits",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/clinical/consultations/start",
        "purpose": "Doctor initiates secure video consultation session with queued patient",
        "requestSample": "{\n  \"patientId\": \"pat_9912\",\n  \"clinicId\": \"cln_pediatrics_01\",\n  \"hipaaConsentSigned\": true\n}",
        "responseSample": "{\n  \"sessionId\": \"ses_tele_4421\",\n  \"signalingToken\": \"jwt_hipaa_signed_token\",\n  \"sfuServer\": \"hipaa-sfu-01.teladoc.internal\"\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/clinical/prescriptions",
        "purpose": "Issue digitally signed e-prescription to partner pharmacy network",
        "requestSample": "{\n  \"sessionId\": \"ses_tele_4421\",\n  \"patientId\": \"pat_9912\",\n  \"medication\": \"Amoxicillin 500mg\",\n  \"pharmacyNpi\": \"1928301928\"\n}",
        "responseSample": "{\n  \"prescriptionId\": \"rx_88129\",\n  \"status\": \"TRANSMITTED_SURESCRIPTS\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ConsultationSession",
        "attributes": "session_id (PK), doctor_id, patient_id, status (WAITING|IN_PROGRESS|COMPLETED), started_at, ended_at, hipaa_consent_id",
        "description": "Clinical encounter session context."
      },
      {
        "name": "MedicalRecordPHI",
        "attributes": "record_id (PK), patient_id (INDEX), doctor_id, encrypted_diagnosis_blob, icd10_codes (ARRAY), encrypted_key_arn, created_at",
        "description": "AES-256 encrypted clinical consultation notes."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Teladoc / HIPAA-Compliant Video Doctor Visit)",
        "steps": [
          "1. Client (Patient Mobile / Web App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (HIPAA Edge Gateway & Auth (mTLS)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (E2EE Signaling Server (WSS)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Immutable Audit Trail (WORM Storage)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Teladoc / HIPAA-Compliant Video Doctor Visit)",
        "steps": [
          "1. Client (Patient Mobile / Web App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (HIPAA Edge Gateway & Auth (mTLS)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (E2EE Signaling Server (WSS)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Immutable Audit Trail (WORM Storage)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Unencrypted Media Recording Trap: 'Can we record visits directly to an S3 bucket?'",
        "juniorAnswer": "Save the video file to standard AWS S3 bucket for doctors to review later.",
        "staffRebuttal": "Storing unencrypted medical consultation video violates HIPAA federal law and carries millions in fines. Any recording requires explicit patient consent, client-side or hardware envelope encryption (KMS customer-managed keys), and storage in an isolated HIPAA-compliant vault with strict 7-year retention policies."
      },
      {
        "trapTitle": "The Standard Centralized Logging Trap: 'Can we log incoming request bodies to Datadog or ELK?'",
        "juniorAnswer": "Send standard application error logs including patient requests to centralized Datadog/ELK.",
        "staffRebuttal": "Dumping full HTTP payloads to general APM tools leaks Protected Health Information (PHI: patient names, symptoms, medication) into uncertified third-party search indexes. Staff engineers use redaction middleware at the API Gateway to sanitize PHI before emitting operational telemetry."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (15,000 Visit Requests/Sec • Strict HIPAA Cryptographic Isolation, 1M Consultations/Day • 100k Concurrent Doctor Visits)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "live_auction_ebay": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-20ms Atomic Bid Ingestion & Conflict Resolution",
        "detail": "Process concurrent bids with strict linearizability, accepting the first higher bid and rejecting stale bids in <20ms."
      },
      {
        "id": "FR2",
        "title": "Real-Time Room Price Broadcast (<50ms Latency)",
        "detail": "Broadcast newly accepted high bids to all observing clients via WebSockets within 50 milliseconds."
      },
      {
        "id": "FR3",
        "title": "Anti-Sniping Dynamic Countdown Extension",
        "detail": "Automatically extend auction closing timer by 30 seconds when bids arrive within the final 10 seconds of an auction."
      }
    ],
    "outOfScope": [
      "Physical antique provenance verification appraisal certification workflow",
      "Freight international customs shipping container insurance calculation",
      "Live streaming video broadcast of human auctioneer hammer cadence"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Bid Submissions/Sec • Zero Sniping Race Conditions Peak • 100k Live Auctions • 1M Bids/Minute During Closing",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/auctions/v1/rooms/:auctionId",
        "purpose": "Bi-directional WebSocket for submitting bids and receiving live price updates",
        "requestSample": "{\n  \"action\": \"PLACE_BID\",\n  \"amountCents\": 55000,\n  \"bidderId\": \"usr_bid_88\"\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\",\n  \"currentHighBidCents\": 55000,\n  \"highBidderMasked\": \"u***8\",\n  \"endsAt\": 1729001530\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/auctions/:auctionId",
        "purpose": "Retrieve current auction state, reserve price status, and bid increments",
        "responseSample": "{\n  \"auctionId\": \"auc_9912\",\n  \"itemTitle\": \"1968 Vintage Fender Stratocaster\",\n  \"currentBidCents\": 55000,\n  \"minIncrementCents\": 1000,\n  \"status\": \"ACTIVE\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "AuctionItem",
        "attributes": "auction_id (PK), seller_id, current_high_bid_cents, high_bidder_id, reserve_price_cents, starts_at, ends_at, status (PENDING|ACTIVE|COMPLETED|CANCELLED)",
        "description": "Active auction lifecycle state."
      },
      {
        "name": "BidHistory",
        "attributes": "bid_id (PK UUID), auction_id (INDEX), bidder_id, amount_cents, server_timestamp_ms, was_winning_bid",
        "description": "Append-only immutable record of all bids."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design eBay / Live Real-Time Bidding Auction)",
        "steps": [
          "1. Client (Bidding Mobile / Web App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Bid Ingress Gateway (Netty)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Anti-Sniping Dynamic Timer) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Post-Auction Settlement Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design eBay / Live Real-Time Bidding Auction)",
        "steps": [
          "1. Client (Bidding Mobile / Web App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Bid Ingress Gateway (Netty)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Anti-Sniping Dynamic Timer) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Post-Auction Settlement Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Relational Database Optimistic Locking Trap: 'Can we use SELECT FOR UPDATE on the auction row?'",
        "juniorAnswer": "Use PostgreSQL SELECT FOR UPDATE to lock the auction row when a bid arrives.",
        "staffRebuttal": "In the final 5 seconds of a hot auction, thousands of bidders submit bids simultaneously. `SELECT FOR UPDATE` causes thousands of transactions to queue on the same row lock, causing database connection timeouts and massive latency spikes (>2s), ruining the auction. Staff engineers use in-memory single-threaded actors (Redis Lua / Akka) to accept bids in <1ms."
      },
      {
        "trapTitle": "The Client Clock Timestamp Trust Trap: 'Can we determine who bid first using client timestamps?'",
        "juniorAnswer": "Compare the timestamp sent by the mobile device to decide which bid came first.",
        "staffRebuttal": "Client clocks can be deliberately manipulated or out of sync by seconds due to drift. Never trust client timestamps for ordering bids. The authoritative sequencer is the server's arrival time at the in-memory room actor."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Bid Submissions/Sec • Zero Sniping Race Conditions, 100k Live Auctions • 1M Bids/Minute During Closing)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "package_tracking_ups": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Chronological Milestone Tracking Pipeline",
        "detail": "Ingest and process 500M daily barcode scans with strict per-package causal ordering guarantee."
      },
      {
        "id": "FR2",
        "title": "Sub-5ms Consumer Tracking Lookups",
        "detail": "Serve real-time package journey timelines to 50,000 QPS consumer tracking requests from Redis cache."
      },
      {
        "id": "FR3",
        "title": "Offline-Resilient Courier Device Synchronization",
        "detail": "Safely ingest bulk scan batches uploaded by couriers emerging from dead zones without duplicate event creation."
      }
    ],
    "outOfScope": [
      "Fleet semi-truck diesel engine preventative maintenance telemetry",
      "Warehouse automated conveyor belt PLC motor controller software",
      "Cross-border international customs import tariff tax calculation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Scan Events/Sec • 50,000 Tracking Status Reads/Sec Peak • 25M Packages Delivered/Day • 500M Scans/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/telemetry/scans",
        "purpose": "Courier scanner device uploads package barcode scan milestone event",
        "requestSample": "{\n  \"trackingNumber\": \"1Z9999999999999999\",\n  \"eventType\": \"OUT_FOR_DELIVERY\",\n  \"facilityId\": \"HUB_ORD_01\",\n  \"deviceLat\": 41.8781,\n  \"deviceLng\": -87.6298,\n  \"scannedAt\": 1729001200\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\",\n  \"eventId\": \"evt_scan_9912\"\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/tracking/:trackingNumber",
        "purpose": "Consumer retrieves complete chronological journey and estimated delivery",
        "responseSample": "{\n  \"trackingNumber\": \"1Z9999999999999999\",\n  \"status\": \"OUT_FOR_DELIVERY\",\n  \"estimatedDelivery\": \"2026-10-29T18:00:00Z\",\n  \"events\": [\n    { \"type\": \"OUT_FOR_DELIVERY\", \"location\": \"Chicago, IL\", \"timestamp\": \"2026-10-29T07:15:00Z\" },\n    { \"type\": \"ARRIVED_AT_FACILITY\", \"location\": \"Chicago, IL\", \"timestamp\": \"2026-10-28T22:30:00Z\" }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "PackageSummary",
        "attributes": "tracking_number (PK), sender_id, recipient_id, current_status, origin_hub, destination_address, estimated_delivery, updated_at",
        "description": "High-level parcel routing context."
      },
      {
        "name": "PackageMilestoneEvent",
        "attributes": "tracking_number (PARTITION KEY), scanned_at (CLUSTER KEY DESC), event_type (ENUM), facility_id, lat, lng, courier_id",
        "description": "Chronological scan history."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design UPS / Global Package Milestone Tracking)",
        "steps": [
          "1. Client (Warehouse / Courier Barcode Scanner) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Telemetry Ingestion Gateway (MQTT / HTTP)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Milestone State Transition Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Delivery Alert Dispatcher) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design UPS / Global Package Milestone Tracking)",
        "steps": [
          "1. Client (Warehouse / Courier Barcode Scanner) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Telemetry Ingestion Gateway (MQTT / HTTP)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Milestone State Transition Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Delivery Alert Dispatcher) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Out-of-Order Milestone Race Condition Trap: 'What if OUT_FOR_DELIVERY arrives after DELIVERED?'",
        "juniorAnswer": "Update the database with the event as soon as it arrives at the API server.",
        "staffRebuttal": "If a courier scans DELIVERED offline in an elevator, and an earlier hub scan syncs over 5G first, the package might flip back to OUT_FOR_DELIVERY. Staff engineers partition Kafka topics by `tracking_number` and use monotonic state machine versioning: if `new_event.timestamp < latest_event.timestamp`, the state transition is rejected or re-ordered."
      },
      {
        "trapTitle": "The Relational Database History Array Trap: 'Can we store milestones in a JSON column in Postgres?'",
        "juniorAnswer": "Store an array of milestone events in a JSONB column on the package row.",
        "staffRebuttal": "Appending to a JSONB array on every scan requires reading the entire array, modifying it, and rewriting the entire row, causing table bloat and high write amplification. Staff engineers use an append-only wide-column database (Cassandra / DynamoDB) where each scan is a new row keyed by `(tracking_number, scan_timestamp)`."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Scan Events/Sec • 50,000 Tracking Status Reads/Sec, 25M Packages Delivered/Day • 500M Scans/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "smart_home_iot_hub": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Local & Cloud Rule Automation Engine",
        "detail": "Evaluate smart home triggers and execute corresponding actions in <50ms, supporting offline execution on edge hubs."
      },
      {
        "id": "FR2",
        "title": "Device Shadow State Synchronization (Digital Twin)",
        "detail": "Maintain bi-directional reported vs desired state synchronization across intermittent connectivity."
      },
      {
        "id": "FR3",
        "title": "Scale to 200M Persistent MQTT Device Connections",
        "detail": "Terminate hundreds of millions of low-bandwidth MQTT connections across geographically distributed broker clusters."
      }
    ],
    "outOfScope": [
      "Hardware Zigbee / Matter RF silicon radio firmware compiling",
      "Continuous 24/7 4K security camera video cloud streaming recording",
      "Emergency 911 dispatch integration for home burglaries"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Sensor Telemetry/Sec • Sub-50ms Rule Execution Peak • 20M Connected Homes • 200M Active IoT Devices",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "MQTT",
        "endpoint": "devices/:deviceId/state/update",
        "purpose": "Device reports physical sensor state changes to cloud shadow",
        "requestSample": "{\n  \"state\": { \"reported\": { \"motion\": true, \"batteryPct\": 88 } },\n  \"timestamp\": 1729001200\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\"\n}"
      },
      {
        "method": "PATCH",
        "endpoint": "/api/v1/devices/:deviceId/desired",
        "purpose": "User modifies desired device configuration via mobile app",
        "requestSample": "{\n  \"state\": { \"desired\": { \"power\": \"ON\", \"brightness\": 75 } }\n}",
        "responseSample": "{\n  \"status\": \"PENDING_SYNC\",\n  \"version\": 42\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "DeviceShadow",
        "attributes": "device_id (PK), home_id, reported_state (JSONB), desired_state (JSONB), version, connected_bool, last_seen_at",
        "description": "Digital twin state record."
      },
      {
        "name": "AutomationRule",
        "attributes": "rule_id (PK), home_id, trigger_conditions (JSON), actions (JSON), is_enabled, execute_locally_bool",
        "description": "Configured home automation logic."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Smart Home IoT Automation Gateway)",
        "steps": [
          "1. Client (Smart Device / Sensor (Zigbee/Matter)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Local Smart Home Edge Hub) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Real-Time Automation Rule Evaluator) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Homeowner Mobile Client) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Smart Home IoT Automation Gateway)",
        "steps": [
          "1. Client (Smart Device / Sensor (Zigbee/Matter)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Local Smart Home Edge Hub) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Real-Time Automation Rule Evaluator) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Homeowner Mobile Client) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Cloud-Only Dependency Trap: 'Why not route all light switch actions through AWS?'",
        "juniorAnswer": "Send every light switch event to AWS API Gateway, run a Lambda, and send a push to the light bulb.",
        "staffRebuttal": "If the home internet connection drops or AWS suffers an outage, the homeowner cannot turn on their bedroom light. Smart home systems require local edge compute on the home hub (Matter/Home Assistant style) so local automations work 100% offline."
      },
      {
        "trapTitle": "The Persistent HTTP Polling Trap: 'Can IoT devices use HTTP GET /desired-state every 2 seconds?'",
        "juniorAnswer": "Have each smart light poll the cloud server every 2 seconds to check if the user turned it on.",
        "staffRebuttal": "200M devices polling every 2 seconds equals 100M HTTP requests/sec, generating massive network transit costs and draining device batteries. Staff engineers use MQTT over persistent TLS sockets: the server pushes updates instantly only when state changes occur."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Sensor Telemetry/Sec • Sub-50ms Rule Execution, 20M Connected Homes • 200M Active IoT Devices)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "ride_hailing_fare_calc": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Multi-Tier Upfront Fare Calculation",
        "detail": "Compute guaranteed upfront fares across Standard, XL, and Premium car classes in under 50ms."
      },
      {
        "id": "FR2",
        "title": "10-Minute Cryptographic Price Lock Guarantee",
        "detail": "Sign fare estimates with HMAC signatures so prices remain fixed for 10 minutes even if real-time surge shifts."
      },
      {
        "id": "FR3",
        "title": "Dynamic Toll & Municipal Surcharge Calculation",
        "detail": "Dynamically detect bridge tolls, airport pickup surcharges, and congestion tax along projected route."
      }
    ],
    "outOfScope": [
      "Driver tax reporting and annual 1099 distribution",
      "Fleet auto loan financing application processing",
      "Autonomous vehicle fleet sensor telemetry"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Fare Calculations/Sec • Sub-50ms Response Time Peak • 50M Daily Ride Quotes • 100M Route Calculations",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/fares/estimate",
        "purpose": "Calculate upfront price estimates across multiple vehicle tiers",
        "requestSample": "{\n  \"riderId\": \"rdr_9921\",\n  \"pickup\": { \"lat\": 37.7749, \"lng\": -122.4194 },\n  \"dropoff\": { \"lat\": 37.3382, \"lng\": -121.8863 }\n}",
        "responseSample": "{\n  \"quoteId\": \"qte_88a1b2\",\n  \"expiresAt\": 1729001800,\n  \"tiers\": [\n    { \"tier\": \"STANDARD\", \"fareCents\": 3850, \"etaMinutes\": 4 },\n    { \"tier\": \"XL\", \"fareCents\": 5800, \"etaMinutes\": 8 }\n  ],\n  \"quoteSignature\": \"hmac_sha256_hash\"\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/fares/verify-lock",
        "purpose": "Verify signed quote during ride booking",
        "requestSample": "{\n  \"quoteId\": \"qte_88a1b2\",\n  \"selectedTier\": \"STANDARD\",\n  \"signature\": \"hmac_sha256_hash\"\n}",
        "responseSample": "{\n  \"isValid\": true,\n  \"guaranteedFareCents\": 3850\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "FareQuote",
        "attributes": "quote_id (PK), rider_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, calculated_fare_cents, surge_multiplier, expires_at, signature",
        "description": "10-minute guaranteed fare price lease."
      },
      {
        "name": "PricingRateCard",
        "attributes": "city_id (PK), tier (PK), base_fare_cents, per_minute_cents, per_mile_cents, min_fare_cents, cancellation_fee_cents",
        "description": "Base municipal pricing rate configuration."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Lyft / Upfront Dynamic Fare Estimation)",
        "steps": [
          "1. Client (Rider Mobile App Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (API Gateway & Auth Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Live Surge Factor Cache (Redis)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Fare Conversion Analytics Bus (Kafka)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Lyft / Upfront Dynamic Fare Estimation)",
        "steps": [
          "1. Client (Rider Mobile App Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (API Gateway & Auth Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Live Surge Factor Cache (Redis)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Fare Conversion Analytics Bus (Kafka)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Full Turn-by-Turn Routing Trap: 'Can we run full A* navigation for every quote request?'",
        "juniorAnswer": "Run full turn-by-turn routing for every fare estimate request.",
        "staffRebuttal": "50,000 users open the app to browse prices every second. Running full graph navigation for each browse request will saturate the routing compute cluster. Staff engineers use fast Euclidean-to-road distance approximations or precomputed Distance Matrix lookups to calculate estimates in <5ms."
      },
      {
        "trapTitle": "The Dynamic Price Drift Trap: 'What if surge increases between when the user views the price and books?'",
        "juniorAnswer": "Recalculate the price when the user taps 'Confirm Ride' and charge whatever the latest surge is.",
        "staffRebuttal": "Charging a higher price than what was displayed on screen causes massive rider churn and chargeback disputes. Staff engineers issue a cryptographically signed Upfront Fare Token with a 10-minute expiration: the company honors the quoted price as long as the booking occurs within the lease."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Fare Calculations/Sec • Sub-50ms Response Time, 50M Daily Ride Quotes • 100M Route Calculations)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "food_delivery_driver_routing": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5s Multi-Stop Vehicle Routing Problem (VRP) Solver",
        "detail": "Solve optimal pickup-dropoff stop sequences for batched food orders that minimize delivery delays and travel distances."
      },
      {
        "id": "FR2",
        "title": "Food Freshness & Cold-Food Dwell Time Optimization",
        "detail": "Synchronize driver arrival times with restaurant kitchen cooking prep predictions to prevent food sitting cold."
      },
      {
        "id": "FR3",
        "title": "Dynamic Mid-Route Order Insertion",
        "detail": "Insert additional nearby food pickups into active driver delivery routes in real time if detour is under 5 minutes."
      }
    ],
    "outOfScope": [
      "Restaurant kitchen POS ticket printing thermal hardware driver protocols",
      "In-app customer tipping tip adjustment dispute mediation",
      "Autonomous sidewalk delivery drone LiDAR collision obstacle avoidance"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "20,000 Batch Route Optimizations/Sec • Sub-5s Solution Time Peak • 10M Deliveries/Day • 1M Active Dashers",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/dispatch/optimize-batch",
        "purpose": "Solve multi-order bundle assignment for candidate drivers",
        "requestSample": "{\n  \"orderIds\": [\"ord_101\", \"ord_102\"],\n  \"candidateDriverIds\": [\"drv_44\", \"drv_99\"]\n}",
        "responseSample": "{\n  \"recommendedDriverId\": \"drv_44\",\n  \"optimizedSequence\": [\n    { \"type\": \"PICKUP\", \"restaurantId\": \"rst_shake_shack\", \"etaMinutes\": 6 },\n    { \"type\": \"DROPOFF\", \"orderId\": \"ord_101\", \"etaMinutes\": 14 }\n  ],\n  \"totalDetourMinutes\": 3.2\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/drivers/:driverId/offers/accept",
        "purpose": "Driver accepts multi-order delivery route bundle",
        "requestSample": "{\n  \"offerId\": \"off_tm_9921\",\n  \"acceptedAt\": 1729001205\n}",
        "responseSample": "{\n  \"status\": \"ASSIGNED\",\n  \"itineraryId\": \"itin_8812\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "DeliveryItinerary",
        "attributes": "itinerary_id (PK), driver_id, status (OFFERED|ACCEPTED|IN_PROGRESS|COMPLETED), stops_json, total_payout_cents, created_at",
        "description": "Ordered multi-stop driver task schedule."
      },
      {
        "name": "OrderBatchCandidate",
        "attributes": "batch_id (PK), order_ids (ARRAY), restaurant_ids (ARRAY), combined_distance_km, food_freshness_penalty, solved_at",
        "description": "Bundled order group candidate."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design DoorDash / Multi-Stop Driver Route Optimizer)",
        "steps": [
          "1. Client (Order Ready & Dispatch Stream) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Active Dasher GPS & Capacity Tracker) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Vehicle Routing Problem (VRP) Solver) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Active Delivery Route DB (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design DoorDash / Multi-Stop Driver Route Optimizer)",
        "steps": [
          "1. Client (Order Ready & Dispatch Stream) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Active Dasher GPS & Capacity Tracker) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Vehicle Routing Problem (VRP) Solver) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Active Delivery Route DB (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The NP-Hard Global Combinatorial Explosion Trap: 'Can we calculate the global optimum across all 10,000 orders simultaneously?'",
        "juniorAnswer": "Feed all active orders and drivers into an exact integer linear programming (ILP) solver to find the globally optimal route.",
        "staffRebuttal": "Solving exact VRP for 10,000 orders across 1,000 drivers is NP-hard and takes hours to solve, by which time food is cold. Staff engineers decompose the problem: first cluster orders into micro-zones (e.g. within 1km and 5-min prep window), then run fast local heuristics (like ALNS - Adaptive Large Neighborhood Search) in <200ms."
      },
      {
        "trapTitle": "The Naive Distance-Only Assignment Trap: 'Why not always assign the physically closest driver to the restaurant?'",
        "juniorAnswer": "Assign the order to the driver whose GPS is closest to the restaurant.",
        "staffRebuttal": "If the food takes 25 minutes to cook, assigning a driver 2 minutes away forces the driver to sit in the restaurant unpaid for 23 minutes, leading to driver dissatisfaction. Staff engineers use kitchen prep ML models: dispatch the driver so they arrive exactly 1-2 minutes before the order leaves the kitchen."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (20,000 Batch Route Optimizations/Sec • Sub-5s Solution Time, 10M Deliveries/Day • 1M Active Dashers)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "online_chess_engine": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-20ms Authoritative Move Validation",
        "detail": "Validate all chess piece rules, check, checkmate, stalemate, and 3-fold repetition in memory in <20ms."
      },
      {
        "id": "FR2",
        "title": "Millisecond-Precision Clock Lag Compensation",
        "detail": "Synchronize match clocks across disparate client pings without allowing client clock manipulation."
      },
      {
        "id": "FR3",
        "title": "Asynchronous Anti-Cheat Telemetry Pipeline",
        "detail": "Stream move timelines and move choices to engine evaluation cluster without impacting live move latency."
      }
    ],
    "outOfScope": [
      "In-person physical chessboard electronic sensor DGT board hardware drivers",
      "Live audio/video streaming commentary broadcast production",
      "FIDE official grandmaster title application bureaucratic verification"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Move Validations/Sec • Sub-20ms Engine Latency Peak • 500k Concurrent Games • 10M Moves/Hour",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/game/v1/play/:gameId",
        "purpose": "Stream real-time chess moves and clock updates between players",
        "requestSample": "{\n  \"action\": \"PLAY_MOVE\",\n  \"move\": \"e7e5\",\n  \"clientLagMs\": 35,\n  \"fenChecksum\": \"0x4a1f\"\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\",\n  \"san\": \"e5\",\n  \"fen\": \"rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2\",\n  \"isCheck\": false\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/games/:gameId/resign",
        "purpose": "Player resigns active game; triggers rating settlement",
        "requestSample": "{\n  \"playerId\": \"usr_chess_99\"\n}",
        "responseSample": "{\n  \"gameResult\": \"WHITE_WON_BY_RESIGNATION\",\n  \"isConcluded\": true\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ActiveBoardState",
        "attributes": "game_id (PK), current_fen (VARCHAR(100)), halfmove_clock, fullmove_number, white_clock_ms, black_clock_ms, status, actor_node_id",
        "description": "Ephemeral RAM state of active game."
      },
      {
        "name": "PgnMoveRecord",
        "attributes": "game_id (PARTITION KEY), move_number (CLUSTER KEY), notation, time_taken_ms, eval_score, created_at",
        "description": "Append-only game moves list."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Real-Time Multiplayer Chess State Machine)",
        "steps": [
          "1. Client (Player Chess Client App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Stateful WebSocket Gateway (Netty)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Millisecond Game Clock Manager) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Anti-Cheat Analysis Stream (Kafka)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Real-Time Multiplayer Chess State Machine)",
        "steps": [
          "1. Client (Player Chess Client App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Stateful WebSocket Gateway (Netty)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Millisecond Game Clock Manager) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Anti-Cheat Analysis Stream (Kafka)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Roundtrip Move Latency Trap: 'Can we persist each move to MySQL before broadcasting to the opponent?'",
        "juniorAnswer": "Write the move to the MySQL database, commit the transaction, and then notify the opponent via WebSocket.",
        "staffRebuttal": "Writing to disk on every move adds 20-50ms of database I/O latency, creating perceptible lag in fast Bullet chess (1-minute games). Staff engineers handle active moves entirely in memory actors (Akka / Erlang / Redis), broadcasting the move to the opponent in <5ms, and persisting the move to the database asynchronously."
      },
      {
        "trapTitle": "The Infinite Lag Compensation Exploitation Trap: 'Can we subtract all reported client lag from the clock?'",
        "juniorAnswer": "Subtract the full round-trip ping time from the client's clock deduction so players on bad networks don't lose time.",
        "staffRebuttal": "Unbounded lag compensation allows players to use artificial network throttling (lag switches) to gain extra thinking time while freezing the opponent's screen. Staff engineers cap lag compensation strictly (e.g. maximum 200ms grace period); any lag beyond that is penalized as clock time."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Move Validations/Sec • Sub-20ms Engine Latency, 500k Concurrent Games • 10M Moves/Hour)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "smart_thermostat_iot": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Device Shadow Synchronization",
        "detail": "Sync temperature setpoints between mobile apps and physical thermostats within 1 second across millions of devices."
      },
      {
        "id": "FR2",
        "title": "Autonomous Predictive HVAC Pre-Conditioning",
        "detail": "Pre-heat or pre-cool homes efficiently based on learned occupancy schedules and dynamic weather forecasts."
      },
      {
        "id": "FR3",
        "title": "Regional Demand-Response Peak Grid Management",
        "detail": "Orchestrate coordinated energy reduction across 500k homes during electrical grid peak emergencies."
      }
    ],
    "outOfScope": [
      "Thermostat hardware LCD display capacitive touch glass firmware",
      "High-voltage HVAC 24V relay wiring physical diagnostics",
      "Municipal smart city gas meter billing automated settlement"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Ingestion QPS • Sub-1s Schedule Sync Peak • 15M Thermostats • 1B Daily Temperature Telemetry Pings",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "MQTT",
        "endpoint": "v1/thermostats/:deviceId/telemetry",
        "purpose": "Thermostat publishes environmental sensor readings and HVAC state",
        "requestSample": "{\n  \"currentTempC\": 21.5,\n  \"humidityPct\": 45,\n  \"hvacState\": \"COOLING\",\n  \"occupancyDetected\": true,\n  \"timestamp\": 1729001200\n}",
        "responseSample": "{\n  \"status\": \"ACK\"\n}"
      },
      {
        "method": "PUT",
        "endpoint": "/api/v1/thermostats/:deviceId/target",
        "purpose": "Homeowner updates target temperature via mobile app",
        "requestSample": "{\n  \"targetTempC\": 20.0,\n  \"mode\": \"COOL\"\n}",
        "responseSample": "{\n  \"status\": \"SYNCED_TO_SHADOW\",\n  \"version\": 19\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ThermostatShadow",
        "attributes": "device_id (PK), home_id, current_temp_c, target_temp_c, mode (HEAT|COOL|ECO), is_occupied, shadow_version, updated_at",
        "description": "Thermostat operational state shadow."
      },
      {
        "name": "EnergyUsageRecord",
        "attributes": "device_id (PARTITION KEY), date_bucket (CLUSTER KEY), runtime_minutes_cooling, runtime_minutes_heating, kwh_saved, computed_at",
        "description": "Daily aggregated energy efficiency metrics."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Nest / Smart HVAC Energy Scheduling)",
        "steps": [
          "1. Client (Smart Thermostat Hardware) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (AWS IoT Core / MQTT Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (HVAC Learning & Schedule Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Homeowner Companion App) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Nest / Smart HVAC Energy Scheduling)",
        "steps": [
          "1. Client (Smart Thermostat Hardware) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (AWS IoT Core / MQTT Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (HVAC Learning & Schedule Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Homeowner Companion App) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Grid Rebound Stampede Trap: 'What happens when a 1-hour energy saving event ends?'",
        "juniorAnswer": "When the energy saving event ends at 5:00 PM, send a command to all 500,000 thermostats to resume normal temperature.",
        "staffRebuttal": "Turning on 500,000 4-ton air conditioners simultaneously at 5:00:00 PM creates a massive multi-gigawatt electrical spike that can trip regional substation transformers and cause blackouts. Staff engineers jitter the wake-up time: stagger thermostat recovery over a 20-minute random window."
      },
      {
        "trapTitle": "The Persistent Hardware Connection Failure Trap: 'How do you handle a thermostat that disconnects from Wi-Fi for 3 days?'",
        "juniorAnswer": "Throw an error and reject user mobile app temperature changes until the device comes back online.",
        "staffRebuttal": "Rejecting app changes frustrates users who want their home cool when they land at the airport. Staff engineers accept the desired state in the cloud Device Shadow with an updated version number. When the thermostat reconnects, it detects `shadow.version > device.version` and applies the settings immediately."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Ingestion QPS • Sub-1s Schedule Sync, 15M Thermostats • 1B Daily Temperature Telemetry Pings)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "ll_hls_low_latency_video": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-2s Glass-to-Glass Live Streaming Latency",
        "detail": "Deliver live video from broadcaster camera to viewer screens with under 2 seconds global latency using LL-HLS and CMAF chunking."
      },
      {
        "id": "FR2",
        "title": "Multi-Bitrate ABR Ladder Transcoding",
        "detail": "Transcode input into 1080p, 720p, 480p, and 360p adaptive bitrate streams in real time with hardware acceleration (NVENC)."
      },
      {
        "id": "FR3",
        "title": "Automated VOD Transmuxing & Permanent Archival",
        "detail": "Consolidate ephemeral 200ms CMAF chunklets into standard HLS segments for permanent on-demand video storage."
      }
    ],
    "outOfScope": [
      "Hardware HDMI capture card PCI Express driver kernel extensions",
      "Real-time AI video upscaling to 8K resolution on server GPUs",
      "In-stream copyright audio fingerprinting takedown enforcement"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Video Chunks Ingested/Sec • Low Latency HLS (CMAF) Peak • 50,000 Live Broadcasts • 5M Viewers • Sub-2s Glass-to-Glass Latency",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/live/:channelId/playlist_part.m3u8",
        "purpose": "Fetch low-latency HLS delta manifest containing latest 200ms parts",
        "requestSample": "GET /live/shroud/playlist_part.m3u8?_HLS_msn=402&_HLS_part=2",
        "responseSample": "#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-PART:DURATION=0.200,URI=\"part402.2.mp4\"\n#EXT-X-PRELOAD-HINT:TYPE=PART,URI=\"part402.3.mp4\""
      },
      {
        "method": "GET",
        "endpoint": "/live/:channelId/part402.2.mp4",
        "purpose": "Stream raw 200ms CMAF partial media segment chunk",
        "responseSample": "HTTP/2 200 OK (Content-Type: video/mp4, Chunked Transfer)"
      }
    ],
    "coreEntities": [
      {
        "name": "LiveStreamSession",
        "attributes": "stream_id (PK), channel_id, ingest_server_ip, status (ACTIVE|ENDED), current_media_sequence, bitrate_ladder (JSON), started_at",
        "description": "Active live stream operational metadata."
      },
      {
        "name": "StreamManifestState",
        "attributes": "channel_id (PK), media_sequence_num, latest_part_index, manifest_body_text, updated_at",
        "description": "Latest LL-HLS m3u8 playlist state."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Twitch / Ultra Low-Latency LL-HLS Video Transcoder)",
        "steps": [
          "1. Client (Broadcaster OBS / RTMP Encoder) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Video Ingest Origin Cluster (Netty)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Low-Latency HLS Packager) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (VOD Master Storage (S3 / Ceph)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Twitch / Ultra Low-Latency LL-HLS Video Transcoder)",
        "steps": [
          "1. Client (Broadcaster OBS / RTMP Encoder) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Video Ingest Origin Cluster (Netty)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Low-Latency HLS Packager) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (VOD Master Storage (S3 / Ceph)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Standard HLS 6-Second Segment Trap: 'Why can't standard HLS achieve 1-second latency?'",
        "juniorAnswer": "Make standard HLS segment duration 1 second instead of 6 seconds.",
        "staffRebuttal": "Standard HLS requires the player to buffer at least 3 full segments to avoid stuttering. Even with 1-second segments, waiting for 3 segments to encode and download creates 3-4 seconds of latency, plus massive HTTP GET request overhead (1 request/sec per viewer). LL-HLS uses CMAF chunked transfer over persistent HTTP/2 connections, streaming 200ms parts as they encode."
      },
      {
        "trapTitle": "The WebRTC vs LL-HLS Scale Trap: 'Why not use WebRTC for all Twitch streams?'",
        "juniorAnswer": "Use WebRTC instead of LL-HLS because WebRTC has sub-500ms latency.",
        "staffRebuttal": "WebRTC requires dedicated stateful media servers (SFUs) that cannot be cached by standard edge CDN networks (Cloudflare/Akamai). Scaling WebRTC to 10M viewers on a top Twitch channel costs 50x more in server compute than LL-HLS, which leverages commodity HTTP CDN edge caching."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Video Chunks Ingested/Sec • Low Latency HLS (CMAF), 50,000 Live Broadcasts • 5M Viewers • Sub-2s Glass-to-Glass Latency)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "rideshare_driver_onboard": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Secure Client Direct-to-S3 Upload Pipeline",
        "detail": "Upload high-res identity documents directly to encrypted S3 storage without routing large binary files through application servers."
      },
      {
        "id": "FR2",
        "title": "Automated OCR & Facial Liveness Verification",
        "detail": "Extract demographic text and match applicant selfies against license portraits with <30s processing time."
      },
      {
        "id": "FR3",
        "title": "Asynchronous Multi-Step Background Check Saga",
        "detail": "Coordinate external DMV and criminal background checks with idempotent webhook callbacks and automated retries."
      }
    ],
    "outOfScope": [
      "Physical vehicle inspection garage mechanic scheduling",
      "Commercial vehicle livery insurance policy underwriting calculations",
      "Driver mobile app turn-by-turn navigation engine"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500 Document Uploads/Sec • Sub-30s OCR & DMV Check Peak • 100k Applications/Week • 10M Identity Documents",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/onboarding/documents/presigned-url",
        "purpose": "Request secure pre-signed S3 upload URL for document verification",
        "requestSample": "{\n  \"applicantId\": \"app_8812\",\n  \"documentType\": \"DRIVERS_LICENSE_FRONT\",\n  \"sha256Hash\": \"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\"\n}",
        "responseSample": "{\n  \"uploadUrl\": \"https://vault-pii.lyft.com/uploads/doc_9912?AWSAccessKeyId=...\",\n  \"expiresInSeconds\": 300\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/onboarding/verify",
        "purpose": "Trigger asynchronous OCR and background check verification pipeline",
        "requestSample": "{\n  \"applicantId\": \"app_8812\",\n  \"licenseDocId\": \"doc_9912\",\n  \"selfieDocId\": \"doc_9913\"\n}",
        "responseSample": "{\n  \"status\": \"PROCESSING\",\n  \"verificationJobId\": \"job_vfy_4421\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "DriverApplication",
        "attributes": "application_id (PK), user_id, status (PENDING_DOCS|VERIFYING|APPROVED|REJECTED), ocr_extracted_data (ENCRYPTED JSONB), dmv_status, created_at",
        "description": "Applicant onboarding lifecycle record."
      },
      {
        "name": "VerificationDocument",
        "attributes": "doc_id (PK), application_id, doc_type (LICENSE_FRONT|LICENSE_BACK|REGISTRATION|SELFIE), s3_uri, checksum, verified_at",
        "description": "Encrypted identity document metadata."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Lyft / Driver Background Check OCR Verification)",
        "steps": [
          "1. Client (Driver Onboarding Mobile App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Encrypted Upload Gateway (mTLS)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (OCR Vision Extraction Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Onboarding State DB (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Lyft / Driver Background Check OCR Verification)",
        "steps": [
          "1. Client (Driver Onboarding Mobile App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Encrypted Upload Gateway (mTLS)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (OCR Vision Extraction Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Onboarding State DB (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Large File Through Application Gateway Trap: 'Can we upload 15MB photos through the REST API server?'",
        "juniorAnswer": "Send the license photos as multipart form data to POST /api/upload on the Node/Java backend.",
        "staffRebuttal": "Streaming 15MB images through application servers ties up HTTP worker threads, consumes memory, and saturates network bandwidth. Staff engineers issue S3 Pre-Signed URLs: the mobile client uploads directly to S3, triggering an S3 Event Notification to invoke the processing pipeline asynchronously."
      },
      {
        "trapTitle": "The Synchronous Third-Party API Trap: 'Can we wait for the DMV background check API to respond before returning HTTP 200?'",
        "juniorAnswer": "Make a synchronous HTTP call to the state DMV API inside the signup request handler.",
        "staffRebuttal": "Third-party DMV APIs regularly have 5-10 second response times or experience downtime, causing client request timeouts and connection leaks. Staff engineers process external checks asynchronously via a task queue (Temporal / SQS) with webhook callbacks."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500 Document Uploads/Sec • Sub-30s OCR & DMV Check, 100k Applications/Week • 10M Identity Documents)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "flight_tracker_radar": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Ingestion of 250k ADS-B Radio Pings/Sec",
        "detail": "Ingest and decode binary 1090 MHz radio frames from 50,000 ground receiver stations in <50ms."
      },
      {
        "id": "FR2",
        "title": "Multi-Receiver Deduplication & MLAT Multilateration",
        "detail": "Deduplicate overlapping antenna signals and triangulate positions for non-ADS-B flights using TDOA math."
      },
      {
        "id": "FR3",
        "title": "Viewport-Aware WebSocket Map Broadcast",
        "detail": "Push 1Hz aircraft coordinate movements to millions of web and mobile map clients filtered by bounding box."
      }
    ],
    "outOfScope": [
      "Air traffic control (ATC) voice radio frequency transmission",
      "Commercial airline passenger seat assignment ticket reservation",
      "Federal Aviation Administration (FAA) pilot license physical logbook storage"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "250,000 Position Messages/Sec • Sub-1s Live Map Update Peak • 200k Active Flights/Day • 50k ADS-B Receivers",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "WS",
        "endpoint": "/ws/v1/radar/viewport",
        "purpose": "Client subscribes to aircraft position updates within visible map bounding box",
        "requestSample": "{\n  \"bbox\": [37.70, -122.52, 37.82, -122.35],\n  \"zoomLevel\": 11\n}",
        "responseSample": "{\n  \"flights\": [\n    { \"icao\": \"A421F9\", \"callsign\": \"UAL421\", \"lat\": 37.751, \"lng\": -122.412, \"altFt\": 12000, \"speedKts\": 320, \"heading\": 280 }\n  ]\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/flights/:flightId/trail",
        "purpose": "Fetch complete historical flight trajectory for replay",
        "responseSample": "{\n  \"flightId\": \"flt_ual421_today\",\n  \"trajectory\": [\n    { \"lat\": 37.751, \"lng\": -122.412, \"altFt\": 12000, \"t\": 1729001200 }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "AircraftLiveState",
        "attributes": "icao_hex (PK), callsign, lat (FLOAT), lng (FLOAT), alt_ft (INT), ground_speed_kts, heading, squawk, updated_at",
        "description": "Active in-flight real-time position."
      },
      {
        "name": "FlightTrajectory",
        "attributes": "flight_id (PARTITION KEY), recorded_at (CLUSTER KEY), lat, lng, alt_ft, speed_kts",
        "description": "Continuous historical time-series breadcrumb trail."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design FlightRadar24 / Global ADS-B Aircraft Tracking)",
        "steps": [
          "1. Client (Global ADS-B Ground Feeder Antenna) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Feeder Telemetry Ingest (TCP / Netty)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Spatial Dedup & MLAT Multilateration Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Historical Flight Path DB (TimescaleDB / S3)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design FlightRadar24 / Global ADS-B Aircraft Tracking)",
        "steps": [
          "1. Client (Global ADS-B Ground Feeder Antenna) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Feeder Telemetry Ingest (TCP / Netty)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Spatial Dedup & MLAT Multilateration Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Historical Flight Path DB (TimescaleDB / S3)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Global Broadcast to Every Client Trap: 'Can we send all 20,000 active planes to every user app?'",
        "juniorAnswer": "Broadcast a list of all active planes in the world to every connected mobile phone every second.",
        "staffRebuttal": "Streaming 20,000 planes every second to 1M connected users requires 20,000,000,000 messages/sec (gigabytes of outbound bandwidth per second) and crashes phone browsers. Staff engineers filter by viewport bounding box: clients only receive updates for planes inside their visible screen coordinates."
      },
      {
        "trapTitle": "The Relational Database Trajectory Insert Trap: 'Can we insert each flight ping into PostgreSQL?'",
        "juniorAnswer": "Insert every decoded location ping into an SQL `flight_positions` table.",
        "staffRebuttal": "250,000 SQL inserts per second will exhaust database connection pools and disk write IOPS. Staff engineers store the latest coordinate in an in-memory Redis spatial index, and batch telemetry into compressed columnar files (Parquet / TimescaleDB hypertable) on S3."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (250,000 Position Messages/Sec • Sub-1s Live Map Update, 200k Active Flights/Day • 50k ADS-B Receivers)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "automated_parking_gate": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-500ms License Plate Recognition & Gate Actuation",
        "detail": "Read license plates and actuate physical gate barriers in <500ms to allow smooth drive-through entry."
      },
      {
        "id": "FR2",
        "title": "Offline-First Local Permit Cache",
        "detail": "Ensure registered permit holders can enter and exit during internet connectivity outages using local controller databases."
      },
      {
        "id": "FR3",
        "title": "Automatic Frictionless Exit Payment Settlement",
        "detail": "Calculate stay duration, apply tariff rules, and charge saved credit cards automatically upon exit."
      }
    ],
    "outOfScope": [
      "Garage structural concrete foundation crack vibration sensors",
      "EV fast charger kilowatt-hour electric transformer grid billing",
      "Physical paper ticket thermal dispenser mechanical paper jam repair"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "2,000 Gate Actions/Sec • Sub-500ms Barrier Opening Peak • 5,000 Parking Garages • 500k Daily Parking Sessions",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/garages/:garageId/gates/entry",
        "purpose": "Camera submits license plate read event to start parking session",
        "requestSample": "{\n  \"licensePlate\": \"7XYZ891\",\n  \"state\": \"CA\",\n  \"gateId\": \"gate_in_01\",\n  \"plateConfidence\": 0.98,\n  \"photoUrl\": \"s3://parking-vault/in_7xyz891.jpg\"\n}",
        "responseSample": "{\n  \"action\": \"OPEN_BARRIER\",\n  \"sessionId\": \"ses_park_8812\",\n  \"isPermitHolder\": false\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/garages/:garageId/gates/exit",
        "purpose": "Process vehicle exit, settle fee, and lift exit barrier",
        "requestSample": "{\n  \"licensePlate\": \"7XYZ891\",\n  \"gateId\": \"gate_out_02\"\n}",
        "responseSample": "{\n  \"action\": \"OPEN_BARRIER\",\n  \"amountChargedCents\": 1500,\n  \"paymentStatus\": \"PAID\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ParkingSession",
        "attributes": "session_id (PK), garage_id, license_plate (INDEX), entry_time, exit_time, total_cents, status (ACTIVE|PAID|VIOLATION), entry_photo_url",
        "description": "Vehicle garage stay record."
      },
      {
        "name": "PermitSubscriber",
        "attributes": "subscriber_id (PK), license_plate (INDEX), user_id, garage_id, payment_method_id, is_active",
        "description": "Monthly registered vehicle profile."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Smart Parking / Automated ANPR License Plate Gate)",
        "steps": [
          "1. Client (Automatic Number Plate Camera (ANPR)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Local Gate PLC Microcontroller) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Cloud Gate Gateway (mTLS)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Parking Ledger Database (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Smart Parking / Automated ANPR License Plate Gate)",
        "steps": [
          "1. Client (Automatic Number Plate Camera (ANPR)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Local Gate PLC Microcontroller) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Cloud Gate Gateway (mTLS)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Parking Ledger Database (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Cloud Internet Outage Trapped Drivers Trap: 'What happens if garage Wi-Fi drops?'",
        "juniorAnswer": "Keep the barrier closed and display an error message on the LCD screen.",
        "staffRebuttal": "Trapping dozens of cars inside a parking garage due to an internet glitch causes massive driver outrage, traffic jams, and potential safety hazards. Staff engineers run local edge controllers with a synchronized local database: registered cars enter/exit offline, and transient cars print a barcode fallback ticket."
      },
      {
        "trapTitle": "The Similar License Plate False Positive Trap: 'What if OCR misreads an O as a 0?'",
        "juniorAnswer": "Query the database for an exact string match on the license plate.",
        "staffRebuttal": "Exact matching fails on 5% of plates due to dirt, rain, or character confusion (O vs 0). Staff engineers use Levenshtein distance fuzzy matching combined with vehicle make/model/color classification from a second camera to confirm identity before opening."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (2,000 Gate Actions/Sec • Sub-500ms Barrier Opening, 5,000 Parking Garages • 500k Daily Parking Sessions)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "online_survey_polling": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-200ms Live Vote Tally & Presenter Chart Animation",
        "detail": "Ingest 10,000 votes/second and stream animated bar chart updates to stage projectors in <200ms."
      },
      {
        "id": "FR2",
        "title": "Strict Single-Vote Deduplication Enforcement",
        "detail": "Guarantee each attendee can only cast one vote per question using fingerprint and token deduplication."
      },
      {
        "id": "FR3",
        "title": "Tumbling Window Delta Broadcast Optimization",
        "detail": "Aggregate vote counter updates into 100ms batches to prevent client browser rendering thread starvation."
      }
    ],
    "outOfScope": [
      "Physical auditorium audio microphone feedback cancellation",
      "Conference badge RFID hardware check-in turnstiles",
      "Speaker slide presentation PowerPoint vector rendering engine"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "10,000 Vote Submissions/Sec • Sub-200ms Chart Bar Animation Peak • 100k Simultaneous Attendees • 10k Votes/Sec Peak",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/polls/:pollId/vote",
        "purpose": "Audience participant submits selected poll option choice",
        "requestSample": "{\n  \"optionId\": \"opt_kubernetes\",\n  \"voterFingerprint\": \"fp_88a1b2c3\"\n}",
        "responseSample": "{\n  \"status\": \"VOTE_RECORDED\",\n  \"pollId\": \"poll_9912\"\n}"
      },
      {
        "method": "WS",
        "endpoint": "/ws/v1/polls/:pollId/live-results",
        "purpose": "Presenter screen subscribes to real-time vote percentage stream",
        "responseSample": "{\n  \"totalVotes\": 4820,\n  \"breakdown\": [\n    { \"optionId\": \"opt_kubernetes\", \"votes\": 3100, \"pct\": 64.3 },\n    { \"optionId\": \"opt_serverless\", \"votes\": 1720, \"pct\": 35.7 }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "Poll",
        "attributes": "poll_id (PK), room_code, question_text, options (JSONB), is_active_bool, total_votes, created_at",
        "description": "Interactive survey configuration."
      },
      {
        "name": "VoteTally",
        "attributes": "poll_id (PK), option_id (PK), vote_count (INT), updated_at",
        "description": "Aggregated option vote count."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Slido / Live Interactive Conference Polling)",
        "steps": [
          "1. Client (Audience Mobile Web App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Vote Ingestion Gateway (Netty)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Real-Time Atomic Counter (Redis HINCRBY)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Survey Results Database (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Slido / Live Interactive Conference Polling)",
        "steps": [
          "1. Client (Audience Mobile Web App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Vote Ingestion Gateway (Netty)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Real-Time Atomic Counter (Redis HINCRBY)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Survey Results Database (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Individual WebSocket Broadcast Storm Trap: 'Can we broadcast a message to the presenter screen for every single vote?'",
        "juniorAnswer": "Whenever a user votes, send a WebSocket message to the presenter display updating the count.",
        "staffRebuttal": "When 10,000 people vote within 3 seconds, emitting 10,000 messages to the presenter's browser causes DOM re-render thrashing and crashes the presentation computer. Staff engineers buffer updates into a 100ms or 250ms tumbling window, pushing at most 4-10 smooth frame updates per second."
      },
      {
        "trapTitle": "The SQL Table Row Insert Trap: 'Can we record votes as INSERT INTO votes (poll_id, option_id) in Postgres?'",
        "juniorAnswer": "Insert a row into a PostgreSQL table for every vote and run `SELECT COUNT(*)` to calculate results.",
        "staffRebuttal": "10,000 SQL inserts per second followed by continuous `COUNT(*)` table scans will lock the database and crash query connections. Staff engineers increment an atomic in-memory counter (`HINCRBY` in Redis) in <1ms, persisting totals to SQL only when the poll closes."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (10,000 Vote Submissions/Sec • Sub-200ms Chart Bar Animation, 100k Simultaneous Attendees • 10k Votes/Sec Peak)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "notion_block_editor": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Hierarchical Block Tree Mutation & Sync",
        "detail": "Support creating, moving, and updating nested block trees with sub-50ms synchronization across concurrent collaborators."
      },
      {
        "id": "FR2",
        "title": "Batch Transactional Operation Processing",
        "detail": "Process batches of micro-operations (property changes, pointer movements) atomically to ensure tree consistency."
      },
      {
        "id": "FR3",
        "title": "Workspace-Wide Full-Text Block Search",
        "detail": "Index block text and attributes into Elasticsearch within 5 seconds of creation for real-time search."
      }
    ],
    "outOfScope": [
      "Native offline C++ local file system SQLite sync engine compilation",
      "Third-party enterprise Single Sign-On SAML XML metadata negotiation",
      "Automated PDF print pagination and CMYK color space prepress conversion"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Block Mutations/Sec • Sub-50ms Block Tree Sync Peak • 30M Active Users • 500M Blocks Created/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/workspace/saveTransactions",
        "purpose": "Batch commit block mutations, reorderings, and property edits",
        "requestSample": "{\n  \"transactions\": [\n    {\n      \"id\": \"txn_8812\",\n      \"operations\": [\n        { \"pointer\": { \"table\": \"block\", \"id\": \"blk_441\" }, \"path\": [\"properties\", \"title\"], \"command\": \"set\", \"args\": [[\"New Title\"]] }\n      ]\n    }\n  ]\n}",
        "responseSample": "{\n  \"status\": \"COMMITTED\",\n  \"latestVersion\": 482\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/workspace/loadPageChunk",
        "purpose": "Hydrate blocks required to render page view chunk",
        "requestSample": "{\n  \"pageId\": \"blk_root_01\",\n  \"limit\": 50,\n  \"cursor\": { \"stack\": [] }\n}",
        "responseSample": "{\n  \"recordMap\": {\n    \"block\": {\n      \"blk_root_01\": { \"value\": { \"id\": \"blk_root_01\", \"type\": \"page\", \"content\": [\"blk_child_01\", \"blk_child_02\"] } }\n    }\n  }\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "BlockRecord",
        "attributes": "id (PK UUID), parent_id (INDEX), parent_table (block|workspace), type (text|header|image|page), properties (JSONB), content_child_ids (ARRAY), version, updated_at",
        "description": "Core atomic Notion document building block."
      },
      {
        "name": "BlockTransactionHistory",
        "attributes": "txn_id (PK), block_id (INDEX), user_id, operation_type, args_diff (JSONB), created_at",
        "description": "Immutable audit and version history log."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Notion / Block-Based Collaborative Workspace)",
        "steps": [
          "1. Client (Notion Client (React / Electron)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Sync Edge Gateway (WebSocket)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Block Graph Cache (Redis Cluster)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Block Revision History DB (S3 / ScyllaDB)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Notion / Block-Based Collaborative Workspace)",
        "steps": [
          "1. Client (Notion Client (React / Electron)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Sync Edge Gateway (WebSocket)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Block Graph Cache (Redis Cluster)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Block Revision History DB (S3 / ScyllaDB)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Monolithic Document Blob Trap: 'Can we store the whole page as one large JSON string?'",
        "juniorAnswer": "Save the entire Notion page as a single JSON document in MongoDB or PostgreSQL.",
        "staffRebuttal": "Storing the page as one blob requires rewriting 2MB of JSON whenever a user types a single character or reorders a bullet point, destroying database throughput and making concurrent multi-user editing impossible. Notion models each paragraph and table row as an independent normalized 'Block' record with parent/child pointer arrays."
      },
      {
        "trapTitle": "The Circular Block Parenting Deadlock Trap: 'What happens if a user drags Page A into Page B while another drags B into A?'",
        "juniorAnswer": "Update the parent_id of the moved block in the database.",
        "staffRebuttal": "Concurrent moves can create an orphan circular cycle (`A -> B -> A`), causing pages to vanish from navigation and triggering infinite loops during tree traversal. Staff engineers execute parent-path cycle detection algorithms (depth-first cycle validation) before committing block move transactions."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Block Mutations/Sec • Sub-50ms Block Tree Sync, 30M Active Users • 500M Blocks Created/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "supply_chain_track": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Global Container & Vessel Telemetry Tracking",
        "detail": "Track 10M containers across global oceans combining satellite IoT pings and maritime AIS data."
      },
      {
        "id": "FR2",
        "title": "Automated Port & Checkpoint Geofence Detection",
        "detail": "Trigger milestone events automatically when ships enter designated port harbor polygon boundaries."
      },
      {
        "id": "FR3",
        "title": "Sub-Minute Cold-Chain Anomaly Alerting",
        "detail": "Detect temperature excursions in refrigerated containers and trigger carrier intervention alerts within 60 seconds."
      }
    ],
    "outOfScope": [
      "Container terminal automated gantry crane optical alignment robotics",
      "Maritime pirate vessel anti-boarding physical security defense countermeasures",
      "Customs import tax tariff legal dispute litigation documentation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "15,000 Ingestion Events/Sec • Satellite AIS & IoT Geofence Peak • 10M Shipping Containers • 50,000 Ocean Cargo Vessels",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/telemetry/satellite-pings",
        "purpose": "Satellite gateway submits container environmental and location telemetry",
        "requestSample": "{\n  \"containerId\": \"MSKU9918291\",\n  \"lat\": 12.831,\n  \"lng\": 43.192,\n  \"tempCelsius\": -22.4,\n  \"batteryPct\": 92,\n  \"timestamp\": 1729001200\n}",
        "responseSample": "{\n  \"status\": \"INGESTED\"\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/containers/:containerId/journey",
        "purpose": "Shipper queries real-time container coordinates, ETA, and temperature log",
        "responseSample": "{\n  \"containerId\": \"MSKU9918291\",\n  \"currentLocation\": { \"name\": \"Red Sea Transit\", \"lat\": 12.831, \"lng\": 43.192 },\n  \"status\": \"ON_VESSEL\",\n  \"carrierVessel\": \"MAERSK MC-KINNEY MOLLER\",\n  \"estimatedPortArrival\": \"2026-11-04T12:00:00Z\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ShippingContainer",
        "attributes": "container_id (PK), bill_of_lading_number, current_status (AT_PORT|ON_VESSEL|IN_CUSTOMS|DELIVERED), assigned_vessel_imo, origin_port, dest_port, updated_at",
        "description": "Global freight container lifecycle context."
      },
      {
        "name": "SensorTelemetryLog",
        "attributes": "container_id (PARTITION KEY), recorded_at (CLUSTER KEY), lat, lng, temp_c, door_open_bool, battery_volts",
        "description": "Time-series container environment breadcrumbs."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design DHL / Global Shipping Container Milestone Tracker)",
        "steps": [
          "1. Client (Container Satellite & Cellular IoT Tracker) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Global Marine AIS Vessel Ingest) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Port Geofence & Milestone Detector) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Customs Manifest Ledger (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design DHL / Global Shipping Container Milestone Tracker)",
        "steps": [
          "1. Client (Container Satellite & Cellular IoT Tracker) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Global Marine AIS Vessel Ingest) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Port Geofence & Milestone Detector) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Customs Manifest Ledger (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Direct Satellite Ping from Inside Ship Hold Trap: 'Why isn't the container pinging GPS from the bottom of the cargo ship?'",
        "juniorAnswer": "Expect the container's IoT cellular/satellite antenna to ping GPS every 10 minutes throughout the ocean voyage.",
        "staffRebuttal": "Containers stacked 5 levels deep inside a steel cargo ship hold have zero line-of-sight to GPS or Iridium satellites (Faraday cage effect). Staff engineers use Vessel Association: once the container is scanned onto the ship at the dock, the system tracks the ship's marine AIS transponder. When unloaded at destination port, container-level tracking resumes."
      },
      {
        "trapTitle": "The Point-in-Polygon Computation Trap: 'Can we run ST_Contains against 5,000 port polygons on every ping?'",
        "juniorAnswer": "Run PostGIS `ST_Contains(port_geom, ping_point)` on all 5,000 global ports for every satellite ping.",
        "staffRebuttal": "Running 15,000 complex polygon intersection checks/sec will bring the geospatial database to a halt. Staff engineers use coarse spatial filtering first: check if the ping falls within the port's precomputed Uber H3 cell or bounding box; only execute expensive polygon checks when inside candidate cells."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (15,000 Ingestion Events/Sec • Satellite AIS & IoT Geofence, 10M Shipping Containers • 50,000 Ocean Cargo Vessels)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "multiplayer_elo_match": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Fair Skill-Based 5v5 Team Composition Matchmaking",
        "detail": "Form balanced 10-player matches with average team MMR differential under 3% in <30 seconds."
      },
      {
        "id": "FR2",
        "title": "Latency Matrix Server Region Optimization",
        "detail": "Select optimal dedicated game server cloud regions guaranteeing sub-50ms ping for all 10 participants."
      },
      {
        "id": "FR3",
        "title": "Simultaneous 10-Player Ready Check Dispatch",
        "detail": "Prompt all 10 players with a 10-second accept window, handling re-queueing gracefully if someone declines."
      }
    ],
    "outOfScope": [
      "Hardware graphics GPU shader pipeline compilation on client PC",
      "Kernel-level ring-0 anti-cheat driver (Vanguard) operating system hooks",
      "Professional esports broadcast live observer camera production toolset"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Queue Actions/Sec • Sub-20s Match Pairing Time Peak • 15M Daily Active Players • 500k Simultaneous Matches",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 50ms P99 • 99.99% Availability (AP in CAP)",
        "derivation": "Sub-second real-time responsiveness prioritized over strict distributed linearizability."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Ephemeral RAM State • Low-Cost Tiered Cold Retention",
        "derivation": "High-frequency pings are updated in RAM; historical metrics downsampled before persistent disk archival."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/matchmaking/queue/enter",
        "purpose": "Party leader queues party into competitive skill-based matchmaking",
        "requestSample": "{\n  \"partyMembers\": [\"usr_101\", \"usr_102\"],\n  \"gameMode\": \"COMPETITIVE_5V5\",\n  \"regionPings\": { \"us-east\": 18, \"us-central\": 34, \"us-west\": 68 }\n}",
        "responseSample": "{\n  \"ticketId\": \"tkt_mm_8812\",\n  \"status\": \"SEARCHING\",\n  \"estimatedWaitSeconds\": 18\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/matchmaking/matches/:matchId/accept",
        "purpose": "Player accepts 'Match Found' prompt within 10-second countdown",
        "requestSample": "{\n  \"ticketId\": \"tkt_mm_8812\",\n  \"accepted\": true\n}",
        "responseSample": "{\n  \"status\": \"ALL_ACCEPTED\",\n  \"gameServerHost\": \"us-east-game04.riotgames.net:7777\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MatchmakingTicket",
        "attributes": "ticket_id (PK), party_id, player_ids (ARRAY), avg_mmr (INT), server_pings (JSONB), queued_at, search_radius_mmr",
        "description": "Active queue ticket awaiting match."
      },
      {
        "name": "AssignedMatch",
        "attributes": "match_id (PK), team_a_players (ARRAY), team_b_players (ARRAY), game_server_ip, game_server_port, status (ACCEPTING|PROVISIONING|LIVE|FINISHED), created_at",
        "description": "Formed match session context."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Valorant / Skill-Based ELO Matchmaking Queue)",
        "steps": [
          "1. Client (Game Client (PC / Console)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Matchmaking Edge Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Multiplayer Matchmaker Pool (Go / Akka)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Match History & Player MMR DB (Cassandra)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Valorant / Skill-Based ELO Matchmaking Queue)",
        "steps": [
          "1. Client (Game Client (PC / Console)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Matchmaking Edge Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Multiplayer Matchmaker Pool (Go / Akka)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Match History & Player MMR DB (Cassandra)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Solo Queue vs 5-Stack Premade Trap: 'Why shouldn't a 5-stack play against 5 solo players with identical MMR?'",
        "juniorAnswer": "If both teams have an average MMR of 1500, the match is mathematically fair.",
        "staffRebuttal": "A 5-stack communicates over Discord with coordinated plays, giving them a 75%+ win rate against 5 uncoordinated solo players of identical individual skill. Staff engineers prioritize matching 5-stacks against other 5-stacks, or add a synthetic MMR penalty (e.g. treating the 5-stack as 1700 MMR) to compensate for team synergy."
      },
      {
        "trapTitle": "The Single Global Queue Lock Contention Trap: 'Can we lock the matchmaking queue while searching for pairs?'",
        "juniorAnswer": "Use a global mutex lock on the matchmaking pool while the matching algorithm runs.",
        "staffRebuttal": "Locking the queue blocks all incoming ticket creations and pairs, creating massive CPU lock contention with 50,000 concurrent queue actions. Staff engineers partition the matchmaking pool by region, game mode, and MMR tiers, running concurrent worker threads that claim players atomically using Redis Lua CAS operations."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Queue Actions/Sec • Sub-20s Match Pairing Time, 15M Daily Active Players • 500k Simultaneous Matches)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "youtube_top_k": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Minute Refresh of Global Top K Trending Videos",
        "detail": "Compute real-time Top 100 trending videos from 150k views/sec over a 1-hour sliding window updated every 60 seconds."
      },
      {
        "id": "FR2",
        "title": "Probabilistic Sub-Linear Memory Heavy Hitters (Count-Min Sketch)",
        "detail": "Bound memory consumption to megabytes using Count-Min Sketch tables and Min-Heap priority queues."
      },
      {
        "id": "FR3",
        "title": "Sub-5ms Query Latency for Millions of Homepages",
        "detail": "Serve trending video lists to 100,000 homepage browse QPS directly from in-memory distributed cache."
      }
    ],
    "outOfScope": [
      "Video raw 4K transcode encoding pipelines (handled by media pipeline)",
      "Personalized collaborative filtering recommendation neural network rankings",
      "Copyright content ID audio fingerprint matching"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "150,000 View Events/Sec • 1-Hour Sliding Window Peak • 10 Billion Daily Video Views • 100M Distinct Videos",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/telemetry/views",
        "purpose": "Video player client emits watch duration heartbeat telemetry",
        "requestSample": "{\n  \"videoId\": \"vid_dQw4w9WgXcQ\",\n  \"userId\": \"usr_9912\",\n  \"watchedSeconds\": 30,\n  \"clientTimestamp\": 1729001200\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\"\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/videos/trending",
        "purpose": "Fetch global or regional top K trending videos list",
        "requestSample": "GET /api/v1/videos/trending?country=US&category=gaming&limit=50",
        "responseSample": "{\n  \"updatedAt\": \"2026-10-29T18:00:00Z\",\n  \"videos\": [\n    { \"rank\": 1, \"videoId\": \"vid_dQw4w9WgXcQ\", \"title\": \"Never Gonna Give You Up\", \"viewVelocityPerHour\": 4500000 }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "TrendingSnapshot",
        "attributes": "category_region_key (PK), window_start, window_end, ranked_video_ids (ARRAY), computed_at",
        "description": "Materialized snapshot of top trending videos."
      },
      {
        "name": "VideoViewAggregate",
        "attributes": "video_id (PK), bucket_timestamp (PK), estimated_views, sketch_depth_hash, created_at",
        "description": "Aggregated sliding window count."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design YouTube / Top K Trending Videos (HelloInterview))",
        "steps": [
          "1. Client (Video Player Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Telemetry Ingestion Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Local Count-Min Sketch Workers (Flink)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Trending Query API Service) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design YouTube / Top K Trending Videos (HelloInterview))",
        "steps": [
          "1. Client (Video Player Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Telemetry Ingestion Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Local Count-Min Sketch Workers (Flink)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Trending Query API Service) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Single Central Redis Increment Trap: 'Can we run INCR video:{id} in Redis for every view?'",
        "juniorAnswer": "Send an atomic INCR command to Redis for every video view event.",
        "staffRebuttal": "At 150,000 views/sec, sending individual INCR operations to Redis saturates network bandwidth and single-thread CPU limits. Furthermore, sorting 100M videos in a Redis Sorted Set (`ZREVRANGE`) takes massive CPU and memory. Staff engineers aggregate views in streaming worker memory windows (Flink/Kafka Streams) and maintain local Top-K heaps, only sending top candidate summaries to the central layer."
      },
      {
        "trapTitle": "The Exact Relational DB Count Scan Trap: 'Can we run SELECT video_id, COUNT(*) GROUP BY video_id ORDER BY COUNT(*) DESC?'",
        "juniorAnswer": "Store views in a table and run an SQL GROUP BY aggregation query every minute.",
        "staffRebuttal": "Scanning 10 billion rows in SQL with GROUP BY and ORDER BY will lock tables and take minutes to execute, failing the 1-minute real-time freshness SLA. Staff engineers use streaming probabilistic data structures (Count-Min Sketch + Heavy Hitters Min-Heap) that process streaming events in O(1) time."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (150,000 View Events/Sec • 1-Hour Sliding Window, 10 Billion Daily Video Views • 100M Distinct Videos)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "google_web_crawler": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Distributed Polite Crawling of 10B Web Pages",
        "detail": "Crawl up to 25,000 pages/second while strictly respecting robots.txt directives and per-host delay timers."
      },
      {
        "id": "FR2",
        "title": "Near-Duplicate Content Detection (SimHash)",
        "detail": "Detect and discard mirrored or copied web pages using 64-bit SimHash Hamming distance in <5ms."
      },
      {
        "id": "FR3",
        "title": "Sub-Linear Memory Visited URL Filtering (Bloom Filter)",
        "detail": "Check if a URL has already been visited among 10 billion URLs in O(1) memory time using Bloom filters."
      }
    ],
    "outOfScope": [
      "Executing complex JavaScript SPA client-side DOM hydration via Headless Chrome at full scale",
      "Search engine inverted index ranking algorithm computation (PageRank / BM25)",
      "Automatic dark web Tor onion hidden service protocol routing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Pages Crawled/Sec • Politeness & Robots.txt Compliance Peak • 10 Billion Web Pages • 1PB Ingested Content",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/crawler/seed-urls",
        "purpose": "Inject initial seed root URLs into high-priority crawl frontier",
        "requestSample": "{\n  \"seedUrls\": [\"https://en.wikipedia.org\", \"https://news.ycombinator.com\"],\n  \"crawlPriority\": \"HIGH\"\n}",
        "responseSample": "{\n  \"status\": \"QUEUED\",\n  \"enqueuedCount\": 2\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/crawler/stats",
        "purpose": "Fetch real-time crawl metrics, queue depth, and host politeness delay status",
        "responseSample": "{\n  \"pagesCrawledTotal\": 8421092100,\n  \"currentQps\": 24800,\n  \"activeDomains\": 450000,\n  \"frontierBacklog\": 1280000000\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "CrawledPageMetadata",
        "attributes": "url_hash (PK), original_url, http_status, simhash_fingerprint, content_length_bytes, s3_warc_path, crawled_at",
        "description": "Persistent index record of downloaded web page."
      },
      {
        "name": "HostPolitenessPolicy",
        "attributes": "domain_host (PK), delay_ms, crawl_delay_robots_txt, last_crawled_at, is_blacklisted",
        "description": "Per-domain politeness throttling state."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Web Crawler / Distributed Search Indexer)",
        "steps": [
          "1. Client (URL Frontier Scheduler) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Politeness & Host Delay Queue) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Distributed HTML Fetcher Fleet (Go / Netty)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (WARC Raw HTML Blob Archive (S3)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Web Crawler / Distributed Search Indexer)",
        "steps": [
          "1. Client (URL Frontier Scheduler) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Politeness & Host Delay Queue) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Distributed HTML Fetcher Fleet (Go / Netty)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (WARC Raw HTML Blob Archive (S3)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Spider Trap Infinite Loop: 'How do you prevent crawler from entering infinite calendar link traps?'",
        "juniorAnswer": "Follow all links found on every page until depth 10.",
        "staffRebuttal": "Websites with dynamic calendar pages (`/calendar?month=next`) generate an infinite number of unique URLs, sucking the crawler into a black hole. Staff engineers enforce URL path length caps, limit maximum pages crawled per domain, and detect repeated URL patterns."
      },
      {
        "trapTitle": "The DNS Lookup Bottleneck Trap: 'Why does a crawler slow down when increasing fetcher threads?'",
        "juniorAnswer": "Use standard operating system `gethostbyname` or DNS lookup before making HTTP requests.",
        "staffRebuttal": "Synchronous OS DNS lookups take 20-100ms. At 25,000 QPS, local DNS servers get rate-limited and threads block on DNS sockets. Staff engineers build a local in-memory asynchronous DNS cache with aggressive TTL prefetching to resolve IPs in microseconds."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Pages Crawled/Sec • Politeness & Robots.txt Compliance, 10 Billion Web Pages • 1PB Ingested Content)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_rate_limiter": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-2ms Rate Limit Validation at 500,000 QPS",
        "detail": "Validate incoming client request limits across distributed gateway nodes with sub-2ms P99 latency."
      },
      {
        "id": "FR2",
        "title": "Atomic Sliding Window Counter Enforcement",
        "detail": "Prevent boundary burst attacks using Redis Lua sliding window counters with mathematical interpolation."
      },
      {
        "id": "FR3",
        "title": "RFC 6585 Standard Rate Limit Headers & Graceful 429s",
        "detail": "Emit `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers on all throttled requests."
      }
    ],
    "outOfScope": [
      "Deep packet inspection (DPI) layer-7 SQL injection payload sanitization (WAF responsibility)",
      "Credit card overage billing invoicing clearinghouse settlement",
      "BGP Anycast routing layer-3 volume DDoS scrubbing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Rate Limit Checks/Sec • Sub-2ms P99 Latency Peak • 100k API Clients • 500k Requests/Sec Peak",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/ratelimit/v1/check",
        "purpose": "Internal gRPC/REST rate limit validation filter check",
        "requestSample": "{\n  \"clientId\": \"client_enterprise_99\",\n  \"apiEndpoint\": \"/v1/charges\",\n  \"tokensRequested\": 1\n}",
        "responseSample": "{\n  \"allowed\": true,\n  \"limit\": 10000,\n  \"remaining\": 8421,\n  \"resetInSeconds\": 32\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/quotas/:clientId",
        "purpose": "Fetch client current quota allocation and consumption status",
        "responseSample": "{\n  \"tier\": \"ENTERPRISE\",\n  \"rateLimitPerMinute\": 10000,\n  \"burstCapacity\": 15000\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ClientQuotaTier",
        "attributes": "tier_id (PK), name, requests_per_minute, burst_limit, concurrent_connections_cap, updated_at",
        "description": "Client rate limit tier policy."
      },
      {
        "name": "RateLimitCounter",
        "attributes": "rate_key (PK), current_count, window_start_epoch, expires_at",
        "description": "Ephemeral Redis in-memory token counter."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Distributed Rate Limiter)",
        "steps": [
          "1. Client (API Consumer Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Envoy / API Gateway Reverse Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Central Rate Limit Store (Redis Cluster)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (HTTP 429 Header Formatter) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Distributed Rate Limiter)",
        "steps": [
          "1. Client (API Consumer Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Envoy / API Gateway Reverse Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Central Rate Limit Store (Redis Cluster)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (HTTP 429 Header Formatter) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Fixed Window Boundary Spike Trap: 'Why is Fixed Window 100 req/min flawed?'",
        "juniorAnswer": "Use a simple key with 1-minute TTL: reset the counter at every minute boundary.",
        "staffRebuttal": "A client can send 100 requests at 00:59 and another 100 requests at 01:01, sending 200 requests within a 2-second window without exceeding the 1-minute limit, potentially crashing backend servers. Staff engineers use Sliding Window Counter or Token Bucket algorithms to enforce continuous rate enforcement."
      },
      {
        "trapTitle": "The Redis Network Saturation Bottleneck Trap: 'Can we call Redis on every single API request?'",
        "juniorAnswer": "Call Redis Cluster from the API gateway on every incoming HTTP request.",
        "staffRebuttal": "500,000 requests/sec requires 500,000 Redis commands/sec. If a network blip occurs, the entire API gateway freezes. Staff engineers use local in-memory token buffering: each gateway worker leases a block of tokens (e.g. 50 tokens) from Redis and decrements locally in RAM in <0.01ms."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Rate Limit Checks/Sec • Sub-2ms P99 Latency, 100k API Clients • 500k Requests/Sec Peak)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_log_aggregation": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Ingestion and Indexing of 50TB Daily Log Stream",
        "detail": "Ingest and index 250,000 log events/sec across 10,000 microservices with sub-5s search availability."
      },
      {
        "id": "FR2",
        "title": "Sub-Second Full-Text Incident Log Search",
        "detail": "Enable SRE engineers to query logs by service, level, and traceId across billions of records in <1 second."
      },
      {
        "id": "FR3",
        "title": "Hot-Warm-Cold Multi-Tier Storage Lifecycle Management",
        "detail": "Automatically transition aged indices from high-performance NVMe SSDs to cost-effective S3 blob storage."
      }
    ],
    "outOfScope": [
      "Distributed tracing span graph DAG waterfall flamegraph reconstruction (Jaeger domain)",
      "Host operating system hardware kernel core dump crash analysis",
      "Continuous production code profiling flamegraph generation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "250,000 Log Events/Sec • Sub-5s Searchable Availability Peak • 10,000 Microservices • 50 Terabytes Logs/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/logs/bulk",
        "purpose": "Log shipping agent submits batch of structured log events",
        "requestSample": "{\n  \"events\": [\n    { \"timestamp\": \"2026-10-29T18:00:00.124Z\", \"service\": \"payment-api\", \"level\": \"ERROR\", \"msg\": \"Connection refused to redis-01\", \"traceId\": \"tr_88a1b2\" }\n  ]\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\",\n  \"processed\": 1\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/logs/search",
        "purpose": "Query logs by Lucene search expression and time range",
        "requestSample": "{\n  \"query\": \"service:payment-api AND level:ERROR\",\n  \"from\": \"now-1h\",\n  \"to\": \"now\",\n  \"size\": 50\n}",
        "responseSample": "{\n  \"totalHits\": 142,\n  \"tookMs\": 34,\n  \"hits\": [{ \"_id\": \"log_441\", \"_source\": { \"level\": \"ERROR\", \"msg\": \"Connection refused\" } }]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "LogEventIndex",
        "attributes": "log_id (PK), timestamp, service_name (KEYWORD), level (KEYWORD), trace_id (KEYWORD), message (TEXT INDEXED), host_ip, pod_name",
        "description": "Elasticsearch inverted index document."
      },
      {
        "name": "IndexLifecyclePolicy",
        "attributes": "policy_id (PK), hot_phase_days, warm_phase_days, cold_phase_s3_archive_days, delete_phase_days",
        "description": "Retention and tiering configuration."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Distributed Log Aggregator (Elastic/Kibana))",
        "steps": [
          "1. Client (Node Log Shipper (Fluentbit / Vector)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Log Ingestion Bus (Kafka Cluster)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Search & Indexing Engine (Elasticsearch / OpenSearch)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Real-Time Anomaly & Error Alerter) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Distributed Log Aggregator (Elastic/Kibana))",
        "steps": [
          "1. Client (Node Log Shipper (Fluentbit / Vector)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Log Ingestion Bus (Kafka Cluster)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Search & Indexing Engine (Elasticsearch / OpenSearch)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Real-Time Anomaly & Error Alerter) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Direct Agent to Elasticsearch Push Trap: 'Can each container ship logs directly to Elasticsearch?'",
        "juniorAnswer": "Configure Logstash/Fluentbit on every server to POST logs directly to Elasticsearch HTTP endpoints.",
        "staffRebuttal": "When an incident occurs and error rates explode 50x, 10,000 agents will flood Elasticsearch with HTTP writes, overloading thread pools, triggering OutOfMemory crashes, and dropping logs during the exact crisis when logs are needed most. Staff engineers insert a persistent message buffer (Kafka) to absorb write spikes."
      },
      {
        "trapTitle": "The Dynamic Field Mapping Explosion Trap: 'Can developers log arbitrary nested JSON objects?'",
        "juniorAnswer": "Allow developers to log any JSON structure with dynamic mapping enabled in Elasticsearch.",
        "staffRebuttal": "Dynamic mapping generates thousands of distinct fields in the cluster cluster state, leading to 'mapping explosion' where cluster metadata exceeds memory limits and crashes the master nodes. Staff engineers enforce strict schema validation, flattening arbitrary metadata into a single unindexed `extra_json` string."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (250,000 Log Events/Sec • Sub-5s Searchable Availability, 10,000 Microservices • 50 Terabytes Logs/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_task_scheduler": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Trigger Accuracy for 100M Scheduled Jobs",
        "detail": "Dispatch millions of scheduled cron and delayed tasks within 1 second of target execution time."
      },
      {
        "id": "FR2",
        "title": "O(1) Memory Timer Triggering (Hierarchical Timing Wheel)",
        "detail": "Manage timer buckets in memory using multi-tier timing wheels to avoid repetitive database polling scans."
      },
      {
        "id": "FR3",
        "title": "Fencing-Token Guarded Exactly-Once Execution",
        "detail": "Guarantee no job runs twice even under network partitions and worker node crashes."
      }
    ],
    "outOfScope": [
      "Long-running stateful multi-month human-in-the-loop approval workflows (Temporal/Cadence scope)",
      "Bare-metal Linux container cgroup CPU isolation sandbox implementation",
      "Complex DAG dependency topology graph compilation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Job Dispatches/Sec • Exactly-Once Execution Semantics Peak • 100M Scheduled Jobs • 1M Jobs Triggered/Minute",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/jobs/schedule",
        "purpose": "Register a recurring cron schedule or delayed task",
        "requestSample": "{\n  \"jobName\": \"nightly_billing_settlement\",\n  \"cronExpression\": \"0 2 * * *\",\n  \"endpointUrl\": \"https://billing.internal/run\",\n  \"maxRetries\": 3\n}",
        "responseSample": "{\n  \"jobId\": \"job_crn_8812\",\n  \"status\": \"SCHEDULED\",\n  \"nextExecutionTime\": \"2026-10-30T02:00:00Z\"\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/jobs/:jobId/history",
        "purpose": "Query task execution audit log and status outcomes",
        "responseSample": "{\n  \"jobId\": \"job_crn_8812\",\n  \"executions\": [\n    { \"runId\": \"run_01\", \"status\": \"COMPLETED\", \"durationSec\": 142, \"finishedAt\": \"2026-10-29T02:02:22Z\" }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ScheduledJobDefinition",
        "attributes": "job_id (PK), tenant_id, cron_expr, target_endpoint, payload_json, next_run_epoch, is_paused, version",
        "description": "Persistent task schedule definition."
      },
      {
        "name": "JobExecutionRun",
        "attributes": "run_id (PK), job_id (INDEX), worker_node_id, status (QUEUED|RUNNING|COMPLETED|FAILED), started_at, completed_at, retry_attempt",
        "description": "Individual task execution record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Distributed Cron & Workflow Scheduler)",
        "steps": [
          "1. Client (Client Service / Cron Manager) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Leader Election Scheduler (Raft / etcd)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Job Metadata & Schedule Store (PostgreSQL)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Execution History DB (Cassandra / DynamoDB)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Distributed Cron & Workflow Scheduler)",
        "steps": [
          "1. Client (Client Service / Cron Manager) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Leader Election Scheduler (Raft / etcd)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Job Metadata & Schedule Store (PostgreSQL)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Execution History DB (Cassandra / DynamoDB)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Polling Table Scan Trap: 'Can we run SELECT * FROM jobs WHERE next_run <= NOW() every second?'",
        "juniorAnswer": "Have a cron scheduler run a SQL query every second to find all jobs ready to execute.",
        "staffRebuttal": "With 100 million scheduled jobs, running a query every second creates massive table scan locks and crashes database IOPS. Staff engineers load active upcoming jobs (e.g. next 1 hour) into an in-memory Hierarchical Timing Wheel or Redis Sorted Set (`ZRANGEBYSCORE`), firing callbacks with zero disk I/O."
      },
      {
        "trapTitle": "The Zombie Worker Duplicate Run Trap: 'What if a worker pauses for GC while running a job?'",
        "juniorAnswer": "Release the lock after a 30-second timeout so another worker can take over.",
        "staffRebuttal": "If Worker A suffers a 40-second Garbage Collection pause, its lock expires. Worker B takes over and starts the job. Worker A wakes up and also completes the job, resulting in duplicate processing (e.g., charging credit cards twice). Staff engineers attach monotonically increasing Fencing Tokens to locks: datastores reject writes from stale tokens."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Job Dispatches/Sec • Exactly-Once Execution Semantics, 100M Scheduled Jobs • 1M Jobs Triggered/Minute)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "cloud_object_storage_s3": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms PUT/GET Object Operations at Scale",
        "detail": "Support high-throughput object storage operations up to 250,000 QPS with sub-50ms first-byte latency."
      },
      {
        "id": "FR2",
        "title": "11 9s Durability via 8+4 Reed-Solomon Erasure Coding",
        "detail": "Achieve 99.999999999% durability tolerating the loss of up to 4 concurrent failure domains with 1.5x overhead."
      },
      {
        "id": "FR3",
        "title": "Continuous Background Bitrot Scrubbing & Self-Healing",
        "detail": "Scan stored chunks continuously to detect silent media degradation and regenerate healthy chunks automatically."
      }
    ],
    "outOfScope": [
      "POSIX compliant file system directory tree mounting and lock semantics (NFS/EFS domain)",
      "Automated virus scanning and malware behavioral detonation sandbox",
      "Real-time video chunk transcoding during object download streaming"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "250,000 Object Ops/Sec • Erasure Coded Chunk Slicing Peak • 100 Billion Objects • 1 Exabyte Storage • 99.999999999% Durability (11 9s)",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "PUT",
        "endpoint": "/:bucket/:key",
        "purpose": "Upload object data stream with client MD5/SHA256 integrity checksum",
        "requestSample": "PUT /my-media-bucket/video.mp4 (Headers: Content-Length: 104857600, x-amz-content-sha256: 4a9f...)",
        "responseSample": "HTTP 200 OK (ETag: \"9b1deb4d-b3b7-4c7b-bc4a-9921e1a\")"
      },
      {
        "method": "GET",
        "endpoint": "/:bucket/:key",
        "purpose": "Download object stream with byte-range resume support",
        "requestSample": "GET /my-media-bucket/video.mp4 (Headers: Range: bytes=0-1048575)",
        "responseSample": "HTTP 206 Partial Content (Content-Range: bytes 0-1048575/104857600)"
      }
    ],
    "coreEntities": [
      {
        "name": "ObjectMetadata",
        "attributes": "bucket_id (PK), object_key (PK), object_id (UUID), size_bytes, etag_hash, content_type, chunk_ids (ARRAY), created_at",
        "description": "Primary object namespace index."
      },
      {
        "name": "ChunkPlacement",
        "attributes": "chunk_id (PK), object_id, chunk_index, disk_node_id, rack_id, sha256_checksum, is_parity_chunk",
        "description": "Erasure coded physical chunk placement."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design S3 / Distributed Cloud Object Storage)",
        "steps": [
          "1. Client (SDK / CLI / S3 API Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (S3 Edge Router & Load Balancer) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Erasure Coding Engine (Reed-Solomon 8+4)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Lifecycle & Cold Glacier Migration Worker) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design S3 / Distributed Cloud Object Storage)",
        "steps": [
          "1. Client (SDK / CLI / S3 API Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (S3 Edge Router & Load Balancer) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Erasure Coding Engine (Reed-Solomon 8+4)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Lifecycle & Cold Glacier Migration Worker) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The 3x Replication Cost Explosion Trap: 'Why not just make 3 copies of every file?'",
        "juniorAnswer": "Store 3 identical copies of each file on 3 different servers.",
        "staffRebuttal": "At exabyte scale (1,000,000,000 gigabytes), 3x replication requires 3 exabytes of disk space (200% overhead), costing hundreds of millions of dollars. Staff engineers use Erasure Coding (e.g. Reed-Solomon 8+4): data is split into 8 chunks and 4 parity chunks. This yields higher durability than 3x replication with only 50% storage overhead."
      },
      {
        "trapTitle": "The S3 Key Prefix Hot Sharding Trap: 'What happens if millions of files are named with timestamp prefixes?'",
        "juniorAnswer": "Name files using timestamps like `s3://bucket/2026-10-29-18-00-01/file.jpg`.",
        "staffRebuttal": "In partition-key based metadata engines, naming files with monotonically increasing timestamps sends all concurrent writes to the same metadata database partition server, causing severe write throttling. Staff engineers add random hash prefixes (or rely on modern internal automated prefix partitioning) to scatter load evenly across shards."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (250,000 Object Ops/Sec • Erasure Coded Chunk Slicing, 100 Billion Objects • 1 Exabyte Storage • 99.999999999% Durability (11 9s))."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "api_gateway_envoy": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-2ms Reverse Proxy Latency at 1,000,000 QPS",
        "detail": "Process and route 1M incoming requests/sec across 1,000 internal services with <2ms added proxy overhead."
      },
      {
        "id": "FR2",
        "title": "Zero-Downtime Dynamic Configuration (xDS Protocol)",
        "detail": "Update routing tables, clusters, and endpoints dynamically via streaming gRPC without proxy restarts."
      },
      {
        "id": "FR3",
        "title": "High-Performance Edge Authentication & Rate Limiting",
        "detail": "Verify JWT cryptographic signatures locally in memory and enforce tiered rate limits before forwarding."
      }
    ],
    "outOfScope": [
      "Deep payload business validation and schema database mapping",
      "BGP Anycast hardware router border configuration",
      "Long-term cold storage analytics data warehouse reporting"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,000,000 Proxy Requests/Sec • Sub-2ms Proxy Overhead Peak • 1,000 Microservices • 1M Requests/Sec Wire Speed",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "ANY",
        "endpoint": "/api/v1/*",
        "purpose": "Forward client request to upstream target microservice with routing transforms",
        "requestSample": "GET /api/v1/orders/42 (Headers: Authorization: Bearer eyJhbGciOi...)",
        "responseSample": "HTTP 200 OK (Headers: x-envoy-upstream-service-time: 14, x-request-id: 9b1deb4d...)"
      },
      {
        "method": "GET",
        "endpoint": "/v3/discovery:endpoints",
        "purpose": "Envoy dynamic xDS endpoint discovery service (EDS) stream",
        "responseSample": "{\n  \"resources\": [\n    { \"clusterName\": \"orders-svc\", \"endpoints\": [{ \"address\": \"10.0.4.12\", \"port\": 8080 }] }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "RouteConfiguration",
        "attributes": "route_id (PK), match_path_prefix, target_cluster_name, timeout_ms, retry_policy (JSON), rate_limit_policy, updated_at",
        "description": "Envoy routing rule definition."
      },
      {
        "name": "ClusterEndpointHealth",
        "attributes": "endpoint_id (PK), cluster_name, ip_address, port, health_status (HEALTHY|UNHEALTHY), weight, updated_at",
        "description": "Upstream microservice instance status."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Cloud API Gateway & Reverse Proxy)",
        "steps": [
          "1. Client (Public API Client (Web/Mobile)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (L4 Network Load Balancer (DPDK)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (JWT / mTLS Verification Filter) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Upstream Internal Microservices) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Cloud API Gateway & Reverse Proxy)",
        "steps": [
          "1. Client (Public API Client (Web/Mobile)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (L4 Network Load Balancer (DPDK)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (JWT / mTLS Verification Filter) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Upstream Internal Microservices) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Central Auth Server Call per Request Trap: 'Can the gateway call the Auth Service on every request?'",
        "juniorAnswer": "Make an HTTP request to the User/Auth microservice on every request to verify if the token is valid.",
        "staffRebuttal": "At 1,000,000 requests/sec, making 1,000,000 synchronous HTTP calls to the Auth Service doubles network transit, adds 20ms latency, and creates a massive single point of failure that crashes the whole company when Auth slows down. Staff engineers verify asymmetric JWTs locally in gateway memory using cached JWKS public keys in <0.1ms."
      },
      {
        "trapTitle": "The Reload Configuration Disconnect Trap: 'Why not reload Nginx configuration when microservices deploy?'",
        "juniorAnswer": "Update nginx.conf and run `nginx -s reload` on every microservice deployment.",
        "staffRebuttal": "In a cluster with 1,000 microservices deploying dozens of times an hour, continuous reloads cause worker processes to pile up, leak memory, and drop active keep-alive TCP connections. Staff engineers use Envoy's xDS streaming APIs to dynamically update endpoints in memory with zero connection drops."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,000,000 Proxy Requests/Sec • Sub-2ms Proxy Overhead, 1,000 Microservices • 1M Requests/Sec Wire Speed)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "metrics_monitoring_prometheus": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Ingestion of 10M Metric Samples/Sec at 1.3 Bytes/Sample",
        "detail": "Scrape and compress 10 million telemetry samples per second using Gorilla XOR delta-of-delta compression."
      },
      {
        "id": "FR2",
        "title": "Sub-2s PromQL Range Query Execution",
        "detail": "Evaluate PromQL expressions (rates, percentiles, histograms) across millions of series in under 2 seconds."
      },
      {
        "id": "FR3",
        "title": "Infinite Retention via Automated S3 Tiering & Downsampling",
        "detail": "Archive metric blocks to S3 and downsample resolution (5m, 1h) to maintain constant query performance over years."
      }
    ],
    "outOfScope": [
      "Individual user session event clickstream tracking (Google Analytics domain)",
      "Distributed tracing span execution waterfall DAG timelines (Jaeger domain)",
      "Operating system syslog text pattern extraction (Elasticsearch domain)"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "10,000,000 Metric Samples/Sec • Sub-2s PromQL Query Execution Peak • 50,000 Servers • 1 Billion Time Series • 10M Samples/Sec",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "GET",
        "endpoint": "/metrics",
        "purpose": "Target scrape endpoint returning OpenMetrics formatted text",
        "responseSample": "# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method=\"POST\",status=\"200\"} 482910\nhttp_requests_total{method=\"POST\",status=\"500\"} 12"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/query_range",
        "purpose": "Execute PromQL range query across time window",
        "requestSample": "query=rate(http_requests_total[5m])&start=1729000000&end=1729003600&step=15",
        "responseSample": "{\n  \"status\": \"success\",\n  \"data\": { \"resultType\": \"matrix\", \"result\": [{ \"metric\": { \"status\": \"200\" }, \"values\": [[1729000000, \"124.5\"]] }] }\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MetricSeriesMetadata",
        "attributes": "series_id (PK), metric_name, labels_hash, labels_json, first_seen_at, last_seen_at",
        "description": "Unique labelset time series identifier."
      },
      {
        "name": "TSDBBlockChunk",
        "attributes": "block_id (PK), min_time, max_time, series_count, sample_count, s3_uri, compaction_level",
        "description": "Compacted immutable time series data block."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Distributed Metrics Monitoring (Prometheus/Grafana))",
        "steps": [
          "1. Client (App Metric Exporter (Prometheus Client)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Distributed Scraper Fleet (Prometheus)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Remote Write Forwarder (Thanos / Cortex)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Distributed PromQL Engine & Grafana) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Distributed Metrics Monitoring (Prometheus/Grafana))",
        "steps": [
          "1. Client (App Metric Exporter (Prometheus Client)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Distributed Scraper Fleet (Prometheus)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Remote Write Forwarder (Thanos / Cortex)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Distributed PromQL Engine & Grafana) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The High Cardinality Metric Label Bomb Trap: 'Can we add userId or orderId as a Prometheus label?'",
        "juniorAnswer": "Add `user_id` and `order_id` as labels on `http_requests_total` so we can track requests per user.",
        "staffRebuttal": "Prometheus creates a completely new in-memory time-series for every unique permutation of label values. Adding `user_id` across 10M users creates 10,000,000 active time-series, consuming 40GB+ of RAM and crashing the TSDB engine with an OutOfMemory kill. High-cardinality metadata belongs in structured logs or tracing, never metrics."
      },
      {
        "trapTitle": "The Single Monolithic Prometheus Server Trap: 'Can one Prometheus server scrape all 50,000 servers?'",
        "juniorAnswer": "Configure a single large Prometheus instance with 128 cores to scrape the entire enterprise infrastructure.",
        "staffRebuttal": "A single instance cannot maintain 10M samples/sec and fails when that server restarts. Staff engineers partition Prometheus by cluster or functional team, and federate metrics using Thanos or Cortex: local scrapers ship TSDB blocks to object storage where a distributed querier queries across all blocks."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (10,000,000 Metric Samples/Sec • Sub-2s PromQL Query Execution, 50,000 Servers • 1 Billion Time Series • 10M Samples/Sec)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_cache_redis_cluster": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Millisecond Read/Write at 2,000,000 QPS",
        "detail": "Deliver sub-1ms read/write response times across a 100-node cluster supporting 2M operations/sec."
      },
      {
        "id": "FR2",
        "title": "16,384 Hash Slot Partitioning & Smart Client Routing",
        "detail": "Partition keys across 16,384 hash slots using `CRC16(key) % 16384` with direct client routing."
      },
      {
        "id": "FR3",
        "title": "Sub-Second Automated Master Failover",
        "detail": "Elect and promote a replica to master automatically within 1-2 seconds of master node failure."
      }
    ],
    "outOfScope": [
      "ACID multi-shard distributed two-phase commit transactions spanning different hash slots",
      "Hardware NVMe persistent memory (PMEM) low-level kernel driver tuning",
      "Multi-region active-active bi-directional cross-datacenter conflict resolution"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "2,000,000 Cache Ops/Sec • Sub-1ms Read Latency Peak • 100 Nodes • 10 Terabytes RAM • 16,384 Hash Slots",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "CMD",
        "endpoint": "GET /:key",
        "purpose": "Retrieve in-memory value by string key with sub-millisecond latency",
        "requestSample": "GET user:profile:9921",
        "responseSample": "{\n  \"userId\": \"9921\",\n  \"tier\": \"GOLD\",\n  \"name\": \"Alex\"\n}"
      },
      {
        "method": "CMD",
        "endpoint": "SETEX /:key :seconds :val",
        "purpose": "Set key-value pair with automatic expiration TTL lease",
        "requestSample": "SETEX session:tok_441 3600 \"active\"",
        "responseSample": "OK"
      }
    ],
    "coreEntities": [
      {
        "name": "ClusterSlotMapping",
        "attributes": "slot_id (0-16383), master_node_id, replica_node_ids (ARRAY), is_migrating_bool, importing_node_id",
        "description": "Hash slot assignment map."
      },
      {
        "name": "NodeClusterState",
        "attributes": "node_id (PK), ip_address, port, role (MASTER|SLAVE), flags, last_ping_sent, last_pong_received, link_status",
        "description": "Gossip protocol node health record."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Distributed In-Memory Cache (Redis Cluster))",
        "steps": [
          "1. Client (Application Smart Cache Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Gossip Protocol Cluster Bus) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Asynchronous Replica Slave Shard) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Slot Resharding & Migration Worker) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Distributed In-Memory Cache (Redis Cluster))",
        "steps": [
          "1. Client (Application Smart Cache Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Gossip Protocol Cluster Bus) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Asynchronous Replica Slave Shard) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Slot Resharding & Migration Worker) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Multi-Key Operation Across Shards Trap: 'Why do MGET and Lua scripts fail in Redis Cluster?'",
        "juniorAnswer": "Run `MGET user:1 user:2` or a Lua script touching multiple keys across the cluster.",
        "staffRebuttal": "Redis Cluster does not support multi-key operations if the keys hash to different nodes (returns `CROSSSLOT Keys in request don't hash to the same slot`). Staff engineers use Hash Tags: wrapping the common shard identifier in curly braces (e.g. `{user:1}:profile` and `{user:1}:orders`) guarantees that both keys hash to the same slot."
      },
      {
        "trapTitle": "The Hot Key Shard Saturation Trap: 'What happens when a single celebrity key receives 200,000 QPS?'",
        "juniorAnswer": "Let Redis Cluster distribute keys evenly across all nodes.",
        "staffRebuttal": "Even distribution applies to keys, not traffic. If a single hot key (e.g., a viral post) receives 200,000 QPS, all traffic hits the single shard owning that slot, saturating that node's CPU while others sit idle. Staff engineers duplicate hot keys across shards using random suffixes (`key_1`, `key_2`, `key_N`) or use a local in-process client cache (Caffeine / L1 cache)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (2,000,000 Cache Ops/Sec • Sub-1ms Read Latency, 100 Nodes • 10 Terabytes RAM • 16,384 Hash Slots)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "video_transcoding_cluster": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5 Minute Transcoding of 4K Videos via Parallel Chunking",
        "detail": "Transcode raw 4K videos into multi-bitrate ABR ladders (1080p, 720p, 480p) in under 5 minutes using parallel workers."
      },
      {
        "id": "FR2",
        "title": "GOP-Aligned Keyframe Slicing & Manifest Assembly",
        "detail": "Split videos strictly at keyframe boundaries and stitch completed chunks into HLS .m3u8 manifests."
      },
      {
        "id": "FR3",
        "title": "Fault-Tolerant Ephemeral Spot Worker Fleet",
        "detail": "Run encoding tasks on cost-effective spot instances with automated retry handling on worker termination."
      }
    ],
    "outOfScope": [
      "Real-time video player UI controls (React video player component)",
      "Automated closed-captioning deep speech-to-text translation",
      "Video content intellectual property copyright fingerprint watermarking"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,000 Video Ingestion Jobs/Sec • Sub-5 Minute 4K Transcoding Peak • 500 Hours Video Uploaded/Minute • 10M Tasks/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/transcoding/jobs",
        "purpose": "Submit new raw video transcoding job pipeline",
        "requestSample": "{\n  \"rawS3Uri\": \"s3://raw-masters/vid_9912.mov\",\n  \"codecs\": [\"H264\", \"AV1\"],\n  \"resolutions\": [\"1080p\", \"720p\", \"480p\"],\n  \"priority\": \"HIGH\"\n}",
        "responseSample": "{\n  \"jobId\": \"job_tx_4412\",\n  \"status\": \"QUEUED\",\n  \"chunkCount\": 72,\n  \"estimatedSeconds\": 45\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/transcoding/jobs/:jobId",
        "purpose": "Poll transcoding progress percentage and output manifest URLs",
        "responseSample": "{\n  \"jobId\": \"job_tx_4412\",\n  \"progressPct\": 94,\n  \"chunksCompleted\": 68,\n  \"chunksTotal\": 72,\n  \"status\": \"STITCHING\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "TranscodeJob",
        "attributes": "job_id (PK), raw_s3_uri, total_duration_seconds, chunk_count, completed_chunks, status (PROCESSING|COMPLETED|FAILED), manifest_s3_uri, created_at",
        "description": "Master video transcode job."
      },
      {
        "name": "ChunkTask",
        "attributes": "chunk_id (PK), job_id (INDEX), chunk_index, start_seconds, duration_seconds, status, worker_instance_id, attempt_count",
        "description": "Individual 5-second chunk transcoding subtask."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Distributed Video Transcoding Fleet)",
        "steps": [
          "1. Client (Content Creator Upload App) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Master Raw Video Storage (S3)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Transcode Priority Queue (SQS / Kafka)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Public Video CDN Storage (S3 / Cloudflare)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Distributed Video Transcoding Fleet)",
        "steps": [
          "1. Client (Content Creator Upload App) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Master Raw Video Storage (S3)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Transcode Priority Queue (SQS / Kafka)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Public Video CDN Storage (S3 / Cloudflare)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Monolithic Single-Worker Transcode Trap: 'Why not encode the whole video file on one large machine?'",
        "juniorAnswer": "Assign each video file to an EC2 instance that runs FFmpeg from start to finish.",
        "staffRebuttal": "Encoding a 2-hour 4K video on a single machine takes 1-2 hours, forcing users to wait hours before watching. If the server crashes at 98%, the entire encode must restart. Staff engineers split the video into hundreds of 5-second chunks, processing them concurrently across hundreds of spot instances in parallel."
      },
      {
        "trapTitle": "The Audio-Video Drift Desynchronization Trap: 'What happens if audio and video chunks have slight timing misalignments?'",
        "juniorAnswer": "Encode audio and video chunks separately and stitch them together at the end.",
        "staffRebuttal": "Audio sample rates and video frame rates do not align perfectly to exact millisecond boundaries (e.g. 23.976 FPS vs 44.1 kHz audio). Truncating at arbitrary points causes accumulated audio drift (lip sync delay) by the end of a long video. Staff engineers align chunk boundaries strictly to video Presentation Time Stamps (PTS)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,000 Video Ingestion Jobs/Sec • Sub-5 Minute 4K Transcoding, 500 Hours Video Uploaded/Minute • 10M Tasks/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "realtime_analytics_clickhouse": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-100ms Analytical Query Latency across 100B Rows",
        "detail": "Execute real-time aggregation queries (sum, count, unique user estimation) across billions of records in under 100ms."
      },
      {
        "id": "FR2",
        "title": "High-Throughput Ingestion of 1,000,000 Events/Sec",
        "detail": "Ingest 1M events/second into ClickHouse without write lock contention using batching and Kafka buffering."
      },
      {
        "id": "FR3",
        "title": "Continuous Background Materialized View Pre-Aggregation",
        "detail": "Maintain pre-aggregated hourly and daily metric rollups automatically using SummingMergeTree engines."
      }
    ],
    "outOfScope": [
      "Transactional ACID multi-table cross-shard banking ledger rollbacks (OLTP domain)",
      "Real-time operational dashboard alerting pager escalation (Prometheus domain)",
      "Point-in-time single row updates and row-level delete mutations"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,000,000 Ingestion Events/Sec • Sub-100ms Aggregate OLAP Queries Peak • 100 Billion Events/Day • 100 Terabytes Ingested/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/telemetry/events",
        "purpose": "Client analytics SDK submits batch of user interaction events",
        "requestSample": "{\n  \"batch\": [\n    { \"eventId\": \"evt_101\", \"userId\": \"usr_42\", \"event\": \"purchase\", \"amountCents\": 4500, \"timestamp\": 1729001200 }\n  ]\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\",\n  \"count\": 1\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/analytics/query",
        "purpose": "Execute real-time OLAP analytical aggregation query",
        "requestSample": "{\n  \"sql\": \"SELECT toStartOfHour(timestamp) AS hour, count() AS totalEvents, uniqExact(userId) AS dau FROM events WHERE timestamp >= now() - INTERVAL 24 HOUR GROUP BY hour ORDER BY hour\"\n}",
        "responseSample": "{\n  \"meta\": [{ \"name\": \"hour\", \"type\": \"DateTime\" }, { \"name\": \"totalEvents\", \"type\": \"UInt64\" }],\n  \"data\": [[\"2026-10-29 17:00:00\", 482910, 18420]],\n  \"rows\": 1,\n  \"elapsedSeconds\": 0.042\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "EventsMergeTree",
        "attributes": "event_date (PARTITION KEY Date), timestamp (DateTime), event_type (LowCardinality String), user_id (UInt64), merchant_id (UInt32), amount_cents (UInt64), properties (String)",
        "description": "Columnar primary event storage."
      },
      {
        "name": "HourlyMerchantAggregates",
        "attributes": "hour (DateTime), merchant_id (UInt32), total_events (SimpleAggregateFunction sum), total_revenue_cents (SimpleAggregateFunction sum)",
        "description": "SummingMergeTree pre-aggregated real-time rollups."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Real-Time Analytics Pipeline (ClickHouse))",
        "steps": [
          "1. Client (Web / Mobile Analytics SDK) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (High-Throughput Collector Gateway (Rust / Go)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (ClickHouse Ingestion Buffer Engine) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (BI Dashboard & SQL Query API) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Real-Time Analytics Pipeline (ClickHouse))",
        "steps": [
          "1. Client (Web / Mobile Analytics SDK) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (High-Throughput Collector Gateway (Rust / Go)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (ClickHouse Ingestion Buffer Engine) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (BI Dashboard & SQL Query API) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Single-Row Insert Explosion Trap: 'Can we send INSERT INTO events VALUES (...) for every single click?'",
        "juniorAnswer": "Have the web application execute an INSERT SQL statement on ClickHouse for every incoming user request.",
        "staffRebuttal": "ClickHouse writes an immutable physical directory/file part on disk for each INSERT statement. Sending 100,000 single-row inserts per second will generate 100,000 parts/sec, triggering ClickHouse's 'Too many parts in all data parts in table' fatal error and crashing the server. Staff engineers buffer data in Kafka or memory, inserting in batches of 50,000+ rows."
      },
      {
        "trapTitle": "The Relational Database OLAP Trap: 'Why not run analytical queries on PostgreSQL with indexes?'",
        "juniorAnswer": "Use PostgreSQL with indexes on `timestamp` and `event_type` to run reporting queries.",
        "staffRebuttal": "PostgreSQL is a row-oriented database that stores entire rows contiguously. Querying 1 billion rows requires reading every single column off disk into memory, taking minutes to hours. Columnar engines (ClickHouse) only read the two specific columns queried, using SIMD vector instructions to scan 50 million rows per CPU core per second."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,000,000 Ingestion Events/Sec • Sub-100ms Aggregate OLAP Queries, 100 Billion Events/Day • 100 Terabytes Ingested/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_id_snowflake": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Millisecond 64-Bit Globally Unique ID Generation",
        "detail": "Generate unique 64-bit integer IDs at over 1,000,000 requests/sec with zero database coordination."
      },
      {
        "id": "FR2",
        "title": "K-Sortable Chronological Ordering",
        "detail": "Ensure generated IDs are roughly time-sortable to preserve B+Tree database write locality and avoid index fragmentation."
      },
      {
        "id": "FR3",
        "title": "NTP Backward Clock Drift Protection",
        "detail": "Detect system clock rollbacks and prevent duplicate ID emission using sleep spin-locks and logical time advancing."
      }
    ],
    "outOfScope": [
      "UUIDv4 random string generation (Snowflake strictly produces 64-bit integers)",
      "Centrally coordinated database auto-increment sequences",
      "Cryptographic proof-of-work blockchain hash nonces"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,000,000 ID Requests/Sec • Sub-Millisecond Latency Peak • 100,000 ID Generation Nodes • 10B IDs Generated/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "gRPC",
        "endpoint": "SnowflakeService/GetNextId",
        "purpose": "Generate unique 64-bit ID via low-latency binary gRPC",
        "requestSample": "{\n  \"count\": 1\n}",
        "responseSample": "{\n  \"id\": 172900120042918291,\n  \"idStr\": \"172900120042918291\",\n  \"timestampMs\": 1729001200429\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/snowflake/batch",
        "purpose": "Batch allocate 1,000 pre-generated unique IDs",
        "requestSample": "{\n  \"batchSize\": 100\n}",
        "responseSample": "{\n  \"startId\": \"172900120042918000\",\n  \"endId\": \"172900120042918099\",\n  \"count\": 100\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "SnowflakeWorkerLease",
        "attributes": "worker_id (0-1023 PK), node_ip, hostname, zookeeper_ephemeral_path, lease_expires_at",
        "description": "Exclusive cluster worker identifier assignment."
      },
      {
        "name": "ClockStatusMetric",
        "attributes": "worker_id, last_timestamp_ms, sequence_val, clock_drift_events_total, last_synced_at",
        "description": "Worker node clock health status."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Twitter Snowflake / 64-Bit Unique ID Generator)",
        "steps": [
          "1. Client (Application Microservice (Tweets/Orders)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Worker Node Registry (ZooKeeper / etcd)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (12-Bit Per-Millisecond Counter) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Generated 64-Bit ID (Int64 / String)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Twitter Snowflake / 64-Bit Unique ID Generator)",
        "steps": [
          "1. Client (Application Microservice (Tweets/Orders)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Worker Node Registry (ZooKeeper / etcd)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (12-Bit Per-Millisecond Counter) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Generated 64-Bit ID (Int64 / String)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The UUIDv4 Primary Key Trap: 'Why not just use standard UUID strings (UUIDv4)?'",
        "juniorAnswer": "Use UUID.randomUUID() in Java/Python to generate random 128-bit string IDs.",
        "staffRebuttal": "UUIDv4 strings (36 characters) are completely random and non-sequential. Inserting random keys into a B+Tree database (like MySQL InnoDB clustered index) causes massive random disk I/O, constant page splits, and bloats the index size by 3x compared to 64-bit integer Snowflake IDs."
      },
      {
        "trapTitle": "The NTP Clock Backward Drift Duplicate Trap: 'What happens when NTP synchronizes time backwards by 50ms?'",
        "juniorAnswer": "Just read `System.currentTimeMillis()` directly on every call.",
        "staffRebuttal": "If the clock jumps back 50ms, the generator will produce identical timestamps and sequence numbers that were already emitted 50ms ago, corrupting databases with duplicate primary keys. Staff engineers detect `current_time < last_time`: wait until the clock catches up, or use a logical sequence offset."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,000,000 ID Requests/Sec • Sub-Millisecond Latency, 100,000 ID Generation Nodes • 10B IDs Generated/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "cdn_cache_purge_engine": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-150ms Worldwide Cache Invalidation across 300 PoPs",
        "detail": "Propagate cache invalidations to 300 global edge data centers within 150 milliseconds."
      },
      {
        "id": "FR2",
        "title": "Instant Tag-Based Invalidation (Epoch Versioning)",
        "detail": "Invalidate millions of cached assets matching a Cache-Tag instantly using in-memory epoch version counters."
      },
      {
        "id": "FR3",
        "title": "Soft Purge (Stale-While-Revalidate) Origin Protection",
        "detail": "Serve stale content while asynchronously refreshing from origin to eliminate thundering herd spikes."
      }
    ],
    "outOfScope": [
      "Edge server physical datacenter cooling and rack electrical UPS wiring",
      "Border Gateway Protocol (BGP) Anycast IP route flapping internet peering",
      "Origin server backend database SQL query optimization"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 Purge Requests/Sec • Tag / URL / Wildcard Invalidation Peak • 300 Global PoPs • 10M Purge Requests/Day • Sub-150ms Global Propagation",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/client/v4/zones/:zoneId/purge_cache",
        "purpose": "Purge cached files globally by URL list, Cache-Tags, or wildcard prefix",
        "requestSample": "{\n  \"tags\": [\"product_8812\", \"catalog_shoes\"],\n  \"purgeEverything\": false\n}",
        "responseSample": "{\n  \"success\": true,\n  \"purgeId\": \"prg_99a1b2c3\",\n  \"propagatedPoPs\": 300,\n  \"elapsedMs\": 112\n}"
      },
      {
        "method": "GET",
        "endpoint": "/client/v4/zones/:zoneId/purge_status/:purgeId",
        "purpose": "Check global propagation percentage across edge PoPs",
        "responseSample": "{\n  \"purgeId\": \"prg_99a1b2c3\",\n  \"status\": \"COMPLETED\",\n  \"popsAcknowledged\": 300,\n  \"maxLatencyMs\": 138\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "PurgeTransaction",
        "attributes": "purge_id (PK), zone_id, purge_type (TAG|URL|PREFIX|ALL), target_items (ARRAY), initiated_by, status, created_at",
        "description": "Global purge instruction audit record."
      },
      {
        "name": "PoPLocalTagEpoch",
        "attributes": "tag_name (PK), current_generation_version, last_invalidated_at",
        "description": "In-memory edge version table for instant invalidation."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Cloudflare / Global Instant CDN Cache Purge Mesh)",
        "steps": [
          "1. Client (Customer Webhook / Purge API Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Global Purge API Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (PoP Edge Invalidation Controller) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Customer Origin Server) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Cloudflare / Global Instant CDN Cache Purge Mesh)",
        "steps": [
          "1. Client (Customer Webhook / Purge API Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Global Purge API Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (PoP Edge Invalidation Controller) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Customer Origin Server) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Physical File Deletion Disk Scan Trap: 'Can edge servers delete the cached files off disk when purged?'",
        "juniorAnswer": "Run `rm -rf /cache/path/*` or search the disk index to delete the cached files on every purge.",
        "staffRebuttal": "Searching and deleting thousands of files from disk causes heavy disk I/O, blocks edge worker threads, and takes seconds to propagate. Staff engineers use Epoch Generation Versioning: each tag or domain has a version number in RAM. When a purge arrives, increment the version in memory in <0.01ms; subsequent requests see a version mismatch and treat the file as expired."
      },
      {
        "trapTitle": "The Origin Stampede Thundering Herd Trap: 'What happens to the customer origin server after purging 1,000,000 files?'",
        "juniorAnswer": "Purge all files immediately and let incoming user requests fetch new copies from the origin.",
        "staffRebuttal": "Purging 1,000,000 files during peak traffic will send 50,000 simultaneous cache-miss requests directly to the customer's origin server, crashing their database. Staff engineers use Soft Purging (Stale-While-Revalidate): serve the existing stale cache entry to users while a single collapsed request fetches the updated asset from origin."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 Purge Requests/Sec • Tag / URL / Wildcard Invalidation, 300 Global PoPs • 10M Purge Requests/Day • Sub-150ms Global Propagation)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "database_cdc_debezium": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Log-Based Change Capture at 50,000 Ops/Sec",
        "detail": "Tail PostgreSQL WAL logs and publish row-level mutations to Kafka within 500ms of transaction commit."
      },
      {
        "id": "FR2",
        "title": "Guaranteed Per-Key Sequential Ordering",
        "detail": "Partition Kafka topics by table primary key to ensure downstream consumers process mutations chronologically."
      },
      {
        "id": "FR3",
        "title": "Transactional Outbox Pattern Integration",
        "detail": "Reliably extract application domain events from outbox tables with exactly-once delivery guarantees."
      }
    ],
    "outOfScope": [
      "Online DDL zero-downtime database table schema migration tools (gh-ost/pt-online-schema-change)",
      "Active-active bi-directional conflict resolution across multi-master PostgreSQL clusters",
      "Physical disk block-level backup snapshotting to cold tape storage"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 CDC Events/Sec • Sub-Second End-to-End Latency Peak • 100 Production DBs • 100M Daily Table Mutations",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "CDC",
        "endpoint": "pg_logical/wal_stream",
        "purpose": "Debezium ingests row change event from PostgreSQL logical replication slot",
        "requestSample": "{\n  \"before\": { \"id\": 42, \"status\": \"PENDING\", \"amount\": 100 },\n  \"after\": { \"id\": 42, \"status\": \"COMPLETED\", \"amount\": 100 },\n  \"source\": { \"version\": \"16.1\", \"table\": \"orders\", \"lsn\": 108420912 }\n}",
        "responseSample": "{\n  \"status\": \"ACK\",\n  \"committedLsn\": 108420912\n}"
      },
      {
        "method": "GET",
        "endpoint": "/connectors/postgres-orders-cdc/status",
        "purpose": "Inspect CDC connector lag and slot replication status",
        "responseSample": "{\n  \"state\": \"RUNNING\",\n  \"worker_id\": \"10.0.1.4:8083\",\n  \"replicationLagBytes\": 1048576,\n  \"latestLsn\": 108420912\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "CdcEventEnvelope",
        "attributes": "op (c|u|d|r), before_json, after_json, source_ts_ms, lsn_offset (BIGINT), table_name, schema_id",
        "description": "Standardized Debezium mutation record."
      },
      {
        "name": "ReplicationSlotHealth",
        "attributes": "slot_name (PK), active_bool, confirmed_flush_lsn, restart_lsn, wal_backlog_bytes, updated_at",
        "description": "PostgreSQL replication slot monitoring state."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Debezium / Postgres WAL Change Data Capture Pipeline)",
        "steps": [
          "1. Client (Source PostgreSQL Database) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Postgres Logical Replication Slot) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Change Event Stream (Kafka Cluster)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Avro Schema Registry) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Debezium / Postgres WAL Change Data Capture Pipeline)",
        "steps": [
          "1. Client (Source PostgreSQL Database) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Postgres Logical Replication Slot) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Change Event Stream (Kafka Cluster)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Avro Schema Registry) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Database Dual-Write Race Condition Trap: 'Can the application update SQL and write to Kafka directly?'",
        "juniorAnswer": "In the checkout method, first run `ordersRepository.save(order)` and then call `kafkaTemplate.send(topic, order)`.",
        "staffRebuttal": "Dual writing cannot guarantee atomicity across network boundaries. If the database commits but the Kafka call times out, downstream systems miss the event; if Kafka succeeds but the DB rolls back, downstream gets phantom data. Staff engineers use the Transactional Outbox Pattern with CDC: write both to the DB in one atomic transaction, letting CDC stream to Kafka."
      },
      {
        "trapTitle": "The Unbounded WAL Disk Overflow Trap: 'What happens to Postgres when Debezium goes offline for 6 hours?'",
        "juniorAnswer": "PostgreSQL will just wait for Debezium to reconnect.",
        "staffRebuttal": "A PostgreSQL logical replication slot retains all WAL files on disk until the consumer acknowledges the LSN. If Debezium crashes for hours during heavy write load, Postgres will accumulate hundreds of gigabytes of WAL logs until the disk fills to 100%, causing the database to crash and reject all writes. Staff engineers set `max_slot_wal_keep_size` and configure disk alert monitors."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 CDC Events/Sec • Sub-Second End-to-End Latency, 100 Production DBs • 100M Daily Table Mutations)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_tracing_jaeger": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-2s Waterfall Trace Visualization across 5,000 Microservices",
        "detail": "Reconstruct and render distributed request DAG waterfall timelines across thousands of hops in <2 seconds."
      },
      {
        "id": "FR2",
        "title": "Tail-Based Sampling for 100% Error & Outlier Retention",
        "detail": "Buffer in-flight spans to preserve 100% of traces containing HTTP 5xx errors or severe latency bottlenecks."
      },
      {
        "id": "FR3",
        "title": "Automated Dynamic Service Dependency Graph Generation",
        "detail": "Aggregate span linkages to build real-time service dependency topologies and latency maps."
      }
    ],
    "outOfScope": [
      "Continuous CPU instruction execution profiling flamegraph analysis (Pyroscope domain)",
      "System kernel syscall eBPF packet network traffic inspection",
      "Single-instance application thread dump heap memory dump debugging"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "250,000 Spans Ingested/Sec • Sub-2s Waterfall Trace Rendering Peak • 5,000 Microservices • 10 Billion Spans/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/v1/traces",
        "purpose": "OpenTelemetry exporter ships batch of OTLP protobuf spans",
        "requestSample": "{\n  \"resourceSpans\": [\n    {\n      \"scopeSpans\": [{\n        \"spans\": [{\n          \"traceId\": \"4bf92f3577b34da6a3ce929d0e0e4736\",\n          \"spanId\": \"00f067aa0ba902b7\",\n          \"name\": \"SELECT * FROM users\",\n          \"startTimeUnixNano\": 1729001200000000000,\n          \"endTimeUnixNano\": 1729001200025000000\n        }]\n      }]\n    }\n  ]\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\"\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/traces/:traceId",
        "purpose": "Fetch full trace DAG span hierarchy for waterfall rendering",
        "responseSample": "{\n  \"data\": [\n    {\n      \"traceID\": \"4bf92f3577b34da6a3ce929d0e0e4736\",\n      \"spans\": [{ \"spanID\": \"00f067aa0ba902b7\", \"operationName\": \"GET /orders\", \"duration\": 45000 }]\n    }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "TraceSpan",
        "attributes": "trace_id (PARTITION KEY), span_id (CLUSTER KEY), parent_span_id, service_name, operation_name, start_time_us, duration_us, tags_json, logs_json",
        "description": "Individual unit of work in distributed trace."
      },
      {
        "name": "ServiceDependencyEdge",
        "attributes": "parent_service (PK), child_service (PK), call_count, avg_latency_ms, error_rate_pct, updated_at",
        "description": "Aggregated service-to-service communication link."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Distributed Tracing System (OpenTelemetry / Jaeger))",
        "steps": [
          "1. Client (App OpenTelemetry SDK) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Node OpenTelemetry Collector Agent) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Jaeger Ingestion Fleet) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Jaeger Trace Waterfall UI) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Distributed Tracing System (OpenTelemetry / Jaeger))",
        "steps": [
          "1. Client (App OpenTelemetry SDK) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Node OpenTelemetry Collector Agent) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Jaeger Ingestion Fleet) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Jaeger Trace Waterfall UI) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The 100% Unsampled Trace Storage Bomb Trap: 'Can we store all 10 billion spans on disk every day?'",
        "juniorAnswer": "Save every single span from every service to Cassandra so no data is ever lost.",
        "staffRebuttal": "Ingesting 10 billion spans/day uncompressed requires petabytes of expensive storage per week and saturates network interfaces, costing more than the core application. Staff engineers use Adaptive Tail-Based Sampling: sample successful 200 OK fast requests at 0.1%, while retaining 100% of errors (5xx) and slow requests (>1s)."
      },
      {
        "trapTitle": "The Context Propagation Loss Trap: 'Why do traces break when crossing asynchronous message queues?'",
        "juniorAnswer": "Put the payload into Kafka and read it in the worker service.",
        "staffRebuttal": "Unlike HTTP where headers propagate cleanly, sending a payload through Kafka without explicitly injecting trace headers causes the trace to terminate at the producer, creating disconnected orphan spans. Staff engineers inject W3C `traceparent` headers into the Kafka record headers (`ProducerRecord.headers().add('traceparent', ...)`)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (250,000 Spans Ingested/Sec • Sub-2s Waterfall Trace Rendering, 5,000 Microservices • 10 Billion Spans/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "secret_management_vault": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-10ms Dynamic Ephemeral Credential Generation",
        "detail": "Generate unique short-lived database and cloud credentials with automatic TTL revocation."
      },
      {
        "id": "FR2",
        "title": "Cryptographic Zero-Knowledge Storage Barrier",
        "detail": "Ensure 100% of stored secrets are encrypted with AES-256-GCM before writing to the storage backend."
      },
      {
        "id": "FR3",
        "title": "Workload Identity Attestation (K8s, IAM, OIDC)",
        "detail": "Authenticate workloads seamlessly without requiring long-lived bootstrap master passwords."
      }
    ],
    "outOfScope": [
      "Hardware Security Module (HSM) physical tamper-evident microchip silicone manufacturing",
      "Operating system physical RAM memory cold-boot liquid nitrogen attack countermeasures",
      "Public internet PKI Root Certificate Authority baseline requirement audit"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Secret Reads/Sec • Zero Plaintext at Rest (Shamir's Secret Sharing) Peak • 100,000 Workloads • 10M Secrets • Sub-10ms Authorization",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/v1/auth/kubernetes/login",
        "purpose": "Workload exchanges Kubernetes ServiceAccount JWT for Vault Client Token",
        "requestSample": "{\n  \"jwt\": \"eyJhbGciOiJSUzI1NiIs...\",\n  \"role\": \"billing-service-role\"\n}",
        "responseSample": "{\n  \"auth\": { \"client_token\": \"s.99a1b2c3d4\", \"lease_duration\": 3600, \"policies\": [\"billing-read\"] }\n}"
      },
      {
        "method": "GET",
        "endpoint": "/v1/database/creds/readonly-billing",
        "purpose": "Generate dynamic short-lived database credential with lease",
        "responseSample": "{\n  \"data\": { \"username\": \"v-kub-bill-88a\", \"password\": \"secure_random_pw_192\" },\n  \"lease_id\": \"database/creds/readonly-billing/9912a\",\n  \"lease_duration\": 3600,\n  \"renewable\": true\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "SecretLease",
        "attributes": "lease_id (PK), client_token_hash, path, expires_at_epoch, renewable_bool, revoke_action_json",
        "description": "Active temporary secret lease tracking."
      },
      {
        "name": "EncryptedStorageEntry",
        "attributes": "path_key (PK), encrypted_ciphertext_blob (BYTEA), iv_nonce, hmac_signature, key_version",
        "description": "AES-256 encrypted storage payload."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design HashiCorp Vault / Dynamic Secret Manager)",
        "steps": [
          "1. Client (Microservice / CI/CD Runner) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Vault API Gateway & mTLS Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Cryptographic Barrier (AES-256-GCM)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Integrated Storage Engine (Raft HA Cluster)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design HashiCorp Vault / Dynamic Secret Manager)",
        "steps": [
          "1. Client (Microservice / CI/CD Runner) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Vault API Gateway & mTLS Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Cryptographic Barrier (AES-256-GCM)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Integrated Storage Engine (Raft HA Cluster)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Hardcoded Bootstrap Secret Chicken-and-Egg Trap: 'How does an app authenticate with Vault without a password?'",
        "juniorAnswer": "Put a master Vault API token into an environment variable or config file on the server.",
        "staffRebuttal": "Hardcoding a Vault token in config files recreates the exact secret-sprawl problem Vault was built to solve. Staff engineers use Workload Identity Attestation: on Kubernetes, the app passes its signed ServiceAccount token; Vault verifies the JWT signature directly with the Kubernetes API server and issues an ephemeral client token without any hardcoded credentials."
      },
      {
        "trapTitle": "The Static Shared Password Leaked Blast Radius Trap: 'Why not store a single shared database password in Vault?'",
        "juniorAnswer": "Store the shared production database username and password in Vault and let all 50 instances read it.",
        "staffRebuttal": "If a developer prints the secret or an instance is compromised, you must rotate the password across all 50 instances simultaneously, causing downtime. Staff engineers use Dynamic Secret Engines: each instance requests its own unique SQL user with a 1-hour lease; compromised credentials can be revoked individually without impacting other pods."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Secret Reads/Sec • Zero Plaintext at Rest (Shamir's Secret Sharing), 100,000 Workloads • 10M Secrets • Sub-10ms Authorization)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_database_vitess": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5ms Sharded SQL Routing across 500 Shards",
        "detail": "Route single-shard queries directly to destination MySQL instances using VSchema key hashing in <5ms."
      },
      {
        "id": "FR2",
        "title": "Zero-Downtime Dynamic Online Shard Splitting (VReplication)",
        "detail": "Split saturated database shards into smaller partitions while continuously serving live reads and writes."
      },
      {
        "id": "FR3",
        "title": "Connection Pooling & Runaway Query Throttling (VTTablet)",
        "detail": "Protect underlying MySQL instances from connection exhaustion and automatically cancel queries exceeding RAM/time limits."
      }
    ],
    "outOfScope": [
      "Distributed Spanner-style TrueTime atomic clock hardware synchronization",
      "Columnar OLAP vector execution for complex multi-hour data warehouse queries",
      "Bare-metal Linux NVMe storage volume kernel partitioning"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "250,000 Distributed SQL QPS • Transparent Sharding & Resharding Peak • 100 Terabytes SQL Data • 500 MySQL Shards • 250,000 QPS",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "SQL",
        "endpoint": "MySQL Wire Protocol (Port 3306)",
        "purpose": "Execute transparent sharded SQL query with automated routing",
        "requestSample": "SELECT * FROM orders WHERE user_id = 10042 ORDER BY created_at DESC LIMIT 10;",
        "responseSample": "10 rows in set (0.003 sec)"
      },
      {
        "method": "CLI",
        "endpoint": "vtctlclient Reshard",
        "purpose": "Trigger online zero-downtime shard splitting workflow",
        "requestSample": "vtctlclient Reshard -keyspace customer -source_shards \"-80\" -target_shards \"-40,40-80\"",
        "responseSample": "{\n  \"status\": \"VREPLICATION_STREAMING\",\n  \"sourceShard\": \"-80\",\n  \"targetShards\": [\"-40\", \"40-80\"]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "VSchemaKeyspace",
        "attributes": "keyspace_name (PK), is_sharded_bool, sharding_key_column, hash_algorithm (hash|xxhash), shard_ranges (ARRAY), updated_at",
        "description": "Sharding topology mapping configuration."
      },
      {
        "name": "VReplicationStream",
        "attributes": "stream_id (PK), source_keyspace, source_shard, target_keyspace, target_shard, binlog_position, status",
        "description": "Active online resharding replication stream."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Vitess / Horizontal MySQL Sharding Proxy)",
        "steps": [
          "1. Client (Application MySQL Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Stateless Query Router (VTGate)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Shard Manager & Pooler (VTTablet)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Scatter-Gather Aggregation Engine) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Vitess / Horizontal MySQL Sharding Proxy)",
        "steps": [
          "1. Client (Application MySQL Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Stateless Query Router (VTGate)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Shard Manager & Pooler (VTTablet)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Scatter-Gather Aggregation Engine) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Cross-Shard Scatter-Gather Explosion Trap: 'What happens when a query does not include the sharding key?'",
        "juniorAnswer": "Let the sharding proxy query all 500 shards and combine the results.",
        "staffRebuttal": "Running `SELECT * FROM orders WHERE status = 'SHIPPED'` without a `user_id` sharding key forces VTGate to scatter the query to all 500 database shards simultaneously. This amplifies 1 request into 500 database queries, saturating connection pools and CPU across the entire cluster. Staff engineers require sharding keys on hot queries or maintain secondary lookup lookup tables."
      },
      {
        "trapTitle": "The 10,000 Connection MySQL Collapse Trap: 'Why can't we let Kubernetes pods connect directly to MySQL?'",
        "juniorAnswer": "Configure each application pod in Kubernetes to open a JDBC connection pool to the target MySQL shard.",
        "staffRebuttal": "Scaling to 2,000 app pods with a pool size of 10 creates 20,000 persistent connections per shard. MySQL allocates ~2MB of RAM per connection thread and spends massive CPU cycles on context switching, causing latency to spike and crashing MySQL. Vitess uses VTTablet as a sidecar: thousands of app connections are multiplexed onto a small, optimal pool of ~50 physical MySQL connections."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (250,000 Distributed SQL QPS • Transparent Sharding & Resharding, 100 Terabytes SQL Data • 500 MySQL Shards • 250,000 QPS)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "iot_telemetry_influxdb": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Ingestion of 500,000 Sensor Telemetry/Sec",
        "detail": "Ingest binary vehicle sensor metrics from 10M cars with sub-second processing latency using MQTT and Kafka."
      },
      {
        "id": "FR2",
        "title": "Automated Multi-Tier Downsampling & Retention Policies",
        "detail": "Automatically compress and roll up raw 1Hz metrics to 1m and 1h intervals to bound disk storage growth."
      },
      {
        "id": "FR3",
        "title": "Sub-5s Real-Time Safety Anomaly Detection",
        "detail": "Detect critical battery cell thermal runaway deviations and emit emergency vehicle telemetry alerts within 5 seconds."
      }
    ],
    "outOfScope": [
      "Over-the-air (OTA) full firmware operating system kernel flashing",
      "In-vehicle dashboard infotainment Spotify audio streaming app",
      "Autonomous self-driving Full Self-Driving (FSD) neural network inference"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Telemetry Ingests/Sec • Time-Series Retention Rollups Peak • 10M Connected Vehicles • 500,000 Telemetry Samples/Sec",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "MQTT",
        "endpoint": "v1/telemetry/:vin",
        "purpose": "Vehicle telematics unit uploads binary Protobuf sensor sample frame",
        "requestSample": "{\n  \"vin\": \"5YJSA1E28HF102918\",\n  \"timestamp\": 1729001200,\n  \"metrics\": { \"batteryTempC\": 34.2, \"motorRpm\": 4200, \"speedKmh\": 105.4, \"socPct\": 78 }\n}",
        "responseSample": "{\n  \"status\": \"ACK\"\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/telemetry/query",
        "purpose": "Query fleet battery degradation curves across time window",
        "requestSample": "{\n  \"sql\": \"SELECT time_bucket('1h', time) as hour, avg(batteryTempC) FROM vehicle_telemetry WHERE vin = '5YJSA1E28HF102918' AND time > now() - INTERVAL '30d' GROUP BY hour\"\n}",
        "responseSample": "{\n  \"results\": [{ \"hour\": \"2026-10-29T17:00:00Z\", \"avg\": 32.8 }]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "VehicleTelemetryPoint",
        "attributes": "vin (TAG PK), timestamp (TIME PK), metric_name (TAG), float_value, string_value, created_at",
        "description": "Time-series measurement sample."
      },
      {
        "name": "FleetAlertRule",
        "attributes": "rule_id (PK), metric, threshold_value, condition (GREATER_THAN|LESS_THAN), window_seconds, severity, is_active",
        "description": "Real-time safety alerting threshold."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Connected Car Fleet Telemetry (Tesla IoT))",
        "steps": [
          "1. Client (Vehicle Telemetry Control Unit (TCU)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (MQTT Edge Broker Cluster (EMQX)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Time-Series Ingestion Workers) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Fleet Anomaly & Safety Alert Engine) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Connected Car Fleet Telemetry (Tesla IoT))",
        "steps": [
          "1. Client (Vehicle Telemetry Control Unit (TCU)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (MQTT Edge Broker Cluster (EMQX)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Time-Series Ingestion Workers) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Fleet Anomaly & Safety Alert Engine) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The JSON Over Cellular Bandwidth Cost Trap: 'Why not send standard JSON over HTTP from vehicles?'",
        "juniorAnswer": "Have the car make an HTTP POST request sending JSON sensor data every second.",
        "staffRebuttal": "500,000 JSON payloads per second over cellular LTE generates massive data transfer. HTTP headers + JSON keys (`\"battery_temperature_celsius\": 34.2`) consume ~500 bytes per ping. For 10M cars, this equals gigabytes of mobile carrier cellular roaming costs per month. Staff engineers use binary Protocol Buffers over MQTT, compressing the payload to ~35 bytes."
      },
      {
        "trapTitle": "The Infinite High-Precision Storage Trap: 'Can we store 1-second raw telemetry forever?'",
        "juniorAnswer": "Store all 1-second pings permanently in the database so engineers can investigate old issues.",
        "staffRebuttal": "10 million cars emitting 1Hz data generates ~30 terabytes of compressed data per day (over 10 petabytes per year), making storage and query scans astronomically expensive. Staff engineers configure automatic Downsampling Retention Policies: keep raw 1Hz data for 7 days, downsample to 1-minute resolution for 90 days, and 1-hour resolution for 5 years."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Telemetry Ingests/Sec • Time-Series Retention Rollups, 10M Connected Vehicles • 500,000 Telemetry Samples/Sec)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "zero_trust_mesh_spiffe": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Minute Automated Workload Attestation & SVID Issuance",
        "detail": "Attest ephemeral containers and issue short-lived X.509 SVIDs within seconds of pod creation."
      },
      {
        "id": "FR2",
        "title": "Zero-Disk Private Key Delivery via UNIX Domain Socket",
        "detail": "Deliver cryptographic keys directly into container RAM over local UNIX sockets without persisting to disk."
      },
      {
        "id": "FR3",
        "title": "Automatic 30-Minute Certificate Rotation",
        "detail": "Continuously rotate X.509 certificates every 30 minutes with zero downtime or connection drops."
      }
    ],
    "outOfScope": [
      "Hardware microchip physical side-channel power analysis resistance",
      "Public commercial web browser SSL root certificate authority inclusion",
      "Operating system Linux kernel eBPF packet network firewall packet filtering"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Workload Attestations/Sec • Cryptographic X.509 SVIDs Peak • 50,000 Microservices • 100k mTLS Sockets • Sub-Hour Cert Rotation",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "UNIX",
        "endpoint": "/tmp/spire-agent/public/api.sock",
        "purpose": "Workload calls local SPIFFE Workload API over UNIX domain socket to fetch SVID",
        "requestSample": "FetchX509SVIDRequest {}",
        "responseSample": "{\n  \"svids\": [{\n    \"spiffe_id\": \"spiffe://prod.internal/ns/orders/sa/orders-backend\",\n    \"x509_svid\": \"-----BEGIN CERTIFICATE-----\\nMIIB...\\n-----END CERTIFICATE-----\",\n    \"expires_at\": 1729004800\n  }]\n}"
      },
      {
        "method": "gRPC",
        "endpoint": "SpireServer/AttestNode",
        "purpose": "Node agent authenticates host hardware with SPIRE Server",
        "requestSample": "{\n  \"nodeAttestationType\": \"aws_iid\",\n  \"document\": \"pkcs7_signed_instance_identity_doc\"\n}",
        "responseSample": "{\n  \"agentSvid\": \"spiffe://prod.internal/spire/agent/node_01\",\n  \"status\": \"APPROVED\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "RegistrationEntry",
        "attributes": "entry_id (PK), spiffe_id, parent_id, selectors (ARRAY e.g. k8s:sa:orders), ttl_seconds, admin_bool, created_at",
        "description": "Workload identity authorization policy."
      },
      {
        "name": "NodeAttestationRecord",
        "attributes": "node_id (PK), physical_host_ip, attestation_plugin, instance_id, agent_svid_serial, last_heartbeat",
        "description": "Active verified host node agent."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Zero-Trust Service Identity Mesh (SPIFFE/SPIRE))",
        "steps": [
          "1. Client (Microservice Pod Container) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Node SPIRE Agent Daemon) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (SPIRE Server & Intermediate CA) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Trust Bundle & Certificate Revocation Store) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Zero-Trust Service Identity Mesh (SPIFFE/SPIRE))",
        "steps": [
          "1. Client (Microservice Pod Container) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Node SPIRE Agent Daemon) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (SPIRE Server & Intermediate CA) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Trust Bundle & Certificate Revocation Store) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Long-Lived Static Certificate Revocation Trap: 'Why not issue 1-year certificates to all microservices?'",
        "juniorAnswer": "Issue 1-year TLS certificates to all microservices so they don't have to rotate often.",
        "staffRebuttal": "If a container is compromised or a developer leaks a private key, revoking a 1-year certificate requires publishing and checking massive Certificate Revocation Lists (CRLs) or querying OCSP responders on every request, adding latency and complexity. Zero-trust architectures issue short-lived certificates (1-hour TTL) rotated every 30 minutes: if compromised, the certificate expires automatically in minutes."
      },
      {
        "trapTitle": "The Private Key on Disk Storage Trap: 'Can we save certificates as files on the container file system?'",
        "juniorAnswer": "Write the private key to `/etc/ssl/certs/key.pem` on the container disk volume.",
        "staffRebuttal": "Writing private keys to disk leaves them vulnerable to container snapshot leaks, volume backups, and unauthorized reads by other processes. Staff engineers use SPIFFE Workload API: keys are served in memory over a local UNIX domain socket directly into the process memory, leaving zero trace on physical disk."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Workload Attestations/Sec • Cryptographic X.509 SVIDs, 50,000 Microservices • 100k mTLS Sockets • Sub-Hour Cert Rotation)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "cloud_load_balancer_maglev": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Line-Rate 10M Packets/Sec via DPDK Kernel Bypass",
        "detail": "Process 10 million packets/second per commodity x86 server using DPDK userspace network polling."
      },
      {
        "id": "FR2",
        "title": "Direct Server Return (DSR) Asymmetric Routing",
        "detail": "Eliminate outbound network bottlenecks by enabling backend application servers to reply directly to clients."
      },
      {
        "id": "FR3",
        "title": "Maglev Consistent Hashing Connection Stability",
        "detail": "Ensure existing TCP connections do not break when Maglev nodes or backend instances are added or removed."
      }
    ],
    "outOfScope": [
      "Layer 7 HTTP header inspection, URL rewrites, and cookie injection (Envoy reverse proxy scope)",
      "TLS termination and cryptographic SSL certificate handshake decryption",
      "Hardware ASIC network switch physical silicon transceiver programming"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "10,000,000 Packets/Sec • Sub-Microsecond Kernel Bypass Routing Peak • 100 Gbps Wire Speed • 10M Packets/Sec • Line-Rate ECMP",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "RAW",
        "endpoint": "NIC RX Ring Buffer (DPDK PMD)",
        "purpose": "Userspace poll-mode driver reads raw Ethernet packet frames",
        "responseSample": "ETH(src=xx, dst=yy) IP(src=198.51.100.2, dst=192.0.2.1) TCP(sport=51291, dport=443, flags=SYN)"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/maglev/vip-backends",
        "purpose": "Update backend server pool for Virtual IP address",
        "requestSample": "{\n  \"vip\": \"192.0.2.1\",\n  \"backends\": [\"10.0.1.10\", \"10.0.1.11\", \"10.0.1.12\"],\n  \"healthCheckPort\": 8080\n}",
        "responseSample": "{\n  \"status\": \"TABLE_REGENERATED\",\n  \"lookupTableSize\": 65537\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MaglevLookupTable",
        "attributes": "table_size (PRIME e.g. 65537), lookup_array (ARRAY INT), backend_pool_version, computed_at",
        "description": "Precomputed consistent hashing lookup table."
      },
      {
        "name": "ConnectionTrackingEntry",
        "attributes": "flow_hash (5-tuple uint64 PK), target_backend_ip, last_packet_epoch, tcp_state",
        "description": "Lock-free connection flow mapping."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Google Maglev / L4 Network Load Balancer)",
        "steps": [
          "1. Client (Public Internet Client Traffic) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Edge BGP Router Mesh (ECMP)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Maglev Consistent Hashing Table) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Backend Application Server (Direct Server Return - DSR)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Google Maglev / L4 Network Load Balancer)",
        "steps": [
          "1. Client (Public Internet Client Traffic) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Edge BGP Router Mesh (ECMP)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Maglev Consistent Hashing Table) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Backend Application Server (Direct Server Return - DSR)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Standard Linux Kernel Socket Bottleneck Trap: 'Why can't standard Linux iptables/IPVS handle 100 Gbps?'",
        "juniorAnswer": "Use standard Linux kernel networking with iptables or IPVS to load balance packets.",
        "staffRebuttal": "Standard Linux networking generates a hardware CPU interrupt for every incoming packet and copies packet buffers across the kernel/userspace boundary, capping performance at ~1M packets/sec and consuming 100% CPU. Google Maglev uses DPDK kernel bypass: dedicated CPU cores poll the network card ring buffer directly in userspace, achieving 10M+ packets/sec."
      },
      {
        "trapTitle": "The Symmetrical Return Traffic Bottleneck Trap: 'Why shouldn't response traffic return through the load balancer?'",
        "juniorAnswer": "Route the response from the application server back through the load balancer to send to the client.",
        "staffRebuttal": "Outgoing response traffic (HTML, images, video) is 10x to 100x larger than incoming request traffic. Forcing responses back through the load balancer saturates its network interfaces with outbound bytes. Staff engineers use Direct Server Return (DSR): the load balancer only touches the incoming request; backends send responses directly to the client's public IP."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (10,000,000 Packets/Sec • Sub-Microsecond Kernel Bypass Routing, 100 Gbps Wire Speed • 10M Packets/Sec • Line-Rate ECMP)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_kv_etcd_raft": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Linearizable ACID Read/Write Consensus via Raft",
        "detail": "Guarantee strict serializability and linearizable consistency across cluster nodes using Raft consensus."
      },
      {
        "id": "FR2",
        "title": "Multi-Version Concurrency Control (MVCC) Snapshot Reads",
        "detail": "Serve lock-free historical snapshot reads and streaming change watches starting from any revision."
      },
      {
        "id": "FR3",
        "title": "Sub-5ms Commit Latency with WAL Disk Synchronization",
        "detail": "Commit transactions to persistent disk WAL logs with fsync in under 5ms on modern NVMe drives."
      }
    ],
    "outOfScope": [
      "Terabyte-scale blob media storage (etcd strictly limits database size to 8GB)",
      "Multi-region cross-continent high-latency Raft clusters (etcd requires <10ms ping between nodes)",
      "Complex SQL analytical join and aggregation query processing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Distributed Consensus Ops/Sec • Sub-5ms Commit Latency Peak • Linearizable ACID Reads/Writes • 50,000 Ops/Sec • Multi-Version Concurrency (MVCC)",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "gRPC",
        "endpoint": "etcdserverpb.KV/Put",
        "purpose": "Atomic put key-value with optional lease and revision check",
        "requestSample": "{\n  \"key\": \"L3NlcnZpY2VzL29yZGVycw==\",\n  \"value\": \"MTAuMC40LjE1OjgwODA=\",\n  \"lease\": 75878230491\n}",
        "responseSample": "{\n  \"header\": { \"cluster_id\": 1484120, \"member_id\": 10294, \"revision\": 44102 }\n}"
      },
      {
        "method": "gRPC",
        "endpoint": "etcdserverpb.Watch/Watch",
        "purpose": "Stream real-time key modifications starting from specific revision",
        "requestSample": "{\n  \"create_request\": { \"key\": \"L3NlcnZpY2VzLw==\", \"range_end\": \"L3NlcnZpY2VzMA==\", \"start_revision\": 44100 }\n}",
        "responseSample": "{\n  \"events\": [{ \"type\": \"PUT\", \"kv\": { \"key\": \"L3NlcnZpY2VzL29yZGVycw==\", \"version\": 3 } }]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MvccRevisionRecord",
        "attributes": "main_revision (BIGINT PK), sub_revision, key_bytes, value_bytes, lease_id, is_tombstone",
        "description": "Immutable versioned key-value record in bbolt."
      },
      {
        "name": "RaftLogEntry",
        "attributes": "index (PK), term, entry_type, command_data_blob",
        "description": "Persistent Raft consensus log entry."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design etcd / Strongly Consistent Raft KV Store)",
        "steps": [
          "1. Client (Kubernetes API Server / Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Raft Consensus Module (Leader Election)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (In-Memory B-Tree Index (Bbolt / MVCC)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (MVCC Revision Compactor & Defrag Daemon) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design etcd / Strongly Consistent Raft KV Store)",
        "steps": [
          "1. Client (Kubernetes API Server / Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Raft Consensus Module (Leader Election)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (In-Memory B-Tree Index (Bbolt / MVCC)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (MVCC Revision Compactor & Defrag Daemon) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The 8GB Database Size Limit Trap: 'Why can't we store 500GB of application data in etcd?'",
        "juniorAnswer": "Use etcd as the general primary database for user profiles and application files.",
        "staffRebuttal": "etcd is designed for small, critical metadata (Kubernetes cluster state, configuration, leader locks) and has a hard recommended database limit of 8GB. Storing large datasets bloats the bbolt B+Tree, causes expensive compaction pauses, and slows down Raft heartbeats, triggering catastrophic leader election loops. etcd is a coordination store, not a document database."
      },
      {
        "trapTitle": "The Stale Leader Split-Brain Read Trap: 'Can the leader serve read queries without consensus?'",
        "juniorAnswer": "Have the leader node read directly from its local in-memory B-Tree without talking to followers.",
        "staffRebuttal": "If a network partition isolates the leader into a minority sub-cluster, the majority partition will elect a new leader. If the deposed leader continues serving reads from local RAM, it will return stale or phantom data. Staff engineers use Raft `ReadIndex`: the leader verifies with a majority quorum that it is still the true leader before returning read responses."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Distributed Consensus Ops/Sec • Sub-5ms Commit Latency, Linearizable ACID Reads/Writes • 50,000 Ops/Sec • Multi-Version Concurrency (MVCC))."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "iot_smart_metering": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Scalable Ingestion of 55,000 Meter Readings/Sec",
        "detail": "Ingest and process 15-minute telemetry intervals from 50 million utility smart meters without data loss."
      },
      {
        "id": "FR2",
        "title": "Automated Validation, Editing & Estimation (VEE)",
        "detail": "Detect anomalous spikes and impute missing intervals using industry-standard statistical estimation models."
      },
      {
        "id": "FR3",
        "title": "Sub-Minute Neighborhood Power Outage Triangulation",
        "detail": "Triangulate electrical grid equipment failures from meter Last-Gasp radio packets within 60 seconds."
      }
    ],
    "outOfScope": [
      "Physical electric power substation high-voltage transformer hardware maintenance",
      "Customer credit card paper billing statement printing and envelope postal mailing",
      "Nuclear power plant reactor rod control software automation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "55,000 Meter Readings/Sec • Peak Kilowatt-Hour Time-of-Use Billing Peak • 50M Electric Meters • 15-Minute Telemetry Intervals",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/metering/intervals",
        "purpose": "Substation gateway uploads batch of smart meter interval readings",
        "requestSample": "{\n  \"gatewayId\": \"gw_substation_44\",\n  \"readings\": [\n    { \"meterId\": \"MTR_991209\", \"timestamp\": 1729000800, \"activeKwh\": 1.42, \"peakVoltage\": 121.4, \"statusFlags\": \"NORMAL\" }\n  ]\n}",
        "responseSample": "{\n  \"status\": \"ACCEPTED\",\n  \"batchCount\": 1\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/customers/:accountId/usage",
        "purpose": "Customer retrieves hourly electricity usage breakdown and estimated bill",
        "responseSample": "{\n  \"totalKwh\": 482.4,\n  \"estimatedBillCents\": 9648,\n  \"onPeakKwh\": 120.2,\n  \"offPeakKwh\": 362.2\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MeterIntervalReading",
        "attributes": "meter_id (PK), interval_time (TIME PK), active_kwh, reactive_kvarh, avg_voltage, is_estimated_bool, signature_hash",
        "description": "Official 15-minute utility billing record."
      },
      {
        "name": "UtilityRateTariff",
        "attributes": "tariff_id (PK), utility_id, off_peak_rate_cents, mid_peak_rate_cents, on_peak_rate_cents, peak_start_time, peak_end_time",
        "description": "Time-of-use pricing schedule."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Smart Grid / Power Meter Telemetry Ingest)",
        "steps": [
          "1. Client (Cellular / Mesh Smart Electric Meter) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Substation Mesh Collector Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (VEE Engine (Validation, Editing, Estimation)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Grid Blackout & Tamper Detector) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Smart Grid / Power Meter Telemetry Ingest)",
        "steps": [
          "1. Client (Cellular / Mesh Smart Electric Meter) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Substation Mesh Collector Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (VEE Engine (Validation, Editing, Estimation)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Grid Blackout & Tamper Detector) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Top-of-Hour Simultaneous Transmission Stampede Trap: 'What if all 50M meters transmit at 12:00:00 PM?'",
        "juniorAnswer": "Program all smart meters to send their reading at the exact end of each 15-minute interval.",
        "staffRebuttal": "50 million smart meters transmitting simultaneously at :00, :15, :30, and :45 past the hour will generate an enormous 50,000,000-request spike in 2 seconds, saturating cellular towers and crashing cloud API gateways. Staff engineers apply Random Jitter: each meter adds a pseudorandom delay (0 to 300 seconds) to spread transmissions smoothly across the 15-minute window."
      },
      {
        "trapTitle": "The Missing Interval Rejection Trap: 'Can we reject incomplete bills if a meter misses 2 intervals?'",
        "juniorAnswer": "If a meter misses any 15-minute reading, fail the billing cycle and send an error report.",
        "staffRebuttal": "With 50 million meters, cellular dead zones and RF interference guarantee that millions of intervals will be delayed or dropped every month. Failing billing causes utility revenue collapse. Staff engineers implement regulatory VEE (Validation, Editing, Estimation): missing intervals are mathematically interpolated from neighboring intervals and weather patterns, marked as `is_estimated = true` for regulatory compliance."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (55,000 Meter Readings/Sec • Peak Kilowatt-Hour Time-of-Use Billing, 50M Electric Meters • 15-Minute Telemetry Intervals)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "dns_ddos_scrubber": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5ms Wire-Speed Packet Scrubbing via XDP/eBPF",
        "detail": "Drop up to 50,000,000 malicious attack packets per second at the NIC driver layer with sub-5 microsecond latency."
      },
      {
        "id": "FR2",
        "title": "BGP Anycast Volumetric Dilution across 300 PoPs",
        "detail": "Dilute massive multi-terabit volumetric attacks globally using BGP Equal-Cost Multi-Path Anycast routing."
      },
      {
        "id": "FR3",
        "title": "Stateless SYN Cookie Defense against Layer-4 Floods",
        "detail": "Mitigate massive TCP SYN flood attacks with zero state allocation in kernel memory using cryptographic sequence cookies."
      }
    ],
    "outOfScope": [
      "Physical fiber optic undersea cable excavation and physical repair",
      "Layer 7 application SQL injection payload semantic static code analysis",
      "Customer web application database slow query tuning"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000,000 Packets/Sec • Sub-5ms Wire Speed Scrubbing Peak • 300 Global PoPs • 100 Terabits/Sec Peak Attack Absorption",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "RAW",
        "endpoint": "XDP_HOOK_RX_DRIVER",
        "purpose": "Kernel eBPF driver inspects packet and returns XDP_DROP or XDP_PASS",
        "responseSample": "XDP_DROP (Reason: Malformed DNS Any Amplification Reflection from 198.51.100.42)"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/ddos/mitigation-rules",
        "purpose": "Push automated BGP Flowspec drop rule to edge scrubbers",
        "requestSample": "{\n  \"rule\": \"DROP\",\n  \"protocol\": \"UDP\",\n  \"destinationPort\": 53,\n  \"packetLength\": \"1024-1500\",\n  \"durationSeconds\": 3600\n}",
        "responseSample": "{\n  \"status\": \"APPLIED_GLOBALLY\",\n  \"activePoPs\": 300\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "DdosAttackEvent",
        "attributes": "attack_id (PK), target_ip, attack_type (SYN_FLOOD|DNS_AMP|UDP_FLOOD|HTTP_FLOOD), peak_gbps, peak_mpps, mitigated_by, started_at, ended_at",
        "description": "DDoS incident telemetry record."
      },
      {
        "name": "FlowspecMitigationRule",
        "attributes": "rule_id (PK), match_criteria_json, action (DROP|RATE_LIMIT), priority, expires_at",
        "description": "Active edge scrubbing filter rule."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Cloudflare / Anycast BGP DDoS Scrubber)",
        "steps": [
          "1. Client (Global BGP Anycast Border Routers) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (XDP / eBPF Kernel Driver Filter) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (DNS Query & Amplification Scrubber) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (GRE / WireGuard Clean Pipe Tunnel) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Cloudflare / Anycast BGP DDoS Scrubber)",
        "steps": [
          "1. Client (Global BGP Anycast Border Routers) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (XDP / eBPF Kernel Driver Filter) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (DNS Query & Amplification Scrubber) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (GRE / WireGuard Clean Pipe Tunnel) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Linux Kernel Socket Memory Exhaustion Trap: 'Can we use standard Linux firewalls (iptables/ufw) to block a 20M PPS attack?'",
        "juniorAnswer": "Add iptables drop rules like `iptables -A INPUT -s bad_ip -j DROP` to block the attack.",
        "staffRebuttal": "By the time iptables evaluates a packet, the Linux kernel has already allocated an `sk_buff` memory struct, triggered a CPU hardware interrupt, and traversed several network layers. A 20M packets/sec flood will consume 100% CPU on kernel softirqs and exhaust memory before iptables can drop a single packet. Staff engineers use XDP (eXpress Data Path) with eBPF to drop packets directly at the network card driver in zero CPU cycles."
      },
      {
        "trapTitle": "The Single Datacenter Scrubbing Appliance Trap: 'Why not buy a hardware DDoS scrubbing appliance for our datacenter?'",
        "juniorAnswer": "Buy an expensive hardware DDoS appliance (e.g. Radware/Arbor) and install it in front of the main data center.",
        "staffRebuttal": "If an attack is 800 Gbps, but the data center's internet transit pipe is only 100 Gbps, the attack will saturate the upstream ISP transit link before traffic even reaches the hardware appliance, taking the entire data center offline. Staff engineers use BGP Anycast across hundreds of PoPs so attacks are absorbed and scrubbed close to the source across the global internet edge."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000,000 Packets/Sec • Sub-5ms Wire Speed Scrubbing, 300 Global PoPs • 100 Terabits/Sec Peak Attack Absorption)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "cloud_vpn_mesh": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Direct Peer-to-Peer WireGuard Mesh Connectivity",
        "detail": "Establish low-latency point-to-point encrypted tunnels directly between devices without routing traffic through central VPN gateways."
      },
      {
        "id": "FR2",
        "title": "Automated UDP Hole Punching & STUN NAT Traversal",
        "detail": "Achieve over 90% direct peer connection success across domestic and mobile NAT firewalls."
      },
      {
        "id": "FR3",
        "title": "Zero-Knowledge Encrypted Fallback Relays (DERP)",
        "detail": "Guarantee 100% connection reliability via encrypted HTTPS relay servers when firewalls completely block UDP."
      }
    ],
    "outOfScope": [
      "Hardware ASIC cryptographic accelerator PCI express firmware development",
      "Public commercial cellular SIM card APN carrier provisioning",
      "Physical Wi-Fi radio frequency channel spectrum scanning"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Coordination Handshakes/Sec • Sub-50ms Direct P2P Latency Peak • 1M Devices • Direct Peer-to-Peer WireGuard Tunnels • NAT Traversal",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/control/endpoints/sync",
        "purpose": "Device registers its observed STUN public IP/ports and fetches peer map",
        "requestSample": "{\n  \"nodeKey\": \"nodekey:99a1b2c3...\",\n  \"endpoints\": [\"198.51.100.12:41641\", \"10.0.1.4:41641\"],\n  \"discoKey\": \"discokey:8812...\"\n}",
        "responseSample": "{\n  \"peers\": [\n    { \"nodeKey\": \"nodekey:4412...\", \"allowedIps\": [\"100.64.0.4/32\"], \"endpoints\": [\"203.0.113.8:51820\"] }\n  ]\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/control/derp-map",
        "purpose": "Fetch global geographical DERP relay fallback server list",
        "responseSample": "{\n  \"regions\": [\n    { \"regionId\": 1, \"regionCode\": \"nyc\", \"nodes\": [{ \"name\": \"derp-nyc-01\", \"hostName\": \"derp1.tailscale.com\" }] }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MeshNodeRegistration",
        "attributes": "node_key (PK), user_id, assigned_ip (100.x.y.z), machine_name, endpoints_json, last_seen_at, acl_tags (ARRAY)",
        "description": "Active virtual mesh device node."
      },
      {
        "name": "AclRulePolicy",
        "attributes": "rule_id (PK), source_tag, destination_tag, allowed_ports (ARRAY), is_enabled",
        "description": "Zero-trust network access control rule."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Tailscale / WireGuard Virtual Mesh Network)",
        "steps": [
          "1. Client (Client Device (Laptop / Phone / Server)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Control Plane / Coordination Server (Derp)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (DERP Relay Relay Fleet (Encrypted Fallback)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Zero-Trust Mesh Policy Store (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Tailscale / WireGuard Virtual Mesh Network)",
        "steps": [
          "1. Client (Client Device (Laptop / Phone / Server)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Control Plane / Coordination Server (Derp)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (DERP Relay Relay Fleet (Encrypted Fallback)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Zero-Trust Mesh Policy Store (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Central Concentrator Hub-and-Spoke Bottleneck Trap: 'Why not route all office traffic through a central VPN server?'",
        "juniorAnswer": "Deploy a large OpenVPN server in AWS and have all employees route their traffic through it.",
        "staffRebuttal": "Hub-and-spoke VPNs force two coworkers sitting in the same office to route packets thousands of miles to AWS and back, causing high latency, video call lag, and saturating the central gateway bandwidth. Staff engineers use a Virtual Mesh: devices establish direct WireGuard tunnels directly across the local LAN or shortest internet path."
      },
      {
        "trapTitle": "The Coordination Server Eavesdropping Privacy Trap: 'Can the coordination server decrypt user traffic?'",
        "juniorAnswer": "The coordination server coordinates connections, so it can inspect packets if needed for security.",
        "staffRebuttal": "The coordination server only handles public keys and IP mappings (control plane). WireGuard tunnels are encrypted end-to-end between the peer devices using ChaCha20-Poly1305; private keys never leave the host devices. Even when traffic flows through DERP relays, the packets are already encrypted, so servers cannot read a single byte."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Coordination Handshakes/Sec • Sub-50ms Direct P2P Latency, 1M Devices • Direct Peer-to-Peer WireGuard Tunnels • NAT Traversal)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "memcached_slab_allocator": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-500µs In-Memory Read/Write Latency at 1,000,000 QPS",
        "detail": "Deliver sub-millisecond response times across multi-core servers using multithreaded non-blocking network I/O."
      },
      {
        "id": "FR2",
        "title": "Zero Memory Fragmentation via Slab Allocation",
        "detail": "Pre-allocate memory pages and assign items to fixed-size chunk classes to completely eliminate OS memory fragmentation."
      },
      {
        "id": "FR3",
        "title": "Atomic CAS (Check-And-Set) Concurrency Guard",
        "detail": "Prevent concurrent update race conditions using 64-bit monotonic CAS tokens."
      }
    ],
    "outOfScope": [
      "Disk persistence, AOF write-ahead logging, and RDB snapshotting (Redis domain)",
      "Complex data structures like sorted sets, lists, hashes, and geospatial indexes",
      "Server-side master-replica automated cluster consensus failover"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "1,000,000 Read/Write Ops/Sec • Zero Memory Fragmentation Peak • 100M Cached Objects • 64GB RAM per Node • Sub-500µs Latency",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "BIN",
        "endpoint": "Memcached Binary Protocol (Port 11211)",
        "purpose": "Binary GET request with sub-500 microsecond response",
        "requestSample": "0x80 0x00 0x00 0x07 (Op: Get, Key: user_42)",
        "responseSample": "0x81 0x00 0x00 0x00 (Status: Success, Flags: 0, CAS: 10429, Value: { ... })"
      },
      {
        "method": "BIN",
        "endpoint": "Memcached Binary Set with CAS",
        "purpose": "Set key with atomic Check-And-Set (CAS) token verification",
        "requestSample": "0x80 0x01 ... (Op: Set, Key: stock_ps5, CAS: 10429, Value: \"99\")",
        "responseSample": "0x81 0x00 0x00 0x00 (Status: Success)"
      }
    ],
    "coreEntities": [
      {
        "name": "SlabClass",
        "attributes": "class_id (1-64 PK), chunk_size_bytes, chunks_per_page, total_pages_allocated, total_chunks, used_chunks, free_chunks",
        "description": "Memory slab class partition definition."
      },
      {
        "name": "CacheItemHeader",
        "attributes": "key_hash (PK), key_string, value_size_bytes, slab_class_id, expiration_epoch, cas_token (uint64), lru_prev_ptr, lru_next_ptr",
        "description": "In-memory item metadata header in RAM."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Memcached / Multithreaded In-Memory Key-Value)",
        "steps": [
          "1. Client (App Client (Consistent Hashing)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Multithreaded Libevent Network Fleet) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Slab Allocation Engine (Slab Classes)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Pre-Allocated Memory Pages (64GB RAM)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Memcached / Multithreaded In-Memory Key-Value)",
        "steps": [
          "1. Client (App Client (Consistent Hashing)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Multithreaded Libevent Network Fleet) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Slab Allocation Engine (Slab Classes)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Pre-Allocated Memory Pages (64GB RAM)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Dynamic OS malloc/free Fragmentation Trap: 'Why not just use standard malloc() for every cached string?'",
        "juniorAnswer": "Use standard `malloc(size)` in C++ when saving a cached item, and `free()` when expired.",
        "staffRebuttal": "Allocating and freeing millions of small objects (e.g. 100 bytes to 2KB) every second creates severe external memory fragmentation in the Linux glibc allocator. Over hours, virtual memory balloons until the operating system OOM-kills the process even when memory is mostly empty. Memcached pre-allocates 1MB pages and partitions them into fixed-size chunk slabs, eliminating memory fragmentation completely."
      },
      {
        "trapTitle": "The Single-Threaded CPU Bottleneck Trap: 'Why compare Memcached with Redis on high-core servers?'",
        "juniorAnswer": "Redis is always better than Memcached because it supports more data structures.",
        "staffRebuttal": "Redis is primarily single-threaded for command execution; on a modern 64-core server, Redis can only utilize 1 CPU core for operations (~100k QPS). Memcached is natively multithreaded with fine-grained bucket locks, easily scaling across all 64 cores to process 1,000,000+ QPS on a single machine for simple key-value caching."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (1,000,000 Read/Write Ops/Sec • Zero Memory Fragmentation, 100M Cached Objects • 64GB RAM per Node • Sub-500µs Latency)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "telecom_sms_gateway": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5s Global Handset SMS Delivery across 1,000 Carriers",
        "detail": "Deliver international SMS messages from REST API submission to physical mobile handset within 5 seconds."
      },
      {
        "id": "FR2",
        "title": "Least-Cost Routing (LCR) with Real-Time MNP Lookups",
        "detail": "Dynamically route messages through the cheapest and most reliable carrier based on mobile number portability."
      },
      {
        "id": "FR3",
        "title": "Asynchronous SMPP Protocol Transceiver & DLR Tracking",
        "detail": "Translate HTTP requests into binary SMPP packets while managing per-carrier TPS throttling and delivery receipts."
      }
    ],
    "outOfScope": [
      "Mobile cellular tower 4G/5G radio base station hardware firmware",
      "MMS multimedia video transcode and APN data bearer configuration",
      "International satellite phone constellation satellite link orbital physics"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "25,000 SMS Submissions/Sec • Sub-5s End-to-End Handset Delivery Peak • 1,000 Global Telecom Carriers • 1 Billion SMS/Day",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/2010-04-01/Accounts/:AccountSid/Messages.json",
        "purpose": "Send outbound SMS message to international phone number",
        "requestSample": "{\n  \"To\": \"+14155552671\",\n  \"From\": \"+15017122661\",\n  \"Body\": \"Your verification code is 429182\"\n}",
        "responseSample": "{\n  \"sid\": \"SM99a1b2c3d4e5\",\n  \"status\": \"QUEUED\",\n  \"num_segments\": 1,\n  \"price\": \"-0.0075\",\n  \"price_unit\": \"USD\"\n}"
      },
      {
        "method": "POST",
        "endpoint": "/v1/carrier/smpp/dlr-webhook",
        "purpose": "Telco carrier emits asynchronous delivery receipt status callback",
        "requestSample": "{\n  \"messageSid\": \"SM99a1b2c3d4e5\",\n  \"messageStatus\": \"DELIVERED\",\n  \"carrierErrorCode\": null,\n  \"deliveredAt\": 1729001204\n}",
        "responseSample": "{\n  \"status\": \"ACK\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "SmsMessageRecord",
        "attributes": "message_sid (PK), account_sid, to_number, from_number, status (QUEUED|SENT|DELIVERED|FAILED), carrier_id, segment_count, price_cents, created_at",
        "description": "Outbound message lifecycle record."
      },
      {
        "name": "CarrierRouteBinding",
        "attributes": "binding_id (PK), carrier_name, smpp_host, port, max_tps, current_cost_per_sms_cents, delivery_success_rate_pct",
        "description": "Telco carrier SMPP connection profile."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Twilio / Global Telecom SMS SMPP Gateway)",
        "steps": [
          "1. Client (Customer Application (REST API)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (SMS API Gateway & Rate Limiter) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Outbound SMPP Priority Stream (Kafka)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (SMS Billing & Audit Ledger (Cassandra)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Twilio / Global Telecom SMS SMPP Gateway)",
        "steps": [
          "1. Client (Customer Application (REST API)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (SMS API Gateway & Rate Limiter) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Outbound SMPP Priority Stream (Kafka)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (SMS Billing & Audit Ledger (Cassandra)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Carrier TPS Overflow Ban Trap: 'What happens if we blast 5,000 SMS/sec at a carrier with a 100 TPS limit?'",
        "juniorAnswer": "Send messages to the carrier SMPP connection as fast as users submit them.",
        "staffRebuttal": "Telecom carriers strictly enforce bind rate limits (e.g. 100 TPS). Exceeding the rate limit will cause the carrier's SMSC to return `ESME_RTHROTTLED` errors or immediately disconnect and ban the company's SMPP bind for 30 minutes, dropping all messages. Staff engineers partition outbound queues per carrier bind and use token bucket rate limiters to meter traffic strictly below carrier quotas."
      },
      {
        "trapTitle": "The Static Area Code Routing Trap: 'Why can't we route messages based on the phone number's area code?'",
        "juniorAnswer": "Route numbers starting with +1-415 directly to AT&T in San Francisco.",
        "staffRebuttal": "Due to Mobile Number Portability (MNP), millions of users switch cell providers (e.g. from AT&T to T-Mobile) while keeping their exact original phone number. Routing based on static area codes sends messages to the wrong carrier, causing high delivery failure rates (>15%). Staff engineers query an in-memory MNP / HLR (Home Location Register) cache to look up the true current network operator before routing."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (25,000 SMS Submissions/Sec • Sub-5s End-to-End Handset Delivery, 1,000 Global Telecom Carriers • 1 Billion SMS/Day)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "multi_region_active_active": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-10ms Local Read/Write Latency via Geographic Locality Pinning",
        "detail": "Pin table rows to user geographic regions so 99% of transactions commit within the local region without cross-ocean WAN roundtrips."
      },
      {
        "id": "FR2",
        "title": "Zero Data Loss (RPO = 0) Multi-Region Failover",
        "detail": "Ensure that a catastrophic datacenter destruction in one region causes zero data loss using quorum consensus."
      },
      {
        "id": "FR3",
        "title": "Deterministic Cross-Region Conflict Resolution",
        "detail": "Prevent divergent database state across concurrent multi-region writes using Raft or CRDT semantics."
      }
    ],
    "outOfScope": [
      "Hardware atomic rubidium clock GPS antenna installation in physical datacenter roofs",
      "Physical transatlantic fiber-optic cable submarine trenching logistics",
      "Individual country data sovereign compliance legal advisory filings"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Multi-Region Writes/Sec • Sub-50ms Local Read Latency Peak • 3 Continental Regions • 99.999% Availability • Zero RPO Failover",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/users/:userId/profile",
        "purpose": "Update user profile with regional locality pinning",
        "requestSample": "{\n  \"userId\": \"usr_eu_8812\",\n  \"homeRegion\": \"eu-central-1\",\n  \"displayName\": \"Helmut\"\n}",
        "responseSample": "{\n  \"status\": \"COMMITTED_LOCAL\",\n  \"committedRegion\": \"eu-central-1\",\n  \"latencyMs\": 4.2\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/regions/health",
        "purpose": "Global health prober checks regional cluster quorum and WAN replication lag",
        "responseSample": "{\n  \"regions\": [\n    { \"region\": \"us-east-1\", \"status\": \"HEALTHY\", \"raftLagMs\": 1.2 },\n    { \"region\": \"eu-central-1\", \"status\": \"HEALTHY\", \"raftLagMs\": 1.5 }\n  ]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "MultiRegionTableSchema",
        "attributes": "table_name (PK), locality_type (REGIONAL_BY_ROW|GLOBAL), primary_region, survival_goal (ZONE_FAILURE|REGION_FAILURE), updated_at",
        "description": "Database multi-region locality configuration."
      },
      {
        "name": "RegionReplicationLag",
        "attributes": "from_region (PK), to_region (PK), rtt_ping_ms, replication_lag_bytes, last_synced_at",
        "description": "Cross-region network and replication telemetry."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Multi-Region Active-Active Database Architecture)",
        "steps": [
          "1. Client (Global Anycast DNS / Latency Router) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Regional API Gateway & Proxy) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Conflict-Free Replicated Data Engine (CRDT)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Automated Regional Failover Controller) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Multi-Region Active-Active Database Architecture)",
        "steps": [
          "1. Client (Global Anycast DNS / Latency Router) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Regional API Gateway & Proxy) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Conflict-Free Replicated Data Engine (CRDT)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Automated Regional Failover Controller) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Speed of Light Transatlantic Synchronous Quorum Trap: 'Can we run 3-phase commit across US, EU, and Asia on every write?'",
        "juniorAnswer": "Require synchronous commit across all 3 global regions before acknowledging any write.",
        "staffRebuttal": "Light takes ~70ms to travel from New York to London and ~150ms to Tokyo. Running synchronous multi-region 2PC or Raft quorum on every single write adds 200-300ms latency to every click, making the app unusable. Staff engineers use Locality Partitioning (CockroachDB `REGIONAL BY ROW`): European users' data has its Raft quorum strictly within 3 European availability zones (5ms latency); only rare cross-region data uses global consensus."
      },
      {
        "trapTitle": "The Last-Write-Wins (LWW) Clock Drift Silent Overwrite Trap: 'Can we resolve multi-region conflicts using system timestamps?'",
        "juniorAnswer": "Whichever write has the higher `System.currentTimeMillis()` wins the conflict.",
        "staffRebuttal": "Servers in different datacenters experience NTP clock drift (typically 10-50ms). If Server A's clock runs 50ms fast, all of its updates will silently overwrite newer legitimate updates from Server B, corrupting customer balances. Staff engineers use Google TrueTime (Wait-Out-The-Uncertainty) or state-based CRDTs with vector clocks to order events causality-wise."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Multi-Region Writes/Sec • Sub-50ms Local Read Latency, 3 Continental Regions • 99.999% Availability • Zero RPO Failover)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "ml_feature_store_feast": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5ms Online Feature Retrieval at 100,000 QPS",
        "detail": "Serve multi-feature vectors for ML inference models from in-memory Redis storage in under 5ms."
      },
      {
        "id": "FR2",
        "title": "Point-in-Time Correct Training Dataset Generation",
        "detail": "Execute historical As-Of joins between labels and features with zero future data leakage."
      },
      {
        "id": "FR3",
        "title": "Unified Batch and Streaming Feature Ingestion",
        "detail": "Synchronize feature values computed from both streaming Kafka events and batch Spark jobs into a single registry."
      }
    ],
    "outOfScope": [
      "Neural network backpropagation GPU training cluster hyperparameter tuning",
      "Model binary quantization and TensorRT engine optimization",
      "End-user facing web frontend interactive React component development"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Online Feature Lookups/Sec • Sub-5ms Feature Retrieval Peak • 10,000 ML Features • 1 Billion Entities • 100M Daily Inferences",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/features/online-features",
        "purpose": "Model server fetches vector of latest features for entity ID",
        "requestSample": "{\n  \"featureService\": \"fraud_detection_v2\",\n  \"entities\": { \"userId\": [\"usr_42918\"] }\n}",
        "responseSample": "{\n  \"metadata\": { \"featureNames\": [\"user_30d_spend\", \"device_trust_score\"] },\n  \"results\": [{ \"values\": [1420.50, 0.94] }]\n}"
      },
      {
        "method": "POST",
        "endpoint": "/api/v1/features/historical-features",
        "purpose": "Data scientist requests point-in-time training feature dataset",
        "requestSample": "{\n  \"entityDataFrameS3\": \"s3://ml-data/fraud_labels.parquet\",\n  \"features\": [\"user:30d_spend\", \"user:chargeback_count\"]\n}",
        "responseSample": "{\n  \"trainingDataOutputS3\": \"s3://ml-data/training_set_20261029.parquet\",\n  \"status\": \"COMPLETED\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "FeatureViewDefinition",
        "attributes": "view_name (PK), entity_keys (ARRAY), features_schema (JSONB), ttl_seconds, online_enabled_bool, batch_source_uri, stream_source_uri",
        "description": "Feature catalog definition."
      },
      {
        "name": "OnlineFeatureVector",
        "attributes": "entity_key (PK), feature_name (PK), feature_value_bytes, value_timestamp_epoch, updated_at",
        "description": "Redis online feature key-value."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Machine Learning Feature Store (Feast/Redis))",
        "steps": [
          "1. Client (Raw Event Sources & Batch Pipelines) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Streaming & Batch Feature Processor (Spark / Flink)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Online Low-Latency Store (Redis Cluster / DynamoDB)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Real-Time Model Serving Fleet (Triton / TorchServe)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Machine Learning Feature Store (Feast/Redis))",
        "steps": [
          "1. Client (Raw Event Sources & Batch Pipelines) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Streaming & Batch Feature Processor (Spark / Flink)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Online Low-Latency Store (Redis Cluster / DynamoDB)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Real-Time Model Serving Fleet (Triton / TorchServe)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Training-Serving Skew Data Leakage Trap: 'Why not compute features using SQL queries in production and Python in training?'",
        "juniorAnswer": "Write a Python script to compute features for training, and let backend engineers write SQL queries to compute them in production.",
        "staffRebuttal": "Writing feature logic twice in different languages guarantees subtle implementation discrepancies (Training-Serving Skew), causing high model offline accuracy but terrible production performance. Staff engineers write feature definitions once in Feast: the feature store handles both training extraction and production serving identically."
      },
      {
        "trapTitle": "The Future Data Leakage As-Of Join Trap: 'Why can't we join training data using standard SQL LEFT JOIN?'",
        "juniorAnswer": "Join the training events table with the latest user features table using a standard SQL JOIN.",
        "staffRebuttal": "Joining with latest features leaks data from the future into the training set (e.g. training a fraud model using a feature that shows the user had a chargeback yesterday, when the transaction being predicted happened 3 weeks ago). The model learns to look for the future chargeback and achieves 99% accuracy in training, but fails completely in production. Staff engineers use Point-in-Time As-Of Joins."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Online Feature Lookups/Sec • Sub-5ms Feature Retrieval, 10,000 ML Features • 1 Billion Entities • 100M Daily Inferences)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "distributed_job_celery": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-10ms Background Task Dispatching at 100k QPS",
        "detail": "Dispatch and buffer background tasks with sub-10ms latency using AMQP message brokers."
      },
      {
        "id": "FR2",
        "title": "Fair Task Distribution & Worker Starvation Prevention",
        "detail": "Enforce worker prefetch limits (`prefetch=1`) and heterogeneous queue isolation by SLA tiers."
      },
      {
        "id": "FR3",
        "title": "Exponential Backoff Retries & Dead Letter Queueing",
        "detail": "Automatically retry transient failures with exponential jitter and isolate poisonous tasks to DLQ."
      }
    ],
    "outOfScope": [
      "Operating system Linux kernel cgroup CPU quota allocation tuning",
      "Multi-tenant billing invoice credit card clearinghouse settlement",
      "Complex cyclical DAG workflow state machine coordination (Airflow domain)"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Tasks Dispatched/Sec • Sub-10ms Task Scheduling Peak • 100k Tasks/Sec • 1,000 Worker Nodes • Heterogeneous Queues",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "AMQP",
        "endpoint": "tasks.exchange (routing_key: tasks.email)",
        "purpose": "Producer publishes background task payload to AMQP exchange",
        "requestSample": "{\n  \"task\": \"tasks.send_email\",\n  \"id\": \"e3b0c442-98fc-42\",\n  \"args\": [\"usr_42\", \"welcome_template\"],\n  \"kwargs\": {},\n  \"retries\": 0,\n  \"eta\": null\n}",
        "responseSample": "BASIC_ACK (DeliveryTag: 1042)"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/tasks/:taskId/result",
        "purpose": "Poll task execution status and return values",
        "responseSample": "{\n  \"taskId\": \"e3b0c442-98fc-42\",\n  \"status\": \"SUCCESS\",\n  \"result\": { \"messageId\": \"msg_9912\", \"sent\": true },\n  \"elapsedSeconds\": 0.42\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "CeleryTaskState",
        "attributes": "task_id (PK UUID), task_name, queue_name, status (PENDING|STARTED|SUCCESS|FAILURE|RETRY), result_blob, traceback_text, completed_at",
        "description": "Task execution state in result backend."
      },
      {
        "name": "WorkerHeartbeat",
        "attributes": "worker_name (PK), active_processes, current_concurrency, total_tasks_processed, load_avg, last_heartbeat",
        "description": "Worker node operational health."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Celery / Distributed Background Task Worker Pool)",
        "steps": [
          "1. Client (Web App Producer (Django / FastAPI)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Task Message Broker (RabbitMQ / Redis)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Celery Worker Process Pool) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Flower Real-Time Monitoring Dashboard) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Celery / Distributed Background Task Worker Pool)",
        "steps": [
          "1. Client (Web App Producer (Django / FastAPI)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Task Message Broker (RabbitMQ / Redis)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Celery Worker Process Pool) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Flower Real-Time Monitoring Dashboard) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Default Prefetch Greediness Starvation Trap: 'Why are all workers idle while one worker is backed up with 1,000 tasks?'",
        "juniorAnswer": "Spin up more worker machines when tasks start backing up.",
        "staffRebuttal": "By default, Celery prefetches dozens of tasks into each worker's local buffer. If Worker 1 receives 1,000 slow tasks (e.g. 10 seconds each), it hoards all 1,000 tasks in memory, while Workers 2, 3, and 4 sit completely idle with empty queues. Staff engineers configure `worker_prefetch_multiplier = 1` and `-Ofair`: workers take only 1 task at a time, distributing load evenly."
      },
      {
        "trapTitle": "The Infinite Poison Message Retry Storm Trap: 'What happens when a task raises an unhandled ZeroDivisionError?'",
        "juniorAnswer": "Configure tasks to automatically retry on any exception.",
        "staffRebuttal": "A deterministic bug (like parsing bad JSON or dividing by zero) will fail every single retry. If retries are infinite, the task will crash, get requeued, and crash again millions of times, consuming 100% of worker CPU and starving legitimate tasks. Staff engineers enforce `max_retries = 3` with exponential backoff, routing permanent failures to a Dead Letter Queue (DLQ)."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Tasks Dispatched/Sec • Sub-10ms Task Scheduling, 100k Tasks/Sec • 1,000 Worker Nodes • Heterogeneous Queues)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "hadoop_hdfs_storage": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sequential High-Throughput Streaming of 100 Petabytes Data",
        "detail": "Deliver multi-gigabyte/second sequential read/write throughput for big data analytics engines using 128MB block sizes."
      },
      {
        "id": "FR2",
        "title": "Rack-Aware Fault-Tolerant Block Replication (3x)",
        "detail": "Distribute block replicas across independent server racks to survive physical top-of-rack switch failures."
      },
      {
        "id": "FR3",
        "title": "High-Availability NameNode Failover via Quorum Journal Manager",
        "detail": "Ensure continuous namespace availability using active-standby NameNodes synchronized via QJM Raft quorum."
      }
    ],
    "outOfScope": [
      "Low-latency random point-in-time byte mutations (HDFS is strictly append-only)",
      "POSIX compliant local file system symlink and hardlink directory structures",
      "Bare-metal Linux storage drive bad sector physical magnetic firmware re-mapping"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "50,000 Block Ops/Sec • NameNode In-Memory Namespace Peak • 100 Petabytes Data • 1 Billion Files • 128MB Block Slicing",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "RPC",
        "endpoint": "ClientProtocol.create()",
        "purpose": "Client requests NameNode to create new file and allocate block",
        "requestSample": "create(src=\"/data/warehouse/orders.csv\", permission=0644, overwrite=true, replication=3, blockSize=134217728)",
        "responseSample": "LocatedBlock(blockId=102941, offset=0, locs=[dn-01.rack1:9866, dn-02.rack1:9866, dn-08.rack2:9866])"
      },
      {
        "method": "RPC",
        "endpoint": "ClientProtocol.getBlockLocations()",
        "purpose": "Retrieve ordered list of DataNode hostnames hosting target file blocks",
        "responseSample": "LocatedBlocks(fileLength=268435456, blocks=[Block1: [dn-01, dn-02, dn-08], Block2: [dn-03, dn-04, dn-09]])"
      }
    ],
    "coreEntities": [
      {
        "name": "INodeFileMetadata",
        "attributes": "inode_id (PK), path_string, replication_factor, block_size_bytes, mtime, atime, block_ids (ARRAY BIGINT)",
        "description": "In-memory file namespace node in NameNode RAM."
      },
      {
        "name": "BlockLocationMap",
        "attributes": "block_id (PK), generation_stamp, size_bytes, datanode_uuids (ARRAY UUID)",
        "description": "Block to physical DataNode placement mapping."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Hadoop HDFS / Distributed Big Data File System)",
        "steps": [
          "1. Client (MapReduce / Spark / HDFS Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Active NameNode (In-Memory Namespace)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (DataNode Fleet (Commodity HDDs)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (HDFS Balancer & Decommission Daemon) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Hadoop HDFS / Distributed Big Data File System)",
        "steps": [
          "1. Client (MapReduce / Spark / HDFS Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Active NameNode (In-Memory Namespace)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (DataNode Fleet (Commodity HDDs)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (HDFS Balancer & Decommission Daemon) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Small Files NameNode Memory Exhaustion Trap: 'Can we store 100 million 1KB files in HDFS?'",
        "juniorAnswer": "Upload millions of small 1KB files directly into HDFS.",
        "staffRebuttal": "The NameNode keeps all file, directory, and block metadata in RAM (~150 bytes per object). Storing 100 million 1KB files consumes 30GB of NameNode RAM while only storing 100GB of actual data, exhausting NameNode heap space and degrading garbage collection. Staff engineers bundle small files into Hadoop Archives (HAR) or SequenceFiles/Parquet before uploading."
      },
      {
        "trapTitle": "The NameNode Single Point of Failure (SPOF) Split-Brain Trap: 'What happens if two NameNodes believe they are Active?'",
        "juniorAnswer": "Have the backup NameNode take over whenever it stops receiving heartbeats from the primary.",
        "staffRebuttal": "A temporary network partition can cause both NameNodes to think the other is dead, leading both to accept writes and corrupt the file system metadata (Split-Brain). Staff engineers use Quorum Journal Manager (QJM) and STONITH (Shoot The Other Node In The Head) fencing: only the node holding the majority QJM epoch lease can write edits; the old leader is forcefully powered down."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (50,000 Block Ops/Sec • NameNode In-Memory Namespace, 100 Petabytes Data • 1 Billion Files • 128MB Block Slicing)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "microservices_mesh_envoy": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-1ms Added Proxy Overhead across 10,000 Pods",
        "detail": "Deliver transparent sidecar interception and mTLS encryption with under 1ms added network latency."
      },
      {
        "id": "FR2",
        "title": "Zero-Code Mutual TLS (mTLS) Encryption & Identity",
        "detail": "Encrypt all inter-service communication automatically using rotating X.509 pod certificates."
      },
      {
        "id": "FR3",
        "title": "Dynamic Traffic Splitting & Outlier Circuit Breaking",
        "detail": "Support percentage-based canary deployments and automatically eject unhealthy backend pods."
      }
    ],
    "outOfScope": [
      "Kubernetes container Linux kernel namespace isolation cgroups tuning",
      "Bare-metal BGP Anycast ingress physical top-of-rack router configuration",
      "Business application SQL relational schema database migration"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Service-to-Service RPCs/Sec • Sub-1ms Added Sidecar Latency Peak • 10,000 Pods • 100k RPCs/Sec • Transparent Sidecar Interception",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "CRD",
        "endpoint": "networking.istio.io/v1alpha3/VirtualService",
        "purpose": "Declare traffic routing rules, canary percentages, and fault injection",
        "requestSample": "apiVersion: networking.istio.io/v1alpha3\nkind: VirtualService\nspec:\n  hosts: [\"reviews\"]\n  http:\n  - route:\n    - destination: { host: \"reviews\", subset: \"v1\" }, weight: 90\n    - destination: { host: \"reviews\", subset: \"v2\" }, weight: 10",
        "responseSample": "virtualservice.networking.istio.io/reviews configured"
      },
      {
        "method": "CRD",
        "endpoint": "networking.istio.io/v1alpha3/DestinationRule",
        "purpose": "Configure connection pooling, mutual TLS mode, and circuit breaking",
        "requestSample": "spec:\n  trafficPolicy:\n    tls: { mode: ISTIO_MUTUAL }\n    outlierDetection: { consecutive5xxErrors: 3, interval: 10s, baseEjectionTime: 30s }",
        "responseSample": "destinationrule.networking.istio.io/reviews configured"
      }
    ],
    "coreEntities": [
      {
        "name": "VirtualServiceConfig",
        "attributes": "name (PK), namespace, hosts (ARRAY), http_routes (JSONB), subsets_json, updated_at",
        "description": "Istio traffic routing configuration."
      },
      {
        "name": "PodMeshStatus",
        "attributes": "pod_name (PK), namespace, sidecar_version, mtls_status, proxy_cpu_millicores, proxy_memory_mb, is_injected",
        "description": "Envoy sidecar operational status."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Istio / Kubernetes Microservice Mesh Ingress)",
        "steps": [
          "1. Client (Application Container (K8s Pod)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (iptables / eBPF Transparent Traffic Redirection) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Istio Control Plane (Istiod)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Mesh Telemetry & Service Graph (Kiali / Prometheus)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Istio / Kubernetes Microservice Mesh Ingress)",
        "steps": [
          "1. Client (Application Container (K8s Pod)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (iptables / eBPF Transparent Traffic Redirection) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Istio Control Plane (Istiod)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Mesh Telemetry & Service Graph (Kiali / Prometheus)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Sidecar Memory Overhead Explosion Trap: 'What happens when 10,000 pods each receive the full cluster xDS configuration?'",
        "juniorAnswer": "Let Istiod push the full routing table of all 1,000 services to every Envoy sidecar.",
        "staffRebuttal": "Pushing the entire mesh configuration (all 1,000 services, endpoints, and routes) to every sidecar causes each Envoy proxy to consume 500MB+ of RAM. Across 10,000 pods, this wastes 5 Terabytes of RAM on sidecars alone. Staff engineers use `Sidecar` resources in Istio to scope configuration: restrict each sidecar's configuration to only the specific services it actually communicates with."
      },
      {
        "trapTitle": "The Cascading Timeout Retry Storm Trap: 'Why does adding automatic retries in the mesh cause total outages?'",
        "juniorAnswer": "Configure Envoy to retry failed requests 3 times with a 1-second timeout.",
        "staffRebuttal": "If a backend database slows down, thousands of Envoy proxies retrying 3 times simultaneously will multiply traffic by 4x, hitting an already struggling service with a massive retry storm and ensuring it never recovers. Staff engineers configure exponential backoff, retry budgets (e.g. maximum 10% of total requests can be retries), and strict circuit breaking."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Service-to-Service RPCs/Sec • Sub-1ms Added Sidecar Latency, 10,000 Pods • 100k RPCs/Sec • Transparent Sidecar Interception)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "continuous_delivery_argo": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-30s Automated GitOps Synchronization",
        "detail": "Reconcile Git commits to live Kubernetes clusters within 30 seconds of push webhooks."
      },
      {
        "id": "FR2",
        "title": "Automated Drift Detection & Self-Healing",
        "detail": "Continuously detect manual cluster drift and automatically revert uncommitted modifications."
      },
      {
        "id": "FR3",
        "title": "Ordered Deployment Orchestration via Sync Waves",
        "detail": "Execute phased deployments (database migrations, backend pods, cache invalidations) in strict wave sequences."
      }
    ],
    "outOfScope": [
      "Source code compiler build and unit test execution (CI pipeline / GitHub Actions scope)",
      "Container image Dockerfile security vulnerability static analysis scanning",
      "Bare-metal Linux operating system BIOS firmware provisioning"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "10,000 Git Reconciliations/Minute • Sub-30s Automated Sync Peak • 500 Kubernetes Clusters • 50,000 Microservice Applications",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "CRD",
        "endpoint": "argoproj.io/v1alpha1/Application",
        "purpose": "Declare GitOps application binding Git repository to target K8s cluster",
        "requestSample": "apiVersion: argoproj.io/v1alpha1\nkind: Application\nspec:\n  source:\n    repoURL: \"https://github.com/acme/infra.git\"\n    targetRevision: HEAD\n    path: apps/billing\n  destination:\n    server: \"https://k8s-prod-us.internal\"\n    namespace: billing\n  syncPolicy:\n    automated: { prune: true, selfHeal: true }",
        "responseSample": "application.argoproj.io/billing configured"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/applications/:appName/diff",
        "purpose": "Retrieve detailed diff between Git desired state and K8s live state",
        "responseSample": "{\n  \"diffs\": [{\n    \"target\": \"Deployment/billing-api\",\n    \"live\": { \"image\": \"v1.2.0\" },\n    \"desired\": { \"image\": \"v1.3.0\" }\n  }]\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ApplicationRecord",
        "attributes": "app_name (PK), project, git_repo_url, target_revision, target_cluster_url, sync_status (SYNCED|OUT_OF_SYNC), health_status (HEALTHY|DEGRADED), updated_at",
        "description": "Managed GitOps application state."
      },
      {
        "name": "SyncOperationAudit",
        "attributes": "operation_id (PK), app_name, revision_hash, triggered_by, sync_waves_count, status (SUCCESS|FAILED), duration_seconds, finished_at",
        "description": "Deployment audit and sync history."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design ArgoCD / Declarative GitOps Deployment Controller)",
        "steps": [
          "1. Client (Git Source of Truth (GitHub / GitLab)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (ArgoCD Webhook Receiver) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Application State Reconciliation Controller) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (ArgoCD Web UI & Audit Dashboard) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design ArgoCD / Declarative GitOps Deployment Controller)",
        "steps": [
          "1. Client (Git Source of Truth (GitHub / GitLab)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (ArgoCD Webhook Receiver) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Application State Reconciliation Controller) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (ArgoCD Web UI & Audit Dashboard) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Git Polling API Rate Limit Exhaustion Trap: 'Can ArgoCD poll 50,000 apps from GitHub every 30 seconds?'",
        "juniorAnswer": "Configure the controller to poll the Git repository every 30 seconds for changes across all 50,000 apps.",
        "staffRebuttal": "Polling GitHub 50,000 times every 30 seconds requires 6 million API calls per hour, blowing past GitHub's 5,000 req/hr API rate limit within minutes and blocking all deployments. Staff engineers set a long fallback polling interval (e.g. 3 minutes) and configure Git Push Webhooks: GitHub notifies ArgoCD instantly on commit, triggering immediate reconciliation with 0 wasted polling calls."
      },
      {
        "trapTitle": "The Self-Heal Infinite Mutation Loop Trap: 'What happens if a K8s mutating webhook modifies a field during sync?'",
        "juniorAnswer": "Enable `selfHeal: true` on all resources unconditionally.",
        "staffRebuttal": "If an admission controller (e.g. an Istio sidecar injector or a security policy) mutates the pod specification on create, ArgoCD will see that the live state does not match the Git manifest. With `selfHeal: true`, ArgoCD will constantly try to overwrite the field, triggering an infinite update loop that saturates the K8s API. Staff engineers configure `ignoreDifferences` in ArgoCD for fields dynamically populated by admission controllers."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (10,000 Git Reconciliations/Minute • Sub-30s Automated Sync, 500 Kubernetes Clusters • 50,000 Microservice Applications)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "telecom_cell_handoff": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Seamless Handover at Speeds up to 500 km/h",
        "detail": "Execute cellular handoffs in under 50ms without voice call drops or TCP connection resets on high-speed rail."
      },
      {
        "id": "FR2",
        "title": "Direct Xn/X2 Inter-Base Station Packet Forwarding",
        "detail": "Forward in-flight downlink data packets between base stations during frequency transition to achieve zero packet loss."
      },
      {
        "id": "FR3",
        "title": "Anti-Ping-Pong Hysteresis & Time-to-Trigger Guard",
        "detail": "Eliminate rapid back-and-forth cell switching oscillations using calibrated signal hysteresis thresholds."
      }
    ],
    "outOfScope": [
      "Physical radio antenna beamforming phased array dipole element RF hardware fabrication",
      "Federal Communications Commission (FCC) commercial radio spectrum auction licensing",
      "Emergency 911 wireless caller physical location triangulation regulation filing"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Measurement Reports/Sec • Zero Dropped Call Latency Peak • 100k gNodeB Base Stations • 500km/h High-Speed Train • Sub-50ms Handoff",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "3GPP",
        "endpoint": "XnAP: HANDOVER_REQUEST",
        "purpose": "Source base station initiates direct inter-gNodeB handoff over Xn interface",
        "requestSample": "{\n  \"ueContextId\": 104291,\n  \"targetCellId\": \"PLMN-310-410-CELL-8812\",\n  \"cause\": \"RadioNetwork(HandoverDesirableForRadioReason)\",\n  \"rrcContext\": \"0x4a9f...\"\n}",
        "responseSample": "{\n  \"status\": \"HANDOVER_REQUEST_ACK\",\n  \"allocatedCrnti\": 4821,\n  \"targetGtpTunnelEndpoint\": \"10.200.1.4:2152\"\n}"
      },
      {
        "method": "3GPP",
        "endpoint": "NGAP: PATH_SWITCH_REQUEST",
        "purpose": "Target base station notifies 5G Core AMF/UPF to switch GTP user plane tunnel",
        "responseSample": "{\n  \"status\": \"PATH_SWITCH_ACK\",\n  \"upfTunnelSwitched\": true\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "UEHandoverContext",
        "attributes": "ue_id (PK), source_cell_id, target_cell_id, handover_state (PREPARING|EXECUTING|COMPLETED), allocated_c_rnti, rsrp_margin_db, initiated_at",
        "description": "Active radio handoff session."
      },
      {
        "name": "CellNeighborRelation",
        "attributes": "serving_cell_id (PK), neighbor_cell_id (PK), xn_ip_address, a3_offset_db, time_to_trigger_ms, handoff_success_rate",
        "description": "Adjacent cell neighbor configuration."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design 5G / High-Speed Cellular Base Station Handoff)",
        "steps": [
          "1. Client (User Mobile Handset (5G UE)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Source 5G Base Station (gNodeB)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Target 5G Base Station (gNodeB)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Cellular Performance Stream (Kafka)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design 5G / High-Speed Cellular Base Station Handoff)",
        "steps": [
          "1. Client (User Mobile Handset (5G UE)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Source 5G Base Station (gNodeB)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Target 5G Base Station (gNodeB)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Cellular Performance Stream (Kafka)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Core Network Handoff Latency Trap: 'Why not route all handoffs through the 5G Core AMF?'",
        "juniorAnswer": "Have the source base station tell the 5G Core to coordinate the handoff with the target tower.",
        "staffRebuttal": "Routing handoffs through the central core network requires traversing backhaul fiber to a regional data center and back, adding 50-100ms latency. At 350 km/h on a bullet train, this delay causes the radio link with the retreating tower to collapse before the new tower is connected, dropping the call. 5G uses direct Xn interface handoff: adjacent towers talk directly peer-to-peer in <20ms."
      },
      {
        "trapTitle": "The Ping-Pong Switching Thrashing Trap: 'What happens if we switch towers as soon as a neighbor signal is 0.1dB stronger?'",
        "juniorAnswer": "Immediately switch to any neighbor tower whose signal strength exceeds the current tower.",
        "staffRebuttal": "RF signals fluctuate rapidly due to trees and buildings. Switching on raw signal strength causes 'Ping-Pong Handover' where the phone switches back and forth between two towers 10 times a second, consuming all control channel bandwidth and dropping the connection. Staff engineers configure Event A3 Hysteresis: the neighbor must remain at least 3dB stronger for at least 64 milliseconds before triggering a handoff."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Measurement Reports/Sec • Zero Dropped Call Latency, 100k gNodeB Base Stations • 500km/h High-Speed Train • Sub-50ms Handoff)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "web_screenshot_api": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-2s High-Fidelity Web Page Screenshot Rendering",
        "detail": "Render accurate full-page or viewport screenshots of modern SPA websites in under 2 seconds."
      },
      {
        "id": "FR2",
        "title": "Strict SSRF (Server-Side Request Forgery) Protection",
        "detail": "Block access to internal private IP subnets, loopback addresses, and cloud instance metadata APIs."
      },
      {
        "id": "FR3",
        "title": "Automated Worker Process Recycling & Memory Isolation",
        "detail": "Recycle Headless Chrome processes periodically to prevent zombie browser processes and memory bloat."
      }
    ],
    "outOfScope": [
      "Hardware GPU 3D WebGL complex ray tracing canvas shader compilation",
      "Bypassing third-party Cloudflare Turnstile / reCAPTCHA anti-bot puzzles",
      "Audio recording from HTML5 video tags during page render"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "2,000 Screenshot Requests/Sec • Sub-2s Full Page Capture Peak • 10M Screenshots/Day • 500 Concurrent Browser Instances",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/api/v1/screenshots",
        "purpose": "Render web page and generate high-resolution PNG image",
        "requestSample": "{\n  \"url\": \"https://stripe.com\",\n  \"viewport\": { \"width\": 1920, \"height\": 1080 },\n  \"format\": \"PNG\",\n  \"fullPage\": false,\n  \"blockAds\": true\n}",
        "responseSample": "{\n  \"screenshotUrl\": \"https://cdn.screenshot.io/images/99a1b2c3.png\",\n  \"renderTimeMs\": 1420,\n  \"cached\": false\n}"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/screenshots/queue-depth",
        "purpose": "Monitor active rendering worker utilization and queue backlog",
        "responseSample": "{\n  \"activeWorkers\": 450,\n  \"idleWorkers\": 50,\n  \"queueWaitSeconds\": 0.4\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "ScreenshotJobRecord",
        "attributes": "job_id (PK UUID), target_url, url_sha256_hash, render_options_json, status (QUEUED|RENDERING|COMPLETED|FAILED), s3_image_uri, render_duration_ms, created_at",
        "description": "Screenshot rendering job log."
      },
      {
        "name": "RenderWorkerHealth",
        "attributes": "worker_id (PK), pod_ip, chrome_process_pid, pages_rendered_total, memory_rss_mb, is_healthy",
        "description": "Headless Chrome worker lifecycle state."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Headless Chrome / Distributed Screenshot Cluster)",
        "steps": [
          "1. Client (Customer API Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Screenshot API Gateway & Rate Limiter) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Headless Chrome Worker Fleet (Puppeteer / Playwright)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (URL Screenshot Cache (Redis)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Headless Chrome / Distributed Screenshot Cluster)",
        "steps": [
          "1. Client (Customer API Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Screenshot API Gateway & Rate Limiter) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Headless Chrome Worker Fleet (Puppeteer / Playwright)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (URL Screenshot Cache (Redis)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Cloud Metadata SSRF Vulnerability Trap: 'What happens if a user submits http://169.254.169.254/latest/meta-data/?'",
        "juniorAnswer": "Just pass the URL directly into `page.goto(url)` in Puppeteer.",
        "staffRebuttal": "Calling `page.goto('http://169.254.169.254')` allows an attacker to screenshot your AWS IAM temporary security credentials and database passwords, compromising your entire cloud infrastructure. Staff engineers resolve DNS first, reject private IP ranges (RFC 1918, loopback, and link-local 169.254.0.0/16), and enforce network egress firewalls on rendering containers."
      },
      {
        "trapTitle": "The Zombie Chrome Process Leak Trap: 'Can one Chrome process run continuously for months?'",
        "juniorAnswer": "Start one Headless Chrome instance when the server starts and keep opening new tabs for each request.",
        "staffRebuttal": "Chromium is not designed as a persistent server process; complex JavaScript on modern web pages inevitably leaks memory in V8. After 500 requests, Chrome will consume 10GB+ of RAM and freeze. Staff engineers configure a process reaper: kill and restart the Chrome instance after every 50-100 renders or 30 minutes of runtime."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (2,000 Screenshot Requests/Sec • Sub-2s Full Page Capture, 10M Screenshots/Day • 500 Concurrent Browser Instances)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "eventbridge_bus": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-50ms Content-Based Filtering across 10,000 Rules",
        "detail": "Evaluate incoming JSON event attributes against thousands of filtering rules in under 5ms using Rete algorithm compiling."
      },
      {
        "id": "FR2",
        "title": "Strict Schema Validation & Contract Enforcement",
        "detail": "Validate incoming events against registered JSON Schemas to prevent downstream pipeline crashes."
      },
      {
        "id": "FR3",
        "title": "Event Archival & Point-in-Time Stream Replay",
        "detail": "Store raw event streams in S3 and support replaying events within any time window for disaster recovery."
      }
    ],
    "outOfScope": [
      "Heavy ETL big data batch MapReduce analytics aggregation (EMR/Spark domain)",
      "Bidirectional long-lived stateful client WebSocket session management",
      "Bare-metal Linux storage disk block replication"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Events Ingested/Sec • Declarative Pattern Matching Peak • 100k Events/Sec • Millions of Filtering Rules • Sub-50ms Routing",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "/v1/events:putEvents",
        "purpose": "Publish batch of structured JSON events to custom event bus",
        "requestSample": "{\n  \"Entries\": [{\n    \"Source\": \"acme.orders\",\n    \"DetailType\": \"OrderCreated\",\n    \"Detail\": \"{\\\"orderId\\\": \\\"1042\\\", \\\"amount\\\": 250.00, \\\"status\\\": \\\"PAID\\\"}\",\n    \"EventBusName\": \"production-bus\"\n  }]\n}",
        "responseSample": "{\n  \"FailedEntryCount\": 0,\n  \"Entries\": [{ \"EventId\": \"evt_99a1b2c3\" }]\n}"
      },
      {
        "method": "POST",
        "endpoint": "/v1/rules:putRule",
        "purpose": "Create declarative event filtering rule with target bindings",
        "requestSample": "{\n  \"Name\": \"HighValueOrdersRule\",\n  \"EventPattern\": \"{\\\"source\\\": [\\\"acme.orders\\\"], \\\"detail\\\": {\\\"amount\\\": [{\\\"numeric\\\": [\\\">\\\", 100]}]}}\",\n  \"State\": \"ENABLED\"\n}",
        "responseSample": "{\n  \"RuleArn\": \"arn:aws:events:us-east-1:123456:rule/HighValueOrdersRule\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "EventRule",
        "attributes": "rule_name (PK), bus_name, event_pattern_json, state (ENABLED|DISABLED), targets_json, description, updated_at",
        "description": "Declarative event pattern rule."
      },
      {
        "name": "ArchivedEvent",
        "attributes": "event_id (PK UUID), bus_name, source, detail_type, payload_json, ingress_timestamp, s3_archive_path",
        "description": "Persistent immutable event archive."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design AWS EventBridge / Schema-Validated Serverless Event Bus)",
        "steps": [
          "1. Client (Event Source Publisher (SaaS / Microservice)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (EventBus Ingestion Gateway) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Rule Pattern Matching Engine (Rete Algorithm)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Event Archive & Time-Travel Replay Store (S3)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design AWS EventBridge / Schema-Validated Serverless Event Bus)",
        "steps": [
          "1. Client (Event Source Publisher (SaaS / Microservice)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (EventBus Ingestion Gateway) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Rule Pattern Matching Engine (Rete Algorithm)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Event Archive & Time-Travel Replay Store (S3)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Sequential Rule Evaluation CPU Explosion Trap: 'Can we iterate through all 10,000 rules with for loops for each event?'",
        "juniorAnswer": "Loop through an array of 10,000 regex rules for every incoming event.",
        "staffRebuttal": "At 100,000 events/sec, evaluating 10,000 rules in a loop requires 1,000,000,000 rule evaluations per second, requiring hundreds of CPU cores and causing massive queue backlog. Staff engineers compile declarative rules into an in-memory Rete network or Trie index: evaluating an event tests each field once, traversing rule branches in microseconds."
      },
      {
        "trapTitle": "The Downstream Target Throttling Cascade Trap: 'What happens when a downstream webhook endpoint slows down?'",
        "juniorAnswer": "Wait synchronously for the downstream webhook to respond before processing the next event.",
        "staffRebuttal": "Waiting for a slow external webhook (taking 5 seconds) ties up dispatcher threads and stalls the entire event bus pipeline. Staff engineers decouple dispatching using buffered queues (SQS/Kafka) with token bucket rate limiters, retrying transient 429/5xx responses with exponential backoff and routing failures to a Dead Letter Queue."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Events Ingested/Sec • Declarative Pattern Matching, 100k Events/Sec • Millions of Filtering Rules • Sub-50ms Routing)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "dynamodb_partition_router": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-5ms Single-Digit Millisecond Latency at 500,000 QPS",
        "detail": "Route and serve point key-value lookups with sub-5ms latency across tens of thousands of storage partitions."
      },
      {
        "id": "FR2",
        "title": "Automated Zero-Downtime 10GB Partition Splitting",
        "detail": "Split storage partitions automatically when volume exceeds 10GB without interrupting live traffic."
      },
      {
        "id": "FR3",
        "title": "Adaptive Capacity Multi-Tenant Burstable Throttling",
        "detail": "Dynamically boost capacity on hot partitions by borrowing unused throughput from idle table partitions."
      }
    ],
    "outOfScope": [
      "Complex SQL cross-table joins and recursive graph traversals",
      "Multi-hour OLAP analytical data warehouse column scanning (Redshift domain)",
      "Bare-metal Linux storage disk sector remapping firmware routines"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "500,000 Key-Value Reads/Writes/Sec • Single-Digit Millisecond P99 Peak • 100 Terabytes Storage • 10,000 Storage Partitions • Multi-Tenant",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "POST",
        "endpoint": "DynamoDB_20120810.PutItem",
        "purpose": "Put item with partition key, sort key, and attribute map",
        "requestSample": "{\n  \"TableName\": \"Users\",\n  \"Item\": {\n    \"PK\": { \"S\": \"USER#42\" },\n    \"SK\": { \"S\": \"METADATA\" },\n    \"Email\": { \"S\": \"alex@example.com\" },\n    \"Balance\": { \"N\": \"100\" }\n  }\n}",
        "responseSample": "{\n  \"ConsumedCapacity\": { \"TableName\": \"Users\", \"CapacityUnits\": 1.0 }\n}"
      },
      {
        "method": "POST",
        "endpoint": "DynamoDB_20120810.GetItem",
        "purpose": "Point lookup by composite primary key with sub-5ms P99 latency",
        "requestSample": "{\n  \"TableName\": \"Users\",\n  \"Key\": { \"PK\": { \"S\": \"USER#42\" }, \"SK\": { \"S\": \"METADATA\" } },\n  \"ConsistentRead\": true\n}",
        "responseSample": "{\n  \"Item\": { \"PK\": { \"S\": \"USER#42\" }, \"Email\": { \"S\": \"alex@example.com\" } }\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "PartitionRangeMap",
        "attributes": "partition_id (PK), hash_range_start (uint128), hash_range_end (uint128), paxos_leader_node_id, follower_node_ids (ARRAY), size_bytes, updated_at",
        "description": "Hash ring partition assignment map."
      },
      {
        "name": "PartitionCapacityMetrics",
        "attributes": "partition_id (PK), current_rcu_consumed, current_wcu_consumed, allocated_rcu, allocated_wcu, throttle_events_count",
        "description": "Adaptive capacity consumption metrics."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design DynamoDB / Distributed Partition Key Router)",
        "steps": [
          "1. Client (Application AWS SDK Client) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Request Router Fleet (Stateless Proxy)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Storage Partition Leader (B-Tree + WAL)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Automated Partition Split Worker) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design DynamoDB / Distributed Partition Key Router)",
        "steps": [
          "1. Client (Application AWS SDK Client) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Request Router Fleet (Stateless Proxy)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Storage Partition Leader (B-Tree + WAL)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Automated Partition Split Worker) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Monotonically Increasing Partition Key Hotspot Trap: 'Can we use orderDate as the partition key?'",
        "juniorAnswer": "Use the order creation date (e.g. `2026-10-29`) as the partition key.",
        "staffRebuttal": "Using a date as the partition key sends 100% of today's writes to the single physical partition responsible for that date's hash. That single partition will hit its hard 1,000 WCU limit and reject all writes with `ProvisionedThroughputExceededException`, even if you provisioned 100,000 WCU table-wide. Staff engineers add random synthetic suffixes (salt: `2026-10-29#1` through `#10`) or use high-cardinality keys like `user_id`."
      },
      {
        "trapTitle": "The Global Secondary Index (GSI) Backpressure Throttling Trap: 'What happens if a GSI has less provisioned capacity than the main table?'",
        "juniorAnswer": "Provision low capacity on the GSI to save money.",
        "staffRebuttal": "In DynamoDB, updates to the main table are asynchronously replicated to GSIs. If the GSI does not have enough capacity to keep up with writes, DynamoDB throttles the MAIN table to prevent unbounded replication lag, blocking primary application checkout writes. Staff engineers ensure GSI write capacity always matches or exceeds the main table."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (500,000 Key-Value Reads/Writes/Sec • Single-Digit Millisecond P99, 100 Terabytes Storage • 10,000 Storage Partitions • Multi-Tenant)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "canary_traffic_router": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Sub-Second Automated Traffic Rollback on Metric Anomalies",
        "detail": "Revert canary traffic back to 0% within 1 second of detecting error rate surges or latency degradation."
      },
      {
        "id": "FR2",
        "title": "Fine-Grained Weighted Traffic Splitting via Envoy",
        "detail": "Route specified traffic percentages (1%, 5%, 25%, 50%) to candidate deployments with session stickiness."
      },
      {
        "id": "FR3",
        "title": "Scientific Statistical Comparison (Mann-Whitney U Test)",
        "detail": "Validate metrics between canary and baseline under live production conditions to eliminate false positives."
      }
    ],
    "outOfScope": [
      "Source code compiler AST syntax tree static security vulnerability analysis",
      "Physical datacenter server power supply rail energy consumption measurement",
      "Customer credit card refund automated chargeback mediation"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 Routed Requests/Sec • Statistical Anomaly Detection Peak • 1,000 Deployments/Day • 100k Requests/Sec • Sub-Second Metric Rollback",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "CRD",
        "endpoint": "argoproj.io/v1alpha1/Rollout",
        "purpose": "Declare automated progressive canary rollout strategy with metric analysis",
        "requestSample": "apiVersion: argoproj.io/v1alpha1\nkind: Rollout\nspec:\n  strategy:\n    canary:\n      steps:\n      - setWeight: 5\n      - pause: { duration: 10m }\n      - setWeight: 20\n      - pause: { duration: 30m }\n      analysis:\n        templates: [{ templateName: \"success-rate-analysis\" }]",
        "responseSample": "rollout.argoproj.io/checkout-api configured"
      },
      {
        "method": "GET",
        "endpoint": "/api/v1/rollouts/:rolloutId/canary-health",
        "purpose": "Retrieve statistical comparison scores between Canary and Baseline",
        "responseSample": "{\n  \"status\": \"HEALTHY\",\n  \"canaryErrorRate\": 0.0012,\n  \"baselineErrorRate\": 0.0011,\n  \"p99LatencyDeltaMs\": 1.4,\n  \"verdict\": \"PROCEED\"\n}"
      }
    ],
    "coreEntities": [
      {
        "name": "RolloutExperiment",
        "attributes": "rollout_id (PK), app_name, canary_version, baseline_version, current_traffic_pct, status (IN_PROGRESS|SUCCESSFUL|ABORTED), started_at, completed_at",
        "description": "Active progressive deployment experiment."
      },
      {
        "name": "AnalysisMetricMeasurement",
        "attributes": "measurement_id (PK), rollout_id, metric_name, canary_value, baseline_value, p_value, passed_bool, measured_at",
        "description": "Statistical validation sample."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design Cloud Canary Traffic Router & Rollback Controller)",
        "steps": [
          "1. Client (Incoming User Web Traffic) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Envoy / Traefik Dynamic Traffic Splitter) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Canary Deployment Fleet (v2)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Deployment Audit Ledger (PostgreSQL)) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design Cloud Canary Traffic Router & Rollback Controller)",
        "steps": [
          "1. Client (Incoming User Web Traffic) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Envoy / Traefik Dynamic Traffic Splitter) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Canary Deployment Fleet (v2)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Deployment Audit Ledger (PostgreSQL)) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Static Threshold Comparison Trap: 'Can we roll back if canary error rate exceeds 1%?'",
        "juniorAnswer": "Set an alert to roll back if the canary fleet error rate exceeds 1%.",
        "staffRebuttal": "If a downstream provider (like Stripe or AWS) experiences an outage, the baseline error rate will jump to 5%. Testing the canary against a static 1% threshold will trigger a false rollback, blaming the new release for a third-party outage. Staff engineers compare the Canary against a Baseline fleet running the old code concurrently: only roll back if Canary error rate is statistically higher than Baseline."
      },
      {
        "trapTitle": "The Database Migration Incompatible Schema Rollback Trap: 'What happens to the database when a canary rolls back?'",
        "juniorAnswer": "Roll back the database schema whenever the canary deployment rolls back.",
        "staffRebuttal": "Rolling back database columns (e.g. dropping a column that the old code doesn't know about) will corrupt live production data and crash the baseline fleet. Staff engineers require Expand-and-Contract (Parallel Run) database migrations: database changes must always be backward-compatible with the old version so the canary can be rolled back to 0% with zero database changes."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 Routed Requests/Sec • Statistical Anomaly Detection, 1,000 Deployments/Day • 100k Requests/Sec • Sub-Second Metric Rollback)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  },
  "database_connection_pooler": {
    "inScope": [
      {
        "id": "FR1",
        "title": "Multiplexing 10,000 Client Connections onto 100 Database Sockets",
        "detail": "Enable massive application connection scaling without exhausting PostgreSQL operating system process memory."
      },
      {
        "id": "FR2",
        "title": "Sub-Millisecond Proxy Routing Overhead at 100,000 QPS",
        "detail": "Deliver connection multiplexing with less than 500 microseconds of added latency using libevent epoll."
      },
      {
        "id": "FR3",
        "title": "Local Client Password Authentication Caching",
        "detail": "Validate client SCRAM-SHA-256 credentials in memory without sending authentication queries to the primary database."
      }
    ],
    "outOfScope": [
      "SQL query AST syntax rewriting and horizontal table sharding (Vitess scope)",
      "Distributed Paxos cross-region database consensus replication",
      "Physical storage volume filesystem write-ahead log flush synchronization"
    ],
    "capacityEstimations": [
      {
        "category": "Throughput & Peak QPS",
        "metric": "100,000 SQL Queries/Sec • Sub-Millisecond Multiplexing Overhead Peak • 10,000 App Pods • 100 Physical DB Sockets • 100k Queries/Sec",
        "derivation": "Scaled to sustain peak traffic spikes (3x average baseline) without connection queue exhaustion."
      },
      {
        "category": "Latency SLA & Availability",
        "metric": "< 10ms P99 • High Fault Tolerance & Partition Resilience",
        "derivation": "Designed for zero single-point-of-failure with quorum consensus or consistent hashing failover."
      },
      {
        "category": "Bandwidth & Data Rate",
        "metric": "1 Gbps - 50 Gbps Edge Ingress/Egress",
        "derivation": "Edge proxies terminate TLS, compress JSON/Protobuf, and cache repetitive payloads."
      },
      {
        "category": "Storage Ingestion & Retention",
        "metric": "Erasure Coded Storage • Multi-Region Availability",
        "derivation": "Storage chunks sliced with parity to survive simultaneous disk or server rack failures."
      }
    ],
    "apiContracts": [
      {
        "method": "SQL",
        "endpoint": "PgBouncer Virtual Console (SHOW POOLS)",
        "purpose": "Query connection pool metrics, client wait queues, and server socket usage",
        "requestSample": "SHOW POOLS;",
        "responseSample": "database | user | cl_active | cl_waiting | sv_active | sv_idle | maxwait\norders_db | app | 420 | 0 | 85 | 15 | 0"
      },
      {
        "method": "SQL",
        "endpoint": "SHOW CLIENTS",
        "purpose": "Inspect connected application client sockets and connection age",
        "responseSample": "type | user | database | state | addr | port | connect_time\nC | app | orders_db | active | 10.0.4.12 | 51290 | 2026-10-29 17:00:00"
      }
    ],
    "coreEntities": [
      {
        "name": "PoolConfiguration",
        "attributes": "pool_name (PK), database, user, pool_mode (TRANSACTION|SESSION|STATEMENT), default_pool_size, max_client_conn, reserve_pool_size",
        "description": "Connection pool sizing configuration."
      },
      {
        "name": "ConnectionPoolMetrics",
        "attributes": "pool_name (PK), active_clients, waiting_clients, active_servers, idle_servers, max_wait_seconds, queries_per_second",
        "description": "Real-time pool saturation metrics."
      }
    ],
    "dataFlowPaths": {
      "writePath": {
        "title": "Write & Ingestion Pipeline (Design High-Performance SQL Connection Pooler (PgBouncer))",
        "steps": [
          "1. Client (Application Pods (10,000 Instances)) initiates write/event payload over secure TLS/mTLS link.",
          "2. Edge Gateway (Event-Driven Connection Pooler (C / Libevent)) authenticates token, verifies rate limit token bucket, and validates schema.",
          "3. Core Pipeline Stage (Physical Server Connection Pool (100 Sockets)) executes business logic, atomic lock, or stream partitioning.",
          "4. Storage/Ledger (Pool Saturation & Wait Queue Telemetry) commits immutable record, triggers async replication, or emits completion receipt."
        ]
      },
      "readPath": {
        "title": "Read & Serving Pipeline (Design High-Performance SQL Connection Pooler (PgBouncer))",
        "steps": [
          "1. Client (Application Pods (10,000 Instances)) sends query or opens real-time socket connection.",
          "2. Edge Router/CDN (Event-Driven Connection Pooler (C / Libevent)) checks edge cache for matching valid cached response.",
          "3. In-Memory / Index Layer (Physical Server Connection Pool (100 Sockets)) serves hot lookups in <2ms, bypassing primary database disk I/O.",
          "4. Persistent Database (Pool Saturation & Wait Queue Telemetry) handles cache-miss queries with optimized primary/secondary index scans."
        ]
      }
    },
    "interviewerTraps": [
      {
        "trapTitle": "The Session State Poisoning Trap: 'Why do prepared statements and SET search_path break in transaction pooling?'",
        "juniorAnswer": "Use transaction pooling mode and run `PREPARE my_stmt` or `SET search_path = custom`.",
        "staffRebuttal": "In Transaction Pooling mode, Client A gets Server Connection 1 for Query 1, but its next query might use Server Connection 2. Prepared statements and session variables created in Query 1 will not exist on Connection 2 (or will pollute Connection 1 for other users). Staff engineers use Session Pooling mode if session state is required, or configure client ORMs to avoid session-level `SET` commands."
      },
      {
        "trapTitle": "The Sizing PostgreSQL Connections to Pod Count Trap: 'Why not set max_connections = 10,000 directly in postgresql.conf?'",
        "juniorAnswer": "Increase `max_connections = 10000` in postgresql.conf so all 10,000 Kubernetes pods can connect directly.",
        "staffRebuttal": "PostgreSQL forks a full Linux process for every connection. 10,000 processes will consume 50GB+ of RAM just on idle connection overhead and cause catastrophic CPU thrashing (context switching between 10,000 processes). Benchmark data shows PostgreSQL throughput PEAKS at around 2x to 4x the number of CPU cores (e.g. 64-128 connections); beyond that, throughput drops sharply. Staff engineers keep `max_connections = 150` and use PgBouncer in front."
      }
    ],
    "playbookSteps": [
      {
        "step": "Step 1",
        "phase": "Clarify & Scope",
        "title": "Anchor on Core Functional Scope & Numbers",
        "guidance": "Agree on top 2-3 capabilities, state explicit out-of-scope boundaries, and calculate capacity numbers (100,000 SQL Queries/Sec • Sub-Millisecond Multiplexing Overhead, 10,000 App Pods • 100 Physical DB Sockets • 100k Queries/Sec)."
      },
      {
        "step": "Step 2",
        "phase": "API & Data Model",
        "title": "Define Contracts Before Designing Topology",
        "guidance": "Define REST/gRPC/WebSocket request-response schemas and core entities before placing infrastructure boxes."
      },
      {
        "step": "Step 3",
        "phase": "Architecture Split",
        "title": "Separate High-Speed Reads from Asynchronous Writes",
        "guidance": "Draw the ingestion/write pipeline independently from the read/serving pipeline to isolate failure domains."
      },
      {
        "step": "Step 4",
        "phase": "Deep Dives & Traps",
        "title": "Address Failure Modes & Edge Cases Proactively",
        "guidance": "Demonstrate staff-level mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering."
      }
    ]
  }
};
