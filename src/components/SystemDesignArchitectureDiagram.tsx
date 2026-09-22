import React, { useState } from 'react';

export interface SystemDesignDiagramProps {
  systemType?:
    | 'url-shortener'
    | 'blob-sync'
    | 'inventory-reservation'
    | 'feed-fanout'
    | 'geospatial-dispatch'
    | 'realtime-chat'
    | 'stream-analytics'
    | 'rate-limiter'
    | 'video-pipeline'
    | 'execution-sandbox'
    | 'distributed-ledger'
    | 'crawler-frontier'
    | 'in-memory-cache'
    | 'job-scheduler'
    | 'online-auction'
    | 'post-search'
    | 'notification-system'
    | 'chatgpt-gateway'
    | 'key-value-store'
    | 'distributed-storage'
    | 'search-engine'
    | 'vector-tiles';
  title?: string;
  initialTab?: string;
}

interface NodeDetail {
  title: string;
  role: string;
  underTheHood: string;
  gotcha: string;
  tags: string[];
}

interface NodeItem {
  id: string;
  label: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  detail: NodeDetail;
}

interface PathItem {
  from: string;
  to: string;
  d: string;
  color: string;
  label?: string;
  tabKey?: string;
}

interface PresetConfig {
  defaultTitle: string;
  tabs: { id: string; label: string; color: string; description: string }[];
  metrics: { label: string; value: string; color: string }[];
  nodes: NodeItem[];
  paths: PathItem[];
}

const PRESETS: Record<string, PresetConfig> = {
  'url-shortener': {
    defaultTitle: 'URL Shortener System Topology & Data Flow',
    tabs: [
      { id: 'write', label: 'Write Path (Shorten)', color: '#38bdf8', description: 'User submits long URL -> Token Generator (KGS) allocates Base62 ID -> Writes to DB & Warm Cache' },
      { id: 'read', label: 'Read Path (Redirect)', color: '#34d399', description: 'Client hits short URL -> CDN / Redis Cache lookup -> 301 vs 302 redirect response' },
      { id: 'analytics', label: 'Analytics Async Stream', color: '#fbbf24', description: 'Kafka click event pipeline -> Flink click counter -> OLAP store' },
    ],
    metrics: [
      { label: 'Read QPS', value: '100K/sec', color: '#34d399' },
      { label: 'Write QPS', value: '1K/sec', color: '#38bdf8' },
      { label: 'Latency SLA', value: '< 15ms', color: '#fbbf24' },
      { label: '5-Yr Storage', value: '~15 TB', color: '#a78bfa' },
    ],
    nodes: [
      { id: 'client', label: 'Client / App', subtitle: 'Browser / Mobile', x: 20, y: 55, w: 90, h: 48, color: '#38bdf8', detail: { title: 'Client Gateway Entrypoint', role: 'Issues POST /api/v1/urls or GET /{shortCode}', underTheHood: 'HTTP keep-alive connections; follows 301/302 Location header without re-entering application layers if browser cached.', gotcha: '301 redirects are cached aggressively by browsers, blinding internal analytics to subsequent clicks.', tags: ['HTTP/2', 'Redirects', 'Browser Cache'] } },
      { id: 'lb', label: 'API Gateway', subtitle: 'Envoy / NGINX', x: 145, y: 55, w: 95, h: 48, color: '#38bdf8', detail: { title: 'L7 Load Balancer & Rate Limiter', role: 'TLS termination, path-based routing, IP throttling', underTheHood: 'Consistent hashing or round-robin upstream dispatch. Enforces token bucket limits before hitting internal microservices.', gotcha: 'Thundering herd when Redis cache expires during viral marketing campaigns.', tags: ['TLS 1.3', 'Rate Limiting', 'Envoy'] } },
      { id: 'app', label: 'URL Service', subtitle: 'Stateless Golang/Java', x: 275, y: 55, w: 100, h: 48, color: '#34d399', detail: { title: 'URL Shortener Core Engine', role: 'Encodes URLs via Range-based KGS or MD5 Base62 truncation', underTheHood: 'Fetches pre-allocated ID ranges from Key Generation Service (KGS) into local memory. Fast bitwise Base62 encoding in sub-millisecond.', gotcha: 'If instances crash, unused ranges in memory are lost, creating minor numeric gaps in the 62^7 sequence.', tags: ['Base62', 'KGS Range', 'Stateless'] } },
      { id: 'cache', label: 'Redis Cache', subtitle: 'Cluster (LRU)', x: 410, y: 15, w: 95, h: 48, color: '#fbbf24', detail: { title: 'Distributed Memory Cache', role: 'Caches hot shortCode -> longUrl mappings (80/20 rule)', underTheHood: 'Redis hash table lookup with volatile-lru eviction. Sub-millisecond reads prevent relational DB saturation.', gotcha: 'Cache penetration from random non-existent short keys. Requires Bloom filter check before querying database.', tags: ['Redis', 'Bloom Filter', 'LRU'] } },
      { id: 'db', label: 'Primary DB', subtitle: 'Postgres / DynamoDB', x: 410, y: 95, w: 95, h: 48, color: '#a78bfa', detail: { title: 'Persistent Storage Store', role: 'Durable record of short_code, long_url, user_id, created_at', underTheHood: 'B+Tree primary key index on short_code. Read replicas across availability zones with write master.', gotcha: 'Write amplification on index maintenance when sharding across multiple database partitions.', tags: ['B+Tree', 'Primary Key', 'Replication'] } },
      { id: 'kafka', label: 'Kafka / Flink', subtitle: 'Click Analytics', x: 275, y: 140, w: 100, h: 48, color: '#f97316', detail: { title: 'Async Click Event Ingestion', role: 'Buffers click payloads (IP, timestamp, user agent, referrer)', underTheHood: 'Decoupled asynchronous logging path; consumer groups aggregate click counts in 1-minute tumbling windows into ClickHouse.', gotcha: 'Consumer lag during traffic spikes can delay real-time creator analytics dashboards.', tags: ['Kafka', 'Tumbling Window', 'ClickHouse'] } },
    ],
    paths: [
      { from: 'client', to: 'lb', d: 'M 110 79 L 140 79', color: '#38bdf8', label: 'Request' },
      { from: 'lb', to: 'app', d: 'M 240 79 L 270 79', color: '#38bdf8', label: 'Route' },
      { from: 'app', to: 'cache', d: 'M 355 55 L 405 35', color: '#fbbf24', label: 'Cache Lookup' },
      { from: 'app', to: 'db', d: 'M 355 90 L 405 110', color: '#a78bfa', label: 'DB Write/Read' },
      { from: 'app', to: 'kafka', d: 'M 325 103 L 325 135', color: '#f97316', label: 'Log Event' },
    ],
  },
  'inventory-reservation': {
    defaultTitle: 'High-Concurrency Inventory Reservation Pipeline',
    tabs: [
      { id: 'reserve', label: 'Reservation Phase (CAS)', color: '#38bdf8', description: 'Atomic stock deduction via Redis Lua script with 10-minute hold TTL' },
      { id: 'commit', label: 'Checkout & Commit', color: '#34d399', description: 'Payment success triggers DB commit and outbox message' },
      { id: 'rollback', label: 'TTL Expiry / Rollback', color: '#f87171', description: 'Expired hold returns stock to pool via Redis keyspace notification or delayed task' },
    ],
    metrics: [
      { label: 'Peak QPS', value: '250K/sec', color: '#f87171' },
      { label: 'Hold TTL', value: '600 sec', color: '#fbbf24' },
      { label: 'Consistency', value: 'Strict ACID', color: '#34d399' },
      { label: 'Double Booking', value: '0.00%', color: '#38bdf8' },
    ],
    nodes: [
      { id: 'client', label: 'Shoppers', subtitle: 'Web / App', x: 20, y: 55, w: 90, h: 48, color: '#38bdf8', detail: { title: 'Concurrent Users Pool', role: 'Attempts to reserve flash-sale items or concert seats', underTheHood: 'Clients pass idempotency tokens generated during cart initiation to prevent double submission.', gotcha: 'Client retries during network timeouts can generate duplicate order attempts without idempotency keys.', tags: ['Idempotency', 'Token', 'Burst'] } },
      { id: 'queue', label: 'Virtual Queue', subtitle: 'Waiting Room', x: 145, y: 55, w: 95, h: 48, color: '#fbbf24', detail: { title: 'Fair-Share Virtual Waiting Room', role: 'Throttles traffic influx using cryptographic queue tickets', underTheHood: 'Assigns signed JWT queue position. Releases users into booking backend in deterministic batches matched to system capacity.', gotcha: 'Session hijacking if queue pass tokens are not securely tied to user session credentials.', tags: ['Virtual Queue', 'JWT', 'Backpressure'] } },
      { id: 'redis', label: 'Redis Cluster', subtitle: 'Lua Stock Ledger', x: 275, y: 55, w: 105, h: 48, color: '#f87171', detail: { title: 'In-Memory Atomic CAS Reservation', role: 'Executes atomic stock check-and-decrement with automatic expiration', underTheHood: 'Single-threaded Lua script guarantees atomicity without distributed locks. Sets temporary hold key with 10-minute TTL.', gotcha: 'Redis master failover can lose unflushed in-memory reservations if asynchronous replication lags.', tags: ['Lua Script', 'CAS', 'Keyspace TTL'] } },
      { id: 'order', label: 'Order Service', subtitle: 'Saga Coordinator', x: 415, y: 55, w: 95, h: 48, color: '#34d399', detail: { title: 'Order Saga Orchestrator', role: 'Manages transition from Reserved to Paid to Confirmed', underTheHood: 'Coordinates payment gateway integration and database transactional outbox write.', gotcha: 'Partial failure when payment succeeds but order service fails before DB commit. Requires 2-way payment reconciliation.', tags: ['Saga', 'Outbox', 'Idempotency'] } },
      { id: 'db', label: 'Postgres DB', subtitle: 'ACID Final Ledger', x: 415, y: 135, w: 95, h: 48, color: '#a78bfa', detail: { title: 'Relational Double-Entry Database', role: 'Final source of truth for confirmed orders and inventory audits', underTheHood: 'Optimistic locking with version column (`WHERE stock >= qty AND version = :v`).', gotcha: 'Pessimistic `SELECT FOR UPDATE` causes severe database row lock contention and cascading connection pool starvation.', tags: ['Postgres', 'Optimistic Lock', 'ACID'] } },
    ],
    paths: [
      { from: 'client', to: 'queue', d: 'M 110 79 L 140 79', color: '#38bdf8', label: 'Traffic Surge' },
      { from: 'queue', to: 'redis', d: 'M 240 79 L 270 79', color: '#fbbf24', label: 'Controlled Release' },
      { from: 'redis', to: 'order', d: 'M 380 79 L 410 79', color: '#34d399', label: 'Hold Granted' },
      { from: 'order', to: 'db', d: 'M 462 103 L 462 130', color: '#a78bfa', label: 'Commit Order' },
    ],
  },
  'feed-fanout': {
    defaultTitle: 'Social Activity Feed Generation & Fan-Out Architecture',
    tabs: [
      { id: 'fanout_write', label: 'Fan-Out-on-Write (Push)', color: '#38bdf8', description: 'Standard user posts -> Background worker pushes post ID to all followers Redis timelines' },
      { id: 'fanout_read', label: 'Fan-Out-on-Read (Pull)', color: '#fbbf24', description: 'Celebrity/Superstar posts -> Stored in single celebrity inbox; merged dynamically on follower read' },
      { id: 'hybrid', label: 'Hybrid Feed Ranking', color: '#34d399', description: 'Combines pre-computed Redis timeline with real-time ML ranking model' },
    ],
    metrics: [
      { label: 'Read QPS', value: '500K/sec', color: '#34d399' },
      { label: 'Post QPS', value: '10K/sec', color: '#38bdf8' },
      { label: 'P99 Feed Latency', value: '< 80ms', color: '#fbbf24' },
      { label: 'Follower Max', value: '100M+', color: '#f87171' },
    ],
    nodes: [
      { id: 'poster', label: 'Post Author', subtitle: 'Standard or VIP', x: 20, y: 55, w: 90, h: 48, color: '#38bdf8', detail: { title: 'Post Author Client', role: 'Publishes text, media, and attachments', underTheHood: 'Media uploaded directly to S3 via pre-signed URLs; metadata and post content sent to Post API.', gotcha: 'Uploading heavy media through API gateway creates bottleneck and bloats connection memory.', tags: ['Pre-signed S3', 'HTTP/2'] } },
      { id: 'post_api', label: 'Post Service', subtitle: 'Write Ingestion', x: 145, y: 55, w: 95, h: 48, color: '#38bdf8', detail: { title: 'Post Ingestion Microservice', role: 'Validates post, saves to primary DB, emits Kafka event', underTheHood: 'Persists post row and publishes `PostCreatedEvent` with author ID and follower tier status.', gotcha: 'Synchronous fanout causes high latency write timeouts for users with many followers.', tags: ['Postgres', 'Kafka', 'Decoupled'] } },
      { id: 'fanout', label: 'Fan-out Workers', subtitle: 'Go / Celery Pool', x: 275, y: 55, w: 105, h: 48, color: '#f97316', detail: { title: 'Distributed Fan-Out Worker Pool', role: 'Queries social graph and writes post ID to follower timeline caches', underTheHood: 'Uses cursor pagination over social graph DB. Writes to Redis sorted set (`ZADD follower:feed post_id timestamp`).', gotcha: 'Celebrity thundering herd: A celebrity with 50M followers causes 50M Redis writes, choking the cluster.', tags: ['Redis ZSET', 'Graph DB', 'Worker Pool'] } },
      { id: 'redis', label: 'Timeline Cache', subtitle: 'Redis (Sorted Set)', x: 415, y: 55, w: 95, h: 48, color: '#fbbf24', detail: { title: 'In-Memory User Timelines', role: 'Maintains top 800 post IDs for active users', underTheHood: 'Redis sorted set keyed by `userId:feed` ordered by post creation timestamp.', gotcha: 'Memory bloat from inactive users. Only pre-compute feeds for users active within the last 72 hours.', tags: ['Redis ZSET', 'TTL', '800 IDs'] } },
      { id: 'ranking', label: 'Ranking Engine', subtitle: 'ML Scoring Service', x: 415, y: 135, w: 95, h: 48, color: '#34d399', detail: { title: 'Real-Time Feed Ranker', role: 'Hydrates post metadata and scores candidates via ML model', underTheHood: 'Fetches post entities from distributed cache; calculates relevance scores based on affinity, freshness, and engagement.', gotcha: 'N+1 queries when hydrating post details. Batch load using multi-get against post entity cache.', tags: ['MGET', 'ML Scoring', 'Hydration'] } },
    ],
    paths: [
      { from: 'poster', to: 'post_api', d: 'M 110 79 L 140 79', color: '#38bdf8', label: 'Publish Post' },
      { from: 'post_api', to: 'fanout', d: 'M 240 79 L 270 79', color: '#f97316', label: 'Kafka Event' },
      { from: 'fanout', to: 'redis', d: 'M 380 79 L 410 79', color: '#fbbf24', label: 'ZADD Push' },
      { from: 'redis', to: 'ranking', d: 'M 462 103 L 462 130', color: '#34d399', label: 'Read & Rank' },
    ],
  },
  'geospatial-dispatch': {
    defaultTitle: 'Real-Time Geospatial Ingestion & Dispatch Engine',
    tabs: [
      { id: 'location', label: 'Location Ingestion (Driver)', color: '#38bdf8', description: 'Driver emits GPS every 4s -> Geohash/H3 Index updated in Redis Geospatial' },
      { id: 'dispatch', label: 'Rider Request & Dispatch', color: '#34d399', description: 'Rider requests ride -> Radial search finds nearest active drivers -> State machine matching' },
      { id: 'trip', label: 'Trip Lifecycle State Machine', color: '#fbbf24', description: 'Requested -> Dispatched -> Arrived -> In Progress -> Completed' },
    ],
    metrics: [
      { label: 'Active Drivers', value: '2M+', color: '#38bdf8' },
      { label: 'Ping Interval', value: '4 sec', color: '#fbbf24' },
      { label: 'Match Latency', value: '< 200ms', color: '#34d399' },
      { label: 'Spatial Index', value: 'Uber H3 (Res 8)', color: '#a78bfa' },
    ],
    nodes: [
      { id: 'driver', label: 'Driver App', subtitle: 'GPS Stream (4s)', x: 20, y: 55, w: 90, h: 48, color: '#38bdf8', detail: { title: 'Driver Telemetry Stream', role: 'Transmits GPS lat/lng, heading, and availability status', underTheHood: 'Lightweight WebSocket or gRPC streaming connection over HTTP/2. Batches locations during poor network coverage.', gotcha: 'GPS drift and jitter in urban canyons require Kalman filtering before spatial index ingestion.', tags: ['gRPC', 'Kalman Filter', '4s Cadence'] } },
      { id: 'gateway', label: 'WS Gateway', subtitle: 'Netty / Erlang', x: 145, y: 55, w: 95, h: 48, color: '#38bdf8', detail: { title: 'Persistent Connection Gateway', role: 'Maintains long-lived duplex TCP connections for millions of drivers', underTheHood: 'Epoll-based event loop handling 50K concurrent connections per node. Publishes location updates to Kafka.', gotcha: 'File descriptor exhaustion (ulimit) and TCP keepalive timeout misconfiguration cause widespread disconnect storms.', tags: ['Epoll', 'WebSocket', 'TCP Tuning'] } },
      { id: 'redis_geo', label: 'Spatial Index', subtitle: 'Redis H3 / Geo', x: 275, y: 55, w: 105, h: 48, color: '#a78bfa', detail: { title: 'In-Memory Geospatial Index', role: 'Stores driver locations indexed by Uber H3 hexagonal cells', underTheHood: 'H3 converts coordinates into 64-bit cell integers. Neighbors are adjacent cells, enabling instant O(1) radius lookups.', gotcha: 'Hot cells in downtown centers cause CPU hotspots on single Redis shards. Shard by cell ID range.', tags: ['Uber H3', 'Hexagonal Grid', 'Redis Geo'] } },
      { id: 'matcher', label: 'Matching Engine', subtitle: 'Dispatch Service', x: 415, y: 55, w: 95, h: 48, color: '#34d399', detail: { title: 'Dynamic Dispatch & Assignment', role: 'Matches ride requests with optimal candidate drivers', underTheHood: 'Filters candidates by ETA (routing graph), driver rating, and vehicle tier. Sends dispatch offer with 15s accept timeout.', gotcha: 'Multiple riders matched to the same driver simultaneously. Requires atomic Redis distributed lock on driver ID.', tags: ['ETA Routing', 'Distributed Lock', 'Atomic Offer'] } },
      { id: 'trip_db', label: 'Trip Ledger', subtitle: 'Cassandra / Postgres', x: 415, y: 135, w: 95, h: 48, color: '#fbbf24', detail: { title: 'Trip State Machine Store', role: 'Audits trip status transitions, GPS trajectory history, and billing', underTheHood: 'Row-level state machine with strict monotonic state progression. GPS points stored as append-only time series.', gotcha: 'Split-brain in ride cancellation: Driver starts trip while rider cancels. State machine must enforce valid transitions.', tags: ['State Machine', 'Time-Series', 'Cassandra'] } },
    ],
    paths: [
      { from: 'driver', to: 'gateway', d: 'M 110 79 L 140 79', color: '#38bdf8', label: 'GPS Pings' },
      { from: 'gateway', to: 'redis_geo', d: 'M 240 79 L 270 79', color: '#a78bfa', label: 'Index Update' },
      { from: 'redis_geo', to: 'matcher', d: 'M 380 79 L 410 79', color: '#34d399', label: 'Radius Query' },
      { from: 'matcher', to: 'trip_db', d: 'M 462 103 L 462 130', color: '#fbbf24', label: 'Persist State' },
    ],
  },
  'key-value-store': {
    defaultTitle: 'Distributed Key-Value Store (Dynamo Ring & Quorum Consensus)',
    tabs: [
      { id: 'write', label: 'Quorum Write (W=2, N=3)', color: '#38bdf8', description: 'Coordinator hashes key -> Routes to N replica nodes on consistent hash ring -> Awaits W acknowledgments' },
      { id: 'read', label: 'Quorum Read & Read Repair', color: '#34d399', description: 'Coordinator queries R replicas -> Compares vector clocks / timestamps -> Asynchronously repairs stale replicas' },
      { id: 'anti_entropy', label: 'Merkle Tree & Gossip', color: '#fbbf24', description: 'Background Merkle tree exchange detects divergence between nodes with minimal network sync' },
    ],
    metrics: [
      { label: 'Write Latency', value: '< 5ms', color: '#38bdf8' },
      { label: 'Read Latency', value: '< 3ms', color: '#34d399' },
      { label: 'Quorum SLA', value: 'R+W > N', color: '#fbbf24' },
      { label: 'Replication', value: '3x Active', color: '#a78bfa' },
    ],
    nodes: [
      { id: 'client', label: 'App Client', subtitle: 'Driver / SDK', x: 20, y: 55, w: 90, h: 48, color: '#38bdf8', detail: { title: 'Client Token-Aware Driver', role: 'Maintains local ring topology map to contact primary replica directly', underTheHood: 'Token-aware routing calculates hash(key) locally, avoiding extra network hop to random coordinator.', gotcha: 'Topology changes (node join/leave) cause driver to hit stale coordinator until cluster map refreshes.', tags: ['Token-Aware', 'Murmur3', 'Pipelining'] } },
      { id: 'coord', label: 'Coordinator', subtitle: 'Dynamic Ring Node', x: 145, y: 55, w: 95, h: 48, color: '#38bdf8', detail: { title: 'Write/Read Coordinator Node', role: 'Sequences writes, sends parallel requests to N replicas, enforces quorum', underTheHood: 'Applies vector clock or Client-side timestamp. Gathers responses; returns success once W acknowledgments arrive.', gotcha: 'Coordinator failure mid-write leaves replicas in divergent states until read repair or hinted handoff.', tags: ['Coordinator', 'Vector Clock', 'Quorum'] } },
      { id: 'rep1', label: 'Replica A (LSM)', subtitle: 'Primary Node (Memtable)', x: 280, y: 15, w: 105, h: 48, color: '#34d399', detail: { title: 'Replica Node A (LSM Storage Engine)', role: 'Appends to CommitLog (WAL), writes to Memtable, flushes SSTables', underTheHood: 'SSTables indexed by Bloom filter and Summary index. Background compactions merge sorted runs.', gotcha: 'Read amplification if compaction falls behind and read must probe dozens of SSTables.', tags: ['LSM Tree', 'CommitLog', 'Bloom Filter'] } },
      { id: 'rep2', label: 'Replica B (LSM)', subtitle: 'Secondary Node', x: 280, y: 95, w: 105, h: 48, color: '#34d399', detail: { title: 'Replica Node B (Peer Quorum)', role: 'Participates in R/W quorum and background Gossip failure detection', underTheHood: 'Exchanges heartbeat states every 1s using Phi Accrual failure detector algorithm.', gotcha: 'Network partition isolating Replica B triggers sloppy quorum on healthy peers.', tags: ['Gossip', 'Phi Accrual', 'Replication'] } },
      { id: 'rep3', label: 'Replica C (LSM)', subtitle: 'Tertiary Node', x: 415, y: 55, w: 100, h: 48, color: '#fbbf24', detail: { title: 'Replica Node C (Anti-Entropy)', role: 'Maintains range Merkle trees for rapid divergence resolution', underTheHood: 'Hashes key ranges into binary tree; exchanges root hashes with peers to identify out-of-sync blocks.', gotcha: 'Full Merkle tree rebuilds during heavy write traffic cause CPU and disk I/O spikes.', tags: ['Merkle Tree', 'Anti-Entropy', 'Hinted Handoff'] } },
    ],
    paths: [
      { from: 'client', to: 'coord', d: 'M 110 79 L 140 79', color: '#38bdf8', label: 'PUT / GET' },
      { from: 'coord', to: 'rep1', d: 'M 240 65 L 275 39', color: '#34d399', label: 'Replicate 1' },
      { from: 'coord', to: 'rep2', d: 'M 240 85 L 275 110', color: '#34d399', label: 'Replicate 2' },
      { from: 'coord', to: 'rep3', d: 'M 240 79 L 410 79', color: '#fbbf24', label: 'Replicate 3' },
    ],
  },
  'distributed-storage': {
    defaultTitle: 'Distributed File System (GFS / HDFS Master-Chunk Architecture)',
    tabs: [
      { id: 'write', label: 'Append Pipeline (Pipelined DMA)', color: '#38bdf8', description: 'Client receives Chunkserver replicas from Master -> Pushes data down network chain -> Primary commits' },
      { id: 'read', label: 'Chunk Read (Master Index)', color: '#34d399', description: 'Client queries Master for 64MB chunk location -> Directly streams bytes from closest Chunkserver' },
      { id: 'heartbeat', label: 'Master Heartbeat & GC', color: '#fbbf24', description: 'Chunkservers report block state via periodic heartbeats; master reconciles under-replicated chunks' },
    ],
    metrics: [
      { label: 'Chunk Size', value: '64 MB', color: '#38bdf8' },
      { label: 'Replication', value: '3x Rack-Aware', color: '#34d399' },
      { label: 'Throughput', value: 'Multi-GB/s', color: '#fbbf24' },
      { label: 'Metadata Memory', value: '64B / Chunk', color: '#a78bfa' },
    ],
    nodes: [
      { id: 'client', label: 'DFS Client', subtitle: 'Streaming SDK', x: 20, y: 55, w: 90, h: 48, color: '#38bdf8', detail: { title: 'Distributed File Client', role: 'Calculates chunk index = offset / 64MB, streams data over TCP', underTheHood: 'Caches chunk locations; bypasses master for all actual file data byte transfers.', gotcha: 'Client buffer caching without fsync can lose uncommitted appends during client crash.', tags: ['Zero-Copy', 'Pipelining', '64MB Chunks'] } },
      { id: 'master', label: 'Active Master', subtitle: 'NameNode / RAM', x: 145, y: 15, w: 95, h: 48, color: '#a78bfa', detail: { title: 'Active Master / NameNode', role: 'Maintains namespace tree, file-to-chunk mapping, and chunkserver locations', underTheHood: 'Entire metadata state held in RAM. Mutations appended to disk Operation Log (WAL) with periodic checkpoints.', gotcha: 'Master memory capacity limits total cluster files. Storing billions of tiny files exhausts master RAM.', tags: ['In-Memory', 'WAL', 'Operation Log'] } },
      { id: 'chunk1', label: 'Primary Chunk', subtitle: 'Chunkserver 1', x: 275, y: 55, w: 105, h: 48, color: '#38bdf8', detail: { title: 'Primary Replica Chunkserver', role: 'Leased chunk coordinator; grants sequential offsets to concurrent record appends', underTheHood: 'Receives 60s lease from Master. Dictates exact byte ordering to secondary replicas.', gotcha: 'Network split causing lease expiration while primary continues accepting appends creates duplicate padding.', tags: ['Chunk Lease', 'Append-Only', 'Sequential'] } },
      { id: 'chunk2', label: 'Secondary A', subtitle: 'Chunkserver 2', x: 415, y: 25, w: 95, h: 48, color: '#34d399', detail: { title: 'Secondary Chunkserver (Rack 1)', role: 'Receives pipelined data blocks from primary; sends TCP ack back down chain', underTheHood: 'Stores chunks as standard Linux files on local ext4/XFS filesystem. Computes 32-bit checksums per 64KB block.', gotcha: 'Silent bit rot on commodity hard drives detected during block scanner checksum verification.', tags: ['Checksum', 'Rack-Aware', 'Secondary'] } },
      { id: 'chunk3', label: 'Secondary B', subtitle: 'Chunkserver 3', x: 415, y: 105, w: 95, h: 48, color: '#34d399', detail: { title: 'Secondary Chunkserver (Rack 2)', role: 'Cross-rack replica ensuring data survival in complete power or switch loss', underTheHood: 'Master places 2 replicas on same rack, 1 replica on remote rack for cross-switch fault tolerance.', gotcha: 'Cross-rack replication consumes inter-switch datacenter bisection bandwidth.', tags: ['Cross-Rack', 'Bisection BW', 'Fault Tolerance'] } },
    ],
    paths: [
      { from: 'client', to: 'master', d: 'M 85 55 L 140 35', color: '#a78bfa', label: 'Get Metadata' },
      { from: 'client', to: 'chunk1', d: 'M 110 79 L 270 79', color: '#38bdf8', label: 'Stream Data' },
      { from: 'chunk1', to: 'chunk2', d: 'M 380 65 L 410 45', color: '#34d399', label: 'Pipeline Forward' },
      { from: 'chunk2', to: 'chunk3', d: 'M 462 73 L 462 100', color: '#34d399', label: 'Chain Forward' },
    ],
  },
};

export default function SystemDesignArchitectureDiagram({
  systemType = 'url-shortener',
  title,
  initialTab,
}: SystemDesignDiagramProps): React.JSX.Element {
  const preset = PRESETS[systemType] ?? PRESETS['url-shortener'];
  const displayTitle = title ?? preset.defaultTitle;
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? preset.tabs[0]?.id ?? 'write');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const selNode = preset.nodes.find((n) => n.id === selectedNode) ?? null;
  const activeTabMeta = preset.tabs.find((t) => t.id === activeTab) ?? preset.tabs[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '24px 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .sys-design-grid { grid-template-columns: 1fr !important; }
          .sys-metrics-row { flex-direction: column !important; }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '14px' }}>
          {displayTitle}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#38bdf8', background: '#38bdf818', border: '1px solid #38bdf840', borderRadius: '6px', padding: '2px 8px', fontWeight: 600 }}>
          Interactive Topology
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Metric cards row */}
        <div className="sys-metrics-row" style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {preset.metrics.map((m) => (
            <div
              key={m.label}
              style={{
                flex: 1,
                background: `${m.color}0e`,
                border: `1px solid ${m.color}35`,
                borderRadius: '8px',
                padding: '8px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: m.color, marginTop: '2px' }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {preset.tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '11.5px',
                background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Description Callout */}
        {activeTabMeta && (
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--ifm-color-content-secondary)',
              background: `${activeTabMeta.color}0a`,
              borderLeft: `3px solid ${activeTabMeta.color}`,
              padding: '6px 12px',
              borderRadius: '0 6px 6px 0',
              marginBottom: '14px',
            }}
          >
            <strong style={{ color: activeTabMeta.color }}>Active Scenario: </strong>
            {activeTabMeta.description}
          </div>
        )}

        {/* Split pane: SVG Graph & Node Detail Inspector */}
        <div className="sys-design-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '14px', alignItems: 'start' }}>
          {/* SVG Canvas */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 530 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="arr-blue" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                </marker>
                <marker id="arr-green" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
                </marker>
                <marker id="arr-amber" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
                </marker>
                <marker id="arr-purple" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#a78bfa" />
                </marker>
                <marker id="arr-orange" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#f97316" />
                </marker>
              </defs>

              {/* Conduits & Flowing Arrow Paths */}
              {preset.paths.map((p, idx) => {
                const markerMap: Record<string, string> = {
                  '#38bdf8': 'url(#arr-blue)',
                  '#34d399': 'url(#arr-green)',
                  '#fbbf24': 'url(#arr-amber)',
                  '#a78bfa': 'url(#arr-purple)',
                  '#f97316': 'url(#arr-orange)',
                };
                const markerEnd = markerMap[p.color] || 'url(#arr-blue)';

                return (
                  <g key={`path-${idx}`}>
                    {/* Background solid conduit */}
                    <path d={p.d} fill="none" stroke={`${p.color}30`} strokeWidth="2.5" />
                    {/* Flowing dashed animated overlay */}
                    <path
                      d={p.d}
                      fill="none"
                      stroke={p.color}
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="interactive-diagram-flowing-path"
                      markerEnd={markerEnd}
                    />
                  </g>
                );
              })}

              {/* Node Rectangles */}
              {preset.nodes.map((n) => {
                const isSelected = selectedNode === n.id;
                return (
                  <g
                    key={n.id}
                    onClick={() => setSelectedNode(isSelected ? null : n.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.w}
                      height={n.h}
                      rx="8"
                      fill={isSelected ? `${n.color}25` : `${n.color}12`}
                      stroke={n.color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={n.x + n.w / 2}
                      y={n.y + 20}
                      textAnchor="middle"
                      fill={n.color}
                      fontSize="11"
                      fontWeight="700"
                    >
                      {n.label}
                    </text>
                    <text
                      x={n.x + n.w / 2}
                      y={n.y + 35}
                      textAnchor="middle"
                      fill="var(--ifm-color-content-secondary)"
                      fontSize="8.5"
                    >
                      {n.subtitle}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Details Inspector Panel */}
          <div
            className={`interactive-diagram-details-card ${selNode ? 'details-blue' : 'details-gray'}`}
            style={{ minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center' }}
          >
            {selNode ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color }}>
                    {selNode.detail.title}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    {selNode.detail.role}
                  </span>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Under the Hood:
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '2px 0 6px', lineHeight: 1.5 }}>
                    {selNode.detail.underTheHood}
                  </p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#f87171', textTransform: 'uppercase' }}>
                    Production Gotcha:
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '2px 0 6px', lineHeight: 1.5 }}>
                    {selNode.detail.gotcha}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selNode.detail.tags.map((t) => (
                    <code
                      key={t}
                      style={{
                        fontSize: '9.5px',
                        background: `${selNode.color}15`,
                        color: selNode.color,
                        border: `1px solid ${selNode.color}35`,
                        borderRadius: '4px',
                        padding: '1px 5px',
                      }}
                    >
                      {t}
                    </code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                  Interactive Component Inspector
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  Click any architecture node on the SVG canvas to view under-the-hood engine mechanics, failure gotchas, and runtime tags.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
