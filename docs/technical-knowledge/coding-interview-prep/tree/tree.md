---
id: tree
title: Tree
sidebar_position: 8
description: Master binary tree traversals, properties, and interview patterns
---

# 🌲 Tree

## Concept

A **Binary Tree** is a hierarchical structure where each node has at most two children (left and right). A **Binary Search Tree (BST)** adds the invariant: `left < node < right` for every node.

```java
// Standard TreeNode definition
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}
```

---

## Tree Traversals

### DFS Traversals (Recursive)
```java
// Preorder: Root → Left → Right
void preorder(TreeNode node) {
    if (node == null) return;
    visit(node);
    preorder(node.left);
    preorder(node.right);
}

// Inorder: Left → Root → Right (BST gives sorted order!)
void inorder(TreeNode node) {
    if (node == null) return;
    inorder(node.left);
    visit(node);
    inorder(node.right);
}

// Postorder: Left → Right → Root
void postorder(TreeNode node) {
    if (node == null) return;
    postorder(node.left);
    postorder(node.right);
    visit(node);
}
```

### BFS / Level Order (Iterative)
```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int size = queue.size(); // CRITICAL: snapshot current level size
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

---

## Worked Example 1: Maximum Depth

```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

---

## Worked Example 2: Lowest Common Ancestor (LCA)

This is one of the most classic tree interview problems.

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    // Base case: null or found one of the targets
    if (root == null || root == p || root == q) return root;

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // If both sides found a target → current root is LCA
    if (left != null && right != null) return root;
    // Otherwise return whichever side found something
    return left != null ? left : right;
}
```

**Why it works**: If p and q are in different subtrees of a node, that node is the LCA. If both are in the same subtree, the recursive call propagates the actual ancestor up.

---

## Worked Example 3: Validate BST

```java
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val)
        && validate(node.right, node.val, max);
}
```

**Key insight**: Every node has a valid range `(min, max)`. When we go left, the current node becomes the new max. When we go right, it becomes the new min.

---

## Worked Example 4: Serialize and Deserialize Binary Tree

```java
public String serialize(TreeNode root) {
    if (root == null) return "null,";
    return root.val + "," + serialize(root.left) + serialize(root.right);
}

public TreeNode deserialize(String data) {
    Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
    return buildTree(queue);
}

private TreeNode buildTree(Queue<String> q) {
    String val = q.poll();
    if ("null".equals(val)) return null;
    TreeNode node = new TreeNode(Integer.parseInt(val));
    node.left = buildTree(q);
    node.right = buildTree(q);
    return node;
}
```

---

## Key Properties to Remember

| Property | Formula |
|---|---|
| Max nodes in complete binary tree of height h | 2^(h+1) - 1 |
| Height of balanced tree with n nodes | log₂(n) |
| Inorder of BST | Sorted ascending |
| A tree with n nodes has exactly n-1 edges | Always true |

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Technique |
|---|---|---|
| 94 | [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/) | DFS |
| 100 | [Same Tree](https://leetcode.com/problems/same-tree/) | DFS comparison |
| 101 | [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/) | Mirror DFS |
| 104 | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | DFS |
| 226 | [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) | DFS swap |
| 543 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | DFS with height |
| 572 | [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/) | DFS + same tree |

### 🟡 Medium
| # | Problem | Technique |
|---|---|---|
| 98 | [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) | Range DFS |
| 102 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | BFS |
| 105 | [Construct from Preorder+Inorder](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | Divide & conquer |
| 114 | [Flatten Binary Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/) | Postorder |
| 199 | [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/) | BFS last in level |
| 230 | [Kth Smallest in BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | Inorder |
| 236 | [LCA of Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | Recursive LCA |
| 437 | [Path Sum III](https://leetcode.com/problems/path-sum-iii/) | Prefix sum DFS |

### 🔴 Hard
| # | Problem | Technique |
|---|---|---|
| 124 | [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | DFS with global max |
| 297 | [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) | Preorder |
| 968 | [Binary Tree Cameras](https://leetcode.com/problems/binary-tree-cameras/) | Greedy DFS |
