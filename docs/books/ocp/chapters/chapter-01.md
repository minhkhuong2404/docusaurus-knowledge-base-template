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

> **Key Topics:** JDK environment, single-file launch, class structure, comments, packages & imports, compiling & classpath, constructors, initializers, order of initialization, primitive types, literals, wrappers, text blocks, variable declarations, `var`, scope, garbage collection.

---

## 🟦 New Learner: The Fundamentals

### The Java Environment & Single-File Source Code

The **Java Development Kit (JDK)** is the toolset for compiling and running Java programs. 

| Tool | Input | Output | What It Does |
|------|-------|--------|-------------|
| `javac` | `.java` source file | `.class` bytecode | Compiles source files into platform-independent bytecode |
| `java` | `.class` file (no extension) OR `.java` file (single-file launch) | Console/Execution | Launches the JVM and runs the program |
| `jar` | Collection of files | `.jar` archive | Packages classes and assets together |
| `javadoc` | `.java` source files | HTML files | Generates API documentation |

```bash
# Standard compilation and execution
javac Zoo.java
java Zoo

# Check version
java -version
javac -version
```

:::note[Single-File Source-Code Launcher]
Since Java 11, you can compile and run single-file programs in one step.
```bash
# Compilation is skipped explicitly; the file extension must be included:
java Zoo.java Bronx Zoo
```
This is useful for small testing scripts. Parameters (`Bronx`, `Zoo`) are passed directly to the `main()` method.
:::

---

### Anatomy of a Java Class & Comments

Every Java program is built of classes. The order of elements in a `.java` file must follow **PIC** (Picture):
1. **P**ackage declaration *(optional, must be the first non-comment statement)*
2. **I**mport statements *(optional)*
3. **C**lass declaration *(required)*

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

#### Rules for Class Declarations:
- A `.java` file can have **at most one public class**, and its name must match the filename exactly.
- Multiple non-public classes can exist in the same file.

#### Comments in Java:
1. **Single-line:** `// comment`
2. **Multi-line:** `/* comment */`
3. **Javadoc:** `/** comment */`

:::danger[Nested Comments Trap]
You **cannot** nest multi-line comments.
```java
/*
 * /* nested comment */
 */ // ❌ DOES NOT COMPILE: The first occurrence of */ terminates the entire comment!
```
:::

---

### Package Declarations, Imports, and Conflicts

#### Package Conventions
Package names are hierarchical, separated by periods (`.`). Reverse domain names (e.g., `com.wiley.javabook`) are used to prevent conflicts.

#### Imports and Wildcards
- `import package.*;` imports **only classes** directly in that package.
- It **does not** import child packages, methods, or fields.
```java
import java.util.*;            // Imports java.util.Random
import java.util.concurrent.*; // Required to import java.util.concurrent.ExecutorService
```

#### Redundant Imports
1. **`java.lang`**: Automatically imported by the compiler. Explicit imports like `import java.lang.System;` are redundant.
2. **Same package**: Classes in the same package are automatically visible to each other.
3. **Explicit overrides**: Importing `java.util.Random` and then `java.util.*` makes the latter redundant for `Random`.

#### Naming Conflicts
If two packages contain classes with the same name (e.g., `java.util.Date` and `java.sql.Date`), importing both via wildcards causes a compilation error if you refer to `Date` without full qualification:
```java
import java.util.*;
import java.sql.*;

public class Conflicts {
    Date date; // ❌ DOES NOT COMPILE: Reference is ambiguous
}
```
**Precedence Rule:** An explicit class import takes precedence over a wildcard import:
```java
import java.util.Date; // Takes precedence
import java.sql.*;

public class Conflicts {
    Date date; // ✅ Compiles; refers to java.util.Date
}
```
If you must use both in the same file, use their **fully qualified class names**:
```java
java.util.Date date1;
java.sql.Date date2;
```

---

### Compiling and Running with Packages

When compiling code organized in packages, the directory structure must match the package names.

```bash
# Directory structure:
# C:\temp\packagea\ClassA.java
# C:\temp\packageb\ClassB.java

# Compiling from C:\temp:
javac packagea/ClassA.java packageb/ClassB.java

# Compiling to a target directory (-d):
javac -d classes packagea/ClassA.java packageb/ClassB.java

# Running using classpath (-cp, -classpath, or --class-path):
java -cp classes packageb.ClassB
```

---

### Creating Objects & Constructors

To create an instance of a class, write `new` followed by the constructor call.
```java
Animal a = new Animal("Lion");
```
A **constructor** is a special method used to initialize a new object:
- Its name **must match the class name** exactly.
- It **must not have a return type** (not even `void`).

:::warning[Capitalized Methods are NOT Constructors]
```java
public class Chick {
    public void Chick() { } // ✅ A regular method, NOT a constructor!
}
```
This compiles but will not be called when you write `new Chick()`.
:::

---

### Initializers & Order of Initialization

Classes can contain initialization code in three places:
1. **Field declaration inline:** `int num = 10;`
2. **Instance initializer blocks:** `{ System.out.println("Init"); }` (braces outside any method)
3. **Constructors:** `public ClassName() { ... }`

#### Order of Execution when a class is instantiated:
1. **Static fields and static initializers** run in order of appearance (only once, when the class is first loaded by the JVM).
2. **Instance fields and instance initializers** run in the order they appear in the file.
3. **The constructor** runs last.

:::danger[Forward Reference Trap]
You cannot refer to an instance variable in an initializer block if that block appears before the variable is declared:
```java
{ System.out.println(name); } // ❌ DOES NOT COMPILE
private String name = "Fluffy";
```
:::

---

### Primitive Types

Java has **8 primitive types** storing values directly in memory.

| Type | Size | Default (Instance) | Range / Value Representation | Example |
|------|------|-------------------|-----------------------------|---------|
| `boolean` | JVM dep | `false` | `true` or `false` | `true` |
| `byte` | 8 bits | `0` | `-128` to `127` (signed) | `100` |
| `short` | 16 bits | `0` | `-32,768` to `32,767` (signed) | `20000` |
| `int` | 32 bits | `0` | ~-2B to ~2B (signed) | `100_000` |
| `long` | 64 bits | `0L` | ~-9.2Q to ~9.2Q (signed) | `123456789L` *(L suffix required for literals out of int range)* |
| `float` | 32 bits | `0.0f` | IEEE 754 floating-point | `3.14f` *(f/F suffix required)* |
| `double` | 64 bits | `0.0` | IEEE 754 floating-point | `3.14` |
| `char` | 16 bits | `\u0000` | `0` to `65,535` (unsigned Unicode) | `'A'`, `97` |

#### Numeric Bases
- **Octal:** Starts with `0` (e.g., `017` = 15).
- **Hexadecimal:** Starts with `0x` or `0X` (e.g., `0xFF` = 255).
- **Binary:** Starts with `0b` or `0B` (e.g., `0b10` = 2).

#### Underscore Rules in Literals
Underscores `_` can be added to numeric literals to improve readability, but **cannot** be placed:
- At the start or end of a literal.
- Adjacent to a decimal point.
- Before an `L`, `f`, or `F` suffix.
```java
double d1 = 1_000.00;  // ✅ Valid
double d2 = _100.0;    // ❌ Invalid (starts with underscore)
double d3 = 100._0;    // ❌ Invalid (next to decimal point)
double d4 = 100.0_;    // ❌ Invalid (ends with underscore)
```

---

### Wrapper Classes & String Conversion

Every primitive type has a corresponding object wrapper class.

| Primitive | Wrapper | String Parse Method | ValueOf Method |
|-----------|---------|---------------------|----------------|
| `boolean` | `Boolean` | `Boolean.parseBoolean("true")` | `Boolean.valueOf("true")` |
| `byte` | `Byte` | `Byte.parseByte("1")` | `Byte.valueOf("1")` |
| `short` | `Short` | `Short.parseShort("1")` | `Short.valueOf("1")` |
| `int` | `Integer` | `Integer.parseInt("1")` | `Integer.valueOf("1")` |
| `long` | `Long` | `Long.parseLong("1")` | `Long.valueOf("1")` |
| `float` | `Float` | `Float.parseFloat("1.0f")` | `Float.valueOf("1.0f")` |
| `double` | `Double` | `Double.parseDouble("1.0")` | `Double.valueOf("1.0")` |
| `char` | `Character` | — | — |

#### ValueOf and Bases
`Byte`, `Short`, `Integer`, and `Long` support an overloaded `valueOf(String, int base)` method:
```java
Integer x = Integer.valueOf("A", 16); // 10
Integer y = Integer.valueOf("11", 8); // 9
```

#### Boolean valueOf Traps
`Boolean.valueOf(String)` is case-insensitive. It returns `true` only if the String equals `"true"` (e.g., `"TrUe"`). For **any other value**, including `null`, it returns `false`:
```java
Boolean b1 = Boolean.valueOf("TrUe");     // true
Boolean b2 = Boolean.valueOf("kangaroo"); // false
Boolean b3 = Boolean.valueOf(null);       // false
```

---

### Local Variable Type Inference (`var`)

Introduced in Java 10, `var` lets the compiler infer a local variable's type based on the initialization value.

```java
var list = new ArrayList<String>(); // Inferred as ArrayList<String>
var number = 10;                     // Inferred as int
```

#### Rules for `var`:
1. **Local variables only:** Cannot be used for fields, constructor parameters, method parameters, or return types.
2. **Must be initialized on the same line:**
   ```java
   var x; // ❌ DOES NOT COMPILE: Cannot infer type without initialization
   ```
3. **Cannot initialize to `null` directly:**
   ```java
   var y = null; // ❌ DOES NOT COMPILE: Type cannot be inferred
   var z = (String) null; // ✅ Valid (inferred as String)
   ```
4. **Cannot be used in multiple variable declarations:**
   ```java
   var a = 1, b = 2; // ❌ DOES NOT COMPILE
   ```
5. **Reassignment rules:** You cannot assign a different type to an inferred variable later.
   ```java
   var num = 10;
   num = "five"; // ❌ DOES NOT COMPILE (num is statically typed as int)
   ```
6. **`var` is a reserved type name, not a reserved word:** You can declare a variable or method named `var`, but you cannot name a class or interface `var`.
   ```java
   public void var() {
       var var = "var"; // ✅ Compiles (but highly discouraged!)
   }
   ```

---

### Text Blocks

Introduced in Java 15, text blocks allow multiline strings without escape sequences.

```java
String json = """
        {
            "name": "Duke",
            "version": 21
        }
        """;
```

#### Rules for Text Blocks:
- The opening `"""` must be followed immediately by a newline.
  ```java
  String block = """hello"""; // ❌ DOES NOT COMPILE
  ```
- **Incidental vs. Essential Whitespace:** Java calculates the leftmost non-whitespace character (or the position of the closing `"""` if on its own line) to determine the indent line. Everything to the left is stripped (incidental), and everything to the right is kept (essential).
- **Escape Sequences:**
  - `\` prevents a newline.
  - `\s` preserves trailing spaces.
  ```java
  String block = """
          doe \
          deer"""; // Inferred: "doe deer" (1 line)
  ```

---

### Variable Scope

Scope is the region of a program where a variable is accessible.

| Scope Level | Declaration Area | Lifetime |
|-------------|------------------|----------|
| **Local Variable** | Inside a block/method/constructor | From declaration until the enclosing block ends `}` |
| **Method Parameter** | Method signature | For the duration of the method |
| **Instance Variable** | Class block (non-static) | From object creation until the object is garbage collected |
| **Class Variable** | Class block (`static`) | From declaration until the program ends |

```java
public class ScopeTest {
    static int classVar = 10; // Class scope
    int instanceVar = 20;     // Instance scope

    public void run(int param) { // param: Method parameter scope
        int local = 30;          // Local scope
        if (param > 0) {
            int blockVar = 40;   // Block scope (only inside this if)
        }
        // blockVar is out of scope here
    }
}
```

---

### Garbage Collection

The JVM automatically reclaims heap memory by destroying unreachable objects.

#### Eligibility for GC:
An object is eligible for garbage collection when it is no longer reachable. This happens when:
- It has **zero references** pointing to it.
- All references pointing to it have **gone out of scope**.

:::warning[System.gc()]
`System.gc()` suggests that the JVM run the garbage collector. It is **not guaranteed** to run immediately or at all.
:::

---

## 🟣 Senior Deep Dive

### JVM Memory Model Internals

A developer must understand where items are allocated to prevent memory leaks and predict behavior.

```
       [ STACK ]                          [ HEAP ]
+---------------------+           +------------------------+
| main() frame        |           |                        |
|   a: reference  ----+-----------+---> "hello" (Pool)     |
|   b: reference  ----+-----------+---/                    |
|   c: reference  ----+-----------+---> [ String Object ]  |
+---------------------+           |       value: "hello"   |
                                  +------------------------+
```

1. **Stack:** Stores local variables, reference variables, and method call frames. Allocated per thread and popped automatically when the method returns. No GC occurs here.
2. **Heap:** Stores all objects (including arrays and wrapper objects). Garbage collected.
3. **Metaspace:** Stores class metadata, bytecode, and static variables.
4. **String Pool:** A special region in the heap that caches string literals to optimize memory.

---

### Integer Cache Trap

Java caches boxed `Integer` values between **-128 and 127**. In this range, autoboxing uses the cache, so references point to the same object:

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b); // true (cached, same reference)

Integer c = 128;
Integer d = 128;
System.out.println(c == d); // false (not cached, different heap objects)
System.out.println(c.equals(d)); // true (value comparison)
```

---

### Numeric Promotion Rules

Java automatically promotes operands to a wider type:
1. If two values have different data types, Java automatically promotes the smaller to the larger type.
2. If one of the values is integral and the other is floating-point, Java promotes the integral value to floating-point.
3. **Unary promotion:** Smaller integral types (`byte`, `short`, `char`) are automatically promoted to `int` when used in arithmetic operations, even if neither operand is an `int`.

```java
byte b = 10;
short s = 20;
// byte + short is promoted to int:
short result1 = b + s;         // ❌ DOES NOT COMPILE
short result2 = (short)(b + s); // ✅ Valid with explicit cast
```

---

### `final` vs. Effective Finality

- **`final` variable:** Assigned exactly once and cannot be changed.
- **Effectively final:** A variable whose value is never modified after initialization, even if the `final` keyword is omitted. This is crucial for lambdas and local classes:

```java
int x = 10;
Runnable r1 = () -> System.out.println(x); // ✅ Valid (x is effectively final)

int y = 20;
y = 30; // y is modified
Runnable r2 = () -> System.out.println(y); // ❌ DOES NOT COMPILE (y is not effectively final)
```

---

### Reference Strengths

Java supports four types of references to manage GC interaction:

| Reference Type | Class | GC Collection Rule | Common Use Case |
|----------------|-------|--------------------|-----------------|
| **Strong** | Standard types | Never while reference is reachable | General development |
| **Soft** | `SoftReference` | Collected only when heap is full (out of memory pressure) | Memory-sensitive caches |
| **Weak** | `WeakReference` | Collected during the next GC cycle regardless of memory | Metadata maps (e.g., `WeakHashMap`) |
| **Phantom** | `PhantomReference` | Collected after object is finalized; placed in queue | Post-mortem cleanup actions |

---

## 📝 Exam Quick Reference

### Rules & Restrictions Summary

| Topic | Critical Fact |
|-------|---------------|
| **Identifier Rules** | Must start with letter, `$`, or `_`. Cannot start with digit. Single `_` is invalid. |
| **Numeric Promotion** | `byte` + `byte` = `int`. Cast required to assign back to `byte`. |
| **`char` values** | Unsigned 16-bit (`0` to `65,535`). Promotes to `int` in arithmetic. |
| **Floating Points** | Literals with decimals default to `double`. Use `f`/`F` for `float`. |
| **Instance Defaults** | Primitives: `0`, `0.0`, `false`. Objects: `null`. Local variables do not get defaults. |
| **`var` Scope** | Local variables only. Cannot be used as instance fields or parameter types. |
| **`var` Diamond** | `var list = new ArrayList<>();` infers `ArrayList<Object>`. Provide type parameters. |
| **Text Block Newline** | Opening `"""` must be followed by a newline immediately. |
| **`Boolean.valueOf`** | Returns `false` for invalid text and `null`. Only `"true"` (case-insensitive) returns `true`. |
| **`System.gc()`** | Just a hint; does not guarantee garbage collection. |

---

## 🚨 Extra Exam Tips

:::danger[Top 10 Traps in Chapter 1]
**Trap 1 — Local variable default values:**
```java
void test() {
    int x;
    System.out.println(x); // ❌ DOES NOT COMPILE (local variable x must be initialized before use)
}
```

**Trap 2 — `var` multiple assignment:**
```java
var x = 1, y = 2; // ❌ DOES NOT COMPILE
```

**Trap 3 — Invalid underscores:**
```java
double d1 = 1_00_.0; // ❌ DOES NOT COMPILE (underscore adjacent to decimal)
double d2 = 100._0;  // ❌ DOES NOT COMPILE
double d3 = 100.0_;  // ❌ DOES NOT COMPILE (ends literal)
```

**Trap 4 — Branch initialization of local variables:**
```java
int x;
if (Math.random() > 0.5) {
    x = 1;
}
System.out.println(x); // ❌ DOES NOT COMPILE (x might not have been initialized)
```

**Trap 5 — Capitalized regular methods vs. constructors:**
```java
public class Bear {
    public void Bear() {} // Method, not constructor (has return type void)
}
```

**Trap 6 — Text block closing line break:**
```java
String block1 = """
        hello"""; // No line break at end
String block2 = """
        hello
        """;      // Includes line break at end
```

**Trap 7 — Single underscore identifier:**
```java
int _ = 10; // ❌ DOES NOT COMPILE in modern Java versions (reserved keyword)
```

**Trap 8 — Autoboxing NullPointerException:**
```java
Integer value = null;
int primitive = value; // ❌ Compiles, but throws NullPointerException at runtime!
```

**Trap 9 — Wildcard imports don't match child packages:**
```java
import java.util.*;
// Using AtomicInteger from java.util.concurrent.atomic:
AtomicInteger ai; // ❌ DOES NOT COMPILE
```

**Trap 10 — Static initializers order:**
Static blocks run once when the class is loaded. Instance blocks run every time a new object is created, before the constructor.
:::

### Exam Vignettes

```java
// Vignette: Identifying GC eligibility
public class GCTest {
    private GCTest partner;
    public static void main(String[] args) {
        GCTest a = new GCTest();
        GCTest b = new GCTest();
        a.partner = b;
        b.partner = a;
        a = null; // Object A is still referenced by b.partner
        b = null; // Both A and B are now unreachable (island of isolation) -> both eligible for GC
    }
}
```

:::tip[Spring/Senior Relevance]
- **`var` in Spring Boot:** Useful in controllers/services to declare local variables without verbose generic declarations (e.g., `var users = userRepository.findAll();`).
- **Memory leaks in Spring:** Incorrectly retaining references to transient objects in static fields or context holders prevents garbage collection, leading to OutOfMemoryErrors.
- **Caching & Reference Strengths:** Spring uses `SoftReference` or `WeakReference` structures inside `ConcurrentReferenceHashMap` to cache metadata without holding onto strong references.
:::

---

## 🔗 Review Questions Focus

1. **Valid identifiers:** Understand that currency signs, letters, numbers, and `_` are allowed, but numbers cannot start them, and `_` alone is forbidden.
2. **Order of declarations:** Know **PIC** (package -> import -> class).
3. **`valueOf` vs `parseInt`:** `parseInt` returns primitive `int`; `valueOf` returns wrapper `Integer`.
4. **Text block spaces:** Understand how `\s` and `\` affect whitespace and newlines.
5. **Autoboxing and GC:** Be able to trace reference mutations to determine exact line numbers where objects become eligible for GC.
6. **Constructor signatures:** Identify how regular methods look when named identically to class names.
7. **Numeric promotions:** Know that operations on `byte`, `short`, and `char` result in `int`.
8. **Wrapper caching:** Remember the `-128` to `127` cache for `Integer`, `Byte`, `Short`, `Long`, and `Character`.
