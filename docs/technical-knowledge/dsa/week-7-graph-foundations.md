---
id: week-7-graph-foundations
title: "Week 7: Graph Foundations"
description: Transition from trees to general networks. Master graph representations, Adjacency Lists, and grid-based DFS/BFS traversals in Java.
tags: [dsa, java, graphs, dfs, bfs, algorithms, week-7]
sidebar_position: 7
---

# Week 7: Graph Foundations

## 1. Overview

Welcome to Week 7! You have already worked with graphs without realizing it — a Binary Tree is simply a **specialized, directed, acyclic graph**. This week, we remove those restrictions. Nodes can now have multiple parents, connections can be two-way (undirected), and paths can loop back on themselves (cycles).

Graphs are the foundation of modern technology:
- **GPS navigation** → finding the shortest route (Dijkstra's algorithm on a weighted graph)
- **Social networks** → friend recommendations (BFS from your node, 2nd-degree connections)
- **Internet routing** → how data packets find their way across the world (routing protocols on network graphs)
- **Package managers** → resolving dependencies without circular imports (topological sort on DAGs)

### Why Does This Matter for Interviews?

Graph problems test whether you can **model a problem correctly** (translating requirements into vertices and edges) and **traverse it efficiently** (BFS vs DFS, visited tracking). They are consistently among the hardest problems because they require multiple skills simultaneously: problem modeling, data structure choice, and algorithmic thinking.

**Goals for this week:**
- Understand vertices, edges, and the vocabulary of graphs.
- Learn the two primary representations: Adjacency List vs Adjacency Matrix — and know when to use which.
- Master the **Golden Rule**: always track visited nodes to prevent infinite loops.
- Apply DFS and BFS confidently to both node-based graphs and 2D grid problems.
- Build intuition for when BFS is required (shortest path) vs when DFS is sufficient (connected components).

### Knowledge You Need Before Starting

- Tree traversal confidence (DFS/BFS) from Week 6.
- Queue and stack implementation intuition from Week 5.
- Matrix indexing fluency (`row`, `col`, boundary checks).
- Comfort translating real problems into nodes and edges.

---

## 2. The Core Mental Models

### 2.1 What Is a Graph? — From Tree to Graph

You already know trees. A graph is a **generalization** of a tree with fewer restrictions:

```
Tree (restricted graph):          General Graph (unrestricted):
- Exactly one path between nodes  - Multiple paths allowed
- No cycles                       - Cycles allowed
- One root                        - No designated root
- Parent → Child (directed)       - Can be directed or undirected

     A                                A ──── B
    / \                               |  \   |
   B   C               vs            |   \  |
  / \                                C ──── D
 D   E                               |
                                     E (E → A creates a cycle)
```

**The key shift in thinking:** In a tree, you can always assume "if I came from node X, I haven't visited it yet." In a graph, **you cannot assume this**. You must explicitly remember where you've been.

---

### 2.2 Directed vs Undirected

```
Directed graph (one-way edges):    Undirected graph (two-way edges):
A ──→ B ──→ C                      A ──── B ──── C
↑         ↓                        |             |
└────── D ─┘                       D ─────────── ┘

Example: Twitter follows            Example: Facebook friendships
(A follows B ≠ B follows A)        (A friends B = B friends A)
```

**How this affects your code:**
- **Undirected:** When you add edge A→B, you **must also add** B→A to the adjacency list.
- **Directed:** Only add the specific direction(s) specified.

---

### 2.3 BFS vs DFS — The Critical Mental Model

This is the most common decision in graph problems. Get this right and the code mostly writes itself.

```
BFS (Breadth-First Search):         DFS (Depth-First Search):
Explores by LEVEL                   Explores by DEPTH

        A                                   A
       /|\                                 /|\
      B C D     ← Level 1                B C D
     /|   |                             /|   |
    E F   G    ← Level 2              E  F   G

BFS order: A, B, C, D, E, F, G      DFS order: A, B, E, F, C, D, G
(wave by wave)                       (dive deep, backtrack, dive again)
```

**BFS analogy:** Drop a stone in a pond. The ripples expand outward in concentric circles. Every node at distance 1 is visited before any node at distance 2.

**DFS analogy:** Exploring a cave system. You pick a tunnel and go as deep as possible. When you hit a dead end, you backtrack to the last fork and try the next tunnel.

**The decisive question: "Does the problem care about distance?"**
- **YES** (shortest path, minimum steps, fewest moves) → **BFS** — its level-by-level nature guarantees the first time you reach a node is via the shortest path.
- **NO** (connected components, count regions, can we reach X at all?) → **DFS** — simpler code, often less memory.

---

### 2.4 The Golden Rule: The `visited` Set

**Why do we need it?** In a tree, you always move from parent to child — you can never revisit a node without backtracking deliberately. In a graph, a node's neighbor might be a node you already processed. Without tracking, you loop forever.

```
Undirected graph:  A ── B ── C ── A (cycle)

DFS from A without visited tracking:
  Visit A → go to B → go to C → go to A (already visited, but we don't know!)
  → go to B → go to C → go to A → ... ∞ StackOverflowError!

DFS from A WITH visited = {A, B, C}:
  Visit A → mark A → go to B → mark B → go to C → mark C
  → try neighbor A: A is visited ✓ SKIP
  → try neighbor B: B is visited ✓ SKIP
  Done. ✅
```

**Two ways to track visited in Java:**

```java
// Option 1: boolean array (when nodes are integers 0..n-1)
// Pros: O(1) access, cache-friendly, minimal memory
boolean[] visited = new boolean[n];
visited[node] = true;

// Option 2: HashSet (when nodes are arbitrary objects, strings, or coordinates)
// Pros: Works with any key type
Set<Integer> visited = new HashSet<>();
visited.add(node);

// For 2D grids: Option 3 — mutate the grid itself (saves extra space)
// Mark visited by changing the cell value
grid[r][c] = '0';  // e.g., turn land into water in Number of Islands
// Restore if needed (backtracking problems)
```

**CRITICAL: Mark visited BEFORE adding to the queue (BFS), not when you dequeue.**

```java
// ❌ Wrong — causes duplicate processing!
queue.offer(neighbor);
// ... later ...
visited[node] = true;  // Marked too late!

// ✅ Correct — mark immediately when discovered
visited[neighbor] = true;
queue.offer(neighbor);
```

**Why?** If you mark when dequeuing, multiple nodes can add the same neighbor to the queue before any of them dequeue it. You'll process that neighbor multiple times — incorrect results and O(N²) performance.

---

## 3. Theory & Fundamentals

### 3.1 Terminology

| Term                | Definition                                     | Example                        |
| ------------------- | ---------------------------------------------- | ------------------------------ |
| **Vertex (Node)**   | A single data point                            | User in a social network       |
| **Edge**            | A connection between two vertices              | Friendship between two users   |
| **Directed edge**   | One-way connection (A → B)                     | Twitter follow                 |
| **Undirected edge** | Two-way connection (A ↔ B)                     | Facebook friendship            |
| **Weight**          | A cost on an edge                              | Miles between cities           |
| **Path**            | A sequence of vertices connected by edges      | Route from A to D              |
| **Cycle**           | A path that starts and ends at the same vertex | A → B → C → A                  |
| **Connected**       | Every vertex is reachable from every other     | Single island                  |
| **Component**       | A maximal connected subgraph                   | One island in a sea of islands |
| **DAG**             | Directed Acyclic Graph (no cycles)             | Task dependency tree           |
| **Degree**          | Number of edges connected to a vertex          | Number of friends              |

---

### 3.2 Graph Representations — When to Use Which

#### Adjacency Matrix

```
Graph:        A ── B
              |    |
              C ── D

Matrix representation (A=0, B=1, C=2, D=3):

         A  B  C  D
    A  [ 0, 1, 1, 0 ]
    B  [ 1, 0, 0, 1 ]
    C  [ 1, 0, 0, 1 ]
    D  [ 0, 1, 1, 0 ]

matrix[i][j] = 1 means edge exists between i and j
```

**Pros:**
- O(1) to check if an edge exists between any two nodes: `matrix[i][j] == 1`

**Cons:**
- Always $O(V^2)$ space — even if only 10 out of 10,000 possible edges exist
- Iterating over a node's neighbors takes $O(V)$ time even if it has 1 neighbor

**Use when:** Dense graphs where V is small (< 1000) and you frequently check "does edge (u,v) exist?"

#### Adjacency List (Use This in Almost Every Interview)

```
Same graph:

adj[0] = [1, 2]   (A connects to B, C)
adj[1] = [0, 3]   (B connects to A, D)
adj[2] = [0, 3]   (C connects to A, D)
adj[3] = [1, 2]   (D connects to B, C)
```

**Pros:**
- $O(V + E)$ space — only stores edges that actually exist
- Iterating over a node's neighbors takes $O(degree)$ time — only actual neighbors

**Cons:**
- $O(degree)$ to check if a specific edge exists (scan neighbor list)

**Use when:** Sparse graphs (most real-world graphs), which is the default in interviews.

**Java implementation options:**

```java
// Option 1: Array of Lists (when nodes are 0..n-1)
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
adj.get(u).add(v);
adj.get(v).add(u);  // For undirected

// Option 2: HashMap of Lists (when nodes are arbitrary)
Map<Integer, List<Integer>> adj = new HashMap<>();
adj.computeIfAbsent(u, k -> new ArrayList<>()).add(v);
adj.computeIfAbsent(v, k -> new ArrayList<>()).add(u);

// Option 3: HashMap of Sets (if you need O(1) neighbor lookup)
Map<Integer, Set<Integer>> adj = new HashMap<>();
adj.computeIfAbsent(u, k -> new HashSet<>()).add(v);
```

---

### 3.3 Building the Graph from an Edge List

**Almost every interview problem gives you an edge list.** You must build the adjacency list yourself before traversing.

```java
// Input: n=5 nodes, edges=[[0,1],[1,2],[2,3],[3,4]]
// Build adjacency list:

List<List<Integer>> buildGraph(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1];
        adj.get(u).add(v);
        adj.get(v).add(u);  // Remove for directed graph
    }
    return adj;
}
```

**Never traverse the raw edge list directly** — you'd need to scan all edges to find a node's neighbors: $O(E)$ per node, leading to $O(V \times E)$ total.

---

### 3.4 The 4-Direction Template for 2D Grids

Many graph problems are disguised as 2D grid problems. A grid is an **implicit graph** where:
- Each cell `(r, c)` is a vertex
- Adjacent cells (up, down, left, right) are the edges

```
Grid as a graph:

(0,0) ── (0,1) ── (0,2)
  |         |        |
(1,0) ── (1,1) ── (1,2)
  |         |        |
(2,0) ── (2,1) ── (2,2)

Each cell connects to its 4 neighbors (if within bounds and not blocked).
```

**Standard direction arrays:**

```java
int[] dr = {-1, 1, 0, 0};  // Up, Down, Left, Right (row delta)
int[] dc = {0, 0, -1, 1};  // Up, Down, Left, Right (col delta)

// Traverse all 4 neighbors of (r, c):
for (int d = 0; d < 4; d++) {
    int nr = r + dr[d];
    int nc = c + dc[d];
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        // Valid neighbor: process (nr, nc)
    }
}
```

**8-direction (diagonals included):**

```java
int[] dr = {-1,-1,-1, 0, 0, 1, 1, 1};
int[] dc = {-1, 0, 1,-1, 1,-1, 0, 1};
// Gives all 8 neighbors including diagonals
```

---

## 4. Code Templates (Java)

### Template 1: Standard BFS (Shortest Path in Unweighted Graph)

```java
public int bfsShortestPath(List<List<Integer>> adj, int start, int target, int n) {
    boolean[] visited = new boolean[n];
    Queue<Integer> queue = new ArrayDeque<>();

    visited[start] = true;    // Mark BEFORE adding to queue
    queue.offer(start);

    int distance = 0;

    while (!queue.isEmpty()) {
        int levelSize = queue.size();   // Process one full level (distance) at a time

        for (int i = 0; i < levelSize; i++) {
            int curr = queue.poll();

            if (curr == target) return distance;  // Found! Distance is exact.

            for (int neighbor : adj.get(curr)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;   // Mark BEFORE adding
                    queue.offer(neighbor);
                }
            }
        }

        distance++;  // Finished this level, increment distance
    }

    return -1;  // Target unreachable
}
```

**Why `levelSize = queue.size()` at the start of each iteration?**
Because we're about to add new nodes (the next level) to the queue during this iteration. If we check `queue.isEmpty()` in the inner loop, we'd process next-level nodes at the wrong distance. Capturing the size first freezes the boundary between levels.

---

### Template 2: Standard DFS (Connected Components, Reachability)

```java
// Recursive DFS — cleaner, uses call stack implicitly
public void dfsRecursive(List<List<Integer>> adj, int node, boolean[] visited) {
    visited[node] = true;

    for (int neighbor : adj.get(node)) {
        if (!visited[neighbor]) {
            dfsRecursive(adj, neighbor, visited);
        }
    }
}

// Iterative DFS — explicit stack, avoids StackOverflowError for very deep graphs
public void dfsIterative(List<List<Integer>> adj, int start, boolean[] visited) {
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    visited[start] = true;

    while (!stack.isEmpty()) {
        int node = stack.pop();

        for (int neighbor : adj.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                stack.push(neighbor);
            }
        }
    }
}
```

**When to prefer iterative DFS?**
For very deep graphs (long chains), recursive DFS can cause `StackOverflowError`. Java's default stack size handles ~5,000–10,000 recursive calls. If a graph has 100,000 nodes in a single path, use iterative.

---

### Template 3: 2D Grid DFS (Implicit Graph)

```java
private int[] dr = {-1, 1, 0, 0};
private int[] dc = {0, 0, -1, 1};

public void gridDFS(char[][] grid, int r, int c) {
    int rows = grid.length;
    int cols = grid[0].length;

    // Boundary + visited check in one gate
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') {
        return;
    }

    grid[r][c] = '0';  // Mark visited by mutating the grid

    // Visit all 4 neighbors
    for (int d = 0; d < 4; d++) {
        gridDFS(grid, r + dr[d], c + dc[d]);
    }
}
```

**Mutation vs separate visited array:**

```java
// Mutation (space O(1) extra): good when you're allowed to modify the input
grid[r][c] = '0';

// Separate visited array (space O(M×N) extra): when input must be preserved
boolean[][] visited = new boolean[rows][cols];
visited[r][c] = true;
```

---

### Template 4: Multi-Source BFS

Used when there are multiple starting points simultaneously (e.g., all rotten oranges spreading at once).

```java
public int multiSourceBFS(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    Queue<int[]> queue = new ArrayDeque<>();

    // Add ALL starting sources to the queue before beginning
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (isSource(grid[r][c])) {
                queue.offer(new int[]{r, c});
                // No separate visited array needed — source cells already marked
            }
        }
    }

    int time = 0;
    int[] dr = {-1, 1, 0, 0};
    int[] dc = {0, 0, -1, 1};

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int[] curr = queue.poll();
            int r = curr[0], c = curr[1];

            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == TARGET) {
                    grid[nr][nc] = VISITED;  // Mark visited
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        if (!queue.isEmpty()) time++;  // Only count time if more work remains
    }

    return time;
}
```

**The key insight of multi-source BFS:** All sources start at distance 0 (time 0) simultaneously. Each level of BFS represents one unit of time passing. This correctly models "all sources spreading in parallel."

---

## 5. Pattern Recognition Guide

### 5.1 The Decision Flowchart

```
                        START
                          │
              Is the input an explicit
              edge list or 2D grid?
                    │
             ┌─ YES ┴─ NO ──────────────────────────────┐
             │                                          │
             ▼                                          ▼
  Build adjacency list first        (Other: tree, linear, etc.)
  (O(V + E) preprocessing)
             │
             ▼
  Does the problem care about
  DISTANCE or LEVELS?
             │
      ┌─ YES ┴─ NO ─────────────────────────┐
      │                                     │
      ▼                                     ▼
    BFS                                   DFS
  (Level-by-level                    (Explore fully,
   guarantees shortest                 backtrack)
   path in unweighted                      │
   graphs)                     ┌──────────┴──────────┐
      │                        │                     │
      │               Connected                 All Paths
      │               Component?              (Backtracking)
      │               (one DFS/BFS                   │
      │                per unvisited           DFS + restore
      │                node)                   state after
      │                                        each call
      ▼
  Multiple sources?
      │
  ┌── YES ─── NO ──┐
  │                │
  ▼                ▼
Multi-source     Single-source
BFS (add all     BFS (standard
sources first)   template)
```

---

### 5.2 Keyword Trigger Table

| Problem Keywords                                   | Technique                   | Why                                       |
| -------------------------------------------------- | --------------------------- | ----------------------------------------- |
| "shortest path" / "minimum steps" / "fewest moves" | BFS                         | Level-by-level = shortest first           |
| "number of islands" / "connected components"       | DFS (or BFS)                | Flood-fill each component                 |
| "all rotten oranges spread simultaneously"         | Multi-source BFS            | All sources start at time 0               |
| "can reach destination"                            | BFS or DFS                  | Just need reachability                    |
| "all paths from A to B"                            | Backtracking DFS            | Enumerate all possibilities               |
| "minimum path from any border"                     | BFS from all border cells   | Reverse: BFS outward from all borders     |
| "word ladder" / "gene mutation"                    | BFS on string graph         | Each transformation = edge, count levels  |
| "bipartite check" / "two-color"                    | BFS or DFS + color tracking | Alternate colors, detect conflicts        |
| "topological sort" / "course schedule"             | BFS (Kahn's) or DFS         | Week 8 topic — note it now                |
| "detect cycle"                                     | DFS with recursion stack    | Track in-progress vs completed nodes      |
| "2D grid" + any traversal                          | Grid DFS/BFS                | Treat cells as nodes, 4-directional edges |

---

### 5.3 Common Traps & How to Avoid Them

**Trap 1: Not building the adjacency list from the edge list**

```java
// ❌ Trying to traverse raw edge list directly
for (int[] edge : edges) {
    if (edge[0] == target || edge[1] == target) { ... }
}
// O(E) per node = O(V×E) total — inefficient and messy

// ✅ Build adj list first, then traverse
List<List<Integer>> adj = buildGraph(n, edges);
dfs(adj, startNode, visited);
```

---

**Trap 2: Marking visited when dequeuing instead of when enqueuing (BFS)**

```java
// ❌ Wrong — same node can be enqueued multiple times
queue.offer(neighbor);  // Add to queue
// ... later ...
int node = queue.poll();
visited[node] = true;   // Too late! Already added duplicates

// ✅ Mark immediately when discovered
if (!visited[neighbor]) {
    visited[neighbor] = true;   // Mark now
    queue.offer(neighbor);
}
```

---

**Trap 3: Forgetting to add both directions for undirected graphs**

```java
// ❌ Only adds one direction
adj.get(u).add(v);

// ✅ Add both directions for undirected
adj.get(u).add(v);
adj.get(v).add(u);
```

---

**Trap 4: Boundary check order in grid DFS**

```java
// ❌ Accesses grid before checking bounds — ArrayIndexOutOfBoundsException!
if (grid[r][c] == '0') return;           // Could crash if r/c is out of bounds
if (r < 0 || r >= rows || ...) return;   // Bounds check should come first

// ✅ Always check bounds BEFORE accessing the array
if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == '0') return;
```

---

**Trap 5: Forgetting to restore state in backtracking DFS**

```java
// ❌ Permanently marks cells even when backtracking
grid[r][c] = '#';   // Mark visited
dfs(grid, r+1, c);  // Explore
// Don't restore — other paths can't use this cell!

// ✅ Restore after exploring (for "all paths" style problems)
grid[r][c] = '#';   // Mark visited
dfs(grid, r+1, c);  // Explore
grid[r][c] = '1';   // Restore ← CRITICAL for backtracking
```

---

**Trap 6: Using recursion for very large/deep graphs**

```java
// ❌ StackOverflowError for graphs with 100,000+ nodes in a chain
void dfs(int node) {
    // 100,000 recursive calls → stack overflow
}

// ✅ Use iterative DFS with explicit Deque<Integer> stack
Deque<Integer> stack = new ArrayDeque<>();
stack.push(start);
while (!stack.isEmpty()) { ... }
```

---

**Trap 7: Multi-source BFS — not adding ALL sources first**

```java
// ❌ Only adds one source, misses others
queue.offer(sources[0]);

// ✅ Add ALL sources before starting BFS
for (int[] source : sources) {
    queue.offer(source);
    visited[source[0]][source[1]] = true;
}
// THEN start the BFS loop
```

---

## 6. Worked Examples (Step-by-Step Walkthroughs)

### Example 1: LeetCode 200 — Number of Islands

**Problem:** Count the number of islands in a 2D grid (1 = land, 0 = water). Islands are connected land cells horizontally or vertically.

**Thought process:**
1. Scan every cell. When we find a `'1'` (land), we've discovered a new island.
2. Trigger a DFS to "sink" the entire island — mark all connected land cells as visited.
3. Count how many times we trigger DFS = number of islands.

```
Grid:
  1 1 0 0 0
  1 1 0 0 0
  0 0 1 0 0
  0 0 0 1 1

Scan r=0,c=0: '1' found → islandCount=1 → DFS sinks everything connected
  DFS visits (0,0),(0,1),(1,0),(1,1) → all become '0'

Grid after first DFS:
  0 0 0 0 0
  0 0 0 0 0
  0 0 1 0 0
  0 0 0 1 1

Continue scan... (0,0) to (1,1) are all '0' now.
r=2,c=2: '1' found → islandCount=2 → DFS sinks (2,2)

r=3,c=3: '1' found → islandCount=3 → DFS sinks (3,3),(3,4)

Answer: 3 ✅
```

```java
class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int count = 0;

        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    sinkIsland(grid, r, c);
                }
            }
        }
        return count;
    }

    private void sinkIsland(char[][] grid, int r, int c) {
        // Bounds check + visited check in one line
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') {
            return;
        }
        grid[r][c] = '0';  // Sink (mark visited)

        sinkIsland(grid, r - 1, c);  // Up
        sinkIsland(grid, r + 1, c);  // Down
        sinkIsland(grid, r, c - 1);  // Left
        sinkIsland(grid, r, c + 1);  // Right
    }
}
```

**Complexity:** Time $O(M \times N)$ — each cell is visited at most once. Space $O(M \times N)$ — recursion stack depth (worst case: entire grid is one island).

---

### Example 2: LeetCode 994 — Rotting Oranges

**Problem:** Grid of 0 (empty), 1 (fresh), 2 (rotten). Each minute, rotten oranges infect all adjacent fresh oranges. Return minutes until all oranges rot, or -1 if impossible.

**Thought process:**
1. All rotten oranges spread simultaneously → **Multi-source BFS** (not DFS — we need minimum time).
2. Add all initially rotten oranges to the queue at time 0.
3. BFS level-by-level: each level = one minute.
4. After BFS, if any fresh oranges remain → return -1.

```
Initial grid:          After t=1:            After t=2:
  2 1 1                  2 2 1                 2 2 2
  1 1 0                  2 2 0                 2 2 0
  0 1 1                  0 1 1                 0 2 2

Sources at t=0: (0,0) is rotten
BFS Level 1 (t=1): (0,0) infects (0,1) and (1,0)
BFS Level 2 (t=2): (0,1) infects (0,2); (1,0) infects (1,1)
BFS Level 3 (t=3): (0,2) infects nothing new; (1,1) infects (2,1)
BFS Level 4 (t=4): (2,1) infects (2,2)
Answer: 4
```

```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        Queue<int[]> queue = new ArrayDeque<>();
        int freshCount = 0;

        // Phase 1: add all rotten oranges as sources, count fresh
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) queue.offer(new int[]{r, c});
                else if (grid[r][c] == 1) freshCount++;
            }
        }

        if (freshCount == 0) return 0;  // No fresh oranges to rot

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};
        int minutes = 0;

        // Phase 2: BFS level by level
        while (!queue.isEmpty() && freshCount > 0) {
            minutes++;
            int size = queue.size();

            for (int i = 0; i < size; i++) {
                int[] curr = queue.poll();
                for (int d = 0; d < 4; d++) {
                    int nr = curr[0] + dr[d];
                    int nc = curr[1] + dc[d];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;  // Mark as rotten (visited)
                        freshCount--;
                        queue.offer(new int[]{nr, nc});
                    }
                }
            }
        }

        return freshCount == 0 ? minutes : -1;
    }
}
```

**Why BFS and not DFS here?** DFS would dive deep in one direction first. An orange that's 3 steps from the nearest rotten orange might appear "reachable in 1 step" in DFS if it's explored right after the start. BFS correctly counts the minimum time because it spreads outward uniformly.

---

### Example 3: LeetCode 133 — Clone Graph

**Problem:** Deep copy an undirected connected graph.

**Thought process:**
1. We need to traverse every node and create a new copy of each.
2. The problem: cycles. If A→B→A, cloning A triggers cloning B triggers cloning A again → infinite recursion.
3. **Key insight:** Store clones in a `HashMap<OriginalNode, CloneNode>`. Before recursing into a neighbor, check if it's already cloned.

```
Original graph: 1 ── 2
                |    |
                4 ── 3

DFS from node 1:
  Clone(1) created → map = {1: clone1}
  Recurse into neighbor 2:
    Clone(2) created → map = {1:clone1, 2:clone2}
    Recurse into neighbor 1:
      Already in map! Return clone1. ← Breaks the cycle!
    Recurse into neighbor 3:
      Clone(3) → ... (similar pattern)
  Recurse into neighbor 4:
    Clone(4) → ...
```

```java
class Solution {
    private Map<Node, Node> cloneMap = new HashMap<>();

    public Node cloneGraph(Node node) {
        if (node == null) return null;

        // Already cloned → return the existing clone
        if (cloneMap.containsKey(node)) return cloneMap.get(node);

        // Create clone and register it BEFORE recursing (prevents cycles)
        Node clone = new Node(node.val);
        cloneMap.put(node, clone);

        // Clone all neighbors
        for (Node neighbor : node.neighbors) {
            clone.neighbors.add(cloneGraph(neighbor));
        }

        return clone;
    }
}
```

**The critical line:** `cloneMap.put(node, clone)` **before** the neighbor loop. If you put it after, a cycle (A → B → A) will cause infinite recursion before you ever register A in the map.

**Complexity:** Time $O(V + E)$. Space $O(V)$ for the clone map.

---

### Example 4: LeetCode 127 — Word Ladder

**Problem:** Transform `beginWord` to `endWord` changing one letter at a time. Each intermediate word must be in a word list. Return the minimum number of transformations.

**Thought process:**
1. Think of each word as a **node**. Two words are connected by an **edge** if they differ by exactly one letter.
2. "Minimum transformations" = **shortest path** → BFS.
3. Generating all valid neighbors: for each character position, try all 26 letters. If the result is in the word set, it's a neighbor.

```
beginWord="hit", endWord="cog"
wordList=["hot","dot","dog","lot","log","cog"]

Graph:
  hit ── hot ── dot ── dog ── cog
              └── lot ── log ──┘

BFS from "hit":
  Level 1: {"hot"}
  Level 2: {"dot", "lot"}
  Level 3: {"dog", "log"}
  Level 4: {"cog"} ← FOUND! Transformations = 5 (hit→hot→dot→dog→cog)
```

```java
class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> wordSet = new HashSet<>(wordList);
        if (!wordSet.contains(endWord)) return 0;

        Queue<String> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();

        queue.offer(beginWord);
        visited.add(beginWord);
        int transformations = 1;  // Count includes the beginWord itself

        while (!queue.isEmpty()) {
            int size = queue.size();

            for (int i = 0; i < size; i++) {
                String word = queue.poll();

                // Generate all neighbors: try changing each character
                char[] chars = word.toCharArray();
                for (int j = 0; j < chars.length; j++) {
                    char original = chars[j];
                    for (char c = 'a'; c <= 'z'; c++) {
                        if (c == original) continue;
                        chars[j] = c;
                        String next = new String(chars);

                        if (next.equals(endWord)) return transformations + 1;

                        if (wordSet.contains(next) && !visited.contains(next)) {
                            visited.add(next);
                            queue.offer(next);
                        }
                    }
                    chars[j] = original;  // Restore character
                }
            }
            transformations++;
        }
        return 0;  // No path found
    }
}
```

**Why not build the adjacency list upfront?** For a word list of size $N$ and word length $L$, building all edges takes $O(N^2 \times L)$ — extremely slow. Generating neighbors on-the-fly during BFS takes $O(L \times 26)$ per word — much faster.

---

## 7. Problem-Solving Framework (Use This in Interviews)

### Step 1 — Model the Graph (1–2 minutes)
Ask yourself out loud:
> "What are the nodes? What are the edges? Is this directed or undirected? Is it weighted or unweighted?"

For grid problems:
> "Each cell is a node. Adjacent cells are edges. I'll use the 4-direction template."

### Step 2 — Choose BFS or DFS (30 seconds)
> "Does the problem ask for shortest path or minimum steps? → BFS."
> "Does it ask if something is reachable, how many components, or explore all possibilities? → DFS."

### Step 3 — Build the Graph if Needed (mention it explicitly)
> "First I'll spend $O(V + E)$ to convert the edge list to an adjacency list. Then I can traverse efficiently."

### Step 4 — State the Visited Tracking Strategy
> "I'll use a boolean array since nodes are labeled 0 to n-1. I'll mark visited before enqueuing (for BFS) to prevent duplicates."

### Step 5 — Code the Template, Then Customize
Start with the BFS/DFS template and adapt the inner loop to the specific problem logic.

### Step 6 — Test Edge Cases Out Loud
- Disconnected graph (some nodes unreachable)
- Graph with one node and no edges
- Graph with a single cycle
- Grid where the entire grid is one component
- `endWord` not in the word list

---

## 8. 7-Day Practice Plan (21 Problems)

**Day 1: Graph Representation & Basics**
1. Find if Path Exists in Graph (LC 1971) — *Build adj list + simple BFS/DFS*
2. Find Center of Star Graph (LC 1791) — *Observation: center appears in every edge*
3. Clone Graph (LC 133) — *DFS + HashMap to handle cycles*

> **Day 1 Focus:** For LC 1971, do it twice — once with BFS, once with DFS. Make sure you understand why both give the correct answer.

**Day 2: 2D Grid Graphs (Implicit Graphs)**
4. Number of Islands (LC 200) — *The foundation grid problem*
5. Flood Fill (LC 733) — *Simpler version of DFS on a grid*
6. Max Area of Island (LC 695) — *Same as 200 but track size during DFS*

> **Day 2 Focus:** After solving LC 200 with grid mutation, solve it again with a separate `boolean[][] visited` array. Know both approaches for interviews.

**Day 3: Intermediate Grid Algorithms**
7. Surrounded Regions (LC 130) — *DFS from the BORDERS first — reverse thinking!*
8. Count Sub Islands (LC 1905) — *DFS on two grids simultaneously*
9. Pacific Atlantic Water Flow (LC 417) — *Reverse BFS from both oceans*

> **Day 3 Focus:** LC 130 is a mindset problem. Instead of finding enclosed regions directly, find what's NOT enclosed (cells reachable from the border) and flip everything else. Practice reverse/inverted thinking.

**Day 4: Shortest Paths in Grids (BFS)**
10. Rotting Oranges (LC 994) — *Multi-source BFS*
11. 01 Matrix (LC 542) — *Multi-source BFS from all 0s simultaneously*
12. Shortest Path in Binary Matrix (LC 1091) — *BFS with 8-directional movement*

> **Day 4 Focus:** Notice that LC 994 and LC 542 use the exact same multi-source BFS pattern. After solving one, solve the other in under 10 minutes.

**Day 5: Connected Components & State Management**
13. Number of Connected Components in an Undirected Graph (LC 323) — *Loop + DFS*
14. Keys and Rooms (LC 841) — *Reachability with a twist (keys unlock new nodes)*
15. Number of Provinces (LC 547) — *Adjacency matrix input, same connected-component pattern*

> **Day 5 Focus:** LC 547 gives an adjacency matrix instead of an edge list. Practice reading from `isConnected[i][j]` directly in DFS without converting to adjacency list.

**Day 6: Advanced BFS & Puzzles**
16. Word Ladder (LC 127) — *BFS on a string transformation graph*
17. Open the Lock (LC 752) — *BFS on a state-space graph (4-digit combo)*
18. Minimum Genetic Mutation (LC 433) — *Same pattern as Word Ladder*

> **Day 6 Focus:** LC 752 models the lock states as graph nodes. Draw out the first few states (0000 → 1000, 9000, 0100, ...) and see how the BFS naturally finds the shortest path.

**Day 7: Bipartite Graphs & Review**
19. Is Graph Bipartite? (LC 785) — *BFS/DFS + alternating color tracking*
20. Possible Bipartition (LC 886) — *Build graph from dislikes, then bipartite check*
21. Snakes and Ladders (LC 909) — *BFS on a board with teleportation*

> **Day 7 Focus:** LC 785 introduces graph coloring. The algorithm: try to color nodes with two colors, alternating at each edge. If two adjacent nodes get the same color, not bipartite. This pattern recurs in many graph theory problems.

---

## 9. Mock Interview Module

### Problem: The Social Network "2nd Degree" Suggestion

**Context:** You're building a "People You May Know" feature. Given `n` users (IDs 0 to n-1) and a list of mutual `friendships`, suggest all users exactly 2 degrees away from a `targetUser` (friends-of-friends who aren't already direct friends, and not the target user themselves).

**Question:** `public List<Integer> getSecondDegreeFriends(int n, int[][] friendships, int targetUser)`

---

#### Step 1: Clarifying Questions

- *Candidate:* "Are friendships mutual (undirected)?" → *Interviewer:* Yes.
- *Candidate:* "If User A and User B share multiple mutual friends, include B only once?" → *Interviewer:* Yes, unique IDs only.
- *Candidate:* "Should the result include users with no 2nd-degree connection?" → *Interviewer:* No, return empty list.
- *Candidate:* "Can friendships contain self-loops (user friends with themselves)?" → *Interviewer:* No.

---

#### Step 2: Formulating the Strategy

*Candidate's thought process out loud:*
1. "The input is an edge list. I need to build an adjacency list first."
2. "I need nodes at exactly distance 2. BFS naturally processes by level → this is a BFS problem."
3. "Level 0: targetUser. Level 1: direct friends. Level 2: the answers I want."
4. "The `visited` set handles both cycle prevention AND ensures we don't include direct friends in the Level 2 result."

---

#### Step 3: Optimized Solution (BFS)

```java
public List<Integer> getSecondDegreeFriends(int n, int[][] friendships, int targetUser) {
    // Step 1: Build adjacency list
    Map<Integer, List<Integer>> adj = new HashMap<>();
    for (int i = 0; i < n; i++) adj.put(i, new ArrayList<>());

    for (int[] edge : friendships) {
        adj.get(edge[0]).add(edge[1]);
        adj.get(edge[1]).add(edge[0]);
    }

    // Step 2: BFS from targetUser, stop at level 2
    Queue<Integer> queue = new ArrayDeque<>();
    boolean[] visited = new boolean[n];

    queue.offer(targetUser);
    visited[targetUser] = true;

    int degree = 0;

    while (!queue.isEmpty()) {
        int levelSize = queue.size();

        if (degree == 2) {
            // Collect all nodes at this level — they are the 2nd degree friends
            List<Integer> result = new ArrayList<>();
            while (!queue.isEmpty()) result.add(queue.poll());
            return result;
        }

        // Process current level, discover next level
        for (int i = 0; i < levelSize; i++) {
            int curr = queue.poll();
            for (int neighbor : adj.get(curr)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }

        degree++;
    }

    return new ArrayList<>();  // No 2nd degree friends found
}
```

**Walk through this aloud:**
> "I build the adjacency list in O(V + E). Then I BFS from the target. The visited array ensures I don't visit any node twice — this also means that when I reach Level 2, the nodes there are friends-of-friends who are definitively NOT already direct friends (they would have been visited at Level 1 and thus excluded)."

**Complexity:** Time $O(V + E)$, Space $O(V + E)$ for the adjacency list.

---

#### Step 4: Follow-up Questions

**Follow-up 1 (Scale — Bidirectional BFS):**
*Interviewer:* "Now find the degree of separation between ANY two users. The platform has 2 billion users."

*Expected thought process:*
- Standard BFS from User A expands like a sphere. With branching factor ~150 (average Facebook friends), depth-3 search visits $150^3 = 3.375$ million nodes. Depth-6 visits trillions.
- **Bidirectional BFS:** Run BFS simultaneously from both A and B. When the frontiers meet, you've found the shortest path. Search space shrinks from $O(B^d)$ to $O(B^(d/2))$. At depth 6, that's $150^3$ vs $150^6$ — **3 million vs 11 trillion** operations.
- Implementation: maintain two `visited` maps (`visitedFromA`, `visitedFromB`). At each step, expand the smaller frontier. When a node appears in both maps, add the two distances together.

**Follow-up 2 (Personalization — Weighted Suggestions):**
*Interviewer:* "Instead of just returning 2nd-degree friends, rank them by number of mutual friends."

*Expected thought process:*
- "I need to count, for each 2nd-degree friend, how many mutual friends they share with the target."
- Instead of BFS (which just finds reachability), I'd count: for each direct friend F of target, iterate through F's friends. For each friend-of-F who isn't the target or a direct friend, increment a counter.
- Use `Map<Integer, Integer> mutualCount = new HashMap<>()` → increment for each path.
- Sort by count descending. Time: $O(D^2)$ where $D$ = average degree.

**Follow-up 3 (Distributed — Partitioned Graph):**
*Interviewer:* "The friendship graph doesn't fit on one machine. How do you partition it?"

*Expected thought process:*
- **Graph partitioning:** Assign users to servers by their ID (e.g., `userId % numServers`). Users 0–99M on Server 1, 100M–199M on Server 2, etc.
- When BFS needs to traverse an edge to a user on another server: send a **remote message** (RPC call) to that server. The receiving server continues the BFS locally.
- Use **async message passing** (Apache Kafka or similar) to avoid blocking on cross-server calls.
- Track global `visited` in a shared distributed cache (Redis Cluster) to prevent revisiting across servers.
- This is how systems like LinkedIn's "Degree of Connection" and Facebook's "People You May Know" work at scale.

---

## 10. Connecting to Other Weeks

Graphs build on everything you've learned and enable everything coming next:

```
Week 4 (HashMap) + Week 7 (Graphs):
  → Adjacency list = Map<Node, List<Node>>
  → Visited set = HashSet<Node>
  → Node cloning = Map<Original, Clone>

Week 5 (Stack/Queue) + Week 7 (Graphs):
  → DFS = Stack (explicit) or recursion (implicit call stack)
  → BFS = Queue — graphs are where stacks and queues "find their purpose"

Week 7 (Graph Foundations) → Week 8 (Advanced Graphs):
  → Cycle detection (DFS + in-stack tracking)
  → Topological sort (DFS or Kahn's BFS-based algorithm)
  → Union-Find for connected components

Week 7 → Week 9+ (Weighted Graphs):
  → Dijkstra's algorithm (BFS + priority queue for weighted shortest path)
  → Minimum Spanning Tree (Kruskal's, Prim's)
  → Bellman-Ford (negative weight cycles)
```

**The insight to carry forward:** Once you can confidently model a problem as a graph and choose BFS or DFS, you've unlocked a huge class of problems. Advanced graph algorithms (Dijkstra, topological sort, Union-Find) are just specializations of the core traversal patterns you learned this week.

---

## 11. Quick Reference Cheat Sheet

```
╔══════════════════════════════════════════════════════════════╗
║              GRAPH FOUNDATIONS CHEAT SHEET                  ║
╠══════════════════════════════════════════════════════════════╣
║ REPRESENTATION                                               ║
║  Always use Adjacency List: O(V+E) space                    ║
║  Build from edge list FIRST before traversing               ║
║  Undirected: add both adj.get(u).add(v) and v→u             ║
╠══════════════════════════════════════════════════════════════╣
║ THE GOLDEN RULE                                              ║
║  Always track visited to prevent infinite loops             ║
║  Mark visited BEFORE enqueuing (BFS) or recursing (DFS)     ║
╠══════════════════════════════════════════════════════════════╣
║ BFS vs DFS                                                   ║
║  Shortest path / min steps → BFS (level-by-level)           ║
║  Reachability / components / all paths → DFS                ║
║  Multi-source (all origins simultaneously) → BFS all first  ║
╠══════════════════════════════════════════════════════════════╣
║ 4-DIRECTION GRID TEMPLATE                                    ║
║  int[] dr = {-1,1,0,0}, dc = {0,0,-1,1};                   ║
║  Check: r>=0 && r<rows && c>=0 && c<cols                    ║
╠══════════════════════════════════════════════════════════════╣
║ BFS TEMPLATE                                                 ║
║  visited[start]=true; queue.offer(start);                   ║
║  while(!queue.isEmpty()) {                                   ║
║    int size=queue.size();                                    ║
║    for(i<size) { poll; process; add neighbors; }            ║
║    level++;                                                  ║
║  }                                                           ║
╠══════════════════════════════════════════════════════════════╣
║ COMPLEXITY                                                   ║
║  BFS + DFS: Time O(V+E), Space O(V)                        ║
║  Build adj list: O(V+E)                                     ║
║  Grid: V = M×N, E = 2×M×N edges                            ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 12. What's Coming Next

**Week 8: Advanced Graphs** — building directly on this week:
- **Cycle Detection:** DFS with an "in-progress" set (3-color marking: white/gray/black). Essential for detecting deadlocks and circular dependencies.
- **Topological Sort:** Kahn's algorithm (BFS + in-degree counting) and DFS-based sort. Powers course scheduling, build systems, and task pipelines.
- **Union-Find (Disjoint Set Union):** An alternative to BFS/DFS for connected-component queries. Handles dynamic edge additions in near-$O(1)$ per query.

**Week 9+: Weighted Graphs:**
- **Dijkstra's Algorithm:** BFS + `PriorityQueue` → shortest path in weighted graphs. The engine behind every GPS and network routing protocol.
- **Minimum Spanning Tree:** Connecting all nodes at minimum total edge cost (Kruskal's, Prim's).

The pattern to internalize: **every advanced graph algorithm is a variation of BFS or DFS with extra tracking.** Dijkstra = BFS + priority queue. Topological sort = DFS + completion stack. Union-Find = path-compressed tree. Master the fundamentals this week and the advanced techniques become incremental additions.