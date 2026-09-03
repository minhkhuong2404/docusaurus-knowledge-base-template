---
id: week-10-recursion-backtracking
title: "Week 10: Recursion & Backtracking"
description: Master the art of recursive thinking and the 'Choose-Explore-Unchoose' pattern. Learn to solve complex combinatorial problems like permutations, combinations, and grid-based searches in Java.
tags: [dsa, java, recursion, backtracking, algorithms, week-10]
sidebar_position: 10
---

import DsaWeek10BacktrackingDiagram from '@site/src/components/DsaWeek10BacktrackingDiagram';

# Week 10: Recursion & Backtracking

## 1. Overview

Welcome to Week 10! After mastering Binary Search, we now dive into one of the most intellectually challenging but rewarding topics in computer science: **Recursion and Backtracking**.

Recursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem. Backtracking builds upon this by exploring all potential paths in a "Decision Tree" and retreating (backtracking) when it hits a dead end or finds a solution. This is the primary tool for solving combinatorial problems (permutations, subsets) and constraint satisfaction problems (Sudoku, N-Queens).

**Goals for this week:**
- Understand the **JVM Call Stack** and how recursive calls are managed in memory.
- Master the "Base Case" vs. "Recursive Step" logic.
- Learn the **Backtracking Template**: Choose, Explore, Un-choose.
- Understand the difference between Permutations, Combinations, and Subsets.

### Knowledge You Need Before Starting

- Strong control-flow basics and method call understanding in Java.
- Confidence tracing small trees/graphs manually.
- Ability to define clear base cases and shrinking subproblems.
- Comfort with arrays/lists mutation and rollback patterns.

---

## 2. Theory & Fundamentals

<DsaWeek10BacktrackingDiagram />


### 2.1 Mental Model: Recursion as Delegation

The hardest part of recursion is trusting it. The key mental shift is:

> **"I don't solve the whole problem. I solve the current step, then delegate the rest to a smaller version of myself."**

**The Russian Nesting Doll Analogy:**
```mermaid
flowchart TD
    Root["[]"] --> N1["[1]"]
    Root --> N2["[2]"]
    Root --> N3["[3]"]
    N1 --> N12["[1, 2]"]
    N1 --> N13["[1, 3]"]
    N2 --> N21["[2, 1]"]
    N2 --> N23["[2, 3]"]
    N3 --> N31["[3, 1]"]
    N3 --> N32["[3, 2]"]
    N12 --> P1["[1, 2, 3] ✅"]
    N13 --> P2["[1, 3, 2] ✅"]
    N21 --> P3["[2, 1, 3] ✅"]
    N23 --> P4["[2, 3, 1] ✅"]
    N31 --> P5["[3, 1, 2] ✅"]
    N32 --> P6["[3, 2, 1] ✅"]
```

**View 2 — The Call Stack (which frames are active):**
```
Exploring [1, 2, 3]:

Frame 4: backtrack(path=[1,2,3]) ← ADDING TO RESULT
Frame 3: backtrack(path=[1,2])   ← waiting
Frame 2: backtrack(path=[1])     ← waiting
Frame 1: backtrack(path=[])      ← waiting
─────────────────────────────────
main()                            ← entry point
```

Practice drawing both views for small inputs (N=3) before attempting the full implementation. The decision tree shows the big picture; the call stack shows what's in memory at any moment.