---
id: paytm-java-developer-interview-questions
title: Paytm Java Developer Interview Experience & Questions [24 LPA+]
description: A comprehensive list of technical interview questions and answers from a real Paytm Java Developer interview (3-6 years of experience). Covers Core Java, Spring Boot, OOPs, Collections, and more.
tags:
  - Java
  - Spring Boot
  - Interview Experience
  - Backend Development
  - Paytm
---

# Paytm Java Developer Interview Questions (24 LPA+)

This guide contains the detailed technical questions and answers from a real Java Developer interview at Paytm for a candidate with 3+ years of experience. 

---

## Core Java & OOPs Concepts

### Q: What is the difference between Method Overloading and Method Overriding in Java?
**A:** * **Method Overloading:** Using the same method name with different parameters within the same class. It happens at compile time.
* **Method Overriding:** Redefining a parent class method in a child class with the exact same name and parameters. It happens at runtime.

### Q: How does inheritance work in a try-catch block?
**A:** We can catch a parent exception class to handle all its child exceptions. For example, catching `Exception` will automatically handle `IOException`, `NullPointerException`, and all other subclasses of `Exception`. However, you must place child exception catch blocks before parent exception catch blocks if you are using multiple catch statements.

### Q: What is `Throwable` in Java?
**A:** `Throwable` is the root parent class of all errors and exceptions in Java. It represents problems a program might face (like coding mistakes or system issues) and anything that extends it can be caught using try-catch blocks or thrown.

### Q: Explain the `static` keyword.
**A:** The `static` keyword defines class-level members. This means the variables or methods belong to the class itself, not to the individual instances (objects). You can access static members without creating an object by using `ClassName.methodName()` or `ClassName.variableName`.

### Q: Explain the `final` keyword.
**A:** The `final` keyword restricts modification:
* **Final Variables:** Once assigned, the value cannot be changed (unchangeable).
* **Final Methods:** Cannot be overridden by a child class.
* **Final Classes:** Cannot be extended (non-inheritable).

### Q: What is a Singleton class and how do you create one?
**A:** A Singleton class restricts object creation to allow only exactly one instance to be created during the program's lifetime. It is used for shared resources like logging, database connections, or configuration settings.
**To create a Singleton:**
1. Make the constructor `private`.
2. Define a `private static` instance variable of the class.
3. Provide a `public static` method (like `getInstance()`) to return that instance, ensuring only one object is created and reused.

### Q: What is a Marker Interface and a Functional Interface?
**A:** * **Marker Interface:** An interface with no methods (e.g., `Serializable`, `Cloneable`). It just "marks" a class to signal the JVM to add special behavior.
* **Functional Interface:** An interface that has exactly one abstract method (e.g., `Runnable`, `Comparator`). They are heavily used in Lambda expressions.

### Q: If a method exists in a superclass and subclass, what happens if we change the method's return type in the subclass?
**A:** If the return type is changed to a compatible subtype (this is called a **covariant return type**), it works perfectly fine. However, if the new return type is unrelated or incompatible with the parent's return type, it will cause a compile-time error because it breaks the rules of method overriding.

### Q: Explain Pass by Value vs. Pass by Reference in Java.
**A:** Java is strictly **Pass by Value**. 
* For primitive types, the actual value is copied.
* For objects, the *reference* (memory address) is copied. This means changes made to the object's properties will affect the original object, but reassigning the reference itself to a new object will not affect the original reference.

### Q: What is a static block and what happens if a method calls a class with a static block?
**A:** A static block is used to initialize complex static variables. It runs exactly once when the class is loaded into memory, prior to the `main` method or object creation. If the `main` method accesses another class (by calling a static method or creating an object), the static block in that target class will execute first before any other code from that class runs.

### Q: What is the difference between `Callable` and `Runnable`?
**A:** Both are used for executing tasks in concurrent threads.
* **Runnable:** Its `run()` method returns `void` (nothing) and cannot throw checked exceptions.
* **Callable:** Its `call()` method can return a result and can throw checked exceptions. It is typically used with `ExecutorService` and `Future`.

### Q: What does Serialization actually do?
**A:** Serialization converts a Java object into a stream of bytes so that it can be easily saved to a file, database, or sent over a network. It helps in storing or transferring object data in a platform-independent way.

---

## Spring Boot & Architecture

### Q: What is `@Autowired` and what are its alternatives?
**A:** `@Autowired` tells Spring to inject dependencies automatically. Alternatives include using the `@Inject` or `@Resource` annotations, or utilizing constructor-based injection (which is highly recommended) and setter-based injection without annotations.

### Q: What is the `@Primary` annotation and when should it be used?
**A:** The `@Primary` annotation is used in Spring when multiple beans of the exact same type exist. It tells Spring to prioritize and use that specific bean by default for dependency injection when no specific bean name (like `@Qualifier`) is mentioned.

### Q: How do you configure multiple databases in a Spring Boot application?
**A:** You create separate configuration classes for each database. In these classes, you define different `DataSource`, `EntityManagerFactory`, and `TransactionManager` beans. You must use the `@Primary` annotation on the beans of the primary database to make it the default, and use the `@Qualifier` annotation during injection to specify the secondary database beans to avoid confusion.

### Q: How do you build a module from scratch?
**A:** The standard workflow is:
1. Gather requirements.
2. Create the database schema.
3. Write the Entities, Repositories, Services, and Controllers.
4. Add validations and security constraints.
5. Test the APIs using Postman.
6. Integrate it with other modules using REST APIs and proper configurations.

### Q: What security parameters do you check in your applications?
**A:** Standard security checks include Authentication, Authorization, securing APIs using HTTPS, input validation, password encryption, Role-Based Access Control (RBAC), preventing SQL injection, enabling CSRF protection, monitoring logs for suspicious activities, and keeping all dependencies up to date.

### Q: Why do you reuse a Spring architecture template?
**A:** It saves time, follows industry best practices, and maintains consistency across projects. A clean layered structure (Controller, Service, Repository) makes development, unit testing, and long-term maintenance significantly easier.

### Q: How would you create a custom repository in Spring Data JPA?
**A:** 1. Define a standard interface with your custom methods.
2. Create an implementation class for that interface with your custom logic.
3. Make your main repository interface extend both `JpaRepository` and your custom interface. Spring will automatically merge your custom logic with the built-in JPA features.

### Q: Why use Spring JDBC instead of Hibernate?
**A:** Spring JDBC provides more granular control over complex SQL queries, offers slightly better performance by skipping the ORM overhead, and is perfect for simple use cases where a full-fledged ORM like Hibernate is overkill.

### Q: What is the difference between `@Controller` and `@RestController`?
**A:** `@Controller` is typically used for traditional web applications to return View names (like HTML/JSP pages). `@RestController` is a combination of `@Controller` and `@ResponseBody`, meaning it automatically serializes the returned objects into JSON or XML to directly populate the HTTP response body for REST APIs.

### Q: How will you return XML instead of JSON from a Spring Boot REST API?
**A:** You need to add the Jackson XML data format dependency (or JAXB). Annotate your model with `@XmlRootElement`. Then, when a client passes `Accept: application/xml` in the HTTP request header, Spring will automatically convert and return the response in XML format.

### Q: What is an Interceptor and how is it used in Spring Boot?
**A:** An Interceptor is used to intercept incoming HTTP requests *before* they reach the controller. You implement the `HandlerInterceptor` interface, override methods like `preHandle`, and register it using `WebMvcConfigurer`. It is highly useful for applying common logic like logging, authentication, or token validation.

### Q: How do you implement logging across the entire application without writing log statements in each method?
**A:** By using Spring AOP (Aspect-Oriented Programming). You create an Aspect class and use the `@Around` (or `@Before`/`@After`) advice annotation pointing to your Controller and DAO layers. This dynamically injects logging logic across the application without polluting your business code.

---

## Collections & Multithreading

### Q: What is the size of an ArrayList? What is its initial capacity and how does it grow?
**A:** An `ArrayList` is a dynamic array. By default, its initial capacity is 10. When elements are added beyond its current size limit, it automatically increases its capacity, usually by 50% of its old capacity (e.g., from 10 to 15).

### Q: Explain the internal working of `HashMap` prior to Java 8 and after Java 8.
**A:** * **Prior to Java 8:** `HashMap` used an array of linked lists. When hash collisions occurred, entries were just appended to the linked list. 
* **After Java 8:** To improve performance in scenarios with high collisions, once a linked list in a bucket crosses a certain threshold (usually 8 elements), it transforms into a balanced tree (Red-Black Tree), dropping the worst-case lookup time from O(n) to O(log n).

### Q: How does Singleton work in a multi-threaded environment? If you use `synchronized`, where should it be added?
**A:** In a multi-threaded environment, two threads might access the `getInstance()` method simultaneously and create two separate objects, breaking the Singleton rule. To make it thread-safe, you use the `synchronized` keyword. You can add it directly to the `getInstance()` method, but for better performance, the standard approach is "Double-Checked Locking" using a `synchronized` block inside the method combined with the `volatile` keyword on the instance variable.

---

## System Design & Coding Questions

### Q: How does a Payment Gateway system work?
**A:** A payment gateway securely processes online payments. It collects the payment information from the user, encrypts it, sends it to the acquiring bank/payment processor for approval, and then returns a success or failure response back to the application. It ensures data encryption, handles fraud checks, and guarantees a smooth transactional flow between the user and the financial institutions.

### Q: Write a program to remove duplicates from an ArrayList without using built-in methods or other collections.
*(A standard whiteboard coding question evaluating manual iteration and element shifting logic).*

### Q: Write and optimize a program to check if two strings are anagrams.
*(A standard algorithmic coding question evaluating character frequency counting, usually optimized using a hash map or a fixed-size integer array).*