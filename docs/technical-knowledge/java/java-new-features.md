---
id: java-new-features
title: "Java New Features: Java 8 through Java 21+"
slug: java-new-features
description: Practical guide to modern Java features introduced from Java 8 through Java 21, with emphasis on high-impact language updates.
tags: [java, language-features, modern-java, java-21]
---

# Java New Features: Java 8 through Java 21+

A practical guide to the most impactful features introduced in modern Java versions — from lambdas and streams (Java 8) to virtual threads and pattern matching (Java 21).

---

## 1. Java 8 (LTS) — The Big Leap

Java 8 was a transformational release that introduced **functional programming** constructs to Java.

### Lambda Expressions

Anonymous function syntax for implementing functional interfaces:

```java
// Before: anonymous inner class
Comparator<String> comp = new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return a.length() - b.length();
    }
};

// After: lambda
Comparator<String> comp = (a, b) -> a.length() - b.length();
```

### Functional Interfaces

An interface with exactly one abstract method. Annotated with `@FunctionalInterface`:

| Interface | Method | Use Case |
|-----------|--------|----------|
| `Function<T, R>` | `R apply(T t)` | Transform: T → R |
| `Predicate<T>` | `boolean test(T t)` | Filter: T → boolean |
| `Consumer<T>` | `void accept(T t)` | Side-effect: T → void |
| `Supplier<T>` | `T get()` | Factory: () → T |
| `UnaryOperator<T>` | `T apply(T t)` | Transform: T → T |
| `BiFunction<T, U, R>` | `R apply(T t, U u)` | Transform: (T, U) → R |

### Stream API

Declarative pipeline for processing collections:

```java
List<String> names = people.stream()
    .filter(p -> p.getAge() > 18)           // filter
    .sorted(Comparator.comparing(Person::getName))  // sort
    .map(Person::getName)                    // transform
    .distinct()                              // remove duplicates
    .limit(10)                               // take first 10
    .collect(Collectors.toList());           // terminal operation

// Reduction
int totalAge = people.stream()
    .mapToInt(Person::getAge)
    .sum();

// Grouping
Map<String, List<Person>> byCity = people.stream()
    .collect(Collectors.groupingBy(Person::getCity));

// Parallel stream (use with caution)
long count = list.parallelStream()
    .filter(s -> s.length() > 5)
    .count();
```

### Optional

A container that may or may not hold a value. Eliminates explicit null checks:

```java
// Creating
Optional<String> opt = Optional.of("value");
Optional<String> empty = Optional.empty();
Optional<String> nullable = Optional.ofNullable(mayBeNull);

// Using
String result = opt
    .filter(s -> s.length() > 3)
    .map(String::toUpperCase)
    .orElse("default");

// Chaining
String city = getUser()
    .flatMap(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");
```

### Date-Time API (java.time)

Replaces the problematic `java.util.Date` and `Calendar`:

```java
// Immutable, thread-safe
LocalDate date = LocalDate.of(2024, 3, 15);
LocalTime time = LocalTime.of(14, 30);
LocalDateTime dateTime = LocalDateTime.now();
ZonedDateTime zoned = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));

// Duration and Period
Duration duration = Duration.between(time1, time2);
Period period = Period.between(date1, date2);

// Formatting
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
String formatted = dateTime.format(fmt);
LocalDateTime parsed = LocalDateTime.parse("2024-03-15 14:30", fmt);
```

### Interface Default Methods

Interfaces can now have method implementations:

```java
public interface Collection<E> {
    // Abstract method
    boolean add(E e);

    // Default method — existing implementations don't break
    default boolean isEmpty() {
        return size() == 0;
    }

    // Static method
    static <T> Collection<T> empty() {
        return Collections.emptyList();
    }
}
```

---

## 2. Java 9 — Modularity

### Module System (JPMS)

Organizes code into modules with explicit dependencies:

```java
// module-info.java
module com.myapp {
    requires java.sql;
    requires java.logging;
    exports com.myapp.api;        // visible to other modules
    opens com.myapp.internal;     // accessible via reflection
}
```

### JShell (REPL)

Interactive Java shell for experimenting:

```
jshell> int x = 42;
x ==> 42

jshell> "Hello".chars().sum()
$1 ==> 500
```

### Collection Factory Methods

```java
List<String> list = List.of("a", "b", "c");        // immutable
Set<Integer> set = Set.of(1, 2, 3);                 // immutable
Map<String, Integer> map = Map.of("a", 1, "b", 2);  // immutable
```

### Other Notable Features

- `Optional.ifPresentOrElse()`, `Optional.stream()`
- Private interface methods
- `Stream.takeWhile()`, `Stream.dropWhile()`, `Stream.ofNullable()`
- G1 becomes the default garbage collector
- Compact Strings (internal `byte[]` instead of `char[]` for Latin-1)

---

## 3. Java 10 — Local Variable Type Inference

### `var` keyword

Lets the compiler infer local variable types:

```java
// Explicit type
ArrayList<Map<String, List<Integer>>> data = new ArrayList<>();

// With var — much cleaner
var data = new ArrayList<Map<String, List<Integer>>>();

// Works in for loops
for (var entry : map.entrySet()) {
    var key = entry.getKey();
    var value = entry.getValue();
}
```

**Rules:**
- Only for **local variables** with initializers
- Not for method parameters, return types, or fields
- Not for `null` or lambda: `var x = null;` ❌ `var f = () -> {};` ❌

---

## 4. Java 11 (LTS) — HTTP Client & More

### HttpClient API

Modern, asynchronous HTTP client replacing `HttpURLConnection`:

```java
HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/data"))
    .header("Accept", "application/json")
    .GET()
    .build();

// Synchronous
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

// Asynchronous
CompletableFuture<HttpResponse<String>> future =
    client.sendAsync(request, HttpResponse.BodyHandlers.ofString());
```

### Other Features

- **`var` in lambda parameters:** `(var x, var y) -> x + y`
- **String methods:** `isBlank()`, `strip()`, `lines()`, `repeat(int)`
- **Files methods:** `Files.readString(path)`, `Files.writeString(path, content)`
- **ZGC** (experimental) — ultra-low-latency garbage collector

---

## 5. Java 12–13 — Switch Expressions & Text Blocks

### Switch Expressions (Preview → Standard in 14)

```java
// Traditional switch — verbose, fall-through prone
switch (day) {
    case MONDAY:
    case FRIDAY:
        System.out.println("Work hard");
        break;
    case SATURDAY:
    case SUNDAY:
        System.out.println("Rest");
        break;
}

// Switch expression — concise, no fall-through
String activity = switch (day) {
    case MONDAY, FRIDAY -> "Work hard";
    case SATURDAY, SUNDAY -> "Rest";
    default -> "Regular day";
};
```

### Text Blocks (Preview → Standard in 15)

Multi-line string literals:

```java
// Before: messy concatenation
String json = "{\n" +
    "  \"name\": \"John\",\n" +
    "  \"age\": 30\n" +
    "}";

// After: text blocks
String json = """
    {
      "name": "John",
      "age": 30
    }
    """;
```

---

## 6. Java 14–15 — Records & Sealed Classes

### Records

Immutable data carriers with auto-generated `equals()`, `hashCode()`, `toString()`, and accessors:

```java
// Before: verbose POJO
public class Point {
    private final int x;
    private final int y;
    public Point(int x, int y) { this.x = x; this.y = y; }
    public int x() { return x; }
    public int y() { return y; }
    @Override public boolean equals(Object o) { /* ... */ }
    @Override public int hashCode() { /* ... */ }
    @Override public String toString() { /* ... */ }
}

// After: one line
public record Point(int x, int y) { }

// Usage
Point p = new Point(3, 4);
int x = p.x();              // accessor (not getX())
System.out.println(p);      // Point[x=3, y=4]
```

Records can have:
- Custom constructors (compact or canonical)
- Instance methods
- Static fields and methods
- Implement interfaces

Records **cannot**: extend other classes, have mutable fields, be subclassed.

### Sealed Classes (Preview → Standard in 17)

Restrict which classes can extend or implement a type:

```java
public sealed interface Shape permits Circle, Rectangle, Triangle { }

public record Circle(double radius) implements Shape { }
public record Rectangle(double width, double height) implements Shape { }
public final class Triangle implements Shape { /* ... */ }
```

**Why sealed classes?**
- Enables exhaustive pattern matching (compiler knows all subtypes)
- Models closed type hierarchies (algebraic data types)

---

## 7. Java 16 — Pattern Matching for instanceof

Eliminates redundant casting:

```java
// Before
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// After — binding variable
if (obj instanceof String s) {
    System.out.println(s.length());  // s is already cast
}

// Works with logical operators
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s.toUpperCase());
}
```

---

## 8. Java 17 (LTS) — Sealed Classes Finalized

Java 17 is a **Long-Term Support** release. Key finalized features:

- **Sealed classes** (from preview to standard)
- **Pattern matching for `instanceof`** (standard)
- **Text blocks** (standard)
- **Records** (standard)
- **Strong encapsulation** of JDK internals (cannot access internal APIs by default)

### Migration Note

Java 17 is the recommended upgrade target from Java 8 or 11. Key breaking changes:
- Strong encapsulation of `sun.misc.*` APIs
- Removed `SecurityManager` deprecation
- Removed RMI Activation
- Need `--add-opens` for frameworks using deep reflection

---

## 9. Java 21 (LTS) — Virtual Threads & Pattern Matching

### Virtual Threads (Finalized)

Lightweight threads managed by the JVM, enabling massive concurrency:

```java
// Create a virtual thread
Thread.ofVirtual().start(() -> {
    System.out.println("Running in virtual thread");
});

// Virtual thread executor — 1 virtual thread per task
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Submit 100,000 tasks — each gets a virtual thread
    List<Future<String>> futures = IntStream.range(0, 100_000)
        .mapToObj(i -> executor.submit(() -> fetchUrl("https://example.com/" + i)))
        .toList();
}
```

### Pattern Matching for switch (Finalized)

```java
// Type patterns + guards
String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "positive integer: " + i;
        case Integer i            -> "non-positive integer: " + i;
        case String s             -> "string of length " + s.length();
        case null                 -> "null!";
        default                   -> "something else";
    };
}

// Sealed class exhaustiveness
double area(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t  -> t.base() * t.height() / 2;
        // no default needed — Shape is sealed, compiler knows all cases
    };
}
```

### Record Patterns (Finalized)

Deconstruct records in pattern matching:

```java
record Point(int x, int y) { }

// Deconstruct directly
if (obj instanceof Point(int x, int y)) {
    System.out.println("x=" + x + ", y=" + y);
}

// Nested patterns in switch
switch (shape) {
    case Circle(var radius) when radius > 10 -> "large circle";
    case Circle(var radius) -> "small circle with radius " + radius;
    default -> "not a circle";
}
```

### Sequenced Collections

New interfaces for collections with defined encounter order:

```java
// SequencedCollection
interface SequencedCollection<E> extends Collection<E> {
    SequencedCollection<E> reversed();
    void addFirst(E e);
    void addLast(E e);
    E getFirst();
    E getLast();
    E removeFirst();
    E removeLast();
}

// Usage
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();   // "a"
list.getLast();    // "c"
list.reversed();   // ["c", "b", "a"]
```

---

## 10. Feature Timeline Summary

| Version | Year | Key Features | LTS? |
|---------|------|-------------|------|
| **8** | 2014 | Lambdas, Streams, Optional, Date-Time API | ✅ |
| **9** | 2017 | Modules (JPMS), JShell, Collection factories | |
| **10** | 2018 | `var` local variable type inference | |
| **11** | 2018 | HttpClient, `var` in lambdas, ZGC (exp.) | ✅ |
| **12** | 2019 | Switch expressions (preview) | |
| **13** | 2019 | Text blocks (preview) | |
| **14** | 2020 | Records (preview), switch expressions (standard) | |
| **15** | 2020 | Sealed classes (preview), text blocks (standard) | |
| **16** | 2021 | Records (standard), pattern matching instanceof | |
| **17** | 2021 | Sealed classes (standard), strong encapsulation | ✅ |
| **18** | 2022 | UTF-8 default, simple web server | |
| **19** | 2022 | Virtual threads (preview), structured concurrency (incubator) | |
| **20** | 2023 | Virtual threads (2nd preview), scoped values (incubator) | |
| **21** | 2023 | Virtual threads, pattern matching switch, record patterns (all standard) | ✅ |

### Recommended Upgrade Path

```
Java 8  →  Java 17 (LTS)  →  Java 21 (LTS)
```

- **Java 8 → 17:** Biggest jump. Gain modules, records, sealed classes, text blocks, new GCs.
- **Java 17 → 21:** Gain virtual threads, pattern matching for switch, record patterns.

---

## Advanced Editorial Pass: Feature Adoption with Migration Discipline

### Decision Framework
- Adopt features when they reduce defect rate or cognitive load, not for novelty.
- Sequence upgrades by platform compatibility, library ecosystem readiness, and team fluency.
- Protect rollout with compatibility tests across runtime and build toolchain.

### Adoption Risks
- Mixed-language style across modules increases maintenance friction.
- Incomplete migration strategies create hidden behavioral inconsistencies.
- Feature use outpaces debugging and observability competence.

### Migration Heuristics
1. Define approved feature subsets per Java version and team maturity.
2. Enforce consistent style through reviews and static analysis.
3. Pair language upgrades with targeted knowledge-sharing and incident drills.

### Compare Next
- [Java Fundamentals: Core Language Concepts](./java-fundamentals.md)
- [JVM Internals: Memory, GC & Class Loading](./java-jvm.md)
- [Java OOP](./java-oop.md)
