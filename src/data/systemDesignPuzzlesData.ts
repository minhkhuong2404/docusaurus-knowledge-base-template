// Generated System Design Scenarios (100 Scenarios) inspired by HelloInterview Problem Breakdowns
export interface PuzzleScenario {
  id: string;
  title: string;
  badge: string;
  category: 'big_tech' | 'fintech' | 'real_time' | 'distributed';
  categoryLabel: string;
  scaleMetric: string;
  qps: string;
  difficulty: 'Medium' | 'Hard' | 'Staff+';
  goal: string;
  availableNodes: { id: string; name: string; icon: string; role: string }[];
  correctSequence: string[];
  explanation: string;
  keyDesignTakeaways: string[];
}

export const SYSTEM_DESIGN_PUZZLES: PuzzleScenario[] = [
  {
    "id": "bitly_url_shortener",
    "title": "Design Bitly / URL Shortener",
    "badge": "\ud83d\udd17",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "100M URLs/Mo \u2022 10B Redirects/Mo",
    "qps": "50k Read QPS",
    "difficulty": "Medium",
    "goal": "Design a low-latency (<10ms) URL shortening & redirection service handling 100:1 read/write ratio with collision-free ID generation and asynchronous click analytics.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / App",
        "icon": "\ud83c\udf10",
        "role": "Sends GET /xyz789 or POST /shorten"
      },
      {
        "id": "cdn",
        "name": "Cloudflare Anycast CDN",
        "icon": "\u2601\ufe0f",
        "role": "Terminates TLS & caches 301/302 hot redirects at edge"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces Token Bucket IP limits & auth"
      },
      {
        "id": "short_service",
        "name": "URL Shortener Service",
        "icon": "\u2699\ufe0f",
        "role": "Encodes 64-bit IDs into Base62 strings (7 chars)"
      },
      {
        "id": "token_service",
        "name": "Distributed Token (KGS / Snowflake)",
        "icon": "\ud83d\udd22",
        "role": "Pre-allocates collision-free ID ranges in RAM"
      },
      {
        "id": "redis",
        "name": "Redis Hot Cache (LRU)",
        "icon": "\ud83d\udd34",
        "role": "Caches top 20% URLs for 80% read hits (<2ms)"
      },
      {
        "id": "nosql_db",
        "name": "NoSQL Key-Value (DynamoDB / Cassandra)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "O(1) point lookups by short_hash partition key"
      },
      {
        "id": "kafka",
        "name": "Kafka Topic (url.clicks)",
        "icon": "\u26a1",
        "role": "Asynchronous event stream for click ingestion"
      },
      {
        "id": "analytics_db",
        "name": "ClickHouse / OLAP Warehouse",
        "icon": "\ud83d\udcca",
        "role": "Real-time aggregated click analytics & geo reports"
      }
    ],
    "correctSequence": [
      "client",
      "cdn",
      "gateway",
      "short_service",
      "token_service",
      "redis",
      "nosql_db",
      "kafka",
      "analytics_db"
    ],
    "explanation": "1. Requests hit CDN for edge redirect cache. 2. Gateway applies rate limits. 3. Shortener Service fetches pre-allocated range from Token Service (KGS) to encode Base62 without collisions or DB locks. 4. Redis serves hot reads. 5. DynamoDB stores persistent mappings. 6. Click telemetry is pushed asynchronously to Kafka -> ClickHouse for real-time analytics without slowing down user redirects.",
    "keyDesignTakeaways": [
      "301 (Permanent) vs 302 (Temporary): 301 caches in client browser saving server load; 302 forces server hit every time for precise analytics tracking.",
      "Base62 encoding (62^7 = 3.5 trillion URLs) with a pre-allocated Key Generation Service (KGS) avoids hash collisions and distributed lock contention.",
      "Separating the read/write redirect path from the analytics ingestion pipeline via Kafka ensures <10ms redirect latency."
    ]
  },
  {
    "id": "netflix_streaming",
    "title": "Design Netflix / Video Streaming Pipeline",
    "badge": "\ud83c\udfac",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "250M Viewers \u2022 500h Uploads/Min",
    "qps": "1M Concurrent Streams",
    "difficulty": "Hard",
    "goal": "Build an end-to-end video ingestion, adaptive chunk transcoding (HLS/DASH), and globally distributed CDN delivery pipeline for seamless playback.",
    "availableNodes": [
      {
        "id": "creator",
        "name": "Creator Upload Client",
        "icon": "\ud83c\udfa5",
        "role": "Initiates chunked resumable multipart upload"
      },
      {
        "id": "upload_gw",
        "name": "Upload Edge Gateway",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Validates file headers & issues S3 presigned URLs"
      },
      {
        "id": "raw_storage",
        "name": "S3 Raw Master Bucket",
        "icon": "\ud83e\udea3",
        "role": "Stores uncompressed master 4K/ProRes video"
      },
      {
        "id": "transcode_queue",
        "name": "Transcoding Task Queue (Kafka / SQS)",
        "icon": "\ud83d\udcec",
        "role": "Splits video into 10s chunks across worker pool"
      },
      {
        "id": "transcode_fleet",
        "name": "Distributed Transcoder Fleet",
        "icon": "\u2699\ufe0f",
        "role": "Encodes 1080p/720p/480p + generates .m3u8 manifest"
      },
      {
        "id": "video_cdn",
        "name": "Global Video CDN (Open Connect Edge)",
        "icon": "\u2601\ufe0f",
        "role": "Caches .ts video segments within ISP networks"
      },
      {
        "id": "viewer",
        "name": "Viewer Player (Adaptive Bitrate)",
        "icon": "\ud83d\udcf1",
        "role": "Dynamically requests chunks based on bandwidth"
      }
    ],
    "correctSequence": [
      "creator",
      "upload_gw",
      "raw_storage",
      "transcode_queue",
      "transcode_fleet",
      "video_cdn",
      "viewer"
    ],
    "explanation": "1. Video uploaded to S3 via pre-signed URL. 2. Task queue orchestrates distributed parallel transcoding into multiple bitrates (1080p, 720p, 480p) and generates HLS manifest (.m3u8). 3. Encoded chunks are pushed to global CDN edge servers placed inside ISPs. 4. Video player dynamically adapts quality using Adaptive Bitrate Streaming (ABR).",
    "keyDesignTakeaways": [
      "Split long videos into 10-second segments to allow parallel transcoding and instant start playback.",
      "Use HLS / MPEG-DASH manifest files so the client player can seamlessly switch bitrates on network fluctuations.",
      "Deploy Edge CDN appliances (like Netflix Open Connect) directly inside ISP data centers to eliminate backbone transit latency."
    ]
  },
  {
    "id": "uber_ride_matching",
    "title": "Design Uber / Real-Time Ride Dispatching",
    "badge": "\ud83d\ude96",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "5M Drivers \u2022 4s Location Pings",
    "qps": "1.25M Location Pings/Sec",
    "difficulty": "Staff+",
    "goal": "Construct a real-time geospatial location ingestion engine, geospatial indexing (H3/S2), and atomic rider-to-driver dispatching pipeline.",
    "availableNodes": [
      {
        "id": "driver_app",
        "name": "Driver GPS Ping Client",
        "icon": "\ud83d\ude97",
        "role": "Transmits lat/lng every 4s via WebSocket"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Connection Gateway",
        "icon": "\u26a1",
        "role": "Maintains 5M persistent bi-directional TCP connections"
      },
      {
        "id": "geo_service",
        "name": "Geospatial Ingestor Service",
        "icon": "\ud83d\uddfa\ufe0f",
        "role": "Maps raw GPS coordinates to Uber H3 Hexagon Cell IDs"
      },
      {
        "id": "redis_geo",
        "name": "In-Memory Geo Index (Redis / QuadTree)",
        "icon": "\ud83d\udd34",
        "role": "Maintains active driver spatial sets in RAM (<1ms)"
      },
      {
        "id": "rider_app",
        "name": "Rider Request Client",
        "icon": "\ud83d\udcf1",
        "role": "Sends POST /trips with pickup coordinates"
      },
      {
        "id": "dispatch_engine",
        "name": "Dispatch & Matching Engine",
        "icon": "\ud83c\udfaf",
        "role": "Runs K-Nearest Neighbor driver search + surge pricing"
      },
      {
        "id": "trip_db",
        "name": "ACID Trip Store (CockroachDB / Postgres)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Atomically locks driver and records trip state machine"
      }
    ],
    "correctSequence": [
      "driver_app",
      "ws_gateway",
      "geo_service",
      "redis_geo",
      "rider_app",
      "dispatch_engine",
      "trip_db"
    ],
    "explanation": "1. Drivers emit GPS pings every 4s over WebSockets. 2. Geo Ingestor maps coords into H3 hexagonal hierarchical spatial cells. 3. Redis maintains real-time driver locations in memory. 4. When a rider requests a car, Dispatch Engine queries Redis for nearby cell drivers (K-NN search). 5. Database performs atomic CAS lock on selected driver to prevent race conditions.",
    "keyDesignTakeaways": [
      "Uber H3 Hexagonal indexing allows equidistant neighbor lookups compared to square grids.",
      "Driver locations are stored in RAM (Redis Geospatial) because disk databases cannot withstand 1.25M writes/second.",
      "Optimistic locking or Distributed Redis Locks ensure two nearby riders are never matched to the same driver simultaneously."
    ]
  },
  {
    "id": "twitter_news_feed",
    "title": "Design Twitter / X Scalable Newsfeed",
    "badge": "\ud83d\udc26",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "500M DAU \u2022 500k Tweets/Sec Peak",
    "qps": "300,000 Feed Reads/Sec",
    "difficulty": "Hard",
    "goal": "Build a hybrid Fan-Out on Write vs Fan-Out on Read architecture capable of handling viral celebrities and millions of real-time timeline feeds.",
    "availableNodes": [
      {
        "id": "author",
        "name": "Tweet Author",
        "icon": "\u270d\ufe0f",
        "role": "Submits new tweet via POST /tweets"
      },
      {
        "id": "tweet_service",
        "name": "Tweet Ingestion Service",
        "icon": "\u2699\ufe0f",
        "role": "Persists tweet text & media references"
      },
      {
        "id": "social_graph",
        "name": "Social Graph DB (Neo4j / B-Tree)",
        "icon": "\ud83d\udd78\ufe0f",
        "role": "Fetches author follower IDs list"
      },
      {
        "id": "fanout_engine",
        "name": "Hybrid Fan-Out Coordinator",
        "icon": "\ud83d\udd00",
        "role": "Pushes to normal followers; skips mega-celebrities"
      },
      {
        "id": "redis_timeline",
        "name": "Redis Timeline Cache (Sorted Set)",
        "icon": "\ud83d\udd34",
        "role": "Pre-computed list of tweet IDs ordered by timestamp"
      },
      {
        "id": "feed_aggregator",
        "name": "Feed Aggregator Service",
        "icon": "\u26a1",
        "role": "Merges cached timeline with live celebrity pull feeds"
      },
      {
        "id": "reader",
        "name": "Follower Client App",
        "icon": "\ud83d\udcf1",
        "role": "Receives ranked home timeline in <50ms"
      }
    ],
    "correctSequence": [
      "author",
      "tweet_service",
      "social_graph",
      "fanout_engine",
      "redis_timeline",
      "feed_aggregator",
      "reader"
    ],
    "explanation": "1. Author writes a tweet. 2. Fan-Out Engine fetches followers from Social Graph. 3. For normal users (<20k followers), Fan-Out on Write pushes tweet ID to every follower Redis Timeline Sorted Set. 4. For celebrities (>1M followers like Elon Musk), Fan-Out on Read dynamically pulls their tweets when followers load feed. 5. Feed Aggregator merges and returns final home timeline.",
    "keyDesignTakeaways": [
      "Fan-Out on Write (Push) offers fast O(1) reads for 99% of users, but suffers from celebrity write amplification.",
      "Hybrid Fan-Out solves the celebrity problem: push for normal users, pull on read for accounts with >50,000 followers.",
      "Store only Tweet IDs (8 bytes) in Redis Sorted Sets, hydrating tweet content on demand to minimize memory costs."
    ]
  },
  {
    "id": "stripe_payments",
    "title": "Design Stripe / Core Payment Gateway",
    "badge": "\ud83d\udcb3",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Zero Double-Charge Tolerance",
    "qps": "99.999% High Availability SLA",
    "difficulty": "Staff+",
    "goal": "Build an idempotent payment orchestration pipeline with distributed deduplication, fraud scoring, external PSP execution, and double-entry ledgering.",
    "availableNodes": [
      {
        "id": "checkout",
        "name": "Checkout Client",
        "icon": "\ud83d\udecd\ufe0f",
        "role": "Sends POST /charges with UUID Idempotency-Key"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Key Store (Redis/SQL)",
        "icon": "\ud83d\udd12",
        "role": "Deduplicates retries & prevents duplicate charges"
      },
      {
        "id": "payment_orchestrator",
        "name": "Payment Orchestrator (Saga Engine)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step transaction workflow"
      },
      {
        "id": "risk_engine",
        "name": "Fraud & ML Risk Engine",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Runs velocity checks & ML scoring in <20ms"
      },
      {
        "id": "psp_gateway",
        "name": "Card Network / PSP (Visa / Master)",
        "icon": "\ud83c\udfe6",
        "role": "Executes actual card authorization & capture"
      },
      {
        "id": "ledger",
        "name": "Double-Entry Accounting Ledger",
        "icon": "\ud83d\udcd1",
        "role": "Records immutable Debit = Credit balance transactions"
      },
      {
        "id": "webhook_service",
        "name": "Asynchronous Webhook Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Reliably emits charge.succeeded events with retry"
      }
    ],
    "correctSequence": [
      "checkout",
      "idempotency_store",
      "payment_orchestrator",
      "risk_engine",
      "psp_gateway",
      "ledger",
      "webhook_service"
    ],
    "explanation": "1. Checkout passes unique Idempotency-Key. 2. Key Store ensures retried requests return previous response without double charging. 3. Saga Orchestrator initiates fraud scoring. 4. Card network authorizes charge. 5. Immutable double-entry ledger records balances. 6. Webhooks notify merchant with exponential backoff.",
    "keyDesignTakeaways": [
      "Idempotency Keys must be checked and locked before any external banking API call is made.",
      "Double-Entry Bookkeeping guarantees money is never created or destroyed: every debit must equal a credit.",
      "Use the Saga Pattern with compensating transactions to recover gracefully from third-party banking gateway timeouts."
    ]
  },
  {
    "id": "whatsapp_chat",
    "title": "Design WhatsApp / Real-Time Messenger",
    "badge": "\ud83d\udcac",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100B Messages/Day \u2022 2B Active Users",
    "qps": "1.2M Messages Ingest/Sec",
    "difficulty": "Hard",
    "goal": "Construct an end-to-end encrypted real-time chat architecture supporting persistent WebSockets, ephemeral message routing, offline queues, and push notifications.",
    "availableNodes": [
      {
        "id": "sender",
        "name": "Sender Mobile Client",
        "icon": "\ud83d\udcf1",
        "role": "Encrypts message with Signal Protocol"
      },
      {
        "id": "chat_gateway",
        "name": "Netty WebSocket Gateway Fleet",
        "icon": "\u26a1",
        "role": "Maintains persistent TCP/WebSocket connections"
      },
      {
        "id": "presence_store",
        "name": "Presence & Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Maps User ID -> Gateway Node IP & Online Status"
      },
      {
        "id": "message_broker",
        "name": "Ephemeral Message Broker (Kafka / RMQ)",
        "icon": "\ud83d\udcec",
        "role": "Routes message to recipient active gateway node"
      },
      {
        "id": "chat_db",
        "name": "Wide-Column Chat DB (ScyllaDB / Cassandra)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores message history partitioned by (chat_id, bucket)"
      },
      {
        "id": "push_service",
        "name": "Push Notification Engine (APNs/FCM)",
        "icon": "\ud83d\udd14",
        "role": "Wakes up phone if recipient is currently offline"
      },
      {
        "id": "receiver",
        "name": "Receiver Mobile Client",
        "icon": "\ud83d\udcf2",
        "role": "Receives, decrypts & emits double blue tick ACK"
      }
    ],
    "correctSequence": [
      "sender",
      "chat_gateway",
      "presence_store",
      "message_broker",
      "chat_db",
      "push_service",
      "receiver"
    ],
    "explanation": "1. Sender transmits encrypted message over WebSocket. 2. Gateway checks Presence Store to find recipient gateway node. 3. Message broker dispatches message directly to recipient active socket. 4. Chat history is persisted in ScyllaDB for multi-device sync. 5. If recipient is offline, Push Service triggers APNs/FCM wake-up notification.",
    "keyDesignTakeaways": [
      "Netty non-blocking I/O event loops allow a single server node to hold 100,000+ open WebSocket connections.",
      "Cassandra / ScyllaDB wide-column stores with compound primary keys (chat_id, timestamp) provide high-throughput sequential writes.",
      "End-to-End Encryption (E2EE) ensures application servers only route opaque byte ciphertext without knowing message contents."
    ]
  },
  {
    "id": "ticketmaster_booking",
    "title": "Design Ticketmaster / High-Concurrency Booking",
    "badge": "\ud83c\udf9f\ufe0f",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "10M Users in Virtual Waiting Room",
    "qps": "250,000 Checkout QPS Peak",
    "difficulty": "Staff+",
    "goal": "Design a high-concurrency ticket reservation engine with virtual waiting rooms, Redis distributed seat locks with TTL, and zero overselling.",
    "availableNodes": [
      {
        "id": "fan_browser",
        "name": "Fan Browser Client",
        "icon": "\ud83c\udfab",
        "role": "Joins concert ticket drop"
      },
      {
        "id": "virtual_queue",
        "name": "Virtual Waiting Room (Cloudflare Waiting Room)",
        "icon": "\u23f3",
        "role": "Throttles traffic with fair FIFO token bucket"
      },
      {
        "id": "booking_service",
        "name": "Booking Orchestrator Service",
        "icon": "\u2699\ufe0f",
        "role": "Validates user token and seat selection"
      },
      {
        "id": "seat_lock_redis",
        "name": "Redis Distributed Seat Lock (10m TTL)",
        "icon": "\ud83d\udd12",
        "role": "Atomic SETNX temporary reservation hold"
      },
      {
        "id": "payment_gateway",
        "name": "Payment Gateway PSP",
        "icon": "\ud83d\udcb3",
        "role": "Authorizes credit card charge within 10m window"
      },
      {
        "id": "ticket_sql_db",
        "name": "ACID Database (PostgreSQL)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Commits confirmed seat tickets with row locks"
      },
      {
        "id": "confirmation_worker",
        "name": "Ticket Issuer & Email Worker",
        "icon": "\u2709\ufe0f",
        "role": "Generates dynamic barcode PDF & sends receipt"
      }
    ],
    "correctSequence": [
      "fan_browser",
      "virtual_queue",
      "booking_service",
      "seat_lock_redis",
      "payment_gateway",
      "ticket_sql_db",
      "confirmation_worker"
    ],
    "explanation": "1. Waiting room absorbs millions of concurrent users. 2. Users with valid queue tokens access Booking Service. 3. Redis SETNX acquires temporary 10-minute lock on chosen seats. 4. Payment executes within the 10m window. 5. PostgreSQL ACID transaction confirms permanent ownership. 6. Worker emails barcode ticket.",
    "keyDesignTakeaways": [
      "Virtual Waiting Room acts as an upstream shock absorber, preventing backend database collapse.",
      "Use Redis distributed locks with automatic TTL expiration to handle users who abandon cart without completing payment.",
      "Database constraints (e.g. UNIQUE index on event_id + seat_number) act as the final defense against double bookings."
    ]
  },
  {
    "id": "dropbox_file_sync",
    "title": "Design Dropbox / Cloud File Synchronization",
    "badge": "\ud83d\udcc1",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1B Files Sync/Day \u2022 500PB Storage",
    "qps": "50,000 Chunk Uploads/Sec",
    "difficulty": "Hard",
    "goal": "Build a cross-device file synchronization service with block-level delta chunking, rolling SHA-256 deduplication, and real-time desktop notifications.",
    "availableNodes": [
      {
        "id": "desktop_client",
        "name": "Desktop Sync Daemon",
        "icon": "\ud83d\udcbb",
        "role": "Detects OS file change & splits into 4MB chunks"
      },
      {
        "id": "dedup_service",
        "name": "Block Hash Deduplication Service",
        "icon": "\ud83d\udd0d",
        "role": "Checks if chunk SHA-256 hash already exists in cloud"
      },
      {
        "id": "chunk_storage",
        "name": "S3 Cloud Block Storage",
        "icon": "\ud83e\udea3",
        "role": "Uploads only brand-new, unique 4MB delta chunks"
      },
      {
        "id": "metadata_db",
        "name": "Metadata DB (CockroachDB / MySQL)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Records file namespace tree, version vectors & chunk list"
      },
      {
        "id": "sync_notifier",
        "name": "Sync Notification Gateway (WebSocket)",
        "icon": "\u26a1",
        "role": "Broadcasting sync delta to user other active devices"
      },
      {
        "id": "mobile_client",
        "name": "Secondary Device Client",
        "icon": "\ud83d\udcf1",
        "role": "Pulls modified delta chunks and reconstructs file"
      }
    ],
    "correctSequence": [
      "desktop_client",
      "dedup_service",
      "chunk_storage",
      "metadata_db",
      "sync_notifier",
      "mobile_client"
    ],
    "explanation": "1. Desktop daemon splits changed file into 4MB chunks (Rabin fingerprinting). 2. Deduplication service checks if chunk hashes exist; skips upload if matched. 3. Only new chunks upload to S3. 4. Metadata DB updates file version vector. 5. Notification Gateway pushes sync event over WebSocket to all other paired devices. 6. Secondary devices pull only missing delta blocks.",
    "keyDesignTakeaways": [
      "Block-level delta sync (chunking) reduces bandwidth consumption by 90%+ when modifying large files.",
      "Content-Addressable Storage (CAS) where chunk IDs are their SHA-256 hash automatically eliminates cross-user duplicates.",
      "Version Vectors / Lamport Timestamps resolve concurrent multi-device edit conflicts."
    ]
  },
  {
    "id": "youtube_top_k",
    "title": "Design YouTube / Top K Trending Videos",
    "badge": "\ud83d\udcc8",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10B Video Views/Day",
    "qps": "200,000 View Events/Sec",
    "difficulty": "Hard",
    "goal": "Design a real-time stream aggregation engine calculating Top K trending videos in a 1-hour tumbling window using Count-Min Sketch and Min-Heap.",
    "availableNodes": [
      {
        "id": "player_telemetry",
        "name": "Video Player Telemetry",
        "icon": "\ud83d\udcf1",
        "role": "Emits video_id view heartbeats"
      },
      {
        "id": "kafka_stream",
        "name": "Kafka Ingestion Cluster",
        "icon": "\u26a1",
        "role": "Buffers raw high-throughput view events"
      },
      {
        "id": "flink_processor",
        "name": "Apache Flink Stream Engine",
        "icon": "\ud83d\udd04",
        "role": "Computes Count-Min Sketch frequency in 60s tumbling windows"
      },
      {
        "id": "min_heap",
        "name": "Distributed Min-Heap (Top K)",
        "icon": "\ud83d\udcca",
        "role": "Maintains bounded top 100 video IDs in memory"
      },
      {
        "id": "trending_cache",
        "name": "Redis Trending Cache (ZSET)",
        "icon": "\ud83d\udd34",
        "role": "Stores global ranked leaderboard with TTL"
      },
      {
        "id": "homepage_service",
        "name": "YouTube Homepage Service",
        "icon": "\ud83c\udfe0",
        "role": "Serves top trending rail to millions of viewers"
      }
    ],
    "correctSequence": [
      "player_telemetry",
      "kafka_stream",
      "flink_processor",
      "min_heap",
      "trending_cache",
      "homepage_service"
    ],
    "explanation": "1. Telemetry heartbeats stream to Kafka. 2. Flink processes events in sliding windows using Count-Min Sketch for probabilistic heavy-hitter counting with O(1) memory. 3. Min-Heap of size K maintains top 100 trending IDs. 4. Results flush to Redis Sorted Sets. 5. Homepage queries Redis in <1ms without hitting heavy OLAP databases.",
    "keyDesignTakeaways": [
      "Exact counting of 10B events in real time exceeds memory bounds; Count-Min Sketch probabilistic data structure bounds memory usage to megabytes.",
      "Two-stage aggregation (local stream workers compute top K, central reducer merges top K) prevents network bottlenecks.",
      "Tumbling vs Sliding Windows: 1-hour sliding window updated every 1 minute provides fresh trending rankings."
    ]
  },
  {
    "id": "google_web_crawler",
    "title": "Design Web Crawler / Distributed Search Indexer",
    "badge": "\ud83d\udd77\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10B Web Pages \u2022 1PB Data Ingested",
    "qps": "20,000 Pages Crawled/Sec",
    "difficulty": "Staff+",
    "goal": "Build a distributed, polite web crawler pipeline with URL frontier priority queuing, duplicate content hashing, and robots.txt compliance.",
    "availableNodes": [
      {
        "id": "seed_urls",
        "name": "Seed URLs & Scheduler",
        "icon": "\ud83c\udf31",
        "role": "Injects initial root URLs into frontier"
      },
      {
        "id": "url_frontier",
        "name": "URL Frontier (Politeness Queue)",
        "icon": "\ud83d\udcec",
        "role": "Enforces domain rate limits & priority ordering"
      },
      {
        "id": "dns_cache",
        "name": "In-Memory DNS Resolver Cache",
        "icon": "\ud83c\udf10",
        "role": "Caches IP lookups to avoid DNS throttling"
      },
      {
        "id": "html_fetcher",
        "name": "Distributed HTML Fetcher Fleet",
        "icon": "\u26a1",
        "role": "Downloads web page content respect robots.txt"
      },
      {
        "id": "content_dedup",
        "name": "SimHash Content Deduplicator",
        "icon": "\ud83d\udd0d",
        "role": "Calculates 64-bit Hamming distance to skip duplicate pages"
      },
      {
        "id": "link_extractor",
        "name": "HTML Parser & Link Extractor",
        "icon": "\u2699\ufe0f",
        "role": "Extracts new absolute URLs and validates filter rules"
      },
      {
        "id": "blob_archive",
        "name": "Raw HTML S3 Blob Archive",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists compressed HTML for search engine indexing"
      }
    ],
    "correctSequence": [
      "seed_urls",
      "url_frontier",
      "dns_cache",
      "html_fetcher",
      "content_dedup",
      "link_extractor",
      "blob_archive"
    ],
    "explanation": "1. Seed URLs enter URL Frontier. 2. Frontier queues URLs per domain to enforce politeness delays. 3. Custom DNS cache resolves IP in microseconds. 4. Fetcher fleet downloads HTML. 5. SimHash checks for near-duplicate content. 6. Link Extractor extracts new links and feeds unvisited URLs back to Frontier. 7. Compressed HTML is stored in S3 for search indexing.",
    "keyDesignTakeaways": [
      "Politeness is mandatory: a crawler must never overwhelm target websites; use separate per-host queues with delay timers.",
      "SimHash / MinHash detects duplicate or cloned pages even if CSS styling or advertisements differ.",
      "Bloom Filters with 10B bits efficiently check if a URL has already been visited in O(1) time without disk I/O."
    ]
  },
  {
    "id": "amazon_flash_sale",
    "title": "Design Amazon / Lightning Deals Flash Sale",
    "badge": "\ud83d\udecd\ufe0f",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "500k QPS Inventory Check",
    "qps": "500,000 QPS",
    "difficulty": "Hard",
    "goal": "Design a flash sale inventory reservation system with zero overselling, in-memory atomic decrement, and asynchronous checkout order queues.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Amazon / Lightning Deals Flash Sale.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "stock_matching_engine",
    "title": "Design Stock Exchange Matching Engine",
    "badge": "\ud83d\udcca",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "1M Orders/Sec \u2022 <10\u00b5s Latency",
    "qps": "1,000,000 Orders/Sec",
    "difficulty": "Staff+",
    "goal": "Design an ultra-low latency stock order matching engine using LMAX Disruptor RingBuffer, in-memory Order Book (B-Tree/SkipList), and WAL logging.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Stock Exchange Matching Engine.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "hotel_booking_airbnb",
    "title": "Design Airbnb / Hotel Reservation System",
    "badge": "\ud83c\udfe1",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "50M Listings \u2022 Zero Double Booking",
    "qps": "100k Booking QPS",
    "difficulty": "Hard",
    "goal": "Design a hotel room booking engine preventing double bookings with 2-Phase Locking (2PL), availability calendars, and payment sagas.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Airbnb / Hotel Reservation System.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "crypto_wallet_ledger",
    "title": "Design Coinbase / Crypto Custody Ledger",
    "badge": "\ud83e\ude99",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Multi-Sig Security & 100% Audit",
    "qps": "25,000 Tx/Sec",
    "difficulty": "Staff+",
    "goal": "Build a high-security cryptocurrency custody ledger with cold/hot wallet separation, multi-signature threshold schemes, and double-entry reconciliation.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Coinbase / Crypto Custody Ledger.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "digital_wallet_p2p",
    "title": "Design PayPal / Peer-to-Peer Balance Transfer",
    "badge": "\ud83d\udcb8",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100M Daily P2P Transfers",
    "qps": "50,000 Tx/Sec",
    "difficulty": "Hard",
    "goal": "Design a peer-to-peer balance transfer system ensuring atomic debit/credit operations, optimistic locking, and regulatory AML transaction monitoring.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design PayPal / Peer-to-Peer Balance Transfer.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "credit_card_fraud_detection",
    "title": "Design Visa / Real-Time Credit Card Fraud Scorer",
    "badge": "\ud83d\udee1\ufe0f",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Sub-10ms Fraud Risk Scoring",
    "qps": "150,000 Swipes/Sec",
    "difficulty": "Staff+",
    "goal": "Construct a real-time card authorization fraud engine executing velocity rules and machine learning inference within a strict 10ms budget.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Visa / Real-Time Credit Card Fraud Scorer.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "usage_based_billing_stripe",
    "title": "Design Stripe / Usage-Based API Metering & Invoicing",
    "badge": "\ud83e\uddfe",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "10B Usage Events Ingested/Mo",
    "qps": "100,000 Ingest/Sec",
    "difficulty": "Hard",
    "goal": "Build an accurate usage metering and billing platform that aggregates API events, calculates tiered rating plans, and generates invoices with zero undercounting.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Stripe / Usage-Based API Metering & Invoicing.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "bank_wire_transfer_iso20022",
    "title": "Design Core Banking / ISO 20022 High-Value Wire Settlement",
    "badge": "\ud83c\udfe6",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "High-Value Real-Time Gross Settlement",
    "qps": "5,000 RTGS Msg/Sec",
    "difficulty": "Staff+",
    "goal": "Design an ISO 20022 pacs.008 banking wire transfer engine with APRA CPS 230 operational resilience, sanctions screening, and core ledger posting.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Core Banking / ISO 20022 High-Value Wire Settlement.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "e_commerce_cart_service",
    "title": "Design Shopify / High-Scale Shopping Cart Service",
    "badge": "\ud83d\uded2",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "50M Active Carts Across Merchants",
    "qps": "100,000 Cart OPS/Sec",
    "difficulty": "Medium",
    "goal": "Design a low-latency shopping cart service supporting anonymous-to-authenticated cart merging, inventory holds, and Redis TTL management.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Shopify / High-Scale Shopping Cart Service.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "buy_now_pay_later_klarna",
    "title": "Design Klarna / Buy Now Pay Later Instant Underwriting",
    "badge": "\ud83d\udcb3",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Instant Micro-Credit Decisioning",
    "qps": "20,000 Applications/Min",
    "difficulty": "Hard",
    "goal": "Construct an instant BNPL credit evaluation engine with real-time credit bureau integrations, risk scoring, and scheduled repayment auto-debit.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Klarna / Buy Now Pay Later Instant Underwriting.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "leetcode_code_judge",
    "title": "Design LeetCode / Online Code Execution Engine",
    "badge": "\ud83d\udcbb",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "50,000 Submissions/Hour",
    "qps": "50,000 Runs/Hr",
    "difficulty": "Hard",
    "goal": "Build an isolated, secure, remote code execution platform with Firecracker microVM sandboxing, memory/CPU quotas, and test runner verification.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design LeetCode / Online Code Execution Engine.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "google_docs_crdt",
    "title": "Design Google Docs / Real-Time Collaborative Document",
    "badge": "\ud83d\udcc4",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "10M Active Collaborators",
    "qps": "10,000,000 Live Sockets",
    "difficulty": "Staff+",
    "goal": "Construct a real-time concurrent document collaboration engine using Conflict-Free Replicated Data Types (CRDT / Yjs) and WebSocket mesh syncing.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Google Docs / Real-Time Collaborative Document.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "yelp_proximity_search",
    "title": "Design Yelp / Proximity Venue Search",
    "badge": "\ud83d\udccd",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100M Places \u2022 50k Search QPS",
    "qps": "50,000 Search QPS",
    "difficulty": "Hard",
    "goal": "Build a high-performance nearby venue discovery service using QuadTree spatial partitioning, Geohashes, and spatial radius caching.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Yelp / Proximity Venue Search.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "typeahead_search_autocomplete",
    "title": "Design Search Autocomplete / Typeahead",
    "badge": "\ud83d\udd0d",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "5B Queries/Day \u2022 <20ms SLA",
    "qps": "200,000 Key QPS",
    "difficulty": "Hard",
    "goal": "Build a lightning-fast typeahead autocomplete engine using Trie data structures, frequency counters, and multi-tier edge caching.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Search Autocomplete / Typeahead.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "ad_click_aggregator",
    "title": "Design Ad Click Aggregator & Real-Time Bidding",
    "badge": "\ud83c\udfaf",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1M Clicks/Sec \u2022 $10B Ad Spend",
    "qps": "1,000,000 Clicks/Sec",
    "difficulty": "Staff+",
    "goal": "Design an ultra-low latency real-time bidding exchange and click fraud detection pipeline with sub-50ms auction SLA.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Ad Click Aggregator & Real-Time Bidding.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "music_streaming_spotify",
    "title": "Design Spotify / Global Audio Streaming Platform",
    "badge": "\ud83c\udfb5",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "500M Active Listeners",
    "qps": "500,000 Streams/Sec",
    "difficulty": "Hard",
    "goal": "Construct a global audio streaming delivery network with chunked Ogg Vorbis streaming, client-side caching, and playlist graph synchronization.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Spotify / Global Audio Streaming Platform.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "notification_system_push",
    "title": "Design Scalable Notification Service (APNs/FCM/SMS)",
    "badge": "\ud83d\udd14",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1B Notifications/Day",
    "qps": "250,000 Pushes/Sec",
    "difficulty": "Medium",
    "goal": "Build a multi-channel notification engine with user preference filtering, priority SQS queues, template rendering, and third-party provider retries.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Scalable Notification Service (APNs/FCM/SMS).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "instagram_feed_stories",
    "title": "Design Instagram / Stories & Photo Feed Publishing",
    "badge": "\ud83d\udcf7",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1B DAU \u2022 Ephemeral 24h Media",
    "qps": "400,000 Reads/Sec",
    "difficulty": "Hard",
    "goal": "Design an ephemeral Stories delivery system with 24-hour TTL expiration, edge CDN caching, and user viewed-state bitsets.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Instagram / Stories & Photo Feed Publishing.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "linkedin_social_graph",
    "title": "Design LinkedIn / 2nd & 3rd Degree Connection Graph",
    "badge": "\ud83d\udd78\ufe0f",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "900M Professionals Graph",
    "qps": "50,000 Traversal QPS",
    "difficulty": "Hard",
    "goal": "Build a distributed graph traversal service calculating 1st, 2nd, and 3rd degree professional connection pathways in under 100ms.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design LinkedIn / 2nd & 3rd Degree Connection Graph.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "news_aggregator_ranking",
    "title": "Design Hacker News / Algorithmic Ranking & Comments",
    "badge": "\ud83d\udcf0",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "10M Active Readers",
    "qps": "30,000 Feed QPS",
    "difficulty": "Medium",
    "goal": "Design a real-time link aggregation platform with gravity time-decay ranking algorithms and recursive comment tree indexing.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Hacker News / Algorithmic Ranking & Comments.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "twitch_live_chat",
    "title": "Design Twitch / Live Stream Chat with Millions of Viewers",
    "badge": "\ud83d\udcac",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "1M Concurrent Chatters in 1 Room",
    "qps": "500,000 Msgs/Sec",
    "difficulty": "Staff+",
    "goal": "Construct a high-volume live video chat engine with room sharding, message rate-limiting, slow mode, and client-side rendering throttling.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Twitch / Live Stream Chat with Millions of Viewers.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "uber_surge_pricing",
    "title": "Design Uber / Dynamic Surge Pricing Engine",
    "badge": "\ud83d\udcc8",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "Real-Time Supply & Demand Matrix",
    "qps": "100,000 Hex Calculations/Sec",
    "difficulty": "Hard",
    "goal": "Build an automated surge multiplier calculator aggregating ride requests and active driver locations per H3 hexagon cell in 10-second intervals.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Uber / Dynamic Surge Pricing Engine.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "zoom_video_signaling",
    "title": "Design Zoom / Video Conference Signaling & SFU Router",
    "badge": "\ud83d\udcf9",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "300M Daily Meeting Participants",
    "qps": "1,000,000 Media Streams",
    "difficulty": "Staff+",
    "goal": "Design a real-time WebRTC Selective Forwarding Unit (SFU) audio/video routing mesh with adaptive simulcast quality switching.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Zoom / Video Conference Signaling & SFU Router.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "chess_matchmaking_engine",
    "title": "Design Chess.com / Multiplayer Chess Engine & ELO",
    "badge": "\u265f\ufe0f",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "10M Concurrent Games",
    "qps": "100,000 Moves/Sec",
    "difficulty": "Medium",
    "goal": "Construct a low-latency multiplayer game state machine with WebSocket bi-directional moves, server anti-cheat validation, and ELO matchmaking.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Chess.com / Multiplayer Chess Engine & ELO.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "google_maps_navigation",
    "title": "Design Google Maps / Real-Time Turn-by-Turn Navigation",
    "badge": "\ud83d\uddfa\ufe0f",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "1B Active Navigations",
    "qps": "200,000 Route QPS",
    "difficulty": "Staff+",
    "goal": "Design a real-time routing engine using A* Contraction Hierarchies, live traffic segment congestion overlays, and dynamic re-routing.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Google Maps / Real-Time Turn-by-Turn Navigation.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_rate_limiter",
    "title": "Design Distributed Rate Limiter",
    "badge": "\u23f1\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1,000,000 QPS Rate Evaluated",
    "qps": "1,000,000 Check QPS",
    "difficulty": "Hard",
    "goal": "Design a scalable distributed rate limiting service enforcing Sliding Window Counter algorithms across global data centers with sub-1ms overhead.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Distributed Rate Limiter.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_log_aggregation",
    "title": "Design Distributed Log Aggregator (Elastic/Kibana)",
    "badge": "\ud83d\udcdc",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "50TB Logs Ingested/Day",
    "qps": "500,000 Log Lines/Sec",
    "difficulty": "Hard",
    "goal": "Construct a scalable enterprise log aggregation pipeline with log agents, Kafka buffering, Logstash indexing, and Elasticsearch inverted index storage.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Distributed Log Aggregator (Elastic/Kibana).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_task_scheduler",
    "title": "Design Distributed Cron & Workflow Scheduler",
    "badge": "\u23f0",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100M Scheduled Jobs/Day",
    "qps": "50,000 Triggers/Sec",
    "difficulty": "Hard",
    "goal": "Build a fault-tolerant, distributed workflow engine with cron scheduling, DAG dependency resolution, and Raft consensus leader election.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Distributed Cron & Workflow Scheduler.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "cloud_object_storage_s3",
    "title": "Design S3 / Distributed Cloud Object Storage",
    "badge": "\ud83e\udea3",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Exabytes \u2022 11 9s Durability",
    "qps": "500,000 IOPS",
    "difficulty": "Staff+",
    "goal": "Construct an exabyte-scale object storage service with Reed-Solomon Erasure Coding, metadata sharding, and high availability.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design S3 / Distributed Cloud Object Storage.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "api_gateway_envoy",
    "title": "Design Cloud API Gateway & Reverse Proxy",
    "badge": "\ud83d\udee1\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10M RPS Ingress",
    "qps": "10,000,000 QPS",
    "difficulty": "Staff+",
    "goal": "Design a resilient API Gateway with circuit breaking, dynamic upstream discovery, JWT verification, and distributed rate limiting.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Cloud API Gateway & Reverse Proxy.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "metrics_monitoring_prometheus",
    "title": "Design Distributed Metrics Monitoring (Prometheus/Grafana)",
    "badge": "\ud83d\udcca",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10M Metrics Ingested/Sec",
    "qps": "10,000,000 Metrics/Sec",
    "difficulty": "Hard",
    "goal": "Build a high-volume time-series metrics monitoring and alerting system with pull scrapers, TSDB compression (Gorilla), and Alertmanager.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Distributed Metrics Monitoring (Prometheus/Grafana).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_cache_redis_cluster",
    "title": "Design Distributed In-Memory Cache (Redis Cluster)",
    "badge": "\ud83d\udd34",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100TB In-Memory \u2022 5M OPS/Sec",
    "qps": "5,000,000 OPS/Sec",
    "difficulty": "Staff+",
    "goal": "Design a scalable distributed in-memory caching cluster with Consistent Hashing (16,384 Hash Slots), Gossip Protocol, and Master-Replica failover.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Distributed In-Memory Cache (Redis Cluster).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "video_transcoding_cluster",
    "title": "Design Distributed Video Transcoding Fleet",
    "badge": "\ud83c\udf9e\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10,000 Video Files/Hour",
    "qps": "10,000 Transcodes/Hr",
    "difficulty": "Hard",
    "goal": "Construct a parallelized video transcoding fleet using chunked SQS dispatch, spot GPU instances, and FFmpeg pipeline processing.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Distributed Video Transcoding Fleet.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "realtime_analytics_clickhouse",
    "title": "Design Real-Time Analytics Pipeline (ClickHouse)",
    "badge": "\ud83d\udcca",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "500,000 Events/Sec Ingested",
    "qps": "500,000 Ingest QPS",
    "difficulty": "Hard",
    "goal": "Build a high-throughput event ingestion and real-time analytical dashboard pipeline using Kafka, Vector, and ClickHouse columnar storage.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Real-Time Analytics Pipeline (ClickHouse).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_id_snowflake",
    "title": "Design Twitter Snowflake / 64-Bit Unique ID Generator",
    "badge": "\ud83d\udd22",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10M Unique IDs/Sec",
    "qps": "10,000,000 IDs/Sec",
    "difficulty": "Medium",
    "goal": "Build a high-performance, k-sorted, 64-bit unique ID generation service using Timestamp (41b), Machine ID (10b), and Sequence Counter (12b).",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Twitter Snowflake / 64-Bit Unique ID Generator.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "cdn_cache_purge_engine",
    "title": "Design Cloudflare / Global Instant CDN Cache Purge Mesh",
    "badge": "\ud83c\udf10",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Sub-150ms Global Edge Purge",
    "qps": "100,000 Purges/Sec",
    "difficulty": "Staff+",
    "goal": "Design a global cache invalidation mesh that purges cached URLs across 300+ edge data centers within 150 milliseconds.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Cloudflare / Global Instant CDN Cache Purge Mesh.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "database_cdc_debezium",
    "title": "Design Debezium / Postgres WAL Change Data Capture Pipeline",
    "badge": "\ud83d\udd04",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Zero Loss Database Event Streaming",
    "qps": "50,000 Events/Sec",
    "difficulty": "Medium",
    "goal": "Build an asynchronous data streaming pipeline using Change Data Capture (CDC) to stream database row mutations to Kafka without SQL polling overhead.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Debezium / Postgres WAL Change Data Capture Pipeline.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_tracing_jaeger",
    "title": "Design Distributed Tracing System (OpenTelemetry / Jaeger)",
    "badge": "\ud83d\udd0d",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1B Distributed Spans/Day",
    "qps": "1,000,000 Spans/Sec",
    "difficulty": "Hard",
    "goal": "Construct an end-to-end distributed tracing platform with trace context propagation (W3C TraceContext), tail-based sampling, and dependency graph generation.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Distributed Tracing System (OpenTelemetry / Jaeger).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "secret_management_vault",
    "title": "Design HashiCorp Vault / Dynamic Secret Manager",
    "badge": "\ud83d\udd10",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Zero-Trust Secret Encryption at Rest",
    "qps": "20,000 Read QPS",
    "difficulty": "Hard",
    "goal": "Design a secure secret management service with Shamir Secret Sharing, envelope encryption with KMS, and dynamic short-lived database credentials.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design HashiCorp Vault / Dynamic Secret Manager.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_database_vitess",
    "title": "Design Vitess / Horizontal MySQL Sharding Proxy",
    "badge": "\ud83d\uddc4\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Petabyte Scale Relational Queries",
    "qps": "250,000 Query QPS",
    "difficulty": "Staff+",
    "goal": "Design a database sharding proxy that provides transparent horizontal SQL sharding, two-phase commit coordination, and scatter-gather query execution.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Vitess / Horizontal MySQL Sharding Proxy.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "iot_telemetry_influxdb",
    "title": "Design Connected Car Fleet Telemetry (Tesla IoT)",
    "badge": "\ud83d\ude97",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10M Connected Vehicles",
    "qps": "500,000 Telemetry/Sec",
    "difficulty": "Hard",
    "goal": "Build a resilient IoT sensor ingestion pipeline with MQTT broker clustering, Kafka buffering, and downsampling retention policies in TimescaleDB.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Connected Car Fleet Telemetry (Tesla IoT).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "zero_trust_mesh_spiffe",
    "title": "Design Zero-Trust Service Identity Mesh (SPIFFE/SPIRE)",
    "badge": "\ud83d\udee1\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Cryptographic Workload Attestation",
    "qps": "100,000 mTLS Sockets",
    "difficulty": "Staff+",
    "goal": "Construct a zero-trust mutual TLS (mTLS) service mesh infrastructure that issues short-lived X.509 SVID certificates to ephemeral microservices.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Zero-Trust Service Identity Mesh (SPIFFE/SPIRE).",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "cloud_load_balancer_maglev",
    "title": "Design Google Maglev / L4 Network Load Balancer",
    "badge": "\u2696\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100Gbps Wire Speed Packet Routing",
    "qps": "10,000,000 Packets/Sec",
    "difficulty": "Staff+",
    "goal": "Design a software-defined L4 load balancer using DPDK kernel bypass, Consistent Hashing lookup tables, and BGP Equal-Cost Multi-Path (ECMP) routing.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design Google Maglev / L4 Network Load Balancer.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "distributed_kv_etcd_raft",
    "title": "Design etcd / Strongly Consistent Raft KV Store",
    "badge": "\ud83d\uddc4\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Linearizable ACID Distributed State",
    "qps": "50,000 Ops/Sec",
    "difficulty": "Staff+",
    "goal": "Build a strongly consistent distributed key-value store using the Raft consensus algorithm with leader lease management and multi-version concurrency control (MVCC).",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
    "keyDesignTakeaways": [
      "Decouple read and write paths to maximize throughput for Design etcd / Strongly Consistent Raft KV Store.",
      "Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
      "Ensure all workers and consumer steps are idempotent to tolerate retries safely."
    ]
  },
  {
    "id": "iot_smart_metering",
    "title": "Design Smart Grid / Power Meter Telemetry Ingest",
    "badge": "\u26a1",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100M Smart Meters",
    "qps": "1,000,000 Metrics/Sec",
    "difficulty": "Hard",
    "goal": "Ingest and process nationwide smart electricity meter readings every 15 minutes with time-series downsampling.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "e_signature_docusign",
    "title": "Design DocuSign / Cryptographic Contract Signing",
    "badge": "\u270d\ufe0f",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "10M Signed Documents/Mo",
    "qps": "5,000 Signs/Sec",
    "difficulty": "Hard",
    "goal": "Build a secure digital signature workflow with PKI certificate validation, audit trails, and tamper-evident PDF hashing.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "telemedicine_webrtc",
    "title": "Design Teladoc / HIPAA-Compliant Video Doctor Visit",
    "badge": "\ud83e\ude7a",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "1M Daily Consultations",
    "qps": "50,000 Live Sessions",
    "difficulty": "Hard",
    "goal": "Construct an encrypted, HIPAA-compliant telehealth video platform with WebRTC SFU streaming and clinical record storage.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "live_auction_ebay",
    "title": "Design eBay / Live Real-Time Bidding Auction",
    "badge": "\ud83c\udff7\ufe0f",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100k Bids/Sec on Hot Items",
    "qps": "100,000 Bids/Sec",
    "difficulty": "Hard",
    "goal": "Design a real-time auction bidding engine with millisecond countdown timers, optimistic locking, and automatic proxy bidding.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "package_tracking_ups",
    "title": "Design UPS / Global Package Milestone Tracking",
    "badge": "\ud83d\udce6",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "50M Daily Shipments",
    "qps": "200,000 Scans/Sec",
    "difficulty": "Medium",
    "goal": "Build an end-to-end package tracking system updating delivery milestones from sorting hub barcode scans in real time.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "smart_home_iot_hub",
    "title": "Design Smart Home IoT Automation Gateway",
    "badge": "\ud83d\udca1",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "50M Connected Smart Devices",
    "qps": "500,000 Events/Sec",
    "difficulty": "Medium",
    "goal": "Design a low-latency IoT message broker and rules engine executing automation routines across millions of smart home appliances.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "dns_ddos_scrubber",
    "title": "Design Cloudflare / Anycast BGP DDoS Scrubber",
    "badge": "\ud83d\udee1\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100Tbps DDoS Attack Absorption",
    "qps": "50,000,000 Packets/Sec",
    "difficulty": "Staff+",
    "goal": "Construct a globally distributed DDoS mitigation engine using eBPF/XDP kernel packet filtering and BGP Anycast routing.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "shazam_audio_recognition",
    "title": "Design Shazam / Audio Fingerprint Matching Engine",
    "badge": "\ud83c\udfb5",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "100M Songs Identified/Day",
    "qps": "50,000 Match QPS",
    "difficulty": "Hard",
    "goal": "Build an acoustic fingerprint identification engine using spectrogram peak hashing and inverted index lookups in sub-1 second.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "ride_hailing_fare_calc",
    "title": "Design Lyft / Upfront Dynamic Fare Estimation",
    "badge": "\ud83d\ude95",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "500k Fare Quotes/Min",
    "qps": "25,000 Fare QPS",
    "difficulty": "Medium",
    "goal": "Design a dynamic ride fare calculation service combining base rates, distance matrix estimates, traffic congestion, and surge multipliers.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "cloud_vpn_mesh",
    "title": "Design Tailscale / WireGuard Virtual Mesh Network",
    "badge": "\ud83d\udd12",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10M Connected Mesh Nodes",
    "qps": "1,000,000 P2P Tunnels",
    "difficulty": "Hard",
    "goal": "Design a peer-to-peer zero-config VPN mesh network using DERP relay fallbacks, NAT traversal (STUN/ICE), and WireGuard cryptography.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "food_delivery_driver_routing",
    "title": "Design DoorDash / Multi-Stop Driver Route Optimizer",
    "badge": "\ud83d\udef5",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "5M Deliveries/Day",
    "qps": "50,000 Routes/Min",
    "difficulty": "Hard",
    "goal": "Construct an automated vehicle routing engine optimizing driver pickups and multi-restaurant drop-offs to minimize delivery times.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "online_chess_engine",
    "title": "Design Real-Time Multiplayer Chess State Machine",
    "badge": "\u265f\ufe0f",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "10M Concurrent Matches",
    "qps": "100,000 Moves/Sec",
    "difficulty": "Medium",
    "goal": "Design a stateful multiplayer turn-based game engine with move validation, clock synchronization, and anti-cheat telemetry.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "content_moderation_ai",
    "title": "Design Meta / Automated Image & Video Safety Moderation",
    "badge": "\ud83d\udee1\ufe0f",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1B Uploads Scanned/Day",
    "qps": "150,000 Media/Sec",
    "difficulty": "Hard",
    "goal": "Build a high-throughput content moderation pipeline using asynchronous computer vision models, perceptual hashing, and quarantine queues.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "memcached_slab_allocator",
    "title": "Design Memcached / Multithreaded In-Memory Key-Value",
    "badge": "\ud83d\udcbe",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Zero Fragmentation In-Memory Storage",
    "qps": "2,000,000 OPS/Sec",
    "difficulty": "Staff+",
    "goal": "Design a high-performance multithreaded caching daemon with slab memory allocation, LRU list management, and lock striping.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "credit_scoring_engine",
    "title": "Design Experian / Real-Time Credit Score Calculation",
    "badge": "\ud83d\udcb3",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Sub-100ms Credit Score Generation",
    "qps": "10,000 Queries/Sec",
    "difficulty": "Staff+",
    "goal": "Build a credit bureau calculation engine aggregating loan payment histories, credit utilization ratios, and public record databases.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "telecom_sms_gateway",
    "title": "Design Twilio / Global Telecom SMS SMPP Gateway",
    "badge": "\ud83d\udcf1",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1B SMS Dispatched/Day",
    "qps": "50,000 SMS/Sec",
    "difficulty": "Hard",
    "goal": "Design a high-throughput telecom messaging gateway interfacing with global mobile carrier SMPP protocols with delivery receipts.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "realtime_audio_translation",
    "title": "Design Google Translate / Real-Time Voice Translation",
    "badge": "\ud83d\udde3\ufe0f",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "Real-Time Streaming Speech-to-Speech",
    "qps": "25,000 Voice Streams",
    "difficulty": "Staff+",
    "goal": "Construct a low-latency speech-to-speech translation pipeline using streaming ASR, neural machine translation, and text-to-speech synthesis.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "multi_region_active_active",
    "title": "Design Multi-Region Active-Active Database Architecture",
    "badge": "\ud83c\udf10",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "99.999% SLA Global Fault Tolerance",
    "qps": "100,000 Global QPS",
    "difficulty": "Staff+",
    "goal": "Design an active-active multi-region data replication topology resolving cross-region conflicts via Last-Write-Wins and CRDTs.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "people_you_may_know",
    "title": "Design Facebook / People You May Know Recommendation",
    "badge": "\ud83d\udc65",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "3B User Social Graph",
    "qps": "100,000 Graph QPS",
    "difficulty": "Hard",
    "goal": "Build a friend recommendation engine evaluating mutual friend counts, school/workplace clusters, and graph community detection algorithms.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "ml_feature_store_feast",
    "title": "Design Machine Learning Feature Store (Feast/Redis)",
    "badge": "\ud83e\udd16",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Low-Latency Online Feature Retrieval",
    "qps": "200,000 Features/Sec",
    "difficulty": "Hard",
    "goal": "Design an enterprise ML feature store providing point-in-time correct training data and sub-5ms online inference feature lookups.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "smart_thermostat_iot",
    "title": "Design Nest / Smart HVAC Energy Scheduling",
    "badge": "\ud83c\udf21\ufe0f",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "20M Connected Thermostats",
    "qps": "100,000 Pings/Sec",
    "difficulty": "Medium",
    "goal": "Build an automated smart home temperature optimization system analyzing weather forecasts, occupancy sensors, and utility peak pricing.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "digital_signature_pki",
    "title": "Design Cloud Cryptographic PKI Certificate Authority",
    "badge": "\ud83d\udd10",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Automated TLS & Code Signing",
    "qps": "10,000 Certs/Min",
    "difficulty": "Staff+",
    "goal": "Design a private PKI certificate authority automating ACME protocol issuance, CRL distribution, and Hardware Security Module (HSM) keys.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "ll_hls_low_latency_video",
    "title": "Design Twitch / Ultra Low-Latency LL-HLS Video Transcoder",
    "badge": "\ud83d\udcfa",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "Sub-2s Glass-to-Glass Live Latency",
    "qps": "100,000 Live Streams",
    "difficulty": "Staff+",
    "goal": "Construct an ultra-low latency live video streaming delivery pipeline using chunked CMAF segments, LL-HLS manifests, and HTTP/3.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "distributed_job_celery",
    "title": "Design Celery / Distributed Background Task Worker Pool",
    "badge": "\u2699\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "500M Background Tasks/Day",
    "qps": "100,000 Tasks/Sec",
    "difficulty": "Medium",
    "goal": "Build a distributed background worker cluster with rate limiting, task retries with exponential backoff, and prefetch optimization.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "stock_portfolio_pnl",
    "title": "Design Robinhood / Real-Time Portfolio PnL Calculation",
    "badge": "\ud83d\udcc8",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Live Mark-to-Market Asset Valuations",
    "qps": "100,000 Portfolios/Sec",
    "difficulty": "Hard",
    "goal": "Design a real-time portfolio valuation engine that recalculates realized and unrealized gain/loss as live market stock ticks arrive.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "rideshare_driver_onboard",
    "title": "Design Lyft / Driver Background Check OCR Verification",
    "badge": "\ud83d\udcd1",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "Automated ID & Vehicle Inspection",
    "qps": "10,000 Drivers/Day",
    "difficulty": "Medium",
    "goal": "Build an asynchronous driver onboarding verification pipeline performing driver license OCR, DMV record checks, and fraud screening.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "anti_spam_email_filter",
    "title": "Design Gmail / Real-Time Anti-Spam & Phishing Filter",
    "badge": "\ud83d\udce7",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "100B Emails Scanned/Day",
    "qps": "1,000,000 Emails/Sec",
    "difficulty": "Hard",
    "goal": "Design a high-volume email classification pipeline evaluating DKIM/SPF signatures, Bayes heuristics, and deep learning spam models.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "flight_tracker_radar",
    "title": "Design FlightRadar24 / Global ADS-B Aircraft Tracking",
    "badge": "\u2708\ufe0f",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "200k Active Aircraft in Airspace",
    "qps": "100,000 ADS-B Pings/Sec",
    "difficulty": "Medium",
    "goal": "Build a real-time global flight radar tracking aircraft positions using crowdsourced ADS-B receiver telemetry and geospatial indexes.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "automated_parking_gate",
    "title": "Design Smart Parking / Automated ANPR License Plate Gate",
    "badge": "\ud83c\udd7f\ufe0f",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "Sub-500ms License Plate Gate Lift",
    "qps": "5,000 Vehicles/Hour",
    "difficulty": "Medium",
    "goal": "Design an automated parking barrier control system using edge camera ANPR optical character recognition and contactless payment processing.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "hadoop_hdfs_storage",
    "title": "Design Hadoop HDFS / Distributed Big Data File System",
    "badge": "\ud83d\udcc1",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Petabyte Scale Analytics Data Lake",
    "qps": "100,000 Block OPS",
    "difficulty": "Staff+",
    "goal": "Construct a distributed file system architecture with NameNode active/standby metadata journaling and block replication across DataNodes.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "online_survey_polling",
    "title": "Design Slido / Live Interactive Conference Polling",
    "badge": "\ud83d\udcca",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100k Simultaneous Live Voters in 1 Room",
    "qps": "100,000 Votes/Sec",
    "difficulty": "Medium",
    "goal": "Design a real-time live audience polling engine using Redis HyperLogLog for unique vote counting and WebSocket live graph broadcasting.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "podcasts_distribution",
    "title": "Design Apple Podcasts / Global RSS Audio Ingestion",
    "badge": "\ud83c\udf99\ufe0f",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "5M Podcast Feeds Monitored",
    "qps": "50,000 Feed Polls/Min",
    "difficulty": "Medium",
    "goal": "Build a high-volume podcast feed aggregator with polling schedules, audio chapter indexing, and global CDN caching.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "car_rental_reservation",
    "title": "Design Hertz / Global Car Rental Fleet Reservation",
    "badge": "\ud83d\ude97",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "500k Rental Vehicles Worldwide",
    "qps": "10,000 Bookings/Hour",
    "difficulty": "Medium",
    "goal": "Design an availability reservation system managing vehicle categories, airport location inventories, and insurance add-ons.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "notion_block_editor",
    "title": "Design Notion / Block-Based Collaborative Workspace",
    "badge": "\ud83d\udcdd",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100M Block Mutations/Day",
    "qps": "50,000 Block Writes/Sec",
    "difficulty": "Hard",
    "goal": "Construct a block-level collaborative document database using tree-structured page hierarchies and real-time transaction broadcast.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "supply_chain_track",
    "title": "Design DHL / Global Shipping Container Milestone Tracker",
    "badge": "\ud83d\udea2",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "10M Active Ocean Containers",
    "qps": "50,000 IoT Events/Sec",
    "difficulty": "Medium",
    "goal": "Build an IoT and customs milestone tracking pipeline calculating estimated time of arrival (ETA) predictions based on weather data.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "microservices_mesh_envoy",
    "title": "Design Istio / Kubernetes Microservice Mesh Ingress",
    "badge": "\ud83d\udd78\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100,000 Microservice Pods",
    "qps": "5,000,000 Mesh RPS",
    "difficulty": "Staff+",
    "goal": "Design a cloud-native service mesh control plane (Istio Pilot) dynamically configuring Envoy sidecar proxies with mTLS and telemetry.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "continuous_delivery_argo",
    "title": "Design ArgoCD / Declarative GitOps Deployment Controller",
    "badge": "\ud83d\ude80",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10,000 K8s Clusters Managed",
    "qps": "1,000 Syncs/Min",
    "difficulty": "Hard",
    "goal": "Build a GitOps continuous delivery controller that continuously reconciles live Kubernetes cluster state with Git repositories.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "telecom_cell_handoff",
    "title": "Design 5G / High-Speed Cellular Base Station Handoff",
    "badge": "\ud83d\udce1",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Sub-10ms Cell Tower Tower Transition",
    "qps": "500,000 Handoffs/Sec",
    "difficulty": "Staff+",
    "goal": "Design a mobile telecom mobility management entity (MME) coordinating seamless voice and data connection handoffs across 5G cell towers.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "multiplayer_elo_match",
    "title": "Design Valorant / Skill-Based ELO Matchmaking Queue",
    "badge": "\ud83c\udfaf",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "5M Players in Matchmaking Pool",
    "qps": "100,000 Match Pairs/Min",
    "difficulty": "Hard",
    "goal": "Construct a low-latency game matchmaking queue optimizing player rank (MMR/ELO), ping latency (<30ms), and group party sizes.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Real-Time Client App",
        "icon": "\ud83d\udcf1",
        "role": "Emits high-frequency telemetry / pings"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Gateway (Netty)",
        "icon": "\u26a1",
        "role": "Maintains bi-directional TCP sockets"
      },
      {
        "id": "session_store",
        "name": "Presence / Session Store (Redis)",
        "icon": "\ud83d\udd34",
        "role": "Tracks active user nodes in RAM"
      },
      {
        "id": "stream_broker",
        "name": "Event Stream Broker (Kafka)",
        "icon": "\ud83d\udcec",
        "role": "Routes real-time events to active shards"
      },
      {
        "id": "spatial_engine",
        "name": "Stateful Compute Engine",
        "icon": "\u2699\ufe0f",
        "role": "Updates live state & spatial partitions"
      },
      {
        "id": "storage_db",
        "name": "Wide-Column Storage (ScyllaDB)",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists append-only event logs"
      },
      {
        "id": "push_worker",
        "name": "Notification Push Service",
        "icon": "\ud83d\udd14",
        "role": "Dispatches background push if client offline"
      }
    ],
    "correctSequence": [
      "client",
      "ws_gateway",
      "session_store",
      "stream_broker",
      "spatial_engine",
      "storage_db",
      "push_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "web_screenshot_api",
    "title": "Design Headless Chrome / Distributed Screenshot Cluster",
    "badge": "\ud83d\udcf8",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1M High-Resolution Web Captures/Day",
    "qps": "500 Concurrent Browsers",
    "difficulty": "Medium",
    "goal": "Build an elastic rendering fleet using headless Chromium instances with ad-blocking, font rendering, and PNG upload to S3.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "eventbridge_bus",
    "title": "Design AWS EventBridge / Schema-Validated Serverless Event Bus",
    "badge": "\u26a1",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1M Events Filtered & Routed/Sec",
    "qps": "1,000,000 Events/Sec",
    "difficulty": "Hard",
    "goal": "Design a serverless event router applying content-based JSON schema filtering, dead-letter archiving, and fan-out to 50+ target services.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "crypto_order_book",
    "title": "Design Binance / High-Frequency Crypto Order Book",
    "badge": "\ud83e\ude99",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "Sub-Millisecond Crypto Trades",
    "qps": "500,000 Orders/Sec",
    "difficulty": "Staff+",
    "goal": "Construct a high-throughput cryptocurrency spot exchange matching engine with WebSocket market feeds and memory-mapped state journals.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Checkout Client",
        "icon": "\ud83d\udcf1",
        "role": "Initiates financial transaction"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Security",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Terminates TLS and verifies auth tokens"
      },
      {
        "id": "orchestrator",
        "name": "Transaction Orchestrator (Saga)",
        "icon": "\u2699\ufe0f",
        "role": "Coordinates multi-step distributed saga"
      },
      {
        "id": "risk_engine",
        "name": "Real-Time Risk & Fraud Scorer",
        "icon": "\ud83d\udd0d",
        "role": "Executes sub-20ms fraud rule checks"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Store (Redis)",
        "icon": "\ud83d\udd12",
        "role": "Guarantees exact-once processing"
      },
      {
        "id": "ledger_db",
        "name": "Double-Entry Ledger (Postgres)",
        "icon": "\ud83d\udcd1",
        "role": "Commits immutable Debit = Credit rows"
      },
      {
        "id": "webhook_worker",
        "name": "Async Event Dispatcher",
        "icon": "\ud83d\udcec",
        "role": "Emits status webhook with exponential retry"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "orchestrator",
      "risk_engine",
      "idempotency_store",
      "ledger_db",
      "webhook_worker"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "netflix_vector_ann_rec",
    "title": "Design Netflix / Vector Embedding Recommendation Engine",
    "badge": "\ud83c\udfac",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "Approximate Nearest Neighbor (ANN)",
    "qps": "200,000 Recs/Sec",
    "difficulty": "Staff+",
    "goal": "Build a real-time movie recommendation service utilizing user/item embedding vectors, HNSW index graphs, and Milvus vector DB.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile Client",
        "icon": "\ud83c\udf10",
        "role": "Issues search, feed or media request"
      },
      {
        "id": "cdn_edge",
        "name": "Global Edge CDN & WAF",
        "icon": "\u2601\ufe0f",
        "role": "Caches hot static assets & terminates SSL"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "\ud83d\udee1\ufe0f",
        "role": "Enforces token bucket quotas and routing"
      },
      {
        "id": "domain_service",
        "name": "Domain Business Service",
        "icon": "\u2699\ufe0f",
        "role": "Executes core application logic"
      },
      {
        "id": "cache_layer",
        "name": "Distributed In-Memory Cache",
        "icon": "\ud83d\udd34",
        "role": "Serves 80%+ reads in <2ms"
      },
      {
        "id": "search_index",
        "name": "Search Index / Graph Store",
        "icon": "\ud83d\udd0d",
        "role": "Executes complex filter & ranking queries"
      },
      {
        "id": "database",
        "name": "Primary Sharded Database",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Stores persistent source of truth"
      }
    ],
    "correctSequence": [
      "client",
      "cdn_edge",
      "api_gateway",
      "domain_service",
      "cache_layer",
      "search_index",
      "database"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "dynamodb_partition_router",
    "title": "Design DynamoDB / Distributed Partition Key Router",
    "badge": "\ud83d\uddc4\ufe0f",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100M Partition Range Partitions",
    "qps": "10,000,000 IOPS",
    "difficulty": "Staff+",
    "goal": "Construct a horizontally partitioned distributed NoSQL storage engine with B-tree range partitions, Consistent Hashing, and Paxos replicas.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "canary_traffic_router",
    "title": "Design Cloud Canary Traffic Router & Rollback Controller",
    "badge": "\ud83d\ude80",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Automated Zero-Downtime Traffic Shift",
    "qps": "500,000 Mesh RPS",
    "difficulty": "Hard",
    "goal": "Design an automated canary rollout controller that evaluates error rate SLOs and dynamically shifts 1% to 100% traffic via Envoy.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  },
  {
    "id": "database_connection_pooler",
    "title": "Design High-Performance SQL Connection Pooler (PgBouncer)",
    "badge": "\ud83d\udd0c",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "50,000 Client Sockets -> 500 DB Connections",
    "qps": "500,000 Tx/Sec",
    "difficulty": "Hard",
    "goal": "Build a high-concurrency database connection proxy utilizing epoll event loops, transaction pooling, and zero thread-per-connection overhead.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Application Client Node",
        "icon": "\ud83d\udda5\ufe0f",
        "role": "Issues high-throughput RPC / writes"
      },
      {
        "id": "ingress_router",
        "name": "Cluster Ingress Router",
        "icon": "\ud83d\udd00",
        "role": "Routes traffic across consistent hash ring"
      },
      {
        "id": "coordinator",
        "name": "Consensus Leader / Coordinator",
        "icon": "\ud83d\udc51",
        "role": "Coordinates distributed transaction or task"
      },
      {
        "id": "memory_buffer",
        "name": "In-Memory Buffer / Queue",
        "icon": "\u26a1",
        "role": "Absorbs write bursts with backpressure"
      },
      {
        "id": "engine_worker",
        "name": "Distributed Worker Pool",
        "icon": "\u2699\ufe0f",
        "role": "Processes tasks in parallel"
      },
      {
        "id": "storage_cluster",
        "name": "Distributed Storage Engine",
        "icon": "\ud83d\uddc4\ufe0f",
        "role": "Persists partitioned data across failure zones"
      },
      {
        "id": "monitor_agent",
        "name": "Health & Telemetry Agent",
        "icon": "\ud83d\udcca",
        "role": "Monitors node heartbeats and triggers failovers"
      }
    ],
    "correctSequence": [
      "client_app",
      "ingress_router",
      "coordinator",
      "memory_buffer",
      "engine_worker",
      "storage_cluster",
      "monitor_agent"
    ],
    "explanation": "1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
    "keyDesignTakeaways": [
      "Isolate high-frequency query paths with distributed in-memory caching.",
      "Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
      "Implement idempotent processing to guarantee zero side effects on network retries."
    ]
  }
];
