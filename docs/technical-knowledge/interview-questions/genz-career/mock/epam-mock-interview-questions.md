---
id: epam-java-developer-interview-experience
title: EPAM 3 Years Interview Experience | Java Spring Boot
description: A comprehensive collection of real interview questions and answers from an EPAM Java Developer interview. Ideal for candidates with 3 years of experience, covering Core Java, Spring Boot, Microservices, and Memory Management.
tags:
  - Java
  - Spring Boot
  - Microservices
  - Memory Management
  - Interview Experience
  - EPAM
---

# EPAM Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an EPAM Systems Java Developer interview. The candidate had 3 years of backend development experience. The interview covered a broad range of topics, including Microservices (Saga Pattern), Core Java internals (Serialization, Garbage Collection), Multithreading (Singleton Thread-Safety), and Spring Boot configurations.

---

## 1. Microservices & System Design

### Q: What is the Saga Pattern and how did you use it in your project?
**A:** The Saga pattern is an architectural pattern used to manage data consistency and distributed transactions across multiple independent microservices. 
In a monolithic application, you can use standard ACID database transactions. In microservices, locking multiple databases simultaneously is detrimental to performance. 
* **How it works:** The Saga pattern breaks the global transaction into a sequence of smaller, local transactions. Each microservice executes its local transaction and publishes an event to trigger the next step. If any step fails, the Saga executes a series of **Compensating Transactions** that go back and undo/rollback the previous successful steps, ensuring the system returns to a consistent state without relying on distributed locks.

---

## 2. Core Java & Java 11 Features

### Q: What are some new features introduced in Java 11 that were not present in older versions?
**A:** Java 11 introduced several key enhancements:
* **New HTTP Client API (`java.net.http`):** A modern, feature-rich API that natively supports both synchronous and asynchronous (non-blocking) programming models for HTTP requests, replacing the clunky legacy `HttpURLConnection`.
* **Local-Variable Syntax for Lambda Parameters:** Allows developers to use the `var` keyword inside lambda expression parameters. This makes code cleaner and uniquely allows applying annotations to lambda parameters (e.g., `(@NonNull var x, @Nullable var y) -> x + y`).
* **New String Methods:** Introduced helpful utility methods like `isBlank()`, `strip()`, `stripLeading()`, `stripTrailing()`, and `lines()`.

### Q: What is a Singleton class and how do you create one?
**A:** A Singleton class guarantees that only **one single instance (object)** of the class can be created per JVM, providing a global point of access to it. It is highly useful for managing shared resources like Configuration Managers, Logging Services, or Database Connection Pools.
* **To create it:**
  1. Make the constructor `private` so no external class can use the `new` keyword.
  2. Create a `private static` instance variable of the class itself.
  3. Provide a `public static` method (usually named `getInstance()`) that initializes the instance if it's null and returns it.

### Q: Are Singleton classes thread-safe by default? How do you create a thread-safe Singleton using Double-Checked Locking?
**A:** No, they are not thread-safe by default. If two threads call `getInstance()` simultaneously while the instance is still null, both could instantiate the class, creating two objects and breaking the Singleton rule.
* **Double-Checked Locking:**
  ```java
  public class Singleton {
      // volatile ensures visibility of changes across threads
      private static volatile Singleton instance; 

      private Singleton() {}

      public static Singleton getInstance() {
          if (instance == null) { // First check (no locking)
              synchronized (Singleton.class) {
                  if (instance == null) { // Second check (with locking)
                      instance = new Singleton();
                  }
              }
          }
          return instance;
      }
  }
  ```
  This ensures that the expensive `synchronized` block is only executed during the very first initialization, highly optimizing performance for all subsequent calls.

### Q: Why is the `main` method `public` and `static`? Can we override it?
**A:** * **`public`:** The method must be completely visible to the outside world so the JRE (Java Runtime Environment) can locate and execute it to start the program.
* **`static`:** When the program starts, no objects of the class exist yet. `static` allows the JRE to invoke the method directly using the class name, without needing to instantiate an object first.
* **Overriding:** No, we **cannot override** the `main` method. Method overriding relies on dynamic binding at runtime based on the object instance. Since `main` is static, it belongs to the class itself and is resolved at compile time (this is called Method Hiding, not Overriding). We can, however, *overload* it by passing different parameters.

---

## 3. Serialization & Memory Management

### Q: What is Serialization? Why shouldn't we serialize data into a plain text file?
**A:** Serialization is the process of converting a living Java object's state into a binary byte stream so it can be saved to a database, written to a file, or transmitted over a network. Deserialization reconstructs the object from that stream.
* **Why not a text file:** Serialized data is raw binary. Text files are designed for character encoding (like UTF-8). Saving binary data into a text file can cause encoding conflicts, corrupting the data, making it unreadable, and causing information loss. Binary file extensions (like `.bin` or `.ser`) should be used instead. For human-readable text files, formats like JSON or XML are appropriate.

### Q: What happens if your Serializable class contains a member that is not serializable? How do you fix it?
**A:** If you try to serialize an object that contains a reference to a class that does not implement the `Serializable` interface, Java will instantly throw a **`NotSerializableException`** at runtime.
* **How to fix it:** 1. Have the member class implement `Serializable`.
  2. If you don't control the class or don't want to persist that specific data (like a password), mark the field with the **`transient`** keyword. The JVM will completely ignore transient fields during serialization.

### Q: How does Garbage Collection work in Java? Does the `finalize()` method play a role?
**A:** Garbage Collection (GC) is an automated background daemon thread that manages memory. It periodically scans the Heap memory, identifies objects that are no longer reachable by the application (objects with no active references), and destroys them to free up memory. This prevents memory leaks and removes the need for manual memory deallocation.
* **`finalize()` Role:** It is a legacy method called by the GC right before an object is permanently destroyed, giving the object a final chance to release external resources (like closing network sockets). However, its execution is highly unpredictable, it negatively impacts performance, and it is officially deprecated in modern Java.

### Q: How can Memory Leaks occur in Java even though we have automatic Garbage Collection?
**A:** Memory leaks happen when objects are no longer logically needed by the business application, but they unintentionally still hold active, strong references. Because the references exist, the GC assumes they are still in use and refuses to delete them.
* **Common Causes:**
  1. Storing objects in `static` collections (like `List` or `HashMap`) and forgetting to remove them. Static fields live for the entire lifetime of the JVM.
  2. Unclosed database connections, IO streams, or network sockets.
  3. Unregistered Event Listeners or callbacks that keep UI or background objects alive indefinitely.

---

## 4. Spring Boot & Architecture

### Q: If you observe that a Spring Boot application performs much slower in Production than in Development, what steps would you take?
**A:** 1. **Check Logs:** Investigate the production application logs for silent errors, timeouts, or stack traces.
2. **Monitor Metrics:** Use APM tools (Application Performance Monitoring) or Spring Boot Actuator to track JVM memory usage, garbage collection pauses, CPU load, and specific endpoint response times.
3. **Compare Configurations:** Ensure production configurations (like database connection pool sizes or JVM Heap `-Xmx` settings) are properly tuned for high traffic, unlike the minimal developer machine configs.
4. **Database & External APIs:** Look for missing database indexes that cause full table scans under heavy load, and check if external third-party services are experiencing high latency in the production environment.

### Q: How do you integrate a relational database (like MySQL) with a Spring Boot application?
**A:** 1. Add the database driver dependency (`mysql-connector-java`) and the Spring Data JPA starter (`spring-boot-starter-data-jpa`) to the `pom.xml`.
2. Configure the connection details (Database URL, username, password, driver-class-name) inside the `application.properties` or `.yml` file.
3. Create Entity classes annotated with `@Entity`.
4. Create Repository interfaces extending `JpaRepository`.
5. Inject these repositories into your Service layer to perform CRUD operations without writing manual SQL queries.

### Q: How would you modify an existing Spring Boot application to convert it into a Serverless architecture?
**A:** To transition to Serverless (where you pay per execution rather than running a constant server):
1. Break down the monolithic logic into highly independent, small, single-purpose functions.
2. Remove the heavy embedded server dependency (like Tomcat).
3. Utilize frameworks like **Spring Cloud Function** to wrap the business logic into standard functional interfaces (`Function`, `Supplier`, `Consumer`).
4. Containerize the functions or deploy them directly to a serverless platform (like AWS Lambda or Azure Functions) using cloud-specific adapters, configuring API Gateways to trigger them.

### Q: How does Spring Boot make the decision on which embedded server to use?
**A:** Spring Boot decides strictly based on the **Classpath Dependencies**. 
By default, `spring-boot-starter-web` includes the Tomcat dependency, so Spring Boot auto-configures an embedded Tomcat server. If you want to use a different server, you exclude Tomcat from the `pom.xml` and add the dependency for Jetty or Undertow instead. Spring Boot detects the new dependency on the classpath and auto-configures that specific server automatically.

### Q: How do you handle Exceptions in a Spring Boot REST application?
**A:** I use a global, centralized approach:
1. Create custom exception classes (e.g., `UserNotFoundException`) for specific business errors.
2. Create a global error handling class annotated with **`@ControllerAdvice`** (or `@RestControllerAdvice`).
3. Define methods inside it annotated with **`@ExceptionHandler(CustomException.class)`**.
4. Inside these methods, construct a standardized JSON error response (containing an error message, timestamp, and the exact HTTP Status Code like 404 or 400).
5. Return the JSON payload wrapped in a `ResponseEntity`. This ensures clean controllers and uniform API error responses.

### Q: How can we handle multiple Beans of the same type being injected?
**A:** When Spring finds multiple beans implementing the same interface, `@Autowired` gets confused and throws a `NoUniqueBeanDefinitionException`. You can fix this by:
1. Using the **`@Primary`** annotation on one of the bean definitions to mark it as the default, preferred choice.
2. Using the **`@Qualifier("specificBeanName")`** annotation alongside `@Autowired` at the injection point to explicitly tell Spring exactly which bean instance to inject.

### Q: What is Aspect-Oriented Programming (AOP) in the Spring Framework?
**A:** AOP is a programming paradigm that separates **"cross-cutting concerns"** from the main core business logic. Cross-cutting concerns are generic tasks that happen across the entire application, such as Logging, Security/Authorization, and Transaction Management.
Instead of copy-pasting the same logging or security code inside 50 different controller methods, AOP allows you to define this logic exactly once in an **Aspect**, and use Pointcuts to define dynamically where and when this logic should be applied. This keeps the primary business code perfectly clean and focused on its main task.
