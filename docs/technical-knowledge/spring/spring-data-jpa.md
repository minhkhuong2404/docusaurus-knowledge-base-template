---
title: Spring Data JPA Overview
description: High-level map of Spring Data JPA concepts and links to focused guides on repositories and Hibernate internals.
tags: [spring-data-jpa, spring, java, persistence]
---

# Spring Data JPA Overview

Spring Data JPA gives you repository abstractions on top of JPA/Hibernate so you can build data access layers with far less boilerplate.

## What It Solves

- Removes repetitive CRUD DAO code.
- Supports query derivation from method names.
- Adds first-class pagination and sorting.
- Integrates with transactions, auditing, and Spring Boot auto-configuration.

## Mental Model

1. Define entity classes.
2. Create repository interfaces.
3. Use derived/custom queries where needed.
4. Tune Hibernate behavior for performance and transaction safety.

## Repository Hierarchy (Quick View)

```text
Repository
  -> CrudRepository
  -> PagingAndSortingRepository
  -> JpaRepository
```

In most projects, `JpaRepository` is the default choice.

## Split Guides

- [Spring Data JPA: Repositories and Query Patterns](./spring-data-jpa-repositories-and-queries.md)
- [Hibernate: Transactions and Performance in Spring Apps](./hibernate-transactions-performance.md)
- [Spring Data JPA Interview Questions](./spring-data-jpa-interview-questions.md)

## When to Use Which

- Use Spring Data JPA abstractions for most application CRUD/query work.
- Use Hibernate-focused techniques when diagnosing performance, transaction, or concurrency behavior.

## Compare Next

- [Spring MVC - Complete Guide](./spring-mvc.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
- [Spring Framework: Deep Dive](./spring-framework-deep-dive.md)
