---
title: Spring Data JPA Interview Questions
description: Curated senior-level Spring Data JPA and Hibernate interview questions with deep architectural explanations and performance gotchas.
tags: [spring-data-jpa, interview, hibernate, spring]
---

# Spring Data JPA Interview Questions & Answers

These questions cover core Spring Data JPA and Hibernate mechanisms, transaction management, performance optimization, and common production pitfalls.

---

## Part 1: Repository Abstractions & Lifecycle

### 1. What is the difference between `CrudRepository`, `PagingAndSortingRepository`, and `JpaRepository`? How does Spring Data generate repository implementations under the hood?

#### Class Hierarchy
The interfaces form a hierarchy, each extending the previous to add specific capabilities:

```
          Repository<T, ID>
                 ▲
                 │
        CrudRepository<T, ID> (Basic CRUD operations)
                 ▲
                 │
   PagingAndSortingRepository<T, ID> (Pagination and sorting methods)
                 ▲
                 │
  ListPagingAndSortingRepository<T, ID> (Spring Data 3.x, returns List instead of Iterable)
                 ▲
                 │
        JpaRepository<T, ID> (JPA-specific methods: flush, batch deletes, etc.)
```

*   **`CrudRepository`**: Offers basic CRUD operations (`save`, `findById`, `delete`, etc.) returning `Iterable`.
*   **`PagingAndSortingRepository`**: Adds methods to retrieve entities using pagination and sorting (`findAll(Pageable pageable)`).
*   **`JpaRepository`**: Extends the hierarchy with JPA-specific persistence methods, such as `flush()`, `saveAndFlush()`, `deleteInBatch()`, and return types mapped to `List`.

#### Under the Hood: Runtime Proxy Generation
Spring Data JPA does not require class implementations for these repository interfaces because it generates them dynamically at runtime:

1.  **Scanning Phase**: At application startup, `@EnableJpaRepositories` triggers classpath scanning to locate interfaces extending `Repository`.
2.  **Bean Registration**: For each repository interface, Spring registers a `JpaRepositoryFactoryBean` definition in the `ApplicationContext`.
3.  **Proxy Creation**: The factory bean utilizes the **JDK Dynamic Proxy** API (`JdkDynamicAopProxy`) to construct a proxy instance implementing the repository interface.
4.  **Target Executor**: The proxy routes method calls to a backing target bean class, typically `SimpleJpaRepository`, which encapsulates the core JPA `EntityManager` logic.
5.  **Custom Queries**: If a method is a derived query or custom query (`@Query`), the proxy delegates execution to a specialized query executor class (`PartTreeJpaQuery` or `SimpleJpaQuery`).

#### Performance Gotcha
Calling **`saveAndFlush()`** instead of **`save()`** forces Hibernate to immediately trigger `EntityManager.flush()`, pushing SQL statements to the database. This bypasses Hibernate’s internal optimizations (such as delaying SQL execution until the end of the transaction to batch write operations). Only use `saveAndFlush()` when database constraints must be checked immediately, or before running a custom native query that relies on the updated data.

---

### 2. Under the hood, how do JPA Entity Lifecycle States work? Explain the difference between `persist()` and `merge()`.

#### The Four Entity States
Hibernate manages entities inside a `PersistenceContext` (the first-level cache), tracking their states:

```
              [ Transient ] 
                    │
          persist() │ merge()
                    ▼
 ┌─────────────────[ Managed ]◄───────────────┐
 │                    │     ▲                 │
 │           detach() │     │ merge()         │ find() / query
 │            clear() │     │                 │
 │            close() ▼     │                 │
 │               [ Detached ]                 │
 │                                            │
 │ remove()                                   │
 ▼                                            │
[ Removed ] ──────────────────────────────────┴
```

1.  **Transient**: The entity is instantiated via `new`, has no primary key (database identity), and is not associated with an active `Session`.
2.  **Managed (Persistent)**: The entity has a database identity and is associated with the `Session`. Hibernate tracks all modifications to this entity.
3.  **Detached**: The entity has a database identity but is no longer associated with the `Session` (e.g., after the session is closed, or after calling `clear()` / `detach()`). Changes to its fields are ignored by Hibernate.
4.  **Removed**: The entity is associated with the `Session` but is scheduled for deletion from the database during the next flush or transaction commit.

#### Under the Hood: Dirty Checking
When Hibernate loads an entity from the database, it stores its state in the L1 cache. It also retains a read-only copy of the original values (an **entity snapshot**). When the transaction commits or the session is flushed, Hibernate performs **dirty checking**: it compares the managed entity’s current field values against the snapshot. If a difference is detected, it automatically constructs and executes an SQL `UPDATE` statement.

#### `persist()` vs `merge()`
*   **`persist(entity)`**: 
    *   Designed to make a transient instance managed.
    *   It binds the passed entity instance to the `Session`.
    *   It does not execute an SQL `INSERT` immediately unless the primary key generation strategy is `IDENTITY` (which requires database roundtrip to obtain the ID).
*   **`merge(entity)`**: 
    *   Designed to copy the state of a detached entity onto a managed entity instance.
    *   If a managed instance with the same ID already exists in the `Session`, it copies the state onto it. If not, it loads the entity from the database, copies the state, and returns the managed instance.
    *   **Crucial Difference**: The object reference passed to `merge()` remains detached. You must use the returned object reference to continue tracking changes.

```java
User detachedUser = ...;
// Modifying detachedUser after merge does nothing!
User managedUser = userRepository.save(detachedUser); 
managedUser.setName("New Name"); // This change will be dirty-checked and updated
```

---

## Part 2: Querying & Fetching Mechanics

### 3. Compare Derived Query Methods, JPQL `@Query`, and Native `@Query`. What are their execution differences and gotchas?

| Feature | Derived Query Methods | JPQL `@Query` | Native `@Query` |
| :--- | :--- | :--- | :--- |
| **Parsing Target** | Method name tokens | Java Entity Model | Database Tables & Columns |
| **Syntax Validation** | Startup (fails early) | Startup (fails early) | Runtime (on execution) |
| **Portability** | High (database-agnostic) | High (database-agnostic) | Low (database-specific) |
| **Cache Integration** | Fully integrated | Fully integrated | Bypasses Hibernate L2 Cache |

#### Execution Details & Parsing
*   **Derived Queries**: Spring parses the method name using the `PartTree` parser, translating keywords (`findBy`, `And`, `Between`) into an Abstract Syntax Tree (AST). This AST is then compiled into a JPQL query string before Hibernate translates it into SQL.
*   **JPQL `@Query`**: You write queries using Java entity names and property names rather than database tables. The Hibernate HQL/JPQL parser validates this mapping at application startup.
*   **Native Queries**: Spring passes the query directly to the database via JDBC, bypassing JPA’s SQL translation engine.

#### Gotchas
*   **Dirty Checking with Native Queries**: Native queries execute raw SQL. If you execute a native query that updates data, Hibernate is unaware of the change. You must manually clean up the first-level cache to prevent stale reads.
*   **Complex Derived Queries**: Writing long method names like `findByActiveTrueAndGroup_IdInAndEmailContainingIgnoreCase` is hard to read and generates inefficient SQL. Use JPQL or Specifications instead.
*   **DTO Projections**: For read-only data, map queries to interfaces or Java `record` projections. This is faster because Hibernate does not register these projections in the first-level cache, saving memory.

---

### 4. What is the difference between `findById()` and `getReferenceById()`? When should you use each?

#### Mechanics
*   **`findById(ID id)`**:
    *   Executes an database query (`SELECT * FROM table WHERE id = ?`) immediately to retrieve the entity.
    *   Returns an `Optional<T>` containing the managed entity, or `Optional.empty()` if not found.
*   **`getReferenceById(ID id)`** (formerly `getOne()`):
    *   Returns a lazy-initialized proxy object (a dynamic subclass generated via ByteBuddy) containing only the identifier value.
    *   It **does not** execute an database query immediately. The database is queried only when you access a non-identifier property (e.g., `user.getName()`).

#### Under the Hood Interaction
```
Client ──► getReferenceById(1) ──► Proxy object returned (No SQL executed)
                                       │
Client ──► proxy.getName() ────────────┼──► SQL SELECT executed to populate proxy
                                       │
(If Session is closed) ────────────────┼──► Throws LazyInitializationException
```

#### Gotchas & Best Use Case
If the Hibernate session is closed before the proxy is initialized, accessing any non-ID property will throw a `LazyInitializationException`.

**Best Use Case for `getReferenceById()`**: Setting a foreign key relationship without hitting the database.
```java
// Avoids loading the entire User entity from the DB just to assign it to a Post
User authorRef = userRepository.getReferenceById(authorId);
Post post = new Post();
post.setAuthor(authorRef); // Binds the foreign key directly
postRepository.save(post);
```

---

### 5. What is the N+1 Query Problem in Spring Data JPA? Detail its 4 primary solutions and their trade-offs.

The N+1 query problem occurs when you fetch a parent entity and iterate through its child collections. Hibernate executes one query to fetch the parent entities, followed by $N$ separate queries to load children for each of the $N$ parent records.

#### The 4 Core Solutions

##### 1. `JOIN FETCH` (JPQL)
Forces the child collection to load eagerly in the initial query using an SQL `INNER JOIN` or `LEFT JOIN`.
```java
@Query("SELECT p FROM Parent p LEFT JOIN FETCH p.children")
List<Parent> findAllWithChildren();
```
*   **Trade-off**: Highly efficient, but can cause a Cartesian product if you attempt to fetch multiple collections in a single query, resulting in a `MultipleBagFetchException`.

##### 2. `@EntityGraph` (Declarative Path Specification)
Configures dynamic fetch paths on top of query methods.
```java
@EntityGraph(attributePaths = {"children"})
List<Parent> findAll();
```
*   **Trade-off**: Easy to use, but suffers from the same Cartesian product limitations as `JOIN FETCH`.

##### 3. Default Batch Fetch Size (`default_batch_fetch_size`)
A global setting that groups lazy collection initialization.
```yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 50
```
When accessing children, Hibernate groups loading queries using an `IN` clause:
```sql
SELECT * FROM child WHERE parent_id IN (?, ?, ..., ?)
```
*   **Trade-off**: Excellent safety net that reduces $N+1$ queries down to $1 + N/\text{batch\_size}$. However, it does not reduce it to a single query.

##### 4. Subselect Fetching (`@Fetch(FetchMode.SUBSELECT)`)
Annotated directly on the entity collection property.
```java
@OneToMany(mappedBy = "parent")
@Fetch(FetchMode.SUBSELECT)
private List<Child> children;
```
*   **Trade-off**: Hibernate runs a second query using a subselect containing the original parent query:
    ```sql
    SELECT * FROM child WHERE parent_id IN (SELECT id FROM parent WHERE ...)
    ```
    This is useful for bulk processing, but cannot be configured dynamically per query method.

#### Critical Production Gotchas
*   **Cartesian Product**: Fetching multiple collections eagerly (e.g., fetching both `children` and `addresses` on a `Parent` class) generates a massive intermediate Cartesian product in database memory, degrading performance.
*   **In-Memory Pagination Hazard**: Combining pagination with collection fetching (`JOIN FETCH`) causes Hibernate to log a warning: `HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!`.
    To paginate correctly, Hibernate must fetch *all* database rows into the application server's memory and perform the pagination there. This can exhaust heap memory and crash the application in production. 
    *   *Solution*: Paginate the parent entities first, then fetch the child relationships in a separate query or use `default_batch_fetch_size`.

---

### 6. Dynamic Filtering: Compare Specifications (Criteria API) and Query by Example (QBE).

#### Comparison Table

| Feature | Specifications | Query By Example (QBE) |
| :--- | :--- | :--- |
| **Implementation Layer** | JPA Criteria API | Spring Data Repository Abstraction |
| **Type Safety** | Fully type-safe (with static metamodel) | Implicitly type-safe (uses entity probes) |
| **Range Queries (`>`, `<`)** | Supported | Not supported |
| **Nested Joins** | Supported | Limited (no deep nesting) |
| **Logical OR Queries** | Supported | Not supported |

#### Specifications Example (Dynamic Criteria API)
Specifications are ideal for building complex search screens:
```java
public class ProductSpecifications {
    public static Specification<Product> hasName(String name) {
        return (root, query, cb) -> name == null ? null : cb.like(root.get("name"), "%" + name + "%");
    }
    public static Specification<Product> priceBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> cb.between(root.get("price"), min, max);
    }
}
// Usage
productRepository.findAll(Specification.where(hasName("laptop")).and(priceBetween(min, max)));
```

#### Query By Example (QBE)
QBE matches records using a partially populated entity instance called a **probe**:
```java
Product probe = new Product();
probe.setName("laptop");
probe.setActive(true);

ExampleMatcher matcher = ExampleMatcher.matching()
    .withStringMatcher(ExampleMatcher.StringMatcher.CONTAINING);
List<Product> products = productRepository.findAll(Example.of(probe, matcher));
```

#### Gotcha
Do not use QBE for production reports or complex filter forms. QBE cannot handle range filters (e.g. `price > 100`), null checks (`status IS NULL`), or logical `OR` grouping. Use Specifications or QueryDSL for these scenarios.

---

### 7. How does `@Modifying` work, and why must it be synchronized with the persistence context?

#### Mechanics
By default, Spring Data assumes all repository methods executing a `@Query` are read-only select queries. The `@Modifying` annotation tells the framework to execute the query as an update, insert, or delete statement using JDBC’s `executeUpdate()` instead of `executeQuery()`.

#### Stale Persistence Context Gotcha
Bulk update or delete queries execute directly on the database. Because they bypass the Hibernate persistence context, the entity objects already loaded in your application's memory do not reflect these updates:

```java
// Example entity name: Product(id=1, name="Old Name")
Product product = productRepository.findById(1L).orElseThrow();

// Bulk update database directly
productRepository.updateName(1L, "New Name");

// The local entity instance still holds the stale value!
System.out.println(product.getName()); // Prints "Old Name"
```

#### The Fix
To prevent stale reads, use the `clearAutomatically` and `flushAutomatically` attributes. This flushes any pending changes to the database and clears the persistence context immediately after the query completes:

```java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("UPDATE Product p SET p.name = :name WHERE p.id = :id")
int updateName(@Param("id") Long id, @Param("name") String name);
```

---

## Part 3: Transaction Management & Proxies

### 8. How does `@Transactional` AOP Proxying work, and why does Self-Invocation break it? How do you resolve this?

#### AOP Proxy Mechanics
When a bean is annotated with `@Transactional`, Spring wraps the target instance with an AOP proxy at runtime (using JDK dynamic proxies or CGLIB subclassing).

```
Client ──► Proxy [Get Connection, Begin Txn] ──► Target Bean (Business Logic)
                                                      │ (Exception occurs)
Client ◄── Proxy [Commit / Rollback Txn] ◄────────────┘
```

The proxy manages the connection lifecycle:
1.  Obtains a database connection from the connection pool.
2.  Sets autocommit to false (`connection.setAutoCommit(false)`).
3.  Executes the target method.
4.  If the method completes successfully, it commits the transaction. If a runtime exception is thrown, it rolls back the transaction.

#### The Self-Invocation Problem
If a method within a bean calls another transactional method in the same bean, the call bypasses the proxy wrapper. This is called **self-invocation**.

```java
@Service
public class OrderService {

    public void placeOrder() {
        // Internal call to saveOrder() bypasses the Spring proxy.
        // No transaction will be opened for saveOrder()!
        saveOrder(); 
    }

    @Transactional
    public void saveOrder() {
        // Database operations
    }
}
```

#### Solutions

##### 1. Refactoring (Recommended)
Extract the transactional method to a separate service bean. This ensures calls pass through the Spring proxy:
```java
@Service
public class OrderProcessor {
    @Autowired private OrderRepositoryService repositoryService;

    public void placeOrder() {
        repositoryService.saveOrder(); // Passes through proxy wrapper
    }
}
```

##### 2. Programmatic Transactions
Use `TransactionTemplate` instead of the `@Transactional` annotation. This is cleaner than self-invocation workarounds:
```java
@Autowired private TransactionTemplate transactionTemplate;

public void placeOrder() {
    transactionTemplate.execute(status -> {
        // Executed within a transaction boundary
        return saveOrder();
    });
}
```

##### 3. Self-Wiring with `@Lazy`
Inject the proxy of the class into itself. This ensures self-calls route through the proxy wrapper:
```java
@Service
public class OrderService {
    @Autowired @Lazy private OrderService self;

    public void placeOrder() {
        self.saveOrder(); // Routes through proxy wrapper
    }
}
```

---

### 9. Why does Spring not roll back transactions on Checked Exceptions by default? How do you override this?

#### Under the Hood: Rollback Logic
Spring’s transaction rollback rules are managed by `TransactionAspectSupport`. When an exception escapes a `@Transactional` method, the proxy evaluates the exception against these rules:

```java
// Spring internal rollback logic representation
protected void completeTransactionAfterThrowing(TransactionInfo txInfo, Throwable ex) {
    if (txInfo.transactionAttribute.rollbackOn(ex)) {
        txInfo.getTransactionManager().rollback(txInfo.getTransactionStatus());
    } else {
        txInfo.getTransactionManager().commit(txInfo.getTransactionStatus());
    }
}
```

By default, the transaction rolls back if the exception is an instance of `RuntimeException` or `Error`. If it is a checked exception (inheriting directly from `java.lang.Exception`), the transaction is committed.

#### Historical Rationale
This behavior is based on standard Java exception semantics:
*   **Checked Exceptions** are expected to represent recoverable business conditions (e.g. `InsufficientFundsException`). The application should catch these and allow the transaction to commit anyway.
*   **Unchecked Exceptions** (e.g. `NullPointerException`, `DataAccessException`) represent unexpected system failures or bugs. These should trigger a rollback to prevent corrupted state.

#### How to Override
To roll back on checked exceptions, define the `rollbackFor` attribute on the annotation:
```java
@Transactional(rollbackFor = Exception.class)
public void processTransaction() throws IOException {
    // This transaction will roll back if IOException is thrown
}
```

---

### 10. Explain the difference between Flush and Commit in Hibernate.

*   **Flush (`EntityManager.flush()`)**:
    *   Synchronizes the current database session state with the database.
    *   Hibernate translates dirty entity states into SQL statements (`INSERT`, `UPDATE`, `DELETE`) and sends them to the database.
    *   **Crucial point**: The database transaction remains open. The changes are not finalized and database locks are held. Other database sessions cannot read these changes (depending on the transaction isolation level).
*   **Commit (`Transaction.commit()`)**:
    *   Triggers a database-level `COMMIT` command.
    *   This makes all database updates permanent and releases any active locks.
    *   **Crucial point**: A flush is always triggered automatically right before the commit is executed.

---

### 11. What are the connection pool risks of using `@Transactional(propagation = Propagation.REQUIRES_NEW)`?

Using `Propagation.REQUIRES_NEW` suspends the outer transaction, holds its database connection open, and opens a new transaction with a second database connection.

```
Request Thread ──► Starts Txn 1 (Conns: 1 open)
                     │
                     └──► calls REQUIRES_NEW method ──► Suspends Txn 1
                                                          │
                                                          └──► Starts Txn 2 (Conns: 2 open!)
```

#### Connection Pool Deadlock Hazard
This behavior can easily lead to connection pool deadlock under heavy loads.

Consider a system using HikariCP with a max pool size of 10, running on a server with 10 threads:
1.  10 concurrent requests arrive. Each request starts a parent transaction, consuming all 10 connections.
2.  Each thread then calls a method annotated with `@Transactional(propagation = Propagation.REQUIRES_NEW)`.
3.  Each thread suspends its parent transaction and requests a second connection from the pool to start the new transaction.
4.  The pool has no available connections. All 10 threads wait for a connection to release.
5.  However, no thread can release its connection because the suspended outer transaction is waiting for the inner transaction to finish.
6.  The application deadlocks and requests time out.

#### Prevention Formula
To prevent this, configure your connection pool size using the formula:
$$\text{Pool Size} \ge \text{Max Threads} \times (\text{Max Nested Connections} - 1) + 1$$
If your application uses nested transactions, ensure the database connection pool is sized to support them. Alternatively, refactor the application to run the nested operations asynchronously or outside of the parent transaction.

---

## Part 4: Performance Tuning & Concurrency

### 12. Compare Optimistic and Pessimistic Locking. When should you use each, and how do you handle locking exceptions?

#### Comparison

| Feature | Optimistic Locking | Pessimistic Locking |
| :--- | :--- | :--- |
| **Mechanism** | Application-level version check (`@Version`) | Database-level lock (e.g., `FOR UPDATE`) |
| **SQL Output** | Standard `UPDATE ... WHERE version = ?` | `SELECT ... FOR UPDATE` |
| **Locking Cost** | Low (non-blocking) | High (blocks concurrent transactions) |
| **Scalability** | High (good for low write contention) | Low (can cause lock wait timeouts) |
| **Failure Time** | During transaction flush/commit | During SQL read statement |

#### Optimistic Locking
Use a `@Version` field on your entity class. Hibernate checks this version during updates to prevent concurrent modification:
```java
@Entity
public class Account {
    @Id private Long id;
    @Version private Long version;
    private BigDecimal balance;
}
```
If two transactions read version `1` and attempt to write, the first transaction commits and increments the version to `2`. The second transaction fails with an `OptimisticLockException` because it tries to update the row where `version = 1`.

#### Pessimistic Locking
Instructs the database to lock the row during a read operation:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT a FROM Account a WHERE a.id = :id")
Optional<Account> findAndLockById(@Param("id") Long id);
```
This issues a `SELECT ... FOR UPDATE` query, preventing other transactions from reading or updating the row until this transaction commits.

#### Gotchas
*   **Pessimistic Deadlocks**: If Transaction A locks Row 1 and waits for Row 2, while Transaction B locks Row 2 and waits for Row 1, a database deadlock occurs. Keep lock durations short and request resources in a consistent order.
*   **Optimistic Retries**: Because optimistic locking fails at commit time, your application must handle the exception. You can catch `ObjectOptimisticLockingFailureException` and retry the operation using retry mechanisms like Spring Retry:
    ```java
    @Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3)
    @Transactional
    public void updateBalance(Long id, BigDecimal amount) {
        Account account = accountRepository.findById(id).orElseThrow();
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);
    }
    ```

---

### 13. How do you configure and optimize JDBC Batch Writes in Spring Data JPA? What is the identity generation strategy trap?

#### Enabling Batch Writes
By default, Hibernate executes insert and update statements one-by-one. To enable batching, add these properties to your configuration:

```properties
# Set the number of statements sent to the database in a single batch
spring.jpa.properties.hibernate.jdbc.batch_size=50

# Group identical insert/update queries to enable multi-row statement batching
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true

# For MySQL, enable rewriting statements into multi-row inserts
spring.datasource.url=jdbc:mysql://localhost:3306/db?rewriteBatchedStatements=true
```

#### The Identity Generation Trap
If your entities use `@GeneratedValue(strategy = GenerationType.IDENTITY)`, Hibernate silently disables JDBC batching.

##### Why?
The `IDENTITY` strategy relies on the database's auto-increment feature to generate primary keys. To assign an ID to an entity instance in the persistence context, Hibernate must execute the SQL `INSERT` statement immediately. This prevents Hibernate from batching inserts.

##### The Solution
Use the `SEQUENCE` generation strategy or switch to client-side UUID generation:
```java
@Entity
public class BatchEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "batch_seq")
    @SequenceGenerator(name = "batch_seq", sequenceName = "batch_sequence", allocationSize = 50)
    private Long id;
}
```
Set the sequence `allocationSize` to match your Hibernate `batch_size`. This allows Hibernate to fetch 50 IDs in a single query and batch the subsequent 50 insert statements.

---

### 14. What are the primary transaction anti-patterns in production, and how do you avoid them?

#### 1. Long-Running Transactions containing Network I/O
Executing external HTTP, REST, or gRPC calls inside a method annotated with `@Transactional` holds database connections open during network operations.

```
[Start Transaction] ──► [Select Query] ──► [Slow HTTP Call (3s)] ──► [Commit]
▲                                          ▲
└──────── Connection acquired ─────────────┴────── Connection held idle (Blocks pool!)
```

*   **Impact**: Degrades connection pool performance, causing thread starvation.
*   **Fix**: Extract the network call out of the transactional method. Only wrap database write operations in transactions:

```java
// Anti-pattern
@Transactional
public void processOrder(OrderRequest req) {
    Order order = orderRepository.save(new Order());
    paymentClient.charge(req.getPayment()); // Network IO held inside transaction
}

// Correct Pattern
public void processOrder(OrderRequest req) {
    // 1. Perform network call
    paymentClient.charge(req.getPayment());
    // 2. Perform DB operations inside a short transaction
    orderService.saveOrderRecord(req);
}
```

#### 2. Open Session in View (OSIV) Hazard
Spring Boot enables OSIV by default (`spring.jpa.open-in-view=true`). This keeps the database connection open during the entire view or JSON serialization phase, allowing lazy collections to load in the controller/view layers.
*   **Impact**: Leads to silent, unexpected $N+1$ queries during JSON serialization, and holds connection pool resources open until requests complete.
*   **Fix**: Disable OSIV in configuration:
    ```properties
    spring.jpa.open-in-view=false
    ```
    Map entities to DTO projections in the service layer to load all required data before reaching the controller.

#### 3. Transactional Annotations on Non-Public Methods
Annotating a `private`, `protected`, or package-private method with `@Transactional` will fail silently. Spring AOP proxies only intercept public method calls.

---

### 15. How do you prevent infinite JSON recursion in bidirectional entity relationships?

In bidirectional relationships (such as `@OneToMany` parent-child structures), parent and child entities reference each other. During JSON serialization, Jackson traverses these references recursively (Parent $\rightarrow$ Child $\rightarrow$ Parent $\rightarrow$ Child...), resulting in a `StackOverflowError`.

#### Solutions

##### 1. DTO Projections (Best Practice)
Map database entities to lightweight Java `record` classes or DTO objects before returning them from the API layer. This decouples your database schema from your API contracts:
```java
public record ParentDto(Long id, String name, List<ChildDto> children) {}
public record ChildDto(Long id, String detail) {}
```
Use mapping libraries like MapStruct to automate this mapping.

##### 2. `@JsonManagedReference` & `@JsonBackReference`
Decorate the relationship fields to define serialization ownership:
```java
// In Parent.java
@OneToMany(mappedBy = "parent")
@JsonManagedReference
private List<Child> children;

// In Child.java
@ManyToOne
@JoinColumn(name = "parent_id")
@JsonBackReference
private Parent parent;
```
Jackson serializes the child list when writing the parent, but ignores the parent reference when serializing child records.

##### 3. `@JsonIgnoreProperties`
Ignore specific properties during serialization:
```java
@ManyToOne
@JoinColumn(name = "parent_id")
@JsonIgnoreProperties("children")
private Parent parent;
```

---

## Compare Next

*   [Hibernate: Transactions and Performance in Spring Apps](./hibernate-transactions-performance.md)
*   [Spring Data JPA Overview & Configurations](./spring-data-jpa.md)
*   [Spring Framework Deep Dive](./spring-framework-deep-dive.md)
