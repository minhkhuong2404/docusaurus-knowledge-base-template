---
id: java-collections-interview
title: Java Collections Framework Interview Questions
sidebar_label: Collections Framework
description: "Essential Java Collections Framework interview questions covering hierarchy, usage, and pitfalls."
tags: [java, interview, collections, core-java]
---

import CollectionsHierarchyDiagram from '@site/src/components/CollectionsHierarchyDiagram';

# Java Collections Framework Interview Questions & Answers

These questions cover essential and tricky concepts of the Java Collections Framework with senior-level depth.

## 1. Explain the Collection Hierarchy

The Java Collections Framework is organized into a well-defined hierarchy of interfaces and implementations:

<CollectionsHierarchyDiagram />

### Key interfaces:
* **List:** Ordered collection allowing duplicates and index-based access. Maintains insertion order.
* **Set:** No duplicates. `HashSet` is unordered, `LinkedHashSet` preserves insertion order, `TreeSet` sorts elements.
* **Queue/Deque:** FIFO processing (`Queue`) or double-ended (`Deque`).
* **Map:** Key-value pairs. Not part of the `Collection` interface hierarchy.

### Why `Map` doesn't extend `Collection`
`Collection.add(E e)` accepts a single element. `Map.put(K key, V value)` requires **two** parameters (a pair). The fundamental data model is different — a Map is a collection of **entries** (key-value pairs), not individual elements. However, you can get Collection views: `map.keySet()`, `map.values()`, and `map.entrySet()`.

## 2. What is the difference between Fail-Fast and Fail-Safe Iterators?

| Feature | Fail-Fast | Fail-Safe |
|:--------|:----------|:----------|
| **Behavior** | Throws `ConcurrentModificationException` on structural modification | Never throws exception |
| **Works on** | Original collection | Clone/snapshot of the collection |
| **Collections** | `ArrayList`, `HashMap`, `HashSet` | `ConcurrentHashMap`, `CopyOnWriteArrayList` |
| **Memory** | No extra memory | Extra memory for the copy/snapshot |
| **Reflects changes** | N/A (throws exception) | May not reflect modifications made after iterator creation |

### How Fail-Fast detection works internally

```java
// Inside ArrayList — the modCount mechanism
transient int modCount = 0; // Incremented on add(), remove(), clear()

// Inside ArrayList$Itr (the iterator)
int expectedModCount = modCount; // Captured at iterator creation

public E next() {
    if (modCount != expectedModCount)  // Check on every next() call
        throw new ConcurrentModificationException();
    // ... return element
}
```

**Important:** Fail-fast is a **best-effort** mechanism, not a guarantee. The JavaDoc explicitly states it should not be relied upon for correctness — only for bug detection.

## 3. What is a BlockingQueue?

`BlockingQueue` (in `java.util.concurrent`) is a thread-safe queue that supports **blocking operations** — the thread waits instead of failing when the operation cannot be completed immediately.

### Blocking behavior

| Operation | If Queue is Empty | If Queue is Full |
|:----------|:-----------------|:----------------|
| `put(e)` | N/A | **Blocks** until space available |
| `take()` | **Blocks** until element available | N/A |
| `offer(e, timeout)` | N/A | Waits up to timeout, returns false |
| `poll(timeout)` | Waits up to timeout, returns null | N/A |
| `add(e)` | N/A | Throws `IllegalStateException` |
| `remove()` | Throws `NoSuchElementException` | N/A |

### Common Implementations

| Implementation | Capacity | Ordering | Use Case |
|:--------------|:---------|:---------|:---------|
| `ArrayBlockingQueue` | Bounded (fixed) | FIFO | Producer-consumer with backpressure |
| `LinkedBlockingQueue` | Optionally bounded | FIFO | Thread pool work queues (`Executors.newFixedThreadPool`) |
| `PriorityBlockingQueue` | Unbounded | Priority-based | Task scheduling by priority |
| `SynchronousQueue` | Zero capacity | Direct handoff | `Executors.newCachedThreadPool` |
| `DelayQueue` | Unbounded | By delay expiration | Scheduled task execution |

### Producer-Consumer Pattern
```java
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(100);

// Producer thread — blocks if queue is full (backpressure!)
queue.put(new Task("process-order"));

// Consumer thread — blocks if queue is empty (waits for work)
Task task = queue.take();
task.execute();
```

## 4. Synchronized vs. Concurrent Collections

| Feature | Synchronized | Concurrent |
|:--------|:------------|:-----------|
| **Examples** | `Hashtable`, `Vector`, `Collections.synchronizedMap()` | `ConcurrentHashMap`, `CopyOnWriteArrayList` |
| **Lock granularity** | **Entire collection** (coarse-grained) | **Per-bucket/segment** (fine-grained) |
| **Read blocking** | Yes — readers block other readers | No — reads are lock-free |
| **Iterator** | Fail-fast | Weakly consistent |
| **Compound operations** | Not atomic (check-then-act is racy) | Atomic (`computeIfAbsent`, `putIfAbsent`) |
| **Scalability** | Poor (serializes all access) | Excellent (high concurrency) |

### The compound operation problem

```java
// BROKEN with synchronizedMap — NOT atomic!
Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());
if (!syncMap.containsKey("counter")) {     // Thread A: false
    // Thread B: also sees false, also enters this block
    syncMap.put("counter", 1);             // Both threads put — lost update!
}

// CORRECT with ConcurrentHashMap — atomic compound operation
ConcurrentHashMap<String, Integer> concMap = new ConcurrentHashMap<>();
concMap.putIfAbsent("counter", 1);         // Atomic — no race condition
concMap.computeIfAbsent("counter", k -> 1); // Also atomic
```

## 5. How does HashMap work internally?

HashMap works on the principle of **hashing** with a hybrid data structure:

### The `put(K, V)` operation step by step:

1. **Hash calculation:** `hash = key.hashCode() ^ (key.hashCode() >>> 16)` — the high bits are mixed into the low bits to improve distribution for small tables.
2. **Bucket index:** `index = hash & (table.length - 1)` — bitwise AND (faster than modulo for power-of-2 sizes).
3. **Empty bucket:** Store a new `Node<K,V>` directly.
4. **Collision (same bucket):** Walk the linked list/tree. If an existing node has the same key (`equals()` returns true), replace the value. Otherwise, append a new node.
5. **Treeification check:** If the linked list at this bucket exceeds **8 nodes** (TREEIFY_THRESHOLD), convert to a **Red-Black Tree** for O(log n) lookup.
6. **Resize check:** If total size exceeds `capacity × loadFactor`, resize (double the table).

### The `get(K)` operation:

1. Calculate hash and bucket index (same as put).
2. Check the first node in the bucket — if it matches, return immediately (O(1)).
3. If not, and the bucket contains a tree, do a tree lookup (O(log n)).
4. If it's a linked list, traverse linearly (O(n) worst case for that bucket).

### Memory Layout

```
HashMap
├── Node[] table  (length = capacity, always power of 2)
│   ├── [0] → null
│   ├── [1] → Node(hash=1, "Alice"→"Engineer") → Node(hash=1, "Bob"→"Manager")
│   ├── [2] → null
│   ├── [3] → TreeBin → TreeNode... (if ≥ 8 collisions)
│   └── ...
├── size = 2        (actual entries)
├── threshold = 12  (capacity × loadFactor = 16 × 0.75)
└── loadFactor = 0.75
```

### The `equals()` and `hashCode()` Contract

| Rule | Consequence if Violated |
|:-----|:-----------------------|
| Equal objects must have equal hashcodes | `get()` searches wrong bucket → entry "lost" |
| Unequal objects *may* have equal hashcodes | Allowed (collision) — performance impact only |
| `hashCode()` must be consistent across calls | Entry moves between buckets between calls |
| If `equals()` uses a field, `hashCode()` must too | Inconsistent behavior |

```java
// CRITICAL: Override BOTH or NEITHER
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Employee e)) return false;
    return id == e.id && Objects.equals(name, e.name);
}

@Override
public int hashCode() {
    return Objects.hash(id, name); // Same fields as equals()
}
```

---
