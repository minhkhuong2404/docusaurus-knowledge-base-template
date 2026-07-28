---
id: spring-data-jpa-transactions
title: "Spring & Spring Data JPA: Managing Transactions"
sidebar_label: Managing Transactions
description: "A deep dive into @Transactional — how AOP proxy, ThreadLocal connection binding, propagation traps, async pitfalls, and rollback rules work under the hood in Spring Boot."
tags: [spring, spring-boot, jpa, hibernate, java, transactions]
---
import SpringTransactionMechanicsDiagram from '@site/src/components/SpringTransactionMechanicsDiagram';

# Spring & Spring Data JPA: Managing Transactions

Managing transactions in Java applications can be complex, but Spring Boot and Spring Data JPA simplify this process through abstraction. The danger is in *using* the abstraction without *understanding* it — that's when silent data corruption and 2AM connection pool exhaustion alerts happen.

This guide covers the full picture: from how `@Transactional` is wired up at startup, to the five production traps that bite engineers who treat it as magic.

---

<SpringTransactionMechanicsDiagram />

---

## The Foundation: Database Transactions and ACID

By default, every SQL statement sent to the database auto-commits immediately. There's no undo. A **transaction** is the act of turning that off — calling `setAutoCommit(false)` — to bundle multiple statements into one atomic block, then making a single final decision: **commit all or rollback all**.

This is the foundation everything else builds on.

The primary goal of a relational database transaction is to provide **ACID** characteristics:

* **Atomicity (The "all-or-nothing" principle):** Either all operations within the transaction succeed, or none of them do.
  > **Example:** You are transferring $100 from Account A to Account B. If deducting $100 from Account A succeeds, but the database crashes before adding $100 to Account B, atomicity ensures the deduction is rolled back.
* **Consistency:** A transaction must transition the system from one valid, consistent state to another, passing all database constraint checks.
  > **Example:** If your database has a `NOT NULL` constraint on an email column, a transaction attempting to insert a user with a null email will fail and roll back.
* **Isolation:** Changes made during a transaction remain invisible to other concurrent transactions until successfully committed.
  > **Example:** While Transaction A is calculating a monthly report, Transaction B (a user checking their balance) will not see the half-finished uncommitted updates from A.
* **Durability:** Once a transaction is successfully committed, the changes are permanently persisted even if the server immediately loses power.

---

## How `@Transactional` Works Under the Hood

### Step 1: `@Transactional` is Just Metadata

`@Transactional` is not a Java feature, and not a database feature. It is just a label — metadata. By itself, it runs zero lines of code. The power comes from what happens at bean startup.

### Step 2: AOP Proxy Creation at Bean Initialization

During Spring's bean lifecycle, after a bean is fully initialized, `BeanPostProcessor`s get a chance to wrap it. `AbstractAutoProxyCreator` (which implements `BeanPostProcessor`) inspects the bean — if it finds `@Transactional`, it does **not** return the original bean. It returns an **AOP proxy** wrapping the original bean.

Other beans that `@Autowired` your service get this proxy, not the real bean.

```
@Service UserService (real bean)
     ↕ wrapped by AbstractAutoProxyCreator
AOP Proxy → holds reference to real UserService
     ↕ injected into
OrderController (thinks it has UserService, actually has proxy)
```

Spring generates the proxy in one of two ways:

| Proxy Type | Mechanism | Visible Scope | Limitation |
|---|---|---|---|
| **JDK Dynamic Proxy** | Implements the same interfaces as the bean | `public` methods in interface only | Can't intercept methods not in the interface |
| **CGLIB** | Creates a subclass of the bean's class | `public`, `protected`, package-private | Cannot intercept `private` or `final` methods |

:::tip[Spring Boot default]
Spring Boot sets `spring.aop.proxy-target-class=true` since version 2.0 — meaning **CGLIB is the default**, even if your class implements an interface. `private` and `final` methods are never interceptable.
:::

:::warning[Where to place `@Transactional`]
Place `@Transactional` on the **implementation class**, not the interface. Java does not inherit annotations from interfaces to implementing classes — Spring does try to discover them, but the official recommendation is always to annotate the class. Also prefer **method-level** annotations over class-level to force explicit thought about transaction boundaries.
:::

### Step 3: The `TransactionInterceptor` at Runtime

When a call comes in from outside the bean, the proxy intercepts it. `TransactionInterceptor` runs:

1. Asks `PlatformTransactionManager` (`DataSourceTransactionManager` or `JpaTransactionManager`) to open a transaction.
2. The manager takes a `Connection` from the `DataSource`, calls `setAutoCommit(false)`, then **stores that Connection in `TransactionSynchronizationManager`**.
3. Your real method runs.
4. On success → `commit()`. On `RuntimeException` or `Error` → `rollback()`.

### Step 4: ThreadLocal — The Heart of It All

`TransactionSynchronizationManager` stores the Connection in a **`ThreadLocal`**. This means: the Connection belongs to the current thread. Only this thread can see it.

Think of it like a personal locker at a gym — each person has their own compartment, key in their own pocket.

When your repository needs a Connection, it doesn't go directly to the `DataSource`. Spring handles this automatically:
- **JdbcClient / JdbcTemplate** call `DataSourceUtils.getConnection()` — which first checks the ThreadLocal locker.
- **JPA `EntityManager`** (which you inject) is also a proxy that, on each use, looks for the real `EntityManager` bound to the current thread.

Both ask the same question: *"Does this thread's locker already have a Connection?"* If yes, reuse it. This is why an entire chain of `service → repository → another repository` shares one Connection and one transaction, with **zero parameter passing**.

```
Thread T1 [ ThreadLocal locker ]
  └── Connection (autoCommit=false, tx active)
       ├── OrderRepository.save()      ← uses same Connection
       └── InventoryRepository.save()  ← uses same Connection
                                         → all in one transaction ✅
```

---

## The Self-Invocation Bug

Back to the production bug: Method A (no annotation) calling Method B (`@Transactional`) in the same class.

When a request comes in, the proxy receives the call for Method A. But A has no annotation, so the proxy just delegates straight to the real bean — Method A runs inside the **real bean** object. The `this` inside the real bean is the real bean itself. It knows nothing about the proxy wrapping it from outside. It does not hold a reference back to the proxy.

So `this.methodB()` bypasses the proxy entirely — no interceptor, no `TransactionInterceptor`, no transaction opened. Each SQL statement in B commits immediately (default JDBC auto-commit). The first insert succeeds; then an exception hits; the first record stays in the database. **This is self-invocation.**

```java
// ❌ BROKEN — self-invocation bypasses the proxy
@Service
public class OrderService {

    public void placeOrder() {
        this.updateInventory(); // Goes directly to real bean, proxy bypassed!
    }

    @Transactional
    public void updateInventory() {
        // No transaction! Each SQL auto-commits.
    }
}
```

### Fix 1: Split Into a Separate Bean (Recommended)

Move the transactional method to a different `@Service` bean. All external calls go through the proxy by definition.

```java
@Service
public class OrderService {
    @Autowired private InventoryService inventoryService;

    public void placeOrder() {
        inventoryService.updateInventory(); // External call → goes through proxy ✅
    }
}

@Service
public class InventoryService {
    @Transactional
    public void updateInventory() {
        // Real transaction here
    }
}
```

This also forces you to answer: *where does the transaction boundary actually belong?* That's the right question.

### Fix 2: Self-Injection

```java
@Service
public class OrderService {
    @Autowired @Lazy private OrderService self; // Inject the proxy of yourself

    public void placeOrder() {
        self.updateInventory(); // Goes through the proxy ✅
    }

    @Transactional
    public void updateInventory() { ... }
}
```

Works, but feels magical. Use sparingly.

### Fix 3: `TransactionTemplate` (Explicit, No Proxy)

```java
@Service
public class OrderService {
    @Autowired private TransactionTemplate tx;

    public void placeOrder() {
        tx.execute(status -> {
            // Everything here is inside a real transaction
            inventoryRepository.update(...);
            orderRepository.save(...);
            return null;
        });
    }
}
```

Most explicit — no proxy, no magic. The transaction boundary is visible in the code.

---

## Production Traps

### Trap 1: Connection Held for the Full Method Duration

When `@Transactional` opens a transaction, it holds the `Connection` **from the first line to the last line of the method**. It cannot release it mid-way — if it did, the next SQL would get a different Connection, which means a different transaction, breaking the entire ThreadLocal sharing model.

**The 2AM alert:** A `@Transactional` method makes a REST call to an external payment service in the middle of its execution.

```java
@Transactional
public void processOrder(Order order) {
    orderRepository.save(order);           // Connection acquired
    paymentService.charge(order.getTotal()); // External HTTP call — HOLDS connection during this!
    inventoryService.deduct(order.getItems()); // Connection released only after this
}
```

If the payment service is slow (3 seconds each), and 50 threads hit this simultaneously, 50 Connections are held for 3 seconds each. If the pool size is 30, new requests queue and timeout. The alert fires pointing at *the database* — but the database is fine. The problem is the connection pool.

:::danger[Golden Rule]
Never make I/O calls (HTTP, file, message queue publish) inside a `@Transactional` method. Fetch external data *before* opening the transaction, or publish events *after* it commits.
:::

The inverse trap: close the transaction too early, then try to access a lazy-loaded JPA association → `LazyInitializationException`. There is a narrow window to get right, and you must find it deliberately.

---

### Trap 2: `REQUIRES_NEW` Double-Connection Risk

`REQUIRES_NEW` suspends the current transaction and opens a brand new one. Concretely: the current Connection **stays held** (not returned to pool), and Spring requests a **second Connection** from the pool.

One thread, two Connections simultaneously.

```java
@Transactional  // Opens Connection #1
public void processPayment() {
    auditService.log("started");   // REQUIRES_NEW → needs Connection #2
    // Connection #1 still held here while Connection #2 is active
}

@Transactional(propagation = Propagation.REQUIRES_NEW)
public void log(String msg) {
    // Connection #2
}
```

Put this inside a loop, or hit it from many threads concurrently: every thread holds Connection #1 and waits for Connection #2. If the pool is sized smaller than `2 × concurrent threads`, you get a connection pool deadlock — threads waiting for a connection that won't free until *they* finish, which they can't until they get the connection.

:::warning[Use `REQUIRES_NEW` carefully]
Reserve it for operations that genuinely must survive independently of the outer transaction (e.g., audit logs). Never put it inside loops.
:::

---

### Trap 3: `@Async` + `@Transactional` Thread Jump

`@Async` and `@Transactional` look like they can be stacked. They can be — but the result is almost certainly not what you expect.

**Execution order of advisors at runtime:**

`AsyncAnnotationBeanPostProcessor` runs last at startup (order `LOWEST_PRECEDENCE`), but it inserts its advisor at the **front** of the interceptor chain (`beforeExistingAdvisors = true`). So at runtime, `@Async`'s interceptor fires **before** `TransactionInterceptor`.

The actual flow:

```
Request arrives at proxy
  → Async interceptor fires: submits task to thread pool → returns immediately
    → (on new thread) TransactionInterceptor fires
      → Checks ThreadLocal: new thread, empty locker
      → Opens brand-new independent transaction
```

The transaction that runs in the async method has **zero connection** to any transaction in the calling thread. It is always fully independent — regardless of whether you use `REQUIRED` or `REQUIRES_NEW`. Both produce the same result: a new transaction on the new thread.

```java
@Async
@Transactional  // This transaction is on the async thread, completely separate
public void sendConfirmation(Long orderId) {
    // If the caller's transaction rolls back, this already committed ❌
}
```

**The correct pattern — fire events after commit:**

```java
// Inside a @Transactional method:
@Transactional
public void placeOrder(Order order) {
    orderRepository.save(order);
    applicationEventPublisher.publishEvent(new OrderPlacedEvent(order.getId()));
    // Event is held, not delivered yet
}

// Listener runs AFTER the transaction commits:
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onOrderPlaced(OrderPlacedEvent event) {
    emailService.sendConfirmation(event.getOrderId()); // Safe: order is in DB
    kafkaTemplate.send("orders", event.getOrderId());
}
// If the transaction rolls back, this listener never fires ✅
```

This also applies to: `CompletableFuture`, parallel streams, and any manually-created `ExecutorService`. Whenever you cross a thread boundary, the ThreadLocal transaction is severed at that point.

---

### Trap 4: Checked Exceptions Don't Rollback (Silent Commit)

By default, Spring only rolls back on **`RuntimeException`** and **`Error`**. If you throw a checked exception (`IOException`, `SQLException`, a custom `BusinessException extends Exception`), Spring considers it "the caller expected this" — and **commits**.

```java
@Transactional
public void transferFunds(long fromId, long toId, BigDecimal amount)
        throws InsufficientFundsException { // checked!

    accountRepository.debit(fromId, amount);
    // ↑ This is already saved

    throw new InsufficientFundsException("Not enough funds");
    // ↓ Spring commits here! The debit is in DB, but the credit never happened.
}
```

This is the trap that three months later has the finance team discovering a discrepancy. No exception in the logs of the outer caller — it was caught. No rollback. Silent.

```java
// ✅ Fix: declare rollbackFor explicitly
@Transactional(rollbackFor = Exception.class)
public void transferFunds(...) throws InsufficientFundsException { ... }

// Or: convert to RuntimeException
@Transactional
public void transferFunds(...) {
    try {
        ...
    } catch (InsufficientFundsException e) {
        throw new PaymentFailureException(e); // RuntimeException → rollback triggered
    }
}
```

:::note[Historical context]
This behavior is inherited from EJB conventions — checked exceptions signal "recoverable business conditions." It's not a bug, it's a convention. But a convention you don't know is indistinguishable from a bug.
:::

---

### Trap 5: `readOnly = true` is a Hint, Not a Lock

Many developers think `readOnly = true` prevents writes. It does not.

What it actually does:
- **JPA/Hibernate**: Disables dirty checking — Hibernate does not snapshot entities on load, so it never compares them at flush time. This is a genuine performance optimization for read-heavy operations.
- **Driver/database**: Passes a read-only hint, but whether the database honors it depends on the driver and database. Many ignore it.

You can still call a `nativeQuery` with an `UPDATE` inside a `readOnly = true` method, and it will execute.

```java
@Transactional(readOnly = true)  // Performance hint only
public List<OrderSummary> getRecentOrders(Long userId) {
    // Hibernate skips dirty check snapshot — faster and less memory
    return orderRepository.findTop20ByUserId(userId);
}
```

For pure read-only operations where you don't need the entity graph at all, projections (DTO interfaces directly from repositories) are even faster than `readOnly = true` on managed entities.

---

### Trap 6: `UnexpectedRollbackException` — The Phantom Rollback

This one is subtle. First, separate two concepts:

| Concept | Meaning |
|---|---|
| **Physical transaction** | One real `Connection`, one `setAutoCommit(false)`, one actual commit/rollback at the DB |
| **Logical transaction** | Each time code passes through a `@Transactional` boundary |

When Method A (`@Transactional REQUIRED`) calls Method B (`@Transactional REQUIRED`) on a different bean, there are **two logical transactions but one physical transaction** — B joins A's existing Connection.

B is a **participant** (not the owner). A participant cannot commit or rollback the physical transaction — only the outermost method (the owner) can. So how does a participant signal failure?

It stamps `rollbackOnly = true` on the shared transaction object — like tagging a package "damaged" before putting it back. The owner sees this flag at commit time.

The trap:

```java
@Transactional  // Outer — owns the physical transaction
public void processOrder(Order order) {
    try {
        inventoryService.deduct(order.getItems()); // Inner @Transactional REQUIRED
    } catch (Exception e) {
        log.warn("Inventory issue, continuing: {}", e.getMessage());
        // You swallowed the exception — you think you're fine
    }
    // ... more logic
    orderRepository.save(order); // Reaches here
}
// → commit() → Spring sees rollbackOnly = true on the transaction
// → throws UnexpectedRollbackException: "Transaction rolled back because it has been marked as rollback-only"
```

You caught the exception. But you didn't catch the `rollbackOnly` flag. Spring deliberately throws here rather than silently commit a transaction that had an inner failure — a corrupted partial commit is worse than a loud exception.

**Fix: use `REQUIRES_NEW` when you genuinely want the inner method to fail independently:**

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)  // Own physical transaction
public void deductInventory(List<Item> items) {
    // Own Connection, own commit/rollback, own rollbackOnly flag
    // If this rolls back, the outer transaction is unaffected
}
```

Remember the cost: two Connections held simultaneously (Trap 2).

---

## Fine-Tuning `@Transactional` Configurations

### Transaction Propagation Reference

| Propagation | Behavior |
|---|---|
| `REQUIRED` *(default)* | Join existing transaction. If none exists, create one. |
| `REQUIRES_NEW` | Always create a new physical transaction. Suspend current if present. |
| `NESTED` | If a transaction exists, create a savepoint. Exception rolls back to savepoint only. Outer continues. |
| `SUPPORTS` | Join if exists. Run non-transactionally if not. |
| `MANDATORY` | Join if exists. Throw if no active transaction. |
| `NEVER` | Throw if a transaction is active. |
| `NOT_SUPPORTED` | Suspend current transaction. Run non-transactionally. |

### Rollback Configuration

```java
@Transactional(
    rollbackFor    = {InsufficientFundsException.class, BusinessException.class},
    noRollbackFor  = UserNotificationFailedException.class  // Don't rollback payment if notification fails
)
public void executePayment(PaymentRequest request) throws InsufficientFundsException {
    accountService.deduct(request.getAmount());
    notificationService.sendReceipt(request.getUserId()); // Failure here won't rollback the payment
}
```

---

## Best Practices Checklist

1. **Never do I/O inside a transaction.** HTTP calls, file reads, Kafka publishes — do them before or after. Use `@TransactionalEventListener(AFTER_COMMIT)` for post-commit side effects.
2. **Keep transaction scope minimal.** Open late, close early. The longer a transaction lives, the longer a Connection is held.
3. **Annotate on the class impl, not the interface.** Annotate at method level, not class level — force yourself to think about each boundary.
4. **Declare `rollbackFor` for any checked exception that should roll back.** Don't rely on defaults if you're using checked business exceptions.
5. **`readOnly = true` is a performance hint, not a write guard.** Use it for read-heavy query methods.
6. **Never cross a thread boundary inside a transaction.** `@Async`, `CompletableFuture`, parallel streams all sever the ThreadLocal connection.
7. **Use `REQUIRES_NEW` deliberately.** Each call holds an extra Connection — never use it inside a loop.
8. **Understand `rollbackOnly`.** When catching exceptions from inner `@Transactional` methods, remember the flag may already be set. `REQUIRES_NEW` on the inner method is the clean escape.
9. **Test transaction rollback behavior.** Use integration tests with H2 or Testcontainers, not just unit tests with mocks.
10. **Monitor for long-running transactions.** Use Spring Boot Actuator and slow-query logs. A connection held for seconds is an alert waiting to happen.

---

## The Three Sentences to Remember

If you take nothing else from this guide, take these:

> **Transaction is bound to the thread. Transaction lives exactly as long as the method. The proxy always stands outside the house.**

From these three facts, you can derive every trap described above — without memorizing rules.