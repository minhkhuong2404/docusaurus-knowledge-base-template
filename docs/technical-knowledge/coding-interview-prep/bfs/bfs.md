---
id: bfs
title: BFS (Breadth-First Search)
sidebar_position: 9
description: Level-order traversal, shortest path in unweighted graphs, and multi-source BFS
---

# 🌊 BFS (Breadth-First Search)

## Concept

**BFS** explores all neighbors at the current depth before going deeper. It uses a **queue** (FIFO) and guarantees the **shortest path** in an unweighted graph.

Think of it as spreading waves from a starting point — each "wave" explores one level further.

---

## When to Use

- Find the **shortest path** in an unweighted graph or grid
- **Level-order** traversal of a tree
- Explore all nodes at **distance k**
- **Multi-source BFS**: start from multiple nodes simultaneously
- Word ladder / transformation problems
- "Minimum steps to reach target" on a grid

---

## Java Template

```java
// Graph BFS
public int bfs(int start, int target, Map<Integer, List<Integer>> graph) {
    Queue<Integer> queue = new LinkedList<>();
    Set<Integer> visited = new HashSet<>();

    queue.offer(start);
    visited.add(start);
    int steps = 0;

    while (!queue.isEmpty()) {
        int size = queue.size(); // process entire level
        for (int i = 0; i < size; i++) {
            int curr = queue.poll();
            if (curr == target) return steps;

            for (int neighbor : graph.get(curr)) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
        steps++;
    }
    return -1; // not reachable
}

// Grid BFS
int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

public int bfsGrid(int[][] grid, int startR, int startC) {
    int m = grid.length, n = grid[0].length;
    boolean[][] visited = new boolean[m][n];
    Queue<int[]> queue = new LinkedList<>();

    queue.offer(new int[]{startR, startC});
    visited[startR][startC] = true;
    int steps = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int[] pos = queue.poll();
            // Process pos...

            for (int[] dir : dirs) {
                int r = pos[0] + dir[0], c = pos[1] + dir[1];
                if (r >= 0 && r < m && c >= 0 && c < n && !visited[r][c]) {
                    visited[r][c] = true;
                    queue.offer(new int[]{r, c});
                }
            }
        }
        steps++;
    }
    return steps;
}
```

---

## Worked Example: 01 Matrix (Multi-Source BFS)

**Problem**: For each cell, find its distance to the nearest `0`.

**Key Insight**: Start BFS from ALL `0` cells simultaneously instead of running BFS from each cell individually.

```java
public int[][] updateMatrix(int[][] mat) {
    int m = mat.length, n = mat[0].length;
    int[][] dist = new int[m][n];
    Queue<int[]> queue = new LinkedList<>();
    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

    // Multi-source: add all 0-cells to queue, mark 1-cells as unvisited (MAX)
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (mat[i][j] == 0) {
                queue.offer(new int[]{i, j});
            } else {
                dist[i][j] = Integer.MAX_VALUE;
            }
        }
    }

    // BFS outward from all sources
    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        for (int[] dir : dirs) {
            int r = cell[0] + dir[0], c = cell[1] + dir[1];
            if (r >= 0 && r < m && c >= 0 && c < n
                && dist[r][c] > dist[cell[0]][cell[1]] + 1) {
                dist[r][c] = dist[cell[0]][cell[1]] + 1;
                queue.offer(new int[]{r, c});
            }
        }
    }
    return dist;
}
```

**Time**: O(m × n) | **Space**: O(m × n)

---

## Worked Example 2: Word Ladder

```java
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> wordSet = new HashSet<>(wordList);
    if (!wordSet.contains(endWord)) return 0;

    Queue<String> queue = new LinkedList<>();
    queue.offer(beginWord);
    Set<String> visited = new HashSet<>();
    visited.add(beginWord);
    int steps = 1;

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            String curr = queue.poll();
            char[] chars = curr.toCharArray();

            for (int j = 0; j < chars.length; j++) {
                char original = chars[j];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;
                    chars[j] = c;
                    String next = new String(chars);
                    if (next.equals(endWord)) return steps + 1;
                    if (wordSet.contains(next) && !visited.contains(next)) {
                        visited.add(next);
                        queue.offer(next);
                    }
                }
                chars[j] = original;
            }
        }
        steps++;
    }
    return 0;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Idea |
|---|---|---|
| 111 | [Minimum Depth of Binary Tree](https://leetcode.com/problems/minimum-depth-of-binary-tree/) | BFS — first leaf |
| 226 | [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) | BFS swap |
| 637 | [Average of Levels in Binary Tree](https://leetcode.com/problems/average-of-levels-in-binary-tree/) | Level BFS |

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 102 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | Classic BFS |
| 127 | [Word Ladder](https://leetcode.com/problems/word-ladder/) | BFS on word graph |
| 200 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Grid BFS/DFS |
| 286 | [Walls and Gates](https://leetcode.com/problems/walls-and-gates/) | Multi-source |
| 542 | [01 Matrix](https://leetcode.com/problems/01-matrix/) | Multi-source |
| 752 | [Open the Lock](https://leetcode.com/problems/open-the-lock/) | State BFS |
| 994 | [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) | Multi-source |
| 1162 | [As Far from Land as Possible](https://leetcode.com/problems/as-far-from-land-as-possible/) | Multi-source |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 126 | [Word Ladder II](https://leetcode.com/problems/word-ladder-ii/) | BFS + backtrack all paths |
| 317 | [Shortest Distance from All Buildings](https://leetcode.com/problems/shortest-distance-from-all-buildings/) | Multi-source + sum |
| 847 | [Shortest Path Visiting All Nodes](https://leetcode.com/problems/shortest-path-visiting-all-nodes/) | BFS + bitmask state |
