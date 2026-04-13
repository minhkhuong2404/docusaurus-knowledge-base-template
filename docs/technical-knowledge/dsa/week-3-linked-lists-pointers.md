---
id: week-3-linked-lists-pointers
title: "Week 3: Linked Lists & Fast/Slow Pointers"
description: Transition from contiguous arrays to node-based data structures. Master reference manipulation, Dummy Nodes, and the Fast & Slow Pointer technique in Java.
tags: [dsa, java, linked-lists, fast-slow-pointers, algorithms, week-3]
sidebar_position: 3
---

# Week 3: Linked Lists & Fast/Slow Pointers

## 1. Overview
Welcome to Week 3! After spending two weeks mastering arrays and strings (contiguous memory), we are now moving to **Linked Lists** (scattered memory). This week is fundamentally about mastering **object references** (pointers) in Java. You will learn how to stitch data together across the heap, how to safely delete elements without memory leaks, and how to detect cycles using the famous Fast & Slow pointer technique.

**Goals for this week:**
- Understand how nodes are stored in the JVM Heap and how Garbage Collection works.
- Master the "Dummy Head" pattern to eliminate edge cases when modifying lists.
- Learn Floyd’s Tortoise and Hare algorithm for cycle detection and finding midpoints.

---

## 2. Theory & Fundamentals

### Linked Lists vs. Arrays
While an array allocates a single block of contiguous memory, a Linked List allocates independent objects (Nodes) that point to one another.
- **Time Complexity:** - Accessing the $i$-th element: $O(N)$ (you must traverse from the head).
  - Insertion/Deletion at the start: $O(1)$.
  - Insertion/Deletion in the middle: $O(1)$ *if* you already have a reference to the previous node.

### Singly vs. Doubly Linked Lists
- **Singly Linked:** Each node has a `next` pointer. You can only move forward.
- **Doubly Linked:** Each node has `next` and `prev` pointers, allowing backward traversal at the cost of double the pointer memory overhead.

### Java Specifics
- **References, Not Pointers:** Java doesn't have explicit pointers like C++, but object variables are *references* to memory addresses. When you do `ListNode curr = head;`, you are not copying the list; you are creating a new reference pointing to the exact same object in the heap.
- **Garbage Collection (GC):** In C++, you must manually `free()` deleted nodes. In Java, if a node is completely detached from your list and no variables point to it, the JVM's Garbage Collector will automatically clean it up.
- **Avoid `java.util.LinkedList`:** For algorithm interviews, **never** use the built-in `LinkedList` class. You must define and manipulate your own `class ListNode`.

---

## 3. Code Templates (Java)

### The Standard `ListNode` Class
```java
public class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
```

### Template 1: The Dummy Head Pattern
Use a dummy node whenever the actual `head` of the list might change or be removed.
```java
public ListNode manipulateList(ListNode head) {
    ListNode dummy = new ListNode(-1);
    dummy.next = head;
    ListNode curr = dummy;
    
    while (curr.next != null) {
        // Perform logic, e.g., if we need to skip a node:
        if (curr.next.val == 0) {
            curr.next = curr.next.next; // The 0 node is unlinked and eventually garbage collected
        } else {
            curr = curr.next;
        }
    }
    
    return dummy.next; // Return the actual new head
}
```

### Template 2: Fast & Slow Pointers (Floyd's Algorithm)
Used to find cycles or the exact middle of a list in one pass.
```java
public boolean hasCycle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    
    // Fast moves 2 steps, Slow moves 1 step
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        
        if (slow == fast) {
            return true; // They met, a cycle exists
        }
    }
    return false; // Fast reached the end, no cycle
}
```

---

## 4. Pattern Recognition Guide

**How to spot Linked List patterns:**
1. **"Reverse a section of a list":** If you need to reverse the whole list, or blocks of $K$ nodes, you will use the **Iterative Reversal Pattern** (tracking `prev`, `curr`, and `nextTemp`).
2. **"Find the middle" or "Find the N-th node from the end":** Use **Fast/Slow Pointers**. For the middle, fast moves $2x$ speed. For the N-th node from the end, give the `fast` pointer an N-step head start, then move both at $1x$ speed.
3. **"Merge lists" or "Remove specific elements":** Always initialize a **Dummy Head** to easily handle cases where the very first element needs to be modified.
4. **"Detect cycles":** Use the **Floyd's Tortoise and Hare** algorithm. If you need to find the exact node where the cycle begins, reset one pointer to `head` after they meet and move both at $1x$ speed until they collide again.
5. **"Add numbers represented as linked lists":** When adding two numbers where each digit is a node, use a dummy head to build the result list and handle carry logic cleanly.
6. **"Copy complex linked structures":** For problems like "Copy List with Random Pointer," use a three-pass approach: first clone nodes and interleave them, then assign random pointers, and finally separate the two lists.
7. **"Design a linked list class":** When implementing a linked list from scratch (e.g., `MyLinkedList`), maintain both `head` and `tail` references for efficient appends, and always consider edge cases for empty lists.
8. **"Reorder or rotate lists":** When asked to reorder nodes in a specific pattern (e.g., L0 → Ln → L1 → Ln-1), use the fast/slow pointer technique to find the middle, reverse the second half, and then merge the two halves together.
9. **"Find intersection of two linked lists":** Use the two-pointer technique where you traverse both lists simultaneously. When one pointer reaches the end, redirect it to the head of the other list. If there is an intersection, they will meet at the intersection node after at most 2 passes.
10. **"Flatten multi-level linked lists":** For problems like "Flatten a Multilevel Doubly Linked List," use a stack to keep track of the next nodes when you encounter a child pointer, allowing you to traverse depth-first while maintaining the correct order.

---

## 5. Worked Examples

### Example 1: LeetCode 206. Reverse Linked List
**Problem:** Given the `head` of a singly linked list, reverse the list, and return the reversed list.
**Solution (Iterative):**
```java
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        
        while (curr != null) {
            ListNode nextTemp = curr.next; // Save the rest of the list
            curr.next = prev;              // Reverse the pointer
            prev = curr;                   // Move prev forward
            curr = nextTemp;               // Move curr forward
        }
        
        return prev; // prev is the new head
    }
}
```

### Example 2: LeetCode 876. Middle of the Linked List
**Problem:** Given the `head` of a singly linked list, return the middle node. If there are two middle nodes, return the second middle node.
**Solution:**
```java
class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;
        
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        
        return slow; // When fast hits the end, slow is exactly in the middle
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Linked List Basics**
1. Reverse Linked List (LC 206)
2. Linked List Cycle (LC 141)
3. Middle of the Linked List (LC 876)

**Day 2: Dummy Heads & Removals**
4. Merge Two Sorted Lists (LC 21)
5. Remove Linked List Elements (LC 203)
6. Remove Nth Node From End of List (LC 19)

**Day 3: Advanced Fast & Slow Pointers**
7. Linked List Cycle II (LC 142)
8. Reorder List (LC 143)
9. Find the Duplicate Number (LC 287) - *Array problem solved via Linked List Cycle logic!*

**Day 4: Reversal Variations**
10. Reverse Linked List II (LC 92)
11. Palindrome Linked List (LC 234)
12. Reverse Nodes in k-Group (LC 25) - *Hard, but essential for mastering pointers.*

**Day 5: Math & Multi-level Lists**
13. Add Two Numbers (LC 2)
14. Copy List with Random Pointer (LC 138)
15. Flatten a Multilevel Doubly Linked List (LC 430)

**Day 6: Design & Complex Architectures**
16. Design Linked List (LC 707)
17. Design Browser History (LC 1472) - *Great use case for Doubly Linked Lists.*
18. LRU Cache (LC 146) - *Crucial system design data structure.*

**Day 7: Review & Re-implement**
19. Intersection of Two Linked Lists (LC 160)
20. Swap Nodes in Pairs (LC 24)
21. Rotate List (LC 61)

---

## 7. Mock Interview Module

### Problem: The Corrupt Sensor Data Stream
**Context:** You are writing backend firmware for an IoT monitoring system. Thousands of temperature sensors are linked together in a daisy-chain network. Each sensor object has a `nextSensor` reference. The data flows correctly until the last sensor, which should point to `null`.
However, a recent firmware patch introduced a bug causing a corruption: the last sensor accidentally points back to a sensor somewhere in the middle of the chain, creating an infinite data loop.

**Question:** Write a function `public Sensor findCorruptionPoint(Sensor head)` that takes the first sensor in the chain and returns the exact `Sensor` object where the cycle *begins* (the node that the tail incorrectly points to). If there is no loop, return `null`.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Can I modify the `Sensor` objects, like adding a `visited` boolean flag?" -> *Interviewer:* No, the `Sensor` class is strictly read-only and locked by the hardware framework.
- *Candidate:* "What are the memory constraints?" -> *Interviewer:* This is running on embedded hardware; you have very limited RAM. An $O(1)$ space solution is highly preferred.

#### Step 2: The Brute Force Solution
Explain that we could use a `HashSet` to store references to every `Sensor` we visit. The first time we try to add a `Sensor` that is already in the set, we've found the start of the loop.
```java
// Time: O(N), Space: O(N)
public Sensor findCorruptionPoint(Sensor head) {
    Set<Sensor> seen = new HashSet<>();
    Sensor curr = head;
    
    while (curr != null) {
        if (seen.contains(curr)) {
            return curr; // We looped back to this node
        }
        seen.add(curr);
        curr = curr.nextSensor;
    }
    return null;
}
```
*Interviewer Critique:* "This works perfectly, but as mentioned, we are on embedded hardware with limited memory. A HashSet storing thousands of object references will cause an OutOfMemoryError. Can we do this in $O(1)$ space?"

#### Step 3: The Optimized Solution (Floyd's Cycle Entry)
Recognize that this requires advanced Fast & Slow Pointers. First, find if a cycle exists. If they meet, reset the `slow` pointer back to the `head`. Then, move *both* pointers at $1x$ speed. The mathematical property of Floyd's algorithm dictates that they will collide exactly at the entrance to the cycle.
```java
// Time: O(N), Space: O(1)
public Sensor findCorruptionPoint(Sensor head) {
    Sensor slow = head;
    Sensor fast = head;
    
    // 1. Find the intersection point
    boolean hasCycle = false;
    while (fast != null && fast.nextSensor != null) {
        slow = slow.nextSensor;
        fast = fast.nextSensor.nextSensor;
        
        if (slow == fast) {
            hasCycle = true;
            break;
        }
    }
    
    if (!hasCycle) return null;
    
    // 2. Find the entrance to the cycle
    slow = head;
    while (slow != fast) {
        slow = slow.nextSensor; // Move 1 step
        fast = fast.nextSensor; // Move 1 step
    }
    
    return slow; // Both point to the corruption start
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "What if the list was so massive that it couldn't fit into memory all at once, and nodes were loaded from a hard drive? How does a Linked List perform compared to an Array in this scenario?"
*Candidate's expected thought process:*
- Linked List nodes are scattered across memory (or disk sectors). Traversing them causes constant **cache misses** or **page faults** because the data is not contiguous.
- Arrays benefit from spatial locality. If you load `arr[0]`, the OS pulls `arr[1]` through `arr[n]` into the CPU cache automatically. Therefore, for massive disk-based data, arrays or B-Trees (which group data into large blocks) are vastly superior to simple Linked Lists.
