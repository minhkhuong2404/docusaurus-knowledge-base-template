---
id: chapter-01
title: "Chapter 1 — Building Blocks"
sidebar_label: "Ch 1 · Building Blocks"
description: "Master Java class structure, primitive types, wrapper classes, var, text blocks, garbage collection, and variable scope — the foundation of every OCP Java 21 exam question."
tags:
  - primitives
  - var
  - garbage-collection
  - text-blocks
  - wrapper-classes
  - scope
  - building-blocks
  - exam-foundation
---

# Chapter 1 — Building Blocks

<span class="chapter-badge">Exam Domain: OO Concepts · Primitives</span>

> **Key Topics:** JDK setup, class structure, primitive types, wrapper classes, `var`, text blocks, garbage collection, scope.

---

## 🟦 New Learner: The Fundamentals

### What is the JDK?

The **Java Development Kit (JDK)** is the toolset that lets you write, compile, and run Java programs.

| Tool | What It Does |
|------|-------------|
| `javac` | Compiles `.java` source files into `.class` bytecode |
| `java` | Runs compiled `.class` files via the JVM |
| `jar` | Packages classes into a `.jar` archive |
| `javadoc` | Generates HTML API documentation |

```bash
# Compile a file
javac HelloWorld.java

# Run it
java HelloWorld

# Check your version
java -version
```

---

### Anatomy of a Java Class

Every Java program starts with a class. Here's the order Java requires:

```
1. package declaration  (optional, must be first)
2. import statements    (optional)
3. class declaration    (required)
   ├── fields
   ├── constructors
   └── methods
```

```java
package com.example;           // 1. package

import java.util.List;         // 2. imports

public class Animal {          // 3. class
    private String name;       // field

    public Animal(String name) { // constructor
        this.name = name;
    }

    public String getName() {   // method
        return name;
    }
}
```

:::note[One Public Class Per File]
A `.java` file can only have **one public class**, and its name must match the filename exactly.
:::

---

### Primitive Types

Java has **8 primitive types** — they store values directly, not references.

| Type | Size | Default | Min | Max | Example |
|------|------|---------|-----|-----|---------|
| `boolean` | 1 bit | `false` | — | — | `true` |
| `byte` | 8 bits | `0` | -128 | 127 | `42` |
| `short` | 16 bits | `0` | -32,768 | 32,767 | `1000` |
| `int` | 32 bits | `0` | ~-2B | ~2B | `100_000` |
| `long` | 64 bits | `0L` | ~-9.2Q | ~9.2Q | `100L` |
| `float` | 32 bits | `0.0f` | — | — | `3.14f` |
| `double` | 64 bits | `0.0` | — | — | `3.14` |
| `char` | 16 bits | `\u0000` | 0 | 65,535 | `'A'` |

```java
int million = 1_000_000;   // underscores improve readability
long big = 9_876_543_210L; // L suffix required for long literals
double pi = 3.14_159;
```

:::tip[Numeric Literal Underscores]
You can add `_` anywhere inside a numeric literal **except** at the start, end, or next to a decimal point.  
`1_000` ✅ `_1000` ❌ `1000_` ❌ `3._14` ❌
:::

---

### Wrapper Classes

Every primitive has an **object wrapper** used in collections, generics, and utilities.

| Primitive | Wrapper |
|-----------|---------|
| `int` | `Integer` |
| `double` | `Double` |
| `boolean` | `Boolean` |
| `char` | `Character` |
| `long` | `Long` |

```java
// Autoboxing: primitive → wrapper (automatic)
Integer x = 42;

// Unboxing: wrapper → primitive (automatic)
int y = x;

// Useful static methods
int parsed = Integer.parseInt("123");
String str = Integer.toString(456);
int max = Integer.MAX_VALUE; // 2,147,483,647
```

:::caution[NullPointerException with Unboxing]
```java
Integer val = null;
int x = val; // ❌ NullPointerException at runtime!
```
Always check for `null` before unboxing.
:::

---

### `var` — Local Variable Type Inference

Introduced in Java 10, `var` lets the compiler infer the type from the right-hand side.

```java
var list = new ArrayList<String>(); // inferred: ArrayList<String>
var name = "Duke";                  // inferred: String
var age  = 21;                      // inferred: int
```

**Rules for `var`:**
- Only valid for **local variables** (inside a method)
- Must be initialized at the point of declaration
- Cannot be `null` at initialization (type can't be inferred)
- Cannot be used for method parameters, fields, or return types

```java
var x;       // ❌ not initialized
var y = null; // ❌ type cannot be inferred
```

---

### Text Blocks (Java 15+)

Text blocks let you write multiline strings cleanly.

```java
String json = """
        {
            "name": "Duke",
            "version": 21
        }
        """;
```

Key rules:
- Opening `"""` must be followed by a newline
- Indentation is stripped based on the least-indented line
- Trailing whitespace on each line is stripped automatically

---

### Garbage Collection

Java automatically frees memory via the **Garbage Collector (GC)**. An object becomes eligible for GC when there are no more references to it.

```java
String a = new String("hello"); // object A in heap
a = new String("world");        // object A now eligible for GC
a = null;                       // object B (world) now eligible for GC
```

You **cannot** force GC — `System.gc()` is just a hint. The exam will ask you to identify when objects become eligible.

---

### Variable Scope

| Scope Level | Where Declared | Lifetime |
|-------------|----------------|----------|
| Local | Inside a method/block | Until block ends `}` |
| Instance | Class field | While object lives |
| Class (static) | `static` field | While class is loaded |

```java
public class Demo {
    static int classVar = 10;   // class scope
    int instanceVar = 20;       // instance scope

    public void method() {
        int localVar = 30;      // local scope
        {
            int blockVar = 40;  // inner block scope
        }
        // blockVar not accessible here
    }
}
```

---

## 🟣 Senior Deep Dive

### JVM Memory Model Internals

Understanding where things live helps debug subtle bugs:

| Area | What's Stored | GC'd? |
|------|--------------|-------|
| **Heap** | All `new` objects | Yes |
| **Stack** | Method frames, local variables, references | No (popped on return) |
| **Metaspace** | Class metadata, static fields (Java 8+) | Rarely |
| **String Pool** | Interned string literals | Rarely |

```java
String a = "hello";           // references String Pool
String b = "hello";           // same pool object → a == b is TRUE
String c = new String("hello"); // forces new heap object → a == c is FALSE

System.out.println(a == b);   // true
System.out.println(a == c);   // false
System.out.println(a.equals(c)); // true
```

### Integer Cache

Java caches `Integer` values from **-128 to 127**. This is a classic exam trap:

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b); // true (cached!)

Integer c = 128;
Integer d = 128;
System.out.println(c == d); // false (not cached, different heap objects)
```

### `var` and Diamond Inference Gotcha

```java
// This compiles but loses type safety:
var list = new ArrayList<>();  // inferred as ArrayList<Object>!

// Better: always provide type parameter with var
var list = new ArrayList<String>(); // ArrayList<String>
```

### Numeric Promotion Rules

When mixing types in arithmetic, Java promotes smaller types automatically:

```java
byte b = 10;
short s = 20;
// b + s is promoted to int — you can't assign it to byte/short without cast:
byte result = (byte)(b + s); // explicit cast required

// Widening happens automatically:
int i = 100;
long l = i;     // int → long (widening, safe)
double d = l;   // long → double (widening, safe)

// Narrowing requires explicit cast:
double pi = 3.14;
int truncated = (int) pi; // 3 — fractional part lost!
```

### `final` Variables and Effective Finality

```java
final int x = 10; // true final

// Lambdas and inner classes require variables to be effectively final:
int y = 20; // effectively final (never reassigned)
Runnable r = () -> System.out.println(y); // OK

int z = 30;
z = 40; // z is now NOT effectively final
Runnable r2 = () -> System.out.println(z); // ❌ compile error
```

### Garbage Collection: GC Roots and Reference Types

GC starts from **GC roots** (stack refs, static fields) and marks all reachable objects. Unreachable = eligible for collection.

Java has four reference strengths:

| Type | Import | Collected When |
|------|--------|---------------|
| Strong | default | Never while referenced |
| Soft | `java.lang.ref.SoftReference` | Memory pressure |
| Weak | `java.lang.ref.WeakReference` | Next GC cycle |
| Phantom | `java.lang.ref.PhantomReference` | After finalization |

```java
WeakReference<HeavyObject> weakRef = new WeakReference<>(new HeavyObject());
// HeavyObject may be collected any time weakRef.get() == null
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| Primitive defaults | Only **instance** fields get defaults; local variables must be assigned before use |
| `long` literal | Must end in `L` or `l` (capital L preferred) |
| `float` literal | Must end in `f` or `F` |
| `char` range | 0 to 65,535 (unsigned 16-bit) |
| `var` restrictions | Local variables only, must initialize, not `null` |
| String `==` | Compares references; use `.equals()` for content |
| GC eligibility | Object eligible when zero strong references point to it |
| Integer cache | `-128` to `127` are cached (autoboxed `==` works in this range) |
| Underscore in literals | Allowed inside digits; NOT at start, end, or beside decimal point |
| `boolean` default | Instance field default is `false`; local must be initialized |
| `char` arithmetic | `char` is promoted to `int` in arithmetic expressions |
| Text block indentation | Common leading whitespace is stripped; trailing spaces stripped per line |
| Initialization order | Static fields/blocks → instance fields/blocks → constructor ( superclass first ) |
| `package` | Must be first statement (except comments); directory must match package |
| `import` | Type names only; `import static` for static members |
| Unicode escape in source | `\u000a` is a line terminator — can break tokens if misused |
| `main` method | `public static void main(String[] args)` — varargs `String...` allowed |
| Identifier rules | Can contain letters, digits, `$`, `_`; cannot start with digit |
| Wrapper `valueOf` / `parse` | `Integer.valueOf("10")` vs `Integer.parseInt("10")` → object vs `int` |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 1]
**Trap 1 — Local variable default values:**
```java
void method() {
    int x;
    System.out.println(x); // ❌ COMPILE ERROR — must assign before use
}
// Instance fields DO get defaults (int → 0, boolean → false, Object → null)
```

**Trap 2 — `var` with null:**
```java
var x = null;      // ❌ COMPILE ERROR — type cannot be inferred
var y = (String) null; // ✅ type inferred as String
```

**Trap 3 — Multiple variable declarations with `var`:**
```java
var a = 1, b = 2; // ❌ COMPILE ERROR — var cannot be used in multi-variable declarations
int a = 1, b = 2; // ✅ fine
```

**Trap 4 — Numeric literal underscore rules:**
```java
int a = _1000;   // ❌ starts with underscore
int b = 1000_;   // ❌ ends with underscore
int c = 3._14;   // ❌ next to decimal point
int d = 1_0_0_0; // ✅ valid
```

**Trap 5 — `char` to `int` promotion:**
```java
char c = 'A';
int result = c + 1; // result is 66 (int), NOT 'B'
char next = (char)(c + 1); // explicit cast back to char → 'B'
```

**Trap 6 — Text block opening quotes:**
```java
String s = """hello"""; // ❌ COMPILE ERROR — must have newline after opening """
String s = """
    hello"""; // ✅
```

**Trap 7 — GC eligibility with reassignment:**
```java
StringBuilder a = new StringBuilder("a");
StringBuilder b = new StringBuilder("b");
a = b; // Object "a" is now eligible for GC
// Object "b" is still referenced by both a and b — NOT eligible
```

**Trap 8 — Static initializer runs once (class loading):**
```java
class C {
    static { System.out.print("S"); }
    { System.out.print("I"); }
    C() { System.out.print("C"); }
}
new C(); // S then I then C — instance init runs each new object
```

**Trap 9 — String literal pool:**
```java
String a = "hi";
String b = "hi";
String c = new String("hi");
System.out.println(a == b); // true (pool)
System.out.println(a == c); // false (new object)
```

**Trap 10 — `var` in for-each and try-with-resources:**
```java
for (var x : List.of(1, 2, 3)) { } // OK — inferred as Integer
try (var in = Files.newInputStream(Path.of("f"))) { } // OK
```
:::

### Exam vignettes

```java
// Vignette — locals need definite assignment
int x;
if (Math.random() > 0.5) x = 1;
System.out.println(x); // ❌ may be unassigned
```

:::tip[Spring/Senior Relevance]
- In Spring, understanding `var` scope rules matters when using local variables inside `@Bean` methods or lambda expressions inside `@Component` classes.
- GC knowledge is essential when diagnosing memory leaks in long-running Spring Boot services — weak references and soft references are used extensively in caches like Spring's `ConcurrentReferenceHashMap`.
- The Integer cache trap (`-128` to `127`) often surfaces in JUnit assertions when comparing auto-boxed values returned from service methods.
:::

---

## 🔗 Review Questions Focus

1. What is the output of code that reassigns a reference variable?
2. Which of the following are valid `var` declarations?
3. When is an object eligible for garbage collection?
4. What is the numeric value of a `char` in an arithmetic expression?
5. Which primitive type holds `true`/`false`?
6. What happens when you add two `byte` values without a cast?
7. Can `var` be used as a method parameter? A field? A return type?
8. Which of the following underscore placements in a literal are invalid?
9. What is the default value of an `int` field vs a local `int` variable?
10. Given two `String` objects with the same content, when does `==` return `true`?
