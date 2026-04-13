---
id: week-10-recursion-backtracking
title: "Week 10: Recursion & Backtracking"
description: Master the art of recursive thinking and the 'Choose-Explore-Unchoose' pattern. Learn to solve complex combinatorial problems like permutations, combinations, and grid-based searches in Java.
tags: [dsa, java, recursion, backtracking, algorithms, week-10]
sidebar_position: 10
---

# Week 10: Recursion & Backtracking

## 1. Overview
Welcome to Week 10! After mastering Binary Search, we now dive into one of the most intellectually challenging but rewarding topics in computer science: **Recursion and Backtracking**. 

Recursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem. Backtracking builds upon this by exploring all potential paths in a "Decision Tree" and retreating (backtracking) when it hits a dead end or finds a solution. This is the primary tool for solving combinatorial problems (permutations, subsets) and games (Sudoku, N-Queens).

**Goals for this week:**
- Understand the **JVM Call Stack** and how recursive calls are managed in memory.
- Master the "Base Case" vs. "Recursive Step" logic.
- Learn the **Backtracking Template**: Choose, Explore, Un-choose.
- Understand the difference between Permutations, Combinations, and Subsets.

---

## 2. Theory & Fundamentals

### The Call Stack
Every time a function is called in Java, a new "frame" is pushed onto the **Stack Memory**. This frame contains the function's local variables and parameters. In recursion, if you don't hit a base case, you will keep pushing frames until you exceed the stack size, resulting in the dreaded `StackOverflowError`.

### What is Backtracking?
Backtracking is an algorithmic-technique for solving problems recursively by trying to build a solution incrementally, one piece at a time, removing those solutions that fail to satisfy the constraints of the problem at any point in time.



**The Three Keys of Backtracking:**
1. **Choice:** What decision are we making at this step? (e.g., "Which number do I put in this position?")
2. **Constraints:** Is this choice valid? (e.g., "Is this number already used in the current permutation?")
3. **Goal:** When do we stop? (e.g., "Is the current list size equal to the input array size?")

### Java Specifics: Objects vs. Primitives
In Java, when you pass a `List` into a recursive function, you are passing a **reference**. If you modify that list, it stays modified across all levels of recursion. 
- **The Pitfall:** When adding a current path to your final `resultList`, you **must** create a deep copy: `result.add(new ArrayList<>(currentPath));`. If you don't, every item in your final result will point to the same (eventually empty) list.

---

## 3. Code Templates (Java)

### Template 1: Basic Recursion
```java
public void solve(int params) {
    // 1. Base Case: The exit condition
    if (condition) {
        return;
    }
    
    // 2. Recursive Step: Solve a smaller sub-problem
    solve(smallerParams);
}
```

### Template 2: The Backtracking Pattern
```java
private void backtrack(List<List<Integer>> result, List<Integer> currentPath, int[] nums) {
    // 1. Goal: Did we find a solution?
    if (currentPath.size() == nums.length) {
        result.add(new ArrayList<>(currentPath)); // CRITICAL: Create a deep copy
        return;
    }
    
    for (int i = 0; i < nums.length; i++) {
        // 2. Constraint: Is this choice valid?
        if (currentPath.contains(nums[i])) continue;
        
        // 3. Choose
        currentPath.add(nums[i]);
        
        // 4. Explore (The recursive call)
        backtrack(result, currentPath, nums);
        
        // 5. Un-choose (Backtrack step)
        currentPath.remove(currentPath.size() - 1);
    }
}
```

---

## 4. Pattern Recognition Guide

**How to spot Backtracking problems:**
1. **"Find all possible..." / "Generate all...":** If you need to list every combination, permutation, or valid path, it is backtracking.
2. **"Return the number of ways...":** While sometimes Dynamic Programming, if the constraints are small (e.g., $N < 20$), it’s likely backtracking.
3. **Decision Trees:** If you can visualize the problem as a series of choices where you might need to change your mind later.
4. **"Can we place..." or "Is it possible to...":** If the problem asks if a certain configuration is possible (e.g., placing queens on a chessboard), this is a strong signal for backtracking.
5. **"Find the path..." or "Navigate through...":** If the problem involves finding a path through a grid or graph with constraints, this is often a backtracking problem, especially if you need to explore all possible paths or configurations.
6. **"Generate valid combinations":** If the problem asks you to generate all valid combinations of characters, numbers, or other elements based on certain rules (e.g., generating parentheses), this is a strong signal for backtracking.
7. **"Permutations of a string/array":** If the problem asks for all permutations of a string or array, this is a classic backtracking problem where you explore all possible arrangements of the elements.
8. **"Subsets of a set":** If the problem asks for all subsets of a set, this is a strong signal for backtracking, as you need to explore all combinations of including or excluding each element.
9. **"Sudoku Solver" or "N-Queens":** If the problem involves filling a grid with constraints (like Sudoku or N-Queens), this is a classic backtracking problem where you explore all possible placements and backtrack when you violate the constraints.
10. **"Find all paths from source to destination":** If the problem asks for all paths from a source node to a destination node in a graph, this is often a backtracking problem where you explore all neighbors recursively and backtrack when you hit a dead end.

---

## 5. Worked Examples

### Example 1: LeetCode 78. Subsets
**Problem:** Given an integer array `nums` of unique elements, return all possible subsets (the power set).
**Solution:**
```java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums, 0);
        return result;
    }
    
    private void backtrack(List<List<Integer>> res, List<Integer> path, int[] nums, int start) {
        res.add(new ArrayList<>(path)); // Every state is a valid subset
        
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]); // Choose
            backtrack(res, path, nums, i + 1); // Explore (move to next index)
            path.remove(path.size() - 1); // Un-choose
        }
    }
}
```

### Example 2: LeetCode 46. Permutations
**Problem:** Given an array `nums` of distinct integers, return all the possible permutations.
**Solution:**
```java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums);
        return result;
    }

    private void backtrack(List<List<Integer>> res, List<Integer> path, int[] nums) {
        if (path.size() == nums.length) {
            res.add(new ArrayList<>(path));
            return;
        }

        for (int i = 0; i < nums.length; i++) {
            if (path.contains(nums[i])) continue; // Skip if already used
            
            path.add(nums[i]);
            backtrack(res, path, nums);
            path.remove(path.size() - 1); // Backtrack
        }
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Easy Recursion**
1. Fibonacci Number (LC 509)
2. Reverse String (LC 344) - *Recursive version*
3. Merge Two Sorted Lists (LC 21) - *Recursive version*

**Day 2: Subsets & Combinations**
4. Subsets (LC 78)
5. Subsets II (LC 90) - *Handling duplicates*
6. Combinations (LC 77)

**Day 3: Sum-based Problems**
7. Combination Sum (LC 39)
8. Combination Sum II (LC 40)
9. Combination Sum III (LC 216)

**Day 4: Permutations**
10. Permutations (LC 46)
11. Permutations II (LC 47)
12. Letter Case Permutation (LC 784)

**Day 5: String Backtracking**
13. Letter Combinations of a Phone Number (LC 17)
14. Generate Parentheses (LC 22)
15. Partition Palindrome (LC 131)

**Day 6: Grid Backtracking (Advanced)**
16. Word Search (LC 79)
17. Number of Islands (LC 200) - *DFS is a form of backtracking!*
18. Flood Fill (LC 733)

**Day 7: The "Hard" Classics**
19. N-Queens (LC 51)
20. Sudoku Solver (LC 37)
21. Restore IP Addresses (LC 93)

---

## 7. Mock Interview Module

### Problem: The Password Cracker (Restricted Combinations)
**Context:** You are building a security testing tool. A system allows passwords that consist of exactly $N$ digits. However, to prevent simple patterns, the system has a rule: **No two adjacent digits can be the same.**

**Question:** Write a function `public List<String> generatePasswords(int n)` that returns all valid passwords of length $n$.

#### Step 1: The Brute Force Idea
Explain that we could generate all $10^N$ possible numbers and filter out those with adjacent duplicates. But if $N=8$, that's 100 million checks.
*Interviewer:* "Can we build only the valid ones directly?"

#### Step 2: Optimized Solution (Backtracking)
We build the password digit by digit. For each position, we try digits 0-9, but only if the digit is different from the previous one we chose.

```java
public List<String> generatePasswords(int n) {
    List<String> result = new ArrayList<>();
    if (n <= 0) return result;
    backtrack(result, new StringBuilder(), n);
    return result;
}

private void backtrack(List<String> res, StringBuilder current, int n) {
    if (current.length() == n) {
        res.add(current.toString());
        return;
    }

    for (int digit = 0; digit <= 9; digit++) {
        // Constraint: Cannot be same as previous digit
        if (current.length() > 0 && current.charAt(current.length() - 1) - '0' == digit) {
            continue;
        }

        current.append(digit); // Choose
        backtrack(res, current, n); // Explore
        current.deleteCharAt(current.length() - 1); // Un-choose
    }
}
```

---

### Visualizing the State Space
One of the hardest parts of backtracking is keeping track of the "path" and seeing how the algorithm decides to turn back. To truly master this, explore the visualizer below, which shows how a decision tree expands and contracts as you find permutations.

```json?chameleon
{"component":"LlmGeneratedComponent","props":{"height":"700px","prompt":"Create an interactive Recursion and Backtracking Visualizer for finding all permutations of a small set of characters (e.g., 'ABC'). \n\nGoal: Help the user visualize the 'Decision Tree' and the 'Choose-Explore-Unchoose' pattern.\n\nInitial State:\n- Input: 'ABC'\n- Result List: Empty\n- Current Path: Empty\n- Step: 0\n\nInteractions:\n- Provide 'Prev' and 'Next' buttons to step through the algorithm.\n- A 'Play/Pause' button for auto-stepping.\n- A slider to adjust the speed of the animation.\n\nVisuals:\n- Display a visual representation of the JVM Call Stack (stack frames with current parameters).\n- Draw the 'Decision Tree' (State Space Tree) dynamically. As the user steps forward, highlight the branch currently being explored. If the algorithm 'backtracks', visually show the path retracting (e.g., fading the color or moving a marker back up).\n- Display the 'Current Path' and the 'Final Results' list clearly.\n- Use functional labels to indicate the current phase: 'CHOOSE', 'EXPLORE', or 'UN-CHOOSE' (BACKTRACK).\n\nLogic:\n- The visualization should clearly show how the algorithm skips characters already in the 'Current Path' to satisfy the permutation constraint.\n- Ensure the tree layout is clear and doesn't overlap.","id":"im_fe2910f76b30b63f"}}
```