---
id: week-13-dynamic-programming-1d
title: "Week 13: Dynamic Programming I (1D)"
description: Enter Phase 4 by conquering Dynamic Programming. Learn to identify overlapping subproblems and map recursion to bottom-up tabulation and memoization in Java.
tags: [dsa, java, dynamic-programming, memoization, tabulation, week-13, backend-optimization]
sidebar_position: 13
---

# Week 13: Dynamic Programming I (1D)

## 1. Overview
Welcome to Week 13 and the beginning of **Phase 4: Intermediate Techniques**! You have now entered the realm of Dynamic Programming (DP). DP is often considered the most intimidating topic in coding interviews, but fundamentally, it is just **Recursion + Caching**. 

In backend engineering, when a distributed system performs a heavy database query or a complex calculation, we store the result in a cache (like Redis) so the next identical request returns instantly. DP applies this exact same architectural principle to the recursive Call Stack.

**Goals for this week:**
- Understand the two requirements for DP: **Optimal Substructure** and **Overlapping Subproblems**.
- Master **Top-Down (Memoization)**: Recursion backed by an array/map.
- Master **Bottom-Up (Tabulation)**: Iteratively building solutions from the smallest subproblem up.
- Learn how to optimize $O(N)$ space down to $O(1)$ space for sequential DP.

---

## 2. Theory & Fundamentals

### The Core Concept
Imagine calculating the 5th Fibonacci number: `F(5) = F(4) + F(3)`. 
To calculate `F(4)`, you need `F(3) + F(2)`. 
Notice that `F(3)` is being calculated twice! In a pure recursive tree, this redundancy grows exponentially ($O(2^N)$). Dynamic Programming solves this by saving the answer to `F(3)` the first time we see it.

### Top-Down (Memoization)
You write a standard recursive function (like we did in Week 10 for Backtracking). But before returning the result, you save it in a global array or `HashMap`. The next time the function is called with those same parameters, you immediately return the saved value.
- **Pros:** Easier to write if you already understand recursion. Only computes states that are strictly necessary.
- **Cons:** Still incurs the memory overhead of the JVM Call Stack.

### Bottom-Up (Tabulation)
Instead of starting at `N` and recursively drilling down to `0`, you start at `0` and use a `for` loop to build your way up to `N` using an array.
- **Pros:** No Call Stack overhead. Extremely fast.
- **Cons:** Computes every single state up to $N$, even if some states technically aren't needed to reach the final answer.

### Space Optimization
If calculating `dp[i]` only ever requires `dp[i-1]` and `dp[i-2]`, you do not need an array of size $N$. You only need two integer variables to hold the previous two states, reducing your space complexity from $O(N)$ to $O(1)$.

---

## 3. Code Templates (Java)

### Template 1: Top-Down (Memoization)
```java
public int solveTopDown(int n) {
    // Initialize memo array with -1 (indicating uncalculated states)
    int[] memo = new int[n + 1];
    Arrays.fill(memo, -1);
    return dpRecursive(n, memo);
}

private int dpRecursive(int i, int[] memo) {
    // 1. Base Cases
    if (i == 0) return 0;
    if (i == 1) return 1;
    
    // 2. Check Cache
    if (memo[i] != -1) {
        return memo[i];
    }
    
    // 3. Compute and Save
    memo[i] = dpRecursive(i - 1, memo) + dpRecursive(i - 2, memo);
    return memo[i];
}
```

### Template 2: Bottom-Up (Tabulation)
```java
public int solveBottomUp(int n) {
    if (n == 0) return 0;
    
    // 1. Create DP array
    int[] dp = new int[n + 1];
    
    // 2. Initialize Base Cases
    dp[0] = 0;
    dp[1] = 1;
    
    // 3. Iterate and build
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    
    return dp[n];
}
```

### Template 3: Bottom-Up Space Optimized
```java
public int solveSpaceOptimized(int n) {
    if (n == 0) return 0;
    
    int prev2 = 0; // dp[i-2]
    int prev1 = 1; // dp[i-1]
    
    for (int i = 2; i <= n; i++) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    
    return prev1;
}
```

---

## 4. Pattern Recognition Guide

**How to spot 1D Dynamic Programming problems:**
1. **"Maximum/Minimum", "Longest/Shortest", "Number of ways":** These phrases indicate optimization or combinatorics, which are hallmarks of DP.
2. **"Given an array/string, find..." + Constraints around $10^4$:** If generating all subsets/permutations ($O(2^N)$) will cause a Time Limit Exceeded error, you must use DP.
3. **The "Take it or Leave it" rule:** If at every index `i`, you must make a choice (e.g., rob this house or skip this house) that affects your future choices, it is a DP state machine.
4. **"Can we do better than O(2^N)?":** If the problem asks for a solution faster than O(2^N) and involves making choices at each step, this is a strong signal that you can use DP to optimize down to O(N) or O(N*K).
5. **"Is this problem asking for a yes/no answer about feasibility?":** If the problem asks if a certain configuration is possible (e.g., can we make the target sum with these numbers?), this is often a strong signal that a DP approach may work, and you should try to prove the Optimal Substructure and Overlapping Subproblems properties.
6. **"Find the k-th smallest/largest":** If the problem asks for the k-th smallest or largest element in a sorted structure, this is often a hint that you can use binary search to find the correct index or value efficiently, or a DP approach to build up to the solution.
7. **"Find the longest/shortest substring with X unique characters":** This is a strong signal for using a DP approach, where you can track character frequencies and use a sliding window to find the optimal substring.
8. **"Find pairs with a specific difference":** If the problem asks for pairs of numbers that have a specific difference (e.g., `A - B = K`), you can use a DP approach to check for the existence of `A - K` or `A + K` efficiently.
9. **"Find the first non-repeating character":** Use a DP approach to maintain a frequency map and track the first unique character efficiently.
10. **"Design a cache with O(1) access and eviction":** This is a classic use case for a combination of `HashMap` (for O(1) access) and a doubly linked list (for O(1) eviction), as seen in LRU Cache implementations, which can be solved using DP principles to manage state and optimize access patterns.

---

## 5. Worked Examples

### Example 1: LeetCode 198. House Robber
**Problem:** You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. The constraint is that adjacent houses have security systems connected, and it will automatically contact the police if two adjacent houses were broken into on the same night. Return the maximum amount of money you can rob.
**Solution (Space Optimized Bottom-Up):**
```java
class Solution {
    public int rob(int[] nums) {
        if (nums == null || nums.length == 0) return 0;
        if (nums.length == 1) return nums[0];
        
        int prev2 = 0; // Max money if we robbed up to i-2
        int prev1 = nums[0]; // Max money if we robbed up to i-1
        
        for (int i = 1; i < nums.length; i++) {
            // Choice: Rob this house (and add to prev2), or skip this house (keep prev1)
            int current = Math.max(nums[i] + prev2, prev1);
            prev2 = prev1;
            prev1 = current;
        }
        
        return prev1;
    }
}
```

### Example 2: LeetCode 322. Coin Change
**Problem:** You are given an integer array `coins` representing coins of different denominations and an integer `amount`. Return the fewest number of coins that you need to make up that amount. If not possible, return `-1`.
**Solution (1D Tabulation):**
```java
class Solution {
    public int coinChange(int[] coins, int amount) {
        // dp[i] represents the minimum coins needed to make amount i
        int[] dp = new int[amount + 1];
        
        // Initialize with a theoretical "infinity" to avoid overflow later
        int max = amount + 1; 
        Arrays.fill(dp, max);
        
        // Base case: 0 coins needed to make amount 0
        dp[0] = 0; 
        
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    // Try using this coin, plus whatever the minimum was for the remainder
                    dp[i] = Math.max(dp[i], Math.min(dp[i], 1 + dp[i - coin]));
                }
            }
        }
        
        return dp[amount] > amount ? -1 : dp[amount];
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Fibonacci Variations & Transitions**
1. Climbing Stairs (LC 70)
2. Fibonacci Number (LC 509)
3. N-th Tribonacci Number (LC 1137)

**Day 2: 1D Array Logic (Take it or Leave it)**
4. Min Cost Climbing Stairs (LC 746)
5. House Robber (LC 198)
6. House Robber II (LC 213) - *Deals with circular arrays.*

**Day 3: String/Word DP Foundations**
7. Decode Ways (LC 91)
8. Word Break (LC 139)
9. Longest Palindromic Substring (LC 5) - *Can be solved with DP or expanding from center.*

**Day 4: The Unbounded Knapsack Pattern**
10. Coin Change (LC 322)
11. Perfect Squares (LC 279)
12. Integer Break (LC 343)

**Day 5: Longest Increasing Subsequence (LIS)**
13. Longest Increasing Subsequence (LC 300) - *The definitive 1D DP array pattern.*
14. Number of Longest Increasing Subsequence (LC 673)
15. Wiggle Subsequence (LC 376)

**Day 6: The 0/1 Knapsack Pattern**
16. Partition Equal Subset Sum (LC 416)
17. Last Stone Weight II (LC 1049) - *A brilliant disguise for 0/1 Knapsack.*
18. Ones and Zeroes (LC 474)

**Day 7: Advanced 1D Review**
19. Combination Sum IV (LC 377) - *Despite the name, this is a DP problem, not backtracking.*
20. Palindrome Partitioning II (LC 132)
21. Maximum Product Subarray (LC 152) - *Requires tracking both min and max simultaneously.*

---

## 7. Mock Interview Module

### Problem: The Distributed Cache Blob Chunker
**Context:** You are designing an internal blob storage system. When a large file (blob) is uploaded, it must be chunked into smaller blocks before being distributed across Kafka topics and written to storage. 
You are given a `fileSize` in MB. You also have an array of allowed `chunkSizes` (e.g., `[1, 5, 20]` MB). 
However, there is an overhead to processing each chunk. You want to chunk the file using the **absolute minimum number of chunks** possible to reduce network calls.

**Question:** Write a method `public int getMinimumChunks(int fileSize, int[] chunkSizes)` that returns the minimum number of chunks required. If the file cannot be perfectly partitioned using the allowed sizes, return `-1`.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Can I use the same chunk size multiple times?" -> *Interviewer:* Yes, you have an infinite supply of each chunk size.
- *Candidate:* "Is the `chunkSizes` array guaranteed to be sorted?" -> *Interviewer:* No, assume it is unsorted.
- *Candidate:* "What are the constraints on `fileSize`?" -> *Interviewer:* It can be up to $10^5$ MB.

#### Step 2: Formulating the Strategy
*Candidate's thought process:*
- This is a variation of the Unbounded Knapsack problem, identical in structure to Coin Change.
- The greedy approach (always taking the largest possible chunk first) **fails** here. For example, if `fileSize = 14`, and `chunkSizes = [10, 7, 1]`. Greedy chooses `10 + 1 + 1 + 1 + 1` (5 chunks). But the optimal answer is `7 + 7` (2 chunks).
- Therefore, I must evaluate all possibilities using Dynamic Programming.
- Let `dp[i]` be the minimum chunks required to partition a file of size `i`.
- The state transition: `dp[i] = min(dp[i], 1 + dp[i - chunkSize])`.

#### Step 3: The Optimized Solution (Bottom-Up 1D DP)
```java
// Time Complexity: O(fileSize * num_chunkSizes)
// Space Complexity: O(fileSize)
public int getMinimumChunks(int fileSize, int[] chunkSizes) {
    if (fileSize < 0) return -1;
    if (fileSize == 0) return 0;
    
    int[] dp = new int[fileSize + 1];
    
    // Fill the array with an impossibly large number to represent "unreachable" states
    // We use fileSize + 1 instead of Integer.MAX_VALUE to prevent integer overflow
    // when we do `1 + dp[...]` later.
    int maxSentinel = fileSize + 1;
    Arrays.fill(dp, maxSentinel);
    
    // Base case: A file of size 0 requires 0 chunks
    dp[0] = 0;
    
    // Build the solution from 1 up to fileSize
    for (int currentSize = 1; currentSize <= fileSize; currentSize++) {
        for (int chunk : chunkSizes) {
            // If the chunk fits inside the current file size
            if (chunk <= currentSize) {
                dp[currentSize] = Math.min(dp[currentSize], 1 + dp[currentSize - chunk]);
            }
        }
    }
    
    // If the final answer is still our sentinel value, no combination worked
    return dp[fileSize] >= maxSentinel ? -1 : dp[fileSize];
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "Excellent. Now consider this: We want to restrict the system so that each chunk size can only be used a **maximum of one time** per file (to enforce a specific data distribution protocol). How does your approach change?"
*Candidate's expected thought process:*
- If we can only use each chunk size once, this transforms from the "Unbounded Knapsack" problem into the classic **0/1 Knapsack** problem.
- My current `dp` array is 1-Dimensional and only tracks the `currentSize`. If I re-use the same array, a chunk might be counted multiple times.
- To solve this, I would need to flip the loops (iterate over `chunkSizes` on the outside, and `currentSize` backwards on the inside) or shift to a **2D DP array** (`dp[item_index][current_size]`) to track exactly which chunk sizes have been used at each step. This leads perfectly into Phase 4, Week 14.