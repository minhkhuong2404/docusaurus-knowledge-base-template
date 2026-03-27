---
id: intro
title: Getting Started
sidebar_position: 1
description: Your complete guide to mastering coding interviews with Java
---

# 🚀 Coding Interview Guide

Welcome to the **Coding Interview Guide** — a structured, beginner-friendly reference to help you master every major algorithm and data structure pattern used in technical interviews, with all examples written in **Java**.

---

## 📚 How to Use This Guide

Each topic follows the same layout to make learning consistent:

| Section | What you'll find |
|---|---|
| **Concept** | Plain-English explanation of the idea |
| **When to Use** | How to recognize the pattern in a problem |
| **Template** | Reusable Java code skeleton |
| **Worked Example** | Step-by-step walkthrough |
| **Complexity** | Time & Space analysis |
| **LeetCode Problems** | Curated list sorted by difficulty |

---

## 🗺️ Learning Roadmap

Follow this order if you're starting from scratch:

### Phase 1 — Foundations (Week 1–2)
1. [Array](../array/array) — iteration, index manipulation
2. [Linked List](../linked-list/linked-list) — pointer basics
3. [Stack](../stack/stack) — LIFO pattern
4. [Sorting](../sorting/sorting) — understand the building blocks

### Phase 2 — Core Patterns (Week 3–4)
5. [Two Pointers](../two-pointers/two-pointers)
6. [Sliding Window](../sliding-window/sliding-window)
7. [Prefix Sum](../prefix-sum/prefix-sum)
8. [Binary Search](../binary-search/binary-search)
9. [Matrices](../matrices/matrices)

### Phase 3 — Trees & Graphs (Week 5–6)
10. [Tree](../tree/tree)
11. [BFS](../bfs/bfs)
12. [DFS](../dfs/dfs)
13. [Graph](../graph/graph)
14. [Union Find](../union-find/union-find)
15. [Trie](../trie/trie)

### Phase 4 — Advanced (Week 7–8)
16. [Heap](../heap/heap)
17. [Backtracking](../backtracking/backtracking)
18. [Dynamic Programming](../dynamic-programming/dynamic-programming)
19. [Greedy](../greedy/greedy)
20. [Bit Manipulation](../bit-manipulation/bit-manipulation)
21. [Monotonic Stack](../monotonic-stack/monotonic-stack)
22. [Intervals](../intervals/intervals)

---

## ⏱️ Complexity Cheatsheet

```
O(1)        Constant   → HashMap lookup, array index
O(log n)    Log        → Binary search, balanced BST
O(n)        Linear     → Single loop, two pointers
O(n log n)  Log-Linear → Merge sort, heap sort
O(n²)       Quadratic  → Nested loops, bubble sort
O(2ⁿ)       Exponential→ Backtracking, subset generation
O(n!)       Factorial  → Permutations
```

---

## ☕ Java Quickstart

Make sure you're comfortable with these Java constructs before diving in:

```java
// Collections used constantly
List<Integer> list = new ArrayList<>();
Map<Integer, Integer> map = new HashMap<>();
Set<Integer> set = new HashSet<>();
Deque<Integer> stack = new ArrayDeque<>();   // use as stack
Queue<Integer> queue = new LinkedList<>();
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// Sorting
Arrays.sort(arr);
Collections.sort(list);
Arrays.sort(arr, (a, b) -> a[0] - b[0]);   // custom comparator

// String ↔ char array
char[] chars = s.toCharArray();
String s2 = new String(chars);
StringBuilder sb = new StringBuilder();
```

---

## 🧠 Interview Tips

- **Clarify first**: Ask about input size, edge cases, and whether the input is sorted.
- **Think aloud**: Interviewers want to follow your reasoning.
- **Brute force → optimize**: Always state a naive solution before jumping to the optimal one.
- **Dry-run your code**: Trace through with a small example before claiming it's correct.
- **Know your complexities**: Be ready to explain time and space for any solution you write.

> 💡 Tip: After solving a problem, ask yourself — *"What pattern did I use? Where else does this appear?"*

---

Happy coding! 🎉
