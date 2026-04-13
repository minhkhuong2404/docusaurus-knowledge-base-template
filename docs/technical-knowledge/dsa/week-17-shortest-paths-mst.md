---
id: week-17-shortest-paths-mst
title: "Week 17: Shortest Paths & MST"
description: Begin Phase 5 by conquering weighted graphs. Master Dijkstra's Algorithm for finding the shortest path and Prim's Algorithm for building Minimum Spanning Trees in Java.
tags: [dsa, java, graphs, dijkstra, mst, algorithms, week-17]
sidebar_position: 17
---

# Week 17: Shortest Paths & MST

## 1. Overview
Welcome to Week 17 and the beginning of the final phase: **Phase 5 (Advanced Techniques + Review)**! 

Back in Week 7, we found the shortest path through grids and networks using Breadth-First Search (BFS). However, standard BFS only works when every edge costs exactly `1`. In the real world, edges have varying costs—network latency between servers is not identical, and toll roads cost different amounts.

This week introduces **Weighted Graphs**. You will master two of the most famous algorithms in computer science: **Dijkstra's Algorithm** (for finding the fastest route from A to B) and **Prim's Algorithm** for finding the Minimum Spanning Tree (the cheapest way to connect *everything* together).

**Goals for this week:**
- Understand the structure of Weighted Adjacency Lists.
- Master Dijkstra's Algorithm using Java's `PriorityQueue`.
- Differentiate between a Shortest Path and a Minimum Spanning Tree (MST).
- Master Prim's Algorithm (which relies on the exact same Priority Queue logic as Dijkstra).

---

## 2. Theory & Fundamentals

### Weighted Graphs
Instead of just tracking `neighborID`, an Adjacency List for a weighted graph tracks a pair of values: `[neighborID, edgeWeight]`. In Java, this is best represented by creating a custom `class Edge { int node; int cost; }`.

### Dijkstra's Algorithm
Dijkstra's finds the shortest path from a single starting node to all other nodes in a graph with **non-negative** edge weights.
- **The Concept:** It is essentially BFS, but instead of using a standard `Queue` (FIFO), it uses a `PriorityQueue` (Min-Heap) ordered by the *total distance from the start node*.
- **The Golden Rule:** The moment a node is popped off the Priority Queue, you have found the absolute shortest possible path to that node. (This is why negative weights break the algorithm—a negative weight hidden deep in the graph might suddenly create a shorter path after you've already locked in a node).
- **Time Complexity:** $O((V + E) \log V)$ where $V$ is vertices and $E$ is edges.

### Minimum Spanning Trees (MST) & Prim's Algorithm
An MST is a subset of edges that connects *all* nodes together without any cycles, ensuring the total edge weight is as small as possible.
- **Dijkstra vs. Prim:** - Dijkstra asks: "What is the cheapest way to get from City A to City D?"
  - Prim asks: "What is the cheapest way to pave roads so that *every* city is connected to the grid?"
- **Prim's Algorithm:** Start at any random node. Add all its edges to a Min-Heap. Pop the cheapest edge. If it connects to an unvisited node, add that node to your MST and add all its new edges to the Heap. Repeat until all nodes are visited.

---

## 3. Code Templates (Java)

### Core Object: The Edge / Node Class
Always create a clean helper class for Priority Queue operations.
```java
class NodeInfo {
    int id;
    int cost;
    public NodeInfo(int id, int cost) {
        this.id = id;
        this.cost = cost;
    }
}
```

### Template 1: Dijkstra's Algorithm
```java
public int[] dijkstra(int n, List<List<NodeInfo>> adj, int startNode) {
    // Array to store the minimum distance to each node
    int[] minDocs = new int[n];
    Arrays.fill(minDocs, Integer.MAX_VALUE);
    minDocs[startNode] = 0;
    
    // Min-Heap ordered by total accumulated cost
    PriorityQueue<NodeInfo> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.cost, b.cost));
    pq.offer(new NodeInfo(startNode, 0));
    
    while (!pq.isEmpty()) {
        NodeInfo curr = pq.poll();
        
        // IMPORTANT: Stale state check. If we already found a faster way to this node 
        // while this object was waiting in the queue, ignore it.
        if (curr.cost > minDocs[curr.id]) continue;
        
        // Explore neighbors
        for (NodeInfo neighbor : adj.get(curr.id)) {
            int newTotalCost = curr.cost + neighbor.cost;
            
            // If we found a strictly cheaper path to the neighbor, update it and push to heap
            if (newTotalCost < minDocs[neighbor.id]) {
                minDocs[neighbor.id] = newTotalCost;
                pq.offer(new NodeInfo(neighbor.id, newTotalCost));
            }
        }
    }
    
    return minDocs;
}
```

### Template 2: Prim's Algorithm (Minimum Spanning Tree)
Notice how similar this is to Dijkstra. The ONLY difference is that we sort the heap by the *edge weight itself*, not the accumulated total cost.
```java
public int primsMST(int n, List<List<NodeInfo>> adj) {
    int totalCost = 0;
    int edgesUsed = 0;
    boolean[] visited = new boolean[n];
    
    // Min-Heap ordered purely by the edge weight
    PriorityQueue<NodeInfo> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.cost, b.cost));
    
    // Start at an arbitrary node (e.g., node 0) with a cost of 0
    pq.offer(new NodeInfo(0, 0));
    
    while (!pq.isEmpty() && edgesUsed < n) {
        NodeInfo curr = pq.poll();
        
        if (visited[curr.id]) continue; // Skip if already part of the MST
        
        visited[curr.id] = true;
        totalCost += curr.cost;
        edgesUsed++;
        
        // Add all outgoing edges to unvisited neighbors
        for (NodeInfo neighbor : adj.get(curr.id)) {
            if (!visited[neighbor.id]) {
                pq.offer(new NodeInfo(neighbor.id, neighbor.cost));
            }
        }
    }
    
    // If edgesUsed < n, the graph is disconnected and an MST is impossible
    return edgesUsed == n ? totalCost : -1; 
}
```

---

## 4. Pattern Recognition Guide

**How to spot Weighted Graph problems:**
1. **"Shortest time", "Minimum fuel", "Cheapest flight":** If edges have varying weights, it is **Dijkstra's Algorithm**. 
2. **"Connect all computers", "Minimum wire needed to connect all nodes":** The keyword is "connect ALL". This guarantees it is a **Minimum Spanning Tree**. Use Prim's algorithm.
3. **Negative Costs?** If a problem mentions "You gain fuel traveling on this road" (a negative weight), Dijkstra will fail. You must use the **Bellman-Ford Algorithm** (which relaxes all edges $V-1$ times).
4. **"Find the k-th shortest path":** This is a variation of Dijkstra's where you allow multiple entries for the same node in the Priority Queue, and only lock in the shortest path after popping it off the heap k times.
5. **"Find the number of different paths with a cost less than K":** This is a variation of Dijkstra's where you keep track of all paths to a node that are under the cost threshold, and you may need to use a modified BFS or DFS with pruning instead of a standard Dijkstra.
6. **"Find the longest path in a DAG":** If the graph is a Directed Acyclic Graph (DAG) and you need to find the longest path, you can use a modified Dijkstra's algorithm or topological sort with dynamic programming, since the absence of cycles allows for a well-defined longest path.
7. **"Find the minimum cost to connect all points in a 2D plane":** This is a classic MST problem disguised as a geometric problem. Use Prim's algorithm with the Manhattan distance as edge weights.
8. **"Find the critical edges in a network":** If you need to find edges that, if removed, would increase the cost of the MST or disconnect the graph, this is a more advanced MST problem that may require running Prim's algorithm multiple times while excluding certain edges to determine their criticality.
9. **"Find the minimum cost to reach a destination within a certain time":** This is a variation of Dijkstra's algorithm where you need to track both the accumulated cost and the time taken, often requiring a state that includes both parameters in the Priority Queue.
10. **"Find the shortest path in a grid with varying terrain costs":** This is a Dijkstra's algorithm problem where the grid cells represent nodes and the cost to move from one cell to another is determined by the terrain type, requiring you to use a Priority Queue to always expand the least costly path first.

---

## 5. Worked Examples

### Example 1: LeetCode 743. Network Delay Time
**Problem:** You are given a network of `n` nodes, labeled from `1` to `n`. You are also given `times`, a list of travel times as directed edges `times[i] = (ui, vi, wi)`, where `ui` is the source, `vi` is the target, and `wi` is the time it takes for a signal to travel from source to target. We will send a signal from a given node `k`. Return the minimum time it takes for all the `n` nodes to receive the signal.
**Solution (Dijkstra):**
```java
class Solution {
    class Edge {
        int target, time;
        Edge(int target, int time) { this.target = target; this.time = time; }
    }
    
    public int networkDelayTime(int[][] times, int n, int k) {
        // 1. Build Adjacency List (1-indexed)
        Map<Integer, List<Edge>> adj = new HashMap<>();
        for (int i = 1; i <= n; i++) adj.put(i, new ArrayList<>());
        for (int[] time : times) {
            adj.get(time[0]).add(new Edge(time[1], time[2]));
        }
        
        // 2. Setup Dijkstra
        int[] minTimes = new int[n + 1];
        Arrays.fill(minTimes, Integer.MAX_VALUE);
        minTimes[k] = 0;
        
        PriorityQueue<Edge> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.time, b.time));
        pq.offer(new Edge(k, 0));
        
        // 3. Process Heap
        while (!pq.isEmpty()) {
            Edge curr = pq.poll();
            
            if (curr.time > minTimes[curr.target]) continue;
            
            for (Edge neighbor : adj.get(curr.target)) {
                int newTime = curr.time + neighbor.time;
                if (newTime < minTimes[neighbor.target]) {
                    minTimes[neighbor.target] = newTime;
                    pq.offer(new Edge(neighbor.target, newTime));
                }
            }
        }
        
        // 4. Find the maximum time among all minimum paths
        int maxTime = 0;
        for (int i = 1; i <= n; i++) {
            if (minTimes[i] == Integer.MAX_VALUE) return -1; // Unreachable node
            maxTime = Math.max(maxTime, minTimes[i]);
        }
        
        return maxTime;
    }
}
```

### Example 2: LeetCode 1584. Min Cost to Connect All Points
**Problem:** You are given an array `points` representing integer coordinates of some points on a 2D-plane, where `points[i] = [xi, yi]`. The cost of connecting two points `[xi, yi]` and `[xj, yj]` is the manhattan distance between them. Return the minimum cost to make all points connected.
**Solution (Prim's Algorithm):**
```java
class Solution {
    class Edge {
        int node, cost;
        Edge(int node, int cost) { this.node = node; this.cost = cost; }
    }
    
    public int minCostConnectPoints(int[][] points) {
        int n = points.length;
        boolean[] visited = new boolean[n];
        PriorityQueue<Edge> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.cost, b.cost));
        
        // Start from point 0
        pq.offer(new Edge(0, 0));
        int totalCost = 0;
        int connectedNodes = 0;
        
        while (!pq.isEmpty() && connectedNodes < n) {
            Edge curr = pq.poll();
            
            if (visited[curr.node]) continue;
            
            // Add to MST
            visited[curr.node] = true;
            totalCost += curr.cost;
            connectedNodes++;
            
            // Generate implicit edges to all other unvisited points
            for (int nextNode = 0; nextNode < n; nextNode++) {
                if (!visited[nextNode]) {
                    int dist = Math.abs(points[curr.node][0] - points[nextNode][0]) + 
                               Math.abs(points[curr.node][1] - points[nextNode][1]);
                    pq.offer(new Edge(nextNode, dist));
                }
            }
        }
        
        return totalCost;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Dijkstra Fundamentals**
1. Network Delay Time (LC 743)
2. Minimum Weighted Subgraph With the Required Paths (LC 2203) - *Hard, but purely Dijkstra.*
3. Path with Maximum Probability (LC 1514) - *Use a Max-Heap and multiply probabilities.*

**Day 2: Advanced Dijkstra & State Tracking**
4. Cheapest Flights Within K Stops (LC 787) - *Requires tracking 'stops' state alongside cost.*
5. Path With Minimum Effort (LC 1631)
6. Swim in Rising Water (LC 778) - *Dijkstra applied to a 2D Grid.*

**Day 3: Minimum Spanning Tree (Prim's)**
7. Min Cost to Connect All Points (LC 1584)
8. Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree (LC 1489)
9. Minimum Cost to Reach Destination in Time (LC 1928)

**Day 4: Shortest Path in Grids**
10. Shortest Path in Binary Matrix (LC 1091) - *BFS review: unweighted grids don't need Dijkstra!*
11. Shortest Path to Get Food (LC 1730 / Premium)
12. Minimum Obstacle Removal to Reach Corner (LC 2290) - *0-1 BFS or Dijkstra.*

**Day 5: Complex Routing Constraints**
13. Design Graph With Shortest Path Calculator (LC 2642)
14. Modify Graph Edge Weights (LC 2699)
15. Second Minimum Time to Reach Destination (LC 2045)

**Day 6: Negative Weights & Matrices**
16. Find the City With the Smallest Number of Neighbors at a Threshold Distance (LC 1334) - *Good introduction to Floyd-Warshall (All-Pairs Shortest Path).*
17. Network Routing with Negative Delays (Custom concept: Bellman-Ford review)
18. Validate Binary Tree Nodes (LC 1361)

**Day 7: Phase 5 Consolidation**
19. Reachable Nodes In Subdivided Graph (LC 882)
20. Number of Restricted Paths From First to Last Node (LC 1786)
21. Find Minimum Time to Finish All Jobs (LC 1723)

---

## 7. Mock Interview Module

### Problem: The Cloud Latency Optimizer
**Context:** You are working for a major cloud provider. Your infrastructure consists of `N` data centers globally, connected by undersea fiber optic cables. You are given a list of `connections`, where `connections[i] = [data_center_A, data_center_B, latency_ms]`. 

A massive customer request enters the network at `gateway_node`. It needs to reach the database at `db_node`. However, to ensure security, the packet **must pass through a specific firewall node** `firewall_node` somewhere along the path.

**Question:** Write a function `public int getSecureShortestPath(int n, int[][] connections, int gateway, int firewall, int db)` that returns the minimum total latency to route the packet from the gateway, to the firewall, and finally to the database. If a path is impossible, return `-1`.

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Are the connections bidirectional?" -> *Interviewer:* Yes, it is an undirected graph.
- *Candidate:* "Can the packet revisit nodes? E.g., gateway -> nodeX -> firewall -> nodeX -> db?" -> *Interviewer:* Yes. The shortest path from the firewall to the DB might trace back through nodes previously visited.

#### Step 2: The Logic
*Candidate's thought process:*
- The problem is essentially asking for two independent shortest paths:
  1. Shortest path from `gateway` to `firewall`.
  2. Shortest path from `firewall` to `db`.
- Since nodes can be revisited, these two segments are completely independent. The total time is just the sum of the two shortest paths.
- I need to run **Dijkstra's Algorithm twice**. To avoid duplicate code, I will write a helper method `runDijkstra(graph, start, end)`.

#### Step 3: The Optimized Solution
```java
// Time: O((V + E) log V), Space: O(V + E)
class CloudRouter {
    class Edge {
        int target, latency;
        Edge(int t, int l) { target = t; latency = l; }
    }
    
    public int getSecureShortestPath(int n, int[][] connections, int gateway, int firewall, int db) {
        // 1. Build Adjacency List
        List<List<Edge>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        
        for (int[] conn : connections) {
            adj.get(conn[0]).add(new Edge(conn[1], conn[2]));
            adj.get(conn[1]).add(new Edge(conn[0], conn[2])); // Undirected
        }
        
        // 2. Find the two independent shortest paths
        int leg1 = runDijkstra(n, adj, gateway, firewall);
        if (leg1 == -1) return -1; // Cannot reach firewall
        
        int leg2 = runDijkstra(n, adj, firewall, db);
        if (leg2 == -1) return -1; // Cannot reach DB from firewall
        
        return leg1 + leg2;
    }
    
    private int runDijkstra(int n, List<List<Edge>> adj, int start, int end) {
        int[] minLatencies = new int[n];
        Arrays.fill(minLatencies, Integer.MAX_VALUE);
        minLatencies[start] = 0;
        
        PriorityQueue<Edge> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.latency, b.latency));
        pq.offer(new Edge(start, 0));
        
        while (!pq.isEmpty()) {
            Edge curr = pq.poll();
            
            // Early exit if we reached the target
            if (curr.target == end) return curr.latency;
            
            if (curr.latency > minLatencies[curr.target]) continue;
            
            for (Edge neighbor : adj.get(curr.target)) {
                int newLatency = curr.latency + neighbor.latency;
                if (newLatency < minLatencies[neighbor.target]) {
                    minLatencies[neighbor.target] = newLatency;
                    pq.offer(new Edge(neighbor.target, newLatency));
                }
            }
        }
        return -1;
    }
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "Great implementation. Now, suppose an attacker infiltrates one of the cables, effectively making its latency 'infinite' (destroying the connection). If this happens, your service needs to instantly recalculate the new shortest paths. Running Dijkstra over and over from scratch for every cable break is too slow. How would you design a system to handle dynamic edge deletions faster?"
*Candidate's expected thought process:*
- Standard Dijkstra calculates the shortest path from scratch. Dynamic graphs (where edges are removed or weights change) are incredibly complex.
- A common architectural pattern is to reverse the problem. Instead of deleting edges, we can start with the "broken" graph and **add** edges back in reverse chronological order.
- To maintain connectivity and find shortest paths quickly when adding edges, we would need to utilize an advanced data structure like a **Disjoint Set Union (Union-Find)** to quickly check if components are connected, combined with memoized path matrices. (This sets up the transition perfectly into Week 18).