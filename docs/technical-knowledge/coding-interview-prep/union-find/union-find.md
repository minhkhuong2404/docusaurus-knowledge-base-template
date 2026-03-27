---
id: union-find
title: Union-Find (Disjoint Set Union)
sidebar_position: 18
description: Track connected components and detect cycles with Union-Find / DSU
---

# 🔗 Union-Find (Disjoint Set Union)

## Concept

**Union-Find** (also called **Disjoint Set Union / DSU**) maintains a collection of disjoint sets and supports two operations efficiently:

- **Find(x)**: Which component does `x` belong to? (returns the root)
- **Union(x, y)**: Merge the components containing `x` and `y`

With **path compression** and **union by rank**, both operations run in near-constant time O(α(n)) where α is the inverse Ackermann function — effectively O(1) in practice.

---

## When to Use

- Detect **cycles** in an undirected graph
- Find **connected components**
- Dynamic connectivity (edges added over time)
- Problems involving **merging groups** or "which group does X belong to"
- Keywords: "connected", "same group", "union", "redundant edge"

---

## Java Implementation

```java
class UnionFind {
    private int[] parent;
    private int[] rank;
    private int components; // tracks number of distinct sets

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i; // each node is its own parent
    }

    // Find with path compression
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // path compression: point directly to root
        }
        return parent[x];
    }

    // Union by rank
    public boolean union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return false; // already connected — would create a cycle

        // Attach smaller tree under larger tree
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
        components--;
        return true;
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getComponents() {
        return components;
    }
}
```

---

## Worked Example 1: Number of Connected Components

```java
public int countComponents(int n, int[][] edges) {
    UnionFind uf = new UnionFind(n);
    for (int[] edge : edges) {
        uf.union(edge[0], edge[1]);
    }
    return uf.getComponents();
}
```

---

## Worked Example 2: Redundant Connection

Find the edge that creates a cycle in an undirected graph.

```java
public int[] findRedundantConnection(int[][] edges) {
    UnionFind uf = new UnionFind(edges.length + 1);

    for (int[] edge : edges) {
        // If both endpoints are already connected, this edge is redundant
        if (!uf.union(edge[0], edge[1])) {
            return edge;
        }
    }
    return new int[0];
}
```

---

## Worked Example 3: Accounts Merge

```java
public List<List<String>> accountsMerge(List<List<String>> accounts) {
    Map<String, Integer> emailToId = new HashMap<>();
    int id = 0;

    // Assign each unique email an ID
    for (List<String> account : accounts) {
        for (int i = 1; i < account.size(); i++) {
            emailToId.putIfAbsent(account.get(i), id++);
        }
    }

    UnionFind uf = new UnionFind(id);

    // Union all emails in the same account
    for (List<String> account : accounts) {
        int firstId = emailToId.get(account.get(1));
        for (int i = 2; i < account.size(); i++) {
            uf.union(firstId, emailToId.get(account.get(i)));
        }
    }

    // Group emails by root component
    Map<Integer, TreeSet<String>> components = new HashMap<>();
    for (Map.Entry<String, Integer> entry : emailToId.entrySet()) {
        int root = uf.find(entry.getValue());
        components.computeIfAbsent(root, k -> new TreeSet<>()).add(entry.getKey());
    }

    // Build result: attach account owner name
    Map<String, String> emailToName = new HashMap<>();
    for (List<String> account : accounts) {
        for (int i = 1; i < account.size(); i++) {
            emailToName.put(account.get(i), account.get(0));
        }
    }

    List<List<String>> result = new ArrayList<>();
    for (TreeSet<String> group : components.values()) {
        List<String> merged = new ArrayList<>();
        merged.add(emailToName.get(group.first()));
        merged.addAll(group);
        result.add(merged);
    }
    return result;
}
```

---

## Complexity

| Operation | With path compression + union by rank |
|---|---|
| Find | O(α(n)) ≈ O(1) |
| Union | O(α(n)) ≈ O(1) |
| Space | O(n) |

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Key Idea |
|---|---|---|
| 547 | [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) | Count components |
| 1971 | [Find if Path Exists in Graph](https://leetcode.com/problems/find-if-path-exists-in-graph/) | Connected check |

### 🟡 Medium
| # | Problem | Key Idea |
|---|---|---|
| 200 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Union grid cells |
| 261 | [Graph Valid Tree](https://leetcode.com/problems/graph-valid-tree/) | n-1 edges + no cycle |
| 323 | [Number of Connected Components](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) | Classic DSU |
| 684 | [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | Detect cycle edge |
| 721 | [Accounts Merge](https://leetcode.com/problems/accounts-merge/) | Email grouping |
| 990 | [Satisfiability of Equality Equations](https://leetcode.com/problems/satisfiability-of-equality-equations/) | Union equalities |

### 🔴 Hard
| # | Problem | Key Idea |
|---|---|---|
| 685 | [Redundant Connection II](https://leetcode.com/problems/redundant-connection-ii/) | Directed graph cycle |
| 952 | [Largest Component Size by Common Factor](https://leetcode.com/problems/largest-component-size-by-common-factor/) | Factor union |
