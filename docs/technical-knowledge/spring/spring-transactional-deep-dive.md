---
id: spring-transactional-deep-dive
title: "@Transactional Deep Dive: Proxy, ThreadLocal & Production Traps"
sidebar_label: "@Transactional Deep Dive"
description: "A senior-level breakdown of how @Transactional really works: AOP proxy mechanics, CGLIB vs JDK proxy, ThreadLocal transaction binding, flush/commit timing, propagation internals, isolation levels, and the production traps that cause silent data corruption, connection pool exhaustion, and 2 AM alerts."
tags: [spring, spring-boot, transactions, aop, proxy, jpa, hibernate, java, advanced, cglib, threadlocal, propagation, isolation]
---
import SpringTransactionMechanicsDiagram from '@site/src/components/SpringTransactionMechanicsDiagram';

# `@Transactional` Deep Dive: Proxy, ThreadLocal & Production Traps

> *"I once thought `@Transactional` was magic. Until production told me otherwise — one record saved, its related record missing, no exception in the log, nothing."*

This document is a senior-level dissection of `@Transactional`: how it actually works mechanically, and the production traps that silently corrupt data, exhaust connection pools, and surface as 2 AM alerts with no obvious cause. Understanding the mechanism is the prerequisite for understanding every failure mode.

Three sentences govern everything:

> 1. **A transaction is bound to a thread.**
> 2. **A transaction lives exactly as long as the annotated method's execution.**
> 3. **The gatekeeper always stands outside the house.**

---

## Part 1 — The Mechanism: What `@Transactional` Actually Does

### JDBC Autocommit — The Starting Point

Before Spring, JDBC autocommit is on by default: every SQL statement commits the moment it executes, permanently and individually. A database transaction is simply the act of turning that off:

```java
Connection conn = dataSource.getConnection();
conn.setAutoCommit(false);

// ... multiple SQL statements ...

conn.commit();    // all succeed together
// or
conn.rollback();  // all undo together
```

`@Transactional` is Spring's declarative way of doing exactly this — but understanding *how* it does it is what separates engineers who write correct code from those who write code that passes review and fails silently in production.

### `@Transactional` Is Just Metadata — The Annotation Itself Does Nothing

`@Transactional` is a marker annotation. It carries zero executable logic. The actual work is done by the infrastructure that reads it.

### The AOP Proxy — Spring's Interception Mechanism

During the Spring application context startup, `BeanFactory` creates your beans. In the final phase, it invokes every registered `BeanPostProcessor`. `AbstractAutoProxyCreator` (a `BeanPostProcessor`) inspects each bean and asks: *"Does this bean carry `@Transactional` on itself or any of its methods?"*

If yes, instead of returning the original bean, it returns an **AOP proxy** wrapping it:

<SpringTransactionMechanicsDiagram />

Every other bean that `@Autowires` your service gets this proxy, not the real object. From the type system's perspective, the proxy *is* a `UserService` (it either implements the same interfaces or extends the same class). Internally it holds a reference to the real bean and delegates every call to it after the interceptor's setup work completes.

:::tip[This reference is the key to the self-invocation bug]
The proxy holds a reference to the real bean. When code runs *inside* the real bean, `this` is the real bean — there is no path back to the proxy. Method calls on `this` never pass through the interceptor.
:::

### CGLIB vs JDK Dynamic Proxy — Which One Spring Uses and Why

Spring can generate proxies two ways:

| Proxy Type | Mechanism | Constraint |
|:---|:---|:---|
| **JDK Dynamic Proxy** | Implements the same interfaces as the target bean | Can only proxy interface methods |
| **CGLIB** | Generates a runtime subclass of the target class | Can proxy any non-final, non-private method |

**Since Spring Boot 2.0**: `spring.aop.proxy-target-class=true` is the default — CGLIB is always used, whether or not your bean implements an interface.

**What CGLIB generates** (conceptually):

```java
// Original bean
@Service
public class OrderService {
    @Transactional
    public void placeOrder(Order order) { ... }
}

// CGLIB-generated subclass at runtime (simplified):
public class OrderService$$SpringCGLIB$$0 extends OrderService {
    private final OrderService target; // reference to real bean
    private final Interceptor[] interceptors;

    @Override
    public void placeOrder(Order order) {
        // 1. Run all interceptors (TransactionInterceptor, security, etc.)
        // 2. Delegate to target.placeOrder(order)
        // 3. Handle commit/rollback
    }
}
```

**Hard limits that cannot be overcome by any Spring configuration:**

```java
// ❌ Private — CGLIB cannot override private methods (Java restriction)
@Transactional
private void doSomething() { }

// ❌ Final method — CGLIB cannot override final methods
@Transactional
public final void criticalOperation() { }

// ❌ Final class — CGLIB cannot subclass a final class
@Service
public final class UserService {
    @Transactional
    public void updateUser() { }  // annotation silently ignored
}

// ❌ Annotation on interface — not reliably propagated to impl class
// Spring's docs explicitly recommend placing @Transactional on the implementation
public interface UserService {
    @Transactional  // unreliable — place on impl instead
    void updateUser(User user);
}
```

### What `TransactionInterceptor` Actually Does — Step by Step

```
Method call enters proxy:

1. TransactionInterceptor.invoke() called
2. Reads @Transactional attributes: propagation, isolation, readOnly, rollbackFor, timeout
3. Calls PlatformTransactionManager.getTransaction(transactionDefinition)
   ├── JpaTransactionManager (when using JPA/Hibernate)
   └── DataSourceTransactionManager (when using plain JDBC)
4. Transaction manager acquires Connection from HikariCP pool
5. connection.setAutoCommit(false)
6. Stores the connection in TransactionSynchronizationManager (ThreadLocal)
7. YOUR METHOD EXECUTES
8. Method returns normally:
   └── PlatformTransactionManager.commit()
       ├── Hibernate flush (dirty checking → SQL generation)
       ├── connection.commit()
       └── Connection returned to HikariCP pool
   OR
   Method throws exception:
   └── Rollback rules evaluated (RuntimeException → rollback; checked → commit by default)
       ├── PlatformTransactionManager.rollback()
       ├── connection.rollback()
       └── Connection returned to HikariCP pool
```

### `TransactionSynchronizationManager` — The ThreadLocal Locker

`TransactionSynchronizationManager` is backed by `ThreadLocal` variables. Think of it as a gym locker room: each thread has its own locker, keyed to the thread identity. No other thread can read it.

| Resource Bound in ThreadLocal | Responsibility & Scope |
|---|---|
| **`Connection` (`autoCommit=false`)** | Active physical JDBC connection obtained from HikariCP pool. |
| **`TransactionStatus`** | Tracks transaction state (`active`, `rollbackOnly`, savepoints). |
| **`EntityManager`** | Active JPA Session instance bound to current thread transaction. |
| **`Synchronizations` List** | Callbacks fired during phases (`beforeCommit`, `afterCommit`, `afterCompletion`). |

> **Shared Execution Context:** When `OrderService` calls `InventoryRepo` and `PaymentRepo` within the same thread, both repositories automatically reuse the exact same ThreadLocal connection without needing to pass database handles as parameters!

When a Spring Data JPA repository executes a query, it does not go directly to `DataSource`. Spring calls `DataSourceUtils.getConnection()` (plain JDBC) or resolves the proxy `EntityManager` (JPA) — both check the ThreadLocal locker first: *"Is there already a connection bound here?"* If yes, reuse it. This is how `Service → RepositoryA → RepositoryB` all share a single connection and a single transaction without passing any parameters.

This also explains `propagation = REQUIRED` (the default): *"Look in the locker. If there's already a transaction, join it. If not, start one."*

---

## Part 2 — Propagation Internals

### Logical vs Physical Transactions

This distinction is essential for understanding rollback behaviour, `UnexpectedRollbackException`, and savepoints.

| | Physical Transaction | Logical Transaction |
|:---|:---|:---|
| What is it? | One real `Connection`, one `setAutoCommit(false)`, one commit or rollback at DB level | One `@Transactional` boundary crossed at code level |
| How many per call chain? | One (with `REQUIRED`) | Many (every `@Transactional` method in the chain) |
| Who can commit/rollback? | Only the outermost logical transaction (the one that created the physical transaction) | Participants can only mark for rollback, not commit/rollback directly |

### `REQUIRED` — Share the Physical Transaction

```
Outer @Transactional begins → physical transaction created, connection in locker
│
├──► Inner @Transactional (REQUIRED) → detects existing transaction → joins it
│         → no new connection, no new physical transaction
│         → same locker, same connection
│
└──► Outer method ends → commit (if not rollbackOnly)
```

```java
@Transactional  // Outer — owns the physical transaction
public void placeOrder(Order order) {
    orderRepository.save(order);
    inventoryService.reserve(order.getItems()); // REQUIRED — joins outer tx
    paymentService.charge(order.getTotal());    // REQUIRED — joins outer tx
    // All three share one connection, commit together
}
```

### `REQUIRES_NEW` — Independent Physical Transaction

```
Outer @Transactional begins → physical TX created → connection C1 in locker
│
├──► Inner @Transactional (REQUIRES_NEW)
│       → outer connection C1 SUSPENDED (stays in locker but marked suspended)
│       → new connection C2 acquired from pool
│       → new physical TX started on C2
│       → inner method executes on C2
│       → inner TX commits or rolls back → C2 returned to pool
│       → outer connection C1 RESUMED
│
└──► Outer method ends → commits or rolls back on C1
```

```java
@Service
public class AuditService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(AuditEvent event) {
        auditRepository.save(event);
        // Commits REGARDLESS of whether the outer transaction succeeds or fails
        // Even if the caller rolls back, the audit log is permanently written
    }
}
```

:::warning[`REQUIRES_NEW` acquires a second connection simultaneously]
One thread holds two connections at once. If the pool has 10 connections and 10 threads are all in the middle of a `REQUIRES_NEW` call, all 10 threads each hold 2 connections = 20 connections needed, 10 available → deadlock at the pool level. The database is idle. The application is frozen. This manifests as `"unable to obtain connection"` with no DB-side evidence.

Rule: `REQUIRES_NEW` is correct for audit logs and outbox events — use it deliberately and size your pool to account for it.
:::

### `NESTED` — Savepoints Within a Physical Transaction

`NESTED` uses **JDBC savepoints** — database-level markers within a single physical transaction that you can partially roll back to:

```java
@Transactional  // outer — physical TX
public void processWithFallback() {
    orderRepository.save(mainOrder);

    try {
        optionalEnrichmentService.enrich(mainOrder); // NESTED
        // If enrich() fails:
        // → rolls back to savepoint (enrich's changes undone)
        // → mainOrder.save() is NOT rolled back (before the savepoint)
    } catch (Exception e) {
        log.warn("Enrichment failed, continuing without it");
    }

    orderRepository.save(mainOrder); // this still commits
}

@Transactional(propagation = Propagation.NESTED)
public void enrich(Order order) {
    // Runs within a savepoint inside the outer physical transaction
    // Rollback here only undoes changes since the savepoint, not the entire outer TX
}
```

**Constraints**: `NESTED` requires `DataSourceTransactionManager` (or a JPA TM that supports savepoints), and database support. JpaTransactionManager with Hibernate uses Hibernate's savepoint mechanism. Not all databases support savepoints (though PostgreSQL, MySQL, and SQL Server do).

### `SUPPORTS`, `NOT_SUPPORTED`, `MANDATORY`, `NEVER`

```java
// SUPPORTS: join if there is one; run non-transactionally if not
@Transactional(propagation = Propagation.SUPPORTS)
public List<Product> findAll() { ... }  // Works in both contexts

// MANDATORY: must be called within an existing transaction; throws if not
@Transactional(propagation = Propagation.MANDATORY)
public void auditChange(String entity) { ... }  // Enforces "only call me from within a TX"

// NOT_SUPPORTED: suspend any existing TX, run bare; resume after
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public void runDDL() { ... }  // Some DDL statements cannot run in a TX

// NEVER: throw if called within a TX
@Transactional(propagation = Propagation.NEVER)
public void assertNonTransactional() { ... }  // Validation in tests
```

---

## Part 3 — Isolation Levels in Depth

Isolation controls what a transaction can see from other concurrent transactions. Every isolation level is a trade-off between read consistency and concurrency.

### The Four Anomalies

```
Dirty Read:
  T1 writes uncommitted data → T2 reads it → T1 rolls back
  T2 used data that never permanently existed

Non-Repeatable Read:
  T1 reads row X (price=100) → T2 updates row X (price=200) and commits → T1 re-reads row X
  T1 sees a different value for the same row in the same transaction

Phantom Read:
  T1 reads "all orders WHERE total > 1000" → gets 5 rows
  T2 inserts a new order with total=1500 and commits
  T1 re-reads "all orders WHERE total > 1000" → gets 6 rows
  A new row appeared (a "phantom") that wasn't there before

Lost Update:
  T1 reads balance=1000, T2 reads balance=1000
  T1 writes balance=1000-100=900 (commit)
  T2 writes balance=1000-200=800 (commit) ← T1's deduction lost
  Final: 800 (should be 700)
```

### Isolation Levels vs Anomalies

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Performance |
|:---|:---|:---|:---|:---|
| `READ_UNCOMMITTED` | ✅ Possible | ✅ Possible | ✅ Possible | Highest |
| `READ_COMMITTED` | ❌ Prevented | ✅ Possible | ✅ Possible | High |
| `REPEATABLE_READ` | ❌ Prevented | ❌ Prevented | ✅ Possible | Medium |
| `SERIALIZABLE` | ❌ Prevented | ❌ Prevented | ❌ Prevented | Lowest |

```java
// Financial transfer — prevent all anomalies
@Transactional(isolation = Isolation.SERIALIZABLE)
public void transferFunds(Long fromId, Long toId, BigDecimal amount) {
    Account from = accountRepository.findByIdWithLock(fromId);
    Account to = accountRepository.findByIdWithLock(toId);
    from.debit(amount);
    to.credit(amount);
}

// Reporting dashboard — READ_COMMITTED is sufficient and more performant
@Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
public DashboardData generateDashboard() { ... }

// Inventory check-and-reserve — must prevent phantom reads
@Transactional(isolation = Isolation.REPEATABLE_READ)
public boolean reserveStock(Long productId, int quantity) {
    Product p = productRepository.findById(productId).orElseThrow();
    if (p.getStock() >= quantity) {
        p.setStock(p.getStock() - quantity);
        return true;
    }
    return false;
}
```

:::warning[`Isolation.DEFAULT` means whatever the database default is]
Most production databases default to `READ_COMMITTED` (PostgreSQL, Oracle, SQL Server) or `REPEATABLE_READ` (MySQL InnoDB). When you write `@Transactional` without specifying isolation, you get the database default — which may differ across environments if developers use different databases locally. Always specify isolation explicitly for operations where correctness matters.
:::

### `readOnly = true` — What It Actually Does (and Doesn't Do)

```java
@Transactional(readOnly = true)
public List<OrderDto> findRecentOrders() { ... }
```

`readOnly = true` is a **declaration of intent** that triggers several optimizations:

1. **Hibernate disables dirty checking** — no entity snapshots are captured, no field-by-field comparison at flush time. For queries returning hundreds of entities, this measurably reduces flush overhead.
2. **Hibernate skips the flush plan computation** — additional savings at session end.
3. **Spring passes a read-only hint to the JDBC Connection** — some drivers (PostgreSQL) use this to route the connection to a read replica if configured via `AbstractRoutingDataSource`.
4. **Some databases optimize the lock acquisition** — PostgreSQL, for example, can skip certain lock tables for read-only transactions.

**What it does NOT do**:
- It does NOT prevent writes. You can call `save()`, `delete()`, or execute a native UPDATE inside a `readOnly=true` transaction and it may succeed (though Hibernate may suppress the flush in some configurations).
- It is NOT enforced at the database level unless you explicitly configure the database session as read-only.
- It does NOT automatically route to a read replica without explicit `AbstractRoutingDataSource` configuration.

---

## Part 4 — Flush and Commit Timing

Developers frequently confuse `save()`, `flush()`, and `commit()`. Each is a distinct step.

### The Four-Stage Timeline

```
@Transactional method begins
        │
        ├── entityManager.persist(entity) / repository.save(entity)
        │       → Entity enters persistence context (first-level cache)
        │       → SQL NOT sent to database yet (write-behind buffering)
        │
        ├── user.setEmail("new@email.com")  [on a managed entity]
        │       → Change recorded in entity object
        │       → SQL NOT sent yet
        │       → Hibernate stores a snapshot to compare against at flush
        │
        ├── [AUTO FLUSH may occur here]
        │       → Triggered before JPQL/HQL queries that touch affected tables
        │       → Hibernate compares entity state to snapshot → generates UPDATE SQL
        │       → SQL sent to DB, but transaction still open (not committed)
        │       → Other transactions cannot see these changes yet
        │
        └── Method returns (no exception)
                → Hibernate flush (dirty checking) → remaining SQL generated and sent
                → PlatformTransactionManager.commit()
                → connection.commit() → DB makes changes permanent and visible
                → Connection returned to pool
                → Persistence context closed → entities become DETACHED
```

### Auto-Flush Before JPQL Queries

```java
@Transactional
public void demonstrateAutoFlush() {
    // Step 1: Modify managed entity — SQL not sent yet
    User user = userRepository.findById(1L).orElseThrow();
    user.setStatus(UserStatus.INACTIVE);

    // Step 2: JPQL query touching the same table
    // Hibernate AUTO flush: detects pending change to User entity + query on User table
    // → Flushes UPDATE SQL before running query → query sees updated status
    long inactiveCount = em.createQuery(
        "SELECT COUNT(u) FROM User u WHERE u.status = 'INACTIVE'", Long.class)
        .getSingleResult();
    // inactiveCount includes the user we just modified — consistent within the transaction
    // But this UPDATE is not committed — other transactions can't see it yet
}
```

### Flush Mode Options

```java
// AUTO (Hibernate default): flush before queries that might see stale data
// — Analyses which tables are affected by pending changes
// — Flushes only when necessary to maintain read-your-writes consistency

// COMMIT: only flush at transaction commit
// — More performant for write-heavy transactions with many intermediate queries
// — Risk: JPQL queries within the transaction may see stale state
entityManager.setFlushMode(FlushModeType.COMMIT);

// MANUAL: never auto-flush; developer controls all flush timing
// — Used in batch processing for fine-grained control
entityManager.setFlushMode(FlushModeType.COMMIT);
// ...then periodically:
entityManager.flush();   // Send batched SQL
entityManager.clear();   // Evict all entities from first-level cache (prevent OOM)
```

---

## Part 5 — The Self-Invocation Bug (Trap #0)

### The Scenario

```java
@Service
public class OrderService {

    public void placeOrder(Order order) {        // No @Transactional
        this.validateAndSave(order);             // Internal call — bypass!
    }

    @Transactional
    public void validateAndSave(Order order) {   // @Transactional is silently ignored
        orderRepository.save(order.header());
        inventoryRepository.reserve(order.items()); // RuntimeException here
        // Without a transaction: header already auto-committed, reserve fails
        // Result: orphaned order header with no items — silent data corruption
    }
}
```

### Why the Proxy Is Bypassed

The Spring proxy (the gatekeeper) stands outside the class. When `placeOrder` calls `this.validateAndSave()`, it calls the **real object** directly — not the proxy. The proxy never intercepts the call. The `@Transactional` annotation on `validateAndSave` is never read by `TransactionInterceptor`.

```
External call → [OrderService CGLIB Proxy] → real OrderService.placeOrder()
                                                      │
                              this.validateAndSave() ─┘ (direct, proxy bypassed)
                              No transaction opened
```

### The Three Fixes

| Fix | Mechanism | When to Use |
|:---|:---|:---|
| **Split into a separate bean** ✅ | `validateAndSave` moves to `OrderValidationService`; call goes through its proxy | Always preferred — forces correct boundary thinking |
| **Self-injection with `@Lazy`** | Inject `OrderService self; self.validateAndSave()` | Works, but code looks unusual — explain in comments |
| **`TransactionTemplate`** | Programmatic transaction wrapping the critical block | When you need dynamic transaction control or conditional transactions |

```java
// ✅ Fix 1: Separate bean (preferred)
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderPersistenceService orderPersistenceService;

    public void placeOrder(Order order) {
        orderPersistenceService.validateAndSave(order); // through the proxy gate
    }
}

@Service
public class OrderPersistenceService {
    @Transactional
    public void validateAndSave(Order order) {
        orderRepository.save(order.header());
        inventoryRepository.reserve(order.items());
    }
}
```

```java
// ✅ Fix 2: TransactionTemplate (programmatic — no proxy involved at all)
@Service
@RequiredArgsConstructor
public class OrderService {
    private final TransactionTemplate txTemplate;

    public void placeOrder(Order order) {
        txTemplate.execute(status -> {
            orderRepository.save(order.header());
            inventoryRepository.reserve(order.items());
            return null;
        });
        // RuntimeException from the lambda triggers rollback — no proxy needed
    }
}
```

---

## Part 6 — The Production Traps

### Trap 1 — `@Transactional` Is Silently Ignored

**Causes:**

```java
// ❌ Private method — CGLIB cannot override
@Transactional
private void processInternal() { }

// ❌ Final method — CGLIB cannot subclass
@Transactional
public final void critical() { }

// ❌ Final class — entire class unproxyable
@Service
public final class UserService {
    @Transactional
    public void update() { }
}

// ❌ Annotation on interface, not implementation
public interface UserService {
    @Transactional  // not reliably applied to impl
    void update();
}

// ❌ Bean not managed by Spring (created with new, not injected)
UserService service = new UserServiceImpl();
service.update(); // not a proxy — @Transactional silently ignored
```

**Correct placement:**

```java
// ✅ Always annotate public/protected methods on the implementation class
@Service
public class UserServiceImpl implements UserService {

    @Transactional
    public void update(Long id, UpdateRequest req) {
        // ...
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        // ...
    }
}
```

---

### Trap 2 — Connection Held During External I/O (The 2 AM Alert)

**The failure pattern:**

```java
// ❌ DB connection held open during the entire HTTP call to payment service
@Transactional
public void processOrder(Order order) {
    orderRepository.save(order);
    paymentService.charge(order);     // HTTP call: 200ms average, 3000ms p99
    inventoryRepository.deduct(order);
}
```

With a connection pool of 20 and 50 concurrent requests all hitting `paymentService` at p99:
- 20 connections occupied for 3 seconds each
- 30 threads queued waiting for a connection
- `connection-timeout` fires → `"Unable to obtain connection"` errors
- The database is completely idle — all connections are held waiting for Stripe, not executing SQL

```java
// ✅ External I/O before the transaction
public void processOrder(Order order) {
    PaymentResult result = paymentService.charge(order);  // HTTP call outside TX
    persistOrderResult(order, result);                    // short, DB-only transaction
}

@Transactional
private void persistOrderResult(Order order, PaymentResult result) {
    order.applyPayment(result);
    orderRepository.save(order);
    inventoryRepository.deduct(order.getItems());
}   // Connection held only for these two SQL operations — milliseconds
```

**The narrow corridor — transaction too short causes `LazyInitializationException`:**

```java
// ❌ Transaction closes before the caller accesses lazy associations
@Transactional
public Order findOrderWithItems(Long id) {
    return orderRepository.findById(id).orElseThrow();
}   // Transaction closes here — Order entity is DETACHED

// Controller:
Order order = orderService.findOrderWithItems(orderId);
order.getItems().size(); // ← LazyInitializationException — no active session!
```

```java
// ✅ Option 1: fetch the association inside the transaction
@Transactional
public Order findOrderWithItems(Long id) {
    Order order = orderRepository.findById(id).orElseThrow();
    Hibernate.initialize(order.getItems()); // force init while session is open
    return order;
}

// ✅ Option 2: use a DTO projection — no lazy associations possible
@Query("SELECT new com.example.dto.OrderDto(o.id, o.status, i) FROM Order o JOIN o.items i WHERE o.id = :id")
List<OrderDto> findOrderDto(@Param("id") Long id);

// ✅ Option 3: JOIN FETCH in the query
@Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id")
Optional<Order> findByIdWithItems(@Param("id") Long id);
```

**`REQUIRES_NEW` Connection Pool Deadlock:**

```java
// Scenario: outer TX holds connection C1; REQUIRES_NEW requests C2
@Transactional
public void processOrders(List<Order> orders) {
    for (Order order : orders) {
        orderRepository.save(order);
        auditService.logOrder(order); // REQUIRES_NEW — needs C2 while holding C1
    }
}

// Pool size = 10, 10 concurrent threads:
// Thread 1: holds C1, waiting for C2
// Thread 2: holds C3, waiting for C4
// ... all 10 threads holding one connection, waiting for another
// Pool exhausted → deadlock → "unable to obtain connection"
```

---

### Trap 3 — `@Async` Cuts the Transaction Context

**What happens mechanically:**

```
Request arrives on Thread-A:
  [AsyncAnnotationBeanPostProcessor] fires FIRST (runs at lowest precedence,
   inserted before existing advisors) → ships work to ThreadPool-Thread-B

Thread-A continues (or returns immediately if fire-and-forget)

ThreadPool-Thread-B:
  [TransactionInterceptor] fires → checks ThreadLocal locker → EMPTY
  → No existing transaction → opens brand-new independent transaction
  → This new transaction is completely invisible to Thread-A's transaction
```

```java
// ❌ Wrong: @Async breaks transaction context
@Transactional
public void createOrderAndNotify(Order order) {
    orderRepository.save(order);
    notificationService.sendEmail(order); // runs on another thread — outside TX!
    // If orderRepository.save() is later rolled back, email was already dispatched
}

@Async
@Transactional  // Opens a NEW independent transaction on the async thread
public void sendEmail(Order order) { ... }
```

**The correct pattern — `@TransactionalEventListener`:**

```java
// ✅ Event published within the transaction; listener fires AFTER commit
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    eventPublisher.publishEvent(new OrderCreatedEvent(order));
    // Event is held until transaction commits or discarded on rollback
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onOrderCreated(OrderCreatedEvent event) {
    notificationService.sendEmail(event.getOrder());
    // Only fires after the transaction that published the event commits successfully
    // Never fires if the publishing transaction rolls back
}

// Other phases:
@TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
// Fires just before commit — still within the transaction

@TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
// Fires on rollback — useful for compensation or alerting

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMPLETION)
// Fires regardless of commit or rollback
```

:::warning[Any thread boundary cuts the transaction]
`@Async`, `CompletableFuture.supplyAsync()`, parallel streams (`parallelStream()`), `ExecutorService.submit()` — every thread boundary creates a fresh, empty ThreadLocal locker. The spawned thread has no transaction context unless you explicitly re-establish one.
:::

---

### Trap 4 — Checked Exceptions Silently Commit (Silent Data Corruption)

**Default Spring rollback rules:**

```
RuntimeException (unchecked) → ROLLBACK
Error                        → ROLLBACK
Exception (checked)          → COMMIT  ← The dangerous default
```

This convention was inherited from EJB: a checked exception was considered "an expected business outcome that the caller handles explicitly" — the transaction should commit because the business logic successfully determined an outcome. In modern Spring applications this reasoning is often wrong.

```java
// ❌ IOException triggers a commit with partial writes
@Transactional
public void importData(File file) throws IOException {
    for (Record record : parse(file)) {
        recordRepository.save(record);  // Some records saved
    }
    // IOException thrown mid-way
    // Spring sees checked exception → COMMITS the partial saves → data corruption
}
```

```java
// ✅ Explicit rollback for checked exceptions
@Transactional(rollbackFor = Exception.class)
public void importData(File file) throws IOException {
    for (Record record : parse(file)) {
        recordRepository.save(record);
    }
    // IOException now triggers ROLLBACK — no partial data
}

// ✅ Or wrap in RuntimeException
@Transactional
public void importData(File file) {
    try {
        for (Record record : parse(file)) {
            recordRepository.save(record);
        }
    } catch (IOException e) {
        throw new DataImportException("Import failed", e); // RuntimeException → rollback
    }
}
```

**The complete rollback configuration surface:**

```java
@Transactional(
    rollbackFor = { Exception.class, CheckedBusinessException.class },
    noRollbackFor = { ExpectedValidationException.class }
)
public void complexOperation() throws CheckedBusinessException { ... }
// ExpectedValidationException is a RuntimeException we explicitly exclude from rollback
// CheckedBusinessException now triggers rollback despite being checked
```

**Force rollback from within the method (without throwing):**

```java
@Transactional
public Result processWithConditionalRollback() {
    try {
        return doRiskyWork();
    } catch (ExpectedBusinessException e) {
        log.warn("Business condition failed: {}", e.getMessage());
        // Don't propagate exception, but mark transaction for rollback
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        return Result.failed(e.getMessage());
    }
    // Method returns normally, but transaction rolls back at commit time
}
```

---

### Trap 5 — `UnexpectedRollbackException` (The Marked Corpse)

**Setup:** `ServiceA` (outer `@Transactional`) calls `ServiceB` (inner `@Transactional`, `REQUIRED`). Both participate in the same physical transaction. `ServiceB` throws a `RuntimeException`.

**What happens inside Hibernate/Spring:**

```
ServiceB throws RuntimeException
    │
    ▼
TransactionInterceptor for ServiceB evaluates rollback rules:
    RuntimeException → rollback rule matches
    But ServiceB is NOT the transaction owner (it only JOINED)
    It cannot call connection.rollback() directly
    │
    ▼
TransactionInterceptor stamps the shared TransactionStatus:
    transactionStatus.setRollbackOnly()
    ← "DAMAGED" sticker placed on the shared transaction object
    │
    ▼
RuntimeException propagates to ServiceA
    ServiceA catches it, logs a warning, continues executing
    ServiceA reaches end of method → "all good, commit please"
    │
    ▼
TransactionInterceptor for ServiceA attempts commit:
    Checks transactionStatus.isRollbackOnly() → true
    Cannot honour the commit — inner failure was masked
    Throws: UnexpectedRollbackException
    "Transaction rolled back because it has been marked as rollback-only"
```

```java
// ❌ Swallowing exception while sharing physical transaction
@Transactional   // outer — owns physical TX
public void processOrder(Order order) {
    try {
        inventoryService.reserve(order);  // REQUIRED — joins outer TX
    } catch (Exception e) {
        log.warn("Reservation failed, continuing..."); // exception swallowed
    }
    // Continue executing... reach end of method...
    // → UnexpectedRollbackException
}

@Transactional   // inner — joins outer TX, stamps rollbackOnly when it throws
public void reserve(Order order) {
    throw new RuntimeException("No stock");
}
```

**Fix 1: Give the inner transaction its own physical scope**

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)  // independent physical TX
public void reserve(Order order) {
    throw new RuntimeException("No stock");
    // Rolls back its OWN physical transaction → outer TX's rollbackOnly flag untouched
}

// Now ServiceA can safely catch and handle the exception:
@Transactional
public void processOrder(Order order) {
    try {
        inventoryService.reserve(order);  // REQUIRES_NEW — independent
    } catch (RuntimeException e) {
        log.warn("Reservation failed, applying fallback stock");
        applyFallbackInventory(order);    // safe — outer TX still clean
    }
    // Outer TX commits successfully
}
```

**Fix 2: Don't swallow — let the exception propagate if that's the correct behavior**

```java
@Transactional
public void processOrder(Order order) {
    inventoryService.reserve(order);  // REQUIRED — if this throws, let it propagate
    // Outer TX rolls back completely — correct and predictable
}
```

**Fix 3: `@Transactional(noRollbackFor = ...)` on the inner method**

```java
// The inner method decides its exception should NOT trigger rollback
@Transactional(noRollbackFor = StockUnavailableException.class)
public boolean tryReserve(Order order) {
    if (stock.isInsufficient(order)) {
        throw new StockUnavailableException(); // StockUnavailableException → no rollbackOnly stamp
    }
    inventory.reserve(order);
    return true;
}
```

---

## Part 7 — `TransactionTemplate`: Programmatic Transactions

For cases where declarative `@Transactional` is insufficient — conditional transactions, different rollback logic for different branches, transactions spanning non-Spring-managed code:

```java
@Service
@RequiredArgsConstructor
public class ConditionalOrderService {

    private final TransactionTemplate txTemplate;
    private final TransactionTemplate readOnlyTxTemplate;

    public ConditionalOrderService(PlatformTransactionManager txManager) {
        this.txTemplate = new TransactionTemplate(txManager);
        this.txTemplate.setTimeout(10);

        this.readOnlyTxTemplate = new TransactionTemplate(txManager);
        this.readOnlyTxTemplate.setReadOnly(true);
        this.readOnlyTxTemplate.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);
    }

    // Conditional transaction — begin TX only if certain conditions met
    public void processConditionally(Order order) {
        if (order.requiresTransaction()) {
            txTemplate.execute(status -> {
                try {
                    orderRepository.save(order);
                    inventoryRepository.deduct(order.getItems());
                    return null;
                } catch (BusinessException e) {
                    status.setRollbackOnly(); // Mark for rollback without throwing
                    return null;
                }
            });
        } else {
            orderRepository.save(order); // bare, no TX
        }
    }

    // Return value from transaction
    public OrderSummary getOrderWithConsistentRead(Long orderId) {
        return readOnlyTxTemplate.execute(status ->
            orderRepository.findSummaryById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId))
        );
    }
}
```

**`TransactionTemplate` vs `@Transactional`:**

| Aspect | `@Transactional` | `TransactionTemplate` |
|:---|:---|:---|
| Configuration | Declarative (annotation) | Programmatic (Java code) |
| Self-invocation | Does NOT work | Works — no proxy involved |
| Conditional transaction | Hard to express | Natural (`if/else` + `execute`) |
| Per-call configuration | Fixed at method level | Dynamic (change settings per call) |
| Rollback control | Via exception or `setRollbackOnly()` | Via `status.setRollbackOnly()` or exception |
| Test readability | Implicit | Explicit — easier to follow execution flow |

---

## Part 8 — Testing `@Transactional` Code

### `@Transactional` in Tests — The Default Rollback

```java
@SpringBootTest
@Transactional  // Each test runs in a transaction that is ROLLED BACK after the test
class OrderServiceTest {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;

    @Test
    void placeOrder_shouldPersistOrder() {
        orderService.placeOrder(new Order(...));
        // asserting in the same transaction — data is visible here
        assertThat(orderRepository.count()).isEqualTo(1);
        // After test: ROLLBACK — DB is clean for the next test
    }
}
```

**`@Commit` — persist test data permanently:**

```java
@Test
@Commit  // Override default rollback — test data persists to DB
void insertReferenceData() { ... }
```

**Test isolation trap — `REQUIRES_NEW` in production code bypasses test transaction:**

```java
// Production code
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void auditLog(String event) {
    auditRepository.save(new AuditLog(event));
    // Commits in its own physical TX — NOT part of the test transaction
}

// Test
@SpringBootTest
@Transactional  // Test transaction
class AuditTest {
    @Test
    void audit_shouldPersistLog() {
        auditService.auditLog("TEST_EVENT");
        // REQUIRES_NEW committed independently — audit log IS in the DB
        // But test @Transactional rolls back — audit log is NOT rolled back
        // Test DB state is now inconsistent between test runs!
    }
}
// Fix: use @Sql with delete or use TestContainers with clean state per test
```

### Asserting Transaction Boundaries with `@DataJpaTest`

```java
@DataJpaTest  // Loads only JPA slice — faster than @SpringBootTest
class OrderRepositoryTransactionTest {

    @Autowired private OrderRepository orderRepository;
    @Autowired private TestEntityManager tem;

    @Test
    void save_thenFlush_shouldMakeDataVisible() {
        Order order = new Order("customer-1", BigDecimal.TEN);
        orderRepository.save(order);
        tem.flush(); // force flush to DB within test transaction

        Order found = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(found.getCustomerId()).isEqualTo("customer-1");
    }
}
```

---

## Part 9 — Virtual Threads and the Future of Transaction Context

Java 21 introduced **Virtual Threads** — lightweight, JVM-managed threads that can be pooled at massive scale. Java 25 finalized **`ScopedValue`** — a hierarchical, immutable alternative to `ThreadLocal` that binds data to an execution scope rather than a thread lifetime.

### Do Virtual Threads Break `@Transactional`?

**No — but the behavior changes in one important way.** Spring's `TransactionSynchronizationManager` uses `ThreadLocal`. Virtual threads are still "threads" from the JVM perspective — they have `ThreadLocal` storage. Transaction context stored in `ThreadLocal` on a virtual thread works correctly as long as the virtual thread is not unmounted (parked to wait for I/O) and remounted on a different carrier thread *between two operations that check the same `ThreadLocal`*.

In practice: within a single `@Transactional` method execution, the virtual thread will be remounted correctly and `ThreadLocal` continuity is maintained. Spring Framework 6.1+ has explicit support for virtual thread compatibility.

### Will Transaction Management Migrate to `ScopedValue`?

Unlikely for the core mechanism. `ScopedValue` is **immutable and read-only within a scope** — it is ideal for passing configuration or identity downward through a call chain, but transaction management requires mutability (stamping `rollbackOnly = true` on a shared transaction status, registering synchronization callbacks). These mutations require `ThreadLocal`'s mutable, write-from-anywhere semantics.

The Spring team has explicitly stated that transaction context management is a case where `ThreadLocal` remains appropriate. OpenJDK documentation echoes this.

**The underlying principles remain unchanged:**
- Context must be attached to something (thread, scope, or coroutine)
- Inserting behavior requires an interceptor standing between caller and callee

Any future framework that solves concurrency differently (Kotlin coroutines, Loom continuations, reactive programming) will solve these same problems — just with different mechanisms. Engineers who understand *why* `@Transactional` works the way it does will recognize the patterns immediately.

---

## Quick Reference — Everything at a Glance

```java
// ── ANNOTATION PLACEMENT ────────────────────────────────
// ✅ public/protected methods on implementation class
// ❌ private methods, final methods, final classes
// ❌ interface methods (unreliable — place on impl)
// ❌ methods called via this.xxx() from same class

// ── ROLLBACK RULES ──────────────────────────────────────
// RuntimeException              → ROLLBACK (default)
// Error                         → ROLLBACK (default)
// Checked Exception             → COMMIT (dangerous default — use rollbackFor)
// Exception swallowed           → COMMIT (Spring never sees it)
// Swallowed + setRollbackOnly() → ROLLBACK (explicit marking)

// ── PROPAGATION QUICK GUIDE ─────────────────────────────
// REQUIRED     → join existing or create new (default)
// REQUIRES_NEW → suspend outer, start independent (audit, outbox)
// NESTED       → savepoint within outer (partial rollback)
// SUPPORTS     → join if exists; non-TX if not
// MANDATORY    → join existing; throw if none
// NOT_SUPPORTED→ suspend outer; run non-TX
// NEVER        → throw if TX exists

// ── CONNECTION MANAGEMENT ───────────────────────────────
// ❌ External HTTP/file I/O inside @Transactional
// ✅ I/O before or after the @Transactional method
// ❌ REQUIRES_NEW in loops (pool exhaustion)
// ✅ Size pool to account for nested REQUIRES_NEW

// ── THREAD BOUNDARIES ───────────────────────────────────
// ❌ @Async @Transactional on same method
// ✅ @TransactionalEventListener(AFTER_COMMIT) for post-commit side effects
// ❌ CompletableFuture / ExecutorService inherit no TX context
// ✅ TransactionTemplate if you need explicit TX in async code

// ── CHECKED EXCEPTIONS ──────────────────────────────────
// ❌ @Transactional (default) with throws IOException
// ✅ @Transactional(rollbackFor = Exception.class)
// ✅ Wrap checked in RuntimeException and throw

// ── UNEXPECTED ROLLBACK ─────────────────────────────────
// ❌ Catch + swallow inner exception while sharing physical TX
// ✅ REQUIRES_NEW for inner if it must fail independently
// ✅ Let exception propagate (clean, predictable)
// ✅ @Transactional(noRollbackFor = SpecificException.class) on inner

// ── ISOLATION ───────────────────────────────────────────
// READ_COMMITTED  → default for PostgreSQL/Oracle (prevents dirty reads)
// REPEATABLE_READ → prevents non-repeatable reads (MySQL InnoDB default)
// SERIALIZABLE    → financial ops, maximum correctness
// readOnly = true → optimization hint, NOT a write prevention mechanism
```

---

## Behavioral Reference Table

| Scenario | Result | Root Cause |
|:---|:---|:---|
| No exception | Commit | Happy path |
| `RuntimeException` thrown | Rollback | Spring default rule |
| `Error` thrown | Rollback | Spring default rule |
| Checked `Exception` thrown | **Commit** | Spring default — use `rollbackFor` |
| Exception swallowed in `@Transactional` | Commit | Spring never sees it |
| Exception swallowed + `setRollbackOnly()` | Rollback | Explicit marking |
| Self-invocation (`this.method()`) | No transaction | Proxy bypassed |
| `@Transactional` on private method | No transaction | CGLIB can't override private |
| `@Transactional` on final method | No transaction | CGLIB can't override final |
| `@Async` + `@Transactional` | New independent TX on async thread | ThreadLocal is empty on new thread |
| `REQUIRES_NEW` under load | Potential pool deadlock | Two connections per thread simultaneously |
| Inner joins outer (`REQUIRED`), inner throws | `rollbackOnly` stamped → `UnexpectedRollbackException` | Shared physical TX, inner can't rollback but marks for it |
| Inner has `REQUIRES_NEW`, throws | Outer's rollbackOnly untouched | Separate physical TX, separate rollbackOnly flag |
| `readOnly = true` then write | May or may not write | Hint only — not enforced |
| `flush()` called | SQL sent to DB | Not a commit — TX still open |
| `clear()` called | All managed entities detached | First-level cache emptied |
| Transaction timeout exceeded | `TransactionTimedOutException` on next Hibernate op | Timer fires, transaction marked for rollback |

---

## See Also

- [Hibernate Transactions & Performance](./hibernate-transactions-performance.md)
- [Spring Data JPA: Repositories & Queries](./spring-data-jpa.md)
- [Saga Pattern](./saga-pattern.md)
- [Transactional Outbox Pattern](./outbox-pattern.md)
- [Retry Pattern](./retry-pattern.md)