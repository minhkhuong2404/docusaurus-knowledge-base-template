---
id: two-pointers
title: Two Pointers
sidebar_position: 2
description: Master the two-pointer pattern for array and string problems
---

# 👉👈 Two Pointers

## Concept

The **Two Pointers** pattern uses two index variables that move through the array (or string) — either toward each other (**opposite direction**) or in the same direction (**fast/slow pointers**).

It eliminates the need for nested loops, reducing O(n²) brute-force solutions to O(n).

---

## When to Use

- The array/string is **sorted** (or sorting it first is allowed)
- You're looking for **pairs or triplets** that satisfy a condition
- You need to **partition** or **remove** elements in-place
- The problem mentions "two numbers that sum to target"
- Detecting cycles in a linked list (fast/slow pointer variant)

---

## Types of Two Pointers

### Type 1: Opposite Direction (Converging)

```
[1, 2, 3, 4, 5, 6]
 ↑                ↑
left             right
```
Both pointers start at opposite ends and move inward.

### Type 2: Same Direction (Fast & Slow)

```
[1, 2, 3, 4, 5, 6]
 ↑  ↑
slow fast
```
One pointer runs ahead; the slow pointer marks where valid elements go.

---

## Java Template

```java
// ---- Type 1: Converging (sorted array) ----
public boolean hasPairWithSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return true;
        else if (sum < target) left++;
        else right--;
    }
    return false;
}

// ---- Type 2: Fast/Slow (remove duplicates in-place) ----
public int removeDuplicates(int[] nums) {
    int slow = 0;
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1; // new length
}
```

---

## Worked Example: 3Sum

**Problem**: Find all unique triplets in an unsorted array that sum to zero.

**Approach**:
1. Sort the array → enables two-pointer on the inner pair
2. For each element `nums[i]`, use two pointers for the remaining subarray
3. Skip duplicates to avoid repeated triplets

```java
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();

    for (int i = 0; i < nums.length - 2; i++) {
        // Skip duplicate values for the first element
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        int left = i + 1, right = nums.length - 1;

        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];

            if (sum == 0) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                // Skip duplicates for left and right
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}
```

**Trace** for `[-1, 0, 1, 2, -1, -4]`:
```
After sort: [-4, -1, -1, 0, 1, 2]

i=0 (−4): left=1, right=5 → sum=−4+(−1)+2=−3 < 0 → left++
           left=2, right=5 → sum=−4+(−1)+2=−3 < 0 → left++
           left=3, right=5 → sum=−4+0+2=−2 < 0 → left++
           left=4, right=5 → sum=−4+1+2=−1 < 0 → left++
           left=5 ≥ right → stop

i=1 (−1): left=2, right=5 → sum=−1+(−1)+2=0 ✓ → add [−1,−1,2]
           skip dup for left, right → left=3, right=4
           sum=−1+0+1=0 ✓ → add [−1,0,1]

i=2 (−1): skip (dup of i=1)
...
Result: [[-1,-1,2], [-1,0,1]]
```

**Time**: O(n²) | **Space**: O(1) (ignoring output)

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Not sorting first | Sort when using converging two pointers |
| Off-by-one: `left < right` vs `left <= right` | Use `<` for pairs, `<=` only when single element is valid |
| Missing duplicate skip | After finding a result, advance past all duplicates |
| Forgetting inner loop advances | Both left++ AND right-- after a match |

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Type |
|---|---|---|
| 125 | [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) | Converging |
| 167 | [Two Sum II - Input Array is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | Converging |
| 283 | [Move Zeroes](https://leetcode.com/problems/move-zeroes/) | Fast/Slow |
| 344 | [Reverse String](https://leetcode.com/problems/reverse-string/) | Converging |
| 977 | [Squares of a Sorted Array](https://leetcode.com/problems/squares-of-a-sorted-array/) | Converging |

### 🟡 Medium
| # | Problem | Type |
|---|---|---|
| 11 | [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | Converging |
| 15 | [3Sum](https://leetcode.com/problems/3sum/) | Sort + converging |
| 16 | [3Sum Closest](https://leetcode.com/problems/3sum-closest/) | Sort + converging |
| 18 | [4Sum](https://leetcode.com/problems/4sum/) | Sort + two loops + converging |
| 75 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | 3-way partition (Dutch flag) |
| 80 | [Remove Duplicates II](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/) | Fast/Slow |
| 142 | [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) | Fast/Slow on list |
| 986 | [Interval List Intersections](https://leetcode.com/problems/interval-list-intersections/) | Two list pointers |

### 🔴 Hard
| # | Problem | Type |
|---|---|---|
| 42 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | Converging with max tracking |
| 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Sliding window variant |
