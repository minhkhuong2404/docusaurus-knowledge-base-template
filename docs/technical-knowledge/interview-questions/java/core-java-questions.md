---
id: java-interview-questions
title: Core Java Interview Questions
sidebar_label: Java Interview
description: "Frequently asked Core Java interview questions covering language fundamentals and JVM behavior."
tags: [java, interview, core-java, backend]
---

# Top Core Java Interview Questions & Answers

These questions cover fundamental Java concepts frequently asked in technical interviews, with answers expanded to senior-level depth.

## 1. Why is Java not a purely Object-Oriented language?

Java is not considered 100% object-oriented because it supports **primitive data types** like `int`, `char`, `float`, `double`, `boolean`, `byte`, `short`, and `long`. In a purely object-oriented language, everything should be an object.

### Why do primitives exist at all?

Performance. Primitives live directly on the **stack** (or inline in object fields), whereas wrapper objects (`Integer`, `Double`, etc.) are heap-allocated. Accessing a primitive is a single memory read; accessing a wrapper requires pointer dereferencing, cache misses, and GC pressure. For tight loops processing millions of values, this difference is enormous.

### The trade-off in modern Java

Java provides **autoboxing/unboxing** (since Java 5) to bridge the gap:
```java
Integer boxed = 42;        // autoboxing: int → Integer
int unboxed = boxed;       // unboxing: Integer → int
```

**Production gotcha:** Autoboxing in hot loops silently creates millions of short-lived `Integer` objects, increasing GC pressure. Always use primitives for performance-critical code paths. Also beware of `Integer` cache: values between `-128` and `127` are cached, so `==` works for those values but fails for larger ones.

```java
Integer a = 127, b = 127;
System.out.println(a == b);  // true (cached)

Integer c = 128, d = 128;
System.out.println(c == d);  // false (different objects!)
```

## 2. What makes Java platform independent?

Java's independence comes from its **bytecode**. When you compile a Java program, the compiler converts the source code into bytecode (`.class` files) rather than machine-specific native code. This bytecode can run on any operating system (Windows, Linux, Mac) provided the system has a **Java Virtual Machine (JVM)** to interpret it.

### Under the Hood

The key insight is that **Java is platform-independent, but the JVM is not**. Each OS has its own JVM implementation (HotSpot for Oracle, OpenJ9 for IBM, etc.) that translates the universal bytecode into platform-specific machine instructions. The bytecode format is standardized by the **JVM Specification**, ensuring consistent behavior across all compliant JVMs.

### The Bytecode Format

A `.class` file starts with the magic number `0xCAFEBABE` and contains:
- **Constant Pool** — all literals, class/method references
- **Access Flags** — public, final, abstract, etc.
- **Method bytecode** — stack-based instructions (e.g., `iload`, `iadd`, `invokevirtual`)

This standardized binary format is what makes "Write Once, Run Anywhere" possible.

## 3. Why is Java both interpreted and compiled?

Java uses a **two-step execution process** with an adaptive optimization strategy:

1. **Ahead-of-Time Compilation:** The `javac` compiler converts source code (`.java`) into bytecode (`.class`).
2. **Interpretation + JIT:** The JVM initially **interprets** bytecode line-by-line. As it runs, a profiler identifies **hot spots** — methods or loops executed thousands of times.

### JIT Tiered Compilation (Java 8+)

Modern HotSpot JVM uses **tiered compilation** with 5 levels:

| Level | Compiler | Description |
|:------|:---------|:------------|
| 0 | Interpreter | Pure interpretation, collects profiling data |
| 1 | C1 (Client) | Simple optimizations, no profiling |
| 2 | C1 | With invocation/backedge counters |
| 3 | C1 | Full profiling (type checks, branch frequencies) |
| 4 | C2 (Server) | Aggressive optimizations (inlining, escape analysis, loop unrolling) |

**Key optimizations by C2:**
- **Method inlining:** Eliminates method call overhead by embedding the callee's code into the caller
- **Escape analysis:** If an object doesn't escape a method, it can be **stack-allocated** (avoiding heap/GC)
- **Loop unrolling:** Reduces loop overhead by duplicating the loop body
- **Dead code elimination:** Removes code paths that are never executed

**Production tip:** Use `-XX:+PrintCompilation` to see which methods are JIT-compiled in your application.

## 4. Why are Strings immutable in Java?

Strings are immutable (cannot be changed once created) for several critical reasons:

* **String Pool Sharing:** The JVM maintains a **String Constant Pool** where identical string literals share the same memory. If strings were mutable, changing one reference would corrupt all others pointing to the same object.
* **Security:** Strings are used for sensitive parameters like file paths, network connections, class names, and database URLs. Immutability ensures these values cannot be altered after validation — imagine a filename being changed between a security check and the actual file operation (a TOCTOU attack).
* **Hashcode Caching:** The `hashCode()` of a String is computed once and cached in a private `int hash` field. Since the value never changes, this makes Strings extremely efficient as `HashMap` keys — the hashcode is computed once and reused for every lookup.
* **Thread Safety:** Immutable objects are inherently thread-safe. Multiple threads can read the same String without synchronization.

### Under the Hood (Java 9+ Compact Strings)

Before Java 9, Strings were backed by `char[]` (2 bytes per character, UTF-16). Java 9 introduced **Compact Strings** (`-XX:+CompactStrings`, on by default):
- Strings containing only Latin-1 characters use a `byte[]` with 1 byte per character (LATIN1 encoding)
- Strings with non-Latin characters use `byte[]` with 2 bytes per character (UTF-16 encoding)
- A `coder` field (byte) tracks which encoding is used

This reduced String memory footprint by ~40% in typical enterprise applications.

## 5. What is a Marker Interface?

A Marker Interface is an interface that **does not contain any methods or fields**. Examples include `Serializable`, `Cloneable`, and `Remote`. They serve as a "tag" to inform the JVM or a framework that the implementing class has a specific behavior or capability.

### How does it work internally?

The JVM uses `instanceof` checks at runtime. For example, `ObjectOutputStream.writeObject()` checks:
```java
if (!(obj instanceof Serializable)) {
    throw new NotSerializableException(obj.getClass().getName());
}
```

### Marker Interfaces vs. Annotations

Since Java 5, **annotations** have largely replaced marker interfaces for new designs:

| Feature | Marker Interface | Annotation |
|:--------|:----------------|:-----------|
| **Compile-time type checking** | ✅ Can be used in method signatures | ❌ Cannot constrain method parameters |
| **Scope control** | ❌ Applies to entire class | ✅ Can target methods, fields, parameters |
| **Metadata** | ❌ No additional data | ✅ Can carry attributes |
| **Example** | `Serializable` | `@Deprecated`, `@FunctionalInterface` |

**When to use which:** If you need to define a type that can be used in method signatures (e.g., accepting only `Serializable` objects), use a marker interface. For everything else, prefer annotations.

## 6. Can we override a static method?

**No.** If you define a static method with the same signature in a subclass, it is known as **method hiding**, not method overriding.

### The Key Difference: Binding

* **Static methods** → **Static binding (compile-time)**. The compiler decides which method to call based on the **reference type**.
* **Instance methods** → **Dynamic binding (runtime)**. The JVM decides which method to call based on the **actual object type** via the virtual method table (vtable).

```java
class Parent {
    static void greet() { System.out.println("Parent"); }
    void hello()        { System.out.println("Parent"); }
}

class Child extends Parent {
    static void greet() { System.out.println("Child"); }  // HIDING
    void hello()        { System.out.println("Child"); }   // OVERRIDING
}

Parent ref = new Child();
ref.greet();  // "Parent" — static binding, resolved at compile time
ref.hello();  // "Child"  — dynamic binding via vtable at runtime
```

**Interview follow-up:** Static methods are not part of the vtable, so polymorphism doesn't apply to them. This is why `@Override` on a static method causes a compilation error.

## 7. What is the difference between `final`, `finally`, and `finalize`?

* **`final`:** A keyword with three uses:
  - **Variable:** Makes a constant (primitive) or immutable reference (object). The object's fields can still be mutated unless they are also `final`.
  - **Method:** Prevents overriding in subclasses. The JIT compiler can aggressively inline final methods.
  - **Class:** Prevents inheritance (e.g., `String`, `Integer`).

* **`finally`:** A block in `try-catch-finally` that is guaranteed to execute whether an exception is thrown or not. Used for resource cleanup (closing streams, releasing locks).
  - **Exception:** `finally` does NOT execute if `System.exit()` is called or if the JVM crashes.
  - **Modern alternative:** Use **try-with-resources** (Java 7+) for `AutoCloseable` resources instead of manual `finally` blocks.

* **`finalize()`:** A protected method in `Object` that the GC calls before reclaiming an object. **Deprecated since Java 9** and removed in Java 18.
  - **Why deprecated:** Unpredictable execution timing, performance overhead (objects with finalizers require two GC cycles), and risk of object resurrection.
  - **Modern alternative:** Use `java.lang.ref.Cleaner` (Java 9+) or `try-with-resources`.

## 8. How do you create an Immutable Class?

To create a custom immutable class, follow these five rules:

1. Declare the class as `final` so it cannot be extended (a subclass could add mutable state).
2. Make all fields `private` and `final`.
3. Do not provide any "setter" methods.
4. Initialize all fields through a constructor.
5. If the class contains mutable objects (e.g., `Date`, `List`), perform **defensive copies** in the constructor and getter methods.

```java
public final class Employee {
    private final String name;
    private final List<String> skills;

    public Employee(String name, List<String> skills) {
        this.name = name;
        // Defensive copy — don't store the caller's reference
        this.skills = new ArrayList<>(skills);
    }

    public String getName() { return name; }

    public List<String> getSkills() {
        // Return a copy — don't expose internal state
        return Collections.unmodifiableList(skills);
    }
}
```

**Why defensive copies matter:** Without them, the caller can mutate the internal list through their original reference, breaking immutability. This is a common interview follow-up question.

**Modern alternative (Java 14+):** Use **Records** for simple immutable data carriers:
```java
public record Employee(String name, List<String> skills) {
    public Employee {  // Compact constructor for defensive copy
        skills = List.copyOf(skills);
    }
}
```

## 9. What is a Singleton Class and how is it created?

A Singleton class ensures that **only one instance** of the class is created within a single JVM.

### Thread-Safe Implementations (ranked by recommendation)

**1. Enum Singleton (Best Practice — Joshua Bloch, Effective Java)**
```java
public enum DatabaseConnection {
    INSTANCE;
    
    public void connect() { /* ... */ }
}
```
Enums are inherently thread-safe, serialization-safe, and reflection-proof. This is the simplest and most robust approach.

**2. Double-Checked Locking (DCL) with `volatile`**
```java
public class Singleton {
    private static volatile Singleton instance; // volatile is CRITICAL

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                   // 1st check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {            // 2nd check (with lock)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

**Why `volatile` is essential:** Without it, the JIT compiler may reorder instructions. Thread A could see a partially constructed object — `instance` is non-null but its fields aren't initialized yet. `volatile` prevents this by establishing a **happens-before** relationship.

**3. Bill Pugh Singleton (Initialization-on-Demand Holder)**
```java
public class Singleton {
    private Singleton() {}

    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}
```
This leverages the JVM's class-loading guarantee: the inner class `Holder` is loaded (and `INSTANCE` initialized) only when `getInstance()` is first called. Thread-safe without synchronized blocks.

---
