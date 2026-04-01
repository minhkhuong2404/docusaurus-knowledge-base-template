---
title: Spring Data JPA — Complete Guide
description: Complete guide to Spring Data JPA, including repositories, entities, query methods, and persistence best practices.
tags: [spring-data-jpa, java, backend, persistence]
---

# Spring Data JPA — Complete Guide

Spring Data JPA simplifies database access in Spring applications by providing a powerful abstraction layer on top of JPA (Java Persistence API), drastically reducing boilerplate code for common data operations.

---

## What Is Spring Data JPA?

Spring Data JPA is part of the larger **Spring Data** project. It provides a repository abstraction on top of JPA that eliminates the need to write boilerplate data access code. Instead of manually writing `EntityManager` operations, you define interfaces and Spring generates the implementation at runtime.

**Key idea:** Define a repository interface, declare method signatures following naming conventions, and Spring Data JPA generates the SQL queries and implementation automatically.

#### 👶 Beginner Concept: The "Universal Translator"
Imagine you only speak English (Java Objects) and you need to talk to someone who only speaks Japanese (SQL Database). 
- **Without JPA (JDBC):** You have to manually write out the Japanese translation for every sentence you want to say (`SELECT * FROM users WHERE...`), give it to a messenger, wait for the Japanese reply, and manually translate it back into English.
- **With JPA (The Translator):** You just say "Save this User" in English. The JPA framework acts as a real-time Universal Translator. It converts your English object into Japanese SQL, sends it over, and when reading data back, instantly converts the SQL rows back into English Java objects.

---

## Why Use Spring Data JPA?

### Problems It Solves

| Problem | How Spring Data JPA Fixes It |
|---|---|
| Repetitive CRUD boilerplate | Auto-generated repository implementations |
| Manual query writing for simple operations | Query derivation from method names |
| Complex pagination and sorting logic | Built-in `Pageable` and `Sort` support |
| Tedious EntityManager management | Automatic session and transaction handling |
| Verbose DAO layer | Single interface replaces entire DAO class |
| Database migration headaches | Integrates with Flyway / Liquibase |

### Core Benefits

1. **Zero Boilerplate** — `JpaRepository` provides CRUD, pagination, sorting, and batch operations out of the box.
2. **Derived Queries** — Method names like `findByEmailAndStatus()` generate SQL automatically.
3. **Custom Queries** — `@Query` annotation for JPQL or native SQL when needed.
4. **Pagination & Sorting** — First-class support via `Pageable` and `Sort` parameters.
5. **Auditing** — Automatic tracking of created/modified dates and users.
6. **Integration** — Works seamlessly with Spring Boot, Spring MVC, and Spring Security.

---

## Repository Hierarchy

Spring Data JPA provides a hierarchy of repository interfaces:

```
Repository (marker interface)
    │
    ▼
CrudRepository (basic CRUD: save, findById, delete, findAll, count)
    │
    ▼
ListCrudRepository (returns List instead of Iterable)
    │
    ▼
PagingAndSortingRepository (adds pagination and sorting)
    │
    ▼
JpaRepository (adds JPA-specific: flush, saveAndFlush, deleteInBatch)
```

### CrudRepository vs JpaRepository

| Feature | `CrudRepository` | `JpaRepository` |
|---|---|---|
| Basic CRUD | Yes | Yes (inherits) |
| Pagination & Sorting | No | Yes |
| `flush()` | No | Yes |
| `saveAndFlush()` | No | Yes |
| `deleteInBatch()` | No | Yes |
| `getById()` / `getReferenceById()` | No | Yes |
| Returns | `Iterable` | `List` |

> **Best practice:** Use `JpaRepository` in most cases — it provides the most functionality.

---

## Defining Entities

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    // constructors, getters, setters
}
```

### Key Annotations

| Annotation | Purpose |
|---|---|
| `@Entity` | Marks the class as a JPA entity |
| `@Table` | Specifies the database table name |
| `@Id` | Marks the primary key field |
| `@GeneratedValue` | Configures auto-generation strategy for the primary key |
| `@Column` | Configures column properties (nullable, unique, length) |
| `@Enumerated` | Specifies how enums are persisted (STRING or ORDINAL) |
| `@Temporal` | Specifies temporal precision for `Date`/`Calendar` fields (DATE, TIME, TIMESTAMP) |
| `@CreatedDate` / `@LastModifiedDate` | JPA auditing fields |
| `@OneToMany` / `@ManyToOne` / `@ManyToMany` | Relationship mappings |

---

## Creating Repositories

### Basic Repository

```java
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Data JPA generates the implementation at runtime
}
```

This single interface provides:
- `save()`, `saveAll()`
- `findById()`, `findAll()`, `findAllById()`
- `deleteById()`, `delete()`, `deleteAll()`
- `count()`, `existsById()`
- `flush()`, `saveAndFlush()`
- Pagination and sorting via `findAll(Pageable)` and `findAll(Sort)`

### Enable JPA Repositories

In Spring Boot, repositories are auto-detected. For manual configuration:

```java
@Configuration
@EnableJpaRepositories(basePackages = "com.example.repository")
public class JpaConfig { }
```

---

## Query Methods

### Derived Queries (Method Name Convention)

Spring Data JPA generates queries from method names:

```java
public interface UserRepository extends JpaRepository<User, Long> {

    // SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // SELECT * FROM users WHERE status = ? AND email LIKE ?
    List<User> findByStatusAndEmailContaining(UserStatus status, String email);

    // SELECT * FROM users WHERE age > ? ORDER BY last_name ASC
    List<User> findByAgeGreaterThanOrderByLastNameAsc(int age);

    // SELECT * FROM users WHERE username IN (?)
    List<User> findByUsernameIn(Collection<String> usernames);

    // SELECT COUNT(*) FROM users WHERE status = ?
    long countByStatus(UserStatus status);

    // DELETE FROM users WHERE status = ?
    void deleteByStatus(UserStatus status);

    // SELECT * FROM users WHERE active = true
    List<User> findByActiveTrue();
}
```

### Naming Convention Keywords

| Keyword | Example | SQL Fragment |
|---|---|---|
| `And` | `findByFirstNameAndLastName` | `WHERE first_name = ? AND last_name = ?` |
| `Or` | `findByFirstNameOrLastName` | `WHERE first_name = ? OR last_name = ?` |
| `Between` | `findByAgeBetween` | `WHERE age BETWEEN ? AND ?` |
| `LessThan` / `GreaterThan` | `findByAgeLessThan` | `WHERE age < ?` |
| `Like` / `Containing` | `findByNameContaining` | `WHERE name LIKE %?%` |
| `In` | `findByStatusIn` | `WHERE status IN (?)` |
| `OrderBy` | `findByOrderByNameAsc` | `ORDER BY name ASC` |
| `IsNull` / `IsNotNull` | `findByEmailIsNull` | `WHERE email IS NULL` |
| `True` / `False` | `findByActiveTrue` | `WHERE active = true` |
| `Top` / `First` | `findTop5ByOrderByCreatedAtDesc` | `LIMIT 5` |

---

## Custom Queries

### JPQL Queries with @Query

```java
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailAddress(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.status = :status ORDER BY u.createdAt DESC")
    List<User> findActiveUsers(@Param("status") UserStatus status);

    @Query("SELECT u FROM User u JOIN u.orders o WHERE o.total > :minTotal")
    List<User> findUsersWithLargeOrders(@Param("minTotal") BigDecimal minTotal);
}
```

### Native SQL Queries

```java
@Query(value = "SELECT * FROM users WHERE email = :email", nativeQuery = true)
Optional<User> findByEmailNative(@Param("email") String email);
```

### Modifying Queries

Use `@Modifying` with `@Transactional` for UPDATE/DELETE operations:

```java
@Modifying
@Transactional
@Query("UPDATE User u SET u.status = :status WHERE u.lastLoginAt < :date")
int deactivateInactiveUsers(@Param("status") UserStatus status,
                             @Param("date") LocalDateTime date);
```

> `@Modifying` tells Spring Data JPA that the query changes data (not just reads it).

---

## Pagination and Sorting

### Pageable

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Page<User> findByStatus(UserStatus status, Pageable pageable);
}
```

```java
// In service or controller
Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
Page<User> page = userRepository.findByStatus(UserStatus.ACTIVE, pageable);

page.getContent();       // List<User> for this page
page.getTotalElements(); // Total matching records
page.getTotalPages();    // Total pages
page.getNumber();        // Current page number
page.getSize();          // Page size
```

### Sorting

```java
List<User> users = userRepository.findAll(Sort.by(
    Sort.Order.asc("lastName"),
    Sort.Order.desc("createdAt")
));
```

---

## Entity Relationships

### One-to-Many / Many-to-One

```java
@Entity
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();
}

@Entity
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
```

### Many-to-Many

```java
@Entity
public class Student {
    @ManyToMany
    @JoinTable(
        name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> courses = new HashSet<>();
}
```

### Fetch Types

| FetchType | Behavior | Default For |
|---|---|---|
| `EAGER` | Loads related entities immediately with the parent | `@ManyToOne`, `@OneToOne` |
| `LAZY` | Loads related entities only when accessed | `@OneToMany`, `@ManyToMany` |

> **Best practice:** Use `FetchType.LAZY` everywhere and fetch eagerly only when needed via `JOIN FETCH` or `@EntityGraph`.

### Avoiding Bidirectional Serialization Issues

When serializing bidirectional relationships to JSON, use:

```java
@JsonManagedReference  // On the parent side
private List<Order> orders;

@JsonBackReference     // On the child side
private User user;
```

Or better — use DTOs to control exactly what gets serialized.

---

## Composite Primary Keys

### Using @EmbeddedId

```java
@Embeddable
public class OrderItemId implements Serializable {
    private Long orderId;
    private Long productId;
    // equals() and hashCode()
}

@Entity
public class OrderItem {
    @EmbeddedId
    private OrderItemId id;

    private int quantity;
    private BigDecimal price;
}
```

---

## Transactions

The `@Transactional` annotation ensures multiple database operations are treated as a single atomic unit:

```java
@Service
public class OrderService {

    @Transactional
    public Order placeOrder(OrderRequest request) {
        // All operations within this method run in a single transaction
        User user = userRepository.findById(request.getUserId()).orElseThrow();
        Order order = new Order(user, request.getItems());
        orderRepository.save(order);
        inventoryService.decrementStock(request.getItems());
        return order;
        // If any operation throws an exception, ALL changes are rolled back
    }

    @Transactional(readOnly = true)
    public List<Order> getOrders(Long userId) {
        // readOnly = true optimizes read-only operations
        return orderRepository.findByUserId(userId);
    }
}
```

**Key `@Transactional` attributes:**

| Attribute | Purpose |
|---|---|
| `readOnly` | Optimization hint for read-only transactions |
| `propagation` | Controls how transactions nest (REQUIRED, REQUIRES_NEW, etc.) |
| `isolation` | Database isolation level |
| `rollbackFor` | Exception types that trigger rollback |
| `timeout` | Transaction timeout in seconds |

---

## Transactions

The `@Transactional` annotation ensures multiple database operations are treated as a single atomic unit:

```java
@Transactional
public void placeOrder() {
    orderRepository.save(order);
    inventoryService.decrementStock();
}
````

👉 All operations:

* Run in a **single transaction**
* Either **ALL succeed or ALL rollback**

---

# 🔥 Advanced: Transaction Semantics (Senior-Level)

## 1. Default Rollback Rules (CRITICAL)

In Spring Framework:

| Exception Type      | Example                | Behavior   |
| ------------------- | ---------------------- | ---------- |
| Unchecked Exception | RuntimeException       | ❌ Rollback |
| Checked Exception   | Exception, IOException | ✅ Commit   |
| Error               | OutOfMemoryError       | ❌ Rollback |

### 🔑 Key Insight

Spring **does NOT rollback on checked exceptions by default**.

👉 This is one of the most common production bugs.

---

## 2. Why This Design Exists

Historical reason (EJB):

| Type                | Meaning            |
| ------------------- | ------------------ |
| Checked Exception   | Business condition |
| Unchecked Exception | System failure     |

### 🚨 Reality in Modern Systems

* Business failures SHOULD rollback
* Default behavior is often **wrong for real-world systems**

---

## 3. Real Production Pitfalls

### Case 1: Checked Exception → Unexpected Commit

```java
@Transactional
public void createOrder() throws Exception {
    orderRepository.save(order);
    throw new Exception("fail");
}
```

👉 ❗ Data is still committed

---

### Case 2: Swallowed Exception → No Rollback

```java
@Transactional
public void createOrder() {
    try {
        orderRepository.save(order);
        throw new RuntimeException();
    } catch (Exception e) {
        // ignored
    }
}
```

👉 ❗ Transaction commits

---

### Case 3: Self Invocation (Proxy Bypass)

```java
public void methodA() {
    methodB(); // bypass proxy
}

@Transactional
public void methodB() {
    throw new RuntimeException();
}
```

👉 ❗ Transaction NOT applied

---

### Case 4: Non-public Methods

```java
@Transactional
private void doSomething() {}
```

👉 ❗ Ignored by proxy

---

## 4. Fixing Rollback Behavior

### Option 1: Rollback for checked exceptions

```java
@Transactional(rollbackFor = Exception.class)
```

---

### Option 2 (Best Practice): Use RuntimeException

```java
public class BusinessException extends RuntimeException {}
```

👉 Ensures consistent rollback behavior

---

## 5. Transaction Lifecycle (Internal Flow)

Understanding this is **senior-level expectation**:

1. Proxy intercepts method call
2. `PlatformTransactionManager` starts transaction
3. Business logic executes
4. If exception occurs:

   * Evaluate rollback rules
5. Commit or rollback

### Core Components

* `TransactionInterceptor`
* `PlatformTransactionManager`
* AOP Proxy (JDK / CGLIB)

---

## 6. Commit vs Flush (Frequently Asked in Interviews)

```java
@Transactional
public void example() {
    repository.save(entity);
}
```

👉 `save()` does NOT commit immediately

### Timeline

| Step     | Action                     |
| -------- | -------------------------- |
| save()   | Add to persistence context |
| flush()  | Generate SQL               |
| commit() | Execute SQL                |

### 🔑 Insight

* JPA uses **write-behind strategy**
* SQL may execute **before commit** (auto flush on query)

---

## 7. Transaction Propagation (Very Important)

### REQUIRED (default)

* Reuses existing transaction
* Creates new if none exists

---

### REQUIRES_NEW

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
```

* Suspends current transaction
* Starts a new one

👉 Use cases:

* Audit logging
* Outbox pattern
* Retry isolation

---

### NESTED

* Uses savepoints
* Partial rollback possible

---

## 8. Isolation Levels (DB Consistency)

```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
```

| Level           | Prevents             |
| --------------- | -------------------- |
| READ_COMMITTED  | Dirty reads          |
| REPEATABLE_READ | Non-repeatable reads |
| SERIALIZABLE    | Phantom reads        |

---

## 9. Senior-Level Design Considerations

### 🔥 1. Keep Transactions SHORT

❌ Bad:

```java
@Transactional
public void process() {
    callExternalAPI(); // slow
}
```

👉 Causes:

* Lock contention
* Deadlocks
* Throughput collapse

---

### 🔥 2. Never Call Remote Services Inside Transaction

* DB locks are held during network calls
* High risk of cascading failures

---

### 🔥 3. Define Proper Boundaries

✔ Service Layer
❌ Controller
❌ Repository

---

### 🔥 4. Idempotency + Retry

```java
@Retryable(maxAttempts = 3)
@Transactional
public void updateStock() {}
```

👉 Combine:

* Retry
* Optimistic locking
* Idempotent design

---

## 10. Transactions in Microservices

### ❌ Anti-pattern

* Distributed DB transactions (2PC)

### ✅ Recommended

* Saga Pattern
* Event-driven architecture
* Transactional Outbox

---

## 🔥 TL;DR (Senior Summary)

| Case                | Result                |
| ------------------- | --------------------- |
| No exception        | ✅ Commit              |
| Checked exception   | ❌ (by default) commit |
| RuntimeException    | ❌ Rollback            |
| rollbackFor         | ❌ Rollback            |
| Swallowed exception | ❌ No rollback         |
| Self-invocation     | ❌ No transaction      |
| save()              | ❌ Not commit          |
| commit()            | ✅ Final write         |

---

## Query By Example (QBE)

Dynamic queries based on an example entity:

```java
User probe = new User();
probe.setStatus(UserStatus.ACTIVE);
probe.setEmail("@company.com");

ExampleMatcher matcher = ExampleMatcher.matching()
    .withMatcher("email", match -> match.endsWith())
    .withIgnorePaths("id", "createdAt");

Example<User> example = Example.of(probe, matcher);
List<User> users = userRepository.findAll(example);
```
---

## Auditing

Automatically track who created/modified entities and when:

```java
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig { }

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @CreatedBy
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;
}

@Entity
public class User extends Auditable {
    // inherits audit fields
}
```

---

## 🧠 Senior Deep Dive: Performance & Scaling

### 1. The N+1 Query Problem

The N+1 problem occurs when loading a parent entity triggers N additional separate queries to load its lazily-fetched child associations.

```java
// BAD — triggers 1 query for 100 users, then 100 individual queries for their orders! (101 queries total)
List<User> users = userRepository.findAll();
for (User u : users) {
    int count = u.getOrders().size(); 
}
```

**The Fix:** Force Hibernate to use a `JOIN` so the database returns everything in exactly 1 query.
```java
// GOOD — single query using JOIN FETCH
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List<User> findAllWithOrders();

// GOOD — Using EntityGraphs
@EntityGraph(attributePaths = {"orders"})
List<User> findAll();
```

### 2. Hibernate 1st and 2nd Level Caches

By default, every time you query the DB, a network hop occurs. Caching prevents this.
- **First-Level Cache (L1):** Enabled by default. It is scoped *strictly to the current @Transactional method / Session*. If you call `findById(1)` three times inside the same method, Hibernate only queries the DB once. Once the method ends, the cache is destroyed.
- **Second-Level Cache (L2):** Disabled by default. It is scoped to the *Application*. If User A loads an entity, and User B requests the same entity an hour later, it loads from memory (requires providers like Ehcache or Redis).

### 3. HikariCP Connection Pool Tuning

When your Spring Boot app scales, database connections become the primary bottleneck. Spring Boot uses **HikariCP** by default. A major senior-level tuning mistake is setting `maximum-pool-size` too high. 

*PostgreSQL formula for optimal connections:* `Connections = ((core_count * 2) + effective_spindle_count)`
A massive server with 8 cores might only need an optimal pool size of 20! If you set the pool size to 500, the database will spend all its CPU cores *context-switching* between connections rather than actually executing queries.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 20000

  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
```

### Connection Pool Tuning (HikariCP)

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 1800000
```

---

## Common CrudRepository Methods

| Method | Description |
|---|---|
| `save(entity)` | Inserts or updates (based on whether the ID exists) |
| `saveAll(entities)` | Saves a collection of entities |
| `findById(id)` | Returns `Optional<T>` by primary key |
| `existsById(id)` | Returns `boolean` |
| `findAll()` | Returns all entities |
| `count()` | Returns the total number of entities |
| `deleteById(id)` | Deletes by primary key |
| `delete(entity)` | Deletes a specific entity |
| `deleteAll()` | Deletes all entities |

### findById() vs getReferenceById()

| Method | Behavior |
|---|---|
| `findById()` | Immediately fetches the entity; returns `Optional` |
| `getReferenceById()` | Returns a lazy proxy; throws `EntityNotFoundException` if not found when accessed |

Use `findById()` when you need the data immediately. Use `getReferenceById()` when you only need a reference for setting relationships.

### delete() vs deleteInBatch()

`delete()` removes a single entity and fires `@PreRemove` / `@PostRemove` callbacks. `deleteInBatch()` deletes all provided entities in a single SQL statement — more efficient for bulk deletes, but does **not** fire lifecycle callbacks.

---

## Specifications (Dynamic Queries)

`JpaSpecificationExecutor` enables type-safe, composable dynamic queries — the correct alternative to building JPQL strings in code.

```java
public interface UserRepository extends JpaRepository<User, Long>,
        JpaSpecificationExecutor<User> {
}
```

```java
// Define reusable specifications
public class UserSpecifications {

    public static Specification<User> hasStatus(UserStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<User> emailContains(String email) {
        return (root, query, cb) -> cb.like(
            cb.lower(root.get("email")), "%" + email.toLowerCase() + "%"
        );
    }

    public static Specification<User> createdAfter(LocalDateTime date) {
        return (root, query, cb) -> cb.greaterThan(root.get("createdAt"), date);
    }
}

// Compose specifications dynamically — no string concatenation
@Service
public class UserSearchService {

    public Page<User> search(UserSearchRequest req, Pageable pageable) {
        Specification<User> spec = Specification.where(null);

        if (req.getStatus() != null) {
            spec = spec.and(UserSpecifications.hasStatus(req.getStatus()));
        }
        if (req.getEmail() != null) {
            spec = spec.and(UserSpecifications.emailContains(req.getEmail()));
        }
        if (req.getCreatedAfter() != null) {
            spec = spec.and(UserSpecifications.createdAfter(req.getCreatedAfter()));
        }

        return userRepository.findAll(spec, pageable);
    }
}
```

> **When to use Specifications:** When you have a search/filter API where fields are optional. Avoid building JPQL/SQL strings dynamically — Specifications are type-safe and composable.

---

## Projections

Projections allow fetching only specific fields instead of full entities — reducing memory usage and query complexity.

### 1. Interface Projections (Closed)

Spring Data JPA generates a proxy that reads only the declared fields:

```java
// Only fetch name and email — no joins for orders, addresses, etc.
public interface UserSummary {
    String getUsername();
    String getEmail();

    // Computed projection using SpEL
    @Value("#{target.firstName + ' ' + target.lastName}")
    String getFullName();
}

public interface UserRepository extends JpaRepository<User, Long> {
    List<UserSummary> findByStatus(UserStatus status);
    Optional<UserSummary> findSummaryById(Long id);
}
```

### 2. Class Projections (DTO Projections)

Generates a constructor-based query (JPQL `SELECT new ...`):

```java
public class UserDto {
    private final String username;
    private final String email;

    // Constructor must match exactly
    public UserDto(String username, String email) {
        this.username = username;
        this.email = email;
    }
}

@Query("SELECT new com.example.dto.UserDto(u.username, u.email) FROM User u WHERE u.status = :status")
List<UserDto> findUserDtosByStatus(@Param("status") UserStatus status);
```

### 3. Dynamic Projections

Return different projection types at runtime from the same repository method:

```java
<T> List<T> findByStatus(UserStatus status, Class<T> type);

// Call site
List<UserSummary> summaries = repo.findByStatus(ACTIVE, UserSummary.class);
List<UserDto>     dtos      = repo.findByStatus(ACTIVE, UserDto.class);
List<User>        entities  = repo.findByStatus(ACTIVE, User.class);
```

### Projection Comparison

| Type | Performance | Join support | SpEL | Use case |
|---|---|---|---|---|
| Interface (closed) | Best | ❌ | ✅ | Simple field subsets |
| Class (DTO) | Good | ✅ via JPQL | ❌ | Custom aggregations |
| Open interface | Moderate | ❌ | ✅ | Computed fields |
| Dynamic | Varies | Depends | Depends | Flexible APIs |

---

## Locking: Optimistic vs Pessimistic

### Optimistic Locking (`@Version`)

Assumes conflicts are rare. Uses a version field to detect concurrent modifications:

```java
@Entity
public class Product {
    @Id
    private Long id;

    private int stock;

    @Version  // Hibernate automatically includes this in UPDATE WHERE clauses
    private Long version;
}

// Thread 1 reads: product.version = 5, stock = 10
// Thread 2 reads: product.version = 5, stock = 10
// Thread 1 decrements: UPDATE products SET stock=9, version=6 WHERE id=? AND version=5  ✅
// Thread 2 decrements: UPDATE products SET stock=9, version=6 WHERE id=? AND version=5  ❌ 0 rows updated
// → Hibernate throws OptimisticLockException → caller retries
```

```java
// Handling optimistic lock conflicts
@Transactional
@Retryable(retryFor = OptimisticLockingFailureException.class, maxAttempts = 3)
public void decrementStock(Long productId, int quantity) {
    Product product = productRepository.findById(productId).orElseThrow();
    product.setStock(product.getStock() - quantity);
    productRepository.save(product);
}
```

### Pessimistic Locking (`@Lock`)

Acquires a database lock on read — other transactions must wait:

```java
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)  // SELECT ... FOR UPDATE
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_READ)   // SELECT ... FOR SHARE
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForRead(@Param("id") Long id);
}

@Transactional
public void reserveStock(Long productId, int quantity) {
    Product product = productRepository.findByIdForUpdate(productId).orElseThrow();
    if (product.getStock() < quantity) throw new InsufficientStockException();
    product.setStock(product.getStock() - quantity);
    // Lock released when transaction commits/rolls back
}
```

### When to Use Which

| Scenario | Strategy | Reason |
|---|---|---|
| Low contention reads with rare conflicts | Optimistic | No lock overhead on reads |
| High contention writes (inventory, seats) | Pessimistic | Prevent dirty reads under load |
| Reporting/analytics | `readOnly = true` | No locking, optimized reads |
| Long-running business transactions | Optimistic + retry | Pessimistic locks held too long |

---

## Interview Questions

### Q1: What is Spring Data JPA?

Spring Data JPA is part of the Spring Data project that provides a repository abstraction on top of JPA. It eliminates boilerplate data access code by auto-generating repository implementations at runtime. Developers define interfaces with method signatures, and Spring generates the queries and implementations automatically.

### Q2: What are the features of Spring Data JPA?

Key features include automatic repository creation, query method generation from method names, pagination and sorting support, custom JPQL and native queries via `@Query`, auditing support, Query By Example (QBE), and seamless integration with Spring Boot, Spring MVC, and Spring Security.

### Q3: What is the difference between CrudRepository and JpaRepository?

`CrudRepository` provides basic CRUD operations (save, findById, delete, findAll, count). `JpaRepository` extends `CrudRepository` and adds JPA-specific methods like `flush()`, `saveAndFlush()`, `deleteInBatch()`, and `getReferenceById()`. It also returns `List` instead of `Iterable` and includes pagination support.

### Q4: How do you write a custom query in Spring Data JPA?

Use the `@Query` annotation to define JPQL or native SQL queries directly on repository methods:
```java
@Query("SELECT u FROM User u WHERE u.firstName = :firstName")
List<User> findByFirstName(@Param("firstName") String firstName);
```
For native SQL, add `nativeQuery = true`.

### Q5: What is the purpose of the save() method in CrudRepository?

`save()` persists an entity to the database. If the entity has no ID (or ID is null), it performs an INSERT. If the entity already has an ID that exists in the database, it performs an UPDATE. Spring Data JPA uses the ID field to determine whether to insert or update.

### Q6: What is the use of the @Modifying annotation?

`@Modifying` is used with `@Query` methods that modify data (UPDATE or DELETE statements). It tells Spring Data JPA that the query is a write operation, not a read. It must be combined with `@Transactional` to ensure the changes are committed within a transaction context.

### Q7: What is the difference between findById() and getReferenceById()?

`findById()` immediately fetches the entity from the database and returns an `Optional`. `getReferenceById()` returns a lazy proxy without hitting the database — the actual query executes only when a property is accessed. If the entity doesn't exist, `getReferenceById()` throws `EntityNotFoundException` when the proxy is accessed.

### Q8: Explain @Transactional in Spring.

`@Transactional` marks a method or class as transactional. All database operations within the annotated method run as a single atomic unit — if any operation fails, all changes are rolled back. Key attributes include `readOnly` (optimization for reads), `propagation` (transaction nesting), `isolation` (isolation level), and `rollbackFor` (which exceptions trigger rollback).

### Q9: What is the difference between FetchType.EAGER and FetchType.LAZY?

`FetchType.EAGER` loads related entities immediately along with the parent entity, which can cause performance issues by loading unnecessary data. `FetchType.LAZY` defers loading until the association is actually accessed. Best practice is to use `LAZY` everywhere and fetch eagerly only when needed via `JOIN FETCH` or `@EntityGraph`.

### Q10: What is the N+1 SELECT problem and how do you prevent it?

The N+1 problem occurs when loading N parent entities triggers N additional queries to load their associations. For example, loading 100 users and then accessing each user's orders results in 1 + 100 = 101 queries. Prevention strategies:
- `JOIN FETCH` in JPQL queries
- `@EntityGraph` on repository methods
- Batch fetching via `default_batch_fetch_size`

### Q11: How do you implement pagination in Spring Data JPA?

Pass a `Pageable` parameter to repository methods. Spring handles the pagination automatically:
```java
Page<User> findByStatus(UserStatus status, Pageable pageable);

// Usage
Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
Page<User> page = userRepository.findByStatus(UserStatus.ACTIVE, pageable);
```

### Q12: How do you create a composite primary key in Spring JPA?

Define a separate class annotated with `@Embeddable` containing the key fields (must implement `Serializable` with `equals()` and `hashCode()`). In the entity, use `@EmbeddedId` to reference the composite key class.

### Q13: What are the rules for declaring custom query methods in a repository?

Method names must follow naming conventions: start with a prefix (`findBy`, `deleteBy`, `countBy`), followed by entity property names and optional keywords (`And`, `Or`, `Between`, `Like`, `OrderBy`, `In`, `IsNull`, etc.). Spring Data JPA parses the method name and generates the query automatically.

### Q14: Explain Query By Example (QBE).

QBE allows creating dynamic queries based on an example entity. You create a "probe" entity with the desired field values, configure an `ExampleMatcher` to control matching behavior (exact, contains, starts with), and pass the `Example` to repository methods. It's useful for flexible search forms without writing custom queries.

### Q15: How do you handle bidirectional relationships to avoid infinite recursion?

When serializing bidirectional entity relationships to JSON, use `@JsonManagedReference` on the parent side and `@JsonBackReference` on the child side. Alternatively (and preferably), use DTOs to control exactly which fields are serialized, keeping entities clean and avoiding serialization issues entirely.

### Q16: How do you handle schema migration with Spring JPA?

Integrate tools like **Flyway** or **Liquibase**. These are configured in Spring Boot to automatically apply database schema changes during deployment. Migration scripts are versioned and applied sequentially, ensuring the database schema stays in sync with the application code across all environments.

### Q17: How do you optimize batch inserts in Spring JPA?

Configure `spring.jpa.properties.hibernate.jdbc.batch_size` in application properties. Enable `order_inserts` and `order_updates` so Hibernate can group similar statements together. This reduces database round trips significantly when inserting or updating thousands of records.

### Q18: What is the use of @Temporal annotation?

`@Temporal` specifies the precision for `java.util.Date` or `java.util.Calendar` fields: `TemporalType.DATE` (date only), `TemporalType.TIME` (time only), or `TemporalType.TIMESTAMP` (date + time). Note: with Java 8+ date types (`LocalDate`, `LocalDateTime`), `@Temporal` is not needed — the type itself determines the precision.

### Q19: What is the difference between delete() and deleteInBatch()?

`delete()` removes a single entity, fires JPA lifecycle callbacks (`@PreRemove`, `@PostRemove`), and cascades to related entities. `deleteInBatch()` deletes multiple entities in a single SQL statement — more efficient for bulk operations, but **skips** lifecycle callbacks and cascade rules.

### Q20: How do you implement caching with Spring Data JPA?

Use the Spring Cache abstraction with a provider like Redis or Caffeine. Annotate repository or service methods with `@Cacheable` to cache query results. Use `@CacheEvict` to invalidate cache entries when data changes. This reduces database queries for frequently accessed data.

### Q21: Why does Spring not rollback on checked exceptions?

Because of legacy EJB design — checked exceptions are considered business cases.

---

### Q22: How does Spring decide to rollback?

* Based on exception type
* `rollbackFor` / `noRollbackFor`
* Evaluated inside `TransactionInterceptor`

---

### Q23: Difference between flush and commit?

| flush                                | commit               |
| ------------------------------------ | -------------------- |
| Synchronize persistence context → DB | Finalize transaction |
| Can happen multiple times            | Happens once         |

---

### Q24: Why self-invocation breaks transaction?

Because Spring uses proxy — internal method calls bypass proxy.

---

### Q25: When to use REQUIRES_NEW?

* Logging
* Outbox
* Compensation logic

---

### Q26: Why should transactions be short?

To avoid:

* Lock contention
* Deadlocks
* Performance degradation

---

## Advanced Editorial Pass: Persistence Design Under Load

### What Experienced Teams Optimize
- Query shape and access patterns before introducing ORM abstractions everywhere.
- Transaction boundary design aligned with business consistency requirements.
- Predictable performance via indexing, batching, and fetch-plan discipline.

### Typical Failure Modes
- N+1 query behavior hidden by convenience repository methods.
- Over-fetching entity graphs that inflate p95 latency and memory pressure.
- Leaky transactional scope that couples API and persistence layers.

### Engineering Heuristics
1. Review generated SQL for critical paths during code review.
2. Treat entity modeling and indexing as one design activity.
3. Use explicit projections and fetch strategies for high-throughput endpoints.

### Compare Next
- [Spring MVC - Complete Guide](./spring-mvc.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
- [Spring Framework: Deep Dive](./spring-framework-deep-dive.md)
