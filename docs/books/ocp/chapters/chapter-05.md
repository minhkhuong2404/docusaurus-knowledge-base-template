---
id: chapter-05
title: "Chapter 5 — Methods"
sidebar_label: "Ch 5 · Methods"
description: "Master Java method design: access modifiers, static vs instance members, static imports, varargs, method overloading resolution order, pass-by-value semantics, and final variable boundaries."
tags:
  - methods
  - access-modifiers
  - overloading
  - varargs
  - pass-by-value
  - static
  - final
---

# Chapter 5 — Methods

<span class="chapter-badge">Exam Domain: Using Object-Oriented Concepts in Java</span>

> **Key Topics:** Method declaration anatomy, method signature components, access modifiers, optional specifiers, return type and return statement rules, identifier naming rules, local and instance variables, `final` and effectively final variables, varargs rules, calling varargs (array vs. list, zero args, `null` parameters), access modifiers in detail (`private`, package-private, `protected`, `public`), protected access across packages (inheritance vs. reference type boundaries), static fields/methods, static initializers, static imports, pass-by-value semantics, method overloading rules, and overload resolution order.

---

## 🟦 New Learner: Designing Methods

### Method Declaration Anatomy

A method declaration defines the contract for how a method is called. It consists of:
1. **Access modifier** *(optional)*
2. **Optional specifiers** *(optional, zero or more)*
3. **Return type** *(required)*
4. **Method name** *(required)*
5. **Parameter list** *(required, but can be empty)*
6. **Exception list** *(optional)*
7. **Method body** *(required, except for abstract/native methods)*

```java
// [access] [specifiers] [returnType] [name]([parameters]) [throws] { [body] }
public static final int calculate(int a, int b) throws ArithmeticException {
    return a + b;
}
```

#### Method Signature
The **method signature** uniquely identifies a method and consists of:
- **Method name**
- **Parameter list** (types and order only; parameter names and return type are **not** part of the signature).

---

### Access Modifiers & Optional Specifiers

Java offers four access levels, which must appear before the return type:

- **`private`**: Accessible only within the same class.
- **Package Access (Default)**: Omit the modifier. Accessible only from classes in the same package.
- **`protected`**: Accessible from classes in the same package or subclasses.
- **`public`**: Accessible from anywhere.

:::danger[Default Access Modifier Trap]
The keyword `default` is used in switch blocks and interfaces, but it is **not** an access modifier:
```java
default void skip() { } // ❌ DOES NOT COMPILE
```
:::

#### Optional Specifiers:
Multiple specifiers can be combined and declared in any order, but must appear before the return type:
- **`static`**: Indicates the method belongs to the class rather than an instance.
- **`final`**: Prevents the method from being overridden in a subclass.
- **`abstract`**: Excludes the method body (used in abstract classes and interfaces).
- Other specifiers: `synchronized`, `native`, `transient`, `volatile`.

---

### Return Types & Return Statements

- If a method returns no value, the return type **must** be declared `void` (it cannot be omitted).
- Methods returning a type other than `void` must have a return statement that evaluates to an assignable type on all execution branches:
  ```java
  int getVal(int a) {
      if (a > 0) return 10;
      // ❌ DOES NOT COMPILE: Missing return statement for the else branch!
  }
  ```
- Constant-looking expressions inside conditional branches still require an explicit fallback return:
  ```java
  String check() {
      if (1 < 2) return "yes";
      // ❌ DOES NOT COMPILE: Compiler does not evaluate 1 < 2 at compile-time for return analysis
  }
  ```

---

### Local and Instance Variables

#### Local Variables
Declared inside a method. The only modifier allowed is `final`.
- **`final` local variables:** Must be initialized before use, but don't need to be initialized at declaration:
  ```java
  final int limit;
  if (check) limit = 10; else limit = 20;
  System.out.println(limit); // ✅ Valid (definitely assigned)
  ```
- **Effectively final:** A variable that is never modified after its initial assignment. You can verify this by adding the `final` keyword; if it still compiles, the variable is effectively final.

#### Instance Variables
Declared at the class level.
- Can use modifiers: `private`, `protected`, `public`, default, `final`, `transient`, `volatile`.
- **`final` instance variables:** Must be initialized when declared, in an instance initializer block, or in the constructor:
  ```java
  public class PolarBear {
      final int age = 10;
      final int fishEaten;
      final String name;
      { fishEaten = 5; } // Instance initializer
      public PolarBear() { name = "Robert"; } // Constructor
  }
  ```

---

### Varargs (Variable Arguments)

Varargs represent a variable-length parameter list.

```java
public void walk(int... steps) {
    System.out.println(steps.length); // steps is treated as int[] inside the method
}
```

#### Rules for Varargs:
1. A method can have **at most one** varargs parameter.
2. The varargs parameter **must be the last parameter** in the parameter list.
```java
void bad1(int... steps, int start) {}   // ❌ DOES NOT COMPILE (not last)
void bad2(int... steps, int... space) {} // ❌ DOES NOT COMPILE (multiple varargs)
```

#### Calling Varargs:
You can pass an array, a comma-separated list of arguments, or omit the argument entirely (Java creates an empty array of length 0):
```java
walk(new int[] {1, 2}); // Passed as array
walk(1, 2, 3);          // Passed as list
walk();                 // Passed as empty array (length = 0)
walk(null);             // Passed as null array reference (throws NullPointerException if dereferenced)
```

---

## 🟣 Senior Deep Dive

### Protected Access Boundaries across Packages

Protected access allows subclasses and classes in the same package to access members. However, accessing `protected` members from a subclass in a **different package** has a strict restriction:

1. **Via Inheritance:** The subclass can access inherited protected members directly or via its own type.
2. **Via Reference Variable:** The subclass **cannot** access protected members using a reference variable of the parent type, nor a reference of a different sibling class.

```java
// Package pond.shore:
package pond.shore;
public class Bird {
    protected String text = "floating";
    protected void floatInWater() {}
}

// Package pond.swan (Different package):
package pond.swan;
import pond.shore.Bird;

public class Swan extends Bird {
    public void swim() {
        floatInWater(); // ✅ Valid (access via inheritance)
        System.out.print(text); // ✅ Valid (access via inheritance)
    }

    public void helpOtherSwan() {
        Swan other = new Swan();
        other.floatInWater(); // ✅ Valid (reference type is Swan, which is the subclass itself)
    }

    public void helpOtherBird() {
        Bird other = new Bird();
        other.floatInWater(); // ❌ DOES NOT COMPILE (reference type is parent Bird, not subclass Swan!)
    }
}
```

---

### Static Members and Static Initializers

- **Static members** (fields/methods) are shared across all instances of a class.
- They can be accessed using the class name or an instance reference:
  ```java
  class Rope { public static int length = 5; }
  
  Rope r = null;
  System.out.println(r.length); // ✅ Valid! Prints 5 without throwing NullPointerException
  ```
- **Static initializers** run once when the class is first loaded by the JVM:
  ```java
  public class Rope {
      public static int LENGTH = 5;
      static { LENGTH = 10; } // Runs once on class load
  }
  ```

#### Static Imports
Used to import static members of a class. Must be written as `import static`, not `static import`:
```java
import static java.util.Collections.sort; // Imports specific static method
import static java.util.Collections.*;    // Imports all static members
// ❌ static import java.util.Collections.*; (invalid order)
// ❌ import static java.util.Collections;   (cannot import a class name using static import)
```

---

### Pass-by-Value Semantics

Java is strictly **pass-by-value**.
- For primitives, a copy of the value is passed. The original variable is unmodified.
- For objects, a copy of the **reference address** is passed. 
  - Modifying the object state via the copied reference **mutates the original object** (visible to the caller).
  - Reassigning the parameter reference to a new object **does not affect the caller's reference**.

```java
public class ValueTest {
    public static void work(StringBuilder a, StringBuilder b) {
        a = new StringBuilder("a"); // Reassigned (ignored by caller)
        b.append("b");              // Mutated (visible to caller)
    }
    public static void main(String[] args) {
        var s1 = new StringBuilder("s1");
        var s2 = new StringBuilder("s2");
        work(s1, s2);
        System.out.println(s1); // s1 (unmodified reference)
        System.out.println(s2); // s2b (mutated state)
    }
}
```

---

### Method Overloading & Resolution Order

Overloaded methods share a name but have different parameter lists. Return type and access modifiers are not checked during overload resolution.

#### Overload Resolution Order:
1. **Exact match** (by type).
2. **Larger primitive type** (widening, e.g., `int` -> `long` -> `float` -> `double`).
3. **Autoboxed type** (boxing/unboxing, e.g., `int` -> `Integer`).
4. **Varargs** (e.g., `int...`).

```java
public class Run {
    static void execute(int num)     { System.out.print("int "); }
    static void execute(Integer num) { System.out.print("Integer "); }
    static void execute(long num)    { System.out.print("long "); }
    static void execute(int... nums) { System.out.print("varargs "); }

    public static void main(String[] args) {
        execute(100);  // Prints "int" (Exact match)
        // If execute(int) is removed:
        // execute(100) -> Prints "long" (Widening preferred over Autoboxing!)
    }
}
```

:::warning[Double Promotion Restrictions]
Java cannot perform a double-step promotion (e.g., boxing and then widening) in a single overload call:
```java
void print(Long x) {}
// Calling print(5) where 5 is int:
// ❌ DOES NOT COMPILE (cannot box int to Integer, then widen to Long)
```
:::

---

## 📝 Exam Quick Reference

### Rules & Restrictions Summary

| Topic | Critical Fact |
|-------|---------------|
| **Method Signature** | Consists of the method name and parameter types/order. Return type is excluded. |
| **`default` Keyword** | Not an access modifier. Used only in interfaces and switch statements. |
| **`final` Instance Fields** | Must be initialized at declaration, in an instance initializer block, or in all constructors. |
| **Protected access** | A subclass in a different package cannot access a protected member via a parent reference. |
| **Varargs limit** | At most one per method. Must be the last parameter in the list. |
| **Static Reference** | Calling a static method on a `null` variable reference works without throwing NPE. |
| **Static Imports** | Syntactically declared as `import static`. Cannot import class names. |
| **Overloading Resolution** | Exact Match > Widening > Autoboxing > Varargs. |
| **Pass-by-Value** | Reassignment of reference parameters inside a method has no effect on the caller. |
| **Unreachable Code** | Writing code that is mathematically or logically unreachable triggers compile-time errors. |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 5]
**Trap 1 — Return types in overloaded signatures:**
```java
public int calculate(int a) { return 0; }
public void calculate(int a) {} // ❌ DOES NOT COMPILE (duplicate method signature)
```

**Trap 2 — `static import` declaration syntax:**
```java
static import java.util.Arrays.*; // ❌ DOES NOT COMPILE (must be import static)
```

**Trap 3 — Widening vs. Autoboxing choice:**
```java
void test(long x) { System.out.println("long"); }
void test(Integer x) { System.out.println("Integer"); }
test(5); // prints "long" (widening int -> long beats boxing int -> Integer)
```

**Trap 4 — Static context accessing instance fields:**
```java
public class Test {
    int value = 10;
    public static void main(String[] args) {
        System.out.println(value); // ❌ DOES NOT COMPILE (static context cannot access instance field)
    }
}
```

**Trap 5 — Ambiguous null overloads:**
```java
void method(Integer x) {}
void method(String x) {}
method(null); // ❌ DOES NOT COMPILE (ambiguous call)
```

**Trap 6 — Varargs vs. Array overloads:**
```java
void fly(int[] x) {}
void fly(int... x) {} // ❌ DOES NOT COMPILE (duplicate method signature - both compile to int[])
```

**Trap 7 — Protected access with Parent reference in different packages:**
```java
// Parent class has protected void m()
// Subclass in different package cannot run: Parent p = new Subclass(); p.m();
```

**Trap 8 — Effectively final variable reassignment:**
```java
int x = 5;
x = 10;
Runnable r = () -> System.out.println(x); // ❌ DOES NOT COMPILE (x is not effectively final)
```

**Trap 9 — Changing parameters in pass-by-value:**
```java
void change(int value) { value = 10; }
int val = 5;
change(val); // val remains 5
```

**Trap 10 — Initializing static final fields:**
`static final` fields must be initialized when declared or in a `static` initializer block. They **cannot** be initialized in constructors.
:::

### Exam Vignettes

```java
// Vignette: Nested static imports conflict
import static java.lang.Integer.MAX_VALUE;
import static java.lang.Long.MAX_VALUE;
// System.out.println(MAX_VALUE); // ❌ DOES NOT COMPILE (ambiguous import)
```

:::tip[Spring/Senior Relevance]
- **Spring Transaction AOP:** Adding `@Transactional` on a non-public method (e.g. package-private or private) fails silently because Spring's CGLIB proxying only wraps public methods by default.
- **Factory Beans:** Static factory methods are used in Spring Configuration classes (`@Bean`) to control instantiation logic, similar to Date-Time's factory pattern.
:::

---

## 🔗 Review Questions Focus

1. **Overload resolution hierarchies:** Predict outputs when a call matches widening vs. boxing vs. varargs.
2. **Access modifier scopes:** Recognize class visibility limits across package boundaries.
3. **Protected boundaries:** Catch invalid accesses of protected members via parent reference variables.
4. **Static import validations:** Identify compile-time failures from poorly ordered static imports.
5. **Pass-by-value mutations:** Trace state updates to objects passed to methods vs. reference reassignments.
6. **Effectively final calculations:** Scan variables in lambda scopes to verify they are not reassigned.
7. **Varargs parameter layout:** Spot compile failures from varargs parameters that are not at the end of the signature.
8. **Constant field initialization:** Identify missing static or instance final field initializations.
9. **Ambiguous overloads:** Point out calls that fail to compile due to matching multiple overloaded wrappers with `null`.
10. **Constructor chaining limits:** Detect recursive loops or multiple calls to `this()`/`super()` in constructors.
