---
id: accenture-java-developer-interview-questions
title: Accenture Java Developer Interview Experience & Questions
description: A detailed collection of technical interview questions and answers from a real Accenture Java Developer interview, covering Core Java, Spring Boot, and Microservices.
tags:
  - Java
  - Spring Boot
  - Microservices
  - OOPs
  - Interview Experience
---

# Accenture Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an Accenture Java Developer interview for a candidate with 3 years of experience. The interview covered Core Java, Object-Oriented Programming (OOPs), Spring Boot, and Microservices architecture.

---

## 1. Core Java & Collections Framework

### Q: What is the difference between `Collection` and `Collections`?
**A:** * **`Collection`:** It is a core interface in Java used to hold and manipulate a group of objects (like a toolbox for managing items). 
* **`Collections`:** It is a utility class (helper tool) that provides static methods to organize, sort, search, and manage elements within those collection groups.

### Q: What is the difference between `ArrayList` and `LinkedList`, and in which scenarios would you use each?
**A:** * **`ArrayList`:** Backed by a dynamic array. It allows quick random access ($O(1)$) to elements, making it ideal for lists where read operations are frequent.
* **`LinkedList`:** Backed by a doubly-linked list. It allows fast insertions and deletions ($O(1)$) at the ends or in the middle (once the node is found) without shifting elements. It is ideal when you frequently add or remove data.

### Q: If you try to insert an element into the middle of a `LinkedList` with 10 million elements, how will it perform compared to an `ArrayList`?
**A:** Inserting into the middle of a massive `LinkedList` can be surprisingly slow because it must traverse sequentially from the start to reach the middle node ($O(n)$ access time). An `ArrayList` provides direct $O(1)$ access to the index, making reaching the midpoint instantaneous, even though it still requires shifting elements afterwards.

### Q: Explain the difference between `HashMap` and `Hashtable`.
**A:** * **`HashMap`:** Not thread-safe, allows one `null` key and multiple `null` values, and is highly performant in single-threaded environments.
* **`Hashtable`:** Thread-safe, does not allow any `null` keys or values, and is much slower due to legacy synchronization techniques.

### Q: Why would using a `Hashtable` lead to potential issues in a highly concurrent environment, even though it is synchronized?
**A:** `Hashtable` uses method-level synchronization, meaning it locks the entire map for every single read or write operation. In a highly concurrent environment, this causes a severe bottleneck and significant slowdowns as threads wait for the lock. Modern concurrent applications should use `ConcurrentHashMap`, which uses fine-grained segment locking for better efficiency.

### Q: How would you design a custom immutable class that uses a collection like `ArrayList` internally?
**A:** 1. Declare the class as `final` so it cannot be extended.
2. Make the `ArrayList` field `private` and `final`.
3. Initialize the list strictly via the constructor.
4. Do not provide setter methods.
5. In the getter method, return a **deep copy** of the list or an **unmodifiable view** (using `Collections.unmodifiableList()`) to prevent external code from mutating the internal collection.

### Q: What happens if you add elements to a `HashSet` with duplicate `hashCode` values but different `equals` implementations?
**A:** Both elements are successfully stored. A `HashSet` uses the `hashCode()` to determine the bucket location. When two objects share a hash code (a hash collision), they go to the same bucket. The set then uses the `equals()` method to check if they are identical. Since `equals` returns false, Java keeps both objects separately in that same bucket (usually as a linked list or tree).

---

## 2. Object-Oriented Programming (OOPs)

### Q: What is the purpose of a Constructor? Can a Constructor be `static` or `final`?
**A:** A constructor initializes a newly created object, setting up its initial state.
* It cannot be **`static`** because it is explicitly called during object instantiation, not on the class itself.
* It cannot be **`final`** because constructors are not inherited by subclasses, meaning there is no need to restrict overriding.

### Q: Can a Constructor have a return type? What would it mean if it did?
**A:** No, a constructor cannot have a return type. If you provide a return type (even `void`), Java treats it as a standard method that just happens to share the class name, entirely losing its constructor property.

### Q: Can a Constructor be inherited? If not, can it still be called in a subclass?
**A:** Constructors are not inherited. Each class must define its own constructors. However, a superclass constructor can (and often must) be invoked from a subclass using the `super()` method. This is done to properly initialize the parent class's state before configuring the child's properties.

### Q: Can you create an object of an abstract class? Can you create a reference variable of it?
**A:** You cannot directly instantiate (create an object of) an abstract class because it is incomplete by design. However, you **can** create a reference variable of an abstract class type and point it to an instance of a concrete subclass. This is a core pillar of polymorphism.

### Q: Explain the concept of Coupling and Cohesion in OOP.
**A:** * **Coupling:** Refers to how strongly dependent modules or classes are on each other. Low/loose coupling is ideal for easier maintenance and testing.
* **Cohesion:** Describes how closely related and focused the responsibilities of a single module are. High cohesion is ideal for code clarity and reusability (doing one thing perfectly).

### Q: Can you have low coupling and low cohesion at the same time? Provide an example.
**A:** Yes. Imagine a single `Utility` class that formats dates, sends emails, and calculates taxes. It has **low cohesion** because these responsibilities are completely unrelated. However, if it does not depend on external services or other internal classes, it still exhibits **low coupling**.

---

## 3. Spring Boot & Microservices

### Q: What is the difference between Spring and Spring Boot?
**A:** * **Spring:** A comprehensive framework providing infrastructure support (like Dependency Injection and MVC) for developing Java apps, but it requires extensive XML or Java-based configuration and manual server setup.
* **Spring Boot:** Built on top of the Spring framework, it simplifies development through auto-configuration, starter POMs, and embedded servers (like Tomcat). It gets applications running quickly with minimal boilerplate.

### Q: What are Actuators in Spring Boot?
**A:** Spring Boot Actuators provide production-ready features to monitor and manage applications. They expose HTTP endpoints that allow you to check application health, view metrics, analyze environment properties, and inspect configuration details in real-time.

### Q: How do you ensure compatibility when upgrading to the latest version of Spring Boot?
**A:** Thoroughly test the application, review the official Spring migration guides and release notes for breaking changes, systematically update dependencies (Maven/Gradle), and adjust any deprecated configurations or code logic as required.

### Q: Can Spring Boot's built-in caching be used in a distributed system?
**A:** The default in-memory caching is not suitable for distributed systems. However, Spring Boot caching can easily be used in a distributed environment by integrating it with centralized cache providers like **Redis** or **Hazelcast**. These tools manage caching across multiple instances, ensuring data consistency.

### Q: What are the ways to implement security using Spring Security?
**A:** Spring Security provides authentication, authorization, and protection against common exploits. Ways to implement it include: Form-based authentication, OAuth2, JWT (JSON Web Tokens) for stateless APIs, LDAP integration, and method-level security using annotations like `@PreAuthorize`.

### Q: How do microservices communicate with each other?
**A:** * **Synchronous Communication:** Using lightweight protocols like HTTP/REST (via RestTemplate, WebClient, or OpenFeign).
* **Asynchronous Communication:** Using messaging message brokers like RabbitMQ or Apache Kafka to decouple services and process events in the background.

### Q: What happens if you use synchronous communication for critical microservices with varying latencies? What is the alternative?
**A:** Using synchronous REST calls between microservices with unpredictable latencies can lead to cascading delays, thread pool exhaustion, and systemic timeouts, severely impacting reliability. 
**Alternative:** Use **Asynchronous Messaging** (Event-Driven Architecture). This decouples services, allowing the caller to drop a message in a queue without waiting for an immediate response, highly improving system resilience.

### Q: What is the `@SpringBootApplication` annotation? Can you run an app without it?
**A:** `@SpringBootApplication` is a convenience annotation that wraps three core annotations: `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. 
Yes, you can remove it and manually add those three specific annotations to your main class, and the application will still boot up correctly.

### Q: What testing tools do you prefer for your projects?
**A:** * **JUnit:** For standard unit testing.
* **Mockito:** For mocking external dependencies and isolating business logic.
* **Selenium:** For automated end-to-end web testing.
* **JMeter:** To simulate user loads and measure application performance/stress capacity.

### Q: What is the difference between RESTful services and SOAP?
**A:** * **REST:** Uses standard HTTP methods (GET, POST, PUT, DELETE), is stateless, lightweight, typically uses JSON, and is highly scalable for modern web apps.
* **SOAP:** A strict protocol that uses XML for messaging. It can operate over HTTP or SMTP. It is more rigid and verbose but natively supports high-level enterprise security and strict ACID transactional compliances (WS-Security, WS-AtomicTransaction).

### Q: How do you handle exceptions in a Spring Boot application?
**A:** Exception handling is typically centralized using the **`@ControllerAdvice`** annotation. Within this class, you define methods annotated with **`@ExceptionHandler`** to catch specific exception types globally and return formatted, consistent error response payloads to the client.

### Q: Coding Question: Merge two unsorted arrays and print the merged array in a sorted way using the Stream API.
**A:** ```java
int[] array1 = {5, 2, 9};
int[] array2 = {1, 8, 3};

int[] mergedAndSorted = IntStream.concat(Arrays.stream(array1), Arrays.stream(array2))
                                 .sorted()
                                 .toArray();