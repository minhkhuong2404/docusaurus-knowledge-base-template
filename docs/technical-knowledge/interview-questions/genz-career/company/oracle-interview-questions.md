---
id: oracle-java-developer-interview-questions
title: Oracle Java Developer Interview Experience & Questions [2 Technical Rounds]
description: A detailed collection of real technical interview questions and answers from an Oracle Senior Java Backend Developer interview (5 years experience). Covers System Design, Spring Boot, Microservices, and Core Java.
tags:
  - Java
  - Spring Boot
  - System Design
  - Microservices
  - Interview Experience
  - Oracle
---

# Oracle Java Backend Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an Oracle Senior Java Backend Developer interview for a candidate with 5 years of experience. The process consisted of two technical rounds covering System Design, Microservices, Spring Boot, Core Java, and Coding.

---

## 1. System Design & Microservices Architecture

### Q: How would you design a microservice for an order management feature? List the DBs, APIs, and services you would create.
**A:** I would break down the system into loosely coupled microservices:
* **Services:** `OrderService`, `PaymentService`, `InventoryService`, and `NotificationService`.
* **Databases:** Use a relational database (like PostgreSQL or MySQL) for `OrderService` and `PaymentService` to guarantee strict ACID compliance for transactions. Use a NoSQL database (like MongoDB or Cassandra) for logging, tracking, or managing the product catalog.
* **APIs:** Expose RESTful endpoints such as `POST /orders` (Create Order), `PUT /orders/{id}` (Update Order), `DELETE /orders/{id}` (Cancel Order), and `GET /orders/{id}` (Get Order Details).
* **Architecture:** Each service must handle its own independent database and business logic to ensure true microservice decoupling.

### Q: How would you do inter-service communication between microservices?
**A:** * **Synchronous Communication:** Use REST APIs (via `RestTemplate`, `WebClient`, or `FeignClient`) for simple, immediate request-response calls.
* **Asynchronous Communication:** Use a message broker like **Apache Kafka** or **RabbitMQ** for event-driven, decoupled communication where immediate responses are not strictly necessary.

### Q: How do you implement distributed tracing and logging?
**A:** * **Tracing:** Use tools like **Zipkin** or **Spring Cloud Sleuth** to generate and propagate unique Trace IDs and Span IDs. This allows us to track a single request's flow seamlessly across multiple microservices.
* **Logging:** Use centralized logging stacks like the **ELK Stack** (Elasticsearch, Logstash, Kibana) or Splunk to aggregate, search, and analyze logs from all services in one place.

### Q: If a downstream service is slow, how would you protect your service?
**A:** I would implement a **Circuit Breaker** pattern (using libraries like Resilience4j). If the downstream service starts failing or slowing down, the circuit opens to stop sending repeated traffic, preventing cascading resource exhaustion. I would also apply strict **timeouts**, limit **retries**, and provide a **fallback method** to return cached data or a default response to keep the upstream system running smoothly.

### Q: Explain Idempotency in REST APIs and how to design an idempotent endpoint.
**A:** **Idempotency** means that making the exact same API call multiple times will produce the same result as making it only once (e.g., `PUT` and `DELETE` are naturally idempotent). 
**Design:** To make a `POST` request (like a payment) idempotent, the client must send a unique `Idempotency-Key` (or Request ID) in the HTTP header. The server stores this key. If a duplicate request arrives with the same key, the server ignores the operation and returns the cached response of the initial successful request, preventing duplicate orders or double charges.

### Q: How do you handle schema changes for event messages between services?
**A:** We manage this by utilizing **Event Versioning**. 
* Always ensure **backward compatibility**.
* Add new fields instead of deleting or renaming old ones.
* Use a **Schema Registry** (like Confluent Schema Registry for Kafka) to enforce strict schema evolution rules and maintain proper documentation for consumer services.

### Q: How do you manage configuration for multiple microservices?
**A:** Configurations should never be hardcoded or kept individually inside each service. We use a centralized configuration server, like **Spring Cloud Config**. It stores all environment properties in a central repository (like Git). Microservices fetch their respective configurations from this central server at startup.

---

## 2. Spring Boot & Hibernate/JPA

### Q: How does JPA/Hibernate Lazy Loading work?
**A:** Lazy Loading means that related entity data (e.g., the items inside an order) is not fetched from the database immediately when the parent entity is queried. Instead, Hibernate injects a **Proxy Object**. The real database query to fetch the related data is only executed at the exact moment the application explicitly calls the getter method to access that data. This drastically improves initial performance and saves memory.

### Q: What is the N+1 Select problem, and how do you detect and fix it?
**A:** The N+1 problem occurs when an ORM executes 1 query to fetch a list of *N* parent entities, and then executes *N* additional queries to fetch the lazy-loaded child entities for each parent, severely degrading performance.
* **Detection:** Enable SQL query logging (`show_sql=true` in Hibernate properties) and monitor the console for repetitive queries.
* **Fix:** Use a **`JOIN FETCH`** in your JPQL query, use **Entity Graphs**, or change the fetch type strategies to eagerly join the data in a single database round-trip.

### Q: Explain transaction isolation levels with examples.
**A:** Isolation levels dictate how visible uncommitted data is to other concurrent transactions:
* **Read Uncommitted:** Allows "Dirty Reads" (reading data that another transaction might roll back).
* **Read Committed:** Prevents Dirty Reads. A transaction only sees data committed before it began.
* **Repeatable Read:** Prevents "Non-Repeatable Reads", ensuring that if a row is read twice in the same transaction, the data remains identical.
* **Serializable:** The strictest level. It fully locks ranges to prevent "Phantom Reads", ensuring complete data safety but significantly reducing concurrent performance.

### Q: Explain transaction `@Transactional` propagation and isolation levels. Give a bug scenario and fix.
**A:** * **Propagation:** Defines how transactions behave when one transactional method calls another (e.g., `REQUIRED` joins the existing transaction; `REQUIRES_NEW` suspends the current one and starts a fresh one).
* **Bug Scenario:** If the isolation level is too low (e.g., Read Uncommitted), a "Dirty Read" bug occurs where a user's balance is read while a concurrent failed transaction is modifying it, resulting in incorrect calculations.
* **Fix:** Increase the isolation level parameter on the annotation: `@Transactional(isolation = Isolation.READ_COMMITTED)`.

### Q: How would you implement async tasks in Spring Boot?
**A:** 1. Add the `@EnableAsync` annotation to a configuration class.
2. Mark the specific background methods with the `@Async` annotation. Spring will automatically run them in a separate background thread.
3. For production, configure a custom `ThreadPoolTaskExecutor` bean to control the core pool size and queue capacity, ensuring these background tasks don't exhaust the server's main request threads.

### Q: How does Spring Boot use the server, and how do you change the default Tomcat to Jetty?
**A:** Spring Boot packages an embedded web server directly inside the application's executable JAR via starter dependencies. You don't need to deploy a WAR file to an external server. 
To switch to Jetty, you must exclude the `spring-boot-starter-tomcat` dependency from your `pom.xml` (within the `spring-boot-starter-web` block) and explicitly add the `spring-boot-starter-jetty` dependency.

### Q: Explain profiles in Spring Boot and how to manage different configurations for dev, stage, and prod.
**A:** Profiles allow you to separate environment-specific settings. You create distinct properties files like `application-dev.properties` and `application-prod.properties`. You then instruct Spring Boot which profile is active by setting the `spring.profiles.active` property (via command-line arguments or OS environment variables). Spring will load the core `application.properties` and merge it with the active profile's specific settings.

### Q: How do you implement exception handling in REST controllers?
**A:** We use a **Global Exception Handler**. We create a class annotated with `@ControllerAdvice` (or `@RestControllerAdvice`). Inside it, we write methods annotated with `@ExceptionHandler(ExceptionClass.class)`. This captures exceptions thrown from anywhere in the application, logs them, and returns standardized, user-friendly JSON error payloads and correct HTTP status codes, keeping the actual controllers clean.

### Q: How do you secure REST endpoints with Spring Security?
**A:** We configure security filter chains to define authentication and authorization rules (e.g., protecting `/api/**` endpoints). For REST APIs, we typically implement stateless **JWT (JSON Web Token)** authentication. The user logs in, receives a JWT, and passes it in the `Authorization: Bearer <token>` HTTP header for every subsequent request. Spring Security intercepts the request, validates the token's signature, and grants or denies access based on the user's encoded roles.

---

## 3. Core Java & Multithreading

### Q: How does String immutability help security and performance? What are interned strings?
**A:** * **Security:** Because a String cannot be altered once created in memory, it is safe to use for sensitive data like database URLs, usernames, network endpoints, and passwords (though char arrays are preferred for passwords to avoid memory lingering). It prevents hackers from altering the reference value.
* **Performance:** Immutability allows Java to cache Strings in a **String Pool**. If multiple variables declare the identical string literal, they simply point to the exact same memory reference, saving significant RAM.
* **Interned Strings:** These are the strings stored within this common pool. Calling `.intern()` on a dynamically created string forces Java to place it in the pool.

### Q: Explain the `hashCode` and `equals` method contract and give an example of a bug when broken.
**A:** **Contract:** If two objects are logically equal according to the `equals()` method, they **must** return the identical integer from their `hashCode()` method. 
**Bug Example:** If you override `equals()` but forget to override `hashCode()`, two logically identical objects will hash to different buckets. If you use one object as a key to put data into a `HashMap`, and later use a newly created identical object to retrieve that data, the `HashMap` will look in the wrong bucket and return `null`, effectively losing your data.

### Q: Explain the Java Thread Lifecycle and `ThreadPoolExecutor` parameters (corePoolSize, maximumPoolSize, keepAliveTime).
**A:** * **Lifecycle States:** New, Runnable, Running, Blocked/Waiting, and Terminated.
* **`corePoolSize`:** The minimum number of threads the pool will keep alive, even if they are completely idle.
* **`maximumPoolSize`:** The absolute maximum number of threads the pool is allowed to create when the queue is full and traffic spikes.
* **`keepAliveTime`:** If the current number of threads exceeds the `corePoolSize`, this specifies how long those extra, temporary threads will stay idle waiting for new tasks before being destroyed to save memory.

### Q: Explain Method Overloading, Method Overriding, and Method Hiding.
**A:** * **Overloading:** Multiple methods in the same class share the same name but have different parameter lists (resolved at compile-time).
* **Overriding:** A child class provides a specific implementation for an instance method already defined in its parent class with the exact same signature (resolved at runtime).
* **Method Hiding:** Occurs when a child class defines a **static** method with the exact same signature as a static method in the parent class. Because static methods belong to the class and are resolved at compile-time, the child's method merely "hides" the parent's method, bypassing dynamic polymorphism.

---

## 4. DevOps & Coding

### Q: How do you dockerize a Spring Boot application?
**A:** 1. Create a `Dockerfile` in the root of the project.
2. Define a base Java runtime image (e.g., `FROM eclipse-temurin:17-jdk-alpine`).
3. Copy the built artifact into the image (e.g., `COPY target/myapp.jar app.jar`).
4. Define the startup command (e.g., `ENTRYPOINT ["java", "-jar", "/app.jar"]`).
5. Build the image using `docker build -t myapp .` and execute it using `docker run -p 8080:8080 myapp`.

### Q: How do you roll out a new version in production with minimal downtime?
**A:** We use deployment strategies like **Blue-Green Deployment** (maintaining two identical production environments and instantly switching the router traffic from the old to the new) or **Rolling Updates** (gradually replacing old instances with new ones one by one). This ensures continuous availability, and if issues occur, allows for rapid rollback without affecting users.

### Q: Coding Questions Asked:
1. **Reverse a Linked List:** Write the algorithm and explain the Time ($O(n)$) and Space ($O(1)$) complexity.
2. **Longest Subarray:** Given an array of integers, find the longest continuous subarray that sums up to a target integer `k`.
3. **Thread-Safe LRU Cache:** Implement a Least Recently Used (LRU) cache from scratch that is completely thread-safe for a highly concurrent environment.