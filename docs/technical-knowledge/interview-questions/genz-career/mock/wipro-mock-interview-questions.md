---
id: wipro-java-springboot-interview-3-years
title: Wipro 3 Years Interview Experience [Java Springboot]
description: A detailed collection of real interview questions and answers from a Wipro Java Developer interview. Ideal for candidates with ~3 years of experience, covering JVM Internals, Memory Management, Spring Boot, and Core Java snippets.
tags:
  - Java
  - Spring Boot
  - JVM
  - Memory Management
  - Interview Experience
  - Wipro
---

# Wipro Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Wipro Java Developer interview. The candidate had 3 years of backend experience. The interview thoroughly tested foundational Core Java concepts (specifically JVM architecture and memory management), multithreading, Spring Boot tooling, and code snippet debugging.

---

## 1. JVM Architecture & Internals

### Q: What is the difference between JVM, JRE, and JDK?
**A:** * **JVM (Java Virtual Machine):** The abstract engine that executes Java bytecode. It is platform-dependent and provides the runtime environment where Java code actually runs.
* **JRE (Java Runtime Environment):** A software package for end-users to run Java applications. It contains the JVM along with the core standard Java class libraries.
* **JDK (Java Development Kit):** A complete software development environment for programmers. It contains everything in the JRE, plus essential development tools like the compiler (`javac`), debugger (`jdb`), and documentation generator (`javadoc`).

### Q: Can a Java application be run without installing the JRE?
**A:** Traditionally, no. You needed the JRE installed on the host machine to run Java. However, in modern Java (Java 9+), you can use a tool called **`jlink`** to create a custom, stripped-down runtime image. This bundles only the required parts of the JRE directly into your application, allowing it to run independently on a target machine without requiring the user to pre-install Java.

### Q: Is it possible to have the JDK installed without having the JRE?
**A:** No. When you install the JDK, the JRE is automatically bundled and installed within it, because the JDK needs the JRE to execute and test the code you develop.

### Q: How does the JVM contribute to Java's Platform Independence?
**A:** Java achieves platform independence via the phrase "Write Once, Run Anywhere." When you compile Java code, it turns into a universal, platform-neutral format called **Bytecode**. The JVM acts as a dynamic translator. There is a specific, platform-dependent JVM for every operating system (Windows, Mac, Linux). The JVM takes the universal Bytecode and translates it on-the-fly into the specific native machine code of the device it is running on.

### Q: What are the memory storage areas available within the JVM?
**A:** * **Heap Area:** Where all objects and arrays are dynamically allocated. It is managed by the Garbage Collector.
* **Stack Area:** Stores method execution frames, local variables, and method calls. Each thread has its own isolated stack.
* **Method Area:** Holds class-level structure information, runtime constant pool, and static variables.
* **Metaspace:** (Replaced PermGen in Java 8). Uses native memory to hold metadata about the classes loaded by the JVM.

### Q: How does the JVM optimize memory management? Discuss the roles of the Young and Old Generations.
**A:** The JVM optimizes memory using automatic **Garbage Collection (GC)**. To make this highly efficient, the Heap memory is divided into generations:
* **Young Generation:** Where all new objects are initially created. Because most objects die very quickly (short-lived), this area is cleaned frequently using a *Minor GC*, which is a very fast process.
* **Old (Tenured) Generation:** Objects that survive multiple cleanup cycles in the Young Generation are promoted here. This area holds long-living objects. It is cleaned much less frequently using a *Major GC*, which is a heavier and slower process. This generational split drastically reduces the CPU overhead of checking the entire heap for unused objects.

---

## 2. Core Java & Multithreading

### Q: What is the difference between `Iterator` and `ListIterator`?
**A:** * **`Iterator`:** Can be used with any Collection (List, Set, Queue). It can only traverse the collection in a forward direction (one step at a time) and only allows removing elements.
* **`ListIterator`:** Can only be used with `List` implementations. It allows traversing the list in *both* forward and backward directions. Additionally, it allows you to add, replace, or remove elements during the iteration.

### Q: How do you make a read-only `ArrayList` in Java and what is its use case?
**A:** You can create a read-only list by passing your existing list into **`Collections.unmodifiableList(list)`**. 
* **Use Case:** Security and Data Integrity. When you need to return an internal list from a class to external clients or third-party libraries, wrapping it ensures that external code cannot accidentally or maliciously add, remove, or alter the data (it will throw an `UnsupportedOperationException`).

### Q: Can we start a thread twice?
**A:** No. Once a thread has been started, executes its `run()` method, and dies, it enters the `TERMINATED` state and cannot be restarted. If you attempt to call `start()` again on the same thread object, the JVM will instantly throw an **`IllegalThreadStateException`**. To run the task again, you must instantiate a brand new Thread object.

### Q: Explain `public static void main(String[] args)`. What happens if we omit the `static` keyword?
**A:** It is the standard entry point of a Java application.
* **`public`:** Accessible everywhere so the JVM can execute it.
* **`static`:** Allows the JVM to invoke the method directly on the class level without having to instantiate an object first.
* **`void`:** It does not return any value.
* **`args`:** An array capturing command-line arguments.
* **If `static` is omitted:** The program will successfully compile. However, at runtime, the JVM will fail to start the program and throw a `NoSuchMethodError: main method is not static` because it cannot call an instance method without creating an object.

---

## 3. Spring Boot Tools & Security

### Q: How do you secure a REST API in Spring Boot?
**A:** 1. Add **Spring Security** dependencies.
2. Implement stateless authentication using **JWT (JSON Web Tokens)** so the server doesn't need to manage sessions.
3. Enable **HTTPS** (SSL/TLS) to encrypt all data in transit.
4. Use method-level security (like **`@PreAuthorize("hasRole('ADMIN')")`**) for fine-grained role-based access control.
5. Configure proper **CORS** (Cross-Origin Resource Sharing) policies to prevent unauthorized domains from making requests.
6. Implement Rate Limiting to protect against abuse and brute-force attacks.

### Q: What are Spring Boot DevTools?
**A:** `spring-boot-devtools` is a dependency that drastically speeds up the development process. 
* **Automatic Restart:** It monitors the classpath for file changes and automatically restarts the application. It is much faster than a manual restart because it uses two classloaders (reloading only your modified code, not the heavy third-party libraries).
* **Live Reload:** It integrates with the browser to automatically refresh the webpage when static resources or templates are updated.

### Q: Explain the difference between Actuator and Micrometer in Spring Boot.
**A:** * **Actuator:** Acts like a dashboard for your application. It exposes ready-to-use HTTP endpoints (like `/health`, `/env`, `/info`) that provide deep operational insights into the application's running state.
* **Micrometer:** Acts as a metrics-gathering facade (similar to what SLF4J is for logging). It instruments your code to measure timers, gauges, and counters (e.g., HTTP request latency), and formats that data so it can be exported to external monitoring systems like Prometheus or Datadog.

### Q: How do you resolve the "Whitelabel Error Page" in a Spring Boot application?
**A:** The Whitelabel Error Page is Spring's default fallback UI when a server error occurs or a URL is entirely unmatched (404). To resolve or replace it:
1. Create a custom HTML file named exactly `error.html` and place it in the `src/main/resources/templates` folder. Spring Boot will automatically serve this instead.
2. Implement a custom `@ControllerAdvice` to catch exceptions globally and return standardized JSON error responses instead of an HTML view (ideal for REST APIs).

---

## 4. Code Snippets (Output Tracing)

### Q: Code Snippet 1 (Control Flow)
```java
if (true) {
    break;
}
```
**Output:** **Compilation Error**
**Reason:** The `break` statement can only be used inside loops (`for`, `while`, `do-while`) or `switch` statements to exit the block. It cannot be used standalone inside an `if` statement.

### Q: Code Snippet 2 (Access Modifiers & Overriding)
```java
class Base {
    protected void foo() { ... }
}
class Derived extends Base {
    void foo() { ... } // Default access modifier
}
```
**Output:** **Compilation Error**
**Reason:** When overriding a method in Java, you are absolutely **not allowed to assign a more restrictive access modifier** than the parent class's method. The parent method is `protected`. The child method is `default` (package-private), which is stricter. The child method must be `protected` or `public`.

### Q: Code Snippet 3 (Constructors)
```java
class Complex {
    int id;
    Complex(int id) { this.id = id; }
}
// Inside main:
Complex c = new Complex();
```
**Output:** **Compilation Error**
**Reason:** If you do not write any constructor, the Java compiler automatically provides a default, no-argument constructor. However, if you explicitly define a parameterized constructor (`Complex(int id)`), the compiler *does not* provide the default one. Attempting to call `new Complex()` without passing an argument will fail. You must explicitly define `Complex() {}` in the class to fix this.
