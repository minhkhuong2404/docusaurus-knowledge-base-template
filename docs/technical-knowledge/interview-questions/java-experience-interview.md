---
id: java-experienced-interview-p1
title: Java Interview for Experienced (Part 1)
sidebar_label: Experienced Q&A Part 1
description: "Experienced Java interview scenarios including memory behavior, HashMap resizing, and performance topics."
tags: [java, interview, backend, performance]
---

# Java Interview Questions for Experienced Developers (3-10 Years)

This guide dives into complex Java behaviors, such as memory management with substrings and the mechanics of HashMap resizing.

## 1. How does `substring()` work and can it cause a Memory Leak?
In Java, a string is internally represented as a character array (`char[]`). When you create a substring, a new String object is created. 

### The Memory Leak Issue (JDK 6 and earlier)
In older versions of Java, the `substring()` method shared the same internal `char[]` as the original string.
* **The Scenario:** If you have a massive string (e.g., 1GB) and you take a tiny 2-character substring, that substring still holds a reference to the entire 1GB character array.
* **The Leak:** Even if you set the original large string to `null`, it cannot be garbage collected because the tiny substring is still "holding" the giant array in memory. [00:03:31]


### The Fix (JDK 7 and later)
Java 7 fixed this by changing the implementation. Instead of sharing the array, the `substring()` method now creates a **copy** of the required characters into a new, smaller array. This allows the original large array to be garbage collected as soon as the original string is no longer needed. [00:09:14]

## 2. What is the Load Factor in `HashMap`?
The performance of a `HashMap` is defined by its **Initial Capacity** and **Load Factor**.
* **Initial Capacity:** The number of buckets created when the map is initialized (default is 16).
* **Load Factor:** A measure of how full the map can get before its capacity is automatically increased (default is 0.75). [00:11:51]

**Resizing Trigger:** When the number of entries in the map exceeds the product of the capacity and load factor (e.g., $16 \times 0.75 = 12$), resizing is triggered. The map's capacity is doubled, and all existing entries are rehashed into the new, larger bucket array. [00:13:04]


## 3. Capacity vs. Size in a `HashMap`
* **Capacity:** The total number of buckets available to store entries. [00:14:02]
* **Size:** The actual number of key-value pairs (mappings) currently present in the map. [00:14:08]

## 4. How to manually prevent a Substring Memory Leak in JDK 6?
If you are working on a legacy system (Java 6 or earlier), you can prevent the leak by using the `String.intern()` method or by creating a new string from the substring:
```java
String safeSubstring = new String(massiveString.substring(0, 2));