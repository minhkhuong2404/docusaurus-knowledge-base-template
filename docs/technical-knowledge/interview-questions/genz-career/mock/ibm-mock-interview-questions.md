---
id: ibm-java-springboot-interview-3-years
title: IBM 3 Years Interview Experience | Java Spring Boot
description: A comprehensive collection of real interview questions and answers from an IBM Java Developer interview. Ideal for candidates with ~3 years of experience, covering Java 11 features, Microservices (Saga), Spring Boot Internals, and SOLID principles.
tags:
  - Java
  - Spring Boot
  - Microservices
  - SOLID Principles
  - Interview Experience
  - IBM
---

# IBM Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an IBM Java Developer interview. The candidate had 3 years of backend development experience. The interview extensively covered architectural decisions (Monolith vs. Microservices, Saga Pattern), deep Core Java concepts (Java 8 & 11 features, Thread communication), Design Patterns, and Spring Boot configuration.

---

## 1. Architecture & Microservices

### Q: Why was a Microservices architecture preferred over a Monolithic architecture for your retail banking project?
**A:** We transitioned to Microservices because it allowed us to split a massive, tightly coupled system into smaller, independent, and manageable components. 
* **Benefits:** It made it far easier for different teams to develop, test, and deploy specific parts of the application concurrently. It provided **Fault Isolation**—if the transaction service failed, the user account management service would remain online. Finally, it allowed us to scale specific high-traffic services independently and adopt newer technologies without having to rewrite the entire legacy monolith.

### Q: What is the Saga Pattern and why did you use it?
**A:** The Saga Pattern is an architectural pattern used to manage data consistency and distributed transactions across multiple independent microservices. 
In a monolithic application, you can easily use traditional ACID database transactions. In microservices, spanning a single transaction across multiple databases causes severe performance bottlenecks. 
* **How it works:** The Saga pattern breaks the global transaction into a sequence of smaller, local transactions. Each microservice executes its step and publishes an event to trigger the next. If any step in the chain fails, the Saga executes **Compensating Transactions**—a series of undo operations that step backward to revert the previously successful local transactions, ensuring the overall system returns to a consistent state.

---

## 2. Core Java & Version Features

### Q: What are some new features introduced in Java 11 that were not present in older versions?
**A:** Java 11 introduced several important features:
1. **New HTTP Client API (`java.net.http`):** A modern API that replaces the legacy `HttpURLConnection`. It natively supports both synchronous and asynchronous (non-blocking) programming models and HTTP/2.
2. **Local-Variable Syntax for Lambda Parameters:** Allows developers to use the `var` keyword inside lambda expression parameters (e.g., `(@NonNull var x, var y) -> x + y`). This uniquely allows annotations to be applied to lambda parameters while keeping the code concise.
3. **New String Methods:** Introduced helpful utility methods like `isBlank()`, `strip()`, `stripLeading()`, `stripTrailing()`, and `lines()`.

### Q: Explain the difference between `String` and `StringBuffer`. Why is `StringBuffer` called mutable?
**A:** * **`String`:** Strictly **immutable**. Once a String is created, its internal value cannot change. Any modification (like concatenation) forces Java to allocate memory and create a completely new `String` object, leaving the original untouched.
* **`StringBuffer`:** **Mutable** and thread-safe. Its internal text array can be dynamically altered (characters added, removed, or replaced) without constantly creating new objects. It is highly preferred for scenarios involving heavy, repetitive string modifications in loops, as it is much faster and highly memory-efficient.

### Q: What are the different ways to create an object in Java?
**A:** There are five primary ways to create an object in Java:
1. **Using the `new` keyword:** The standard and most common approach.
2. **Using Reflection:** `Class.forName("ClassName").newInstance()` or utilizing the `Constructor` class. Useful when the class type is only known at runtime.
3. **Using the `clone()` method:** Creates an exact copy of an existing object (requires implementing the `Cloneable` interface).
4. **Using Deserialization:** Reconstructs an object from a saved byte stream (file or network) without invoking the constructor.
5. **Using Factory Methods:** Design patterns like Factory or Builder where the `new` keyword is hidden from the client.

### Q: Can you use a `private` constructor? Where is it used?
**A:** Yes, a constructor can be marked as `private`. This strictly prevents any external class from instantiating the object using the `new` keyword.
* **Use Cases:** It is primarily used to implement the **Singleton Design Pattern** (guaranteeing only one instance of the class can exist globally). It is also heavily used in **Utility Classes** (like `java.lang.Math` or `StringUtils`) that contain only `static` fields and methods, actively preventing developers from senselessly creating objects of a class that holds no state.

### Q: What methods do threads use to communicate with each other?
**A:** Threads communicate using three primary methods provided by the `Object` class. **These must strictly be called from within a `synchronized` context:**
* **`wait()`:** Causes the current thread to immediately release the object's monitor lock and pause execution until another thread signals it to wake up.
* **`notify()`:** Wakes up exactly one single thread that is currently waiting on that specific object's monitor.
* **`notifyAll()`:** Wakes up all threads that are currently waiting on that object's monitor.

### Q: Explain the changes in the internal working of `HashMap` introduced in Java 8.
**A:** Before Java 8, when hash collisions occurred (multiple different keys generating the same hash code and routing to the same array bucket), `HashMap` stored the colliding entries in a basic Linked List. Under heavy collisions, searching this list degraded performance to $O(n)$.
* **Java 8 Optimization:** When the number of elements in a single bucket reaches a specific threshold (typically 8 elements), the `HashMap` automatically transforms that Linked List into a balanced **Red-Black Tree**. This drastically optimizes worst-case search performance in heavily collided buckets, improving it from $O(n)$ to $O(\log n)$.

### Q: Why were `default` methods introduced in Java 8 interfaces?
**A:** They were introduced strictly to enable **Backward Compatibility**. Before Java 8, if you added a new method to an existing interface, you would instantly break every single class that implemented it, forcing massive code rewrites. 
By using the `default` keyword, developers can add new methods *with a default implementation body* directly inside the interface. Legacy classes will continue to compile and function perfectly using the default behavior, while new classes can choose to override it. This was critical for upgrading the Java Collections API to support Lambda expressions.

### Q: Why was the `Optional` class introduced in Java 8?
**A:** It was introduced as a robust, functional solution to the infamous `NullPointerException`. `Optional` acts as a container/wrapper object that may or may not contain a non-null value. Instead of returning `null` (which the caller might forget to check), an API returns an `Optional`. This visually and programmatically forces the developer to explicitly handle the scenario where the value is absent, eliminating ugly boilerplate `if (obj != null)` checks.

---

## 3. Spring Boot & Design Patterns

### Q: What is a "Starter" dependency in a Spring Boot application?
**A:** A Starter is a highly convenient dependency descriptor (a bundle) provided by Spring Boot. Instead of manually hunting down and adding dozens of individual, version-compatible libraries (like Spring MVC, Jackson, Tomcat, and validation tools), you simply add one starter, such as `spring-boot-starter-web`. It automatically brings in the entire stack of necessary dependencies, guaranteeing version compatibility and drastically speeding up project setup.

### Q: How do you connect a database to a Spring Boot application?
**A:** 1. Add the relevant starter dependency (e.g., `spring-boot-starter-data-jpa`) and the specific database driver (e.g., `mysql-connector-java` or `postgresql`) to the `pom.xml`.
2. Open the `application.properties` or `application.yml` file.
3. Define the connection properties: `spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password`, and the specific `driver-class-name`.
4. Spring Boot reads these properties at startup and automatically provisions the `DataSource` and connection pools (HikariCP) in the background.

### Q: What are the different types of Bean Scopes available in Spring?
**A:** The Spring framework supports five primary bean scopes:
1. **Singleton (Default):** Only one single instance of the bean is created per Spring IoC container.
2. **Prototype:** A brand new instance is created every single time the bean is requested from the container.
3. **Request:** One instance is created per HTTP request lifecycle (Web-aware only).
4. **Session:** One instance is created per user HTTP session (Web-aware only).
5. **Application:** One instance is created per ServletContext (Web-aware only).

### Q: Does the Singleton pattern affect Unit Tests?
**A:** Yes, significantly. Because a Singleton maintains a global, shared state across the entire JVM lifecycle, it makes writing independent unit tests very difficult. If Test A modifies the internal state of the Singleton, Test B will execute using that polluted state, leading to unpredictable, brittle tests. It also makes it extremely difficult to mock dependencies, heavily violating the principle of test isolation.

### Q: Explain the SOLID principles.
**A:** SOLID is an acronym representing five foundational design principles for writing clean, scalable, and maintainable Object-Oriented software:
* **S - Single Responsibility Principle:** A class should have one, and only one, distinct job or reason to change.
* **O - Open/Closed Principle:** Software entities (classes/modules) should be open for extension (adding new functionality) but strictly closed for modification (altering existing, tested source code).
* **L - Liskov Substitution Principle:** Objects of a superclass must be 100% replaceable with objects of its subclasses without breaking the application's correctness.
* **I - Interface Segregation Principle:** No client should be forced to depend on methods it does not use. It is far better to create multiple small, highly specialized interfaces rather than one massive, generic interface.
* **D - Dependency Inversion Principle:** High-level policy modules should not depend on low-level implementation modules. Both should depend on abstractions (interfaces).