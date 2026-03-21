---
id: coforge-java-developer-interview-22lpa
title: Coforge Java Developer Interview Experience & Questions [22 LPA+]
description: A detailed collection of real interview questions and answers from a Coforge Java Developer interview. Ideal for candidates with ~3 years of experience, covering Java 8 Streams, Multithreading, Collections, Serialization, and Spring Boot.
tags:
  - Java
  - Spring Boot
  - Multithreading
  - Stream API
  - Interview Experience
  - Coforge
---

# Coforge Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Coforge Java Developer interview. The candidate had 3.2 years of experience. The technical rounds focused deeply on Java 8 Stream exception handling, Concurrency (Executors), Collections, Serialization, and Spring Boot API design.

---

## 1. Java 8 Streams & Exception Handling

### Q: Have you worked on Streams? How would you handle an exception inside a Stream pipeline and prevent it from breaking the execution?
**A:** Yes. To handle exceptions in a Stream pipeline without breaking it, you cannot simply throw a checked exception directly from a lambda expression. Instead, you should:
1. Wrap the risky code inside a `try-catch` block directly within the lambda expression.
2. Better yet, create a separate **Wrapper/Helper Method** that contains the `try-catch` block. This method can catch the exception, log it, and return a default value or an `Optional.empty()`. 
This allows the stream to continue processing the remaining elements uninterrupted.

---

## 2. Concurrency & Multithreading

### Q: If two threads access and modify the same shared resource simultaneously, what steps would you take to avoid a race condition? Give a real-world example.
**A:** **Steps to avoid:** Use synchronization techniques such as `synchronized` blocks, `ReentrantLock` (from `java.util.concurrent.locks`), or use `Atomic` variables (like `AtomicInteger`). These mechanisms ensure that only one thread can modify the shared data at a time, maintaining consistency.
**Real-World Example:** An online banking system where two different ATM processes (threads) try to update a user's account balance at the exact same time. Without synchronization, one thread might overwrite the other's update, leading to an incorrect final balance.

### Q: Explain what an `Executor` is.
**A:** An `Executor` (and `ExecutorService`) is a high-level framework in Java used to manage and execute threads efficiently. Instead of manually creating new threads for every task (which is resource-heavy), the Executor utilizes a **Thread Pool**. It reuses existing threads to execute multiple tasks, significantly improving performance, scalability, and resource utilization.

### Q: If you are using an `ExecutorService`, how would you handle a scenario where a task's execution time exceeds the expected limit, and how do you stop the threads?
**A:** When submitting a task, the `ExecutorService` returns a `Future` object. 
* To set a time limit, use **`future.get(timeout, TimeUnit)`**. 
* If the task exceeds the time, it throws a `TimeoutException`. Inside the `catch` block, you can call **`future.cancel(true)`** to interrupt and safely stop the runaway thread.
* To shut down the entire executor and stop all threads, you use `executorService.shutdown()` (waits for running tasks to finish) or `executorService.shutdownNow()` (attempts to interrupt all running tasks immediately).

---

## 3. Collections Framework

### Q: What is the difference between `HashMap` and `Hashtable`?
**A:** * **`Hashtable`:** A legacy class that is synchronized (thread-safe) but inherently slower due to locking. It does **not** allow any `null` keys or `null` values.
* **`HashMap`:** Not synchronized (not thread-safe), making it much faster in single-threaded environments. It allows exactly one `null` key and multiple `null` values.

### Q: Since `HashMap` is not synchronized, what issues might arise in a multi-threaded environment, and how would you address them?
**A:** **Issues:** Concurrent modifications can cause severe data inconsistency. In older versions of Java (pre-Java 8), resizing the `HashMap` concurrently could even cause an **infinite loop** during the rehashing process, crashing the CPU.
**Solution:** Do not use `HashMap` in concurrent environments. Instead, use **`ConcurrentHashMap`** (which uses fine-grained segment/bucket locking for high performance) or wrap the map using `Collections.synchronizedMap(new HashMap<>())`.

### Q: What is the initial size of a `Hashtable` and `HashMap`, and what is the importance of the Load Factor?
**A:** * The default initial capacity is **11** for `Hashtable` and **16** for `HashMap`.
* The default **Load Factor** is **0.75**. 
* **Importance:** The load factor dictates when the collection should dynamically resize (rehash). At 0.75, when the map is 75% full, it doubles its capacity. This balances memory usage and lookup performance. A lower load factor reduces collisions (faster lookups) but consumes more RAM.

---

## 4. Serialization & Core Java Concepts

### Q: What is Serialization and why do we need it?
**A:** Serialization is the process of converting a Java object's state into a byte stream. Deserialization restores it back into a living object. 
**Need:** It is required to save the state of an object to a file, database, or to transfer objects across a network in distributed applications (e.g., sending user sessions between microservices or caching data).

### Q: What happens when you try to serialize an object that contains non-serializable fields? How do you handle it?
**A:** If an object contains a reference to a field that does not implement the `Serializable` interface, Java will throw a **`NotSerializableException`**.
**Handling:** You can mark those specific fields with the **`transient`** keyword. This instructs the JVM to completely ignore that field during the serialization process.

### Q: Are Strings immutable in Java? What happens under the hood when concatenating `str1 + str2`?
**A:** Yes, Strings are strictly immutable to ensure security, thread-safety, and to enable the String Pool.
**Under the hood:** When you concatenate `str1 + str2`, the original strings are not altered. Instead, Java internally creates a `StringBuilder` (or utilizes `StringConcatFactory` in newer Java versions), appends both strings, and returns a completely new `String` object, leaving the original objects unchanged in memory.

### Q: In a multi-threaded application, how would you choose between `StringBuilder` and `StringBuffer`?
**A:** * **`StringBuffer`:** Use this in multi-threaded applications because all of its methods are `synchronized`, making it completely thread-safe but slightly slower.
* **`StringBuilder`:** Use this strictly in single-threaded scenarios (like building a string inside a local method). It is not synchronized, making it significantly faster.

### Q: Can you think of a situation where Polymorphism might lead to an issue (e.g., with overridden methods)? How do you resolve it?
**A:** An issue occurs if a subclass heavily alters the expected logic of the parent class, fundamentally breaking client expectations. For example, if a `Bird` class has a `fly()` method, and a `Penguin` subclass overrides it to throw an exception because penguins can't fly. 
**Resolution:** This violates the **Liskov Substitution Principle (LSP)**. To resolve it, refactor the inheritance hierarchy (e.g., create a `FlyingBird` interface) so the overridden methods always maintain the parent's contract.

---

## 5. Spring Boot & Microservices

### Q: What is the default server in Spring Boot? How do you change it to Jetty and what impact does that have?
**A:** The default embedded server is **Apache Tomcat**.
To switch to Jetty, you must exclude `spring-boot-starter-tomcat` from the `spring-boot-starter-web` dependency block in your `pom.xml`, and explicitly add the `spring-boot-starter-jetty` dependency.
**Impact:** Jetty is known for its highly scalable architecture and smaller memory footprint, making it slightly better optimized for heavily asynchronous, high-concurrency workloads.

### Q: Imagine you have two Beans of the same type but need to inject a specific one based on a runtime condition. How would you achieve this?
**A:** Standard annotations like `@Primary` or `@Qualifier` determine injection at *startup*. If the decision must happen dynamically at *runtime* based on conditional logic (e.g., a specific user type), you should:
1. Inject all beans of that type as a Map (`@Autowired Map<String, MyInterface> beans`). You can then use your runtime condition string as a key to pull the exact bean you need.
2. Alternatively, create a Custom Factory or Service Locator class to handle the conditional retrieval logic.

### Q: Explain the difference between One-to-Many and Many-to-One relationships in JPA with a real-world example.
**A:** * **One-to-Many:** One parent entity relates to multiple child entities. *Example:* One `Customer` has Many `Orders`.
* **Many-to-One:** Multiple child entities link to a single parent entity. *Example:* Many `Employees` belong to One `Department`. Both are often used together to create a bidirectional relationship.

### Q: If you are building a REST API, what strategies would you use to version the API?
**A:** API versioning is crucial to prevent breaking changes for existing clients. Common strategies include:
1. **URI Versioning:** Embedding the version in the URL path (`/api/v1/users`).
2. **Request Parameter Versioning:** Appending it as a query parameter (`/api/users?version=1`).
3. **Custom Headers:** Sending a specific HTTP header (`X-API-Version: 1`).
4. **Content Negotiation (Media Type):** Specifying the version in the standard `Accept` header (`Accept: application/vnd.company.v1+json`).

---

## 6. Coding Questions
*The candidate was asked to solve the following algorithmic problems using Java 8:*
1. **Stream API Grouping/Sorting:** Create a `Student` class (ID, Name, Marks). Write a program using the Stream API to sort a `List<Student>` by their marks in descending order.
2. **Stream API Filtering:** Given a `List<String>`, write a stream pipeline to filter out and print only the strings that are Palindromes.