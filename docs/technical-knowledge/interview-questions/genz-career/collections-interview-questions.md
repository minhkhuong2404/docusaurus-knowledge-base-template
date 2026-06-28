---
id: java-collections-interview-questions
title: 50+ Real & Tricky Java Collection Framework Interview Questions
sidebar_label: Java Collections Interview Questions Tricky
description: A comprehensive guide covering 50+ tricky, real-world interview questions on the Java Collection Framework for experienced developers.
tags:
  - Java
  - Collections Framework
  - Interview Prep
  - Backend Development
  - Data Structures
---

# Java Collection Framework Interview Questions & Answers

This guide compiles real, advanced, and tricky interview questions on the Java Collection Framework commonly asked of experienced developers (2–7 years experience). 

---

## 1. General Collection Framework Concepts

### Why doesn't the Collection framework have a common interface for both `List` and `Map`?
The Java collection framework is organized into two fundamentally different branches: the `Collection` interface (containing `List`, `Set`, and `Queue`) and the `Map` interface. A `List` stores elements as a single, ordered sequence of values accessed by index. A `Map` stores data as key-value pairs, where each value is associated with a unique key, not a positional index. Their storage models, iteration patterns, and method contracts are completely different — `add(E)` vs `put(K, V)`, `get(int index)` vs `get(Object key)`. Forcing them under a single interface would either strip away the type-specific contracts or create an absurdly bloated API surface that violates the Interface Segregation Principle. Under the hood, they don't even share the same `Iterable` semantics: a `Map` isn't directly `Iterable`; you iterate via `entrySet()`, `keySet()`, or `values()`, each of which returns a `Collection`.

### What problem would arise if collections allowed primitive types?
Collections rely on **generics** (e.g., `List<T>`), which require reference types due to Java's **type erasure** mechanism — at runtime, generics are erased to `Object`, and primitives cannot be assigned to `Object`. Beyond generics, collections use `Object` methods like `equals()`, `hashCode()`, and `toString()` for element comparison, hashing, and display; primitives don't inherit from `Object` and lack these methods. Autoboxing (e.g., `int` → `Integer`) bridges the gap, but it introduces overhead: each boxing operation allocates a new heap object (~16 bytes for `Integer`), and in tight loops this causes GC pressure. Libraries like **Eclipse Collections** and **HPPC** provide primitive-specialized collections (`IntArrayList`, `IntIntHashMap`) that avoid boxing entirely, reducing memory by 4-8× for large datasets.

### Can you design your own collection and what methods are mandatory?
Yes. The cleanest approach is extending an `Abstract*` class:
* Extend **`AbstractList`** → you must implement `get(int index)` and `size()`. For mutability, also override `set()`, `add()`, and `remove()`.
* Extend **`AbstractSet`** → you must implement `iterator()` and `size()`.
* Extend **`AbstractMap`** → you must implement `entrySet()` returning a `Set<Map.Entry<K,V>>`.

The `Abstract*` classes provide default implementations for all other methods based on these primitives. For example, `AbstractList.indexOf()` is built on top of `get()` + `equals()`. If you implement `Collection` directly without extending an abstract class, you must implement **all 15 methods** — which is why the abstract classes exist.

> **Production tip:** If building a read-only collection, throw `UnsupportedOperationException` from mutator methods. Java 9+ provides `List.of()`, `Set.of()`, `Map.of()` factory methods that return truly unmodifiable collections backed by optimized internal classes.

---

## 2. Equals & HashCode Contract

### What is the `equals` and `hashCode` contract?
The contract defines the consistency rules between object identity and hash-based data structures:

1. **Reflexive:** `x.equals(x)` must return `true`.
2. **Symmetric:** If `x.equals(y)`, then `y.equals(x)`.
3. **Transitive:** If `x.equals(y)` and `y.equals(z)`, then `x.equals(z)`.
4. **Consistent:** Multiple invocations return the same result if no fields change.
5. **Null comparison:** `x.equals(null)` must return `false`.

The **hash contract** ties into this: if `a.equals(b)` returns `true`, then `a.hashCode() == b.hashCode()` **must** hold. The reverse is not required — unequal objects can share hash codes (collision). Hash-based collections like `HashMap` use `hashCode()` to locate the bucket in O(1), then use `equals()` to resolve collisions within that bucket. The sequence is always: **hash first → equals second**.

```java
// Correct implementation pattern using Objects utility
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Employee e)) return false;
    return id == e.id && Objects.equals(name, e.name);
}

@Override
public int hashCode() {
    return Objects.hash(id, name);
}
```

### What happens if the `equals` method is overridden but `hashCode` is not?
Two logically equal objects will land in **different buckets** because `Object.hashCode()` uses the object's memory address by default. A `HashSet` will store both as separate entries (duplicates). A `HashMap.get()` will fail to find a key even though a logically equal key exists — it searches the wrong bucket. This is one of the most common and insidious bugs in production Java code. Tools like **SpotBugs** flag this as `HE_EQUALS_USE_HASHCODE`.

### Can two unequal objects have the same hash code?
Yes — this is a **hash collision**. The hash code space is 2³² (~4.3 billion) values, but the potential object space is infinite. HashMap handles collisions by chaining entries in the same bucket: first as a **linked list** (O(n) traversal), then converting to a **Red-Black Tree** (O(log n) traversal) when the chain length exceeds **TREEIFY_THRESHOLD = 8** and the total bucket count is ≥ **MIN_TREEIFY_CAPACITY = 64**. A good `hashCode()` implementation distributes objects uniformly across buckets to minimize collision chains.

### What breaks if mutable fields are used in `hashCode`?
When an object is stored in a `HashMap` or `HashSet`, its `hashCode()` determines its bucket placement. If a mutable field used in `hashCode()` is later changed, the hash code changes, but the object remains in its **original bucket**. Now:
- `contains()` returns `false` (searches the wrong bucket).
- `remove()` silently fails.
- The object becomes a **phantom entry** — unreachable yet preventing GC, causing a subtle memory leak.

> **Rule of thumb:** Only use `final` or effectively immutable fields (like `id`) in `hashCode()`. If you must use mutable fields, document the risk prominently.

---

## 3. List Interface

### Explain the internal working of `ArrayList`.
`ArrayList` is backed by a **transient** `Object[] elementData` array:

* **Lazy initialization (Java 8+):** The initial backing array is `{}` (empty). The first `add()` expands it to the **default capacity of 10**.
* **Resizing formula:** When full, a new array of size `newCapacity = oldCapacity + (oldCapacity >> 1)` is created — i.e., **1.5× growth**. So 10 → 15 → 22 → 33 → ...
* **Copy cost:** Resizing calls `Arrays.copyOf()`, which internally uses `System.arraycopy()` (a native, memory-level bulk copy). For a list of 1 million elements, this copies ~4 MB of references.
* **Performance:**
  - `get(i)` → O(1), direct array index lookup.
  - `add(e)` (append) → **amortized O(1)**, worst case O(n) on resize.
  - `add(i, e)` (insert at position) → O(n), shifts elements right via `System.arraycopy()`.
  - `remove(i)` → O(n), shifts elements left.

> **Memory tip:** If you know the expected size upfront, use `new ArrayList<>(expectedSize)` to avoid unnecessary resize-and-copy operations. For trimming, call `trimToSize()` to release unused capacity.

### Can `ArrayList` store `null` multiple times?
Yes. `ArrayList` imposes **no restrictions** on `null`. It can appear at any index, multiple times. However, calling methods like `indexOf(null)` works because the implementation explicitly handles `null` comparison: it uses `==` for null and `equals()` for non-null elements. Watch out for `NullPointerException` if you unbox wrapper types from the list (e.g., `int x = list.get(i)` where `list.get(i)` is `null`).

### Why is `LinkedList` slower for search operations?
`LinkedList` uses a **doubly-linked node** structure: each `Node<E>` holds `item`, `prev`, and `next` references. To access element at index `i`, it must traverse from the head (if `i < size/2`) or from the tail (if `i >= size/2`), walking O(n/2) ≈ O(n) nodes. Each node traversal is a pointer chase that likely causes a **CPU cache miss** (nodes are scattered across the heap, not contiguous in memory). In contrast, `ArrayList`'s backing array is contiguous, meaning sequential access benefits from **CPU cache line prefetching** — hardware loads 64-byte cache lines, so accessing `arr[i]` often preloads `arr[i+1]` through `arr[i+7]` for free.

### What are the use cases of `ArrayList` vs. `LinkedList`?
* **Use `ArrayList`** (~99% of cases): Fast random access O(1), CPU cache-friendly iteration, lower memory overhead (~4 bytes per element vs ~24 bytes per node in LinkedList). Even insertions at the middle are often faster due to cache locality.
* **Use `LinkedList`** (rare): When used as a `Deque` (double-ended queue) — `addFirst()` / `removeFirst()` are O(1) without shifting. In practice, `ArrayDeque` outperforms `LinkedList` even for this use case.

> **Interview gotcha:** "LinkedList is better for frequent insertions" is a textbook myth. Benchmarks consistently show `ArrayList` outperforms `LinkedList` for insertions too, because finding the insertion point in a `LinkedList` is O(n), and cache misses dominate.

### What happens if you modify a list while iterating using a for-each loop?
Java throws a **`ConcurrentModificationException`**. Internally, each collection maintains a `modCount` counter that increments on every structural modification (`add`, `remove`, `clear`). The iterator captures `expectedModCount = modCount` at creation. On each `next()` call, it checks `modCount != expectedModCount`; if different, it throws immediately. This is the **fail-fast** mechanism.

**Safe alternatives:**
```java
// 1. Use Iterator.remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("remove-me")) it.remove();
}

// 2. Use removeIf() (Java 8+)
list.removeIf(s -> s.equals("remove-me"));

// 3. Use CopyOnWriteArrayList for concurrent scenarios
```

---

## 4. Set Interface

### How does a `Set` ensure uniqueness without knowing object equality logic?
A `Set` delegates uniqueness enforcement to the **object itself** via `hashCode()` and `equals()`. For `HashSet`, the flow is:
1. Compute `hashCode()` of the new element → determine bucket index.
2. Walk the bucket chain, calling `equals()` against each existing element.
3. If `equals()` returns `true` for any existing element → **reject** (return `false` from `add()`).
4. If no match → **accept** and insert.

Internally, `HashSet` is backed by a `HashMap<E, Object>` where every element is stored as a **key**, and the value is a shared singleton `PRESENT` object. So `hashSet.add(e)` calls `hashMap.put(e, PRESENT)`.

### Does `Set` allow `null` values?
It depends on the implementation and has important reasons:
* **`HashSet`** → allows **one** `null`. It stores null in bucket index 0 (hash of null is 0).
* **`LinkedHashSet`** → allows **one** `null` (same HashMap backing).
* **`TreeSet`** → **does not** allow `null`. It uses `compareTo()` / `Comparator.compare()` for ordering; calling either on `null` throws `NullPointerException`. Even if you provide a null-safe `Comparator`, inserting `null` into the first element works, but subsequent inserts will fail when comparing against null.

### Why is there no `get()` method in a `Set`?
A `Set` models the mathematical concept of a set: membership (contains/doesn't contain) is the primary operation, not retrieval by position or key. There's no concept of "the element at position 3" because sets are unordered (or ordered by value, not insertion). If you need to retrieve an element equal to a given element, use a `Map<E, E>` where key and value are the same. Java's `NavigableSet.floor()`, `ceiling()`, `higher()`, `lower()` provide nearest-match retrieval for sorted sets.

### Why is `TreeSet` slower than `HashSet`?
`TreeSet` is backed by a **Red-Black Tree** (self-balancing BST), giving O(log n) for `add()`, `remove()`, and `contains()`. `HashSet` is backed by a **hash table**, giving amortized O(1) for the same operations. The constant factor also differs: TreeSet performs **multiple `compareTo()` calls** per operation as it navigates the tree, while HashSet computes one `hashCode()` + one `equals()`. However, `TreeSet` gives you **sorted iteration** and range operations (`headSet()`, `tailSet()`, `subSet()`) that `HashSet` cannot provide.

| Operation | HashSet | TreeSet |
|-----------|---------|---------|
| `add()` | O(1) amortized | O(log n) |
| `contains()` | O(1) amortized | O(log n) |
| `remove()` | O(1) amortized | O(log n) |
| Iteration order | Unpredictable | Sorted |
| `null` support | One null | No null |

### How does `LinkedHashSet` maintain insertion order?
It extends `HashSet` and uses `LinkedHashMap` internally. Each entry is a hash table node that **also** participates in a **doubly-linked list** threading through all entries in insertion order. This means each node carries two extra references (`before` and `after`) compared to a regular `HashSet` node, adding ~16 bytes per entry. Iteration follows the linked list, giving **predictable insertion-order traversal** in O(n) time, unlike `HashSet` which iterates bucket-by-bucket (potentially hitting many empty buckets).

---

## 5. Map Interface

### Why does `Map` not extend `Collection`?
The fundamental contract mismatch is in `add()` vs `put()`:
- `Collection.add(E element)` — takes a single element.
- `Map.put(K key, V value)` — takes a key-value pair.

If `Map` extended `Collection`, what would `add()` accept? A `Map.Entry`? That would break the generics contract and make the API confusing. Additionally, `Collection.contains(Object)` checks for element membership, while `Map.containsKey()` and `Map.containsValue()` are two separate operations on different dimensions. The designers chose clean separation over artificial unification.

### Why are keys required to be unique, but values are not?
Keys serve as the **lookup index** — they must be unique to provide deterministic retrieval. `map.get(key)` returns exactly one value. If two keys were identical, the map couldn't know which value to return, violating the function contract (one input → one output). Values are the **payload** and carry no such constraint. Multiple keys can map to the same value (many-to-one relationship). For example, multiple employees (keys) can share the same department name (value).

### Why does `Map` expose `entrySet()` instead of iterating directly?
`Map` itself doesn't implement `Iterable` because there's no single natural element type — should it iterate keys, values, or pairs? Instead, it provides **three collection views**:
- `keySet()` → `Set<K>` — unique keys.
- `values()` → `Collection<V>` — all values (may have duplicates).
- `entrySet()` → `Set<Map.Entry<K,V>>` — key-value pairs.

Using `entrySet()` is the most efficient way to iterate because it avoids the O(1)-per-lookup cost of `map.get(key)` inside a `keySet()` loop. In a `HashMap` with 1M entries, iterating via `keySet()` + `get()` performs **2 million hash lookups**, while `entrySet()` performs **zero** — it walks the internal structure directly.

### Explain the internal working of `HashMap`.
`HashMap` uses an array of **`Node<K,V>`** (linked list nodes) as buckets:

1. **Hash computation:** `hash = key.hashCode() ^ (key.hashCode() >>> 16)` — XORs the upper 16 bits with the lower 16 bits to spread the distribution (called **hash perturbation**).
2. **Bucket index:** `index = hash & (capacity - 1)` — bitwise AND replaces modulo because capacity is always a power of 2.
3. **Insertion:** If the bucket is empty, place the node directly. If occupied, walk the chain comparing keys via `equals()`. If a match is found, replace the value. If no match, append to the chain.
4. **Treeification:** When a chain exceeds **`TREEIFY_THRESHOLD = 8`** AND total capacity ≥ **`MIN_TREEIFY_CAPACITY = 64`**, the chain converts from a linked list to a **Red-Black Tree** (O(log n) search). If the chain shrinks below **`UNTREEIFY_THRESHOLD = 6`**, it converts back to a linked list.
5. **Resizing:** When `size > capacity × loadFactor`, the capacity doubles. Every entry is re-bucketed (`rehashing`). This is O(n).

> **Why 8?** The Java designers used a **Poisson distribution** model: with a good hash function and load factor 0.75, the probability of 8 or more entries in one bucket is approximately 0.00000006 (1 in 10 million). Treeification is a safety net, not a normal operation path.

### What is the default capacity and load factor of `HashMap`?
* **Default capacity:** 16 buckets (must be a power of 2).
* **Default load factor:** 0.75 — a space-time tradeoff. At 0.75, roughly 75% of buckets will be occupied before resizing, keeping collision chains short while not wasting too much memory.
* **Resize threshold:** `capacity × loadFactor` = 16 × 0.75 = **12**. Adding the 13th entry triggers a resize to 32 buckets.

| Load Factor | Effect |
|-------------|--------|
| < 0.75 | Fewer collisions, more memory waste |
| = 0.75 | Default, balanced tradeoff |
| > 0.75 | More collisions, less memory, slower lookups |

### What happens internally when two keys have the same hash?
This is a **hash collision**. Both keys map to the same bucket index (`hash & (capacity - 1)`). The `HashMap` chains them within the bucket:
1. **Check each node:** Walk the chain, calling `equals()` on each node's key.
2. **If `equals()` matches:** Replace the existing value (overwrite).
3. **If no match found:** Append a new node to the end of the chain.

With Java 8+, if the chain length exceeds 8 (and capacity ≥ 64), it converts to a Red-Black Tree. This transforms worst-case lookup from O(n) to O(log n), protecting against **hash-flooding DoS attacks** where an attacker crafts keys with identical hash codes.

### What if `equals()` is true but the hash code is different?
This **violates the hashCode contract**. The `HashMap` will:
1. Compute different bucket indices for the two keys.
2. Store them in **different buckets** as if they're unrelated.
3. `map.get(key2)` will search the wrong bucket and return `null`, even though `key1.equals(key2)` is `true`.

This is a **silent data corruption** bug — no exception is thrown, the program just behaves incorrectly. Static analysis tools (SpotBugs rule `HE_EQUALS_USE_HASHCODE`) catch this.

### Why does `HashMap` allow one `null` key?
`HashMap` handles `null` as a special case by hardcoding its hash to `0`, placing it always in **bucket 0**. The `putVal()` method checks `if (key == null)` before calling `hashCode()` to avoid `NullPointerException`. Only one `null` key is allowed because keys must be unique — a second `put(null, value)` simply overwrites the first entry.

In contrast, `ConcurrentHashMap` **prohibits null keys and values** because in a concurrent context, `map.get(key)` returning `null` is ambiguous: does the key not exist, or is the value `null`? With a single-threaded `HashMap`, you can call `containsKey()` to disambiguate, but in a concurrent map, the state can change between `containsKey()` and `get()`, making the check-then-act pattern unreliable.

### Explain the internal working of `LinkedHashMap` and its use in LRU Caches.
`LinkedHashMap` extends `HashMap` and adds a **doubly-linked list** threading through all entries:
- Each `Entry` has `before` and `after` pointers in addition to the hash chain's `next`.
- A `head` pointer marks the eldest entry, and a `tail` pointer marks the newest.

**Insertion-order mode (default):** New entries are appended to the tail. Iteration follows head → tail.

**Access-order mode (`new LinkedHashMap<>(capacity, loadFactor, true)`):** Every `get()` or `put()` moves the accessed entry to the tail. The head always contains the **Least Recently Used** entry.

```java
// Simple LRU cache using LinkedHashMap
Map<String, String> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
        return size() > MAX_CACHE_SIZE; // Evict LRU when full
    }
};
```

> **Caveat:** This is **not thread-safe**. For production LRU caches, use `Caffeine` or `Guava Cache`, which provide concurrent access, size-based eviction, TTL, and statistics.

### Explain the internal working of `TreeMap`.
`TreeMap` stores entries in a **Red-Black Tree** (self-balancing BST):
* **No hashing:** Ordering is determined by `Comparable.compareTo()` (natural ordering) or a custom `Comparator`.
* **All operations** (`get`, `put`, `remove`) are **O(log n)** because the tree height is bounded by 2×log₂(n).
* **Null keys:** Not allowed (throws `NullPointerException` because `compareTo(null)` is undefined).
* **Range operations:** `subMap()`, `headMap()`, `tailMap()`, `firstKey()`, `lastKey()`, `floorKey()`, `ceilingKey()` — all leverage the sorted structure for O(log n) nearest-match queries.

**Red-Black Tree properties:**
1. Every node is red or black.
2. Root is always black.
3. No two consecutive red nodes on any path.
4. Every path from root to null has the same number of black nodes.
5. Rebalancing uses **rotations** (left/right) and **recoloring** after insertions/deletions to maintain O(log n) height.

---

## 6. Thread Safety & Concurrent Collections

### How to make standard collections thread-safe?
Three approaches, each with different tradeoffs:

1. **`Collections.synchronizedXxx()`** — wraps the collection, synchronizing every method on a single mutex. Simple but creates a bottleneck: all threads compete for one lock.
```java
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
// IMPORTANT: Manual sync needed for iteration!
synchronized (syncList) {
    for (String s : syncList) { /* safe */ }
}
```

2. **`CopyOnWriteArrayList` / `CopyOnWriteArraySet`** — creates a new array copy on every write. Ideal for read-heavy, write-rare scenarios (e.g., listener lists, config).

3. **`ConcurrentHashMap` / `ConcurrentLinkedQueue`** — lock-free or fine-grained locking. Best for concurrent read/write workloads.

### Which is better: `Collections.synchronizedMap()` or `ConcurrentHashMap`?
`ConcurrentHashMap` is vastly superior for production use:

| Aspect | `synchronizedMap` | `ConcurrentHashMap` |
|--------|-------------------|---------------------|
| Locking | **Entire map** per operation | **Per-node** (CAS + synchronized) |
| Read concurrency | One reader at a time | **Unlimited concurrent readers** |
| Write concurrency | One writer at a time | Multiple writers to different buckets |
| Iteration | Must manually `synchronized` | Weakly consistent, no CME |
| Null keys/values | Allowed | **Not allowed** |
| Throughput (8 threads) | ~1x baseline | ~6-8x baseline |

### Explain the internal working of `ConcurrentHashMap`.
The implementation evolved significantly between Java 7 and Java 8+:

**Pre-Java 8 (Segment locking):**
- The map was divided into 16 **Segments**, each being a mini-HashMap with its own lock.
- Concurrency level was fixed at construction: `new ConcurrentHashMap<>(initialCap, loadFactor, concurrencyLevel)`.
- At most `concurrencyLevel` threads could write simultaneously.

**Java 8+ (CAS + node-level synchronized):**
- **No more Segments.** The table is a single `Node<K,V>[]` array.
- **Reads are lock-free:** Uses `volatile` reads + `Unsafe.getObjectVolatile()` for visibility.
- **Writes:** If the bucket is empty, insert via **CAS (Compare-And-Swap)** — no lock at all. If occupied (collision), `synchronized` locks **only that single node/bucket head** — not the entire map.
- **Treeification:** Same TREEIFY_THRESHOLD=8 as HashMap.
- **`size()` is approximate:** Uses a `CounterCell[]` array (similar to `LongAdder`) to avoid a single contention point on a shared counter.

### Why doesn't `ConcurrentHashMap` allow `null` values or keys?
In a concurrent context, `map.get(key)` returning `null` is **ambiguous**: does the key not exist, or is the value explicitly `null`? In a single-threaded `HashMap`, you can disambiguate with `containsKey()`. But in `ConcurrentHashMap`, another thread might insert or remove the key between your `containsKey()` and `get()` calls — the classic **check-then-act race condition**. By prohibiting `null`, every `get()` return of `null` definitively means "key not present," eliminating the ambiguity entirely.

Doug Lea (the author) explicitly stated this design rationale: *"The main reason that nulls aren't allowed in ConcurrentMaps is that ambiguities that may be just barely tolerable in non-concurrent maps can't be accommodated."*

### What is `CopyOnWriteArrayList` and its use cases?
Every mutative operation (`add`, `set`, `remove`) creates a **fresh copy** of the entire underlying array using `Arrays.copyOf()`. The reference is then swapped atomically via `volatile`.

**Consequences:**
- **Reads are lock-free and fast:** They access the current array snapshot without synchronization.
- **Writes are expensive:** O(n) copy per mutation. For a 10,000-element list, each `add()` copies ~80 KB.
- **Iterators are snapshot-based:** They see the array state at the time of `iterator()` creation. Concurrent modifications are invisible to ongoing iterations — no `ConcurrentModificationException`.

**Use cases:** Event listener lists (rarely modified, frequently iterated), configuration lists, observer pattern subscriber lists.

**Anti-pattern:** Using COWAL for write-heavy workloads — the copy cost dominates.

### Why doesn't synchronizing `Vector` automatically make it completely safe?
`Vector` synchronizes **individual method calls**, but **compound operations** are not atomic:
```java
// NOT thread-safe! Two separate synchronized calls, not one atomic operation.
if (!vector.contains(item)) {   // Thread A checks
    vector.add(item);           // Thread B might add between these lines
}
```

Between `contains()` returning and `add()` executing, another thread can modify the vector. Similarly, iterating a `Vector` with a for-each loop is not safe without external synchronization because the iterator's `next()` and `hasNext()` are separate calls. This is why `Vector` is effectively deprecated in favor of `Collections.synchronizedList()` or `CopyOnWriteArrayList`.

---

## 7. Iterators & Comparators

### What is the difference between Fail-Fast and Fail-Safe Iterators?

| Feature | Fail-Fast | Fail-Safe |
|---------|-----------|-----------|
| Mechanism | Checks `modCount` on each `next()` | Works on a snapshot or weakly consistent view |
| Exception | Throws `ConcurrentModificationException` | Never throws CME |
| Memory | No extra memory | Extra memory for snapshot copy |
| Reflects changes | N/A (fails on change) | Does **not** reflect changes made after iterator creation |
| Examples | `ArrayList`, `HashMap`, `HashSet` | `CopyOnWriteArrayList`, `ConcurrentHashMap` |

> **Nuance:** `ConcurrentHashMap`'s iterator is technically **weakly consistent**, not fail-safe. It may reflect some (but not necessarily all) concurrent modifications. `CopyOnWriteArrayList`'s iterator is a true snapshot.

### What is the difference between `Comparable` and `Comparator`?
* **`Comparable<T>`** — The class itself implements `compareTo(T other)`. This defines the **natural ordering** — one default sort strategy baked into the class.
```java
public class Employee implements Comparable<Employee> {
    @Override
    public int compareTo(Employee other) {
        return Integer.compare(this.id, other.id); // Natural order by ID
    }
}
```

* **`Comparator<T>`** — An external functional interface with `compare(T a, T b)`. Enables **multiple, pluggable sort strategies** without modifying the original class.
```java
// Sort by name, then by salary descending
Comparator<Employee> bySalaryDesc = Comparator
    .comparing(Employee::getName)
    .thenComparing(Employee::getSalary, Comparator.reverseOrder());

employees.sort(bySalaryDesc);
```

> **Rule of thumb:** Use `Comparable` for the single most obvious ordering (e.g., numbers by magnitude, strings lexicographically). Use `Comparator` for any alternative ordering or when you don't control the class source code.

---

## 8. Queue, Deque, and Legacy Classes

### Explain PriorityQueue, Deque, ArrayDeque, and Stack.

**PriorityQueue:**
- Backed by a **binary min-heap** (array-based). The smallest element (or highest-priority per `Comparator`) is always at index 0.
- `offer()` and `poll()` are O(log n) due to heap sift-up/sift-down operations.
- `peek()` is O(1) — just return `array[0]`.
- **Not thread-safe.** Use `PriorityBlockingQueue` for concurrent scenarios.
- Use cases: Task schedulers, Dijkstra's shortest path, event-driven simulations, median finding (two heaps pattern).

**Deque (interface):**
- Double-ended queue: insert and remove from both head and tail.
- Methods: `addFirst()`, `addLast()`, `removeFirst()`, `removeLast()`, `peekFirst()`, `peekLast()`.
- Can be used as both a **Stack** (LIFO: `push`/`pop` = `addFirst`/`removeFirst`) and a **Queue** (FIFO: `addLast`/`removeFirst`).

**ArrayDeque:**
- Backed by a **circular resizable array**. Head and tail wrap around the array using modulo arithmetic.
- All operations at both ends are **amortized O(1)**.
- **3× faster than `LinkedList`** as a Deque (no node allocation, cache-friendly).
- **No null elements** allowed (null is used as a sentinel internally).
- **Not thread-safe.** Use `ConcurrentLinkedDeque` or `LinkedBlockingDeque` for concurrency.

**Stack (legacy):**
- Extends `Vector` — fully synchronized, which makes it unnecessarily slow for single-threaded use.
- **Deprecated in practice.** Use `ArrayDeque` as a stack instead.
```java
// Modern stack usage
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);    // addFirst
stack.pop();      // removeFirst
stack.peek();     // peekFirst
```