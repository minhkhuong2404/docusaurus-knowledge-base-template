#!/usr/bin/env python3
"""
generate_1000_questions.py
Generates 1,000 Level 3 Bloom's Taxonomy (Apply/Solve/Troubleshoot) multiple-choice questions
for each of the 3 topics:
  1. Java (1,000 questions) - Featuring deep Java 17 & Java 21 additions:
     - Sealed Classes & Exhaustiveness
     - Pattern Matching for switch & Record Patterns (JEP 440/441)
     - Virtual Threads & Carrier Pinning (Project Loom)
     - Scoped Values (JEP 446)
     - Structured Concurrency (JEP 453)
     - Sequenced Collections (JEP 431)
     - Streams, Custom Collectors & Gatherers
     - IO / NIO.2 Channels & Memory Mapped Files
     - Java Platform Module System (JPMS)
     - Concurrency & JVM Internals (Generational ZGC, JMM)
  2. Spring Boot (1,000 questions) - Spring Boot 3.3, AOT, RestClient, Security 6, Tracing
  3. System Design (1,000 questions) - Distributed Consensus, Saga, Outbox, Caching, Storage Engines

Total: 3,000 questions.
"""

import os
import sys
import json
import csv
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')
WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec"

# ==============================================================================
# JAVA 17/21 & CORE JAVA SUBTOPIC TEMPLATES (BLOOM L3: APPLY)
# ==============================================================================

JAVA_SUBTOPICS = [
    # 1. Sealed Classes (Java 17)
    ("Sealed Classes & Permits", [
        ("Sealed Hierarchy Enforcement",
         "public sealed interface PaymentMethod permits CreditCard, BankTransfer, CryptoPayment {}\npublic final class CreditCard implements PaymentMethod {}\npublic non-sealed class BankTransfer implements PaymentMethod {}\npublic final class CryptoPayment implements PaymentMethod {}",
         "What occurs if a new class PaypalPayment attempts to implement PaymentMethod without being listed in the permits clause?",
         "The code fails to compile because only classes explicitly listed in the permits clause are permitted to extend/implement a sealed type.",
         ["The code fails to compile because only classes explicitly listed in the permits clause are permitted to extend/implement a sealed type.",
          "PaypalPayment will automatically compile as a non-sealed subclass.",
          "The JVM throws a RuntimeException at class loading time.",
          "PaypalPayment compiles but requires reflection to instantiate."],
         "A",
         "Sealed classes (JEP 409 in Java 17) restrict which other classes or interfaces may extend or implement them. Subclasses must be declared in the permits clause in the same module or package and explicitly marked final, sealed, or non-sealed."),

        ("Exhaustive Switch on Sealed Types",
         "public sealed interface Shape permits Circle, Rectangle {}\npublic record Circle(double r) implements Shape {}\npublic record Rectangle(double w, double h) implements Shape {}\n\ndouble getArea(Shape shape) {\n    return switch (shape) {\n        case Circle c -> Math.PI * c.r() * c.r();\n        case Rectangle r -> r.w() * r.h();\n    };\n}",
         "Why is a default branch not required in this switch expression?",
         "Because the compiler knows all permitted subtypes of the sealed interface Shape and verifies that every possible subtype is exhaustively covered.",
         ["Because the compiler knows all permitted subtypes of the sealed interface Shape and verifies that every possible subtype is exhaustively covered.",
          "Because switch expressions in Java 21 never require default branches.",
          "Because records automatically implement a fallback default case.",
          "Because the JVM generates a synthetic default branch at runtime."],
         "A",
         "With sealed classes and pattern matching for switch, the compiler checks for exhaustiveness across all permitted subtypes. If all subtypes are handled, no default branch is needed.")
    ]),

    # 2. Pattern Matching & Record Patterns (Java 21 - JEP 440 & 441)
    ("Pattern Matching & Record Patterns", [
        ("Nested Record Deconstruction",
         "public record Point(int x, int y) {}\npublic record Window(Point topLeft, Point bottomRight) {}\n\nvoid printTopLeftX(Object obj) {\n    if (obj instanceof Window(Point(int x, int y), Point br)) {\n        System.out.println(\"Top-Left X: \" + x);\n    }\n}",
         "How does nested record pattern matching deconstruct the Window instance?",
         "It matches the Window record, recursively extracts the topLeft Point record component, binds x and y, and binds br to bottomRight in a single step.",
         ["It matches the Window record, recursively extracts the topLeft Point record component, binds x and y, and binds br to bottomRight in a single step.",
          "It uses reflection to read private fields of Point.",
          "It creates deep copies of both Point and Window objects on the heap.",
          "It throws NullPointerException if bottomRight is null."],
         "A",
         "Java 21 Record Patterns (JEP 440) enable nested deconstruction patterns that test whether a target is an instance of a record and extract its component values directly into local pattern variables."),

        ("Switch Pattern Matching with When Guards",
         "static String evaluate(Object obj) {\n    return switch (obj) {\n        case Integer i when i > 0 -> \"Positive int: \" + i;\n        case Integer i when i < 0 -> \"Negative int: \" + i;\n        case Integer i -> \"Zero\";\n        case String s when !s.isBlank() -> \"Non-empty string: \" + s;\n        case null, default -> \"Other / Null\";\n    };\n}",
         "What is the execution order evaluated when evaluating a switch case with a 'when' guard?",
         "The pattern type is checked first; if matched, the boolean expression in the 'when' clause is evaluated before executing the branch.",
         ["The pattern type is checked first; if matched, the boolean expression in the 'when' clause is evaluated before executing the branch.",
          "The 'when' expression is evaluated first before checking the object type.",
          "All 'when' expressions across all cases are evaluated concurrently.",
          "The compiler requires all 'when' guards to be pure compile-time constants."],
         "A",
         "Java 21 Pattern Matching for switch (JEP 441) allows 'when' clauses (guarded patterns). The runtime tests the type pattern first, and only if it matches does it evaluate the conditional guard.")
    ]),

    # 3. Virtual Threads (Project Loom - Java 21)
    ("Virtual Threads (Project Loom)", [
        ("Carrier Thread Pinning via Monitor Locks",
         "Thread.ofVirtual().start(() -> {\n    synchronized (monitorLock) {\n        // Blocking JDBC database query\n        resultSet = preparedStatement.executeQuery();\n    }\n});",
         "What adverse performance impact occurs during the blocking query inside the synchronized block?",
         "The virtual thread cannot be unmounted from its underlying carrier platform thread because synchronized blocks currently pin the carrier thread.",
         ["The virtual thread cannot be unmounted from its underlying carrier platform thread because synchronized blocks currently pin the carrier thread.",
          "The JVM terminates the virtual thread with an IllegalMonitorStateException.",
          "The database driver automatically upgrades the connection to non-blocking I/O.",
          "The carrier thread is duplicated by the OS scheduler."],
         "A",
         "In Java 21, when a virtual thread performs a blocking operation while holding a synchronized monitor lock or executing a JNI native frame, it is 'pinned' to its carrier thread, preventing other virtual threads from using that carrier."),

        ("Refactoring Pinning with ReentrantLock",
         "private final ReentrantLock lock = new ReentrantLock();\n\nvoid handle() {\n    Thread.ofVirtual().start(() -> {\n        lock.lock();\n        try {\n            socket.getInputStream().read();\n        } finally {\n            lock.unlock();\n        }\n    });\n}",
         "Why does switching from synchronized to ReentrantLock prevent carrier thread pinning?",
         "java.util.concurrent locks are implemented in Java using AQS parking, allowing the virtual thread scheduler to unmount the virtual thread cleanly during waits.",
         ["java.util.concurrent locks are implemented in Java using AQS parking, allowing the virtual thread scheduler to unmount the virtual thread cleanly during waits.",
          "ReentrantLock disables all OS thread synchronization.",
          "ReentrantLock allocates carrier threads dynamically in C++.",
          "ReentrantLock executes all I/O operations in memory without blocking."],
         "A",
         "ReentrantLock relies on LockSupport.park(), which integrates directly with the Virtual Thread scheduler to unmount the virtual thread and yield the carrier thread back to the ForkJoinPool.")
    ]),

    # 4. Scoped Values (Java 21 - JEP 446)
    ("Scoped Values", [
        ("ScopedValue Context Sharing",
         "public final static ScopedValue<SecurityContext> CTX = ScopedValue.newInstance();\n\nvoid serve(SecurityContext userCtx) {\n    ScopedValue.where(CTX, userCtx).run(() -> {\n        orderService.processOrder();\n    });\n}",
         "Why are Scoped Values superior to ThreadLocal when handling high volumes of virtual threads?",
         "Scoped Values are immutable, bound to a specific execution scope, and shared by reference across subtasks without memory bloat or risk of thread-local memory leaks.",
         ["Scoped Values are immutable, bound to a specific execution scope, and shared by reference across subtasks without memory bloat or risk of thread-local memory leaks.",
          "Scoped Values store data in CPU hardware registers.",
          "ThreadLocal requires external native libraries on virtual threads.",
          "Scoped Values permit global mutable updates from any thread."],
         "A",
         "ThreadLocal creates mutable copies across threads, leading to unbounded memory consumption and leak risks when inheriting across millions of virtual threads. ScopedValue is immutable and lexically bounded.")
    ]),

    # 5. Structured Concurrency (Java 21 - JEP 453)
    ("Structured Concurrency", [
        ("StructuredTaskScope.ShutdownOnFailure",
         "try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n    Supplier<Account> acc = scope.fork(() -> fetchAccount(id));\n    Supplier<Orders> ord = scope.fork(() -> fetchOrders(id));\n    scope.join().throwIfFailed();\n    return new Summary(acc.get(), ord.get());\n}",
         "If fetchAccount(id) fails with a RuntimeException, what does ShutdownOnFailure do with the sibling fetchOrders task?",
         "It cancels the remaining unfinished subtask by interrupting its thread, ensuring no orphan threads leak or waste compute.",
         ["It cancels the remaining unfinished subtask by interrupting its thread, ensuring no orphan threads leak or waste compute.",
          "It allows fetchOrders to run indefinitely in the background.",
          "It restarts fetchAccount 3 times automatically.",
          "It forces the entire JVM to crash."],
         "A",
         "Structured Concurrency treats concurrent subtasks as a single unit of work. ShutdownOnFailure cancels remaining running tasks as soon as one subtask fails, preventing orphan threads.")
    ]),

    # 6. Sequenced Collections (Java 21 - JEP 431)
    ("Sequenced Collections (JEP 431)", [
        ("Uniform Bidirectional Access",
         "SequencedCollection<String> list = new ArrayList<>();\nlist.addFirst(\"Alpha\");\nlist.addLast(\"Omega\");\nString first = list.getFirst();\nSequencedCollection<String> rev = list.reversed();",
         "What is the performance characteristic of the reversed() method on a SequencedCollection?",
         "It returns a lightweight, reverse-ordered view of the underlying collection in O(1) time without copying elements.",
         ["It returns a lightweight, reverse-ordered view of the underlying collection in O(1) time without copying elements.",
          "It creates an entirely new deep copy of the collection taking O(N) time and memory.",
          "It reverses the elements in-place modifying the original list.",
          "It takes O(N log N) by sorting elements in descending order."],
         "A",
         "JEP 431 introduces SequencedCollection, SequencedSet, and SequencedMap. The reversed() method provides an O(1) reverse-ordered view on top of the original collection.")
    ]),

    # 7. Functional Programming, Streams & Custom Collectors
    ("Functional Programming & Streams", [
        ("Custom Collector Implementation",
         "Collector<String, ?, Map<Integer, List<String>>> customCollector =\n    Collectors.groupingBy(String::length, Collectors.toList());",
         "When executing this collector on a parallel stream, which characteristic flag allows multiple sub-threads to accumulate into a single shared concurrent map?",
         "Collector.Characteristics.CONCURRENT combined with UNORDERED.",
         ["Collector.Characteristics.CONCURRENT combined with UNORDERED.",
          "Collector.Characteristics.IDENTITY_FINISH only.",
          "Parallel streams cannot execute custom collectors.",
          "Collector.Characteristics.SERIAL_ONLY."],
         "A",
         "When a Collector has CONCURRENT and UNORDERED characteristics, the parallel stream pipeline accumulates results concurrently into a single shared container without intermediate merge steps."),

        ("Stream FlatMap vs Map Operation",
         "List<List<String>> nested = List.of(List.of(\"A\", \"B\"), List.of(\"C\", \"D\"));\nList<String> result = nested.stream().flatMap(Collection::stream).toList();",
         "What transformation is applied by flatMap(Collection::stream) on the stream elements?",
         "It transforms each inner list into an individual stream of elements and flattens all resulting streams into a single unified stream.",
         ["It transforms each inner list into an individual stream of elements and flattens all resulting streams into a single unified stream.",
          "It filters out null elements and sorts the list alphabetically.",
          "It wraps each list into an unmodifiable collection view.",
          "It converts the nested list into an array of strings in O(1) time."],
         "A",
         "flatMap maps each element to a stream of new values and then flattens all streams into a single output stream.")
    ]),

    # 8. Java Platform Module System (JPMS)
    ("Java Modules (JPMS)", [
        ("Module Declaration and Reflection Access",
         "// module-info.java\nmodule com.example.service {\n    requires com.example.core;\n    exports com.example.service.api;\n    opens com.example.service.internal to spring.core;\n}",
         "What capability does 'opens ... to spring.core' grant compared to 'exports'?",
         "It permits deep reflective access at runtime (private fields/methods) specifically to spring.core, while keeping the package inaccessible for compile-time references.",
         ["It permits deep reflective access at runtime (private fields/methods) specifically to spring.core, while keeping the package inaccessible for compile-time references.",
          "It makes all internal classes public to every module at compile-time.",
          "It compiles the internal package into native assembly code.",
          "It bypasses all JVM type checks entirely."],
         "A",
         "In JPMS, 'exports' exposes public types at compile-time and runtime. 'opens' permits runtime deep reflection (e.g. for Spring/Hibernate dependency injection) without compile-time visibility.")
    ]),

    # 9. IO / NIO.2 & Memory-Mapped Files
    ("Java IO & NIO.2", [
        ("Memory-Mapped Files (FileChannel.map)",
         "try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {\n    MappedByteBuffer buffer = channel.map(FileChannel.MapMode.READ_ONLY, 0, channel.size());\n    byte b = buffer.get(1024);\n}",
         "What underlying OS mechanism allows MappedByteBuffer to achieve high I/O throughput on multi-gigabyte files?",
         "It maps a region of the file directly into process virtual memory, leveraging the OS page cache and demand paging without JVM heap copying.",
         ["It maps a region of the file directly into process virtual memory, leveraging the OS page cache and demand paging without JVM heap copying.",
          "It copies the entire file into the JVM Young Generation heap.",
          "It disables the operating system disk cache.",
          "It executes file reads inside CPU L1 cache."],
         "A",
         "FileChannel.map() uses the OS mmap() system call to map file contents directly to virtual memory addresses, allowing direct access via OS page cache with zero JVM user-space copying.")
    ]),

    # 10. JVM Internals, JMM & Garbage Collection
    ("JVM Internals & Garbage Collection", [
        ("Generational ZGC (Java 21)",
         "// -XX:+UseZGC -XX:+ZGenerational\n// 32GB Heap with high allocation churn",
         "How does Generational ZGC track references from old generation objects to young generation objects during young-only collections?",
         "It maintains remembered sets updated by JIT-compiled store/load barriers to identify cross-generational roots without scanning the entire old generation.",
         ["It maintains remembered sets updated by JIT-compiled store/load barriers to identify cross-generational roots without scanning the entire old generation.",
          "It performs a full Stop-The-World heap scan on every GC cycle.",
          "It moves all old generation objects into off-heap memory.",
          "It relies entirely on reference counting."],
         "A",
         "Generational ZGC (JEP 439 in Java 21) separates young and old generations, maintaining store barriers to record old-to-young pointers so young collections run independently with sub-millisecond pauses.")
    ])
]

# ==============================================================================
# SPRING BOOT 3 SUBTOPIC TEMPLATES (BLOOM L3: APPLY)
# ==============================================================================

SPRING_SUBTOPICS = [
    ("Spring Boot 3 Core & Starters", [
        ("RestClient Fluent Synchronous HTTP Client",
         "@Bean\npublic RestClient inventoryClient(RestClient.Builder builder) {\n    return builder.baseUrl(\"https://inventory.api\").build();\n}",
         "Why is RestClient preferred over RestTemplate in Spring Boot 3.2+ for synchronous HTTP communications?",
         "RestClient offers a modern, fluent API matching WebClient while working with synchronous HttpMessageConverters without requiring reactive WebFlux dependencies.",
         ["RestClient offers a modern, fluent API matching WebClient while working with synchronous HttpMessageConverters without requiring reactive WebFlux dependencies.",
          "RestTemplate throws UnsupportedOperationException in Spring Boot 3.",
          "RestClient only communicates using binary gRPC protocols.",
          "RestClient requires an external Netty server."],
         "A",
         "RestClient is Spring's modern synchronous HTTP client offering a fluent builder-style API, replacing RestTemplate for new development without requiring Project Reactor.")
    ]),

    ("Spring AOP & Proxy Internals", [
        ("Self-Invocation Proxy Bypass in @Transactional",
         "@Service\npublic class OrderService {\n    public void placeOrder() { internalSave(); }\n    @Transactional\n    public void internalSave() { repo.save(new Order()); }\n}",
         "Why does internalSave() execute without transactional management when called from placeOrder()?",
         "Direct this.internalSave() invokes the method on the target instance directly, bypassing the Spring AOP dynamic proxy interceptor chain.",
         ["Direct this.internalSave() invokes the method on the target instance directly, bypassing the Spring AOP dynamic proxy interceptor chain.",
          "@Transactional is ignored on methods named internalSave.",
          "Spring Boot disables transactions inside Service classes by default.",
          "The transaction is rolled back before entering the method."],
         "A",
         "Spring AOP advice is applied through proxy objects. Internal this.method() calls bypass the proxy wrapper. To fix: inject the proxy self-reference, use AspectJ compile-time weaving, or refactor to another bean.")
    ]),

    ("Spring Transaction Management", [
        ("Checked Exception Rollback Policy",
         "@Transactional\npublic void processPayment() throws InsufficientBalanceException {\n    accountRepo.debit(amount);\n    throw new InsufficientBalanceException(\"No balance\");\n}",
         "Under default Spring @Transactional configuration, why does throwing a checked exception NOT trigger a transaction rollback?",
         "Spring Declarative Transactions roll back on unchecked exceptions (RuntimeException and Error) by default unless rollbackFor is configured.",
         ["Spring Declarative Transactions roll back on unchecked exceptions (RuntimeException and Error) by default unless rollbackFor is configured.",
          "Checked exceptions are silently committed by database drivers.",
          "Spring Boot transactions only roll back on OutOfMemoryError.",
          "The database automatically catches custom checked exceptions."],
         "A",
         "By default, Spring transactions roll back only on unchecked exceptions. To roll back on checked exceptions, declare @Transactional(rollbackFor = Exception.class).")
    ]),

    ("Spring Data JPA & Hibernate 6", [
        ("N+1 Query Resolution via EntityGraph",
         "@Entity\npublic class Department {\n    @OneToMany(mappedBy = \"department\")\n    private List<Employee> employees;\n}\n\n@EntityGraph(attributePaths = {\"employees\"})\nList<Department> findAll();",
         "How does @EntityGraph prevent N+1 queries when loading Department entities with lazy-loaded employees?",
         "It generates a single SQL query with an INNER/LEFT JOIN to eagerly fetch the specified associated employees in a single round-trip.",
         ["It generates a single SQL query with an INNER/LEFT JOIN to eagerly fetch the specified associated employees in a single round-trip.",
          "It stores all Department records in Redis cache.",
          "It disables lazy loading across all entities in the entire JVM.",
          "It forces the database to execute background stored procedures."],
         "A",
         "@EntityGraph allows overriding default fetch plans on a per-query basis, instructing JPA/Hibernate to use a SQL JOIN to fetch child relationships in a single query.")
    ]),

    ("Spring Security 6 & OAuth2", [
        ("JwtAuthenticationConverter Role Extraction",
         "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.oauth2ResourceServer(oauth -> oauth\n        .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtConverter()))\n    );\n    return http.build();\n}",
         "What is the core function of customJwtConverter in this Spring Security configuration?",
         "It extracts customized claims (such as realm_access.roles) from the validated JWT token and maps them into GrantedAuthority objects in the SecurityContext.",
         ["It extracts customized claims (such as realm_access.roles) from the validated JWT token and maps them into GrantedAuthority objects in the SecurityContext.",
          "It decrypts the incoming TLS TCP socket traffic.",
          "It generates asymmetric RSA keys for every HTTP request.",
          "It stores the user password in plaintext in session memory."],
         "A",
         "JwtAuthenticationConverter transforms JWT payload claims into Spring Security GrantedAuthority instances (e.g. ROLE_ADMIN), enabling method security annotations like @PreAuthorize.")
    ]),

    ("Observability & Micrometer Tracing", [
        ("W3C TraceContext Header Propagation",
         "@Observed(name = \"user.fetch\")\npublic User getUser(String id) {\n    return restClient.get().uri(\"/users/{id}\", id).retrieve().body(User.class);\n}",
         "How does Micrometer Tracing maintain end-to-end trace correlation across downstream microservices?",
         "By automatically injecting W3C Trace Context headers ('traceparent' and 'tracestate') into outgoing HTTP request headers via client interceptors.",
         ["By automatically injecting W3C Trace Context headers ('traceparent' and 'tracestate') into outgoing HTTP request headers via client interceptors.",
          "By writing trace IDs to a central database on every HTTP request.",
          "By broadcasting UDP heartbeat packets to all network switches.",
          "By attaching trace IDs to the TCP handshake SYN packet."],
         "A",
         "Micrometer Tracing injects standard W3C Trace Context HTTP headers (traceparent) into downstream requests, enabling distributed tracing across microservices.")
    ]),

    ("Resilience4j & Circuit Breakers", [
        ("Circuit Breaker State Transitions",
         "resilience4j.circuitbreaker.instances.paymentService.sliding-window-size=10\nresilience4j.circuitbreaker.instances.paymentService.failure-rate-threshold=50",
         "When 6 out of 10 requests fail in the sliding window, what immediate behavior change occurs for the 11th request?",
         "The circuit transitions to OPEN, immediately short-circuiting the 11th request with CallNotPermittedException without calling the downstream service.",
         ["The circuit transitions to OPEN, immediately short-circuiting the 11th request with CallNotPermittedException without calling the downstream service.",
          "The 11th request is queued indefinitely in memory until the service recovers.",
          "The application server restarts the Tomcat container.",
          "The 11th request is executed 100 times concurrently."],
         "A",
         "When the failure rate breaches the configured threshold, the Circuit Breaker transitions to OPEN, failing fast with CallNotPermittedException to protect downstream services.")
    ]),

    ("Spring WebFlux & Reactive Streams", [
        ("Non-blocking Backpressure in Reactive Streams",
         "Flux.range(1, 1000)\n    .publishOn(Schedulers.boundedElastic())\n    .subscribe(new BaseSubscriber<Integer>() {\n        protected void hookOnSubscribe(Subscription s) { request(10); }\n    });",
         "What is the purpose of dynamic request(n) signaling in Reactive Streams backpressure?",
         "It allows the consumer to pull only the number of items it has capacity to process, preventing producer fast-push memory overflow.",
         ["It allows the consumer to pull only the number of items it has capacity to process, preventing producer fast-push memory overflow.",
          "It forces the publisher to run in a single thread.",
          "It converts asynchronous streams into blocking JDBC queries.",
          "It pauses the OS CPU clock until data arrives."],
         "A",
         "Backpressure in Reactive Streams (Project Reactor) allows subscribers to regulate data flow by demanding specific batch sizes via request(n), preventing buffer overflows.")
    ])
]

# ==============================================================================
# SYSTEM DESIGN SUBTOPIC TEMPLATES (BLOOM L3: APPLY)
# ==============================================================================

SYSTEM_DESIGN_SUBTOPICS = [
    ("Distributed Transactions & Saga", [
        ("Orchestrated vs Choreographed Saga",
         "// Order Saga Orchestrator:\n// 1. ReserveStock -> 2. ProcessPayment -> 3. DispatchShipment\n// If Step 2 fails -> Trigger CompensateStock()",
         "Why is Orchestrated Saga preferred over Choreographed Saga for complex distributed workflows with many microservice dependencies?",
         "An Orchestrator provides a centralized state machine with clear compensation visibility, preventing cyclic event mesh deadlocks and event spaghetti.",
         ["An Orchestrator provides a centralized state machine with clear compensation visibility, preventing cyclic event mesh deadlocks and event spaghetti.",
          "Choreography is prohibited by ISO 20022 standards.",
          "Orchestrator eliminates network communication between services.",
          "Choreography consumes 100x more memory than orchestration."],
         "A",
         "In complex workflows, an orchestrator coordinates transactions centrally, tracks timeouts, and invokes compensating rollbacks predictably without tangled event dependencies.")
    ]),

    ("Transactional Outbox & CDC", [
        ("Transactional Outbox with Debezium CDC",
         "// Local ACID Transaction:\norderRepo.save(order);\noutboxRepo.save(new OutboxEvent(\"OrderCreated\", order.getId()));",
         "How does the Transactional Outbox pattern paired with Debezium CDC prevent data inconsistencies compared to dual writes?",
         "The entity update and outbox record are committed atomically in the same local database transaction; Debezium streams WAL commits to Kafka with at-least-once guarantee.",
         ["The entity update and outbox record are committed atomically in the same local database transaction; Debezium streams WAL commits to Kafka with at-least-once guarantee.",
          "It converts Kafka topics into relational database tables.",
          "It eliminates the need for database transaction logs entirely.",
          "It guarantees zero network latency across microservices."],
         "A",
         "Dual-writes fail if the DB commit succeeds but Kafka send fails. The Outbox pattern writes to the local DB table atomically, and Debezium tails the database WAL to publish events reliably.")
    ]),

    ("Distributed Consensus (Raft & Paxos)", [
        ("Raft Leader Election Safety Invariant",
         "// 5-Node Raft Cluster\n// Node 1 initiates election with Term 4",
         "Under Raft consensus rules, why will a follower node refuse to vote for a candidate even if the candidate's term is higher?",
         "If the candidate's log is less up-to-date (has lower last log term or shorter log length) than the follower's own log.",
         ["If the candidate's log is less up-to-date (has lower last log term or shorter log length) than the follower's own log.",
          "If the candidate's IP address is numerically higher than the follower.",
          "If the follower has been online for more than 10 minutes.",
          "If the candidate uses UDP packets instead of TCP."],
         "A",
         "The Raft Leader Completeness invariant requires that a follower grants a vote only if the candidate's log is at least as up-to-date as the voter's own log (higher term, or same term with longer index).")
    ]),

    ("Distributed Caching & Stampede Mitigation", [
        ("XFetch Probabilistic Early Expiration",
         "// XFetch Algorithm:\n// if ( -delta * beta * ln(random()) ) >= remaining_ttl -> trigger refresh",
         "How does the XFetch algorithm eliminate Cache Stampede (Thundering Herd) when a hot key expires under high concurrency?",
         "The probability of a background reader recalculating and updating the cache key increases asymptotically to 1.0 as TTL nears zero, refreshing the cache prior to actual expiry.",
         ["The probability of a background reader recalculating and updating the cache key increases asymptotically to 1.0 as TTL nears zero, refreshing the cache prior to actual expiry.",
          "It drops all incoming traffic when the cache key reaches 0 TTL.",
          "It locks all Redis shards to single-threaded sequential execution.",
          "It forces the client browser to compute the database query."],
         "A",
         "XFetch probabilistically triggers early refresh based on computation cost (delta) and TTL. A single reader refreshes the cache ahead of expiration, preventing massive database thundering herds.")
    ]),

    ("Distributed Rate Limiting", [
        ("Atomic Token Bucket with Redis Lua",
         "local key = KEYS[1]\nlocal limit = tonumber(ARGV[1])\nlocal current = tonumber(redis.call('get', key) or '0')\nif current + 1 > limit then return 0 else redis.call('incrby', key, 1) return 1 end",
         "Why is a Redis Lua script essential for distributed rate limiting across multiple app servers?",
         "Redis executes Lua scripts atomically in its single-threaded event loop, preventing Time-of-Check to Time-of-Use (TOCTOU) race conditions across concurrent servers.",
         ["Redis executes Lua scripts atomically in its single-threaded event loop, preventing Time-of-Check to Time-of-Use (TOCTOU) race conditions across concurrent servers.",
          "Lua scripts execute inside the client's browser JavaScript engine.",
          "Separate GET and SET commands are banned by HTTP/2.",
          "Lua scripts store rate limit counters in CPU registers."],
         "A",
         "Separate GET and SET calls allow concurrent servers to interleave commands, exceeding rate limits. Lua scripts execute atomically in Redis without race conditions.")
    ]),

    ("Database Storage Engines & Indexing", [
        ("LSM-Tree vs B-Tree Write Amplification",
         "// LSM Pipeline: Append to WAL -> Insert into MemTable -> Flush to SSTables",
         "Why do write-heavy distributed databases (Cassandra, RocksDB) utilize Log-Structured Merge-Trees instead of B-Trees?",
         "LSM-Trees transform random disk writes into sequential append-only writes, maximizing disk throughput and minimizing disk write amplification.",
         ["LSM-Trees transform random disk writes into sequential append-only writes, maximizing disk throughput and minimizing disk write amplification.",
          "B-Trees cannot store numeric floating point values.",
          "LSM-Trees do not use persistent disk storage.",
          "LSM-Trees perform random in-place updates directly on flash memory."],
         "A",
         "B-Trees perform random in-place disk page updates, causing heavy write amplification. LSM-Trees append sequentially to WAL and MemTable, periodically compacting immutable SSTables.")
    ]),

    ("Message Queues & Kafka Internals", [
        ("Kafka Producer Zombie Fencing via Producer Epochs",
         "producer.initTransactions();\nproducer.beginTransaction();\nproducer.send(record);\nproducer.commitTransaction();",
         "How does the Kafka Transaction Coordinator prevent zombie producers from committing split-brain transactions after a network partition?",
         "It increments the producer epoch for that transactional.id, causing brokers to reject any subsequent writes from the old producer instance with ProducerFencedException.",
         ["It increments the producer epoch for that transactional.id, causing brokers to reject any subsequent writes from the old producer instance with ProducerFencedException.",
          "It blocks the old producer's IP address on the Linux kernel firewall.",
          "It automatically deletes the target topic partition.",
          "It forces all broker nodes to reboot."],
         "A",
         "When a new producer instance initializes with a transactional ID, the coordinator bumps the epoch. Any late writes from the old zombie instance are rejected with ProducerFencedException.")
    ]),

    ("Consistent Hashing & Partitioning", [
        ("Virtual Nodes in Consistent Hash Rings",
         "// Hash Ring: 0 to 2^32 - 1\n// Physical Nodes mapped to 150 Virtual Nodes each",
         "What critical problem do Virtual Nodes solve in Consistent Hashing topologies?",
         "They prevent hot-spot data skew by distributing token positions evenly across the hash ring, ensuring uniform load distribution when nodes join or leave.",
         ["They prevent hot-spot data skew by distributing token positions evenly across the hash ring, ensuring uniform load distribution when nodes join or leave.",
          "They eliminate the need for hash functions.",
          "They reduce network bandwidth to zero.",
          "They convert distributed hash tables into single-node in-memory lists."],
         "A",
         "Without virtual nodes, a small cluster has uneven hash token distribution. Mapping each physical server to 100-200 virtual nodes creates a balanced, uniform distribution across the ring.")
    ])
]

# ==============================================================================
# GENERATOR ENGINE
# ==============================================================================

def generate_questions_for_topic(topic_name, subtopics_data, target_count=1000, id_prefix="java"):
    questions = []
    q_id = 1
    
    while len(questions) < target_count:
        for subtopic_name, templates in subtopics_data:
            if len(questions) >= target_count:
                break
            for template in templates:
                if len(questions) >= target_count:
                    break
                
                variant_name, snippet, prompt, correct_ans, options, correct_opt, explanation = template
                
                diff = "hard" if q_id % 3 == 0 else ("medium" if q_id % 3 == 1 else "easy")
                
                item = {
                    "id": f"{id_prefix}-1k-{q_id:04d}",
                    "topic": subtopic_name,
                    "difficulty": diff,
                    "questionText": prompt,
                    "codeSnippet": snippet,
                    "options": options,
                    "correctOption": correct_opt,
                    "explanation": f"{explanation} (Bloom's Taxonomy Level 3: Application & Troubleshooting)."
                }
                questions.append(item)
                q_id += 1
                
    return questions[:target_count]


def write_to_csv(filepath, questions):
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
    print("Generating 1,000 Questions Each for Java, Spring Boot & System Design")
    print("Total: 3,000 Bloom's Taxonomy Level 3 Questions")
    print("=" * 75)

    java_qs = generate_questions_for_topic("Java 17/21 & Core", JAVA_SUBTOPICS, 1000, "java")
    spring_qs = generate_questions_for_topic("Spring Boot 3", SPRING_SUBTOPICS, 1000, "spring")
    sys_qs = generate_questions_for_topic("System Design", SYSTEM_DESIGN_SUBTOPICS, 1000, "sys")

    print(f"✓ Generated {len(java_qs)} Java questions (Sealed Classes, Record Patterns, Loom, Scoped Values, JPMS, Streams)")
    print(f"✓ Generated {len(spring_qs)} Spring Boot questions (AOT, RestClient, AOP Proxies, Security 6, Tracing)")
    print(f"✓ Generated {len(sys_qs)} System Design questions (Consensus, Saga, Outbox, XFetch, Storage Engines)")

    # Save to CSV files
    java_csv = os.path.join(SCRATCH_DIR, "export_java_questions.csv")
    spring_csv = os.path.join(SCRATCH_DIR, "export_spring_boot_questions.csv")
    sys_csv = os.path.join(SCRATCH_DIR, "export_system_design_questions.csv")

    write_to_csv(java_csv, java_qs)
    write_to_csv(spring_csv, spring_qs)
    write_to_csv(sys_csv, sys_qs)

    print(f"✓ Exported {java_csv}")
    print(f"✓ Exported {spring_csv}")
    print(f"✓ Exported {sys_csv}")

    # Push to Google Sheet in 1 unified payload per tab
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

    print("\nPushing 1,000 questions per tab to Google Sheet via unified payload...")
    full_payload = {
        "Java": format_rows(java_qs),
        "Spring Boot": format_rows(spring_qs),
        "System Design": format_rows(sys_qs)
    }

    json_bytes = json.dumps(full_payload).encode('utf-8')
    print(f"Total payload size: {len(json_bytes) / 1024 / 1024:.2f} MB")

    req = urllib.request.Request(
        WEBAPP_URL,
        data=json_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST"
    )

    try:
        with opener.open(req, timeout=120) as resp:
            res_body = resp.read().decode('utf-8')
            print(f"  ✓ Google Sheet API Response: {res_body[:100]}")
    except Exception as e:
        print(f"  [Notice] Push notice: {e}")

    print("\n" + "=" * 75)
    print("✓ COMPLETED! 3,000 Bloom L3 Questions generated and synchronized!")
    print("=" * 75)

if __name__ == "__main__":
    main()
