---
id: wipro-fullstack-java-developer-interview
title: Wipro Java Developer Interview Experience & Questions
description: A comprehensive guide covering real technical interview questions and answers from a Wipro Full Stack Java Developer interview for a candidate with 3 to 7 years of experience.
tags:
  - Java
  - Spring Boot
  - Design Patterns
  - Exception Handling
  - Interview Experience
  - Wipro
---

# Wipro Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Wipro Full Stack Java Developer interview. The candidate fell into the 3 to 7 years of experience bracket. The technical round focused heavily on Java 8 features, Design Patterns, Spring Boot architecture, advanced Exception Handling, and Microservices.

---

## 1. Core Java & Java 8 Features

### Q: What are the new features introduced in Java 8?
**A:** Java 8 introduced several major enhancements to support functional programming and streamline development:
* **Lambda Expressions:** For concise and flexible coding.
* **Stream API:** For efficient, declarative data processing.
* **Date/Time API (`java.time`):** A thread-safe, modern replacement for legacy date handling.
* **Optional Class:** To gracefully handle null values.
* **Functional Interfaces** and **Default/Static Methods** inside interfaces.

### Q: Provide a detailed explanation of Lambda Expressions. How do you use them to instantiate a functional interface?
**A:** A Lambda Expression allows us to write a short, anonymous block of code that can be passed around as data. It significantly reduces boilerplate code, especially when working with collections or streams.
To instantiate a functional interface (which has exactly one abstract method), you simply provide an inline implementation using the lambda syntax `(parameters) -> { body }`, bypassing the need to create a dedicated implementation class.

### Q: Can an interface be considered functional if it has multiple `default` methods?
**A:** Yes. An interface can have as many `default` or `static` methods as you want. As long as it contains **exactly one abstract method**, it is still considered a valid Functional Interface and can be targeted by lambda expressions.

### Q: Do we really need the Stream API? Can we not just work with traditional coding (loops)?
**A:** Traditional coding (like `for` and `while` loops) works perfectly fine, but the Stream API helps manage and process collections much more easily. It allows you to perform complex operations like filtering, mapping, and sorting with significantly less code in a highly readable, declarative way. It also inherently supports easy parallel processing (`parallelStream()`) which is difficult to write manually with traditional loops.

### Q: How do you handle `NullPointerException`s?
**A:** We can handle them by:
1. Performing explicit null checks (`if (obj != null)`).
2. Using the Java 8 **`Optional`** class to wrap values that might be null, forcing the developer to handle the absence of a value gracefully.
3. Using validation annotations like `@NotNull` or `@NonNull`.

### Q: What is the difference between `Comparable` and `Comparator`?
**A:** * **`Comparable`:** Defines a default, "natural" sorting order for objects. The sorting logic is implemented *inside* the class itself by overriding the `compareTo()` method.
* **`Comparator`:** Defines custom, multiple sorting strategies. The logic is implemented *outside* the target class by creating separate classes (or lambdas) that override the `compare()` method.

### Q: What is the difference between `final`, `finally`, and `finalize`?
**A:** * **`final`:** A keyword used to declare a constant variable, prevent a method from being overridden, or prevent a class from being subclassed.
* **`finally`:** A block used in a `try-catch` structure. Code inside the `finally` block will always execute, making it ideal for cleaning up resources (like closing connections), regardless of whether an exception was thrown or not.
* **`finalize`:** A legacy method called by the Garbage Collector right before an object is destroyed. (Note: It is heavily deprecated in modern Java).

---

## 2. Design Patterns & Architecture

### Q: Explain the Factory, Singleton, and Abstract Factory design patterns.
**A:** * **Factory Pattern:** Creates objects without exposing the exact instantiation logic to the client. It uses a factory method to delegate object creation to subclasses.
* **Singleton Pattern:** Ensures a class has only exactly one instance across the entire JVM and provides a global point of access to it.
* **Abstract Factory Pattern:** Provides an interface for creating families of related or dependent objects without specifying their concrete classes (a "factory of factories").

### Q: Follow-up: Suppose you are using a Factory pattern to create objects in a multi-threaded environment. How would you ensure the factory itself is thread-safe without impacting performance?
**A:** To ensure thread safety without a massive performance hit, we can use the **Double-Checked Locking** pattern combined with a `volatile` instance variable for the Singleton factory. This approach ensures that the expensive `synchronized` block is only executed once during the very first initialization of the factory, minimizing synchronization overhead for all subsequent calls.

### Q: Give a few real-world scenarios where we can use the Singleton design pattern.
**A:** 1. Creating a Database Connection Pool.
2. Building a centralized Logging Service.
3. Creating a Configuration Manager that loads application properties once.
4. Implementing a common Application Cache.

### Q: What is the Circuit Breaker design pattern in Microservices?
**A:** The Circuit Breaker pattern prevents an application from repeatedly trying to execute an operation that is likely to fail. It stops calls to a downstream service when it detects a high failure rate, "opening" the circuit. This prevents network overloads, protects upstream thread pools from timing out, and gives the failing service time to recover.

### Q: Follow-up: How would you configure a Circuit Breaker for a service that experiences periodic, very brief spikes in failure rates?
**A:** For a service with brief, expected spikes, you should configure the Circuit Breaker with a slightly **higher failure rate threshold** (so it tolerates the spike without opening immediately) and a **shorter reset timeout** (so if it does open, it transitions to a "half-open" state quickly to test if the brief spike has passed).

---

## 3. Spring Boot & Exception Handling

### Q: What is the difference between Spring and Spring Boot? What are the advantages of Spring Boot?
**A:** * **Spring** is a comprehensive dependency injection and application framework for Java. However, it requires extensive manual XML or Java configuration.
* **Spring Boot** is built on top of Spring. It eliminates boilerplate configuration through **Auto-Configuration** and provides embedded servers (like Tomcat).
* **Advantages:** Rapid setup, minimal configuration, standalone execution, and production-ready features (Actuator).

### Q: What does the `@SpringBootApplication` annotation do? How can you customize or exclude auto-configuration?
**A:** It is a convenience annotation that combines `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. To exclude a specific auto-configuration class (e.g., if you don't want Spring to automatically configure a database connection), you use the exclude parameter: `@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})`.

### Q: What are the best practices for optimizing the performance of a Spring Boot application?
**A:** 1. Enable data caching (e.g., Redis).
2. Optimize database queries and configure connection pooling (HikariCP).
3. Utilize asynchronous processing (`@Async`) for background tasks.
4. Minimize eager Bean creation (use Lazy initialization where appropriate).
5. Optimize JVM memory and Garbage Collection settings.

### Q: Walk through the process of creating, using, and globally handling Custom Exceptions in Spring Boot.
**A:** 1. Create a custom exception class extending `RuntimeException`.
2. Throw this exception inside your Service layer when a specific business rule fails.
3. Handle it globally using a class annotated with **`@ControllerAdvice`** (or `@RestControllerAdvice`). 
4. Inside the advice class, define a method annotated with **`@ExceptionHandler(YourCustomException.class)`** to catch the error and return a standardized, meaningful JSON error payload to the client.

### Q: How would you design an Exception Hierarchy in a large Spring Boot project to improve maintainability?
**A:** I would create a base custom abstract exception (e.g., `BaseApplicationException`). Then, I would derive highly specialized exceptions from it (e.g., `DatabaseException`, `ServiceValidationException`, `ResourceNotFoundException`). This structured hierarchy makes error tracking, logging, and defining global `@ExceptionHandler` blocks much cleaner and easier to maintain.

### Q: How can we handle exceptions thrown from Asynchronous methods (`@Async`) in Spring Boot?
**A:** Exceptions thrown in `@Async` methods running on background threads cannot be caught by standard `@ControllerAdvice`. To handle them, you must implement the `AsyncUncaughtExceptionHandler` interface and override the `handleUncaughtException()` method. This allows you to specifically capture, log, and process errors that occur in asynchronous tasks.

### Q: How do you map exceptions to different HTTP status codes in a RESTful Spring Boot application?
**A:** You can do this in two ways:
1. Using the `@ResponseStatus(HttpStatus.BAD_REQUEST)` annotation directly on the Custom Exception class.
2. By returning a `ResponseEntity<Object>` inside your `@ExceptionHandler` method. This is much more flexible, as it allows you to dynamically customize both the HTTP status code and the JSON body content.

---

## 4. DevOps & Microservices

### Q: What are CI/CD pipelines and what are the best deployment strategies?
**A:** CI/CD automates the software delivery process. **Continuous Integration (CI)** ensures code changes are merged and tested automatically and frequently. **Continuous Deployment (CD)** automates the release of that validated code to production.
* **Best Deployment Strategies:** * **Blue-Green Deployment:** Spinning up an identical new environment and switching router traffic instantly.
  * **Canary Deployment:** Rolling out the new version to a very small subset of users first.
  * **Rolling Deployment:** Gradually replacing old instances with new ones to ensure zero downtime.

### Q: What are the advantages of Microservices, and how do they communicate?
**A:** * **Advantages:** High scalability, technology stack flexibility, complete fault isolation, and faster, independent deployments.
* **Communication:** They communicate *synchronously* using REST APIs or gRPC, and *asynchronously* using message brokers like Apache Kafka or RabbitMQ to ensure reliable, decoupled integration.

---

## 5. Coding Questions
*The candidate was asked to solve the following problem using Java 8:*
* **Stream API:** Write a Stream API code snippet to remove all duplicate elements from a `List<String>`.