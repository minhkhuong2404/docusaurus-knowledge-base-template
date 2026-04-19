---
id: chapter-08
title: "Chapter 8 — Lambdas & Functional Interfaces"
sidebar_label: "Ch 8 · Lambdas & Functional Interfaces"
description: "Complete guide to lambda expressions, method references, built-in functional interfaces (Supplier, Consumer, Function, Predicate, UnaryOperator, BinaryOperator), variable capture rules, and functional composition with andThen/compose."
tags:
  - lambdas
  - functional-interfaces
  - method-references
  - supplier
  - consumer
  - function
  - predicate
  - effectively-final
  - streams
---

# Chapter 8 — Lambdas & Functional Interfaces

<span class="chapter-badge">Exam Domain: Working with Streams and Lambda Expressions</span>

> **Key Topics:** Lambda syntax, functional interfaces, `java.util.function` package, method references, variable capture.

---

## 🟦 New Learner: Lambdas

### What is a Lambda?

A lambda is a **short anonymous function** that can be passed around like a value. It implements a **functional interface** (an interface with exactly one abstract method).

```java
// Full syntax
Runnable r = (/* no params */) -> { System.out.println("Hello!"); };

// Shorter forms (when unambiguous)
Runnable r2 = () -> System.out.println("Hello!"); // no braces for single statement

// With parameter
Comparator<String> comp = (String a, String b) -> { return a.compareTo(b); };
Comparator<String> comp2 = (a, b) -> a.compareTo(b); // types inferred, return implicit
```

**Lambda syntax options:**

```
(params) -> expression              // single expression, implicit return
(params) -> { statements; }         // block body, explicit return
() -> expression                    // no parameters
param -> expression                 // single param, no parens needed
(Type param) -> expression          // typed params (parens required)
```

---

### Functional Interfaces

A functional interface has **exactly ONE abstract method** (but can have many `default`/`static` methods). Annotated with `@FunctionalInterface` (optional but recommended).

```java
@FunctionalInterface
interface Greeting {
    String greet(String name); // the one abstract method
}

Greeting hello = name -> "Hello, " + name + "!";
System.out.println(hello.greet("Duke")); // "Hello, Duke!"
```

---

### Built-in Functional Interfaces (`java.util.function`)

| Interface | Method | Input | Output | Use Case |
|-----------|--------|-------|--------|---------|
| `Supplier<T>` | `T get()` | None | T | Factory, lazy value |
| `Consumer<T>` | `void accept(T)` | T | None | Side effects |
| `BiConsumer<T,U>` | `void accept(T,U)` | T, U | None | Side effects on two |
| `Function<T,R>` | `R apply(T)` | T | R | Transform |
| `BiFunction<T,U,R>` | `R apply(T,U)` | T, U | R | Transform two → one |
| `Predicate<T>` | `boolean test(T)` | T | boolean | Filter/condition |
| `BiPredicate<T,U>` | `boolean test(T,U)` | T, U | boolean | Two-input condition |
| `UnaryOperator<T>` | `T apply(T)` | T | T (same type) | Transform same type |
| `BinaryOperator<T>` | `T apply(T,T)` | T, T | T (same type) | Combine two same |

```java
Supplier<String> s   = () -> "Hello";
Consumer<String> c   = str -> System.out.println(str);
Function<String, Integer> f = str -> str.length();
Predicate<String> p  = str -> str.isEmpty();

s.get();           // "Hello"
c.accept("Duke");  // prints "Duke"
f.apply("Java");   // 4
p.test("");        // true
```

---

### Convenience Methods on Functional Interfaces

```java
Predicate<String> isLong = s -> s.length() > 5;
Predicate<String> startsWithJ = s -> s.startsWith("J");

// Compose predicates
Predicate<String> both = isLong.and(startsWithJ);
Predicate<String> either = isLong.or(startsWithJ);
Predicate<String> notLong = isLong.negate();

// Compose functions (execute in sequence)
Function<Integer, Integer> doubleIt = x -> x * 2;
Function<Integer, Integer> addTen = x -> x + 10;

Function<Integer, Integer> doubleThenAdd = doubleIt.andThen(addTen);
doubleThenAdd.apply(5); // (5*2)+10 = 20

Function<Integer, Integer> addThenDouble = doubleIt.compose(addTen);
addThenDouble.apply(5); // (5+10)*2 = 30
```

---

### Method References

Method references are a shorthand for lambdas that just call a method:

| Type | Syntax | Lambda Equivalent |
|------|--------|-------------------|
| Static method | `Class::staticMethod` | `(args) -> Class.staticMethod(args)` |
| Instance method (specific object) | `obj::method` | `(args) -> obj.method(args)` |
| Instance method (arbitrary object) | `Class::instanceMethod` | `(obj, args) -> obj.method(args)` |
| Constructor | `Class::new` | `(args) -> new Class(args)` |

```java
// Static method reference
Function<String, Integer> parser = Integer::parseInt;
parser.apply("42"); // 42

// Specific instance method reference
String prefix = "Hello, ";
Function<String, String> greeter = prefix::concat;
greeter.apply("Duke"); // "Hello, Duke"

// Arbitrary instance method reference
Function<String, String> upper = String::toUpperCase;
upper.apply("hello"); // "HELLO"

// Constructor reference
Supplier<ArrayList<String>> listFactory = ArrayList::new;
ArrayList<String> list = listFactory.get();
```

---

### Variable Capture

Lambdas can use variables from their enclosing scope, but those variables must be **effectively final** (never reassigned):

```java
int multiplier = 3; // effectively final
Function<Integer, Integer> triple = x -> x * multiplier; // ✅

multiplier = 5; // ❌ COMPILE ERROR: makes multiplier not effectively final
```

---

## 🟣 Senior Deep Dive

### Primitive Functional Interfaces

Avoid boxing/unboxing with specialized variants:

| Type | Interfaces |
|------|-----------|
| `int` | `IntSupplier`, `IntConsumer`, `IntFunction<R>`, `IntPredicate`, `IntUnaryOperator`, `IntBinaryOperator` |
| `long` | `LongSupplier`, `LongConsumer`, `LongFunction<R>`, etc. |
| `double` | `DoubleSupplier`, `DoubleConsumer`, `DoubleFunction<R>`, etc. |

```java
// Avoid Integer boxing:
IntFunction<String> intToStr = i -> "Value: " + i;
IntSupplier rand = () -> (int)(Math.random() * 100);
IntPredicate isEven = n -> n % 2 == 0;
IntUnaryOperator square = n -> n * n;
IntBinaryOperator add = (a, b) -> a + b;

// Cross-type conversion
ToIntFunction<String> strLen = String::length;  // String → int
IntToLongFunction intToLong = i -> (long)i * i; // int → long
```

### Lambdas and Closures — The JVM's `invokedynamic`

Lambdas in Java are NOT anonymous inner classes. They use `invokedynamic` (a JVM instruction added in Java 7) which defers the linkage to runtime. The actual class implementing the functional interface is generated at first call by `LambdaMetafactory`, and the same instance may be reused.

This means:

```java
Runnable r1 = () -> System.out.println("hi");
Runnable r2 = () -> System.out.println("hi");

// These may or may NOT be the same instance — don't rely on identity!
System.out.println(r1 == r2); // implementation-defined (often false)
```

### Effectively Final — Subtle Case

```java
for (int i = 0; i < 5; i++) {
    // i is modified in the loop — NOT effectively final
    Runnable r = () -> System.out.println(i); // ❌ COMPILE ERROR
}

// Fix: use a local effectively final copy
for (int i = 0; i < 5; i++) {
    final int copy = i;
    Runnable r = () -> System.out.println(copy); // ✅
}
```

### Custom Functional Interface Composition

```java
@FunctionalInterface
interface Transformer<T> extends Function<T, T> {
    default Transformer<T> then(Transformer<T> after) {
        return t -> after.apply(this.apply(t));
    }
}

Transformer<String> trim = String::trim;
Transformer<String> upper = String::toUpperCase;
Transformer<String> pipeline = trim.then(upper);
pipeline.apply("  hello  "); // "HELLO"
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| Functional interface | Exactly ONE abstract method; `@FunctionalInterface` optional |
| `Supplier` | No input → output (`get()`) |
| `Consumer` | Input → no output (`accept()`) |
| `Function` | Input → different output (`apply()`) |
| `Predicate` | Input → boolean (`test()`) |
| `UnaryOperator` | Input → SAME type output |
| Method ref types | static, instance on specific obj, instance on arbitrary, constructor |
| Effectively final | Variable never reassigned after initialization |
| `andThen` | Executes current function THEN the next |
| `compose` | Executes argument function FIRST, then current |
| `BiConsumer` | Two inputs, no output |
| `BiFunction` | Two inputs, one (different type) output |
| `BinaryOperator` | Two inputs of same type, same type output |
| Primitive FIs | Prefer `IntSupplier`, `IntFunction`, etc. to avoid boxing overhead |
| `BiPredicate<T,U>` | `boolean test(T, U)` — two-argument boolean test |
| `ToIntFunction<T>` | `int applyAsInt(T)` — object to primitive `int` |
| `ObjIntConsumer<T>` | `void accept(T, int)` — mixed object + primitive |
| Target typing | Lambda must match assigned FI's SAM; mismatch → compile error |
| Exception in lambda | Checked exceptions: lambda body must not throw checked unless FI allows (e.g. `Callable`) |
| `Runnable` vs `Callable` | `Runnable` `run()` void; `Callable<V>` `call()` returns `V`, throws checked |
| Method ref arity | Must match SAM parameter count (e.g. `String::charAt` → `IntUnaryOperator` on `String` receiver) |
| `super::` | Bound instance method: `this::` or `Outer.this::method` in nested contexts |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 8]
**Trap 1 — Lambda without braces: implicit return, no semicolon inside:**
```java
Function<Integer, Integer> f = x -> x * 2;         // ✅ implicit return
Function<Integer, Integer> g = x -> { x * 2; };     // ❌ missing return keyword
Function<Integer, Integer> h = x -> { return x * 2; }; // ✅ explicit with braces
```

**Trap 2 — `@FunctionalInterface` does NOT limit method count:**
```java
@FunctionalInterface
interface Worker {
    void work();             // abstract — the one SAM
    default void log() { }  // ✅ default methods are fine
    static void help() { }  // ✅ static methods are fine
    // void work2();        // ❌ second abstract method — won't compile
}
```

**Trap 3 — `andThen` vs `compose` direction:**
```java
Function<Integer, Integer> times2 = x -> x * 2;
Function<Integer, Integer> plus3  = x -> x + 3;

times2.andThen(plus3).apply(5); // (5*2)+3 = 13  → times2 first, then plus3
times2.compose(plus3).apply(5); // (5+3)*2 = 16  → plus3 first, then times2
```

**Trap 4 — `Predicate.negate()` vs `!`:**
```java
Predicate<String> isEmpty = String::isEmpty;
Predicate<String> isNotEmpty = isEmpty.negate(); // ✅ correct composition
// Predicate<String> wrong = !isEmpty;           // ❌ ! doesn't work on Predicate
```

**Trap 5 — Effectively final in loops:**
```java
List<Runnable> tasks = new ArrayList<>();
for (int i = 0; i < 5; i++) {
    tasks.add(() -> System.out.println(i)); // ❌ i is modified — not effectively final!
    int copy = i;
    tasks.add(() -> System.out.println(copy)); // ✅ copy is effectively final
}
```

**Trap 6 — Method reference for instance method on arbitrary object:**
```java
// Instance method on SPECIFIC object:
String prefix = "Hello, ";
Function<String, String> greet = prefix::concat; // prefix is captured

// Instance method on ARBITRARY object:
Function<String, String> upper = String::toUpperCase; // no instance captured
// Equivalent lambda: (String s) -> s.toUpperCase()
```

**Trap 7 — `Consumer.andThen` vs `Function.andThen`:**
```java
Consumer<String> print  = System.out::println;
Consumer<String> log    = s -> logger.info(s);
Consumer<String> both   = print.andThen(log); // runs print then log
// Consumer.andThen returns Consumer; Function.andThen returns Function — different types!
```

**Trap 8 — Wrong FI for a lambda (target typing):**
```java
var x = () -> 42; // ❌ cannot infer type — `var` needs a target type
Supplier<Integer> s = () -> 42; // ✅
```

**Trap 9 — `UnaryOperator` vs `Function` — both extend `Function`:**
```java
UnaryOperator<String> u = String::trim; // apply(String) -> String
Function<String, String> f = String::trim; // same SAM shape, different type name
```

**Trap 10 — Method reference to overloaded methods picks specific overload by context:**
```java
Consumer<String> c = System.out::println; // println(String)
// If ambiguous, compiler may fail or pick narrowest match — watch exam questions
```

**Trap 11 — Lambda body throwing checked exception:**
```java
Runnable r = () -> Thread.sleep(100); // ❌ InterruptedException is checked
Callable<Void> c = () -> { Thread.sleep(100); return null; }; // ✅ Callable allows throws
```
:::

### Exam vignettes

```java
// Vignette 1 — compose order
Function<Integer,Integer> f = x -> x * 2;
Function<Integer,Integer> g = x -> x + 1;
System.out.println(f.compose(g).apply(3)); // g then f → (3+1)*2 = 8

// Vignette 2 — Predicate chain
Predicate<String> p = s -> s.length() > 2;
Predicate<String> q = p.negate().or(s -> s.equals("ok"));
```

:::tip[Spring/Senior Relevance]
- Spring's `@Bean` definitions with `Supplier<T>` are commonly used for lazy bean initialization and conditional bean creation.
- Spring Data's `Specification<T>` API is built on `Predicate` composition (`and`, `or`, `not`) — understanding functional composition is essential for dynamic JPA queries.
- `Function` and `Consumer` are used extensively in Spring's `RestTemplate`/`WebClient` request builder APIs and in `ReactiveStream` operators (Project Reactor's `Mono`/`Flux` operators map directly to these concepts).
:::

---

## 🔗 Review Questions Focus

1. Which functional interface takes no argument and returns a value?
2. What is the difference between `andThen` and `compose` on `Function`?
3. Can a lambda reference a variable that has been modified after the lambda is created?
4. What type does `Predicate.and(other)` return?
5. Write a method reference for `String.valueOf(int)`.
6. What is the difference between `Consumer.andThen` and `Function.andThen`?
7. Can a functional interface have `default` methods?
8. What is the lambda equivalent of `Integer::parseInt`?
9. What happens at compile time if `@FunctionalInterface` has two abstract methods?
10. What is the difference between `UnaryOperator<T>` and `Function<T,T>`?