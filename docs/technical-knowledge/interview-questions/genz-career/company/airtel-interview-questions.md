---
id: airtel-java-developer-interview-questions
title: Airtel Java Developer Interview Experience & Questions
description: A detailed collection of technical interview questions and answers from a real Airtel Java Developer interview for candidates with 3 to 5 years of experience.
tags:
  - Java
  - Spring Boot
  - Hibernate/JPA
  - ElasticSearch
  - Interview Experience
---

# Airtel Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Java Developer interview at Airtel. It includes Core Java, Multithreading, Spring Framework, Hibernate/JPA, and ElasticSearch concepts.

---

## 1. Java Collections Framework

### Q: What is the difference between `HashMap`, `LinkedHashMap`, and `TreeMap`?
**A:** * **`HashMap`:** Stores key-value pairs with absolutely no guarantee of insertion order.
* **`LinkedHashMap`:** Maintains a doubly-linked list internally, which preserves the insertion order of the elements.
* **`TreeMap`:** Stores keys in a strictly sorted (ascending) order based on natural ordering or a custom `Comparator`.

### Q: Scenario: You are designing a cache system where the order of insertion must be preserved. Later, the same system needs to support sorted keys. Which Map implementation would you choose at each stage and why?
**A:** For the first stage (preserving insertion order), we should use **`LinkedHashMap`** because it natively maintains the exact order in which entries were added. When the requirement changes to sorted keys, we can easily switch to a **`TreeMap`**, which automatically keeps all keys in a sorted order. 

### Q: What happens if you insert `null` as a key in `HashMap`, `LinkedHashMap`, and `TreeMap`?
**A:** * **`HashMap` & `LinkedHashMap`:** Both allow exactly one `null` key. They treat it like a normal key (storing it typically at bucket index 0) without throwing any errors.
* **`TreeMap`:** Does **not** allow `null` as a key if it is using natural ordering. It will throw a `NullPointerException` because it internally attempts to use the `compareTo()` method against `null`, which fails.

---

## 2. Core Java & Object-Oriented Programming

### Q: Explain the concept of Immutability. How do you make a class immutable in Java?
**A:** Immutability means an object's state cannot be changed after it is created. To make a class immutable:
1. Declare the class as `final` so it cannot be extended.
2. Make all fields `private` and `final`.
3. Do not provide any setter methods.
4. Initialize all fields via a parameterized constructor.
5. If the class contains mutable objects (like collections or dates), return deep copies (defensive copies) instead of the actual object references.

### Q: Scenario: Suppose your immutable class has a mutable field like `Date`. If you return this field in a getter, is your class still immutable?
**A:** No, the class is not fully immutable in that case. If you return a mutable field reference directly, external code can modify the object's internal state (e.g., `date.setTime()`). To maintain true immutability, you must return a **defensive copy** (a clone or a new instance) of the `Date` object in the getter.

### Q: What is the difference between `Comparable` and `Comparator`?
**A:** * **`Comparable`:** Used to define the *natural ordering* of objects. The class itself implements `Comparable` and overrides the `compareTo()` method. Only one sorting sequence is possible.
* **`Comparator`:** Used to define *custom ordering*. It is implemented in a separate class (or via lambdas) using the `compare()` method. You can create multiple comparators for different sorting logic (e.g., sort by age, sort by salary).

---

## 3. Multithreading & Concurrency

### Q: What is the `volatile` keyword and how is it used in Java?
**A:** The `volatile` keyword ensures that changes made to a variable are always visible to all threads. It prevents threads from caching the variable in CPU registers. When one thread updates a `volatile` variable, the change is written directly to main memory, ensuring other threads always read the latest value.

### Q: Can `volatile` alone guarantee thread safety when multiple threads are incrementing a counter?
**A:** No, `volatile` alone cannot guarantee thread safety for an increment operation. It ensures *visibility* but not *atomicity*. Incrementing (`count++`) involves three distinct steps (read, modify, write) which can easily be interrupted by other threads, causing race conditions.

### Q: Explain the `synchronized` keyword and how it works.
**A:** The `synchronized` keyword ensures that only one thread can execute a block of code or a method at a specific time. It does this by applying a lock on the object (or class). Other threads attempting to enter the synchronized block must wait until the executing thread releases the lock.

### Q: Scenario: In a banking app, two users access the same account concurrently. How would you use `synchronized` to ensure consistency?
**A:** To ensure consistency, you must place the `synchronized` keyword on critical methods like `deposit()` and `withdraw()`, locking on the specific Account instance. This ensures that only one transaction modifies the balance at a given time.

### Q: If a static synchronized method and an instance synchronized method are called simultaneously on the same object, will there be a conflict?
**A:** No, there won't be a conflict. A static synchronized method locks on the **Class object** (`ClassName.class`), whereas an instance synchronized method locks on the **current instance object** (`this`). Because they acquire locks on entirely different entities, they can execute concurrently without blocking each other.

---

## 4. ElasticSearch

### Q: What is ElasticSearch and how does it search internally?
**A:** ElasticSearch is a distributed search and analytics engine primarily used for full-text search. Internally, it relies on an **Inverted Index** data structure. Instead of mapping documents to words, it maps words to the documents containing them. This allows it to perform highly efficient, lightning-fast text searches and relevance scoring.

### Q: What is the default mapping type in ElasticSearch?
**A:** The default mapping type is `_doc`. Since ElasticSearch version 6.x, having multiple mapping types per index was deprecated and eventually removed. Now, a single `_doc` type is the default standard for all documents within an index.

### Q: What is the default type for Strings in ElasticSearch: `keyword` or `text`?
**A:** By default, string fields are mapped dynamically as **`text`**. The `text` type is analyzed and broken down into tokens for full-text search. If you need exact matching, aggregations, or sorting, you should use the **`keyword`** type, which stores the string exactly as-is without analyzing it.

---

## 5. Spring Boot & Architecture

### Q: What is Liquibase?
**A:** Liquibase is an open-source database schema change management tool. It functions like version control for your database, allowing developers to track, manage, and automate database schema changes (using XML, YAML, or SQL files) across different environments.

### Q: What is Dependency Injection (DI) and what types are there?
**A:** Dependency Injection is a design pattern where an object's dependencies are provided to it by an external framework (like Spring) rather than the object creating them itself. It promotes loosely coupled, testable code. The three main types are:
1. Constructor Injection (Recommended)
2. Setter Injection
3. Field Injection (Using `@Autowired` directly on fields)

### Q: How do configuration dependencies work in Spring?
**A:** Dependencies are defined in a central configuration class (often marked with `@Configuration`). By defining methods annotated with `@Bean`, you instruct the Spring container to manage the lifecycle of those objects and inject them into other components wherever needed.

---

## 6. Hibernate & JPA

### Q: What is the difference between `FetchType.LAZY` and `FetchType.EAGER` in JPA?
**A:** * **`LAZY`:** Loads related entities only when they are explicitly accessed via getter methods. This improves initial performance and saves memory. It is the default for Collection associations (`@OneToMany`, `@ManyToMany`).
* **`EAGER`:** Loads related entities immediately alongside the parent entity, which can lead to performance issues if unnecessary data is fetched. It is the default for single-entity associations (`@ManyToOne`, `@OneToOne`).

### Q: How do you optimize a slow database query?
**A:** * Use the `EXPLAIN` plan to analyze query execution.
* Add proper indexes to heavily queried columns.
* Avoid using `SELECT *` (fetch only required columns).
* Filter data early using efficient `WHERE` clauses.
* Limit the result sets.
* Optimize table joins and remove unnecessary subqueries.

### Q: What is the N+1 Select Problem and how do you solve it?
**A:** The N+1 problem occurs when an ORM (like Hibernate) executes 1 query to retrieve a list of *N* parent entities, and then executes *N* additional queries to fetch the related child entities for each parent. 
**Solution:** It can be solved by using **Fetch Joins** (e.g., `JOIN FETCH` in JPQL) or **Entity Graphs** to fetch the parent and child entities simultaneously in a single query.

### Q: How do you perform pagination and sorting in Spring Data JPA?
**A:** Spring Data JPA makes this easy using the `Pageable` and `Sort` interfaces. You pass a `PageRequest.of(pageNumber, pageSize, Sort.by("fieldName"))` object to your repository method. The repository will return a `Page<T>` object containing the paginated data and metadata (like total pages).

### Q: How do transactions work in Spring?
**A:** Transactions in Spring are managed declaratively using the `@Transactional` annotation. When a method is annotated, Spring wraps it in a database transaction proxy. It automatically commits the transaction if the method completes successfully, and automatically triggers a rollback if a RuntimeException is thrown, guaranteeing data consistency and atomicity.

### Q: How do you connect two tables in Hibernate? (Give annotations)
**A:** Tables are connected by mapping entity relationships using the following annotations:
* `@OneToOne`
* `@OneToMany`
* `@ManyToOne`
* `@ManyToMany`
(Often paired with `@JoinColumn` to specify the foreign key column mapping the two tables).