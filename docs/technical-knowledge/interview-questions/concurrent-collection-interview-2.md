---
id: concurrent-collections-tricky
title: Concurrent Collections (Part 2)
sidebar_label: CopyOnWrite & ModCount
description: "Advanced concurrent collection interview topics including modCount behavior and CopyOnWriteArrayList usage."
tags: [java, interview, concurrency, collections]
---

# Tricky Concurrent Collection Interview Questions & Answers

This section covers the internal mechanics of `modCount`, single-threaded vs. multi-threaded concurrency exceptions, and the `CopyOnWriteArrayList`.

## 1. Can `ConcurrentModificationException` occur in a single-threaded environment?
**Yes.** A common misconception is that "concurrent" only refers to multiple threads. In Java, this exception occurs whenever you try to modify the structure of a collection (add or remove elements) while iterating over it, even if only one thread (the main thread) is involved.

## 2. What is `modCount` and `expectedModCount`?
Java collections like `ArrayList` use these variables to detect illegal structural modifications during iteration:
* **`modCount`:** A transient variable that tracks how many times the list has been structurally modified (size changed).
* **`expectedModCount`:** When an iterator is created, it initializes this variable with the current value of `modCount`.
* **Detection:** Every time you call `next()` or `remove()` on the iterator, it checks if `modCount == expectedModCount`. If they don't match (because the list was modified outside the iterator), it throws a `ConcurrentModificationException`.

## 3. How to avoid `ConcurrentModificationException`?
There are two primary solutions:
1.  **Use `Iterator.remove()`:** Instead of using `list.remove()`, use the iterator's own remove method. This method updates both `modCount` and `expectedModCount` so they stay in sync.
2.  **Use `CopyOnWriteArrayList`:** This is a thread-safe variant of `ArrayList` where every "write" operation (add, set, remove) creates a fresh, cloned copy of the underlying array.


## 4. `ArrayList` vs. `CopyOnWriteArrayList`
| Feature             | ArrayList                    | CopyOnWriteArrayList                                     |
| :------------------ | :--------------------------- | :------------------------------------------------------- |
| **Thread Safety**   | Unsafe                       | Safe                                                     |
| **Performance**     | High                         | Low (due to array cloning)                               |
| **Behavior**        | Fail-Fast (throws exception) | Fail-Safe (iterates on a snapshot)                       |
| **Iterator Remove** | Supported                    | **Unsupported** (throws `UnsupportedOperationException`) |

## 5. `HashMap` vs. `ConcurrentHashMap`
| Feature              | HashMap   | ConcurrentHashMap        |
| :------------------- | :-------- | :----------------------- |
| **Thread Safety**    | Unsafe    | Safe                     |
| **Performance**      | High      | Lower (locking overhead) |
| **Null Keys/Values** | Allowed   | **Not Allowed**          |
| **Behavior**         | Fail-Fast | Fail-Safe                |

## 6. Which sorting algorithm does `Collections.sort()` use?
* For small collections (less than 7 elements), **Insertion Sort** is used. 
* For larger collections, **Merge Sort** (or more specifically, TimSort in modern Java) is used to ensure stability and O(n log n) performance. 
---
