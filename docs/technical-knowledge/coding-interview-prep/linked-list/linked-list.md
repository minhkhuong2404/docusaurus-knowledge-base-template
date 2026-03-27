---
id: linked-list
title: Linked List
sidebar_position: 6
description: Master pointer manipulation and linked list patterns for interviews
---

# 🔗 Linked List

## Concept

A **Linked List** is a chain of nodes where each node holds a value and a pointer to the next node. Unlike arrays, nodes are not stored contiguously in memory — you can only access elements by following pointers from the head.

```java
// Standard ListNode definition (used in all LeetCode problems)
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}
```

**Key property**: Insertions and deletions are O(1) if you have a pointer to the location — but finding that location is O(n).

---

## When to Use

- Problem explicitly gives you a `ListNode`
- Need O(1) insert/delete at a known position
- Cycle detection (Floyd's algorithm)
- Reversing a sequence in-place
- Merge operations on sorted sequences

---

## Core Techniques

### 1. Dummy Head Node
Eliminates edge cases when inserting/deleting from the head:

```java
ListNode dummy = new ListNode(0);
dummy.next = head;
ListNode prev = dummy;
// ... manipulate list ...
return dummy.next; // new head
```

### 2. Fast & Slow Pointers
Slow moves 1 step, fast moves 2 steps. Used for:
- Finding the **middle** node
- Detecting **cycles**
- Finding the **k-th from end** node

```java
// Find middle
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
// slow is now at middle
```

### 3. In-Place Reversal
```java
public ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev; // new head
}
```

---

## Worked Example 1: Detect and Return Cycle Start

```java
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;

    // Phase 1: Detect if cycle exists
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) break; // they meet inside the cycle
    }

    // No cycle
    if (fast == null || fast.next == null) return null;

    // Phase 2: Find cycle start
    // Move one pointer back to head; advance both one step at a time
    // They meet at the cycle entry point
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }
    return slow;
}
```

**Why does Phase 2 work?** If the distance from head to cycle start is `d`, and the cycle length is `c`, then after phase 1 the meeting point is exactly `c - (d % c)` steps from the cycle start — and advancing one pointer from head by `d` steps lands both at the cycle start simultaneously.

---

## Worked Example 2: Merge K Sorted Lists

```java
public ListNode mergeKLists(ListNode[] lists) {
    // Use a min-heap ordered by node value
    PriorityQueue<ListNode> minHeap = new PriorityQueue<>(
        (a, b) -> a.val - b.val
    );

    // Add the head of each list
    for (ListNode node : lists) {
        if (node != null) minHeap.offer(node);
    }

    ListNode dummy = new ListNode(0), curr = dummy;
    while (!minHeap.isEmpty()) {
        ListNode smallest = minHeap.poll();
        curr.next = smallest;
        curr = curr.next;
        if (smallest.next != null) minHeap.offer(smallest.next);
    }
    return dummy.next;
}
```

**Time**: O(N log k) where N = total nodes, k = number of lists

---

## Worked Example 3: Reverse Nodes in k-Group

```java
public ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode groupPrev = dummy;

    while (true) {
        // Find the k-th node from groupPrev
        ListNode kth = getKth(groupPrev, k);
        if (kth == null) break;

        ListNode groupNext = kth.next;

        // Reverse group
        ListNode prev = groupNext, curr = groupPrev.next;
        while (curr != groupNext) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }

        // Reconnect
        ListNode tmp = groupPrev.next; // old first = new last in group
        groupPrev.next = kth;
        groupPrev = tmp;
    }
    return dummy.next;
}

private ListNode getKth(ListNode curr, int k) {
    while (curr != null && k > 0) {
        curr = curr.next;
        k--;
    }
    return curr;
}
```

---

## LeetCode Problems

### 🟢 Easy
| # | Problem | Technique |
|---|---|---|
| 21 | [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | Dummy head |
| 83 | [Remove Duplicates from Sorted List](https://leetcode.com/problems/remove-duplicates-from-sorted-list/) | Single pass |
| 141 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | Fast/Slow |
| 160 | [Intersection of Two Linked Lists](https://leetcode.com/problems/intersection-of-two-linked-lists/) | Length equalization |
| 206 | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | In-place reversal |
| 234 | [Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/) | Find mid + reverse |

### 🟡 Medium
| # | Problem | Technique |
|---|---|---|
| 2 | [Add Two Numbers](https://leetcode.com/problems/add-two-numbers/) | Carry simulation |
| 19 | [Remove Nth Node From End](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | Two pointers, n-gap |
| 61 | [Rotate List](https://leetcode.com/problems/rotate-list/) | Find new tail |
| 82 | [Remove Duplicates II](https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/) | Dummy head |
| 86 | [Partition List](https://leetcode.com/problems/partition-list/) | Two dummy heads |
| 92 | [Reverse Linked List II](https://leetcode.com/problems/reverse-linked-list-ii/) | Partial reversal |
| 138 | [Copy List with Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/) | HashMap / interleave |
| 142 | [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) | Floyd's phase 2 |
| 143 | [Reorder List](https://leetcode.com/problems/reorder-list/) | Find mid + reverse + merge |
| 148 | [Sort List](https://leetcode.com/problems/sort-list/) | Merge sort on list |

### 🔴 Hard
| # | Problem | Technique |
|---|---|---|
| 23 | [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-lists/) | Min-heap |
| 25 | [Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/) | Group reversal |
