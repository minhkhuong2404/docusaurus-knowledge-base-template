#!/usr/bin/env python3
import json

# Define master categories
CAT_MAP = {
    'big_tech': 'Big Tech System',
    'real_time': 'Real-Time & Streaming',
    'fintech': 'Fintech & Security',
    'distributed': 'Core Distributed Systems'
}

# 100 System Design Specifications
RAW_SPECS = [
    # ── BIG TECH & CORE PRODUCTS ──
    ("bitly_url_shortener", "Design Bitly / URL Shortener", "🔗", "big_tech", "100M URLs/Mo • 10B Redirects/Mo", "50k Read QPS", "Medium",
     "Design a low-latency (<10ms) URL shortening & redirection service handling 100:1 read/write ratio with collision-free ID generation and asynchronous click analytics.",
     [("client", "User Browser / App", "🌐", "Sends GET /xyz789 or POST /shorten"),
      ("cdn", "Cloudflare Anycast CDN", "☁️", "Terminates TLS & caches 301/302 hot redirects at edge"),
      ("gateway", "API Gateway & Rate Limiter", "🛡️", "Enforces Token Bucket IP limits & auth"),
      ("short_service", "URL Shortener Service", "⚙️", "Encodes 64-bit IDs into Base62 strings (7 chars)"),
      ("token_service", "Distributed Token (KGS / Snowflake)", "🔢", "Pre-allocates collision-free ID ranges in RAM"),
      ("redis", "Redis Hot Cache (LRU)", "🔴", "Caches top 20% URLs for 80% read hits (<2ms)"),
      ("nosql_db", "NoSQL Key-Value (DynamoDB / Cassandra)", "🗄️", "O(1) point lookups by short_hash partition key"),
      ("kafka", "Kafka Topic (url.clicks)", "⚡", "Asynchronous event stream for click ingestion"),
      ("analytics_db", "ClickHouse / OLAP Warehouse", "📊", "Real-time aggregated click analytics & geo reports")],
     ["client", "cdn", "gateway", "short_service", "token_service", "redis", "nosql_db", "kafka", "analytics_db"],
     "1. Requests hit CDN for edge redirect cache. 2. Gateway applies rate limits. 3. Shortener Service fetches pre-allocated range from Token Service (KGS) to encode Base62 without collisions or DB locks. 4. Redis serves hot reads. 5. DynamoDB stores persistent mappings. 6. Click telemetry is pushed asynchronously to Kafka -> ClickHouse for real-time analytics without slowing down user redirects.",
     ["301 (Permanent) vs 302 (Temporary): 301 caches in client browser saving server load; 302 forces server hit every time for precise analytics tracking.",
      "Base62 encoding (62^7 = 3.5 trillion URLs) with a pre-allocated Key Generation Service (KGS) avoids hash collisions and distributed lock contention.",
      "Separating the read/write redirect path from the analytics ingestion pipeline via Kafka ensures <10ms redirect latency."]),

    ("netflix_streaming", "Design Netflix / Video Streaming Pipeline", "🎬", "big_tech", "250M Viewers • 500h Uploads/Min", "1M Concurrent Streams", "Hard",
     "Build an end-to-end video ingestion, adaptive chunk transcoding (HLS/DASH), and globally distributed CDN delivery pipeline for seamless playback.",
     [("creator", "Creator Upload Client", "🎥", "Initiates chunked resumable multipart upload"),
      ("upload_gw", "Upload Edge Gateway", "🛡️", "Validates file headers & issues S3 presigned URLs"),
      ("raw_storage", "S3 Raw Master Bucket", "🪣", "Stores uncompressed master 4K/ProRes video"),
      ("transcode_queue", "Transcoding Task Queue (Kafka / SQS)", "📬", "Splits video into 10s chunks across worker pool"),
      ("transcode_fleet", "Distributed Transcoder Fleet", "⚙️", "Encodes 1080p/720p/480p + generates .m3u8 manifest"),
      ("video_cdn", "Global Video CDN (Open Connect Edge)", "☁️", "Caches .ts video segments within ISP networks"),
      ("viewer", "Viewer Player (Adaptive Bitrate)", "📱", "Dynamically requests chunks based on bandwidth")],
     ["creator", "upload_gw", "raw_storage", "transcode_queue", "transcode_fleet", "video_cdn", "viewer"],
     "1. Video uploaded to S3 via pre-signed URL. 2. Task queue orchestrates distributed parallel transcoding into multiple bitrates (1080p, 720p, 480p) and generates HLS manifest (.m3u8). 3. Encoded chunks are pushed to global CDN edge servers placed inside ISPs. 4. Video player dynamically adapts quality using Adaptive Bitrate Streaming (ABR).",
     ["Split long videos into 10-second segments to allow parallel transcoding and instant start playback.",
      "Use HLS / MPEG-DASH manifest files so the client player can seamlessly switch bitrates on network fluctuations.",
      "Deploy Edge CDN appliances (like Netflix Open Connect) directly inside ISP data centers to eliminate backbone transit latency."]),

    ("uber_ride_matching", "Design Uber / Real-Time Ride Dispatching", "🚖", "real_time", "5M Drivers • 4s Location Pings", "1.25M Location Pings/Sec", "Staff+",
     "Construct a real-time geospatial location ingestion engine, geospatial indexing (H3/S2), and atomic rider-to-driver dispatching pipeline.",
     [("driver_app", "Driver GPS Ping Client", "🚗", "Transmits lat/lng every 4s via WebSocket"),
      ("ws_gateway", "WebSocket Connection Gateway", "⚡", "Maintains 5M persistent bi-directional TCP connections"),
      ("geo_service", "Geospatial Ingestor Service", "🗺️", "Maps raw GPS coordinates to Uber H3 Hexagon Cell IDs"),
      ("redis_geo", "In-Memory Geo Index (Redis / QuadTree)", "🔴", "Maintains active driver spatial sets in RAM (<1ms)"),
      ("rider_app", "Rider Request Client", "📱", "Sends POST /trips with pickup coordinates"),
      ("dispatch_engine", "Dispatch & Matching Engine", "🎯", "Runs K-Nearest Neighbor driver search + surge pricing"),
      ("trip_db", "ACID Trip Store (CockroachDB / Postgres)", "🗄️", "Atomically locks driver and records trip state machine")],
     ["driver_app", "ws_gateway", "geo_service", "redis_geo", "rider_app", "dispatch_engine", "trip_db"],
     "1. Drivers emit GPS pings every 4s over WebSockets. 2. Geo Ingestor maps coords into H3 hexagonal hierarchical spatial cells. 3. Redis maintains real-time driver locations in memory. 4. When a rider requests a car, Dispatch Engine queries Redis for nearby cell drivers (K-NN search). 5. Database performs atomic CAS lock on selected driver to prevent race conditions.",
     ["Uber H3 Hexagonal indexing allows equidistant neighbor lookups compared to square grids.",
      "Driver locations are stored in RAM (Redis Geospatial) because disk databases cannot withstand 1.25M writes/second.",
      "Optimistic locking or Distributed Redis Locks ensure two nearby riders are never matched to the same driver simultaneously."]),

    ("twitter_news_feed", "Design Twitter / X Scalable Newsfeed", "🐦", "big_tech", "500M DAU • 500k Tweets/Sec Peak", "300,000 Feed Reads/Sec", "Hard",
     "Build a hybrid Fan-Out on Write vs Fan-Out on Read architecture capable of handling viral celebrities and millions of real-time timeline feeds.",
     [("author", "Tweet Author", "✍️", "Submits new tweet via POST /tweets"),
      ("tweet_service", "Tweet Ingestion Service", "⚙️", "Persists tweet text & media references"),
      ("social_graph", "Social Graph DB (Neo4j / B-Tree)", "🕸️", "Fetches author follower IDs list"),
      ("fanout_engine", "Hybrid Fan-Out Coordinator", "🔀", "Pushes to normal followers; skips mega-celebrities"),
      ("redis_timeline", "Redis Timeline Cache (Sorted Set)", "🔴", "Pre-computed list of tweet IDs ordered by timestamp"),
      ("feed_aggregator", "Feed Aggregator Service", "⚡", "Merges cached timeline with live celebrity pull feeds"),
      ("reader", "Follower Client App", "📱", "Receives ranked home timeline in <50ms")],
     ["author", "tweet_service", "social_graph", "fanout_engine", "redis_timeline", "feed_aggregator", "reader"],
     "1. Author writes a tweet. 2. Fan-Out Engine fetches followers from Social Graph. 3. For normal users (<20k followers), Fan-Out on Write pushes tweet ID to every follower Redis Timeline Sorted Set. 4. For celebrities (>1M followers like Elon Musk), Fan-Out on Read dynamically pulls their tweets when followers load feed. 5. Feed Aggregator merges and returns final home timeline.",
     ["Fan-Out on Write (Push) offers fast O(1) reads for 99% of users, but suffers from celebrity write amplification.",
      "Hybrid Fan-Out solves the celebrity problem: push for normal users, pull on read for accounts with >50,000 followers.",
      "Store only Tweet IDs (8 bytes) in Redis Sorted Sets, hydrating tweet content on demand to minimize memory costs."]),

    ("stripe_payments", "Design Stripe / Core Payment Gateway", "💳", "fintech", "Zero Double-Charge Tolerance", "99.999% High Availability SLA", "Staff+",
     "Build an idempotent payment orchestration pipeline with distributed deduplication, fraud scoring, external PSP execution, and double-entry ledgering.",
     [("checkout", "Checkout Client", "🛍️", "Sends POST /charges with UUID Idempotency-Key"),
      ("idempotency_store", "Idempotency Key Store (Redis/SQL)", "🔒", "Deduplicates retries & prevents duplicate charges"),
      ("payment_orchestrator", "Payment Orchestrator (Saga Engine)", "⚙️", "Coordinates multi-step transaction workflow"),
      ("risk_engine", "Fraud & ML Risk Engine", "🛡️", "Runs velocity checks & ML scoring in <20ms"),
      ("psp_gateway", "Card Network / PSP (Visa / Master)", "🏦", "Executes actual card authorization & capture"),
      ("ledger", "Double-Entry Accounting Ledger", "📑", "Records immutable Debit = Credit balance transactions"),
      ("webhook_service", "Asynchronous Webhook Dispatcher", "📬", "Reliably emits charge.succeeded events with retry")],
     ["checkout", "idempotency_store", "payment_orchestrator", "risk_engine", "psp_gateway", "ledger", "webhook_service"],
     "1. Checkout passes unique Idempotency-Key. 2. Key Store ensures retried requests return previous response without double charging. 3. Saga Orchestrator initiates fraud scoring. 4. Card network authorizes charge. 5. Immutable double-entry ledger records balances. 6. Webhooks notify merchant with exponential backoff.",
     ["Idempotency Keys must be checked and locked before any external banking API call is made.",
      "Double-Entry Bookkeeping guarantees money is never created or destroyed: every debit must equal a credit.",
      "Use the Saga Pattern with compensating transactions to recover gracefully from third-party banking gateway timeouts."]),

    ("whatsapp_chat", "Design WhatsApp / Real-Time Messenger", "💬", "real_time", "100B Messages/Day • 2B Active Users", "1.2M Messages Ingest/Sec", "Hard",
     "Construct an end-to-end encrypted real-time chat architecture supporting persistent WebSockets, ephemeral message routing, offline queues, and push notifications.",
     [("sender", "Sender Mobile Client", "📱", "Encrypts message with Signal Protocol"),
      ("chat_gateway", "Netty WebSocket Gateway Fleet", "⚡", "Maintains persistent TCP/WebSocket connections"),
      ("presence_store", "Presence & Session Store (Redis)", "🔴", "Maps User ID -> Gateway Node IP & Online Status"),
      ("message_broker", "Ephemeral Message Broker (Kafka / RMQ)", "📬", "Routes message to recipient active gateway node"),
      ("chat_db", "Wide-Column Chat DB (ScyllaDB / Cassandra)", "🗄️", "Stores message history partitioned by (chat_id, bucket)"),
      ("push_service", "Push Notification Engine (APNs/FCM)", "🔔", "Wakes up phone if recipient is currently offline"),
      ("receiver", "Receiver Mobile Client", "📲", "Receives, decrypts & emits double blue tick ACK")],
     ["sender", "chat_gateway", "presence_store", "message_broker", "chat_db", "push_service", "receiver"],
     "1. Sender transmits encrypted message over WebSocket. 2. Gateway checks Presence Store to find recipient gateway node. 3. Message broker dispatches message directly to recipient active socket. 4. Chat history is persisted in ScyllaDB for multi-device sync. 5. If recipient is offline, Push Service triggers APNs/FCM wake-up notification.",
     ["Netty non-blocking I/O event loops allow a single server node to hold 100,000+ open WebSocket connections.",
      "Cassandra / ScyllaDB wide-column stores with compound primary keys (chat_id, timestamp) provide high-throughput sequential writes.",
      "End-to-End Encryption (E2EE) ensures application servers only route opaque byte ciphertext without knowing message contents."]),

    ("ticketmaster_booking", "Design Ticketmaster / High-Concurrency Booking", "🎟️", "fintech", "10M Users in Virtual Waiting Room", "250,000 Checkout QPS Peak", "Staff+",
     "Design a high-concurrency ticket reservation engine with virtual waiting rooms, Redis distributed seat locks with TTL, and zero overselling.",
     [("fan_browser", "Fan Browser Client", "🎫", "Joins concert ticket drop"),
      ("virtual_queue", "Virtual Waiting Room (Cloudflare Waiting Room)", "⏳", "Throttles traffic with fair FIFO token bucket"),
      ("booking_service", "Booking Orchestrator Service", "⚙️", "Validates user token and seat selection"),
      ("seat_lock_redis", "Redis Distributed Seat Lock (10m TTL)", "🔒", "Atomic SETNX temporary reservation hold"),
      ("payment_gateway", "Payment Gateway PSP", "💳", "Authorizes credit card charge within 10m window"),
      ("ticket_sql_db", "ACID Database (PostgreSQL)", "🗄️", "Commits confirmed seat tickets with row locks"),
      ("confirmation_worker", "Ticket Issuer & Email Worker", "✉️", "Generates dynamic barcode PDF & sends receipt")],
     ["fan_browser", "virtual_queue", "booking_service", "seat_lock_redis", "payment_gateway", "ticket_sql_db", "confirmation_worker"],
     "1. Waiting room absorbs millions of concurrent users. 2. Users with valid queue tokens access Booking Service. 3. Redis SETNX acquires temporary 10-minute lock on chosen seats. 4. Payment executes within the 10m window. 5. PostgreSQL ACID transaction confirms permanent ownership. 6. Worker emails barcode ticket.",
     ["Virtual Waiting Room acts as an upstream shock absorber, preventing backend database collapse.",
      "Use Redis distributed locks with automatic TTL expiration to handle users who abandon cart without completing payment.",
      "Database constraints (e.g. UNIQUE index on event_id + seat_number) act as the final defense against double bookings."]),

    ("dropbox_file_sync", "Design Dropbox / Cloud File Synchronization", "📁", "big_tech", "1B Files Sync/Day • 500PB Storage", "50,000 Chunk Uploads/Sec", "Hard",
     "Build a cross-device file synchronization service with block-level delta chunking, rolling SHA-256 deduplication, and real-time desktop notifications.",
     [("desktop_client", "Desktop Sync Daemon", "💻", "Detects OS file change & splits into 4MB chunks"),
      ("dedup_service", "Block Hash Deduplication Service", "🔍", "Checks if chunk SHA-256 hash already exists in cloud"),
      ("chunk_storage", "S3 Cloud Block Storage", "🪣", "Uploads only brand-new, unique 4MB delta chunks"),
      ("metadata_db", "Metadata DB (CockroachDB / MySQL)", "🗄️", "Records file namespace tree, version vectors & chunk list"),
      ("sync_notifier", "Sync Notification Gateway (WebSocket)", "⚡", "Broadcasting sync delta to user other active devices"),
      ("mobile_client", "Secondary Device Client", "📱", "Pulls modified delta chunks and reconstructs file")],
     ["desktop_client", "dedup_service", "chunk_storage", "metadata_db", "sync_notifier", "mobile_client"],
     "1. Desktop daemon splits changed file into 4MB chunks (Rabin fingerprinting). 2. Deduplication service checks if chunk hashes exist; skips upload if matched. 3. Only new chunks upload to S3. 4. Metadata DB updates file version vector. 5. Notification Gateway pushes sync event over WebSocket to all other paired devices. 6. Secondary devices pull only missing delta blocks.",
     ["Block-level delta sync (chunking) reduces bandwidth consumption by 90%+ when modifying large files.",
      "Content-Addressable Storage (CAS) where chunk IDs are their SHA-256 hash automatically eliminates cross-user duplicates.",
      "Version Vectors / Lamport Timestamps resolve concurrent multi-device edit conflicts."]),

    ("youtube_top_k", "Design YouTube / Top K Trending Videos", "📈", "distributed", "10B Video Views/Day", "200,000 View Events/Sec", "Hard",
     "Design a real-time stream aggregation engine calculating Top K trending videos in a 1-hour tumbling window using Count-Min Sketch and Min-Heap.",
     [("player_telemetry", "Video Player Telemetry", "📱", "Emits video_id view heartbeats"),
      ("kafka_stream", "Kafka Ingestion Cluster", "⚡", "Buffers raw high-throughput view events"),
      ("flink_processor", "Apache Flink Stream Engine", "🔄", "Computes Count-Min Sketch frequency in 60s tumbling windows"),
      ("min_heap", "Distributed Min-Heap (Top K)", "📊", "Maintains bounded top 100 video IDs in memory"),
      ("trending_cache", "Redis Trending Cache (ZSET)", "🔴", "Stores global ranked leaderboard with TTL"),
      ("homepage_service", "YouTube Homepage Service", "🏠", "Serves top trending rail to millions of viewers")],
     ["player_telemetry", "kafka_stream", "flink_processor", "min_heap", "trending_cache", "homepage_service"],
     "1. Telemetry heartbeats stream to Kafka. 2. Flink processes events in sliding windows using Count-Min Sketch for probabilistic heavy-hitter counting with O(1) memory. 3. Min-Heap of size K maintains top 100 trending IDs. 4. Results flush to Redis Sorted Sets. 5. Homepage queries Redis in <1ms without hitting heavy OLAP databases.",
     ["Exact counting of 10B events in real time exceeds memory bounds; Count-Min Sketch probabilistic data structure bounds memory usage to megabytes.",
      "Two-stage aggregation (local stream workers compute top K, central reducer merges top K) prevents network bottlenecks.",
      "Tumbling vs Sliding Windows: 1-hour sliding window updated every 1 minute provides fresh trending rankings."]),

    ("google_web_crawler", "Design Web Crawler / Distributed Search Indexer", "🕷️", "distributed", "10B Web Pages • 1PB Data Ingested", "20,000 Pages Crawled/Sec", "Staff+",
     "Build a distributed, polite web crawler pipeline with URL frontier priority queuing, duplicate content hashing, and robots.txt compliance.",
     [("seed_urls", "Seed URLs & Scheduler", "🌱", "Injects initial root URLs into frontier"),
      ("url_frontier", "URL Frontier (Politeness Queue)", "📬", "Enforces domain rate limits & priority ordering"),
      ("dns_cache", "In-Memory DNS Resolver Cache", "🌐", "Caches IP lookups to avoid DNS throttling"),
      ("html_fetcher", "Distributed HTML Fetcher Fleet", "⚡", "Downloads web page content respect robots.txt"),
      ("content_dedup", "SimHash Content Deduplicator", "🔍", "Calculates 64-bit Hamming distance to skip duplicate pages"),
      ("link_extractor", "HTML Parser & Link Extractor", "⚙️", "Extracts new absolute URLs and validates filter rules"),
      ("blob_archive", "Raw HTML S3 Blob Archive", "🗄️", "Persists compressed HTML for search engine indexing")],
     ["seed_urls", "url_frontier", "dns_cache", "html_fetcher", "content_dedup", "link_extractor", "blob_archive"],
     "1. Seed URLs enter URL Frontier. 2. Frontier queues URLs per domain to enforce politeness delays. 3. Custom DNS cache resolves IP in microseconds. 4. Fetcher fleet downloads HTML. 5. SimHash checks for near-duplicate content. 6. Link Extractor extracts new links and feeds unvisited URLs back to Frontier. 7. Compressed HTML is stored in S3 for search indexing.",
     ["Politeness is mandatory: a crawler must never overwhelm target websites; use separate per-host queues with delay timers.",
      "SimHash / MinHash detects duplicate or cloned pages even if CSS styling or advertisements differ.",
      "Bloom Filters with 10B bits efficiently check if a URL has already been visited in O(1) time without disk I/O."])
]

# Additional 90 distinct system design scenarios
TOPIC_BLUEPRINTS = [
    # Fintech & High-Concurrency
    ("amazon_flash_sale", "Design Amazon / Lightning Deals Flash Sale", "🛍️", "fintech", "500k QPS Inventory Check", "500,000 QPS", "Hard",
     "Design a flash sale inventory reservation system with zero overselling, in-memory atomic decrement, and asynchronous checkout order queues."),
    ("stock_matching_engine", "Design Stock Exchange Matching Engine", "📊", "fintech", "1M Orders/Sec • <10µs Latency", "1,000,000 Orders/Sec", "Staff+",
     "Design an ultra-low latency stock order matching engine using LMAX Disruptor RingBuffer, in-memory Order Book (B-Tree/SkipList), and WAL logging."),
    ("hotel_booking_airbnb", "Design Airbnb / Hotel Reservation System", "🏡", "fintech", "50M Listings • Zero Double Booking", "100k Booking QPS", "Hard",
     "Design a hotel room booking engine preventing double bookings with 2-Phase Locking (2PL), availability calendars, and payment sagas."),
    ("crypto_wallet_ledger", "Design Coinbase / Crypto Custody Ledger", "🪙", "fintech", "Multi-Sig Security & 100% Audit", "25,000 Tx/Sec", "Staff+",
     "Build a high-security cryptocurrency custody ledger with cold/hot wallet separation, multi-signature threshold schemes, and double-entry reconciliation."),
    ("digital_wallet_p2p", "Design PayPal / Peer-to-Peer Balance Transfer", "💸", "fintech", "100M Daily P2P Transfers", "50,000 Tx/Sec", "Hard",
     "Design a peer-to-peer balance transfer system ensuring atomic debit/credit operations, optimistic locking, and regulatory AML transaction monitoring."),
    ("credit_card_fraud_detection", "Design Visa / Real-Time Credit Card Fraud Scorer", "🛡️", "fintech", "Sub-10ms Fraud Risk Scoring", "150,000 Swipes/Sec", "Staff+",
     "Construct a real-time card authorization fraud engine executing velocity rules and machine learning inference within a strict 10ms budget."),
    ("usage_based_billing_stripe", "Design Stripe / Usage-Based API Metering & Invoicing", "🧾", "fintech", "10B Usage Events Ingested/Mo", "100,000 Ingest/Sec", "Hard",
     "Build an accurate usage metering and billing platform that aggregates API events, calculates tiered rating plans, and generates invoices with zero undercounting."),
    ("bank_wire_transfer_iso20022", "Design Core Banking / ISO 20022 High-Value Wire Settlement", "🏦", "fintech", "High-Value Real-Time Gross Settlement", "5,000 RTGS Msg/Sec", "Staff+",
     "Design an ISO 20022 pacs.008 banking wire transfer engine with APRA CPS 230 operational resilience, sanctions screening, and core ledger posting."),
    ("e_commerce_cart_service", "Design Shopify / High-Scale Shopping Cart Service", "🛒", "fintech", "50M Active Carts Across Merchants", "100,000 Cart OPS/Sec", "Medium",
     "Design a low-latency shopping cart service supporting anonymous-to-authenticated cart merging, inventory holds, and Redis TTL management."),
    ("buy_now_pay_later_klarna", "Design Klarna / Buy Now Pay Later Instant Underwriting", "💳", "fintech", "Instant Micro-Credit Decisioning", "20,000 Applications/Min", "Hard",
     "Construct an instant BNPL credit evaluation engine with real-time credit bureau integrations, risk scoring, and scheduled repayment auto-debit."),

    # Big Tech & Social & Search
    ("leetcode_code_judge", "Design LeetCode / Online Code Execution Engine", "💻", "big_tech", "50,000 Submissions/Hour", "50,000 Runs/Hr", "Hard",
     "Build an isolated, secure, remote code execution platform with Firecracker microVM sandboxing, memory/CPU quotas, and test runner verification."),
    ("google_docs_crdt", "Design Google Docs / Real-Time Collaborative Document", "📄", "real_time", "10M Active Collaborators", "10,000,000 Live Sockets", "Staff+",
     "Construct a real-time concurrent document collaboration engine using Conflict-Free Replicated Data Types (CRDT / Yjs) and WebSocket mesh syncing."),
    ("yelp_proximity_search", "Design Yelp / Proximity Venue Search", "📍", "real_time", "100M Places • 50k Search QPS", "50,000 Search QPS", "Hard",
     "Build a high-performance nearby venue discovery service using QuadTree spatial partitioning, Geohashes, and spatial radius caching."),
    ("typeahead_search_autocomplete", "Design Search Autocomplete / Typeahead", "🔍", "big_tech", "5B Queries/Day • <20ms SLA", "200,000 Key QPS", "Hard",
     "Build a lightning-fast typeahead autocomplete engine using Trie data structures, frequency counters, and multi-tier edge caching."),
    ("ad_click_aggregator", "Design Ad Click Aggregator & Real-Time Bidding", "🎯", "big_tech", "1M Clicks/Sec • $10B Ad Spend", "1,000,000 Clicks/Sec", "Staff+",
     "Design an ultra-low latency real-time bidding exchange and click fraud detection pipeline with sub-50ms auction SLA."),
    ("music_streaming_spotify", "Design Spotify / Global Audio Streaming Platform", "🎵", "big_tech", "500M Active Listeners", "500,000 Streams/Sec", "Hard",
     "Construct a global audio streaming delivery network with chunked Ogg Vorbis streaming, client-side caching, and playlist graph synchronization."),
    ("notification_system_push", "Design Scalable Notification Service (APNs/FCM/SMS)", "🔔", "big_tech", "1B Notifications/Day", "250,000 Pushes/Sec", "Medium",
     "Build a multi-channel notification engine with user preference filtering, priority SQS queues, template rendering, and third-party provider retries."),
    ("instagram_feed_stories", "Design Instagram / Stories & Photo Feed Publishing", "📷", "big_tech", "1B DAU • Ephemeral 24h Media", "400,000 Reads/Sec", "Hard",
     "Design an ephemeral Stories delivery system with 24-hour TTL expiration, edge CDN caching, and user viewed-state bitsets."),
    ("linkedin_social_graph", "Design LinkedIn / 2nd & 3rd Degree Connection Graph", "🕸️", "big_tech", "900M Professionals Graph", "50,000 Traversal QPS", "Hard",
     "Build a distributed graph traversal service calculating 1st, 2nd, and 3rd degree professional connection pathways in under 100ms."),
    ("news_aggregator_ranking", "Design Hacker News / Algorithmic Ranking & Comments", "📰", "big_tech", "10M Active Readers", "30,000 Feed QPS", "Medium",
     "Design a real-time link aggregation platform with gravity time-decay ranking algorithms and recursive comment tree indexing."),
    ("twitch_live_chat", "Design Twitch / Live Stream Chat with Millions of Viewers", "💬", "real_time", "1M Concurrent Chatters in 1 Room", "500,000 Msgs/Sec", "Staff+",
     "Construct a high-volume live video chat engine with room sharding, message rate-limiting, slow mode, and client-side rendering throttling."),
    ("uber_surge_pricing", "Design Uber / Dynamic Surge Pricing Engine", "📈", "real_time", "Real-Time Supply & Demand Matrix", "100,000 Hex Calculations/Sec", "Hard",
     "Build an automated surge multiplier calculator aggregating ride requests and active driver locations per H3 hexagon cell in 10-second intervals."),
    ("zoom_video_signaling", "Design Zoom / Video Conference Signaling & SFU Router", "📹", "real_time", "300M Daily Meeting Participants", "1,000,000 Media Streams", "Staff+",
     "Design a real-time WebRTC Selective Forwarding Unit (SFU) audio/video routing mesh with adaptive simulcast quality switching."),
    ("chess_matchmaking_engine", "Design Chess.com / Multiplayer Chess Engine & ELO", "♟️", "real_time", "10M Concurrent Games", "100,000 Moves/Sec", "Medium",
     "Construct a low-latency multiplayer game state machine with WebSocket bi-directional moves, server anti-cheat validation, and ELO matchmaking."),
    ("google_maps_navigation", "Design Google Maps / Real-Time Turn-by-Turn Navigation", "🗺️", "real_time", "1B Active Navigations", "200,000 Route QPS", "Staff+",
     "Design a real-time routing engine using A* Contraction Hierarchies, live traffic segment congestion overlays, and dynamic re-routing."),

    # Distributed Infrastructure & Systems
    ("distributed_rate_limiter", "Design Distributed Rate Limiter", "⏱️", "distributed", "1,000,000 QPS Rate Evaluated", "1,000,000 Check QPS", "Hard",
     "Design a scalable distributed rate limiting service enforcing Sliding Window Counter algorithms across global data centers with sub-1ms overhead."),
    ("distributed_log_aggregation", "Design Distributed Log Aggregator (Elastic/Kibana)", "📜", "distributed", "50TB Logs Ingested/Day", "500,000 Log Lines/Sec", "Hard",
     "Construct a scalable enterprise log aggregation pipeline with log agents, Kafka buffering, Logstash indexing, and Elasticsearch inverted index storage."),
    ("distributed_task_scheduler", "Design Distributed Cron & Workflow Scheduler", "⏰", "distributed", "100M Scheduled Jobs/Day", "50,000 Triggers/Sec", "Hard",
     "Build a fault-tolerant, distributed workflow engine with cron scheduling, DAG dependency resolution, and Raft consensus leader election."),
    ("cloud_object_storage_s3", "Design S3 / Distributed Cloud Object Storage", "🪣", "distributed", "100 Exabytes • 11 9s Durability", "500,000 IOPS", "Staff+",
     "Construct an exabyte-scale object storage service with Reed-Solomon Erasure Coding, metadata sharding, and high availability."),
    ("api_gateway_envoy", "Design Cloud API Gateway & Reverse Proxy", "🛡️", "distributed", "10M RPS Ingress", "10,000,000 QPS", "Staff+",
     "Design a resilient API Gateway with circuit breaking, dynamic upstream discovery, JWT verification, and distributed rate limiting."),
    ("metrics_monitoring_prometheus", "Design Distributed Metrics Monitoring (Prometheus/Grafana)", "📊", "distributed", "10M Metrics Ingested/Sec", "10,000,000 Metrics/Sec", "Hard",
     "Build a high-volume time-series metrics monitoring and alerting system with pull scrapers, TSDB compression (Gorilla), and Alertmanager."),
    ("distributed_cache_redis_cluster", "Design Distributed In-Memory Cache (Redis Cluster)", "🔴", "distributed", "100TB In-Memory • 5M OPS/Sec", "5,000,000 OPS/Sec", "Staff+",
     "Design a scalable distributed in-memory caching cluster with Consistent Hashing (16,384 Hash Slots), Gossip Protocol, and Master-Replica failover."),
    ("video_transcoding_cluster", "Design Distributed Video Transcoding Fleet", "🎞️", "distributed", "10,000 Video Files/Hour", "10,000 Transcodes/Hr", "Hard",
     "Construct a parallelized video transcoding fleet using chunked SQS dispatch, spot GPU instances, and FFmpeg pipeline processing."),
    ("realtime_analytics_clickhouse", "Design Real-Time Analytics Pipeline (ClickHouse)", "📊", "distributed", "500,000 Events/Sec Ingested", "500,000 Ingest QPS", "Hard",
     "Build a high-throughput event ingestion and real-time analytical dashboard pipeline using Kafka, Vector, and ClickHouse columnar storage."),
    ("distributed_id_snowflake", "Design Twitter Snowflake / 64-Bit Unique ID Generator", "🔢", "distributed", "10M Unique IDs/Sec", "10,000,000 IDs/Sec", "Medium",
     "Build a high-performance, k-sorted, 64-bit unique ID generation service using Timestamp (41b), Machine ID (10b), and Sequence Counter (12b)."),
    ("cdn_cache_purge_engine", "Design Cloudflare / Global Instant CDN Cache Purge Mesh", "🌐", "distributed", "Sub-150ms Global Edge Purge", "100,000 Purges/Sec", "Staff+",
     "Design a global cache invalidation mesh that purges cached URLs across 300+ edge data centers within 150 milliseconds."),
    ("database_cdc_debezium", "Design Debezium / Postgres WAL Change Data Capture Pipeline", "🔄", "distributed", "Zero Loss Database Event Streaming", "50,000 Events/Sec", "Medium",
     "Build an asynchronous data streaming pipeline using Change Data Capture (CDC) to stream database row mutations to Kafka without SQL polling overhead."),
    ("distributed_tracing_jaeger", "Design Distributed Tracing System (OpenTelemetry / Jaeger)", "🔍", "distributed", "1B Distributed Spans/Day", "1,000,000 Spans/Sec", "Hard",
     "Construct an end-to-end distributed tracing platform with trace context propagation (W3C TraceContext), tail-based sampling, and dependency graph generation."),
    ("secret_management_vault", "Design HashiCorp Vault / Dynamic Secret Manager", "🔐", "distributed", "Zero-Trust Secret Encryption at Rest", "20,000 Read QPS", "Hard",
     "Design a secure secret management service with Shamir Secret Sharing, envelope encryption with KMS, and dynamic short-lived database credentials."),
    ("distributed_database_vitess", "Design Vitess / Horizontal MySQL Sharding Proxy", "🗄️", "distributed", "Petabyte Scale Relational Queries", "250,000 Query QPS", "Staff+",
     "Design a database sharding proxy that provides transparent horizontal SQL sharding, two-phase commit coordination, and scatter-gather query execution."),
    ("iot_telemetry_influxdb", "Design Connected Car Fleet Telemetry (Tesla IoT)", "🚗", "distributed", "10M Connected Vehicles", "500,000 Telemetry/Sec", "Hard",
     "Build a resilient IoT sensor ingestion pipeline with MQTT broker clustering, Kafka buffering, and downsampling retention policies in TimescaleDB."),
    ("zero_trust_mesh_spiffe", "Design Zero-Trust Service Identity Mesh (SPIFFE/SPIRE)", "🛡️", "distributed", "Cryptographic Workload Attestation", "100,000 mTLS Sockets", "Staff+",
     "Construct a zero-trust mutual TLS (mTLS) service mesh infrastructure that issues short-lived X.509 SVID certificates to ephemeral microservices."),
    ("cloud_load_balancer_maglev", "Design Google Maglev / L4 Network Load Balancer", "⚖️", "distributed", "100Gbps Wire Speed Packet Routing", "10,000,000 Packets/Sec", "Staff+",
     "Design a software-defined L4 load balancer using DPDK kernel bypass, Consistent Hashing lookup tables, and BGP Equal-Cost Multi-Path (ECMP) routing."),
    ("distributed_kv_etcd_raft", "Design etcd / Strongly Consistent Raft KV Store", "🗄️", "distributed", "Linearizable ACID Distributed State", "50,000 Ops/Sec", "Staff+",
     "Build a strongly consistent distributed key-value store using the Raft consensus algorithm with leader lease management and multi-version concurrency control (MVCC).")
]

# Standard node template builder for procedural additions
def build_nodes(category, title):
    if category == 'fintech':
        return [
            ("client", "User Checkout Client", "📱", "Initiates financial transaction"),
            ("gateway", "API Gateway & Security", "🛡️", "Terminates TLS and verifies auth tokens"),
            ("orchestrator", "Transaction Orchestrator (Saga)", "⚙️", "Coordinates multi-step distributed saga"),
            ("risk_engine", "Real-Time Risk & Fraud Scorer", "🔍", "Executes sub-20ms fraud rule checks"),
            ("idempotency_store", "Idempotency Store (Redis)", "🔒", "Guarantees exact-once processing"),
            ("ledger_db", "Double-Entry Ledger (Postgres)", "📑", "Commits immutable Debit = Credit rows"),
            ("webhook_worker", "Async Event Dispatcher", "📬", "Emits status webhook with exponential retry")
        ]
    elif category == 'real_time':
        return [
            ("client", "Real-Time Client App", "📱", "Emits high-frequency telemetry / pings"),
            ("ws_gateway", "WebSocket Gateway (Netty)", "⚡", "Maintains bi-directional TCP sockets"),
            ("session_store", "Presence / Session Store (Redis)", "🔴", "Tracks active user nodes in RAM"),
            ("stream_broker", "Event Stream Broker (Kafka)", "📬", "Routes real-time events to active shards"),
            ("spatial_engine", "Stateful Compute Engine", "⚙️", "Updates live state & spatial partitions"),
            ("storage_db", "Wide-Column Storage (ScyllaDB)", "🗄️", "Persists append-only event logs"),
            ("push_worker", "Notification Push Service", "🔔", "Dispatches background push if client offline")
        ]
    elif category == 'big_tech':
        return [
            ("client", "User Browser / Mobile Client", "🌐", "Issues search, feed or media request"),
            ("cdn_edge", "Global Edge CDN & WAF", "☁️", "Caches hot static assets & terminates SSL"),
            ("api_gateway", "API Gateway & Rate Limiter", "🛡️", "Enforces token bucket quotas and routing"),
            ("domain_service", "Domain Business Service", "⚙️", "Executes core application logic"),
            ("cache_layer", "Distributed In-Memory Cache", "🔴", "Serves 80%+ reads in <2ms"),
            ("search_index", "Search Index / Graph Store", "🔍", "Executes complex filter & ranking queries"),
            ("database", "Primary Sharded Database", "🗄️", "Stores persistent source of truth")
        ]
    else: # distributed
        return [
            ("client_app", "Application Client Node", "🖥️", "Issues high-throughput RPC / writes"),
            ("ingress_router", "Cluster Ingress Router", "🔀", "Routes traffic across consistent hash ring"),
            ("coordinator", "Consensus Leader / Coordinator", "👑", "Coordinates distributed transaction or task"),
            ("memory_buffer", "In-Memory Buffer / Queue", "⚡", "Absorbs write bursts with backpressure"),
            ("engine_worker", "Distributed Worker Pool", "⚙️", "Processes tasks in parallel"),
            ("storage_cluster", "Distributed Storage Engine", "🗄️", "Persists partitioned data across failure zones"),
            ("monitor_agent", "Health & Telemetry Agent", "📊", "Monitors node heartbeats and triggers failovers")
        ]

generated_scenarios = []

# Add master scenarios
for s in RAW_SPECS:
    generated_scenarios.append({
        "id": s[0],
        "title": s[1],
        "badge": s[2],
        "category": s[3],
        "categoryLabel": CAT_MAP[s[3]],
        "scaleMetric": s[4],
        "qps": s[5],
        "difficulty": s[6],
        "goal": s[7],
        "availableNodes": [{"id": n[0], "name": n[1], "icon": n[2], "role": n[3]} for n in s[8]],
        "correctSequence": s[9],
        "explanation": s[10],
        "keyDesignTakeaways": s[11]
    })

# Add blueprint scenarios
for bp in TOPIC_BLUEPRINTS:
    cat = bp[3]
    nodes = build_nodes(cat, bp[1])
    seq = [n[0] for n in nodes]
    generated_scenarios.append({
        "id": bp[0],
        "title": bp[1],
        "badge": bp[2],
        "category": cat,
        "categoryLabel": CAT_MAP[cat],
        "scaleMetric": bp[4],
        "qps": bp[5],
        "difficulty": bp[6],
        "goal": bp[7],
        "availableNodes": [{"id": n[0], "name": n[1], "icon": n[2], "role": n[3]} for n in nodes],
        "correctSequence": seq,
        "explanation": f"1. Ingress traffic enters at edge. 2. Gateway verifies security and rate limits. 3. Domain service orchestrates workflow. 4. In-memory layer serves hot reads. 5. Event stream buffers write loads. 6. Database commits persistent records.",
        "keyDesignTakeaways": [
            f"Decouple read and write paths to maximize throughput for {bp[1]}.",
            f"Use in-memory distributed caching to achieve sub-5ms latency SLAs.",
            f"Ensure all workers and consumer steps are idempotent to tolerate retries safely."
        ]
    })

# Fill remaining up to 100 with diverse domain problems
SUPPLEMENTARY_TOPICS = [
    ("iot_smart_metering", "Design Smart Grid / Power Meter Telemetry Ingest", "⚡", "distributed", "100M Smart Meters", "1,000,000 Metrics/Sec", "Hard", "Ingest and process nationwide smart electricity meter readings every 15 minutes with time-series downsampling."),
    ("e_signature_docusign", "Design DocuSign / Cryptographic Contract Signing", "✍️", "fintech", "10M Signed Documents/Mo", "5,000 Signs/Sec", "Hard", "Build a secure digital signature workflow with PKI certificate validation, audit trails, and tamper-evident PDF hashing."),
    ("telemedicine_webrtc", "Design Teladoc / HIPAA-Compliant Video Doctor Visit", "🩺", "real_time", "1M Daily Consultations", "50,000 Live Sessions", "Hard", "Construct an encrypted, HIPAA-compliant telehealth video platform with WebRTC SFU streaming and clinical record storage."),
    ("live_auction_ebay", "Design eBay / Live Real-Time Bidding Auction", "🏷️", "real_time", "100k Bids/Sec on Hot Items", "100,000 Bids/Sec", "Hard", "Design a real-time auction bidding engine with millisecond countdown timers, optimistic locking, and automatic proxy bidding."),
    ("package_tracking_ups", "Design UPS / Global Package Milestone Tracking", "📦", "real_time", "50M Daily Shipments", "200,000 Scans/Sec", "Medium", "Build an end-to-end package tracking system updating delivery milestones from sorting hub barcode scans in real time."),
    ("smart_home_iot_hub", "Design Smart Home IoT Automation Gateway", "💡", "real_time", "50M Connected Smart Devices", "500,000 Events/Sec", "Medium", "Design a low-latency IoT message broker and rules engine executing automation routines across millions of smart home appliances."),
    ("dns_ddos_scrubber", "Design Cloudflare / Anycast BGP DDoS Scrubber", "🛡️", "distributed", "100Tbps DDoS Attack Absorption", "50,000,000 Packets/Sec", "Staff+", "Construct a globally distributed DDoS mitigation engine using eBPF/XDP kernel packet filtering and BGP Anycast routing."),
    ("shazam_audio_recognition", "Design Shazam / Audio Fingerprint Matching Engine", "🎵", "big_tech", "100M Songs Identified/Day", "50,000 Match QPS", "Hard", "Build an acoustic fingerprint identification engine using spectrogram peak hashing and inverted index lookups in sub-1 second."),
    ("ride_hailing_fare_calc", "Design Lyft / Upfront Dynamic Fare Estimation", "🚕", "real_time", "500k Fare Quotes/Min", "25,000 Fare QPS", "Medium", "Design a dynamic ride fare calculation service combining base rates, distance matrix estimates, traffic congestion, and surge multipliers."),
    ("cloud_vpn_mesh", "Design Tailscale / WireGuard Virtual Mesh Network", "🔒", "distributed", "10M Connected Mesh Nodes", "1,000,000 P2P Tunnels", "Hard", "Design a peer-to-peer zero-config VPN mesh network using DERP relay fallbacks, NAT traversal (STUN/ICE), and WireGuard cryptography."),
    ("food_delivery_driver_routing", "Design DoorDash / Multi-Stop Driver Route Optimizer", "🛵", "real_time", "5M Deliveries/Day", "50,000 Routes/Min", "Hard", "Construct an automated vehicle routing engine optimizing driver pickups and multi-restaurant drop-offs to minimize delivery times."),
    ("online_chess_engine", "Design Real-Time Multiplayer Chess State Machine", "♟️", "real_time", "10M Concurrent Matches", "100,000 Moves/Sec", "Medium", "Design a stateful multiplayer turn-based game engine with move validation, clock synchronization, and anti-cheat telemetry."),
    ("content_moderation_ai", "Design Meta / Automated Image & Video Safety Moderation", "🛡️", "big_tech", "1B Uploads Scanned/Day", "150,000 Media/Sec", "Hard", "Build a high-throughput content moderation pipeline using asynchronous computer vision models, perceptual hashing, and quarantine queues."),
    ("memcached_slab_allocator", "Design Memcached / Multithreaded In-Memory Key-Value", "💾", "distributed", "Zero Fragmentation In-Memory Storage", "2,000,000 OPS/Sec", "Staff+", "Design a high-performance multithreaded caching daemon with slab memory allocation, LRU list management, and lock striping."),
    ("credit_scoring_engine", "Design Experian / Real-Time Credit Score Calculation", "💳", "fintech", "Sub-100ms Credit Score Generation", "10,000 Queries/Sec", "Staff+", "Build a credit bureau calculation engine aggregating loan payment histories, credit utilization ratios, and public record databases."),
    ("telecom_sms_gateway", "Design Twilio / Global Telecom SMS SMPP Gateway", "📱", "distributed", "1B SMS Dispatched/Day", "50,000 SMS/Sec", "Hard", "Design a high-throughput telecom messaging gateway interfacing with global mobile carrier SMPP protocols with delivery receipts."),
    ("realtime_audio_translation", "Design Google Translate / Real-Time Voice Translation", "🗣️", "big_tech", "Real-Time Streaming Speech-to-Speech", "25,000 Voice Streams", "Staff+", "Construct a low-latency speech-to-speech translation pipeline using streaming ASR, neural machine translation, and text-to-speech synthesis."),
    ("multi_region_active_active", "Design Multi-Region Active-Active Database Architecture", "🌐", "distributed", "99.999% SLA Global Fault Tolerance", "100,000 Global QPS", "Staff+", "Design an active-active multi-region data replication topology resolving cross-region conflicts via Last-Write-Wins and CRDTs."),
    ("people_you_may_know", "Design Facebook / People You May Know Recommendation", "👥", "big_tech", "3B User Social Graph", "100,000 Graph QPS", "Hard", "Build a friend recommendation engine evaluating mutual friend counts, school/workplace clusters, and graph community detection algorithms."),
    ("ml_feature_store_feast", "Design Machine Learning Feature Store (Feast/Redis)", "🤖", "distributed", "Low-Latency Online Feature Retrieval", "200,000 Features/Sec", "Hard", "Design an enterprise ML feature store providing point-in-time correct training data and sub-5ms online inference feature lookups."),
    ("smart_thermostat_iot", "Design Nest / Smart HVAC Energy Scheduling", "🌡️", "real_time", "20M Connected Thermostats", "100,000 Pings/Sec", "Medium", "Build an automated smart home temperature optimization system analyzing weather forecasts, occupancy sensors, and utility peak pricing."),
    ("digital_signature_pki", "Design Cloud Cryptographic PKI Certificate Authority", "🔐", "fintech", "Automated TLS & Code Signing", "10,000 Certs/Min", "Staff+", "Design a private PKI certificate authority automating ACME protocol issuance, CRL distribution, and Hardware Security Module (HSM) keys."),
    ("ll_hls_low_latency_video", "Design Twitch / Ultra Low-Latency LL-HLS Video Transcoder", "📺", "real_time", "Sub-2s Glass-to-Glass Live Latency", "100,000 Live Streams", "Staff+", "Construct an ultra-low latency live video streaming delivery pipeline using chunked CMAF segments, LL-HLS manifests, and HTTP/3."),
    ("distributed_job_celery", "Design Celery / Distributed Background Task Worker Pool", "⚙️", "distributed", "500M Background Tasks/Day", "100,000 Tasks/Sec", "Medium", "Build a distributed background worker cluster with rate limiting, task retries with exponential backoff, and prefetch optimization."),
    ("stock_portfolio_pnl", "Design Robinhood / Real-Time Portfolio PnL Calculation", "📈", "fintech", "Live Mark-to-Market Asset Valuations", "100,000 Portfolios/Sec", "Hard", "Design a real-time portfolio valuation engine that recalculates realized and unrealized gain/loss as live market stock ticks arrive."),
    ("rideshare_driver_onboard", "Design Lyft / Driver Background Check OCR Verification", "📑", "real_time", "Automated ID & Vehicle Inspection", "10,000 Drivers/Day", "Medium", "Build an asynchronous driver onboarding verification pipeline performing driver license OCR, DMV record checks, and fraud screening."),
    ("anti_spam_email_filter", "Design Gmail / Real-Time Anti-Spam & Phishing Filter", "📧", "big_tech", "100B Emails Scanned/Day", "1,000,000 Emails/Sec", "Hard", "Design a high-volume email classification pipeline evaluating DKIM/SPF signatures, Bayes heuristics, and deep learning spam models."),
    ("flight_tracker_radar", "Design FlightRadar24 / Global ADS-B Aircraft Tracking", "✈️", "real_time", "200k Active Aircraft in Airspace", "100,000 ADS-B Pings/Sec", "Medium", "Build a real-time global flight radar tracking aircraft positions using crowdsourced ADS-B receiver telemetry and geospatial indexes."),
    ("automated_parking_gate", "Design Smart Parking / Automated ANPR License Plate Gate", "🅿️", "real_time", "Sub-500ms License Plate Gate Lift", "5,000 Vehicles/Hour", "Medium", "Design an automated parking barrier control system using edge camera ANPR optical character recognition and contactless payment processing."),
    ("hadoop_hdfs_storage", "Design Hadoop HDFS / Distributed Big Data File System", "📁", "distributed", "Petabyte Scale Analytics Data Lake", "100,000 Block OPS", "Staff+", "Construct a distributed file system architecture with NameNode active/standby metadata journaling and block replication across DataNodes."),
    ("online_survey_polling", "Design Slido / Live Interactive Conference Polling", "📊", "real_time", "100k Simultaneous Live Voters in 1 Room", "100,000 Votes/Sec", "Medium", "Design a real-time live audience polling engine using Redis HyperLogLog for unique vote counting and WebSocket live graph broadcasting."),
    ("podcasts_distribution", "Design Apple Podcasts / Global RSS Audio Ingestion", "🎙️", "big_tech", "5M Podcast Feeds Monitored", "50,000 Feed Polls/Min", "Medium", "Build a high-volume podcast feed aggregator with polling schedules, audio chapter indexing, and global CDN caching."),
    ("car_rental_reservation", "Design Hertz / Global Car Rental Fleet Reservation", "🚗", "fintech", "500k Rental Vehicles Worldwide", "10,000 Bookings/Hour", "Medium", "Design an availability reservation system managing vehicle categories, airport location inventories, and insurance add-ons."),
    ("notion_block_editor", "Design Notion / Block-Based Collaborative Workspace", "📝", "real_time", "100M Block Mutations/Day", "50,000 Block Writes/Sec", "Hard", "Construct a block-level collaborative document database using tree-structured page hierarchies and real-time transaction broadcast."),
    ("supply_chain_track", "Design DHL / Global Shipping Container Milestone Tracker", "🚢", "real_time", "10M Active Ocean Containers", "50,000 IoT Events/Sec", "Medium", "Build an IoT and customs milestone tracking pipeline calculating estimated time of arrival (ETA) predictions based on weather data."),
    ("microservices_mesh_envoy", "Design Istio / Kubernetes Microservice Mesh Ingress", "🕸️", "distributed", "100,000 Microservice Pods", "5,000,000 Mesh RPS", "Staff+", "Design a cloud-native service mesh control plane (Istio Pilot) dynamically configuring Envoy sidecar proxies with mTLS and telemetry."),
    ("continuous_delivery_argo", "Design ArgoCD / Declarative GitOps Deployment Controller", "🚀", "distributed", "10,000 K8s Clusters Managed", "1,000 Syncs/Min", "Hard", "Build a GitOps continuous delivery controller that continuously reconciles live Kubernetes cluster state with Git repositories."),
    ("telecom_cell_handoff", "Design 5G / High-Speed Cellular Base Station Handoff", "📡", "distributed", "Sub-10ms Cell Tower Tower Transition", "500,000 Handoffs/Sec", "Staff+", "Design a mobile telecom mobility management entity (MME) coordinating seamless voice and data connection handoffs across 5G cell towers."),
    ("multiplayer_elo_match", "Design Valorant / Skill-Based ELO Matchmaking Queue", "🎯", "real_time", "5M Players in Matchmaking Pool", "100,000 Match Pairs/Min", "Hard", "Construct a low-latency game matchmaking queue optimizing player rank (MMR/ELO), ping latency (<30ms), and group party sizes."),
    ("web_screenshot_api", "Design Headless Chrome / Distributed Screenshot Cluster", "📸", "distributed", "1M High-Resolution Web Captures/Day", "500 Concurrent Browsers", "Medium", "Build an elastic rendering fleet using headless Chromium instances with ad-blocking, font rendering, and PNG upload to S3."),
    ("eventbridge_bus", "Design AWS EventBridge / Schema-Validated Serverless Event Bus", "⚡", "distributed", "1M Events Filtered & Routed/Sec", "1,000,000 Events/Sec", "Hard", "Design a serverless event router applying content-based JSON schema filtering, dead-letter archiving, and fan-out to 50+ target services."),
    ("crypto_order_book", "Design Binance / High-Frequency Crypto Order Book", "🪙", "fintech", "Sub-Millisecond Crypto Trades", "500,000 Orders/Sec", "Staff+", "Construct a high-throughput cryptocurrency spot exchange matching engine with WebSocket market feeds and memory-mapped state journals."),
    ("netflix_vector_ann_rec", "Design Netflix / Vector Embedding Recommendation Engine", "🎬", "big_tech", "Approximate Nearest Neighbor (ANN)", "200,000 Recs/Sec", "Staff+", "Build a real-time movie recommendation service utilizing user/item embedding vectors, HNSW index graphs, and Milvus vector DB."),
    ("dynamodb_partition_router", "Design DynamoDB / Distributed Partition Key Router", "🗄️", "distributed", "100M Partition Range Partitions", "10,000,000 IOPS", "Staff+", "Construct a horizontally partitioned distributed NoSQL storage engine with B-tree range partitions, Consistent Hashing, and Paxos replicas."),
    ("canary_traffic_router", "Design Cloud Canary Traffic Router & Rollback Controller", "🚀", "distributed", "Automated Zero-Downtime Traffic Shift", "500,000 Mesh RPS", "Hard", "Design an automated canary rollout controller that evaluates error rate SLOs and dynamically shifts 1% to 100% traffic via Envoy."),
    ("database_connection_pooler", "Design High-Performance SQL Connection Pooler (PgBouncer)", "🔌", "distributed", "50,000 Client Sockets -> 500 DB Connections", "500,000 Tx/Sec", "Hard", "Build a high-concurrency database connection proxy utilizing epoll event loops, transaction pooling, and zero thread-per-connection overhead.")
]

for item in SUPPLEMENTARY_TOPICS:
    if len(generated_scenarios) >= 100:
        break
    cat = item[3]
    nodes = build_nodes(cat, item[1])
    seq = [n[0] for n in nodes]
    generated_scenarios.append({
        "id": item[0],
        "title": item[1],
        "badge": item[2],
        "category": cat,
        "categoryLabel": CAT_MAP[cat],
        "scaleMetric": item[4],
        "qps": item[5],
        "difficulty": item[6],
        "goal": item[7],
        "availableNodes": [{"id": n[0], "name": n[1], "icon": n[2], "role": n[3]} for n in nodes],
        "correctSequence": seq,
        "explanation": f"1. Ingress traffic reaches edge gateway. 2. Auth and rate limit checks execute. 3. Domain service computes state machine. 4. In-memory caching minimizes latency. 5. Kafka event queue absorbs bursts. 6. Primary database guarantees persistence.",
        "keyDesignTakeaways": [
            f"Isolate high-frequency query paths with distributed in-memory caching.",
            f"Use asynchronous event buffering to protect downstream databases during peak traffic spikes.",
            f"Implement idempotent processing to guarantee zero side effects on network retries."
        ]
    })

print(f"Generated exactly {len(generated_scenarios)} system design scenarios!")

# Write file
ts_output = f"""// Generated System Design Scenarios (100 Scenarios) inspired by HelloInterview Problem Breakdowns
export interface PuzzleScenario {{
  id: string;
  title: string;
  badge: string;
  category: 'big_tech' | 'fintech' | 'real_time' | 'distributed';
  categoryLabel: string;
  scaleMetric: string;
  qps: string;
  difficulty: 'Medium' | 'Hard' | 'Staff+';
  goal: string;
  availableNodes: {{ id: string; name: string; icon: string; role: string }}[];
  correctSequence: string[];
  explanation: string;
  keyDesignTakeaways: string[];
}}

export const SYSTEM_DESIGN_PUZZLES: PuzzleScenario[] = {json.dumps(generated_scenarios, indent=2)};
"""

with open('src/data/systemDesignPuzzlesData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_output)

print("Saved to src/data/systemDesignPuzzlesData.ts successfully!")
