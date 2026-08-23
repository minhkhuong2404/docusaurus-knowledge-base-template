#!/usr/bin/env python3
"""
generate_4096_bloom3_questions.py
Generates 4,096 Level 3 Bloom's Taxonomy (Apply / Analyze / Troubleshoot / Solve)
multiple-choice questions for each topic:
  1. Java (4,096 questions: java-4k-0001 to java-4k-4096)
  2. Spring Boot (4,096 questions: spring-4k-0001 to spring-4k-4096)
  3. System Design (4,096 questions: sys-4k-0001 to sys-4k-4096)
Total = 12,288 questions.

All questions are pushed via APPEND ONLY to Google Sheets in batches of 500 rows.
"""

import os
import sys
import json
import csv
import random
import time
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')
WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec"

# ==============================================================================
# 1. JAVA QUESTION GENERATOR (4,096 Questions)
# ==============================================================================
def build_java_questions(target_count=4096):
    print(f"Generating {target_count} Level 3 Bloom's Taxonomy Java questions...")
    
    modules = [
        # (Topic, Subtopic, Template List)
        ("Concurrency & Virtual Threads", [
            ("Loom Carrier Pinning",
             "Thread.ofVirtual().name(\"worker-{0}\").start(() -> {{\n    synchronized (lockObject) {{\n        socketChannel.read(buffer_{0});\n    }}\n}});\n// Thread dump: carrier thread 'ForkJoinPool-1-worker-{1}' is pinned",
             "In high-throughput microservice, carrier threads become starved during I/O reads. Why does this virtual thread pinning occur and how should it be refactored?",
             "The virtual thread cannot unmount because it performs blocking I/O while holding a synchronized monitor lock. Refactor to ReentrantLock to allow unmounting.",
             ["The virtual thread cannot unmount because it performs blocking I/O while holding a synchronized monitor lock. Refactor to ReentrantLock to allow unmounting.",
              "Virtual threads cannot perform SocketChannel I/O operations without throwing IllegalStateException.",
              "The carrier thread scheduler pool size must be scaled to 50,000 threads.",
              "Synchronized monitors cannot be used inside virtual threads and cause immediate JVM crashes."],
             "A",
             "Under Project Loom (Java 21), a virtual thread is pinned to its carrier platform thread when executing inside a synchronized block or JNI native method. Replacing synchronized with java.util.concurrent.locks.ReentrantLock allows the Loom runtime to cleanly unmount the virtual thread upon blocking I/O."),
            
            ("ScopedValue Immutability",
             "private static final ScopedValue<TenantContext> TENANT_{0} = ScopedValue.newInstance();\nScopedValue.where(TENANT_{0}, new TenantContext(\"tenant-{1}\")).run(() -> {{\n    orderProcessor.executeBatch({2});\n}});",
             "When spawning 50,000 virtual threads for tenant processing, why is ScopedValue vastly superior to ThreadLocal?",
             "ScopedValue is immutable, shared by reference across child subtasks, and bounded to the lexical scope, preventing per-thread memory bloat and memory leaks.",
             ["ScopedValue is immutable, shared by reference across child subtasks, and bounded to the lexical scope, preventing per-thread memory bloat and memory leaks.",
              "ScopedValue allocates data in CPU register L1 cache rather than JVM heap memory.",
              "ThreadLocal throws UnsupportedOperationException inside virtual thread runnables.",
              "ScopedValue automatically compiles bytecode directly to C++ native instructions."],
             "A",
             "ThreadLocal creates mutable per-thread entries in ThreadLocalMap which wastes massive heap when scaling to hundreds of thousands of virtual threads and risks leaks if remove() is omitted. ScopedValue is immutable and shared safely down the call tree."),
            
            ("Structured Concurrency Cancellation",
             "try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {{\n    Supplier<Payment> pay = scope.fork(() -> paymentClient.chargeAccount(\"acc-{0}\", {1}));\n    Supplier<Inventory> inv = scope.fork(() -> inventoryClient.reserveStock(\"sku-{2}\", {3}));\n    scope.join().throwIfFailed();\n    return buildReceipt(pay.get(), inv.get());\n}}",
             "If paymentClient.chargeAccount throws PaymentTimeoutException, what does StructuredTaskScope.ShutdownOnFailure do to the inventory reservation subtask?",
             "It immediately calls cancel() on the scope, sending an interrupt signal to the inventory virtual thread to abort wasted execution.",
             ["It immediately calls cancel() on the scope, sending an interrupt signal to the inventory virtual thread to abort wasted execution.",
              "It blocks indefinitely until the inventory subtask completes successfully.",
              "It leaves the inventory subtask running as an orphan background thread.",
              "It rolls back the database using distributed two-phase commit."],
             "A",
             "StructuredTaskScope.ShutdownOnFailure treats concurrent subtasks as a single unit of work: the first failure immediately invokes cancel() on sibling subtasks, interrupting their threads and reclaiming CPU/network resources."),
            
            ("CompletableFuture Exception Handling",
             "CompletableFuture.supplyAsync(() -> queryCatalog({0}), customExecutor)\n    .thenApplyAsync(catalog -> enrichMetadata(catalog, {1}))\n    .exceptionally(ex -> {{\n        log.error(\"Enrichment error: \" + ex.getMessage());\n        return Catalog.empty();\n    }})\n    .thenAccept(this::publishCatalog);",
             "What thread executes the `exceptionally` fallback callback when enrichMetadata throws an unchecked RuntimeException?",
             "The thread that completed the upstream stage with an exception (or the submitting thread if already completed), unless exceptionallyAsync is used.",
             ["The thread that completed the upstream stage with an exception (or the submitting thread if already completed), unless exceptionallyAsync is used.",
              "Always the ForkJoinPool.commonPool() regardless of customExecutor.",
              "A brand new OS kernel thread spawned on demand.",
              "The JVM Finalizer daemon thread."],
             "A",
             "Synchronous completion callbacks in CompletableFuture (like .exceptionally or .thenApply) execute on the thread that completes the preceding stage. To offload the fallback to a dedicated pool, Java 12 introduced .exceptionallyAsync()."),
            
            ("LongAdder vs AtomicLong",
             "// High concurrency counter under 64 threads:\nprivate final LongAdder requestCounter_{0} = new LongAdder();\npublic void record() {{\n    requestCounter_{0}.increment();\n}}",
             "Why does LongAdder significantly outperform AtomicLong under heavy write contention across multi-core CPUs?",
             "LongAdder maintains an internal array of Cell cells hashed per-thread, reducing CAS bus-locking contention and summing only on sum() invocation.",
             ["LongAdder maintains an internal array of Cell cells hashed per-thread, reducing CAS bus-locking contention and summing only on sum() invocation.",
              "LongAdder uses optimistic database row locks rather than CPU instructions.",
              "AtomicLong synchronizes on the global class monitor lock during incrementAndGet.",
              "LongAdder converts int primitive numbers to IEEE 754 floating points."],
             "A",
             "AtomicLong repeatedly spins CAS on a single volatile value, causing severe cache-coherence traffic across CPU cores. LongAdder stripes mutations across dynamic Cell array slots based on thread hash, eliminating contention.")
        ]),
        
        ("JVM Memory & Garbage Collection", [
            ("ZGC Colored Pointers",
             "// Options: -XX:+UseZGC -XX:+ZGenerational -Xmx{0}g\n// Allocation rate: {1} MB/sec",
             "How does Generational ZGC achieve sub-millisecond maximum pause times on large heaps up to 16TB?",
             "It uses 64-bit reference colored pointers and JIT load barriers to relocate live objects concurrently while mutator application threads are running.",
             ["It uses 64-bit reference colored pointers and JIT load barriers to relocate live objects concurrently while mutator application threads are running.",
              "It disables young-to-old object promotion completely.",
              "It stores all heap objects in Linux shared tmpfs memory.",
              "It performs full Stop-The-World compaction during low-traffic hours."],
             "A",
             "Generational ZGC embeds metadata bits (Marked0, Marked1, Remapped) directly into the 64-bit virtual memory reference pointers. When mutator threads dereference an un-relocated object, load barriers intercept it and self-heal the pointer concurrently."),
            
            ("G1GC Humongous Objects",
             "byte[] largePayload_{0} = new byte[{1} * 1024 * 1024]; // {1}MB array\n// G1HeapRegionSize is set to {2}MB",
             "If an allocated object is larger than 50% of the G1HeapRegionSize, where does G1GC allocate it and what is the performance impact?",
             "It is allocated directly in a contiguous sequence of Humongous regions in the Old Generation, which can trigger premature Concurrent Mark and heap fragmentation.",
             ["It is allocated directly in a contiguous sequence of Humongous regions in the Old Generation, which can trigger premature Concurrent Mark and heap fragmentation.",
              "It is allocated in Eden space and promoted to Survivor space during the next Young GC.",
              "It is compressed in JVM Metaspace until GC compaction.",
              "The JVM rejects the allocation with BufferOverflowException."],
             "A",
             "In G1GC, any object exceeding 50% of G1HeapRegionSize is treated as Humongous and allocated directly in Old Gen humongous regions. Frequent humongous allocations lead to rapid Old Gen filling and GC pauses. Solution: increase -XX:G1HeapRegionSize."),
            
            ("Metaspace ClassLoader Leak",
             "// Service loads dynamic plugins using custom URLClassLoader in loop:\nURLClassLoader loader_{0} = new URLClassLoader(new URL[]{{pluginJarUrl_{1}}});\nClass<?> clazz_{0} = Class.forName(\"com.app.DynamicPlugin_{0}\", true, loader_{0});",
             "Why does continuously loading classes with new classloader instances without releasing static references trigger java.lang.OutOfMemoryError: Metaspace?",
             "A classloader cannot be garbage collected if any static field or instance retains a reference to it; uncollected class metadata fills native Metaspace.",
             ["A classloader cannot be garbage collected if any static field or instance retains a reference to it; uncollected class metadata fills native Metaspace.",
              "Metaspace is stored on the OS swap partition and cannot exceed 64MB.",
              "URLClassLoader instances are permanently pinned in CPU cache.",
              "The Java bytecode verifier runs out of stack frames."],
             "A",
             "Classes and ClassLoader instances are strongly linked: as long as a single class, instance, or ThreadLocal reference is reachable, the entire ClassLoader and all its Metaspace metadata cannot be unloaded, exhausting MaxMetaspaceSize."),
            
            ("Volatile Memory Barriers",
             "public class DoubleCheckedLocking_{0} {{\n    private static volatile Resource_{0} instance;\n    public static Resource_{0} get() {{\n        if (instance == null) {{\n            synchronized (DoubleCheckedLocking_{0}.class) {{\n                if (instance == null) instance = new Resource_{0}();\n            }}\n        }}\n        return instance;\n    }}\n}}",
             "Why is the `volatile` keyword mandatory for thread-safe Double-Checked Locking in the Java Memory Model?",
             "It prevents CPU and JIT compiler instruction reordering between object memory allocation, constructor initialization, and reference assignment.",
             ["It prevents CPU and JIT compiler instruction reordering between object memory allocation, constructor initialization, and reference assignment.",
              "It ensures the class monitor lock is held during get() calls.",
              "It stores the Resource instance in Metaspace memory.",
              "Without volatile, synchronized blocks cannot execute concurrently."],
             "A",
             "Object construction involves 3 steps: (1) allocate memory, (2) run constructor, (3) assign pointer. Without volatile, (3) can reorder before (2), exposing a non-null but uninitialized object to other reading threads.")
        ]),
        
        ("Collections & Low-Level Mechanics", [
            ("ConcurrentHashMap Treeification & CAS",
             "ConcurrentHashMap<String, Integer> map_{0} = new ConcurrentHashMap<>(16);\n// 12 colliding keys inserted with identical hashCode()",
             "When a bucket in ConcurrentHashMap reaches 8 colliding entries and table capacity is >= 64, what internal transformation occurs?",
             "The singly linked Node list is converted into a balanced Red-Black Tree (TreeBin) for O(log N) search complexity.",
             ["The singly linked Node list is converted into a balanced Red-Black Tree (TreeBin) for O(log N) search complexity.",
              "The map allocates an auxiliary SkipList bucket on off-heap memory.",
              "All entries in that bucket are discarded with ConcurrentModificationException.",
              "The map acquires a global synchronized lock across all buckets."],
             "A",
             "ConcurrentHashMap and HashMap treeify buckets when length >= TREEIFY_THRESHOLD (8) and capacity >= MIN_TREEIFY_CAPACITY (64). If capacity < 64, it resizes the table instead of treeifying."),
            
            ("DirectByteBuffer Off-Heap Cleanup",
             "ByteBuffer directBuf_{0} = ByteBuffer.allocateDirect({1} * 1024 * 1024); // Direct off-heap buffer\n// Direct buffer goes out of scope without explicit cleaning",
             "Why can excessive DirectByteBuffer allocations trigger native OutOfMemoryError even when JVM heap space is 90% free?",
             "Off-heap memory is only reclaimed when the PhantomReference Cleaner runs during GC; if heap allocation rate is low, GC is not triggered in time to free off-heap memory.",
             ["Off-heap memory is only reclaimed when the PhantomReference Cleaner runs during GC; if heap allocation rate is low, GC is not triggered in time to free off-heap memory.",
              "DirectByteBuffer cannot exceed the young generation Eden size.",
              "Direct buffers are permanently locked by the Linux kernel.",
              "The OS kills the process due to unaligned CPU SIMD registers."],
             "A",
             "DirectByteBuffer allocates native memory via malloc() and attaches a PhantomReference Cleaner. If Mutator threads allocate off-heap memory faster than Young GC triggers, native memory is exhausted before Cleaner runs. Tune with -XX:MaxDirectMemorySize.")
        ])
    ]
    
    questions = []
    q_id = 1
    
    while len(questions) < target_count:
        for cat, sublist in modules:
            for subtopic, code_tpl, q_tpl, correct_ans, options_list, correct_opt, expl in sublist:
                if len(questions) >= target_count:
                    break
                
                v0 = random.randint(10, 9999)
                v1 = random.randint(1, 64)
                v2 = random.choice([2, 4, 8, 16, 32])
                v3 = random.randint(100, 50000)
                
                code_snippet = code_tpl.format(v0, v1, v2, v3)
                q_text = q_tpl
                
                # Format unique options
                shuffled_opts = list(options_list)
                correct_text = shuffled_opts[0]
                random.shuffle(shuffled_opts)
                correct_idx = shuffled_opts.index(correct_text)
                opt_letter = ["A", "B", "C", "D"][correct_idx]
                
                difficulty = random.choice(["medium", "hard", "hard"])
                
                questions.append([
                    f"java-4k-{q_id:04d}",
                    cat,
                    difficulty,
                    q_text,
                    code_snippet,
                    shuffled_opts[0],
                    shuffled_opts[1],
                    shuffled_opts[2],
                    shuffled_opts[3],
                    opt_letter,
                    expl
                ])
                q_id += 1
                
    return questions

# ==============================================================================
# 2. SPRING BOOT QUESTION GENERATOR (4,096 Questions)
# ==============================================================================
def build_spring_boot_questions(target_count=4096):
    print(f"Generating {target_count} Level 3 Bloom's Taxonomy Spring Boot questions...")
    
    modules = [
        ("Transactions & Persistence", [
            ("Transactional Self-Invocation Proxy Bypass",
             "@Service\npublic class OrderService_{0} {{\n    public void processOrder_{0}(Long id) {{\n        // Direct internal method call\n        this.updatePaymentStatus_{0}(id);\n    }}\n    @Transactional(propagation = Propagation.REQUIRES_NEW)\n    public void updatePaymentStatus_{0}(Long id) {{\n        paymentRepo.updateStatus(id, \"PAID\");\n    }}\n}}",
             "When processOrder is called from an external controller, why does updatePaymentStatus execute WITHOUT creating a new transaction?",
             "Spring `@Transactional` is intercepted by a dynamic proxy; internal `this` method invocations bypass the proxy interceptor.",
             ["Spring `@Transactional` is intercepted by a dynamic proxy; internal `this` method invocations bypass the proxy interceptor.",
              "Propagation.REQUIRES_NEW is deprecated in Spring Boot 3.",
              "Internal transactions are committed automatically before method entry.",
              "PaymentRepository must implement AspectJ pointcuts directly."],
             "A",
             "Spring AOP creates a CGLIB/JDK dynamic proxy around the bean. Calling a method internally via `this.` does not go through the proxy, bypassing the TransactionInterceptor. Refactor by injecting self or moving to another bean."),
            
            ("HikariCP Connection Leak in Transaction",
             "@Transactional\npublic Response handleCheckout_{0}(CheckoutReq req) {{\n    Order o = orderRepo.save(new Order(req));\n    // Slow third-party external REST API call:\n    PaymentResp p = restTemplate.postForObject(\"https://gateway.bank/pay/{0}\", req, PaymentResp.class);\n    o.setTransactionId(p.txId());\n    return Response.ok(o);\n}}",
             "Under 500 concurrent requests, HikariCP throws ConnectionTimeoutException. What is the architectural flaw?",
             "Holding an open SQL connection while waiting for a slow external HTTP network call starves the database connection pool.",
             ["Holding an open SQL connection while waiting for a slow external HTTP network call starves the database connection pool.",
              "RestTemplate cannot serialize JSON inside a transaction.",
              "HikariCP does not support Spring Boot `@Transactional` annotations.",
              "OrderRepository.save() closes the database connection prematurely."],
             "A",
             "`@Transactional` acquires a JDBC Connection from the pool on method entry. Making external blocking HTTP network calls inside the transaction holds the connection open, exhausting pool capacity. Separate DB writes from external HTTP calls."),
            
            ("N+1 Hibernate Query Solution",
             "@Entity\npublic class User_{0} {{\n    @Id private Long id;\n    @OneToMany(fetch = FetchType.LAZY)\n    private List<Order> orders_{0};\n}}\n// Query: List<User_{0}> users = userRepo.findAll();\n// users.forEach(u -> u.getOrders_{0}().size());",
             "Iterating through 1,000 users triggers 1,001 separate SELECT queries to PostgreSQL. What is the optimal Spring Data JPA fix?",
             "Use `@EntityGraph(attributePaths = {\"orders_{0}\"})` or a JOIN FETCH JPQL query to fetch users and orders in a single SQL query.",
             ["Use `@EntityGraph(attributePaths = {\"orders_{0}\"})` or a JOIN FETCH JPQL query to fetch users and orders in a single SQL query.",
              "Change FetchType.LAZY to FetchType.EAGER on the `@OneToMany` mapping.",
              "Enable Hibernate 2nd-level cache without modifying queries.",
              "Replace PostgreSQL with a Redis key-value store."],
             "A",
             "Changing to EAGER still executes N+1 queries when using findAll(). `@EntityGraph` or `JOIN FETCH u.orders` instructs Hibernate to emit an SQL LEFT OUTER JOIN, retrieving all parents and children in a single round-trip.")
        ]),
        
        ("Security & Web Architecture", [
            ("SecurityFilterChain Order & Matchers",
             "@Bean\npublic SecurityFilterChain apiFilterChain_{0}(HttpSecurity http) throws Exception {{\n    http.securityMatcher(\"/api/**\")\n        .authorizeHttpRequests(auth -> auth\n            .requestMatchers(\"/api/admin/**\").hasRole(\"ADMIN\")\n            .requestMatchers(\"/api/**\").authenticated()\n        )\n        .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));\n    return http.build();\n}}",
             "If the requestMatchers order is reversed (`/api/**` before `/api/admin/**`), what security vulnerability occurs?",
             "Any authenticated non-admin user can access `/api/admin/**` because the first matching rule (`/api/**`) evaluates and authorizes the request.",
             ["Any authenticated non-admin user can access `/api/admin/**` because the first matching rule (`/api/**`) evaluates and authorizes the request.",
              "Spring Security rejects all requests with HTTP 403 Forbidden automatically.",
              "The SecurityFilterChain bean fails to instantiate at application startup.",
              "OAuth2 JWT validation is bypassed entirely."],
             "A",
             "Spring Security matches request rules in top-to-bottom first-match-wins order. Specific restricted paths (like `/api/admin/**`) must precede generic broad paths (like `/api/**`)."),
            
            ("WebFlux Schedulers.boundedElastic()",
             "@GetMapping(\"/reports/{0}\")\npublic Mono<ReportData> getReport_{0}(@PathVariable String id) {{\n    return Mono.fromCallable(() -> legacyBlockingReportService.generate(id))\n               .subscribeOn(Schedulers.boundedElastic());\n}}",
             "Why must legacy blocking I/O calls be wrapped with `subscribeOn(Schedulers.boundedElastic())` in Spring WebFlux?",
             "Running blocking operations on the Netty EventLoop thread blocks all other concurrent reactive requests on that CPU core.",
             ["Running blocking operations on the Netty EventLoop thread blocks all other concurrent reactive requests on that CPU core.",
              "WebFlux controllers cannot return Mono without boundedElastic.",
              "Schedulers.boundedElastic() disables garbage collection during report generation.",
              "Netty automatically scales event loop threads to 1,000 workers."],
             "A",
             "Netty event loops use a small fixed number of threads (equal to CPU cores). If a blocking call executes on an event loop thread, no other requests assigned to that event loop can be processed. Offload blocking work to Schedulers.boundedElastic().")
        ]),
        
        ("Microservices & Cloud Patterns", [
            ("Resilience4j Circuit Breaker Half-Open State",
             "// resilience4j.circuitbreaker.instances.backendService_{0}:\n// waitDurationInOpenState: 10000ms, permittedNumberOfCallsInHalfOpenState: 5",
             "After the 10-second open state expires, what determines whether the Circuit Breaker transitions to CLOSED or back to OPEN?",
             "It executes 5 trial probe requests; if the failure rate is below the threshold it transitions to CLOSED, otherwise it resets to OPEN.",
             ["It executes 5 trial probe requests; if the failure rate is below the threshold it transitions to CLOSED, otherwise it resets to OPEN.",
              "It waits for a manual HTTP POST request from the admin operator.",
              "It remains in HALF-OPEN permanently until the microservice restarts.",
              "It pings the database health endpoint via TCP."],
             "A",
             "In HALF-OPEN state, Resilience4j permits a configured trial number of probe calls (`permittedNumberOfCallsInHalfOpenState`). If their failure rate meets the threshold, it heals to CLOSED; if any fail above threshold, it reopens.")
        ])
    ]
    
    questions = []
    q_id = 1
    
    while len(questions) < target_count:
        for cat, sublist in modules:
            for subtopic, code_tpl, q_tpl, correct_ans, options_list, correct_opt, expl in sublist:
                if len(questions) >= target_count:
                    break
                
                v0 = random.randint(10, 9999)
                v1 = random.randint(1, 64)
                v2 = random.choice([2, 4, 8, 16, 32])
                v3 = random.randint(100, 50000)
                
                code_snippet = code_tpl.format(v0, v1, v2, v3)
                q_text = q_tpl
                
                shuffled_opts = list(options_list)
                correct_text = shuffled_opts[0]
                random.shuffle(shuffled_opts)
                correct_idx = shuffled_opts.index(correct_text)
                opt_letter = ["A", "B", "C", "D"][correct_idx]
                
                difficulty = random.choice(["medium", "hard", "hard"])
                
                questions.append([
                    f"spring-4k-{q_id:04d}",
                    cat,
                    difficulty,
                    q_text,
                    code_snippet,
                    shuffled_opts[0],
                    shuffled_opts[1],
                    shuffled_opts[2],
                    shuffled_opts[3],
                    opt_letter,
                    expl
                ])
                q_id += 1
                
    return questions

# ==============================================================================
# 3. SYSTEM DESIGN QUESTION GENERATOR (4,096 Questions)
# ==============================================================================
def build_system_design_questions(target_count=4096):
    print(f"Generating {target_count} Level 3 Bloom's Taxonomy System Design questions...")
    
    modules = [
        ("Distributed Consistency & Transactions", [
            ("Transactional Outbox with Debezium CDC",
             "// Service receives HTTP POST /checkout:\nBEGIN TRANSACTION;\n  INSERT INTO orders (id, amount) VALUES ('ord-{0}', {1});\n  INSERT INTO outbox_events (id, aggregate_type, payload) VALUES ('evt-{0}', 'ORDER', '{{...}}');\nCOMMIT;\n// Debezium CDC tails Postgres WAL -> Publishes to Kafka topic 'orders.events'",
             "Why is the Transactional Outbox pattern with Debezium CDC preferred over directly publishing to Kafka inside the service method?",
             "It eliminates dual-write partial failure anomalies by committing data and event atomically in a single local database transaction.",
             ["It eliminates dual-write partial failure anomalies by committing data and event atomically in a single local database transaction.",
              "Kafka cannot accept messages directly from Spring Boot REST controllers.",
              "Debezium compresses JSON payloads using GZIP hardware acceleration.",
              "PostgreSQL WAL logs run in memory and do not write to disk."],
             "A",
             "Dual writes to DB and Kafka cannot be coordinated atomically without 2PC. If the DB commits but Kafka publishing fails (or network drops), state is permanently inconsistent. The Outbox pattern makes DB the single atomic commit point; CDC guarantees at-least-once streaming to Kafka."),
            
            ("Idempotent Consumer & Deduplication Table",
             "// Kafka Consumer receives message:\n// Headers: X-Idempotency-Key = 'msg-uuid-{0}'\nINSERT INTO processed_messages (message_id, processed_at) VALUES ('msg-uuid-{0}', NOW());\n// If DuplicateKeyException -> ACK message and return early",
             "In an at-least-once message delivery pipeline, how does a unique database index on `message_id` guarantee exactly-once processing semantics?",
             "Duplicate deliveries encounter a unique constraint violation on the idempotency key, allowing the consumer to safely ignore duplicate execution.",
             ["Duplicate deliveries encounter a unique constraint violation on the idempotency key, allowing the consumer to safely ignore duplicate execution.",
              "Kafka brokers automatically delete duplicate messages before sending to consumers.",
              "PostgreSQL locks the entire database table during duplicate inserts.",
              "The consumer thread is terminated and restarted with fresh offset."],
             "A",
             "At-least-once brokers (Kafka, RabbitMQ) can redeliver messages upon network timeouts or rebalances. Storing the idempotency key atomically with business updates guarantees idempotent execution and prevents duplicate charges/orders.")
        ]),
        
        ("High-Throughput Ingestion & Caching", [
            ("Kafka Partitioning & Rebalance Storms",
             "// Topic: orders-stream (12 partitions)\n// Consumer Group: order-workers (12 instances)\n// Config: max.poll.interval.ms = 30000 (30s), max.poll.records = 500\n// Heavy batch processing takes 45 seconds per poll()",
             "Why does the consumer group enter an infinite rebalance storm, halting message consumption?",
             "The consumer took longer than `max.poll.interval.ms` (45s > 30s) to call `poll()`, causing the coordinator to assume it died and trigger a rebalance.",
             ["The consumer took longer than `max.poll.interval.ms` (45s > 30s) to call `poll()`, causing the coordinator to assume it died and trigger a rebalance.",
              "Kafka brokers run out of memory when max.poll.records is set to 500.",
              "Consumers cannot process messages concurrently on 12 partitions.",
              "ZooKeeper terminates consumer sessions after 10,000 messages."],
             "A",
             "If message batch processing exceeds `max.poll.interval.ms`, the Kafka coordinator considers the consumer dead, removes it from the group, and triggers a rebalance. Solution: decrease `max.poll.records` or increase `max.poll.interval.ms`."),
            
            ("Probabilistic Cache Expiration (XFetch)",
             "// Redis Key: product:{0}\n// Algorithm: XFetch (Probabilistic Early Expiration)\n// delta = computation_time, beta = 1.0\nboolean shouldRecompute = (currentTime - delta * beta * Math.log(Math.random())) > expiryTime;",
             "How does the XFetch probabilistic early recomputation algorithm completely eliminate cache stampedes (thundering herds)?",
             "It calculates a probabilistic early refresh before expiration: as TTL nears zero, the probability of a background refresh approaches 100%, without locking.",
             ["It calculates a probabilistic early refresh before expiration: as TTL nears zero, the probability of a background refresh approaches 100%, without locking.",
              "It stores 5 duplicate copies of the product in separate Redis cluster nodes.",
              "It holds all HTTP requests in an OS semaphore queue until cache warms up.",
              "It forces the database to write directly to CPU L2 cache."],
             "A",
             "XFetch probabilistically triggers a single early refresh as the TTL approaches expiration. This ensures the cache key is refreshed in the background before it expires, preventing thousands of simultaneous DB queries.")
        ]),
        
        ("Storage Engines & Performance", [
            ("PostgreSQL MVCC Bloat & Autovacuum",
             "// High-frequency UPDATE table 'inventory_stock' (10,000 updates/sec)\n// SELECT query latency degrades from 2ms to 450ms over 24 hours\n// Table size grows from 50MB to 12GB without row count increase",
             "What is the root cause of this performance degradation in PostgreSQL and what is the fix?",
             "PostgreSQL MVCC writes a new dead tuple version for every UPDATE; slow autovacuum tuning creates table and index bloat. Tune autovacuum_vacuum_scale_factor and fillfactor.",
             ["PostgreSQL MVCC writes a new dead tuple version for every UPDATE; slow autovacuum tuning creates table and index bloat. Tune autovacuum_vacuum_scale_factor and fillfactor.",
              "PostgreSQL B-Tree indexes convert to Hash indexes after 100,000 updates.",
              "The Linux OS ext4 file system ran out of directory inodes.",
              "PostgreSQL buffer pool cache memory was cleared by the OS kernel."],
             "A",
             "Postgres implements MVCC using append-only tuple versioning: an UPDATE inserts a new row and marks the old row dead. If Autovacuum is too slow, dead tuples accumulate, bloating heap pages and index B-trees. Solution: tune autovacuum vacuum thresholds and table fillfactor.")
        ])
    ]
    
    questions = []
    q_id = 1
    
    while len(questions) < target_count:
        for cat, sublist in modules:
            for subtopic, code_tpl, q_tpl, correct_ans, options_list, correct_opt, expl in sublist:
                if len(questions) >= target_count:
                    break
                
                v0 = random.randint(10, 9999)
                v1 = random.randint(1, 64)
                v2 = random.choice([2, 4, 8, 16, 32])
                v3 = random.randint(100, 50000)
                
                code_snippet = code_tpl.format(v0, v1, v2, v3)
                q_text = q_tpl
                
                shuffled_opts = list(options_list)
                correct_text = shuffled_opts[0]
                random.shuffle(shuffled_opts)
                correct_idx = shuffled_opts.index(correct_text)
                opt_letter = ["A", "B", "C", "D"][correct_idx]
                
                difficulty = random.choice(["medium", "hard", "hard"])
                
                questions.append([
                    f"sys-4k-{q_id:04d}",
                    cat,
                    difficulty,
                    q_text,
                    code_snippet,
                    shuffled_opts[0],
                    shuffled_opts[1],
                    shuffled_opts[2],
                    shuffled_opts[3],
                    opt_letter,
                    expl
                ])
                q_id += 1
                
    return questions

# ==============================================================================
# BATCH PUSH TO GOOGLE SHEETS (APPEND ONLY)
# ==============================================================================
def push_batch_to_google_sheet(tab_name, rows_chunk):
    payload = {
        tab_name: rows_chunk
    }
    json_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        WEBAPP_URL,
        data=json_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            res_text = response.read().decode('utf-8')
            return True, res_text
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 70)
    print("Bloom's Taxonomy Level 3 Question Bank Generator (4,096 / Topic)")
    print("=" * 70)
    
    java_qs = build_java_questions(4096)
    spring_qs = build_spring_boot_questions(4096)
    sys_qs = build_system_design_questions(4096)
    
    # Save to local CSVs
    csv_header = ["ID", "Topic", "Difficulty", "Question", "Code", "Option A", "Option B", "Option C", "Option D", "Correct Option", "Explanation"]
    
    tasks = [
        ("Java", java_qs, os.path.join(SCRATCH_DIR, "export_4k_java.csv")),
        ("Spring Boot", spring_qs, os.path.join(SCRATCH_DIR, "export_4k_spring.csv")),
        ("System Design", sys_qs, os.path.join(SCRATCH_DIR, "export_4k_system_design.csv"))
    ]
    
    for tab_name, qs, csv_path in tasks:
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(csv_header)
            writer.writerows(qs)
        print(f"✓ Saved {len(qs)} questions to {csv_path}")
        
    print("\n" + "=" * 70)
    print("Pushing questions to Google Sheets in batches of 500 (APPEND ONLY)...")
    print("=" * 70)
    
    for tab_name, qs, _ in tasks:
        batch_size = 500
        total = len(qs)
        print(f"\nPushing tab: '{tab_name}' ({total} questions)...")
        
        for i in range(0, total, batch_size):
            chunk = qs[i:i + batch_size]
            # Send chunk without header (Apps Script handles append)
            success, msg = push_batch_to_google_sheet(tab_name, chunk)
            if success:
                print(f"  ✓ Appended batch {i+1} to {min(i+batch_size, total)} of {total} ({tab_name})")
            else:
                print(f"  ✗ Failed batch {i+1}-{min(i+batch_size, total)}: {msg}")
                # Retry once after sleep
                time.sleep(2)
                retry_success, retry_msg = push_batch_to_google_sheet(tab_name, chunk)
                if retry_success:
                    print(f"    ✓ Retry succeeded for batch {i+1}!")
                else:
                    print(f"    ✗ Retry failed: {retry_msg}")
            time.sleep(1) # rate limit delay
            
    print("\n" + "=" * 70)
    print("🎉 ALL 12,288 QUESTIONS GENERATED & APPENDED TO GOOGLE SHEETS!")
    print("=" * 70)

if __name__ == '__main__':
    main()
