---
id: tech-mahindra-java-developer-interview
title: Tech Mahindra Java Developer Interview Experience & Questions [16 LPA+]
description: A comprehensive collection of real interview questions and detailed answers from a Tech Mahindra Java Developer interview. Ideal for candidates with ~3 years of experience, covering Core Java, Spring Boot, Microservices, and API Design.
tags:
  - Java
  - Spring Boot
  - Microservices
  - REST API
  - Interview Experience
  - Tech Mahindra
---

# Tech Mahindra Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Tech Mahindra Java Developer interview. The candidate had 3 years of experience. The interview covered a broad range of topics, including deep Core Java concepts, Spring Boot Auto-Configuration, REST API design, and Microservices resilience.

---

## 1. Core Java & Multithreading

### Q: Why is `volatile` used in Java and when does it fail to guarantee thread safety?
**A:** The `volatile` keyword ensures that changes to a variable are immediately visible to all threads by forcing the JVM to read and write the variable directly from main memory, bypassing local CPU caches. 
**When it fails:** It fails to guarantee thread safety when multiple threads are simultaneously reading and updating the variable based on its previous state (e.g., the `count++` operation). It does not provide **atomicity**. For compound operations, you must use synchronization or `Atomic` classes (like `AtomicInteger`).

### Q: What is the risk of overriding the `equals()` method but not the `hashCode()` method?
**A:** If `equals()` is overridden but `hashCode()` is not, two objects that are logically equal might generate completely different hash codes based on their memory addresses. When inserted into hash-based collections like `HashMap` or `HashSet`, they will be placed into different hash buckets. This completely breaks the collection's behavior, leading to duplicate entries and failed lookups (returning `null` even when the object logically exists).

### Q: Explain the concept of Immutability and how do you create an immutable class in Java?
**A:** Immutability means an object's state cannot be modified after it is created. 
**To create an immutable class:**
1. Declare the class as `final` so it cannot be subclassed.
2. Make all fields `private` and `final`.
3. Do not provide any `setter` methods.
4. Initialize all fields via a parameterized constructor.
5. Return deep copies of any mutable object fields in the getter methods.
*`String` is the most famous example of an immutable class, favored for security, caching (String Pool), and automatic thread safety.*

### Q: Why is immutability preferred in multi-threaded systems?
**A:** Immutable objects are inherently **thread-safe**. Because their internal state never changes after creation, multiple threads can safely access and read the object simultaneously without the need for expensive `synchronized` blocks or locks. This drastically reduces complexity and improves performance.

### Q: What happens if a thread throws an unchecked exception, and how do you handle it in a thread pool?
**A:** If a thread throws an unchecked exception, it terminates silently. In a `ThreadPoolExecutor`, you can handle this in two ways:
1. Override the `afterExecute(Runnable r, Throwable t)` method of the thread pool to catch and log the exception.
2. Submit the task using the `submit()` method. The exception will be caught and stored inside the returned `Future` object. You can then retrieve it by calling `future.get()`, which will rethrow the exception wrapped in an `ExecutionException`.

### Q: Explain the ClassLoader hierarchy in Java and a scenario where it causes issues.
**A:** Java uses a delegation hierarchy: **Bootstrap ClassLoader** -> **Extension ClassLoader** -> **Application (System) ClassLoader**. 
**Issue Scenario:** A common issue is a `ClassNotFoundException` or `ClassCastException` in complex web server environments (like Tomcat). If two different custom ClassLoaders load the exact same class file independently, the JVM treats them as two completely different, incompatible classes, leading to casting errors even if the source code is identical.

### Q: If a service is caching data using `HashMap` but facing concurrency issues, what is wrong and what is the solution?
**A:** `HashMap` is absolutely **not thread-safe**. In a multi-threaded environment, simultaneous reads and writes can cause severe data corruption, or even infinite loops during the internal rehashing process (in pre-Java 8 versions). 
**Solution:** Replace the `HashMap` with a **`ConcurrentHashMap`**, which is specifically designed for high-performance, thread-safe access using segment/bucket-level locking.

---

## 2. Spring Boot Core & Configuration

### Q: How does Spring Boot perform Auto-Configuration behind the scenes?
**A:** Auto-configuration is triggered by the `@EnableAutoConfiguration` annotation. Spring Boot reads the `META-INF/spring.factories` file (or auto-configuration imports) to find a list of potential configuration classes. It then heavily relies on **`@Conditional`** annotations (such as `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`) to dynamically evaluate the classpath, existing beans, and properties to decide exactly which beans should be instantiated and wired automatically.

### Q: What happens when two Auto-Configurations conflict?
**A:** If two auto-configurations attempt to register a bean of the exact same type, Spring will throw a `NoUniqueBeanDefinitionException`. You can resolve this by:
* Defining your own custom bean of that type (which automatically overrides auto-configured beans).
* Using the `@Primary` annotation to mark the default bean.
* Using the `@Qualifier` annotation.
* Explicitly excluding the problematic auto-configuration class in the `@SpringBootApplication` annotation (e.g., `exclude = DataSourceAutoConfiguration.class`).

### Q: What is a `@Conditional` annotation and where have you used it?
**A:** It tells Spring to load a bean only if a specific condition is evaluated as true at runtime. 
**Example Use Case:** I used `@ConditionalOnProperty(name="mock.service.enabled", havingValue="true")` to load a mock implementation of an external API for local development and testing, while loading the real service in the production environment.

### Q: How does Spring Boot reduce boilerplate code and what are the trade-offs?
**A:** It reduces boilerplate by auto-configuring common infrastructure (like database connections and Tomcat servers) and combining dependencies into simple "Starter" packages (like `spring-boot-starter-web`). 
**Trade-offs:** You lose explicit control over the configuration. The heavy reliance on "magic" and hidden complexity makes it harder to debug when auto-configuration behaves unexpectedly.

### Q: What is the difference between `application.properties` and `application.yml`?
**A:** Both are used to externalize Spring Boot configurations. 
* `.properties` uses a flat, simple key-value pair syntax.
* `.yml` (YAML) uses a cleaner, hierarchical, tree-like structure based on indentation. YAML is generally preferred for modern applications because it is easier to read when dealing with deeply nested configurations.

### Q: What is the difference between the `@Value` and `@ConfigurationProperties` annotations?
**A:** * **`@Value`:** Injects a single, specific property value from the configuration file directly into a field.
* **`@ConfigurationProperties`:** Binds a logical group of hierarchically related properties into a strongly typed POJO (Java class). It is much better for structured, maintainable, and type-safe configuration management.

### Q: How does Spring Boot handle Circular Dependencies?
**A:** A circular dependency occurs when Bean A depends on Bean B, and Bean B depends on Bean A, causing a `BeanCurrentlyInCreationException`. 
While Spring historically attempted to resolve this using setter injection proxies, the best practice is to **redesign your code architecture** to eliminate the cycle. Alternatively, you can place the `@Lazy` annotation on one of the dependencies so Spring injects a proxy instead of fully initializing the bean at startup.

---

## 3. REST API Design & Exception Handling

### Q: What are DTOs (Data Transfer Objects) and why should you use them?
**A:** DTOs are simple POJOs used to pass data between the application layers or over the network to the client. 
**Why use them:** They prevent exposing internal, sensitive database Entity structures. They reduce network payload sizes by carrying only the required fields, and they decouple the public API contract from the internal database schema.

### Q: How do you handle exceptions in a REST API?
**A:** By using global centralized exception handling. You create a class annotated with **`@RestControllerAdvice`** and define methods annotated with **`@ExceptionHandler`** targeting specific exception classes. Inside these methods, you construct and return a customized, structured JSON response (containing the error message, timestamp, and correct HTTP status code like 400 or 404).

### Q: What are Idempotent methods in REST? Which HTTP methods are idempotent?
**A:** An idempotent HTTP method is one where making multiple identical requests has the exact same effect on the server state as making a single request. 
* **Idempotent Methods:** `GET`, `PUT`, `DELETE`, and `HEAD`. (For example, deleting a user 10 times results in the user being deleted, exactly as it would if called once).
* **Non-Idempotent Methods:** `POST` (calling it 10 times creates 10 new resources).

### Q: What is the difference between `RestTemplate` and `WebClient`?
**A:** * **`RestTemplate`:** A synchronous, blocking HTTP client. The thread making the request halts until the response is received.
* **`WebClient`:** A modern, non-blocking, reactive HTTP client introduced in Spring WebFlux. It supports both synchronous and asynchronous operations, making it significantly better for high-concurrency, scalable microservices.

---

## 4. Microservices, Data & Security

### Q: What challenges of distributed systems does Spring Cloud try to solve?
**A:** Spring Cloud provides tools to handle the inherent complexities of microservices, including:
* **Service Discovery:** Allowing services to find each other dynamically (Eureka).
* **Configuration Management:** Centralizing configs across instances (Config Server).
* **Fault Tolerance:** Preventing cascading failures (Circuit Breakers).
* **Client-Side Load Balancing.**
* **API Gateways:** Centralized routing and security.

### Q: How do you propagate security tokens from an API Gateway to downstream services?
**A:** The API Gateway acts as the single entry point. It captures the client's authentication token (like a JWT), performs initial validation, and then explicitly forwards the token by injecting it into the HTTP request headers (e.g., `Authorization: Bearer <token>`) before routing the request to the downstream microservices.

### Q: How do you protect sensitive endpoints from Brute-Force attacks?
**A:** By implementing:
1. **Rate Limiting / Throttling:** (e.g., using Bucket4j or an API Gateway) to restrict the number of requests per IP.
2. **Account Lockout:** Locking the user account temporarily after a specific number of failed login attempts.
3. **CAPTCHAs:** For login or highly sensitive forms.

### Q: One of your microservices is down. How will you handle the failure gracefully?
**A:** I would implement the **Circuit Breaker** pattern using a library like **Resilience4j**. Instead of allowing requests to continuously hit the dead service and exhaust system threads waiting for timeouts, the circuit breaker detects the failure rate and "opens." It immediately rejects requests and routes them to a **Fallback Method**, which can return cached data or a friendly error message, protecting the rest of the ecosystem.

### Q: How do you implement Pagination and Sorting with Spring Data JPA?
**A:** By using the `Pageable` and `Sort` interfaces. You pass a `PageRequest` object (containing the requested page number, page size, and sorting parameters) directly into your Repository query methods. Spring Data automatically translates this into the appropriate SQL `LIMIT`, `OFFSET`, and `ORDER BY` clauses for the database.

### Q: You have two entities: `User` and `Order`. A user can have multiple orders. How do you map this relationship?
**A:** This is a bidirectional relationship.
* In the **`User`** entity, you declare a `List<Order>` and annotate it with **`@OneToMany(mappedBy = "user")`**.
* In the **`Order`** entity, you declare a `User` field and annotate it with **`@ManyToOne`** and `@JoinColumn(name = "user_id")` to specify the foreign key linking back to the user.