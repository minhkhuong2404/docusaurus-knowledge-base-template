---
id: accenture-java-developer-interview-16lpa
title: Accenture Java Developer Interview Experience & Questions [16 LPA+]
description: A detailed collection of real interview questions and answers from an Accenture Java Developer interview. Ideal for candidates with 3+ years of experience, covering Core Java, Spring Boot, Hibernate, and Microservices.
tags:
  - Java
  - Spring Boot
  - Hibernate
  - Microservices
  - Interview Experience
  - Accenture
---

# Accenture Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an Accenture Java Developer interview for a candidate with 3.3 years of experience. The interview covered extensive Core Java concepts, exception handling, Stream API, Spring Boot, Hibernate, and Microservices architecture.

---

## 1. Core Java & Object-Oriented Programming

### Q: Can private methods be overridden and why?
**A:** No, private methods cannot be overridden because they are completely hidden and not visible to child classes. Method overriding strictly depends on inheritance and method visibility. If a child class defines a method with the exact same name as a private method in the parent class, it is treated as a completely new, independent method, not an override.

### Q: Can a static method be overridden?
**A:** No, static methods cannot be overridden because they belong to the class itself, not to a specific object instance. Method overriding works at runtime using dynamic binding based on the object type, whereas static methods are resolved at compile-time based on the reference type. If a subclass defines a static method with the exact same signature as the parent, it is called **Method Hiding**, not overriding.

### Q: Can we overload private and static methods?
**A:** Yes, both private and static methods can be overloaded. Overloading happens entirely at compile-time and depends solely on the method signature (the number, type, and order of parameters) within the same class. It has nothing to do with inheritance or runtime binding.

### Q: What is the JVM and what are its main components?
**A:** The JVM (Java Virtual Machine) is the engine responsible for running Java programs. It loads class files, manages memory, and executes bytecodes. 
Its main components are:
1. **Class Loader:** Loads the compiled `.class` files into memory.
2. **Runtime Data Areas:** Includes the Heap (for objects) and Stack (for method execution and local variables).
3. **Execution Engine:** Interprets the bytecode and compiles hot code to native machine code via the JIT compiler.
4. **Garbage Collector:** Automatically handles memory cleanup by destroying unreachable objects.

### Q: Why is Java considered platform-independent?
**A:** Java is platform-independent because Java source code is not compiled directly into machine-specific hardware code. Instead, it is compiled into an intermediate **bytecode** (`.class` files). This bytecode can run on any operating system (Windows, Mac, Linux) as long as that system has a JVM installed to interpret it. Hence the principle: "Write Once, Run Anywhere".

### Q: Explain the String Pool mechanism.
**A:** The String Pool is a special, dedicated memory area inside the Java Heap used exclusively to store String literals. When you create a String literal (e.g., `String s = "Hello";`), the JVM first checks the pool. If an identical string already exists there, it returns the reference to the existing string instead of creating a new object. This significantly saves memory and improves performance.

### Q: Why is `String` immutable in Java?
**A:** `String` is immutable meaning once the object is created, its value cannot be changed. This design choice exists to improve:
* **Security:** Sensitive data like database URLs, usernames, and passwords cannot be accidentally or maliciously altered after authentication.
* **Performance/Memory:** It enables the String Pool to function safely. Multiple variables can point to the same memory location without fear of one variable altering the value for the others.
* **Thread Safety:** Because the state cannot change, Strings are inherently thread-safe and can be shared across multiple threads without synchronization.

---

## 2. Exception Handling

### Q: How do you create a custom exception in plain Java?
**A:** You create a custom exception by creating a new class that extends either `Exception` (for a Checked Exception) or `RuntimeException` (for an Unchecked Exception). You then define constructors that call `super(message)` to pass custom error messages. Finally, you use the `throw` keyword in your business logic to trigger this exception when a specific condition fails.

### Q: Differentiate between Checked and Unchecked exceptions.
**A:** * **Checked Exceptions:** Inherit directly from `Exception` (e.g., `IOException`, `SQLException`). The compiler forces you to handle them using `try-catch` blocks or declare them using `throws`. They represent external issues outside the program's immediate control.
* **Unchecked Exceptions:** Inherit from `RuntimeException` (e.g., `NullPointerException`, `ArrayIndexOutOfBoundsException`). The compiler does not force you to handle them. They usually represent logical programming errors.

### Q: Can we catch exceptions in static blocks or constructors?
**A:** Yes, we can catch exceptions in both.
* **Static Blocks:** Since they are used for class-level initialization before any object is created, handling exceptions here prevents critical class-loading failures.
* **Constructors:** Try-catch blocks can be used inside constructors to gracefully handle initialization issues and ensure the object is created safely, or to throw a meaningful error if creation must fail.

### Q: Differentiate between the `throw` and `throws` keywords.
**A:** * **`throw`:** Used explicitly *inside* a method body to instantiate and trigger an actual exception object (e.g., `throw new Exception("Error");`).
* **`throws`:** Used in a *method signature/declaration* to indicate to the caller that this method might pass an exception upwards, forcing the caller to handle it.

---

## 3. Access Modifiers & Java 8 Features

### Q: Differentiate between `private` and `protected` access modifiers.
**A:** * **`private`:** Restricts access strictly to within the exact same class where it is declared, providing maximum data hiding and encapsulation.
* **`protected`:** Allows access within the same package, AND allows access to subclasses that reside in entirely different packages. It is used when controlled inheritance is required.

### Q: What is a Functional Interface and what are its uses?
**A:** A Functional Interface is an interface that contains **exactly one abstract method**. They are primarily used to enable and support **Lambda Expressions** in Java. They help developers write concise, readable, and flexible code by passing behavior as parameters. Common examples include `Runnable`, `Callable`, `Predicate`, and `Consumer` used heavily in the Stream API.

### Q: Can a functional interface have default methods?
**A:** Yes. The strict rule is that it must have only one *abstract* method. Because `default` and `static` methods contain actual implementations, they do not count towards the abstract method limit. Therefore, you can have as many default/static methods as you want in a functional interface.

### Q: Why were default methods introduced in interfaces when abstract classes already exist?
**A:** Default methods were introduced primarily to ensure **backward compatibility**. They allow developers to add new methods to an existing interface without breaking all the legacy classes that already implement that interface. Unlike abstract classes (where a class can only extend one), a class can implement multiple interfaces, making default methods crucial for upgrading core Java APIs (like the Collections framework) gracefully.

### Q: Differentiate between Intermediate and Terminal Stream operations.
**A:** * **Intermediate Operations:** Operations like `filter()`, `map()`, and `sorted()` that transform one stream into another. They are **lazy**, meaning they do not execute immediately until a terminal operation is invoked.
* **Terminal Operations:** Operations like `forEach()`, `collect()`, and `reduce()` that trigger the actual execution of the entire stream pipeline and produce a final result or a side-effect.

### Q: Differentiate between `map` and `flatMap` in the Stream API.
**A:** * **`map`:** Used to transform each element into exactly one other form (a 1-to-1 mapping).
* **`flatMap`:** Used when each element in the stream produces *multiple* values (like a List of Lists). It flattens these nested, complex structures into a single, continuous, unified stream (a 1-to-Many mapping).

---

## 4. Spring Boot & Microservices

### Q: Differentiate between `@Controller` and `@RestController`.
**A:** * **`@Controller`:** Used in traditional Spring MVC applications to return View names that are resolved into web pages (like JSP or Thymeleaf templates).
* **`@RestController`:** A convenience annotation that combines `@Controller` and `@ResponseBody`. It completely skips view resolution and directly writes the returned data (usually as JSON or XML) into the HTTP response body, making it ideal for building RESTful APIs.

### Q: What is CORS (Cross-Origin Resource Sharing)?
**A:** CORS is a strict browser security mechanism. It controls which external web domains are allowed to access your backend APIs. When a frontend application hosted on Domain A tries to call a backend hosted on Domain B, CORS rules established by the backend dictate whether the browser should permit or block the request, preventing unauthorized cross-site access.

### Q: Differentiate between `@PathVariable` and `@RequestParam`.
**A:** * **`@PathVariable`:** Extracts dynamic values directly from the URI path itself. It is typically used to identify a specific resource (e.g., `/users/{id}`).
* **`@RequestParam`:** Extracts values from the query parameters appended to the end of the URL after the question mark. It is typically used for filtering, sorting, or passing optional data (e.g., `/users?role=admin`).

### Q: What are Microservices?
**A:** Microservices is an architectural style where a massive, monolithic application is broken down into small, independent, and highly focused services. Each service handles a specific business domain, runs in its own process, manages its own database, and communicates with other services via lightweight protocols (like HTTP REST APIs or messaging queues). This improves scalability, flexibility, and deployment speed.

---

## 5. Hibernate / JPA

### Q: What is Hibernate?
**A:** Hibernate is a powerful ORM (Object-Relational Mapping) framework for Java. It maps Java object classes directly to database tables, allowing developers to interact with the database using standard Java objects instead of writing complex, repetitive SQL queries. It handles CRUD operations, complex relationships, and caching automatically.

### Q: Differentiate between Eager and Lazy fetching in Hibernate.
**A:** * **Eager Fetching:** Loads all related child data immediately along with the parent entity in a single query, even if that data isn't needed right away. This can negatively impact performance and memory if the dataset is large.
* **Lazy Fetching:** Loads related data strictly on-demand. The data is only fetched from the database at the exact moment it is accessed in the Java code (via a getter). This vastly improves initial loading efficiency.

### Q: Differentiate between the `get` and `load` methods in Hibernate.
**A:** * **`get()`:** Fetches the data immediately from the database. If the requested record does not exist, it safely returns `null`.
* **`load()`:** Returns a lightweight "proxy" object and delays hitting the database until a property of that object is actually accessed. If the record is missing when accessed, it throws an `ObjectNotFoundException`.