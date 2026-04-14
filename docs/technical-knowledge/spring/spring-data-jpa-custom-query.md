---
slug: spring-data-jpa-query-annotation
title: "Spring Data JPA: Ultimate Guide to Custom Queries with @Query"
description: "A comprehensive deep dive into custom JPQL, Native SQL, SpEL expressions, and internal Hibernate mechanics using Spring Data JPA's @Query."
date: 2026-04-12
authors: luminhkhuong
tags: [java, spring-boot, jpa, hibernate, backend, architecture]
---

# Mastering Spring Data JPA Custom Queries

Derived query methods in Spring Data JPA are incredibly convenient for straightforward use cases [00:00:39]. However, as domain models grow complex and you need precise control over the executed SQL, relying solely on method names quickly becomes unmaintainable [00:00:47]. 

As part of building a strong foundational understanding of backend mechanics, this guide explores how to leverage the `@Query` annotation for high-performance data access, progressing from basic JPQL to a senior-level deep dive into persistence context mechanics.

## 1. Defining Custom JPQL Queries

By default, the `@Query` annotation accepts Java Persistence Query Language (JPQL). JPQL is an object-oriented query language that operates on your JPA entity classes rather than database tables [00:02:51]. This keeps your code database-agnostic.

```java title="UserRepository.java"
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' AND u.department.id = ?1")
    List<User> findActiveUsersByDepartment(Long departmentId);
}
```

:::tip[Foundational Principle]
Always prefer JPQL over Native SQL when possible. It maintains database portability and allows Hibernate to optimize the Abstract Syntax Tree (AST) during SQL translation.
:::

## 2. Parameter Binding: Positional vs. Named

Spring Data JPA supports injecting variables into your queries using both positional and named parameters [00:09:53]. To prevent SQL injection vulnerabilities, the persistence provider automatically converts parameters to the correct SQL type [00:10:17].

### Positional Parameters
Positional parameters use `?1`, `?2`, etc., corresponding to the exact order of the method signature [00:10:59].

```java
@Query("SELECT u FROM User u WHERE u.firstName = ?1 AND u.lastName = ?2")
User findByFullName(String firstName, String lastName);
```

### Named Parameters (Recommended)
Using `@Param` ensures that refactoring method signatures won't break your queries [00:11:57]. It binds parameters explicitly by name.

```java
@Query("SELECT u FROM User u WHERE u.firstName = :first AND u.lastName = :last")
User findByFullNameNamed(@Param("first") String firstName, @Param("last") String lastName);
```

## 3. Dynamic Sorting and Pagination

You do not need to manually write complex `ORDER BY` or `LIMIT`/`OFFSET` clauses. Spring Data seamlessly integrates `Sort` and `Pageable` parameters into custom `@Query` definitions [00:04:18].

```java
// Dynamically appending ORDER BY
@Query("SELECT u FROM User u WHERE u.role = :role")
List<User> findUsersByRole(@Param("role") String role, Sort sort);

// Handling OFFSET, LIMIT, and providing pagination metadata [[06:12](http://www.youtube.com/watch?v=2SV7QODVHAE&t=372)]
@Query("SELECT u FROM User u WHERE u.role = :role")
Page<User> findUsersByRolePaginated(@Param("role") String role, Pageable pageable);
```

## 4. Native SQL Queries

For queries utilizing database-specific functions (e.g., PostgreSQL `JSONB` operations, CTEs, or window functions), you can set `nativeQuery = true` [00:08:47]. The query string is passed directly to the underlying database without JPQL parsing [00:09:33].

```java
@Query(
  value = "SELECT * FROM users u WHERE u.properties ->> 'timezone' = :timezone", 
  nativeQuery = true
)
List<User> findUsersByTimezoneNative(@Param("timezone") String timezone);
```

:::danger[Architectural Risk]
Native queries bypass Hibernate's dialect translation. If you migrate from MySQL to PostgreSQL, these queries will require rewrites. Ensure you strictly document database-dependent logic.
:::

## 5. Advanced Dynamic Capabilities with SpEL

Spring Expression Language (SpEL) can be embedded directly into the `@Query` string using `#{ ... }` [00:06:49]. This is highly useful for dynamically referencing entity names or manipulating parameter strings before execution [00:07:49].

```java
@Query("SELECT u FROM #{#entityName} u WHERE u.email LIKE %:domain%")
List<User> findByEmailDomain(@Param("domain") String domain);
```

## 6. Data Modification (UPDATE / DELETE)

To execute DML (Data Manipulation Language) statements, the `@Query` annotation must be paired with the `@Modifying` annotation [00:12:14]. 

```java
@Modifying
@Query("UPDATE User u SET u.status = 'INACTIVE' WHERE u.lastLoginDate < :threshold")
int deactivateDormantAccounts(@Param("threshold") LocalDate threshold);
```

---

## 🌟 Senior Deep Dive: Internals and Performance Optimization

When engineering robust microservices, mastering the query syntax is only the first step. Understanding what occurs inside the JVM memory arenas and connection pools is critical.

### 1. The L1 Cache and `@Modifying(clearAutomatically = true)`
When executing a bulk update or delete via `@Modifying`, the query executes directly against the database, completely bypassing the EntityManager's Level-1 (L1) cache. 

If you previously loaded a `User` entity in the same transaction, and then execute the update query above, your Java entity object now holds **stale data** in JVM memory. 

**The Implementation:**
```java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("UPDATE User u SET u.status = 'INACTIVE' WHERE u.lastLoginDate < :threshold")
int deactivateDormantAccounts(@Param("threshold") LocalDate threshold);
```
- `flushAutomatically = true`: Forces any pending entity changes to synchronize with the database *before* the bulk query runs.
- `clearAutomatically = true`: Clears the EntityManager after the query, forcing subsequent lookups in the same transaction to fetch fresh data, maintaining memory coherence.

### 2. DTO Projections for Memory Optimization
Fetching full domain entities forces Hibernate to hydrate large proxy objects, track them for dirty checking, and consume significant heap memory. In read-heavy scenarios, query exactly what you need to avoid memory bloat.

Use JPQL Constructor Expressions to map results directly to unmanaged DTOs:

```java
// No proxy creation, no dirty checking - pure memory efficiency
@Query("SELECT new dev.luminhkhuong.dto.UserSummary(u.id, u.firstName, u.email) FROM User u WHERE u.status = 'ACTIVE'")
List<UserSummary> getActiveUserSummaries();
```

### 3. Connection Pool Starvation and the N+1 Problem
When returning entities that have lazy-loaded relationships, accessing those relationships later will trigger an N+1 query issue. In a high-throughput environment, this rapidly depletes available connections in your HikariCP pool, leading to connection acquisition timeouts.

While `EntityGraphs` are a modern solution, `@Query` allows you to solve this explicitly and predictably via `FETCH JOIN`:

```java
// Forces initialization of the roles collection in a single query execution
@Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.username = :username")
Optional<User> findByUsernameWithRoles(@Param("username") String username);
```