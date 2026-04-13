---
id: week-5-stacks-queues-monotonic
title: "Week 5: Stacks, Queues & Monotonic Stack"
description: Transition to Phase 2 by mastering LIFO and FIFO data structures. Learn why to avoid Java's legacy Stack class and dive deep into the highly-tested Monotonic Stack pattern.
tags: [dsa, java, stacks, queues, monotonic-stack, algorithms, week-5]
sidebar_position: 5
---

# Week 5: Stacks, Queues & Monotonic Stack

## 1. Overview
Welcome to Week 5 and the beginning of Phase 2! Having mastered arrays and linked lists, we now move to abstract data types that enforce strict rules on how data is inserted and removed: **Stacks (LIFO)** and **Queues (FIFO)**. 

Beyond the basics, this week heavily emphasizes the **Monotonic Stack**, a terrifying-sounding but beautifully simple pattern used to solve complex "Next Greater Element" or "Maximum Area" problems in O(N) time.

**Goals for this week:**
- Understand LIFO (Last-In-First-Out) and FIFO (First-In-First-Out) principles.
- Learn why Java's `java.util.Stack` is obsolete and what to use instead.
- Master the Monotonic Stack pattern to optimize nested loops dealing with sequential comparisons.

---

## 2. Theory & Fundamentals

### Stacks (LIFO)
A stack operates like a physical stack of plates. You can only add (push) or remove (pop) from the top.
- **Java Specifics:** **NEVER use `java.util.Stack`.** It extends `Vector`, meaning every single method is synchronized. This introduces massive, unnecessary thread-locking overhead in single-threaded algorithmic problems. 
- **The Standard:** Always use `Deque<Integer> stack = new ArrayDeque<>();`. It is fast, unsynchronized, and powered by a resizable array under the hood.

### Queues (FIFO)
A queue operates like a line at a grocery store. Elements enter at the back (enqueue) and leave from the front (dequeue).
- **Java Specifics:** `Queue` is an interface. Instantiate it with `Queue<Integer> q = new ArrayDeque<>();`. (You can also use `LinkedList`, but `ArrayDeque` is more cache-friendly and faster for basic queuing).

### The Monotonic Stack
"Monotonic" simply means "strictly increasing" or "strictly decreasing." 
A monotonic stack is a standard stack that we force to stay sorted. If we want a strictly decreasing stack, and we try to push a large number onto it, we must `pop()` all the smaller numbers off the top first before pushing the new one.
- **Why?** The elements we pop off just found their "Next Greater Element." This reduces a brute-force O(N^2) search into a single pass O(N) algorithm.

---

## 3. Code Templates (Java)

### Template 1: Standard Stack / Queue Initialization
```java
// Stack (LIFO)
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); // Add to top
stack.pop();   // Remove from top
stack.peek();  // Look at top without removing

// Queue (FIFO)
Queue<Integer> queue = new ArrayDeque<>();
queue.offer(1); // Add to back
queue.poll();   // Remove from front
queue.peek();   // Look at front without removing
```

### Template 2: Monotonic Stack (Next Greater Element)
Given an array, find the next strictly greater element to the right for every item.
```java
public int[] nextGreaterElement(int[] nums) {
    int[] result = new int[nums.length];
    Arrays.fill(result, -1); // Default to -1 if no greater element exists
    
    // The stack will store INDICES, not values, to keep track of positions
    Deque<Integer> stack = new ArrayDeque<>();
    
    for (int i = 0; i < nums.length; i++) {
        // While current number is greater than the number at the index on top of stack
        while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
            int poppedIndex = stack.pop();
            result[poppedIndex] = nums[i]; // We found the next greater element!
        }
        stack.push(i); // Push current index to wait for its next greater element
    }
    
    return result;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Stack & Queue problems:**
1. **"Next Greater/Smaller Element" or "Nearest Largest":** Any problem asking you to find the closest element to the right/left that meets a size condition is a guaranteed **Monotonic Stack** problem.
2. **"Matching Pairs" or "Nested Structures":** Parentheses parsing, HTML tag validation, or evaluating math expressions (BODMAS/PEMDAS) always require a **Stack** to hold previous states.
3. **"Historical State" or "Undo/Redo":** If a problem asks you to navigate back and forth between previous states (like browser history or directory paths), use a **Stack**.
4. **"Sliding Window Maximum":** If you need the maximum element in a sliding window of size K, use a **Monotonic Queue** (a Deque where elements are ordered).
5. **"Level Order Traversal" or "BFS":** When traversing trees or graphs level by level, a **Queue** is the standard approach.
6. **"Design a data structure with O(1) access and eviction":** This is a classic use case for a combination of `HashMap` (for O(1) access) and a doubly linked list (for O(1) eviction), as seen in LRU Cache implementations.
7. **"Evaluate expressions":** When you need to evaluate mathematical expressions with operator precedence, a stack is essential to keep track of operands and operators.
8. **"Undo/Redo functionality":** If the problem involves implementing undo and redo operations, a stack can be used to keep track of the history of actions.
9. **"Design a browser history":** When asked to design a browser history with back and forward functionality, two stacks can be used to manage the history of visited pages.
10. **"Check for balanced parentheses":** If the problem asks you to check if a string of parentheses is balanced, a stack is the go-to data structure to ensure that every opening parenthesis has a corresponding closing one in the correct order.

---

## 5. Worked Examples

### Example 1: LeetCode 20. Valid Parentheses
**Problem:** Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.
**Solution (Standard Stack):**
```java
class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return stack.isEmpty();
    }
}
```

### Example 2: LeetCode 739. Daily Temperatures
**Problem:** Given an array of integers `temperatures`, return an array such that `answer[i]` is the number of days you have to wait after the i-th day to get a warmer temperature.
**Solution (Monotonic Stack):**
```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int[] answer = new int[temperatures.length];
        Deque<Integer> stack = new ArrayDeque<>(); // Stores indices
        
        for (int i = 0; i < temperatures.length; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int prevDayIndex = stack.pop();
                answer[prevDayIndex] = i - prevDayIndex; // Calculate distance in days
            }
            stack.push(i);
        }
        
        return answer;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Stack & Queue Basics**
1. Valid Parentheses (LC 20)
2. Min Stack (LC 155) - *Classic design question.*
3. Implement Queue using Stacks (LC 232)

**Day 2: String Parsing with Stacks**
4. Simplify Path (LC 71)
5. Evaluate Reverse Polish Notation (LC 150)
6. Decode String (LC 394)

**Day 3: State Management & Removal**
7. Remove All Adjacent Duplicates In String (LC 1047)
8. Make The String Great (LC 1544)
9. Asteroid Collision (LC 735)

**Day 4: Introduction to Monotonic Stack**
10. Next Greater Element I (LC 496)
11. Daily Temperatures (LC 739)
12. Online Stock Span (LC 901)

**Day 5: Advanced Monotonic Stack**
13. Next Greater Element II (LC 503) - *Handles circular arrays.*
14. 132 Pattern (LC 456)
15. Remove K Digits (LC 402)

**Day 6: Monotonic Queues & Hard Stack Patterns**
16. Largest Rectangle in Histogram (LC 84) - *The holy grail of Monotonic Stack problems.*
17. Maximal Rectangle (LC 85) - *Applies LC 84 to a 2D matrix.*
18. Sliding Window Maximum (LC 239) - *Uses a Monotonic Deque.*

**Day 7: Queue Implementations & Review**
19. Design Circular Queue (LC 622)
20. Number of Recent Calls (LC 933)
21. Car Fleet (LC 853) - *Combines math/physics with Monotonic Stack.*

---

## 7. Mock Interview Module

### Problem: The Microservice Profiler (Exclusive Execution Time)
**Context:** You are building an internal monitoring tool for your backend architecture. A request comes in, and functions call other functions recursively or sequentially. 
You are given an integer `n` (the number of unique functions, labeled from `0` to `n-1`) and a list of `logs`. 
Each log is a string formatted as `"function_id:start_or_end:timestamp"`. 
- `"0:start:0"` means function 0 started at the beginning of second 0.
- `"0:end:2"` means function 0 ended at the end of second 2. (Therefore, it ran for 2 - 0 + 1 = 3 seconds).

If Function 0 calls Function 1, Function 0 is "paused" while Function 1 runs. 

**Question:** Write a function `public int[] exclusiveTime(int n, List<String> logs)` that returns the *exclusive* time spent executing each function (meaning, do not count the time spent in nested child functions).

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Are the logs strictly chronological?" -> *Interviewer:* Yes, they are sorted by timestamp.
- *Candidate:* "Can a function call itself recursively?" -> *Interviewer:* Yes. Function 0 can start, and before it ends, another Function 0 can start.
- *Candidate:* "Is it guaranteed to be a valid call stack?" -> *Interviewer:* Yes, every `start` has a corresponding `end`.

#### Step 2: Formulating the Strategy
*Candidate's thought process:*
- Since functions can be nested and paused, this perfectly mimics a computer's Call Stack. A **Stack** is required.
- When a function `start`s, we push it onto the stack.
- When a function `end`s, we pop it off the stack, calculate its execution time, and add it to our `result` array.
- *The tricky part:* How do we handle the "paused" time? If A calls B, we must subtract B's execution time from A's total time.

#### Step 3: The Optimized Solution (Stack)
```java
// Time: O(L) where L is the number of logs. Space: O(L) for the stack.
public int[] exclusiveTime(int n, List<String> logs) {
    int[] result = new int[n];
    Deque<Integer> stack = new ArrayDeque<>(); // Stores function IDs
    int prevTime = 0;
    
    for (String log : logs) {
        String[] parts = log.split(":");
        int id = Integer.parseInt(parts[0]);
        String type = parts[1];
        int timestamp = Integer.parseInt(parts[2]);
        
        if (type.equals("start")) {
            if (!stack.isEmpty()) {
                // Add the time elapsed so far to the function currently running (on top of stack)
                result[stack.peek()] += timestamp - prevTime;
            }
            stack.push(id);
            prevTime = timestamp; // Update prevTime to when this function started
        } else { // "end"
            // Function ends. Note: an "end" happens at the END of the second, so add 1
            result[stack.pop()] += timestamp - prevTime + 1;
            prevTime = timestamp + 1; // The next function resumes at the start of the next second
        }
    }
    
    return result;
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "What if the logs are being streamed over a network from different servers and arrive out of order (i.e., not sorted by timestamp)?"
*Candidate's expected thought process:*
- A Stack relies strictly on chronological order to maintain the nested state.
- If logs arrive out of order, we must buffer them. We would need to parse the logs, store them as objects, and sort them by `timestamp` first. Sorting would change our time complexity to O(L log L).
- Alternatively, if we receive an `end` log before its `start`, we could temporarily cache the `end` events in a HashMap until the corresponding `start` arrives, but resolving the nested subtraction times would become significantly more complex. Sorting is the safest architectural approach.
