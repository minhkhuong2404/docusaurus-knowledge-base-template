---
id: ntt-data-java-developer-interview
title: NTT Data Java Developer Interview Experience & Questions [15 LPA+]
description: A detailed collection of real interview questions and answers from an NTT Data Java Developer interview. Ideal for candidates with 3.8 years of experience, covering Multithreading, Core Java internals, Spring Boot, and Security.
tags:
  - Java
  - Spring Boot
  - Multithreading
  - Memory Management
  - Interview Experience
  - NTT Data
---

# NTT Data Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during an NTT Data Java Developer interview. The candidate had 3.8 years of experience. The interview heavily focused on Core Java internals (Classloaders, Memory Leaks), deep Multithreading concepts, Collections, and Spring Boot Auto-Configuration.

---

## 1. Core Java Internals & Exception Handling

### Q: If a method has `try`, `catch`, and `finally` blocks, and the `try` block returns a value, which value is finally returned?
**A:** The `finally` block will always execute *before* the method actually returns the value to the caller. The value evaluated in the `try` block is stored temporarily. Once the `finally` block finishes, that stored value is returned. 
**Exception:** If the `finally` block explicitly executes its own `return` statement or throws a new exception, it will completely override the `try` block's return value.

### Q: What are the different ways to create an object in Java?
**A:** There are four primary ways:
1. Using the **`new` keyword** (the most common).
2. Using **Reflection** (`Class.forName("...").newInstance()` or `Constructor.newInstance()`).
3. Using **Deserialization** (recreating an object from a byte stream).
4. Using **`clone()`** (creating a copy of an existing object).

### Q: What happens if a class doesn't have a default constructor and you try to create an object without parameters?
**A:** If you don't write *any* constructor, Java provides a default no-argument constructor automatically. However, if you explicitly define a parameterized constructor and *do not* write a default one, calling `new ClassName()` with no arguments will throw a **compile-time error**.

### Q: Explain the Class Loading process in Java. Can a class be loaded twice?
**A:** The Class Loading process consists of three steps:
1. **Loading:** The `ClassLoader` reads the `.class` file into memory.
2. **Linking:** Includes Verification (checking bytecode formatting), Preparation (allocating memory for static variables and assigning default values), and Resolution.
3. **Initialization:** Static blocks are executed, and static variables are assigned their actual defined values.
**Can it be loaded twice?** A class cannot be loaded twice by the *exact same* ClassLoader. However, it *can* be loaded multiple times by *different* ClassLoaders (which is common in web servers like Tomcat, where different deployed applications have isolated class loaders).

### Q: How does Java handle memory leaks even though it has Garbage Collection?
**A:** The Garbage Collector (GC) is only responsible for removing **unreachable** objects (objects that have no active references). If a developer creates objects and stores them in a long-lived structure (like a `static HashMap` or an application-level Cache) but forgets to remove them when they are no longer needed, those objects maintain active references. The GC will assume they are still in use and will not destroy them, leading to a Memory Leak that eventually causes an `OutOfMemoryError`.

---

## 2. Multithreading & Concurrency

### Q: What happens if you start a thread twice?
**A:** If you call the `start()` method twice on the exact same `Thread` instance, Java will throw an **`IllegalThreadStateException`**. A thread can only be started once. Once it finishes execution, it reaches the `TERMINATED` state and can never be restarted or reused.

### Q: What is the output of calling `run()` directly instead of `start()`?
**A:** If you call `run()` directly, **no new thread is created**. The `run()` method simply executes synchronously as a standard method call within the current (calling) thread. 

### Q: How would you return a value from a thread?
**A:** To return a value, you should implement the **`Callable<T>`** interface instead of `Runnable`. You submit this `Callable` task to an `ExecutorService` using the `submit()` method. The `ExecutorService` immediately returns a **`Future<T>`** object. You can later call `future.get()` to pause the current thread, wait for the background thread to finish, and retrieve the output value.

### Q: How does `ThreadPoolExecutor` manage threads internally? What happens if all threads are busy?
**A:** A `ThreadPoolExecutor` maintains a pool of reusable worker threads. When a task arrives, an idle thread picks it up. Once finished, the thread returns to the pool, preventing the severe performance overhead of continuously creating and destroying threads.
**If all threads are busy:** New incoming tasks are placed into a Blocking Queue. If the queue becomes completely full and the maximum thread limit is reached, the executor will reject the task and throw a **`RejectedExecutionException`** (based on its configured Rejection Policy).

### Q: Suppose you have 100 tasks but only 10 threads available. How will you execute all efficiently?
**A:** I would use an `ExecutorService` initialized with a fixed thread pool of 10 threads (`Executors.newFixedThreadPool(10)`). The executor will run the first 10 tasks concurrently. The remaining 90 tasks will sit safely in the internal queue. As soon as any of the active 10 threads finishes its task, it will automatically poll the queue and start executing the 11th task, continuing this cycle until all 100 tasks are completed.

### Q: What is the `volatile` keyword and how is it different from `synchronized`?
**A:** * **`volatile`:** Ensures memory visibility. It forces all threads to read and write the variable directly from Main Memory, bypassing local CPU caches. This ensures threads always see the freshest value. However, it does **not** provide atomicity (it won't prevent race conditions for operations like `count++`).
* **`synchronized`:** Provides both visibility AND atomicity by explicitly locking the block of code, ensuring only one thread can execute it at a time. 

### Q: Explain the `CompletableFuture` class and give a real-world use case.
**A:** `CompletableFuture` is an advanced concurrency API that allows for writing non-blocking, asynchronous code. It supports chaining callbacks (`thenApply`, `thenAccept`) so the main thread doesn't have to block waiting for results.
* **Use Case:** An API endpoint needs to aggregate a user's profile data from 3 separate microservices (Billing, Shipping, and Rewards). Instead of querying them sequentially, you can trigger 3 `CompletableFuture.supplyAsync()` calls concurrently, and then use `CompletableFuture.allOf()` to merge the results in parallel, massively reducing the overall API response time.

---

## 3. Collections Framework

### Q: How does `HashSet` ensure uniqueness internally?
**A:** A `HashSet` is backed by a `HashMap` internally. When you add an element to a `HashSet`, Java actually inserts it as a **Key** into the underlying `HashMap` (with a dummy constant object as the value). Because Maps do not allow duplicate keys, it uses the element's `hashCode()` and `equals()` methods to check if it already exists, thereby guaranteeing uniqueness.

### Q: What happens if you don't override `hashCode` properly?
**A:** It violates the `equals/hashCode` contract. If two logically equal objects (e.g., two Employees with ID 101) generate different default memory-based hash codes, the `HashMap` will route them to different buckets. This causes duplicates to appear in Sets, and lookups (`map.get()`) to fail and return `null` because the map checks the wrong bucket.

### Q: Difference between `ArrayList` and `CopyOnWriteArrayList`. When would you prefer the latter?
**A:** * **`ArrayList`:** Not thread-safe. Modifying it concurrently will cause data corruption or a `ConcurrentModificationException`.
* **`CopyOnWriteArrayList`:** Thread-safe. It achieves safety by making a completely fresh copy of the underlying array every single time an element is added, updated, or removed.
* **Preference:** It should be used when an application has a massive amount of concurrent **reads** and very few **writes** (e.g., caching configurations, application whitelists, or listener registries). If updates happen frequently, the constant array copying overhead will destroy performance.

### Q: What's the difference between Fail-Fast and Fail-Safe iterators? Which collections are Fail-Safe?
**A:** * **Fail-Fast:** Throws a `ConcurrentModificationException` immediately if the collection is structurally modified during iteration (e.g., standard `ArrayList`, `HashMap`).
* **Fail-Safe:** Does not throw errors because it iterates over a *clone* or *snapshot* of the collection. Any changes made to the collection during iteration simply aren't reflected in the current loop.
* **Fail-Safe Collections:** `ConcurrentHashMap`, `CopyOnWriteArrayList`, and `CopyOnWriteArraySet`.

---

## 4. Spring Boot & Architecture

### Q: What happens behind the scenes when a Spring Boot app starts?
**A:** 1. The `SpringApplication.run()` method is invoked.
2. It creates the Spring Application Context.
3. It performs Component Scanning (`@ComponentScan`) to find all `@Component`, `@Service`, and `@Controller` classes.
4. It triggers Auto-Configuration, evaluating conditions to set up necessary beans.
5. It initializes all Singleton beans.
6. Finally, it starts the embedded web server (like Tomcat or Jetty) and binds it to the configured port.

### Q: How does Auto-Configuration work internally?
**A:** Triggered by the `@EnableAutoConfiguration` annotation, Spring Boot checks the classpath dependencies and defined properties. It reads the `META-INF/spring.factories` file (or the newer auto-configuration imports file) to locate all candidate auto-configuration classes. It then uses `@Conditional` annotations (like `@ConditionalOnClass`, `@ConditionalOnMissingBean`) to dynamically decide which beans to instantiate and configure automatically.

### Q: What is the difference between `@Component` and `@Bean`? If you declare both for the same class, which takes precedence?
**A:** * **`@Component`:** A class-level annotation. Spring automatically detects it during component scanning and instantiates it.
* **`@Bean`:** A method-level annotation used strictly inside `@Configuration` classes. It tells Spring that the method will manually instantiate, configure, and return an object to be registered in the context.
* **Precedence:** If both exist for the same type, the manually and explicitly defined `@Bean` method takes precedence and overrides the auto-detected `@Component`.

### Q: Does Spring manage Dependency Injection at compile time or runtime?
**A:** At **runtime**. The Spring IoC container parses configurations, utilizes Reflection to dynamically create objects, and injects the necessary dependencies precisely when the Application Context is starting up.

### Q: How would you implement Role-Based Access Control (RBAC) in a REST API?
**A:** 1. Define roles (e.g., `ROLE_USER`, `ROLE_ADMIN`) and store them in the database alongside user credentials.
2. During JWT token generation (upon login), encode these roles into the token claims.
3. On incoming requests, a Spring Security filter parses the JWT, extracts the roles, and maps them to the `SecurityContext` as `GrantedAuthority` objects.
4. Use method-level security annotations like **`@PreAuthorize("hasRole('ADMIN')")`** on the specific controller endpoints. If a basic user tries to access it, Spring automatically intercepts and returns a `403 Forbidden` response.

---

## 5. Coding Questions
*The candidate was asked to write code for the following scenarios:*
1. **Thread-Safe Singleton:** Implement your own Singleton class using Double-Checked Locking.
2. **LRU Cache:** Implement a Least Recently Used (LRU) Cache data structure by extending Java's built-in `LinkedHashMap` and overriding the `removeEldestEntry()` method.