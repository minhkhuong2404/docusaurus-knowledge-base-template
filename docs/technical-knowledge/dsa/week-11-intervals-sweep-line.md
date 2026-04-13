---
id: week-11-intervals-sweep-line
title: "Week 11: Intervals & Sweep Line Algorithms"
description: Master scheduling problems, overlapping events, and the Sweep Line algorithm. Learn how to efficiently sort and process 2D arrays and objects in Java.
tags: [dsa, java, intervals, sweep-line, sorting, algorithms, week-11]
sidebar_position: 11
---

# Week 11: Intervals & Sweep Line Algorithms

## 1. Overview
Welcome to Week 11! Having survived the deep recursive trees of Backtracking, we are shifting gears to deal with time, schedules, and overlapping events. 

This week covers **Intervals** and the **Sweep Line Algorithm**. These patterns are essential for building calendar applications, resource allocators (like meeting rooms or server connections), and processing chronological logs. You will also heavily utilize custom sorting in Java, transitioning from sorting 1D primitives to sorting 2D arrays and custom objects.

**Goals for this week:**
- Understand how to represent ranges `[start, end]` in Java.
- Master custom sorting using Java Lambdas and Comparators.
- Master the Interval Merging pattern.
- Master the Sweep Line pattern to process chronological events without $O(N^2)$ overlapping checks.

---

## 2. Theory & Fundamentals

### Intervals & Sorting
An interval is simply a pair of numbers `[start, end]`. The golden rule of interval problems is that **you almost always need to sort them first.**
- If you sort intervals by their `start` time, any potential overlap with the current interval *must* happen with the very next interval in the sorted list. This reduces a nested-loop $O(N^2)$ brute force into an $O(N \log N)$ sort followed by a single $O(N)$ pass.

### Java Specifics: Custom Sorting
You cannot use `Arrays.sort()` out-of-the-box on a 2D array like `int[][] intervals`. You must provide a custom `Comparator`.
- **The Modern Java Way:** Use lambdas. `Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));`
- *Warning:* Never use subtraction for comparators like `(a, b) -> a[0] - b[0]`. If `a[0]` is a large positive number and `b[0]` is a large negative number, the subtraction will cause an integer overflow and ruin your sort. Always use `Integer.compare()`.

### The Sweep Line Algorithm
Imagine a vertical line sweeping across an X-axis (or time axis) from left to right. 
Instead of treating `[start, end]` as a single block, you break it into two separate events:
1. At time `start`, a resource is **consumed** (e.g., +1 active meeting).
2. At time `end`, a resource is **released** (e.g., -1 active meeting).
By sorting all these individual events chronologically and keeping a running sum, you can instantly find peak overlaps without tracking the specific intervals themselves.

---

## 3. Code Templates (Java)

### Template 1: Merging Intervals
Used when you need to combine overlapping times into continuous blocks.
```java
public int[][] mergeIntervals(int[][] intervals) {
    if (intervals.length <= 1) return intervals;
    
    // 1. Sort by start time
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    
    List<int[]> result = new ArrayList<>();
    // 2. Initialize the first interval as the "current" working interval
    int[] currentInterval = intervals[0];
    result.add(currentInterval);
    
    for (int[] nextInterval : intervals) {
        int currentEnd = currentInterval[1];
        int nextStart = nextInterval[0];
        int nextEnd = nextInterval[1];
        
        // 3. Check for overlap
        if (currentEnd >= nextStart) {
            // Merge them by extending the end time
            currentInterval[1] = Math.max(currentEnd, nextEnd);
        } else {
            // No overlap, this is a distinct interval. Add to list and update pointer.
            currentInterval = nextInterval;
            result.add(currentInterval);
        }
    }
    
    return result.toArray(new int[result.size()][]);
}
```

### Template 2: Sweep Line (Event Processing)
Used when you need to find the maximum concurrent overlaps (e.g., max rooms required).
```java
public int maxConcurrentEvents(int[][] intervals) {
    // 1. Break intervals into separate events
    // Event format: new int[]{time, type}. Type: 1 for start, -1 for end.
    List<int[]> events = new ArrayList<>();
    for (int[] interval : intervals) {
        events.add(new int[]{interval[0], 1});
        events.add(new int[]{interval[1], -1});
    }
    
    // 2. Sort events by time. 
    // CRITICAL TIE-BREAKER: If a 'start' and 'end' happen at the EXACT same time, 
    // process the 'end' first (-1 comes before 1) to free up the resource.
    Collections.sort(events, (a, b) -> {
        if (a[0] != b[0]) {
            return Integer.compare(a[0], b[0]);
        }
        return Integer.compare(a[1], b[1]); 
    });
    
    int currentActive = 0;
    int maxActive = 0;
    
    // 3. Sweep the line
    for (int[] event : events) {
        currentActive += event[1];
        maxActive = Math.max(maxActive, currentActive);
    }
    
    return maxActive;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Interval & Sweep Line problems:**
1. **"Overlapping", "Merge", "Insert":** Direct interval manipulation. Always sort by start time first.
2. **"Minimum number of meeting rooms", "Maximum concurrent connections":** This is a scheduling problem. Use the **Sweep Line** pattern.
3. **"Available time slots" or "Free time":** You need to find the gaps *between* merged intervals. Merge them all first, then loop through the result to find where `interval[i-1].end < interval[i].start`.
4. **"Given a list of events with start and end times...":** This is a strong signal for the Sweep Line pattern, especially if you need to find peak overlaps or resource allocation.
5. **"Find the k-th smallest/largest non-overlapping interval":** After merging intervals, you may be asked to find specific intervals based on their order or size. This is a strong signal that you need to first merge and then apply additional logic to find the desired interval.
6. **"Count the number of overlapping intervals at a specific time":** This is a direct application of the Sweep Line pattern, where you can count how many intervals are active at a given time by processing the start and end events.
7. **"Find the maximum number of overlapping intervals":** This is a classic Sweep Line problem where you need to track the maximum number of active intervals at any point in time.
8. **"Find the total covered length of intervals":** After merging intervals, you may be asked to calculate the total length covered by the merged intervals, which is a direct application of the merging pattern.
9. **"Find the earliest time when all resources are free":** After merging intervals, you can find the earliest gap between merged intervals to determine when all resources are free.
10. **"Find the longest continuous time covered by intervals":** After merging intervals, you can calculate the longest continuous time covered by the merged intervals by finding the maximum difference between the start and end times of the merged intervals.

---

## 5. Worked Examples

### Example 1: LeetCode 56. Merge Intervals
**Problem:** Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals.
**Solution:** *(See Template 1 above, which directly solves this exact problem).*

### Example 2: LeetCode 253. Meeting Rooms II
**Problem:** Given an array of meeting time intervals consisting of start and end times `[[s1,e1],[s2,e2],...]`, find the minimum number of conference rooms required.
**Solution (Sweep Line using PriorityQueue):**
*Note: While Template 2 works perfectly, using a Min-Heap (Priority Queue) to track end times is another highly optimized way to solve this in Java.*
```java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        if (intervals == null || intervals.length == 0) return 0;
        
        // Sort the meetings by start time
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        
        // Use a min-heap to track the END times of active meetings
        PriorityQueue<Integer> allocator = new PriorityQueue<>();
        
        // Add the first meeting's end time
        allocator.add(intervals[0][1]);
        
        for (int i = 1; i < intervals.length; i++) {
            // If the room that frees up the earliest is free before this meeting starts
            if (intervals[i][0] >= allocator.peek()) {
                allocator.poll(); // Free the room
            }
            
            // Assign the new meeting to a room (either the freed one, or a brand new one)
            allocator.add(intervals[i][1]);
        }
        
        // The size of the heap is the number of concurrent rooms needed
        return allocator.size();
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Interval Basics**
1. Merge Intervals (LC 56)
2. Insert Interval (LC 57)
3. Non-overlapping Intervals (LC 435)

**Day 2: Meeting Rooms & Overlaps**
4. Meeting Rooms (LC 252 / Premium or Neetcode)
5. Meeting Rooms II (LC 253 / Premium or Neetcode)
6. Minimum Number of Arrows to Burst Balloons (LC 452)

**Day 3: Two-Pointer Interval Interactions**
7. Interval List Intersections (LC 986)
8. Employee Free Time (LC 759 / Premium)
9. Car Pooling (LC 1094) - *Classic Sweep Line.*

**Day 4: Sweep Line & Events**
10. My Calendar I (LC 729)
11. My Calendar II (LC 731)
12. Shifting Letters II (LC 2381) - *Uses the "Difference Array" technique, a cousin of Sweep Line.*

**Day 5: Advanced Merging & Logic**
13. Teemo Attacking (LC 495)
14. Video Stitching (LC 1024)
15. Remove Covered Intervals (LC 1288)

**Day 6: 2D Sweep Line & Hard Intervals**
16. The Skyline Problem (LC 218) - *The ultimate test of Sweep Line + Priority Queues.*
17. Rectangle Area II (LC 850)
18. Range Module (LC 715)

**Day 7: Consolidating Phase 3**
19. Maximum Length of Pair Chain (LC 646)
20. Data Stream as Disjoint Intervals (LC 352)
21. Corporate Flight Bookings (LC 1109)

---

## 7. Mock Interview Module

### Problem: The Ride-Share Surge Pricing Zones
**Context:** You are working on the backend dispatch system for a ride-sharing app. The app implements "surge pricing" when demand outpaces supply.
You receive a real-time log of passenger requests. Each request is represented as `[request_time, dropoff_time]`. 
The operations team wants to identify the exact **peak time intervals**. A "peak time interval" is any continuous duration where the number of concurrent active rides reaches its absolute maximum for the day.

**Question:** Write a function `public List<int[]> getPeakSurgeIntervals(int[][] rides)` that returns all time intervals where the number of concurrent rides is at its maximum.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Does an active ride include the exact `dropoff_time`?" -> *Interviewer:* No. A ride is active from `[request_time, dropoff_time)`. If one ride ends at 10 and another starts at 10, they do not overlap.
- *Candidate:* "Can there be multiple disjoint peak intervals? E.g., max 5 rides from 8-9am, and max 5 rides from 5-6pm?" -> *Interviewer:* Yes. Return all of them.

#### Step 2: The Logic (Sweep Line)
*Candidate's thought process:*
- I need to track concurrent overlaps. This is a Sweep Line problem.
- First, break `rides` into events: `{time, type}` where type is `+1` (start) and `-1` (end).
- Sort the events. If times tie, process `-1` before `+1` (since rides end exclusively).
- As I sweep the line, I will calculate `currentActive`. 
- To find the *intervals* themselves, I need to know when I *enter* the maximum state and when I *exit* it.

#### Step 3: The Optimized Solution
```java
// Time: O(N log N), Space: O(N)
public List<int[]> getPeakSurgeIntervals(int[][] rides) {
    if (rides == null || rides.length == 0) return new ArrayList<>();
    
    // 1. Build and sort events
    List<int[]> events = new ArrayList<>();
    for (int[] ride : rides) {
        events.add(new int[]{ride[0], 1});
        events.add(new int[]{ride[1], -1});
    }
    
    events.sort((a, b) -> {
        if (a[0] != b[0]) return Integer.compare(a[0], b[0]);
        return Integer.compare(a[1], b[1]); // Process ends (-1) before starts (1)
    });
    
    // 2. Find the absolute maximum concurrent rides
    int currentActive = 0;
    int maxActive = 0;
    for (int[] event : events) {
        currentActive += event[1];
        maxActive = Math.max(maxActive, currentActive);
    }
    
    // 3. Sweep again to capture the intervals where currentActive == maxActive
    List<int[]> peakIntervals = new ArrayList<>();
    currentActive = 0;
    Integer peakStart = null;
    
    for (int[] event : events) {
        currentActive += event[1];
        
        // If we just hit the max, record the start time
        if (currentActive == maxActive) {
            peakStart = event[0];
        } 
        // If we were at max, and a ride just ended, we drop below max. Close the interval.
        else if (peakStart != null && currentActive < maxActive) {
            // Edge case check: Avoid 0-length intervals if multiple events happen instantly
            if (peakStart < event[0]) { 
                peakIntervals.add(new int[]{peakStart, event[0]});
            }
            peakStart = null;
        }
    }
    
    return peakIntervals;
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "Your solution takes two passes. One to find the `maxActive`, and another to build the intervals. Is there a way to do this in a single pass?"
*Candidate's expected thought process:*
- Yes, we can do it in a single pass, but we have to maintain a dynamic list of results.
- During the single sweep, if `currentActive > maxActive`, it means everything we saved in our `peakIntervals` list so far is "wrong" (it wasn't the true daily maximum). We would have to `.clear()` the list, update `maxActive`, and start a new interval.
- If `currentActive == maxActive`, we just append the new start time to our ongoing results.
- This single-pass optimization improves the constant factor but maintains the $O(N \log N)$ time complexity due to the sorting step.