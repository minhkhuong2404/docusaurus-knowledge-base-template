#!/usr/bin/env python3
import sys

# Script to assemble all 60 scenarios with deep technical rigor
# We define all 60 days in structured format

DAYS = [
    # --- MODULE 1: Foundational Decoupling & Query Efficiency ---
    {
        "day": 1,
        "module": 1,
        "title": "Decoupling Mobile from Backend (API Gateways vs. BFF)",
        "scenario": "Your iOS and Android mobile apps communicate directly with 40 internal microservices over cellular networks. When the backend team refactors user authentication and splits the profile service into two, thousands of un-updated mobile apps crash or fail to log in due to broken endpoint contracts and massive JSON payload over-fetching on mobile data.",
        "question": "How do you decouple client contract lifecycles from backend service evolution while optimizing battery and cellular bandwidth for mobile devices?",
        "options": [
            ("A", "Force app updates on every mobile client whenever backend APIs change.", False, "Unacceptable mobile UX; app store review latency (24-48h) causes prolonged customer outages."),
            ("B", "Deploy a shared monolithic reverse proxy that forwards all raw microservice JSON responses.", False, "Still returns bloated payloads with 50+ unused fields over cellular networks."),
            ("C", "Deploy dedicated Backend-for-Frontend (BFF) layers tailored to each client type (iOS/Android/Web).", True, "Winner: BFF aggregates calls, aggregates responses, trims unused fields, and insulates clients from internal microservice changes."),
            ("D", "Rewrite all internal microservices to use gRPC directly over mobile cellular links.", False, "Mobile network proxies often strip HTTP/2 trailer headers, breaking gRPC streaming.")
        ],
        "correct": "C",
        "deep_dive": """- **Why C Wins**:
  - **Contract Insulation**: Backend microservices can split, merge, or change data types (e.g. integer IDs to UUIDs). The BFF adapts the data, keeping the mobile contract stable across years of legacy app versions.
  - **Payload Compression & Aggregation**: Rather than an iPhone making 6 cellular round-trips to render a home screen (`GET /user`, `GET /notifications`, `GET /cart`, `GET /deals`), the BFF issues 6 parallel calls over high-speed datacenter fiber (sub-2ms) and returns 1 single compact JSON payload.
- **The Traps**:
  - **Shared Generic Gateway (B)**: When Web, iOS, and Android share 1 gateway, features for one client bloat the payload for all others.
  - **Direct Client-to-Microservice**: Exposing internal IP topology to the public internet creates a massive security attack surface.""",
        "links": "[Backend for Frontend (BFF)](/technical-knowledge/system-design/backend-for-frontend) · [Reverse Proxy & API Gateway](/technical-knowledge/system-design/reverse-proxy-load-balancer-api-gateway)"
    },
    {
        "day": 2,
        "module": 1,
        "title": "Killing the N+1 Query Problem (Eager Loading vs. DataLoaders)",
        "scenario": "An API endpoint `/v1/users?limit=50` loads a list of 50 users along with their primary shipping address and active membership tier. In production, database CPU spikes to 85% at only 300 RPS because the ORM executes 1 query for the users, followed by 50 queries for addresses and 50 queries for memberships (101 SQL queries per HTTP request).",
        "question": "How do you eliminate the N+1 query problem without generating massive SQL cross-join cartesian products?",
        "options": [
            ("A", "Wrap the ORM call in a distributed cache and keep the 101 queries on cache misses.", False, "Cache misses will still crush the database, especially during cache stampedes."),
            ("B", "Use SQL INNER JOIN on all child tables in a single raw query.", False, "Causes Cartesian product bloat if multiple 1-to-many relationships are joined simultaneously."),
            ("C", "Batch ID collection via DataLoaders or two-phase SQL IN clauses (`WHERE user_id IN (...)`).", True, "Winner: Batches sub-queries into O(1) bulk fetch queries, cutting 101 queries down to exactly 3."),
            ("D", "Increase database connection pool size from 50 to 500.", False, "Causes severe CPU context switching and lock contention on Postgres, worsening latency.")
        ],
        "correct": "C",
        "deep_dive": """- **Why C Wins**:
  - **Batching & Deduplication**: The DataLoader pattern collects all entity IDs within the current execution tick and executes a single batched query: `SELECT * FROM addresses WHERE user_id IN (1, 2, ..., 50)`.
  - **Linear Memory & Network**: Avoids Cartesian product row duplication. Joining 50 users × 5 addresses × 3 orders would yield 750 duplicated rows; batched `IN` queries return $50 + 250 + 150 = 450$ distinct records.
- **The Traps**:
  - **Lazy Loading by Default**: ORM lazy-loading is the primary source of production N+1 outages. Always enforce eager batch fetching in production configs.""",
        "links": "[Database Indexing & Optimization](/technical-knowledge/database/indexing-query-optimization) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads)"
    },
    {
        "day": 3,
        "module": 1,
        "title": "Rate Limiting Without Boundary Bursts (Token Bucket vs. Fixed Window)",
        "scenario": "A SaaS endpoint has a rate limit of 100 requests/minute. A client sends 90 requests at 12:59:58 and another 90 requests at 13:00:02. Because the fixed minute window resets at 13:00:00, both bursts pass, sending 180 requests in 4 seconds and crashing downstream databases.",
        "question": "How do you replace the limiter to prevent boundary bursts while allowing legitimate traffic flexibility and O(1) execution?",
        "options": [
            ("A", "Fixed Window with Redis INCR and 60s EXPIRE.", False, "Causes the exact double-burst bug at window boundary resets."),
            ("B", "Sliding Window Log storing every request timestamp in Redis ZSET.", False, "O(N) memory consumption; high CPU running ZREMRANGEBYSCORE on large traffic."),
            ("C", "Token Bucket with mathematical continuous refill rate (Capacity 100, Refill 1.66/s).", True, "Winner: O(1) memory (2 fields), absorbs bursts up to capacity, enforces steady refill rate without boundary resets."),
            ("D", "Leaky Bucket queue buffering requests at constant outflow rate.", False, "Adds network latency to public clients instead of failing fast with HTTP 429.")
        ],
        "correct": "C",
        "deep_dive": """- **Why C Wins**:
  - **Refill on Demand**: `tokens = min(Capacity, tokens + Δt * rate)`. No timer threads required. A burst at `12:59:58` drains tokens to 10; at `13:00:02` (4s later), only $4 \\times 1.66 \\approx 6.6$ tokens exist. The second 90-req burst is correctly throttled with `429 Too Many Requests`.
- **The Traps**:
  - **Sliding Log Memory**: Storing timestamps for 100,000 active users at 50 RPS consumes gigabytes of Redis RAM.""",
        "links": "[Rate Limiting Algorithms](/technical-knowledge/system-design/rate-limiting-algorithms) · [Redis Rate Limiting](/technical-knowledge/redis/redis-rate-limiting)"
    },
    {
        "day": 4,
        "module": 1,
        "title": "Preventing Duplicate Payment Charges (Idempotency Keys & Concurrency)",
        "scenario": "A user clicks 'Pay' twice due to a spinning UI button. Two near-identical POST requests reach the payment service within 15ms. The customer's credit card is charged $200 instead of $100, and two duplicate payment rows are written to the database.",
        "question": "How do you guarantee that repeated or retried checkout requests never double-charge?",
        "options": [
            ("A", "Add a unique SQL constraint on (order_id, amount).", False, "External Stripe call happens before DB commit; if DB crashes after Stripe charges, money is taken without an order."),
            ("B", "Client-generated Idempotency-Key stored in atomic cache before calling payment gateways.", True, "Winner: Protects against both concurrent double-clicks and sequential network drop retries."),
            ("C", "Put a distributed Redis lock around the checkout function.", False, "Only protects concurrent calls; does nothing for retries arriving after the lock is released."),
            ("D", "Wrap payment call in SERIALIZABLE database transaction.", False, "Database transactions cannot rollback external third-party HTTP API charges.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Two-Phase Idempotency Record**:
    1. Insert `(idempotency_key, status=PROCESSING)`. If key already exists, return `409 Conflict` (or wait).
    2. Forward key to Stripe (`Stripe-Idempotency-Key`).
    3. Update key status to `COMPLETED` and cache the response body. Retries immediately return the cached payload.
- **The Traps**:
  - **Database Locks Cannot Undo HTTP**: Once money leaves via credit card network, rolling back a database transaction does not refund the customer.""",
        "links": "[Handling Contention](/technical-knowledge/system-design/handling-contention) · [Banking Payment Lifecycle](/technical-knowledge/banking/payment-lifecycle)"
    },
    {
        "day": 5,
        "module": 1,
        "title": "Choosing a Database Sharding Strategy (Directory-Based vs. Hash)",
        "scenario": "A Postgres orders table has grown to 600 million rows. 80% of read queries are filtered by customer (`WHERE customer_id = ? AND created_at > ?`). Top 1% enterprise 'whale' customers generate 35% of total query and write volume.",
        "question": "Which sharding strategy provides optimal read locality while allowing targeted rebalancing of individual heavy tenants?",
        "options": [
            ("A", "Hash sharding on order_id.", False, "Customer queries must scatter-gather to all physical nodes, killing performance."),
            ("B", "Range sharding on created_at.", False, "Causes massive hot shard on the current month node where all writes and recent reads land."),
            ("C", "Directory-based (lookup) sharding mapping customer_id to specific shards.", True, "Winner: Reads hit exactly 1 shard; whale tenants can be moved to dedicated hardware by updating 1 mapping row."),
            ("D", "Consistent hashing on customer_id with virtual nodes.", False, "Lacks granular control to isolate a specific single enterprise customer without re-balancing neighbor tokens.")
        ],
        "correct": "C",
        "deep_dive": """- **Why C Wins**:
  - **Single-Node Execution**: In Directory sharding, `customer_id` maps to `shard_id` in a cached directory (Redis/in-memory). Queries execute on exactly one node without distributed scatter-gather.
  - **Whale Tenant Mobility**: Notion and Figma use directory sharding. If an enterprise tenant outgrows a shared node, you migrate that tenant's tables to a dedicated instance and point the directory map to the new shard.
- **The Traps**:
  - **Hash on Primary Key (A)**: Forces cross-node aggregations for every customer view.""",
        "links": "[Sharding & Partitioning](/technical-knowledge/system-design/sharding-partitioning) · [Consistent Hashing Deep Dive](/technical-knowledge/system-design/consistent-hashing-deep-dive)"
    },
    {
        "day": 6,
        "module": 1,
        "title": "Safe Distributed Locks (Fencing Tokens & TTL Expiry)",
        "scenario": "A background worker acquires a Redis distributed lock (`SET lock:invoice:42 NX PX 5000`) to generate an invoice. A 7-second Stop-The-World JVM Garbage Collection pause occurs. During the pause, the lock TTL expires, another worker acquires the lock, and both workers write conflicting files to S3.",
        "question": "How do you prevent split-brain writes when distributed lock clients experience arbitrary network or runtime pauses?",
        "options": [
            ("A", "Increase lock TTL from 5 seconds to 10 minutes.", False, "If a worker crashes, the resource remains locked for 10 minutes, stalling pipelines."),
            ("B", "Use a background thread to continuously renew the lock TTL (heartbeat / watchdog).", False, "Helps prevent premature expiration, but does NOT protect against GC pauses that freeze the renewal thread too."),
            ("C", "Use Fencing Tokens: monotonically increasing counter validated by the storage layer on write.", True, "Winner: Storage rejects writes with an older fencing token than the highest token committed so far."),
            ("D", "Replace Redis with a relational database transaction.", False, "Does not solve distributed locking across external storage APIs like S3 or Stripe.")
        ],
        "correct": "C",
        "deep_dive": """- **Why C Wins**:
  - **Storage-Enforced Fencing (Martin Kleppmann)**: Every lock acquisition returns a token $T$ that increments ($T_1, T_2, ...$). When Client 1 wakes from GC pause and attempts write with $T_1$, storage rejects it because Client 2 already committed with $T_2$.
- **The Traps**:
  - **Bare SETNX Assumption**: Assuming a lock is held throughout an entire execution block without storage verification is a fundamental distributed systems fallacy.""",
        "links": "[Redis Distributed Lock](/technical-knowledge/redis/redis-distributed-lock) · [Handling Contention](/technical-knowledge/system-design/handling-contention)"
    },
    {
        "day": 7,
        "module": 1,
        "title": "Event Ordering (SQS FIFO & Message Group IDs)",
        "scenario": "An order processing pipeline receives status events: `OrderCreated`, `OrderPaid`, and `OrderCancelled`. Because messages are processed by 20 parallel worker threads across 5 pods, `OrderPaid` occasionally executes before `OrderCreated`, causing foreign key crashes and ghost payments.",
        "question": "How do you guarantee strict causal ordering per customer order while preserving high horizontal processing concurrency?",
        "options": [
            ("A", "Run a single consumer thread on a single worker node.", False, "Destroys throughput; system cannot scale past 100 events/sec."),
            ("B", "Partition messages using a Message Group ID / Partition Key (`order_id`) on FIFO queues or Kafka.", True, "Winner: Messages with the same order_id are guaranteed strict sequential processing; distinct orders process concurrently in parallel."),
            ("C", "Add timestamps to messages and sleep in the worker until older timestamps arrive.", False, "Unreliable due to clock drift and unpredictable network transmission latency."),
            ("D", "Store events in a database table and poll with `ORDER BY created_at`.", False, "Poll table scanning creates severe database lock contention and high latency.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Entity-Level Serialization**: In SQS FIFO or Kafka, setting `MessageGroupId = order_id` (or partition key) guarantees that all events for Order 123 land in the same partition and are consumed sequentially by 1 consumer, while Order 124 processes concurrently on another consumer.
- **The Traps**:
  - **Single Monolithic Queue**: Enforcing global ordering across all orders bottlenecks total throughput to that of 1 CPU core.""",
        "links": "[Message Queues](/technical-knowledge/system-design/message-queues) · [Kafka Topic Partitioning](/technical-knowledge/kafka/core/topic-partition-architecture)"
    },
    {
        "day": 8,
        "module": 1,
        "title": "Cache and Database Sync (Cache-Aside vs. Write-Through & CDC)",
        "scenario": "An inventory service caches product stock in Redis. When an item sells out, the service updates the database and immediately updates the Redis key. Concurrent buyers under high concurrency cause the database to reflect `0`, but Redis caches `1`, leading to customer orders for out-of-stock items.",
        "question": "How do you keep cache and database consistent without race conditions during concurrent updates?",
        "options": [
            ("A", "Update Redis first, then commit to database.", False, "Catastrophic; if DB commit fails, cache contains phantom data that was never persisted."),
            ("B", "Update database first, then delete (invalidate) the Redis cache key.", True, "Winner: Cache-Aside with deletion eliminates concurrent overwrite races. Next read populates fresh data."),
            ("C", "Update database and Redis within a distributed two-phase commit transaction.", False, "Prohibitively slow; Redis does not support standard XA two-phase commit."),
            ("D", "Set cache TTL to 1 second and never invalidate explicitly.", False, "High DB load every second; stale data window still exists.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Delete Instead of Update**: If Thread A and Thread B write concurrently, updating the cache causes race conditions where an older write overwrites a newer write. Deleting the key forces subsequent reads to fetch latest committed DB state.
  - **Change Data Capture (CDC)**: For zero dual-write bugs, use Debezium reading Postgres WAL to emit invalidation events to Redis.
- **The Traps**:
  - **Dual-Write Interleaving**: Interleaving two updates causes silent persistent cache divergence.""",
        "links": "[Caching Strategies](/technical-knowledge/system-design/caching-strategies) · [Redis Distributed Cache](/technical-knowledge/redis/redis-distributed-cache)"
    },

    # --- MODULE 2: Data Distribution & Indexing ---
    {
        "day": 9,
        "module": 2,
        "title": "CQRS (Splitting Read and Write Models)",
        "scenario": "An order management system handles 8,000 writes/min (stock reservations, status updates) and 40,000 reads/min. Analytics dashboards joining 7 tables spike Postgres CPU to 90% every morning, causing write transactions to time out and drop orders.",
        "question": "How do you decouple complex read analytics from high-frequency transactional writes without write amplification?",
        "options": [
            ("A", "Full CQRS: Normalized 3NF write database projected asynchronously via CDC into a denormalized read store.", True, "Winner: Isolates failure domains; writes stay fast and ACID, while reads query pre-joined flat documents."),
            ("B", "Direct read dashboards to Postgres read replicas.", False, "Replica CPU still spikes to 90%, causing massive replication lag and stale reads."),
            ("C", "Denormalize the primary write database tables.", False, "Massive write amplification; updating user addresses locks and updates millions of order rows."),
            ("D", "Add GraphQL with DataLoader to the frontend.", False, "Batches network calls between services, but does not solve database SQL join costs.")
        ],
        "correct": "A",
        "deep_dive": """- **Why A Wins**:
  - **Specialized Storage**: Write models prioritize row-level integrity and low-latency locking (3NF). Read models prioritize single-key lookups without joins (Elasticsearch or denormalized Postgres read tables).
  - **Failure Domain Isolation**: Heavy reporting queries can never exhaust write connection pools.
- **The Traps**:
  - **Eventual Consistency Window**: UI must account for slight replication delay between write commit and read projection.""",
        "links": "[CQRS Pattern](/technical-knowledge/system-design/cqrs) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads)"
    },
    {
        "day": 10,
        "module": 2,
        "title": "Distributed Transactions (Saga Orchestration vs. 2PC)",
        "scenario": "A microservices checkout workflow coordinates Inventory, Payment (Stripe), and Shipping. If shipping label creation fails, stock must be released and the credit card refunded. Third-party APIs like Stripe cannot participate in database distributed locking.",
        "question": "Why does Two-Phase Commit (2PC) fail in modern distributed microservices, and how does Saga resolve it?",
        "options": [
            ("A", "2PC is ideal; configure a global transaction coordinator across all HTTP endpoints.", False, "External APIs like Stripe do not support the PREPARE phase of 2PC; holding locks stalls connections."),
            ("B", "Use Saga Orchestration with explicit compensating transactions.", True, "Winner: Executes a sequence of local ACID transactions; triggers reverse compensations on failure."),
            ("C", "Execute all steps asynchronously without tracking rollback state.", False, "Leaves partial state; money taken without stock or shipping."),
            ("D", "Use Transactional Outbox without a coordinator.", False, "Outbox guarantees message dispatch, but cannot coordinate multi-step reverse compensation logic.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Local Transactions + Compensation**: Each microservice commits locally. If Step 3 fails, the orchestrator invokes Step 2 compensation (`RefundStripe`) and Step 1 compensation (`ReleaseInventory`).
  - **No Blocking Locks**: No long-held distributed locks; services remain responsive.
- **The Traps**:
  - **Semantic Rollback**: Compensations cannot physically undo the past; they apply semantic fixes (e.g. issuing a refund rather than un-executing a charge).""",
        "links": "[Saga Pattern](/technical-knowledge/system-design/saga-pattern) · [Two-Phase Commit (2PC)](/technical-knowledge/system-design/two-phase-commit)"
    },
    {
        "day": 11,
        "module": 2,
        "title": "Handling Webhook Retries (Idempotent Receivers)",
        "scenario": "Your payment gateway sends webhooks for charge updates. An application pod restarts midway through reading a webhook. The gateway retries delivery 10 seconds later, but a second pod receives an out-of-order event where `charge.refunded` arrives before `charge.paid`.",
        "question": "How do you architect a resilient webhook receiver that handles duplicates and out-of-order retries safely?",
        "options": [
            ("A", "Process webhook synchronously in the HTTP request handler thread.", False, "Slow DB execution causes gateway timeout (HTTP 504), triggering retry storms."),
            ("B", "Fast ACK (200 OK) into durable queue; validate state machine transitions in async worker.", True, "Winner: Decouples network ACK from processing; state machine rejects invalid state regressions (REFUND -> PAID)."),
            ("C", "Discard retried webhooks based on timestamp.", False, "Clock drift between gateway and servers causes legitimate events to be dropped."),
            ("D", "Return HTTP 500 on duplicate to tell the gateway to stop.", False, "HTTP 500 signals error, causing the gateway to accelerate retry frequency.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Fast Ingestion ACK**: Verify signature, store `(event_id)` into queue, return `200 OK` in <50ms.
  - **Strict State Machine**: If order status is `REFUNDED`, worker rejects any `PAID` transition received later.
- **The Traps**:
  - **The 1% Problem**: Webhook handlers that don't enforce transition validity fail silently in production.""",
        "links": "[Webhook Architecture](/technical-knowledge/system-design/webhook) · [Retry Pattern](/technical-knowledge/system-design/retry-pattern)"
    },
    {
        "day": 12,
        "module": 2,
        "title": "Indexing High-Ingest Tables (Write-Heavy Optimization)",
        "scenario": "An IoT service ingests 50,000 telemetry events per second into Postgres. Adding 4 secondary B-Tree indexes on device metrics causes write latency to surge from 2ms to 140ms, saturating disk write IOPS and crashing WAL checkpoints.",
        "question": "How do you support fast time-range queries without destroying database write throughput?",
        "options": [
            ("A", "Add composite B-Trees with 5 columns each.", False, "Massive write amplification; each insert causes multiple random disk I/O operations."),
            ("B", "Use Block Range Index (BRIN) or append-only LSM trees for time-ordered data.", True, "Winner: BRIN stores min/max per 128 disk pages, cutting index size and write overhead by over 90%."),
            ("C", "Remove all indexes and use sequential table scans.", False, "Fixes writes, but causes analytical queries to time out."),
            ("D", "Store records in CSV text files on local disk.", False, "Lacks durability, atomic transactions, and concurrent query safety.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **BRIN Footprint**: For naturally ordered time-series data, BRIN indexes store tiny boundary summaries rather than every single row pointer. An index that takes 10GB in B-Tree takes 5MB in BRIN.
  - **HOT Updates**: In Postgres, avoiding index updates on append allows Heap-Only Tuples (HOT), eliminating secondary index write penalties.
- **The Traps**:
  - **Index Bloat**: Every new B-Tree index slows down every single SQL insert.""",
        "links": "[PostgreSQL Heap Architecture](/technical-knowledge/database/postgresql-heap-storage-architecture) · [PostgreSQL BRIN Index Guide](/technical-knowledge/database/postgresql-brin-index-guide)"
    },
    {
        "day": 13,
        "module": 2,
        "title": "Shared Connection Pools (Database Proxying)",
        "scenario": "A Kubernetes cluster scales to 1,000 microservice pods during a flash sale. Each pod configures a local connection pool of 20 connections to PostgreSQL. 20,000 connections hit Postgres, which immediately runs out of memory and crashes because each connection consumes 10MB of RAM.",
        "question": "How do you allow thousands of dynamic microservice pods to share limited database connections efficiently?",
        "options": [
            ("A", "Set `max_connections = 50000` in `postgresql.conf` and add 1TB RAM.", False, "OS process context switching and lock contention will reduce Postgres throughput to near zero."),
            ("B", "Deploy an intermediate database proxy (PgBouncer) in transaction pooling mode.", True, "Winner: Multiplexes 20,000 client connections into a tight pool of ~100 active physical server connections."),
            ("C", "Configure pods to open and close connections on every single HTTP request.", False, "TCP handshake and TLS negotiation on every request adds 50ms latency and spikes CPU."),
            ("D", "Replace relational database with SQLite embedded on each pod.", False, "Eliminates centralized ACID consistency and prevents shared transactions across pods.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Transaction Pooling**: Web applications spend 95% of connection time waiting on network/app logic. PgBouncer assigns a physical database connection only while an active SQL transaction executes, recycling it immediately afterwards.
- **The Traps**:
  - **Session-Level Features in Transaction Pooling**: Prepared statements and temporary tables must be handled carefully when multiplexing connections across different clients.""",
        "links": "[Connection Pooling](/technical-knowledge/database/connection-pooling) · [HikariCP Sizing](/technical-knowledge/interview-questions/java/java-lead-interview-questions)"
    },
    {
        "day": 14,
        "module": 2,
        "title": "Safely Rolling Out Changes (Feature Flags & Canary Deploys)",
        "scenario": "A critical payment routing algorithm is updated to save 0.5% in interchange fees. The deploy is pushed to 100% of production traffic at once. An unhandled currency edge-case causes 15% of checkout transactions in Europe to fail, costing $400,000 before an emergency rollback finishes 30 minutes later.",
        "question": "How do you deploy high-risk architectural updates while constraining blast radius and enabling instant rollbacks?",
        "options": [
            ("A", "Deploy directly to production during off-peak midnight hours.", False, "Off-peak hours lack realistic production load, masking concurrency bugs until morning peak."),
            ("B", "Combine Canary deployments (route 1% -> 5% -> 25% -> 100%) with dynamic Feature Flags.", True, "Winner: Confines errors to 1% of users; feature flags allow instant 0-second killswitch without redeploying code."),
            ("C", "Run unit tests and bypass staging environments.", False, "Unit tests cannot catch distributed environment issues like network timeouts and DB lock contention."),
            ("D", "Duplicate entire infrastructure for 6 months (Parallel Run) without switching traffic.", False, "Extremely expensive and fails to test real customer write traffic interaction.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Blast Radius Limitation**: A canary routes 1% of traffic. Automated metrics detect error rate elevation (>0.1%) and abort rollout within 60 seconds.
  - **Decoupling Deployment from Release**: Code is deployed dark behind a feature toggle. Product and engineering toggle it on incrementally.
- **The Traps**:
  - **Flag Debt**: Forgetting to remove old feature flags creates spaghetti conditional logic across the codebase.""",
        "links": "[Feature Toggles](/technical-knowledge/system-design/feature-toggle) · [Deployment Strategies](/technical-knowledge/system-design/deployment-strategies)"
    },
    {
        "day": 15,
        "module": 2,
        "title": "Membership Checks (Bloom Filters & False Positives)",
        "scenario": "A social network allows users to pick unique handles. 50,000 registration requests per minute check handle availability (`GET /usernames/check?name=X`). 98% of checks are for already-taken or available names, but every check executes a database index lookup, consuming 40% of database read IOPS.",
        "question": "How do you determine if a string exists in a set of 500 million keys in sub-millisecond time with minimal RAM?",
        "options": [
            ("A", "Store all 500M handles in a Redis Set (`SISMEMBER`).", False, "Requires 30GB+ of expensive RAM to store raw string keys."),
            ("B", "Use an in-memory Bloom Filter before hitting the database.", True, "Winner: 500M keys fit in ~600MB RAM. Guarantees 0% false negatives; handles 98% of non-existent checks instantly."),
            ("C", "Cache checked usernames in an LRU cache with 10-minute TTL.", False, "Long tail of random usernames results in low cache hit ratio (<15%)."),
            ("D", "Rely on database unique constraints during final form submission only.", False, "Terrible user UX; user types entire form only to find out handle is taken on submit.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Mathematical Efficiency**: A Bloom filter uses $k$ hash functions over a bit array. If the filter says \"No\", the item definitely **does not exist** in the database (0% false negative rate). You skip the database query completely.
  - **Tolerating False Positives**: If it says \"Maybe\", you query the database to verify. Tuning the bit array size maintains false positive rate at 1%.
- **The Traps**:
  - **Deletions**: Standard Bloom filters cannot delete items. If handles can be released, use a Counting Bloom Filter or Cuckoo Filter.""",
        "links": "[Bloom Filters Deep-Dive](/technical-knowledge/system-design/bloom-filters) · [Caching Strategies](/technical-knowledge/system-design/caching-strategies)"
    },
    {
        "day": 16,
        "module": 2,
        "title": "Taming Hot Partitions (Shard Key Salting & Splitting)",
        "scenario": "A live-streaming platform tracks video view counts in a sharded database partitioned by `video_id`. A viral world cup video receives 200,000 view increments per second. Shard 4 (hosting that video ID) crashes under 100% CPU, while 15 other shards sit idle at 3% utilization.",
        "question": "How do you distribute high-throughput writes to a single logical entity across multiple physical database partitions?",
        "options": [
            ("A", "Move the viral video to an in-memory Redis instance with no persistence.", False, "Single Redis thread will still bottleneck; risk of total count loss on node crash."),
            ("B", "Salt the shard key: append a random suffix `video_123_salt_{0..9}` to scatter writes, then sum on read.", True, "Winner: Distributes writes evenly across 10 shards; reads aggregate the 10 sub-counters."),
            ("C", "Increase database server CPU size from 16 to 128 cores.", False, "Vertical scaling is temporary and expensive; row-level lock contention on one counter remains."),
            ("D", "Re-shard the entire cluster using range-based partitioning.", False, "Range partitioning worsens hot partitions on current popular content.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Distributed Counter Sharding**: Writes pick random salt $S \\in [0..N-1]$: `INCR counter:video_123:S`. Instead of 1 shard handling 200K writes/sec, 10 shards handle 20K writes/sec each.
  - **Aggregation on Read**: `total = sum(counter:video_123:0 .. counter:video_123:9)`. Since reads happen less frequently or can be cached, this trades slight read cost for massive write scalability.
- **The Traps**:
  - **Over-Salting**: Setting salt range too high ($N=1000$) makes reads slow and expensive.""",
        "links": "[Sharded Counters & Leaderboards](/technical-knowledge/system-design/sharded-counters-and-leaderboards) · [Sharding & Partitioning](/technical-knowledge/system-design/sharding-partitioning)"
    },

    # --- MODULE 3: Resilience & Reliability ---
    {
        "day": 17,
        "module": 3,
        "title": "Backpressure (Consumer Throttling & Bounded Queues)",
        "scenario": "An image processing pipeline has a message queue between an upload service and worker pods running thumbnail resizing. An upload spike sends 50,000 images in 2 minutes. Worker nodes pull messages into unbounded memory buffers, run out of RAM, and restart in an OOM (Out-Of-Memory) crash loop.",
        "question": "How do you protect slow downstream consumers from being overwhelmed by fast upstream message producers?",
        "options": [
            ("A", "Configure unbounded in-memory queues on all worker pods.", False, "Primary cause of production OOM crashes during traffic bursts."),
            ("B", "Enforce bounded in-memory queues and reactive consumer backpressure (pull-based flow control).", True, "Winner: Workers pull only what they have CPU/RAM capacity to process (prefetch limits); upstream buffers absorb excess."),
            ("C", "Drop all incoming messages when worker CPU reaches 80%.", False, "Causes catastrophic data loss of customer uploaded images."),
            ("D", "Increase pod memory limit to 64GB.", False, "Temporarily delays the crash until a slightly larger spike arrives.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Pull vs. Push Control**: In pull-based systems (Kafka / SQS with prefetch = 10), workers explicitly request batches only when idle. Memory consumption is strictly bounded: $N_{workers} \\times prefetch \\times image\\_size$.
  - **Durable Queue Buffering**: Unprocessed messages sit safely on durable broker disks rather than volatile pod RAM.
- **The Traps**:
  - **Unbounded Prefetch**: Defaulting AMQP/RabbitMQ prefetch to 0 tells the broker to dump all queued messages to the first connected client.""",
        "links": "[Load Balancing & Reliability](/technical-knowledge/system-design/load-balancing-reliability) · [Kafka Consumer Poll Loop](/technical-knowledge/kafka/consumer/consumer-overview)"
    },
    {
        "day": 18,
        "module": 3,
        "title": "Cache Stampedes (Lock X-Fetching & Probabilistic Leaping)",
        "scenario": "The homepage of an e-commerce site caches top deals under key `deals:featured` with a 1-hour TTL. At 14:00:00, the key expires. 5,000 concurrent HTTP requests arrive in the same second, all miss the cache simultaneously, and all 5,000 query the database at once, taking it offline.",
        "question": "How do you prevent a cache stampede (thundering herd) when high-traffic cache keys expire?",
        "options": [
            ("A", "Increase cache TTL to 24 hours.", False, "Delays the problem; when it expires at 24 hours, the crash still happens."),
            ("B", "Implement Probabilistic Early Expiration (XFetch) or Mutex Lock on cache misses.", True, "Winner: Only 1 worker recomputes the key while others wait or serve slightly stale data; or recomputes before expiry probabilistically."),
            ("C", "Never expire keys; update them manually via cron job only.", False, "Fragile; if cron fails or key is missing, content remains forever blank or stale."),
            ("D", "Add 10 database read replicas.", False, "Costly and inefficient; serving 5,000 identical queries from database nodes is wasteful.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Probabilistic Early Expiration (XFetch algorithm)**: Computes a probability of re-fetching as the key nears expiry: $-\\beta \\times \\delta \\times \\ln(random()) > (TTL - now)$. As expiry approaches, exactly ONE client proactively refreshes the cache *before* it expires.
  - **Mutex Lock (Dogpile Prevention)**: On cache miss, first thread acquires a Redis lock to query DB; remaining threads wait or return stale cache value.
- **The Traps**:
  - **Synchronous Recalculation**: Having 10,000 clients recalculate the same value simultaneously is the #1 killer of web database clusters.""",
        "links": "[Caching Strategies (Stampede & Dogpiling)](/technical-knowledge/system-design/caching-strategies) · [Redis Performance Patterns](/technical-knowledge/redis/redis-performance-patterns)"
    },
    {
        "day": 19,
        "module": 3,
        "title": "Read-Your-Writes Consistency (Replication Lag & Session Pinning)",
        "scenario": "To scale read throughput, you deploy 3 read replicas behind primary Postgres. A user updates their profile bio and is redirected to their profile view. The view reads from Replica 2, which suffers from 500ms replication lag. The user sees their old bio, thinks the save failed, and spams the save button.",
        "question": "How do you ensure a user always sees their own updates immediately without forcing all site traffic onto the primary database?",
        "options": [
            ("A", "Switch database to synchronous replication across all replicas.", False, "Write latency increases dramatically; write fails if one replica stalls on network."),
            ("B", "Session Pinning: Route that specific user's reads to the primary database for a 5-second window after any write.", True, "Winner: Guarantees author consistency; remaining 99.9% read-only users continue querying read replicas."),
            ("C", "Insert `setTimeout(1000)` in client frontend code before fetching.", False, "Unreliable hack; if replication lag spikes to 1.5s during load, user still sees stale data."),
            ("D", "Disable caching and read replicas entirely.", False, "Destroys horizontal scalability; single primary database will quickly saturate CPU.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Session Lease Window**: When user executes a write, write gateway sets a signed cookie or Redis key: `user:123:recent_write = timestamp`. For the next 5 seconds, all reads from user 123 go to primary.
  - **Monotonic Read Consistency**: Other users reading user 123's profile can tolerate 500ms lag, but the author cannot.
- **The Traps**:
  - **Global Pinning**: Pinning all users to primary defeats the purpose of read replicas.""",
        "links": "[Data Consistency Models](/technical-knowledge/system-design/data-consistency) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads)"
    },
    {
        "day": 20,
        "module": 3,
        "title": "Failing Downstream Dependencies (Circuit Breaker Pattern)",
        "scenario": "Your checkout service calls an external address verification API. The address API begins taking 25 seconds per request before timing out. Checkout threads pile up waiting for timeouts. Within 90 seconds, all 200 Tomcat worker threads are blocked, and checkout crashes completely for all customers.",
        "question": "How do you prevent a slow or failing downstream dependency from cascading into total system failure?",
        "options": [
            ("A", "Increase HTTP client timeout from 25 seconds to 60 seconds.", False, "Worsens the outage; threads remain trapped even longer, accelerating thread starvation."),
            ("B", "Implement a Circuit Breaker (Resilience4j / Envoy) with short timeouts and cached fallbacks.", True, "Winner: Trips to OPEN state after error threshold, fails fast instantly in 0ms, and serves fallback data."),
            ("C", "Retry failed requests 5 times immediately in a while loop.", False, "Creates a retry storm that further overwhelms the already struggling downstream API."),
            ("D", "Run checkout without address validation forever.", False, "Exposes business to invalid shipping addresses and fraudulent deliveries.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Three-State Machine (Closed -> Open -> Half-Open)**: When error rate exceeds 50% over a 10s window, the breaker trips to **OPEN**. Subsequent requests fail immediately (0ms) without consuming worker threads.
  - **Graceful Fallback**: Return cached address or proceed with warning, allowing checkout to complete.
- **The Traps**:
  - **Unbounded Timeouts**: The silent killer of distributed systems is not immediate errors (HTTP 500), but slow lingering responses (20s latency).""",
        "links": "[Circuit Breaker Pattern](/technical-knowledge/system-design/circuit-breaker-pattern) · [Bulkhead Pattern](/technical-knowledge/system-design/bulkhead-pattern)"
    },
    {
        "day": 21,
        "module": 3,
        "title": "Streaming Transports (WebSockets vs. Server-Sent Events)",
        "scenario": "A financial brokerage platform must stream real-time stock ticker updates and market news alerts to 150,000 web browser users. The initial implementation uses WebSockets, but corporate enterprise proxies terminate connections, and server memory consumption is high due to stateful socket tracking.",
        "question": "Which streaming transport provides the best reliability, simplicity, and proxy traversal for unidirectional server-to-client updates?",
        "options": [
            ("A", "Short polling with HTTP GET every 200ms.", False, "Generates 750,000 HTTP requests/sec; massive header overhead and gateway CPU exhaustion."),
            ("B", "WebSockets with continuous bidirectional heartbeats.", False, "Stateful protocol overkill for unidirectional data; frequently blocked by corporate firewalls."),
            ("C", "Server-Sent Events (SSE) over HTTP/2.", True, "Winner: Standard HTTP text/event-stream, native browser auto-reconnection, multiplexed over HTTP/2, traverses proxies cleanly."),
            ("D", "Raw UDP socket streaming directly to browser clients.", False, "Browsers do not permit raw UDP socket connections due to sandbox security policies.")
        ],
        "correct": "C",
        "deep_dive": """- **Why C Wins**:
  - **Unidirectional Fit**: If client only receives data (ticker prices, notifications, LLM token streams), SSE is superior to WebSockets. It uses standard HTTP, supports automatic browser reconnection (`Last-Event-ID`), and multiplexes cleanly over a single HTTP/2 connection.
- **The Traps**:
  - **When to Use WebSockets**: Reserve WebSockets for true bidirectional, high-frequency uplink/downlink scenarios like multiplayer gaming or collaborative text editing.""",
        "links": "[Real-Time Updates (WebSocket vs SSE)](/technical-knowledge/system-design/real-time-updates) · [HTTP & HTTPS Application Layer](/technical-knowledge/networking/http-https-application-layer)"
    },
    {
        "day": 22,
        "module": 3,
        "title": "Reliable Messaging (Transactional Outbox Pattern & CDC)",
        "scenario": "When an order is created, the order service updates the database and publishes an `OrderCreated` event to Kafka. Occasionally, the database transaction commits successfully, but the network to Kafka drops. The Kafka message is never published, so the shipping service never fulfills the paid order.",
        "question": "How do you guarantee that database state changes and message queue event publication occur atomically without two-phase commit?",
        "options": [
            ("A", "Publish to Kafka inside the database transaction before committing.", False, "Catastrophic; if Kafka succeeds but database commit fails, an event is published for an order that doesn't exist."),
            ("B", "Use the Transactional Outbox Pattern with Change Data Capture (Debezium) or polling publisher.", True, "Winner: Write event into an `outbox` database table within the same ACID transaction; async process publishes to Kafka reliably."),
            ("C", "Wrap database and Kafka in an XA distributed transaction.", False, "Kafka does not support XA/2PC transactions; performance degrades severely."),
            ("D", "Add a cron job that checks for unfulfilled orders every 24 hours.", False, "Orders are delayed by 24 hours; cron jobs miss edge-cases and scale poorly.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Guaranteed At-Least-Once Delivery**: The business record and outbox message commit within the same local ACID transaction. A CDC tailer (Debezium) reads the database WAL log and pushes to Kafka. Message loss is impossible.
- **The Traps**:
  - **Dual-Write Vulnerability**: Never attempt to write to two independent distributed systems (DB + Queue) in sequence without an outbox.""",
        "links": "[Transactional Outbox Pattern](/technical-knowledge/system-design/outbox-pattern) · [Change Data Capture (CDC)](/technical-knowledge/system-design/cdc)"
    },
    {
        "day": 23,
        "module": 3,
        "title": "Feed Fanout (Hybrid Push vs. Pull for High-Follower Accounts)",
        "scenario": "A Twitter-like social platform uses fanout-on-write: when a user posts a tweet, background workers insert the tweet ID into every follower's home timeline inbox. A celebrity with 60 million followers posts a photo. The fanout queue is flooded with 60M write jobs, lagging the message broker by 45 minutes for all regular users.",
        "question": "How do you architect a timeline feed system that handles both regular users and viral accounts with tens of millions of followers?",
        "options": [
            ("A", "Switch entirely to fanout-on-read (pull) for all users.", False, "Home timeline load requires joining hundreds of followee tables, making reads slow and expensive."),
            ("B", "Hybrid Fanout: Push (fanout-on-write) for regular users; Pull (fanout-on-read) for celebrity accounts.", True, "Winner: 99.9% of posts fan out instantly; celebrity tweets are merged into the follower's timeline only when the follower opens the app."),
            ("C", "Limit maximum user follower count to 100,000.", False, "Unacceptable product limitation for a global social media platform."),
            ("D", "Store all timelines in a single central SQL table without indexing.", False, "Scanning hundreds of millions of rows per timeline fetch will take database down.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **The Celebrity Cutoff**: If a user has $<20,000$ followers, fan out on write into followers' Redis timeline lists. If $>20,000$ followers, do NOT fan out.
  - **Read-Time Merge**: When User X opens their timeline, fetch their pre-computed Redis inbox and merge in recent tweets from the celebrities they follow.
- **The Traps**:
  - **Pure Fanout-on-Write**: A single tweet by a celebrity causes write storms that delay system-wide notifications.""",
        "links": "[Common Interview Questions (Design Twitter)](/technical-knowledge/system-design/common-interview-questions#2-design-twitter--social-feed) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads)"
    },
    {
        "day": 24,
        "module": 3,
        "title": "Efficient Pagination (Keyset / Cursor vs. Deep Offset)",
        "scenario": "A public data API provides order history search. A scraping bot accesses `/v1/orders?offset=1000000&limit=20`. Database CPU spikes to 100%, and query latency jumps to 14 seconds because the database engine must scan and discard 1,000,000 rows in memory before returning the 20 requested records.",
        "question": "How do you design high-performance pagination across tables with millions of records?",
        "options": [
            ("A", "Keep `OFFSET` pagination and cache each page offset in Redis.", False, "Infinite cache combinations; cache miss on deep pages will still crash the database."),
            ("B", "Keyset (Cursor-based) Pagination: `WHERE (created_at, id) < (cursor_time, cursor_id) ORDER BY created_at DESC LIMIT 20`.", True, "Winner: Uses B-Tree index seek ($O(\\log N)$); execution time is identical whether fetching page 1 or page 50,000."),
            ("C", "Limit maximum pagination depth to 5 pages and throw HTTP 400 for anything higher.", False, "Breaks valid export jobs and administrative data audit requirements."),
            ("D", "Use SQL sub-queries with `IN (SELECT id FROM ... OFFSET 1000000)`.", False, "The sub-query still scans 1,000,000 rows, offering minimal performance gain.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Index Seek vs. Table Scan**: `OFFSET 1,000,000` requires reading 1,000,020 tuples from disk and throwing away the first million. Keyset pagination jumps directly to the cursor row using the B-Tree index in $<1$ms.
  - **Stable Results**: If new rows are inserted while a user is scrolling, Keyset pagination prevents duplicate or skipped items that plague offset pagination.
- **The Traps**:
  - **Random Page Jumping**: Keyset pagination does not support \"Jump directly to page 47\"; it requires forward/backward sequential cursors.""",
        "links": "[API Design](/technical-knowledge/system-design/api-design) · [Database Indexing & Query Optimization](/technical-knowledge/database/indexing-query-optimization)"
    },

    # --- MODULE 4: High-Performance Data & Search ---
    {
        "day": 25,
        "module": 4,
        "title": "Queue Backpressure (Traffic Spike Buffering)",
        "scenario": "During Black Friday ticket drops, incoming checkout HTTP requests surge from 1,000 RPS to 80,000 RPS. Downstream inventory and fraud databases can only sustain 5,000 write transactions/sec. Synchronous HTTP request threads back up, connection pools exhaust, and the gateway returns 502 Bad Gateway to 90% of buyers.",
        "question": "How do you ingest massive transient traffic bursts without dropping requests or crashing transactional databases?",
        "options": [
            ("A", "Provision 20x database capacity all year round.", False, "Prohibitively expensive; databases remain 95% idle outside of rare flash sales."),
            ("B", "Introduce a durable distributed queue (Kafka / AWS SQS) to buffer incoming orders; downstream consumers process at steady 5,000 RPS.", True, "Winner: Decouples write ingestion from processing speed; durable message log absorbs the 80K spike safely."),
            ("C", "Drop incoming requests with HTTP 429 once database reaches 80% CPU.", False, "Poor customer experience; leads to lost revenue during prime promotional events."),
            ("D", "Store orders in client browser LocalStorage and have browser retry every 5 seconds.", False, "Fails if user closes tab; no inventory reservation guarantee; vulnerable to client tampering.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Shock Absorber Pattern**: The API gateway writes directly to Kafka in $<5$ms. Even if 500,000 orders arrive in 10 seconds, Kafka writes append-only sequentially to disk. Consumers pull and commit to Postgres at their sustainable pace of 5,000 RPS.
  - **Asynchronous ACK**: Customer receives \"Order Queued - Processing\" ticket with polling/webhook status.
- **The Traps**:
  - **Consumer Lag Monitoring**: Monitor queue lag closely; scale consumer pods horizontally if processing time exceeds SLA.""",
        "links": "[Message Queues](/technical-knowledge/system-design/message-queues) · [Dead Letter Queue (DLQ)](/technical-knowledge/system-design/dead-letter-queue)"
    },
    {
        "day": 26,
        "module": 4,
        "title": "Write-Path Consistency (Cache Invalidation & Dual-Write Mitigation)",
        "scenario": "An enterprise inventory service caches SKU stock levels in Redis. To update stock, the service executes `db.update(sku)` followed by `redis.del(sku)`. Under network instability, the DB commit succeeds, but the network to Redis resets. The cache retains the old stock value for 24 hours, causing incorrect inventory displays across the entire website.",
        "question": "How do you guarantee that cache invalidations are never lost after a database transaction commits?",
        "options": [
            ("A", "Retry the Redis delete operation 3 times synchronously in the HTTP thread.", False, "If the application pod crashes or Redis is temporarily partitioned, retries fail and invalidation is lost."),
            ("B", "Use Change Data Capture (CDC via Debezium) listening to the database Write-Ahead Log (WAL) to emit invalidation events.", True, "Winner: Guarantees cache invalidation is tied directly to committed database transactions, surviving application crashes."),
            ("C", "Delete the Redis cache before updating the database.", False, "Classic race condition: concurrent reader immediately fetches old DB value and repopulates cache with stale data."),
            ("D", "Set Redis TTL to 3 seconds for all keys.", False, "Overwhelms database with read traffic every 3 seconds; still exhibits a 3-second inconsistency window.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **WAL as Source of Truth**: Postgres WAL records every committed transaction durably. Debezium reads the WAL stream and publishes an invalidation event to Kafka. The cache invalidator consumes from Kafka and removes the key.
  - **Zero Dual-Write Coupling**: The application writes only to the database, eliminating dual-write race conditions.
- **The Traps**:
  - **Replication Delay**: There is a sub-second eventual consistency delay between WAL generation and cache invalidation.""",
        "links": "[Caching Strategies](/technical-knowledge/system-design/caching-strategies) · [CDC Pattern](/technical-knowledge/system-design/cdc)"
    },
    {
        "day": 27,
        "module": 4,
        "title": "Keeping LLMs Up to Date (RAG Architectures & Vector Chunking)",
        "scenario": "A medical tech company builds an internal AI diagnostic assistant. Company clinical guidelines and treatment protocols are updated daily. Fine-tuning an open-source 70B LLM every night costs $2,500/day, takes 6 hours, and the model still hallucinates outdated drug dosages.",
        "question": "How do you provide language models with real-time, authoritative domain knowledge without retraining base weights?",
        "options": [
            ("A", "Fine-tune the model continuously on incoming PDF documents.", False, "Prohibitively expensive, slow, prone to catastrophic forgetting, and does not eliminate hallucinations."),
            ("B", "Retrieval-Augmented Generation (RAG): Parse, chunk, embed documents into vector storage, and retrieve relevant chunks at inference time.", True, "Winner: Real-time updates via vector ingestion in seconds; zero retraining cost; provides citations and verifiable source links."),
            ("C", "Paste all 200,000 internal documents directly into a 2M token context window on every prompt.", False, "Extreme token cost ($50/query), high inference latency (>30s), and attention dilution ('Lost in the Middle')."),
            ("D", "Instruct the model via system prompt to browse the live internet without restrictions.", False, "Cannot access private internal intranet documentation; vulnerable to prompt injection.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Separation of Reasoning and Knowledge**: LLM acts as the reasoning engine; RAG acts as the dynamic external reference library. Updating knowledge is as simple as inserting new vector embeddings into the database.
  - **Auditability**: RAG responses quote exact source chunk IDs, satisfying compliance and medical accuracy audits.
- **The Traps**:
  - **Naive Fixed Chunking**: Chopping documents blindly every 500 tokens breaks semantic tables and sentences. Use sentence-aware or semantic chunking.""",
        "links": "[RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals) · [Context Engineering](/technical-knowledge/ai-agents/context-engineering)"
    },
    {
        "day": 28,
        "module": 4,
        "title": "Vector Store Selection (pgvector vs. Dedicated Engines)",
        "scenario": "A startup building semantic search for 300,000 product descriptions provisions an enterprise multi-node Pinecone vector database cluster costing $1,200/month. The engineering team struggles with dual-write synchronization between Postgres and Pinecone, data drift, and network latency across VPCs.",
        "question": "When should you choose pgvector inside your relational database versus a dedicated vector database (Pinecone/Milvus/Qdrant)?",
        "options": [
            ("A", "Always use dedicated vector databases for any project using vector embeddings.", False, "Premature optimization for small datasets; adds distributed infrastructure complexity and dual-write headaches."),
            ("B", "Use pgvector for datasets under 1-5M vectors requiring ACID filtering; transition to dedicated engines at 10M+ scale or extreme QPS.", True, "Winner: pgvector allows single-query SQL joins between vectors and metadata with zero dual-write sync issues."),
            ("C", "Never use vector databases; use PostgreSQL full-text search with tsvector for semantic search.", False, "Lexical search (tsvector) cannot understand semantic synonyms (e.g. 'automobile' matching 'car')."),
            ("D", "Store raw floating-point embedding arrays in JSONB columns and calculate cosine similarity in Python.", False, "Full table scans in Python require transferring gigabytes of vectors across network; unusable latency (>5s).")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Relational Filtering**: `SELECT * FROM items WHERE price < 50 AND vendor_id = 4 ORDER BY embedding <=> query_vector LIMIT 10`. pgvector filters metadata and vectors in one atomic engine pass using HNSW or IVFFlat indexes.
  - **Operational Simplicity**: Same backup, replication, and disaster recovery as your core application database.
- **The Traps**:
  - **HNSW Memory in Postgres**: HNSW indexes must fit in `shared_buffers` / RAM for sub-10ms performance.""",
        "links": "[RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals) · [Elasticsearch Overview](/technical-knowledge/elasticsearch/elasticsearch-overview)"
    },
    {
        "day": 29,
        "module": 4,
        "title": "Multi-Agent Workflows (State Management & Orchestration)",
        "scenario": "An AI customer support workflow coordinates 4 specialized agents: Triage, Billing, Technical, and Escalation. When implemented with unstructured prompt chaining, agents pass 50-message conversational transcripts back and forth. The LLMs lose track of the customer's account ID, enter infinite tool calling loops, and burn $12 per ticket.",
        "question": "How do you coordinate multi-agent systems reliably without conversational drift and runaway execution loops?",
        "options": [
            ("A", "Have all agents append to a single shared Discord chat channel.", False, "Unstructured text channel creates confusion and non-deterministic loops."),
            ("B", "Use an explicit State Machine / Orchestrator (e.g. LangGraph / Temporal) with structured typed state schemas.", True, "Winner: Central state schema enforces deterministic transitions, validates inputs/outputs, and halts infinite loops."),
            ("C", "Combine all 4 agents into one giant monolithic prompt with 80 tool definitions.", False, "Overloading 1 prompt with dozens of tools degrades tool selection accuracy and exceeds context limits."),
            ("D", "Run all 4 agents in parallel and pick the fastest output.", False, "Wastes compute; agents have dependencies (cannot process refund before billing verification).")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **State Machine Boundaries**: Agents communicate by updating a shared strongly typed state object (`{customer_id, verified: bool, issue_category, refund_amount}`).
  - **Loop Prevention**: Orchestrators enforce maximum step counts ($N \\le 10$) and deterministic handoffs.
- **The Traps**:
  - **Unbounded Agent Loops**: Always enforce budget limits, step bounds, and human-in-the-loop checkpoints for irreversible actions (e.g. issuing refunds).""",
        "links": "[AI Agents Architecture](/technical-knowledge/ai-agents/agents) · [Model Context Protocol (MCP)](/technical-knowledge/ai-agents/mcp-and-agentic-ai)"
    },
    {
        "day": 30,
        "module": 4,
        "title": "File Storage Backends (Object Storage vs. Block Storage)",
        "scenario": "A photo sharing application stores user images directly as `BYTEA` binary blobs inside PostgreSQL. As users upload 20TB of photos, database backup times balloon to 14 hours, replication lag spikes, database RAM cache is polluted with image bytes, and simple user queries slow to a crawl.",
        "question": "How should binary assets (images, videos, PDF documents) be stored and served in a scalable architecture?",
        "options": [
            ("A", "Store binary data as Base64 strings in MongoDB collections.", False, "Base64 encoding increases file size by 33%; still pollutes document database RAM."),
            ("B", "Store files in Cloud Object Storage (S3 / GCS); persist only the metadata (URL, size, hash) in the database.", True, "Winner: Virtually infinite scalability, 99.999999999% durability, direct client presigned uploads, and CDN integration."),
            ("C", "Store files on the local filesystem of application web servers.", False, "Files are lost when stateless containers restart or auto-scale up and down."),
            ("D", "Attach a shared AWS EBS block volume to 50 web pods simultaneously.", False, "EBS cannot be attached multi-writer across many availability zones reliably without clustered filesystems.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Presigned Uploads**: Client requests an upload token; backend returns an S3 presigned URL. The client uploads the 50MB file directly to S3, bypassing application web servers entirely and saving bandwidth and server CPU.
  - **Database Hygiene**: Relational databases store only metadata (`id, s3_url, user_id, checksum`). Backups remain tiny and fast.
- **The Traps**:
  - **Serving S3 Origin Directly**: Always place a CDN (CloudFront / Cloudflare) in front of S3 buckets to reduce egress bandwidth bills by up to 80%.""",
        "links": "[Large Blob Storage](/technical-knowledge/system-design/large-blobs) · [OS File Systems & I/O](/technical-knowledge/operating-systems/os-file-systems-io)"
    },
    {
        "day": 31,
        "module": 4,
        "title": "Cross-Region Latency (Edge Computing & Global CDNs)",
        "scenario": "An API with primary servers and database in US-East (`us-east-1`) serves users in Singapore and Sydney. Australian users experience 380ms response times for simple read-only home screen requests, primarily due to the physical speed of light across trans-oceanic fiber optic cables (TCP 3-way handshake + TLS 1.3 negotiation taking 3 round-trips).",
        "question": "How do you achieve sub-50ms read response times for international users without multi-master database replication?",
        "options": [
            ("A", "Tell international users to use a VPN closer to US-East.", False, "A VPN cannot beat the speed of light; total round-trip physical distance remains identical."),
            ("B", "Terminate TLS and cache static/dynamic read responses at Global Edge PoPs (CDNs / Edge Workers).", True, "Winner: TLS terminates locally in Sydney (<10ms); cached data serves directly from edge memory."),
            ("C", "Deploy full write-capable database clusters in all 10 regions.", False, "Extremely complex distributed multi-master consensus (CockroachDB / Spanner) with high write cross-region coordination latency."),
            ("D", "Switch from HTTPS to unencrypted HTTP.", False, "Severe security violation; exposes user tokens and sensitive data to interception.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Edge TLS Termination**: The initial TCP + TLS handshake terminates at the local Sydney Edge Point of Presence (PoP) in 15ms.
  - **Tiered Caching & Dynamic Acceleration**: If edge misses, CDN routes traffic to origin over persistent optimized internal backbone fibers, skipping public internet BGP routing hops.
- **The Traps**:
  - **Caching Dynamic User State**: Ensure private user responses include `Cache-Control: private, no-store` or use Edge Workers to personalize cached templates.""",
        "links": "[Scaling Reads (CDN Distribution)](/technical-knowledge/system-design/scaling-reads) · [Network Performance Optimization](/technical-knowledge/networking/network-performance-optimization)"
    },
    {
        "day": 32,
        "module": 4,
        "title": "Secrets Management (Credential Rotation & Vaults)",
        "scenario": "A database administrator needs to rotate the production Postgres password due to an employee departure. Database passwords are baked into Kubernetes deployment YAML ConfigMaps across 80 microservices. Updating passwords requires redeploying all 80 microservices, causing a 12-minute outage as old connections are terminated while new pods spin up.",
        "question": "How should enterprise systems manage, rotate, and deliver database credentials with zero application downtime?",
        "options": [
            ("A", "Store database passwords in a private Git repository encrypted with a master key.", False, "Git commits leave permanent audit trails; requires redeploying applications to rotate."),
            ("B", "Use a dedicated Secrets Manager (HashiCorp Vault / AWS Secrets Manager) with dynamic short-lived credentials and IAM authentication.", True, "Winner: Microservices authenticate via IAM/mTLS and lease credentials that rotate automatically without pod restarts."),
            ("C", "Hardcode the password directly into application binary code.", False, "Critical security vulnerability; decompiling binary exposes credentials."),
            ("D", "Disable database passwords and rely solely on IP whitelisting.", False, "Violates Zero-Trust security principles; any compromised container in the VPC can access all tables.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Dynamic Leases**: Vault generates individual database credentials on-the-fly for each service instance with a 1-hour TTL. Vault revokes them automatically.
  - **Zero-Downtime Rotation**: Database configures dual users (`user_A`, `user_B`). New pods lease `user_B`; old pods finish running on `user_A`. Once old pods terminate, `user_A` is dropped.
- **The Traps**:
  - **Static Root Credentials**: Never grant microservices static root database credentials.""",
        "links": "[Security Patterns](/technical-knowledge/system-design/security-patterns) · [Externalized Configuration](/technical-knowledge/system-design/externalized-configuration)"
    }
]

print(f"Loaded {len(DAYS)} days for first 4 modules.")
