---
id: infosys-java-developer-interview-17lpa
title: Infosys Java Developer Interview Experience & Questions [17 LPA]
description: A detailed collection of real interview questions and answers from an Infosys Java Developer interview. Ideal for candidates with ~3 years of experience, covering Java 8, Multithreading, Garbage Collection, Spring Boot, and Microservices.
tags:
  - Java
  - Spring Boot
  - Multithreading
  - Microservices
  - Interview Experience
  - Infosys
---

# Infosys Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an Infosys Java Developer interview. The candidate had 3.2 years of experience. The interview covered a wide range of topics including deep Java 8 concepts, Multithreading, Garbage Collection tuning, Spring Boot internals, REST API design, and Microservices resilience.

---

## 1. Core Java & Java 8 Features

### Q: What are functional interfaces in Java?
**A:** Functional interfaces are interfaces that contain exactly **one abstract method**. They are used as the basis for Lambda expressions and Method References in Java, enabling developers to write highly concise, functional-style code.

### Q: If designing a custom operation to be passed to multiple utility methods, how can a functional interface help and how would you use a lambda here?
**A:** A functional interface helps by allowing us to pass *behavior* as a parameter (like passing a function into a method). Instead of creating a whole new implementation class for each custom operation, we simply define the parameter type as a Functional Interface. When calling the utility method, we can use a Lambda expression to write that specific behavior instantly in one short line.

### Q: Explain the role of `Predicate`, `Function`, and `Consumer` in Java.
**A:** * **`Predicate<T>`:** Takes an input, tests a specific condition, and returns a `boolean`. (Used heavily in Stream `.filter()`).
* **`Function<T, R>`:** Takes an input of type T, transforms or computes it, and returns a result of type R. (Used heavily in Stream `.map()`).
* **`Consumer<T>`:** Takes an input and performs an action (like printing or modifying the object) but returns absolutely nothing (`void`). (Used heavily in Stream `.forEach()`).

### Q: What are transient fields in Java? If marked as transient in a serializable class, what happens during deserialization and how do you restore it?
**A:** Fields marked with the `transient` keyword are ignored by the JVM during the Object Serialization process; they are not saved to the byte stream. This is used to prevent saving sensitive data (like passwords) or temporary, easily recalculated data to save space.
* **Deserialization:** When the object is deserialized, the transient field is not restored and is assigned its default value (e.g., `null` for objects, `0` for primitives). 
* **Restoration:** You can restore or reinitialize them manually by defining a `private void readObject(ObjectInputStream ois)` method in your class to provide custom post-deserialization logic.

---

## 2. Multithreading & Garbage Collection

### Q: What are the different states of a thread in Java?
**A:** A Java thread transitions through the following lifecycle states:
1. **New:** Created but not yet started.
2. **Runnable:** `start()` has been called, waiting for CPU execution time.
3. **Running:** Currently executing on the CPU.
4. **Blocked:** Waiting to acquire a monitor lock to enter a `synchronized` block.
5. **Waiting / Timed Waiting:** Paused temporarily (via `wait()`, `join()`, or `sleep()`).
6. **Terminated:** Finished executing its `run()` method.

### Q: If you are writing to a file from multiple threads simultaneously, what synchronization techniques can you apply to ensure thread-safe behavior?
**A:** To ensure thread-safe file writing and prevent data corruption, we must use locking mechanisms. We can use a standard **`synchronized`** block locking on a shared file-writer object, or we can use a **`ReentrantLock`** from the `java.util.concurrent.locks` package to ensure only one single thread writes to the file at any given time.

### Q: What is a deadlock and how can you avoid it?
**A:** A deadlock occurs when two or more threads are blocked forever, each waiting for a lock on a resource that the other thread is currently holding.
**How to avoid:**
1. Always acquire multiple locks in a strict, fixed global order.
2. Use `tryLock()` with a timeout instead of blocking indefinitely.
3. Minimize the scope and size of `synchronized` blocks.

### Q: What is a race condition and how can it be prevented?
**A:** A race condition occurs when multiple threads read, modify, and write shared data concurrently, and the final outcome depends on the unpredictable timing of the OS thread scheduler, causing incorrect results. It is prevented by using `synchronized` blocks/locks to enforce mutual exclusion, or by using atomic classes (like `AtomicInteger`) that perform operations in a single, unbreakable hardware step.

### Q: How does Garbage Collection (GC) work in Java?
**A:** The Garbage Collector is a daemon thread that automatically manages memory in the Java Heap. It periodically identifies "unreachable" objects (objects that no active part of the application holds a reference to) and reclaims their memory to prevent Memory Leaks and `OutOfMemoryError`s. Common GC implementations include the Serial, Parallel, CMS, and G1 Garbage Collectors.

### Q: If you notice GC is taking up significant time in production, how would you analyze logs and tune the JVM?
**A:** First, I would enable GC logging using JVM flags (like `-Xlog:gc*` in modern Java) to capture pause times and memory generation sizes. I would analyze these logs using tools like **GCViewer** or **VisualVM**.
To tune it, I might:
* Adjust the overall heap size (`-Xms` and `-Xmx`).
* Tweak the ratio between the Young and Old generations.
* Switch to a more concurrent algorithm like the **G1GC** or **ZGC** to minimize "Stop-The-World" pause times if latency is the primary issue.

---

## 3. Spring Boot Core & Configuration

### Q: What is the difference between eager and lazy initialization in Spring?
**A:** * **Eager Initialization (Default):** Spring creates and configures all Singleton beans immediately at application startup. This makes startup slower but ensures errors are caught immediately.
* **Lazy Initialization:** Spring delays the creation of the bean until the exact moment it is first requested by the application. This drastically improves startup performance and saves memory, but defers configuration errors until runtime.

### Q: In a large application, startup time is slow. How would you optimize bean loading using lazy initialization?
**A:** I would enable lazy initialization globally by adding `spring.main.lazy-initialization=true` to the `application.properties` file. This speeds up the startup process significantly by only instantiating the beans strictly necessary for the application context to start, deferring heavy, non-critical beans until they are actually used.

### Q: How is the `@Bean` annotation different from the `@Component` annotation?
**A:** * **`@Component`:** A class-level annotation. It tells Spring to automatically detect the class during classpath scanning and instantiate it as a bean. Requires less configuration.
* **`@Bean`:** A method-level annotation used strictly inside `@Configuration` classes. It is used to manually instantiate and configure an object before returning it to the Spring container. It gives the developer full programmatic control over the creation process.

### Q: If you have a third-party class you cannot annotate with `@Component`, how can you register it as a bean?
**A:** You use the **`@Bean`** annotation. You create a `@Configuration` class and write a method that instantiates the third-party class using the `new` keyword, configures it, and returns it. Spring will then manage that returned instance as a bean, completely bypassing the need to modify the closed third-party source code.

### Q: What is the role of `@Value` and `@ConfigurationProperties` in Spring Boot?
**A:** * **`@Value("${property.name}")`:** Injects a single, specific property value directly from `application.properties` into a field.
* **`@ConfigurationProperties(prefix="app.config")`:** Binds an entire group of hierarchically related properties into a strongly typed POJO. This promotes cleaner, safer, and highly maintainable configuration management compared to scattering `@Value` annotations everywhere.

---

## 4. REST API Design & Error Handling

### Q: What are DTOs (Data Transfer Objects) and why are they used?
**A:** DTOs are simple POJOs used to transfer data between architectural layers (e.g., between the Service and the Web Controller). They reduce coupling, carry only the fields required for that specific API call (saving bandwidth), and act as a buffer to prevent exposing sensitive internal database entity structures to the outside world.

### Q: If your controller exposes Entity objects directly to the clients, what risk does this have?
**A:** Exposing JPA Entities directly risks leaking highly sensitive database fields (like passwords, audit columns, or internal IDs). It also creates massive tight coupling; if you rename a database column or alter the Entity, you instantly break the public API contract for all consuming clients. DTOs completely solve this issue.

### Q: How does exception handling work in Spring Boot REST APIs? How do you implement it centrally?
**A:** Spring Boot handles exceptions cleanly using the **`@RestControllerAdvice`** and **`@ExceptionHandler`** annotations. 
* **Implementation:** You create a global configuration class annotated with `@RestControllerAdvice`. Inside, you write methods annotated with `@ExceptionHandler(CustomException.class)`. When an exception is thrown anywhere in a controller, Spring intercepts it here. You then construct a meaningful, standardized custom error JSON object (containing a message, timestamp, and HTTP status code) and return it wrapped in a `ResponseEntity`.

### Q: What is HATEOAS in REST?
**A:** HATEOAS stands for **Hypermedia as the Engine of Application State**. It enhances standard REST responses by embedding hypermedia links within the JSON payload. These links dynamically guide the client on what "next actions" are available based on the current state of the resource, making the API self-descriptive and reducing the client's reliance on hardcoded endpoint URLs.

### Q: What is the difference between `@RequestParam`, `@PathVariable`, and `@RequestBody`?
**A:** * **`@RequestParam`:** Extracts values from the URL query string (e.g., `?role=admin`).
* **`@PathVariable`:** Captures dynamic values directly integrated into the URL path itself (e.g., `/users/{id}`).
* **`@RequestBody`:** Deserializes the entire incoming HTTP request payload (usually a JSON string) and binds it to a complex Java object.

### Q: How do you handle pagination in Spring Data JPA?
**A:** Pagination is implemented using the `Pageable` and `Page` interfaces. You instantiate a `PageRequest.of(pageNumber, pageSize)` and pass it into a repository method (e.g., `repository.findAll(pageable)`). Spring Data automatically applies the SQL `LIMIT` and `OFFSET` clauses, returning a `Page` object containing the specific data chunk alongside metadata like total pages and total elements.

---

## 5. Microservices Resilience

### Q: What is the Circuit Breaker pattern? Have you used Resilience4j or Hystrix?
**A:** The Circuit Breaker pattern prevents cascading failures in microservice architectures by temporarily halting calls to a downstream service that is continuously failing or timing out. 
Tools like **Resilience4j** monitor the failure rate. If it breaches a threshold, the circuit "opens" and immediately rejects requests (returning a predefined Fallback response). It periodically allows a few requests through (half-open) to test if the service has recovered, and "closes" the circuit to resume normal traffic if healthy.

### Q: If your API depends on an external service that occasionally fails, what will you do?
**A:** I would implement a Circuit Breaker using Resilience4j. This ensures that when the external service goes down, our system doesn't exhaust all of its threads waiting for timeouts. The circuit opens, our system gracefully returns a cached or fallback response to the user immediately, and the external service is given time to recover without being hammered by continuous retry requests.

---

## 6. Coding Questions
*The candidate was asked to solve the following algorithmic problems:*
1. **Stream API Sum:** Write a Java 8 program to find the sum of all elements in a `List<Integer>` using the Stream API.
2. **First Non-Repeating Element:** Write a program to find and print the first non-repeating number from a List using the Stream API.