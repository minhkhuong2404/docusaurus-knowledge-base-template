---
id: java-collections-interview-p2
title: Java Collections Interview Q&A (Part 2)
sidebar_label: Collections Part 2
description: "Part 2 of Java collections interview Q and A with advanced comparisons and map internals."
tags: [java, interview, collections, maps]
---

# Java Collection Framework Interview Questions - Part 2

This guide covers advanced comparisons, internal workings of Maps, and best practices for using the Collection Framework.

## 1. ArrayList vs. LinkedList: When to use what?
The choice depends on the operations you perform most frequently:
* **ArrayList:** Uses a **Dynamic Array**. It supports **Random Access** with O(1) complexity, making it ideal for search/retrieval operations.
* **LinkedList:** Uses a **Doubly Linked List**. While searching is slow (O(n)), **insertions and deletions** in the middle of the list are very fast (O(1)) because no bit-shifting is required.

## 2. HashMap vs. TreeMap vs. LinkedHashMap
| Feature           | HashMap              | TreeMap                   | LinkedHashMap                   |
| :---------------- | :------------------- | :------------------------ | :------------------------------ |
| **Ordering**      | Random / Unordered   | Natural Ordering (Sorted) | Insertion Order                 |
| **Search/Insert** | O(1)                 | O(log n)                  | O(1)                            |
| **Null Keys**     | One null key allowed | **No null keys**          | One null key allowed            |
| **Structure**     | Hash Table           | Red-Black Tree            | Hash Table + Doubly Linked List |

## 3. What is a PriorityQueue?
A `PriorityQueue` is a special type of queue where elements are processed based on their **priority** rather than their insertion order (FIFO).
* A higher-priority element is served before a lower-priority element.
* Default priority is determined by natural ordering or a custom `Comparator`.

## 4. Requirements for a Map Key
Not every class can be a key. To use a custom object as a key:
1.  **Override `hashCode()` and `equals()`:** You must follow the contract to ensure objects are stored and retrieved from the correct bucket.
2.  **Immutability:** The key should ideally be **immutable** (like `String` or `Integer`). If the key's state changes, its hashcode will change, and you will lose the ability to find the object in the map.

## 5. How to make an ArrayList Read-Only?
You can use the `Collections` utility class:
```java
List<String> readOnlyList = Collections.unmodifiableList(myArrayList);
```
Any attempt to modify this list (add, remove, or set) will result in an `UnsupportedOperationException`.

## 6. How to remove duplicates from an ArrayList?
To remove duplicates while **preserving insertion order**, use a `LinkedHashSet`:
1.  Create a `LinkedHashSet` from the `ArrayList`.
2.  Clear the `ArrayList`.
3.  Add all elements from the `LinkedHashSet` back into the `ArrayList`.

## 7. What is WeakHashMap?
A `WeakHashMap` stores keys as **Weak References**. 
* **Mechanism:** If the key is no longer referenced anywhere else in the application, the Garbage Collector can remove it from the map.
* **Use Case:** This is primarily used for implementing caches where you want the memory to be reclaimed automatically when the key is no longer in use.

## 8. Best Practices for Collections
* **Initial Capacity:** If you know how many elements you will store, specify the initial capacity in the constructor to avoid the overhead of multiple resizing operations.
* **Program to Interfaces:** Use `List<String> list = new ArrayList<>();` instead of using the concrete class as the reference. This allows for easier implementation changes later.
* **Generic Safety:** Always use Generics to avoid `ClassCastException` at runtime.

---
