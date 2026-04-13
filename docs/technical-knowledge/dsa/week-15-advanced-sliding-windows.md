---
id: week-15-advanced-sliding-windows
title: "Week 15: Advanced Sliding Windows"
description: Master the variable-size sliding window pattern in Java. Learn to dynamically expand and shrink boundaries to solve complex substring, subarray, and stream processing problems.
tags: [dsa, java, sliding-window, two-pointers, algorithms, week-15]
sidebar_position: 15
---

# Week 15: Advanced Sliding Windows

## 1. Overview
Welcome to Week 15! Back in Week 2, we looked at *Fixed-Size* Sliding Windows, where the distance between the left and right pointers remained perfectly constant. This week, we upgrade to the **Variable-Size Sliding Window**. 

This pattern is the ultimate tool for processing continuous streams of data. Instead of looking at fixed chunks, you will dynamically expand your window to ingest data until a specific condition is met (or violated), and then shrink the window from behind to restore validity. It is heavily tested in interviews and is the core logic behind network congestion control and API rate limiting.

**Goals for this week:**
- Understand the "Expand Right, Shrink Left" lifecycle.
- Learn how to maintain "state" inside your window (using HashMaps or frequency arrays).
- Master the templates for finding the *Longest* valid window vs. the *Shortest* valid window.
- Learn to optimize Java string processing by avoiding object creation during iteration.

---

## 2. Theory & Fundamentals

### The Dynamic Lifecycle
A variable sliding window relies on two pointers, `left` and `right`, both starting at index 0.
1. **Expand:** Move `right` forward, adding elements to your window's "state".
2. **Evaluate:** Does the window still meet the problem's constraints?
3. **Shrink:** If the window becomes invalid, move `left` forward (removing elements from the state) until the window is valid again.
4. **Update:** Record the maximum or minimum window size observed during the valid states.

### State Tracking (Java Optimization)
To know if your window is valid, you must track what is inside it. 
- If the elements are arbitrary integers or objects, use a `HashMap<Integer, Integer>` to track frequencies.
- **Pro-Tip:** If the elements are characters from a string, **do not use a HashMap**. The overhead of creating `Integer` objects and hashing causes massive slowdowns. Since there are only 128 standard ASCII characters, use a primitive frequency array: `int[] windowState = new int[128];`. This gives you lightning-fast O(1) lookups with zero garbage collection overhead.

---

## 3. Code Templates (Java)

### Template 1: Finding the LONGEST / MAXIMUM Window
Use this when asked for "the longest substring with at most K distinct characters" or "max consecutive ones".
```java
public int findLongestWindow(int[] nums, int k) {
    int left = 0;
    int maxLength = 0;
    int currentCondition = 0; // Tracks whatever the problem restricts
    
    for (int right = 0; right < nums.length; right++) {
        // 1. Add nums[right] to the window state
        currentCondition += nums[right]; 
        
        // 2. If the window is INVALID, shrink it from the left
        while (currentCondition > k) { // Example invalid condition
            currentCondition -= nums[left];
            left++;
        }
        
        // 3. The window is now valid. Update the maximum length.
        maxLength = Math.max(maxLength, right - left + 1);
    }
    
    return maxLength;
}
```

### Template 2: Finding the SHORTEST / MINIMUM Window
Use this when asked for "the shortest subarray with a sum >= target" or "minimum window substring".
```java
public int findShortestWindow(int[] nums, int target) {
    int left = 0;
    int minLength = Integer.MAX_VALUE;
    int currentCondition = 0;
    
    for (int right = 0; right < nums.length; right++) {
        // 1. Add nums[right] to the window state
        currentCondition += nums[right];
        
        // 2. While the window is VALID, record the length and try to make it even smaller!
        while (currentCondition >= target) { // Example valid condition
            minLength = Math.min(minLength, right - left + 1);
            
            // Shrink from the left to see if we can find a shorter valid window
            currentCondition -= nums[left];
            left++;
        }
    }
    
    return minLength == Integer.MAX_VALUE ? 0 : minLength;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Variable Sliding Window problems:**
1. **"Contiguous", "Subarray", or "Substring":** These words rule out combinations/subsets. You must maintain the original order, pointing directly to sliding windows or prefix sums.
2. **"Longest", "Shortest", "Maximum", "Minimum":** The window needs to flex to find the optimal boundary.
3. **Condition limits:** Phrases like "at most K replacements", "contains all characters of", or "sum is greater than or equal to S" dictate exactly when your `while` loop needs to shrink the `left` pointer.
4. **Dynamic state tracking:** If you need to keep track of frequencies, counts, or sums within the window, this is a strong signal for the sliding window pattern.
5. **Performance constraints:** If the problem has a large input size (e.g., $10^5$ or more) and asks for an optimal solution, this is often a hint that a sliding window approach is necessary to achieve O(N) or O(N log K) time complexity.
6. **"Given a stream of data...":** If the problem describes processing a continuous stream of data and maintaining a valid window of recent elements, this is a strong signal for using a sliding window approach to manage the dynamic nature of the input.
7. **"Find the longest/shortest substring with X unique characters":** This is a strong signal for using a sliding window approach, where you can track character frequencies and use the window to find the optimal substring.
8. **"Find pairs with a specific difference":** If the problem asks for pairs of numbers that have a specific difference (e.g., `A - B = K`), you can use a sliding window approach to check for the existence of `A - K` or `A + K` efficiently.
9. **"Find the first non-repeating character":** Use a sliding window approach to maintain a frequency map and track the first unique character efficiently.
10. **"Design a cache with O(1) access and eviction":** This is a classic use case for a combination of `HashMap` (for O(1) access) and a doubly linked list (for O(1) eviction), as seen in LRU Cache implementations, which can be solved using sliding window principles to manage state and optimize access patterns.

---

## 5. Worked Examples

### Example 1: LeetCode 3. Longest Substring Without Repeating Characters
**Problem:** Given a string `s`, find the length of the longest substring without repeating characters.
**Solution (Longest Template with Array State):**
```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] charCounts = new int[128]; // ASCII frequency map
        int left = 0;
        int maxLength = 0;
        
        for (int right = 0; right < s.length(); right++) {
            char rightChar = s.charAt(right);
            charCounts[rightChar]++;
            
            // Invalid condition: We have a duplicate character in the window
            while (charCounts[rightChar] > 1) {
                char leftChar = s.charAt(left);
                charCounts[leftChar]--; // Remove from window
                left++;                 // Shrink window
            }
            
            maxLength = Math.max(maxLength, right - left + 1);
        }
        
        return maxLength;
    }
}
```

### Example 2: LeetCode 76. Minimum Window Substring
**Problem:** Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return `""`.
**Solution (Shortest Template with Array State):**
```java
class Solution {
    public String minWindow(String s, String t) {
        if (s.length() < t.length()) return "";
        
        int[] tFreq = new int[128];
        for (char c : t.toCharArray()) tFreq[c]++;
        
        int[] windowFreq = new int[128];
        int left = 0, matched = 0, minLength = Integer.MAX_VALUE, minStart = 0;
        int requiredMatches = t.length();
        
        for (int right = 0; right < s.length(); right++) {
            char rightChar = s.charAt(right);
            windowFreq[rightChar]++;
            
            // If this character is useful for matching 't', increment matched counter
            if (tFreq[rightChar] > 0 && windowFreq[rightChar] <= tFreq[rightChar]) {
                matched++;
            }
            
            // When window is VALID (contains all required characters)
            while (matched == requiredMatches) {
                // Record if this is the shortest valid window so far
                if (right - left + 1 < minLength) {
                    minLength = right - left + 1;
                    minStart = left;
                }
                
                // Try to shrink from the left
                char leftChar = s.charAt(left);
                windowFreq[leftChar]--;
                
                // If removing the left character breaks the validity, update matched
                if (tFreq[leftChar] > 0 && windowFreq[leftChar] < tFreq[leftChar]) {
                    matched--;
                }
                left++;
            }
        }
        
        return minLength == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLength);
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Variable Window Basics**
1. Minimum Size Subarray Sum (LC 209)
2. Longest Substring Without Repeating Characters (LC 3)
3. Max Consecutive Ones III (LC 1004)

**Day 2: String Manipulations**
4. Longest Repeating Character Replacement (LC 424)
5. Find All Anagrams in a String (LC 438) - *Technically fixed size, but uses similar state logic.*
6. Permutation in String (LC 567)

**Day 3: The "At Most K" Pattern**
7. Longest Substring with At Most K Distinct Characters (LC 340 / Premium or Neetcode)
8. Fruit Into Baskets (LC 904) - *Disguised as "at most 2 distinct characters".*
9. Maximum Erasure Value (LC 1695)

**Day 4: Exact Count Subarrays (Math + Sliding Window)**
10. Binary Subarrays With Sum (LC 930) - *Trick: Exact K = (At Most K) - (At Most K-1)*
11. Count Number of Nice Subarrays (LC 1248)
12. Subarrays with K Different Integers (LC 992) - *Hard, but relies on the Day 4 trick.*

**Day 5: Minimum Windows**
13. Minimum Window Substring (LC 76)
14. Minimum Operations to Reduce X to Zero (LC 1658) - *Think of it as finding the longest subarray summing to Total - X.*
15. Subarray Product Less Than K (LC 713)

**Day 6: Advanced Multi-condition Windows**
16. Get Equal Substrings Within Budget (LC 1208)
17. Replace the Substring for Balanced String (LC 1234)
18. Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit (LC 1438) - *Combines Sliding Window with a Monotonic Queue!*

**Day 7: Sliding Window Potpourri**
19. Maximum Number of Vowels in a Substring of Given Length (LC 1456)
20. Frequency of the Most Frequent Element (LC 1838)
21. Minimum Swaps to Group All 1's Together II (LC 2134)

---

## 7. Mock Interview Module

### Problem: The Corrupted Microservice Trace
**Context:** You are building an observability dashboard for a distributed microservice architecture. When a user makes a request, it travels through multiple services, generating a massive array of chronological trace logs. 
A critical bug occurred, and the SRE team needs to pinpoint where the error started. They know the error involves three specific microservices: `AuthService`, `PaymentService`, and `InventoryService` failing in close proximity.

You are given an array of strings `logs` representing the names of the services that fired events, and a target array `criticalServices = ["AuthService", "PaymentService", "InventoryService"]`.

**Question:** Write a function `public int shortestAnomalyWindow(String[] logs, String[] criticalServices)` that returns the length of the **shortest continuous sequence of logs** that contains *at least one instance* of every critical service. If no such sequence exists, return `0`.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Can the `logs` array contain services that aren't in the `criticalServices` list?" -> *Interviewer:* Yes, it will contain thousands of unrelated service logs (e.g., `EmailService`, `UIService`).
- *Candidate:* "Does the order of the critical services matter in the log sequence?" -> *Interviewer:* No, they just all need to be present within the window.

#### Step 2: The Logic (Minimum Window Pattern)
*Candidate's thought process:*
- "Shortest continuous sequence" + "contains all targets" = **Minimum Window Substring** pattern applied to an array of Strings.
- I will need two HashMaps: one to store the required counts of `criticalServices` (since they only appear once each in the target array, the required count is 1 for each, but a map is safer if the target changes), and one to track the current window state.
- I will expand the `right` pointer. If the log at `right` is a critical service, I add it to my window state.
- Once my window state satisfies the required counts, I try to shrink the `left` pointer to minimize the window length while maintaining validity.

#### Step 3: The Optimized Solution
```java
// Time: O(N) where N is the number of logs
// Space: O(C) where C is the number of critical services (for the maps)
public int shortestAnomalyWindow(String[] logs, String[] criticalServices) {
    if (logs == null || logs.length == 0 || criticalServices.length == 0) return 0;
    
    // 1. Build requirement map
    Map<String, Integer> required = new HashMap<>();
    for (String service : criticalServices) {
        required.put(service, required.getOrDefault(service, 0) + 1);
    }
    
    Map<String, Integer> windowState = new HashMap<>();
    int left = 0;
    int matched = 0;
    int minLength = Integer.MAX_VALUE;
    int requiredMatches = required.size();
    
    // 2. Expand the window
    for (int right = 0; right < logs.length; right++) {
        String rightLog = logs[right];
        
        // If it's a critical service, update the window state
        if (required.containsKey(rightLog)) {
            windowState.put(rightLog, windowState.getOrDefault(rightLog, 0) + 1);
            
            // If the required count for this specific service is met, increment matched
            if (windowState.get(rightLog).equals(required.get(rightLog))) {
                matched++;
            }
        }
        
        // 3. Shrink the window when valid
        while (matched == requiredMatches) {
            minLength = Math.min(minLength, right - left + 1);
            
            String leftLog = logs[left];
            if (required.containsKey(leftLog)) {
                windowState.put(leftLog, windowState.get(leftLog) - 1);
                
                // If shrinking broke the requirement, decrement matched
                if (windowState.get(leftLog) < required.get(leftLog)) {
                    matched--;
                }
            }
            left++;
        }
    }
    
    return minLength == Integer.MAX_VALUE ? 0 : minLength;
}
```