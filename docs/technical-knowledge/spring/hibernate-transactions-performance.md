---
title: Hibernate Transactions and Performance in Spring Apps
description: Deep dive into Hibernate transaction semantics, locking, N+1 diagnostics, and performance tuning in Spring applications.
tags: [hibernate, spring, transactions, performance, jpa]
---

# Hibernate Transactions and Performance in Spring Apps

This guide focuses on the Hibernate-level behaviors that usually cause production issues: transaction boundaries, locking, flush/commit timing, and query performance.

## Transaction Basics in Spring

```java
@Transactional
public void placeOrder() {
    orderRepository.save(order);
    inventoryService.decrementStock();
}
```

All operations in the method run in one transaction and either commit together or roll back together.

## Transaction Attributes

| Attribute | Purpose |
|---|---|
| `readOnly` | Optimization hint for read-heavy operations |
| `propagation` | Controls nested transaction behavior |
| `isolation` | DB isolation level |
| `rollbackFor` | Checked exception rollback control |
| `timeout` | Transaction timeout in seconds |

## Default Rollback Rules

| Exception Type | Default Behavior |
|---|---|
| `RuntimeException` | Rollback |
| Checked exception (`Exception`) | Commit |
| `Error` | Rollback |

Spring does not roll back checked exceptions unless configured.

## Why This Behavior Exists

Historically, checked exceptions represented business conditions while unchecked exceptions represented system failures. In modern systems, this assumption is often not enough, so explicit rollback rules are frequently required.

### Force rollback for checked exceptions

```java
@Transactional(rollbackFor = Exception.class)
public void createOrder() throws Exception {
    orderRepository.save(order);
    throw new Exception("fail");
}
```

## Common Pitfalls

### Swallowed exceptions

```java
@Transactional
public void createOrder() {
    try {
        orderRepository.save(order);
        throw new RuntimeException();
    } catch (Exception e) {
        // swallowed
    }
}
```

Result: transaction commits.

### Self-invocation bypasses proxy

```java
public void methodA() {
    methodB();
}

@Transactional
public void methodB() {
    throw new RuntimeException();
}
```

Result: `@Transactional` on `methodB` is not applied.

### Non-public methods

```java
@Transactional
private void doSomething() {}
```

Result: ignored by proxy-based AOP.

## Transaction Lifecycle (Internal)

1. Proxy intercepts method call.
2. `PlatformTransactionManager` starts transaction.
3. Business logic executes.
4. Rollback rules are evaluated if exception occurs.
5. Transaction is committed or rolled back.

Core components:
- `TransactionInterceptor`
- `PlatformTransactionManager`
- AOP proxy (JDK/CGLIB)

## Flush vs Commit

| Step | Meaning |
|---|---|
| `save()` | Entity enters persistence context |
| `flush()` | SQL is generated/sent |
| `commit()` | Transaction is finalized |

Hibernate uses write-behind, so SQL may be deferred until flush/commit.

## Propagation and Isolation

### `REQUIRED`
- Joins current transaction if one exists.
- Starts a new one otherwise.

### `REQUIRES_NEW`
- Suspends outer transaction.
- Starts an independent transaction.

Useful for audit writes and outbox records.

### `NESTED`
- Uses savepoints.
- Supports partial rollback semantics in compatible transaction managers.

### Isolation levels

| Level | Prevents |
|---|---|
| `READ_COMMITTED` | Dirty reads |
| `REPEATABLE_READ` | Non-repeatable reads |
| `SERIALIZABLE` | Phantom reads |

## Locking

### Optimistic locking (`@Version`)

```java
@Entity
public class Product {
    @Id
    private Long id;

    private int stock;

    @Version
    private Long version;
}
```

Use when conflicts are rare; retry on optimistic lock failure.

### Pessimistic locking (`SELECT ... FOR UPDATE`)

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.id = :id")
Optional<Product> findByIdForUpdate(@Param("id") Long id);
```

Use for high-contention resources such as inventory or seat booking.

### Practical strategy choice

| Scenario | Strategy | Why |
|---|---|---|
| Low-contention write paths | Optimistic | Minimal lock overhead |
| High-contention records | Pessimistic | Strong conflict control |
| Read-heavy reporting | `readOnly = true` | Lower overhead |
| Long-running workflows | Optimistic + retry | Avoid long lock hold times |

## N+1 Query Problem

```java
List<User> users = userRepository.findAll();
for (User u : users) {
    u.getOrders().size();
}
```

This can trigger `1 + N` queries.

### Fix patterns

```java
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List<User> findAllWithOrders();
```

```java
@EntityGraph(attributePaths = {"orders"})
List<User> findAll();
```

## Caching Layers

- First-level cache: per Hibernate Session/transaction.
- Second-level cache: shared app cache (disabled by default).

Use second-level cache selectively for high-read, low-churn data.

## Connection Pool and Batch Tuning

For detailed pool configuration, sizing heuristics, and failure modes, see the centralized **[Database Connection Pooling](../database/connection-pooling.md)** guide.

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

Guidelines:
- Keep pool sizes realistic for DB CPU capacity (see [Connection Pooling](../database/connection-pooling.md)).
- Enable batching for bulk writes.
- Monitor slow queries and lock waits continuously.

## Senior Design Heuristics

1. Keep transactions short.
2. Do not call remote APIs inside DB transactions.
3. Place transaction boundaries at service layer.
4. Validate critical endpoint SQL generated by ORM.

## Microservices Note

Avoid distributed DB transactions (2PC) as a default pattern. Prefer saga-style coordination and transactional outbox approaches.

## TL;DR

| Case | Outcome |
|---|---|
| No exception | Commit |
| Checked exception (default) | Commit |
| Runtime exception | Rollback |
| `rollbackFor` configured | Rollback as configured |
| Swallowed exception | Commit |
| Self-invocation | Transaction not applied |
| `save()` call | Not a commit by itself |
| Commit phase | Final write durability |

## Compare Next

- [Spring Data JPA: Repositories and Query Patterns](./spring-data-jpa-repositories-and-queries.md)
- [Spring Data JPA Interview Questions](./spring-data-jpa-interview-questions.md)
- [Spring Data JPA Overview](./spring-data-jpa.md)
