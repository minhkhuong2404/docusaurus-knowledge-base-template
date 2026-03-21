---
id: capgemini-java-developer-interview-questions
title: Capgemini Java Developer Interview Experience & Questions
description: A comprehensive list of technical interview questions and detailed answers from a real Capgemini Full Stack Java Developer interview (3-6 years of experience). Covers Core Java, Spring Boot, Databases, and Angular.
tags:
  - Java
  - Spring Boot
  - Angular
  - Full Stack
  - Interview Experience
  - Capgemini
---

# Capgemini Full Stack Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Capgemini Full Stack Java Developer interview for a candidate with 3 to 6 years of experience. The interview covered Core Java, Object-Oriented Programming (OOPs), Spring Boot, Databases, Angular, and Coding.

---

## 1. Core Java & Object-Oriented Programming

### Q: What is the `Optional` class, how can we avoid `NullPointerException` through this, and how to use it?
**A:** The `Optional` class in Java 8 helps avoid `NullPointerException` by providing a container object which may or may not contain a non-null value. Instead of returning `null`, a method can return an `Optional`. You use it by first creating an `Optional` object (e.g., `Optional.ofNullable(value)`). Then, you can use methods like `isPresent()` to check if a value exists, or `orElse()` / `orElseGet()` to provide a default value or fallback logic if the value is missing.

### Q: Have you worked with `Comparable` and `Comparator`, and what are the differences between them?
**A:** Yes.
* **`Comparable`:** It provides a default, natural sorting order for objects of a class. The class itself must implement the `Comparable` interface and override the `compareTo()` method, which means it modifies the class directly.
* **`Comparator`:** It lets us define custom or multiple ways to sort objects without changing their original class. You create a separate class (or use a Lambda) implementing the `Comparator` interface and override the `compare()` method.

### Q: What are the differences between method overloading and method overriding?
**A:** * **Method Overloading:** Occurs when one class has multiple methods with the exact same name but different parameters (type, number, or order). It happens at compile time and is used to perform similar tasks in different ways.
* **Method Overriding:** Occurs when a child class provides a specific implementation for a method that is already defined in its parent class (same name and exact same parameters). It happens at runtime.

### Q: Explain the SOLID principles.
**A:** SOLID principles are five guidelines for writing better, more maintainable object-oriented software:
* **S - Single Responsibility Principle:** A class should have only one main job or reason to change.
* **O - Open/Closed Principle:** Classes should be open for extension but closed for modification.
* **L - Liskov Substitution Principle:** Subclasses should be replaceable for their parent classes without causing any issues or breaking functionality.
* **I - Interface Segregation Principle:** It is better to have many small, specific interfaces rather than one large, general-purpose interface.
* **D - Dependency Inversion Principle:** High-level modules should depend on abstractions (interfaces), not on concrete implementations.

---

## 2. Spring Boot & REST APIs

### Q: What is the default server in Spring Boot, and is it possible to change the port?
**A:** The default embedded server in Spring Boot is **Tomcat**. Yes, you can easily change the port by adding `server.port=8081` (or your desired port) in the `application.properties` or `application.yml` file.

### Q: What is Dependency Injection and the IoC Container?
**A:** * **Dependency Injection (DI):** A design pattern where an object receives its dependencies from an external source rather than creating them itself.
* **IoC (Inversion of Control) Container:** The framework component in Spring that manages the lifecycle, creation, and injection of these dependencies automatically, promoting loose coupling.

### Q: What is the difference between `@Controller` and `@RestController`?
**A:** * **`@Controller`:** Used in traditional Spring MVC applications. It returns view names that are resolved into web pages (like HTML or JSP files).
* **`@RestController`:** Used for creating RESTful web services. It is a combination of `@Controller` and `@ResponseBody`, meaning it automatically serializes the returned objects into JSON or XML and sends them directly in the HTTP response body.

### Q: What is REST and what does the abbreviation stand for?
**A:** REST stands for **Representational State Transfer**. It is an architectural style and set of guidelines for building scalable web services. REST uses standard HTTP methods (like `GET`, `POST`, `PUT`, `DELETE`, `PATCH`) to perform CRUD operations on resources.

### Q: Is a REST API stateless?
**A:** Yes, REST APIs are strictly stateless. This means every request from a client to the server must contain all the necessary information to fulfill that specific request. The server does not store any session state or memory about the client between requests.

### Q: What are the differences between `PUT` and `PATCH`?
**A:** Both are HTTP methods used to update resources.
* **`PUT`:** Replaces the *entire* resource with the new data provided in the payload.
* **`PATCH`:** Applies *partial* modifications to a resource. You only send the specific fields that need to be updated.

### Q: What is the difference between `GET` and `POST`? Which is more secure?
**A:** * **`GET`:** Used to retrieve data from the server. Data is appended to the URL as query parameters.
* **`POST`:** Used to send data to the server to create or update resources. Data is sent in the HTTP request body.
**Security:** `POST` is more secure for sensitive data because the payload is enclosed in the request body and not exposed in the URL or browser history, unlike `GET`.

### Q: What are the differences between `@RequestParam` and `@PathVariable`?
**A:** * **`@RequestParam`:** Extracts data from the query parameters in the URL (e.g., `/users?id=10`).
* **`@PathVariable`:** Extracts values directly from the URI path itself, typically used to identify specific resources (e.g., `/users/10`).

---

## 3. Databases (SQL)

### Q: What are indexes in a database, and what are their disadvantages?
**A:** Indexes are special lookup tables that the database search engine can use to dramatically speed up data retrieval (`SELECT` queries).
* **Disadvantages:** They consume additional physical storage space. Furthermore, they slow down write operations (`INSERT`, `UPDATE`, `DELETE`) because the index data structure must be rebuilt or updated every time the table data changes.

### Q: What is the difference between `DROP`, `DELETE`, and `TRUNCATE`?
**A:** * **`DROP`:** Completely removes an entire table (or database) structure from the database, along with all its data.
* **`DELETE`:** A DML command that removes specific rows from a table based on a `WHERE` condition. It logs each deletion and can be rolled back.
* **`TRUNCATE`:** A DDL command that quickly deletes all rows from a table and resets auto-increment identities. It does not scan row-by-row and cannot easily be rolled back.

### Q: What is the difference between a Function and a Stored Procedure?
**A:** * **Function:** Must always return a single value (or table). It is generally used for calculations and can be called directly within a `SELECT` SQL statement.
* **Stored Procedure:** Performs a set of operations and complex business logic. It can return zero, one, or multiple output parameters/result sets, but cannot be called directly inside a `SELECT` statement.

---

## 4. Angular (Frontend)

### Q: Is TypeScript object-oriented?
**A:** Yes, TypeScript is a strictly typed, object-oriented programming language built on top of JavaScript. It supports classes, interfaces, inheritance, and access modifiers.

### Q: Is Angular a framework?
**A:** Yes, Angular is a full-fledged, opinionated framework for building robust client-side applications (unlike React, which is technically a UI library).

### Q: What is the difference between Lazy Loading and Eager Loading?
**A:** * **Lazy Loading:** Data, modules, or objects are loaded asynchronously only when they are actually requested or needed. This speeds up the initial application startup time and saves memory.
* **Eager Loading:** Loads everything upfront when the application initializes. It makes later navigation faster but significantly slows down the initial loading time.

### Q: What are the types of directives in Angular?
**A:** There are three main types of directives in Angular:
1. **Component Directives:** Directives with a template (the most common type).
2. **Structural Directives:** Change the DOM layout by adding and removing elements (e.g., `*ngIf`, `*ngFor`).
3. **Attribute Directives:** Change the appearance or behavior of an element, component, or another directive (e.g., `ngClass`, `ngStyle`).

### Q: What are Angular Lifecycle Hooks?
**A:** Angular lifecycle hooks are specific functions or interfaces (like `ngOnInit`, `ngOnChanges`, `ngOnDestroy`) that allow developers to tap into key moments in the lifespan of a component or directive, from its creation to its destruction, allowing for setup and cleanup tasks.

---

## 5. Coding Question

### Q: Write a Stream API code to find the squares of a list of numbers.
**A:**
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
List<Integer> squares = numbers.stream()
                               .map(n -> n * n)
                               .collect(Collectors.toList());

System.out.println(squares); // Output: [1, 4, 9, 16, 25]
```
