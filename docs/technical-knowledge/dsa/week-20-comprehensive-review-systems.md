---
id: week-20-comprehensive-review-systems
title: "Week 20: Comprehensive Review & System Design Mappings"
description: The final week! Synthesize all DSA patterns, map abstract data structures to real-world Java backend systems, and master technical interview communication.
tags: [dsa, java, system-design, review, algorithms, week-20]
sidebar_position: 20
---

# Week 20: Comprehensive Review & System Design Mappings

## 1. Overview
Congratulations! You have reached Week 20. You have systematically deconstructed and mastered the core data structures and algorithms required for high-level software engineering. 

This final week is not about learning new algorithms. It is about **Synthesis**. In a real interview, no one tells you "This is a Sliding Window problem." You must rely on pattern recognition to pull the right tool from your toolkit. Furthermore, for senior backend roles, interviewers expect you to understand how these abstract structures map to real-world architectures. 

**Goals for this week:**
- Map DSA concepts directly to backend systems (Databases, Caches, Message Brokers).
- Master the "Ultimate Cheat Sheet" for pattern recognition.
- Complete 21 completely randomized blind problems to simulate real interviews.
- Practice translating algorithmic theory into practical system design components.

---

## 2. Theory: Mapping DSA to Real-World Systems

Understanding *why* these structures exist makes them easier to remember and significantly boosts your signal in system design interviews.

* **Arrays/Append-Only Logs:** This is the foundational structure of distributed message brokers. An append-only contiguous array on disk allows for blazing-fast sequential writes and reads, achieving massive throughput by exploiting the OS page cache.
* **HashMaps & Doubly Linked Lists:** The backbone of caching strategies. An LRU (Least Recently Used) cache uses a HashMap for $O(1)$ lookups and a Doubly Linked List for $O(1)$ evictions of stale data.
* **Red-Black Trees (Java `TreeMap`):** Used extensively in consistent hashing rings to distribute data evenly across multiple servers, allowing for $O(\log N)$ lookups of the nearest server node.
* **B-Trees / B+ Trees:** The underlying data structure for almost all relational database indexes (like PostgreSQL or MySQL). They are massive, flat search trees optimized to minimize disk I/O.
* **Tries (Prefix Trees):** Used for autocomplete in search engines and IP routing in network switches.
* **Graphs (DAGs & Topological Sort):** The engine behind build systems, task schedulers, and resolving dependency injection trees (like the Spring Framework application context startup).

---

## 3. The Ultimate Pattern Recognition Cheat Sheet

When you read a blind problem, look for these triggers:

| Keyword / Trigger Phrase                           | Expected Data Structure / Algorithm                              |
| :------------------------------------------------- | :--------------------------------------------------------------- |
| "Sorted array" + "Find / Maximize / Minimize"      | **Binary Search** (or Binary Search on Answer Space)             |
| "Top K", "K-th Largest/Smallest"                   | **Heap (Priority Queue)**                                        |
| "Contiguous subarray / substring"                  | **Sliding Window** or **Prefix Sums**                            |
| "Find all combinations / subsets / permutations"   | **Backtracking**                                                 |
| "Shortest path" (Unweighted)                       | **BFS (Queue)**                                                  |
| "Shortest path" (Weighted)                         | **Dijkstra's Algorithm (Priority Queue)**                        |
| "Next greater element", "Nearest smaller"          | **Monotonic Stack**                                              |
| "Overlapping times", "Meeting rooms"               | **Sweep Line Algorithm** (Sort by start/end events)              |
| "Find the optimal value", "Max profit", "Min cost" | **Dynamic Programming** (if constraints are small) or **Greedy** |
| "Dependencies", "Prerequisites", "Order of tasks"  | **Topological Sort (Kahn's Algorithm)**                          |
| "Dynamic connectivity", "Adding edges over time"   | **Disjoint Set Union (Union-Find)**                              |

---

## 4. The 7-Day "Blind Mix" Practice Plan

This week, the problems are intentionally randomized. Do not look up the category before solving them. Spend exactly 5 minutes planning your approach (writing comments) before writing a single line of Java. Limit yourself to 40 minutes per problem.

**Day 1: The Warm-up Mix**
1. Product of Array Except Self (LC 238)
2. Lowest Common Ancestor of a Binary Tree (LC 236)
3. Clone Graph (LC 133)

**Day 2: String & Array Synthesis**
4. Longest Palindromic Substring (LC 5)
5. Minimum Window Substring (LC 76)
6. Trapping Rain Water (LC 42)

**Day 3: The Graph & Tree Gauntlet**
7. Serialize and Deserialize Binary Tree (LC 297)
8. Course Schedule II (LC 210)
9. Word Ladder (LC 127)

**Day 4: Time, Scheduling & Optimization**
10. Merge Intervals (LC 56)
11. Task Scheduler (LC 621)
12. Find Median from Data Stream (LC 295)

**Day 5: Search & Logic**
13. Search in Rotated Sorted Array (LC 33)
14. Search a 2D Matrix II (LC 240)
15. LRU Cache (LC 146) - *Crucial for backend engineers.*

**Day 6: Dynamic Programming & Combinatorics**
16. Word Break (LC 139)
17. Coin Change (LC 322)
18. Combination Sum (LC 39)

**Day 7: The Final Bosses**
19. Edit Distance (LC 72)
20. Largest Rectangle in Histogram (LC 84)
21. Merge K Sorted Lists (LC 23)

---

## 5. Mock Interview Module: The API Gateway Rate Limiter

**Context:** You are designing the API Gateway for a high-traffic backend service. To prevent abuse and protect your database from traffic spikes, you need to implement a Rate Limiting interceptor. 

Before we write code, the interviewer asks for a detailed technical explanation of the standard ways to implement rate limiting, and the tradeoffs of each.

#### Step 1: Technical Analysis of Rate Limiting Algorithms
*Candidate Response:*
"There are three primary algorithms used in the industry for rate limiting, each with specific structural tradeoffs:

1. **Fixed Window Counter:** - *Mechanism:* We use a HashMap tracking `Map<TimestampMinute, Integer>`. We increment the counter for the current minute. If it exceeds the limit, we reject the request.
   - *Pros:* Extremely memory efficient ($O(1)$ space per user).
   - *Cons:* Suffers from the 'Boundary Spike' problem. If the limit is 100 requests per minute, a user could send 100 requests at 12:00:59 and another 100 at 12:01:01. They successfully bypassed the intent of the limiter by sending 200 requests in 2 seconds.

2. **Sliding Window Log:**
   - *Mechanism:* We maintain a Queue or list of exact timestamps for every request a user makes. When a new request comes in, we drop all timestamps older than the time window (e.g., 1 minute ago). We then count the remaining timestamps.
   - *Pros:* 100% accurate. Perfectly smooths out boundary spikes.
   - *Cons:* Very memory intensive. If the limit is 1,000 requests per hour, we must store 1,000 physical timestamp objects in memory per active user.

3. **Token Bucket:**
   - *Mechanism:* We assign a 'bucket' to a user. The bucket holds a maximum number of tokens. Tokens are refilled at a constant rate. Each request costs 1 token. If the bucket is empty, the request is dropped.
   - *Pros:* Industry standard. Allows for sudden, short bursts of traffic but strictly limits sustained traffic. Highly memory efficient (only requires storing the current token count and the timestamp of the last refill).

#### Step 2: The Coding Challenge
*Interviewer:* "Excellent breakdown. For our specific use case today, absolute precision is more important than memory. Please implement a **Sliding Window Log** rate limiter for a single user."

**Question:** Implement the `SlidingWindowRateLimiter` class. It is initialized with a `maxRequests` limit and a `timeWindowInSeconds`. Implement the `boolean allowRequest(int timestamp)` method, which returns `true` if the request is allowed, and `false` otherwise. 

*(Assume the timestamps are continuously increasing, representing seconds since the epoch).*

#### Step 3: The Optimized Solution (Deque)
*Candidate's thought process:*
- I need to store a log of timestamps. Since I only care about removing the *oldest* timestamps and adding the *newest* ones, a FIFO (First-In-First-Out) structure is perfect. 
- In Java, I will use a `Deque<Integer>` (specifically an `ArrayDeque`).
- When a request comes at `currentTime`:
  1. Calculate the cutoff time: `currentTime - timeWindowInSeconds`.
  2. While the front of the queue is less than or equal to the cutoff time, `poll()` it out.
  3. If the `queue.size() < maxRequests`, `offer()` the `currentTime` and return true.
  4. Else, return false.

```java
// Time Complexity: O(1) Amortized per request 
// (Each timestamp is added once and removed once)
// Space Complexity: O(maxRequests)

class SlidingWindowRateLimiter {
    private int maxRequests;
    private int windowSizeInSeconds;
    private Deque<Integer> requestLog;

    public SlidingWindowRateLimiter(int maxRequests, int windowSizeInSeconds) {
        this.maxRequests = maxRequests;
        this.windowSizeInSeconds = windowSizeInSeconds;
        this.requestLog = new ArrayDeque<>();
    }

    public boolean allowRequest(int currentTimestamp) {
        int cutoffTime = currentTimestamp - windowSizeInSeconds;

        // Evict all stale timestamps that fall outside the sliding window
        while (!requestLog.isEmpty() && requestLog.peekFirst() <= cutoffTime) {
            requestLog.pollFirst();
        }

        // Check if we have capacity in the current window
        if (requestLog.size() < maxRequests) {
            requestLog.offerLast(currentTimestamp);
            return true; // Request allowed
        }

        // Capacity exceeded
        return false; 
    }
}
```

#### Step 4: Final Wrap-up
*Interviewer:* "This looks solid. In a real distributed environment where this API Gateway is running on 10 different nodes behind a load balancer, your local `ArrayDeque` won't work because it only tracks requests hitting one specific node. How do you fix that?"

*Candidate Response:* "We would need to move the state out of the JVM heap and into a centralized, fast data store like Redis. We can implement this exact Sliding Window Log pattern in Redis using a **Sorted Set (`ZSET`)**. The key would be the User ID, the score would be the timestamp, and the value would be a unique UUID. We can use Redis `ZREMRANGEBYSCORE` to evict the old timestamps, `ZCARD` to check the size, and `ZADD` to add the new request, ideally wrapping it in a Lua script to ensure atomic execution."

---
*You have completed the 20-week roadmap. You are now equipped not only to solve complex algorithms, but to explain them, optimize them, and apply them to real-world software architecture. Best of luck on your interviews!*