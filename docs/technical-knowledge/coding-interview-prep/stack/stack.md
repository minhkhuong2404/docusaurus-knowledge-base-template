---
id: stack
title: Stack
sidebar_position: 7
description: Master stack-based patterns including monotonic stack and expression evaluation
---

# 📚 Stack

## Concept

A **Stack** is a LIFO (Last-In, First-Out) data structure. The key insight in many problems is: *when you see something that might affect what you've already processed, a stack lets you "undo" or "compare" efficiently*.

In Java, use `Deque<Integer> stack = new ArrayDeque<>()` — it's faster than the legacy `Stack<>` class.

---

## When to Use

- Matching/validating **brackets or parentheses**
- **Next greater/smaller element** problems
- Evaluating **expressions** (postfix, infix)
- Tracking **function call depth** (DFS iterative)
- **Undo** operations
- Problems where you need to "remember previous state"

---

## Java Template

```java
Deque<Integer> stack = new ArrayDeque<>();

stack.push(x);        // push to top
stack.pop();          // remove and return top
stack.peek();         // view top without removing
stack.isEmpty();      // check if empty

// Iterate from top to bottom
for (int val : stack) { ... } // NOT stack order — use this only for inspection
```

---

## Pattern: Monotonic Stack

A **Monotonic Stack** maintains elements in strictly increasing or decreasing order. When a new element violates the order, we pop until it's valid again. This finds the **next greater/smaller element** for every element in O(n).

```java
// Next Greater Element to the RIGHT
public int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>(); // stores INDICES

    for (int i = 0; i < n; i++) {
        // Pop all elements smaller than nums[i] — nums[i] is their "next greater"
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}
```

---

## Worked Example 1: Valid Parentheses

```java
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == ']' && top != '[') return false;
            if (c == '}' && top != '{') return false;
        }
    }
    return stack.isEmpty();
}
```

---

## Worked Example 2: Largest Rectangle in Histogram

This is the canonical monotonic stack problem.

```java
public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    int maxArea = 0;
    Deque<Integer> stack = new ArrayDeque<>(); // indices of increasing heights

    for (int i = 0; i <= n; i++) {
        int currHeight = (i == n) ? 0 : heights[i]; // sentinel 0 at end

        while (!stack.isEmpty() && currHeight < heights[stack.peek()]) {
            int h = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, h * width);
        }
        stack.push(i);
    }
    return maxArea;
}
```

**Trace** for `[2, 1, 5, 6, 2, 3]`:
```
i=0: push 0     → stack=[0]
i=1: h[1]=1 < h[0]=2 → pop 0, width=1, area=2*1=2; push 1 → stack=[1]
i=2: push 2     → stack=[1,2]
i=3: push 3     → stack=[1,2,3]
i=4: h[4]=2 < h[3]=6 → pop 3, width=4-2-1=1, area=6*1=6
         h[4]=2 < h[2]=5 → pop 2, width=4-1-1=2, area=5*2=10
         push 4 → stack=[1,4]
i=5: push 5     → stack=[1,4,5]
i=6 (sentinel=0):
     pop 5, h=3, width=6-4-1=1, area=3
     pop 4, h=2, width=6-1-1=4, area=8
     pop 1, h=1, width=6,       area=6

maxArea = 10
```

---

## Worked Example 3: Min Stack (O(1) getMin)

```java
class MinStack {
    private Deque<int[]> stack; // [value, currentMin]

    public MinStack() {
        stack = new ArrayDeque<>();
    }

    public void push(int val) {
        int min = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, min});
    }

    public void pop() { stack.pop(); }

    public int top() { return stack.peek()[0]; }

    public int getMin() { return stack.peek()[1]; }
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Pattern |
|---|---|---|
| 20 | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | Matching brackets |
| 155 | [Min Stack](https://leetcode.com/problems/min-stack/) | Pair stack |
| 225 | [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/) | Design |
| 496 | [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/) | Monotonic |
| 682 | [Baseball Game](https://leetcode.com/problems/baseball-game/) | Simulation |

### 🟡 Medium
| # | Problem | Pattern |
|---|---|---|
| 150 | [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/) | Expression eval |
| 394 | [Decode String](https://leetcode.com/problems/decode-string/) | Nested structure |
| 402 | [Remove K Digits](https://leetcode.com/problems/remove-k-digits/) | Monotonic |
| 739 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Monotonic (next greater) |
| 856 | [Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/) | Depth tracking |
| 901 | [Online Stock Span](https://leetcode.com/problems/online-stock-span/) | Monotonic span |
| 1047 | [Remove All Adjacent Duplicates](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/) | Stack collapse |

### 🔴 Hard
| # | Problem | Pattern |
|---|---|---|
| 42 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | Monotonic stack |
| 84 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | Monotonic stack |
| 85 | [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/) | Row-by-row histogram |
| 224 | [Basic Calculator](https://leetcode.com/problems/basic-calculator/) | Expression eval |
