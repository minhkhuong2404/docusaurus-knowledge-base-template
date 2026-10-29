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
    "title": "Design Bitly / High-Throughput URL Shortener",
    "badge": "🔗",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "100M URLs/Mo • 10B Redirects/Mo",
    "qps": "50,000 Read QPS • 40 Write QPS",
    "difficulty": "Medium",
    "goal": "Design a low-latency (<10ms) URL shortening & redirection service handling 100:1 read/write ratio with collision-free ID generation and asynchronous click analytics.",
    "availableNodes": [
      {
        "id": "client",
        "name": "User Browser / Mobile App",
        "icon": "🌐",
        "role": "Sends GET /:shortCode or POST /api/v1/shorten"
      },
      {
        "id": "cdn",
        "name": "Cloudflare Anycast Edge CDN",
        "icon": "☁️",
        "role": "Terminates TLS & caches HTTP 301/302 redirects at edge PoPs"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Rate Limiter",
        "icon": "🛡️",
        "role": "Enforces Token Bucket rate limits & client authentication"
      },
      {
        "id": "short_service",
        "name": "URL Shortener Service",
        "icon": "⚙️",
        "role": "Encodes 64-bit unique IDs into Base62 strings (7 chars)"
      },
      {
        "id": "token_service",
        "name": "Distributed ID Generator (Snowflake/KGS)",
        "icon": "🔢",
        "role": "Pre-allocates collision-free 64-bit ID ranges in RAM"
      },
      {
        "id": "cache",
        "name": "Redis Cluster Cache (LRU)",
        "icon": "⚡",
        "role": "Caches top 20% hot short-to-long URL mappings in RAM"
      },
      {
        "id": "db",
        "name": "Distributed NoSQL DB (DynamoDB / Cassandra)",
        "icon": "🗄️",
        "role": "Persists 6B+ URL mapping records with high availability"
      }
    ],
    "correctSequence": [
      "client",
      "cdn",
      "gateway",
      "short_service",
      "token_service",
      "cache",
      "db"
    ],
    "explanation": "1. Client submits long URL or short link click. 2. Edge CDN terminates TLS and serves cached 301/302 redirects in <5ms. 3. Gateway enforces token-bucket rate limiting. 4. Shortener service converts pre-allocated 64-bit unique integer tokens into 7-character Base62 strings. 5. Token generator service pre-allocates ID batches to avoid DB auto-increment locks. 6. Hot short URLs cached in Redis cluster. 7. DynamoDB / Cassandra provides durable multi-region persistence.",
    "keyDesignTakeaways": [
      "Use Base62 encoding (62^7 = 3.52 trillion URLs) over MD5/SHA hashes to eliminate hash collisions and avoid costly DB lookup retries.",
      "Pre-allocate 64-bit integer ID batches in memory using Snowflake/KGS so write throughput never bottlenecks on database sequences.",
      "Use HTTP 302 Found for tracked/monetized short links to preserve click analytics, or 301 with edge worker telemetry."
    ]
  },
  {
    "id": "netflix_streaming",
    "title": "Design YouTube & Netflix / Video Ingestion & Streaming Platform",
    "badge": "🎬",
    "category": "big_tech",
    "categoryLabel": "Big Tech System (HelloInterview Flagship)",
    "scaleMetric": "500M Viewers • 10M Uploads/Day",
    "qps": "1M Concurrent Streams • 11.6k Streams/s",
    "difficulty": "Hard",
    "goal": "Design a global video ingestion and playback platform supporting multi-gigabyte resumable uploads via S3 Presigned URLs, distributed chunk transcoding (FFmpeg DAG), and low-latency (<200ms) CDN delivery with Adaptive Bitrate Streaming (HLS/DASH).",
    "availableNodes": [
      {
        "id": "creator",
        "name": "Creator Upload Client",
        "icon": "🎥",
        "role": "Streams raw video chunks directly to S3 via Presigned Multipart URLs"
      },
      {
        "id": "upload_gw",
        "name": "API Gateway & Auth Service",
        "icon": "🛡️",
        "role": "Validates session, issues S3 presigned URLs & handles upload callbacks"
      },
      {
        "id": "raw_storage",
        "name": "S3 Raw Master Bucket",
        "icon": "🪣",
        "role": "Stores uncompressed master 4K video with 11 9s durability and fires S3 events"
      },
      {
        "id": "transcode_queue",
        "name": "Transcoding Task Queue (Kafka / SQS)",
        "icon": "📬",
        "role": "Splits video into 10s GOP-aligned chunks across worker DAG queue"
      },
      {
        "id": "transcode_fleet",
        "name": "Distributed Transcoder Fleet (FFmpeg)",
        "icon": "⚙️",
        "role": "Encodes 1080p/720p/480p/360p chunks in parallel and builds .m3u8 manifests"
      },
      {
        "id": "video_cdn",
        "name": "Global Video CDN (Cloudflare / Edge PoP)",
        "icon": "☁️",
        "role": "Caches static .ts chunks in ISP edge PoPs with request coalescing"
      },
      {
        "id": "viewer",
        "name": "Viewer Video Player (Adaptive Bitrate)",
        "icon": "📱",
        "role": "Dynamically requests optimal chunk resolution via HLS/DASH algorithm"
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
    "explanation": "1. Creator requests upload session from API Gateway, receiving time-limited S3 Presigned URLs for resumable multipart uploads (bypassing backend servers to prevent thread and memory exhaustion). 2. Client uploads raw video bytes directly into S3 Raw Master Bucket. 3. S3 fires an ObjectCreated event to Kafka/SQS to trigger the transcoding pipeline. 4. A distributed DAG worker fleet (FFmpeg) splits the raw video into 10-second GOP-aligned segments and transcodes them in parallel across resolutions (1080p, 720p, 480p, 360p), generating the master .m3u8 HLS playlist manifest. 5. Processed chunks are stored in an Output S3 Bucket and distributed to global Anycast CDN edge servers inside ISP networks. 6. Viewer video players fetch the manifest and stream chunks using Adaptive Bitrate Streaming (ABR), dynamically adjusting resolution based on local bandwidth with <200ms startup latency.",
    "keyDesignTakeaways": [
      "Presigned S3 Multipart URLs: Never route multi-gigabyte video binaries through application servers; stream directly from client to Object Storage.",
      "Parallel Chunked DAG Transcoding: Split raw video into 10s GOP-aligned segments so 100+ spot workers can encode resolutions simultaneously in minutes instead of hours.",
      "Two Distinct Pipelines: Strictly separate the high-latency asynchronous Write/Transcoding Pipeline from the low-latency Edge-Cached Read/Playback Pipeline.",
      "Storage Tiering Economics: 90% of views hit top 1% of videos (Pareto distribution); cache hot segments at CDN edge while auto-transitioning cold long-tail videos to S3 Glacier Instant Retrieval."
    ]
  },
  {
    "id": "uber_ride_matching",
    "title": "Design Uber / Real-Time Ride Dispatching",
    "badge": "🚖",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "5M Active Drivers • 100M Daily Trips",
    "qps": "1,250,000 Driver GPS Pings/Sec • <1s Dispatch Latency",
    "difficulty": "Staff+",
    "goal": "Construct a real-time geospatial location ingestion engine, geospatial indexing (H3/S2), and atomic rider-to-driver dispatching pipeline.",
    "availableNodes": [
      {
        "id": "driver_app",
        "name": "Driver GPS Client App",
        "icon": "🚗",
        "role": "Transmits raw lat/lng and status (AVAILABLE/ON_TRIP) every 4 seconds via WebSocket"
      },
      {
        "id": "ws_gateway",
        "name": "WebSocket Connection Gateway (Netty)",
        "icon": "⚡",
        "role": "Maintains 5M persistent bi-directional TCP connections with heartbeat tracking"
      },
      {
        "id": "geo_index",
        "name": "Geospatial Index Cluster (Uber H3 / Redis)",
        "icon": "🌐",
        "role": "Indexes driver coordinates into hierarchical hexagonal cells (Resolution 8) in RAM"
      },
      {
        "id": "rider_service",
        "name": "Rider Ride Request Service",
        "icon": "📱",
        "role": "Receives pickup/dropoff request, queries H3 k-ring neighbors for nearby drivers"
      },
      {
        "id": "dispatch_engine",
        "name": "Atomic Dispatch Matcher (Ringpop)",
        "icon": "🎯",
        "role": "Optimizes supply/demand match, prevents race conditions on driver offers"
      },
      {
        "id": "trip_state_db",
        "name": "Trip State Store (Cassandra / CockroachDB)",
        "icon": "🗄️",
        "role": "Persists linearizable ride state machine: REQUESTED -> MATCHED -> PICKUP -> COMPLETED"
      },
      {
        "id": "eta_service",
        "name": "Dynamic Routing & ETA Engine",
        "icon": "🗺️",
        "role": "Calculates real-time turn-by-turn ETA using live traffic road network graph"
      }
    ],
    "correctSequence": [
      "driver_app",
      "ws_gateway",
      "geo_index",
      "rider_service",
      "dispatch_engine",
      "trip_state_db",
      "eta_service"
    ],
    "explanation": "1. 5M drivers stream GPS pings every 4 seconds over persistent WebSockets. 2. Netty Gateway buffers location updates. 3. Coordinates are converted to Uber H3 hexagonal cell IDs (Resolution 8: ~460m radius) stored in Redis in-memory spatial indexes. 4. Rider requests ride; Rider Service computes the pickup H3 cell and queries `k-ring` neighboring hexagons. 5. Dispatch Engine performs atomic CAS assignment to offer the ride to the optimal driver. 6. Trip State Store commits the ride state machine. 7. ETA engine computes turn-by-turn routing with live traffic.",
    "keyDesignTakeaways": [
      "Hierarchical Hexagonal Spatial Indexing (Uber H3): Hexagons have equidistant neighbors (unlike squares with corners), making radial radius searches (`k-ring`) uniform and computationally cheap.",
      "Decouple Location Ingestion from Persistent Storage: 1.25M GPS pings/sec must be updated in memory (Redis geospatial / memory grids); writing every ping to persistent disk will saturate I/O.",
      "Atomic Driver Lock via Distributed Consensus: When multiple riders request trips in the same dense block, lock driver assignment with atomic CAS (Compare-And-Swap) in Redis to prevent multiple offers to the same driver."
    ]
  },
  {
    "id": "twitter_news_feed",
    "title": "Design Twitter / X Scalable Newsfeed",
    "badge": "🐦",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "300M DAU • 500M Tweets/Day",
    "qps": "6,000 Tweet QPS • 600,000 Timeline Read QPS",
    "difficulty": "Hard",
    "goal": "Build a hybrid Fan-Out on Write vs Fan-Out on Read architecture capable of handling viral celebrities and millions of real-time timeline feeds.",
    "availableNodes": [
      {
        "id": "client",
        "name": "Twitter Web / Mobile Client",
        "icon": "📱",
        "role": "Posts tweets and requests home timeline feeds"
      },
      {
        "id": "gateway",
        "name": "API Gateway & Auth Proxy",
        "icon": "🛡️",
        "role": "Terminates TLS, authenticates user sessions, and routes traffic"
      },
      {
        "id": "tweet_service",
        "name": "Tweet Write & Snowflake Service",
        "icon": "✍️",
        "role": "Assigns 64-bit Snowflake IDs and persists tweet to KV store"
      },
      {
        "id": "fanout_queue",
        "name": "Fan-Out Message Bus (Kafka / Pulsar)",
        "icon": "📬",
        "role": "Buffers tweet fan-out tasks partitioned by follower segments"
      },
      {
        "id": "fanout_workers",
        "name": "Fan-Out Compute Workers",
        "icon": "⚙️",
        "role": "Executes hybrid push-pull fanout into active follower timeline caches"
      },
      {
        "id": "timeline_cache",
        "name": "Timeline Cache (Redis Cluster)",
        "icon": "⚡",
        "role": "Stores pre-computed list of top 800 tweet IDs per active user"
      },
      {
        "id": "timeline_service",
        "name": "Home Timeline Aggregator",
        "icon": "📖",
        "role": "Merges pre-computed Redis timeline with celebrity pull tweets in <50ms"
      }
    ],
    "correctSequence": [
      "client",
      "gateway",
      "tweet_service",
      "fanout_queue",
      "fanout_workers",
      "timeline_cache",
      "timeline_service"
    ],
    "explanation": "1. User submits tweet to API Gateway. 2. Gateway authenticates and routes to Tweet Service. 3. Tweet Service generates 64-bit Snowflake ID and stores tweet in document KV store. 4. Fan-Out queue receives task. 5. Fan-Out workers evaluate author follower count: for normal users, pushes tweet ID into follower Redis timeline lists (Fan-Out on Write). 6. For celebrities (>100k followers), skips push to prevent write explosion. 7. When follower requests feed, Timeline Service fetches Redis list, pulls recent celebrity tweets, merges in RAM, and returns feed in <50ms.",
    "keyDesignTakeaways": [
      "Hybrid Fan-Out Architecture: Push model for normal users guarantees sub-50ms reads; pull model for celebrities prevents write amplification explosions.",
      "Pre-computed Timeline Lists: Keep only top 800 tweet IDs in Redis RAM; paginate older tweets from disk on demand.",
      "Lazy Hydration for Inactive Users: Expire timeline cache for users inactive for >7 days; re-hydrate on login to conserve hundreds of gigabytes of RAM."
    ]
  },
  {
    "id": "stripe_payments",
    "title": "Design Stripe / Core Payment Gateway",
    "badge": "💳",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "$1 Trillion Volume • 500M Transactions/Day",
    "qps": "15,000 Payment Charges/Sec • 99.999% Availability",
    "difficulty": "Staff+",
    "goal": "Build an idempotent payment orchestration pipeline with distributed deduplication, fraud scoring, external PSP execution, and double-entry ledgering.",
    "availableNodes": [
      {
        "id": "merchant_client",
        "name": "Merchant Web / Mobile SDK",
        "icon": "🛒",
        "role": "Collects credit card via Elements SDK and receives tokenized payment method ID"
      },
      {
        "id": "api_gateway",
        "name": "Stripe Edge Gateway (mTLS)",
        "icon": "🛡️",
        "role": "Enforces PCI-DSS tokenization, rate limits, and API secret key verification"
      },
      {
        "id": "idempotency_store",
        "name": "Idempotency Cache (Redis Cluster)",
        "icon": "🔒",
        "role": "Atomically locks Idempotency-Key with status: IN_PROGRESS / SUCCEEDED"
      },
      {
        "id": "payment_orchestrator",
        "name": "Payment Orchestrator (Saga Engine)",
        "icon": "⚙️",
        "role": "Orchestrates charge lifecycle: authorization, 3DS challenge, settlement"
      },
      {
        "id": "fraud_radar",
        "name": "Stripe Radar ML Scorer",
        "icon": "🔍",
        "role": "Calculates real-time risk score (<30ms) using machine learning fraud rules"
      },
      {
        "id": "card_network_gw",
        "name": "Card Network Gateway (Visa / MC)",
        "icon": "💳",
        "role": "Submits ISO 8583 authorization request to acquiring bank and card schemes"
      },
      {
        "id": "double_entry_ledger",
        "name": "Immutable Double-Entry Ledger (Postgres)",
        "icon": "📑",
        "role": "Records immutable debit and credit entries guaranteeing balance integrity"
      }
    ],
    "correctSequence": [
      "merchant_client",
      "api_gateway",
      "idempotency_store",
      "payment_orchestrator",
      "fraud_radar",
      "card_network_gw",
      "double_entry_ledger"
    ],
    "explanation": "1. Merchant SDK collects payment details and exchanges with Stripe Vault for tokenized `pm_card_xxx` (raw PAN never touches merchant backend). 2. Edge Gateway checks API key and mTLS. 3. Redis checks user-supplied `Idempotency-Key` to block duplicate charges. 4. Payment Orchestrator runs Saga. 5. Stripe Radar evaluates fraud risk score in <30ms. 6. Card Network Gateway routes ISO 8583 packet to Visa/Mastercard. 7. On approval, immutable Double-Entry Ledger commits equal debit and credit journal entries.",
    "keyDesignTakeaways": [
      "PCI-DSS Tokenization Isolation: Raw primary account numbers (PAN) must never enter application servers; tokenize cards at the client level into single-use tokens stored in an isolated HSM vault.",
      "Atomic Idempotency Locking: Use atomic Redis `SET NX EX` on `idempotency_key` with payload hash validation to guarantee that network retries never double-charge customers.",
      "Double-Entry Accounting Invariant: Every financial transaction must write matching Debit and Credit rows within a serializable database transaction (`SUM(amount) == 0`)."
    ]
  },
  {
    "id": "whatsapp_chat",
    "title": "Design WhatsApp / Real-Time Messenger",
    "badge": "💬",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "2 Billion Users • 100 Billion Messages/Day",
    "qps": "1,200,000 Msg/Sec Peak • End-to-End Encrypted (Signal Protocol)",
    "difficulty": "Hard",
    "goal": "Construct an end-to-end encrypted real-time chat architecture supporting persistent WebSockets, ephemeral message routing, offline queues, and push notifications.",
    "availableNodes": [
      {
        "id": "sender_client",
        "name": "Sender Mobile Client",
        "icon": "📱",
        "role": "Encrypts message body locally using Signal Double Ratchet protocol with recipient public key"
      },
      {
        "id": "chat_gateway",
        "name": "Chat Gateway Cluster (Erlang / BEAM)",
        "icon": "⚡",
        "role": "Maintains persistent lightweight TCP/TLS connections (millions of concurrent sockets per node)"
      },
      {
        "id": "presence_service",
        "name": "User Presence & Session Store (Redis)",
        "icon": "🔴",
        "role": "Tracks user online status, last seen timestamp, and current connected gateway server ID"
      },
      {
        "id": "message_router",
        "name": "Message Dispatcher & Routing Engine",
        "icon": "⚙️",
        "role": "Determines recipient online status: if online, pushes over socket; if offline, buffers in mailbox"
      },
      {
        "id": "offline_mailbox",
        "name": "Offline Spool / Mailbox Queue (Cassandra)",
        "icon": "📬",
        "role": "Stores unread messages until recipient reconnects; deleted immediately upon delivery receipt"
      },
      {
        "id": "recipient_client",
        "name": "Recipient Mobile Client",
        "icon": "📲",
        "role": "Receives encrypted ciphertext payload, decrypts locally, and sends delivery ACK"
      },
      {
        "id": "push_service",
        "name": "Push Notification Service (APNs / FCM)",
        "icon": "🔔",
        "role": "Wakes sleeping recipient mobile device via Apple/Google push notification service"
      }
    ],
    "correctSequence": [
      "sender_client",
      "chat_gateway",
      "presence_service",
      "message_router",
      "offline_mailbox",
      "recipient_client",
      "push_service"
    ],
    "explanation": "1. Sender encrypts payload on device with Signal Double Ratchet algorithm. 2. Message hits Erlang Chat Gateway over persistent TCP socket. 3. Gateway checks Redis Presence Service to find which Gateway server holds recipient's active connection. 4. Message Router routes packet directly to recipient's Gateway. 5. If recipient is offline, message is spooled in Cassandra mailbox and push notification is sent via FCM/APNs. 6. Once recipient connects, spooled messages are delivered and deleted from server storage. 7. Double checkmarks (sent, delivered, read) propagate back to sender.",
    "keyDesignTakeaways": [
      "Store-and-Forward Ephemeral Architecture: End-to-end encrypted messaging requires no permanent message database; servers act as ephemeral transit conduits, deleting messages from disk immediately upon delivery ACK.",
      "Erlang / BEAM Lightweight Actor Processes: WhatsApp achieved 2M+ concurrent TCP connections per single server using FreeBSD and Erlang processes, which consume only ~2KB of RAM per connection compared to OS threads.",
      "Client-Side Double Ratchet Encryption: Server has zero visibility into plaintext contents; group messaging uses sender keys rotated per epoch to avoid N^2 fan-out encryption overhead."
    ]
  },
  {
    "id": "ticketmaster_booking",
    "title": "Design Ticketmaster / High-Concurrency Booking",
    "badge": "🎟️",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100k Arena Capacity • 5M Fans in Waiting Room",
    "qps": "500,000 Seat Requests/Sec • Zero Double Booking",
    "difficulty": "Staff+",
    "goal": "Design a high-concurrency ticket reservation engine with virtual waiting rooms, Redis distributed seat locks with TTL, and zero overselling.",
    "availableNodes": [
      {
        "id": "fan_client",
        "name": "Fan Mobile / Web App",
        "icon": "🎟️",
        "role": "Renders interactive stadium seat map and submits seat reservation hold"
      },
      {
        "id": "virtual_queue",
        "name": "Virtual Waiting Room (Queue-it / Redis)",
        "icon": "⏳",
        "role": "Meters and throttles 5M fans, admitting 500 users/second via cryptographically signed JWT passes"
      },
      {
        "id": "edge_router",
        "name": "API Gateway & Security Proxy",
        "icon": "🛡️",
        "role": "Validates queue admission tokens and blocks automated scalper botnets"
      },
      {
        "id": "seat_lock_store",
        "name": "Distributed Seat Lock Store (Redis Redlock)",
        "icon": "🔒",
        "role": "Applies atomic 10-minute seat lock in RAM: `SETNX seat:{eventId}:{seatId} userId EX 600`"
      },
      {
        "id": "booking_service",
        "name": "Transactional Booking Service",
        "icon": "⚙️",
        "role": "Coordinates seat hold state transitions: AVAILABLE -> HELD -> RESERVED -> SOLD"
      },
      {
        "id": "booking_db",
        "name": "ACID Booking Database (PostgreSQL Sharded)",
        "icon": "💾",
        "role": "Persists final ticket issuance with pessimistic locking and row version check"
      },
      {
        "id": "payment_worker",
        "name": "Payment Settlement Worker",
        "icon": "💳",
        "role": "Finalizes payment before 10-minute hold expires; triggers auto-release on failure"
      }
    ],
    "correctSequence": [
      "fan_client",
      "virtual_queue",
      "edge_router",
      "seat_lock_store",
      "booking_service",
      "booking_db",
      "payment_worker"
    ],
    "explanation": "1. 5M fans queue for Taylor Swift tickets; Virtual Waiting Room queues traffic and admits 500 users/sec with signed JWT queue passes. 2. API Gateway verifies queue tokens. 3. Fan clicks Seat 42; Seat Lock Store executes atomic Redis `SET seat:101:42 user_99 NX EX 600`. If key exists, reject immediately with <2ms latency (Zero DB hits). 4. Booking Service creates a 10-minute pending booking. 5. Booking DB commits seat status as HELD. 6. Payment worker processes credit card charge. On success, status becomes SOLD. If payment times out, Redis TTL releases the seat back to AVAILABLE.",
    "keyDesignTakeaways": [
      "Virtual Waiting Room (Queue Throttling): Never expose primary ticket databases to 5M concurrent users; meter incoming traffic through an edge waiting room admitting a steady trickle (e.g. 500 checkouts/sec).",
      "Atomic Seat Hold via Redis Distributed Lock: Use `SET seat:{id} {userId} NX EX 600` to guarantee that only one fan can hold a specific seat at any instant, eliminating relational DB deadlocks.",
      "TTL Auto-Release Expiration: Attach a 10-minute expiration timer to held seats; if the fan fails to complete payment within 600 seconds, the lock expires automatically without requiring manual rollback scripts."
    ]
  },
  {
    "id": "dropbox_file_sync",
    "title": "Design Dropbox / Cloud File Synchronization",
    "badge": "📁",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "700M Users • 100M Sync Events/Day",
    "qps": "25,000 Sync QPS • 50 PB Storage",
    "difficulty": "Hard",
    "goal": "Build a cross-device file synchronization service with block-level delta chunking, rolling SHA-256 deduplication, and real-time desktop notifications.",
    "availableNodes": [
      {
        "id": "desktop_client",
        "name": "Desktop Sync Daemon",
        "icon": "💻",
        "role": "Monitors file system changes and chunks files via Rabin fingerprinting"
      },
      {
        "id": "sync_gateway",
        "name": "Sync API Gateway",
        "icon": "🛡️",
        "role": "Validates client sessions and negotiates chunk upload delta lists"
      },
      {
        "id": "meta_service",
        "name": "File Metadata Service",
        "icon": "🗂️",
        "role": "Maintains folder trees, permissions, and multi-device Version Vectors"
      },
      {
        "id": "chunk_storage",
        "name": "Block Storage Engine (S3 / CAS)",
        "icon": "🪣",
        "role": "Stores immutable 4MB chunks indexed by SHA-256 hash (deduplicated)"
      },
      {
        "id": "commit_db",
        "name": "Metadata DB (CockroachDB / MySQL)",
        "icon": "💾",
        "role": "Performs atomic commit of new file version vectors across devices"
      },
      {
        "id": "notify_service",
        "name": "Real-Time Notification Gateway",
        "icon": "🔔",
        "role": "Pushes sync update events to other paired user devices over WebSocket"
      },
      {
        "id": "mobile_client",
        "name": "Secondary Synced Device",
        "icon": "📱",
        "role": "Receives sync alert and downloads only changed delta blocks"
      }
    ],
    "correctSequence": [
      "desktop_client",
      "sync_gateway",
      "meta_service",
      "chunk_storage",
      "commit_db",
      "notify_service",
      "mobile_client"
    ],
    "explanation": "1. Desktop daemon monitors filesystem and splits changed file into 4MB chunks using Rabin fingerprinting. 2. Client queries Sync Gateway with chunk SHA-256 hashes. 3. Metadata service checks which hashes already exist in cloud storage (Content-Addressable Storage deduplication). 4. Client uploads only newly added/modified chunks directly to S3. 5. Metadata DB commits new file version vector atomically. 6. Notification service pushes WebSocket event to user other paired devices. 7. Secondary devices download only missing chunks.",
    "keyDesignTakeaways": [
      "Content-Defined Chunking (CDC): Rabin fingerprinting splits files based on content boundaries so small edits do not shift subsequent chunk hashes.",
      "Content-Addressable Storage (CAS): Keying chunks by SHA-256 hash guarantees instant global cross-user deduplication.",
      "Version Vectors: Detect and flag concurrent offline edits on multiple devices without silent data loss."
    ]
  },
  {
    "id": "youtube_top_k",
    "title": "Design YouTube / Top K Trending Videos (HelloInterview)",
    "badge": "📈",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10 Billion Daily Video Views • 100M Distinct Videos",
    "qps": "150,000 View Events/Sec • 1-Hour Sliding Window",
    "difficulty": "Hard",
    "goal": "Design a real-time stream aggregation engine calculating Top K trending videos in a 1-hour tumbling window using Count-Min Sketch and Min-Heap.",
    "availableNodes": [
      {
        "id": "viewer_client",
        "name": "Video Player Client",
        "icon": "📱",
        "role": "Emits video watch heartbeat events every 30 seconds of continuous playback"
      },
      {
        "id": "event_collector",
        "name": "Telemetry Ingestion Gateway",
        "icon": "⚡",
        "role": "Terminates playback beacons, drops bot replay spam, and buffers view stream"
      },
      {
        "id": "kafka_stream",
        "name": "View Event Stream (Kafka)",
        "icon": "📬",
        "role": "Partitions view events by `video_id` across 256 topic partitions"
      },
      {
        "id": "local_sketch_workers",
        "name": "Local Count-Min Sketch Workers (Flink)",
        "icon": "⚙️",
        "role": "Maintains sub-linear memory frequency tables per partition (Count-Min Sketch + Min-Heap)"
      },
      {
        "id": "central_reducer",
        "name": "Central Top-K Reducer (Global Min-Heap)",
        "icon": "👑",
        "role": "Merges local Top 100 heaps every 60 seconds into global top 100 trending ranking"
      },
      {
        "id": "trending_cache",
        "name": "Trending Feed Cache (Redis / Memcached)",
        "icon": "🔴",
        "role": "Stores active top 100 trending video list in memory with 60-second TTL"
      },
      {
        "id": "trending_api",
        "name": "Trending Query API Service",
        "icon": "🌐",
        "role": "Serves `/api/v1/trending` to millions of app homepages with <5ms latency"
      }
    ],
    "correctSequence": [
      "viewer_client",
      "event_collector",
      "kafka_stream",
      "local_sketch_workers",
      "central_reducer",
      "trending_cache",
      "trending_api"
    ],
    "explanation": "1. Millions of players emit watch heartbeats. 2. Collector filters bot spam. 3. Kafka partitions views by `video_id`. 4. Local Flink stream workers count views in memory using a Count-Min Sketch and maintain a local top-100 Min-Heap over a 1-hour sliding window. 5. Central Reducer periodically collects local heaps and merges them into a global Top 100 list. 6. Global ranking pushed to Redis cache every minute. 7. Trending API serves cached list with <5ms latency.",
    "keyDesignTakeaways": [
      "Heavy Hitters / Count-Min Sketch: Storing exact counts for 100M distinct videos in real time requires hundreds of gigabytes of RAM; Count-Min Sketch approximates counts with bounded error (epsilon, delta) in megabytes.",
      "Two-Stage MapReduce Aggregation: Never route all 150k events/sec to a single reducer node; aggregate counts locally on stream workers first, sending only the top 100 candidates to the central coordinator.",
      "Sliding vs Tumbling Windows: A 1-hour sliding window updated every 60 seconds provides fresh, smooth trending rankings without jarring sudden cliff drops at the top of the hour."
    ]
  },
  {
    "id": "google_web_crawler",
    "title": "Design Web Crawler / Distributed Search Indexer",
    "badge": "🕷️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10 Billion Web Pages • 1PB Ingested Content",
    "qps": "25,000 Pages Crawled/Sec • Politeness & Robots.txt Compliance",
    "difficulty": "Staff+",
    "goal": "Build a distributed, polite web crawler pipeline with URL frontier priority queuing, duplicate content hashing, and robots.txt compliance.",
    "availableNodes": [
      {
        "id": "url_seed_scheduler",
        "name": "URL Frontier Scheduler",
        "icon": "🌱",
        "role": "Prioritizes seed URLs and enqueues unvisited URLs based on PageRank and domain freshness"
      },
      {
        "id": "politeness_frontier",
        "name": "Politeness & Host Delay Queue",
        "icon": "📬",
        "role": "Enforces 1 request/second per host domain to prevent overwhelming target web servers"
      },
      {
        "id": "dns_cache_resolver",
        "name": "In-Memory DNS Resolver Cache",
        "icon": "🌐",
        "role": "Caches DNS records in RAM (<1ms) to eliminate DNS server lookup bottlenecks at 25k QPS"
      },
      {
        "id": "html_fetcher_fleet",
        "name": "Distributed HTML Fetcher Fleet (Go / Netty)",
        "icon": "⚡",
        "role": "Downloads web page content over HTTP/2, parses and respects `robots.txt` disallow rules"
      },
      {
        "id": "content_dedup_simhash",
        "name": "SimHash Content Deduplicator",
        "icon": "🔍",
        "role": "Calculates 64-bit fingerprint of HTML text; skips near-duplicate scraped mirror pages"
      },
      {
        "id": "link_extractor_filter",
        "name": "HTML Parser & Link Extractor",
        "icon": "⚙️",
        "role": "Extracts absolute links (`href`), normalizes relative paths, and tests Bloom filter for seen URLs"
      },
      {
        "id": "s3_warc_archive",
        "name": "WARC Raw HTML Blob Archive (S3)",
        "icon": "🗄️",
        "role": "Compresses and archives raw crawled HTML in standardized WARC files for search indexers"
      }
    ],
    "correctSequence": [
      "url_seed_scheduler",
      "politeness_frontier",
      "dns_cache_resolver",
      "html_fetcher_fleet",
      "content_dedup_simhash",
      "link_extractor_filter",
      "s3_warc_archive"
    ],
    "explanation": "1. URL Frontier Scheduler prioritizes links. 2. Politeness queue routes URLs into per-domain queues with minimum 1-second delay timers. 3. Custom DNS cache resolves IP in microseconds. 4. Fetcher fleet downloads page respecting robots.txt. 5. SimHash detects near-duplicate content (skips mirrors). 6. Link extractor normalizes URLs; checks Bloom filter to avoid re-crawling visited pages. 7. Raw HTML compressed and saved to S3 in WARC format for indexing.",
    "keyDesignTakeaways": [
      "Politeness is Mandatory: Never fire uncontrolled concurrent threads at a single domain; use two-tier queueing: Priority Queues (importance) mapped into Politeness Queues (one queue per host with delay timer).",
      "Near-Duplicate Content Detection (SimHash / MinHash): Web is full of cloned sites and syndication; SimHash produces 64-bit hashes where Hamming distance <= 3 indicates near-identical text despite different ads.",
      "Bloom Filter for Visited URLs: Testing 10B URLs on disk requires massive I/O; an in-memory Bloom filter with 10B bits (~1.2 GB RAM) checks visited status in O(1) time with 0 disk reads."
    ]
  },
  {
    "id": "amazon_flash_sale",
    "title": "Design Amazon / Lightning Deals Flash Sale",
    "badge": "🛍️",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100k Items • 10M Concurrent Buyers",
    "qps": "200,000 Checkout Claims/Sec • Zero Oversell",
    "difficulty": "Hard",
    "goal": "Design a flash sale inventory reservation system with zero overselling, in-memory atomic decrement, and asynchronous checkout order queues.",
    "availableNodes": [
      {
        "id": "buyer_app",
        "name": "Shopper Mobile / Web Client",
        "icon": "🛒",
        "role": "Taps 'Claim Deal' at exact flash drop second (e.g. 10:00:00 AM)"
      },
      {
        "id": "api_gw",
        "name": "Flash Sale Edge Gateway & Rate Limiter",
        "icon": "🛡️",
        "role": "Blocks botnet scripts with CAPTCHA and token bucket rate limits"
      },
      {
        "id": "redis_stock",
        "name": "Atomic Stock Decrement Store (Redis Lua)",
        "icon": "⚡",
        "role": "Executes atomic DECRBY in RAM to guarantee zero overselling with 0 DB queries"
      },
      {
        "id": "order_queue",
        "name": "Order Creation Bus (Kafka / SQS)",
        "icon": "📬",
        "role": "Buffers successful inventory claims for asynchronous transactional processing"
      },
      {
        "id": "order_service",
        "name": "Order Processing Worker Fleet",
        "icon": "⚙️",
        "role": "Consumes order claims, assigns 15-minute checkout reservation hold"
      },
      {
        "id": "order_db",
        "name": "Transactional Order DB (Aurora PostgreSQL)",
        "icon": "💾",
        "role": "Commits order record with ACID serializable isolation"
      },
      {
        "id": "payment_gateway",
        "name": "Payment Gateway Adapter",
        "icon": "💳",
        "role": "Charges customer card within 15-minute reservation window"
      }
    ],
    "correctSequence": [
      "buyer_app",
      "api_gw",
      "redis_stock",
      "order_queue",
      "order_service",
      "order_db",
      "payment_gateway"
    ],
    "explanation": "1. Millions of buyers tap 'Claim Deal' at 10:00:00 AM. 2. Edge Gateway validates user auth and blocks scripted bots. 3. Redis executes atomic Lua script: `if stock > 0 then decrby(1); return SUCCESS; else return SOLD_OUT; end`. This absorbs 200k claims/sec in RAM in <2ms with zero database locking. 4. Successful claims pushed to Kafka order queue. 5. Order worker fleet assigns a 15-minute inventory hold. 6. Order DB records order state. 7. Payment gateway settles funds. If payment fails or timer expires, inventory returns to Redis stock.",
    "keyDesignTakeaways": [
      "In-Memory Atomic Decrement (Redis Lua): Never run `UPDATE items SET stock = stock - 1 WHERE stock > 0` on relational databases during flash sales; 200k concurrent write transactions will lock table rows and crash MySQL.",
      "Decouple Reservation from Payment: Reserve stock in Redis instantly in <2ms, then give the user 15 minutes to enter credit card details through an asynchronous queue.",
      "Inventory Hold Expiration Lease: Track 15-minute checkout timers with Redis TTL; if user abandons cart, automatically increment Redis stock back so other buyers can purchase."
    ]
  },
  {
    "id": "stock_matching_engine",
    "title": "Design Stock Exchange Matching Engine",
    "badge": "📊",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100M Orders/Day • Multi-Asset",
    "qps": "1,000,000 Orders/Sec • Sub-Microsecond",
    "difficulty": "Staff+",
    "goal": "Design an ultra-low latency stock order matching engine using LMAX Disruptor RingBuffer, in-memory Order Book (B-Tree/SkipList), and WAL logging.",
    "availableNodes": [
      {
        "id": "trader_terminal",
        "name": "Algorithmic Trader / FIX Client",
        "icon": "🖥️",
        "role": "Submits Buy/Sell Limit and Market orders over raw TCP / FIX protocol"
      },
      {
        "id": "fix_gateway",
        "name": "FIX Protocol Gateway & Risk Check",
        "icon": "🛡️",
        "role": "Validates message formats, verifies account margin limits in <10 microseconds"
      },
      {
        "id": "disruptor_ring",
        "name": "LMAX Disruptor Lock-Free RingBuffer",
        "icon": "⚡",
        "role": "Zero-allocation, inter-thread lock-free circular buffer passing orders to matching core"
      },
      {
        "id": "order_book_engine",
        "name": "In-Memory Order Book (Price-Time Priority)",
        "icon": "📈",
        "role": "Matches orders using B-Tree / Doubly-Linked Lists in CPU cache with zero heap allocations"
      },
      {
        "id": "trade_journal",
        "name": "Sequential NVMe Write-Ahead Log (WAL)",
        "icon": "💾",
        "role": "Appends matched trades to sequential NVMe SSD journal for deterministic replay"
      },
      {
        "id": "market_data_broadcaster",
        "name": "Market Data Multicast Feed (UDP / ITCH)",
        "icon": "📡",
        "role": "Broadcasts real-time Level 2 (L2) book changes and trade ticks to all market participants"
      },
      {
        "id": "clearing_service",
        "name": "Post-Trade Clearing & Settlement Ledger",
        "icon": "🏦",
        "role": "Asynchronously processes multi-broker margin transfers and custodial clearing"
      }
    ],
    "correctSequence": [
      "trader_terminal",
      "fix_gateway",
      "disruptor_ring",
      "order_book_engine",
      "trade_journal",
      "market_data_broadcaster",
      "clearing_service"
    ],
    "explanation": "1. Trader submits order via FIX protocol. 2. Gateway performs pre-trade risk checks in <10μs. 3. Order written to lock-free LMAX Disruptor circular RingBuffer. 4. Order Book Core (single-threaded CPU pinned) matches order following Price-Time Priority in <500 nanoseconds with zero GC allocations. 5. Matched execution immediately written to sequential NVMe WAL journal. 6. Market data engine broadcasts trade execution to all market participants via UDP Multicast. 7. Asynchronous clearing worker settles cash and stock balances.",
    "keyDesignTakeaways": [
      "Single-Threaded Pinned CPU Execution: Multi-threaded locks and context switching destroy microsecond latency; pinning matching logic to a single dedicated CPU core processes 1M+ orders/sec with zero lock contention.",
      "LMAX Disruptor RingBuffer: Replaces standard Java/Go blocking queues with lock-free circular ring buffers using memory barriers and cache-line padding to prevent false sharing.",
      "Zero Garbage Collection (GC) Allocations: Pre-allocate all order and trade objects in fixed-size off-heap ring buffers to guarantee zero JVM / runtime GC stop-the-world pauses."
    ]
  },
  {
    "id": "hotel_booking_airbnb",
    "title": "Design Airbnb / Hotel Reservation System",
    "badge": "🏡",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "10M Listings • 100M Bookings/Year",
    "qps": "10,000 Availability Searches/Sec • 200 Booking/s",
    "difficulty": "Hard",
    "goal": "Design a hotel room booking engine preventing double bookings with 2-Phase Locking (2PL), availability calendars, and payment sagas.",
    "availableNodes": [
      {
        "id": "traveler_app",
        "name": "Guest Mobile App / Web Client",
        "icon": "🧳",
        "role": "Searches listings by city/dates and initiates room reservation"
      },
      {
        "id": "api_gw",
        "name": "API Gateway & Auth Proxy",
        "icon": "🛡️",
        "role": "Validates user JWT token, enforces rate limits, and routes requests"
      },
      {
        "id": "calendar_cache",
        "name": "Availability Calendar Cache (Redis Bitmaps)",
        "icon": "📅",
        "role": "Stores daily availability for 365 days as a 365-bit bitmap in RAM"
      },
      {
        "id": "booking_service",
        "name": "Booking Orchestrator Service",
        "icon": "⚙️",
        "role": "Checks date range overlaps and coordinates two-phase booking hold with idempotency"
      },
      {
        "id": "payment_saga",
        "name": "Payment Saga Coordinator",
        "icon": "💳",
        "role": "Executes credit card charge with automated compensating refund on failure"
      },
      {
        "id": "reservation_db",
        "name": "Reservation DB (Postgres / Spanner)",
        "icon": "💾",
        "role": "Stores bookings with Exclusion Constraints (`EXCLUDE USING gist`) to prevent double-booking"
      },
      {
        "id": "host_notifier",
        "name": "Host Notification Service",
        "icon": "🔔",
        "role": "Alerts property host via SMS/Push and updates calendar export (iCal)"
      }
    ],
    "correctSequence": [
      "traveler_app",
      "api_gw",
      "calendar_cache",
      "booking_service",
      "payment_saga",
      "reservation_db",
      "host_notifier"
    ],
    "explanation": "1. Guest enters destination and date range (Check-in: Oct 10, Check-out: Oct 15). 2. Gateway routes to search service. 3. Redis Calendar Cache checks 365-day availability bitwise (each day is 1 bit; bitwise AND across requested dates verifies availability in <1ms). 4. Booking service creates a temporary 10-minute hold with a unique idempotency key. 5. Payment Saga charges guest card. 6. PostgreSQL reservation table commits booking using GIST exclusion constraints (`tsrange` overlap prevention). 7. Host notification dispatched and calendar synced.",
    "keyDesignTakeaways": [
      "PostgreSQL GiST Exclusion Constraints: Use native date range types (`tsrange(check_in, check_out)`) with `EXCLUDE USING gist` to enforce physical impossibility of double-booking at the database engine level.",
      "365-Bit Availability Bitmaps: Representing listing availability as a 365-bit array (only 46 bytes per listing) in Redis allows testing date range availability across 10 million listings in milliseconds.",
      "Idempotent Payment Sagas: If the payment gateway succeeds but the network times out before writing to the database, the booking coordinator reconciles via the same idempotency key rather than double-charging."
    ]
  },
  {
    "id": "crypto_wallet_ledger",
    "title": "Design Coinbase / Crypto Custody Ledger",
    "badge": "🪙",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100M Wallets • $100B Assets Under Custody",
    "qps": "10,000 Transfers/Sec • Strict Cold/Hot Security",
    "difficulty": "Staff+",
    "goal": "Build a high-security cryptocurrency custody ledger with cold/hot wallet separation, multi-signature threshold schemes, and double-entry reconciliation.",
    "availableNodes": [
      {
        "id": "wallet_user",
        "name": "Crypto App Client",
        "icon": "📱",
        "role": "Submits transfer / withdrawal request with biometric multi-factor auth"
      },
      {
        "id": "auth_gateway",
        "name": "Zero-Trust Security Gateway",
        "icon": "🛡️",
        "role": "Validates API tokens, device fingerprinting, and enforces withdrawal address whitelists"
      },
      {
        "id": "mpc_signer",
        "name": "Multi-Party Computation (MPC) Key Vault",
        "icon": "🔐",
        "role": "Co-signs transaction thresholds (2-of-3 key shards) inside Hardware Security Modules (HSM)"
      },
      {
        "id": "tx_orchestrator",
        "name": "Transfer Verification & Double-Spend Engine",
        "icon": "⚙️",
        "role": "Verifies account balance, applies gas fees, and checks anti-money laundering (AML)"
      },
      {
        "id": "immutable_ledger",
        "name": "Cryptographic Double-Entry Ledger DB",
        "icon": "📒",
        "role": "Records immutable debit/credit entries with SHA-256 hash chaining"
      },
      {
        "id": "node_broadcaster",
        "name": "Blockchain RPC Node Broadcaster",
        "icon": "⛓️",
        "role": "Broadcasts signed raw transaction to Bitcoin / Ethereum mempools"
      },
      {
        "id": "block_indexer",
        "name": "Block Confirmation Indexer",
        "icon": "🔍",
        "role": "Monitors blockchain depth (e.g. 6 confirmations on BTC, 12 on ETH) to finalize withdrawal"
      }
    ],
    "correctSequence": [
      "wallet_user",
      "auth_gateway",
      "mpc_signer",
      "tx_orchestrator",
      "immutable_ledger",
      "node_broadcaster",
      "block_indexer"
    ],
    "explanation": "1. User initiates crypto withdrawal. 2. Gateway verifies biometric MFA and checks withdrawal address whitelist (24h lock on new addresses). 3. Multi-Party Computation (MPC) vault uses threshold cryptography to sign transaction without ever assembling the full private key in one place. 4. Orchestrator verifies funds and prevents double-spends. 5. Internal balance debited in immutable double-entry ledger. 6. Blockchain broadcaster pushes raw transaction to network mempool. 7. Block indexer tracks confirmations to mark withdrawal completed.",
    "keyDesignTakeaways": [
      "Multi-Party Computation (MPC) / Threshold Signatures: Never store complete private keys on servers; split keys into 2-of-3 mathematical shards across isolated HSMs so no single compromised server can steal funds.",
      "Cold Storage vs Hot Wallet Rebalancing: Keep 98%+ of customer assets in offline air-gapped cold storage; only maintain 2% in automated hot wallets for daily withdrawal liquidity.",
      "Confirmation Depth Re-org Safety: Never consider a blockchain deposit finalized on 1 confirmation; wait for 6 confirmations (Bitcoin) or 32 slots (Ethereum) to defend against blockchain reorganizations (re-orgs)."
    ]
  },
  {
    "id": "digital_wallet_p2p",
    "title": "Design PayPal / Peer-to-Peer Balance Transfer",
    "badge": "💸",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "400M Users • 1B Transfers/Mo",
    "qps": "20,000 Transfer Requests/Sec • Strict ACID",
    "difficulty": "Hard",
    "goal": "Design a peer-to-peer balance transfer system ensuring atomic debit/credit operations, optimistic locking, and regulatory AML transaction monitoring.",
    "availableNodes": [
      {
        "id": "p2p_user",
        "name": "Sender Mobile Client",
        "icon": "📱",
        "role": "Sends money to friend via email / phone number ($50 to Alice)"
      },
      {
        "id": "api_gw",
        "name": "API Gateway with Idempotency Guard",
        "icon": "🛡️",
        "role": "Validates Idempotency-Key and checks sender authentication"
      },
      {
        "id": "risk_fraud_engine",
        "name": "Real-Time Risk & AML Screening Engine",
        "icon": "🔍",
        "role": "Evaluates transfer velocity and sanctions watchlists in <50ms"
      },
      {
        "id": "transfer_saga",
        "name": "Two-Phase Balance Transfer Orchestrator",
        "icon": "⚙️",
        "role": "Coordinates atomic sender debit and recipient credit across accounts"
      },
      {
        "id": "double_entry_ledger",
        "name": "ACID Double-Entry Balance Ledger (Postgres)",
        "icon": "📒",
        "role": "Executes atomic double-entry transaction: DEBIT sender, CREDIT recipient"
      },
      {
        "id": "bank_rail_adapter",
        "name": "External Bank Rail Adapter (ACH / FedNow)",
        "icon": "🏦",
        "role": "Initiates ACH debit/credit if user balance is insufficient"
      },
      {
        "id": "push_notifier",
        "name": "Recipient Instant Transfer Alert Service",
        "icon": "🔔",
        "role": "Sends instant push notification to recipient: You received $50!"
      }
    ],
    "correctSequence": [
      "p2p_user",
      "api_gw",
      "risk_fraud_engine",
      "transfer_saga",
      "double_entry_ledger",
      "bank_rail_adapter",
      "push_notifier"
    ],
    "explanation": "1. User initiates $50 transfer to friend. 2. Gateway checks Idempotency-Key in Redis to prevent double-sends on network retries. 3. Risk engine screens for fraud and money laundering in <50ms. 4. Transfer Saga initiates two-phase balance movement. 5. Double-entry ledger executes atomic SQL transaction: inserts DEBIT row for sender and CREDIT row for recipient in <10ms. 6. If wallet balance insufficient, Bank Rail initiates ACH/RTP pull from linked bank account. 7. Recipient receives instant push notification.",
    "keyDesignTakeaways": [
      "Strict Double-Entry Ledger: Never update a single balance column; every transfer must record two immutable rows (DEBIT sender, CREDIT recipient) that mathematically sum to zero.",
      "Client Idempotency Keys: Enforce unique idempotency keys in Redis so retrying a failed mobile request never sends money twice.",
      "Asynchronous Bank Settlement: Internal wallet transfers are instant (in-app balance ledger); external bank ACH transfers settle asynchronously in 1-3 business days via reconciliation daemons."
    ]
  },
  {
    "id": "credit_card_fraud_detection",
    "title": "Design Visa / Real-Time Credit Card Fraud Scorer",
    "badge": "🛡️",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100M Transactions/Day • Sub-50ms Decision",
    "qps": "25,000 Payment Authorizations/Sec",
    "difficulty": "Staff+",
    "goal": "Construct a real-time card authorization fraud engine executing velocity rules and machine learning inference within a strict 10ms budget.",
    "availableNodes": [
      {
        "id": "pos_terminal",
        "name": "Merchant POS / Payment Terminal",
        "icon": "💳",
        "role": "Submits credit card authorization payload with card token, merchant ID, and amount"
      },
      {
        "id": "auth_gateway",
        "name": "Card Network Ingestion Gateway",
        "icon": "🛡️",
        "role": "Validates ISO 8583 message syntax, tokenizes PAN, and routes to fraud scoring mesh"
      },
      {
        "id": "tx_stream",
        "name": "Transaction Event Bus (Kafka)",
        "icon": "📬",
        "role": "Streams transactions in real time with zero packet loss partitioned by card_token"
      },
      {
        "id": "feature_store",
        "name": "Real-Time Feature Store (Feast / Redis)",
        "icon": "⚡",
        "role": "Calculates rolling velocity features (transactions in last 5m, card distance from last swipe)"
      },
      {
        "id": "ml_scoring_engine",
        "name": "Low-Latency ML Inference Engine (ONNX / Triton)",
        "icon": "🤖",
        "role": "Runs gradient-boosted decision tree (GBDT) + neural fraud model in <15ms"
      },
      {
        "id": "rules_evaluator",
        "name": "Deterministic Risk Rules Engine",
        "icon": "⚖️",
        "role": "Applies hard rules (sanctioned countries, stolen card lists, impossible travel velocity)"
      },
      {
        "id": "auth_decision_issuer",
        "name": "Authorization Decision Issuer",
        "icon": "✅",
        "role": "Returns APPROVE, DECLINE, or CHALLENGE (3D Secure OTP) to acquiring bank in <50ms"
      }
    ],
    "correctSequence": [
      "pos_terminal",
      "auth_gateway",
      "tx_stream",
      "feature_store",
      "ml_scoring_engine",
      "rules_evaluator",
      "auth_decision_issuer"
    ],
    "explanation": "1. Merchant swipes card at checkout; POS sends ISO 8583 authorization payload. 2. Gateway tokenizes primary account number (PAN). 3. Transaction pushed to Kafka partitioned by card_token. 4. Feast/Redis feature store computes real-time behavioral features (e.g. 3 transactions in 2 minutes, card distance > 500 miles from previous swipe). 5. Triton/ONNX ML scoring engine predicts fraud risk score (0 to 1000) in <15ms. 6. Rules engine evaluates hard regulatory/stolen card blocks. 7. Returns APPROVE, DECLINE, or 3DS SMS OTP challenge to merchant in <50ms total.",
    "keyDesignTakeaways": [
      "Real-Time Feature Store (Feast / Redis): Fraud models require dynamic streaming features (e.g. velocity in last 5 minutes) computed and retrieved in sub-5ms from RAM.",
      "Impossible Travel Velocity Checks: Calculate physical distance between previous swipe and current swipe divided by time delta; if speed > 600 mph (commercial flight), flag instant fraud.",
      "Sub-50ms SLA Budget: In payment authorization, the total round-trip budget is 100ms: allocate 15ms for network transit, 15ms for feature retrieval, 15ms for ML inference, and 5ms for rules."
    ]
  },
  {
    "id": "usage_based_billing_stripe",
    "title": "Design Stripe / Usage-Based API Metering & Invoicing",
    "badge": "🧾",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "1B API Events/Day • Complex Pricing Tiers",
    "qps": "50,000 Metered Events/Sec • Exactly-Once",
    "difficulty": "Hard",
    "goal": "Build an accurate usage metering and billing platform that aggregates API events, calculates tiered rating plans, and generates invoices with zero undercounting.",
    "availableNodes": [
      {
        "id": "meter_client",
        "name": "Customer SaaS API Client",
        "icon": "⚡",
        "role": "Emits usage event telemetry (e.g. OpenAI tokens consumed, Gigabytes transferred)"
      },
      {
        "id": "meter_gw",
        "name": "Metering Ingestion Gateway",
        "icon": "🛡️",
        "role": "Validates schema, checks customer subscription, and generates idempotency hashes"
      },
      {
        "id": "meter_bus",
        "name": "Metering Event Bus (Kafka / Pulsar)",
        "icon": "📬",
        "role": "Buffers raw usage events with strict partition ordering by customer_id"
      },
      {
        "id": "flink_aggregator",
        "name": "Flink Window Aggregator (Hourly / Daily)",
        "icon": "⚙️",
        "role": "Aggregates raw event counts into tumbling windows with exactly-once state semantics"
      },
      {
        "id": "usage_timeseries",
        "name": "Time-Series Usage Store (ClickHouse / Timescale)",
        "icon": "📊",
        "role": "Stores immutable hourly rollup buckets for customer billing audits"
      },
      {
        "id": "rating_engine",
        "name": "Pricing Tier & Rating Engine",
        "icon": "💰",
        "role": "Applies volume tiers, graduated pricing, and minimum commitments at month end"
      },
      {
        "id": "invoice_service",
        "name": "Invoice Generator & Auto-Collector",
        "icon": "🧾",
        "role": "Generates finalized monthly invoice PDF and triggers credit card charge"
      }
    ],
    "correctSequence": [
      "meter_client",
      "meter_gw",
      "meter_bus",
      "flink_aggregator",
      "usage_timeseries",
      "rating_engine",
      "invoice_service"
    ],
    "explanation": "1. Customer application emits usage event (e.g. 500 AI tokens used). 2. Gateway checks customer active subscription and validates idempotency token. 3. Kafka partitions event by customer_id. 4. Apache Flink aggregates events in 1-hour tumbling windows using RocksDB state backend with checkpointing for exactly-once processing. 5. Rollup metrics stored in ClickHouse. 6. At billing cycle close, Rating Engine applies pricing rules (graduated tiers, prepaid discounts). 7. Invoice generated and charged.",
    "keyDesignTakeaways": [
      "Exactly-Once Stream Aggregation: Double-counting usage events overcharges customers; use Flink two-phase commit with Kafka transactional checkpoints to guarantee exact billing count.",
      "Two-Tier Storage (Raw vs Rollup): Store raw events in immutable object storage (S3 parquet) for legal audit trails; query pre-aggregated hourly rollups in ClickHouse for real-time customer usage graphs.",
      "Handling Out-of-Order / Late Arriving Events: Use watermarks with a 24-hour grace period in Flink so mobile devices reconnecting after offline flights have their events properly attributed to the correct billing cycle."
    ]
  },
  {
    "id": "bank_wire_transfer_iso20022",
    "title": "Design Core Banking / ISO 20022 High-Value Wire Settlement",
    "badge": "🏦",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "10M Wires/Day • $10 Trillion Daily Volume",
    "qps": "2,000 High-Value Wires/Sec • Strict CP",
    "difficulty": "Staff+",
    "goal": "Design an ISO 20022 pacs.008 banking wire transfer engine with APRA CPS 230 operational resilience, sanctions screening, and core ledger posting.",
    "availableNodes": [
      {
        "id": "corporate_client",
        "name": "Corporate Treasury ERP Client",
        "icon": "🏢",
        "role": "Initiates high-value corporate wire transfer ($10M wire via ISO 20022 XML)"
      },
      {
        "id": "wire_gateway",
        "name": "ISO 20022 XML Schema & mTLS Gateway",
        "icon": "🛡️",
        "role": "Validates pacs.008 XML schemas, checks mutual TLS certificates, and signs requests"
      },
      {
        "id": "dual_approval_mgr",
        "name": "Four-Eyes Principle Dual Approval Engine",
        "icon": "👥",
        "role": "Enforces corporate policy: transfers >$1M require independent secondary CFO sign-off"
      },
      {
        "id": "sanctions_filter",
        "name": "OFAC Sanctions & AML Watchlist Screener",
        "icon": "🔍",
        "role": "Screens sender and beneficiary names against international sanctions lists in real time"
      },
      {
        "id": "core_banking_ledger",
        "name": "Core Banking ACID Ledger (Mainframe / Spanner)",
        "icon": "🏦",
        "role": "Executes atomic double-entry balance reservation with serializable isolation"
      },
      {
        "id": "swift_network_adapter",
        "name": "SWIFT Alliance / Fedwire Network Gateway",
        "icon": "🌐",
        "role": "Translates and securely transmits pacs.008 message over SWIFT FIN/InterAct network"
      },
      {
        "id": "recon_auditor",
        "name": "End-of-Day Pacs.002 Acknowledgment & Recon Daemon",
        "icon": "📊",
        "role": "Reconciles pacs.002 ACK/NACK status messages and verifies daily Federal Reserve settlement balance"
      }
    ],
    "correctSequence": [
      "corporate_client",
      "wire_gateway",
      "dual_approval_mgr",
      "sanctions_filter",
      "core_banking_ledger",
      "swift_network_adapter",
      "recon_auditor"
    ],
    "explanation": "1. Corporate treasury initiates high-value wire ($10M). 2. Gateway validates ISO 20022 XML schema (`pacs.008.001.08`) and checks mTLS. 3. Four-eyes approval service requires dual cryptographic authorization. 4. OFAC/AML sanctions screening runs in <50ms. 5. Core banking ledger locks and reserves funds via strict ACID transaction. 6. Wire gateway formats and transmits encrypted message over SWIFT Alliance / Fedwire. 7. Interbank settlement acknowledges receipt (`pacs.002`); end-of-day reconciliation guarantees zero discrepancy.",
    "keyDesignTakeaways": [
      "Strict XML Schema Validation at Ingress: Validate ISO 20022 pacs.008 XML structure against official XSD schemas before touching internal core banking databases.",
      "Four-Eyes Principle Enforcement: High-value enterprise wires must require cryptographic multi-party authorization (Maker-Checker workflow) to prevent insider fraud.",
      "Two-Phase Clearing & Settlement: Differentiate between Message Acceptance (`pacs.008`), Settlement Confirmation (`pacs.002`), and End-of-Day central bank gross settlement."
    ]
  },
  {
    "id": "e_commerce_cart_service",
    "title": "Design Shopify / High-Scale Shopping Cart Service",
    "badge": "🛒",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100M Active Carts • 50M Merchants",
    "qps": "100,000 Cart Updates/Sec • Sub-20ms",
    "difficulty": "Medium",
    "goal": "Design a low-latency shopping cart service supporting anonymous-to-authenticated cart merging, inventory holds, and Redis TTL management.",
    "availableNodes": [
      {
        "id": "shopper_app",
        "name": "Shopper Mobile / Web Browser",
        "icon": "🛒",
        "role": "Adds items to cart, updates item quantities, and initiates checkout"
      },
      {
        "id": "cart_gw",
        "name": "API Gateway & Edge Session Proxy",
        "icon": "🛡️",
        "role": "Validates anonymous session cookies vs authenticated customer JWT tokens"
      },
      {
        "id": "cart_service",
        "name": "Cart Domain Microservice",
        "icon": "⚙️",
        "role": "Coordinates cart item mutations, price calculations, and anonymous-to-user merges"
      },
      {
        "id": "cart_storage",
        "name": "Distributed In-Memory Cart DB (DynamoDB / Redis)",
        "icon": "⚡",
        "role": "Stores active shopping cart documents with 30-day TTL in fast key-value store"
      },
      {
        "id": "inventory_checker",
        "name": "Real-Time Stock Availability Soft-Reservation",
        "icon": "📦",
        "role": "Checks real-time stock levels and displays 'Only 2 items left' warning in UI"
      },
      {
        "id": "promo_engine",
        "name": "Dynamic Discount & Coupon Evaluator",
        "icon": "🏷️",
        "role": "Applies coupon codes, BOGO rules, and merchant tiered discounts in memory"
      },
      {
        "id": "checkout_handoff",
        "name": "Checkout State Handoff Coordinator",
        "icon": "💳",
        "role": "Freezes cart state into an immutable checkout session when user clicks 'Proceed to Checkout'"
      }
    ],
    "correctSequence": [
      "shopper_app",
      "cart_gw",
      "cart_service",
      "cart_storage",
      "inventory_checker",
      "promo_engine",
      "checkout_handoff"
    ],
    "explanation": "1. Shopper adds item to cart. 2. Gateway reads anonymous cookie or user JWT. 3. Cart service manages item mutations. 4. Active carts stored as JSON documents in DynamoDB / Redis cluster with 30-day TTL (<10ms latency). 5. Inventory service soft-checks current stock availability. 6. Promotion engine applies coupon codes and calculates subtotal. 7. When user clicks 'Proceed to Checkout', cart freezes into an immutable Checkout Session and hands off to payment service.",
    "keyDesignTakeaways": [
      "Anonymous-to-Authenticated Cart Merge: When an anonymous user logs in, merge their anonymous cookie cart with their existing account cart using Conflict-Free Replicated Data Types (CRDT / LWW-Element-Set) or custom quantity summing.",
      "Soft Inventory Checks vs Hard Locking: Do NOT lock inventory when an item is added to cart; only perform soft availability warnings. Hard locking only occurs during checkout confirmation.",
      "Cart Immutability at Checkout: Once the user enters the checkout funnel, convert the dynamic cart into an immutable snapshot to prevent price changes mid-payment."
    ]
  },
  {
    "id": "buy_now_pay_later_klarna",
    "title": "Design Klarna / Buy Now Pay Later Instant Underwriting",
    "badge": "💳",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "50M Shoppers • 1M Orders/Day",
    "qps": "5,000 Checkout Underwriting Decisions/Sec • Sub-Second",
    "difficulty": "Hard",
    "goal": "Construct an instant BNPL credit evaluation engine with real-time credit bureau integrations, risk scoring, and scheduled repayment auto-debit.",
    "availableNodes": [
      {
        "id": "checkout_widget",
        "name": "Merchant BNPL Checkout Widget",
        "icon": "🛍️",
        "role": "Renders 'Pay in 4 installments' payment option on merchant checkout page"
      },
      {
        "id": "bnpl_gateway",
        "name": "BNPL Ingestion & Device Fingerprinting Gateway",
        "icon": "🛡️",
        "role": "Collects browser fingerprint (Canvas/WebGL/IP) and validates session integrity"
      },
      {
        "id": "instant_underwriter",
        "name": "Sub-Second Credit Underwriter Engine",
        "icon": "🤖",
        "role": "Queries soft credit bureau APIs, checks historical repayment karma in <500ms"
      },
      {
        "id": "installment_plan_engine",
        "name": "Installment Schedule & Fee Calculator",
        "icon": "📅",
        "role": "Generates 4 bi-weekly 25% payment schedules and computes APR/fees"
      },
      {
        "id": "merchant_escrow_db",
        "name": "Merchant Settlement & Escrow Ledger",
        "icon": "🏦",
        "role": "Instantly guarantees and credits merchant full purchase amount minus BNPL fee (3-5%)"
      },
      {
        "id": "repayment_scheduler",
        "name": "Automated Recurring Payment Scheduler",
        "icon": "💳",
        "role": "Schedules automatic card charges on Day 0, Day 14, Day 28, Day 42"
      },
      {
        "id": "dunning_collector",
        "name": "Dunning & Late Payment Collection Service",
        "icon": "📬",
        "role": "Automates smart retries and grace-period SMS reminders for declined installment cards"
      }
    ],
    "correctSequence": [
      "checkout_widget",
      "bnpl_gateway",
      "instant_underwriter",
      "installment_plan_engine",
      "merchant_escrow_db",
      "repayment_scheduler",
      "dunning_collector"
    ],
    "explanation": "1. Shopper selects 'Pay in 4' at checkout. 2. Gateway collects fraud device fingerprint. 3. Instant underwriter queries internal credit model and soft credit pull in <500ms to approve credit. 4. Installment engine calculates 4 equal 25% payment dates (Day 0, 14, 28, 42). 5. First 25% charged to customer card immediately. 6. Merchant is settled 100% of purchase price (minus 3-5% fee) by Klarna escrow ledger. 7. Automated scheduler debits remaining installments bi-weekly.",
    "keyDesignTakeaways": [
      "Soft Credit Pull vs Hard Credit Check: BNPL relies on soft credit bureau inquiries that do not impact customer credit scores, combined with internal historical repayment repayment tracking.",
      "Immediate Merchant Settlement: The BNPL provider takes on 100% of credit default risk: merchant receives full payment immediately, insulating merchants from consumer defaults.",
      "Smart Dunning Card Retries: When an installment card is declined, retry automatically on typical payday dates (e.g. 1st and 15th of month) to maximize collection rates."
    ]
  },
  {
    "id": "leetcode_code_judge",
    "title": "Design LeetCode / Online Code Execution Engine",
    "badge": "💻",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "10M Submissions/Day • 50+ Languages",
    "qps": "2,000 Code Executions/Sec • Sub-Second Verdict",
    "difficulty": "Hard",
    "goal": "Build an isolated, secure, remote code execution platform with Firecracker microVM sandboxing, memory/CPU quotas, and test runner verification.",
    "availableNodes": [
      {
        "id": "student_ide",
        "name": "Web Code Editor Client (Monaco)",
        "icon": "💻",
        "role": "Writes solution code and submits for instant testing or grading"
      },
      {
        "id": "judge_gw",
        "name": "Code Judge API Gateway",
        "icon": "🛡️",
        "role": "Validates submission size, checks rate limits, and routes to submission queue"
      },
      {
        "id": "judge_queue",
        "name": "Submission Task Queue (Kafka / RabbitMQ)",
        "icon": "📬",
        "role": "Buffers submissions and prioritizes Run Code (interactive) over Submit (eval)"
      },
      {
        "id": "worker_pool",
        "name": "Sandbox Orchestrator Worker",
        "icon": "⚙️",
        "role": "Pulls submission, mounts test cases, and dispatches to isolated sandbox container"
      },
      {
        "id": "secure_sandbox",
        "name": "Hardened Sandbox (gVisor / Firecracker / seccomp)",
        "icon": "🔒",
        "role": "Executes untrusted user code with CPU/memory cgroups, no network, and syscall filters"
      },
      {
        "id": "test_case_store",
        "name": "Test Case & Test Suite Storage (S3 / Local NVMe)",
        "icon": "🧪",
        "role": "Stores large input/output test case files (up to 50MB for hard test cases)"
      },
      {
        "id": "verdict_db",
        "name": "Verdict & Leaderboard DB (PostgreSQL)",
        "icon": "🏆",
        "role": "Records submission verdict (Accepted, Time Limit Exceeded, Memory Limit Exceeded)"
      }
    ],
    "correctSequence": [
      "student_ide",
      "judge_gw",
      "judge_queue",
      "worker_pool",
      "secure_sandbox",
      "test_case_store",
      "verdict_db"
    ],
    "explanation": "1. User submits code in Monaco editor. 2. Gateway checks rate limit (prevents denial-of-service spam) and assigns submission ID. 3. Task enqueued into priority queue (interactive 'Run Code' prioritized over batch 'Submit'). 4. Worker orchestrator pulls job and mounts problem test cases from local NVMe cache. 5. Untrusted code executes inside hardened sandbox (gVisor / Docker with seccomp and cgroups limits). 6. Sandbox monitors CPU time and memory: enforces Time Limit Exceeded (TLE) and Memory Limit Exceeded (MLE). 7. Compares output with expected test cases; writes verdict (Accepted / Wrong Answer) to DB and streams result to user via WebSocket.",
    "keyDesignTakeaways": [
      "Defense-in-Depth Container Sandboxing: Never run untrusted user code in standard Docker containers; use gVisor (user-space kernel) or Firecracker microVMs with disabled network access and strict `seccomp` syscall filters.",
      "Local NVMe Test Case Caching: Cache test case files locally on worker SSDs rather than fetching from S3 on every submission, cutting execution latency by 80%.",
      "Strict cgroups Resource Limits: Enforce exact memory limits (e.g. 256MB) and CPU quotas via Linux cgroups; kill processes exceeding thresholds immediately with SIGKILL."
    ]
  },
  {
    "id": "google_docs_crdt",
    "title": "Design Google Docs / Real-Time Collaborative Document",
    "badge": "📄",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100 Concurrent Editors/Doc • 1B Daily Edits",
    "qps": "250,000 Character Edits/Sec • Sub-50ms Sync Latency",
    "difficulty": "Staff+",
    "goal": "Construct a real-time concurrent document collaboration engine using Conflict-Free Replicated Data Types (CRDT / Yjs) and WebSocket mesh syncing.",
    "availableNodes": [
      {
        "id": "client_editor",
        "name": "Browser Rich Text Editor",
        "icon": "📝",
        "role": "Captures keystrokes, generates local CRDT operations, and renders optimistic updates instantly"
      },
      {
        "id": "ws_relay",
        "name": "Document WebSocket Gateway",
        "icon": "⚡",
        "role": "Maintains persistent stateful socket connection to active document session shard"
      },
      {
        "id": "session_leader",
        "name": "Document Session Leader (CRDT / OT Coordinator)",
        "icon": "👑",
        "role": "Orders incoming operations, applies Operational Transformation / Logoot CRDT, and resolves character conflicts"
      },
      {
        "id": "presence_tracker",
        "name": "Collaborator Cursor & Presence Service",
        "icon": "📍",
        "role": "Broadcasts colored caret positions and active selection ranges to all connected peers"
      },
      {
        "id": "broadcast_bus",
        "name": "Intra-Document Broadcast Bus (Redis Pub/Sub)",
        "icon": "📬",
        "role": "Fans out transformed character operations to all gateway nodes serving editors of the doc"
      },
      {
        "id": "snapshot_worker",
        "name": "Periodic Snapshot & Compaction Worker",
        "icon": "⚙️",
        "role": "Flattens linear revision logs into full document state snapshots every 100 edits"
      },
      {
        "id": "doc_storage_db",
        "name": "Append-Only Mutation Log (ScyllaDB / Postgres)",
        "icon": "🗄️",
        "role": "Persists immutable ordered change logs for revision history and rollback"
      }
    ],
    "correctSequence": [
      "client_editor",
      "ws_relay",
      "session_leader",
      "presence_tracker",
      "broadcast_bus",
      "snapshot_worker",
      "doc_storage_db"
    ],
    "explanation": "1. User types a character; client editor applies change locally with optimistic zero-latency rendering. 2. Keystroke operation (e.g. `Insert('A', position=4, clock=12)`) sent over WebSocket. 3. Document Session Leader coordinates the document; applies Conflict-Free Replicated Data Type (CRDT / Yjs / Automerge) logic to deterministically merge concurrent insertions at the same index without locking. 4. Presence Tracker updates cursor positions. 5. Redis Pub/Sub fans out transformed operation to all other active editors. 6. Compaction worker periodically merges mutation stream into a consolidated document snapshot. 7. ScyllaDB stores immutable edit history.",
    "keyDesignTakeaways": [
      "CRDT vs Operational Transformation (OT): OT requires a centralized server to rewrite transform matrix operations (`TP(op1, op2)`); CRDT uses mathematically commutative operations with unique fractional index identifiers allowing peer-to-peer conflict-free merging.",
      "Single-Leader Document Sharding: Routing all editors of Document X to the same physical memory leader node avoids distributed lock contention and guarantees strict total ordering of keystrokes.",
      "Fractional Indexing for Insertions: Represent character positions as fractional strings (e.g. between '3' and '4', insert '3.5') so concurrent inserts between characters never require re-indexing subsequent text."
    ]
  },
  {
    "id": "yelp_proximity_search",
    "title": "Design Yelp / Proximity Venue Search",
    "badge": "📍",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100M Businesses • 50M Active Searchers",
    "qps": "25,000 Search QPS • <50ms P99 Latency",
    "difficulty": "Hard",
    "goal": "Build a high-performance nearby venue discovery service using QuadTree spatial partitioning, Geohashes, and spatial radius caching.",
    "availableNodes": [
      {
        "id": "user_mobile",
        "name": "Yelp Mobile / Web Client",
        "icon": "📱",
        "role": "Submits search query with current user lat/lng, radius (e.g. 5km), and category filter ('Sushi')"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Edge Cache",
        "icon": "🛡️",
        "role": "Terminates TLS, validates query parameters, and serves cached geo-tile responses"
      },
      {
        "id": "quadtree_index",
        "name": "Spatial Quadtree / Geohash Index Cluster",
        "icon": "🗺️",
        "role": "Maintains hierarchical 2D spatial grid (Geohash prefix / Google S2) in memory for O(1) tile lookup"
      },
      {
        "id": "search_ranker",
        "name": "Search & Ranking Engine (Elasticsearch)",
        "icon": "🔍",
        "role": "Intersects spatial candidate IDs with text search keywords, star rating, and price filter"
      },
      {
        "id": "business_cache",
        "name": "Business Profile Cache (Redis)",
        "icon": "🔴",
        "role": "Hydrates business metadata (photos, hours, reviews) in <2ms from RAM"
      },
      {
        "id": "business_db",
        "name": "Primary Business Database (PostgreSQL / DynamoDB)",
        "icon": "🗄️",
        "role": "Source of truth for business details, operating hours, and location geometries"
      },
      {
        "id": "review_aggregator",
        "name": "Review & Rating Aggregator (Kafka / Spark)",
        "icon": "📊",
        "role": "Calculates rolling average rating and review counts asynchronously"
      }
    ],
    "correctSequence": [
      "user_mobile",
      "api_gateway",
      "quadtree_index",
      "search_ranker",
      "business_cache",
      "business_db",
      "review_aggregator"
    ],
    "explanation": "1. Mobile client requests nearby restaurants with lat/lng and 5km radius. 2. Gateway checks edge cache for identical geo-tile queries. 3. Spatial Quadtree / Geohash cluster finds candidate business IDs within matching spatial cells. 4. Search Ranker filters candidates by text ('Sushi'), open hours, and sorts by composite score (distance weight + star rating). 5. Business Cache hydrates full business cards. 6. Primary database persists verified updates. 7. Review aggregator continuously updates rolling ratings asynchronously.",
    "keyDesignTakeaways": [
      "Spatial Partitioning (Geohash / Quadtree): Do not query raw latitude/longitude with SQL bounding boxes; index locations with 6-character Geohashes (~1.2km precision) so nearby lookups become fast string prefix scans.",
      "Read-Heavy Low-Update Invariant: Business locations change very rarely (<0.1% daily updates), but are queried 25,000 times/second; optimize heavily for read caching using static spatial memory grids.",
      "Two-Phase Query Pipeline (Filter then Rank): First prune candidates geographically to ~200 nearby venues in memory, then apply expensive keyword matching and ML ranking only on that small subset."
    ]
  },
  {
    "id": "typeahead_search_autocomplete",
    "title": "Design Search Autocomplete / Typeahead",
    "badge": "🔍",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "5B Searches/Day • 50,000 QPS",
    "qps": "50,000 Keystroke QPS • P99 < 10ms",
    "difficulty": "Hard",
    "goal": "Build a lightning-fast typeahead autocomplete engine using Trie data structures, frequency counters, and multi-tier edge caching.",
    "availableNodes": [
      {
        "id": "user_input",
        "name": "Search Box Input Client",
        "icon": "⌨️",
        "role": "Emits keystroke query prefix with 200ms client debouncing"
      },
      {
        "id": "edge_cdn",
        "name": "Cloudflare Edge CDN",
        "icon": "☁️",
        "role": "Caches top 2-3 char prefixes at edge PoPs with 1h TTL"
      },
      {
        "id": "typeahead_gw",
        "name": "Typeahead API Gateway",
        "icon": "🛡️",
        "role": "Terminates TLS, throttles abusive clients, and routes to query servers"
      },
      {
        "id": "trie_cache",
        "name": "In-Memory Trie Cluster (RAM)",
        "icon": "🌲",
        "role": "Stores prefix tree with pre-computed top 5 queries stored at each node"
      },
      {
        "id": "query_stream",
        "name": "Search Query Log Stream (Kafka)",
        "icon": "📬",
        "role": "Collects search queries asynchronously for offline frequency ranking"
      },
      {
        "id": "spark_aggregator",
        "name": "Spark Frequency Aggregator",
        "icon": "⚙️",
        "role": "Computes hourly query frequency counts and builds new Trie snapshots"
      },
      {
        "id": "snapshot_store",
        "name": "Trie Snapshot Storage (S3 / Redis)",
        "icon": "💾",
        "role": "Stores serialized Trie binaries for rolling cluster deployment"
      }
    ],
    "correctSequence": [
      "user_input",
      "edge_cdn",
      "typeahead_gw",
      "trie_cache",
      "query_stream",
      "spark_aggregator",
      "snapshot_store"
    ],
    "explanation": "1. User types into search box; client debounces keystrokes (200ms). 2. Request checks Edge CDN for common short prefixes. 3. Gateway routes to Typeahead Service. 4. Service queries in-memory Trie cluster where each node stores pre-computed top 5 query suggestions in <5ms. 5. Selected search queries stream to Kafka. 6. Spark batch aggregator recalculates query frequencies over hourly rolling windows. 7. Updated Trie snapshots deploy periodically to memory cluster.",
    "keyDesignTakeaways": [
      "Pre-Compute Top K at Each Trie Node: Storing the top 5 query strings directly on each prefix node turns an O(Prefix + Subtree) search into an instant O(Prefix Length) lookup.",
      "Client-Side Debouncing: Delaying query dispatch by 150-200ms eliminates 70% of unnecessary intermediate keystroke server requests.",
      "Separate Ingestion from Serving: Never mutate live Trie pointers during user queries; build serialized Trie snapshots offline in Spark and swap pointers atomically."
    ]
  },
  {
    "id": "ad_click_aggregator",
    "title": "Design Ad Click Aggregator & Real-Time Bidding",
    "badge": "🎯",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "100B Ad Impressions/Day • 1B Clicks/Day",
    "qps": "100,000 Click Events/Sec • Real-Time Billing",
    "difficulty": "Staff+",
    "goal": "Design an ultra-low latency real-time bidding exchange and click fraud detection pipeline with sub-50ms auction SLA.",
    "availableNodes": [
      {
        "id": "ad_client",
        "name": "Ad Viewer Browser / App",
        "icon": "🖱️",
        "role": "Emits signed ad click telemetry with token & timestamp"
      },
      {
        "id": "click_gw",
        "name": "Ad Tracking Edge Gateway",
        "icon": "🛡️",
        "role": "Validates cryptographic click token signatures and IP headers"
      },
      {
        "id": "dedup_filter",
        "name": "Deduplication Filter (Redis Bloom)",
        "icon": "🔍",
        "role": "Discards duplicate rapid clicks within 10-minute sliding window"
      },
      {
        "id": "kafka_clicks",
        "name": "Click Event Log Bus (Kafka)",
        "icon": "📬",
        "role": "Partitions verified click events by advertiser_id & campaign_id"
      },
      {
        "id": "flink_aggregator",
        "name": "Flink Stream Aggregator",
        "icon": "⚙️",
        "role": "Aggregates click counts in 1-minute tumbling windows and updates budgets"
      },
      {
        "id": "billing_db",
        "name": "Campaign Billing DB (Postgres / Aurora)",
        "icon": "💰",
        "role": "Debits advertiser account balance with strict ACID idempotency"
      },
      {
        "id": "reporting_olap",
        "name": "OLAP Analytics Engine (ClickHouse)",
        "icon": "📊",
        "role": "Stores multidimensional click data for real-time advertiser dashboards"
      }
    ],
    "correctSequence": [
      "ad_client",
      "click_gw",
      "dedup_filter",
      "kafka_clicks",
      "flink_aggregator",
      "billing_db",
      "reporting_olap"
    ],
    "explanation": "1. User clicks ad; signed click token submitted to tracking gateway. 2. Gateway verifies cryptographic signature to prevent spoofing. 3. Redis Bloom filter and token cache eliminate accidental/fraudulent duplicate clicks within 10 minutes. 4. Verified clicks stream to Kafka partitioned by advertiser_id. 5. Apache Flink aggregates clicks in 1-minute tumbling windows. 6. Campaign Billing DB deducts advertiser budget balance. 7. Enriched click events persist to ClickHouse for advertiser dashboards.",
    "keyDesignTakeaways": [
      "Two-Phase Fraud Deduplication: Use client token signatures + Redis Bloom filter at ingestion to drop bot duplicates before charging advertisers.",
      "Partition Kafka by Advertiser ID: Ensures all click events for a specific campaign hit the same Flink consumer partition, preventing race conditions on budget caps.",
      "Separate Financial Billing from Analytics: Real-time money debits use strict ACID PostgreSQL transactions; historical reporting queries hit ClickHouse OLAP."
    ]
  },
  {
    "id": "music_streaming_spotify",
    "title": "Design Spotify / Global Audio Streaming Platform",
    "badge": "🎵",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "600M Active Users • 100M Tracks",
    "qps": "200,000 Audio Streams/Sec • 50 Gbps Egress",
    "difficulty": "Hard",
    "goal": "Construct a global audio streaming delivery network with chunked Ogg Vorbis streaming, client-side caching, and playlist graph synchronization.",
    "availableNodes": [
      {
        "id": "music_app",
        "name": "Spotify Mobile / Desktop App",
        "icon": "🎧",
        "role": "Streams audio chunks and caches encrypted tracks locally for offline playback"
      },
      {
        "id": "api_gw",
        "name": "Edge Gateway & Auth Proxy",
        "icon": "🛡️",
        "role": "Validates user subscription tier (Free vs Premium) and issues audio decryption tokens"
      },
      {
        "id": "metadata_db",
        "name": "Track & Artist Catalog (Postgres)",
        "icon": "🎵",
        "role": "Stores track metadata, artist discographies, and album art URLs"
      },
      {
        "id": "cdn_audio",
        "name": "Global Audio CDN (Cloudflare / Edge PoP)",
        "icon": "☁️",
        "role": "Caches encrypted Ogg Vorbis / AAC audio chunks close to listeners"
      },
      {
        "id": "audio_storage",
        "name": "Master Audio Storage (S3 / Cloud Storage)",
        "icon": "🪣",
        "role": "Stores multi-bitrate master audio tracks (96k, 160k, 320k Ogg Vorbis)"
      },
      {
        "id": "drm_key_service",
        "name": "DRM Key Distribution Service",
        "icon": "🔑",
        "role": "Issues time-limited AES-128 audio chunk decryption keys to authorized players"
      },
      {
        "id": "play_telemetry",
        "name": "Playback Telemetry & Royalty Kafka",
        "icon": "📊",
        "role": "Logs stream duration (>30s) for artist royalty calculations and Year-End Wrapped"
      }
    ],
    "correctSequence": [
      "music_app",
      "api_gw",
      "metadata_db",
      "cdn_audio",
      "audio_storage",
      "drm_key_service",
      "play_telemetry"
    ],
    "explanation": "1. Listener selects song in app. 2. Gateway checks user subscription tier and issues playback token. 3. Metadata DB returns album details and track chunk manifest. 4. Client requests first 5-second audio chunk (.ogg) from nearest Edge CDN. 5. CDN fetches from S3 on cache miss. 6. DRM Key Service delivers AES-128 decryption key. 7. Player streams chunks seamlessly with zero gap; upon 30 seconds of playback, heartbeat streams to Kafka for artist royalty accounting.",
    "keyDesignTakeaways": [
      "Pre-Fetch Next Track First Chunk: Fetching the first 5 seconds of the upcoming song while the current song finishes guarantees zero-gap playback transition.",
      "Tiered Bitrate Encoding: Free tier gets 160 kbps; Premium gets 320 kbps high-fidelity Ogg Vorbis, reducing CDN bandwidth by 40% on mobile.",
      "30-Second Royalty Threshold: Audio streaming services only count streams exceeding 30 seconds for artist payouts, filtering rapid skips via Kafka aggregation."
    ]
  },
  {
    "id": "notification_system_push",
    "title": "Design Scalable Notification Service (APNs/FCM/SMS)",
    "badge": "🔔",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1B Notifications/Day • Multi-Channel",
    "qps": "50,000 Push/Sec • Multi-Provider",
    "difficulty": "Medium",
    "goal": "Build a multi-channel notification engine with user preference filtering, priority SQS queues, template rendering, and third-party provider retries.",
    "availableNodes": [
      {
        "id": "internal_service",
        "name": "Upstream Product Microservice",
        "icon": "⚙️",
        "role": "Emits transactional notification payload (e.g. OTP, ride arrival, like)"
      },
      {
        "id": "notify_gw",
        "name": "Notification Ingestion Gateway",
        "icon": "🛡️",
        "role": "Validates schema, checks user preferences, and deduplicates repeated alerts"
      },
      {
        "id": "priority_queue",
        "name": "Priority Message Queue (Kafka / RabbitMQ)",
        "icon": "📬",
        "role": "Separates High-Priority (OTP/Security) from Low-Priority (Marketing)"
      },
      {
        "id": "template_engine",
        "name": "Template & Localization Engine",
        "icon": "📝",
        "role": "Renders localized notification text, variables, and deep links"
      },
      {
        "id": "rate_limiter",
        "name": "Per-User Frequency Limiter (Redis)",
        "icon": "⏱️",
        "role": "Enforces user quiet hours and max 3 marketing pushes/hour limit"
      },
      {
        "id": "provider_dispatcher",
        "name": "Third-Party Provider Adapter Fleet",
        "icon": "🚀",
        "role": "Dispatches payloads across APNs (Apple), FCM (Google), and Twilio (SMS)"
      },
      {
        "id": "recipient_device",
        "name": "User Mobile / Web Device",
        "icon": "📱",
        "role": "Displays native OS notification banner and reports delivery telemetry"
      }
    ],
    "correctSequence": [
      "internal_service",
      "notify_gw",
      "priority_queue",
      "template_engine",
      "rate_limiter",
      "provider_dispatcher",
      "recipient_device"
    ],
    "explanation": "1. Internal microservice submits notification. 2. Gateway checks user opt-in preferences and deduplicates idempotency keys. 3. Enqueued into priority queues (High: OTP/security vs Low: marketing). 4. Template engine localizes message text based on recipient language. 5. Rate limiter verifies user quiet hours and per-hour notification caps. 6. Provider adapter fleet dispatches to Apple Push Notification service (APNs), Firebase Cloud Messaging (FCM), or SMS gateways. 7. Delivery telemetry logged to database.",
    "keyDesignTakeaways": [
      "Dedicated Priority Queues: Always isolate High-Priority transactional alerts (OTP, ride arrived) from bulk promotional campaigns so marketing blasts never delay 2FA codes.",
      "Per-User Rate Limiting: Prevent notification fatigue by enforcing strict caps (e.g. max 3 marketing alerts/day) in Redis.",
      "Provider Failure Circuit Breaking: If APNs or SMS gateways experience downtime, fall back to secondary providers or retry with exponential backoff."
    ]
  },
  {
    "id": "instagram_feed_stories",
    "title": "Design Instagram / Stories & Photo Feed Publishing",
    "badge": "📷",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "500M Daily Active Users • 1B Stories/Day",
    "qps": "20,000 Story Uploads/Sec • 24h Ephemeral",
    "difficulty": "Hard",
    "goal": "Design an ephemeral Stories delivery system with 24-hour TTL expiration, edge CDN caching, and user viewed-state bitsets.",
    "availableNodes": [
      {
        "id": "mobile_app",
        "name": "Instagram Mobile App Client",
        "icon": "📷",
        "role": "Captures photo/video stories and renders pre-cached story ring carousels"
      },
      {
        "id": "media_gw",
        "name": "Media Upload API Gateway",
        "icon": "🛡️",
        "role": "Validates media headers and generates time-limited S3 presigned upload URLs"
      },
      {
        "id": "story_s3",
        "name": "Ephemeral Story Storage (S3 / Blob)",
        "icon": "🪣",
        "role": "Stores story media with 24-hour automatic S3 lifecycle expiration rules"
      },
      {
        "id": "story_service",
        "name": "Story Metadata & State Service",
        "icon": "⚙️",
        "role": "Records story metadata and manages 24h expiration timestamp in DB"
      },
      {
        "id": "story_ring_cache",
        "name": "Story Ring Cache (Redis Cluster)",
        "icon": "⚡",
        "role": "Maintains list of unviewed active story authors for follower trays in RAM"
      },
      {
        "id": "view_dedup_set",
        "name": "Story View Tracker (Redis Bitmaps)",
        "icon": "👁️",
        "role": "Deduplicates story view counts and tracks viewer profile lists"
      },
      {
        "id": "cdn_edge",
        "name": "Instagram Anycast CDN",
        "icon": "☁️",
        "role": "Caches story images and 15s video segments at ISP edge nodes"
      }
    ],
    "correctSequence": [
      "mobile_app",
      "media_gw",
      "story_s3",
      "story_service",
      "story_ring_cache",
      "view_dedup_set",
      "cdn_edge"
    ],
    "explanation": "1. User captures story and uploads directly to S3 via presigned URL. 2. Gateway registers story metadata. 3. Story media configured with 24-hour auto-deletion policy in S3. 4. Story Service updates follower Story Tray caches in Redis (colored story ring). 5. When follower watches story, Redis Bitmap records view deduplication. 6. Content cached at Edge CDN for instant start playback. 7. Stories automatically expire after 24 hours.",
    "keyDesignTakeaways": [
      "S3 Object Lifecycle Policies: Never run `DELETE FROM stories WHERE created_at < NOW() - 24h` on databases; let S3 and Redis TTLs automatically prune expired stories with zero DB load.",
      "Redis Bitmaps for Story Viewers: Track whether a user viewed a story using 1 bit per follower in Redis, reducing viewer tracking memory by 95%.",
      "Pre-Fetch Next Story in Carousel: While user watches current 15s story, pre-download the next 2 stories in the tray to eliminate swipe delay."
    ]
  },
  {
    "id": "linkedin_social_graph",
    "title": "Design LinkedIn / 2nd & 3rd Degree Connection Graph",
    "badge": "🕸️",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "900M Members • 50B Connection Edges",
    "qps": "20,000 Graph Traversal QPS • Sub-50ms",
    "difficulty": "Hard",
    "goal": "Build a distributed graph traversal service calculating 1st, 2nd, and 3rd degree professional connection pathways in under 100ms.",
    "availableNodes": [
      {
        "id": "member_client",
        "name": "LinkedIn Web / Mobile Client",
        "icon": "💼",
        "role": "Views member profile and queries connection distance (1st, 2nd, 3rd+)"
      },
      {
        "id": "edge_gw",
        "name": "API Gateway & Session Proxy",
        "icon": "🛡️",
        "role": "Validates member JWT auth and routes to graph traversal service"
      },
      {
        "id": "graph_cache",
        "name": "1st-Degree Connection Cache (Redis)",
        "icon": "⚡",
        "role": "Stores immediate 1st-degree friend friend IDs in memory as Roaring Bitmaps"
      },
      {
        "id": "graph_engine",
        "name": "Distributed Graph Engine (Neo4j / GraphX)",
        "icon": "🕸️",
        "role": "Executes bidirectional Breadth-First Search (BFS) to find shortest path <= 3 degrees"
      },
      {
        "id": "graph_db",
        "name": "Graph Database (Distributed Graph / Scylla)",
        "icon": "🗄️",
        "role": "Persists adjacency lists and connection edge properties (timestamp, status)"
      },
      {
        "id": "connection_bus",
        "name": "Connection Event Bus (Kafka)",
        "icon": "📬",
        "role": "Streams new connection acceptances to update graph shards in real time"
      },
      {
        "id": "profile_service",
        "name": "Member Profile Hydration Service",
        "icon": "👤",
        "role": "Hydrates name, headline, and mutual connection counts for rendered profile"
      }
    ],
    "correctSequence": [
      "member_client",
      "edge_gw",
      "graph_cache",
      "graph_engine",
      "graph_db",
      "connection_bus",
      "profile_service"
    ],
    "explanation": "1. User visits profile. 2. Gateway routes to Graph Engine. 3. Graph cache fetches viewer 1st-degree connections and target 1st-degree connections from Redis Roaring Bitmaps. 4. If intersection is non-empty, they share 2nd-degree mutual friends. 5. If empty, Graph Engine executes bidirectional Breadth-First Search (BFS) bounded at 3 hops. 6. Graph DB stores adjacency lists sharded by member_id. 7. Connection acceptances stream to Kafka to update graph partitions. 8. Profile service returns mutual connection cards in <50ms.",
    "keyDesignTakeaways": [
      "Bidirectional BFS (Breadth-First Search): Searching simultaneously from Source and Target reduces search space from O(B^D) to O(2 * B^(D/2)), accelerating 2nd/3rd degree lookups by 1,000x.",
      "Roaring Bitmaps for Fast Set Intersections: Representing friend lists as compressed Roaring Bitmaps in RAM allows checking mutual friends via bitwise AND in microseconds.",
      "Bounded 3-Degree Limit: Never traverse beyond 3 degrees of separation; 4+ degrees touches millions of nodes and causes combinatorial explosion."
    ]
  },
  {
    "id": "news_aggregator_ranking",
    "title": "Design Hacker News / Algorithmic Ranking & Comments",
    "badge": "📰",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "50M Pageviews/Day • 10M Upvotes",
    "qps": "5,000 Upvote Writes/Sec • 50,000 Homepage Reads/Sec",
    "difficulty": "Medium",
    "goal": "Design a real-time link aggregation platform with gravity time-decay ranking algorithms and recursive comment tree indexing.",
    "availableNodes": [
      {
        "id": "reader_client",
        "name": "Reader Web Browser / App",
        "icon": "📰",
        "role": "Browses ranked homepage stories and casts upvotes/downvotes"
      },
      {
        "id": "edge_cache",
        "name": "Fastly / Cloudflare Edge CDN",
        "icon": "☁️",
        "role": "Caches ranked frontpage HTML/JSON for 30 seconds at edge PoPs"
      },
      {
        "id": "news_gw",
        "name": "API Gateway & Bot Blocker",
        "icon": "🛡️",
        "role": "Validates voting karma, blocks voting bot rings, and rate limits"
      },
      {
        "id": "ranking_service",
        "name": "Hacker News Ranking Engine",
        "icon": "⏱️",
        "role": "Computes Gravity Decay Score = (P - 1) / (T + 2)^G for each post"
      },
      {
        "id": "vote_queue",
        "name": "Vote Ingestion Stream (Kafka)",
        "icon": "📬",
        "role": "Buffers upvotes to absorb viral vote spikes and prevent database row locks"
      },
      {
        "id": "ranked_cache",
        "name": "Ranked Frontpage Cache (Redis ZSET)",
        "icon": "⚡",
        "role": "Maintains top 500 ranked post IDs sorted by decaying gravity score"
      },
      {
        "id": "comment_db",
        "name": "Post & Nested Comment DB (PostgreSQL)",
        "icon": "💬",
        "role": "Stores posts and nested comment trees using Modified Preorder Tree Traversal (MPTT)"
      }
    ],
    "correctSequence": [
      "reader_client",
      "edge_cache",
      "news_gw",
      "ranking_service",
      "vote_queue",
      "ranked_cache",
      "comment_db"
    ],
    "explanation": "1. Reader browses frontpage; Edge CDN serves cached top 30 stories (<5ms). 2. User submits upvote; Gateway blocks suspicious bot karma. 3. Upvote enqueued into Kafka. 4. Ranking Engine recalculates time-decay score using Gravity Formula: Score = (Upvotes - 1) / (Age_Hours + 2)^1.8. 5. Redis Sorted Set updates post rank score. 6. Comment DB retrieves nested comment trees efficiently using MPTT (Modified Preorder Tree Traversal) in a single SQL query. 7. Frontpage regenerated every 30 seconds.",
    "keyDesignTakeaways": [
      "Gravity Decay Formula: Score = (P - 1) / (T + 2)^G ensures new popular stories rise quickly while older stories naturally decay over 24 hours.",
      "MPTT (Modified Preorder Tree Traversal) for Nested Comments: Storing `lft` and `rgt` integer boundaries allows querying deep nested comment trees in 1 single SELECT query without recursive SQL joins.",
      "Buffer Upvotes in Redis/Kafka: Avoid running `UPDATE posts SET score = score + 1` directly on databases; buffer in Redis and flush aggregated score deltas."
    ]
  },
  {
    "id": "twitch_live_chat",
    "title": "Design Twitch / Live Stream Chat with Millions of Viewers",
    "badge": "💬",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100k Concurrent Channels • 10M Viewers on Top Channel",
    "qps": "500,000 Chat Messages/Sec Peak • Sub-200ms Global Broadcast",
    "difficulty": "Staff+",
    "goal": "Construct a high-volume live video chat engine with room sharding, message rate-limiting, slow mode, and client-side rendering throttling.",
    "availableNodes": [
      {
        "id": "chat_user",
        "name": "Stream Viewer / Chatter",
        "icon": "💬",
        "role": "Submits chat message or emote reaction over persistent WebSocket socket"
      },
      {
        "id": "chat_edge_gw",
        "name": "Edge Chat Gateway Cluster",
        "icon": "⚡",
        "role": "Terminates client WebSockets; terminates idle connections and enforces per-user slow mode"
      },
      {
        "id": "automod_service",
        "name": "AutoMod & Bad Word Filter",
        "icon": "🛡️",
        "role": "Runs regex triage and spam heuristics; drops banned words and phishing links in <5ms"
      },
      {
        "id": "channel_broker",
        "name": "Channel Message Broker (Kafka / Redis)",
        "icon": "📬",
        "role": "Partitions messages by `channel_id`; buffers incoming bursts during hype moments"
      },
      {
        "id": "fanout_engine",
        "name": "Hierarchical Fan-Out Tree Engine",
        "icon": "🌲",
        "role": "Multiplexes and broadcasts messages down a tree of edge distribution nodes to reach 10M viewers"
      },
      {
        "id": "adaptive_dropper",
        "name": "Adaptive Message Sampling / Dropper",
        "icon": "📉",
        "role": "During massive traffic spikes (10k msgs/sec in 1 room), samples chat to 20 msgs/sec per client to prevent browser freezing"
      },
      {
        "id": "chat_history_db",
        "name": "VOD Chat History DB (ScyllaDB / DynamoDB)",
        "icon": "🗄️",
        "role": "Persists timestamped chat messages for VOD playback replay"
      }
    ],
    "correctSequence": [
      "chat_user",
      "chat_edge_gw",
      "automod_service",
      "channel_broker",
      "fanout_engine",
      "adaptive_dropper",
      "chat_history_db"
    ],
    "explanation": "1. User types message into popular streamer's chat. 2. Edge Gateway checks user slow-mode timer (e.g. 1 msg/30s). 3. AutoMod scans for toxicity. 4. Kafka topic keyed by `channel_id` ingests verified messages. 5. Hierarchical Fan-Out tree distributes message to hundreds of edge gateway servers. 6. In massive 1M-viewer channels, Adaptive Dropper samples chat to ~20 messages/sec so client DOM doesn't crash from render overload. 7. Messages written to ScyllaDB for VOD synchronization.",
    "keyDesignTakeaways": [
      "Human Perception & Client Render Limits: No human can read 10,000 messages/sec scrolling by; when a channel exceeds ~30 msgs/sec, servers must sample or aggregate messages so client browsers do not lock up.",
      "Hierarchical Distribution Tree: A single broker node cannot push 500k sockets; use a 2-tier tree (Channel Ingest -> Intermediate Fan-Out Nodes -> Edge WebSockets).",
      "Ephemerality of Live Chat: Live chat is an ephemeral social stream; message delivery guarantee can be relaxed (lossy UDP/unreliable delivery under extreme load) without damaging user experience."
    ]
  },
  {
    "id": "uber_surge_pricing",
    "title": "Design Uber / Dynamic Surge Pricing Engine",
    "badge": "📈",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100M Daily Trips • 10,000 Hexagonal City Zones",
    "qps": "250,000 Pricing Quotes/Sec • 10-Second Recalculation Cadence",
    "difficulty": "Hard",
    "goal": "Build an automated surge multiplier calculator aggregating ride requests and active driver locations per H3 hexagon cell in 10-second intervals.",
    "availableNodes": [
      {
        "id": "event_source",
        "name": "Rider Open App & Driver Pings",
        "icon": "📱",
        "role": "Emits app opens (demand signal) and available driver locations (supply signal)"
      },
      {
        "id": "stream_ingest",
        "name": "Streaming Telemetry Ingest (Kafka)",
        "icon": "⚡",
        "role": "Ingests millions of events/sec partitioned by geographic city region and H3 cell"
      },
      {
        "id": "flink_aggregator",
        "name": "Real-Time Stream Processor (Apache Flink)",
        "icon": "⚙️",
        "role": "Computes rolling 5-minute supply-to-demand ratio per H3 hex cell over tumbling windows"
      },
      {
        "id": "surge_calculator",
        "name": "Dynamic Surge Multiplier Engine",
        "icon": "📈",
        "role": "Applies pricing curve algorithms (e.g., 1.2x to 3.5x) based on supply deficit and historical elasticity"
      },
      {
        "id": "spatial_smoother",
        "name": "Spatial Smoothing & Anti-Cliff Filter",
        "icon": "🌐",
        "role": "Smooths multiplier gradient across adjacent H3 cells to prevent artificial border hopping"
      },
      {
        "id": "surge_cache",
        "name": "Surge Cache (Redis Cluster Multi-DC)",
        "icon": "🔴",
        "role": "Stores active surge multipliers per H3 cell for O(1) <1ms lookups by ride quote service"
      },
      {
        "id": "fare_quote_svc",
        "name": "Upfront Fare Quote Service",
        "icon": "💵",
        "role": "Calculates final dollar fare: `base_fare * surge_multiplier` for rider checkout"
      }
    ],
    "correctSequence": [
      "event_source",
      "stream_ingest",
      "flink_aggregator",
      "surge_calculator",
      "spatial_smoother",
      "surge_cache",
      "fare_quote_svc"
    ],
    "explanation": "1. Telemetry streams from rider app opens (demand) and driver GPS pings (supply). 2. Kafka partitions data by City/H3 cell. 3. Apache Flink computes rolling supply vs demand counts in 5-minute sliding windows. 4. Surge Multiplier Engine computes surge curve (e.g. 1.8x). 5. Spatial Smoother applies Gaussian blur across adjacent cells so neighboring blocks don't experience jarring pricing cliffs (e.g. 1.0x next to 3.0x). 6. Multipliers written to Redis with 15s TTL. 7. Upfront Fare Quote Service hydrates surge multiplier in <1ms to quote riders.",
    "keyDesignTakeaways": [
      "Streaming Window Aggregation (Apache Flink): Use event-time sliding windows (e.g., 5-minute window updated every 10 seconds) to detect sudden demand spikes (e.g., a concert ending).",
      "Spatial Gradient Smoothing: Raw mathematical surge creates jagged borders where stepping across a street doubles the price; smooth prices across neighboring H3 hexagonal cells with spatial filters.",
      "Demand Signal Capture (App Opens): Demand is not just completed ride requests; count app opens and destination searches in a zone to anticipate demand before rides are booked."
    ]
  },
  {
    "id": "zoom_video_signaling",
    "title": "Design Zoom / Video Conference Signaling & SFU Router",
    "badge": "📹",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "300M Daily Meeting Participants • 1,000 Attendees/Room",
    "qps": "100,000 Signaling Handshakes/Sec • Sub-100ms Media Latency",
    "difficulty": "Staff+",
    "goal": "Design a real-time WebRTC Selective Forwarding Unit (SFU) audio/video routing mesh with adaptive simulcast quality switching.",
    "availableNodes": [
      {
        "id": "meeting_client",
        "name": "Participant WebRTC App",
        "icon": "💻",
        "role": "Captures mic/cam, negotiates SDP offer/answer, and encodes VP9/AV1 simulcast video layers"
      },
      {
        "id": "signaling_gw",
        "name": "Signaling Gateway (WebSocket / WSS)",
        "icon": "⚡",
        "role": "Coordinates session negotiation: SDP offers, ICE candidates, room join events"
      },
      {
        "id": "room_coordinator",
        "name": "Meeting Session Manager",
        "icon": "👑",
        "role": "Assigns participants to Media Routers (SFU); manages roster and host permissions"
      },
      {
        "id": "sfu_media_router",
        "name": "Selective Forwarding Unit (SFU)",
        "icon": "📡",
        "role": "Receives 1 video stream from speaker and forwards packets to other 999 attendees without re-encoding"
      },
      {
        "id": "bandwidth_estimator",
        "name": "Simulcast Bandwidth Probe (TWCC)",
        "icon": "📊",
        "role": "Detects client packet loss and dynamically instructs SFU to switch between 1080p, 720p, or 180p thumbnails"
      },
      {
        "id": "stun_turn_cluster",
        "name": "STUN / TURN NAT Traversal Relay",
        "icon": "🌐",
        "role": "Assists ICE hole punching through firewalls and symmetric NATs; relays UDP traffic when P2P fails"
      },
      {
        "id": "meeting_metadata_db",
        "name": "Meeting & Roster DB (CockroachDB)",
        "icon": "🗄️",
        "role": "Stores meeting schedules, passcodes, and active participant rosters"
      }
    ],
    "correctSequence": [
      "meeting_client",
      "signaling_gw",
      "room_coordinator",
      "sfu_media_router",
      "bandwidth_estimator",
      "stun_turn_cluster",
      "meeting_metadata_db"
    ],
    "explanation": "1. Client opens WebSocket to Signaling Gateway. 2. Client exchanges Session Description Protocol (SDP) and ICE candidates. 3. Room Coordinator allocates an optimal Selective Forwarding Unit (SFU) close to participants. 4. Participant publishes video as Simulcast (sending 3 layers: 1080p, 720p, 180p). 5. SFU receives the stream and selectively routes packets: sending 1080p for active speaker, and 180p for gallery thumbnail tiles. 6. Bandwidth estimator detects network congestion via TWCC and steps down bitrate. 7. STUN/TURN relays UDP when NAT hole punching fails.",
    "keyDesignTakeaways": [
      "SFU (Selective Forwarding Unit) vs MCU: MCUs decode and re-encode all video into a single combined composite stream (massive server CPU cost); SFUs act as smart UDP packet routers forwarding raw RTP packets without transcoding.",
      "Simulcast Video Layering: Broadcaster encodes multiple bitrates locally (High, Mid, Low); SFU forwards high-res to the active speaker box and low-res to gallery grid participants.",
      "Separate Signaling from Media Path: WebRTC signaling (JSON over WebSockets) handles handshakes, while media flow runs over raw UDP / SRTP to prioritize low latency over packet retransmission."
    ]
  },
  {
    "id": "chess_matchmaking_engine",
    "title": "Design Chess.com / Multiplayer Chess Engine & ELO",
    "badge": "♟️",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100M Games/Day • 500k Concurrent Matches",
    "qps": "50,000 Move Validations/Sec • Sub-5s ELO Matchmaking",
    "difficulty": "Medium",
    "goal": "Construct a low-latency multiplayer game state machine with WebSocket bi-directional moves, server anti-cheat validation, and ELO matchmaking.",
    "availableNodes": [
      {
        "id": "player_app",
        "name": "Chess Player Client",
        "icon": "♟️",
        "role": "Submits matchmaking request (3+2 Blitz) and streams chess moves in algebraic notation (e.g. `e2e4`)"
      },
      {
        "id": "ws_gateway",
        "name": "Match WebSocket Gateway",
        "icon": "⚡",
        "role": "Maintains persistent socket for millisecond-precision chess clock countdown synchronization"
      },
      {
        "id": "queue_pool",
        "name": "Matchmaking Pool (Redis Sorted Sets)",
        "icon": "⏳",
        "role": "Buckets players by time control (Blitz/Bullet/Rapid) and sorts by ELO rating"
      },
      {
        "id": "match_engine",
        "name": "Matchmaking Worker (ELO Radius Expansion)",
        "icon": "🎯",
        "role": "Pairs players within +/- 50 ELO, expanding search window by 25 ELO every 2 seconds"
      },
      {
        "id": "board_state_actor",
        "name": "In-Memory Board Actor (Akka / Erlang)",
        "icon": "⚙️",
        "role": "Maintains authoritative FEN board state, validates legal moves, and decrements millisecond clock"
      },
      {
        "id": "game_db",
        "name": "Game Record Database (PostgreSQL / ScyllaDB)",
        "icon": "🗄️",
        "role": "Persists final PGN notation, game result (Checkmate/Resign/Draw), and updated player ratings"
      },
      {
        "id": "rating_service",
        "name": "Glicko-2 / ELO Rating Calculator",
        "icon": "📊",
        "role": "Calculates new player ratings and rating deviation (RD) upon game conclusion"
      }
    ],
    "correctSequence": [
      "player_app",
      "ws_gateway",
      "queue_pool",
      "match_engine",
      "board_state_actor",
      "game_db",
      "rating_service"
    ],
    "explanation": "1. Player queues for 3-minute Blitz. 2. WebSocket Gateway connects player to matchmaking pool. 3. Player inserted into Redis Sorted Set keyed by `time_control`, scored by ELO. 4. Matchmaking engine pairs two players within acceptable ELO radius. 5. Game room spins up an authoritative In-Memory Board Actor: validates legal chess moves and manages countdown clock. 6. Upon checkmate or flag timeout, final PGN notation committed to game DB. 7. Rating service runs Glicko-2 formula to adjust both players' ELO scores.",
    "keyDesignTakeaways": [
      "Expanding Search Window Algorithm: Start looking for opponents with +/- 30 ELO; if no match found within 3 seconds, expand radius to +/- 60 ELO to bound queue wait time.",
      "Authoritative Server-Side Move Validation: Never trust the client for legal moves; client sends move `e2e4`, server verifies piece rules and check status against authoritative board FEN state.",
      "Client Clock Lag Compensation: Network latency can steal clock time; server timestamps move receipt and accounts for measured round-trip time (RTT ping) to ensure fair time deduction."
    ]
  },
  {
    "id": "google_maps_navigation",
    "title": "Design Google Maps / Real-Time Turn-by-Turn Navigation",
    "badge": "🗺️",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "1 Billion Daily Users • 50M Active Routes",
    "qps": "100,000 Route Requests/Sec • Sub-2s Dynamic Rerouting",
    "difficulty": "Staff+",
    "goal": "Design a real-time routing engine using A* Contraction Hierarchies, live traffic segment congestion overlays, and dynamic re-routing.",
    "availableNodes": [
      {
        "id": "nav_client",
        "name": "Driver Navigation App",
        "icon": "📱",
        "role": "Streams current GPS location, speed, and heading; renders 3D vector map tiles"
      },
      {
        "id": "edge_router",
        "name": "Edge Gateway & Tile CDN",
        "icon": "🛡️",
        "role": "Caches static road vector map tiles (.mvt) and terminates client navigation sessions"
      },
      {
        "id": "road_graph_cache",
        "name": "Partitioned Road Graph Cache (RAM)",
        "icon": "🗺️",
        "role": "Holds continental road networks in memory as directed weighted graphs (A* / Contraction Hierarchies)"
      },
      {
        "id": "live_traffic_engine",
        "name": "Live Traffic Ingestion (Kafka / Flink)",
        "icon": "⚡",
        "role": "Aggregates anonymous driver speed pings to dynamically update road edge traversal weights"
      },
      {
        "id": "route_engine",
        "name": "Distributed Routing Engine (A* Search)",
        "icon": "🧭",
        "role": "Calculates shortest/fastest route using Contraction Hierarchies and real-time edge speeds"
      },
      {
        "id": "reroute_detector",
        "name": "Off-Route & Incident Reroute Detector",
        "icon": "⚙️",
        "role": "Detects missed turns or sudden traffic jams ahead; pushes instant proactive detour"
      },
      {
        "id": "route_cache_db",
        "name": "Route Session Store (Redis / DynamoDB)",
        "icon": "🗄️",
        "role": "Saves active navigation itinerary polyline and waypoint milestones"
      }
    ],
    "correctSequence": [
      "nav_client",
      "edge_router",
      "road_graph_cache",
      "live_traffic_engine",
      "route_engine",
      "reroute_detector",
      "route_cache_db"
    ],
    "explanation": "1. Driver enters destination. 2. Edge CDN serves cached road geometry tiles. 3. Route Engine loads directed road graph from in-memory cache using Contraction Hierarchies (precomputed highway shortcuts). 4. Live Traffic Engine updates edge weights (travel times) from real-time speed sensor pings. 5. A* search computes optimal route with turn-by-turn maneuvers in <100ms. 6. Reroute detector tracks driver GPS: if driver misses exit or severe accident detected ahead, pushes immediate alternative detour. 7. Active route saved in Redis session store.",
    "keyDesignTakeaways": [
      "Contraction Hierarchies for Graph Search: Running raw Dijkstra on a billion-edge road network takes seconds; precomputing highway shortcut hierarchies reduces routing search from millions of nodes to hundreds, answering queries in <5ms.",
      "Dynamic Edge Weighting: Road topology (streets and turns) is static, but edge weights (minutes to traverse) are highly dynamic; decouple graph structure from dynamic weight overlays.",
      "Map Matching Algorithm (Hidden Markov Models): Raw GPS has 10m error margin; use Hidden Markov Models (HMM) to snap raw coordinates accurately to the actual road geometry and direction of travel."
    ]
  },
  {
    "id": "distributed_rate_limiter",
    "title": "Design Distributed Rate Limiter",
    "badge": "⏱️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100k API Clients • 500k Requests/Sec Peak",
    "qps": "500,000 Rate Limit Checks/Sec • Sub-2ms P99 Latency",
    "difficulty": "Hard",
    "goal": "Design a scalable distributed rate limiting service enforcing Sliding Window Counter algorithms across global data centers with sub-1ms overhead.",
    "availableNodes": [
      {
        "id": "incoming_client",
        "name": "API Consumer Client",
        "icon": "🌐",
        "role": "Submits HTTP request with `Authorization: Bearer <token>` and API key header"
      },
      {
        "id": "api_gateway_proxy",
        "name": "Envoy / API Gateway Reverse Proxy",
        "icon": "🛡️",
        "role": "Interceps request; queries distributed rate limit filter before routing to backend microservice"
      },
      {
        "id": "local_memory_token_bucket",
        "name": "Local Gateway Memory Token Bucket",
        "icon": "⚡",
        "role": "Absorbs 90% of checks in Envoy process RAM using batch token pre-fetching (<0.1ms)"
      },
      {
        "id": "redis_cluster_store",
        "name": "Central Rate Limit Store (Redis Cluster)",
        "icon": "🔴",
        "role": "Executes atomic Lua script sliding window counter: `evalsha ratelimit.lua 1 user_101 100 60`"
      },
      {
        "id": "quota_config_db",
        "name": "Tiered Quota Config DB (PostgreSQL)",
        "icon": "🗄️",
        "role": "Stores client quota tiers (Free: 100 req/min, Pro: 50,000 req/min) with dynamic reload"
      },
      {
        "id": "telemetry_emitter",
        "name": "429 Rejection Telemetry Stream (Kafka)",
        "icon": "📊",
        "role": "Emits HTTP 429 Too Many Requests telemetry for DDoS analytics and billing overage tracking"
      },
      {
        "id": "client_response",
        "name": "HTTP 429 Header Formatter",
        "icon": "⏱️",
        "role": "Attaches RFC standards headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`"
      }
    ],
    "correctSequence": [
      "incoming_client",
      "api_gateway_proxy",
      "local_memory_token_bucket",
      "redis_cluster_store",
      "quota_config_db",
      "telemetry_emitter",
      "client_response"
    ],
    "explanation": "1. Client submits API call. 2. Envoy Gateway intercepts request. 3. Local token bucket checks cached token allotment in memory (<0.1ms). 4. If local tokens exhausted, Gateway calls Redis Cluster executing atomic Lua sliding window script. 5. Quota config database supplies tier limits. 6. Blocked requests emit 429 telemetry to Kafka. 7. Response returns with `Retry-After: 45` and `X-RateLimit-Remaining: 0`.",
    "keyDesignTakeaways": [
      "Token Batching / Pre-Fetching: Making a Redis network roundtrip for every single request at 500k QPS will bottleneck Redis; have gateway nodes pre-fetch batches of 100 tokens into local RAM.",
      "Sliding Window Log vs Sliding Window Counter: Sliding logs store exact timestamps in Redis Sorted Sets (memory heavy); Sliding Window Counter approximates counts by interpolating previous window weight, using 99% less RAM.",
      "Race Condition Elimination via Redis Lua: Never run `GET key` followed by `INCR key`; network interleaving causes race conditions. Run an atomic Redis Lua script that checks and increments in one step."
    ]
  },
  {
    "id": "distributed_log_aggregation",
    "title": "Design Distributed Log Aggregator (Elastic/Kibana)",
    "badge": "📜",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10,000 Microservices • 50 Terabytes Logs/Day",
    "qps": "250,000 Log Events/Sec • Sub-5s Searchable Availability",
    "difficulty": "Hard",
    "goal": "Construct a scalable enterprise log aggregation pipeline with log agents, Kafka buffering, Logstash indexing, and Elasticsearch inverted index storage.",
    "availableNodes": [
      {
        "id": "app_node_agent",
        "name": "Node Log Shipper (Fluentbit / Vector)",
        "icon": "📄",
        "role": "Tails local container JSON stdout/stderr logs; buffers in local memory ring buffer"
      },
      {
        "id": "log_ingest_kafka",
        "name": "Log Ingestion Bus (Kafka Cluster)",
        "icon": "⚡",
        "role": "Absorbs massive log bursts across 100 topic partitions; decouples ingestion from indexing"
      },
      {
        "id": "log_transformer",
        "name": "Log Enrichment & Masking Fleet (Logstash)",
        "icon": "⚙️",
        "role": "Parses stack traces, strips PII (credit cards/passwords), and enriches with K8s pod metadata"
      },
      {
        "id": "es_indexing_cluster",
        "name": "Search & Indexing Engine (Elasticsearch / OpenSearch)",
        "icon": "🔍",
        "role": "Builds inverted indexes on timestamp, service_name, log_level, and message text"
      },
      {
        "id": "warm_storage_s3",
        "name": "Warm / Cold Blob Storage (S3 Glacier)",
        "icon": "🗄️",
        "role": "Lifecycle manager migrates log indices older than 7 days from SSD to low-cost S3 Parquet"
      },
      {
        "id": "search_ui_kibana",
        "name": "Log Query & Visualizer Dashboard (Kibana)",
        "icon": "📊",
        "role": "Executes sub-second Lucene queries (`service:billing AND level:ERROR`) for SRE incident debugging"
      },
      {
        "id": "alerting_engine",
        "name": "Real-Time Anomaly & Error Alerter",
        "icon": "🚨",
        "role": "Scans incoming log stream for spike in 5xx errors; triggers PagerDuty escalation within 10s"
      }
    ],
    "correctSequence": [
      "app_node_agent",
      "log_ingest_kafka",
      "log_transformer",
      "es_indexing_cluster",
      "warm_storage_s3",
      "search_ui_kibana",
      "alerting_engine"
    ],
    "explanation": "1. Fluentbit agent on each K8s host tails container logs. 2. Logs buffered in Kafka. 3. Log transformer parses structured JSON, masks PII (passwords, tokens). 4. Elasticsearch indexes logs into daily indices (`logs-2026-10-29`). 5. Index lifecycle management (ILM) rolls older indices to S3 object storage. 6. Kibana provides sub-second log searching for engineers. 7. Alerting engine triggers PagerDuty on error surges.",
    "keyDesignTakeaways": [
      "Buffer Decoupling via Kafka: When a cascading outage causes all 10,000 services to emit error stack traces simultaneously, indexing clusters slow down; Kafka buffers the traffic burst preventing log loss.",
      "Index Lifecycle Management (ILM - Hot/Warm/Cold): Storing 50TB/day on NVMe SSDs is cost-prohibitive; keep 7 days hot in Elasticsearch NVMe, roll 30 days warm to HDD, and archive 1 year cold in S3 Parquet.",
      "Edge PII Masking: Sanitize sensitive data (credit cards, SSNs, authorization tokens) at the host log shipper before logs leave the node to satisfy compliance audits."
    ]
  },
  {
    "id": "distributed_task_scheduler",
    "title": "Design Distributed Cron & Workflow Scheduler",
    "badge": "⏰",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100M Scheduled Jobs • 1M Jobs Triggered/Minute",
    "qps": "25,000 Job Dispatches/Sec • Exactly-Once Execution Semantics",
    "difficulty": "Hard",
    "goal": "Build a fault-tolerant, distributed workflow engine with cron scheduling, DAG dependency resolution, and Raft consensus leader election.",
    "availableNodes": [
      {
        "id": "job_submitter",
        "name": "Client Service / Cron Manager",
        "icon": "⏱️",
        "role": "Submits scheduled cron expressions (`0 2 * * *`) or delayed one-off task execution requests"
      },
      {
        "id": "scheduler_leader",
        "name": "Leader Election Scheduler (Raft / etcd)",
        "icon": "👑",
        "role": "Elected master node responsible for time-wheel advancement and job partition assignment"
      },
      {
        "id": "hierarchical_time_wheel",
        "name": "Hierarchical Timing Wheel (In-Memory)",
        "icon": "🎡",
        "role": "Maintains O(1) multi-tier circular timer buckets (seconds, minutes, hours, days)"
      },
      {
        "id": "job_metadata_store",
        "name": "Job Metadata & Schedule Store (PostgreSQL)",
        "icon": "🗄️",
        "role": "Persists job definitions, crontab intervals, next execution timestamps, and payloads"
      },
      {
        "id": "dispatch_queue",
        "name": "Execution Task Queue (Kafka / SQS)",
        "icon": "📬",
        "role": "Buffers ready-to-execute tasks partitioned by tenant; handles worker backpressure"
      },
      {
        "id": "worker_pool",
        "name": "Distributed Worker Fleet",
        "icon": "⚙️",
        "role": "Pulls tasks, acquires distributed execution lease lock, runs business logic, and emits status"
      },
      {
        "id": "execution_history_db",
        "name": "Execution History DB (Cassandra / DynamoDB)",
        "icon": "📑",
        "role": "Records start time, finish time, exit code, and retry count for audit and debugging"
      }
    ],
    "correctSequence": [
      "job_submitter",
      "scheduler_leader",
      "hierarchical_time_wheel",
      "job_metadata_store",
      "dispatch_queue",
      "worker_pool",
      "execution_history_db"
    ],
    "explanation": "1. Client submits cron task. 2. Leader scheduler computes `next_execution_time`. 3. Task placed into Hierarchical Timing Wheel in memory for O(1) tick triggering. 4. Next run persisted in DB. 5. When time wheel ticks, job pushed to Kafka dispatch queue. 6. Worker claims task using distributed lock lease, executes task. 7. Execution result and metrics logged to Cassandra.",
    "keyDesignTakeaways": [
      "Hierarchical Timing Wheels (Kafka Purgatory Style): Scanning a database table every second with `SELECT * WHERE next_run <= NOW()` doesn't scale to 100M jobs; Timing Wheels allow O(1) insertion, deletion, and tick execution in memory.",
      "Leader-Follower Failover with etcd: Run multiple scheduler replicas with Raft consensus; if the leader dies mid-tick, the standby node acquires the lease and resumes the time wheel within 2 seconds.",
      "Fencing Tokens for Exactly-Once Execution: Workers acquire a distributed lock with a monotonically increasing fencing token (`token = 42`); if a slow worker wakes up late, the database rejects updates with stale tokens."
    ]
  },
  {
    "id": "cloud_object_storage_s3",
    "title": "Design S3 / Distributed Cloud Object Storage",
    "badge": "🪣",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Billion Objects • 1 Exabyte Storage • 99.999999999% Durability (11 9s)",
    "qps": "250,000 Object Ops/Sec • Erasure Coded Chunk Slicing",
    "difficulty": "Staff+",
    "goal": "Construct an exabyte-scale object storage service with Reed-Solomon Erasure Coding, metadata sharding, and high availability.",
    "availableNodes": [
      {
        "id": "s3_client",
        "name": "SDK / CLI / S3 API Client",
        "icon": "💻",
        "role": "Sends PUT /bucket/key or GET /bucket/key with AWS Signature v4 HMAC authentication"
      },
      {
        "id": "s3_edge_gw",
        "name": "S3 Edge Router & Load Balancer",
        "icon": "🛡️",
        "role": "Terminates TLS, validates SigV4 credentials, and manages chunk streaming"
      },
      {
        "id": "metadata_engine",
        "name": "Object Metadata Engine (Spanner / Cassandra)",
        "icon": "🗄️",
        "role": "Maps `(bucket, key)` to internal object ID, size, version, and chunk placement list"
      },
      {
        "id": "erasure_encoder",
        "name": "Erasure Coding Engine (Reed-Solomon 8+4)",
        "icon": "⚙️",
        "role": "Slices uploaded objects into 8 data chunks + 4 parity chunks; tolerates loss of any 4 failure zones"
      },
      {
        "id": "storage_node_fleet",
        "name": "Distributed Storage Disk Nodes (HDD/SSD)",
        "icon": "💾",
        "role": "Stores raw erasure-coded chunks as append-only binary blobs across separate server racks"
      },
      {
        "id": "scrubber_daemon",
        "name": "Continuous Background Scrubber Daemon",
        "icon": "🧹",
        "role": "Continuously computes SHA-256 bitrot checks; auto-heals corrupted chunks from parity"
      },
      {
        "id": "lifecycle_worker",
        "name": "Lifecycle & Cold Glacier Migration Worker",
        "icon": "🧊",
        "role": "Moves objects older than 90 days to magnetic tape / Glacier deep archive"
      }
    ],
    "correctSequence": [
      "s3_client",
      "s3_edge_gw",
      "metadata_engine",
      "erasure_encoder",
      "storage_node_fleet",
      "scrubber_daemon",
      "lifecycle_worker"
    ],
    "explanation": "1. Client uploads 100MB file via PUT. 2. Edge Gateway authenticates SigV4. 3. Metadata engine creates object entry and generates chunk map. 4. Erasure coding engine splits file into 8 data + 4 parity chunks (Reed-Solomon). 5. Chunks distributed across 12 distinct failure racks. 6. Background scrubber continually scans for bitrot and rebuilds missing chunks. 7. Lifecycle worker migrates cold data to Glacier.",
    "keyDesignTakeaways": [
      "Erasure Coding (Reed-Solomon 8+4) vs 3x Replication: 3x replication has 200% storage overhead; 8+4 Reed-Solomon has only 50% overhead while tolerating 4 simultaneous server failures, saving billions in disk hardware.",
      "Decouple Metadata from Object Data: Metadata (keys, ACLs, sizes) requires low-latency indexing (Spanner/KV store); object payload chunks are stored on high-density commodity hard drives.",
      "Continuous Background Bitrot Scrubbing: Hard drives experience silent bitrot; background scrubbers continuously recompute checksums and reconstruct damaged sectors from parity before other drives fail."
    ]
  },
  {
    "id": "api_gateway_envoy",
    "title": "Design Cloud API Gateway & Reverse Proxy",
    "badge": "🛡️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1,000 Microservices • 1M Requests/Sec Wire Speed",
    "qps": "1,000,000 Proxy Requests/Sec • Sub-2ms Proxy Overhead",
    "difficulty": "Staff+",
    "goal": "Design a resilient API Gateway with circuit breaking, dynamic upstream discovery, JWT verification, and distributed rate limiting.",
    "availableNodes": [
      {
        "id": "ingress_client",
        "name": "Public API Client (Web/Mobile)",
        "icon": "🌐",
        "role": "Initiates HTTPS / HTTP/2 / gRPC request with JWT Bearer authentication token"
      },
      {
        "id": "l4_maglev_lb",
        "name": "L4 Network Load Balancer (DPDK)",
        "icon": "⚖️",
        "role": "Distributes incoming TCP connections across Envoy gateway fleet using consistent hashing"
      },
      {
        "id": "envoy_proxy_worker",
        "name": "Envoy Proxy Worker Fleet (C++ Async)",
        "icon": "⚡",
        "role": "Event-driven non-blocking I/O proxy executing filter chain: TLS, Auth, Routing, WAF"
      },
      {
        "id": "jwt_auth_filter",
        "name": "JWT / mTLS Verification Filter",
        "icon": "🛡️",
        "role": "Validates cryptographic signatures locally using cached JWKS public keys in <0.1ms"
      },
      {
        "id": "service_discovery",
        "name": "Dynamic Service Discovery (Envoy xDS / Consul)",
        "icon": "🔍",
        "role": "Streams live backend cluster endpoint changes (EDS/CDS) over gRPC without reloading proxy"
      },
      {
        "id": "rate_limit_filter",
        "name": "Local + Global Rate Limit Filter",
        "icon": "⏱️",
        "role": "Enforces token bucket quotas and sheds excess load before passing to microservices"
      },
      {
        "id": "backend_upstream",
        "name": "Upstream Internal Microservices",
        "icon": "⚙️",
        "role": "Receives sanitized, authenticated requests with added internal tracing headers (`x-request-id`)"
      }
    ],
    "correctSequence": [
      "ingress_client",
      "l4_maglev_lb",
      "envoy_proxy_worker",
      "jwt_auth_filter",
      "service_discovery",
      "rate_limit_filter",
      "backend_upstream"
    ],
    "explanation": "1. Public request hits L4 Maglev load balancer. 2. Traffic distributed across Envoy workers. 3. Envoy terminates TLS. 4. JWT filter validates auth token using cached JWKS in memory. 5. Service discovery updates route table via xDS protocol without restarts. 6. Rate limiter throttles abusive IPs. 7. Request forwarded to upstream microservice over internal HTTP/2 with distributed trace context.",
    "keyDesignTakeaways": [
      "Non-Blocking Event-Driven Core: Thread-per-request architectures (like legacy Tomcat) exhaust memory at 100k connections; Envoy uses non-blocking epoll/kqueue event loops processing millions of connections per node.",
      "Dynamic Configuration via xDS APIs: Static config files require proxy restarts on microservice deployments; Envoy dynamic discovery APIs (CDS/EDS/RDS) stream topology changes over gRPC with zero dropped connections.",
      "Local JWKS Verification: Never call an external auth server for every request; download and cache public key sets (JWKS) locally in gateway memory to verify RS256/ES256 signatures in <0.05ms."
    ]
  },
  {
    "id": "metrics_monitoring_prometheus",
    "title": "Design Distributed Metrics Monitoring (Prometheus/Grafana)",
    "badge": "📊",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "50,000 Servers • 1 Billion Time Series • 10M Samples/Sec",
    "qps": "10,000,000 Metric Samples/Sec • Sub-2s PromQL Query Execution",
    "difficulty": "Hard",
    "goal": "Build a high-volume time-series metrics monitoring and alerting system with pull scrapers, TSDB compression (Gorilla), and Alertmanager.",
    "availableNodes": [
      {
        "id": "metric_exporter",
        "name": "App Metric Exporter (Prometheus Client)",
        "icon": "📈",
        "role": "Exposes `/metrics` endpoint with counters, gauges, and histograms in text exposition format"
      },
      {
        "id": "pull_scraper_fleet",
        "name": "Distributed Scraper Fleet (Prometheus)",
        "icon": "⚡",
        "role": "Scrapes targets on 15s interval via HTTP GET; chunks samples into append-only memory blocks"
      },
      {
        "id": "tsdb_storage_engine",
        "name": "TSDB Chunk Storage (Gorilla Compression)",
        "icon": "💾",
        "role": "Compresses timestamps and float64 values using XOR delta-of-delta compression (1.3 bytes/sample)"
      },
      {
        "id": "remote_write_adapter",
        "name": "Remote Write Forwarder (Thanos / Cortex)",
        "icon": "📬",
        "role": "Ships 2-hour TSDB blocks to object storage for infinite horizontal scalability"
      },
      {
        "id": "long_term_blob_s3",
        "name": "Object Storage Long-Term Store (S3)",
        "icon": "🗄️",
        "role": "Stores compressed historical metric blocks; partitioned by tenant and compaction level"
      },
      {
        "id": "downsampling_compactor",
        "name": "Downsampling Compactor Daemon",
        "icon": "⚙️",
        "role": "Downsamples raw 15s metrics to 5-minute and 1-hour resolution blocks to speed up long queries"
      },
      {
        "id": "query_engine_grafana",
        "name": "Distributed PromQL Engine & Grafana",
        "icon": "📊",
        "role": "Executes complex PromQL rate/histogram queries and renders dashboard panels in <1s"
      }
    ],
    "correctSequence": [
      "metric_exporter",
      "pull_scraper_fleet",
      "tsdb_storage_engine",
      "remote_write_adapter",
      "long_term_blob_s3",
      "downsampling_compactor",
      "query_engine_grafana"
    ],
    "explanation": "1. Services expose `/metrics`. 2. Scraper fleet pulls metrics every 15s. 3. TSDB engine compresses floating-point samples in RAM using Gorilla XOR compression down to 1.37 bytes. 4. Thanos remote-write pushes blocks to S3. 5. S3 stores long-term metrics cost-effectively. 6. Compactor downsamples aged data. 7. PromQL engine executes Grafana dashboard queries across both local head blocks and S3.",
    "keyDesignTakeaways": [
      "Gorilla Floating-Point Compression: Storing a timestamp (8 bytes) + float value (8 bytes) = 16 bytes. Facebook's Gorilla compression uses delta-of-delta for timestamps and XOR for floats, reducing footprint to ~1.37 bytes per sample (over 90% space reduction).",
      "Pull vs Push Architecture: Prometheus pull model allows scrapers to detect target downtime immediately (if pull fails, target is down) and eliminates risk of metrics flooding the monitoring server during traffic spikes.",
      "Cardinality Explosion Guard: High-cardinality labels (e.g. adding `user_id` or `order_id` to metric labels) creates millions of unique time-series, consuming gigabytes of RAM and crashing Prometheus."
    ]
  },
  {
    "id": "distributed_cache_redis_cluster",
    "title": "Design Distributed In-Memory Cache (Redis Cluster)",
    "badge": "🔴",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Nodes • 10 Terabytes RAM • 16,384 Hash Slots",
    "qps": "2,000,000 Cache Ops/Sec • Sub-1ms Read Latency",
    "difficulty": "Staff+",
    "goal": "Design a scalable distributed in-memory caching cluster with Consistent Hashing (16,384 Hash Slots), Gossip Protocol, and Master-Replica failover.",
    "availableNodes": [
      {
        "id": "app_cache_client",
        "name": "Application Smart Cache Client",
        "icon": "💻",
        "role": "Maintains local routing table of 16,384 hash slots; routes key directly to owner node via CRC16(key) % 16384"
      },
      {
        "id": "cluster_bus_gossip",
        "name": "Gossip Protocol Cluster Bus",
        "icon": "🗣️",
        "role": "Inter-node communication port (port 16379); propagates node heartbeat, failure detection, and slot rebalancing"
      },
      {
        "id": "master_cache_shard",
        "name": "Master Cache Shard Node (RAM)",
        "icon": "🔴",
        "role": "Serves high-speed in-memory reads and writes; handles atomic Lua scripts, sets, hashes, and sorted sets"
      },
      {
        "id": "replica_slave_node",
        "name": "Asynchronous Replica Slave Shard",
        "icon": "👥",
        "role": "Maintains async replication stream from master; automatically promoted on master failure"
      },
      {
        "id": "failover_coordinator",
        "name": "Automated Failover Manager (Raft Consensus)",
        "icon": "👑",
        "role": "Replicas execute majority vote election when master heartbeat times out (>5s), promoting new master in <1s"
      },
      {
        "id": "aof_rdb_persistence",
        "name": "AOF / RDB Disk Persistence Engine",
        "icon": "💾",
        "role": "Appends write commands to append-only file (AOF `everysec`) or takes point-in-time RDB snapshots to disk"
      },
      {
        "id": "migration_balancer",
        "name": "Slot Resharding & Migration Worker",
        "icon": "⚖️",
        "role": "Migrates hash slots between nodes during scale-out with `ASKING` and `MOVED` redirects without downtime"
      }
    ],
    "correctSequence": [
      "app_cache_client",
      "cluster_bus_gossip",
      "master_cache_shard",
      "replica_slave_node",
      "failover_coordinator",
      "aof_rdb_persistence",
      "migration_balancer"
    ],
    "explanation": "1. Client computes `CRC16(key) % 16384` to identify slot. 2. Client queries master node holding slot directly. 3. Master serves read/write in <1ms from memory. 4. Writes asynchronously replicated to replica slave. 5. Gossip bus monitors node heartbeats: if master fails, replicas vote to promote slave. 6. AOF logs writes for disk persistence. 7. Resharding worker moves slots dynamically as new nodes join.",
    "keyDesignTakeaways": [
      "16,384 Fixed Hash Slots: Consistent hashing rings require complicated virtual nodes; Redis divides space into 16,384 discrete slots, making slot ownership easy to map and migrate across nodes.",
      "Smart Client Direct Routing: Clients cache the cluster slot topology; clients send commands directly to the shard owning the key with 0 proxy overhead, only updating topology upon receiving a `MOVED` redirect.",
      "Asynchronous Replication Tradeoff (AP Bias): Redis replication is asynchronous for speed; in rare failover windows where a master crashes before syncing to slave, small data loss can occur (choose strong consistency elsewhere)."
    ]
  },
  {
    "id": "video_transcoding_cluster",
    "title": "Design Distributed Video Transcoding Fleet",
    "badge": "🎞️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "500 Hours Video Uploaded/Minute • 10M Tasks/Day",
    "qps": "1,000 Video Ingestion Jobs/Sec • Sub-5 Minute 4K Transcoding",
    "difficulty": "Hard",
    "goal": "Construct a parallelized video transcoding fleet using chunked SQS dispatch, spot GPU instances, and FFmpeg pipeline processing.",
    "availableNodes": [
      {
        "id": "creator_upload",
        "name": "Content Creator Upload App",
        "icon": "🎥",
        "role": "Uploads raw master video (4K ProRes / MP4) directly to cloud storage via multipart presigned URLs"
      },
      {
        "id": "raw_video_s3",
        "name": "Master Raw Video Storage (S3)",
        "icon": "🪣",
        "role": "Stores uncompressed master video files with multi-region replication"
      },
      {
        "id": "split_coordinator",
        "name": "Video Chunk Splitter & Task Coordinator",
        "icon": "✂️",
        "role": "Inspects video keyframes (GOP); splits video into exact 5-second chunk tasks without re-encoding"
      },
      {
        "id": "task_queue_sqs",
        "name": "Transcode Priority Queue (SQS / Kafka)",
        "icon": "📬",
        "role": "Buffers chunk transcoding jobs; prioritizes short viral videos over 3-hour long-form videos"
      },
      {
        "id": "gpu_worker_fleet",
        "name": "Spot GPU Transcoder Fleet (FFmpeg NVENC)",
        "icon": "⚙️",
        "role": "Pulls 5-second chunks; transcodes into H.264/HEVC/AV1 across resolution ladder (1080p, 720p, 480p)"
      },
      {
        "id": "stitch_packager",
        "name": "Manifest Stitched & HLS Packager",
        "icon": "📦",
        "role": "Gathers transcoded chunk outputs, validates timing continuity, and writes master `.m3u8` playlist"
      },
      {
        "id": "cdn_origin_store",
        "name": "Public Video CDN Storage (S3 / Cloudflare)",
        "icon": "☁️",
        "role": "Hosts final HLS video segments and manifest files ready for global viewer streaming"
      }
    ],
    "correctSequence": [
      "creator_upload",
      "raw_video_s3",
      "split_coordinator",
      "task_queue_sqs",
      "gpu_worker_fleet",
      "stitch_packager",
      "cdn_origin_store"
    ],
    "explanation": "1. Creator uploads 4K video to raw S3 bucket. 2. S3 event triggers Split Coordinator. 3. Video split into 5-second chunks along GOP keyframes. 4. Chunk tasks pushed to SQS queue. 5. Hundreds of spot GPU instances transcode chunks in parallel into multiple bitrates. 6. Stitched Packager verifies all chunks finished and generates HLS manifest (.m3u8). 7. Formatted files published to CDN for global playback.",
    "keyDesignTakeaways": [
      "Parallel Chunk Transcoding (GOP Alignment): Transcoding a 2-hour 4K movie on a single machine takes 2 hours; splitting into 5-second chunks across 1,000 parallel workers completes transcoding in 3 minutes.",
      "Keyframe (I-Frame) Boundary Slicing: You cannot cut a compressed video at an arbitrary byte offset; you must split at Group of Pictures (GOP) keyframe boundaries so chunks decode independently.",
      "Spot Instance Cost Optimization: Video transcoding is stateless and idempotent; run worker fleets on ephemeral AWS Spot Instances (70% cheaper), retrying failed chunks automatically upon spot termination."
    ]
  },
  {
    "id": "realtime_analytics_clickhouse",
    "title": "Design Real-Time Analytics Pipeline (ClickHouse)",
    "badge": "📊",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Billion Events/Day • 100 Terabytes Ingested/Day",
    "qps": "1,000,000 Ingestion Events/Sec • Sub-100ms Aggregate OLAP Queries",
    "difficulty": "Hard",
    "goal": "Build a high-throughput event ingestion and real-time analytical dashboard pipeline using Kafka, Vector, and ClickHouse columnar storage.",
    "availableNodes": [
      {
        "id": "event_producer",
        "name": "Web / Mobile Analytics SDK",
        "icon": "📱",
        "role": "Emits structured JSON user interaction events (pageviews, clicks, purchases)"
      },
      {
        "id": "ingress_collector",
        "name": "High-Throughput Collector Gateway (Rust / Go)",
        "icon": "⚡",
        "role": "Validates schema, drops malformed JSON payloads, and batches events into Kafka buffers"
      },
      {
        "id": "raw_event_kafka",
        "name": "Analytics Event Stream (Kafka)",
        "icon": "📬",
        "role": "Buffers raw events across 128 partitions with 7-day retention for backpressure absorption"
      },
      {
        "id": "clickhouse_ingest_buffer",
        "name": "ClickHouse Ingestion Buffer Engine",
        "icon": "⚙️",
        "role": "Batches incoming rows into 100,000-row chunks in RAM before writing physical columnar parts"
      },
      {
        "id": "clickhouse_columnar_cluster",
        "name": "ClickHouse Columnar Storage Shards",
        "icon": "📊",
        "role": "Stores data in MergeTree format with LZ4 compression; scans billions of rows/sec along columnar indexes"
      },
      {
        "id": "materialized_view_engine",
        "name": "Continuous Materialized Views (SummingMergeTree)",
        "icon": "📈",
        "role": "Pre-aggregates real-time metrics (e.g. hourly active users, revenue per merchant) during background merges"
      },
      {
        "id": "bi_dashboard_api",
        "name": "BI Dashboard & SQL Query API",
        "icon": "🖥️",
        "role": "Executes complex analytical queries (`SELECT country, count(), sum(revenue) GROUP BY country`) in <100ms"
      }
    ],
    "correctSequence": [
      "event_producer",
      "ingress_collector",
      "raw_event_kafka",
      "clickhouse_ingest_buffer",
      "clickhouse_columnar_cluster",
      "materialized_view_engine",
      "bi_dashboard_api"
    ],
    "explanation": "1. Mobile SDKs emit clickstream events. 2. Collector validates schema. 3. Kafka buffers events across 128 partitions. 4. Ingestion buffer collects 100,000 rows in memory. 5. ClickHouse commits data as compressed columnar parts (MergeTree) on NVMe disks. 6. Materialized views pre-aggregate hourly metrics during background compaction. 7. BI API runs analytical SQL queries across billions of rows in <100ms.",
    "keyDesignTakeaways": [
      "Columnar Storage vs Row-Oriented: Row databases (PostgreSQL/MySQL) read entire rows from disk; ClickHouse reads only the specific columns requested in the query, reducing disk I/O by 90%+.",
      "Batch Inserts vs Single-Row Inserts: ClickHouse creates an immutable data part file on disk for every insert; sending individual single-row inserts will create 'Too many parts' errors. Always buffer and insert in batches of 10,000 to 100,000 rows.",
      "Sparse Primary Indexing: ClickHouse uses sparse primary indexes (1 index mark every 8,192 rows), allowing the entire index for billions of rows to fit easily in server RAM."
    ]
  },
  {
    "id": "distributed_id_snowflake",
    "title": "Design Twitter Snowflake / 64-Bit Unique ID Generator",
    "badge": "🔢",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100,000 ID Generation Nodes • 10B IDs Generated/Day",
    "qps": "1,000,000 ID Requests/Sec • Sub-Millisecond Latency",
    "difficulty": "Medium",
    "goal": "Build a high-performance, k-sorted, 64-bit unique ID generation service using Timestamp (41b), Machine ID (10b), and Sequence Counter (12b).",
    "availableNodes": [
      {
        "id": "client_svc",
        "name": "Application Microservice (Tweets/Orders)",
        "icon": "💻",
        "role": "Calls local Snowflake generator library or ID service over high-speed gRPC"
      },
      {
        "id": "zookeeper_worker_reg",
        "name": "Worker Node Registry (ZooKeeper / etcd)",
        "icon": "👑",
        "role": "Coordinates unique `worker_id` (0-1023) assignment to active Snowflake server instances"
      },
      {
        "id": "epoch_time_clock",
        "name": "Millisecond Monotonic Clock Source",
        "icon": "⏱️",
        "role": "Reads system monotonic timestamp with backward NTP clock drift protection"
      },
      {
        "id": "sequence_counter",
        "name": "12-Bit Per-Millisecond Counter",
        "icon": "🔢",
        "role": "Maintains in-memory counter (0-4095) for IDs generated in the exact same millisecond"
      },
      {
        "id": "bit_packer_engine",
        "name": "64-Bit Binary Layout Bit Packer",
        "icon": "⚙️",
        "role": "Bitwise packs: `[1-bit sign | 41-bit timestamp | 10-bit worker_id | 12-bit sequence]`"
      },
      {
        "id": "clock_drift_guard",
        "name": "NTP Clock Rollback Circuit Breaker",
        "icon": "🛡️",
        "role": "Detects backward clock shifts; sleeps or rejects generation until time catches up to prevent duplicate IDs"
      },
      {
        "id": "id_response",
        "name": "Generated 64-Bit ID (Int64 / String)",
        "icon": "✨",
        "role": "Returns 64-bit integer (e.g. `154982910293847291`) guaranteed to be globally unique and K-sortable"
      }
    ],
    "correctSequence": [
      "client_svc",
      "zookeeper_worker_reg",
      "epoch_time_clock",
      "sequence_counter",
      "bit_packer_engine",
      "clock_drift_guard",
      "id_response"
    ],
    "explanation": "1. Service requests new ID. 2. Worker node has pre-assigned worker ID (0-1023) from ZooKeeper. 3. Current timestamp in milliseconds retrieved. 4. Sequence counter incremented (0-4095). If >4095 in same ms, wait for next ms. 5. Bit packer combines bits into 64-bit integer. 6. Clock drift guard verifies time hasn't rolled backwards. 7. Returns 64-bit K-sortable ID.",
    "keyDesignTakeaways": [
      "Binary Bit Allocation Layout: 1 bit unused sign (0) + 41 bits timestamp (~69 years from custom epoch) + 10 bits worker node ID (1,024 unique instances) + 12 bits sequence number (4,096 IDs per ms per worker = 4.096M IDs/sec per instance).",
      "Roughly Time-Sortable (K-Sortable): Because the most significant bits represent the creation timestamp, IDs sorted numerically are automatically sorted chronologically, preserving B+Tree index locality in databases.",
      "NTP Clock Rollback Hazard: If NTP adjusts system clock backwards, generating IDs with the previous timestamp will generate duplicates; pause generation or use logical sequence incrementation until real time catches up."
    ]
  },
  {
    "id": "cdn_cache_purge_engine",
    "title": "Design Cloudflare / Global Instant CDN Cache Purge Mesh",
    "badge": "🌐",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "300 Global PoPs • 10M Purge Requests/Day • Sub-150ms Global Propagation",
    "qps": "25,000 Purge Requests/Sec • Tag / URL / Wildcard Invalidation",
    "difficulty": "Staff+",
    "goal": "Design a global cache invalidation mesh that purges cached URLs across 300+ edge data centers within 150 milliseconds.",
    "availableNodes": [
      {
        "id": "api_purge_client",
        "name": "Customer Webhook / Purge API Client",
        "icon": "💻",
        "role": "Submits cache purge request by exact URL, Cache-Tag (`tag: article_42`), or prefix wildcard (`/images/*`)"
      },
      {
        "id": "purge_gateway",
        "name": "Global Purge API Gateway",
        "icon": "🛡️",
        "role": "Authenticates customer API key, validates tag syntax, and assigns monotonic purge sequence ID"
      },
      {
        "id": "purge_broadcast_mesh",
        "name": "Pipelined Broadcast Mesh (Kafka / NATS)",
        "icon": "⚡",
        "role": "Distributes purge instruction to 300 edge Point of Presence (PoP) regions via dedicated low-latency backbone"
      },
      {
        "id": "edge_pop_controller",
        "name": "PoP Edge Invalidation Controller",
        "icon": "🌐",
        "role": "Receives purge event at edge data center; updates in-memory filter in <5ms"
      },
      {
        "id": "epoch_tag_cache",
        "name": "Cache-Tag Epoch Table (Redis / RAM)",
        "icon": "🏷️",
        "role": "Maintains tag generation versions: incrementing `tag:article_42` from v1 to v2 invalidates all tagged assets instantly"
      },
      {
        "id": "edge_proxy_nginx",
        "name": "Edge HTTP Cache Proxy (Nginx / Pingora)",
        "icon": "☁️",
        "role": "Serves user traffic; checks asset tag generation against epoch table: if stale, revalidates with origin"
      },
      {
        "id": "origin_revalidate",
        "name": "Customer Origin Server",
        "icon": "🖥️",
        "role": "Receives revalidation fetch for purged asset; returns updated content and new Cache-Tag headers"
      }
    ],
    "correctSequence": [
      "api_purge_client",
      "purge_gateway",
      "purge_broadcast_mesh",
      "edge_pop_controller",
      "epoch_tag_cache",
      "edge_proxy_nginx",
      "origin_revalidate"
    ],
    "explanation": "1. Customer publishes breaking news update; calls Purge API with `tags: ['article_42']`. 2. Purge Gateway issues sequence ID. 3. Low-latency broadcast mesh fans out purge to 300 PoPs worldwide. 4. Edge PoP controller receives packet. 5. Increments version counter for `article_42` in local RAM epoch table in <5ms. 6. Edge proxy compares cached asset tag version with epoch table: detects v1 is stale. 7. Proxy fetches fresh content from origin.",
    "keyDesignTakeaways": [
      "Tag Generation Epoch Versioning: Deleting millions of cached files from disk takes seconds; maintaining an in-memory generation table (`tag:shoes = version 3`) allows instant invalidation in <1ms by simply bumping the tag version.",
      "Dedicated Global Fan-Out Backbone: Distribute purges using persistent low-latency pub/sub conduits (NATS / gRPC streams) over private dark fiber rather than public internet HTTP to reach all 300 PoPs in <100ms.",
      "Soft Purge (Stale-While-Revalidate): When content is purged, serve the stale copy to users for 500ms while asynchronously revalidating with the origin, preventing an origin thundering herd stampede."
    ]
  },
  {
    "id": "database_cdc_debezium",
    "title": "Design Debezium / Postgres WAL Change Data Capture Pipeline",
    "badge": "🔄",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Production DBs • 100M Daily Table Mutations",
    "qps": "50,000 CDC Events/Sec • Sub-Second End-to-End Latency",
    "difficulty": "Medium",
    "goal": "Build an asynchronous data streaming pipeline using Change Data Capture (CDC) to stream database row mutations to Kafka without SQL polling overhead.",
    "availableNodes": [
      {
        "id": "source_postgres_db",
        "name": "Source PostgreSQL Database",
        "icon": "💾",
        "role": "Commits application transactions; writes ordered change events to Write-Ahead Log (WAL)"
      },
      {
        "id": "logical_decoding_slot",
        "name": "Postgres Logical Replication Slot",
        "icon": "📑",
        "role": "Decodes raw WAL bytes into structured row mutation tuples (BEFORE / AFTER state)"
      },
      {
        "id": "debezium_connector",
        "name": "Debezium CDC Connector (Kafka Connect)",
        "icon": "⚡",
        "role": "Streams logical replication events; attaches schema change metadata and LSN offsets"
      },
      {
        "id": "event_buffer_kafka",
        "name": "Change Event Stream (Kafka Cluster)",
        "icon": "📬",
        "role": "Stores change events partitioned by primary key (`table_pk`); guarantees strict per-row ordering"
      },
      {
        "id": "outbox_router",
        "name": "Transactional Outbox Event Router",
        "icon": "⚙️",
        "role": "Filters business domain events written to `outbox` table and routes to external topics"
      },
      {
        "id": "sink_consumers",
        "name": "Downstream Sink Consumers (Elastic / Redis / DWH)",
        "icon": "🔄",
        "role": "Hydrates search indexes, invalidates cache keys, and updates analytics warehouses in real time"
      },
      {
        "id": "schema_registry",
        "name": "Avro Schema Registry",
        "icon": "🛡️",
        "role": "Tracks DDL schema evolution (column additions, renames) ensuring backward compatibility"
      }
    ],
    "correctSequence": [
      "source_postgres_db",
      "logical_decoding_slot",
      "debezium_connector",
      "event_buffer_kafka",
      "outbox_router",
      "sink_consumers",
      "schema_registry"
    ],
    "explanation": "1. App commits SQL transaction in PostgreSQL. 2. Postgres appends row changes to WAL. 3. Logical replication slot decodes WAL bytes into row deltas. 4. Debezium connector captures mutations with Log Sequence Numbers (LSN) and schema headers from Avro Registry. 5. Events pushed to Kafka partitioned by primary key. 6. Outbox router dispatches domain events. 7. Downstream consumers update Elasticsearch search index and Redis cache in <500ms.",
    "keyDesignTakeaways": [
      "Log-Based CDC vs Polling: Polling tables (`WHERE updated_at > NOW() - 5s`) cannot detect DELETE operations and causes heavy table scan CPU load; WAL tailing captures INSERT, UPDATE, and DELETE in exact commit order with zero query overhead.",
      "Transactional Outbox Pattern: Dual-writing to both database and Kafka in application code causes distributed inconsistencies if one fails; write the event to an `outbox` table inside the same DB transaction, letting CDC stream it to Kafka.",
      "Replication Slot Lag Monitoring: If Kafka Connect crashes, PostgreSQL retains WAL segments on disk; unmonitored replication slots can fill the server disk and crash the entire database."
    ]
  },
  {
    "id": "distributed_tracing_jaeger",
    "title": "Design Distributed Tracing System (OpenTelemetry / Jaeger)",
    "badge": "🔍",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "5,000 Microservices • 10 Billion Spans/Day",
    "qps": "250,000 Spans Ingested/Sec • Sub-2s Waterfall Trace Rendering",
    "difficulty": "Hard",
    "goal": "Construct an end-to-end distributed tracing platform with trace context propagation (W3C TraceContext), tail-based sampling, and dependency graph generation.",
    "availableNodes": [
      {
        "id": "app_tracer_sdk",
        "name": "App OpenTelemetry SDK",
        "icon": "💻",
        "role": "Injects W3C TraceContext headers (`traceparent`) into outgoing HTTP/gRPC RPC calls and records child spans"
      },
      {
        "id": "otel_collector_agent",
        "name": "Node OpenTelemetry Collector Agent",
        "icon": "⚡",
        "role": "Receives spans locally via gRPC; batches and applies Tail-Based Sampling (keeps 100% of errors)"
      },
      {
        "id": "span_ingest_kafka",
        "name": "Span Ingestion Queue (Kafka)",
        "icon": "📬",
        "role": "Buffers raw trace spans across partitions to isolate collector from storage write spikes"
      },
      {
        "id": "jaeger_ingester",
        "name": "Jaeger Ingestion Fleet",
        "icon": "⚙️",
        "role": "Pulls spans from Kafka, validates DAG references, and indexes service/operation tags"
      },
      {
        "id": "trace_db_cassandra",
        "name": "Trace Storage Engine (Cassandra / ScyllaDB)",
        "icon": "🗄️",
        "role": "Stores full trace DAG trees partitioned by `trace_id` with clustering key on span start time"
      },
      {
        "id": "dependency_spark",
        "name": "Service Dependency Graph Aggregator (Spark)",
        "icon": "🌲",
        "role": "Computes inter-service dependency call graph topology edges (A calls B with 45ms latency)"
      },
      {
        "id": "jaeger_ui_viewer",
        "name": "Jaeger Trace Waterfall UI",
        "icon": "📊",
        "role": "Visualizes end-to-end request timeline with critical path latency highlights"
      }
    ],
    "correctSequence": [
      "app_tracer_sdk",
      "otel_collector_agent",
      "span_ingest_kafka",
      "jaeger_ingester",
      "trace_db_cassandra",
      "dependency_spark",
      "jaeger_ui_viewer"
    ],
    "explanation": "1. App SDK injects W3C `traceparent: 00-4bf92f...-01`. 2. Node OTel collector batches spans and evaluates tail-based sampling (saves all traces containing errors or >2s latency). 3. Spans buffered in Kafka. 4. Ingester parses span trees. 5. Cassandra stores spans keyed by `trace_id`. 6. Spark job builds dependency topology graph. 7. Jaeger UI renders interactive waterfall view of request spans.",
    "keyDesignTakeaways": [
      "Tail-Based Sampling vs Head-Based Sampling: Head sampling decides whether to keep a trace at the root request (5% random); tail sampling waits until the trace finishes, guaranteeing that 100% of errors and latency outliers are preserved.",
      "W3C TraceContext Standardization: Propagate `traceparent` (`version-traceId-spanId-traceFlags`) across HTTP and gRPC boundaries to maintain continuous context across polyglot microservices.",
      "Cassandra Partitioning by Trace ID: Storing all spans of a single trace in the same Cassandra partition (`WHERE trace_id = ?`) allows the UI to fetch the complete trace in a single disk read."
    ]
  },
  {
    "id": "secret_management_vault",
    "title": "Design HashiCorp Vault / Dynamic Secret Manager",
    "badge": "🔐",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100,000 Workloads • 10M Secrets • Sub-10ms Authorization",
    "qps": "50,000 Secret Reads/Sec • Zero Plaintext at Rest (Shamir's Secret Sharing)",
    "difficulty": "Hard",
    "goal": "Design a secure secret management service with Shamir Secret Sharing, envelope encryption with KMS, and dynamic short-lived database credentials.",
    "availableNodes": [
      {
        "id": "workload_client",
        "name": "Microservice / CI/CD Runner",
        "icon": "💻",
        "role": "Authenticates using Kubernetes ServiceAccount JWT / AWS IAM role; requests dynamic DB credentials"
      },
      {
        "id": "vault_api_gw",
        "name": "Vault API Gateway & mTLS Proxy",
        "icon": "🛡️",
        "role": "Terminates TLS 1.3, verifies workload identity with auth plugins (K8s, OIDC, AppRole)"
      },
      {
        "id": "policy_enforcer",
        "name": "Path-Based Policy Engine (HCL / RBAC)",
        "icon": "📜",
        "role": "Evaluates granular least-privilege ACL rules: e.g. `path 'secret/data/billing/*' { capabilities = ['read'] }`"
      },
      {
        "id": "crypto_barrier",
        "name": "Cryptographic Barrier (AES-256-GCM)",
        "icon": "🔒",
        "role": "Encrypts and decrypts all data passing to storage; protected by Master Key unsealed via Shamir's Secret Sharing"
      },
      {
        "id": "dynamic_secret_engine",
        "name": "Dynamic Secret Engine (Postgres/AWS)",
        "icon": "⚙️",
        "role": "Generates short-lived credentials on-demand: `CREATE USER v_user_44 WITH PASSWORD '...' VALID UNTIL '...'`"
      },
      {
        "id": "lease_revocation_mgr",
        "name": "Lease & Revocation Manager",
        "icon": "⏱️",
        "role": "Tracks credential TTLs (e.g. 1 hour); automatically revokes DB credentials upon lease expiration"
      },
      {
        "id": "storage_backend_raft",
        "name": "Integrated Storage Engine (Raft HA Cluster)",
        "icon": "🗄️",
        "role": "Stores encrypted ciphertext key-values across 5-node strongly consistent Raft consensus cluster"
      }
    ],
    "correctSequence": [
      "workload_client",
      "vault_api_gw",
      "policy_enforcer",
      "crypto_barrier",
      "dynamic_secret_engine",
      "lease_revocation_mgr",
      "storage_backend_raft"
    ],
    "explanation": "1. Microservice requests database password with K8s token. 2. Vault Gateway verifies identity with K8s token review API. 3. Policy engine verifies access permissions. 4. Crypto barrier decrypts backend configurations. 5. Dynamic secret engine generates unique temporary database user valid for 1 hour. 6. Lease manager tracks TTL. 7. Encrypted lease state saved in Raft storage backend. When TTL expires, Vault drops the SQL user automatically.",
    "keyDesignTakeaways": [
      "Dynamic Secrets vs Static Secrets: Never share static permanent passwords; generate unique, ephemeral database credentials on-demand with a 1-hour TTL that automatically self-destruct upon expiration.",
      "Cryptographic Barrier (Zero Plaintext at Rest): The storage backend (Raft/Consul) never sees plaintext secrets; all data is encrypted via AES-256-GCM before touching disk.",
      "Shamir's Secret Sharing (Unsealing): The master encryption key is split into 5 key shares; 3 out of 5 shares are required to reconstruct the master key and unseal the vault upon restart, preventing single-operator compromise."
    ]
  },
  {
    "id": "distributed_database_vitess",
    "title": "Design Vitess / Horizontal MySQL Sharding Proxy",
    "badge": "🗄️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Terabytes SQL Data • 500 MySQL Shards • 250,000 QPS",
    "qps": "250,000 Distributed SQL QPS • Transparent Sharding & Resharding",
    "difficulty": "Staff+",
    "goal": "Design a database sharding proxy that provides transparent horizontal SQL sharding, two-phase commit coordination, and scatter-gather query execution.",
    "availableNodes": [
      {
        "id": "sql_app_client",
        "name": "Application MySQL Client",
        "icon": "💻",
        "role": "Connects over standard MySQL wire protocol; executes standard SQL queries without knowing data is sharded"
      },
      {
        "id": "vtgate_proxy",
        "name": "Stateless Query Router (VTGate)",
        "icon": "🔀",
        "role": "Parses SQL AST, inspects VSchema keyspace rules, and routes queries to target shard(s) or scatters queries"
      },
      {
        "id": "vschema_coord",
        "name": "Topology Registry (etcd / ZooKeeper)",
        "icon": "👑",
        "role": "Stores keyspace schemas, sharding keys (e.g. `hash(user_id)`), and shard range boundaries"
      },
      {
        "id": "vttablet_agent",
        "name": "Shard Manager & Pooler (VTTablet)",
        "icon": "🛡️",
        "role": "Sits in front of MySQL; manages connection pooling, query memory limits, and query deduplication"
      },
      {
        "id": "mysql_shard_master",
        "name": "MySQL Primary Shard Instance",
        "icon": "💾",
        "role": "Executes ACID transactions on assigned keyspace hash range (e.g. shard `-80` vs `80-`)"
      },
      {
        "id": "vstream_cdc_reshard",
        "name": "Online Resharding Streamer (VReplication)",
        "icon": "🔄",
        "role": "Copies data and streams real-time binlog replication to split 1 shard into 2 shards with zero downtime"
      },
      {
        "id": "scatter_gather_engine",
        "name": "Scatter-Gather Aggregation Engine",
        "icon": "⚙️",
        "role": "Executes cross-shard joins, merges sorted sub-results, and returns consolidated result set"
      }
    ],
    "correctSequence": [
      "sql_app_client",
      "vtgate_proxy",
      "vschema_coord",
      "vttablet_agent",
      "mysql_shard_master",
      "vstream_cdc_reshard",
      "scatter_gather_engine"
    ],
    "explanation": "1. App sends `SELECT * FROM orders WHERE user_id = 42`. 2. VTGate parses query. 3. VSchema identifies `user_id` as sharding key; hashes ID to determine target shard (e.g. shard `40-80`). 4. VTTablet manages connection pool. 5. MySQL shard executes query. 6. VReplication allows splitting shards online with zero write downtime. 7. Scatter-gather engine combines results for cross-shard queries.",
    "keyDesignTakeaways": [
      "Transparent SQL Sharding: Application code uses standard MySQL drivers; VTGate parses SQL syntax trees and rewrites queries for target shards transparently.",
      "Connection Protection via VTTablet: MySQL crashes when 10,000 app threads open connections simultaneously; VTTablet pools connections locally, serving 10,000 frontend connections using only 50 physical MySQL connections.",
      "Zero-Downtime Online Resharding (VReplication): Shards can be split (e.g. 1 shard split into 2) while continuing to accept live writes: copy historical data, catch up via binlog replication, and atomically cut over traffic in <1 second."
    ]
  },
  {
    "id": "iot_telemetry_influxdb",
    "title": "Design Connected Car Fleet Telemetry (Tesla IoT)",
    "badge": "🚗",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10M Connected Vehicles • 500,000 Telemetry Samples/Sec",
    "qps": "500,000 Telemetry Ingests/Sec • Time-Series Retention Rollups",
    "difficulty": "Hard",
    "goal": "Build a resilient IoT sensor ingestion pipeline with MQTT broker clustering, Kafka buffering, and downsampling retention policies in TimescaleDB.",
    "availableNodes": [
      {
        "id": "vehicle_telemetry_unit",
        "name": "Vehicle Telemetry Control Unit (TCU)",
        "icon": "🚗",
        "role": "Collects battery pack cell voltages, motor RPM, tire pressure, and GPS; emits Protobuf batches over LTE/5G"
      },
      {
        "id": "mqtt_edge_ingest",
        "name": "MQTT Edge Broker Cluster (EMQX)",
        "icon": "⚡",
        "role": "Maintains persistent lightweight TCP sessions; terminates TLS and authenticates vehicle hardware certificates"
      },
      {
        "id": "telemetry_bus_kafka",
        "name": "Telemetry Buffer Stream (Kafka)",
        "icon": "📬",
        "role": "Buffers sensor streams partitioned by `vin_hash` across 256 topic partitions"
      },
      {
        "id": "tsdb_writer_fleet",
        "name": "Time-Series Ingestion Workers",
        "icon": "⚙️",
        "role": "Batches metrics into multi-megabyte compressed columnar blocks; handles schema tag extraction"
      },
      {
        "id": "tsdb_cluster_influx",
        "name": "Time-Series Storage Cluster (InfluxDB / TimescaleDB)",
        "icon": "📊",
        "role": "Stores high-precision sensor metrics using TSM (Time-Structured Merge Tree) with Gorillas delta-of-delta compression"
      },
      {
        "id": "downsample_worker",
        "name": "Downsampling & Aggregation Daemon",
        "icon": "📉",
        "role": "Downsamples raw 1Hz data to 1-minute averages after 7 days, and 1-hour averages after 30 days"
      },
      {
        "id": "fleet_safety_alert",
        "name": "Fleet Anomaly & Safety Alert Engine",
        "icon": "🚨",
        "role": "Scans battery cell temperature deltas in real time; alerts engineers within 5s of thermal runaway risks"
      }
    ],
    "correctSequence": [
      "vehicle_telemetry_unit",
      "mqtt_edge_ingest",
      "telemetry_bus_kafka",
      "tsdb_writer_fleet",
      "tsdb_cluster_influx",
      "downsample_worker",
      "fleet_safety_alert"
    ],
    "explanation": "1. Vehicle TCU batches battery and motor metrics. 2. MQTT broker receives Protobuf over cellular TLS. 3. Kafka buffers events by VIN. 4. TSDB workers batch rows into columnar memory buffers. 5. InfluxDB writes compressed TSM parts. 6. Continuous downsampler aggregates aged data to reduce storage volume by 95%. 7. Anomaly alert engine flags battery cell thermal runaway risks in real time.",
    "keyDesignTakeaways": [
      "Time-Structured Merge Tree (TSM): Standard LSM trees store arbitrary keys; TSM trees are optimized specifically for timestamps and float metrics, grouping consecutive timestamps and compressing with Gorilla float XOR.",
      "Downsampling Continuous Queries: Storing 1-second raw telemetry for 10M cars requires 50PB/year; retain raw 1s data for 7 days, 1-minute rollups for 90 days, and 1-hour averages for 5 years.",
      "Protobuf Serialization over Cellular: JSON headers consume significant mobile carrier bandwidth; binary Protocol Buffers reduce payload size by 80%, saving millions in cellular SIM card data roaming costs."
    ]
  },
  {
    "id": "zero_trust_mesh_spiffe",
    "title": "Design Zero-Trust Service Identity Mesh (SPIFFE/SPIRE)",
    "badge": "🛡️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "50,000 Microservices • 100k mTLS Sockets • Sub-Hour Cert Rotation",
    "qps": "100,000 Workload Attestations/Sec • Cryptographic X.509 SVIDs",
    "difficulty": "Staff+",
    "goal": "Construct a zero-trust mutual TLS (mTLS) service mesh infrastructure that issues short-lived X.509 SVID certificates to ephemeral microservices.",
    "availableNodes": [
      {
        "id": "workload_container",
        "name": "Microservice Pod Container",
        "icon": "💻",
        "role": "Ephemeral container needing to communicate securely with internal backend services over mutual TLS"
      },
      {
        "id": "spire_agent_daemon",
        "name": "Node SPIRE Agent Daemon",
        "icon": "🛡️",
        "role": "Runs on each Kubernetes worker node; performs local workload attestation using Linux cgroups and K8s pod UID"
      },
      {
        "id": "attestation_engine",
        "name": "Workload Attestor Plugin",
        "icon": "🔍",
        "role": "Verifies pod identity against K8s API server: checks namespace, service account, and container image hash"
      },
      {
        "id": "spire_server_ca",
        "name": "SPIRE Server & Intermediate CA",
        "icon": "👑",
        "role": "Signs short-lived X.509 SPIFFE Verifiable Identity Documents (SVID) valid for 1 hour"
      },
      {
        "id": "svid_memory_socket",
        "name": "Local SPIFFE Workload API Socket",
        "icon": "⚡",
        "role": "Exposes local UNIX domain socket; feeds fresh X.509 certificates and private keys directly to Envoy sidecar in RAM"
      },
      {
        "id": "envoy_sidecar_mtls",
        "name": "Envoy Sidecar mTLS Proxy",
        "icon": "🔒",
        "role": "Terminates and initiates mutual TLS connections; validates peer SPIFFE ID: `spiffe://prod.acme/ns/billing/sa/orders`"
      },
      {
        "id": "audit_trust_bundle",
        "name": "Trust Bundle & Certificate Revocation Store",
        "icon": "📑",
        "role": "Distributes root CA trust bundles and monitors certificate rotation telemetry"
      }
    ],
    "correctSequence": [
      "workload_container",
      "spire_agent_daemon",
      "attestation_engine",
      "spire_server_ca",
      "svid_memory_socket",
      "envoy_sidecar_mtls",
      "audit_trust_bundle"
    ],
    "explanation": "1. Microservice boots in K8s pod. 2. Node SPIRE agent detects new container. 3. Attestor verifies container cgroup and K8s ServiceAccount. 4. SPIRE Server issues short-lived X.509 SVID (1-hour TTL). 5. SVID and private key delivered via local UNIX domain socket in memory (zero disk write). 6. Envoy sidecar uses SVID to establish mTLS connection with peer service, verifying peer identity URI. 7. Certificates automatically rotated every 30 minutes.",
    "keyDesignTakeaways": [
      "Zero Implicit Trust (Zero Trust): Network location (being inside the VPC or private subnet) grants zero trust; every single RPC must be cryptographically authenticated using mutual TLS (mTLS).",
      "SPIFFE ID URI Naming: Workload identities are standardized as URIs in the X.509 Subject Alternative Name (SAN): `spiffe://trust-domain/ns/namespace/sa/service-account`, allowing fine-grained authorization policies.",
      "Short-Lived Ephemeral Certificates (1-Hour TTL): Long-lived certificates require complex CRL/OCSP revocation infrastructure; issuing 1-hour certificates rotated every 30 minutes eliminates the need for certificate revocation lists."
    ]
  },
  {
    "id": "cloud_load_balancer_maglev",
    "title": "Design Google Maglev / L4 Network Load Balancer",
    "badge": "⚖️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Gbps Wire Speed • 10M Packets/Sec • Line-Rate ECMP",
    "qps": "10,000,000 Packets/Sec • Sub-Microsecond Kernel Bypass Routing",
    "difficulty": "Staff+",
    "goal": "Design a software-defined L4 load balancer using DPDK kernel bypass, Consistent Hashing lookup tables, and BGP Equal-Cost Multi-Path (ECMP) routing.",
    "availableNodes": [
      {
        "id": "public_traffic_stream",
        "name": "Public Internet Client Traffic",
        "icon": "🌐",
        "role": "Emits incoming TCP/UDP packets towards virtual IP (VIP) announced globally via BGP Anycast"
      },
      {
        "id": "bgp_router_mesh",
        "name": "Edge BGP Router Mesh (ECMP)",
        "icon": "🔀",
        "role": "Distributes incoming packets evenly across Maglev load balancer cluster using Equal-Cost Multi-Path"
      },
      {
        "id": "dpdk_packet_rx",
        "name": "Kernel Bypass Packet Receiver (DPDK)",
        "icon": "⚡",
        "role": "Polls NIC directly in userspace via poll-mode drivers (PMD), bypassing Linux network stack overhead"
      },
      {
        "id": "maglev_hashing_lookup",
        "name": "Maglev Consistent Hashing Table",
        "icon": "🎯",
        "role": "Computes 5-tuple hash `(src_ip, src_port, dst_ip, dst_port, proto)`; maps packet to stable backend index"
      },
      {
        "id": "connection_tracking_ram",
        "name": "Local Connection Tracking Table (Lock-Free)",
        "icon": "💾",
        "role": "Maintains TCP session state in memory; ensures packets of established flows always reach the same backend"
      },
      {
        "id": "gre_geneve_encap",
        "name": "Generic Routing Encapsulation (GRE/GENEVE)",
        "icon": "📦",
        "role": "Encapsulates original packet in GRE tunnel and forwards to backend endpoint at wire speed"
      },
      {
        "id": "backend_realserver_dsr",
        "name": "Backend Application Server (Direct Server Return - DSR)",
        "icon": "🖥️",
        "role": "Processes request; replies directly to client IP bypassing load balancer (DSR asymmetric return)"
      }
    ],
    "correctSequence": [
      "public_traffic_stream",
      "bgp_router_mesh",
      "dpdk_packet_rx",
      "maglev_hashing_lookup",
      "connection_tracking_ram",
      "gre_geneve_encap",
      "backend_realserver_dsr"
    ],
    "explanation": "1. Client sends TCP SYN to Virtual IP (VIP). 2. BGP Anycast router uses ECMP to route to Maglev node. 3. DPDK kernel bypass receives packet at 10M pkts/sec. 4. Maglev consistent hashing table computes destination backend. 5. Connection tracking table saves flow mapping. 6. Packet encapsulated in GRE tunnel and sent to backend server. 7. Backend server responds directly to client using Direct Server Return (DSR), eliminating outbound bandwidth bottlenecks on the load balancer.",
    "keyDesignTakeaways": [
      "Kernel Bypass (DPDK): Traditional Linux kernel networking involves interrupt handling and socket buffer allocation, capping throughput at ~1M packets/sec; DPDK poll-mode drivers achieve wire-speed 10M+ packets/sec in userspace.",
      "Direct Server Return (DSR): Web traffic is asymmetric (clients send small 1KB requests, servers return large 1MB video/HTML responses); DSR lets backend servers respond directly to the client, keeping load balancers 100% focused on incoming packets.",
      "Maglev Consistent Hashing: Generates a lookup permutation table where node additions or removals disturb only a minimal fraction of existing connection flows, preventing connection drops during load balancer autoscaling."
    ]
  },
  {
    "id": "distributed_kv_etcd_raft",
    "title": "Design etcd / Strongly Consistent Raft KV Store",
    "badge": "🗄️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "Linearizable ACID Reads/Writes • 50,000 Ops/Sec • Multi-Version Concurrency (MVCC)",
    "qps": "50,000 Distributed Consensus Ops/Sec • Sub-5ms Commit Latency",
    "difficulty": "Staff+",
    "goal": "Build a strongly consistent distributed key-value store using the Raft consensus algorithm with leader lease management and multi-version concurrency control (MVCC).",
    "availableNodes": [
      {
        "id": "etcd_client",
        "name": "Kubernetes API Server / Client",
        "icon": "💻",
        "role": "Issues atomic Put, Range (Get), or Watch requests over HTTP/2 gRPC with linearizable consistency requirements"
      },
      {
        "id": "raft_consensus_module",
        "name": "Raft Consensus Module (Leader Election)",
        "icon": "👑",
        "role": "Coordinates leader leases, heartbeats, and log replication across quorum of 3 or 5 cluster nodes"
      },
      {
        "id": "wal_disk_logger",
        "name": "Write-Ahead Log (WAL Disk Sync)",
        "icon": "💾",
        "role": "Appends Raft log entries to disk with `fdatasync` before acknowledging to ensure zero loss across crashes"
      },
      {
        "id": "mvcc_tree_index",
        "name": "In-Memory B-Tree Index (Bbolt / MVCC)",
        "icon": "🌲",
        "role": "Maps key to multiple revision versions (`revision = 42`); enables lock-free point-in-time snapshot reads"
      },
      {
        "id": "bbolt_kv_storage",
        "name": "bbolt Key-Value Engine (Copy-on-Write)",
        "icon": "🗄️",
        "role": "Stores `(revision -> value)` tuples in memory-mapped B+Tree file on disk"
      },
      {
        "id": "watch_stream_manager",
        "name": "Watch Notification Streamer (gRPC Server)",
        "icon": "📢",
        "role": "Maintains persistent watch streams; pushes key mutation events to clients matching requested revisions"
      },
      {
        "id": "compactor_daemon",
        "name": "MVCC Revision Compactor & Defrag Daemon",
        "icon": "🧹",
        "role": "Purges historical revisions older than retention window to reclaim disk space and prevent database bloat"
      }
    ],
    "correctSequence": [
      "etcd_client",
      "raft_consensus_module",
      "wal_disk_logger",
      "mvcc_tree_index",
      "bbolt_kv_storage",
      "watch_stream_manager",
      "compactor_daemon"
    ],
    "explanation": "1. Client submits atomic CAS `Put(key, val, prevRevision=41)`. 2. Raft Leader proposes log entry to cluster. 3. Nodes write to WAL with `fdatasync`. 4. Once quorum (e.g. 2 of 3) acknowledges, entry is committed. 5. MVCC creates new revision entry (Revision 42) in bbolt storage. 6. Watch Stream Manager notifies all watching clients via gRPC. 7. Compactor daemon periodically cleans up old historical revisions.",
    "keyDesignTakeaways": [
      "Quorum Majority Consensus: A 3-node cluster tolerates 1 node failure; a 5-node cluster tolerates 2 node failures; all writes require majority acknowledgment (`(N/2) + 1`) to guarantee linearizability.",
      "MVCC (Multi-Version Concurrency Control): Keys are never overwritten in-place; every write creates a new monotonically increasing global revision number, allowing readers to read point-in-time snapshots with zero locks.",
      "ReadIndex / LeaseRead Optimization: Going through full Raft consensus for read queries adds latency; leaders use ReadIndex or leader leases to verify they haven't been deposed before serving reads directly from RAM in <1ms."
    ]
  },
  {
    "id": "iot_smart_metering",
    "title": "Design Smart Grid / Power Meter Telemetry Ingest",
    "badge": "⚡",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "50M Electric Meters • 15-Minute Telemetry Intervals",
    "qps": "55,000 Meter Readings/Sec • Peak Kilowatt-Hour Time-of-Use Billing",
    "difficulty": "Hard",
    "goal": "Ingest and process nationwide smart electricity meter readings every 15 minutes with time-series downsampling.",
    "availableNodes": [
      {
        "id": "smart_meter_hw",
        "name": "Cellular / Mesh Smart Electric Meter",
        "icon": "⚡",
        "role": "Samples kilowatt-hours (kWh), peak voltage, and power factor; transmits encrypted batch every 15 minutes"
      },
      {
        "id": "mesh_collector_gw",
        "name": "Substation Mesh Collector Gateway",
        "icon": "📡",
        "role": "Aggregates RF mesh meter packets at electrical substations; forwards to cloud via cellular backhaul"
      },
      {
        "id": "meter_ingest_kafka",
        "name": "Meter Ingestion Stream (Kafka)",
        "icon": "📬",
        "role": "Buffers telemetry batches partitioned by `utility_zone_id` and `meter_serial`"
      },
      {
        "id": "validation_enricher",
        "name": "VEE Engine (Validation, Editing, Estimation)",
        "icon": "⚙️",
        "role": "Validates meter readings against historical consumption; estimates missing intervals caused by network blips"
      },
      {
        "id": "tou_tariff_calculator",
        "name": "Time-of-Use (TOU) Tariff Calculator",
        "icon": "💵",
        "role": "Applies variable pricing rate cards (Off-Peak: $0.12/kWh, On-Peak: $0.48/kWh)"
      },
      {
        "id": "meter_tsdb_store",
        "name": "Meter Billing DB (TimescaleDB / ScyllaDB)",
        "icon": "🗄️",
        "role": "Stores immutable 15-minute interval consumption records with cryptographic meter signatures"
      },
      {
        "id": "grid_outage_detector",
        "name": "Grid Blackout & Tamper Detector",
        "icon": "🚨",
        "role": "Detects sudden clusters of missing meter heartbeats; triggers utility crew dispatch to power outages"
      }
    ],
    "correctSequence": [
      "smart_meter_hw",
      "mesh_collector_gw",
      "meter_ingest_kafka",
      "validation_enricher",
      "tou_tariff_calculator",
      "meter_tsdb_store",
      "grid_outage_detector"
    ],
    "explanation": "1. Smart meter samples power consumption every 15 minutes. 2. Substation gateway aggregates mesh readings. 3. Kafka partitions readings by utility zone. 4. VEE engine validates reading continuity and imputes missing intervals. 5. TOU calculator applies dynamic peak energy tariffs. 6. Data saved in TimescaleDB for customer billing. 7. Blackout detector identifies neighborhood outages when multiple meters go dark simultaneously.",
    "keyDesignTakeaways": [
      "VEE Pipeline (Validation, Editing, Estimation): Utility regulations require complete interval data for billing; if an RF mesh glitch drops a 15-minute interval, VEE mathematically estimates consumption using historical weather and seasonal baselines.",
      "Time-of-Use (TOU) Interval Billing: Monthly meter totals are obsolete; smart grids charge 4x higher rates during peak heatwave hours (e.g. 4 PM - 9 PM) to incentivize energy conservation.",
      "Last Gasp Signal for Outage Detection: When grid power cuts, the meter's internal capacitor powers one final radio transmission ('Last Gasp packet'); aggregating hundreds of Last Gasps pinpoint the exact blown transformer."
    ]
  },
  {
    "id": "e_signature_docusign",
    "title": "Design DocuSign / Cryptographic Contract Signing",
    "badge": "✍️",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100M Contracts/Year • Legally Binding",
    "qps": "2,000 Signing Events/Sec • Strict Tamper-Proof",
    "difficulty": "Hard",
    "goal": "Build a secure digital signature workflow with PKI certificate validation, audit trails, and tamper-evident PDF hashing.",
    "availableNodes": [
      {
        "id": "signer_browser",
        "name": "Signer Web / Mobile Client",
        "icon": "✍️",
        "role": "Views PDF contract, clicks 'Sign Here', and draws signature / adopts font"
      },
      {
        "id": "doc_gateway",
        "name": "Signature API Gateway",
        "icon": "🛡️",
        "role": "Validates signer identity via SMS OTP / email token and records client IP audit trail"
      },
      {
        "id": "pdf_rasterizer",
        "name": "PDF Form & Layout Engine",
        "icon": "📄",
        "role": "Renders vector PDF pages into web tiles and overlays interactive signature form fields"
      },
      {
        "id": "crypto_signer_hsm",
        "name": "Hardware Security Module (HSM) PKI Signer",
        "icon": "🔐",
        "role": "Embeds X.509 PKI digital certificate and generates SHA-256 cryptographic tamper seal"
      },
      {
        "id": "doc_blob_storage",
        "name": "WORM Object Storage (S3 Object Lock)",
        "icon": "🪣",
        "role": "Stores finalized signed PDF in Write-Once-Read-Many (WORM) compliant storage"
      },
      {
        "id": "envelope_state_db",
        "name": "Envelope Lifecycle DB (Postgres)",
        "icon": "💾",
        "role": "Manages multi-party signing order state machine (Signer 1 -> Signer 2 -> Completed)"
      },
      {
        "id": "cert_evidence_service",
        "name": "Certificate of Completion Auditor",
        "icon": "📜",
        "role": "Generates court-admissible Certificate of Completion with timestamps and IP audit log"
      }
    ],
    "correctSequence": [
      "signer_browser",
      "doc_gateway",
      "pdf_rasterizer",
      "crypto_signer_hsm",
      "doc_blob_storage",
      "envelope_state_db",
      "cert_evidence_service"
    ],
    "explanation": "1. Signer opens secure email link. 2. Gateway verifies email token / SMS OTP and logs IP address. 3. PDF engine renders pages. 4. Signer applies signature to designated tag. 5. Hardware Security Module (HSM) applies PKI digital signature (X.509 certificate) and computes SHA-256 tamper seal (any subsequent byte modification invalidates the signature). 6. Finalized contract stored in S3 WORM (Object Lock). 7. State machine transitions to next signer; upon completion, Certificate of Completion issued to all parties.",
    "keyDesignTakeaways": [
      "PKI Digital Signatures vs Visual Signature Images: A drawn visual image has zero cryptographic security; legal validity relies on X.509 digital certificates and SHA-256 hashes embedded in PDF metadata.",
      "WORM (Write Once, Read Many) Storage: Regulatory standards (ESIGN, eIDAS) require completed legal contracts to be immutable; store in S3 with Object Lock Compliance mode enabled.",
      "Sequential Multi-Party State Machine: Enforce strict recipient routing order: Signer 2 cannot access or sign the document until Signer 1 completes their signature."
    ]
  },
  {
    "id": "telemedicine_webrtc",
    "title": "Design Teladoc / HIPAA-Compliant Video Doctor Visit",
    "badge": "🩺",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "1M Consultations/Day • 100k Concurrent Doctor Visits",
    "qps": "15,000 Visit Requests/Sec • Strict HIPAA Cryptographic Isolation",
    "difficulty": "Hard",
    "goal": "Construct an encrypted, HIPAA-compliant telehealth video platform with WebRTC SFU streaming and clinical record storage.",
    "availableNodes": [
      {
        "id": "patient_client",
        "name": "Patient Mobile / Web App",
        "icon": "📱",
        "role": "Enters encrypted virtual waiting room and initiates WebRTC peer video stream"
      },
      {
        "id": "hipaa_gateway",
        "name": "HIPAA Edge Gateway & Auth (mTLS)",
        "icon": "🛡️",
        "role": "Enforces TLS 1.3, HIPAA audit logging, and signed BAA cryptographic compliance"
      },
      {
        "id": "waiting_room_mgr",
        "name": "Virtual Clinic Waiting Room Manager",
        "icon": "🏥",
        "role": "Coordinates patient queueing, triage questionnaire, and doctor availability matching"
      },
      {
        "id": "secure_signaling",
        "name": "E2EE Signaling Server (WSS)",
        "icon": "⚡",
        "role": "Exchanges WebRTC SDP offer/answers and ephemeral encryption keys for direct consultation"
      },
      {
        "id": "sfu_relay_node",
        "name": "HIPAA Media Relay SFU (SRTP)",
        "icon": "📡",
        "role": "Relays encrypted SRTP media packets; zero disk recording unless patient grants signed consent"
      },
      {
        "id": "ehr_database",
        "name": "EHR Clinical Record DB (Encrypted at Rest)",
        "icon": "🗄️",
        "role": "Stores consultation notes, ICD-10 medical diagnoses, and e-prescriptions with AES-256"
      },
      {
        "id": "audit_compliance_log",
        "name": "Immutable Audit Trail (WORM Storage)",
        "icon": "📑",
        "role": "Records Write-Once-Read-Many access logs verifying who accessed Protected Health Information (PHI)"
      }
    ],
    "correctSequence": [
      "patient_client",
      "hipaa_gateway",
      "waiting_room_mgr",
      "secure_signaling",
      "sfu_relay_node",
      "ehr_database",
      "audit_compliance_log"
    ],
    "explanation": "1. Patient authenticates via mTLS HIPAA gateway and enters clinic queue. 2. Waiting Room Manager assigns patient to available licensed doctor. 3. Secure Signaling Server negotiates WebRTC peer connection. 4. Media Relay SFU forwards encrypted SRTP video/audio streams with zero disk buffering (ephemeral in memory). 5. Doctor writes consultation summary, diagnosis codes, and digital prescriptions. 6. Electronic Health Record (EHR) database encrypts medical data with envelope AES-256 keys. 7. Immutable WORM audit trail logs all PHI access for HIPAA regulatory inspection.",
    "keyDesignTakeaways": [
      "HIPAA Zero-Knowledge Media Relaying: Video and audio streams must travel over encrypted SRTP; media servers must never store unencrypted video on local disks without cryptographic consent.",
      "Immutable WORM (Write-Once-Read-Many) Audit Logs: Every access to Protected Health Information (PHI) must produce an unalterable audit log entry detailing who, when, and what was accessed.",
      "Direct P2P Fallback with SFU Relay: For 1-on-1 doctor visits, prefer direct WebRTC P2P to keep patient data off company servers entirely, falling back to HIPAA-certified SFU only when firewalls block UDP."
    ]
  },
  {
    "id": "live_auction_ebay",
    "title": "Design eBay / Live Real-Time Bidding Auction",
    "badge": "🏷️",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100k Live Auctions • 1M Bids/Minute During Closing",
    "qps": "50,000 Bid Submissions/Sec • Zero Sniping Race Conditions",
    "difficulty": "Hard",
    "goal": "Design a real-time auction bidding engine with millisecond countdown timers, optimistic locking, and automatic proxy bidding.",
    "availableNodes": [
      {
        "id": "bidder_client",
        "name": "Bidding Mobile / Web App",
        "icon": "🔨",
        "role": "Submits real-time bid price with millisecond client timestamp over persistent WebSocket"
      },
      {
        "id": "ws_bid_gateway",
        "name": "Bid Ingress Gateway (Netty)",
        "icon": "⚡",
        "role": "Maintains persistent bi-directional connection; rejects bids below current price immediately"
      },
      {
        "id": "auction_room_actor",
        "name": "Auction Room Actor (Redis / Akka)",
        "icon": "👑",
        "role": "Single-threaded in-memory room sequencer; executes atomic CAS: `if newBid > highBid then highBid = newBid`"
      },
      {
        "id": "sniping_timer",
        "name": "Anti-Sniping Dynamic Timer",
        "icon": "⏱️",
        "role": "Extends auction closing countdown by 30 seconds if a bid arrives in final 10 seconds (Soft Close)"
      },
      {
        "id": "bid_broadcast_bus",
        "name": "Live Price Broadcast Bus (Redis Pub/Sub)",
        "icon": "📢",
        "role": "Pushes new highest bid amount and leading bidder alias to all room observers in <20ms"
      },
      {
        "id": "bid_ledger_db",
        "name": "Persistent Bid History Ledger (PostgreSQL)",
        "icon": "📑",
        "role": "Records append-only immutable sequence of all valid bids placed in the auction"
      },
      {
        "id": "settlement_worker",
        "name": "Post-Auction Settlement Service",
        "icon": "💳",
        "role": "Captures winner's pre-authorized payment hold and notifies seller to initiate shipping"
      }
    ],
    "correctSequence": [
      "bidder_client",
      "ws_bid_gateway",
      "auction_room_actor",
      "sniping_timer",
      "bid_broadcast_bus",
      "bid_ledger_db",
      "settlement_worker"
    ],
    "explanation": "1. Bidder taps 'Bid $550'. 2. Netty Gateway validates connection token and bid syntax. 3. In-memory Auction Room Actor evaluates bid atomically (Compare-And-Swap): guarantees exactly one bid wins when multiple bids arrive at the same millisecond. 4. Anti-Sniping Timer checks clock: if bid arrives with <10s remaining, clock extends by 30s. 5. Redis Pub/Sub broadcasts new price ($550) to all observers in <20ms. 6. Valid bid written to persistent PostgreSQL ledger. 7. On auction end, settlement worker charges winning bidder's card.",
    "keyDesignTakeaways": [
      "Single-Writer Principle (Actor Pattern): Never run concurrent `UPDATE auction SET current_bid = ...` in SQL; dedicate an in-memory single-threaded actor per active auction item to eliminate lock contention.",
      "Anti-Sniping Soft-Close Extension: Hard deadlines encourage bot sniping at 00:00:01; extend the auction deadline automatically whenever bids arrive in the closing seconds to simulate live human auctioneers.",
      "Pre-Authorized Escrow Holds: To prevent non-paying winners, pre-authorize credit card holds when bidders enter high-value auctions before bids are accepted."
    ]
  },
  {
    "id": "package_tracking_ups",
    "title": "Design UPS / Global Package Milestone Tracking",
    "badge": "📦",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "25M Packages Delivered/Day • 500M Scans/Day",
    "qps": "25,000 Scan Events/Sec • 50,000 Tracking Status Reads/Sec",
    "difficulty": "Medium",
    "goal": "Build an end-to-end package tracking system updating delivery milestones from sorting hub barcode scans in real time.",
    "availableNodes": [
      {
        "id": "scanner_device",
        "name": "Warehouse / Courier Barcode Scanner",
        "icon": "📦",
        "role": "Scans package 1D/2D barcode at sorting hub, airport ramp, or delivery doorstep"
      },
      {
        "id": "iot_ingest_gw",
        "name": "Telemetry Ingestion Gateway (MQTT / HTTP)",
        "icon": "⚡",
        "role": "Accepts bulk barcode scan batches from mobile courier devices; handles offline sync"
      },
      {
        "id": "event_stream",
        "name": "Package Milestone Stream (Kafka)",
        "icon": "📬",
        "role": "Buffers scan events partitioned by `tracking_number`; guarantees chronological per-package order"
      },
      {
        "id": "milestone_processor",
        "name": "Milestone State Transition Engine",
        "icon": "⚙️",
        "role": "Validates state machine: LABEL_CREATED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED"
      },
      {
        "id": "tracking_cache",
        "name": "Tracking Status Cache (Redis Cluster)",
        "icon": "🔴",
        "role": "Serves current package location and milestone history in <2ms for consumer lookup"
      },
      {
        "id": "package_db",
        "name": "Package Milestone DB (Cassandra / DynamoDB)",
        "icon": "🗄️",
        "role": "Wide-column append-only storage partitioned by tracking number with clustering key on event timestamp"
      },
      {
        "id": "notification_svc",
        "name": "Delivery Alert Dispatcher",
        "icon": "🔔",
        "role": "Triggers SMS/Email push notifications when milestone changes to 'Delivered' or 'Exception'"
      }
    ],
    "correctSequence": [
      "scanner_device",
      "iot_ingest_gw",
      "event_stream",
      "milestone_processor",
      "tracking_cache",
      "package_db",
      "notification_svc"
    ],
    "explanation": "1. Courier scans parcel at delivery door. 2. Mobile scanner uploads scan event with GPS coordinates and signature. 3. Kafka partitions event by `tracking_number` to preserve per-package ordering. 4. Milestone State Transition Engine verifies valid state change and updates estimated delivery date. 5. Current status updated in Redis for instant consumer web/app queries. 6. Event permanently appended to Cassandra wide-column table. 7. If milestone is DELIVERED, notification service sends SMS/Email with delivery photo.",
    "keyDesignTakeaways": [
      "Partitioning by Tracking Number: Partition Kafka and NoSQL databases by `tracking_number` so all scans for a single parcel land on the same consumer worker, preventing out-of-order milestone states.",
      "Offline-First Ingestion for Mobile Couriers: Couriers regularly enter basements or rural areas with zero cellular reception; handheld scanners must queue scans locally and sync in bulk with idempotency tokens.",
      "Read-Heavy Caching for Delivery Day: 95% of consumer queries occur on the scheduled delivery day; cache the active package state in Redis with a 24-hour TTL."
    ]
  },
  {
    "id": "smart_home_iot_hub",
    "title": "Design Smart Home IoT Automation Gateway",
    "badge": "💡",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "20M Connected Homes • 200M Active IoT Devices",
    "qps": "500,000 Sensor Telemetry/Sec • Sub-50ms Rule Execution",
    "difficulty": "Medium",
    "goal": "Design a low-latency IoT message broker and rules engine executing automation routines across millions of smart home appliances.",
    "availableNodes": [
      {
        "id": "iot_device",
        "name": "Smart Device / Sensor (Zigbee/Matter)",
        "icon": "💡",
        "role": "Emits state changes (motion detected, temperature change) over local Zigbee/Thread/Matter protocol"
      },
      {
        "id": "edge_hub",
        "name": "Local Smart Home Edge Hub",
        "icon": "🏠",
        "role": "Runs local offline automation rules engine; maintains outbound TLS tunnel to cloud MQTT broker"
      },
      {
        "id": "mqtt_broker_cluster",
        "name": "Cloud MQTT Broker Cluster (EMQX)",
        "icon": "⚡",
        "role": "Maintains persistent lightweight MQTT TCP connections with QoS 1 message delivery"
      },
      {
        "id": "rule_evaluator",
        "name": "Real-Time Automation Rule Evaluator",
        "icon": "⚙️",
        "role": "Evaluates user automation routines: `IF motion == true AND time > 18:00 THEN turnOn(lights)`"
      },
      {
        "id": "device_shadow",
        "name": "Device Shadow & Digital Twin (Redis)",
        "icon": "👥",
        "role": "Stores reported vs desired state: synchronizes changes when offline devices reconnect"
      },
      {
        "id": "time_series_db",
        "name": "Historical Telemetry DB (TimescaleDB)",
        "icon": "📊",
        "role": "Stores downsampled sensor history for energy graphs and temperature trends"
      },
      {
        "id": "mobile_app",
        "name": "Homeowner Mobile Client",
        "icon": "📱",
        "role": "Controls devices remotely and receives security push notifications (e.g. water leak detected)"
      }
    ],
    "correctSequence": [
      "iot_device",
      "edge_hub",
      "mqtt_broker_cluster",
      "rule_evaluator",
      "device_shadow",
      "time_series_db",
      "mobile_app"
    ],
    "explanation": "1. Motion sensor detects movement and notifies local edge hub. 2. Edge hub evaluates local automations immediately (<10ms offline support). 3. Hub publishes state change to Cloud MQTT broker over TLS. 4. Cloud Rule Evaluator processes multi-device rules across cloud integrations. 5. Device Shadow updates reported state in Redis. 6. TimescaleDB logs sensor metrics for analytics. 7. Mobile app receives push alert or WebSocket state sync.",
    "keyDesignTakeaways": [
      "Local Offline Execution (Edge Computing): Critical automations (e.g., motion turns on hallway lights) must execute locally on the home hub without requiring a round-trip to the cloud; otherwise internet outages break home lighting.",
      "Device Shadow Pattern (Reported vs Desired): When a user taps 'Turn On Light' while the device is sleeping or disconnected, update the 'Desired State' in cloud; when the device connects, it syncs differences.",
      "MQTT Protocol with Keep-Alives: MQTT headers are only 2 bytes compared to HTTP's hundreds of bytes; keep-alive pings maintain firewall NAT traversal efficiently."
    ]
  },
  {
    "id": "dns_ddos_scrubber",
    "title": "Design Cloudflare / Anycast BGP DDoS Scrubber",
    "badge": "🛡️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "300 Global PoPs • 100 Terabits/Sec Peak Attack Absorption",
    "qps": "50,000,000 Packets/Sec • Sub-5ms Wire Speed Scrubbing",
    "difficulty": "Staff+",
    "goal": "Construct a globally distributed DDoS mitigation engine using eBPF/XDP kernel packet filtering and BGP Anycast routing.",
    "availableNodes": [
      {
        "id": "anycast_bgp_ip",
        "name": "Global BGP Anycast Border Routers",
        "icon": "🌐",
        "role": "Announces identical IP prefix (/24) globally; dilutes massive volumetric attacks across 300 PoPs via internet routing"
      },
      {
        "id": "xdp_ebpf_filter",
        "name": "XDP / eBPF Kernel Driver Filter",
        "icon": "⚡",
        "role": "Executes programmable packet filter at NIC network driver layer; drops 10M attack packets/sec in <1 microsecond"
      },
      {
        "id": "syn_proxy_challenge",
        "name": "Stateless SYN Proxy Cookie Engine",
        "icon": "🛡️",
        "role": "Validates TCP 3-way handshakes using cryptographic SYN cookies; drops SYN flood spoofing without allocating memory"
      },
      {
        "id": "dns_flood_rate_limiter",
        "name": "DNS Query & Amplification Scrubber",
        "icon": "🔍",
        "role": "Validates DNS query format; blocks open recursive DNS amplification and UDP flood reflection attacks"
      },
      {
        "id": "threat_intel_stream",
        "name": "Real-Time Attack Telemetry Bus (Kafka)",
        "icon": "📊",
        "role": "Aggregates attack signatures and offending IP CIDR blocks across all 300 PoPs in real time"
      },
      {
        "id": "dynamic_flowspec_router",
        "name": "BGP Flowspec Attack Rule Pusher",
        "icon": "⚙️",
        "role": "Automatically pushes BGP Flowspec drop rules to upstream Tier-1 internet carriers during 1Tbps+ attacks"
      },
      {
        "id": "clean_traffic_tunnel",
        "name": "GRE / WireGuard Clean Pipe Tunnel",
        "icon": "🚀",
        "role": "Forwards validated clean customer traffic directly to customer origin data centers"
      }
    ],
    "correctSequence": [
      "anycast_bgp_ip",
      "xdp_ebpf_filter",
      "syn_proxy_challenge",
      "dns_flood_rate_limiter",
      "threat_intel_stream",
      "dynamic_flowspec_router",
      "clean_traffic_tunnel"
    ],
    "explanation": "1. 500 Gbps DDoS attack hits BGP Anycast IP. 2. Anycast distributes attack across 300 global PoPs (diluting load to 1.6 Gbps per PoP). 3. XDP/eBPF filter drops malformed packets at NIC driver in userspace. 4. Stateless SYN proxy blocks TCP SYN floods. 5. DNS scrubber drops UDP reflection. 6. BGP Flowspec rules pushed to Tier-1 ISPs to discard attack at upstream transit. 7. Clean packets forwarded to customer origin via GRE.",
    "keyDesignTakeaways": [
      "BGP Anycast Attack Dilution: A 1 Tbps attack crushes a single data center; announcing the same IP across 300 data centers spreads the attack volume to ~3.3 Gbps per PoP, which local servers can easily scrub.",
      "XDP (eXpress Data Path) Packet Dropping: Standard Linux iptables processes packets late in the network stack, capping drop rate at ~1M pkts/sec; eBPF running in XDP drops packets directly at the network interface card driver before memory allocation, handling 15M+ pkts/sec per core.",
      "Stateless SYN Cookies (RFC 4987): Storing half-open connections in a SYN queue during a 50M SYN packet/sec attack exhausts kernel memory; SYN cookies encode connection state into the TCP sequence number, allocating zero server memory until the client returns a valid ACK."
    ]
  },
  {
    "id": "shazam_audio_recognition",
    "title": "Design Shazam / Audio Fingerprint Matching Engine",
    "badge": "🎵",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1B Song Identifications/Mo • 100M Audio Catalog",
    "qps": "2,000 Match Requests/Sec • P99 < 1s",
    "difficulty": "Hard",
    "goal": "Build an acoustic fingerprint identification engine using spectrogram peak hashing and inverted index lookups in sub-1 second.",
    "availableNodes": [
      {
        "id": "mobile_mic",
        "name": "Mobile Audio Capture Client",
        "icon": "🎙️",
        "role": "Records 5-10s noisy audio sample and extracts frequency peak landmarks"
      },
      {
        "id": "audio_gw",
        "name": "Shazam Matching Gateway",
        "icon": "🛡️",
        "role": "Validates request payload and routes fingerprint hashes to match engine"
      },
      {
        "id": "fft_spectrogram",
        "name": "FFT Spectrogram Analyzer",
        "icon": "📈",
        "role": "Applies Fast Fourier Transform (FFT) to convert time-domain audio into frequency spectrogram"
      },
      {
        "id": "peak_extractor",
        "name": "Peak Landmark & Combinatorial Hash Generator",
        "icon": "🔍",
        "role": "Pairs prominent spectrogram peaks into 32-bit hash tokens: (f1, f2, dt)"
      },
      {
        "id": "fingerprint_index",
        "name": "Inverted Fingerprint Index (Distributed RAM / SSD)",
        "icon": "⚡",
        "role": "Maps 32-bit audio hash -> List of (SongID, OffsetTimestamp) entries"
      },
      {
        "id": "histogram_matcher",
        "name": "Time-Coherence Histogram Matcher",
        "icon": "🎯",
        "role": "Finds song with dominant delta-time offset alignment to identify exact track in <500ms"
      },
      {
        "id": "catalog_metadata",
        "name": "Song & Streaming Metadata DB",
        "icon": "🎵",
        "role": "Hydrates track title, artist, album art, and Apple Music / Spotify deep links"
      }
    ],
    "correctSequence": [
      "mobile_mic",
      "audio_gw",
      "fft_spectrogram",
      "peak_extractor",
      "fingerprint_index",
      "histogram_matcher",
      "catalog_metadata"
    ],
    "explanation": "1. Mobile client records 5-second ambient audio sample. 2. Client or backend applies Fast Fourier Transform (FFT) generating a 2D time-frequency spectrogram. 3. Algorithm extracts highest-energy frequency peak landmarks and generates combinatorial hashes `[freq1, freq2, delta_time]`. 4. Matching Gateway queries Inverted Fingerprint Index. 5. Index returns candidate song IDs and track offsets. 6. Matcher builds a scatter plot of (Time_Sample - Time_Track); a true match shows a straight diagonal line (histogram peak). 7. Identified song metadata returned to user in <1 second.",
    "keyDesignTakeaways": [
      "Combinatorial Peak Hashing: Hashing pairs of prominent frequency peaks (Anchor + Target peak + Time delta) provides extreme robustness against ambient background noise and poor mic quality.",
      "Time-Coherence Verification (Histogram Peak): A matching song is identified NOT just by hash count, but by temporal alignment: all matching hashes must have identical offset differences `(t_sample - t_track = constant)`.",
      "Inverted Index Keyed by 32-Bit Hash: Keying the index by the 32-bit audio landmark hash allows O(1) candidate lookup across 100M songs in distributed RAM."
    ]
  },
  {
    "id": "ride_hailing_fare_calc",
    "title": "Design Lyft / Upfront Dynamic Fare Estimation",
    "badge": "🚕",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "50M Daily Ride Quotes • 100M Route Calculations",
    "qps": "50,000 Fare Calculations/Sec • Sub-50ms Response Time",
    "difficulty": "Medium",
    "goal": "Design a dynamic ride fare calculation service combining base rates, distance matrix estimates, traffic congestion, and surge multipliers.",
    "availableNodes": [
      {
        "id": "rider_quote_req",
        "name": "Rider Mobile App Client",
        "icon": "📱",
        "role": "Requests upfront price estimate for route between pickup and dropoff coordinates"
      },
      {
        "id": "api_gateway",
        "name": "API Gateway & Auth Proxy",
        "icon": "🛡️",
        "role": "Validates rider session, decrypts location headers, and checks rate limits"
      },
      {
        "id": "routing_eta_svc",
        "name": "Routing & Distance Matrix Engine",
        "icon": "🗺️",
        "role": "Calculates driving distance (meters) and duration (seconds) with live traffic factors"
      },
      {
        "id": "surge_lookup",
        "name": "Live Surge Factor Cache (Redis)",
        "icon": "📈",
        "role": "Fetches current supply/demand surge multiplier for origin H3 cell in <1ms"
      },
      {
        "id": "pricing_rules_engine",
        "name": "Dynamic Pricing Rules Engine",
        "icon": "⚙️",
        "role": "Calculates formula: `base + (dist * rate) + (time * rate) * surge + tolls` across tiers (Standard, XL, Black)"
      },
      {
        "id": "fare_lock_vault",
        "name": "Upfront Fare Quote Lock Vault",
        "icon": "🔒",
        "role": "Issues cryptographically signed quote token locking the price for 10 minutes"
      },
      {
        "id": "quote_analytics_bus",
        "name": "Fare Conversion Analytics Bus (Kafka)",
        "icon": "📊",
        "role": "Tracks quote-to-ride conversion elasticity to train machine learning pricing models"
      }
    ],
    "correctSequence": [
      "rider_quote_req",
      "api_gateway",
      "routing_eta_svc",
      "surge_lookup",
      "pricing_rules_engine",
      "fare_lock_vault",
      "quote_analytics_bus"
    ],
    "explanation": "1. Rider inputs destination. 2. Gateway routes to pricing cluster. 3. Routing engine calculates driving distance and ETA considering live congestion. 4. Redis supplies current origin surge multiplier. 5. Pricing engine computes upfront fare quotes for all available car tiers. 6. Cryptographically signed quote token issued with a 10-minute price lock lease. 7. Quote data streamed to Kafka for conversion elasticity analytics.",
    "keyDesignTakeaways": [
      "Upfront Guaranteed Fare Lock (10-Minute Lease): To prevent riders from experiencing bait-and-switch pricing, sign the calculated fare into an encrypted HMAC token valid for 600 seconds.",
      "Distance Matrix Precomputation: Use spatial road network distance matrices or cached route distance graphs instead of full turn-by-turn routing to quote prices in <20ms.",
      "Decouple Quoting from Dispatching: Quoting is high-volume and read-heavy; keep it decoupled from the transaction-heavy dispatch matching system."
    ]
  },
  {
    "id": "cloud_vpn_mesh",
    "title": "Design Tailscale / WireGuard Virtual Mesh Network",
    "badge": "🔒",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1M Devices • Direct Peer-to-Peer WireGuard Tunnels • NAT Traversal",
    "qps": "100,000 Coordination Handshakes/Sec • Sub-50ms Direct P2P Latency",
    "difficulty": "Hard",
    "goal": "Design a peer-to-peer zero-config VPN mesh network using DERP relay fallbacks, NAT traversal (STUN/ICE), and WireGuard cryptography.",
    "availableNodes": [
      {
        "id": "user_device_node",
        "name": "Client Device (Laptop / Phone / Server)",
        "icon": "💻",
        "role": "Generates local WireGuard public/private keypair; establishes encrypted ChaCha20-Poly1305 tunnels directly to peers"
      },
      {
        "id": "coordination_server",
        "name": "Control Plane / Coordination Server (Derp)",
        "icon": "👑",
        "role": "Distributes peer public keys, assigned internal IP addresses (100.64.0.0/10), and routing ACL policies"
      },
      {
        "id": "stun_nat_probe",
        "name": "STUN NAT Discovery Prober",
        "icon": "🔍",
        "role": "Determines public IP and port mappings; identifies NAT mapping behavior (Full Cone vs Symmetric NAT)"
      },
      {
        "id": "derp_relay_server",
        "name": "DERP Relay Relay Fleet (Encrypted Fallback)",
        "icon": "🌐",
        "role": "Relays encrypted WireGuard packets over HTTPS/WebSockets when direct NAT hole-punching fails (<5% of traffic)"
      },
      {
        "id": "hole_puncher_engine",
        "name": "UDP Hole Punching Engine (ICE)",
        "icon": "⚡",
        "role": "Coordinates simultaneous UDP packet transmission from both peers to open dynamic stateful firewall pinholes"
      },
      {
        "id": "wireguard_p2p_pipe",
        "name": "Direct Peer-to-Peer Encrypted Pipe",
        "icon": "🚀",
        "role": "High-throughput WireGuard tunnel carrying point-to-point network packets with near-zero latency overhead"
      },
      {
        "id": "acl_policy_db",
        "name": "Zero-Trust Mesh Policy Store (PostgreSQL)",
        "icon": "📑",
        "role": "Evaluates user/device security access tags (e.g. `tag:prod-db accessible only by group:sre`)"
      }
    ],
    "correctSequence": [
      "user_device_node",
      "coordination_server",
      "stun_nat_probe",
      "derp_relay_server",
      "hole_puncher_engine",
      "wireguard_p2p_pipe",
      "acl_policy_db"
    ],
    "explanation": "1. Device logs in and generates WireGuard keypair. 2. Coordination server registers public key and assigns internal overlay IP (100.x.y.z). 3. STUN probes client NAT types. 4. Hole punching engine triggers simultaneous UDP packets to bridge firewalls. 5. Once hole is punched, direct peer-to-peer WireGuard pipe is established. 6. If symmetric enterprise NAT blocks UDP, traffic falls back to encrypted DERP relay. 7. Policy store verifies ACL access permissions.",
    "keyDesignTakeaways": [
      "Point-to-Point Mesh vs Hub-and-Spoke VPN: Traditional VPNs (OpenVPN/IPsec) route all company traffic through a central gateway concentrator, creating bandwidth bottlenecks; mesh VPNs establish direct P2P WireGuard tunnels between devices with 0 proxy delay.",
      "Control Plane Separated from Data Plane: The coordination server only exchanges public keys and NAT endpoints (control plane); it never sees or routes data packets, preserving complete end-to-end user privacy.",
      "UDP Hole Punching & DERP Relays: STUN hole-punching achieves direct P2P connections on 90%+ of consumer networks; for restrictive symmetric corporate firewalls, encrypted DERP relays guarantee connectivity."
    ]
  },
  {
    "id": "food_delivery_driver_routing",
    "title": "Design DoorDash / Multi-Stop Driver Route Optimizer",
    "badge": "🛵",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "10M Deliveries/Day • 1M Active Dashers",
    "qps": "20,000 Batch Route Optimizations/Sec • Sub-5s Solution Time",
    "difficulty": "Hard",
    "goal": "Construct an automated vehicle routing engine optimizing driver pickups and multi-restaurant drop-offs to minimize delivery times.",
    "availableNodes": [
      {
        "id": "order_stream",
        "name": "Order Ready & Dispatch Stream",
        "icon": "🍔",
        "role": "Emits restaurant order prep completion times and pickup readiness events"
      },
      {
        "id": "dasher_pool",
        "name": "Active Dasher GPS & Capacity Tracker",
        "icon": "🚗",
        "role": "Tracks driver coordinates, current trunk thermal capacity, and active route status"
      },
      {
        "id": "batching_engine",
        "name": "Spatio-Temporal Order Batcher",
        "icon": "📦",
        "role": "Groups orders with overlapping pickup corridors and delivery dropoffs into bundle candidates"
      },
      {
        "id": "vrp_solver",
        "name": "Vehicle Routing Problem (VRP) Solver",
        "icon": "⚙️",
        "role": "Runs heuristic algorithms (Genetic / Simulated Annealing) to solve multi-stop route sequencing"
      },
      {
        "id": "eta_predictor",
        "name": "Machine Learning Food ETA Predictor",
        "icon": "⏱️",
        "role": "Predicts restaurant kitchen prep time vs dasher travel time to minimize cold food dwell time"
      },
      {
        "id": "dispatch_offer_svc",
        "name": "Atomic Dispatch Offer Service",
        "icon": "📲",
        "role": "Sends 60-second dispatch offer to optimal Dasher; handles fallback reassignment on decline"
      },
      {
        "id": "route_db",
        "name": "Active Delivery Route DB (PostgreSQL)",
        "icon": "🗄️",
        "role": "Maintains multi-stop delivery itinerary milestones and proof-of-delivery photos"
      }
    ],
    "correctSequence": [
      "order_stream",
      "dasher_pool",
      "batching_engine",
      "vrp_solver",
      "eta_predictor",
      "dispatch_offer_svc",
      "route_db"
    ],
    "explanation": "1. Restaurants mark orders cooking/ready. 2. Active Dasher tracker finds available drivers within delivery zones. 3. Spatio-temporal batcher groups orders from adjacent restaurants going to the same apartment complex. 4. VRP solver determines the optimal stop sequence (Pickup A -> Pickup B -> Dropoff A -> Dropoff B) that minimizes travel time without food getting cold. 5. ML ETA predictor ensures driver arrives just as food exits kitchen. 6. Atomic dispatch offer sent to driver with 60s countdown. 7. Route milestones persisted in DB.",
    "keyDesignTakeaways": [
      "Decouple Batching from Routing: Finding the global optimum for multi-pickup multi-delivery VRP is NP-hard; prune candidates into spatio-temporal clusters first, then run fast local search heuristics.",
      "Kitchen Dwell Time Minimization: Sending a driver too early wastes unpaid driver time waiting; sending too late results in soggy food; synchronize driver arrival with kitchen prep completion.",
      "Dynamic Route Insertion: Allow adding a second order to an active dasher's route on-the-fly if the detour adds less than 5 minutes to the first customer's delivery."
    ]
  },
  {
    "id": "online_chess_engine",
    "title": "Design Real-Time Multiplayer Chess State Machine",
    "badge": "♟️",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "500k Concurrent Games • 10M Moves/Hour",
    "qps": "25,000 Move Validations/Sec • Sub-20ms Engine Latency",
    "difficulty": "Medium",
    "goal": "Design a stateful multiplayer turn-based game engine with move validation, clock synchronization, and anti-cheat telemetry.",
    "availableNodes": [
      {
        "id": "client_app",
        "name": "Player Chess Client App",
        "icon": "♟️",
        "role": "Renders chessboard UI, captures mouse drags, and emits algebraic moves (e.g. `e4`, `Nf3`)"
      },
      {
        "id": "ws_gateway",
        "name": "Stateful WebSocket Gateway (Netty)",
        "icon": "⚡",
        "role": "Maintains persistent TCP socket session; handles ping/pong heartbeat and lag measurements"
      },
      {
        "id": "board_actor",
        "name": "Authoritative Board State Actor (Akka / Erlang)",
        "icon": "👑",
        "role": "Maintains board FEN representation in RAM; verifies piece movement legality, checks, and en passant"
      },
      {
        "id": "clock_manager",
        "name": "Millisecond Game Clock Manager",
        "icon": "⏱️",
        "role": "Decrements active player's remaining time with network round-trip time (RTT) lag compensation"
      },
      {
        "id": "sync_bus",
        "name": "Move Broadcast Bus (Redis Pub/Sub)",
        "icon": "📢",
        "role": "Broadcasts validated move to opponent and all spectating users with sub-20ms latency"
      },
      {
        "id": "pgn_storage",
        "name": "PGN Move History DB (Cassandra / DynamoDB)",
        "icon": "📑",
        "role": "Appends validated moves sequentially to preserve official tournament game scoresheet"
      },
      {
        "id": "anticheat_bus",
        "name": "Anti-Cheat Analysis Stream (Kafka)",
        "icon": "🔍",
        "role": "Asynchronously streams move times and move choices to Stockfish analysis cluster to detect computer assistance"
      }
    ],
    "correctSequence": [
      "client_app",
      "ws_gateway",
      "board_actor",
      "clock_manager",
      "sync_bus",
      "pgn_storage",
      "anticheat_bus"
    ],
    "explanation": "1. Player moves bishop to `c4`. 2. WebSocket gateway receives move packet with client timestamp. 3. Authoritative in-memory Board Actor validates move against FEN state. 4. Clock manager deducts time, applying ping lag deduction. 5. Redis Pub/Sub immediately broadcasts move to opponent. 6. Cassandra appends move to game PGN log. 7. Move sent to Kafka for asynchronous anti-cheat computer similarity analysis.",
    "keyDesignTakeaways": [
      "In-Memory State Actor Model: Maintain active game state entirely in RAM within a single-threaded actor (one per match); eliminate all database reads during active gameplay.",
      "FEN (Forsyth-Edwards Notation) State Encoding: Represent the entire board state in a compact 80-character string rather than heavy JSON object trees.",
      "Network Lag Compensation (Fischer Clock Rules): Measure player round-trip ping time and subtract network latency from clock deduction up to a capped threshold (e.g. 200ms) to ensure fairness on cellular connections."
    ]
  },
  {
    "id": "content_moderation_ai",
    "title": "Design Meta / Automated Image & Video Safety Moderation",
    "badge": "🛡️",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "1B Uploads/Day • Sub-Second Triage",
    "qps": "25,000 Media Uploads/Sec • Async Queue",
    "difficulty": "Hard",
    "goal": "Build a high-throughput content moderation pipeline using asynchronous computer vision models, perceptual hashing, and quarantine queues.",
    "availableNodes": [
      {
        "id": "uploader",
        "name": "User Content Upload Client",
        "icon": "📤",
        "role": "Uploads image, video, or text post pending safety clearance"
      },
      {
        "id": "mod_gateway",
        "name": "Content Ingestion Gateway",
        "icon": "🛡️",
        "role": "Performs initial virus scan and computes perceptual image hashes (PDQ/PhotoDNA)"
      },
      {
        "id": "known_bad_cache",
        "name": "Known Bad Hash DB (Redis / Milvus)",
        "icon": "🚫",
        "role": "Instant <5ms match against known illegal/harmful content databases"
      },
      {
        "id": "kafka_mod_bus",
        "name": "Moderation Task Stream (Kafka)",
        "icon": "📬",
        "role": "Prioritizes media classification tasks across high-risk vs low-risk queues"
      },
      {
        "id": "ai_inference_fleet",
        "name": "GPU AI Inference Worker Fleet",
        "icon": "🤖",
        "role": "Runs multi-modal neural networks (NSFW vision, hate speech OCR, audio speech-to-text)"
      },
      {
        "id": "human_review_queue",
        "name": "Human Review Priority Queue (RabbitMQ)",
        "icon": "👥",
        "role": "Dispatches borderline confidence cases (0.40 - 0.75 score) to human reviewers"
      },
      {
        "id": "policy_decision_db",
        "name": "Moderation Verdict DB & Audit Log",
        "icon": "⚖️",
        "role": "Applies auto-block, shadow-ban, or approved status with full compliance audit trail"
      }
    ],
    "correctSequence": [
      "uploader",
      "mod_gateway",
      "known_bad_cache",
      "kafka_mod_bus",
      "ai_inference_fleet",
      "human_review_queue",
      "policy_decision_db"
    ],
    "explanation": "1. User uploads media. 2. Gateway computes perceptual hash (PDQ/PhotoDNA). 3. Redis checks known-bad illegal content database (<5ms match immediately halts upload). 4. Media enqueued to Kafka moderation bus. 5. GPU AI inference fleet runs deep learning vision/NLP models in parallel. 6. High-confidence violations auto-blocked; high-confidence safe auto-approved. 7. Borderline confidence scores (0.4 - 0.75) routed to human review queue with SLA timers. 8. Final verdict committed to audit DB.",
    "keyDesignTakeaways": [
      "Perceptual Hashing (PhotoDNA / PDQ): Unlike SHA-256 where 1 pixel change breaks the hash, perceptual hashes measure visual similarity, catching cropped, resized, or filtered duplicates instantly in <5ms.",
      "Confidence-Based Three-Way Triage: Auto-approve >0.90 confidence safe; auto-block >0.90 confidence violation; route 0.40-0.75 borderline cases to human operators.",
      "Two-Tier GPU Priority Queuing: Prioritize live streaming and viral posts over long-tail private messages to prevent GPU cluster starvation."
    ]
  },
  {
    "id": "memcached_slab_allocator",
    "title": "Design Memcached / Multithreaded In-Memory Key-Value",
    "badge": "💾",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100M Cached Objects • 64GB RAM per Node • Sub-500µs Latency",
    "qps": "1,000,000 Read/Write Ops/Sec • Zero Memory Fragmentation",
    "difficulty": "Staff+",
    "goal": "Design a high-performance multithreaded caching daemon with slab memory allocation, LRU list management, and lock striping.",
    "availableNodes": [
      {
        "id": "client_libmemcached",
        "name": "App Client (Consistent Hashing)",
        "icon": "💻",
        "role": "Hashes key using Ketama consistent hashing to select Memcached instance directly over binary protocol"
      },
      {
        "id": "network_worker_thread",
        "name": "Multithreaded Libevent Network Fleet",
        "icon": "⚡",
        "role": "Non-blocking event loop using epoll; accepts TCP sockets and reads commands across multi-core CPUs"
      },
      {
        "id": "hash_table_index",
        "name": "Primary In-Memory Hash Table (MurmurHash)",
        "icon": "🔍",
        "role": "Maps key to item memory pointer in O(1) time; resizes automatically in background thread"
      },
      {
        "id": "slab_allocator_engine",
        "name": "Slab Allocation Engine (Slab Classes)",
        "icon": "🧱",
        "role": "Allocates fixed 1MB pages divided into uniform chunk size classes (e.g. 96B, 120B, 150B) to eliminate malloc fragmentation"
      },
      {
        "id": "item_lru_lists",
        "name": "Per-Slab-Class LRU Doubly-Linked Lists",
        "icon": "🔄",
        "role": "Maintains separate LRU lists for each slab class; evicts oldest item in class when chunk pool fills"
      },
      {
        "id": "cas_concurrency_lock",
        "name": "Atomic CAS & Per-Hash-Bucket Locks",
        "icon": "🔒",
        "role": "Locks only the target hash table bucket during writes; enforces 64-bit Check-And-Set (CAS) token integrity"
      },
      {
        "id": "raw_ram_memory",
        "name": "Pre-Allocated Memory Pages (64GB RAM)",
        "icon": "💾",
        "role": "Pre-allocates entire server RAM at boot, avoiding OS `malloc()` and `free()` kernel overhead"
      }
    ],
    "correctSequence": [
      "client_libmemcached",
      "network_worker_thread",
      "hash_table_index",
      "slab_allocator_engine",
      "item_lru_lists",
      "cas_concurrency_lock",
      "raw_ram_memory"
    ],
    "explanation": "1. Client uses Ketama consistent hashing to pick node. 2. Multithreaded libevent worker processes binary command. 3. Hash table locates item pointer in O(1). 4. Slab allocator assigns item to optimal chunk size class (e.g. 100-byte value into 120-byte slab). 5. If slab class is full, LRU evicts oldest entry in that specific class. 6. CAS lock updates bucket atomically. 7. Value served directly from pre-allocated memory in <500 microseconds.",
    "keyDesignTakeaways": [
      "Slab Allocation Eliminates Memory Fragmentation: Repeatedly calling OS `malloc()` and `free()` for millions of small objects causes severe memory fragmentation; Memcached pre-allocates 1MB pages split into fixed-size chunks, eliminating memory leaks.",
      "Multithreaded Architecture: Unlike Redis which runs a single-threaded event loop, Memcached is fully multithreaded with per-hash-bucket locks, allowing a single server with 64 CPU cores to process 1M+ QPS.",
      "Per-Slab LRU Eviction: Memcached maintains separate LRU lists for each slab class; if the 1KB slab class is full, it evicts only items from that class, preventing small keys from wiping out large cached items."
    ]
  },
  {
    "id": "credit_scoring_engine",
    "title": "Design Experian / Real-Time Credit Score Calculation",
    "badge": "💳",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "200M Consumers • Hundreds of Credit Bureaus",
    "qps": "10,000 Score Calculations/Sec • P99 < 100ms",
    "difficulty": "Staff+",
    "goal": "Build a credit bureau calculation engine aggregating loan payment histories, credit utilization ratios, and public record databases.",
    "availableNodes": [
      {
        "id": "lender_client",
        "name": "Lender Underwriting Client (Bank / Card)",
        "icon": "🏦",
        "role": "Submits credit inquiry (SSN, name, address) for mortgage or credit card approval"
      },
      {
        "id": "bureau_gw",
        "name": "Credit Bureau Secure API Gateway",
        "icon": "🛡️",
        "role": "Enforces mTLS, checks FCRA permissible purpose legal consent, and authenticates lender"
      },
      {
        "id": "identity_matcher",
        "name": "Fuzzy Consumer Identity Matcher",
        "icon": "🔍",
        "role": "Resolves consumer SSN, address history, and alias names into unique Credit File PIN"
      },
      {
        "id": "credit_file_db",
        "name": "Credit History DB (ScyllaDB / CockroachDB)",
        "icon": "🗄️",
        "role": "Retrieves trade lines (mortgages, credit cards, auto loans, collections, inquiries)"
      },
      {
        "id": "fico_calc_engine",
        "name": "FICO / VantageScore Calculation Core",
        "icon": "⚙️",
        "role": "Calculates 300-850 score: Payment History (35%), Utilization (30%), Age (15%), Mix (10%), New (10%)"
      },
      {
        "id": "score_cache",
        "name": "Credit Score Cache (Redis)",
        "icon": "⚡",
        "role": "Caches calculated score for 30 days to avoid duplicate expensive recalculations"
      },
      {
        "id": "inquiry_logger",
        "name": "Inquiry Logging & Audit Trail Service",
        "icon": "📜",
        "role": "Records Hard Inquiry on consumer credit file and generates FCRA compliance log"
      }
    ],
    "correctSequence": [
      "lender_client",
      "bureau_gw",
      "identity_matcher",
      "credit_file_db",
      "fico_calc_engine",
      "score_cache",
      "inquiry_logger"
    ],
    "explanation": "1. Lender submits credit inquiry. 2. Gateway verifies FCRA permissible purpose. 3. Identity Matcher resolves SSN and address history to consumer credit PIN. 4. Trade line history retrieved from database (payment history, credit limits, balances). 5. FICO score calculation engine weights the 5 credit factors in <30ms. 6. Score cached in Redis. 7. Hard inquiry logged to consumer profile for other lenders to see. 8. Score (300-850) and adverse action reason codes returned to lender.",
    "keyDesignTakeaways": [
      "Deterministic 5-Pillar Score Calculation: Payment History (35%), Credit Utilization (30%), Length of History (15%), Credit Mix (10%), New Credit Inquiries (10%).",
      "Hard vs Soft Inquiries: Hard inquiries (applying for new credit) impact the score and must be recorded transactionally; Soft inquiries (pre-approval / monitoring) are invisible to lenders.",
      "Adverse Action Reason Codes: Regulatory compliance requires returning top 4 key factors (e.g. 'Proportion of balances to credit limits is too high') if the score is not top tier."
    ]
  },
  {
    "id": "telecom_sms_gateway",
    "title": "Design Twilio / Global Telecom SMS SMPP Gateway",
    "badge": "📱",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1,000 Global Telecom Carriers • 1 Billion SMS/Day",
    "qps": "25,000 SMS Submissions/Sec • Sub-5s End-to-End Handset Delivery",
    "difficulty": "Hard",
    "goal": "Design a high-throughput telecom messaging gateway interfacing with global mobile carrier SMPP protocols with delivery receipts.",
    "availableNodes": [
      {
        "id": "customer_api_client",
        "name": "Customer Application (REST API)",
        "icon": "💻",
        "role": "Submits outgoing SMS message with sender ID, recipient E.164 phone number, and message body"
      },
      {
        "id": "sms_api_gateway",
        "name": "SMS API Gateway & Rate Limiter",
        "icon": "🛡️",
        "role": "Validates API credentials, parses E.164 phone format (+1...), and checks regulatory consent allowlists"
      },
      {
        "id": "carrier_routing_engine",
        "name": "Least-Cost Carrier Routing Engine (LCR)",
        "icon": "🌐",
        "role": "Evaluates recipient mobile country code (MCC) and network code (MNC); picks cheapest carrier with >98% delivery rate"
      },
      {
        "id": "smpp_queue_stream",
        "name": "Outbound SMPP Priority Stream (Kafka)",
        "icon": "📬",
        "role": "Buffers SMS requests partitioned by `carrier_connection_id` to strictly respect carrier TPS rate limits"
      },
      {
        "id": "smpp_transceiver_pool",
        "name": "SMPP Protocol Transceiver Fleet",
        "icon": "⚡",
        "role": "Maintains persistent binary SMPP 3.4 TCP sessions to telecom Short Message Service Centers (SMSC)"
      },
      {
        "id": "delivery_receipt_dlr",
        "name": "Delivery Receipt (DLR) Tracker",
        "icon": "📲",
        "role": "Receives asynchronous DLR status callbacks from carriers (DELIVERED, UNDELIVERABLE) and emits webhooks"
      },
      {
        "id": "sms_audit_ledger",
        "name": "SMS Billing & Audit Ledger (Cassandra)",
        "icon": "📑",
        "role": "Records immutable message dispatch logs, carrier transit fees, and customer billing usage"
      }
    ],
    "correctSequence": [
      "customer_api_client",
      "sms_api_gateway",
      "carrier_routing_engine",
      "smpp_queue_stream",
      "smpp_transceiver_pool",
      "delivery_receipt_dlr",
      "sms_audit_ledger"
    ],
    "explanation": "1. Customer submits POST /v1/Messages. 2. Gateway validates E.164 number format. 3. Carrier Routing Engine queries Number Portability database; selects optimal telco carrier using Least-Cost Routing (LCR). 4. Message buffered in Kafka partitioned by carrier connection. 5. SMPP transceiver fleet converts HTTP to binary SMPP `SUBMIT_SM` packet over persistent TCP link. 6. Carrier SMSC delivers to mobile handset and returns asynchronous Delivery Receipt (DLR). 7. Customer webhook receives delivery confirmation.",
    "keyDesignTakeaways": [
      "SMPP (Short Message Peer-to-Peer) Protocol: Telecom carriers do not use HTTP REST; they use binary SMPP 3.4 over persistent TCP sockets with strict transactions-per-second (TPS) quotas per bind.",
      "Mobile Number Portability (MNP) Lookup: Users frequently switch carriers while keeping their number (e.g. from AT&T to Verizon); gateways must check MNP databases in real time to avoid routing to the wrong telco.",
      "Asynchronous Delivery Receipts (DLR): Carrier acknowledgment (`SUBMIT_SM_RESP`) only confirms the SMS reached the carrier center, not the user's phone; actual handset delivery arrives seconds later as an asynchronous DLR packet."
    ]
  },
  {
    "id": "realtime_audio_translation",
    "title": "Design Google Translate / Real-Time Voice Translation",
    "badge": "🗣️",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "100M Audio Minutes/Day • Multi-Lingual",
    "qps": "15,000 Concurrent Audio Streams • Sub-Second",
    "difficulty": "Staff+",
    "goal": "Construct a low-latency speech-to-speech translation pipeline using streaming ASR, neural machine translation, and text-to-speech synthesis.",
    "availableNodes": [
      {
        "id": "audio_client",
        "name": "Speech Input Client (Browser / Phone)",
        "icon": "🎙️",
        "role": "Captures raw microphone audio and streams chunked PCM frames over WebSocket"
      },
      {
        "id": "stream_gw",
        "name": "Streaming Voice Gateway (gRPC / WS)",
        "icon": "🛡️",
        "role": "Maintains bi-directional streaming session with Voice Activity Detection (VAD)"
      },
      {
        "id": "asr_engine",
        "name": "Automated Speech Recognition (ASR / STT)",
        "icon": "🗣️",
        "role": "Transcribes incoming audio frames into streaming partial text tokens in real time"
      },
      {
        "id": "nmt_translator",
        "name": "Neural Machine Translation (NMT)",
        "icon": "🌐",
        "role": "Translates transcribed source text into target language with context boundary re-write"
      },
      {
        "id": "tts_synthesizer",
        "name": "Text-To-Speech Synthesizer (TTS)",
        "icon": "🔊",
        "role": "Synthesizes translated text into natural audio waveform bytes (Tacotron/WaveNet)"
      },
      {
        "id": "translation_cache",
        "name": "Common Phrase Translation Cache (Redis)",
        "icon": "⚡",
        "role": "Caches identical short conversational phrases in memory to bypass NMT inference"
      },
      {
        "id": "audio_playback",
        "name": "Translated Audio Output Player",
        "icon": "🎧",
        "role": "Streams translated voice audio bytes seamlessly into listener headphones"
      }
    ],
    "correctSequence": [
      "audio_client",
      "stream_gw",
      "asr_engine",
      "nmt_translator",
      "tts_synthesizer",
      "translation_cache",
      "audio_playback"
    ],
    "explanation": "1. User speaks into microphone; client streams PCM audio chunks over gRPC/WebSocket. 2. Gateway applies Voice Activity Detection (VAD) to filter background silence. 3. Streaming ASR engine (Speech-to-Text) generates partial transcription tokens. 4. Neural Machine Translation (NMT) translates source tokens into target language using rolling context windows. 5. Frequently used conversational phrases hit Redis cache (<1ms). 6. Text-to-Speech (TTS) synthesizes translated text into fluid audio waveform. 7. Synthesized audio streams back to listener in <800ms end-to-end.",
    "keyDesignTakeaways": [
      "Voice Activity Detection (VAD) at Ingress: Detecting voice start/stop boundaries drops 40%+ of silence audio chunks, cutting expensive GPU speech recognition costs.",
      "Streaming Partial Hypothesis Emission: Emit interim transcription and translation tokens as user speaks, rather than waiting for full sentence completion.",
      "Context Window Boundary Revision: Re-evaluate translated phrases when trailing context arrives to correct grammatical word-order mismatches (e.g. English SVO vs German SOV)."
    ]
  },
  {
    "id": "multi_region_active_active",
    "title": "Design Multi-Region Active-Active Database Architecture",
    "badge": "🌐",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "3 Continental Regions • 99.999% Availability • Zero RPO Failover",
    "qps": "100,000 Multi-Region Writes/Sec • Sub-50ms Local Read Latency",
    "difficulty": "Staff+",
    "goal": "Design an active-active multi-region data replication topology resolving cross-region conflicts via Last-Write-Wins and CRDTs.",
    "availableNodes": [
      {
        "id": "global_anycast_dns",
        "name": "Global Anycast DNS / Latency Router",
        "icon": "🌐",
        "role": "Routes user traffic to the geographically closest operational cloud region (US, EU, APAC)"
      },
      {
        "id": "regional_api_gateway",
        "name": "Regional API Gateway & Proxy",
        "icon": "🛡️",
        "role": "Terminates TLS locally, executes user authentication, and routes requests to regional services"
      },
      {
        "id": "cockroach_distributed_db",
        "name": "Multi-Region Distributed SQL (CockroachDB / Spanner)",
        "icon": "💾",
        "role": "Replicates Raft consensus across regions; partitions tables by locality (REGIONAL BY ROW)"
      },
      {
        "id": "crank_conflict_resolver",
        "name": "Conflict-Free Replicated Data Engine (CRDT)",
        "icon": "⚙️",
        "role": "Resolves concurrent multi-region update conflicts deterministically using state-based CRDTs"
      },
      {
        "id": "cross_region_wan_link",
        "name": "Encrypted Dedicated Cloud WAN Mesh",
        "icon": "⚡",
        "role": "Carries asynchronous and synchronous cross-region consensus replication traffic over private fiber backbone"
      },
      {
        "id": "cdc_change_re Existen",
        "name": "Cross-Region CDC Streamer (Kafka MirrorMaker)",
        "icon": "🔄",
        "role": "Streams asynchronous data mutations between regional search indexes and caches"
      },
      {
        "id": "health_failover_daemon",
        "name": "Automated Regional Failover Controller",
        "icon": "🚨",
        "role": "Monitors region health; swings traffic away from failing regions within 30 seconds with zero data loss"
      }
    ],
    "correctSequence": [
      "global_anycast_dns",
      "regional_api_gateway",
      "cockroach_distributed_db",
      "crank_conflict_resolver",
      "cross_region_wan_link",
      "cdc_change_re Existen",
      "health_failover_daemon"
    ],
    "explanation": "1. User in Berlin connects via Anycast to EU region. 2. Regional gateway terminates request. 3. CockroachDB processes write locally using `REGIONAL BY ROW` (EU users partitioned to EU Raft leases). 4. If concurrent cross-region writes occur, CRDT logic or Raft consensus orders transactions. 5. Private cloud WAN replicates state. 6. Kafka MirrorMaker replicates cache/search state. 7. If US region suffers complete datacenter failure, Anycast swings traffic to EU with 0 RPO.",
    "keyDesignTakeaways": [
      "Data Locality Partitioning (REGIONAL BY ROW): You cannot fight the speed of light (transatlantic ping is 70ms); store European user data on European nodes with European Raft leases so reads/writes complete locally in <5ms.",
      "Avoid Last-Write-Wins (LWW) Clock Traps: Using physical wall-clock timestamps for conflict resolution leads to silent data loss due to clock drift; use TrueTime (bounded uncertainty) or CRDTs.",
      "Active-Active vs Active-Passive: Active-passive wastes 50% of hardware budget and risks failover failure during a crisis; active-active continuously serves traffic in all regions, verifying operational health 24/7."
    ]
  },
  {
    "id": "people_you_may_know",
    "title": "Design Facebook / People You May Know Recommendation",
    "badge": "👥",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "2B Users • 10B Daily Recommendations",
    "qps": "20,000 Feed Recommendation QPS",
    "difficulty": "Hard",
    "goal": "Build a friend recommendation engine evaluating mutual friend counts, school/workplace clusters, and graph community detection algorithms.",
    "availableNodes": [
      {
        "id": "fb_user",
        "name": "Facebook Mobile App Client",
        "icon": "👥",
        "role": "Scrolls newsfeed and requests People You May Know carousel recommendations"
      },
      {
        "id": "pymk_gateway",
        "name": "Social Discovery API Gateway",
        "icon": "🛡️",
        "role": "Authenticates user and checks frequency capping (max 1 PYMK unit per 10 feed scrolls)"
      },
      {
        "id": "graph_triadic_engine",
        "name": "Triadic Closure Graph Engine",
        "icon": "🕸️",
        "role": "Executes 2nd-degree friend-of-friends graph queries: Friends of Friends (FoF)"
      },
      {
        "id": "contact_sync_service",
        "name": "Contact Book & Phonebook Ingester",
        "icon": "📱",
        "role": "Matches hashed phone numbers and emails to discover real-world offline social ties"
      },
      {
        "id": "ml_candidate_ranker",
        "name": "ML Ranking Fleet (GBDT / Deep Learning)",
        "icon": "🤖",
        "role": "Scores candidate friend suggestions using mutual friends, school, employer, and city"
      },
      {
        "id": "negative_dismiss_cache",
        "name": "Dismissed & Blocked Cache (Redis)",
        "icon": "🚫",
        "role": "Filters out dismissed suggestions and previously blocked profiles in <2ms"
      },
      {
        "id": "pymk_precomputed_cache",
        "name": "Precomputed Suggestions Cache (Cassandra)",
        "icon": "💾",
        "role": "Stores pre-ranked top 100 friend suggestions per user generated by nightly batch pipeline"
      }
    ],
    "correctSequence": [
      "fb_user",
      "pymk_gateway",
      "graph_triadic_engine",
      "contact_sync_service",
      "ml_candidate_ranker",
      "negative_dismiss_cache",
      "pymk_precomputed_cache"
    ],
    "explanation": "1. User scrolls feed; Gateway requests friend recommendations. 2. Offline pipeline uses Triadic Closure (Friends of Friends) on social graph to find candidates who share >= 2 mutual friends. 3. Contact book sync adds offline acquaintances. 4. Machine learning ranker scores candidates based on mutual connection count, shared high school/college, workplace, and geographic proximity. 5. Redis checks dismissed suggestion blacklist to avoid showing previously rejected profiles. 6. Top 100 precomputed suggestions stored in Cassandra and fetched in <15ms.",
    "keyDesignTakeaways": [
      "Triadic Closure Principle: In social networks, if A knows B and B knows C, there is an 80%+ probability that A and C have met. Friends-of-Friends (FoF) is the #1 candidate generator.",
      "Precompute Offline via MapReduce/Spark: Generating PYMK live on request for 2B users requires traversing billions of graph edges; precompute top 100 recommendations offline overnight.",
      "Negative Feedback Filtering: When a user clicks 'X' (Remove), record the dismissal in Redis with a 90-day cooldown so the rejected person is never recommended again."
    ]
  },
  {
    "id": "ml_feature_store_feast",
    "title": "Design Machine Learning Feature Store (Feast/Redis)",
    "badge": "🤖",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10,000 ML Features • 1 Billion Entities • 100M Daily Inferences",
    "qps": "100,000 Online Feature Lookups/Sec • Sub-5ms Feature Retrieval",
    "difficulty": "Hard",
    "goal": "Design an enterprise ML feature store providing point-in-time correct training data and sub-5ms online inference feature lookups.",
    "availableNodes": [
      {
        "id": "raw_data_sources",
        "name": "Raw Event Sources & Batch Pipelines",
        "icon": "📊",
        "role": "Produces raw data: streaming clickstream (Kafka) and historical purchase logs (Snowflake / S3)"
      },
      {
        "id": "feature_computation_engine",
        "name": "Streaming & Batch Feature Processor (Spark / Flink)",
        "icon": "⚙️",
        "role": "Computes rolling features: `user_30d_spend`, `user_last_10_clicked_categories`"
      },
      {
        "id": "feast_feature_registry",
        "name": "Feature Registry & Schema Store (PostgreSQL)",
        "icon": "📜",
        "role": "Central metadata catalog defining feature views, entity keys, data types, and update SLAs"
      },
      {
        "id": "online_store_redis",
        "name": "Online Low-Latency Store (Redis Cluster / DynamoDB)",
        "icon": "⚡",
        "role": "Stores latest feature values for real-time model inference; serves 100 features in <2ms"
      },
      {
        "id": "offline_store_parquet",
        "name": "Offline Historical Feature Store (S3 Parquet)",
        "icon": "🗄️",
        "role": "Stores point-in-time historical feature snapshots for model training with zero data leakage"
      },
      {
        "id": "point_in_time_joiner",
        "name": "Point-in-Time 'Time Travel' Join Engine",
        "icon": "⏳",
        "role": "Joins label timestamps with feature values as they existed at observation time (As-Of Join)"
      },
      {
        "id": "model_inference_service",
        "name": "Real-Time Model Serving Fleet (Triton / TorchServe)",
        "icon": "🧠",
        "role": "Hydrates online features in <5ms, feeds feature vector into neural network, and returns prediction"
      }
    ],
    "correctSequence": [
      "raw_data_sources",
      "feature_computation_engine",
      "feast_feature_registry",
      "online_store_redis",
      "offline_store_parquet",
      "point_in_time_joiner",
      "model_inference_service"
    ],
    "explanation": "1. Raw click events processed by Flink. 2. Flink computes real-time features (`clicks_last_1h`). 3. Feast Registry enforces schema types. 4. Latest feature values synced to Redis online store for sub-2ms lookup. 5. Historical values written to S3 Parquet offline store. 6. Time-travel joiner produces training datasets with exact point-in-time correctness. 7. Model serving fleet pulls feature vector from Redis to score recommendations.",
    "keyDesignTakeaways": [
      "Dual-Storage Architecture (Online vs Offline): Real-time inference requires <5ms key-value lookups (Redis); model training requires scanning terabytes of historical columnar data (S3 Parquet); a feature store synchronizes both automatically.",
      "Point-in-Time Correctness (Preventing Data Leakage): Joining a training label with future feature values causes models to 'cheat' in training and fail catastrophically in production; use As-Of joins to ensure features are sampled exactly as they existed at label time.",
      "Feature Drift Detection: Monitor production feature distributions against training baselines (PSI - Population Stability Index); alert when input feature values drift due to external shifts."
    ]
  },
  {
    "id": "smart_thermostat_iot",
    "title": "Design Nest / Smart HVAC Energy Scheduling",
    "badge": "🌡️",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "15M Thermostats • 1B Daily Temperature Telemetry Pings",
    "qps": "25,000 Ingestion QPS • Sub-1s Schedule Sync",
    "difficulty": "Medium",
    "goal": "Build an automated smart home temperature optimization system analyzing weather forecasts, occupancy sensors, and utility peak pricing.",
    "availableNodes": [
      {
        "id": "thermostat_device",
        "name": "Smart Thermostat Hardware",
        "icon": "🌡️",
        "role": "Samples ambient temperature, humidity, and home occupancy PIR sensor every 30 seconds"
      },
      {
        "id": "iot_core_gw",
        "name": "AWS IoT Core / MQTT Gateway",
        "icon": "⚡",
        "role": "Terminates bidirectional mTLS MQTT sessions; authenticates hardware X.509 device certificates"
      },
      {
        "id": "telemetry_stream",
        "name": "Sensor Telemetry Stream (Kafka)",
        "icon": "📬",
        "role": "Buffers raw temperature sensor pings partitioned by `thermostat_id`"
      },
      {
        "id": "energy_scheduler",
        "name": "HVAC Learning & Schedule Engine",
        "icon": "🧠",
        "role": "Learns homeowner temperature preferences and schedules pre-cooling/heating based on weather forecasts"
      },
      {
        "id": "thermostat_shadow",
        "name": "Thermostat State Shadow (DynamoDB / Redis)",
        "icon": "👥",
        "role": "Maintains desired target temperature and operating mode (HEAT/COOL/ECO)"
      },
      {
        "id": "demand_response_bus",
        "name": "Grid Demand-Response Dispatcher",
        "icon": "⚡",
        "role": "Sends automated peak energy conservation events during regional grid heatwaves"
      },
      {
        "id": "homeowner_mobile",
        "name": "Homeowner Companion App",
        "icon": "📱",
        "role": "Renders real-time ambient temp and allows remote target temperature adjustments"
      }
    ],
    "correctSequence": [
      "thermostat_device",
      "iot_core_gw",
      "telemetry_stream",
      "energy_scheduler",
      "thermostat_shadow",
      "demand_response_bus",
      "homeowner_mobile"
    ],
    "explanation": "1. Thermostat hardware reads temperature and occupancy. 2. IoT Gateway ingests data via MQTT over mTLS. 3. Kafka partitions sensor streams. 4. Energy Learning Engine trains schedule from user habits and outdoor weather. 5. Thermostat Shadow stores desired target temp in Redis/DynamoDB. 6. Grid Demand-Response dispatcher coordinates peak energy reductions across 1M homes. 7. Mobile app pushes immediate temperature adjustments.",
    "keyDesignTakeaways": [
      "Hardware mTLS Identity: Thermostats use embedded cryptographic hardware chips (TPM/Secure Element) to store private keys, authenticating via mutual TLS (mTLS) to prevent rogue device spoofing.",
      "Device Shadow for Sleep & Low-Power: Thermostats sleep Wi-Fi radios to conserve power; cloud device shadows buffer setting adjustments and sync when the device wakes.",
      "Demand-Response Grid Coordination: During regional power grid emergencies, stagger HVAC cycle adjustments across homes by 2-5 minutes to avoid creating an artificial power surge when all air conditioners restart."
    ]
  },
  {
    "id": "digital_signature_pki",
    "title": "Design Cloud Cryptographic PKI Certificate Authority",
    "badge": "🔐",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "1B Issued Certificates • Zero Private Key Leaks",
    "qps": "100,000 OCSP Status Checks/Sec • Sub-5ms",
    "difficulty": "Staff+",
    "goal": "Design a private PKI certificate authority automating ACME protocol issuance, CRL distribution, and Hardware Security Module (HSM) keys.",
    "availableNodes": [
      {
        "id": "acme_client",
        "name": "ACME Protocol Client (Certbot / K8s)",
        "icon": "🖥️",
        "role": "Requests TLS certificate via ACME protocol (HTTP-01 / DNS-01 challenge)"
      },
      {
        "id": "ca_gateway",
        "name": "Certificate Authority API Gateway",
        "icon": "🛡️",
        "role": "Validates Certificate Signing Request (CSR) and domain ownership challenge"
      },
      {
        "id": "validation_worker",
        "name": "Domain Validation Worker (DNS / HTTP)",
        "icon": "🔍",
        "role": "Verifies DNS TXT record or HTTP challenge token across distributed vantage points"
      },
      {
        "id": "issuing_ca_hsm",
        "name": "Issuing CA (Hardware Security Module HSM)",
        "icon": "🔐",
        "role": "Signs X.509 certificate using offline intermediate private key inside FIPS 140-2 Level 3 HSM"
      },
      {
        "id": "cert_transparency",
        "name": "Certificate Transparency (CT) Log Submitter",
        "icon": "📜",
        "role": "Submits signed certificate to Google/Cloudflare public append-only Merkle tree logs"
      },
      {
        "id": "ocsp_responder",
        "name": "OCSP Revocation Responder (Redis / Edge)",
        "icon": "⚡",
        "role": "Serves Online Certificate Status Protocol (OCSP) revocation responses in <5ms"
      },
      {
        "id": "cert_database",
        "name": "Certificate Inventory DB (CockroachDB)",
        "icon": "💾",
        "role": "Stores active certificates, serial numbers, and expiration timestamps"
      }
    ],
    "correctSequence": [
      "acme_client",
      "ca_gateway",
      "validation_worker",
      "issuing_ca_hsm",
      "cert_transparency",
      "ocsp_responder",
      "cert_database"
    ],
    "explanation": "1. Web server client requests TLS certificate via ACME protocol. 2. Gateway issues DNS/HTTP domain verification challenge. 3. Validation workers verify domain ownership from multiple global vantage points. 4. Hardware Security Module (HSM) signs X.509 certificate with Intermediate CA private key. 5. Certificate submitted to public Certificate Transparency (CT) Merkle logs to obtain SCT proof. 6. OCSP revocation response pre-generated and cached at edge. 7. Certificate delivered to client and logged to database.",
    "keyDesignTakeaways": [
      "Root CA vs Intermediate Issuing CA: The Root CA private key is generated offline in a secure physical vault and NEVER connects to the internet; online automated services only use short-lived Intermediate CAs.",
      "Certificate Transparency (CT) Logs: All public TLS certificates must be logged to public cryptographic append-only Merkle trees (RFC 6962) before browsers (Chrome/Safari) will trust them.",
      "OCSP Stapling: Clients checking revocation on every HTTPS connection causes privacy leaks and latency; servers pre-fetch and staple cached OCSP responses during the TLS handshake."
    ]
  },
  {
    "id": "ll_hls_low_latency_video",
    "title": "Design Twitch / Ultra Low-Latency LL-HLS Video Transcoder",
    "badge": "📺",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "50,000 Live Broadcasts • 5M Viewers • Sub-2s Glass-to-Glass Latency",
    "qps": "50,000 Video Chunks Ingested/Sec • Low Latency HLS (CMAF)",
    "difficulty": "Staff+",
    "goal": "Construct an ultra-low latency live video streaming delivery pipeline using chunked CMAF segments, LL-HLS manifests, and HTTP/3.",
    "availableNodes": [
      {
        "id": "streamer_encoder",
        "name": "Broadcaster OBS / RTMP Encoder",
        "icon": "🎥",
        "role": "Encodes H.264/HEVC video frames; publishes via RTMP / SRT protocol with 1-second keyframe intervals"
      },
      {
        "id": "ingest_origin",
        "name": "Video Ingest Origin Cluster (Netty)",
        "icon": "⚡",
        "role": "Terminates inbound SRT/RTMP stream; parses raw MPEG-TS video and audio elementary streams"
      },
      {
        "id": "cmaf_transcoder",
        "name": "LL-CMAF Chunked Transcoder",
        "icon": "⚙️",
        "role": "Transcodes input into multi-bitrate ladder (1080p60, 720p60, 480p) producing 200ms CMAF chunklets"
      },
      {
        "id": "chunk_packager",
        "name": "Low-Latency HLS Packager",
        "icon": "📦",
        "role": "Generates LL-HLS playlist (.m3u8) using `#EXT-X-PART` tags and HTTP/2 Chunked Transfer push"
      },
      {
        "id": "edge_cdn_fleet",
        "name": "Low-Latency Edge CDN Mesh",
        "icon": "☁️",
        "role": "Delivers 200ms partial segments using HTTP/2 chunked transfer encoding directly to viewers"
      },
      {
        "id": "viewer_player",
        "name": "LL-HLS Client Video Player",
        "icon": "📱",
        "role": "Plays video using CMAF chunk pipelining, keeping playback buffer under 1.5 seconds"
      },
      {
        "id": "vod_archive_store",
        "name": "VOD Master Storage (S3 / Ceph)",
        "icon": "🗄️",
        "role": "Consolidates ephemeral 200ms chunks into standard full 6-second segments for permanent VOD replay"
      }
    ],
    "correctSequence": [
      "streamer_encoder",
      "ingest_origin",
      "cmaf_transcoder",
      "chunk_packager",
      "edge_cdn_fleet",
      "viewer_player",
      "vod_archive_store"
    ],
    "explanation": "1. Streamer pushes video via SRT with 1s keyframes. 2. Ingest origin receives stream. 3. CMAF transcoder splits video into 200ms partial chunklets (CMAF). 4. LL-HLS packager publishes delta playlists using `#EXT-X-PART`. 5. Edge CDN streams partial chunklets over HTTP/2 chunked transfer before the full segment is even finished transcoding. 6. Player renders partial chunks, achieving 1.5s glass-to-glass latency. 7. Chunks archived into full S3 segments for VOD.",
    "keyDesignTakeaways": [
      "CMAF Chunked Transfer Encoding: Traditional HLS waits for a full 6-second segment to finish encoding before writing to disk; LL-HLS with CMAF transmits 200ms chunklets immediately via HTTP/2 chunked transfer while the segment is still recording.",
      "Delta Playlist Updates (`#EXT-X-PART`): LL-HLS avoids redownloading large playlist files; clients fetch micro delta playlists containing only newly available partial segment URLs.",
      "Preload Hints (`#EXT-X-PRELOAD-HINT`): The manifest instructs the client which chunklet will arrive next so the player can open the HTTP request before the chunklet is even generated."
    ]
  },
  {
    "id": "distributed_job_celery",
    "title": "Design Celery / Distributed Background Task Worker Pool",
    "badge": "⚙️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100k Tasks/Sec • 1,000 Worker Nodes • Heterogeneous Queues",
    "qps": "100,000 Tasks Dispatched/Sec • Sub-10ms Task Scheduling",
    "difficulty": "Medium",
    "goal": "Build a distributed background worker cluster with rate limiting, task retries with exponential backoff, and prefetch optimization.",
    "availableNodes": [
      {
        "id": "web_app_producer",
        "name": "Web App Producer (Django / FastAPI)",
        "icon": "💻",
        "role": "Dispatches asynchronous tasks (`send_welcome_email.delay(user_id)`) over non-blocking socket"
      },
      {
        "id": "task_broker_rabbitmq",
        "name": "Task Message Broker (RabbitMQ / Redis)",
        "icon": "📬",
        "role": "Maintains persistent AMQP queues with priority routing, prefetch counts, and consumer acknowledgments"
      },
      {
        "id": "priority_queue_router",
        "name": "Dynamic Priority & Routing Key Dispatcher",
        "icon": "🔀",
        "role": "Routes tasks to dedicated worker pools based on task priority (high, default, low_bulk)"
      },
      {
        "id": "celery_worker_node",
        "name": "Celery Worker Process Pool",
        "icon": "⚙️",
        "role": "Pulls tasks via prefetch limit; executes Python business logic inside isolated worker processes"
      },
      {
        "id": "result_backend_redis",
        "name": "Task Result Backend (Redis / Memcached)",
        "icon": "💾",
        "role": "Stores task return value and execution state (`SUCCESS`, `FAILED`) with 24-hour TTL"
      },
      {
        "id": "dead_letter_queue_dlx",
        "name": "Dead Letter Queue & Retry Manager (DLX)",
        "icon": "💀",
        "role": "Catches crashed tasks; applies exponential backoff with jitter and moves poisonous tasks to DLQ"
      },
      {
        "id": "celery_flower_monitor",
        "name": "Flower Real-Time Monitoring Dashboard",
        "icon": "📊",
        "role": "Visualizes active worker processes, queue depths, throughput graphs, and task failure rates"
      }
    ],
    "correctSequence": [
      "web_app_producer",
      "task_broker_rabbitmq",
      "priority_queue_router",
      "celery_worker_node",
      "result_backend_redis",
      "dead_letter_queue_dlx",
      "celery_flower_monitor"
    ],
    "explanation": "1. Web app enqueues task. 2. RabbitMQ broker buffers task in AMQP queue. 3. Priority router directs task to high-priority queue. 4. Worker pulls task based on `prefetch_count=4`, executes logic. 5. Result stored in Redis for client polling. 6. If task crashes, retry manager retries with exponential backoff; if retries exhausted, moved to Dead Letter Queue (DLQ). 7. Flower monitors worker health.",
    "keyDesignTakeaways": [
      "Prefetch Limits Prevent Worker Starvation: Default prefetch takes all tasks from the broker at once; if one worker hogs 1,000 slow tasks while other workers sit idle, set `worker_prefetch_multiplier = 1` for fair distribution.",
      "Queue Isolation by Task SLA: Never put 100ms transactional emails in the same queue as 30-minute video encodings; create dedicated priority queues with dedicated worker pools.",
      "Idempotent Task Design: Network glitches cause RabbitMQ redelivery; all tasks must be idempotent (safe to run twice without duplicate side effects) using database unique constraints."
    ]
  },
  {
    "id": "stock_portfolio_pnl",
    "title": "Design Robinhood / Real-Time Portfolio PnL Calculation",
    "badge": "📈",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "25M Portfolios • 10,000 Live Market Tickers",
    "qps": "500,000 Real-Time PnL Updates/Sec • Sub-Second",
    "difficulty": "Hard",
    "goal": "Design a real-time portfolio valuation engine that recalculates realized and unrealized gain/loss as live market stock ticks arrive.",
    "availableNodes": [
      {
        "id": "trader_app",
        "name": "Investor Mobile App",
        "icon": "📱",
        "role": "Displays real-time portfolio balance, daily dollar return, and percentage chart"
      },
      {
        "id": "ws_gateway",
        "name": "Streaming Portfolio Gateway (WebSocket)",
        "icon": "🛡️",
        "role": "Maintains persistent WebSocket connections to active traders viewing their portfolio"
      },
      {
        "id": "position_store",
        "name": "User Positions Cache (Redis In-Memory)",
        "icon": "📊",
        "role": "Stores user stock holdings: AAPL (10 shares @ $150), TSLA (5 shares @ $200)"
      },
      {
        "id": "market_ticker_stream",
        "name": "Market Price Ticker Stream (Kafka)",
        "icon": "📈",
        "role": "Receives 50,000 price tick events/sec from NASDAQ / NYSE exchange feeds"
      },
      {
        "id": "pnl_calc_engine",
        "name": "Real-Time PnL Computation Worker (Flink)",
        "icon": "⚙️",
        "role": "Calculates Mark-to-Market PnL: SUM(Current_Price * Quantity) - Cost_Basis"
      },
      {
        "id": "historical_eod_db",
        "name": "End-of-Day Ledger & Tax DB (TimescaleDB)",
        "icon": "💾",
        "role": "Persists official daily close portfolio valuations for tax reporting and statements"
      },
      {
        "id": "margin_risk_monitor",
        "name": "Real-Time Margin Call Monitor",
        "icon": "🚨",
        "role": "Evaluates account equity against maintenance margin, triggering margin calls on market drops"
      }
    ],
    "correctSequence": [
      "trader_app",
      "ws_gateway",
      "position_store",
      "market_ticker_stream",
      "pnl_calc_engine",
      "historical_eod_db",
      "margin_risk_monitor"
    ],
    "explanation": "1. User opens portfolio on phone; establishes WebSocket connection. 2. Gateway loads user positions from Redis (e.g. 10 AAPL, 5 TSLA). 3. Exchange price ticks stream to Kafka. 4. Flink PnL engine recalculates Mark-to-Market portfolio equity in real time: `Equity = SUM(Price * Qty) + Cash`. 5. Updated portfolio return pushes over WebSocket to app in <100ms. 6. Margin risk monitor verifies account equity exceeds required maintenance threshold. 7. End-of-Day valuations persisted to TimescaleDB.",
    "keyDesignTakeaways": [
      "Push Updates Only for Viewed Portfolios: Never recalculate PnL in real time for 25M users continuously; only stream real-time price updates to active users with an open WebSocket session.",
      "Inverted Position Index: Map `Symbol -> List of Active User IDs holding that symbol`; when AAPL changes price, only recalculate portfolios that hold AAPL.",
      "Separate Mark-to-Market from Tax Lot Accounting: Fast live UI display uses simple Average Cost Basis; official IRS tax reports use First-In-First-Out (FIFO) lot matching in batch."
    ]
  },
  {
    "id": "rideshare_driver_onboard",
    "title": "Design Lyft / Driver Background Check OCR Verification",
    "badge": "📑",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100k Applications/Week • 10M Identity Documents",
    "qps": "500 Document Uploads/Sec • Sub-30s OCR & DMV Check",
    "difficulty": "Medium",
    "goal": "Build an asynchronous driver onboarding verification pipeline performing driver license OCR, DMV record checks, and fraud screening.",
    "availableNodes": [
      {
        "id": "applicant_app",
        "name": "Driver Onboarding Mobile App",
        "icon": "📱",
        "role": "Captures driver's license photo, vehicle registration, and selfie for biometric matching"
      },
      {
        "id": "secure_upload_gw",
        "name": "Encrypted Upload Gateway (mTLS)",
        "icon": "🛡️",
        "role": "Issues S3 pre-signed URLs with strict client-side encryption and payload hash validation"
      },
      {
        "id": "doc_vault_s3",
        "name": "PII Isolated Document Vault (S3)",
        "icon": "🗄️",
        "role": "Stores high-res document images encrypted with KMS customer-managed keys"
      },
      {
        "id": "ocr_vision_pipeline",
        "name": "OCR Vision Extraction Engine",
        "icon": "🔍",
        "role": "Extracts full name, license number, expiration date, and detects photo tampering using ML models"
      },
      {
        "id": "facial_match_svc",
        "name": "Liveness & Face Match Service",
        "icon": "👤",
        "role": "Compares selfie against driver's license portrait using deep facial embedding vectors"
      },
      {
        "id": "dmv_background_worker",
        "name": "DMV & Background Check Worker (Saga)",
        "icon": "⚙️",
        "role": "Orchestrates external third-party API checks (Checkr / State DMV driving records)"
      },
      {
        "id": "applicant_state_db",
        "name": "Onboarding State DB (PostgreSQL)",
        "icon": "📑",
        "role": "Tracks applicant verification lifecycle: SUBMITTED -> OCR_PASSED -> DMV_CLEARED -> ACTIVATED"
      }
    ],
    "correctSequence": [
      "applicant_app",
      "secure_upload_gw",
      "doc_vault_s3",
      "ocr_vision_pipeline",
      "facial_match_svc",
      "dmv_background_worker",
      "applicant_state_db"
    ],
    "explanation": "1. Driver snaps driver's license and selfie. 2. Gateway issues pre-signed S3 URL. 3. Document uploaded directly to encrypted PII S3 vault. 4. OCR Vision Engine extracts text data (DOB, License #). 5. Facial match verifies live selfie against license portrait. 6. Saga orchestrator queries State DMV and criminal background records. 7. Onboarding state DB commits approval and unlocks driver app.",
    "keyDesignTakeaways": [
      "PII Isolation Vault: Driver's licenses and SSNs must never live in general application databases; isolate raw images in an encrypted S3 vault with short-lived presigned access URLs.",
      "Asynchronous Saga Orchestration: DMV and criminal background checks can take from 30 seconds to 3 business days; model the onboarding flow as an event-driven Saga with webhooks.",
      "Client-Side Edge Document Cropping: Perform edge detection and glare validation on the mobile device before uploading to prevent high rejection rates due to blurry photos."
    ]
  },
  {
    "id": "anti_spam_email_filter",
    "title": "Design Gmail / Real-Time Anti-Spam & Phishing Filter",
    "badge": "📧",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "10B Emails/Day • Sub-Second Triage",
    "qps": "120,000 Inbound Emails/Sec",
    "difficulty": "Hard",
    "goal": "Design a high-volume email classification pipeline evaluating DKIM/SPF signatures, Bayes heuristics, and deep learning spam models.",
    "availableNodes": [
      {
        "id": "mta_inbound",
        "name": "Inbound SMTP Mail Transfer Agent (MTA)",
        "icon": "✉️",
        "role": "Accepts incoming SMTP email connections from external sending mail servers"
      },
      {
        "id": "dns_reputation",
        "name": "DNS Authentication & IP Reputation (SPF/DKIM/DMARC)",
        "icon": "🛡️",
        "role": "Validates cryptographic DKIM signatures, SPF IP records, and DMARC policies"
      },
      {
        "id": "ip_blocklist",
        "name": "Global Spamhaus / IP Blocklist Cache",
        "icon": "🚫",
        "role": "Instantly drops connections from known malware / spam bulletproof hosting IPs (<2ms)"
      },
      {
        "id": "mail_parser",
        "name": "MIME Parser & Attachment Sandbox",
        "icon": "📦",
        "role": "Extracts headers, body text, links, and detonates executable attachments in VM sandbox"
      },
      {
        "id": "spam_ml_classifier",
        "name": "Transformer Spam & Phishing Classifier",
        "icon": "🤖",
        "role": "Scores email content using Naive Bayes + DistilBERT NLP for phishing intent"
      },
      {
        "id": "user_reputation_db",
        "name": "User Whitelist & Contact Book Store",
        "icon": "🗄️",
        "role": "Checks if sender is in recipient address book to prevent false positive spam flags"
      },
      {
        "id": "mailbox_delivery",
        "name": "Mailbox Delivery Router (Inbox vs Spam Folder)",
        "icon": "📥",
        "role": "Delivers email to user Inbox or routes to Spam folder with warning banner"
      }
    ],
    "correctSequence": [
      "mta_inbound",
      "dns_reputation",
      "ip_blocklist",
      "mail_parser",
      "spam_ml_classifier",
      "user_reputation_db",
      "mailbox_delivery"
    ],
    "explanation": "1. External mail server connects via SMTP. 2. DNS verification checks SPF, DKIM signature, and DMARC alignment. 3. Real-time IP blocklist drops 80%+ of obvious botnet spam at connection time. 4. MIME parser extracts text and inspects hyperlinks against phishing URLs. 5. ML classifier evaluates text embeddings and suspicious urgency patterns. 6. Recipient contact book checked (emails from personal contacts are never flagged as spam). 7. Email routed to Inbox or Spam folder with warning badge.",
    "keyDesignTakeaways": [
      "Multi-Stage Filter Funnel: Drop 80% of spam cheaply at the perimeter using SPF/DKIM/IP reputation; only run expensive deep learning NLP models on the remaining 20% ambiguous emails.",
      "Sender Cryptographic Verification: Strict DMARC enforcement `p=reject` stops spoofed domain phishing (e.g. fake paypal.com emails) before parsing content.",
      "Contact Book Whitelisting: Always cross-reference recipient personal contacts; a message from a known friend should bypass spam filters to avoid embarrassing false positives."
    ]
  },
  {
    "id": "flight_tracker_radar",
    "title": "Design FlightRadar24 / Global ADS-B Aircraft Tracking",
    "badge": "✈️",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "200k Active Flights/Day • 50k ADS-B Receivers",
    "qps": "250,000 Position Messages/Sec • Sub-1s Live Map Update",
    "difficulty": "Medium",
    "goal": "Build a real-time global flight radar tracking aircraft positions using crowdsourced ADS-B receiver telemetry and geospatial indexes.",
    "availableNodes": [
      {
        "id": "adsb_receiver",
        "name": "Global ADS-B Ground Feeder Antenna",
        "icon": "📡",
        "role": "Receives 1090 MHz Mode S radio transmissions from commercial aircraft transponders"
      },
      {
        "id": "ingest_stream",
        "name": "Feeder Telemetry Ingest (TCP / Netty)",
        "icon": "⚡",
        "role": "Ingests raw binary ADS-B Mode S messages from 50k feeder antennas worldwide"
      },
      {
        "id": "decoder_cluster",
        "name": "ADS-B Message Decoder Fleet",
        "icon": "⚙️",
        "role": "Decodes ICAO 24-bit aircraft hex address, latitude, longitude, altitude, and ground speed"
      },
      {
        "id": "dedup_filter",
        "name": "Spatial Dedup & MLAT Multilateration Engine",
        "icon": "🎯",
        "role": "Deduplicates overlapping antenna feeds and calculates positions for non-ADS-B planes using time difference of arrival (TDOA)"
      },
      {
        "id": "live_spatial_cache",
        "name": "Global Aircraft Spatial Grid (Redis)",
        "icon": "🌐",
        "role": "Stores latest aircraft coordinate state in memory partitioned by geospatial quadkeys"
      },
      {
        "id": "map_tile_broadcaster",
        "name": "Geo-Tile Delta Broadcaster (WebSockets)",
        "icon": "📢",
        "role": "Pushes 1-second aircraft position deltas to connected radar map viewports"
      },
      {
        "id": "flight_history_db",
        "name": "Historical Flight Path DB (TimescaleDB / S3)",
        "icon": "🗄️",
        "role": "Stores compressed 4D flight trajectory coordinates for accident investigation and playback"
      }
    ],
    "correctSequence": [
      "adsb_receiver",
      "ingest_stream",
      "decoder_cluster",
      "dedup_filter",
      "live_spatial_cache",
      "map_tile_broadcaster",
      "flight_history_db"
    ],
    "explanation": "1. 50k ground receivers pick up 1090 MHz radio signals from passing aircraft. 2. Netty ingest servers accept binary frames. 3. Decoder fleet extracts ICAO hex code, lat/lng, altitude. 4. Dedup engine eliminates duplicate pings from multiple receivers and computes MLAT positions. 5. Redis stores active aircraft coordinates. 6. WebSocket broadcaster pushes coordinate updates to map clients. 7. Historical coordinates compressed into TimescaleDB.",
    "keyDesignTakeaways": [
      "Receiver Deduplication: A single airliner at 35,000 feet is visible to up to 20 different ground antennas simultaneously; deduplicate pings by `(icao_hex, timestamp_window)` to avoid processing redundant telemetry.",
      "Viewport-Based Delta Streaming: Do not stream 200,000 global planes to every user phone; stream only aircraft within the user's current zoom viewport and bounding box.",
      "MLAT (Multilateration) Positioning: For older aircraft without GPS ADS-B, compute coordinates using Time Difference of Arrival (TDOA) across 4 or more synchronized ground receivers."
    ]
  },
  {
    "id": "automated_parking_gate",
    "title": "Design Smart Parking / Automated ANPR License Plate Gate",
    "badge": "🅿️",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "5,000 Parking Garages • 500k Daily Parking Sessions",
    "qps": "2,000 Gate Actions/Sec • Sub-500ms Barrier Opening",
    "difficulty": "Medium",
    "goal": "Design an automated parking barrier control system using edge camera ANPR optical character recognition and contactless payment processing.",
    "availableNodes": [
      {
        "id": "anpr_camera",
        "name": "Automatic Number Plate Camera (ANPR)",
        "icon": "📷",
        "role": "Captures vehicle entry/exit image and executes edge OCR to extract license plate string"
      },
      {
        "id": "local_gate_controller",
        "name": "Local Gate PLC Microcontroller",
        "icon": "🚧",
        "role": "Controls physical boom barrier arm; triggers open/close electrical relay with sub-50ms latency"
      },
      {
        "id": "edge_auth_cache",
        "name": "Edge Local Allowlist Cache (SQLite)",
        "icon": "💾",
        "role": "Caches registered permit plates locally for instant gate opening even when internet is down"
      },
      {
        "id": "gate_cloud_gw",
        "name": "Cloud Gate Gateway (mTLS)",
        "icon": "⚡",
        "role": "Authenticates garage controllers; synchronizes parking sessions and payment events"
      },
      {
        "id": "session_engine",
        "name": "Parking Session Lifecycle Engine",
        "icon": "⚙️",
        "role": "Calculates stay duration, applies garage rate tier (e.g. $5/hr, max $30), and checks validation passes"
      },
      {
        "id": "payment_auto_charge",
        "name": "Automatic Payment Worker (Stripe)",
        "icon": "💳",
        "role": "Charges registered vehicle's credit card upon exit and opens gate seamlessly"
      },
      {
        "id": "parking_db",
        "name": "Parking Ledger Database (PostgreSQL)",
        "icon": "🗄️",
        "role": "Maintains persistent session state, audit photos, and historical garage revenue"
      }
    ],
    "correctSequence": [
      "anpr_camera",
      "local_gate_controller",
      "edge_auth_cache",
      "gate_cloud_gw",
      "session_engine",
      "payment_auto_charge",
      "parking_db"
    ],
    "explanation": "1. Vehicle approaches barrier; ANPR camera reads license plate. 2. Local Gate PLC checks local SQLite cache: if monthly permit holder, barrier opens in <200ms. 3. If transient parker, gate notifies cloud. 4. Cloud session engine starts parking session. 5. On exit, camera scans plate, calculates parking fee based on duration. 6. Payment worker auto-charges saved credit card. 7. Physical barrier lifts and session marked PAID in DB.",
    "keyDesignTakeaways": [
      "Offline Edge Fallback for Physical Gates: A physical parking barrier must never remain closed because cloud internet dropped; maintain an offline permit allowlist on the local gateway to let registered parkers in/out.",
      "Sub-500ms Barrier Lift Latency: Drivers expect seamless drive-through without coming to a complete stop; optimize OCR and authorization to execute in <500ms.",
      "Optical Character Ambiguity Handling: License plate OCR can confuse '0' and 'O' or '8' and 'B'; use fuzzy matching against registered subscriber plates with vehicle make/color verification."
    ]
  },
  {
    "id": "hadoop_hdfs_storage",
    "title": "Design Hadoop HDFS / Distributed Big Data File System",
    "badge": "📁",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Petabytes Data • 1 Billion Files • 128MB Block Slicing",
    "qps": "50,000 Block Ops/Sec • NameNode In-Memory Namespace",
    "difficulty": "Staff+",
    "goal": "Construct a distributed file system architecture with NameNode active/standby metadata journaling and block replication across DataNodes.",
    "availableNodes": [
      {
        "id": "hdfs_client",
        "name": "MapReduce / Spark / HDFS Client",
        "icon": "💻",
        "role": "Requests block locations from NameNode and streams 128MB data blocks directly to DataNodes"
      },
      {
        "id": "active_namenode",
        "name": "Active NameNode (In-Memory Namespace)",
        "icon": "👑",
        "role": "Maintains entire directory tree and block-to-DataNode mappings in RAM for sub-millisecond lookups"
      },
      {
        "id": "standby_namenode_qjm",
        "name": "Standby NameNode & Quorum Journal Manager (QJM)",
        "icon": "👥",
        "role": "Replicates edit logs across majority journal nodes; performs active failover with zero metadata loss"
      },
      {
        "id": "datanode_fleet_rack",
        "name": "DataNode Fleet (Commodity HDDs)",
        "icon": "💾",
        "role": "Stores raw 128MB block files on local ext4/XFS filesystems across server racks"
      },
      {
        "id": "rack_aware_pipeline",
        "name": "Rack-Aware Replication Pipeline (3x)",
        "icon": "📦",
        "role": "Streams blocks through 3-tier pipeline: Node 1 (Local), Node 2 (Same Rack), Node 3 (Remote Rack)"
      },
      {
        "id": "datanode_heartbeat_bus",
        "name": "Heartbeat & Block Report Bus",
        "icon": "💓",
        "role": "DataNodes send periodic heartbeats (3s) and full block reports (6h) to NameNode"
      },
      {
        "id": "balancer_daemon",
        "name": "HDFS Balancer & Decommission Daemon",
        "icon": "⚖️",
        "role": "Rebalances block distribution across underutilized and overutilized disks in the background"
      }
    ],
    "correctSequence": [
      "hdfs_client",
      "active_namenode",
      "standby_namenode_qjm",
      "datanode_fleet_rack",
      "rack_aware_pipeline",
      "datanode_heartbeat_bus",
      "balancer_daemon"
    ],
    "explanation": "1. Client asks NameNode for file block locations. 2. NameNode returns DataNode IPs from RAM. 3. Client writes directly to DataNode 1. 4. DataNode 1 streams block to DataNode 2 (same rack) and DataNode 3 (different rack) using rack awareness. 5. Standby NameNode syncs edits via QJM. 6. DataNodes send heartbeats every 3s. 7. Balancer rebalances disk utilization across racks.",
    "keyDesignTakeaways": [
      "Large 128MB Block Size: Traditional file systems use 4KB blocks; HDFS uses 128MB blocks to minimize NameNode memory overhead (150 bytes per block in RAM) and optimize sequential disk streaming.",
      "Rack-Aware Placement Policy (2 Racks, 3 Replicas): Place Replica 1 on local node, Replica 2 on a different node in the same rack, and Replica 3 on a node in a different rack; this survives rack switch failures while minimizing cross-rack network traffic.",
      "Write-Once, Read-Many (WORM): HDFS does not support arbitrary in-place random writes; files are strictly append-only, simplifying concurrency and cache consistency."
    ]
  },
  {
    "id": "online_survey_polling",
    "title": "Design Slido / Live Interactive Conference Polling",
    "badge": "📊",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "100k Simultaneous Attendees • 10k Votes/Sec Peak",
    "qps": "10,000 Vote Submissions/Sec • Sub-200ms Chart Bar Animation",
    "difficulty": "Medium",
    "goal": "Design a real-time live audience polling engine using Redis HyperLogLog for unique vote counting and WebSocket live graph broadcasting.",
    "availableNodes": [
      {
        "id": "audience_client",
        "name": "Audience Mobile Web App",
        "icon": "📱",
        "role": "Renders live poll question and submits vote option (e.g. Option B) via WebSocket"
      },
      {
        "id": "vote_gateway",
        "name": "Vote Ingestion Gateway (Netty)",
        "icon": "⚡",
        "role": "Terminates audience sockets; enforces voter fingerprinting and rate limits"
      },
      {
        "id": "dedup_token_store",
        "name": "Voter Dedup Store (Redis)",
        "icon": "🔒",
        "role": "Enforces single-vote invariant per participant: `SETNX vote:{pollId}:{userId} optionId`"
      },
      {
        "id": "atomic_counter",
        "name": "Real-Time Atomic Counter (Redis HINCRBY)",
        "icon": "📊",
        "role": "Increments vote option count in RAM in <1ms: `HINCRBY poll:{id} option_b 1`"
      },
      {
        "id": "delta_aggregator",
        "name": "Tumbling Delta Aggregator (100ms)",
        "icon": "⏱️",
        "role": "Batches vote deltas every 100ms to prevent flooding WebSocket clients with individual increments"
      },
      {
        "id": "presenter_display",
        "name": "Presenter Live Screen (WebSocket)",
        "icon": "🖥️",
        "role": "Animates bar charts and percentage shifts in real time on the main conference hall projector"
      },
      {
        "id": "survey_db",
        "name": "Survey Results Database (PostgreSQL)",
        "icon": "🗄️",
        "role": "Persists final poll totals and audit logs upon poll closure"
      }
    ],
    "correctSequence": [
      "audience_client",
      "vote_gateway",
      "dedup_token_store",
      "atomic_counter",
      "delta_aggregator",
      "presenter_display",
      "survey_db"
    ],
    "explanation": "1. Speaker asks 'Which cloud provider do you use?'. 2. 10,000 attendees submit choices simultaneously. 3. Gateway checks rate limit. 4. Redis `SETNX` ensures each user only votes once. 5. Redis `HINCRBY` tallies votes in memory. 6. Tumbling Delta Aggregator packages count deltas every 100ms. 7. WebSockets broadcast percentage updates to the presenter's stage screen in smooth 60 FPS animations.",
    "keyDesignTakeaways": [
      "Tumbling Delta Aggregation: Do not push 10,000 WebSocket messages per second to the presenter display; batch counter changes into 100ms aggregated delta frames so the frontend chart animates smoothly.",
      "Atomic Deduplication with `SETNX`: Use `SETNX voter:{poll}:{ip_or_cookie} 1` to atomically verify that a participant hasn't already voted without querying slow database tables.",
      "Write-in Memory, Flush on Close: Live polls last only 2 minutes; maintain active tallies exclusively in Redis memory, writing to PostgreSQL only when the speaker taps 'Close Poll'."
    ]
  },
  {
    "id": "podcasts_distribution",
    "title": "Design Apple Podcasts / Global RSS Audio Ingestion",
    "badge": "🎙️",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "5M Podcast Shows • 100M Episodes",
    "qps": "50,000 RSS Feed Polls/Sec • 100 Gbps Audio Egress",
    "difficulty": "Medium",
    "goal": "Build a high-volume podcast feed aggregator with polling schedules, audio chapter indexing, and global CDN caching.",
    "availableNodes": [
      {
        "id": "creator_rss",
        "name": "Podcast Creator RSS Feed Host",
        "icon": "🎙️",
        "role": "Publishes standard XML RSS 2.0 / Atom feed with MP3 enclosure URLs"
      },
      {
        "id": "crawler_poller",
        "name": "Distributed RSS Crawler & Poller",
        "icon": "🔄",
        "role": "Polls 5M external RSS feeds with adaptive frequency and HTTP ETag / If-Modified-Since"
      },
      {
        "id": "xml_parser",
        "name": "XML Episode Parser & Sanitizer",
        "icon": "⚙️",
        "role": "Extracts episode audio enclosures, show notes, and chapter markers"
      },
      {
        "id": "episode_catalog_db",
        "name": "Podcast Episode Catalog DB (Postgres)",
        "icon": "🗄️",
        "role": "Stores show metadata, episode release dates, and transcripts with versioning"
      },
      {
        "id": "podcast_search_index",
        "name": "Full-Text Search Index (Elasticsearch)",
        "icon": "🔍",
        "role": "Indexes show titles, episode descriptions, and transcribed topics for discovery"
      },
      {
        "id": "global_audio_cdn",
        "name": "Podcast Audio CDN (Cloudflare / Akamai)",
        "icon": "☁️",
        "role": "Caches popular episode MP3 audio enclosures at edge nodes across the globe"
      },
      {
        "id": "listener_player",
        "name": "Podcast Listener Mobile App",
        "icon": "🎧",
        "role": "Downloads or streams MP3 episodes with range-request resume support"
      }
    ],
    "correctSequence": [
      "creator_rss",
      "crawler_poller",
      "xml_parser",
      "episode_catalog_db",
      "podcast_search_index",
      "global_audio_cdn",
      "listener_player"
    ],
    "explanation": "1. Creator publishes podcast episode on their hosting provider (Libsyn, Buzzsprout, Spotify for Podcasters). 2. Crawler fleet polls external RSS feeds using adaptive scheduling (frequently updated shows polled every 15 min, dormant shows daily). 3. Uses HTTP 304 Not Modified headers with ETags to avoid re-parsing unchanged XML feeds. 4. XML Parser extracts audio MP3 enclosure URLs and show notes. 5. Metadata saved to PostgreSQL; new episodes indexed into Elasticsearch. 6. Audio CDN caches MP3 files at edge nodes. 7. Listener app streams or downloads audio with HTTP Byte Range resume.",
    "keyDesignTakeaways": [
      "Conditional HTTP Requests (ETag / If-Modified-Since): 95%+ of RSS feed polls return HTTP 304 Not Modified, saving 90% of crawler bandwidth and processing power.",
      "Adaptive Crawl Scheduling: Poll active daily news shows (The Daily) every 10 minutes, while polling shows that haven't published in 6 months only once every 3 days.",
      "HTTP 206 Partial Content (Byte Range Requests): Podcast audio players must support HTTP Byte-Range requests (`Range: bytes=1048576-2097152`) to allow instant scrubbing and resuming interrupted downloads."
    ]
  },
  {
    "id": "car_rental_reservation",
    "title": "Design Hertz / Global Car Rental Fleet Reservation",
    "badge": "🚗",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "1M Vehicles • 10,000 Locations Worldwide",
    "qps": "5,000 Search QPS • 500 Bookings/Sec",
    "difficulty": "Medium",
    "goal": "Design an availability reservation system managing vehicle categories, airport location inventories, and insurance add-ons.",
    "availableNodes": [
      {
        "id": "renter_app",
        "name": "Renter Mobile / Web App",
        "icon": "🚗",
        "role": "Searches car categories (SUV, Sedan) by pickup location and date range"
      },
      {
        "id": "rental_gw",
        "name": "Rental API Gateway & Auth Proxy",
        "icon": "🛡️",
        "role": "Validates user loyalty tier, driver license verification, and rates limits"
      },
      {
        "id": "fleet_availability_cache",
        "name": "Fleet Category Availability Cache (Redis)",
        "icon": "⚡",
        "role": "Tracks available vehicle counts per car category per airport location in RAM"
      },
      {
        "id": "reservation_service",
        "name": "Reservation Orchestrator Service",
        "icon": "⚙️",
        "role": "Manages car category reservation state, insurance add-ons, and pricing rules"
      },
      {
        "id": "fleet_state_db",
        "name": "Fleet Management DB (PostgreSQL)",
        "icon": "💾",
        "role": "Maintains physical vehicle lifecycle (Available, Rented, In Maintenance, Cleaned)"
      },
      {
        "id": "payment_escrow",
        "name": "Payment Authorization & Security Deposit Hold",
        "icon": "💳",
        "role": "Authorizes rental charge and places $500 security deposit hold on card"
      },
      {
        "id": "keyless_gate_service",
        "name": "Connected Vehicle / FastLane Gate Access",
        "icon": "📱",
        "role": "Unlocks car doors via Bluetooth/NFC and opens airport exit boom gate"
      }
    ],
    "correctSequence": [
      "renter_app",
      "rental_gw",
      "fleet_availability_cache",
      "reservation_service",
      "fleet_state_db",
      "payment_escrow",
      "keyless_gate_service"
    ],
    "explanation": "1. Customer selects Airport, dates, and car category (e.g. Standard SUV). 2. Gateway checks availability cache in Redis (<5ms). 3. Reservation service creates booking hold for car category (car rentals book by category, not specific VIN). 4. Rental DB commits reservation with optimistic locking. 5. Credit card authorized for rental charge plus $500 security deposit hold. 6. Upon arrival at airport, system assigns specific physical VIN. 7. Connected vehicle gate service verifies reservation and unlocks car.",
    "keyDesignTakeaways": [
      "Category-Level Booking vs Specific Vehicle (VIN) Booking: Hotels and rental cars book by category (Midsize SUV) rather than individual vehicle; assigning specific VINs occurs upon airport arrival, smoothing inventory utilization.",
      "Overbooking Buffer Management: Rental car companies model no-show rates (typically 10-15%); allow deliberate 5% overbooking during peak seasons with automated re-accommodation upgrades to Luxury class.",
      "Two-Phase Payment (Pre-Auth vs Capture): Never charge customer cards immediately for rental cars; place an authorization hold (Rental fee + $500 incidentals), capturing the actual funds only upon car return with fuel/toll reconciliation."
    ]
  },
  {
    "id": "notion_block_editor",
    "title": "Design Notion / Block-Based Collaborative Workspace",
    "badge": "📝",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "30M Active Users • 500M Blocks Created/Day",
    "qps": "50,000 Block Mutations/Sec • Sub-50ms Block Tree Sync",
    "difficulty": "Hard",
    "goal": "Construct a block-level collaborative document database using tree-structured page hierarchies and real-time transaction broadcast.",
    "availableNodes": [
      {
        "id": "block_client",
        "name": "Notion Client (React / Electron)",
        "icon": "🧱",
        "role": "Renders tree of draggable block nodes; performs optimistic local mutations instantly in UI"
      },
      {
        "id": "sync_edge_router",
        "name": "Sync Edge Gateway (WebSocket)",
        "icon": "⚡",
        "role": "Maintains persistent socket session; groups block transactions into atomic batches"
      },
      {
        "id": "page_coordinator",
        "name": "Page Tree Coordinator (Actor)",
        "icon": "👑",
        "role": "Coordinates block tree hierarchies; validates parent-child pointer changes and resolves concurrent moves"
      },
      {
        "id": "block_cache_cluster",
        "name": "Block Graph Cache (Redis Cluster)",
        "icon": "🔴",
        "role": "Caches full block objects and page child-pointer arrays in RAM for <2ms hydration"
      },
      {
        "id": "block_datastore",
        "name": "Sharded Block Store (PostgreSQL / Vitess)",
        "icon": "🗄️",
        "role": "Stores normalized block records: `(id, parent_id, type, content_json, version)`"
      },
      {
        "id": "search_indexer",
        "name": "Full-Text Block Indexer (Elasticsearch)",
        "icon": "🔍",
        "role": "Asynchronously indexes text content of blocks for fast workspace-wide search"
      },
      {
        "id": "version_log",
        "name": "Block Revision History DB (S3 / ScyllaDB)",
        "icon": "📑",
        "role": "Records immutable sequence of block mutations for workspace rollback and audit trails"
      }
    ],
    "correctSequence": [
      "block_client",
      "sync_edge_router",
      "page_coordinator",
      "block_cache_cluster",
      "block_datastore",
      "search_indexer",
      "version_log"
    ],
    "explanation": "1. User drags block to reorder. 2. WebSocket gateway receives transaction batch. 3. Page tree coordinator updates parent pointer and child ID array atomically. 4. Updated block cached in Redis. 5. Normalized block record committed to sharded PostgreSQL. 6. Content indexed in Elasticsearch for fast workspace search. 7. Mutation history logged to version log for time-travel rollback.",
    "keyDesignTakeaways": [
      "Block as Atomic Unit of Storage: Notion treats everything (paragraphs, images, tables, pages) as a generic 'Block' entity with a parent pointer and ordered array of child pointers (`content: [id1, id2]`).",
      "Transaction Batching & Local Optimism: Users make dozens of edits in seconds; batch transactions locally on the client and sync to the server in bursts of micro-transactions.",
      "Cycle Detection in Block Trees: When users drag and drop nested pages, detect and reject circular parenting relationships (`Page A inside Page B inside Page A`) before committing."
    ]
  },
  {
    "id": "supply_chain_track",
    "title": "Design DHL / Global Shipping Container Milestone Tracker",
    "badge": "🚢",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "10M Shipping Containers • 50,000 Ocean Cargo Vessels",
    "qps": "15,000 Ingestion Events/Sec • Satellite AIS & IoT Geofence",
    "difficulty": "Medium",
    "goal": "Build an IoT and customs milestone tracking pipeline calculating estimated time of arrival (ETA) predictions based on weather data.",
    "availableNodes": [
      {
        "id": "iot_satellite_tracker",
        "name": "Container Satellite & Cellular IoT Tracker",
        "icon": "🛰️",
        "role": "Transmits container GPS, internal reefer temperature, and door-opening sensors via Iridium satellite / 5G"
      },
      {
        "id": "ais_marine_ingest",
        "name": "Global Marine AIS Vessel Ingest",
        "icon": "🚢",
        "role": "Ingests real-time Automatic Identification System (AIS) satellite pings for 50k container ships"
      },
      {
        "id": "telemetry_bus",
        "name": "Supply Chain Event Stream (Kafka)",
        "icon": "⚡",
        "role": "Buffers sensor streams partitioned by `container_id` and `vessel_imo_number`"
      },
      {
        "id": "geofence_engine",
        "name": "Port Geofence & Milestone Detector",
        "icon": "🌐",
        "role": "Detects vessel port arrivals, canal passages (Suez/Panama), and customs clearance checkpoints"
      },
      {
        "id": "cold_chain_monitor",
        "name": "Reefer Cold-Chain Compliance Monitor",
        "icon": "❄️",
        "role": "Evaluates temperature excursions (e.g. pharmaceutical vaccines rising above -20C) and raises alarms"
      },
      {
        "id": "container_cache",
        "name": "Live Container Location Cache (Redis)",
        "icon": "🔴",
        "role": "Provides instant container ETA, current marine coordinates, and status lookups"
      },
      {
        "id": "customs_ledger_db",
        "name": "Customs Manifest Ledger (PostgreSQL)",
        "icon": "📑",
        "role": "Maintains immutable Bill of Lading (B/L) manifests and customs declaration documentation"
      }
    ],
    "correctSequence": [
      "iot_satellite_tracker",
      "ais_marine_ingest",
      "telemetry_bus",
      "geofence_engine",
      "cold_chain_monitor",
      "container_cache",
      "customs_ledger_db"
    ],
    "explanation": "1. Satellite tracker on shipping container emits GPS and temperature. 2. Marine AIS data tracks ship location. 3. Kafka buffers events. 4. Geofence engine detects when ship crosses port boundary. 5. Cold-chain monitor verifies temperature compliance. 6. Redis stores current location and ETA for shippers. 7. Customs ledger records official Bill of Lading manifests.",
    "keyDesignTakeaways": [
      "Vessel Association Mapping: Containers inside a ship hold cannot transmit satellite signals; associate the container with the vessel's AIS transponder while at sea, and resume container-level tracking at port.",
      "Polygonal Geofence Traversal: Index port boundaries using spatial polygons (Uber H3 / PostGIS) to automatically trigger 'ARRIVED_AT_PORT' events without human scanning.",
      "Cold-Chain Compliance Alarms: Pharmaceutical and food cargo require temperature audit logging; emit alerts within 60 seconds of a refrigerated container (reefer) failure."
    ]
  },
  {
    "id": "microservices_mesh_envoy",
    "title": "Design Istio / Kubernetes Microservice Mesh Ingress",
    "badge": "🕸️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10,000 Pods • 100k RPCs/Sec • Transparent Sidecar Interception",
    "qps": "100,000 Service-to-Service RPCs/Sec • Sub-1ms Added Sidecar Latency",
    "difficulty": "Staff+",
    "goal": "Design a cloud-native service mesh control plane (Istio Pilot) dynamically configuring Envoy sidecar proxies with mTLS and telemetry.",
    "availableNodes": [
      {
        "id": "app_pod_container",
        "name": "Application Container (K8s Pod)",
        "icon": "💻",
        "role": "Makes standard outbound HTTP/gRPC call (e.g. `http://inventory-service/items/42`) without mesh awareness"
      },
      {
        "id": "iptables_ebpf_redirect",
        "name": "iptables / eBPF Transparent Traffic Redirection",
        "icon": "⚡",
        "role": "Intercepts all pod ingress/egress TCP traffic; redirects silently to local sidecar proxy (port 15001/15006)"
      },
      {
        "id": "envoy_sidecar_proxy",
        "name": "Envoy Sidecar Proxy (C++ Event Loop)",
        "icon": "🛡️",
        "role": "Non-blocking proxy; enforces mTLS, dynamic traffic splitting, circuit breaking, and distributed tracing"
      },
      {
        "id": "istiod_control_plane",
        "name": "Istio Control Plane (Istiod)",
        "icon": "👑",
        "role": "Translates Kubernetes Services and VirtualServices into Envoy xDS configuration; pushes updates over gRPC"
      },
      {
        "id": "mtls_citadel_ca",
        "name": "Mesh Certificate Authority (Citadel)",
        "icon": "🔒",
        "role": "Issues short-lived X.509 cryptographic identities to pods; rotates keys every 24 hours automatically"
      },
      {
        "id": "traffic_splitter_circuit",
        "name": "Canary Router & Outlier Detection Circuit Breaker",
        "icon": "🔀",
        "role": "Splits traffic (90% v1, 10% v2); trips circuit breaker if target pod returns 5 consecutive 503 errors"
      },
      {
        "id": "telemetry_kiali_jaeger",
        "name": "Mesh Telemetry & Service Graph (Kiali / Prometheus)",
        "icon": "📊",
        "role": "Renders real-time topology graph of inter-service traffic, error rates, and p99 latencies"
      }
    ],
    "correctSequence": [
      "app_pod_container",
      "iptables_ebpf_redirect",
      "envoy_sidecar_proxy",
      "istiod_control_plane",
      "mtls_citadel_ca",
      "traffic_splitter_circuit",
      "telemetry_kiali_jaeger"
    ],
    "explanation": "1. App calls `inventory-service`. 2. iptables/eBPF intercepts packet and redirects to local Envoy sidecar. 3. Envoy terminates client socket, wraps call in mutual TLS (mTLS). 4. Istiod configures routing via xDS. 5. Citadel issues rotating certificates. 6. Traffic splitter applies canary rules and trips circuit breaker if backend fails. 7. Mesh telemetry exported to Prometheus and Kiali for live topology visualization.",
    "keyDesignTakeaways": [
      "Transparent Sidecar Interception (Zero Code Changes): Developers write standard HTTP calls; iptables or eBPF redirects traffic into the Envoy sidecar, handling security and retries without changing application code.",
      "Automatic Mutual TLS (mTLS): Sidecar-to-sidecar connections are automatically encrypted with mTLS; Citadel rotates pod certificates daily without developer involvement.",
      "Circuit Breaking & Outlier Detection: If a single pod in an upstream cluster starts returning 5xx errors, Envoy ejects that unhealthy pod from the load balancing pool for 30 seconds, preventing cascading cluster collapse."
    ]
  },
  {
    "id": "continuous_delivery_argo",
    "title": "Design ArgoCD / Declarative GitOps Deployment Controller",
    "badge": "🚀",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "500 Kubernetes Clusters • 50,000 Microservice Applications",
    "qps": "10,000 Git Reconciliations/Minute • Sub-30s Automated Sync",
    "difficulty": "Hard",
    "goal": "Build a GitOps continuous delivery controller that continuously reconciles live Kubernetes cluster state with Git repositories.",
    "availableNodes": [
      {
        "id": "git_repo_source",
        "name": "Git Source of Truth (GitHub / GitLab)",
        "icon": "🐙",
        "role": "Stores declarative Kubernetes manifests, Helm charts, and Kustomize overlays in versioned Git commits"
      },
      {
        "id": "git_webhook_receiver",
        "name": "ArgoCD Webhook Receiver",
        "icon": "⚡",
        "role": "Receives Git `push` webhooks; triggers immediate reconciliation loop without waiting for polling intervals"
      },
      {
        "id": "repo_server_renderer",
        "name": "Manifest Rendering Engine (Argo Repo Server)",
        "icon": "⚙️",
        "role": "Clones Git commit, runs `helm template` or `kustomize build`, and generates raw target manifests"
      },
      {
        "id": "application_controller",
        "name": "Application State Reconciliation Controller",
        "icon": "👑",
        "role": "Compares Desired State (from Git) with Live State (from Kubernetes cluster); detects drift"
      },
      {
        "id": "k8s_cluster_api",
        "name": "Target Kubernetes API Server Fleet",
        "icon": "☸️",
        "role": "Receives applied resource manifests (Deployments, Services, ConfigMaps) via mTLS"
      },
      {
        "id": "sync_wave_orchestrator",
        "name": "Sync Waves & Post-Sync Hook Runner",
        "icon": "🌊",
        "role": "Orchestrates phased deployments (Wave 1: DB Migration, Wave 2: Backend, Wave 3: Frontend)"
      },
      {
        "id": "argocd_ui_dashboard",
        "name": "ArgoCD Web UI & Audit Dashboard",
        "icon": "📊",
        "role": "Visualizes application sync status (`Synced` / `OutOfSync`), resource trees, and diff highlights"
      }
    ],
    "correctSequence": [
      "git_repo_source",
      "git_webhook_receiver",
      "repo_server_renderer",
      "application_controller",
      "k8s_cluster_api",
      "sync_wave_orchestrator",
      "argocd_ui_dashboard"
    ],
    "explanation": "1. Developer merges PR to `main` branch. 2. GitHub sends webhook to ArgoCD. 3. Repo Server renders Helm/Kustomize manifests. 4. Application Controller compares Git state vs live K8s state. 5. Sync waves apply DB migrations first, then update Deployments via K8s API. 6. Post-sync hooks run health checks. 7. ArgoCD UI marks application `Synced` and `Healthy`.",
    "keyDesignTakeaways": [
      "Git as Single Source of Truth (GitOps): Production is never modified via `kubectl apply`; all desired state lives in Git, making every change versioned, auditable, and reversable via `git revert`.",
      "Continuous Automated Drift Reconciliation: If a rogue engineer edits a K8s resource directly via kubectl, the controller detects drift (`OutOfSync`) and automatically reconciles live state back to Git.",
      "Sync Waves and Phases: Deployments are not flat; use Sync Waves (`argocd.argoproj.io/sync-wave: \"1\"`) to run database migrations before rolling out new application container pods."
    ]
  },
  {
    "id": "telecom_cell_handoff",
    "title": "Design 5G / High-Speed Cellular Base Station Handoff",
    "badge": "📡",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100k gNodeB Base Stations • 500km/h High-Speed Train • Sub-50ms Handoff",
    "qps": "500,000 Measurement Reports/Sec • Zero Dropped Call Latency",
    "difficulty": "Staff+",
    "goal": "Design a mobile telecom mobility management entity (MME) coordinating seamless voice and data connection handoffs across 5G cell towers.",
    "availableNodes": [
      {
        "id": "mobile_ue_handset",
        "name": "User Mobile Handset (5G UE)",
        "icon": "📱",
        "role": "Measures Reference Signal Received Power (RSRP) from serving and neighboring cells; emits Measurement Report"
      },
      {
        "id": "source_gnodeb",
        "name": "Source 5G Base Station (gNodeB)",
        "icon": "🗼",
        "role": "Serving base station; evaluates RSRP triggers (A3 Event: Neighbor becomes offset better than serving)"
      },
      {
        "id": "x2_xn_direct_interface",
        "name": "Xn / X2 Direct Inter-Base Station Link",
        "icon": "⚡",
        "role": "Direct fiber connection between adjacent base stations; exchanges handoff request and packet forwarding"
      },
      {
        "id": "target_gnodeb",
        "name": "Target 5G Base Station (gNodeB)",
        "icon": "📡",
        "role": "Allocates radio resources, prepares C-RNTI, and returns Handover Request Acknowledge"
      },
      {
        "id": "packet_data_forwarder",
        "name": "Lossless Downlink Packet Forwarder",
        "icon": "📦",
        "role": "Forwards in-flight downlink packets from source to target base station to prevent packet loss during switchover"
      },
      {
        "id": "upf_5g_core_gateway",
        "name": "5G Core User Plane Function (UPF)",
        "icon": "🌐",
        "role": "Switches GTP-U tunnel endpoint from source gNodeB to target gNodeB upon path switch acknowledgment"
      },
      {
        "id": "handoff_analytics_bus",
        "name": "Cellular Performance Stream (Kafka)",
        "icon": "📊",
        "role": "Logs handoff success rates, ping-pong oscillation events, and radio link failures (RLF)"
      }
    ],
    "correctSequence": [
      "mobile_ue_handset",
      "source_gnodeb",
      "x2_xn_direct_interface",
      "target_gnodeb",
      "packet_data_forwarder",
      "upf_5g_core_gateway",
      "handoff_analytics_bus"
    ],
    "explanation": "1. Bullet train passenger moves at 300km/h; phone detects Target cell signal stronger than Source (Event A3). 2. Source gNodeB decides handoff is required. 3. Source sends Handover Request directly to Target over Xn interface. 4. Target reserves radio channels. 5. Handset executes radio switchover (<30ms). 6. In-flight packets forwarded over Xn link (zero data loss). 7. 5G Core UPF switches user plane tunnel to Target.",
    "keyDesignTakeaways": [
      "Direct Xn Interface Handoff vs Core Network: Routing handoff commands through the central 5G Core adds 50-100ms latency; base stations communicate directly over fiber Xn interfaces to complete handoffs in <30ms.",
      "Event A3 Hysteresis & Time-To-Trigger (TTT): To prevent 'ping-pong' handoff oscillations where a phone rapidly bounces between two towers, require neighbor signal to be `X dB` better for at least `Y milliseconds`.",
      "Lossless Downlink Packet Forwarding: While the phone switches radio frequencies (10-30ms), source gNodeB buffers and forwards incoming internet packets to the target gNodeB over the Xn interface so zero TCP packets are lost."
    ]
  },
  {
    "id": "multiplayer_elo_match",
    "title": "Design Valorant / Skill-Based ELO Matchmaking Queue",
    "badge": "🎯",
    "category": "real_time",
    "categoryLabel": "Real-Time & Streaming",
    "scaleMetric": "15M Daily Active Players • 500k Simultaneous Matches",
    "qps": "50,000 Queue Actions/Sec • Sub-20s Match Pairing Time",
    "difficulty": "Hard",
    "goal": "Construct a low-latency game matchmaking queue optimizing player rank (MMR/ELO), ping latency (<30ms), and group party sizes.",
    "availableNodes": [
      {
        "id": "gamer_client",
        "name": "Game Client (PC / Console)",
        "icon": "🎮",
        "role": "Submits queue entry request with party members (1-5 players), chosen role, and game region"
      },
      {
        "id": "match_gateway",
        "name": "Matchmaking Edge Gateway",
        "icon": "⚡",
        "role": "Authenticates game client, verifies party ranking eligibility, and enforces anti-smurf restrictions"
      },
      {
        "id": "ticket_store",
        "name": "Match Ticket Store (Redis Cluster)",
        "icon": "🎟️",
        "role": "Creates matchmaking ticket with party MMR, latency ping matrix to game server regions, and wait timestamp"
      },
      {
        "id": "matchmaker_pool",
        "name": "Multiplayer Matchmaker Pool (Go / Akka)",
        "icon": "🎯",
        "role": "Executes 5v5 team balancing algorithm: expands MMR search radius over time, matches party sizes (5-stack vs 5-stack)"
      },
      {
        "id": "game_server_allocator",
        "name": "Dedicated Game Server Allocator (Agones / K8s)",
        "icon": "🖥️",
        "role": "Spins up dedicated low-ping UDP game server instance on optimal cloud datacenter region"
      },
      {
        "id": "match_notification",
        "name": "Match Ready Dispatcher (WebSocket)",
        "icon": "🔔",
        "role": "Pushes 10-player 'Match Found - Accept/Decline' popup prompt to all clients simultaneously"
      },
      {
        "id": "match_history_db",
        "name": "Match History & Player MMR DB (Cassandra)",
        "icon": "🗄️",
        "role": "Stores post-match combat stats, round history, and updated hidden MMR / visual rank"
      }
    ],
    "correctSequence": [
      "gamer_client",
      "match_gateway",
      "ticket_store",
      "matchmaker_pool",
      "game_server_allocator",
      "match_notification",
      "match_history_db"
    ],
    "explanation": "1. 5-player party queues for Competitive. 2. Gateway verifies rank spread (prevents Iron queuing with Radiant). 3. Redis registers ticket with party MMR and latency ping matrix to datacenters. 4. Matchmaker balances two 5-player teams with close average MMR and fair latency. 5. Server allocator (Agones) provisions dedicated game server. 6. Dispatcher sends 'Match Found' prompt. 7. Upon match completion, combat stats and MMR adjustments recorded in Cassandra.",
    "keyDesignTakeaways": [
      "Expanding Search Window Queue: Matchmaking is a trade-off between match quality (skill fairness) and queue time; start with +/- 25 MMR, expanding by 10 MMR every 15 seconds of waiting.",
      "Party-Size Mirroring (Premade vs Premade): Matching a coordinated 5-player premade against 5 solo queue players leads to lopsided matches; matchmaking algorithms must mirror party configurations or apply an MMR coordination penalty.",
      "Multi-Region Latency Intersection: Players submit ping times to candidate datacenters (US-East: 20ms, US-West: 75ms); the matchmaker selects a server region where all 10 players have <50ms ping."
    ]
  },
  {
    "id": "web_screenshot_api",
    "title": "Design Headless Chrome / Distributed Screenshot Cluster",
    "badge": "📸",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10M Screenshots/Day • 500 Concurrent Browser Instances",
    "qps": "2,000 Screenshot Requests/Sec • Sub-2s Full Page Capture",
    "difficulty": "Medium",
    "goal": "Build an elastic rendering fleet using headless Chromium instances with ad-blocking, font rendering, and PNG upload to S3.",
    "availableNodes": [
      {
        "id": "api_client_req",
        "name": "Customer API Client",
        "icon": "💻",
        "role": "Submits URL, viewport resolution (1920x1080), wait selector, and output format (PNG/PDF)"
      },
      {
        "id": "screenshot_gateway",
        "name": "Screenshot API Gateway & Rate Limiter",
        "icon": "🛡️",
        "role": "Validates API keys, enforces subscription quotas, and blocks internal private IP requests (SSRF protection)"
      },
      {
        "id": "render_task_queue",
        "name": "Task Priority Queue (RabbitMQ / SQS)",
        "icon": "📬",
        "role": "Buffers screenshot jobs; prioritizes real-time interactive requests over bulk background crawls"
      },
      {
        "id": "chrome_worker_pool",
        "name": "Headless Chrome Worker Fleet (Puppeteer / Playwright)",
        "icon": "🖥️",
        "role": "Executes Chromium inside isolated Docker/K8s sandboxes; renders page and captures viewport bitmap"
      },
      {
        "id": "resource_blocker_adblock",
        "name": "AdBlock & Heavy Asset Interceptor",
        "icon": "🚫",
        "role": "Blocks tracking scripts, ad banners, and video media streams to accelerate page load times by 70%"
      },
      {
        "id": "s3_image_storage",
        "name": "Screenshot Image CDN Storage (S3 / Cloudflare)",
        "icon": "🗄️",
        "role": "Stores compressed PNG/WebP images and serves via global CDN edge with short-lived cache headers"
      },
      {
        "id": "screenshot_cache_redis",
        "name": "URL Screenshot Cache (Redis)",
        "icon": "🔴",
        "role": "Caches identical URL renders for 1 hour to prevent redundant browser executions for hot pages"
      }
    ],
    "correctSequence": [
      "api_client_req",
      "screenshot_gateway",
      "render_task_queue",
      "chrome_worker_pool",
      "resource_blocker_adblock",
      "s3_image_storage",
      "screenshot_cache_redis"
    ],
    "explanation": "1. Customer submits URL. 2. Gateway checks SSRF filter (blocks `http://169.254.169.254`). 3. Redis checks URL cache: if rendered within 1 hour, return CDN URL in <5ms. 4. If cache miss, job enqueued to RabbitMQ. 5. Headless Chrome worker navigates to page. 6. Asset blocker drops ads and video. 7. Browser captures viewport screenshot, uploads to S3, returns image URL.",
    "keyDesignTakeaways": [
      "SSRF (Server-Side Request Forgery) Defense: Allowing users to screenshot arbitrary URLs is a critical security risk; block requests to `localhost`, `127.0.0.1`, `10.0.0.0/8`, and AWS metadata `169.254.169.254` before Chrome connects.",
      "Browser Sandboxing & Memory Leaks: Chromium leaks memory over long-running sessions; recycle Chrome worker processes every 100 pages rendered to prevent out-of-memory crashes.",
      "Resource Interception for Speed: Blocking third-party tracking scripts, ads, and fonts using Puppeteer request interception cuts page rendering latency from 6 seconds to under 1.5 seconds."
    ]
  },
  {
    "id": "eventbridge_bus",
    "title": "Design AWS EventBridge / Schema-Validated Serverless Event Bus",
    "badge": "⚡",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100k Events/Sec • Millions of Filtering Rules • Sub-50ms Routing",
    "qps": "100,000 Events Ingested/Sec • Declarative Pattern Matching",
    "difficulty": "Hard",
    "goal": "Design a serverless event router applying content-based JSON schema filtering, dead-letter archiving, and fan-out to 50+ target services.",
    "availableNodes": [
      {
        "id": "event_source_publisher",
        "name": "Event Source Publisher (SaaS / Microservice)",
        "icon": "💻",
        "role": "Publishes JSON event with `source`, `detail-type`, and structured `detail` payload"
      },
      {
        "id": "bus_ingress_gw",
        "name": "EventBus Ingestion Gateway",
        "icon": "⚡",
        "role": "Authenticates producer, terminates TLS, and enforces schema registry validation contracts"
      },
      {
        "id": "schema_validator",
        "name": "JSON Schema Registry & Validator",
        "icon": "📜",
        "role": "Validates event payload against registered JSON Schema / OpenAPI spec before routing"
      },
      {
        "id": "pattern_evaluator",
        "name": "Rule Pattern Matching Engine (Rete Algorithm)",
        "icon": "⚙️",
        "role": "Matches event attributes against thousands of declarative rules (e.g. `\"status\": [\"FAILED\"]` and `\"amount\": [{ \"numeric\": [\">\", 100] }]`)"
      },
      {
        "id": "event_router_dispatcher",
        "name": "Target Dispatcher & Transformer",
        "icon": "🔀",
        "role": "Transforms event payload and fans out to matching targets (Lambda, SQS, Kinesis, Webhook)"
      },
      {
        "id": "target_dlq_backoff",
        "name": "Dead Letter Queue & Exponential Retry (DLQ)",
        "icon": "💀",
        "role": "Handles target service throttling with exponential backoff; pushes failed events to SQS DLQ"
      },
      {
        "id": "event_archive_replay",
        "name": "Event Archive & Time-Travel Replay Store (S3)",
        "icon": "🗄️",
        "role": "Persists raw immutable events for compliance and allows replaying past event streams after bug fixes"
      }
    ],
    "correctSequence": [
      "event_source_publisher",
      "bus_ingress_gw",
      "schema_validator",
      "pattern_evaluator",
      "event_router_dispatcher",
      "target_dlq_backoff",
      "event_archive_replay"
    ],
    "explanation": "1. SaaS provider emits `order.created` event. 2. Gateway authenticates payload. 3. Schema validator ensures compliant JSON fields. 4. Pattern matching engine runs Rete algorithm to match rules in <5ms across 10,000 rules. 5. Dispatcher transforms payload and fans out to Lambda and SQS targets. 6. DLQ catches target connection failures with exponential retry. 7. Event archived in S3 for historical replay.",
    "keyDesignTakeaways": [
      "Content-Based Routing via Rete Algorithm: Evaluating 10,000 rules sequentially with regex takes seconds; compile rules into a directed acyclic evaluation graph (Rete / Trie) to evaluate all rules in O(1) time.",
      "Schema Registry & Event Contracts: Ad-hoc JSON payloads lead to broken downstream microservices; enforce strict schema contracts where producers cannot emit breaking schema modifications without version bumps.",
      "Event Archival & Time-Travel Replay: Save all bus events to immutable S3 storage; when downstream microservices suffer a bug, developers deploy a fix and 'replay' the exact event stream from the last 24 hours."
    ]
  },
  {
    "id": "crypto_order_book",
    "title": "Design Binance / High-Frequency Crypto Order Book",
    "badge": "🪙",
    "category": "fintech",
    "categoryLabel": "Fintech & Security",
    "scaleMetric": "100M Daily Trades • Sub-Millisecond Matching",
    "qps": "500,000 Orders/Sec • 24/7/365 Continuous",
    "difficulty": "Staff+",
    "goal": "Construct a high-throughput cryptocurrency spot exchange matching engine with WebSocket market feeds and memory-mapped state journals.",
    "availableNodes": [
      {
        "id": "crypto_trader",
        "name": "Crypto Trader / API Bot Client",
        "icon": "🤖",
        "role": "Places Limit / Market orders for BTC/USDT over WebSocket / REST API"
      },
      {
        "id": "crypto_gw",
        "name": "Crypto Exchange API Gateway",
        "icon": "🛡️",
        "role": "Validates API signatures (HMAC-SHA256), rate limits, and checks balance margin in RAM"
      },
      {
        "id": "sequencer_ring",
        "name": "Order Sequencer (Disruptor / Aeron)",
        "icon": "⚡",
        "role": "Assigns monotonic sequence number to all incoming orders in nanoseconds"
      },
      {
        "id": "matching_core",
        "name": "In-Memory Matching Core (SkipList / Red-Black Tree)",
        "icon": "📈",
        "role": "Matches Buy/Sell bids following Price-Time priority with zero heap allocations"
      },
      {
        "id": "wallet_balance_engine",
        "name": "Sub-Millisecond Wallet Ledger (RAM)",
        "icon": "💰",
        "role": "Locks and updates user crypto balances in memory using 64-bit integer Satoshis"
      },
      {
        "id": "trade_wal",
        "name": "Sequential Trade WAL (NVMe / Kafka)",
        "icon": "💾",
        "role": "Appends matched trades to persistent write-ahead log for instant crash replay"
      },
      {
        "id": "depth_feed_ws",
        "name": "WebSocket Market Depth Broadcaster",
        "icon": "📡",
        "role": "Streams live Order Book Depth (Top 20 bids/asks) to millions of connected traders"
      }
    ],
    "correctSequence": [
      "crypto_trader",
      "crypto_gw",
      "sequencer_ring",
      "matching_core",
      "wallet_balance_engine",
      "trade_wal",
      "depth_feed_ws"
    ],
    "explanation": "1. Trader places limit order for BTC/USDT. 2. Gateway checks HMAC signature and verifies balance. 3. Sequencer assigns monotonically increasing sequence ID. 4. Matching engine matches orders following Price-Time priority in memory in <10 microseconds. 5. In-memory ledger updates trader balances (BTC credited, USDT debited) using fixed-point integer Satoshis. 6. Matched trade written to sequential NVMe WAL. 7. Order book depth changes broadcasted to millions of connected WebSocket clients in real time.",
    "keyDesignTakeaways": [
      "Fixed-Point Integer Accounting: Never use `float` or `double` for cryptocurrency; store balances as 64-bit / 128-bit unsigned integers in atomic base units (Satoshis for BTC, Wei for ETH) to eliminate rounding errors.",
      "24/7 Zero-Downtime State Snapshots: Unlike traditional stock exchanges that close at 4 PM, crypto trades 24/7; take non-blocking memory snapshots using copy-on-write (COW) without pausing the matching loop.",
      "Deterministic In-Memory Replay: If a matching node crashes, reconstruct the exact order book state in seconds by replaying the sequential Write-Ahead Log from the last snapshot."
    ]
  },
  {
    "id": "netflix_vector_ann_rec",
    "title": "Design Netflix / Vector Embedding Recommendation Engine",
    "badge": "🎬",
    "category": "big_tech",
    "categoryLabel": "Big Tech System",
    "scaleMetric": "300M Users • 10M Movie Embeddings",
    "qps": "30,000 Vector Search QPS • P99 < 15ms",
    "difficulty": "Staff+",
    "goal": "Build a real-time movie recommendation service utilizing user/item embedding vectors, HNSW index graphs, and Milvus vector DB.",
    "availableNodes": [
      {
        "id": "viewer_app",
        "name": "Netflix Viewer UI Client",
        "icon": "🎬",
        "role": "Renders personalized movie carousels (Because you watched Stranger Things)"
      },
      {
        "id": "rec_gw",
        "name": "Recommendation API Gateway",
        "icon": "🛡️",
        "role": "Validates viewer profile session and routes to candidate retrieval service"
      },
      {
        "id": "user_vector_cache",
        "name": "User Taste Embedding Cache (Redis)",
        "icon": "⚡",
        "role": "Caches real-time 256-dimensional user preference vectors in RAM"
      },
      {
        "id": "vector_ann_index",
        "name": "Vector ANN Search Engine (Milvus / HNSW / Faiss)",
        "icon": "🧠",
        "role": "Executes Approximate Nearest Neighbor (ANN) search over 10M movie vectors in <10ms"
      },
      {
        "id": "metadata_filter",
        "name": "Catalog Filter & Country Licensing Engine",
        "icon": "🌍",
        "role": "Filters out titles user has already watched or that are unlicensed in user country"
      },
      {
        "id": "lightweight_ranker",
        "name": "Lightweight GBDT Re-Ranker",
        "icon": "⚙️",
        "role": "Re-ranks top 50 ANN candidate movies using real-time context (time of day, device)"
      },
      {
        "id": "movie_metadata_store",
        "name": "Movie Catalog Store (CockroachDB)",
        "icon": "🎞️",
        "role": "Hydrates final movie titles, high-res box art, and trailer video URLs"
      }
    ],
    "correctSequence": [
      "viewer_app",
      "rec_gw",
      "user_vector_cache",
      "vector_ann_index",
      "metadata_filter",
      "lightweight_ranker",
      "movie_metadata_store"
    ],
    "explanation": "1. User opens Netflix app. 2. Gateway fetches 256-dimensional user preference vector from Redis. 3. Vector ANN Engine executes Approximate Nearest Neighbor search using HNSW (Hierarchical Navigable Small World) index in <10ms. 4. Metadata filter excludes already-watched movies and region-restricted licenses. 5. GBDT ranking model re-scores top 50 candidates using contextual signals (weekend vs weekday, mobile vs TV). 6. Final top 20 titles hydrated with localized box art. 7. Rendered carousel delivered to viewer in <20ms.",
    "keyDesignTakeaways": [
      "Approximate Nearest Neighbor (ANN) via HNSW: Exact cosine distance search is O(N) and takes seconds; HNSW graph indexing reduces search to O(log N), returning nearest vectors in <5ms.",
      "Two-Stage Recommendation Pipeline: Fast vector ANN retrieval selects top 500 candidates from 10 million titles; a heavy machine learning model re-ranks only those 500 candidates.",
      "Pre-Filter Licensing Constraints: Combine vector search with boolean scalar filtering (e.g. `country = 'US' AND maturity_rating <= 'PG-13'`) inside the vector index to avoid ranking unlicensed movies."
    ]
  },
  {
    "id": "dynamodb_partition_router",
    "title": "Design DynamoDB / Distributed Partition Key Router",
    "badge": "🗄️",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "100 Terabytes Storage • 10,000 Storage Partitions • Multi-Tenant",
    "qps": "500,000 Key-Value Reads/Writes/Sec • Single-Digit Millisecond P99",
    "difficulty": "Staff+",
    "goal": "Construct a horizontally partitioned distributed NoSQL storage engine with B-tree range partitions, Consistent Hashing, and Paxos replicas.",
    "availableNodes": [
      {
        "id": "sdk_client",
        "name": "Application AWS SDK Client",
        "icon": "💻",
        "role": "Issues GetItem / PutItem request with partition key (`PK = user#42`) and optional sort key (`SK = order#101`)"
      },
      {
        "id": "request_router_fleet",
        "name": "Request Router Fleet (Stateless Proxy)",
        "icon": "🔀",
        "role": "Terminates TLS, authenticates SigV4, hashes partition key via MD5, and consults partition map cache"
      },
      {
        "id": "partition_map_cache",
        "name": "Partition Map Metadata Store (Paxos)",
        "icon": "👑",
        "role": "Maintains global hash-to-partition boundary map; streams topology updates to routers in <1s"
      },
      {
        "id": "storage_node_leader",
        "name": "Storage Partition Leader (B-Tree + WAL)",
        "icon": "💾",
        "role": "Leader of 3-node Paxos replication group; writes to local SSD B-Tree and replicates log entries"
      },
      {
        "id": "paxos_follower_replicas",
        "name": "Paxos Follower Storage Replicas",
        "icon": "👥",
        "role": "Acknowledge Paxos consensus writes; serve eventually consistent reads with zero leader overhead"
      },
      {
        "id": "adaptive_capacity_manager",
        "name": "Adaptive Capacity & Hot Partition Balancer",
        "icon": "⚖️",
        "role": "Detects hot partition spikes; dynamically reallocates unused throughput from quiet partitions to hot partitions"
      },
      {
        "id": "storage_split_worker",
        "name": "Automated Partition Split Worker",
        "icon": "✂️",
        "role": "Splits a storage partition into two when data size exceeds 10GB or throughput exceeds 1,000 WCU / 3,000 RCU"
      }
    ],
    "correctSequence": [
      "sdk_client",
      "request_router_fleet",
      "partition_map_cache",
      "storage_node_leader",
      "paxos_follower_replicas",
      "adaptive_capacity_manager",
      "storage_split_worker"
    ],
    "explanation": "1. SDK sends `GetItem(PK='user#42')`. 2. Request Router hashes `user#42` via MD5. 3. Partition map cache matches hash to Partition 412. 4. Router forwards request to storage node leader. 5. Paxos group commits write across quorum of replicas. 6. Adaptive capacity manager dynamically allocates burst capacity if partition is hot. 7. If partition exceeds 10GB, split worker splits partition into two seamlessly.",
    "keyDesignTakeaways": [
      "MD5 Partition Key Hashing: Raw partition keys are hashed with MD5 to uniformly distribute keys across the entire 128-bit keyspace, preventing alphabetical clustering of records.",
      "10GB Partition Size Boundary: DynamoDB bounds physical storage partitions to 10GB and 1,000 write capacity units (WCU) / 3,000 read capacity units (RCU); when a partition grows beyond 10GB, it splits automatically into two partitions.",
      "Adaptive Capacity Borrowing: Older systems throttled partitions strictly; DynamoDB Adaptive Capacity dynamically moves unallocated throughput from idle partitions to a hot partition to absorb sudden bursts."
    ]
  },
  {
    "id": "canary_traffic_router",
    "title": "Design Cloud Canary Traffic Router & Rollback Controller",
    "badge": "🚀",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "1,000 Deployments/Day • 100k Requests/Sec • Sub-Second Metric Rollback",
    "qps": "100,000 Routed Requests/Sec • Statistical Anomaly Detection",
    "difficulty": "Hard",
    "goal": "Design an automated canary rollout controller that evaluates error rate SLOs and dynamically shifts 1% to 100% traffic via Envoy.",
    "availableNodes": [
      {
        "id": "user_traffic_ingress",
        "name": "Incoming User Web Traffic",
        "icon": "🌐",
        "role": "Sends HTTP requests containing user session cookies and client headers to application entrypoint"
      },
      {
        "id": "dynamic_traffic_router",
        "name": "Envoy / Traefik Dynamic Traffic Splitter",
        "icon": "🔀",
        "role": "Splits traffic with floating-point precision: e.g. 95% to Stable Baseline, 5% to Canary Release"
      },
      {
        "id": "stable_baseline_fleet",
        "name": "Stable Baseline Production Fleet (v1)",
        "icon": "🟢",
        "role": "Serves 95% of traffic using proven, verified production software release"
      },
      {
        "id": "canary_candidate_fleet",
        "name": "Canary Deployment Fleet (v2)",
        "icon": "🟡",
        "role": "Serves 5% test traffic with newly built candidate software image"
      },
      {
        "id": "statistical_telemetry_analyzer",
        "name": "Real-Time Telemetry Analyzer (Prometheus / Kayenta)",
        "icon": "📈",
        "role": "Compares Canary vs Baseline: Mann-Whitney U test on HTTP error rates, p99 latency, and CPU usage"
      },
      {
        "id": "automated_rollback_controller",
        "name": "Automated Rollback Controller (Argo Rollouts)",
        "icon": "🚨",
        "role": "Instantly shifts traffic back to 0% and terminates Canary pods if error threshold exceeded for >10s"
      },
      {
        "id": "deployment_audit_log",
        "name": "Deployment Audit Ledger (PostgreSQL)",
        "icon": "📑",
        "role": "Records canary experiment duration, statistical confidence intervals, and deployment verdicts"
      }
    ],
    "correctSequence": [
      "user_traffic_ingress",
      "dynamic_traffic_router",
      "stable_baseline_fleet",
      "canary_candidate_fleet",
      "statistical_telemetry_analyzer",
      "automated_rollback_controller",
      "deployment_audit_log"
    ],
    "explanation": "1. User traffic enters edge router. 2. Envoy splits 95% to Stable v1 and 5% to Canary v2. 3. Both fleets process live traffic concurrently. 4. Statistical analyzer compares error rate and latency between v1 and v2. 5. If v2 error rate exceeds baseline by >0.5%, rollback controller automatically flips traffic back to 0% in <1s. 6. If metrics remain healthy over 15 minutes, traffic steps up: 5% -> 25% -> 50% -> 100%. 7. Audit log records outcome.",
    "keyDesignTakeaways": [
      "Statistical Comparison against Live Baseline: Never compare Canary metrics against static hardcoded thresholds; compare the Canary directly against a concurrently running Baseline fleet under identical live traffic conditions.",
      "Automated Sub-Second Blast Radius Mitigation: When a catastrophic bug occurs (e.g. database schema mismatch), automated controllers must cut canary traffic back to 0% in under 1 second without human intervention.",
      "Sticky Session Hashing: Users must have consistent experiences; hash `cookie(user_id)` to ensure an individual user stays on either Stable or Canary throughout their checkout flow."
    ]
  },
  {
    "id": "database_connection_pooler",
    "title": "Design High-Performance SQL Connection Pooler (PgBouncer)",
    "badge": "🔌",
    "category": "distributed",
    "categoryLabel": "Core Distributed Systems",
    "scaleMetric": "10,000 App Pods • 100 Physical DB Sockets • 100k Queries/Sec",
    "qps": "100,000 SQL Queries/Sec • Sub-Millisecond Multiplexing Overhead",
    "difficulty": "Hard",
    "goal": "Build a high-concurrency database connection proxy utilizing epoll event loops, transaction pooling, and zero thread-per-connection overhead.",
    "availableNodes": [
      {
        "id": "app_client_pod",
        "name": "Application Pods (10,000 Instances)",
        "icon": "💻",
        "role": "Opens TCP socket to pooler using standard PostgreSQL client library; executes SQL queries"
      },
      {
        "id": "pooler_event_loop",
        "name": "Event-Driven Connection Pooler (C / Libevent)",
        "icon": "⚡",
        "role": "Accepts 10,000 client TCP connections; manages client state using non-blocking epoll event loops"
      },
      {
        "id": "transaction_mode_multiplexer",
        "name": "Transaction Pooling Mode Multiplexer",
        "icon": "🔄",
        "role": "Binds client to physical DB connection only during active `BEGIN ... COMMIT` transaction; releases immediately"
      },
      {
        "id": "server_connection_pool",
        "name": "Physical Server Connection Pool (100 Sockets)",
        "icon": "🏊",
        "role": "Maintains optimal warm pool of ~100 persistent physical sockets to backend PostgreSQL instance"
      },
      {
        "id": "client_auth_validator",
        "name": "SCRAM-SHA-256 Auth Cache",
        "icon": "🛡️",
        "role": "Authenticates client passwords locally using cached user hashes, eliminating auth queries to the DB"
      },
      {
        "id": "postgres_database_engine",
        "name": "Primary PostgreSQL Database Engine",
        "icon": "💾",
        "role": "Executes SQL query plans without CPU context switching or RAM exhaustion from thousands of idle connections"
      },
      {
        "id": "pool_telemetry_monitor",
        "name": "Pool Saturation & Wait Queue Telemetry",
        "icon": "📊",
        "role": "Monitors `cl_active`, `cl_waiting`, and `sv_active`; alerts before query wait times breach SLAs"
      }
    ],
    "correctSequence": [
      "app_client_pod",
      "pooler_event_loop",
      "transaction_mode_multiplexer",
      "server_connection_pool",
      "client_auth_validator",
      "postgres_database_engine",
      "pool_telemetry_monitor"
    ],
    "explanation": "1. 10,000 app pods connect to PgBouncer. 2. Libevent manages 10,000 client sockets in non-blocking RAM. 3. Auth validator checks SCRAM passwords locally. 4. In Transaction Pooling mode, a physical DB connection is assigned only for the duration of a transaction. 5. Queries multiplexed across 100 warm physical PostgreSQL connections. 6. PostgreSQL executes queries with optimal CPU cache locality. 7. Pooler telemetry monitors queue wait times.",
    "keyDesignTakeaways": [
      "Transaction Pooling Mode Efficiency: 95% of application database connections sit completely idle waiting for web requests; transaction pooling multiplexes 10,000 idle client connections onto 100 active database connections.",
      "PostgreSQL Process-per-Connection Overhead: Unlike MySQL (threads), PostgreSQL spawns a separate OS process per connection consuming ~10MB of RAM and causing severe CPU cache context switching above 500 connections.",
      "Session State Limitations in Transaction Mode: Transaction pooling breaks session-level state (`SET timezone = ...`, `PREPARE statement`, and temporary tables); use Transaction Mode for standard web apps and Session Mode only when session state is mandatory."
    ]
  }
];
