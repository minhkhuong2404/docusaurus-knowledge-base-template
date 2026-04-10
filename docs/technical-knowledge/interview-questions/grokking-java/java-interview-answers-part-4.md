---
id: java-interview-answers-part-4
title: Java Interview Q&A - Design Patterns & GC
description: Comprehensive answers to Java Software Design Patterns and Garbage Collection interview questions.
sidebar_position: 6
tags: [java, interview, design-patterns, solid, garbage-collection, jvm, answers]
---

# Java Interview Questions & Answers: Part 4

## Object-Oriented Design Principles and Patterns

### 1. What is the Decorator pattern in Java? Can you give an example?
The Decorator pattern is used to add or modify functionality of an already created object at runtime without altering its structure. A classic example from the JDK is the `java.io` package, where `BufferedReader` and `BufferedWriter` act as decorators around `FileReader` and `FileWriter`.

### 2. When to use the Strategy Design Pattern in Java?
Use it when you have a set of related algorithms (like compression, sorting, or filtering strategies) and want to be able to switch between them dynamically at runtime. The `Collections.sort()` method is a prime example, where the `Comparator` interface acts as the strategy, allowing developers to pass different sorting logic without modifying the underlying `sort` method.

### 3. What is the Observer design pattern in Java? When do you use it?
The Observer pattern is a publish-subscribe model involving two types of objects: the Subject and the Observer. It is used when a change to one object requires changing others, and you don't know how many objects need to be changed. Whenever the Subject's state changes, all registered Observers receive a notification.

### 4. What is the difference between Strategy and State design Pattern?
While both have the exact same UML class diagram/structure, their intent is different. The **State** pattern is used to define and manage the internal state of an object, allowing it to change its behavior when its internal state changes. The **Strategy** pattern is client-driven; it is used to define interchangeable algorithms and lets the client explicitly choose which one to use.

### 5. When to use the Composite design pattern in Java?
Use it when you want to treat individual objects and compositions of objects uniformly. It is perfect for representing part-whole hierarchies. A good example in the JDK is the `JPanel` class, which acts as both a `Component` and a `Container`. When `paint()` is called on a `JPanel`, it cascades the call down to all individual components it holds.

### 6. What is the Singleton pattern in Java?
It is a creational pattern that restricts the instantiation of a class to exactly one single object for the entire application. A real-world JDK example is `java.lang.Runtime.getRuntime()`.

### 7. Can you write a thread-safe Singleton in Java?
Yes, there are multiple ways: using double-checked locking (with the `volatile` keyword), using a static instance initialized during class loading, or (the most modern and robust approach) by using a Java `enum`.

### 8. When to use the Template method design pattern?
Use it when you want to outline the skeleton of an algorithm in a base class but let subclasses override specific steps. The base class contains a `final` template method to dictate the overall sequence and prevent overriding, while delegating the specific, customizable steps to `abstract` methods that child classes must implement.

### 9. What is the Factory pattern in Java? Advantages of static factory methods?
It is a creational pattern that provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created. Providing a static factory method (instead of a public constructor) allows for caching immutable objects, returning subtypes, and using descriptive method names.

### 10. What is the difference between Decorator and Proxy pattern?
Both implement the interface of the object they encapsulate, but their intents differ. A **Proxy** is used to control access to an object (e.g., lazy loading, security checking), and it usually creates the object itself. A **Decorator** is used to add new functionality to an existing object, and it usually receives the existing object via its constructor.

### 11. When to use Setter vs. Constructor Injection in Dependency Injection?
Use **Constructor Injection** for mandatory dependencies—without them, the object simply cannot function or be properly instantiated. Use **Setter Injection** for optional dependencies or defaults that can be swapped out later.

### 12. What is the difference between Factory and Abstract Factory?
A Factory creates objects (products). An Abstract Factory creates *other factories* (families of related products). Simply put, Abstract Factory abstracts the creation of the factories themselves.

### 13. When to use the Adapter pattern in Java?
Use it when you need to make two unrelated, incompatible interfaces work together. It acts as a bridge. It is often used to encapsulate legacy or third-party code so your internal application only depends on the Adapter, allowing you to easily swap the third-party library later without breaking your system.

### 14. Can you implement a Producer-Consumer design pattern in Java?
Yes, in modern Java (JDK 5+), the easiest and safest way to implement this concurrency pattern is by using `java.util.concurrent.BlockingQueue`, which handles all the wait/notify synchronization logic internally.

### 15. What is the Builder design pattern in Java?
It is a creational pattern used to construct complex objects step by step. It is highly useful when an object requires multiple configuration properties, some of which are optional and some mandatory, preventing the "telescoping constructor" anti-pattern (constructors with a massive list of parameters).

### 16. What is the Open-Closed design principle (OCP)?
It states that software entities (classes, modules, functions) should be **open for extension, but closed for modification**. You should be able to add new functionality by writing new code (e.g., implementing an interface) rather than modifying existing, tested, and working code.

### 17. What are the SOLID design principles?
SOLID is an acronym for five core design principles:
* **S:** Single Responsibility Principle (SRP)
* **O:** Open-Closed Principle (OCP)
* **L:** Liskov Substitution Principle (LSP)
* **I:** Interface Segregation Principle (ISP)
* **D:** Dependency Inversion Principle (DIP)

### 18. Abstraction vs. Encapsulation in Java?
**Abstraction** hides the logical complexity by exposing only the essential features of an object (what it does). **Encapsulation** hides the physical complexity and internal state by restricting access to data and bundling the data with the methods that operate on it (how it does it).

---

## Garbage Collection (GC) and JVM Internals

### 1. What is the structure of Java Heap? What is PermGen space?
The Java Heap is broadly divided into the **Young Generation** (Eden space, Survivor spaces) and the **Old (Tenured) Generation**. 
*Note: Prior to Java 8, there was also **PermGen (Permanent Generation)**, which stored class metadata and string pools. In Java 8, PermGen was removed and replaced by **Metaspace**, which resides in native memory.*

### 2. How do you identify minor and major garbage collection in logs?
If GC logging is enabled (`-verbose:gc` or `-XX:+PrintGCDetails`), a minor collection prints `[GC ...]`, whereas a major (full) collection prints `[Full GC ...]`.

### 3. What is the difference between ParNew and DefNew Garbage Collectors?
Both are Young Generation collectors. **DefNew** (Default New) is a single-threaded collector used alongside the Serial GC. **ParNew** (Parallel New) is a multi-threaded collector generally used in tandem with the Concurrent Mark Sweep (CMS) collector.

### 4. How do you identify GC resulting from calling System.gc()?
In the GC output logs, the word `System` will be explicitly included in the log entry indicating that the collection was manually requested.

### 5. What is the difference between Serial and Throughput Garbage collectors?
* **Serial GC:** (`-XX:+UseSerialGC`) A "stop-the-world" single-threaded collector designed for small, client-side applications without strict pause-time requirements.
* **Throughput (Parallel) GC:** (`-XX:+UseParallelGC`) A multi-threaded collector that performs minor and major collections in parallel, taking full advantage of multi-core CPUs to maximize total application throughput, though it still introduces "stop-the-world" pauses.

### 6. When does an object become eligible for Garbage Collection?
An object is eligible when it is no longer reachable by any live thread (there are no active references to it). Cyclic references (e.g., Object A points to Object B, and Object B points to Object A) do not prevent GC if neither object is reachable from a live root.

### 7. What is the finalize() method? When does GC call it?
The `finalize()` method is defined in `java.lang.Object`. It is called by the Garbage Collector right before the object is reclaimed, giving it one last chance to perform cleanup operations (like closing file handles or network sockets). *Note: Relying on `finalize()` is heavily discouraged in modern Java.*

### 8. If Object A references B, and B references A, with no other references, are they eligible for GC?
Yes. The JVM's Garbage Collector uses a "Reachability" algorithm (tracing from GC Roots), not simple reference counting. An isolated island of objects with cyclic dependencies is completely eligible for collection.

### 9. Can we force the Garbage Collector to run?
No. You can explicitly request it using `System.gc()` or `Runtime.getRuntime().gc()`, but the JVM ultimately decides when and if it will actually run the garbage collection cycle.

### 10. Does Garbage Collection occur in the PermGen space?
Yes, GC does occur in the PermGen space to clear out unreferenced classes and interned strings. If PermGen gets full, it triggers a Full GC. *(Again, note that PermGen was replaced by Metaspace in Java 8).*

### 11. How do you monitor garbage collection activities?
You can monitor it in real-time using GUI tools like **JConsole** or **VisualVM** (with the Visual GC plugin). For offline analysis, you can redirect the logs to a file using JVM flags like `-Xloggc:<path>`, `-XX:+PrintGCDetails`, and `-XX:+PrintGCTimeStamps`.

### 12. Interpret this Garbage Collection Output snippet:
```text
[GC [ParNew: 1512K->64K(1512K), 0.0635032 secs] 15604K->13569K(600345K), 0.0636056 secs] [Times: user=0.03 sys=0.00, real=0.06 secs]
```
1.  **Major or Minor?** Minor (It says `[GC`, not `[Full GC`).
2.  **Which Young Gen GC is used?** `ParNew` (multi-threaded).
3.  **Sizes:** Young Generation total size is `1512K`. Total Heap size is `600345K`.
4.  **Memory Freed:** Total heap dropped from `15604K` to `13569K`, so it freed `2035K`.
5.  **Time Taken:** `0.0636056 secs` in total.
6.  **Current Occupancy of Young Gen:** `64K` (dropped from 1512K down to 64K).
```