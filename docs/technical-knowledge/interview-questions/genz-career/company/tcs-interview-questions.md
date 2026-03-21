---
id: tcs-java-developer-interview-13lpa
title: TCS Java Developer Interview Experience & Questions [13 LPA+]
description: A detailed collection of real interview questions and answers from a TCS Java Developer interview. Ideal for candidates with 3.5 years of experience, covering Core Java, Multithreading, Spring Boot, and Microservices.
tags:
  - Java
  - Spring Boot
  - Multithreading
  - Microservices
  - Interview Experience
  - TCS
---

# TCS Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Tata Consultancy Services (TCS) Java Developer interview. The candidate had 3.5 years of experience. The interview covered Core Java, deep Multithreading concepts, Spring Boot internals, and Microservices patterns.

---

## 1. Core Java & Object-Oriented Programming

### Q: How can you make an immutable class in Java?
**A:** To create a truly immutable class in Java:
1. Declare the class as `final` so it cannot be extended by subclasses.
2. Make all fields `private` and `final` so their values are assigned once and cannot be accessed directly.
3. Do not provide any `setter` methods.
4. Initialize all fields via a parameterized constructor.
5. If the class contains mutable object references (like `Date` or `List`), return a deep copy (clone) of those objects in the getter methods instead of the original reference.

### Q: What happens if one of the fields in an immutable class is mutable (like a `List` or `Date`)?
**A:** If a field is mutable and you simply return its reference via a getter, external code can call methods on that reference (e.g., `list.add()`) and modify the internal state of your object, completely breaking immutability. To prevent this, you must return a **defensive copy** of the mutable object in the getter, and also create a defensive copy when assigning the field in the constructor.

### Q: Suppose you have 1 million records. How would you efficiently remove duplicates?
**A:** The most efficient and standard way in Java is to use a **`HashSet`**. A `Set` inherently rejects duplicate elements based on their `hashCode()` and `equals()` implementations. You simply add all 1 million items to the `HashSet`, which strips out the duplicates in near $O(1)$ time per element, and then convert the Set back into an `ArrayList` if index-based access is required.

### Q: What happens if you modify a list while iterating over it?
**A:** If you structurally modify a list (add or remove elements) while iterating over it using a standard `for-each` loop or standard Iterator, Java will immediately throw a **`ConcurrentModificationException`**. To safely remove items during iteration, you must use the explicit `Iterator.remove()` method, or use a concurrent collection like `CopyOnWriteArrayList`.

---

## 2. Multithreading & Concurrency

### Q: What happens if the `main` thread dies but other threads are still running?
**A:** The Java program will **keep running**. The JVM only shuts down when all non-daemon (user) threads have completely finished executing. The `main` thread is just another non-daemon thread. However, if the only threads left running are *daemon threads* (background tasks like Garbage Collection), the JVM will terminate them automatically and exit.

### Q: When would you prefer `ReentrantLock` over the `synchronized` keyword?
**A:** You should use `ReentrantLock` when you need advanced concurrency control that intrinsic `synchronized` blocks do not provide. These advanced features include:
* **`tryLock()`:** Attempting to acquire a lock with a timeout, preventing threads from waiting indefinitely and causing deadlocks.
* **Fairness Policies:** Ensuring the longest-waiting thread gets the lock next.
* **Interruptibility:** The ability to interrupt a thread while it is actively waiting for a lock.

### Q: What is the difference between `wait()`, `sleep()`, and `yield()` methods?
**A:** * **`wait()`:** Called on an object. It releases the monitor lock and pauses the thread until another thread calls `notify()` or `notifyAll()`.
* **`sleep()`:** Called on the Thread class. It pauses the thread for a specified duration but **does not** release any acquired locks.
* **`yield()`:** Gives a hint to the thread scheduler that the current thread is willing to temporarily pause and give up its CPU time slice to other threads of the same priority. It does not release locks and there is no guarantee the scheduler will honor the hint.

### Q: How can you make a Thread-Safe Singleton?
**A:** The most robust ways to create a thread-safe Singleton in a highly concurrent environment are:
1. **Double-Checked Locking:** Using a `volatile` instance variable and a `synchronized` block inside the `getInstance()` method.
2. **Enum Singleton:** The cleanest approach, natively thread-safe and immune to reflection/serialization hacks.
3. **Bill Pugh Singleton:** Using a `private static` inner helper class.

### Q: Suppose you have three threads that must run in exact order (T1 -> T2 -> T3). How will you achieve that?
**A:** The simplest way is to use the **`Thread.join()`** method. 
You start T1. Inside the main thread (or immediately before starting T2), you call `T1.join()`. This forces the main thread to wait until T1 finishes. Then you start T2 and call `T2.join()`. Finally, you start T3. Alternatively, you can use concurrency utilities like `CountDownLatch` or `Semaphore`.

### Q: What happens if one thread throws an unchecked exception inside an `ExecutorService`?
**A:** It **does not** crash the other threads in the pool or the main application. The `ExecutorService` catches the exception and wraps it inside the `Future` object returned by the submitted task. The application will only become aware of the exception when you explicitly call the `Future.get()` method, which will then throw an `ExecutionException`.

---

## 3. Collections Framework

### Q: Differentiate between `HashMap`, `LinkedHashMap`, and `TreeMap`.
**A:** All three store Key-Value pairs but differ in how they order data:
* **`HashMap`:** Completely unordered. Provides the fastest performance ($O(1)$) but gives zero guarantees on iteration order.
* **`LinkedHashMap`:** Maintains the exact **insertion order** of the elements using a doubly-linked list running through its entries.
* **`TreeMap`:** Maintains a strictly **sorted order** (ascending by keys, or via a custom Comparator) using a Red-Black tree structure ($O(\log n)$ performance).

### Q: How does `HashMap` handle collisions internally? What happens when many keys end up in the same bucket?
**A:** A collision occurs when two different keys generate the exact same Hash Code and route to the same bucket array index. 
* `HashMap` handles this by storing the colliding entries in a **Linked List** at that specific bucket. 
* If too many keys end up in the same bucket (usually > 8), Java automatically converts that Linked List into a **Balanced Tree (Red-Black Tree)** to optimize search times. As collisions increase, lookups become slower because the map must traverse the tree/list and compare each key using the `equals()` method to find the exact match.

### Q: What is `ConcurrentHashMap` and how is it different from a `SynchronizedMap`?
**A:** * **`SynchronizedMap`:** Locks the *entire* map object for every single read or write operation, creating a massive bottleneck in multi-threaded environments.
* **`ConcurrentHashMap`:** Uses fine-grained locking (segment locking or bucket-level locking). It allows multiple threads to read and write to different buckets safely and simultaneously without locking the entire map, vastly improving concurrency performance.

---

## 4. Spring Boot & Architecture

### Q: Explain the flow when a REST request hits a Spring Boot controller.
**A:** 1. The HTTP request hits the embedded web server (like Tomcat).
2. It is intercepted by the Spring **`DispatcherServlet`** (the Front Controller).
3. The `DispatcherServlet` consults the **`HandlerMapping`** to find the specific Controller method mapped to that URL path.
4. The request is routed to the Controller method, which executes the business logic.
5. Because it is a REST request (using `@RestController`), the returned Java object is automatically serialized into JSON/XML via `HttpMessageConverters` and written directly into the HTTP response body.

### Q: You have two beans of the same type. How will Spring decide which one to inject?
**A:** Spring will get confused and throw a `NoUniqueBeanDefinitionException` during startup. You must explicitly resolve this ambiguity by either:
1. Adding the **`@Primary`** annotation to one of the beans to make it the default choice.
2. Using the **`@Qualifier("beanName")`** annotation at the injection point (next to `@Autowired`) to tell Spring exactly which bean ID to inject.

### Q: What is the difference between `request`, `session`, and `prototype` scope beans?
**A:** * **`request` scope:** A brand new bean instance is created for every single HTTP request and destroyed when the request completes.
* **`session` scope:** One bean instance is created per unique user HTTP session.
* **`prototype` scope:** A brand new bean instance is created every single time the Spring container is asked for it (via `@Autowired` or `getBean()`).

### Q: How do you handle exceptions globally in Spring Boot and return a custom error response structure?
**A:** 1. Create a global exception handler class and annotate it with **`@ControllerAdvice`** (or `@RestControllerAdvice`).
2. Inside it, write methods annotated with **`@ExceptionHandler(SpecificException.class)`**.
3. Create a custom POJO class (e.g., `ApiErrorResponse` containing fields like `timestamp`, `status`, and `message`).
4. In the handler method, instantiate this POJO, populate it with the error details, and return it wrapped inside a `ResponseEntity`. This ensures the client always receives a clean, predictable JSON error structure.

### Q: What happens if you call an `@Transactional` method from a non-transactional method inside the exact same class?
**A:** The transaction **will not start**. Spring's transaction management relies on AOP (Aspect-Oriented Programming) proxies. When a method is called from *outside* the class, the proxy intercepts the call and starts the transaction. If you call the method from *within the same class*, you bypass the proxy completely, and the `@Transactional` logic is entirely ignored.

### Q: How do two Microservices communicate with each other? When to use synchronous vs. asynchronous?
**A:** Microservices communicate using:
* **Synchronous:** HTTP REST calls (using `RestTemplate` or `FeignClient`) or gRPC. 
  * *Use when:* An immediate, instant response is required to proceed (e.g., verifying a user's login credentials or checking if an item is in stock before payment).
* **Asynchronous:** Message Queues or Event Brokers (like Kafka or RabbitMQ).
  * *Use when:* The task takes time and the calling service doesn't need to wait (e.g., sending a welcome email, processing a background report, or updating search indexes).

### Q: What is the Circuit Breaker pattern and how does it help?
**A:** The Circuit Breaker pattern (implemented via libraries like Resilience4j) protects a system from cascading failures. If a downstream microservice fails repeatedly or times out, the circuit "opens" and immediately stops sending requests to that failing service. Instead, it returns an error or a Fallback response instantly. This prevents the upstream service from exhausting its thread pools waiting for timeouts and gives the failing service time to recover.