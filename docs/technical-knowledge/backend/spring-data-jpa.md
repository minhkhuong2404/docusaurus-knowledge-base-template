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

## Performance Optimization

### N+1 Problem

The N+1 problem occurs when loading an entity triggers N additional queries for its associations:

```java
// BAD — triggers N extra queries for orders
List<User> users = userRepository.findAll();
users.forEach(u -> u.getOrders().size()); // N queries!

// GOOD — single query with JOIN FETCH
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List<User> findAllWithOrders();

// GOOD — EntityGraph
@EntityGraph(attributePaths = {"orders"})
List<User> findAll();
```

### Batch Processing

```yaml
spring:
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
