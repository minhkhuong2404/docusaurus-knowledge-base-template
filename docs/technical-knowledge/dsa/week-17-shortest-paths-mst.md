---
id: week-17-shortest-paths-mst
title: "Week 17: Shortest Paths & MST"
description: Begin Phase 5 by conquering weighted graphs. Master Dijkstra's Algorithm for finding the shortest path and Prim's Algorithm for building Minimum Spanning Trees in Java.
tags: [dsa, java, graphs, dijkstra, mst, algorithms, week-17]
sidebar_position: 17
---

import DsaWeek17ShortestPathMstDiagram from '@site/src/components/DsaWeek17ShortestPathMstDiagram';

# Week 17: Shortest Paths & MST

## 1. Overview

Welcome to Week 17 and the beginning of the final phase: **Phase 5 (Advanced Techniques + Review)**!

Back in Week 7, we found the shortest path through grids and networks using BFS. However, standard BFS only works when every edge costs exactly `1`. In the real world, edges have varying costs — network latency between servers is not identical, and toll roads cost different amounts.

This week introduces **Weighted Graphs**. You will master two of the most famous algorithms in computer science: **Dijkstra's Algorithm** (fastest route from A to B) and **Prim's Algorithm** (cheapest way to connect everything together in a Minimum Spanning Tree).

**Goals for this week:**
- Understand the structure of Weighted Adjacency Lists.
- Master Dijkstra's Algorithm using Java's `PriorityQueue`.
- Differentiate between a Shortest Path and a Minimum Spanning Tree (MST).
- Master Prim's Algorithm and understand why it shares the same Priority Queue structure as Dijkstra.

### Knowledge You Need Before Starting

- Graph traversal and representation fundamentals from Weeks 7-8.
- Heap/PriorityQueue proficiency from Week 12.
- Confidence with greedy decision logic and proof sketches.
- Ability to reason about path cost vs. total network connection cost.

---

## 2. Theory & Fundamentals

<DsaWeek17ShortestPathMstDiagram />


### 2.1 Mental Model: Why BFS Breaks on Weighted Graphs

BFS finds the shortest path by treating every edge as having cost 1. It works perfectly on unweighted graphs because expanding level-by-level guarantees the minimum number of hops.

The moment edges have different weights, BFS's level-by-level guarantee breaks:

```
Graph:
    A ---1--- B ---1--- D
    |                   |
    +--------10----------+

BFS from A to D:
  Level 1: visit B (via cost 1), visit D (via cost 10) <- BFS says "found D!"
  BFS returns path A -> D with cost 10
  WRONG: optimal path is A -> B -> D with cost 1 + 1 = 2

BFS counts HOPS, not COST. It found D in fewer hops (1 hop directly)
but that path is 5x more expensive.

Fix: Use a Priority Queue (Min-Heap) ordered by accumulated COST,
not a regular FIFO Queue ordered by hops.
-> This is exactly Dijkstra's Algorithm.
```

---

### 2.2 Weighted Adjacency List: The Data Structure

In an unweighted graph, an adjacency list stores `List<Integer>` for each node (just neighbor IDs). In a weighted graph, you need to store both the neighbor ID and the edge weight.

**Java representation options:**

```java
// Option 1: int[] pair — [neighborId, weight]
List<List<int[]>> adj = new ArrayList<>();
adj.get(u).add(new int[]{v, weight}); // adj.get(u).get(i)[0] = neighbor, [1] = weight

// Option 2: Custom Edge class — cleaner, self-documenting
class Edge {
    int to, weight;
    Edge(int to, int weight) { this.to = to; this.weight = weight; }
}
List<List<Edge>> adj = new ArrayList<>();
adj.get(u).add(new Edge(v, weight));
```

**Building from an edge list (standard LeetCode format):**
```java
// Input: int[][] edges where edges[i] = [u, v, weight]
int n = numNodes;
List<List<int[]>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

for (int[] edge : edges) {
    int u = edge[0], v = edge[1], w = edge[2];
    adj.get(u).add(new int[]{v, w});        // directed: u -> v
    adj.get(v).add(new int[]{u, w});        // undirected: also v -> u
}
```

---

### 2.3 Dijkstra's Algorithm: The Greedy Priority Queue BFS

**The core idea:** Always expand the currently cheapest known node. The moment a node is popped from the min-heap, its shortest path is finalized.

**Step-by-step on a concrete example:**

```
Graph (directed, weights shown):
  0 --2--> 1 --3--> 3
  0 --6--> 2 --1--> 3

Start: node 0. Find shortest path to all nodes.

Initial:  dist=[0, INF, INF, INF], heap=[(cost=0, node=0)]

Step 1: Poll (0, node=0) — lock in: dist[0]=0
  Neighbors: 1 via cost 2, 2 via cost 6
  Update dist[1]=2, dist[2]=6
  heap=[(2, node=1), (6, node=2)]

Step 2: Poll (2, node=1) — lock in: dist[1]=2
  Neighbors: 3 via cost 3
  newCost = 2+3 = 5 < INF -> update dist[3]=5
  heap=[(5, node=3), (6, node=2)]

Step 3: Poll (5, node=3) — lock in: dist[3]=5
  No neighbors
  heap=[(6, node=2)]

Step 4: Poll (6, node=2) — lock in: dist[2]=6
  Neighbors: 3 via cost 1
  newCost = 6+1=7 > dist[3]=5 -> NO UPDATE (already better)
  heap=[]

Final: dist=[0, 2, 6, 5]
Path 0->3: via 0->1->3 (cost 5), NOT 0->2->3 (cost 7) ✅
```

**The "Stale State" problem — why the `continue` check is critical:**

When we update `dist[node]` and push a new entry to the heap, the old entry (with higher cost) remains in the heap. We must skip it when we pop it later:

```
After update: heap might contain both:
  (old: cost=8, node=3) <- stale, dist[3] was later updated to 5
  (new: cost=5, node=3) <- current best

When we pop (cost=8, node=3): curr.cost(8) > dist[3](5) -> skip (stale!)
When we pop (cost=5, node=3): curr.cost(5) == dist[3](5) -> process normally
```

**Why negative weights break Dijkstra:**

```
Graph: 0 --2--> 1 --(-5)--> 2
              0 ---1-----> 2

Dijkstra processes:
  Lock in node 2 via 0->2 (cost 1) <- "found optimal path!"
  Later finds 0->1->2 (cost 2+(-5) = -3) <- cheaper but 2 already locked in!

Dijkstra's guarantee "popped = optimal" breaks with negative weights.
Use Bellman-Ford instead.
```

---

### 2.4 Dijkstra vs. BFS vs. Bellman-Ford: Choosing the Right Algorithm

|                 | BFS                       | Dijkstra                   | Bellman-Ford                           |
| --------------- | ------------------------- | -------------------------- | -------------------------------------- |
| Edge weights    | All equal (or unweighted) | Non-negative               | Any (including negative)               |
| Negative cycles | N/A                       | N/A                        | Detects them                           |
| Time complexity | $O(V + E)$                | $O((V+E) \log V)$          | $O(V \times E)$                        |
| Data structure  | FIFO Queue                | Min-Heap (PriorityQueue)   | None (nested loops)                    |
| Use when        | Grid traversal, hops      | Road maps, network routing | Currency exchange, arbitrage detection |

**Quick decision rule:**
1. Unweighted or all-equal weights → **BFS**
2. Non-negative weights → **Dijkstra**
3. Negative weights possible → **Bellman-Ford**
4. All-pairs shortest paths → **Floyd-Warshall** ($O(V^3)$)

---

### 2.5 Minimum Spanning Tree: A Different Problem

The Shortest Path and the MST solve **completely different questions**, even though both use Priority Queues:

```
Network of 4 cities: A, B, C, D
Edges: A-B(1), A-C(4), B-C(2), B-D(6), C-D(3)

Shortest path from A to D:
  A -> B -> C -> D = 1 + 2 + 3 = 6
  (Best route for a single packet from A to D)

MST (minimum cost to connect ALL cities):
  A-B(1) + B-C(2) + C-D(3) = 6 total weight
  This tree connects A, B, C, D with minimum wire/cable cost
  (Not optimizing A-to-D specifically, optimizing total infrastructure cost)

KEY DIFFERENCE:
  Shortest Path: cheapest route between two specific points
  MST: cheapest way to connect every single point to the network
```

**Real-world MST applications:**
- Network cabling: connect all servers with minimum fiber
- Power grid: connect all homes with minimum wire
- Clustering: group data points (minimum spanning tree → cut edges = clusters)
- Approximation algorithms: TSP approximation uses MST as a lower bound

---

### 2.6 Prim's Algorithm: MST via Greedy Expansion

**Core idea:** Grow the MST one node at a time. Always add the cheapest edge that connects a new (unvisited) node to the current tree.

**The crucial distinction from Dijkstra:**

|                     | Dijkstra                               | Prim's                                         |
| ------------------- | -------------------------------------- | ---------------------------------------------- |
| Heap ordering       | Total accumulated cost from start      | Single edge weight                             |
| Goal                | Shortest path from source to all nodes | Minimum total edge weight to connect all nodes |
| `dist` array tracks | Best known total distance to node      | Not needed — just `visited[]`                  |
| `visited` check     | Stale state (`curr.cost > dist[node]`) | Already in MST (`visited[node]`)               |

**Step-by-step trace:**

```
Graph: 0--(4)--1--(8)--2
       |       |       |
      (8)     (2)     (7)
       |       |       |
       3--(9)--4--(10)-5

Prim's from node 0:
Initial: visited=[], heap=[(cost=0, node=0)]

Pop (0, node=0): add to MST, visited[0]=true, totalCost+=0
  Add edges: (4, node=1), (8, node=3)
  heap=[(4,1), (8,3)]

Pop (4, node=1): add to MST, visited[1]=true, totalCost+=4
  Add edges: (8,2), (2,4)
  heap=[(2,4), (8,2), (8,3)]

Pop (2, node=4): add to MST, visited[4]=true, totalCost+=2
  Add edges: (9,3), (10,5)
  heap=[(8,2), (8,3), (9,3), (10,5)]

Pop (8, node=2): add to MST, totalCost+=8
  Add edge: (7,5)
  heap=[(7,5), (8,3), (9,3), (10,5)]

Pop (7, node=5): add to MST, totalCost+=7
  heap=[(8,3), (9,3), (10,5)]

Pop (8, node=3): add to MST, totalCost+=8
  heap=[(9,3 <stale: already visited>), (10,5 <stale>)]
  
Pop (9, node=3): visited[3]=true, skip
Pop (10, node=5): visited[5]=true, skip

Final MST cost: 0+4+2+8+7+8 = 29
```

---

### 2.7 Kruskal's Algorithm: The Other MST Approach

Prim's grows the MST from one seed node. **Kruskal's** sorts all edges and greedily adds the cheapest edge that doesn't create a cycle (using Union-Find to detect cycles).

|                 | Prim's                         | Kruskal's                     |
| --------------- | ------------------------------ | ----------------------------- |
| Approach        | Grow from one node             | Sort all edges, add greedily  |
| Data structure  | Min-Heap + visited[]           | Sorted edges + Union-Find     |
| Time            | $O(E \log V)$                  | $O(E \log E)$                 |
| Better when     | Dense graphs ($E \approx V^2$) | Sparse graphs ($E \approx V$) |
| Cycle detection | Implicit (visited[])           | Explicit (Union-Find)         |

For most LeetCode problems, Prim's is simpler to implement. Kruskal's is covered in Week 18 (Union-Find).

---

### 2.8 Advanced Dijkstra: State Expansion

Many advanced problems require tracking additional state beyond just the node ID. The key insight: **the "node" in the priority queue can be a composite state**.

```java
// Standard: state = (cost, nodeId)
// Advanced: state = (cost, nodeId, stopsRemaining)  <- LC 787 Cheapest Flights
// Advanced: state = (cost, nodeId, keysBitmask)     <- LC 864 Shortest Path All Keys
// Advanced: state = (maxEffort, row, col)            <- LC 1631 Minimum Effort Path

// The dist[] array must match the state shape:
// Standard:  int[] dist = new int[n];
// With stops: int[][] dist = new int[n][K+1];  (n nodes, K+1 stop counts)
// With keys:  int[][] dist = new int[n][1 << numKeys];
```

**The "stale state" check must account for the full state:**
```java
// Standard stale check:
if (curr.cost > dist[curr.node]) continue;

// With stops:
if (curr.cost >= dist[curr.node][curr.stops]) continue; // >= not > for some variants
```

---

## 3. Code Templates (Java)

### Template 1: Dijkstra's Algorithm (Standard)

```java
public int[] dijkstra(int n, List<List<int[]>> adj, int start) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;

    // Min-Heap: [cost, nodeId]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, start});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int cost = curr[0], node = curr[1];

        // Stale state check — critical for correctness
        if (cost > dist[node]) continue;

        for (int[] neighbor : adj.get(node)) {
            int nextNode = neighbor[0], edgeWeight = neighbor[1];
            int newCost = cost + edgeWeight;

            if (newCost < dist[nextNode]) {
                dist[nextNode] = newCost;
                pq.offer(new int[]{newCost, nextNode});
            }
        }
    }

    return dist; // dist[i] = shortest distance from start to i; MAX_VALUE = unreachable
}
```

### Template 2: Dijkstra with Early Exit (Single Target)

```java
public int dijkstraSingleTarget(int n, List<List<int[]>> adj, int start, int end) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, start});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int cost = curr[0], node = curr[1];

        if (node == end) return cost; // Early exit: optimal path to target found

        if (cost > dist[node]) continue;

        for (int[] neighbor : adj.get(node)) {
            int newCost = cost + neighbor[1];
            if (newCost < dist[neighbor[0]]) {
                dist[neighbor[0]] = newCost;
                pq.offer(new int[]{newCost, neighbor[0]});
            }
        }
    }

    return dist[end] == Integer.MAX_VALUE ? -1 : dist[end];
}
```

### Template 3: Dijkstra on a 2D Grid

```java
private static final int[][] DIRS = {{0,1},{0,-1},{1,0},{-1,0}};

public int dijkstraGrid(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dist = new int[m][n];
    for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
    dist[0][0] = 0;

    // Heap: [cost, row, col]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, 0, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int cost = curr[0], r = curr[1], c = curr[2];

        if (r == m - 1 && c == n - 1) return cost; // reached target

        if (cost > dist[r][c]) continue;

        for (int[] dir : DIRS) {
            int nr = r + dir[0], nc = c + dir[1];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;

            int newCost = cost + grid[nr][nc]; // cost to enter next cell
            if (newCost < dist[nr][nc]) {
                dist[nr][nc] = newCost;
                pq.offer(new int[]{newCost, nr, nc});
            }
        }
    }

    return dist[m-1][n-1];
}
```

### Template 4: Prim's Algorithm (MST)

```java
public int primsMST(int n, List<List<int[]>> adj) {
    boolean[] visited = new boolean[n];
    int totalCost = 0, nodesAdded = 0;

    // Min-Heap: [edgeWeight, nodeId]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, 0}); // start from node 0 with edge cost 0

    while (!pq.isEmpty() && nodesAdded < n) {
        int[] curr = pq.poll();
        int cost = curr[0], node = curr[1];

        if (visited[node]) continue; // already in MST

        visited[node] = true;
        totalCost += cost;
        nodesAdded++;

        for (int[] neighbor : adj.get(node)) {
            if (!visited[neighbor[0]]) {
                pq.offer(new int[]{neighbor[1], neighbor[0]}); // [edgeWeight, neighborId]
            }
        }
    }

    return nodesAdded == n ? totalCost : -1; // -1 if graph is disconnected
}
```

### Template 5: Bellman-Ford (Negative Weights)

```java
public int[] bellmanFord(int n, int[][] edges, int start) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;

    // Relax all edges V-1 times
    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }

    // V-th relaxation: if any dist still updates, a negative cycle exists
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            return null; // negative cycle detected
        }
    }

    return dist;
}
// Time: O(V * E)  Space: O(V)
// Use when: negative edge weights exist, need cycle detection
```

### Template 6: Dijkstra with Extra State (K Stops)

```java
// LC 787: Cheapest flight from src to dst with at most K stops
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] f : flights) adj.get(f[0]).add(new int[]{f[1], f[2]});

    // dist[node][stops] = min cost to reach node using exactly 'stops' stops
    int[][] dist = new int[n][k + 2];
    for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
    dist[src][0] = 0;

    // Heap: [cost, node, stopsUsed]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, src, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int cost = curr[0], node = curr[1], stops = curr[2];

        if (node == dst) return cost;
        if (stops > k) continue; // exceeded allowed stops

        for (int[] neighbor : adj.get(node)) {
            int nextNode = neighbor[0], price = neighbor[1];
            int newCost = cost + price;
            if (newCost < dist[nextNode][stops + 1]) {
                dist[nextNode][stops + 1] = newCost;
                pq.offer(new int[]{newCost, nextNode, stops + 1});
            }
        }
    }

    return -1;
}
```

---

## 4. Problem-Solving Framework

### Step 1 — Identify the Algorithm

| Problem asks                                         | Algorithm                         |
| ---------------------------------------------------- | --------------------------------- |
| Shortest path, non-negative weights                  | **Dijkstra**                      |
| Shortest path, negative weights possible             | **Bellman-Ford**                  |
| Shortest path, all-pairs (every source)              | **Floyd-Warshall**                |
| Connect ALL nodes, minimum total cost                | **Prim's** or **Kruskal's (MST)** |
| Shortest path, grid, all edges weight 1              | **BFS** (faster than Dijkstra)    |
| Shortest path with extra constraints (K stops, keys) | **Dijkstra + composite state**    |

### Step 2 — Dijkstra vs. Prim's: Which Priority Queue Logic?

Draw the distinction clearly:

```
Dijkstra: heap stores (TOTAL cost from source to this node, nodeId)
  -> When I pop a node, I know the globally cheapest path from start to it

Prim's:   heap stores (EDGE cost of the single edge connecting this node, nodeId)
  -> When I pop a node, I add only THAT edge's cost to the MST total
  -> I don't care about accumulated total from a source
```

**Memory aid:** "Dijkstra accumulates. Prim's is fresh each edge."

### Step 3 — Build the Adjacency List Correctly

Always ask: directed or undirected?
- Directed: one-way edge `u -> v`
- Undirected: two-way edges `u -> v` AND `v -> u`

```java
// Undirected — add BOTH directions
adj.get(u).add(new int[]{v, w});
adj.get(v).add(new int[]{u, w}); // <- don't forget this!
```

### Step 4 — Verify the Stale State Check

For Dijkstra:
```java
if (cost > dist[node]) continue; // stale: we already found a better path
```

For Prim's:
```java
if (visited[node]) continue; // already in MST, skip
```

### Step 5 — Handle Disconnected Graphs

Always check if all nodes were reached:
```java
// Dijkstra: check for unreachable nodes
for (int d : dist) if (d == Integer.MAX_VALUE) return -1;

// Prim's: check all nodes were added
return nodesAdded == n ? totalCost : -1;
```

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| Problem signal                                    | Algorithm              | Key detail                               |
| ------------------------------------------------- | ---------------------- | ---------------------------------------- |
| "Shortest time/cost/distance" + weighted edges    | Dijkstra               | Non-negative weights only                |
| "Minimum cost to reach all nodes" / "connect all" | Prim's MST             | Edge weight in heap, not accumulated     |
| "Negative weights" / "can gain fuel/money"        | Bellman-Ford           | $O(V \times E)$, detects negative cycles |
| "Shortest path from every node to every other"    | Floyd-Warshall         | $O(V^3)$ DP                              |
| "Shortest path with K stops/constraints"          | Dijkstra + state       | Expand state: `(cost, node, extraState)` |
| "Minimum effort path in grid"                     | Dijkstra on grid       | Cost = max edge on path, not sum         |
| "Unweighted grid / equal weights"                 | BFS                    | Faster than Dijkstra for equal weights   |
| "Find critical edges" (removing increases MST)    | MST + brute force      | Run MST excluding each edge              |
| "Path with maximum probability"                   | Dijkstra with Max-Heap | Multiply probabilities, max not min      |

---

### Detailed Recognition Walkthroughs

#### Recognizing "Minimum Effort Path" (LC 1631) — Non-Standard Dijkstra

When you see: *"find path from top-left to bottom-right minimizing maximum absolute difference between adjacent cells"*
1. "This is NOT minimum total cost — it's minimum worst-case step."
2. Dijkstra still applies: heap stores `(maxEffortSoFar, row, col)`.
3. Recurrence: `newEffort = max(currEffort, |nextCell - currCell|)`.
4. `dist[r][c]` = minimum max-effort to reach `(r,c)`.
5. Early exit when `(m-1, n-1)` is popped.

#### Recognizing Path with Maximum Probability (LC 1514)

When you see: *"find path maximizing probability (probabilities multiply along edges)"*
1. "Maximize product, not minimize sum — but same greedy structure."
2. Use a **Max-Heap** instead of Min-Heap.
3. `dist[node]` = best known probability to reach `node` (initialize to 0, start node to 1.0).
4. Update: `newProb = currProb * edgeProb`. If `newProb > dist[neighbor]`, update and push.
5. Stale check: `if (currProb < dist[node]) continue`.

#### Recognizing When BFS Is Better Than Dijkstra

When you see: *"shortest path in a grid where all cells cost 1 to enter"* or *"minimum hops"*
1. All edges have equal weight → BFS is $O(V + E)$, Dijkstra is $O((V+E) \log V)$.
2. BFS is always faster for equal-weight graphs. Never use Dijkstra when BFS suffices.
3. **Exception:** 0-1 BFS (some edges cost 0, some cost 1) → use a Deque (offer front for cost 0, offer back for cost 1).

#### Recognizing MST vs. Shortest Path

The interview question is: "Connect all N offices with minimum cable." This says **all offices**, not **from office A to office B**. Whenever you see "connect all" or "minimum to include all nodes", it's MST (Prim's or Kruskal's). Whenever you see a specific source and destination, it's Dijkstra.

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Missing the Stale State Check in Dijkstra

```java
// WRONG — processes nodes multiple times, wastes time, can give wrong results
while (!pq.isEmpty()) {
    int[] curr = pq.poll();
    // missing stale check!
    for (int[] neighbor : adj.get(curr[1])) { ... }
}

// CORRECT — skip outdated heap entries
while (!pq.isEmpty()) {
    int[] curr = pq.poll();
    if (curr[0] > dist[curr[1]]) continue; // stale: better path already found
    for (int[] neighbor : adj.get(curr[1])) { ... }
}
```

### Mistake 2: Using `Integer.MAX_VALUE` Then Adding to It (Overflow)

```java
// DANGEROUS — Integer.MAX_VALUE + any_positive_number = overflow -> negative!
Arrays.fill(dist, Integer.MAX_VALUE);
int newCost = dist[u] + edgeWeight; // if dist[u] is MAX_VALUE, this overflows!

// SAFE option 1: check before adding
if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) { ... }

// SAFE option 2: use a large but safe sentinel
Arrays.fill(dist, (int) 1e9); // 1 billion fits in int, won't overflow on addition
```

### Mistake 3: Forgetting to Add Both Directions for Undirected Graphs

```java
// WRONG — only one direction added
for (int[] conn : connections) {
    adj.get(conn[0]).add(new int[]{conn[1], conn[2]});
}

// CORRECT — both directions for undirected
for (int[] conn : connections) {
    adj.get(conn[0]).add(new int[]{conn[1], conn[2]});
    adj.get(conn[1]).add(new int[]{conn[0], conn[2]}); // <- essential for undirected!
}
```

### Mistake 4: Prim's with Accumulated Cost Instead of Edge Cost

```java
// WRONG — treating Prim's like Dijkstra (accumulated total in heap)
pq.offer(new int[]{totalAccumulatedCost, nodeId}); // WRONG for MST!

// CORRECT — Prim's stores only the EDGE weight, not accumulated total
pq.offer(new int[]{edgeWeight, nodeId}); // just this edge's cost
totalCost += edgeWeight; // add edge cost when node is popped
```

### Mistake 5: Using Dijkstra When BFS Suffices

```java
// Overkill — O((V+E) log V) when O(V+E) would work
if (allEdgesHaveSameWeight) {
    // WRONG: use Dijkstra with PriorityQueue
    // CORRECT: use BFS with ArrayDeque
    Queue<Integer> queue = new ArrayDeque<>();
}
```

### Mistake 6: Not Handling Disconnected Graphs

```java
// WRONG — returns wrong answer if some nodes are unreachable
int maxDist = Arrays.stream(dist).max().getAsInt();
return maxDist; // could be Integer.MAX_VALUE if a node is unreachable!

// CORRECT — check for unreachable nodes explicitly
int maxDist = 0;
for (int d : dist) {
    if (d == Integer.MAX_VALUE) return -1; // unreachable node found
    maxDist = Math.max(maxDist, d);
}
return maxDist;
```

---

## 7. Worked Examples

### Example 1: LeetCode 743 — Network Delay Time

**Problem:** Minimum time for a signal from node `k` to reach ALL `n` nodes. Return -1 if any node is unreachable.

**Thinking process:**
1. "Signal spreads from k to all nodes" → Dijkstra from single source.
2. "Time it takes ALL nodes to receive" → max of all shortest distances.
3. "If any node unreachable" → check for `Integer.MAX_VALUE` in `dist`.

```java
class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>()); // 1-indexed

        for (int[] t : times) {
            adj.get(t[0]).add(new int[]{t[1], t[2]}); // directed: t[0] -> t[1]
        }

        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;

        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, k});

        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int cost = curr[0], node = curr[1];
            if (cost > dist[node]) continue;

            for (int[] neighbor : adj.get(node)) {
                int newCost = cost + neighbor[1];
                if (newCost < dist[neighbor[0]]) {
                    dist[neighbor[0]] = newCost;
                    pq.offer(new int[]{newCost, neighbor[0]});
                }
            }
        }

        int maxTime = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == Integer.MAX_VALUE) return -1;
            maxTime = Math.max(maxTime, dist[i]);
        }
        return maxTime;
    }
}
```

Dry run for `times=[[2,1,1],[2,3,1],[3,4,1]], n=4, k=2`:
```
adj: 2->[(1,1),(3,1)], 3->[(4,1)]
dist=[INF,INF,0,INF,INF] (1-indexed, dist[2]=0)
heap=[(0,2)]

Pop (0,2): neighbors (1,1) and (3,1)
  dist[1]=0+1=1, push (1,1)
  dist[3]=0+1=1, push (1,3)
  heap=[(1,1),(1,3)]

Pop (1,1): no neighbors -> heap=[(1,3)]
Pop (1,3): neighbor (4,1)
  dist[4]=1+1=2, push (2,4) -> heap=[(2,4)]

Pop (2,4): no neighbors

dist=[INF,1,0,1,2] -> max of dist[1..4] = 2 ✅
```

*Time: $O((V+E) \log V)$. Space: $O(V+E)$.*

---

### Example 2: LeetCode 1584 — Min Cost to Connect All Points

**Problem:** Given 2D points, cost to connect = Manhattan distance. Return minimum cost to connect all.

**Thinking process:**
1. "Connect ALL points" → MST → Prim's.
2. No explicit edge list — generate edges on the fly (fully connected implicit graph).
3. No adjacency list needed — when we add a new point to MST, compute distances to all unvisited points.

```java
class Solution {
    public int minCostConnectPoints(int[][] points) {
        int n = points.length;
        boolean[] visited = new boolean[n];
        int totalCost = 0, added = 0;

        // Heap: [edgeCost, pointIndex] — Prim's stores EDGE cost, not accumulated
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, 0}); // start from point 0 with edge cost 0

        while (!pq.isEmpty() && added < n) {
            int[] curr = pq.poll();
            int cost = curr[0], idx = curr[1];

            if (visited[idx]) continue;
            visited[idx] = true;
            totalCost += cost;
            added++;

            // Add edges to all unvisited points
            for (int j = 0; j < n; j++) {
                if (!visited[j]) {
                    int dist = Math.abs(points[idx][0] - points[j][0])
                             + Math.abs(points[idx][1] - points[j][1]);
                    pq.offer(new int[]{dist, j});
                }
            }
        }
        return totalCost; // all points connected (guaranteed by problem)
    }
}
```

*Time: $O(N^2 \log N)$ — $N^2$ edges in a complete graph, each pushed/popped once. Space: $O(N^2)$ heap.*

---

### Example 3: LeetCode 787 — Cheapest Flights Within K Stops

**Thinking process:**
1. "Cheapest flight with K stops" → Dijkstra + extra state (stops used).
2. State = (cost, node, stopsUsed). Prune when `stopsUsed > k`.
3. `dist[node][stops]` tracks the best known cost reaching `node` using `stops` stops.

```java
class Solution {
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] f : flights) adj.get(f[0]).add(new int[]{f[1], f[2]});

        // dist[node][stops] = min cost reaching node using exactly 'stops' stops
        int[][] dist = new int[n][k + 2];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[src][0] = 0;

        // Heap: [cost, node, stopsUsed]
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, src, 0});

        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int cost = curr[0], node = curr[1], stops = curr[2];

            if (node == dst) return cost;
            if (stops > k) continue; // exceeded stop limit

            for (int[] neighbor : adj.get(node)) {
                int nextNode = neighbor[0], price = neighbor[1];
                int newCost = cost + price;
                if (newCost < dist[nextNode][stops + 1]) {
                    dist[nextNode][stops + 1] = newCost;
                    pq.offer(new int[]{newCost, nextNode, stops + 1});
                }
            }
        }
        return -1;
    }
}
```

*Time: $O(E \times K \log(V \times K))$. Space: $O(V \times K)$.*

---

### Example 4: LeetCode 1631 — Path With Minimum Effort

**Problem:** Find a path from top-left to bottom-right minimizing the maximum absolute difference between adjacent cells.

**Thinking process:**
1. "Minimize the maximum step difficulty" — not sum, but max. Dijkstra still applies.
2. `dist[r][c]` = minimum max-effort to reach `(r,c)`.
3. Heap stores `(maxEffortSoFar, r, c)`.
4. Update: `newEffort = max(currEffort, |nextCell - currCell|)`.

```java
class Solution {
    private static final int[][] DIRS = {{0,1},{0,-1},{1,0},{-1,0}};

    public int minimumEffortPath(int[][] heights) {
        int m = heights.length, n = heights[0].length;
        int[][] dist = new int[m][n];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[0][0] = 0;

        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, 0, 0}); // [maxEffort, row, col]

        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int effort = curr[0], r = curr[1], c = curr[2];

            if (r == m-1 && c == n-1) return effort;
            if (effort > dist[r][c]) continue;

            for (int[] dir : DIRS) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;

                int newEffort = Math.max(effort, Math.abs(heights[nr][nc] - heights[r][c]));
                if (newEffort < dist[nr][nc]) {
                    dist[nr][nc] = newEffort;
                    pq.offer(new int[]{newEffort, nr, nc});
                }
            }
        }
        return dist[m-1][n-1];
    }
}
```

*Time: $O(M \times N \times \log(M \times N))$. Space: $O(M \times N)$.*

---

## 8. Decision Tree: Which Algorithm?

```
Is the graph weighted?
├── NO  -> BFS (O(V+E), fastest for unweighted)
└── YES -> Are there negative weights?
           ├── YES -> Bellman-Ford (O(V*E)) or detect negative cycle
           └── NO  -> What is the goal?
                      ├── "Shortest from source to target" or "all nodes"
                      │   -> Dijkstra (O((V+E) log V))
                      │   ├── Single target? -> Add early exit when target popped
                      │   ├── Extra constraints (K stops, keys)? -> Expand state
                      │   └── On a 2D grid? -> Same template, (cost, row, col)
                      │
                      ├── "Connect ALL nodes, minimum total cost"
                      │   -> MST: Prim's (heap + visited[]) or Kruskal's (sort + Union-Find)
                      │   └── Dense graph? -> Prim's  |  Sparse graph? -> Kruskal's
                      │
                      └── "Shortest path between ALL pairs of nodes"
                          -> Floyd-Warshall O(V^3) DP
```

---

## 9. Complexity Cheat Sheet

| Algorithm        | Time              | Space      | Use case                            |
| ---------------- | ----------------- | ---------- | ----------------------------------- |
| BFS (unweighted) | $O(V + E)$        | $O(V)$     | Equal-weight shortest path          |
| Dijkstra         | $O((V+E) \log V)$ | $O(V + E)$ | Non-negative weighted shortest path |
| Bellman-Ford     | $O(V \times E)$   | $O(V)$     | Negative weights, cycle detection   |
| Floyd-Warshall   | $O(V^3)$          | $O(V^2)$   | All-pairs shortest paths            |
| Prim's MST       | $O(E \log V)$     | $O(V + E)$ | Minimum Spanning Tree               |
| Kruskal's MST    | $O(E \log E)$     | $O(V)$     | MST (with Union-Find)               |
| 0-1 BFS          | $O(V + E)$        | $O(V)$     | Edges are 0 or 1 only               |

---

## 10. 7-Day Practice Plan (21 Problems)

For each problem, follow this ritual:
1. Identify: Dijkstra, Prim's, Bellman-Ford, or BFS?
2. Directed or undirected? Build adjacency list accordingly.
3. Does the state need extra dimensions (stops, keys, time)?
4. Initialize `dist` to `MAX_VALUE`, start node to 0.
5. Always include the stale state check.
6. Handle disconnected graphs in the final answer.

**Day 1: Dijkstra Fundamentals**
1. [Network Delay Time (LC 743)](https://leetcode.com/problems/network-delay-time/) ⭐ — canonical single-source Dijkstra
2. [Path with Maximum Probability (LC 1514)](https://leetcode.com/problems/path-with-maximum-probability/) — Max-Heap, multiply probabilities
3. [Minimum Weighted Subgraph With Required Paths (LC 2203)](https://leetcode.com/problems/minimum-weighted-subgraph-with-the-required-paths/) — run Dijkstra three times

**Day 2: Advanced Dijkstra & State Tracking**
4. [Cheapest Flights Within K Stops (LC 787)](https://leetcode.com/problems/cheapest-flights-within-k-stops/) ⭐ — composite state (cost, node, stops)
5. [Path With Minimum Effort (LC 1631)](https://leetcode.com/problems/path-with-minimum-effort/) — minimize max, not sum
6. [Swim in Rising Water (LC 778)](https://leetcode.com/problems/swim-in-rising-water/) — minimize max elevation on path

**Day 3: Minimum Spanning Tree (Prim's)**
7. [Min Cost to Connect All Points (LC 1584)](https://leetcode.com/problems/min-cost-to-connect-all-points/) ⭐ — Prim's on implicit complete graph
8. [Find Critical and Pseudo-Critical Edges in MST (LC 1489)](https://leetcode.com/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree/) — MST + brute force exclusion
9. [Minimum Cost to Reach Destination in Time (LC 1928)](https://leetcode.com/problems/minimum-cost-to-reach-destination-in-time/) — Dijkstra with time constraint

**Day 4: Shortest Path in Grids**
10. [Shortest Path in Binary Matrix (LC 1091)](https://leetcode.com/problems/shortest-path-in-binary-matrix/) — BFS (not Dijkstra!) for unweighted
11. [Minimum Obstacle Removal to Reach Corner (LC 2290)](https://leetcode.com/problems/minimum-obstacle-removal-to-reach-corner/) — 0-1 BFS or Dijkstra
12. [Design Graph With Shortest Path Calculator (LC 2642)](https://leetcode.com/problems/design-graph-with-shortest-path-calculator/) — dynamic Dijkstra

**Day 5: Complex Routing Constraints**
13. [Second Minimum Time to Reach Destination (LC 2045)](https://leetcode.com/problems/second-minimum-time-to-reach-destination/) — BFS with parity tracking
14. [Number of Restricted Paths From First to Last Node (LC 1786)](https://leetcode.com/problems/number-of-restricted-paths-from-first-to-last-node/) — Dijkstra + DP counting
15. [Minimum Cost to Make at Least One Valid Path in a Grid (LC 1368)](https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/) — 0-1 BFS (direction cost 0 or 1)

**Day 6: All-Pairs & Bellman-Ford**
16. [Find the City With Smallest Neighbors at Threshold Distance (LC 1334)](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/) — Floyd-Warshall all-pairs
17. [Bellman-Ford Negative Weights (Custom)](https://leetcode.com/tag/shortest-path/) — practice Bellman-Ford template
18. [Reachable Nodes in Subdivided Graph (LC 882)](https://leetcode.com/problems/reachable-nodes-in-subdivided-graph/) — Dijkstra with edge subdivision

**Day 7: Phase 5 Consolidation**
19. [Modify Graph Edge Weights (LC 2699)](https://leetcode.com/problems/modify-graph-edge-weights/) — Dijkstra + constraint solving
20. [Number of Ways to Arrive at Destination (LC 1976)](https://leetcode.com/problems/number-of-ways-to-arrive-at-destination/) — Dijkstra + count paths at min cost
21. [Find Minimum Time to Finish All Jobs (LC 1723)](https://leetcode.com/problems/find-minimum-time-to-finish-all-jobs/) — bitmask DP (preview of Week 18)

---

## 11. Mock Interview Module

### Problem: The Cloud Latency Optimizer

**Context:** Your infrastructure has `N` globally distributed data centers connected by undersea fiber cables. Given `connections[i] = [a, b, latency_ms]` (bidirectional), a customer packet enters at `gateway_node`, must pass through a mandatory `firewall_node` for security inspection, then reach `db_node`.

**Question:** Write `public int getSecureShortestPath(int n, int[][] connections, int gateway, int firewall, int db)` returning the minimum total latency. Return `-1` if impossible.

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                                | Interviewer answers | Why it matters                                |
| --------------------------------------------- | ------------------- | --------------------------------------------- |
| "Are connections bidirectional?"              | Yes                 | Add both directions to adjacency list         |
| "Can the packet revisit nodes?"               | Yes                 | Two legs are independent — run Dijkstra twice |
| "Can gateway, firewall, db be the same node?" | No, all distinct    | Simplifies edge cases                         |
| "Are latencies always positive?"              | Yes                 | Dijkstra is safe (no negative weights)        |
| "Is the graph guaranteed connected?"          | No                  | Must handle -1 cases                          |

---

#### Step 2: Problem Decomposition

```
Mandatory waypoint: gateway -> firewall -> db

Key insight: The two legs are completely INDEPENDENT.
  - Leg 1: gateway -> firewall (via any path, can use any nodes)
  - Leg 2: firewall -> db     (via any path, can reuse nodes from leg 1)

Why independent? Because nodes CAN be revisited (stated in clarifying questions).
A node visited in leg 1 can also appear in leg 2's optimal path.

Solution: Run Dijkstra TWICE with a reusable helper method.
  leg1 = dijkstra(start=gateway, end=firewall)
  leg2 = dijkstra(start=firewall, end=db)
  return (leg1 == -1 || leg2 == -1) ? -1 : leg1 + leg2
```

---

#### Step 3: Optimized Solution

```java
class CloudRouter {
    public int getSecureShortestPath(int n, int[][] connections,
                                      int gateway, int firewall, int db) {
        // Build undirected adjacency list
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] conn : connections) {
            adj.get(conn[0]).add(new int[]{conn[1], conn[2]});
            adj.get(conn[1]).add(new int[]{conn[0], conn[2]}); // bidirectional
        }

        int leg1 = dijkstra(n, adj, gateway, firewall);
        if (leg1 == -1) return -1;

        int leg2 = dijkstra(n, adj, firewall, db);
        if (leg2 == -1) return -1;

        return leg1 + leg2;
    }

    private int dijkstra(int n, List<List<int[]>> adj, int start, int end) {
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[start] = 0;

        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, start});

        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int cost = curr[0], node = curr[1];

            if (node == end) return cost; // early exit: optimal to target found
            if (cost > dist[node]) continue; // stale state

            for (int[] neighbor : adj.get(node)) {
                int newCost = cost + neighbor[1];
                if (newCost < dist[neighbor[0]]) {
                    dist[neighbor[0]] = newCost;
                    pq.offer(new int[]{newCost, neighbor[0]});
                }
            }
        }
        return -1; // target unreachable
    }
}
```

**Complexity:** $O((V + E) \log V)$ per Dijkstra call, two calls total → $O((V + E) \log V)$ overall. Space: $O(V + E)$.

---

#### Step 4: Follow-up Questions & Expected Answers

**Q1:** "What if nodes could NOT be revisited? (A node used in leg 1 cannot be used in leg 2). How does this change the approach?"

*Expected answer:*
"Now the two legs are NOT independent — we need to track which nodes were used in leg 1. This transforms the problem into finding the minimum-cost path from gateway to db that passes through firewall, without node repetition. This is NP-Hard in general (it's a variant of TSP). For small N (say, N ≤ 20), you could use bitmask DP to track visited nodes. For larger N, you'd need heuristics or approximations. The key insight: stating 'nodes cannot be revisited' fundamentally changes the problem class from polynomial to exponential."

**Q2:** "An attacker destroys one cable (removes one edge). You need to instantly recalculate the shortest path. Running Dijkstra from scratch for every cable break is too slow. How would you design a fault-tolerant routing system?"

*Expected answer:*
"There are several approaches at different trade-off points:

**Offline approach (precompute):** For a small fixed number of critical cables, precompute 'backup paths' for each cable removal. Store a map `{edgeId → backupShortestPath}`. Query is $O(1)$.

**Online approach:** 'Sensitivity analysis' on shortest path trees. After running Dijkstra once, build the shortest path tree. For edges NOT on the shortest path tree, removing them doesn't affect the answer. For edges ON the tree, removing them requires recalculation for affected nodes only.

**Architectural approach — reverse the problem:** Instead of deletion, process in reverse chronological order (add edges back). Maintain connectivity with Union-Find. This is the core of offline dynamic connectivity algorithms, which leads directly into Week 18's Union-Find content.

**Production pattern:** Real routing protocols (OSPF, BGP) use incremental updates with Dijkstra re-run only on the affected subgraph when topology changes, not full re-computation."

**Q3:** "If there are 10 mandatory waypoints the packet must visit (in any order), how does the problem scale?"

*Expected answer:*
"With K mandatory waypoints in any order, this becomes the **Travelling Salesman Problem (TSP)** — NP-Hard in general. However, for small K (K ≤ 20), it's solvable with **bitmask DP + Dijkstra**:

1. Run Dijkstra from each of the K waypoints (K separate runs) to get all pairwise distances.
2. Use bitmask DP: `dp[mask][last]` = minimum cost to visit the set of waypoints encoded in `mask`, ending at waypoint `last`.
3. Transition: `dp[mask | (1 << next)][next] = min(dp[mask][last] + dist[last][next])`.
4. Time: $O(K^2 \times 2^K + K \times (V+E) \log V)$.

For K ≤ 20, this is feasible. For larger K, use approximation algorithms (nearest neighbor, christofides)."

---

## 12. Quick Reference: Dijkstra & MST Java Idioms

```java
// ── ADJACENCY LIST SETUP ──────────────────────────────────────────────────
List<List<int[]>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

// Directed: u -> v with weight w
adj.get(u).add(new int[]{v, w});

// Undirected: both directions
adj.get(u).add(new int[]{v, w});
adj.get(v).add(new int[]{u, w}); // <- never forget for undirected!

// ── DIJKSTRA SETUP ────────────────────────────────────────────────────────
int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE); // or (int)1e9 to avoid overflow
dist[start] = 0;

PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
pq.offer(new int[]{0, start}); // [cost, nodeId]

// ── DIJKSTRA CORE LOOP ───────────────────────────────────────────────────
while (!pq.isEmpty()) {
    int[] curr = pq.poll();
    int cost = curr[0], node = curr[1];

    if (cost > dist[node]) continue; // stale state check — NEVER SKIP THIS

    for (int[] neighbor : adj.get(node)) {
        int newCost = cost + neighbor[1];
        if (newCost < dist[neighbor[0]]) {
            dist[neighbor[0]] = newCost;
            pq.offer(new int[]{newCost, neighbor[0]});
        }
    }
}

// ── PRIM'S SETUP (note: edge weight in heap, not accumulated) ─────────────
boolean[] visited = new boolean[n];
int totalCost = 0, added = 0;
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
pq.offer(new int[]{0, 0}); // [edgeWeight, nodeId]

// ── PRIM'S CORE LOOP ─────────────────────────────────────────────────────
while (!pq.isEmpty() && added < n) {
    int[] curr = pq.poll();
    if (visited[curr[1]]) continue; // already in MST
    visited[curr[1]] = true;
    totalCost += curr[0]; // add edge cost
    added++;
    for (int[] neighbor : adj.get(curr[1])) {
        if (!visited[neighbor[0]])
            pq.offer(new int[]{neighbor[1], neighbor[0]}); // [edgeWeight, neighborId]
    }
}
return added == n ? totalCost : -1;

// ── GRID DIJKSTRA ─────────────────────────────────────────────────────────
int[][] dist = new int[m][n];
for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
dist[0][0] = 0;
pq.offer(new int[]{0, 0, 0}); // [cost, row, col]

// ── COMPOSITE STATE DIJKSTRA (K stops) ────────────────────────────────────
int[][] dist = new int[n][k + 2]; // dist[node][stopsUsed]
for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
pq.offer(new int[]{0, src, 0}); // [cost, node, stopsUsed]
if (stops > k) continue; // prune on extra state

// ── OVERFLOW-SAFE SENTINEL ────────────────────────────────────────────────
// AVOID:  dist[u] + w when dist[u] = Integer.MAX_VALUE -> overflow
// USE:    (int)1e9 as sentinel, or check before adding:
if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) { ... }

// ── UNREACHABLE NODE CHECK ────────────────────────────────────────────────
for (int d : dist) {
    if (d == Integer.MAX_VALUE) return -1; // some node unreachable
}
int maxDist = Arrays.stream(dist).max().getAsInt();
```