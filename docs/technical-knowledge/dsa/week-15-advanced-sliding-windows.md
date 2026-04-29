---
id: week-15-advanced-sliding-windows
title: "Week 15: Advanced Sliding Windows"
description: Master the variable-size sliding window pattern in Java. Learn to dynamically expand and shrink boundaries to solve complex substring, subarray, and stream processing problems.
tags: [dsa, java, sliding-window, two-pointers, algorithms, week-15]
sidebar_position: 15
---

# Week 15: Advanced Sliding Windows

## 1. Overview

Welcome to Week 15! Back in Week 2, we looked at *Fixed-Size* Sliding Windows, where the distance between the left and right pointers remained perfectly constant. This week, we upgrade to the **Variable-Size Sliding Window** — one of the most frequently tested patterns in modern interviews.

Instead of looking at fixed chunks, you dynamically **expand** your window to ingest data until a condition is met (or violated), then **shrink** the window from behind to restore validity. This is the core logic behind TCP congestion control, API rate limiting, and real-time anomaly detection in distributed systems.

### Fixed vs. Variable — The Critical Difference

```
Fixed-size (Week 2):               Variable-size (this week):
Window = [left ────── right]       Window = [left ──→ right]
         constant k apart                   size changes!

right always moves at same pace.   right expands freely.
left always follows at distance k. left catches up when window becomes invalid.

Best for: max sum of k elements    Best for: longest/shortest substring
          average of k elements             matching a dynamic condition
```

**Goals for this week:**
- Understand the "Expand Right, Shrink Left" lifecycle and its invariants.
- Learn how to maintain window state efficiently (arrays vs. HashMaps).
- Master two distinct templates: Longest valid window vs. Shortest valid window.
- Learn the "Exact K = At Most K minus At Most K-1" trick for exact count problems.
- Avoid the most common subtle bugs: when to check `if` vs. `while` for shrinking.

### Knowledge You Need Before Starting

- Fixed-window confidence from Week 2.
- HashMap/frequency-array fluency from Week 4.
- Strong pointer invariant tracking (`left`, `right`, validity condition).
- Comfort proving each pointer moves at most N times.

---

## 2. The Core Mental Models

### 2.1 The "Elastic Band" Model

Imagine a rubber band stretched between two fingers on a number line. Your right hand pulls the right end forward (expanding). When the band becomes "too stretched" (window invalid), your left hand pushes the left end forward (shrinking) until the tension is acceptable again.

```
nums = [2, 3, 1, 2, 4, 3],  target = 7 (find shortest subarray with sum >= 7)

     L R                        sum=2  < 7  → expand right
     L   R                      sum=5  < 7  → expand right
     L     R                    sum=6  < 7  → expand right
     L       R                  sum=8  >= 7 → VALID! record 4, shrink left
       L     R                  sum=6  < 7  → expand right (left moved, so re-expand)
       L       R                sum=10 >= 7 → VALID! record 3, shrink left
         L     R                sum=7  >= 7 → VALID! record 2, shrink left
           L   R                sum=3  < 7  → expand right
           L     R              sum=7  >= 7 → VALID! record 2
                                             
Answer: 2  (subarray [4,3]) ✅
```

**The elastic band never "jumps" — both hands move forward only.** Left never passes right. Right never goes backward. Total moves: at most `2N`. Therefore always $O(N)$.

---

### 2.2 The Two Lifecycle Templates — Side by Side

The critical structural difference between "longest" and "shortest" problems:

```
LONGEST (max window):                 SHORTEST (min window):

for each right:                       for each right:
  add right to state                    add right to state
                                        
  // Shrink UNTIL valid:                // Shrink WHILE valid:
  while state is INVALID:               while state is VALID:
    remove left from state                record current length
    left++                                remove left from state
                                          left++
  // Now window is valid:
  record current length               // Window just became invalid
                                      // (or loop finished)
```

**The `while` condition is opposite:**
- Longest: shrink **while INVALID** — stop as soon as valid, then record.
- Shortest: shrink **while VALID** — record before shrinking, stop when invalid.

---

### 2.3 Window State Tracking — Array vs. HashMap

The "state" of your window is what you track to determine if it's valid. The choice of data structure dramatically affects performance:

| Element Type                | Structure                     | Lookup            | Why                   |
| --------------------------- | ----------------------------- | ----------------- | --------------------- |
| Characters (lowercase only) | `int[26]`                     | $O(1)$, no boxing | Index = `c - 'a'`     |
| Characters (ASCII)          | `int[128]`                    | $O(1)$, no boxing | Index = `(int) c`     |
| Characters (Unicode)        | `HashMap<Character, Integer>` | $O(1)$ amortized  | When range > 128      |
| Integers                    | `HashMap<Integer, Integer>`   | $O(1)$ amortized  | Arbitrary range       |
| Integers (small range 0-N)  | `int[N]`                      | $O(1)$, no boxing | When range is bounded |

**Why does the array vs. HashMap matter for characters?**

```java
// HashMap approach — what's happening under the hood:
map.put('a', map.getOrDefault('a', 0) + 1);
// → Boxes char 'a' into Character object
// → Computes hash of Character object
// → Finds bucket in HashMap internal array
// → Checks equality on key
// → Boxes int into Integer for storage
// 5+ operations, potential GC pressure

// Array approach — what's happening:
charCount['a']++;   // Or: charCount[(int)'a']++
// → Direct array index access
// → Single memory read-modify-write
// 1 operation, zero object allocation
```

For a string of length $10^5$ processed by a sliding window, the HashMap approach creates hundreds of thousands of temporary `Character` and `Integer` objects, triggering garbage collection pauses. The array approach creates zero objects.

---

### 2.4 The `matched` Counter — Avoiding Full Window Re-scan

A naive validity check would re-scan the entire window on every step. The `matched` counter eliminates this:

```
required = {'A': 2, 'B': 1}   (need 2 A's and 1 B)
requiredMatches = 2            (need 2 distinct service requirements satisfied)

                               matched tracks how many DISTINCT requirements
                               are FULLY satisfied (not total characters).

Window gains 'A': windowState['A'] goes 0→1. Need 2, have 1. matched stays 0.
Window gains 'A': windowState['A'] goes 1→2. Need 2, have 2. matched++ → 1.
Window gains 'B': windowState['B'] goes 0→1. Need 1, have 1. matched++ → 2.
matched == requiredMatches (2 == 2) → VALID! ✅

Now shrink: remove 'A' from left.
windowState['A'] goes 2→1. Need 2, have 1. matched-- → 1.
matched < requiredMatches → INVALID again.
```

**Critical detail:** `matched` increments when `windowState[c] == required[c]` (exactly reaches requirement). It decrements when `windowState[c] < required[c]` (drops below requirement). It does NOT change when going above required count (having more than needed is still valid).

---

## 3. Theory & Fundamentals

### 3.1 The "At Most K" Pattern — Converting Exact to Range Problems

Some problems ask "how many subarrays have **exactly** K occurrences of X?" Exact counts are tricky to handle directly with sliding windows because the window can't stay "exactly at K" — it's either below or above.

**The trick:**

```
f(exactly K) = f(at most K) - f(at most K-1)

Why? "At most K" counts subarrays with 0,1,2,...,K occurrences.
     "At most K-1" counts subarrays with 0,1,2,...,K-1 occurrences.
     The difference = subarrays with exactly K occurrences. ✅
```

This converts a hard exact-count problem into two applications of the "at most" template, each of which is straightforward sliding window.

```java
public int exactlyK(int[] nums, int k) {
    return atMostK(nums, k) - atMostK(nums, k - 1);
}

private int atMostK(int[] nums, int k) {
    // Standard "longest" sliding window, but counting subarrays instead of tracking max length
    int left = 0, count = 0, distinct = 0;
    Map<Integer, Integer> freq = new HashMap<>();

    for (int right = 0; right < nums.length; right++) {
        if (freq.merge(nums[right], 1, Integer::sum) == 1) distinct++;

        while (distinct > k) {
            if (freq.merge(nums[left], -1, Integer::sum) == 0) {
                freq.remove(nums[left]);
                distinct--;
            }
            left++;
        }

        count += right - left + 1;  // All subarrays ending at right with left<=start<=right
    }
    return count;
}
```

**Why `count += right - left + 1`?** For each position of `right`, the valid subarrays ending at `right` start anywhere from `left` to `right`. That's `right - left + 1` subarrays.

---

### 3.2 When to Use `if` vs. `while` for Shrinking

This is the single most common confusion in sliding window code:

```java
// Use `while` (most problems): shrink repeatedly until window is valid/invalid
while (invalid condition) {
    removeLeft();
    left++;
}
// Use this when: you need to find the minimum window, or when a single shrink
// step might not restore validity (e.g., removing one element might still leave
// the window invalid).

// Use `if` (rare optimization): when you KNOW one shrink step is always enough
if (right - left + 1 > k) {  // Window exceeded fixed size k
    removeLeft();
    left++;
}
// Use this ONLY for fixed-size windows where you're guaranteed the window is
// at most 1 element too large. Sliding it by exactly 1 always suffices.
```

---

### 3.3 Invariant Analysis — Why Sliding Windows Are Always $O(N)$

A common interview question: "Doesn't the nested `while` loop make this $O(N^2)$?"

**The answer:** No, because of the invariant that **left only moves forward, never backward.**

```
Total operations = (number of right moves) + (number of left moves)
                 = at most N              + at most N
                 = 2N
                 = O(N)

Each element is added to the window exactly once (when right passes over it).
Each element is removed from the window at most once (when left passes over it).
The inner while loop can only execute as many times total as left can advance.
Left can advance at most N times total across the entire outer loop.
Therefore, the while loop executes at most N times total — not N times per iteration.
```

This amortized analysis is crucial to explain clearly in interviews.

---

## 4. Code Templates (Java)

### Template 1: Longest / Maximum Window

```java
public int findLongestWindow(int[] nums, int k) {
    int left = 0;
    int maxLength = 0;
    // Window state: tracks whatever the problem constrains
    // (sum, count of distinct elements, count of specific value, etc.)
    int windowState = 0;

    for (int right = 0; right < nums.length; right++) {
        // Step 1: Expand — add nums[right] to window state
        windowState += nums[right];  // Customize for your problem

        // Step 2: Shrink — while window is INVALID, shrink from left
        while (windowState > k) {   // Customize invalid condition
            windowState -= nums[left];
            left++;
        }

        // Step 3: Record — window is now valid, update max
        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}
```

**Key structural points:**
- `right` moves forward unconditionally in the outer `for` loop.
- `left` moves forward only inside the `while` (never in the `for`).
- Record length AFTER shrinking (window is guaranteed valid here).

---

### Template 2: Shortest / Minimum Window

```java
public int findShortestWindow(int[] nums, int target) {
    int left = 0;
    int minLength = Integer.MAX_VALUE;
    int windowState = 0;

    for (int right = 0; right < nums.length; right++) {
        // Step 1: Expand — add nums[right] to window state
        windowState += nums[right];

        // Step 2: While window is VALID, record and try to shrink further
        while (windowState >= target) {   // Customize valid condition
            minLength = Math.min(minLength, right - left + 1);  // Record BEFORE shrinking
            windowState -= nums[left];
            left++;
        }
    }

    return minLength == Integer.MAX_VALUE ? 0 : minLength;
}
```

**Key structural difference from Template 1:**
- We shrink `while VALID` (opposite of Template 1 which shrinks `while INVALID`).
- We record length **before** shrinking (to capture the current valid state).
- Shrinking continues as long as the window stays valid — finding the tightest valid window.

---

### Template 3: String Window with Frequency Array

```java
public int stringWindow(String s, String t) {
    int[] tFreq = new int[128];      // Required character frequencies
    int[] windowFreq = new int[128]; // Current window character frequencies
    for (char c : t.toCharArray()) tFreq[c]++;

    int left = 0, matched = 0;
    int result = 0;                  // Or Integer.MAX_VALUE for min problems
    int requiredMatches = t.length(); // Total characters to match (including duplicates)

    for (int right = 0; right < s.length(); right++) {
        char rc = s.charAt(right);
        windowFreq[rc]++;

        // Only count this character if it's needed AND we haven't over-counted
        if (tFreq[rc] > 0 && windowFreq[rc] <= tFreq[rc]) {
            matched++;
        }

        // Shrink while valid (min window) or after invalid (max window)
        while (matched == requiredMatches) {
            result = Math.min(result, right - left + 1); // For min window

            char lc = s.charAt(left);
            windowFreq[lc]--;
            if (tFreq[lc] > 0 && windowFreq[lc] < tFreq[lc]) {
                matched--;
            }
            left++;
        }
    }

    return result;
}
```

---

### Template 4: Exact Count = At Most K − At Most K-1

```java
public int exactlyK(int[] nums, int k) {
    return atMostK(nums, k) - atMostK(nums, k - 1);
}

private int atMostK(int[] nums, int k) {
    int left = 0, count = 0, distinct = 0;
    int[] freq = new int[100001]; // Adjust size to problem constraints

    for (int right = 0; right < nums.length; right++) {
        if (++freq[nums[right]] == 1) distinct++;  // New distinct element

        while (distinct > k) {
            if (--freq[nums[left]] == 0) distinct--;
            left++;
        }

        count += right - left + 1;  // All subarrays ending at right
    }
    return count;
}
```

---

## 5. Pattern Recognition Guide

### 5.1 The Decision Flowchart

```
                        START
                          │
        Does the problem involve a contiguous
        subarray or substring?
                          │
                    ┌─ YES ┴─ NO ──────────────────────────────┐
                    │                                          │
                    ▼                                          ▼
        Is the window size FIXED (given k)?         (Other: DP, HashMaps, etc.)
                    │
             ┌─ YES ┴─ NO ─────────────────────────────────────┐
             │                                                 │
             ▼                                                 │
        Fixed-Size Sliding Window (Week 2)                     │
             │                                                 │
             └──────────────────────── (Variable-Size below) ──┘
                                        │
                          What is the optimization goal?
                    ┌──────────┬──────────────┬───────────────┐
                    │          │              │               │
                    ▼          ▼              ▼               ▼
               "Longest"  "Shortest"    "Count all"    "Exactly K"
               "Maximum"  "Minimum"     valid windows  occurrences
                    │          │              │               │
                    ▼          ▼              ▼               ▼
             Template 1  Template 2     count +=         Template 4:
             shrink while shrink while  right-left+1    AtMostK -
             INVALID      VALID         inside valid    AtMostK(K-1)
             record after record before window          
             shrink       shrink
```

---

### 5.2 Keyword Trigger Table

| Problem Keywords                                     | Template          | Key State to Track                              |
| ---------------------------------------------------- | ----------------- | ----------------------------------------------- |
| "longest substring without repeating"                | Longest (T1)      | Char frequency array, shrink when any > 1       |
| "longest substring with at most K distinct"          | Longest (T1)      | Distinct char count, shrink when > K            |
| "max consecutive ones with at most K flips"          | Longest (T1)      | Count of zeros in window, shrink when > K       |
| "longest repeating char with at most K replacements" | Longest (T1)      | `window - maxFreq > K` is invalid               |
| "minimum size subarray sum >= target"                | Shortest (T2)     | Running sum, shrink while >= target             |
| "minimum window substring"                           | Shortest (T2)     | `matched` counter + freq arrays                 |
| "minimum operations to reduce X"                     | Shortest (T2)     | Reframe as: longest subarray summing to total−X |
| "number of subarrays with sum exactly K"             | Exact (T4)        | `AtMostK - AtMostK(K-1)`                        |
| "subarrays with exactly K distinct integers"         | Exact (T4)        | Same trick, distinct count                      |
| "count subarrays with product < K"                   | Count (add to T1) | Running product, `count += right-left+1`        |

---

### 5.3 Common Traps & How to Avoid Them

**Trap 1: Using HashMap for character frequencies instead of `int[128]`**

```java
// ❌ Slow — creates Integer objects, triggers GC, hashes characters
Map<Character, Integer> freq = new HashMap<>();
freq.put(c, freq.getOrDefault(c, 0) + 1);

// ✅ Fast — direct array access, zero object allocation
int[] freq = new int[128];
freq[c]++;
```

---

**Trap 2: Using `if` instead of `while` for shrinking (most critical bug)**

```java
// ❌ Wrong for minimum window — only shrinks once per right step
// Misses cases where multiple shrinks are needed
if (windowState >= target) {
    minLength = Math.min(minLength, right - left + 1);
    windowState -= nums[left++];
}

// ✅ Correct — shrinks until window is no longer valid
while (windowState >= target) {
    minLength = Math.min(minLength, right - left + 1);
    windowState -= nums[left++];
}
```

---

**Trap 3: Recording length AFTER shrinking in the shortest-window template**

```java
// ❌ Records the length after left has moved — misses the valid window
while (windowState >= target) {
    windowState -= nums[left++];      // Shrink first
    minLength = Math.min(minLength, right - left + 1);  // Record after — window is now smaller!
}

// ✅ Record BEFORE shrinking — capture the current valid state
while (windowState >= target) {
    minLength = Math.min(minLength, right - left + 1);  // Record first
    windowState -= nums[left++];      // Then shrink
}
```

---

**Trap 4: Over-counting `matched` when window has more than required**

```java
// ❌ Counts every time we add a required character — even excess copies
if (tFreq[c] > 0) {
    matched++;  // Wrong: adds even when we already have enough of this char
}

// ✅ Only counts up to the required amount
if (tFreq[c] > 0 && windowFreq[c] <= tFreq[c]) {
    matched++;  // Only when this copy is genuinely needed
}
```

---

**Trap 5: Forgetting to initialize `minLength` to `Integer.MAX_VALUE`**

```java
// ❌ Initialized to 0 — looks like "no window found" even when one exists
int minLength = 0;

// ✅ Initialize to MAX so any valid window will be smaller
int minLength = Integer.MAX_VALUE;
// At the end: return minLength == Integer.MAX_VALUE ? 0 : minLength;
```

---

**Trap 6: The "Longest Repeating Character Replacement" (LC 424) invalid condition**

```java
// This problem's invalid condition is subtle:
// window_size - max_frequency_in_window > k

// ❌ Wrong: updating maxFreq when shrinking (expensive and unnecessary)
while (right - left + 1 - maxFreq > k) {
    maxFreq = recalculate();  // O(26) per shrink step → O(26N) total
    left++;
}

// ✅ Insight: maxFreq only needs to UPDATE (not decrease) for the longest window
// If maxFreq would decrease on shrink, the window size stays the same (not useful anyway)
// So we never need to recalculate maxFreq — just let it lag
while (right - left + 1 - maxFreq > k) {
    freq[s.charAt(left)]--;
    left++;
    // maxFreq intentionally NOT updated — it can only stay same or increase
}
```

---

**Trap 7: Integer overflow in window state for large sums**

```java
// ❌ Overflow if nums[i] up to 10^5 and array length up to 10^5
// Max sum = 10^5 × 10^5 = 10^10 > Integer.MAX_VALUE
int windowState = 0;

// ✅ Use long for sum-based windows with large values
long windowState = 0;
```

---

## 6. Worked Examples (Step-by-Step Walkthroughs)

### Example 1: LeetCode 3 — Longest Substring Without Repeating Characters

**Problem:** Find the length of the longest substring without repeating characters.

**Thought process:**
1. "Longest" + "without repeating" → Longest template (shrink while invalid).
2. Invalid condition: any character appears more than once in the window.
3. State: `int[128]` frequency array — increment on right, decrement on left.
4. Shrink until the duplicate is removed.

```
s = "abcabcbb"

r=0, 'a': freq['a']=1, no dup → window=[a],       maxLen=1
r=1, 'b': freq['b']=1, no dup → window=[ab],      maxLen=2
r=2, 'c': freq['c']=1, no dup → window=[abc],     maxLen=3
r=3, 'a': freq['a']=2, DUP! → shrink:
  remove s[l=0]='a': freq['a']=1, no dup → window=[bca],  maxLen=3
r=4, 'b': freq['b']=2, DUP! → shrink:
  remove s[l=1]='b': freq['b']=1, no dup → window=[cab],  maxLen=3
r=5, 'c': freq['c']=2, DUP! → shrink:
  remove s[l=2]='c': freq['c']=1, no dup → window=[abc],  maxLen=3
r=6, 'b': freq['b']=2, DUP! → shrink:
  remove s[l=3]='a': freq['a']=0, still dup ('b'=2)
  remove s[l=4]='b': freq['b']=1, no dup → window=[cb],   maxLen=3
r=7, 'b': freq['b']=2, DUP! → shrink:
  remove s[l=5]='b'... → window=[b], maxLen=3

Answer: 3 ✅
```

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] freq = new int[128];
        int left = 0, maxLength = 0;

        for (int right = 0; right < s.length(); right++) {
            char rc = s.charAt(right);
            freq[rc]++;

            while (freq[rc] > 1) {          // Duplicate detected
                freq[s.charAt(left)]--;
                left++;
            }

            maxLength = Math.max(maxLength, right - left + 1);
        }

        return maxLength;
    }
}
```

**Why shrink only until `freq[rc] > 1` (not a general invalid check)?** Because the only character that could have a duplicate is `rc` (the one we just added). We don't need to check all 128 characters — just the newly added one. This is a targeted optimization.

**Complexity:** Time $O(N)$, Space $O(1)$ (fixed-size array of 128 elements).

---

### Example 2: LeetCode 209 — Minimum Size Subarray Sum

**Problem:** Find the minimum length subarray whose sum is greater than or equal to `target`.

**Thought process:**
1. "Minimum" + "sum >= target" → Shortest template (shrink while valid).
2. State: running sum.
3. Expand right to grow sum. When sum >= target, record length and shrink left to find even shorter valid windows.

```
nums = [2,3,1,2,4,3],  target = 7

r=0: sum=2  < 7  → no shrink
r=1: sum=5  < 7  → no shrink
r=2: sum=6  < 7  → no shrink
r=3: sum=8 >= 7  → VALID! minLen=4 (r-l+1=3-0+1)
                → shrink: sum=8-2=6, l=1
                → 6 < 7 → stop shrinking
r=4: sum=10 >= 7 → VALID! minLen=min(4,4)=4... wait
                   l=1, r=4, length=4
                → shrink: sum=10-3=7, l=2 → still >=7! minLen=min(4,3)=3
                → shrink: sum=7-1=6, l=3 → < 7, stop
r=5: sum=9  >= 7 → VALID! l=3, r=5, length=3. minLen=min(3,3)=3
                → shrink: sum=9-2=7, l=4 → still >=7! minLen=min(3,2)=2
                → shrink: sum=7-4=3, l=5 → < 7, stop

Answer: 2 ✅  (subarray [4,3])
```

```java
class Solution {
    public int minSubArrayLen(int target, int[] nums) {
        int left = 0, minLength = Integer.MAX_VALUE;
        long sum = 0;  // long to prevent overflow

        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];

            while (sum >= target) {
                minLength = Math.min(minLength, right - left + 1);
                sum -= nums[left++];
            }
        }

        return minLength == Integer.MAX_VALUE ? 0 : minLength;
    }
}
```

**Complexity:** Time $O(N)$ — each element added and removed at most once. Space $O(1)$.

---

### Example 3: LeetCode 76 — Minimum Window Substring

**Problem:** Find the shortest substring of `s` containing all characters of `t`.

**Thought process:**
1. "Minimum" + "contains all characters of t" → Shortest template + `matched` counter.
2. `tFreq[]` stores required counts. `windowFreq[]` tracks current counts.
3. `matched` increments when a character's count in the window exactly meets (not exceeds) the requirement.
4. Shrink while fully matched; record before each shrink.

```
s = "ADOBECODEBANC",  t = "ABC"

tFreq: A=1, B=1, C=1   requiredMatches=3

r=0  'A': windowFreq[A]=1 == tFreq[A]=1 → matched=1
r=1  'D': not in t
r=2  'O': not in t
r=3  'B': windowFreq[B]=1 == tFreq[B]=1 → matched=2
r=4  'E': not in t
r=5  'C': windowFreq[C]=1 == tFreq[C]=1 → matched=3 → VALID!
     record [0..5] = "ADOBEC", len=6
     shrink: remove s[0]='A', windowFreq[A]=0 < tFreq[A]=1 → matched=2, l=1
r=6  'O': not in t
r=7  'D': not in t
r=8  'E': not in t
r=9  'B': windowFreq[B]=2. tFreq[B]=1. 2>1 so matched stays 2
r=10 'A': windowFreq[A]=1 == tFreq[A]=1 → matched=3 → VALID!
     record [1..10] = "DOBECODEBA", len=10 → not better than 6
     shrink: remove s[1]='D' → matched stays 3, l=2
     record [2..10] = len=9 → not better
     shrink: remove s[2]='O' → matched stays 3, l=3
     ...keep shrinking...
     remove s[3]='B', windowFreq[B]=1. 1==tFreq[B]=1, matched stays 3. l=4
     record [4..10]="ECODEBA", len=7 → not better
     remove s[4]='E' → matched stays 3. l=5
     record [5..10]="CODEBA", len=6 → equal, not better
     remove s[5]='C', windowFreq[C]=0 < tFreq[C]=1 → matched=2. l=6. stop shrinking.
r=11 'N': not in t
r=12 'C': windowFreq[C]=1 == tFreq[C]=1 → matched=3 → VALID!
     record [6..12]="ODEBANC", len=7 → not better
     shrink: remove s[6]='O' → l=7, matched=3. record [7..12]="DEBANC", len=6
     shrink: remove s[7]='D' → l=8, matched=3. record [8..12]="EBANC", len=5
     shrink: remove s[8]='E' → l=9, matched=3. record [9..12]="BANC", len=4 ✅
     shrink: remove s[9]='B', windowFreq[B]=0 < 1 → matched=2, l=10. stop.

Answer: "BANC" (length 4) ✅
```

```java
class Solution {
    public String minWindow(String s, String t) {
        if (s.length() < t.length()) return "";

        int[] tFreq = new int[128];
        int[] windowFreq = new int[128];
        for (char c : t.toCharArray()) tFreq[c]++;

        int left = 0, matched = 0;
        int minLength = Integer.MAX_VALUE, minStart = 0;
        int requiredMatches = t.length();

        for (int right = 0; right < s.length(); right++) {
            char rc = s.charAt(right);
            windowFreq[rc]++;
            if (tFreq[rc] > 0 && windowFreq[rc] <= tFreq[rc]) matched++;

            while (matched == requiredMatches) {
                if (right - left + 1 < minLength) {
                    minLength = right - left + 1;
                    minStart = left;
                }
                char lc = s.charAt(left);
                windowFreq[lc]--;
                if (tFreq[lc] > 0 && windowFreq[lc] < tFreq[lc]) matched--;
                left++;
            }
        }

        return minLength == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLength);
    }
}
```

**Complexity:** Time $O(S + T)$, Space $O(1)$ (fixed 128-element arrays).

---

### Example 4: LeetCode 992 — Subarrays with K Different Integers

**Problem:** Count subarrays that contain exactly K distinct integers.

**Thought process:**
1. "Exactly K distinct" → hard to track directly with sliding window.
2. Apply the trick: `f(exactly K) = f(at most K) - f(at most K-1)`.
3. `atMostK` is a standard Longest template where we count subarrays instead of tracking max length.

```
nums = [1,2,1,2,3],  k = 2

atMostK(2): count subarrays with <= 2 distinct integers
  At each step, valid window gives (right - left + 1) subarrays ending at right.
  
  r=0: [1]       → 1 distinct → count += 1 (just [1])
  r=1: [1,2]     → 2 distinct → count += 2 ([2],[1,2])
  r=2: [1,2,1]   → 2 distinct → count += 3 ([1],[2,1],[1,2,1])
  r=3: [1,2,1,2] → 2 distinct → count += 4
  r=4: [1,2,1,2,3] → 3 > 2 → shrink until 2 distinct: l moves to index 2
       window = [1,2,3] → still 3 → l=3, window=[2,3]
       count += 2 ([3],[2,3])
  Total atMostK(2) = 1+2+3+4+2 = 12

atMostK(1): count subarrays with <= 1 distinct integer
  r=0: [1] → count += 1
  r=1: [1,2] → 2 > 1 → shrink → [2], count += 1
  r=2: [2,1] → 2 > 1 → shrink → [1], count += 1
  r=3: [1,2] → 2 > 1 → shrink → [2], count += 1
  r=4: [2,3] → 2 > 1 → shrink → [3], count += 1
  Total atMostK(1) = 5

Answer: 12 - 5 = 7 ✅
```

```java
class Solution {
    public int subarraysWithKDistinct(int[] nums, int k) {
        return atMostK(nums, k) - atMostK(nums, k - 1);
    }

    private int atMostK(int[] nums, int k) {
        int[] freq = new int[nums.length + 1];
        int left = 0, count = 0, distinct = 0;

        for (int right = 0; right < nums.length; right++) {
            if (++freq[nums[right]] == 1) distinct++;

            while (distinct > k) {
                if (--freq[nums[left]] == 0) distinct--;
                left++;
            }

            count += right - left + 1;
        }
        return count;
    }
}
```

---

## 7. Problem-Solving Framework (Use This in Interviews)

### Step 1 — Confirm It's a Sliding Window (30 seconds)

Ask:
> "Is this a contiguous subarray or substring problem? Is there a condition that dynamically changes whether the window is valid?"

If yes to both → sliding window.

### Step 2 — Choose Longest vs. Shortest vs. Count (30 seconds)

> "Am I maximizing window size (longest) or minimizing it (shortest)? Or counting valid windows?"

- Maximize → Template 1 (shrink while invalid)
- Minimize → Template 2 (shrink while valid)
- Count → `count += right - left + 1` inside the valid state
- Exactly K → `atMostK(k) - atMostK(k-1)`

### Step 3 — Define the Window State (1 minute)

> "What do I need to track inside the window? Is the condition based on a sum, a distinct count, a character frequency, or matching a pattern?"

Choose: `int[]` for characters, `HashMap` for integers, `long` for large sums.

### Step 4 — Define Valid vs. Invalid (30 seconds)

> "When is the window valid? When is it invalid? What single condition determines this?"

Write it down explicitly before coding: e.g., `distinct <= k` is valid, `distinct > k` is invalid.

### Step 5 — Code the Template, Customize Inside

The outer structure is always the same. Only the state update and condition change.

### Step 6 — Test Edge Cases Out Loud

- All elements are the same
- k = 0 (no valid window possible)
- The entire array is one valid window
- The answer window is at the very end of the array

---

## 8. 7-Day Practice Plan (21 Problems)

**Day 1: Variable Window Basics**
1. Minimum Size Subarray Sum (LC 209) — *Shortest template — the gateway problem*
2. Longest Substring Without Repeating Characters (LC 3) — *Longest template + char array*
3. Max Consecutive Ones III (LC 1004) — *Longest template: count zeros, shrink when > K*

> **Day 1 Focus:** After solving LC 1004, reframe it mentally: "I'm not looking for ones — I'm looking for a window with at most K zeros." The reframing is the skill. Practice identifying what the constraint actually is.

**Day 2: String Manipulations**
4. Longest Repeating Character Replacement (LC 424) — *Critical insight: never decrease maxFreq*
5. Find All Anagrams in a String (LC 438) — *Fixed-size + matched counter*
6. Permutation in String (LC 567) — *Same as LC 438, different output*

> **Day 2 Focus:** LC 424 is the hardest "longest" problem. The invalid condition `windowSize - maxFreq > k` is non-obvious. Draw a 5-character window, mark the most frequent character, and see how many replacements you'd need. That's exactly `windowSize - maxFreq`.

**Day 3: The "At Most K" Pattern**
7. Longest Substring with At Most K Distinct Characters (LC 340) — *Longest + distinct count*
8. Fruit Into Baskets (LC 904) — *Disguised as "at most 2 distinct" — same template*
9. Maximum Erasure Value (LC 1695) — *Longest + running sum, shrink on duplicate*

> **Day 3 Focus:** After solving LC 340 and LC 904, notice they're identical problems with different stories. The ability to strip away the narrative and see the algorithm underneath is a senior interview skill.

**Day 4: Exact Count Subarrays (The Math Trick)**
10. Binary Subarrays With Sum (LC 930) — *Exactly K = AtMostK - AtMostK(K-1)*
11. Count Number of Nice Subarrays (LC 1248) — *Odd numbers as the "distinct" element*
12. Subarrays with K Different Integers (LC 992) — *Hard, the canonical exact-K problem*

> **Day 4 Focus:** The "Exactly K" trick is unintuitive the first time. After solving LC 930, prove the formula to yourself: draw a number line of subarrays, shade the "at most K" ones, then subtract "at most K-1". The remaining shaded subarrays are exactly the "exactly K" ones.

**Day 5: Minimum Windows**
13. Minimum Window Substring (LC 76) — *The hardest standard sliding window; master this*
14. Minimum Operations to Reduce X to Zero (LC 1658) — *Insight: maximize the middle, not minimize the ends*
15. Subarray Product Less Than K (LC 713) — *Product instead of sum; `count += right-left+1`*

> **Day 5 Focus:** LC 1658's reframing is brilliant: instead of "minimize elements removed from ends," think "maximize the middle subarray with sum = total - X." This transforms a hard problem into a standard Longest template. Inversion tricks like this appear frequently — practice spotting them.

**Day 6: Advanced Multi-Condition Windows**
16. Get Equal Substrings Within Budget (LC 1208) — *Cost = |s[i] - t[i]|, shrink when cost > budget*
17. Replace the Substring for Balanced String (LC 1234) — *Shrink while all outside-window counts ≤ n/4*
18. Longest Continuous Subarray With Absolute Diff ≤ Limit (LC 1438) — *Sliding Window + Monotonic Deque*

> **Day 6 Focus:** LC 1438 combines two patterns from two different weeks. You need a Monotonic Deque (Week 5) to track the current window's max and min in $O(1)$. When `max - min > limit`, shrink. This is the kind of "synthesis" problem that appears in final interview rounds.

**Day 7: Sliding Window Potpourri**
19. Maximum Number of Vowels in a Substring of Given Length (LC 1456) — *Fixed-size, easy warm-up*
20. Frequency of the Most Frequent Element (LC 1838) — *Sort first, then Longest template: window valid when (sum of max) - currentSum ≤ k*
21. Minimum Swaps to Group All 1's Together II (LC 2134) — *Circular array: use the "2N" trick + fixed window*

> **Day 7 Focus:** LC 1838 requires sorting first — the window's validity depends on comparing against the current maximum (always the rightmost in a sorted array). LC 2134 is circular: to handle wrap-around, extend the array to length 2N and use a fixed window of size (count of 1s).

---

## 9. Mock Interview Module

### Problem: The Corrupted Microservice Trace

**Context:** An SRE team has an array of service log names `logs[]`. They know a critical bug involves a window of logs containing at least one instance each of `AuthService`, `PaymentService`, and `InventoryService` in close proximity. Find the shortest contiguous log sequence containing all three.

**Question:** `public int shortestAnomalyWindow(String[] logs, String[] criticalServices)`

---

#### Step 1: Clarifying Questions

- *Candidate:* "Can `logs` contain service names not in `criticalServices`?" → *Interviewer:* Yes — thousands of unrelated logs.
- *Candidate:* "Does the order of critical services in the window matter?" → *Interviewer:* No, just all must be present.
- *Candidate:* "Can `criticalServices` have duplicates (e.g., AuthService twice)?" → *Interviewer:* Good question — treat each entry as a separate required occurrence.
- *Candidate:* "What if no window exists?" → *Interviewer:* Return 0.

> **Tip:** The duplicate clarification elevates the solution from a simple `HashSet` check to a proper frequency-count approach. Always ask.

---

#### Step 2: Formulating the Strategy

*Candidate's thought process out loud:*
1. "Shortest window containing all targets" → Minimum Window pattern (Template 2).
2. "Logs are strings, not characters" → can't use `int[128]`. Must use `HashMap`.
3. "Build `required` map from `criticalServices`. Track `windowState` map. Use `matched` counter comparing distinct services met."
4. "Expand right, adding to `windowState`. Shrink from left when all required services are matched."

---

#### Step 3: Optimized Solution

```java
public int shortestAnomalyWindow(String[] logs, String[] criticalServices) {
    if (logs == null || logs.length == 0 || criticalServices.length == 0) return 0;

    // Build the requirement map (handles duplicate criticalServices correctly)
    Map<String, Integer> required = new HashMap<>();
    for (String s : criticalServices) {
        required.merge(s, 1, Integer::sum);
    }

    Map<String, Integer> windowState = new HashMap<>();
    int left = 0, matched = 0, minLength = Integer.MAX_VALUE;
    int requiredMatches = required.size();  // Number of DISTINCT services to satisfy

    for (int right = 0; right < logs.length; right++) {
        String rc = logs[right];

        if (required.containsKey(rc)) {
            int newCount = windowState.merge(rc, 1, Integer::sum);
            // matched increments only when we EXACTLY meet the requirement (not exceed)
            if (newCount.equals(required.get(rc))) matched++;
        }

        while (matched == requiredMatches) {
            minLength = Math.min(minLength, right - left + 1);

            String lc = logs[left];
            if (required.containsKey(lc)) {
                int newCount = windowState.merge(lc, -1, Integer::sum);
                // matched decrements only when we DROP BELOW the requirement
                if (newCount < required.get(lc)) matched--;
            }
            left++;
        }
    }

    return minLength == Integer.MAX_VALUE ? 0 : minLength;
}
```

**Walk through this in the interview:**
> "The `required` map handles duplicate critical services gracefully — if `AuthService` appears twice, it needs to appear twice in the window. The `matched` counter uses the same exact-meet logic as the character version: increment only when count equals required, decrement only when it drops below. This correctly handles windows where a service appears more than the required count."

---

#### Step 4: Follow-up Questions

**Follow-up 1 (Streaming logs):**
*Interviewer:* "Logs arrive as a live stream — you can't store them all. How do you adapt?"

*Expected thought process:*
- The left pointer can't go backwards, but with a stream we need to "forget" old logs as they leave the window.
- Use a **sliding window buffer** (a `Deque<String>`) storing the last `W` logs. When a new log arrives: add to deque back, add to `windowState`. If `windowState` is valid, shrink from front until invalid, recording the minimum.
- **Memory bound:** The deque grows unboundedly if the critical services never all appear. Add a max window size parameter: if the deque exceeds it, evict from the front.
- For production: emit a "window alert" event via Kafka when a valid window is found, rather than storing the whole result.

**Follow-up 2 (Weighted criticality):**
*Interviewer:* "Not all services are equally critical. `PaymentService` failures count double. How does the algorithm change?"

*Expected thought process:*
- The `matched` counter currently tracks distinct services satisfied. With weights, "fully satisfied" still means `windowState[s] >= required[s]`, but `required[s]` is now the weighted threshold.
- Change: `required["PaymentService"] = 2` (need to see it twice to count as satisfied). The rest of the algorithm is unchanged — the `matched` logic already handles arbitrary required counts.
- This demonstrates the power of the HashMap frequency approach over a simple set-membership check.

**Follow-up 3 (Parallel log streams):**
*Interviewer:* "Logs come from 50 different microservices simultaneously on separate Kafka topics. How do you find the shortest time window across all streams?"

*Expected thought process:*
- Each event now has a **timestamp**, not just a position. The "window" is now a time range `[t_start, t_end]`, not an index range.
- Use a **priority queue** (min-heap) ordered by timestamp. Pull the next event from whichever stream has the earliest next event. Process it exactly like the sliding window, but use timestamps instead of indices for length calculation.
- The `left` pointer becomes "remove the event with the earliest timestamp from the window state" — implemented by tracking which events are in the window in a sorted structure (`TreeMap<Long, String>` of timestamp → service name).
- This is essentially the "Merge K Sorted Streams" problem (Week 5 Priority Queue) combined with the minimum window pattern.

---

## 10. Connecting to Other Weeks

Variable sliding windows are the convergence point of multiple earlier techniques:

```
Week 2 (Fixed Sliding Window) → Week 15 (Variable Sliding Window):
  → Fixed: both pointers move at the same pace (window size constant)
  → Variable: right moves freely, left catches up based on validity
  → The state tracking machinery (frequency arrays, running sums) is identical

Week 4 (HashMap) + Week 15 (Sliding Windows):
  → Frequency maps inside windows enable complex validity checks
  → `matched` counter eliminates O(N) re-scan on each step
  → The "merge/getOrDefault" patterns from Week 4 appear verbatim here

Week 5 (Monotonic Deque) + Week 15 (Sliding Windows):
  → LC 1438: sliding window validity needs O(1) max-min tracking
  → The deque maintains the window's max and min simultaneously
  → Combining both patterns: Week 15's most advanced problems

Week 13 (1D DP) + Week 15 (Sliding Windows):
  → Prefix sums (Week 1) + sliding windows = complementary O(N) techniques
  → Some problems solvable with either: subarray sum == k (prefix sum + hash) or sliding window
  → When sliding window fails (negative numbers, exact counts): use prefix sums instead

Week 15 → System Design (Rate Limiting):
  → Token bucket algorithm = sliding window over time
  → API rate limiter: "at most K requests in any 60-second window"
  → Redis ZSET implements a sorted sliding window with O(log N) add/remove
```

---

## 11. Quick Reference Cheat Sheet

```
╔══════════════════════════════════════════════════════════════╗
║        ADVANCED SLIDING WINDOW CHEAT SHEET                  ║
╠══════════════════════════════════════════════════════════════╣
║ LONGEST / MAXIMUM WINDOW                                     ║
║  for right in 0..n:                                         ║
║    add right to state                                       ║
║    while INVALID: remove left; left++                       ║
║    maxLen = max(maxLen, right - left + 1)                   ║
╠══════════════════════════════════════════════════════════════╣
║ SHORTEST / MINIMUM WINDOW                                    ║
║  for right in 0..n:                                         ║
║    add right to state                                       ║
║    while VALID:                                             ║
║      minLen = min(minLen, right - left + 1)  ← BEFORE shrink║
║      remove left; left++                                    ║
║  return minLen == MAX_VALUE ? 0 : minLen                    ║
╠══════════════════════════════════════════════════════════════╣
║ COUNT ALL VALID SUBARRAYS (at most K)                        ║
║  while INVALID: remove left; left++                         ║
║  count += right - left + 1  ← all windows ending at right  ║
╠══════════════════════════════════════════════════════════════╣
║ EXACTLY K OCCURRENCES                                        ║
║  f(exact K) = atMostK(k) - atMostK(k-1)                   ║
╠══════════════════════════════════════════════════════════════╣
║ STATE TRACKING                                               ║
║  Characters: int[128]  (NOT HashMap — avoid boxing/GC)      ║
║  Integers:   HashMap<Integer, Integer>                      ║
║  Large sums: use long (not int)                             ║
╠══════════════════════════════════════════════════════════════╣
║ MATCHED COUNTER LOGIC                                        ║
║  Increment: windowFreq[c] == required[c]  (just met it)    ║
║  Decrement: windowFreq[c] < required[c]   (just broke it)  ║
║  Never changes when going above required count              ║
╠══════════════════════════════════════════════════════════════╣
║ WHY O(N)?                                                    ║
║  Each element added once + removed at most once = 2N ops   ║
║  Inner while loop total moves = at most N across ALL iters  ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 12. What's Coming Next

**Week 16: Trie (Prefix Tree)** — where sliding windows meet string search at scale:
- Tries organize strings by shared prefixes, enabling $O(L)$ search (L = word length).
- Combine with sliding windows for "stream of characters, find all dictionary words in current window" problems (e.g., Word Search II).

**Week 17+: Advanced Graph Algorithms** — Dijkstra, Bellman-Ford:
- Dijkstra's "relaxation" is structurally similar to sliding window's "expand until valid, shrink until minimum." Both maintain an invariant (shortest known distance / valid window) and greedily push the frontier forward.

**The meta-skill sliding windows teach:** Whenever you see a nested loop scanning a contiguous range, ask: "Can the inner pointer remember where it left off instead of restarting?" If yes — and if both pointers only move forward — you have an $O(N^2)$ algorithm waiting to become $O(N)$. This reflex is one of the most valuable instincts you can develop for technical interviews.