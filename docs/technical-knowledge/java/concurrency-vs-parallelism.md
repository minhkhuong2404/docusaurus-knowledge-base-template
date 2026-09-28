---
id: concurrency-vs-parallelism
title: "Concurrency vs. Parallelism — The Complete Beginner's Guide"
slug: concurrency-vs-parallelism
description: "A beginner-friendly guide explaining the difference between concurrency and parallelism, using real-world analogies, visual diagrams, and Java code examples."
tags: [java, concurrency, parallelism, multithreading, basics]
---

import ConcurrencyVsParallelismAnalogDiagram from '@site/src/components/ConcurrencyVsParallelismAnalogDiagram';
import ExecutionSchedulerDiagram from '@site/src/components/ExecutionSchedulerDiagram';

# Concurrency vs. Parallelism

For anyone starting with multithreading or system design, **Concurrency** and **Parallelism** are two of the most commonly confused terms. They are often used as synonyms, but in computer science, they represent two completely different execution strategies.

Here is the quickest way to remember the difference:
*   **Concurrency is about structure:** It is the ability to handle multiple tasks by *interleaving* their execution. (Dealing with many things at once).
*   **Parallelism is about execution:** It is the ability to run multiple tasks *simultaneously* at the exact same instant. (Doing many things at once).

---

## ☕ The Coffee Shop Analogy (Understanding the Core)

Let’s step out of the computer world and look at a coffee shop to understand how these models work in practice.

### Scenario A: Concurrency (Single Cashier, Interleaved Progress)
Imagine a coffee shop with **one cashier** and **one queue** of customers.
1. Customer 1 orders a latte. The cashier takes the order and tells the barista to make it.
2. While the latte is being brewed (I/O wait), the cashier doesn't stand idle. They take the order of Customer 2.
3. Once the latte is ready, the cashier hands it to Customer 1.
*   **Analysis:** There is only **one worker** (one CPU core) handling the orders. Both orders are "in progress" at the same time, but they are processed by switching back and forth. This is **Concurrency**.

### Scenario B: Parallelism (Multiple Cashiers, Simultaneous Progress)
Imagine the coffee shop gets busy and opens a **second counter** with a **second cashier**.
1. Cashier 1 takes the order of Customer 1.
2. Cashier 2 *simultaneously* takes the order of Customer 2.
*   **Analysis:** There are **two workers** (two CPU cores) performing work at the exact same instant. This is **Parallelism**.

<ConcurrencyVsParallelismAnalogDiagram />

---

## 💻 How Schedulers and Hardware Execute Tasks

To understand how a computer does this, we have to look at the CPU and the OS Thread Scheduler.

### 1. Concurrency (Interleaved on a Single CPU Core)
If your computer has only a **single-core CPU**, it can *never* run code in parallel. Instead, it achieves concurrency using a technique called **time-slicing** (or context-switching).
*   The CPU runs Task A for 2 milliseconds, pauses it, saves its state, loads Task B, runs it for 2 milliseconds, pauses it, and switches back to Task A.
*   Because this context-switching happens in microseconds, it feels like both tasks are running at the same time.

<ExecutionSchedulerDiagram />

### 2. Parallelism (Simultaneous on Multiple CPU Cores)
If your computer has a **multi-core CPU** (e.g., an 8-core Intel or Apple Silicon M-series chip), it can achieve true physical parallelism.
*   Core 0 runs Task A continuously.
*   Core 1 runs Task B continuously.
*   No context-switching is required to switch between them because they have dedicated physical execution units.



---

## ⚖️ Detailed Comparison Table

| Feature | Concurrency | Parallelism |
| :--- | :--- | :--- |
| **Primary Goal** | **Responsiveness & Structure:** Keeping the system responsive by not blocking execution. | **Throughput & Speed:** Completing heavy tasks faster by dividing the workload. |
| **Hardware Needed** | Can run on a **single-core** or multi-core CPU. | Requires **multi-core** or multi-processor hardware. |
| **How it Works** | Alternates execution between tasks (time-slicing). | Executes tasks physically at the same instant. |
| **Workload Type** | Best for **I/O-bound** tasks (network requests, DB queries, file reads). | Best for **CPU-bound** tasks (video encoding, data analysis, math calculations). |
| **Java APIs** | `CompletableFuture`, Netty EventLoops, Virtual Threads, `@Async`. | `ForkJoinPool`, Parallel Streams (`list.parallelStream()`). |
| **Main Bottleneck** | **Context switching overhead** (wasting CPU saving/restoring thread registers) and locks. | **Hardware core limits**, memory bandwidth, and serial bottlenecks (Amdahl's Law). |

---

## ☕ Concurrency and Parallelism in Java

Let's see how these two models look in actual Java code.

### 1. The Concurrency Approach (I/O-Bound Work)
When writing a web server, threads spend 99% of their time waiting for database queries or HTTP calls. We want **concurrency** so our server doesn't freeze while waiting.

In this example, we fetch a user's details and their order history concurrently using `CompletableFuture`. The thread pool handles the scheduling, switching between tasks when they block:

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ConcurrentService {
    // A thread pool with 10 threads to handle concurrent I/O operations
    private final ExecutorService ioExecutor = Executors.newFixedThreadPool(10);

    public void renderDashboard(String userId) {
        System.out.println("Starting concurrent fetch on thread: " + Thread.currentThread().getName());

        // Fetch user info and orders concurrently (both make progress in parallel or interleaved)
        CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> {
            return fetchUserData(userId); // Simulates 100ms I/O wait
        }, ioExecutor);

        CompletableFuture<String> ordersFuture = CompletableFuture.supplyAsync(() -> {
            return fetchOrderHistory(userId); // Simulates 150ms I/O wait
        }, ioExecutor);

        // Combine the results when both tasks complete
        userFuture.thenCombine(ordersFuture, (userInfo, orderHistory) -> {
            return "Dashboard for: " + userInfo + " | Orders: " + orderHistory;
        }).thenAccept(dashboard -> {
            System.out.println("Result: " + dashboard);
            System.out.println("Completed on thread: " + Thread.currentThread().getName());
        }).join(); // Wait for completion
        
        ioExecutor.shutdown();
    }

    private String fetchUserData(String userId) {
        sleepSilently(100); // Simulate DB query wait
        return "User_John_Doe";
    }

    private String fetchOrderHistory(String userId) {
        sleepSilently(150); // Simulate DB query wait
        return "[Order #101, Order #105]";
    }

    private void sleepSilently(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
```

### 2. The Parallelism Approach (CPU-Bound Work)
If you have a massive dataset and want to perform heavy calculations (like checking if 10 million numbers are prime), you want **parallelism** to utilize every CPU core.

Java's Parallel Streams automatically split the task using a **ForkJoinPool** and execute it simultaneously on multiple cores:

```java
import java.util.List;
import java.util.stream.LongStream;

public class ParallelCalculator {
    public void findPrimesInParallel() {
        // Create a list of 1 million numbers
        List<Long> numbers = LongStream.rangeClosed(2, 1_000_000).boxed().toList();

        long startTime = System.currentTimeMillis();

        // Use parallelStream() to split the list and process on multiple cores
        List<Long> primes = numbers.parallelStream()
            .filter(ParallelCalculator::isPrime) // Run physically in parallel
            .toList();

        long endTime = System.currentTimeMillis();
        System.out.println("Found " + primes.size() + " primes in " + (endTime - startTime) + "ms");
    }

    private static boolean isPrime(long n) {
        if (n <= 1) return false;
        for (long i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }
}
```

---

## ❓ Critical Concepts & Common Questions

### 1. Can we have Concurrency without Parallelism?
**Yes.** As shown in the single-core scenario, a single processor core can execute multiple tasks concurrently by context-switching between them rapidly. The tasks are progressing concurrently, but never executing in parallel.

### 2. Can we have Parallelism without Concurrency?
**Yes, in theory.** If you write a simple, single-purpose application that does one massive math calculation, splits it into four parts, and runs those four parts simultaneously on four cores *without* any other user tasks or networking running, you have pure parallelism. However, in modern operating systems, background processes are always running, meaning the OS is still executing concurrently under the hood.

### 3. Does Parallelism always make code faster?
**No.** Parallelism comes with overhead:
1. **Splitting overhead:** The time it takes to partition the task into smaller sub-tasks.
2. **Merging overhead:** The time it takes to combine the results from different cores.
3. **Context switching:** If you create more threads than you have physical cores, the OS starts context-switching, which wastes CPU cycles.
*   **Rule of thumb:** If the task is small (e.g., summing 1,000 numbers), a normal sequential loop is faster than a parallel stream. Only use parallelism for heavy CPU operations.

---

## Interview Questions

### Q1: What is the core difference between concurrency and parallelism?
**A:** **Concurrency** is about structural design — organizing your code to handle multiple tasks in overlapping periods (interleaved execution). **Parallelism** is about physical execution — running multiple tasks simultaneously on different CPU cores. Concurrency is "dealing with" many things at once; parallelism is "doing" many things at once.

### Q2: Why is a web server handling requests considered a concurrent system rather than a purely parallel one?
**A:** Because web servers handle thousands of concurrent requests by multiplexing them across thread pools. Even if a server has 8 cores (allowing 8 requests to run in parallel at any exact instant), it may have 200 threads handling 200 requests. The scheduler alternates between these threads when they perform I/O (like querying a database or fetching a file), allowing all requests to make progress.

### Q3: When should you avoid using `list.parallelStream()` in Java?
**A:** You should avoid parallel streams in three main scenarios:
1. **Small datasets:** The overhead of splitting the work and merging the results exceeds the execution benefit.
2. **I/O-bound operations:** Parallel streams use the JVM's shared `ForkJoinPool.commonPool()`. If you block these threads with database queries or API calls, you block the shared pool, starving other parts of the application. Use a dedicated `ExecutorService` instead.
3. **Stateful or ordered operations:** Operations that rely on order (like `limit()` or `findFirst()`) or write to shared mutable state require coordination, which defeats the speed benefit of parallel execution.

### Q4: How do virtual threads in Java 21 relate to concurrency and parallelism?
**A:** Virtual threads are a **concurrency** feature, not a parallelism feature. They allow you to write simple blocking code and spawn millions of virtual threads, which are extremely cheap. When a virtual thread blocks on I/O, the JVM unmounts it from the physical carrier thread, allowing another virtual thread to run. While the virtual threads manage concurrency at the application level, the JVM still runs the underlying carrier threads in **parallel** across physical CPU cores using a `ForkJoinPool`.

---

:::tip Master Architecture Guide
For the complete 4-dimensional breakdown covering **Sync vs Async**, **Blocking vs Non-blocking (the 2×2 Matrix)**, and **Async vs Multi-threading Models (Single-threaded Event Loop vs Thread Pools)** with an interactive visualizer, see: [Concurrency, Asynchrony, Blocking & Threading Models](../system-design/concurrency-async-threading-models.md).
:::
