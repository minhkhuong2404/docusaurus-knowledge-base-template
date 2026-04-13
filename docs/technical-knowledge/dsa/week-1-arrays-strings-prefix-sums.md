---
id: week-1-arrays-strings-prefix-sums
title: "Week 1: Arrays, Strings & Prefix Sums"
description: Master contiguous memory structures in Java, including static arrays and string immutability, and optimize range queries using the Prefix Sum pattern.
tags: [dsa, java, arrays, strings, prefix-sums, algorithms, week-1]
sidebar_position: 1
---

# Week 1: Arrays, Strings & Prefix Sums

## 1. Overview
Welcome to Week 1! This week lays the foundation for everything to come. We are focusing on contiguous memory structures: **Arrays** and **Strings**. You will learn how data is stored in memory, how to iterate efficiently, and how to optimize repeated range calculations using **Prefix Sums**. Mastering these basics is critical, as almost all advanced algorithms (like dynamic programming and graph traversals) rely heavily on arrays.

**Goals for this week:**
- Understand memory allocation for static vs. dynamic arrays (`int[]` vs `ArrayList`).
- Master String immutability in Java and when to use `StringBuilder`.
- Learn the Prefix Sum pattern to reduce $O(N)$ range queries to $O(1)$.

---

## 2. Theory & Fundamentals

### Arrays
An array is a collection of items stored at contiguous memory locations. 
- **Time Complexity:** - Read/Write: $O(1)$ (if index is known)
  - Insert/Delete at end: $O(1)$
  - Insert/Delete in middle: $O(N)$ (requires shifting elements)
- **Java Specifics:** Standard arrays like `int[]` have a fixed size. `ArrayList` resizes dynamically (usually doubling in size) when it hits capacity, which takes $O(N)$ time occasionally but averages to $O(1)$ amortized time. Cache locality makes raw `int[]` significantly faster than `ArrayList<Integer>` for heavy computations.

### Strings
A string is essentially an array of characters.
- **Java Specifics:** Strings in Java are **immutable**. Concatenating strings in a loop (e.g., `str += "a"`) creates a brand new string every time, leading to $O(N^2)$ time complexity. Always use `StringBuilder` for heavy string manipulations.

### Prefix Sums
A prefix sum array is a secondary array that stores the cumulative sum of the elements of a given array up to every index.
- If `arr = [1, 2, 3, 4]`, then `prefix = [1, 3, 6, 10]`.
- **Why use it?** If you need the sum of elements between index `L` and `R`, instead of iterating from `L` to `R` in $O(N)$ time, you can do `prefix[R] - prefix[L-1]` in $O(1)$ time.

---

## 3. Code Templates (Java)

### Template 1: Building a Prefix Sum Array
```java
public int[] buildPrefixSum(int[] nums) {
    if (nums == null || nums.length == 0) return new int[0];
    
    int[] prefix = new int[nums.length];
    prefix[0] = nums[0];
    
    for (int i = 1; i < nums.length; i++) {
        prefix[i] = prefix[i - 1] + nums[i];
    }
    
    return prefix;
}
```

### Template 2: Range Sum Query using Prefix Sum
```java
// Assuming prefix array is 1-indexed to handle L=0 gracefully
public int rangeSum(int[] prefix, int left, int right) {
    // prefix is built as: prefix[i+1] = prefix[i] + nums[i]
    return prefix[right + 1] - prefix[left];
}
```

---

## 4. Pattern Recognition Guide

**How to spot Array/String & Prefix Sum problems in the wild:**
1. **"Sum of subarray" or "Query a range":** If the problem asks you to repeatedly find the sum, product, or XOR of elements between two indices `i` and `j`, immediately think of **Prefix Sums**.
2. **"Equilibrium index" or "Left equals Right":** If you need to find a pivot where the left side equals the right side, compute the total sum first, then keep a running prefix sum as you iterate.
3. **"Frequency counting":** If the input domain is small (e.g., lowercase English letters), use a fixed-size array `int[] count = new int[26]` instead of a HashMap for $O(1)$ constant time and space lookups.
4. **"Longest substring without repeating characters":** Use a sliding window with a HashSet or an array to track seen characters, which is a common pattern for string problems.
5. **"Anagram checks":** Sort the string or use a frequency array to determine if two strings are anagrams in $O(N \log N)$ or $O(N)$ time respectively.
6. **"Dynamic updates to the array":** If the problem involves updates to the array and range queries, consider advanced data structures like Segment Trees or Binary Indexed Trees instead of simple prefix sums.
7. **"Multiple queries on static data":** If you have a static array and need to answer multiple queries efficiently, precomputation (like prefix sums) is often the key to optimizing from $O(N)$ per query to $O(1)$.
8. **"String concatenation in loops":** If you see string concatenation inside a loop, switch to `StringBuilder` to avoid $O(N^2)$ time complexity.
9. **"Find the majority element":** If you need to find an element that appears more than `n/2` times, consider using the Boyer-Moore Voting Algorithm for an $O(N)$ time and $O(1)$ space solution instead of a HashMap.
10. **"Product of array except self":** If you need to find the product of all elements except the current index without using division, use two passes to build prefix and suffix product arrays.

---

## 5. Worked Examples

### Example 1: LeetCode 303. Range Sum Query - Immutable
**Problem:** Given an integer array `nums`, handle multiple queries to calculate the sum of the elements between indices `left` and `right`.
**Solution:**
```java
class NumArray {
    private int[] prefix;

    public NumArray(int[] nums) {
        prefix = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }
    
    public int sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}
```
*Time Complexity: $O(N)$ to build, $O(1)$ per query.*

### Example 2: LeetCode 724. Find Pivot Index
**Problem:** Find the index where the sum of all numbers strictly to the left equals the sum of all numbers strictly to the right.
**Solution:**
```java
class Solution {
    public int pivotIndex(int[] nums) {
        int totalSum = 0;
        for (int num : nums) totalSum += num;
        
        int leftSum = 0;
        for (int i = 0; i < nums.length; i++) {
            if (leftSum == totalSum - leftSum - nums[i]) {
                return i;
            }
            leftSum += nums[i];
        }
        return -1;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

Aim to complete 3 problems a day. Do not spend more than 45 minutes on a single problem. If you are stuck, read the solution, understand the pattern, and code it from scratch.

**Day 1: Array Basics**
1. Build Array from Permutation (LC 1920)
2. Concatenation of Array (LC 1929)
3. Contains Duplicate (LC 217)

**Day 2: String Basics & Traversal**
4. Valid Anagram (LC 242)
5. Length of Last Word (LC 58)
6. Find the Index of the First Occurrence in a String (LC 28)

**Day 3: Introduction to Prefix Sums**
7. Running Sum of 1d Array (LC 1480)
8. Range Sum Query - Immutable (LC 303)
9. Find Pivot Index (LC 724)

**Day 4: Array Counting & Math**
10. Majority Element (LC 169)
11. Kids With the Greatest Number of Candies (LC 1431)
12. Number of Good Pairs (LC 1512)

**Day 5: Intermediate Array Patterns**
13. Product of Array Except Self (LC 238)
14. Subarray Sum Equals K (LC 560) - *Crucial Prefix Sum + HashMap problem*
15. Maximum Subarray (LC 53) - *Kadane's Algorithm*

**Day 6: Matrix & 2D Arrays**
16. Richest Customer Wealth (LC 1672)
17. Matrix Diagonal Sum (LC 1572)
18. Spiral Matrix (LC 54)

**Day 7: String Manipulation & Optimization**
19. Longest Common Prefix (LC 14)
20. Group Anagrams (LC 49)
21. Encode and Decode Strings (LC 271 / Premium or Neetcode)

---

## 7. Mock Interview Module

### Problem: The Weighted Warehouse Query
**Context:** You are managing inventory for a massive e-commerce warehouse. The inventory is stored in a long line of numbered bins from `0` to `n-1`. The array `inventory[]` represents the number of items in each bin. 
Because bins further down the line are harder to reach, retrieving items from them costs more energy. The "retrieval cost" of an item in bin `i` is defined as `inventory[i] * i`.

**Question:** Write a class `Warehouse` that is initialized with an `inventory` array. Implement a method `getRetrievalCost(int L, int R)` that returns the total retrieval cost for all items in bins from index `L` to `R` inclusive. This method will be called millions of times per day.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Can `L` be equal to `R`?" -> *Interviewer:* Yes.
- *Candidate:* "Are there updates to the bins, or is the inventory static?" -> *Interviewer:* Static. Once initialized, the inventory does not change.
- *Candidate:* "Can the total sum exceed the 32-bit integer limit?" -> *Interviewer:* Excellent question. Yes, use `long` for the results.

#### Step 2: The Brute Force Solution
Explain that to answer a query `[L, R]`, we can iterate from `L` to `R`, multiply the inventory value by the index, and sum it up.
```java
// Time: O(N) per query, Space: O(1)
public long getRetrievalCost(int L, int R) {
    long cost = 0;
    for (int i = L; i <= R; i++) {
        cost += (long) inventory[i] * i;
    }
    return cost;
}
```
*Interviewer Critique:* "Since this method is called millions of times, $O(N)$ per query is too slow. Can we achieve $O(1)$ per query?"

#### Step 3: The Optimized Solution (Prefix Sums)
Recognize that this is a static array range query. We can precompute a prefix sum of the *weighted* inventory.
```java
class Warehouse {
    private long[] weightedPrefix;

    // Time: O(N) to initialize, Space: O(N)
    public Warehouse(int[] inventory) {
        int n = inventory.length;
        weightedPrefix = new long[n + 1];
        for (int i = 0; i < n; i++) {
            long weight = (long) inventory[i] * i;
            weightedPrefix[i + 1] = weightedPrefix[i] + weight;
        }
    }

    // Time: O(1) per query
    public long getRetrievalCost(int L, int R) {
        return weightedPrefix[R + 1] - weightedPrefix[L];
    }
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "What if the inventory *is* dynamic? Workers are constantly restocking bins (e.g., `update(index, newVal)`). How does that change your approach?"
*Candidate's expected thought process:*
- If we update a single index in the Prefix Sum array, we have to rebuild the rest of the array, making `update()` an $O(N)$ operation. 
- If we revert to the Brute Force array, `update()` is $O(1)$ but `getRetrievalCost()` is $O(N)$.
- *Advanced Answer:* To balance both operations at $O(\log N)$, we would use an advanced data structure like a **Segment Tree** or a **Binary Indexed Tree (Fenwick Tree)**.