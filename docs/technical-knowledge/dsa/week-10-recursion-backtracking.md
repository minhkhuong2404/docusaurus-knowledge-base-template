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

Recursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem. Backtracking builds upon this by exploring all potential paths in a "Decision Tree" and retreating (backtracking) when it hits a dead end or finds a solution. This is the primary tool for solving combinatorial problems (permutations, subsets) and constraint satisfaction problems (Sudoku, N-Queens).

**Goals for this week:**
- Understand the **JVM Call Stack** and how recursive calls are managed in memory.
- Master the "Base Case" vs. "Recursive Step" logic.
- Learn the **Backtracking Template**: Choose, Explore, Un-choose.
- Understand the difference between Permutations, Combinations, and Subsets.

---

## 2. Theory & Fundamentals

### 2.1 Mental Model: Recursion as Delegation

The hardest part of recursion is trusting it. The key mental shift is:

> **"I don't solve the whole problem. I solve the current step, then delegate the rest to a smaller version of myself."**

**The Russian Nesting Doll Analogy:**
```
Open the outermost doll → set it aside → open next doll → ... → reach the smallest doll (base case)
→ put smallest doll back in → put that into the next → ... → back to the outermost

Each "doll" is a stack frame. Opening = recursive call. Closing = returning from that call.
```

**Fibonacci as delegation:**
```
fib(5) = ?
  "I don't know. I'll delegate:
   fib(5) = fib(4) + fib(3)"
  
  fib(4) = ?
    "fib(4) = fib(3) + fib(2)"
    
    fib(3) = fib(2) + fib(1)
    fib(2) = fib(1) + fib(0) = 1 + 0 = 1
    fib(1) = 1 ← BASE CASE
    fib(0) = 0 ← BASE CASE

Results bubble back up:
fib(2) = 1, fib(3) = 2, fib(4) = 3, fib(5) = 5
```

**The two mandatory parts of any recursive function:**

| Part               | Purpose                                             | What happens if you forget it              |
| ------------------ | --------------------------------------------------- | ------------------------------------------ |
| **Base Case**      | Stop recursion when the smallest problem is reached | `StackOverflowError` — infinite recursion  |
| **Recursive Step** | Solve a *strictly smaller* subproblem               | `StackOverflowError` — not making progress |

---

### 2.2 The JVM Call Stack

Every time a method is called in Java, the JVM pushes a new **stack frame** onto the **Stack Memory**. This frame stores:
- The method's local variables
- The method's parameters
- The return address (where to go when this call finishes)

```
Calling fib(4):

Stack grows ↓                 Stack shrinks ↑
─────────────────             ─────────────────
| fib(0) n=0    |             result: 0
─────────────────             
| fib(1) n=1    |             result: 1
─────────────────             
| fib(2) n=2    |   →→→→→    result: 1
─────────────────             
| fib(3) n=3    |             result: 2
─────────────────             
| fib(4) n=4    |             result: 3
─────────────────

JVM Stack limit ≈ 5,000-10,000 frames (default 1MB)
Deep recursion on large N → StackOverflowError
```

**Practical implication:** For an input of size $N$ where your recursion goes $N$ levels deep, you use $O(N)$ stack space. This is often invisible until you hit a 10,000+ depth tree or array.

**When to convert recursion to iteration:**
- Input can be very large (N > 10,000)
- Space is constrained
- The recursion is **tail-recursive** (the recursive call is the last operation) — Java doesn't optimize tail calls, but you can convert manually to a loop

---

### 2.3 What is Backtracking?

Backtracking = Recursion + Undoing Choices

The core idea: you are exploring a **Decision Tree**. At each node, you make a choice, go deeper, and if you reach a dead end (constraint violated) or a solution (goal reached), you **undo that choice** and try the next option.

**The Decision Tree for permutations of [1, 2, 3]:**
```
                           [ ]
              /             |              \
           [1]             [2]             [3]
          /   \           /   \           /   \
       [1,2] [1,3]    [2,1] [2,3]    [3,1] [3,2]
         |     |        |     |        |     |
      [1,2,3][1,3,2] [2,1,3][2,3,1] [3,1,2][3,2,1]
      ✅      ✅       ✅      ✅       ✅      ✅
```

The algorithm explores each branch fully before backtracking to try the next sibling.

**The Three Keys — expanded:**

| Key            | Question                          | Example (Permutations)                       |
| -------------- | --------------------------------- | -------------------------------------------- |
| **Choice**     | What options do I have right now? | "Which unused number do I pick next?"        |
| **Constraint** | Is this choice valid?             | "Is this number already in my current path?" |
| **Goal**       | Am I done?                        | "Does my path have all N numbers?"           |

**Backtracking vs. Brute Force:**
- **Brute force** generates ALL possibilities and checks each one after.
- **Backtracking** prunes invalid paths *early*, never completing them.

```
Backtracking prunes at [X] to avoid exploring entire subtrees:

          [ ]
         / | \
       [1] [2] [3]
       /
    [1,1]  ← Constraint violated! Prune here.
            Never explore [1,1,2], [1,1,3], etc.
```

**Worst case:** Even with pruning, backtracking can be exponential. But for well-constrained problems (like Sudoku), pruning eliminates the vast majority of the search space.

---

### 2.4 Java Specifics: The Deep Copy Pitfall

This is the single most common bug in backtracking — failing to copy the current path when adding to results.

```java
// The problem: Java List is passed by REFERENCE
List<Integer> path = new ArrayList<>();
List<List<Integer>> result = new ArrayList<>();

path.add(1); path.add(2); path.add(3);
result.add(path);        // ❌ result contains a REFERENCE to path, not a copy

path.clear();            // Clearing path also clears what's in result!
System.out.println(result); // prints [[]] — empty! The reference was modified.
```

**Visualized:**
```
After result.add(path):
  result[0] ──────────▶ [1, 2, 3]  (same object as path)
  path      ──────────▶ [1, 2, 3]

After path.clear():
  result[0] ──────────▶ []  (same object — now empty!)
  path      ──────────▶ []

// ✅ CORRECT — create a new independent copy:
result.add(new ArrayList<>(path));

After result.add(new ArrayList<>(path)):
  result[0] ──────────▶ [1, 2, 3]  (NEW independent object)
  path      ──────────▶ [1, 2, 3]  (original)

After path.clear():
  result[0] ──────────▶ [1, 2, 3]  ✅ (unaffected)
  path      ──────────▶ []
```

**Why does `new ArrayList<>(path)` work?** It constructs a new list by copying all elements by value. Since the elements are `Integer` (primitives wrapped in objects), this is a true independent snapshot.

---

### 2.5 Permutations vs. Combinations vs. Subsets

These three are the building blocks of almost every backtracking problem. Understanding the difference unlocks pattern recognition.

|                  | Definition                       | Example (from [1,2,3])                            | Order matters? | Count          |
| ---------------- | -------------------------------- | ------------------------------------------------- | -------------- | -------------- |
| **Permutations** | All arrangements of all elements | `[1,2,3], [1,3,2], [2,1,3]...`                    | ✅ Yes          | $N!$           |
| **Combinations** | All ways to choose K elements    | Choose 2: `[1,2], [1,3], [2,3]`                   | ❌ No           | $C(N, K)$ |
| **Subsets**      | All possible subsets (all sizes) | `[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]` | ❌ No           | $2^N$          |

**The code difference:**

```
Permutations: loop from 0 each time, skip used elements, no "start" index
Combinations: loop from "start" each time, advance start in recursive call
Subsets:      same as combinations but add to result at EVERY node, not just leaves
```

**Decision: Does order matter?**
- Yes → Permutation → loop from 0, track used with `boolean[]` or `contains()`
- No → Combination/Subset → loop from `start` index to avoid revisiting

---

### 2.6 Using `StringBuilder` vs. `List` in Backtracking

For string-based backtracking problems, `StringBuilder` is more efficient than `List<Character>` because it avoids boxing:

```java
// ❌ Slower — boxing/unboxing chars
List<Character> path = new ArrayList<>();
path.add('a');
path.remove(path.size() - 1);

// ✅ Faster — use StringBuilder
StringBuilder sb = new StringBuilder();
sb.append('a');
sb.deleteCharAt(sb.length() - 1); // efficient O(1) delete from end
```

When to use each:
- String problems (phone number combos, parentheses, palindrome partitioning) → `StringBuilder`
- Number/object problems (permutations, subsets, combinations) → `List<Integer>`

---

### 2.7 Pruning Strategies — Making Backtracking Faster

**Pruning** = skipping a branch early when you know it can't lead to a valid solution. The more you prune, the faster your solution runs.

**Strategy 1 — Sort first, skip duplicates:**
```java
// For problems like Subsets II (with duplicates in input):
Arrays.sort(nums); // sort first
for (int i = start; i < nums.length; i++) {
    // Skip duplicates at the same recursion level
    if (i > start && nums[i] == nums[i - 1]) continue; // ← pruning
    path.add(nums[i]);
    backtrack(res, path, nums, i + 1);
    path.remove(path.size() - 1);
}
```

**Strategy 2 — Constraint check before recursing:**
```java
// For Combination Sum (target sum):
for (int i = start; i < candidates.length; i++) {
    if (candidates[i] > remaining) break; // ← prune: sorted array, can stop early
    path.add(candidates[i]);
    backtrack(res, path, candidates, i, remaining - candidates[i]);
    path.remove(path.size() - 1);
}
```

**Strategy 3 — Row/column/box tracking for Sudoku:**
```java
// Instead of scanning the board each time:
boolean[][] rowUsed = new boolean[9][10];   // rowUsed[row][digit]
boolean[][] colUsed = new boolean[9][10];   // colUsed[col][digit]
boolean[][] boxUsed = new boolean[9][10];   // boxUsed[box][digit]

// O(1) validity check instead of O(81) scan
boolean isValid = !rowUsed[row][digit] && !colUsed[col][digit] && !boxUsed[boxIndex][digit];
```

---

## 3. Code Templates (Java)

### Template 1: Basic Recursion Structure

```java
public ReturnType solve(Parameters params) {
    // 1. Base Case — ALWAYS FIRST
    if (baseCondition) {
        return baseValue;
    }

    // 2. Recursive Step — solve a strictly smaller subproblem
    ReturnType subResult = solve(smallerParams);

    // 3. Combine — use subResult to compute this level's answer
    return combine(currentWork, subResult);
}
```

### Template 2: Subsets (Add at every node)

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> path, int[] nums, int start) {
    result.add(new ArrayList<>(path)); // ← Add at EVERY node (including empty)

    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);             // Choose
        backtrack(result, path, nums, i + 1); // Explore (i+1 prevents reuse)
        path.remove(path.size() - 1); // Un-choose
    }
}
```

### Template 3: Combinations (Add only at leaves)

```java
public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), n, k, 1);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> path, int n, int k, int start) {
    if (path.size() == k) {
        result.add(new ArrayList<>(path)); // ← Add only when size reached
        return;
    }

    // Pruning: no need to go further if not enough numbers left
    // Remaining spots needed: k - path.size()
    // Numbers left: n - i + 1 must be >= k - path.size()
    for (int i = start; i <= n - (k - path.size()) + 1; i++) {
        path.add(i);
        backtrack(result, path, n, k, i + 1);
        path.remove(path.size() - 1);
    }
}
```

### Template 4: Permutations (Track used with boolean array)

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums, new boolean[nums.length]);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> path,
                        int[] nums, boolean[] used) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;     // Constraint: skip already used

        used[i] = true;            // Choose
        path.add(nums[i]);
        backtrack(result, path, nums, used); // Explore
        path.remove(path.size() - 1);       // Un-choose
        used[i] = false;
    }
}
```

> **Prefer `boolean[] used` over `path.contains()`:** `contains()` is $O(N)$ per call, making the total complexity $O(N^2 \cdot N!)$. A `boolean[]` check is $O(1)$, giving $O(N \cdot N!)$.

### Template 5: Combination Sum (Allow reuse, prune by remaining)

```java
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    Arrays.sort(candidates); // sort enables early termination
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), candidates, target, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> path,
                        int[] candidates, int remaining, int start) {
    if (remaining == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remaining) break; // ← Pruning: sorted array
        path.add(candidates[i]);
        backtrack(result, path, candidates, remaining - candidates[i], i); // i not i+1 (reuse allowed)
        path.remove(path.size() - 1);
    }
}
```

### Template 6: String Backtracking with StringBuilder

```java
public List<String> generatePasswords(int n) {
    List<String> result = new ArrayList<>();
    backtrack(result, new StringBuilder(), n);
    return result;
}

private void backtrack(List<String> result, StringBuilder current, int n) {
    if (current.length() == n) {
        result.add(current.toString()); // snapshot the string
        return;
    }

    for (char c : choices) {
        if (!isValid(current, c)) continue; // Constraint check

        current.append(c);                              // Choose
        backtrack(result, current, n);                  // Explore
        current.deleteCharAt(current.length() - 1);    // Un-choose
    }
}
```

### Template 7: Grid Backtracking (Word Search)

```java
private static final int[][] DIRS = {{0,1},{0,-1},{1,0},{-1,0}};

public boolean backtrackGrid(char[][] board, boolean[][] visited,
                              int row, int col, String word, int index) {
    if (index == word.length()) return true; // All characters matched

    // Bounds + visited + character check
    if (row < 0 || row >= board.length || col < 0 || col >= board[0].length
            || visited[row][col] || board[row][col] != word.charAt(index)) {
        return false;
    }

    visited[row][col] = true;  // Choose (mark as part of current path)

    for (int[] dir : DIRS) {
        if (backtrackGrid(board, visited, row + dir[0], col + dir[1], word, index + 1)) {
            visited[row][col] = false; // Un-choose before returning
            return true;
        }
    }

    visited[row][col] = false; // Un-choose (backtrack)
    return false;
}
```

### Template 8: Handling Duplicates (Sort + Skip)

```java
// For Subsets II, Permutations II — input has duplicate values
public List<List<Integer>> subsetsWithDup(int[] nums) {
    Arrays.sort(nums); // Critical: sort first so duplicates are adjacent
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> path,
                        int[] nums, int start) {
    result.add(new ArrayList<>(path));

    for (int i = start; i < nums.length; i++) {
        // Skip duplicates at the SAME recursion level (not across levels)
        if (i > start && nums[i] == nums[i - 1]) continue;

        path.add(nums[i]);
        backtrack(result, path, nums, i + 1);
        path.remove(path.size() - 1);
    }
}
```

---

## 4. Problem-Solving Framework

### Step 1 — Classify the Problem (1 minute)

Ask:
- "Do I need ALL solutions?" → Backtracking
- "Does order matter?" → Yes: Permutation. No: Combination/Subset
- "Can I reuse elements?" → Yes: Combination Sum style (pass `i`, not `i+1`). No: pass `i+1`
- "Are there duplicates in the input?" → Sort first + skip duplicate branches

### Step 2 — Define the Decision Tree

Mentally sketch:
- **Root:** Empty state / starting state
- **Branches:** What choices do I have at each node?
- **Leaves:** What is a complete/valid solution?
- **Pruning:** What constraint kills a branch early?

```
Example: Generate parentheses of length 2n

Root: ""
Choice at each step: add "(" or ")"
Constraint:
  - Can't add ")" if closedCount >= openCount (unbalanced)
  - Can't add "(" if openCount >= n (already used all opens)
Goal: string length == 2n
```

### Step 3 — Write the Signature

```java
private void backtrack(
    List<List<Integer>> result,   // accumulate answers
    List<Integer> currentPath,    // current state being built
    int[] input,                  // the input data
    int start,                    // where to start (for combinations)
    boolean[] used,               // which elements are used (for permutations)
    int remaining                 // remaining budget (for sum problems)
) { ... }
```

Not every parameter is needed in every problem. Only include what the current problem needs to enforce constraints.

### Step 4 — Write Base Case First

```java
// What does a complete solution look like?
if (currentPath.size() == targetSize) {        // permutation / combination
if (remaining == 0) {                          // sum problem
if (index == word.length()) {                  // string matching
if (row == board.length) {                     // grid completed
    result.add(new ArrayList<>(currentPath));  // ← ALWAYS deep copy!
    return;
}
```

### Step 5 — Write the Loop

```java
for (/* choices */) {
    if (/* constraint violated */) continue; // or break if sorted

    // Choose
    currentPath.add(choice);
    used[i] = true;

    // Explore
    backtrack(result, currentPath, ...);

    // Un-choose (MUST mirror the choose step exactly)
    currentPath.remove(currentPath.size() - 1);
    used[i] = false;
}
```

### Step 6 — Trace Through a Small Example

Before submitting, manually trace the first 2-3 branches of the decision tree:
- Does the base case trigger correctly?
- Does the un-choose step restore state to what it was before the choose step?
- Are duplicates handled correctly?

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| Problem signal                        | Pattern                  | Key technique                                     |
| ------------------------------------- | ------------------------ | ------------------------------------------------- |
| "All possible combinations/subsets"   | Subset backtracking      | Add at every node, `start` index                  |
| "All permutations"                    | Permutation backtracking | Loop from 0, `boolean[] used`                     |
| "Combinations summing to target"      | Combination sum          | `remaining` variable, prune if > remaining        |
| "Generate valid parentheses"          | String backtracking      | Track open/close counts as constraints            |
| "Word search in grid"                 | Grid backtracking        | `visited[][]` as choose/unchoose                  |
| "N-Queens / Sudoku"                   | Constraint backtracking  | Check row/col/box validity before placing         |
| "Palindrome partitioning"             | String backtracking      | Check if substring is palindrome before recursing |
| "Letter combinations (phone)"         | Cartesian product        | One loop per digit, no `start` index              |
| "Duplicates in input, unique results" | Sort + skip              | `if (i > start && nums[i] == nums[i-1]) continue` |
| "Restore IP addresses"                | String partitioning      | Validate segment, limit segment count             |

---

### Detailed Recognition Walkthroughs

#### Recognizing Subsets vs. Combinations

**Subsets (LC 78):** "Return ALL possible subsets" — the empty set and the full set are both valid.
- Add `currentPath` to result at **every node** before looping.
- No goal check needed (every state is valid).

**Combinations (LC 77):** "Return all combinations of exactly K elements."
- Add `currentPath` to result only at **leaves** (when `path.size() == k`).
- Use the pruning optimization: `i <= n - (k - path.size()) + 1`.

#### Recognizing Permutation Duplicates (LC 47 — Permutations II)

When input has duplicates (`[1, 1, 2]`), naive permutation gives duplicate results (`[1, 1, 2]` appears twice). Fix:
1. Sort the array: `[1, 1, 2]`
2. In the loop: `if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;`

Why `!used[i-1]`? If `nums[i-1]` was used at a **previous level**, we're at a different branch and the duplicate is valid. If `nums[i-1]` was **not used** (backtracked), then we'd produce the same result we already had — skip it.

#### Recognizing Generate Parentheses (LC 22)

When you see: *"Generate all valid combinations of N pairs of parentheses"*
1. "At each step I choose '(' or ')'."
2. Constraints: `openCount <= n` and `closeCount <= openCount`.
3. No `start` index needed — just track open/close counts.
4. Goal: `string.length() == 2 * n`.

#### Recognizing N-Queens

When you see: *"Place N queens on an N×N board so no two attack each other"*
1. Place one queen per row (reduces search space from $N^N$ to $N!$).
2. Check column conflict: `colUsed[col]`.
3. Check diagonal conflict: `diagonal1Used[row - col + n]` and `diagonal2Used[row + col]`.
4. Backtrack by removing the queen and un-marking all three.

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Missing the Deep Copy

```java
// ❌ WRONG — all results point to the same mutable list
result.add(currentPath);

// ✅ CORRECT — snapshot the current state
result.add(new ArrayList<>(currentPath));

// For 2D results (list of lists):
result.add(new ArrayList<>(currentPath)); // shallow copy of the inner list is fine
                                           // as long as elements are immutable (Integer, String)
```

### Mistake 2: Not Un-choosing After Recursion

```java
// ❌ WRONG — state is permanently modified, future branches are corrupted
path.add(nums[i]);
backtrack(result, path, nums, i + 1);
// forgot: path.remove(path.size() - 1);

// ✅ CORRECT — every choose must have a matching un-choose
path.add(nums[i]);
backtrack(result, path, nums, i + 1);
path.remove(path.size() - 1); // restore state
```

### Mistake 3: Using `path.contains()` Instead of `boolean[] used`

```java
// ❌ Slow — O(N) per call, total O(N² * N!)
if (path.contains(nums[i])) continue;

// ✅ Fast — O(1) per call, total O(N * N!)
if (used[i]) continue;
```

### Mistake 4: Wrong `start` Index for Reusable vs. Non-reusable Elements

```java
// Combination Sum: elements CAN be reused
backtrack(result, path, candidates, remaining - candidates[i], i); // ← i, not i+1

// Combinations: elements CANNOT be reused
backtrack(result, path, nums, i + 1); // ← i+1 moves past current element
```

### Mistake 5: Forgetting to Sort Before Skipping Duplicates

```java
// ❌ WRONG — duplicates may not be adjacent without sorting
for (int i = start; i < nums.length; i++) {
    if (i > start && nums[i] == nums[i - 1]) continue; // only works if sorted!
    ...
}

// ✅ CORRECT — sort first, THEN apply the duplicate skip
Arrays.sort(nums); // critical prerequisite
for (int i = start; i < nums.length; i++) {
    if (i > start && nums[i] == nums[i - 1]) continue;
    ...
}
```

### Mistake 6: Missing the Base Case or Making It Unreachable

```java
// ❌ WRONG — base case never triggers if recursion passes it by
private void backtrack(List<Integer> path, int[] nums, int start) {
    if (path.size() > nums.length) { // uses > instead of ==, triggers too late
        result.add(new ArrayList<>(path));
        return;
    }
    ...
}

// ✅ CORRECT — exact equality check
if (path.size() == nums.length) {
    result.add(new ArrayList<>(path));
    return;
}
```

---

## 7. Worked Examples

### Example 1: LeetCode 78 — Subsets

**Thinking process:**
1. "All possible subsets" including empty set → add at every node.
2. To avoid duplicates like `[1,2]` and `[2,1]` being counted separately: use `start` index.
3. No base case needed — every state is valid.

```java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums, 0);
        return result;
    }

    private void backtrack(List<List<Integer>> result, List<Integer> path,
                            int[] nums, int start) {
        result.add(new ArrayList<>(path)); // Add current state (every node is valid)

        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);                    // Choose
            backtrack(result, path, nums, i + 1); // Explore
            path.remove(path.size() - 1);         // Un-choose
        }
    }
}
```

Decision tree for `nums = [1, 2, 3]`:
```
Add []
├── Choose 1 → Add [1]
│   ├── Choose 2 → Add [1,2]
│   │   └── Choose 3 → Add [1,2,3] (no more elements)
│   └── Choose 3 → Add [1,3] (no more elements)
├── Choose 2 → Add [2]
│   └── Choose 3 → Add [2,3] (no more elements)
└── Choose 3 → Add [3] (no more elements)

Result: [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]] ✅ (8 = 2³ subsets)
```

*Time: $O(N \cdot 2^N)$. Space: $O(N)$ call stack.*

---

### Example 2: LeetCode 46 — Permutations

**Thinking process:**
1. "All permutations" — order matters, every element used exactly once.
2. Loop from 0 each time (order matters), skip if `used[i]`.
3. Base case: when `path.size() == nums.length`.

```java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums, new boolean[nums.length]);
        return result;
    }

    private void backtrack(List<List<Integer>> result, List<Integer> path,
                            int[] nums, boolean[] used) {
        if (path.size() == nums.length) {
            result.add(new ArrayList<>(path));
            return;
        }

        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;

            used[i] = true;
            path.add(nums[i]);
            backtrack(result, path, nums, used);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
```

Trace for `nums = [1, 2, 3]`, first branch only:
```
path=[], used=[F,F,F]
  i=0: used[0]=T, path=[1]
    i=0: skip (used[0]=T)
    i=1: used[1]=T, path=[1,2]
      i=0: skip, i=1: skip
      i=2: used[2]=T, path=[1,2,3] → ADD [1,2,3] ✅
      un-choose: used[2]=F, path=[1,2]
    un-choose: used[1]=F, path=[1]
    i=2: used[2]=T, path=[1,3]
      i=0: skip, i=1: used[1]=T, path=[1,3,2] → ADD [1,3,2] ✅
      ...
  un-choose: used[0]=F, path=[]
  i=1: ... (generates [2,1,3], [2,3,1])
  i=2: ... (generates [3,1,2], [3,2,1])

Total: 6 = 3! ✅
```

*Time: $O(N \cdot N!)$. Space: $O(N)$.*

---

### Example 3: LeetCode 22 — Generate Parentheses

**Thinking process:**
1. "Generate all valid parentheses" — string building problem.
2. Constraints: open count ≤ n, close count ≤ open count.
3. No `start` index needed — track `open` and `close` counts.
4. Goal: string length = `2 * n`.

```java
class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        backtrack(result, new StringBuilder(), 0, 0, n);
        return result;
    }

    private void backtrack(List<String> result, StringBuilder current,
                            int open, int close, int n) {
        if (current.length() == 2 * n) {
            result.add(current.toString());
            return;
        }

        if (open < n) {             // Can add more open brackets
            current.append('(');
            backtrack(result, current, open + 1, close, n);
            current.deleteCharAt(current.length() - 1);
        }

        if (close < open) {         // Can add close only if more opens exist
            current.append(')');
            backtrack(result, current, open, close + 1, n);
            current.deleteCharAt(current.length() - 1);
        }
    }
}
```

Decision tree for `n = 2`:
```
""
├── "("  (open=1, close=0)
│   ├── "(("  (open=2, close=0)
│   │   └── "(()"  (open=2, close=1)
│   │       └── "(())"  ✅  ADD
│   └── "()"  (open=1, close=1)
│       └── "()("  (open=2, close=1)
│           └── "()()"  ✅  ADD
```

Result: `["(())", "()()"]` ✅

*Time: $O(4^N / \sqrt N)$ (Catalan number). Space: $O(N)$.*

---

### Example 4: LeetCode 79 — Word Search

**Thinking process:**
1. "Find if word exists in grid" — explore paths in a grid.
2. Use `visited[][]` as the un-choose mechanism.
3. Try all 4 directions from each cell.
4. Prune: out of bounds, already visited, wrong character.

```java
class Solution {
    private static final int[][] DIRS = {{0,1},{0,-1},{1,0},{-1,0}};

    public boolean exist(char[][] board, String word) {
        int m = board.length, n = board[0].length;
        boolean[][] visited = new boolean[m][n];

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (backtrack(board, visited, i, j, word, 0)) return true;
            }
        }
        return false;
    }

    private boolean backtrack(char[][] board, boolean[][] visited,
                               int row, int col, String word, int index) {
        if (index == word.length()) return true; // all characters matched

        if (row < 0 || row >= board.length || col < 0 || col >= board[0].length
                || visited[row][col]
                || board[row][col] != word.charAt(index)) {
            return false;
        }

        visited[row][col] = true; // Choose

        for (int[] dir : DIRS) {
            if (backtrack(board, visited, row + dir[0], col + dir[1], word, index + 1)) {
                visited[row][col] = false;
                return true;
            }
        }

        visited[row][col] = false; // Un-choose
        return false;
    }
}
```

*Time: $O(M \cdot N \cdot 4^L)$ where L = word length. Space: $O(L)$ call stack.*

---

### Example 5: LeetCode 51 — N-Queens *(Classic Constraint Satisfaction)*

**Thinking process:**
1. Place one queen per row — reduces branching factor.
2. Three constraints: column conflict, diagonal conflict, anti-diagonal conflict.
3. Track conflicts with `boolean[]` sets for $O(1)$ checks.
4. Collect board states when all N queens are placed.

```java
class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> result = new ArrayList<>();
        boolean[] cols = new boolean[n];
        boolean[] diag1 = new boolean[2 * n]; // row - col + n
        boolean[] diag2 = new boolean[2 * n]; // row + col
        char[][] board = new char[n][n];
        for (char[] row : board) Arrays.fill(row, '.');

        backtrack(result, board, cols, diag1, diag2, 0, n);
        return result;
    }

    private void backtrack(List<List<String>> result, char[][] board,
                            boolean[] cols, boolean[] diag1, boolean[] diag2,
                            int row, int n) {
        if (row == n) {
            List<String> solution = new ArrayList<>();
            for (char[] r : board) solution.add(new String(r));
            result.add(solution);
            return;
        }

        for (int col = 0; col < n; col++) {
            int d1 = row - col + n, d2 = row + col;
            if (cols[col] || diag1[d1] || diag2[d2]) continue; // Prune

            // Choose
            board[row][col] = 'Q';
            cols[col] = diag1[d1] = diag2[d2] = true;

            backtrack(result, board, cols, diag1, diag2, row + 1, n);

            // Un-choose
            board[row][col] = '.';
            cols[col] = diag1[d1] = diag2[d2] = false;
        }
    }
}
```

*Time: $O(N!)$ with heavy pruning in practice. Space: $O(N)$.*

---

## 8. Decision Tree: Which Backtracking Template?

```
Do I need to enumerate something?
└── YES → Backtracking

Does order matter in the result?
├── YES → Permutation template
│         ├── No duplicates in input → boolean[] used
│         └── Duplicates in input    → Sort + (i > 0 && nums[i] == nums[i-1] && !used[i-1])
└── NO  → Does it need a fixed size?
           ├── YES → Combination template (add only at leaves, start index)
           └── NO  → Subset template (add at every node, start index)

Is there a sum constraint?
└── YES → Track remaining budget, prune if candidate > remaining
          └── Can elements be reused? → YES: pass i  |  NO: pass i+1

Is it a string?
└── YES → StringBuilder template (append/deleteCharAt)
          └── Track open/close counts or other string-specific state

Is it a grid?
└── YES → Grid backtracking (visited[][], 4-direction loop)

Is it a constraint satisfaction (Sudoku, N-Queens)?
└── YES → One choice per row/constraint, boolean[] for O(1) conflict check
```

---

## 9. Complexity Cheat Sheet

| Problem Type              | Time                                          | Space             |
| ------------------------- | --------------------------------------------- | ----------------- |
| Subsets                   | $O(N \cdot 2^N)$                              | $O(N)$ call stack |
| Combinations (N choose K) | $O(K * C(N, K))$                               | $O(K)$ call stack |
| Permutations              | $O(N \cdot N!)$                               | $O(N)$ call stack |
| Combination Sum           | $O(N^(T/M))$ where T=target, M=min candidate  | $O(T/M)$          |
| Generate Parentheses      | $O(4^N / \sqrt N)$ (Catalan)                    | $O(N)$            |
| Word Search               | $O(M \cdot N \cdot 4^L)$                      | $O(L)$            |
| N-Queens                  | $O(N!)$ worst case, much less with pruning    | $O(N)$            |
| Sudoku Solver             | $O(9^81)$ worst case, typically much faster    | $O(81)$           |

---

## 10. 7-Day Practice Plan (21 Problems)

For each problem, follow this ritual:
1. Classify: Subset, Combination, Permutation, or Constraint Satisfaction?
2. Draw 2-3 branches of the decision tree on paper.
3. Write the signature with only the parameters you need.
4. Write the base case first.
5. Write the loop with Choose → Explore → Un-choose.
6. Trace through your code manually for a small input.

**Day 1: Easy Recursion Warm-Up**
1. [Fibonacci Number (LC 509)](https://leetcode.com/problems/fibonacci-number/) — Understand delegation + memoization intro
2. [Reverse String (LC 344)](https://leetcode.com/problems/reverse-string/) — Recursive two-pointer
3. [Merge Two Sorted Lists (LC 21)](https://leetcode.com/problems/merge-two-sorted-lists/) — Recursive vs iterative comparison

**Day 2: Subsets & Combinations**
4. [Subsets (LC 78)](https://leetcode.com/problems/subsets/) — Add at every node
5. [Subsets II (LC 90)](https://leetcode.com/problems/subsets-ii/) — Sort + skip duplicates
6. [Combinations (LC 77)](https://leetcode.com/problems/combinations/) — Add only at leaves

**Day 3: Sum-Based Problems**
7. [Combination Sum (LC 39)](https://leetcode.com/problems/combination-sum/) — Reuse allowed, prune by remaining
8. [Combination Sum II (LC 40)](https://leetcode.com/problems/combination-sum-ii/) — No reuse, handle duplicates
9. [Combination Sum III (LC 216)](https://leetcode.com/problems/combination-sum-iii/) — Fixed size + fixed sum

**Day 4: Permutations**
10. [Permutations (LC 46)](https://leetcode.com/problems/permutations/) — `boolean[] used`
11. [Permutations II (LC 47)](https://leetcode.com/problems/permutations-ii/) ⭐ — Sort + `!used[i-1]` trick
12. [Letter Case Permutation (LC 784)](https://leetcode.com/problems/letter-case-permutation/) — Two branches per char

**Day 5: String Backtracking**
13. [Letter Combinations of a Phone Number (LC 17)](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) — Cartesian product of digit mappings
14. [Generate Parentheses (LC 22)](https://leetcode.com/problems/generate-parentheses/) ⭐ — Open/close count constraints
15. [Partition Palindrome (LC 131)](https://leetcode.com/problems/palindrome-partitioning/) — Check palindrome before recursing

**Day 6: Grid Backtracking (Advanced)**
16. [Word Search (LC 79)](https://leetcode.com/problems/word-search/) — `visited[][]` as choose/unchoose
17. [Number of Islands (LC 200)](https://leetcode.com/problems/number-of-islands/) — DFS as backtracking on grid
18. [Flood Fill (LC 733)](https://leetcode.com/problems/flood-fill/) — Grid DFS with state change

**Day 7: The Hard Classics**
19. [N-Queens (LC 51)](https://leetcode.com/problems/n-queens/) ⭐ — Column + diagonal constraint arrays
20. [Sudoku Solver (LC 37)](https://leetcode.com/problems/sudoku-solver/) ⭐ — Row/col/box tracking
21. [Restore IP Addresses (LC 93)](https://leetcode.com/problems/restore-ip-addresses/) — Segment validation + count constraint

---

## 11. Mock Interview Module

### Problem: The Password Cracker (Restricted Combinations)

**Context:** You are building a security testing tool. A system allows passwords consisting of exactly $N$ digits (0-9). To prevent simple patterns, the rule is: **no two adjacent digits can be the same.**

**Question:** Write `public List<String> generatePasswords(int n)` that returns all valid passwords of length $n$.

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                          | Interviewer answers   | Why it matters                     |
| --------------------------------------- | --------------------- | ---------------------------------- |
| "Are leading zeros allowed?"            | Yes (`0123` is valid) | Use String, not integer parsing    |
| "What is the expected N?"               | Up to 4 or 5          | Exponential output, but manageable |
| "Should the list be sorted?"            | No preference         | Simplifies implementation          |
| "Is the empty string a valid password?" | No, N ≥ 1             | Base case definition               |

---

#### Step 2: Brute Force

Generate all $10^N$ strings, filter invalid ones:
- For N=4: 10,000 candidates → filter → $9 \times 10^(N-1)$ valid results.
- Wasteful: you generate strings you immediately discard.

---

#### Step 3: Optimized Solution (Backtracking)

Build digit-by-digit, skip invalid choices early:

```java
public List<String> generatePasswords(int n) {
    List<String> result = new ArrayList<>();
    if (n <= 0) return result;
    backtrack(result, new StringBuilder(), n);
    return result;
}

private void backtrack(List<String> result, StringBuilder current, int n) {
    if (current.length() == n) {
        result.add(current.toString()); // snapshot
        return;
    }

    for (int digit = 0; digit <= 9; digit++) {
        // Constraint: no two adjacent digits the same
        if (current.length() > 0 &&
                current.charAt(current.length() - 1) - '0' == digit) {
            continue; // pruning: skip same digit as previous
        }

        current.append(digit);                              // Choose
        backtrack(result, current, n);                      // Explore
        current.deleteCharAt(current.length() - 1);        // Un-choose
    }
}
```

**Complexity analysis:**
- First digit: 10 choices.
- Each subsequent digit: 9 choices (any digit except the previous one).
- Total valid passwords: $10 \times 9^(N-1)$.
- Time: $O(N \times 10 \times 9^(N-1))$ — generating + copying each string of length N.

---

#### Step 4: Follow-up Questions

**Q1:** "What if the constraint is: no digit can appear more than twice in the entire password?"

*Expected answer:*
"I'd track a frequency count `int[] freq = new int[10]` alongside the StringBuilder.
- Before choosing digit `d`: check `freq[d] < 2`.
- Choose: `freq[d]++`.
- Un-choose: `freq[d]--`.
This adds $O(10) = O(1)$ overhead per call and no change to the overall approach."

```java
private void backtrack(List<String> result, StringBuilder current, int n, int[] freq) {
    if (current.length() == n) { result.add(current.toString()); return; }

    for (int digit = 0; digit <= 9; digit++) {
        if (freq[digit] >= 2) continue;              // new constraint

        current.append(digit);
        freq[digit]++;                               // Choose
        backtrack(result, current, n, freq);
        current.deleteCharAt(current.length() - 1);
        freq[digit]--;                               // Un-choose
    }
}
```

**Q2:** "How would you count the valid passwords without generating them all?"

*Expected answer:*
"Use combinatorics. For length N with the 'no adjacent equal' constraint:
- $f(N) = 10 \times 9^(N-1)$

For more complex constraints (like the frequency cap), use **dynamic programming** instead of backtracking:
- `dp[i][last][freq_state]` = number of valid passwords of length `i` ending in digit `last` with frequency state `freq_state`.
- This avoids exponential blowup when you only need the count, not the actual passwords."

**Q3:** "What if N is very large (N = 100)? The result list would be enormous. How do you handle this?"

*Expected answer:*
"If the output is too large to return, the API should change to a streaming or iterator pattern:
- Return an `Iterable<String>` that lazily generates the next password on demand.
- Or write passwords to a file/stream as they are generated.
- Or just return the count instead.
This is a common production design question: *don't materialize results you can stream*."

---

## 12. Quick Reference: Backtracking Java Idioms

```java
// ── DEEP COPY (CRITICAL) ──────────────────────────────────────────────────
result.add(new ArrayList<>(path));        // copy List<Integer>
result.add(current.toString());           // copy StringBuilder → String
result.add(Arrays.copyOf(arr, arr.length)); // copy int[]
for (char[] row : board) solution.add(new String(row)); // copy char[][] grid

// ── REMOVE LAST ELEMENT ───────────────────────────────────────────────────
path.remove(path.size() - 1);           // List<Integer> — removes by index
sb.deleteCharAt(sb.length() - 1);       // StringBuilder
used[i] = false;                         // boolean[]

// ── CHOOSE/UN-CHOOSE PAIR IDIOMS ──────────────────────────────────────────
// List:
path.add(val);
  recurse();
path.remove(path.size() - 1);

// StringBuilder:
sb.append(c);
  recurse();
sb.deleteCharAt(sb.length() - 1);

// Grid visited:
visited[r][c] = true;
  recurse();
visited[r][c] = false;

// N-Queens:
board[row][col] = 'Q'; cols[col] = diag1[d1] = diag2[d2] = true;
  recurse(row + 1);
board[row][col] = '.'; cols[col] = diag1[d1] = diag2[d2] = false;

// ── DUPLICATE SKIPPING ────────────────────────────────────────────────────
Arrays.sort(nums); // MUST sort first!
for (int i = start; i < nums.length; i++) {
    if (i > start && nums[i] == nums[i - 1]) continue; // skip at same level

// ── PERMUTATION DUPLICATE SKIPPING ───────────────────────────────────────
Arrays.sort(nums);
for (int i = 0; i < nums.length; i++) {
    if (used[i]) continue;
    if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue; // key condition
    ...

// ── PRUNING SHORTCUTS ─────────────────────────────────────────────────────
if (candidates[i] > remaining) break;         // sorted array + sum constraint
if (n - i + 1 < k - path.size()) break;       // not enough elements left for combination

// ── GRID BOUNDS CHECK ─────────────────────────────────────────────────────
if (r < 0 || r >= m || c < 0 || c >= n) return;
if (visited[r][c] || board[r][c] != target) return;

// ── N-QUEENS DIAGONAL INDICES ─────────────────────────────────────────────
int d1 = row - col + n;  // top-left to bottom-right diagonal
int d2 = row + col;      // top-right to bottom-left diagonal
```

---

## 13. Visualizing the State Space

One of the hardest parts of backtracking is keeping track of the "path" and seeing how the algorithm decides to turn back. Use these two complementary views when reasoning about a backtracking problem:

**View 1 — The Decision Tree (which choices were made):**
```
                       []
            ┌──────────┼──────────┐
           [1]        [2]        [3]
          ┌─┴─┐      ┌─┴─┐      ┌─┴─┐
        [1,2][1,3] [2,1][2,3] [3,1][3,2]
          │    │    │    │    │    │
       [1,2,3][1,3,2][2,1,3][2,3,1][3,1,2][3,2,1]
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