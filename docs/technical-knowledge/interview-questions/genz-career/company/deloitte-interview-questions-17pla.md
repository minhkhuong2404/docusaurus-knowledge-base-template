---
id: deloitte-java-developer-interview-17lpa
title: Deloitte Java Developer Interview Experience & Questions [17 LPA+]
description: A comprehensive guide covering real technical and managerial interview questions from a Deloitte Java Developer interview for a candidate with 4 years of experience.
tags:
  - Java
  - Spring Boot
  - Microservices
  - Mockito
  - Interview Experience
  - Deloitte
---

# Deloitte Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Deloitte Java Developer interview for a candidate with 4 years of experience. The interview process consisted of a coding round on HackerRank, followed by two core technical rounds and a final techno-managerial round.

---

## Round 1: Coding & REST API Design

### Q: Implement REST APIs to get a list of employees and get departments with employee details.
**A:** *This was a live coding exercise.* The interviewer expected the candidate to build the APIs from scratch, writing the `Controller`, `Entity`, `Service`, and `Repository` layers with a base path of `/api`. 

### Q: What are Path Variables and Query Parameters? How can we do API versioning?
**A:** * **Path Variables:** Used to extract dynamic values directly from the URI path to identify a specific resource (e.g., `/api/employees/{id}`).
* **Query Parameters:** Used to extract values from the URL query string (after the `?`) typically for filtering, sorting, or optional data (e.g., `/api/employees?department=IT`).
* **API Versioning:** Can be implemented via URI path (`/api/v1/employees`), Request Headers (`X-API-Version: 1`), or Content Negotiation (Media Type versioning via the `Accept` header).

### Q: SQL Query: Given three tables A, B, and C. Write a query to select all person names from all tables whose status is 'eligible'.
**A:** You use the `UNION` (or `UNION ALL` if duplicates are acceptable) operator to combine the results of multiple `SELECT` statements into a single result set.
```sql
SELECT name FROM TableA WHERE status = 'eligible'
UNION
SELECT name FROM TableB WHERE status = 'eligible'
UNION
SELECT name FROM TableC WHERE status = 'eligible';
```

---

## Round 2: Core Technical & Frameworks

### Q: What are the key standards when developing a RESTful API?
**A:** Best practices include:
1. Using clear, resource-oriented endpoint URLs (using nouns, not verbs).
2. Using proper HTTP methods strictly for their intended purposes (GET, POST, PUT, DELETE).
3. Returning meaningful HTTP status codes (200, 201, 400, 404, 500).
4. Implementing pagination for large data sets.
5. Ensuring robust input validation and centralized error handling.
6. Securing endpoints with authentication/authorization (e.g., JWT, OAuth2).
7. Providing proper API documentation (e.g., Swagger/OpenAPI).

### Q: What is SQL Injection and how do we block it?
**A:** SQL Injection is a critical security vulnerability where an attacker manipulates application inputs to execute malicious SQL statements, potentially exposing or deleting database records.
**Prevention:**
* Strictly use **Prepared Statements** (Parameterized Queries) to ensure the database treats input as data, not executable code.
* Use robust ORM frameworks like Hibernate.
* Never build SQL queries by manually concatenating strings with user inputs.
* Implement input validation and apply the principle of least privilege to the database user account.

### Q: What do the HTTP 300 series status codes indicate?
**A:** The 300 series codes indicate **Redirection**. They tell the client that further action needs to be taken to complete the request, usually navigating to a different URL. 
* **301:** Moved Permanently
* **302:** Found (Temporary Redirect)
* **304:** Not Modified (Used for caching purposes to tell the browser to use its cached version).

### Q: Explain a few design patterns used in Core Java and how to optimize a Singleton.
**A:** * **Singleton:** Ensures only one instance exists. **Optimization:** Use lazy initialization combined with *Double-Checked Locking* (using `volatile` on the instance variable and `synchronized` blocks). The most bulletproof approach is using an `Enum` based Singleton to natively prevent reflection and serialization hacks.
* **Factory:** Centralizes object creation logic without exposing instantiation rules to the client.
* **Builder:** Helps construct complex objects step-by-step using a fluent API.
* **Observer:** A publish-subscribe model used for event notifications.

### Q: What is the `@Transactional` annotation and what are isolation levels?
**A:** `@Transactional` manages database transactions automatically, guaranteeing ACID properties and rolling back changes if a runtime exception occurs.
* **Isolation Levels:** Control how concurrent transactions interact. They include `READ_UNCOMMITTED`, `READ_COMMITTED` (prevents dirty reads), `REPEATABLE_READ` (prevents non-repeatable reads), and `SERIALIZABLE` (the strictest, prevents phantom reads).

### Q: How do you configure Spring Boot to use an external cache (like Redis)?
**A:** 1. Add the cache dependency (e.g., `spring-boot-starter-data-redis`).
2. Add the `@EnableCaching` annotation to the main application class.
3. Configure the external provider connection details (host, port, password) in `application.properties`.
4. Use `@Cacheable`, `@CachePut`, and `@CacheEvict` annotations on service methods to manage the cached data seamlessly.

### Q: How do you secure sensitive information in Spring Boot?
**A:** Sensitive data (passwords, API keys) must never be hardcoded or committed to version control (Git). They should be externalized using environment variables or injected securely at runtime using specialized vault tools like **HashiCorp Vault**, **AWS Secrets Manager**, or **Spring Cloud Config Server** with encryption enabled.

### Q: How do you handle CSRF in an MVC application?
**A:** Spring Security provides built-in CSRF (Cross-Site Request Forgery) protection. It works by generating a unique, unpredictable synchronizer token for each user session. This token is embedded into HTML forms as a hidden field. For every state-changing request (POST, PUT, DELETE), the server validates this token. If it is missing or incorrect, the request is blocked, preventing malicious sites from forging requests on behalf of the user.

### Q: How do you enable cross-domain access (CORS) to your application?
**A:** By using the `@CrossOrigin` annotation on specific controller classes or methods. For a global configuration, you define a `WebMvcConfigurer` bean and override the `addCorsMappings()` method to explicitly allow specific origins (frontend domains), HTTP methods, and headers.

### Q: What is the difference between `yield()` and `join()` in multi-threading?
**A:** * **`yield()`:** A hint to the thread scheduler that the current thread is willing to temporarily pause and yield its CPU time to other threads of the same or higher priority. It does not guarantee a pause.
* **`join()`:** A strict blocking method. It forces the current thread to wait and pause execution until the thread on which `join()` was called has completely finished executing.

---

## Round 2: Testing & Mockito

### Q: Explain a few JUnit annotations.
**A:** * `@Test`: Marks a method as a test case.
* `@BeforeEach` / `@AfterEach`: Executes before/after every single test method in the class (used for setup and teardown).
* `@BeforeAll` / `@AfterAll`: Executes exactly once before/after all tests in the class run (must be static methods).
* `@Disabled`: Skips the execution of the test.

### Q: What is Mocking and Stubbing?
**A:** * **Mocking:** Creating fake "dummy" objects to simulate the behavior of real, complex dependencies (like databases or external APIs) so you can test your business logic in isolation.
* **Stubbing:** The process of explicitly defining the hardcoded responses those mock objects should return when their specific methods are called during the test (e.g., using `when(...).thenReturn(...)`).

### Q: What are some annotations related to Mockito?
**A:** * `@Mock`: Creates a mock instance of a class or interface.
* `@InjectMocks`: Injects the created `@Mock` objects into the target class you are actually testing.
* `@Spy`: Creates a partial mock; real methods are invoked unless specifically stubbed.
* `@ExtendWith(MockitoExtension.class)`: Integrates Mockito with the JUnit 5 framework.

### Q: What is the Circular Dependency issue in Spring Boot? How do you fix it?
**A:** It occurs when Bean A depends on Bean B, and Bean B simultaneously depends on Bean A. Spring gets stuck in an infinite loop trying to instantiate them, resulting in a `BeanCurrentlyInCreationException`. 
* **Fix:** The best fix is to redesign the architecture to break the cycle. Alternatively, you can use the `@Lazy` annotation on one of the injected dependencies so Spring injects a proxy instead of fully initializing the bean immediately.

### Q: Explain the `doNothing()` method in Mockito.
**A:** `doNothing()` is used to stub `void` methods on mock objects. While mocks ignore void methods by default, `doNothing()` is specifically useful when working with `@Spy` objects (where you want to prevent a real void method from executing and causing side effects) or when you need to capture arguments passed to a void method.

---

## Round 3: Techno-Managerial Round

This round focused heavily on day-to-day workflow, project management, and high-level architecture decisions. Questions included:
* How do you manage your daily work and track deadlines?
* Are you involved in reviewing Pull Requests (PRs)? What criteria do you look for?
* Which specific design patterns do you see most frequently in your current project's architecture?
* Why did you choose to apply for this specific role at Deloitte?
* Which Agile methodology (Scrum/Kanban) do you follow, and how are sprint ceremonies conducted?
* What is the primary use of Apache JMeter in your workflow?
* Can you name a few core Java standard libraries that implement the Singleton and Factory patterns? (e.g., `Runtime.getRuntime()` for Singleton; `NumberFormat.getInstance()` or `Calendar.getInstance()` for Factory).
* Where do you see yourself in the next 5 years technically?
