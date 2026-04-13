---
id: jpa-hibernate-lifecycle-methods
title: "JPA vs Hibernate: save, persist, merge, and update"
sidebar_label: Entity State Transitions
description: An advanced breakdown of JPA and Hibernate persistence methods, exploring entity states, primary key generation strategies, and connection pool performance.
author: luminhkhuong
tags: [java, jpa, hibernate, architecture, performance]
slug: /java/jpa-hibernate-lifecycle-methods
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

When working with Spring Boot and Hibernate, understanding the exact nuances between JPA standard methods and Hibernate's proprietary implementations is crucial. Misunderstanding these can lead to nasty `LazyInitializationException` bugs, `NonUniqueObjectException` errors, or connection pool exhaustion in high-throughput applications.

This guide explores the mechanical differences between `persist()`, `save()`, `merge()`, and `update()`.

---

## 1. The Entity Lifecycle Refresher

Before examining the methods, we must establish the four states of a JPA entity lifecycle inside the Persistence Context (First-Level Cache):

1. **Transient:** A newly instantiated object (e.g., `new Author()`). It has no database row and no association with any Persistence Context.
2. **Managed (Persistent):** The entity is tracked by the current `EntityManager`. Any changes to its fields will be synchronized to the database automatically during the next flush via dirty checking.
3. **Detached:** The entity has a corresponding database row, but it is *no longer* tracked by the current Persistence Context (e.g., the transaction ended, or `entityManager.detach()` was called).
4. **Removed:** Scheduled for deletion upon the next flush.

---

## 2. Transitioning to Managed: `persist()` vs `save()`

When you have a **Transient** entity and want to save it to the database, you need to transition it to the **Managed** state. 

### The Core Differences

| Feature           | `EntityManager.persist()`            | `Session.save()`                                   |
| :---------------- | :----------------------------------- | :------------------------------------------------- |
| **Origin**        | JPA Standard                         | Hibernate Proprietary                              |
| **Return Type**   | `void`                               | `Serializable` (Returns the generated Primary Key) |
| **PK Assignment** | Not specified by JPA (often delayed) | Guarantees immediate generation of the PK          |

### Deep Dive: Primary Key Generation Strategies

The execution behavior of both methods heavily depends on your `@GeneratedValue` strategy. 

<Tabs>
  <TabItem value="identity" label="IDENTITY Strategy" default>
    With `@GeneratedValue(strategy = GenerationType.IDENTITY)`, the database itself assigns the ID upon row insertion. 
    
    Because Hibernate requires the primary key to store the entity in the First-Level Cache, **both `persist()` and `save()` are forced to execute the `INSERT` statement immediately**, completely breaking transactional write-behind buffering.
  </TabItem>
  <TabItem value="sequence" label="SEQUENCE Strategy">
    With `@GeneratedValue(strategy = GenerationType.SEQUENCE)`, Hibernate decouple the ID generation from the insert statement.
    
    When you call `persist()`, Hibernate fires a `SELECT` to fetch the next sequence value, assigns it to the entity, and marks it as Managed. The actual `INSERT` statement is delayed until the `EntityManager` flushes.
  </TabItem>
</Tabs>

### Code Example: `persist()`

```java
// 1. Transient State
Author author = new Author();
author.setFirstName("Thorben");
author.setLastName("Janssen");

// 2. Transitions to Managed
// If using SEQUENCE, only a sequence fetch occurs. No INSERT yet.
entityManager.persist(author); 

// 3. INSERT executed here during flush
entityManager.getTransaction().commit(); 
```

**Recommendation:** Always prefer the JPA standard `persist()` unless you are working without an active transaction or with `FlushMode.MANUAL` where you explicitly need Hibernate's `save()` to force an immediate ID return.

---

## 3. Reattaching Detached Entities: `merge()` vs `update()`

When an entity is **Detached** (e.g., a payload passed from a REST controller), you must reattach it to a new Persistence Context to persist modifications.

### `EntityManager.merge()` (JPA Standard)
`merge()` does not convert the passed object itself into a managed state. Instead, it **copies** the state of the detached entity onto a managed instance.

**Execution Flow:**
1. Triggers an `SQL SELECT` statement to load the entity from the database into the First-Level Cache (if not already present).
2. Copies all attribute values from your detached object into the newly loaded managed object.
3. Returns the *new* managed object (the original object remains Detached).
4. Executes an `UPDATE` statement upon flush *only if* the copied values differ from the database values (Dirty Checking).
5. **Cascading:** Will traverse and select all associations marked with `CascadeType.MERGE`.

### `Session.update()` (Hibernate Proprietary)
`update()` blindly transitions the passed detached object directly into the Managed state.

**Execution Flow:**
1. **No `SELECT` statement is executed.**
2. It simply attaches the entity to the Persistence Context.
3. It schedules an unconditional `UPDATE` statement for the next flush.
4. **Danger:** If the current session already contains a managed entity with the same identifier, calling `update()` throws a `NonUniqueObjectException`.

---

## 4. Senior Deep Dive & Architectural Implications

### Connection Pool Exhaustion (HikariCP)
Understanding the timing of these SQL statements is vital for performance optimization. When using the `IDENTITY` strategy, because `persist()` or `save()` forces an immediate `INSERT`, Hibernate must acquire a physical JDBC connection from your connection pool (like HikariCP) at the exact moment the method is called. 

If your method performs other time-consuming operations (like external API calls) after calling `save()`, that HikariCP connection sits idle but locked, drastically reducing your application's throughput. Using `SEQUENCE` with `persist()` defers connection acquisition and statement execution until the very end of the transaction, optimizing connection pool lifecycle management.

### Unnecessary Updates & Database Triggers
Because Hibernate's `update()` fires an `UPDATE` statement unconditionally (lacking the dirty-check phase of `merge()`), it can cause massive performance degradations if the target database table has expensive `ON UPDATE` triggers. 

If you choose to use `update()` to avoid the initial `SELECT` penalty of `merge()`, you should annotate your entity with `@SelectBeforeUpdate`. This forces Hibernate to perform a `SELECT` and do a dirty check before blindly firing the `UPDATE`, essentially mimicking `merge()` but keeping the object identity intact.

### How Spring Data JPA Abstraction Works
If you use Spring Data's `CrudRepository.save(T entity)`, you might wonder which method is actually being called. 

Looking at the `SimpleJpaRepository` implementation:
```java
@Transactional
public <S extends T> S save(S entity) {
    if (entityInformation.isNew(entity)) {
        em.persist(entity);
        return entity;
    } else {
        return em.merge(entity);
    }
}
```
Spring automatically delegates to `persist()` for new entities and `merge()` for detached ones. Because it relies heavily on `merge()` for updates, sending a full payload from the client is often required to prevent nullifying fields. For high-performance microservices, creating specific DTO-to-Entity mapping layers to load, map, and let the Persistence Context's dirty checking naturally trigger the update is far more efficient than relying blindly on `.save()`.