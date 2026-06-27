---
id: java-interview-answers-part-5
title: Java Interview Q&A - Generics, JDBC & Streams
description: Comprehensive answers to Java Generics, JDBC, and Java 8 Stream & Functional Programming interview questions.
sidebar_position: 7
tags: [java, interview, generics, jdbc, java8, streams, functional-programming]
---

# Java Interview Questions & Answers: Part 5

This guide covers advanced concepts in Java Generics (PECS, type erasure), JDBC database transaction isolation levels, locking mechanisms, and functional stream operations.

---

## Generics

### 1. What is Type Erasure and how does it work?

Java implements Generics using **Type Erasure** to maintain backward compatibility with legacy non-generic code written before Java 5.

#### Compilation Translation
During compilation, the compiler translates all generic types into raw types:
1. Replaces all type parameters in generic classes with their bounds (`Object` if unbounded, or the first bound if bounded).
2. Inserts type casts where necessary to preserve type safety.
3. Generates bridge methods to preserve polymorphism in extended generic classes.

```java
// BEFORE compilation
public class Box<T> {
    private T value;
    public T getValue() { return value; }
}

// AFTER compilation (Bytecode representation)
public class Box {
    private Object value; // T replaced by Object
    public Object getValue() { return value; }
}
```
**Runtime Impact:** Generic type information is completely unavailable at runtime. You cannot write `new T()` or `instanceof List<String>` because the JVM only sees `List` at runtime.

---

### 2. What is PECS (Producer Extends, Consumer Super)?

PECS is a guide for using wildcards in generic parameters:

* **Producer (`? extends T`):** Use this if your method reads/produces elements of type `T` from a collection. You can read elements as `T`, but you **cannot write** anything to this collection (except `null`) because the compiler cannot guarantee the exact subtype of the list.
* **Consumer (`? super T`):** Use this if your method writes/consumes elements of type `T` into a collection. You can safely **write** `T` and its subclasses to this collection, but reading from it only returns `Object`.

```java
// Producer: Reads Numbers. Safe to read, cannot write.
public double sumOfList(List<? extends Number> list) {
    double sum = 0.0;
    for (Number n : list) {
        sum += n.doubleValue(); // Reading is safe
    }
    // list.add(42); // Compilation Error!
    return sum;
}

// Consumer: Writes Integers. Safe to write, cannot read specific types.
public void addNumbers(List<? super Integer> list) {
    list.add(1);  // Writing is safe
    list.add(2);
    // Object obj = list.get(0); // Reading only yields Object
}
```

---

## Java Database Connectivity (JDBC)

### 3. Database Isolation Levels & Real-world Anomalies

JDBC Connection interface exposes four isolation levels to manage concurrent transaction anomalies:

| Isolation Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads |
|:----------------|:------------|:---------------------|:--------------|
| **`TRANSACTION_READ_UNCOMMITTED`** | Yes | Yes | Yes |
| **`TRANSACTION_READ_COMMITTED`** | **No** | Yes | Yes |
| **`TRANSACTION_REPEATABLE_READ`** | **No** | **No** | Yes |
| **`TRANSACTION_SERIALIZABLE`** | **No** | **No** | **No** |

* **Dirty Read:** Transaction A reads changes made by Transaction B before B has committed. If B rolls back, A's data is corrupted.
* **Non-Repeatable Read:** Transaction A reads a row. Transaction B updates that row and commits. Transaction A re-reads the row and gets different data.
* **Phantom Read:** Transaction A queries a range of rows. Transaction B inserts new rows in that range and commits. Transaction A re-runs the query and gets "phantom" new rows.

---

### 4. Optimistic vs. Pessimistic Locking

#### Optimistic Locking
Assumes database conflicts are rare. Does not lock database rows when reading. Instead, it uses a version or timestamp column to check if the record was modified by another transaction before updating:
```sql
-- Step 1: Read entity version
SELECT id, name, version FROM products WHERE id = 1; -- returns version = 3

-- Step 2: Attempt update checking version
UPDATE products 
SET name = 'New Name', version = 4 
WHERE id = 1 AND version = 3; -- If rows updated = 0, throw OptimisticLockException
```

#### Pessimistic Locking
Assumes conflicts are frequent. Explicitly locks rows immediately upon selection, blocking other transactions from reading/writing until the transaction commits or rolls back:
```sql
-- Locks the row immediately. Other writers wait.
SELECT * FROM products WHERE id = 1 FOR UPDATE;
```

---

## Stream API and Functional Programming

### 5. `findFirst()` vs. `findAny()` in Parallel Streams

* **`findFirst()`**: Returns the very first element in the stream's **encounter order**. In parallel streams, this is expensive because threads must coordinate and synchronize their results to guarantee they return the true first element, reducing parallel performance.
* **`findAny()`**: Returns any element found by any of the processing threads. In parallel streams, it has **no ordering constraints** — whichever thread finds a match first returns it immediately, maximizing parallel scaling.

---

### 6. Short-Circuiting Stream Operations

Short-circuiting operations limit the traversal of data, allowing streams to handle infinite sources efficiently:

* **Intermediate Short-circuiting:** `limit(n)` stops downstream processing once $n$ elements are passed.
* **Terminal Short-circuiting:** `findFirst()`, `findAny()`, `anyMatch()`, `allMatch()`, `noneMatch()` stop executing the pipeline as soon as the result is determined.

```java
// Stops after finding the first positive number (does not evaluate elements 2 to 1000)
Integer firstPositive = Stream.of(-2, -1, 5, 10, 20)
    .filter(x -> x > 0)
    .findFirst()
    .orElse(null);
```