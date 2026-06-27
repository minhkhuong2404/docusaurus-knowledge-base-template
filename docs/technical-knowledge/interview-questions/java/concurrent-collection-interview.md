---
id: concurrent-collections-interview
title: Concurrent Collections (Part 1)
sidebar_label: ConcurrentHashMap
description: "Concurrent collection fundamentals and ConcurrentHashMap internals for interview preparation."
tags: [java, interview, concurrency, collections]
---

# Concurrent Collections Interview Questions & Answers

This guide explains why Java 1.5 introduced concurrent collections and dives deep into the internal working of `ConcurrentHashMap`, including the critical Java 8 architectural overhaul.

## 1. Why were Concurrent Collections introduced?

Traditional collections like `HashMap` and `ArrayList` are not thread-safe. While `Hashtable` and `Vector` are thread-safe, they have severe limitations:

* **Coarse-grained Locking:** They lock the **entire collection** for every operation using `synchronized` on `this`. Even read operations acquire the lock, meaning only one thread can access the collection at a time.
* **ConcurrentModificationException:** If one thread iterates while another modifies, the fail-fast iterator throws `ConcurrentModificationException` — even with `Hashtable`.

**The Solution:** The `java.util.concurrent` package (Java 5) introduced collections designed for concurrency from the ground up:

| Collection | Replaces | Strategy |
|:-----------|:---------|:---------|
| `ConcurrentHashMap` | `Hashtable` / `synchronized HashMap` | Fine-grained locking + CAS |
| `CopyOnWriteArrayList` | `synchronized ArrayList` | Snapshot on write |
| `ConcurrentLinkedQueue` | `synchronized LinkedList` | Lock-free (CAS) |
| `BlockingQueue` (variants) | Producer-consumer patterns | Lock-based with wait/notify |

## 2. HashMap vs. ConcurrentHashMap (Behavior Demo)

In a standard `HashMap`, modifying during iteration causes a crash:
```java
Map<Integer, Integer> map = new HashMap<>();
map.put(1, 1); map.put(2, 2); map.put(3, 3);

for (Integer key : map.keySet()) {
    if (key == 2) {
        map.put(4, 4);  // ConcurrentModificationException!
    }
}
```

In `ConcurrentHashMap`, this is perfectly legal:
```java
Map<Integer, Integer> map = new ConcurrentHashMap<>();
map.put(1, 1); map.put(2, 2); map.put(3, 3);

for (Integer key : map.keySet()) {
    if (key == 2) {
        map.put(4, 4);  // Safe! Reflected in a "weakly consistent" manner
    }
}
```

**Weakly consistent iterators:** ConcurrentHashMap iterators **never** throw `ConcurrentModificationException`. They reflect the state of the map at some point at or since the creation of the iterator. New entries may or may not be visible during iteration.

## 3. How does ConcurrentHashMap achieve better performance?

The implementation evolved dramatically from Java 7 to Java 8:

### Java 7: Segment Locking Architecture

```
ConcurrentHashMap
├── Segment[0]  (ReentrantLock + HashEntry[])
├── Segment[1]  (ReentrantLock + HashEntry[])
├── ...
└── Segment[15] (ReentrantLock + HashEntry[])
```

- The map was divided into **16 segments** (default), each being a mini-HashMap with its own `ReentrantLock`.
- A thread writing to Segment[3] only locks Segment[3]; another thread can simultaneously write to Segment[7].
- **Maximum concurrency:** Limited to the number of segments (default 16).

### Java 8+: Node-Level CAS + Synchronized (Current)

Segments were **completely removed**. The new architecture:

```
ConcurrentHashMap
└── Node[] table (single flat array, like HashMap)
    ├── bucket[0] → null                   (empty — CAS insert)
    ├── bucket[1] → Node → Node → Node    (linked list — synchronized on head node)
    ├── bucket[2] → TreeBin → TreeNode...  (red-black tree — synchronized on TreeBin)
    └── ...
```

**Three locking strategies based on bucket state:**

1. **Empty bucket → CAS (no lock):** If the target bucket is empty, use `compareAndSwapObject` to atomically insert the first node. Zero contention, zero blocking.

2. **Non-empty bucket → `synchronized` on head node:** Only the head node of the specific bucket is locked. Other buckets are completely unaffected.

3. **Tree bucket → `synchronized` on TreeBin:** If the bucket has been treeified (8+ entries), the TreeBin object is locked during modifications.

```java
// Simplified Java 8+ put() logic
final V putVal(K key, V value) {
    int hash = spread(key.hashCode());
    for (Node<K,V>[] tab = table;;) {
        Node<K,V> f = tabAt(tab, i); // volatile read
        if (f == null) {
            // CAS — lock-free insert into empty bucket
            if (casTabAt(tab, i, null, new Node<>(hash, key, value)))
                break;
        } else {
            synchronized (f) { // Lock ONLY this bucket's head node
                // Insert into linked list or tree
            }
        }
    }
}
```

**Result:** Theoretical concurrency equals the number of buckets (thousands), not a fixed 16.

## 4. What is Concurrency Level?

The concurrency level parameter has different meanings across Java versions:

### Java 7
It directly determined the **number of Segments** (default 16). Setting `new ConcurrentHashMap<>(16, 0.75f, 64)` created 64 segments, allowing 64 concurrent writers.

### Java 8+
The concurrency level is only used as a **sizing hint** for the initial table capacity. It no longer creates segments because segments don't exist. The constructor comment in OpenJDK source says: *"The value is used as a sizing hint."*

```java
// Java 8+: concurrencyLevel only affects initial table size
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>(
    initialCapacity,  // 16
    loadFactor,       // 0.75
    concurrencyLevel  // Only a sizing hint, NOT segment count
);
```

**Interview clarification:** If the interviewer asks about "16 segments," clarify that this was the Java 7 model. Java 8+ uses a fundamentally different architecture with per-node synchronization.

## 5. Why are null keys/values not allowed in ConcurrentHashMap?

`ConcurrentHashMap` does not allow `null` keys or `null` values to avoid **ambiguity** in concurrent scenarios.

### The Ambiguity Problem

In a single-threaded `HashMap`:
```java
if (map.containsKey(key)) {
    return map.get(key); // Could still be null (the value IS null)
}
```
This is safe because no other thread can intervene between `containsKey()` and `get()`.

In a concurrent `ConcurrentHashMap`:
```java
if (map.containsKey(key)) {        // Thread A: true
    // Thread B: map.remove(key);  // REMOVED between these two calls!
    return map.get(key);           // Thread A: null — but WHY?
    // Is the value null? Or was the key removed by Thread B?
}
```

Doug Lea (the author) explicitly chose to disallow null to prevent this **check-then-act race condition**. With no nulls, `get()` returning `null` **always** means "key not found."

### The `putIfAbsent` Case
```java
// With null values allowed, this would be ambiguous:
map.putIfAbsent(key, value);
// Does "absent" mean "key not in map" or "key maps to null"?
```

## 6. Internal Operations: Get vs. Put

### Read (`get`)
**Lock-free.** Uses `volatile` reads to ensure visibility:
```java
// Simplified get() — NO locking at all
V get(Object key) {
    Node<K,V>[] tab = table; // volatile read of table reference
    Node<K,V> e = tabAt(tab, (n - 1) & hash); // volatile read of bucket head
    while (e != null) {
        if (e.hash == hash && key.equals(e.key))
            return e.val; // volatile read of value
        e = e.next;
    }
    return null;
}
```

The `val` and `next` fields of `Node` are declared `volatile`, ensuring that any thread reading them sees the most recent write — without any locking.

### Write (`put`)
Uses the three-strategy approach described above:
1. Calculate bucket index: `(table.length - 1) & hash`
2. If bucket is empty → **CAS** (atomic, no lock)
3. If bucket has entries → **`synchronized`** on the head node
4. If treeified → **`synchronized`** on the TreeBin
5. After insertion, check if the bucket needs treeification (≥ 8 entries)
6. Check if the table needs resizing

### Concurrent Resizing (Unique to ConcurrentHashMap)
Unlike `HashMap` where resizing is single-threaded, `ConcurrentHashMap` supports **cooperative concurrent resizing.** When one thread starts resizing, other threads that attempt to `put()` detect the resize in progress and **help** transfer entries to the new table. This distributes the O(n) resize cost across multiple threads.

## 7. What is "Lock Stripping"?

Lock stripping is the technique where a large data structure is broken into smaller pieces (strips), each with its own lock. This allows high levels of concurrency because threads only compete for locks if they are accessing the same "strip."

### Evolution of the concept in ConcurrentHashMap

| Java Version | Strip Granularity | Max Concurrency |
|:------------|:------------------|:---------------|
| Java 5-7 | Segment (16 by default) | 16 concurrent writers |
| Java 8+ | Individual bucket (Node) | Thousands of concurrent writers |

### Beyond ConcurrentHashMap
The same concept applies to other concurrent structures:
- **`StampedLock`** provides optimistic read locking where readers don't acquire any lock at all
- **`LongAdder`** uses cell-stripping to reduce contention on a counter: each thread increments its own cell, cells are summed only when the total is requested
- Database engines use **row-level locking** instead of table-level locking (same principle)

---
