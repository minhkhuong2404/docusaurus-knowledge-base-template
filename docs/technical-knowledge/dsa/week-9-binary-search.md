---
id: week-9-binary-search
title: "Week 9: Binary Search & The Answer Space"
description: Start Phase 3 by mastering logarithmic time complexity. Learn standard Binary Search, handling rotated arrays, and the advanced "Binary Search on Answer Space" pattern in Java.
tags: [dsa, java, binary-search, algorithms, optimization, week-9]
sidebar_position: 9
---

# Week 9: Binary Search & The Answer Space

## 1. Overview
Welcome to Week 9 and the beginning of **Phase 3: Core Algorithms**! For the last 8 weeks, we focused on *where* data is stored (arrays, trees, graphs). Now, we shift our focus to *how* we process that data efficiently. 

We begin with **Binary Search**. While finding an element in a sorted array is trivial, the true power of this pattern lies in **Binary Search on the Answer Space**. If you can prove that a problem has a "monotonic" property (e.g., if a capacity of $X$ works, every capacity $> X$ also works), you can use Binary Search to find the absolute minimum or maximum threshold in breathtakingly fast $O(\log N)$ time.

**Goals for this week:**
- Understand logarithmic time complexity ($O(\log N)$) and why it scales so well.
- Master the standard Binary Search algorithm and Java-specific overflow prevention.
- Learn how to handle edge cases in rotated or modified sorted arrays.
- Master the "Binary Search on Answer Space" pattern.

---

## 2. Theory & Fundamentals

### The Power of $O(\log N)$
If you have 1 million items, a linear search $O(N)$ takes 1,000,000 operations. Binary search cuts the search space in half every iteration. To search 1 million items, it takes at most **20 operations**. To search 1 billion items, it takes **30 operations**. 

### Java Specifics: The Midpoint Overflow
When calculating the middle index, beginners write `int mid = (left + right) / 2;`. 
In Java, the maximum value of an `int` is $2^{31} - 1$. If `left` and `right` are both very large indices (e.g., 1.5 billion), adding them together exceeds the integer limit, resulting in a negative number and throwing an `ArrayIndexOutOfBoundsException`.
**Always use:** `int mid = left + (right - left) / 2;`

### Binary Search on the Answer Space
Sometimes, you aren't searching for an index in an array. Instead, you are searching for an optimal *value* (like a speed, a capacity, or a weight). 
If the possible answers range from `1` to `MAX_VALUE`, and there is a tipping point where everything below $X$ is invalid and everything above $X$ is valid (monotonicity), you can binary search the range of *answers*, checking if the midpoint is valid using a helper function.

---

## 3. Code Templates (Java)

### Template 1: Standard Binary Search
Use this to find a target value in a perfectly sorted array.
```java
public int binarySearch(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (nums[mid] == target) {
            return mid; // Found it
        } else if (nums[mid] < target) {
            left = mid + 1; // Target must be in the right half
        } else {
            right = mid - 1; // Target must be in the left half
        }
    }
    
    return -1; // Target not found
}
```

### Template 2: Binary Search on Answer Space
Use this when you need to find a minimum capacity/speed to satisfy a condition.
```java
public int findMinimumCapacity(int[] tasks, int deadlineHours) {
    int left = 1; // Minimum possible capacity
    int right = getMaxTaskSize(tasks); // Maximum possible capacity needed
    int result = right;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (canFinish(tasks, mid, deadlineHours)) {
            result = mid;     // This capacity works, save it!
            right = mid - 1;  // Can we do it with an even smaller capacity?
        } else {
            left = mid + 1;   // Capacity is too small, we missed the deadline
        }
    }
    
    return result;
}

// Helper function to test a specific answer
private boolean canFinish(int[] tasks, int capacity, int deadline) {
    int hoursSpent = 0;
    for (int task : tasks) {
        // Math.ceil equivalent using integer math: (task + capacity - 1) / capacity
        hoursSpent += (task + capacity - 1) / capacity; 
    }
    return hoursSpent <= deadline;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Binary Search problems:**
1. **"Sorted array" + "Find":** The most obvious trigger. If the array is sorted and you need to find an element, do not use a linear scan.
2. **"Find the minimum in a rotated sorted array":** A classic variation where you must figure out which half of the array is perfectly sorted, and then decide if your target lies in that half.
3. **"Minimize the maximum" or "Maximize the minimum":** This phrasing is a 100% guarantee that it is a **Binary Search on Answer Space** problem. 
4. **Time complexity constraints:** If the problem description explicitly states "Your solution must run in $O(\log n)$ time," you must use binary search or a balanced tree.
5. **Monotonicity hints:** If the problem has a yes/no question about whether a certain value works, and you can reason that if it works for $X$, it will work for all values greater than $X$ (or less than $X$), this is a strong signal for binary searching the answer space.
6. **"Find the k-th smallest/largest":** If the problem asks for the k-th smallest or largest element in a sorted structure, this is often a hint that you can use binary search to find the correct index or value efficiently.
7. **"Find the first/last occurrence":** If the problem asks for the first or last occurrence of a target in a sorted array, this is a strong signal for using binary search with slight modifications to find the boundary indices.
8. **"Find the square root" or "Nth root":** If the problem asks for the integer square root or nth root of a number, this is a classic application of binary search on the answer space, where you are searching for the largest integer `x` such that `x^2 <= n` (or `x^n <= n`).
9. **"Find the minimum capacity/speed":** If the problem asks for the minimum capacity or speed to complete a set of tasks within a deadline, this is a direct application of binary search on the answer space, where you are searching for the smallest integer `k` such that a helper function returns true for `k` and all values greater than `k`.
10. **"Find the maximum distance/size":** If the problem asks for the maximum distance between elements or the maximum size of a subarray that meets certain criteria, this is a strong signal for using binary search on the answer space, where you are searching for the largest integer `k` such that a helper function returns true for `k` and all values less than `k`.

---

## 5. Worked Examples

### Example 1: LeetCode 33. Search in Rotated Sorted Array
**Problem:** An integer array `nums` sorted in ascending order is rotated at an unknown pivot. Given `target`, return its index if found, else `-1`. Must be $O(\log n)$.
**Solution:**
```java
class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            if (nums[mid] == target) return mid;
            
            // Check if the LEFT half is sorted
            if (nums[left] <= nums[mid]) {
                if (target >= nums[left] && target < nums[mid]) {
                    right = mid - 1; // Target is in the sorted left half
                } else {
                    left = mid + 1;  // Target must be in the unsorted right half
                }
            } 
            // Otherwise, the RIGHT half must be sorted
            else {
                if (target > nums[mid] && target <= nums[right]) {
                    left = mid + 1;  // Target is in the sorted right half
                } else {
                    right = mid - 1; // Target must be in the unsorted left half
                }
            }
        }
        return -1;
    }
}
```

### Example 2: LeetCode 875. Koko Eating Bananas
**Problem:** Koko loves to eat bananas. There are `n` piles of bananas. Koko can decide her bananas-per-hour eating speed of `k`. Return the minimum integer `k` such that she can eat all the bananas within `h` hours.
**Solution (Answer Space):**
```java
class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int left = 1;
        int right = 0;
        for (int pile : piles) right = Math.max(right, pile);
        
        int res = right;
        
        while (left <= right) {
            int k = left + (right - left) / 2;
            
            long hoursSpent = 0;
            for (int pile : piles) {
                hoursSpent += (pile + k - 1) / k; // Integer math ceiling
            }
            
            if (hoursSpent <= h) {
                res = k;        // Found a valid speed, record it
                right = k - 1;  // Try to find a slower valid speed
            } else {
                left = k + 1;   // Too slow, must eat faster
            }
        }
        return res;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Binary Search Fundamentals**
1. Binary Search (LC 704)
2. Search Insert Position (LC 35)
3. First Bad Version (LC 278)

**Day 2: Searching in 2D Matrices**
4. Search a 2D Matrix (LC 74)
5. Search a 2D Matrix II (LC 240)
6. Count Negative Numbers in a Sorted Matrix (LC 1351)

**Day 3: Handling Rotated Arrays**
7. Find Minimum in Rotated Sorted Array (LC 153)
8. Search in Rotated Sorted Array (LC 33)
9. Find Minimum in Rotated Sorted Array II (LC 154)

**Day 4: Ranges & Frequencies**
10. Find First and Last Position of Element in Sorted Array (LC 34)
11. Single Element in a Sorted Array (LC 540)
12. Find Peak Element (LC 162)

**Day 5: Introduction to Answer Space**
13. Koko Eating Bananas (LC 875)
14. Capacity To Ship Packages Within D Days (LC 1011)
15. Minimum Number of Days to Make m Bouquets (LC 1482)

**Day 6: Advanced Answer Space Patterns**
16. Split Array Largest Sum (LC 410)
17. Allocate Books (InterviewBit / Neetcode equivalent)
18. Maximum Number of Removable Characters (LC 1898)

**Day 7: Math & Review**
19. Sqrt(x) (LC 69)
20. Valid Perfect Square (LC 367)
21. Time Based Key-Value Store (LC 981) - *System Design implementation using TreeMap or Binary Search.*

---

## 7. Mock Interview Module

### Problem: The Distributed Batch Processor
**Context:** You are writing an auto-scaler for a cloud computing platform. A client submits a list of `jobs`, where `jobs[i]` represents the millions of instructions required for that job. 
The client also provides a `deadline` in seconds. 
You must allocate CPU cores to process these jobs. Each core processes exactly 1 million instructions per second. If a job finishes before the second is up, the CPU core idles until the next second begins (you cannot split jobs across sub-seconds).
To save the client money, you must find the **minimum number of cores** to provision such that all jobs finish within the `deadline`.

**Question:** Write a function `public int minCoresRequired(int[] jobs, int deadline)` that returns the minimum cores needed.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Can the deadline be smaller than the number of jobs?" -> *Interviewer:* If `deadline < jobs.length`, it is physically impossible because each job takes at least 1 second. Return `-1` in this case.
- *Candidate:* "What are the constraints?" -> *Interviewer:* `jobs.length` is up to $10^5$. `jobs[i]` can be up to $10^9$. `deadline` can be up to $10^9$.

#### Step 2: The Brute Force Solution
Explain that we could start by checking if 1 core is enough, then 2 cores, then 3 cores, up to the maximum size of any job.
```java
// Time: O(N * MaxJobSize), Space: O(1)
// (Candidate explains verbally: this will result in a Time Limit Exceeded error since MaxJobSize is 1 billion).
```
*Interviewer Critique:* "Since the jobs can be up to $10^9$, checking every single core count linearly will take an eternity. How can we jump directly to the optimal number?"

#### Step 3: The Optimized Solution (Answer Space Binary Search)
Recognize the monotonic property: If $X$ cores can finish the jobs on time, then $X+1$ cores will *also* finish on time. We need the smallest valid $X$. We will binary search the range from `1` core to the `max(jobs)` cores.
```java
// Time: O(N log(MaxJobSize)), Space: O(1)
public int minCoresRequired(int[] jobs, int deadline) {
    if (deadline < jobs.length) return -1; // Impossible to complete
    
    int left = 1;
    int right = 0;
    for (int job : jobs) {
        right = Math.max(right, job);
    }
    
    int optimalCores = right;
    
    while (left <= right) {
        int midCores = left + (right - left) / 2;
        
        if (canMeetDeadline(jobs, midCores, deadline)) {
            optimalCores = midCores; // Record this success
            right = midCores - 1;    // Try to save more money (fewer cores)
        } else {
            left = midCores + 1;     // Missed deadline, provision more cores
        }
    }
    
    return optimalCores;
}

private boolean canMeetDeadline(int[] jobs, int cores, int deadline) {
    long secondsRequired = 0; // Use long to prevent overflow
    for (int job : jobs) {
        secondsRequired += (job + cores - 1) / cores; // Ceiling division
    }
    return secondsRequired <= deadline;
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "In our helper function, you used a ceiling division trick `(job + cores - 1) / cores`. Why is this preferred over `Math.ceil((double) job / cores)`?"
*Candidate's expected thought process:*
- Casting to a `double` and using `Math.ceil` involves floating-point arithmetic.
- Floating-point arithmetic is significantly slower than integer arithmetic at the CPU level. 
- Furthermore, for extremely large numbers (like `Long.MAX_VALUE`), casting to a `double` can result in precision loss, causing off-by-one errors in mission-critical scheduling algorithms. The integer arithmetic ceiling trick is both faster and perfectly safe from precision loss.