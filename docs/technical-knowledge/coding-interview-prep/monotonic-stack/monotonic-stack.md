---
id: monotonic-stack
title: Monotonic Stack
sidebar_position: 20
description: Next greater/smaller element and span problems using monotonic stacks
---

# 📈 Monotonic Stack

## Concept

A **Monotonic Stack** is a stack that maintains elements in either strictly increasing or decreasing order. When a new element violates this property, we pop elements until the invariant is restored.

Every element is pushed and popped **at most once**, so the total time complexity for processing n elements is O(n).

---

## When to Use

- "Next Greater Element" / "Next Smaller Element"
- "Previous Greater/Smaller Element" 
- Spans and widths (how far back does the current element dominate?)
- Histogram area problems
- Stock span problems

---

## Four Variants

```
Increasing Stack  → top is SMALLEST → finds NEXT GREATER to the right
Decreasing Stack  → top is LARGEST  → finds NEXT SMALLER to the right
```

To find "previous" instead of "next": iterate right to left.

---

## Template

```java
// Next Greater Element (to the right) — use INCREASING stack
public int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);                  // default: no greater element
    Deque<Integer> stack = new ArrayDeque<>(); // stores INDICES

    for (int i = 0; i < n; i++) {
        // While current element is GREATER than stack top → stack top found its answer
        while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}

// Previous Smaller Element — use INCREASING stack, iterate L→R, check BEFORE pushing
public int[] prevSmaller(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] >= nums[i]) {
            stack.pop();
        }
        result[i] = stack.isEmpty() ? -1 : nums[stack.peek()];
        stack.push(i);
    }
    return result;
}
```

---

## Worked Example 1: Trapping Rain Water

```java
public int trap(int[] height) {
    int n = height.length;
    int water = 0;
    Deque<Integer> stack = new ArrayDeque<>(); // decreasing stack

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
            int bottom = height[stack.pop()];
            if (stack.isEmpty()) break;

            int left = stack.peek();
            int width = i - left - 1;
            int boundedHeight = Math.min(height[left], height[i]) - bottom;
            water += width * boundedHeight;
        }
        stack.push(i);
    }
    return water;
}
```

**Trace** for `[0,1,0,2,1,0,1,3,2,1,2,1]`:
```
When we find a "right wall" taller than the stack top,
the stack top is the "bottom" of the water pocket.
The left wall is the new stack top after popping.
```

---

## Worked Example 2: Sum of Subarray Minimums

**Problem**: For every subarray, sum up its minimum element.

**Key Insight**: For each element `arr[i]`, count how many subarrays have `arr[i]` as their minimum. This = (distance to previous smaller) × (distance to next smaller or equal).

```java
public int sumSubarrayMins(int[] arr) {
    long MOD = 1_000_000_007L;
    int n = arr.length;
    int[] left = new int[n];   // distance to previous smaller element
    int[] right = new int[n];  // distance to next smaller or equal element

    Deque<Integer> stack = new ArrayDeque<>();

    // Previous smaller: how many elements to the left (including itself) until smaller
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] >= arr[i]) stack.pop();
        left[i] = stack.isEmpty() ? i + 1 : i - stack.peek();
        stack.push(i);
    }

    stack.clear();

    // Next smaller or equal (use >= to avoid double-counting)
    for (int i = n - 1; i >= 0; i--) {
        while (!stack.isEmpty() && arr[stack.peek()] > arr[i]) stack.pop();
        right[i] = stack.isEmpty() ? n - i : stack.peek() - i;
        stack.push(i);
    }

    long result = 0;
    for (int i = 0; i < n; i++) {
        result = (result + (long) arr[i] * left[i] * right[i]) % MOD;
    }
    return (int) result;
}
```

---

## Worked Example 3: Daily Temperatures

```java
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] result = new int[n];
    Deque<Integer> stack = new ArrayDeque<>(); // indices of unresolved days

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int idx = stack.pop();
            result[idx] = i - idx; // days until warmer temperature
        }
        stack.push(i);
    }
    return result;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Variant |
|---|---|---|
| 496 | [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/) | Next greater |
| 682 | [Baseball Game](https://leetcode.com/problems/baseball-game/) | Stack basics |

### 🟡 Medium
| # | Problem | Variant |
|---|---|---|
| 402 | [Remove K Digits](https://leetcode.com/problems/remove-k-digits/) | Monotonic increasing |
| 503 | [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/) | Circular + monotonic |
| 739 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Next greater |
| 856 | [Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/) | Depth tracking |
| 901 | [Online Stock Span](https://leetcode.com/problems/online-stock-span/) | Span (prev ≥) |
| 907 | [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/) | Left × right spans |
| 1019 | [Next Greater Node in Linked List](https://leetcode.com/problems/next-greater-node-in-linked-list/) | Next greater on list |

### 🔴 Hard
| # | Problem | Variant |
|---|---|---|
| 42 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | Water between walls |
| 84 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | Width span |
| 85 | [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/) | Row-by-row histogram |
| 1856 | [Maximum Subarray Min-Product](https://leetcode.com/problems/maximum-subarray-min-product/) | Span × prefix sum |
