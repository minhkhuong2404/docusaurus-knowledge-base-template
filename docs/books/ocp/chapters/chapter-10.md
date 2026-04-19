---
id: chapter-10
title: "Chapter 10 — Streams"
sidebar_label: "Ch 10 · Streams"
description: "Complete guide to Java Stream pipelines: creating streams, intermediate vs terminal operations, Optional, Collectors (groupingBy, partitioningBy, joining, teeing), primitive streams, flatMap, lazy evaluation, and parallel streams with thread-safety warnings."
tags:
  - streams
  - optional
  - collectors
  - flatmap
  - groupingby
  - parallel-streams
  - lazy-evaluation
  - functional-programming
---

# Chapter 10 — Streams

<span class="chapter-badge">Exam Domain: Working with Streams and Lambda Expressions</span>

> **Key Topics:** `Stream` pipeline, `Optional`, intermediate vs terminal operations, `Collectors`, primitive streams, parallel streams.

---

## 🟦 New Learner: Stream Pipelines

### What is a Stream?

A `Stream` is a **sequence of elements** supporting aggregate operations. Streams are:
- **Lazy** — intermediate operations don't execute until a terminal operation is called
- **Single-use** — once consumed, a stream cannot be reused
- **Non-mutating** — don't modify the underlying data source

```
Source → [Intermediate ops...] → Terminal op
```

---

### Creating Streams

```java
// From collection
List<String> list = List.of("a", "b", "c");
Stream<String> s1 = list.stream();

// From array
Stream<String> s2 = Arrays.stream(new String[]{"x", "y"});

// From values
Stream<Integer> s3 = Stream.of(1, 2, 3, 4, 5);

// Empty stream
Stream<Object> empty = Stream.empty();

// Infinite streams
Stream<Integer> infinite = Stream.iterate(0, n -> n + 1);
Stream<Double> randoms = Stream.generate(Math::random);
```

---

### Intermediate Operations (return Stream — lazy)

```java
Stream.of("banana", "apple", "cherry", "apricot")
    .filter(s -> s.startsWith("a"))     // keep elements matching predicate
    .map(String::toUpperCase)            // transform each element
    .sorted()                            // sort
    .distinct()                          // remove duplicates
    .limit(3)                            // max 3 elements
    .skip(1)                             // skip first element
    .peek(s -> System.out.println(s));   // debug; don't use for side effects
```

---

### Terminal Operations (consume stream — trigger execution)

```java
List<String> words = List.of("Java", "is", "fun");

// Count
long count = words.stream().count(); // 3

// Collect to list
List<String> upper = words.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList()); // or .toList() (Java 16+)

// Reduce
Optional<String> joined = words.stream()
    .reduce((a, b) -> a + " " + b); // "Java is fun"

int sum = IntStream.rangeClosed(1, 10).sum(); // 55

// Find
Optional<String> first = words.stream().filter(s -> s.length() > 2).findFirst();
Optional<String> any   = words.stream().filter(s -> s.length() > 2).findAny();

// Match
boolean any = words.stream().anyMatch(s -> s.equals("Java"));
boolean all = words.stream().allMatch(s -> s.length() > 1);
boolean none = words.stream().noneMatch(String::isEmpty);

// Min/Max
Optional<String> longest = words.stream().max(Comparator.comparingInt(String::length));

// forEach (terminal — no return)
words.stream().forEach(System.out::println);
```

---

### Optional

`Optional<T>` is a container that may or may not hold a value — avoids `null` returns:

```java
Optional<String> opt = Optional.of("Hello");
Optional<String> empty = Optional.empty();
Optional<String> nullable = Optional.ofNullable(null); // empty

opt.isPresent();          // true
opt.isEmpty();            // false
opt.get();                // "Hello" (throws if empty!)
opt.orElse("default");    // "Hello" (returns value or default)
opt.orElseGet(() -> computeDefault()); // lazy default
opt.orElseThrow();        // throws NoSuchElementException if empty

// Transformations (like stream operations)
opt.map(String::length);       // Optional<Integer> with 5
opt.filter(s -> s.length() > 3); // Optional<String> present or empty
opt.flatMap(s -> findUser(s));  // avoid Optional<Optional<T>>

// ifPresent
opt.ifPresent(s -> System.out.println(s)); // runs only if present
```

---

### Collectors

```java
List<String> words = List.of("apple", "banana", "avocado", "blueberry", "apricot");

// Basic
Collectors.toList()
Collectors.toSet()
Collectors.toUnmodifiableList()

// Joining
String joined = words.stream().collect(Collectors.joining(", ", "[", "]"));
// "[apple, banana, avocado, blueberry, apricot]"

// Counting
long count = words.stream().collect(Collectors.counting());

// Grouping
Map<Character, List<String>> byFirstLetter = words.stream()
    .collect(Collectors.groupingBy(s -> s.charAt(0)));
// {a=[apple, avocado, apricot], b=[banana, blueberry]}

// Partitioning (always two groups: true and false)
Map<Boolean, List<String>> partitioned = words.stream()
    .collect(Collectors.partitioningBy(s -> s.length() > 5));

// Downstream collectors
Map<Character, Long> countByLetter = words.stream()
    .collect(Collectors.groupingBy(s -> s.charAt(0), Collectors.counting()));
```

---

### Primitive Streams

Avoid boxing with specialized streams: `IntStream`, `LongStream`, `DoubleStream`:

```java
IntStream.range(1, 5);        // 1, 2, 3, 4 (exclusive end)
IntStream.rangeClosed(1, 5);  // 1, 2, 3, 4, 5 (inclusive end)

IntStream nums = IntStream.of(1, 2, 3, 4, 5);
nums.sum();      // 15
nums.average();  // OptionalDouble with 3.0
nums.min();      // OptionalInt with 1
nums.max();      // OptionalInt with 5
nums.summaryStatistics(); // count, sum, min, max, average

// Convert to object stream
Stream<Integer> boxed = IntStream.range(1,5).boxed();

// mapToInt / mapToObj
Stream<String> words = Stream.of("hi", "hello");
IntStream lengths = words.mapToInt(String::length);
```

---

## 🟣 Senior Deep Dive

### Lazy Evaluation

```java
Stream.iterate(0, n -> n + 1)     // infinite!
    .filter(n -> n % 2 == 0)
    .limit(5)                      // stops at 5 results
    .forEach(System.out::println); // 0, 2, 4, 6, 8
// Without limit(), this would run forever
```

Intermediate ops build a **pipeline spec**; execution only starts at the terminal op.

### `flatMap`

`flatMap` flattens a stream-of-streams into a single stream:

```java
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4), List.of(5));
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList()); // [1, 2, 3, 4, 5]

// Common use: split string into words
List<String> sentences = List.of("Hello World", "Java Streams");
List<String> words = sentences.stream()
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .collect(Collectors.toList()); // [Hello, World, Java, Streams]
```

### Parallel Streams

```java
List<Integer> nums = List.of(1,2,3,4,5,6,7,8,9,10);

int sum = nums.parallelStream()
    .filter(n -> n % 2 == 0)
    .mapToInt(Integer::intValue)
    .sum(); // Parallel, but same result for associative ops

// Order is NOT guaranteed with parallel streams
nums.parallelStream().forEach(System.out::println); // random order
nums.parallelStream().forEachOrdered(System.out::println); // preserves order, but slower
```

:::caution[Parallel Stream Pitfalls]
- Shared mutable state → race conditions
- Small data sets → overhead may be worse than sequential
- `forEach` loses ordering → use `forEachOrdered` if order matters
:::

### `Collectors.teeing` (Java 12+)

```java
// Collect into two collectors simultaneously, merge results
var result = Stream.of(1,2,3,4,5)
    .collect(Collectors.teeing(
        Collectors.summingInt(Integer::intValue),  // sum = 15
        Collectors.counting(),                      // count = 5
        (sum, count) -> sum + "/" + count           // merge: "15/5"
    ));
```

---

## 📝 Exam Quick Reference

| Operation | Type | Short-circuits? | Returns |
|-----------|------|-----------------|---------|
| `filter` | Intermediate | No | `Stream<T>` |
| `map` | Intermediate | No | `Stream<R>` |
| `flatMap` | Intermediate | No | `Stream<R>` |
| `sorted` | Intermediate | No | `Stream<T>` |
| `distinct` | Intermediate | No | `Stream<T>` |
| `limit` | Intermediate | **Yes** | `Stream<T>` |
| `skip` | Intermediate | No | `Stream<T>` |
| `peek` | Intermediate | No | `Stream<T>` |
| `forEach` | Terminal | No | `void` |
| `collect` | Terminal | No | varies |
| `count` | Terminal | No | `long` |
| `reduce` | Terminal | No | `Optional<T>` or `T` |
| `findFirst`/`findAny` | Terminal | **Yes** | `Optional<T>` |
| `anyMatch`/`allMatch`/`noneMatch` | Terminal | **Yes** | `boolean` |
| `min`/`max` | Terminal | No | `Optional<T>` |

| Topic | Key Fact |
|-------|----------|
| Streams are single-use | `IllegalStateException` if terminal op called twice |
| Lazy evaluation | Intermediate ops don't run until terminal op is called |
| `Optional.get()` | Throws `NoSuchElementException` if empty — use `orElse` |
| `Stream.generate()` | Infinite — always pair with `limit()` |
| `IntStream.range(a,b)` | Exclusive end; `rangeClosed(a,b)` is inclusive |
| `noneMatch` on empty | Returns `true` (vacuously true) |
| `allMatch` on empty | Returns `true` (vacuously true) |
| `findAny` | May return any element; useful in parallel streams |
| `peek` | For debugging only — side effects in pipelines are bad practice |
| `Collectors.groupingBy` | `Map<K, List<T>>` by default; overload with downstream collector |
| `Collectors.partitioningBy` | `Map<Boolean, List<T>>` — always two buckets (true/false) |
| `Collectors.mapping` | Adapts elements before downstream collector |
| `Collectors.flatMapping` | Like `mapping` but flattens nested streams |
| `Collectors.joining` | Concatenate `CharSequence` with optional delimiter/prefix/suffix |
| `Stream.toList()` (16+) | Unmodifiable `List`; unlike `collect(toList())` which is mutable `ArrayList` |
| `Optional.orElseGet` | Supplier evaluated only if empty — prefer over `orElse` for expensive defaults |
| `Optional.ifPresentOrElse` | Java 9+ — consumer for present, runnable for empty |
| `Stream.concat` | Lazy concatenation of two streams — order: first stream then second |
| `distinct()` | Uses `equals()` / `hashCode()` of stream elements (stateful) |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 10]
**Trap 1 — Stream reuse:**
```java
Stream<String> s = Stream.of("a", "b", "c");
s.forEach(System.out::println); // ✅ first terminal op
s.count(); // ❌ IllegalStateException: stream has already been operated upon or closed
```

**Trap 2 — `Optional.get()` on empty Optional:**
```java
Optional<String> empty = Optional.empty();
empty.get();        // ❌ NoSuchElementException
empty.orElse("hi"); // ✅ returns "hi"
empty.orElseThrow(); // ❌ NoSuchElementException (same as get())
// Prefer: orElse(), orElseGet(), ifPresent(), or isPresent() guard
```

**Trap 3 — `peek` is NOT guaranteed to run:**
```java
// peek is an intermediate op — lazy — only runs if terminal op demands elements
Stream.of(1, 2, 3)
    .peek(System.out::println) // may NOT run all elements if limit/short-circuit
    .filter(n -> n > 5)
    .findFirst(); // returns empty Optional — peek ran 1,2,3 but no match
```

**Trap 4 — `noneMatch`/`allMatch` on empty streams:**
```java
Stream<String> empty = Stream.empty();
empty.allMatch(s -> s.length() > 5);  // true (vacuously)
empty.noneMatch(s -> s.length() > 5); // true (vacuously)
empty.anyMatch(s -> s.length() > 5);  // false (no element matches)
```

**Trap 5 — `IntStream.range` vs `rangeClosed`:**
```java
IntStream.range(1, 5).sum();       // 1+2+3+4 = 10  (5 excluded)
IntStream.rangeClosed(1, 5).sum(); // 1+2+3+4+5 = 15 (5 included)
```

**Trap 6 — `reduce` with no identity returns Optional:**
```java
Optional<Integer> result = Stream.of(1,2,3).reduce((a,b) -> a + b); // Optional[6]
int result2 = Stream.of(1,2,3).reduce(0, (a,b) -> a + b); // 6 (identity provided → no Optional)
int empty = Stream.<Integer>empty().reduce(0, Integer::sum); // 0 (identity returned for empty)
```

**Trap 7 — Parallel stream ordering:**
```java
List<Integer> list = List.of(1,2,3,4,5);
list.parallelStream().forEach(System.out::println);        // unordered output!
list.parallelStream().forEachOrdered(System.out::println); // ordered, but slower
// collect() with Collectors.toList() IS order-preserving even with parallel
```

**Trap 8 — Infinite stream without limit:**
```java
Stream.iterate(0, n -> n + 1).forEach(System.out::println); // ❌ runs forever!
Stream.iterate(0, n -> n + 1).limit(5).forEach(System.out::println); // ✅ prints 0-4
```

**Trap 9 — `Collectors.toMap` duplicate keys:**
```java
Stream.of("a","b","a").collect(Collectors.toMap(s -> s, s -> s)); // ❌ IllegalStateException duplicate key
// Fix: merge function — (a,b) -> a
```

**Trap 10 — `Optional` of nullable:**
```java
Optional.of(null); // ❌ NPE — use Optional.ofNullable(null)
```

**Trap 11 — `flatMap` on Optional:**
```java
Optional<String> o = Optional.of("42");
Optional<Integer> i = o.flatMap(s -> {
    try { return Optional.of(Integer.parseInt(s)); }
    catch (NumberFormatException e) { return Optional.empty(); }
});
```

**Trap 12 — `sorted()` without Comparator on non-Comparable:**
```java
class Foo {}
Stream.of(new Foo(), new Foo()).sorted(); // ❌ compile error — Foo not Comparable
```
:::

### Exam vignettes

```java
// Vignette 1 — groupingBy with counting
Map<Integer, Long> m = Stream.of("a", "bb", "ccc")
    .collect(Collectors.groupingBy(String::length, Collectors.counting()));

// Vignette 2 — empty stream anyMatch
boolean b = Stream.<String>empty().anyMatch(s -> true); // false
```

:::tip[Spring/Senior Relevance]
- Spring Data's derived query methods return `Stream<T>` when annotated with `@QueryHints` and `@Query` — must close the stream or use try-with-resources to release the database cursor.
- Project Reactor (`Flux`/`Mono`) mirrors Stream operators (`map`, `flatMap`, `filter`, `reduce`) — mastering Stream pipelines is the direct foundation for reactive Spring WebFlux programming.
- `Collectors.groupingBy` is the Java equivalent of SQL `GROUP BY` and is commonly used in Spring service layers to aggregate data returned from repository queries before sending to the client.
:::

---

## 🔗 Review Questions Focus

1. What happens if you call a terminal operation on a stream twice?
2. What is the difference between `findFirst()` and `findAny()`?
3. What does `Collectors.groupingBy()` return?
4. When should you use `IntStream` vs `Stream<Integer>`?
5. What is the risk of using parallel streams with mutable shared state?
6. What does `allMatch()` return on an empty stream?
7. What is the difference between `Stream.iterate()` and `Stream.generate()`?
8. What is the difference between `reduce(identity, accumulator)` and `reduce(accumulator)`?
9. What type does `Collectors.partitioningBy()` return?
10. Why is `peek()` discouraged for side effects in production code?
