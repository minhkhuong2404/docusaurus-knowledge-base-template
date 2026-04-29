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

In 1D DP, your decision at step `i` only depended on previous steps in a **single sequence**. In **2D Dynamic Programming**, your current state depends on **two independent variables** simultaneously. The most common scenarios:
- Moving a robot across an $M \times N$ **grid** (row and column as the two variables)
- Comparing two different **strings** of length $M$ and $N$ (position in each string as the two variables)
- The classic **0/1 Knapsack** (item index and remaining capacity as the two variables)

### Why Does This Matter?

2D DP appears in problems that govern some of the most impactful real-world systems:
- **Spell checkers and autocorrect** — Edit Distance tells you how "far" a misspelled word is from each dictionary entry
- **DNA sequence alignment** — Longest Common Subsequence finds shared genetic patterns
- **Diff tools** (like `git diff`) — comparing two file versions to find minimal changes
- **Robot path planning** — finding minimum-cost routes through a grid map

**Goals for this week:**
- Build a rock-solid mental model for thinking in two dimensions simultaneously.
- Master the "dummy row/column" trick for string comparison.
- Master grid-based DP and know the transition logic by heart.
- Learn the space optimization that compresses $O(M \times N)$ to $O(N)$.

### Knowledge You Need Before Starting

- Solid Week 13 (1D DP) recurrence and caching fundamentals.
- Matrix traversal confidence and index-boundary handling.
- Comfort translating 2-variable states (`i`, `j`) into table coordinates.
- Clear understanding of dependency direction when filling tables.

---

## 2. The Core Mental Models

### 2.1 The 2D DP Table — "The Spreadsheet"

Think of a 2D DP table as a spreadsheet. Each cell `dp[i][j]` holds the **best answer to a sub-problem** defined by two coordinates. To fill any cell, you look at already-computed neighbors.

```
Grid DP (Unique Paths):

         col 0  col 1  col 2  col 3
row 0  [  1  ][  1  ][  1  ][  1  ]   ← base case: only 1 way to go right
row 1  [  1  ][  2  ][  3  ][  4  ]
row 2  [  1  ][  3  ][  6  ][ 10  ]   ← dp[2][3] = answer

dp[i][j] = dp[i-1][j]   ← came from ABOVE
          + dp[i][j-1]   ← came from LEFT

Each cell is filled using exactly the cells to its left and above.
The entire table fills left-to-right, top-to-bottom.
```

**The key insight:** Once you know what `dp[i][j]` *means* (what subproblem it solves), the transition formula follows naturally from asking "what smaller subproblems does this depend on?"

---

### 2.2 String Comparison DP — "The Alignment Grid"

When comparing two strings, imagine placing one string along the top of the grid and the other along the left side. Each cell `dp[i][j]` answers the question: *"What is the best answer when considering the first `i` characters of string A and the first `j` characters of string B?"*

```
LCS of "ABCDE" and "ACE":

      ""  A  C  E
  ""  [0][0][0][0]   ← row 0: LCS with empty text1 = 0
   A  [0][1][1][1]
   B  [0][1][1][1]
   C  [0][1][2][2]
   D  [0][1][2][2]
   E  [0][1][2][3]   ← dp[5][3] = 3 (LCS = "ACE")

When text1[i-1] == text2[j-1] (diagonal match):
  dp[i][j] = dp[i-1][j-1] + 1   ← extend the LCS found without these chars

When they don't match (no diagonal):
  dp[i][j] = max(dp[i-1][j],    ← skip char from text1
                 dp[i][j-1])    ← skip char from text2
```

**The "dummy row/column" trick:** Row 0 (all zeros) represents the LCS with an empty `text2`. Column 0 (all zeros) represents the LCS with an empty `text1`. This means every cell can use the same formula without any `if (i == 0 || j == 0)` boundary checks.

---

### 2.3 Edit Distance — "The Cost of Transformation"

Edit Distance is the string DP table where `dp[i][j]` means: *"Minimum operations to convert the first `i` characters of `word1` into the first `j` characters of `word2`."*

```
Edit Distance: "horse" → "ros"

      ""  r  o  s
  ""  [0][1][2][3]   ← base: insert all of word2
   h  [1][1][2][3]   ← delete h, or replace with r
   o  [2][2][1][2]   ← o matches o (diagonal: dp[1][1]=1)
   r  [3][2][2][2]
   s  [4][3][3][2]
   e  [5][4][4][3]   ← dp[5][3] = 3

Transitions (for each cell where word1[i-1] != word2[j-1]):
  Insert:  dp[i][j-1] + 1    ← insert word2[j-1] into word1
  Delete:  dp[i-1][j] + 1    ← delete word1[i-1] from word1
  Replace: dp[i-1][j-1] + 1  ← replace word1[i-1] with word2[j-1]

Take the minimum of all three.
```

**Visualizing the three operations:**

```
At cell dp[i][j], three arrows lead in:

  dp[i-1][j-1] ──→ dp[i][j]    (diagonal: replace or match)
  dp[i-1][j]   ──→ dp[i][j]    (from above: delete from word1)
  dp[i][j-1]   ──→ dp[i][j]    (from left: insert into word1)
```

---

### 2.4 Space Optimization — "The Rolling Window"

A full 2D DP table of size $(M+1) \times (N+1)$ for two 100,000-character strings requires $100,001^2 \times 4$ bytes ≈ **40 GB of RAM**. This is impractical for any real system.

The key observation: to fill row `i`, you only ever look at row `i-1` (the one directly above). You never look at row `i-2` or earlier. So you can **discard** completed rows and keep only two 1D arrays: `prevRow` and `currRow`.

```
Full 2D table:           Space-optimized:

row 0: [0,1,2,3]         prevRow = [0,1,2,3]
row 1: [1,1,2,3]    →    currRow = [1,?,?,?]   ← fill left to right
row 2: [2,2,1,2]         then: prevRow = currRow, reset currRow
row 3: [3,2,2,2]
row 4: [4,3,3,2]
row 5: [5,4,4,3]

Space: O(M×N) → O(N)  (or O(min(M,N)) if you orient the shorter string as columns)
```

**The diagonal value problem:** When filling `currRow[j]`, you need `prevRow[j-1]` (the diagonal). But after updating `currRow[j-1]`, `prevRow[j-1]` is overwritten in a single-array optimization. Fix: **save the diagonal value** before overwriting:

```java
int diag = prevRow[j - 1];  // Save before it's overwritten
prevRow[j - 1] = currRow[j - 1];  // Single-array approach requires this care
```

For clarity in interviews, using two separate arrays (`prevRow` and `currRow`) is safer and equally correct.

---

## 3. Theory & Fundamentals

### 3.1 The Three Types of 2D DP Problems

| Type            | Two Variables                          | `dp[i][j]` Means                                        | Key Transition                     |
| --------------- | -------------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| **Grid DP**     | Row `i`, Column `j`                    | Best answer reaching cell `(i,j)`                       | From above + from left             |
| **String DP**   | Position `i` in A, Position `j` in B   | Best answer for first `i` chars of A and `j` chars of B | Match (diagonal) or skip (up/left) |
| **Knapsack DP** | Item index `i`, Remaining capacity `j` | Max value using items `0..i` with capacity `j`          | Include item `i` or exclude it     |

---

### 3.2 Filling Order — Always Top-Left to Bottom-Right

2D DP tables fill in the direction of increasing indices: **left to right** within each row, **top to bottom** across rows. This ensures that when you compute `dp[i][j]`, all values it depends on (`dp[i-1][j]`, `dp[i][j-1]`, `dp[i-1][j-1]`) are already computed.

```
Fill order for any standard 2D DP:

  (0,0) → (0,1) → (0,2) → ...
    ↓
  (1,0) → (1,1) → (1,2) → ...
    ↓
  (2,0) → (2,1) → (2,2) → ...

Exception: Dungeon Game (LC 174) fills BOTTOM-RIGHT to TOP-LEFT
because the future determines the constraint on the past.
```

---

### 3.3 When to Use $O(1)$ vs $O(N)$ vs $O(M \times N)$ Space

| Space Strategy        | When to Use                                                             | How                             |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| **$O(M \times N)$**   | Always works; default approach; when you need to backtrack the solution | Full 2D array                   |
| **$O(N)$** (two rows) | When you only need the optimal *value*, not the actual path/sequence    | `prevRow[]` + `currRow[]`       |
| **$O(1)$** (in-place) | When the input grid can be modified                                     | Overwrite `grid[i][j]` directly |

**Interview rule:** Always start by explaining the $O(M \times N)$ solution, then offer space optimization as a follow-up. Never skip explaining the full table — it shows your reasoning.

---

### 3.4 The Knapsack Transition — Thinking in Two Dimensions

The 0/1 Knapsack is the most fundamental 2D DP after grid traversal. It models: "Should I include item `i` or not?"

```
items = [(weight=2, val=6), (weight=2, val=10), (weight=3, val=12)]
capacity W = 5

dp[i][w] = max value using items 0..i-1 with capacity exactly w

         w=0  w=1  w=2  w=3  w=4  w=5
i=0  [    0    0    0    0    0    0  ]  (no items)
i=1  [    0    0    6    6    6    6  ]  (item 0: wt=2, val=6)
i=2  [    0    0   10   10   16   16  ]  (item 1: wt=2, val=10)
i=3  [    0    0   10   12   16   22  ]  (item 2: wt=3, val=12)

Transition:
  If item weight > current capacity:
    dp[i][w] = dp[i-1][w]          ← can't include this item

  Else take max of:
    dp[i-1][w]                     ← exclude item i
    dp[i-1][w - weight[i]] + val[i]  ← include item i
```

---

## 4. Code Templates (Java)

### Template 1: Grid Traversal DP

```java
public int gridDP(int m, int n) {
    int[][] dp = new int[m][n];

    // Base cases: first row and first column
    // (only one way to reach them: keep going right/down)
    for (int j = 0; j < n; j++) dp[0][j] = 1;  // Top row
    for (int i = 0; i < m; i++) dp[i][0] = 1;  // Left column

    // Fill left-to-right, top-to-bottom
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i - 1][j]   // From above
                     + dp[i][j - 1];  // From left
        }
    }

    return dp[m - 1][n - 1];
}
```

**Handling obstacles:**

```java
// If grid[i][j] == 1 is an obstacle, set dp[i][j] = 0 (no paths through it)
if (obstacleGrid[i][j] == 1) {
    dp[i][j] = 0;
} else {
    dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
}
```

---

### Template 2: String Comparison DP (LCS)

```java
public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length();
    int n = text2.length();

    // +1 size for the dummy row and column (empty string base cases)
    int[][] dp = new int[m + 1][n + 1];
    // dp[0][*] = 0 (LCS with empty text1 = 0) — Java default
    // dp[*][0] = 0 (LCS with empty text2 = 0) — Java default

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                // Characters match: extend the LCS found without these chars
                dp[i][j] = 1 + dp[i - 1][j - 1];
            } else {
                // No match: best of skipping one char from either string
                dp[i][j] = Math.max(dp[i - 1][j],   // Skip char from text1
                                    dp[i][j - 1]);   // Skip char from text2
            }
        }
    }

    return dp[m][n];
}
```

**Why `charAt(i - 1)` when the loop index is `i`?**
Because `dp[i][j]` represents the first `i` characters of `text1`, and `text1.charAt(i-1)` is the `i`-th character (0-indexed). The `-1` offset bridges the gap between the 1-indexed DP table and the 0-indexed string.

---

### Template 3: Edit Distance DP

```java
public int minDistance(String word1, String word2) {
    int m = word1.length();
    int n = word2.length();
    int[][] dp = new int[m + 1][n + 1];

    // Base cases:
    // Converting word1[0..i] to empty string requires i deletions
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    // Converting empty string to word2[0..j] requires j insertions
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];  // Free: characters already match
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],  // Replace
                               Math.min(dp[i - 1][j],        // Delete
                                        dp[i][j - 1]));      // Insert
            }
        }
    }

    return dp[m][n];
}
```

---

### Template 4: Space-Optimized 2D DP (Two Rows)

```java
public int spaceOptimizedDP(String a, String b) {
    int m = a.length();
    int n = b.length();

    // Optimization: ensure b is the shorter string (fewer columns = less memory)
    if (m < n) return spaceOptimizedDP(b, a);

    int[] prevRow = new int[n + 1];
    int[] currRow = new int[n + 1];

    // Initialize prevRow as the first row (i=0: base cases)
    for (int j = 0; j <= n; j++) prevRow[j] = j;  // For Edit Distance base case

    for (int i = 1; i <= m; i++) {
        currRow[0] = i;  // Base case for column 0

        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                currRow[j] = prevRow[j - 1];  // Diagonal: free match
            } else {
                currRow[j] = 1 + Math.min(prevRow[j - 1],  // Replace (diagonal)
                                 Math.min(prevRow[j],        // Delete (above)
                                          currRow[j - 1])); // Insert (left)
            }
        }

        // Swap rows: current becomes previous for next iteration
        int[] temp = prevRow;
        prevRow = currRow;
        currRow = temp;  // Reuse the old prevRow array instead of allocating new
    }

    return prevRow[n];  // Answer is in prevRow after last swap
}
```

**The `temp` swap trick:** Instead of `prevRow = currRow.clone()` (which allocates a new array each iteration), swap the references. No new memory is allocated — you reuse the two arrays alternately. This is a subtle but important optimization for large inputs.

---

## 5. Pattern Recognition Guide

### 5.1 The Decision Flowchart

```
                        START
                          │
              Does the problem involve
              TWO independent variables?
                          │
                    ┌─ YES ┴─ NO ─────────────────────────────┐
                    │                                         │
                    ▼                                         ▼
          What are the two variables?                   (1D DP or
    ┌────────────┬────────────────┬──────────┐          other technique)
    │            │                │          │
    ▼            ▼                ▼          ▼
 Row &         Position         Item &    Start &
 Column        in each          Weight    End of
 (grid)        string           (Knapsack) interval
    │            │                │          │
    ▼            ▼                ▼          ▼
 Grid DP     String DP         0/1        Interval
 Template    Template       Knapsack      DP (hard)
    1         2 or 3
                │
     What is the question?
    ┌────────────┴─────────────────┐
    │                             │
    ▼                             ▼
"Longest common          "Minimum edits/
subsequence/             operations to
substring"               transform"
    │                             │
    ▼                             ▼
LCS template              Edit Distance
(diagonal=match,          template
up/left=skip)             (all 3 directions)
```

---

### 5.2 Keyword Trigger Table

| Problem Keywords                                            | Technique                | Key Signal                                                                    |
| ----------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| "min cost path from top-left to bottom-right"               | Grid DP                  | Move only right/down                                                          |
| "number of paths" in a grid                                 | Grid DP                  | Count, not optimize                                                           |
| "grid with obstacles"                                       | Grid DP + obstacle check | `dp[i][j] = 0` at obstacle                                                    |
| "longest common subsequence"                                | LCS DP                   | Diagonal match, up/left skip                                                  |
| "minimum edit distance" / "minimum operations to transform" | Edit Distance DP         | All three directions + 1                                                      |
| "distinct subsequences" / "how many ways to form"           | DP on two strings        | Count paths through the table                                                 |
| "wildcard matching" / "regex matching"                      | DP on two strings        | `*` or `.` adds special cases                                                 |
| "interleaving strings"                                      | 2D DP                    | `dp[i][j]` = can we interleave `s1[0..i]` and `s2[0..j]` to form `s3[0..i+j]` |
| "maximize the value" + "weight constraint"                  | 0/1 Knapsack             | Include or exclude each item                                                  |
| "minimum insertions to make palindrome"                     | LCS on string + reverse  | LCS(s, reverse(s))                                                            |
| "largest square of 1s"                                      | Grid DP                  | `dp[i][j] = min(above, left, diagonal) + 1`                                   |
| "dungeon game" / "minimum health"                           | Grid DP (reverse)        | Fill bottom-right to top-left                                                 |

---

### 5.3 Common Traps & How to Avoid Them

**Trap 1: Forgetting the `+1` size for string DP tables**

```java
// ❌ Wrong — no room for the empty-string base cases
int[][] dp = new int[m][n];
dp[0][0] = ...;  // This represents first char vs first char, not empty vs empty!

// ✅ Correct — row 0 and col 0 are the "empty string" base cases
int[][] dp = new int[m + 1][n + 1];
// dp[0][j] = 0 for all j (LCS/Edit Distance with empty string)
// dp[i][0] = i for Edit Distance (need i deletions to reach empty string)
```

---

**Trap 2: Using `charAt(i)` instead of `charAt(i-1)` in string DP**

```java
// ❌ Wrong — off by one! dp[i][j] covers first i chars, so the i-th char is at index i-1
if (text1.charAt(i) == text2.charAt(j)) { ... }  // ArrayIndexOutOfBoundsException at i=m!

// ✅ Correct
if (text1.charAt(i - 1) == text2.charAt(j - 1)) { ... }
```

---

**Trap 3: Missing base case initialization for Edit Distance**

```java
// ❌ Forgetting to initialize the base cases:
// dp[i][0] and dp[0][j] will be 0 (Java default), which is WRONG for Edit Distance.
// Converting "abc" to "" requires 3 deletions, not 0.

// ✅ Always set the base cases explicitly:
for (int i = 0; i <= m; i++) dp[i][0] = i;  // Delete all of word1
for (int j = 0; j <= n; j++) dp[0][j] = j;  // Insert all of word2
```

---

**Trap 4: Wrong fill direction for "reverse" DP problems**

```java
// Dungeon Game (LC 174): health required at (0,0) depends on (0,1) and (1,0)
// You MUST fill from bottom-right to top-left.

// ❌ Standard top-left to bottom-right fill fails here
for (int i = 0; i < m; i++) {
    for (int j = 0; j < n; j++) { ... }  // Wrong direction!
}

// ✅ Reverse fill
for (int i = m - 1; i >= 0; i--) {
    for (int j = n - 1; j >= 0; j--) { ... }
}
```

---

**Trap 5: Using `clone()` instead of reference swapping in space-optimized DP**

```java
// ❌ Allocates a new array on every row — defeats the purpose of optimization
prevRow = currRow.clone();

// ✅ Swap references — zero allocation, reuses existing arrays
int[] temp = prevRow;
prevRow = currRow;
currRow = temp;
```

---

**Trap 6: Forgetting `Math.max` with the "no include" option in Knapsack**

```java
// ❌ Only considers including the item, forgets that NOT including it might be better
dp[i][w] = dp[i-1][w - weight[i]] + val[i];

// ✅ Must take max of include vs. exclude
if (weight[i] > w) {
    dp[i][w] = dp[i-1][w];  // Can't include: too heavy
} else {
    dp[i][w] = Math.max(dp[i-1][w],                      // Exclude
                        dp[i-1][w - weight[i]] + val[i]); // Include
}
```

---

**Trap 7: Modifying input when doing in-place grid DP without permission**

```java
// ❌ Silently corrupts the caller's data if they reuse the grid
grid[i][j] += grid[i-1][j];

// ✅ Ask the interviewer: "Can I modify the input?"
// If not, create a separate dp array:
int[][] dp = new int[m][n];
for (int[] row : grid) ... // Copy or compute from original
```

---

## 6. Worked Examples (Step-by-Step Walkthroughs)

### Example 1: LeetCode 62 — Unique Paths

**Problem:** How many unique paths are there from the top-left to the bottom-right of an $M \times N$ grid, moving only right or down?

**Thought process:**
1. "Grid" + "number of paths" → Grid DP.
2. `dp[i][j]` = number of ways to reach cell `(i,j)`.
3. You can only arrive from above `(i-1,j)` or from the left `(i,j-1)`.
4. Base case: entire first row = 1 (only one way: keep going right), entire first column = 1.

```
m=3, n=4 grid:

         col0  col1  col2  col3
row0   [  1  ][  1  ][  1  ][  1  ]   ← all 1: only one path along top row
row1   [  1  ][  2  ][  3  ][  4  ]   ← dp[1][1] = dp[0][1] + dp[1][0] = 1+1 = 2
row2   [  1  ][  3  ][  6  ][ 10  ]   ← dp[2][3] = dp[1][3] + dp[2][2] = 4+6 = 10

Answer: dp[2][3] = 10 ✅
```

```java
class Solution {
    public int uniquePaths(int m, int n) {
        int[][] dp = new int[m][n];

        // Base cases
        for (int j = 0; j < n; j++) dp[0][j] = 1;
        for (int i = 0; i < m; i++) dp[i][0] = 1;

        // Fill
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
            }
        }

        return dp[m - 1][n - 1];
    }
}
```

**Complexity:** Time $O(M \times N)$, Space $O(M \times N)$ reducible to $O(N)$.

---

### Example 2: LeetCode 1143 — Longest Common Subsequence

**Problem:** Return the length of the longest subsequence common to both strings.

**Thought process:**
1. Two strings → String DP with dummy row and column.
2. `dp[i][j]` = LCS of `text1[0..i-1]` and `text2[0..j-1]`.
3. If last characters match: `dp[i][j] = dp[i-1][j-1] + 1` (extend LCS by 1).
4. If they don't match: best is to skip one character from either: `max(dp[i-1][j], dp[i][j-1])`.

```
text1 = "abcde",  text2 = "ace"

      ""  a  c  e
  ""  [0][0][0][0]
   a  [0][1][1][1]   ← a==a: dp[1][1] = dp[0][0]+1 = 1
   b  [0][1][1][1]   ← b≠a,c,e: max of above/left = 1
   c  [0][1][2][2]   ← c==c: dp[3][2] = dp[2][1]+1 = 2
   d  [0][1][2][2]   ← d≠a,c,e: stays 2
   e  [0][1][2][3]   ← e==e: dp[5][3] = dp[4][2]+1 = 3

Answer: dp[5][3] = 3 (LCS = "ace") ✅
```

```java
class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length(), n = text2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                    dp[i][j] = 1 + dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp[m][n];
    }
}
```

---

### Example 3: LeetCode 72 — Edit Distance

**Problem:** Return the minimum number of insertions, deletions, or replacements to transform `word1` into `word2`.

**Thought process:**
1. Two strings → String DP.
2. `dp[i][j]` = min operations to convert `word1[0..i-1]` to `word2[0..j-1]`.
3. Base cases: `dp[i][0] = i` (delete all `i` chars), `dp[0][j] = j` (insert all `j` chars).
4. If characters match: `dp[i][j] = dp[i-1][j-1]` (free, no operation needed).
5. If they don't match: `1 + min(replace, delete, insert)`.

```
word1 = "horse",  word2 = "ros"

      ""  r  o  s
  ""  [0][1][2][3]
   h  [1][1][2][3]   h≠r: min(replace:0+1=1, delete:1+1=2, insert:1+1=2) → 1
   o  [2][2][1][2]   o==o: dp[1][1]=1 (diagonal, free)
   r  [3][2][2][2]   r==r: dp[2][1]=2 (diagonal, free)
   s  [4][3][3][2]   s==s: dp[3][2]=2 (diagonal, free) → dp[4][3]=2
   e  [5][4][4][3]   e≠s: min(replace:2+1=3, delete:4+1=5, insert:3+1=4) → 3

Answer: dp[5][3] = 3 ✅
Operations: replace 'h'→'r', delete 'r', delete 'e' → "ros"
```

```java
class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];

        // Base cases
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];  // Free match
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],  // Replace
                                   Math.min(dp[i - 1][j],        // Delete
                                            dp[i][j - 1]));      // Insert
                }
            }
        }

        return dp[m][n];
    }
}
```

---

### Example 4: LeetCode 221 — Maximal Square

**Problem:** Find the area of the largest square containing only `'1'`s in a binary matrix.

**Thought process:**
1. "Largest square of 1s in a grid" → Grid DP.
2. `dp[i][j]` = side length of the largest square whose **bottom-right corner** is at `(i,j)`.
3. Transition: if `matrix[i][j] == '1'`, then `dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1`.
4. **Why `min`?** The largest square ending at `(i,j)` is limited by the smallest of its three neighbors. If any one is small, it blocks the square from expanding.

```
matrix:
  1 0 1 1 1
  1 1 1 1 1
  1 1 1 1 1
  1 0 0 1 0

dp table:
  1 0 1 1 1
  1 1 1 2 2
  1 1 2 3 3
  1 0 0 1 0

Maximum dp value = 3 → area = 3² = 9 ✅

dp[2][3] = min(dp[1][3]=2, dp[2][2]=2, dp[1][2]=1) + 1 = 1+1 = 2  ← limited by diagonal!
dp[2][4] = min(dp[1][4]=2, dp[2][3]=2, dp[1][3]=2) + 1 = 2+1 = 3  ← all neighbors are 2
```

```java
class Solution {
    public int maximalSquare(char[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] dp = new int[m + 1][n + 1];  // +1 for boundary safety
        int maxSide = 0;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (matrix[i - 1][j - 1] == '1') {
                    dp[i][j] = Math.min(dp[i - 1][j],
                               Math.min(dp[i][j - 1],
                                        dp[i - 1][j - 1])) + 1;
                    maxSide = Math.max(maxSide, dp[i][j]);
                }
            }
        }

        return maxSide * maxSide;
    }
}
```

**Why the `+1` in `new int[m+1][n+1]`?** It gives us a free ring of zeros around the top and left boundary, eliminating the need for `if (i==0 || j==0)` checks in the transition. The same "dummy row/column" trick as string DP.

---

## 7. Problem-Solving Framework (Use This in Interviews)

### Step 1 — Define the Subproblem (the most critical step)

State out loud: *"dp[i][j] represents ______."*

For grid: "dp[i][j] = minimum cost to reach cell (i,j)."
For strings: "dp[i][j] = length of the LCS of the first i characters of text1 and the first j characters of text2."

If you can't complete that sentence, stop and think more before coding.

### Step 2 — Identify the Base Cases

> "When i=0 or j=0, the answer is _____ because _____."

For LCS: "dp[0][j] = 0 because LCS with an empty string is 0."
For Edit Distance: "dp[i][0] = i because converting i characters to empty requires i deletions."

### Step 3 — Write the Transition

Ask: "How does dp[i][j] relate to smaller subproblems?"
- Did the last characters match? → Diagonal
- Should I skip a character from string A? → From above
- Should I skip a character from string B? → From left
- Am I taking the minimum cost? → `Math.min(above, left)`
- Am I counting paths? → `above + left`

### Step 4 — Code the Nested Loop

```java
for (int i = ...; i <= m; i++) {
    for (int j = ...; j <= n; j++) {
        // Apply transition
    }
}
```

### Step 5 — Offer Space Optimization

> "The current solution is $O(M \times N)$ space. Since filling row `i` only needs row `i-1`, I can compress this to $O(N)$ using two 1D arrays and swapping references. Would you like me to implement that?"

### Step 6 — Test With a Small Example

Always trace through a 3×3 or 4×4 example manually to verify the table fills correctly before submitting.

---

## 8. 7-Day Practice Plan (21 Problems)

**Day 1: Grid DP Foundations**
1. Unique Paths (LC 62) — *The cleanest 2D DP — memorize this table*
2. Unique Paths II (LC 63) — *Add obstacle handling: `if obstacle → dp[i][j] = 0`*
3. Minimum Path Sum (LC 64) — *Same structure, minimize instead of count*

> **Day 1 Focus:** After solving LC 62, solve it again using only a single 1D array (rolling array). The trick: process columns left to right and update in-place: `dp[j] += dp[j-1]`. This is the most compact DP you'll write.

**Day 2: Multi-String DP Basics**
4. Longest Common Subsequence (LC 1143) — *The foundation string DP*
5. Is Subsequence (LC 392) — *Solve with two pointers, then implement the DP version; understand the relationship*
6. Edit Distance (LC 72) — *The canonical "all three directions" problem*

> **Day 2 Focus:** After solving LCS and Edit Distance, notice: LCS uses `max(up, left)` when no match; Edit Distance uses `1 + min(diagonal, up, left)` when no match. Both use `diagonal` on a match. This structural similarity is the key insight.

**Day 3: Advanced String DP**
7. Distinct Subsequences (LC 115) — *"How many ways" instead of "longest"*
8. Interleaving String (LC 97) — *`dp[i][j]` = can we interleave first i of s1 and first j of s2 to form s3's first i+j chars*
9. Delete Operation for Two Strings (LC 583) — *Minimum deletions = m + n - 2 × LCS(s1, s2)*

> **Day 3 Focus:** LC 583 is a beautiful insight problem. You're not directly computing deletions — you're computing LCS and using the formula `deletions = m + n - 2 × LCS`. Always look for such reductions.

**Day 4: Knapsack & 2D Arrays**
10. Target Sum (LC 494) — *Knapsack disguised as "assign +/-": count subsets with sum = (total+target)/2*
11. Maximal Square (LC 221) — *`dp[i][j] = min(3 neighbors) + 1`*
12. Triangle (LC 120) — *Bottom-up DP: fill from bottom row to top*

> **Day 4 Focus:** LC 221's `min(3 neighbors)` transition is surprising — spend time understanding **why** the minimum bounds the square size. Draw a 4×4 example and manually trace which neighbor limits expansion.

**Day 5: Palindromic DP Matrices**
13. Longest Palindromic Subsequence (LC 516) — *LCS(s, reverse(s))*
14. Palindromic Substrings (LC 647) — *`dp[i][j]` = is s[i..j] a palindrome? Expand from 1-char and 2-char bases*
15. Minimum Insertion Steps to Make a String Palindrome (LC 1312) — *`n - LPS(s)` where LPS = Longest Palindromic Subsequence*

> **Day 5 Focus:** LC 516 and LC 1312 share the same LCS computation — just against the reversed string. LC 647 has a different fill order: `dp[i][j]` depends on `dp[i+1][j-1]`, so fill diagonally (by length of substring), not row-by-row.

**Day 6: Matrix Games & Hard Logic**
16. Dungeon Game (LC 174) — *Fill bottom-right to top-left: reverse the normal direction!*
17. Minimum Falling Path Sum (LC 931) — *3-way transition: dp[i][j] = min(above-left, above, above-right) + grid[i][j]*
18. Uncrossed Lines (LC 1035) — *Identical algorithm to LCS — the "uncrossed lines" framing IS LCS in disguise*

> **Day 6 Focus:** LC 174 is the hardest directional challenge. The knight needs minimum health entering each cell such that health never drops to 0. Working forward doesn't work — you don't know future damage yet. Working backward from the dragon (bottom-right) lets you compute the minimum required health entering each cell.

**Day 7: Consolidating Space Optimization**
19. Regular Expression Matching (LC 10) — *The boss battle: `'.'` matches any char, `'*'` matches zero or more of previous*
20. Wildcard Matching (LC 44) — *Simpler than LC 10: `'?'` matches any single char, `'*'` matches any sequence*
21. Out of Boundary Paths (LC 576) — *Count paths that exit the grid; `dp[i][j]` = paths exiting from `(i,j)` in `N` moves*

> **Day 7 Focus:** LC 10 is genuinely hard. The `'*'` case has two subcases: (1) use `'*'` as zero occurrences of the previous char: `dp[i][j] = dp[i][j-2]`, (2) use `'*'` to match one more char: `dp[i][j] = dp[i-1][j]` (if chars match). Master this problem and you've mastered string DP.

---

## 9. Mock Interview Module

### Problem: Database Record Deduplication (Fuzzy CRM Matcher)

**Context:** A CRM system has duplicate user profiles with slightly misspelled names. Given two names `recordA` and `recordB`, compute the "Edit Cost" where insert = 1, delete = 1, but **replace = 2** (it's a delete + insert).

**Question 1:** `public int getFuzzyCost(String a, String b)`
**Question 2:** Optimize for when strings can be 100,000 characters long.

---

#### Step 1: Clarifying Questions

- *Candidate:* "Is replace always 2, or does it depend on the characters being swapped?" → *Interviewer:* Always 2, regardless of which characters.
- *Candidate:* "Are the strings ASCII or Unicode? Could they contain spaces or special characters?" → *Interviewer:* Assume lowercase ASCII letters.
- *Candidate:* "Should I handle null or empty string inputs?" → *Interviewer:* Assume non-null; empty string is valid.
- *Candidate:* "Is the operation symmetric — is cost(A→B) == cost(B→A)?" → *Interviewer:* Yes.

> **Tip:** The symmetry question is a good sanity check. With standard insert/delete/replace, edit distance IS symmetric. Knowing this lets you swap strings to optimize space.

---

#### Step 2: Formulating the Strategy

*Candidate's thought process out loud:*
1. "This is a variation of Edit Distance (LC 72). The only change is that replace costs 2 instead of 1."
2. "I'll use a `(m+1) × (n+1)` DP table. Base cases are the same: `dp[i][0] = i`, `dp[0][j] = j`."
3. "The transition: if characters match, `dp[i][j] = dp[i-1][j-1]` (free). If not, `min(insert+1, delete+1, replace+2)`."
4. "For the follow-up: I'll use two 1D arrays and swap references. $O(M \times N)$ → $O(\min(M,N))$."

---

#### Step 3: Full Solution (Both Versions)

```java
// Version 1: Full 2D DP — O(M×N) time, O(M×N) space
public int getFuzzyCost(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                int insertCost  = dp[i][j - 1] + 1;
                int deleteCost  = dp[i - 1][j] + 1;
                int replaceCost = dp[i - 1][j - 1] + 2;  // ← the only change!
                dp[i][j] = Math.min(replaceCost, Math.min(insertCost, deleteCost));
            }
        }
    }

    return dp[m][n];
}

// Version 2: Space-optimized — O(M×N) time, O(min(M,N)) space
public int getFuzzyCostOptimized(String a, String b) {
    // Ensure b is the shorter string (fewer columns = less memory)
    if (a.length() < b.length()) return getFuzzyCostOptimized(b, a);

    int m = a.length(), n = b.length();
    int[] prev = new int[n + 1];
    int[] curr = new int[n + 1];

    for (int j = 0; j <= n; j++) prev[j] = j;

    for (int i = 1; i <= m; i++) {
        curr[0] = i;

        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                curr[j] = prev[j - 1];
            } else {
                curr[j] = Math.min(prev[j - 1] + 2,       // Replace
                          Math.min(curr[j - 1] + 1,        // Insert
                                   prev[j] + 1));           // Delete
            }
        }

        // Swap references — no new allocation
        int[] temp = prev;
        prev = curr;
        curr = temp;
    }

    return prev[n];
}
```

**Memory calculation to state in the interview:**

> "A $100,000 \times 100,000$ int matrix = $10^{10}$ integers × 4 bytes = 40 GB. Completely infeasible. With two 1D arrays of size $100,001$: approximately 800 KB. Well within the 512 MB budget."

---

#### Step 4: Follow-up Questions

**Follow-up 1 (Backtracking the actual edits):**
*Interviewer:* "The cost is useful for ranking duplicates, but the operations team also wants to see which specific insertions/deletions are needed. How do you reconstruct the operation sequence?"

*Expected thought process:*
- Space-optimized DP only gives you the final cost — you can't backtrack without the full table.
- To reconstruct: keep the full $O(M \times N)$ table. Then start at `dp[m][n]` and trace backwards:
  - If `a[i-1] == b[j-1]`: came from diagonal (no operation) → move to `(i-1, j-1)`.
  - If came from `dp[i-1][j]` (above) → delete `a[i-1]`, move up.
  - If came from `dp[i][j-1]` (left) → insert `b[j-1]`, move left.
  - If came from `dp[i-1][j-1]` (diagonal) with mismatch → replace, move diagonal.
- Collect operations in reverse, then reverse the list at the end.

**Follow-up 2 (Threshold Pruning):**
*Interviewer:* "The CRM considers two names duplicates if the fuzzy cost is ≤ 3. For a database with 10 million names, comparing every pair is $O(N^2 \times M \times N)$ — too slow. How do you prune?"

*Expected thought process:*
- **Early termination in the DP:** If the current row's minimum value exceeds the threshold, stop computing — this pair can't be a duplicate. In string DP, the minimum value in row `i` is always at `dp[i][i]` (roughly). Add `if (rowMin > threshold) return threshold + 1` to exit early.
- **Locality-sensitive hashing (LSH):** Hash names into buckets where similar names (low edit distance) land in the same bucket. Only compare names within the same bucket — reduces comparisons from $O(N^2)$ to near $O(N)$ in practice.
- **Blocking on prefix:** Sort names alphabetically and only compare names that share the first 2-3 characters. This is a standard data deduplication heuristic.

**Follow-up 3 (Different Operation Costs):**
*Interviewer:* "Now each character substitution has its own cost based on keyboard proximity (e.g., replacing 'q' with 'w' is cheap because they're adjacent; replacing 'q' with 'z' is expensive). How does the DP change?"

*Expected thought process:*
- The DP structure is identical. The only change is in the transition:
- `replaceCost = dp[i-1][j-1] + substitutionCost[a.charAt(i-1)][b.charAt(j-1)]`
- Pre-build a `26 × 26` substitution cost matrix from keyboard layout data.
- This is the **Damerau-Levenshtein distance** generalization used in real spell checkers (e.g., SymSpell algorithm).

---

## 10. Connecting to Other Weeks

2D DP is the synthesis of almost everything you've learned:

```
Week 7 (Graphs) + Week 14 (2D DP):
  → Grid DP on a 2D matrix is BFS/DFS with memoization
  → Unique Paths = BFS counting paths
  → Minimum Path Sum = Dijkstra on a grid (but DP is faster since edges are acyclic)
  → Dungeon Game = DFS from target backward to start

Week 11 (Intervals) + Week 14 (2D DP):
  → Interval DP: dp[i][j] = optimal answer on the subarray from index i to j
  → Burst Balloons (LC 312): dp[i][j] = max coins from bursting balloons between i and j
  → Matrix Chain Multiplication: dp[i][j] = min operations to multiply matrices i..j

Week 13 (1D DP) + Week 14 (2D DP):
  → 1D: dp[i] depends only on dp[i-1] or dp[i-2]
  → 2D: dp[i][j] depends on dp[i-1][j], dp[i][j-1], and dp[i-1][j-1]
  → Space optimization reduces 2D back to 1D arrays (closing the circle)

Week 9 (Binary Search) + Week 14 (2D DP):
  → Longest Increasing Subsequence: O(N log N) = DP array + binary search
  → The 1D DP array IS the sorted structure binary search operates on
```

---

## 11. Quick Reference Cheat Sheet

```
╔══════════════════════════════════════════════════════════════╗
║          2D DYNAMIC PROGRAMMING CHEAT SHEET                 ║
╠══════════════════════════════════════════════════════════════╣
║ TABLE SIZE                                                   ║
║   Grid DP: int[m][n]                                        ║
║   String DP: int[m+1][n+1]  ← dummy row/col for empty str  ║
║   Index bridge: dp[i][j] uses charAt(i-1) and charAt(j-1)  ║
╠══════════════════════════════════════════════════════════════╣
║ BASE CASES (String DP)                                       ║
║   LCS: dp[0][*] = 0, dp[*][0] = 0  (Java default)         ║
║   Edit Distance: dp[i][0] = i, dp[0][j] = j               ║
╠══════════════════════════════════════════════════════════════╣
║ TRANSITIONS                                                  ║
║   Match (diagonal): dp[i][j] = dp[i-1][j-1] (+1 for LCS)  ║
║   LCS no match: max(dp[i-1][j], dp[i][j-1])                ║
║   Edit no match: 1 + min(dp[i-1][j-1], dp[i-1][j],        ║
║                              dp[i][j-1])                    ║
║   Maximal Square: min(above, left, diag) + 1               ║
╠══════════════════════════════════════════════════════════════╣
║ FILL ORDER                                                   ║
║   Standard: top-left → bottom-right (i++, j++)             ║
║   Reverse (Dungeon Game): bottom-right → top-left           ║
║   Palindrome: by substring length (diagonal fill)           ║
╠══════════════════════════════════════════════════════════════╣
║ SPACE OPTIMIZATION                                           ║
║   Keep only prevRow + currRow                               ║
║   Swap with temp reference (no clone, no allocation)        ║
║   Use shorter string as columns: O(min(M,N)) space          ║
╠══════════════════════════════════════════════════════════════╣
║ COMPLEXITY                                                   ║
║   Time: O(M × N) — always                                  ║
║   Space: O(M × N) → O(N) with row compression              ║
║          → O(1) with in-place grid modification             ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 12. What's Coming Next

**Week 15: Advanced DP Patterns** — pushing 2D DP to its limits:
- **Interval DP:** `dp[i][j]` = optimal answer for the subarray `[i..j]`. Burst Balloons (LC 312) is the canonical example. Fill order: by increasing interval length.
- **Bitmask DP:** State = a bitmask of which items have been chosen. Used for Traveling Salesman, assignment problems.
- **Tree DP:** Running DP on tree structures — `dp[node][state]` instead of `dp[i][j]`. Used for "House Robber III" and similar tree-based optimization.

**Week 16+: Graph Algorithms + DP:**
- Shortest path on weighted graphs with Dijkstra = BFS + Priority Queue (not DP).
- But Floyd-Warshall (all-pairs shortest path) IS a 2D DP: `dp[i][j][k]` = shortest path from `i` to `j` using only vertices `0..k`. Space-compress the third dimension → standard 2D matrix updated in-place.

**The meta-skill 2D DP teaches:** When a problem has two independent dimensions of choice (position in two strings, row and column in a grid, item and capacity), resist the urge to nest loops naively. Define what `dp[i][j]` means precisely, identify base cases, write the transition by asking "what smaller subproblems does this depend on?" — and the code follows mechanically from the math.