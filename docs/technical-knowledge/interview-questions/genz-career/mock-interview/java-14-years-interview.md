---
id: java-spring-boot-14-years-interview-detailed
title: Java Spring Boot Interview Questions (14 Years Experience) - Detailed
tags:
  - Java
  - Spring Boot
  - Microservices
  - System Design
  - Interview Questions
  - Senior Developer
description: An in-depth, highly detailed breakdown of a Senior Java Developer interview covering advanced Spring Boot, architectural migrations, database decoupling, and JVM memory concepts.
---

# Senior Java & Spring Boot Interview: Deep Dive (14 Years Experience)

This document provides a highly detailed breakdown of a mock interview with Shrikant, a developer with 14 years of experience (7 years in Oracle, 7 years in Java/Spring Boot). The answers reflect the depth expected from a Lead/Senior Engineer.	

## 1. Professional Background & Daily Responsibilities

**Q: Can you explain your recent project and introduce yourself?**
**A:** Shrikant has spent 14 years in the service industry, heavily focused on the E-commerce (Telecom and Retail) and Banking domains. As a senior developer, his daily routine is highly structured around code quality and team alignment:
* **Version Control & Baselining:** Starting the day by pulling the latest checkouts and reviewing the entire codebase development from the previous day.
* **Agile Ceremonies:** Active participation in Sprint ceremonies, specifically grooming stories and collaborating directly with clients to clarify design and business requirements.
* **Security & Defect Triage:** Checking for vulnerabilities and defects daily or every alternate day. The immediate priority is always identifying and resolving high-severity vulnerabilities to ensure safe code promotion to higher environments.

## 2. Code Review & Team Collaboration

**Q: How do you review code, collaborate with junior developers, and ensure quality?**
**A:** Code review is deeply integrated into their Jenkins CI/CD pipeline. The process involves:
* **Automated Scanning:** Every build triggers a code scan to flag CVE bugs and vulnerabilities before human eyes even look at it.
* **Peer-to-Peer Review:** Using tools like Spring Tool Suite (STS) and live sharing sessions.
* **Deep Feature Analysis:** When reviewing a feature (e.g., a "Search" feature), he looks at the holistic design:
    * How classes are mapped to interfaces.
    * Strict adherence to the **SOLID principles**.
    * Proper use of `camelCase` naming conventions.
    * Ensuring method and variable names directly reflect the business functionality they serve.

## 3. Agile Problem Solving & Scope Creep

**Q: Have you ever faced a challenge with a looming deadline where the team couldn't deliver? How did you manage the client?**
**A:** Yes. A developer picked up a mid-sized story estimated at 8 story points. Mid-sprint, it ballooned into a 14/16-point story that couldn't be completed in a single sprint. 
* **The Root Cause:** The initial design assumed the search feature would take a *single* input parameter. Later, the client's requirements mandated *multiple* input parameters, which introduced cascading complexities in the implementation.
* **The Resolution:** Instead of failing the sprint silently, Shrikant immediately pulled the client into the Sprint call. They explained the technical challenges openly. They then refactored the deliverable, breaking the large story into 5-6 smaller sub-tasks divided across two separate stories. They successfully delivered the first 8 points in the current sprint and pushed the remainder to the next.

## 4. Code Quality Tools (SonarQube & Snyk)

**Q: How do you use SonarQube for maintaining code quality? Give a specific example.**
**A:** SonarQube is used for **SAST (Static Application Security Testing)** and **DAST (Dynamic Application Security Testing)**. 
* **Vulnerability Example:** During static code analysis, SonarQube frequently flags **SQL Injections**. This often happens when developers accidentally cache passwords or expose typed inputs directly to the database layer. 
* **Library Management:** Alongside SonarQube, they use **Snyk** to analyze third-party libraries. Snyk identifies if any of the multiple libraries they use require version upgrades to patch newly discovered security flaws. Shrikant's team relies heavily on these deep-dive CI/CD reports to fix critical severity issues before a release.

## 5. Core Java Deep Dive

**Q: Have you ever encountered a `ClassNotFoundException`? How do you resolve it?**
**A:** Yes. The immediate step is to check the application's **classpath**. If the exception occurs while running the codebase, it indicates the ClassLoader cannot find the compiled `.class` file. Shrikant resolves this by navigating the project's folder structure to verify if a specific package or dependency wasn't picked up during the build process, subsequently fixing the classpath configuration.

**Q: Explain how `HashMap` works internally and what happens during a hash collision.**
**A:** A `HashMap` uses a hashing algorithm to determine the address location (bucket) where a key-value pair should be stored in Heap memory. When `map.put(key, value)` is called, the key's hash is calculated to find its bucket. 
* **Collisions:** A collision occurs when two different keys generate the exact same hash code. *(Note: The candidate acknowledged collisions but forgot the exact resolution on the spot; internally, Java resolves this by storing the colliding entries in a LinkedList, which upgrades to a balanced Red-Black Tree in Java 8+ if the list grows beyond 8 elements).*
* **Memory Leaks:** Shrikant heavily emphasized that failing to properly override `hashCode()` and `equals()` when using custom objects as map keys is a primary cause of Java memory leaks.

**Q: How does `ConcurrentHashMap` improve performance in a multi-threaded environment compared to a synchronized Map?**
**A:** It is inherently thread-safe without the severe performance bottlenecks of a fully synchronized map (like `Hashtable`). It achieves this via **Segment Locking** (or bucket locking). 
* In a multi-threaded environment, `ConcurrentHashMap` does not lock the entire map object. It only locks the specific segment/bucket where a thread is performing a **write/update** operation. 
* Simultaneously, other threads can perform **read/fetch** operations on different segments without being blocked. Additionally, it explicitly prevents the insertion of `null` keys or values.

**Q: How do you create a truly immutable class in Java?**
**A:** 1.  Declare the class with the `final` keyword so it cannot be extended (subclassed).
2.  Declare all member variables as `private` and `final`.
3.  Provide **only getter methods**.
4.  Strictly omit any **setter methods** to ensure the object's state cannot be mutated once it is instantiated via the constructor.

## 6. Spring Framework & Transaction Management

**Q: Explain Transaction Management in Spring using a real-world example.**
**A:** Handled via the `@Transactional` annotation. Shrikant used an **Airline Reservation System** as an example. 
* **Scenario:** A user enters their passenger info, selects a flight, and proceeds to payment. 
* **Execution:** If the payment is successful, the entire flow is committed to the database. However, if the payment service crashes or returns a failure mid-process, `@Transactional` ensures the *entire* transaction is rolled back. The database will not retain an orphaned record of the passenger booking without a completed payment.

**Q: Can we customize Auto-configuration in Spring Boot?**
**A:** Yes. It is customized utilizing the `META-INF/spring.factories` file. This file holds the configurations where dependencies are defined. When the Spring container spins up, it checks this file to verify whether specific conditional beans are available to enable or disable auto-configuration features.

## 7. Microservices Architecture & Migration Challenges

**Q: What are the main challenges you've faced when designing microservice applications?**
**A:** The most significant challenge was **Data Consistency and Database Coupling**. 
* **The Mistake:** During a monolith-to-microservice migration, the team initially designed 5-6 microservices that all pointed to a **single, common database** (managed via Liquibase). Because the architecture wasn't event-driven, when Service A updated a piece of shared data, Service B had no idea the data had changed, leading to massive data synchronization bugs.
* **The Solution:** 1.  **Database-Per-Service:** They decoupled the architecture, creating separate schemas/databases for each individual microservice.
    2.  **Event-Driven Architecture:** They implemented a **Pub/Sub (Publisher/Subscriber) pattern** using a message broker like **Apache Kafka**. Now, if Service A updates its database, it publishes an event. Service B (the subscriber) listens for that event and updates its own database accordingly.

**Q: How do you ensure Java applications are maintainable and scalable?**
**A:** * **Maintainability:** Achieved through loose coupling and strict adherence to **SOLID principles**:
    * **Single Responsibility:** Classes serve one specific purpose.
    * **Open/Closed:** Open for extension, closed for modification.
    * **Liskov Substitution:** Derived classes must be replaceable with their base classes.
    * **Interface Segregation:** Clients shouldn't be forced to depend on methods they don't use.
    * **Dependency Injection:** Inversion of Control (IoC) handles dependencies, making life much easier.
* **Scalability:** Monoliths are inherently difficult to scale. If you want to scale the "Add to Cart" feature, you have to run an entire build, inform all module leads, and incur downtime to deploy a massive WAR file. Microservices solve this; they are independently developable and deployable, allowing you to scale *only* the specific service under load (e.g., scaling the checkout service dynamically during peak holiday sales).

## 8. Third-Party Integrations & Error Handling

**Q: Discuss your experience integrating third-party services.**
**A:** Shrikant has integrated several external systems:
* **Payment Gateways:** Integrated PayPal for payment processing.
* **Dynamic Pricing:** Integrated third-party pricing engines to fetch seasonal, dynamically changing base prices for retail applications.
* **Authentication/Authorization:** In B2B applications, he integrated external user management systems to fetch incoming user data, authenticate them, and determine their specific roles and permissions before granting access to internal microservices.

**Q: What is your approach to error handling and logging?**
**A:** * **Error Handling:** Use `@ControllerAdvice` at the class level to globally catch and handle exceptions across the application cleanly. For specific endpoint edge-cases, `@ExceptionHandler` is used at the method level.
* **Logging:** He prefers **Kibana** (often part of the ELK stack) as it is the current market trend for highly efficient, hassle-free log tracing and debugging, enabling rapid issue resolution compared to legacy setups. (He previously used Splunk).

## 9. Java Evolution & Security

**Q: How do you keep up with the continuous evolution of the Java ecosystem?**
**A:** Java updates frequently (every 6 months). Shrikant tracks major feature jumps (Java 8 -> 11 -> 17 -> 21). For example, adopting Java 17 brought the `var` keyword and heavily enhanced Garbage Collection algorithms. Upgrading versions is essential because older versions often suffer from underlying memory leak trade-offs. By upgrading, he ensures the application avoids Heap memory issues, scales better, and prevents tight coupling that makes onboarding new developers difficult.

**Q: How do you secure a Spring Boot application?**
**A:** Security is built around **Spring Security and JWT (JSON Web Tokens)**. 
* An **API Gateway** acts as the frontline roadblock. When a request comes in, the gateway authenticates and authorizes the user.
* JWT handles this via its three parts: Header, Payload, and Signature. It passes a secure token for all subsequent requests. 
* The application accesses the `SecurityContext` object to fetch the exact details of the logged-in user and their precise authorization scopes, determining exactly what actions they are permitted to execute on the microservices.

## 10. System Design (Food Delivery App)

**Q: How would you design a food delivery app (like Swiggy or Zomato) from scratch?**
**A:** The first step is always identifying the core entities and designing the data model before writing any code:
1.  **Users/Customers:** Customer ID, name, location, food preferences.
2.  **Restaurants:** Restaurant ID, details, menu type (e.g., Veg/Non-Veg).
3.  **Menu:** Menu items, pricing.
4.  **Orders:** Order history, frequency, current status.
After defining the entities, the crucial step is establishing the **cardinality and relationships** between these data models. A robust, easily extendable data model is the foundation; once that is solidified, you can pick the appropriate frameworks to implement the business logic.

## 11. Live Coding Challenge (Stream API)

**Q: Write a Java program to count the occurrences of each character in a string using the Stream API.**
**A:** Instead of the traditional 7-line approach using `HashMap` and `for` loops, Shrikant provided a clean, functional 2-line solution using Java 8 Streams:

```java
String input = "Java Program";

// Split the string into an array, stream it, and group by character identity
Map<String, Long> charOccurrencesMap = Arrays.stream(input.split(""))
    .collect(Collectors.groupingBy(
        Function.identity(), 
        Collectors.counting()
    ));

System.out.println(charOccurrencesMap);