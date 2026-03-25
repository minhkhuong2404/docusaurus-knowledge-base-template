---
id: walmart-java-developer-interview-30lpa
title: Walmart Java Developer Interview Experience & Questions [30 LPA+]
description: A detailed collection of real interview questions and answers from a Walmart Java Developer interview. Ideal for candidates with 3+ years of experience, covering DSA, Core Java, System Design, Spring Boot, and Kafka.
tags:
  - Java
  - Spring Boot
  - System Design
  - Microservices
  - Kafka
  - Interview Experience
  - Walmart
---

# Walmart Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Walmart Java Developer interview. The candidate had 3+ years of experience. The interview process was rigorous, consisting of three rounds: a pure coding round on LeetCode, an extensive technical core concept round, and a final techno-managerial round focusing on architecture and behavioral scenarios.

---

## Round 1: Coding & Data Structures

### Q: Perform standard operations on a Binary Search Tree (BST).
**A:** *This was a live coding round on an online editor.* The candidate was asked to write a complete Java program from scratch to implement a Binary Search Tree and write methods for the following operations:
1. Insert a Node.
2. Delete a Node.
3. Find the Maximum and Minimum elements.
4. Perform an In-Order Traversal (which should print the elements in ascending sorted order).

---

## Round 2: Core Technical & Frameworks

### Q: Explain OOPs and the 4 main principles.
**A:** Object-Oriented Programming (OOP) is a programming paradigm based on objects and classes. It organizes software design around data rather than logic. The four main principles are:
1. **Encapsulation:** Hiding internal state and requiring all interaction to be performed through an object's methods.
2. **Abstraction:** Hiding complex implementation details and showing only the essential features of the object.
3. **Inheritance:** Allowing a new class to adopt the properties and behaviors of an existing class.
4. **Polymorphism:** Allowing a single interface or method to represent different underlying forms (Method Overloading and Overriding).

### Q: Why do we need Encapsulation and Abstraction? Explain with a scenario.
**A:** * **Encapsulation** protects data integrity. For example, in a `BankAccount` class, making the `balance` field `private` ensures that external code cannot arbitrarily change the balance. It must be updated safely via a `deposit()` or `withdraw()` method containing validation logic.
* **Abstraction** reduces cognitive load and hides complexity. For example, a `Car` interface might expose a `startEngine()` method. The driver (the client code) just calls `startEngine()` and doesn't need to know the complex internal fuel-injection mechanisms.

### Q: What is a Thread Pool?
**A:** A thread pool is a managed group of pre-instantiated, reusable worker threads waiting to execute tasks. Instead of spinning up a brand new thread for every single background task (which is heavily resource-intensive and can crash the JVM under high load), tasks are submitted to the pool. When a thread finishes a task, it returns to the pool to pick up the next one, massively improving performance and stability.

### Q: Explain Object-Level Thread Locks.
**A:** Object-level locking (achieved using a `synchronized` instance method or block) ensures that only one single thread can execute a synchronized block of code on a **specific instance** of an object at any given time. If Thread A holds the lock on `object1`, Thread B must wait. However, Thread B is perfectly free to acquire a lock on `object2` simultaneously. It protects the specific shared state of that individual object instance.

### Q: Explain the SOLID principles.
**A:** The SOLID principles are five design rules for writing clean, scalable object-oriented code:
* **S (Single Responsibility):** A class should only have one single job or reason to change.
* **O (Open/Closed):** Code should be open for extension (adding new features) but closed for modification (changing existing, tested code).
* **L (Liskov Substitution):** Child subclasses must be 100% substitutable for their parent classes without breaking application behavior.
* **I (Interface Segregation):** It is better to have multiple small, highly specific interfaces rather than one massive, generic "fat" interface.
* **D (Dependency Inversion):** High-level modules should depend on abstractions (interfaces), not on concrete low-level implementations.

### Q: Explain the Singleton design pattern and when you would use it.
**A:** The Singleton pattern ensures that a class has exactly **one instance** globally and provides a unified point of access to it. 
**Use Case:** It is highly ideal for managing heavy, shared resources where multiple instances would cause data inconsistency or unnecessary memory overhead. Examples include Database Connection Pools, global Configuration Managers, or centralized Logging services.

### Q: What are the new features introduced in Java 8?
**A:** * **Lambda Expressions:** Enabled functional, highly concise code.
* **Stream API:** Allowed pipeline-style, efficient processing of Collections.
* **Functional Interfaces:** Interfaces with exactly one abstract method (like `Runnable` or `Predicate`).
* **Default & Static Methods:** Allowed adding method implementations inside interfaces without breaking legacy code.
* **`Optional` Class:** A container object used to handle nulls safely and avoid `NullPointerException`.
* **New Date/Time API (`java.time`):** A modern, thread-safe date manipulation library.

### Q: What is the `@Autowired` annotation? How would you inject dependencies without it?
**A:** `@Autowired` is a Spring annotation that performs automatic dependency injection. It tells the Spring IoC container to find the matching bean in the context and automatically assign it to the annotated field, constructor, or setter method.
**Without it:** You can achieve dependency injection entirely without annotations by using **Constructor Injection**. If a Spring component has only one constructor, Spring implicitly auto-wires the required dependencies into that constructor without explicitly needing the `@Autowired` tag. 

### Q: Explain the `@Qualifier` annotation.
**A:** `@Qualifier` is used alongside `@Autowired` to resolve bean ambiguity. If you have an interface with two different implementation beans in the Spring context, Spring gets confused about which one to inject. You use `@Qualifier("specificBeanName")` to tell Spring exactly which implementation instance to use.

### Q: Difference between SQL and NoSQL databases?
**A:** * **SQL:** Relational databases (like MySQL, PostgreSQL). They use strictly predefined schemas, organize data into tables with rows and columns, and are ideal for highly structured data requiring strict ACID transaction guarantees.
* **NoSQL:** Non-relational databases (like MongoDB, Cassandra). They are schema-less (or use flexible schemas), store data as documents, key-value pairs, or graphs, and are designed for massive horizontal scalability and handling unstructured data.

### Q: Explain Master-Slave Architecture and its use case.
**A:** It is a database architecture pattern designed to scale read-heavy applications. 
* The **Master** node handles 100% of the write/update operations.
* The **Slave** nodes continuously replicate the data from the Master and exclusively handle read operations.
**Use Case:** It distributes network load, drastically improving read performance while maintaining a single source of truth for writes.

### Q: Follow-up: What happens if the Master dies or a Slave dies?
**A:** * **If Master dies:** The system temporarily loses the ability to perform write operations. A failover mechanism (like a sentinel) must immediately promote an up-to-date Slave to become the new Master to restore write capabilities.
* **If a Slave dies:** The system continues functioning normally. The Master and remaining Slaves simply absorb the routing of the read traffic, though overall read latency might slightly increase.

### Q: How do you ensure your running microservices are healthy and active?
**A:** By exposing standard health-check endpoints. In Spring Boot, we use **Spring Boot Actuator** which exposes the `/actuator/health` endpoint. For distributed systems, we monitor these endpoints in real-time using tools like **Prometheus and Grafana**, or rely on a Service Registry (like Eureka) which tracks the active heartbeats of all registered microservices.

### Q: Explain Load Balancer and Rate Limiter.
**A:** * **Load Balancer:** Sits in front of your servers and distributes incoming network traffic evenly across multiple backend server instances. This ensures no single server becomes overwhelmed, maximizing uptime and availability.
* **Rate Limiter:** Acts as a gateway gatekeeper. It controls the absolute number of requests a specific user or IP address can make to an API within a defined time window (e.g., 100 requests per minute). It prevents abuse, scraping, and DDoS attacks.

### Q: Write an SQL query to find the total amount spent by each customer.
**A:** ```sql
SELECT customer_id, SUM(amount) AS total_spent 
FROM orders 
GROUP BY customer_id;