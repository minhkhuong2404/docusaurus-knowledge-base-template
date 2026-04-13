---
id: week-2-two-pointers-sliding-window
title: "Week 2: Two Pointers & Basic Sliding Window"
description: Master the Two Pointers and fixed-size Sliding Window techniques in Java to optimize nested loops and achieve O(N) time complexity for array and string traversals.
tags: [dsa, java, two-pointers, sliding-window, algorithms, week-2, optimization]
sidebar_position: 2
---

# Week 2: Two Pointers & Basic Sliding Window

## 1. Overview
Welcome to Week 2. Having mastered contiguous memory structures last week, we are now focusing on how to traverse them efficiently. The **Two Pointers** and **Sliding Window** techniques are optimization strategies designed to eliminate nested loops. By maintaining multiple references (pointers) to different indices in an array or string, you can reduce $O(N^2)$ brute-force solutions down to single-pass $O(N)$ solutions.

**Goals for this week:**
- Understand the opposite-directional and same-directional two-pointer techniques.
- Master the fixed-size Sliding Window pattern.
- Learn Java-specific memory optimizations (e.g., `String.charAt()` vs. `toCharArray()`).

---

## 2. Theory & Fundamentals

### Two Pointers
The Two Pointers technique involves using two integer variables (usually representing indices) to traverse a data structure. 
- **Opposite Ends:** One pointer starts at the beginning (`left = 0`), the other at the end (`right = n - 1`). They move toward each other until they meet. This heavily relies on the array being **sorted**.
- **Slow and Fast (Same Direction):** Both start at the beginning. The "fast" pointer explores ahead, while the "slow" pointer keeps track of the position to overwrite or swap data.

### Basic Sliding Window (Fixed Size)
A Sliding Window is a sublist that runs over an underlying collection. In a *fixed-size* window, the distance between the left and right pointers remains constant (e.g., size $K$).
- Instead of recalculating the sum or subset from scratch for every position, you **slide** the window: subtract the element that falls out of the left boundary and add the new element that enters the right boundary.

### Java Specifics
- **String Traversal:** Beginners often use `str.toCharArray()` to traverse strings. While convenient, this allocates a brand new $O(N)$ array in memory. To strictly adhere to $O(1)$ auxiliary space, use `str.charAt(i)`.
- **Garbage Collection:** When using pointers to manipulate objects (like in linked lists later), be mindful of leaving orphaned objects in memory, though Java's Garbage Collector generally handles this for standard primitives and local variables.

---

## 3. Code Templates (Java)

### Template 1: Opposite Ends Two Pointers
```java
public boolean twoPointerTemplate(int[] arr) {
    int left = 0;
    int right = arr.length - 1;
    
    while (left < right) {
        // Example condition
        int sum = arr[left] + arr[right];
        
        if (sum == target) {
            return true;
        } else if (sum < target) {
            left++; // Need a larger sum, move left pointer right
        } else {
            right--; // Need a smaller sum, move right pointer left
        }
    }
    return false;
}
```

### Template 2: Fixed-Size Sliding Window
```java
public int fixedSlidingWindow(int[] arr, int k) {
    int currentWindowSum = 0;
    int maxSum = Integer.MIN_VALUE;
    
    // 1. Build the first window
    for (int i = 0; i < k; i++) {
        currentWindowSum += arr[i];
    }
    maxSum = currentWindowSum;
    
    // 2. Slide the window
    for (int i = k; i < arr.length; i++) {
        // Add the new element, subtract the element left behind
        currentWindowSum += arr[i] - arr[i - k];
        maxSum = Math.max(maxSum, currentWindowSum);
    }
    
    return maxSum;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Two Pointers & Sliding Window problems:**
1. **"Find two numbers that..." in a *Sorted* Array:** If the array is sorted and you need to find pairs (like Two Sum II), immediately use opposite-end two pointers.
2. **"In-place" modifications:** If a problem asks you to remove duplicates or move zeros "in-place" with $O(1)$ extra memory, use slow/fast pointers in the same direction.
3. **"Contiguous Subarray of length K":** Any time a problem asks for the max, min, or average of a contiguous subarray/substring of a *specific, unchanging size*, use a fixed-size sliding window.
4. **"Longest/Shortest Substring/Window":** If the problem asks for the longest or shortest substring that meets certain criteria (e.g., contains all unique characters), this is a strong signal for a variable-size sliding window, which we will cover in Week 4.
5. **"Two Sum" or "3Sum" Variants:** If the problem is a variation of Two Sum but the input is sorted, or if it involves finding triplets, this often indicates a two-pointer approach combined with sorting.
6. **"Palindrome" problems:** When checking if a string is a palindrome or finding palindromic substrings, opposite-end two pointers are typically the most efficient approach.
7. **"Maximum/Minimum Average" problems:** When asked to find the maximum or minimum average of a contiguous subarray of size `k`, this is a direct application of the fixed-size sliding window technique.
8. **"In-place Array Modifications":** If the problem requires modifying the array in place (e.g., removing duplicates, moving zeros), this often signals the use of slow/fast pointers to overwrite elements without extra space.
9. **"Subarray with Certain Properties":** If the problem asks for the longest or shortest subarray that meets certain criteria (e.g., contains all unique characters, has a sum less than a target), this is a strong signal for a variable-size sliding window, which we will cover in Week 4.
10. **"Sorted Array Pair Problems":** If the problem involves finding pairs in a sorted array that meet certain conditions (e.g., sum to a target, have a specific difference), this often indicates the use of opposite-end two pointers.
---

## 5. Worked Examples

### Example 1: LeetCode 125. Valid Palindrome
**Problem:** Given a string `s`, return true if it is a palindrome, considering only alphanumeric characters and ignoring cases.
**Solution (Opposite Ends):**
```java
class Solution {
    public boolean isPalindrome(String s) {
        int left = 0;
        int right = s.length() - 1;
        
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
                left++;
            }
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
                right--;
            }
            
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
}
```

### Example 2: LeetCode 643. Maximum Average Subarray I
**Problem:** You are given an integer array `nums` consisting of `n` elements, and an integer `k`. Find a contiguous subarray whose length is equal to `k` that has the maximum average value and return this value.
**Solution (Fixed Sliding Window):**
```java
class Solution {
    public double findMaxAverage(int[] nums, int k) {
        long currentSum = 0;
        for (int i = 0; i < k; i++) {
            currentSum += nums[i];
        }
        
        long maxSum = currentSum;
        for (int i = k; i < nums.length; i++) {
            currentSum += nums[i] - nums[i - k];
            maxSum = Math.max(maxSum, currentSum);
        }
        
        return (double) maxSum / k;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Two Pointers Basics (Opposite Ends)**
1. Valid Palindrome (LC 125)
2. Reverse String (LC 344)
3. Two Sum II - Input Array Is Sorted (LC 167)

**Day 2: Two Pointers (Same Direction & In-Place)**
4. Remove Duplicates from Sorted Array (LC 26)
5. Move Zeroes (LC 283)
6. Remove Element (LC 27)

**Day 3: Intermediate Two Pointers**
7. Container With Most Water (LC 11)
8. Squares of a Sorted Array (LC 977)
9. 3Sum (LC 15) - *Combines sorting with Two Sum II*

**Day 4: Fixed Sliding Window Basics**
10. Maximum Average Subarray I (LC 643)
11. Diet Plan Performance (LC 1176 - Premium/Neetcode)
12. Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold (LC 1343)

**Day 5: Advanced Fixed Sliding Window**
13. Maximum Points You Can Obtain from Cards (LC 1423)
14. Find All Anagrams in a String (LC 438)
15. Permutation in String (LC 567)

**Day 6: Mixing Pointers & Strings**
16. Valid Palindrome II (LC 680)
17. Reverse Vowels of a String (LC 345)
18. String Compression (LC 443)

**Day 7: Review & Consolidation**
19. Sort Colors (LC 75) - *Dutch National Flag problem*
20. 4Sum (LC 18)
21. Substring of Size Three with Distinct Characters (LC 1876)

---

## 7. Mock Interview Module

### Problem: The API Traffic Spike Analyzer
**Context:** You are writing an operational runbook utility to analyze server logs. You are given an array `requests`, where `requests[i]` represents the number of HTTP requests hitting your Tomcat server at second `i`. You are also given an integer `k`, representing a time window in seconds. 
To configure your rate-limiting and auto-scaling thresholds properly, you need to find the maximum number of requests that occurred in *any* contiguous `k`-second window.

**Question:** Implement a method `public int maxTrafficSpike(int[] requests, int k)` that returns the maximum requests in a `k`-second window.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Can `k` be larger than the size of the `requests` array?" -> *Interviewer:* No, assume $1 \le k \le requests.length$.
- *Candidate:* "Can the number of requests be negative?" -> *Interviewer:* No, traffic counts are strictly non-negative integers.

#### Step 2: The Brute Force Solution
Explain that we could check every possible window of size `k` and sum its elements.
```java
// Time: O(N * K), Space: O(1)
public int maxTrafficSpike(int[] requests, int k) {
    int maxSpike = 0;
    for (int i = 0; i <= requests.length - k; i++) {
        int currentWindow = 0;
        for (int j = i; j < i + k; j++) {
            currentWindow += requests[j];
        }
        maxSpike = Math.max(maxSpike, currentWindow);
    }
    return maxSpike;
}
```
*Interviewer Critique:* "This works, but if `requests` represents a month of data (millions of seconds) and `k` is 3600 (one hour), $O(N \times K)$ will cause a massive CPU spike. Can we do this in a single pass?"

#### Step 3: The Optimized Solution (Fixed Sliding Window)
Recognize that moving the window by one second only requires subtracting the second that drops off and adding the new second.
```java
// Time: O(N), Space: O(1)
public int maxTrafficSpike(int[] requests, int k) {
    int currentSpike = 0;
    
    // Calculate the baseline for the first k-second window
    for (int i = 0; i < k; i++) {
        currentSpike += requests[i];
    }
    
    int maxSpike = currentSpike;
    
    // Slide the window across the rest of the array
    for (int i = k; i < requests.length; i++) {
        currentSpike += requests[i] - requests[i - k];
        maxSpike = Math.max(maxSpike, currentSpike);
    }
    
    return maxSpike;
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "What if instead of a fixed window `k`, we want to find the *longest* time window where the total requests remained *under* a specific threshold `T` (to identify periods of low activity)?"
*Candidate's expected thought process:*
- The window size is no longer fixed (`k`); it is now variable.
- We would need an **Advanced Sliding Window (Variable Size)**. We would expand the `right` pointer to include more seconds until the sum exceeds `T`. Then, we would shrink the `left` pointer until the sum is valid again, keeping track of the maximum window length observed. (Note: This directly sets up the concepts for Phase 4 of the roadmap).
