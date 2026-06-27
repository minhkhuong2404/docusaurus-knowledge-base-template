---
id: concurrent-collections-tricky
title: Concurrent Collections (Part 2)
sidebar_label: CopyOnWrite & ModCount
description: "Advanced concurrent collection interview topics including modCount behavior and CopyOnWriteArrayList usage."
tags: [java, interview, concurrency, collections]
---

# Tricky Concurrent Collection Interview Questions & Answers

This section covers the internal mechanics of `modCount`, single-threaded vs. multi-threaded concurrency exceptions, and the `CopyOnWriteArrayList`.

## 1. Can `ConcurrentModificationException` occur in a single-threaded environment?

**Yes.** A common misconception is that "concurrent" only refers to multiple threads. In the context of `ConcurrentModificationException`, "concurrent" means **"happening at the same time as iteration"** — even within a single thread.

```java
// Single-threaded ConcurrentModificationException
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
for (String item : list) {
    if ("B".equals(item)) {
        list.remove(item);  // ConcurrentModificationException!
    }
}
```

### Why does this happen?

The enhanced for-loop (`for-each`) compiles to an `Iterator` under the hood:
```java
// The for-each loop above is actually:
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String item = it.next();      // ← Checks modCount here!
    if ("B".equals(item)) {
        list.remove(item);         // ← Increments modCount here!
    }
}
// Next call to it.next() detects modCount mismatch → THROWS
```

## 2. What is `modCount` and `expectedModCount`?

Java collections like `ArrayList` use these internal variables to implement **fail-fast** iteration:

* **`modCount`** (in `AbstractList`): A `transient int` that increments every time the list is **structurally modified** (elements added, removed, or list resized). Note: `set()` does NOT increment modCount because it doesn't change the list's structure.
* **`expectedModCount`** (in the Iterator): When an `Iterator` is created, it captures the current `modCount` value: `int expectedModCount = modCount;`

### Detection Flow
```java
// Inside ArrayList$Itr.next()
public E next() {
    checkForComodification();  // ← The guard
    // ... return element
}

final void checkForComodification() {
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
}
```

### What increments `modCount`?

| Operation | Increments modCount? |
|:----------|:--------------------|
| `add()` | ✅ Yes |
| `remove()` | ✅ Yes |
| `clear()` | ✅ Yes |
| `addAll()` | ✅ Yes |
| `set()` (replace element) | ❌ No (structural size unchanged) |
| `sort()` | ✅ Yes (since Java 8) |

## 3. How to avoid `ConcurrentModificationException`?

### Solution 1: Use `Iterator.remove()`
The iterator's own `remove()` method updates both `modCount` AND `expectedModCount`, keeping them in sync:
```java
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if ("B".equals(it.next())) {
        it.remove();  // Safe! Updates both modCount and expectedModCount
    }
}
```

### Solution 2: Use `removeIf()` (Java 8+)
Cleaner, functional approach that handles the iterator internally:
```java
list.removeIf(item -> "B".equals(item));
```

### Solution 3: Collect and remove separately
```java
List<String> toRemove = new ArrayList<>();
for (String item : list) {
    if ("B".equals(item)) toRemove.add(item);
}
list.removeAll(toRemove);
```

### Solution 4: Use `CopyOnWriteArrayList`
For concurrent access from multiple threads (see next section).

## 4. `ArrayList` vs. `CopyOnWriteArrayList`

| Feature | ArrayList | CopyOnWriteArrayList |
| :------------------ | :--------------------------- | :------------------------------------------------------- |
| **Thread Safety** | Unsafe | Safe |
| **Read Performance** | O(1) | O(1) — same as ArrayList |
| **Write Performance** | O(1) amortized | **O(n)** — copies entire array on every write! |
| **Memory** | Single array | 2× during writes (old + new array) |
| **Iterator Behavior** | Fail-Fast (throws exception) | **Fail-Safe** (iterates on a snapshot) |
| **Iterator Mutation** | `remove()` supported | `remove()` throws `UnsupportedOperationException` |

### How CopyOnWriteArrayList works internally

```java
// Simplified add() — from OpenJDK source
public boolean add(E e) {
    synchronized (lock) {                     // 1. Acquire lock
        Object[] es = getArray();             // 2. Get current array
        int len = es.length;
        es = Arrays.copyOf(es, len + 1);      // 3. Create new array (copy all!)
        es[len] = e;                          // 4. Add new element
        setArray(es);                         // 5. Swap in new array (volatile write)
        return true;
    }
}
```

### When to use CopyOnWriteArrayList

✅ **Read-heavy, write-rare scenarios:**
- Event listener lists (listeners rarely change, but fire() iterates frequently)
- Configuration/feature flag lists
- Observer pattern implementations

❌ **Avoid when:**
- Frequent writes (every write copies the entire array — O(n) time + O(n) memory)
- Large collections (copying a 10,000-element array on every add is expensive)

**Production gotcha:** A CopyOnWriteArrayList with 10,000 elements that receives 100 writes/second will allocate and discard ~100 arrays of 10,000 elements per second — causing significant GC pressure.

## 5. `HashMap` vs. `ConcurrentHashMap`

| Feature | HashMap | ConcurrentHashMap |
| :------------------- | :-------- | :----------------------- |
| **Thread Safety** | Unsafe | Safe |
| **Null Keys** | 1 null key allowed | **Not Allowed** |
| **Null Values** | Multiple null values | **Not Allowed** |
| **Iterator** | Fail-Fast | Weakly Consistent |
| **Read Locking** | None (not thread-safe) | None (volatile reads) |
| **Write Locking** | None (not thread-safe) | Per-bucket `synchronized` + CAS |
| **Compute methods** | Not atomic | **Atomic** (`computeIfAbsent`, `merge`) |

### ConcurrentHashMap's atomic compound operations

One of the most powerful (and often overlooked) features of `ConcurrentHashMap`:

```java
ConcurrentHashMap<String, AtomicInteger> counters = new ConcurrentHashMap<>();

// Thread-safe "get-or-create" — the function runs ONLY if key is absent
counters.computeIfAbsent("pageViews", k -> new AtomicInteger(0))
        .incrementAndGet();

// Thread-safe merge — accumulate values
ConcurrentHashMap<String, Long> totals = new ConcurrentHashMap<>();
totals.merge("revenue", orderAmount, Long::sum);
```

These compound operations are **atomic** — no check-then-act race conditions possible.

## 6. Which sorting algorithm does `Collections.sort()` use?

Java's `Arrays.sort()` (used internally by `Collections.sort()`) uses different algorithms based on the data type and size:

### For Objects (reference types)

**TimSort** (since Java 7) — a hybrid stable sort:
- **Merge Sort** for large arrays
- **Insertion Sort** for small subarrays (< 32 elements, called "runs")
- **Galloping mode** for efficiently merging sorted runs

| Property | Value |
|:---------|:------|
| **Time complexity** | O(n log n) worst case, O(n) best case (already sorted) |
| **Space complexity** | O(n) — temporary merge buffer |
| **Stable** | ✅ Yes (equal elements maintain relative order) |
| **Adaptive** | ✅ Yes (exploits existing order in the input) |

### For Primitives (`int[]`, `double[]`, etc.)

**Dual-Pivot Quicksort** (since Java 7):
- Uses two pivot elements instead of one, partitioning the array into three parts
- Falls back to **insertion sort** for small arrays (< 47 elements)
- Falls back to **merge sort** if the array is detected as partially sorted

| Property | Value |
|:---------|:------|
| **Time complexity** | O(n log n) average, O(n²) worst case |
| **Space complexity** | O(log n) — recursion stack |
| **Stable** | ❌ No (primitives don't have identity, so stability doesn't matter) |

### Why different algorithms?

- **Objects need stability:** When sorting `Employee` objects by salary, employees with equal salaries should maintain their original order. TimSort guarantees this.
- **Primitives don't need stability:** Two `int` values of `42` are indistinguishable, so the faster (but unstable) Dual-Pivot Quicksort is used.

```java
// TimSort (stable, for objects)
List<Employee> sorted = employees.stream()
    .sorted(Comparator.comparing(Employee::getSalary))
    .collect(Collectors.toList());

// Dual-Pivot Quicksort (for primitives)
int[] arr = {5, 3, 1, 4, 2};
Arrays.sort(arr); // Uses Dual-Pivot Quicksort
```

---
