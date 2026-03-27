---
id: dfs
title: DFS (Depth-First Search)
sidebar_position: 10
description: Recursive and iterative DFS for trees, graphs, and grid problems
---

# 🕳️ DFS (Depth-First Search)

## Concept

**DFS** explores as far as possible along each branch before backtracking. It uses a **stack** (either the call stack via recursion, or an explicit stack).

DFS is the backbone of backtracking, cycle detection, connected component finding, and topological sort.

---

## When to Use

- Explore **all paths** or **all possibilities** (exhaustive search)
- Connected components in a graph or grid
- **Cycle detection** in directed/undirected graphs
- **Topological sort** (process nodes after dependencies)
- Tree traversals (preorder, inorder, postorder)
- Problems asking "does a path exist" or "count paths"

---

## DFS vs BFS

| | DFS | BFS |
|---|---|---|
| Data structure | Stack (call stack / explicit) | Queue |
| Shortest path | ❌ (not guaranteed) | ✅ (unweighted graphs) |
| Memory for deep trees | ❌ (stack overflow risk) | ✅ |
| Memory for wide graphs | ✅ | ❌ |
| Find any path | ✅ fast | slower |
| Explore ALL paths | ✅ natural | complex |

---

## Java Template

### Recursive DFS on Grid
```java
int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

void dfs(int[][] grid, boolean[][] visited, int r, int c) {
    // Base cases
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (visited[r][c] || grid[r][c] == 0) return;

    visited[r][c] = true; // mark before recursing

    for (int[] dir : dirs) {
        dfs(grid, visited, r + dir[0], c + dir[1]);
    }
}
```

### DFS with Backtracking on Graph
```java
void dfs(int node, Set<Integer> visited, Map<Integer, List<Integer>> graph) {
    visited.add(node);

    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) {
            dfs(neighbor, visited, graph);
        }
    }
}
```

---

## Worked Example 1: Number of Islands

```java
public int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                dfs(grid, i, j);
                count++;
            }
        }
    }
    return count;
}

private void dfs(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length
        || grid[r][c] != '1') return;

    grid[r][c] = '0'; // mark as visited by "sinking" the island

    dfs(grid, r+1, c);
    dfs(grid, r-1, c);
    dfs(grid, r, c+1);
    dfs(grid, r, c-1);
}
```

---

## Worked Example 2: Detect Cycle in Directed Graph (Topological Sort via DFS)

```java
// WHITE=0 (unvisited), GRAY=1 (in current path), BLACK=2 (fully processed)
public boolean hasCycle(int n, int[][] edges) {
    Map<Integer, List<Integer>> graph = new HashMap<>();
    for (int[] e : edges) graph.computeIfAbsent(e[0], k -> new ArrayList<>()).add(e[1]);

    int[] color = new int[n];
    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && dfs(graph, color, i)) return true;
    }
    return false;
}

boolean dfs(Map<Integer, List<Integer>> graph, int[] color, int node) {
    color[node] = 1; // GRAY — in current path

    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (color[neighbor] == 1) return true;  // back edge → cycle
        if (color[neighbor] == 0 && dfs(graph, color, neighbor)) return true;
    }

    color[node] = 2; // BLACK — fully done
    return false;
}
```

---

## Worked Example 3: Pacific Atlantic Water Flow

```java
public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    boolean[][] pacific = new boolean[m][n];
    boolean[][] atlantic = new boolean[m][n];

    // DFS from all edges inward (water flows from low to high in reverse)
    for (int i = 0; i < m; i++) {
        dfs(heights, pacific, i, 0);
        dfs(heights, atlantic, i, n - 1);
    }
    for (int j = 0; j < n; j++) {
        dfs(heights, pacific, 0, j);
        dfs(heights, atlantic, m - 1, j);
    }

    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (pacific[i][j] && atlantic[i][j])
                result.add(Arrays.asList(i, j));
    return result;
}

int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

void dfs(int[][] h, boolean[][] visited, int r, int c) {
    visited[r][c] = true;
    for (int[] d : dirs) {
        int nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < h.length && nc >= 0 && nc < h[0].length
            && !visited[nr][nc] && h[nr][nc] >= h[r][c]) {
            dfs(h, visited, nr, nc);
        }
    }
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Idea |
|---|---|---|
| 104 | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Tree DFS |
| 112 | [Path Sum](https://leetcode.com/problems/path-sum/) | Tree DFS |
| 733 | [Flood Fill](https://leetcode.com/problems/flood-fill/) | Grid DFS |

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 200 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Grid DFS |
| 207 | [Course Schedule](https://leetcode.com/problems/course-schedule/) | Cycle detection |
| 210 | [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | Topo sort |
| 417 | [Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/) | Reverse DFS |
| 547 | [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) | Connected components |
| 695 | [Max Area of Island](https://leetcode.com/problems/max-area-of-island/) | Grid DFS + area |
| 1020 | [Number of Enclaves](https://leetcode.com/problems/number-of-enclaves/) | Border DFS |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 329 | [Longest Increasing Path in Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | DFS + memoization |
| 827 | [Making A Large Island](https://leetcode.com/problems/making-a-large-island/) | Island labeling + merge |
