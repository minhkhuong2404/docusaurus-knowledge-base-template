---
id: wipro-java-developer-interview-questions
title: Wipro Java Developer Interview Experience & Questions [Client and Technical Round]
description: A comprehensive list of technical interview questions and answers from a real Wipro and ICICI Bank client interview for a Java Developer (3-4 years experience).
tags:
  - Java
  - Spring Boot
  - Microservices
  - SQL
  - Interview Experience
  - Wipro
---

# Wipro Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Wipro Java Developer interview. The candidate had 3 to 4 years of experience. The process consisted of two rounds: an initial technical round by Wipro, and a subsequent client technical round by ICICI Bank.

---

## Round 1: Wipro Technical Round

### Q: What is a memory leak and what are the steps to avoid it?
**A:** A memory leak occurs when objects stay in the heap memory even when they are no longer needed by the application, preventing the Garbage Collector from removing them. Over time, the memory keeps filling up, causing the application to slow down or crash with an `OutOfMemoryError`.
**How to avoid:**
* Always close resources (like DB connections, streams) using `try-with-resources`.
* Remove unused object references.
* Avoid the unnecessary or prolonged use of `static` variables, as they live for the entire application lifecycle.
* Utilize `WeakReference` for caching.
* Monitor memory actively using profiling tools (like VisualVM or Splunk).

### Q: Explain the key features introduced in Java 8.
**A:** Java 8 introduced powerful features for functional programming and cleaner code:
* **Lambda Expressions:** To write concise, anonymous functions.
* **Stream API:** For functional-style, highly efficient processing of collections.
* **Functional Interfaces:** Interfaces with exactly one abstract method (like `Runnable`, `Predicate`).
* **Default & Static Methods:** Allowed adding methods with implementations inside interfaces without breaking backward compatibility.
* **`Optional` Class:** To handle potential null values gracefully and avoid `NullPointerException`.
* **New Date/Time API (`java.time`):** A thread-safe and comprehensive API for date handling.

### Q: What are the pros and cons of using the Stream API?
**A:** * **Pros:** Makes code cleaner and highly readable. It processes collections efficiently using chained operations like `filter()`, `map()`, and `reduce()`. It also easily supports multithreading via parallel streams.
* **Cons:** It can actually be slower than traditional loops for very small datasets due to the overhead of stream creation. Overusing complex, nested stream chains can make the code harder to debug and understand.

### Q: Explain the life cycle of a Thread in Java.
**A:** A thread transitions through several distinct states:
1. **New:** The thread object is created, but `start()` has not been called.
2. **Runnable:** The `start()` method is called; the thread is ready and waiting for CPU time.
3. **Running:** The CPU scheduler selects the thread and it begins executing its `run()` method.
4. **Blocked / Waiting / Timed Waiting:** The thread is temporarily halted (e.g., waiting for a lock, calling `wait()`, or `sleep()`).
5. **Terminated:** The thread has completely finished executing its task.

### Q: Explain the use of the `volatile` keyword.
**A:** The `volatile` keyword is used in multi-threading to ensure the visibility of shared variables. When a variable is marked as `volatile`, every thread reads its latest value directly from the main memory, completely bypassing local CPU caches. This prevents data inconsistency. **Note:** It guarantees visibility, but it does *not* provide atomicity (it doesn't solve race conditions for compound operations like `count++`).

### Q: Which OOP concept is heavily used in Lambda Expressions?
**A:** **Abstraction**. Lambda expressions allow us to focus purely on *what* the code should do, rather than *how* the underlying object is structured. By utilizing Functional Interfaces, we can write concise behavior-driven code, effectively hiding the implementation details and boilerplate class structures.

### Q: How did you implement JWT (JSON Web Token) authentication?
**A:** Upon a successful user login (validating username and password), the backend generates a signed JWT and returns it to the client. For every subsequent request, the client includes this token in the HTTP `Authorization` header. A Spring Security filter intercepts the request, validates the token's signature, checks expiration, extracts the user details, and grants access. If the token is invalid, the request is immediately rejected.

### Q: What is Microservices Architecture?
**A:** It is an architectural style where a large, monolithic application is broken down into small, independent, and loosely coupled services. Each service handles one specific business feature, owns its own database, and can be developed, deployed, and scaled independently. They communicate using lightweight protocols like HTTP REST or message queues. It improves flexibility but requires robust monitoring and distributed management.

### Q: What is a Feign Client?
**A:** OpenFeign is a declarative web service client used in Spring Cloud microservices. Instead of writing verbose and repetitive `RestTemplate` code to call other microservices, you simply create an interface and annotate it. Feign automatically handles the HTTP calls, URL mapping, and JSON serialization/deserialization under the hood, making service-to-service communication much cleaner.

### Q: What is an index in a database? Provide its pros and cons.
**A:** An index is a special data structure (usually a B-Tree or Hash) that operates like the index at the back of a book. It helps the database locate data quickly without scanning every single row in a table.
* **Pros:** Drastically speeds up `SELECT` data retrieval queries.
* **Cons:** Consumes additional disk storage. It also slows down write operations (`INSERT`, `UPDATE`, `DELETE`) because the index must be updated every time the table data changes.

### Q: Explain the difference between a Stored Procedure and a Function.
**A:** * **Stored Procedure:** A precompiled, reusable set of SQL instructions that performs actions (like inserting or updating records). It does not always have to return a value, and it *cannot* be called directly from inside a standard `SELECT` statement.
* **Function:** Primarily used to perform calculations and *must* return a single value (or a table). Functions can easily be embedded and called directly inside `SELECT` queries.

---

## Round 2: Client Round (ICICI Bank)

### Q: What is Serialization?
**A:** Serialization is the process of converting a Java object's state into a continuous byte stream. This allows the object to be easily saved to a file, transmitted over a network, or stored in a database. Deserialization is the reverse process, recreating the object from the byte stream.

### Q: What is the `@Transient` annotation used for?
**A:** In JPA/Hibernate, the `@Transient` annotation marks a specific field in an Entity class that should **not** be mapped or saved to the database table. It tells the ORM to completely ignore the field during persistence. It is typically used for temporary, calculated, or derived values that only live in the application's memory.

### Q: What does the `@Transactional` annotation do?
**A:** It is used to manage database transactions automatically. It ensures that all database operations inside a method execute as a single, atomic unit. If everything succeeds, the changes are committed to the database. If any runtime exception is thrown during the method's execution, the entire transaction automatically rolls back, keeping the data perfectly consistent.

### Q: Explain the difference between a `synchronized` block and a `Lock`.
**A:** * **`synchronized` Block:** A built-in, intrinsic way to lock a resource. It is simple to use and automatically releases the lock when the thread exits the block, but it lacks advanced flexibility.
* **`Lock` Interface (e.g., `ReentrantLock`):** Found in `java.util.concurrent.locks`. It provides much finer control, offering features like `tryLock()` (to avoid blocking indefinitely), fairness policies, and interruptible locks. However, you must manually release the lock, typically inside a `finally` block.

### Q: What are implicit objects in JSP?
**A:** Implicit objects are built-in Java objects automatically provided by the web container (like Tomcat) to JavaServer Pages (JSP). Developers can use them directly in JSP scripts without explicitly declaring them. Examples include `request`, `response`, `session`, `out`, and `application`.

### Q: Explain the difference between an Interceptor and a Filter.
**A:** * **Filter:** Operates at the lower Web/Servlet layer *before* a request even reaches the Spring DispatcherServlet. It is used for broad, request-level tasks like logging, CORS, early authentication, and modifying HTTP headers.
* **Interceptor:** Operates higher up at the Spring MVC layer. It intercepts requests specifically routing to Spring Controllers, allowing for pre-processing and post-processing specifically tailored to controller methods and model views.

### Q: If Spring Initializr is down, how will you create a Spring Boot project manually?
**A:** I would create a standard Maven or Gradle project in my IDE. I would open the `pom.xml` (or `build.gradle`), define the `spring-boot-starter-parent` to manage versions, and add the necessary dependencies (like `spring-boot-starter-web`). Finally, I would create a standard Java class containing the `main` method, annotate it with `@SpringBootApplication`, and invoke `SpringApplication.run()`.

### Q: Explain Bean Scopes and provide examples.
**A:** Bean scopes dictate the lifecycle and visibility of a bean in the Spring container.
* **Singleton (Default):** Only one single instance of the bean is created for the entire application.
* **Prototype:** A brand new instance is created every single time the bean is requested.
* **Web Scopes:** * `Request`: One instance per HTTP request.
  * `Session`: One instance per HTTP session.
  * `Application`: One instance per `ServletContext`.

### Q: Explain the internal working of `HashMap`.
**A:** A `HashMap` stores data as Key-Value pairs in an array of "buckets". When you insert an entry via `put()`, Java calculates the key's hash code to determine its specific bucket index. 
* **Collision:** If two different keys generate the same hash code and land in the same bucket, it creates a Linked List (or a balanced Red-Black Tree in Java 8+ if the list exceeds 8 elements) within that bucket. 
* **Retrieval:** When you call `get()`, it computes the hash again, jumps instantly to the correct bucket, and traverses any existing tree/list using the `equals()` method to return the exact value. This makes lookups $O(1)$ on average.

### Q: What are `Pageable` and `Sort` in Spring Data JPA?
**A:** They are interfaces used to efficiently handle massive database tables.
* **`Pageable`:** Handles pagination, allowing you to fetch records page-by-page (e.g., "Give me page 2 with a size of 20") instead of loading thousands of records into memory at once.
* **`Sort`:** Used to dynamically arrange the query results in ascending or descending order based on specific entity fields, enhancing both database performance and API usability.

### Q: What are Views in SQL?
**A:** A View is a virtual table whose contents are dynamically generated by a pre-defined SQL query. Views do not store physical data themselves; they merely display data from the underlying base tables. They are highly useful for simplifying complex, multi-join queries and improving security by restricting user access to only specific rows or columns.