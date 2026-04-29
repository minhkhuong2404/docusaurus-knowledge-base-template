---
id: week-3-linked-lists-pointers
title: "Week 3: Linked Lists & Fast/Slow Pointers"
description: Transition from contiguous arrays to node-based data structures. Master reference manipulation, Dummy Nodes, and the Fast & Slow Pointer technique in Java.
tags: [dsa, java, linked-lists, fast-slow-pointers, algorithms, week-3]
sidebar_position: 3
---

# Week 3: Linked Lists & Fast/Slow Pointers

## 1. Overview

Welcome to Week 3! After spending two weeks mastering arrays and strings (contiguous memory), we are now moving to **Linked Lists** (scattered memory). This week is fundamentally about mastering **object references** in Java. You will learn how to stitch data together across the heap, how to safely delete elements without memory leaks, and how to detect cycles using the famous Fast & Slow pointer technique.

**Goals for this week:**
- Understand how nodes are stored in the JVM Heap and how Garbage Collection works.
- Master the "Dummy Head" pattern to eliminate edge cases when modifying lists.
- Learn Floyd's Tortoise and Hare algorithm for cycle detection and finding midpoints.

### Knowledge You Need Before Starting

- Week 1-2 comfort with pointers-as-indices and single-pass thinking.
- Java references and object mutation basics (`a = b` shares the same node object).
- Null-handling discipline to avoid `NullPointerException`.
- Confidence tracing pointer updates step-by-step on paper.

---

## 2. Theory & Fundamentals

### 2.1 Mental Model: Arrays vs. Linked Lists in Memory

This is the single most important conceptual shift of Week 3. Understanding *why* the memory layout differs explains every performance trade-off that follows.

**Array in memory — one contiguous block:**
```
Heap:
┌────┬────┬────┬────┬────┐
│ 10 │ 20 │ 30 │ 40 │ 50 │
└────┴────┴────┴────┴────┘
0x100 0x104 0x108 0x10C 0x110

To get element[3]: base_addr + 3 * 4 = 0x100 + 12 = 0x10C  → O(1) ✅
```

**Linked List in memory — scattered nodes:**
```
Heap:
0x200          0x8A0          0x431          0x7F2
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ val: 10  │   │ val: 20  │   │ val: 30  │   │ val: 40  │
│ next:8A0 │──▶│ next:431 │──▶│ next:7F2 │──▶│ next:null│
└──────────┘   └──────────┘   └──────────┘   └──────────┘

To get node[3]: must walk 0x200 → 0x8A0 → 0x431 → 0x7F2  → O(N) ❌
```

Key takeaway: A Linked List trades random access speed for flexible insertion/deletion. There is no way to jump to the 3rd node without walking through the first two — the address of node `i` is not mathematically predictable.

---

### 2.2 Linked Lists vs. Arrays — Full Comparison

| Operation                     | `int[]` / `ArrayList` | Singly Linked List                  |
| ----------------------------- | --------------------- | ----------------------------------- |
| Access element by index       | $O(1)$                | $O(N)$                              |
| Insert / Delete at **head**   | $O(N)$ (shift all)    | **$O(1)$** ✅                        |
| Insert / Delete at **tail**   | $O(1)$ amortized      | $O(N)$ (must walk to tail)*         |
| Insert / Delete in **middle** | $O(N)$ (shift)        | $O(1)$ if you have the prev node    |
| Search (unsorted)             | $O(N)$                | $O(N)$                              |
| Memory overhead               | Low (just values)     | Higher (value + reference per node) |
| Cache friendliness            | ✅ Excellent           | ❌ Poor (nodes scattered)            |

*$O(1)$ tail insert if you maintain a `tail` reference (common in practice).

**When to prefer a Linked List over an Array:**
- Frequent insertions/deletions at the **head** (e.g., implementing a Stack or Queue).
- Size changes dramatically and unpredictably.
- You never need random access by index.

---

### 2.3 Singly vs. Doubly Linked Lists

```
Singly Linked:
head → [A|next] → [B|next] → [C|next] → null
                                           ↑ can only go forward

Doubly Linked:
head → [null|A|next] ⇄ [prev|B|next] ⇄ [prev|C|null] ← tail
         ↑ can go forward AND backward
```

|                                      | Singly                         | Doubly                            |
| ------------------------------------ | ------------------------------ | --------------------------------- |
| Memory per node                      | `val` + 1 ref                  | `val` + 2 refs                    |
| Traverse backward                    | ❌                              | ✅                                 |
| Delete a node (with reference to it) | ❌ Need `prev`                  | ✅ Use `node.prev`                 |
| Use cases                            | Most LeetCode problems, stacks | LRU Cache, Browser history, Deque |

---

### 2.4 Java Specifics: References, Not Pointers

Java does not expose raw memory addresses. Instead, variables hold **references** (think of them as a label pointing to an object in the heap). This creates a common misconception:

```java
ListNode a = new ListNode(1);
ListNode b = a;       // b is NOT a copy of the node — both labels point to SAME object

b.val = 99;
System.out.println(a.val); // prints 99! Changing via b changes the same object.
```

Visualized:
```
Before:   a ──┐
               ▼
b ────────────▶ [val:1 | next:null]   (ONE object, TWO references)

After b.val = 99:
a ──┐
     ▼
b ──▶ [val:99 | next:null]
```

This is why pointer manipulation works in Java: when you do `curr.next = curr.next.next`, you are changing which object `curr.next` points to — you are not copying anything.

**Garbage Collection — Java's safety net:**

In C/C++, you must manually `free()` unlinked nodes or you leak memory. In Java, once a node has zero references pointing to it, the **JVM Garbage Collector (GC)** automatically reclaims its memory.

```java
// Before:  dummy → [1] → [2] → [3] → null
curr.next = curr.next.next; // [2] is now unreferenced

// After:   dummy → [1] → [3] → null
//          [2] is floating with zero references → GC will clean it up
```

> **Interview Tip:** If an interviewer asks about memory management, mention that Java's GC handles deallocation automatically via reference counting / mark-and-sweep. You don't need to worry about leaks, but you should avoid unnecessarily holding references (e.g., don't keep a reference to a detached sublist if you don't need it).

---

### 2.5 The Dummy Head Pattern — Why It Exists

The most common source of bugs in linked list problems is handling the **head node** as a special case. The Dummy Head pattern eliminates this entirely.

**Without Dummy Head — messy edge cases:**
```java
// Removing all nodes with value 0 from: 0 → 0 → 1 → 0 → 2
public ListNode removeElements(ListNode head, int val) {
    // Special case: skip all leading 0s at the head
    while (head != null && head.val == val) {
        head = head.next;
    }
    // Now handle the rest... (more code needed)
}
```

**With Dummy Head — uniform treatment of all nodes:**
```java
public ListNode removeElements(ListNode head, int val) {
    ListNode dummy = new ListNode(-1);
    dummy.next = head; // dummy sits before the real head

    ListNode curr = dummy;
    while (curr.next != null) {
        if (curr.next.val == val) {
            curr.next = curr.next.next; // skip the target node
        } else {
            curr = curr.next;
        }
    }
    return dummy.next; // real head (might have changed)
}
```

The dummy node acts as a stable anchor. Since `curr` always points to the node *before* the one being considered, you can remove any node (including the original head) using the same logic.

**When to always use a Dummy Head:**
- Merging two sorted lists.
- Removing specific elements (the head might be one of them).
- Any problem where the resulting list's head could differ from the input's head.

---

### 2.6 Floyd's Tortoise and Hare — The Math Behind It

**Why does fast moving at 2x speed guarantee it catches slow?**

Imagine a circular running track. If you run at 2 mph and your friend runs at 1 mph starting from the same point, you will inevitably lap them. In a cyclic linked list, the "fast" pointer similarly gains 1 step on "slow" per iteration, so it will always catch up.

```
List with cycle: 1 → 2 → 3 → 4 → 5 → 6
                              ↑_____________|
                              cycle starts at node 4

Step 0:  slow=1, fast=1
Step 1:  slow=2, fast=3
Step 2:  slow=3, fast=5
Step 3:  slow=4, fast=3  (fast wrapped around via cycle)
Step 4:  slow=5, fast=5  ← MEET (cycle detected!)
```

**Finding the cycle entry point (Floyd's Phase 2):**

After slow and fast meet inside the cycle, reset `slow` to `head`. Then move both at 1x speed. They will meet exactly at the cycle's entry node.

**The mathematical proof (simplified):**

Let:
- `F` = distance from head to cycle entry
- `C` = cycle length
- `h` = distance from cycle entry to meeting point

When they meet: slow has traveled `F + h`, fast has traveled `F + h + C` (one extra loop).
Since fast moves 2x: `2(F + h) = F + h + C` → `F + h = C` → `F = C - h`.

`C - h` is the remaining distance from the meeting point back to the cycle entry. So if slow resets to head (distance `F` from entry) and fast stays at meeting point (distance `C - h = F` from entry), they walk the same number of steps to reach the entry — guaranteed to collide there.

---

## 3. Code Templates (Java)

### The Standard `ListNode` Class
```java
public class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
```

### Template 1: Basic Traversal

```java
// Always use this null-check pattern
ListNode curr = head;
while (curr != null) {
    // process curr.val
    curr = curr.next;
}
```

### Template 2: The Dummy Head Pattern

```java
public ListNode manipulateList(ListNode head) {
    ListNode dummy = new ListNode(-1);
    dummy.next = head;
    ListNode curr = dummy;

    while (curr.next != null) {
        if (shouldSkip(curr.next)) {
            curr.next = curr.next.next; // detach the node, GC handles cleanup
        } else {
            curr = curr.next;
        }
    }

    return dummy.next; // real head (may have changed from original)
}
```

### Template 3: Iterative List Reversal

```java
public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;

    while (curr != null) {
        ListNode nextTemp = curr.next; // 1. save what comes next
        curr.next = prev;              // 2. flip the pointer
        prev = curr;                   // 3. advance prev
        curr = nextTemp;               // 4. advance curr
    }

    return prev; // prev is the new head when curr hits null
}
```

Pointer state walkthrough for `1 → 2 → 3 → null`:
```
Initial:  prev=null, curr=1
Step 1:   nextTemp=2, 1.next=null, prev=1, curr=2
Step 2:   nextTemp=3, 2.next=1,   prev=2, curr=3
Step 3:   nextTemp=null, 3.next=2, prev=3, curr=null
Return:   prev=3  →  3 → 2 → 1 → null ✅
```

### Template 4: Fast & Slow Pointers — Cycle Detection

```java
public boolean hasCycle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) { // always check BOTH for fast
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true; // reference equality, not .equals()
    }
    return false;
}
```

> **Critical:** The while condition must check `fast != null && fast.next != null`. If you only check `fast.next != null`, you will get a NullPointerException when `fast` itself is null.

### Template 5: Find Middle Node

```java
// Returns the SECOND middle node when length is even (LC 876 behavior)
public ListNode findMiddle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}

// Returns the FIRST middle node when length is even (useful for palindrome check)
public ListNode findMiddleFirst(ListNode head) {
    ListNode slow = head;
    ListNode fast = head.next; // fast starts one step ahead

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

### Template 6: Find Cycle Entry (Floyd's Phase 2)

```java
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;

    // Phase 1: Detect cycle
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) break;
    }
    if (fast == null || fast.next == null) return null; // no cycle

    // Phase 2: Find entry
    slow = head; // reset slow to head
    while (slow != fast) {
        slow = slow.next; // both move 1 step
        fast = fast.next;
    }
    return slow; // cycle entry point
}
```

### Template 7: Remove N-th Node From End

```java
// Give fast a head-start of N steps, then move both until fast hits null
public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(-1);
    dummy.next = head;
    ListNode slow = dummy;
    ListNode fast = dummy;

    // Fast gets N+1 steps ahead (so slow stops at the node BEFORE the target)
    for (int i = 0; i <= n; i++) fast = fast.next;

    while (fast != null) {
        slow = slow.next;
        fast = fast.next;
    }

    slow.next = slow.next.next; // remove target
    return dummy.next;
}
```

### Template 8: Merge Two Sorted Lists

```java
public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(-1);
    ListNode curr = dummy;

    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            curr.next = l1;
            l1 = l1.next;
        } else {
            curr.next = l2;
            l2 = l2.next;
        }
        curr = curr.next;
    }

    curr.next = (l1 != null) ? l1 : l2; // attach remaining nodes
    return dummy.next;
}
```

---

## 4. Problem-Solving Framework

### Step 1 — Clarify (2 minutes)

Before writing anything, ask:
- Is this a singly or doubly linked list?
- Can I modify the node values, or only rewire `.next` pointers?
- Can I use extra memory (HashSet, Stack), or must it be $O(1)$ space?
- What should be returned if `head` is `null`?
- Can the list have duplicate values?
- For cycle problems: is there guaranteed to be a cycle?

### Step 2 — Draw the Before/After State

Linked list problems are pointer problems. **Always draw the list state before and after your operation.** Trying to reason about pointer changes in your head leads to bugs.

```
Problem: Remove node with value 3 from  1 → 2 → 3 → 4 → 5

Before:  dummy → 1 → 2 → 3 → 4 → 5 → null
                         ↑ curr.next (this is what we want to remove)

After:   dummy → 1 → 2 → 4 → 5 → null
                     ↑ curr
Operation: curr.next = curr.next.next
```

### Step 3 — Identify the Pattern

| What the problem says                    | Pattern                                        |
| ---------------------------------------- | ---------------------------------------------- |
| Reverse the list / Reverse a sublist     | Iterative reversal (prev/curr/nextTemp)        |
| Find middle / N-th from end              | Fast & Slow pointers                           |
| Detect / find entry of cycle             | Floyd's algorithm (two phases)                 |
| Merge / Remove nodes / Head might change | Dummy Head                                     |
| Palindrome check                         | Find middle + Reverse second half + Compare    |
| Add numbers as lists                     | Dummy Head + carry variable                    |
| Deep copy with random pointers           | HashMap (node → clone) or interleave technique |

### Step 4 — Code Carefully, One Pointer at a Time

Never move multiple pointers in a single line without saving `next` first. The most common bugs are:
1. Lost reference (forgot to save `nextTemp` before overwriting `.next`).
2. NullPointerException (accessed `.next` on a `null` node).
3. Infinite loop (forgot to advance `curr` in one branch of an if-else).

### Step 5 — Trace With a Short Example

After coding, manually trace through a list of 3-4 nodes including edge cases:
- Empty list (`head == null`)
- Single node
- Two nodes
- The target is the head or tail

---

## 5. Pattern Recognition Guide

### Signal → Pattern Mapping

| Problem signal                    | Pattern to use                   | Key idea                                                  |
| --------------------------------- | -------------------------------- | --------------------------------------------------------- |
| "Reverse the whole list"          | Iterative reversal               | Track `prev`, `curr`, `nextTemp`                          |
| "Reverse a sublist [left, right]" | Iterative reversal with anchor   | Find the node before `left`, reverse `right-left` times   |
| "Reverse in K-groups"             | Iterative reversal in chunks     | Reverse K nodes, attach tail to next group's head         |
| "Find middle node"                | Fast & Slow (2:1 speed)          | When fast reaches end, slow is at middle                  |
| "N-th node from end"              | Fast & Slow (N-step gap)         | Start fast N ahead, move both till fast hits null         |
| "Detect cycle"                    | Floyd's Phase 1                  | fast gains 1 step per iteration, guaranteed to catch slow |
| "Find cycle entry"                | Floyd's Phase 1 + Phase 2        | Reset slow to head, move both at 1x                       |
| "Head node might be removed"      | Dummy Head                       | `dummy.next = head`, return `dummy.next`                  |
| "Merge two sorted lists"          | Dummy Head + two pointers        | Pick smaller head each step                               |
| "Palindrome check"                | Find middle + Reverse + Compare  | Reverse second half in-place, compare with first          |
| "Intersection of two lists"       | Two pointers with list-switching | Both pointers traverse both lists, meet at intersection   |
| "Copy with random pointers"       | HashMap (old→new) or interleave  | Map each original node to its clone                       |

---

### Detailed Recognition Walkthroughs

#### Recognizing Floyd's Phase 2 (LC 142 — Cycle Detection II)

The key insight that is easy to miss: after phase 1, **do not reset fast to head**. Only reset `slow`. Then move BOTH at 1 step. The mathematical property guarantees they meet at the cycle entry.

Common mistake: students reset both pointers to `head`, which just re-runs phase 1 and misses the entry point.

#### Recognizing the "Palindrome" Pattern (LC 234)

When you see: *"check if a linked list is a palindrome"*:
1. You cannot do random access, so comparing `list[0]` with `list[n-1]` directly is impossible.
2. Strategy: find middle → reverse second half in-place → compare node-by-node → (optionally restore the list).
3. Do NOT copy all values to an array unless the interviewer says $O(N)$ space is allowed.

#### Recognizing the "Intersection" Pattern (LC 160)

When you see: *"find where two lists merge"*:
1. The trick: both pointers travel total length `A + B`. If they switch lists at their respective ends, they always meet at the intersection (or both reach `null` if no intersection).
2. This requires zero extra memory and one pass — no length calculation needed.

```java
public ListNode getIntersectionNode(ListNode headA, ListNode headB) {
    ListNode a = headA, b = headB;
    while (a != b) {
        a = (a == null) ? headB : a.next;
        b = (b == null) ? headA : b.next;
    }
    return a; // null if no intersection, else the intersection node
}
```

---

## 6. Common Mistakes & How to Avoid Them

### Mistake 1: Forgetting to Save `nextTemp` Before Overwriting

```java
// ❌ WRONG — you lose the rest of the list
curr.next = prev;
curr = curr.next; // curr.next is now prev, not the original next!

// ✅ CORRECT — save next before overwriting
ListNode nextTemp = curr.next;
curr.next = prev;
prev = curr;
curr = nextTemp;
```

### Mistake 2: Wrong While Condition for Fast Pointer

```java
// ❌ NullPointerException when fast == null and you call fast.next
while (fast.next != null && fast.next.next != null) { ... }
// What if fast itself is null? Boom!

// ✅ CORRECT — check fast first, then fast.next
while (fast != null && fast.next != null) { ... }
```

### Mistake 3: Using `.equals()` Instead of `==` for Node Comparison

```java
// ❌ WRONG — .equals() compares object content (val, next), not identity
if (slow.equals(fast)) return true;

// ✅ CORRECT — use == to check if two references point to the SAME object
if (slow == fast) return true;
```

### Mistake 4: Not Using a Dummy Head When the Head Can Change

```java
// ❌ Fragile — requires special handling if head needs to be removed
public ListNode removeElements(ListNode head, int val) {
    if (head == null) return null;
    if (head.val == val) return removeElements(head.next, val); // messy recursion

// ✅ Clean — dummy handles all nodes uniformly
public ListNode removeElements(ListNode head, int val) {
    ListNode dummy = new ListNode(-1);
    dummy.next = head;
    ListNode curr = dummy;
    while (curr.next != null) {
        if (curr.next.val == val) curr.next = curr.next.next;
        else curr = curr.next;
    }
    return dummy.next;
}
```

### Mistake 5: Infinite Loop — Forgetting to Advance `curr`

```java
// ❌ Infinite loop if curr.next.val != val — curr never advances
while (curr.next != null) {
    if (curr.next.val == val) {
        curr.next = curr.next.next;
    }
    // forgot: else curr = curr.next;
}

// ✅ Always advance curr in the else branch
while (curr.next != null) {
    if (curr.next.val == val) {
        curr.next = curr.next.next;
    } else {
        curr = curr.next; // critical!
    }
}
```

### Mistake 6: Off-by-One in N-th From End

```java
// For "Remove N-th node from end", you need slow to stop at the node
// BEFORE the target, not AT the target.
// Give fast N+1 steps head start (not N), using dummy as starting point.

ListNode dummy = new ListNode(-1);
dummy.next = head;
ListNode slow = dummy; // ← start at dummy, not head
ListNode fast = dummy;

for (int i = 0; i <= n; i++) fast = fast.next; // N+1 steps
// Now slow is one step before target when fast hits null
```

---

## 7. Worked Examples

### Example 1: LeetCode 206 — Reverse Linked List

**Thinking process:**
1. "I need to flip all `.next` pointers."
2. To reverse `A → B → C → null` to `null ← A ← B ← C`, each node's `.next` must point to its predecessor.
3. I need 3 pointers: `prev` (predecessor), `curr` (current), `nextTemp` (to not lose the rest).

```java
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;

        while (curr != null) {
            ListNode nextTemp = curr.next; // save
            curr.next = prev;             // flip
            prev = curr;                  // advance prev
            curr = nextTemp;              // advance curr
        }
        return prev; // prev is the new head
    }
}
```

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 2: LeetCode 876 — Middle of the Linked List

**Thinking process:**
1. "I don't know the length, so I can't compute `length / 2`."
2. "If fast moves 2x and slow moves 1x, when fast finishes, slow is exactly halfway."
3. Even length edge case: `1 → 2 → 3 → 4`: fast ends at null, slow ends at `3` (second middle) ✅.

```java
class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}
```

Dry run for `1 → 2 → 3 → 4 → 5`:
| Step | slow | fast                 |
| ---- | ---- | -------------------- |
| 0    | 1    | 1                    |
| 1    | 2    | 3                    |
| 2    | 3    | 5                    |
| 3    | —    | fast.next=null, stop |

Return `slow = 3` ✅

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 3: LeetCode 234 — Palindrome Linked List

**Thinking process:**
1. "I need to compare first half with second half, but can't do random access."
2. "Find middle → reverse second half → compare → done."
3. Edge case: restore the list? The problem doesn't require it, but mention it for production code.

```java
class Solution {
    public boolean isPalindrome(ListNode head) {
        // Step 1: Find the end of first half
        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        // slow is now the last node of the first half

        // Step 2: Reverse the second half
        ListNode secondHalfHead = reverseList(slow.next);

        // Step 3: Compare both halves
        ListNode p1 = head, p2 = secondHalfHead;
        boolean isPalin = true;
        while (p2 != null) { // second half is shorter or equal
            if (p1.val != p2.val) { isPalin = false; break; }
            p1 = p1.next;
            p2 = p2.next;
        }

        // Step 4 (good practice): Restore the list
        slow.next = reverseList(secondHalfHead);
        return isPalin;
    }

    private ListNode reverseList(ListNode head) {
        ListNode prev = null, curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
}
```

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 4: LeetCode 142 — Linked List Cycle II *(Floyd's Full Algorithm)*

**Thinking process:**
1. "Detect cycle first (Phase 1). Find where they meet."
2. "Reset slow to head. Move both at 1x speed (Phase 2)."
3. "Math guarantees they meet at the cycle entry."

```java
class Solution {
    public ListNode detectCycle(ListNode head) {
        ListNode slow = head, fast = head;

        // Phase 1: Find meeting point
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) break;
        }
        if (fast == null || fast.next == null) return null;

        // Phase 2: Find cycle entry
        slow = head; // only reset slow
        while (slow != fast) {
            slow = slow.next;
            fast = fast.next; // both move 1 step now
        }
        return slow;
    }
}
```

*Time: $O(N)$. Space: $O(1)$.*

---

### Example 5: LeetCode 143 — Reorder List

**Problem:** Given `1 → 2 → 3 → 4 → 5`, reorder to `1 → 5 → 2 → 4 → 3`.

**Thinking process:**
1. "The pattern is: first, last, second, second-last..." → merge first half with reversed second half.
2. Three steps: Find middle → Reverse second half → Merge the two halves.

```java
class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;

        // Step 1: Find middle (use first-middle variant)
        ListNode slow = head, fast = head.next;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        // slow is the last node of the first half

        // Step 2: Reverse second half
        ListNode secondHalf = reverseList(slow.next);
        slow.next = null; // cut the list in half!

        // Step 3: Merge (interleave)
        ListNode first = head, second = secondHalf;
        while (second != null) {
            ListNode tmp1 = first.next;
            ListNode tmp2 = second.next;
            first.next = second;
            second.next = tmp1;
            first = tmp1;
            second = tmp2;
        }
    }

    private ListNode reverseList(ListNode head) { /* same as above */ }
}
```

*Time: $O(N)$. Space: $O(1)$.*

---

## 8. Decision Tree: Which Linked List Pattern?

```
Is the list's head likely to change (or be removed)?
└── YES → Use a DUMMY HEAD node

Does the problem involve finding position?
├── Middle of list              → Fast (2x) & Slow (1x)
├── N-th from end               → Fast gets N-step head start, then both 1x
└── Cycle entry point           → Floyd's Phase 1 + Phase 2

Does the problem involve cycle detection?
├── "Does a cycle exist?"       → Floyd's Phase 1 only (hasCycle)
└── "Where does cycle start?"   → Floyd's Phase 1 + Phase 2 (detectCycle)

Does the problem involve reversing?
├── Whole list                  → Iterative reversal (prev/curr/nextTemp)
├── Sublist [left, right]       → Find left-1 anchor, reverse N times
├── In K-groups                 → Reverse K, connect tail to next group
└── Palindrome check            → Find middle + reverse second half + compare

Does the problem involve two lists?
├── Merge sorted lists          → Dummy Head + pick smaller head
└── Intersection               → Two pointers, switch lists at end

Does the problem need O(1) space?
├── YES → Floyd's, Reversal, Two Pointers (never HashSet)
└── NO  → HashSet or HashMap acceptable (Copy with Random, Cycle detection)
```

---

## 9. Complexity Cheat Sheet

| Operation                       | Time       | Space             |
| ------------------------------- | ---------- | ----------------- |
| Traverse full list              | $O(N)$     | $O(1)$            |
| Insert at head                  | $O(1)$     | $O(1)$            |
| Insert at tail (no tail ref)    | $O(N)$     | $O(1)$            |
| Delete node (given `prev`)      | $O(1)$     | $O(1)$            |
| Delete node (given only `node`) | $O(1)$*    | $O(1)$            |
| Reverse full list (iterative)   | $O(N)$     | $O(1)$            |
| Reverse full list (recursive)   | $O(N)$     | $O(N)$ call stack |
| Find middle                     | $O(N)$     | $O(1)$            |
| Detect cycle (Floyd's)          | $O(N)$     | $O(1)$            |
| Find cycle entry (Floyd's)      | $O(N)$     | $O(1)$            |
| Detect cycle (HashSet)          | $O(N)$     | $O(N)$            |
| Merge two sorted lists          | $O(M + N)$ | $O(1)$            |
| Copy list with random pointer   | $O(N)$     | $O(N)$            |

*Delete by copying next node's value into current node, then skip next.

---

## 10. 7-Day Practice Plan (21 Problems)

For each problem, follow this ritual:
1. Read and clarify (2 min).
2. Draw the list state before and after your operation.
3. State the brute force and its complexity.
4. Identify the pattern from Section 5.
5. Code, trace manually, and state final complexity.

**Day 1: Linked List Basics**
1. [Reverse Linked List (LC 206)](https://leetcode.com/problems/reverse-linked-list/) — Master the 3-pointer reversal
2. [Linked List Cycle (LC 141)](https://leetcode.com/problems/linked-list-cycle/) — Floyd's Phase 1
3. [Middle of the Linked List (LC 876)](https://leetcode.com/problems/middle-of-the-linked-list/) — Fast & Slow baseline

**Day 2: Dummy Heads & Removals**
4. [Merge Two Sorted Lists (LC 21)](https://leetcode.com/problems/merge-two-sorted-lists/) — Dummy Head + two pointers
5. [Remove Linked List Elements (LC 203)](https://leetcode.com/problems/remove-linked-list-elements/) — Dummy Head removes edge case
6. [Remove Nth Node From End of List (LC 19)](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) — N-step head start

**Day 3: Advanced Fast & Slow Pointers**
7. [Linked List Cycle II (LC 142)](https://leetcode.com/problems/linked-list-cycle-ii/) — Floyd's Phase 1 + Phase 2
8. [Reorder List (LC 143)](https://leetcode.com/problems/reorder-list/) — Find middle + reverse + merge
9. [Find the Duplicate Number (LC 287)](https://leetcode.com/problems/find-the-duplicate-number/) ⭐ — *Array problem solved via cycle logic!*

**Day 4: Reversal Variations**
10. [Reverse Linked List II (LC 92)](https://leetcode.com/problems/reverse-linked-list-ii/) — Reverse a sublist [left, right]
11. [Palindrome Linked List (LC 234)](https://leetcode.com/problems/palindrome-linked-list/) — Find middle + reverse + compare
12. [Reverse Nodes in k-Group (LC 25)](https://leetcode.com/problems/reverse-nodes-in-k-group/) — *Hard, essential for pointer mastery*

**Day 5: Math & Multi-level Lists**
13. [Add Two Numbers (LC 2)](https://leetcode.com/problems/add-two-numbers/) — Dummy Head + carry
14. [Copy List with Random Pointer (LC 138)](https://leetcode.com/problems/copy-list-with-random-pointer/) — HashMap or interleave
15. [Flatten a Multilevel Doubly Linked List (LC 430)](https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/) — Stack or recursion

**Day 6: Design & Complex Architectures**
16. [Design Linked List (LC 707)](https://leetcode.com/problems/design-linked-list/) — Implement from scratch with dummy head
17. [Design Browser History (LC 1472)](https://leetcode.com/problems/design-browser-history/) — Doubly Linked List use case
18. [LRU Cache (LC 146)](https://leetcode.com/problems/lru-cache/) ⭐ — *Crucial: HashMap + Doubly Linked List*

**Day 7: Review & Re-implement**
19. [Intersection of Two Linked Lists (LC 160)](https://leetcode.com/problems/intersection-of-two-linked-lists/) — Two pointers with list-switching
20. [Swap Nodes in Pairs (LC 24)](https://leetcode.com/problems/swap-nodes-in-pairs/) — Pointer manipulation warm-up
21. [Rotate List (LC 61)](https://leetcode.com/problems/rotate-list/) — Find length + find new tail + reconnect

---

## 11. Mock Interview Module

### Problem: The Corrupt Sensor Data Stream

**Context:** You are writing backend firmware for an IoT monitoring system. Thousands of temperature sensors are linked together in a daisy-chain network. Each `Sensor` object has a `nextSensor` reference. Data flows correctly until the last sensor, which should point to `null`.

However, a recent firmware patch introduced a bug: the last sensor accidentally points back to a sensor somewhere in the middle of the chain, creating an infinite data loop.

**Question:** Write `public Sensor findCorruptionPoint(Sensor head)` that returns the exact `Sensor` where the cycle begins. Return `null` if there is no loop.

---

#### Step 1: Clarifying Questions & Expected Answers

| Candidate asks                       | Interviewer answers     | Why it matters                     |
| ------------------------------------ | ----------------------- | ---------------------------------- |
| "Can I modify the Sensor objects?"   | No, read-only           | Rules out marking visited nodes    |
| "What are the memory constraints?"   | Very limited (embedded) | $O(1)$ space preferred             |
| "Can the cycle start at the head?"   | Yes                     | Edge case to handle                |
| "Is there guaranteed to be a cycle?" | No                      | Must handle the `null` return case |
| "How large can the chain be?"        | Thousands of sensors    | $O(N)$ time is acceptable          |

---

#### Step 2: Brute Force Solution

```java
// Time: O(N), Space: O(N) — stores references in HashSet
public Sensor findCorruptionPoint(Sensor head) {
    Set<Sensor> seen = new HashSet<>();
    Sensor curr = head;

    while (curr != null) {
        if (seen.contains(curr)) return curr; // first duplicate = cycle entry
        seen.add(curr);
        curr = curr.nextSensor;
    }
    return null;
}
```

**Explain:** "This is $O(N)$ time and $O(N)$ space. On embedded hardware with thousands of sensors, a HashSet holding thousands of object references may exceed available RAM. I need an $O(1)$ space solution."

---

#### Step 3: Optimized Solution (Floyd's Two-Phase Algorithm)

```java
// Time: O(N), Space: O(1)
public Sensor findCorruptionPoint(Sensor head) {
    Sensor slow = head, fast = head;

    // Phase 1: Detect cycle and find meeting point
    while (fast != null && fast.nextSensor != null) {
        slow = slow.nextSensor;
        fast = fast.nextSensor.nextSensor;
        if (slow == fast) break;
    }

    // No cycle found
    if (fast == null || fast.nextSensor == null) return null;

    // Phase 2: Find cycle entry
    // Reset slow to head; fast stays at meeting point
    slow = head;
    while (slow != fast) {
        slow = slow.nextSensor;
        fast = fast.nextSensor; // both move 1 step
    }

    return slow; // this is the corruption start point
}
```

**Walk through the math with the interviewer:**
- Let `F` = steps from head to cycle entry, `C` = cycle length, `h` = steps from entry to meeting point.
- At meeting: slow traveled `F + h`, fast traveled `F + h + C`.
- Since fast = 2x slow: `2(F + h) = F + h + C` → `F = C - h`.
- After reset: slow needs `F` steps to reach entry. Fast needs `C - h = F` steps from meeting point to entry. They arrive together. ✅

---

#### Step 4: Follow-up Questions & Expected Answers

**Q1:** "What if the sensor chain is so large it cannot fit in memory at once, and nodes are loaded from disk? How does a Linked List compare to an Array?"

|                | Linked List                                                | Array / B-Tree                                                 |
| -------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| Access pattern | Random — jumps all over disk sectors → many page faults    | Sequential — OS prefetches nearby data automatically           |
| Cache behavior | Poor — each `.nextSensor` is at a different memory address | Excellent — spatial locality, entire cache line loaded at once |
| Recommendation | ❌ Avoid for disk-based traversal                           | ✅ Prefer for large sequential data                             |

*Expected answer:* "Linked List traversal causes frequent cache misses and page faults because nodes are scattered in memory. Arrays are vastly superior for disk-backed data due to spatial locality. For very large datasets with dynamic sizes, B-Trees (used in databases) pack many keys into each node/disk block, getting the best of both worlds."

**Q2:** "What if we also need to count how many nodes are in the cycle?"

```java
// After finding the meeting point in Phase 1, count the cycle length:
int cycleLength = 1;
Sensor temp = slow.nextSensor;
while (temp != slow) {
    cycleLength++;
    temp = temp.nextSensor;
}
// Then optionally use cycleLength to find entry via the head-start method
```

**Q3:** "How would you design the `Sensor` class in Java to be most memory-efficient on this embedded hardware?"

*Expected answer:* "Use primitive types where possible (`int` instead of `Integer`). Avoid inner classes (they hold an implicit reference to the outer class). If the value fits in a short (−32768 to 32767), use `short val` instead of `int val` to halve memory. Keep the class final to allow JVM optimizations."

---

## 12. Quick Reference: Linked List Java Idioms

```java
// ── NODE SETUP ────────────────────────────────────────────────────────────
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

// ── SAFE TRAVERSAL ────────────────────────────────────────────────────────
// Always null-check before accessing .next
while (curr != null) { curr = curr.next; }

// Peek two ahead safely
if (curr != null && curr.next != null) { curr.next.next; }

// ── FAST & SLOW IDIOMS ────────────────────────────────────────────────────
// Both start at head — standard setup
ListNode slow = head, fast = head;

// Fast starts 1 ahead — returns FIRST middle for even-length lists
ListNode slow = head, fast = head.next;

// N-step head start for "N-th from end"
ListNode slow = dummy, fast = dummy;
for (int i = 0; i <= n; i++) fast = fast.next;

// ── POINTER TRICKS ────────────────────────────────────────────────────────
// Swap two nodes' values (easier than relinking in some problems)
int tmp = a.val; a.val = b.val; b.val = tmp;

// Delete a node when only given the node (not its prev)
// Works only if it's not the tail node
node.val = node.next.val;
node.next = node.next.next;

// Check reference equality (pointer identity) — NOT .equals()
if (nodeA == nodeB) { /* same object */ }

// ── BUILDING A LIST ON THE FLY ────────────────────────────────────────────
ListNode dummy = new ListNode(-1);
ListNode curr = dummy;
for (int val : values) {
    curr.next = new ListNode(val);
    curr = curr.next;
}
ListNode result = dummy.next; // detach dummy

// ── LENGTH CALCULATION ────────────────────────────────────────────────────
int length = 0;
ListNode curr = head;
while (curr != null) { length++; curr = curr.next; }
```