---
id: sliding-window
title: Sliding Window
sidebar_position: 3
description: Solve subarray and substring problems with the sliding window pattern
---

# 🪟 Sliding Window

## Concept

The **Sliding Window** pattern maintains a "window" — a contiguous subarray or substring — and expands or shrinks it efficiently instead of re-computing from scratch each step.

Think of it like a window on a train: it moves forward without reprocessing what it passed.

There are two types:
- **Fixed-size window**: the window size `k` is given
- **Variable-size window**: expand until a condition breaks, then shrink from the left

---

## When to Use

- Problem involves a **contiguous subarray or substring**
- You need max/min/sum/count within a window
- Keywords: "at most k distinct", "longest without repeating", "minimum subarray with sum ≥ X"
- Brute-force would be O(n²) — sliding window reduces it to O(n)

---

## Java Template

### Fixed-Size Window
```java
public int maxSumWindow(int[] nums, int k) {
    int windowSum = 0;
    // Build initial window
    for (int i = 0; i < k; i++) windowSum += nums[i];

    int maxSum = windowSum;
    // Slide: add right element, remove left element
    for (int i = k; i < nums.length; i++) {
        windowSum += nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}
```

### Variable-Size Window (Expand & Shrink)
```java
public int longestValidWindow(int[] nums) {
    int left = 0, maxLen = 0;
    // state tracks what's currently in the window

    for (int right = 0; right < nums.length; right++) {
        // 1. Expand: include nums[right] in window state

        // 2. Shrink: while window is invalid, move left forward
        while (/* window invalid */) {
            // remove nums[left] from state
            left++;
        }

        // 3. Update answer (window is now valid)
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

## Worked Example 1: Longest Substring Without Repeating Characters

```java
public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);

        // If c was seen inside the current window, shrink from left
        if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
            left = lastSeen.get(c) + 1;
        }

        lastSeen.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

**Trace** for `"abcabcbb"`:
```
right=0 (a): window=[0,0]="a"  len=1
right=1 (b): window=[0,1]="ab" len=2
right=2 (c): window=[0,2]="abc" len=3
right=3 (a): 'a' seen at 0 ≥ left=0 → left=1, window=[1,3]="bca" len=3
right=4 (b): 'b' seen at 1 ≥ left=1 → left=2, window=[2,4]="cab" len=3
right=5 (c): 'c' seen at 2 ≥ left=2 → left=3, window=[3,5]="abc" len=3
right=6 (b): 'b' seen at 4 ≥ left=3 → left=5, window=[5,6]="cb" len=2
right=7 (b): 'b' seen at 6 ≥ left=5 → left=7, window=[7,7]="b" len=1

maxLen = 3
```

---

## Worked Example 2: Minimum Window Substring (Hard)

Find the smallest substring of `s` that contains all characters of `t`.

```java
public String minWindow(String s, String t) {
    if (s.isEmpty() || t.isEmpty()) return "";

    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

    int left = 0, satisfied = 0, required = need.size();
    int minLen = Integer.MAX_VALUE, minLeft = 0;
    Map<Character, Integer> window = new HashMap<>();

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window.merge(c, 1, Integer::sum);

        // Check if this character's count satisfies the requirement
        if (need.containsKey(c) && window.get(c).equals(need.get(c))) {
            satisfied++;
        }

        // When all characters are satisfied, try to shrink from left
        while (satisfied == required) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minLeft = left;
            }
            char leftChar = s.charAt(left);
            window.merge(leftChar, -1, Integer::sum);
            if (need.containsKey(leftChar) && window.get(leftChar) < need.get(leftChar)) {
                satisfied--;
            }
            left++;
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(minLeft, minLeft + minLen);
}
```

**Time**: O(|s| + |t|) | **Space**: O(|s| + |t|)

---

## Key Insight: "At Most K" Trick

Problems asking for subarrays with **exactly k** distinct elements can be solved as:
```
exactly(k) = atMost(k) - atMost(k-1)
```

```java
public int subarraysWithKDistinct(int[] nums, int k) {
    return atMost(nums, k) - atMost(nums, k - 1);
}

private int atMost(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    int left = 0, result = 0;
    for (int right = 0; right < nums.length; right++) {
        count.merge(nums[right], 1, Integer::sum);
        while (count.size() > k) {
            int leftVal = nums[left++];
            count.merge(leftVal, -1, Integer::sum);
            if (count.get(leftVal) == 0) count.remove(leftVal);
        }
        result += right - left + 1; // all subarrays ending at right
    }
    return result;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Window Type |
|---|---|---|
| 121 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | Variable |
| 219 | [Contains Duplicate II](https://leetcode.com/problems/contains-duplicate-ii/) | Fixed |
| 643 | [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) | Fixed |

### 🟡 Medium
| # | Problem | Window Type |
|---|---|---|
| 3 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Variable |
| 187 | [Repeated DNA Sequences](https://leetcode.com/problems/repeated-dna-sequences/) | Fixed |
| 209 | [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) | Variable |
| 424 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | Variable |
| 438 | [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/) | Fixed |
| 567 | [Permutation in String](https://leetcode.com/problems/permutation-in-string/) | Fixed |
| 904 | [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/) | At most 2 distinct |
| 992 | [Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/) | Exactly k trick |
| 1004 | [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/) | Variable |

### 🔴 Hard
| # | Problem | Window Type |
|---|---|---|
| 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Variable |
| 239 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | Fixed + Deque |
| 480 | [Sliding Window Median](https://leetcode.com/problems/sliding-window-median/) | Fixed + Two Heaps |
