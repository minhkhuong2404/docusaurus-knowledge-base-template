    ---
id: hibernate-transactions-performance
title: "Hibernate Transactions & Performance in Spring Apps"
sidebar_label: Hibernate Transactions & Performance
description: Deep dive into Hibernate transaction semantics, persistence context lifecycle, flush modes, propagation, locking strategies, N+1 diagnostics, second-level cache, batch processing, and production performance tuning in Spring applications.
tags: [hibernate, spring, transactions, performance, jpa, persistence-context, n-plus-one, caching, locking]
---
import JpaEntityLifecycleDiagram from '@site/src/components/JpaEntityLifecycleDiagram';

# Hibernate Transactions & Performance in Spring Apps

Hibernate is the most widely used JPA implementation in the Java ecosystem, but it is also one of the most commonly misunderstood. The gap between what developers think Hibernate is doing and what it actually executes against the database is the root cause of the majority of production performance incidents in Spring applications. This guide covers Hibernate's internal mechanics deeply — transaction boundaries, persistence context lifecycle, flush timing, locking, N+1 diagnostics, caching, and batch processing.

---

## 1. The Persistence Context — The Heart of Hibernate

Before understanding transactions, you must understand the **persistence context** (also called the first-level cache or the Hibernate Session). Everything Hibernate does flows through it.

### What Is the Persistence Context?

The persistence context is an **in-memory map** of all entities that Hibernate is currently tracking within a unit of work. Every entity you load, save, or query within a transaction is registered in this map.

<JpaEntityLifecycleDiagram initialTab="dirty_checking" />

### Entity States

Every entity object exists in one of four states:

| State | Lifecycle Scope | Dirty Checking? | Database Synchronization |
|---|---|---|---|
| **NEW (Transient)** | Instantiated with `new` | ❌ No | No row in DB yet. Lost if GC runs. |
| **MANAGED (Persistent)** | In active Persistence Context | ✅ Yes | Auto-flushed on commit/flush via dirty checking. |
| **DETACHED** | Session closed or `clear()` called | ❌ No | Has DB ID, but modifications ignored until `merge()`. |
| **REMOVED** | `em.remove()` called on managed entity | ❌ No | Scheduled for SQL `DELETE` on flush/commit. |

**Key State Transitions:**
- `new Entity()` ➔ `save()` / `persist()` ➔ **MANAGED**
- **MANAGED** ➔ Session closes / `detach()` ➔ **DETACHED**
- **DETACHED** ➔ `merge()` ➔ **MANAGED** *(new managed reference returned)*
- **MANAGED** ➔ `delete()` / `remove()` ➔ **REMOVED** ➔ `flush()` ➔ Deleted from DB

```java
@Transactional
public void demonstrateEntityStates() {
    // TRANSIENT: not tracked
    User newUser = new User("alice", "alice@example.com");

    // MANAGED: now tracked by persistence context
    User savedUser = userRepository.save(newUser);

    // Modify — NO explicit save() needed!
    // Hibernate will detect the change via dirty checking at flush time
    savedUser.setEmail("newemail@example.com");
    // ↑ Hibernate compares current state to snapshot → generates UPDATE automatically

    // Still MANAGED within the transaction boundary
    User loaded = userRepository.findById(1L).orElseThrow();
    // ↑ Returns same instance from persistence context cache — NO database query!
    // identity: loaded == savedUser (same Java object reference if same ID)
}
// Transaction commits → flush → SQL sent → DETACHED (session closed)
```

### Dirty Checking — How Hibernate Detects Changes

At flush time, Hibernate compares every managed entity's current state to the snapshot it captured when the entity was first loaded. Any difference generates an UPDATE.

```java
@Transactional
public void updateWithoutExplicitSave() {
    User user = userRepository.findById(1L).orElseThrow();
    // Hibernate stores snapshot: {name:"Alice", email:"alice@example.com"}

    user.setEmail("new@example.com");  // Modify the managed entity

    // NO userRepository.save() call!
    // At flush (before commit), Hibernate detects: email changed
    // Generates: UPDATE users SET email = 'new@example.com' WHERE id = 1
}

// Common mistake: calling save() unnecessarily on already-managed entities
@Transactional
public void redundantSave() {
    User user = userRepository.findById(1L).orElseThrow();
    user.setEmail("new@example.com");
    userRepository.save(user); // Redundant! Hibernate will dirty-check and update anyway
    // Not harmful, but adds unnecessary method call noise
}
```

**Dirty checking cost**: at flush time, Hibernate iterates every managed entity and compares field by field. With a large persistence context (hundreds or thousands of managed entities from a large query), dirty checking adds measurable overhead. This is why batch processing must periodically `flush()` and `clear()` the persistence context.

---

## 2. Transaction Basics in Spring

```java
@Service
public class OrderService {

    @Transactional  // Default: REQUIRED propagation, RuntimeException rollback
    public OrderResponse placeOrder(CreateOrderRequest request) {
        Order order = orderRepository.save(Order.from(request));
        inventoryService.decrementStock(request.getItems()); // runs in same transaction
        notificationService.queueConfirmation(order.getId()); // same transaction
        return OrderResponse.from(order);
        // All three operations commit together, or none do
    }
}
```

### How `@Transactional` Works Internally

Spring does not modify your class — it creates a **proxy** (CGLIB or JDK dynamic proxy) that wraps your bean. The proxy intercepts method calls and delegates to the transaction infrastructure:

```
Client calls orderService.placeOrder(request)
    │
    ▼
Spring CGLIB Proxy (generated subclass of OrderService)
    │
    ├── 1. TransactionInterceptor.invoke() called
    ├── 2. PlatformTransactionManager.getTransaction() called
    ├── 3. Gets or creates JDBC Connection from pool
    ├── 4. Sets connection.setAutoCommit(false)
    ├── 5. Stores connection in ThreadLocal (TransactionSynchronizationManager)
    ├── 6. Calls real OrderService.placeOrder(request) ← YOUR CODE
    ├── 7. No exception → PlatformTransactionManager.commit()
    │       → flushes persistence context → sends SQL → JDBC commit()
    └── 8. Exception → PlatformTransactionManager.rollback()
                      → clears persistence context → JDBC rollback()
```

**The ThreadLocal binding is critical**: all Spring Data JPA repositories, EntityManager, and Hibernate Session operations within the same thread automatically participate in the same transaction because they all look up the connection from the same `ThreadLocal` key.

---

## 3. Transaction Attributes — Complete Reference

### `propagation`

Propagation controls what happens when a `@Transactional` method is called while a transaction already exists (or doesn't):

| Propagation | Behavior | Use Case |
|:---|:---|:---|
| `REQUIRED` (default) | Join existing transaction, or create a new one | Almost everything — services calling services |
| `REQUIRES_NEW` | Suspend outer transaction, start independent transaction | Audit logs, outbox events — must commit regardless of outer outcome |
| `NESTED` | Execute within a savepoint of the outer transaction | Partial rollback within a larger unit — limited DB support |
| `SUPPORTS` | Join existing if present; run non-transactionally if not | Read-only operations that work with or without a transaction |
| `NOT_SUPPORTED` | Suspend any existing transaction, run non-transactionally | Operations that must not run in a transaction (e.g., DDL) |
| `MANDATORY` | Join existing transaction; throw if none exists | Internal methods that must be called within a transaction |
| `NEVER` | Throw if a transaction exists | Operations that must never be transactional |

**`REQUIRES_NEW` in depth — the most commonly misunderstood propagation:**

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final AuditService auditService;

    @Transactional
    public void placeOrder(Order order) {
        orderRepository.save(order);

        // REQUIRES_NEW: AuditService opens a NEW, independent transaction
        // The outer transaction is SUSPENDED (not closed, just paused)
        auditService.logOrderPlaced(order.getId(), "ORDER_PLACED");
        // Audit transaction commits here — INDEPENDENT of what happens to the outer transaction

        throw new RuntimeException("order processing failed");
        // Outer transaction rolls back — order is NOT saved
        // But the audit log IS saved — it committed independently ✅
    }
}

@Service
public class AuditService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logOrderPlaced(Long orderId, String event) {
        auditRepository.save(new AuditLog(orderId, event, Instant.now()));
        // This commits REGARDLESS of the outer transaction's outcome
    }
}
```

:::warning[`REQUIRES_NEW` acquires a second database connection]
When `REQUIRES_NEW` suspends the outer transaction, Hibernate must use a **different connection** for the inner transaction (the outer transaction's connection is suspended, not available). This means the connection pool must have enough capacity for nested transactions. Under high concurrency with deep `REQUIRES_NEW` nesting, this can exhaust the connection pool. Use `REQUIRES_NEW` deliberately, not casually.
:::

### `isolation`

| Level | Prevents | Performance Cost | Default For |
|:---|:---|:---|:---|
| `READ_UNCOMMITTED` | Nothing (dirty reads allowed) | Lowest | Rarely appropriate |
| `READ_COMMITTED` | Dirty reads | Low | PostgreSQL, Oracle |
| `REPEATABLE_READ` | Dirty reads + non-repeatable reads | Medium | MySQL InnoDB |
| `SERIALIZABLE` | All anomalies including phantom reads | Highest | Financial critical paths |

```java
// Force a specific isolation level for a critical financial transaction
@Transactional(isolation = Isolation.SERIALIZABLE)
public void transferFunds(Long fromId, Long toId, BigDecimal amount) {
    Account from = accountRepository.findByIdForUpdate(fromId);
    Account to = accountRepository.findByIdForUpdate(toId);
    from.debit(amount);
    to.credit(amount);
}

// Read-heavy reporting: READ_COMMITTED is sufficient and more performant
@Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
public ReportData generateMonthlyReport(YearMonth month) {
    // ...
}
```

### `readOnly = true` — What It Actually Does

```java
@Transactional(readOnly = true)
public List<UserDto> findActiveUsers() { ... }
```

`readOnly = true` signals to Spring and Hibernate:

1. **Hibernate**: disables dirty checking entirely at flush time (no entity snapshot comparison → lower overhead for large result sets).
2. **Hibernate**: skips writing the flush plan — further savings.
3. **Spring + JDBC**: passes a read-only hint to the JDBC driver/connection — some drivers (PostgreSQL) use this to route to a read replica.
4. **Database**: some DBs use this hint to skip acquiring write locks.

**It does NOT prevent writes** — it is an optimization hint, not enforcement. A `save()` call inside a `readOnly=true` method may still succeed (Hibernate flushes anyway on commit in some flush modes).

### `rollbackFor` and `noRollbackFor`

```java
// Spring's default: rollback on RuntimeException/Error, commit on checked exceptions

@Transactional  // Default behavior
public void createOrder() throws BusinessException {
    orderRepository.save(order);
    throw new BusinessException("validation failed"); // ← COMMITS! (checked exception)
}

// Force rollback on checked exceptions
@Transactional(rollbackFor = Exception.class)
public void createOrder() throws BusinessException {
    orderRepository.save(order);
    throw new BusinessException("validation failed"); // ← ROLLS BACK
}

// Rollback on specific exceptions
@Transactional(rollbackFor = {BusinessException.class, ExternalServiceException.class})
public void createOrder() throws BusinessException { ... }

// Do NOT rollback on specific runtime exceptions
@Transactional(noRollbackFor = OptimisticLockException.class)
public void updateWithRetry() {
    // OptimisticLockException will NOT trigger rollback
    // Allows caller to retry without starting a fresh transaction (advanced pattern)
}
```

### `timeout`

```java
@Transactional(timeout = 5)  // Roll back and throw TransactionTimedOutException after 5 seconds
public void riskyOperation() {
    // If this takes longer than 5 seconds:
    // → Hibernate sets a query timeout on the JDBC statement
    // → Transaction is marked for rollback
    // → TransactionTimedOutException thrown on next Hibernate operation
}
```

---

## 4. Rollback Rules — Complete Behavior Table

| Scenario | Default Behavior | Fix |
|:---|:---|:---|
| `RuntimeException` thrown | ✅ Rollback | (correct by default) |
| `Error` thrown | ✅ Rollback | (correct by default) |
| Checked `Exception` thrown | ❌ Commit | Add `rollbackFor = Exception.class` |
| Exception caught and swallowed | ❌ Commit | Don't swallow exceptions in `@Transactional` methods |
| Exception caught, then `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()` | ✅ Rollback | Use when you need to swallow the exception but still rollback |
| Self-invocation (calling `@Transactional` method from same class) | ❌ Transaction ignored | Inject self, or restructure into a different bean |
| `@Transactional` on private method | ❌ Transaction ignored | Only public methods are intercepted by Spring's proxy |
| `@Transactional` on final method | ❌ Transaction ignored (CGLIB) | Remove `final` — CGLIB cannot override final methods |

### Swallowed Exception + Forced Rollback

```java
@Transactional
public Result processWithCleanup() {
    try {
        return riskyOperation();
    } catch (Exception e) {
        log.error("Operation failed, rolling back transaction: {}", e.getMessage());
        // Don't just swallow — mark the transaction for rollback explicitly
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        return Result.failed(e.getMessage());
    }
}
```

### Self-Invocation — The Most Frequent Mistake

```java
@Service
public class UserService {

    public void createUserAndAudit(CreateUserRequest request) {
        createUser(request);    // ← @Transactional is IGNORED
                                // Direct call bypasses the Spring proxy
                                // No transaction is started
    }

    @Transactional
    public void createUser(CreateUserRequest request) {
        userRepository.save(User.from(request));
    }
}
```

**Why**: Spring's `@Transactional` works via AOP proxy. When `createUserAndAudit` calls `createUser` directly on `this`, it calls the real object, not the proxy. The proxy never intercepts the call.

**Fixes:**

```java
// Fix 1: Split into two beans (cleanest)
@Service
@RequiredArgsConstructor
public class UserFacadeService {
    private final UserService userService;  // Injected proxy

    public void createUserAndAudit(CreateUserRequest request) {
        userService.createUser(request);    // ← calls the PROXY → transaction starts
    }
}

// Fix 2: Self-inject (less clean but works)
@Service
public class UserService {
    @Autowired
    private UserService self;               // Inject the proxy of this bean

    public void createUserAndAudit(CreateUserRequest request) {
        self.createUser(request);           // ← calls the PROXY → transaction starts
    }

    @Transactional
    public void createUser(CreateUserRequest request) { ... }
}

// Fix 3: ApplicationContext.getBean (antipattern — avoid)
```

---

## 5. Flush Modes — When SQL Is Actually Sent

Flush is the point at which Hibernate translates the persistence context's pending changes into SQL statements and sends them to the database. **Flush is not commit** — the transaction is still open after flush.

```
Timeline:
  @Transactional starts
       │
  user = findById(1)      ← SELECT executed immediately (not buffered)
  user.setEmail("new")    ← Change recorded in entity only (no SQL yet)
  order = save(newOrder)  ← INSERT queued (SQL not sent yet — write-behind)
       │
  [AUTO FLUSH TRIGGERED] ← Before a JPQL/HQL query in the same session
  OR                        Before transaction commit
       │
  UPDATE users SET email = 'new' WHERE id = 1   ← SQL sent now
  INSERT INTO orders (...) VALUES (...)           ← SQL sent now
       │
  COMMIT → changes visible to other transactions
```

### Flush Mode Options

```java
// Set flush mode per session or per query

// AUTO (default): flush before queries that might be affected by pending changes
// Hibernate analyzes which tables the query touches and flushes if there are pending changes
entityManager.setFlushMode(FlushModeType.AUTO);

// COMMIT: only flush at transaction commit (more performant, but query results may be stale)
entityManager.setFlushMode(FlushModeType.COMMIT);

// ALWAYS: flush before every query (safest, most overhead)
// Hibernate-specific — not in JPA standard
session.setHibernateFlushMode(FlushMode.ALWAYS);

// MANUAL: never auto-flush; developer calls flush() explicitly
// Use in batch processing for full control
entityManager.setFlushMode(FlushModeType.COMMIT);
// Then flush manually: entityManager.flush();
```

### AUTO Flush — The Subtle Behavior

```java
@Transactional
public void demonstrateAutoFlush() {
    // Step 1: Modify an entity
    User user = userRepository.findById(1L).orElseThrow();
    user.setStatus(UserStatus.INACTIVE);  // Change is pending — no SQL yet

    // Step 2: Run a JPQL query that touches the 'users' table
    // AUTO flush mode: Hibernate flushes the pending UPDATE before running this query
    // so the query sees the updated status
    long inactiveCount = em.createQuery(
        "SELECT COUNT(u) FROM User u WHERE u.status = 'INACTIVE'", Long.class)
        .getSingleResult();
    // Hibernate detects: pending change to User entity + query on User table
    // → Flushes before query → UPDATE SQL sent → query sees updated data

    // This is correct behavior — but the SQL is sent BEFORE commit
    // Be aware: the data is not committed yet — other transactions can't see it
}
```

### Manual Flush for Batch Processing

```java
@Transactional
public void importLargeDataset(List<ProductDto> dtos) {
    entityManager.setFlushMode(FlushModeType.COMMIT); // Disable auto-flush

    int batchSize = 500;
    for (int i = 0; i < dtos.size(); i++) {
        Product product = Product.from(dtos.get(i));
        entityManager.persist(product);

        if ((i + 1) % batchSize == 0) {
            entityManager.flush();   // Send batch of 500 INSERTs to DB
            entityManager.clear();   // Evict all entities from persistence context
            // Without clear(): every persisted entity remains in the context
            // With 100,000 entities: persistence context becomes massive → OOM + slow dirty checking
        }
    }
    // Final flush handled by transaction commit
}
```

---

## 6. The N+1 Query Problem — Deep Diagnostics

N+1 is Hibernate's most common production problem. Understanding exactly how to detect, trace, and fix it is a senior engineer's core competency.

### How N+1 Happens

```java
// LAZY associations are correct by default — the problem is accessing them in a loop
List<Order> orders = orderRepository.findAll();
// Query 1: SELECT * FROM orders → returns 100 orders

for (Order order : orders) {
    String email = order.getUser().getEmail(); // LAZY proxy initialized here
    // Query 2:   SELECT * FROM users WHERE id = 1
    // Query 3:   SELECT * FROM users WHERE id = 2
    // ...
    // Query 101: SELECT * FROM users WHERE id = 100
}
// Total: 1 + 100 = 101 queries for a simple loop
```

### Detection — Counting Queries in Tests

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderRepositoryN1Test {

    @Autowired private OrderRepository orderRepository;

    // Using Hypersistence Utils (recommended for query counting in tests)
    // dependency: io.hypersistence:hypersistence-utils-hibernate-63
    @Test
    void findAllWithUsers_shouldNotTriggerNPlus1() {
        // Load test data
        // ...

        long queryCount = PerformanceContext.getInstance().clear()
            .getCurrent().getQueryCount();

        List<Order> orders = orderRepository.findAllWithUsers();
        orders.forEach(o -> o.getUser().getEmail()); // Access association

        long totalQueries = PerformanceContext.getInstance()
            .getCurrent().getQueryCount() - queryCount;

        assertThat(totalQueries)
            .as("Expected at most 2 queries (1 main + 1 batch), but got %d", totalQueries)
            .isLessThanOrEqualTo(2);
    }
}
```

```yaml
# Development: log all SQL with parameter values (never in production)
# Use datasource-proxy or P6Spy — not Hibernate's show-sql
logging:
  level:
    net.ttddyy.dsproxy.listener: DEBUG    # datasource-proxy
    p6spy: DEBUG                           # P6Spy

# Count queries per request with Statistics
spring.jpa.properties.hibernate.generate_statistics: true
logging.level.org.hibernate.stat: DEBUG
# Logs: "Session Metrics" summary per transaction including query count
```

### Fix 1 — JOIN FETCH (Specific Query)

```java
// In repository
@Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.items WHERE o.status = :status")
List<Order> findOrdersWithUsersAndItems(@Param("status") OrderStatus status);

// DISTINCT is required: without it, for 1 order with 5 items, you get 5 Order rows
// Hibernate deduplicates in Java, but the SQL still returns 5 rows per order
// For two OneToMany joins simultaneously: Cartesian product explodes → do NOT do this:
// JOIN FETCH o.items JOIN FETCH o.tags  ← items × tags rows per order
```

### Fix 2 — `@EntityGraph` (Declarative)

```java
// On repository method
@EntityGraph(attributePaths = {"user", "items", "items.product"})
List<Order> findByStatus(OrderStatus status);

// Or with named graph on entity
@NamedEntityGraph(
    name = "Order.complete",
    attributeNodes = {
        @NamedAttributeNode("user"),
        @NamedAttributeNode(value = "items", subgraph = "items.sub")
    },
    subgraphs = @NamedSubgraph(name = "items.sub", attributeNodes = @NamedAttributeNode("product"))
)
@Entity
public class Order { ... }

@EntityGraph("Order.complete")
List<Order> findByCreatedAtAfter(Instant since);
```

### Fix 3 — `default_batch_fetch_size` (Global, Most Effective for Collections)

```yaml
spring.jpa.properties.hibernate.default_batch_fetch_size: 100
```

```java
// With batch_fetch_size=100, Hibernate replaces N separate SELECTs with one IN clause:
// 1: SELECT * FROM orders WHERE status = 'ACTIVE'   → returns 100 orders
// 2: SELECT * FROM users WHERE id IN (1,2,3,...,100) → one query for all users
// 3: SELECT * FROM order_items WHERE order_id IN (1,2,...,100) → one query for all items
// Total: 3 queries instead of 201

// Works automatically — no code changes needed, just the config property
// This is the recommended default for any Spring/Hibernate application
```

### Fix 4 — DTO Projection (Eliminates N+1 by Design)

```java
@Query("""
    SELECT new com.example.dto.OrderSummary(
        o.id, o.status, o.total, u.email, u.username, COUNT(i))
    FROM Order o
    JOIN o.user u
    LEFT JOIN o.items i
    WHERE o.status = :status
    GROUP BY o.id, o.status, o.total, u.email, u.username
    """)
List<OrderSummary> findOrderSummaries(@Param("status") OrderStatus status);

// Single query — no entity tracking, no dirty checking, no lazy proxies
// Most efficient for read-only API responses
```

### N+1 Decision Guide

```
Accessing a collection/association from a loop?
    │
    ├── Is the association needed for ALL results?
    │   ├── YES → JOIN FETCH or @EntityGraph (load together)
    │   └── NO  → Leave LAZY, access only when needed per record
    │
    ├── Is this a read-only operation (API response)?
    │   └── YES → DTO projection (most efficient, no entity overhead)
    │
    ├── Is this a complex graph with multiple collections?
    │   └── YES → default_batch_fetch_size (avoids Cartesian product from multiple JOINs)
    │
    └── Is the parent query paginated?
        └── YES → NEVER use JOIN FETCH on collections with pagination
                  → Use batch_fetch_size or separate queries
                  → JOIN FETCH + Pageable causes HHH90003004 warning (COUNT query is wrong)
```

---

## 7. Locking Strategies

### Optimistic Locking — `@Version`

```java
@Entity
public class Product {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int stock;

    @Version
    private Long version;  // Automatically included in every UPDATE WHERE clause
    // UPDATE products SET stock = ?, version = 3 WHERE id = ? AND version = 2
    // If version = 2 is no longer current: 0 rows updated → OptimisticLockException
}
```

```java
// Handling optimistic lock conflicts — retry pattern
@Service
public class ProductService {

    @Retryable(
        retryFor = ObjectOptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 50, multiplier = 2, random = true)
    )
    @Transactional
    public Product updateStock(Long productId, int delta) {
        Product p = productRepository.findById(productId).orElseThrow();
        p.setStock(p.getStock() + delta);
        return productRepository.save(p);
        // If another thread modified stock between our read and save:
        // → ObjectOptimisticLockingFailureException
        // → @Retryable re-executes the entire method (re-reads fresh state)
    }

    @Recover
    public Product recoverUpdateStock(ObjectOptimisticLockingFailureException ex, Long productId, int delta) {
        log.error("Failed to update stock for product {} after all retries", productId);
        throw new StockUpdateException("Concurrent modification — please try again", ex);
    }
}
```

### Pessimistic Locking — `SELECT FOR UPDATE`

```java
// Repository method
@Lock(LockModeType.PESSIMISTIC_WRITE)  // → SELECT ... FOR UPDATE
@Query("SELECT p FROM Product p WHERE p.id = :id")
Optional<Product> findByIdWithLock(@Param("id") Long id);

// Usage in service — prevents concurrent modification
@Transactional
public void decrementStock(Long productId, int quantity) {
    Product product = productRepository.findByIdWithLock(productId)
        .orElseThrow(() -> new ProductNotFoundException(productId));
    // At this point, this transaction holds an exclusive row lock
    // Other transactions attempting to lock or write this row BLOCK until we commit

    if (product.getStock() < quantity) {
        throw new InsufficientStockException(productId, quantity, product.getStock());
    }
    product.setStock(product.getStock() - quantity);
    // Lock released when transaction commits
}
```

**Lock mode reference:**

| `LockModeType` | SQL | Blocks | Use When |
|:---|:---|:---|:---|
| `OPTIMISTIC` | Version check in UPDATE | Nothing | Most concurrent writes with rare conflicts |
| `OPTIMISTIC_FORCE_INCREMENT` | Version++ even on read | Nothing | Read must also count as a modification |
| `PESSIMISTIC_READ` | `SELECT ... FOR SHARE` | Writers only | Block writers, allow concurrent readers |
| `PESSIMISTIC_WRITE` | `SELECT ... FOR UPDATE` | All other lockers | Exclusive access — high-contention records |
| `PESSIMISTIC_FORCE_INCREMENT` | `SELECT ... FOR UPDATE` + version++ | All other lockers | Pessimistic + version tracking |

### Lock Timeout — Preventing Deadlock Waits

```java
// Without a timeout, a blocked SELECT FOR UPDATE waits indefinitely (or until DB timeout)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
// PostgreSQL: SET lock_timeout = '3000ms' → throw LockTimeoutException if not acquired in 3s
@Query("SELECT p FROM Product p WHERE p.id = :id")
Optional<Product> findByIdWithLockAndTimeout(@Param("id") Long id);
```

### Practical Lock Strategy Decision Guide

| Scenario | Strategy | Reason |
|:---|:---|:---|
| User profile update | `@Version` optimistic | Low contention — concurrent edits are rare |
| Inventory decrement (e-commerce) | `PESSIMISTIC_WRITE` | High contention — multiple buyers competing |
| Financial account transfer | `PESSIMISTIC_WRITE` + `SERIALIZABLE` | Must never lose any update |
| Long-running business process | `@Version` + retry | Pessimistic lock held too long otherwise |
| Report generation (read-only) | `readOnly = true` | No locking needed |
| Saga compensation (retried) | `@Version` + `@Retryable` | Idempotent retries, optimistic is sufficient |

---

## 8. First-Level Cache — Behavior and Pitfalls

The first-level cache (Session-level) is always enabled and cannot be disabled.

```java
@Transactional
public void firstLevelCacheDemo() {
    // Query 1: SELECT * FROM users WHERE id = 1
    User user1 = userRepository.findById(1L).orElseThrow();

    // NO query: returns same instance from cache
    User user2 = userRepository.findById(1L).orElseThrow();

    // user1 == user2: identical Java object reference
    assertThat(user1).isSameAs(user2);  // TRUE — same object

    // JPQL queries bypass the first-level cache (they always hit the DB)
    // But Hibernate merges the result into the cache if the same ID already exists
    List<User> fromQuery = em.createQuery("SELECT u FROM User u WHERE u.id = 1", User.class)
        .getResultList();
    assertThat(fromQuery.get(0)).isSameAs(user1);  // STILL same object reference
}
```

### First-Level Cache Pitfall — Stale Data After Bulk Update

```java
@Transactional
public void bulkUpdateAndRead() {
    // Step 1: Load entity — now in first-level cache
    User user = userRepository.findById(1L).orElseThrow();
    log.info("Before bulk update: status = {}", user.getStatus()); // ACTIVE

    // Step 2: Bulk update — bypasses persistence context
    int updated = em.createQuery("UPDATE User u SET u.status = 'INACTIVE' WHERE u.id = 1")
        .executeUpdate(); // Executes UPDATE in DB immediately

    // Step 3: Read from cache — STALE! Cache still has ACTIVE
    User stale = userRepository.findById(1L).orElseThrow();
    log.info("After bulk update (stale): status = {}", stale.getStatus()); // ACTIVE ← WRONG!

    // Fix: refresh from DB, or clear the persistence context before reading
    em.refresh(user);    // Re-reads entity from DB
    log.info("After refresh: status = {}", user.getStatus()); // INACTIVE ← correct
}
```

This is why `@Modifying(clearAutomatically = true)` is critical — it clears the first-level cache after the bulk update, preventing stale reads.

---

## 9. Second-Level Cache

The second-level cache (2LC) is an **application-wide** cache shared across sessions/transactions. Unlike the first-level cache (per session), the 2LC survives transaction boundaries and is shared by all threads.

```
Session 1:
  findById(1) → DB miss → SELECT → entity loaded → stored in 2LC

Session 2 (different transaction, same JVM):
  findById(1) → 2LC HIT → no SELECT → entity returned from cache

Session 3 (after entity updated):
  update → 2LC entry for id=1 evicted or updated → next access hits DB
```

### Enabling the Second-Level Cache

```yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: true            # Optional: cache query results too
          region:
            factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
```

```xml
<!-- Caffeine as the 2LC provider (Ehcache is another common choice) -->
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-jcache</artifactId>
</dependency>
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>jcache</artifactId>
</dependency>
```

### Caching Individual Entities

```java
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
// READ_WRITE: safe for entities that are both read and occasionally updated
// READ_ONLY: maximum performance, safe only for immutable data
// NONSTRICT_READ_WRITE: no strict invalidation — brief stale reads possible (use for low-contention)
// TRANSACTIONAL: full transactional cache (requires JTA — rarely used)
public class Product {
    @Id
    private Long id;
    private String name;
    private BigDecimal price;

    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<ProductVariant> variants;
    // Collections can also be cached — each cached independently by owner ID
}
```

### Query Cache

```java
// Cache query results (the list of IDs, not the entities themselves)
// Entities are loaded from 2LC or DB on first access after a query cache hit
@Query("SELECT p FROM Product p WHERE p.category = :category AND p.active = true")
@QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "true"))
List<Product> findActiveByCategoryFromCache(@Param("category") String category);
```

### When to Use the Second-Level Cache

```
GOOD candidates for 2LC:
  ✅ Reference data (currencies, country codes, tax rates, categories)
  ✅ Configuration entities (feature flags stored in DB)
  ✅ Product catalog (read often, updated rarely)
  ✅ User roles and permissions (read on every request, changed infrequently)

POOR candidates for 2LC:
  ❌ Orders, payments, transactions (high update rate — frequent eviction wastes cache)
  ❌ Inventory levels (high contention — concurrent updates risk stale reads)
  ❌ User sessions (high churn — cache fills with ephemeral data)
  ❌ Any entity updated by multiple application instances concurrently
     (distributed cache invalidation requires careful coordination)
```

### 2LC Monitoring

```java
// Log 2LC statistics periodically
@Scheduled(fixedRate = 60_000)
public void logCacheStats() {
    Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
    log.info("2LC hit ratio: {}/{} = {}%",
        stats.getSecondLevelCacheHitCount(),
        stats.getSecondLevelCacheHitCount() + stats.getSecondLevelCacheMissCount(),
        stats.getSecondLevelCacheHitCount() * 100.0 /
        Math.max(1, stats.getSecondLevelCacheHitCount() + stats.getSecondLevelCacheMissCount())
    );
}
```

---

## 10. Batch Processing and JDBC Batching

### Why Default JPA Is Slow for Bulk Inserts

```java
// Without batching: 1000 entities = 1000 individual INSERT round-trips
for (int i = 0; i < 1000; i++) {
    productRepository.save(new Product(...));
}
// Equivalent to 1000 separate TCP round-trips to the database server
// At 1ms per round-trip: 1 second just in network overhead
```

### Enabling JDBC Batching

```yaml
spring.jpa.properties.hibernate:
  jdbc.batch_size: 50             # Group up to 50 statements per JDBC batch
  order_inserts: true             # Reorder INSERTs by table to maximize batch grouping
  order_updates: true             # Reorder UPDATEs by table
  batch_versioned_data: true      # Allow batching of versioned entities (@Version)
```

:::danger[`GenerationType.IDENTITY` disables batch inserts]
With IDENTITY, Hibernate must execute each INSERT individually to get the generated key immediately. JDBC batching is silently disabled. Switch to `GenerationType.SEQUENCE` with an appropriate `allocationSize` to enable batching:

```java
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_seq")
@SequenceGenerator(name = "product_seq", sequenceName = "product_id_seq", allocationSize = 50)
// allocationSize=50: Hibernate pre-allocates 50 IDs per sequence call
// 1000 inserts = 20 sequence calls + 1000 batched INSERTs (in groups of 50)
```
:::

### Correct Batch Insert Pattern

```java
@Service
@RequiredArgsConstructor
public class ProductBulkImportService {

    private final EntityManager em;

    private static final int BATCH_SIZE = 500;

    @Transactional
    public void importProducts(List<ProductDto> dtos) {
        for (int i = 0; i < dtos.size(); i++) {
            Product product = Product.from(dtos.get(i));
            em.persist(product);   // Add to persistence context

            if ((i + 1) % BATCH_SIZE == 0) {
                em.flush();   // Send batch of 500 INSERTs to DB
                em.clear();   // Evict all entities from persistence context
                // Without clear(): persistence context grows to hold ALL entities in memory
                // With 100,000 products: ~4-8GB memory + dirty checking is O(n) → OOM
            }
        }
        // Remaining entities flushed at transaction commit
    }
}
```

### Bulk Update and Delete — Skip Entity Loading Entirely

```java
// ❌ SLOW: load all, update in Java, flush dirty checks
List<Product> products = productRepository.findByCategory("Electronics");
products.forEach(p -> p.setStatus(ProductStatus.ARCHIVED));
// Hibernate generates N UPDATE statements (one per entity)

// ✅ FAST: single UPDATE statement via JPQL
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Transactional
@Query("UPDATE Product p SET p.status = :newStatus WHERE p.category = :category")
int archiveCategory(@Param("newStatus") ProductStatus newStatus, @Param("category") String category);
// 1 UPDATE statement regardless of affected row count
// clearAutomatically: clears first-level cache so subsequent reads see updated state
```

---

## 11. Connection Pool and Hibernate Statistics

### HikariCP Configuration

```yaml
spring:
  datasource:
    hikari:
      pool-name: HikariPool-App
      # CPU-bound workloads: (cores × 2) + effective_spindle_count
      # I/O-bound workloads: may need more — measure under load
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000      # Max time to wait for connection from pool (30s)
      idle-timeout: 600000           # Close idle connections after 10 min
      max-lifetime: 1800000          # Recycle connections every 30 min (< DB's wait_timeout)
      keepalive-time: 300000         # Send keepalive to prevent DB from closing idle connections
      validation-timeout: 5000       # How long to validate connection before declaring it bad
      connection-test-query: "SELECT 1"  # Validation query (or use isValid() for JDBC 4+)
      leak-detection-threshold: 60000    # Log warning if connection held > 60s (possible leak)
```

### Hibernate Statistics — Understanding Query Patterns

```java
@Configuration
public class HibernateStatisticsConfig {

    @Bean
    public StatisticsService hibernateStatistics(EntityManagerFactory emf) {
        SessionFactory sf = emf.unwrap(SessionFactory.class);
        sf.getStatistics().setStatisticsEnabled(true);
        return new StatisticsService(sf);
    }
}

// Access statistics in a health check or management endpoint
@RestController
@RequestMapping("/internal/hibernate-stats")
public class HibernateStatsController {

    private final EntityManagerFactory emf;

    @GetMapping
    public Map<String, Object> stats() {
        Statistics s = emf.unwrap(SessionFactory.class).getStatistics();
        return Map.of(
            "queryExecutionCount", s.getQueryExecutionCount(),
            "queryExecutionMaxTime", s.getQueryExecutionMaxTime(),
            "queryExecutionMaxTimeQueryString", s.getQueryExecutionMaxTimeQueryString(),
            "entityLoadCount", s.getEntityLoadCount(),
            "entityInsertCount", s.getEntityInsertCount(),
            "entityUpdateCount", s.getEntityUpdateCount(),
            "entityDeleteCount", s.getEntityDeleteCount(),
            "collectionLoadCount", s.getCollectionLoadCount(),
            "secondLevelCacheHitCount", s.getSecondLevelCacheHitCount(),
            "secondLevelCacheMissCount", s.getSecondLevelCacheMissCount(),
            "transactionCount", s.getTransactionCount(),
            "successfulTransactionCount", s.getSuccessfulTransactionCount()
        );
    }
}
```

---

## 12. Production Design Heuristics

### Transaction Boundaries

```
✅ DO:
  - Place @Transactional at the service layer, not repository or controller
  - Keep transactions short — one business operation per transaction
  - Commit read-only transactions with readOnly = true for large queries
  - Use REQUIRES_NEW only when true independence is needed (outbox, audit)
  - Validate generated SQL in development — never assume Hibernate does what you think

❌ AVOID:
  - Calling external APIs (HTTP, message brokers) inside a DB transaction
    If the external call is slow, the DB connection and lock are held for the duration
  - Loading hundreds of entities into one transaction — persistence context overhead
  - Using @Transactional on controller methods — keeps DB connections open for full request
  - Nested @Transactional with REQUIRED on the same bean — self-invocation bypasses proxy
  - Relying on auto-commit mode for production applications
```

### Why "No External API Calls in Transactions" Matters

```
Timeline (external API inside transaction):

t=0ms:   Transaction starts, DB connection acquired from pool
t=1ms:   Read entity from DB (SELECT)
t=2ms:   Call external payment API (HTTP POST to Stripe)
...
t=2500ms: Payment API responds (2.5 second network call)
t=2501ms: Save result to DB
t=2502ms: Transaction commits, connection returned to pool

Pool size = 20. Under 20 concurrent requests = 20 connections held for 2.5 seconds each.
At 200 concurrent requests → 180 requests waiting for a connection → timeout cascade.
```

**Fix**: commit the DB transaction first, then call the external API, then open a new transaction to record the result. Or use an outbox pattern.

### Microservices and Distributed Transactions

```
❌ AVOID:
  - Two-phase commit (2PC) across microservices
    → Blocking protocol: all participants hold locks during prepare/commit
    → Single coordinator failure blocks all participants indefinitely
    → External APIs (Stripe, SendGrid) cannot participate in 2PC

✅ PREFER:
  - Saga pattern for multi-service business transactions
    → Each service owns its own local transaction
    → Compensating transactions handle failure
  - Transactional Outbox for reliable event publishing
    → Event written in same transaction as business data
    → CDC or polling relay publishes event to Kafka after commit
  - Eventual consistency with idempotent consumers
```

---

## 13. Complete Behavioral Reference

| Scenario | Result | Why |
|:---|:---|:---|
| No exception | Commit | Happy path |
| `RuntimeException` thrown | Rollback | Spring default |
| `Error` thrown | Rollback | Spring default |
| Checked `Exception` thrown | Commit | Spring default — must use `rollbackFor` |
| Exception swallowed | Commit | Spring never sees the exception |
| Exception swallowed + `setRollbackOnly()` | Rollback | Explicitly mark for rollback |
| Self-invocation without proxy | No transaction | Proxy bypassed |
| `@Transactional` on private method | No transaction | AOP proxy can't override private |
| `@Transactional` on final method (CGLIB) | No transaction | CGLIB can't subclass final methods |
| `REQUIRES_NEW` called | Outer suspended, inner independent | New connection, new transaction |
| `readOnly = true` | Dirty checking disabled, possible routing to replica | Optimization hint |
| `flush()` called | SQL sent to DB, transaction still open | Not a commit |
| `clear()` called | All managed entities detached | Persistence context emptied |
| `merge()` on detached entity | Entity re-managed, state merged | Reattach after session boundary |
| `save()` on managed entity | Redundant (dirty checking handles it) | No-op except via `saveAndFlush()` |
| Bulk JPQL update without `clearAutomatically` | First-level cache stale | 2LC bypass, no cache invalidation |

---

## Interview Questions

**Q: What is the Hibernate persistence context and why does it matter for performance?**

> The persistence context is Hibernate's in-memory map of all entities tracked within a session/transaction. It provides identity mapping (same ID = same Java object reference), dirty checking (automatic UPDATE detection), and write-behind buffering. Performance matters because: dirty checking iterates all managed entities at flush time; a large persistence context (thousands of entities) can cause noticeable GC pressure and dirty check overhead. In batch processing, you must periodically `flush()` and `clear()` to prevent the persistence context from growing unboundedly.

**Q: What is the difference between `flush()` and `commit()`?**

> `flush()` sends pending SQL statements to the database — Hibernate writes the dirty-checked changes as SQL. The transaction is still open; the data is not durable and other transactions cannot see it yet (under default READ_COMMITTED isolation). `commit()` finalizes the transaction — it makes all flushed changes durable and visible to other transactions, then releases the database connection. An implicit flush always occurs before commit.

**Q: Why is `@Transactional` ignored when called from within the same class?**

> Spring's `@Transactional` works through AOP proxies. When a bean is injected, Spring injects a proxy wrapper (CGLIB or JDK proxy) that intercepts method calls to apply transaction behavior. When a method calls another method on `this` (the real object, not the proxy), it bypasses the proxy entirely — the transaction interceptor never runs. The fix is to move the called method to a different bean (which gets injected as a proxy), or self-inject the bean.

**Q: What happens if you call an external HTTP API inside a `@Transactional` method?**

> The database connection is held open for the entire duration of the external call. If the HTTP call takes 2+ seconds, the connection is occupied for that time. Under concurrent load, the connection pool exhausts — new requests cannot get connections and start timing out. The fix is to end the transaction before the external call, then start a new transaction to save the result. Alternatively, use the transactional outbox pattern: save a pending-event record in the DB transaction, and let a separate process make the external call.

**Q: When should you use pessimistic locking vs optimistic locking?**

> Optimistic locking (`@Version`) is the default choice: no database lock overhead, scales well, and is appropriate when concurrent modifications to the same row are rare. When a conflict occurs, an `OptimisticLockException` is thrown and the caller retries. Pessimistic locking (`SELECT FOR UPDATE`) is appropriate when conflicts are frequent and the cost of retrying is high — for example, decrementing inventory where you must guarantee exactly one winner in a race. The risk with pessimistic locking is lock contention and potential deadlocks under high concurrency.

**Q: How does `default_batch_fetch_size` solve the N+1 problem?**

> Without it, accessing a LAZY collection for N entities triggers N separate SELECT statements (one per entity). With `default_batch_fetch_size=100`, Hibernate groups those N lazy loads into batches using IN clauses: instead of `SELECT * FROM order_items WHERE order_id = 1`, then `WHERE order_id = 2`, etc., it issues `SELECT * FROM order_items WHERE order_id IN (1, 2, ..., 100)`. This reduces N+1 (e.g., 101 queries for 100 orders) to 2–3 queries, with no changes to application code — just configuration.

---

## See Also

- [Spring Data JPA: Repositories & Queries](./spring-data-jpa.md)
- [Spring Data JPA Interview Questions](./spring-data-jpa-interview-questions.md)
- [Database Connection Pooling](../database/connection-pooling.md)
- [Database Indexing & Query Optimization](../database/indexing-query-optimization.md)
- [Saga Pattern](./saga-pattern.md)
- [Transactional Outbox Pattern](./outbox-pattern.md)
