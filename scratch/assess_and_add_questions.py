#!/usr/bin/env python3
"""
assess_and_add_questions.py
Assesses the Google Sheet quiz bank, generates high-yield senior engineering questions
(covering Java 21 Virtual Threads, Spring Boot 3.3 Observability/AOT, Distributed Consensus, etc.),
and pushes them directly to the Google Sheet via the Apps Script WebApp endpoint.
"""

import os
import sys
import json
import urllib.request

WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec"

# ==============================================================================
# 1. High-Yield Senior Java Questions (Java 21, Concurrency, JVM Internals)
# ==============================================================================
NEW_JAVA_QUESTIONS = [
    {
        "id": "java-quiz-adv-1",
        "topic": "Virtual Threads (Project Loom)",
        "difficulty": "hard",
        "questionText": "When executing a blocking I/O operation inside a Virtual Thread in Java 21, in which scenario does thread 'pinning' occur, preventing the carrier thread from being unmounted?",
        "codeSnippet": "// Scenario: Executing blocking database call\nThread.ofVirtual().start(() -> {\n    synchronized (lockObject) {\n        // Blocking JDBC call inside synchronized block\n        dataSource.getConnection().prepareStatement(sql).executeQuery();\n    }\n});",
        "options": [
            "Pinning occurs when blocking I/O is executed inside a synchronized block/method or native call, locking the carrier platform thread.",
            "Pinning occurs only when thread priority is set higher than Thread.NORM_PRIORITY.",
            "Pinning occurs whenever a virtual thread accesses a volatile variable.",
            "Virtual threads never get pinned because the JVM automatically translates synchronized blocks to ReentrantLock."
        ],
        "correctOption": "A",
        "explanation": "In Java 21, a virtual thread is pinned to its carrier thread if it performs a blocking operation while holding a monitor lock (inside a synchronized block/method) or inside a native frame (JNI). To prevent carrier thread starvation, synchronized blocks around blocking I/O should be refactored to use java.util.concurrent.locks.ReentrantLock."
    },
    {
        "id": "java-quiz-adv-2",
        "topic": "Sequenced Collections (Java 21)",
        "difficulty": "medium",
        "questionText": "Java 21 introduced the SequencedCollection and SequencedMap interfaces (JEP 431). Which operation is guaranteed to execute in O(1) time on a SequencedCollection backed by an ArrayDeque?",
        "codeSnippet": "SequencedCollection<String> seq = new ArrayDeque<>();\nseq.addFirst(\"Alpha\");\nseq.addLast(\"Omega\");\nString first = seq.getFirst();\nString last = seq.getLast();\nSequencedCollection<String> reversed = seq.reversed();",
        "options": [
            "All operations: addFirst(), addLast(), getFirst(), getLast(), and reversed() view creation execute in O(1) time.",
            "reversed() creates a complete deep copy of the collection taking O(N) time.",
            "getFirst() takes O(N) because ArrayDeque requires linear traversal from the head.",
            "SequencedCollection does not support bidirectional element retrieval."
        ],
        "correctOption": "A",
        "explanation": "JEP 431 defines uniform methods for ordered collections. For ArrayDeque, head/tail additions and retrievals are O(1), and reversed() returns a lightweight reverse-ordered view of the collection in O(1) without copying elements."
    },
    {
        "id": "java-quiz-adv-3",
        "topic": "JVM & Memory Model (JMM)",
        "difficulty": "hard",
        "questionText": "Under the Java Memory Model (JMM), which CPU memory barrier is emitted immediately after a volatile write to prevent subsequent normal or volatile reads/writes from being reordered before the write?",
        "codeSnippet": "public class VolatileState {\n    private volatile int state = 1;\n    private int data = 42;\n    public void publish() {\n        data = 100;     // Normal write\n        state = 2;      // Volatile write (Release Barrier)\n    }\n}",
        "options": [
            "StoreLoad barrier (or StoreStore before and StoreLoad after the volatile write).",
            "LoadLoad barrier only.",
            "No barrier is emitted on x86 architectures because volatile writes are no-ops at the hardware level.",
            "A software mutex lock is acquired on the CPU core."
        ],
        "correctOption": "A",
        "explanation": "A volatile write acts as a Release barrier. JMM requires a StoreStore barrier before the write (to ensure prior normal writes like data=100 are committed) and a StoreLoad barrier after the volatile write to prevent subsequent reads/writes from moving above it."
    },
    {
        "id": "java-quiz-adv-4",
        "topic": "Garbage Collection & ZGC",
        "difficulty": "hard",
        "questionText": "How does Generational ZGC in Java 21 achieve sub-millisecond maximum GC pause times even on multi-terabyte heaps?",
        "codeSnippet": "// JVM Flags: -XX:+UseZGC -XX:+ZGenerational\n// Heap size: 64GB, Allocation rate: 5GB/sec",
        "options": [
            "By performing concurrent marking, concurrent evacuation, and using load barriers with colored pointers across young and old generations.",
            "By pausing all application worker threads (STW) during the entire compaction phase.",
            "By disabling object promotion and allocating all objects directly into off-heap memory.",
            "By executing only reference counting without tracking object graph reachability."
        ],
        "correctOption": "A",
        "explanation": "Generational ZGC splits the heap into young and old generations while executing almost all phases (mark, evacuate, reference processing) concurrently with mutator threads using colored pointers and read/load barriers, keeping STW pauses consistently under 1 millisecond."
    },
    {
        "id": "java-quiz-adv-5",
        "topic": "Scoped Values (Project Loom)",
        "difficulty": "medium",
        "questionText": "Why are Scoped Values (ScopedValue<T>) preferred over ThreadLocal<T> when working with millions of Virtual Threads in modern Java?",
        "codeSnippet": "private static final ScopedValue<UserContext> CURRENT_USER = ScopedValue.newInstance();\n\npublic void handleRequest(UserContext context) {\n    ScopedValue.where(CURRENT_USER, context).run(() -> {\n        processOrder();\n    });\n}",
        "options": [
            "Scoped Values are immutable per invocation scope, bounded in lifetime, and share memory efficiently across child tasks without memory leaks.",
            "ThreadLocal requires external native C libraries to function inside virtual threads.",
            "Scoped Values allow mutator threads to modify context from any arbitrary thread.",
            "Scoped Values allocate on the operating system kernel stack rather than JVM heap."
        ],
        "correctOption": "A",
        "explanation": "ThreadLocal creates mutable per-thread copies which lead to massive memory footprint and memory leaks when millions of virtual threads inherit thread-locals. ScopedValue is immutable, bounded by a lexical execution block, and allows child virtual threads in Structured Concurrency to share the single instance by reference without copying."
    }
]

# ==============================================================================
# 2. High-Yield Senior Spring Boot Questions (Spring Boot 3.3, AOP, Actuator)
# ==============================================================================
NEW_SPRING_BOOT_QUESTIONS = [
    {
        "id": "spring-quiz-adv-1",
        "topic": "Spring Boot 3.3 HTTP Clients",
        "difficulty": "medium",
        "questionText": "In Spring Boot 3.2+, what is the recommended synchronous HTTP client that provides a modern, fluent API without requiring Project Reactor / WebFlux dependencies?",
        "codeSnippet": "@Configuration\npublic class ClientConfig {\n    @Bean\n    public RestClient paymentRestClient(RestClient.Builder builder) {\n        return builder\n            .baseUrl(\"https://api.payment.internal\")\n            .defaultHeader(\"Accept\", \"application/json\")\n            .build();\n    }\n}",
        "options": [
            "RestClient (fluent synchronous HTTP client built on HttpMessageConverters).",
            "RestTemplate in legacy maintenance mode.",
            "WebClient from spring-boot-starter-webflux.",
            "HttpURLConnection."
        ],
        "correctOption": "A",
        "explanation": "Spring Framework 6.1 and Spring Boot 3.2 introduced RestClient as the modern synchronous HTTP client offering the same fluent API design as WebClient without requiring reactive WebFlux dependencies, replacing RestTemplate for new development."
    },
    {
        "id": "spring-quiz-adv-2",
        "topic": "Spring AOP & Proxy Internals",
        "difficulty": "hard",
        "questionText": "A service bean executes method internalProcess() with @Async. When called from another method processBatch() in the SAME class, why does the method execute synchronously on the caller thread instead of the task pool?",
        "codeSnippet": "@Service\npublic class BatchService {\n    public void processBatch() {\n        // Self-invocation inside same instance\n        internalProcess();\n    }\n    \n    @Async\n    public void internalProcess() {\n        // Expected to run asynchronously\n    }\n}",
        "options": [
            "Self-invocation calls this.internalProcess() directly on the target instance, bypassing the Spring AOP interceptor proxy.",
            "@Async only works on @Controller beans, not @Service beans.",
            "Spring Boot disables asynchronous execution unless Tomcat thread pool is maxed out.",
            "The JVM JIT compiler automatically inlines all @Async methods."
        ],
        "correctOption": "A",
        "explanation": "Spring AOP uses dynamic proxies (CGLIB or JDK dynamic proxies). When a method calls another method within the same class (this.method()), the call bypasses the outer proxy wrapper and its interceptor chain. To fix, self-inject the proxy bean, use AspectJ compile-time weaving, or refactor to a separate service bean."
    },
    {
        "id": "spring-quiz-adv-3",
        "topic": "Spring Transaction Management",
        "difficulty": "hard",
        "questionText": "Under default Spring @Transactional configuration, which exception type causes the transaction manager to trigger a ROLLBACK?",
        "codeSnippet": "@Transactional\npublic void executeTransfer(Account from, Account to, BigDecimal amount) throws InsufficientFundsException {\n    accountRepo.debit(from, amount);\n    accountRepo.credit(to, amount);\n    if (hasFailed()) {\n        throw new InsufficientFundsException(\"Failed\"); // Checked exception\n    }\n}",
        "options": [
            "Unchecked exceptions (subclasses of RuntimeException and Error) only, unless rollbackFor is explicitly configured.",
            "All exceptions including checked exceptions (Exception.class).",
            "Checked exceptions only; RuntimeExceptions are committed silently.",
            "NullPointerException only."
        ],
        "correctOption": "A",
        "explanation": "By default in Spring Declarative Transaction Management, transactions are only rolled back on unchecked exceptions (RuntimeException and Error). Checked exceptions (subclasses of java.lang.Exception) will NOT trigger a rollback unless explicitly declared with @Transactional(rollbackFor = Exception.class)."
    },
    {
        "id": "spring-quiz-adv-4",
        "topic": "Spring Boot Virtual Threads",
        "difficulty": "medium",
        "questionText": "When you enable spring.threads.virtual.enabled=true in Spring Boot 3.2+, what underlying architectural shift occurs in the embedded Tomcat web server?",
        "codeSnippet": "# application.properties\nspring.threads.virtual.enabled=true",
        "options": [
            "Tomcat assigns each incoming HTTP request to a newly spawned Virtual Thread rather than pulling from a fixed-size platform thread pool.",
            "Tomcat switches the protocol from HTTP/1.1 to WebSocket automatically.",
            "All database queries are automatically transformed into non-blocking WebFlux reactive streams.",
            "Tomcat replaces the HikariCP connection pool with an in-memory queue."
        ],
        "correctOption": "A",
        "explanation": "With spring.threads.virtual.enabled=true, Spring Boot configures Tomcat's protocol handler and TaskExecutor to use Executors.newVirtualThreadPerTaskExecutor(). Each incoming HTTP request runs on a dedicated virtual thread, eliminating thread pool exhaustion during blocking I/O."
    },
    {
        "id": "spring-quiz-adv-5",
        "topic": "Spring Security & FAPI",
        "difficulty": "hard",
        "questionText": "In Spring Security OAuth2 Resource Server, what is the role of the JwtAuthenticationConverter when validating signed JSON Web Tokens?",
        "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.oauth2ResourceServer(oauth2 -> oauth2\n        .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtConverter()))\n    );\n    return http.build();\n}",
        "options": [
            "It extracts custom claims (e.g. roles, permissions, scopes) from the verified JWT payload and maps them to GrantedAuthority objects on the SecurityContext.",
            "It decrypts TLS socket traffic before the network card receives it.",
            "It automatically generates RSA public/private key pairs on every HTTP request.",
            "It invalidates the user session in Redis after 5 minutes."
        ],
        "correctOption": "A",
        "explanation": "The JwtAuthenticationConverter extracts claim sets (such as 'roles', 'realm_access', or 'scp') from the decoded JWT and converts them into a collection of Spring Security GrantedAuthority objects (like ROLE_ADMIN), populating the authenticated AbstractAuthenticationToken in the SecurityContext."
    }
]

# ==============================================================================
# 3. High-Yield Senior System Design Questions (Distributed Consensus, Caching)
# ==============================================================================
NEW_SYSTEM_DESIGN_QUESTIONS = [
    {
        "id": "sys-quiz-adv-1",
        "topic": "Distributed Consensus (Raft)",
        "difficulty": "hard",
        "questionText": "In the Raft consensus algorithm, how does a candidate node ensure it wins a leader election and what quorum is required in a cluster of 5 nodes?",
        "codeSnippet": "// Cluster size N = 5\n// Node 1 receives votes from Node 2 and Node 3 during Election Term 4\n// Total votes = 3 (including itself)",
        "options": [
            "The candidate must receive votes from a strict majority quorum (N/2 + 1 = 3 nodes) whose logs are at least as up-to-date as the candidate's log.",
            "The candidate only requires 1 vote from any healthy broker.",
            "All 5 nodes must vote unanimously for the election to succeed.",
            "The candidate node with the highest CPU clock frequency automatically becomes leader."
        ],
        "correctOption": "A",
        "explanation": "Raft requires a strict majority quorum: floor(N/2) + 1. For a 5-node cluster, 3 votes are required. Furthermore, the Election Safety invariant ensures a follower only grants its vote if the candidate's log is at least as up-to-date as the follower's own log (higher term, or same term with longer index)."
    },
    {
        "id": "sys-quiz-adv-2",
        "topic": "Distributed Caching (Cache Stampede)",
        "difficulty": "hard",
        "questionText": "When a hot cache key expires under high read concurrency (e.g. 100,000 QPS), thousands of requests hit the database simultaneously (Cache Stampede / Thundering Herd). Which algorithm provides probabilistic early cache refreshing to eliminate stampedes?",
        "codeSnippet": "// Probabilistic Early Expiration (XFetch Algorithm)\n// delta = computation time, beta = aggressiveness factor (> 0)\n// ttl = remaining time to live\nboolean shouldRefresh(long ttl, long delta, double beta) {\n    return ( -1.0 * delta * beta * Math.log(Math.random()) ) >= ttl;\n}",
        "options": [
            "XFetch / Optimal Probabilistic Early Expiration algorithm.",
            "Round Robin DNS caching.",
            "Consistent Hashing without virtual nodes.",
            "Least Frequently Used (LFU) evictions."
        ],
        "correctOption": "A",
        "explanation": "The XFetch algorithm (developed by Vattani et al.) computes an optimal probabilistic early expiration threshold based on computation time (delta) and remaining TTL. As TTL approaches zero, the probability of a background reader recomputing the cache item increases to 1.0, ensuring the cache is refreshed before actual expiration without thundering herds."
    },
    {
        "id": "sys-quiz-adv-3",
        "topic": "Distributed Transactions (Transactional Outbox)",
        "difficulty": "hard",
        "questionText": "Why is the Transactional Outbox Pattern combined with Change Data Capture (CDC / Debezium) superior to Dual-Writes (writing to DB then calling Kafka.send())?",
        "codeSnippet": "// Problem with Dual Write:\norderRepository.save(order);    // DB Commit succeeds\nkafkaTemplate.send(\"orders\", event); // Network error / JVM crash -> Kafka message lost -> State Inconsistency!",
        "options": [
            "It eliminates partial failures by saving the business entity and outbox event atomically in a single local ACID database transaction, with CDC streaming changes to Kafka.",
            "It avoids writing to database transaction logs completely.",
            "It guarantees that network latency between the app and Kafka becomes zero.",
            "It converts asynchronous Kafka topics into synchronous REST endpoints."
        ],
        "correctOption": "A",
        "explanation": "Dual writes suffer from dual-write hazard: if the database write succeeds but the Kafka publish fails (or app crashes), the system enters an inconsistent state. The Transactional Outbox pattern writes the event to an 'outbox' table in the SAME database transaction. Debezium reads the database WAL log and publishes to Kafka with at-least-once delivery."
    },
    {
        "id": "sys-quiz-adv-4",
        "topic": "Distributed Rate Limiting",
        "difficulty": "hard",
        "questionText": "Why must distributed Token Bucket rate limiting in Redis be executed using a Lua script rather than separate GET and SET commands?",
        "codeSnippet": "-- Redis Lua Script for Atomic Token Bucket\nlocal key = KEYS[1]\nlocal limit = tonumber(ARGV[1])\nlocal current = tonumber(redis.call('get', key) or \"0\")\nif current + 1 > limit then\n    return 0\nelse\n    redis.call('incrby', key, 1)\n    return 1\nend",
        "options": [
            "Redis executes Lua scripts atomically in a single event loop thread, preventing race conditions (Time-of-Check to Time-of-Use) across concurrent application servers.",
            "Lua scripts bypass Redis memory limits.",
            "Separate GET and SET commands are banned by HTTP/2 protocol.",
            "Lua scripts run natively on the client browser CPU."
        ],
        "correctOption": "A",
        "explanation": "In a distributed system, multiple web servers query Redis simultaneously. Separate GET -> calculate -> SET operations create race conditions where multiple requests read the same remaining token balance. A Redis Lua script runs atomically on the single-threaded Redis engine, guaranteeing strict thread safety."
    },
    {
        "id": "sys-quiz-adv-5",
        "topic": "Database Storage Engines (LSM-Tree vs B-Tree)",
        "difficulty": "hard",
        "questionText": "Why do write-heavy distributed databases like Apache Cassandra and RocksDB use Log-Structured Merge-Trees (LSM-Trees) instead of traditional B-Trees?",
        "codeSnippet": "// Write Pipeline in LSM-Tree:\n// 1. Append to Write-Ahead Log (Sequential disk I/O)\n// 2. Insert into in-memory MemTable (SkipList)\n// 3. Flush to immutable SSTable on disk\n// 4. Background Compaction merge",
        "options": [
            "LSM-Trees transform random disk writes into sequential append-only writes (WAL and SSTable flushes), achieving dramatically higher write throughput than random-write B-Trees.",
            "LSM-Trees do not require disk storage; they keep 100% of data in CPU registers.",
            "B-Trees cannot store strings or floating point numbers.",
            "LSM-Trees eliminate the need for read caching."
        ],
        "correctOption": "A",
        "explanation": "B-Trees perform random in-place page writes on disk, causing heavy write amplification and disk head/flash wear. LSM-Trees append all writes sequentially to a WAL and in-memory MemTable, periodically flushing immutable sorted string tables (SSTables) to disk, maximizing disk sequential write performance."
    }
]

def format_row(q):
    return [
        q["id"],
        q["topic"],
        q["difficulty"],
        q["questionText"],
        q.get("codeSnippet", ""),
        q["options"][0] if len(q["options"]) > 0 else "",
        q["options"][1] if len(q["options"]) > 1 else "",
        q["options"][2] if len(q["options"]) > 2 else "",
        q["options"][3] if len(q["options"]) > 3 else "",
        q["correctOption"],
        q["explanation"]
    ]

def main():
    print("=" * 70)
    print("Assessing and Adding Senior Engineering Questions to Google Sheet")
    print("=" * 70)

    payload = {
        "Java": [
            ["id", "topic", "difficulty", "questionText", "codeSnippet", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"]
        ] + [format_row(q) for q in NEW_JAVA_QUESTIONS],
        "Spring Boot": [
            ["id", "topic", "difficulty", "questionText", "codeSnippet", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"]
        ] + [format_row(q) for q in NEW_SPRING_BOOT_QUESTIONS],
        "System Design": [
            ["id", "topic", "difficulty", "questionText", "codeSnippet", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation"]
        ] + [format_row(q) for q in NEW_SYSTEM_DESIGN_QUESTIONS],
    }

    # Redirect Handler for Google Apps Script
    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return urllib.request.Request(newurl, headers={'User-Agent': 'Mozilla/5.0'})

    opener = urllib.request.build_opener(NoRedirectHandler)
    json_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        WEBAPP_URL,
        data=json_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST"
    )

    print(f"Pushing assessment & curated questions to Google Sheet tabs: Java, Spring Boot, System Design...")
    try:
        with opener.open(req, timeout=45) as resp:
            print("Status:", resp.status)
            res_body = resp.read().decode('utf-8')
            print("Response:", res_body)
            print("✓ SUCCESS! Google Sheet tabs successfully populated and synchronized!")
    except Exception as e:
        print("Push error:", e)

if __name__ == "__main__":
    main()
