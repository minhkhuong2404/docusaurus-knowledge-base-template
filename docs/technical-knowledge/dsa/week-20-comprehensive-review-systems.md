---
id: week-20-comprehensive-review-systems
title: "Week 20: Comprehensive Review & System Design Mappings"
description: The final week! Synthesize all DSA patterns, map abstract data structures to real-world Java backend systems, and master technical interview communication.
tags: [dsa, java, system-design, review, algorithms, week-20]
sidebar_position: 20
---

import DsaWeek20LruCacheDiagram from '@site/src/components/DsaWeek20LruCacheDiagram';

# Week 20: Comprehensive Review & System Design Mappings

## 1. Overview

Congratulations! You have reached Week 20. You have systematically deconstructed and mastered the core data structures and algorithms required for high-level software engineering.

This final week is not about learning new algorithms. It is about **Synthesis**. In a real interview, no one tells you "This is a Sliding Window problem." You must rely on pattern recognition to pull the right tool from your toolkit. Furthermore, for senior backend roles, interviewers expect you to understand how these abstract structures map to real-world architectures.

**Goals for this week:**
- Map every DSA concept to a concrete backend system or Java library.
- Master the "Ultimate Cheat Sheet" for first-30-second pattern recognition.
- Complete 21 completely randomized blind problems to simulate real interviews.
- Practice translating algorithmic theory into practical system design components.
- Build a mental interview protocol from problem statement to clean code.

### Knowledge You Need Before Starting

- Completion of Weeks 1-19 with at least one solved medium problem per pattern.
- Ability to explain trade-offs (time, space, readability, maintainability).
- Comfort communicating brute force -> optimization progression aloud.
- Familiarity with Java standard library choices under interview pressure.

---

## 2. DSA → Real-World System Mappings

<DsaWeek20LruCacheDiagram />


Understanding *why* these structures exist makes them easier to remember, and dramatically boosts your signal in system design interviews when you can connect the dots out loud.

### 2.1 Linear Structures

**Arrays / Append-Only Logs**

The array is the most cache-friendly data structure in existence. Sequential memory access allows the CPU to prefetch data into cache lines automatically, achieving near-theoretical memory bandwidth.

```
Real-world application: Apache Kafka Topics

Kafka stores messages in an append-only log — physically, a flat file on disk.
Writes are always sequential (O(1)), which saturates disk I/O throughput.
Consumers track their position with an "offset" (array index).
Zero-copy transfers (sendfile syscall) send data from disk directly to network,
bypassing the JVM heap entirely.

DSA concept used: Array + Prefix Sum (offsets are cumulative byte positions)
```

**ArrayDeque as Stack and Queue**

Java's `ArrayDeque` is implemented as a resizable circular array. It outperforms both `LinkedList` (poor cache locality) and `Stack` (synchronized, legacy) for stack and queue operations.

```java
// In Java: ALWAYS prefer ArrayDeque over LinkedList for queues
// LinkedList: nodes scattered in heap → cache miss on every next pointer
// ArrayDeque:  circular array → sequential memory → cache friendly

Deque<Integer> stack = new ArrayDeque<>();  // use as stack: push/pop
Queue<Integer> queue = new ArrayDeque<>();  // use as queue: offer/poll
```

**HashMaps & Doubly Linked Lists — The LRU Cache**

The most famous interview data structure combination: HashMap for $O(1)$ key lookup, Doubly Linked List for $O(1)$ eviction of the least recently used item.

```
Java's LinkedHashMap is exactly this: HashMap + insertion-order DLL.
Set accessOrder=true to make it LRU-order:

new LinkedHashMap<K,V>(capacity, 0.75f, true) {
    protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
        return size() > capacity; // auto-evict when over capacity
    }
}

Real-world: Spring's @Cacheable, Redis LRU eviction policy, CPU L1/L2 cache
```

**Monotonic Stack — Stream Processing**

Monotonic stacks maintain elements in a sorted order, giving $O(1)$ access to the "previous greater element" or "nearest smaller element" — patterns that appear in stock price analysis, histogram processing, and event stream windowing.

```
Real-world application: Real-time stock alert systems
"Alert me when the current price drops below any previous high within the last N prices"
→ Maintained by a decreasing monotonic stack of (price, timestamp) pairs.

Financial stream processors like Apache Flink use exactly this pattern for
temporal pattern detection on event streams.
```

---

### 2.2 Tree Structures

**Red-Black Trees — Java `TreeMap` and `TreeSet`**

Java's `TreeMap` and `TreeSet` are backed by a Red-Black Tree, a self-balancing BST. Every operation is $O(\log N)$ but maintains sorted order — unlike HashMap's $O(1)$ unsorted access.

```
When to use TreeMap over HashMap:
  - Need floor/ceiling of a key: floorKey(), ceilingKey()
  - Need range queries: subMap(from, to)
  - Need elements in sorted order: firstKey(), lastKey()

Real-world: Consistent Hashing Ring
  A TreeMap<Long, ServerNode> maps virtual node hash values to physical servers.
  When a request arrives with hash H, find its server via:
  TreeMap.ceilingKey(H) or TreeMap.firstKey() (wrap around)
  -> O(log N) server lookup for any request
  Used in Cassandra, DynamoDB, Redis Cluster for data distribution.
```

**B-Trees / B+ Trees — Database Indexes**

B+ Trees are the data structure behind almost every relational database index (PostgreSQL, MySQL InnoDB, Oracle). They are wide, shallow trees (branching factor ~100-1000) that minimize disk I/O.

```
Why not a BST for database indexes?
  BST height for 1 million keys: ~20 levels → 20 disk seeks
  B+ Tree height for 1 million keys, branching factor 1000: ~2 levels → 2 disk seeks

Each node = one disk page (4-16KB). Wide nodes = fewer levels = fewer I/O operations.

DSA concepts at work:
  - Binary Search within each node (array)
  - Tree traversal for range scans
  - Leaf nodes form a linked list → sequential scan without tree traversal
```

**Tries — Network Routing and Autocomplete**

```
IP routing in network switches (Longest Prefix Match):
  Destination IP: 192.168.1.45
  Routing table stored as a BINARY Trie on the 32-bit IP address.
  Walk the trie bit by bit to find the most specific matching route.
  Hardware routers use specialized Ternary CAM memory for O(1) trie lookup.

Search engine autocomplete:
  Google's "did you mean" uses a Trie of n-grams with frequency weights at nodes.
  Each TrieNode stores top-K suggestions → O(prefix_length) query time.
```

**Binary Heap — Java `PriorityQueue` and OS Schedulers**

```
OS Process Scheduling (Linux CFS — Completely Fair Scheduler):
  Processes stored in a Red-Black Tree ordered by virtual runtime.
  Always pick the process with minimum virtual runtime → leftmost tree node.
  DSA: Min-Heap conceptually, Red-Black Tree in practice for O(log N) insert.

Java garbage collector (G1GC):
  Heap regions sorted by "reclaimable garbage" in a Priority Queue.
  Always collect the region with most garbage first (highest return on GC time).
```

---

### 2.3 Graph Structures

**DAGs and Topological Sort — Build Systems and Dependency Injection**

```
Maven/Gradle build lifecycle:
  Each JAR module is a node. "A depends on B" is a directed edge B → A.
  Kahn's Algorithm determines the build order.
  Parallel builds: modules at the same BFS level compile simultaneously.
  Cycle detection: Maven fails with "Circular dependency detected".

Spring Framework ApplicationContext startup:
  @Bean dependencies form a DAG.
  Spring performs topological sort to initialize beans in dependency order.
  @Lazy breaks cycles by deferring instantiation.
  Spring's DependencyDescriptor resolution is essentially Kahn's Algorithm.
```

**Union-Find — Network Connectivity and Database Transactions**

```
Database transaction isolation (detecting serialization anomalies):
  Transactions form a directed conflict graph.
  Union-Find detects cycles → indicates serialization conflict → abort one transaction.

Network monitoring (connectivity):
  When a cable is added: union(serverA, serverB)
  "Is dataCenter1 reachable from dataCenter2?": find(dc1) == find(dc2)
  O(α(N)) ≈ O(1) per operation — practically constant time.
```

**Dijkstra's Algorithm — Network Routing Protocols**

```
OSPF (Open Shortest Path First):
  Each router runs Dijkstra on the entire network topology graph.
  Edge weights = link costs (bandwidth, delay, reliability).
  Result: shortest path tree rooted at this router → fills routing table.

Google Maps / GPS Navigation:
  A* algorithm (Dijkstra + heuristic) on a road network graph.
  Edge weights = expected travel time (updated in real-time).
  Bidirectional Dijkstra (search from source AND destination simultaneously)
  reduces search space dramatically for long-distance routes.
```

---

### 2.4 Algorithmic Patterns

**Sliding Window — Stream Processing Windows**

```
Apache Flink / Kafka Streams temporal windows:
  Tumbling Window: fixed-size non-overlapping windows → array reset every N seconds
  Sliding Window: overlapping windows → exactly our Sliding Window algorithm
  Session Window: gap-based grouping → monotonic stack/queue of event timestamps

Real application: "Count unique users in last 5 minutes"
  Deque<Long> window maintains timestamps of events.
  On each new event: evict events older than (now - 5min), count remaining.
  O(1) amortized per event — identical to our Sliding Window Rate Limiter.
```

**Dynamic Programming — Route Optimization and Pricing**

```
Airline pricing (Revenue Management Systems):
  Each seat × date = a state. DP optimizes which price to offer
  given remaining inventory and days until departure.
  dp[seats_remaining][days_to_departure] = optimal_expected_revenue

Uber/Lyft surge pricing:
  DP over a time-price matrix to maximize driver utilization.
  State: (time_slot, available_drivers) → optimal_price_multiplier

Sequence alignment (bioinformatics, diff tools):
  Edit Distance DP (LC 72) is the exact algorithm behind:
  - Unix diff / git diff (finding minimal changes between files)
  - DNA sequence alignment (BLAST algorithm)
  - Spell checkers (minimum edits to fix a word)
```

**Backtracking — Constraint Satisfaction in Production Systems**

```
SQL Query Optimizer (PostgreSQL planner):
  Joins can be ordered in N! ways for N tables.
  The planner uses backtracking + dynamic programming to find optimal join order.
  Pruning: if estimated cost of partial plan > current best, abandon branch.

Sudoku-style constraint propagation appears in:
  - Compiler register allocation (graph coloring)
  - Network resource reservation (wavelength assignment in optical networks)
  - Shift scheduling (assign nurses to shifts satisfying all constraints)
```

---

## 3. The Ultimate Pattern Recognition Cheat Sheet

When you receive a problem, spend 2-3 minutes mapping keywords to algorithms before writing any code.

### 3.1 Master Trigger → Algorithm Table

| Keyword / Trigger Phrase                      | Algorithm                         | Time Complexity             |
| --------------------------------------------- | --------------------------------- | --------------------------- |
| "Sorted array" + "Find / Target"              | Binary Search                     | $O(\log N)$                 |
| "Minimum/maximum satisfying condition"        | Binary Search on Answer           | $O(N \log N)$               |
| "Top K / Kth largest / Kth smallest"          | Min-Heap of size K                | $O(N \log K)$               |
| "Median from stream"                          | Two Heaps                         | $O(\log N)$ per insert      |
| "Merge K sorted lists/streams"                | K-Way Merge (Min-Heap)            | $O(N \log K)$               |
| "Contiguous subarray/substring + max/min"     | Sliding Window                    | $O(N)$                      |
| "Subarray sum = K" (can be negative)          | Prefix Sum + HashMap              | $O(N)$                      |
| "All combinations / subsets"                  | Backtracking                      | $O(2^N)$                    |
| "All permutations"                            | Backtracking                      | $O(N!)$                     |
| "Shortest path, unweighted"                   | BFS                               | $O(V + E)$                  |
| "Shortest path, non-negative weights"         | Dijkstra                          | $O((V+E) \log V)$           |
| "Shortest path, negative weights"             | Bellman-Ford                      | $O(V \times E)$             |
| "Connect all nodes, minimum cost"             | Prim's / Kruskal's MST            | $O(E \log V)$               |
| "Next greater / previous smaller element"     | Monotonic Stack                   | $O(N)$                      |
| "Sliding window maximum"                      | Monotonic Deque                   | $O(N)$                      |
| "Overlapping intervals / meeting rooms"       | Sort by start/end + Heap          | $O(N \log N)$               |
| "Prerequisites / task ordering / build order" | Topological Sort (Kahn's)         | $O(V + E)$                  |
| "Can all tasks complete? (cycle detection)"   | Kahn's count check or 3-State DFS | $O(V + E)$                  |
| "Dynamic connectivity / union-find"           | Union-Find (DSU)                  | $O(\alpha(N)) \approx O(1)$ |
| "Maximum / minimum optimization, small N"     | Dynamic Programming               | $O(N^2)$ or better          |
| "Maximum / minimum, greedy provable"          | Greedy + Sort                     | $O(N \log N)$               |
| "Autocomplete / prefix search / wildcard"     | Trie                              | $O(L)$ per query            |
| "All words in grid from dictionary"           | Trie + Grid DFS                   | $O(M \times N \times 4^L)$  |
| "Height / diameter / path in tree"            | DFS (Post-order)                  | $O(N)$                      |
| "Level by level / shortest path in tree"      | BFS                               | $O(N)$                      |
| "BST / sorted from tree"                      | DFS (In-order)                    | $O(N)$                      |
| "Lowest Common Ancestor"                      | DFS (Post-order, bubble up)       | $O(N)$                      |

---

### 3.2 The 5-Minute Interview Protocol

**Follow this exact sequence every time:**

```
Minute 1: READ & RESTATE
  - Read the problem completely.
  - Restate it in your own words: "So the problem is asking me to..."
  - Identify: What is the input? What is the output?

Minute 2: CLARIFY
  - Ask 2-3 targeted clarifying questions:
    "Can the array be empty or contain duplicates?"
    "Are there negative numbers?"
    "Can I assume the graph is connected?"
    "What are the constraints on N? (this tells you the expected time complexity)

Minute 3: BRUTE FORCE + PATTERN RECOGNITION
  - State the brute force approach and its complexity.
  - Identify the keyword triggers from Section 3.1.
  - State the optimized approach: "I see this is a [PATTERN] problem because [SIGNAL]."

Minute 4: DESIGN
  - Write out the algorithm in comments before any code:
    // 1. Build adjacency list
    // 2. Run Dijkstra with min-heap
    // 3. Return max of all distances

Minute 5: CODE
  - Implement cleanly. Speak as you type.
  - Use meaningful variable names.
  - After coding: trace through a small example manually.
  - State time and space complexity.
```

---

### 3.3 Complexity Target Guide

When you see the constraint on N, you know the expected time complexity and therefore the algorithm class:

| Constraint     | Max Time Complexity | Algorithm Class                         |
| -------------- | ------------------- | --------------------------------------- |
| $N \leq 10$    | $O(N!)$             | Backtracking (permutations)             |
| $N \leq 20$    | $O(2^N)$            | Backtracking (subsets), Bitmask DP      |
| $N \leq 100$   | $O(N^3)$            | Floyd-Warshall, 3D DP                   |
| $N \leq 1,000$ | $O(N^2)$            | 2D DP, $O(N^2)$ graph algorithms        |
| $N \leq 10^5$  | $O(N \log N)$       | Sorting, Heaps, Dijkstra, Binary Search |
| $N \leq 10^6$  | $O(N)$              | Sliding Window, Prefix Sum, Linear DP   |
| $N \leq 10^9$  | $O(\log N)$         | Binary Search only                      |

---

### 3.4 Data Structure Selection Guide

```
Need fast lookup by key?
├── Key is integer in range [0, N) → int[] array (fastest, cache-friendly)
├── Key is string/object, many distinct values → HashMap
└── Key needs sorted order, range queries → TreeMap

Need a collection with order?
├── Access by index, rarely insert/delete → ArrayList / int[]
├── Frequent insert/delete at head → ArrayDeque
└── Frequent insert/delete anywhere → LinkedList (rare in interviews)

Need to always access min or max?
├── Static data → sort first, then binary search
└── Dynamic data (elements added/removed) → PriorityQueue (heap)

Need to detect cycles in a graph?
├── Undirected → boolean[] visited + "parent check"
├── Directed → 3-state DFS (0=unvisited, 1=visiting, 2=done)
└── Dynamic (edges added over time) → Union-Find

Need string prefix operations?
├── Fixed alphabet (a-z) → Trie with TrieNode[26]
└── General alphabet → Trie with HashMap<Character, TrieNode>

Need to reconstruct the path, not just the cost?
├── Add: int[] parent array alongside dist[]
└── After Dijkstra: backtrack from end to start via parent[]
```

---

## 4. Week-by-Week Synthesis: What You've Mastered

### Phase 1 (Weeks 1-4): Foundations

| Week | Topic                                | Key Insight                                                   |
| ---- | ------------------------------------ | ------------------------------------------------------------- |
| 1    | Arrays, Strings, Prefix Sums         | `prefix[R+1] - prefix[L]` = $O(1)$ range queries              |
| 2    | Two Pointers, Sliding Window         | Reduce $O(N^2)$ brute force to $O(N)$ by maintaining a window |
| 3    | Linked Lists, Fast/Slow Pointers     | Floyd's: `F = C - h` guarantees cycle entry convergence       |
| 4    | Stacks, Queues, Monotonic Structures | Next greater element in $O(N)$; BFS level-order processing    |

### Phase 2 (Weeks 5-8): Core Data Structures

| Week | Topic                            | Key Insight                                                          |
| ---- | -------------------------------- | -------------------------------------------------------------------- |
| 5    | Hash Maps, Sets                  | $O(1)$ lookup changes $O(N^2)$ "pair finding" to $O(N)$              |
| 6    | Binary Trees, BSTs               | Post-order = "children before parent"; in-order BST = sorted         |
| 7    | Graphs: BFS/DFS, Grid Traversal  | BFS = shortest path (unweighted); 3-color DFS = cycle detection      |
| 8    | Advanced Graphs: DAGs, Topo Sort | In-degree 0 = no prerequisites; Kahn's count check = cycle detection |

### Phase 3 (Weeks 9-12): Core Algorithms

| Week | Topic                    | Key Insight                                                            |
| ---- | ------------------------ | ---------------------------------------------------------------------- |
| 9    | Binary Search            | "Think in invariants": what does `left` always represent?              |
| 10   | Recursion & Backtracking | Choose → Explore → Un-choose; prune early to avoid full subtrees       |
| 11   | Sorting Algorithms       | Merge sort: stable, $O(N \log N)$; Quickselect: $O(N)$ average for Kth |
| 12   | Heaps & Greedy           | Top-K Largest → Min-Heap; Greedy fails coin change, works intervals    |

### Phase 4 (Weeks 13-16): Intermediate Techniques

| Week | Topic                  | Key Insight                                                      |
| ---- | ---------------------- | ---------------------------------------------------------------- |
| 13   | Dynamic Programming 1D | Four steps: define state, recurrence, base case, iteration order |
| 14   | Dynamic Programming 2D | Grid DP: `dp[i][j]` depends on `dp[i-1][j]` and `dp[i][j-1]`     |
| 15   | Union-Find             | Path compression + rank → $O(\alpha(N)) \approx O(1)$ amortized  |
| 16   | Tries                  | $O(L)$ search independent of dictionary size N                   |

### Phase 5 (Weeks 17-20): Advanced Techniques

| Week | Topic                             | Key Insight                                                                  |
| ---- | --------------------------------- | ---------------------------------------------------------------------------- |
| 17   | Shortest Paths & MST              | Dijkstra = BFS + min-heap; Prim = Dijkstra but edge weight (not accumulated) |
| 18   | Advanced Graph / Bit Manipulation | Bitmask DP: $O(2^N \times N)$ for subset enumeration                         |
| 19   | Segment Trees, Advanced Patterns  | Range query + update in $O(\log N)$; lazy propagation for batch updates      |
| 20   | **Synthesis**                     | **You are here**                                                             |

---

## 5. The "Why This Algorithm?" Explanation Framework

For senior engineer interviews, it is not enough to code the right solution. You must explain your reasoning. Use this structure:

**Template:**
```
"I'm going to use [ALGORITHM] because:
  1. The problem has [SIGNAL/KEYWORD] which maps to this pattern.
  2. The naive approach is [BRUTE FORCE] with [BAD COMPLEXITY].
  3. [ALGORITHM] reduces this to [GOOD COMPLEXITY] by [KEY INSIGHT].
  4. This works here because [PRECONDITION] holds, specifically [VERIFY PRECONDITION].
     (If it didn't hold, I would use [ALTERNATIVE] instead.)"
```

**Example — Dijkstra choice:**
```
"I'm going to use Dijkstra's Algorithm because:
  1. The problem asks for minimum cost path in a weighted graph.
  2. The naive approach is DFS/BFS trying all paths: O(V! / (V-L)!) which is exponential.
  3. Dijkstra reduces this to O((V+E) log V) by greedily always expanding
     the currently cheapest known node — the min-heap ensures this.
  4. This works here because all edge weights are non-negative (verified in constraints).
     If weights could be negative, I would use Bellman-Ford at O(V*E) instead."
```

**Example — DP vs Greedy choice:**
```
"Initially I considered a Greedy approach, but let me verify the Greedy Choice Property.
  [Try a counter-example: coins [1,3,4], target=6 → Greedy gives 4+1+1=3 coins,
   but optimal is 3+3=2 coins → Greedy FAILS.]
  Since greedy fails, I'll use Dynamic Programming.
  dp[i] = minimum coins to make amount i.
  This has optimal substructure: dp[i] = min(dp[i-coin]+1) for all coins ≤ i."
```

---

## 6. Common Interview Anti-Patterns to Avoid

These are behaviors that signal to the interviewer that you are not yet at the senior engineer level:

**Anti-pattern 1: Jumping straight to code**
```
Wrong: [reads problem] → starts typing immediately
Right: [reads problem] → asks 2-3 clarifying questions → states brute force
       → identifies pattern → explains approach → then codes
```

**Anti-pattern 2: Silently debugging**
```
Wrong: [code doesn't work] → stares at screen quietly for 3 minutes
Right: "Let me trace through my example: at index 3, curr=5, prev=3,
        the condition checks... ah, I see the issue — I'm using > instead of >=
        because we need to include equal elements in this case."
```

**Anti-pattern 3: Forgetting complexity analysis**
```
After finishing: state both time AND space complexity
"Time: O(N log K) — we process N elements, each heap operation is O(log K).
 Space: O(K) — the heap stores at most K elements at any time."
```

**Anti-pattern 4: Not handling edge cases**
```
Always test these before submitting:
  - Empty input (empty array, null, 0)
  - Single element
  - All elements the same
  - Negative numbers (if applicable)
  - The answer is the first or last element
  - The result is 0 or -1 (impossible case)
```

**Anti-pattern 5: Using the wrong Java collection**
```
- Avoid Stack<T> — it's synchronized and extends Vector (legacy)
  Use: Deque<T> stack = new ArrayDeque<>()

- Avoid LinkedList as Queue — poor cache performance
  Use: Queue<T> q = new ArrayDeque<>()

- Avoid (a,b) -> b - a comparator — integer overflow risk
  Use: (a,b) -> Integer.compare(b, a)

- Avoid HashMap when int[] array works (bounded integer keys)
  int[] freq = new int[26] is 10x faster than HashMap<Character,Integer>
```

---

## 7. The 7-Day "Blind Mix" Practice Plan

This week, the problems are intentionally randomized — just like a real interview. Do not look up the category before attempting. Spend exactly 5 minutes planning your approach (writing comments only) before writing a single line of Java. Limit yourself to 40 minutes per problem.

**For every problem, complete this ritual before coding:**
```java
// 1. What is the input/output?
// 2. What are the key constraints? (N size tells you expected complexity)
// 3. What keyword/trigger do I see?
// 4. Brute force: [approach] — O([complexity])
// 5. Optimized: [pattern] — O([complexity])
// 6. Edge cases to handle:
```

---

**Day 1: The Warm-up Mix**
1. [Product of Array Except Self (LC 238)](https://leetcode.com/problems/product-of-array-except-self/) — *Hint: prefix × suffix, no division*
2. [Lowest Common Ancestor of a Binary Tree (LC 236)](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) — *Hint: post-order DFS, bubble up*
3. [Clone Graph (LC 133)](https://leetcode.com/problems/clone-graph/) — *Hint: BFS + HashMap(original → clone)*

**Day 2: String & Array Synthesis**
4. [Longest Palindromic Substring (LC 5)](https://leetcode.com/problems/longest-palindromic-substring/) — *Hint: expand from center (O(N²)) or Manacher's (O(N))*
5. [Minimum Window Substring (LC 76)](https://leetcode.com/problems/minimum-window-substring/) — *Hint: sliding window + frequency map*
6. [Trapping Rain Water (LC 42)](https://leetcode.com/problems/trapping-rain-water/) — *Hint: prefix max + suffix max, or two pointers*

**Day 3: The Graph & Tree Gauntlet**
7. [Serialize and Deserialize Binary Tree (LC 297)](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) — *Hint: pre-order DFS with null markers*
8. [Course Schedule II (LC 210)](https://leetcode.com/problems/course-schedule-ii/) — *Hint: Kahn's Algorithm, return order array*
9. [Word Ladder (LC 127)](https://leetcode.com/problems/word-ladder/) — *Hint: BFS, each word is a node, 1-char difference = edge*

**Day 4: Time, Scheduling & Optimization**
10. [Merge Intervals (LC 56)](https://leetcode.com/problems/merge-intervals/) — *Hint: sort by start, merge when overlap*
11. [Task Scheduler (LC 621)](https://leetcode.com/problems/task-scheduler/) — *Hint: max frequency → idle slots formula*
12. [Find Median from Data Stream (LC 295)](https://leetcode.com/problems/find-median-from-data-stream/) — *Hint: two heaps (max + min)*

**Day 5: Search & Logic**
13. [Search in Rotated Sorted Array (LC 33)](https://leetcode.com/problems/search-in-rotated-sorted-array/) — *Hint: binary search, determine which half is sorted*
14. [Search a 2D Matrix II (LC 240)](https://leetcode.com/problems/search-a-2d-matrix-ii/) — *Hint: start top-right corner, eliminate row or column*
15. [LRU Cache (LC 146)](https://leetcode.com/problems/lru-cache/) ⭐ — *Hint: HashMap + Doubly Linked List*

**Day 6: Dynamic Programming & Combinatorics**
16. [Word Break (LC 139)](https://leetcode.com/problems/word-break/) — *Hint: dp[i] = can we form s[0..i-1]*
17. [Coin Change (LC 322)](https://leetcode.com/problems/coin-change/) — *Hint: unbounded knapsack, dp[i] = min coins for amount i*
18. [Combination Sum (LC 39)](https://leetcode.com/problems/combination-sum/) — *Hint: backtracking, pass i (not i+1) to allow reuse*

**Day 7: The Final Bosses**
19. [Edit Distance (LC 72)](https://leetcode.com/problems/edit-distance/) ⭐ — *Hint: 2D DP, dp[i][j] = min edits for s1[0..i] and s2[0..j]*
20. [Largest Rectangle in Histogram (LC 84)](https://leetcode.com/problems/largest-rectangle-in-histogram/) ⭐ — *Hint: monotonic stack, calculate width when popping*
21. [Merge K Sorted Lists (LC 23)](https://leetcode.com/problems/merge-k-sorted-lists/) ⭐ — *Hint: K-way merge with Min-Heap*

---

## 8. Java-Specific Interview Best Practices

### 8.1 Preferred Java Idioms

```java
// ── COLLECTIONS ───────────────────────────────────────────────────────────
// Stack
Deque<Integer> stack = new ArrayDeque<>();
stack.push(x);  stack.pop();  stack.peek();

// Queue
Queue<Integer> queue = new ArrayDeque<>();
queue.offer(x); queue.poll(); queue.peek();

// Min-Heap
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// Max-Heap (NEVER use subtraction — overflow risk!)
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a,b) -> Integer.compare(b,a)); // safe

// Sorted map (floor/ceiling queries)
TreeMap<Integer, Integer> sortedMap = new TreeMap<>();
sortedMap.floorKey(x);    // largest key <= x
sortedMap.ceilingKey(x);  // smallest key >= x

// ── FREQUENCY COUNTING ────────────────────────────────────────────────────
// For bounded input (a-z, 0-9): use array, NOT HashMap
int[] freq = new int[26];
freq[c - 'a']++;

// For general keys: use merge()
Map<Integer, Integer> freq = new HashMap<>();
freq.merge(key, 1, Integer::sum); // cleaner than getOrDefault

// ── STRING MANIPULATION ───────────────────────────────────────────────────
char[] chars = s.toCharArray(); // for in-place modification
StringBuilder sb = new StringBuilder();
sb.append(c);
sb.deleteCharAt(sb.length() - 1); // O(1) delete from end
String result = sb.toString();

// ── ARRAY UTILITIES ───────────────────────────────────────────────────────
Arrays.sort(arr);
Arrays.fill(arr, -1);
Arrays.copyOf(arr, newLength);
int idx = Arrays.binarySearch(sortedArr, target); // -1 if not found

// ── SORTING WITH COMPARATOR ───────────────────────────────────────────────
// Sort 2D array by first column, then second column
Arrays.sort(intervals, (a, b) -> {
    if (a[0] != b[0]) return Integer.compare(a[0], b[0]);
    return Integer.compare(a[1], b[1]);
});

// ── GRAPH SETUP ───────────────────────────────────────────────────────────
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
// Weighted:
List<List<int[]>> adj = new ArrayList<>();
adj.get(u).add(new int[]{v, weight});
```

### 8.2 Java Memory Model Quick Reference

```
Stack Memory (thread-local, fast):
  - Primitive local variables (int, boolean, char)
  - Object references (the pointer, not the object itself)
  - Method call frames (recursive calls consume stack space)
  - Default size: ~512KB-1MB per thread
  - Overflow: StackOverflowError (deep recursion → use iterative)

Heap Memory (shared, GC-managed):
  - All object instances (new TrieNode(), new ArrayList<>(), etc.)
  - All arrays (int[] arr = new int[n])
  - GC pauses can affect latency-sensitive applications
```

---

## 9. Mock Interview Module: The API Gateway Rate Limiter

### 9.1 Context

You are designing the API Gateway for a high-traffic backend service. To prevent abuse and protect your database, you need to implement a Rate Limiting interceptor. The interviewer first asks for a technical comparison of rate limiting algorithms.

---

### 9.2 Step 1: Technical Analysis of Rate Limiting Algorithms

Present all three approaches before being asked to code, showing breadth of knowledge:

**1. Fixed Window Counter**

```
Mechanism: HashMap<Long_minute, Integer_count>
  Increment counter for current window. Reject if over limit.

Pros: O(1) time, O(1) space per user
Cons: "Boundary Spike" vulnerability

Example of the attack:
  Limit: 100 req/minute
  User sends 100 req at 12:00:59  <- all within window [12:00]
  User sends 100 req at 12:01:01  <- all within window [12:01]
  Result: 200 requests in 2 seconds, completely bypassing rate limit intent.
```

**2. Sliding Window Log**

```
Mechanism: Deque<Long> of exact timestamps per user
  Evict timestamps older than (now - windowSize).
  Reject if Deque.size() >= maxRequests.

Pros: 100% accurate, no boundary spike
Cons: Memory intensive — must store every timestamp
  1,000 req/hour limit = up to 1,000 timestamp objects per active user
  At 1 million active users = 1 billion objects in memory
```

**3. Token Bucket** *(Industry Standard)*

```
Mechanism: Two values per user: (tokenCount, lastRefillTimestamp)
  On each request:
    tokensToAdd = (now - lastRefill) * refillRate
    tokenCount = min(maxTokens, tokenCount + tokensToAdd)
    lastRefill = now
    if tokenCount >= 1: tokenCount--; allow
    else: reject

Pros: Allows short bursts (bucket size = burst capacity),
      limits sustained rate (refill rate = sustained rate),
      O(1) space (just 2 numbers), O(1) time
Cons: Slightly complex logic, two values must be atomic (use Redis Lua script)

Real usage: AWS API Gateway, Stripe, GitHub API all use Token Bucket.
```

**When to recommend which:**
```
Absolute precision required, memory not a concern → Sliding Window Log
Burst traffic acceptable, memory efficient → Token Bucket
Simplest possible implementation, some inaccuracy ok → Fixed Window
```

---

### 9.3 Step 2: The Coding Challenge

**Implement:** `SlidingWindowRateLimiter` with `boolean allowRequest(int timestamp)`.
- `maxRequests`: maximum allowed in the window.
- `windowSizeInSeconds`: duration of the sliding window.
- Timestamps are non-decreasing integers.

**Thinking process:**
1. "I need FIFO access — add newest, remove oldest." → Deque.
2. "Evict: while `deque.front <= currentTime - windowSize`, poll."
3. "Allow: if `deque.size() < maxRequests`, offer and return true."
4. "Time: $O(1)$ amortized — each timestamp is added once, removed once."

```java
// Time: O(1) amortized per request
// Space: O(maxRequests) — deque holds at most maxRequests timestamps

class SlidingWindowRateLimiter {
    private final int maxRequests;
    private final int windowSizeInSeconds;
    private final Deque<Integer> requestLog;

    public SlidingWindowRateLimiter(int maxRequests, int windowSizeInSeconds) {
        this.maxRequests = maxRequests;
        this.windowSizeInSeconds = windowSizeInSeconds;
        this.requestLog = new ArrayDeque<>();
    }

    public boolean allowRequest(int currentTimestamp) {
        // Strict cutoff: timestamps STRICTLY inside the window
        int cutoffTime = currentTimestamp - windowSizeInSeconds;

        // Step 1: Evict stale timestamps outside the sliding window
        while (!requestLog.isEmpty() && requestLog.peekFirst() <= cutoffTime) {
            requestLog.pollFirst();
        }

        // Step 2: Check capacity
        if (requestLog.size() < maxRequests) {
            requestLog.offerLast(currentTimestamp); // log this request
            return true;
        }

        return false; // rate limit exceeded
    }
}
```

**Trace for `maxRequests=3, windowSize=10`:**
```
allowRequest(1):  cutoff=-9, deque=[], size=0<3 -> ADD, deque=[1], return true
allowRequest(5):  cutoff=-5, deque=[1], size=1<3 -> ADD, deque=[1,5], return true
allowRequest(9):  cutoff=-1, deque=[1,5], size=2<3 -> ADD, deque=[1,5,9], return true
allowRequest(10): cutoff=0, deque=[1,5,9], size=3 >= 3 -> REJECT, return false
allowRequest(12): cutoff=2, evict 1 (1<=2), deque=[5,9], size=2<3 -> ADD, deque=[5,9,12], true
allowRequest(15): cutoff=5, evict 5 (5<=5), deque=[9,12], size=2<3 -> ADD, deque=[9,12,15], true
```

---

### 9.4 Step 3: Token Bucket Implementation

If the interviewer asks for a memory-efficient alternative:

```java
// Time: O(1) per request
// Space: O(1) per user (just two values stored externally, e.g., in Redis)

class TokenBucketRateLimiter {
    private final int maxTokens;
    private final double refillRatePerSecond;
    private double currentTokens;
    private long lastRefillTimestamp;

    public TokenBucketRateLimiter(int maxTokens, double refillRatePerSecond) {
        this.maxTokens = maxTokens;
        this.refillRatePerSecond = refillRatePerSecond;
        this.currentTokens = maxTokens; // start full
        this.lastRefillTimestamp = System.currentTimeMillis();
    }

    public synchronized boolean allowRequest() {
        refill();
        if (currentTokens >= 1.0) {
            currentTokens -= 1.0;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.currentTimeMillis();
        double secondsElapsed = (now - lastRefillTimestamp) / 1000.0;
        double tokensToAdd = secondsElapsed * refillRatePerSecond;
        currentTokens = Math.min(maxTokens, currentTokens + tokensToAdd);
        lastRefillTimestamp = now;
    }
}
```

---

### 9.5 Step 4: Distributed Rate Limiting (Redis)

When the interviewer asks: *"This runs on 10 nodes behind a load balancer. Your local Deque won't work. How do you fix it?"*

**Expected full answer:**

"The local `ArrayDeque` only tracks requests hitting one specific node. With N nodes, each tracking separately, a user could make `maxRequests` calls to every node — effectively multiplying their rate limit by N.

**Solution: Centralized state in Redis using Sorted Sets (ZSET):**

```
Redis ZSET key:   "rate_limit:{userId}"
Score:            timestamp (Unix epoch in milliseconds)
Member:           unique UUID per request

Operations per incoming request:
1. ZREMRANGEBYSCORE key 0 (now - windowMs)   <- evict old entries
2. ZCARD key                                  <- count current window
3. If ZCARD < maxRequests:
     ZADD key nowMs uuid:nowMs              <- add this request
     EXPIRE key windowSeconds               <- auto-cleanup
     return ALLOWED
4. Else: return RATE_LIMITED

Wrap steps 1-4 in a Lua script for atomic execution (no race conditions):
redis.call('ZREMRANGEBYSCORE', key, 0, cutoff)
local count = redis.call('ZCARD', key)
if count < limit then
  redis.call('ZADD', key, now, uuid)
  redis.call('EXPIRE', key, window)
  return 1
end
return 0
```

**Latency considerations:**
- Redis ZSET operations: $O(\log N)$ where N = requests in window
- Round-trip to Redis: ~0.5ms local, ~5ms cross-region
- For ultra-low-latency: use Redis Cluster with consistent hashing on userId → always hit the same Redis node → no cross-shard coordination needed

**Sliding Window approximation (for even lower overhead):**
Combine Fixed Window + Sliding Window Log:
```
rate = (prevWindowCount * overlap%) + currentWindowCount
```
This uses only 2 counters per user (no ZSET), approximates sliding window within ~0.1% accuracy, used by Cloudflare and Nginx rate limiting modules."

---

### 9.6 Step 5: Further Follow-up Questions

**Q1:** "How do you handle 'burst allowance' — allowing up to 2x the rate limit for short bursts?"

*Expected answer:*
"Switch from Sliding Window Log to Token Bucket. Set `maxTokens = 2 * maxRequests` (burst capacity) and `refillRatePerSecond = maxRequests / windowSizeSeconds` (sustained rate). The bucket fills at the sustained rate but can absorb a burst up to 2x the sustained rate before throttling."

**Q2:** "Different API endpoints need different rate limits (e.g., /search: 100/min, /checkout: 10/min). How do you structure this?"

*Expected answer:*
"Composite key: `rate_limit:{userId}:{endpointId}`. Each endpoint maintains an independent ZSET. Configuration stored in a central config service (Consul, Zookeeper) and propagated to the API gateway. The rate limiter reads the limit for each endpoint at startup (or caches it with a short TTL)."

**Q3:** "How would you test the rate limiter to ensure correctness, especially the boundary conditions?"

*Expected answer:*
"Three categories of tests:
1. **Unit tests:** Mock the timestamp. Test: exactly at limit (N requests → allowed), one over limit (N+1 → rejected), window boundary (request at exactly `windowSize` seconds ago should be evicted).
2. **Concurrency tests:** Use `CountDownLatch` + `ExecutorService` to fire N+K requests simultaneously. Verify exactly N are accepted.
3. **Integration tests with Redis:** Use an embedded Redis (Testcontainers) to verify the Lua script atomicity — simulate race conditions with multiple threads hitting the same user key."

---

## 10. Final Assessment: Know These Cold

These are the problems and concepts that appear most frequently across top-tier backend engineering interviews. If you can solve each in under 30 minutes with clean code and clear explanation, you are ready.

### Must-Know Problems (Tier 1 — Solve in < 20 minutes)

| Problem                                  | Core Pattern   | Key Insight                       |
| ---------------------------------------- | -------------- | --------------------------------- |
| Two Sum (LC 1)                           | HashMap        | `target - num` lookup             |
| Valid Parentheses (LC 20)                | Stack          | Push open, match on close         |
| Merge Two Sorted Lists (LC 21)           | Linked List    | Dummy Head                        |
| Best Time to Buy and Sell Stock (LC 121) | Greedy         | Track min price seen so far       |
| Climbing Stairs (LC 70)                  | DP (Fibonacci) | Space-optimize to two variables   |
| Maximum Depth of Binary Tree (LC 104)    | DFS Post-order | Return max(left, right) + 1       |
| Binary Search (LC 704)                   | Binary Search  | `mid = left + (right - left) / 2` |
| Flood Fill (LC 733)                      | BFS/DFS        | Grid traversal with visited       |
| Reverse Linked List (LC 206)             | Linked List    | Three-pointer reversal            |
| Contains Duplicate (LC 217)              | HashSet        | O(1) lookup                       |

### Must-Know Problems (Tier 2 — Solve in < 35 minutes)

| Problem                                 | Core Pattern        | Key Insight                      |
| --------------------------------------- | ------------------- | -------------------------------- |
| LRU Cache (LC 146)                      | HashMap + DLL       | `LinkedHashMap` shortcut         |
| Number of Islands (LC 200)              | BFS/DFS             | Grid component counting          |
| Product of Array Except Self (LC 238)   | Prefix × Suffix     | No division, two passes          |
| Find Median from Data Stream (LC 295)   | Two Heaps           | Max-heap lower, min-heap upper   |
| Word Search (LC 79)                     | Backtracking + Grid | `visited[][]` as choose/unchoose |
| Course Schedule (LC 207)                | Topological Sort    | Kahn's count check               |
| Kth Largest Element (LC 215)            | Min-Heap size K     | Min at top = Kth largest         |
| Longest Increasing Subsequence (LC 300) | DP (LIS)            | `dp[i] = max(dp[j]+1)`           |
| Coin Change (LC 322)                    | Unbounded Knapsack  | `dp[i] = min(dp[i-coin]+1)`      |
| House Robber (LC 198)                   | Take-or-skip DP     | Space-optimize to two vars       |

### Must-Know Concepts (State in One Sentence)

```
1.  HashSet: O(1) lookup; use for "seen before" problems
2.  Stack: LIFO; matches opening brackets, monotonic structure maintenance
3.  Queue: FIFO; BFS level-by-level traversal
4.  Heap: O(log N) insert/remove, O(1) peek; use for "always need min/max"
5.  Prefix Sum: O(1) range sum after O(N) precompute; range queries
6.  Sliding Window: O(N) for "longest/shortest subarray/string" problems
7.  BFS: shortest path in unweighted graph; level-order tree traversal
8.  DFS: all paths, cycle detection, connected components
9.  Binary Search: O(log N) for sorted arrays; also on answer space
10. Two Pointers: O(N) for sorted array pair problems (merging, partitioning)
11. Backtracking: exhaustive search with pruning; subsets, permutations
12. Topological Sort: task ordering; Kahn's (BFS) or DFS post-order
13. Union-Find: dynamic connectivity; O(α) ≈ O(1) per union/find
14. Dijkstra: O((V+E)logV) shortest path with non-negative weights
15. DP (1D): define dp[i], write recurrence, base case, iterate
16. DP (2D): grid problems; dp[i][j] depends on dp[i-1][j], dp[i][j-1]
17. Trie: O(L) prefix operations independent of dictionary size
18. Monotonic Stack: O(N) "next greater element" style problems
19. Greedy: validate with exchange argument; fails when local optimum != global
20. MST (Prim's): edge weight in heap, not accumulated; connect ALL nodes
```

---

*You have completed the 20-week roadmap. You are now equipped not only to solve complex algorithms but to explain them, optimize them, and map them to real-world software architecture. You can speak fluently about why a LinkedHashMap is an LRU cache, why Kafka is an append-only array, why Spring uses topological sort, and why Dijkstra powers Google Maps. That dual fluency — algorithmic depth AND systems breadth — is what separates a strong hire from an exceptional one.*

*Best of luck on your interviews. The work you put in over these 20 weeks compounds.*