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

### Knowledge You Need Before Starting

- Recursion/backtracking fluency from Week 10.
- Strong base-case and transition thinking ("answer at i depends on ...").
- Array-state modeling comfort for memo and tabulation tables.
- Willingness to trace tiny examples before coding full DP.

---

## 2. Theory & Fundamentals

### 2.1 Mental Model: DP as a Smart Cache

The best way to understand DP is to compare it to a backend caching pattern you already know:

```
Without cache (pure recursion):
  Request: "What is fib(40)?"
  Server computes fib(40) = fib(39) + fib(38)
    computes fib(39) = fib(38) + fib(37)   <- fib(38) will be recomputed!
    computes fib(38) = fib(37) + fib(36)   <- fib(37) will be recomputed!
    ...

  fib(38) is called 2 times
  fib(37) is called 4 times
  fib(36) is called 8 times
  Total calls: O(2^N) <- exponential blowup

With cache (memoized recursion = top-down DP):
  Request: "What is fib(40)?"
  Compute fib(38) once -> store in cache[38]
  Next time fib(38) is needed -> cache hit, return instantly
  Total unique calls: N -> O(N) time
```

**The Redis analogy:** Your memoization cache is exactly like a Redis layer in front of a slow database. First call: compute and store. Every subsequent call: instant lookup. DP is just doing this for every unique subproblem on the call stack.

---

### 2.2 The Two Requirements for DP

Not every problem can be solved with DP. Two properties must hold:

**1. Optimal Substructure**
The optimal solution to the full problem can be built from optimal solutions to its subproblems.

```
House Robber example: "What is the max loot from houses [0..4]?"
  -> "Max loot from [0..4]" = max(rob[4] + max_loot[0..2], max_loot[0..3])
  -> The answer for [0..4] depends on optimal answers for [0..2] and [0..3]
  -> Those subproblem answers are reusable ✅ Optimal Substructure holds
```

**2. Overlapping Subproblems**
The same subproblems appear multiple times in the recursion tree — not all unique like in Divide and Conquer.

```
Fibonacci recursion tree for fib(5):
                 fib(5)
               /        \
           fib(4)       fib(3)   <- fib(3) appears twice
           /    \        /  \
        fib(3) fib(2) fib(2) fib(1)  <- fib(2) appears 3 times
        ...

Without caching: exponential recomputation
With caching: compute each once -> O(N)
```

**Counter-example (Divide and Conquer — NOT DP):** Merge Sort divides the array into unique halves at every level — no subproblem is ever recomputed. No overlapping subproblems → DP is not applicable.

---

### 2.3 The Four-Step DP Recipe

Follow these steps for every DP problem:

**Step 1 — Define the state**
What does `dp[i]` represent? This is the most critical decision.

```
Coin Change: dp[i] = minimum number of coins to make amount i
House Robber: dp[i] = maximum money robbed from houses 0..i
Climbing Stairs: dp[i] = number of distinct ways to reach step i
```

Write this definition in a comment before coding. If you can't state it clearly, you don't understand the problem yet.

**Step 2 — Write the recurrence (transition)**
How does `dp[i]` depend on previous states?

```
Coin Change:     dp[i] = min(dp[i - coin] + 1) for each coin <= i
House Robber:    dp[i] = max(dp[i-1], dp[i-2] + nums[i])
Climbing Stairs: dp[i] = dp[i-1] + dp[i-2]
```

**Step 3 — Identify base cases**
What are the smallest subproblems with known answers?

```
Coin Change:     dp[0] = 0 (zero coins needed to make amount 0)
House Robber:    dp[0] = nums[0], dp[1] = max(nums[0], nums[1])
Climbing Stairs: dp[1] = 1, dp[2] = 2
```

**Step 4 — Determine iteration direction and space**
- Bottom-up: usually `for (int i = base+1; i <= n; i++)`
- Space optimization: if `dp[i]` only needs `dp[i-1]` and `dp[i-2]`, use two variables

---

### 2.4 Top-Down vs. Bottom-Up: When to Use Which

|                         | Top-Down (Memoization)                        | Bottom-Up (Tabulation)                |
| ----------------------- | --------------------------------------------- | ------------------------------------- |
| **Starting point**      | `n`, recurse down to base case                | Base case `0`, iterate up to `n`      |
| **Implementation**      | Recursive function + cache array              | Iterative loop + dp array             |
| **Call stack**          | $O(N)$ stack frames                           | None — no recursion                   |
| **Computes**            | Only needed states (lazy)                     | All states up to `n` (eager)          |
| **Space optimize?**     | Harder (need to track state)                  | Easy (just use two variables)         |
| **When to prefer**      | Complex state transitions, sparse subproblems | Interviews, performance-critical code |
| **StackOverflow risk?** | Yes, for very large N                         | No                                    |

**For interviews:** Start by explaining both, then implement Bottom-Up. It is faster, cleaner, and avoids stack overflow. Mention Top-Down as an alternative approach.

---

### 2.5 The "Take it or Leave it" Pattern

The most common DP pattern in 1D array problems is a binary decision at each index:

```
At every index i, you make a choice:
  Option A: "Use" element i -> gain nums[i], but pay some penalty
  Option B: "Skip" element i -> no gain, no penalty

dp[i] = best of (Option A, Option B)
```

**House Robber — the canonical example:**
```
At each house i:
  Option A: Rob house i -> gain nums[i], but cannot rob house i-1
            -> dp[i-2] + nums[i]
  Option B: Skip house i -> no gain, keep whatever we had up to i-1
            -> dp[i-1]

dp[i] = max(dp[i-2] + nums[i], dp[i-1])
```

**This same structure recurs in many problems:**
- "Rob or skip" (House Robber)
- "Include or exclude from subset" (0/1 Knapsack)
- "Extend LIS or start new" (Longest Increasing Subsequence)
- "Carry or reset" (Maximum Subarray / Kadane's)

---

### 2.6 Space Optimization: When and How

**When:** Space optimization is possible when `dp[i]` only depends on a fixed number of previous states (typically `dp[i-1]` and/or `dp[i-2]`).

**How:** Replace the `dp[]` array with individual variables representing only those needed states.

```
Full array:
  dp = [0, 1, 1, 2, 3, 5, 8, 13]
         0  1  2  3  4  5  6   7

Space optimized — only keep last two:
  prev2 = dp[i-2]
  prev1 = dp[i-1]
  current = prev1 + prev2
  -> prev2 = prev1
  -> prev1 = current
```

**When NOT to optimize space:**
- When you need to reconstruct the actual solution (not just the value).
- When `dp[i]` depends on states further back than 2 steps (e.g., Longest Increasing Subsequence needs all previous values).
- When the reviewer asks you to trace back through the DP table.

---

### 2.7 Recognizing DP Patterns by Problem Shape

| Problem asks for                         | State definition                              | Recurrence shape                                       |
| ---------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| "Max/min value achievable at position i" | `dp[i]` = best value ending at `i`            | `max(dp[i-1] + gain, dp[i-2] + alt)`                   |
| "Number of ways to reach i"              | `dp[i]` = count of paths to `i`               | `dp[i-1] + dp[i-2] + ...`                              |
| "Can we achieve target T?"               | `dp[t]` = boolean, can we make `t`?           | `dp[t]                                                 | = dp[t - item]` |
| "Minimum cost to reach i"                | `dp[i]` = min cost to reach `i`               | `min(dp[i-1] + cost1, dp[i-2] + cost2)`                |
| "Longest subsequence ending at i"        | `dp[i]` = length of best subseq ending at `i` | `max(dp[j] + 1)` for all `j < i` where condition holds |
| "Maximum subarray sum"                   | `dp[i]` = max subarray ending at `i`          | `max(dp[i-1] + nums[i], nums[i])` (Kadane's)           |

---

### 2.8 Common DP Subtypes in 1D

**Fibonacci-style:** `dp[i]` depends on `dp[i-1]` and `dp[i-2]`. Classic: Climbing Stairs, Fibonacci, Tribonacci.

**Unbounded Knapsack:** You can use each item unlimited times. Classic: Coin Change, Perfect Squares. Inner loop iterates items, can reuse same item.

**0/1 Knapsack:** Each item can only be used once. Classic: Partition Equal Subset Sum. Inner loop iterates backward to prevent reuse.

**Longest Increasing Subsequence (LIS):** `dp[i]` = best answer ending at position `i`. Requires nested loop to compare all previous positions. Classic: LIS, Russian Doll Envelopes.

---

## 3. Code Templates (Java)

### Template 1: Top-Down (Memoization)

```java
public int solveTopDown(int n) {
    int[] memo = new int[n + 1];
    Arrays.fill(memo, -1); // -1 = not yet computed
    return dp(n, memo);
}

private int dp(int i, int[] memo) {
    // 1. Base cases
    if (i == 0) return 0;
    if (i == 1) return 1;

    // 2. Cache hit — return immediately
    if (memo[i] != -1) return memo[i];

    // 3. Compute, save, return
    memo[i] = dp(i - 1, memo) + dp(i - 2, memo);
    return memo[i];
}
```

**When to use `-1` as sentinel:** Works when answers are non-negative. If answers can be `-1`, use `Integer.MIN_VALUE` or a `boolean[] computed` array instead.

### Template 2: Bottom-Up (Tabulation)

```java
public int solveBottomUp(int n) {
    if (n == 0) return 0;
    if (n == 1) return 1;

    int[] dp = new int[n + 1];

    // Base cases
    dp[0] = 0;
    dp[1] = 1;

    // Build from smallest to largest
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2]; // recurrence
    }

    return dp[n];
}
```

### Template 3: Space-Optimized Bottom-Up

```java
public int solveSpaceOptimized(int n) {
    if (n == 0) return 0;
    if (n == 1) return 1;

    int prev2 = 0; // dp[i-2]
    int prev1 = 1; // dp[i-1]

    for (int i = 2; i <= n; i++) {
        int current = prev1 + prev2;
        prev2 = prev1;  // slide the window
        prev1 = current;
    }

    return prev1;
}
```

### Template 4: "Take it or Leave it" DP (House Robber style)

```java
public int robOrSkip(int[] nums) {
    if (nums.length == 1) return nums[0];

    int prev2 = nums[0];                       // dp[0]
    int prev1 = Math.max(nums[0], nums[1]);    // dp[1]

    for (int i = 2; i < nums.length; i++) {
        int current = Math.max(
            nums[i] + prev2,  // Take: use current + best from 2 steps back
            prev1             // Leave: keep best up to previous
        );
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}
```

### Template 5: Unbounded Knapsack (Coin Change style)

```java
public int unboundedKnapsack(int[] items, int target) {
    int[] dp = new int[target + 1];
    int INF = target + 1; // use target+1 as sentinel to avoid overflow
    Arrays.fill(dp, INF);
    dp[0] = 0;

    for (int t = 1; t <= target; t++) {
        for (int item : items) {
            if (item <= t) {
                dp[t] = Math.min(dp[t], 1 + dp[t - item]);
            }
        }
    }

    return dp[target] >= INF ? -1 : dp[target];
}
// Items can be reused unlimited times.
// Inner loop order doesn't matter for unbounded.
```

### Template 6: 0/1 Knapsack (Each item used at most once)

```java
public boolean zeroOneKnapsack(int[] items, int target) {
    boolean[] dp = new boolean[target + 1];
    dp[0] = true; // can always make sum=0

    for (int item : items) {           // outer: each item
        for (int t = target; t >= item; t--) { // inner: BACKWARD to prevent reuse
            dp[t] = dp[t] || dp[t - item];
        }
    }

    return dp[target];
}
// The backward inner loop is the key distinction from Unbounded Knapsack.
// It ensures each item is used at most once.
```

### Template 7: Longest Increasing Subsequence (LIS)

```java
public int lengthOfLIS(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n]; // dp[i] = length of LIS ending at index i
    Arrays.fill(dp, 1);    // every element is a LIS of length 1 by itself

    int maxLen = 1;

    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) { // strictly increasing
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }

    return maxLen;
}
// Time: O(N²)  Space: O(N)
// Note: O(N log N) solution exists using binary search + patience sorting.
```

### Template 8: Kadane's Algorithm (Maximum Subarray — Greedy DP)

```java
public int maxSubArray(int[] nums) {
    int maxSoFar = nums[0];
    int maxEndingHere = nums[0];

    for (int i = 1; i < nums.length; i++) {
        // Extend current subarray or start fresh at nums[i]
        maxEndingHere = Math.max(maxEndingHere + nums[i], nums[i]);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }

    return maxSoFar;
}
// dp[i] = max subarray sum ending at i
// Space-optimized: only need the previous dp value
```

---

## 4. Problem-Solving Framework

### Step 1 — Confirm DP Applies (1 minute)

Check both properties:
- "Can I find overlapping subproblems?" → Draw the recursion tree for a small example. Do any calls repeat?
- "Does optimal substructure hold?" → Can I build the answer for size N from answers of smaller sizes?

If yes to both → DP. If only unique subproblems → Divide and Conquer (Merge Sort, Quick Sort). If choices matter locally → Greedy.

### Step 2 — Define `dp[i]` in Plain English

Write this as a comment first. Be precise:

```java
// dp[i] = minimum number of coins needed to make amount exactly i
// dp[i] = maximum money robbed from houses 0 through i inclusive
// dp[i] = number of distinct ways to decode the first i characters
```

If you cannot articulate this, stop and re-read the problem.

### Step 3 — Write the Recurrence

Derive `dp[i]` from `dp[i-1]`, `dp[i-2]`, etc. Ask:
- "If I already knew the best answer for all smaller sizes, how do I compute `dp[i]`?"
- "What are my choices at position i? What does each choice cost/gain?"

### Step 4 — Identify Base Cases

Find the smallest values of `i` that can be answered without the recurrence:
- `dp[0]` is almost always 0 or 1 (the "empty" state)
- `dp[1]` is often the first trivial case

### Step 5 — Code Bottom-Up

```java
int[] dp = new int[n + 1];
// set base cases
dp[0] = /* base */;
// iterate and apply recurrence
for (int i = 1; i <= n; i++) {
    dp[i] = /* recurrence using dp[i-1], dp[i-2], etc. */;
}
return dp[n];
```

### Step 6 — Check Space Optimization

Ask: "Does `dp[i]` only need `dp[i-1]` and `dp[i-2]`?"
- Yes → Replace array with two variables.
- No → Keep the array (e.g., LIS needs all previous values).

### Step 7 — Trace a Small Example

Manually fill out `dp[0]` through `dp[4]` for a small input and verify the final answer matches what you'd compute by hand.

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| Problem signal                       | DP pattern         | Key recurrence                                        |
| ------------------------------------ | ------------------ | ----------------------------------------------------- |
| "Climb stairs 1 or 2 steps"          | Fibonacci-style    | `dp[i] = dp[i-1] + dp[i-2]`                           |
| "Rob houses, no adjacent"            | Take-or-skip       | `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`             |
| "Min coins to make amount"           | Unbounded knapsack | `dp[i] = min(dp[i-coin] + 1)`                         |
| "Partition array into equal subsets" | 0/1 knapsack       | `dp[t]                                                | = dp[t - nums[i]]`, backward loop |
| "Longest increasing subsequence"     | LIS                | `dp[i] = max(dp[j] + 1)` for j < i, nums[j] < nums[i] |
| "Decode a string of digits"          | Fibonacci variant  | `dp[i] = dp[i-1] (1-digit) + dp[i-2] (2-digit)`       |
| "Word break / word segmentation"     | Reachability       | `dp[i] = true if dp[j] && word[j..i] in dict`         |
| "Maximum subarray sum"               | Kadane's           | `dp[i] = max(dp[i-1] + nums[i], nums[i])`             |
| "Number of ways to do X"             | Count paths        | `dp[i] += dp[i - option]` for each option             |
| "Can we achieve sum T exactly?"      | Subset sum         | `dp[t] = dp[t] or dp[t - item]`                       |

---

### Detailed Recognition Walkthroughs

#### Recognizing Coin Change as Unbounded Knapsack

When you see: *"minimum number of coins to make amount, infinite supply"*
1. "I can reuse coins → Unbounded Knapsack."
2. `dp[i]` = min coins for amount `i`.
3. Recurrence: `dp[i] = min(dp[i - coin] + 1)` for all coins ≤ i.
4. Initialize all `dp[1..amount]` to `amount + 1` (sentinel for "impossible").
5. Inner loop direction: forward (either direction works for unbounded).

#### Recognizing 0/1 Knapsack (Partition Equal Subset Sum)

When you see: *"can you partition array into two equal subsets"*
1. "Each element can only be used once → 0/1 Knapsack."
2. Equivalent to: "Can you find a subset summing to `totalSum / 2`?"
3. `dp[t]` = can we make sum `t`? Boolean DP.
4. **Backward inner loop** is mandatory to prevent using the same element twice.

```java
// WRONG — forward loop allows reuse (becomes unbounded knapsack)
for (int t = item; t <= target; t++) dp[t] |= dp[t - item]; // reuses item!

// CORRECT — backward prevents reuse
for (int t = target; t >= item; t--) dp[t] |= dp[t - item]; // each item used once
```

#### Recognizing Decode Ways (Fibonacci Variant)

When you see: *"how many ways to decode a string of digits, where 1-26 map to A-Z"*
1. At each position `i`, look back 1 or 2 characters.
2. If `s[i]` is valid single-digit (1-9): `dp[i] += dp[i-1]`
3. If `s[i-1..i]` is valid two-digit (10-26): `dp[i] += dp[i-2]`
4. Edge case: `s[i] == '0'` invalidates the 1-digit option. `"00"` or `"30"` invalidates 2-digit.

#### Recognizing LIS vs. Maximum Subarray

Both are "best ending at position i" problems, but:
- **LIS:** Need to compare with all previous elements → nested loop → $O(N^2)$
- **Maximum Subarray (Kadane's):** Only need previous single value → one loop → $O(N)$. The key: you either extend the existing subarray or start fresh. No comparison with earlier elements needed.

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Using `Integer.MAX_VALUE` as Sentinel (Causes Overflow)

```java
// DANGEROUS — 1 + Integer.MAX_VALUE overflows to Integer.MIN_VALUE
Arrays.fill(dp, Integer.MAX_VALUE);
dp[i] = Math.min(dp[i], 1 + dp[i - coin]); // overflow!

// SAFE — use a value that won't overflow when +1 is applied
int INF = amount + 1; // larger than any possible answer
Arrays.fill(dp, INF);
dp[i] = Math.min(dp[i], 1 + dp[i - coin]); // safe: INF + 1 = amount + 2, no overflow
```

### Mistake 2: Wrong Sentinel Value for Memoization

```java
// BUG — if the actual answer for dp[i] can be 0, we'd skip recomputing it
int[] memo = new int[n + 1];
// Arrays.fill default is 0, which looks like "already computed"!

// If answer can be 0, use -1 as sentinel:
Arrays.fill(memo, -1);
if (memo[i] != -1) return memo[i]; // only skip if truly cached

// If answer can be -1 (like "impossible"), use Integer.MIN_VALUE:
Arrays.fill(memo, Integer.MIN_VALUE);
if (memo[i] != Integer.MIN_VALUE) return memo[i];
```

### Mistake 3: Off-by-One in Array Size

```java
// Problem: dp[i] represents the answer for value exactly i, from 0 to n
// WRONG — array size n misses index n
int[] dp = new int[n];

// CORRECT — size n+1 to include index n
int[] dp = new int[n + 1];
dp[0] = baseCase;
for (int i = 1; i <= n; i++) { ... }
return dp[n];
```

### Mistake 4: Forgetting Forward vs. Backward Loop Direction

```java
// Unbounded Knapsack (items can be reused): FORWARD is fine
for (int item : items) {
    for (int t = item; t <= target; t++) { // forward: item can be reused
        dp[t] = Math.min(dp[t], 1 + dp[t - item]);
    }
}

// 0/1 Knapsack (each item used once): MUST be BACKWARD
for (int item : items) {
    for (int t = target; t >= item; t--) { // backward: prevents reuse
        dp[t] |= dp[t - item];
    }
}
```

**Remembering the rule:** "Can I reuse this item? Yes → Forward. No → Backward."

### Mistake 5: Missing Edge Cases for Base States

```java
// House Robber with only 1 house:
// WRONG — dp[1] = max(dp[0], dp[-1] + nums[1]) crashes on dp[-1]
if (nums.length == 1) return nums[0]; // handle before general loop

// Coin Change with amount = 0:
// Must return 0 coins, not -1. dp[0] = 0 is the critical base case.
dp[0] = 0; // NEVER skip this

// LIS with all elements the same:
// Every element is a LIS of length 1 by itself
Arrays.fill(dp, 1); // initialize to 1, not 0
```

### Mistake 6: Confusing "Count of Ways" with "Min/Max Value"

```java
// Climbing stairs: HOW MANY ways to reach step n?
// -> dp[i] += dp[i-1] + dp[i-2]  (sum paths)

// Min Cost Climbing Stairs: CHEAPEST way to reach the top?
// -> dp[i] = min(dp[i-1], dp[i-2]) + cost[i]  (min of options)

// These look similar but the recurrence operator is completely different: + vs min()
```

---

## 7. Worked Examples

### Example 1: LeetCode 70 — Climbing Stairs

**Thinking process:**
1. "Number of distinct ways" → DP.
2. From step `i`, I arrived from `i-1` (one step) or `i-2` (two steps).
3. `dp[i]` = number of ways to reach step `i` = `dp[i-1] + dp[i-2]`.
4. This is exactly Fibonacci.

```java
class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;

        int prev2 = 1; // dp[1] = 1 way
        int prev1 = 2; // dp[2] = 2 ways

        for (int i = 3; i <= n; i++) {
            int current = prev1 + prev2;
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }
}
```

Dry run for `n = 5`:
```
prev2=1(dp[1]), prev1=2(dp[2])
i=3: current=3, prev2=2, prev1=3
i=4: current=5, prev2=3, prev1=5
i=5: current=8, prev2=5, prev1=8

Answer: 8 ✅
Verify: [1,1,1,1,1], [1,1,1,2], [1,1,2,1], [1,2,1,1], [2,1,1,1], [1,2,2], [2,1,2], [2,2,1] = 8 ways
```

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 2: LeetCode 198 — House Robber

**Thinking process:**
1. "Cannot rob adjacent houses" → take-or-skip DP.
2. At house `i`: rob it (`nums[i] + dp[i-2]`) OR skip it (`dp[i-1]`).
3. `dp[i] = max(nums[i] + dp[i-2], dp[i-1])`.
4. Space-optimize: only need the previous two values.

```java
class Solution {
    public int rob(int[] nums) {
        if (nums.length == 1) return nums[0];

        int prev2 = nums[0];
        int prev1 = Math.max(nums[0], nums[1]);

        for (int i = 2; i < nums.length; i++) {
            int current = Math.max(nums[i] + prev2, prev1);
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }
}
```

Dry run for `nums = [2, 7, 9, 3, 1]`:
```
prev2=2(house 0), prev1=7(max(2,7)=7 for houses 0,1)
i=2(nums[i]=9): current=max(9+2, 7)=11, prev2=7, prev1=11
i=3(nums[i]=3): current=max(3+7, 11)=11, prev2=11, prev1=11
i=4(nums[i]=1): current=max(1+11, 11)=12, prev2=11, prev1=12

Answer: 12 ✅ (rob houses 0, 2, 4: 2+9+1=12)
```

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 3: LeetCode 322 — Coin Change

**Problem:** Minimum coins to make `amount` using coins of given denominations.

**Thinking process:**
1. "Minimum number" + "infinite supply of coins" → Unbounded Knapsack DP.
2. `dp[i]` = minimum coins to make amount `i`.
3. For each amount `i`, try all coins: `dp[i] = min(dp[i], 1 + dp[i - coin])`.
4. Initialize `dp[1..amount]` to `amount + 1` (impossible sentinel).

```java
class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        int INF = amount + 1; // won't overflow when +1 is added
        Arrays.fill(dp, INF);
        dp[0] = 0; // base case: 0 coins for amount 0

        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = Math.min(dp[i], 1 + dp[i - coin]);
                }
            }
        }

        return dp[amount] >= INF ? -1 : dp[amount];
    }
}
```

Dry run for `coins = [1, 5, 6]`, `amount = 11`:
```
dp[0]=0
dp[1]=min(INF, 1+dp[0])=1           (use coin 1)
dp[2]=2, dp[3]=3, dp[4]=4
dp[5]=min(INF, 1+dp[4], 1+dp[0])=1  (use coin 5 directly)
dp[6]=min(INF, 1+dp[5], 1+dp[1], 1+dp[0])=1  (use coin 6 directly)
dp[7]=min(INF, 1+dp[6], 1+dp[2], 1+dp[1])=2  (6+1 or 5+1+1)
...
dp[10]=2  (5+5)
dp[11]=2  (5+6)

Answer: 2 ✅
```

*Time: $O(amount \times |coins|)$. Space: $O(amount)$.*

---

### Example 4: LeetCode 300 — Longest Increasing Subsequence

**Thinking process:**
1. "Longest" + "subsequence" (non-contiguous) → LIS DP.
2. `dp[i]` = length of LIS ending at index `i`.
3. For each `i`, check all `j < i` where `nums[j] < nums[i]`: `dp[i] = max(dp[i], dp[j] + 1)`.
4. Answer is `max(dp[0..n-1])` — could end anywhere.

```java
class Solution {
    public int lengthOfLIS(int[] nums) {
        int n = nums.length;
        int[] dp = new int[n];
        Arrays.fill(dp, 1); // each element is a LIS of length 1

        int maxLen = 1;
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) {
                    dp[i] = Math.max(dp[i], dp[j] + 1);
                }
            }
            maxLen = Math.max(maxLen, dp[i]);
        }
        return maxLen;
    }
}
```

Dry run for `nums = [10, 9, 2, 5, 3, 7, 101, 18]`:
```
i=0: dp=[1,_,_,_,_,_,_,_]
i=1(9): no j with nums[j]<9 -> dp[1]=1
i=2(2): no j with nums[j]<2 -> dp[2]=1
i=3(5): j=2(nums[2]=2<5): dp[3]=max(1,dp[2]+1)=2
i=4(3): j=2(2<3): dp[4]=2
i=5(7): j=2(2<7):dp=2, j=3(5<7):dp=3, j=4(3<7):dp=3 -> dp[5]=3
i=6(101): all previous < 101 -> dp[6]=max of all+1=4
i=7(18): j=2,3,4,5 all <18 -> dp[7]=max(dp[5]+1)=4

dp=[1,1,1,2,2,3,4,4], maxLen=4 ✅
```

*Time: $O(N^2)$. Space: $O(N)$.*

---

### Example 5: LeetCode 416 — Partition Equal Subset Sum

**Thinking process:**
1. "Can we partition into two equal subsets?" → 0/1 Knapsack (each element once).
2. Target = `totalSum / 2`. If `totalSum` is odd → false immediately.
3. `dp[t]` = can we form sum `t` using a subset?
4. **Backward inner loop** prevents reusing the same element.

```java
class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int num : nums) total += num;
        if (total % 2 != 0) return false;

        int target = total / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true; // can always make sum 0 (empty subset)

        for (int num : nums) {
            for (int t = target; t >= num; t--) { // BACKWARD: each num used once
                dp[t] = dp[t] || dp[t - num];
            }
        }
        return dp[target];
    }
}
```

Dry run for `nums = [1, 5, 11, 5]`, `target = 11`:
```
dp[0]=true, rest=false
Process num=1: dp[1]=dp[0]=true
  dp=[T,T,F,F,F,F,F,F,F,F,F,F]
Process num=5: dp[6]=dp[1]=true, dp[5]=dp[0]=true
  dp=[T,T,F,F,F,T,T,F,F,F,F,F]
Process num=11: dp[11]=dp[0]=true
  dp=[T,T,F,F,F,T,T,F,F,F,F,T]
Process num=5: dp[11]=dp[6]=true (already true)

dp[11]=true ✅ (subset [1,5,5] sums to 11)
```

*Time: $O(N \times target)$. Space: $O(target)$.*

---

## 8. Decision Tree: Which DP Approach?

```
Can the answer to size N be built from answers to smaller sizes?
└── YES -> DP applies

Can each item/element be used unlimited times?
├── YES -> Unbounded Knapsack
│         (forward inner loop, or inner=targets outer=items — either works)
│         Examples: Coin Change, Climbing Stairs, Perfect Squares
└── NO  -> 0/1 Knapsack
           (BACKWARD inner loop to prevent reuse)
           Examples: Partition Equal Subset Sum, 0/1 Knapsack

Does dp[i] depend on ALL previous values (not just dp[i-1], dp[i-2])?
├── YES -> Keep full dp[] array (cannot space-optimize)
│         Examples: LIS, Word Break
└── NO  -> Space-optimize to two variables
           Examples: Fibonacci, House Robber, Climbing Stairs

Is the answer the MAX/MIN value or COUNT OF WAYS?
├── MAX/MIN -> Initialize with sentinel (INF or -INF), use min()/max()
└── COUNT   -> Initialize dp[0]=1 (empty = one way), use addition
```

---

## 9. Complexity Cheat Sheet

| Problem                        | Time              | Space  | Optimized Space                     |
| ------------------------------ | ----------------- | ------ | ----------------------------------- |
| Fibonacci / Climbing Stairs    | $O(N)$            | $O(N)$ | $O(1)$ (two vars)                   |
| House Robber                   | $O(N)$            | $O(N)$ | $O(1)$ (two vars)                   |
| Coin Change (Unbounded)        | $O(N \times K)$   | $O(N)$ | Cannot optimize (full array needed) |
| Partition Equal Subset (0/1)   | $O(N \times T)$   | $O(T)$ | Already 1D (from 2D)                |
| Longest Increasing Subsequence | $O(N^2)$          | $O(N)$ | Cannot optimize                     |
| LIS (binary search approach)   | $O(N \log N)$     | $O(N)$ | —                                   |
| Word Break                     | $O(N^2 \times L)$ | $O(N)$ | Cannot optimize                     |
| Decode Ways                    | $O(N)$            | $O(N)$ | $O(1)$ (two vars)                   |
| Max Subarray (Kadane's)        | $O(N)$            | $O(N)$ | $O(1)$ (one var)                    |

*N = input size, K = number of items/coins, T = target sum, L = max word length*

---

## 10. 7-Day Practice Plan (21 Problems)

For each problem, follow the ritual:
1. State `dp[i]` definition in plain English before coding.
2. Write the recurrence on paper.
3. Identify base cases.
4. Implement bottom-up.
5. Check if space can be optimized.
6. Trace manually for `n = 4` or `n = 5`.

**Day 1: Fibonacci Variations & Transitions**
1. [Climbing Stairs (LC 70)](https://leetcode.com/problems/climbing-stairs/) — Fibonacci, space-optimize to $O(1)$
2. [Fibonacci Number (LC 509)](https://leetcode.com/problems/fibonacci-number/) — Classic base
3. [N-th Tribonacci Number (LC 1137)](https://leetcode.com/problems/n-th-tribonacci-number/) — Three variables for space optimization

**Day 2: Take-or-Skip Pattern**
4. [Min Cost Climbing Stairs (LC 746)](https://leetcode.com/problems/min-cost-climbing-stairs/) — Min-cost variant of Fibonacci
5. [House Robber (LC 198)](https://leetcode.com/problems/house-robber/) ⭐ — Take-or-skip canonical
6. [House Robber II (LC 213)](https://leetcode.com/problems/house-robber-ii/) — Circular: run twice, exclude first/last

**Day 3: String & Word DP**
7. [Decode Ways (LC 91)](https://leetcode.com/problems/decode-ways/) ⭐ — Fibonacci variant with edge cases
8. [Word Break (LC 139)](https://leetcode.com/problems/word-break/) — Reachability DP with HashSet lookup
9. [Longest Palindromic Substring (LC 5)](https://leetcode.com/problems/longest-palindromic-substring/) — Expand from center (alternative to DP)

**Day 4: Unbounded Knapsack**
10. [Coin Change (LC 322)](https://leetcode.com/problems/coin-change/) ⭐ — Canonical unbounded knapsack
11. [Perfect Squares (LC 279)](https://leetcode.com/problems/perfect-squares/) — Coins = perfect squares
12. [Integer Break (LC 343)](https://leetcode.com/problems/integer-break/) — Split for maximum product

**Day 5: Longest Increasing Subsequence**
13. [Longest Increasing Subsequence (LC 300)](https://leetcode.com/problems/longest-increasing-subsequence/) ⭐ — Core LIS pattern
14. [Number of Longest Increasing Subsequences (LC 673)](https://leetcode.com/problems/number-of-longest-increasing-subsequence/) — Track count alongside length
15. [Wiggle Subsequence (LC 376)](https://leetcode.com/problems/wiggle-subsequence/) — Greedy or DP

**Day 6: 0/1 Knapsack**
16. [Partition Equal Subset Sum (LC 416)](https://leetcode.com/problems/partition-equal-subset-sum/) ⭐ — Canonical 0/1 knapsack
17. [Last Stone Weight II (LC 1049)](https://leetcode.com/problems/last-stone-weight-ii/) — Disguised partition sum
18. [Ones and Zeroes (LC 474)](https://leetcode.com/problems/ones-and-zeroes/) — 2D knapsack (two budgets)

**Day 7: Advanced 1D DP**
19. [Combination Sum IV (LC 377)](https://leetcode.com/problems/combination-sum-iv/) ⭐ — Order matters → unbounded with order
20. [Palindrome Partitioning II (LC 132)](https://leetcode.com/problems/palindrome-partitioning-ii/) — Min cuts using DP
21. [Maximum Product Subarray (LC 152)](https://leetcode.com/problems/maximum-product-subarray/) — Track both min and max simultaneously

---

## 11. Mock Interview Module

### Problem: The Distributed Cache Blob Chunker

**Context:** You are designing an internal blob storage system. When a large file is uploaded, it must be chunked into smaller blocks. Given a `fileSize` in MB and an array of allowed `chunkSizes`, you want the **minimum number of chunks** to exactly partition the file (minimizing network calls). Chunk sizes can be reused.

**Question:** Write `public int getMinimumChunks(int fileSize, int[] chunkSizes)`. Return `-1` if no exact partition exists.

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                                    | Interviewer answers  | Why it matters                              |
| ------------------------------------------------- | -------------------- | ------------------------------------------- |
| "Can the same chunk size be used multiple times?" | Yes, infinite supply | Unbounded Knapsack                          |
| "Is the array sorted?"                            | No, assume unsorted  | Sort inside or check all                    |
| "Can fileSize be 0?"                              | No, fileSize >= 1    | No trivial base case edge                   |
| "What if no partition is possible?"               | Return -1            | Must detect impossible states               |
| "What are the constraints on fileSize?"           | Up to $10^5$         | $O(fileSize \times K)$ is acceptable |

---

#### Step 2: Why Greedy Fails

```
fileSize = 14, chunkSizes = [10, 7, 1]

Greedy (always pick largest that fits):
  14 -> pick 10 -> remaining 4
  4  -> pick 1  -> remaining 3
  3  -> pick 1  -> remaining 2
  ... -> total = 1 + 4 ones = 5 chunks

Optimal: 7 + 7 = 2 chunks

Greedy fails because picking 10 blocks the better 7+7 path.
-> Must use DP to evaluate all possibilities.
```

---

#### Step 3: Optimized Solution (Bottom-Up 1D DP)

```java
// Time: O(fileSize * numChunkSizes)
// Space: O(fileSize)
public int getMinimumChunks(int fileSize, int[] chunkSizes) {
    if (fileSize <= 0) return -1;

    int[] dp = new int[fileSize + 1];
    int INF = fileSize + 1; // sentinel: larger than any valid answer, safe against +1 overflow
    Arrays.fill(dp, INF);
    dp[0] = 0; // base case: 0 chunks needed for size 0

    for (int size = 1; size <= fileSize; size++) {
        for (int chunk : chunkSizes) {
            if (chunk <= size) {
                dp[size] = Math.min(dp[size], 1 + dp[size - chunk]);
            }
        }
    }

    return dp[fileSize] >= INF ? -1 : dp[fileSize];
}
```

Dry run for `fileSize = 14`, `chunkSizes = [10, 7, 1]`:
```
dp[0]=0, dp[1..14]=15 (INF=15)
dp[1]: chunk=1: min(15, 1+dp[0])=1
dp[7]: chunk=7: min(15, 1+dp[0])=1
dp[10]: chunk=10: min(15, 1+dp[0])=1; chunk=1: min(1, 1+dp[9])=1
dp[14]: chunk=10: 1+dp[4]=1+4=5; chunk=7: 1+dp[7]=1+1=2; chunk=1: 1+dp[13]
  -> dp[14]=2 (7+7)

Answer: 2 ✅
```

---

#### Step 4: Follow-up Questions & Expected Answers

**Q1:** "Each chunk size can now only be used ONCE per file. How does your approach change?"

*Expected answer:*
"This transforms the problem from **Unbounded Knapsack** to **0/1 Knapsack**. The key code change is: iterate chunk sizes in the outer loop, and iterate `size` **backwards** in the inner loop to prevent reusing the same chunk size.

```java
// Outer: each chunk size
for (int chunk : chunkSizes) {
    // Inner: BACKWARD to prevent reuse
    for (int size = fileSize; size >= chunk; size--) {
        if (dp[size - chunk] < INF) {
            dp[size] = Math.min(dp[size], 1 + dp[size - chunk]);
        }
    }
}
```

Without the backward loop, `dp[size]` could use the same chunk twice within one outer iteration."

**Q2:** "What if each chunk has a different processing cost (not all equal to 1), and you want to minimize total cost rather than number of chunks?"

*Expected answer:*
"Instead of counting chunks, track minimum cost. Define `dp[size]` = minimum processing cost to chunk a file of size `size`. Change the recurrence from `1 + dp[size - chunk]` to `cost[chunk] + dp[size - chunk]`. The rest of the algorithm is identical — this is the same DP structure, just with a different weight on each item."

**Q3:** "If fileSize can be up to $10^9$ (not $10^5$), your $O(N)$ space approach won't work. What would you do?"

*Expected answer:*
"A fileSize of $10^9$ means a dp array of 1 billion entries — ~4GB for `int[]`, completely impractical. Alternative approaches:
1. **Math/greedy:** If the chunk sizes form a canonical system (e.g., powers of 2), greedy works in $O(\log N)$ time and $O(1)$ space.
2. **BFS on state space:** Treat each remaining fileSize as a node, chunk sizes as edges. BFS finds minimum chunks in $O(reachable\ states \times K)$ time, but with memoization the reachable states may be far fewer than $10^9$.
3. **Rethink the problem:** In practice, file sizes aren't arbitrary — they're multiples of block sizes. If chunkSizes are `[MB, 5MB, 20MB]`, then actual distinct sizes are bounded, and you can reduce the problem to a much smaller state space using GCD analysis."

---

## 12. Quick Reference: DP Java Idioms

```java
// ── MEMO ARRAY SETUP ─────────────────────────────────────────────────────
int[] memo = new int[n + 1];
Arrays.fill(memo, -1);          // sentinel for "not computed" when answers >= 0
// Use Integer.MIN_VALUE if valid answers can be -1

// ── TOP-DOWN CACHE CHECK ──────────────────────────────────────────────────
if (memo[i] != -1) return memo[i];
// compute...
memo[i] = result;
return memo[i];

// ── BOTTOM-UP ARRAY ───────────────────────────────────────────────────────
int[] dp = new int[n + 1];          // size n+1 to include index n
dp[0] = /* base case */;
for (int i = 1; i <= n; i++) {
    dp[i] = /* recurrence */;
}
return dp[n];

// ── SENTINEL FOR MIN-DP (avoid Integer.MAX_VALUE) ─────────────────────────
int INF = amount + 1;              // for Coin Change style
int INF = n * maxVal + 1;          // for general min-value DP

// ── SPACE OPTIMIZATION (when only dp[i-1] and dp[i-2] needed) ────────────
int prev2 = dp0, prev1 = dp1;
for (int i = 2; i <= n; i++) {
    int curr = f(prev1, prev2);
    prev2 = prev1;
    prev1 = curr;
}
return prev1;

// ── 0/1 KNAPSACK LOOP ORDER (CRITICAL) ───────────────────────────────────
for (int item : items) {
    for (int t = target; t >= item; t--) {  // BACKWARD
        dp[t] = dp[t] || dp[t - item];       // boolean
        // OR: dp[t] = Math.min(dp[t], dp[t - item] + 1); // min
    }
}

// ── UNBOUNDED KNAPSACK LOOP ORDER ─────────────────────────────────────────
for (int t = 1; t <= target; t++) {
    for (int item : items) {
        if (item <= t) dp[t] = Math.min(dp[t], dp[t - item] + 1);
    }
}

// ── LIS INITIALIZATION ────────────────────────────────────────────────────
int[] dp = new int[n];
Arrays.fill(dp, 1);  // every element is a LIS of 1 by itself
int max = 1;
for (int i = 1; i < n; i++) {
    for (int j = 0; j < i; j++) {
        if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    max = Math.max(max, dp[i]);
}

// ── KADANE'S ALGORITHM ────────────────────────────────────────────────────
int maxEndingHere = nums[0], maxSoFar = nums[0];
for (int i = 1; i < n; i++) {
    maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
}

// ── CHECK FINAL ANSWER FOR IMPOSSIBLE STATE ───────────────────────────────
return dp[target] >= INF ? -1 : dp[target];
return dp[n] == Integer.MIN_VALUE ? -1 : dp[n];
```