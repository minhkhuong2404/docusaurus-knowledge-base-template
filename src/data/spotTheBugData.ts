export interface BugSnippetsChallenge {
  id: string;
  title: string;
  category: 'concurrency' | 'spring' | 'memory' | 'database' | 'async';
  categoryLabel: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Staff';
  difficultyColor: string;
  scenario: string;
  code: string;
  buggyLineNumber: number;
  bugType: string;
  symptom: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  rootCause: string;
  fixSnippet: string;
  interviewTip: string;
}

export const BUG_CHALLENGES: BugSnippetsChallenge[] = [
  {
    id: 'dcl-volatile',
    title: 'Broken Double-Checked Locking (DCL)',
    category: 'concurrency',
    categoryLabel: 'Java Concurrency',
    difficulty: 'Senior',
    difficultyColor: '#f59e0b',
    scenario: 'High-throughput payment gateway crashes intermittently with NullPointerException on singleton instance access.',
    code: `public class PaymentGatewayManager {
    private static PaymentGatewayManager instance; // Line 2

    private PaymentGatewayManager() {
        // Heavy configuration initialization
    }

    public static PaymentGatewayManager getInstance() {
        if (instance == null) {
            synchronized (PaymentGatewayManager.class) {
                if (instance == null) {
                    instance = new PaymentGatewayManager(); // Line 11: Instruction reordering hazard
                }
            }
        }
        return instance;
    }
}`,
    buggyLineNumber: 2,
    bugType: 'Missing volatile keyword (Instruction Reordering)',
    symptom: 'Threads observe partially initialized PaymentGatewayManager object in memory, leading to NullPointerException on uninitialized fields.',
    options: [
      {
        id: 'opt-1',
        text: 'Missing volatile modifier on static instance field: JVM instruction reordering can publish partially constructed object.',
        isCorrect: true,
        explanation: 'Without volatile, JVM JIT compiler can allocate memory, assign reference to instance, and execute constructor last. Another thread sees instance != null and accesses uninitialized fields.',
      },
      {
        id: 'opt-2',
        text: 'The outer if (instance == null) check should be removed because synchronized already guarantees safety.',
        isCorrect: false,
        explanation: 'Removing the outer check turns it into synchronized method locking on every read, killing performance (100x slower).',
      },
      {
        id: 'opt-3',
        text: 'Synchronizing on PaymentGatewayManager.class causes thread starvation.',
        isCorrect: false,
        explanation: 'Synchronizing on the Class object is standard idiom for singleton synchronization.',
      },
      {
        id: 'opt-4',
        text: 'Private constructor is missing throw new IllegalStateException().',
        isCorrect: false,
        explanation: 'While reflection defensive checks are good practice, they do not cause multithreaded NPE crashes.',
      },
    ],
    rootCause: 'The `new` operator consists of 3 bytecode steps: 1) allocate memory, 2) invoke <init> constructor, 3) assign memory reference to variable. CPU/JIT reorders steps 2 and 3.',
    fixSnippet: `private static volatile PaymentGatewayManager instance;`,
    interviewTip: 'Always mention that volatile creates a happens-before relationship and inserts a CPU memory barrier (StoreStore + StoreLoad fence). Or recommend Holder class / Enum singleton.',
  },
  {
    id: 'threadlocal-leak',
    title: 'ThreadLocal Memory Leak in Thread Pool',
    category: 'memory',
    categoryLabel: 'JVM Memory & GC',
    difficulty: 'Senior',
    difficultyColor: '#f59e0b',
    scenario: 'Tomcat web container experiences OutOfMemoryError: Metaspace / Heap after 48 hours of continuous deployments.',
    code: `public class SecurityContextFilter implements Filter {
    private static final ThreadLocal<UserSession> userCtx = new ThreadLocal<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        UserSession session = authenticate(req);
        userCtx.set(session); // Line 8: Set context for thread

        chain.doFilter(req, res); // Line 10: Process request

        // Filter finishes without clean up
    }
}`,
    buggyLineNumber: 10,
    bugType: 'Missing userCtx.remove() in finally block',
    symptom: 'Worker threads retained in thread pool keep strong references to UserSession & ClassLoader, preventing GC.',
    options: [
      {
        id: 'opt-1',
        text: 'ThreadLocal.remove() is never invoked in a finally block: Tomcat worker threads reuse the same thread, leaking session objects.',
        isCorrect: true,
        explanation: 'ThreadLocalMap in Thread holds Entry with weak key (ThreadLocal) but STRONG value (UserSession). In pooled threads that never terminate, the value is never collected without .remove().',
      },
      {
        id: 'opt-2',
        text: 'ThreadLocal should be declared non-static to allow automatic garbage collection.',
        isCorrect: false,
        explanation: 'Non-static ThreadLocal causes new instances per request, worsening memory leaks and defeating context sharing.',
      },
      {
        id: 'opt-3',
        text: 'doFilter() should be marked synchronized to prevent thread collisions.',
        isCorrect: false,
        explanation: 'Synchronizing servlet filter bottlenecks all web requests to single-threaded execution.',
      },
      {
        id: 'opt-4',
        text: 'UserSession must implement java.io.Serializable.',
        isCorrect: false,
        explanation: 'ThreadLocal stores in-memory heap references and does not require Serializable.',
      },
    ],
    rootCause: 'ThreadLocalMap entries hold strong references to the value object. When application reloads or threads return to pool, the ClassLoader and value leak forever.',
    fixSnippet: `try {
    userCtx.set(session);
    chain.doFilter(req, res);
} finally {
    userCtx.remove(); // Mandatory cleanup!
}`,
    interviewTip: 'Point out that WeakReference only applies to the ThreadLocal key in ThreadLocalMap, NEVER to the value. Always clean up in a finally block.',
  },
  {
    id: 'spring-transactional-self-invocation',
    title: 'Spring @Transactional Self-Invocation Bypass',
    category: 'spring',
    categoryLabel: 'Spring Boot Pitfalls',
    difficulty: 'Mid',
    difficultyColor: '#34d399',
    scenario: 'Database operations fail with dirty state and rolled-back entries are still committed to PostgreSQL.',
    code: `public class OrderService {

    public void processOrder(OrderDto dto) {
        validateOrder(dto);
        // Self-invocation: Calls method on 'this' directly!
        executePaymentAndFulfill(dto); // Line 6
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void executePaymentAndFulfill(OrderDto dto) {
        paymentRepository.debit(dto.getAmount());
        inventoryRepository.reserve(dto.getItems());
        if (dto.isInvalid()) throw new RuntimeException("Card Declined");
    }
}`,
    buggyLineNumber: 6,
    bugType: 'AOP Proxy Bypass via Direct "this" Method Call',
    symptom: 'Transaction is completely ignored: changes are committed immediately without rollback when RuntimeException is thrown.',
    options: [
      {
        id: 'opt-1',
        text: 'Internal method call (this.executePaymentAndFulfill) bypasses the Spring CGLIB / JDK Dynamic AOP proxy interceptor.',
        isCorrect: true,
        explanation: 'Spring implements @Transactional by wrapping beans in dynamic proxies. When calling a method within the same class, the call is made directly on target object (this), never passing through TransactionInterceptor.',
      },
      {
        id: 'opt-2',
        text: 'Propagation.REQUIRES_NEW is deprecated in Spring Boot 3.x.',
        isCorrect: false,
        explanation: 'REQUIRES_NEW is fully supported and active in Spring Boot.',
      },
      {
        id: 'opt-3',
        text: 'RuntimeException is not caught by rollbackFor = Exception.class.',
        isCorrect: false,
        explanation: 'RuntimeException extends Exception, so rollbackFor = Exception.class includes it.',
      },
      {
        id: 'opt-4',
        text: 'OrderService must implement an interface for @Transactional to work.',
        isCorrect: false,
        explanation: 'Spring Boot uses CGLIB class proxies by default, which do not require interfaces.',
      },
    ],
    rootCause: 'Spring annotations (@Transactional, @Async, @Cacheable, @Secured) rely on AOP proxy interception. Direct internal invocations do not cross proxy boundaries.',
    fixSnippet: `// Solution 1: Inject self-proxy or separate into distinct services
@Service
public class OrderService {
    @Autowired
    private OrderFulfillmentService fulfillmentService;

    public void processOrder(OrderDto dto) {
        validateOrder(dto);
        fulfillmentService.executePaymentAndFulfill(dto);
    }
}`,
    interviewTip: 'Mention 3 workarounds: 1) Move to separate @Service bean, 2) Self-inject @Lazy OrderService, 3) Use AspectJ compile-time/load-time weaving (LTW) instead of Spring AOP.',
  },
  {
    id: 'simpledateformat-concurrency',
    title: 'SimpleDateFormat Multithreaded Race Condition',
    category: 'concurrency',
    categoryLabel: 'Java Concurrency',
    difficulty: 'Junior',
    difficultyColor: '#38bdf8',
    scenario: 'High-volume REST API produces corrupted dates (e.g. year 2099 or 1970) and random NumberFormatExceptions.',
    code: `public class DateUtil {
    // Shared static instance across all incoming threads
    private static final SimpleDateFormat FORMATTER = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"); // Line 3

    public static String formatTimestamp(Date date) {
        return FORMATTER.format(date); // Line 6: Concurrent race on internal calendar buffer
    }

    public static Date parseTimestamp(String str) throws ParseException {
        return FORMATTER.parse(str);
    }
}`,
    buggyLineNumber: 3,
    bugType: 'Shared Mutable Calendar State in SimpleDateFormat',
    symptom: 'Concurrent threads mutate FORMATTER.calendar concurrently, corrupting parsed output and throwing NumberFormatException.',
    options: [
      {
        id: 'opt-1',
        text: 'SimpleDateFormat is not thread-safe: internal Calendar buffer is mutated concurrently during format() and parse().',
        isCorrect: true,
        explanation: 'SimpleDateFormat maintains an internal Calendar object. When multiple threads call format() or parse() simultaneously, they overwrite each other\'s calendar fields.',
      },
      {
        id: 'opt-2',
        text: 'Date object is deprecated and should not be formatted.',
        isCorrect: false,
        explanation: 'While java.util.Date is legacy, it can be formatted; the concurrency crash is caused by SimpleDateFormat state mutation.',
      },
      {
        id: 'opt-3',
        text: 'formatTimestamp() returns null when date is older than 2000.',
        isCorrect: false,
        explanation: 'SimpleDateFormat handles all positive Unix epochs.',
      },
      {
        id: 'opt-4',
        text: 'The date pattern string contains invalid format specifiers.',
        isCorrect: false,
        explanation: '"yyyy-MM-dd HH:mm:ss" is a standard valid pattern.',
      },
    ],
    rootCause: 'SimpleDateFormat stores state in `protected Calendar calendar`. It is mutable and non-thread-safe.',
    fixSnippet: `// Use Java 8 immutable, thread-safe DateTimeFormatter
private static final DateTimeFormatter FORMATTER =
    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

public static String formatTimestamp(Instant instant) {
    return FORMATTER.format(instant.atZone(ZoneId.systemDefault()));
}`,
    interviewTip: 'Always recommend Java 8 java.time (DateTimeFormatter, Instant, LocalDateTime). If stuck on legacy Java, use ThreadLocal<SimpleDateFormat>.',
  },
  {
    id: 'completablefuture-allof-join',
    title: 'CompletableFuture.allOf() Result Extraction Hazard',
    category: 'async',
    categoryLabel: 'Async / CompletableFuture',
    difficulty: 'Staff',
    difficultyColor: '#a855f7',
    scenario: 'Microservice aggregator returns empty payload or throws premature NullPointerException because async tasks haven\'t completed.',
    code: `public UserProfile fetchUserProfile(String userId) {
    CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> userService.get(userId));
    CompletableFuture<List<Order>> ordersFuture = CompletableFuture.supplyAsync(() -> orderService.get(userId));
    CompletableFuture<CreditScore> scoreFuture = CompletableFuture.supplyAsync(() -> creditService.get(userId));

    // Wait for all futures
    CompletableFuture.allOf(userFuture, ordersFuture, scoreFuture); // Line 7: Returns new Void future!

    // Attempting to read values immediately without waiting:
    return new UserProfile(
        userFuture.getNow(null),   // Line 11: Returns null!
        ordersFuture.getNow(null), // Line 12: Returns null!
        scoreFuture.getNow(null)
    );
}`,
    buggyLineNumber: 7,
    bugType: 'Missing .join() / .get() on CompletableFuture.allOf()',
    symptom: 'Thread immediately executes getNow(null) before async background threads complete, returning null fields.',
    options: [
      {
        id: 'opt-1',
        text: 'CompletableFuture.allOf(...) returns a new CompletableFuture<Void> which must be waited on with .join() before extracting results.',
        isCorrect: true,
        explanation: 'allOf() is non-blocking and returns a future. Without calling allOf(...).join(), the main thread proceeds immediately and getNow(null) returns null.',
      },
      {
        id: 'opt-2',
        text: 'CompletableFuture.supplyAsync() uses cached thread pool which causes out of memory.',
        isCorrect: false,
        explanation: 'supplyAsync() without executor uses ForkJoinPool.commonPool() by default.',
      },
      {
        id: 'opt-3',
        text: 'UserProfile constructor must be marked async.',
        isCorrect: false,
        explanation: 'Java constructors cannot be async.',
      },
      {
        id: 'opt-4',
        text: 'You cannot pass 3 futures into CompletableFuture.allOf().',
        isCorrect: false,
        explanation: 'allOf() accepts varargs (CompletableFuture<?>... cfs) of arbitrary length.',
      },
    ],
    rootCause: 'CompletableFuture.allOf() creates a milestone coordination future; it does NOT block the calling thread by itself.',
    fixSnippet: `CompletableFuture.allOf(userFuture, ordersFuture, scoreFuture).join();

return new UserProfile(
    userFuture.join(),
    ordersFuture.join(),
    scoreFuture.join()
);`,
    interviewTip: 'In production, supply a custom bounded ThreadPoolExecutor to supplyAsync(..., customExecutor) to prevent saturating ForkJoinPool.commonPool().',
  },
  {
    id: 'concurrent-modification-list-remove',
    title: 'ConcurrentModificationException in for-each Loop',
    category: 'concurrency',
    categoryLabel: 'Java Collections & Streams',
    difficulty: 'Junior',
    difficultyColor: '#38bdf8',
    scenario: 'Batch processor crashes with ConcurrentModificationException when purging expired orders.',
    code: `public void purgeExpiredOrders(List<Order> orders) {
    for (Order order : orders) { // Line 2: Iterator created behind the scenes
        if (order.isExpired()) {
            orders.remove(order); // Line 4: Mutates list directly, invalidating iterator modCount!
        }
    }
}`,
    buggyLineNumber: 4,
    bugType: 'Direct list modification during Iterator traversal',
    symptom: 'Iterator detects mismatch between its expectedModCount and ArrayList modCount, throwing ConcurrentModificationException.',
    options: [
      {
        id: 'opt-1',
        text: 'Modifying the list directly with orders.remove() changes modCount while the enhanced for-loop Iterator is running.',
        isCorrect: true,
        explanation: 'Enhanced for-loops use Iterator.next() under the hood, which checks if modCount == expectedModCount. Calling list.remove() mutates modCount without updating the iterator, throwing ConcurrentModificationException on next tick.',
      },
      {
        id: 'opt-2',
        text: 'order.isExpired() should be synchronized.',
        isCorrect: false,
        explanation: 'The bug is single-threaded structural modification during iteration, not race condition.',
      },
      {
        id: 'opt-3',
        text: 'List<Order> must be converted to an array before passing to method.',
        isCorrect: false,
        explanation: 'Unnecessary and does not address iterator invalidation.',
      },
      {
        id: 'opt-4',
        text: 'ArrayList cannot store Order objects.',
        isCorrect: false,
        explanation: 'ArrayList can store any Java object reference.',
      },
    ],
    rootCause: 'ArrayList fast-fail iterator verifies modCount at every step. Calling list.remove() bypasses iterator.remove().',
    fixSnippet: `// Solution 1 (Modern Java 8+):
orders.removeIf(Order::isExpired);

// Solution 2 (Classic Iterator):
Iterator<Order> it = orders.iterator();
while (it.hasNext()) {
    if (it.next().isExpired()) {
        it.remove(); // Safely updates both modCount and expectedModCount
    }
}`,
    interviewTip: 'Explain the difference between Fail-Fast (ArrayList, HashMap) using modCount vs Fail-Safe / Snapshot (CopyOnWriteArrayList, ConcurrentHashMap).',
  },
  {
    id: 'hikari-connection-leak',
    title: 'Unclosed Database Connection in Raw JDBC',
    category: 'database',
    categoryLabel: 'Database & Connection Pools',
    difficulty: 'Mid',
    difficultyColor: '#34d399',
    scenario: 'HikariCP connection pool exhausts all 30 connections in 10 minutes: HikariPool-1 - Connection is not available, request timed out after 30000ms.',
    code: `public User getUserById(DataSource dataSource, long id) throws SQLException {
    Connection conn = dataSource.getConnection(); // Line 2
    PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
    ps.setLong(1, id);

    ResultSet rs = ps.executeQuery();
    if (rs.next()) {
        return mapRowToUser(rs); // Line 8: If mapping throws RuntimeException, connection is never returned!
    }

    conn.close(); // Line 11: Never reached if rs.next() is false or exception occurs
    return null;
}`,
    buggyLineNumber: 11,
    bugType: 'Connection leak from missing try-with-resources',
    symptom: 'HikariCP pool becomes starved of available connections; incoming user requests hang for 30s and fail with ConnectionTimeoutException.',
    options: [
      {
        id: 'opt-1',
        text: 'Connection, PreparedStatement, and ResultSet are not enclosed in try-with-resources: any exception or early return leaves socket open in connection pool.',
        isCorrect: true,
        explanation: 'If mapRowToUser throws an exception or code returns early, conn.close() is never called, leaking the physical connection from HikariCP.',
      },
      {
        id: 'opt-2',
        text: 'PreparedStatement syntax is invalid for PostgreSQL.',
        isCorrect: false,
        explanation: 'Standard ANSI SQL query with positional parameter is valid.',
      },
      {
        id: 'opt-3',
        text: 'HikariCP requires min-idle to be set to 100.',
        isCorrect: false,
        explanation: 'Increasing pool size only delays the leak; it will still exhaust.',
      },
      {
        id: 'opt-4',
        text: 'DataSource.getConnection() should be called inside a synchronized block.',
        isCorrect: false,
        explanation: 'HikariCP is internally concurrent using Lock-Free CAS algorithms.',
      },
    ],
    rootCause: 'JDBC Connections must be returned to the pool by calling close() in all execution branches (including exceptions).',
    fixSnippet: `String sql = "SELECT * FROM users WHERE id = ?";
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.setLong(1, id);
    try (ResultSet rs = ps.executeQuery()) {
        return rs.next() ? mapRowToUser(rs) : null;
    }
}`,
    interviewTip: 'Mention HikariCP leak detection threshold: set `leak-detection-threshold=5000` (ms) to log stack traces of threads holding connections too long.',
  },
  {
    id: 'atomic-check-then-act',
    title: 'AtomicInteger Check-Then-Act Race Condition',
    category: 'concurrency',
    categoryLabel: 'Java Concurrency',
    difficulty: 'Senior',
    difficultyColor: '#f59e0b',
    scenario: 'Flash-sale inventory service oversells 100 items to 118 customers under concurrent load.',
    code: `public class FlashSaleInventory {
    private final AtomicInteger stock = new AtomicInteger(100);

    public boolean purchaseItem() {
        // Line 5: Check-then-act race condition!
        if (stock.get() > 0) { // Thread A and B both see stock = 1
            stock.decrementAndGet(); // Both threads decrement -> stock becomes -1!
            return true;
        }
        return false;
    }
}`,
    buggyLineNumber: 5,
    bugType: 'Non-atomic Compound Check-Then-Act Operation',
    symptom: 'Two independent atomic operations (get() then decrementAndGet()) are not atomic as a single unit, allowing over-allocation.',
    options: [
      {
        id: 'opt-1',
        text: 'Separate atomic operations (stock.get() followed by stock.decrementAndGet()) create a Check-Then-Act race condition.',
        isCorrect: true,
        explanation: 'While each method on AtomicInteger is atomic, the combination of checking > 0 and then decrementing is NOT atomic. Two threads can interleave between get() and decrementAndGet().',
      },
      {
        id: 'opt-2',
        text: 'AtomicInteger is not thread-safe for integer decrements.',
        isCorrect: false,
        explanation: 'AtomicInteger.decrementAndGet() is atomic using CAS; the bug is the separate condition check.',
      },
      {
        id: 'opt-3',
        text: 'stock must be declared volatile in addition to AtomicInteger.',
        isCorrect: false,
        explanation: 'AtomicInteger internally manages a volatile int value.',
      },
      {
        id: 'opt-4',
        text: 'AtomicInteger only supports single-digit values.',
        isCorrect: false,
        explanation: 'AtomicInteger supports 32-bit signed integers (-2^31 to 2^31-1).',
      },
    ],
    rootCause: 'Combining multiple atomic calls does not make the composite block atomic. Must use CAS compareAndSet() loop or updateAndGet().',
    fixSnippet: `public boolean purchaseItem() {
    // Atomic update with CAS loop
    int remaining = stock.updateAndGet(current -> current > 0 ? current - 1 : 0);
    // Alternatively:
    return stock.getAndUpdate(cur -> cur > 0 ? cur - 1 : cur) > 0;
}`,
    interviewTip: 'Explain Compare-And-Swap (CAS) CPU instruction (CMPXCHG on x86) and ABA problem / AtomicStampedReference.',
  }
];
