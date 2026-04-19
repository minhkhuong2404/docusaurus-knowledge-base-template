---
id: chapter-09
title: "Chapter 9 — Collections & Generics"
sidebar_label: "Ch 9 · Collections & Generics"
description: "Thorough guide to Java Collections Framework: List, Set, Map, Queue, Deque — including ordering, null handling, thread safety, Comparable vs Comparator, generics wildcards (PECS), and Java 21's SequencedCollection."
tags:
  - collections
  - list
  - set
  - map
  - deque
  - generics
  - comparable
  - comparator
  - wildcards
  - sequenced-collection
---

# Chapter 9 — Collections & Generics

<span class="chapter-badge">Exam Domain: Working with Arrays and Collections</span>

> **Key Topics:** `List`, `Set`, `Map`, `Deque`, `Queue`, `Comparable`, `Comparator`, generics, wildcards, `SequencedCollection`.

---

## 🟦 New Learner: The Collections Framework

### Java Collections Hierarchy

```
Iterable
  └── Collection
        ├── List (ordered, allows duplicates)
        │     ├── ArrayList
        │     └── LinkedList
        ├── Set (no duplicates)
        │     ├── HashSet (no order)
        │     ├── LinkedHashSet (insertion order)
        │     └── TreeSet (sorted)
        └── Queue / Deque
              ├── LinkedList
              └── ArrayDeque
Map (key-value pairs, separate hierarchy)
  ├── HashMap
  ├── LinkedHashMap
  └── TreeMap
```

---

### List

```java
// Factory methods (immutable)
List<String> immutable = List.of("a", "b", "c");
List<String> copyOf = List.copyOf(existingList);

// Mutable
List<String> list = new ArrayList<>();
list.add("Alice");
list.add("Bob");
list.add(0, "Zoe");        // insert at index 0
list.remove("Bob");        // by value
list.remove(0);            // by index
list.set(0, "Charlie");    // replace

list.get(0);               // access by index
list.size();
list.contains("Alice");
list.indexOf("Alice");     // -1 if not found
```

---

### Set

```java
Set<String> hashSet = new HashSet<>(List.of("c", "a", "b")); // no order
Set<String> linked = new LinkedHashSet<>(List.of("c", "a", "b")); // [c, a, b]
Set<String> tree = new TreeSet<>(List.of("c", "a", "b")); // [a, b, c] sorted

hashSet.add("d");
hashSet.remove("a");
hashSet.contains("b"); // true
// No index access — sets have no guaranteed order
```

---

### Map

```java
Map<String, Integer> map = new HashMap<>();
map.put("Alice", 90);
map.put("Bob", 85);
map.put("Alice", 95);  // replaces old value

map.get("Alice");       // 95
map.getOrDefault("Carol", 0); // 0 (key absent)
map.containsKey("Bob"); // true
map.containsValue(85);  // true
map.remove("Bob");
map.size();             // 1

// Iteration
map.forEach((k, v) -> System.out.println(k + ": " + v));
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + "=" + entry.getValue());
}

// Compute methods
map.putIfAbsent("Carol", 70);
map.computeIfAbsent("Dave", k -> k.length()); // 4
map.merge("Alice", 5, Integer::sum); // Alice: 95+5 = 100
```

---

### Queue and Deque

```java
// Queue — FIFO
Queue<String> queue = new LinkedList<>();
queue.offer("first");  // add to tail (returns false if full, safe)
queue.peek();          // view head (null if empty)
queue.poll();          // remove head (null if empty)

// Deque — Double-Ended Queue (also a Stack)
Deque<String> deque = new ArrayDeque<>();
deque.offerFirst("a"); // add to front
deque.offerLast("b");  // add to back
deque.peekFirst();     // view front
deque.pollLast();      // remove from back

// As Stack (LIFO)
deque.push("x");   // = addFirst
deque.pop();       // = removeFirst
deque.peek();      // = peekFirst
```

:::tip[Prefer `ArrayDeque` over `Stack`]
`Stack` is a legacy class synchronized on every operation. `ArrayDeque` is faster and the preferred choice.
:::

---

### Sorting: Comparable and Comparator

```java
// Comparable — natural ordering (implement in the class)
public class Student implements Comparable<Student> {
    String name; int gpa;
    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.gpa, other.gpa); // ascending GPA
    }
}

// Comparator — external ordering (use for multiple orderings)
Comparator<Student> byName = Comparator.comparing(s -> s.name);
Comparator<Student> byGpaDesc = Comparator.comparingInt((Student s) -> s.gpa).reversed();
Comparator<Student> byNameThenGpa = Comparator.comparing(Student::getName)
    .thenComparingInt(Student::getGpa);

List<Student> students = ...;
Collections.sort(students);                   // uses Comparable
students.sort(byName);                        // uses Comparator
students.sort(Comparator.naturalOrder());
students.sort(Comparator.reverseOrder());
```

---

### Generics and Wildcards

```java
// Bounded wildcards
List<? extends Number> upper = List.of(1, 2, 3); // read-only: producer
List<? super Integer> lower = new ArrayList<Number>(); // write: consumer

// PECS: Producer Extends, Consumer Super
void copy(List<? extends Number> src, List<? super Number> dst) {
    for (Number n : src) dst.add(n);
}
```

---

## 🟣 Senior Deep Dive

### `SequencedCollection` (Java 21)

New interface giving uniform access to first/last elements:

```java
SequencedCollection<String> seq = new ArrayList<>(List.of("a","b","c"));
seq.getFirst(); // "a"
seq.getLast();  // "c"
seq.addFirst("z"); // ["z","a","b","c"]
seq.reversed(); // reversed view
```

`List`, `Deque`, `LinkedHashSet` all implement `SequencedCollection`.

### Fail-Fast vs Fail-Safe Iterators

```java
List<String> list = new ArrayList<>(List.of("a","b","c"));
for (String s : list) {
    if (s.equals("b")) list.remove(s); // ❌ ConcurrentModificationException!
}

// Fix 1: Iterator.remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) it.remove(); // ✅
}

// Fix 2: removeIf (Java 8+)
list.removeIf(s -> s.equals("b")); // ✅
```

---

## 📝 Exam Quick Reference

| Collection | Order | Duplicates | Null key/value | Thread-Safe |
|-----------|-------|-----------|----------------|-------------|
| `ArrayList` | Insertion | Yes | Yes | No |
| `LinkedHashSet` | Insertion | No | One null | No |
| `TreeSet` | Sorted | No | No (needs Comparable) | No |
| `HashMap` | None | Keys: No | One null key | No |
| `TreeMap` | Sorted | Keys: No | No null key | No |
| `ArrayDeque` | FIFO/LIFO | Yes | No nulls | No |
| `ConcurrentHashMap` | None | Keys: No | No nulls | **Yes** |

| Topic | Key Fact |
|-------|----------|
| `List.of()` | **Immutable** — `add`/`remove`/`set` all throw `UnsupportedOperationException` |
| `Collections.unmodifiableList()` | View-only wrapper; original list can still be mutated |
| `poll()` vs `remove()` | `poll()` returns `null` if empty; `remove()` throws `NoSuchElementException` |
| `offer()` vs `add()` | `offer()` returns `false` if capacity exceeded; `add()` throws |
| `Comparator.comparing()` | Takes a key extractor; can chain with `.thenComparing()` |
| `compareTo` return | Negative = this before other; 0 = equal; positive = this after |
| PECS | **P**roducer **E**xtends (read), **C**onsumer **S**uper (write) |
| `TreeSet`/`TreeMap` null | `NullPointerException` on first element; no nulls permitted |
| `Map.getOrDefault()` | Never throws; returns default if key absent |
| `Map.computeIfAbsent()` | Inserts and returns new value if key absent |
| `SequencedCollection` (21) | `getFirst()` / `getLast()` / `reversed()` view; `List`, `Deque`, `LinkedHashSet` |
| `SequencedSet` (21) | `SortedSet` extends `SequencedSet`; `reversed()` returns reverse-order view |
| `SequencedMap` (21) | `firstEntry()` / `lastEntry()` / `reversed()`; `LinkedHashMap`, `TreeMap` |
| `Comparator.nullsFirst` / `nullsLast` | Wrap comparator to allow or order null elements safely |
| `Collections.binarySearch` | List must be sorted by natural order or comparator used |
| `Set.copyOf` / `Map.copyOf` | Immutable copies; null elements/keys/values forbidden |
| `Arrays.asList` | Fixed-size list backed by array; `set` OK, `add` throws |
| Generic array creation | `new T[]` illegal; use varargs warnings with generic arrays |
| `Comparable<T>` vs `Comparator` | Natural order vs external ordering; `TreeSet` uses `Comparable` unless ctor given `Comparator` |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 9]
**Trap 1 — `List.of()` vs `new ArrayList()`:**
```java
List<String> immutable = List.of("a", "b");
immutable.add("c");    // ❌ UnsupportedOperationException
immutable.set(0, "x"); // ❌ UnsupportedOperationException
// Even immutable.contains() works — only structural modification throws

List<String> mutable = new ArrayList<>(List.of("a", "b"));
mutable.add("c"); // ✅
```

**Trap 2 — `list.remove(int)` vs `list.remove(Object)` on `List<Integer>`:**
```java
List<Integer> nums = new ArrayList<>(List.of(1, 2, 3));
nums.remove(1);                // removes by INDEX 1 → [1, 3]
nums.remove(Integer.valueOf(1)); // removes by VALUE 1 → [2, 3]
// Autoboxing does NOT apply to remove(int) — the int version wins!
```

**Trap 3 — `TreeSet` requires Comparable (or Comparator):**
```java
TreeSet<String> ts = new TreeSet<>();
ts.add("b"); ts.add("a"); // ✅ String implements Comparable
System.out.println(ts); // [a, b] — sorted!

class Foo {} // does NOT implement Comparable
TreeSet<Foo> bad = new TreeSet<>();
bad.add(new Foo()); // ❌ ClassCastException at runtime
```

**Trap 4 — `Map.merge()` behavior:**
```java
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 10);
scores.merge("Alice", 5, Integer::sum); // key exists → merge: 10+5=15
scores.merge("Bob",   5, Integer::sum); // key absent → insert: 5
// If merging function returns null, the key is REMOVED
scores.merge("Alice", 0, (old, v) -> null); // removes "Alice"!
```

**Trap 5 — `ArrayDeque` does NOT allow nulls:**
```java
Deque<String> d = new ArrayDeque<>();
d.push(null); // ❌ NullPointerException
// LinkedList allows nulls but is slower and uses more memory
```

**Trap 6 — `compareTo` with subtraction overflow:**
```java
// WRONG — can overflow with large negatives and positives:
public int compareTo(MyObj o) { return this.id - o.id; } // ❌

// CORRECT — use Integer.compare():
public int compareTo(MyObj o) { return Integer.compare(this.id, o.id); } // ✅
```

**Trap 7 — Upper-bounded wildcard prevents adding:**
```java
List<? extends Number> nums = new ArrayList<Integer>();
nums.add(1);   // ❌ COMPILE ERROR — can't add to ? extends
nums.add(null); // ✅ null is always OK (but bad practice)

Number n = nums.get(0); // ✅ reading is fine
```

**Trap 8 — `ConcurrentModificationException` in for-each:**
```java
List<String> list = new ArrayList<>(List.of("a","b","c"));
for (String s : list) {
    if (s.equals("b")) list.remove(s); // ❌ ConcurrentModificationException
}
// Fix: use removeIf()
list.removeIf(s -> s.equals("b")); // ✅
```

**Trap 9 — `Set.of()` duplicate elements:**
```java
Set.of("a", "a"); // ❌ IllegalArgumentException — duplicates not allowed
```

**Trap 10 — `Map.of()` more than 10 pairs — use entries overload:**
```java
// Map.of() overloads cap at 10 key-value pairs; for more, use Map.ofEntries(entry(...), ...)
```

**Trap 11 — `subList` is a view:**
```java
List<Integer> full = new ArrayList<>(List.of(1,2,3,4));
List<Integer> part = full.subList(1, 3); // view of indices [1,2]
full.add(5); // ❌ ConcurrentModificationException on subsequent use of part
```

**Trap 12 — `PriorityQueue` iterator is not priority order:**
```java
PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(3,1,2));
pq.iterator().forEachRemaining(System.out::print); // NOT guaranteed sorted — use poll() for order
```
:::

### Exam vignettes

```java
// Vignette 1 — SequencedCollection (Java 21)
SequencedCollection<String> sc = new LinkedList<>(List.of("a","b"));
sc.getFirst(); sc.getLast(); sc.reversed();

// Vignette 2 — Wildcard capture
void foo(List<?> list) {
    list.add(null); // only null allowed for unknown type
}
```

:::tip[Spring/Senior Relevance]
- `Map.computeIfAbsent()` is the idiomatic way to implement cache-aside patterns in Spring service methods without introducing race conditions on `HashMap`.
- `LinkedHashMap` with `accessOrder=true` (LRU mode) is commonly used to implement Spring's in-memory caches before pulling in Caffeine or Redis.
- The `List.of()` immutability trap causes runtime failures when Spring auto-wires a list from a `@Bean` returning `List.of(...)` and downstream code tries to add to it — always use `new ArrayList<>(List.of(...))` for mutable beans.
:::

---

## 🔗 Review Questions Focus

1. What is the difference between `poll()` and `remove()` on a Queue?
2. What does `Map.merge()` do when the key already exists?
3. When should you use `? extends T` vs `? super T`?
4. Which collection maintains insertion order and prevents duplicates?
5. What method does `Comparable` require implementing?
6. What does `list.remove(1)` do on a `List<Integer>`?
7. Can `TreeSet` store `null` elements?
8. What does `Map.put()` return when the key already exists?
9. Why should you avoid subtraction in `compareTo()`?
10. What is the difference between `List.of()` and `Collections.unmodifiableList()`?
