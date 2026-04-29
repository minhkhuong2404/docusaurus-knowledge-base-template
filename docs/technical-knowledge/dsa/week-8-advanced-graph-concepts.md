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

### Knowledge You Need Before Starting

- Week 7 graph representation and traversal fluency.
- Strong BFS/DFS implementation and visited-state discipline.
- Basic dependency modeling (prerequisite -> dependent direction).
- Familiarity with queues and counting arrays (`inDegree[]`).

---

## 2. Theory & Fundamentals

### 2.1 Mental Model: Why Directed Graphs?

Last week's undirected graphs modeled **symmetric relationships**: if city A connects to city B, then B also connects to A. But many real-world relationships are **one-way**:

- "Course A requires Course B" does not mean "Course B requires Course A"
- "Service A depends on Service B" does not mean B depends on A
- "Task A must finish before Task B starts" is directional

An **undirected edge** is like a two-way street. A **directed edge** (arc) is a one-way street with an arrow.

```
Undirected (symmetric):        Directed (one-way):
A ——— B ——— C                  A ──▶ B ──▶ C
  |       |                    ▲         |
  └── D ──┘                   D ◀────────┘

"A and B are connected"       "A must come before B"
```

**Real-world DAG examples you've worked with:**

| System                | Nodes          | Directed Edge                           |
| --------------------- | -------------- | --------------------------------------- |
| Maven/Gradle build    | JAR modules    | "A depends on B" (B must compile first) |
| npm/yarn              | packages       | "A requires B" (B must install first)   |
| GitHub Actions CI     | workflow steps | "step A triggers step B"                |
| Spreadsheet engine    | cells          | "cell A's formula uses cell B's value"  |
| University curriculum | courses        | "must take Math 101 before Math 201"    |

---

### 2.2 Graph Terminology: In-degree & Out-degree

```
Graph:  A ──▶ B ──▶ D
        │     │
        ▼     ▼
        C ──▶ E
```

| Node | In-degree (arrows coming IN) | Out-degree (arrows going OUT) |
| ---- | ---------------------------- | ----------------------------- |
| A    | 0                            | 2 (→B, →C)                    |
| B    | 1 (A→)                       | 2 (→D, →E)                    |
| C    | 1 (A→)                       | 1 (→E)                        |
| D    | 1 (B→)                       | 0                             |
| E    | 2 (B→, C→)                   | 0                             |

**Key insight for Topological Sort:**
- **In-degree 0** = no prerequisites = can be processed immediately (these are your starting points)
- **In-degree > 0** = has prerequisites = must wait

---

### 2.3 Directed Acyclic Graphs (DAG) — The Golden Property

A **DAG** is a directed graph with **no cycles**. This seemingly simple constraint has massive implications:

```
Valid DAG:                   NOT a DAG (has cycle):
A ──▶ B ──▶ D               A ──▶ B
│                            ▲     │
▼                            │     ▼
C ──▶ E                      D ◀── C
(Can never return to A)       (A→B→C→D→A is a cycle!)
```

**Why does "no cycle" matter so much?**

Think about a build system where A depends on B, and B depends on A. Neither can ever be built — this is a **deadlock**. The cycle makes it logically impossible to find a valid build order. If and only if the graph is a DAG can you always find a valid topological ordering.

**Proving a directed graph is a DAG = proving topological sort is possible.**

These two are equivalent:
- "This graph has a valid topological order" ↔ "This graph is a DAG (no cycles)"

---

### 2.4 Topological Sorting: What It Means

A **topological sort** is a linear ordering of all nodes such that for every directed edge `U → V`, node `U` appears before node `V` in the ordering.

```
DAG:   A ──▶ B ──▶ D
       │     │
       ▼     ▼
       C ──▶ E

Valid topological orderings:
  A, B, C, D, E  ✅ (A before B, A before C, B before D, B before E, C before E)
  A, C, B, E, D  ✅ (also valid)
  A, B, C, E, D  ✅ (also valid)
  B, A, C, D, E  ❌ (B before A violates A → B)
```

**Key insight: Topological sort is NOT unique.** A DAG can have many valid orderings. Problems that ask "find A valid order" or "can you find an order" are topological sort problems.

---

### 2.5 Kahn's Algorithm (BFS) — Step by Step

Kahn's Algorithm is the most intuitive approach. Think of it like this:

**The Metaphor:** You are building a house. You can only start work that has all its prerequisites complete. You start with everything that has no prerequisites (foundation), complete it, then see what's newly unblocked, and repeat.

```
Graph:      A ──▶ C ──▶ E
            │           ▲
            ▼           │
            B ──▶ D ────┘

In-degrees: A=0, B=1(A→), C=1(A→), D=1(B→), E=2(C→, D→)
```

**Step-by-step execution:**

```
Initial: queue = [A] (only A has in-degree 0)
         order = []

Step 1: poll A → order = [A]
        Process A's neighbors: B (1→0 ✅ add to queue), C (1→0 ✅ add to queue)
        queue = [B, C]

Step 2: poll B → order = [A, B]
        Process B's neighbors: D (1→0 ✅ add to queue)
        queue = [C, D]

Step 3: poll C → order = [A, B, C]
        Process C's neighbors: E (2→1, not yet 0)
        queue = [D]

Step 4: poll D → order = [A, B, C, D]
        Process D's neighbors: E (1→0 ✅ add to queue)
        queue = [E]

Step 5: poll E → order = [A, B, C, D, E]
        queue = []

Result: [A, B, C, D, E] — every edge U→V has U before V ✅
Cycle check: processed 5 nodes = 5 total nodes → no cycle ✅
```

**Cycle detection is built in:** If a cycle exists, some nodes will never reach in-degree 0 and will never enter the queue. After BFS finishes, if the processed count is less than total nodes, a cycle blocked the sort.

---

### 2.6 DFS Topological Sort — The Post-Order Approach

An alternative to Kahn's: use DFS and push each node to a **Stack** after ALL its descendants have been fully explored. Pop the stack to get topological order.

```
DFS traversal:
  Visit A → go to B → go to D (leaf, push D) → backtrack to B → go to E (leaf, push E) → push B
  Back to A → go to C → E already visited → push C → push A

Stack (bottom to top): D, E, B, C, A
Pop order (topological): A, C, B, E, D ✅
```

**When to use which approach:**

|                       | Kahn's Algorithm (BFS)  | DFS + Stack                |
| --------------------- | ----------------------- | -------------------------- |
| Cycle detection       | ✅ Natural (count check) | Needs 3-state              |
| Parallel scheduling   | ✅ Direct (BFS levels)   | ❌ Extra work               |
| Finding all orderings | ❌ Hard to modify        | ✅ Easier with backtracking |
| Intuition             | ✅ More intuitive        | ❌ Trickier                 |
| Interview preference  | ✅ Recommended           | Mention as alternative     |

---

### 2.7 The 3-State DFS: Why 2 States Aren't Enough

**In an undirected graph**, you only need 2 states (visited/unvisited). If you reach a visited node that isn't your parent, it's a cycle.

**In a directed graph**, 2 states fail silently:

```
Graph:  A ──▶ B
        │     │
        ▼     ▼
        C ──▶ D
              ▲
              │
        E ────┘

Is this a cycle?
DFS from A: visit A → visit B → visit D → mark D visited
  backtrack to B → backtrack to A → visit C → visit D (already visited!)
  ❌ 2-state says "CYCLE!" but this is actually a valid DAG (D is reachable from two paths)
```

The issue: D is **finished** (fully explored) — it's a **cross-edge**, not a back-edge. A true cycle only exists if you hit a node that's **currently being processed** (still in the call stack).

**The 3-state solution:**

| State     | Value | Meaning                                     |
| --------- | ----- | ------------------------------------------- |
| UNVISITED | 0     | Never seen                                  |
| VISITING  | 1     | In the current DFS path (on the call stack) |
| VISITED   | 2     | Fully explored, all descendants processed   |

```
If you encounter state 1 (VISITING) → CYCLE (back-edge to ancestor in current path)
If you encounter state 2 (VISITED) → SAFE (cross-edge, already fully processed)
```

**Visual proof:**

```
Actual cycle:  A ──▶ B ──▶ C ──▶ A (cycle!)
DFS from A:
  A → state[A]=1 (VISITING)
  A → B → state[B]=1
  B → C → state[C]=1
  C → A → state[A]==1 !! → CYCLE DETECTED ✅

Cross-edge (no cycle):  A ──▶ B, A ──▶ C, B ──▶ D, C ──▶ D
DFS from A:
  A → state[A]=1
  A → B → state[B]=1
  B → D → state[D]=1
  D has no neighbors → state[D]=2 (VISITED)
  backtrack to B → state[B]=2
  A → C → state[C]=1
  C → D → state[D]==2 (already VISITED, safe!) → no cycle ✅
  state[C]=2 → state[A]=2
```

---

### 2.8 Parallel Scheduling: BFS Levels = Parallel Batches

When Kahn's runs, nodes at the same BFS level have **all their prerequisites satisfied simultaneously**. With infinite resources, all nodes at the same level can execute in parallel.

```
Graph:     A   B (both have in-degree 0)
           │   │
           ▼   ▼
           C   D (available after A and B finish)
            \ /
             ▼
             E (available after C and D finish)

BFS levels:
  Level 0: {A, B}  → run in parallel → 1 hour
  Level 1: {C, D}  → run in parallel → 1 hour
  Level 2: {E}     → 1 hour

Total time = 3 hours (number of BFS levels = critical path length)
```

**Critical path:** The longest chain of dependencies determines the minimum total time, regardless of how many servers you have. This is a fundamental concept in project management (CPM).

---

## 3. Code Templates (Java)

### Template 1: Build Adjacency List (Directed Graph)

```java
// Standard setup for directed graph problems
int n = numNodes;
List<List<Integer>> adj = new ArrayList<>();
int[] inDegree = new int[n];

for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

// Edge: u → v (u must come before v)
for (int[] edge : edges) {
    int u = edge[0], v = edge[1];
    adj.get(u).add(v);
    inDegree[v]++;  // v has one more prerequisite
}
```

### Template 2: Kahn's Algorithm (Topological Sort + Cycle Detection)

```java
public int[] topologicalSort(int numNodes, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numNodes];

    for (int i = 0; i < numNodes; i++) adj.add(new ArrayList<>());

    // prerequisites[i] = [course, preReq] means preReq → course
    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }

    // Start with all nodes that have no prerequisites
    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < numNodes; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    int[] order = new int[numNodes];
    int index = 0;

    while (!queue.isEmpty()) {
        int curr = queue.poll();
        order[index++] = curr;

        for (int neighbor : adj.get(curr)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }

    // If index != numNodes, a cycle prevented some nodes from being processed
    return index == numNodes ? order : new int[0];
}
```

### Template 3: Kahn's Algorithm with Parallel Level Tracking

```java
// Returns the minimum time (number of BFS levels) to complete all tasks
public int minTimeToComplete(int numNodes, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numNodes];

    for (int i = 0; i < numNodes; i++) adj.add(new ArrayList<>());
    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < numNodes; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    int totalTime = 0;
    int processed = 0;

    while (!queue.isEmpty()) {
        int levelSize = queue.size(); // all tasks runnable in parallel this round
        totalTime++;                  // one time unit per level

        for (int i = 0; i < levelSize; i++) {
            int curr = queue.poll();
            processed++;

            for (int neighbor : adj.get(curr)) {
                inDegree[neighbor]--;
                if (inDegree[neighbor] == 0) {
                    queue.offer(neighbor);
                }
            }
        }
    }

    return processed == numNodes ? totalTime : -1; // -1 means cycle detected
}
```

### Template 4: 3-State DFS for Cycle Detection

```java
// 0 = unvisited, 1 = visiting (in call stack), 2 = visited (safe)
public boolean hasCycle(int numNodes, List<List<Integer>> adj) {
    int[] state = new int[numNodes];

    for (int i = 0; i < numNodes; i++) {
        if (state[i] == 0) {
            if (dfsHasCycle(i, adj, state)) return true;
        }
    }
    return false;
}

private boolean dfsHasCycle(int curr, List<List<Integer>> adj, int[] state) {
    if (state[curr] == 1) return true;  // back-edge → CYCLE
    if (state[curr] == 2) return false; // cross-edge → already safe

    state[curr] = 1; // mark as currently visiting

    for (int neighbor : adj.get(curr)) {
        if (dfsHasCycle(neighbor, adj, state)) return true;
    }

    state[curr] = 2; // all descendants safe, mark as done
    return false;
}
```

### Template 5: DFS Topological Sort (Post-order Stack)

```java
public int[] topoSortDFS(int n, List<List<Integer>> adj) {
    int[] state = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        if (state[i] == 0) {
            if (dfsTopoSort(i, adj, state, stack)) {
                return new int[0]; // cycle detected
            }
        }
    }

    int[] result = new int[n];
    int idx = 0;
    while (!stack.isEmpty()) result[idx++] = stack.pop();
    return result;
}

private boolean dfsTopoSort(int curr, List<List<Integer>> adj, int[] state, Deque<Integer> stack) {
    if (state[curr] == 1) return true;  // cycle
    if (state[curr] == 2) return false; // already processed

    state[curr] = 1;
    for (int neighbor : adj.get(curr)) {
        if (dfsTopoSort(neighbor, adj, state, stack)) return true;
    }
    state[curr] = 2;
    stack.push(curr); // push AFTER all descendants are done
    return false;
}
```

### Template 6: String-Keyed Graph (when nodes are strings, not integers)

```java
// When node IDs are strings — use HashMap instead of arrays
public List<String> topologicalSortStrings(String[] nodes, String[][] edges) {
    Map<String, List<String>> adj = new HashMap<>();
    Map<String, Integer> inDegree = new HashMap<>();

    for (String node : nodes) {
        adj.put(node, new ArrayList<>());
        inDegree.put(node, 0);
    }

    for (String[] edge : edges) {
        String from = edge[0], to = edge[1]; // from → to
        adj.get(from).add(to);
        inDegree.merge(to, 1, Integer::sum); // inDegree[to]++
    }

    Queue<String> queue = new ArrayDeque<>();
    for (String node : nodes) {
        if (inDegree.get(node) == 0) queue.offer(node);
    }

    List<String> result = new ArrayList<>();
    while (!queue.isEmpty()) {
        String curr = queue.poll();
        result.add(curr);

        for (String neighbor : adj.get(curr)) {
            int newDegree = inDegree.get(neighbor) - 1;
            inDegree.put(neighbor, newDegree);
            if (newDegree == 0) queue.offer(neighbor);
        }
    }

    if (result.size() != nodes.length)
        throw new IllegalArgumentException("Circular dependency detected!");
    return result;
}
```

---

## 4. Problem-Solving Framework

### Step 1 — Recognize the Graph (2 minutes)

Ask yourself:
- Is the relationship **directional**? ("A depends on B" vs. "A connects to B") → Directed graph
- Are there **cycles possible**? (or must I detect/prevent them?) → Cycle detection
- Do I need an **ordering**? ("What order to process?") → Topological sort
- Can tasks run **in parallel**? ("Minimum time?") → BFS level tracking

### Step 2 — Clarify Edge Direction (Critical!)

The most common bug in graph problems is building edges in the wrong direction.

**Rule of thumb:** If "A depends on B", then B must come **before** A. So the edge in your adjacency list goes `B → A` (B points to A), and `inDegree[A]++`.

```
"Course A requires Course B":
  - Edge: B → A  (B must be taken before A)
  - adj.get(B).add(A)
  - inDegree[A]++

"Task A must finish before Task B":
  - Edge: A → B  (A points to B)
  - adj.get(A).add(B)
  - inDegree[B]++
```

**Draw the graph and verify:** For a small example, draw the directed edges and check: can you reach a valid ordering by following the arrows?

### Step 3 — Choose Kahn's or 3-State DFS

| Need to...                                            | Use                                   |
| ----------------------------------------------------- | ------------------------------------- |
| Find valid ordering AND detect cycles                 | **Kahn's (BFS)**                      |
| Find minimum parallel execution time                  | **Kahn's with levelSize**             |
| Just detect if cycle exists                           | **3-State DFS** or Kahn's count check |
| Check if all nodes are "safe" (no cycle reachable)    | **3-State DFS**                       |
| Find ordering with backtracking (all valid orderings) | **DFS**                               |

### Step 4 — Always Verify the Cycle Check

Kahn's: `if (processed != totalNodes) → cycle exists`
3-State DFS: `if (state[curr] == 1) → cycle exists`

Never skip this. Problems like "can you finish all courses?" ARE asking you to detect cycles — returning the order alone is not enough.

### Step 5 — Handle the String-to-Integer Mapping

When node names are strings (service names, course names), either:
- Map strings to integers first, then use array-based adjacency list (faster)
- Use `HashMap<String, List<String>>` directly (cleaner, acceptable in interviews)

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| Problem signal                                        | Pattern                     | Key technique                                   |
| ----------------------------------------------------- | --------------------------- | ----------------------------------------------- |
| "Prerequisites", "Dependencies", "Must do A before B" | Topological sort            | Kahn's BFS or DFS post-order                    |
| "Can all tasks be completed?"                         | Cycle detection             | Kahn's count check or 3-state DFS               |
| "Find a valid execution order"                        | Topological sort            | Kahn's (returns the order directly)             |
| "Minimum time with parallel execution"                | BFS level tracking          | Kahn's + `levelSize` loop                       |
| "Find safe nodes" (no cycle reachable from node)      | 3-state DFS                 | Mark safe after all successors are safe         |
| "Detect deadlock"                                     | Cycle detection             | 3-state DFS (state 1 = deadlock)                |
| "Alien dictionary / unknown character order"          | Topological sort            | Build graph from adjacent word pairs            |
| "Longest path in a directed graph"                    | Topo sort + DP              | Sort first, then DP on sorted order             |
| "Reconstruct sequence"                                | Topological sort uniqueness | Check if exactly one node in queue at each step |
| "All paths from source to target in DAG"              | DFS with backtracking       | No cycle = no infinite loop                     |

---

### Detailed Recognition Walkthroughs

#### Recognizing Parallel Scheduling (LC 1136 — Parallel Courses)

When you see: *"each task takes 1 unit, tasks can run simultaneously if dependencies are met, find minimum time"*
1. "Minimum time = number of BFS levels in topological sort."
2. "All nodes entering the queue simultaneously = tasks that can run in parallel."
3. "Add `levelSize` loop inside Kahn's to count levels."
4. "If processed < total at end, return -1 (cycle/impossible)."

#### Recognizing Alien Dictionary (LC 269 — Hard)

When you see: *"given a sorted list of words in alien language, determine the character order"*
1. "This is topological sort on characters."
2. "Compare adjacent words character by character to find the first difference → that gives a directed edge."
3. "Example: `['wrt', 'wrf']` → `t` comes before `f` → edge `t → f`."
4. "Build graph from these edges, then topological sort."
5. "If impossible (cycle found), return empty string."

#### Recognizing Safe Nodes (LC 802)

When you see: *"find all nodes from which every path leads to a terminal"*
1. "A node is 'unsafe' if it's part of a cycle or can reach a cycle."
2. "Use 3-state DFS: state 1 = currently visiting (potentially unsafe), state 2 = verified safe."
3. "A node is safe if all its neighbors are safe."
4. "This is exactly 3-state DFS — state 2 means 'verified safe, all descendants are terminal or safe'."

#### Recognizing Longest Path in DAG (LC 329 — Matrix)

When you see: *"longest increasing path in a matrix"*
1. "This is a DAG problem: each cell points to its larger neighbors."
2. "There are no cycles because each edge goes strictly to a larger value."
3. "Use DFS + memoization: longest path from cell (i,j) = 1 + max(longest path of valid neighbors)."
4. "This is equivalent to: topologically sort by value, then DP on the sorted order."

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Building Edges in the Wrong Direction

```java
// Problem: "Course A requires Course B" means take B first, then A
// Edge should be: B → A  (B enables A)

// ❌ WRONG — reversed edge
for (int[] pre : prerequisites) {
    adj.get(pre[0]).add(pre[1]); // pre[0]=A, pre[1]=B → adds A→B ❌
    inDegree[pre[1]]++;          // increments B's in-degree ❌
}

// ✅ CORRECT — B→A, inDegree[A]++
for (int[] pre : prerequisites) {
    adj.get(pre[1]).add(pre[0]); // B→A
    inDegree[pre[0]]++;          // A gets one more prerequisite
}
```

**Debug trick:** Take a tiny example, draw the edges on paper, and verify that the topological order follows the arrows correctly.

### Mistake 2: Forgetting the Cycle Check at the End of Kahn's

```java
// ❌ WRONG — missing cycle detection, always returns the partial order
while (!queue.isEmpty()) { ... }
return order; // might only have 3 elements for a 5-node graph!

// ✅ CORRECT — verify all nodes were processed
return index == numNodes ? order : new int[0]; // or throw exception
```

### Mistake 3: Using 2-State Instead of 3-State DFS for Directed Graphs

```java
// ❌ WRONG for directed graphs — false positives on cross-edges
boolean[] visited = new boolean[n];
if (visited[neighbor]) return true; // falsely reports cycle

// ✅ CORRECT — 3 states distinguish back-edge from cross-edge
int[] state = new int[n]; // 0=unvisited, 1=visiting, 2=visited
if (state[neighbor] == 1) return true; // true back-edge = true cycle
if (state[neighbor] == 2) return false; // cross-edge = safe
```

### Mistake 4: Not Initializing In-degrees for All Nodes

```java
// ❌ WRONG — nodes with no incoming edges won't be in inDegree map
for (int[] edge : edges) {
    inDegree.put(edge[1], inDegree.getOrDefault(edge[1], 0) + 1);
}
// Problem: source nodes (in-degree 0) are never added to the map!
// queue.offer() check will skip them.

// ✅ CORRECT — initialize ALL nodes first
for (String node : allNodes) {
    inDegree.put(node, 0); // every node starts at 0
}
for (int[] edge : edges) {
    inDegree.put(edge[1], inDegree.get(edge[1]) + 1);
}
```

### Mistake 5: Using `LinkedList` as Queue

```java
// ❌ Slower — LinkedList has higher constant factor
Queue<Integer> queue = new LinkedList<>();

// ✅ Preferred — ArrayDeque is faster and more memory-efficient
Queue<Integer> queue = new ArrayDeque<>();
```

### Mistake 6: Forgetting to Start DFS from All Unvisited Nodes

```java
// ❌ WRONG — only starts DFS from node 0, misses disconnected components
if (dfsCycle(0, adj, state)) return true;

// ✅ CORRECT — start from every unvisited node to cover the full graph
for (int i = 0; i < numNodes; i++) {
    if (state[i] == 0) {
        if (dfsCycle(i, adj, state)) return true;
    }
}
```

---

## 7. Worked Examples

### Example 1: LeetCode 207 — Course Schedule

**Problem:** Given `numCourses` and `prerequisites[i] = [a, b]` (b must be taken before a), return `true` if you can finish all courses.

**Thinking process:**
1. "Can you finish all courses?" = "Is there a valid topological order?" = "Is there no cycle?"
2. Use Kahn's Algorithm: if all nodes are processed, no cycle exists.
3. Edge direction: `prerequisites[i] = [a, b]` → b must come before a → edge `b → a`, `inDegree[a]++`.

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] inDegree = new int[numCourses];

        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());

        for (int[] pre : prerequisites) {
            adj.get(pre[1]).add(pre[0]); // pre[1] → pre[0]
            inDegree[pre[0]]++;
        }

        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) {
            if (inDegree[i] == 0) queue.offer(i);
        }

        int completed = 0;
        while (!queue.isEmpty()) {
            int curr = queue.poll();
            completed++;

            for (int next : adj.get(curr)) {
                if (--inDegree[next] == 0) queue.offer(next);
            }
        }

        return completed == numCourses;
    }
}
```

Dry run for `numCourses=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]`:

```
Edges: 0→1, 0→2, 1→3, 2→3
inDegree: [0, 1, 1, 2]
Initial queue: [0]

Poll 0 → completed=1 → decrement 1 (0), 2 (0) → queue=[1,2]
Poll 1 → completed=2 → decrement 3 (1) → queue=[2]
Poll 2 → completed=3 → decrement 3 (0) → queue=[3]
Poll 3 → completed=4 → queue=[]

completed(4) == numCourses(4) → true ✅
```

*Time: $O(V + E)$. Space: $O(V + E)$.*

---

### Example 2: LeetCode 210 — Course Schedule II

**Problem:** Same as 207 but return the actual ordering. Return empty array if impossible.

**Thinking process:**
1. Same as 207 but instead of just counting, store the order.
2. Kahn's algorithm naturally builds the order as it processes nodes.

```java
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] inDegree = new int[numCourses];

        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());

        for (int[] pre : prerequisites) {
            adj.get(pre[1]).add(pre[0]);
            inDegree[pre[0]]++;
        }

        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) {
            if (inDegree[i] == 0) queue.offer(i);
        }

        int[] order = new int[numCourses];
        int index = 0;

        while (!queue.isEmpty()) {
            int curr = queue.poll();
            order[index++] = curr;

            for (int next : adj.get(curr)) {
                if (--inDegree[next] == 0) queue.offer(next);
            }
        }

        return index == numCourses ? order : new int[0];
    }
}
```

*Time: $O(V + E)$. Space: $O(V + E)$.*

---

### Example 3: LeetCode 802 — Find Eventual Safe States

**Problem:** Return all nodes from which every path leads to a terminal node (no cycles reachable).

**Thinking process:**
1. "Safe" = no cycle is reachable from this node.
2. A node is unsafe if it's in a cycle OR leads to a cycle.
3. 3-state DFS: after returning `true` (all descendants safe), mark current node as state 2 (safe).
4. State 2 = verified safe — reachable without cycles.

```java
class Solution {
    public List<Integer> eventualSafeNodes(int[][] graph) {
        int n = graph.length;
        int[] state = new int[n]; // 0=unvisited, 1=visiting, 2=safe
        List<Integer> result = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            if (isSafe(i, graph, state)) result.add(i);
        }
        return result;
    }

    private boolean isSafe(int curr, int[][] graph, int[] state) {
        if (state[curr] == 1) return false; // currently visiting = cycle = unsafe
        if (state[curr] == 2) return true;  // already verified safe

        state[curr] = 1; // mark as visiting

        for (int next : graph[curr]) {
            if (!isSafe(next, graph, state)) return false; // unsafe neighbor
        }

        state[curr] = 2; // all paths lead to terminal, mark safe
        return true;
    }
}
```

Dry run for `graph = [[1,2],[2,3],[5],[0],[5],[],[]]`:
```
Nodes 0,1,2,3 form a cycle (0→1→2→3→0? No, 3→0, 0→1, 1→2... let's trace:
  isSafe(0): state[0]=1 → check 1,2
    isSafe(1): state[1]=1 → check 2,3
      isSafe(2): state[2]=1 → check 5
        isSafe(5): no neighbors → state[5]=2 → return true
      state[2]=2, return true
      isSafe(3): state[3]=1 → check 0
        isSafe(0): state[0]==1 → return false ← CYCLE via 3→0
      return false
    return false
  return false
Node 0,1,3 are NOT safe

isSafe(4): state[4]=1 → check 5
  isSafe(5): state[5]==2 → return true (already safe)
state[4]=2 → return true → Node 4 is safe ✅
Node 5 already marked safe ✅
Node 6: no neighbors → state[6]=2 → safe ✅

Safe nodes: [4, 5, 6] ✅
```

*Time: $O(V + E)$. Space: $O(V)$.*

---

### Example 4: LeetCode 329 — Longest Increasing Path in a Matrix

**Problem:** Find the length of the longest increasing path in a matrix (move up/down/left/right).

**Thinking process:**
1. "This is a DAG!" — each cell only points to strictly larger neighbors, so no cycles are possible.
2. DFS from every cell, memoize the longest path from each cell.
3. No need for explicit visited tracking (DAG = no cycles = no infinite recursion).

```java
class Solution {
    private static final int[][] DIRS = {{0,1},{0,-1},{1,0},{-1,0}};

    public int longestIncreasingPath(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] memo = new int[m][n]; // memo[i][j] = longest path starting at (i,j)
        int maxLen = 0;

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                maxLen = Math.max(maxLen, dfs(matrix, i, j, m, n, memo));
            }
        }
        return maxLen;
    }

    private int dfs(int[][] matrix, int i, int j, int m, int n, int[][] memo) {
        if (memo[i][j] != 0) return memo[i][j]; // already computed

        int maxPath = 1; // at minimum, path length is 1 (just this cell)
        for (int[] dir : DIRS) {
            int ni = i + dir[0], nj = j + dir[1];
            if (ni >= 0 && ni < m && nj >= 0 && nj < n
                    && matrix[ni][nj] > matrix[i][j]) { // strictly larger
                maxPath = Math.max(maxPath, 1 + dfs(matrix, ni, nj, m, n, memo));
            }
        }

        memo[i][j] = maxPath;
        return maxPath;
    }
}
```

*Time: $O(M \times N)$ — each cell computed once and memoized. Space: $O(M \times N)$.*

---

## 8. Decision Tree: Which Graph Algorithm?

```
Is the graph DIRECTED?
├── NO  → Use undirected graph algorithms (BFS/DFS for components, Union-Find)
└── YES → Does it have a cycle?
           ├── "Is there a cycle?" → 3-State DFS OR Kahn's count check
           └── "Find ordering (topo sort)"?
                ├── YES → Is it Kahn's (BFS) or DFS post-order?
                │         ├── Need parallel levels?      → Kahn's + levelSize
                │         ├── Need the actual order?     → Kahn's (simpler)
                │         └── Need all valid orderings?  → DFS + backtracking
                └── NO  → Is it path/reachability?
                           ├── Shortest path (unweighted) → BFS
                           ├── Shortest path (weighted)   → Dijkstra or Bellman-Ford
                           └── Longest path in DAG        → Topo sort + DP
```

---

## 9. Complexity Cheat Sheet

| Algorithm                        | Time             | Space             | Use case                        |
| -------------------------------- | ---------------- | ----------------- | ------------------------------- |
| Kahn's Topological Sort          | $O(V + E)$       | $O(V + E)$        | Ordering + cycle detection      |
| 3-State DFS Cycle Detection      | $O(V + E)$       | $O(V)$ call stack | Cycle detection only            |
| DFS Topo Sort (post-order)       | $O(V + E)$       | $O(V)$            | Ordering via DFS                |
| Parallel scheduling (BFS levels) | $O(V + E)$       | $O(V)$            | Min time with infinite servers  |
| Longest path in DAG (topo + DP)  | $O(V + E)$       | $O(V + E)$        | Critical path                   |
| All paths in DAG (DFS)           | $O(2^V \cdot V)$ | $O(V)$            | Exponential — only small graphs |

---

## 10. 7-Day Practice Plan (21 Problems)

For each problem, follow this ritual:
1. Identify: directed or undirected? weighted or unweighted?
2. Draw the graph for a small example, verify edge directions.
3. State which algorithm (Kahn's / 3-State DFS / BFS) and why.
4. Code and trace manually, verify the cycle check.

**Day 1: Kahn's Algorithm & Topological Sort Basics**
1. [Course Schedule (LC 207)](https://leetcode.com/problems/course-schedule/) — Cycle detection via Kahn's count
2. [Course Schedule II (LC 210)](https://leetcode.com/problems/course-schedule-ii/) — Return actual topological order
3. [Find Eventual Safe States (LC 802)](https://leetcode.com/problems/find-eventual-safe-states/) — 3-state DFS for safety

**Day 2: Advanced Dependency Resolution**
4. [Alien Dictionary (LC 269)](https://leetcode.com/problems/alien-dictionary/) ⭐ — *Build graph from word pairs, then topo sort*
5. [Parallel Courses (LC 1136)](https://leetcode.com/problems/parallel-courses/) — Kahn's + level counting
6. [Minimum Height Trees (LC 310)](https://leetcode.com/problems/minimum-height-trees/) — Topo sort from leaves inward

**Day 3: Pathfinding in Directed Graphs**
7. [All Paths From Source to Target (LC 797)](https://leetcode.com/problems/all-paths-from-source-to-target/) — DFS all paths in DAG
8. [Reorder Routes to Make All Paths Lead to Zero (LC 1466)](https://leetcode.com/problems/reorder-routes-to-make-all-paths-lead-to-the-city-zero/) — Edge direction analysis
9. [Evaluate Division (LC 399)](https://leetcode.com/problems/evaluate-division/) — Graph with weighted edges

**Day 4: Network Connectivity & Degree Analysis**
10. [Find the Town Judge (LC 997)](https://leetcode.com/problems/find-the-town-judge/) — In-degree/out-degree counts
11. [Maximal Network Rank (LC 1615)](https://leetcode.com/problems/maximal-network-rank/) — Degree counting
12. [Shortest Path with Alternating Colors (LC 1129)](https://leetcode.com/problems/shortest-path-with-alternating-colors/) — BFS with state

**Day 5: Advanced Traversal Mechanics**
13. [Minimum Number of Vertices to Reach All Nodes (LC 1557)](https://leetcode.com/problems/minimum-number-of-vertices-to-reach-all-nodes/) — Find nodes with in-degree 0
14. [Time Needed to Inform All Employees (LC 1376)](https://leetcode.com/problems/time-needed-to-inform-all-employees/) — Tree DFS with weights
15. [Loud and Rich (LC 851)](https://leetcode.com/problems/loud-and-rich/) — DFS with memoization

**Day 6: Matrix Dependencies**
16. [Longest Increasing Path in a Matrix (LC 329)](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) ⭐ — *DFS + memoization on implicit DAG*
17. [Maximum Number of Fish in a Grid (LC 2658)](https://leetcode.com/problems/maximum-number-of-fish-in-a-grid/) — BFS/DFS component max
18. [As Far from Land as Possible (LC 1162)](https://leetcode.com/problems/as-far-from-land-as-possible/) — Multi-source BFS

**Day 7: Complex Graph Synthesis**
19. [Sequence Reconstruction (LC 444)](https://leetcode.com/problems/sequence-reconstruction/) — Unique topo sort check
20. [Check if There is a Valid Path in a Grid (LC 1391)](https://leetcode.com/problems/check-if-there-is-a-valid-path-in-a-grid/) — Direction-constrained BFS
21. [Cheapest Flights Within K Stops (LC 787)](https://leetcode.com/problems/cheapest-flights-within-k-stops/) ⭐ — *Preview of Bellman-Ford / Dijkstra*

---

## 11. Mock Interview Module

### Problem: The Distributed Build Scheduler

**Context:** You are building the backend for a CI platform. Customers upload a list of microservices to compile along with dependencies. Building service A may require B and C to be built first. A single server can build one service at a time, each taking exactly 1 hour.

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                         | Interviewer answers           | Why it matters                          |
| -------------------------------------- | ----------------------------- | --------------------------------------- |
| "Can a service depend on itself?"      | No                            | No self-loops                           |
| "Can there be circular dependencies?"  | Yes, must detect them         | Throw exception / return error          |
| "Are service names unique?"            | Yes                           | Safe to use as map keys                 |
| "Can services have zero dependencies?" | Yes                           | These are starting points (in-degree 0) |
| "What if multiple valid orders exist?" | Any valid order is acceptable | Kahn's naturally picks one              |

---

#### Part 1: Sequential Build (Single Server)

```java
// Time: O(V + E), Space: O(V + E)
public List<String> getBuildSequence(String[] services, String[][] dependencies) {
    Map<String, List<String>> adj = new HashMap<>();
    Map<String, Integer> inDegree = new HashMap<>();

    for (String s : services) {
        adj.put(s, new ArrayList<>());
        inDegree.put(s, 0);
    }

    // "A depends on B" → edge B→A, inDegree[A]++
    for (String[] dep : dependencies) {
        String target = dep[0], prereq = dep[1];
        adj.get(prereq).add(target);
        inDegree.merge(target, 1, Integer::sum);
    }

    Queue<String> queue = new ArrayDeque<>();
    for (String s : services) {
        if (inDegree.get(s) == 0) queue.offer(s);
    }

    List<String> buildOrder = new ArrayList<>();
    while (!queue.isEmpty()) {
        String curr = queue.poll();
        buildOrder.add(curr);

        for (String dependent : adj.get(curr)) {
            int newDegree = inDegree.get(dependent) - 1;
            inDegree.put(dependent, newDegree);
            if (newDegree == 0) queue.offer(dependent);
        }
    }

    if (buildOrder.size() != services.length)
        throw new IllegalArgumentException("Circular dependency detected!");

    return buildOrder;
}
```

---

#### Part 2: Parallel Build (Infinite Servers — Enterprise Tier)

*Interviewer:* "What if the Enterprise tier provisions infinite servers? Services can compile in parallel when their dependencies are met. How many hours does the full build take?"

**Key insight:** "Minimum time = number of BFS levels = length of the critical path."

```java
// Time: O(V + E), Space: O(V + E)
public int getParallelBuildTime(String[] services, String[][] dependencies) {
    Map<String, List<String>> adj = new HashMap<>();
    Map<String, Integer> inDegree = new HashMap<>();

    for (String s : services) {
        adj.put(s, new ArrayList<>());
        inDegree.put(s, 0);
    }

    for (String[] dep : dependencies) {
        adj.get(dep[1]).add(dep[0]);
        inDegree.merge(dep[0], 1, Integer::sum);
    }

    Queue<String> queue = new ArrayDeque<>();
    for (String s : services) {
        if (inDegree.get(s) == 0) queue.offer(s);
    }

    int totalHours = 0;
    int processed = 0;

    while (!queue.isEmpty()) {
        int levelSize = queue.size(); // all services that can run NOW
        totalHours++;                 // one hour per level (parallel batch)

        for (int i = 0; i < levelSize; i++) {
            String curr = queue.poll();
            processed++;

            for (String dependent : adj.get(curr)) {
                int newDegree = inDegree.get(dependent) - 1;
                inDegree.put(dependent, newDegree);
                if (newDegree == 0) queue.offer(dependent);
            }
        }
    }

    if (processed != services.length)
        throw new IllegalArgumentException("Circular dependency detected!");

    return totalHours;
}
```

**Dry run for** `services = [A,B,C,D,E]`, dependencies: A→C, A→D, B→D, C→E, D→E`:
```
Edges (prereq→target): A→C, A→D, B→D, C→E, D→E
inDegree: A=0, B=0, C=1, D=2, E=2

Hour 1: queue=[A,B], levelSize=2 → process A,B → C(0→queue), D(1)
Hour 2: queue=[C], levelSize=1 → process C → D(0→queue), E(1)? No, C→E only
         Wait — D was not yet 0 from A. A→D decrements D to 1. B→D decrements to 0.
         Let me redo: poll A → C(0✅queue), D(1). Poll B → D(0✅queue).
         After hour 1 processing: queue=[C, D]

Hour 2: queue=[C,D], levelSize=2 → process C (E→1), D (E→0✅queue)
         After: queue=[E]

Hour 3: queue=[E], process E

Total: 3 hours ✅ (critical path: A→C→E or A→D→E)
```

---

#### Step 3: Follow-up Questions

**Q1:** "What if each service has a different build time (not all 1 hour)? How do you find the minimum total time?"

*Expected answer:* "This becomes the **critical path problem**. I'd use topo sort + DP:
- `dp[node]` = earliest time this service can FINISH.
- `dp[node] = buildTime[node] + max(dp[prerequisite])` for all prerequisites.
- Process in topological order, take max of all `dp` values as the answer."

```java
// After topological sort, process in order:
int[] earliestFinish = new int[n];
for (int node : topoOrder) {
    earliestFinish[node] = buildTime[node]; // start with own time
    for (int prereq : prerequisites_of[node]) {
        earliestFinish[node] = Math.max(earliestFinish[node],
            buildTime[node] + earliestFinish[prereq]); // can't start until prereq finishes
    }
}
return Arrays.stream(earliestFinish).max().getAsInt();
```

**Q2:** "What if the dependency graph is enormous (millions of services) and doesn't fit in memory?"

*Expected answer:* "Partition the graph by domain or team ownership, process subgraphs independently. Use a distributed message queue (like Kafka) where each service publishes a 'build complete' event that decrements the in-degree counter of dependents — this is exactly how real CI systems like Bazel and Pants implement incremental builds. The in-degree array becomes a distributed counter."

**Q3:** "How would you handle dynamic dependencies — a service that discovers new dependencies at build time?"

*Expected answer:* "This makes true topological sort impossible upfront. Real build systems handle this with: (1) conservative over-approximation of dependencies (declare all possible deps), or (2) restart the build plan when new dependencies are discovered mid-run, or (3) use file-level dependency tracking with a cache — if the output of B hasn't changed, skip rebuilding A even if B was 'rebuilt'. This is how Make and Bazel work."

---

## 12. Quick Reference: Directed Graph Idioms in Java

```java
// ── GRAPH SETUP ───────────────────────────────────────────────────────────
// Integer nodes (0 to n-1) — preferred for performance
int n = numNodes;
List<List<Integer>> adj = new ArrayList<>();
int[] inDegree = new int[n];
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

// String nodes — use HashMap
Map<String, List<String>> adj = new HashMap<>();
Map<String, Integer> inDegree = new HashMap<>();
for (String node : nodes) { adj.put(node, new ArrayList<>()); inDegree.put(node, 0); }

// ── ADD DIRECTED EDGE u → v ───────────────────────────────────────────────
adj.get(u).add(v);
inDegree[v]++;  // v gets one more prerequisite

// ── KAHN'S SETUP ─────────────────────────────────────────────────────────
Queue<Integer> queue = new ArrayDeque<>();
for (int i = 0; i < n; i++) {
    if (inDegree[i] == 0) queue.offer(i);
}

// ── KAHN'S PROCESS ────────────────────────────────────────────────────────
int processed = 0;
while (!queue.isEmpty()) {
    int curr = queue.poll();
    processed++;
    for (int next : adj.get(curr)) {
        if (--inDegree[next] == 0) queue.offer(next);
    }
}
boolean hasCycle = (processed != n);

// ── KAHN'S PARALLEL LEVELS ────────────────────────────────────────────────
int levels = 0;
while (!queue.isEmpty()) {
    int levelSize = queue.size();
    levels++;
    for (int i = 0; i < levelSize; i++) {
        int curr = queue.poll();
        for (int next : adj.get(curr)) {
            if (--inDegree[next] == 0) queue.offer(next);
        }
    }
}

// ── 3-STATE DFS ───────────────────────────────────────────────────────────
int[] state = new int[n]; // 0=unvisited, 1=visiting, 2=done
// Always loop over ALL nodes (disconnected components!)
for (int i = 0; i < n; i++) {
    if (state[i] == 0) dfsCycle(i, adj, state);
}

// ── IN-DEGREE SHORTCUT (Nodes with no incoming edges = sources) ───────────
List<Integer> sources = new ArrayList<>();
for (int i = 0; i < n; i++) {
    if (inDegree[i] == 0) sources.add(i);
}

// ── COMMON ONE-LINER: decrement + conditional offer ───────────────────────
if (--inDegree[neighbor] == 0) queue.offer(neighbor);
// equivalent to:
// inDegree[neighbor]--;
// if (inDegree[neighbor] == 0) queue.offer(neighbor);
```