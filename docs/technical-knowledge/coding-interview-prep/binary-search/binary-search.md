---
id: binary-search
title: Binary Search
sidebar_position: 5
description: From classic search to advanced binary search on answer space
---

# 🔍 Binary Search

## Concept

**Binary Search** repeatedly halves the search space by comparing the target to the middle element. It achieves O(log n) time on sorted data.

Beyond searching for a value, binary search can be applied to **answer spaces** — searching for a number that satisfies a condition (e.g., "minimum capacity", "k-th smallest").

---

## When to Use

- Array is **sorted** (or rotated sorted)
- The problem asks for "minimum X such that condition holds" or "maximum X"
- Searching in an implicit sorted space (rope cutting, ship capacity, etc.)
- Finding boundaries (first occurrence, last occurrence)

---

## Java Template

### Classic: Find exact target
```java
public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2; // avoids overflow vs (left+right)/2
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1; // not found
}
```

### Find left boundary (first occurrence / leftmost valid)
```java
public int leftBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {              // Note: right = length (exclusive)
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) left = mid + 1;
        else right = mid;               // do NOT do mid-1; we keep narrowing right
    }
    return left; // first index where nums[index] >= target
}
```

### Find right boundary (last occurrence)
```java
public int rightBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) left = mid + 1;
        else right = mid;
    }
    return left - 1; // last index where nums[index] <= target
}
```

### Binary Search on Answer Space
```java
// Template: find MINIMUM value x such that feasible(x) is true
public int binarySearchAnswer(int lo, int hi) {
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (feasible(mid)) hi = mid;       // mid might be the answer, keep it
        else lo = mid + 1;
    }
    return lo;
}

// feasible() implements the monotonic condition check
```

---

## Worked Example 1: Search in Rotated Sorted Array

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;

        // Left half is sorted
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else { // Right half is sorted
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}
```

---

## Worked Example 2: Minimum Capacity to Ship Packages in D Days

**Problem**: Given weights[], find minimum ship capacity to ship all packages within `days` days.

```java
public int shipWithinDays(int[] weights, int days) {
    // Minimum capacity = max single weight (must fit largest package)
    // Maximum capacity = total sum (ship everything in 1 day)
    int lo = Arrays.stream(weights).max().getAsInt();
    int hi = Arrays.stream(weights).sum();

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canShip(weights, days, mid)) hi = mid; // mid works, try smaller
        else lo = mid + 1;
    }
    return lo;
}

private boolean canShip(int[] weights, int days, int capacity) {
    int daysNeeded = 1, load = 0;
    for (int w : weights) {
        if (load + w > capacity) {
            daysNeeded++;
            load = 0;
        }
        load += w;
    }
    return daysNeeded <= days;
}
```

**Time**: O(n log(sum)) | **Space**: O(1)

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Variant |
|---|---|---|
| 35 | [Search Insert Position](https://leetcode.com/problems/search-insert-position/) | Left bound |
| 69 | [Sqrt(x)](https://leetcode.com/problems/sqrtx/) | Answer space |
| 278 | [First Bad Version](https://leetcode.com/problems/first-bad-version/) | Left bound |
| 374 | [Guess Number Higher or Lower](https://leetcode.com/problems/guess-number-higher-or-lower/) | Classic |
| 704 | [Binary Search](https://leetcode.com/problems/binary-search/) | Classic |

### 🟡 Medium
| # | Problem | Variant |
|---|---|---|
| 33 | [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | Rotated |
| 34 | [Find First and Last Position](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) | Left + Right bound |
| 153 | [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) | Rotated |
| 162 | [Find Peak Element](https://leetcode.com/problems/find-peak-element/) | Slope climbing |
| 540 | [Single Element in Sorted Array](https://leetcode.com/problems/single-element-in-a-sorted-array/) | Parity check |
| 875 | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | Answer space |
| 1011 | [Capacity To Ship Packages](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) | Answer space |

### 🔴 Hard
| # | Problem | Variant |
|---|---|---|
| 4 | [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) | Partition |
| 410 | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) | Answer space |
| 668 | [Kth Smallest Number in Multiplication Table](https://leetcode.com/problems/kth-smallest-number-in-multiplication-table/) | Answer space |
