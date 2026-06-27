---
id: java-collections-differences
title: Array vs. ArrayList vs. Vector vs. LinkedList
sidebar_label: Collections Differences
description: "Comparison guide for Array, ArrayList, Vector, and LinkedList with interview-focused trade-offs."
tags: [java, interview, collections, data-structures]
---

# Java Collections Framework: Key Differences

This guide provides a detailed comparison of common data structures in Java with performance characteristics and internal mechanics.

## 1. Array vs. ArrayList

| Feature | Array | ArrayList |
| :--------------- | :---------------------------------- | :---------------------------------------------- |
| **Size** | Static (fixed at creation) | Dynamic (auto-resizes) |
| **Data Types** | Stores both primitives and objects | Stores only objects (primitives are autoboxed) |
| **Performance** | Faster (no boxing, no resize overhead) | Slower during resizing operations |
| **Length Check** | `.length` (field) | `.size()` (method) |
| **Dimensions** | Can be multi-dimensional (`int[][]`) | Always single-dimensional (but can nest: `List<List<>>`) |
| **Type Safety** | Runtime `ArrayStoreException` | Compile-time generics checking |
| **Memory** | Contiguous block, minimal overhead | Object header + internal array + metadata |

### ArrayList Internal Resizing

When an ArrayList runs out of space, it creates a **new array 1.5× the old size** and copies all elements:

```java
// Simplified from OpenJDK ArrayList.grow()
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1); // 1.5× growth
    elementData = Arrays.copyOf(elementData, newCapacity); // O(n) copy!
}
```

**Growth sequence:** 10 → 15 → 22 → 33 → 49 → 73 → ...

**Production tip:** If you know the expected size, specify it to avoid O(n) resize copies:
```java
// BAD: 10,000 elements → 17 resize operations from default capacity 10
List<String> list = new ArrayList<>();

// GOOD: Zero resize operations
List<String> list = new ArrayList<>(10_000);
```

## 2. ArrayList vs. Vector

| Feature | ArrayList | Vector |
| :------------------ | :---------------------------------- | :--------------------------------- |
| **Synchronization** | Not Synchronized (Not Thread-Safe) | Synchronized (Thread-Safe) |
| **Performance** | Fast (no lock overhead) | Slow (every method acquires a lock) |
| **Growth Factor** | Increases by **50%** (`oldCap + oldCap >> 1`) | Increases by **100%** (doubles) |
| **Legacy** | Java 1.2 (Collections Framework) | Java 1.0 (legacy class) |
| **Iteration** | `Iterator` only | `Iterator` and `Enumeration` |
| **Modern Alternative** | — | `Collections.synchronizedList()` or `CopyOnWriteArrayList` |

### Why Vector is deprecated in practice

Vector synchronizes **every individual method** call. But thread safety usually requires synchronizing **compound operations** (e.g., check-then-act), which Vector doesn't help with:

```java
// Still BROKEN with Vector — the compound operation is NOT atomic
Vector<String> v = new Vector<>();
if (!v.contains("item")) {     // Thread A checks: false
    // Thread B: also checks false, also enters this block
    v.add("item");             // Duplicate added!
}
```

**Modern alternatives:**
- **Single-threaded:** Use `ArrayList`
- **Read-heavy concurrent:** Use `CopyOnWriteArrayList`
- **Write-heavy concurrent:** Use `Collections.synchronizedList(new ArrayList<>())` with external synchronization for compound operations

## 3. ArrayList vs. LinkedList

| Feature | ArrayList | LinkedList |
| :--------------------- | :-------------------------------------- | :------------------------------------------ |
| **Internal Structure** | Dynamic Array (contiguous memory) | Doubly Linked List (scattered nodes) |
| **Random Access `get(i)`** | **O(1)** — direct index calculation | O(n) — traversal from head or tail |
| **Add at end** | **O(1)** amortized | **O(1)** |
| **Add in middle** | O(n) — `System.arraycopy()` shift | O(n) traverse + O(1) insert |
| **Remove in middle** | O(n) — shift elements left | O(n) traverse + O(1) unlink |
| **Memory per element** | ~4-8 bytes (reference only) | ~40 bytes (Node: value + prev + next + header) |
| **Interfaces** | `List`, `RandomAccess` | `List`, `Deque`, `Queue` |
| **Cache Friendliness** | **Excellent** (contiguous memory) | **Poor** (nodes scattered on heap) |
| **Default Capacity** | 10 | None (starts empty) |

### The Cache Locality Advantage (Critical for Interviews)

Modern CPUs have a **prefetcher** that loads adjacent memory into L1/L2 cache lines (typically 64 bytes). ArrayList's contiguous array benefits enormously:

```
ArrayList (contiguous): [elem0][elem1][elem2][elem3][elem4]...
→ CPU cache line loads 8-16 references at once → sequential access is FAST

LinkedList (scattered):  Node@0x100 → Node@0x500 → Node@0x200 → Node@0x800
→ Each next() is a potential cache miss → 100-300 cycle penalty per access
```

**Benchmarks consistently show:** For lists under ~100,000 elements, ArrayList is faster than LinkedList for **ALL** operations — including insertions in the middle. The O(n) `System.arraycopy()` is a highly optimized native memory block copy that is faster than traversing a linked list with cache misses.

### When LinkedList actually wins
1. **Frequent removal during iteration** — `Iterator.remove()` is O(1) (just pointer update) vs. O(n) array shift for ArrayList
2. **Queue/Deque operations** — `addFirst()`, `removeFirst()`, `addLast()` are all O(1). ArrayList's `add(0, e)` is O(n).
3. **Very large lists with frequent mid-list mutations** — when the cost of shifting millions of elements exceeds the cache miss penalty

## 4. Comprehensive Comparison Table

| Feature | Array | ArrayList | LinkedList | Vector |
|:--------|:------|:----------|:-----------|:-------|
| **Type** | Fixed-size | Dynamic | Dynamic | Dynamic |
| **Thread Safe** | No | No | No | Yes |
| **Random Access** | O(1) | O(1) | O(n) | O(1) |
| **Add (end)** | N/A | O(1)* | O(1) | O(1)* |
| **Add (middle)** | N/A | O(n) | O(n) | O(n) |
| **Remove** | N/A | O(n) | O(n) | O(n) |
| **Memory Overhead** | Minimal | Low | High (~5×) | Low |
| **Primitives** | ✅ | ❌ (autoboxing) | ❌ | ❌ |
| **Growth** | None | 1.5× | N/A | 2× |

*\* amortized — occasional O(n) for resize*

## Decision Matrix: When to use what?

| Scenario | Best Choice | Why |
|:---------|:-----------|:----|
| General purpose, most use cases | **ArrayList** | O(1) random access, cache-friendly, good enough for everything |
| Need a Queue/Deque | **ArrayDeque** (NOT LinkedList) | ArrayDeque is faster than LinkedList for both stack and queue operations |
| Thread-safe list, read-heavy | **CopyOnWriteArrayList** | Lock-free reads, snapshot iterators |
| Thread-safe list, write-heavy | **`Collections.synchronizedList()`** | Lower overhead than CopyOnWrite for frequent writes |
| Fixed-size, primitive data | **Array** | No autoboxing overhead, direct memory access |
| Constant-time removal during iteration | **LinkedList** | Iterator.remove() is O(1) |

---
