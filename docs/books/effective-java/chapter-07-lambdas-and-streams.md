---
id: chapter-07-lambdas-and-streams
title: "Chapter 7: Lambdas and Streams"
sidebar_label: "7. Lambdas and Streams"
---

# Chapter 7: Lambdas and Streams

Java 8 added lambda expressions, method references, and the Streams API. This chapter covers best practices for using these powerful new facilities.

---

## Item 42: Prefer Lambdas to Anonymous Classes

Historically, function objects were created using anonymous classes. In Java 8, **lambda expressions** make it much more concise:

```java
// Old way: anonymous class
Collections.sort(words, new Comparator<String>() {
    public int compare(String s1, String s2) {
        return Integer.compare(s1.length(), s2.length());
    }
});

// Lambda — much more concise
Collections.sort(words, (s1, s2) -> Integer.compare(s1.length(), s2.length()));

// Even more concise: Comparator construction method + method reference
Collections.sort(words, Comparator.comparingInt(String::length));

// Even more concise: List.sort
words.sort(Comparator.comparingInt(String::length));
```

Type inference lets you **omit parameter types**. Add them back only when it makes the code clearer or when the compiler can't infer them.

**Lambdas are ideal for representing function objects** — small functions passed to higher-order operations. Prefer lambdas to anonymous classes except:
- When you need to create an instance of an abstract class (lambdas only work for functional interfaces)
- When the lambda body is complex or spans many lines
- When you need a non-trivial `this` reference (in a lambda, `this` refers to the enclosing instance, not the lambda)

---

## Item 43: Prefer Method References to Lambdas

Method references are usually even more concise than lambdas. Prefer them when they are shorter and clearer:

```java
// Lambda
map.merge(key, 1, (count, incr) -> count + incr);

// Method reference — cleaner
map.merge(key, 1, Integer::sum);
```

There are five kinds of method references:

| Type | Example | Lambda Equivalent |
|---|---|---|
| Static | `Integer::parseInt` | `str -> Integer.parseInt(str)` |
| Bound instance | `Instant.now()::isAfter` | `t -> Instant.now().isAfter(t)` |
| Unbound instance | `String::toLowerCase` | `str -> str.toLowerCase()` |
| Bound constructor | `TreeMap<K,V>::new` | `() -> new TreeMap<K,V>()` |
| Array constructor | `int[]::new` | `len -> new int[len]` |

Sometimes a lambda is clearer than a method reference — especially when the method is in the same class and the name is not shorter than the lambda:

```java
// Method reference — longer!
service.execute(GoshThisClassNameIsHumongous::action);

// Lambda — clearer
service.execute(() -> action());
```

---

## Item 44: Favor the Use of Standard Functional Interfaces

The `java.util.function` package provides 43 functional interfaces. If a standard one fits, use it — it reduces the total number of concepts developers need to learn.

### The Six Core Interfaces

| Interface | Method | Example |
|---|---|---|
| `UnaryOperator<T>` | `T apply(T t)` | `String::toLowerCase` |
| `BinaryOperator<T>` | `T apply(T t1, T t2)` | `BigInteger::add` |
| `Predicate<T>` | `boolean test(T t)` | `Collection::isEmpty` |
| `Function<T,R>` | `R apply(T t)` | `Arrays::asList` |
| `Supplier<T>` | `T get()` | `Instant::now` |
| `Consumer<T>` | `void accept(T t)` | `System.out::println` |

There are also variants for primitive types: `IntPredicate`, `LongBinaryOperator`, `IntFunction<R>`, `ToLongFunction<T>`, `LongToIntFunction`, etc. **Use primitive functional interfaces for performance** — they avoid costly autoboxing.

### When to Write Your Own

Write your own functional interface only when:
- None of the standard ones will do the job
- It will be broadly used and could benefit from a descriptive name
- It has a strong contract associated with it
- It would benefit from custom default methods

When writing your own, annotate it with `@FunctionalInterface` (same benefits as `@Override`).

---

## Item 45: Use Streams Judiciously

The streams API was added in Java 8 to process sequences of data elements. Don't overuse it — some tasks are best expressed with streams, others with iteration.

### When Streams Are a Good Fit

```java
// Counting anagram groups with >= minGroupSize members
words.collect(groupingBy(word -> alphabetize(word)))
     .values().stream()
     .filter(group -> group.size() >= minGroupSize)
     .map(group -> group.size() + ": " + group)
     .forEach(System.out::println);
```

Good uses:
- Uniformly transform sequences of elements
- Filter sequences
- Combine elements using a single operation (adding, min, max, concatenating)
- Accumulate into a collection (grouping, partitioning)
- Search for an element satisfying a criterion

### When Streams Are a Poor Fit

- Accessing the enclosing scope (lambdas can't read/modify local variables)
- Code using `break`, `continue`, or `return` in a loop body
- Code that throws checked exceptions
- When you need access to the current element **and** the previous element

### The "char" Problem

Do not process `char` values using streams. `"Hello World".chars()` returns an `IntStream`, not a `Stream<Character>`. Processing chars with streams is difficult and error-prone.

---

## Item 46: Prefer Side-Effect-Free Functions in Streams

The stream paradigm is based on **functional programming**. Functions passed to stream operations should be **pure** — they produce only their results and have no side effects.

```java
// BAD: forEach with side effects (modifying external state)
Map<String, Long> freq = new HashMap<>();
words.forEach(word -> freq.merge(word.toLowerCase(), 1L, Long::sum)); // side effect

// GOOD: use collect with groupingBy/counting
Map<String, Long> freq =
    words.collect(groupingBy(String::toLowerCase, counting()));
```

**`forEach` should only be used to report results, never to perform computation.** It is the least powerful of the terminal operations.

### The Collectors API

Collectors produce collection results:

```java
// Most common: toList, toSet, toCollection
List<String> topTen = freq.entrySet().stream()
    .sorted(comparing(Map.Entry<String, Long>::getValue).reversed())
    .limit(10)
    .map(Map.Entry::getKey)
    .collect(toList());

// toMap — watch for key collisions!
Map<String, Operation> stringToEnum =
    Stream.of(values()).collect(toMap(Object::toString, e -> e));

// toMap with merge function (handles duplicates)
Map<Artist, Album> topHits = albums.collect(
    toMap(Album::artist, a -> a, maxBy(comparing(Album::sales))));

// groupingBy
Map<String, List<String>> phoneBook =
    people.collect(groupingBy(Person::areaCode, mapping(Person::name, toList())));

// joining (for strings)
String result = words.collect(joining(", ", "[", "]")); // "[a, b, c]"
```

---

## Item 47: Prefer Collection to Stream as a Return Type

A `Stream` is not a `Collection` — it does not implement the `Iterable` interface. Returning a `Stream` from a method forces callers who want iteration to do awkward things.

```java
// Awkward: iterating over a Stream from a method
for (ProcessHandle ph : (Iterable<ProcessHandle>) ProcessHandle.allProcesses()::iterator) { }
```

**If the caller wants either a Stream or an Iterable, return a `Collection`.** `Collection` has a `stream()` method and is `Iterable`, satisfying both needs.

- If the collection already exists in memory: return it directly (`List`, `Set`)
- If the sequence is large but representable concisely: write a custom collection with `iterator()` and `size()` (e.g., for power sets — return `AbstractList` subtype)

```java
// Elegant power set implementation using AbstractList
public class PowerSet {
    public static final <E> Collection<Set<E>> of(Set<E> s) {
        List<E> src = new ArrayList<>(s);
        if (src.size() > 30)
            throw new IllegalArgumentException("Too many elements: " + s);
        return new AbstractList<Set<E>>() {
            @Override public int size() { return 1 << src.size(); }
            @Override public Set<E> get(int index) {
                // ... bit-manipulation to generate subset at index
            }
        };
    }
}
```

If writing your own `Collection` implementation is infeasible, return a `Stream` (or `Iterable` if callers will only ever iterate).

---

## Item 48: Use Caution When Making Streams Parallel

**Never parallelize a stream pipeline without a compelling performance reason and a verified correctness check.**

Parallelizing a stream on the wrong data can **degrade performance** and even produce **incorrect results**.

### When Parallelism Can Hurt

- Pipelines on `Stream.iterate()` or `limit()` — splitting them is essentially impossible
- Sources backed by linked-list structures (`LinkedList`, `Stream.iterate`)

### When Parallelism Works Well

- Sources that are easy to split: `ArrayList`, `HashMap`, `HashSet`, `ConcurrentHashMap`, arrays, `int` and `long` ranges
- Operations where work per element is large (the parallel overhead becomes negligible)
- Terminal operations that combine partial results cheaply: `reduce`, `min`, `max`, `count`, `sum`; **`collect` is not ideal** (merging collections is expensive)

```java
// Good candidate for parallelism: prime counting over large range
static long pi(long n) {
    return LongStream.rangeClosed(2, n)
        .parallel()
        .mapToObj(BigInteger::valueOf)
        .filter(i -> i.isProbablePrime(50))
        .count();
}
```

Under the right conditions, streams can scale to the number of available processors. But **only parallelize if you have data showing a significant speedup** — incorrect parallelism can cause liveness failures, data races, and incorrect results (especially with mutable state or non-associative reduce operations).
