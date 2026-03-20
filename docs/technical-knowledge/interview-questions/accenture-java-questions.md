---
id: accenture-java-interview
title: Accenture Java Interview Questions
sidebar_label: Accenture Real Q&A
description: "Real interview questions and practical Java answers from an Accenture first-round discussion."
tags: [java, interview, backend, concurrency]
---

# Accenture Java Interview Questions & Answers (Oct-2022)

This guide documents the technical questions asked during a successful first-round interview at Accenture.

## 1. ConcurrentHashMap Internals
`ConcurrentHashMap` was introduced in Java 1.5 to provide a more performant thread-safe alternative to `Hashtable`.
* **Segment Locking:** Instead of locking the entire map, it uses segment locking (lock stripping). Only the specific bucket being updated is locked, allowing other threads to read or write to different segments simultaneously.
* **Concurrency Level:** Defines the number of concurrent threads that can update the map (default is 16).
* **Load Factor:** The threshold for resizing (default is 0.75).
* **Two-Step Hash:** First, it calculates the **Segment Index**, then the **Bucket Index** within that segment.

## 2. Java Reflection API
Reflection allows you to analyze or modify the behavior of classes, interfaces, fields, and methods at **runtime**.
* **Utility:** You can access private members of a class and examine its blueprint without having the source code at compile time.
* **Advantages:** Powerful manipulation, useful for debugging and testing, and enables dynamic code execution.
* **Disadvantages:** Not thread-safe, significant performance overhead, and breaks OOP principles like abstraction and encapsulation.

## 3. Serializable vs. Externalizable
| Feature         | Serializable                  | Externalizable                         |
| :-------------- | :---------------------------- | :------------------------------------- |
| **Type**        | Marker Interface (No methods) | Standard Interface (2 methods)         |
| **Control**     | JVM handles everything        | Developer handles everything           |
| **Methods**     | None                          | `writeExternal()` and `readExternal()` |
| **Performance** | Slower (JVM overhead)         | Faster (Customized/Optimized)          |
| **Transient**   | Essential to skip fields      | Ignored (Logic is in methods)          |

## 4. Object Lock vs. Class Lock
* **Object Lock:** Every instance of a class has its own lock. Used to synchronize non-static methods or blocks.
* **Class Lock:** Every class has exactly one lock, regardless of how many instances exist. Used to synchronize static methods or blocks.

## 5. Method Overloading vs. Overriding Restrictions
### Overloading (Static Polymorphism)
* Must be in the same class.
* Method name must be same; parameters must differ (count, type, or order).
* **Return type** is not part of the signature and does not affect overloading.

### Overriding (Dynamic Polymorphism)
* Must be in a parent-child relationship (two different classes).
* **Visibility:** You cannot decrease the visibility of the overridden method (e.g., Public cannot become Private).
* **Private, Static, and Final:** Methods marked with these keywords cannot be overridden.
* **Exceptions:** The child method can only throw the same or a narrower checked exception than the parent.

## 6. What is a Transient Variable?
The `transient` keyword is used in serialization. A variable marked as transient will **not be saved** during the serialization process. When the object is deserialized, the variable will be initialized with its default value (e.g., `null` for objects, `0` for `int`). It is commonly used for sensitive data like passwords.

## 7. Programming Challenge: Filter Even Numbers > 5
**Task:** Given a list of integers, return a list of all even numbers greater than 5 using Java 8 Streams.

```java
List<Integer> numbers = Arrays.asList(1, 2, 6, 8, 10, 11, 12);

List<Integer> result = numbers.stream()
    .filter(n -> n % 2 == 0 && n > 5)
    .collect(Collectors.toList());

// Output: [6, 8, 10, 12]