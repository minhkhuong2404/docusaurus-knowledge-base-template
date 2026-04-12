---
title: Spring Data JPA Interview Questions
description: Curated Spring Data JPA and Hibernate interview questions with concise, practical answers.
tags: [spring-data-jpa, interview, hibernate, spring]
---

# Spring Data JPA Interview Questions

## 1) What is Spring Data JPA?

Spring Data JPA is a Spring Data module that provides repository abstractions on top of JPA. You define interfaces, and Spring generates the implementation at runtime.

## 2) Why use `JpaRepository` instead of `CrudRepository`?

`JpaRepository` extends CRUD with pagination, sorting, flush APIs, and batch-oriented capabilities, so it fits most application needs.

## 3) How do derived query methods work?

Spring parses repository method names such as `findByStatusAndEmailContaining` and generates corresponding JPQL/SQL automatically.

## 4) When should I use `@Query`?

Use `@Query` for complex joins, custom ordering, projections, and database-specific SQL that query derivation cannot express cleanly.

## 5) Difference between `findById()` and `getReferenceById()`?

- `findById`: loads immediately and returns `Optional`.
- `getReferenceById`: returns a lazy proxy and may fail later when accessed.

## 6) What does `@Modifying` do?

It marks a repository query as write operation (UPDATE/DELETE). Usually combined with `@Transactional`.

## 7) How does pagination work?

Add `Pageable` to repository methods and return `Page<T>`.

## 8) What is Query By Example (QBE)?

A dynamic matching approach where you provide a probe entity plus an `ExampleMatcher` instead of writing explicit query strings.

## 9) When to use Specifications?

Use Specifications when filters are optional and combinable. They are type-safe and composable for search endpoints.

## 10) What is the N+1 query problem?

Fetching parent rows then lazily loading child rows one-by-one. Fix with `JOIN FETCH`, `@EntityGraph`, or tuned batch fetching.

## 11) EAGER vs LAZY fetch?

- EAGER loads relation immediately.
- LAZY loads on access.

Default to LAZY and fetch explicitly for specific use cases.

## 12) How does Spring transaction rollback work?

By default, rollback happens for unchecked exceptions. Checked exceptions do not roll back unless configured (for example with `rollbackFor`).

## 13) Why does self-invocation break `@Transactional`?

Spring applies transactions via proxies; internal calls skip proxy interception.

## 14) What is flush vs commit?

- Flush synchronizes persistence context to DB.
- Commit finalizes the transaction.

Flush can happen multiple times before commit.

## 15) When to use `REQUIRES_NEW`?

For independent sub-transactions such as audit logging or outbox writes that must commit separately.

## 16) Optimistic vs pessimistic locking?

- Optimistic: version-check conflict detection, better for low contention.
- Pessimistic: DB lock on read/write, better for high contention.

## 17) How to tune write performance in JPA/Hibernate?

Enable JDBC batching, order inserts/updates, keep transaction scope small, and avoid unnecessary entity graph loading.

## 18) What are common transaction anti-patterns?

- Long-running transactions.
- Calling remote APIs inside transaction.
- Swallowing exceptions.
- Transaction annotations on private methods.

## 19) How to avoid infinite recursion in JSON with bidirectional mapping?

Use DTOs (preferred), or use `@JsonManagedReference` / `@JsonBackReference` as a serialization guard.

## 20) How do Flyway/Liquibase fit with Spring Data JPA?

They provide versioned schema migrations so database structure evolves safely and consistently across environments.

## 21) Why does Spring not rollback on checked exceptions by default?

This behavior comes from historical transaction semantics where checked exceptions were treated as expected business outcomes.

## 22) How does Spring decide to rollback?

Spring evaluates exception type against rollback rules, including `rollbackFor` and `noRollbackFor`, inside transactional interception logic.

## 23) What is the difference between flush and commit?

- Flush synchronizes persistence context to the database.
- Commit finalizes the transaction.

Flush can occur multiple times; commit finalizes once per transaction.

## 24) Why does self-invocation break transactions?

Proxy-based AOP only intercepts external calls. Internal calls on `this` bypass the proxy, so transactional advice is skipped.

## 25) When should `REQUIRES_NEW` be used?

Use it for independent units such as audit writes, outbox records, and compensation steps that must commit separately.

## 26) Why should transactions be short?

Long transactions increase lock duration, deadlock risk, and overall latency under load.

## Compare Next

- [Spring Data JPA: Repositories and Query Patterns](./spring-data-jpa-repositories-and-queries.md)
- [Hibernate: Transactions and Performance in Spring Apps](./hibernate-transactions-performance.md)
- [Spring Data JPA Overview](./spring-data-jpa.md)
