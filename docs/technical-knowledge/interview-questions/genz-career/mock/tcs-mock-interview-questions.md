---
id: tcs-java-springboot-interview-3-years
title: TCS 3 Years Interview Experience | Java Spring Boot
description: A comprehensive collection of real interview questions and answers from a TCS Java Developer interview. Ideal for candidates with ~3 years of experience, covering Core Java, API Security, Spring Boot, and Microservices.
tags:
  - Java
  - Spring Boot
  - Security
  - Microservices
  - Interview Experience
  - TCS
---

# TCS Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a TCS (Tata Consultancy Services) Java Developer interview. The candidate had 3 years of backend development experience. The interview thoroughly evaluated REST API design, Web Security, Core Java concepts (Memory, Multithreading, Streams), Spring Boot tooling, and Spring Data JPA.

---

## 1. Web Security & API Design

### Q: What specific security measures did you implement in your project to ensure data privacy?
**A:** For a sensitive application (like Healthcare or Banking), I implemented multiple layers of security:
1. **Data in Transit:** Enforced **HTTPS** (SSL/TLS) to encrypt all data flowing between the client and the server, preventing man-in-the-middle attacks.
2. **Data at Rest:** Applied AES-256 encryption for highly sensitive fields in the database.
3. **Access Control:** Integrated **OAuth2** and JWT (JSON Web Tokens) for robust, stateless authentication, ensuring that only strictly authorized users could access specific API endpoints.
4. **Vulnerability Management:** Regularly updated Maven dependencies to patch known vulnerabilities and ensured the application was hardened against common attacks like SQL Injection and XSS.

### Q: How did you design the RESTful APIs for your application?
**A:** I strictly followed REST architectural principles:
* **Statelessness:** The server stores no client session data. Every request contains a JWT for authentication.
* **JSON Payloads:** All data exchange is done using standard JSON formats.
* **Correct HTTP Verbs:** I designed the endpoints around resources using standard verbs:
  * `POST` for creating new records (e.g., `/api/patients`).
  * `GET` for retrieving data (e.g., `/api/appointments?date=today`).
  * `PUT`/`PATCH` for updates and `DELETE` for cancellations.
* **HTTP Status Codes:** Returned precise status codes (201 Created, 400 Bad Request, 404 Not Found) for clear client communication.

### Q: What are some common security pitfalls in web applications and how do you prevent them?
**A:** 1. **SQL Injection:** Attackers insert malicious SQL into input fields. *Prevention:* Strictly use Prepared Statements or robust ORM frameworks like Spring Data JPA / Hibernate instead of concatenating raw SQL strings.
2. **Cross-Site Scripting (XSS):** Attackers inject malicious scripts into web pages viewed by other users. *Prevention:* Validate, sanitize, and strictly encode all user input and output.
3. **Exposing Sensitive Data:** *Prevention:* Never expose internal database IDs, stack traces, or raw passwords. Always hash passwords (using BCrypt) and use DTOs (Data Transfer Objects) to filter API responses.

---

## 2. Core Java, Memory & Multithreading

### Q: Explain the Java Memory Model, specifically the difference between Stack and Heap memory.
**A:** * **Stack Memory:** Used for the execution of threads. It stores local primitive variables and method call frames (which contain references to objects). It is extremely fast but limited in size. Crucially, each thread has its own isolated stack, making local variables inherently thread-safe.
* **Heap Memory:** Used for the dynamic allocation of all Java objects and JRE classes at runtime. It is much larger than the stack and is globally shared across all running threads. Memory in the Heap is actively managed and cleaned by the **Garbage Collector**.

### Q: Describe how Garbage Collection works in Java.
**A:** Garbage Collection (GC) is an automated memory management process that runs in the background as a daemon thread. It constantly monitors the Heap memory to track object references. 
Objects that no longer have any active references pointing to them from the application are deemed "unreachable." The GC identifies these dead objects and automatically deletes them to free up memory space. This completely prevents manual memory leaks and removes the burden of manual memory deallocation from the developer.

### Q: How does Java achieve Polymorphism?
**A:** Java achieves polymorphism through two main mechanisms:
1. **Method Overriding (Runtime / Dynamic):** A child class provides a specific, altered implementation of a method that is already defined in its parent class.
2. **Method Overloading (Compile-time / Static):** Defining multiple methods with the exact same name but different parameter lists within the same class.
Additionally, **Interfaces** enable polymorphism by allowing a single interface reference variable to point to entirely different implementation objects at runtime.

### Q: Provide a real-life example where Polymorphism is beneficial.
**A:** In a Graphical User Interface (GUI), consider a generic action like a "Mouse Click". The application might have a generic `onClick()` method. However, clicking a **Button** submits a form, clicking a **Checkbox** toggles a checkmark, and clicking a **Dropdown** expands a list. The exact same generic `onClick()` method behaves entirely differently depending on the specific underlying UI object. This makes the code highly reusable and scalable.

### Q: Explain the concept of the `synchronized` keyword. What issue occurs if you don't use it?
**A:** The `synchronized` keyword enforces mutual exclusion in a multithreaded environment. It ensures that only one single thread can execute a specific method or block of code on a given object at any time.
* **The Issue (Race Condition):** In a banking application, if two threads try to process a $50 withdrawal from an account holding $100 simultaneously without synchronization, they might both read the $100 balance at the exact same millisecond. They both subtract $50 and save $50 back to the database. The final balance becomes $50 instead of the correct $0, resulting in severe data corruption.

### Q: What is the difference between Checked and Unchecked exceptions?
**A:** * **Checked Exceptions:** Inherit from the `Exception` class (e.g., `IOException`, `SQLException`). The Java compiler strictly checks them at compile-time. The developer is forced to handle them using a `try-catch` block or declare them using the `throws` keyword.
* **Unchecked Exceptions:** Inherit from `RuntimeException` (e.g., `NullPointerException`, `IndexOutOfBoundsException`). They are not checked by the compiler. They represent logical programming errors that should be fixed in the code rather than caught.

### Q: Is it good practice to use exceptions for control flow?
**A:** **No, it is a severe anti-pattern.** Exceptions are strictly meant for exceptional, unpredictable error conditions, not for standard business logic or looping control. Throwing an exception is computationally very expensive because the JVM must construct a massive Stack Trace object. Using them for control flow degrades application performance and makes the code highly confusing to read.

### Q: What is Reflection in Java? What are its disadvantages?
**A:** Reflection is an advanced API that allows Java code to dynamically inspect, examine, and modify the runtime behavior of classes, interfaces, fields, and methods (even `private` ones) at runtime.
* **Disadvantages:**
  1. **Performance:** Reflection operations are significantly slower than direct code execution because they bypass JVM optimizations.
  2. **Security Risk:** It can access `private` fields, completely breaking Encapsulation.
  3. **Fragility:** It relies on hardcoded string names for methods/fields, meaning the compiler cannot catch errors if the class structure changes, making the code highly brittle.

---

## 3. Spring Boot, Architecture & AOP

### Q: How does Spring Boot simplify dependency management? What are Starters?
**A:** Spring Boot simplifies dependency management by using **Starters**. A starter is a curated, pre-packaged bundle of dependencies. Instead of manually searching for and adding 10 different libraries (like Spring MVC, Jackson, Tomcat, and Validation) and risking severe version conflicts, you simply add one starter: `spring-boot-starter-web`. Spring Boot guarantees that all the underlying libraries are version-compatible and pulls them in automatically.

### Q: Describe the roles of `@RestController` and `@RequestMapping`.
**A:** * **`@RestController`:** A convenience annotation that combines `@Controller` and `@ResponseBody`. It flags the class as a web controller and guarantees that every method returns data (domain objects serialized directly into JSON) rather than returning an HTML view name.
* **`@RequestMapping`:** Used at the class or method level to map incoming HTTP request URLs (e.g., `/api/v1/users`) to the specific Java handler methods.

### Q: Explain the concept of Spring Data JPA. How do you handle complex queries?
**A:** Spring Data JPA provides a repository abstraction over the Java Persistence API (JPA) / Hibernate. By simply creating an interface that extends `JpaRepository`, developers instantly inherit powerful built-in CRUD operations without writing any boilerplate SQL or DAO implementation classes.
* **Handling Complex Queries:** For queries beyond basic CRUD:
  1. Use the **`@Query`** annotation to write custom JPQL or Native SQL directly above the repository method.
  2. Use **Method Name Derivation** (e.g., `findByLastNameAndStatus(...)`).
  3. Use `Specification` or `QueryDSL` to dynamically construct highly complex, filterable queries at runtime.

### Q: Explain the role of Actuator in Spring Boot and its use in a Microservices architecture.
**A:** Actuator provides built-in, production-ready endpoints (like `/health`, `/metrics`, `/info`) to deeply monitor and manage a running application.
* **In Microservices:** In a distributed system with dozens of services, individual Actuator data is heavily utilized. Centralized monitoring tools (like Prometheus, Grafana, or Spring Boot Admin) scrape these Actuator endpoints across all services. This provides a single, unified dashboard to monitor CPU load, memory, and uptime across the entire ecosystem, enabling rapid failure detection.

### Q: What is Aspect-Oriented Programming (AOP)? Provide a practical use case.
**A:** AOP is a paradigm that separates "cross-cutting concerns" from the core business logic. Cross-cutting concerns are repetitive tasks that happen across multiple layers of an application, such as Logging, Security, or Transaction Management.
* **Use Case (Logging):** Instead of manually writing `logger.info("Method started")` at the beginning of 100 different service methods, you write that logic exactly once inside an **Aspect**. You define a Pointcut that targets all methods in a specific package, and Spring automatically intercepts those methods and executes your logging code, keeping the core business logic perfectly clean and isolated.	