---
id: week-6-binary-trees-bst
title: "Week 6: Binary Trees & BSTs"
description: Move from linear to hierarchical data structures. Master Depth-First Search (DFS), Breadth-First Search (BFS), and the properties of Binary Search Trees in Java.
tags: [dsa, java, binary-tree, bst, dfs, bfs, algorithms, week-6]
sidebar_position: 6
---

# Week 6: Binary Trees & BSTs

## 1. Overview
Welcome to Week 6! It is time to leave linear data structures (arrays, strings, linked lists) behind and step into the multi-dimensional world of **Hierarchical Data**. This week focuses on **Binary Trees** and **Binary Search Trees (BSTs)**. 

Trees are the underlying architecture for databases (B-Trees), file systems, DOM rendering, and decision engines. You will learn the two primary ways to traverse hierarchical data: plunging deep into the leaves (DFS) and exploring layer by layer (BFS).

**Goals for this week:**
- Understand Tree terminology: Root, Leaf, Height, Depth, and Ancestor.
- Master Depth-First Search (Pre-order, In-order, Post-order) using Recursion.
- Master Breadth-First Search (Level-order) using a Queue.
- Understand the strict mathematical properties of a Binary Search Tree.

---

## 2. Theory & Fundamentals

### Binary Trees
A Binary Tree is a tree data structure in which each node has at most two children, referred to as the `left` child and the `right` child.
- **Time Complexity:** Traversing a tree of $N$ nodes takes $O(N)$ time.
- **Java Specifics:** Similar to Linked Lists, trees are built using object references. A deeply skewed tree (essentially a linked list) can cause a `StackOverflowError` in Java if you rely on recursion, because the JVM's call stack typically maxes out around 10,000 frames.

### Traversals: DFS vs. BFS
- **Depth-First Search (DFS):** Goes as deep as possible down one path before backtracking. It is heavily reliant on the **Call Stack** (Recursion).
  - *Pre-order:* Root $\rightarrow$ Left $\rightarrow$ Right (Copying a tree).
  - *In-order:* Left $\rightarrow$ Root $\rightarrow$ Right (Returns sorted order in a BST).
  - *Post-order:* Left $\rightarrow$ Right $\rightarrow$ Root (Deleting a tree, bottom-up calculations).
- **Breadth-First Search (BFS):** Explores the tree level by level. It uses a **Queue (FIFO)**.

### Binary Search Trees (BST)
A specific type of binary tree with strict rules:
1. All nodes in the left subtree must be strictly *less than* the root.
2. All nodes in the right subtree must be strictly *greater than* the root.
3. This applies recursively to every single node.
- **Search Time Complexity:** $O(\log N)$ if the tree is balanced, $O(N)$ if unbalanced.

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
*Java Pro-Tip: Use the `queue.size()` trick to process exactly one level at a time without mixing nodes from the next level.*
```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    
    while (!queue.isEmpty()) {
        int levelSize = queue.size(); // Lock in the number of nodes on the current level
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

### Template 2: DFS Recursive (Post-Order Example)
Used for bottom-up processing, like finding the height or diameter.
```java
public int maxDepth(TreeNode root) {
    // Base Case: If the node is null, its depth is 0
    if (root == null) return 0;
    
    // Recursive Steps: Calculate left and right depths
    int leftDepth = maxDepth(root.left);
    int rightDepth = maxDepth(root.right);
    
    // Return the max of the two, plus 1 for the current node
    return Math.max(leftDepth, rightDepth) + 1;
}
```

---

## 4. Pattern Recognition Guide

**How to spot Tree patterns:**
1. **"Shortest path", "Level by Level", or "Right Side View":** Immediately use **BFS (Queue)**. The level-size loop is mandatory here.
2. **"Validate", "Find $K$-th Smallest", or "Sorted":** If it's a BST, use **DFS In-order traversal**. It will naturally process the nodes in ascending order.
3. **"Does a path sum equal $X$?" or "Is it symmetric?":** Use **DFS Pre-order** (top-down), passing state down from the parent to the children.
4. **"Height", "Diameter", or "Max Path Sum":** Use **DFS Post-order** (bottom-up). You cannot answer for the parent until you have the answers from the left and right children.
5. "Lowest Common Ancestor": Use **DFS Bottom-Up**. If you find one target in the left subtree and the other target in the right subtree, the current node is the LCA.
6. "Serialize/Deserialize", "Copy", or "Invert": Use **DFS Pre-order**. You need to process the root before the children to maintain structure.
7. "Level Averages", "Zigzag Level Order": Use **BFS**. You need to process nodes level by level, and sometimes maintain additional state (like a boolean flag for zigzag).
8. "All Root-to-Leaf Paths": Use **DFS Pre-order**. You need to build the path as you go down and add it to the result when you hit a leaf.
9. "Subtree of Another Tree": Use **DFS Pre-order** to serialize both trees into strings (including nulls) and then check if one string is a substring of the other.
10. "Delete Node in BST": Use **DFS** to find the node, then handle the three cases (no children, one child, two children) with careful pointer manipulation.
11. "Construct Tree from Preorder/Inorder": Use **DFS** with indices to reconstruct the tree. The preorder gives you the root, and the inorder tells you how to split left and right subtrees.
12. "Diameter of Binary Tree": Use **DFS Post-order** to calculate the longest path through each node and update a global diameter variable.

---

## 5. Worked Examples

### Example 1: LeetCode 226. Invert Binary Tree
**Problem:** Given the `root` of a binary tree, invert the tree, and return its root.
**Solution (DFS Pre-order):**
```java
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        
        // Swap the left and right references
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

### Example 2: LeetCode 98. Validate Binary Search Tree
**Problem:** Given the `root` of a binary tree, determine if it is a valid BST.
**Solution (DFS Top-Down Range Passing):**
```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        // Use Long to handle integer overflow test cases (e.g., Integer.MAX_VALUE in tree)
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
    
    private boolean validate(TreeNode node, long lowerBound, long upperBound) {
        if (node == null) return true;
        
        if (node.val <= lowerBound || node.val >= upperBound) {
            return false; // Violates the BST property
        }
        
        // Left child must be smaller than current node's value
        // Right child must be larger than current node's value
        return validate(node.left, lowerBound, node.val) && 
               validate(node.right, node.val, upperBound);
    }
}
```

---

## 6. 7-Day Practice Plan (21 Problems)

**Day 1: DFS Fundamentals**
1. Invert Binary Tree (LC 226)
2. Maximum Depth of Binary Tree (LC 104)
3. Same Tree (LC 100)

**Day 2: BFS / Level-Order Traversal**
4. Binary Tree Level Order Traversal (LC 102)
5. Binary Tree Right Side View (LC 199)
6. Binary Tree Zigzag Level Order Traversal (LC 103)

**Day 3: Tree Properties & Post-Order Processing**
7. Diameter of Binary Tree (LC 543)
8. Balanced Binary Tree (LC 110)
9. Symmetric Tree (LC 101)

**Day 4: Path Finding & Backtracking in Trees**
10. Path Sum (LC 112)
11. Path Sum II (LC 113)
12. Sum Root to Leaf Numbers (LC 129)

**Day 5: BST Fundamentals**
13. Search in a Binary Search Tree (LC 700)
14. Insert into a Binary Search Tree (LC 701)
15. Lowest Common Ancestor of a Binary Search Tree (LC 235)

**Day 6: Advanced BST Validation & Iteration**
16. Validate Binary Search Tree (LC 98)
17. Kth Smallest Element in a BST (LC 230)
18. Delete Node in a BST (LC 450) - *Excellent test of pointer manipulation.*

**Day 7: Tree Construction & Review**
19. Construct Binary Tree from Preorder and Inorder Traversal (LC 105)
20. Flatten Binary Tree to Linked List (LC 114)
21. Subtree of Another Tree (LC 572)

---

## 7. Mock Interview Module

### Problem: The Distributed Version Control Merge-Base
**Context:** You are building the backend for a new internal Git-like version control system. In your system, commits form a strictly branching Binary Tree (ignoring complex DAG merges for this exercise). 
When a developer wants to merge two different branches, the system must first find the "merge-base"—the most recent common ancestor commit of the two branches. 

**Question:** Write a function `public CommitNode findMergeBase(CommitNode root, CommitNode branchA, CommitNode branchB)` that takes the root of the repository and the references to the two branch heads, and returns the lowest common ancestor `CommitNode`.

*(Assume `CommitNode` is structured exactly like `TreeNode`. All node values are unique, and both `branchA` and `branchB` are guaranteed to exist in the tree).*

#### Step 1: Clarifying Questions & Expected Answers
- *Candidate:* "Do the nodes have a `parent` pointer?" -> *Interviewer:* No, it is a standard top-down binary tree. You only have `left` and `right` pointers.
- *Candidate:* "Can a node be a descendant of itself? E.g., if `branchA` is a direct parent of `branchB`?" -> *Interviewer:* Yes, in that case, `branchA` is the merge-base.

#### Step 2: The Brute Force Solution
Explain that we could perform a DFS to find the path from the `root` to `branchA`, and save it in an array. Then, find the path from the `root` to `branchB` and save it in another array. We then iterate through both arrays until the paths diverge.
```java
// Time: O(N), Space: O(N) for the path arrays
// (Candidate explains the concept but shouldn't code it fully unless asked)
```
*Interviewer Critique:* "This works, but it requires two full passes of the tree and extra memory to store the paths. Can we find the merge-base in a single pass without extra data structures?"

#### Step 3: The Optimized Solution (DFS Bottom-Up)
Recognize that we can use recursion to "bubble up" the target nodes. If a subtree contains `branchA` on the left and `branchB` on the right, the current root *must* be the merge-base.
```java
// Time: O(N), Space: O(H) where H is the height of the tree (Call Stack)
public CommitNode findMergeBase(CommitNode root, CommitNode branchA, CommitNode branchB) {
    // Base Case 1: If we reach a leaf's child, return null
    if (root == null) return null;
    
    // Base Case 2: If the current node is one of our targets, return it upwards
    if (root == branchA || root == branchB) {
        return root;
    }
    
    // Recursively search the left and right subtrees
    CommitNode leftResult = findMergeBase(root.left, branchA, branchB);
    CommitNode rightResult = findMergeBase(root.right, branchA, branchB);
    
    // If both left and right returned a target, THIS root is the common ancestor
    if (leftResult != null && rightResult != null) {
        return root;
    }
    
    // Otherwise, return whichever side found a target (or null if neither did)
    return leftResult != null ? leftResult : rightResult;
}
```

#### Step 4: Follow-up Questions
*Interviewer:* "What if this was a *Binary Search Tree* based on commit timestamps, where all earlier commits are to the left and later commits are to the right? How would you optimize the merge-base search?"
*Candidate's expected thought process:*
- If it's a BST, we do not need to search the entire tree. We can exploit the BST property.
- We start at the root. If both `branchA` and `branchB` have timestamps *smaller* than the root, we only traverse left.
- If both have timestamps *larger* than the root, we only traverse right.
- The very first node we find whose value lies *between* `branchA` and `branchB` (inclusive) is guaranteed to be the lowest common ancestor.
- This optimizes the time complexity from $O(N)$ down to $O(\log N)$ (assuming a balanced tree) and space from $O(H)$ to $O(1)$ if done iteratively.