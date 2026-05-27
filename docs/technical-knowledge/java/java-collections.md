---
id: java-collections
title: "Java Collections Framework: Deep Dive"
slug: java-collections
description: Deep dive into the Java Collections Framework, including core interfaces, implementations, performance traits, and best practices.
tags: [java, collections, data-structures, generics]
---

# Java Collections Framework: Deep Dive

A comprehensive guide to Java's Collections Framework — data structures, common implementations, internal mechanics, and best practices.

---

## 1. Collections Hierarchy Overview

```
Iterable
└── Collection
    ├── List  (ordered, allows duplicates)
    │   ├── ArrayList
    │   ├── LinkedList
    │   ├── Vector (legacy, synchronized)
    │   └── CopyOnWriteArrayList (concurrent)
    ├── Set  (no duplicates)
    │   ├── HashSet
    │   ├── LinkedHashSet
    │   └── TreeSet (sorted)
    └── Queue / Deque
        ├── PriorityQueue
        ├── ArrayDeque
        ├── LinkedList
        └── BlockingQueue (concurrent)
            ├── ArrayBlockingQueue
            ├── LinkedBlockingQueue
            └── DelayQueue

Map  (key-value pairs, not part of Collection)
├── HashMap
├── LinkedHashMap
├── TreeMap (sorted)
├── Hashtable (legacy, synchronized)
└── ConcurrentHashMap (concurrent)
```

---

## 2. List Implementations

### ArrayList

The most commonly used `List` implementation, backed by a **resizable array**.

**Key characteristics:**
- **O(1)** random access by index (implements `RandomAccess`)
- **O(1)** amortized append (`add()` at end)
- **O(n)** insert/remove in the middle (requires shifting elements)
- **Not thread-safe**

**Expansion mechanism:** When the internal array is full, `ArrayList` creates a new array **1.5× the current size** and copies elements over:

```java
// Simplified expansion logic
int newCapacity = oldCapacity + (oldCapacity >> 1);  // 1.5x
elementData = Arrays.copyOf(elementData, newCapacity);
```

**Best practices:**
- Specify initial capacity if you know the size: `new ArrayList<>(1000)`
- Use `ensureCapacity()` before bulk inserts to avoid repeated resizing

### LinkedList

Backed by a **doubly-linked list**. Also implements `Deque`.

**Key characteristics:**
- **O(1)** insert/remove at head or tail
- **O(n)** random access (must traverse the list)
- **O(n)** insert at arbitrary index (traversal + O(1) link update)
- Higher memory overhead per element (each node stores two pointers)

### ArrayList vs LinkedList

| Operation | ArrayList | LinkedList |
|-----------|-----------|------------|
| Random access `get(i)` | **O(1)** | O(n) |
| Append `add(e)` | **O(1)** amortized | **O(1)** |
| Insert at index `add(i, e)` | O(n) | O(n)* |
| Remove by index | O(n) | O(n)* |
| Memory per element | Lower | Higher (node overhead) |
| Cache locality | **Excellent** (contiguous) | Poor (scattered) |

> \* LinkedList's insert/remove is O(1) for the link operation itself, but O(n) to find the position first.

**In practice:** `ArrayList` is almost always the better choice due to CPU cache friendliness and lower overhead.

---

## 3. Map Implementations

### HashMap Internals

`HashMap` uses an **array of buckets** where each bucket is a linked list (or red-black tree for long chains).

**Core mechanics:**

1. **Hash function:** Spreads keys across buckets.
   ```java
   static final int hash(Object key) {
       int h;
       return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
   }
   ```
   The XOR with the upper 16 bits reduces collisions when the array size is a power of 2.

2. **Bucket index:** `index = hash & (capacity - 1)` (bitwise AND, equivalent to modulo for power-of-2 sizes).

3. **Collision resolution & Treeification Thresholds:**
   - Entries with the same bucket index form a **linked list**.
   - **Treeification:** When a bucket's linked list grows beyond **`TREEIFY_THRESHOLD = 8`** nodes, and the overall map capacity is at least **64**, the bucket converts from a linked list to a **red-black tree** (transforming lookup from $O(n)$ to $O(\log n)$).
     - *Why 8?* According to the Poisson distribution, the probability of a bucket having 8 elements under a good hash function is extremely low (about 1 in 10 million). A tree structure is a fallback to protect against hash-collision denial-of-service (DoS) attacks or poor custom `hashCode()` implementations.
   - **Untreeification:** When garbage collection or deletions shrink a bucket's tree below **`UNTREEIFY_THRESHOLD = 6`** nodes, it converts back to a linked list.
     - *Why not untreeify at 7?* Having a gap between 8 (treeify) and 6 (untreeify) prevents **thrashing**—constant structural conversion back and forth if elements are frequently added and removed around the threshold.

4. **Load factor & expansion:**
   - Default load factor: **0.75** (empirically balances memory footprint and lookup frequency).
   - Threshold = capacity × load factor.
   - When `size > threshold`, the array **doubles** in capacity and all entries are rehashed.

**Important:** `HashMap` is not thread-safe. Use `ConcurrentHashMap` for concurrent access.

### WeakHashMap Internals & Caching

`WeakHashMap` is a specialized `Map` implementation where keys are stored as **Weak References**. It is commonly used for implementing memory-sensitive caches or metadata registries.

#### How It Works Internally
- Keys are wrapped in a subclass of **`WeakReference<K>`**.
- If a key object no longer has any **strong references** pointing to it in the application, the Garbage Collector (GC) will clear the key on its next run.
- When the GC clears a weak reference, it automatically appends that reference object to a **`ReferenceQueue`** associated with the map.
- During any read or write operation on the `WeakHashMap` (e.g., `get()`, `put()`, `size()`), the map internally calls its private method `expungeStaleEntries()`:
  ```java
  private void expungeStaleEntries() {
      for (Object x; (x = queue.poll()) != null; ) {
          synchronized (queue) {
              // Find the entry associated with the cleared reference x
              // and remove it from the internal bucket table
          }
      }
  }
  ```
- This lazily purges garbage-collected entries, preventing memory leaks of the corresponding values.

#### Real-world Use Case: Thread-Local Metadata Caching
```java
// Thread-safe weak cache for caching database connection metadata per driver
private static final Map<Driver, ConnectionPoolMetadata> cache = 
    Collections.synchronizedMap(new WeakHashMap<>());
```
If a dynamic database driver is unloaded (removing its strong references), the cache automatically drops its metadata entry, preventing classloader memory leaks.


### LinkedHashMap

Extends `HashMap` with a **doubly-linked list** connecting all entries, preserving either:
- **Insertion order** (default)
- **Access order** (most-recently-accessed last) — set via constructor parameter

**LRU Cache:** `LinkedHashMap` can function as an LRU cache by overriding `removeEldestEntry()`:

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxSize;

    public LRUCache(int maxSize) {
        super(maxSize, 0.75f, true);  // accessOrder = true
        this.maxSize = maxSize;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxSize;
    }
}
```

### TreeMap

Backed by a **red-black tree**. Entries are sorted by key (natural ordering or a provided `Comparator`).

- All operations are **O(log n)**
- Supports `NavigableMap` operations: `firstKey()`, `lastKey()`, `subMap()`, `headMap()`, `tailMap()`

### HashMap vs Hashtable vs ConcurrentHashMap

| Feature | HashMap | Hashtable | ConcurrentHashMap |
|---------|---------|-----------|-------------------|
| Thread-safe | ❌ | ✅ (synchronized) | ✅ (CAS + synchronized) |
| Null keys | ✅ (one null key) | ❌ | ❌ |
| Performance | Best (single-thread) | Poor (coarse lock) | Best (concurrent) |
| Recommended | Single-threaded use | Never (legacy) | Multi-threaded use |

---

## 4. Set Implementations

### HashSet

Backed by a `HashMap` internally — elements are stored as keys, with a dummy constant as the value.

```java
// Internally
private transient HashMap<E, Object> map;
private static final Object PRESENT = new Object();

public boolean add(E e) {
    return map.put(e, PRESENT) == null;
}
```

### LinkedHashSet

Extends `HashSet` using `LinkedHashMap` — maintains **insertion order**.

### TreeSet

Backed by `TreeMap` — maintains elements in **sorted order**.

---

## 5. Queue Implementations

### PriorityQueue

A **min-heap** implementation that always dequeues the smallest element (by natural order or `Comparator`).

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(3);
minHeap.offer(1);
minHeap.offer(2);
minHeap.poll();  // returns 1 (smallest)

// Max-heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
```

- `offer()` / `poll()`: **O(log n)**
- `peek()`: **O(1)**
- Not thread-safe — use `PriorityBlockingQueue` for concurrent access

### ArrayDeque

A resizable **circular array** implementing `Deque`. Faster than `LinkedList` as a stack or queue.

```java
Deque<String> stack = new ArrayDeque<>();
stack.push("first");
stack.push("second");
stack.pop();  // "second"

Deque<String> queue = new ArrayDeque<>();
queue.offer("first");
queue.offer("second");
queue.poll();  // "first"
```

### ArrayBlockingQueue

A **bounded blocking queue** backed by a fixed-size array. Uses `ReentrantLock` with two `Condition` objects (`notEmpty`, `notFull`) for producer-consumer synchronization.

```java
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(100);

// Producer thread
queue.put(task);  // blocks if queue is full

// Consumer thread
Task task = queue.take();  // blocks if queue is empty
```

### DelayQueue

An unbounded blocking queue where elements must implement `Delayed`. Elements can only be dequeued after their delay has expired.

```java
public class DelayedTask implements Delayed {
    private final long executeAt;

    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert(executeAt - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
    }

    @Override
    public int compareTo(Delayed other) {
        return Long.compare(this.getDelay(TimeUnit.MILLISECONDS),
                           other.getDelay(TimeUnit.MILLISECONDS));
    }
}
```

**Use cases:** Scheduled task execution, order timeout cancellation, cache expiration.

---

## 6. ConcurrentHashMap Deep Dive

### JDK 7: Segment-Based Locking

ConcurrentHashMap in JDK 7 used **Segment** arrays, each containing its own `HashEntry[]` array. Locking was per-segment, allowing concurrent access to different segments.

```
ConcurrentHashMap
├── Segment[0] (lock) → HashEntry[] → linked list
├── Segment[1] (lock) → HashEntry[] → linked list
├── ...
└── Segment[15] (lock) → HashEntry[] → linked list
```

Default concurrency level: 16 segments → up to 16 concurrent writers.

### JDK 8: CAS + Synchronized (Node-Based)

JDK 8 replaced segments with a flat `Node[]` array, using **CAS for empty buckets** and **`synchronized` on the first node** of each bucket:

```java
// Simplified put logic
if (bucket is empty) {
    CAS to insert new Node  // lock-free for empty buckets
} else {
    synchronized (first node of bucket) {
        // insert into linked list or red-black tree
    }
}
```

**Size counting:** Uses `baseCount` + `CounterCell[]` to reduce contention when multiple threads update the size concurrently (similar to `LongAdder`).

---

## 7. Collection Usage Best Practices

### Common Pitfalls

1. **`Arrays.asList()` returns a fixed-size list:**
   ```java
   List<String> list = Arrays.asList("a", "b", "c");
   list.add("d");  // throws UnsupportedOperationException!

   // Use this instead:
   List<String> mutableList = new ArrayList<>(Arrays.asList("a", "b", "c"));
   ```

2. **`subList()` creates a view, not a copy:**
   ```java
   List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4, 5));
   List<Integer> sub = list.subList(1, 3);  // [2, 3]
   list.add(6);  // modifying original...
   sub.get(0);   // ConcurrentModificationException!
   ```

3. **Use `isEmpty()` instead of `size() == 0`:**
   Some collections (e.g., `ConcurrentLinkedQueue`) compute `size()` in O(n).

4. **`Collectors.toMap()` throws on null values:**
   ```java
   // This throws NullPointerException if any value is null
   map.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

   // Use HashMap::merge or handle nulls explicitly
   ```

5. **Don't modify a collection while iterating:**
   ```java
   // WRONG — ConcurrentModificationException
   for (String s : list) {
       if (s.equals("remove")) list.remove(s);
   }

   // CORRECT — use Iterator.remove()
   Iterator<String> it = list.iterator();
   while (it.hasNext()) {
       if (it.next().equals("remove")) it.remove();
   }

   // Or use removeIf (Java 8+)
   list.removeIf(s -> s.equals("remove"));
   ```

### Choosing the Right Collection

| Need | Use |
|------|-----|
| Ordered list with fast random access | `ArrayList` |
| Fast insert/remove at both ends | `ArrayDeque` |
| No duplicates, unordered | `HashSet` |
| No duplicates, sorted | `TreeSet` |
| Key-value lookup | `HashMap` |
| Key-value, sorted keys | `TreeMap` |
| Key-value, insertion order | `LinkedHashMap` |
| Thread-safe map | `ConcurrentHashMap` |
| Thread-safe list (read-heavy) | `CopyOnWriteArrayList` |
| Producer-consumer queue | `ArrayBlockingQueue` / `LinkedBlockingQueue` |
| Priority processing | `PriorityQueue` |

---

## 8. Sorting & Comparison

### Comparable vs Comparator

| Aspect | `Comparable<T>` | `Comparator<T>` |
|--------|-----------------|------------------|
| Package | `java.lang` | `java.util` |
| Method | `compareTo(T o)` | `compare(T o1, T o2)` |
| Modifies class | Yes (implements interface) | No (external) |
| Natural ordering | Defines it | Provides alternative orderings |

```java
// Comparable: natural ordering
public class Employee implements Comparable<Employee> {
    private String name;
    private int salary;

    @Override
    public int compareTo(Employee other) {
        return Integer.compare(this.salary, other.salary);
    }
}

// Comparator: custom ordering
Comparator<Employee> byName = Comparator.comparing(Employee::getName);
Comparator<Employee> bySalaryDesc = Comparator.comparingInt(Employee::getSalary).reversed();
```

### Collections.sort() vs Stream.sorted()

| Aspect | `Collections.sort()` | `Stream.sorted()` |
|--------|---------------------|-------------------|
| Mutability | **Mutates** the original list | Returns a **new** sorted stream |
| Style | Imperative | Functional/declarative |
| Null handling | Throws `NullPointerException` on null elements | Same behavior |
| Algorithm | TimSort (stable, O(n log n)) | TimSort internally |

### Sorting Null-safe

To sort lists that may contain nulls, use `Comparator.nullsFirst()` or `nullsLast()`:

```java
List<String> names = Arrays.asList("Alice", null, "Bob", null, "Charlie");
names.sort(Comparator.nullsLast(Comparator.naturalOrder()));
// [Alice, Bob, Charlie, null, null]
```

---

## 9. Common Pitfalls in Interviews

### Mutable Keys in HashMap

If a key object's state changes after insertion, the entry becomes **unreachable**:

```java
List<String> key = new ArrayList<>(List.of("a"));
Map<List<String>, String> map = new HashMap<>();
map.put(key, "value");

key.add("b"); // Mutates the key → hashCode changes
map.get(key); // null! Entry is lost
```

**Rule:** Always use immutable objects as map keys.

### equals() without hashCode()

Overriding only `equals()` breaks the hash-based collection contract:

```java
// BAD: equals overridden but not hashCode
Set<User> users = new HashSet<>();
users.add(new User(1, "Alice"));
users.contains(new User(1, "Alice")); // May return false!
```

### ConcurrentModificationException

```java
// ❌ Throws ConcurrentModificationException
for (String item : list) {
    if (item.isEmpty()) list.remove(item);
}

// ✅ Safe alternatives
list.removeIf(String::isEmpty);
// or use Iterator.remove()
// or use CopyOnWriteArrayList for concurrent access
```

## 10. Iteration & ModCount (Fail-Fast vs. Fail-Safe)

Java collections provide two distinct behaviors when a collection is modified structurally while a thread is iterating over it: **Fail-Fast** and **Fail-Safe / Weakly Consistent**.

### 🏃 Fail-Fast Iterators & `modCount`

Standard collections (like `ArrayList`, `HashSet`, `HashMap`) return **Fail-Fast** iterators. If the collection is structurally modified (elements added, removed, or the structure resized) at any point after the iterator is created in any way other than through the iterator's own `remove()` method, the iterator throws a `ConcurrentModificationException` immediately.

#### The `modCount` Mechanism
Fail-fast iterators are implemented using a transient `protected int modCount` field inside the collection class:

1. Every structural change (e.g., `add()`, `remove()`, `clear()`, `resize()`) increments `modCount`.
2. When the iterator is initialized, it stores the expected version:
   ```java
   int expectedModCount = modCount;
   ```
3. On every call to `next()`, `remove()`, or `forEachRemaining()`, the iterator verifies:
   ```java
   if (modCount != expectedModCount) {
       throw new ConcurrentModificationException();
   }
   ```

##### Example of Fail-Fast Behavior:
```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));
Iterator<String> it = list.iterator();

list.add("D"); // Modifies modCount

// Next call triggers modCount != expectedModCount check
it.next(); // ❌ Throws ConcurrentModificationException!
```

---

### 🛡️ Fail-Safe / Weakly Consistent Iterators

Concurrent collections (like `CopyOnWriteArrayList`, `ConcurrentHashMap`, `ConcurrentLinkedQueue`) return **Fail-Safe / Weakly Consistent** iterators. They do **not** throw `ConcurrentModificationException` when structural modifications occur concurrently.

Instead, they handle modifications via two main strategies:

#### 1. Snapshot Iteration (`CopyOnWriteArrayList`)
The iterator captures a reference to the underlying array at the exact moment of iterator creation.
- **Copy-On-Write:** Any writes or deletions create a *new* copy of the array.
- **Traversing the Snapshot:** The iterator traverses the immutable snapshot array it originally captured, completely insulated from writes.
- **Trade-off:** No synchronization is needed during reads/iteration, but writes are extremely expensive due to full array copying. Reads can be stale (won't see edits made after iterator creation).

#### 2. Weakly Consistent Iteration (`ConcurrentHashMap`)
The iterator traverses the live hash buckets directly.
- **Lock-Free Reads:** Reads leverage volatile reads of node pointers.
- **Live Updates:** The iterator reflects changes made to elements in buckets it hasn't visited yet, but does not guarantee seeing changes made in already-traversed buckets.
- **Trade-off:** No memory copies or full locks, but the elements returned represent a weakly consistent state at that point in time.

---

### 📊 Comparative Summary

| Feature | Fail-Fast | Fail-Safe / Weakly Consistent |
| :--- | :--- | :--- |
| **Exception Thrown** | `ConcurrentModificationException` | None |
| **Mechanics** | Checks `modCount == expectedModCount` | Operates on a snapshot or live concurrent nodes |
| **Source Collection** | Standard (`ArrayList`, `HashMap`) | Concurrent (`CopyOnWriteArrayList`, `ConcurrentHashMap`) |
| **Memory Overhead** | Negligible | High for copy-on-write; low for concurrent maps |
| **Stale Reads** | N/A (aborts) | Yes (for snapshot array iterators) |
| **Thread Safety** | Designed for single-thread detection | Designed for thread-safe concurrent iteration |

---

## Advanced Editorial Pass: Collections as Data-Path Architecture

### Advanced Focus
- Select data structures by access pattern, mutation frequency, and memory profile.
- Understand iterator semantics and concurrent behavior under real workloads.
- Balance API ergonomics with allocation and locality costs.

### Failure Modes
- Defaulting to hash-based structures without cardinality and ordering analysis.
- Hidden quadratic behavior from repeated linear scans.
- Unsafely mixing mutable collections with concurrent access.

### Review Checklist
1. Define complexity expectations for critical operations in code comments or docs.
2. Measure allocation churn and GC impact for collection-heavy paths.
3. Prefer immutable views where ownership boundaries are unclear.

### Compare Next
- [Java Concurrency: Threads, Locks & Concurrent Utilities](./java-concurrency.md)
- [Java I/O: Streams, NIO & I/O Models](./java-io.md)
- [Java Fundamentals: Core Language Concepts](./java-fundamentals.md)

## Interview Questions (Senior Level)

1. How do you select collection types for latency-critical code paths where both throughput and GC pressure matter?
2. When does `ConcurrentHashMap` become a bottleneck, and what mitigation patterns do you apply?
3. How would you detect and eliminate hidden $O(n^2)$ collection behavior in production services?
4. What rules do you enforce for map keys, mutability, and equality contracts across domain models?

Short answer guide:
- Choose based on access pattern, memory locality, and mutation profile.
- Reduce contention via sharding, key distribution, and workload-aware data structures.
- Use profiling and allocation analysis to surface algorithmic hotspots.
- Require immutable keys and correct `equals/hashCode` implementations.
