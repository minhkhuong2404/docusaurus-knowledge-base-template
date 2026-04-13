---
id: week-14-dynamic-programming-2d
title: "Week 14: Dynamic Programming II (2D)"
description: Master multi-dimensional Dynamic Programming. Learn to solve Grid Traversals, String Alignments (LCS, Edit Distance), and 2D space optimization in Java.
tags: [dsa, java, dynamic-programming, 2d-dp, algorithms, week-14, optimization]
sidebar_position: 14
---

# Week 14: Dynamic Programming II (2D)

## 1. Overview
Welcome to Week 14! You survived your first week of Dynamic Programming. Now, we are expanding our state machine from one dimension into two. 

In 1D DP, your decision at step `i` only depended on previous steps in a single sequence. In **2D Dynamic Programming**, your current state depends on **two independent variables**. The most common scenarios are moving a robot across an $M \times N$ grid, or comparing two completely different strings (`String A` of length $M$, and `String B` of length $N$).

**Goals for this week:**
- Master Grid-based DP (paths, minimum costs, obstacle avoidance).
- Master Sequence Alignment DP (Longest Common Subsequence, Edit Distance).
- Learn how to populate a 2D matrix bottom-up safely.
- Learn the ultimate DP optimization: compressing an $O(M \times N)$ 2D matrix down to an $O(N)$ 1D array by keeping only the "previous row" in memory.

---

## 2. Theory & Fundamentals

### The 2D DP Matrix
When dealing with two variables, we map our subproblems to a 2D array: `int[][] dp = new int[M][N]`.
- The cell `dp[i][j]` holds the optimal answer for the subproblem ending at index `i` of the first dimension and index `j` of the second dimension.
- To fill `dp[i][j]`, you generally look at:
  - `dp[i-1][j]` (The cell directly above)
  - `dp[i][j-1]` (The cell directly to the left)
  - `dp[i-1][j-1]` (The cell diagonally up-left)

### String Comparison (The "Dummy Row" Trick)
When comparing two strings, the base cases are often "what if one of the strings is empty?" 
To handle this elegantly without out-of-bounds exceptions, we initialize our DP table to `new int[m + 1][n + 1]`. 
- Row `0` represents an empty `String A`.
- Column `0` represents an empty `String B`.
- This means `dp[1][1]` compares the first characters: `A.charAt(0)` and `B.charAt(0)`.

### Space Optimization (Row Compression)
If you look closely at the dependencies of a 2D DP matrix, calculating the current row `i` usually *only* requires values from row `i` and row `i-1`. 
Once you move to row `i+1`, you never look at row `i-1` again. Therefore, you don't need an entire $M \times N$ matrix. You only need two 1D arrays: `prevRow[]` and `currRow[]`. (Sometimes, you can even do it with a single array!).

---

## 3. Code Templates (Java)

### Template 1: Grid Traversal DP (Unique Paths)
Find the number of ways to reach the bottom-right of an $M \times N$ grid, moving only down and right.
```java
public int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    
    // 1. Initialize Base Cases (First row and first column)
    // There is only 1 way to reach any cell in the top row (keep going right)
    for (int j = 0; j < n; j++) dp[0][j] = 1;
    // There is only 1 way to reach any cell in the left column (keep going down)
    for (int i = 0; i < m; i++) dp[i][0] = 1;
    
    // 2. Iterate and fill the matrix
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            // The paths to the current cell = paths from ABOVE + paths from LEFT
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
        }
    }
    
    return dp[m - 1][n - 1];
}
```

### Template 2: String Comparison DP (Longest Common Subsequence)
```java
public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length();
    int n = text2.length();
    // Using the "Dummy Row/Col" trick (+1 size)
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                // Characters match: add 1 to the result of the sequences without these characters
                dp[i][j] = 1 + dp[i - 1][j - 1];
            } else {
                // Characters don't match: take the max by ignoring one character or the other
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    return dp[m][n];
}
```

---

## 4. Pattern Recognition Guide

**How to spot 2D Dynamic Programming problems:**
1. **"Given two strings, find the minimum/maximum/longest..."** This is almost always a 2D DP matrix where `dp[i][j]` maps the first string to the second string.
2. **"Given a 2D matrix/grid, find the min cost / max profit path..."** Classic Grid DP.
3. **The 0/1 Knapsack constraints:** "You have `N` items and a maximum weight `W`." The two variables are `itemIndex` and `currentCapacity`. This requires a 2D array `dp[N][W]`.
4. **"Given a list of words, find the longest chain..."** This is a hidden 2D DP problem where you compare each word to every other word to build chains.
5. **"Given a list of strings, find the longest common prefix/suffix..."** This is a 2D DP problem where you compare each string to every other string to find commonalities.
6. **"Given a grid with obstacles, find the number of paths..."** This is a Grid DP problem where you need to account for blocked cells.
7. **"Given a grid with costs, find the minimum cost path..."** This is a Grid DP problem where you need to accumulate costs while traversing the grid.
8. **"Given two sequences, find the longest common subsequence..."** This is a classic 2D DP problem where you build a matrix to compare the two sequences character by character.
9. **"Given two strings, find the edit distance..."** This is a classic 2D DP problem where you build a matrix to compute the minimum number of edits (insertions, deletions, substitutions) required to transform one string into the other.
10. **"Given a grid, find the largest square of 1's..."** This is a Grid DP problem where you build a matrix to keep track of the largest square that can be formed at each cell based on its neighbors.

---

## 5. Worked Examples

### Example 1: LeetCode 64. Minimum Path Sum
**Problem:** Given an $M \times N$ `grid` filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.
**Solution (In-place Grid DP):**
*Note: If modifying the input array is allowed, you can achieve $O(1)$ auxiliary space!*
```java
class Solution {
    public int minPathSum(int[][] grid) {
        int m = grid.length;
        int n = grid[0].length;
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (i == 0 && j == 0) continue; // Start point
                
                if (i == 0) {
                    // Top row: can only come from the left
                    grid[i][j] += grid[i][j - 1];
                } else if (j == 0) {
                    // Left column: can only come from above
                    grid[i][j] += grid[i - 1][j];
                } else {
                    // General case: min of coming from left or above
                    grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
                }
            }
        }
        
        return grid[m - 1][n - 1];
    }
}
```

### Example 2: LeetCode 72. Edit Distance
**Problem:** Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) required to convert `word1` to `word2`.
**Solution (2D Matrix):**
```java
class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        
        // Base cases: converting to/from empty strings
        for (int i = 0; i <= m; i++) dp[i][0] = i; // Deleting all characters
        for (int j = 0; j <= n; j++) dp[0][j] = j; // Inserting all characters
        
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    // Cost is 0 if characters are the same
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    // Min of: Insert (dp[i][j-1]), Delete (dp[i-1][j]), Replace (dp[i-1][j-1])
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], 
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
            }
        }
        
        return dp[m][n];
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Grid DP Foundations**
1. Unique Paths (LC 62)
2. Unique Paths II (LC 63) - *Handles obstacles.*
3. Minimum Path Sum (LC 64)

**Day 2: Multi-String DP Basics**
4. Longest Common Subsequence (LC 1143)
5. Is Subsequence (LC 392) - *Can be done with 2 pointers, but understand the DP relationship.*
6. Edit Distance (LC 72)

**Day 3: Advanced String DP**
7. Distinct Subsequences (LC 115)
8. Interleaving String (LC 97)
9. Delete Operation for Two Strings (LC 583)

**Day 4: Knapsack & 2D Arrays**
10. Target Sum (LC 494) - *Solve this using a 2D array, mapping `index` and `currentSum`.*
11. Maximal Square (LC 221)
12. Triangle (LC 120)

**Day 5: Palindromic DP Matrices**
13. Longest Palindromic Subsequence (LC 516) - *Compare string with its reverse!*
14. Palindromic Substrings (LC 647) - *Expand around center is better, but DP is viable.*
15. Minimum Insertion Steps to Make a String Palindrome (LC 1312)

**Day 6: Matrix Games & Hard Logic**
16. Dungeon Game (LC 174) - *Trick: You must iterate backwards from bottom-right to top-left.*
17. Minimum Falling Path Sum (LC 931)
18. Uncrossed Lines (LC 1035) - *Exact same algorithm as LCS in disguise.*

**Day 7: Consolidating Space Optimization**
19. Regular Expression Matching (LC 10) - *The boss battle of String DP.*
20. Wildcard Matching (LC 44)
21. Out of Boundary Paths (LC 576)

---

## 7. Mock Interview Module

### Problem: Database Record Deduplication (Fuzzy CRM Matcher)
**Context:** You are working on a backend CRM (Customer Relationship Management) system. The database is cluttered with duplicate user profiles because salespeople spell names slightly differently over the phone (e.g., "Jonathon" vs. "Jonathan").
You need to write a fuzzy-matching service. You are given two names: `recordA` and `recordB`. 
To determine if they are the same person, you calculate an "Edit Cost". 
In your specific database architecture:
- Inserting a character costs `1`.
- Deleting a character costs `1`.
- Replacing a character is actually a delete followed by an insert, so it costs **`2`**.

**Question 1:** Write a method `public int getFuzzyCost(String a, String b)` that returns the minimum cost to convert `a` to `b` based on these rules. 

#### Step 1: The Standard DP Solution
*Candidate's thought process:*
- This is a direct variation of the classic "Edit Distance" problem.
- I will initialize a `(m+1) x (n+1)` DP matrix.
- The base cases are identical: deleting `i` characters costs `i * 1`.
- The transition logic is the only difference: `Replace` now costs `2` instead of `1`.
```java
// Time: O(M * N), Space: O(M * N)
public int getFuzzyCost(String a, String b) {
    int m = a.length();
    int n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1]; // No cost
            } else {
                int insertCost = dp[i][j - 1] + 1;
                int deleteCost = dp[i - 1][j] + 1;
                int replaceCost = dp[i - 1][j - 1] + 2; // Notice the +2 here
                
                dp[i][j] = Math.min(replaceCost, Math.min(insertCost, deleteCost));
            }
        }
    }
    return dp[m][n];
}
```

#### Step 2: The Architectural Follow-up (Space Optimization)
*Interviewer:* "Great. Now, imagine `recordA` is a multi-page document consisting of 100,000 characters, and `recordB` is similar. A $100,000 \times 100,000$ integer matrix requires 40 Gigabytes of RAM. Your microservice only has 512 MB of RAM. How do you optimize the space complexity?"

*Candidate's expected thought process:*
- To fill `dp[i][j]`, I only look at `dp[i-1][j-1]`, `dp[i-1][j]`, and `dp[i][j-1]`.
- This means I strictly only need the **previous row** and the **current row** being built. I don't need all 100,000 rows.
- I can compress the $O(M \times N)$ space down to $O(N)$ by using two 1D arrays of size `n + 1`: `prevRow` and `currRow`.
- *Bonus Optimization:* To guarantee I use the absolute minimum memory, I should ensure `N` is the length of the *shorter* string by swapping `a` and `b` if `a.length() < b.length()`.

```java
// Time: O(M * N), Space: O(min(M, N))
public int getFuzzyCostOptimized(String a, String b) {
    if (a.length() < b.length()) {
        return getFuzzyCostOptimized(b, a); // Ensure 'b' is the smaller string
    }
    
    int m = a.length();
    int n = b.length();
    int[] prevRow = new int[n + 1];
    int[] currRow = new int[n + 1];
    
    // Initialize first row
    for (int j = 0; j <= n; j++) prevRow[j] = j;
    
    for (int i = 1; i <= m; i++) {
        currRow[0] = i; // The first column is always 'i' (deleting all characters)
        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                currRow[j] = prevRow[j - 1];
            } else {
                currRow[j] = Math.min(prevRow[j - 1] + 2, 
                             Math.min(currRow[j - 1] + 1, prevRow[j] + 1));
            }
        }
        // Move to the next row (Clone to avoid reference sharing)
        prevRow = currRow.clone();
    }
    
    return prevRow[n];
}
```