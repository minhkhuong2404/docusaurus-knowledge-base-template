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
- Master the "Top K Elements" pattern to optimize O(N log N) sorting down to O(N log K).
- Understand the Greedy Choice Property and how to prove a greedy solution is safe.

---

## 2. Theory & Fundamentals

### Heaps (Priority Queues)
A Heap is a specialized tree-based data structure that satisfies the heap property:
- **Min-Heap:** The parent is always *smaller* than or equal to its children. The root is the absolute minimum.
- **Max-Heap:** The parent is always *larger* than or equal to its children. The root is the absolute maximum.
- **Time Complexity:**
    - Insert / Push: O(log N)
    - Extract Min/Max (Poll): O(log N)
    - Find Min/Max (Peek): O(1)
- **Java Specifics:** Heaps are implemented in Java via `PriorityQueue<E>`. By default, it is a **Min-Heap**. To make a Max-Heap, you must pass a comparator: `PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());` or `(a, b) -> Integer.compare(b, a)`.

### Greedy Algorithms
A greedy algorithm makes the optimal choice at each individual step. It never looks back, and it never reconsiders its choices (unlike Backtracking or Dynamic Programming).
- **The Catch:** Greedy algorithms don't work for everything. For example, a greedy algorithm fails at finding the shortest path in a graph with negative weights. You can only use Greedy if the problem exhibits "Optimal Substructure" and the "Greedy Choice Property" (meaning a local win guarantees a global win).
- **Implementation:** Greedy solutions are almost always implemented by either **Sorting** the input first, or using a **Priority Queue** to continually grab the best available option.

---

## 3. Code Templates (Java)

### Template 1: The "Top K" Pattern (Min-Heap for Top K Largest)
If you need the K *largest* elements, do not sort the whole array in O(N log N). Instead, maintain a Min-Heap of size K. When the heap exceeds size K, pop the minimum. You will be left with the K largest elements.
```java
public int[] topKLargest(int[] nums, int k) {
    // Min-Heap
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    
    for (int num : nums) {
        minHeap.offer(num); // Add current number
        
        if (minHeap.size() > k) {
            minHeap.poll(); // Evict the smallest number
        }
    }
    
    // The heap now contains exactly the K largest elements
    int[] result = new int[k];
    for (int i = 0; i < k; i++) {
        result[i] = minHeap.poll();
    }
    return result;
}
```

### Template 2: K-Way Merge (Using Custom Classes)
When merging multiple sorted arrays or linked lists, use a Heap to hold the "next available" item from each list.
```java
class NodeInfo {
    int val;
    int listIndex;
    int elementIndex;
    public NodeInfo(int v, int l, int e) { val = v; listIndex = l; elementIndex = e; }
}

public List<Integer> mergeKSortedArrays(int[][] arrays) {
    // Min-heap ordered by value
    PriorityQueue<NodeInfo> minHeap = new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
    List<Integer> result = new ArrayList<>();
    
    // Add the first element of each array to the heap
    for (int i = 0; i < arrays.length; i++) {
        if (arrays[i].length > 0) {
            minHeap.offer(new NodeInfo(arrays[i][0], i, 0));
        }
    }
    
    while (!minHeap.isEmpty()) {
        NodeInfo curr = minHeap.poll();
        result.add(curr.val); // This is the absolute minimum currently available
        
        // If the array we just pulled from has more elements, add the next one
        if (curr.elementIndex + 1 < arrays[curr.listIndex].length) {
            minHeap.offer(new NodeInfo(
                arrays[curr.listIndex][curr.elementIndex + 1], 
                curr.listIndex, 
                curr.elementIndex + 1
            ));
        }
    }
    return result;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Heap & Greedy problems:**
1. **"Top K", "Kth Largest", "Kth Smallest", "K closest":** This is a 100% guarantee that you need a **Priority Queue**. 
2. **"Median of a Data Stream":** If you need to find the middle of dynamic, incoming data, use the **Two Heaps** pattern (a Max-Heap for the lower half, and a Min-Heap for the upper half).
3. **"Maximize profit", "Minimum jumps", "Fewest coins":** If the problem involves optimization but feels simpler than generating all combinations, try to find a sorting metric that allows you to greedily pick the best option at every step.
4. **"Can we do better than O(N log N)?":** If the problem asks for a solution faster than O(N log N) and involves finding extremums, this is a strong signal that you can use a Heap to optimize down to O(N log K).
5. **"Is this problem asking for a yes/no answer about feasibility?":** If the problem asks if a certain configuration is possible (e.g., can we schedule all tasks with given constraints?), this is often a strong signal that a Greedy approach may work, and you should try to prove the Greedy Choice Property.
6. **"Scheduling", "Resource allocation", "Meeting rooms":** If the problem involves scheduling tasks, meetings, or allocating resources over time, this is a strong signal for using a Greedy approach, often in combination with sorting and/or a Priority Queue to manage ongoing tasks or resources.
7. **"Huffman coding" or "Optimal merge patterns":** If the problem involves merging elements in a way that minimizes total cost (like merging files or encoding characters), this is a classic application of a Min-Heap to always merge the least costly elements first.
8. **"Interval scheduling" or "Activity selection":** If the problem asks for the maximum number of non-overlapping intervals or activities, this is a strong signal for a Greedy approach, where you sort by end time and always pick the next activity that finishes earliest.
9. **"Find the k-th smallest/largest element in a sorted structure":** If the problem asks for the k-th smallest or largest element in a sorted structure, this is often a hint that you can use binary search to find the correct index or value efficiently, or a Heap to maintain the top K elements.
10. **"Find the minimum capacity/speed" or "Find the maximum distance/size":** If the problem asks for the minimum capacity or speed to complete a set of tasks within a deadline, or the maximum distance between elements or the maximum size of a subarray that meets certain criteria, this is a direct application of binary search on the answer space, where you are searching for the smallest or largest integer `k` such that a helper function returns true for `k` and all values greater than or less than `k`.

---

## 5. Worked Examples

### Example 1: LeetCode 215. Kth Largest Element in an Array
**Problem:** Given an integer array `nums` and an integer `k`, return the k-th largest element in the array. Can you solve it without sorting?
**Solution (Min-Heap):**
```java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        // Time: O(N log K), Space: O(K)
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int num : nums) {
            heap.offer(num);
            if (heap.size() > k) {
                heap.poll();
            }
        }
        return heap.peek();
    }
}
```

### Example 2: LeetCode 55. Jump Game
**Problem:** You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position. Return `true` if you can reach the last index.
**Solution (Greedy):**
```java
class Solution {
    public boolean canJump(int[] nums) {
        // Time: O(N), Space: O(1)
        int maxReach = 0;
        
        for (int i = 0; i < nums.length; i++) {
            // If the current index is strictly greater than our max reach, we are stuck
            if (i > maxReach) {
                return false;
            }
            // Greedily update the furthest index we can reach
            maxReach = Math.max(maxReach, i + nums[i]);
            
            // If we can already reach the end, exit early
            if (maxReach >= nums.length - 1) {
                return true;
            }
        }
        return true;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Heap Fundamentals**
1. Last Stone Weight (LC 1046)
2. Kth Largest Element in a Stream (LC 703)
3. Take Gifts From the Richest Pile (LC 2558)

**Day 2: The Top K Pattern**
4. Kth Largest Element in an Array (LC 215)
5. Top K Frequent Elements (LC 347)
6. Sort Characters By Frequency (LC 451)

**Day 3: Coordinate & Multi-field Sorting in Heaps**
7. K Closest Points to Origin (LC 973)
8. Top K Frequent Words (LC 692) - *Requires a custom comparator for frequency AND alphabetical tie-breaking.*
9. Reorganize String (LC 767)

**Day 4: Advanced Heaps (K-Way Merge & Two Heaps)**
10. Merge k Sorted Lists (LC 23)
11. Find K Pairs with Smallest Sums (LC 373)
12. Find Median from Data Stream (LC 295) - *The classic Two-Heap architecture problem.*

**Day 5: Greedy Basics**
13. Maximum Subarray (LC 53) - *Kadane's Algorithm is essentially Greedy.*
14. Best Time to Buy and Sell Stock II (LC 122)
15. Assign Cookies (LC 455)

**Day 6: Greedy Scheduling & Jumps**
16. Jump Game (LC 55)
17. Jump Game II (LC 45)
18. Task Scheduler (LC 621) - *Often solved with a formula, but conceptually Greedy/Heap.*

**Day 7: Advanced Greedy Puzzles**
19. Gas Station (LC 134)
20. Partition Labels (LC 763)
21. Hand of Straights (LC 846) - *Blends HashMaps, Sorting, and Greedy logic.*

---

## 7. Mock Interview Module

### Problem: The Distributed Log Aggregator
**Context:** You are working on the infrastructure team. You have `K` different load-balanced servers. Each server writes application logs to its own local disk. 
You are tasked with building a centralized logging service. You need to pull the logs from all `K` servers and merge them into a single, chronologically sorted stream. 
Each server provides an API endpoint: `server.getNextLog()` which returns the next chronological log from that server (or `null` if empty).

**Question:** Implement a class `LogAggregator` with a method `public Log getNextAggregatedLog()`. Your solution must be highly memory efficient. You cannot pull all logs into memory at once, as the files are terabytes in size.

*Assume the `Log` class is provided:*
```java
class Log {
    long timestamp;
    String message;
}
```

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Does `server.getNextLog()` block if a log isn't ready?" -> *Interviewer:* Assume the logs are historical and already fully written to disk. The method returns in O(1) time.
- *Candidate:* "Are the logs on each individual server guaranteed to be sorted by timestamp?" -> *Interviewer:* Yes.
- *Candidate:* "How many servers `K` are there?" -> *Interviewer:* Around 1,000.

#### Step 2: The Logic (K-Way Merge)
*Candidate's thought process:*
- Since each individual server is already sorted, this is a **K-Way Merge** problem.
- I cannot load all logs into an array and sort them (O(N log N) time and O(N) space where N is trillions).
- Instead, I need to look at the *first available log* from every server, pick the one with the smallest timestamp, and then fetch the *next* log from that specific server to replace it.
- To efficiently find the minimum among `K` items, I will use a **Min-Heap**.

#### Step 3: The Optimized Solution (Priority Queue)
```java
// Space Complexity: O(K) where K is the number of servers
// Time Complexity per log: O(log K)

class ServerNode {
    Log log;
    ServerAPI server;
    
    public ServerNode(Log log, ServerAPI server) {
        this.log = log;
        this.server = server;
    }
}

class LogAggregator {
    private PriorityQueue<ServerNode> minHeap;
    
    public LogAggregator(List<ServerAPI> servers) {
        // Initialize Min-Heap ordered by timestamp
        minHeap = new PriorityQueue<>((a, b) -> Long.compare(a.log.timestamp, b.log.timestamp));
        
        // Initial setup: Pull the first log from every server
        for (ServerAPI server : servers) {
            Log firstLog = server.getNextLog();
            if (firstLog != null) {
                minHeap.offer(new ServerNode(firstLog, server));
            }
        }
    }
    
    public Log getNextAggregatedLog() {
        if (minHeap.isEmpty()) {
            return null; // All logs have been processed
        }
        
        // Grab the absolute oldest log currently available
        ServerNode oldest = minHeap.poll();
        Log result = oldest.log;
        
        // Fetch the next log from the server that just provided the oldest log
        Log nextLog = oldest.server.getNextLog();
        if (nextLog != null) {
            minHeap.offer(new ServerNode(nextLog, oldest.server));
        }
        
        return result;
    }
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "This is excellent. Let's say one of the servers goes offline while you are aggregating, and `server.getNextLog()` throws a `TimeoutException`. How do you ensure your aggregator doesn't crash, but also doesn't infinitely skip that server if it comes back online?"
*Candidate's expected thought process:*
- If a server times out, I should catch the exception. I cannot put that server back into the heap immediately because it has no `Log` to sort by.
- I could maintain a secondary data structure, like a `DeadLetterQueue` or a background retry thread, containing the failed `ServerAPI` references.
- Alternatively, if the system is real-time, I might need to implement a watermarking strategy (wait until all servers have reported a log up to `Timestamp X` before emitting anything) to ensure strict chronological ordering isn't broken by a lagging server.