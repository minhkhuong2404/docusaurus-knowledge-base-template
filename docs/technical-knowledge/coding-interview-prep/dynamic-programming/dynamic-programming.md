---
id: dynamic-programming
title: Dynamic Programming
sidebar_position: 12
description: Master DP patterns from 1D to 2D, interval DP, and DP on strings
---

# 💡 Dynamic Programming

## Concept

**Dynamic Programming (DP)** solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation. 

Two approaches:
- **Top-down (Memoization)**: Recursive + cache
- **Bottom-up (Tabulation)**: Iterative + fill table

The key question: *"Can I express the answer for a larger input in terms of answers for smaller inputs?"*

---

## When to Use

- Problem asks for **optimal value** (max, min, count)
- Problem has **overlapping subproblems** (same sub-problem computed multiple times)
- Making a **choice** at each step affects future choices
- Keywords: "minimum cost", "maximum profit", "number of ways", "can you reach"

---

## DP Patterns

| Pattern | Example |
|---|---|
| 1D Linear | Climbing Stairs, House Robber |
| 2D Grid | Unique Paths, Minimum Path Sum |
| Knapsack 0/1 | Partition Equal Subset Sum |
| Unbounded Knapsack | Coin Change, Word Break |
| Longest Common Subsequence | LCS, Edit Distance |
| Interval DP | Burst Balloons, Matrix Chain |
| DP on Strings | Palindrome, Regex Matching |

---

## Pattern 1: 1D Linear DP

```java
// House Robber: can't rob adjacent houses
public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];
    int prev2 = nums[0];
    int prev1 = Math.max(nums[0], nums[1]);

    for (int i = 2; i < nums.length; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
// dp[i] = max money from houses 0..i
// dp[i] = max(dp[i-1],  dp[i-2] + nums[i])
//           skip i      rob i
```

---

## Pattern 2: 0/1 Knapsack

Can each item be used **at most once**?

```java
// Partition Equal Subset Sum
public boolean canPartition(int[] nums) {
    int total = Arrays.stream(nums).sum();
    if (total % 2 != 0) return false;
    int target = total / 2;

    boolean[] dp = new boolean[target + 1];
    dp[0] = true; // empty subset sums to 0

    for (int num : nums) {
        // Traverse RIGHT to LEFT to avoid using same item twice
        for (int j = target; j >= num; j--) {
            dp[j] = dp[j] || dp[j - num];
        }
    }
    return dp[target];
}
```

---

## Pattern 3: Unbounded Knapsack

Can each item be used **unlimited times**?

```java
// Coin Change: minimum coins to make amount
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1); // "infinity"
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
// Key: inner loop goes LEFT to RIGHT (can reuse coins)
```

---

## Pattern 4: Longest Common Subsequence (LCS)

```java
public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i-1) == text2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1] + 1; // extend previous LCS
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]); // skip one
            }
        }
    }
    return dp[m][n];
}
```

---

## Worked Example: Edit Distance

**Problem**: Minimum operations (insert, delete, replace) to convert `word1` to `word2`.

```java
public int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];

    // Base cases: converting to/from empty string
    for (int i = 0; i <= m; i++) dp[i][0] = i; // delete i chars
    for (int j = 0; j <= n; j++) dp[0][j] = j; // insert j chars

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i-1) == word2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1]; // chars match, no operation
            } else {
                dp[i][j] = 1 + Math.min(dp[i-1][j-1],    // replace
                                Math.min(dp[i-1][j],       // delete from word1
                                         dp[i][j-1]));     // insert into word1
            }
        }
    }
    return dp[m][n];
}
```

**Trace** for `word1="horse", word2="ros"`:
```
    ""  r  o  s
""   0  1  2  3
h    1  1  2  3
o    2  2  1  2
r    3  2  2  2
s    4  3  3  2
e    5  4  4  3

Answer: 3
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Pattern |
|---|---|---|
| 70 | [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) | 1D Fibonacci |
| 118 | [Pascal's Triangle](https://leetcode.com/problems/pascals-triangle/) | 2D DP |
| 121 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | 1D DP |
| 198 | [House Robber](https://leetcode.com/problems/house-robber/) | 1D DP |

### 🟡 Medium
| # | Problem | Pattern |
|---|---|---|
| 55 | [Jump Game](https://leetcode.com/problems/jump-game/) | Greedy / DP |
| 62 | [Unique Paths](https://leetcode.com/problems/unique-paths/) | 2D grid |
| 139 | [Word Break](https://leetcode.com/problems/word-break/) | Unbounded knapsack |
| 152 | [Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/) | 1D with min/max |
| 213 | [House Robber II](https://leetcode.com/problems/house-robber-ii/) | Circular array DP |
| 300 | [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/) | 1D DP / patience sort |
| 322 | [Coin Change](https://leetcode.com/problems/coin-change/) | Unbounded knapsack |
| 416 | [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/) | 0/1 Knapsack |
| 518 | [Coin Change II](https://leetcode.com/problems/coin-change-ii/) | Combinations |
| 1143 | [LCS](https://leetcode.com/problems/longest-common-subsequence/) | LCS |

### 🔴 Hard
| # | Problem | Pattern |
|---|---|---|
| 10 | [Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/) | 2D DP |
| 72 | [Edit Distance](https://leetcode.com/problems/edit-distance/) | LCS variant |
| 312 | [Burst Balloons](https://leetcode.com/problems/burst-balloons/) | Interval DP |
| 1312 | [Minimum Insertion Steps to Make Palindrome](https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/) | LCS on palindrome |
