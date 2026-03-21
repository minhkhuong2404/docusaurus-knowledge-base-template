---
id: java-runtime-exceptions
title: Java Runtime & Exception Propagation
sidebar_label: Runtime & Exceptions
description: "Interview notes on JVM runtime architecture and exception propagation in Java applications."
tags: [java, interview, jvm, exception-handling]
---

# Java Runtime Architecture and Exception Propagation

This section explores how Java code is executed by the JVM and how exceptions move through the call stack.

## 1. Why is Java Platform Independent?
Java follows the **WORA (Write Once, Run Anywhere)** principle. 
1.  **Compiler:** The Java compiler (`javac`) converts source code (`.java`) into **Bytecode** (`.class`).
2.  **Platform Independence:** This bytecode is not specific to any physical machine.
3.  **JVM:** Any operating system with a **Java Virtual Machine (JVM)** can execute this bytecode. The JVM translates the platform-independent bytecode into machine-specific instructions.


## 2. Java Runtime Memory Areas
The JVM manages memory in several distinct areas during execution:
* **Method Area:** Stores class-level data, including static variables and method code.
* **Heap:** The area where all objects are created.
* **Stack:** Stores local variables and partial results. Each thread has its own private stack.
* **PC Registers:** Contains the address of the current instruction being executed.
* **Native Method Stack:** Stores native method information.

## 3. Interpreter vs. JIT Compiler
* **Interpreter:** Reads and executes bytecode line-by-line. While it starts quickly, execution can be slow for repeated code.
* **JIT (Just-In-Time) Compiler:** Monitors code execution. If it finds "hot spots" (frequently executed code), it compiles that bytecode into native machine code to improve performance.

## 4. Class Loader Subsystem
The Class Loader is responsible for loading `.class` files into the memory area. It performs three main tasks:
1.  **Loading:** Finding and importing the binary data for a class.
2.  **Linking:** Verifying the bytecode, preparing static fields, and resolving symbolic references.
3.  **Initialization:** Executing static initializers and assigning values to static fields.

## 5. What is Exception Propagation?
Exception propagation occurs when an exception is not caught in the method where it occurred.
1.  **The Stack:** When an exception is thrown, the JVM looks for a `catch` block in the current method.
2.  **Propagation:** If not found, it drops the current method from the call stack and goes to the previous method (the caller).
3.  **Termination:** This continues until the exception is caught or it reaches the `main()` method. If it remains uncaught in `main()`, the JVM terminates the program and prints the stack trace.


---
*Source: [Code Decode - Tricky Core Java Interview Questions](https://www.youtube.com/watch?v=ZI6Et1bVen0)*