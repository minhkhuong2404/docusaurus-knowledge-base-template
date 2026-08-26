---
id: week-1-arrays-strings-prefix-sums
title: "Week 1: Arrays, Strings & Prefix Sums"
description: Master contiguous memory structures in Java, including static arrays and string immutability, and optimize range queries using the Prefix Sum pattern.
tags: [dsa, java, arrays, strings, prefix-sums, algorithms, week-1]
sidebar_position: 1
---

import DsaWeek1ArraysDiagram from '@site/src/components/DsaWeek1ArraysDiagram';

# Week 1: Arrays, Strings & Prefix Sums

## 1. Overview

Welcome to Week 1! This week lays the foundation for everything to come. We are focusing on contiguous memory structures: **Arrays** and **Strings**. You will learn how data is stored in memory, how to iterate efficiently, and how to optimize repeated range calculations using **Prefix Sums**. Mastering these basics is critical, as almost all advanced algorithms (like dynamic programming and graph traversals) rely heavily on arrays.

**Goals for this week:**
- Understand memory allocation for static vs. dynamic arrays (`int[]` vs `ArrayList`).
- Master String immutability in Java and when to use `StringBuilder`.
- Learn the Prefix Sum pattern to reduce $O(N)$ range queries to $O(1)$.

### Knowledge You Need Before Starting

- Java basics: variables, loops (`for`/`while`), conditionals, and methods.
- Big-O fundamentals: distinguish $O(1)$, $O(N)$, and $O(N^2)$.
- Basic integer math and indexing confidence (0-indexed arrays).
- Comfort using `java.util` essentials like `ArrayList`, `HashMap`, and `HashSet`.

---

## 2. Theory & Fundamentals

<DsaWeek1ArraysDiagram />


### 2.1 Arrays

An array is a collection of items stored at **contiguous memory locations**. Think of it like a row of numbered mailboxes in an apartment building — they are physically next to each other, and you can jump directly to mailbox #42 without walking past all the others.

```
Index:   0    1    2    3    4
       +----+----+----+----+----+
Value: | 10 | 20 | 30 | 40 | 50 |
       +----+----+----+----+----+
Addr:  100  104  108  112  116    (each int = 4 bytes)
```

Because the address of element `i` is simply `base_address + i * element_size`, the CPU can compute it instantly — that is why read/write is $O(1)$.

**Time Complexity:**
| Operation               | `int[]` (static) | `ArrayList<Integer>` (dynamic) |
| ----------------------- | ---------------- | ------------------------------ |
| Read by index           | $O(1)$           | $O(1)$                         |
| Write by index          | $O(1)$           | $O(1)$                         |
| Insert/Delete at end    | $O(1)$           | $O(1)$ amortized               |
| Insert/Delete in middle | $O(N)$           | $O(N)$                         |
| Search (unsorted)       | $O(N)$           | $O(N)$                         |
| Search (sorted)         | $O(\log N)$      | $O(\log N)$                    |

**Java-Specific: `int[]` vs `ArrayList<Integer>`**

This distinction matters a lot in performance-critical code:

| Aspect               | `int[]`                             | `ArrayList<Integer>`                  |
| -------------------- | ----------------------------------- | ------------------------------------- |
| Memory per element   | 4 bytes (primitive)                 | ~16 bytes (object header + int value) |
| Fixed size?          | Yes — declared once                 | No — grows automatically              |
| Cache friendliness   | ✅ Very high (contiguous primitives) | ⚠️ Lower (stores object references)    |
| Auto-boxing overhead | None                                | Yes — every read/write boxes/unboxes  |
| Use when...          | Size is known, heavy computation    | Size is unknown, need add/remove      |

> **Practical tip:** For LeetCode problems where you know the max size (e.g., only lowercase letters → size 26, only digits → size 10), always prefer `int[]` over `HashMap<Character, Integer>`. It is faster and simpler.

**How `ArrayList` resizes (understanding amortized $O(1)$):**

When an `ArrayList` is full and you add one more element, it creates a new array of double the size and copies everything. This copy takes $O(N)$, but it happens so rarely (only at sizes 1, 2, 4, 8, 16...) that if you spread the cost across all insertions, each insertion costs $O(1)$ on average. This is called **amortized $O(1)$**.

```java
// int[] — fixed size, best for known domains
int[] freq = new int[26]; // for 'a'-'z'
freq['c' - 'a']++;

// ArrayList — flexible size
List<Integer> list = new ArrayList<>();
list.add(5); // auto-resizes if needed
```

---

### 2.2 Strings

A String is essentially an array of `char` values. But in Java, Strings have a crucial property that catches many beginners off guard: **immutability**.

**What does immutable mean?**

Once a `String` object is created, its characters cannot change. Any operation that appears to "modify" a String actually creates a brand-new String object.

```
Before: str → [ H | e | l | l | o ]   (address: 0x1000)

str += " World"

After:  str → [ H | e | l | l | o |   | W | o | r | l | d ]  (NEW address: 0x2000)
               (the old object at 0x1000 is now garbage-collected)
```

**The $O(N^2)$ trap — String concatenation in loops:**

```java
// ❌ WRONG — O(N²) time: creates N new String objects
String result = "";
for (int i = 0; i < n; i++) {
    result += chars[i]; // new String created every iteration!
}

// ✅ CORRECT — O(N) time: StringBuilder modifies in-place
StringBuilder sb = new StringBuilder();
for (int i = 0; i < n; i++) {
    sb.append(chars[i]);
}
String result = sb.toString(); // only one final conversion
```

**Why is the first one $O(N^2)$?** On iteration `i`, the current string has length `i`, so copying it takes $O(i)$ time. Summing from `i = 0` to `N`: $0 + 1 + 2 + ... + N = O(N^2)$.

**Key String methods in Java to remember:**

```java
String s = "Hello, World";

s.length()               // 12
s.charAt(0)              // 'H'
s.substring(7)           // "World"
s.substring(7, 12)       // "World" (end index is EXCLUSIVE)
s.indexOf('o')           // 4 (first occurrence)
s.lastIndexOf('o')       // 8
s.contains("World")      // true
s.equals("Hello, World") // true — ALWAYS use equals(), not ==
s.toLowerCase()          // "hello, world"
s.toUpperCase()          // "HELLO, WORLD"
s.trim()                 // removes leading/trailing whitespace
s.replace('l', 'r')      // "Herro, Worrd"
s.split(", ")            // ["Hello", "World"]
s.toCharArray()          // converts to char[] for easy manipulation
String.valueOf(42)       // "42" — int to String
Integer.parseInt("42")   // 42  — String to int
```

> **Interview Tip:** When a problem says "reverse a String" or "check if palindrome", convert to `char[]` first using `s.toCharArray()`. Modifying `char[]` is $O(1)$ per character and avoids the immutability problem.

---

### 2.3 Prefix Sums

#### The Core Idea

Imagine you work at a bank and customers keep asking: "What is the total balance deposited between day 3 and day 7?" If you recount from scratch each time, that is $O(N)$ per query. But if you precompute a running total each day, you can answer in $O(1)$: just subtract yesterday's running total from today's.

That running total array is the **Prefix Sum array**.

```
Original:  nums   = [ 1,  3,  2,  4,  5 ]
           index     [0]  [1]  [2]  [3]  [4]

Prefix:    prefix = [ 0,  1,  4,  6, 10, 15 ]  (1-indexed, prefix[0] = 0)
           index     [0] [1]  [2]  [3]  [4]  [5]
```

**Building the prefix array (1-indexed style — recommended):**

```
prefix[0] = 0
prefix[1] = prefix[0] + nums[0] = 0 + 1 = 1
prefix[2] = prefix[1] + nums[1] = 1 + 3 = 4
prefix[3] = prefix[2] + nums[2] = 4 + 2 = 6
prefix[4] = prefix[3] + nums[3] = 6 + 4 = 10
prefix[5] = prefix[4] + nums[4] = 10 + 5 = 15
```

**Range query using prefix sum:**

To get the sum from index `L` to `R` (both inclusive, 0-indexed in `nums`):

```
sum(L, R) = prefix[R+1] - prefix[L]
```

Visual proof for `sum(1, 3)` (sum of indices 1, 2, 3 = 3 + 2 + 4 = 9):
```
prefix[4] - prefix[1] = 10 - 1 = 9 ✅
```

**Why 1-indexed prefix?** It elegantly handles the edge case where `L = 0`. Without it, `prefix[L-1]` would be `prefix[-1]` which is out of bounds. With 1-indexed, `prefix[L]` where `L=0` gives `prefix[0] = 0`, which is correct.

**2D Prefix Sums (for matrix problems):**

The same idea extends to 2D. For a matrix, `prefix[i][j]` = sum of all elements in the rectangle from `(0,0)` to `(i-1, j-1)`.

```
Query: sum of rectangle from (r1,c1) to (r2,c2) =
    prefix[r2+1][c2+1]
  - prefix[r1][c2+1]
  - prefix[r2+1][c1]
  + prefix[r1][c1]        // add back the doubly-subtracted corner
```

```java
// Building 2D prefix sum
int[][] prefix = new int[m + 1][n + 1];
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        prefix[i][j] = matrix[i-1][j-1]
                     + prefix[i-1][j]
                     + prefix[i][j-1]
                     - prefix[i-1][j-1]; // subtract double-counted corner
    }
}
```

---

## 3. Code Templates (Java)

### Template 1: Building a Prefix Sum Array (1-indexed — Recommended)

```java
public long[] buildPrefixSum(int[] nums) {
    if (nums == null || nums.length == 0) return new long[0];
    
    long[] prefix = new long[nums.length + 1]; // size n+1, prefix[0] = 0
    for (int i = 0; i < nums.length; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }
    return prefix;
}
```

> Use `long[]` instead of `int[]` as a safe default — sums often overflow `int` in interviews.

### Template 2: Range Sum Query

```java
// Returns sum of nums[left..right] inclusive (0-indexed)
public long rangeSum(long[] prefix, int left, int right) {
    return prefix[right + 1] - prefix[left];
}
```

### Template 3: Prefix Sum + HashMap (for subarray sum = k)

This is one of the most important patterns. It finds the number of subarrays whose sum equals `k`.

**The key insight:** If `prefix[j] - prefix[i] = k`, then subarray `[i, j-1]` has sum `k`. Rearranging: `prefix[i] = prefix[j] - k`. So as we compute `prefix[j]`, we check how many times `prefix[j] - k` has appeared before.

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1); // empty prefix (sum=0) seen once
    
    int runningSum = 0;
    int count = 0;
    
    for (int num : nums) {
        runningSum += num;
        // How many previous prefixes make a valid subarray ending here?
        count += prefixCount.getOrDefault(runningSum - k, 0);
        // Record this prefix sum
        prefixCount.merge(runningSum, 1, Integer::sum);
    }
    return count;
}
```

### Template 4: StringBuilder for String Construction

```java
public String buildString(char[] chars) {
    StringBuilder sb = new StringBuilder();
    for (char c : chars) {
        sb.append(c);           // O(1) amortized
    }
    return sb.toString();       // final O(N) conversion
}

// Other useful StringBuilder operations:
sb.insert(0, 'X');             // insert at index
sb.deleteCharAt(sb.length()-1); // delete last char
sb.reverse();                  // reverse in-place O(N)
sb.charAt(i);                  // read at index
sb.setCharAt(i, 'A');          // modify at index
```

### Template 5: Frequency Array (faster than HashMap for bounded input)

```java
// For lowercase English letters only
int[] freq = new int[26];
for (char c : s.toCharArray()) {
    freq[c - 'a']++;
}

// Check anagram: compare two frequency arrays
boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] freq = new int[26];
    for (char c : s.toCharArray()) freq[c - 'a']++;
    for (char c : t.toCharArray()) freq[c - 'a']--;
    for (int f : freq) if (f != 0) return false;
    return true;
}
```

---

## 4. Problem-Solving Framework

When you see a new problem in an interview, follow this structured mental process before writing any code.

### Step 1 — Understand & Clarify (2 minutes)
Ask these questions before anything else:
- What is the input type and size? (`n` up to 10^5? 10^9?)
- Are there negative numbers? (Breaks some prefix sum assumptions)
- Can there be duplicates?
- Is the array/string static or will it be updated?
- What should be returned on empty input or no answer found?
- Can the sum/product overflow `int`? (Use `long` defensively)

### Step 2 — Think Aloud with Examples (3 minutes)
Always trace through at least 2 examples manually (including an edge case like empty array, single element, all negatives). This often reveals the pattern.

### Step 3 — Identify the Pattern (see Section 5 below)

### Step 4 — State Brute Force First
Always mention the brute force approach. This shows the interviewer you understand the problem. Then explain why it is too slow and what optimization you are applying.

### Step 5 — Code the Optimized Solution
Write clean, readable Java. Use meaningful variable names. Add a comment if a formula is non-obvious.

### Step 6 — Trace Through Your Code
After writing, manually walk through your code with the example input. Catch off-by-one errors before the interviewer does.

### Step 7 — Analyze Complexity
State both Time and Space complexity. Explain *why*, not just *what*.

---

## 5. Pattern Recognition Guide

### How to Spot the Right Pattern

**Signal → Pattern mapping:**

| What the problem says or implies                                     | Pattern to reach for                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| "Sum/min/max of subarray between indices i and j", called many times | **Prefix Sum**                                                    |
| "Find a subarray with sum = k"                                       | **Prefix Sum + HashMap**                                          |
| "Equilibrium index", "left sum = right sum"                          | **Prefix Sum** (compute total first, then track running left sum) |
| "Majority element" (appears > n/2 times)                             | **Boyer-Moore Voting**                                            |
| "Product of array except self" (no division)                         | **Prefix product + Suffix product**                               |
| "Anagram check" / "same character frequencies"                       | **Frequency array `int[26]`**                                     |
| "Longest substring without repeating characters"                     | **Sliding Window + HashSet/array**                                |
| "Concatenate strings in a loop"                                      | **StringBuilder**                                                 |
| "Static array, millions of range queries"                            | **Prefix Sum precompute**                                         |
| "Dynamic array (updates) + range queries"                            | **Segment Tree or Fenwick Tree**                                  |
| "2D matrix, sum of rectangle"                                        | **2D Prefix Sum**                                                 |
| "Find the first/last occurrence of target"                           | **Two Pointers or Binary Search**                                 |

### Detailed Recognition Walkthroughs

#### Recognizing Prefix Sum + HashMap (LC 560 — Subarray Sum = K)

When you see: **"count subarrays with sum equal to k"** where values can be negative (so sliding window won't work), think:

1. "I need to know sums of all subarrays" → too slow to compute each one.
2. "If I have a prefix sum at index j, I need to know if `prefix[j] - k` existed earlier" → HashMap.
3. Seed the map with `{0: 1}` because an empty prefix (sum = 0) exists before any elements.

#### Recognizing Equilibrium Index (LC 724 — Find Pivot Index)

When you see: **"find an index where left side = right side"**:

1. "I need leftSum and rightSum at every index" → recomputing both each time = $O(N^2)$.
2. "If I know totalSum upfront, then rightSum = totalSum - leftSum - nums[i]" → one pass, $O(N)$.

#### Recognizing Product Except Self (LC 238)

When you see: **"product of all elements except current, no division allowed"**:

1. "The product to the left of index i" = prefix product.
2. "The product to the right of index i" = suffix product.
3. Answer at index i = leftProduct[i] * rightProduct[i].
4. Optimization: compute left products in first pass, accumulate right product on-the-fly in second pass → $O(1)$ extra space.

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Off-by-One in Prefix Sum
```java
// Building prefix (1-indexed):
// prefix has size n+1, and prefix[0] = 0 (implicit)
long[] prefix = new long[n + 1];
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + nums[i]; // ✅ correct
}

// Querying sum of nums[L..R] (0-indexed):
long sum = prefix[R + 1] - prefix[L]; // ✅ correct

// ❌ Common errors:
long sum = prefix[R] - prefix[L];     // misses nums[R]
long sum = prefix[R] - prefix[L - 1]; // crashes when L=0
```

### Mistake 2: Integer Overflow
```java
// ❌ Overflow risk — int can hold ~2.1 billion max
int[] prefix = new int[n + 1];
prefix[i + 1] = prefix[i] + nums[i];

// ✅ Safe — use long for cumulative sums
long[] prefix = new long[n + 1];
prefix[i + 1] = prefix[i] + (long) nums[i]; // cast to long before addition
```

### Mistake 3: `==` vs `.equals()` for Strings
```java
String a = new String("hello");
String b = new String("hello");

a == b        // ❌ false — compares object references (memory addresses)
a.equals(b)   // ✅ true  — compares character content

// Only use == for: primitives (int, char, boolean...) and enum comparisons
```

### Mistake 4: Modifying a String Instead of Using StringBuilder
```java
// ❌ O(N²) — creates new String each time
String s = "abcde";
s = s.replace('a', 'x'); // ok for one-time use
// In a loop — never do this

// ✅ O(N) — use char[] for in-place modification
char[] chars = s.toCharArray();
for (int l = 0, r = chars.length - 1; l < r; l++, r--) {
    char temp = chars[l];
    chars[l] = chars[r];
    chars[r] = temp;
}
String reversed = new String(chars);
```

### Mistake 5: Forgetting to Handle Empty/Null Input
```java
// ✅ Always guard at the top of your method:
public int[] buildPrefixSum(int[] nums) {
    if (nums == null || nums.length == 0) return new int[0];
    // ... rest of logic
}
```

### Mistake 6: Using HashMap When a Simple Array Suffices
```java
// ❌ Slower, more verbose
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) {
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}

// ✅ Faster, simpler — when input is bounded (e.g., lowercase letters)
int[] freq = new int[26];
for (char c : s.toCharArray()) {
    freq[c - 'a']++;
}
```

---

## 7. Worked Examples

### Example 1: LeetCode 303 — Range Sum Query (Immutable)

**Problem:** Given an integer array `nums`, handle multiple queries to calculate the sum of the elements between indices `left` and `right`.

**Thinking process:**
1. Brute force: iterate from `left` to `right` each query → $O(N)$ per query.
2. "Multiple queries on a static array" → Prefix Sum precompute.
3. Precompute in $O(N)$, answer each query in $O(1)$.

```java
class NumArray {
    private long[] prefix;

    public NumArray(int[] nums) {
        prefix = new long[nums.length + 1]; // 1-indexed
        for (int i = 0; i < nums.length; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }
    
    public long sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}
```

*Time: $O(N)$ build, $O(1)$ per query. Space: $O(N)$.*

---

### Example 2: LeetCode 724 — Find Pivot Index

**Problem:** Find the index where the sum of all numbers strictly to the left equals the sum strictly to the right.

**Thinking process:**
1. At each index `i`: leftSum = sum of `[0, i-1]`, rightSum = sum of `[i+1, n-1]`.
2. Recomputing each time = $O(N^2)$.
3. If we know `totalSum` upfront: `rightSum = totalSum - leftSum - nums[i]`. One variable tracks `leftSum` as we move forward → $O(N)$.

```java
class Solution {
    public int pivotIndex(int[] nums) {
        int totalSum = 0;
        for (int num : nums) totalSum += num;
        
        int leftSum = 0;
        for (int i = 0; i < nums.length; i++) {
            int rightSum = totalSum - leftSum - nums[i];
            if (leftSum == rightSum) return i;
            leftSum += nums[i];
        }
        return -1;
    }
}
```

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 3: LeetCode 560 — Subarray Sum Equals K *(Crucial)*

**Problem:** Given an array of integers `nums` and an integer `k`, return the total number of subarrays whose sum equals `k`.

**Thinking process:**
1. Note that values can be negative → sliding window won't work (can't guarantee monotonicity).
2. Brute force: check all pairs `(i, j)` → $O(N^2)$.
3. Key formula: `sum(i, j) = prefix[j] - prefix[i-1]`. We want this = k, so `prefix[i-1] = prefix[j] - k`.
4. As we scan left to right, for each `prefix[j]`, look up how many previous prefix values equal `prefix[j] - k` → HashMap.
5. Seed map with `{0: 1}` — before index 0, there is one prefix sum of 0 (the empty prefix).

```java
class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1); // crucial: the empty prefix
        
        int runningSum = 0, count = 0;
        for (int num : nums) {
            runningSum += num;
            // If (runningSum - k) was seen before, those are valid subarrays
            count += prefixCount.getOrDefault(runningSum - k, 0);
            prefixCount.merge(runningSum, 1, Integer::sum);
        }
        return count;
    }
}
```

*Time: $O(N)$. Space: $O(N)$ for the HashMap.*

**Dry run with `nums = [1, 1, 1]`, `k = 2`:**

| i   | num | runningSum | runningSum-k | count | map                  |
| --- | --- | ---------- | ------------ | ----- | -------------------- |
| -   | -   | 0          | -            | 0     | `{0:1}`                |
| 0   | 1   | 1          | -1           | 0     | `{0:1, 1:1}`           |
| 1   | 1   | 2          | 0            | 1     | `{0:1, 1:1, 2:1}`      |
| 2   | 1   | 3          | 1            | 2     | `{0:1, 1:1, 2:1, 3:1}` |

Result: 2 ✅ (subarrays [1,1] starting at index 0 and index 1)

---

### Example 4: LeetCode 238 — Product of Array Except Self

**Problem:** Return an array where `output[i]` is the product of all elements except `nums[i]`. No division allowed. $O(N)$ time.

**Thinking process:**
1. `output[i] = (product of all elements to the LEFT of i) * (product of all elements to the RIGHT of i)`.
2. Compute left products in one pass, right products in another.
3. To achieve $O(1)$ extra space: store left products in `output[]`, then multiply right products on the fly in a second reverse pass.

```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] output = new int[n];
        
        // Pass 1: output[i] = product of all elements to the left of i
        output[0] = 1;
        for (int i = 1; i < n; i++) {
            output[i] = output[i - 1] * nums[i - 1];
        }
        // output = [1, 1, 2, 6] for nums=[1,2,3,4]
        
        // Pass 2: multiply by suffix product (tracked in variable)
        int rightProduct = 1;
        for (int i = n - 1; i >= 0; i--) {
            output[i] *= rightProduct;
            rightProduct *= nums[i];
        }
        return output;
    }
}
```

*Time: $O(N)$. Space: $O(1)$ extra (output array doesn't count).*

---

## 8. Decision Tree: Which Data Structure / Approach?

```
Is the problem about a range of indices (sum, min, max)?
├── Yes → Is the array static (no updates)?
│          ├── Yes → Prefix Sum (O(1) per query after O(N) build)
│          └── No  → Segment Tree or Fenwick Tree (O(log N) per update/query)
└── No  → Is the problem about counting/frequency?
           ├── Input bounded (e.g., a-z, 0-9)?  → int[] frequency array
           └── Input unbounded?                  → HashMap

Is the problem about subarrays?
├── All positives → Sliding Window (two pointers)
└── Can be negative → Prefix Sum + HashMap

Is the problem a String manipulation?
├── Multiple operations in loop? → StringBuilder
├── Frequency comparison?       → int[26] array
└── Substring search?           → indexOf() or KMP (advanced)
```

---

## 9. 7-Day Practice Plan (21 Problems)

Aim to complete 3 problems a day. Do not spend more than 45 minutes on a single problem. If you are stuck, read the solution, understand the pattern, and then code it **from scratch without looking** — this is the most important habit.

**For each problem, practice this ritual:**
1. Read the problem (2 min).
2. Ask yourself clarifying questions out loud (2 min).
3. Write the brute force approach and its complexity (3 min).
4. Identify the pattern and write the optimized solution (20-35 min).
5. Trace through your code manually.
6. State Time and Space complexity.

---

**Day 1: Array Basics**
1. [Build Array from Permutation (LC 1920)](https://leetcode.com/problems/build-array-from-permutation/) — Warm-up: direct index manipulation
2. [Concatenation of Array (LC 1929)](https://leetcode.com/problems/concatenation-of-array/) — Array duplication pattern
3. [Contains Duplicate (LC 217)](https://leetcode.com/problems/contains-duplicate/) — HashSet for O(1) lookup

**Day 2: String Basics & Traversal**
4. [Valid Anagram (LC 242)](https://leetcode.com/problems/valid-anagram/) — Frequency array `int[26]`
5. [Length of Last Word (LC 58)](https://leetcode.com/problems/length-of-last-word/) — String traversal, trim
6. [Find the Index of the First Occurrence in a String (LC 28)](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/) — String search, `indexOf`

**Day 3: Introduction to Prefix Sums**
7. [Running Sum of 1d Array (LC 1480)](https://leetcode.com/problems/running-sum-of-1d-array/) — Build prefix sum array directly
8. [Range Sum Query - Immutable (LC 303)](https://leetcode.com/problems/range-sum-query-immutable/) — Classic prefix sum query
9. [Find Pivot Index (LC 724)](https://leetcode.com/problems/find-pivot-index/) — Prefix sum + total sum trick

**Day 4: Array Counting & Math**
10. [Majority Element (LC 169)](https://leetcode.com/problems/majority-element/) — Boyer-Moore Voting Algorithm
11. [Kids With the Greatest Number of Candies (LC 1431)](https://leetcode.com/problems/kids-with-the-greatest-number-of-candies/) — Find max first, then compare
12. [Number of Good Pairs (LC 1512)](https://leetcode.com/problems/number-of-good-pairs/) — Frequency counting with HashMap

**Day 5: Intermediate Array Patterns**
13. [Product of Array Except Self (LC 238)](https://leetcode.com/problems/product-of-array-except-self/) — Prefix + suffix products
14. [Subarray Sum Equals K (LC 560)](https://leetcode.com/problems/subarray-sum-equals-k/) ⭐ — *Crucial: Prefix Sum + HashMap*
15. [Maximum Subarray (LC 53)](https://leetcode.com/problems/maximum-subarray/) — Kadane's Algorithm

**Day 6: Matrix & 2D Arrays**
16. [Richest Customer Wealth (LC 1672)](https://leetcode.com/problems/richest-customer-wealth/) — 2D array row sum
17. [Matrix Diagonal Sum (LC 1572)](https://leetcode.com/problems/matrix-diagonal-sum/) — Index math for diagonals
18. [Spiral Matrix (LC 54)](https://leetcode.com/problems/spiral-matrix/) — Boundary tracking pattern

**Day 7: String Manipulation & Optimization**
19. [Longest Common Prefix (LC 14)](https://leetcode.com/problems/longest-common-prefix/) — Vertical scan or sort trick
20. [Group Anagrams (LC 49)](https://leetcode.com/problems/group-anagrams/) — HashMap with sorted-string key
21. [Encode and Decode Strings (LC 271)](https://leetcode.com/problems/encode-and-decode-strings/) — Length-prefix encoding

---

## 10. Complexity Cheat Sheet

| Operation                         | Time            | Space           |
| --------------------------------- | --------------- | --------------- |
| Build prefix sum (1D)             | $O(N)$          | $O(N)$          |
| Range sum query (with prefix)     | $O(1)$          | $O(1)$          |
| Build prefix sum (2D)             | $O(M \times N)$ | $O(M \times N)$ |
| Range sum query (2D)              | $O(1)$          | $O(1)$          |
| String concatenation in loop      | $O(N^2)$        | $O(N)$          |
| StringBuilder append N times      | $O(N)$          | $O(N)$          |
| Frequency array build             | $O(N)$          | $O(1)$*         |
| HashMap frequency build           | $O(N)$          | $O(N)$          |
| Subarray sum = k (Prefix+HashMap) | $O(N)$          | $O(N)$          |
| Product except self               | $O(N)$          | $O(1)$ extra    |

*$O(1)$ space because array size is constant (e.g., 26 for lowercase letters).

---

## 11. Mock Interview Module

### Problem: The Weighted Warehouse Query

**Context:** You are managing inventory for a massive e-commerce warehouse. The inventory is stored in a long line of numbered bins from `0` to `n-1`. The array `inventory[]` represents the number of items in each bin.

Because bins further down the line are harder to reach, retrieving items from them costs more energy. The "retrieval cost" of an item in bin `i` is defined as `inventory[i] * i`.

**Question:** Write a class `Warehouse` initialized with an `inventory` array. Implement `getRetrievalCost(int L, int R)` that returns the total retrieval cost for all items in bins from index `L` to `R` inclusive. This method will be called millions of times per day.

---

#### Step 1: Clarifying Questions & Expected Answers

Before writing a single line of code, ask:

| Candidate asks                        | Interviewer answers | Why it matters               |
| ------------------------------------- | ------------------- | ---------------------------- |
| "Can `L` equal `R`?"                  | Yes                 | Single-bin query must work   |
| "Is the inventory static or updated?" | Static              | Confirms Prefix Sum is valid |
| "Can totals exceed `int` range?"      | Yes                 | Use `long`                   |
| "Can inventory values be negative?"   | No, always ≥ 0      | No negative-sum edge cases   |
| "What do we return if `L > R`?"       | Assume valid input  | Simplifies bounds checking   |

---

#### Step 2: Brute Force Solution

```java
// Time: O(N) per query, Space: O(1)
class Warehouse {
    private int[] inventory;
    public Warehouse(int[] inventory) { this.inventory = inventory; }

    public long getRetrievalCost(int L, int R) {
        long cost = 0;
        for (int i = L; i <= R; i++) {
            cost += (long) inventory[i] * i;
        }
        return cost;
    }
}
```

**Explain to interviewer:** "This works but is $O(N)$ per query. With millions of daily calls on a warehouse of 100,000 bins, that's potentially $10^{10}$ operations — too slow. I want to precompute so each query is $O(1)$."

---

#### Step 3: Optimized Solution (Prefix Sums)

**Insight:** The key observation is `cost(i) = inventory[i] * i`. This is just a *weighted value*. We can define `weighted[i] = inventory[i] * i` and build a standard prefix sum over these weighted values.

```java
class Warehouse {
    private long[] weightedPrefix;

    // O(N) initialization
    public Warehouse(int[] inventory) {
        int n = inventory.length;
        weightedPrefix = new long[n + 1]; // 1-indexed
        for (int i = 0; i < n; i++) {
            long weight = (long) inventory[i] * i; // cast before multiply!
            weightedPrefix[i + 1] = weightedPrefix[i] + weight;
        }
    }

    // O(1) per query
    public long getRetrievalCost(int L, int R) {
        return weightedPrefix[R + 1] - weightedPrefix[L];
    }
}
```

**Complexity:** $O(N)$ build time, $O(1)$ per query, $O(N)$ space.

---

#### Step 4: Follow-up Questions & Expected Answers

**Q1:** "What if the inventory is dynamic — workers restock bins with `update(index, newVal)`?"

| Approach               | update()        | getRetrievalCost() | Best for     |
| ---------------------- | --------------- | ------------------ | ------------ |
| Brute force array      | $O(1)$          | $O(N)$             | Few queries  |
| Prefix Sum             | $O(N)$ rebuild  | $O(1)$             | Few updates  |
| **Fenwick Tree / BIT** | **$O(\log N)$** | **$O(\log N)$**    | **Balanced** |
| **Segment Tree**       | **$O(\log N)$** | **$O(\log N)$**    | **Balanced** |

*Expected answer:* "If we need both operations to be efficient, I would use a **Binary Indexed Tree (Fenwick Tree)** or a **Segment Tree**, achieving $O(\log N)$ for both. This is the classic tradeoff — static data favors prefix sum, dynamic data favors tree-based structures."

**Q2:** "What if we also need `min(L, R)` and `max(L, R)` queries, not just `sum`?"

*Expected answer:* "A prefix sum works for sum because it is associative and has an inverse (subtraction). But `min` and `max` have no inverse — you can't determine `min(L, R)` from `min(0, R)` and `min(0, L-1)`. For these, a **Segment Tree** or **Sparse Table** (for static, $O(1)$ RMQ) is the right tool."

---

## 12. Quick Reference: Java Idioms for Arrays & Strings

```java
// ── ARRAYS ──────────────────────────────────────────────────────────────
int[] arr = new int[n];                      // declare, all zeros
int[] arr = {1, 2, 3};                       // inline init
Arrays.fill(arr, -1);                        // fill with value
Arrays.sort(arr);                            // sort O(N log N)
Arrays.copyOf(arr, newLen);                  // copy with new length
Arrays.copyOfRange(arr, from, to);           // copy subarray [from, to)
System.arraycopy(src, srcPos, dst, dstPos, len); // fastest bulk copy
int[] clone = arr.clone();                   // shallow copy

// Convert between array and list
List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3));
Integer[] boxed = list.toArray(new Integer[0]);

// ── STRINGS ─────────────────────────────────────────────────────────────
char[] chars = s.toCharArray();              // String → char[]
String s = new String(chars);               // char[] → String
String s = String.valueOf(chars);           // char[] → String (same result)
char c = s.charAt(i);                       // single char access O(1)
int codePoint = c - 'a';                    // char to 0-25 index
String sub = s.substring(l, r);            // [l, r) — r is exclusive!

// StringBuilder quick reference
StringBuilder sb = new StringBuilder(s);    // init with existing string
sb.append("abc");                           // add to end
sb.insert(i, "abc");                        // insert at index
sb.delete(l, r);                            // delete [l, r)
sb.deleteCharAt(i);                         // delete one char
sb.reverse();                               // in-place reverse
sb.length();                                // current length
sb.toString();                              // convert back to String

// ── USEFUL MATH ─────────────────────────────────────────────────────────
Math.max(a, b);
Math.min(a, b);
Math.abs(x);
(int) Math.ceil((double) a / b);            // ceiling division
a / b + (a % b != 0 ? 1 : 0);             // ceiling division (integer only)
```