---
id: graph
title: Graph
sidebar_position: 11
description: Graph representation, topological sort, shortest paths, and advanced algorithms
---

# 🕸️ Graph

## Concept

A **Graph** is a collection of **nodes** (vertices) connected by **edges**. Unlike trees, graphs can have cycles and multiple paths between nodes.

**Types**:
- **Directed** (edges have direction) vs **Undirected**
- **Weighted** (edges have cost) vs **Unweighted**
- **Cyclic** vs **DAG** (Directed Acyclic Graph)

---

## Graph Representation in Java

```java
// 1. Adjacency List (most common for sparse graphs)
Map<Integer, List<Integer>> graph = new HashMap<>();
graph.computeIfAbsent(u, k -> new ArrayList<>()).add(v);
graph.computeIfAbsent(v, k -> new ArrayList<>()).add(u); // undirected

// 2. Adjacency Matrix (for dense graphs or when quick edge lookup needed)
int[][] matrix = new int[n][n];
matrix[u][v] = 1; // or weight

// 3. Edge List (for algorithms like Kruskal)
int[][] edges = {{0,1,5}, {1,2,3}}; // [from, to, weight]
```

---

## Topological Sort

Used on **DAGs** to order nodes so all dependencies come first.

### Kahn's Algorithm (BFS-based)
```java
public int[] topoSort(int n, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[n];

    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    int[] order = new int[n];
    int idx = 0;
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order[idx++] = node;
        for (int next : adj.get(node)) {
            if (--inDegree[next] == 0) queue.offer(next);
        }
    }

    return idx == n ? order : new int[0]; // empty if cycle
}
```

---

## Shortest Path: Dijkstra (Weighted Graph)

```java
public int[] dijkstra(int n, int[][] edges, int src) {
    // Build adjacency list: [neighbor, weight]
    Map<Integer, List<int[]>> graph = new HashMap<>();
    for (int i = 0; i < n; i++) graph.put(i, new ArrayList<>());
    for (int[] e : edges) {
        graph.get(e[0]).add(new int[]{e[1], e[2]});
        graph.get(e[1]).add(new int[]{e[0], e[2]}); // undirected
    }

    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // Min-heap: [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], node = curr[1];

        if (d > dist[node]) continue; // stale entry

        for (int[] neighbor : graph.get(node)) {
            int newDist = dist[node] + neighbor[1];
            if (newDist < dist[neighbor[0]]) {
                dist[neighbor[0]] = newDist;
                pq.offer(new int[]{newDist, neighbor[0]});
            }
        }
    }
    return dist;
}
```

**Time**: O((V + E) log V) | **Space**: O(V + E)

---

## Worked Example: Clone Graph

```java
public Node cloneGraph(Node node) {
    if (node == null) return null;
    Map<Node, Node> visited = new HashMap<>();
    return dfs(node, visited);
}

private Node dfs(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) return visited.get(node);

    Node clone = new Node(node.val);
    visited.put(node, clone);

    for (Node neighbor : node.neighbors) {
        clone.neighbors.add(dfs(neighbor, visited));
    }
    return clone;
}
```

---

## Worked Example 2: Find Eventual Safe States (Cycle Detection)

```java
// A node is "safe" if every path from it eventually reaches a terminal node
public List<Integer> eventualSafeNodes(int[][] graph) {
    int n = graph.length;
    int[] state = new int[n]; // 0=unknown, 1=unsafe(in cycle), 2=safe

    List<Integer> result = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        if (dfs(graph, state, i) == 2) result.add(i);
    }
    return result;
}

private int dfs(int[][] graph, int[] state, int node) {
    if (state[node] != 0) return state[node];

    state[node] = 1; // mark as "in progress" (potentially unsafe)
    for (int next : graph[node]) {
        if (dfs(graph, state, next) == 1) return 1; // found cycle
    }
    state[node] = 2; // all paths are safe
    return 2;
}
```

---

## LeetCode Problems

### 🟡 Medium
| # | Problem | Algorithm |
|---|---|---|
| 133 | [Clone Graph](https://leetcode.com/problems/clone-graph/) | DFS + HashMap |
| 207 | [Course Schedule](https://leetcode.com/problems/course-schedule/) | Topo / cycle detect |
| 210 | [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | Kahn's topo sort |
| 310 | [Minimum Height Trees](https://leetcode.com/problems/minimum-height-trees/) | Trim leaves (topo) |
| 323 | [Number of Connected Components](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) | DFS / Union-Find |
| 684 | [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | Union-Find |
| 743 | [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | Dijkstra |
| 802 | [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/) | Color DFS |

### 🔴 Hard
| # | Problem | Algorithm |
|---|---|---|
| 269 | [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) | Topo sort |
| 332 | [Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/) | Hierholzer's Euler path |
| 787 | [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | Bellman-Ford / BFS |
| 1192 | [Critical Connections in a Network](https://leetcode.com/problems/critical-connections-in-a-network/) | Tarjan's bridges |
