import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';

interface Problem {
  id: number;
  title: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  week: number;
  topic: string;
  weekSlug: string;
  companies: string[];
  plans: ('75' | '150' | '250')[];
}

const PROBLEMS: Problem[] = [
  { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Meta", "Amazon", "Microsoft", "Apple", "Adobe"], plans: ["75", "150", "250"] },
  { id: 14, title: "Longest Common Prefix", url: "https://leetcode.com/problems/longest-common-prefix", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 28, title: "Find the Index of the First Occurrence in a String", url: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon"], plans: ["250", "150"] },
  { id: 49, title: "Group Anagrams", url: "https://leetcode.com/problems/group-anagrams", difficulty: "Medium", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Meta", "Amazon", "Microsoft", "Uber"], plans: ["75", "150", "250"] },
  { id: 53, title: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray", difficulty: "Medium", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 58, title: "Length of Last Word", url: "https://leetcode.com/problems/length-of-last-word", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon"], plans: ["250", "150"] },
  { id: 189, title: "Rotate Array", url: "https://leetcode.com/problems/rotate-array", difficulty: "Medium", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon", "Microsoft"], plans: ["250", "150"] },
  { id: 217, title: "Contains Duplicate", url: "https://leetcode.com/problems/contains-duplicate", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon", "Apple", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 238, title: "Product of Array Except Self", url: "https://leetcode.com/problems/product-of-array-except-self", difficulty: "Medium", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Meta", "Amazon", "Microsoft", "Apple"], plans: ["75", "150", "250"] },
  { id: 242, title: "Valid Anagram", url: "https://leetcode.com/problems/valid-anagram", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Meta", "Amazon", "Bloomberg"], plans: ["75", "150", "250"] },
  { id: 560, title: "Subarray Sum Equals K", url: "https://leetcode.com/problems/subarray-sum-equals-k", difficulty: "Medium", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Meta", "Amazon", "ByteDance"], plans: ["250", "150"] },
  { id: 724, title: "Find Pivot Index", url: "https://leetcode.com/problems/find-pivot-index", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon"], plans: ["250", "150"] },
  { id: 1480, title: "Running Sum of 1d Array", url: "https://leetcode.com/problems/running-sum-of-1d-array", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon"], plans: ["250", "150"] },
  { id: 1920, title: "Build Array from Permutation", url: "https://leetcode.com/problems/build-array-from-permutation", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Apple"], plans: ["250", "150"] },
  { id: 1929, title: "Concatenation of Array", url: "https://leetcode.com/problems/concatenation-of-array", difficulty: "Easy", week: 1, topic: "Arrays & Strings", weekSlug: "week-1-arrays-strings-prefix-sums", companies: ["Google", "Amazon"], plans: ["250", "150"] },
  { id: 3, title: "Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters", difficulty: "Medium", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon", "Bloomberg"], plans: ["75", "150", "250"] },
  { id: 11, title: "Container With Most Water", url: "https://leetcode.com/problems/container-with-most-water", difficulty: "Medium", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Amazon", "Adobe"], plans: ["75", "150", "250"] },
  { id: 15, title: "3Sum", url: "https://leetcode.com/problems/3sum", difficulty: "Medium", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon", "Microsoft", "Apple"], plans: ["75", "150", "250"] },
  { id: 26, title: "Remove Duplicates from Sorted Array", url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 27, title: "Remove Element", url: "https://leetcode.com/problems/remove-element", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 88, title: "Merge Sorted Array", url: "https://leetcode.com/problems/merge-sorted-array", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 121, title: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 125, title: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 167, title: "Two Sum II - Input Array Is Sorted", url: "https://leetcode.com/problems/two-sum-ii---input-array-is-sorted", difficulty: "Medium", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Amazon", "Google"], plans: ["150", "250", "75"] },
  { id: 283, title: "Move Zeroes", url: "https://leetcode.com/problems/move-zeroes", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 344, title: "Reverse String", url: "https://leetcode.com/problems/reverse-string", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 392, title: "Is Subsequence", url: "https://leetcode.com/problems/is-subsequence", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 455, title: "Assign Cookies", url: "https://leetcode.com/problems/assign-cookies", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Amazon"], plans: ["250", "150"] },
  { id: 977, title: "Squares of a Sorted Array", url: "https://leetcode.com/problems/squares-of-a-sorted-array", difficulty: "Easy", week: 2, topic: "Two Pointers & Window", weekSlug: "week-2-two-pointers-sliding-window", companies: ["Google", "Meta", "Amazon"], plans: ["250", "150"] },
  { id: 2, title: "Add Two Numbers", url: "https://leetcode.com/problems/add-two-numbers", difficulty: "Medium", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Amazon", "Meta", "Google"], plans: ["150", "250", "75"] },
  { id: 19, title: "Remove Nth Node From End of List", url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list", difficulty: "Medium", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Amazon", "Meta", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 21, title: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists", difficulty: "Easy", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 23, title: "Merge k Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists", difficulty: "Hard", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 25, title: "Reverse Nodes in k-Group", url: "https://leetcode.com/problems/reverse-nodes-in-k-group", difficulty: "Hard", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 83, title: "Remove Duplicates from Sorted List", url: "https://leetcode.com/problems/remove-duplicates-from-sorted-list", difficulty: "Easy", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 138, title: "Copy List with Random Pointer", url: "https://leetcode.com/problems/copy-list-with-random-pointer", difficulty: "Medium", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Amazon", "Google", "Microsoft"], plans: ["150", "250", "75"] },
  { id: 141, title: "Linked List Cycle", url: "https://leetcode.com/problems/linked-list-cycle", difficulty: "Easy", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 143, title: "Reorder List", url: "https://leetcode.com/problems/reorder-list", difficulty: "Medium", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Amazon", "Google"], plans: ["75", "150", "250"] },
  { id: 203, title: "Remove Linked List Elements", url: "https://leetcode.com/problems/remove-linked-list-elements", difficulty: "Easy", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 206, title: "Reverse Linked List", url: "https://leetcode.com/problems/reverse-linked-list", difficulty: "Easy", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Meta", "Amazon", "Apple"], plans: ["75", "150", "250"] },
  { id: 287, title: "Find the Duplicate Number", url: "https://leetcode.com/problems/find-the-duplicate-number", difficulty: "Medium", week: 3, topic: "Linked Lists", weekSlug: "week-3-linked-lists-pointers", companies: ["Google", "Amazon"], plans: ["150", "250", "75"] },
  { id: 205, title: "Isomorphic Strings", url: "https://leetcode.com/problems/isomorphic-strings", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 219, title: "Contains Duplicate II", url: "https://leetcode.com/problems/contains-duplicate-ii", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 271, title: "Encode and Decode Strings", url: "https://leetcode.com/problems/encode-and-decode-strings", difficulty: "Medium", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 290, title: "Word Pattern", url: "https://leetcode.com/problems/word-pattern", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 347, title: "Top K Frequent Elements", url: "https://leetcode.com/problems/top-k-frequent-elements", difficulty: "Medium", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 349, title: "Intersection of Two Arrays", url: "https://leetcode.com/problems/intersection-of-two-arrays", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 350, title: "Intersection of Two Arrays II", url: "https://leetcode.com/problems/intersection-of-two-arrays-ii", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 383, title: "Ransom Note", url: "https://leetcode.com/problems/ransom-note", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 387, title: "First Unique Character in a String", url: "https://leetcode.com/problems/first-unique-character-in-a-string", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Meta", "Amazon"], plans: ["250"] },
  { id: 409, title: "Longest Palindrome", url: "https://leetcode.com/problems/longest-palindrome", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 448, title: "Find All Numbers Disappeared in an Array", url: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 705, title: "Design HashSet", url: "https://leetcode.com/problems/design-hashset", difficulty: "Easy", week: 4, topic: "Hash Tables & Sets", weekSlug: "week-4-hash-tables-sets", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 20, title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Meta", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 22, title: "Generate Parentheses", url: "https://leetcode.com/problems/generate-parentheses", difficulty: "Medium", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 84, title: "Largest Rectangle in Histogram", url: "https://leetcode.com/problems/largest-rectangle-in-histogram", difficulty: "Hard", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Meta", "Apple"], plans: ["150", "250"] },
  { id: 150, title: "Evaluate Reverse Polish Notation", url: "https://leetcode.com/problems/evaluate-reverse-polish-notation", difficulty: "Medium", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "LinkedIn"], plans: ["150", "250"] },
  { id: 155, title: "Min Stack", url: "https://leetcode.com/problems/min-stack", difficulty: "Medium", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Amazon", "Microsoft"], plans: ["150", "250"] },
  { id: 225, title: "Implement Stack using Queues", url: "https://leetcode.com/problems/implement-stack-using-queues", difficulty: "Easy", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 232, title: "Implement Queue using Stacks", url: "https://leetcode.com/problems/implement-queue-using-stacks", difficulty: "Easy", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 496, title: "Next Greater Element I", url: "https://leetcode.com/problems/next-greater-element-i", difficulty: "Easy", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 682, title: "Baseball Game", url: "https://leetcode.com/problems/baseball-game", difficulty: "Easy", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 739, title: "Daily Temperatures", url: "https://leetcode.com/problems/daily-temperatures", difficulty: "Medium", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 853, title: "Car Fleet", url: "https://leetcode.com/problems/car-fleet", difficulty: "Medium", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 1047, title: "Remove All Adjacent Duplicates In String", url: "https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string", difficulty: "Easy", week: 5, topic: "Stacks & Queues", weekSlug: "week-5-stacks-queues-monotonic", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 98, title: "Validate Binary Search Tree", url: "https://leetcode.com/problems/validate-binary-search-tree", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon", "Bloomberg"], plans: ["75", "150", "250"] },
  { id: 100, title: "Same Tree", url: "https://leetcode.com/problems/same-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Bloomberg"], plans: ["75", "150", "250"] },
  { id: 101, title: "Symmetric Tree", url: "https://leetcode.com/problems/symmetric-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 102, title: "Binary Tree Level Order Traversal", url: "https://leetcode.com/problems/binary-tree-level-order-traversal", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 104, title: "Maximum Depth of Binary Tree", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 105, title: "Construct Tree from Preorder/Inorder", url: "https://leetcode.com/problems/construct-tree-from-preorder/inorder", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 110, title: "Balanced Binary Tree", url: "https://leetcode.com/problems/balanced-binary-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 111, title: "Minimum Depth of Binary Tree", url: "https://leetcode.com/problems/minimum-depth-of-binary-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google"], plans: ["250"] },
  { id: 112, title: "Path Sum", url: "https://leetcode.com/problems/path-sum", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta", "Amazon"], plans: ["250"] },
  { id: 113, title: "Path Sum II", url: "https://leetcode.com/problems/path-sum-ii", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 124, title: "Binary Tree Maximum Path Sum", url: "https://leetcode.com/problems/binary-tree-maximum-path-sum", difficulty: "Hard", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 129, title: "Sum Root to Leaf Numbers", url: "https://leetcode.com/problems/sum-root-to-leaf-numbers", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 145, title: "Binary Tree Postorder Traversal", url: "https://leetcode.com/problems/binary-tree-postorder-traversal", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 199, title: "Binary Tree Right Side View", url: "https://leetcode.com/problems/binary-tree-right-side-view", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 226, title: "Invert Binary Tree", url: "https://leetcode.com/problems/invert-binary-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 230, title: "Kth Smallest Element in a BST", url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 235, title: "Lowest Common Ancestor of a BST", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-bst", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 297, title: "Serialize and Deserialize Binary Tree", url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree", difficulty: "Hard", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 543, title: "Diameter of Binary Tree", url: "https://leetcode.com/problems/diameter-of-binary-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 572, title: "Subtree of Another Tree", url: "https://leetcode.com/problems/subtree-of-another-tree", difficulty: "Easy", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 1448, title: "Count Good Nodes in Binary Tree", url: "https://leetcode.com/problems/count-good-nodes-in-binary-tree", difficulty: "Medium", week: 6, topic: "Binary Trees", weekSlug: "week-6-binary-trees-bst", companies: ["Google", "Microsoft"], plans: ["150", "250"] },
  { id: 133, title: "Clone Graph", url: "https://leetcode.com/problems/clone-graph", difficulty: "Medium", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Meta", "Bloomberg"], plans: ["75", "150", "250"] },
  { id: 200, title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands", difficulty: "Medium", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Meta", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 286, title: "Walls and Gates", url: "https://leetcode.com/problems/walls-and-gates", difficulty: "Medium", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 463, title: "Island Perimeter", url: "https://leetcode.com/problems/island-perimeter", difficulty: "Easy", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 547, title: "Number of Provinces", url: "https://leetcode.com/problems/number-of-provinces", difficulty: "Medium", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 695, title: "Max Area of Island", url: "https://leetcode.com/problems/max-area-of-island", difficulty: "Medium", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 733, title: "Flood Fill", url: "https://leetcode.com/problems/flood-fill", difficulty: "Easy", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 841, title: "Keys and Rooms", url: "https://leetcode.com/problems/keys-and-rooms", difficulty: "Medium", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 994, title: "Rotting Oranges", url: "https://leetcode.com/problems/rotting-oranges", difficulty: "Medium", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Amazon", "Microsoft"], plans: ["150", "250"] },
  { id: 997, title: "Find the Town Judge", url: "https://leetcode.com/problems/find-the-town-judge", difficulty: "Easy", week: 7, topic: "Graph Foundations", weekSlug: "week-7-graph-foundations", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 207, title: "Course Schedule", url: "https://leetcode.com/problems/course-schedule", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Meta", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 210, title: "Course Schedule II", url: "https://leetcode.com/problems/course-schedule-ii", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 269, title: "Alien Dictionary", url: "https://leetcode.com/problems/alien-dictionary", difficulty: "Hard", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 310, title: "Minimum Height Trees", url: "https://leetcode.com/problems/minimum-height-trees", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 417, title: "Pacific Atlantic Water Flow", url: "https://leetcode.com/problems/pacific-atlantic-water-flow", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 787, title: "Cheapest Flights Within K Stops", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 802, title: "Find Eventual Safe States", url: "https://leetcode.com/problems/find-eventual-safe-states", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 1466, title: "Reorder Routes to Make All Paths Lead to the City Zero", url: "https://leetcode.com/problems/reorder-routes-to-make-all-paths-lead-to-the-city-zero", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 1976, title: "Number of Ways to Arrive at Destination", url: "https://leetcode.com/problems/number-of-ways-to-arrive-at-destination", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 2101, title: "Detonate the Maximum Bombs", url: "https://leetcode.com/problems/detonate-the-maximum-bombs", difficulty: "Medium", week: 8, topic: "Advanced Graphs", weekSlug: "week-8-advanced-graph-concepts", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 4, title: "Median of Two Sorted Arrays", url: "https://leetcode.com/problems/median-of-two-sorted-arrays", difficulty: "Hard", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 33, title: "Search in Rotated Sorted Array", url: "https://leetcode.com/problems/search-in-rotated-sorted-array", difficulty: "Medium", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 35, title: "Search Insert Position", url: "https://leetcode.com/problems/search-insert-position", difficulty: "Easy", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 74, title: "Search a 2D Matrix", url: "https://leetcode.com/problems/search-a-2d-matrix", difficulty: "Medium", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Amazon", "Microsoft"], plans: ["150", "250"] },
  { id: 153, title: "Find Minimum in Rotated Sorted Array", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array", difficulty: "Medium", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 162, title: "Find Peak Element", url: "https://leetcode.com/problems/find-peak-element", difficulty: "Medium", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Meta", "Amazon"], plans: ["250"] },
  { id: 278, title: "First Bad Version", url: "https://leetcode.com/problems/first-bad-version", difficulty: "Easy", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 367, title: "Valid Perfect Square", url: "https://leetcode.com/problems/valid-perfect-square", difficulty: "Easy", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 441, title: "Arranging Coins", url: "https://leetcode.com/problems/arranging-coins", difficulty: "Easy", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 704, title: "Binary Search", url: "https://leetcode.com/problems/binary-search", difficulty: "Easy", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Microsoft"], plans: ["150", "250"] },
  { id: 875, title: "Koko Eating Bananas", url: "https://leetcode.com/problems/koko-eating-bananas", difficulty: "Medium", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Airbnb"], plans: ["150", "250"] },
  { id: 981, title: "Time Based Key-Value Store", url: "https://leetcode.com/problems/time-based-key-value-store", difficulty: "Medium", week: 9, topic: "Binary Search", weekSlug: "week-9-binary-search", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 17, title: "Letter Combinations of a Phone Number", url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 37, title: "Sudoku Solver", url: "https://leetcode.com/problems/sudoku-solver", difficulty: "Hard", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 39, title: "Combination Sum", url: "https://leetcode.com/problems/combination-sum", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 40, title: "Combination Sum II", url: "https://leetcode.com/problems/combination-sum-ii", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 46, title: "Permutations", url: "https://leetcode.com/problems/permutations", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta", "LinkedIn"], plans: ["150", "250"] },
  { id: 47, title: "Permutations II", url: "https://leetcode.com/problems/permutations-ii", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 51, title: "N-Queens", url: "https://leetcode.com/problems/n-queens", difficulty: "Hard", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta"], plans: ["150", "250"] },
  { id: 52, title: "N-Queens II", url: "https://leetcode.com/problems/n-queens-ii", difficulty: "Hard", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 77, title: "Combinations", url: "https://leetcode.com/problems/combinations", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 78, title: "Subsets", url: "https://leetcode.com/problems/subsets", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 79, title: "Word Search", url: "https://leetcode.com/problems/word-search", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 90, title: "Subsets II", url: "https://leetcode.com/problems/subsets-ii", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 93, title: "Restore IP Addresses", url: "https://leetcode.com/problems/restore-ip-addresses", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 131, title: "Palindrome Partitioning", url: "https://leetcode.com/problems/palindrome-partitioning", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 216, title: "Combination Sum III", url: "https://leetcode.com/problems/combination-sum-iii", difficulty: "Medium", week: 10, topic: "Recursion & Backtracking", weekSlug: "week-10-recursion-backtracking", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 56, title: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals", difficulty: "Medium", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Meta", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 57, title: "Insert Interval", url: "https://leetcode.com/problems/insert-interval", difficulty: "Medium", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Meta", "Twitter"], plans: ["75", "150", "250"] },
  { id: 218, title: "The Skyline Problem", url: "https://leetcode.com/problems/the-skyline-problem", difficulty: "Hard", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 252, title: "Meeting Rooms", url: "https://leetcode.com/problems/meeting-rooms", difficulty: "Easy", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 253, title: "Meeting Rooms II", url: "https://leetcode.com/problems/meeting-rooms-ii", difficulty: "Medium", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Amazon", "Microsoft"], plans: ["250"] },
  { id: 435, title: "Non-overlapping Intervals", url: "https://leetcode.com/problems/non-overlapping-intervals", difficulty: "Medium", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 452, title: "Minimum Number of Arrows to Burst Balloons", url: "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons", difficulty: "Medium", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 759, title: "Employee Free Time", url: "https://leetcode.com/problems/employee-free-time", difficulty: "Hard", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 986, title: "Interval List Intersections", url: "https://leetcode.com/problems/interval-list-intersections", difficulty: "Medium", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 1288, title: "Remove Covered Intervals", url: "https://leetcode.com/problems/remove-covered-intervals", difficulty: "Medium", week: 11, topic: "Intervals & Sweep Line", weekSlug: "week-11-intervals-sweep-line", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 45, title: "Jump Game II", url: "https://leetcode.com/problems/jump-game-ii", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 55, title: "Jump Game", url: "https://leetcode.com/problems/jump-game", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 134, title: "Gas Station", url: "https://leetcode.com/problems/gas-station", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 215, title: "Kth Largest Element in an Array", url: "https://leetcode.com/problems/kth-largest-element-in-an-array", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon", "Microsoft"], plans: ["150", "250"] },
  { id: 295, title: "Find Median from Data Stream", url: "https://leetcode.com/problems/find-median-from-data-stream", difficulty: "Hard", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 378, title: "Kth Smallest Element in a Sorted Matrix", url: "https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 621, title: "Task Scheduler", url: "https://leetcode.com/problems/task-scheduler", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 678, title: "Valid Parenthesis String", url: "https://leetcode.com/problems/valid-parenthesis-string", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 703, title: "Kth Largest Element in a Stream", url: "https://leetcode.com/problems/kth-largest-element-in-a-stream", difficulty: "Easy", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 763, title: "Partition Labels", url: "https://leetcode.com/problems/partition-labels", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 846, title: "Hand of Straights", url: "https://leetcode.com/problems/hand-of-straights", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 973, title: "K Closest Points to Origin", url: "https://leetcode.com/problems/k-closest-points-to-origin", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 1046, title: "Last Stone Weight", url: "https://leetcode.com/problems/last-stone-weight", difficulty: "Easy", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 1899, title: "Merge Triplets to Form Target Triplet", url: "https://leetcode.com/problems/merge-triplets-to-form-target-triplet", difficulty: "Medium", week: 12, topic: "Heaps & Greedy", weekSlug: "week-12-heaps-greedy", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 5, title: "Longest Palindromic Substring", url: "https://leetcode.com/problems/longest-palindromic-substring", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 70, title: "Climbing Stairs", url: "https://leetcode.com/problems/climbing-stairs", difficulty: "Easy", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon", "Apple"], plans: ["75", "150", "250"] },
  { id: 91, title: "Decode Ways", url: "https://leetcode.com/problems/decode-ways", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 119, title: "Pascal's Triangle II", url: "https://leetcode.com/problems/pascals-triangle-ii", difficulty: "Easy", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 132, title: "Palindrome Partitioning II", url: "https://leetcode.com/problems/palindrome-partitioning-ii", difficulty: "Hard", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 139, title: "Word Break", url: "https://leetcode.com/problems/word-break", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 152, title: "Maximum Product Subarray", url: "https://leetcode.com/problems/maximum-product-subarray", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 198, title: "House Robber", url: "https://leetcode.com/problems/house-robber", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 213, title: "House Robber II", url: "https://leetcode.com/problems/house-robber-ii", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 300, title: "Longest Increasing Subsequence", url: "https://leetcode.com/problems/longest-increasing-subsequence", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 322, title: "Coin Change", url: "https://leetcode.com/problems/coin-change", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 368, title: "Largest Divisible Subset", url: "https://leetcode.com/problems/largest-divisible-subset", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 377, title: "Combination Sum IV", url: "https://leetcode.com/problems/combination-sum-iv", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 416, title: "Partition Equal Subset Sum", url: "https://leetcode.com/problems/partition-equal-subset-sum", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 509, title: "Fibonacci Number", url: "https://leetcode.com/problems/fibonacci-number", difficulty: "Easy", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 647, title: "Palindromic Substrings", url: "https://leetcode.com/problems/palindromic-substrings", difficulty: "Medium", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 746, title: "Min Cost Climbing Stairs", url: "https://leetcode.com/problems/min-cost-climbing-stairs", difficulty: "Easy", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 1137, title: "N-th Tribonacci Number", url: "https://leetcode.com/problems/n-th-tribonacci-number", difficulty: "Easy", week: 13, topic: "Dynamic Programming 1D", weekSlug: "week-13-dynamic-programming-1d", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 10, title: "Regular Expression Matching", url: "https://leetcode.com/problems/regular-expression-matching", difficulty: "Hard", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 62, title: "Unique Paths", url: "https://leetcode.com/problems/unique-paths", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 63, title: "Unique Paths II", url: "https://leetcode.com/problems/unique-paths-ii", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 64, title: "Minimum Path Sum", url: "https://leetcode.com/problems/minimum-path-sum", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 72, title: "Edit Distance", url: "https://leetcode.com/problems/edit-distance", difficulty: "Hard", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Meta", "Microsoft"], plans: ["150", "250"] },
  { id: 87, title: "Scramble String", url: "https://leetcode.com/problems/scramble-string", difficulty: "Hard", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 97, title: "Interleaving String", url: "https://leetcode.com/problems/interleaving-string", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 115, title: "Distinct Subsequences", url: "https://leetcode.com/problems/distinct-subsequences", difficulty: "Hard", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 120, title: "Triangle", url: "https://leetcode.com/problems/triangle", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 221, title: "Maximal Square", url: "https://leetcode.com/problems/maximal-square", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Apple"], plans: ["250"] },
  { id: 309, title: "Best Time to Buy and Sell Stock with Cooldown", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 312, title: "Burst Balloons", url: "https://leetcode.com/problems/burst-balloons", difficulty: "Hard", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 329, title: "Longest Increasing Path in a Matrix", url: "https://leetcode.com/problems/longest-increasing-path-in-a-matrix", difficulty: "Hard", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Meta"], plans: ["150", "250"] },
  { id: 494, title: "Target Sum", url: "https://leetcode.com/problems/target-sum", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Meta", "Amazon"], plans: ["150", "250"] },
  { id: 516, title: "Longest Palindromic Subsequence", url: "https://leetcode.com/problems/longest-palindromic-subsequence", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 518, title: "Coin Change II", url: "https://leetcode.com/problems/coin-change-ii", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 931, title: "Minimum Falling Path Sum", url: "https://leetcode.com/problems/minimum-falling-path-sum", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 1143, title: "Longest Common Subsequence", url: "https://leetcode.com/problems/longest-common-subsequence", difficulty: "Medium", week: 14, topic: "Dynamic Programming 2D", weekSlug: "week-14-dynamic-programming-2d", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 76, title: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring", difficulty: "Hard", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 209, title: "Minimum Size Subarray Sum", url: "https://leetcode.com/problems/minimum-size-subarray-sum", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 424, title: "Longest Repeating Character Replacement", url: "https://leetcode.com/problems/longest-repeating-character-replacement", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 438, title: "Find All Anagrams in a String", url: "https://leetcode.com/problems/find-all-anagrams-in-a-string", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 567, title: "Permutation in String", url: "https://leetcode.com/problems/permutation-in-string", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Amazon", "Meta"], plans: ["150", "250"] },
  { id: 904, title: "Fruit Into Baskets", url: "https://leetcode.com/problems/fruit-into-baskets", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 992, title: "Subarrays with K Different Integers", url: "https://leetcode.com/problems/subarrays-with-k-different-integers", difficulty: "Hard", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 1004, title: "Max Consecutive Ones III", url: "https://leetcode.com/problems/max-consecutive-ones-iii", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 1208, title: "Get Equal Substrings Within Budget", url: "https://leetcode.com/problems/get-equal-substrings-within-budget", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 1493, title: "Longest Subarray of 1's After Deleting One Element", url: "https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element", difficulty: "Medium", week: 15, topic: "Advanced Sliding Windows", weekSlug: "week-15-advanced-sliding-windows", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 208, title: "Implement Trie", url: "https://leetcode.com/problems/implement-trie-prefix-tree", difficulty: "Medium", week: 16, topic: "Tries", weekSlug: "week-16-tries-prefix-trees", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 211, title: "Design Add and Search Words", url: "https://leetcode.com/problems/design-add-and-search-words", difficulty: "Medium", week: 16, topic: "Tries", weekSlug: "week-16-tries-prefix-trees", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 212, title: "Word Search II", url: "https://leetcode.com/problems/word-search-ii", difficulty: "Hard", week: 16, topic: "Tries", weekSlug: "week-16-tries-prefix-trees", companies: ["Google", "Meta", "Amazon"], plans: ["75", "150", "250"] },
  { id: 648, title: "Replace Words", url: "https://leetcode.com/problems/replace-words", difficulty: "Medium", week: 16, topic: "Tries", weekSlug: "week-16-tries-prefix-trees", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 677, title: "Map Sum Pairs", url: "https://leetcode.com/problems/map-sum-pairs", difficulty: "Medium", week: 16, topic: "Tries", weekSlug: "week-16-tries-prefix-trees", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 745, title: "Prefix and Suffix Search", url: "https://leetcode.com/problems/prefix-and-suffix-search", difficulty: "Hard", week: 16, topic: "Tries", weekSlug: "week-16-tries-prefix-trees", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 743, title: "Network Delay Time", url: "https://leetcode.com/problems/network-delay-time", difficulty: "Medium", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 778, title: "Swim in Rising Water", url: "https://leetcode.com/problems/swim-in-rising-water", difficulty: "Hard", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 785, title: "Is Graph Bipartite?", url: "https://leetcode.com/problems/is-graph-bipartite?", difficulty: "Medium", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 882, title: "Reachable Nodes In Subdivided Graph", url: "https://leetcode.com/problems/reachable-nodes-in-subdivided-graph", difficulty: "Hard", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 1514, title: "Path with Maximum Probability", url: "https://leetcode.com/problems/path-with-maximum-probability", difficulty: "Medium", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 1584, title: "Min Cost to Connect All Points", url: "https://leetcode.com/problems/min-cost-to-connect-all-points", difficulty: "Medium", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 1631, title: "Path With Minimum Effort", url: "https://leetcode.com/problems/path-with-minimum-effort", difficulty: "Medium", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 787, title: "Cheapest Flights Within K Stops", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops-mst", difficulty: "Medium", week: 17, topic: "Shortest Paths & MST", weekSlug: "week-17-shortest-paths-mst", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 261, title: "Graph Valid Tree", url: "https://leetcode.com/problems/graph-valid-tree", difficulty: "Medium", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Meta", "Salesforce"], plans: ["75", "150", "250"] },
  { id: 323, title: "Number of Connected Components", url: "https://leetcode.com/problems/number-of-connected-components", difficulty: "Medium", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 684, title: "Redundant Connection", url: "https://leetcode.com/problems/redundant-connection", difficulty: "Medium", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 685, title: "Redundant Connection II", url: "https://leetcode.com/problems/redundant-connection-ii", difficulty: "Hard", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 721, title: "Accounts Merge", url: "https://leetcode.com/problems/accounts-merge", difficulty: "Medium", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Meta"], plans: ["150", "250"] },
  { id: 952, title: "Largest Component Size by Common Factor", url: "https://leetcode.com/problems/largest-component-size-by-common-factor", difficulty: "Hard", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 990, title: "Satisfiability of Equality Equations", url: "https://leetcode.com/problems/satisfiability-of-equality-equations", difficulty: "Medium", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 547, title: "Number of Provinces", url: "https://leetcode.com/problems/number-of-provinces-dsu", difficulty: "Medium", week: 18, topic: "Disjoint Set Union", weekSlug: "week-18-disjoint-set-union", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 7, title: "Reverse Integer", url: "https://leetcode.com/problems/reverse-integer", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 9, title: "Palindrome Number", url: "https://leetcode.com/problems/palindrome-number", difficulty: "Easy", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 43, title: "Multiply Strings", url: "https://leetcode.com/problems/multiply-strings", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 50, title: "Pow(x, n)", url: "https://leetcode.com/problems/powx,-n", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Meta"], plans: ["150", "250"] },
  { id: 69, title: "Sqrt(x)", url: "https://leetcode.com/problems/sqrtx", difficulty: "Easy", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 136, title: "Single Number", url: "https://leetcode.com/problems/single-number", difficulty: "Easy", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon", "Microsoft"], plans: ["150", "250"] },
  { id: 137, title: "Single Number II", url: "https://leetcode.com/problems/single-number-ii", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 190, title: "Reverse Bits", url: "https://leetcode.com/problems/reverse-bits", difficulty: "Easy", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 191, title: "Number of 1 Bits", url: "https://leetcode.com/problems/number-of-1-bits", difficulty: "Easy", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Apple"], plans: ["75", "150", "250"] },
  { id: 201, title: "Bitwise AND of Numbers Range", url: "https://leetcode.com/problems/bitwise-and-of-numbers-range", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 260, title: "Single Number III", url: "https://leetcode.com/problems/single-number-iii", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 268, title: "Missing Number", url: "https://leetcode.com/problems/missing-number", difficulty: "Easy", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon", "Microsoft"], plans: ["75", "150", "250"] },
  { id: 338, title: "Counting Bits", url: "https://leetcode.com/problems/counting-bits", difficulty: "Easy", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 371, title: "Sum of Two Integers", url: "https://leetcode.com/problems/sum-of-two-integers", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["75", "150", "250"] },
  { id: 371, title: "Sum of Two Integers", url: "https://leetcode.com/problems/sum-of-two-integers-math", difficulty: "Medium", week: 19, topic: "Bit Manipulation & Math", weekSlug: "week-19-bit-manipulation-math", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 41, title: "First Missing Positive", url: "https://leetcode.com/problems/first-missing-positive", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Meta", "Amazon"], plans: ["250"] },
  { id: 42, title: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water-review", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Meta", "Amazon", "Microsoft"], plans: ["250"] },
  { id: 85, title: "Maximal Rectangle", url: "https://leetcode.com/problems/maximal-rectangle", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 127, title: "Word Ladder", url: "https://leetcode.com/problems/word-ladder", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 224, title: "Basic Calculator", url: "https://leetcode.com/problems/basic-calculator", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Meta"], plans: ["250"] },
  { id: 239, title: "Sliding Window Maximum", url: "https://leetcode.com/problems/sliding-window-maximum", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Amazon"], plans: ["150", "250"] },
  { id: 273, title: "Integer to English Words", url: "https://leetcode.com/problems/integer-to-english-words", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Meta", "Amazon"], plans: ["250"] },
  { id: 23, title: "Merge k Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists-review", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Meta", "Amazon"], plans: ["250"] },
  { id: 76, title: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring-review", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Amazon"], plans: ["250"] },
  { id: 84, title: "Largest Rectangle", url: "https://leetcode.com/problems/largest-rectangle-review", difficulty: "Hard", week: 20, topic: "Comprehensive Review", weekSlug: "week-20-comprehensive-review-systems", companies: ["Google", "Amazon"], plans: ["250"] }
];

export default function DSADashboard() {
  const [solved, setSolved] = useState<number[]>([]);
  const [intensity, setIntensity] = useState<'75' | '150' | '250'>('150');
  const [search, setSearch] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<number | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [showUnsolvedOnly, setShowUnsolvedOnly] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);



  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSolved = localStorage.getItem('dsa-solved-problems');
      const savedIntensity = localStorage.getItem('dsa-intensity-level');
      if (savedSolved) setSolved(JSON.parse(savedSolved));
      if (savedIntensity && (savedIntensity === '75' || savedIntensity === '150' || savedIntensity === '250')) {
        setIntensity(savedIntensity);
      }
    } catch (e) {
      console.error('Error loading DSA progress states:', e);
    }
  }, []);

  // Sync to localStorage on update
  const toggleSolved = (id: number) => {
    const updated = solved.includes(id)
      ? solved.filter(x => x !== id)
      : [...solved, id];
    setSolved(updated);
    localStorage.setItem('dsa-solved-problems', JSON.stringify(updated));
  };

  const handleIntensityChange = (level: '75' | '150' | '250') => {
    setIntensity(level);
    localStorage.setItem('dsa-intensity-level', level);
  };

  // Helper to generate company page link
  const getCompanyLink = (companyName: string) => {
    const name = companyName.toLowerCase().replace(/\s+/g, '-');
    const letter = name.charAt(0).toUpperCase();
    const folder = /^[0-9]/.test(letter) ? '0-9' : letter;
    return `/technical-knowledge/dsa/leetcode-companywise/${folder}/${name}`;
  };

  // Filtered list based on Intensity Level + other filters
  const planProblems = PROBLEMS.filter(p => p.plans.includes(intensity));
  
  const filteredProblems = planProblems.filter(p => {
    // Search filter (ID, Title, Topic, or Company)
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toString().includes(search) ||
      p.topic.toLowerCase().includes(search.toLowerCase()) ||
      p.companies.some(c => c.toLowerCase().includes(search.toLowerCase()));

    const matchesWeek = selectedWeek === 'All' || p.week === selectedWeek;
    const matchesDifficulty = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    const matchesUnsolved = !showUnsolvedOnly || !solved.includes(p.id);

    return matchesSearch && matchesWeek && matchesDifficulty && matchesUnsolved;
  });

  // Group problems by week
  const problemsByWeek = React.useMemo(() => {
    const groups: { [key: number]: { weekNum: number; topic: string; weekSlug: string; problems: typeof PROBLEMS } } = {};
    filteredProblems.forEach(p => {
      if (!groups[p.week]) {
        groups[p.week] = {
          weekNum: p.week,
          topic: p.topic,
          weekSlug: p.weekSlug,
          problems: []
        };
      }
      groups[p.week].problems.push(p);
    });
    return Object.values(groups).sort((a, b) => a.weekNum - b.weekNum);
  }, [filteredProblems]);

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev =>
      prev.includes(weekNum)
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum]
    );
  };

  const expandAll = () => {
    const allWeeks = problemsByWeek.map(g => g.weekNum);
    setExpandedWeeks(allWeeks);
  };

  const collapseAll = () => {
    setExpandedWeeks([]);
  };

  // Sync expanded weeks when search or week filters change
  useEffect(() => {
    if (search.trim() !== '') {
      const activeWeeks = problemsByWeek.map(g => g.weekNum);
      setExpandedWeeks(activeWeeks);
    } else if (selectedWeek !== 'All') {
      setExpandedWeeks([selectedWeek]);
    }
  }, [search, selectedWeek, problemsByWeek]);

  // Stats for the active plan level
  const totalCount = planProblems.length;
  const solvedCount = planProblems.filter(p => solved.includes(p.id)).length;
  const solvedPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const easyTotal = planProblems.filter(p => p.difficulty === 'Easy').length;
  const easySolved = planProblems.filter(p => p.difficulty === 'Easy' && solved.includes(p.id)).length;
  
  const mediumTotal = planProblems.filter(p => p.difficulty === 'Medium').length;
  const mediumSolved = planProblems.filter(p => p.difficulty === 'Medium' && solved.includes(p.id)).length;

  const hardTotal = planProblems.filter(p => p.difficulty === 'Hard').length;
  const hardSolved = planProblems.filter(p => p.difficulty === 'Hard' && solved.includes(p.id)).length;

  return (
    <div style={{ margin: '2rem 0', fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* 1. Study Plan Intensity Selector Tab bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.8rem',
        alignItems: 'center',
        padding: '1rem',
        background: 'var(--ifm-background-surface-color, #101525)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ifm-font-color-base, #e2e8f0)', marginRight: '0.5rem' }}>
          🚀 Study Intensity Level:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { level: '75', label: 'Blind 75 (High Efficiency)' },
            { level: '150', label: 'NeetCode 150 (Standard)' },
            { level: '250', label: 'All 250+ (Comprehensive/Aggressive)' }
          ].map(opt => {
            const isActive = intensity === opt.level;
            return (
              <button
                key={opt.level}
                onClick={() => handleIntensityChange(opt.level as any)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: isActive ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.08))',
                  background: isActive ? 'rgba(74, 222, 128, 0.12)' : 'var(--ifm-color-emphasis-100, rgba(255, 255, 255, 0.02))',
                  color: isActive ? 'var(--brand-green)' : 'var(--ifm-color-emphasis-600, #94a3b8)',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 0 12px rgba(74, 222, 128, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Progress Banner Card */}
      <div style={{
        background: 'var(--ifm-background-surface-color, #101525)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--brand-purple)', fontSize: '1.4rem', fontWeight: 700 }}>
              🎯 20-Week DSA Progress Tracker
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--ifm-color-content-secondary, #8f9cae)', fontSize: '0.9rem' }}>
              Tracking progress for the active {intensity === '75' ? 'Blind 75' : intensity === '150' ? 'NeetCode 150' : 'Comprehensive 250'} list
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-green)' }}>{solvedCount}</span>
            <span style={{ color: 'var(--ifm-color-content-secondary, #8f9cae)', fontSize: '1.1rem' }}> / {totalCount} Solved ({solvedPercent}%)</span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', height: '10px', width: '100%', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ 
            background: 'linear-gradient(90deg, var(--brand-purple) 0%, var(--brand-green) 100%)', 
            height: '100%', 
            width: `${solvedPercent}%`,
            transition: 'width 0.4s ease-out',
            boxShadow: '0 0 8px rgba(74, 222, 128, 0.5)'
          }} />
        </div>

        {/* Categories Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ background: 'rgba(74, 222, 128, 0.06)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#4ade80', fontWeight: 600 }}>🟢 Easy:</span>
            <span style={{ fontWeight: 700 }}>{easySolved} / {easyTotal}</span>
          </div>
          <div style={{ background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>🟡 Medium:</span>
            <span style={{ fontWeight: 700 }}>{mediumSolved} / {mediumTotal}</span>
          </div>
          <div style={{ background: 'rgba(248, 113, 113, 0.06)', border: '1px solid rgba(248, 113, 113, 0.2)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#f87171', fontWeight: 600 }}>🔴 Hard:</span>
            <span style={{ fontWeight: 700 }}>{hardSolved} / {hardTotal}</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Controls bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search & Inputs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="🔍 Search name, ID, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.12))',
              background: 'var(--ifm-background-surface-color, #101525)',
              color: 'var(--ifm-font-color-base, #e2e8f0)',
              flex: 1,
              minWidth: '200px',
              outline: 'none'
            }}
          />

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.12))',
              background: 'var(--ifm-background-surface-color, #101525)',
              color: 'var(--ifm-font-color-base, #e2e8f0)',
              outline: 'none'
            }}
          >
            <option value="All">📅 All Weeks</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.12))',
              background: 'var(--ifm-background-surface-color, #101525)',
              color: 'var(--ifm-font-color-base, #e2e8f0)',
              outline: 'none'
            }}
          >
            <option value="All">⚡ All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Checkbox Flags & Accordion Controls */}
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none', color: 'var(--ifm-font-color-base, #e2e8f0)' }}>
            <input
              type="checkbox"
              checked={showUnsolvedOnly}
              onChange={() => setShowUnsolvedOnly(!showUnsolvedOnly)}
              style={{ accentColor: 'var(--brand-green)', width: '16px', height: '16px' }}
            />
            ❌ Unsolved Only
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={expandAll}
              style={{
                background: 'var(--ifm-color-emphasis-100, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.08))',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--ifm-color-emphasis-800, #cbd5e1)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--ifm-color-emphasis-100, rgba(255, 255, 255, 0.04))';
                e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.08))';
              }}
            >
              👐 Expand All
            </button>
            <button
              onClick={collapseAll}
              style={{
                background: 'var(--ifm-color-emphasis-100, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.08))',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--ifm-color-emphasis-800, #cbd5e1)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--ifm-color-emphasis-100, rgba(255, 255, 255, 0.04))';
                e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.08))';
              }}
            >
              🪗 Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* 4. Problems Grouped by Week Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredProblems.length === 0 ? (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#8f9cae',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '14px',
            background: 'var(--ifm-background-surface-color, #101525)'
          }}>
            📭 No problems found matching the selected filters.
          </div>
        ) : (
          problemsByWeek.map(group => {
            const isExpanded = expandedWeeks.includes(group.weekNum);
            const groupSolvedCount = group.problems.filter(p => solved.includes(p.id)).length;
            const groupTotalCount = group.problems.length;
            const groupIsCompleted = groupSolvedCount === groupTotalCount;

            return (
              <div 
                key={group.weekNum}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  background: 'var(--ifm-background-surface-color, #101525)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Accordion Header */}
                <div 
                  onClick={() => toggleWeek(group.weekNum)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    background: isExpanded ? 'rgba(74, 222, 128, 0.02)' : 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isExpanded ? '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.04))' : 'none',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Caret icon */}
                    <span style={{
                      display: 'inline-block',
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      fontSize: '0.85rem',
                      color: 'var(--brand-green)'
                    }}>
                      ▶
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ifm-font-color-base, #f8fafc)' }}>
                      Week {group.weekNum}: {group.topic}
                    </span>
                    <Link
                      to={`/technical-knowledge/dsa/${group.weekSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--brand-purple)',
                        textDecoration: 'none',
                        background: 'rgba(168, 85, 247, 0.08)',
                        border: '1px solid rgba(168, 85, 247, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                      }}
                    >
                      Lesson Doc 📖
                    </Link>
                  </div>

                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: groupIsCompleted ? 'rgba(74, 222, 128, 0.12)' : 'var(--ifm-color-emphasis-100, rgba(255, 255, 255, 0.04))',
                    color: groupIsCompleted ? '#4ade80' : 'var(--ifm-color-content-secondary, #8f9cae)',
                    border: groupIsCompleted ? '1px solid rgba(74, 222, 128, 0.25)' : '1px solid var(--ifm-color-emphasis-300, rgba(255, 255, 255, 0.06))',
                  }}>
                    {groupSolvedCount} / {groupTotalCount} Solved
                  </span>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div style={{ overflowX: 'auto' }}>
                    <table 
                      className="dsa-dashboard-table"
                      style={{
                        width: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                        textAlign: 'left',
                        color: 'var(--ifm-font-color-base, #e2e8f0)'
                      }}
                    >
                      <thead>
                        <tr style={{ background: 'rgba(15, 18, 29, 0.3)', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.04))' }}>
                          <th style={{ padding: '10px 16px', color: 'var(--brand-green)', fontWeight: 700, width: '70px', textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.04))', fontSize: '0.85rem' }}>Solved</th>
                          <th style={{ padding: '10px 16px', color: 'var(--brand-green)', fontWeight: 700, textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.04))', fontSize: '0.85rem' }}>Problem</th>
                          <th style={{ padding: '10px 16px', color: 'var(--brand-green)', fontWeight: 700, width: '100px', textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.04))', fontSize: '0.85rem' }}>Diff</th>
                          <th style={{ padding: '10px 16px', color: 'var(--brand-green)', fontWeight: 700, textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.04))', fontSize: '0.85rem' }}>Target Companies</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.problems.map((p, pIdx) => {
                          const isSolved = solved.includes(p.id);

                          return (
                            <tr 
                              key={p.id}
                              style={{
                                background: pIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.008)' : 'transparent',
                                transition: 'background-color 0.2s ease',
                                borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.02))'
                              }}
                            >
                              {/* Solved check box */}
                              <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.02))' }}>
                                <input
                                  type="checkbox"
                                  checked={isSolved}
                                  onChange={() => toggleSolved(p.id)}
                                  style={{
                                    cursor: 'pointer',
                                    width: '18px',
                                    height: '18px',
                                    accentColor: 'var(--brand-green)'
                                  }}
                                />
                              </td>

                              {/* Problem Name & link */}
                              <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.02))' }}>
                                <a 
                                  href={p.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ 
                                    color: 'var(--ifm-font-color-base, #e2e8f0)', 
                                    fontSize: '0.88rem',
                                    fontWeight: 600, 
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  {p.title} 
                                  <span style={{ fontSize: '0.75rem', color: 'var(--ifm-color-content-secondary, #8f9cae)' }}>#{p.id}</span>
                                  <span style={{ fontSize: '0.8rem' }}>🔗</span>
                                </a>
                              </td>

                              {/* Difficulty Badge */}
                              <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.02))' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: p.difficulty === 'Easy' 
                                    ? 'rgba(74, 222, 128, 0.1)' 
                                    : p.difficulty === 'Medium' 
                                      ? 'rgba(251, 191, 36, 0.1)' 
                                      : 'rgba(248, 113, 113, 0.1)',
                                  color: p.difficulty === 'Easy' 
                                    ? '#4ade80' 
                                    : p.difficulty === 'Medium' 
                                      ? '#fbbf24' 
                                      : '#f87171',
                                  border: `1px solid ${
                                    p.difficulty === 'Easy' 
                                       ? 'rgba(74, 222, 128, 0.2)' 
                                       : p.difficulty === 'Medium' 
                                         ? 'rgba(251, 191, 36, 0.2)' 
                                         : 'rgba(248, 113, 113, 0.2)'
                                  }`
                                }}>
                                  {p.difficulty}
                                </span>
                              </td>

                              {/* Target Companies */}
                              <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid var(--ifm-table-border-color, rgba(255, 255, 255, 0.02))' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                                  {p.companies.map(c => (
                                    <Link
                                      key={c}
                                      to={getCompanyLink(c)}
                                      style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: 'rgba(129, 140, 248, 0.08)',
                                        color: '#818cf8',
                                        border: '1px solid rgba(129, 140, 248, 0.15)',
                                        textDecoration: 'none',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {c}
                                    </Link>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
