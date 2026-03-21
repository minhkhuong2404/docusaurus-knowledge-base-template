---
id: java-string-basics
title: Java String Interview Questions
sidebar_label: String Basics
description: "Java String basics for interviews, including immutability, pooling, and object creation patterns."
tags: [java, interview, strings, core-java]
---

# Java String Interview Questions & Answers

This guide covers the fundamental concepts of Strings in Java, including memory allocation and the nature of immutability.

## 1. How many ways are there to create a String object?
There are two primary ways to create a String in Java:
1.  **String Literal:** `String s1 = "code";`
    * Stored in the **String Constant Pool (SCP)**.
    * JVM checks the SCP first; if "code" exists, it returns a reference. If not, it creates a new entry.
2.  **`new` Keyword:** `String s2 = new String("code");`
    * Forces the creation of a new object in the **Heap** memory.
    * It also ensures a literal exists in the SCP for future reuse. 

## 2. What is the String Constant Pool (SCP)?
The SCP is a special memory area within the Heap used specifically to store string literals. 
* **Purpose:** To facilitate **reusability** and save memory.
* **Uniqueness:** No two objects in the SCP can have the same content. If you create two literals with the same value, both references will point to the same memory address.

## 3. How many objects are created?
* **Case 1: `String s1 = new String("code");`**
    * **Two objects** are created: one in the Heap (referenced by `s1`) and one in the SCP (unreferenced, for future use).
* **Case 2: `String s1 = "code"; String s2 = new String("code");`**
    * **Two objects** total: `s1` creates "code" in the SCP. `s2` creates a new "code" in the Heap but reuses the literal already present in the SCP.


## 4. `==` vs. `equals()`
* **`==` operator:** Compares the **memory addresses** (references). It returns `true` only if both variables point to the exact same object. 
* **`.equals()` method:** Compares the **actual content** of the strings. String overrides this method from the `Object` class to provide content-based comparison.

## 5. What does the `intern()` method do?
The `intern()` method is used to fetch a string from the String Constant Pool. 
* When `s.intern()` is called, the JVM looks for a string with the same content in the SCP.
* If found, it returns the reference from the pool.
* If not found, it adds the string to the pool and returns that reference. 

## 6. Why is String immutable in Java?
Immutability means the state of the object cannot be changed after it is created.
* **Security:** Strings are used for sensitive data like usernames, passwords, and connection URLs. If they were mutable, a hacker could change these values after they were validated.
* **String Pool:** Sharing literals wouldn't be possible if strings were mutable (changing one reference would change all others).
* **Caching:** The hashcode is cached at creation, making Strings very fast as keys in HashMaps.

### Proving Immutability:
If you try to modify a string (e.g., `s1.concat("decode")`), the original string `s1` remains unchanged. Instead, the JVM creates a brand-new String object containing the combined value.

---
