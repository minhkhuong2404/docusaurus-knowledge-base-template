---
title: Spring Data JPA Repositories and Query Patterns
description: Practical Spring Data JPA guide covering repositories, query derivation, custom queries, pagination, specifications, and projections.
tags: [spring-data-jpa, spring, repositories, query, jpa]
---

# Spring Data JPA Repositories and Query Patterns

This guide focuses on day-to-day Spring Data JPA usage: repository design, query styles, pagination, and composable search patterns.

## What Is Spring Data JPA?

Spring Data JPA is part of the larger Spring Data project. It provides a repository abstraction on top of JPA that eliminates the need to write boilerplate data access code. Instead of manually writing `EntityManager` operations, you define interfaces and Spring generates the implementation at runtime.

Key idea: define a repository interface, declare method signatures following naming conventions, and Spring Data JPA generates the query logic automatically.

## Why Use Spring Data JPA?

### Problems It Solves

| Problem | How Spring Data JPA Fixes It |
|---|---|
| Repetitive CRUD boilerplate | Auto-generated repository implementations |
| Manual query writing for simple operations | Query derivation from method names |
| Complex pagination and sorting logic | Built-in `Pageable` and `Sort` support |
| Tedious `EntityManager` management | Automatic session and transaction handling |
| Verbose DAO layer | Single interface replaces DAO class |
| Migration workflow consistency | Works with Flyway/Liquibase |

### Core Benefits

1. Zero boilerplate for CRUD and common list operations.
2. Derived queries from method names.
3. Custom JPQL/native queries via annotations.
4. First-class pagination and sorting support.
5. Auditing integration.
6. Tight Spring Boot integration.

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
}
```

### Key Annotations

| Annotation | Purpose |
|---|---|
| `@Entity` | Marks class as JPA entity |
| `@Table` | Defines DB table mapping |
| `@Id` | Primary key field |
| `@GeneratedValue` | Key generation strategy |
| `@Column` | Column constraints and options |
| `@Enumerated` | Enum persistence strategy |
| `@Temporal` | Date/Calendar precision mapping |
| `@CreatedDate` / `@LastModifiedDate` | Auditing timestamps |
| `@OneToMany` / `@ManyToOne` / `@ManyToMany` | Relationship mapping |

## Repository Hierarchy

```text
Repository
  -> CrudRepository
  -> PagingAndSortingRepository
  -> JpaRepository
```

Use `JpaRepository` in most projects for richer APIs (`flush`, batch deletes, pagination integration).

## Creating Repositories

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

### Enable JPA Repositories

In Spring Boot, repositories are auto-detected. For manual configuration:

```java
@Configuration
@EnableJpaRepositories(basePackages = "com.example.repository")
public class JpaConfig { }
```

Common methods are available out of the box:
- `save`, `saveAll`
- `findById`, `findAll`, `count`, `existsById`
- `deleteById`, `deleteAll`
- `findAll(Pageable)`, `findAll(Sort)`

## Query Derivation

```java
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByStatusAndEmailContaining(UserStatus status, String email);

    List<User> findByAgeGreaterThanOrderByLastNameAsc(int age);

    long countByStatus(UserStatus status);

    void deleteByStatus(UserStatus status);
}
```

### Useful Naming Keywords

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

## Custom Queries

### JPQL with `@Query`

```java
@Query("SELECT u FROM User u WHERE u.status = :status ORDER BY u.createdAt DESC")
List<User> findActiveUsers(@Param("status") UserStatus status);
```

### Native SQL

```java
@Query(value = "SELECT * FROM users WHERE email = :email", nativeQuery = true)
Optional<User> findByEmailNative(@Param("email") String email);
```

### Update/Delete Queries

```java
@Modifying
@Transactional
@Query("UPDATE User u SET u.status = :status WHERE u.lastLoginAt < :date")
int deactivateInactiveUsers(@Param("status") UserStatus status,
                             @Param("date") LocalDateTime date);
```

## Pagination and Sorting

```java
Page<User> findByStatus(UserStatus status, Pageable pageable);
```

```java
Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
Page<User> page = userRepository.findByStatus(UserStatus.ACTIVE, pageable);
```

## Relationships and Fetching

```java
@Entity
public class Order {
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
| `EAGER` | Loads related entities immediately with parent | `@ManyToOne`, `@OneToOne` |
| `LAZY` | Loads related entities only when accessed | `@OneToMany`, `@ManyToMany` |

### Avoiding Bidirectional Serialization Issues

```java
@JsonManagedReference
private List<Order> orders;

@JsonBackReference
private User user;
```

Or better, use DTOs for API contracts.

## Composite Primary Keys

```java
@Embeddable
public class OrderItemId implements Serializable {
    private Long orderId;
    private Long productId;
}

@Entity
public class OrderItem {
    @EmbeddedId
    private OrderItemId id;

    private int quantity;
    private BigDecimal price;
}
```

Best practice:
- Default to `LAZY`.
- Fetch explicitly with `JOIN FETCH` or `@EntityGraph` when required.
- Prefer DTOs for API responses to avoid recursive serialization issues.

## Query By Example (QBE)

```java
User probe = new User();
probe.setStatus(UserStatus.ACTIVE);

ExampleMatcher matcher = ExampleMatcher.matching()
    .withIgnorePaths("id", "createdAt");

Example<User> example = Example.of(probe, matcher);
List<User> users = userRepository.findAll(example);
```

## Specifications for Dynamic Search

```java
public interface UserRepository extends JpaRepository<User, Long>,
        JpaSpecificationExecutor<User> {
}
```

```java
public static Specification<User> hasStatus(UserStatus status) {
    return (root, query, cb) -> cb.equal(root.get("status"), status);
}
```

Use Specifications when filter fields are optional and combinable.

## Projections

### Interface Projection

```java
public interface UserSummary {
    String getUsername();
    String getEmail();

    @Value("#{target.firstName + ' ' + target.lastName}")
    String getFullName();
}
```

### DTO Projection

```java
@Query("SELECT new com.example.dto.UserDto(u.username, u.email) FROM User u WHERE u.status = :status")
List<UserDto> findUserDtosByStatus(@Param("status") UserStatus status);
```

### Dynamic Projection

```java
<T> List<T> findByStatus(UserStatus status, Class<T> type);
```

### Projection Comparison

| Type | Performance | Join support | SpEL | Use case |
|---|---|---|---|---|
| Interface (closed) | Best | No | Yes | Simple field subsets |
| Class (DTO) | Good | Yes via JPQL | No | Aggregated response shapes |
| Open interface | Moderate | No | Yes | Computed fields |
| Dynamic | Varies | Depends | Depends | Flexible APIs |

## Common CrudRepository Methods

| Method | Description |
|---|---|
| `save(entity)` | Insert or update depending on identifier state |
| `saveAll(entities)` | Save a collection |
| `findById(id)` | Returns `Optional<T>` |
| `existsById(id)` | Returns existence boolean |
| `findAll()` | Returns all rows |
| `count()` | Returns total row count |
| `deleteById(id)` | Delete by identifier |
| `delete(entity)` | Delete one entity |
| `deleteAll()` | Delete all rows |

### findById() vs getReferenceById()

| Method | Behavior |
|---|---|
| `findById()` | Immediate fetch with `Optional` |
| `getReferenceById()` | Lazy proxy, may throw on access if missing |

### delete() vs deleteInBatch()

`delete()` triggers lifecycle callbacks and cascades. `deleteInBatch()` is efficient for bulk delete but skips lifecycle callbacks.

## Auditing

```java
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig { }
```

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

## Compare Next

- [Hibernate: Transactions and Performance in Spring Apps](./hibernate-transactions-performance.md)
- [Spring Data JPA Interview Questions](./spring-data-jpa-interview-questions.md)
- [Spring Data JPA Overview](./spring-data-jpa.md)
