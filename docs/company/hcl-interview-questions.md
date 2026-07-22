---
id: hcl-java-fullstack-developer-interview
title: HCL Java Fullstack Developer Interview Experience & Questions
description: A comprehensive list of technical interview questions and detailed answers from a real HCL Java Fullstack Developer interview (3-7 years experience).
tags:
  - Java
  - Spring Boot
  - Interview Experience
  - Fullstack Development
  - HCL
---

# HCL Java Fullstack Developer Interview Questions & Answers

This guide contains detailed technical questions and answers extracted from a real HCL Java Fullstack Developer interview, geared towards candidates with 3 to 7 years of experience.

---

## 1. Spring Boot & Framework Concepts

### Q: What is the difference between `@Controller` and `@RestController` in Spring?
**A:** * **`@Controller`:** Used primarily for traditional web applications. It returns view names (like HTML or JSP pages) that are resolved by a ViewResolver.
* **`@RestController`:** Used for building REST APIs. It is a combination of `@Controller` and `@ResponseBody`. It completely skips view resolution and serializes the returned objects directly into the HTTP response body as JSON or XML.

### Q: Can a controller return a plain string or JSON response, and how?
**A:** Yes. To return a JSON response, you can either annotate the specific method with `@ResponseBody` or annotate the entire class with `@RestController`. To return a traditional Spring view, you simply return the view name as a String from a standard `@Controller`.

### Q: What happens if you return a plain string from a `@Controller` but forget to add the `@ResponseBody` annotation?
**A:** Spring treats that plain string as a **view name**. It will ask the ViewResolver to find and render a template (like an HTML or JSP file) matching that exact string name, rather than sending the string directly to the client as text.

### Q: How can we use the `@Value` annotation in Spring Boot?
**A:** The `@Value` annotation injects values from properties files (like `application.properties` or `application.yml`) directly into Java fields. For example, writing `@Value("${server.port}")` above a variable tells Spring to read that property and assign it to the field at runtime.

### Q: If you want to inject a dynamic port number from a custom config file (not application.properties), how will you use `@Value`?
**A:** First, you must load the external file into the Spring Environment using the `@PropertySource("classpath:custom-config.properties")` annotation on your configuration class. After that, you can use the `@Value("${custom.port}")` annotation normally on your field, and Spring will resolve it from the newly loaded file.

### Q: What is the use of the `@Qualifier` annotation?
**A:** The `@Qualifier` annotation is used alongside `@Autowired` when there are multiple beans of the same type in the Spring context. It tells Spring exactly which specific bean (by name) should be injected, resolving the ambiguity.

### Q: What happens if you use the `@Qualifier` annotation in a Spring class, but only one bean of that type is defined?
**A:** Spring will simply inject that single bean without any issues. The `@Qualifier` annotation acts as extra, non-conflicting information in this scenario. It is not strictly needed, but it will not cause any errors.

### Q: How do we handle global exceptions in a Spring Boot application?
**A:** We use **`@ControllerAdvice`** (or `@RestControllerAdvice`). You create a centralized class annotated with `@ControllerAdvice`, and inside it, define methods annotated with `@ExceptionHandler(SpecificException.class)`. This captures exceptions thrown from any controller across the application and returns a standardized error response.

---

## 2. Core Java & OOPs

### Q: What is the `hashCode` and `equals` contract and why is it important?
**A:** The contract states that if two objects are logically equal (according to their `equals()` method), they **must** return the same integer from their `hashCode()` method. This is critical because hash-based collections (like `HashMap` and `HashSet`) rely on this contract to identify the correct bucket for an object and prevent duplicates.

### Q: What happens if a hash function always returns the exact same value for every object?
**A:** Every object will be routed to the exact same hash bucket, causing massive **hash collisions**. Instead of the expected $O(1)$ fast lookup, the collection degrades into a single linked list (or a Red-Black tree in newer Java versions), severely worsening performance to $O(n)$ or $O(\log n)$.

### Q: What are immutable classes in Java and how do you implement one?
**A:** Immutable classes create objects whose state cannot be altered after creation (e.g., `String`). 
To implement one:
1. Declare the class as `final` so it cannot be extended.
2. Make all fields `private` and `final`.
3. Initialize all fields strictly via the constructor.
4. Do not provide any setter methods.

### Q: Can an immutable object have a mutable field?
**A:** Yes, but returning it directly breaks true immutability, as external code could modify the internal mutable object (like a `Date` or `List`). To maintain immutability, the getter method must return a **defensive copy** (a deep clone) of the mutable object rather than the original reference.

### Q: Suppose you are designing a thread-safe value object used across threads. How would you ensure immutability?
**A:** Make the class `final`, use `private final` fields, initialize them via constructors, avoid setters entirely, and return deep copies for any mutable fields. Because the object's state is locked and cannot change after creation, it is inherently thread-safe and can be shared across multiple threads without requiring explicit synchronization locks.

### Q: What is the purpose of Serialization in a POJO and its common scenarios?
**A:** Serialization converts a Java object into a byte stream. This allows the object's state to be saved to a file, stored in memory, or transmitted across a network. It is commonly used in distributed systems, caching frameworks, file storage, and sending data between microservices.

### Q: What is the Singleton pattern and how can you implement it in Java?
**A:** It is a creational design pattern ensuring that only one instance of a class exists throughout the application. 
Implementation steps:
1. Make the constructor `private`.
2. Create a `private static` instance variable of the class.
3. Provide a `public static` method (like `getInstance()`) to return that instance.

### Q: How do you ensure a logger is a Singleton in a multi-threaded application?
**A:** To ensure thread safety, use a Thread-Safe Singleton approach. You can achieve this using an `enum` Singleton, synchronizing the `getInstance()` method, or utilizing **Double-Checked Locking** with a `volatile` instance variable to prevent multiple threads from initializing the logger simultaneously.

### Q: What is the difference between fail-fast and fail-safe iterators?
**A:** * **Fail-Fast:** Throws a `ConcurrentModificationException` immediately if the collection is structurally modified during iteration (e.g., standard `ArrayList`, `HashMap`).
* **Fail-Safe:** Iterates over a clone/snapshot of the collection. It does not throw exceptions if the original collection is modified, ensuring safe concurrent iteration, though it is slightly slower due to the overhead of copying (e.g., `CopyOnWriteArrayList`, `ConcurrentHashMap`).

### Q: What is the difference between `ArrayList` and `LinkedList`? When would you use one over the other?
**A:** * **`ArrayList`:** Backed by a dynamic array. Provides very fast random access ($O(1)$) but slow insertions/removals in the middle ($O(n)$). Use when your application requires frequent reading/accessing.
* **`LinkedList`:** Backed by a doubly-linked list. Provides fast insertions/removals ($O(1)$ once positioned) but slow random access ($O(n)$). Use when your application frequently adds or removes elements at the beginning or middle of the list.

### Q: What is the difference between Abstraction and Encapsulation?
**A:** * **Abstraction:** Hides complex internal implementation details and shows only the necessary features to the user. It focuses on *what* an object does.
* **Encapsulation:** Binds data and methods into a single unit (class) and restricts direct external access to the data (using private fields). It focuses on *how* the data is managed and protected.

---

## 3. SOLID Design Principles

### Q: Explain the SOLID principles briefly.
**A:** SOLID principles help write clean, scalable, and maintainable code:
* **S - Single Responsibility:** A class should have only one job or reason to change.
* **O - Open/Closed:** Classes should be open for extension but closed for modification.
* **L - Liskov Substitution:** Child classes should be able to replace parent classes without breaking the system.
* **I - Interface Segregation:** Create small, specific interfaces rather than one large, general-purpose interface.
* **D - Dependency Inversion:** High-level modules should depend on abstractions (interfaces), not concrete implementations.

### Q: Can you give an example where violating the Open/Closed Principle leads to bugs?
**A:** Suppose you have a `Payment` class handling credit cards. If you manually modify this class to add PayPal logic, you risk introducing bugs that break the existing, already-tested credit card logic. Instead, following Open/Closed, you should extend the functionality by creating a new `PayPalPayment` class implementing a common `PaymentProcessor` interface, leaving the original code completely untouched.

### Q: You are refactoring a payment module. How will you apply the Dependency Inversion Principle?
**A:** First, define an abstraction, such as a `PaymentProcessor` interface. Then, create concrete classes like `CardPayment` and `UPIPayment` that implement this interface. Finally, ensure the main Payment Service depends strictly on the `PaymentProcessor` interface rather than directly instantiating the concrete classes.

---

## 4. Databases & SQL

### Q: What are clustered and non-clustered indexes, and how do they impact query performance?
**A:** * **Clustered Index:** Sorts and stores the actual data rows in the table based on the indexed key. Because the physical data is sorted, there can be only **one** clustered index per table.
* **Non-Clustered Index:** Creates a separate, independent structure (like a lookup table) that contains the index key and a pointer to the actual data row. A table can have multiple non-clustered indexes. Both significantly speed up data retrieval performance.

### Q: Write a SQL query to count duplicate values in a column.
**A:** ```sql
SELECT column_name, COUNT(*)
FROM table_name
GROUP BY column_name
HAVING COUNT(*) > 1;