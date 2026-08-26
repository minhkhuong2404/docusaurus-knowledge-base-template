import { ConceptFlashcardItem } from '../services/googleSheetQuizService';

export const INITIAL_CONCEPT_FLASHCARDS: ConceptFlashcardItem[] = [
  {
    id: 'java-c-0001',
    topic: 'Virtual Threads (Project Loom)',
    category: 'java',
    categoryLabel: 'Java Core & JVM',
    difficulty: 'Senior',
    whatItIs: 'Lightweight, user-mode threads managed by the JVM rather than the OS kernel. They decouple Java thread instances from 1:1 OS carrier threads, allowing millions of concurrent tasks to execute on a tiny pool of ForkJoin carrier threads with zero blocking overhead.',
    whenToUse: 'High-concurrency I/O-bound workloads (HTTP microservices, database querying, socket streaming, outbound REST/gRPC calls).',
    pros: [
      'Near-infinite concurrency scaling for I/O',
      'Preserves intuitive synchronous imperative code style without reactive callback hell',
      'Seamlessly integrates with existing java.lang.Thread and ThreadLocal APIs'
    ],
    cons: [
      'Pinning hazard when synchronizing on monitor locks (`synchronized`) or native JNI calls',
      'Zero performance benefit for CPU-intensive mathematical compute tasks'
    ],
    howToUseProperly: 'Use `Executors.newVirtualThreadPerTaskExecutor()`. Replace legacy `synchronized` blocks with `ReentrantLock` to prevent carrier thread pinning. Avoid pooling virtual threads—simply instantiate one per task.',
    codeExample: 'try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 10_000).forEach(i -> executor.submit(() -> {\n        var res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());\n        return res.body();\n    }));\n}',
    keyTakeaway: 'Virtual threads convert blocking I/O into cheap unpark operations on ForkJoin carriers. Never pool virtual threads; spawn them per task and use ReentrantLock instead of synchronized.',
    docLink: '/technical-knowledge/java/java-virtual-threads'
  },
  {
    id: 'java-c-0002',
    topic: 'CAS (Compare-And-Swap) & Lock-Free Atomic Primitives',
    category: 'java',
    categoryLabel: 'Java Core & JVM',
    difficulty: 'Staff',
    whatItIs: 'An atomic hardware instruction (e.g. CMPXCHG on x86) that compares a memory location against an expected value, and if identical, modifies it to a new value in a single atomic CPU cycle without operating system mutex kernel transitions.',
    whenToUse: 'Ultra-low-latency concurrency primitives, high-throughput counters, atomic reference updates, and non-blocking data structure state machines (e.g. AtomicInteger, ConcurrentLinkedQueue).',
    pros: [
      'Zero kernel-level context switching or thread suspension',
      'Immune to thread priority inversions and deadlock hazards',
      'Maximal throughput under low-to-moderate lock contention'
    ],
    cons: [
      'High CPU spin overhead under extreme contention (cache line bouncing)',
      'Vulnerable to the ABA problem unless versioned with AtomicStampedReference'
    ],
    howToUseProperly: 'Use `AtomicReference` or `VarHandle`. Pair with exponential backoff or LongAdder for high-frequency multi-threaded counter increments to distribute contention across cache lines.',
    codeExample: 'public class LockFreeStack<T> {\n    private final AtomicReference<Node<T>> head = new AtomicReference<>();\n    public void push(T val) {\n        Node<T> newHead = new Node<>(val);\n        do {\n            newHead.next = head.get();\n        } while (!head.compareAndSet(newHead.next, newHead));\n    }\n}',
    keyTakeaway: 'CAS replaces heavy kernel mutexes with CPU-level atomic compare-and-exchange. For extreme write contention, prefer LongAdder cell striping over a single AtomicLong.',
    docLink: '/technical-knowledge/java/java-locks'
  },
  {
    id: 'spring-c-0001',
    topic: 'Spring AOP Proxy Mechanism & Self-Invocation Trap',
    category: 'spring-boot',
    categoryLabel: 'Spring Boot & Microservices',
    difficulty: 'Senior',
    whatItIs: 'Spring implements cross-cutting concerns (@Transactional, @Async, @Cacheable, @Secured) using runtime dynamic proxies (JDK Dynamic Proxy for interfaces, CGLIB for classes) that wrap the target bean and intercept incoming method calls.',
    whenToUse: 'Declarative transactions, asynchronous execution, distributed caching, security auditing, and metric instrumentation.',
    pros: [
      'Clean separation of business logic from infrastructure boilerplate',
      'Declarative and highly configurable via annotations',
      'Standardized across all enterprise Spring Boot modules'
    ],
    cons: [
      'Self-invocation bypass: calls to `this.method()` bypass the AOP proxy and silently ignore annotations',
      'Cannot intercept private or final methods when using CGLIB/JDK proxies'
    ],
    howToUseProperly: 'Never call annotated methods internally via `this`. Either extract the annotated method to a separate `@Service` bean, inject a self-proxy (`@Lazy OrderService self`), or use AspectJ compile-time weaving.',
    codeExample: '@Service\npublic class OrderService {\n    @Autowired private OrderFulfillmentService fulfillmentService;\n    \n    public void process(OrderDto dto) {\n        // Calls separate bean proxy:\n        fulfillmentService.executeTransaction(dto);\n    }\n}',
    keyTakeaway: 'Spring AOP wraps beans in dynamic proxies. Direct internal method calls on `this` never cross the proxy barrier, causing @Transactional and @Async to fail silently.',
    docLink: '/technical-knowledge/spring/spring-boot-questions'
  },
  {
    id: 'sys-c-0001',
    topic: 'Redis Distributed Locks & Atomic Token Release (Redlock / Lua)',
    category: 'system-design',
    categoryLabel: 'System Design & Distributed',
    difficulty: 'Staff',
    whatItIs: 'A mutual exclusion coordination mechanism for distributed microservices. It acquires locks via `SET key value NX PX ttl` and safely releases them using an atomic Lua script that compares the stored token against the caller ID before deletion.',
    whenToUse: 'Preventing duplicate financial payments, coordinating scheduled batch jobs across Kubernetes pods, and preventing race conditions on shared external resources.',
    pros: [
      'Sub-millisecond lock acquisition latency via in-memory Redis',
      'Automatic lock expiration (TTL) prevents permanent deadlocks on worker crashes',
      'Supported by mature client frameworks like Redisson'
    ],
    cons: [
      'Clock drift and JVM Garbage Collection pauses can cause lock expiration before task completion',
      'Plain DEL command causes catastrophic race conditions by releasing other clients locks'
    ],
    howToUseProperly: 'Always store a unique UUID token as the lock value. Release the lock exclusively via an atomic Lua script verifying `redis.call("get", KEYS[1]) == ARGV[1]`. Use Redisson watchdog for automatic lease renewal.',
    codeExample: 'String lua = "if redis.call(\'get\', KEYS[1]) == ARGV[1] then return redis.call(\'del\', KEYS[1]) else return 0 end";\nredis.execute(new DefaultRedisScript<>(lua, Long.class), List.of(lockKey), requestId);',
    keyTakeaway: 'Never release a distributed lock with plain DEL. Always use an atomic Lua script verifying the unique client token to prevent releasing another workers expired lock.',
    docLink: '/technical-knowledge/system-design/caching-strategies'
  },
  {
    id: 'db-c-0001',
    topic: 'PostgreSQL MVCC (Multi-Version Concurrency Control)',
    category: 'database',
    categoryLabel: 'Databases & Storage Engines',
    difficulty: 'Senior',
    whatItIs: 'A concurrency control architecture where updates and deletes do not overwrite table rows in place. Instead, new row versions (tuples) are appended with transaction visibility metadata (xmin, xmax), allowing concurrent reads and writes without read-write blocking.',
    whenToUse: 'High-throughput transactional databases with mixed read/write query patterns requiring non-blocking snapshot isolation.',
    pros: [
      'Readers never block writers and writers never block readers',
      'Efficient implementation of Snapshot and Repeatable Read isolation levels',
      'Fast rollbacks (simply leave uncommitted row versions invisible)'
    ],
    cons: [
      'Table bloat from dead tuples requiring background VACUUM cleanup',
      'Write amplification and disk storage overhead for high-frequency update tables'
    ],
    howToUseProperly: 'Monitor autovacuum workers and table bloat (`pg_stat_user_tables`). Tune `autovacuum_vacuum_scale_factor`. Avoid ultra-long running transactions that hold back the global transaction horizon and prevent dead tuple reclamation.',
    codeExample: '-- Inspect dead tuples and vacuum state:\nSELECT relname, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum\nFROM pg_stat_user_tables WHERE n_dead_tup > 1000;',
    keyTakeaway: 'MVCC achieves non-blocking reads by maintaining multiple physical row versions tagged with xmin/xmax. Regular VACUUM is required to reclaim dead tuple disk space.',
    docLink: '/technical-knowledge/database/acid'
  }
];
