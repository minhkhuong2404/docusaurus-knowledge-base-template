---
id: experienced-java-backend-interview
title: Java Backend Interview (5+ Years Experience)
sidebar_label: Experienced Backend Q&A
description: "Senior-level Java, Spring Boot, and microservices interview questions for experienced backend engineers."
tags: [java, interview, spring-boot, microservices]
---

# Java, Spring Boot & Microservices Interview Questions

This comprehensive guide covers high-level architectural and technical questions frequently asked of Senior Java Developers.

## 1. Can you use `HashMap` in a multi-threaded environment?
It depends on the scenario:
* **Read-only (CQRS Query Side):** If your microservice only performs `GET` requests and the map is never modified after initialization, a standard `HashMap` is safe and offers the best performance.
* **Read-Write:** In a typical web application where concurrent updates occur, `HashMap` will throw a `ConcurrentModificationException`. In this case, use `ConcurrentHashMap`. While slower than `HashMap`, it provides thread safety via lock stripping.

## 2. String Literal vs. `new String()`
* **String Literal (`"hello"`):** Created only in the **String Constant Pool (SCP)**.
* **`new String("hello")`:** Creates **two objects**: one in the Heap memory and one in the SCP (if it doesn't already exist).
* **Benefit:** Literal assignment facilitates reusability and saves memory by allowing multiple references to point to the same object in the SCP.

## 3. Java 8 Features & Real-world Usage
Commonly used features in enterprise projects include:
* **Stream API:** For functional-style processing of collections.
* **Lambda Expressions:** To provide concise implementations for functional interfaces used in Streams.
* **Optional:** To prevent `NullPointerException` by explicitly handling the absence of values in CRUD operations (e.g., `findById`).
* **Default Methods:** To add new functionality to interfaces without breaking existing implementing classes.

## 4. Spring Boot Starter Dependencies
Spring Boot starters are Maven templates that group related dependencies and their **transitive dependencies**.
* **Problem Solved:** Manually adding jars often leads to version conflicts and missing dependencies (e.g., Tomcat needs X, X needs Y).
* **Solution:** Adding a single starter like `spring-boot-starter-web` brings in everything needed for a web app with verified, compatible versions.

## 5. What is Spring Boot Actuator?
Actuator provides production-ready features to **monitor and manage** your application. It exposes HTTP endpoints to check:
* `/health`: Application status.
* `/metrics`: Performance data.
* `/env`: Environment variables.
* `/beans`: All registered Spring beans.

## 6. Profiles in Spring Boot
Profiles allow you to segregate configuration for different environments (Dev, Test, Prod).
* **Configuration:** Use `application-dev.properties` or YAML blocks separated by `---`.
* **Activation:** The recommended way is via a JVM parameter during deployment: `-Dspring.profiles.active=prod`.

## 7. API Documentation with Swagger
Swagger (OpenAPI) is used to document the **API Contract**. It provides a UI where clients can see:
* Available endpoints (GET, POST, etc.).
* Required headers and request bodies.
* Expected response structures and status codes.

## 8. Microservices: Monolithic to Microservices
When decomposing a monolith, follow these principles:
* **Business Capability:** Divide services based on domains (e.g., Order Service, User Service).
* **Single Responsibility:** Each service should do one thing well.
* **Loose Coupling/High Cohesion:** Services should be independent and bounded by context.

## 9. Fault Tolerance: Hystrix vs. Resilience4j
To make microservices robust against failures:
* **Circuit Breaker:** Prevents a service from constantly retrying a failing call, protecting system resources.
* **Fallback:** Provides a user-friendly message (e.g., "Service temporarily unavailable") instead of a raw 500 error.
* **Current Trend:** **Resilience4j** is preferred over the deprecated Hystrix because it is lightweight, modular, and designed for Java 8+.

## 10. Synchronous vs. Asynchronous Communication
* **Synchronous:** Client waits for a response (e.g., calling a Product service to get details before adding to a cart). Uses REST/OpenFeign.
* **Asynchronous:** Client sends a message and moves on (e.g., Order service sends a message to an Email service). Uses message brokers like **Kafka** or **RabbitMQ**.

## 11. SQL Joins Summary
| Join Type      | Description                                                                               |
| :------------- | :---------------------------------------------------------------------------------------- |
| **Inner Join** | Returns only matching rows from both tables.                                              |
| **Left Join**  | All rows from the left table + matching rows from the right.                              |
| **Right Join** | All rows from the right table + matching rows from the left.                              |
| **Full Join**  | All rows from both tables (not natively supported in MySQL; use UNION of Left and Right). |

## 12. Hibernate: First Level vs. Second Level Cache
* **First Level:** Associated with the **Session**. Always enabled. Destroyed when the session closes.
* **Second Level:** Associated with the **SessionFactory**. Optional (disabled by default). Persists across multiple sessions until the application shuts down.

---
