// Complete 60 Days of System Design Structured Dataset

export interface ScenarioOption {
  key: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface DayScenarioData {
  day: number;
  moduleId: number;
  title: string;
  focus: string;
  scenario: string;
  question: string;
  correctOption: string;
  options: ScenarioOption[];
  summary: string;
  docLink: string;
}

export const SYSTEM_DESIGN_60_DAYS: DayScenarioData[] = [

  {
    day: 1,
    moduleId: 1,
    title: 'Decoupling Mobile from Backend (API Gateways vs. BFF)',
    focus: 'API Gateways vs. BFF',
    scenario: 'Your iOS and Android mobile apps communicate directly with 40 internal microservices over cellular networks. When the backend team refactors user authentication and splits the profile service into two, thousands of un-updated mobile apps crash or fail to log in due to broken endpoint contracts and massive JSON payload over-fetching on mobile data.',
    question: 'How do you decouple client contract lifecycles from backend service evolution while optimizing battery and cellular bandwidth for mobile devices?',
    correctOption: 'C',
    options: [
      { key: 'A', text: 'Force app updates on every mobile client whenever backend APIs change.', isCorrect: false, explanation: 'Unacceptable mobile UX; app store review latency (24-48h) causes prolonged customer outages.' },
      { key: 'B', text: 'Deploy a shared monolithic reverse proxy that forwards all raw microservice JSON responses.', isCorrect: false, explanation: 'Still returns bloated payloads with 50+ unused fields over cellular networks.' },
      { key: 'C', text: 'Deploy dedicated Backend-for-Frontend (BFF) layers tailored to each client type (iOS/Android/Web).', isCorrect: true, explanation: 'Winner: BFF aggregates calls, aggregates responses, trims unused fields, and insulates clients from internal microservice changes.' },
      { key: 'D', text: 'Rewrite all internal microservices to use gRPC directly over mobile cellular links.', isCorrect: false, explanation: 'Mobile network proxies often strip HTTP/2 trailer headers, breaking gRPC streaming.' }
    ],
    summary: 'Why C Wins:',
    docLink: '/technical-knowledge/system-design/backend-for-frontend'
  },
  {
    day: 2,
    moduleId: 1,
    title: 'Killing the N+1 Query Problem (Eager Loading vs. DataLoaders)',
    focus: 'Eager Loading vs. DataLoaders',
    scenario: 'An API endpoint `/v1/users?limit=50` loads a list of 50 users along with their primary shipping address and active membership tier. In production, database CPU spikes to 85% at only 300 RPS because the ORM executes 1 query for the users, followed by 50 queries for addresses and 50 queries for memberships (101 SQL queries per HTTP request).',
    question: 'How do you eliminate the N+1 query problem without generating massive SQL cross-join cartesian products?',
    correctOption: 'C',
    options: [
      { key: 'A', text: 'Wrap the ORM call in a distributed cache and keep the 101 queries on cache misses.', isCorrect: false, explanation: 'Cache misses will still crush the database, especially during cache stampedes.' },
      { key: 'B', text: 'Use SQL INNER JOIN on all child tables in a single raw query.', isCorrect: false, explanation: 'Causes Cartesian product bloat if multiple 1-to-many relationships are joined simultaneously.' },
      { key: 'C', text: 'Batch ID collection via DataLoaders or two-phase SQL IN clauses (`WHERE user_id IN (...)`).', isCorrect: true, explanation: 'Winner: Batches sub-queries into O(1) bulk fetch queries, cutting 101 queries down to exactly 3.' },
      { key: 'D', text: 'Increase database connection pool size from 50 to 500.', isCorrect: false, explanation: 'Causes severe CPU context switching and lock contention on Postgres, worsening latency.' }
    ],
    summary: 'Why C Wins:',
    docLink: '/technical-knowledge/database/indexing-query-optimization'
  },
  {
    day: 3,
    moduleId: 1,
    title: 'Rate Limiting Without Boundary Bursts (Token Bucket vs. Fixed Window)',
    focus: 'Token Bucket vs. Fixed Window',
    scenario: 'A SaaS endpoint has a rate limit of 100 requests/minute. A client sends 90 requests at 12:59:58 and another 90 requests at 13:00:02. Because the fixed minute window resets at 13:00:00, both bursts pass, sending 180 requests in 4 seconds and crashing downstream databases.',
    question: 'How do you replace the limiter to prevent boundary bursts while allowing legitimate traffic flexibility and O(1) execution?',
    correctOption: 'C',
    options: [
      { key: 'A', text: 'Fixed Window with Redis INCR and 60s EXPIRE.', isCorrect: false, explanation: 'Causes the exact double-burst bug at window boundary resets.' },
      { key: 'B', text: 'Sliding Window Log storing every request timestamp in Redis ZSET.', isCorrect: false, explanation: 'O(N) memory consumption; high CPU running ZREMRANGEBYSCORE on large traffic.' },
      { key: 'C', text: 'Token Bucket with mathematical continuous refill rate (Capacity 100, Refill 1.66/s).', isCorrect: true, explanation: 'Winner: O(1) memory (2 fields), absorbs bursts up to capacity, enforces steady refill rate without boundary resets.' },
      { key: 'D', text: 'Leaky Bucket queue buffering requests at constant outflow rate.', isCorrect: false, explanation: 'Adds network latency to public clients instead of failing fast with HTTP 429.' }
    ],
    summary: 'Why C Wins:',
    docLink: '/technical-knowledge/system-design/rate-limiting-algorithms'
  },
  {
    day: 4,
    moduleId: 1,
    title: 'Preventing Duplicate Payment Charges (Idempotency Keys & Concurrency)',
    focus: 'Idempotency Keys & Concurrency',
    scenario: 'A user clicks \'Pay\' twice due to a spinning UI button. Two near-identical POST requests reach the payment service within 15ms. The customer\'s credit card is charged $200 instead of $100, and two duplicate payment rows are written to the database.',
    question: 'How do you guarantee that repeated or retried checkout requests never double-charge?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Add a unique SQL constraint on (order_id, amount).', isCorrect: false, explanation: 'External Stripe call happens before DB commit; if DB crashes after Stripe charges, money is taken without an order.' },
      { key: 'B', text: 'Client-generated Idempotency-Key stored in atomic cache before calling payment gateways.', isCorrect: true, explanation: 'Winner: Protects against both concurrent double-clicks and sequential network drop retries.' },
      { key: 'C', text: 'Put a distributed Redis lock around the checkout function.', isCorrect: false, explanation: 'Only protects concurrent calls; does nothing for retries arriving after the lock is released.' },
      { key: 'D', text: 'Wrap payment call in SERIALIZABLE database transaction.', isCorrect: false, explanation: 'Database transactions cannot rollback external third-party HTTP API charges.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/handling-contention'
  },
  {
    day: 5,
    moduleId: 1,
    title: 'Choosing a Database Sharding Strategy (Directory-Based vs. Hash)',
    focus: 'Directory-Based vs. Hash',
    scenario: 'A Postgres orders table has grown to 600 million rows. 80% of read queries are filtered by customer (`WHERE customer_id = ? AND created_at > ?`). Top 1% enterprise \'whale\' customers generate 35% of total query and write volume.',
    question: 'Which sharding strategy provides optimal read locality while allowing targeted rebalancing of individual heavy tenants?',
    correctOption: 'C',
    options: [
      { key: 'A', text: 'Hash sharding on order_id.', isCorrect: false, explanation: 'Customer queries must scatter-gather to all physical nodes, killing performance.' },
      { key: 'B', text: 'Range sharding on created_at.', isCorrect: false, explanation: 'Causes massive hot shard on the current month node where all writes and recent reads land.' },
      { key: 'C', text: 'Directory-based (lookup) sharding mapping customer_id to specific shards.', isCorrect: true, explanation: 'Winner: Reads hit exactly 1 shard; whale tenants can be moved to dedicated hardware by updating 1 mapping row.' },
      { key: 'D', text: 'Consistent hashing on customer_id with virtual nodes.', isCorrect: false, explanation: 'Lacks granular control to isolate a specific single enterprise customer without re-balancing neighbor tokens.' }
    ],
    summary: 'Why C Wins:',
    docLink: '/technical-knowledge/system-design/sharding-partitioning'
  },
  {
    day: 6,
    moduleId: 1,
    title: 'Safe Distributed Locks (Fencing Tokens & TTL Expiry)',
    focus: 'Fencing Tokens & TTL Expiry',
    scenario: 'A background worker acquires a Redis distributed lock (`SET lock:invoice:42 NX PX 5000`) to generate an invoice. A 7-second Stop-The-World JVM Garbage Collection pause occurs. During the pause, the lock TTL expires, another worker acquires the lock, and both workers write conflicting files to S3.',
    question: 'How do you prevent split-brain writes when distributed lock clients experience arbitrary network or runtime pauses?',
    correctOption: 'C',
    options: [
      { key: 'A', text: 'Increase lock TTL from 5 seconds to 10 minutes.', isCorrect: false, explanation: 'If a worker crashes, the resource remains locked for 10 minutes, stalling pipelines.' },
      { key: 'B', text: 'Use a background thread to continuously renew the lock TTL (heartbeat / watchdog).', isCorrect: false, explanation: 'Helps prevent premature expiration, but does NOT protect against GC pauses that freeze the renewal thread too.' },
      { key: 'C', text: 'Use Fencing Tokens: monotonically increasing counter validated by the storage layer on write.', isCorrect: true, explanation: 'Winner: Storage rejects writes with an older fencing token than the highest token committed so far.' },
      { key: 'D', text: 'Replace Redis with a relational database transaction.', isCorrect: false, explanation: 'Does not solve distributed locking across external storage APIs like S3 or Stripe.' }
    ],
    summary: 'Why C Wins:',
    docLink: '/technical-knowledge/redis/redis-distributed-lock'
  },
  {
    day: 7,
    moduleId: 1,
    title: 'Event Ordering (SQS FIFO & Message Group IDs)',
    focus: 'SQS FIFO & Message Group IDs',
    scenario: 'An order processing pipeline receives status events: `OrderCreated`, `OrderPaid`, and `OrderCancelled`. Because messages are processed by 20 parallel worker threads across 5 pods, `OrderPaid` occasionally executes before `OrderCreated`, causing foreign key crashes and ghost payments.',
    question: 'How do you guarantee strict causal ordering per customer order while preserving high horizontal processing concurrency?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Run a single consumer thread on a single worker node.', isCorrect: false, explanation: 'Destroys throughput; system cannot scale past 100 events/sec.' },
      { key: 'B', text: 'Partition messages using a Message Group ID / Partition Key (`order_id`) on FIFO queues or Kafka.', isCorrect: true, explanation: 'Winner: Messages with the same order_id are guaranteed strict sequential processing; distinct orders process concurrently in parallel.' },
      { key: 'C', text: 'Add timestamps to messages and sleep in the worker until older timestamps arrive.', isCorrect: false, explanation: 'Unreliable due to clock drift and unpredictable network transmission latency.' },
      { key: 'D', text: 'Store events in a database table and poll with `ORDER BY created_at`.', isCorrect: false, explanation: 'Poll table scanning creates severe database lock contention and high latency.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/message-queues'
  },
  {
    day: 8,
    moduleId: 1,
    title: 'Cache and Database Sync (Cache-Aside vs. Write-Through & CDC)',
    focus: 'Cache-Aside vs. Write-Through & CDC',
    scenario: 'An inventory service caches product stock in Redis. When an item sells out, the service updates the database and immediately updates the Redis key. Concurrent buyers under high concurrency cause the database to reflect `0`, but Redis caches `1`, leading to customer orders for out-of-stock items.',
    question: 'How do you keep cache and database consistent without race conditions during concurrent updates?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Update Redis first, then commit to database.', isCorrect: false, explanation: 'Catastrophic; if DB commit fails, cache contains phantom data that was never persisted.' },
      { key: 'B', text: 'Update database first, then delete (invalidate) the Redis cache key.', isCorrect: true, explanation: 'Winner: Cache-Aside with deletion eliminates concurrent overwrite races. Next read populates fresh data.' },
      { key: 'C', text: 'Update database and Redis within a distributed two-phase commit transaction.', isCorrect: false, explanation: 'Prohibitively slow; Redis does not support standard XA two-phase commit.' },
      { key: 'D', text: 'Set cache TTL to 1 second and never invalidate explicitly.', isCorrect: false, explanation: 'High DB load every second; stale data window still exists.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/caching-strategies'
  },
  {
    day: 9,
    moduleId: 2,
    title: 'CQRS (Splitting Read and Write Models)',
    focus: 'Splitting Read and Write Models',
    scenario: 'An order management system handles 8,000 writes/min (stock reservations, status updates) and 40,000 reads/min. Analytics dashboards joining 7 tables spike Postgres CPU to 90% every morning, causing write transactions to time out and drop orders.',
    question: 'How do you decouple complex read analytics from high-frequency transactional writes without write amplification?',
    correctOption: 'A',
    options: [
      { key: 'A', text: 'Full CQRS: Normalized 3NF write database projected asynchronously via CDC into a denormalized read store.', isCorrect: true, explanation: 'Winner: Isolates failure domains; writes stay fast and ACID, while reads query pre-joined flat documents.' },
      { key: 'B', text: 'Direct read dashboards to Postgres read replicas.', isCorrect: false, explanation: 'Replica CPU still spikes to 90%, causing massive replication lag and stale reads.' },
      { key: 'C', text: 'Denormalize the primary write database tables.', isCorrect: false, explanation: 'Massive write amplification; updating user addresses locks and updates millions of order rows.' },
      { key: 'D', text: 'Add GraphQL with DataLoader to the frontend.', isCorrect: false, explanation: 'Batches network calls between services, but does not solve database SQL join costs.' }
    ],
    summary: 'Why A Wins:',
    docLink: '/technical-knowledge/system-design/cqrs'
  },
  {
    day: 10,
    moduleId: 2,
    title: 'Distributed Transactions (Saga Orchestration vs. 2PC)',
    focus: 'Saga Orchestration vs. 2PC',
    scenario: 'A microservices checkout workflow coordinates Inventory, Payment (Stripe), and Shipping. If shipping label creation fails, stock must be released and the credit card refunded. Third-party APIs like Stripe cannot participate in database distributed locking.',
    question: 'Why does Two-Phase Commit (2PC) fail in modern distributed microservices, and how does Saga resolve it?',
    correctOption: 'B',
    options: [
      { key: 'A', text: '2PC is ideal; configure a global transaction coordinator across all HTTP endpoints.', isCorrect: false, explanation: 'External APIs like Stripe do not support the PREPARE phase of 2PC; holding locks stalls connections.' },
      { key: 'B', text: 'Use Saga Orchestration with explicit compensating transactions.', isCorrect: true, explanation: 'Winner: Executes a sequence of local ACID transactions; triggers reverse compensations on failure.' },
      { key: 'C', text: 'Execute all steps asynchronously without tracking rollback state.', isCorrect: false, explanation: 'Leaves partial state; money taken without stock or shipping.' },
      { key: 'D', text: 'Use Transactional Outbox without a coordinator.', isCorrect: false, explanation: 'Outbox guarantees message dispatch, but cannot coordinate multi-step reverse compensation logic.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/saga-pattern'
  },
  {
    day: 11,
    moduleId: 2,
    title: 'Handling Webhook Retries (Idempotent Receivers)',
    focus: 'Idempotent Receivers',
    scenario: 'Your payment gateway sends webhooks for charge updates. An application pod restarts midway through reading a webhook. The gateway retries delivery 10 seconds later, but a second pod receives an out-of-order event where `charge.refunded` arrives before `charge.paid`.',
    question: 'How do you architect a resilient webhook receiver that handles duplicates and out-of-order retries safely?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Process webhook synchronously in the HTTP request handler thread.', isCorrect: false, explanation: 'Slow DB execution causes gateway timeout (HTTP 504), triggering retry storms.' },
      { key: 'B', text: 'Fast ACK (200 OK) into durable queue; validate state machine transitions in async worker.', isCorrect: true, explanation: 'Winner: Decouples network ACK from processing; state machine rejects invalid state regressions (REFUND -> PAID).' },
      { key: 'C', text: 'Discard retried webhooks based on timestamp.', isCorrect: false, explanation: 'Clock drift between gateway and servers causes legitimate events to be dropped.' },
      { key: 'D', text: 'Return HTTP 500 on duplicate to tell the gateway to stop.', isCorrect: false, explanation: 'HTTP 500 signals error, causing the gateway to accelerate retry frequency.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/webhook'
  },
  {
    day: 12,
    moduleId: 2,
    title: 'Indexing High-Ingest Tables (Write-Heavy Optimization)',
    focus: 'Write-Heavy Optimization',
    scenario: 'An IoT service ingests 50,000 telemetry events per second into Postgres. Adding 4 secondary B-Tree indexes on device metrics causes write latency to surge from 2ms to 140ms, saturating disk write IOPS and crashing WAL checkpoints.',
    question: 'How do you support fast time-range queries without destroying database write throughput?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Add composite B-Trees with 5 columns each.', isCorrect: false, explanation: 'Massive write amplification; each insert causes multiple random disk I/O operations.' },
      { key: 'B', text: 'Use Block Range Index (BRIN) or append-only LSM trees for time-ordered data.', isCorrect: true, explanation: 'Winner: BRIN stores min/max per 128 disk pages, cutting index size and write overhead by over 90%.' },
      { key: 'C', text: 'Remove all indexes and use sequential table scans.', isCorrect: false, explanation: 'Fixes writes, but causes analytical queries to time out.' },
      { key: 'D', text: 'Store records in CSV text files on local disk.', isCorrect: false, explanation: 'Lacks durability, atomic transactions, and concurrent query safety.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/database/postgresql-heap-storage-architecture'
  },
  {
    day: 13,
    moduleId: 2,
    title: 'Shared Connection Pools (Database Proxying)',
    focus: 'Database Proxying',
    scenario: 'A Kubernetes cluster scales to 1,000 microservice pods during a flash sale. Each pod configures a local connection pool of 20 connections to PostgreSQL. 20,000 connections hit Postgres, which immediately runs out of memory and crashes because each connection consumes 10MB of RAM.',
    question: 'How do you allow thousands of dynamic microservice pods to share limited database connections efficiently?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Set `max_connections = 50000` in `postgresql.conf` and add 1TB RAM.', isCorrect: false, explanation: 'OS process context switching and lock contention will reduce Postgres throughput to near zero.' },
      { key: 'B', text: 'Deploy an intermediate database proxy (PgBouncer) in transaction pooling mode.', isCorrect: true, explanation: 'Winner: Multiplexes 20,000 client connections into a tight pool of ~100 active physical server connections.' },
      { key: 'C', text: 'Configure pods to open and close connections on every single HTTP request.', isCorrect: false, explanation: 'TCP handshake and TLS negotiation on every request adds 50ms latency and spikes CPU.' },
      { key: 'D', text: 'Replace relational database with SQLite embedded on each pod.', isCorrect: false, explanation: 'Eliminates centralized ACID consistency and prevents shared transactions across pods.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/database/connection-pooling'
  },
  {
    day: 14,
    moduleId: 2,
    title: 'Safely Rolling Out Changes (Feature Flags & Canary Deploys)',
    focus: 'Feature Flags & Canary Deploys',
    scenario: 'A critical payment routing algorithm is updated to save 0.5% in interchange fees. The deploy is pushed to 100% of production traffic at once. An unhandled currency edge-case causes 15% of checkout transactions in Europe to fail, costing $400,000 before an emergency rollback finishes 30 minutes later.',
    question: 'How do you deploy high-risk architectural updates while constraining blast radius and enabling instant rollbacks?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Deploy directly to production during off-peak midnight hours.', isCorrect: false, explanation: 'Off-peak hours lack realistic production load, masking concurrency bugs until morning peak.' },
      { key: 'B', text: 'Combine Canary deployments (route 1% -> 5% -> 25% -> 100%) with dynamic Feature Flags.', isCorrect: true, explanation: 'Winner: Confines errors to 1% of users; feature flags allow instant 0-second killswitch without redeploying code.' },
      { key: 'C', text: 'Run unit tests and bypass staging environments.', isCorrect: false, explanation: 'Unit tests cannot catch distributed environment issues like network timeouts and DB lock contention.' },
      { key: 'D', text: 'Duplicate entire infrastructure for 6 months (Parallel Run) without switching traffic.', isCorrect: false, explanation: 'Extremely expensive and fails to test real customer write traffic interaction.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/feature-toggle'
  },
  {
    day: 15,
    moduleId: 2,
    title: 'Membership Checks (Bloom Filters & False Positives)',
    focus: 'Bloom Filters & False Positives',
    scenario: 'A social network allows users to pick unique handles. 50,000 registration requests per minute check handle availability (`GET /usernames/check?name=X`). 98% of checks are for already-taken or available names, but every check executes a database index lookup, consuming 40% of database read IOPS.',
    question: 'How do you determine if a string exists in a set of 500 million keys in sub-millisecond time with minimal RAM?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Store all 500M handles in a Redis Set (`SISMEMBER`).', isCorrect: false, explanation: 'Requires 30GB+ of expensive RAM to store raw string keys.' },
      { key: 'B', text: 'Use an in-memory Bloom Filter before hitting the database.', isCorrect: true, explanation: 'Winner: 500M keys fit in ~600MB RAM. Guarantees 0% false negatives; handles 98% of non-existent checks instantly.' },
      { key: 'C', text: 'Cache checked usernames in an LRU cache with 10-minute TTL.', isCorrect: false, explanation: 'Long tail of random usernames results in low cache hit ratio (<15%).' },
      { key: 'D', text: 'Rely on database unique constraints during final form submission only.', isCorrect: false, explanation: 'Terrible user UX; user types entire form only to find out handle is taken on submit.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/bloom-filters'
  },
  {
    day: 16,
    moduleId: 2,
    title: 'Taming Hot Partitions (Shard Key Salting & Splitting)',
    focus: 'Shard Key Salting & Splitting',
    scenario: 'A live-streaming platform tracks video view counts in a sharded database partitioned by `video_id`. A viral world cup video receives 200,000 view increments per second. Shard 4 (hosting that video ID) crashes under 100% CPU, while 15 other shards sit idle at 3% utilization.',
    question: 'How do you distribute high-throughput writes to a single logical entity across multiple physical database partitions?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Move the viral video to an in-memory Redis instance with no persistence.', isCorrect: false, explanation: 'Single Redis thread will still bottleneck; risk of total count loss on node crash.' },
      { key: 'B', text: 'Salt the shard key: append a random suffix `video_123_salt_{0..9}` to scatter writes, then sum on read.', isCorrect: true, explanation: 'Winner: Distributes writes evenly across 10 shards; reads aggregate the 10 sub-counters.' },
      { key: 'C', text: 'Increase database server CPU size from 16 to 128 cores.', isCorrect: false, explanation: 'Vertical scaling is temporary and expensive; row-level lock contention on one counter remains.' },
      { key: 'D', text: 'Re-shard the entire cluster using range-based partitioning.', isCorrect: false, explanation: 'Range partitioning worsens hot partitions on current popular content.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/sharded-counters-and-leaderboards'
  },
  {
    day: 17,
    moduleId: 3,
    title: 'Backpressure (Consumer Throttling & Bounded Queues)',
    focus: 'Consumer Throttling & Bounded Queues',
    scenario: 'An image processing pipeline has a message queue between an upload service and worker pods running thumbnail resizing. An upload spike sends 50,000 images in 2 minutes. Worker nodes pull messages into unbounded memory buffers, run out of RAM, and restart in an OOM (Out-Of-Memory) crash loop.',
    question: 'How do you protect slow downstream consumers from being overwhelmed by fast upstream message producers?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Configure unbounded in-memory queues on all worker pods.', isCorrect: false, explanation: 'Primary cause of production OOM crashes during traffic bursts.' },
      { key: 'B', text: 'Enforce bounded in-memory queues and reactive consumer backpressure (pull-based flow control).', isCorrect: true, explanation: 'Winner: Workers pull only what they have CPU/RAM capacity to process (prefetch limits); upstream buffers absorb excess.' },
      { key: 'C', text: 'Drop all incoming messages when worker CPU reaches 80%.', isCorrect: false, explanation: 'Causes catastrophic data loss of customer uploaded images.' },
      { key: 'D', text: 'Increase pod memory limit to 64GB.', isCorrect: false, explanation: 'Temporarily delays the crash until a slightly larger spike arrives.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/load-balancing-reliability'
  },
  {
    day: 18,
    moduleId: 3,
    title: 'Cache Stampedes (Lock X-Fetching & Probabilistic Leaping)',
    focus: 'Lock X-Fetching & Probabilistic Leaping',
    scenario: 'The homepage of an e-commerce site caches top deals under key `deals:featured` with a 1-hour TTL. At 14:00:00, the key expires. 5,000 concurrent HTTP requests arrive in the same second, all miss the cache simultaneously, and all 5,000 query the database at once, taking it offline.',
    question: 'How do you prevent a cache stampede (thundering herd) when high-traffic cache keys expire?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Increase cache TTL to 24 hours.', isCorrect: false, explanation: 'Delays the problem; when it expires at 24 hours, the crash still happens.' },
      { key: 'B', text: 'Implement Probabilistic Early Expiration (XFetch) or Mutex Lock on cache misses.', isCorrect: true, explanation: 'Winner: Only 1 worker recomputes the key while others wait or serve slightly stale data; or recomputes before expiry probabilistically.' },
      { key: 'C', text: 'Never expire keys; update them manually via cron job only.', isCorrect: false, explanation: 'Fragile; if cron fails or key is missing, content remains forever blank or stale.' },
      { key: 'D', text: 'Add 10 database read replicas.', isCorrect: false, explanation: 'Costly and inefficient; serving 5,000 identical queries from database nodes is wasteful.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/caching-strategies'
  },
  {
    day: 19,
    moduleId: 3,
    title: 'Read-Your-Writes Consistency (Replication Lag & Session Pinning)',
    focus: 'Replication Lag & Session Pinning',
    scenario: 'To scale read throughput, you deploy 3 read replicas behind primary Postgres. A user updates their profile bio and is redirected to their profile view. The view reads from Replica 2, which suffers from 500ms replication lag. The user sees their old bio, thinks the save failed, and spams the save button.',
    question: 'How do you ensure a user always sees their own updates immediately without forcing all site traffic onto the primary database?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Switch database to synchronous replication across all replicas.', isCorrect: false, explanation: 'Write latency increases dramatically; write fails if one replica stalls on network.' },
      { key: 'B', text: 'Session Pinning: Route that specific user\'s reads to the primary database for a 5-second window after any write.', isCorrect: true, explanation: 'Winner: Guarantees author consistency; remaining 99.9% read-only users continue querying read replicas.' },
      { key: 'C', text: 'Insert `setTimeout(1000)` in client frontend code before fetching.', isCorrect: false, explanation: 'Unreliable hack; if replication lag spikes to 1.5s during load, user still sees stale data.' },
      { key: 'D', text: 'Disable caching and read replicas entirely.', isCorrect: false, explanation: 'Destroys horizontal scalability; single primary database will quickly saturate CPU.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/data-consistency'
  },
  {
    day: 20,
    moduleId: 3,
    title: 'Failing Downstream Dependencies (Circuit Breaker Pattern)',
    focus: 'Circuit Breaker Pattern',
    scenario: 'Your checkout service calls an external address verification API. The address API begins taking 25 seconds per request before timing out. Checkout threads pile up waiting for timeouts. Within 90 seconds, all 200 Tomcat worker threads are blocked, and checkout crashes completely for all customers.',
    question: 'How do you prevent a slow or failing downstream dependency from cascading into total system failure?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Increase HTTP client timeout from 25 seconds to 60 seconds.', isCorrect: false, explanation: 'Worsens the outage; threads remain trapped even longer, accelerating thread starvation.' },
      { key: 'B', text: 'Implement a Circuit Breaker (Resilience4j / Envoy) with short timeouts and cached fallbacks.', isCorrect: true, explanation: 'Winner: Trips to OPEN state after error threshold, fails fast instantly in 0ms, and serves fallback data.' },
      { key: 'C', text: 'Retry failed requests 5 times immediately in a while loop.', isCorrect: false, explanation: 'Creates a retry storm that further overwhelms the already struggling downstream API.' },
      { key: 'D', text: 'Run checkout without address validation forever.', isCorrect: false, explanation: 'Exposes business to invalid shipping addresses and fraudulent deliveries.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/circuit-breaker-pattern'
  },
  {
    day: 21,
    moduleId: 3,
    title: 'Streaming Transports (WebSockets vs. Server-Sent Events)',
    focus: 'WebSockets vs. Server-Sent Events',
    scenario: 'A financial brokerage platform must stream real-time stock ticker updates and market news alerts to 150,000 web browser users. The initial implementation uses WebSockets, but corporate enterprise proxies terminate connections, and server memory consumption is high due to stateful socket tracking.',
    question: 'Which streaming transport provides the best reliability, simplicity, and proxy traversal for unidirectional server-to-client updates?',
    correctOption: 'C',
    options: [
      { key: 'A', text: 'Short polling with HTTP GET every 200ms.', isCorrect: false, explanation: 'Generates 750,000 HTTP requests/sec; massive header overhead and gateway CPU exhaustion.' },
      { key: 'B', text: 'WebSockets with continuous bidirectional heartbeats.', isCorrect: false, explanation: 'Stateful protocol overkill for unidirectional data; frequently blocked by corporate firewalls.' },
      { key: 'C', text: 'Server-Sent Events (SSE) over HTTP/2.', isCorrect: true, explanation: 'Winner: Standard HTTP text/event-stream, native browser auto-reconnection, multiplexed over HTTP/2, traverses proxies cleanly.' },
      { key: 'D', text: 'Raw UDP socket streaming directly to browser clients.', isCorrect: false, explanation: 'Browsers do not permit raw UDP socket connections due to sandbox security policies.' }
    ],
    summary: 'Why C Wins:',
    docLink: '/technical-knowledge/system-design/real-time-updates'
  },
  {
    day: 22,
    moduleId: 3,
    title: 'Reliable Messaging (Transactional Outbox Pattern & CDC)',
    focus: 'Transactional Outbox Pattern & CDC',
    scenario: 'When an order is created, the order service updates the database and publishes an `OrderCreated` event to Kafka. Occasionally, the database transaction commits successfully, but the network to Kafka drops. The Kafka message is never published, so the shipping service never fulfills the paid order.',
    question: 'How do you guarantee that database state changes and message queue event publication occur atomically without two-phase commit?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Publish to Kafka inside the database transaction before committing.', isCorrect: false, explanation: 'Catastrophic; if Kafka succeeds but database commit fails, an event is published for an order that doesn\'t exist.' },
      { key: 'B', text: 'Use the Transactional Outbox Pattern with Change Data Capture (Debezium) or polling publisher.', isCorrect: true, explanation: 'Winner: Write event into an `outbox` database table within the same ACID transaction; async process publishes to Kafka reliably.' },
      { key: 'C', text: 'Wrap database and Kafka in an XA distributed transaction.', isCorrect: false, explanation: 'Kafka does not support XA/2PC transactions; performance degrades severely.' },
      { key: 'D', text: 'Add a cron job that checks for unfulfilled orders every 24 hours.', isCorrect: false, explanation: 'Orders are delayed by 24 hours; cron jobs miss edge-cases and scale poorly.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/outbox-pattern'
  },
  {
    day: 23,
    moduleId: 3,
    title: 'Feed Fanout (Hybrid Push vs. Pull for High-Follower Accounts)',
    focus: 'Hybrid Push vs. Pull for High-Follower Accounts',
    scenario: 'A Twitter-like social platform uses fanout-on-write: when a user posts a tweet, background workers insert the tweet ID into every follower\'s home timeline inbox. A celebrity with 60 million followers posts a photo. The fanout queue is flooded with 60M write jobs, lagging the message broker by 45 minutes for all regular users.',
    question: 'How do you architect a timeline feed system that handles both regular users and viral accounts with tens of millions of followers?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Switch entirely to fanout-on-read (pull) for all users.', isCorrect: false, explanation: 'Home timeline load requires joining hundreds of followee tables, making reads slow and expensive.' },
      { key: 'B', text: 'Hybrid Fanout: Push (fanout-on-write) for regular users; Pull (fanout-on-read) for celebrity accounts.', isCorrect: true, explanation: 'Winner: 99.9% of posts fan out instantly; celebrity tweets are merged into the follower\'s timeline only when the follower opens the app.' },
      { key: 'C', text: 'Limit maximum user follower count to 100,000.', isCorrect: false, explanation: 'Unacceptable product limitation for a global social media platform.' },
      { key: 'D', text: 'Store all timelines in a single central SQL table without indexing.', isCorrect: false, explanation: 'Scanning hundreds of millions of rows per timeline fetch will take database down.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/common-interview-questions#2-design-twitter--social-feed'
  },
  {
    day: 24,
    moduleId: 3,
    title: 'Efficient Pagination (Keyset / Cursor vs. Deep Offset)',
    focus: 'Keyset / Cursor vs. Deep Offset',
    scenario: 'A public data API provides order history search. A scraping bot accesses `/v1/orders?offset=1000000&limit=20`. Database CPU spikes to 100%, and query latency jumps to 14 seconds because the database engine must scan and discard 1,000,000 rows in memory before returning the 20 requested records.',
    question: 'How do you design high-performance pagination across tables with millions of records?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Keep `OFFSET` pagination and cache each page offset in Redis.', isCorrect: false, explanation: 'Infinite cache combinations; cache miss on deep pages will still crash the database.' },
      { key: 'B', text: 'Keyset (Cursor-based) Pagination: `WHERE (created_at, id) < (cursor_time, cursor_id) ORDER BY created_at DESC LIMIT 20`.', isCorrect: true, explanation: 'Winner: Uses B-Tree index seek ($O(\log N)$); execution time is identical whether fetching page 1 or page 50,000.' },
      { key: 'C', text: 'Limit maximum pagination depth to 5 pages and throw HTTP 400 for anything higher.', isCorrect: false, explanation: 'Breaks valid export jobs and administrative data audit requirements.' },
      { key: 'D', text: 'Use SQL sub-queries with `IN (SELECT id FROM ... OFFSET 1000000)`.', isCorrect: false, explanation: 'The sub-query still scans 1,000,000 rows, offering minimal performance gain.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/api-design'
  },
  {
    day: 25,
    moduleId: 4,
    title: 'Queue Backpressure (Traffic Spike Buffering)',
    focus: 'Traffic Spike Buffering',
    scenario: 'During Black Friday ticket drops, incoming checkout HTTP requests surge from 1,000 RPS to 80,000 RPS. Downstream inventory and fraud databases can only sustain 5,000 write transactions/sec. Synchronous HTTP request threads back up, connection pools exhaust, and the gateway returns 502 Bad Gateway to 90% of buyers.',
    question: 'How do you ingest massive transient traffic bursts without dropping requests or crashing transactional databases?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Provision 20x database capacity all year round.', isCorrect: false, explanation: 'Prohibitively expensive; databases remain 95% idle outside of rare flash sales.' },
      { key: 'B', text: 'Introduce a durable distributed queue (Kafka / AWS SQS) to buffer incoming orders; downstream consumers process at steady 5,000 RPS.', isCorrect: true, explanation: 'Winner: Decouples write ingestion from processing speed; durable message log absorbs the 80K spike safely.' },
      { key: 'C', text: 'Drop incoming requests with HTTP 429 once database reaches 80% CPU.', isCorrect: false, explanation: 'Poor customer experience; leads to lost revenue during prime promotional events.' },
      { key: 'D', text: 'Store orders in client browser LocalStorage and have browser retry every 5 seconds.', isCorrect: false, explanation: 'Fails if user closes tab; no inventory reservation guarantee; vulnerable to client tampering.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/message-queues'
  },
  {
    day: 26,
    moduleId: 4,
    title: 'Write-Path Consistency (Cache Invalidation & Dual-Write Mitigation)',
    focus: 'Cache Invalidation & Dual-Write Mitigation',
    scenario: 'An enterprise inventory service caches SKU stock levels in Redis. To update stock, the service executes `db.update(sku)` followed by `redis.del(sku)`. Under network instability, the DB commit succeeds, but the network to Redis resets. The cache retains the old stock value for 24 hours, causing incorrect inventory displays across the entire website.',
    question: 'How do you guarantee that cache invalidations are never lost after a database transaction commits?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Retry the Redis delete operation 3 times synchronously in the HTTP thread.', isCorrect: false, explanation: 'If the application pod crashes or Redis is temporarily partitioned, retries fail and invalidation is lost.' },
      { key: 'B', text: 'Use Change Data Capture (CDC via Debezium) listening to the database Write-Ahead Log (WAL) to emit invalidation events.', isCorrect: true, explanation: 'Winner: Guarantees cache invalidation is tied directly to committed database transactions, surviving application crashes.' },
      { key: 'C', text: 'Delete the Redis cache before updating the database.', isCorrect: false, explanation: 'Classic race condition: concurrent reader immediately fetches old DB value and repopulates cache with stale data.' },
      { key: 'D', text: 'Set Redis TTL to 3 seconds for all keys.', isCorrect: false, explanation: 'Overwhelms database with read traffic every 3 seconds; still exhibits a 3-second inconsistency window.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/caching-strategies'
  },
  {
    day: 27,
    moduleId: 4,
    title: 'Keeping LLMs Up to Date (RAG Architectures & Vector Chunking)',
    focus: 'RAG Architectures & Vector Chunking',
    scenario: 'A medical tech company builds an internal AI diagnostic assistant. Company clinical guidelines and treatment protocols are updated daily. Fine-tuning an open-source 70B LLM every night costs $2,500/day, takes 6 hours, and the model still hallucinates outdated drug dosages.',
    question: 'How do you provide language models with real-time, authoritative domain knowledge without retraining base weights?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Fine-tune the model continuously on incoming PDF documents.', isCorrect: false, explanation: 'Prohibitively expensive, slow, prone to catastrophic forgetting, and does not eliminate hallucinations.' },
      { key: 'B', text: 'Retrieval-Augmented Generation (RAG): Parse, chunk, embed documents into vector storage, and retrieve relevant chunks at inference time.', isCorrect: true, explanation: 'Winner: Real-time updates via vector ingestion in seconds; zero retraining cost; provides citations and verifiable source links.' },
      { key: 'C', text: 'Paste all 200,000 internal documents directly into a 2M token context window on every prompt.', isCorrect: false, explanation: 'Extreme token cost ($50/query), high inference latency (>30s), and attention dilution (\'Lost in the Middle\').' },
      { key: 'D', text: 'Instruct the model via system prompt to browse the live internet without restrictions.', isCorrect: false, explanation: 'Cannot access private internal intranet documentation; vulnerable to prompt injection.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/rag-fundamentals'
  },
  {
    day: 28,
    moduleId: 4,
    title: 'Vector Store Selection (pgvector vs. Dedicated Engines)',
    focus: 'pgvector vs. Dedicated Engines',
    scenario: 'A startup building semantic search for 300,000 product descriptions provisions an enterprise multi-node Pinecone vector database cluster costing $1,200/month. The engineering team struggles with dual-write synchronization between Postgres and Pinecone, data drift, and network latency across VPCs.',
    question: 'When should you choose pgvector inside your relational database versus a dedicated vector database (Pinecone/Milvus/Qdrant)?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Always use dedicated vector databases for any project using vector embeddings.', isCorrect: false, explanation: 'Premature optimization for small datasets; adds distributed infrastructure complexity and dual-write headaches.' },
      { key: 'B', text: 'Use pgvector for datasets under 1-5M vectors requiring ACID filtering; transition to dedicated engines at 10M+ scale or extreme QPS.', isCorrect: true, explanation: 'Winner: pgvector allows single-query SQL joins between vectors and metadata with zero dual-write sync issues.' },
      { key: 'C', text: 'Never use vector databases; use PostgreSQL full-text search with tsvector for semantic search.', isCorrect: false, explanation: 'Lexical search (tsvector) cannot understand semantic synonyms (e.g. \'automobile\' matching \'car\').' },
      { key: 'D', text: 'Store raw floating-point embedding arrays in JSONB columns and calculate cosine similarity in Python.', isCorrect: false, explanation: 'Full table scans in Python require transferring gigabytes of vectors across network; unusable latency (>5s).' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/rag-fundamentals'
  },
  {
    day: 29,
    moduleId: 4,
    title: 'Multi-Agent Workflows (State Management & Orchestration)',
    focus: 'State Management & Orchestration',
    scenario: 'An AI customer support workflow coordinates 4 specialized agents: Triage, Billing, Technical, and Escalation. When implemented with unstructured prompt chaining, agents pass 50-message conversational transcripts back and forth. The LLMs lose track of the customer\'s account ID, enter infinite tool calling loops, and burn $12 per ticket.',
    question: 'How do you coordinate multi-agent systems reliably without conversational drift and runaway execution loops?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Have all agents append to a single shared Discord chat channel.', isCorrect: false, explanation: 'Unstructured text channel creates confusion and non-deterministic loops.' },
      { key: 'B', text: 'Use an explicit State Machine / Orchestrator (e.g. LangGraph / Temporal) with structured typed state schemas.', isCorrect: true, explanation: 'Winner: Central state schema enforces deterministic transitions, validates inputs/outputs, and halts infinite loops.' },
      { key: 'C', text: 'Combine all 4 agents into one giant monolithic prompt with 80 tool definitions.', isCorrect: false, explanation: 'Overloading 1 prompt with dozens of tools degrades tool selection accuracy and exceeds context limits.' },
      { key: 'D', text: 'Run all 4 agents in parallel and pick the fastest output.', isCorrect: false, explanation: 'Wastes compute; agents have dependencies (cannot process refund before billing verification).' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/agents'
  },
  {
    day: 30,
    moduleId: 4,
    title: 'File Storage Backends (Object Storage vs. Block Storage)',
    focus: 'Object Storage vs. Block Storage',
    scenario: 'A photo sharing application stores user images directly as `BYTEA` binary blobs inside PostgreSQL. As users upload 20TB of photos, database backup times balloon to 14 hours, replication lag spikes, database RAM cache is polluted with image bytes, and simple user queries slow to a crawl.',
    question: 'How should binary assets (images, videos, PDF documents) be stored and served in a scalable architecture?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Store binary data as Base64 strings in MongoDB collections.', isCorrect: false, explanation: 'Base64 encoding increases file size by 33%; still pollutes document database RAM.' },
      { key: 'B', text: 'Store files in Cloud Object Storage (S3 / GCS); persist only the metadata (URL, size, hash) in the database.', isCorrect: true, explanation: 'Winner: Virtually infinite scalability, 99.999999999% durability, direct client presigned uploads, and CDN integration.' },
      { key: 'C', text: 'Store files on the local filesystem of application web servers.', isCorrect: false, explanation: 'Files are lost when stateless containers restart or auto-scale up and down.' },
      { key: 'D', text: 'Attach a shared AWS EBS block volume to 50 web pods simultaneously.', isCorrect: false, explanation: 'EBS cannot be attached multi-writer across many availability zones reliably without clustered filesystems.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/large-blobs'
  },
  {
    day: 31,
    moduleId: 4,
    title: 'Cross-Region Latency (Edge Computing & Global CDNs)',
    focus: 'Edge Computing & Global CDNs',
    scenario: 'An API with primary servers and database in US-East (`us-east-1`) serves users in Singapore and Sydney. Australian users experience 380ms response times for simple read-only home screen requests, primarily due to the physical speed of light across trans-oceanic fiber optic cables (TCP 3-way handshake + TLS 1.3 negotiation taking 3 round-trips).',
    question: 'How do you achieve sub-50ms read response times for international users without multi-master database replication?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Tell international users to use a VPN closer to US-East.', isCorrect: false, explanation: 'A VPN cannot beat the speed of light; total round-trip physical distance remains identical.' },
      { key: 'B', text: 'Terminate TLS and cache static/dynamic read responses at Global Edge PoPs (CDNs / Edge Workers).', isCorrect: true, explanation: 'Winner: TLS terminates locally in Sydney (<10ms); cached data serves directly from edge memory.' },
      { key: 'C', text: 'Deploy full write-capable database clusters in all 10 regions.', isCorrect: false, explanation: 'Extremely complex distributed multi-master consensus (CockroachDB / Spanner) with high write cross-region coordination latency.' },
      { key: 'D', text: 'Switch from HTTPS to unencrypted HTTP.', isCorrect: false, explanation: 'Severe security violation; exposes user tokens and sensitive data to interception.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/scaling-reads'
  },
  {
    day: 32,
    moduleId: 4,
    title: 'Secrets Management (Credential Rotation & Vaults)',
    focus: 'Credential Rotation & Vaults',
    scenario: 'A database administrator needs to rotate the production Postgres password due to an employee departure. Database passwords are baked into Kubernetes deployment YAML ConfigMaps across 80 microservices. Updating passwords requires redeploying all 80 microservices, causing a 12-minute outage as old connections are terminated while new pods spin up.',
    question: 'How should enterprise systems manage, rotate, and deliver database credentials with zero application downtime?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Store database passwords in a private Git repository encrypted with a master key.', isCorrect: false, explanation: 'Git commits leave permanent audit trails; requires redeploying applications to rotate.' },
      { key: 'B', text: 'Use a dedicated Secrets Manager (HashiCorp Vault / AWS Secrets Manager) with dynamic short-lived credentials and IAM authentication.', isCorrect: true, explanation: 'Winner: Microservices authenticate via IAM/mTLS and lease credentials that rotate automatically without pod restarts.' },
      { key: 'C', text: 'Hardcode the password directly into application binary code.', isCorrect: false, explanation: 'Critical security vulnerability; decompiling binary exposes credentials.' },
      { key: 'D', text: 'Disable database passwords and rely solely on IP whitelisting.', isCorrect: false, explanation: 'Violates Zero-Trust security principles; any compromised container in the VPC can access all tables.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/security-patterns'
  },
  {
    day: 33,
    moduleId: 5,
    title: 'Event Sourcing (Auditability & Reconstructing State from History)',
    focus: 'Auditability & Reconstructing State from History',
    scenario: 'A fintech ledger stores bank balances as mutable rows: `UPDATE accounts SET balance = balance - 100 WHERE id = 1`. After an audit discrepancy of $45,000, engineers cannot reconstruct who initiated the balance deductions, which transactions were involved, or what intermediate states existed over the past quarter.',
    question: 'How do you guarantee 100% auditability and point-in-time state reconstruction for mission-critical financial systems?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Enable database query logging (`log_statement = \'all\'`) on Postgres.', isCorrect: false, explanation: 'Text logs are unstructured, rotate quickly, are slow to query, and cannot rebuild application domain state.' },
      { key: 'B', text: 'Use Event Sourcing: Treat state as an append-only log of domain events (`MoneyDeposited`, `TransferInitiated`); derive current balance by replaying events or snapshots.', isCorrect: true, explanation: 'Winner: Every state transition is immutable, cryptographically auditable, and allows point-in-time travel to any timestamp.' },
      { key: 'C', text: 'Add an `updated_at` column and an audit comment string to the `accounts` table.', isCorrect: false, explanation: 'Overwrites previous state; fails to capture the full timeline of intermediate balance changes.' },
      { key: 'D', text: 'Take a full database snapshot dump every hour.', isCorrect: false, explanation: 'Loses all fine-grained transactions executed between the hourly snapshot intervals.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/event-driven-microservices'
  },
  {
    day: 34,
    moduleId: 5,
    title: 'LLM Classification (Accuracy, Few-Shot & Prompt Engineering)',
    focus: 'Accuracy, Few-Shot & Prompt Engineering',
    scenario: 'An e-commerce customer support pipeline uses an LLM to categorize 20,000 incoming support tickets per day into 30 issue categories. Using basic zero-shot prompts ("Classify this email"), the model returns inconsistent categories, invents new non-existent tags, and accuracy hovers around 68%, misrouting thousands of urgent shipping tickets.',
    question: 'How do you improve LLM classification accuracy to >95% while enforcing strict schema compliance?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Switch to an expensive reasoning model (o1/o3) for every single ticket classification.', isCorrect: false, explanation: 'Increases cost by 30x and latency to 10s per ticket for a simple classification task.' },
      { key: 'B', text: 'Use Few-Shot Prompting with diverse edge-case examples and enforce Structured Outputs (JSON Schema / Enum validation).', isCorrect: true, explanation: 'Winner: Few-shot examples anchor model semantics; constrained JSON mode guarantees the returned category is strictly within the allowed 30 enums.' },
      { key: 'C', text: 'Ask the LLM to \'think step by step\' without providing examples.', isCorrect: false, explanation: 'Increases token generation cost without anchoring the exact target taxonomy.' },
      { key: 'D', text: 'Train a full 70B parameter custom LLM from scratch on your internal emails.', isCorrect: false, explanation: 'Costs hundreds of thousands of dollars and months of work when prompting smaller models achieves higher accuracy.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/prompt-engineering'
  },
  {
    day: 35,
    moduleId: 5,
    title: 'Geospatial Scaling (Quadtrees, Geohashing & Spatial Partitioning)',
    focus: 'Quadtrees, Geohashing & Spatial Partitioning',
    scenario: 'A ride-hailing platform tracks 200,000 active drivers sending GPS coordinates every 3 seconds. When a rider requests a pickup, the backend executes `SELECT * FROM drivers WHERE ST_Distance(driver_loc, rider_loc) < 5000`. Under 10,000 pickup requests/min, the spatial index saturates CPU, and query latency exceeds 4 seconds.',
    question: 'How do you perform real-time nearest-neighbor geospatial searches with sub-15ms response times at high write concurrency?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Run Cartesian Euclidean distance calculations `(x1-x2)^2 + (y1-y2)^2` across the entire unindexed drivers table in SQL.', isCorrect: false, explanation: 'Requires full table scan of 200,000 rows on every pickup request; crashes database instantly.' },
      { key: 'B', text: 'Use Geohashes or Quadtree spatial indexing in an in-memory key-value store (Redis GEO / S2 Geometry).', isCorrect: true, explanation: 'Winner: Maps 2D lat/long coordinates into 1D sorted z-order strings; nearest neighbor lookups execute via fast range queries in in-memory B-Trees.' },
      { key: 'C', text: 'Partition drivers geographically by country in separate relational databases.', isCorrect: false, explanation: 'Does not solve city-level hotspots (e.g. 50,000 drivers active in Manhattan at rush hour).' },
      { key: 'D', text: 'Ask the mobile client to fetch all 200,000 driver locations and calculate the nearest driver in Swift/Kotlin.', isCorrect: false, explanation: 'Downloads 50MB of driver data to every phone every 3 seconds, exhausting cellular data and battery.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/proximity-search-geospatial-indexes'
  },
  {
    day: 36,
    moduleId: 5,
    title: 'Edge Protocols (HTTP/3 over QUIC vs. HTTP/2 TCP Head-of-Line)',
    focus: 'HTTP/3 over QUIC vs. HTTP/2 TCP Head-of-Line',
    scenario: 'A mobile video delivery service observes that mobile users on 4G/5G cellular networks experience frequent video buffering stutters whenever traveling through tunnels or train stations where 2% packet loss occurs. HTTP/2 multiplexing fails to alleviate the stutters, causing users to abandon the stream.',
    question: 'Why does HTTP/2 suffer from Head-of-Line (HoL) blocking on lossy mobile networks, and how does HTTP/3 (QUIC) resolve it?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'HTTP/2 uses UDP which drops video frames during network handoffs.', isCorrect: false, explanation: 'HTTP/2 runs on TCP, not UDP.' },
      { key: 'B', text: 'HTTP/2 multiplexes streams over 1 single TCP connection; when 1 packet drops, TCP pauses ALL streams until the dropped packet is retransmitted. HTTP/3 over QUIC/UDP decouples stream losses.', isCorrect: true, explanation: 'Winner: In QUIC, packet loss on stream A does not stall stream B; connection migration allows seamless handoff from Wi-Fi to cellular.' },
      { key: 'C', text: 'HTTP/2 lacks TLS encryption, causing ISPs to throttle video packets.', isCorrect: false, explanation: 'HTTP/2 uses mandatory TLS in all modern browsers; security is not the cause of HoL blocking.' },
      { key: 'D', text: 'The fix is to downgrade all video streaming clients to HTTP/1.0.', isCorrect: false, explanation: 'HTTP/1.0 opens a new TCP connection per request, worsening latency and network congestion.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/networking/quic-modern-transport'
  },
  {
    day: 37,
    moduleId: 5,
    title: 'Collaborative Editing (CRDTs vs. Operational Transformation)',
    focus: 'CRDTs vs. Operational Transformation',
    scenario: 'You are designing a collaborative workspace document editor (like Notion or Figma). Multiple team members edit the same document simultaneously, and mobile users must be able to edit while offline during flights and merge seamlessly upon reconnecting without losing text.',
    question: 'Why are Conflict-Free Replicated Data Types (CRDTs) superior to Operational Transformation (OT) for decentralized or offline collaboration?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'OT is better because it requires zero server coordination.', isCorrect: false, explanation: 'Factually incorrect: OT fundamentally requires a central server to transform operations based on global order.' },
      { key: 'B', text: 'CRDTs mathematically guarantee Strong Eventual Consistency (SEC) across peers in any order without a central transformation server.', isCorrect: true, explanation: 'Winner: Character insertions have globally unique fractional identifiers; merges are commutative and idempotent, ideal for offline/local-first apps.' },
      { key: 'C', text: 'File locking with pessimistic locks is preferred for collaborative documents.', isCorrect: false, explanation: 'Locks block all other users from typing, destroying real-time collaboration.' },
      { key: 'D', text: 'Git merge in the background is the industry standard for real-time document typing.', isCorrect: false, explanation: 'Git creates interactive text merge conflicts, which ruin seamless keystroke collaboration.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/crdt-collaborative-systems'
  },
  {
    day: 38,
    moduleId: 5,
    title: 'Long Context LLMs (Document Chunking vs. Attention Dilution)',
    focus: 'Document Chunking vs. Attention Dilution',
    scenario: 'An enterprise legal AI application inputs an entire 600-page corporate acquisition agreement (400,000 tokens) into a 1M context window model. The user asks: "What is the indemnity cap in Section 14.3?". The model hallucinates an incorrect standard indemnity cap found in Section 2, missing the specific clause in the middle of page 320.',
    question: 'Why does stuffing massive documents into long-context LLMs cause factual retrieval failures, and how do you prevent it?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'The model ran out of GPU memory and discarded the document tokens.', isCorrect: false, explanation: 'The prompt was within the context window; the failure is algorithmic attention dilution, not memory exhaustion.' },
      { key: 'B', text: 'Attention dilution (\'Lost in the Middle\'): Transformer attention mechanisms exhibit high recall at the beginning and end of contexts, but degrade in the middle. Solution: Semantic chunking and targeted vector retrieval.', isCorrect: true, explanation: 'Winner: Retrieve only the relevant 5-10 pages containing Section 14.3; feeding high-signal condensed context yields accurate extraction.' },
      { key: 'C', text: 'Repeat the question 50 times at the end of the prompt.', isCorrect: false, explanation: 'Ad-hoc hack; wastes tokens and does not fix attention degradation over hundreds of pages.' },
      { key: 'D', text: 'Compress the text by removing all vowels before prompting.', isCorrect: false, explanation: 'Destroys semantic legibility and breaks legal terminology.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/context-engineering'
  },
  {
    day: 39,
    moduleId: 5,
    title: 'Concurrent Overspend (Atomic Conditional Balance Updates in SQL)',
    focus: 'Atomic Conditional Balance Updates in SQL',
    scenario: 'A digital wallet user has a balance of $120. The user initiates two simultaneous $100 withdrawals via two different browser tabs. Both requests reach separate backend servers at the exact same millisecond. Both servers read balance $120, approve the withdrawal, and deduct $100. The user withdraws $200, leaving the account at negative -$80.',
    question: 'How do you prevent concurrent account overspend without deadlocks or slow distributed locks?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Read balance in application memory, verify `balance >= 100`, and execute `UPDATE accounts SET balance = balance - 100`.', isCorrect: false, explanation: 'Classic Read-Modify-Write race condition; allows concurrent overspend.' },
      { key: 'B', text: 'Execute an Atomic Conditional SQL Update: `UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100`.', isCorrect: true, explanation: 'Winner: Database row lock enforces serial execution; exactly one query updates 1 row, while the second updates 0 rows and fails fast.' },
      { key: 'C', text: 'Put a global Redis lock on the entire `accounts` table.', isCorrect: false, explanation: 'Serializes all transactions across all users in the system, bottlenecking system to 20 RPS.' },
      { key: 'D', text: 'Allow overspend and bill the user later via mail.', isCorrect: false, explanation: 'Severe financial fraud and credit default risk for the business.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/handling-contention'
  },
  {
    day: 40,
    moduleId: 5,
    title: 'Off-Main-Thread Processing (Background Workers & Status Polling)',
    focus: 'Background Workers & Status Polling',
    scenario: 'A SaaS accounting application provides a \'Generate Tax Report (PDF)\' button. Rendering the PDF requires complex calculations and takes 45 seconds. The backend executes the generation inside the HTTP request thread. After 30 seconds, the load balancer terminates the connection with an HTTP 504 Gateway Timeout, leaving users unable to download reports.',
    question: 'How do you handle long-running resource-intensive tasks in an HTTP API architecture?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Increase load balancer and reverse proxy timeouts to 30 minutes.', isCorrect: false, explanation: 'Ties up web server threads for minutes; a spike in report generations quickly exhausts all server threads, causing site-wide outages.' },
      { key: 'B', text: 'Asynchronous Job Pattern: Enqueue task in worker queue (Redis / RabbitMQ), return HTTP 202 Accepted with a job status URL, and process on background workers.', isCorrect: true, explanation: 'Winner: Web thread frees up immediately in <10ms; client polls status URL or receives completion webhook/SSE.' },
      { key: 'C', text: 'Run the 45-second report generation on the client\'s browser using WebAssembly.', isCorrect: false, explanation: 'Requires exposing private database tables and proprietary tax calculation logic to client devices.' },
      { key: 'D', text: 'Have the user refresh the browser page repeatedly until the report finishes.', isCorrect: false, explanation: 'Each page refresh spawns another concurrent 45-second generation job, compounding server load.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/long-running-tasks'
  },
  {
    day: 41,
    moduleId: 6,
    title: 'Batch to Real-Time (Stream Processing with Kafka / Flink)',
    focus: 'Stream Processing with Kafka / Flink',
    scenario: 'A banking platform runs an overnight batch ETL job to calculate customer credit risk scores and detect credit card fraud. Fraudulent card rings exploit this 24-hour delay, draining stolen cards during the day before the overnight batch detects the velocity anomaly.',
    question: 'How do you transition from nightly batch processing to sub-second real-time event stream analytics?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Run the overnight batch SQL script every 30 seconds against the production primary database.', isCorrect: false, explanation: 'Crushes database performance with massive repetitive table scans, locking tables and causing write timeouts.' },
      { key: 'B', text: 'Use an Event Stream Processing Engine (Kafka Streams / Apache Flink) with stateful sliding time windows.', isCorrect: true, explanation: 'Winner: Ingests transactions as a continuous event stream; computes sliding aggregations (\'More than 3 transactions in 2 minutes\') in real time with sub-50ms latency.' },
      { key: 'C', text: 'Require manual fraud approval by human agents for all credit card swipes.', isCorrect: false, explanation: 'Unusable checkout friction; cannot scale to 50,000 swipes per second.' },
      { key: 'D', text: 'Store all credit card swipes in flat text files on an NFS share.', isCorrect: false, explanation: 'Lacks streaming windowing capabilities and real-time processing semantics.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/kafka/core/kafka-architecture-overview'
  },
  {
    day: 42,
    moduleId: 6,
    title: 'Agentic Memory (Hierarchical Episodic Summarization)',
    focus: 'Hierarchical Episodic Summarization',
    scenario: 'An autonomous AI software engineering agent runs a multi-hour coding task spanning 150 tool executions (reading files, executing bash commands, running tests). Passing the full raw message history on every step balloons inference cost to $20/run and causes the LLM to hallucinate old compilation errors that were already fixed.',
    question: 'How do you manage long-term agent memory across extended execution sessions without exceeding context limits or diluting reasoning?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Truncate the history by dropping the oldest 50 messages whenever context is full.', isCorrect: false, explanation: 'Agent loses the initial user prompt, system constraints, and key architectural guidelines.' },
      { key: 'B', text: 'Implement Hierarchical Episodic Summarization: Keep recent turns raw in working memory, while condensing completed phases into structured milestone summaries.', isCorrect: true, explanation: 'Winner: Preserves key state invariants (e.g. \'Auth module fixed; do not touch auth.py\') while reducing token count by 85%.' },
      { key: 'C', text: 'Embed every raw message into a vector database and retrieve messages via similarity search.', isCorrect: false, explanation: 'Loses chronological causal order of execution; agent acts on out-of-sequence instructions.' },
      { key: 'D', text: 'Restart the agent with a blank history every 10 steps.', isCorrect: false, explanation: 'Zero memory persistence; agent repeats identical failed actions in infinite loops.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/agents'
  },
  {
    day: 43,
    moduleId: 6,
    title: 'CDN Invalidation (Content-Hashed Assets vs. Wildcard Purges)',
    focus: 'Content-Hashed Assets vs. Wildcard Purges',
    scenario: 'A single-page application (SPA) deploys a critical bugfix to `app.js`. The team initiates a global CDN wildcard cache purge (`/*`). Due to CDN edge propagation delays and rate limits, 40% of users continue loading cached old `app.js` with new backend APIs for 2 hours, causing JavaScript crashes.',
    question: 'How do you deploy web application frontend assets with zero cache inconsistency and instant user updates?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Set CDN cache TTL to 0 seconds (no-cache) for all static JavaScript and CSS files.', isCorrect: false, explanation: 'Forces all asset traffic back to origin servers on every pageview, destroying CDN cost and performance benefits.' },
      { key: 'B', text: 'Content-Hash all asset filenames (`app.8f9b2c.js`) with long-term immutable caching (`Cache-Control: max-age=31536000, immutable`), and serve only `index.html` with `no-cache`.', isCorrect: true, explanation: 'Winner: Deploying new code generates new filenames; users get new assets instantly without CDN cache purges, and old assets remain safely cached.' },
      { key: 'C', text: 'Change the CDN provider on every production release.', isCorrect: false, explanation: 'Operational nightmare; DNS propagation takes hours to cut over globally.' },
      { key: 'D', text: 'Tell users to perform a hard refresh (`Ctrl + F5`) in their browsers.', isCorrect: false, explanation: 'Unacceptable user experience; breaks mobile apps and automated browser views.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/caching-strategies'
  },
  {
    day: 44,
    moduleId: 6,
    title: 'Offline Edit Sync (Vector Clocks & Data Loss Prevention)',
    focus: 'Vector Clocks & Data Loss Prevention',
    scenario: 'A cloud note-taking app allows editing on mobile and desktop. A user edits a document on their phone while offline on a subway. Meanwhile, their desktop auto-saves a minor edit. When the phone reconnects, the backend uses simple Last-Write-Wins (LWW) based on device timestamps. The phone\'s clock is 5 minutes behind, so the server overwrites and destroys 2 hours of mobile notes.',
    question: 'How do you detect concurrent edits and prevent silent data loss in offline-capable applications?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Rely on client device wall-clock timestamps (`new Date().getTime()`) to determine the winner.', isCorrect: false, explanation: 'Device clocks skew by seconds or minutes; older edits silently overwrite newer edits.' },
      { key: 'B', text: 'Use Vector Clocks or State-based CRDTs to detect concurrent branching edits and reconcile state.', isCorrect: true, explanation: 'Winner: Mathematically detects true causality; flags concurrent branches for three-way merge or automatic conflict-free convergence.' },
      { key: 'C', text: 'Reject all offline edits and lock the application if Wi-Fi is disconnected.', isCorrect: false, explanation: 'Destroys offline productivity; users expect modern apps to work without internet.' },
      { key: 'D', text: 'Store only the newest edit and move previous versions to an inaccessible trash bin.', isCorrect: false, explanation: 'Still causes user work loss and customer frustration.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/crdt-collaborative-systems'
  },
  {
    day: 45,
    moduleId: 6,
    title: 'Full-Text Search (Inverted Indexes vs. SQL Wildcard Scans)',
    focus: 'Inverted Indexes vs. SQL Wildcard Scans',
    scenario: 'A marketplace with 15 million product listings provides a search bar. The backend runs `SELECT * FROM products WHERE description ILIKE \'%ergonomic chair%\'`. As traffic grows to 500 searches/sec, queries take 8 seconds, saturate disk I/O, and crash the primary database.',
    question: 'Why do relational database SQL wildcard queries fail at scale, and how do Inverted Indexes solve search?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Add a standard B-Tree index on the `description` column.', isCorrect: false, explanation: 'Standard B-Trees cannot use indexes for leading wildcards (`%keyword`); query still forces full table scan.' },
      { key: 'B', text: 'Use an Inverted Index engine (Elasticsearch / Lucene / Postgres tsvector) that maps tokenized words to document postings lists.', isCorrect: true, explanation: 'Winner: Search reduces to an array intersection of term postings lists in memory, executing in <10ms regardless of database size.' },
      { key: 'C', text: 'Load all 15 million descriptions into Redis strings and search with Python regex.', isCorrect: false, explanation: 'Consumes 50GB+ RAM and full scan in Python is slower than database scanning.' },
      { key: 'D', text: 'Increase database IOPS from 3,000 to 50,000.', isCorrect: false, explanation: 'Extremely expensive brute-force fix; full table scans on 15M rows do not scale linearly with user growth.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/database/full-text-search'
  },
  {
    day: 46,
    moduleId: 6,
    title: 'Structured LLM Output (Constrained Decoding & Tool Calling)',
    focus: 'Constrained Decoding & Tool Calling',
    scenario: 'An automated booking pipeline uses an LLM to extract flight reservation data from emails and call a booking API. The prompt says: "Return valid JSON only". In 8% of cases, the LLM prefixes the output with "Here is the JSON:" or appends markdown backticks, causing JSON parsing exceptions and failing automated bookings.',
    question: 'How do you guarantee 100% valid schema compliance from LLM outputs without regex string patching?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Wrap the JSON parser in a retry loop and retry up to 5 times when parsing fails.', isCorrect: false, explanation: 'Adds latency (5-10s) and token cost; still fails if the model consistently outputs conversational prose.' },
      { key: 'B', text: 'Use Constrained Decoding (Grammar-guided sampling / OpenAI JSON Schema / Outlines) that enforces Pydantic schemas at the token generation level.', isCorrect: true, explanation: 'Winner: Constrains model token sampling to tokens that conform to the target JSON schema; guaranteed 100% syntactically valid JSON every time.' },
      { key: 'C', text: 'Add \'DO NOT INCLUDE MARKDOWN\' in all-caps to the prompt.', isCorrect: false, explanation: 'Prompt begging reduces format errors slightly but still fails on edge cases in production.' },
      { key: 'D', text: 'Train a custom regex parser that guesses missing brackets in malformed strings.', isCorrect: false, explanation: 'Brittle heuristic; corrupts nested fields and numbers.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/prompt-engineering'
  },
  {
    day: 47,
    moduleId: 6,
    title: 'Strangling the Monolith (Strangler Fig Pattern & Gateway Routing)',
    focus: 'Strangler Fig Pattern & Gateway Routing',
    scenario: 'A legacy 12-year-old monolithic Rails application powers an entire bank. Leadership initiates a \'Big-Bang\' rewrite to replace the monolith with a new Go microservice architecture. After 18 months and $10M spent, the new system has 400 feature parity gaps, cutover fails, and the project is cancelled.',
    question: 'How do you migrate a mission-critical monolithic system to modern microservices with zero downtime and low operational risk?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Attempt a Big-Bang cutover on a long holiday weekend with all engineers on standby.', isCorrect: false, explanation: 'Classic software engineering disaster; high risk of catastrophic rollback and business paralysis.' },
      { key: 'B', text: 'Adopt the Strangler Fig Pattern: Place an API Gateway in front of the monolith; carve out single domain routes (e.g. `/v1/payments`) incrementally to new services over time.', isCorrect: true, explanation: 'Winner: Low risk; delivers business value in weeks; old and new services coexist safely in production.' },
      { key: 'C', text: 'Keep the monolith and freeze all new feature development forever.', isCorrect: false, explanation: 'Stifles business growth and developer productivity.' },
      { key: 'D', text: 'Duplicate all production database tables manually and let two systems write to both simultaneously.', isCorrect: false, explanation: 'Guarantees dual-write divergence and database corruption without transactional synchronization.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/strangler-fig-pattern'
  },
  {
    day: 48,
    moduleId: 6,
    title: 'Agent Tool Selection (Function Calling Contracts & Reasoning Loops)',
    focus: 'Function Calling Contracts & Reasoning Loops',
    scenario: 'An autonomous AI assistant is provided with 75 different enterprise API tools in its system prompt (HR, CRM, Jira, GitHub, Slack, AWS). When a user asks: "Create a Jira ticket for the bug in repo X", the agent calls the AWS EC2 reboot tool instead, causing a production server shutdown.',
    question: 'How do you prevent tool hallucinations and improve tool selection accuracy in complex AI agent systems?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Give the agent all 75 tools at once and tell it to be \'very careful\'.', isCorrect: false, explanation: 'Context bloat dilutes semantic attention; tool hallucination rate increases with tool count.' },
      { key: 'B', text: 'Use Dynamic Tool Retrieval / Hierarchical Tool Selection: Classify user intent first, load only the 3-5 relevant tools for that domain, and enforce confirmation gates for dangerous actions.', isCorrect: true, explanation: 'Winner: Restricting active tool scope dramatically increases selection accuracy; destructive tools require human-in-the-loop approval.' },
      { key: 'C', text: 'Disable tool calling and force the agent to output shell scripts.', isCorrect: false, explanation: 'Exposes system to arbitrary code execution security vulnerabilities.' },
      { key: 'D', text: 'Run the prompt through 5 different LLMs and vote on which tool to call.', isCorrect: false, explanation: 'Expensive, slow, and still fails if all models are confused by the 75-tool context.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/mcp-and-agentic-ai'
  },
  {
    day: 49,
    moduleId: 6,
    title: 'Data Warehouse Costs (Partitioning, Clustering & Scan Pruning)',
    focus: 'Partitioning, Clustering & Scan Pruning',
    scenario: 'A data analytics team runs daily KPI dashboards on a 2-petabyte BigQuery / Snowflake data warehouse. The monthly warehouse bill jumps from $8,000 to $92,000. Investigation reveals that analysts run queries like `SELECT * FROM events WHERE event_name = \'signup\' AND date = \'2024-05-01\'`, scanning the entire unpartitioned 2PB table on every query.',
    question: 'How do you reduce cloud data warehouse query costs by >80% while accelerating query response times?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Forbid data analysts from running analytical queries on the warehouse.', isCorrect: false, explanation: 'Defeats the purpose of having a business intelligence data platform.' },
      { key: 'B', text: 'Partition tables by Date (`date`) and Cluster by high-cardinality query keys (`event_name`, `tenant_id`) to enable scan pruning.', isCorrect: true, explanation: 'Winner: The query engine skips unneeded disk blocks, scanning 5GB instead of 2PB (a 99.8% cost and latency reduction).' },
      { key: 'C', text: 'Export all 2PB into an Excel spreadsheet on a local drive.', isCorrect: false, explanation: 'Excel cannot open petabyte-scale files; crashes instantly.' },
      { key: 'D', text: 'Switch the data warehouse to an in-memory SQLite database.', isCorrect: false, explanation: 'SQLite cannot hold petabytes of analytical data in memory.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/database/data-warehousing-olap'
  },
  {
    day: 50,
    moduleId: 6,
    title: 'ML Model Serving (Dynamic Request Batching & Triton)',
    focus: 'Dynamic Request Batching & Triton',
    scenario: 'A fintech company serves a deep-learning fraud detection model on an NVIDIA A100 GPU cluster. The model takes 10ms to score a transaction. Under 2,000 RPS traffic, GPU compute utilization is only 12%, but p99 inference latency spikes to 800ms because worker threads process incoming requests one at a time sequentially.',
    question: 'How do you maximize GPU utilization and achieve high throughput at sub-20ms latency during model inference?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Purchase 50 more A100 GPUs and assign 1 GPU per worker thread.', isCorrect: false, explanation: 'Massive waste of capital ($500K+); does not fix underlying sequential under-utilization.' },
      { key: 'B', text: 'Implement Dynamic Server-Side Batching (Triton Inference Server / vLLM): Buffer requests for 2-4ms to form micro-batches of 32-64 inputs for parallel tensor calculation.', isCorrect: true, explanation: 'Winner: GPUs are designed for matrix parallelism; processing a batch of 32 takes 12ms (nearly identical to 1 input), increasing throughput by 25x.' },
      { key: 'C', text: 'Quantize the model from FP16 down to INT2, sacrificing all accuracy.', isCorrect: false, explanation: 'Destroys fraud detection accuracy, causing massive financial fraud losses.' },
      { key: 'D', text: 'Run the model on CPU threads instead of GPUs.', isCorrect: false, explanation: 'CPU matrix multiplication is significantly slower for deep learning models, worsening latency.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/load-balancing-reliability'
  },
  {
    day: 51,
    moduleId: 7,
    title: 'Noisy Tenant Isolation (Per-Tenant Quotas & Bulkhead Pools)',
    focus: 'Per-Tenant Quotas & Bulkhead Pools',
    scenario: 'In a multi-tenant B2B SaaS platform, Tenant A runs a poorly written automated script that sends 10,000 heavy reporting API calls in 1 minute. The shared API worker pool is exhausted by Tenant A. Valid requests from 500 other paying enterprise tenants time out with HTTP 504 errors.',
    question: 'How do you prevent one rogue tenant from degrading system performance for all other tenants in a shared SaaS platform?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Apply a global IP-based rate limit across all incoming traffic.', isCorrect: false, explanation: 'Does not differentiate between tenants; a rogue tenant sharing a corporate NAT IP blocks innocent users.' },
      { key: 'B', text: 'Enforce Per-Tenant Rate Limiting and Bulkhead Worker Thread Pools: Each tenant has an independent Token Bucket and a bounded slice of processing concurrency.', isCorrect: true, explanation: 'Winner: Tenant A exhausts only their allocated quota and receives HTTP 429; other tenants continue executing at sub-second latency.' },
      { key: 'C', text: 'Manually block Tenant A\'s account whenever an alert fires.', isCorrect: false, explanation: 'Reactive manual mitigation; outages still occur for 15 minutes before an engineer responds.' },
      { key: 'D', text: 'Migrate every single customer to a dedicated AWS account immediately.', isCorrect: false, explanation: 'Crippling infrastructure overhead and management complexity for a multi-tenant SaaS.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/rate-limiting-algorithms'
  },
  {
    day: 52,
    moduleId: 7,
    title: 'API Versioning (Contract Evolution & Header/Path Versioning)',
    focus: 'Contract Evolution & Header/Path Versioning',
    scenario: 'A public platform API changes its user address format from a single string (`address: "123 Main St"`) to a structured object (`address: { street, city, zip }`). The change is deployed to the production `/v1/users` endpoint. Hundreds of third-party mobile apps and partner integrations crash immediately due to JSON deserialization type mismatches.',
    question: 'How do you evolve public API contracts without breaking existing third-party client integrations?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Email all developers 24 hours before deploying the breaking change.', isCorrect: false, explanation: 'Unrealistic; developers take weeks or months to update external apps.' },
      { key: 'B', text: 'Maintain backward-compatible additive changes; introduce new breaking formats under new version paths (`/v2/`) or custom request headers (`API-Version: 2024-05-01`) with a strict deprecation timeline.', isCorrect: true, explanation: 'Winner: Existing clients continue running on v1 undisturbed; new clients opt into v2; metrics track v1 traffic decay before final sunset.' },
      { key: 'C', text: 'Support only the newest version and require all clients to adapt immediately.', isCorrect: false, explanation: 'Destroys partner trust and causes immediate client integration breakage.' },
      { key: 'D', text: 'Embed TypeScript type definitions in HTTP response headers.', isCorrect: false, explanation: 'HTTP headers cannot prevent runtime client deserialization crashes.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/api-design'
  },
  {
    day: 53,
    moduleId: 7,
    title: 'Schema Migrations (Zero-Downtime Expand-Contract Pattern)',
    focus: 'Zero-Downtime Expand-Contract Pattern',
    scenario: 'A database migration script renames a column in a 120-million row active Postgres table: `ALTER TABLE users RENAME COLUMN phone TO phone_number;`. The command takes an exclusive table lock (`AccessExclusiveLock`). Web requests queue up behind the lock, connection pools saturate within 10 seconds, and the entire site goes dark with HTTP 504 errors.',
    question: 'How do you perform breaking database schema changes (renames, column drops, type changes) with zero downtime on live high-traffic tables?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Run migrations at 2 AM and accept a 15-minute maintenance outage window.', isCorrect: false, explanation: 'Unacceptable for global 24/7 SaaS applications with international users.' },
      { key: 'B', text: 'Use the Expand-Contract (Parallel Change) Pattern across multiple phased deployments: 1. Add new column, 2. Dual-write to both columns, 3. Backfill old rows, 4. Read from new column, 5. Drop old column.', isCorrect: true, explanation: 'Winner: Every single step is backward-compatible; zero locks held; allows instantaneous rollback at any intermediate phase.' },
      { key: 'C', text: 'Create a completely new database and switch DNS records.', isCorrect: false, explanation: 'Complex data synchronization; causes data loss during DNS propagation delay.' },
      { key: 'D', text: 'Execute `ALTER TABLE` inside a multi-hour transaction during peak traffic.', isCorrect: false, explanation: 'Locks the entire table exclusively for the duration of the migration, causing total outage.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/database/schema-migrations'
  },
  {
    day: 54,
    moduleId: 7,
    title: 'Embedding Drift (RAG Maintenance & Re-indexing)',
    focus: 'RAG Maintenance & Re-indexing',
    scenario: 'A company upgrades its internal RAG semantic search embedding model from `text-embedding-ada-002` (1536 dimensions) to a newer model `text-embedding-3-large` (3072 dimensions) for user query encoding. The new query embeddings are compared directly against the historical vector database. Search results become complete gibberish, returning 0% relevant documents.',
    question: 'How do you migrate embedding models and handle vector space drift without taking down active search traffic?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Truncate the new 3072 embeddings down to 1536 by dropping every second float.', isCorrect: false, explanation: 'Mathematical nonsense; destroys the latent vector geometric topology.' },
      { key: 'B', text: 'Implement Dual-Index Migration: Spin up a new vector index, backfill all documents with the new embedding model in the background, verify search quality, and atomic cutover queries.', isCorrect: true, explanation: 'Winner: Vectors from different models can never be compared directly; dual-indexing guarantees zero search downtime and clean cutovers.' },
      { key: 'C', text: 'Multiply the old embeddings by a constant factor in SQL.', isCorrect: false, explanation: 'Vector spaces from different models have completely different coordinate geometries.' },
      { key: 'D', text: 'Delete all historical documents and require users to re-upload files.', isCorrect: false, explanation: 'Unacceptable data loss and customer disruption.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/rag-fundamentals'
  },
  {
    day: 55,
    moduleId: 7,
    title: 'Parallel Agents (Shared State & File Coordination)',
    focus: 'Shared State & File Coordination',
    scenario: 'A software dev team launches 4 autonomous AI subagents in parallel to accelerate refactoring: Agent 1 updates auth, Agent 2 updates database schemas, Agent 3 updates tests, and Agent 4 updates documentation. Because all 4 agents edit the same local workspace directory concurrently, they overwrite each other\'s changes, corrupt files, and produce Git merge conflicts.',
    question: 'How do you coordinate parallel autonomous agents modifying a shared codebase without race conditions?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Allow all agents to edit the same filesystem simultaneously and run `git add -A` every 10 seconds.', isCorrect: false, explanation: 'Guarantees file corruption, clobbered changes, and unresolvable Git conflicts.' },
      { key: 'B', text: 'Isolate each agent in a separate Git Worktree / branch; merge changes sequentially through an integration orchestrator running automated tests.', isCorrect: true, explanation: 'Winner: Complete filesystem isolation; each agent works on independent branches; conflict resolution happens cleanly via PR/merge loops.' },
      { key: 'C', text: 'Serialize agents to run strictly one at a time, eliminating all parallelism.', isCorrect: false, explanation: 'Destroys performance gains of having multiple agents; takes 4x longer.' },
      { key: 'D', text: 'Disable Git version control during agent execution.', isCorrect: false, explanation: 'Eliminates all recovery mechanisms and audit history.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/ai-agents/agents'
  },
  {
    day: 56,
    moduleId: 7,
    title: 'Long-Running Jobs (Polling vs. Webhooks vs. SSE)',
    focus: 'Polling vs. Webhooks vs. SSE',
    scenario: 'A machine learning audio transcription service processes 2-hour podcast recordings. Transcription takes 8 minutes. 5,000 client apps poll the status endpoint `GET /v1/jobs/123` every 200 milliseconds. 25,000 HTTP requests per second flood the API gateway, 99.99% of which return `"status": "PROCESSING"`, consuming 60% of infrastructure costs.',
    question: 'What is the optimal communication pattern to notify clients of asynchronous job completions?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Continue 200ms polling but add 20 more web servers to handle the load.', isCorrect: false, explanation: 'Extremely wasteful infrastructure cost ($15,000/mo) for empty polling responses.' },
      { key: 'B', text: 'Use Webhooks for server-to-server integrations; use Server-Sent Events (SSE) or Exponential Backoff Polling with Jitter for browser/mobile clients.', isCorrect: true, explanation: 'Winner: Eliminates polling traffic completely for webhooks; SSE pushes completion instantly in 1 persistent connection; polling backoff reduces requests by 95%.' },
      { key: 'C', text: 'Keep the client\'s initial HTTP POST connection open for 8 minutes until transcription completes.', isCorrect: false, explanation: 'Corporate firewalls, proxies, and browser HTTP timeouts terminate idle connections after 60 seconds.' },
      { key: 'D', text: 'Send completion notifications via unencrypted SMS text messages to all users.', isCorrect: false, explanation: 'Expensive SMS gateway fees; SMS does not deliver payloads directly into client app code.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/long-running-tasks'
  },
  {
    day: 57,
    moduleId: 7,
    title: 'Read Consistency (Quorum Consistency R + W > N)',
    focus: 'Quorum Consistency R + W > N',
    scenario: 'A distributed key-value store (Cassandra / DynamoDB) is deployed with a replication factor of $N=3$. Writes are configured with `Write Consistency = ONE`, and reads are configured with `Read Consistency = ONE`. A user updates their password. When they immediately attempt to log in, their authentication read hits a replica that hasn\'t received the write yet, rejecting the valid login.',
    question: 'How do you guarantee Strong Read Consistency in leaderless distributed databases without synchronous two-phase locking?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Set both Read and Write consistency to ALL ($R=3, W=3$).', isCorrect: false, explanation: 'Destroys availability; write or read fails if even 1 node out of 3 is undergoing reboot or network blip.' },
      { key: 'B', text: 'Enforce Quorum Consistency: Configure Read and Write quorums such that $R + W > N$ (e.g. $W=\text{QUORUM} (2), R=\text{QUORUM} (2)$ for $N=3$).', isCorrect: true, explanation: 'Winner: Pigeonhole Principle guarantees that the set of nodes read overlaps with the set of nodes written by at least one node, ensuring latest data is always read.' },
      { key: 'C', text: 'Deploy a single master database and abandon distributed databases.', isCorrect: false, explanation: 'Removes high availability and horizontal scaling across multiple availability zones.' },
      { key: 'D', text: 'Insert a 5-second sleep in the client app before attempting login.', isCorrect: false, explanation: 'Unreliable hack that degrades user login experience.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/data-consistency'
  },
  {
    day: 58,
    moduleId: 7,
    title: 'Agent Observability (Tracing LLM Pipelines & OpenTelemetry)',
    focus: 'Tracing LLM Pipelines & OpenTelemetry',
    scenario: 'A complex multi-agent customer support system executes 12 LLM calls and 8 tool executions per user inquiry. Occasionally, an agent returns a nonsensical response or takes 45 seconds to answer. The team only has flat console logs (`logger.info("LLM finished")`), making it impossible to identify which specific agent, prompt, tool, or embedding step stalled or hallucinated.',
    question: 'How do you achieve deep observability and root-cause tracing across distributed AI agent pipelines?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Print all prompts and outputs to standard stdout in terminal.', isCorrect: false, explanation: 'Unstructured text interleaves across concurrent requests; impossible to correlate in high-concurrency production.' },
      { key: 'B', text: 'Implement Distributed Tracing with OpenTelemetry / OpenInference standards: Record hierarchical Spans with inputs, outputs, token counts, latencies, and tool metadata.', isCorrect: true, explanation: 'Winner: Visual trace waterfalls show exact latency breakdown of each sub-call, token usage per agent, and full prompt/completion payloads for debugging.' },
      { key: 'C', text: 'Record screen capture video of the server terminal while running.', isCorrect: false, explanation: 'Absurd overhead; non-searchable, non-scalable, and cannot trigger automated alerts.' },
      { key: 'D', text: 'Disable all logging to maximize inference speed.', isCorrect: false, explanation: 'Blind system operation; impossible to diagnose failures or audit security leaks.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/observability'
  },
  {
    day: 59,
    moduleId: 7,
    title: 'Idempotency Key Design (Deterministic Key Generation & Conflicts)',
    focus: 'Deterministic Key Generation & Conflicts',
    scenario: 'A mobile checkout app generates a random UUID on every request click: `idempotency_key = uuid.v4()`. When a network timeout occurs, the mobile client catches the exception and executes `retry()`. The retry generates a brand new UUID `uuid.v4()`, completely bypassing the server\'s idempotency deduplication cache and charging the user twice.',
    question: 'How do you design and generate robust idempotency keys that survive mobile crashes, retries, and network drops?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Generate random UUIDs on the backend server inside the request handler.', isCorrect: false, explanation: 'The backend receives two distinct HTTP calls; generating keys on server cannot deduplicate client retries.' },
      { key: 'B', text: 'Generate deterministic client-side keys tied to business intent: `SHA256(user_id + cart_id + order_total)` or generate one UUID upon checkout screen render and persist in client storage across retries.', isCorrect: true, explanation: 'Winner: Retries re-send the exact same idempotency token; server detects token in cache and returns cached order response.' },
      { key: 'C', text: 'Use client IP address as the idempotency key.', isCorrect: false, explanation: 'All users behind a corporate office NAT share the same IP; blocks legitimate users from ordering.' },
      { key: 'D', text: 'Do not use idempotency keys; require users to type their password before every payment.', isCorrect: false, explanation: 'Does not prevent network drop retries where the client auto-retries after connection drops.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/time-and-ordering-and-unique-ids'
  },
  {
    day: 60,
    moduleId: 7,
    title: 'SaaS Platform Architecture (Multi-Tenant Isolation & Modular Monoliths)',
    focus: 'Multi-Tenant Isolation & Modular Monoliths',
    scenario: 'A high-growth B2B SaaS startup signs 5,000 small business customers ($50/month) and 5 Fortune 500 banks ($100,000/month). Small businesses need high density to keep cloud costs low. The banks demand strict data isolation, zero noisy-neighbor performance impact, dedicated encryption keys, and SOC2 / HIPAA audit compliance.',
    question: 'How do you architect a multi-tenant SaaS platform that scales cost-effectively for SMBs while meeting strict enterprise isolation requirements?',
    correctOption: 'B',
    options: [
      { key: 'A', text: 'Deploy a single shared database table with `tenant_id` for all customers, including the banks.', isCorrect: false, explanation: 'Fails enterprise bank security audits; noisy SMB queries can slow down bank operations.' },
      { key: 'B', text: 'Adopt a Tiered Hybrid Architecture: Pooled database with Row-Level Security (RLS) for SMBs; dedicated isolated schemas or database instances for Enterprise tenants.', isCorrect: true, explanation: 'Winner: Minimizes infrastructure cost for low-paying users while providing physical security isolation and dedicated compute for enterprise contracts.' },
      { key: 'C', text: 'Provision 5,000 separate Kubernetes clusters and 5,000 independent databases for every SMB tenant.', isCorrect: false, explanation: 'Bankrupts the startup; Kubernetes control plane and database idle compute costs exceed SMB subscription revenue.' },
      { key: 'D', text: 'Split the startup codebase into 35 microservices before signing the first enterprise customer.', isCorrect: false, explanation: 'Premature microservice fragmentation creates massive operational drag; begin with a clean Modular Monolith.' }
    ],
    summary: 'Why B Wins:',
    docLink: '/technical-knowledge/system-design/database-per-service'
  },
];
