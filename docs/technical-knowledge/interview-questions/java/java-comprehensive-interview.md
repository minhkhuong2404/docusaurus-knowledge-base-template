---
id: java-comprehensive-interview
title: Comprehensive Java Interview Questions
sidebar_label: Java & Spring Mixed
description: "Comprehensive Java and Spring interview set spanning core Java, collections, Hibernate, and Spring."
tags: [java, interview, spring, hibernate]
---

# Java & Spring Interview Questions [Most Asked]

This compilation covers critical interview topics across Core Java, Collections, Hibernate, and the Spring Framework as discussed in the Code Decode tutorial.

## 1. ArrayList vs. LinkedList
| Feature                     | ArrayList                         | LinkedList                  |
| :-------------------------- | :-------------------------------- | :-------------------------- |
| **Internal Data Structure** | Resizable Array                   | Doubly Linked List          |
| **Manipulation**            | Slow (requires shifting elements) | Fast (only pointer changes) |
| **Search/Access**           | Fast (Random Access)              | Slow (Sequential traversal) |
| **Best Use Case**           | Storing and accessing data        | Frequent insertion/deletion |

## 2. Lazy Loading in Hibernate
Lazy loading is a design pattern used to postpone the initialization of an object until it is actually needed. 
* **Purpose:** It improves performance by avoiding the retrieval of large amounts of data from the database if that data isn't being used.
* **Example:** If you fetch an `Employee` object, Hibernate won't fetch their `Address` until you explicitly call `employee.getAddress()`. 
## 3. Hibernate Caching: First Level vs. Second Level
* **First Level Cache:** Enabled by default. It is associated with the **Session** object. Data is available only within the scope of a single session.
* **Second Level Cache:** Must be enabled explicitly (e.g., using EHCache). It is associated with the **SessionFactory**. Data is available across all sessions in the application.

## 4. JVM Garbage Collection Generations
JVM memory is divided into different generations to optimize Garbage Collection (GC):
* **Young Generation:** Where new objects are created. Most objects die here quickly. It is further divided into Eden space, Survivor S0, and Survivor S1.
* **Old (Tenured) Generation:** Objects that survive several GC cycles in the Young Generation are moved here.
* **Permanent Generation (Metaspace in Java 8+):** Stores metadata about classes and methods. 
## 5. What is Serialization?
Serialization is the process of converting an object's state into a **byte stream**, so it can be saved to a file or sent over a network. The reverse process is called **Deserialization**. To make a class serializable, it must implement the `java.io.Serializable` marker interface.

## 6. Spring IoC and Dependency Injection (DI)
* **Inversion of Control (IoC):** A principle where the control of object creation and lifecycle is transferred from the developer to the Spring Container.
* **Dependency Injection (DI):** The pattern used to implement IoC. Instead of an object creating its dependencies, the container "injects" them (via Constructor, Setter, or Field injection).

## 7. What is WeakHashMap?
A `WeakHashMap` is a specialized Map where keys are stored as **Weak References**. If a key is no longer in use elsewhere in the program, the Garbage Collector can discard it, even if it is still a key in the `WeakHashMap`. This is useful for preventing memory leaks in cache implementations.

## 8. Functional Interfaces (Java 8)
A **Functional Interface** is an interface that contains exactly **one abstract method**.
* It can contain any number of `default` or `static` methods.
* It is marked with the `@FunctionalInterface` annotation.
* These interfaces are used as the assignment target for **Lambda Expressions**. 
## 9. ConcurrentHashMap vs. SynchronizedMap
* **SynchronizedMap:** Locks the entire map for both read and write operations.
* **ConcurrentHashMap:** Uses **Lock Stripping**. It allows multiple threads to read concurrently and locks only specific segments (buckets) for write operations, making it much faster in multi-threaded environments.

---
*Source: [Code Decode - Java Interview Questions for Fresher & Experienced](https://www.youtube.com/watch?v=wpFtPQLG9Vs)*