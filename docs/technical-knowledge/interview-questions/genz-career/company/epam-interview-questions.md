---
id: epam-java-developer-interview-22lpa
title: EPAM Java Developer Interview Experience & Questions [22 LPA+]
description: A comprehensive guide covering real technical interview questions and answers from an EPAM Java Developer interview for a candidate with 3 to 7 years of experience.
tags:
  - Java
  - Spring Boot
  - Microservices
  - Architecture
  - Interview Experience
  - EPAM
---

# EPAM Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an EPAM Systems Java Developer interview. The candidate fell into the 3 to 7 years of experience bracket. The process consisted of two intensive technical rounds covering Core Java, Collections, Design Principles, Spring Boot internals, REST API concepts, and Database optimization.

---

## 1. Core Java & Object-Oriented Programming

### Q: What is the difference between Abstraction and Encapsulation?
**A:** * **Abstraction** hides the complex implementation details and shows only the essential features to the user. (Analogy: Using a TV remote without needing to understand the complex internal circuitry).
* **Encapsulation** binds the data (variables) and the code (methods) acting on the data together as a single unit, strictly restricting direct access from the outside. (Analogy: A medicine capsule protecting the powder inside).

### Q: Can we achieve Encapsulation without Abstraction? If yes, how?
**A:** Yes, we can achieve Encapsulation without Abstraction. By declaring class variables as `private` and providing public `getter` and `setter` methods, we encapsulate and protect the data. Even if the methods don't hide any complex internal logic (meaning there is no real Abstraction), the internal state remains secure from direct external modification. It is like locking valuables in a transparent safe; the box isn't hidden, but the contents are protected.

### Q: What is the String Constant Pool and where are objects and literals stored?
**A:** The String Constant Pool is a highly optimized, dedicated memory area inside the Java Heap. It is used to store `String` literals to save memory and promote reuse. 
* When you create a String literal (e.g., `String s = "Hello"`), it goes directly into the Pool. 
* When you create a String using the `new` keyword (e.g., `String s = new String("Hello")`), the object is created in the main Heap memory, outside the pool (though a reference might be added to the pool if `.intern()` is called).

### Q: Can an Interface have `private` methods? What is their purpose if they cannot be accessed outside?
**A:** Yes, starting from Java 9, interfaces can contain `private` methods. 
**Purpose:** Their primary purpose is to act as hidden helper functions that encapsulate duplicate code shared by multiple `default` or `static` methods within the exact same interface. This keeps the interface clean, organized, and prevents exposing internal utility logic to the classes implementing the interface.

### Q: Explain the Java Exception Hierarchy.
**A:** The hierarchy starts with the `Throwable` root class, which splits into two main branches:
1. **`Error`:** Represents critical, system-level issues (like `OutOfMemoryError` or `StackOverflowError`) that an application cannot and should not try to recover from.
2. **`Exception`:** Represents conditions that a reasonable application might want to catch. This branches further into:
   * **Checked Exceptions:** Exceptions checked by the compiler (e.g., `IOException`). You are forced to handle them using `try-catch` or `throws`.
   * **Unchecked Exceptions:** Exceptions that occur at runtime (e.g., `RuntimeException`, `NullPointerException`). They usually result from logical coding mistakes and are not checked by the compiler.

### Q: Can a `finally` block override an exception thrown in a `try` block?
**A:** Yes. If an exception is thrown in a `try` block, but the `finally` block executes a `return` statement or deliberately throws a *new* exception, the original exception from the `try` block is completely swallowed and overridden. This is widely considered a severe anti-pattern as it makes debugging the root cause of an error nearly impossible.

---

## 2. Collections Framework & ClassLoaders

### Q: Why doesn't the `Collection` interface extend the `Map` interface?
**A:** Because they serve fundamentally different data structures. The `Collection` interface (and its children like `List` and `Set`) is designed to store and manage single, individual elements. The `Map` interface is designed specifically to store Key-Value pairs. Keeping their hierarchies completely separate makes the framework logical, type-safe, and easier to implement.

### Q: Explain the internal working of `HashMap` in detail.
**A:** `HashMap` stores key-value pairs in an internal array of "buckets." When you add data using `put(key, value)`, Java calculates the `hashCode()` of the key to mathematically determine the exact array bucket index where the data should be stored. This allows for extremely fast $O(1)$ lookups.

### Q: If two keys have the same hash code, how does `HashMap` store them internally?
**A:** This is known as a **Hash Collision**. The `HashMap` stores both key-value pairs in the exact same bucket by linking them together in a **Linked List**. When retrieving the value, it traverses the list and uses the `equals()` method to find the exact matching key. To maintain high performance, if the linked list grows too large (typically > 8 elements), Java automatically converts it into a balanced **Red-Black Tree**, reducing lookup time from $O(n)$ to $O(\log n)$.

### Q: What is the difference between `HashMap` and `TreeMap`? Can we store `null` as a key in a `TreeMap`?
**A:** * **`HashMap`:** Completely unordered. Operates on hashing with an average time complexity of $O(1)$ for retrieval. It allows exactly one `null` key.
* **`TreeMap`:** Keeps the data strictly sorted in ascending order based on the keys. Operates using a Red-Black Tree with a time complexity of $O(\log n)$. 
* **Null Keys:** No, you **cannot** store `null` as a key in a `TreeMap`. Because it must sort the keys, it uses the `compareTo()` method internally. Attempting to compare `null` with other keys immediately throws a `NullPointerException`.

### Q: How many types of ClassLoaders are there in Java?
**A:** There are three core ClassLoaders in the JVM hierarchy:
1. **Bootstrap ClassLoader:** The parent of all loaders. It loads core Java APIs (like `java.lang.String`) from the `rt.jar`.
2. **Extension ClassLoader:** Loads classes from the JRE's extension directory (`jre/lib/ext`).
3. **Application (System) ClassLoader:** Loads user-defined classes from the project's defined Classpath.

### Q: What happens if two different ClassLoaders load the exact same class?
**A:** The JVM treats them as two completely separate and unrelated classes. Even if the class name, package, and source code are 100% identical, the JVM uses the combination of the Fully Qualified Class Name + the ClassLoader instance to define a unique class. If you try to cast an object created by one ClassLoader to a reference loaded by the other, Java will throw a `ClassCastException`.

---

## 3. Spring Boot, Architecture & Design Patterns

### Q: Explain the SOLID principles. Can violating the Open/Closed Principle be beneficial?
**A:** SOLID stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. They ensure code is scalable and maintainable.
* **Violating Open/Closed:** Yes, in very small projects, tight deadlines, or MVP prototyping, strictly adhering to the Open/Closed principle might result in massive over-engineering and boilerplate code. Modifying a class directly can be simpler and faster. However, in enterprise-scale systems, violating it leads to rigid, fragile legacy code.

### Q: Difference between Microservices and Monolithic Architecture. Is there any scenario where Monolithic is preferable?
**A:** * **Monolithic:** A single, large, tightly-coupled codebase deployed as one unit.
* **Microservices:** The application is split into small, independently deployable services communicating via APIs.
* **When is Monolith preferable?** For small applications, startups needing fast time-to-market, or internal tools with minimal traffic. Monoliths avoid the massive operational, DevOps, and network complexity required to manage a distributed microservice environment.

### Q: Can a Spring Boot application run without the `@SpringBootApplication` annotation?
**A:** Yes. The `@SpringBootApplication` annotation is just a convenience wrapper. You can achieve the exact same behavior by manually annotating your main class with the three annotations it combines: `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`.

### Q: What is the `DispatcherServlet`?
**A:** It is the core Front Controller in the Spring MVC framework. It intercepts all incoming HTTP requests, acts as a traffic cop, consults Handler Mappings to forward the request to the appropriate `@Controller`, processes the response via the Service layer, and returns the final result (either a rendered UI View or a JSON payload) back to the client.

### Q: What happens if a Circuit Breaker remains open for too long?
**A:** If a Circuit Breaker (like Resilience4j) stays "Open" indefinitely, all incoming requests will be instantly rejected (or routed to a fallback), causing permanent service downtime for that feature—even if the failing downstream service has fully recovered. To prevent this, proper timeouts must be configured so the circuit transitions to a "Half-Open" state to test if the downstream service is healthy again and can resume normal traffic.

### Q: How will you configure your application if it requires different databases for different environments (Dev vs. Prod)?
**A:** By utilizing **Spring Profiles**. I would define separate properties files: `application-dev.properties` (containing configurations for a local MySQL or H2 database) and `application-prod.properties` (containing production Oracle/PostgreSQL configurations). At runtime, I inject the desired environment variable (`spring.profiles.active=prod`) to dynamically connect to the correct database without touching the source code.

---

## 4. REST API & SDLC

### Q: Is REST always stateless? Can a REST API maintain a session?
**A:** REST is fundamentally designed to be **stateless**, meaning the server should not store any client context (like memory-based sessions) between requests. Every single request must contain all the necessary information (like a JWT token) to be authenticated and processed independently.
* **Can it maintain a session?** Technically, you *could* implement server-side sessions or use sticky-session cookies in a REST API, but doing so violently breaks REST architectural principles and completely destroys the ability to easily horizontally scale the application.

### Q: Difference between `@RequestParam` and `@PathVariable`. Can we use them together?
**A:** * **`@RequestParam`:** Extracts data from the URL query string (e.g., `?id=10&sort=asc`). Best for optional filtering and sorting parameters.
* **`@PathVariable`:** Extracts data directly bound into the URI path (e.g., `/users/10`). Best for identifying specific resources.
* **Used together?** Absolutely. They serve different purposes and can be combined on a single endpoint (e.g., `/users/{id}/orders?status=shipped`).

### Q: What is the difference between TDD and BDD? What is the Testing Pyramid?
**A:** * **TDD (Test-Driven Development):** Writing the automated test cases *before* writing the actual business logic code to ensure high test coverage.
* **BDD (Behavior-Driven Development):** Focuses on system behavior using simple, human-readable domain language (e.g., "Given-When-Then" syntax using tools like Cucumber) so non-technical stakeholders can understand the tests.
* **Testing Pyramid:** A concept stating you should have a massive base of fast, highly-isolated Unit Tests, a smaller middle layer of Integration Tests, and the absolute fewest amount of slow, fragile UI/End-to-End tests.

### Q: Why is Agile preferred over the Waterfall model?
**A:** Waterfall is a rigid, linear process; once a phase (like design) finishes, going back to fix issues or adapt to changing customer requirements is incredibly difficult and expensive. Agile is preferred because it embraces flexibility, continuous customer feedback, and delivers working software iteratively in small, manageable chunks called "Sprints."

---

## 5. Databases & Coding

### Q: How can you optimize a SQL query which is taking a long time?
**A:** 1. Avoid `SELECT *`; specifically query only the columns needed to reduce memory/network load.
2. Ensure appropriate **Indexes** exist on columns frequently used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
3. Optimize `JOIN` operations and avoid nested subqueries where possible.
4. Filter data as early as possible using the `WHERE` clause.
5. Use `EXPLAIN` or `ANALYZE` execution plans to identify full table scans and exact bottlenecks.

### Q: Coding Question: Rain Water Trapping
**A:** *The candidate was asked to solve the classic algorithmic "Rain Water Trapping" problem (usually solved via arrays using a Two-Pointer approach or pre-calculated Left/Right Max arrays).*