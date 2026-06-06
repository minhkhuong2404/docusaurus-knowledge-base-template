---
id: spring-data-jpa-query-annotation
title: "Spring Data JPA: Custom Queries with @Query"
sidebar_label: "@Query Annotation"
description: "A complete guide to custom JPQL, Native SQL, SpEL, projections, and senior-level internals — persistence context mechanics, N+1 prevention, memory optimization, and connection pool management."
tags: [java, spring-boot, jpa, hibernate, jpql, query, backend, performance]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Spring Data JPA: Custom Queries with @Query

:::info[Who this guide is for]
- **New learners** — start at [What is Spring Data JPA?](#what-is-spring-data-jpa) and [Why @Query?](#why-query) to understand where custom queries fit.
- **Senior engineers** — jump to [Persistence Context Internals](#persistence-context-internals), [N+1 Problem](#the-n1-problem), [DTO Projections](#dto-projections-for-memory-optimization), or [Performance Tuning](#performance-tuning).
:::

---

## What is Spring Data JPA?

Spring Data JPA is a Spring module that eliminates boilerplate data-access code. Instead of writing `EntityManager` calls manually, you declare a repository interface and Spring generates the implementation at runtime.

```
Your code                Spring Data JPA              Database
─────────────────────────────────────────────────────────────
UserRepository  ──→  Generated proxy (runtime)  ──→  SQL
  .findById(1)          EntityManager.find()          SELECT * FROM users WHERE id = 1
```

### The building blocks

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Entity** | Maps a Java class to a DB table | `@Entity class User` |
| **Repository** | Interface declaring data-access operations | `UserRepository extends JpaRepository` |
| **JpaRepository** | Spring-provided base with `save`, `findById`, `delete`, pagination, etc. | No code needed |
| **`@Query`** | Override the generated SQL with your own JPQL or native SQL | When derived methods aren't enough |

### What Spring generates without any custom code

```java
// You write this interface — nothing else
public interface UserRepository extends JpaRepository<User, Long> { }

// Spring generates at startup — all of these work for free:
userRepository.findById(1L);          // SELECT * FROM users WHERE id = 1
userRepository.save(user);            // INSERT or UPDATE
userRepository.deleteById(1L);        // DELETE FROM users WHERE id = 1
userRepository.findAll(pageable);     // SELECT * FROM users LIMIT ? OFFSET ?
userRepository.count();               // SELECT COUNT(*) FROM users
```

---

## Why @Query?

### Derived query methods — the convenient starting point

Spring Data JPA can generate queries by parsing method names. No SQL or JPQL required:

```java
// Spring reads the method name and generates the SQL automatically
List<User> findByStatusAndDepartmentId(String status, Long departmentId);
// → SELECT * FROM users WHERE status = ? AND department_id = ?

List<User> findByFirstNameContainingIgnoreCase(String keyword);
// → SELECT * FROM users WHERE LOWER(first_name) LIKE LOWER('%?%')

List<User> findTop5ByStatusOrderByCreatedAtDesc(String status);
// → SELECT * FROM users WHERE status = ? ORDER BY created_at DESC LIMIT 5
```

### When derived methods break down

As queries grow complex, method names become unreadable and unmaintainable:

```java
// ❌ Derived method — technically works, practically unreadable
List<User> findByStatusAndDepartmentIdAndCreatedAtAfterAndRoleIn(
    String status, Long departmentId, LocalDate date, List<String> roles);

// ✅ @Query — clear, explicit, maintainable
@Query("""
    SELECT u FROM User u
    WHERE u.status = :status
      AND u.department.id = :deptId
      AND u.createdAt > :since
      AND u.role IN :roles
    """)
List<User> findFilteredUsers(
    @Param("status") String status,
    @Param("deptId") Long deptId,
    @Param("since") LocalDate since,
    @Param("roles") List<String> roles);
```

### When to use @Query

| Situation | Use `@Query`? | Reason |
|-----------|:----------:|-------|
| Simple equality / range filter on one or two fields | ❌ | Derived method is cleaner |
| Three or more filter conditions | ✅ | Derived method name becomes unreadable |
| JOIN across related entities | ✅ | Derived methods can't express JOINs well |
| Aggregation (`SUM`, `AVG`, `COUNT`, `GROUP BY`) | ✅ | Not expressible as derived method |
| Database-specific function (PostgreSQL `JSONB`, window functions) | ✅ | Requires native SQL |
| Bulk UPDATE or DELETE | ✅ | Requires `@Modifying` + `@Query` |
| Return a DTO/projection instead of a full entity | ✅ | Constructor expression or interface projection |

---

## JPQL vs Native SQL

Before writing queries, understand the difference between the two query modes:

### JPQL (Java Persistence Query Language)

JPQL operates on **entity classes and their fields**, not on database tables and columns. Hibernate translates JPQL into SQL at runtime.

```java
// JPQL — references the Java entity name "User" and field "firstName"
@Query("SELECT u FROM User u WHERE u.firstName = :name")

// Hibernate translates to SQL — references the actual table "users" and column "first_name"
// → SELECT u.id, u.first_name, u.last_name, ... FROM users u WHERE u.first_name = ?
```

**Advantages of JPQL:**
- Database-agnostic — works on PostgreSQL, MySQL, Oracle, H2 without changes.
- Hibernate can apply dialect-specific optimisations during AST translation.
- Works with Hibernate's L1/L2 caches and lazy loading.
- Refactoring entity field names (with an IDE) updates all JPQL references.

### Native SQL

Native SQL is sent directly to the database without JPQL parsing. Use it when you need database-specific features unavailable in JPQL.

```java
// Native SQL — references the actual table and column names
@Query(
    value = "SELECT * FROM users WHERE properties->>'timezone' = :tz",
    nativeQuery = true
)
List<User> findByTimezone(@Param("tz") String timezone);
```

**When to use native SQL:**
- Database-specific functions: PostgreSQL `JSONB`, `ARRAY`, `LATERAL`, `WITH` (CTEs).
- Window functions (`ROW_NUMBER()`, `RANK()`, `LAG()`).
- Full-text search with `tsvector` / `MATCH AGAINST`.
- Complex `UNION`, `INTERSECT`, or recursive CTEs.

:::danger[Architectural trade-off with native SQL]
Native queries bypass Hibernate's dialect translation. Migrating from MySQL to PostgreSQL requires rewriting every `nativeQuery = true` query. Always add a comment documenting the database dependency, and centralise native queries in one repository to make a future migration manageable.
:::

### Side-by-side comparison

| | JPQL | Native SQL |
|-|------|-----------|
| **Operates on** | Entity classes & fields | DB tables & columns |
| **Database portability** | ✅ Portable | ❌ DB-specific |
| **DB-specific functions** | ❌ Not supported | ✅ Fully supported |
| **Hibernate cache integration** | ✅ Full | ⚠️ Limited |
| **Performance optimisation** | Hibernate AST | Raw driver |
| **Refactoring safety** | ✅ IDE-assisted | ❌ Manual |
| **When to use** | Default choice | DB-specific features only |

---

## Parameter Binding

Injecting variables into queries safely is fundamental. Spring Data JPA prevents SQL injection by using prepared statement placeholders — parameters are never concatenated into the query string.

### Positional parameters

Parameters are referenced by their position in the method signature — `?1` for the first argument, `?2` for the second, and so on.

```java
@Query("SELECT u FROM User u WHERE u.firstName = ?1 AND u.lastName = ?2")
Optional<User> findByFullName(String firstName, String lastName);
```

:::warning[Positional parameters are fragile]
If you reorder method parameters during a refactor, positional references silently break — `?1` now maps to the wrong argument. Prefer named parameters.
:::

### Named parameters (recommended)

Use `@Param("name")` to bind parameters explicitly by name. The query reference is `:name`. The order of method arguments no longer matters.

```java
@Query("""
    SELECT u FROM User u
    WHERE u.firstName = :firstName
      AND u.lastName  = :lastName
      AND u.status    = :status
    """)
Optional<User> findByFullNameAndStatus(
    @Param("firstName") String firstName,
    @Param("lastName")  String lastName,
    @Param("status")    String status
);
```

### Passing collections

JPQL's `IN` clause accepts a `Collection` parameter directly — no manual string-building needed:

```java
@Query("SELECT u FROM User u WHERE u.role IN :roles AND u.status = :status")
List<User> findByRolesAndStatus(
    @Param("roles")  List<String> roles,
    @Param("status") String status
);

// Usage
repository.findByRolesAndStatus(List.of("ADMIN", "MANAGER"), "ACTIVE");
// → SELECT ... FROM users WHERE role IN ('ADMIN', 'MANAGER') AND status = 'ACTIVE'
```

### LIKE patterns

JPQL does not auto-wrap `:param` in wildcards. You must either provide them from the caller or use `CONCAT`:

```java
// Option 1: wrap at call site
@Query("SELECT u FROM User u WHERE u.email LIKE :pattern")
List<User> findByEmailPattern(@Param("pattern") String pattern);
// Caller: repository.findByEmailPattern("%@gmail.com")

// Option 2: wrap inside the query with CONCAT
@Query("SELECT u FROM User u WHERE u.email LIKE CONCAT('%', :domain, '%')")
List<User> findByEmailDomain(@Param("domain") String domain);
// Caller: repository.findByEmailDomain("gmail.com")
```

---

## Sorting and Pagination

### Dynamic sorting

Pass a `Sort` object as a parameter — Spring Data appends an `ORDER BY` clause to your JPQL at runtime without you writing it:

```java
@Query("SELECT u FROM User u WHERE u.status = :status")
List<User> findByStatus(@Param("status") String status, Sort sort);

// Usage — build Sort programmatically
Sort sort = Sort.by(Sort.Direction.DESC, "createdAt")
               .and(Sort.by(Sort.Direction.ASC, "lastName"));

repository.findByStatus("ACTIVE", sort);
// → SELECT ... FROM users WHERE status = 'ACTIVE'
//   ORDER BY created_at DESC, last_name ASC
```

### Pagination with `Pageable`

`Pageable` adds `LIMIT` + `OFFSET` and returns a `Page<T>` that also contains total count metadata (used for building pagination UI):

```java
@Query("SELECT u FROM User u WHERE u.role = :role")
Page<User> findByRolePaginated(@Param("role") String role, Pageable pageable);

// Usage
Pageable pageable = PageRequest.of(
    0,                                    // page number (0-indexed)
    20,                                   // page size
    Sort.by("createdAt").descending()     // optional sort
);

Page<User> page = repository.findByRolePaginated("ADMIN", pageable);
page.getContent();        // List<User> — the 20 records
page.getTotalElements();  // total matching records (e.g. 847)
page.getTotalPages();     // 847 / 20 = 43 pages
page.hasNext();           // true
```

:::tip[Pagination requires a count query]
`Page<T>` automatically runs a `SELECT COUNT(*)` alongside your data query. If your main query is expensive (many JOINs), the count query may also be slow. You can provide a separate, optimised count query:

```java
@Query(
    value     = "SELECT u FROM User u JOIN FETCH u.roles WHERE u.status = :status",
    countQuery = "SELECT COUNT(u) FROM User u WHERE u.status = :status"
)
Page<User> findActiveUsersWithRoles(@Param("status") String status, Pageable pageable);
```
:::

---

## Data Modification — @Modifying

`@Query` alone only reads data. To execute `UPDATE` or `DELETE` statements, pair it with `@Modifying`:

```java
// ✅ UPDATE — returns number of affected rows
@Modifying
@Transactional
@Query("UPDATE User u SET u.status = 'INACTIVE' WHERE u.lastLoginDate < :threshold")
int deactivateDormantAccounts(@Param("threshold") LocalDate threshold);

// ✅ DELETE — returns number of deleted rows
@Modifying
@Transactional
@Query("DELETE FROM User u WHERE u.status = 'DELETED' AND u.updatedAt < :before")
int purgeDeletedUsers(@Param("before") LocalDate before);
```

:::warning[Always add @Transactional to @Modifying methods]
`@Modifying` without `@Transactional` throws `InvalidDataAccessApiUsageException` at runtime. Either annotate the repository method or ensure the calling service method is transactional.
:::

### Bulk operation rules

| Rule | Why |
|------|-----|
| Always use `@Modifying` for UPDATE/DELETE | Without it, Spring assumes read-only — exception at runtime |
| Add `@Transactional` | DML requires an active transaction |
| Use `clearAutomatically = true` | Clears the L1 cache after the query — prevents stale entity reads (see senior section) |
| Use `flushAutomatically = true` | Flushes pending entity changes before executing — prevents lost updates |

---

## SpEL Expressions

Spring Expression Language (SpEL) can be embedded in `@Query` strings inside `#{ ... }`. The most useful built-in SpEL variable is `#entityName` — it resolves to the entity name declared on the `@Entity` annotation, enabling reusable base queries in generic repository code.

```java
// Without SpEL — hardcoded entity name breaks if the entity is renamed
@Query("SELECT u FROM User u WHERE u.email LIKE %:domain%")

// With SpEL — resolves the entity name dynamically
@Query("SELECT e FROM #{#entityName} e WHERE e.email LIKE %:domain%")
List<T> findByEmailDomain(@Param("domain") String domain);
```

**Most common SpEL use cases:**

```java
// In a generic base repository shared by many entities
@NoRepositoryBean
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {

    // #{#entityName} → resolves to "User", "Product", "Order", etc. at runtime
    @Query("SELECT e FROM #{#entityName} e WHERE e.createdBy = :userId")
    List<T> findAllCreatedBy(@Param("userId") Long userId);
}

// Works for all entities that extend BaseRepository
public interface UserRepository    extends BaseRepository<User, Long>    { }
public interface ProductRepository extends BaseRepository<Product, Long> { }
```

---

## Projections — Return Only What You Need

By default, Spring Data returns fully hydrated entity objects. This is wasteful when you only need 2–3 fields from a 30-column table — Hibernate must read, allocate, and dirty-track the entire entity graph.

### Interface projections (Spring Data feature)

Declare a Java interface with getter methods matching the fields you want. Spring generates a proxy that reads only those columns.

```java
// Projection interface — only id, firstName, email
public interface UserSummary {
    Long   getId();
    String getFirstName();
    String getEmail();
}

// Return the projection type directly — no @Query needed for simple cases
public interface UserRepository extends JpaRepository<User, Long> {
    List<UserSummary> findByStatus(String status);
    // Spring generates: SELECT u.id, u.first_name, u.email FROM users WHERE status = ?
}
```

### Class-based DTO projections with @Query

For complex queries (aggregations, computed fields, multiple entities), use JPQL **constructor expressions** to project results directly into a DTO class:

```java
// UserSummaryDto.java — a plain class, not an entity
@Getter
@AllArgsConstructor
public class UserSummaryDto {
    private final Long   id;
    private final String firstName;
    private final String email;
    private final Long   orderCount;    // computed field — not on the entity
}

// Repository
@Query("""
    SELECT new dev.example.dto.UserSummaryDto(
        u.id, u.firstName, u.email, COUNT(o.id)
    )
    FROM User u
    LEFT JOIN u.orders o
    WHERE u.status = 'ACTIVE'
    GROUP BY u.id, u.firstName, u.email
    """)
List<UserSummaryDto> getActiveUserSummaries();
```

:::tip[Why DTO projections matter for performance]
| | Full entity | Interface projection | DTO projection |
|-|------------|---------------------|---------------|
| **Columns fetched** | All | Only declared getters | Only constructor args |
| **Hibernate tracking** | ✅ Dirty-checked | ❌ No tracking | ❌ No tracking |
| **Proxy overhead** | Heavy | Light proxy | None |
| **Memory usage** | High | Low | Lowest |
| **Use for** | Write operations | Simple reads | Complex reads / aggregations |
:::

---

## Complete Use-Case Examples

<Tabs>
  <TabItem value="search" label="Search & filter">

```java
@Query("""
    SELECT u FROM User u
    WHERE (:status IS NULL OR u.status = :status)
      AND (:role   IS NULL OR u.role   = :role)
      AND (:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.email)     LIKE LOWER(CONCAT('%', :search, '%')))
    """)
Page<User> searchUsers(
    @Param("status") String status,
    @Param("role")   String role,
    @Param("search") String search,
    Pageable pageable
);
// Caller passes null for fields that should not filter
// repository.searchUsers("ACTIVE", null, "alice", PageRequest.of(0, 20))
```

  </TabItem>
  <TabItem value="aggregation" label="Aggregation / reporting">

```java
public interface DepartmentStat {
    String getDepartmentName();
    Long   getUserCount();
    Double getAverageSalary();
}

@Query("""
    SELECT d.name         AS departmentName,
           COUNT(u.id)    AS userCount,
           AVG(u.salary)  AS averageSalary
    FROM Department d
    LEFT JOIN d.users u
    GROUP BY d.id, d.name
    ORDER BY COUNT(u.id) DESC
    """)
List<DepartmentStat> getDepartmentStats();
```

  </TabItem>
  <TabItem value="native-window" label="Native — window functions">

```java
@Query(
    value = """
        SELECT
            u.id,
            u.first_name,
            u.department_id,
            SUM(o.total) OVER (PARTITION BY u.department_id) AS dept_total,
            RANK()        OVER (PARTITION BY u.department_id ORDER BY SUM(o.total) DESC) AS dept_rank
        FROM users u
        JOIN orders o ON o.user_id = u.id
        WHERE o.created_at >= :since
        GROUP BY u.id, u.first_name, u.department_id
        """,
    nativeQuery = true
)
List<Object[]> getUserSalesRankByDepartment(@Param("since") LocalDate since);
```

  </TabItem>
  <TabItem value="bulk" label="Bulk DML">

```java
// Bulk status update — affects many rows in one SQL call
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Transactional
@Query("UPDATE User u SET u.status = :newStatus WHERE u.id IN :ids")
int bulkUpdateStatus(@Param("newStatus") String newStatus, @Param("ids") List<Long> ids);

// Soft delete with audit trail
@Modifying(clearAutomatically = true)
@Transactional
@Query("""
    UPDATE User u
    SET u.status    = 'DELETED',
        u.deletedAt = CURRENT_TIMESTAMP,
        u.deletedBy = :actorId
    WHERE u.id = :userId AND u.status != 'DELETED'
    """)
int softDeleteUser(@Param("userId") Long userId, @Param("actorId") Long actorId);
```

  </TabItem>
</Tabs>

---

## Persistence Context Internals

:::note[Senior deep-dive starts here]
The sections below focus on JVM memory mechanics, Hibernate internals, and production performance patterns. Understanding these separates developers who write working queries from engineers who write efficient ones.
:::

### The L1 cache (First-Level Cache)

Every JPA transaction has a **persistence context** — Hibernate's L1 cache. It is a `Map<EntityKey, Object>` that lives for the duration of the transaction. Every entity you load is placed in this map.

```
Transaction starts
     │
     ├─ em.find(User.class, 1L)         → MISS  → SELECT FROM db → stores in L1 cache
     ├─ em.find(User.class, 1L)         → HIT   → returns from cache, no SQL
     ├─ em.find(User.class, 2L)         → MISS  → SELECT FROM db → stores in L1 cache
     │
     ├─ user.setName("Alice Updated")  → entity is "dirty" in the cache
     │
Transaction commits → Hibernate detects dirty entity → flushes UPDATE to DB
     │
Cache discarded
```

**Key implications:**
- Two calls to `findById(1L)` in the same transaction hit the DB only once — safe to call freely.
- Hibernate tracks every managed entity for changes (**dirty checking**) at flush time. Loading 10,000 entities means Hibernate compares 10,000 objects against their snapshots at commit — expensive.
- The L1 cache is **not** shared between transactions or threads.

---

### The stale-cache problem with @Modifying

A bulk `UPDATE` query executes as a single SQL statement directly against the database, **completely bypassing the L1 cache**. If you had already loaded an entity in the same transaction, your Java object is now out of sync with the database:

```java
@Transactional
public void example() {
    // Step 1: loads User id=1 into L1 cache → status = "ACTIVE"
    User user = userRepository.findById(1L).orElseThrow();
    System.out.println(user.getStatus()); // "ACTIVE"

    // Step 2: bulk UPDATE bypasses the cache entirely
    userRepository.deactivateDormantAccounts(LocalDate.now().minusMonths(6));
    // DB row for id=1 is now status = "INACTIVE"

    // Step 3: reads from L1 cache — returns stale data!
    System.out.println(user.getStatus()); // ❌ still "ACTIVE" — stale!

    // Step 4: even re-fetching by ID returns from cache
    User reloaded = userRepository.findById(1L).orElseThrow();
    System.out.println(reloaded.getStatus()); // ❌ still "ACTIVE" — cache hit!
}
```

**The fix — `clearAutomatically = true`:**

```java
@Modifying(
    clearAutomatically  = true,  // evicts all entities from L1 cache after execution
    flushAutomatically  = true   // flushes pending dirty entities to DB before execution
)
@Query("UPDATE User u SET u.status = 'INACTIVE' WHERE u.lastLoginDate < :threshold")
int deactivateDormantAccounts(@Param("threshold") LocalDate threshold);
```

```
With clearAutomatically = true:

Step 1: findById(1) → loads into L1 cache
Step 2: @Modifying UPDATE → executes SQL → clears L1 cache
Step 3: findById(1) → MISS (cache cleared) → fresh SELECT from DB ✅
```

:::warning[`clearAutomatically` clears the entire L1 cache]
All currently tracked entities are evicted — not just the ones affected by your query. Any entity loaded before this call that you planned to use afterward must be re-fetched. Design your transaction flow to run bulk modifications before loading entities you need afterward.
:::

---

### The N+1 Problem

N+1 is the most common JPA performance mistake. It occurs when loading a list of N entities, then accessing a lazy-loaded relationship on each — triggering N additional queries:

```java
@Entity
public class User {
    @OneToMany(fetch = FetchType.LAZY)  // lazy — not loaded with the user
    private List<Order> orders;
}

// The N+1 scenario
@Transactional
public void printUserOrders() {
    List<User> users = userRepository.findAll();  // 1 SELECT: loads 100 users

    for (User u : users) {
        // Accessing the lazy collection triggers a query per user:
        System.out.println(u.getOrders().size());
        // 100 SELECTs: SELECT * FROM orders WHERE user_id = ?
    }
    // Total: 1 + 100 = 101 queries ❌
}
```

In a high-throughput environment, 101 queries for one endpoint depletes HikariCP connection pool threads, causing downstream timeouts for all other requests.

### Solving N+1 with JOIN FETCH

`JOIN FETCH` tells Hibernate to load the association in the same query as the parent:

```java
// Single query fetches users AND their orders together
@Query("SELECT u FROM User u JOIN FETCH u.orders WHERE u.status = :status")
List<User> findActiveUsersWithOrders(@Param("status") String status);
// → SELECT u.*, o.* FROM users u INNER JOIN orders o ON o.user_id = u.id WHERE u.status = ?
// Total: 1 query ✅
```

### JOIN FETCH vs LEFT JOIN FETCH

```java
// INNER JOIN FETCH — only returns users who HAVE at least one order
@Query("SELECT u FROM User u JOIN FETCH u.orders WHERE u.status = :status")

// LEFT JOIN FETCH — returns all users, with empty list if they have no orders
@Query("SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.status = :status")
```

:::danger[JOIN FETCH with pagination — the silent memory problem]
You **cannot** safely combine `JOIN FETCH` with `Pageable`:

```java
// ❌ This produces a Hibernate warning and loads ALL rows into memory first:
@Query("SELECT u FROM User u JOIN FETCH u.orders")
Page<User> findAllWithOrders(Pageable pageable);
// WARNING: HHH90003004: firstResult/maxResults specified with collection fetch;
//          applying in memory!
// → All rows loaded into JVM, then sliced — defeats the purpose of pagination
```

**Solutions:**

Option 1 — Use `@EntityGraph` instead (works with pagination):
```java
@EntityGraph(attributePaths = {"orders"})
Page<User> findByStatus(String status, Pageable pageable);
```

Option 2 — Separate queries (batch fetch pattern):
```java
// Step 1: paginate user IDs only
@Query("SELECT u.id FROM User u WHERE u.status = :status")
Page<Long> findUserIdsByStatus(@Param("status") String status, Pageable pageable);

// Step 2: fetch users + orders for just those IDs
@Query("SELECT u FROM User u JOIN FETCH u.orders WHERE u.id IN :ids")
List<User> findUsersWithOrdersByIds(@Param("ids") List<Long> ids);
```
:::

---

### @EntityGraph vs JOIN FETCH

Both solve N+1, but in different ways:

<Tabs>
  <TabItem value="entitygraph" label="@EntityGraph">

```java
// Defined on the entity:
@Entity
@NamedEntityGraph(
    name = "User.withRolesAndDepartment",
    attributeNodes = {
        @NamedAttributeNode("roles"),
        @NamedAttributeNode("department")
    }
)
public class User { ... }

// Used in the repository:
@EntityGraph("User.withRolesAndDepartment")
Optional<User> findByUsername(String username);

// Or inline without @NamedEntityGraph:
@EntityGraph(attributePaths = {"roles", "department"})
List<User> findByStatus(String status);
```

**Pros:** works with derived methods and pagination. Spring generates a LEFT OUTER JOIN.

**Cons:** always LEFT JOIN — cannot specify INNER JOIN. Less control over the generated SQL.

  </TabItem>
  <TabItem value="joinfetch" label="JOIN FETCH">

```java
@Query("SELECT u FROM User u JOIN FETCH u.roles JOIN FETCH u.department WHERE u.status = :status")
List<User> findActiveUsersWithRolesAndDepartment(@Param("status") String status);
```

**Pros:** full control — choose INNER or LEFT JOIN per relationship. Can add WHERE conditions on joined tables. Explicit and readable.

**Cons:** cannot be combined with `Pageable` (loads all into memory). More verbose.

  </TabItem>
</Tabs>

| | `@EntityGraph` | `JOIN FETCH` |
|-|---------------|-------------|
| **Works with Pageable** | ✅ Yes | ❌ No (in-memory warning) |
| **Works with derived methods** | ✅ Yes | ❌ No |
| **JOIN type control** | ❌ Always LEFT OUTER | ✅ INNER or LEFT |
| **Condition on joined table** | ❌ No | ✅ Yes |
| **Multiple collections** | ⚠️ Cartesian product risk | ⚠️ Cartesian product risk |

:::warning[Multiple collections — the Cartesian product trap]
Fetching two `@OneToMany` collections in one query produces a Cartesian product — if a user has 5 orders and 3 roles, the result set has 15 rows for that user. For `JOIN FETCH`, Hibernate deduplicates with `DISTINCT`. For large collections this is still wasteful:

```java
// ❌ Cartesian product — avoid for large collections
@Query("SELECT DISTINCT u FROM User u JOIN FETCH u.orders JOIN FETCH u.roles")

// ✅ Better: use @BatchSize on the entity collections (separate queries, but batched)
@OneToMany
@BatchSize(size = 50)  // loads roles for 50 users in one IN query
private List<Role> roles;
```
:::

---

## DTO Projections for Memory Optimization

Fetching full entities forces Hibernate to:
1. Read every column from the result set.
2. Allocate a Java object for each entity.
3. Store a deep snapshot copy for dirty checking at flush time.
4. Maintain all of this in the L1 cache for the transaction duration.

For read-heavy endpoints, this is wasteful. DTO projections skip all of it:

```java
// ❌ Fetches all 30 columns, allocates entity proxies, enables dirty tracking
List<User> users = userRepository.findByStatus("ACTIVE");

// ✅ Fetches 4 columns, no proxy, no dirty checking, no L1 cache tracking
@Query("""
    SELECT new dev.example.dto.UserSummaryDto(
        u.id, u.firstName, u.email, COUNT(o.id)
    )
    FROM User u
    LEFT JOIN u.orders o
    WHERE u.status = 'ACTIVE'
    GROUP BY u.id, u.firstName, u.email
    """)
List<UserSummaryDto> getActiveUserSummaries();
```

**Memory impact at scale:**

```
Full entity fetch — 10,000 users:
  Per entity: ~2KB (entity object + Hibernate snapshot + proxy metadata)
  Total heap: ~20 MB held for the duration of the transaction

DTO projection — 10,000 users (4 fields):
  Per DTO: ~80 bytes (plain object, no tracking)
  Total heap: ~800 KB — 25× less memory pressure
```

---

## Performance Tuning

<details>
<summary>🔬 Senior deep-dive: query hints</summary>

`@QueryHints` passes hints to the underlying JPA provider to control caching, lock modes, and query timeouts:

```java
@QueryHints({
    @QueryHint(name = "org.hibernate.readOnly", value = "true"),     // no dirty checking
    @QueryHint(name = "org.hibernate.fetchSize", value = "50"),      // JDBC fetch size
    @QueryHint(name = "jakarta.persistence.query.timeout", value = "5000") // 5s timeout
})
@Query("SELECT u FROM User u WHERE u.status = 'ACTIVE'")
List<User> findActiveUsersReadOnly();
```

| Hint | Effect |
|------|--------|
| `org.hibernate.readOnly = true` | Disables dirty checking — reduces memory, speeds up flush |
| `org.hibernate.fetchSize = N` | JDBC streaming batch size — reduces memory for large result sets |
| `jakarta.persistence.query.timeout` | Cancels slow queries after N milliseconds |
| `org.hibernate.cacheable = true` | Enables the L2 (query result) cache for this query |

</details>

<details>
<summary>🔬 Senior deep-dive: HikariCP and connection pool starvation</summary>

For detailed guidelines on pool sizing, parameter details, starvation patterns, and Micrometer instrumentation, see the centralized **[Database Connection Pooling](../database/connection-pooling.md)** guide.

</details>

<details>
<summary>🔬 Senior deep-dive: streaming large result sets</summary>

Loading 100,000 rows into a `List` blows up heap memory. Stream them instead:

```java
// Returns a lazy Java Stream — rows are fetched from JDBC in batches, not all at once
@QueryHints(@QueryHint(name = "org.hibernate.fetchSize", value = "100"))
@Query("SELECT u FROM User u WHERE u.status = 'ACTIVE'")
Stream<User> streamActiveUsers();

// Usage — must be inside a transaction; close the stream when done
@Transactional(readOnly = true)
public void exportUsers(OutputStream out) {
    try (Stream<User> stream = userRepository.streamActiveUsers()) {
        stream.map(userMapper::toDto)
              .forEach(dto -> csvWriter.write(out, dto));
    }
    // Stream closed → cursor closed → connection returned to pool
}
```

:::warning[Always close the Stream]
A `Stream<T>` from Spring Data holds an open JDBC cursor and therefore an active database connection. Not closing it leaks the connection. Always use `try-with-resources` or call `.close()` explicitly.
:::

</details>

<details>
<summary>🔬 Senior deep-dive: @Query vs Specification vs QueryDSL</summary>

For dynamic queries where filters change per request, `@Query` with optional parameter tricks (`IS NULL OR field = :param`) is limited. Compare the alternatives:

| | `@Query` | `Specification` (JPA Criteria) | QueryDSL |
|-|---------|-------------------------------|---------|
| **Static queries** | ✅ Best | Overkill | Overkill |
| **Dynamic filters** | ⚠️ Hacky (`IS NULL` tricks) | ✅ Designed for this | ✅ Designed for this |
| **Type safety** | ❌ String-based | ✅ Type-safe at compile time | ✅ Type-safe |
| **Readability** | ✅ SQL-like, familiar | ❌ Verbose Criteria API | ✅ Fluent, readable |
| **Pagination support** | ✅ Native | ✅ Native | ✅ Native |
| **Setup cost** | None | None (built-in) | Requires APT plugin |

```java
// Dynamic search with Specification — composable predicates
public class UserSpecifications {
    public static Specification<User> hasStatus(String status) {
        return (root, query, cb) ->
            status == null ? null : cb.equal(root.get("status"), status);
    }
    public static Specification<User> nameContains(String keyword) {
        return (root, query, cb) ->
            keyword == null ? null : cb.like(
                cb.lower(root.get("firstName")),
                "%" + keyword.toLowerCase() + "%"
            );
    }
}

// Compose at call site — only active conditions are applied
Specification<User> spec = where(hasStatus("ACTIVE")).and(nameContains("alice"));
Page<User> results = userRepository.findAll(spec, PageRequest.of(0, 20));
```

**Decision guide:**
- Simple, fixed query → `@Query`.
- Dynamic filters that change per request → `Specification`.
- Complex dynamic queries with joins across many tables → `QueryDSL`.

</details>

---

## Testing @Query Methods

Test repository queries with `@DataJpaTest` — it loads only the JPA slice (no controllers, no services) and uses an in-memory H2 database by default:

```java
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager em;

    @BeforeEach
    void setUp() {
        em.persist(new User("alice", "alice@gmail.com", "ACTIVE", "ADMIN"));
        em.persist(new User("bob",   "bob@corp.com",   "ACTIVE", "USER"));
        em.persist(new User("carol", "carol@gmail.com","INACTIVE","USER"));
        em.flush();
    }

    @Test
    void findByStatus_returnsOnlyActiveUsers() {
        List<User> result = userRepository.findByStatus("ACTIVE", Sort.unsorted());
        assertThat(result).hasSize(2)
                .extracting(User::getUsername)
                .containsExactlyInAnyOrder("alice", "bob");
    }

    @Test
    void getActiveUserSummaries_includesOrderCount() {
        // persist an order for alice
        em.persist(new Order("alice-id", BigDecimal.TEN));
        em.flush();

        List<UserSummaryDto> summaries = userRepository.getActiveUserSummaries();
        assertThat(summaries).anyMatch(s ->
            s.getFirstName().equals("alice") && s.getOrderCount() == 1L);
    }

    @Test
    void deactivateDormantAccounts_updatesStatusAndReturnsCount() {
        int affected = userRepository.deactivateDormantAccounts(
                LocalDate.now().minusMonths(6));

        assertThat(affected).isGreaterThanOrEqualTo(0);
        em.clear(); // clear L1 cache before asserting DB state
        User alice = em.find(User.class, /* alice's id */);
        assertThat(alice.getStatus()).isEqualTo("INACTIVE");
    }
}
```

:::tip[Use a real database for native queries]
H2 doesn't support PostgreSQL-specific syntax (`JSONB`, `LATERAL`, `ON CONFLICT`). Test native queries against a real database using Testcontainers:

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class NativeQueryTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    // ... test methods
}
```
:::

---

## Common Mistakes

| Mistake | Why it's a problem | Fix |
|---------|-------------------|-----|
| Using `@Modifying` without `@Transactional` | Throws `InvalidDataAccessApiUsageException` at runtime | Add `@Transactional` to the repository method |
| `@Modifying` without `clearAutomatically = true` | Stale entities in L1 cache cause incorrect reads after bulk update | Set `clearAutomatically = true` |
| `JOIN FETCH` with `Pageable` | Hibernate loads all rows into memory, then slices in JVM — `OutOfMemoryError` risk | Use `@EntityGraph` or two-query pattern |
| Fetching full entities for read-only endpoints | Unnecessary heap pressure from dirty-checking snapshots | Use DTO projections or `@QueryHint readOnly = true` |
| N+1 on every request | 100 users × 1 lazy query = 101 DB round trips, pool starvation | `JOIN FETCH` or `@EntityGraph` |
| `SELECT *` patterns in native queries | Couples result mapping to table schema — breaks on column additions | Select only the columns you need |
| Not closing `Stream<T>` result | Open JDBC cursor leaks the database connection — pool exhaustion over time | Always use `try-with-resources` |
| Hardcoding entity name in SpEL-eligible base queries | Breaks when entity is renamed | Use `#{#entityName}` in generic repositories |

---

## 🎯 Interview Questions

**Q1. What is the difference between JPQL and native SQL in Spring Data JPA? When do you choose each?**
> JPQL operates on JPA entity classes and their fields — Hibernate translates it to SQL using the configured dialect. It is database-portable, integrates with the L1/L2 caches, and is refactoring-safe. Native SQL is sent directly to the database unchanged — use it only for database-specific features unavailable in JPQL: `JSONB` operations, window functions, recursive CTEs, full-text search. Default to JPQL; switch to native only when you hit its limits.

**Q2. What is the N+1 problem and how does JOIN FETCH solve it?**
> N+1 occurs when loading N parent entities and then accessing a lazy-loaded collection on each — triggering one query per parent. 100 users with lazy `orders` = 1 + 100 = 101 queries. `JOIN FETCH` loads the parent and the association in a single SQL JOIN query, reducing 101 queries to 1. The trade-off: `JOIN FETCH` cannot be combined with `Pageable` without loading all rows into memory first.

**Q3. Why must @Modifying queries use `clearAutomatically = true`?**
> Bulk `UPDATE` and `DELETE` queries execute directly against the database, bypassing the JPA persistence context (L1 cache). Any entities already loaded in the same transaction hold stale data. Without `clearAutomatically = true`, subsequent reads in the same transaction return cached (stale) values even after a `findById`. With it, the L1 cache is cleared after the bulk operation, forcing fresh DB reads.

**Q4. When would you use a DTO projection instead of returning a full entity?**
> For read-only, high-frequency endpoints where you need only a subset of fields. Full entities incur: reading all columns, allocating the entity object, creating a dirty-checking snapshot, and storing everything in the L1 cache. DTO projections skip all of this — Hibernate reads only the projected columns, allocates a plain object, and does no tracking. For a list of 10,000 records, this can reduce heap usage by 10–25×.

**Q5. (Senior) How does HikariCP connection pool starvation relate to N+1 queries?**
> Each query borrows a connection from HikariCP for the duration of the call. N+1 queries inside a single transaction hold a connection open while issuing serial queries, quickly depleting the pool and causing other requests to time out. For details, sizing, and solutions, see **[Database Connection Pooling](../database/connection-pooling.md)**.

**Q6. (Senior) How do `@EntityGraph` and `JOIN FETCH` differ, and when do you choose each?**
> Both solve N+1 by eagerly loading associations in a JOIN. Differences: `@EntityGraph` always uses LEFT OUTER JOIN, works with `Pageable` and derived methods, but offers no control over JOIN type or conditions on the joined table. `JOIN FETCH` in `@Query` allows INNER or LEFT JOIN, supports WHERE conditions on the joined table, and is explicit — but cannot be safely combined with `Pageable`. Rule of thumb: use `@EntityGraph` for paginated lists or when derived methods are sufficient; use `JOIN FETCH` in `@Query` when you need precise SQL control and are not paginating.

**Q7. (Senior) What happens when you call `@Modifying` without `flushAutomatically = true`, and there are pending entity changes in the same transaction?**
> By default (`flushAutomatically = false`), the persistence context has not yet flushed dirty entity changes to the database when the bulk query runs. If you loaded a user, set `user.setStatus("ACTIVE")`, and then ran a bulk UPDATE affecting that same row — the bulk UPDATE may overwrite the in-memory change with the old value from DB, or the subsequent flush may overwrite the bulk result. With `flushAutomatically = true`, Hibernate first flushes all pending changes to the DB, then executes the bulk query — ensuring a consistent ordering. The safe pattern: always set both `flushAutomatically = true` and `clearAutomatically = true` on `@Modifying` queries.

---

## See Also

- [Spring Exception Handling — @RestControllerAdvice](./spring-exception-handling.md)
- [Spring Data JPA — Entity Relationships & Fetch Strategies](./spring-data-jpa-mappings.md)
- [Hibernate Query Cache & Second-Level Cache](./jpa-vs-hibernate.md#4-second-level-cache-l2-cache)
- [Database Connection Pooling](../database/connection-pooling.md)