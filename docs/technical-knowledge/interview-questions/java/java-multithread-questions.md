---
id: java-multithreading-interview
title: Java Multithreading Interview Questions
sidebar_label: Multithreading
description: "Java multithreading interview questions covering threading models, lifecycle, and synchronization basics."
tags: [java, interview, multithreading, concurrency]
---

# Java Multithreading Interview Questions & Answers

These questions cover the basics of multitasking, multithreading, and thread management in Java as discussed in the Code Decode tutorial.

## 1. What is the difference between Multitasking and Multithreading?
* **Process-based Multitasking:** Executing several tasks simultaneously where each task is a separate independent process (e.g., running Chrome and an IDE at the same time).
* **Thread-based Multitasking (Multithreading):** Executing several tasks simultaneously where each task is a separate independent part of the same program. A thread is a "sub-process" within a process.

## 2. Why is Multithreading better than Process-based Multitasking?
Multithreading is more efficient because:
* **Lightweight:** Threads share the same address space of the parent process, whereas processes are heavyweight and have separate address spaces.
* **Lower Overhead:** Context switching between threads is much cheaper and faster than context switching between processes.
* **Inexpensive Communication:** Inter-thread communication is easier and less costly than inter-process communication.

## 3. What is the "Main Thread" in Java?
Every Java program has at least one thread called the **main thread**. It is created by the JVM when the program starts. The main thread is responsible for locating and executing the `public static void main(String[] args)` method.

## 4. User Threads vs. Daemon Threads
* **User Threads:** High-priority threads created by developers or the JVM (like the main thread). The JVM will wait for all user threads to finish before shutting down.
* **Daemon Threads:** Low-priority background threads (e.g., Garbage Collector). They provide services to user threads. The JVM does **not** wait for daemon threads to finish; it will exit as soon as all user threads have completed.


## 5. How do you create a Thread in Java?
There are two primary ways to create a thread:

### Option 1: Extending the `Thread` class
You create a class that extends `Thread` and override the `run()` method.
```java
class MyThread extends Thread {
    public void run() {
        System.out.println("Child thread running");
    }
}
// To start:
MyThread t = new MyThread();
t.start(); 

```

### Option 2: Implementing the `Runnable` interface

You create a class that implements `Runnable` and pass its instance to a `Thread` object.

```java
class MyRunnable implements Runnable {
    public void run() {
        System.out.println("Child thread running via Runnable");
    }
}
// To start:
MyRunnable r = new MyRunnable();
Thread t = new Thread(r);
t.start();

```

## 6. Which is better: Extending `Thread` or Implementing `Runnable`?

**Implementing `Runnable` is generally preferred** because:

1. **Multiple Inheritance:** Java does not support multiple inheritance. If you extend `Thread`, you cannot extend any other class. By implementing `Runnable`, your class can still extend another class.
2. **Object-Oriented Design:** It separates the task (the `Runnable` implementation) from the runner (the `Thread` class).

## 7. What is Context Switching?

Context switching is the process of the CPU moving from one thread to another. During this process, the state of the current thread is saved so it can be resumed later, and the state of the next thread is loaded.

---

# Java Multithreading Interview Questions - Part 2

This section covers Daemon threads and the internal mechanics of starting threads in Java, as discussed in the Code Decode tutorial.

## 1. What is a Daemon Thread and how to create one?
A **Daemon thread** is a background thread that does not prevent the JVM from exiting when the program finishes. 
* **To Create:** Call `setDaemon(true)` on a thread object **before** calling `start()`.
* **To Check:** Use the `isDaemon()` method to verify if a thread is a daemon.
* **Important:** If you try to call `setDaemon(true)` after the thread has already started, it will throw an `IllegalThreadStateException`.

## 2. Difference between `start()` and `run()` methods
This is a very common interview question.
* **`start()`**: Creates a new thread and then executes the `run()` method in that new thread's context. It handles the overhead of thread creation and registration with the thread scheduler.
* **`run()`**: Calling `run()` directly does **not** create a new thread. The code inside `run()` executes in the context of the **current thread** (usually the main thread), behaving like a normal method call.

## 3. What happens if we override the `start()` method?
If you override the `start()` method in your thread class, the standard thread creation process will **not** happen. 
* Your custom `start()` method will run like a regular method in the calling thread.
* A new thread will not be initiated unless you call `super.start()` within your overridden method.
* **Recommendation:** Never override `start()`; always override `run()` to define the thread's task.

## 4. Can we overload the `run()` method?
**Yes**, you can overload the `run()` method (e.g., `run(int i)`). However, the `Thread` class's `start()` method will only ever call the no-argument `run()` method. The overloaded versions will be treated as normal methods and must be called explicitly.

## 5. Can we restart a thread that has already finished?
**No.** Once a thread has completed its execution (reached the "Dead" state), it cannot be restarted. Calling `start()` on the same thread object a second time will throw an `IllegalThreadStateException`.


## 6. How to name a thread?
Java provides default names like `Thread-0`, `Thread-1`, etc. You can change these for better debugging:
* **Via Constructor:** `Thread t = new Thread(runnable, "MyCustomName");`
* **Via Setter:** `t.setName("MyCustomName");`
* **To Get Name:** `t.getName();`

---

