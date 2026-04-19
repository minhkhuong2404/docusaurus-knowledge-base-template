---
id: exam-tips
title: "Exam Tips & Quick Reference"
sidebar_label: "🎯 Exam Tips"
description: "Comprehensive OCP Java SE 21 (1Z0-830) exam cheat-sheet: output tracing strategy, compile vs runtime errors, Java 21 new features, mnemonics, top traps across all 14 chapters, functional interface cheatsheet, stream operations, collections comparison, and a final checklist."
tags:
  - exam-tips
  - cheatsheet
  - ocp
  - java-21
  - mnemonics
  - traps
  - 1z0-830
  - quick-reference
---

# Exam Tips & Quick Reference

> **Exam:** 1Z0-830 — 50 questions, 90 minutes, passing score: 68%

This page is the **cross-chapter cram sheet** (mnemonics, matrices, top traps). For topic explanations and **chapter-specific** exam tables and traps, work through the numbered chapters from the [OCP introduction](./intro.md) (e.g. [Chapter 1](./chapters/chapter-01.md) through [Chapter 14](./chapters/chapter-14.md)).

---

## High-Frequency Exam Topics

### 1. Output Tracing Questions

The most common question type. Practice tracing code mentally:

```java
// What is the output?
int x = 5;
int y = x++ * --x;
System.out.println(x + " " + y);
// Step 1: x++ → returns 5, x becomes 6
// Step 2: --x → x becomes 5, returns 5
// y = 5 * 5 = 25
// Output: 5 25
```

**Strategy:** Write variable values on paper as you trace.

---

### 2. Compile vs Runtime Errors

Know which errors are compile-time vs runtime:

| Scenario | Error Type |
|----------|-----------|
| Wrong types in expression | Compile |
| Missing `throws` for checked exception | Compile |
| `ClassCastException` | Runtime |
| `NullPointerException` | Runtime |
| `ArrayIndexOutOfBoundsException` | Runtime |
| Missing `break` in switch (wrong result) | No error — logical bug |

---

### 3. Java 21 New Features (Heavily Tested)

| Feature | Chapter | Key API/Syntax |
|---------|---------|---------------|
| Records | 7 | `record Point(int x, int y) {}` |
| Sealed classes | 7 | `sealed`, `permits`, `final`/`non-sealed` |
| Pattern matching `instanceof` | 3, 6 | `if (obj instanceof String s)` |
| Pattern matching `switch` | 3 | `case Integer i when i > 0` |
| Virtual threads | 13 | `Thread.ofVirtual()`, `newVirtualThreadPerTaskExecutor()` |
| `SequencedCollection` | 9 | `getFirst()`, `getLast()`, `reversed()` |
| Text blocks | 1 | Triple-quote `"""..."""` |

---

## Quick-Fire Mnemonics

### Access Modifiers (widest → narrowest)
**P**ublic → **P**rotected → **P**ackage → **P**rivate  
**"Pretty Please Provide Privacy"**

### Primitive Types (by size)
**B**oolean, **B**yte, **S**hort, **I**nt, **L**ong, **F**loat, **D**ouble, **C**har  
**"Be Bold, Silly Idiots Love Feeling Dangerously Clever"**

### Exception Types
- **Checked** → must **Check** (handle or declare)
- **Unchecked** → no check needed (`RuntimeException` + subclasses)
- **Error** → **never** catch

### PECS (Generics Wildcards)
**P**roducer **E**xtends, **C**onsumer **S**uper  
- Read from it → `? extends T`
- Write to it → `? super T`

---

## Common Exam Traps

### String Traps
```java
String s = "hello";
s.toUpperCase(); // ❌ ignored! String is immutable
// ✅ Must reassign: s = s.toUpperCase();

String a = "test";
String b = new String("test");
a == b;      // FALSE (different objects)
a.equals(b); // TRUE (same content)
```

### Autoboxing / Integer Cache
```java
Integer a = 127; Integer b = 127;
a == b; // TRUE (cached range -128 to 127)

Integer c = 128; Integer d = 128;
c == d; // FALSE (outside cache range)
```

### Compound Assignment Hidden Cast
```java
byte b = 10;
b = b + 1;  // ❌ COMPILE ERROR — int assigned to byte
b += 1;     // ✅ compound assignment includes implicit cast
```

### switch Fall-Through
```java
int x = 2;
switch (x) {
    case 1:
    case 2: System.out.println("two"); // no break!
    case 3: System.out.println("three");
}
// Prints "two" AND "three" (fall-through!)
```

### finally Always Runs
```java
int tricky() {
    try { return 1; }
    finally { return 2; } // overrides the try's return!
}
// Returns 2, not 1
```

### var Limitations
```java
var x;          // ❌ must initialize
var y = null;   // ❌ type cannot be inferred
class MyClass { var z = 10; } // ❌ no fields
void method(var p) { } // ❌ no parameters
```

### Pre/Post Increment
```java
int i = 5;
int result = i++ + ++i;
// i++ → returns 5, i=6
// ++i → i=7, returns 7
// result = 5 + 7 = 12, i = 7
```

---

## Functional Interface Cheatsheet

| Interface | Method | In → Out |
|-----------|--------|---------|
| `Supplier<T>` | `get()` | `()` → `T` |
| `Consumer<T>` | `accept(T)` | `T` → `void` |
| `Function<T,R>` | `apply(T)` | `T` → `R` |
| `Predicate<T>` | `test(T)` | `T` → `boolean` |
| `UnaryOperator<T>` | `apply(T)` | `T` → `T` |
| `BinaryOperator<T>` | `apply(T,T)` | `T,T` → `T` |
| `BiFunction<T,U,R>` | `apply(T,U)` | `T,U` → `R` |

---

## Stream Operations Reference

| Operation | Type | Short-circuit? |
|-----------|------|----------------|
| `filter` | Intermediate | No |
| `map`/`flatMap` | Intermediate | No |
| `sorted`/`distinct` | Intermediate | No |
| `limit`/`skip` | Intermediate | `limit` yes |
| `peek` | Intermediate | No |
| `forEach` | Terminal | No |
| `count`/`sum` | Terminal | No |
| `collect` | Terminal | No |
| `reduce` | Terminal | No |
| `findFirst`/`findAny` | Terminal | **Yes** |
| `anyMatch`/`noneMatch`/`allMatch` | Terminal | **Yes** |
| `min`/`max` | Terminal | No |

---

## Collections Quick Comparison

| Collection | Order | Duplicates | Null | Thread-Safe |
|-----------|-------|-----------|------|-------------|
| `ArrayList` | Insertion | Yes | Yes | No |
| `LinkedList` | Insertion | Yes | Yes | No |
| `HashSet` | None | No | One null | No |
| `LinkedHashSet` | Insertion | No | One null | No |
| `TreeSet` | Sorted | No | No | No |
| `HashMap` | None | Keys: No | One null key | No |
| `LinkedHashMap` | Insertion | Keys: No | One null key | No |
| `TreeMap` | Sorted | Keys: No | No null key | No |
| `ArrayDeque` | FIFO/LIFO | Yes | No | No |
| `ConcurrentHashMap` | None | Keys: No | No | **Yes** |
| `CopyOnWriteArrayList` | Insertion | Yes | Yes | **Yes** |

---

## Module System Quick Reference

```
module com.myapp {
    requires java.sql;              // needs this module
    requires transitive java.xml;   // my users also get java.xml
    requires static lombok;         // compile-time only
    exports com.myapp.api;          // accessible to all
    exports com.myapp.spi to partner; // accessible only to partner
    opens com.myapp.model;          // deep reflection allowed
    uses com.spi.Service;           // I'm a consumer
    provides com.spi.Service with com.myapp.ServiceImpl; // I'm a provider
}
```

---

## 🔢 Operator Precedence Cheatsheet

```
1.  ()                          Parentheses (highest)
2.  expr++  expr--              Post-unary
3.  ++expr  --expr  -  !  ~     Pre-unary
4.  (type)                      Cast
5.  *  /  %                     Multiply / divide / modulo
6.  +  -                        Add / subtract
7.  <<  >>  >>>                 Shift
8.  <  >  <=  >=  instanceof    Relational
9.  ==  !=                      Equality
10. &                           Bitwise AND
11. ^                           Bitwise XOR
12. |                           Bitwise OR
13. &&                          Conditional AND (short-circuit)
14. ||                          Conditional OR (short-circuit)
15. ? :                         Ternary
16. =  +=  -=  *=  /=  etc.     Assignment (lowest)
```

---

## 🧠 Code Output Tracing — Step-by-Step Method

When asked "what is the output?", follow this exact process:

**Step 1:** Identify all variable declarations and their initial values.  
**Step 2:** Trace each expression left-to-right using operator precedence.  
**Step 3:** Note side effects (`++`, `--`) — post happens **after** value is used, pre happens **before**.  
**Step 4:** Follow any control flow (`if`, `switch`, loops).  
**Step 5:** Check for inheritance — which actual type is the object? That determines which method runs.

```java
// Example to trace:
int a = 3, b = 5;
int c = a++ * --b + a;
// Step 1: a=3, b=5
// Step 2: a++ → uses 3, then a becomes 4
// Step 3: --b → b becomes 4, uses 4
// Step 4: 3 * 4 = 12
// Step 5: + a (a is now 4) = 12 + 4 = 16
// c = 16, a = 4, b = 4
```

---

## 💥 Top 20 Exam Traps Across All Chapters

:::danger[Must-Know Traps]
```java
// 1. String immutability
String s = "hello";
s.toUpperCase(); // ignored! s is still "hello"

// 2. Integer cache boundary
Integer a = 127; Integer b = 127; // a == b → true
Integer c = 128; Integer d = 128; // c == d → false

// 3. Compound assignment includes cast
byte b = 10;
b = b + 1;   // ❌ compile error
b += 1;      // ✅ implicit cast

// 4. switch fall-through
switch(x) { case 1: case 2: System.out.println("1or2"); case 3: System.out.println("3"); }
// If x==1 or x==2: prints BOTH "1or2" AND "3" (fall-through!)

// 5. finally overrides return
int f() { try { return 1; } finally { return 2; } } // always returns 2

// 6. var limitations
var x;          // ❌ not initialized
var y = null;   // ❌ type unknown
class C { var z = 1; } // ❌ no fields

// 7. Abstract class can have constructor (but can't be instantiated directly)
abstract class A { A() {} } // ✅

// 8. Record accessors have NO "get" prefix
record Point(int x, int y) {}
new Point(1,2).x();    // ✅
new Point(1,2).getX(); // ❌ NoSuchMethodError

// 9. Enum constructor is always private
enum Color { RED; public Color() {} } // ❌ compile error (can't be public)

// 10. Multi-catch cannot catch related types
catch (IOException | FileNotFoundException e) {} // ❌ related hierarchy

// 11. Streams are single-use
Stream<String> s = Stream.of("a","b");
s.count(); s.count(); // ❌ IllegalStateException on second call

// 12. Optional.get() throws on empty
Optional<String> o = Optional.empty();
o.get(); // ❌ NoSuchElementException

// 13. List.of() is immutable
List<String> l = List.of("a","b");
l.add("c"); // ❌ UnsupportedOperationException

// 14. TreeSet/TreeMap rejects null
new TreeSet<>().add(null); // ❌ NullPointerException

// 15. volatile ≠ atomic
volatile int count = 0;
count++; // NOT thread-safe even with volatile

// 16. Static method called on null reference doesn't NPE
String s = null;
s.valueOf(42); // ✅ compiles and runs — resolved to String.valueOf(42)

// 17. Files.lines() must be closed
Stream<String> lines = Files.lines(path); // resource leak if not closed!

// 18. transient fields are null after deserialization
transient String pwd = "secret"; // pwd == null after readObject()

// 19. Pattern matching variable scope
if (!(obj instanceof String s)) {
    // s is NOT in scope here
} else {
    s.length(); // ✅ s is in scope in the else branch
}

// 20. requires transitive gives implied readability
module A { requires transitive B; }
module C { requires A; } // C can use types from B without explicit requires B
```
:::

---

## 📐 Inheritance & Polymorphism Decision Tree

```
Is the method static?
  ├── YES → Method HIDING (resolved at compile time by reference type)
  └── NO  → Method OVERRIDING (resolved at runtime by object type)

Is the member a field?
  └── ALWAYS → Field HIDING (resolved at compile time by reference type)

What runs: Parent p = new Child(); p.method();
  ├── method() is static   → Parent.method() (hiding)
  └── method() is instance → Child.method()  (overriding)
```

---

## 🔁 Exception Flow Decision Table

| Scenario | What Propagates |
|----------|----------------|
| `try` throws, `catch` catches, no `finally` | Nothing propagates |
| `try` throws, `catch` catches, `finally` throws | `finally` exception propagates; `catch` exception lost |
| `try` throws, `catch` catches, `finally` returns | `finally` return value used; exception swallowed |
| `try` throws, no matching `catch`, `finally` runs | Original exception propagates after `finally` |
| try-with-resources: body throws, `close()` throws | Body exception propagates; `close()` exception becomes suppressed |
| try-with-resources: body OK, `close()` throws | `close()` exception propagates normally |

---

## 🔐 Access Modifier Matrix

| Where accessed from | `private` | package | `protected` | `public` |
|---------------------|-----------|---------|-------------|---------|
| Same class | ✅ | ✅ | ✅ | ✅ |
| Same package, different class | ❌ | ✅ | ✅ | ✅ |
| Different package, subclass | ❌ | ❌ | ✅* | ✅ |
| Different package, non-subclass | ❌ | ❌ | ❌ | ✅ |

\* `protected` in a subclass from a different package: only accessible through inheritance (via `this` or the subclass type), NOT via a parent-type reference.

---

## ⚡ Java 21 New Features — Exam Highlights

| Feature | Since | Key Syntax | Exam Focus |
|---------|-------|-----------|------------|
| Records | 16 | `record Point(int x, int y) {}` | Accessors without `get`, immutability, compact constructor |
| Sealed classes | 17 | `sealed class Shape permits Circle, Rect {}` | `final`/`sealed`/`non-sealed` subclasses, exhaustive switch |
| Pattern matching `instanceof` | 16 | `if (o instanceof String s && s.length() > 3)` | Variable scope rules |
| Pattern matching `switch` | 21 | `case Integer i when i > 0 ->` | Guard with `when`, `null` case, dominance |
| Virtual threads | 21 | `Thread.ofVirtual().start(r)` | Best for I/O-bound; pinning with `synchronized` |
| `SequencedCollection` | 21 | `.getFirst()`, `.getLast()`, `.reversed()` | New interface on List/Deque/LinkedHashSet |
| Text blocks | 15 | `"""..."""` | Indentation stripping, trailing whitespace |
| `switch` expressions | 14 | `int x = switch(n) { case 1 -> 10; default -> 0; }` | `yield` in block, exhaustiveness |

---

## 🧩 Generics Wildcard Decision Guide

```
Do you need to READ from the collection?
  └── Use ? extends T  (upper bounded — Producer Extends)
      List<? extends Number> → can call .get(), returns Number
      Cannot add (except null)

Do you need to WRITE to the collection?
  └── Use ? super T   (lower bounded — Consumer Super)
      List<? super Integer> → can add Integer and subtypes
      .get() returns Object

Need both read and write?
  └── Use a concrete type: List<Number>

Unbounded wildcard ?
  └── Only when method doesn't care about element type at all
      void printList(List<?> list) { list.forEach(System.out::println); }
```

---

## ⏱ Concurrency Quick Decision Guide

| Scenario | Best Tool |
|----------|-----------|
| Fire-and-forget background task | `ExecutorService.execute(Runnable)` |
| Task with return value | `ExecutorService.submit(Callable)` → `Future` |
| Chained async operations | `CompletableFuture` |
| Thread-safe counter | `AtomicInteger` / `AtomicLong` |
| Mutual exclusion | `synchronized` or `ReentrantLock` |
| Visibility only (flag) | `volatile boolean` |
| Thread-safe map | `ConcurrentHashMap` |
| Thread-safe list for read-heavy | `CopyOnWriteArrayList` |
| Many I/O tasks (Java 21) | `Executors.newVirtualThreadPerTaskExecutor()` |
| Wait for N tasks to complete | `CountDownLatch` |
| Synchronize N threads at a barrier | `CyclicBarrier` |

---

## 📄 Last-Minute Checklist

Before your exam, confirm you know:

**Primitives & Variables**
- [ ] All 8 primitive types, sizes, and defaults
- [ ] `long` literal needs `L`; `float` literal needs `f`
- [ ] `var` only for local variables; must initialize; can't be `null`
- [ ] Underscore in literals: not at start, end, or beside decimal point

**Operators**
- [ ] Pre-increment returns new value; post-increment returns original
- [ ] `&&`/`||` short-circuit; `&`/`|` do not
- [ ] Compound assignment (`+=`) includes an implicit cast
- [ ] `NaN != NaN` is always `true`

**Control Flow**
- [ ] `switch` cannot use `long`, `float`, `double`, `boolean`
- [ ] Arrow `->` in switch: no fall-through; `yield` in block form
- [ ] `do-while` body always runs at least once
- [ ] `break LABEL` exits the labeled outer loop

**OOP**
- [ ] `super()` must be first in child constructor; cannot combine with `this()`
- [ ] Abstract class can have constructors; cannot be instantiated
- [ ] `final` class cannot be extended; `final` method cannot be overridden
- [ ] Fields are hidden (compile-time), not overridden (runtime)
- [ ] Override: same/wider access; same/narrower exception; covariant return

**Interfaces, Records, Enums, Sealed**
- [ ] Interface constants are implicitly `public static final`
- [ ] Record accessors: `x()` not `getX()`; fields are `private final`
- [ ] Enum constructor is always `private`
- [ ] Sealed subclasses must be `final`, `sealed`, or `non-sealed`

**Lambdas & Streams**
- [ ] Functional interface = exactly 1 abstract method
- [ ] Effectively final: variable never reassigned after capture
- [ ] `andThen`: current then next; `compose`: argument first then current
- [ ] Stream is single-use; intermediate ops are lazy
- [ ] `allMatch`/`noneMatch` return `true` for empty streams; `anyMatch` returns `false`
- [ ] `Optional.get()` throws if empty — prefer `orElse`/`orElseGet`

**Collections**
- [ ] `List.of()` is immutable; `ArrayList` is mutable
- [ ] `TreeSet`/`TreeMap` reject `null`; `HashMap` allows one null key
- [ ] `ArrayDeque` rejects `null`; `LinkedList` allows it
- [ ] `poll()` returns null if empty; `remove()` throws

**Exceptions**
- [ ] Checked: must handle or declare; Unchecked: optional
- [ ] try-with-resources: close in reverse order, BEFORE catch/finally
- [ ] Multi-catch: types must be unrelated (no parent-child)
- [ ] `finally` return overrides try return and swallows exceptions

**Modules**
- [ ] `exports` = compile+runtime access; `opens` = reflection only
- [ ] `requires transitive` = implied readability for dependents
- [ ] Automatic module: JAR on module-path, no `module-info.java`
- [ ] Unnamed module: classpath code; can't be required by name

**Concurrency**
- [ ] `start()` creates thread; `run()` executes in current thread
- [ ] `volatile` = visibility only; `synchronized` = visibility + atomicity
- [ ] Virtual threads best for I/O-bound; avoid `synchronized` on I/O paths
- [ ] `ConcurrentHashMap` does not allow null keys or values

**I/O**
- [ ] `Path` methods are string operations — no file system I/O
- [ ] `Files.lines()` / `Files.walk()` return streams — must close!
- [ ] `readLine()` returns `null` at EOF, not an exception
- [ ] `transient` and `static` fields are NOT serialized
- [ ] Missing `serialVersionUID` change → `InvalidClassException`

---

Good luck on the exam! 🎯 You've got this!
