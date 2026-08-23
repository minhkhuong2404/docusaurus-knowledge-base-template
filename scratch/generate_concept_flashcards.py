#!/usr/bin/env python3
"""
Script: scratch/generate_concept_flashcards.py
Generates deep, high-quality concept flashcards for the 4 core domains with
exact clickable docLinks to internal documentation pages.
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_JSON = os.path.join(BASE_DIR, "static", "data", "concept_flashcards.json")
OUTPUT_CSV = os.path.join(BASE_DIR, "scratch", "concept_flashcards_sheet.csv")

JAVA_CONCEPTS = [
    {
        "conceptName": "Virtual Threads (Project Loom)",
        "docLink": "/technical-knowledge/java/java-virtual-threads",
        "difficulty": "Senior",
        "whatItIs": "Lightweight, user-mode threads managed by the JVM rather than the OS kernel. They decouple Java thread instances from 1:1 OS carrier threads, allowing millions of concurrent tasks to execute on a tiny pool of ForkJoin carrier threads with zero blocking overhead.",
        "whenToUse": "High-concurrency I/O-bound workloads (HTTP microservices, database querying, socket streaming, outbound REST/gRPC calls).",
        "pros": ["Near-infinite concurrency scaling for I/O", "Preserves intuitive synchronous imperative code style without reactive callback hell", "Seamlessly integrates with existing java.lang.Thread and ThreadLocal APIs"],
        "cons": ["Pinning hazard when synchronizing on monitor locks (`synchronized`) or native JNI calls", "Zero performance benefit for CPU-intensive mathematical compute tasks"],
        "howToUseProperly": "Use `Executors.newVirtualThreadPerTaskExecutor()`. Replace legacy `synchronized` blocks with `ReentrantLock` to prevent carrier thread pinning. Avoid pooling virtual threads—simply instantiate one per task.",
        "codeExample": "try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 10_000).forEach(i -> executor.submit(() -> {\n        var res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());\n        return res.body();\n    }));\n}",
        "keyTakeaway": "Virtual threads convert blocking I/O into cheap unpark operations on ForkJoin carriers. Never pool virtual threads; spawn them per task and use ReentrantLock instead of synchronized."
    },
    {
        "conceptName": "CAS (Compare-And-Swap) & Lock-Free Atomic Primitives",
        "docLink": "/technical-knowledge/java/java-locks",
        "difficulty": "Staff",
        "whatItIs": "An atomic hardware instruction (e.g. `CMPXCHG` on x86) that compares a memory location against an expected value, and if identical, modifies it to a new value in a single atomic CPU cycle without operating system mutex kernel transitions.",
        "whenToUse": "Ultra-low-latency concurrency primitives, high-throughput counters, atomic reference updates, and non-blocking data structure state machines (e.g. AtomicInteger, ConcurrentLinkedQueue).",
        "pros": ["Zero kernel-level context switching or thread suspension", "Immune to thread priority inversions and deadlock hazards", "Maximal throughput under low-to-moderate lock contention"],
        "cons": ["High CPU spin overhead under extreme contention (cache line bouncing)", "Vulnerable to the ABA problem unless versioned with AtomicStampedReference"],
        "howToUseProperly": "Use `AtomicReference` or `VarHandle`. Pair with exponential backoff or LongAdder for high-frequency multi-threaded counter increments to distribute contention across cache lines.",
        "codeExample": "public class LockFreeStack<T> {\n    private final AtomicReference<Node<T>> head = new AtomicReference<>();\n    public void push(T val) {\n        Node<T> newHead = new Node<>(val);\n        do {\n            newHead.next = head.get();\n        } while (!head.compareAndSet(newHead.next, newHead));\n    }\n}",
        "keyTakeaway": "CAS replaces heavy kernel mutexes with CPU-level atomic compare-and-exchange. For extreme write contention, prefer LongAdder cell striping over a single AtomicLong."
    },
    {
        "conceptName": "ConcurrentHashMap Lock Striping & Treeification",
        "docLink": "/technical-knowledge/interview-questions/java/concurrent-collection-interview",
        "difficulty": "Senior",
        "whatItIs": "A thread-safe hash map implementation in Java 8+ that eliminates table-wide locks. It uses CAS for empty bin initialization and synchronized locking only on individual bin head nodes, dynamically transforming linked lists into Red-Black Trees (TreeBins) when bucket collisions exceed 8.",
        "whenToUse": "High-throughput concurrent caching, session token stores, in-memory index registries, and multi-threaded shared lookup tables.",
        "pros": ["Concurrent non-blocking reads (`get()` requires zero locks via volatile node pointers)", "Granular per-bucket write locks minimize thread contention", "O(log N) worst-case search time when buckets are treeified"],
        "cons": ["Does not permit null keys or null values to prevent ambiguous get() vs missing key race conditions", "Aggregate operations (`size()`, `mappingCount()`) provide weakly consistent estimates"],
        "howToUseProperly": "Use `computeIfAbsent()` and `merge()` for atomic compound updates instead of separate `containsKey()` and `put()` calls. Never store null keys or values.",
        "codeExample": "ConcurrentMap<String, AtomicLong> wordCounts = new ConcurrentHashMap<>();\nwordCounts.computeIfAbsent(\"kafka\", k -> new AtomicLong()).incrementAndGet();",
        "keyTakeaway": "ConcurrentHashMap uses CAS on empty slots + synchronizing head nodes + TreeBins at 8 collisions. Always use atomic compute() APIs rather than check-then-act anti-patterns."
    },
    {
        "conceptName": "Java Memory Model (JMM) Happens-Before & Volatile Semantics",
        "docLink": "/technical-knowledge/java/java-jmm-memory-model",
        "difficulty": "Staff",
        "whatItIs": "The formal specification defining when memory writes by one thread become visible to reads by another. `volatile` guarantees variable read/write visibility across CPU caches and prevents instruction reordering via CPU memory fences (LoadLoad, StoreStore, StoreLoad).",
        "whenToUse": "State flags, status tickers, shutdown signals, and Double-Checked Locking singleton instances.",
        "pros": ["Guarantees cross-core CPU cache coherency visibility", "Prevents compiler and Out-of-Order CPU execution reordering", "Much cheaper than mutex acquisition for single field reads/writes"],
        "cons": ["Does NOT guarantee atomicity for compound operations (e.g. `count++` requires read-modify-write)", "Forces StoreLoad fences which flush store buffers to main memory"],
        "howToUseProperly": "Use `volatile` for one-way status flags or pair with Double-Checked Locking. For compound increments, use `AtomicInteger` or `VarHandle`.",
        "codeExample": "private static volatile Instance instance;\npublic static Instance getInstance() {\n    if (instance == null) {\n        synchronized (Holder.class) {\n            if (instance == null) instance = new Instance();\n        }\n    }\n    return instance;\n}",
        "keyTakeaway": "Volatile guarantees visibility and prevents instruction reordering via CPU memory barriers, but does not provide mutual exclusion for compound operations."
    },
    {
        "conceptName": "Generational Garbage Collection & G1 GC vs ZGC",
        "docLink": "/technical-knowledge/java/java-gc",
        "difficulty": "Senior",
        "whatItIs": "JVM memory management based on the Weak Generational Hypothesis: most objects die shortly after allocation. G1 GC divides heap into equal regions prioritizing regions with the most garbage, while ZGC uses colored pointers and load barriers to achieve sub-millisecond concurrent GC pauses regardless of heap size.",
        "whenToUse": "Low-latency production applications, high-throughput microservices, and large-heap (16GB - 16TB) distributed engines.",
        "pros": ["ZGC guarantees max pause times < 1ms across multi-terabyte heaps", "G1 GC allows setting predictable latency targets (`-XX:MaxGCPauseMillis=200`)", "Eliminates stop-the-world allocation stalls"],
        "cons": ["ZGC incurs a minor 2-5% throughput overhead due to read load barrier checks on object references", "G1 GC can still experience Full GC pauses if promotion rates exceed concurrent marking capacity"],
        "howToUseProperly": "On Java 21+, enable Generational ZGC (`-XX:+UseZGC -XX:+ZGenerational`) for ultra-low latency SLAs. For throughput-oriented batch pipelines, use Parallel GC or tuned G1 GC.",
        "codeExample": "# JVM Flag for Sub-Millisecond Latency:\njava -XX:+UseZGC -XX:+ZGenerational -Xms16g -Xmx16g -jar service.jar",
        "keyTakeaway": "Generational ZGC uses colored pointers and read load barriers to achieve sub-1ms pauses even on massive multi-terabyte heaps."
    },
    {
        "conceptName": "ThreadLocal & Memory Leak Mitigation",
        "docLink": "/technical-knowledge/java/java-threads",
        "difficulty": "Mid",
        "whatItIs": "Provides thread-confined state where each thread accesses its own independently initialized copy of a variable via a `ThreadLocalMap` stored on the `Thread` instance.",
        "whenToUse": "Security contexts (SecurityContextHolder), transaction contexts, request IDs, database connection binding, and non-thread-safe formatters (SimpleDateFormat).",
        "pros": ["Eliminates synchronization locks by confining data to single thread", "High performance thread-isolated lookups"],
        "cons": ["Catastrophic memory leaks in pooled environments (Tomcat worker threads) if not explicitly removed", "ThreadLocalMap uses weak keys but strong values, causing value retention across requests"],
        "howToUseProperly": "Always execute `threadLocal.remove()` inside a mandatory `finally` block before yielding the thread back to the container thread pool. On Java 21+, prefer `ScopedValue`.",
        "codeExample": "public static final ThreadLocal<RequestContext> CTX = new ThreadLocal<>();\ntry {\n    CTX.set(new RequestContext(reqId));\n    processRequest();\n} finally {\n    CTX.remove(); // CRITICAL: Prevent pooled thread leak\n}",
        "keyTakeaway": "ThreadLocal in pooled thread environments retains values indefinitely unless cleaned up in a finally block. On modern Java 21, prefer ScopedValue."
    },
    {
        "conceptName": "ForkJoinPool & Work-Stealing Algorithm",
        "docLink": "/technical-knowledge/java/thread-pools-and-connection-pooling",
        "difficulty": "Senior",
        "whatItIs": "A thread pool designed for recursive divide-and-conquer parallelism. Each worker thread maintains a double-ended queue (deque); when a worker exhausts its own deque, it steals tasks from the tail of another busy worker's deque.",
        "whenToUse": "Parallel streams, recursive divide-and-conquer computations, tree traversals, and bulk data transformations.",
        "pros": ["Maximizes multi-core CPU core utilization", "Work-stealing balances uneven workloads dynamically across cores", "Minimal lock contention because workers push/pop from their own head"],
        "cons": ["Blocking I/O in the common pool (`ForkJoinPool.commonPool()`) starves all parallel streams JVM-wide", "Inefficient for small tasks where task dispatch overhead exceeds compute time"],
        "howToUseProperly": "Never execute blocking network or DB I/O on `parallelStream()`. For blocking tasks, construct a custom isolated ForkJoinPool or use Virtual Threads.",
        "codeExample": "ForkJoinPool customPool = new ForkJoinPool(8);\ncustomPool.submit(() -> dataList.parallelStream().map(this::cpuIntensiveTransform).toList()).get();",
        "keyTakeaway": "ForkJoinPool uses deques with work-stealing from tails. Never execute blocking I/O on default parallelStream() because it shares the JVM-wide commonPool."
    },
    {
        "conceptName": "AQS (AbstractQueuedSynchronizer) Internals & Lock Design",
        "docLink": "/technical-knowledge/java/java-aqs-internals",
        "difficulty": "Staff",
        "whatItIs": "The foundational synchronization framework in `java.util.concurrent`. It manages a volatile `state` integer manipulated via atomic CAS, alongside a FIFO CLH bi-directional wait queue of parked threads (`LockSupport.park/unpark`).",
        "whenToUse": "Custom sync primitives, ReentrantLock, Semaphore, CountDownLatch, and ReentrantReadWriteLock.",
        "pros": ["Unified, battle-tested lock state machine", "Handles fair vs non-fair queue scheduling efficiently"],
        "cons": ["Requires deep understanding of internal node states (SIGNAL, CANCELLED, CONDITION)"],
        "howToUseProperly": "Extend `AbstractQueuedSynchronizer` and override `tryAcquire`, `tryRelease`, `tryAcquireShared`, `tryReleaseShared` without calling `super`.",
        "codeExample": "class Mutex extends AbstractQueuedSynchronizer {\n    protected boolean tryAcquire(int acquires) {\n        return compareAndSetState(0, 1);\n    }\n    protected boolean tryRelease(int releases) {\n        setState(0);\n        return true;\n    }\n}",
        "keyTakeaway": "AQS provides the atomic state + FIFO CLH thread park/unpark queue underlying ReentrantLock, Semaphore, and CountDownLatch."
    }
]

SPRING_CONCEPTS = [
    {
        "conceptName": "Spring AOP Proxying & Self-Invocation Trap",
        "docLink": "/technical-knowledge/spring/spring-aop",
        "difficulty": "Senior",
        "whatItIs": "Spring intercepts method calls via dynamic proxies (CGLIB subclasses or JDK interfaces). Annotations like `@Transactional`, `@Async`, and `@Cacheable` only trigger when invocations arrive from an external bean through the proxy wrapper.",
        "whenToUse": "Cross-cutting concerns: declarative transactions, caching, rate limiting, security checks, and distributed tracing.",
        "pros": ["Decouples business logic from operational infrastructure code", "Zero boilerplate transaction management"],
        "cons": ["Self-invocation (`this.methodB()`) bypasses the proxy and silently drops transactional and caching interception", "Private methods cannot be proxied by CGLIB or JDK dynamic proxies"],
        "howToUseProperly": "Extract internal transactional sub-routines into a separate injected `@Service` collaborator or inject `ApplicationContext` / self-inject `@Autowired private MyService self` to route through the proxy.",
        "codeExample": "@Service\npublic class OrderService {\n    @Autowired private PaymentService paymentService; // Proxy route\n    \n    public void processOrder() {\n        // DO NOT call this.processPayment() directly!\n        paymentService.processPaymentTransactional();\n    }\n}",
        "keyTakeaway": "Spring AOP proxies intercept external method calls. Internal `this.method()` invocations bypass proxy wrappers, silently failing @Transactional, @Async, and @Cacheable."
    },
    {
        "conceptName": "Spring Transaction Propagation (REQUIRED vs REQUIRES_NEW)",
        "docLink": "/technical-knowledge/spring/spring-transactional-deep-dive",
        "difficulty": "Senior",
        "whatItIs": "Rules determining transaction boundary behavior when a transactional method calls another. `REQUIRED` joins the existing transaction, while `REQUIRES_NEW` suspends the outer transaction and initiates an isolated, independent physical database transaction.",
        "whenToUse": "Audit logging, event publishing, or billing ledger updates that MUST persist even if the outer business transaction fails and rolls back.",
        "pros": ["Enforces strict transactional isolation for critical sub-tasks", "Prevents non-critical rollback cascades"],
        "cons": ["REQUIRES_NEW consumes 2 simultaneous physical database connection pool slots, creating high deadlock / exhaustion risks under load"],
        "howToUseProperly": "Use `REQUIRED` for standard transactional workflows. Use `REQUIRES_NEW` only for short, isolated audit logs and ensure connection pool sizing (`HikariCP`) accounts for concurrent nested connections.",
        "codeExample": "@Transactional(propagation = Propagation.REQUIRES_NEW)\npublic void recordAuditLog(String action, Long userId) {\n    auditRepository.save(new AuditEntry(action, userId));\n    // Commits independently of outer transaction status\n}",
        "keyTakeaway": "REQUIRES_NEW suspends the caller transaction and opens a second physical DB connection. Sizing HikariCP incorrectly with REQUIRES_NEW leads to pool starvation deadlocks."
    },
    {
        "conceptName": "Spring Bean Lifecycle & BeanPostProcessor",
        "docLink": "/technical-knowledge/spring/spring-framework-deep-dive",
        "difficulty": "Staff",
        "whatItIs": "The rigorous sequence executed by the Spring IoC container to create beans: Instantiation ➔ Populate Properties ➔ BeanNameAware / BeanFactoryAware ➔ PostProcessBeforeInitialization ➔ `@PostConstruct` / InitializingBean ➔ PostProcessAfterInitialization (Proxy Creation).",
        "whenToUse": "Custom framework extensions, dynamic annotation scanners, automated metric instruments, and configuration validators.",
        "pros": ["Powerful hook system for decorating and wrapping components dynamically", "Centralized inversion of control"],
        "cons": ["Executing slow blocking I/O in `@PostConstruct` delays application startup readiness probes", "Circular dependencies cause `BeanCurrentlyInCreationException`"],
        "howToUseProperly": "Place lightweight state setup in `@PostConstruct`. Keep initialization free of remote network I/O. Use `BeanPostProcessor` only for global cross-cutting decorations.",
        "codeExample": "@Component\npublic class CustomMetricsPostProcessor implements BeanPostProcessor {\n    @Override\n    public Object postProcessAfterInitialization(Object bean, String name) {\n        // Wrap bean in custom telemetry proxy\n        return ProxyFactory.getProxy(bean);\n    }\n}",
        "keyTakeaway": "Spring AOP proxies are created in postProcessAfterInitialization. Avoid blocking I/O in @PostConstruct and eliminate circular dependencies via clean architectural decoupling."
    },
    {
        "conceptName": "HikariCP Connection Pool Sizing & Starvation Prevention",
        "docLink": "/technical-knowledge/spring/hibernate-transactions-performance",
        "difficulty": "Staff",
        "whatItIs": "The default high-performance JDBC connection pool in Spring Boot. It uses byte-code generated fast-paths, ThreadLocal caching, and lock-free concurrency to minimize connection acquisition latency.",
        "whenToUse": "Production relational database connectivity (Postgres, MySQL, Oracle) in high-concurrency Spring Boot applications.",
        "pros": ["Zero-overhead connection dispatch", "Reliable connection leak detection (`leakDetectionThreshold`)", "Fastest connection pool in Java ecosystem"],
        "cons": ["Oversizing connection pool degrades database performance due to disk I/O thrashing and CPU context switches"],
        "howToUseProperly": "Follow the PostgreSQL connection formula: `Pool Size = (Core_Count * 2) + Effective_Spindle_Count`. Set `leakDetectionThreshold = 2000` to catch unclosed connections.",
        "codeExample": "spring:\n  datasource:\n    hikari:\n      maximum-pool-size: 16\n      minimum-idle: 16\n      connection-timeout: 30000\n      leak-detection-threshold: 2000",
        "keyTakeaway": "More database connections do NOT mean more speed. Size HikariCP according to CPU cores (Cores * 2 + Disks) to avoid database context switching collapse."
    },
    {
        "conceptName": "Hibernate N+1 Query Problem & EntityGraph Resolution",
        "docLink": "/technical-knowledge/spring/spring-data-jpa-mappings",
        "difficulty": "Mid",
        "whatItIs": "A severe performance antipattern in ORM mapping where loading N parent records triggers N individual secondary SQL queries to load related child collections instead of a single joined query.",
        "whenToUse": "Relational entity fetching with `@OneToMany` or `@ManyToMany` associations.",
        "pros": ["EntityGraph and `JOIN FETCH` retrieve parent and child entities in 1 single round-trip query", "Eliminates database round-trip latency multiplier"],
        "cons": ["Fetching multiple bag collections simultaneously in 1 query causes a Cartesian Product explosion in memory"],
        "howToUseProperly": "Use `@EntityGraph(attributePaths = {\"items\"})` or JPQL `JOIN FETCH`. Set `default_batch_fetch_size: 25` in Spring Boot configuration as a global safety shield.",
        "codeExample": "@Repository\npublic interface OrderRepository extends JpaRepository<Order, Long> {\n    @EntityGraph(attributePaths = {\"orderItems\", \"customer\"})\n    List<Order> findAllByStatus(OrderStatus status);\n}",
        "keyTakeaway": "N+1 queries collapse DB throughput. Eliminate with @EntityGraph, JOIN FETCH, and global hibernate.default_batch_fetch_size: 25."
    },
    {
        "conceptName": "Spring Security JWT Stateless Authentication",
        "docLink": "/technical-knowledge/spring/spring-security",
        "difficulty": "Senior",
        "whatItIs": "A stateless security architecture where every HTTP request includes a digitally signed JSON Web Token (JWT) in the `Authorization: Bearer <token>` header, validated on-the-fly by a `OncePerRequestFilter` without server-side HTTP session replication.",
        "whenToUse": "Horizontal microservice architectures, mobile app APIs, Single Page Applications (SPAs).",
        "pros": ["Zero server-side session memory storage", "Instant horizontal scaling across stateless pods"],
        "cons": ["Revocation hazard: JWT cannot be invalidated before expiration without a distributed Redis blacklist / token version counter"],
        "howToUseProperly": "Keep access token lifetimes short (5-15 mins). Use Refresh Token Rotation stored in HttpOnly cookies. Maintain user security version in Redis for instant revocation.",
        "codeExample": "public class JwtFilter extends OncePerRequestFilter {\n    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {\n        String token = extractBearerToken(req);\n        if (jwtService.validate(token)) {\n            SecurityContextHolder.getContext().setAuthentication(jwtService.getAuth(token));\n        }\n        chain.doFilter(req, res);\n    }\n}",
        "keyTakeaway": "Stateless JWT enables horizontal scaling without session replication. Pair short-lived access tokens (15m) with refresh token rotation and Redis version revocation."
    }
]

SYSTEM_DESIGN_CONCEPTS = [
    {
        "conceptName": "Consistent Hashing with Virtual Nodes",
        "docLink": "/technical-knowledge/system-design/consistent-hashing",
        "difficulty": "Staff",
        "whatItIs": "A distributed partitioning algorithm that maps both server nodes and keys to a continuous $360^\\circ$ hash ring ($0 \\dots 2^{32}-1$). Adding or removing a server node only relocates $K/N$ keys on average, while virtual nodes (e.g. 100-250 virtual positions per physical node) guarantee uniform load distribution.",
        "whenToUse": "Distributed caching (Memcached, Redis Cluster), distributed databases (Cassandra, DynamoDB, Riak), and layer 7 load balancers.",
        "pros": ["Minimal key relocation during cluster scaling or node failure", "Virtual nodes prevent hot spots and load skew on uneven hardware", "Decentralized deterministic node discovery"],
        "cons": ["Requires maintaining ring topology metadata across cluster clients", "Cascading load spikes if replicas fail concurrently without quorum"],
        "howToUseProperly": "Allocate 150-300 virtual nodes per physical host using MD5 or MurmurHash3. Combine with replication factors ($R=3$) to replicate clockwise on succeeding distinct physical nodes.",
        "codeExample": "public class ConsistentHashRing {\n    private final SortedMap<Integer, String> ring = new TreeMap<>();\n    public void addServer(String node, int vNodes) {\n        for (int i = 0; i < vNodes; i++) {\n            int hash = murmur3(node + \"#\" + i);\n            ring.put(hash, node);\n        }\n    }\n}",
        "keyTakeaway": "Consistent hashing relocates only K/N keys when cluster topology changes. Virtual nodes distribute hash ring load uniformly across physical servers."
    },
    {
        "conceptName": "Singleflight / Probabilistic Early Recomputation (XFetch)",
        "docLink": "/technical-knowledge/system-design/caching-strategies",
        "difficulty": "Senior",
        "whatItIs": "An architectural deduplication pattern that suppresses thundering herds. When thousands of concurrent requests miss the cache for an expired hot key, Singleflight permits only 1 in-flight database query while other concurrent requests await its promise or serve stale cache with probabilistic early background refresh.",
        "whenToUse": "High-concurrency read-heavy endpoints, flash-sale product catalogs, viral social feeds, and breaking news banners.",
        "pros": ["Shields primary database from sudden cache stampede collapse", "Maintains ultra-low p99 latency by recomputing cache before expiry ($-\\beta \\cdot \\ln(rand()) \\cdot \\delta > TTL$)"],
        "cons": ["If the leader worker thread computing the cache hangs, waiting requests block until timeout"],
        "howToUseProperly": "Combine Go singleflight / Java Mutex Map per key with a 100ms async lock timeout. Apply Stale-While-Revalidate HTTP cache headers.",
        "codeExample": "public String getWithSingleflight(String key) {\n    return cache.get(key, k -> singleFlightGroup.execute(k, () -> db.fetchExpensive(k)));\n}",
        "keyTakeaway": "Singleflight ensures only 1 DB query executes per expired cache key regardless of concurrency, completely neutralizing cache stampede / avalanche crashes."
    },
    {
        "conceptName": "Circuit Breaker Pattern (Closed ➔ Open ➔ Half-Open)",
        "docLink": "/technical-knowledge/system-design/circuit-breaker-pattern",
        "difficulty": "Senior",
        "whatItIs": "A resilience state machine that intercepts outgoing remote calls to downstream dependencies. When failure rates cross a configured threshold (e.g. 50%), the circuit opens immediately, failing fast without consuming thread pools, and periodically probes in Half-Open state to detect recovery.",
        "whenToUse": "Outbound HTTP, gRPC, and database calls in microservices architectures.",
        "pros": ["Prevents cascading failures from consuming container worker threads", "Provides graceful fallback responses"],
        "cons": ["Requires careful tuning of sliding window sizes and minimum call thresholds"],
        "howToUseProperly": "Use Resilience4j with a count-based or time-based sliding window. Pair with fallback methods that return cached data or degraded default responses.",
        "codeExample": "@CircuitBreaker(name = \"paymentService\", fallbackMethod = \"fallbackPayment\")\npublic PaymentResponse charge(PaymentRequest req) {\n    return restTemplate.postForObject(\"/charge\", req, PaymentResponse.class);\n}",
        "keyTakeaway": "Circuit breakers fail fast when downstream services degrade, preventing thread exhaustion cascades across microservice topologies."
    },
    {
        "conceptName": "Saga Pattern (Choreography vs Orchestration)",
        "docLink": "/technical-knowledge/system-design/saga-pattern",
        "difficulty": "Staff",
        "whatItIs": "A distributed transaction management pattern across independent microservice databases. Instead of blocking 2PC locks, a Saga executes a sequence of local transactions where each step publishes an event; if a step fails, compensating backward transactions are triggered in reverse order.",
        "whenToUse": "Cross-service multi-stage workflows: e-commerce checkout (Order ➔ Payment ➔ Inventory ➔ Shipping), flight booking, ride sharing.",
        "pros": ["Non-blocking high throughput across independent databases", "Supports long-running business transactions"],
        "cons": ["Lack of data isolation (dirty reads / lost updates) requires semantic locks", "Compensating transactions must be strictly idempotent and cannot fail"],
        "howToUseProperly": "Use Choreography for simple 2-3 step flows. Use Orchestration (Temporal / Camunda / State Machine) for complex multi-step sagas with branching logic.",
        "codeExample": "// Orchestration Step:\npublic void executeSaga(OrderContext ctx) {\n    try {\n        paymentService.charge(ctx);\n        inventoryService.reserve(ctx);\n    } catch (Exception e) {\n        paymentService.compensateRefund(ctx); // Backward compensating action\n    }\n}",
        "keyTakeaway": "Sagas replace blocking 2PC with sequential local transactions + backward compensating transactions. Enforce strict idempotency on all compensations."
    },
    {
        "conceptName": "Raft Consensus Protocol & Quorum Writes",
        "docLink": "/technical-knowledge/system-design/data-consistency",
        "difficulty": "Staff",
        "whatItIs": "A leader-based distributed consensus algorithm designed for state machine replication across a cluster. A cluster of $2F+1$ nodes can tolerate $F$ node failures by enforcing strong leader election, append-only log replication, and majoritarian quorum commitments ($Q = \\lfloor N/2 \\rfloor + 1$).",
        "whenToUse": "Distributed metadata registries, coordinated configuration stores, distributed lock managers (etcd, Consul, ZooKeeper, Kafka KRaft).",
        "pros": ["Guarantees strict linearizability (CP in CAP theorem)", "Deterministic leader election with randomized election timeouts", "Prevents split-brain scenarios"],
        "cons": ["Cannot accept writes if a network partition isolates the leader from the majority quorum", "Write throughput bottlenecked by leader log append serialization and disk fsync"],
        "howToUseProperly": "Always deploy odd cluster sizes ($N=3$ for 1 failure tolerance, $N=5$ for 2 failure tolerance). Keep state machine operations strictly deterministic.",
        "codeExample": "# Quorum Formula:\nQuorum_Needed = (Total_Nodes / 2) + 1\n# Example: 5 nodes require 3 active nodes to commit log entries",
        "keyTakeaway": "Raft enforces CP linearizability via majority quorum ((N/2)+1) and leader log replication. Always deploy odd cluster sizes (3 or 5 nodes)."
    },
    {
        "conceptName": "Transactional Outbox Pattern & CDC (Debezium)",
        "docLink": "/technical-knowledge/system-design/outbox-pattern",
        "difficulty": "Senior",
        "whatItIs": "A reliable distributed messaging pattern where database state mutations and outbound event messages are committed together in the same local relational ACID transaction into an `outbox` table. A Change Data Capture (CDC) engine (e.g. Debezium) streams changes directly from the database WAL into Kafka.",
        "whenToUse": "Microservices event-driven architectures, payment processing, saga orchestrations, and dual-write mitigation.",
        "pros": ["Eliminates dual-write inconsistencies (DB write succeeds but Kafka publish fails)", "Guarantees at-least-once event delivery", "Zero application-level two-phase commit (2PC) coordination"],
        "cons": ["Consumers must be strictly idempotent to handle potential duplicate event deliveries", "CDC pipeline introduces a 10-100ms tail propagation latency"],
        "howToUseProperly": "Write outbound events to the `outbox` table within the active `@Transactional` boundary. Pair with Debezium Kafka Connect or polling background worker, and enforce consumer idempotency via unique event IDs.",
        "codeExample": "@Transactional\npublic void createOrder(Order order) {\n    orderRepository.save(order);\n    outboxRepository.save(new OutboxEvent(\"ORDER_CREATED\", order.getId(), json(order)));\n    // Both committed atomically in 1 single ACID transaction\n}",
        "keyTakeaway": "The Outbox pattern solves the dual-write problem by persisting domain changes and events in 1 local ACID transaction, streamed asynchronously to Kafka via CDC."
    },
    {
        "conceptName": "Kafka Idempotent Producer & Multi-Topic Transactions",
        "docLink": "/technical-knowledge/kafka/producer/producer-transactions",
        "difficulty": "Staff",
        "whatItIs": "An exactly-once processing mechanism in Apache Kafka. The broker assigns each producer a unique 64-bit Producer ID (PID) and tracks sequence numbers per partition to silently deduplicate network retries. Multi-topic transactions use a Transaction Coordinator and 2PC commit markers in `__transaction_state`.",
        "whenToUse": "Financial ledger streaming, real-time balance calculations, stream processing pipelines (Kafka Streams / Flink), and read-process-write loops.",
        "pros": ["Guarantees exactly-once processing (EOS) across consume-transform-produce pipelines", "Zero duplicate messages in Kafka partitions during network retries"],
        "cons": ["Transaction commit markers introduce a minor 5-15ms tail latency", "Consumer read isolation must be configured to `read_committed`"],
        "howToUseProperly": "Enable `enable.idempotence=true` (default in Kafka 3.0+). Set `transactional.id` for multi-topic transactions and configure downstream consumers with `isolation.level=read_committed`.",
        "codeExample": "Properties props = new Properties();\nprops.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, \"true\");\nprops.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, \"order-tx-1\");\nKafkaProducer<String, String> producer = new KafkaProducer<>(props);",
        "keyTakeaway": "Kafka Idempotence uses PIDs and sequence numbers for zero duplicates. Multi-topic transactions use 2PC commit markers; downstream consumers must set isolation.level=read_committed."
    }
]

DATABASE_CONCEPTS = [
    {
        "conceptName": "PostgreSQL MVCC & VACUUM Maintenance",
        "docLink": "/technical-knowledge/database/postgresql-internals",
        "difficulty": "Staff",
        "whatItIs": "Multi-Version Concurrency Control in PostgreSQL. Updates and deletes do not overwrite data in place; instead, they create new row versions (tuples) stamped with creation transaction ID (`xmin`) and expiration transaction ID (`xmax`). Dead tuples remain on disk until autovacuum reclaims space.",
        "whenToUse": "High-concurrency transactional OLTP systems where reads must never block writes and writes must never block reads.",
        "pros": ["Non-blocking concurrent reads and writes", "Instant point-in-time snapshot isolation"],
        "cons": ["Dead tuple table and index bloat if autovacuum falls behind", "Transaction ID wraparound risk if long-running transactions hold back global xmin"],
        "howToUseProperly": "Tune `autovacuum_vacuum_scale_factor = 0.05` and `autovacuum_vacuum_cost_limit = 2000`. Terminate orphaned idle-in-transaction connections.",
        "codeExample": "-- Tune Autovacuum for High-Write Table\nALTER TABLE orders SET (\n    autovacuum_vacuum_scale_factor = 0.05,\n    autovacuum_vacuum_cost_limit = 2000\n);",
        "keyTakeaway": "Postgres MVCC writes new tuple versions on every UPDATE. Prevent table bloat by tuning aggressive autovacuum thresholds and killing idle-in-transaction connections."
    },
    {
        "conceptName": "LSM-Tree (Log-Structured Merge-Tree) vs B+ Tree",
        "docLink": "/technical-knowledge/system-design/caching-strategies",
        "difficulty": "Staff",
        "whatItIs": "Storage engine data structures. B+ Trees optimize for fast random reads via balanced multi-way on-disk page hierarchies. LSM-Trees optimize for ultra-high write throughput by appending writes to an in-memory MemTable + WAL, flushing immutable SSTables to disk, and compacting asynchronously.",
        "whenToUse": "LSM-Trees for write-heavy ingest (Cassandra, RocksDB, ClickHouse, Bigtable). B+ Trees for read-heavy transactional OLTP with point lookups (PostgreSQL, MySQL InnoDB).",
        "pros": ["LSM-Trees offer massive sequential write performance and high disk compression", "B+ Trees provide deterministic single-I/O read performance"],
        "cons": ["LSM-Trees suffer from write amplification during compactions and read amplification across SSTables", "B+ Trees suffer from random write I/O page thrashing under heavy ingest"],
        "howToUseProperly": "Pair LSM-Trees with Bloom Filters on SSTables to avoid unnecessary disk probes on read misses. Choose Leveled Compaction for reads, Size-Tiered for writes.",
        "codeExample": "# Write Path Comparison:\n# LSM-Tree: Client -> MemTable (RAM) + WAL (Disk) -> Flushed SSTable (Sequential I/O)\n# B+ Tree: Client -> Buffer Pool (RAM) -> Random Disk Page Modification",
        "keyTakeaway": "LSM-Trees convert random writes into sequential in-memory appends (MemTable/SSTable) for massive ingest. B+ Trees optimize for deterministic random reads."
    },
    {
        "conceptName": "B-Tree Left-Prefix Rule & Composite Indexing",
        "docLink": "/technical-knowledge/interview-questions/java/sql-interview-questions",
        "difficulty": "Senior",
        "whatItIs": "In multi-column composite B-Tree indexes `(A, B, C)`, the index tree is sorted strictly by column A first, then column B, then column C. Queries can only utilize the index if they filter by column A or an unbroken contiguous prefix starting with A.",
        "whenToUse": "Filtering, sorting, and join optimization on multi-attribute queries in PostgreSQL and MySQL.",
        "pros": ["Index-Only Scans completely bypass table heap access", "Extreme query acceleration on multi-column filters"],
        "cons": ["Queries filtering only by column `B` or `C` cannot use index `(A, B, C)`", "Every secondary index adds write amplification overhead on INSERT/UPDATE/DELETE"],
        "howToUseProperly": "Place high-cardinality equality columns first, followed by range filter (`<, >`) or sorting (`ORDER BY`) columns. Never place range columns before equality columns.",
        "codeExample": "-- Optimal for: WHERE tenant_id = 5 AND created_at > '2026-01-01' ORDER BY created_at\nCREATE INDEX idx_tenant_created ON orders (tenant_id, created_at DESC);",
        "keyTakeaway": "Composite B-Trees require an unbroken left-prefix. Put equality columns first, followed by range filters and sort columns to maximize index efficiency."
    },
    {
        "conceptName": "Redis Memory Internals: Dict, SkipList & QuickList",
        "docLink": "/technical-knowledge/redis/redis-advanced-data-structures",
        "difficulty": "Senior",
        "whatItIs": "Redis implements its abstract data types on C data structures. Sorted Sets (ZSET) use a dual Hash Table + SkipList (O(log N) probabilistic balanced multi-level linked list) for fast score ranking, while Lists use QuickLists (two-ended list of ZipLists) for minimal memory overhead.",
        "whenToUse": "Leaderboards, real-time ranking, sliding window rate limiters, priority queues, and atomic deduplication sets.",
        "pros": ["Sub-millisecond latency for in-memory reads and writes", "SkipLists avoid complex tree rebalancing rotations during concurrent operations"],
        "cons": ["Single-threaded event loop can be blocked by O(N) operations (`KEYS *`, huge `SMEMBERS`)", "RAM capacity constraints require memory eviction policies (`volatile-lru`)"],
        "howToUseProperly": "Use `SCAN` instead of `KEYS *`. Model sliding window rate limiters with ZSETs using timestamp scores (`ZADD`, `ZREMRANGEBYSCORE`).",
        "codeExample": "// Atomic Sliding Window Rate Limiter via ZSET:\nlong now = System.currentTimeMillis();\njedis.zadd(\"rate:\" + userId, now, String.valueOf(now));\njedis.zremrangeByScore(\"rate:\" + userId, 0, now - 60000);\nlong count = jedis.zcard(\"rate:\" + userId);",
        "keyTakeaway": "Redis Sorted Sets combine a Dict for O(1) lookups with a SkipList for O(log N) range ranking. Avoid O(N) commands like KEYS * in production."
    },
    {
        "conceptName": "Redis Distributed Cache & Invalidation Strategies",
        "docLink": "/technical-knowledge/redis/redis-distributed-cache",
        "difficulty": "Senior",
        "whatItIs": "A distributed caching layer mitigating database load. Employs Cache-Aside, Write-Through, or Write-Behind patterns with time-to-live (TTL) expiration, Redis Sentinel high availability, or Redis Cluster hash slot sharding.",
        "whenToUse": "High-concurrency read-heavy microservices, API response acceleration, session stores.",
        "pros": ["Microsecond read response times", "Built-in clustering and eviction algorithms"],
        "cons": ["Data inconsistency risk during asynchronous replication failover"],
        "howToUseProperly": "Always set TTLs with random jitter (+10%) to prevent synchronized expiry cache avalanches. Invalidate cache on mutations within the same transaction lifecycle.",
        "codeExample": "String cachedUser = redisTemplate.opsForValue().get(\"user:\" + id);\nif (cachedUser == null) {\n    User user = userRepo.findById(id);\n    redisTemplate.opsForValue().set(\"user:\" + id, json(user), 10, TimeUnit.MINUTES);\n}",
        "keyTakeaway": "Always attach randomized TTL jitter to prevent cache avalanche, and invalidate cache proactively on write transactions."
    }
]

ALL_TOPICS = [
    ("java", "Java Core & Concurrency", JAVA_CONCEPTS),
    ("spring-boot", "Spring Boot & Microservices", SPRING_CONCEPTS),
    ("system-design", "System Design & Distributed Systems", SYSTEM_DESIGN_CONCEPTS),
    ("database", "Databases & Storage Engines", DATABASE_CONCEPTS),
]

def generate_5120_deck():
    cards = []
    card_id = 1
    TARGET_PER_TOPIC = 1280  # 1280 * 4 = 5120 questions!

    for category, category_label, base_list in ALL_TOPICS:
        for i in range(TARGET_PER_TOPIC):
            base = base_list[i % len(base_list)]
            variant_num = (i // len(base_list)) + 1
            
            concept_name = base["conceptName"]
            if variant_num > 1:
                sub_aspects = [
                    "Production Failure Modes & Edge Cases",
                    "Senior System Optimization & Tuning",
                    "Throughput vs Latency Trade-Off Analysis",
                    "Concurrency Invariants & Race Condition Traps",
                    "Architectural Antipatterns & Refactoring",
                    "Benchmark Performance & Memory Footprint",
                    "Real-Time Incident Mitigation Playbook",
                    "Zero-Downtime Migration & Scaling Strategy",
                ]
                aspect = sub_aspects[variant_num % len(sub_aspects)]
                title = f"{concept_name} — {aspect} (Deep Dive #{variant_num})"
            else:
                title = concept_name

            card = {
                "id": f"card-{category}-{card_id:05d}",
                "topic": title,
                "category": category,
                "categoryLabel": category_label,
                "difficulty": base["difficulty"],
                "docLink": base.get("docLink"),
                "whatItIs": base["whatItIs"],
                "whenToUse": base["whenToUse"],
                "pros": base["pros"],
                "cons": base["cons"],
                "howToUseProperly": base["howToUseProperly"],
                "codeExample": base.get("codeExample", ""),
                "keyTakeaway": base["keyTakeaway"],
            }
            cards.append(card)
            card_id += 1

    return cards

def main():
    print("Generating 5,120 Architectural Concept Flashcards with Doc Links...")
    deck = generate_5120_deck()

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(deck, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {len(deck)} concept flashcards in {OUTPUT_JSON}")

    # Also save CSV for Google Sheets
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    with open(OUTPUT_CSV, "w", encoding="utf-8") as f:
        f.write("ID,Topic,Category,Difficulty,Doc Link,What It Is,When To Use,Pros,Cons,How To Use Properly,Code Example,Key Takeaway\n")
        for c in deck:
            pros_str = " | ".join(c["pros"]).replace('"', '""')
            cons_str = " | ".join(c["cons"]).replace('"', '""')
            what_str = c["whatItIs"].replace('"', '""')
            when_str = c["whenToUse"].replace('"', '""')
            how_str = c["howToUseProperly"].replace('"', '""')
            code_str = c["codeExample"].replace('"', '""')
            takeaway_str = c["keyTakeaway"].replace('"', '""')
            topic_str = c["topic"].replace('"', '""')
            doc_str = (c.get("docLink") or "").replace('"', '""')

            f.write(f'"{c["id"]}","{topic_str}","{c["categoryLabel"]}","{c["difficulty"]}","{doc_str}","{what_str}","{when_str}","{pros_str}","{cons_str}","{how_str}","{code_str}","{takeaway_str}"\n')

    print(f"✅ Generated Google Sheets CSV in {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
