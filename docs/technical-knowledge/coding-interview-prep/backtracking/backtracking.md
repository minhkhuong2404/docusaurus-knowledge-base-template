---
id: backtracking
title: Backtracking
sidebar_position: 14
description: Exhaustive search with pruning — permutations, combinations, and constraint satisfaction
---

# 🔙 Backtracking

## Concept

**Backtracking** is a refined brute-force: explore all possibilities, but **prune** branches that can't lead to a valid solution. You build candidates incrementally and abandon ("backtrack") as soon as you detect the current path can't succeed.

Think of it like navigating a maze: go forward, and if you hit a dead end, back up and try a different turn.

---

## When to Use

- Generate **all permutations, combinations, or subsets**
- Solve **constraint satisfaction** problems (N-Queens, Sudoku)
- Find **all paths** in a graph
- Problems with "find all valid..." phrasing
- Decision tree where you make choices and undo them

---

## Universal Backtracking Template

```java
void backtrack(
    List<List<Integer>> result,
    List<Integer> current,     // current path/choice
    int[] candidates,
    int start                  // starting index (for combinations)
) {
    // 1. Base case: is current a complete solution?
    if (isSolution(current)) {
        result.add(new ArrayList<>(current)); // COPY — don't add the reference
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        // 2. Pruning: skip invalid choices early
        if (!isValid(current, candidates[i])) continue;

        // 3. Make choice
        current.add(candidates[i]);

        // 4. Recurse
        backtrack(result, current, candidates, i + 1); // i+1 for combos, i for reuse

        // 5. Undo choice (backtrack)
        current.remove(current.size() - 1);
    }
}
```

---

## Pattern 1: Subsets

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> curr, int[] nums, int start) {
    result.add(new ArrayList<>(curr)); // add at every node (not just leaves)

    for (int i = start; i < nums.length; i++) {
        curr.add(nums[i]);
        backtrack(result, curr, nums, i + 1); // i+1: don't reuse same element
        curr.remove(curr.size() - 1);
    }
}
```

**Decision tree** for `[1,2,3]`:
```
[]
├── [1]
│   ├── [1,2]
│   │   └── [1,2,3]
│   └── [1,3]
├── [2]
│   └── [2,3]
└── [3]
```

---

## Pattern 2: Permutations

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums, new boolean[nums.length]);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> curr, int[] nums, boolean[] used) {
    if (curr.size() == nums.length) {
        result.add(new ArrayList<>(curr));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;

        used[i] = true;
        curr.add(nums[i]);
        backtrack(result, curr, nums, used);
        curr.remove(curr.size() - 1);
        used[i] = false;
    }
}
```

---

## Pattern 3: Combinations with Duplicates

When the input has duplicates and you want **unique** combinations:

```java
public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    Arrays.sort(candidates); // MUST sort first
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), candidates, target, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> curr,
                        int[] candidates, int remaining, int start) {
    if (remaining == 0) {
        result.add(new ArrayList<>(curr));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remaining) break; // pruning: sorted, no point continuing

        // Skip duplicates at the same recursion level (not within a branch)
        if (i > start && candidates[i] == candidates[i - 1]) continue;

        curr.add(candidates[i]);
        backtrack(result, curr, candidates, remaining - candidates[i], i + 1);
        curr.remove(curr.size() - 1);
    }
}
```

---

## Worked Example: N-Queens

Place N queens on an N×N board so no two attack each other.

```java
public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n]; // queens[row] = column of queen in that row
    Arrays.fill(queens, -1);

    Set<Integer> cols = new HashSet<>();
    Set<Integer> diag1 = new HashSet<>(); // row - col (top-left to bottom-right)
    Set<Integer> diag2 = new HashSet<>(); // row + col (top-right to bottom-left)

    backtrack(result, queens, n, 0, cols, diag1, diag2);
    return result;
}

private void backtrack(List<List<String>> result, int[] queens, int n, int row,
                        Set<Integer> cols, Set<Integer> d1, Set<Integer> d2) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }

    for (int col = 0; col < n; col++) {
        if (cols.contains(col) || d1.contains(row - col) || d2.contains(row + col))
            continue; // this position is attacked

        queens[row] = col;
        cols.add(col); d1.add(row - col); d2.add(row + col);

        backtrack(result, queens, n, row + 1, cols, d1, d2);

        queens[row] = -1;
        cols.remove(col); d1.remove(row - col); d2.remove(row + col);
    }
}

private List<String> buildBoard(int[] queens, int n) {
    List<String> board = new ArrayList<>();
    for (int row = 0; row < n; row++) {
        char[] line = new char[n];
        Arrays.fill(line, '.');
        line[queens[row]] = 'Q';
        board.add(new String(line));
    }
    return board;
}
```

---

## Complexity Guide

| Problem | Time | Space |
|---|---|---|
| Subsets | O(n · 2ⁿ) | O(n) |
| Permutations | O(n · n!) | O(n) |
| Combinations (choose k from n) | O(k · C(n,k)) | O(k) |
| N-Queens | O(n!) | O(n) |

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Pattern |
|---|---|---|
| 401 | [Binary Watch](https://leetcode.com/problems/binary-watch/) | Enumerate subsets |

### 🟡 Medium
| # | Problem | Pattern |
|---|---|---|
| 17 | [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) | Combinations |
| 22 | [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/) | Constrained build |
| 39 | [Combination Sum](https://leetcode.com/problems/combination-sum/) | Unlimited reuse |
| 40 | [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/) | Deduplicate |
| 46 | [Permutations](https://leetcode.com/problems/permutations/) | Classic perms |
| 47 | [Permutations II](https://leetcode.com/problems/permutations-ii/) | Dedup perms |
| 78 | [Subsets](https://leetcode.com/problems/subsets/) | Classic subsets |
| 79 | [Word Search](https://leetcode.com/problems/word-search/) | Grid backtrack |
| 90 | [Subsets II](https://leetcode.com/problems/subsets-ii/) | Dedup subsets |
| 131 | [Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/) | Partition + palindrome |

### 🔴 Hard
| # | Problem | Pattern |
|---|---|---|
| 37 | [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/) | Constraint satisfaction |
| 51 | [N-Queens](https://leetcode.com/problems/n-queens/) | Classic N-Queens |
| 52 | [N-Queens II](https://leetcode.com/problems/n-queens-ii/) | Count solutions |
