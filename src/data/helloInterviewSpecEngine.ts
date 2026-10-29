import { PuzzleScenario } from './systemDesignPuzzlesData';
import { HELLO_INTERVIEW_CATALOG } from './helloInterviewCatalog';

export interface HelloInterviewFR {
  id: string; // e.g. "FR1", "FR2", "FR3"
  title: string;
  detail: string;
}

export interface HelloInterviewCapacityEstimate {
  category: string;
  metric: string;
  derivation: string;
}

export interface HelloInterviewApiContract {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
  endpoint: string;
  purpose: string;
  requestSample?: string;
  responseSample?: string;
}

export interface HelloInterviewCoreEntity {
  name: string;
  attributes: string;
  description: string;
}

export interface HelloInterviewInterviewerTrap {
  trapTitle: string;
  juniorAnswer: string;
  staffRebuttal: string;
}

export interface HelloInterviewDataPaths {
  writePath: { title: string; steps: string[] };
  readPath: { title: string; steps: string[] };
}

export interface HelloInterviewPlaybookStep {
  step: string;
  phase: string;
  title: string;
  guidance: string;
}

export interface HelloInterviewSpec {
  inScope: HelloInterviewFR[];
  outOfScope: string[];
  capacityEstimations: HelloInterviewCapacityEstimate[];
  apiContracts: HelloInterviewApiContract[];
  coreEntities: HelloInterviewCoreEntity[];
  dataFlowPaths: HelloInterviewDataPaths;
  interviewerTraps: HelloInterviewInterviewerTrap[];
  playbookSteps: HelloInterviewPlaybookStep[];
}

export interface ScenarioRequirementsSpec {
  functionalRequirements: string[];
  nonFunctionalRequirements: {
    label: string;
    metric: string;
    detail: string;
  }[];
  whatToDoFirst: {
    step: string;
    title: string;
    instruction: string;
    targetNodeId: string;
    targetNodeLabel: string;
  }[];
  helloInterview: HelloInterviewSpec;
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAGSHIP HELLOINTERVIEW PROBLEM SPECIFICATIONS
// (YouTube, Bitly, Uber, Stripe, Ticketmaster, Twitter, WhatsApp, Dropbox, etc.)
// ─────────────────────────────────────────────────────────────────────────────

const FLAGSHIP_SPECS: Record<string, HelloInterviewSpec> = {
  // 1. YouTube & Netflix Video Streaming Platform (HelloInterview Flagship)
  netflix_streaming: {
    inScope: [
      {
        id: 'FR1',
        title: 'Direct-to-S3 Resumable Multipart Video Upload',
        detail:
          'Content creators can upload high-resolution video files (up to several GBs) reliably with chunked resumable upload directly to Object Storage, completely bypassing backend application servers.',
      },
      {
        id: 'FR2',
        title: 'Global Low-Latency Adaptive Bitrate Streaming (ABR)',
        detail:
          'Viewers across the globe can stream video smoothly with <200ms time-to-first-frame and zero re-buffering across diverse devices (1080p, 720p, 480p, 360p) via HLS/DASH.',
      },
      {
        id: 'FR3',
        title: 'Asynchronous DAG Chunk Transcoding & Manifest Assembly',
        detail:
          'The system splits raw videos into 10-second GOP-aligned segments and transcodes them in parallel across worker fleets, generating the master .m3u8 playlist and marking catalog status READY.',
      },
    ],
    outOfScope: [
      'Real-time personalized video recommendations and collaborative filtering ranking models',
      'User comments, discussion threads, nested replies, and live comment moderation',
      'Real-time live streaming broadcasts (WebRTC / RTMP ingestion)',
      'Digital Rights Management (DRM) licensing exchanges and automated copyright fingerprinting (Content ID)',
    ],
    capacityEstimations: [
      {
        category: 'Throughput & QPS',
        metric: '10M Uploads/Day (~115/s) • 1B Views/Day (~11,600/s avg, 35k peak)',
        derivation: '500M Daily Active Users. Peak view traffic hits 3x average QPS (~35,000 concurrent stream requests/second).',
      },
      {
        category: 'Ingress & Egress Bandwidth',
        metric: 'Ingress: 3.5 Gbps Peak • Egress: ~58 Gbps Avg (175 Gbps Peak)',
        derivation: 'Average video size 500MB raw. Egress calculated at 5 Mbps average stream bitrate. 95%+ of egress is offloaded by ISP Edge CDNs.',
      },
      {
        category: 'Storage Ingestion & Durability',
        metric: '~5 PB/Day Raw Video • ~15 PB/Day Multi-Bitrate • 11 9s Durability',
        derivation: '10M uploads * 500MB = 5 PB raw daily. 4 renditions add ~2x storage overhead. Master blobs stored in S3 with 99.999999999% durability.',
      },
      {
        category: 'Latency SLA & Availability',
        metric: '< 200ms TTFF Startup • 99.99% Availability (AP in CAP)',
        derivation: 'Availability over consistency: eventual consistency for view counts and catalog metadata is acceptable so long as playback never stalls.',
      },
    ],
    apiContracts: [
      {
        method: 'POST',
        endpoint: '/api/v1/videos/upload-session',
        purpose: 'Creator requests upload slot; API Gateway authenticates and issues S3 presigned multipart URLs',
        requestSample: '{ "title": "System Design Talk", "fileSizeBytes": 2147483648, "mimeType": "video/mp4" }',
        responseSample: '{ "videoId": "vid_9a8b7c", "uploadSessionId": "sess_123", "partSizeBytes": 10485760, "presignedUrls": ["https://s3.us-east-1.amazonaws.com/raw/part1?..."] }',
      },
      {
        method: 'PUT',
        endpoint: 'https://s3.us-east-1.amazonaws.com/raw/part?...',
        purpose: 'Direct-to-S3 client binary upload; completely offloads multi-gigabyte payload from internal API servers',
        requestSample: 'Binary raw chunk octet-stream (Part 1 of N)',
        responseSample: 'HTTP 200 OK (ETag: "d41d8cd98f00b204e9800998ecf8427e")',
      },
      {
        method: 'POST',
        endpoint: '/api/v1/videos/:videoId/complete-upload',
        purpose: 'Signals upload completion; commits S3 multipart upload and fires async transcoding job',
        requestSample: '{ "uploadSessionId": "sess_123", "parts": [{ "partNumber": 1, "etag": "abc..." }] }',
        responseSample: '{ "videoId": "vid_9a8b7c", "status": "PROCESSING", "etaSeconds": 180 }',
      },
      {
        method: 'GET',
        endpoint: '/api/v1/videos/:videoId/master.m3u8',
        purpose: 'Viewer requests HLS master playlist with variant bitrate stream definitions',
        responseSample: '#EXTM3U\\n#EXT-X-STREAM-INF:BANDWIDTH=4500000,RESOLUTION=1920x1080\\n1080p/playlist.m3u8\\n#EXT-X-STREAM-INF:BANDWIDTH=2200000,RESOLUTION=1280x720\\n720p/playlist.m3u8',
      },
    ],
    coreEntities: [
      {
        name: 'VideoMetadata',
        attributes: 'id (PK UUID), creator_id, title, status (UPLOADING|PROCESSING|READY|FAILED), duration_sec, raw_s3_uri, hls_manifest_uri, created_at',
        description: 'Primary relational catalog entity tracking video state and storage endpoints.',
      },
      {
        name: 'TranscodingJob',
        attributes: 'job_id (PK), video_id (FK), resolution (1080p|720p|480p), segment_index, status, worker_id, attempts',
        description: 'Tracks state of individual chunk tasks in the distributed FFmpeg DAG worker fleet.',
      },
    ],
    dataFlowPaths: {
      writePath: {
        title: 'Video Ingestion & Transcoding Pipeline (Write Path)',
        steps: [
          '1. Creator requests upload session from API Gateway; Gateway validates auth and generates S3 Presigned URLs.',
          '2. Creator streams raw video chunks directly into S3 Raw Master Bucket (bypassing backend servers to prevent thread exhaustion).',
          '3. S3 fires ObjectCreated event notification into Kafka / SQS Transcoding Queue.',
          '4. Distributed Transcoder Fleet (DAG workers with FFmpeg) splits video into 10s GOP-aligned chunks, encodes 1080p/720p/480p variants in parallel, and writes .m3u8 manifest to Output S3 Bucket.',
          '5. Transcoding coordinator marks VideoMetadata status = READY and publishes catalog event.',
        ],
      },
      readPath: {
        title: 'Global Video Streaming & Playback (Read Path)',
        steps: [
          '1. Viewer video player requests video metadata and master HLS manifest (.m3u8) from API Gateway / Redis cache.',
          '2. Player parses available bitrates and requests first 10-second video segments (.ts / .m4s) from nearest Anycast Edge CDN.',
          '3. Edge CDN serves cached segment (<20ms). On cache miss (rare long-tail videos), CDN fetches segment from Output S3 Bucket.',
          '4. Player runs Adaptive Bitrate (ABR) algorithm, dynamically requesting higher or lower resolution chunks based on network telemetry.',
        ],
      },
    },
    interviewerTraps: [
      {
        trapTitle: 'The API Server Upload Trap: "Why not stream the video directly through your application servers to S3?"',
        juniorAnswer: 'The client sends a standard multipart/form-data POST request to our Spring Boot or Node.js web server, which buffers it and uploads it to S3.',
        staffRebuttal: 'Multi-gigabyte video files will exhaust application server heap memory, saturate network NICs, and tie up worker threads for minutes, causing cascading HTTP 504 gateway timeouts. The Staff solution is Presigned S3 Multipart URLs: clients upload raw bytes directly to Object Storage, while application servers only handle tiny JSON metadata payloads.',
      },
      {
        trapTitle: 'The Monolithic Transcoder Trap: "How do you transcode a 2-hour 4K video without making the creator wait for hours?"',
        juniorAnswer: 'Spin up a massive 128-core EC2 instance and run `ffmpeg -i input.mp4 output.mp4` on the full file.',
        staffRebuttal: 'Monolithic transcoding takes hours and fails completely if the machine crashes at 99%. A Staff engineer builds a chunked DAG pipeline: split the raw master into 5-10 second GOP-aligned segments, dispatch parallel transcoding tasks across 100+ spot worker nodes via Kafka/SQS, and reassemble the playlist. A 2-hour video finishes in ~3 minutes.',
      },
      {
        trapTitle: 'The Storage Economics Trap: "How do you handle storage costs for petabytes of cold long-tail videos that nobody watches?"',
        juniorAnswer: 'Store all transcoded resolutions in standard cloud object storage indefinitely.',
        staffRebuttal: 'Video streaming follows a steep Pareto distribution (95% of views come from top 1% of videos). Hot videos are cached at ISP CDN edges and stored in S3 Standard. Videos with <1 view per week transition via S3 Lifecycle Rules to S3 Glacier Instant Retrieval, reducing storage costs by ~80% while retaining millisecond retrieval times.',
      },
    ],
    playbookSteps: [
      {
        step: 'Step 1',
        phase: 'Clarify & Scope',
        title: 'Agree on Core Capabilities & Capacity Math',
        guidance: 'Anchor the interview on In-Scope features (resumable upload, ABR streaming, async transcoding) and immediately scope out recommendations/comments. Calculate back-of-the-envelope numbers (10M uploads/day, 1B views/day, 58 Gbps egress).',
      },
      {
        step: 'Step 2',
        phase: 'API & Data Model',
        title: 'Define Explicit Endpoint Contracts Before Drawing Boxes',
        guidance: 'Define POST /upload-session (presigned URL issuance), direct PUT to S3, and GET /master.m3u8 for playback. Specify Video and TranscodingJob schemas.',
      },
      {
        step: 'Step 3',
        phase: 'Architecture Split',
        title: 'Bifurcate Write/Ingestion from Read/Playback Pipelines',
        guidance: 'Draw the Write Path (Client -> S3 Presigned -> Kafka -> FFmpeg DAG -> S3 Output) completely separately from the Read Path (Viewer -> Anycast CDN -> S3). Highlight that they share zero synchronous dependencies.',
      },
      {
        step: 'Step 4',
        phase: 'Deep Dives & Traps',
        title: 'Demonstrate Staff-Level Nuance on Failure Modes',
        guidance: 'Explain resumable multipart chunking, spot worker retry idempotency, CDN request collapsing for newly viral videos, and tiered storage FinOps optimization.',
      },
    ],
  },

  // 2. YouTube Top-K Trending Videos (HelloInterview)
  youtube_top_k: {
    inScope: [
      {
        id: 'FR1',
        title: 'Real-Time Ingestion of High-Velocity View Heartbeats',
        detail: 'Ingest massive streams of view event telemetry (200,000+ heartbeats/sec) from global video players without packet loss or broker backpressure.',
      },
      {
        id: 'FR2',
        title: 'Bounded Sub-Second Querying of Top 100 Trending Videos',
        detail: 'Return ranked Top K (K=100) trending video IDs for 1-hour and 24-hour tumbling/sliding windows in <5ms for homepage feeds.',
      },
      {
        id: 'FR3',
        title: 'Probabilistic Heavy Hitter Tracking with O(1) Memory',
        detail: 'Aggregate event counts in real-time stream processors using Count-Min Sketch and local Min-Heaps without exceeding bounded RAM.',
      },
    ],
    outOfScope: [
      'Personalized per-user recommendations and collaborative filtering',
      'Geographic or language-specific localized trending leaderboards',
      'Anti-fraud bot detection and view falsification forensics (handled in separate offline audit DAG)',
    ],
    capacityEstimations: [
      {
        category: 'Ingestion Throughput',
        metric: '200,000 View Events/Sec Avg • 500,000 Peak/Sec',
        derivation: '10B daily video views generate ~20B telemetry heartbeats (start + completion). Peak events hit 2.5x average.',
      },
      {
        category: 'Storage & Memory Bound',
        metric: '< 50 MB RAM for Count-Min Sketch & Min-Heaps',
        derivation: 'Count-Min Sketch (width=10,000, depth=5) requires < 200 KB per worker. Min-Heap of 100 elements takes < 10 KB.',
      },
      {
        category: 'Query Latency & Freshness',
        metric: '< 5ms Homepage Read • < 60s Trending Refresh Window',
        derivation: 'YouTube homepage rail reads directly from Redis Sorted Set (ZSET). Stream workers flush updated Top K every 60 seconds.',
      },
      {
        category: 'FinOps Budget Target',
        metric: '<= $2,200/mo (Simulation Target)',
        derivation: 'Stream processing nodes scale horizontally with partition count; Redis cluster sized for RAM working set.',
      },
    ],
    apiContracts: [
      {
        method: 'POST',
        endpoint: '/api/v1/telemetry/view-heartbeat',
        purpose: 'Video player emits playback progress ping into high-throughput ingestion queue',
        requestSample: '{ "videoId": "vid_xyz123", "userId": "u_987", "watchDurationSec": 30 }',
        responseSample: 'HTTP 202 Accepted',
      },
      {
        method: 'GET',
        endpoint: '/api/v1/trending?window=1h&limit=100',
        purpose: 'Homepage service retrieves cached global trending video IDs',
        responseSample: '{ "window": "1h", "updatedAt": "2026-10-29T00:00:00Z", "videos": [{ "rank": 1, "videoId": "vid_xyz123", "estimatedViews": 1420500 }] }',
      },
    ],
    coreEntities: [
      {
        name: 'ViewEvent',
        attributes: 'video_id, user_id, timestamp, duration_sec, client_ip',
        description: 'Ephemeral telemetry payload pushed onto Kafka partitions hashed by video_id.',
      },
      {
        name: 'TrendingLeaderboard',
        attributes: 'window_id, video_id, score, rank, calculated_at',
        description: 'Materialized top-K rankings in Redis Sorted Sets (ZREVRANGEBYSCORE).',
      },
    ],
    dataFlowPaths: {
      writePath: {
        title: 'Telemetry Ingestion & Stream Processing Pipeline',
        steps: [
          '1. Video players emit lightweight view heartbeats to API Gateways.',
          '2. Gateway writes raw events directly to Kafka partitions (partition key = video_id to preserve affinity).',
          '3. Apache Flink stream workers consume partitions, maintaining Count-Min Sketches for frequency approximation across 60s windows.',
          '4. Each stream worker tracks a local bounded Min-Heap of size K=100.',
          '5. Global aggregation reducer merges worker heaps every 60s and flushes top 100 items into Redis ZSET with TTL.',
        ],
      },
      readPath: {
        title: 'Trending Video Serving Path',
        steps: [
          '1. YouTube Homepage Service queries Redis cluster via ZREVRANGEBYSCORE key 0 99 in <2ms.',
          '2. Video metadata (title, thumbnails) hydrated from Redis cache or Read-Replica DB in a single batch MGET.',
          '3. Rendered trending carousel delivered to millions of concurrent viewers without touching Kafka or OLAP stores.',
        ],
      },
    },
    interviewerTraps: [
      {
        trapTitle: 'The SQL Group By Trap: "Can we store view events in Postgres/Cassandra and run GROUP BY video_id?"',
        juniorAnswer: 'Insert each view into a relational database or Cassandra, then run an hourly query with COUNT(*) GROUP BY video_id ORDER BY count DESC LIMIT 100.',
        staffRebuttal: 'Running GROUP BY on 20 billion rows locks tables, burns terabytes of disk I/O, and takes hours to complete. A Staff engineer uses stream approximation: Count-Min Sketch provides mathematically bounded error with O(1) time and space complexity, allowing real-time top-K computation in RAM.',
      },
      {
        trapTitle: 'The Centralized Reducer Bottleneck Trap: "Why not send all raw events to a single coordinator node?"',
        juniorAnswer: 'Route all Kafka messages into one large server that increments a global HashMap.',
        staffRebuttal: 'A single node cannot handle 500k writes/sec due to network socket exhaustion and memory contention. We use Two-Stage Aggregation: partition Kafka by video_id, let 20 parallel Flink workers compute local Top K heaps, and have the coordinator merge only 20 * 100 = 2,000 summary items every minute.',
      },
    ],
    playbookSteps: [
      {
        step: 'Step 1',
        phase: 'Clarify & Scope',
        title: 'Define Window Semantics & Accuracy Trade-Offs',
        guidance: 'Ask whether Top K is tumbling (fixed 1-hour blocks) or sliding (continuous rolling window). Clarify that 99.9% probabilistic accuracy for heavy hitters is acceptable (exact counting at 10B scale is physically impossible in real time).',
      },
      {
        step: 'Step 2',
        phase: 'API & Data Model',
        title: 'Define Telemetry Emission & Trending Retrieval Contracts',
        guidance: 'Specify POST /telemetry (HTTP 202 Accepted) and GET /trending (cached Redis response).',
      },
      {
        step: 'Step 3',
        phase: 'Architecture Split',
        title: 'Decouple Stream Processing from Serving',
        guidance: 'Telemetry ingestion goes to Kafka -> Flink -> Min-Heap -> Redis. Homepage reads only from Redis, completely isolating ingestion load from query spikes.',
      },
      {
        step: 'Step 4',
        phase: 'Deep Dives & Traps',
        title: 'Explain Count-Min Sketch & Two-Stage Aggregation',
        guidance: 'Detail how hash functions map video IDs to a 2D bit array to prevent memory explosion, and how local worker heaps eliminate central coordinator bottlenecks.',
      },
    ],
  },

  // 3. Bitly / URL Shortener (HelloInterview)
  bitly_url_shortener: {
    inScope: [
      {
        id: 'FR1',
        title: 'Collision-Free URL Shortening (Base62 Encoding)',
        detail: 'Convert long destination URLs into compact 7-character alphanumeric aliases (e.g. bit.ly/xyz789) supporting up to 3.5 trillion unique combinations.',
      },
      {
        id: 'FR2',
        title: 'Sub-10ms High-Throughput Redirection (301 vs 302)',
        detail: 'Redirect incoming short URLs to destination targets with <10ms latency using Edge CDN and Redis caching, supporting 100:1 read/write ratios.',
      },
      {
        id: 'FR3',
        title: 'Distributed Pre-Allocated Unique ID Generation (KGS / Snowflake)',
        detail: 'Pre-allocate monotonically increasing 64-bit integer ID ranges in memory to prevent database auto-increment lock contention and collision retries.',
      },
    ],
    outOfScope: [
      'Deep real-time clickstream analytics and geographic user demographic dashboards (handled via async Kafka pipeline)',
      'Custom vanity alias bidding and domain registration marketplace',
      'Real-time phishing, malware, and malicious link URL scanning (handled out-of-band by asynchronous safety workers)',
    ],
    capacityEstimations: [
      {
        category: 'Read / Write Ratio & QPS',
        metric: '100:1 Read/Write • 50,000 Read QPS • ~40 Write QPS',
        derivation: '100M URLs created/month (~40 writes/s). 10B redirects/month (~3,850 reads/s avg, 50,000 peak read QPS).',
      },
      {
        category: 'Storage Capacity (5 Years)',
        metric: '~3 TB Total Storage over 5 Years',
        derivation: '100M * 12 * 5 = 6B records. 500 bytes per record (ID, short_code, long_url, user_id, created_at) = ~3 TB.',
      },
      {
        category: 'Cache Memory Footprint (80/20 Rule)',
        metric: '~100 GB Redis RAM for Hot 20% URLs',
        derivation: '20% of daily redirects (2B * 20% = 400M URLs). 400M * 250 bytes = ~100 GB memory working set.',
      },
      {
        category: 'Latency & FinOps Target',
        metric: '< 10ms Redirect P99 • Budget <= $1,500/mo',
        derivation: 'Serve 80%+ redirects directly from Edge CDN / Redis RAM before hitting persistent databases.',
      },
    ],
    apiContracts: [
      {
        method: 'POST',
        endpoint: '/api/v1/shorten',
        purpose: 'Create shortened URL alias with optional expiration',
        requestSample: '{ "longUrl": "https://example.com/very/long/article?ref=social", "customAlias": null }',
        responseSample: '{ "shortCode": "xyz789", "shortUrl": "https://bit.ly/xyz789", "expiresAt": "2030-01-01T00:00:00Z" }',
      },
      {
        method: 'GET',
        endpoint: '/:shortCode',
        purpose: 'Resolve short alias and redirect client to long destination URL',
        responseSample: 'HTTP 302 Found (Location: https://example.com/very/long/article?ref=social)',
      },
    ],
    coreEntities: [
      {
        name: 'UrlMapping',
        attributes: 'short_code (PK VARCHAR(7)), original_url (VARCHAR(2048)), user_id (UUID), created_at (TIMESTAMP), expires_at (TIMESTAMP)',
        description: 'Primary URL key-value mapping indexed on short_code.',
      },
    ],
    dataFlowPaths: {
      writePath: {
        title: 'URL Creation Pipeline (Write Path)',
        steps: [
          '1. Client submits long URL to API Gateway.',
          '2. Shortener service obtains next unique 64-bit ID from Token Generation Service (KGS / Snowflake pre-allocated range).',
          '3. ID is encoded into 7-character Base62 string ([a-zA-Z0-9]).',
          '4. Record saved to persistent database (PostgreSQL / DynamoDB) and written to Redis cache.',
          '5. Short URL returned to client in <30ms.',
        ],
      },
      readPath: {
        title: 'URL Redirection Pipeline (Read Path)',
        steps: [
          '1. User clicks short link; request hits Cloudflare Anycast CDN edge.',
          '2. If cached at edge, CDN immediately returns HTTP 301/302 (<5ms).',
          '3. On edge miss, request forwards to API Gateway -> Redis Cache.',
          '4. On cache miss, fetch from DynamoDB / Postgres read replica and backfill Redis.',
          '5. Asynchronous click event published to Kafka for out-of-band analytics.',
        ],
      },
    },
    interviewerTraps: [
      {
        trapTitle: 'The 301 vs 302 Redirect Trap: "Should we return HTTP 301 or HTTP 302?"',
        juniorAnswer: 'Use HTTP 301 because it is permanent and faster.',
        staffRebuttal: 'HTTP 301 Moved Permanently is cached aggressively in the user browser, so subsequent clicks bypass our servers entirely. While this reduces server load, it completely breaks analytics tracking (we cannot count clicks or log referrers). A Staff engineer uses HTTP 302 Found for monetized/analytics URLs so every redirect passes through the gateway, or 301 with edge worker telemetry.',
      },
      {
        trapTitle: 'The MD5 / Hash Collision Trap: "Why not just take MD5(longUrl) and take the first 7 characters?"',
        juniorAnswer: 'Compute MD5 or SHA-256 of the URL and take substring(0, 7).',
        staffRebuttal: 'Taking a 7-character prefix from a 128-bit hash guarantees hash collisions at scale via the Birthday Paradox. Detecting and resolving collisions requires repeated database lookups and appending salts, causing unpredictable write latency spikes. The Staff solution is pre-generating unique 64-bit integer IDs via distributed Snowflake/KGS and encoding them directly with Base62 (zero collisions, O(1) determinism).',
      },
    ],
    playbookSteps: [
      {
        step: 'Step 1',
        phase: 'Clarify & Scope',
        title: 'Confirm Read/Write Ratio & Base62 Math',
        guidance: 'Calculate Base62 capacity: 62^7 = 3.52 trillion unique URLs, which comfortably covers 100M URLs/month for over 2,000 years. Explicitly agree on 100:1 read-to-write ratio.',
      },
      {
        step: 'Step 2',
        phase: 'API & Data Model',
        title: 'Define Shorten and Redirect Contracts',
        guidance: 'Define POST /api/v1/shorten and GET /:shortCode with 302 Found response. Outline the single core UrlMapping table.',
      },
      {
        step: 'Step 3',
        phase: 'Architecture Split',
        title: 'Separate High-Speed Read Path from Token Pre-Allocation',
        guidance: 'The read path relies on Edge CDN + Redis cache-aside. The write path uses a distributed ID generator (KGS) so writes never lock database tables.',
      },
      {
        step: 'Step 4',
        phase: 'Deep Dives & Traps',
        title: 'Address 301 vs 302, ID Collisions, and Cache Eviction',
        guidance: 'Explain LRU cache eviction in Redis, async click logging via Kafka, and why pre-allocated integer tokens beat MD5 hashing.',
      },
    ],
  },

  // 4. Uber Real-Time Geospatial Ride Dispatching (HelloInterview)
  uber_ride_matching: {
    inScope: [
      {
        id: 'FR1',
        title: 'High-Frequency Ingestion of Driver GPS Coordinates',
        detail: 'Ingest location pings from 5 million active drivers every 4 seconds over persistent bi-directional WebSocket connections.',
      },
      {
        id: 'FR2',
        title: 'Real-Time Spatial Proximity Search (<2km in <2s)',
        detail: 'Match rider pickup requests to the closest available drivers within a 2-3km radius in under 2 seconds based on ETAs.',
      },
      {
        id: 'FR3',
        title: 'In-Memory Geospatial Index Partitioning (Uber H3 / Google S2)',
        detail: 'Partition real-time driver coordinates into hexagonal spatial cells (H3 resolution 8/9) stored in distributed in-memory indexes.',
      },
    ],
    outOfScope: [
      'Turn-by-turn turn navigational routing and road-network graph traversal',
      'Dynamic surge pricing multiplier calculation algorithms (handled in separate streaming pipeline)',
      'Payment processing, credit card settlement, and driver payout banking',
    ],
    capacityEstimations: [
      {
        category: 'Location Ping Ingestion QPS',
        metric: '1,250,000 GPS Pings/Sec',
        derivation: '5M active drivers emit 1 ping every 4 seconds -> 5,000,000 / 4 = 1.25M updates/second.',
      },
      {
        category: 'Ride Match Request QPS',
        metric: '~170 Ride Requests/Sec (10k/min)',
        derivation: '10,000 ride requests per minute globally during peak operating hours.',
      },
      {
        category: 'Latency & Freshness SLA',
        metric: '< 20ms Location Query • < 2s End-to-End Match',
        derivation: 'Driver locations must be fresh within 4 seconds; spatial candidate retrieval completes in milliseconds.',
      },
      {
        category: 'FinOps Budget Target',
        metric: '<= $2,400/mo (Simulation Target)',
        derivation: 'In-memory geospatial cluster partitioned across Redis / memory nodes with H3 sharding.',
      },
    ],
    apiContracts: [
      {
        method: 'WS',
        endpoint: '/ws/v1/driver/telemetry',
        purpose: 'Bi-directional persistent connection streaming continuous driver location pings',
        requestSample: '{ "driverId": "drv_123", "lat": 37.7749, "lng": -122.4194, "bearing": 180, "status": "AVAILABLE" }',
        responseSample: '{ "ack": true, "timestamp": 1729000000 }',
      },
      {
        method: 'POST',
        endpoint: '/api/v1/rides/request',
        purpose: 'Rider initiates pickup match request with origin and destination',
        requestSample: '{ "riderId": "usr_456", "pickupLat": 37.7749, "pickupLng": -122.4194, "dropoffLat": 37.7891, "dropoffLng": -122.4014 }',
        responseSample: '{ "tripId": "trp_789", "status": "MATCHING", "candidateDriverCount": 8 }',
      },
    ],
    coreEntities: [
      {
        name: 'DriverLocation',
        attributes: 'driver_id (PK), h3_cell_id, lat, lng, status (AVAILABLE|BUSY|OFFLINE), updated_at',
        description: 'Ephemeral in-memory record indexed by hexagonal H3 spatial cell.',
      },
      {
        name: 'Trip',
        attributes: 'trip_id (PK UUID), rider_id, driver_id, status (REQUESTED|ACCEPTED|IN_TRANSIT|COMPLETED), pickup_geo, dropoff_geo',
        description: 'Persistent transactional entity tracking lifecycle of a ride.',
      },
    ],
    dataFlowPaths: {
      writePath: {
        title: 'Driver Location Ingestion Pipeline',
        steps: [
          '1. Driver mobile client streams GPS pings every 4s to WebSocket Gateway fleet.',
          '2. Gateway calculates H3 hexagonal cell index from latitude/longitude.',
          '3. Updates in-memory Geospatial Index (Redis GEO / custom H3 index) with 10s TTL.',
          '4. If driver location changed across city boundaries, update partition mapping in ZooKeeper/Consul.',
        ],
      },
      readPath: {
        title: 'Ride Dispatch & Matching Pipeline',
        steps: [
          '1. Rider taps "Request Ride"; API Gateway sends coordinates to Dispatch Matching Service.',
          '2. Dispatch service calculates rider H3 cell index and fetches all AVAILABLE drivers in current + 6 neighboring cells from RAM (<10ms).',
          '3. Candidate drivers ranked by estimated pickup time (ETA) using routing distance service.',
          '4. Dispatch push notification sent to top-ranked driver via WebSocket with 15-second acceptance timer.',
        ],
      },
    },
    interviewerTraps: [
      {
        trapTitle: 'The Relational Spatial Database Trap: "Can we store driver coordinates in PostgreSQL PostGIS?"',
        juniorAnswer: 'Store coordinates in Postgres with PostGIS extension and query using `ST_DWithin(geom, ST_MakePoint(lat, lng), 2000)`.',
        staffRebuttal: '1.25 million writes per second will destroy PostgreSQL Write-Ahead Logs (WAL) and exhaust disk I/O within seconds. Driver coordinates are ephemeral state that only matters for the current 4 seconds. The Staff solution stores locations entirely in RAM partitioned by Uber H3 hexagonal cells (or Google S2), bypassing disk persistence completely.',
      },
      {
        trapTitle: 'The Driver Double-Dispatch Race Condition: "What if two riders match the same driver simultaneously?"',
        juniorAnswer: 'Query the database for the first driver with status AVAILABLE and send the ride to both.',
        staffRebuttal: 'Under high concurrency, multiple dispatch threads will select the same driver, creating double-dispatch chaos. A Staff engineer uses an atomic Distributed Lock or Redis Lua script with a state machine: transition driver state from AVAILABLE -> PROPOSED with a 15-second lease. If the driver declines or times out, state automatically reverts to AVAILABLE.',
      },
    ],
    playbookSteps: [
      {
        step: 'Step 1',
        phase: 'Clarify & Scope',
        title: 'Clarify Location Ping Math & Concurrency',
        guidance: 'Calculate 5M drivers / 4s = 1.25M updates/sec. Emphasize that driver coordinates are ephemeral in-memory data, NOT persistent relational data.',
      },
      {
        step: 'Step 2',
        phase: 'API & Data Model',
        title: 'Define WebSocket Ingestion & REST Dispatch Contracts',
        guidance: 'Define the WebSocket ping contract and the POST /rides/request contract. Highlight H3 cell IDs as the core spatial indexing primitive.',
      },
      {
        step: 'Step 3',
        phase: 'Architecture Split',
        title: 'Separate Location Ingestion from Match Dispatching',
        guidance: 'WebSocket Gateway fleet feeds an in-memory spatial index cluster (Redis/H3). Dispatch service queries the index and triggers push alerts to drivers.',
      },
      {
        step: 'Step 4',
        phase: 'Deep Dives & Traps',
        title: 'Address Hexagonal H3 Spatial Partitioning and Race Conditions',
        guidance: 'Explain why hexagonal cells (H3) have uniform neighbor distances unlike square grids, and how atomic locks prevent double-dispatching.',
      },
    ],
  },

  // 5. Stripe Payment Processing Gateway & Ledger (HelloInterview)
  stripe_payments: {
    inScope: [
      {
        id: 'FR1',
        title: 'Guaranteed Idempotent Payment Authorization',
        detail: 'Accept payment charges with unique client idempotency keys, guaranteeing zero double-charges on network retries or client timeouts.',
      },
      {
        id: 'FR2',
        title: 'Fault-Tolerant Distributed Transaction Orchestration (Saga)',
        detail: 'Coordinate multi-step fund movements across user balances, acquiring banks, and card networks with automated compensating transactions on failure.',
      },
      {
        id: 'FR3',
        title: 'Immutable Cryptographic Double-Entry Financial Ledger',
        detail: 'Record every financial mutation as debit/credit entries in an append-only ledger ensuring total balance zero-sum integrity.',
      },
    ],
    outOfScope: [
      'Multi-currency foreign exchange (FX) market trading and currency forward hedging',
      'Merchant chargeback disputes and evidence document submission arbitration',
      'Automated merchant corporate tax filing and VAT jurisdiction calculation',
    ],
    capacityEstimations: [
      {
        category: 'Throughput & Reliability',
        metric: '10,000 Transactions/Sec • 99.999% Reliability (Strict CP)',
        derivation: 'Fintech systems prioritize strict consistency (ACID) over availability. Zero data loss or balance discrepancy tolerated.',
      },
      {
        category: 'Latency & Idempotency SLA',
        metric: '< 200ms Authorization P99 • 24-Hour Idempotency Retention',
        derivation: 'Idempotency keys cached in Redis cluster with DB backup for 24-72 hours.',
      },
      {
        category: 'Ledger Auditability',
        metric: '100% Append-Only Immutable Ledger • SHA-256 Hash Chaining',
        derivation: 'Financial regulations require immutable audit trails. Updates or deletes on ledger entries are physically disallowed.',
      },
      {
        category: 'FinOps Budget Target',
        metric: '<= $2,600/mo (Simulation Target)',
        derivation: 'High-availability multi-region active-passive relational cluster with synchronous replication.',
      },
    ],
    apiContracts: [
      {
        method: 'POST',
        endpoint: '/v1/charges',
        purpose: 'Process a card payment with mandatory Idempotency-Key header',
        requestSample: 'Header: Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d\\nBody: { "amount": 5000, "currency": "usd", "source": "tok_visa", "customerId": "cus_123" }',
        responseSample: '{ "chargeId": "ch_789", "status": "SUCCEEDED", "amount": 5000, "balanceTransaction": "txn_001" }',
      },
    ],
    coreEntities: [
      {
        name: 'IdempotencyRecord',
        attributes: 'idempotency_key (PK), customer_id, status (IN_PROGRESS|COMPLETED), response_payload, created_at',
        description: 'Guarantees deduplication before calling external banking networks.',
      },
      {
        name: 'LedgerEntry',
        attributes: 'entry_id (PK UUID), transaction_id, account_id, type (DEBIT|CREDIT), amount_cents, currency, created_at',
        description: 'Immutable double-entry book balancing debits and credits.',
      },
    ],
    dataFlowPaths: {
      writePath: {
        title: 'Idempotent Payment & Ledger Pipeline',
        steps: [
          '1. API Gateway validates Idempotency-Key; checks Redis lock. If key is IN_PROGRESS, reject with HTTP 409 Conflict.',
          '2. If COMPLETED, return cached response payload immediately (zero bank calls).',
          '3. If new key, insert IdempotencyRecord with status IN_PROGRESS.',
          '4. Payment Service invokes Bank Acquiring Gateway / Card Network.',
          '5. On bank success, write atomic double-entry balance mutation to Ledger DB in a strict ACID transaction.',
          '6. Update IdempotencyRecord status = COMPLETED, release Redis lock, and return HTTP 200.',
        ],
      },
      readPath: {
        title: 'Merchant Balance & Settlement Read Path',
        steps: [
          '1. Merchant requests account balance via GET /v1/balance.',
          '2. API Gateway queries Read Replica DB with optimistic cache lookup in Redis.',
          '3. Reconciliation daemon runs continuously in background verifying that SUM(debits) - SUM(credits) == 0.',
        ],
      },
    },
    interviewerTraps: [
      {
        trapTitle: 'The Network Timeout Retrying Trap: "What happens if the client times out while waiting for Stripe to answer?"',
        juniorAnswer: 'The client retries sending the payment request again with a new random UUID.',
        staffRebuttal: 'If the client generates a new UUID, the merchant will double-charge the customer. A Staff engineer enforces client-side Idempotency Keys: the client keeps the SAME idempotency key across all retries. The backend detects the existing key: if the previous transaction succeeded, it returns the cached receipt immediately without touching the bank again.',
      },
      {
        trapTitle: 'The Single Balance Column Trap: "Why not update balance using `UPDATE accounts SET balance = balance + 50 WHERE id = 1`?"',
        juniorAnswer: 'Run an UPDATE query directly on the account table within a SQL transaction.',
        staffRebuttal: 'Directly updating a balance column creates race conditions under high concurrency and leaves zero financial audit trail (destroying forensic history). Staff engineers implement Double-Entry Bookkeeping: you NEVER update a balance column. Every transfer creates two immutable records (a DEBIT to account A and a CREDIT to account B). The balance is always the mathematical sum of all historical entries.',
      },
    ],
    playbookSteps: [
      {
        step: 'Step 1',
        phase: 'Clarify & Scope',
        title: 'Establish ACID Invariants & Idempotency Rules',
        guidance: 'State immediately that payments are a strict CP (Consistency over Availability) problem. Frame zero double-charge tolerance as the #1 physical invariant.',
      },
      {
        step: 'Step 2',
        phase: 'API & Data Model',
        title: 'Define Idempotency Header & Double-Entry Schema',
        guidance: 'Define POST /v1/charges with Idempotency-Key. Model LedgerEntry with explicit DEBIT and CREDIT rows.',
      },
      {
        step: 'Step 3',
        phase: 'Architecture Split',
        title: 'Design Ingestion Guard, Saga Coordinator & Ledger DB',
        guidance: 'Show the Idempotency Gatekeeper before the Payment Gateway, and the Saga Orchestrator handling bank timeouts and compensations.',
      },
      {
        step: 'Step 4',
        phase: 'Deep Dives & Traps',
        title: 'Explain Bank Timeout Recovery & Ledger Reconciliation',
        guidance: 'Detail how background reconciliation daemons run hash verification to ensure zero discrepancy between internal ledgers and external bank statements.',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL DOMAIN SYNTHESIZER
// Generates HelloInterview-grade specs for all other 90+ scenarios
// ─────────────────────────────────────────────────────────────────────────────

function synthesizeDomainSpec(scenario: PuzzleScenario, targetBudget: number): HelloInterviewSpec {
  const map = new Map(scenario.availableNodes.map((n) => [n.id, n]));
  const orderedNodes = scenario.correctSequence.map(
    (id) => map.get(id) || { id, name: id, icon: '⚙️', role: 'Core infrastructure stage' }
  );

  const firstNode = orderedNodes[0];
  const secondNode = orderedNodes[1] || orderedNodes[0];
  const middleNode = orderedNodes[Math.floor(orderedNodes.length / 2)] || orderedNodes[1];
  const lastNode = orderedNodes[orderedNodes.length - 1];

  const isFintech = scenario.category === 'fintech';
  const isRealtime = scenario.category === 'real_time';
  const isDistributed = scenario.category === 'distributed';

  const inScope: HelloInterviewFR[] = [
    {
      id: 'FR1',
      title: `Reliable Ingestion & Request Origination via ${firstNode.name}`,
      detail: `Accept and validate incoming high-throughput payloads from ${firstNode.icon} ${firstNode.name} (${firstNode.role}) without packet loss or unhandled boundary exceptions.`,
    },
    {
      id: 'FR2',
      title: `Low-Latency Routing & Perimeter Protection via ${secondNode.name}`,
      detail: `Protect downstream microservices by terminating TLS, enforcing rate limits, and caching hot responses at ${secondNode.icon} ${secondNode.name} (${secondNode.role}).`,
    },
    {
      id: 'FR3',
      title: `Decoupled Core Processing & Durable State via ${lastNode.name}`,
      detail: `Execute core business logic across ${middleNode.name} and persist finalized mutations to ${lastNode.icon} ${lastNode.name} (${lastNode.role}) with strict consistency guarantees.`,
    },
  ];

  const outOfScope = [
    'Complex offline machine learning model retraining and automated hyperparameter tuning',
    'Historical cross-region active-active disaster recovery failover automation',
    'Third-party partner analytics exports and batch data warehousing ETL pipelines',
  ];

  const capacityEstimations: HelloInterviewCapacityEstimate[] = [
    {
      category: 'Scale & Peak Throughput Target',
      metric: `${scenario.qps} (${scenario.scaleMetric})`,
      derivation: `System dimensioned to sustain 3.5x burst over average baseline traffic without connection pool exhaustion or cascading timeouts.`,
    },
    {
      category: 'Latency SLA & Availability',
      metric: isRealtime ? '< 20ms P99 • Sub-Second Streams' : isFintech ? '< 100ms P99 • Strict ACID (CP)' : '< 50ms P99 • 99.99% Uptime',
      derivation: isFintech
        ? 'Consistency over availability: zero balance or transaction discrepancies tolerated.'
        : 'Availability over consistency: hot reads served from RAM / Edge caches before disk.',
    },
    {
      category: 'Storage & Durability Constraints',
      metric: isDistributed ? 'Quorum Partitioning • 11 9s Durability' : 'Tiered Storage (RAM Cache -> Persistent DB)',
      derivation: 'Hot data retained in RAM with TTL; historical events safely tiered to durable append-only storage.',
    },
    {
      category: 'FinOps Monthly Budget Guardrail',
      metric: `<= $${targetBudget.toLocaleString()}/mo Target`,
      derivation: 'Keep total scaled node replicas under budget limit to achieve maximum 3 Architect Stars (⭐⭐⭐).',
    },
  ];

  const apiContracts: HelloInterviewApiContract[] = [
    {
      method: 'POST',
      endpoint: `/api/v1/${scenario.id.replace(/_/g, '-')}/submit`,
      purpose: `Primary write endpoint originating actions from ${firstNode.name}`,
      requestSample: `{ "payload": "sample_data", "timestamp": 1729000000, "clientToken": "tok_xyz" }`,
      responseSample: `{ "status": "ACCEPTED", "requestId": "req_12345" }`,
    },
    {
      method: 'GET',
      endpoint: `/api/v1/${scenario.id.replace(/_/g, '-')}/query`,
      purpose: `Primary read endpoint retrieving processed state from ${lastNode.name}`,
      responseSample: `{ "data": [{ "id": "res_1", "state": "COMPLETED" }], "cached": true }`,
    },
  ];

  const coreEntities: HelloInterviewCoreEntity[] = [
    {
      name: `${scenario.id.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Event`,
      attributes: 'id (PK UUID), source_id, payload_json, status, created_at',
      description: `Primary transactional domain entity tracked through ${middleNode.name}.`,
    },
  ];

  const dataFlowPaths: HelloInterviewDataPaths = {
    writePath: {
      title: `${scenario.title} — Ingestion & Processing Pipeline (Write Path)`,
      steps: [
        `1. Request originates at ${firstNode.icon} ${firstNode.name}.`,
        `2. Validated and rate-limited at ${secondNode.icon} ${secondNode.name}.`,
        `3. Processed by domain logic at ${middleNode.icon} ${middleNode.name}.`,
        `4. Persisted durably to ${lastNode.icon} ${lastNode.name}.`,
      ],
    },
    readPath: {
      title: `${scenario.title} — Query & Serving Pipeline (Read Path)`,
      steps: [
        `1. Client initiates query request to perimeter gateway.`,
        `2. Cache hit returns hot state directly from RAM / Edge before hitting datastores.`,
        `3. On cache miss, read replica serves request and backfills cache.`,
      ],
    },
  };

  const interviewerTraps: HelloInterviewInterviewerTrap[] = [
    {
      trapTitle: `The Scalability Bottleneck Trap: "What breaks first when traffic spikes 10x on ${middleNode.name}?"`,
      juniorAnswer: 'Increase CPU and RAM on the single host machine vertically.',
      staffRebuttal: `Vertical scaling hits hardware limits quickly and introduces a Single Point of Failure (SPOF). A Staff engineer decouples ingress from processing using an asynchronous message queue (Kafka / SQS) with horizontal autoscaling worker pools, preventing cascading backend crashes.`,
    },
    {
      trapTitle: `The Cache Stampede Trap: "What happens when hot cache keys expire simultaneously?"`,
      juniorAnswer: 'Let the next incoming requests query the database and repopulate cache.',
      staffRebuttal: `Thousands of concurrent requests will hit the database at once, causing connection exhaustion and database downtime. A Staff engineer uses Mutual Exclusion (Mutex Locks) or Probabilistic Early Expiration (XFetch) so only ONE thread refreshes cache while others are served stale data.`,
    },
  ];

  const playbookSteps: HelloInterviewPlaybookStep[] = [
    {
      step: 'Step 1',
      phase: 'Clarify & Scope',
      title: 'Anchor on Core Functional Scope & Numbers',
      guidance: `Agree on the top 2-3 capabilities, state explicit out-of-scope boundaries, and perform capacity calculations (${scenario.qps}, ${scenario.scaleMetric}).`,
    },
    {
      step: 'Step 2',
      phase: 'API & Data Model',
      title: 'Define Contracts Before Designing Topology',
      guidance: `Define request/response contracts for write and read flows and identify primary entities before placing infrastructure components.`,
    },
    {
      step: 'Step 3',
      phase: 'Architecture Split',
      title: 'Separate High-Speed Reads from Asynchronous Writes',
      guidance: `Draw the write/ingestion path independently from the read/serving path to isolate failure domains.`,
    },
    {
      step: 'Step 4',
      phase: 'Deep Dives & Traps',
      title: 'Address Failure Modes & Edge Cases Proactively',
      guidance: `Demonstrate mastery of cache stampedes, hot partition keys, split-brain consensus, and finops cost tiering.`,
    },
  ];

  return {
    inScope,
    outOfScope,
    capacityEstimations,
    apiContracts,
    coreEntities,
    dataFlowPaths,
    interviewerTraps,
    playbookSteps,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER BUILDER: BUILD DETAILED SCENARIO REQUIREMENTS
// ─────────────────────────────────────────────────────────────────────────────

export function buildScenarioRequirements(
  scenario: PuzzleScenario,
  targetBudget = 1800
): ScenarioRequirementsSpec {
  const map = new Map(scenario.availableNodes.map((n) => [n.id, n]));
  const orderedNodes = scenario.correctSequence.map(
    (id) => map.get(id) || { id, name: id, icon: '⚙️', role: 'Core processing stage' }
  );

  const firstNode = orderedNodes[0];
  const secondNode = orderedNodes[1] || orderedNodes[0];
  const lastNode = orderedNodes[orderedNodes.length - 1];

  // Retrieve Flagship Spec or Synthesize Domain Spec
  const helloInterview = HELLO_INTERVIEW_CATALOG[scenario.id] || synthesizeDomainSpec(scenario, targetBudget);

  // Exact 4 Functional Requirements for backward compatibility and test suites
  const functionalRequirements: string[] = [
    `FR1 (In-Scope — Ingestion/Write): ${helloInterview.inScope[0]?.title || 'Ingest incoming requests'} — ${helloInterview.inScope[0]?.detail || firstNode.role}`,
    `FR2 (In-Scope — Read/Serving): ${helloInterview.inScope[1]?.title || 'Serve client requests'} — ${helloInterview.inScope[1]?.detail || secondNode.role}`,
    `FR3 (In-Scope — State/Async Engine): ${helloInterview.inScope[2]?.title || 'Process state & persist'} — ${helloInterview.inScope[2]?.detail || lastNode.role}`,
    `FR4 (Below-the-Line — Explicitly Out of Scope): ${helloInterview.outOfScope.join('; ')}`,
  ];

  // Exact 4 Non-Functional Requirements for backward compatibility and test suites
  const nonFunctionalRequirements = [
    {
      label: 'Scale & Peak Throughput',
      metric: helloInterview.capacityEstimations[0]?.metric || `${scenario.qps} (${scenario.scaleMetric})`,
      detail: helloInterview.capacityEstimations[0]?.derivation || 'Sustain peak burst without connection starvation.',
    },
    {
      label: 'Latency SLA & Availability',
      metric: helloInterview.capacityEstimations[1]?.metric || '< 20ms p99 • >= 99.99% Uptime',
      detail: helloInterview.capacityEstimations[1]?.derivation || 'Serve hot lookups from RAM/Edge before hitting disk.',
    },
    {
      label: 'Durability, Storage & Bandwidth',
      metric: helloInterview.capacityEstimations[2]?.metric || '11 9s Durability • Tiered Storage',
      detail: helloInterview.capacityEstimations[2]?.derivation || 'Prevent data loss and partition hot-key bottlenecks.',
    },
    {
      label: 'FinOps Budget & Cost Tiering',
      metric: helloInterview.capacityEstimations[3]?.metric || `<= $${targetBudget.toLocaleString()}/mo`,
      detail: helloInterview.capacityEstimations[3]?.derivation || 'Keep total scaled node replicas under budget limit.',
    },
  ];

  // Exact 3 What-To-Do-First action steps for backward compatibility and test suites
  const whatToDoFirst = [
    {
      step: 'Step 1 (Clarify & Ingress Entry)',
      title: `Scope Requirements & Place ${firstNode.name} Entrypoint`,
      instruction: `Begin the interview by clarifying In-Scope vs Out-of-Scope boundaries. Place ${firstNode.icon} ${firstNode.name} (${firstNode.role}) onto the whiteboard first to anchor the entry traffic path.`,
      targetNodeId: firstNode.id,
      targetNodeLabel: `${firstNode.icon} ${firstNode.name}`,
    },
    {
      step: 'Step 2 (Perimeter & Direct Storage)',
      title: `Wire First Ingress / Guard Layer at ${secondNode.name}`,
      instruction: `Connect Stage #1 to ${secondNode.icon} ${secondNode.name} (${secondNode.role}) to handle TLS termination, auth, and presigned/direct transfer tokens before internal microservices.`,
      targetNodeId: secondNode.id,
      targetNodeLabel: `${secondNode.icon} ${secondNode.name}`,
    },
    {
      step: 'Step 3 (Write/Read Split & Storage)',
      title: `Chain Processing Queues, Caches & Finish at ${lastNode.name}`,
      instruction: `Bifurcate the write and read paths: wire intermediate task queues/caches and terminate the pipeline at ${lastNode.icon} ${lastNode.name} (${lastNode.role}).`,
      targetNodeId: lastNode.id,
      targetNodeLabel: `${lastNode.icon} ${lastNode.name}`,
    },
  ];

  return {
    functionalRequirements,
    nonFunctionalRequirements,
    whatToDoFirst,
    helloInterview,
  };
}
