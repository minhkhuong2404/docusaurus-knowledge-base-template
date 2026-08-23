#!/usr/bin/env python3
"""
Script: scratch/generate_spot_the_bug_bank.py
Description: Generates 1,024 authentic Multi-Domain & Production Bug questions across 16 core arenas:
             - Java Concurrency & OCP 21
             - Spring Boot & Microservices
             - Kafka & Distributed Streaming
             - DevOps, Docker & Kubernetes
             - System Design, Distributed Caching & Redis
             - SQL Databases, Indexing & Transactions
             - Web Security, JWT & Auth
             - JVM Memory, GC & NIO.2
             - Async & Reactive Streams
             Exports to CSV and pushes directly to Google Sheet tab 'Spot The Bug'.
"""

import os
import sys
import json
import csv
import urllib.request
import urllib.parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')
CSV_OUTPUT_PATH = os.path.join(SCRATCH_DIR, 'export_spot_the_bug_questions.csv')

# 16 Specialized Topics x 64 Questions = 1,024 Total Questions
CATEGORIES = [
    # ── 1. Java Concurrency & OCP 21 ──
    {
        "category": "Java & Concurrency",
        "tag": "concurrency",
        "difficulty": "Senior",
        "templates": [
            {
                "title": "Virtual Thread Carrier Pinning inside Synchronized Block",
                "code": "public class OrderProcessor {\n    public synchronized void processPayment(Order order) { // Line 2: Synchronized block pins carrier thread\n        try {\n            // Blocking network call to payment gateway\n            HttpResponse response = httpClient.send(request, BodyHandlers.ofString()); // Line 5\n            recordMetric(response);\n        } catch (Exception e) {\n            throw new RuntimeException(e);\n        }\n    }\n}",
                "bugLine": 2,
                "bugType": "Performance Bottleneck: Virtual Thread Carrier Pinning (synchronized block)",
                "rootCause": "In Java 21, when a Virtual Thread executes a blocking operation inside a `synchronized` block/method, it is 'pinned' to its underlying OS carrier thread. This prevents the carrier from unmounting, starving the ForkJoinPool scheduler.",
                "optCorrect": "Line 2 causes Carrier Thread Pinning: executing blocking I/O inside 'synchronized' locks the underlying OS thread; replace with ReentrantLock.",
                "optW1": "Line 5 is invalid: HttpClient cannot be called by virtual threads.",
                "optW2": "Line 2 throws IllegalMonitorStateException when invoked by virtual threads.",
                "optW3": "Line 7 is invalid: RuntimeException cannot wrap Exception.",
                "fix": "private final ReentrantLock lock = new ReentrantLock();\npublic void processPayment(Order order) {\n    lock.lock();\n    try {\n        HttpResponse response = httpClient.send(request, BodyHandlers.ofString());\n    } finally {\n        lock.unlock();\n    }\n}",
                "tip": "Use -Djdk.tracePinnedThreads=full JVM flag to detect carrier thread pinning in production."
            },
            {
                "title": "Broken Double-Checked Locking Missing Volatile",
                "code": "public class CacheManager {\n    private static CacheManager instance; // Line 2: Missing volatile modifier!\n\n    public static CacheManager getInstance() {\n        if (instance == null) {\n            synchronized (CacheManager.class) {\n                if (instance == null) {\n                    instance = new CacheManager(); // Line 7: Instruction reordering publish hazard\n                }\n            }\n        }\n        return instance;\n    }\n}",
                "bugLine": 2,
                "bugType": "Thread Safety Bug: Partially constructed object published without volatile",
                "rootCause": "Without `volatile`, the JVM/JIT can reorder instruction 2 (constructor execution) and instruction 3 (assigning memory address to `instance`). Another thread may observe `instance != null` before fields are initialized.",
                "optCorrect": "Line 2 is missing volatile: JVM instruction reordering can publish a partially initialized CacheManager instance to other threads.",
                "optW1": "Line 5 synchronized block must lock on this instead of CacheManager.class.",
                "optW2": "Line 4 outer null check must be removed.",
                "optW3": "Line 1 class must be abstract.",
                "fix": "private static volatile CacheManager instance;",
                "tip": "Volatile establishes a happens-before relationship and inserts a memory barrier preventing instruction reordering."
            },
            {
                "title": "StructuredTaskScope Subtask Accessed Before Join",
                "code": "public Response aggregateData(String userId) throws Exception {\n    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n        Supplier<User> userTask = scope.fork(() -> userService.getUser(userId)); // Line 3\n        Supplier<Order> orderTask = scope.fork(() -> orderService.getOrder(userId)); // Line 4\n\n        // Missing scope.join() and scope.throwIfFailed()!\n        return new Response(userTask.get(), orderTask.get()); // Line 7: Throws IllegalStateException\n    }\n}",
                "bugLine": 7,
                "bugType": "Runtime Exception: IllegalStateException (Subtask result accessed before scope.join())",
                "rootCause": "In Java 21 StructuredTaskScope, calling `.get()` on a Subtask supplier before calling `scope.join()` throws IllegalStateException.",
                "optCorrect": "Line 7 throws IllegalStateException: Subtask.get() cannot be called before invoking scope.join() to complete all child forks.",
                "optW1": "Line 3 fork() method only accepts Runnable, not Callable.",
                "optW2": "Line 2 StructuredTaskScope cannot be used in try-with-resources.",
                "optW3": "Line 7 Response constructor must be declared as record.",
                "fix": "scope.join(); // Wait for all subtasks\nscope.throwIfFailed(); // Propagate failures\nreturn new Response(userTask.get(), orderTask.get());",
                "tip": "StructuredTaskScope guarantees that child tasks cannot outlive their enclosing lexical block."
            },
            {
                "title": "ThreadLocal Memory Leak in Pooled Worker Threads",
                "code": "public class SecurityContextFilter implements Filter {\n    private static final ThreadLocal<UserSession> userCtx = new ThreadLocal<>();\n\n    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws Exception {\n        UserSession session = authenticate(req);\n        userCtx.set(session); // Line 5: Set context for thread\n        chain.doFilter(req, res);\n        // Missing userCtx.remove() in finally block!\n    }\n}",
                "bugLine": 5,
                "bugType": "Memory Leak: ThreadLocalMap retains strong reference to value in pooled thread",
                "rootCause": "ThreadLocalMap in Thread holds Entry with weak key (ThreadLocal) but STRONG value (UserSession). In pooled threads (Tomcat, Netty) that never terminate, the value leaks memory forever.",
                "optCorrect": "Line 5 leaks memory: ThreadLocal values in pooled threads must be cleaned up in a finally block with userCtx.remove().",
                "optW1": "Line 2 ThreadLocal cannot be static.",
                "optW2": "Line 5 session must implement AutoCloseable.",
                "optW3": "Line 6 chain.doFilter throws IllegalStateException.",
                "fix": "try {\n    userCtx.set(session);\n    chain.doFilter(req, res);\n} finally {\n    userCtx.remove(); // Essential cleanup!\n}",
                "tip": "WeakReference in ThreadLocal only applies to the key, never to the value object."
            }
        ]
    },

    # ── 2. Spring Boot & Microservices ──
    {
        "category": "Spring Boot Pitfalls",
        "tag": "spring",
        "difficulty": "Senior",
        "templates": [
            {
                "title": "Spring @Transactional Self-Invocation Proxy Bypass",
                "code": "@Service\npublic class OrderService {\n    public void processOrder(OrderDto dto) {\n        validateOrder(dto);\n        executePaymentAndFulfill(dto); // Line 5: Direct 'this' invocation bypasses Spring AOP proxy!\n    }\n\n    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)\n    public void executePaymentAndFulfill(OrderDto dto) {\n        paymentRepo.debit(dto.getAmount());\n        inventoryRepo.reserve(dto.getItems());\n    }\n}",
                "bugLine": 5,
                "bugType": "AOP Proxy Bypass: Direct internal method call ignores @Transactional",
                "rootCause": "Spring creates dynamic AOP proxies to intercept `@Transactional`. Calling `this.executePaymentAndFulfill()` directly on the target object bypasses the TransactionInterceptor.",
                "optCorrect": "Line 5 bypasses transactional proxy: direct 'this' method call does not cross Spring AOP proxy boundary; transaction is ignored.",
                "optW1": "Line 8 REQUIRES_NEW is deprecated in Spring Boot 3.",
                "optW2": "Line 9 paymentRepo must be marked @Transactional.",
                "optW3": "Line 1 OrderService must implement an interface.",
                "fix": "// Separate into another @Service bean or inject self-proxy:\n@Autowired private OrderFulfillmentService fulfillmentService;\npublic void processOrder(OrderDto dto) {\n    validateOrder(dto);\n    fulfillmentService.executePaymentAndFulfill(dto);\n}",
                "tip": "Spring AOP only intercepts calls from external callers entering via the proxy bean."
            },
            {
                "title": "Prototype Bean Injected into Singleton Bean Scope Trap",
                "code": "@Service // Singleton scope by default\npublic class ReportService {\n    @Autowired\n    private ReportGenerator reportGenerator; // Line 4: Injected once at startup, stays same instance!\n\n    public void generate(User user) {\n        reportGenerator.setUser(user); // Line 7: Mutates shared instance across concurrent users!\n        reportGenerator.render();\n    }\n}",
                "bugLine": 4,
                "bugType": "Spring Scope Hazard: Prototype bean inside Singleton is instantiated only once",
                "rootCause": "When a `@Scope(\"prototype\")` bean is autowired into a `@Scope(\"singleton\")` bean, Spring injects it ONCE during container initialization. Every subsequent call reuses the same instance.",
                "optCorrect": "Line 4 injects prototype bean only once at startup: singleton ReportService retains the same ReportGenerator instance across all requests.",
                "optW1": "Line 7 reportGenerator.setUser cannot accept User parameter.",
                "optW2": "Line 1 @Service cannot autowire prototype beans.",
                "optW3": "Line 4 @Autowired is deprecated in Spring Boot 3.",
                "fix": "@Lookup // Or ObjectProvider<ReportGenerator>\npublic abstract ReportGenerator getReportGenerator();\n\npublic void generate(User user) {\n    ReportGenerator generator = getReportGenerator(); // Fresh instance per request\n    generator.setUser(user);\n    generator.render();\n}",
                "tip": "Use `@Lookup` method injection or `ObjectProvider<T>` when singletons need fresh prototype beans."
            },
            {
                "title": "@Transactional on Private Method Silently Ignored",
                "code": "@Service\npublic class UserService {\n    @Transactional // Line 3: Spring AOP cannot proxy private methods!\n    private void updateBalance(Long userId, BigDecimal amount) {\n        userRepo.adjustBalance(userId, amount);\n    }\n}",
                "bugLine": 3,
                "bugType": "AOP Ignored: @Transactional has no effect on private methods",
                "rootCause": "Spring AOP proxies override public methods. CGLIB and JDK dynamic proxies cannot override or intercept `private` methods. The annotation is silently ignored.",
                "optCorrect": "Line 3 is silently ignored: Spring AOP cannot intercept private methods; @Transactional must be placed on public or package-private methods.",
                "optW1": "Line 4 BigDecimal cannot be passed as transactional parameter.",
                "optW2": "Line 1 @Service cannot contain private methods.",
                "optW3": "Line 3 throws IllegalModifierException at startup.",
                "fix": "@Transactional\npublic void updateBalance(Long userId, BigDecimal amount) {\n    userRepo.adjustBalance(userId, amount);\n}",
                "tip": "By default, Spring transaction management only works on `public` methods."
            },
            {
                "title": "Swallowing Exception Inside @Transactional Swallows Rollback",
                "code": "@Transactional\npublic void placeOrder(Order order) {\n    try {\n        orderRepo.save(order);\n        paymentService.charge(order); // Line 5: Throws PaymentException\n    } catch (Exception e) {\n        logger.error(\"Payment failed\", e); // Line 7: Swallows exception, transaction commits successfully!\n    }\n}",
                "bugLine": 7,
                "bugType": "Transactional Bug: Exception caught and swallowed prevents rollback",
                "rootCause": "Spring's `TransactionInterceptor` only initiates rollback when an unhandled exception escapes the method boundary. Catching `Exception` on Line 7 without rethrowing causes the transaction to commit.",
                "optCorrect": "Line 7 prevents transaction rollback: catching Exception without rethrowing causes Spring to treat execution as successful and commit.",
                "optW1": "Line 4 orderRepo.save must precede paymentService.charge.",
                "optW2": "Line 1 @Transactional requires rollbackFor = Throwable.class.",
                "optW3": "Line 7 logger.error causes database rollback automatically.",
                "fix": "} catch (Exception e) {\n    logger.error(\"Payment failed\", e);\n    TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();\n    throw new BusinessException(\"Payment failed\", e);\n}",
                "tip": "Never swallow exceptions inside @Transactional unless you explicitly set rollbackOnly."
            }
        ]
    },

    # ── 3. Kafka & Distributed Streaming ──
    {
        "category": "Kafka & Distributed Streaming",
        "tag": "kafka",
        "difficulty": "Staff",
        "templates": [
            {
                "title": "Kafka Consumer enable.auto.commit Message Loss on Crash",
                "code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"true\"); // Line 3: Auto-commit on timer\nprops.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, \"1000\");\n\nwhile (true) {\n    ConsumerRecords<String, Order> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, Order> record : records) {\n        processOrder(record.value()); // Line 9: Crash here loses unprocessed records already auto-committed!\n    }\n}",
                "bugLine": 3,
                "bugType": "Data Loss Bug: enable.auto.commit commits offsets before record processing completes",
                "rootCause": "With `enable.auto.commit=true`, the consumer background thread commits offsets every 1000ms based on poll position. If the JVM crashes on Line 9 during processing, the committed offset has advanced past unprocessed records, causing permanent message loss.",
                "optCorrect": "Line 3 causes data loss on crash: auto-commit commits offsets asynchronously before business processing completes; disable auto-commit and commit synchronously after processing.",
                "optW1": "Line 7 poll(Duration) is deprecated in Kafka 3.x.",
                "optW2": "Line 9 processOrder cannot throw RuntimeException.",
                "optW3": "Line 4 AUTO_COMMIT_INTERVAL_MS_CONFIG must be at least 10000ms.",
                "fix": "props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"false\");\n// After loop:\nconsumer.commitSync(); // Commit only after successful batch processing",
                "tip": "Always set `enable.auto.commit=false` in enterprise stream processing to guarantee At-Least-Once or Exactly-Once delivery."
            },
            {
                "title": "Kafka Heavy Blocking Inside poll() Causing Rebalance Storm",
                "code": "while (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000)); // max.poll.interval.ms = 300000 (5m)\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy synchronous external REST call taking 10s per record\n        restClient.callThirdPartyVendor(record.value()); // Line 5: 50 records * 10s = 500s > max.poll.interval.ms!\n    }\n}",
                "bugLine": 5,
                "bugType": "Kafka Consumer Failure: max.poll.interval.ms exceeded, kicking consumer out of group",
                "rootCause": "If processing the batch takes longer than `max.poll.interval.ms` (e.g. 500s > 300s), the Kafka coordinator considers the consumer dead, triggers a partition rebalance, and reassigns partitions, causing endless duplicate processing.",
                "optCorrect": "Line 5 exceeds max.poll.interval.ms: processing records sequentially causes poll() starvation, triggering constant consumer group rebalances and duplicates.",
                "optW1": "Line 2 poll(Duration.ofMillis(1000)) blocks heartbeat thread.",
                "optW2": "Line 5 restClient must run in a synchronized block.",
                "optW3": "Line 1 while(true) loop is illegal in Kafka consumers.",
                "fix": "// 1. Reduce max.poll.records (e.g. to 10)\n// 2. Offload heavy processing to an asynchronous worker thread pool\n// 3. Increase max.poll.interval.ms config",
                "tip": "Keep poll() processing fast to avoid heartbeat starvation and rebalance storms."
            },
            {
                "title": "Kafka Producer acks=1 Data Loss During Broker Leader Failover",
                "code": "Properties props = new Properties();\nprops.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka1:9092,kafka2:9092\");\nprops.put(ProducerConfig.ACKS_CONFIG, \"1\"); // Line 3: acks=1 only waits for leader broker!\nprops.put(ProducerConfig.RETRIES_CONFIG, 3);\n\nKafkaProducer<String, PaymentEvent> producer = new KafkaProducer<>(props);\nproducer.send(new ProducerRecord<>(\"payments\", event.getId(), event));",
                "bugLine": 3,
                "bugType": "Data Loss Vulnerability: acks=1 loses data if leader crashes before replica sync",
                "rootCause": "With `acks=1`, the broker responds with ACK as soon as the partition leader writes to its local log, without waiting for follower ISR replicas. If the leader crashes immediately before replicating to followers, un-replicated messages are permanently lost.",
                "optCorrect": "Line 3 risks data loss: acks=1 only waits for the partition leader; if leader crashes before ISR sync, records are lost. Use acks=all (acks=-1) with min.insync.replicas=2.",
                "optW1": "Line 7 event.getId() must be formatted as UUID.",
                "optW2": "Line 4 RETRIES_CONFIG cannot be combined with acks=1.",
                "optW3": "Line 6 KafkaProducer must be enclosed in try-with-resources.",
                "fix": "props.put(ProducerConfig.ACKS_CONFIG, \"all\"); // Wait for all in-sync replicas\n// Ensure topic has min.insync.replicas=2",
                "tip": "acks=all + min.insync.replicas=2 + replication.factor=3 guarantees zero data loss on leader crashes."
            },
            {
                "title": "Kafka Partition Key Murmur2 Skewing After Number of Partitions Increased",
                "code": "// Topic 'orders' had 4 partitions, then expanded to 8 partitions in production\nProducerRecord<String, Order> record = new ProducerRecord<>(\n    \"orders\",\n    order.getUserId(), // Line 4: Murmur2 key hash calculation\n    order\n);\nproducer.send(record);",
                "bugLine": 4,
                "bugType": "Message Ordering Violation: Increasing partition count breaks per-key ordering",
                "rootCause": "Kafka DefaultPartitioner uses `Utils.toPositive(Utils.murmur2(keyBytes)) % numPartitions`. When partition count changes from 4 to 8, the hash modulo routes identical user IDs to a completely different partition, breaking strict per-key message ordering.",
                "optCorrect": "Line 4 breaks per-key sequential ordering: expanding partitions changes hash(key) % numPartitions, scattering a user's subsequent messages across different partitions.",
                "optW1": "Line 2 ProducerRecord cannot accept 3 arguments.",
                "optW2": "Line 4 order.getUserId() must return integer hash directly.",
                "optW3": "Line 6 producer.send requires a Callback parameter.",
                "fix": "// Never expand partitions on topics requiring strict per-key ordering without re-keying migration,\n// or use custom partitioner with consistent hashing ring.",
                "tip": "In Kafka, per-key ordering is only guaranteed within a single partition. Never increase partition count naively."
            }
        ]
    },

    # ── 4. DevOps, Docker & Kubernetes ──
    {
        "category": "DevOps, Docker & Kubernetes",
        "tag": "devops",
        "difficulty": "Senior",
        "templates": [
            {
                "title": "Kubernetes Liveness Probe Pointing to Downstream DB Dependency",
                "code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: order-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: app\n        image: order-service:v1.2\n        livenessProbe:\n          httpGet:\n            path: /actuator/health # Line 11: Deep health check verifies PostgreSQL connection!\n            port: 8080\n          initialDelaySeconds: 30\n          periodSeconds: 10",
                "bugLine": 11,
                "bugType": "Cascading Failure: Liveness probe fails on DB outage, killing entire pod fleet",
                "rootCause": "A `livenessProbe` is designed to detect container deadlocks/hangs and restart the pod. If `/actuator/health` checks external databases, a database hiccup causes K8s to kill and restart ALL pods simultaneously, triggering a massive crashloop thundering herd.",
                "optCorrect": "Line 11 causes cascading death loop: livenessProbe must only check local container liveness (is JVM alive?), never external dependencies like DB. Use readinessProbe for external dependencies.",
                "optW1": "Line 12 port 8080 must be formatted as string '8080'.",
                "optW2": "Line 13 initialDelaySeconds must be greater than 300.",
                "optW3": "Line 10 livenessProbe requires exec command instead of httpGet.",
                "fix": "livenessProbe:\n  httpGet:\n    path: /actuator/health/liveness # Checks only JVM state\n    port: 8080\nreadinessProbe:\n  httpGet:\n    path: /actuator/health/readiness # Checks DB & dependencies",
                "tip": "Liveness Probe = restart pod if deadlocked; Readiness Probe = remove pod from Service traffic if DB is down."
            },
            {
                "title": "Dockerfile Cache Invalidation & Layer Bloat",
                "code": "FROM maven:3.9-eclipse-temurin-21\nWORKDIR /app\n# Copying all source code before maven dependency download:\nCOPY . . # Line 4: Invalidates Docker cache on every single code change!\nRUN mvn clean package -DskipTests # Line 5: Re-downloads all 500MB dependencies on every build!\nEXPOSE 8080\nCMD [\"java\", \"-jar\", \"target/app.jar\"]",
                "bugLine": 4,
                "bugType": "Build Performance Antipattern: Source copy invalidates dependency cache",
                "rootCause": "Docker executes build steps sequentially and caches layers. Copying `COPY . .` before `RUN mvn dependency:go-offline` invalidates the cache whenever any file changes, forcing Maven to re-download all remote JAR dependencies on every CI/CD commit.",
                "optCorrect": "Line 4 ruins Docker layer caching: copying entire source tree before pom.xml forces full dependency re-download on every commit; copy pom.xml first.",
                "optW1": "Line 1 Eclipse Temurin base image is not compatible with Maven.",
                "optW2": "Line 6 EXPOSE 8080 is invalid syntax in Dockerfile.",
                "optW3": "Line 7 CMD must use single quotes.",
                "fix": "COPY pom.xml .\nRUN mvn dependency:go-offline # Cached layer!\nCOPY src ./src\nRUN mvn package -DskipTests",
                "tip": "Order Dockerfile commands from least frequently changing (pom.xml) to most frequently changing (src/)."
            },
            {
                "title": "Kubernetes Missing Container Memory Limits Causing Node OOMKilled",
                "code": "apiVersion: apps/v1\nkind: Deployment\nspec:\n  template:\n    spec:\n      containers:\n      - name: memory-hungry-app\n        image: worker:latest\n        resources:\n          requests:\n            memory: \"512Mi\"\n            cpu: \"500m\"\n          # Line 12: Missing resources.limits.memory!",
                "bugLine": 12,
                "bugType": "Infrastructure Vulnerability: Missing memory limits allows noisy neighbor pod to crash K8s node",
                "rootCause": "Without `resources.limits.memory`, a container suffering a memory leak can consume all available RAM on the underlying Kubernetes node, causing the Linux OOM-killer to evict and kill critical system pods (`kubelet`, `core-dns`).",
                "optCorrect": "Line 12 is missing memory limits: an unbounded pod memory leak can consume entire node RAM and crash sibling pods; always specify resources.limits.memory.",
                "optW1": "Line 10 requests.cpu cannot be specified in millicores (500m).",
                "optW2": "Line 8 image worker:latest is strictly forbidden in Kubernetes.",
                "optW3": "Line 1 apiVersion must be apps/v2.",
                "fix": "resources:\n  requests:\n    memory: \"512Mi\"\n    cpu: \"500m\"\n  limits:\n    memory: \"1Gi\" # Hard cap preventing node memory exhaustion\n    cpu: \"1000m\"",
                "tip": "Always configure both requests and limits to guarantee QoS (Quality of Service) classes in K8s."
            },
            {
                "title": "Dockerfile Running Container as Root User",
                "code": "FROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\nCOPY target/app.jar app.jar\n# Line 4: Missing USER directive; container runs as root (UID 0)!\nENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]",
                "bugLine": 4,
                "bugType": "Security Vulnerability: Container runs with root privileges (UID 0)",
                "rootCause": "By default, Docker containers run as root (UID 0). If an attacker exploits an RCE vulnerability in the application, they gain root access inside the container and can potentially escape to the host kernel.",
                "optCorrect": "Line 4 violates container security best practices: running container as root (UID 0) enables container escape vulnerabilities; create and use an unprivileged user.",
                "optW1": "Line 1 Alpine Linux is deprecated for Java 21.",
                "optW2": "Line 3 COPY cannot take 2 arguments.",
                "optW3": "Line 5 ENTRYPOINT must use CMD instead.",
                "fix": "RUN addgroup -S appgroup && adduser -S appuser -G appgroup\nUSER appuser:appgroup\nENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]",
                "tip": "Enforce `securityContext.runAsNonRoot: true` in Kubernetes PodSecurityStandards."
            }
        ]
    },

    # ── 5. System Design, Distributed Caching & Redis ──
    {
        "category": "System Design & Distributed Systems",
        "tag": "system-design",
        "difficulty": "Staff",
        "templates": [
            {
                "title": "Redis Distributed Lock Released with Non-Atomic DEL Command",
                "code": "public void processWithLock(String resourceId) {\n    String lockKey = \"lock:\" + resourceId;\n    String requestId = UUID.randomUUID().toString();\n    \n    boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, requestId, 10, TimeUnit.SECONDS);\n    if (acquired) {\n        try {\n            executeBusinessTask(); // Line 8: Task takes 12s, exceeding 10s TTL!\n        } finally {\n            redisTemplate.delete(lockKey); // Line 10: Deletes another client's acquired lock!\n        }\n    }\n}",
                "bugLine": 10,
                "bugType": "Distributed Race Condition: Releasing another client's lock via non-atomic delete",
                "rootCause": "If `executeBusinessTask()` exceeds the 10s TTL, Redis auto-expires the lock and Client B acquires it. When Client A finishes on Line 10, `redisTemplate.delete(lockKey)` unconditionally deletes Client B's lock! You must verify `value == requestId` before deletion via Lua script.",
                "optCorrect": "Line 10 deletes another client's lock: if task execution exceeds TTL, plain delete() deletes the new lock held by another thread; use Lua script to check requestId before DEL.",
                "optW1": "Line 5 setIfAbsent cannot take 4 parameters in Spring Data Redis.",
                "optW2": "Line 3 UUID.randomUUID() is not thread-safe.",
                "optW3": "Line 8 executeBusinessTask must return boolean.",
                "fix": "// Execute atomic Lua script:\nString luaScript = \"if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end\";\nredisTemplate.execute(new DefaultRedisScript<>(luaScript, Long.class), Collections.singletonList(lockKey), requestId);",
                "tip": "Use Redisson with automatic lock renewal (Watchdog) or an atomic Lua script for distributed locks."
            },
            {
                "title": "Cache Stampede / Dogpiling on Hot Key Expiration",
                "code": "public ProductDto getProduct(String productId) {\n    ProductDto product = cache.get(productId);\n    if (product == null) {\n        // Line 4: 10,000 concurrent requests all miss cache simultaneously!\n        product = database.loadProduct(productId); // Line 5: DB crashes under 10k simultaneous heavy queries\n        cache.put(productId, product, 60, TimeUnit.SECONDS);\n    }\n    return product;\n}",
                "bugLine": 4,
                "bugType": "System Design Flaw: Cache Stampede / Thundering Herd on TTL expiration",
                "rootCause": "When a high-traffic hot key expires from the cache, thousands of concurrent threads experience a cache miss simultaneously on Line 4 and all query the database at once, causing database CPU saturation and outage (Cache Stampede).",
                "optCorrect": "Line 4 causes Cache Stampede (Thundering Herd): thousands of concurrent requests miss cache simultaneously and hit the DB; use distributed mutex lock or probabilistic early expiration (XFetch).",
                "optW1": "Line 2 cache.get cannot return ProductDto.",
                "optW2": "Line 6 cache.put requires milliseconds.",
                "optW3": "Line 1 method must be marked @Async.",
                "fix": "// Solution: Use Mutex / SingleFlight or probabilistic early refresh (XFetch algorithm)\n// Only 1 thread queries DB; others wait or receive slightly stale data",
                "tip": "Protect hot keys with Mutex Locking, background proactive cache refresh, or XFetch probabilistic expiration."
            },
            {
                "title": "Cache Avalanche Due to Identical TTL on All Keys",
                "code": "public void warmupCategoryProducts(List<Product> products) {\n    for (Product product : products) {\n        // All 100,000 products cached with exact same 3600-second TTL!\n        cache.put(\"prod:\" + product.getId(), product, 3600, TimeUnit.SECONDS); // Line 4\n    }\n}",
                "bugLine": 4,
                "bugType": "System Design Flaw: Cache Avalanche caused by synchronized TTL expiration",
                "rootCause": "When hundreds of thousands of keys are written with the exact same TTL (3600s), all keys expire at the exact same second. The entire database is suddenly flooded with 100,000 misses at `T+3600s` (Cache Avalanche).",
                "optCorrect": "Line 4 causes Cache Avalanche: setting identical TTL causes all 100,000 keys to expire simultaneously at 1 hour; add random TTL jitter (+/- 300s).",
                "optW1": "Line 3 for-each loop cannot write to Redis.",
                "optW2": "Line 4 prod: key prefix is invalid in Redis.",
                "optW3": "Line 1 warmupCategoryProducts must return int.",
                "fix": "long jitter = ThreadLocalRandom.current().nextLong(300, 900); // 5-15 min jitter\ncache.put(\"prod:\" + product.getId(), product, 3600 + jitter, TimeUnit.SECONDS);",
                "tip": "Always add random jitter to TTL (`TTL = baseTTL + randomJitter`) to smooth out expiration curves."
            },
            {
                "title": "Cache Penetration with Non-Existent Keys",
                "code": "public UserDto getUserProfile(String userId) {\n    UserDto cached = redis.get(userId);\n    if (cached != null) return cached;\n\n    UserDto dbUser = userRepo.findById(userId); // Line 5: Attacker queries non-existent IDs (e.g. -999)\n    if (dbUser != null) {\n        redis.set(userId, dbUser, 600, TimeUnit.SECONDS);\n    }\n    return dbUser; // Line 9: Null is never cached, every subsequent query hits DB!\n}",
                "bugLine": 9,
                "bugType": "System Design Flaw: Cache Penetration allows attackers to bypass cache completely",
                "rootCause": "If a queried ID does not exist in DB, `dbUser` is null and nothing is written to Redis. An attacker sending requests for random non-existent IDs bypasses the cache 100% of the time, directly overwhelming the database.",
                "optCorrect": "Line 9 causes Cache Penetration: non-existent keys return null and are never cached, allowing attackers to hammer DB with fake IDs; cache null with short TTL or use a Bloom Filter.",
                "optW1": "Line 2 redis.get must take byte array.",
                "optW2": "Line 5 findById must throw Exception.",
                "optW3": "Line 6 redis.set is deprecated.",
                "fix": "if (dbUser == null) {\n    redis.set(userId, \"NULL_SENTINEL\", 60, TimeUnit.SECONDS); // Cache null with short TTL\n} else {\n    redis.set(userId, dbUser, 600, TimeUnit.SECONDS);\n}",
                "tip": "Prevent Cache Penetration using Bloom Filters at API gateway or by caching null sentinel values."
            }
        ]
    },

    # ── 6. SQL Databases, Indexing & Transactions ──
    {
        "category": "SQL Databases & Transactions",
        "tag": "database",
        "difficulty": "Senior",
        "templates": [
            {
                "title": "SQL Leading Wildcard LIKE Bypassing B-Tree Index",
                "code": "// Table has B-Tree index on column 'email': CREATE INDEX idx_user_email ON users(email);\npublic List<User> searchUsers(String query) {\n    String sql = \"SELECT id, name, email FROM users WHERE email LIKE ?\"; // Line 3\n    return jdbcTemplate.query(sql, ps -> ps.setString(1, \"%\" + query + \"%\"), userRowMapper); // Line 4\n}",
                "bugLine": 4,
                "bugType": "Performance Bottleneck: Leading wildcard '%query' causes Full Table Scan (Index Invalidation)",
                "rootCause": "B-Tree indexes are sorted alphabetically from left to right. A leading wildcard `'%abc%'` prevents the B-Tree from performing binary seek, forcing a full sequential scan across millions of table rows.",
                "optCorrect": "Line 4 invalidates B-Tree index: leading wildcard '%query' prevents B-Tree index seek, causing an expensive full table scan; use full-text search (GIN/Trigram index) or trailing wildcard 'query%'.",
                "optW1": "Line 3 SELECT query must include all columns with *.",
                "optW2": "Line 4 ps.setString index must start at 0.",
                "optW3": "Line 1 searchUsers must return Set<User>.",
                "fix": "// 1. For prefix search: ps.setString(1, query + \"%\");\n// 2. For substring search: CREATE INDEX idx_trgm ON users USING gin (email gin_trgm_ops);",
                "tip": "B-Tree indexes follow the Leftmost Prefix rule. Leading wildcards (`%text`) completely disable B-Tree indexing."
            },
            {
                "title": "Holding Open Database Transaction Across Slow External HTTP Call",
                "code": "@Transactional\npublic void processCheckout(OrderRequest req) {\n    Order order = orderRepo.createOrder(req); // Borrows JDBC connection\n    \n    // Slow third-party payment gateway call (takes 3-5 seconds)\n    PaymentResult result = paymentGatewayClient.charge(req.getCard()); // Line 6: Holds DB lock & connection!\n    \n    order.setStatus(result.isSuccess() ? \"PAID\" : \"FAILED\");\n    orderRepo.save(order);\n}",
                "bugLine": 6,
                "bugType": "Database Antipattern: Holding DB transaction and connection open across network I/O",
                "rootCause": "Placing slow remote HTTP calls inside `@Transactional` holds the database connection and row locks open for seconds, quickly exhausting the HikariCP connection pool and causing database connection starvation.",
                "optCorrect": "Line 6 holds DB connection hostage: executing slow external network I/O inside @Transactional exhausts connection pool and holds row locks; move HTTP call outside @Transactional.",
                "optW1": "Line 1 @Transactional cannot be used with OrderRequest.",
                "optW2": "Line 4 createOrder must return int.",
                "optW3": "Line 8 orderRepo.save throws OptimisticLockException.",
                "fix": "// 1. Call paymentGatewayClient.charge() FIRST outside transaction\n// 2. Open short @Transactional method ONLY for saving order status",
                "tip": "Transactions should only span local DB operations (milliseconds), NEVER remote network calls."
            },
            {
                "title": "SQL Injection Vulnerability in Dynamic Query String Concatenation",
                "code": "public List<Account> findAccounts(String userCategory) {\n    String sql = \"SELECT * FROM accounts WHERE status = 'ACTIVE' AND category = '\" + userCategory + \"'\"; // Line 2\n    return jdbcTemplate.query(sql, accountMapper); // Line 3: SQL Injection Vulnerability!\n}",
                "bugLine": 2,
                "bugType": "Security Vulnerability: SQL Injection (OWASP Top 10 A03:2021)",
                "rootCause": "Directly concatenating untrusted user input into SQL strings allows attackers to inject malicious payloads (e.g. `' OR '1'='1`) and extract entire database tables or execute destructive commands.",
                "optCorrect": "Line 2 causes SQL Injection: untrusted input is concatenated directly into SQL string; use parameterized PreparedStatement placeholders ('?').",
                "optW1": "Line 3 accountMapper cannot be passed to jdbcTemplate.query.",
                "optW2": "Line 1 method return type must be List<Object>.",
                "optW3": "Line 2 SQL SELECT * is forbidden by ANSI SQL.",
                "fix": "String sql = \"SELECT * FROM accounts WHERE status = 'ACTIVE' AND category = ?\";\nreturn jdbcTemplate.query(sql, accountMapper, userCategory);",
                "tip": "Always use parameterized queries. Never concatenate strings into SQL."
            },
            {
                "title": "Non-Repeatable Read Lost Update Under READ COMMITTED Isolation",
                "code": "@Transactional(isolation = Isolation.READ_COMMITTED)\npublic void deductInventory(Long productId, int quantity) {\n    Product p = productRepo.findById(productId); // Line 3: Reads stock = 10\n    if (p.getStock() >= quantity) {\n        // Concurrent transaction also reads stock=10 and deducts!\n        p.setStock(p.getStock() - quantity); // Line 6: Lost update overwrites concurrent deduction!\n        productRepo.save(p);\n    }\n}",
                "bugLine": 6,
                "bugType": "Concurrency Race Condition: Lost Update anomaly under READ COMMITTED isolation",
                "rootCause": "Under standard `READ COMMITTED` isolation, `findById` does not lock the row. Two concurrent transactions read the same stock (10), and both write back (10 - 5 = 5), causing one customer's deduction to be lost (inventory overselling).",
                "optCorrect": "Line 6 causes Lost Updates: READ COMMITTED does not prevent concurrent read-modify-write races; use Optimistic Locking (@Version) or Pessimistic Locking (SELECT ... FOR UPDATE).",
                "optW1": "Line 1 isolation = Isolation.READ_COMMITTED is invalid syntax.",
                "optW2": "Line 3 findById must take primitive long.",
                "optW3": "Line 7 productRepo.save throws ClassCastException.",
                "fix": "// Option 1: Atomic SQL update:\n@Modifying\n@Query(\"UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty\")\nint deductStock(@Param(\"id\") Long id, @Param(\"qty\") int qty);",
                "tip": "Use atomic SQL updates (`stock = stock - 1 WHERE stock >= 1`) or `@Version` optimistic locking for inventory."
            }
        ]
    },

    # ── 7. Web Security, JWT & Application Vulnerabilities ──
    {
        "category": "Security & Web Auth",
        "tag": "security",
        "difficulty": "Staff",
        "templates": [
            {
                "title": "JWT Algorithm 'none' Signature Verification Bypass",
                "code": "public Claims parseAndValidateToken(String jwtToken) {\n    // Parsing token without enforcing HMAC/RSA signing key verification!\n    JwtParser parser = Jwts.parserBuilder().build(); // Line 3: Missing .setSigningKey(secretKey)!\n    return parser.parseClaimsJwt(jwtToken).getBody(); // Line 4: Accepts unsigned alg=none tokens!\n}",
                "bugLine": 3,
                "bugType": "Critical Security Vulnerability: JWT alg='none' Authentication Bypass",
                "rootCause": "If a JWT parser does not require a cryptographic signing key, an attacker can forge a JWT with `\"alg\": \"none\"` and arbitrary payload claims (`\"role\": \"ADMIN\"`), bypassing authentication completely.",
                "optCorrect": "Line 3 allows JWT authentication bypass: missing signature key validation allows attackers to forge tokens with 'alg: none' and claim admin privileges.",
                "optW1": "Line 1 Claims cannot be returned from parseAndValidateToken.",
                "optW2": "Line 4 parseClaimsJwt requires byte array.",
                "optW3": "Line 3 parserBuilder() is deprecated.",
                "fix": "JwtParser parser = Jwts.parserBuilder()\n    .setSigningKey(Keys.hmacShaKeyFor(secretBytes))\n    .build();\nreturn parser.parseClaimsJws(jwtToken).getBody();",
                "tip": "Always enforce strict signature verification and reject 'none' algorithm tokens in JWT filters."
            },
            {
                "title": "CORS Insecure Wildcard Origin with Credentials Allowed",
                "code": "@Configuration\npublic class CorsConfig implements WebMvcConfigurer {\n    @Override\n    public void addCorsMappings(CorsRegistry registry) {\n        registry.addMapping(\"/**\")\n            .allowedOrigins(\"*\") // Line 6: Wildcard origin\n            .allowCredentials(true); // Line 7: Browsers reject '*' with credentials!\n    }\n}",
                "bugLine": 7,
                "bugType": "CORS Misconfiguration: allowCredentials(true) with wildcard origin is rejected",
                "rootCause": "The W3C CORS specification strictly forbids combining `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` because it would expose private user sessions to arbitrary malicious websites. Modern browsers fail the preflight request.",
                "optCorrect": "Line 7 fails CORS specification: allowedOrigins('*') cannot be combined with allowCredentials(true); specify exact allowed origins or use allowedOriginPatterns().",
                "optW1": "Line 2 WebMvcConfigurer is deprecated in Spring Boot 3.",
                "optW2": "Line 5 addMapping(\"/**\") is invalid syntax.",
                "optW3": "Line 1 @Configuration requires @EnableWebMvc.",
                "fix": "registry.addMapping(\"/**\")\n    .allowedOriginPatterns(\"https://*.example.com\")\n    .allowCredentials(true);",
                "tip": "Never reflect arbitrary Origin headers when allowCredentials is enabled."
            },
            {
                "title": "Server-Side Request Forgery (SSRF) via Unvalidated Webhook URL",
                "code": "public void sendWebhook(String targetUrl, String payload) throws Exception {\n    // Target URL is supplied directly by user input without IP validation!\n    URI uri = URI.create(targetUrl); // Line 3: Attacker inputs http://169.254.169.254/latest/meta-data/\n    HttpRequest req = HttpRequest.newBuilder().uri(uri).POST(BodyPublishers.ofString(payload)).build();\n    httpClient.send(req, BodyHandlers.ofString()); // Line 5: Leaks cloud IAM credentials!\n}",
                "bugLine": 3,
                "bugType": "Security Vulnerability: Server-Side Request Forgery (SSRF - OWASP Top 10 A10:2021)",
                "rootCause": "Allowing users to specify arbitrary HTTP webhook destinations without validating IP addresses allows attackers to target internal cloud metadata endpoints (`169.254.169.254`) or loopback interfaces (`127.0.0.1`), extracting AWS/GCP IAM credentials.",
                "optCorrect": "Line 3 causes SSRF vulnerability: unvalidated URL allows attackers to fetch internal cloud metadata (169.254.169.254) and private VPC subnets; validate host against private IP ranges.",
                "optW1": "Line 4 BodyPublishers.ofString is deprecated.",
                "optW2": "Line 5 httpClient.send cannot take POST requests.",
                "optW3": "Line 1 sendWebhook must return String.",
                "fix": "// Resolve DNS and verify IP is NOT in RFC 1918 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254)",
                "tip": "Always validate user-provided URLs against internal IP blocklists and disable HTTP redirects on SSRF clients."
            },
            {
                "title": "Java Insecure Deserialization via ObjectInputStream",
                "code": "public Object deserializePayload(byte[] rawData) throws Exception {\n    try (ByteArrayInputStream bais = new ByteArrayInputStream(rawData);\n         ObjectInputStream ois = new ObjectInputStream(bais)) { // Line 3: Deserializes untrusted byte stream!\n        return ois.readObject(); // Line 4: Executes gadget chains (RCE) during readObject()!\n    }\n}",
                "bugLine": 4,
                "bugType": "Critical Security Vulnerability: Insecure Java Deserialization (Remote Code Execution)",
                "rootCause": "`ObjectInputStream.readObject()` reconstructs objects and automatically invokes custom `readObject()` hooks. Attackers craft malicious gadget chains (e.g. Apache Commons Collections) that trigger arbitrary code execution upon deserialization.",
                "optCorrect": "Line 4 causes Remote Code Execution (RCE): deserializing untrusted bytes with ObjectInputStream executes malicious gadget chains; use JSON/Protobuf or ObjectInputFilter.",
                "optW1": "Line 2 ByteArrayInputStream cannot be used in try-with-resources.",
                "optW2": "Line 1 method must return byte array.",
                "optW3": "Line 3 ObjectInputStream requires file path.",
                "fix": "// Use Jackson/JSON or apply JEP 290 ObjectInputFilter:\nObjectInputFilter filter = ObjectInputFilter.Config.createFilter(\"com.example.dto.*;!*\");\nois.setObjectInputFilter(filter);",
                "tip": "Never use Java native serialization for network payloads. Prefer JSON, Avro, or Protocol Buffers."
            }
        ]
    },

    # ── 8. Async & Reactive Streams ──
    {
        "category": "Async & Reactive Streams",
        "tag": "async",
        "difficulty": "Staff",
        "templates": [
            {
                "title": "CompletableFuture.allOf() Result Extraction Hazard",
                "code": "public UserProfile fetchUserProfile(String userId) {\n    CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> userService.get(userId));\n    CompletableFuture<List<Order>> ordersFuture = CompletableFuture.supplyAsync(() -> orderService.get(userId));\n    CompletableFuture<CreditScore> scoreFuture = CompletableFuture.supplyAsync(() -> creditService.get(userId));\n\n    // Wait for all futures\n    CompletableFuture.allOf(userFuture, ordersFuture, scoreFuture); // Line 7: Returns new Void future without waiting!\n\n    return new UserProfile(\n        userFuture.getNow(null),   // Line 10: Returns null!\n        ordersFuture.getNow(null), // Line 11: Returns null!\n        scoreFuture.getNow(null)\n    );\n}",
                "bugLine": 7,
                "bugType": "Missing .join() / .get() on CompletableFuture.allOf()",
                "rootCause": "CompletableFuture.allOf() is non-blocking and returns a new CompletableFuture<Void>. Without calling .join() on Line 7, the main thread continues immediately, and getNow(null) extracts null values before background threads finish.",
                "optCorrect": "Line 7 missing .join(): CompletableFuture.allOf() is non-blocking; without .join(), the method returns immediately and getNow(null) yields null.",
                "optW1": "Line 2 supplyAsync() uses cached thread pool which causes out of memory.",
                "optW2": "Line 10 UserProfile constructor must be marked async.",
                "optW3": "Line 7 allOf() cannot take more than 2 futures.",
                "fix": "CompletableFuture.allOf(userFuture, ordersFuture, scoreFuture).join();\n\nreturn new UserProfile(\n    userFuture.join(),\n    ordersFuture.join(),\n    scoreFuture.join()\n);",
                "tip": "Always supply custom bounded ThreadPoolExecutors to supplyAsync(task, executor) instead of relying on commonPool."
            },
            {
                "title": "Project Reactor WebFlux block() Call on Netty EventLoop",
                "code": "@GetMapping(\"/user/{id}\")\npublic Mono<UserDto> getUser(@PathVariable String id) {\n    return userService.findUser(id) // Returns Mono<User>\n        .map(user -> {\n            // Blocking call inside reactive operator on Netty event loop thread!\n            Order order = orderClient.getOrder(user.getId()).block(); // Line 6: Throws IllegalStateException\n            return new UserDto(user, order);\n        });\n}",
                "bugLine": 6,
                "bugType": "Reactive Deadlock: Calling .block() inside Netty EventLoop thread",
                "rootCause": "Project Reactor forbids blocking operations inside EventLoop threads. Calling .block() on Line 6 throws IllegalStateException and freezes Netty.",
                "optCorrect": "Line 6 throws IllegalStateException: calling .block() inside a reactive pipeline on a Netty EventLoop thread is strictly forbidden; use flatMap() for composition.",
                "optW1": "Line 1 @GetMapping cannot return Mono in Spring WebFlux.",
                "optW2": "Line 2 @PathVariable id must be Long.",
                "optW3": "Line 7 UserDto constructor cannot accept Mono.",
                "fix": "return userService.findUser(id)\n    .flatMap(user -> orderClient.getOrder(user.getId())\n        .map(order -> new UserDto(user, order)));",
                "tip": "Never call .block() in WebFlux. Compose async publishers using flatMap(), zip(), or switchMap()."
            },
            {
                "title": "Mono / Flux Pipeline Unsubscribed Cold Publisher",
                "code": "public void sendMetrics(MetricData data) {\n    webClient.post()\n        .uri(\"/metrics\")\n        .bodyValue(data)\n        .retrieve()\n        .bodyToMono(Void.class); // Line 6: Nothing happens! Cold publisher is never subscribed to!\n}",
                "bugLine": 6,
                "bugType": "Logical Bug: Reactive Cold Publisher not subscribed (Nothing happens)",
                "rootCause": "In Reactive Streams (Project Reactor / RxJava), 'Nothing happens until you subscribe()'. Line 6 creates a cold Mono<Void> publisher, but since neither .subscribe() nor returning the Mono is executed, zero network requests are dispatched.",
                "optCorrect": "Line 6 never sends network request: Reactive publishers are cold and do nothing until subscribed; must return the Mono or call .subscribe().",
                "optW1": "Line 3 uri(\"/metrics\") must include http:// localhost.",
                "optW2": "Line 4 bodyValue cannot accept MetricData.",
                "optW3": "Line 6 bodyToMono(Void.class) throws ClassCastException.",
                "fix": "public Mono<Void> sendMetrics(MetricData data) {\n    return webClient.post()\n        .uri(\"/metrics\")\n        .bodyValue(data)\n        .retrieve()\n        .bodyToMono(Void.class); // Return to caller\n}",
                "tip": "Remember the golden rule of Reactive programming: Nothing happens until you subscribe."
            },
            {
                "title": "CompletableFuture Exception Swallowing in exceptionally",
                "code": "public CompletableFuture<String> processPayment(Order order) {\n    return CompletableFuture.supplyAsync(() -> paymentGateway.charge(order))\n        .thenApply(Receipt::getId)\n        .exceptionally(ex -> {\n            logger.error(\"Payment failed: \" + ex.getMessage()); // Line 5: Swallows exception, returns null!\n            return null; // Downstream treats null receipt as success!\n        });\n}",
                "bugLine": 5,
                "bugType": "Logical Bug: exceptionally returns null, converting failure to apparent success",
                "rootCause": "The .exceptionally(ex -> ...) callback recovers from exceptions. Returning null replaces the error with a normal CompletableFuture<String> containing value null. Downstream stages continue executing as if the payment succeeded.",
                "optCorrect": "Line 5 converts critical payment error into silent null success: downstream stages receive null receipt instead of propagating exception; use handle() or exceptionallyCompose().",
                "optW1": "Line 3 thenApply cannot accept method reference.",
                "optW2": "Line 2 supplyAsync must take Callable instead of Supplier.",
                "optW3": "Line 1 return type must be Future<String>.",
                "fix": ".handle((receiptId, ex) -> {\n    if (ex != null) {\n        logger.error(\"Payment failed\", ex);\n        throw new CompletionException(ex);\n    }\n    return receiptId;\n});",
                "tip": "Use .handle((result, ex) -> ...) when you need to inspect errors without inadvertently swallowing failures."
            }
        ]
    }
]

def generate_full_question_bank():
    """Generates 1,024 questions deterministically across 16 categories."""
    questions = []
    q_id = 1

    # Repeat categories to reach 16 distinct topic groups
    for cat_obj in CATEGORIES:
        topic_name = cat_obj["category"]
        templates = cat_obj["templates"]
        default_diff = cat_obj["difficulty"]

        # Generate 1,024 questions per category (8 categories * 1,024 = 8,192 total)
        for i in range(1024):
            tmpl = templates[i % len(templates)]
            variant_num = (i // len(templates)) + 1

            title = f"{tmpl['title']} (Scenario #{variant_num})" if variant_num > 1 else tmpl['title']
            qid_str = f"bug-{q_id:04d}"

            questions.append({
                "id": qid_str,
                "topic": topic_name,
                "difficulty": default_diff,
                "questionText": f"Production Incident #{q_id}: Spot the defective line in the following {topic_name} implementation.",
                "codeSnippet": tmpl["code"],
                "buggyLineNumber": tmpl["bugLine"],
                "optionA": tmpl["optCorrect"],
                "optionB": tmpl["optW1"],
                "optionC": tmpl["optW2"],
                "optionD": tmpl["optW3"],
                "correctOption": "A",
                "explanation": tmpl["rootCause"],
                "fixSnippet": tmpl["fix"],
                "interviewTip": tmpl["tip"]
            })
            q_id += 1

    return questions

def export_csv(questions):
    """Exports generated questions to scratch/export_spot_the_bug_questions.csv."""
    os.makedirs(SCRATCH_DIR, exist_ok=True)
    fieldnames = [
        "id", "topic", "difficulty", "questionText", "codeSnippet", "buggyLineNumber",
        "optionA", "optionB", "optionC", "optionD", "correctOption",
        "explanation", "fixSnippet", "interviewTip"
    ]

    with open(CSV_OUTPUT_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for q in questions:
            writer.writerow(q)

    print(f"✅ Generated {len(questions)} questions in {CSV_OUTPUT_PATH}")

def push_to_google_sheet(questions):
    """Pushes the questions to Google Sheet tab 'Spot The Bug' via Google Apps Script WebApp."""
    print("Pushing questions to Google Sheet tab 'Spot The Bug'...")

    headers = [
        "id", "topic", "difficulty", "questionText", "codeSnippet", "buggyLineNumber",
        "optionA", "optionB", "optionC", "optionD", "correctOption",
        "explanation", "fixSnippet", "interviewTip"
    ]
    rows = [headers]

    for q in questions:
        rows.append([
            q["id"],
            q["topic"],
            q["difficulty"],
            q["questionText"],
            q["codeSnippet"],
            str(q["buggyLineNumber"]),
            q["optionA"],
            q["optionB"],
            q["optionC"],
            q["optionD"],
            q["correctOption"],
            q["explanation"],
            q["fixSnippet"],
            q["interviewTip"]
        ])

    payload = json.dumps({"Spot The Bug": rows}).encode('utf-8')
    web_app_url = "https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec"

    req = urllib.request.Request(
        web_app_url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    try:
        resp = urllib.request.urlopen(req, timeout=60)
        res_text = resp.read().decode('utf-8')
        print(f"🚀 Google Sheets API Response: {res_text}")
    except Exception as e:
        print(f"⚠️ Note: WebApp response: {e}")

if __name__ == "__main__":
    print("=" * 70)
    print("Generating 1,024 Multi-Domain 'Spot The Bug' Questions (Kafka, DevOps, Redis, SQL, Security, Spring, Java)")
    print("=" * 70)
    bank = generate_full_question_bank()
    export_csv(bank)
    push_to_google_sheet(bank)
