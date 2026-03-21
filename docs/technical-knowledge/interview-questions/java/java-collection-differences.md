---
id: java-collections-differences
title: Array vs. ArrayList vs. Vector vs. LinkedList
sidebar_label: Collections Differences
description: "Comparison guide for Array, ArrayList, Vector, and LinkedList with interview-focused trade-offs."
tags: [java, interview, collections, data-structures]
---

# Java Collections Framework: Key Differences

This guide provides a detailed comparison of common data structures in Java, helping you choose the right one for your application needs.

## 1. Array vs. ArrayList
| Feature          | Array                               | ArrayList                                       |
| :--------------- | :---------------------------------- | :---------------------------------------------- |
| **Size**         | Static (fixed length).              | Dynamic (resizable).                            |
| **Data Types**   | Stores both primitives and objects. | Stores only objects (primitives are autoboxed). |
| **Performance**  | Faster due to fixed size.           | Slower during resizing operations.              |
| **Length Check** | Uses `.length` variable.            | Uses `.size()` method.                          |
| **Dimensions**   | Can be multi-dimensional.           | Always single-dimensional.                      |


## 2. ArrayList vs. Vector
| Feature             | ArrayList                           | Vector                             |
| :------------------ | :---------------------------------- | :--------------------------------- |
| **Synchronization** | Not Synchronized (Not Thread-Safe). | Synchronized (Thread-Safe).        |
| **Performance**     | Fast (multiple threads can access). | Slow (only one thread at a time).  |
| **Growth**          | Increases by 50% of current size.   | Increases by 100% (doubles size).  |
| **Legacy**          | Introduced in Java 1.2.             | Legacy class (Java 1.0).           |
| **Iteration**       | Uses `Iterator`.                    | Uses `Iterator` and `Enumeration`. |

## 3. ArrayList vs. LinkedList
| Feature                | ArrayList                               | LinkedList                                  |
| :--------------------- | :-------------------------------------- | :------------------------------------------ |
| **Internal Structure** | Dynamic Array.                          | Doubly Linked List.                         |
| **Manipulation**       | Slow (requires bit shifting in memory). | Fast (only pointer changes).                |
| **Access/Search**      | Fast (supports Random Access).          | Slow (sequential traversal required).       |
| **Interfaces**         | Implements `List`.                      | Implements `List` and `Deque` (Queue).      |
| **Memory Overhead**    | Less (stores only data).                | More (stores data + pointers to next/prev). |
| **Default Capacity**   | 10.                                     | No default capacity (starts empty).         |


## Decision Matrix: When to use what?
* **Frequent Search/Access:** Use `ArrayList` because it supports index-based random access.
* **Frequent Insertion/Deletion:** Use `LinkedList` because it avoids memory shifting.
* **Multi-threaded Environment:** Use `Vector` (or a synchronized `ArrayList`) if you need built-in thread safety.
* **Fixed Size Data:** Use a standard `Array` for maximum performance if the data size is known and constant.

---
