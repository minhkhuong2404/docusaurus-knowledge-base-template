---
id: deloitte-java-developer-interview-questions
title: Deloitte Java Developer Interview Experience & Questions [3 Technical Rounds]
description: A comprehensive guide covering real technical interview questions and answers from a Deloitte Java Developer interview (4 years experience). Covers Core Java, Concurrency, Spring Boot, Microservices, and System Design.
tags:
  - Java
  - Spring Boot
  - Concurrency
  - Microservices
  - System Design
  - Interview Experience
  - Deloitte
---

# Deloitte Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Deloitte Java Developer interview for a candidate with 4 years of experience. The interview process consisted of three intensive technical rounds covering Core Java, Concurrency, Spring Boot, Microservices, and System Design principles.

---

## Round 1: Core Java & Object-Oriented Programming (90 Minutes)

### Q: What is the difference between Abstraction and Interface, and when should you use them?
**A:** * **Abstract Class:** Can contain both abstract (unimplemented) and non-abstract (implemented) methods, as well as state (instance variables). 
  * *When to use:* Use when closely related classes need to share common code, state, or lifecycle behavior.
* **Interface:** Historically contains only method declarations and constants (`public static final`). 
  * *When to use:* Use when unrelated classes need to abide by a strict common contract or behavior without sharing any hierarchical relationship.

### Q: What is the difference between Java 7 and Java 8 interfaces? Why were default and static methods introduced?
**A:** * **Java 7:** Interfaces could only have `public abstract` methods. They strictly defined *what* to do, not *how*.
* **Java 8:** Interfaces can now have `default` and `static` methods with actual implementations.
  * *Why `default`?* To allow developers to add new methods to existing interfaces without breaking the legacy classes that already implement them (backward compatibility).
  * *Why `static`?* To provide utility or helper methods directly related to the interface, removing the need for separate utility classes (like `Collections` vs `Collection`).

### Q: Explain the contract between the `equals` and `hashCode` methods.
**A:** The contract states:
1. If two objects are equal according to the `equals()` method, their `hashCode()` method **must** return the exact same integer value.
2. If two objects return the same `hashCode()`, they are **not necessarily** equal (this is a hash collision).
3. If you override `equals()`, you must always override `hashCode()` to maintain this contract, otherwise hash-based collections (like `HashMap`) will fail to retrieve stored objects.

### Q: What is an Exception? Why are Checked Exceptions called "compile-time exceptions"? Do they actually occur at compile time?
**A:** An exception is an unexpected event that disrupts the normal flow of the program (e.g., File Not Found, DB Connection Timeout).
* **"Compile-time exceptions":** Checked exceptions are called this because the Java compiler *forces* the developer to handle them (using `try-catch` or `throws`) during compilation. 
* **Occurrence:** They absolutely do **not** occur at compile time. All exceptions physically occur at **runtime**. The compiler merely checks that a safety net is in place.

### Q: What is the difference between the `throw` and `throws` keywords?
**A:** * **`throw`:** Used *inside* the method body to explicitly trigger and throw an actual exception object (e.g., `throw new IllegalArgumentException();`).
* **`throws`:** Used in the method *signature/declaration* to warn callers that this method might throw one or more exceptions, forcing the caller to handle them.

### Q: Why is `String` immutable in Java, and how does immutability improve security?
**A:** `String` is immutable meaning once the object is created in memory, its value cannot be changed. Any modification creates a brand new `String` object.
* **Security:** Sensitive data like database URLs, usernames, passwords, and network ports are passed as Strings. If Strings were mutable, a malicious piece of code could intercept and change the memory reference of the URL or password after authentication has passed, completely compromising the system.

### Q: What is the difference between `Comparable` and `Comparator`?
**A:** * **`Comparable`:** Used to define the *single, natural sorting order* of an object. The class itself implements it and overrides the `compareTo()` method.
* **`Comparator`:** Used to define *multiple, custom sorting orders* externally. You create separate classes (or Lambdas) that implement it and override the `compare()` method.

### Q: What does the `@SpringBootApplication` annotation do? What alternatives are available if we don't use it?
**A:** It is a shortcut annotation that combines three core annotations: `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. It automatically sets up the Spring context and discovers beans.
* **Alternative:** If you don't use it, you must explicitly declare those three individual annotations on your main startup class to achieve the exact same effect.

### Q: What are Microservices and how do they communicate with each other?
**A:** Microservices is an architectural style where a large, monolithic application is broken down into small, independently deployable services that own their own data.
* **Communication:** They communicate synchronously using HTTP REST APIs (or gRPC), or asynchronously using message brokers like Apache Kafka or RabbitMQ.

### Q: Coding Question: Detect a cycle in a Linked List using the Fast and Slow pointer approach.
*(Standard algorithmic problem known as Floyd’s Cycle-Finding Algorithm. The slow pointer moves 1 step, the fast pointer moves 2 steps. If they meet, a cycle exists).*

---

## Round 2: Concurrency, Multithreading & Spring Boot (1 Hour 45 Mins)

### Q: What is the difference between a Process and a Thread?
**A:** * **Process:** An independent running program in the OS. It has its own dedicated memory space and resources (e.g., launching Google Chrome).
* **Thread:** The smallest unit of execution *inside* a process. Multiple threads live within the same process and share its memory space (e.g., multiple tabs running concurrently in Chrome).

### Q: What is the difference between Multitasking and Multithreading?
**A:** * **Multitasking:** The OS running multiple independent processes simultaneously (e.g., running Chrome, Spotify, and an IDE at the same time).
* **Multithreading:** Executing multiple threads simultaneously within a *single* process to maximize CPU utilization.

### Q: What is `Future` in Java? What is the difference between `Callable` and `Runnable`?
**A:** * **`Future`:** An interface that acts as a placeholder for a result of an asynchronous task that is executing in a different thread. You can check if the task is done and retrieve the result later using `.get()`.
* **`Runnable`:** Represents a task. Its `run()` method returns `void` and cannot throw checked exceptions.
* **`Callable`:** Represents a task. Its `call()` method returns a result and can throw checked exceptions.

### Q: How is concurrency achieved in Java? What are Virtual Threads and the `volatile` keyword?
**A:** * **Concurrency:** Achieved using the `Thread` class, `Runnable`, the `Executor` framework (Thread Pools), and synchronization mechanisms (`synchronized`, Locks, Atomics).
* **Virtual Threads:** Introduced in Java 21, these are incredibly lightweight threads managed by the JVM (not the OS), allowing applications to handle millions of highly concurrent tasks with minimal memory overhead.
* **`volatile`:** A keyword ensuring memory visibility. It forces threads to read and write a variable directly from Main Memory rather than the CPU cache.

### Q: Explain the Producer-Consumer problem.
**A:** A classic concurrency synchronization problem. One thread (Producer) generates data and puts it into a shared buffer/queue. Another thread (Consumer) takes data from the buffer. The challenge is ensuring the Producer waits if the buffer is full, and the Consumer waits if the buffer is empty. This is solved using `wait()`/`notify()`, or safely utilizing `BlockingQueue` interfaces.

### Q: What happens in a `ThreadPoolExecutor` when the queue is full?
**A:** If the core threads are busy and the work queue becomes completely full, the Executor will attempt to spawn new temporary threads up to the `maximumPoolSize`. If the maximum limit is also reached, the Executor will reject the task based on its configured `RejectedExecutionHandler` policy (e.g., throwing a `RejectedExecutionException` or running the task on the caller's thread).

### Q: Why choose Spring Boot over the standard Spring Framework?
**A:** Spring Boot eliminates the massive XML/Java boilerplate configuration required by standard Spring. It provides Auto-Configuration, embedded servers (Tomcat/Jetty), and Starter POMs, allowing developers to build and run production-ready applications in minutes.

### Q: What is Bean Ambiguity? How do `@Primary` and `@Qualifier` solve it?
**A:** Bean ambiguity occurs when multiple beans of the exact same type exist in the Spring context, and Spring doesn't know which one to `@Autowire`.
* **`@Primary`:** Marks one specific bean as the default choice globally if no other instructions are given.
* **`@Qualifier("beanName")`:** Used at the injection point to explicitly specify exactly which bean to inject by its name, overriding `@Primary`.

### Q: What happens if you inject a `Prototype` bean into a `Singleton` bean? How do you overcome this?
**A:** When a Prototype bean is injected into a Singleton bean, the Prototype is instantiated only *once* during the Singleton's creation. Therefore, every time the Singleton is used, it uses the exact same Prototype instance, defeating the purpose of the Prototype scope.
* **Solution:** To get a fresh instance every time, use `@Lookup`, inject an `ObjectFactory<PrototypeBean>`, or utilize Method Injection (`@Lookup` annotation on a method).

### Q: Explain Kafka Partitions and Offsets. How long can a message stay in Kafka?
**A:** * **Partition:** A topic is divided into partitions to allow data to be processed in parallel across multiple consumer nodes.
* **Offset:** A unique, sequential ID assigned to each message as it arrives in a partition.
* **Retention:** Kafka does not delete messages immediately after they are read. Messages stay in Kafka based on configuration policies (either time-based, like 7 days, or size-based).

---

## Round 3: Design Principles & Cloud Technologies (80 Minutes)

### Q: Explain the SOLID principles.
**A:** Five design principles for clean OOP code:
* **S (Single Responsibility):** A class should only have one reason to change.
* **O (Open/Closed):** Software entities should be open for extension but closed for modification.
* **L (Liskov Substitution):** Child classes must be completely substitutable for their base classes without altering correctness.
* **I (Interface Segregation):** Do not force classes to implement massive interfaces they do not use; split them up.
* **D (Dependency Inversion):** Depend on abstractions (interfaces), not concrete implementations.

### Q: What is the DRY principle?
**A:** **Don't Repeat Yourself.** It dictates that every piece of knowledge or logic must have a single, unambiguous representation within a system. Duplication leads to bugs when changes are required.

### Q: Explain Microservices design patterns: Circuit Breaker, Retry, and Fallback.
**A:** * **Circuit Breaker:** Monitors external calls. If a downstream service fails repeatedly, the circuit "opens" and blocks all further calls instantly to prevent system exhaustion and cascading failures.
* **Retry:** Automatically attempts the failed network call again, usually with an exponential backoff, handling temporary network glitches.
* **Fallback:** If the primary call fails or the circuit is open, the fallback method is triggered to return a default response, a cached value, or an error message to ensure the user still receives a graceful response.

### Q: Discuss Cloud Technologies: EC2, SNS, and SQS.
**A:** * **EC2 (Elastic Compute Cloud):** Amazon's virtual servers in the cloud used to deploy and run applications.
* **SNS (Simple Notification Service):** A highly available Pub/Sub messaging service. It pushes messages immediately to multiple subscribed endpoints (like email, SMS, or SQS queues).
* **SQS (Simple Queue Service):** A fully managed message queuing service that decouples microservices. Services push messages into the queue, and consumer services poll and process them asynchronously at their own pace.