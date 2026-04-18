---
id: week-12-heaps-greedy
title: "Week 12: Heaps (Priority Queues) & Greedy Algorithms"
description: Conclude Phase 3 by mastering dynamic extremum tracking and locally optimal choices. Dive deep into Java's PriorityQueue, Top K patterns, and Greedy state transitions.
tags: [dsa, java, heaps, priority-queue, greedy, algorithms, week-12]
sidebar_position: 12
---

# Week 12: Heaps (Priority Queues) & Greedy Algorithms

## 1. Overview

Welcome to Week 12! This week marks the conclusion of **Phase 3: Core Algorithms**. We are tackling two concepts that often go hand-in-hand during technical interviews: **Heaps (Priority Queues)** and **Greedy Algorithms**.

A Heap is the ultimate data structure for dynamically tracking the "best", "largest", or "smallest" element in a changing dataset. Greedy Algorithms leverage sorting or heaps to continually make the most locally optimal choice, hoping it leads to a globally optimal solution.

**Goals for this week:**
- Understand the complete binary tree structure backing a Heap.
- Master Java's `PriorityQueue`, including custom Comparators for Max-Heaps and objects.
- Master the "Top K Elements" pattern to optimize $O(N \log N)$ sorting down to $O(N \log K)$.
- Understand the Greedy Choice Property and how to prove a greedy solution is safe.

---

## 2. Theory & Fundamentals

### 2.1 Mental Model: What Problem Does a Heap Solve?

Imagine you work at a hospital emergency room. Patients arrive continuously. At any moment, you need to treat the most critical patient — but new critical cases keep arriving.

With an **array**, finding the most critical patient each time takes $O(N)$ scan. With a **sorted array**, inserting a new patient takes $O(N)$ shift. Neither is acceptable.

A **Heap** solves this exactly: insert a new patient in $O(\log N)$, always access the most critical in $O(1)$, and remove them in $O(\log N)$. This is the core value proposition — **dynamic extremum tracking**.

```
Real-world systems using Heaps:
├── OS Process Scheduler: always run the highest-priority process
├── Dijkstra's Algorithm: always explore the shortest-known path next
├── Huffman Coding: always merge the two least-frequent characters
├── Event-Driven Simulation: always process the earliest event next
└── Java's PriorityQueue: general-purpose heap in the Collections API
```

---

### 2.2 Heap Internals: The Array-Backed Tree

A Heap is logically a **complete binary tree** (all levels full except possibly the last, filled left-to-right), but physically stored as a **flat array**. This array layout is what makes heaps fast — no object references, pure cache-friendly arithmetic.

```
Min-Heap tree:          Stored as array:
         1              [1, 3, 6, 5, 9, 8]
        / \              0  1  2  3  4  5
       3   6
      / \ /
     5  9 8

Parent-child index formulas (0-indexed):
  Parent of i:      (i - 1) / 2
  Left child of i:  2 * i + 1
  Right child of i: 2 * i + 2

Example: node at index 1 (value=3)
  Parent: (1-1)/2 = 0 -> value 1 (parent < child: min-heap OK)
  Left child: 2*1+1 = 3 -> value 5 OK
  Right child: 2*1+2 = 4 -> value 9 OK
```

**Why a complete binary tree?** A complete binary tree of $N$ nodes has height $\lfloor \log_2 N \rfloor$. Insert and remove only travel root-to-leaf or leaf-to-root, so they take $O(\log N)$.

**Heapify operations:**
- **Sift Up** (used after insert): new element added at the end, swap with parent while out of order.
- **Sift Down** (used after remove): root replaced by last element, swap with smallest child while out of order.

```
Insert 2 into min-heap [1, 3, 6, 5, 9, 8]:

Step 1: append -> [1, 3, 6, 5, 9, 8, 2]  (index 6)
Step 2: sift up: parent = (6-1)/2 = 2 -> value 6. 2 < 6 -> swap
        -> [1, 3, 2, 5, 9, 8, 6]
Step 3: sift up: parent = (2-1)/2 = 0 -> value 1. 2 > 1 -> STOP

Final: [1, 3, 2, 5, 9, 8, 6] heap property maintained
```

---

### 2.3 Min-Heap vs. Max-Heap: The Counter-Intuitive Top-K Trick

|               | Min-Heap                       | Max-Heap                      |
| ------------- | ------------------------------ | ----------------------------- |
| Root contains | Minimum element                | Maximum element               |
| Peek          | $O(1)$ — returns min           | $O(1)$ — returns max          |
| Java default  | `new PriorityQueue<>()`        | Needs comparator              |
| Use for       | "Always process smallest next" | "Always process largest next" |

**The Counter-Intuitive Trick — Top K Largest uses a Min-Heap:**

> "I want to keep the K largest numbers. The enemy of a Top-K-Largest set is the small numbers. I need to quickly identify and evict the smallest number in my set — and that is what a Min-Heap's `peek()` and `poll()` give me in $O(\log K)$."

```
Find Top 3 Largest in [3, 1, 5, 12, 2, 11]:

Process 3:  minHeap = [3]           size=1 <= 3, no eviction
Process 1:  minHeap = [1, 3]        size=2 <= 3, no eviction
Process 5:  minHeap = [1, 3, 5]     size=3, no eviction
Process 12: minHeap = [1, 3, 5, 12] size=4 > 3, evict min (1)
            -> minHeap = [3, 5, 12]
Process 2:  minHeap = [2, 3, 5, 12] size=4 > 3, evict min (2)
            -> minHeap = [3, 5, 12]
Process 11: minHeap = [3, 5, 11, 12] size=4 > 3, evict min (3)
            -> minHeap = [5, 11, 12]

Result: [5, 11, 12] the 3 largest. minHeap.peek()=5 = the Kth largest.
```

**Symmetrically — Top K Smallest uses a Max-Heap.** The weakest member of a "Top-K-Smallest" set is the largest element. Evict it when a smaller newcomer arrives.

---

### 2.4 Java's `PriorityQueue` — Complete Reference

Java's `PriorityQueue<E>` is a Min-Heap by default. The comparator controls ordering.

**Comparator direction logic:**
```java
// comparator(a, b) returns negative -> a comes FIRST (a has higher priority)
// comparator(a, b) returns positive -> b comes FIRST

// Min-Heap (default): smaller number has higher priority
(a, b) -> Integer.compare(a, b)   // a < b -> negative -> a first

// Max-Heap: larger number has higher priority
(a, b) -> Integer.compare(b, a)   // b < a -> negative -> b (larger) first
```

**Complete setup patterns:**
```java
// MIN-HEAP (default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// MAX-HEAP
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> Integer.compare(b, a)); // safe
// ❌ AVOID: (a, b) -> b - a  <- overflows when b=MAX_VALUE, a=MIN_VALUE

// Custom object: sort by first element of int[]
PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));

// Multi-field: frequency then reverse-alphabetical on tie
PriorityQueue<String> heap = new PriorityQueue<>((a, b) -> {
    int freqA = freq.get(a), freqB = freq.get(b);
    if (freqA != freqB) return Integer.compare(freqA, freqB);
    return b.compareTo(a); // alphabetically later = lower priority = evicted first
});

// KEY OPERATIONS
heap.offer(val);     // Insert: O(log N)
heap.poll();         // Remove root: O(log N)
heap.peek();         // View root: O(1)
heap.size();         // Count: O(1)
heap.isEmpty();      // O(1)
heap.contains(val);  // O(N) <- SLOW, avoid in hot paths
```

---

### 2.5 Greedy Algorithms: The Local-to-Global Leap

A **Greedy Algorithm** makes the locally optimal choice at each step and never revisits past decisions.

```
Contrast the three approaches to optimization:

Brute Force:   Try EVERY possible combination -> pick the best
Dynamic Prog.: Try all combinations, REUSE subproblem results
Greedy:        Make ONE best local choice -> never look back -> done

Speed:    Greedy >> DP >> Brute Force
Safety:   Brute Force = DP > Greedy  (greedy most likely to fail)
```

**The Greedy Choice Property:** A greedy algorithm is correct if and only if making the locally optimal choice at every step does NOT prevent you from finding the globally optimal solution.

**How to validate a greedy approach in an interview:**
1. State the greedy choice clearly: "I always pick X because..."
2. Try to break it: think of one adversarial input where greedy gives a wrong answer.
3. If you can't break it, exchange argument: "If the optimal solution differs from greedy at step i, I can swap in the greedy choice and the result is at least as good."

**Classic example: Interval Scheduling (pick earliest-finishing)**
```
Intervals: [1,4], [2,3], [3,5]

Greedy: always pick the interval that finishes earliest.
  Pick [2,3] (ends at 3). Next compatible: [3,5] (starts at 3 >= 3).
  Pick [3,5]. No more.
  Result: 2 intervals.

Is this optimal? Yes - [1,4] would block [2,3] and [3,5].
```

**When Greedy FAILS:**
```
Coin change with [1, 3, 4], target = 6:

Greedy (pick largest first): 4 + 1 + 1 = 3 coins
Optimal:                       3 + 3     = 2 coins <- greedy FAILS

Why? After picking 4, the remainder (2) has no efficient path.
The Greedy Choice Property is violated. Use DP instead.
```

---

### 2.6 The Two-Heap Pattern for Medians

Split data into two halves: lower half in a Max-Heap, upper half in a Min-Heap.

```
Data: [1, 3, 5, 7, 9]   Median = 5

Max-Heap (lower half): [1, 3, 5]  -> top = 5 (largest of lower half)
Min-Heap (upper half): [7, 9]     -> top = 7 (smallest of upper half)

Median (odd count):  maxHeap.peek() = 5
Median (even count): (maxHeap.peek() + minHeap.peek()) / 2.0
```

**Two invariants to maintain after every insert:**
1. `maxHeap.peek() <= minHeap.peek()` — boundary is correct
2. `|maxHeap.size() - minHeap.size()| <= 1` — sizes are balanced

---

## 3. Code Templates (Java)

### Template 1: Top K Largest Elements (Min-Heap of size K)

```java
public int[] topKLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll(); // evict current smallest
        }
    }

    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) result[i] = minHeap.poll();
    return result;
}
// Time: O(N log K)  Space: O(K)
// vs. full sort: O(N log N) — major win when K << N
```

### Template 2: Top K Smallest Elements (Max-Heap of size K)

```java
public int[] topKSmallest(int[] nums, int k) {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

    for (int num : nums) {
        maxHeap.offer(num);
        if (maxHeap.size() > k) maxHeap.poll(); // evict current largest
    }

    int[] result = new int[k];
    for (int i = 0; i < k; i++) result[i] = maxHeap.poll();
    return result;
}
```

### Template 3: Kth Largest (Single Value)

```java
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();
    }
    return minHeap.peek(); // root of K-sized min-heap = Kth largest
}
```

### Template 4: K-Way Merge

```java
public List<Integer> mergeKSortedArrays(int[][] arrays) {
    // Store [value, arrayIndex, elementIndex]
    PriorityQueue<int[]> minHeap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    List<Integer> result = new ArrayList<>();

    for (int i = 0; i < arrays.length; i++) {
        if (arrays[i].length > 0) minHeap.offer(new int[]{arrays[i][0], i, 0});
    }

    while (!minHeap.isEmpty()) {
        int[] curr = minHeap.poll();
        result.add(curr[0]);

        int ai = curr[1], ei = curr[2];
        if (ei + 1 < arrays[ai].length) {
            minHeap.offer(new int[]{arrays[ai][ei + 1], ai, ei + 1});
        }
    }
    return result;
}
// Time: O(N log K)  Space: O(K)
```

### Template 5: Two-Heap (Median of Data Stream)

```java
class MedianFinder {
    private PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    private PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    public void addNum(int num) {
        maxHeap.offer(num); // always add to lower half first

        // Fix boundary: max of lower half must <= min of upper half
        if (!minHeap.isEmpty() && maxHeap.peek() > minHeap.peek()) {
            minHeap.offer(maxHeap.poll());
        }

        // Fix size balance
        if (maxHeap.size() > minHeap.size() + 1) minHeap.offer(maxHeap.poll());
        else if (minHeap.size() > maxHeap.size()) maxHeap.offer(minHeap.poll());
    }

    public double findMedian() {
        if (maxHeap.size() == minHeap.size())
            return (maxHeap.peek() + minHeap.peek()) / 2.0;
        return maxHeap.peek(); // maxHeap holds the extra element
    }
}
```

### Template 6: Greedy Interval Scheduling (Sort by End Time)

```java
public int maxNonOverlapping(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1])); // sort by end time

    int count = 1;
    int lastEnd = intervals[0][1];

    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= lastEnd) { // no overlap
            count++;
            lastEnd = intervals[i][1];
        }
        // else: overlaps, skip it (greedy: keep earlier-finishing one)
    }
    return count;
}
// Time: O(N log N)  Space: O(1)
```

### Template 7: Greedy Furthest Reach (Jump Game)

```java
public boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;
        maxReach = Math.max(maxReach, i + nums[i]);
        if (maxReach >= nums.length - 1) return true;
    }
    return true;
}
// Time: O(N)  Space: O(1)
```

### Template 8: Jump Game II (Minimum Jumps)

```java
public int jump(int[] nums) {
    int jumps = 0, currentEnd = 0, maxReach = 0;

    for (int i = 0; i < nums.length - 1; i++) {
        maxReach = Math.max(maxReach, i + nums[i]);
        if (i == currentEnd) {   // exhausted current jump range
            jumps++;
            currentEnd = maxReach;
        }
    }
    return jumps;
}
// Time: O(N)  Space: O(1)
```

---

## 4. Problem-Solving Framework

### Step 1 — Identify the Pattern

| Signal                                 | Pattern                          |
| -------------------------------------- | -------------------------------- |
| "K largest / K smallest / Kth largest" | Top-K with size-K heap           |
| "Merge K sorted streams/lists"         | K-Way Merge with Min-Heap        |
| "Median of data stream"                | Two-Heap (max + min)             |
| "Interval scheduling, meeting rooms"   | Greedy sort by end time          |
| "Can you reach the end / max jumps?"   | Greedy maxReach variable         |
| "Minimum cost to merge elements"       | Greedy smallest first (Min-Heap) |

### Step 2 — Top-K: Which Direction?

Ask: "What am I evicting?"
- **Top K Largest** → evict the smallest → **Min-Heap** (smallest at top to evict)
- **Top K Smallest** → evict the largest → **Max-Heap** (largest at top to evict)

Memory device: *"Use the opposite heap of what you want to keep."*

### Step 3 — Greedy: Validate the Choice

Before coding:
1. State the greedy choice in one sentence.
2. Try two adversarial examples. If greedy fails either, use DP.
3. If it holds, proceed.

### Step 4 — Comparator Correctness Check

Always verify with two concrete values:
```java
// Comparator: (a, b) -> Integer.compare(a[0], b[0])
// Test: a=[2,x], b=[5,x]
// Integer.compare(2, 5) = negative -> a comes first -> smaller first = min-heap OK
```

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| Problem signal                      | Pattern                      | Key structure                |
| ----------------------------------- | ---------------------------- | ---------------------------- |
| "Top K", "Kth largest/smallest"     | Top-K heap                   | Min/Max PriorityQueue        |
| "K closest points"                  | Top-K by distance            | Min-Heap by squared distance |
| "Median from stream"                | Two-Heap                     | MaxHeap + MinHeap            |
| "Merge K sorted lists/arrays"       | K-Way Merge                  | Min-Heap of heads            |
| "Sliding window maximum"            | Monotonic Deque              | ArrayDeque                   |
| "Reorganize / rearrange string"     | Greedy + Max-Heap            | Interleave most frequent     |
| "Maximum non-overlapping intervals" | Greedy sort by end           | Sort + single pass           |
| "Minimum meeting rooms needed"      | Greedy + Min-Heap            | Track earliest end time      |
| "Jump game feasibility/minimum"     | Greedy reach                 | Track maxReach               |
| "Gas station circular"              | Greedy sum tracking          | Reset start when tank < 0    |
| "Partition labels"                  | Greedy last occurrence       | Precompute last index        |
| "Task scheduler"                    | Greedy formula or heap       | Max-Heap by frequency        |
| "Huffman / min merge cost"          | Greedy always merge smallest | Min-Heap                     |

---

### Detailed Recognition Walkthroughs

#### Recognizing Two-Heap (LC 295)

When you see: *"find the median of a continuously growing stream"*
1. "Sorting after every insert is O(N log N) — too slow."
2. "I only need the middle value, not full sorted order."
3. "Split into two halves: max of lower half and min of upper half are the two candidates."
4. "Two-Heap: max-heap for lower half, min-heap for upper half. Maintain boundary and size invariants."

#### Recognizing K-Way Merge (LC 23)

When you see: *"merge K sorted linked lists into one sorted list"*
1. "Brute force: collect all, sort -> O(N log N)."
2. "Better: always pick the globally smallest among current list heads -> O(N log K)."
3. "Min-Heap with one node per list. Poll min, advance that list, offer next node."

#### Recognizing Greedy vs. DP Boundary

Ask: "Can a locally optimal choice ever hurt future choices?"
- **Jump Game:** Extending maxReach never hurts future reach — Greedy works.
- **Coin Change:** Picking the largest coin can strand you — Greedy fails.
- **Interval Scheduling (max count):** Picking earliest-ending always leaves maximum future room — Greedy works.
- **Weighted Interval Scheduling (max value):** High-value long interval might overlap many small-value intervals — Greedy fails, use DP.

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Integer Subtraction Overflow in Comparator

```java
// DANGEROUS — overflows when values are extreme
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> b - a);
// If b = Integer.MAX_VALUE and a = Integer.MIN_VALUE:
// b - a overflows to negative -> wrong order!

// SAFE — always use Integer.compare()
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> Integer.compare(b, a));
```

### Mistake 2: Using Wrong Heap Direction for Top-K

```java
// Goal: Top 3 Largest
// WRONG — Max-Heap doesn't give you an eviction target
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
// You'd have to drain K items from top manually — complex and error-prone

// CORRECT — Min-Heap size K: the top is always the weakest (smallest) to evict
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int num : nums) {
    minHeap.offer(num);
    if (minHeap.size() > k) minHeap.poll(); // evicts smallest
}
// After: minHeap.peek() = Kth largest
```

### Mistake 3: Two-Heap Invariant Violations

```java
// WRONG — adding directly to minHeap can put a small value above a large one
public void addNum(int num) {
    if (!maxHeap.isEmpty() && num > maxHeap.peek()) minHeap.offer(num);
    else maxHeap.offer(num);
    // What if maxHeap is empty? Edge case crash.
}

// CORRECT — always add to maxHeap first, then rebalance
public void addNum(int num) {
    maxHeap.offer(num);
    if (!minHeap.isEmpty() && maxHeap.peek() > minHeap.peek()) {
        minHeap.offer(maxHeap.poll());
    }
    if (maxHeap.size() > minHeap.size() + 1) minHeap.offer(maxHeap.poll());
    else if (minHeap.size() > maxHeap.size()) maxHeap.offer(minHeap.poll());
}
```

### Mistake 4: Trusting Greedy Without Checking the Choice Property

```java
// Problem: minimum coins to make 6 from [1, 3, 4]
// Greedy (largest first): 4 + 1 + 1 = 3 coins
// Optimal: 3 + 3 = 2 coins  <- greedy fails here

// Always try to construct a counter-example before committing to greedy.
// If you find one, the problem requires DP.
```

### Mistake 5: Wrong Sort Metric for Greedy Interval Problems

```java
// Find MAX non-overlapping intervals:
// WRONG: sort by start time — a long early interval blocks many short later ones
// CORRECT: sort by END time — always keep the interval that finishes earliest

// Find MIN meeting rooms needed:
// CORRECT: sort by start time + min-heap of end times
// Different goal = different sort metric!

Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1])); // for max scheduling
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0])); // for meeting rooms
```

### Mistake 6: `peek()` on Empty Heap

```java
// NullPointerException if heap is empty
int top = heap.peek(); // crashes!

// Always check before peeking in conditional logic
if (!maxHeap.isEmpty() && !minHeap.isEmpty()) {
    double median = (maxHeap.peek() + minHeap.peek()) / 2.0;
}
```

---

## 7. Worked Examples

### Example 1: LeetCode 215 — Kth Largest Element in an Array

**Thinking process:**
1. "Kth largest" → Top-K with Min-Heap of size K.
2. After processing all elements, `minHeap.peek()` = Kth largest.

```java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int num : nums) {
            minHeap.offer(num);
            if (minHeap.size() > k) minHeap.poll();
        }
        return minHeap.peek();
    }
}
```

Dry run for `nums = [3, 2, 1, 5, 6, 4]`, `k = 2`:
```
Process 3: heap=[3]
Process 2: heap=[2,3]
Process 1: heap=[1,2,3] size=3>2, evict 1 -> heap=[2,3]
Process 5: heap=[2,3,5] size=3>2, evict 2 -> heap=[3,5]
Process 6: heap=[3,5,6] size=3>2, evict 3 -> heap=[5,6]
Process 4: heap=[4,5,6] size=3>2, evict 4 -> heap=[5,6]
peek() = 5 (2nd largest after 6) ✅
```

*Time: $O(N \log K)$. Space: $O(K)$.*

---

### Example 2: LeetCode 55 — Jump Game

**Thinking process:**
1. "Can I reach the end?" — feasibility → try Greedy.
2. Greedy choice: extend the furthest reachable index at every step.
3. If `i > maxReach`, the current index is unreachable — stuck.

```java
class Solution {
    public boolean canJump(int[] nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > maxReach) return false;
            maxReach = Math.max(maxReach, i + nums[i]);
            if (maxReach >= nums.length - 1) return true;
        }
        return true;
    }
}
```

Dry run for `nums = [3, 2, 1, 0, 4]` (stuck case):
```
i=0: maxReach=max(0,3)=3
i=1: maxReach=max(3,3)=3
i=2: maxReach=max(3,3)=3
i=3: maxReach=max(3,3)=3
i=4: 4 > 3 -> return false ✅
```

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 3: LeetCode 295 — Find Median from Data Stream

**Thinking process:**
1. "Median from growing stream" → Two-Heap.
2. Lower half in Max-Heap, upper half in Min-Heap.
3. Enforce two invariants after every insert.

```java
class MedianFinder {
    private PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    private PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    public void addNum(int num) {
        maxHeap.offer(num);
        if (!minHeap.isEmpty() && maxHeap.peek() > minHeap.peek()) {
            minHeap.offer(maxHeap.poll());
        }
        if (maxHeap.size() > minHeap.size() + 1) minHeap.offer(maxHeap.poll());
        else if (minHeap.size() > maxHeap.size()) maxHeap.offer(minHeap.poll());
    }

    public double findMedian() {
        if (maxHeap.size() == minHeap.size())
            return (maxHeap.peek() + minHeap.peek()) / 2.0;
        return maxHeap.peek();
    }
}
```

Trace adding [1, 2, 3]:
```
Add 1: maxHeap=[1], minHeap=[] -> median=1.0
Add 2: maxHeap=[2,1], boundary: minHeap empty OK
        sizes: 2>0+1 -> move 2 to minHeap
        maxHeap=[1], minHeap=[2] -> median=(1+2)/2=1.5
Add 3: maxHeap=[3,1], boundary: 3>2 -> move 3 to minHeap
        maxHeap=[1], minHeap=[2,3], sizes: 2>1 -> move 2 to maxHeap
        maxHeap=[2,1], minHeap=[3] -> median=2.0 ✅
```

*Time: $O(\log N)$ per insert, $O(1)$ per query.*

---

### Example 4: LeetCode 347 — Top K Frequent Elements

**Thinking process:**
1. Build frequency map, then apply Top-K on map entries.
2. "Top K frequent" → Min-Heap by frequency of size K.

```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int num : nums) freq.merge(num, 1, Integer::sum);

        PriorityQueue<Integer> minHeap = new PriorityQueue<>(
            (a, b) -> Integer.compare(freq.get(a), freq.get(b)) // lower freq at top to evict
        );

        for (int num : freq.keySet()) {
            minHeap.offer(num);
            if (minHeap.size() > k) minHeap.poll();
        }

        int[] result = new int[k];
        for (int i = 0; i < k; i++) result[i] = minHeap.poll();
        return result;
    }
}
```

*Time: $O(N \log K)$. Space: $O(N + K)$.*

---

### Example 5: LeetCode 763 — Partition Labels

**Thinking process:**
1. "Each letter appears in at most one part" → greedy extension.
2. For each character seen, the partition must extend at least to that character's last occurrence.
3. When `i == currentPartitionEnd`, we have a valid cut.

```java
class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;

        List<Integer> result = new ArrayList<>();
        int start = 0, end = 0;

        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) {
                result.add(end - start + 1);
                start = i + 1;
            }
        }
        return result;
    }
}
```

Trace for `s = "ababc"`:
```
last: a=3, b=4, c=4 (recalculate for full string)
Actually for "ababcbacadef..." but let's use "ababc":
last: a=2, b=3, c=4

i=0('a'): end=max(0,2)=2
i=1('b'): end=max(2,3)=3
i=2('a'): end=max(3,2)=3
i=3('b'): end=max(3,3)=3
i=4('c'): end=max(3,4)=4, i==end -> partition size=4-0+1=5, start=5

Result: [5] ✅
```

*Time: $O(N)$. Space: $O(1)$ — fixed-size array of 26.*

---

## 8. Decision Tree: Heap or Greedy?

```
Does the problem involve finding best/worst K elements dynamically?
├── YES -> Heap (PriorityQueue)
│         ├── K largest   -> Min-Heap of size K (evict smallest)
│         ├── K smallest  -> Max-Heap of size K (evict largest)
│         ├── Merge K sorted sources -> Min-Heap of K current heads
│         └── Median stream -> Two-Heap (max lower + min upper)
│
└── NO  -> Does it involve optimization (min/max something)?
           ├── Can I make ONE locally best choice repeatedly?
           │   ├── Interval count/scheduling -> Greedy sort by end time
           │   ├── Jump/reach feasibility   -> Greedy track maxReach
           │   ├── Task/resource scheduling -> Greedy + priority queue
           │   ├── Merge costs (Huffman)    -> Greedy Min-Heap
           │   └── Coin change / paths      -> Verify choice property first!
           │                                   If fails -> use DP
           └── Counting / feasibility with overlapping subproblems -> DP
```

---

## 9. Complexity Cheat Sheet

| Operation / Pattern                  | Time              | Space  |
| ------------------------------------ | ----------------- | ------ |
| Build heap from N elements (heapify) | $O(N)$            | $O(N)$ |
| Insert (offer)                       | $O(\log N)$       | —      |
| Remove root (poll)                   | $O(\log N)$       | —      |
| Peek min/max                         | $O(1)$            | —      |
| Search (contains)                    | $O(N)$ — avoid!   | —      |
| Top-K pattern                        | $O(N \log K)$     | $O(K)$ |
| K-Way Merge (N total, K sources)     | $O(N \log K)$     | $O(K)$ |
| Two-Heap (N inserts, M queries)      | $O(N \log N + M)$ | $O(N)$ |
| Greedy sort + scan                   | $O(N \log N)$     | $O(1)$ |
| Greedy single pass (no sort)         | $O(N)$            | $O(1)$ |

---

## 10. 7-Day Practice Plan (21 Problems)

For each problem, follow this ritual:
1. Identify the signal: Top-K, K-Way Merge, Two-Heap, or Greedy?
2. If Greedy: state the greedy choice and try one adversarial example.
3. If Heap: decide Min or Max? Size K or unbounded?
4. Verify your comparator with two concrete values before coding.
5. Code, trace manually, state complexity.

**Day 1: Heap Fundamentals**
1. [Last Stone Weight (LC 1046)](https://leetcode.com/problems/last-stone-weight/) — Max-Heap, simulate smashing
2. [Kth Largest Element in a Stream (LC 703)](https://leetcode.com/problems/kth-largest-element-in-a-stream/) — Persistent Min-Heap of size K
3. [Take Gifts From the Richest Pile (LC 2558)](https://leetcode.com/problems/take-gifts-from-the-richest-pile/) — Max-Heap simulation

**Day 2: The Top-K Pattern**
4. [Kth Largest Element in an Array (LC 215)](https://leetcode.com/problems/kth-largest-element-in-an-array/) — Classic Min-Heap Top-K
5. [Top K Frequent Elements (LC 347)](https://leetcode.com/problems/top-k-frequent-elements/) ⭐ — Frequency map + Min-Heap
6. [Sort Characters By Frequency (LC 451)](https://leetcode.com/problems/sort-characters-by-frequency/) — Max-Heap by frequency

**Day 3: Custom Comparators**
7. [K Closest Points to Origin (LC 973)](https://leetcode.com/problems/k-closest-points-to-origin/) — Min-Heap by distance squared (no sqrt needed)
8. [Top K Frequent Words (LC 692)](https://leetcode.com/problems/top-k-frequent-words/) ⭐ — Multi-field comparator (freq + alphabetical)
9. [Reorganize String (LC 767)](https://leetcode.com/problems/reorganize-string/) — Greedy + Max-Heap, interleave most frequent

**Day 4: Advanced Heap Patterns**
10. [Merge K Sorted Lists (LC 23)](https://leetcode.com/problems/merge-k-sorted-lists/) ⭐ — K-Way Merge
11. [Find K Pairs with Smallest Sums (LC 373)](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/) — Min-Heap on index pairs
12. [Find Median from Data Stream (LC 295)](https://leetcode.com/problems/find-median-from-data-stream/) ⭐ — Two-Heap architecture

**Day 5: Greedy Basics**
13. [Maximum Subarray (LC 53)](https://leetcode.com/problems/maximum-subarray/) — Kadane's = Greedy reset
14. [Best Time to Buy and Sell Stock II (LC 122)](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) — Greedy collect every upward slope
15. [Assign Cookies (LC 455)](https://leetcode.com/problems/assign-cookies/) — Sort both, greedily assign smallest sufficient cookie

**Day 6: Greedy Scheduling & Jumps**
16. [Jump Game (LC 55)](https://leetcode.com/problems/jump-game/) — Greedy maxReach
17. [Jump Game II (LC 45)](https://leetcode.com/problems/jump-game-ii/) ⭐ — Greedy min jumps, track current/next range
18. [Task Scheduler (LC 621)](https://leetcode.com/problems/task-scheduler/) ⭐ — Greedy formula or Max-Heap simulation

**Day 7: Advanced Greedy**
19. [Gas Station (LC 134)](https://leetcode.com/problems/gas-station/) — Greedy: reset start when tank goes negative
20. [Partition Labels (LC 763)](https://leetcode.com/problems/partition-labels/) — Greedy last-occurrence tracking
21. [Hand of Straights (LC 846)](https://leetcode.com/problems/hand-of-straights/) — Greedy + sorted TreeMap

---

## 11. Mock Interview Module

### Problem: The Distributed Log Aggregator

**Context:** You have $K$ load-balanced servers, each writing logs to local disk in chronological order. Build a centralized `LogAggregator` that merges all $K$ streams into a single chronological stream. Logs are terabytes in size — you cannot load everything into memory.

```java
class Log {
    long timestamp;
    String message;
}
```

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                                       | Interviewer answers  | Why it matters             |
| ---------------------------------------------------- | -------------------- | -------------------------- |
| "Is each server's stream already sorted?"            | Yes, chronologically | Enables K-Way Merge        |
| "Can two logs have identical timestamps?"            | Yes                  | Comparator must be stable  |
| "How many servers K?"                                | ~1,000               | Heap of K=1,000 is trivial |
| "Does `getNextLog()` block or return null on empty?" | Returns null         | Null-check before offering |
| "Must output be strictly chronological?"             | Yes                  | No buffering tolerance     |

---

#### Step 2: Why Not Sort Everything?

```
Brute force: pull ALL logs, sort, stream
  Time: O(N log N) where N = trillions    <- impossible
  Space: O(N) = terabytes in RAM          <- impossible

K-Way Merge: one log from each server in a heap
  Time: O(N log K) — only K items in heap at any time
  Space: O(K) = O(1,000)                 <- trivial

This is optimal: every log must be output (Omega(N)),
each requires O(log K) to find the next minimum.
```

---

#### Step 3: Optimized Solution

```java
class ServerNode {
    Log log;
    ServerAPI server;
    ServerNode(Log log, ServerAPI server) { this.log = log; this.server = server; }
}

class LogAggregator {
    private final PriorityQueue<ServerNode> minHeap;

    public LogAggregator(List<ServerAPI> servers) {
        minHeap = new PriorityQueue<>((a, b) -> Long.compare(a.log.timestamp, b.log.timestamp));

        for (ServerAPI server : servers) {
            Log first = server.getNextLog();
            if (first != null) minHeap.offer(new ServerNode(first, server));
        }
    }

    // O(log K) per call
    public Log getNextAggregatedLog() {
        if (minHeap.isEmpty()) return null;

        ServerNode oldest = minHeap.poll();
        Log result = oldest.log;

        Log next = oldest.server.getNextLog();
        if (next != null) minHeap.offer(new ServerNode(next, oldest.server));

        return result;
    }
}
```

**Space:** $O(K)$ — only K logs in memory at any time.
**Time:** $O(\log K)$ per log emitted.

---

#### Step 4: Follow-up Questions & Expected Answers

**Q1:** "A server goes offline mid-aggregation and `getNextLog()` throws `TimeoutException`. How do you handle it without crashing or permanently losing that server's remaining logs?"

*Expected answer:*
```java
try {
    Log next = oldest.server.getNextLog();
    if (next != null) minHeap.offer(new ServerNode(next, oldest.server));
} catch (TimeoutException e) {
    retryQueue.add(oldest.server); // park in retry queue
    // A background thread retries with exponential backoff and re-injects into minHeap
}
```

"This introduces a correctness risk: if server B is offline but has older logs than what we're currently emitting, we'll emit out-of-order logs. For strict ordering, we need **watermarking** — don't emit any log whose timestamp is older than the oldest unconfirmed timestamp across all servers. This is how Apache Flink and Kafka Streams handle late-arriving events."

**Q2:** "What if two logs have the same timestamp from different servers? How do you ensure a consistent, deterministic output order?"

*Expected answer:*
"Add a secondary comparator field for server index or server name:
```java
minHeap = new PriorityQueue<>((a, b) -> {
    int cmp = Long.compare(a.log.timestamp, b.log.timestamp);
    if (cmp != 0) return cmp;
    return Integer.compare(a.serverIndex, b.serverIndex); // deterministic tie-break
});
```
This makes the output stable and reproducible — important for log replay and debugging."

**Q3:** "Servers emit logs at wildly different rates: one at 10,000/sec, another at 1/sec. How does this affect your design and what would you add in production?"

*Expected answer:*
"The heap itself is unaffected — it always holds exactly $K$ elements regardless of rates. However, the fast server's socket buffer overflows while we wait on the slow server (due to watermarking). Production solutions use **backpressure**: signal the fast server to slow down (TCP flow control or application-level ACKs). We might also apply the watermark only after a configurable timeout — accepting occasional minor out-of-order events for throughput, which is the classic **latency vs. correctness** trade-off in streaming systems."

---

## 12. Quick Reference: Heap & Greedy Java Idioms

```java
// ── PRIORITY QUEUE SETUP ──────────────────────────────────────────────────
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> Integer.compare(b, a));

// Custom object by field:
PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));

// Multi-field comparator:
PriorityQueue<String> heap = new PriorityQueue<>((a, b) -> {
    if (!freq.get(a).equals(freq.get(b))) return Integer.compare(freq.get(a), freq.get(b));
    return b.compareTo(a);
});

// ── TOP-K IDIOM ───────────────────────────────────────────────────────────
for (int num : nums) {
    minHeap.offer(num);
    if (minHeap.size() > k) minHeap.poll(); // keep exactly K elements
}
// After: minHeap.peek() = Kth largest element

// ── K-WAY MERGE SEED ─────────────────────────────────────────────────────
for (int i = 0; i < arrays.length; i++) {
    if (arrays[i].length > 0)
        minHeap.offer(new int[]{arrays[i][0], i, 0}); // [val, arrayIdx, elemIdx]
}

// ── TWO-HEAP SETUP ────────────────────────────────────────────────────────
PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder()); // max-heap (lower half)
PriorityQueue<Integer> hi = new PriorityQueue<>();                            // min-heap (upper half)
// Invariant: lo.peek() <= hi.peek(), |lo.size() - hi.size()| <= 1

// ── GREEDY INTERVAL SORT METRICS ─────────────────────────────────────────
Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1])); // max scheduling: sort by end
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0])); // meeting rooms: sort by start

// ── GREEDY REACH TRACKING ─────────────────────────────────────────────────
int maxReach = 0, jumps = 0, currentEnd = 0;
for (int i = 0; i < n - 1; i++) {
    maxReach = Math.max(maxReach, i + nums[i]);
    if (i == currentEnd) { jumps++; currentEnd = maxReach; } // expand range
}

// ── SAFE COMPARATOR REFERENCE ─────────────────────────────────────────────
// NEVER:  (a, b) -> b - a           // overflow risk
// ALWAYS: (a, b) -> Integer.compare(b, a)
//         (a, b) -> Long.compare(b.timestamp, a.timestamp)

// ── DRAIN HEAP IN ORDER ───────────────────────────────────────────────────
List<Integer> sorted = new ArrayList<>();
while (!heap.isEmpty()) sorted.add(heap.poll()); // min-first order
// Reverse if descending order needed
```