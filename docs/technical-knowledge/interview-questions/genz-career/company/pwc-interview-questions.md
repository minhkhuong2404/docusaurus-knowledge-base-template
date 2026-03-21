---
id: pwc-java-developer-interview-questions
title: PwC Java Developer Interview Experience & Questions [15 LPA+]
description: A comprehensive list of technical interview questions and answers from a real PwC Java Developer interview for a candidate with 3 years of experience. Covers Concurrency, Spring Boot, Microservices, and Database Locking.
tags:
  - Java
  - Spring Boot
  - Concurrency
  - Microservices
  - Interview Experience
  - PwC
---

# PwC Java Developer Interview Questions & Answers

This guide contains detailed technical questions and answers extracted from a real PwC Java Developer interview. The interview was aimed at a candidate with 3 years of experience and heavily focused on Java concurrency, Spring Boot internals, database locking strategies for banking, and microservices architecture.

---

## 1. Java Concurrency & Multithreading

### Q: How is concurrency achieved in Java and why is there a need for it?
**A:** Concurrency in Java is achieved using `Thread`s, the `Executor` framework, synchronization blocks/methods, `Lock`s, and concurrent collections (like `ConcurrentHashMap`). It allows multiple tasks to execute simultaneously. 
**Need:** It is required to drastically improve performance, ensure better CPU utilization, deliver faster response times, and handle multiple concurrent users efficiently in real-time applications.

### Q: How can we return or handle results for asynchronous processes?
**A:** In Java, we handle asynchronous results using `Future` and `CompletableFuture`. 
* **`Future`:** Allows us to retrieve results later by calling the `.get()` method. However, this method blocks the main thread until the result is ready.
* **`CompletableFuture`:** A more advanced, non-blocking alternative. It supports callbacks, chaining multiple asynchronous tasks, and robust exception handling without ever blocking the main execution thread.

### Q: What is the `supplyAsync` method in `CompletableFuture`?
**A:** The `CompletableFuture.supplyAsync()` method is used when we want to run a task asynchronously that **returns a result**. It accepts a `Supplier` functional interface, executes its logic in a separate background thread (usually via the ForkJoin pool), and eventually provides the result without blocking the caller.

### Q: How is `CompletableFuture` different from `Future`, and which should be preferred in a Spring Boot environment?
**A:** `Future` is limited because retrieving its data is a blocking operation, defeating the purpose of high-throughput async processing. `CompletableFuture` is far more powerful, supporting non-blocking callbacks (`thenApply`, `thenAccept`) and complex task chaining. 
In a Spring Boot environment, **`CompletableFuture` is strongly preferred** because it improves performance, maximizes thread scalability, and allows for clean, non-blocking asynchronous processing.

### Q: How can we avoid deadlocks? Between Atomic variables and the `volatile` keyword, which should be preferred and why?
**A:** * **Avoiding Deadlocks:** Maintain a strict, uniform lock ordering across all threads, minimize the size of synchronized blocks, use `tryLock()` with timeouts instead of indefinite waiting, and avoid nested locks.
* **Atomic vs. Volatile:** **Atomic variables** (like `AtomicInteger`) are strongly preferred. While `volatile` only ensures memory visibility (preventing thread caching), it does *not* guarantee atomicity. Atomic variables use CAS (Compare-And-Swap) hardware instructions to guarantee completely thread-safe, atomic operations without requiring heavy synchronization locks.

### Q: What are `CountDownLatch` and `CyclicBarrier`, and how do they differ?
**A:** Both are synchronization aids.
* **`CountDownLatch`:** Allows one or more threads to wait until a set of operations being performed by other threads completes. Crucially, a latch **cannot be reused** once its count reaches zero.
* **`CyclicBarrier`:** Allows a set number of threads to wait for each other to reach a common barrier point before continuing. Unlike the latch, the barrier **can be reused** multiple times after the waiting threads are released.

### Q: Does `CyclicBarrier` reuse threads, making it the same as a thread pool?
**A:** No, they are entirely different. `CyclicBarrier` is merely a synchronization checkpoint; it blocks threads until everyone arrives, but it does not manage or execute them. A **Thread Pool** (via `ExecutorService`) actively creates, manages, reuses, and schedules threads to execute tasks.

---

## 2. Spring Boot & Design Patterns

### Q: Explain a few essential annotations used in Spring Boot.
**A:** * **`@SpringBootApplication`:** The core annotation that starts the app, enabling auto-configuration and component scanning.
* **`@RestController`:** Exposes RESTful APIs and automatically serializes returned objects into JSON.
* **`@Autowired`:** Instructs Spring to automatically inject necessary dependencies.
* **`@RequestMapping` (or `@GetMapping`/`@PostMapping`):** Maps HTTP request URLs to specific controller methods.
* **`@Component`:** A generic marker that tells Spring to instantiate the class as a Bean in the application context.

### Q: How would you implement Lazy Initialization in Spring Boot?
**A:** Lazy initialization means delaying the creation of a Spring Bean until it is actually requested, rather than creating it at startup. 
* **Implementation:** You can use the **`@Lazy`** annotation on a specific Bean or injection point. To enable it globally across the entire application, you set `spring.main.lazy-initialization=true` in the `application.properties` file. This vastly improves application startup time and reduces initial memory usage.

### Q: What is the Singleton design pattern?
**A:** The Singleton pattern restricts the instantiation of a class to exactly **one single instance** across the entire application lifecycle. It is used when a shared, unified resource is needed—such as configuration managers, database connection pools, or logging classes. It provides a global point of access while strictly controlling object creation.

---

## 3. Database Locking & Collections

### Q: Explain the internal working of a `HashMap`.
**A:** A `HashMap` stores key-value pairs in an array of "buckets". When you insert an entry, it calculates the key's hash code to determine the exact bucket index. If multiple keys map to the exact same bucket (a hash collision), the entries are stored as a Linked List within that bucket. To optimize performance, if the linked list grows too large (usually past 8 elements), Java automatically converts it into a balanced Red-Black tree to maintain fast $O(\log n)$ lookups.

### Q: Differentiate between a `BlockingQueue` and a `DelayQueue`.
**A:** * **`BlockingQueue`:** Used primarily for Producer-Consumer patterns. If the queue is full, the producer thread blocks (waits); if the queue is empty, the consumer thread blocks until data is available.
* **`DelayQueue`:** A specialized type of `BlockingQueue`. Elements placed inside it can only be consumed *after* a specific, defined delay has expired. It is highly useful for scheduling tasks or timeout management.

### Q: Since you work in a banking project, which type of locking system should you generally use?
**A:** In a banking application, we strictly use **Pessimistic Locking** to maintain absolute data consistency. It physically locks the database record during critical transactions (like a money transfer). This prevents any other concurrent transaction from reading or modifying that exact same data until the lock is released, entirely avoiding race conditions like "double spending."

### Q: Why can't we use Optimistic Locking in a banking app? Will it work?
**A:** Technically, it can work, but it is generally avoided for critical financial updates. Optimistic Locking does not physically lock the row; it allows multiple users to read the data and only checks for conflicts (using a version column) at the exact moment of the `UPDATE`. In high-transaction banking environments, this leads to frequent conflicts, causing numerous transaction failures, forced rollbacks, and the need for complex retry logic, which degrades the user experience.

---

## 4. Java 8 Streams & Functional Interfaces

### Q: Are Streams and Parallel Streams the same? Give a use case for Parallel Streams.
**A:** No, they are not the same. Standard Streams process data sequentially on a single thread. Parallel Streams utilize the ForkJoin framework to divide the data into chunks and process them concurrently across multiple CPU threads.
* **Use Case:** Parallel Streams should be used for processing massive datasets (e.g., crunching numbers, filtering, or calculating aggregates across millions of records) where dividing the CPU workload drastically reduces processing time.

### Q: What is a Functional Interface? Is `Predicate` one?
**A:** A Functional Interface is an interface that contains **exactly one abstract method**, primarily used to support Lambda expressions. It can optionally contain multiple `default` or `static` methods.
Yes, **`Predicate`** is a functional interface.

### Q: What is the difference between `Predicate` and `Consumer`?
**A:** * **`Predicate<T>`:** Takes an input, evaluates a condition, and returns a **boolean**. It is heavily used for filtering data.
* **`Consumer<T>`:** Takes an input and performs an action (like printing to the console or modifying the object) but returns **void** (nothing).

### Q: What is a `Comparator`, where is it used, and how does it differ from `Comparable`?
**A:** * **`Comparator`:** An external interface used to define *custom* sorting logic. It allows you to sort objects in multiple different ways (e.g., by age, then by salary) without modifying the original class code.
* **`Comparable`:** An internal interface. The class itself implements it to define its single, fixed "natural" sorting order.

---

## 5. Microservices & Security

### Q: Mention some design patterns used in Microservices.
**A:** Common patterns include: API Gateway, Circuit Breaker, Service Discovery (Registry), Centralized Configuration Server, and the Saga Pattern (for distributed transactions).

### Q: How can we implement JWT, and how does it differ from OAuth2?
**A:** * **JWT Implementation:** After a user successfully logs in, the server generates a signed JSON Web Token and returns it. The client includes this token in the HTTP Authorization header for subsequent requests. A Spring Security filter intercepts the request, validates the token's signature, and grants access without querying a database.
* **Difference:** **JWT** is simply a *token format* used to securely transmit information statelessly. **OAuth2** is a complete *authorization framework/protocol* that defines specific flows (like Authorization Code Grant) dictating exactly how tokens (which are often JWTs) are securely requested, issued, and used to grant delegated access.

### Q: What are Idempotent keys? Do we send them in headers? How do they differ from a UUID?
**A:** **Idempotent keys** guarantee that a specific API request (like submitting a payment) is processed exactly *once*, even if a network glitch causes the client to retry the request multiple times.
* Yes, they are typically generated by the client and sent in the HTTP Request Headers (e.g., from Postman or a frontend app).
* **Difference:** A UUID is simply a randomly generated string. An Idempotent Key is a UUID that is specifically tied to server-side **business logic**. The server stores the key and checks it; if a duplicate key arrives, the server bypasses execution and returns the cached success response.