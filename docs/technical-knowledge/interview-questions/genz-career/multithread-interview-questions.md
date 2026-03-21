---
id: java-multithreading-interview-guide
title: 40+ Java Multithreading & Concurrency Interview Questions
sidebar_label: Java Multithreading Interview Questions Tricky
tags:
  - Java
  - Multithreading
  - Concurrency
  - Interview Prep
  - Backend Development
description: A comprehensive, detailed list of tricky and real-world Java Multithreading interview questions for experienced developers (2–7 years).
---

# Java Multithreading & Concurrency Interview Questions

This guide provides an exhaustive list of detailed interview questions and answers focused on Java Multithreading, specifically curated for developers with 2 to 7 years of experience.

---

## 1. Fundamentals of Threads and Processes

**Q: Is a thread lighter than a process and can it exist without it?**
**A:** A process is an instance of a program being executed (e.g., opening Microsoft Word). The operating system creates a process to manage its execution. A thread is the smallest unit of execution within a process. Multiple threads share the same resources of a process but can run independently (e.g., different tabs in Google Chrome running as separate threads). Yes, a thread is lighter than a process, and it cannot exist without a process because it lives inside it. (Think of a process as a house and a thread as a room inside it).

**Q: Multiple users hit the same REST API at the same time. Are they served by one thread or multiple?**
**A:** They are served by multiple threads. When many users hit the same REST API simultaneously, the server assigns a separate thread for each request. This allows the requests to run in parallel rather than one by one.

**Q: What are the different ways to create a thread?**
**A:** 1. Extending the `Thread` class (Older Java).
2. Implementing the `Runnable` interface (Older Java).
3. Using the `ExecutorService` framework along with `Callable` (Java 5 onwards).
4. Using Lambda expressions to make the code more concise (Java 8 onwards).

**Q: Can you tell me the difference between extending `Thread` and implementing `Runnable` and when to use each?**
**A:** * **Extending Thread:** Your class becomes a thread. You put your code in the `run()` method and start it using `start()`. *Limitation:* Your class cannot extend any other class because Java only allows single inheritance. Use this for simple demos or learning purposes.
* **Implementing Runnable:** Your class represents a task, not the thread itself. You pass this task to a `Thread` object. *Advantage:* Your class can still extend another class. This is preferred in real-world applications.

**Q: Can a class extend `Thread` and implement `Runnable` together?**
**A:** Yes, it can, but it makes no real sense. The `Thread` class already implements `Runnable`. If your class extends `Thread`, it automatically becomes a `Runnable`. Implementing it again adds nothing.

**Q: Why is `Runnable` preferred in real-world applications?**
**A:** It provides better design and flexibility. When using `Runnable`, our class only defines *what* work to do, not *how* to run the thread. This keeps things clean and reusable, and allows our class to extend another class, which is very common in real projects.

**Q: What happens internally when we call the `run()` method instead of the `start()` method?**
**A:** If we call `run()` directly, no new thread is created. The `run()` method executes like a normal method call on the same thread that invoked it (usually the main thread). Java does not perform any thread scheduling. When we call `start()`, Java creates a new separate thread, which then calls the `run()` method internally.

**Q: Can one `Runnable` instance be used by multiple threads?**
**A:** Yes. We can create one object containing the `run()` method logic and pass that exact same object to multiple different `Thread` objects.

**Q: What happens if the `start()` method is called twice on the same thread?**
**A:** Java will throw an `IllegalThreadStateException`. A thread in Java can only be started once. After it has started or finished executing, it cannot be restarted.

---

## 2. Thread Lifecycle and Synchronization

**Q: Can you please explain the life cycle of a thread?**
**A:** A thread goes through several states:
1. **New:** The thread object is created but `start()` has not been called.
2. **Runnable:** `start()` is called. It is ready to run and waiting for CPU time from the scheduler.
3. **Running:** The thread is actively executing its `run()` method code.
4. **Blocked/Waiting:** Temporarily not running (waiting for a lock, `sleep()`, or `wait()`).
5. **Terminated:** The thread has finished its work or stopped due to an error.

**Q: Can a thread re-enter the Runnable state after it is Terminated?**
**A:** No. Once a thread finishes its execution or ends due to an error, it goes into the Terminated state. Its lifecycle is completely over, and Java does not allow restarting a dead thread.

**Q: If two threads are trying to update a counter variable simultaneously, what will happen and how do we solve it?**
**A:** This causes a **Race Condition**. Both threads may read the same old value, increment it, and write it back at the exact same time. One update overrides the other, making the counter value inconsistent. 
* **Solutions:** We can use the `synchronized` keyword (so only one thread updates it at a time), use `AtomicInteger` (safely updates without locks), or use `ReentrantLock`.

**Q: How can we use the `synchronized` keyword?**
**A:**
1. **Synchronized Method:** Added before the method name to lock the entire method.
2. **Synchronized Block:** Locks only a specific block of code within a method.
3. **Static Synchronized Method:** Locks the class object rather than the instance object.

**Q: Is `synchronized` applied to code or to objects?**
**A:** It is applied to **objects**, not directly to the code. When code is marked as synchronized, the thread gets a lock on an object before running the code. For an instance method, the lock is on the current object (`this`). For a static method, the lock is on the Class object.

**Q: What happens if an exception occurs inside a synchronized block?**
**A:** If an exception occurs, the thread exits the block, and Java automatically releases the lock so other waiting threads can acquire it.

**Q: Can synchronization guarantee thread ordering?**
**A:** No. It only guarantees that only one thread enters the critical section at a time. It does not control the execution order of threads; that scheduling is decided by the CPU and JVM.

**Q: What are the limitations of synchronization?**
**A:** 1. **Performance Issues:** Threads waiting for the lock are blocked, slowing down the application.
2. **No Fairness:** No guarantee on which waiting thread gets the lock next.
3. **Risk of Deadlock:** If locks are taken in the wrong order.
4. **Blocking Nature:** Threads wait indefinitely and cannot do other work.
5. **Hard to Control:** You cannot set timeouts or interrupt a thread waiting for a synchronized lock.

---

## 3. Advanced Locking and Volatile

**Q: What is `ReentrantLock` and why do we need it?**
**A:** Introduced in Java 5, it is a more powerful locking mechanism. "Reentrant" means the same thread can acquire the same lock multiple times without deadlocking itself. We need it because it offers more control than `synchronized`: it allows checking if a lock is available (`tryLock()`), setting timeouts, ensuring fairness, and locking/unlocking across different methods.

**Q: How does the `tryLock()` method prevent deadlocks?**
**A:** Deadlocks usually occur when threads hold different locks and wait forever for each other. `tryLock()` helps by not forcing a thread to wait forever. It tries to get the lock, and if it's unavailable, it fails immediately (or after a timeout). The thread can then release its current locks, retry later, or do other work, avoiding circular waiting.

**Q: What happens if you forget to unlock a `ReentrantLock`?**
**A:** The lock is never released. Other threads waiting for the lock will wait forever, causing the program to appear frozen or stuck, leading to starvation or deadlock.

**Q: When should you prefer `ReentrantLock` over `synchronized`?**
**A:** * **Use ReentrantLock:** When you need more control (like timeouts with `tryLock()`), fairness policies, or locking/unlocking across different scopes.
* **Use Synchronized:** When the logic is simple, you want automatic lock release (even on exceptions), and readability is prioritized over flexibility.

**Q: What is the `volatile` keyword?**
**A:** It ensures **visibility**. Normally, threads keep their own local copy of variables in CPU caches. `volatile` forces threads to read the value directly from the main memory. If one thread changes the variable, all other threads immediately see the updated value.

**Q: Why doesn't `volatile` guarantee atomicity?**
**A:** Atomicity means an operation happens in one single, unbreakable step. Operations like `count++` actually involve three steps: read the value, increment it, and write it back. `volatile` only ensures visibility of the read/write, but it does not lock the operation. Two threads can still read the value simultaneously, increment it, and write it back incorrectly.

**Q: Can `volatile` fix race conditions?**
**A:** No. `volatile` fixes visibility issues, but race conditions require atomicity (ensuring only one thread updates data at a time).

**Q: What are Atomic classes and how do they work internally?**
**A:** Classes like `AtomicInteger` and `AtomicLong` allow multiple threads to update shared values safely without locking. Internally, they use a technique called **CAS (Compare-And-Swap)**. It reads the current value, checks if it is still what it expects, and if so, updates it. If another thread changed the value in the meantime, the update fails, and the thread simply retries.

**Q: Why are Atomics faster than `synchronized`?**
**A:** Because they avoid thread blocking. With `synchronized`, threads are put to sleep and woken up, requiring heavy context switching. With Atomics, threads do not block; they use CAS to retry operations instantly.

---

## 4. Executor Framework and Thread Pools

**Q: What is the Executor framework and why do we need it?**
**A:** It is a Java feature that manages threads for us. Instead of manually creating, starting, and tracking threads, we submit tasks to the framework, and it decides which thread runs them. It is needed because creating threads manually is slow and resource-heavy. Executors reuse threads, improve performance, and make code cleaner.

**Q: Explain the concept of a Thread Pool.**
**A:** A thread pool is a group of pre-created, ready-to-use threads. When a task arrives, an idle thread from the pool takes it. When finished, the thread isn't destroyed; it goes back into the pool to wait for the next task. (Like a restaurant: you hire a fixed set of chefs. You don't hire a new chef for every single order; the existing chefs just take the next order when they finish the current one).

**Q: Who manages the thread lifecycle in Executors?**
**A:** The Executor framework manages the entire lifecycle. It creates threads, assigns tasks, reuses them, and shuts them down when no longer needed.

**Q: What happens if the Executor queue is full?**
**A:** If all threads in the pool are busy and the task queue reaches its capacity, the executor rejects new tasks. It usually throws a `RejectedExecutionException` or follows a predefined rejection policy (like discarding the task or running it on the main thread).

**Q: What is the difference between `execute()` and `submit()`?**
**A:** * **`execute()`:** Takes a `Runnable`, returns nothing ("fire and forget"). If an exception occurs, it is thrown directly on the worker thread and usually ends up in the logs.
* **`submit()`:** Takes a `Runnable` or `Callable`, and returns a `Future` object. This allows you to track completion, get results, or cancel the task. Exceptions are stored and thrown safely when you call `future.get()`.

**Q: Difference between `Runnable` and `Callable`?**
**A:** * **Runnable:** Does not return a result. Cannot throw checked exceptions. Used for tasks that just perform work.
* **Callable:** Returns a result. Can throw checked exceptions. Used when an outcome is needed from the thread.

**Q: Explain the types of Thread Executors.**
**A:**
1. **FixedThreadPool:** A pool with a fixed, maximum number of threads. Extra tasks wait in a queue.
2. **SingleThreadExecutor:** Exactly one thread. Tasks run sequentially one by one.
3. **CachedThreadPool:** Dynamic pool. Creates new threads as needed and destroys threads that remain idle for 60 seconds. Best for many short-lived tasks.
4. **ScheduledThreadPool:** Used to run tasks after a specific delay or repeatedly at fixed intervals.
5. **ForkJoinPool:** Used for heavy parallel processing. Big tasks are divided into smaller chunks, and idle threads can "steal" work from busy threads.

---

## 5. CompletableFuture

**Q: What is `CompletableFuture` and how does it work?**
**A:** It is a feature used to run tasks asynchronously and chain multiple steps together without blocking the main thread. You start a task, the main thread continues its work, and you declare a pipeline: "when task A finishes, use its result to do task B."

**Q: How do you handle exceptions in `CompletableFuture`?**
**A:** It has built-in methods for error handling:
* `exceptionally()`: Provides a fallback value if something fails.
* `handle()`: Executes regardless of success or failure, allowing you to handle both outcomes in one place.
* `whenComplete()`: Used to log or observe the result/error without changing it.

**Q: Can `CompletableFuture` cause thread starvation?**
**A:** Yes. By default, it uses the `ForkJoinPool.commonPool()`. If you submit too many long-running or blocking tasks, all threads in the common pool get stuck waiting. New tasks are queued forever, causing starvation. *Solution:* Pass a custom Executor to the `CompletableFuture` for blocking operations.

**Q: Why is `CompletableFuture` better than `Future`?**
**A:** Standard `Future` is limited: you must call the blocking `get()` method to retrieve results, it cannot easily chain tasks, and it has poor exception handling. `CompletableFuture` allows non-blocking task chaining, combining multiple async tasks, and provides powerful exception handling.

**Q: What are common methods in `CompletableFuture`?**
**A:** * Creation: `supplyAsync()`, `runAsync()`.
* Chaining: `thenApply()` (transform result), `thenAccept()` (consume result), `thenRun()` (run next task without result).
* Combining: `thenCombine()`, `allOf()`, `anyOf()`.

**Q: What is a `ForkJoinPool` and give a real example?**
**A:** It is a special thread pool designed for "divide and conquer" tasks. A massive task is split into smaller sub-tasks (Fork). Once computed, results are merged (Join). It heavily utilizes "work-stealing" where idle threads pull tasks from busy threads' queues. 
* *Real Examples:* Parallel array sorting, searching a massive matrix, or processing data chunks in parallel streams.
