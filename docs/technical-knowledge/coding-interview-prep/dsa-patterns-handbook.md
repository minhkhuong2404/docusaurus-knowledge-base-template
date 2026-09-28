---
id: dsa-patterns-handbook
title: DSA Patterns Handbook (Quick Reference)
sidebar_label: 📘 Quick Handbook (20+ Patterns)
description: Complete Quick 2 Knowledge handbook covering the 16 core DSA patterns and 20+ essential LeetCode coding interview templates in Java.
tags:
  - leetcode
  - dsa
  - coding-interview
  - algorithms
  - java
---

# 📘 Quick 2 Knowledge: Handbook for All Patterns of DSA

> **"Master these 16 core patterns and 20+ canonical LeetCode templates before walking into any technical coding interview."**

This handbook organizes the complete pattern taxonomy from foundational arrays to advanced trees, heaps, and graphs. Each pattern card provides the **core intuition**, **clean Java implementation**, **time & space complexity**, and the underlying **"Why?"** explanation.

---

## 🗺️ Part 1: The 16 Core DSA Patterns Taxonomy

```mermaid
flowchart TD
    DSA([DSA Interview Patterns])

    DSA --> A[1. Arrays]
    DSA --> S[2. Strings]
    DSA --> H[3. Hashing]
    DSA --> LL[4. Linked List]

    DSA --> ST[5. Stack]
    DSA --> Q[6. Queue]
    DSA --> T[7. Trees]
    DSA --> BS[8. Binary Search]

    DSA --> REC[9. Recursion]
    DSA --> BT[10. Backtracking]
    DSA --> HP[11. Heap / Priority Queue]
    DSA --> G[12. Graph]

    DSA --> DP[13. Dynamic Programming]
    DSA --> GR[14. Greedy]
    DSA --> BM[15. Bit Manipulation]
    DSA --> ADV[16. Advanced Topics]

    classDef primary fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef branch fill:#0f172a,stroke:#34d399,stroke-width:1.5px,color:#f8fafc;
    class DSA primary;
    class A,S,H,LL,ST,Q,T,BS,REC,BT,HP,G,DP,GR,BM,ADV branch;
```

### Complete Pattern Breakdown

| # | Pattern Category | Key Sub-Techniques & Classical Problems | Deep-Dive Guide |
|---|---|---|---|
| **1** | **Arrays** | Two Pointers, Sliding Window, Kadane's Algo, Binary Search, Prefix/Suffix Sum, Dutch National Flag, Merge Intervals | [Array Guide](./array/array) |
| **2** | **Strings** | Pattern Searching (KMP), Anagrams, Sliding Window, Palindrome Verification, Hashing, StringBuilder, Longest Substring | [Sliding Window](./sliding-window/sliding-window) |
| **3** | **Hashing** | Frequency Count, HashMap / HashSet, Two Sum, Group Anagrams, Subarray Sum = K, Distinct Elements | [Array & Hash](./array/array) |
| **4** | **Linked List** | In-place Reversal, Cycle Detection (Floyd's Tortoise & Hare), Find Middle, Merge Two Sorted Lists, Remove Nth Node, LRU Cache | [Linked List Guide](./linked-list/linked-list) |
| **5** | **Stack** | Stack Implementation, Infix to Postfix, Postfix Evaluation, Next Greater Element, Valid Parentheses, Min Stack, Stock Span | [Stack Guide](./stack/stack) & [Monotonic Stack](./monotonic-stack/monotonic-stack) |
| **6** | **Queue** | Circular Queue, Deque (Double Ended), Sliding Window Maximum, First Non-Repeating Character, BFS Queue | [BFS Guide](./bfs/bfs) |
| **7** | **Trees** | Traversals (In/Pre/Post-order), Level-Order Traversal (BFS), Tree Height/Depth, Diameter, Invert Tree, LCA, BST Validation | [Tree Guide](./tree/tree) |
| **8** | **Binary Search** | Iterative & Recursive, Lower / Upper Bound, Search in Rotated Sorted Array, Find Peak Element, Kth Smallest in Matrix | [Binary Search Guide](./binary-search/binary-search) |
| **9** | **Recursion** | Factorial, Fibonacci, Tower of Hanoi, Reverse String, Subset / Subsequence Generation, Permutations | [Backtracking Guide](./backtracking/backtracking) |
| **10** | **Backtracking** | N-Queens Problem, Sudoku Solver, Permutations, Combinations, Subset Sum, Graph Coloring, Word Search | [Backtracking Guide](./backtracking/backtracking) |
| **11** | **Heap / Priority Queue** | Min / Max Heap, Heapify, Kth Largest / Smallest, Merge K Sorted Lists, Top K Frequent Elements, Heap Sort | [Heap Guide](./heap/heap) |
| **12** | **Graph** | BFS & DFS Traversals, Cycle Detection, Topological Sort (Kahn's), Shortest Path (BFS / Dijkstra), Disjoint Set (Union-Find) | [Graph Guide](./graph/graph) & [Union-Find](./union-find/union-find) |
| **13** | **Dynamic Programming** | 0/1 Knapsack, Unbounded Knapsack, LCS, LIS, Edit Distance, Matrix Chain Multiplication, Coin Change | [DP Guide](./dynamic-programming/dynamic-programming) |
| **14** | **Greedy** | Activity Selection, Fractional Knapsack, Huffman Coding, Job Sequencing, Minimum Spanning Tree (Prim/Kruskal) | [Greedy Guide](./greedy/greedy) |
| **15** | **Bit Manipulation** | Get / Set / Clear Bit, Check Power of 2, Count Set Bits, XOR Duplicate Elimination, Swap Without Temp | [Bit Manipulation Guide](./bit-manipulation/bit-manipulation) |
| **16** | **Advanced Topics** | Trie (Prefix Tree), Segment Tree, Fenwick Tree (BIT), Rolling Hash (Rabin-Karp), String Hashing, Matrix Exponentiation | [Trie Guide](./trie/trie) |

---

## 📋 Part 2: Master 80+ Core DSA Questions Checklist

This master index maps all **80+ classical interview questions & sub-patterns** from the 16 handbook categories directly to their LeetCode problem numbers, difficulty levels, core patterns, and workspace guides.

### 1. Arrays (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 1.1 | 2 Pointers | [Two Sum II - Input Array Is Sorted (#167)](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | 🟢 Easy | Converging left/right pointers | [Two Pointers](./two-pointers/two-pointers) |
| 1.2 | Sliding Window | [Maximum Average Subarray I (#643)](https://leetcode.com/problems/maximum-average-subarray-i/) | 🟢 Easy | Fixed-size window sum | [Sliding Window](./sliding-window/sliding-window) |
| 1.3 | Kadane's Algo | [Maximum Subarray (#53)](https://leetcode.com/problems/maximum-subarray/) | 🟡 Medium | Running subarray sum | [Array](./array/array) |
| 1.4 | Binary Search | [Search in Rotated Sorted Array (#33)](https://leetcode.com/problems/search-in-rotated-sorted-array/) | 🟡 Medium | Partitioned binary search | [Binary Search](./binary-search/binary-search) |
| 1.5 | Prefix / Suffix Sum | [Product of Array Except Self (#238)](https://leetcode.com/problems/product-of-array-except-self/) | 🟡 Medium | Left/right prefix products | [Prefix Sum](./prefix-sum/prefix-sum) |
| 1.6 | Dutch National Flag | [Sort Colors (#75)](https://leetcode.com/problems/sort-colors/) | 🟡 Medium | 3-way in-place partitioning | [Two Pointers](./two-pointers/two-pointers) |
| 1.7 | Merge Intervals | [Merge Intervals (#56)](https://leetcode.com/problems/merge-intervals/) | 🟡 Medium | Start-time interval sorting | [Intervals](./intervals/intervals) |

### 2. Strings (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 2.1 | Pattern Searching (KMP) | [Find the Index of the First Occurrence (#28)](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/) | 🟡 Medium | LPS prefix function | [String Guide](./sliding-window/sliding-window) |
| 2.2 | Anagram | [Valid Anagram (#242)](https://leetcode.com/problems/valid-anagram/) | 🟢 Easy | Frequency array comparison | [Array](./array/array) |
| 2.3 | Sliding Window | [Longest Substring Without Repeating Chars (#3)](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | 🟡 Medium | Dynamic window with index map | [Sliding Window](./sliding-window/sliding-window) |
| 2.4 | Palindrome | [Valid Palindrome (#125)](https://leetcode.com/problems/valid-palindrome/) | 🟢 Easy | Two pointers converging | [Two Pointers](./two-pointers/two-pointers) |
| 2.5 | Hashing | [Group Anagrams (#49)](https://leetcode.com/problems/group-anagrams/) | 🟡 Medium | Sorted string hash key | [Array](./array/array) |
| 2.6 | String Builder | [Reverse Words in a String (#151)](https://leetcode.com/problems/reverse-words-in-a-string/) | 🟡 Medium | In-place words reversal | [Two Pointers](./two-pointers/two-pointers) |
| 2.7 | Longest Substring | [Minimum Window Substring (#76)](https://leetcode.com/problems/minimum-window-substring/) | 🔴 Hard | Shrinkable sliding window | [Sliding Window](./sliding-window/sliding-window) |

### 3. Hashing (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 3.1 | Frequency Count | [First Unique Character in a String (#387)](https://leetcode.com/problems/first-unique-character-in-a-string/) | 🟢 Easy | Hash/Array frequency count | [Array](./array/array) |
| 3.2 | HashMap / Set | [Contains Duplicate (#217)](https://leetcode.com/problems/contains-duplicate/) | 🟢 Easy | Set membership lookup | [Array](./array/array) |
| 3.3 | Two Sum | [Two Sum (#1)](https://leetcode.com/problems/two-sum/) | 🟢 Easy | Complement hash lookup | [Array](./array/array) |
| 3.4 | Group Anagrams | [Group Anagrams (#49)](https://leetcode.com/problems/group-anagrams/) | 🟡 Medium | Map with canonical key | [Array](./array/array) |
| 3.5 | Subarray Sum = K | [Subarray Sum Equals K (#560)](https://leetcode.com/problems/subarray-sum-equals-k/) | 🟡 Medium | Prefix sum + HashMap | [Prefix Sum](./prefix-sum/prefix-sum) |
| 3.6 | Distinct Elements | [Longest Consecutive Sequence (#128)](https://leetcode.com/problems/longest-consecutive-sequence/) | 🟡 Medium | HashSet sequence traversal | [Array](./array/array) |
| 3.7 | Count Occurrences | [Top K Frequent Elements (#347)](https://leetcode.com/problems/top-k-frequent-elements/) | 🟡 Medium | Bucket sort / Min-Heap | [Heap](./heap/heap) |

### 4. Linked List (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 4.1 | Reversal | [Reverse Linked List (#206)](https://leetcode.com/problems/reverse-linked-list/) | 🟢 Easy | 3-pointer iterative swap | [Linked List](./linked-list/linked-list) |
| 4.2 | Detect Cycle (Floyd) | [Linked List Cycle (#141)](https://leetcode.com/problems/linked-list-cycle/) | 🟢 Easy | Tortoise and Hare | [Linked List](./linked-list/linked-list) |
| 4.3 | Find Middle | [Middle of the Linked List (#876)](https://leetcode.com/problems/middle-of-the-linked-list/) | 🟢 Easy | 1x vs 2x fast/slow pointer | [Linked List](./linked-list/linked-list) |
| 4.4 | Merge Two Sorted LL | [Merge Two Sorted Lists (#21)](https://leetcode.com/problems/merge-two-sorted-lists/) | 🟢 Easy | Dummy head comparison | [Linked List](./linked-list/linked-list) |
| 4.5 | Remove Nth Node | [Remove Nth Node From End of List (#19)](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | 🟡 Medium | Two pointers with n-gap | [Linked List](./linked-list/linked-list) |
| 4.6 | LRU Cache (DLL + Map) | [LRU Cache (#146)](https://leetcode.com/problems/lru-cache/) | 🟡 Medium | DLL sentinels + HashMap | [Linked List](./linked-list/linked-list) |
| 4.7 | Clone Linked List | [Copy List with Random Pointer (#138)](https://leetcode.com/problems/copy-list-with-random-pointer/) | 🟡 Medium | Interleaving / HashMap | [Linked List](./linked-list/linked-list) |

### 5. Stack (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 5.1 | Implementation | [Implement Stack using Queues (#225)](https://leetcode.com/problems/implement-stack-using-queues/) | 🟢 Easy | Push-cost queue rotation | [Stack](./stack/stack) |
| 5.2 | Infix to Postfix | [Basic Calculator II (#227)](https://leetcode.com/problems/basic-calculator-ii/) | 🟡 Medium | Operator precedence stack | [Stack](./stack/stack) |
| 5.3 | Postfix Evaluation | [Evaluate Reverse Polish Notation (#150)](https://leetcode.com/problems/evaluate-reverse-polish-notation/) | 🟡 Medium | Operand stack evaluation | [Stack](./stack/stack) |
| 5.4 | Next Greater Element | [Next Greater Element I (#496)](https://leetcode.com/problems/next-greater-element-i/) | 🟢 Easy | Monotonic decreasing stack | [Monotonic Stack](./monotonic-stack/monotonic-stack) |
| 5.5 | Valid Parentheses | [Valid Parentheses (#20)](https://leetcode.com/problems/valid-parentheses/) | 🟢 Easy | Bracket matching stack | [Stack](./stack/stack) |
| 5.6 | Min Stack | [Min Stack (#155)](https://leetcode.com/problems/min-stack/) | 🟡 Medium | Auxiliary minimum stack | [Stack](./stack/stack) |
| 5.7 | Stock Span Problem | [Online Stock Span (#901)](https://leetcode.com/problems/online-stock-span/) | 🟡 Medium | Monotonic stack with spans | [Monotonic Stack](./monotonic-stack/monotonic-stack) |

### 6. Queue (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 6.1 | Implementation | [Implement Queue using Stacks (#232)](https://leetcode.com/problems/implement-queue-using-stacks/) | 🟢 Easy | In-stack & Out-stack | [Stack](./stack/stack) |
| 6.2 | Circular Queue | [Design Circular Queue (#622)](https://leetcode.com/problems/design-circular-queue/) | 🟡 Medium | Modulo ring buffer | [Stack](./stack/stack) |
| 6.3 | Deque (Double Ended) | [Design Circular Deque (#641)](https://leetcode.com/problems/design-circular-deque/) | 🟡 Medium | Head/tail pointer wrap | [Stack](./stack/stack) |
| 6.4 | Sliding Window Max | [Sliding Window Maximum (#239)](https://leetcode.com/problems/sliding-window-maximum/) | 🔴 Hard | Monotonic deque | [Monotonic Stack](./monotonic-stack/monotonic-stack) |
| 6.5 | First Non-Repeating | [First Unique Char in a Stream (#387)](https://leetcode.com/problems/first-unique-character-in-a-string/) | 🟢 Easy | Queue + frequency map | [Sliding Window](./sliding-window/sliding-window) |
| 6.6 | BFS (Queue based) | [Binary Tree Level Order Traversal (#102)](https://leetcode.com/problems/binary-tree-level-order-traversal/) | 🟡 Medium | FIFO level traversal | [BFS](./bfs/bfs) |
| 6.7 | LRU Cache (Queue) | [LRU Cache (#146)](https://leetcode.com/problems/lru-cache/) | 🟡 Medium | Doubly-ended list removal | [Linked List](./linked-list/linked-list) |

### 7. Trees (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 7.1 | Traversals (In/Pre/Post) | [Binary Tree Inorder Traversal (#94)](https://leetcode.com/problems/binary-tree-inorder-traversal/) | 🟢 Easy | DFS Tree traversal | [Tree](./tree/tree) |
| 7.2 | Level Order Traversal | [Binary Tree Level Order Traversal (#102)](https://leetcode.com/problems/binary-tree-level-order-traversal/) | 🟡 Medium | BFS Queue by level | [BFS](./bfs/bfs) |
| 7.3 | Height / Depth | [Maximum Depth of Binary Tree (#104)](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | 🟢 Easy | Postorder 1 + max(L, R) | [Tree](./tree/tree) |
| 7.4 | Diameter of Tree | [Diameter of Binary Tree (#543)](https://leetcode.com/problems/diameter-of-binary-tree/) | 🟢 Easy | Global max of (L + R) | [Tree](./tree/tree) |
| 7.5 | Invert Binary Tree | [Invert Binary Tree (#226)](https://leetcode.com/problems/invert-binary-tree/) | 🟢 Easy | Recursive child swap | [Tree](./tree/tree) |
| 7.6 | Lowest Common Ancestor | [Lowest Common Ancestor of a Binary Tree (#236)](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | 🟡 Medium | Bottom-up ancestor bubble | [Tree](./tree/tree) |
| 7.7 | Binary Search Tree | [Validate Binary Search Tree (#98)](https://leetcode.com/problems/validate-binary-search-tree/) | 🟡 Medium | Min/max range validation | [Tree](./tree/tree) |

### 8. Binary Search (6 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 8.1 | Binary Search (Iterative) | [Binary Search (#704)](https://leetcode.com/problems/binary-search/) | 🟢 Easy | Low, mid, high pointers | [Binary Search](./binary-search/binary-search) |
| 8.2 | Binary Search (Recursive) | [Search Insert Position (#35)](https://leetcode.com/problems/search-insert-position/) | 🟢 Easy | Range insertion index | [Binary Search](./binary-search/binary-search) |
| 8.3 | Lower / Upper Bound | [Find First and Last Position (#34)](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) | 🟡 Medium | Bound-seeking binary search | [Binary Search](./binary-search/binary-search) |
| 8.4 | Search in Rotated Sorted | [Search in Rotated Sorted Array (#33)](https://leetcode.com/problems/search-in-rotated-sorted-array/) | 🟡 Medium | Half-sorted range check | [Binary Search](./binary-search/binary-search) |
| 8.5 | Find Peak Element | [Find Peak Element (#162)](https://leetcode.com/problems/find-peak-element/) | 🟡 Medium | Slope direction climbing | [Binary Search](./binary-search/binary-search) |
| 8.6 | Kth Smallest in Matrix | [Kth Smallest Element in a Sorted Matrix (#378)](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/) | 🟡 Medium | Binary search on values | [Binary Search](./binary-search/binary-search) |

### 9. Recursion (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 9.1 | Factorial / Power | [Pow(x, n) (#50)](https://leetcode.com/problems/powx-n/) | 🟡 Medium | Divide and conquer exponent | [Backtracking](./backtracking/backtracking) |
| 9.2 | Fibonacci | [Fibonacci Number (#509)](https://leetcode.com/problems/fibonacci-number/) | 🟢 Easy | Base case + subproblem | [Dynamic Programming](./dynamic-programming/dynamic-programming) |
| 9.3 | Tower of Hanoi | [Recursion Classical Tower of Hanoi](https://leetcode.com/problems/) | 🟢 Easy | 3-peg recursive transfer | [Backtracking](./backtracking/backtracking) |
| 9.4 | Reverse a String | [Reverse String (#344)](https://leetcode.com/problems/reverse-string/) | 🟢 Easy | Swap at bounds recursively | [Two Pointers](./two-pointers/two-pointers) |
| 9.5 | Subset / Subsequence | [Subsets (#78)](https://leetcode.com/problems/subsets/) | 🟡 Medium | Include / exclude tree | [Backtracking](./backtracking/backtracking) |
| 9.6 | Permutation | [Permutations (#46)](https://leetcode.com/problems/permutations/) | 🟡 Medium | Unused element choice tree | [Backtracking](./backtracking/backtracking) |
| 9.7 | Backtracking Intro | [Combinations (#77)](https://leetcode.com/problems/combinations/) | 🟡 Medium | Bounded recursion depth | [Backtracking](./backtracking/backtracking) |

### 10. Backtracking (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 10.1 | N-Queens Problem | [N-Queens (#51)](https://leetcode.com/problems/n-queens/) | 🔴 Hard | Column/diagonal attack sets | [Backtracking](./backtracking/backtracking) |
| 10.2 | Sudoku Solver | [Sudoku Solver (#37)](https://leetcode.com/problems/sudoku-solver/) | 🔴 Hard | Row, column, 3x3 block check | [Backtracking](./backtracking/backtracking) |
| 10.3 | Permutations | [Permutations II (#47)](https://leetcode.com/problems/permutations-ii/) | 🟡 Medium | Sort & skip duplicates | [Backtracking](./backtracking/backtracking) |
| 10.4 | Combinations | [Combination Sum (#39)](https://leetcode.com/problems/combination-sum/) | 🟡 Medium | Target reduction with reuse | [Backtracking](./backtracking/backtracking) |
| 10.5 | Subset Sum | [Partition Equal Subset Sum (#416)](https://leetcode.com/problems/partition-equal-subset-sum/) | 🟡 Medium | Target half-sum check | [Dynamic Programming](./dynamic-programming/dynamic-programming) |
| 10.6 | Graph Coloring | [Is Graph Bipartite? (#785)](https://leetcode.com/problems/is-graph-bipartite/) | 🟡 Medium | 2-color DFS/BFS validation | [Graph](./graph/graph) |
| 10.7 | Word Search | [Word Search (#79)](https://leetcode.com/problems/word-search/) | 🟡 Medium | 4-directional grid DFS | [DFS](./dfs/dfs) |

### 11. Heap / Priority Queue (6 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 11.1 | Min / Max Heap | [Kth Largest Element in an Array (#215)](https://leetcode.com/problems/kth-largest-element-in-an-array/) | 🟡 Medium | Size-k Min-Heap | [Heap](./heap/heap) |
| 11.2 | Heapify | [Sort an Array (#912)](https://leetcode.com/problems/sort-an-array/) | 🟡 Medium | In-place sift-down tree | [Heap](./heap/heap) |
| 11.3 | Kth Largest / Smallest | [Kth Largest Element in a Stream (#703)](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | 🟢 Easy | Streaming Min-Heap | [Heap](./heap/heap) |
| 11.4 | Merge K Sorted Lists | [Merge K Sorted Lists (#23)](https://leetcode.com/problems/merge-k-sorted-lists/) | 🔴 Hard | PriorityQueue of list heads | [Heap](./heap/heap) |
| 11.5 | Top K Frequent Elements | [Top K Frequent Elements (#347)](https://leetcode.com/problems/top-k-frequent-elements/) | 🟡 Medium | Frequency min-heap of size k | [Heap](./heap/heap) |
| 11.6 | Heap Sort | [Sort an Array (#912)](https://leetcode.com/problems/sort-an-array/) | 🟡 Medium | Build max-heap + swap top | [Sorting](./sorting/sorting) |

### 12. Graph (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 12.1 | BFS Traversal | [Word Ladder (#127)](https://leetcode.com/problems/word-ladder/) | 🔴 Hard | Shortest transformation steps | [BFS](./bfs/bfs) |
| 12.2 | DFS Traversal | [Number of Islands (#200)](https://leetcode.com/problems/number-of-islands/) | 🟡 Medium | Connected component flood-fill | [DFS](./dfs/dfs) |
| 12.3 | Detect Cycle | [Course Schedule (#207)](https://leetcode.com/problems/course-schedule/) | 🟡 Medium | 3-state DFS cycle detection | [Graph](./graph/graph) |
| 12.4 | Topological Sort | [Course Schedule II (#210)](https://leetcode.com/problems/course-schedule-ii/) | 🟡 Medium | Kahn's in-degree BFS | [Graph](./graph/graph) |
| 12.5 | Shortest Path (BFS) | [Shortest Path in Binary Matrix (#1091)](https://leetcode.com/problems/shortest-path-in-binary-matrix/) | 🟡 Medium | 8-direction BFS queue | [BFS](./bfs/bfs) |
| 12.6 | Dijkstra's Algorithm | [Network Delay Time (#743)](https://leetcode.com/problems/network-delay-time/) | 🟡 Medium | Min-Heap edge relaxation | [Graph](./graph/graph) |
| 12.7 | Disjoint Set (Union-Find) | [Number of Provinces (#547)](https://leetcode.com/problems/number-of-provinces/) | 🟡 Medium | Path compression & rank | [Union-Find](./union-find/union-find) |

### 13. Dynamic Programming (7 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 13.1 | 0/1 Knapsack | [Partition Equal Subset Sum (#416)](https://leetcode.com/problems/partition-equal-subset-sum/) | 🟡 Medium | 1D reverse boolean array | [DP](./dynamic-programming/dynamic-programming) |
| 13.2 | Unbounded Knapsack | [Coin Change (#322)](https://leetcode.com/problems/coin-change/) | 🟡 Medium | Min coins forward loop | [DP](./dynamic-programming/dynamic-programming) |
| 13.3 | Longest Common Subseq | [Longest Common Subsequence (#1143)](https://leetcode.com/problems/longest-common-subsequence/) | 🟡 Medium | 2D DP matching grid | [DP](./dynamic-programming/dynamic-programming) |
| 13.4 | Longest Increasing Subseq | [Longest Increasing Subsequence (#300)](https://leetcode.com/problems/longest-increasing-subsequence/) | 🟡 Medium | O(n log n) Patience sorting | [DP](./dynamic-programming/dynamic-programming) |
| 13.5 | Edit Distance | [Edit Distance (#72)](https://leetcode.com/problems/edit-distance/) | 🔴 Hard | Insert/Delete/Replace grid | [DP](./dynamic-programming/dynamic-programming) |
| 13.6 | Matrix Chain Mult | [Burst Balloons (#312)](https://leetcode.com/problems/burst-balloons/) | 🔴 Hard | Interval DP `dp[i][j]` | [DP](./dynamic-programming/dynamic-programming) |
| 13.7 | Coin Change Problem | [Coin Change II (#518)](https://leetcode.com/problems/coin-change-ii/) | 🟡 Medium | Number of coin combinations | [DP](./dynamic-programming/dynamic-programming) |

### 14. Greedy (6 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 14.1 | Activity Selection | [Non-overlapping Intervals (#435)](https://leetcode.com/problems/non-overlapping-intervals/) | 🟡 Medium | Sort by end-time greedily | [Greedy](./greedy/greedy) |
| 14.2 | Fractional Knapsack | [Maximum Units on a Truck (#1710)](https://leetcode.com/problems/maximum-units-on-a-truck/) | 🟢 Easy | Sort by unit value ratio | [Greedy](./greedy/greedy) |
| 14.3 | Huffman Coding | [Optimal Code Length (Greedy)](https://leetcode.com/problems/) | 🟡 Medium | PriorityQueue merge lowest | [Greedy](./greedy/greedy) |
| 14.4 | Job Sequencing | [Task Scheduler (#621)](https://leetcode.com/problems/task-scheduler/) | 🟡 Medium | Most frequent task first | [Heap](./heap/heap) |
| 14.5 | Minimum Spanning Tree | [Min Cost to Connect All Points (#1584)](https://leetcode.com/problems/min-cost-to-connect-all-points/) | 🟡 Medium | Prim's / Kruskal's algorithm | [Graph](./graph/graph) |
| 14.6 | Dijkstra (Greedy) | [Path with Minimum Effort (#1631)](https://leetcode.com/problems/path-with-minimum-effort/) | 🟡 Medium | Min-Heap greedy frontier | [Graph](./graph/graph) |

### 15. Bit Manipulation (6 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 15.1 | Get / Set / Clear Bit | [Single Number (#136)](https://leetcode.com/problems/single-number/) | 🟢 Easy | Bitmask bit shifts `(1 << k)` | [Bit Manipulation](./bit-manipulation/bit-manipulation) |
| 15.2 | Check Power of 2 | [Power of Two (#231)](https://leetcode.com/problems/power-of-two/) | 🟢 Easy | `(n & (n - 1)) == 0` | [Bit Manipulation](./bit-manipulation/bit-manipulation) |
| 15.3 | Count Set Bits | [Number of 1 Bits (#191)](https://leetcode.com/problems/number-of-1-bits/) | 🟢 Easy | Brian Kernighan's algorithm | [Bit Manipulation](./bit-manipulation/bit-manipulation) |
| 15.4 | XOR Tricks | [Missing Number (#268)](https://leetcode.com/problems/missing-number/) | 🟢 Easy | XOR self-cancellation property | [Bit Manipulation](./bit-manipulation/bit-manipulation) |
| 15.5 | Find Odd Occurring | [Single Number II (#137)](https://leetcode.com/problems/single-number-ii/) | 🟡 Medium | Bit sum modulo 3 | [Bit Manipulation](./bit-manipulation/bit-manipulation) |
| 15.6 | Swap without temp | [Reverse Bits (#190)](https://leetcode.com/problems/reverse-bits/) | 🟢 Easy | In-place XOR bit swapping | [Bit Manipulation](./bit-manipulation/bit-manipulation) |

### 16. Advanced Topics (6 Problems)
| # | Handbook Pattern | Classical LeetCode Problem | Difficulty | Key Pattern | Guide |
|---|---|---|---|---|---|
| 16.1 | Trie (Prefix Tree) | [Implement Trie (#208)](https://leetcode.com/problems/implement-trie-prefix-tree/) | 🟡 Medium | 26-child character tree | [Trie](./trie/trie) |
| 16.2 | Segment Tree | [Range Sum Query - Mutable (#307)](https://leetcode.com/problems/range-sum-query-mutable/) | 🟡 Medium | Range query & point update | [Tree](./tree/tree) |
| 16.3 | Fenwick Tree (BIT) | [Range Sum Query 2D - Mutable (#308)](https://leetcode.com/problems/range-sum-query-2d-mutable/) | 🔴 Hard | Low-bit index manipulation | [Tree](./tree/tree) |
| 16.4 | Rolling Hash | [Repeated DNA Sequences (#187)](https://leetcode.com/problems/repeated-dna-sequences/) | 🟡 Medium | Rabin-Karp polynomial hash | [Sliding Window](./sliding-window/sliding-window) |
| 16.5 | String Hashing | [Shortest Palindrome (#214)](https://leetcode.com/problems/shortest-palindrome/) | 🔴 Hard | Prefix vs Suffix rolling hash | [Sliding Window](./sliding-window/sliding-window) |
| 16.6 | Matrix Exponentiation | [Climbing Stairs in O(log n)](https://leetcode.com/problems/climbing-stairs/) | 🔴 Hard | Fast matrix power multiplication | [Dynamic Programming](./dynamic-programming/dynamic-programming) |

---

## ⚡ Part 3: 20+ Canonical LeetCode Pattern Templates

---

### 1. Two Sum (LeetCode #1)
> **Problem**: Given an array `nums` and integer `target`, return indices of two numbers such that they add up to `target`.  
> **Example**: `nums = [2, 7, 11, 15], target = 9` $\rightarrow$ `Output: [0, 1]`

#### 💡 Strategy & Intuition
- [x] Use a `HashMap<Integer, Integer>` storing `(element -> index)`.
- [x] For each element, compute `rem = target - nums[i]`.
- [x] Check if `rem` already exists in the map. If yes, return current and stored indices.
- [x] Otherwise, record `(nums[i], i)` and proceed.

#### ☕ Java Implementation
```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int rem = target - nums[i];
        if (map.containsKey(rem)) {
            return new int[]{map.get(rem), i};
        }
        map.put(nums[i], i);
    }
    return new int[]{};
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — We traverse the array once and each map lookup/insertion is $\mathcal{O}(1)$ on average.
- **Space Complexity**: $\mathcal{O}(n)$ — Extra memory for storing up to $n$ elements in the `HashMap`.

---

### 2. Best Time to Buy and Sell Stock (LeetCode #121)
> **Problem**: Find the maximum profit achievable by buying and selling a stock exactly once.  
> **Example**: `prices = [7, 1, 5, 3, 6, 4]` $\rightarrow$ `Output: 5` (Buy at 1, sell at 6)

#### 💡 Strategy & Intuition
- [x] Maintain a running minimum price seen so far (`min`).
- [x] For each price, calculate potential profit: `price - min`.
- [x] Update running maximum profit (`max`).

#### ☕ Java Implementation
```java
public int maxProfit(int[] prices) {
    int min = Integer.MAX_VALUE, max = 0;
    for (int price : prices) {
        min = Math.min(min, price);
        max = Math.max(max, price - min);
    }
    return max;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — Single linear pass over the price list.
- **Space Complexity**: $\mathcal{O}(1)$ — Only two scalar variables (`min` and `max`).

---

### 3. Maximum Subarray — Kadane's Algorithm (LeetCode #53)
> **Problem**: Find the contiguous subarray within `nums` with the largest sum.  
> **Example**: `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]` $\rightarrow$ `Output: 6` (`[4, -1, 2, 1]`)

#### 💡 Strategy & Intuition
- [x] Use **Kadane's Algorithm**: Maintain `curr` (current subarray sum) and `maxSoFar`.
- [x] For each element, choose whether to extend the previous subarray or start fresh: `curr = Math.max(num, curr + num)`.
- [x] If `curr` drops below 0, it won't benefit any future subarray, so resetting/choosing `num` naturally restarts.

#### ☕ Java Implementation
```java
public int maxSubArray(int[] nums) {
    int maxSoFar = nums[0], curr = 0;
    for (int num : nums) {
        curr = Math.max(num, curr + num);
        maxSoFar = Math.max(maxSoFar, curr);
    }
    return maxSoFar;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — Single pass through the array.
- **Space Complexity**: $\mathcal{O}(1)$ — Constant extra space.

---

### 4. Rotate Array by K (LeetCode #189)
> **Problem**: Rotate an array to the right by `k` steps.  
> **Example**: `nums = [1, 2, 3, 4, 5, 6, 7], k = 3` $\rightarrow$ `Output: [5, 6, 7, 1, 2, 3, 4]`

#### 💡 Strategy & Intuition
- [x] Normalize `k`: `k = k % nums.length`.
- [x] **Step 1**: Reverse the entire array.
- [x] **Step 2**: Reverse the first `k` elements (`0` to `k - 1`).
- [x] **Step 3**: Reverse the remaining `n - k` elements (`k` to `n - 1`).

#### ☕ Java Implementation
```java
public void rotate(int[] nums, int k) {
    k = k % nums.length;
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}

private void reverse(int[] nums, int l, int r) {
    while (l < r) {
        int t = nums[l];
        nums[l] = nums[r];
        nums[r] = t;
        l++;
        r--;
    }
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — Each element is swapped a constant number of times.
- **Space Complexity**: $\mathcal{O}(1)$ — In-place array mutation without extra buffers.

---

### 5. Remove Duplicates from Sorted Array (LeetCode #26)
> **Problem**: Remove duplicates in-place from a sorted array and return the new length.  
> **Example**: `nums = [1, 1, 2, 2, 3, 3, 4]` $\rightarrow$ `Output: 4, nums = [1, 2, 3, 4, ...]`

#### 💡 Strategy & Intuition
- [x] Use **Fast & Slow Two Pointers**.
- [x] `slow` (`i`): tracks the tail of the unique sorted sequence.
- [x] `fast` (`j`): scans forward. When `nums[j] != nums[i]`, advance `i` and overwrite `nums[i] = nums[j]`.

#### ☕ Java Implementation
```java
public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int i = 0;
    for (int j = 1; j < nums.length; j++) {
        if (nums[j] != nums[i]) {
            nums[++i] = nums[j];
        }
    }
    return i + 1;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — Single pass with two pointers.
- **Space Complexity**: $\mathcal{O}(1)$ — In-place overwrite.

---

### 6. Merge Intervals (LeetCode #56)
> **Problem**: Given an array of intervals, merge all overlapping intervals.  
> **Example**: `intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]` $\rightarrow$ `Output: [[1, 6], [8, 10], [15, 18]]`

#### 💡 Strategy & Intuition
- [x] Sort intervals by their start time: `Arrays.sort(intervals, (a, b) -> a[0] - b[0])`.
- [x] Maintain a merged list. Compare each interval with the last interval in the result.
- [x] If `curr[0] <= last[1]`, overlap occurs: expand `last[1] = Math.max(last[1], curr[1])`.
- [x] Otherwise, no overlap: append `curr` to the result list.

#### ☕ Java Implementation
```java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> res = new ArrayList<>();
    res.add(intervals[0]);

    for (int[] in : intervals) {
        int[] last = res.get(res.size() - 1);
        if (in[0] <= last[1]) {
            last[1] = Math.max(last[1], in[1]);
        } else {
            res.add(in);
        }
    }
    return res.toArray(new int[res.size()][]);
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n \log n)$ — Dominated by the initial sort step. Linear merge pass takes $\mathcal{O}(n)$.
- **Space Complexity**: $\mathcal{O}(n)$ — Auxiliary list holding merged intervals.

---

### 7. Sliding Window (Fixed Size: Maximum Sum Subarray)
> **Problem**: Find the maximum sum of any contiguous subarray of fixed size `k`.  
> **Example**: `nums = [2, 1, 5, 1, 3, 2], k = 3` $\rightarrow$ `Output: 9` (`[5, 1, 3]`)

#### 💡 Strategy & Intuition
- [x] Calculate the sum of the first `k` elements to initialize the window.
- [x] Slide the window forward one position at a time: Add the incoming element `nums[i]` and subtract the outgoing element `nums[i - k]`.
- [x] Update `maxSum = Math.max(maxSum, windowSum)`.

#### ☕ Java Implementation
```java
public int maxSum(int[] nums, int k) {
    int windowSum = 0, maxSum = Integer.MIN_VALUE;
    for (int i = 0; i < k; i++) windowSum += nums[i];
    maxSum = windowSum;

    for (int i = k; i < nums.length; i++) {
        windowSum += nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — Every element is added and removed at most once.
- **Space Complexity**: $\mathcal{O}(1)$ — Only scalar window sum accumulators.

---

### 8. Two Pointers (Pair Sum in Sorted Array) (LeetCode #167)
> **Problem**: Given a 1-indexed sorted array, determine if two numbers sum to `target`.  
> **Example**: `arr = [1, 2, 3, 4, 6], target = 6` $\rightarrow$ `Output: true` (`[2, 4]`)

#### 💡 Strategy & Intuition
- [x] Place `left` pointer at index `0` and `right` pointer at `arr.length - 1`.
- [x] If `sum == target`, target found!
- [x] If `sum < target`, advance `left++` to increase sum.
- [x] If `sum > target`, retreat `right--` to decrease sum.

#### ☕ Java Implementation
```java
public boolean pairSum(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return true;
        else if (sum < target) left++;
        else right--;
    }
    return false;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — Pointers converge monotonically inwards; at most $n$ iterations.
- **Space Complexity**: $\mathcal{O}(1)$ — Constant two-pointer indices.

---

### 9. Binary Search (LeetCode #704)
> **Problem**: Search for `target` in a sorted array. Return its index, or `-1` if absent.  
> **Example**: `nums = [1, 3, 5, 7, 9, 11], target = 7` $\rightarrow$ `Output: 3`

#### 💡 Strategy & Intuition
- [x] Initialize search space: `low = 0`, `high = arr.length - 1`.
- [x] Calculate `mid = low + (high - low) / 2` (prevents integer overflow vs `(low + high) / 2`).
- [x] Narrow down by halving the search space each step.

#### ☕ Java Implementation
```java
public int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(\log n)$ — Halves remaining search candidate range at every decision branch.
- **Space Complexity**: $\mathcal{O}(1)$ — Iterative pointer updates.

---

### 10. Merge Two Sorted Arrays (LeetCode #88)
> **Problem**: Merge two sorted arrays `a` and `b` into a single sorted array.  
> **Example**: `a = [1, 3, 5], b = [2, 4, 6]` $\rightarrow$ `Output: [1, 2, 3, 4, 5, 6]`

#### 💡 Strategy & Intuition
- [x] Maintain two read pointers `i` and `j` for arrays `a` and `b`, and write pointer `k`.
- [x] Compare `a[i]` and `b[j]`, place the smaller into `res[k++]`.
- [x] Drain remaining elements once one array runs out.

#### ☕ Java Implementation
```java
public int[] merge(int[] a, int[] b) {
    int n = a.length, m = b.length;
    int[] res = new int[n + m];
    int i = 0, j = 0, k = 0;

    while (i < n && j < m) {
        res[k++] = (a[i] <= b[j]) ? a[i++] : b[j++];
    }
    while (i < n) res[k++] = a[i++];
    while (j < m) res[k++] = b[j++];
    return res;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n + m)$ — Each element is read and copied exactly once.
- **Space Complexity**: $\mathcal{O}(n + m)$ — Output array storing combined elements.

---

### 11. Fast & Slow Pointer (Floyd's Cycle Detection) (LeetCode #141)
> **Problem**: Detect whether a linked list contains a cycle.  
> **Example**: `1 -> 2 -> 3 -> 4 -> 2 (cycle)` $\rightarrow$ `Output: true`

#### 💡 Strategy & Intuition
- [x] `slow` moves 1 node at a time (`slow.next`).
- [x] `fast` moves 2 nodes at a time (`fast.next.next`).
- [x] If there is a cycle, the relative speed difference will cause `fast` to lap and meet `slow`.
- [x] If `fast` or `fast.next` reaches `null`, no cycle exists.

#### ☕ Java Implementation
```java
public boolean hasCycle(ListNode head) {
    if (head == null || head.next == null) return false;
    ListNode slow = head, fast = head.next;

    while (fast != null && fast.next != null) {
        if (slow == fast) return true;
        slow = slow.next;
        fast = fast.next.next;
    }
    return false;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — If cycle exists, `fast` catches `slow` within $\le \text{cycle length}$ iterations.
- **Space Complexity**: $\mathcal{O}(1)$ — No extra nodes or hash sets allocated.

---

### 12. Longest Substring Without Repeating Characters (LeetCode #3)
> **Problem**: Find the length of the longest substring with all unique characters.  
> **Example**: `s = "abcabcbb"` $\rightarrow$ `Output: 3` (`"abc"`)

#### 💡 Strategy & Intuition
- [x] Use a variable-size sliding window: `[left, right]`.
- [x] Store character last seen index in `map`.
- [x] If duplicate character seen inside current window (`map.get(c) >= left`), jump `left = map.get(c) + 1`.
- [x] Update max window length: `right - left + 1`.

#### ☕ Java Implementation
```java
public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> map = new HashMap<>();
    int left = 0, max = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (map.containsKey(c) && map.get(c) >= left) {
            left = map.get(c) + 1;
        }
        map.put(c, right);
        max = Math.max(max, right - left + 1);
    }
    return max;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — `right` iterates from $0$ to $n-1$; `left` only moves forward.
- **Space Complexity**: $\mathcal{O}(k)$ — Size of the character alphabet/charset ($k \le 128$ for ASCII).

---

### 13. Longest Palindromic Substring (LeetCode #5)
> **Problem**: Find the longest contiguous substring in `s` that reads the same forwards and backwards.  
> **Example**: `s = "babad"` $\rightarrow$ `Output: "bab"` or `"aba"`

#### 💡 Strategy & Intuition
- [x] A palindrome mirrors around its center.
- [x] Expand around center for **odd length** (`expand(s, i, i)`) and **even length** (`expand(s, i, i + 1)`).
- [x] Keep track of starting index and maximum length found.

#### ☕ Java Implementation
```java
public String longestPalindrome(String s) {
    if (s == null || s.isEmpty()) return "";
    int start = 0, maxLen = 1;

    for (int i = 0; i < s.length(); i++) {
        int len1 = expand(s, i, i);     // odd length palindrome (center: i)
        int len2 = expand(s, i, i + 1); // even length palindrome (center: i, i+1)
        int len = Math.max(len1, len2);

        if (len > maxLen) {
            maxLen = len;
            start = i - (len - 1) / 2;
        }
    }
    return s.substring(start, start + maxLen);
}

private int expand(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
        l--;
        r++;
    }
    return r - l - 1; // valid length
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n^2)$ — $2n - 1$ centers, expanding each center takes up to $\mathcal{O}(n)$.
- **Space Complexity**: $\mathcal{O}(1)$ — Constant pointers and boundary variables.

---

### 14. Group Anagrams (LeetCode #49)
> **Problem**: Group an array of strings such that anagrams are grouped together.  
> **Example**: `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]` $\rightarrow$ `Output: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]`

#### 💡 Strategy & Intuition
- [x] Anagrams contain identical character frequencies. Sorting an anagram produces an identical canonical string key.
- [x] Use a `HashMap<String, List<String>>`.
- [x] Convert string to `char[]`, sort it, and use `new String(arr)` as the map key.

#### ☕ Java Implementation
```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String s : strs) {
        char[] arr = s.toCharArray();
        Arrays.sort(arr);
        String key = new String(arr);
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n \cdot k \log k)$ — Where $n$ is number of words, and $k$ is maximum word length (sorting each takes $k \log k$).
- **Space Complexity**: $\mathcal{O}(n \cdot k)$ — Storing all characters inside the map buckets.

---

### 15. Top K Frequent Elements (LeetCode #347)
> **Problem**: Return the `k` most frequent elements from an integer array.  
> **Example**: `nums = [1, 1, 1, 2, 2, 3], k = 2` $\rightarrow$ `Output: [1, 2]`

#### 💡 Strategy & Intuition
- [x] Build frequency map: `map.put(n, count + 1)`.
- [x] Maintain a **Min-Heap** of size $k$ ordered by frequency (`a[1] - b[1]`).
- [x] If heap size exceeds $k$, evict the least frequent (`pq.poll()`). The top $k$ elements remain.

#### ☕ Java Implementation
```java
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int n : nums) map.put(n, map.getOrDefault(n, 0) + 1);

    // Min-heap ordered by frequency
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);

    for (int key : map.keySet()) {
        pq.offer(new int[]{key, map.get(key)});
        if (pq.size() > k) pq.poll();
    }

    int[] res = new int[k];
    int i = k - 1;
    while (!pq.isEmpty()) {
        res[i--] = pq.poll()[0];
    }
    return res;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n \log k)$ — Pushing into a heap bounded at size $k$ costs $\mathcal{O}(\log k)$ per element.
- **Space Complexity**: $\mathcal{O}(n + k)$ — Map stores $n$ entries, heap stores $k$ items.

---

### 16. Kth Largest Element in an Array (LeetCode #215)
> **Problem**: Find the $k$-th largest element in an unsorted array.  
> **Example**: `nums = [3, 2, 1, 5, 6, 4], k = 2` $\rightarrow$ `Output: 5`

#### 💡 Strategy & Intuition
- [x] Maintain a **Min-Heap** of size $k$.
- [x] When inserting elements, if size exceeds $k$, poll the minimum.
- [x] After processing all numbers, the root `peek()` holds the smallest of the top $k$ elements, which is exactly the $k$-th largest element!

#### ☕ Java Implementation
```java
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> pq = new PriorityQueue<>(); // default min-heap
    for (int n : nums) {
        pq.offer(n);
        if (pq.size() > k) {
            pq.poll();
        }
    }
    return pq.peek();
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n \log k)$ — Inserting $n$ elements into a heap of capacity $k$.
- **Space Complexity**: $\mathcal{O}(k)$ — Bounded min-heap holding exactly $k$ elements.

---

### 17. Product of Array Except Self (LeetCode #238)
> **Problem**: Return an array `res` such that `res[i]` is the product of all elements of `nums` except `nums[i]`, without using division.  
> **Example**: `nums = [1, 2, 3, 4]` $\rightarrow$ `Output: [24, 12, 8, 6]`

#### 💡 Strategy & Intuition
- [x] **Left pass**: `res[i]` stores the running product of all elements to the left of `i`.
- [x] **Right pass**: Maintain a running scalar `right` product; multiply `res[i]` by `right` while moving backwards.

#### ☕ Java Implementation
```java
public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];

    // Left prefix product pass
    res[0] = 1;
    for (int i = 1; i < n; i++) {
        res[i] = res[i - 1] * nums[i - 1];
    }

    // Right suffix product pass
    int right = 1;
    for (int i = n - 1; i >= 0; i--) {
        res[i] *= right;
        right *= nums[i];
    }
    return res;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(n)$ — Two linear passes over the array.
- **Space Complexity**: $\mathcal{O}(1)$ — Output array `res` does not count towards auxiliary space.

---

### 18. Merge K Sorted Lists (LeetCode #23)
> **Problem**: Merge `k` sorted linked lists into one consolidated sorted list.  
> **Example**: `lists = [[1, 4, 5], [1, 3, 4], [2, 6]]` $\rightarrow$ `Output: [1, 1, 2, 3, 4, 4, 5, 6]`

#### 💡 Strategy & Intuition
- [x] Use a **Min-Heap (PriorityQueue)** storing the current heads of the `k` lists.
- [x] Extract minimum node: `pq.poll()`. Attach it to `curr.next`.
- [x] If that extracted node has a `.next`, insert its next node into the priority queue.

#### ☕ Java Implementation
```java
public ListNode mergeKLists(ListNode[] lists) {
    if (lists == null || lists.length == 0) return null;

    PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (ListNode node : lists) {
        if (node != null) pq.offer(node);
    }

    ListNode dummy = new ListNode(0), curr = dummy;
    while (!pq.isEmpty()) {
        ListNode node = pq.poll();
        curr.next = node;
        curr = curr.next;
        if (node.next != null) {
            pq.offer(node.next);
        }
    }
    return dummy.next;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(N \log k)$ — Where $N$ is the total number of nodes across all lists and $k$ is the number of lists.
- **Space Complexity**: $\mathcal{O}(k)$ — Priority queue holds at most one active head per list ($k$ elements).

---

### 19. LRU Cache Design (LeetCode #146)
> **Problem**: Design a data structure that follows the Least Recently Used (LRU) eviction constraint with $\mathcal{O}(1)$ `get` and `put`.  
> **Operations**: `get(key)` returns value or `-1`; `put(key, value)` inserts or updates value, evicting LRU when exceeding capacity.

#### 💡 Strategy & Intuition
- [x] Combine a `HashMap<Integer, Node>` (for $\mathcal{O}(1)$ lookup) with a **Doubly Linked List** (for $\mathcal{O}(1)$ node removal and insertion at head).
- [x] Use dummy `head` and `tail` sentinels to eliminate null checks.
- [x] When accessed (`get` or `put`), move node to head (Most Recently Used).
- [x] When capacity overflows, remove node right before `tail` (Least Recently Used).

#### ☕ Java Implementation
```java
class LRUCache {
    class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { this.key = k; this.val = v; }
    }

    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0);
    private final Node tail = new Node(0, 0);

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        insertAtHead(node);
        return node.val;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            remove(map.get(key));
        }
        if (map.size() >= capacity) {
            map.remove(tail.prev.key);
            remove(tail.prev);
        }
        Node node = new Node(key, value);
        insertAtHead(node);
        map.put(key, node);
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insertAtHead(Node node) {
        node.next = head.next;
        node.next.prev = node;
        head.next = node;
        node.prev = head;
    }
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(1)$ for both `get()` and `put()` — Map provides constant lookup; doubly-linked list pointer swaps run in constant time.
- **Space Complexity**: $\mathcal{O}(\text{capacity})$ — Map and doubly linked list hold at most `capacity` items.

---

### 20. Topological Sort — Kahn's Algorithm (LeetCode #207, #210)
> **Problem**: Find a valid linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge $u \to v$, $u$ appears before $v$.  
> **Example**: `V = 4, edges = [[1, 0], [2, 0], [3, 1], [3, 2]]` $\rightarrow$ `Output: [0, 1, 2, 3]`

#### 💡 Strategy & Intuition
- [x] Calculate **in-degree** (incoming edge count) for every vertex.
- [x] Enqueue all nodes with `in-degree == 0` into a BFS `Queue`.
- [x] Pop node from queue, add to topological order, and decrement in-degree for all adjacent neighbors.
- [x] If neighbor's in-degree drops to `0`, enqueue it. If processed count $< V$, graph contains a cycle!

#### ☕ Java Implementation
```java
public int[] topoSort(int V, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
    int[] indegree = new int[V];

    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        indegree[e[1]]++;
    }

    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < V; i++) {
        if (indegree[i] == 0) q.offer(i);
    }

    int[] res = new int[V];
    int idx = 0;
    while (!q.isEmpty()) {
        int node = q.poll();
        res[idx++] = node;
        for (int nei : adj.get(node)) {
            if (--indegree[nei] == 0) {
                q.offer(nei);
            }
        }
    }
    return idx == V ? res : new int[0]; // empty array if graph has a cycle
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(V + E)$ — Every vertex is visited once and each directed edge is relaxed once.
- **Space Complexity**: $\mathcal{O}(V + E)$ — Adjacency list and in-degree array.

---

### 21. Dijkstra's Shortest Path Algorithm (LeetCode #743)
> **Problem**: Find the shortest distance from a single source node `src` to all other nodes in a weighted graph with non-negative edge weights.

#### 💡 Strategy & Intuition
- [x] Initialize distances array: `dist[src] = 0`, all other `dist[v] = Integer.MAX_VALUE`.
- [x] Use a **Min-Heap (PriorityQueue)** storing `[distance, node]`.
- [x] Greedily pick the node with smallest known distance: if `d > dist[u]`, skip (stale entry).
- [x] Relax all outgoing edges: if `d + weight < dist[v]`, update `dist[v]` and offer `[dist[v], v]` to heap.

#### ☕ Java Implementation
```java
public int[] dijkstra(int V, List<List<int[]>> adj, int src) {
    int[] dist = new int[V];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // Min-heap: [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int d = cur[0], u = cur[1];

        if (d > dist[u]) continue; // Stale heap entry

        for (int[] nei : adj.get(u)) {
            int v = nei[0], wt = nei[1];
            if (d + wt < dist[v]) {
                dist[v] = d + wt;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}((V + E) \log V)$ — Each vertex and edge can trigger a log-time priority queue heap operation.
- **Space Complexity**: $\mathcal{O}(V)$ — Heap entries and distances table.

---

### 22. Trie (Prefix Tree) (LeetCode #208)
> **Problem**: Implement a Trie with `insert(word)`, `search(word)`, and `startsWith(prefix)` operations.

#### 💡 Strategy & Intuition
- [x] Each `TrieNode` has an array of 26 child references (`TrieNode[26]`) and an `isEnd` boolean flag.
- [x] Fast lookup without string hashing collisions: time depends strictly on string length $L$, regardless of total dictionary size.
- [x] Fundamental foundation for autocomplete, spellcheckers, and Boggle word search solvers.

#### ☕ Java Implementation
```java
class Trie {
    static class TrieNode {
        TrieNode[] child = new TrieNode[26];
        boolean isEnd = false;
    }

    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.child[i] == null) {
                node.child[i] = new TrieNode();
            }
            node = node.child[i];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        TrieNode node = find(word);
        return node != null && node.isEnd;
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private TrieNode find(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int i = c - 'a';
            if (node.child[i] == null) return null;
            node = node.child[i];
        }
        return node;
    }
}
```

#### ⏱️ Complexity & Why
- **Time Complexity**: $\mathcal{O}(L)$ for `insert`, `search`, and `startsWith`, where $L$ is the length of the query string.
- **Space Complexity**: $\mathcal{O}(N \cdot L)$ worst-case, where $N$ is number of words and $L$ is average word length. Nodes share common prefixes in practice.

---

## 🎯 Quick Decision Matrix

| When you see this problem clue... | Choose this pattern | Primary Java Tool |
|---|---|---|
| Find pair/triplet summing to target in sorted array | **Two Pointers** | `left = 0, right = n - 1` |
| Subarray sum, substring with at most $k$ distinct chars | **Sliding Window** | `Map<Character, Integer>` |
| Contiguous maximum sum subarray | **Kadane's Algorithm** | `curr = Math.max(num, curr + num)` |
| Search in sorted array or monotonically changing function | **Binary Search** | `mid = low + (high - low) / 2` |
| Top $k$ elements, median of stream, merge sorted lists | **Heap / PriorityQueue** | `PriorityQueue<Integer>` |
| Detect cycle in linked list or array sequence | **Floyd's Fast & Slow** | `slow.next`, `fast.next.next` |
| String anagrams, word groupings | **Hashing with Sorted Key** | `Arrays.sort(s.toCharArray())` |
| Dependency ordering, course schedule, build system | **Topological Sort** | In-degree array + BFS `Queue` |
| Shortest path with positive weights | **Dijkstra's Algorithm** | Min-Heap on distance |
| String prefix search, dictionary autocomplete | **Trie** | `TrieNode[26]` |
| Overlapping ranges, meeting rooms, interval merges | **Interval Sorting** | `Arrays.sort(intervals, (a, b) -> a[0] - b[0])` |
