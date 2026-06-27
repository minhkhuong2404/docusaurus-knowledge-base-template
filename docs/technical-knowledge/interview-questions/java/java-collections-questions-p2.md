---
id: java-collections-interview-p2
title: Java Collections Interview Q&A (Part 2)
sidebar_label: Collections Part 2
description: "Part 2 of Java collections interview Q and A with advanced comparisons and map internals."
tags: [java, interview, collections, maps]
---

# Java Collection Framework Interview Questions - Part 2

This guide covers advanced comparisons, internal workings of Maps, and best practices for using the Collection Framework.

## 1. ArrayList vs. LinkedList: When to use what?

The choice depends on your access pattern and the operations you perform most frequently:

| Operation | ArrayList | LinkedList |
|:----------|:----------|:-----------|
| **Random access `get(i)`** | **O(1)** — direct array index | O(n) — must traverse from head/tail |
| **Add at end `add(e)`** | **O(1)** amortized (occasional O(n) resize) | **O(1)** — append to tail |
| **Add at index `add(i, e)`** | O(n) — shifts all subsequent elements | **O(1)** for the insert itself, but O(n) to find position |
| **Remove at index** | O(n) — shifts elements | O(n) — traversal + O(1) removal |
| **Iterator remove** | O(n) — shifts | **O(1)** — pointer update |
| **Memory per element** | ~4-8 bytes (just the reference) | ~24-40 bytes (Node: data + next + prev pointers + object header) |

### The Cache Locality Factor (often overlooked)

Even though LinkedList has O(1) insertion/deletion at a known position, **ArrayList is faster in practice** for most workloads due to **CPU cache locality**:

- **ArrayList** stores elements contiguously in memory → CPU prefetcher loads adjacent elements into L1/L2 cache → sequential access is extremely fast.
- **LinkedList** nodes are scattered across the heap → each `next` pointer dereference is a potential **cache miss** → sequential traversal is much slower than array iteration.

**Benchmark reality:** For lists under ~10,000 elements, ArrayList outperforms LinkedList for virtually all operations, including insertions in the middle. The O(n) array copy is done via `System.arraycopy()` (a highly optimized native memory copy), which is faster than traversing a linked list with cache misses.

**Rule of thumb:** Use `ArrayList` as your default. Use `LinkedList` only when you need `Deque` functionality or when profiling proves it's faster for your specific use case.

## 2. HashMap vs. TreeMap vs. LinkedHashMap

| Feature | HashMap | TreeMap | LinkedHashMap |
| :---------------- | :------------------- | :------------------------ | :------------------------------ |
| **Ordering** | None (random) | Natural ordering (sorted by key) | **Insertion order** (or access order) |
| **get/put** | O(1) average | O(log n) | O(1) average |
| **Null Keys** | 1 null key allowed | **No null keys** (needs Comparable) | 1 null key allowed |
| **Structure** | Hash Table (array + list/tree) | **Red-Black Tree** | Hash Table + **Doubly Linked List** |
| **Implements** | `Map` | `NavigableMap`, `SortedMap` | `Map` |
| **Thread Safe** | No | No | No |

### When to use each

**HashMap** — Default choice for key-value storage:
```java
Map<String, User> userCache = new HashMap<>();
```

**TreeMap** — When you need sorted keys or range queries:
```java
TreeMap<LocalDate, List<Event>> events = new TreeMap<>();
// Range query: all events in June 2024
events.subMap(
    LocalDate.of(2024, 6, 1),    // inclusive
    LocalDate.of(2024, 7, 1)     // exclusive
);

// First/last operations
events.firstKey();    // Earliest date
events.lastKey();     // Latest date
events.floorKey(today); // Latest date ≤ today
```

**LinkedHashMap** — When insertion order matters or for LRU caches:
```java
// Simple LRU Cache using access-order LinkedHashMap
Map<String, Object> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    // accessOrder=true → moves accessed entries to the end
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Object> eldest) {
        return size() > 100; // Max 100 entries
    }
};
```

**How access-order works:** When `accessOrder=true`, every `get()` or `put()` moves the entry to the **tail** of the linked list. The **head** is always the least-recently-used entry. `removeEldestEntry()` is called after each `put()` and can remove the head.

## 3. What is a PriorityQueue?

A `PriorityQueue` processes elements by **priority** instead of insertion order (FIFO). Internally, it uses a **binary min-heap** (an array-backed complete binary tree).

### Key Properties

| Property | Value |
|:---------|:------|
| **peek() / element()** | O(1) — returns highest-priority element without removing |
| **offer() / add()** | O(log n) — inserts and sifts up to maintain heap property |
| **poll() / remove()** | O(log n) — removes head and sifts down |
| **Ordering** | Natural ordering (Comparable) or custom Comparator |
| **Null elements** | Not allowed |
| **Thread Safety** | Not thread-safe (use `PriorityBlockingQueue` for concurrent access) |

```java
// Min-heap (default): smallest element has highest priority
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll(); // Returns 1 (smallest)

// Max-heap: largest element has highest priority
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// Custom priority: shortest task first
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparingInt(Task::getDuration)
);
```

**Common gotcha:** `PriorityQueue.iterator()` does **not** return elements in priority order. It traverses the underlying array, which is organized as a heap (not fully sorted). To get elements in order, you must call `poll()` repeatedly.

## 4. Requirements for a Map Key

### The Contract
1. **Override both `hashCode()` and `equals()`** — they must be consistent. If `a.equals(b)`, then `a.hashCode() == b.hashCode()` must hold.
2. **Immutability** — The key should not be modified after being inserted into the map. If the key's state changes, its hashcode changes, and the entry becomes unreachable.

### What happens with a bad hashCode?

```java
// All keys return same hashCode → all entries land in ONE bucket
class BadKey {
    @Override
    public int hashCode() { return 42; } // Terrible!
    @Override
    public boolean equals(Object o) { /* ... */ }
}

// HashMap degrades from O(1) to O(n) for <8 entries, O(log n) for ≥8 (treeified)
```

### What makes String an excellent Map key?
1. **Immutable** — content never changes after creation
2. **Cached hashCode** — computed once, stored in `private int hash`
3. **Well-distributed** — the algorithm distributes values evenly across buckets
4. **Ubiquitous** — used everywhere, heavily optimized by the JVM

## 5. How to make an ArrayList Read-Only?

### Option 1: `Collections.unmodifiableList()` (returns a view)
```java
List<String> original = new ArrayList<>(Arrays.asList("A", "B", "C"));
List<String> readOnly = Collections.unmodifiableList(original);

readOnly.add("D");    // UnsupportedOperationException!
original.add("D");    // This STILL works! readOnly reflects the change
```

**Limitation:** The "unmodifiable" list is just a wrapper — modifying the original list is still possible and the changes are visible through the read-only view.

### Option 2: `List.of()` (Java 9+, truly immutable)
```java
List<String> immutable = List.of("A", "B", "C");
immutable.add("D");  // UnsupportedOperationException!
// No original list to modify — truly immutable
```

### Option 3: `List.copyOf()` (Java 10+, defensive copy)
```java
List<String> original = new ArrayList<>(Arrays.asList("A", "B", "C"));
List<String> copy = List.copyOf(original);
original.add("D");  // copy is NOT affected
```

## 6. How to remove duplicates from an ArrayList?

### Preserving insertion order (LinkedHashSet)
```java
List<String> list = new ArrayList<>(Arrays.asList("C", "A", "B", "A", "C"));
List<String> unique = new ArrayList<>(new LinkedHashSet<>(list));
// Result: ["C", "A", "B"] — insertion order preserved
```

### Using Streams (Java 8+)
```java
List<String> unique = list.stream()
    .distinct()  // Uses equals() + hashCode() for deduplication
    .collect(Collectors.toList());
```

### Deduplicate by property
```java
// Remove duplicate employees by email (keep first occurrence)
List<Employee> unique = employees.stream()
    .collect(Collectors.toMap(
        Employee::getEmail,     // Key: email
        Function.identity(),    // Value: the employee
        (existing, duplicate) -> existing  // Keep first
    ))
    .values()
    .stream()
    .collect(Collectors.toList());
```

## 7. What is WeakHashMap?

A `WeakHashMap` stores keys as **WeakReferences**. When the key object has no more **strong references** anywhere in the application, the GC can reclaim it — and the `WeakHashMap` automatically removes the entry.

### How it works

```java
WeakHashMap<Object, String> cache = new WeakHashMap<>();
Object key = new Object();
cache.put(key, "value");
System.out.println(cache.size()); // 1

key = null;    // Remove the only strong reference
System.gc();   // Hint to GC (not guaranteed)
// After GC runs:
System.out.println(cache.size()); // 0 — entry was automatically removed!
```

### Reference Types in Java

| Type | GC Behavior | Use Case |
|:-----|:-----------|:---------|
| **Strong** (`Object ref = new Object()`) | Never collected while referenced | Normal usage |
| **Weak** (`WeakReference<Object>`) | Collected at next GC cycle | WeakHashMap, listeners |
| **Soft** (`SoftReference<Object>`) | Collected only when memory is low | Memory-sensitive caches |
| **Phantom** (`PhantomReference<Object>`) | Collected, but tracked for cleanup | Resource cleanup (replacement for finalize) |

### WeakHashMap vs. SoftReference Cache

- **WeakHashMap:** Entries are aggressively collected at the next GC. Good for metadata/annotation caches where the data can easily be recomputed.
- **SoftReference-based cache:** Entries survive until memory pressure. Good for expensive-to-compute data (like image thumbnails) that you'd like to keep if memory allows.

**Production tip:** For a production cache, use Caffeine (`com.github.ben-manes.caffeine`) or Guava Cache instead of building your own from WeakHashMap/SoftReferences.

## 8. Best Practices for Collections

### 1. Specify Initial Capacity
```java
// BAD: Resizes multiple times for 10,000 elements (default capacity is 10)
List<String> list = new ArrayList<>();

// GOOD: Pre-sized to avoid resizing
List<String> list = new ArrayList<>(10_000);

// For HashMap: account for load factor
Map<String, Object> map = new HashMap<>(expectedSize * 4 / 3 + 1);
```

### 2. Program to Interfaces
```java
// BAD: Locked into ArrayList implementation
ArrayList<String> list = new ArrayList<>();

// GOOD: Can swap to LinkedList without changing any method signatures
List<String> list = new ArrayList<>();
```

### 3. Use Generics (Always)
```java
// BAD: Raw type — ClassCastException at runtime
List items = new ArrayList();
items.add("string");
items.add(42);
String s = (String) items.get(1); // ClassCastException!

// GOOD: Compile-time type safety
List<String> items = new ArrayList<>();
items.add("string");
// items.add(42); // Compilation error!
```

### 4. Prefer Unmodifiable Collections for API returns
```java
public List<String> getNames() {
    // DON'T return the internal list — caller can modify it!
    // return names;
    
    // DO return an unmodifiable view
    return Collections.unmodifiableList(names);
    
    // Or in Java 10+:
    return List.copyOf(names);
}
```

### 5. Use `EnumMap` / `EnumSet` for Enum Keys
```java
// 3-4x faster than HashMap for enum keys (uses an array internally)
Map<DayOfWeek, List<Task>> schedule = new EnumMap<>(DayOfWeek.class);

// 64-bit bitset for enum sets — extremely compact and fast
Set<DayOfWeek> workDays = EnumSet.range(DayOfWeek.MONDAY, DayOfWeek.FRIDAY);
```

---
