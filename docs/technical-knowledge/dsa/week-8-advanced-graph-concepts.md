---
id: week-8-advanced-graph-concepts
title: "Week 8: Advanced Graph Concepts"
description: Master Directed Acyclic Graphs (DAGs), cycle detection in directed graphs, and dependency resolution using Kahn's Algorithm (Topological Sort) in Java.
tags: [dsa, java, graphs, topological-sort, algorithms, week-8]
sidebar_position: 8
---

# Week 8: Advanced Graph Concepts

## 1. Overview
Welcome to Week 8! This week concludes Phase 2 of our DSA roadmap. Having built a strong foundation in grid traversals and undirected graphs last week, we are now adding **Direction** and **Dependencies**. 

You will focus heavily on **Directed Acyclic Graphs (DAGs)**. These structures are the backbone of task schedulers, build systems (like Maven or npm), CI/CD pipelines, and spreadsheet calculation engines. You will master how to resolve dependencies in the correct order and how to detect if a system is deadlocked due to a circular dependency.

**Goals for this week:**
- Understand In-degree and Out-degree in Directed Graphs.
- Master cycle detection in Directed Graphs using a 3-state DFS.
- Master **Topological Sorting** using Kahn's Algorithm (BFS).
- Understand how to schedule tasks that can run in parallel vs. sequentially.

---

## 2. Theory & Fundamentals

### Directed Graphs & Degrees
In a directed graph, edges have a specific direction (A $\rightarrow$ B). 
- **In-degree:** The number of edges pointing *into* a node. If a node has an in-degree of 0, it has no prerequisites and can be processed immediately.
- **Out-degree:** The number of edges pointing *out* of a node.

### Directed Acyclic Graphs (DAG)
A directed graph with absolutely **no cycles**. If you start at node A and follow the directional arrows, you can never return to node A. Topological sorting is *only* possible on a DAG.

### Topological Sorting
Topological sorting is an ordering of vertices such that for every directed edge $U \rightarrow V$, vertex $U$ comes before $V$ in the ordering. 
- **Kahn's Algorithm (BFS):** Relies on keeping an array of `in-degrees`. You load a Queue with all nodes that have an `in-degree` of 0. As you process a node, you reduce the `in-degree` of its neighbors. If a neighbor reaches 0, you add it to the Queue.
- **DFS Approach:** You do a standard DFS and push a node to a Stack *only after* all its children have been explored. Popping off the stack gives the topological order.

### 3-State Cycle Detection
In an *undirected* graph, finding a cycle is easy: if you see a visited node that isn't your direct parent, it's a cycle. 
In a *directed* graph, cross-edges can look like cycles but aren't. To detect true cycles, nodes must have 3 states:
1. `0` = Unvisited
2. `1` = Visiting (Currently in the recursive Call Stack)
3. `2` = Visited (Fully explored, safely popped off the Call Stack)
If you encounter a node in state `1`, you have found a cycle.

---

## 3. Code Templates (Java)

### Template 1: Kahn's Algorithm (Topological Sort via BFS)
Used to find an execution order and simultaneously detect if a cycle makes completion impossible.
```java
public int[] topologicalSort(int numNodes, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numNodes];
    
    // 1. Initialize graph
    for (int i = 0; i < numNodes; i++) adj.add(new ArrayList<>());
    
    // 2. Build graph and populate in-degrees
    // prerequisites[i] = [course, preReq] -> preReq points to course
    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }
    
    // 3. Find all nodes with 0 in-degree (no prerequisites)
    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < numNodes; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }
    
    int[] order = new int[numNodes];
    int index = 0;
    
    // 4. Process the queue
    while (!queue.isEmpty()) {
        int curr = queue.poll();
        order[index++] = curr;
        
        for (int neighbor : adj.get(curr)) {
            inDegree[neighbor]--; // "Remove" the edge
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor); // Neighbor is now free to process
            }
        }
    }
    
    // 5. Check for cycles: if index != numNodes, a cycle blocked the sort
    return index == numNodes ? order : new int[0];
}
```

### Template 2: 3-State DFS for Cycle Detection
```java
public boolean hasCycle(int numNodes, List<List<Integer>> adj) {
    int[] state = new int[numNodes]; // 0: unvisited, 1: visiting, 2: visited
    
    for (int i = 0; i < numNodes; i++) {
        if (state[i] == 0) {
            if (dfsFindCycle(i, adj, state)) return true;
        }
    }
    return false;
}

private boolean dfsFindCycle(int curr, List<List<Integer>> adj, int[] state) {
    if (state[curr] == 1) return true;  // Hit a node currently in the call stack! CYCLE!
    if (state[curr] == 2) return false; // Already verified this node is safe
    
    state[curr] = 1; // Mark as visiting
    
    for (int neighbor : adj.get(curr)) {
        if (dfsFindCycle(neighbor, adj, state)) return true;
    }
    
    state[curr] = 2; // Mark as fully visited
    return false;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Topological Sort / DAG problems:**
1. **"Prerequisites", "Dependencies", "Order of compilation":** Anytime you must do task A before task B, this is a **Directed Graph**.
2. **"Is it possible to finish all tasks?":** This translates to: "Does this directed graph have a cycle?" Use either Kahn's Algorithm or 3-State DFS.
3. **"Find the longest path in a graph":** Generally NP-Hard, *unless* the graph is a DAG. If you topologically sort it first, you can find the longest path using dynamic programming in $O(V+E)$ time.
4. **"Can we schedule tasks in parallel?":** If the problem asks for the minimum time to complete all tasks given that some can run simultaneously, this is a strong signal for using Kahn's Algorithm to process nodes level by level (BFS), where each level represents tasks that can run in parallel.
5. **"Find all valid orderings":** If the problem asks for all possible valid orderings of tasks given their dependencies, this is a strong signal for using backtracking DFS to explore all paths in the DAG, while ensuring that you only visit nodes when all their prerequisites have been met.
6. **"Detect if a system is deadlocked":** If the problem describes a scenario where tasks are waiting on each other in a circular manner, this is a strong signal for using 3-state DFS to detect cycles in the directed graph of dependencies.
7. **"Course scheduling" or "Build systems":** If the problem is about scheduling courses based on prerequisites or determining the order of compilation in a build system, this is a direct application of topological sorting in a directed graph.
8. **"Find the longest path in a DAG":** If the problem asks for the longest path in a directed graph, check if it's a DAG. If it is, you can topologically sort it and then use dynamic programming to find the longest path efficiently.
9. **"Find the number of valid orderings":** If the problem asks for the number of valid orderings of tasks given their dependencies, this is a strong signal for using backtracking DFS to explore all paths in the DAG, while ensuring that you only visit nodes when all their prerequisites have been met.
10. **"Detect if a system is deadlocked":** If the problem describes a scenario where tasks are waiting on each other in a circular manner, this is a strong signal for using 3-state DFS to detect cycles in the directed graph of dependencies.

---

## 5. Worked Examples

### Example 1: LeetCode 207. Course Schedule
**Problem:** There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`. Return `true` if you can finish all courses.
**Solution (Kahn's Algorithm / Cycle Check):**
```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] inDegree = new int[numCourses];
        
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        
        for (int[] pre : prerequisites) {
            adj.get(pre[1]).add(pre[0]); // pre[1] -> pre[0]
            inDegree[pre[0]]++;
        }
        
        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) {
            if (inDegree[i] == 0) queue.offer(i);
        }
        
        int completedCourses = 0;
        while (!queue.isEmpty()) {
            int curr = queue.poll();
            completedCourses++;
            
            for (int nextCourse : adj.get(curr)) {
                inDegree[nextCourse]--;
                if (inDegree[nextCourse] == 0) {
                    queue.offer(nextCourse);
                }
            }
        }
        
        return completedCourses == numCourses;
    }
}
```

### Example 2: LeetCode 802. Find Eventual Safe States
**Problem:** A node is a terminal node if there are no outgoing edges. A node is a safe node if every possible path starting from that node leads to a terminal node (or another safe node). Return an array containing all the safe nodes of the graph.
**Solution (3-State DFS Cycle Detection):**
```java
class Solution {
    public List<Integer> eventualSafeNodes(int[][] graph) {
        int n = graph.length;
        int[] state = new int[n]; // 0: unvisited, 1: visiting, 2: safe
        List<Integer> safeNodes = new ArrayList<>();
        
        for (int i = 0; i < n; i++) {
            if (dfsIsSafe(i, graph, state)) {
                safeNodes.add(i);
            }
        }
        return safeNodes;
    }
    
    private boolean dfsIsSafe(int curr, int[][] graph, int[] state) {
        if (state[curr] > 0) {
            return state[curr] == 2; // Return true only if it was previously marked safe
        }
        
        state[curr] = 1; // Mark as visiting (assume unsafe until proven otherwise)
        
        for (int nextNode : graph[curr]) {
            if (!dfsIsSafe(nextNode, graph, state)) {
                return false; // Path leads to a cycle
            }
        }
        
        state[curr] = 2; // All paths lead to terminal nodes; mark as safe
        return true;
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: Kahn's Algorithm & Topological Sort Basics**
1. Course Schedule (LC 207)
2. Course Schedule II (LC 210)
3. Find Eventual Safe States (LC 802)

**Day 2: Advanced Dependency Resolution**
4. Alien Dictionary (LC 269 / Premium or Neetcode) - *The ultimate Topological Sort test.*
5. Parallel Courses (LC 1136 / Premium or Neetcode)
6. Minimum Height Trees (LC 310) - *Topological sort from the leaves inward!*

**Day 3: Pathfinding in Directed Graphs**
7. All Paths From Source to Target (LC 797)
8. Reorder Routes to Make All Paths Lead to the City Zero (LC 1466)
9. Evaluate Division (LC 399)

**Day 4: Network Connectivity & Bipartite Review**
10. Find the Town Judge (LC 997)
11. Maximal Network Rank (LC 1615)
12. Shortest Path with Alternating Colors (LC 1129)

**Day 5: Advanced Traversal Mechanics**
13. Minimum Number of Vertices to Reach All Nodes (LC 1557)
14. Time Needed to Inform All Employees (LC 1376)
15. Loud and Rich (LC 851)

**Day 6: Matrix Dependencies (Putting it together)**
16. Longest Increasing Path in a Matrix (LC 329) - *DFS + Memoization in a DAG.*
17. Maximum Number of Fish in a Grid (LC 2658)
18. As Far from Land as Possible (LC 1162)

**Day 7: Complex Graph Synthesis**
19. Sequence Reconstruction (LC 444 / Premium)
20. Check if There is a Valid Path in a Grid (LC 1391)
21. Cheapest Flights Within K Stops (LC 787) - *Preview of Bellman-Ford / Dijkstra for Phase 5.*

---

## 7. Mock Interview Module

### Problem: The Distributed Build Scheduler
**Context:** You are working on the backend architecture for a continuous integration (CI) platform. Customers upload a list of microservices that need to be compiled, along with a list of dependencies. Building microservice `A` might require `B` and `C` to be built first.
A single build server can only build one microservice at a time. Each microservice takes exactly 1 hour to build.

**Question 1:** Write a function `public List<String> getBuildSequence(String[] services, String[][] dependencies)` that returns a valid sequential order to build the services. If there is a circular dependency (e.g., A needs B, B needs A), throw an `IllegalArgumentException`.

*(Assume `dependencies[i] = {"A", "B"}` means `A` depends on `B`, so `B` must be built before `A`)*.

#### Step 1: The Optimized Solution (Kahn's Algorithm)
*Candidate's thought process:*
- "Dependencies" immediately signals a Topological Sort.
- The input is strings instead of integers from 0 to N. I will need to map `String` to `Integer` to use an array-based Adjacency List, or just build the Adjacency List using a `HashMap<String, List<String>>` and an `inDegree` map.
```java
// Time: O(V + E), Space: O(V + E)
public List<String> getBuildSequence(String[] services, String[][] dependencies) {
    Map<String, List<String>> adj = new HashMap<>();
    Map<String, Integer> inDegree = new HashMap<>();
    
    for (String service : services) {
        adj.put(service, new ArrayList<>());
        inDegree.put(service, 0);
    }
    
    // "A" depends on "B" -> B must point to A (B must finish before A starts)
    for (String[] dep : dependencies) {
        String target = dep[0];
        String prerequisite = dep[1];
        adj.get(prerequisite).add(target);
        inDegree.put(target, inDegree.get(target) + 1);
    }
    
    Queue<String> queue = new ArrayDeque<>();
    for (String service : services) {
        if (inDegree.get(service) == 0) {
            queue.offer(service);
        }
    }
    
    List<String> buildOrder = new ArrayList<>();
    while (!queue.isEmpty()) {
        String curr = queue.poll();
        buildOrder.add(curr);
        
        for (String dependent : adj.get(curr)) {
            int currentInDegree = inDegree.get(dependent) - 1;
            inDegree.put(dependent, currentInDegree);
            if (currentInDegree == 0) {
                queue.offer(dependent);
            }
        }
    }
    
    if (buildOrder.size() != services.length) {
        throw new IllegalArgumentException("Circular dependency detected!");
    }
    
    return buildOrder;
}
```

#### Step 2: The Architectural Follow-up
*Interviewer:* "Great. Now, what if the customer upgrades their account to the 'Enterprise Tier', which provisions **infinite build servers**? Services can now be compiled in parallel if their dependencies are met. How long (in hours) will it take to build all the microservices?"

*Candidate's expected thought process:*
- If we have infinite servers, we can process everything currently in the `queue` simultaneously.
- Therefore, the total time required is equal to the **number of levels** in our BFS queue.
- To modify the code, I would introduce a `levelSize` loop inside the `while (!queue.isEmpty())` loop, exactly like we do for standard tree/graph BFS level-order traversal. 
- For each `levelSize` batch we process, we increment a `totalHours` counter by 1. The topological sort logic remains exactly the same.