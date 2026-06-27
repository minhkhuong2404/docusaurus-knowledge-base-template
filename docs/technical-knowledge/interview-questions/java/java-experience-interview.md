---
id: java-experienced-interview-p1
title: Java Interview for Experienced (Part 1)
sidebar_label: Experienced Q&A Part 1
description: "Experienced Java interview scenarios including memory behavior, HashMap resizing, and performance topics."
tags: [java, interview, backend, performance]
---

# Java Interview Questions for Experienced Developers (3-10 Years)

This guide dives into complex Java behaviors, such as memory management with substrings and the mechanics of HashMap resizing.

## 1. How does `substring()` work and can it cause a Memory Leak?

In Java, a string is internally represented as a character array. When you create a substring, the behavior depends critically on the Java version.

### The Memory Leak Issue (JDK 6 and earlier)

In older versions of Java, the `substring()` method shared the same internal `char[]` as the original string. The `String` object stored an `offset` and `count` to define which portion of the array it represented.

* **The Scenario:** If you have a massive string (e.g., 1GB log line) and you take a tiny 2-character substring, that substring still holds a reference to the entire 1GB character array.
* **The Leak:** Even if you set the original large string to `null`, it cannot be garbage collected because the tiny substring is still "holding" the giant array in memory.
* **Real-world trigger:** This commonly happened when reading large files line-by-line and keeping small tokens — each token silently retained the entire line's char array.

### The Fix (JDK 7 and later)

Java 7 fixed this by changing the implementation. Instead of sharing the array, `substring()` now calls `Arrays.copyOfRange()` to create a **new, smaller array** containing only the required characters. The `offset` and `count` fields were removed from the `String` class entirely.

```java
// JDK 7+ implementation (simplified)
public String substring(int beginIndex, int endIndex) {
    // Creates a brand-new char[] with only the needed characters
    return new String(value, beginIndex, endIndex - beginIndex);
}
```

### Java 9+ Compact Strings

Java 9 changed the internal representation again — from `char[]` to `byte[]` with an encoding flag (`coder`). Latin-1 characters use 1 byte instead of 2, reducing memory footprint by ~40% for ASCII-heavy workloads. `substring()` still creates a full copy.

### How to manually prevent the leak in JDK 6

If working on a legacy system (Java 6 or earlier):
```java
// Force a new char[] allocation
String safeSubstring = new String(massiveString.substring(0, 2));

// Or use intern() to get a pool copy
String safeSubstring = massiveString.substring(0, 2).intern();
```

## 2. What is the Load Factor in `HashMap`?

The performance of a `HashMap` is defined by its **Initial Capacity** and **Load Factor**.

* **Initial Capacity:** The number of buckets created when the map is initialized (default is **16**, always a power of 2).
* **Load Factor:** A threshold ratio that determines how full the map can get before automatic resizing (default is **0.75**).

### Why 0.75?

The default load factor of 0.75 is a carefully tuned trade-off between **space efficiency** and **time efficiency**:
- A lower load factor (e.g., 0.5) means fewer collisions but wastes more memory (50% of buckets are always empty).
- A higher load factor (e.g., 1.0) saves memory but increases collision chains, degrading lookup time from O(1) toward O(n).
- **0.75** provides approximately 25% empty buckets, which statistically keeps collision chains short while not wasting too much memory.

### Resizing (Rehashing) Mechanics

**Trigger:** When `size > capacity × loadFactor` (e.g., 16 × 0.75 = 12 entries), resizing occurs.

**The resize process:**
1. A new array of **double** the capacity is created (16 → 32 → 64 → ...).
2. Every existing entry is **rehashed** — its bucket index is recalculated against the new array size.
3. In Java 8+, the rehash is optimized: since capacity is always a power of 2, each entry either stays in the same index or moves to `oldIndex + oldCapacity`. This avoids recalculating the hash entirely — only one additional bit of the hash is checked.

**Production impact:** Resizing is O(n) and causes a GC spike (the old array becomes garbage). If you know the expected size, specify it upfront:
```java
// Pre-size to avoid resizing: expectedSize / loadFactor + 1
Map<String, Object> map = new HashMap<>(expectedSize * 4 / 3 + 1);

// Or in Java 19+:
Map<String, Object> map = HashMap.newHashMap(expectedSize);
```

### Treeification (Java 8+)

When a single bucket accumulates **8+ entries** (TREEIFY_THRESHOLD), the linked list at that bucket is converted to a **Red-Black Tree**, improving worst-case lookup from O(n) to O(log n). When the count drops below **6** (UNTREEIFY_THRESHOLD), it reverts to a linked list.

**Why the gap (8 vs 6)?** To prevent thrashing — without the gap, adding and removing the 8th element repeatedly would continuously convert between list and tree.

## 3. Capacity vs. Size in a `HashMap`

* **Capacity:** The total number of buckets (internal array length) available to store entries. Always a **power of 2** (this enables fast modulo via bitwise AND: `hash & (capacity - 1)` instead of `hash % capacity`).
* **Size:** The actual number of key-value pairs (mappings) currently present in the map.

```java
HashMap<String, String> map = new HashMap<>(32); // capacity = 32
map.put("a", "1");
map.put("b", "2");
// capacity = 32, size = 2, threshold = 32 × 0.75 = 24
```

### Common Interview Trick Question

**Q:** If I create `new HashMap<>(10)`, what is the capacity?

**A:** It's **16**, not 10. `HashMap` always rounds up to the nearest power of 2. Internally it uses `tableSizeFor(10)` which returns 16. This is because the bucket index calculation `hash & (capacity - 1)` only distributes evenly when capacity is a power of 2.

## 4. HashMap Collision Handling Deep Dive

When two keys hash to the same bucket, a **collision** occurs. HashMap handles this with a hybrid approach:

### Linked List Phase (< 8 entries per bucket)
Each bucket stores a singly linked list of `Node<K,V>` objects. On `put()`, the new entry is appended to the list. On `get()`, the list is traversed using `equals()` to find the matching key. Worst case: O(n) per bucket.

### Tree Phase (≥ 8 entries per bucket)
The linked list is converted to a **Red-Black Tree** of `TreeNode<K,V>`. Lookup becomes O(log n). Keys must implement `Comparable` for tree ordering; otherwise, `System.identityHashCode()` is used as a tiebreaker.

```java
// Simplified collision visualization
bucket[5] → Node("Alice",1) → Node("Bob",2) → Node("Charlie",3) → ...
// If 8+ nodes: converts to Red-Black Tree
bucket[5] → TreeNode (balanced BST)
```

### The `equals()` and `hashCode()` Contract

This is a **critical** interview topic. If you override `equals()`, you **must** override `hashCode()`:
- If `a.equals(b)` is `true`, then `a.hashCode() == b.hashCode()` must also be true.
- The reverse is NOT required (hash collisions are allowed).

**Violation consequence:** If two equal objects have different hashcodes, they'll be placed in different buckets, and `get()` will never find the value even though an equal key exists.

---