---
id: java-tricky-core-questions
title: Tricky Core Java Interview Questions
sidebar_label: Core Java Q&A
description: "Tricky Core Java interview scenarios across exceptions, design patterns, and Java 8 concepts."
tags: [java, interview, core-java, advanced]
---

# Tricky Core Java Interview Questions & Answers

This guide addresses advanced scenarios in Core Java, including exception handling, design patterns, and Java 8 features.

## 1. How can you break a Singleton Design Pattern?
A Singleton pattern ensures one instance per JVM, but it can be broken using:
* **Reflection:** By changing the constructor's accessibility (`setAccessible(true)`), you can create a second instance.
* **Serialization:** If you serialize and then deserialize an object, a new instance is created with a different hashcode.
* **Cloning:** If the singleton class implements `Cloneable`, calling `clone()` creates a new instance.
* **Executor Service:** (Advanced multi-threading scenarios).

## 2. `ClassNotFoundException` vs. `NoClassDefFoundError`
| Feature        | ClassNotFoundException                                                                                                                       | NoClassDefFoundError                                                                                               |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **Type**       | Exception (Checked)                                                                                                                          | Error                                                                                                              |
| **Occurrence** | Occurs when an application tries to load a class at runtime using `Class.forName()` or `loadClass()`, but the class is not in the classpath. | Occurs when the class was present at compile-time but is missing at runtime (e.g., the `.class` file was deleted). |
| **Source**     | Thrown by the application (reflection methods).                                                                                              | Thrown by the Java Runtime System.                                                                                 |

## 3. Which predefined classes can be used as Keys in a Map?
Apart from **String**, you can use **Integer** and other wrapper classes like **Byte, Character, Short, Boolean, Long, Double, and Float**. These are natural candidates because they are immutable and have well-defined `equals()` and `hashCode()` methods.

## 4. Java 8 Stream Operations on Employee List
Given a list of Employees, here is how you perform common sorting and filtering tasks:

### Sort by Salary (Descending)
```java
List<Employee> sortedList = empList.stream()
    .sorted((e1, e2) -> (int)(e2.getSalary() - e1.getSalary()))
    .collect(Collectors.toList());
```

### Fetch Top 3 Salaried Employees
```java
List<Employee> top3 = empList.stream()
    .sorted((e1, e2) -> (int)(e2.getSalary() - e1.getSalary()))
    .limit(3)
    .collect(Collectors.toList());
```

### Fetch Employees with Salary less than the 3rd Highest
```java
List<Employee> others = empList.stream()
    .sorted((e1, e2) -> (int)(e2.getSalary() - e1.getSalary()))
    .skip(3)
    .collect(Collectors.toList());
```


## 5. Why use Character Array over String for Passwords?
* **Immutability:** Strings are immutable. Once created, they stay in the **String Constant Pool** until Garbage Collection occurs.
* **Security Risk:** If a **memory dump** is taken, sensitive data like passwords stored in the String pool can be extracted and exploited.
* **Mutability (Safe Alternative):** A character array (`char[]`) is mutable. You can overwrite the data (e.g., set every index to a blank space) as soon as you are done with it, ensuring the password no longer exists in memory.

---
