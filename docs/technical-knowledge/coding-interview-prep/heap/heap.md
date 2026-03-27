---
id: heap
title: Heap (Priority Queue)
sidebar_position: 13
description: Min-heap, max-heap, and the top-K pattern in Java
---

# 🏔️ Heap (Priority Queue)

## Concept

A **Heap** is a complete binary tree satisfying the **heap property**:
- **Min-Heap**: parent ≤ children → `peek()` gives the minimum
- **Max-Heap**: parent ≥ children → `peek()` gives the maximum

Java's `PriorityQueue<>` is a min-heap by default.

| Operation | Time |
|---|---|
| Insert | O(log n) |
| Peek (min/max) | O(1) |
| Remove min/max | O(log n) |
| Build heap from n elements | O(n) |

---

## When to Use

- Find the **k-th largest/smallest** element
- Always need quick access to **current min or max**
- **Merge k sorted** lists/arrays
- **Scheduling** problems (always process the next cheapest/fastest)
- Running **median** (two heaps)

---

## Java Template

```java
// Min-Heap (default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// Max-Heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// Custom comparator: sort by second element descending
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> b[1] - a[1]);

// Common operations
pq.offer(element);   // insert — O(log n)
pq.poll();           // remove and return top — O(log n)
pq.peek();           // view top without removing — O(1)
pq.size();
pq.isEmpty();
```

---

## Pattern: Top-K Elements

```java
// K-th Largest Element in an Array
public int findKthLargest(int[] nums, int k) {
    // Maintain a min-heap of size k
    // The top of the heap is always the k-th largest seen so far
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll(); // evict the smallest
        }
    }
    return minHeap.peek(); // the k-th largest
}
```

**Why min-heap for "top K largest"?**
Keep only the K largest. The smallest of those K is the k-th largest overall.

---

## Worked Example: Find Median from Data Stream

Maintain two heaps:
- `maxHeap` (lower half) — top is the largest small number
- `minHeap` (upper half) — top is the smallest large number

```java
class MedianFinder {
    private PriorityQueue<Integer> lower; // max-heap
    private PriorityQueue<Integer> upper; // min-heap

    public MedianFinder() {
        lower = new PriorityQueue<>(Collections.reverseOrder());
        upper = new PriorityQueue<>();
    }

    public void addNum(int num) {
        lower.offer(num); // always add to lower first

        // Balance: lower's max must be ≤ upper's min
        if (!upper.isEmpty() && lower.peek() > upper.peek()) {
            upper.offer(lower.poll());
        }

        // Keep sizes balanced (lower can have at most 1 extra)
        if (lower.size() > upper.size() + 1) {
            upper.offer(lower.poll());
        } else if (upper.size() > lower.size()) {
            lower.offer(upper.poll());
        }
    }

    public double findMedian() {
        if (lower.size() > upper.size()) return lower.peek();
        return (lower.peek() + upper.peek()) / 2.0;
    }
}
```

---

## Worked Example 2: Task Scheduler

```java
public int leastInterval(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char c : tasks) freq[c - 'A']++;

    // Max-heap by frequency
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    for (int f : freq) if (f > 0) maxHeap.offer(f);

    // Queue of [remaining_count, available_at_time]
    Queue<int[]> cooldown = new LinkedList<>();
    int time = 0;

    while (!maxHeap.isEmpty() || !cooldown.isEmpty()) {
        time++;

        if (!maxHeap.isEmpty()) {
            int remaining = maxHeap.poll() - 1;
            if (remaining > 0) {
                cooldown.offer(new int[]{remaining, time + n});
            }
        }

        if (!cooldown.isEmpty() && cooldown.peek()[1] == time) {
            maxHeap.offer(cooldown.poll()[0]);
        }
    }
    return time;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Pattern |
|---|---|---|
| 703 | [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | Min-heap size k |
| 1046 | [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/) | Max-heap |

### 🟡 Medium
| # | Problem | Pattern |
|---|---|---|
| 215 | [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) | Min-heap / quickselect |
| 347 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | Heap + frequency map |
| 373 | [Find K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/) | Min-heap |
| 378 | [Kth Smallest in Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/) | Min-heap / binary search |
| 621 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | Max-heap + cooldown |
| 973 | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/) | Max-heap size k |

### 🔴 Hard
| # | Problem | Pattern |
|---|---|---|
| 23 | [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-lists/) | Min-heap |
| 295 | [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) | Two heaps |
| 480 | [Sliding Window Median](https://leetcode.com/problems/sliding-window-median/) | Two heaps + window |
| 632 | [Smallest Range Covering Elements from K Lists](https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/) | Min-heap + max tracking |
