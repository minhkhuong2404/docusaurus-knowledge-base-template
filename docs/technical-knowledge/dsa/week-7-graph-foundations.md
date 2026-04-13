---
id: week-7-graph-foundations
title: "Week 7: Graph Foundations"
description: Transition from trees to general networks. Master graph representations, Adjacency Lists, and grid-based DFS/BFS traversals in Java.
tags: [dsa, java, graphs, dfs, bfs, algorithms, week-7]
sidebar_position: 7
---

# Week 7: Graph Foundations

## 1. Overview
Welcome to Week 7! You have already worked with Graphs without realizing it—a Binary Tree is simply a specialized, directed, acyclic graph. This week, we remove those restrictions. Nodes can now have multiple parents, connections can be two-way (undirected), and paths can loop back on themselves (cycles).

Graphs are the foundation of modern technology. They power GPS navigation, social network friend recommendations, internet routing protocols, and recommendation engines.

**Goals for this week:**
- Understand Vertices (Nodes) and Edges (Connections).
- Learn the two primary ways to represent a graph in memory: Adjacency Lists and Adjacency Matrices.
- Master the absolute golden rule of graph traversal: **Always track what you have visited** to prevent infinite loops.
- Apply DFS and BFS to both node-based graphs and 2D grids.

---

## 2. Theory & Fundamentals

### Terminology
- **Vertex (Node):** A single point of data.
- **Edge:** A connection between two vertices.
    - *Directed:* A one-way street (A -> B).
    - *Undirected:* A two-way street (`A <-> B`).
- **Weight:** A cost associated with an edge (e.g., distance in miles between two cities). Unweighted graphs assume all edges cost the same (usually 1).

### Graph Representation
1. **Adjacency Matrix:** A 2D array `matrix[i][j]` where `1` means an edge exists between vertex i and j, and `0` means it does not. 
    - *Pros:* O(1) time to check if an edge exists. 
    - *Cons:* O(V^2) space complexity. Terrible for sparse graphs (where most nodes aren't connected).
2. **Adjacency List:** An array or Hash Map of Lists. `map.get(i)` returns a list of all neighbors connected to vertex i.
    - *Pros:* O(V + E) space complexity. Highly memory efficient and the **most common representation in interviews**.

### The Golden Rule: The `visited` Set
Because graphs can have cycles, if you traverse from A to B, B might point back to A. If you don't track that you've already processed A, your DFS or BFS will bounce between them forever until you get a `StackOverflowError` or `OutOfMemoryError`. Always use a `boolean[] visited` or `HashSet<Integer> visited`.

---

## 3. Code Templates (Java)

### Template 1: Standard Graph BFS (Shortest Path in Unweighted Graph)
Using an Adjacency List mapped by an array.
```java
public void bfs(List<List<Integer>> adjList, int startNode, int n) {
    Queue<Integer> queue = new ArrayDeque<>();
    boolean[] visited = new boolean[n];
    
    queue.offer(startNode);
    visited[startNode] = true;
    
    int level = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int curr = queue.poll();
            System.out.println("Visited node " + curr + " at distance " + level);
            
            // Iterate through all neighbors
            for (int neighbor : adjList.get(curr)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true; // Mark visited BEFORE adding to queue to prevent duplicates
                    queue.offer(neighbor);
                }
            }
        }
        level++;
    }
}
```

### Template 2: 2D Grid DFS (Implicit Graph)
Many interview problems represent the graph as a 2D matrix (like a map of islands).
```java
public void gridDFS(char[][] grid, int r, int c) {
    int rows = grid.length;
    int cols = grid[0].length;
    
    // Boundary checks and Visited check
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] == '0') {
        return;
    }
    
    // Mark as visited (often by mutating the grid to save memory, e.g., '1' to '0')
    grid[r][c] = '0';
    
    // Traverse all 4 directions (Up, Down, Left, Right)
    gridDFS(grid, r - 1, c);
    gridDFS(grid, r + 1, c);
    gridDFS(grid, r, c - 1);
    gridDFS(grid, r, c + 1);
}
```

---

## 4. Pattern Recognition Guide

**How to spot Graph patterns:**
1. **"Shortest path", "Fewest steps", or "Minimum jumps":** In an *unweighted* graph (where every move costs 1), this is always **BFS**.
2. **"Connected components", "Islands", or "Can reach destination":** This is about exploring all possibilities. Both DFS and BFS work, but **DFS** is usually less code to write, especially in grids.
3. **"Given a list of edges [u, v]...":** You must first spend O(V + E) time building the Adjacency List before you can traverse it. Never try to traverse the raw edge list directly.
4. **"2D grid" problems:** If the input is a 2D matrix and you need to explore neighbors, treat it as an implicit graph and use DFS/BFS with boundary checks.
5. **"All paths from A to B":** This screams for a backtracking DFS approach, where you explore all neighbors recursively and backtrack when you hit a dead end.
6. **"Level by level traversal":** If you need to process nodes in order of their distance from the start node, this is a clear signal for BFS, which naturally processes nodes in "waves" or "levels".
7. **"Detect cycles":** If the problem asks you to determine if a graph contains a cycle, you can use DFS with a `visited` set. If you encounter a neighbor that is already in the `visited` set (and it's not the parent node), then a cycle exists.
8. **"Topological sort" or "Dependency resolution":** If you need to order tasks based on dependencies (e.g., course scheduling), this is a strong signal for using DFS to perform a topological sort, or Kahn's algorithm which uses BFS and in-degree counting.
9. **"Find all paths" or "Enumerate combinations":** When the problem requires you to find all possible paths from a source to a destination, this is a strong signal for using backtracking DFS, where you explore all neighbors recursively and backtrack when you hit a dead end.
10. **"Bipartite graph check":** If the problem asks you to determine if a graph can be colored with two colors without adjacent nodes sharing the same color, this is a strong signal for using BFS or DFS to attempt to color the graph and check for conflicts.

---

## 5. Worked Examples

### Example 1: LeetCode 200. Number of Islands
**Problem:** Given an M x N 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.
**Solution (Grid DFS):**
```java
class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int numIslands = 0;
        
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    numIslands++;
                    sinkIsland(grid, r, c); // Trigger DFS to clear the entire island
                }
            }
        }
        return numIslands;
    }
    
    private void sinkIsland(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] == '0') {
            return;
        }
        grid[r][c] = '0'; // Sink it to mark as visited
        
        sinkIsland(grid, r + 1, c);
        sinkIsland(grid, r - 1, c);
        sinkIsland(grid, r, c + 1);
        sinkIsland(grid, r, c - 1);
    }
}
```

### Example 2: LeetCode 133. Clone Graph
**Problem:** Return a deep copy (clone) of a graph given a reference of a node in a connected undirected graph.
**Solution (DFS with HashMap):**
```java
class Solution {
    // Maps original node to its clone to prevent infinite loops and duplicate clones
    private Map<Node, Node> visited = new HashMap<>();
    
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        
        // If we already cloned it, just return the clone
        if (visited.containsKey(node)) {
            return visited.get(node);
        }
        
        // Create the clone and put it in the map immediately
        Node cloneNode = new Node(node.val, new ArrayList<>());
        visited.put(node, cloneNode);
        
        // Iterate through neighbors, clone them recursively, and add to the clone's neighbor list
        for (Node neighbor : node.neighbors) {
            cloneNode.neighbors.add(cloneGraph(neighbor));
        }
        
        return cloneNode;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Graph Representation & Basics**
1. Find if Path Exists in Graph (LC 1971)
2. Find Center of Star Graph (LC 1791)
3. Clone Graph (LC 133)

**Day 2: 2D Grid Graphs (Implicit Graphs)**
4. Number of Islands (LC 200)
5. Flood Fill (LC 733)
6. Max Area of Island (LC 695)

**Day 3: Intermediate Grid Algorithms**
7. Surrounded Regions (LC 130) - *Hint: DFS from the borders first.*
8. Count Sub Islands (LC 1905)
9. Pacific Atlantic Water Flow (LC 417)

**Day 4: Shortest Paths in Grids (BFS)**
10. Rotting Oranges (LC 994) - *Multi-source BFS.*
11. 01 Matrix (LC 542)
12. Shortest Path in Binary Matrix (LC 1091)

**Day 5: Connected Components & State Management**
13. Number of Connected Components in an Undirected Graph (LC 323 / Premium or Neetcode)
14. Keys and Rooms (LC 841)
15. Number of Provinces (LC 547)

**Day 6: Advanced BFS & Puzzles**
16. Word Ladder (LC 127) - *A classic BFS puzzle. Treat each word as a node.*
17. Open the Lock (LC 752)
18. Minimum Genetic Mutation (LC 433)

**Day 7: Bipartite Graphs & Review**
19. Is Graph Bipartite? (LC 785)
20. Possible Bipartition (LC 886)
21. Snakes and Ladders (LC 909)

---

## 7. Mock Interview Module

### Problem: The Social Network "2nd Degree" Suggestion
**Context:** You are working on the friend recommendation engine for a new social media app. You are given a list of users, and a list of `friendships` represented as pairs of IDs (e.g., `[0, 1]` means User 0 and User 1 are friends).
The Product Manager wants to implement a "People You May Know" feature. Specifically, they want to suggest users who are exactly **2 degrees of connection away** from a target user (i.e., friends of their friends, but not their direct friends, and not themselves).

**Question:** Write a function `public List<Integer> getSecondDegreeFriends(int n, int[][] friendships, int targetUser)` that returns a list of user IDs that fit this criteria. `n` is the total number of users (IDs `0` to `n-1`).

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Are friendships mutual?" -> *Interviewer:* Yes, it is an undirected graph.
- *Candidate:* "What if a user has no 2nd-degree friends?" -> *Interviewer:* Return an empty list.
- *Candidate:* "What if User A and User B share multiple mutual friends? Do we include User B multiple times?" -> *Interviewer:* No, the result should contain unique user IDs.

#### Step 2: Formulating the Strategy
*Candidate's thought process:*
- The raw input is an Edge List (`friendships`). We cannot traverse this efficiently. Step 1 is to convert it into an Adjacency List.
- We need to find nodes based on distance (levels). Therefore, **BFS** is the perfect tool.
- Level 0 is the `targetUser`. Level 1 are their direct friends. Level 2 are the 2nd-degree friends we want.
- We must maintain a `visited` set to ensure we don't include the target user or direct friends in our final answer, and to prevent infinite loops.

#### Step 3: The Optimized Solution (BFS)
```java
// Time: O(V + E), Space: O(V + E)
public List<Integer> getSecondDegreeFriends(int n, int[][] friendships, int targetUser) {
    // 1. Build the Adjacency List
    Map<Integer, List<Integer>> adj = new HashMap<>();
    for (int i = 0; i < n; i++) {
        adj.put(i, new ArrayList<>());
    }
    for (int[] edge : friendships) {
        adj.get(edge[0]).add(edge[1]);
        adj.get(edge[1]).add(edge[0]);
    }
    
    // 2. Setup BFS
    Queue<Integer> queue = new ArrayDeque<>();
    boolean[] visited = new boolean[n];
    
    queue.offer(targetUser);
    visited[targetUser] = true;
    
    int degree = 0;
    
    // 3. Traverse exactly 2 levels
    while (!queue.isEmpty() && degree <= 2) {
        int levelSize = queue.size();
        List<Integer> currentLevel = new ArrayList<>();
        
        for (int i = 0; i < levelSize; i++) {
            int curr = queue.poll();
            if (degree == 2) {
                currentLevel.add(curr);
            }
            
            for (int neighbor : adj.get(curr)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
        
        if (degree == 2) {
            return currentLevel; // We found the 2nd degree friends, no need to go deeper
        }
        degree++;
    }
    
    return new ArrayList<>(); // Return empty if we couldn't reach degree 2
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "What if instead of just 2nd degree, we want to find the degree of connection between *any* two users on the platform? And what if the platform scales to 2 billion users?"
*Candidate's expected thought process:*
- To find the shortest path between any two nodes, we use BFS.
- However, standard BFS explores in a massive expanding circle. At 2 billion users, the queue would become impossibly large (the branching factor of a social network is huge).
- *Optimization:* We would use **Bidirectional BFS**. We start one BFS from User A, and another BFS from User B simultaneously. If their search frontiers intersect, we've found the shortest path. This drastically reduces the search space (from O(B^d) to O(B^(d/2)), where B is the branching factor and d is distance).