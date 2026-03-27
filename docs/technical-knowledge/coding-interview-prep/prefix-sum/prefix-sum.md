---
id: prefix-sum
title: Prefix Sum
sidebar_position: 4
description: Efficiently answer range sum queries using prefix sum arrays
---

# ➕ Prefix Sum

## Concept

A **prefix sum** (also called cumulative sum) array transforms the original array so that `prefix[i]` stores the sum of all elements from index `0` to `i`. 

This allows any **range sum query** `[l, r]` to be answered in **O(1)** after O(n) preprocessing:

```
rangeSum(l, r) = prefix[r] - prefix[l - 1]
```

The same idea extends to **2D matrices** for rectangle sums, and to **hashmaps** for subarray problems.

---

## When to Use

- Query sum of many subarrays — O(1) per query after O(n) build
- Check if a subarray sum equals `k`
- Count subarrays with a specific sum (use prefix sum + HashMap)
- "Balance point" or pivot index problems
- 2D rectangle sum queries

---

## Java Template

```java
// 1D Prefix Sum Build
int[] prefix = new int[n + 1]; // 1-indexed for convenience
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}

// Range sum [l, r] (0-indexed original)
int rangeSum = prefix[r + 1] - prefix[l];
```

---

## Worked Example 1: Subarray Sum Equals K

**Problem**: Count the number of subarrays that sum to exactly `k`.

**Key Insight**: If `prefix[j] - prefix[i] = k`, then the subarray `[i+1, j]` sums to k.
We need to count pairs where `prefix[j] - k` has been seen before.

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1); // empty prefix — handles subarray starting at index 0

    int sum = 0, count = 0;
    for (int num : nums) {
        sum += num;
        // How many times has (sum - k) appeared as a prefix sum?
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}
```

**Trace** for `nums=[1, 1, 1], k=2`:
```
prefixCount = {0:1}
i=0: sum=1, look for (1-2)=-1 → 0, count=0, map={0:1, 1:1}
i=1: sum=2, look for (2-2)= 0 → 1, count=1, map={0:1, 1:1, 2:1}
i=2: sum=3, look for (3-2)= 1 → 1, count=2, map={0:1, 1:1, 2:1, 3:1}

Answer: 2 (subarrays [0,1] and [1,2])
```

---

## Worked Example 2: 2D Range Sum Query

```java
class NumMatrix {
    private int[][] prefix;

    public NumMatrix(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        prefix = new int[m + 1][n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                prefix[i][j] = matrix[i-1][j-1]
                    + prefix[i-1][j]
                    + prefix[i][j-1]
                    - prefix[i-1][j-1]; // subtract overlap
            }
        }
    }

    // Query sum in rectangle (r1,c1) to (r2,c2) — 0-indexed
    public int sumRegion(int r1, int c1, int r2, int c2) {
        return prefix[r2+1][c2+1]
             - prefix[r1][c2+1]
             - prefix[r2+1][c1]
             + prefix[r1][c1]; // add back double-subtracted corner
    }
}
```

**Visual explanation** (why we add back the corner):
```
total = full rectangle
      - top strip (above r1)
      - left strip (left of c1)
      + top-left corner (subtracted twice)
```

---

## Worked Example 3: Pivot Index

**Problem**: Find the index where the sum to its left equals the sum to its right.

```java
public int pivotIndex(int[] nums) {
    int total = 0;
    for (int n : nums) total += n;

    int leftSum = 0;
    for (int i = 0; i < nums.length; i++) {
        // rightSum = total - leftSum - nums[i]
        if (leftSum == total - leftSum - nums[i]) return i;
        leftSum += nums[i];
    }
    return -1;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Idea |
|---|---|---|
| 303 | [Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/) | Classic 1D prefix |
| 724 | [Find Pivot Index](https://leetcode.com/problems/find-pivot-index/) | Total - leftSum |
| 1480 | [Running Sum of 1d Array](https://leetcode.com/problems/running-sum-of-1d-array/) | Build prefix in-place |
| 1732 | [Find the Highest Altitude](https://leetcode.com/problems/find-the-highest-altitude/) | Running max of prefix |

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 304 | [Range Sum Query 2D - Immutable](https://leetcode.com/problems/range-sum-query-2d-immutable/) | 2D prefix sum |
| 525 | [Contiguous Array](https://leetcode.com/problems/contiguous-array/) | Prefix + HashMap (0→-1) |
| 560 | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | Prefix + HashMap |
| 974 | [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) | Prefix mod + HashMap |
| 1248 | [Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/) | Prefix (odd count) |
| 1371 | [Find the Longest Substring Containing Vowels in Even Counts](https://leetcode.com/problems/find-the-longest-substring-containing-vowels-in-even-counts/) | Bitmask prefix |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 327 | [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/) | Prefix + merge sort |
| 1074 | [Number of Submatrices That Sum to Target](https://leetcode.com/problems/number-of-submatrices-that-sum-to-target/) | 2D prefix + fix 2 rows |
