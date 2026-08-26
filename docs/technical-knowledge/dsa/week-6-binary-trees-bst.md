---
id: week-6-binary-trees-bst
title: "Week 6: Binary Trees & BSTs"
description: Move from linear to hierarchical data structures. Master Depth-First Search (DFS), Breadth-First Search (BFS), and the properties of Binary Search Trees in Java.
tags: [dsa, java, binary-tree, bst, dfs, bfs, algorithms, week-6]
sidebar_position: 6
---

import DsaWeek6BinaryTreeDiagram from '@site/src/components/DsaWeek6BinaryTreeDiagram';

# Week 6: Binary Trees & BSTs

## 1. Overview

Welcome to Week 6! It is time to leave linear data structures (arrays, strings, linked lists) behind and step into the multi-dimensional world of **Hierarchical Data**. This week focuses on **Binary Trees** and **Binary Search Trees (BSTs)**.

Trees are the underlying architecture for databases (B-Trees), file systems, DOM rendering, and decision engines. You will learn the two primary ways to traverse hierarchical data: plunging deep into the leaves (DFS) and exploring layer by layer (BFS).

**Goals for this week:**
- Understand Tree terminology: Root, Leaf, Height, Depth, and Ancestor.
- Master Depth-First Search (Pre-order, In-order, Post-order) using Recursion.
- Master Breadth-First Search (Level-order) using a Queue.
- Understand the strict mathematical properties of a Binary Search Tree.

### Knowledge You Need Before Starting

- Week 5 stack/queue mental models (LIFO and FIFO behavior).
- Basic recursion traceability from linked-list pointer practice.
- Comfort with class/object modeling for `TreeNode`.
- Confidence with null checks and branching edge cases.

---

## 2. Theory & Fundamentals

<DsaWeek6BinaryTreeDiagram />


### 2.1 Mental Model: Why Trees Exist

Think of real-world hierarchies:
- **Company org chart:** CEO → VPs → Managers → Employees
- **File system:** Root `/` → `home` → `user` → `documents` → `file.txt`
- **Decision tree:** "Is it raining?" → Yes → "Bring umbrella" / No → "Don't bring umbrella"

These relationships are naturally **parent-child**, not sequential. A tree captures this perfectly: one root, many branches, and leaves at the end.

```
Linear (Array):   [A] → [B] → [C] → [D]
                   ↑ can only go forward/backward

Hierarchical (Tree):
                      A (root)
                     / \
                    B   C
                   /     \
                  D       E (leaves)
                   ↑ can branch, explore multiple paths
```

**Why not just use an array of objects with parent IDs?** You could, but then every operation (search, insert, delete) requires scanning the entire array. A tree gives you $O(\log N)$ operations when balanced.

---

### 2.2 Tree Terminology (Critical for Interviews)

```
                1 (root) ← depth 0, height 3
               / \
              2   3      ← depth 1
             / \   \
            4   5   6    ← depth 2
           /
          7              ← depth 3 (leaf), this is the deepest leaf
```

| Term           | Definition                                  | Example from tree above                |
| -------------- | ------------------------------------------- | -------------------------------------- |
| **Root**       | The topmost node with no parent             | `1`                                    |
| **Leaf**       | A node with no children                     | `5`, `3`, `6`, `7`                     |
| **Parent**     | A node with children                        | `1` is parent of `2` and `3`           |
| **Child**      | Direct descendant of a node                 | `2` and `3` are children of `1`        |
| **Ancestor**   | Any node on the path from root to this node | For `7`: ancestors are `4`, `2`, `1`   |
| **Descendant** | Any node in the subtree rooted at this node | For `2`: descendants are `4`, `5`, `7` |
| **Sibling**    | Nodes with the same parent                  | `2` and `3` are siblings               |
| **Depth**      | Distance from root to this node             | Depth of `4` is 2                      |
| **Height**     | Distance from this node to its deepest leaf | Height of `2` is 2, height of `1` is 3 |
| **Level**      | All nodes at the same depth                 | Level 2 = `[4, 5, 6]`                  |

**Critical formulas to memorize:**
- Height of tree = depth of deepest leaf
- Number of nodes in a **perfect binary tree** of height $h$ = $2^(h+1) - 1$
- Maximum number of nodes at level $L$ = $2^L$
- Height of a **balanced** binary tree with $N$ nodes = $O(\log N)$
- Height of a **skewed** binary tree with $N$ nodes = $O(N)$ (degenerate into a linked list)

---

### 2.3 Binary Trees: Structure and Properties

A **Binary Tree** means each node has **at most** 2 children (can have 0, 1, or 2).

```
Valid Binary Tree:
       5
      / \
     3   8
    /
   1

Still Valid (not full, but binary):
       5
      /
     3
    /
   1   ← this is just a linked list, but still a "binary tree"
```

**Types of Binary Trees:**

| Type         | Definition                                                                  | Example                           |
| ------------ | --------------------------------------------------------------------------- | --------------------------------- |
| **Full**     | Every node has 0 or 2 children (never just 1)                               | All internal nodes have both kids |
| **Complete** | All levels fully filled except possibly the last, which fills left-to-right | Heap structure                    |
| **Perfect**  | All internal nodes have 2 children AND all leaves are at the same level     | $2^(h+1) - 1$ nodes               |
| **Balanced** | Height is $O(\log N)$ where $N$ is number of nodes                          | AVL, Red-Black trees              |
| **Skewed**   | Every node has at most one child (essentially a linked list)                | Worst-case BST                    |

---

### 2.4 Recursion: The Natural Way to Think About Trees

**Why recursion dominates tree problems:**

A tree is a **recursive data structure**. Every subtree is itself a tree. So tree problems naturally decompose into:
1. **Base case:** What do I do at `null` or a leaf?
2. **Recursive case:** Solve for left child, solve for right child, combine the results.

```
height(tree) = ???

Recursive insight:
height(tree) = 1 + max(height(left_subtree), height(right_subtree))

Base case:
height(null) = 0
```

**The Call Stack = Your Explorer's Backpack**

When you write `maxDepth(root.left)`, Java pushes a new stack frame. Think of it like:
- You're standing at node `5`.
- You tell your left-hand clone: "Go explore the left subtree, report back with its depth."
- While waiting, you tell your right-hand clone: "Go explore the right subtree."
- Once both return, you compute: `1 + max(leftDepth, rightDepth)`.

The call stack tracks all these "clones" waiting for their subtrees to report back.

**Stack Overflow Risk in Java:**

The JVM's default stack size is typically ~1MB, which allows about 5,000–10,000 nested calls depending on local variable size. A deeply skewed tree with 100,000 nodes will crash with `StackOverflowError`.

```java
// This will crash on a skewed tree with 100,000 nodes
public int countNodes(TreeNode root) {
    if (root == null) return 0;
    return 1 + countNodes(root.left) + countNodes(root.right);
}
```

**Solution:** For very deep trees, convert to iterative using an explicit `Stack<TreeNode>`.

---

### 2.5 DFS vs. BFS: When to Use Which

```
Tree:
       1
      / \
     2   3
    / \
   4   5

DFS Pre-order (Root → Left → Right):  1, 2, 4, 5, 3
DFS In-order  (Left → Root → Right):  4, 2, 5, 1, 3
DFS Post-order(Left → Right → Root):  4, 5, 2, 3, 1

BFS Level-order:  1, 2, 3, 4, 5
```

| Question Type                                | Use DFS or BFS? | Why?                                        |
| -------------------------------------------- | --------------- | ------------------------------------------- |
| "Find the depth/height of the tree"          | DFS (any order) | Natural recursion on subtrees               |
| "Is this tree symmetric?"                    | DFS Pre-order   | Mirror-check left vs right                  |
| "Print nodes level by level"                 | **BFS**         | Need to group by level                      |
| "Find the shortest path to a leaf"           | **BFS**         | BFS finds shortest path in unweighted trees |
| "Right side view" (rightmost node per level) | **BFS**         | Process level by level                      |
| "Validate BST"                               | DFS In-order    | In-order gives sorted output                |
| "Sum all root-to-leaf paths"                 | DFS Pre-order   | Build path as you go down                   |
| "Find diameter (longest path)"               | DFS Post-order  | Need child results before computing parent  |
| "Lowest common ancestor"                     | DFS Post-order  | Bubble up found nodes                       |
| "Serialize/Deserialize tree"                 | DFS Pre-order   | Need root first to rebuild                  |

**Memory comparison:**

|            | DFS (Recursive)                | BFS (Queue)                   |
| ---------- | ------------------------------ | ----------------------------- |
| Space      | $O(H)$ call stack (H = height) | $O(W)$ queue (W = max width)  |
| Best case  | Balanced tree: $O(\log N)$     | Skewed tree: $O(1)$           |
| Worst case | Skewed tree: $O(N)$            | Perfect tree: $O(N/2) = O(N)$ |

For a **perfect binary tree**, BFS uses more space because the last level has $N/2$ nodes all in the queue at once. For a **skewed tree**, DFS uses more space because the call stack is $N$ deep.

---

### 2.6 The Three DFS Traversals: What They Mean

**Pre-order (Root → Left → Right):**
- "Process root before children"
- Use when: Creating a copy, serializing, printing tree structure
- Think: "I need to know the parent before I can process children"

```java
void preorder(TreeNode node) {
    if (node == null) return;
    process(node);           // ← Root first
    preorder(node.left);     // ← Then left
    preorder(node.right);    // ← Then right
}
```

**In-order (Left → Root → Right):**
- "Process root between children"
- Use when: BST problems requiring sorted order
- Think: "I'm sweeping left to right across the tree"

```java
void inorder(TreeNode node) {
    if (node == null) return;
    inorder(node.left);      // ← Left first
    process(node);           // ← Root in the middle
    inorder(node.right);     // ← Right last
}
```

**Post-order (Left → Right → Root):**
- "Process root after children"
- Use when: Calculating properties that depend on child results (height, diameter, deleting nodes)
- Think: "I can't know anything about this node until I've explored its children"

```java
void postorder(TreeNode node) {
    if (node == null) return;
    postorder(node.left);    // ← Left first
    postorder(node.right);   // ← Right second
    process(node);           // ← Root last (after getting child results)
}
```

---

### 2.7 Binary Search Trees: The Sorted Superpower

A **Binary Search Tree (BST)** is a binary tree where:
1. All values in the **left subtree** < current node
2. All values in the **right subtree** > current node
3. No duplicate values (standard convention)
4. Both left and right subtrees are also BSTs (recursive property)

```
Valid BST:
       8
      / \
     3   10
    / \    \
   1   6    14
      / \   /
     4   7 13

WHY? At node 8:
- Left subtree [1,3,4,6,7] are ALL < 8 ✅
- Right subtree [10,13,14] are ALL > 8 ✅

Invalid BST:
       8
      / \
     3   10
    / \    \
   1   6    14
      / \   /
     4   9 13  ← 9 is in right subtree of 8 but < 8 ❌
```

**The Key Insight: In-order traversal of a BST gives sorted order**

```
In-order of valid BST above: 1, 3, 4, 6, 7, 8, 10, 13, 14  ← Sorted! ✅
```

**Operations on a balanced BST:**

| Operation      | Time        | Why                               |
| -------------- | ----------- | --------------------------------- |
| Search         | $O(\log N)$ | Eliminate half the tree each step |
| Insert         | $O(\log N)$ | Search for position, attach       |
| Delete         | $O(\log N)$ | Find node, rearrange pointers     |
| Find min/max   | $O(\log N)$ | Go all the way left/right         |
| Find successor | $O(\log N)$ | Smallest in right subtree         |

**Degenerate case (skewed tree):** All operations degrade to $O(N)$ — the tree is just a linked list.

```
Skewed BST (worst case):
1
 \
  2
   \
    3
     \
      4  ← search for 4 takes O(N) steps, not O(log N)
```

**Solution:** Self-balancing trees like AVL or Red-Black trees guarantee $O(\log N)$ height through rotations.

---

### 2.8 Common BST Validation Mistake

**WRONG approach — only checking immediate children:**

```java
// ❌ This is INCORRECT — fails on the example below
boolean isValidBST(TreeNode root) {
    if (root == null) return true;
    if (root.left != null && root.left.val >= root.val) return false;
    if (root.right != null && root.right.val <= root.val) return false;
    return isValidBST(root.left) && isValidBST(root.right);
}
```

This fails on:
```
    10
   /  \
  5    15
      /  \
     6   20   ← 6 < 15 ✅ but 6 < 10 ❌ (violates BST: right subtree must be > 10)
```

**CORRECT approach — passing valid range bounds:**

Every node must fall within a range `(min, max)`. As you go left, update `max`. As you go right, update `min`.

```java
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val) &&    // left: shrink upper bound
           validate(node.right, node.val, max);     // right: shrink lower bound
}
```

---

## 3. Code Templates (Java)

### The Standard `TreeNode` Class

```java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
```

### Template 1: BFS / Level-Order Traversal

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size(); // Critical: lock in current level size
        List<Integer> currentLevel = new ArrayList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode curr = queue.poll();
            currentLevel.add(curr.val);

            if (curr.left != null) queue.offer(curr.left);
            if (curr.right != null) queue.offer(curr.right);
        }
        result.add(currentLevel);
    }
    return result;
}
```

**Why `levelSize` matters:** Without it, you'd mix nodes from different levels in the same iteration. By locking in the size, you process exactly one level per outer loop iteration.

**Variant: Right Side View**
```java
// Return the rightmost node of each level
public List<Integer> rightSideView(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        TreeNode rightmost = null;

        for (int i = 0; i < levelSize; i++) {
            TreeNode curr = queue.poll();
            rightmost = curr; // last node polled = rightmost

            if (curr.left != null) queue.offer(curr.left);
            if (curr.right != null) queue.offer(curr.right);
        }
        result.add(rightmost.val);
    }
    return result;
}
```

### Template 2: DFS Pre-order (Recursive)

```java
// Use for: copying, serializing, building paths
public void preorder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    result.add(root.val);       // Process root first
    preorder(root.left, result);
    preorder(root.right, result);
}
```

### Template 3: DFS In-order (Recursive)

```java
// Use for: BST problems requiring sorted order
public void inorder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    inorder(root.left, result);
    result.add(root.val);        // Process root in the middle
    inorder(root.right, result);
}
```

### Template 4: DFS Post-order (Recursive)

```java
// Use for: height, diameter, deletion (need child results first)
public int maxDepth(TreeNode root) {
    if (root == null) return 0;  // Base case

    int leftDepth = maxDepth(root.left);   // Get left result
    int rightDepth = maxDepth(root.right); // Get right result

    return 1 + Math.max(leftDepth, rightDepth); // Combine
}
```

### Template 5: DFS Iterative (Using Stack)

```java
// Pre-order iterative (useful for deep trees to avoid StackOverflowError)
public List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode curr = stack.pop();
        result.add(curr.val);

        // Push right first so left is processed first (stack is LIFO)
        if (curr.right != null) stack.push(curr.right);
        if (curr.left != null) stack.push(curr.left);
    }
    return result;
}
```

### Template 6: BST Search

```java
// Iterative (preferred for BST — no call stack overhead)
public TreeNode searchBST(TreeNode root, int target) {
    TreeNode curr = root;
    while (curr != null) {
        if (target == curr.val) return curr;
        else if (target < curr.val) curr = curr.left;
        else curr = curr.right;
    }
    return null;
}
```

### Template 7: BST Insert

```java
public TreeNode insertIntoBST(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);

    if (val < root.val) {
        root.left = insertIntoBST(root.left, val);
    } else {
        root.right = insertIntoBST(root.right, val);
    }
    return root;
}
```

### Template 8: BST Validation (Range Bounds)

```java
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;

    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}
```

### Template 9: Path Sum (Root to Leaf)

```java
public boolean hasPathSum(TreeNode root, int targetSum) {
    if (root == null) return false;

    // Leaf node check
    if (root.left == null && root.right == null) {
        return root.val == targetSum;
    }

    int remaining = targetSum - root.val;
    return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}
```

### Template 10: Lowest Common Ancestor (LCA)

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // If both sides found a target, current root is the LCA
    if (left != null && right != null) return root;

    // Otherwise return whichever side found something
    return left != null ? left : right;
}
```

### Template 11: Tree Diameter (Longest Path)

```java
class Solution {
    private int maxDiameter = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        height(root);
        return maxDiameter;
    }

    private int height(TreeNode node) {
        if (node == null) return 0;

        int leftHeight = height(node.left);
        int rightHeight = height(node.right);

        // Diameter through this node = left height + right height
        maxDiameter = Math.max(maxDiameter, leftHeight + rightHeight);

        return 1 + Math.max(leftHeight, rightHeight);
    }
}
```

---

## 4. Problem-Solving Framework

### Step 1 — Clarify (2 minutes)

Ask these questions:
- Is this a binary tree or specifically a BST? (BST unlocks in-order sorted optimization)
- Can node values be negative? Zero? Duplicates?
- Can the tree be empty (`root == null`)?
- For path problems: Does the path have to start at root and end at a leaf?
- For BST: Are values unique?
- Memory constraints: Can I use $O(N)$ space or must it be $O(H)$?

### Step 2 — Draw the Tree

**Always draw at least two test cases:**
1. A balanced tree
2. A skewed tree (or other edge case: single node, empty, all left children, etc.)

```
Example: "Find max depth"

Balanced:         Skewed:
    1               1
   / \               \
  2   3               2
 /                     \
4                       3

Expected: 3          Expected: 3
```

### Step 3 — Identify Traversal Type

| Signal                                                    | Traversal                             |
| --------------------------------------------------------- | ------------------------------------- |
| "Level by level", "Shortest path", "Right side view"      | **BFS**                               |
| "Sorted", "K-th smallest" (in BST)                        | **DFS In-order**                      |
| "Copy", "Serialize", "Path from root"                     | **DFS Pre-order**                     |
| "Height", "Diameter", "Validate", "Bottom-up calculation" | **DFS Post-order**                    |
| "Symmetric", "Mirror"                                     | **DFS Pre-order** (with custom logic) |

### Step 4 — Write the Base Case First

The base case is the foundation of your recursion. Always write it before the recursive calls.

```java
// Base case for most tree problems:
if (root == null) return /* appropriate value */;
    // return 0 for height/count
    // return null for finding a node
    // return true for validation (empty trees are valid)
    // return false for path sum (no path exists)
```

### Step 5 — Think "What Do I Need From My Children?"

This is the key to post-order thinking:
- **Height:** I need the height of left and right, then return `1 + max(left, right)`
- **Balanced:** I need the height of both sides and whether they're balanced. If heights differ by more than 1, return false.
- **Diameter:** I need the height of both sides. The diameter through this node is `leftHeight + rightHeight`.

### Step 6 — Code and Test

Walk through your code manually with the drawn examples. Check:
- Does it handle `root == null`?
- Does it handle a single-node tree?
- Does it correctly combine left and right results?

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| What the problem says                   | Pattern                          | Key technique                                |
| --------------------------------------- | -------------------------------- | -------------------------------------------- |
| "Print/return nodes level by level"     | **BFS**                          | Queue + `levelSize` loop                     |
| "Right side view", "Zigzag level order" | **BFS**                          | Track level, maybe reverse                   |
| "Shortest path to a leaf"               | **BFS**                          | BFS finds shortest path                      |
| "Is tree symmetric?"                    | **DFS Pre-order**                | Recursively compare left.left vs right.right |
| "Is tree balanced?"                     | **DFS Post-order**               | Need child heights to check balance          |
| "Find diameter"                         | **DFS Post-order**               | Track max path through each node             |
| "Validate BST"                          | **DFS In-order** or Range Bounds | In-order should be sorted                    |
| "K-th smallest in BST"                  | **DFS In-order**                 | Stop at K-th element                         |
| "Lowest common ancestor"                | **DFS Post-order**               | Bubble up found nodes                        |
| "Path sum", "All paths"                 | **DFS Pre-order**                | Build path going down                        |
| "Serialize/Deserialize"                 | **DFS Pre-order**                | Process root before children                 |
| "Invert tree"                           | **DFS Pre-order**                | Swap children before recursing               |
| "Delete node in BST"                    | **DFS**                          | 3 cases: no children, 1 child, 2 children    |
| "Construct from traversals"             | **DFS**                          | Use indices to split left/right              |

---

### Detailed Recognition Walkthroughs

#### Recognizing Post-Order (LC 543 — Diameter)

When you see: *"Find the longest path between any two nodes"*
1. "The longest path through a node = left height + right height."
2. "But I can't compute this until I know the heights of my children."
3. "I need to calculate height for every node and track the max diameter."
4. Post-order: get left height, get right height, then compute diameter through current node.

#### Recognizing BFS (LC 102 — Level Order)

When you see: *"Return nodes grouped by level"*
1. "I need to process all nodes at depth 0, then depth 1, then depth 2, etc."
2. "DFS doesn't naturally group by level — it goes deep first."
3. "BFS with a queue naturally processes level by level."
4. Use the `levelSize = queue.size()` trick to avoid mixing levels.

#### Recognizing BST In-Order (LC 230 — K-th Smallest)

When you see: *"Find the K-th smallest element in a BST"*
1. "BST in-order traversal gives sorted order."
2. "Just do in-order and stop at the K-th element."
3. Use a counter variable to track how many nodes processed.

#### Recognizing Range Validation (LC 98 — Validate BST)

When you see: *"Determine if a tree is a valid BST"*
1. "Checking only immediate children is not enough."
2. "Every node must satisfy: `min < node.val < max`."
3. "As I recurse left, the max shrinks to current node's value."
4. "As I recurse right, the min grows to current node's value."

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Forgetting the Null Check

```java
// ❌ NullPointerException when root is null
public int maxDepth(TreeNode root) {
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

// ✅ Always check null first
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### Mistake 2: Confusing Pre-order vs. Post-order

```java
// Problem: Find height

// ❌ WRONG — pre-order processes root before getting child results
public int height(TreeNode root) {
    if (root == null) return 0;
    int h = 1; // trying to compute height before knowing child heights?
    // How can we know the height without asking children first?
}

// ✅ CORRECT — post-order gets child results first
public int height(TreeNode root) {
    if (root == null) return 0;
    int left = height(root.left);   // get left child's answer
    int right = height(root.right); // get right child's answer
    return 1 + Math.max(left, right); // then compute own answer
}
```

### Mistake 3: Not Using the `levelSize` Trick in BFS

```java
// ❌ WRONG — mixes levels together
while (!queue.isEmpty()) {
    TreeNode curr = queue.poll();
    result.add(curr.val); // all nodes end up in one big list, not grouped by level
    if (curr.left != null) queue.offer(curr.left);
    if (curr.right != null) queue.offer(curr.right);
}

// ✅ CORRECT — lock in level size
while (!queue.isEmpty()) {
    int levelSize = queue.size();
    List<Integer> level = new ArrayList<>();
    for (int i = 0; i < levelSize; i++) {
        TreeNode curr = queue.poll();
        level.add(curr.val);
        if (curr.left != null) queue.offer(curr.left);
        if (curr.right != null) queue.offer(curr.right);
    }
    result.add(level); // each level is separate
}
```

### Mistake 4: Only Checking Immediate Children in BST Validation

```java
// ❌ WRONG — fails when a right grandchild is < root
public boolean isValidBST(TreeNode root) {
    if (root == null) return true;
    if (root.left != null && root.left.val >= root.val) return false;
    if (root.right != null && root.right.val <= root.val) return false;
    return isValidBST(root.left) && isValidBST(root.right);
}

// ✅ CORRECT — pass min/max bounds down
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}
```

### Mistake 5: Forgetting to Handle Leaf Nodes in Path Problems

```java
// Problem: Path sum from root to leaf

// ❌ WRONG — considers any node, not just leaves
public boolean hasPathSum(TreeNode root, int sum) {
    if (root == null) return false;
    if (root.val == sum) return true; // ← what if this is not a leaf?
    return hasPathSum(root.left, sum - root.val) || ...
}

// ✅ CORRECT — check that it's a leaf
public boolean hasPathSum(TreeNode root, int sum) {
    if (root == null) return false;
    // Only check sum at a LEAF node
    if (root.left == null && root.right == null) {
        return root.val == sum;
    }
    int remaining = sum - root.val;
    return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}
```

### Mistake 6: Modifying Tree Structure During Traversal

```java
// ❌ DANGEROUS — deleting nodes while recursing can lose references
public void deleteNodes(TreeNode root) {
    if (root == null) return;
    if (shouldDelete(root.left)) root.left = null; // might lose entire subtree!
    deleteNodes(root.left);
    // ...
}

// ✅ SAFE — process children first (post-order), then decide on current
public TreeNode deleteNodes(TreeNode root) {
    if (root == null) return null;
    root.left = deleteNodes(root.left);   // clean left first
    root.right = deleteNodes(root.right); // clean right first
    if (shouldDelete(root)) return null;  // then decide on current
    return root;
}
```

---

## 7. Worked Examples

### Example 1: LeetCode 226 — Invert Binary Tree

**Thinking process:**
1. "Inverting means swapping left and right at every node."
2. "I should do this top-down (pre-order) so the swap happens before recursing."

```java
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;

        // Swap the children
        TreeNode temp = root.left;
        root.left = root.right;
        root.right = temp;

        // Recursively invert the subtrees
        invertTree(root.left);
        invertTree(root.right);

        return root;
    }
}
```

Dry run for tree:
```
Before:   1          After:   1
         / \                 / \
        2   3               3   2

Step 1: At node 1, swap 2 and 3 → root.left=3, root.right=2
Step 2: Recurse on 3 (no children, return)
Step 3: Recurse on 2 (no children, return)
Result: ✅
```

*Time: $O(N)$. Space: $O(H)$ call stack.*

---

### Example 2: LeetCode 98 — Validate Binary Search Tree

**Thinking process:**
1. "Checking only immediate children doesn't work (see Section 2.8)."
2. "Every node must satisfy `min < node.val < max`."
3. "As I go left, max becomes node.val. As I go right, min becomes node.val."

```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private boolean validate(TreeNode node, long min, long max) {
        if (node == null) return true; // Empty trees are valid

        if (node.val <= min || node.val >= max) return false;

        // Left: upper bound shrinks to node.val
        // Right: lower bound grows to node.val
        return validate(node.left, min, node.val) &&
               validate(node.right, node.val, max);
    }
}
```

Dry run:
```
Tree:    8              Call stack:
        / \
       3   10           validate(8, -∞, +∞)
      / \    \            8 is in (-∞, +∞) ✅
     1   6    14          ├─ validate(3, -∞, 8)
        / \   /           │    3 is in (-∞, 8) ✅
       4   7 13           │    ├─ validate(1, -∞, 3) → 1 in (-∞, 3) ✅
                          │    └─ validate(6, 3, 8)
                          │         6 is in (3, 8) ✅
                          │         ├─ validate(4, 3, 6) → 4 in (3, 6) ✅
                          │         └─ validate(7, 6, 8) → 7 in (6, 8) ✅
                          └─ validate(10, 8, +∞)
                               10 is in (8, +∞) ✅
                               └─ validate(14, 10, +∞)
                                    14 is in (10, +∞) ✅
                                    └─ validate(13, 10, 14) → 13 in (10, 14) ✅

Result: true ✅
```

*Time: $O(N)$. Space: $O(H)$.*

---

### Example 3: LeetCode 102 — Binary Tree Level Order Traversal

**Thinking process:**
1. "Need to group nodes by level → BFS."
2. "Use queue + lock in `levelSize` each iteration."

```java
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;

        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> currentLevel = new ArrayList<>();

            for (int i = 0; i < levelSize; i++) {
                TreeNode curr = queue.poll();
                currentLevel.add(curr.val);

                if (curr.left != null) queue.offer(curr.left);
                if (curr.right != null) queue.offer(curr.right);
            }
            result.add(currentLevel);
        }
        return result;
    }
}
```

Dry run:
```
Tree:     3
         / \
        9  20
          /  \
         15   7

Initial: queue = [3], result = []
Level 0: levelSize=1, poll(3), add 9,20 to queue → currentLevel=[3] → result=[[3]]
Level 1: levelSize=2, poll(9), poll(20), add 15,7 → currentLevel=[9,20] → result=[[3],[9,20]]
Level 2: levelSize=2, poll(15), poll(7) → currentLevel=[15,7] → result=[[3],[9,20],[15,7]]

Result: [[3],[9,20],[15,7]] ✅
```

*Time: $O(N)$. Space: $O(W)$ where W is max width.*

---

### Example 4: LeetCode 543 — Diameter of Binary Tree

**Thinking process:**
1. "Diameter through a node = left height + right height."
2. "I need to compute height for every node → post-order."
3. "Track a global max diameter as I go."

```java
class Solution {
    private int maxDiameter = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        height(root);
        return maxDiameter;
    }

    private int height(TreeNode node) {
        if (node == null) return 0;

        int leftHeight = height(node.left);
        int rightHeight = height(node.right);

        // Diameter through this node
        int diameterThroughNode = leftHeight + rightHeight;
        maxDiameter = Math.max(maxDiameter, diameterThroughNode);

        return 1 + Math.max(leftHeight, rightHeight);
    }
}
```

Dry run:
```
Tree:     1
         / \
        2   3
       / \
      4   5

height(4): returns 1
height(5): returns 1
height(2): leftHeight=1, rightHeight=1, diameter=2, maxDiameter=2, returns 2
height(3): returns 1
height(1): leftHeight=2, rightHeight=1, diameter=3, maxDiameter=3, returns 3

Result: 3 ✅ (path: 4 → 2 → 1 → 3, length 3 edges)
```

*Time: $O(N)$. Space: $O(H)$.*

---

### Example 5: LeetCode 236 — Lowest Common Ancestor (LCA)

**Thinking process:**
1. "If left subtree has one target and right has the other, current node is the LCA."
2. "Use post-order: get results from children first, then decide at parent."

```java
class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null) return null;
        if (root == p || root == q) return root; // found one of the targets

        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);

        // Both children returned a target → current node is the LCA
        if (left != null && right != null) return root;

        // Only one side found something → propagate it up
        return left != null ? left : right;
    }
}
```

*Time: $O(N)$. Space: $O(H)$.*

---

## 8. Decision Tree: Which Tree Pattern?

```
What does the problem need?
├── Group nodes by level?
│   └── YES → BFS with levelSize loop
│
├── Sorted order from BST?
│   └── YES → DFS In-order
│
├── Need child results before computing parent?
│   └── YES → DFS Post-order
│       Examples: height, diameter, balanced, LCA
│
├── Build something top-down (path, copy, serialize)?
│   └── YES → DFS Pre-order
│
├── Check structural property (symmetric, invert)?
│   └── YES → DFS Pre-order with custom logic
│
└── Validate BST?
    └── Use range bounds OR in-order check for sorted
```

---

## 9. Complexity Cheat Sheet

| Operation                    | Time           | Space                                   |
| ---------------------------- | -------------- | --------------------------------------- |
| Traverse full tree (DFS/BFS) | $O(N)$         | DFS: $O(H)$, BFS: $O(W)$                |
| Find height/depth            | $O(N)$         | $O(H)$ call stack                       |
| Level order traversal        | $O(N)$         | $O(W)$ queue (W = max width)            |
| BST search (balanced)        | $O(\log N)$    | $O(1)$ iterative, $O(\log N)$ recursive |
| BST search (skewed)          | $O(N)$         | $O(1)$ iterative, $O(N)$ recursive      |
| BST insert/delete (balanced) | $O(\log N)$    | $O(\log N)$ recursive                   |
| Validate BST                 | $O(N)$         | $O(H)$                                  |
| LCA                          | $O(N)$         | $O(H)$                                  |
| Serialize/Deserialize        | $O(N)$         | $O(N)$ string, $O(H)$ call stack        |
| Count nodes in perfect tree  | $O(\log^2 N)$* | $O(\log N)$                             |

*Count nodes in perfect tree: Check if left and right heights are equal. If yes, use formula $2^h - 1$. If no, recurse.

---

## 10. 7-Day Practice Plan (21 Problems)

**Day 1: DFS Fundamentals**
1. [Invert Binary Tree (LC 226)](https://leetcode.com/problems/invert-binary-tree/) — Pre-order swap
2. [Maximum Depth of Binary Tree (LC 104)](https://leetcode.com/problems/maximum-depth-of-binary-tree/) — Post-order height
3. [Same Tree (LC 100)](https://leetcode.com/problems/same-tree/) — Pre-order structural check

**Day 2: BFS / Level-Order Traversal**
4. [Binary Tree Level Order Traversal (LC 102)](https://leetcode.com/problems/binary-tree-level-order-traversal/) — Classic BFS
5. [Binary Tree Right Side View (LC 199)](https://leetcode.com/problems/binary-tree-right-side-view/) — BFS variant
6. [Binary Tree Zigzag Level Order Traversal (LC 103)](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/) — BFS + reverse

**Day 3: Tree Properties & Post-Order Processing**
7. [Diameter of Binary Tree (LC 543)](https://leetcode.com/problems/diameter-of-binary-tree/) ⭐ — Global max tracking
8. [Balanced Binary Tree (LC 110)](https://leetcode.com/problems/balanced-binary-tree/) — Height + balance check
9. [Symmetric Tree (LC 101)](https://leetcode.com/problems/symmetric-tree/) — Pre-order mirror check

**Day 4: Path Finding & Backtracking**
10. [Path Sum (LC 112)](https://leetcode.com/problems/path-sum/) — Root to leaf path
11. [Path Sum II (LC 113)](https://leetcode.com/problems/path-sum-ii/) — Collect all paths
12. [Sum Root to Leaf Numbers (LC 129)](https://leetcode.com/problems/sum-root-to-leaf-numbers/) — Build number as you go

**Day 5: BST Fundamentals**
13. [Search in a Binary Search Tree (LC 700)](https://leetcode.com/problems/search-in-a-binary-search-tree/) — BST property
14. [Insert into a Binary Search Tree (LC 701)](https://leetcode.com/problems/insert-into-a-binary-search-tree/) — Recursive insert
15. [Lowest Common Ancestor of a BST (LC 235)](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) — BST-specific LCA

**Day 6: Advanced BST & Validation**
16. [Validate Binary Search Tree (LC 98)](https://leetcode.com/problems/validate-binary-search-tree/) ⭐ — Range bounds
17. [Kth Smallest Element in a BST (LC 230)](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) — In-order counting
18. [Delete Node in a BST (LC 450)](https://leetcode.com/problems/delete-node-in-a-bst/) — 3 cases (hard pointer work)

**Day 7: Construction & Advanced**
19. [Construct Binary Tree from Preorder and Inorder (LC 105)](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) — Index splitting
20. [Flatten Binary Tree to Linked List (LC 114)](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/) — Pre-order flattening
21. [Subtree of Another Tree (LC 572)](https://leetcode.com/problems/subtree-of-another-tree/) — Recursive structure check

---

## 11. Mock Interview Module

### Problem: The Distributed Version Control Merge-Base

**Context:** You are building the backend for a new internal Git-like version control system. Commits form a strictly branching Binary Tree (ignoring complex DAG merges). When a developer wants to merge two branches, the system must find the "merge-base" — the most recent common ancestor commit.

**Question:** Write `public CommitNode findMergeBase(CommitNode root, CommitNode branchA, CommitNode branchB)` that returns the lowest common ancestor.

*(Assume `CommitNode` = `TreeNode`. All node values are unique. Both `branchA` and `branchB` are guaranteed to exist.)*

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                           | Interviewer answers                  | Why it matters                 |
| ---------------------------------------- | ------------------------------------ | ------------------------------ |
| "Do nodes have a `parent` pointer?"      | No, only `left`/`right`              | Rules out bottom-up traversal  |
| "Can a node be its own ancestor?"        | Yes, if branchA is parent of branchB | Edge case handling             |
| "Are both branches guaranteed to exist?" | Yes                                  | No need for null checks on p/q |
| "Is the tree a BST?"                     | No, just a binary tree               | Can't use BST optimization     |

---

#### Step 2: Brute Force Solution

```java
// Time: O(N), Space: O(N) for path arrays
// Find path to branchA, find path to branchB, compare paths until they diverge
public CommitNode findMergeBase(CommitNode root, CommitNode a, CommitNode b) {
    List<CommitNode> pathA = new ArrayList<>();
    List<CommitNode> pathB = new ArrayList<>();
    findPath(root, a, pathA);
    findPath(root, b, pathB);
    
    CommitNode lca = null;
    for (int i = 0; i < Math.min(pathA.size(), pathB.size()); i++) {
        if (pathA.get(i) == pathB.get(i)) lca = pathA.get(i);
        else break;
    }
    return lca;
}

private boolean findPath(CommitNode node, CommitNode target, List<CommitNode> path) {
    if (node == null) return false;
    path.add(node);
    if (node == target) return true;
    if (findPath(node.left, target, path) || findPath(node.right, target, path)) {
        return true;
    }
    path.remove(path.size() - 1); // backtrack
    return false;
}
```

**Explain:** "This works but requires two full tree traversals and $O(N)$ space for paths. Can we do it in one pass?"

---

#### Step 3: Optimized Solution (DFS Post-Order)

```java
// Time: O(N), Space: O(H) call stack
public CommitNode findMergeBase(CommitNode root, CommitNode branchA, CommitNode branchB) {
    // Base cases
    if (root == null) return null;
    if (root == branchA || root == branchB) return root; // found a target

    // Recursively search left and right subtrees
    CommitNode leftResult = findMergeBase(root.left, branchA, branchB);
    CommitNode rightResult = findMergeBase(root.right, branchA, branchB);

    // If both sides found a target, current node is the LCA
    if (leftResult != null && rightResult != null) return root;

    // Otherwise return whichever side found something
    return leftResult != null ? leftResult : rightResult;
}
```

**Walk through the logic:**
```
Tree:        3
           /   \
          5     1
         / \   / \
        6   2 0   8
           / \
          7   4

Find LCA of 5 and 1:

Call stack (simplified):
lca(3, 5, 1):
  leftResult = lca(5, 5, 1) → returns 5 (found branchA)
  rightResult = lca(1, 5, 1) → returns 1 (found branchB)
  Both non-null → return 3 ✅

Find LCA of 7 and 4:
lca(3, 7, 4):
  leftResult = lca(5, 7, 4):
    leftResult = lca(6, 7, 4) → null
    rightResult = lca(2, 7, 4):
      leftResult = lca(7, 7, 4) → returns 7
      rightResult = lca(4, 7, 4) → returns 4
      Both non-null → return 2 ✅
    return 2
  return 2
  rightResult = lca(1, 7, 4) → null
  return 2 ✅
```

*Time: $O(N)$. Space: $O(H)$ call stack.*

---

#### Step 4: Follow-up Questions

**Q1:** "What if this was a BST based on commit timestamps?"

*Expected answer:*
"If it's a BST, I can optimize using the BST property:
- If both nodes are smaller than root, LCA is in left subtree.
- If both nodes are larger than root, LCA is in right subtree.
- Otherwise, current node is the LCA (split point).

This reduces average case from $O(N)$ to $O(\log N)$ in a balanced BST, and I can do it iteratively for $O(1)$ space."

```java
public CommitNode findMergeBaseBST(CommitNode root, CommitNode p, CommitNode q) {
    CommitNode curr = root;
    while (curr != null) {
        if (p.val < curr.val && q.val < curr.val) {
            curr = curr.left; // both in left subtree
        } else if (p.val > curr.val && q.val > curr.val) {
            curr = curr.right; // both in right subtree
        } else {
            return curr; // split point = LCA
        }
    }
    return null;
}
```

**Q2:** "How would you handle a tree with millions of commits that doesn't fit in memory?"

*Expected answer:*
"If the tree is on disk, I'd use a database index (B+ tree) on commit IDs. For LCA queries, I'd:
1. Load only the path from root to branchA.
2. Load only the path from root to branchB.
3. Compare paths to find divergence point.
4. Each path load is $O(\log N)$ disk I/O in a balanced tree.

Alternatively, store parent pointers in the database. Then:
1. Traverse from branchA to root, mark all ancestors in a HashSet.
2. Traverse from branchB to root, return first ancestor found in the set.
This requires two index lookups but works for very deep trees."

---

## 12. Quick Reference: Tree Idioms in Java

```java
// ── TREE NODE ─────────────────────────────────────────────────────────────
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

// ── NULL SAFETY ───────────────────────────────────────────────────────────
// ALWAYS null-check before accessing .left or .right
if (root == null) return /* base case */;

// ── QUEUE SETUP FOR BFS ───────────────────────────────────────────────────
Queue<TreeNode> queue = new ArrayDeque<>();  // preferred over LinkedList
queue.offer(root);  // add
TreeNode node = queue.poll();  // remove

// ── LEVEL SIZE TRICK ──────────────────────────────────────────────────────
while (!queue.isEmpty()) {
    int levelSize = queue.size(); // lock in current level
    for (int i = 0; i < levelSize; i++) {
        TreeNode curr = queue.poll();
        // process curr
        if (curr.left != null) queue.offer(curr.left);
        if (curr.right != null) queue.offer(curr.right);
    }
}

// ── LEAF NODE CHECK ───────────────────────────────────────────────────────
if (node.left == null && node.right == null) {
    // node is a leaf
}

// ── RECURSIVE TEMPLATE ────────────────────────────────────────────────────
int solve(TreeNode node) {
    if (node == null) return /* base */;
    int left = solve(node.left);
    int right = solve(node.right);
    return /* combine(left, right) */;
}

// ── GLOBAL VARIABLE FOR TRACKING ──────────────────────────────────────────
class Solution {
    private int maxDiameter = 0;  // track across all recursion
    public int diameterOfBinaryTree(TreeNode root) {
        height(root);
        return maxDiameter;
    }
    private int height(TreeNode node) {
        // update maxDiameter in post-order
    }
}

// ── BST ITERATIVE SEARCH (NO RECURSION) ───────────────────────────────────
TreeNode curr = root;
while (curr != null) {
    if (target == curr.val) return curr;
    else if (target < curr.val) curr = curr.left;
    else curr = curr.right;
}

// ── BUILDING A TREE FROM ARRAY (for testing) ─────────────────────────────
// Use level-order with null markers
TreeNode buildTree(Integer[] arr) {
    if (arr == null || arr.length == 0) return null;
    TreeNode root = new TreeNode(arr[0]);
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    int i = 1;
    while (i < arr.length) {
        TreeNode curr = queue.poll();
        if (arr[i] != null) {
            curr.left = new TreeNode(arr[i]);
            queue.offer(curr.left);
        }
        i++;
        if (i < arr.length && arr[i] != null) {
            curr.right = new TreeNode(arr[i]);
            queue.offer(curr.right);
        }
        i++;
    }
    return root;
}
```