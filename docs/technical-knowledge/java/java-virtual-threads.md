---
id: java-virtual-threads
title: "Virtual Threads (Project Loom)"
slug: java-virtual-threads
description: "A comprehensive deep dive into Java 21 Virtual Threads, Carrier Threads, continuations, and avoiding synchronized pinning for senior engineers."
tags: [java, concurrency, virtual-threads, loom, backend]
---

# 🧵 Virtual Threads (Project Loom)

Introduced as a stable feature in Java 21, **Virtual Threads** (Project Loom) completely revolutionize the Java concurrency model. They solve the fundamental physical bottleneck of Tomcat and Spring Boot servers: the "Thread-Per-Request" model.

---

## 1. The Bottleneck: Platform Threads

For the last 25 years, every time you called `new Thread()`, Java created a **Platform Thread**. A Platform Thread is a 1-to-1 wrapper around an Operating System (OS) thread.

### The Problem
OS threads are incredibly heavy.
1. They require ~1MB of RAM just for their call stack. If you create 10,000 threads, you've instantly burned 10GB of RAM just for idle stacks.
2. Generating a thread involves trapping the OS kernel (a massive CPU penalty).
3. Switching between threads (Context Switching) takes 1-5 microseconds.

Because of this, traditional servers use **Thread Pools** capped at around 200 threads. If 201 users try to download a slow file from your server at the same time, the 201st user hangs forever until one of the 200 threads finishes its download.

---

## 2. What is a Virtual Thread?

Virtual threads are managed entirely by the **Java Virtual Machine (JVM)**, not the OS. They are extraordinarily cheap to create, consume only bytes of memory, and you can comfortably create **millions** of them on a standard laptop.

### 👶 Beginner Concept: The "Call Center Operator"
Imagine a giant customer service Call Center.
- **Platform Threads:** You hire 200 employees (OS Threads). Every time the phone rings, an employee picks up. The customer says, "Hold on, let me find my credit card." The employee is forced to hold the phone to their ear in total silence for 5 minutes (Blocking I/O). Meanwhile, 10,000 other customers are getting a busy signal because all 200 employees are waiting on hold.
- **Virtual Threads:** You still have 200 employees (Carrier Threads), but now they have millions of active phone lines (Virtual Threads). When a customer says, "Hold on," the employee instantly puts that line on hold (Unmounting) and immediately answers the next ringing phone. When the first customer finally finds their credit card, the employee grabs that line back (Mounting) and continues the transaction.

Nobody ever gets a busy signal!

---

## 3. How Virtual Threads Work (Under the Hood)

Virtual threads decouple the Java thread from the OS thread.

1. **The Carrier Thread:** The JVM maintains a small underlying ForkJoinPool of standard OS Platform Threads (usually equal to the number of CPU cores).
2. **Mounting:** When you execute a Virtual Thread, the JVM mounts it onto an available Carrier Thread.
3. **Unmounting (The Magic):** When your Virtual Thread makes a blocking call (e.g., `Thread.sleep()`, `HttpClient.send()`, `JDBC query`), the JVM detects this. It instantly copies the Virtual Thread's call stack into the Java Heap memory (a Continuation) and **unmounts** it.
4. **Re-mounting:** The Carrier Thread is now completely free to execute another Virtual Thread. When the original database query returns its payload, the JVM grabs the Continuation from the Heap, mounts it back onto any available Carrier Thread, and resumes execution identically.

```java
// Create 100,000 Virtual Threads effortlessly
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1)); // Instantly unmounts! Doesn't block an OS thread.
            return i;
        });
    });
} // Finishes in exactly 1 second, not pooling!
```

---

## 4. Senior Deep Dive: The Dangers of "Pinning"

Virtual threads are not magic. They have one catastrophic weakness that Senior Engineers must audit their codebase for before migrating to Java 21: **Thread Pinning**.

### What is Pinning?
When a Virtual Thread executes inside a `synchronized` block or method, the JVM physically cannot unmount it. The Virtual Thread literally **pins** the underlying OS Carrier Thread to itself. 

If that `synchronized` block makes a slow database call, the Carrier Thread is blocked. If you only have 8 CPU cores (8 Carrier Threads), and 8 Virtual Threads enter `synchronized` DB queries, your entire JVM grinds to an absolute halt. You have 0 available Carrier Threads left to execute the other 99,992 Virtual Threads in your queue.

### The Fix: ReentrantLock
`ReentrantLock` uses AQS and `LockSupport.park()`, which the JVM fully understands. A Virtual Thread blocked on a `ReentrantLock` naturally unmounts.

```java
// ❌ DANGEROUS inside Virtual Threads
public synchronized void fetchFromDatabase() {
    // Carrier thread is pinned and DEAD while the DB responds!
    var data = db.query("SELECT SLEEP(10)"); 
}

// ✅ SAFE inside Virtual Threads
private final ReentrantLock lock = new ReentrantLock();

public void fetchFromDatabase() {
    lock.lock();
    try {
        // Virtual thread unmounts! Carrier thread is free to work!
        var data = db.query("SELECT SLEEP(10)"); 
    } finally {
        lock.unlock();
    }
}
```

> **Note:** The OpenJDK team is actively working on changing the JVM's C++ monitor implementation so `synchronized` no longer pins threads, but as of Java 21, you must migrate to `ReentrantLock`.

---

## 5. Migration Best Practices

If you upgrade an older Spring Boot application to Java 21 and flip `spring.threads.virtual.enabled=true`, you must follow these rules:

| Rule | Reason |
|---|---|
| **NEVER pool Virtual Threads** | Pooling exists to save the creation cost of expensive OS threads. Virtual threads are disposable. Use `newVirtualThreadPerTaskExecutor()`. |
| **Replace `synchronized`** | Audit your I/O paths for `synchronized` and replace with `ReentrantLock`. |
| **Beware `ThreadLocal` limits** | Legacy code uses `ThreadLocal` heavily. If you spawn 1,000,000 virtual threads, you will create 1,000,000 heavy `ThreadLocal` HashMap allocations and crash the Heap. |
| **Use Semaphores for scaling** | A Virtual Thread won't break the JVM, but 10,000 concurrent DB queries will instantly crash your PostgreSQL connection pool. Use a `Semaphore(50)` to restrict extreme bursts. |

---

## 6. Interview Questions

### Q: Does a Virtual Thread make my CPU-bound loop execute faster?
**A:** No! Virtual threads provide zero value for CPU-bound tasks (like parsing massive JSON or mining crypto). The thread *cannot unmount* if it doesn't do I/O. For CPU bounds, you still use a traditional `ForkJoinPool` sized to CPU cores.

### Q: Why do Virtual Threads kill Reactive Programming (Project Reactor / WebFlux)?
**A:** Reactive programming (Mono/Flux) was invented specifically to solve the exact same problem: getting thousands of concurrent connections off of 200 OS threads. But WebFlux forces you into complex "callback hell" and breaks standard debugging stack traces. Virtual Threads let you write simple, imperative, blocking code that magically gets all the throughput benefits of WebFlux natively inside the JVM.

### Q: What is Structured Concurrency?
**A:** A Java 21+ feature that forces parent-child scopes for Virtual Threads using `StructuredTaskScope`. It prevents "Orphaned Threads" by guaranteeing that if a parent API request aborts, all its spawned downstream Virtual Threads are automatically cancelled before the parent exits.
