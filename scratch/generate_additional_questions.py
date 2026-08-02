#!/usr/bin/env python3
import os
import json
import csv
import random
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')

# High quality additional senior-level questions for Java
JAVA_NEW_QUESTIONS = [
    {
        "id": "java-quiz-adv-1",
        "topic": "Virtual Threads & Project Loom",
        "difficulty": "hard",
        "questionText": "In Java 21, what causes a Virtual Thread to become 'pinned' to its underlying OS carrier thread, preventing the carrier thread from executing other virtual threads during blocking I/O?",
        "codeSnippet": "VirtualThreadFactory factory = Thread.ofVirtual().factory();\nExecutorService executor = Executors.newThreadPerTaskExecutor(factory);\nexecutor.submit(() -> {\n    synchronized(lock) {\n        // Blocking network I/O inside synchronized block\n        socket.read();\n    }\n});",
        "options": [
            "Executing any blocking network I/O inside a synchronized block or calling native methods (JNI).",
            "Submitting more than 1000 virtual threads to the ThreadPerTaskExecutor concurrently.",
            "Using Thread.sleep() inside a virtual thread's run method.",
            "Accessing any ConcurrentHashMap instance from a virtual thread."
        ],
        "correctOptionIndex": 0,
        "explanation": "In Java 21 Virtual Threads, executing blocking I/O inside a 'synchronized' block/method or inside a native frame (JNI) pins the virtual thread to its OS carrier thread. To avoid pinning, replace 'synchronized' with ReentrantLock."
    },
    {
        "id": "java-quiz-adv-2",
        "topic": "Structured Concurrency & Scoped Values",
        "difficulty": "hard",
        "questionText": "What advantage do ScopedValues (JEP 446) have over traditional ThreadLocal variables when used with millions of Java 21 Virtual Threads?",
        "codeSnippet": "private static final ScopedValue<UserSession> SESSION = ScopedValue.newInstance();\n\nScopedValue.where(SESSION, currentSession).run(() -> {\n    processRequest();\n});",
        "options": [
            "ScopedValues are immutable within their scope and automatically garbage collected when the scope exits, preventing memory leaks.",
            "ScopedValues allow child threads to mutate the parent thread's variable asynchronously without synchronization.",
            "ScopedValues store their payload in off-heap DirectByteBuffer memory, bypassing GC scans.",
            "ScopedValues replace Java reflection by allowing direct bytecode modification at runtime."
        ],
        "correctOptionIndex": 0,
        "explanation": "ThreadLocals suffer from severe memory leak risks and high per-thread memory overhead when millions of virtual threads are spawned. ScopedValues are immutable, stack-bound, scoped, and child virtual threads share parent scoped value bindings with zero copy overhead."
    },
    {
        "id": "java-quiz-adv-3",
        "topic": "JVM Memory & Garbage Collection",
        "difficulty": "hard",
        "questionText": "How does ZGC (Z Garbage Collector) achieve ultra-low pause times (< 1ms) regardless of heap size (from 8MB to 16TB)?",
        "codeSnippet": "// JVM Flags:\n// -XX:+UseZGC -XX:+ZGenerational",
        "options": [
            "ZGC uses Colored Pointers (metadata stored in pointer bits) and Load Barriers to perform concurrent marking and relocation while application threads run.",
            "ZGC freezes all application threads and uses multi-threaded parallel compaction during STW pause.",
            "ZGC moves all live objects into Metaspace and bypasses Java heap allocation entirely.",
            "ZGC automatically offloads garbage collection processing to GPU compute shaders."
        ],
        "correctOptionIndex": 0,
        "explanation": "ZGC uses Colored Pointers (reference metadata embedded directly in high pointer bits) and Read/Load Barriers. When application threads dereference an object pointer, the load barrier checks the color bits and self-heals stale references concurrently without stopping the application."
    },
    {
        "id": "java-quiz-adv-4",
        "topic": "Sealed Classes & Pattern Matching",
        "difficulty": "medium",
        "questionText": "Given the sealed interface declaration below in Java 21, what is the compilation outcome of the switch expression?",
        "codeSnippet": "public sealed interface Shape permits Circle, Rectangle {}\npublic record Circle(double radius) implements Shape {}\npublic record Rectangle(double w, double h) implements Shape {}\n\ndouble area(Shape s) {\n    return switch(s) {\n        case Circle c -> Math.PI * c.radius() * c.radius();\n        case Rectangle r -> r.w() * r.h();\n    };\n}",
        "options": [
            "Compiles successfully without a 'default' case because sealed types permit exhaustive pattern matching checks by the compiler.",
            "Compilation fails because a 'default' clause is mandatory for all switch expressions in Java.",
            "Compilation fails because Record components cannot be accessed directly in pattern matching.",
            "Compiles but throws a MatchException at runtime if s is non-null."
        ],
        "correctOptionIndex": 0,
        "explanation": "In Java 21, pattern matching on sealed interfaces/classes allows the compiler to verify exhaustiveness. Since Circle and Rectangle are the ONLY permitted subtypes of Shape, no 'default' case is required."
    },
    {
        "id": "java-quiz-adv-5",
        "topic": "VarHandle & Memory Barriers",
        "difficulty": "hard",
        "questionText": "What memory visibility guarantee is provided by VarHandle.setRelease(value) and VarHandle.getAcquire() in the Java Memory Model (JMM)?",
        "codeSnippet": "private static final VarHandle STATE;\n// Thread 1: STATE.setRelease(this, 1);\n// Thread 2: int s = (int) STATE.getAcquire(this);",
        "options": [
            "Acquire/Release semantics establish a happens-before relationship: writes prior to setRelease are visible to threads after getAcquire, without full fence overhead.",
            "They enforce sequential consistency across all CPU cores with a full hardware memory fence (lock cmpxchg).",
            "They guarantee that memory is written directly to NVRAM, bypassing CPU L1/L2/L3 caches.",
            "They behave identically to relaxed plain field reads and writes with zero memory order guarantees."
        ],
        "correctOptionIndex": 0,
        "explanation": "Acquire/Release ordering provides lighter memory barriers than full volatile fences. setRelease prevents previous memory writes from being reordered after the release, while getAcquire prevents subsequent memory reads from being reordered before the acquire."
    }
]

# High quality additional senior-level questions for Spring Boot
SPRING_NEW_QUESTIONS = [
    {
        "id": "sb-quiz-adv-1",
        "topic": "Spring Boot 3.2+ Virtual Threads",
        "difficulty": "medium",
        "questionText": "When you enable 'spring.threads.virtual.enabled=true' in a Spring Boot 3.2+ application running Tomcat, how does the web server handle incoming HTTP request threads?",
        "codeSnippet": "# application.properties\nspring.threads.virtual.enabled=true",
        "options": [
            "Tomcat replaces its fixed-size platform thread pool with an executor that spawns a new Virtual Thread for every incoming HTTP request.",
            "Spring Boot converts all MVC controllers into WebFlux reactive Mono/Flux streams automatically at startup.",
            "Tomcat disables HTTP keep-alive connections and forces single-threaded synchronous processing.",
            "Spring Boot compiles the application to a GraalVM native binary prior to starting Tomcat."
        ],
        "correctOptionIndex": 0,
        "explanation": "Setting 'spring.threads.virtual.enabled=true' in Spring Boot 3.2+ instructs embedded web servers (Tomcat/Jetty) to use Java 21 Virtual Threads for handling incoming HTTP requests. Each request gets its own lightweight virtual thread."
    },
    {
        "id": "sb-quiz-adv-2",
        "topic": "Spring Data JPA & N+1 Problem",
        "difficulty": "hard",
        "questionText": "You have an Order entity with `@OneToMany(fetch = FetchType.LAZY) List<OrderItem> items`. Querying 100 Orders and accessing `order.getItems()` in a loop executes 101 SQL queries (N+1 problem). What is the most idiomatic Spring Data JPA solution?",
        "codeSnippet": "@Entity\npublic class Order {\n    @OneToMany(fetch = FetchType.LAZY)\n    private List<OrderItem> items;\n}\n\npublic interface OrderRepository extends JpaRepository<Order, Long> {\n    @EntityGraph(attributePaths = {\"items\"})\n    List<Order> findAll();\n}",
        "options": [
            "Use @EntityGraph(attributePaths = {\"items\"}) or JOIN FETCH in JPQL to fetch Orders and OrderItems in a single SQL JOIN query.",
            "Change FetchType.LAZY to FetchType.EAGER on the @OneToMany annotation.",
            "Annotate the repository method with @Transactional(readOnly = true) to suppress SQL queries.",
            "Wrap the repository call inside a CompletableFuture.allOf() to run N queries in parallel."
        ],
        "correctOptionIndex": 0,
        "explanation": "@EntityGraph or JPQL 'JOIN FETCH' instructs Hibernate to perform an SQL JOIN, fetching the root entity and lazily annotated child collections in 1 query. Simply changing FetchType.EAGER does NOT solve N+1 (it still issues N+1 queries under SELECT fetching)."
    },
    {
        "id": "sb-quiz-adv-3",
        "topic": "Spring Transaction Management",
        "difficulty": "hard",
        "questionText": "Method A() in `@Service` has `@Transactional`. It calls Method B() in the SAME class which has `@Transactional(propagation = Propagation.REQUIRES_NEW)`. What happens to Method B's transaction?",
        "codeSnippet": "@Service\npublic class OrderService {\n    @Transactional\n    public void methodA() {\n        // ...\n        methodB(); // internal call in same class\n    }\n\n    @Transactional(propagation = Propagation.REQUIRES_NEW)\n    public void methodB() {\n        // ...\n    }\n}",
        "options": [
            "Method B runs inside Method A's existing transaction because Spring AOP proxies are bypassed during internal self-invocations (this.methodB()).",
            "Method B pauses Method A's transaction and creates a new independent database transaction.",
            "Spring throws an IllegalTransactionStateException at runtime during startup.",
            "Method B executes without any database transaction."
        ],
        "correctOptionIndex": 0,
        "explanation": "Spring `@Transactional` works via AOP proxies. Calling `methodB()` directly from `methodA()` inside the same class uses `this.methodB()`, bypassing the Spring AOP proxy. As a result, `REQUIRES_NEW` is ignored and methodB runs in methodA's transaction."
    },
    {
        "id": "sb-quiz-adv-4",
        "topic": "Spring WebFlux & Reactor Backpressure",
        "difficulty": "hard",
        "questionText": "In Spring WebFlux, what mechanism prevents a fast reactive producer from overwhelming a slow downstream consumer with unbuffered items?",
        "codeSnippet": "Flux.range(1, 1000000)\n    .limitRate(100)\n    .subscribe(new BaseSubscriber<Integer>() {\n        // ...\n    });",
        "options": [
            "Reactive Streams Backpressure: the subscriber requests N items from the publisher via Subscription.request(n) when ready.",
            "The JVM automatically pauses the producer's CPU thread using Thread.yield().",
            "Reactor buffers all 1,000,000 items in heap RAM and drops items when RAM exceeds 90%.",
            "The underlying Netty event loop throws an OverflowBufferException."
        ],
        "correctOptionIndex": 0,
        "explanation": "Reactive Streams specification defines subscriber-driven Backpressure. Consumers request data by signaling `Subscription.request(n)`. Publishers send at most N items until the consumer requests more, preventing buffer overflows."
    },
    {
        "id": "sb-quiz-adv-5",
        "topic": "Spring Boot Auto-Configuration",
        "difficulty": "medium",
        "questionText": "How does Spring Boot resolve `@ConditionalOnMissingBean(DataSource.class)` during auto-configuration bootstrap?",
        "codeSnippet": "@AutoConfiguration\npublic class DataSourceAutoConfiguration {\n    @Bean\n    @ConditionalOnMissingBean\n    public DataSource dataSource() {\n        return new HikariDataSource();\n    }\n}",
        "options": [
            "If the user has already defined a custom DataSource @Bean, Spring Boot skips creation of the default HikariDataSource bean.",
            "Spring Boot creates both DataSource beans and primary auto-wire fails with NoUniqueBeanDefinitionException.",
            "Spring Boot overrides the user custom DataSource bean with its default HikariDataSource.",
            "The annotation causes Spring Boot to throw a BeanCreationException if no DataSource exists."
        ],
        "correctOptionIndex": 0,
        "explanation": "`@ConditionalOnMissingBean` ensures user-defined beans take priority. If Spring context already contains a bean matching the type (DataSource), the auto-configuration bean definition is skipped."
    }
]

# High quality additional senior-level questions for System Design
SYSTEM_DESIGN_NEW_QUESTIONS = [
    {
        "id": "sd-quiz-adv-1",
        "topic": "Distributed Locking & Redlock",
        "difficulty": "hard",
        "questionText": "Why does Martin Kleppmann critique the Redlock algorithm (Redis distributed lock across N independent masters) for fencing sensitive storage systems?",
        "codeSnippet": "// Redlock algorithm: Acquire lock on N/2 + 1 Redis nodes\n// Lease time: 10 seconds",
        "options": [
            "Redlock relies on synchronized system clocks across nodes; clock drifts or GC pauses can invalidate lease time before execution completes without fencing tokens.",
            "Redis nodes process lock requests synchronously, causing high network latency.",
            "Redlock uses SHA-256 signatures which are vulnerable to quantum computing attacks.",
            "Redis single-threaded architecture cannot execute Lua scripts for atomic CAS operations."
        ],
        "correctOptionIndex": 0,
        "explanation": "Kleppmann proved that Redlock is unsafe for strong correctness because uncoordinated clock drift or long JVM GC pauses can cause the lock lease to expire while a thread still thinks it owns the lock. Reliable fencing requires monotonic auto-incrementing fencing tokens (e.g. ZooKeeper sequential z-nodes)."
    },
    {
        "id": "sd-quiz-adv-2",
        "topic": "Cache Stampede & Thundering Herd",
        "difficulty": "hard",
        "questionText": "When a hot cached key with 100,000 QPS expires in Redis, thousands of concurrent application threads simultaneously miss cache and query the primary SQL database (Cache Stampede). What is the optimal solution?",
        "codeSnippet": "// Probabilistic Early Expiration (XFetch algorithm)\n// OR Single-flight mutex (Distributed Lock / Singleflight pattern)",
        "options": [
            "Use Singleflight pattern (or Probabilistic Early Expiration XFetch) so only ONE thread recomputes the cache while others wait or get soft-expired data.",
            "Increase Redis maxmemory eviction policy to allkeys-lru.",
            "Set cache TTL to Integer.MAX_VALUE and never expire cached keys.",
            "Increase SQL database max_connections pool size from 100 to 100,000."
        ],
        "correctOptionIndex": 0,
        "explanation": "To prevent Cache Stampede (Thundering Herd), use Singleflight locking (only 1 thread fetches from DB on cache miss while other concurrent requests wait for the result) or Probabilistic Early Expiration (XFetch), which randomly recalculates the cache before TTL expiration."
    },
    {
        "id": "sd-quiz-adv-3",
        "topic": "Kafka Cooperative Sticky Rebalance",
        "difficulty": "hard",
        "questionText": "How does the Cooperative Sticky Assignor (Kafka 2.4+) improve consumer group rebalancing over the legacy Eager Rebalance Protocol?",
        "codeSnippet": "# Consumer config:\npartition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor",
        "options": [
            "Cooperative Rebalance performs incremental two-pass rebalancing, allowing consumers to continue processing unaffected partitions without a 'stop-the-world' pause.",
            "Cooperative Rebalance forces all consumers in the group to restart their JVM processes simultaneously.",
            "Cooperative Rebalance moves partition assignments directly into Kafka Broker ZK metadata node.",
            "Cooperative Rebalance turns off heartbeat threads during partition reassignment."
        ],
        "correctOptionIndex": 0,
        "explanation": "Legacy Eager Rebalancing revokes ALL partition assignments from ALL consumers, causing a global stop-the-world processing pause. Cooperative Sticky Assignor revokes ONLY partitions that actually need to move, allowing consumers to process unchanged partitions without interruption."
    },
    {
        "id": "sd-quiz-adv-4",
        "topic": "Rate Limiting & Token Bucket",
        "difficulty": "medium",
        "questionText": "Which rate limiting algorithm allows short bursts of traffic while enforcing a smooth average rate over time, making it ideal for API gateways?",
        "codeSnippet": "// Capacity: 100 tokens, Refill rate: 10 tokens/sec",
        "options": [
            "Token Bucket Algorithm: tokens refill at a constant rate up to bucket capacity; requests consume 1 token and burst up to capacity.",
            "Fixed Window Counter Algorithm: resets counter at boundary of every fixed minute.",
            "Leaky Bucket Algorithm: drops all burst traffic instantly if incoming rate exceeds exact leak speed.",
            "Sliding Window Log: stores full timestamp of every request in Redis Sorted Set."
        ],
        "correctOptionIndex": 0,
        "explanation": "Token Bucket permits burstiness (up to bucket capacity) while maintaining a strict long-term refill rate limit. Leaky Bucket smooths out requests at a strict constant rate without allowing bursts."
    },
    {
        "id": "sd-quiz-adv-5",
        "topic": "LSM-Tree vs B+Tree Storage Engines",
        "difficulty": "hard",
        "questionText": "Why do write-heavy databases (RocksDB, Apache Cassandra, LevelDB) use Log-Structured Merge-trees (LSM-Trees) instead of traditional B+Trees?",
        "codeSnippet": "// LSM-Tree Architecture:\n// MemTable (RAM) -> Write-Ahead Log (WAL) -> SSTables (Disk - Immutable Level Compaction)",
        "options": [
            "LSM-Trees convert random writes into sequential disk append operations in MemTable & WAL, dramatically increasing write throughput.",
            "LSM-Trees eliminate the need for secondary indexes and compaction background threads.",
            "LSM-Trees provide faster point read performance (O(1)) than B+Trees without Bloom filters.",
            "B+Trees require SSD drives while LSM-Trees only work on magnetic spinning disks."
        ],
        "correctOptionIndex": 0,
        "explanation": "LSM-Trees buffer writes in an in-memory MemTable and write-ahead log (WAL) as sequential appends. Sequential I/O is orders of magnitude faster than B+Tree random page updates on disk. Periodic compaction merges immutable SSTables asynchronously."
    }
]

def append_questions_to_file(target_file, var_name, new_questions):
    if not os.path.exists(target_file):
        print(f"[Generator Warning] File not found: {target_file}")
        return 0

    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract JSON array
    match = re.search(r"=\s*(\[.*\]);", content, re.DOTALL)
    if not match:
        print(f"[Generator Error] Could not parse array in {target_file}")
        return 0

    try:
        existing = json.loads(match.group(1))
    except Exception as e:
        print(f"[Generator Error] Failed to parse JSON in {target_file}: {e}")
        return 0

    # Avoid duplicate IDs
    existing_ids = {q.get('id') for q in existing}
    added_count = 0

    for nq in new_questions:
        if nq['id'] not in existing_ids:
            existing.append(nq)
            existing_ids.add(nq['id'])
            added_count += 1

    if added_count > 0:
        ts_code = f"""export interface QuizQuestion {{
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}}

export const {var_name}: QuizQuestion[] = {json.dumps(existing, indent=2)};
"""
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(ts_code)

    return added_count

def main():
    print("=" * 60)
    print("Generating Additional High-Quality Senior Interview Questions...")
    print("=" * 60)

    j_count = append_questions_to_file(
        os.path.join(BASE_DIR, "src", "data", "java-quiz-questions.ts"),
        "javaQuestions",
        JAVA_NEW_QUESTIONS
    )

    sb_count = append_questions_to_file(
        os.path.join(BASE_DIR, "src", "data", "spring-boot-quiz-questions.ts"),
        "springBootQuestions",
        SPRING_NEW_QUESTIONS
    )

    sd_count = append_questions_to_file(
        os.path.join(BASE_DIR, "src", "data", "system-design-quiz-questions.ts"),
        "systemDesignQuestions",
        SYSTEM_DESIGN_NEW_QUESTIONS
    )

    print(f"✓ Added {j_count} new Java questions.")
    print(f"✓ Added {sb_count} new Spring Boot questions.")
    print(f"✓ Added {sd_count} new System Design questions.")

    # Re-run export script to update CSVs
    print("\nUpdating CSV files in scratch/ directory...")
    os.system(f"python {os.path.join(SCRATCH_DIR, 'export_quiz_to_csv.py')}")

    print("\nDone! Updated TypeScript data files and exported refreshed CSV files.")

if __name__ == '__main__':
    main()
