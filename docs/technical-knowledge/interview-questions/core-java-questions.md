---
id: java-interview-questions
title: Core Java Interview Questions
sidebar_label: Java Interview
description: "Frequently asked Core Java interview questions covering language fundamentals and JVM behavior."
tags: [java, interview, core-java, backend]
---

# Top Core Java Interview Questions & Answers

These questions cover fundamental Java concepts as discussed in the Code Decode tutorial.

## 1. Why is Java not a purely Object-Oriented language?
Java is not considered 100% object-oriented because it supports **primitive data types** like `int`, `char`, `float`, `double`, etc. In a purely object-oriented language, everything should be an object.

## 2. What makes Java platform independent?
Java's independence comes from its **byte code**. When you compile a Java program, the compiler converts the source code into byte code rather than machine-specific code. This byte code can run on any operating system (Windows, Linux, Mac) provided the system has a **Java Virtual Machine (JVM)** to interpret it.

## 3. Why is Java both interpreted and compiled?
Java uses a two-step execution process:
1.  **Compiler:** The `javac` compiler converts source code (`.java`) into byte code (`.class`).
2.  **Interpreter/JIT:** The JVM interprets the byte code. To improve performance, it uses a **Just-In-Time (JIT) compiler** to compile frequently executed byte code into native machine code.

## 4. Why are Strings immutable in Java?
Strings are immutable (cannot be changed once created) for several key reasons:
* **String Pool:** It allows multiple references to point to the same string literal, which saves significant memory.
* **Security:** Since Strings are used for parameters like file paths, network connections, and database URLs, immutability ensures these values cannot be altered maliciously.
* **Caching:** The hashcode of a String is cached at the time of creation, making it very efficient for use as a key in a `HashMap`.

## 5. What is a Marker Interface?
A Marker Interface is an interface that **does not contain any methods or fields**. Examples include `Serializable`, `Cloneable`, and `Remote`. They serve as a "tag" to inform the JVM or a compiler that the implementing class has a specific behavior or capability.

## 6. Can we override a static method?
**No.** If you define a static method with the same signature in a subclass, it is known as **method hiding**, not method overriding. Static methods are bound to the class at compile-time (static binding), whereas overriding relies on the object type at runtime (dynamic binding).

## 7. What is the difference between `final`, `finally`, and `finalize`?
* **final:** A keyword used to define constants (variables), prevent method overriding, or prevent class inheritance.
* **finally:** A block used in exception handling (`try-catch-finally`) that is guaranteed to execute whether an exception is thrown or not, typically used for closing resources.
* **finalize():** A protected method in the `Object` class that the Garbage Collector calls just before an object is destroyed to perform cleanup operations.

## 8. How do you create an Immutable Class?
To create a custom immutable class, you should:
1.  Declare the class as `final` so it cannot be extended.
2.  Make all fields `private` and `final`.
3.  Do not provide any "setter" methods.
4.  Initialize all fields through a constructor.
5.  If the class contains mutable objects, perform **deep copies** in the constructor and getter methods to prevent external modification.

## 9. What is a Singleton Class and how is it created?
A Singleton class ensures that **only one instance** of the class is created within a single JVM.
* **Private Constructor:** Ensures the class cannot be instantiated from outside.
* **Private Static Variable:** Holds the single instance of the class.
* **Public Static Method:** (often named `getInstance()`) Provides the global access point to the instance, often implementing lazy initialization.
