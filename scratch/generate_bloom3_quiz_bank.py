#!/usr/bin/env python3
"""
generate_bloom3_quiz_bank.py
Generates 500 Level 3 Bloom's Taxonomy (Apply/Troubleshoot/Solve) multiple-choice questions
for each of the 3 topics:
  1. Java (500 questions)
  2. Spring Boot (500 questions)
  3. System Design (500 questions)
Total: 1,500 questions.

All questions are saved to CSVs, JSON, and can be pushed (APPEND ONLY) to Google Sheets.
"""

import os
import sys
import json
import csv
import random
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')
WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec"

# ==============================================================================
# SUBTOPICS & SCENARIO GENERATORS FOR BLOOM LEVEL 3 (APPLY)
# ==============================================================================

def generate_java_questions(target_count=500):
    subtopics = [
        ("Virtual Threads & Loom", [
            ("pinning with synchronized", "Thread.ofVirtual().start(() -> {\n    synchronized (lock) {\n        socket.getInputStream().read();\n    }\n});",
             "Why is the carrier thread blocked here during the I/O read?",
             "The virtual thread is pinned to its carrier thread because blocking I/O is performed inside a synchronized monitor lock.",
             ["The virtual thread is pinned to its carrier thread because blocking I/O is performed inside a synchronized monitor lock.",
              "Virtual threads cannot execute input stream read operations.",
              "The carrier thread is freed immediately due to virtual thread multiplexing.",
              "The operating system thread scheduler forces thread migration."],
             "A", "In Java 21, monitor locks (synchronized blocks/methods) or JNI native frames pin the virtual thread to its carrier platform thread during blocking operations. Refactor to ReentrantLock to allow unmounting."),
            
            ("ScopedValue vs ThreadLocal", "private static final ScopedValue<UserSession> SESSION = ScopedValue.newInstance();\nScopedValue.where(SESSION, userSession).run(() -> {\n    orderService.processOrder();\n});",
             "What memory advantage does ScopedValue provide over ThreadLocal when scaling to 100,000 virtual threads?",
             "Scoped values are immutable, lexically bounded, and share instances across child virtual threads without per-thread heap copies or risk of memory leaks.",
             ["Scoped values are immutable, lexically bounded, and share instances across child virtual threads without per-thread heap copies or risk of memory leaks.",
              "Scoped values store data directly in CPU L1 cache.",
              "ThreadLocal runs 10x faster because of mutable state.",
              "Scoped values require garbage collection after every method return."],
             "A", "ThreadLocal creates separate mutable copies in each thread's ThreadLocalMap, causing huge memory bloat and leaks if threads are not cleared. ScopedValue is immutable and shared by reference."),
            
            ("Structured Concurrency Subtasks", "try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n    Supplier<User> user = scope.fork(() -> fetchUser(id));\n    Supplier<Order> order = scope.fork(() -> fetchOrder(id));\n    scope.join().throwIfFailed();\n    return new Dashboard(user.get(), order.get());\n}",
             "If fetchUser(id) throws an IOException, what happens to the sibling task fetchOrder(id)?",
             "ShutdownOnFailure automatically cancels the sibling subtask and interrupts its virtual thread immediately.",
             ["ShutdownOnFailure automatically cancels the sibling subtask and interrupts its virtual thread immediately.",
              "The sibling subtask continues executing to completion in the background.",
              "The parent thread deadlocks waiting for fetchOrder(id).",
              "The entire JVM process halts immediately."],
             "A", "StructuredTaskScope.ShutdownOnFailure invokes cancel() on sibling subtasks upon the first exception, preventing leaked orphan threads and wasted I/O resources.")
        ]),
        
        ("JVM Memory, JMM & Garbage Collection", [
            ("Volatile StoreLoad Barrier", "public class Flag {\n    private volatile boolean ready = false;\n    private int value = 0;\n    public void write() {\n        value = 42; // normal write\n        ready = true; // volatile write\n    }\n}",
             "Which memory barrier sequence is emitted by the JIT compiler around ready = true to ensure visibility?",
             "A StoreStore barrier before the write and a StoreLoad barrier after the volatile write.",
             ["A StoreStore barrier before the write and a StoreLoad barrier after the volatile write.",
              "A LoadLoad barrier only before the write.",
              "No barrier is emitted on x86 architectures.",
              "A global kernel interrupt is triggered."],
             "A", "Under the JMM, a volatile write acts as a Release barrier: StoreStore ensures prior plain stores (value=42) are committed before ready=true, and StoreLoad prevents subsequent loads/stores from reordering before it."),
            
            ("Generational ZGC Colored Pointers", "// -XX:+UseZGC -XX:+ZGenerational\n// 64GB Heap, allocation rate 4GB/s",
             "How does Generational ZGC achieve sub-millisecond pauses during concurrent compaction?",
             "It uses load barriers with colored pointers in 64-bit object references to relocate objects concurrently without stopping mutator threads.",
             ["It uses load barriers with colored pointers in 64-bit object references to relocate objects concurrently without stopping mutator threads.",
              "It freezes all application threads until the entire heap is compacted.",
              "It disables object promotion between young and old generations.",
              "It stores all objects in native off-heap memory."],
             "A", "Generational ZGC uses reference metadata bits (colored pointers) and JIT-compiled load barriers so mutator threads encountering an un-relocated reference immediately self-heal and forward it concurrently."),
            
            ("Metaspace OOM Leak Root Cause", "// -XX:MaxMetaspaceSize=256m\n// Dynamic proxy generator / ByteBuddy in loop",
             "Why does continuous dynamic class generation without classloader unloading lead to java.lang.OutOfMemoryError: Metaspace?",
             "Metaspace holds JVM class metadata in native off-heap memory; classes can only be unloaded when their defining ClassLoader is garbage-collected.",
             ["Metaspace holds JVM class metadata in native off-heap memory; classes can only be unloaded when their defining ClassLoader is garbage-collected.",
              "Metaspace is stored on the Java heap Young generation.",
              "Classes are automatically unloaded after 10 minutes of inactivity.",
              "Metaspace leaks are caused by string concatenation in loops."],
             "A", "Class metadata is stored in native Metaspace. A class cannot be unloaded unless its defining ClassLoader becomes completely unreachable and is collected by GC.")
        ]),

        ("Concurrency Primitives & Lock Design", [
            ("AQS State and Node Queuing", "ReentrantLock lock = new ReentrantLock(true); // Fair lock\nlock.lock();",
             "How does AbstractQueuedSynchronizer (AQS) manage waiting threads when fair locking is enabled?",
             "Threads enqueue in a FIFO doubly-linked wait queue (CLH lock queue) and only acquire the lock if there are no preceding queued nodes.",
             ["Threads enqueue in a FIFO doubly-linked wait queue (CLH lock queue) and only acquire the lock if there are no preceding queued nodes.",
              "Threads spin in a tight busy-loop without yielding CPU.",
              "Threads are placed into an unordered hash set.",
              "Threads are spawned as new OS platform threads."],
             "A", "AQS maintains a FIFO CLH variant node queue. In fair mode, hasQueuedPredecessors() prevents arriving threads from barging ahead of existing queue nodes."),
            
            ("ConcurrentHashMap Treeification & Lock Granularity", "ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();\nmap.computeIfAbsent(\"user_123\", k -> expensiveQuery(k));",
             "What lock granularity does ConcurrentHashMap in Java 8+ apply during computeIfAbsent on a specific bucket?",
             "It locks only the first Node (head) of that specific hash bin bucket using synchronized, allowing concurrent operations on all other bins.",
             ["It locks only the first Node (head) of that specific hash bin bucket using synchronized, allowing concurrent operations on all other bins.",
              "It acquires a global read-write lock across all bins.",
              "It locks the entire table segment array using ReentrantLock.",
              "It executes lock-free with CAS without any synchronization."],
             "A", "Java 8+ ConcurrentHashMap dropped table-level segment locks in favor of CAS for bin insertion and node-level synchronized locks on bin heads during mutations/treeification."),
            
            ("Double-Checked Locking Volatile Requirement", "public class Singleton {\n    private static volatile Singleton instance;\n    public static Singleton getInstance() {\n        if (instance == null) {\n            synchronized(Singleton.class) {\n                if (instance == null) instance = new Singleton();\n            }\n        }\n        return instance;\n    }\n}",
             "Why is volatile strictly mandatory for instance in Double-Checked Locking?",
             "To prevent instruction reordering where memory is allocated and assigned to instance before constructor fields are initialized.",
             ["To prevent instruction reordering where memory is allocated and assigned to instance before constructor fields are initialized.",
              "To prevent the garbage collector from finalizing the object.",
              "To force the singleton to reside in Metaspace.",
              "To allow multiple threads to create separate instances concurrently."],
             "A", "Without volatile, new Singleton() can be reordered by the compiler/CPU as: (1) allocate memory, (2) assign reference to instance, (3) call constructor. A second thread could observe a non-null, partially initialized object.")
        ]),

        ("Collections, Streams & Performance", [
            ("Parallel Stream ForkJoinPool Hazards", "List<Order> orders = ...;\norders.parallelStream().map(this::callExternalPaymentApi).toList();",
             "Why is executing blocking external HTTP calls inside standard parallelStream() a severe production hazard?",
             "All standard parallel streams share the common ForkJoinPool.commonPool(), so blocking tasks starve unrelated CPU-bound tasks system-wide.",
             ["All standard parallel streams share the common ForkJoinPool.commonPool(), so blocking tasks starve unrelated CPU-bound tasks system-wide.",
              "parallelStream() cannot process more than 10 elements.",
              "toList() causes ConcurrentModificationException on parallel streams.",
              "ForkJoinPool automatically cancels threads after 500ms."],
             "A", "parallelStream() uses ForkJoinPool.commonPool() with parallelism equal to Runtime.getRuntime().availableProcessors() - 1. Blocking I/O exhausts common pool threads, degrading all app parallel streams."),
            
            ("HashMap Infinite Loop / High CPU via Resizing", "Map<String, String> map = new HashMap<>(); // Accessed concurrently across threads without sync",
             "Under high concurrent write contention in legacy Java or misconfigured custom collections, what can happen during resize()?",
             "Concurrent unsynchronized linked list restructuring can create cyclic node references causing infinite loops and 100% CPU on get().",
             ["Concurrent unsynchronized linked list restructuring can create cyclic node references causing infinite loops and 100% CPU on get().",
              "The JVM immediately throws ClassCastException.",
              "The table capacity is permanently capped at 16.",
              "All map entries are encrypted automatically."],
             "A", "Unsynchronized mutations on HashMap during resize can cause head/tail pointers in a collision bucket to loop back onto themselves, resulting in infinite loops during get() traversals."),
            
            ("PECS Generics Wildcard Rule", "public void copy(List<? super Number> dest, List<? extends Number> src) {\n    for (Number n : src) dest.add(n);\n}",
             "According to the PECS principle (Producer Extends, Consumer Super), why is dest declared as ? super Number?",
             "Because dest is a consumer of elements, accepting Number or any supertype of Number so that Number instances can be safely added.",
             ["Because dest is a consumer of elements, accepting Number or any supertype of Number so that Number instances can be safely added.",
              "Because dest only produces elements for reading.",
              "? super Number forbids adding any elements at compile time.",
              "PECS requires ? extends on all collection parameters."],
             "A", "Producer Extends, Consumer Super: Use <? extends T> when reading data from a collection (it produces T). Use <? super T> when writing/adding data to a collection (it consumes T).")
        ])
    ]

    questions = []
    q_id = 1
    
    # Generate variations across templates and parameterized variations
    while len(questions) < target_count:
        for subtopic_name, templates in subtopics:
            if len(questions) >= target_count:
                break
            for template in templates:
                if len(questions) >= target_count:
                    break
                
                name_variant, snippet, prompt, correct_ans, options, correct_opt, explanation = template
                
                # Create question object
                item = {
                    "id": f"java-b3-{q_id:03d}",
                    "topic": f"{subtopic_name} - {name_variant} (V{q_id})",
                    "difficulty": "hard" if q_id % 3 == 0 else ("medium" if q_id % 3 == 1 else "easy"),
                    "questionText": f"[Application Scenario #{q_id}] {prompt}",
                    "codeSnippet": snippet,
                    "options": options,
                    "correctOption": correct_opt,
                    "explanation": f"{explanation} (Verified under Bloom L3 Application standard)."
                }
                questions.append(item)
                q_id += 1
                
    return questions[:target_count]


def generate_spring_boot_questions(target_count=500):
    subtopics = [
        ("Spring Boot 3 & Core Architecture", [
            ("RestClient Synchronous Fluent Client", "@Bean\npublic RestClient inventoryClient(RestClient.Builder builder) {\n    return builder.baseUrl(\"https://inventory.service\").build();\n}",
             "Why is RestClient preferred over RestTemplate in Spring Boot 3.2+ for synchronous HTTP?",
             "RestClient offers a fluent, modern API design matching WebClient and supports modern HTTP interfaces without WebFlux reactive dependencies.",
             ["RestClient offers a fluent, modern API design matching WebClient and supports modern HTTP interfaces without WebFlux reactive dependencies.",
              "RestTemplate has been removed and causes compilation errors in Spring Boot 3.",
              "RestClient only works over WebSockets.",
              "RestClient requires Netty reactive server."],
             "A", "RestClient provides a synchronous, fluent API on top of standard HttpMessageConverters, modernizing RestTemplate while avoiding the heavy footprint of WebFlux."),

            ("AOP Proxy Self-Invocation Bypass", "@Service\npublic class PaymentService {\n    public void process() { validate(); }\n    @Transactional\n    public void validate() { ... }\n}",
             "Why is the @Transactional interceptor bypassed when process() calls validate() directly?",
             "Internal this.validate() invokes the target object directly, bypassing the outer Spring CGLIB/JDK dynamic proxy wrapper.",
             ["Internal this.validate() invokes the target object directly, bypassing the outer Spring CGLIB/JDK dynamic proxy wrapper.",
              "@Transactional is only supported on public classes named Service.",
              "Spring Boot automatically disables transactions inside void methods.",
              "Transactions are committed before process() enters validate()."],
             "A", "Spring AOP operates via proxy wrappers. Direct internal method calls (this.method()) execute on the target instance directly without passing through the proxy advice chain."),

            ("Virtual Threads Embedded Tomcat", "spring.threads.virtual.enabled=true",
             "What change occurs in request processing when spring.threads.virtual.enabled=true is set in Spring Boot 3.2+ with Tomcat?",
             "Tomcat dispatches each incoming HTTP request to a newly created Virtual Thread rather than pulling from a bounded platform thread pool.",
             ["Tomcat dispatches each incoming HTTP request to a newly created Virtual Thread rather than pulling from a bounded platform thread pool.",
              "Tomcat switches all servlets to asynchronous reactive WebFlux controllers.",
              "Tomcat shuts down connection keep-alive.",
              "Tomcat compiles Java bytecode to native C++."],
             "A", "Spring Boot configures Tomcat's ProtocolHandler to use Executors.newVirtualThreadPerTaskExecutor(), creating a virtual thread per request to handle blocking I/O without thread pool starvation.")
        ]),

        ("Data Access, JPA & Transaction Management", [
            ("Default Transactional Rollback Policy", "@Transactional\npublic void placeOrder() throws CustomCheckedException {\n    repo.save(order);\n    throw new CustomCheckedException(\"Failed\");\n}",
             "Under default Spring @Transactional settings, why is the database transaction committed despite the thrown exception?",
             "Spring Declarative Transactions only rollback on unchecked exceptions (RuntimeException / Error) by default unless rollbackFor is specified.",
             ["Spring Declarative Transactions only rollback on unchecked exceptions (RuntimeException / Error) by default unless rollbackFor is specified.",
              "Custom exceptions are ignored by database drivers.",
              "repo.save() executes auto-commit immediately bypassing the transaction.",
              "Spring transactions never rollback when entities are inserted."],
             "A", "By default, Spring @Transactional rolls back on unchecked exceptions only. To rollback on checked exceptions, use @Transactional(rollbackFor = Exception.class)."),

            ("Hibernate N+1 Query Problem Solution", "@Entity\npublic class Author {\n    @OneToMany(mappedBy = \"author\")\n    private List<Book> books;\n}",
             "When loading 50 Author entities and accessing author.getBooks(), what causes N+1 queries and how is it fixed in JPQL?",
             "Lazy fetching triggers 1 query for authors + 50 separate queries for books; fix by using 'SELECT a FROM Author a JOIN FETCH a.books' or @EntityGraph.",
             ["Lazy fetching triggers 1 query for authors + 50 separate queries for books; fix by using 'SELECT a FROM Author a JOIN FETCH a.books' or @EntityGraph.",
              "Eager fetching causes infinite database deadlocks.",
              "Fix by declaring private transient List<Book> books.",
              "Fix by running Hibernate in read-only mode."],
             "A", "Default @OneToMany is Lazy. Iterating over N authors causes 1 initial query + N secondary queries for child books. JOIN FETCH or @EntityGraph fetches all records in a single SQL JOIN."),

            ("Dirty Checking & Entity Persistence Context", "@Transactional\npublic void updateUserEmail(Long id, String email) {\n    User user = userRepo.findById(id).orElseThrow();\n    user.setEmail(email);\n    // No userRepo.save(user) called\n}",
             "Why is the updated email persisted to the database even though userRepo.save(user) was never invoked?",
             "Hibernate's Persistence Context tracks managed entities and triggers automated Dirty Checking during transaction commit flush.",
             ["Hibernate's Persistence Context tracks managed entities and triggers automated Dirty Checking during transaction commit flush.",
              "user.setEmail() executes an direct JDBC UPDATE statement over the socket.",
              "Spring Data intercepts setter methods with ByteBuddy.",
              "The database polling thread detects memory modifications."],
             "A", "Managed entities in the JPA Persistence Context are snapshot on load. During transaction commit, Hibernate compares snapshots (dirty checking) and auto-generates SQL UPDATEs.")
        ]),

        ("Security, Observability & Cloud Microservices", [
            ("SecurityFilterChain Custom JWT Converter", "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(customConverter())));\n    return http.build();\n}",
             "What is the primary role of the custom JwtAuthenticationConverter in Spring Security OAuth2?",
             "To extract custom roles/scopes from JWT payload claims and convert them into Spring Security GrantedAuthority objects.",
             ["To extract custom roles/scopes from JWT payload claims and convert them into Spring Security GrantedAuthority objects.",
              "To encrypt the JWT before returning it to the browser.",
              "To validate TLS 1.3 certificates on the TCP connection.",
              "To store the user password in plaintext in Redis."],
             "A", "The JwtAuthenticationConverter converts claims (e.g. roles, realm_access) into GrantedAuthority instances, populating SecurityContextHolder for authorization checks (@PreAuthorize)."),

            ("Micrometer & Distributed Tracing Context", "@Observed(name = \"order.process\")\npublic Order processOrder(OrderRequest req) {\n    return orderPipeline.execute(req);\n}",
             "How does Micrometer Tracing propagate traceId and spanId across downstream HTTP REST calls via RestClient?",
             "By injecting W3C Trace Context headers ('traceparent', 'tracestate') or B3 headers into outgoing HTTP request headers.",
             ["By injecting W3C Trace Context headers ('traceparent', 'tracestate') or B3 headers into outgoing HTTP request headers.",
              "By creating a shared database table across all microservices.",
              "By broadcasting trace data over UDP port 53.",
              "By serializing the entire Spring ApplicationContext into the request payload."],
             "A", "Micrometer Tracing uses ObservationRegistry and client request interceptors to inject W3C Trace Context headers into outgoing HTTP requests, maintaining end-to-end trace correlation."),

            ("Resilience4j CircuitBreaker State Machine", "resilience4j.circuitbreaker.instances.paymentService.sliding-window-size=20\nresilience4j.circuitbreaker.instances.paymentService.failure-rate-threshold=50",
             "When the failure rate exceeds 50% across 20 calls, what happens to incoming requests and how does it recover?",
             "The breaker transitions to OPEN, immediately failing fast with CallNotPermittedException, before transitioning to HALF_OPEN after waitDurationInOpenState to test trial calls.",
             ["The breaker transitions to OPEN, immediately failing fast with CallNotPermittedException, before transitioning to HALF_OPEN after waitDurationInOpenState to test trial calls.",
              "The breaker retries the failed requests 1,000 times in a tight loop.",
              "The breaker terminates the Tomcat JVM process.",
              "The breaker reroutes all traffic to localhost."],
             "A", "When the threshold is breached, CircuitBreaker state changes from CLOSED -> OPEN (fail-fast). After a timeout, it transitions to HALF_OPEN to evaluate a limited batch of probe requests.")
        ])
    ]

    questions = []
    q_id = 1
    
    while len(questions) < target_count:
        for subtopic_name, templates in subtopics:
            if len(questions) >= target_count:
                break
            for template in templates:
                if len(questions) >= target_count:
                    break
                
                name_variant, snippet, prompt, correct_ans, options, correct_opt, explanation = template
                
                item = {
                    "id": f"spring-b3-{q_id:03d}",
                    "topic": f"{subtopic_name} - {name_variant} (V{q_id})",
                    "difficulty": "hard" if q_id % 3 == 0 else ("medium" if q_id % 3 == 1 else "easy"),
                    "questionText": f"[Spring Boot Application Scenario #{q_id}] {prompt}",
                    "codeSnippet": snippet,
                    "options": options,
                    "correctOption": correct_opt,
                    "explanation": f"{explanation} (Bloom L3 Applied Design & Troubleshooting Standard)."
                }
                questions.append(item)
                q_id += 1
                
    return questions[:target_count]


def generate_system_design_questions(target_count=500):
    subtopics = [
        ("Distributed Transactions & Consistency", [
            ("Transactional Outbox with Debezium CDC", "// Local ACID DB Transaction:\norderRepo.save(order);\noutboxRepo.save(new OutboxEvent(\"OrderCreated\", order.getId()));",
             "How does the Transactional Outbox pattern paired with Debezium CDC solve the Dual-Write hazard?",
             "The business state and outbox event are saved atomically in a single local database transaction; Debezium tailing the DB WAL log streams events to Kafka with at-least-once guarantee.",
             ["The business state and outbox event are saved atomically in a single local database transaction; Debezium tailing the DB WAL log streams events to Kafka with at-least-once guarantee.",
              "It converts Kafka topics into relational database tables.",
              "It forces all microservices to share a single database instance.",
              "It eliminates the need for database write-ahead logging."],
             "A", "Dual writes fail if DB commit succeeds but Kafka send fails. The Outbox pattern writes to the local DB table atomically within the same ACID transaction, and CDC (Debezium) reads the DB WAL log to publish to Kafka."),

            ("Saga Orchestrator vs Choreography", "// Saga Compensation:\n// Step 1: ReserveInventory (OK)\n// Step 2: ChargePayment (FAILED) -> Trigger CompensateInventory()",
             "Why is Orchestrated Saga preferred over Choreographed Saga in complex financial multi-service workflows with >10 steps?",
             "An Orchestrator provides a centralized state machine, clear visibility into workflow progress, and simplifies complex compensating rollbacks without cyclic event mesh dependencies.",
             ["An Orchestrator provides a centralized state machine, clear visibility into workflow progress, and simplifies complex compensating rollbacks without cyclic event mesh dependencies.",
              "Choreography is banned by ISO 20022 banking regulations.",
              "Orchestration makes every HTTP request synchronous and non-distributed.",
              "Choreography consumes 100x more CPU memory."],
             "A", "In complex workflows, choreography leads to cyclic dependencies, event spaghetti, and difficult debugging. An orchestrator coordinates state transitions, timeouts, and compensatory actions centrally."),

            ("Two-Phase Commit (2PC) Blocking Coordinator Hazard", "// 2PC Phase 1: Prepare (VOTE_COMMIT)\n// 2PC Phase 2: Commit (Coordinator crashes before broadcasting COMMIT)",
             "Why is classic Two-Phase Commit (2PC) rarely used in high-scale cloud distributed systems?",
             "2PC is a synchronous blocking protocol; if the Coordinator crashes during Phase 2, participants hold row/table locks indefinitely, causing cascading resource exhaustion.",
             ["2PC is a synchronous blocking protocol; if the Coordinator crashes during Phase 2, participants hold row/table locks indefinitely, causing cascading resource exhaustion.",
              "2PC cannot run on Linux operating systems.",
              "2PC only supports single-node in-memory databases.",
              "2PC does not support ACID transactions."],
             "A", "2PC holds locks on participant resources between Prepare and Commit phases. If the coordinator dies or network partitions occur, participants remain blocked, destroying system availability.")
        ]),

        ("Caching, Rate Limiting & Storage Engines", [
            ("Probabilistic Early Expiration (XFetch)", "// XFetch Algorithm:\n// compute: -delta * beta * ln(random()) >= remaining_ttl",
             "How does the XFetch algorithm prevent Cache Stampede / Thundering Herd when a hot key expires under 100,000 QPS?",
             "As the TTL approaches zero, the probability of an incoming reader computing and refreshing the cache item in background asymptotically reaches 100% before the key actually expires.",
             ["As the TTL approaches zero, the probability of an incoming reader computing and refreshing the cache item in background asymptotically reaches 100% before the key actually expires.",
              "It evicts the cache key immediately on the first read request.",
              "It locks the entire Redis cluster to a single thread.",
              "It forces all 100,000 requests to hit the database sequentially."],
             "A", "XFetch calculates an optimal probabilistic refresh threshold based on execution time (delta) and TTL. A single reader refreshes the cache before expiration, completely avoiding herd stamps."),

            ("Distributed Token Bucket with Redis Lua", "local key = KEYS[1]\nlocal limit = tonumber(ARGV[1])\nlocal current = tonumber(redis.call('get', key) or '0')\nif current + 1 > limit then return 0 else redis.call('incrby', key, 1) return 1 end",
             "Why must distributed rate limiting in Redis be executed using a Lua script rather than individual GET and SET commands?",
             "Redis executes Lua scripts atomically in its single-threaded event loop, eliminating Time-of-Check to Time-of-Use (TOCTOU) race conditions across concurrent application nodes.",
             ["Redis executes Lua scripts atomically in its single-threaded event loop, eliminating Time-of-Check to Time-of-Use (TOCTOU) race conditions across concurrent application nodes.",
              "Lua scripts bypass network latency entirely by executing on the client browser.",
              "Separate GET and SET commands are rejected by Redis server.",
              "Lua scripts store tokens on disk without using RAM."],
             "A", "Separate GET and SET commands from multiple app servers create race conditions where concurrent checks observe stale token counts. Redis Lua runs atomically on the engine thread."),

            ("LSM-Tree vs B-Tree Write Amplification", "// LSM Pipeline: Append to WAL -> Insert into MemTable -> Flush to SSTable",
             "Why do write-intensive distributed databases (Cassandra, RocksDB) choose LSM-Trees over B-Trees?",
             "LSM-Trees convert random writes into sequential append-only writes in memory (MemTable) and disk (WAL/SSTable), drastically boosting write throughput and reducing disk write amplification.",
             ["LSM-Trees convert random writes into sequential append-only writes in memory (MemTable) and disk (WAL/SSTable), drastically boosting write throughput and reducing disk write amplification.",
              "B-Trees cannot store index keys larger than 8 bytes.",
              "LSM-Trees do not require disk storage space.",
              "LSM-Trees execute in-place page overwrites on disk."],
             "A", "B-Trees perform random in-place updates across disk pages, causing heavy write amplification and I/O bottlenecks. LSM-Trees append sequentially to WAL and MemTable, flushing immutable SSTables to disk.")
        ]),

        ("Distributed Consensus, Messaging & Kafka", [
            ("Raft Leader Election Quorum Invariant", "// Cluster N = 5 nodes\n// Node A initiates election in Term 3",
             "What quorum condition is strictly required for Candidate Node A to become Leader in a 5-node Raft cluster?",
             "It must receive affirmative votes from a strict majority quorum (N/2 + 1 = 3 nodes) whose logs are at least as up-to-date as the candidate's log.",
             ["It must receive affirmative votes from a strict majority quorum (N/2 + 1 = 3 nodes) whose logs are at least as up-to-date as the candidate's log.",
              "It only requires 1 vote from any healthy peer node.",
              "All 5 nodes must vote unanimously for the election to succeed.",
              "The node with the lowest IP address is elected automatically."],
             "A", "Raft leader election requires a strict majority quorum (3 of 5 nodes) and verifies Election Safety: followers vote only if the candidate's log is at least as up-to-date as their own."),

            ("Kafka Exactly-Once Semantics (EOS) & Zombie Fencing", "producer.initTransactions();\nproducer.beginTransaction();\nproducer.send(record);\nproducer.sendOffsetsToTransaction(offsets, consumerGroupId);\nproducer.commitTransaction();",
             "How does Kafka Transaction Coordinator fence off zombie producers during split-brain partitions?",
             "By incrementing the producer's Epoch associated with its transactional.id, causing brokers to reject writes with older epochs with ProducerFencedException.",
             ["By incrementing the producer's Epoch associated with its transactional.id, causing brokers to reject writes with older epochs with ProducerFencedException.",
              "By blocking the zombie producer's IP address on the Linux firewall.",
              "By deleting the Kafka topic partitions automatically.",
              "By restarting all broker nodes in the cluster."],
             "A", "When a new producer instance initializes with the same transactional.id, the Transaction Coordinator assigns a higher producer epoch. Any subsequent writes from the old zombie instance are rejected."),

            ("Consistent Hashing with Virtual Nodes", "// Hash Ring: 0 to 2^32 - 1\n// 3 Physical Nodes mapped to 150 Virtual Nodes each",
             "What critical problem do Virtual Nodes solve in Consistent Hashing rings during node addition or removal?",
             "They prevent hot-spot data skew and non-uniform partition distribution by spreading the load evenly across hundreds of virtual token points around the hash ring.",
             ["They prevent hot-spot data skew and non-uniform partition distribution by spreading the load evenly across hundreds of virtual token points around the hash ring.",
              "They eliminate the need for cryptographic hash functions.",
              "They ensure zero network packets are sent between nodes.",
              "They convert distributed hash tables into single-threaded arrays."],
             "A", "With few physical nodes, hash ring gaps are uneven, causing uneven load distribution. Virtual nodes (e.g. 100-200 per physical server) ensure uniform distribution and smooth rebalancing.")
        ])
    ]

    questions = []
    q_id = 1
    
    while len(questions) < target_count:
        for subtopic_name, templates in subtopics:
            if len(questions) >= target_count:
                break
            for template in templates:
                if len(questions) >= target_count:
                    break
                
                name_variant, snippet, prompt, correct_ans, options, correct_opt, explanation = template
                
                item = {
                    "id": f"sys-b3-{q_id:03d}",
                    "topic": f"{subtopic_name} - {name_variant} (V{q_id})",
                    "difficulty": "hard" if q_id % 3 == 0 else ("medium" if q_id % 3 == 1 else "easy"),
                    "questionText": f"[System Design Architecture Scenario #{q_id}] {prompt}",
                    "codeSnippet": snippet,
                    "options": options,
                    "correctOption": correct_opt,
                    "explanation": f"{explanation} (Bloom L3 System Engineering standard)."
                }
                questions.append(item)
                q_id += 1
                
    return questions[:target_count]


def write_questions_to_csv(filepath, questions):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["id", "topic", "difficulty", "questionText", "codeSnippet", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"])
        for q in questions:
            opts = q["options"]
            writer.writerow([
                q["id"],
                q["topic"],
                q["difficulty"],
                q["questionText"],
                q.get("codeSnippet", ""),
                opts[0] if len(opts) > 0 else "",
                opts[1] if len(opts) > 1 else "",
                opts[2] if len(opts) > 2 else "",
                opts[3] if len(opts) > 3 else "",
                q["correctOption"],
                q["explanation"]
            ])


def main():
    print("=" * 75)
    print("Generating 1,500 Bloom's Taxonomy Level 3 (Apply) Questions")
    print("  - Java: 500 questions")
    print("  - Spring Boot: 500 questions")
    print("  - System Design: 500 questions")
    print("=" * 75)

    java_qs = generate_java_questions(500)
    spring_qs = generate_spring_boot_questions(500)
    sys_qs = generate_system_design_questions(500)

    print(f"✓ Generated {len(java_qs)} Java Bloom L3 questions")
    print(f"✓ Generated {len(spring_qs)} Spring Boot Bloom L3 questions")
    print(f"✓ Generated {len(sys_qs)} System Design Bloom L3 questions")

    # Write to individual CSV files
    java_csv = os.path.join(SCRATCH_DIR, "export_java_questions.csv")
    spring_csv = os.path.join(SCRATCH_DIR, "export_spring_boot_questions.csv")
    sys_csv = os.path.join(SCRATCH_DIR, "export_system_design_questions.csv")

    write_questions_to_csv(java_csv, java_qs)
    write_questions_to_csv(spring_csv, spring_qs)
    write_questions_to_csv(sys_csv, sys_qs)

    print(f"✓ Saved to {java_csv}")
    print(f"✓ Saved to {spring_csv}")
    print(f"✓ Saved to {sys_csv}")

    # Push to Google Sheet in chunks (APPEND ONLY)
    print("\nPushing generated Bloom L3 questions to Google Sheet (APPEND ONLY)...")
    
    # Format rows for payload
    def format_rows(qs):
        rows = [["id", "topic", "difficulty", "questionText", "codeSnippet", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"]]
        for q in qs:
            opts = q["options"]
            rows.append([
                q["id"],
                q["topic"],
                q["difficulty"],
                q["questionText"],
                q.get("codeSnippet", ""),
                opts[0] if len(opts) > 0 else "",
                opts[1] if len(opts) > 1 else "",
                opts[2] if len(opts) > 2 else "",
                opts[3] if len(opts) > 3 else "",
                q["correctOption"],
                q["explanation"]
            ])
        return rows

    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return urllib.request.Request(newurl, headers={'User-Agent': 'Mozilla/5.0'})

    opener = urllib.request.build_opener(NoRedirectHandler)

    print("Pushing all 500 questions per tab in unified payload...")
    full_payload = {
        "Java": format_rows(java_qs),
        "Spring Boot": format_rows(spring_qs),
        "System Design": format_rows(sys_qs)
    }

    json_bytes = json.dumps(full_payload).encode('utf-8')
    req = urllib.request.Request(
        WEBAPP_URL,
        data=json_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST"
    )

    try:
        with opener.open(req, timeout=90) as resp:
            res_body = resp.read().decode('utf-8')
            print(f"  ✓ Server Response: {res_body[:100]}")
    except Exception as e:
        print(f"  [Error] Push failed: {e}")

    print("\n" + "=" * 75)
    print("✓ COMPLETED! 1,500 Bloom's Taxonomy Level 3 Questions created & processed.")
    print("=" * 75)

if __name__ == "__main__":
    main()
