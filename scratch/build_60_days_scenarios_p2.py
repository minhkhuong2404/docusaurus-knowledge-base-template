#!/usr/bin/env python3
import os

# Complete script containing all 60 days
DAYS_P2 = [
    # --- MODULE 5: Specialized Workflows & Concurrency ---
    {
        "day": 33,
        "module": 5,
        "title": "Event Sourcing (Auditability & Reconstructing State from History)",
        "scenario": "A fintech ledger stores bank balances as mutable rows: `UPDATE accounts SET balance = balance - 100 WHERE id = 1`. After an audit discrepancy of $45,000, engineers cannot reconstruct who initiated the balance deductions, which transactions were involved, or what intermediate states existed over the past quarter.",
        "question": "How do you guarantee 100% auditability and point-in-time state reconstruction for mission-critical financial systems?",
        "options": [
            ("A", "Enable database query logging (`log_statement = 'all'`) on Postgres.", False, "Text logs are unstructured, rotate quickly, are slow to query, and cannot rebuild application domain state."),
            ("B", "Use Event Sourcing: Treat state as an append-only log of domain events (`MoneyDeposited`, `TransferInitiated`); derive current balance by replaying events or snapshots.", True, "Winner: Every state transition is immutable, cryptographically auditable, and allows point-in-time travel to any timestamp."),
            ("C", "Add an `updated_at` column and an audit comment string to the `accounts` table.", False, "Overwrites previous state; fails to capture the full timeline of intermediate balance changes."),
            ("D", "Take a full database snapshot dump every hour.", False, "Loses all fine-grained transactions executed between the hourly snapshot intervals.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Immutable Append-Only Log**: Events are facts that happened in the past. They cannot be updated or deleted.
  - **Point-in-Time Querying**: To see the account balance on October 12th at 14:02:00, simply replay events up to that timestamp.
  - **Snapshots for Performance**: To avoid replaying 100,000 events on every read, periodically save a snapshot state (e.g. every 1,000 events) and replay only subsequent events.
- **The Traps**:
  - **Event Schema Evolution**: As business logic evolves, old events must be upcasted or deserialized compatibly forever.""",
        "links": "[Event-Driven Microservices](/technical-knowledge/system-design/event-driven-microservices) · [CQRS Architecture](/technical-knowledge/system-design/cqrs)"
    },
    {
        "day": 34,
        "module": 5,
        "title": "LLM Classification (Accuracy, Few-Shot & Prompt Engineering)",
        "scenario": "An e-commerce customer support pipeline uses an LLM to categorize 20,000 incoming support tickets per day into 30 issue categories. Using basic zero-shot prompts (\"Classify this email\"), the model returns inconsistent categories, invents new non-existent tags, and accuracy hovers around 68%, misrouting thousands of urgent shipping tickets.",
        "question": "How do you improve LLM classification accuracy to >95% while enforcing strict schema compliance?",
        "options": [
            ("A", "Switch to an expensive reasoning model (o1/o3) for every single ticket classification.", False, "Increases cost by 30x and latency to 10s per ticket for a simple classification task."),
            ("B", "Use Few-Shot Prompting with diverse edge-case examples and enforce Structured Outputs (JSON Schema / Enum validation).", True, "Winner: Few-shot examples anchor model semantics; constrained JSON mode guarantees the returned category is strictly within the allowed 30 enums."),
            ("C", "Ask the LLM to 'think step by step' without providing examples.", False, "Increases token generation cost without anchoring the exact target taxonomy."),
            ("D", "Train a full 70B parameter custom LLM from scratch on your internal emails.", False, "Costs hundreds of thousands of dollars and months of work when prompting smaller models achieves higher accuracy.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Few-Shot Demonstration**: Providing 3-5 concrete examples of tricky borderline classifications resolves ambiguity far better than paragraphs of instructions.
  - **Grammar / Constrained Sampling**: Modern inference engines (OpenAI JSON Schema / Guidance / Outlines) constrain logits to valid JSON tokens, guaranteeing 0% schema format failures.
- **The Traps**:
  - **Taxonomy Overlap**: If two categories are ambiguous (\"Billing Error\" vs \"Invoice Discrepancy\"), LLM accuracy drops. Merge or clarify definitions in the prompt.""",
        "links": "[Prompt Engineering](/technical-knowledge/ai-agents/prompt-engineering) · [AI Agent Interview Guide](/technical-knowledge/ai-agents/ai-agent-interview-questions)"
    },
    {
        "day": 35,
        "module": 5,
        "title": "Geospatial Scaling (Quadtrees, Geohashing & Spatial Partitioning)",
        "scenario": "A ride-hailing platform tracks 200,000 active drivers sending GPS coordinates every 3 seconds. When a rider requests a pickup, the backend executes `SELECT * FROM drivers WHERE ST_Distance(driver_loc, rider_loc) < 5000`. Under 10,000 pickup requests/min, the spatial index saturates CPU, and query latency exceeds 4 seconds.",
        "question": "How do you perform real-time nearest-neighbor geospatial searches with sub-15ms response times at high write concurrency?",
        "options": [
            ("A", "Run Cartesian Euclidean distance calculations `(x1-x2)^2 + (y1-y2)^2` across the entire unindexed drivers table in SQL.", False, "Requires full table scan of 200,000 rows on every pickup request; crashes database instantly."),
            ("B", "Use Geohashes or Quadtree spatial indexing in an in-memory key-value store (Redis GEO / S2 Geometry).", True, "Winner: Maps 2D lat/long coordinates into 1D sorted z-order strings; nearest neighbor lookups execute via fast range queries in in-memory B-Trees."),
            ("C", "Partition drivers geographically by country in separate relational databases.", False, "Does not solve city-level hotspots (e.g. 50,000 drivers active in Manhattan at rush hour)."),
            ("D", "Ask the mobile client to fetch all 200,000 driver locations and calculate the nearest driver in Swift/Kotlin.", False, "Downloads 50MB of driver data to every phone every 3 seconds, exhausting cellular data and battery.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Geohash / S2 Cell Mapping**: Divides the globe into hierarchical bounding boxes. Driver coordinates are converted to a 52-bit integer or 8-character string (e.g. `dr5reg`).
  - **Fast In-Memory Range Query**: Finding drivers within 2km reduces to querying the rider's cell and its 8 adjacent neighbor cells in Redis GEO (`GEORADIUS`), executing in $<2$ms.
- **The Traps**:
  - **Boundary Discontinuities**: Two drivers 50 meters apart might have completely different Geohash prefixes if they sit across a quadrant boundary. Always search the 8 surrounding neighbor cells.""",
        "links": "[Proximity Search & Geospatial Indexes](/technical-knowledge/system-design/proximity-search-geospatial-indexes)"
    },
    {
        "day": 36,
        "module": 5,
        "title": "Edge Protocols (HTTP/3 over QUIC vs. HTTP/2 TCP Head-of-Line)",
        "scenario": "A mobile video delivery service observes that mobile users on 4G/5G cellular networks experience frequent video buffering stutters whenever traveling through tunnels or train stations where 2% packet loss occurs. HTTP/2 multiplexing fails to alleviate the stutters, causing users to abandon the stream.",
        "question": "Why does HTTP/2 suffer from Head-of-Line (HoL) blocking on lossy mobile networks, and how does HTTP/3 (QUIC) resolve it?",
        "options": [
            ("A", "HTTP/2 uses UDP which drops video frames during network handoffs.", False, "HTTP/2 runs on TCP, not UDP."),
            ("B", "HTTP/2 multiplexes streams over 1 single TCP connection; when 1 packet drops, TCP pauses ALL streams until the dropped packet is retransmitted. HTTP/3 over QUIC/UDP decouples stream losses.", True, "Winner: In QUIC, packet loss on stream A does not stall stream B; connection migration allows seamless handoff from Wi-Fi to cellular."),
            ("C", "HTTP/2 lacks TLS encryption, causing ISPs to throttle video packets.", False, "HTTP/2 uses mandatory TLS in all modern browsers; security is not the cause of HoL blocking."),
            ("D", "The fix is to downgrade all video streaming clients to HTTP/1.0.", False, "HTTP/1.0 opens a new TCP connection per request, worsening latency and network congestion.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **TCP vs. QUIC Stream Isolation**: In TCP, the kernel guarantees strict byte-order delivery. If packet #4 for video stream #1 is dropped, packets #5, #6, #7 for video stream #2 cannot be read by the application until packet #4 is resent. In QUIC (built on UDP), streams are completely independent.
  - **Connection Migration**: When a phone leaves Wi-Fi and connects to 5G, the IP address changes. TCP connections break and must re-handshake. QUIC uses a 64-bit Connection ID, keeping streams uninterrupted.
- **The Traps**:
  - **UDP Blocking in Firewalls**: Some corporate networks block UDP port 443; always maintain graceful fallback to HTTP/2 over TCP.""",
        "links": "[QUIC & Modern Transport](/technical-knowledge/networking/quic-modern-transport) · [HTTP & HTTPS Deep Dive](/technical-knowledge/networking/http-https-application-layer)"
    },
    {
        "day": 37,
        "module": 5,
        "title": "Collaborative Editing (CRDTs vs. Operational Transformation)",
        "scenario": "You are designing a collaborative workspace document editor (like Notion or Figma). Multiple team members edit the same document simultaneously, and mobile users must be able to edit while offline during flights and merge seamlessly upon reconnecting without losing text.",
        "question": "Why are Conflict-Free Replicated Data Types (CRDTs) superior to Operational Transformation (OT) for decentralized or offline collaboration?",
        "options": [
            ("A", "OT is better because it requires zero server coordination.", False, "Factually incorrect: OT fundamentally requires a central server to transform operations based on global order."),
            ("B", "CRDTs mathematically guarantee Strong Eventual Consistency (SEC) across peers in any order without a central transformation server.", True, "Winner: Character insertions have globally unique fractional identifiers; merges are commutative and idempotent, ideal for offline/local-first apps."),
            ("C", "File locking with pessimistic locks is preferred for collaborative documents.", False, "Locks block all other users from typing, destroying real-time collaboration."),
            ("D", "Git merge in the background is the industry standard for real-time document typing.", False, "Git creates interactive text merge conflicts, which ruin seamless keystroke collaboration.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Mathematical Convergence**: In CRDTs (like Yjs or Automerge), operations commute ($A \\circ B = B \\circ A$). Whether changes arrive in sequence or after 10 hours offline, all clients converge on the exact same character sequence once operations are received.
  - **Local-First Architecture**: Writes are instantaneous on local device memory; network syncing happens asynchronously in the background.
- **The Traps**:
  - **Metadata Overhead**: Every character holds a unique ID and logical clock. Optimized libraries use run-length encoding to keep memory footprint reasonable.""",
        "links": "[CRDTs in Collaborative Systems](/technical-knowledge/system-design/crdt-collaborative-systems) · [Data Consistency](/technical-knowledge/system-design/data-consistency)"
    },
    {
        "day": 38,
        "module": 5,
        "title": "Long Context LLMs (Document Chunking vs. Attention Dilution)",
        "scenario": "An enterprise legal AI application inputs an entire 600-page corporate acquisition agreement (400,000 tokens) into a 1M context window model. The user asks: \"What is the indemnity cap in Section 14.3?\". The model hallucinates an incorrect standard indemnity cap found in Section 2, missing the specific clause in the middle of page 320.",
        "question": "Why does stuffing massive documents into long-context LLMs cause factual retrieval failures, and how do you prevent it?",
        "options": [
            ("A", "The model ran out of GPU memory and discarded the document tokens.", False, "The prompt was within the context window; the failure is algorithmic attention dilution, not memory exhaustion."),
            ("B", "Attention dilution ('Lost in the Middle'): Transformer attention mechanisms exhibit high recall at the beginning and end of contexts, but degrade in the middle. Solution: Semantic chunking and targeted vector retrieval.", True, "Winner: Retrieve only the relevant 5-10 pages containing Section 14.3; feeding high-signal condensed context yields accurate extraction."),
            ("C", "Repeat the question 50 times at the end of the prompt.", False, "Ad-hoc hack; wastes tokens and does not fix attention degradation over hundreds of pages."),
            ("D", "Compress the text by removing all vowels before prompting.", False, "Destroys semantic legibility and breaks legal terminology.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Signal-to-Noise Ratio**: Transformers compute $O(N^2)$ attention across tokens. In a 400,000-token context, the signal for a 2-sentence clause is drowned out by 399,900 irrelevant legal tokens.
  - **Hybrid Architecture (RAG + Long Context)**: Use vector/BM25 retrieval to isolate the relevant 10,000 tokens, then let the LLM analyze that focused slice with maximum reasoning precision.
- **The Traps**:
  - **Context Window Hype**: Just because a model has a 1M or 2M token window does NOT mean it reasons across all tokens with equal fidelity.""",
        "links": "[Context Engineering](/technical-knowledge/ai-agents/context-engineering) · [RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals)"
    },
    {
        "day": 39,
        "module": 5,
        "title": "Concurrent Overspend (Atomic Conditional Balance Updates in SQL)",
        "scenario": "A digital wallet user has a balance of $120. The user initiates two simultaneous $100 withdrawals via two different browser tabs. Both requests reach separate backend servers at the exact same millisecond. Both servers read balance $120, approve the withdrawal, and deduct $100. The user withdraws $200, leaving the account at negative -$80.",
        "question": "How do you prevent concurrent account overspend without deadlocks or slow distributed locks?",
        "options": [
            ("A", "Read balance in application memory, verify `balance >= 100`, and execute `UPDATE accounts SET balance = balance - 100`.", False, "Classic Read-Modify-Write race condition; allows concurrent overspend."),
            ("B", "Execute an Atomic Conditional SQL Update: `UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100`.", True, "Winner: Database row lock enforces serial execution; exactly one query updates 1 row, while the second updates 0 rows and fails fast."),
            ("C", "Put a global Redis lock on the entire `accounts` table.", False, "Serializes all transactions across all users in the system, bottlenecking system to 20 RPS."),
            ("D", "Allow overspend and bill the user later via mail.", False, "Severe financial fraud and credit default risk for the business.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Database Row Lock Protection**: In relational databases, executing an `UPDATE` on a row acquires an exclusive row-level lock (`X-lock`).
  - **Evaluation of `WHERE` Clause**: The database evaluates `WHERE balance >= 100` under the lock. Transaction 1 executes and reduces balance to $20. Transaction 2 acquires the lock immediately after, evaluates `WHERE 20 >= 100` (False), and updates 0 rows. The application detects `rows_affected == 0` and rejects the withdrawal in $<2$ms.
- **The Traps**:
  - **Application-Level Validation**: Never rely on `if (account.getBalance() >= amount)` in application code without database-level concurrency protection.""",
        "links": "[Handling Contention](/technical-knowledge/system-design/handling-contention) · [Core Posting & Accounting](/technical-knowledge/banking/core-posting-accounting)"
    },
    {
        "day": 40,
        "module": 5,
        "title": "Off-Main-Thread Processing (Background Workers & Status Polling)",
        "scenario": "A SaaS accounting application provides a 'Generate Tax Report (PDF)' button. Rendering the PDF requires complex calculations and takes 45 seconds. The backend executes the generation inside the HTTP request thread. After 30 seconds, the load balancer terminates the connection with an HTTP 504 Gateway Timeout, leaving users unable to download reports.",
        "question": "How do you handle long-running resource-intensive tasks in an HTTP API architecture?",
        "options": [
            ("A", "Increase load balancer and reverse proxy timeouts to 30 minutes.", False, "Ties up web server threads for minutes; a spike in report generations quickly exhausts all server threads, causing site-wide outages."),
            ("B", "Asynchronous Job Pattern: Enqueue task in worker queue (Redis / RabbitMQ), return HTTP 202 Accepted with a job status URL, and process on background workers.", True, "Winner: Web thread frees up immediately in <10ms; client polls status URL or receives completion webhook/SSE."),
            ("C", "Run the 45-second report generation on the client's browser using WebAssembly.", False, "Requires exposing private database tables and proprietary tax calculation logic to client devices."),
            ("D", "Have the user refresh the browser page repeatedly until the report finishes.", False, "Each page refresh spawns another concurrent 45-second generation job, compounding server load.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **HTTP 202 Accepted Flow**:
    1. Client posts request: `POST /v1/reports`.
    2. API pushes payload to RabbitMQ/Redis and immediately responds `HTTP 202 Accepted` with header `Location: /v1/reports/job_987`.
    3. Dedicated worker pool consumes from queue, renders PDF, uploads to S3, and marks job `status=COMPLETED`.
    4. Client checks `/v1/reports/job_987` and downloads from presigned S3 link.
- **The Traps**:
  - **Thread Starvation**: Synchronous execution of tasks taking $>2$ seconds in web request threads is a primary cause of cascading server failure.""",
        "links": "[Long-Running Tasks](/technical-knowledge/system-design/long-running-tasks) · [Concurrency & Async Threading Models](/technical-knowledge/system-design/concurrency-async-threading-models)"
    },

    # --- MODULE 6: Modern AI & Streaming ---
    {
        "day": 41,
        "module": 6,
        "title": "Batch to Real-Time (Stream Processing with Kafka / Flink)",
        "scenario": "A banking platform runs an overnight batch ETL job to calculate customer credit risk scores and detect credit card fraud. Fraudulent card rings exploit this 24-hour delay, draining stolen cards during the day before the overnight batch detects the velocity anomaly.",
        "question": "How do you transition from nightly batch processing to sub-second real-time event stream analytics?",
        "options": [
            ("A", "Run the overnight batch SQL script every 30 seconds against the production primary database.", False, "Crushes database performance with massive repetitive table scans, locking tables and causing write timeouts."),
            ("B", "Use an Event Stream Processing Engine (Kafka Streams / Apache Flink) with stateful sliding time windows.", True, "Winner: Ingests transactions as a continuous event stream; computes sliding aggregations ('More than 3 transactions in 2 minutes') in real time with sub-50ms latency."),
            ("C", "Require manual fraud approval by human agents for all credit card swipes.", False, "Unusable checkout friction; cannot scale to 50,000 swipes per second."),
            ("D", "Store all credit card swipes in flat text files on an NFS share.", False, "Lacks streaming windowing capabilities and real-time processing semantics.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Stateful Sliding Windows**: Flink and Kafka Streams maintain local state (RocksDB) partitioned by `card_id`. As each swipe arrives, the engine updates a 5-minute sliding window counter without querying a central relational database.
  - **Out-of-Order Handling**: Stream processors use Event Time and Watermarks to handle late-arriving events due to cellular connectivity drops accurately.
- **The Traps**:
  - **Batch Mindset in Streams**: Avoid writing streaming microservices that query external databases on every event. Keep lookup state localized in memory/RocksDB.""",
        "links": "[Kafka Architecture Overview](/technical-knowledge/kafka/core/kafka-architecture-overview) · [Message Queues & Streaming](/technical-knowledge/system-design/message-queues)"
    },
    {
        "day": 42,
        "module": 6,
        "title": "Agentic Memory (Hierarchical Episodic Summarization)",
        "scenario": "An autonomous AI software engineering agent runs a multi-hour coding task spanning 150 tool executions (reading files, executing bash commands, running tests). Passing the full raw message history on every step balloons inference cost to $20/run and causes the LLM to hallucinate old compilation errors that were already fixed.",
        "question": "How do you manage long-term agent memory across extended execution sessions without exceeding context limits or diluting reasoning?",
        "options": [
            ("A", "Truncate the history by dropping the oldest 50 messages whenever context is full.", False, "Agent loses the initial user prompt, system constraints, and key architectural guidelines."),
            ("B", "Implement Hierarchical Episodic Summarization: Keep recent turns raw in working memory, while condensing completed phases into structured milestone summaries.", True, "Winner: Preserves key state invariants (e.g. 'Auth module fixed; do not touch auth.py') while reducing token count by 85%."),
            ("C", "Embed every raw message into a vector database and retrieve messages via similarity search.", False, "Loses chronological causal order of execution; agent acts on out-of-sequence instructions."),
            ("D", "Restart the agent with a blank history every 10 steps.", False, "Zero memory persistence; agent repeats identical failed actions in infinite loops.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Two-Tier Memory Architecture**:
    - **Working Memory**: Last 5-10 raw turns containing active tool outputs and line numbers.
    - **Episodic Summary**: A structured compact state object updated after each sub-goal: `Current Phase: Testing`, `Files Modified: [api.ts, auth.ts]`, `Invariants Discovered: [Must use port 8080]`.
  - **Deterministic Compression**: A fast, cheap model summarizes older phases into bulleted milestones.
- **The Traps**:
  - **Unstructured Prose Summaries**: Vague summaries like \"User and agent discussed code\" lose critical technical details. Enforce structured key-value state extraction.""",
        "links": "[AI Agents Architecture](/technical-knowledge/ai-agents/agents) · [Context Engineering](/technical-knowledge/ai-agents/context-engineering)"
    },
    {
        "day": 43,
        "module": 6,
        "title": "CDN Invalidation (Content-Hashed Assets vs. Wildcard Purges)",
        "scenario": "A single-page application (SPA) deploys a critical bugfix to `app.js`. The team initiates a global CDN wildcard cache purge (`/*`). Due to CDN edge propagation delays and rate limits, 40% of users continue loading cached old `app.js` with new backend APIs for 2 hours, causing JavaScript crashes.",
        "question": "How do you deploy web application frontend assets with zero cache inconsistency and instant user updates?",
        "options": [
            ("A", "Set CDN cache TTL to 0 seconds (no-cache) for all static JavaScript and CSS files.", False, "Forces all asset traffic back to origin servers on every pageview, destroying CDN cost and performance benefits."),
            ("B", "Content-Hash all asset filenames (`app.8f9b2c.js`) with long-term immutable caching (`Cache-Control: max-age=31536000, immutable`), and serve only `index.html` with `no-cache`.", True, "Winner: Deploying new code generates new filenames; users get new assets instantly without CDN cache purges, and old assets remain safely cached."),
            ("C", "Change the CDN provider on every production release.", False, "Operational nightmare; DNS propagation takes hours to cut over globally."),
            ("D", "Tell users to perform a hard refresh (`Ctrl + F5`) in their browsers.", False, "Unacceptable user experience; breaks mobile apps and automated browser views.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Immutable Fingerprinting**: Webpack/Vite generates bundle hashes based on file contents. If `app.js` changes, its URL becomes `app.a1b2c3.js`.
  - **Zero-Purge Instant Updates**: The only file that changes in place is `index.html` (which points to the new asset hashes). Setting `Cache-Control: no-cache` on `index.html` ensures browsers check origin/CDN for the latest HTML, while JS/CSS bundles are cached forever (`max-age=1y`).
- **The Traps**:
  - **Purge Latency**: Wildcard cache purges (`/*`) take minutes to propagate to 300+ edge locations. Never depend on CDN purge speed for code deployments.""",
        "links": "[Caching Strategies](/technical-knowledge/system-design/caching-strategies) · [Network Performance Optimization](/technical-knowledge/networking/network-performance-optimization)"
    },
    {
        "day": 44,
        "module": 6,
        "title": "Offline Edit Sync (Vector Clocks & Data Loss Prevention)",
        "scenario": "A cloud note-taking app allows editing on mobile and desktop. A user edits a document on their phone while offline on a subway. Meanwhile, their desktop auto-saves a minor edit. When the phone reconnects, the backend uses simple Last-Write-Wins (LWW) based on device timestamps. The phone's clock is 5 minutes behind, so the server overwrites and destroys 2 hours of mobile notes.",
        "question": "How do you detect concurrent edits and prevent silent data loss in offline-capable applications?",
        "options": [
            ("A", "Rely on client device wall-clock timestamps (`new Date().getTime()`) to determine the winner.", False, "Device clocks skew by seconds or minutes; older edits silently overwrite newer edits."),
            ("B", "Use Vector Clocks or State-based CRDTs to detect concurrent branching edits and reconcile state.", True, "Winner: Mathematically detects true causality; flags concurrent branches for three-way merge or automatic conflict-free convergence."),
            ("C", "Reject all offline edits and lock the application if Wi-Fi is disconnected.", False, "Destroys offline productivity; users expect modern apps to work without internet."),
            ("D", "Store only the newest edit and move previous versions to an inaccessible trash bin.", False, "Still causes user work loss and customer frustration.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Causal Tracking via Vector Clocks**: Every client maintains a vector $[C_{phone}, C_{desktop}, C_{server}]$. If Phone and Desktop both increment their clock from the same base state, the server recognizes that neither happened before the other ($V_1 \\not< V_2$ and $V_2 \\not< V_1$).
  - **Zero Silent Overwrite**: The system detects a concurrent branch and triggers an automated merge (CRDT) or preserves both versions for the user to review.
- **The Traps**:
  - **NTP Clock Fallacy**: Wall-clock timestamps are never reliable for ordering distributed concurrent operations.""",
        "links": "[CRDTs in Collaborative Systems](/technical-knowledge/system-design/crdt-collaborative-systems) · [Data Consistency](/technical-knowledge/system-design/data-consistency)"
    },
    {
        "day": 45,
        "module": 6,
        "title": "Full-Text Search (Inverted Indexes vs. SQL Wildcard Scans)",
        "scenario": "A marketplace with 15 million product listings provides a search bar. The backend runs `SELECT * FROM products WHERE description ILIKE '%ergonomic chair%'`. As traffic grows to 500 searches/sec, queries take 8 seconds, saturate disk I/O, and crash the primary database.",
        "question": "Why do relational database SQL wildcard queries fail at scale, and how do Inverted Indexes solve search?",
        "options": [
            ("A", "Add a standard B-Tree index on the `description` column.", False, "Standard B-Trees cannot use indexes for leading wildcards (`%keyword`); query still forces full table scan."),
            ("B", "Use an Inverted Index engine (Elasticsearch / Lucene / Postgres tsvector) that maps tokenized words to document postings lists.", True, "Winner: Search reduces to an array intersection of term postings lists in memory, executing in <10ms regardless of database size."),
            ("C", "Load all 15 million descriptions into Redis strings and search with Python regex.", False, "Consumes 50GB+ RAM and full scan in Python is slower than database scanning."),
            ("D", "Increase database IOPS from 3,000 to 50,000.", False, "Extremely expensive brute-force fix; full table scans on 15M rows do not scale linearly with user growth.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Inverted Index Mechanics**: Text is analyzed, lowercased, and stemmed into tokens. The index maps: `'ergonomic' -> [Doc1, Doc42, Doc99]`, `'chair' -> [Doc1, Doc55]`. Searching for both terms is an $O(\\min(L_1, L_2))$ set intersection: `[Doc1]`.
  - **Relevance Scoring (BM25)**: Ranks results by Term Frequency and Inverse Document Frequency rather than arbitrary SQL return order.
- **The Traps**:
  - **Index Drift**: Inverted search engines are secondary read models. Keep them synchronized with the primary database using CDC (Debezium) or outbox events.""",
        "links": "[Database Full-Text Search](/technical-knowledge/database/full-text-search) · [Elasticsearch Internals](/technical-knowledge/elasticsearch/elasticsearch-internals)"
    },
    {
        "day": 46,
        "module": 6,
        "title": "Structured LLM Output (Constrained Decoding & Tool Calling)",
        "scenario": "An automated booking pipeline uses an LLM to extract flight reservation data from emails and call a booking API. The prompt says: \"Return valid JSON only\". In 8% of cases, the LLM prefixes the output with \"Here is the JSON:\" or appends markdown backticks, causing JSON parsing exceptions and failing automated bookings.",
        "question": "How do you guarantee 100% valid schema compliance from LLM outputs without regex string patching?",
        "options": [
            ("A", "Wrap the JSON parser in a retry loop and retry up to 5 times when parsing fails.", False, "Adds latency (5-10s) and token cost; still fails if the model consistently outputs conversational prose."),
            ("B", "Use Constrained Decoding (Grammar-guided sampling / OpenAI JSON Schema / Outlines) that enforces Pydantic schemas at the token generation level.", True, "Winner: Constrains model token sampling to tokens that conform to the target JSON schema; guaranteed 100% syntactically valid JSON every time."),
            ("C", "Add 'DO NOT INCLUDE MARKDOWN' in all-caps to the prompt.", False, "Prompt begging reduces format errors slightly but still fails on edge cases in production."),
            ("D", "Train a custom regex parser that guesses missing brackets in malformed strings.", False, "Brittle heuristic; corrupts nested fields and numbers.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Logit Masking at Sampling Time**: The inference engine translates the JSON schema into a Context-Free Grammar (CFG). At each step, tokens that would violate the grammar are assigned logit $-\\infty$. The model physically cannot emit invalid syntax or unquoted keys.
  - **Zero Parsing Failures**: Backend code deserializes directly into typed structures (`ReservationModel.model_validate_json(output)`).
- **The Traps**:
  - **Schema Complexity**: Overly deep, complex nested schemas can slow down token generation. Keep tool schemas concise.""",
        "links": "[Prompt Engineering](/technical-knowledge/ai-agents/prompt-engineering) · [AI Agents Architecture](/technical-knowledge/ai-agents/agents)"
    },
    {
        "day": 47,
        "module": 6,
        "title": "Strangling the Monolith (Strangler Fig Pattern & Gateway Routing)",
        "scenario": "A legacy 12-year-old monolithic Rails application powers an entire bank. Leadership initiates a 'Big-Bang' rewrite to replace the monolith with a new Go microservice architecture. After 18 months and $10M spent, the new system has 400 feature parity gaps, cutover fails, and the project is cancelled.",
        "question": "How do you migrate a mission-critical monolithic system to modern microservices with zero downtime and low operational risk?",
        "options": [
            ("A", "Attempt a Big-Bang cutover on a long holiday weekend with all engineers on standby.", False, "Classic software engineering disaster; high risk of catastrophic rollback and business paralysis."),
            ("B", "Adopt the Strangler Fig Pattern: Place an API Gateway in front of the monolith; carve out single domain routes (e.g. `/v1/payments`) incrementally to new services over time.", True, "Winner: Low risk; delivers business value in weeks; old and new services coexist safely in production."),
            ("C", "Keep the monolith and freeze all new feature development forever.", False, "Stifles business growth and developer productivity."),
            ("D", "Duplicate all production database tables manually and let two systems write to both simultaneously.", False, "Guarantees dual-write divergence and database corruption without transactional synchronization.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Incremental Path Routing**: The API Gateway routes 95% of traffic to the legacy monolith. When the new Payment Service is ready, the gateway updates route `/v1/payments` to point to the new Go service.
  - **Reversibility**: If the new service has an issue, routing can be reverted to the monolith in seconds via gateway configuration without code redeployments.
- **The Traps**:
  - **Shared Database Entanglement**: The hardest part is separating the database. Use CDC or shared read replicas before fully decoupling schemas.""",
        "links": "[Strangler Fig Pattern](/technical-knowledge/system-design/strangler-fig-pattern) · [Service Decomposition](/technical-knowledge/system-design/service-decomposition)"
    },
    {
        "day": 48,
        "module": 6,
        "title": "Agent Tool Selection (Function Calling Contracts & Reasoning Loops)",
        "scenario": "An autonomous AI assistant is provided with 75 different enterprise API tools in its system prompt (HR, CRM, Jira, GitHub, Slack, AWS). When a user asks: \"Create a Jira ticket for the bug in repo X\", the agent calls the AWS EC2 reboot tool instead, causing a production server shutdown.",
        "question": "How do you prevent tool hallucinations and improve tool selection accuracy in complex AI agent systems?",
        "options": [
            ("A", "Give the agent all 75 tools at once and tell it to be 'very careful'.", False, "Context bloat dilutes semantic attention; tool hallucination rate increases with tool count."),
            ("B", "Use Dynamic Tool Retrieval / Hierarchical Tool Selection: Classify user intent first, load only the 3-5 relevant tools for that domain, and enforce confirmation gates for dangerous actions.", True, "Winner: Restricting active tool scope dramatically increases selection accuracy; destructive tools require human-in-the-loop approval."),
            ("C", "Disable tool calling and force the agent to output shell scripts.", False, "Exposes system to arbitrary code execution security vulnerabilities."),
            ("D", "Run the prompt through 5 different LLMs and vote on which tool to call.", False, "Expensive, slow, and still fails if all models are confused by the 75-tool context.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Two-Stage Tool Routing**:
    1. **Router Agent**: Analyzes intent (\"Issue tracking\"), selects tool namespace `[Jira]`.
    2. **Execution Agent**: Provided only with `[create_jira_issue, update_jira_issue]`. Zero probability of calling AWS reboot.
  - **Tool Confirmation Guards**: Actions marked `is_destructive: true` (reboot, delete, transfer money) halt execution and prompt the user for interactive confirmation.
- **The Traps**:
  - **Ambiguous Tool Descriptions**: Tools with vague descriptions (\"Processes data\") confuse LLMs. Write precise descriptions explaining exact inputs and side effects.""",
        "links": "[Model Context Protocol (MCP)](/technical-knowledge/ai-agents/mcp-and-agentic-ai) · [AI Agents Architecture](/technical-knowledge/ai-agents/agents)"
    },
    {
        "day": 49,
        "module": 6,
        "title": "Data Warehouse Costs (Partitioning, Clustering & Scan Pruning)",
        "scenario": "A data analytics team runs daily KPI dashboards on a 2-petabyte BigQuery / Snowflake data warehouse. The monthly warehouse bill jumps from $8,000 to $92,000. Investigation reveals that analysts run queries like `SELECT * FROM events WHERE event_name = 'signup' AND date = '2024-05-01'`, scanning the entire unpartitioned 2PB table on every query.",
        "question": "How do you reduce cloud data warehouse query costs by >80% while accelerating query response times?",
        "options": [
            ("A", "Forbid data analysts from running analytical queries on the warehouse.", False, "Defeats the purpose of having a business intelligence data platform."),
            ("B", "Partition tables by Date (`date`) and Cluster by high-cardinality query keys (`event_name`, `tenant_id`) to enable scan pruning.", True, "Winner: The query engine skips unneeded disk blocks, scanning 5GB instead of 2PB (a 99.8% cost and latency reduction)."),
            ("C", "Export all 2PB into an Excel spreadsheet on a local drive.", False, "Excel cannot open petabyte-scale files; crashes instantly."),
            ("D", "Switch the data warehouse to an in-memory SQLite database.", False, "SQLite cannot hold petabytes of analytical data in memory.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Partition Pruning**: BigQuery/Snowflake charge by bytes scanned. Partitioning by day means `WHERE date = '2024-05-01'` reads only that day's partition files, skipping 99% of data.
  - **Clustering (Z-Order)**: Within each day's partition, clustering by `event_name` groups matching rows into the same storage blocks. Metadata min/max filters allow the engine to skip non-matching blocks.
- **The Traps**:
  - **`SELECT *` Habit**: Analytical warehouses are columnar (Parquet/ORC). Selecting only needed columns (`SELECT user_id, timestamp`) reduces scanned bytes by another 80%.""",
        "links": "[Data Warehousing & OLAP](/technical-knowledge/database/data-warehousing-olap) · [Database Replication & Partitioning](/technical-knowledge/database/replication-partitioning)"
    },
    {
        "day": 50,
        "module": 6,
        "title": "ML Model Serving (Dynamic Request Batching & Triton)",
        "scenario": "A fintech company serves a deep-learning fraud detection model on an NVIDIA A100 GPU cluster. The model takes 10ms to score a transaction. Under 2,000 RPS traffic, GPU compute utilization is only 12%, but p99 inference latency spikes to 800ms because worker threads process incoming requests one at a time sequentially.",
        "question": "How do you maximize GPU utilization and achieve high throughput at sub-20ms latency during model inference?",
        "options": [
            ("A", "Purchase 50 more A100 GPUs and assign 1 GPU per worker thread.", False, "Massive waste of capital ($500K+); does not fix underlying sequential under-utilization."),
            ("B", "Implement Dynamic Server-Side Batching (Triton Inference Server / vLLM): Buffer requests for 2-4ms to form micro-batches of 32-64 inputs for parallel tensor calculation.", True, "Winner: GPUs are designed for matrix parallelism; processing a batch of 32 takes 12ms (nearly identical to 1 input), increasing throughput by 25x."),
            ("C", "Quantize the model from FP16 down to INT2, sacrificing all accuracy.", False, "Destroys fraud detection accuracy, causing massive financial fraud losses."),
            ("D", "Run the model on CPU threads instead of GPUs.", False, "CPU matrix multiplication is significantly slower for deep learning models, worsening latency.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Tensor Cores Parallelism**: Running a single 1xN vector through a neural network leaves 80% of GPU compute cores idle. Grouping 32 inputs into a 32xN matrix saturates the tensor cores with minimal latency increase ($10ms \\to 12ms$).
  - **Dynamic Batch Timeout**: The server waits up to `max_queue_delay_microseconds = 3000` (3ms) to fill a batch of 64. If 64 arrive, it fires immediately; otherwise, it processes whatever is queued.
- **The Traps**:
  - **Queue Timeout Too High**: Setting batch delay too long ($>50ms$) adds unnecessary baseline latency for low-traffic endpoints.""",
        "links": "[Load Balancing & Reliability](/technical-knowledge/system-design/load-balancing-reliability) · [Long-Running Tasks](/technical-knowledge/system-design/long-running-tasks)"
    },

    # --- MODULE 7: Platform Engineering & Schema Management ---
    {
        "day": 51,
        "module": 5,
        "title": "Noisy Tenant Isolation (Per-Tenant Quotas & Bulkhead Pools)",
        "scenario": "In a multi-tenant B2B SaaS platform, Tenant A runs a poorly written automated script that sends 10,000 heavy reporting API calls in 1 minute. The shared API worker pool is exhausted by Tenant A. Valid requests from 500 other paying enterprise tenants time out with HTTP 504 errors.",
        "question": "How do you prevent one rogue tenant from degrading system performance for all other tenants in a shared SaaS platform?",
        "options": [
            ("A", "Apply a global IP-based rate limit across all incoming traffic.", False, "Does not differentiate between tenants; a rogue tenant sharing a corporate NAT IP blocks innocent users."),
            ("B", "Enforce Per-Tenant Rate Limiting and Bulkhead Worker Thread Pools: Each tenant has an independent Token Bucket and a bounded slice of processing concurrency.", True, "Winner: Tenant A exhausts only their allocated quota and receives HTTP 429; other tenants continue executing at sub-second latency."),
            ("C", "Manually block Tenant A's account whenever an alert fires.", False, "Reactive manual mitigation; outages still occur for 15 minutes before an engineer responds."),
            ("D", "Migrate every single customer to a dedicated AWS account immediately.", False, "Crippling infrastructure overhead and management complexity for a multi-tenant SaaS.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Bulkhead Pattern**: Named after compartments in a ship's hull. If one compartment floods, the ship stays afloat.
  - **Resource Quotas**: In Redis, track `rate_limit:{tenant_id}`. In worker pools (e.g. Celery / Sidekiq), route Tenant A's background jobs to a shared queue capped at 5 concurrency slots, reserving 40 slots for standard tenants.
- **The Traps**:
  - **Fairness Scheduling**: Use Deficit Round Robin (DRR) or Weighted Fair Queuing (WFQ) in worker dispatchers to prevent single-tenant queue starvation.""",
        "links": "[Rate Limiting Algorithms](/technical-knowledge/system-design/rate-limiting-algorithms) · [Bulkhead Pattern](/technical-knowledge/system-design/bulkhead-pattern)"
    },
    {
        "day": 52,
        "module": 7,
        "title": "API Versioning (Contract Evolution & Header/Path Versioning)",
        "scenario": "A public platform API changes its user address format from a single string (`address: \"123 Main St\"`) to a structured object (`address: { street, city, zip }`). The change is deployed to the production `/v1/users` endpoint. Hundreds of third-party mobile apps and partner integrations crash immediately due to JSON deserialization type mismatches.",
        "question": "How do you evolve public API contracts without breaking existing third-party client integrations?",
        "options": [
            ("A", "Email all developers 24 hours before deploying the breaking change.", False, "Unrealistic; developers take weeks or months to update external apps."),
            ("B", "Maintain backward-compatible additive changes; introduce new breaking formats under new version paths (`/v2/`) or custom request headers (`API-Version: 2024-05-01`) with a strict deprecation timeline.", True, "Winner: Existing clients continue running on v1 undisturbed; new clients opt into v2; metrics track v1 traffic decay before final sunset."),
            ("C", "Support only the newest version and require all clients to adapt immediately.", False, "Destroys partner trust and causes immediate client integration breakage."),
            ("D", "Embed TypeScript type definitions in HTTP response headers.", False, "HTTP headers cannot prevent runtime client deserialization crashes.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Tolerant Reader & Additive Evolution**: Never remove or change the type of an existing JSON field. Add new fields (`address_v2: { ... }`) alongside deprecated fields.
  - **Header-Based Evolution (Stripe Model)**: API code serves one internal data model and runs dynamic bi-directional request/response transformation gates based on the client's pinned API version date.
- **The Traps**:
  - **Zombie Versions**: Set clear sunset dates (e.g. 12 months) with HTTP `Sunset` and `Deprecation` headers to force old clients off legacy versions.""",
        "links": "[API Design Best Practices](/technical-knowledge/system-design/api-design) · [Contract Testing](/technical-knowledge/system-design/contract-testing)"
    },
    {
        "day": 53,
        "module": 7,
        "title": "Schema Migrations (Zero-Downtime Expand-Contract Pattern)",
        "scenario": "A database migration script renames a column in a 120-million row active Postgres table: `ALTER TABLE users RENAME COLUMN phone TO phone_number;`. The command takes an exclusive table lock (`AccessExclusiveLock`). Web requests queue up behind the lock, connection pools saturate within 10 seconds, and the entire site goes dark with HTTP 504 errors.",
        "question": "How do you perform breaking database schema changes (renames, column drops, type changes) with zero downtime on live high-traffic tables?",
        "options": [
            ("A", "Run migrations at 2 AM and accept a 15-minute maintenance outage window.", False, "Unacceptable for global 24/7 SaaS applications with international users."),
            ("B", "Use the Expand-Contract (Parallel Change) Pattern across multiple phased deployments: 1. Add new column, 2. Dual-write to both columns, 3. Backfill old rows, 4. Read from new column, 5. Drop old column.", True, "Winner: Every single step is backward-compatible; zero locks held; allows instantaneous rollback at any intermediate phase."),
            ("C", "Create a completely new database and switch DNS records.", False, "Complex data synchronization; causes data loss during DNS propagation delay."),
            ("D", "Execute `ALTER TABLE` inside a multi-hour transaction during peak traffic.", False, "Locks the entire table exclusively for the duration of the migration, causing total outage.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **The 5-Phase Zero-Downtime Lifecycle**:
    1. **Expand**: `ALTER TABLE users ADD COLUMN phone_number VARCHAR;` (Instantaneous in Postgres).
    2. **Dual-Write**: Application code writes to *both* `phone` and `phone_number`.
    3. **Backfill**: Background script copies historical rows in small batches of 1,000 (`UPDATE users SET phone_number = phone WHERE phone_number IS NULL`).
    4. **Cutover**: Application reads exclusively from `phone_number`.
    5. **Contract**: Drop old column `phone` once monitoring confirms zero reads/writes to it.
- **The Traps**:
  - **Lock Queuing**: In Postgres, even a fast `ALTER TABLE` waits for active read queries to finish, and all subsequent reads queue behind it. Always set `SET lock_timeout = '2s'` before running DDL.""",
        "links": "[Database Schema Migrations](/technical-knowledge/database/schema-migrations) · [Case Studies: Data Migrations](/technical-knowledge/system-design/case-studies-data-migrations)"
    },
    {
        "day": 54,
        "module": 7,
        "title": "Embedding Drift (RAG Maintenance & Re-indexing)",
        "scenario": "A company upgrades its internal RAG semantic search embedding model from `text-embedding-ada-002` (1536 dimensions) to a newer model `text-embedding-3-large` (3072 dimensions) for user query encoding. The new query embeddings are compared directly against the historical vector database. Search results become complete gibberish, returning 0% relevant documents.",
        "question": "How do you migrate embedding models and handle vector space drift without taking down active search traffic?",
        "options": [
            ("A", "Truncate the new 3072 embeddings down to 1536 by dropping every second float.", False, "Mathematical nonsense; destroys the latent vector geometric topology."),
            ("B", "Implement Dual-Index Migration: Spin up a new vector index, backfill all documents with the new embedding model in the background, verify search quality, and atomic cutover queries.", True, "Winner: Vectors from different models can never be compared directly; dual-indexing guarantees zero search downtime and clean cutovers."),
            ("C", "Multiply the old embeddings by a constant factor in SQL.", False, "Vector spaces from different models have completely different coordinate geometries."),
            ("D", "Delete all historical documents and require users to re-upload files.", False, "Unacceptable data loss and customer disruption.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Vector Incompatibility Invariant**: Vector embeddings from different models (or even different versions of the same model) exist in entirely distinct mathematical metric spaces. Calculating cosine similarity across them yields meaningless random values.
  - **Blue-Green Re-Indexing**:
    1. Index `docs_v1` actively serves user traffic.
    2. Batch worker embeds all corpus documents using new Model $M_2$ into `docs_v2`.
    3. Canary test search quality on `docs_v2`.
    4. Flip query alias `docs_search -> docs_v2` instantaneously.
- **The Traps**:
  - **Cost of Re-Embedding**: Keep raw document markdown/text stored durably in S3; never assume you can extract original text from vector embeddings.""",
        "links": "[RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals) · [AI Agent Interview Guide](/technical-knowledge/ai-agents/ai-agent-interview-questions)"
    },
    {
        "day": 55,
        "module": 7,
        "title": "Parallel Agents (Shared State & File Coordination)",
        "scenario": "A software dev team launches 4 autonomous AI subagents in parallel to accelerate refactoring: Agent 1 updates auth, Agent 2 updates database schemas, Agent 3 updates tests, and Agent 4 updates documentation. Because all 4 agents edit the same local workspace directory concurrently, they overwrite each other's changes, corrupt files, and produce Git merge conflicts.",
        "question": "How do you coordinate parallel autonomous agents modifying a shared codebase without race conditions?",
        "options": [
            ("A", "Allow all agents to edit the same filesystem simultaneously and run `git add -A` every 10 seconds.", False, "Guarantees file corruption, clobbered changes, and unresolvable Git conflicts."),
            ("B", "Isolate each agent in a separate Git Worktree / branch; merge changes sequentially through an integration orchestrator running automated tests.", True, "Winner: Complete filesystem isolation; each agent works on independent branches; conflict resolution happens cleanly via PR/merge loops."),
            ("C", "Serialize agents to run strictly one at a time, eliminating all parallelism.", False, "Destroys performance gains of having multiple agents; takes 4x longer."),
            ("D", "Disable Git version control during agent execution.", False, "Eliminates all recovery mechanisms and audit history.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Git Worktrees (`git worktree add`)**: Allows checking out multiple branches of the same repository into separate physical directories simultaneously. Agent 1 works in `workspace/agent-1`, Agent 2 in `workspace/agent-2`.
  - **Orchestrated Integration**: An Integration Agent merges branches sequentially (`branch-1 -> main`), runs unit tests, and prompts for conflict resolution if two agents touched overlapping lines.
- **The Traps**:
  - **Shared Lockfiles**: Concurrent changes to `package.json` or `go.mod` require sequential dependency lock updates.""",
        "links": "[AI Agents Architecture](/technical-knowledge/ai-agents/agents) · [Distributed Systems](/technical-knowledge/system-design/distributed-systems)"
    },
    {
        "day": 56,
        "module": 7,
        "title": "Long-Running Jobs (Polling vs. Webhooks vs. SSE)",
        "scenario": "A machine learning audio transcription service processes 2-hour podcast recordings. Transcription takes 8 minutes. 5,000 client apps poll the status endpoint `GET /v1/jobs/123` every 200 milliseconds. 25,000 HTTP requests per second flood the API gateway, 99.99% of which return `\"status\": \"PROCESSING\"`, consuming 60% of infrastructure costs.",
        "question": "What is the optimal communication pattern to notify clients of asynchronous job completions?",
        "options": [
            ("A", "Continue 200ms polling but add 20 more web servers to handle the load.", False, "Extremely wasteful infrastructure cost ($15,000/mo) for empty polling responses."),
            ("B", "Use Webhooks for server-to-server integrations; use Server-Sent Events (SSE) or Exponential Backoff Polling with Jitter for browser/mobile clients.", True, "Winner: Eliminates polling traffic completely for webhooks; SSE pushes completion instantly in 1 persistent connection; polling backoff reduces requests by 95%."),
            ("C", "Keep the client's initial HTTP POST connection open for 8 minutes until transcription completes.", False, "Corporate firewalls, proxies, and browser HTTP timeouts terminate idle connections after 60 seconds."),
            ("D", "Send completion notifications via unencrypted SMS text messages to all users.", False, "Expensive SMS gateway fees; SMS does not deliver payloads directly into client app code.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **B2B Pattern (Webhooks)**: Client registers `callback_url`. When worker finishes, worker executes `POST callback_url` with HMAC signature. Client makes 0 polling requests.
  - **Browser Pattern (SSE / Smart Polling)**: If using polling, use exponential backoff: poll after 2s, 5s, 15s, 30s, 60s. Add $\\pm 20\\%$ random jitter to prevent synchronized client query waves.
- **The Traps**:
  - **Thundering Polling Herd**: If a batch of 1,000 jobs finishes at the exact same minute, clients must not all query results in the exact same millisecond.""",
        "links": "[Long-Running Tasks](/technical-knowledge/system-design/long-running-tasks) · [Webhook Architecture](/technical-knowledge/system-design/webhook)"
    },
    {
        "day": 57,
        "module": 7,
        "title": "Read Consistency (Quorum Consistency R + W > N)",
        "scenario": "A distributed key-value store (Cassandra / DynamoDB) is deployed with a replication factor of $N=3$. Writes are configured with `Write Consistency = ONE`, and reads are configured with `Read Consistency = ONE`. A user updates their password. When they immediately attempt to log in, their authentication read hits a replica that hasn't received the write yet, rejecting the valid login.",
        "question": "How do you guarantee Strong Read Consistency in leaderless distributed databases without synchronous two-phase locking?",
        "options": [
            ("A", "Set both Read and Write consistency to ALL ($R=3, W=3$).", False, "Destroys availability; write or read fails if even 1 node out of 3 is undergoing reboot or network blip."),
            ("B", "Enforce Quorum Consistency: Configure Read and Write quorums such that $R + W > N$ (e.g. $W=\\text{QUORUM} (2), R=\\text{QUORUM} (2)$ for $N=3$).", True, "Winner: Pigeonhole Principle guarantees that the set of nodes read overlaps with the set of nodes written by at least one node, ensuring latest data is always read."),
            ("C", "Deploy a single master database and abandon distributed databases.", False, "Removes high availability and horizontal scaling across multiple availability zones."),
            ("D", "Insert a 5-second sleep in the client app before attempting login.", False, "Unreliable hack that degrades user login experience.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **The Pigeonhole Principle**: If $N=3$, choosing $W=2$ and $R=2$ gives $R + W = 4 > 3$. Any read quorum of 2 nodes is mathematically guaranteed to include at least one node from the write quorum of 2.
  - **Read Repair**: The client compares timestamps from the quorum. If Node 1 has timestamp $t_2$ and Node 2 has $t_1$, the client uses $t_2$ (latest) and triggers background Read Repair on Node 2.
- **The Traps**:
  - **Network Partitions**: During severe partitions where a quorum ($> N/2$) cannot be formed, writes will fail to preserve consistency (CP mode).""",
        "links": "[Data Consistency Models](/technical-knowledge/system-design/data-consistency) · [CAP Theorem in Practice](/technical-knowledge/system-design/cap-theorem-system-design)"
    },
    {
        "day": 58,
        "module": 7,
        "title": "Agent Observability (Tracing LLM Pipelines & OpenTelemetry)",
        "scenario": "A complex multi-agent customer support system executes 12 LLM calls and 8 tool executions per user inquiry. Occasionally, an agent returns a nonsensical response or takes 45 seconds to answer. The team only has flat console logs (`logger.info(\"LLM finished\")`), making it impossible to identify which specific agent, prompt, tool, or embedding step stalled or hallucinated.",
        "question": "How do you achieve deep observability and root-cause tracing across distributed AI agent pipelines?",
        "options": [
            ("A", "Print all prompts and outputs to standard stdout in terminal.", False, "Unstructured text interleaves across concurrent requests; impossible to correlate in high-concurrency production."),
            ("B", "Implement Distributed Tracing with OpenTelemetry / OpenInference standards: Record hierarchical Spans with inputs, outputs, token counts, latencies, and tool metadata.", True, "Winner: Visual trace waterfalls show exact latency breakdown of each sub-call, token usage per agent, and full prompt/completion payloads for debugging."),
            ("C", "Record screen capture video of the server terminal while running.", False, "Absurd overhead; non-searchable, non-scalable, and cannot trigger automated alerts."),
            ("D", "Disable all logging to maximize inference speed.", False, "Blind system operation; impossible to diagnose failures or audit security leaks.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Hierarchical Trace Spans**:
    - `Root Span: User Inquiry` (42s)
      - `Span 1: Intent Router` (1.2s, 120 tokens)
      - `Span 2: Vector Search` (45ms, retrieved 3 chunks)
      - `Span 3: SQL Tool Call` (38s - **BOTTLENECK IDENTIFIED! Unindexed query**)
      - `Span 4: Final Synthesis` (2.5s, 850 tokens)
  - **Root Cause in Seconds**: Trace waterfalls immediately pinpoint that the SQL tool had an unindexed scan, not the LLM reasoning step.
- **The Traps**:
  - **PII Leakage in Spans**: LLM prompts often contain sensitive user PII (names, credit cards). Implement regex masking sanitizers before sending spans to tracing backends.""",
        "links": "[Observability](/technical-knowledge/system-design/observability) · [Distributed Tracing](/technical-knowledge/system-design/distributed-tracing)"
    },
    {
        "day": 59,
        "module": 7,
        "title": "Idempotency Key Design (Deterministic Key Generation & Conflicts)",
        "scenario": "A mobile checkout app generates a random UUID on every request click: `idempotency_key = uuid.v4()`. When a network timeout occurs, the mobile client catches the exception and executes `retry()`. The retry generates a brand new UUID `uuid.v4()`, completely bypassing the server's idempotency deduplication cache and charging the user twice.",
        "question": "How do you design and generate robust idempotency keys that survive mobile crashes, retries, and network drops?",
        "options": [
            ("A", "Generate random UUIDs on the backend server inside the request handler.", False, "The backend receives two distinct HTTP calls; generating keys on server cannot deduplicate client retries."),
            ("B", "Generate deterministic client-side keys tied to business intent: `SHA256(user_id + cart_id + order_total)` or generate one UUID upon checkout screen render and persist in client storage across retries.", True, "Winner: Retries re-send the exact same idempotency token; server detects token in cache and returns cached order response."),
            ("C", "Use client IP address as the idempotency key.", False, "All users behind a corporate office NAT share the same IP; blocks legitimate users from ordering."),
            ("D", "Do not use idempotency keys; require users to type their password before every payment.", False, "Does not prevent network drop retries where the client auto-retries after connection drops.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Key Lifetime Bound to User Intent**: The idempotency key must represent the *intent to purchase this specific cart*, not the individual network packet.
  - **Conflict Detection (Payload Mismatch)**: If a request arrives with key $K$ but a different payload (e.g. cart items changed), the server returns `HTTP 422 Unprocessable Entity` (\"Idempotency key reused with mismatched payload\") to prevent security spoofing.
- **The Traps**:
  - **Re-generating Keys on Error**: Mobile retry loops must pass the original token to the retry interceptor.""",
        "links": "[Time, Ordering & Unique IDs](/technical-knowledge/system-design/time-and-ordering-and-unique-ids) · [Handling Contention](/technical-knowledge/system-design/handling-contention)"
    },
    {
        "day": 60,
        "module": 7,
        "title": "SaaS Platform Architecture (Multi-Tenant Isolation & Modular Monoliths)",
        "scenario": "A high-growth B2B SaaS startup signs 5,000 small business customers ($50/month) and 5 Fortune 500 banks ($100,000/month). Small businesses need high density to keep cloud costs low. The banks demand strict data isolation, zero noisy-neighbor performance impact, dedicated encryption keys, and SOC2 / HIPAA audit compliance.",
        "question": "How do you architect a multi-tenant SaaS platform that scales cost-effectively for SMBs while meeting strict enterprise isolation requirements?",
        "options": [
            ("A", "Deploy a single shared database table with `tenant_id` for all customers, including the banks.", False, "Fails enterprise bank security audits; noisy SMB queries can slow down bank operations."),
            ("B", "Adopt a Tiered Hybrid Architecture: Pooled database with Row-Level Security (RLS) for SMBs; dedicated isolated schemas or database instances for Enterprise tenants.", True, "Winner: Minimizes infrastructure cost for low-paying users while providing physical security isolation and dedicated compute for enterprise contracts."),
            ("C", "Provision 5,000 separate Kubernetes clusters and 5,000 independent databases for every SMB tenant.", False, "Bankrupts the startup; Kubernetes control plane and database idle compute costs exceed SMB subscription revenue."),
            ("D", "Split the startup codebase into 35 microservices before signing the first enterprise customer.", False, "Premature microservice fragmentation creates massive operational drag; begin with a clean Modular Monolith.")
        ],
        "correct": "B",
        "deep_dive": """- **Why B Wins**:
  - **Hybrid Tenant Routing**: Tenant router inspects JWT claim `tenant_tier`.
    - `tier == 'standard'` $\\to$ Shared Postgres cluster with automated Row-Level Security (`ALTER TABLE orders ENABLE ROW LEVEL SECURITY`).
    - `tier == 'enterprise'` $\\to$ Dedicated RDS instance in a separate VPC with customer-managed KMS encryption keys.
  - **The Modular Monolith Advantage**: Maintain a single codebase with strict domain boundaries and clear module interfaces. Deploying 1 artifact moves 5x faster in early growth while enabling extraction of dedicated microservices only when specific scaling limits demand it.
- **The Traps**:
  - **Leaky Tenant Context**: Always enforce tenant context at the database connection / ORM framework level (ThreadLocal / AsyncLocalStorage), never in manual SQL `WHERE` clauses.""",
        "links": "[Database per Service](/technical-knowledge/system-design/database-per-service) · [Microservice Chassis](/technical-knowledge/system-design/microservice-chassis) · [Architecture Fundamentals](/technical-knowledge/system-design/architecture-fundamentals)"
    }
]

print(f"Loaded {len(DAYS_P2)} days for modules 5-7.")
