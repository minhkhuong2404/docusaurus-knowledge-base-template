---
id: week-18-disjoint-set-union
title: "Week 18: Disjoint Set Union (Union-Find)"
description: Master the Disjoint Set Union (DSU) data structure. Learn how to dynamically track connected components and optimize with Path Compression and Union by Rank in Java.
tags: [dsa, java, disjoint-set, union-find, graphs, algorithms, week-18]
sidebar_position: 18
---

# Week 18: Disjoint Set Union (Union-Find)

## 1. Overview
Welcome to Week 18! Last week we conquered finding paths in static graphs. But what if the graph is *dynamic*? What if new edges are being added in real-time, and you need to constantly answer the question: "Are Node A and Node B connected?"

Running BFS/DFS every single time an edge is added takes $O(V + E)$ time, which is too slow for real-time systems. Enter the **Disjoint Set Union (DSU)**, also known as **Union-Find**. This elegant, array-based data structure solves dynamic connectivity and cycle-detection problems in nearly $O(1)$ time.

**Goals for this week:**
- Understand the array-based tree representation of DSU.
- Master the two critical optimizations: **Path Compression** and **Union by Rank/Size**.
- Learn when to use DSU instead of DFS/BFS for connected components.
- Apply DSU to solve Kruskal's Minimum Spanning Tree algorithm.

---

## 2. Theory & Fundamentals

### The Concept
Imagine 10 isolated nodes. Each node is initially the "parent" (or root) of its own set. 
When we connect Node A and Node B, we perform a **Union**: we make the root of A point to the root of B. Now they share the same ultimate root. 
To check if Node X and Node Y are connected, we perform a **Find**: we traverse up their parent pointers. If they have the exact same root, they are connected!

### The Two Critical Optimizations
Without optimization, a DSU tree can degrade into a linked list (e.g., $1 \rightarrow 2 \rightarrow 3 \rightarrow 4$), making the `find()` operation $O(N)$.
1. **Union by Rank (or Size):** Keep track of the height (rank) of each tree. When merging two sets, always attach the shorter tree to the root of the taller tree. This prevents the tree from growing unnecessarily tall.
2. **Path Compression:** When calling `find(x)`, as we traverse up the tree to find the root, we update every node along the way to point *directly* to the root. The next time we call `find()` on those nodes, it takes $O(1)$ time.

### Time Complexity
With both optimizations applied, the amortized time complexity of operations is $O(\alpha(N))$, where $\alpha$ is the Inverse Ackermann function. For all practical purposes in the observable universe, $\alpha(N) \le 4$. Therefore, DSU operations are considered to operate in **$O(1)$ amortized time**.

---

## 3. Code Templates (Java)

### Template 1: The Standard Union-Find Class
*Memorize this class. You will drop it into dozens of interview solutions.*
```java
class UnionFind {
    private int[] root;
    private int[] rank;
    private int count; // Optional: keeps track of the number of disconnected components

    public UnionFind(int size) {
        root = new int[size];
        rank = new int[size];
        count = size;
        for (int i = 0; i < size; i++) {
            root[i] = i; // Initially, each node is its own root
            rank[i] = 1; // Initially, all ranks are 1
        }
    }

    // 1. Find with Path Compression
    public int find(int x) {
        if (x == root[x]) {
            return x; // Found the root
        }
        // Recursively find the root and compress the path
        root[x] = find(root[x]); 
        return root[x];
    }

    // 2. Union by Rank
    // Returns true if a merge happened, false if they were already connected
    public boolean union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        if (rootX != rootY) {
            // Attach the shorter tree under the root of the taller tree
            if (rank[rootX] > rank[rootY]) {
                root[rootY] = rootX;
            } else if (rank[rootX] < rank[rootY]) {
                root[rootX] = rootY;
            } else {
                root[rootY] = rootX;
                rank[rootX] += 1; // Increase rank if heights were equal
            }
            count--; // Merged two components into one
            return true;
        }
        return false; // They were already in the same set
    }

    public int getCount() {
        return count;
    }
}
```

---

## 4. Pattern Recognition Guide

**How to spot DSU problems:**
1. **"Dynamic Connectivity" or "Adding edges one by one":** If the graph is built gradually and you need to answer connectivity queries during the build process, DSU is mandatory.
2. **"Redundant Connection" or "Find the cycle in an undirected graph":** If `union(x, y)` returns `false`, it means `x` and `y` were already connected. Adding an edge between them creates a cycle!
3. **"Number of connected components":** While DFS/BFS can solve this, DSU is often much cleaner to write and doesn't require building an Adjacency List.
4. **"Lexicographically smallest equivalent string":** Any problem that defines transitive relationships (If $A=B$ and $B=C$, then $A=C$) is a DSU problem.
5. **"Minimum Spanning Tree (MST)":** If the problem asks for a MST, Prim's algorithm is one option, but Kruskal's algorithm is often cleaner and relies heavily on DSU to efficiently check for cycles while building the MST.
6. **"Offline queries about connectivity":** If you have a list of edges and a list of queries asking if certain nodes are connected, you can sort the edges and queries by time, then use DSU to process them in order.
7. **"Find the largest component size by common factor":** If the problem involves grouping numbers based on shared factors, you can use DSU to union numbers that share a common factor, treating factors as connections between numbers.
8. **"Design a social network friend circle":** If the problem asks you to design a system that can efficiently manage friend circles (groups of connected users), DSU is an ideal choice for dynamically merging friend groups and checking if two users are in the same circle.
9. **"Find the number of islands in a grid":** If the problem involves counting the number of islands in a grid, you can use DSU to union adjacent land cells and count the number of distinct root parents to determine the number of islands.
10. **"Find the minimum number of operations to connect all nodes":** If the problem asks for the minimum number of operations (e.g., adding edges) required to connect all nodes in a graph, DSU can be used to track the number of disconnected components and determine how many additional connections are needed to unify them all.

---

## 5. Worked Examples

### Example 1: LeetCode 684. Redundant Connection
**Problem:** In this problem, a tree is an undirected graph that is connected and has no cycles. You are given a graph that started as a tree with `n` nodes, with one additional edge added. Return an edge that can be removed so that the resulting graph is a tree of `n` nodes.
**Solution (Cycle Detection using DSU):**
```java
class Solution {
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        UnionFind uf = new UnionFind(n + 1); // 1-indexed nodes
        
        for (int[] edge : edges) {
            // If union returns false, these nodes are already connected.
            // This specific edge creates the cycle!
            if (!uf.union(edge[0], edge[1])) {
                return edge;
            }
        }
        return new int[0];
    }
    
    // (Insert standard UnionFind class here)
}
```

### Example 2: LeetCode 547. Number of Provinces
**Problem:** There are `n` cities. A province is a group of directly or indirectly connected cities. You are given an $n \times n$ matrix `isConnected`. Return the total number of provinces.
**Solution (DSU Component Counting):**
```java
class Solution {
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        UnionFind uf = new UnionFind(n);
        
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) { // Only check upper triangle to avoid duplicates
                if (isConnected[i][j] == 1) {
                    uf.union(i, j);
                }
            }
        }
        
        return uf.getCount(); // The number of remaining roots is the number of provinces
    }
    
    // (Insert standard UnionFind class here, ensuring getCount() is implemented)
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: DSU Fundamentals**
1. Number of Provinces (LC 547)
2. Redundant Connection (LC 684)
3. Graph Valid Tree (LC 261 / Premium or Neetcode)

**Day 2: Advanced Cycle Detection & Components**
4. Number of Connected Components in an Undirected Graph (LC 323 / Premium)
5. Accounts Merge (LC 721) - *A brilliant application combining HashMaps (Email -> ID) and DSU.*
6. Satisfiability of Equality Equations (LC 990)

**Day 3: Minimum Spanning Tree (Kruskal's Algorithm)**
7. Min Cost to Connect All Points (LC 1584) - *Solve this again, but use Kruskal's (Sort edges + DSU) instead of Prim's!*
8. Find Critical and Pseudo-Critical Edges in MST (LC 1489)
9. Connecting Cities With Minimum Cost (LC 1135 / Premium)

**Day 4: Dynamic Connectivity & Grids**
10. Number of Islands II (LC 305 / Premium) - *The ultimate dynamic connectivity grid problem.*
11. Regions Cut By Slashes (LC 959) - *Requires upscaling the grid or clever DSU triangle mapping.*
12. Max Area of Island (LC 695) - *Review: Try solving it with DSU instead of DFS.*

**Day 5: Math & String Relationships**
13. Lexicographically Smallest Equivalent String (LC 1061)
14. Evaluate Division (LC 399) - *Hard! Requires a weighted DSU.*
15. Smallest String With Swaps (LC 1202)

**Day 6: Advanced Matrix Unions**
16. Surrounded Regions (LC 130) - *Review: Use DSU with a "dummy" boundary node.*
17. Number of Operations to Make Network Connected (LC 1319)
18. Checking Existence of Edge Length Limited Paths (LC 1697) - *Offline queries + DSU.*

**Day 7: The Final Bosses of DSU**
19. Largest Component Size by Common Factor (LC 952) - *DSU over prime factors!*
20. Minimize Malware Spread (LC 924)
21. Remove Max Number of Edges to Keep Graph Fully Traversable (LC 1579)

---

## 7. Mock Interview Module

### Problem: The Distributed Network Splitter
**Context:** You are managing the connection topology of a distributed database cluster with `N` nodes. You are given a list of `connections` representing fiber optic cables between nodes.
A disaster happens. Someone accidentally runs a script that deletes cables one by one. You are given a list `queries`, where `queries[i]` is the index of the connection in the `connections` array that gets severed.

**Question:** After each cable is severed, the system needs to know how many isolated network clusters (components) remain. Write a function `public int[] getClusterCount(int n, int[][] connections, int[] queries)` that returns an array of size `queries.length` containing the number of isolated clusters after each query.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Are there duplicate edges?" -> *Interviewer:* No.
- *Candidate:* "Do the queries sever all connections eventually?" -> *Interviewer:* Not necessarily. Some connections might survive the whole disaster.

#### Step 2: The Logic (Reverse Time DSU)
*Candidate's thought process:*
- The problem asks us to *remove* edges and count components.
- Standard DSU is incredible at *adding* edges and tracking components (`count--`). But DSU **cannot** remove edges (you can't easily "un-compress" paths).
- *The "Aha!" Moment:* Time travel. What if we simulate the process backwards? 
- We start with the graph in its final, most broken state (after all queried cables are destroyed). We count the components.
- Then, we iterate through the `queries` array in *reverse* order, effectively **adding** the cables back into the network using DSU, and recording the component count at each step.
- Finally, we reverse our results array to get chronological order.

#### Step 3: The Optimized Solution
```java
// Time: O(N + C + Q * α(N)) where C is connections and Q is queries
// Space: O(N + C)
public int[] getClusterCount(int n, int[][] connections, int[] queries) {
    UnionFind uf = new UnionFind(n);
    
    // 1. Mark which connections are destroyed in a boolean array for fast lookup
    boolean[] isDestroyed = new boolean[connections.length];
    for (int q : queries) {
        isDestroyed[q] = true;
    }
    
    // 2. Build the final broken state of the graph
    for (int i = 0; i < connections.length; i++) {
        if (!isDestroyed[i]) {
            uf.union(connections[i][0], connections[i][1]);
        }
    }
    
    // 3. Process queries in reverse (adding edges back)
    int[] result = new int[queries.length];
    for (int i = queries.length - 1; i >= 0; i--) {
        // Record the component count BEFORE adding the edge back
        result[i] = uf.getCount();
        
        // Add the edge back for the previous step in time
        int edgeIndex = queries[i];
        uf.union(connections[edgeIndex][0], connections[edgeIndex][1]);
    }
    
    return result;
}

// (Candidate provides the standard UnionFind class here)
```

#### Step 4: Follow-up Questions
*Interviewer:* "This reverse-time trick is brilliant. Let's switch gears to the DSU implementation itself. You used both Path Compression and Union by Rank. If you only used Path Compression, but completely removed Union by Rank (meaning you just arbitrarily attach `rootX` to `rootY`), what is the worst-case time complexity of a single `find` operation?"

*Candidate's expected thought process:*
- Path compression flattens the tree *after* a traversal.
- Without Union by Rank, an adversary could feed us unions that intentionally build a linked list ($1 \rightarrow 2 \rightarrow 3 \rightarrow 4$). 
- If we then call `find(4)`, it takes $O(N)$ time on that first call. 
- However, because of path compression, subsequent calls will be $O(1)$. 
- So the *worst-case single operation* is $O(N)$, but the *amortized* time complexity over a long sequence of operations actually remains bounded to $O(\log N)$ even without Union by Rank.