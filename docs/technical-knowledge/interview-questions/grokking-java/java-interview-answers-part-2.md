---
id: java-interview-answers-part-2
title: Java Interview Q&A - Multithreading & Concurrency
description: Comprehensive answers to Java Multithreading and Concurrency interview questions.
sidebar_position: 4
tags: [java, interview, multithreading, concurrency, answers]
---

# Java Interview Questions & Answers: Part 2

## Multithreading and Concurrency

### 1. What is a Thread in Java?
A thread is an independent path of execution. It allows a program to take advantage of multiple CPUs by running tasks concurrently, speeding up CPU-bound tasks.

### 2. What is the difference between a Thread and a Process?
A process is an executing instance of an application with its own memory space. A thread is a subset of a process; multiple threads within the same process share the same memory space (heap), though each has its own local stack.

### 3. How do you implement a Thread in Java?
There are two primary ways: 
1. Extend the `java.lang.Thread` class.
2. Implement the `java.lang.Runnable` interface and pass it to a `Thread` object.

### 4. When to use Runnable vs Thread in Java?
Because Java does not support multiple class inheritance, extending the `Thread` class prevents your class from extending any other class. Implementing `Runnable` is generally preferred because it leaves your class free to extend another class (e.g., extending an Applet or Canvas).

### 5. What is the difference between start() and run() method of Thread class?
Calling `start()` actually spins up a new thread and then invokes the `run()` method inside that new thread. If you call `run()` directly, it behaves like a standard method call and executes synchronously on the *current* thread.

### 6. What is the difference between Runnable and Callable in Java?
Both represent tasks to be executed in a separate thread. However, `Runnable`'s `run()` method returns `void` and cannot throw checked exceptions. `Callable` (introduced in Java 1.5) has a `call()` method that can return a result (wrapped in a `Future` object) and throw exceptions.

### 7. What is the difference between CyclicBarrier and CountDownLatch?
Both synchronize multiple threads. A `CountDownLatch` cannot be reused once its count reaches zero. A `CyclicBarrier` can be reset and reused even after the barrier is broken.

### 8. What is the Java Memory Model?
It is a set of rules and guidelines that dictate how changes made by one thread become visible to others (the "happens-before" relationship), ensuring Java programs behave deterministically across different CPU architectures.

### 9. What is a volatile variable in Java?
The `volatile` modifier ensures that changes to a variable are always visible to other threads. It prevents threads from caching the variable locally in their stack, forcing them to read/write directly from the main memory.

### 10. What is thread-safety? Is Vector a thread-safe class?
Thread-safety guarantees that a class or object behaves correctly when accessed by multiple threads simultaneously. `Vector` is thread-safe because its state-modifying methods are synchronized.

### 11. What is a race condition in Java? Give an example.
A race condition is a timing-dependent bug that occurs when multiple threads execute concurrently and the outcome depends on which thread "wins" the race to execute first. (e.g., Two threads incrementing a shared counter simultaneously might miss a count).

### 12. How to stop a thread in Java?
There is no "sure shot" built-in way, as methods like `stop()` are deprecated due to deadlock risks. The best approach is to use a `volatile boolean` flag that the thread checks regularly to terminate itself, or use `Thread.interrupt()`.

### 13. What happens when an Exception occurs in a thread?
If uncaught, the thread will die. However, if an `UncaughtExceptionHandler` is registered to the thread, the JVM will invoke its `uncaughtException()` method before the thread terminates.

### 14. How do you share data between two threads in Java?
By passing a shared object reference to both threads. This shared object must be protected using synchronization, or you should use inherently thread-safe data structures like `BlockingQueue`.

### 15. What is the difference between notify() and notifyAll() in Java?
`notify()` wakes up only one single thread waiting on the object's monitor (chosen arbitrarily). `notifyAll()` wakes up *all* threads waiting on that monitor, allowing them to compete for the lock.

### 16. Why are wait, notify, and notifyAll declared in the Object class?
Because Java provides locks at the *object* level, not the thread level. Since a thread waits for a specific object's lock, it makes sense to call `wait()` on that specific object rather than on the thread itself.

### 17. What is a ThreadLocal variable in Java?
A variable that provides a separate, independent copy of its value to every thread that accesses it. It is a great way to achieve thread-safety for expensive-to-create, non-thread-safe objects (like `SimpleDateFormat`) without using synchronization.

### 18. What is a FutureTask in Java?
It represents a cancellable asynchronous computation. It implements both `Future` and `Runnable`, allowing it to wrap a `Callable` or `Runnable`, be submitted to an `Executor`, and provide a `get()` method to retrieve the result once finished.

### 19. What is the difference between interrupted() and isInterrupted()?
`interrupted()` is a static method that checks the interrupt status of the current thread and *clears* the status flag. `isInterrupted()` is an instance method that queries the status of a specific thread but does *not* clear the flag.

### 20. Why must wait() and notify() be called from a synchronized block?
It is mandated by the Java API to prevent race conditions between the wait and notify calls. Calling them outside a synchronized context throws an `IllegalMonitorStateException`.

### 21. Why should you check the waiting condition in a loop?
To protect against "spurious wakeups." A waiting thread might wake up without being explicitly notified, or the condition might have changed between the time it was notified and the time it actually resumed execution.

### 22. Synchronized Collection vs. Concurrent Collection?
Synchronized collections (like `Hashtable`) lock the entire collection during read/write operations, hampering scalability. Concurrent collections (like `ConcurrentHashMap`) use advanced techniques like lock stripping (locking only segments of the map) to allow safe, highly scalable concurrent access.

### 23. What is the difference between Stack and Heap in Java?
Every thread has its own private Stack for local variables and method calls. The Heap is a shared memory area where all objects (regardless of which thread created them) live.

### 24. What is a thread pool? Why use it?
A thread pool is a pre-created set of worker threads. Reusing threads from a pool avoids the massive performance overhead of creating and destroying threads for every single task.

### 25. How do you avoid deadlock in Java?
Deadlocks require four conditions (Mutual Exclusion, Hold and Wait, No Pre-emption, Circular Wait). The easiest way to prevent deadlocks is to eliminate "Circular Wait" by ensuring all threads acquire multiple locks in the exact same strict order.

### 26. Difference between Livelock and Deadlock?
In a deadlock, threads are completely stuck waiting for each other. In a livelock, threads are actively changing states to accommodate each other but still fail to make progress (like two people constantly stepping in the same direction to let the other pass in a hallway).

### 27. How do you check if a Thread holds a lock?
By using the static method `Thread.holdsLock(object)`, which returns true if the current thread holds the monitor lock on the specified object.

### 28. How do you take a thread dump in Java?
On Linux, use `kill -3 <PID>`. On Windows, use `Ctrl + Break`. You can also use JDK tools like `jstack`.

### 29. Which JVM parameter controls the stack size of a thread?
`-Xss` (e.g., `-Xss1m`).

### 30. synchronized vs ReentrantLock in Java?
`synchronized` is an implicit, block-scoped lock. `ReentrantLock` (from `java.util.concurrent`) provides advanced capabilities like interruptible lock waits, fairness policies, and the ability to attempt to acquire a lock without blocking indefinitely (`tryLock()`).

### 31. How do you ensure sequence T1, T2, T3 in Java?
You can use the `join()` method. Start the threads, then have T3 call `T2.join()` and T2 call `T1.join()`. This ensures T2 won't execute until T1 finishes, and T3 won't execute until T2 finishes.

### 32. What does the yield() method do?
It is a static method that hints to the thread scheduler that the current thread is willing to temporarily pause its execution and relinquish the CPU, allowing other threads of the same priority a chance to run.

### 33. What is the concurrency level of ConcurrentHashMap?
It is an optional parameter (default is 16) that dictates how many segments the map is partitioned into. It represents the estimated number of concurrently updating threads the map can support without contention.

### 34. What is a Semaphore in Java?
A synchronizer that maintains a set of "permits." Threads must acquire a permit to proceed and release it when done. It is used to restrict access to a limited pool of resources (e.g., 10 database connections).

### 35. What happens if a task is submitted to a thread pool with a full queue?
The `submit()` or `execute()` method will throw a `RejectedExecutionException` (depending on the configured Rejection Handler).

### 36. execute() vs submit() in an ExecutorService?
`execute()` takes a `Runnable` and returns `void` (fire and forget). `submit()` takes a `Runnable` or `Callable` and returns a `Future` object, which can be used to track the task's status or get its return value.

### 37. What is a blocking method in Java?
A method that does not return control to the caller until its task is completely finished (e.g., `ServerSocket.accept()` or `InputStream.read()`).

### 38. Is Swing thread-safe?
No. All GUI components must be updated exclusively on the AWT Event Dispatcher Thread (EDT).

### 39. invokeAndWait vs invokeLater in Java?
Both are used to schedule GUI updates on the Event Dispatcher Thread from a separate worker thread. `invokeAndWait` blocks the worker thread until the GUI update is complete. `invokeLater` schedules the update asynchronously and returns immediately.

### 40. How do you create an Immutable object in Java?
Make the class `final`, make all fields `private` and `final`, do not provide setter methods, initialize all fields via a constructor, and if the class holds references to mutable objects, perform deep copies when passing them in or out.

### 41. What is a ReadWriteLock?
An interface that maintains a pair of locks: one for read operations and one for write operations. Multiple threads can hold the read lock simultaneously, but the write lock is strictly exclusive.

### 42. What is a busy spin?
A technique where a thread waits for a condition by running an empty `while` loop instead of yielding or sleeping. This avoids the cost of a context switch and preserves CPU cache, but consumes CPU cycles.

### 43. volatile vs atomic variables?
`volatile` guarantees that reads/writes are visible across threads, but it does *not* guarantee atomicity (e.g., `count++` is a read-modify-write operation and will fail). `AtomicInteger` uses low-level CPU instructions to guarantee that operations like `getAndIncrement()` are completely atomic.

### 44. What happens if a thread throws an Exception inside a synchronized block?
The thread abruptly exits the block, but the JVM ensures that the monitor lock held by that thread is automatically released so other threads can proceed.

### 45. What is double-checked locking in a Singleton?
An optimization technique where you check if the singleton instance is null without synchronization, and only if it is null, you enter a synchronized block to initialize it. It was historically broken in Java until the `volatile` keyword semantics were fixed in JDK 1.5.

### 46. What is the fork-join framework?
Introduced in JDK 7, it is designed to take advantage of multi-core processors by recursively breaking large tasks into smaller sub-tasks. It utilizes a "work-stealing" algorithm where idle threads can steal sub-tasks from the queues of busy threads.

### 47. wait() vs sleep()?
`wait()` is for inter-thread communication and *releases* the lock it holds while waiting. `sleep()` simply pauses execution for a set duration and *does not release* any locks.