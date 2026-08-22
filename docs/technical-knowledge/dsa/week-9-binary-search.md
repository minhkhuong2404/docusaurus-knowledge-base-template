---
id: week-9-binary-search
title: "Week 9: Binary Search & The Answer Space"
description: Start Phase 3 by mastering logarithmic time complexity. Learn standard Binary Search, handling rotated arrays, and the advanced "Binary Search on Answer Space" pattern in Java.
tags: [dsa, java, binary-search, algorithms, optimization, week-9]
sidebar_position: 9
---

import DsaWeek9BinarySearchDiagram from '@site/src/components/DsaWeek9BinarySearchDiagram';

# Week 9: Binary Search & The Answer Space

## 1. Overview

Welcome to Week 9 and the beginning of **Phase 3: Core Algorithms**! For the last 8 weeks, we focused on *where* data is stored (arrays, trees, graphs). Now, we shift our focus to *how* we process that data efficiently.

We begin with **Binary Search**. While most people know it as "find an element in a sorted array," the true power of this pattern lies in **Binary Search on the Answer Space** — a technique that lets you search for the optimal *value* of something (a speed, a capacity, a day count) in $O(\log N)$ time, as long as the problem has a specific mathematical property called **monotonicity**.

### Why Does This Matter?

The jump from $O(N)$ to $O(\log N)$ is staggering at scale:

| Array Size    | Linear Search $O(N)$ | Binary Search $O(\log N)$ |
| ------------- | -------------------- | ------------------------- |
| 1,000         | 1,000 ops            | 10 ops                    |
| 1,000,000     | 1,000,000 ops        | 20 ops                    |
| 1,000,000,000 | 1,000,000,000 ops    | 30 ops                    |

Binary search on 1 billion items takes **30 operations**. This is why it's used in databases, file systems, and every search engine on the planet.

**Goals for this week:**
- Understand $O(\log N)$ intuitively and why it scales so dramatically.
- Master standard Binary Search with correct boundary handling.
- Learn the midpoint overflow bug that causes mysterious failures.
- Handle the rotated sorted array — the most common binary search variation.
- Master Binary Search on the Answer Space — a pattern that turns "try everything" brute-forces into elegant $O(\log N)$ solutions.

### Knowledge You Need Before Starting

- Sorted-array intuition and boundary-handling rigor from prior weeks.
- Comfort with loop invariants (`low`, `high`, and termination conditions).
- Basic monotonic reasoning ("if X works, bigger/smaller also works").
- Integer overflow awareness and safe midpoint formula usage.

---

## 2. The Core Mental Models

<DsaWeek9BinarySearchDiagram />


### 2.1 What Is Binary Search? — The "Encyclopedia" Model

Imagine you're looking up a word in a physical encyclopedia. You don't start from page 1. You open to the **middle**, check if the word comes before or after, then open to the middle of the relevant half, and repeat.

Each "open" eliminates **half the remaining pages**. That's binary search.

```
Search for 7 in: [1, 3, 5, 7, 9, 11, 13]
                  0  1  2  3  4   5   6

Step 1: left=0, right=6, mid=3 → arr[3]=7 → FOUND! ✅

(If target was 9):
Step 1: left=0, right=6, mid=3 → arr[3]=7 < 9 → search right half
Step 2: left=4, right=6, mid=5 → arr[5]=11 > 9 → search left half
Step 3: left=4, right=4, mid=4 → arr[4]=9 → FOUND! ✅

(If target was 6):
Step 1: left=0, right=6, mid=3 → arr[3]=7 > 6 → search left half
Step 2: left=0, right=2, mid=1 → arr[1]=3 < 6 → search right half
Step 3: left=2, right=2, mid=2 → arr[2]=5 < 6 → search right half
Step 4: left=3, right=2 → left > right → NOT FOUND, return -1
```

**The invariant:** At every step, the target (if it exists) is guaranteed to be within `[left, right]`. We shrink this range until we find the target or the range collapses.

---

### 2.2 The Termination Condition: `left <= right` vs `left < right`

This is the single most confusing aspect of binary search. Two slightly different templates exist, and mixing them causes off-by-one bugs.

**Template A: `while (left <= right)` — Use for exact match searches**

```
Search space: [left ... right] (both inclusive)

Terminates when left > right (empty range).
When we find the target: return mid immediately.
When we don't: after the loop, return -1.

Boundary moves:
  Too small: left = mid + 1  (mid is eliminated, move past it)
  Too large: right = mid - 1 (mid is eliminated, move past it)
```

**Template B: `while (left < right)` — Use for "find boundary" searches**

```
Search space: [left ... right) or [left ... right]
              with the answer always collapsing to one of the boundaries.

Terminates when left == right (one candidate remains).
The answer is at arr[left] (or arr[right] — they're equal).

Boundary moves:
  Too small: left = mid + 1
  Meets condition: right = mid  (mid might be the answer, keep it)
```

**Which to use?**

| Situation                                            | Template                                            |
| ---------------------------------------------------- | --------------------------------------------------- |
| Find exact target in sorted array                    | Template A (`left <= right`)                        |
| Find minimum index where condition is true           | Template B (`left < right`)                         |
| Binary search on answer space (find min valid value) | Template A (`left <= right`) with `result` variable |

**Rule of thumb for interviews:** If you're unsure, use Template A with an explicit `result` variable. It's the safest and most versatile.

---

### 2.3 The Midpoint Overflow — A Hidden Bug

This is a bug that silently corrupts results for large inputs. Every experienced Java engineer has been bitten by it.

```java
// ❌ WRONG — can overflow for large indices
int mid = (left + right) / 2;

// If left = 1_500_000_000 and right = 1_600_000_000:
// left + right = 3_100_000_000 which exceeds Integer.MAX_VALUE (2_147_483_647)
// Java wraps around to a NEGATIVE number!
// mid becomes negative → ArrayIndexOutOfBoundsException

// ✅ CORRECT — equivalent math, no overflow
int mid = left + (right - left) / 2;

// Explanation:
// (left + right) / 2  =  left + (right - left) / 2
// The subtraction (right - left) is always non-negative and within int range
// since right >= left by the loop invariant.
```

**When does this matter?** When binary-searching the answer space with values up to $10^9$ (like job sizes or distances). Always use the safe formula.

---

### 2.4 Binary Search on the Answer Space — The "Dial" Model

This is the most powerful and least-understood binary search pattern. It works when:

1. You're looking for an **optimal value** (minimum capacity, maximum speed, fewest days).
2. There is a **yes/no question** that can be answered for any given value: "Does capacity X work?"
3. The answers are **monotonic**: if X works, then X+1 also works (or vice versa).

**The monotonicity property visualized:**

```
"Does capacity X allow us to finish within deadline?"

X:         1    2    3    4    5    6    7    8    9    10
Answer:   No   No   No   Yes  Yes  Yes  Yes  Yes  Yes  Yes
                          ↑
                    This is the threshold — the first "Yes".
                    Binary search finds it in O(log(max_X)) steps.

The shape is always: [No, No, No, ..., Yes, Yes, Yes, ...]
                      ──────────────────────────────────────
                      Invalid answers    Valid answers
```

**The "Dial" mental model:**

Imagine a dial that goes from 1 to 1,000,000,000. Turning it right (bigger value) eventually makes the problem solvable. You want the leftmost setting that works.

Instead of trying every dial position (1 billion attempts), binary search tries positions 500M, 250M, 375M, ... and finds the answer in 30 attempts.

---

### 2.5 Rotated Sorted Array — The "Broken Staircase"

A rotated sorted array looks like a sorted array that was "picked up and rotated":

```
Original sorted:  [1, 2, 3, 4, 5, 6, 7]
Rotated at index 4: [5, 6, 7, 1, 2, 3, 4]
                     ───────  ───────────
                     Part A    Part B
                     (sorted)  (sorted)

The full array is NOT sorted, but each HALF is always sorted.
The key question at every step: "Which half is fully sorted?"
```

**The invariant for rotated array binary search:**

At any `mid`, one of the two halves `[left..mid]` or `[mid..right]` is **always fully sorted**. You check which one, then decide if the target lies within that sorted half.

```
arr = [5, 6, 7, 1, 2, 3, 4],  target = 2
       0  1  2  3  4  5  6

mid = 3, arr[3] = 1
  Is left half [5,6,7,1] sorted? arr[left]=5 <= arr[mid]=1? NO
  → Right half [1,2,3,4] must be sorted.
  Is target (2) in sorted right half [1..4]? YES (2 > 1 and 2 <= 4)
  → Search right: left = mid + 1 = 4

mid = 5, arr[5] = 3
  Is left half [2,3] sorted? arr[left]=2 <= arr[mid]=3? YES
  Is target (2) in sorted left half [2..3]? YES (2 >= 2 and 2 < 3)
  → Search left: right = mid - 1 = 4

mid = 4, arr[4] = 2 → FOUND! ✅
```

---

## 3. Theory & Fundamentals

### 3.1 Why $O(\log N)$ Is So Powerful

Each iteration of binary search **halves** the search space. Starting with $N$ elements:

```
Iteration 1: N/2 elements remain
Iteration 2: N/4 elements remain
Iteration 3: N/8 elements remain
...
Iteration k: N/2^k elements remain

When N/2^k = 1 → k = log₂(N) iterations
```

`log₂(1,000,000,000) ≈ 30`. This is why 30 iterations finds any element in a billion-element array.

**Comparison to other complexities:**

```
N = 100,000,000 (100 million):

O(1):       1 operation         (hash table lookup)
O(log N):   27 operations       (binary search)
O(N):       100,000,000 ops     (linear scan)
O(N log N): 2,700,000,000 ops  (merge sort)
O(N²):      10^16 ops           (nested loop — effectively impossible)
```

---

### 3.2 When Binary Search Applies — The Monotonicity Test

Before reaching for binary search on the answer space, verify the monotonicity property:

> **If the answer is "Yes" for value X, is the answer also "Yes" for value X+1 (or X-1)?**

```
"Can K cores finish all jobs within deadline?"
  K=1: No (too slow)
  K=2: No
  K=3: Yes ← threshold
  K=4: Yes (4 cores is strictly faster than 3)
  K=5: Yes
  ...
  ✅ Monotonic: more cores → never worse → Binary search on K.

"Is K a prime number?"
  K=2: Yes
  K=3: Yes
  K=4: No
  K=5: Yes
  ...
  ❌ NOT monotonic: primes are scattered → Binary search doesn't apply.
```

**The ceiling division trick:**

When computing how many chunks a job takes with capacity `k`:

```java
// ❌ Floating point — slow, and precision risk for large numbers
int hours = (int) Math.ceil((double) job / k);

// ✅ Integer ceiling — fast, exact, no overflow risk
int hours = (job + k - 1) / k;

// Why this works:
// ceil(a/b) = floor((a + b - 1) / b)
// Example: ceil(7/3) = ceil(2.33) = 3
// Integer: (7 + 3 - 1) / 3 = 9 / 3 = 3 ✅
```

---

### 3.3 Choosing the Search Space Boundaries

For Binary Search on Answer Space, defining `left` and `right` correctly is critical:

| Problem                  | `left` (minimum) | `right` (maximum) | Why                                                           |
| ------------------------ | ---------------- | ----------------- | ------------------------------------------------------------- |
| Min eating speed         | 1                | `max(piles)`      | Speed 1 = one banana/hr; can't need more than largest pile/hr |
| Min days to ship         | `max(weights)`   | `sum(weights)`    | Need at least 1 trip; at most 1 item/day = sum of all         |
| Min cores                | 1                | `max(jobs)`       | 1 core minimum; never need more than largest job              |
| Split array into K parts | K                | `sum(array)`      | Each part ≥ 1 element; worst case = 1 part = whole sum        |

**Common mistake:** Setting `right` too small (misses valid answers) or too large (wastes iterations, risks overflow). Always justify your boundaries out loud in an interview.

---

## 4. Code Templates (Java)

### Template 1: Standard Binary Search (Exact Match)

```java
public int binarySearch(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;  // Both ends INCLUSIVE

    while (left <= right) {  // Loop while search space is non-empty
        int mid = left + (right - left) / 2;  // Safe midpoint

        if (nums[mid] == target) {
            return mid;            // Found
        } else if (nums[mid] < target) {
            left = mid + 1;        // Target in right half, mid is eliminated
        } else {
            right = mid - 1;       // Target in left half, mid is eliminated
        }
    }

    return -1;  // Not found
}
```

**Step-by-step logic for boundary moves:**
- `nums[mid] < target`: The target is to the **right** of mid. Since we already checked mid, we can safely exclude it: `left = mid + 1`.
- `nums[mid] > target`: The target is to the **left** of mid. Exclude mid: `right = mid - 1`.
- If `left > right`: The search space is empty — target doesn't exist.

---

### Template 2: Find First/Last Occurrence (Boundary Search)

```java
// Find first index where nums[i] == target
public int findFirst(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            result = mid;       // Found a valid position, but keep searching left
            right = mid - 1;   // Can there be an earlier occurrence?
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
}

// Find last index where nums[i] == target
public int findLast(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            result = mid;      // Found a valid position, but keep searching right
            left = mid + 1;   // Can there be a later occurrence?
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
}
```

---

### Template 3: Binary Search on Answer Space (Minimize)

```java
public int findMinimumAnswer(int[] input, int constraint) {
    int left = computeMinPossible(input);   // Lower bound
    int right = computeMaxPossible(input);  // Upper bound
    int result = right;                     // Default to max (worst case)

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (isValid(input, mid, constraint)) {
            result = mid;       // mid works, record it
            right = mid - 1;   // Try to find something smaller
        } else {
            left = mid + 1;    // mid too small, need bigger
        }
    }

    return result;
}

// The key helper: can we satisfy the constraint with answer = capacity?
private boolean isValid(int[] input, int capacity, int constraint) {
    long total = 0;
    for (int x : input) {
        total += (x + capacity - 1) / capacity;  // Ceiling division
        if (total > constraint) return false;     // Early exit optimization
    }
    return total <= constraint;
}
```

---

### Template 4: Rotated Sorted Array Search

```java
public int searchRotated(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) return mid;

        // Determine which half is sorted
        if (nums[left] <= nums[mid]) {
            // LEFT half [left..mid] is sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;   // Target is in the sorted left half
            } else {
                left = mid + 1;    // Target is in the right half (which may be unsorted)
            }
        } else {
            // RIGHT half [mid..right] is sorted
            if (target > nums[mid] && target <= nums[right]) {
                left = mid + 1;    // Target is in the sorted right half
            } else {
                right = mid - 1;   // Target is in the left half (which may be unsorted)
            }
        }
    }

    return -1;
}
```

---

## 5. Pattern Recognition Guide

### 5.1 The Decision Flowchart

```
                        START
                          │
              Is the input sorted (or can
              answers be ordered/ranked)?
                          │
                    ┌─ YES ┴─ NO ──────────────────────────────┐
                    │                                          │
                    ▼                                          ▼
          Are you searching            (Consider: hash table,
          for a VALUE or an            two pointers, etc.)
          OPTIMAL THRESHOLD?
                    │
         ┌──────────┴──────────────┐
         │                        │
         ▼                        ▼
   Searching for            Searching for
   a SPECIFIC VALUE         OPTIMAL THRESHOLD
   in the array             (min/max capacity,
         │                   speed, days, etc.)
         │                        │
         │                        ▼
         │               Does it have the
         │               MONOTONIC property?
         │               (if X works, X+1 works too)
         │                        │
         │                 ┌─ YES ┴─ NO ──────┐
         │                 │                  │
         │                 ▼                  ▼
         │        Binary Search on      Greedy or DP
         │        Answer Space          (not binary search)
         │
         ▼
   Is the array
   perfectly sorted?
         │
   ┌─ YES ┴─ NO ──────────────────────┐
   │                                  │
   ▼                                  ▼
Standard Binary              Is it ROTATED sorted?
Search                               │
(Template 1/2)                ┌─ YES ┴─ NO ──────┐
                              │                  │
                              ▼                  ▼
                        Rotated Array       2D Matrix
                        Binary Search       Search
                        (Template 4)        (row-by-row or
                                             staircase search)
```

---

### 5.2 Keyword Trigger Table

| Problem Keywords                               | Technique                      | Template   |
| ---------------------------------------------- | ------------------------------ | ---------- |
| "sorted array" + "find target"                 | Standard binary search         | Template 1 |
| "first/last occurrence" / "leftmost/rightmost" | Boundary binary search         | Template 2 |
| "find minimum in rotated sorted array"         | Rotated binary search          | Template 4 |
| "search in rotated sorted array"               | Rotated binary search          | Template 4 |
| "minimize the maximum"                         | Binary search on answer space  | Template 3 |
| "maximize the minimum"                         | Binary search on answer space  | Template 3 |
| "minimum speed/capacity/days to finish"        | Binary search on answer space  | Template 3 |
| "split array into K parts" with min/max        | Binary search on answer space  | Template 3 |
| "must run in O(log N)"                         | Binary search (some variant)   | —          |
| "find peak element"                            | Binary search (find local max) | Template B |
| "sqrt(x)" / "nth root"                         | Binary search on answer space  | Template 3 |
| "k-th smallest in sorted matrix"               | Binary search on value space   | Template 3 |

---

### 5.3 Common Traps & How to Avoid Them

**Trap 1: Integer overflow in midpoint calculation**

```java
// ❌ Overflows when left + right > 2,147,483,647
int mid = (left + right) / 2;

// ✅ Safe always
int mid = left + (right - left) / 2;
```

---

**Trap 2: Wrong boundary initialization for Answer Space**

```java
// Koko Eating Bananas:
// ❌ right = piles.length  (number of piles, not max pile size!)
int right = piles.length;

// ✅ right = max(piles) (Koko never needs to eat faster than the biggest pile)
int right = 0;
for (int p : piles) right = Math.max(right, p);
```

---

**Trap 3: Infinite loop from wrong boundary update**

```java
// ❌ Forgetting to exclude mid — infinite loop when left == right
if (isValid(mid)) {
    right = mid;    // Never shrinks if mid == right!
} else {
    left = mid;     // Never shrinks if mid == left!
}

// ✅ Always move past mid
if (isValid(mid)) {
    result = mid;
    right = mid - 1;   // Exclude mid, shrink left
} else {
    left = mid + 1;    // Exclude mid, shrink right
}
```

---

**Trap 4: Using floating point in the helper function**

```java
// ❌ Floating point — precision risk for large values, slower
long hours = (long) Math.ceil((double) job / k);

// ✅ Integer ceiling — exact and fast
long hours = (long)(job + k - 1) / k;
```

---

**Trap 5: Wrong condition for rotated array — `<` vs `<=`**

```java
// In rotated array search, checking which half is sorted:
// ❌ Strict less-than misses the case when left == mid (single element)
if (nums[left] < nums[mid]) { ... }

// ✅ Must use <= to handle the single-element case correctly
if (nums[left] <= nums[mid]) {
    // Left half [left..mid] is sorted
}
```

---

**Trap 6: Not using `long` in the helper function**

```java
// If jobs[i] up to 10^9 and there are 10^5 jobs:
// Total seconds could be up to 10^14 — overflows int (max ~2×10^9)!
// ❌
int secondsRequired = 0;
for (int job : jobs) secondsRequired += (job + cores - 1) / cores;

// ✅ Use long
long secondsRequired = 0;
for (int job : jobs) secondsRequired += (long)(job + cores - 1) / cores;
```

---

**Trap 7: Forgetting the early exit in the helper function**

```java
// For large inputs, this optimization matters:
private boolean canFinish(int[] jobs, int capacity, int deadline) {
    long total = 0;
    for (int job : jobs) {
        total += (long)(job + capacity - 1) / capacity;
        if (total > deadline) return false;  // Early exit!
        // Without this, you compute the full sum even when it's already too large
    }
    return true;
}
```

---

## 6. Worked Examples (Step-by-Step Walkthroughs)

### Example 1: LeetCode 704 — Binary Search

**Problem:** Find `target` in a sorted array. Return its index or -1.

**Thought process:**
1. Array is sorted → Binary Search.
2. Each step: compare mid to target, eliminate half the search space.
3. Loop condition: `left <= right` (both ends inclusive, terminate when range is empty).

```
nums = [-1, 0, 3, 5, 9, 12],  target = 9

left=0, right=5, mid=2 → nums[2]=3 < 9 → search right → left=3
left=3, right=5, mid=4 → nums[4]=9 == 9 → FOUND at index 4 ✅
```

```java
class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;

            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}
```

**Complexity:** Time $O(\log N)$, Space $O(1)$.

---

### Example 2: LeetCode 33 — Search in Rotated Sorted Array

**Problem:** Array was sorted and then rotated at an unknown pivot. Find `target` in $O(\log N)$.

**Thought process:**
1. Can't do standard binary search — array isn't fully sorted.
2. **Key insight:** At every `mid`, one half is always fully sorted. Find which one, check if target is in it, then eliminate the other.
3. If left half `[left..mid]` is sorted: check if `target` falls in `[nums[left]..nums[mid])`.
4. Otherwise, right half `[mid..right]` is sorted: check if `target` falls in `(nums[mid]..nums[right]]`.

```
nums = [4, 5, 6, 7, 0, 1, 2],  target = 0

left=0, right=6, mid=3 → nums[3]=7
  Left half [4,5,6,7]: sorted? nums[0]=4 <= nums[3]=7? YES
  Is target(0) in [4..7)? 0 >= 4? NO → search right half
  left = 4

left=4, right=6, mid=5 → nums[5]=1
  Left half [0,1]: sorted? nums[4]=0 <= nums[5]=1? YES
  Is target(0) in [0..1)? 0 >= 0 AND 0 < 1? YES → search left half
  right = 4

left=4, right=4, mid=4 → nums[4]=0 == 0 → FOUND at index 4 ✅
```

```java
class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;

            if (nums[left] <= nums[mid]) {
                // Left half is sorted
                if (target >= nums[left] && target < nums[mid]) {
                    right = mid - 1;  // Target in sorted left half
                } else {
                    left = mid + 1;   // Target in right half
                }
            } else {
                // Right half is sorted
                if (target > nums[mid] && target <= nums[right]) {
                    left = mid + 1;   // Target in sorted right half
                } else {
                    right = mid - 1;  // Target in left half
                }
            }
        }
        return -1;
    }
}
```

---

### Example 3: LeetCode 875 — Koko Eating Bananas

**Problem:** Koko has `n` piles of bananas and `h` hours. Find the minimum speed `k` (bananas/hour) to eat all piles within `h` hours. Each hour she picks one pile and eats up to `k` bananas from it.

**Thought process:**
1. "Minimum speed to finish within deadline" → Binary Search on Answer Space.
2. **Monotonicity:** If speed `k` works, speed `k+1` definitely works (faster = fewer hours). ✅
3. Search range: `left = 1` (minimum speed), `right = max(piles)` (never need to eat faster than the biggest pile — she can't eat from multiple piles in one hour).
4. For each candidate speed `k`, compute total hours needed. If `≤ h`, record and try smaller.

```
piles = [3, 6, 7, 11],  h = 8

left=1, right=11 (max pile)

mid=6: hours = ceil(3/6)+ceil(6/6)+ceil(7/6)+ceil(11/6)
             = 1 + 1 + 2 + 2 = 6 ≤ 8 ✅ → result=6, right=5

mid=3: hours = ceil(3/3)+ceil(6/3)+ceil(7/3)+ceil(11/3)
             = 1 + 2 + 3 + 4 = 10 > 8 ❌ → left=4

mid=4: hours = ceil(3/4)+ceil(6/4)+ceil(7/4)+ceil(11/4)
             = 1 + 2 + 2 + 3 = 8 ≤ 8 ✅ → result=4, right=3

left=4 > right=3 → STOP

Answer: 4 ✅
```

```java
class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int left = 1;
        int right = 0;
        for (int pile : piles) right = Math.max(right, pile);

        int result = right;  // Default: eat as fast as possible

        while (left <= right) {
            int k = left + (right - left) / 2;

            if (canFinish(piles, k, h)) {
                result = k;       // Valid speed found, record it
                right = k - 1;   // Try slower
            } else {
                left = k + 1;    // Too slow, try faster
            }
        }

        return result;
    }

    private boolean canFinish(int[] piles, int k, int h) {
        long hours = 0;
        for (int pile : piles) {
            hours += (pile + k - 1) / k;  // Ceiling division
            if (hours > h) return false;   // Early exit
        }
        return hours <= h;
    }
}
```

**Complexity:** Time $O(N \log M)$ where $M = max(piles)$. Space $O(1)$.

---

### Example 4: LeetCode 410 — Split Array Largest Sum

**Problem:** Split `nums` into `k` non-empty subarrays. Minimize the largest subarray sum.

**Thought process:**
1. "Minimize the maximum" → **Binary Search on Answer Space**.
2. **Monotonicity:** If we can split with maximum sum ≤ X, we can also split with maximum sum ≤ X+1. ✅
3. Search range: `left = max(nums)` (each subarray must have at least one element), `right = sum(nums)` (one subarray = the whole array).
4. Helper: given a maximum allowed sum `mid`, can we split the array into at most `k` parts?

```
nums = [7, 2, 5, 10, 8],  k = 2

left = max(nums) = 10,  right = sum(nums) = 32

mid = 21:
  Greedy split: [7,2,5] (sum=14 ≤ 21), [10,8] (sum=18 ≤ 21) → 2 parts ≤ k=2 ✅
  result=21, right=20

mid = 15:
  [7,2,5] (sum=14 ≤ 15), [10] (sum=10 ≤ 15), [8] — oops, already 3 parts
  Wait: [7,2,5,10]? sum=24 > 15, so can't include 10 with 7,2,5.
  [7,2,5] (14), [10] (10), [8] (8) → 3 parts > k=2 ❌
  left=16

mid = 18:
  [7,2,5] (14 ≤ 18), then add 10: 14+10=24 > 18 → new part
  [10] (10 ≤ 18), then add 8: 10+8=18 ≤ 18 → same part
  [10,8] (18) → 2 parts ≤ k=2 ✅
  result=18, right=17

mid = 16: left=16, right=17, mid=16
  [7,2,5] (14), then 10: 14+10=24>16 → [10], then 8: 10+8=18>16 → [8]
  3 parts > 2 ❌ → left=17

mid = 17: left=17, right=17
  [7,2,5] (14), then 10: 24>17 → [10], then 8: 10+8=18>17 → [8]
  3 parts > 2 ❌ → left=18

left=18 > right=17 → STOP

Answer: 18 ✅
```

```java
class Solution {
    public int splitArray(int[] nums, int k) {
        int left = 0, right = 0;
        for (int n : nums) {
            left = Math.max(left, n);   // Must be at least max element
            right += n;                  // At most the full sum
        }

        int result = right;

        while (left <= right) {
            int mid = left + (right - left) / 2;

            if (canSplit(nums, k, mid)) {
                result = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return result;
    }

    private boolean canSplit(int[] nums, int k, int maxSum) {
        int parts = 1;
        long currentSum = 0;

        for (int num : nums) {
            if (currentSum + num > maxSum) {
                parts++;                   // Start a new part
                currentSum = num;
                if (parts > k) return false;  // Too many splits
            } else {
                currentSum += num;
            }
        }
        return true;
    }
}
```

---

## 7. Problem-Solving Framework (Use This in Interviews)

### Step 1 — Identify Binary Search Applicability (30 seconds)

Ask yourself:
> "Is the input sorted? Or are the possible answers ordered/rankable?"

> "Is there a yes/no condition with a monotonic threshold?"

> "Does the problem say $O(\log N)$?"

### Step 2 — Classify the Problem (30 seconds)

> "Am I searching for a specific value in a sorted array?" → Standard (Template 1)

> "Am I finding the first/last occurrence of something?" → Boundary search (Template 2)

> "Am I minimizing/maximizing a threshold value?" → Answer Space (Template 3)

> "Is the array rotated?" → Rotated search (Template 4)

### Step 3 — Define Boundaries (say this out loud)

> "The minimum possible answer is `X` because [reason]. The maximum is `Y` because [reason]. My `result` variable starts at `Y` (worst case)."

### Step 4 — Write and Justify the Helper Function

> "My helper `isValid(mid)` checks whether `mid` satisfies the constraint. I'll use integer ceiling division to avoid floating-point precision issues. I'll also add an early exit if the total exceeds the deadline to optimize for large inputs."

### Step 5 — Test Edge Cases Out Loud

For standard binary search:
- Array of length 1 (target present / absent)
- Target at index 0 or `n-1` (boundary values)
- All elements are the same

For answer space:
- All jobs the same size
- One job that's enormous relative to the deadline
- Deadline exactly equals the number of jobs (minimum possible scenario)

---

## 8. 7-Day Practice Plan (21 Problems)

**Day 1: Binary Search Fundamentals**
1. Binary Search (LC 704) — *Write from memory, no peeking*
2. Search Insert Position (LC 35) — *When not found: where would it go?*
3. First Bad Version (LC 278) — *Boundary search: find first "bad"*

> **Day 1 Focus:** After solving LC 704, close everything and rewrite it from scratch. The template must be in muscle memory before you tackle variations.

**Day 2: Searching in 2D Matrices**
4. Search a 2D Matrix (LC 74) — *Treat as 1D sorted array via index math*
5. Search a 2D Matrix II (LC 240) — *Staircase search: start top-right corner*
6. Count Negative Numbers in a Sorted Matrix (LC 1351) — *Binary search per row*

> **Day 2 Focus:** LC 74 and LC 240 look similar but need different approaches. LC 74: the entire matrix is one sorted sequence. LC 240: rows and columns are sorted separately → the top-right corner trick (go left if too big, go down if too small).

**Day 3: Handling Rotated Arrays**
7. Find Minimum in Rotated Sorted Array (LC 153) — *Find the "drop point"*
8. Search in Rotated Sorted Array (LC 33) — *Full rotated search*
9. Find Minimum in Rotated Sorted Array II (LC 154) — *With duplicates: O(N) worst case*

> **Day 3 Focus:** LC 154 has duplicates. When `nums[left] == nums[mid]`, you can't determine which half is sorted — you must do `left++` to skip the duplicate. Acknowledge this degrades to $O(N)$ worst case.

**Day 4: Ranges & Frequencies**
10. Find First and Last Position of Element in Sorted Array (LC 34) — *Two binary searches: leftmost and rightmost*
11. Single Element in a Sorted Array (LC 540) — *Parity-based binary search*
12. Find Peak Element (LC 162) — *Binary search on local max: go toward the uphill side*

> **Day 4 Focus:** LC 540 is subtle. Before the single element, pairs are at (even, odd) indices. After it, pairs are at (odd, even) indices. This parity shift is the binary search condition.

**Day 5: Introduction to Answer Space**
13. Koko Eating Bananas (LC 875) — *The gateway answer space problem*
14. Capacity To Ship Packages Within D Days (LC 1011) — *Same template, different story*
15. Minimum Number of Days to Make m Bouquets (LC 1482) — *Helper needs adjacent counting*

> **Day 5 Focus:** After solving LC 875 and LC 1011, notice how identical the structure is. The only difference is the helper function. This is the pattern: identify search space + write one helper = done.

**Day 6: Advanced Answer Space Patterns**
16. Split Array Largest Sum (LC 410) — *"Minimize the maximum" — the canonical answer space*
17. Maximum Number of Removable Characters (LC 1898) — *Binary search on how many to remove*
18. Kth Smallest Element in a Sorted Matrix (LC 378) — *Binary search on value, not index*

> **Day 6 Focus:** LC 378 searches on the value space, not the index space. The helper counts how many elements are ≤ mid. This is a more abstract form of the answer space pattern — worth spending extra time on.

**Day 7: Math & System Design**
19. Sqrt(x) (LC 69) — *Classic: find largest x where x² ≤ n*
20. Valid Perfect Square (LC 367) — *Variation of LC 69*
21. Time Based Key-Value Store (LC 981) — *Binary search in a real system design context using TreeMap*

> **Day 7 Focus:** LC 981 combines system design (a key-value store with timestamps) with binary search. It's a great preview of how binary search appears in production systems, not just algorithmic puzzles.

---

## 9. Mock Interview Module

### Problem: The Distributed Batch Processor

**Context:** A cloud platform auto-scaler receives a list of `jobs` (each job requires `jobs[i]` million instructions). Each core processes exactly 1 million instructions/second. If a job finishes before the second is up, the core idles until the next second. Find the **minimum number of cores** to finish all jobs within a `deadline` in seconds.

**Question:** `public int minCoresRequired(int[] jobs, int deadline)`

---

#### Step 1: Clarifying Questions

- *Candidate:* "If `deadline < jobs.length`, is it impossible?" → *Interviewer:* Yes, return -1. Each job takes at least 1 second.
- *Candidate:* "Can `jobs[i]` be 0?" → *Interviewer:* No, all jobs require at least 1 instruction.
- *Candidate:* "Should I use `long` for intermediate calculations?" → *Interviewer:* Good catch — yes. Jobs can be up to $10^9$ and there can be $10^5$ of them, so totals can reach $10^14$.
- *Candidate:* "Are cores assigned exclusively to one job at a time?" → *Interviewer:* Yes, one core processes one job per second increment.

---

#### Step 2: Formulating the Strategy

*Candidate's thought process out loud:*
1. "The answer (number of cores) ranges from 1 to max(jobs). That's up to $10^9$ possible answers — we can't check linearly."
2. "Is there monotonicity? If $X$ cores can meet the deadline, will $X+1$ cores also meet it? Yes — more cores means jobs finish faster. So the answer space is monotonic."
3. "I'll binary search the answer space from 1 to max(jobs). For each candidate core count, I'll compute total seconds needed. If ≤ deadline, that core count works."
4. "The total seconds for `c` cores on a job of size `j` is `ceil(j/c)` = `(j+c-1)/c`."

---

#### Step 3: Optimized Solution

```java
public int minCoresRequired(int[] jobs, int deadline) {
    if (deadline < jobs.length) return -1;  // Impossible: each job needs ≥ 1 second

    int left = 1;
    int right = 0;
    for (int job : jobs) right = Math.max(right, job);  // Upper bound: max job size

    int result = right;  // Default: max possible

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (canMeetDeadline(jobs, mid, deadline)) {
            result = mid;        // Valid — record it
            right = mid - 1;    // Try fewer cores (save money)
        } else {
            left = mid + 1;     // Too slow — need more cores
        }
    }

    return result;
}

private boolean canMeetDeadline(int[] jobs, int cores, long deadline) {
    long secondsRequired = 0;
    for (int job : jobs) {
        secondsRequired += (long)(job + cores - 1) / cores;  // Ceiling division
        if (secondsRequired > deadline) return false;         // Early exit
    }
    return secondsRequired <= deadline;
}
```

**Talk through this in the interview:**
> "The search space is `[1, max(jobs)]`. Binary search runs in $O(\log(\max(jobs)))$ = $O(\log(10^9))$ ≈ 30 iterations. Each iteration calls the helper which runs in $O(N)$. Total: $O(N \log(\max(jobs)))$ — efficient even for $10^5$ jobs with sizes up to $10^9$."

---

#### Step 4: Follow-up Questions

**Follow-up 1 (Integer math):**
*Interviewer:* "Why use `(job + cores - 1) / cores` instead of `Math.ceil((double) job / cores)`?"

*Expected answer:*
- Floating-point arithmetic involves converting integers to IEEE 754 doubles, performing the division, and rounding — all slower than pure integer math.
- More critically, for large values like `job = 10^9`, casting to `double` loses precision (doubles have ~15 significant digits; `10^9` is fine, but compound calculations can drift).
- The integer ceiling formula `(a + b - 1) / b` is mathematically equivalent to `ceil(a/b)` for positive integers, is exact, and is faster.

**Follow-up 2 (Dynamic workload):**
*Interviewer:* "What if jobs arrive in a streaming fashion and you need to continuously recommend the minimum cores in real-time as new jobs arrive?"

*Expected thought process:*
- Rerunning binary search for each new job: $O(N \log M)$ per arrival. For $K$ arrivals, $O(KN \log M)$ total.
- Optimization: maintain a running max (`maxJob`) and sum (`totalSeconds` at the current optimal core count). When a new job arrives, incrementally update.
- If the new job increases `maxJob`, the upper bound shifts — re-run binary search. Otherwise, just check if the current core count still works by updating the helper.
- For a production system: pre-warm the binary search and use **exponential backoff** on the upper bound — start with current `right`, double if needed, then binary search between old and new bounds.

**Follow-up 3 (Multi-dimension):**
*Interviewer:* "Now each job has both a CPU requirement AND a memory requirement. Find the minimum number of cores that satisfies BOTH the deadline for CPU AND stays within a memory budget."

*Expected thought process:*
- Two constraints means the feasibility check (`canMeetDeadline`) must now validate both conditions.
- The monotonicity still holds: more cores → fewer seconds (CPU) AND each core has a fixed memory footprint (memory = cores × per-core-memory).
- Binary search on cores still works — just extend the helper to check both conditions.
- If constraints conflict (e.g., CPU needs 100 cores but memory only allows 10), return -1.

---

## 10. Connecting to Other Weeks

Binary Search is uniquely versatile — it connects backward and forward across the entire roadmap:

```
Week 2 (Two Pointers) + Week 9 (Binary Search):
  → Both exploit sorted/ordered structure
  → Two pointers: O(N) on a sorted array
  → Binary search: O(log N) when you can eliminate half per step
  → Rule: if you can eliminate half → binary search beats two pointers

Week 6 (Trees) + Week 9 (Binary Search):
  → Binary Search Tree (BST) IS binary search applied to a tree
  → BST search: O(log N) on average — same halving principle
  → Lower bound on sorted array = floor() in a BST

Week 9 (Binary Search) + Week 10+ (Dynamic Programming):
  → Many DP optimizations use binary search (Longest Increasing Subsequence in O(N log N))
  → "Patience sorting" — DP + binary search on the answer
  → Binary search helps reduce DP from O(N²) to O(N log N)

Week 9 (Binary Search on Answer Space) + System Design:
  → Load balancers use binary search to find optimal server assignment
  → Database indexing (B-trees) is binary search generalized to disk storage
  → Rate limiting: binary search on time windows
```

---

## 11. Quick Reference Cheat Sheet

```
╔══════════════════════════════════════════════════════════════╗
║           BINARY SEARCH CHEAT SHEET                         ║
╠══════════════════════════════════════════════════════════════╣
║ ALWAYS USE SAFE MIDPOINT                                     ║
║   int mid = left + (right - left) / 2;                      ║
╠══════════════════════════════════════════════════════════════╣
║ STANDARD BINARY SEARCH                                       ║
║   while (left <= right)                                      ║
║   Found: return mid                                          ║
║   Too small: left = mid + 1                                  ║
║   Too large: right = mid - 1                                 ║
║   Not found: return -1                                       ║
╠══════════════════════════════════════════════════════════════╣
║ ANSWER SPACE BINARY SEARCH                                   ║
║   left = minimum possible answer                             ║
║   right = maximum possible answer                            ║
║   result = right  (default worst case)                       ║
║   if isValid(mid): result=mid; right=mid-1  (try smaller)   ║
║   else: left=mid+1  (need bigger)                           ║
╠══════════════════════════════════════════════════════════════╣
║ INTEGER CEILING DIVISION                                     ║
║   ceil(a/b) = (a + b - 1) / b   (for positive a, b)        ║
║   Never use (double) cast for large values!                  ║
╠══════════════════════════════════════════════════════════════╣
║ ROTATED ARRAY                                                ║
║   Left sorted if: nums[left] <= nums[mid]                   ║
║   Use <=  not  < to handle single-element case              ║
╠══════════════════════════════════════════════════════════════╣
║ MONOTONICITY CHECK                                           ║
║   "If X works, does X+1 also work?" → YES → Answer Space   ║
║   "Minimize the maximum" / "Maximize the minimum" → YES     ║
╠══════════════════════════════════════════════════════════════╣
║ OVERFLOW RISK                                                ║
║   Use long in helper when sum can exceed ~2×10^9            ║
║   Add early exit: if (total > deadline) return false        ║
╠══════════════════════════════════════════════════════════════╣
║ COMPLEXITY                                                   ║
║   Standard: O(log N) time, O(1) space                      ║
║   Answer space: O(N log M) where M = answer range size      ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 12. What's Coming Next

**Week 10: Dynamic Programming (DP)** — the next leap in algorithmic thinking:
- Binary search and DP often combine: the Longest Increasing Subsequence can be solved in $O(N \log N)$ using binary search on a DP array (patience sorting).
- The "answer space" mindset from this week carries directly into DP: "what is the minimum cost to reach state X?" is the same kind of optimization question, solved by exhaustive subproblem decomposition instead of binary search.

**Week 11+: Greedy Algorithms** — sometimes the local optimum IS the global optimum:
- Many problems that appear to need binary search on the answer space can be solved greedily if you can prove that always picking the locally optimal choice leads to a globally optimal result.
- The key skill: knowing when to binary search (monotonic threshold) vs when to greedy (provably optimal local choice).

**The meta-skill binary search teaches:** Whenever you see a brute-force "try all values from 1 to N," ask: "Is there a monotonic threshold?" If yes, you've just turned an $O(N)$ or $O(N^2)$ solution into $O(\log N)$ or $O(N \log N)$. This reflex will serve you in almost every domain of algorithm design.