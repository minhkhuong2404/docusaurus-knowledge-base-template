---
id: array
title: Array
sidebar_position: 1
description: Master array manipulation patterns used in coding interviews
---

# 📦 Array

## Concept

An **array** is a fixed-size, contiguous block of memory that stores elements of the same type. In Java, arrays are zero-indexed. `ArrayList` is the dynamic counterpart and is used when the size is unknown upfront.

Arrays are the foundation of almost every other data structure and algorithm pattern. Most interview problems that involve "traversal", "searching", or "in-place modification" are array problems at heart.

---

## When to Use

- The input is a list of integers, characters, or objects
- You need O(1) random access by index
- The problem asks for in-place manipulation
- You're building up patterns like two-pointers, sliding window, or prefix sum (all start from array basics)

---

## Key Operations & Complexity

| Operation | Array | ArrayList |
|---|---|---|
| Access by index | O(1) | O(1) |
| Search (unsorted) | O(n) | O(n) |
| Search (sorted) | O(log n) | O(log n) |
| Insert at end | N/A | O(1) amortized |
| Insert at index | N/A | O(n) |
| Delete | N/A | O(n) |

---

## Java Template

```java
// Declare and initialize
int[] arr = new int[5];
int[] arr2 = {1, 2, 3, 4, 5};

// Iterate
for (int i = 0; i < arr.length; i++) { ... }
for (int num : arr) { ... }            // enhanced for-loop

// 2D array
int[][] matrix = new int[3][4];
for (int[] row : matrix) Arrays.fill(row, 0);

// Sort
Arrays.sort(arr);                            // ascending
Arrays.sort(arr, 0, arr.length);             // range sort

// Copy
int[] copy = Arrays.copyOf(arr, arr.length);
int[] rangeCopy = Arrays.copyOfRange(arr, 1, 4);

// Convert to List
List<Integer> list = new ArrayList<>();
for (int n : arr) list.add(n);
```

---

## Common Patterns

### 1. Two-Pass Technique

Calculate something on the first pass, use it on the second.

```java
// Example: Product of array except self
public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];

    // Left pass: result[i] = product of all elements left of i
    result[0] = 1;
    for (int i = 1; i < n; i++) {
        result[i] = result[i - 1] * nums[i - 1];
    }

    // Right pass: multiply by product of all elements right of i
    int right = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] *= right;
        right *= nums[i];
    }
    return result;
}
```

### 2. In-Place Modification (Swap)

```java
// Reverse an array in-place
public void reverse(int[] nums) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int temp = nums[left];
        nums[left++] = nums[right];
        nums[right--] = temp;
    }
}
```

### 3. Counting with HashMap

```java
// Check if two arrays are anagrams
public boolean isAnagram(int[] a, int[] b) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int n : a) count.merge(n, 1, Integer::sum);
    for (int n : b) {
        if (!count.containsKey(n)) return false;
        count.merge(n, -1, Integer::sum);
        if (count.get(n) == 0) count.remove(n);
    }
    return count.isEmpty();
}
```

---

## Worked Example: Find Duplicate Number

**Problem**: Given an array of n+1 integers where each integer is in [1, n], find the duplicate.

**Approach**: Use Floyd's cycle detection (or mark visited using negative sign).

```java
public int findDuplicate(int[] nums) {
    // Mark visited: negate nums[nums[i]]
    // If already negative, we've seen this index → it's the duplicate
    for (int i = 0; i < nums.length; i++) {
        int idx = Math.abs(nums[i]);
        if (nums[idx] < 0) return idx;
        nums[idx] = -nums[idx];
    }
    return -1; // should never reach here
}
```

**Trace** for `[1, 3, 4, 2, 2]`:
```
i=0: idx=1, nums[1]=3 → negate → [-,−3,4,2,2]
i=1: idx=3, nums[3]=2 → negate → [-,−3,4,−2,2]
i=2: idx=4, nums[4]=2 → negate → [-,−3,4,−2,−2]
i=3: idx=2, nums[2]=4 → negate → [-,−3,−4,−2,−2]
i=4: idx=2, nums[2]=-4 → NEGATIVE! Return 2 ✓
```

**Time**: O(n) | **Space**: O(1)

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Idea |
|---|---|---|
| 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | HashMap complement lookup |
| 26 | [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) | Two pointers, in-place |
| 27 | [Remove Element](https://leetcode.com/problems/remove-element/) | Overwrite with valid elements |
| 121 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | Track running min |
| 217 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | HashSet |
| 238 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | Left/right pass |
| 283 | [Move Zeroes](https://leetcode.com/problems/move-zeroes/) | Two pointers |
| 448 | [Find All Numbers Disappeared in an Array](https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/) | Mark visited with negation |

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 15 | [3Sum](https://leetcode.com/problems/3sum/) | Sort + two pointers |
| 31 | [Next Permutation](https://leetcode.com/problems/next-permutation/) | Find dip, swap, reverse |
| 48 | [Rotate Image](https://leetcode.com/problems/rotate-image/) | Transpose + reverse |
| 54 | [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/) | Layer peeling |
| 73 | [Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/) | Use first row/col as flags |
| 189 | [Rotate Array](https://leetcode.com/problems/rotate-array/) | Reverse 3 times |
| 287 | [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) | Floyd's / negation |
| 442 | [Find All Duplicates in an Array](https://leetcode.com/problems/find-all-duplicates-in-an-array/) | Negation trick |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 41 | [First Missing Positive](https://leetcode.com/problems/first-missing-positive/) | Cyclic sort / swap to correct index |
| 84 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | Monotonic stack |
| 85 | [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/) | Build histogram row by row |
