---
id: concurrent-collections-interview
title: Concurrent Collections (Part 1)
sidebar_label: ConcurrentHashMap
description: "Concurrent collection fundamentals and ConcurrentHashMap internals for interview preparation."
tags: [java, interview, concurrency, collections]
---

# Concurrent Collections Interview Questions & Answers

This guide explains why Java 1.5 introduced concurrent collections and dives deep into the internal working of `ConcurrentHashMap`.

## 1. Why were Concurrent Collections introduced?
Traditional collections like `HashMap` and `ArrayList` are not thread-safe. While `Hashtable` and `Vector` are thread-safe, they have several issues:
* **Performance:** They lock the entire collection for every operation, causing significant delays in multi-threaded environments.
* **ConcurrentModificationException:** If one thread is iterating over a collection while another modifies it structurally (adding/removing), a `ConcurrentModificationException` is thrown.

**Solution:** Concurrent collections (like `ConcurrentHashMap`) allow multiple threads to operate simultaneously without throwing exceptions or locking the entire object.

## 2. HashMap vs. ConcurrentHashMap (Code Demo)
In a standard `HashMap`, adding an element during iteration causes a crash:
```java
// Throws ConcurrentModificationException
map.keySet().iterator();
map.put(4, 4); 
```
In `ConcurrentHashMap`, this is perfectly legal and will not throw an exception.

## 3. How does ConcurrentHashMap achieve better performance?
Unlike `Hashtable`, which locks the whole map, `ConcurrentHashMap` uses **Lock Stripping** (Segment Locking).
* **Segments:** The map is divided into multiple segments (default is 16).
* **Independent Locking:** A thread only acquires a lock on the specific segment it is writing to. Other threads can still read from or write to different segments simultaneously.


## 4. What is Concurrency Level?
The **concurrency level** is an integer that determines the number of estimated simultaneously updating threads. 
* By default, it is **16**.
* This value dictates the number of internal segments. If you have 16 segments, 16 different threads can write to 16 different buckets at the same time without blocking each other.

## 5. Why are null keys/values not allowed in ConcurrentHashMap?
`ConcurrentHashMap` does not allow `null` to avoid **ambiguity** in multi-threaded environments.
* In a single-threaded `HashMap`, `get(key) == null` could mean the value is `null` OR the key doesn't exist.
* In a multi-threaded `ConcurrentHashMap`, if `get(key)` returns `null`, you wouldn't know if the value was always `null` or if another thread deleted the key between your `containsKey()` check and your `get()` call.

## 6. Internal Operations: Get vs. Put
* **Read (Get):** Generally non-blocking. Multiple threads can read from the same or different segments at the same time.
* **Write (Put):** Blocking at the **segment level**. 
    1.  Calculate the **Segment Index**.
    2.  Calculate the **Hash/Bucket Index**.
    3.  Acquire a lock on the specific segment.
    4.  Perform the update.

## 7. What is "Lock Stripping"?
Lock stripping is the technique where a large data structure is broken into smaller pieces (strips), each with its own lock. This allows high levels of concurrency because threads only compete for locks if they are accessing the same "strip." 

---
