---
id: java-interview-questions-100
title: 100+ Core Java Tricky Interview Questions and Answers
sidebar_label: Java Interview Questions Tricky
description: A comprehensive guide covering 100+ tricky, real-world interview questions on Core Java for experienced developers.
tags:
  - Java
  - Core Java
  - Interview Questions
  - Tricky Questions
---

# 100+ Core Java Tricky Interview Questions and Answers

## JVM Architecture & Memory

**Q: Can you tell me the difference between JVM, JRE, and JDK?**
**A:**

| Component | Contains | Purpose |
|-----------|----------|---------|
| **JVM** | Execution engine, ClassLoader, Runtime Data Areas | Runs Java bytecode — makes Java platform-independent |
| **JRE** | JVM + standard libraries (`rt.jar`, `java.base`) | Everything needed to **run** a Java application |
| **JDK** | JRE + compiler (`javac`), debugger (`jdb`), profiler, `jlink`, `jshell` | Everything needed to **develop** Java applications |

> **Since Java 11:** The standalone JRE download was removed. The JDK is the only distribution — it implicitly includes runtime capabilities.

**Q: What are the key components of JVM architecture?**
**A:** The JVM has three major subsystems:

1. **ClassLoader Subsystem** — Loads, links, and initializes `.class` files using a delegation model:
   - Bootstrap ClassLoader (loads `java.lang.*`, `java.util.*` from `java.base` module)
   - Platform ClassLoader (loads `java.sql.*`, `javax.*`)
   - Application ClassLoader (loads your application classes from classpath)

2. **Runtime Data Areas:**
   - **PC Register** — Per-thread program counter pointing to the current bytecode instruction.
   - **JVM Stack** — Per-thread stack of frames. Each frame holds local variables, operand stack, and frame data. Default size: 512 KB (`-Xss`).
   - **Native Method Stack** — Per-thread stack for JNI (native) method calls.
   - **Heap** — Shared across all threads. Stores all object instances. Divided into Young Gen (Eden + Survivor) and Old Gen.
   - **Metaspace** (replaced PermGen in Java 8) — Stores class metadata, method bytecode, constant pool. Grows dynamically using native memory.

3. **Execution Engine:**
   - **Interpreter** — Executes bytecode line-by-line (slow, but starts immediately).
   - **JIT Compiler** — Compiles hot methods to native machine code. Uses tiered compilation: C1 (client, fast compile) → C2 (server, optimized compile).
   - **Garbage Collector** — Reclaims unreachable objects from the Heap.

**Q: Can a Java application be run without installing the JRE?**
**A:** Yes, since Java 9:
- **`jlink`** — Creates a custom runtime image containing only the modules your application uses. Produces a self-contained distribution with a minimal JRE bundled.
- **GraalVM Native Image** (Java 14+) — Compiles bytecode ahead-of-time into a native binary. No JVM at runtime — sub-millisecond startup, ~50 MB RSS memory, but no JIT optimization.
- **`jpackage`** (Java 16+) — Creates installable packages (`.deb`, `.msi`, `.dmg`) with embedded runtime.

**Q: Is it possible to have the JDK installed without having the JRE?**
**A:** Since Java 11, this question is moot — the standalone JRE was eliminated. The JDK is the sole distribution and inherently provides runtime capabilities. For minimal deployments, use `jlink` to create a stripped-down custom runtime.

**Q: What are the memory storage available with the JVM?**
**A:** JVM memory is divided into **five runtime data areas** plus non-heap memory:

| Scope | Memory Region | Flags & Configuration | What It Stores |
|---|---|---|---|
| **Per-Thread** | **JVM Stack** | `-Xss` (e.g. `1m`) | Local variables array, method activation stack frames, operand stack. |
| **Per-Thread** | **Program Counter (PC) Register** | Native CPU pointer | Memory address of current executing JVM bytecode instruction. |
| **Per-Thread** | **Native Method Stack** | Native C/C++ stack | C call frames for Java Native Interface (JNI) invocations. |
| **Shared** | **Heap (Young & Tenured)** | `-Xms`, `-Xmx` | All instantiated Java objects, strings, arrays. Managed by Generational Garbage Collector. |
| **Shared** | **Metaspace** | `-XX:MaxMetaspaceSize` | Class structures, bytecode methods, runtime constant pool (stored in native OS memory). |
| **Shared** | **Code Cache** | `-XX:ReservedCodeCacheSize` | Machine code compiled by JIT (Tier 1 C1 and Tier 2 C2 compilers). |
| **Shared (Off-Heap)** | **Direct Memory** | `-XX:MaxDirectMemorySize` | Zero-copy off-heap buffers allocated via `ByteBuffer.allocateDirect()` (used heavily by Netty). |

**Q: How does garbage collection work in Java?**
**A:** The GC reclaims memory occupied by **unreachable objects** — objects that have no path from any GC root (thread stacks, static fields, JNI references). The process:

1. **Mark:** Starting from GC roots, traverse all reachable objects and mark them as "alive."
2. **Sweep/Compact:** Reclaim memory of unmarked (dead) objects. Optionally compact surviving objects to eliminate fragmentation.

Modern collectors (G1, ZGC) work incrementally — they divide the heap into regions and collect the most garbage-dense regions first, targeting pause times of 10ms (G1) or less than 1ms (ZGC).

**Q: What's the role of finalize method in garbage collection?**
**A:** `finalize()` was designed to run cleanup code before GC reclaims an object — but it's **deeply flawed** and **deprecated since Java 9**:
1. **No guarantee of execution:** The GC may never call `finalize()`, or call it with unpredictable delay.
2. **Performance penalty:** Finalizable objects require an extra GC cycle — they're first queued on a Finalizer thread, then collected in the next GC.
3. **Resurrection risk:** Inside `finalize()`, you can store `this` in a static field, making the object reachable again — a dangerous anti-pattern.
4. **Security vulnerability:** A malicious subclass can override `finalize()` to access a partially-constructed object.

**Replacements:**
- **`try-with-resources`** (Java 7) for deterministic cleanup of `AutoCloseable` resources.
- **`Cleaner`** (Java 9) for rare cases needing GC-triggered cleanup:
```java
Cleaner cleaner = Cleaner.create();
cleaner.register(myObject, () -> releaseNativeResource()); // Callback, no reference to myObject
```

**Q: Can you tell me what algorithm JVM uses for garbage collection?**
**A:**

| Collector | Algorithm | Pause Target | Heap Range | JVM Flag |
|-----------|-----------|-------------|------------|----------|
| **Serial** | Stop-the-world Mark-Compact | No target | < 100 MB | `-XX:+UseSerialGC` |
| **Parallel** | Multi-threaded Mark-Compact | Throughput-oriented | 1-4 GB | `-XX:+UseParallelGC` |
| **G1** (default) | Region-based, incremental | ~10ms | 4 GB - 64 GB | `-XX:+UseG1GC` |
| **ZGC** | Colored pointers, concurrent | < 1ms | 8 GB - 16 TB | `-XX:+UseZGC` |
| **Shenandoah** | Brooks pointers, concurrent | < 1ms | 4 GB+ | `-XX:+UseShenandoahGC` |

**Q: How can memory leak occur in Java even if we have automatic garbage collection?**
**A:** Memory leaks in Java happen when objects are **logically obsolete but still reachable** from GC roots:

1. **Static collections:** `static List<Object> cache = new ArrayList<>()` — objects added but never removed.
2. **Listener/callback leaks:** Registering observers but never unregistering them.
3. **Inner class references:** Non-static inner classes hold an implicit `Outer.this` reference, preventing the outer object from being GC'd.
4. **ThreadLocal without `remove()`:** In thread pools, thread-locals persist across requests, accumulating data.
5. **Unclosed resources:** `InputStream`, `Connection`, `ResultSet` holding native memory/file descriptors.
6. **String.intern() abuse:** Interning millions of unique strings fills the string table permanently.

**Detection:** Use `jmap -histo:live <pid>`, Eclipse MAT (Memory Analyzer Tool), or async-profiler's allocation profiling mode.

---

## Core Language Fundamentals

**Q: Is Java 100% object-oriented programming language?**
**A:** No — Java has 8 primitive types (`int`, `long`, `double`, `float`, `byte`, `short`, `char`, `boolean`) that are not objects. They don't inherit from `Object`, can't have methods, and live on the stack. This was a deliberate performance choice: `int` uses 4 bytes; `Integer` uses ~16 bytes (12-byte header + 4-byte field). **Project Valhalla** aims to introduce value types that combine primitive performance with object semantics.

**Q: What are the advantages of Java being partially object-oriented?**
**A:** Primitives offer: (1) direct CPU instruction mapping (`iadd`, `imul`) — no dispatch overhead, (2) stack allocation — no GC pressure, (3) cache-friendly arrays — contiguous memory, (4) predictable memory usage — fixed sizes.

**Q: What is the use of object-oriented programming languages in enterprise projects?**
**A:** OOP enables managing complexity at scale: encapsulation hides internals between teams, inheritance + polymorphism enable framework extensibility, abstraction via interfaces enables swappable implementations, and design patterns solve recurring architectural problems. Enterprise codebases with millions of lines rely on these principles for maintainability.

**Q: Explain `public static void main(String[] args)`.**
**A:**
- `public` — JVM calls from outside the class; must be accessible.
- `static` — Called without instantiation; JVM doesn't know which constructor to use.
- `void` — No return; exit codes use `System.exit(int)`.
- `main` — JVM launcher searches for this exact name.
- `String[] args` — Command-line arguments.

> **Java 21+ (Preview):** Instance main methods are now valid: `void main() { }` — no `static`, no `String[]`.

**Q: What happens if we don't declare the main as static?**
**A:** The program compiles but fails at runtime: `Error: Main method is not static in class MyApp`. The JVM launcher requires `static` because it calls `main()` without creating an instance.

**Q: Can we override the main method?**
**A:** No — `static` methods can be **hidden** but not overridden. Method overriding requires `invokevirtual` (runtime dispatch); static methods use `invokestatic` (compile-time binding).

**Q: Can we overload the main method?**
**A:** Yes. You can define `main(int x)`, `main()`, etc. But the JVM exclusively recognizes `public static void main(String[] args)`.

**Q: Can JVM execute our overloaded main method?**
**A:** No. The JVM launcher searches only for the canonical signature `public static void main(String[])`. Overloaded versions are treated as regular methods — callable only from code.

---

## Data Types & Wrappers

**Q: What is the difference between primitive data types and non-primitive data types?**
**A:**

| Aspect | Primitive | Non-Primitive (Reference) |
|--------|-----------|--------------------------|
| Storage | Stack (or JIT register) | Heap (object) + Stack (reference) |
| Size | Fixed (1-8 bytes) | Variable (~16+ bytes overhead) |
| Default value | `0`, `false`, `\u0000` | `null` |
| Nullability | Cannot be `null` | Can be `null` |
| Methods | None | `Object` methods + custom |
| Pass semantics | By value (copied) | Reference by value (pointer copied, object shared) |

**Q: Can primitive data types be null?**
**A:** No. Primitives always hold a value. Wrapper classes (`Integer`, `Boolean`) can be `null` — which is why unboxing a null wrapper causes `NullPointerException`.

**Q: Can we declare pointers in Java?**
**A:** No. Java uses **references** — managed pointers that the JVM controls. No pointer arithmetic, no address casting, no buffer overflows. The JVM's memory safety model relies on this restriction.

**Q: What are wrapper classes in Java?**
**A:** Object wrappers for primitives: `Integer` (int), `Long` (long), `Double` (double), `Boolean` (boolean), etc. They provide: (1) object semantics for generics, (2) utility methods (`parseInt`, `valueOf`, `MAX_VALUE`), (3) `null` representation for absent values.

**Q: Why do we need wrapper classes?**
**A:** Generics require objects (`List<Integer>`, not `List<int>`). Database columns map to nullable types (`ResultSet.getInt()` with `wasNull()` check). Method signatures accepting `Object` need wrappers. Auto boxing/unboxing bridges the gap transparently in most cases.

**Q: Why we use wrapper class in collections?**
**A:** Due to **type erasure** — `List<Integer>` becomes `List<Object>` at runtime. Primitives don't extend `Object`, so they can't be stored. `Integer.valueOf(42)` wraps the primitive for collection storage. Java's **Project Valhalla** aims to allow `List<int>` with specialized generic types.

**Q: Can you explain the difference between unboxing and autoboxing in Java?**
**A:** Autoboxing: `int → Integer` (compiler inserts `Integer.valueOf(i)`). Unboxing: `Integer → int` (compiler inserts `i.intValue()`). The `valueOf()` method uses an **integer cache** for values -128 to 127 — same object returned for cached values, new object for others.

**Q: Can you provide an example where autoboxing could lead to unexpected behavior?**
**A:** The `==` operator compares **references** for wrapper objects, not values:
```java
Integer a = 127, b = 127;  a == b  // true — cached (same object)
Integer c = 128, d = 128;  c == d  // false — not cached (different objects)!
c.equals(d)                        // true — correct comparison
```
**Always use `.equals()` for wrapper comparison.** Also, autoboxing in loops creates excessive garbage:
```java
Long sum = 0L;
for (long i = 0; i < 1_000_000; i++) sum += i; // Creates 1M Long objects!
// Fix: use `long sum = 0L`
```

**Q: Is there a scenario where autoboxing and unboxing could cause a NullPointerException?**
**A:** Yes — unboxing `null`:
```java
Integer val = null;
int x = val;  // NPE! Compiler generates val.intValue() → null.intValue()

Map<String, Integer> map = new HashMap<>();
int count = map.get("missing"); // NPE! get() returns null, unboxing fails
// Fix: int count = map.getOrDefault("missing", 0);
```

---

## Exception Handling

**Q: Can you explain the role of each try, catch, and finally block in exception handling?**
**A:** `try` wraps code that may throw. `catch` handles specific exceptions — the JVM matches the exception type against catch clauses top-to-bottom (use most specific first). `finally` executes **unconditionally** for cleanup (close connections, release locks). Since Java 7, `try-with-resources` replaces most `try-finally` patterns for `AutoCloseable` resources.

**Q: What happens if a return statement is executed inside the try or catch block? Does the finally block still execute?**
**A:** Yes — `finally` executes after `try/catch` return but before the value is returned to the caller. The return value is saved on the operand stack, `finally` runs, then the saved value is returned. If `finally` has its own `return`, it **overwrites** the try/catch return value — a notorious gotcha.

**Q: Is it possible to execute a program without a catch block?**
**A:** Yes — `try-finally` ensures cleanup while letting the exception propagate. Also, `try-with-resources` can exist without `catch`.

**Q: How does exception handling with try catch finally affect the performance?**
**A:** The `try` block itself has **near-zero overhead** on the happy path (JVM uses exception tables, not runtime checks). The expensive part is **throwing** an exception: `fillInStackTrace()` walks every frame — O(stack depth), costing 5-10μs for deep stacks. Never use exceptions for control flow in hot paths.

**Q: What happens if the JVM exits via System.exit() during try or catch execution?**
**A:** `finally` block is **not executed**. `System.exit()` triggers JVM shutdown hooks but bypasses `finally` blocks entirely.

**Q: Can we write multiple finally blocks in Java?**
**A:** No — one `finally` per `try`. Multiple `catch` blocks are allowed.

**Q: What is an exception and the difference between checked and unchecked exceptions?**
**A:**

| Type | Hierarchy | Compile-time check | Examples |
|------|-----------|-------------------|----------|
| **Checked** | `Exception` (not `RuntimeException`) | Must be caught or declared | `IOException`, `SQLException`, `ClassNotFoundException` |
| **Unchecked** | `RuntimeException` | No compile-time check | `NullPointerException`, `IllegalArgumentException`, `ArrayIndexOutOfBoundsException` |
| **Error** | `Error` | Should not be caught | `OutOfMemoryError`, `StackOverflowError`, `NoClassDefFoundError` |

**Q: How would you handle multiple exceptions in a single catch block?**
**A:** Multi-catch (Java 7+): `catch (IOException | SQLException e)`. The types must be unrelated (not parent-child). The variable `e` is effectively final.

---

## Strings

**Q: What is String Pool?**
**A:** The String Pool (String Intern Pool) is a **hashtable** in the Heap (moved from PermGen to Heap in Java 7) that stores unique string literals. When the JVM encounters a string literal `"hello"`, it checks the pool:
- Found → returns the existing reference (no new object).
- Not found → creates a new `String`, adds it to the pool, returns the reference.

`String.intern()` explicitly adds a string to the pool. `new String("hello")` creates an object on the Heap **outside** the pool (plus the literal in the pool — potentially 2 objects).

**Q: Are there scenarios where using the string pool might not be beneficial?**
**A:** Yes — with millions of **unique** strings (UUIDs, session tokens, log messages). The intern table uses a global lock under contention, and entries accumulate permanently. Use `-XX:StringTableSize=<n>` to tune the hashtable bucket count (default: 65536 in Java 11+).

**Q: Can you please tell me about String and StringBuffer?**
**A:**
| Feature | `String` | `StringBuffer` | `StringBuilder` |
|---------|----------|----------------|-----------------|
| Mutability | Immutable | Mutable | Mutable |
| Thread-safe | Yes (immutable) | Yes (synchronized methods) | No |
| Performance | Slow for repeated concatenation | Medium | Fastest |
| Use case | Constants, keys | Multi-threaded string building | Single-threaded string building |

**Q: Why String Builder is introduced when we already had String Buffer?**
**A:** `StringBuffer` synchronizes **every method** — even when used by a single thread, it pays the synchronization cost (~20-30ns per method call overhead). `StringBuilder` (Java 5) removes synchronization, making it 10-20% faster for single-threaded use — the vast majority of string building scenarios.

**Q: Give a scenario where a StringBuffer is better than the String.**
**A:** Building a large string in a loop in a multi-threaded context. But in practice, `StringBuilder` + external synchronization is preferred. The JVM (since Java 9) uses `invokedynamic` + `StringConcatFactory` for `+` concatenation, often making explicit `StringBuilder` unnecessary outside loops.

---

## OOP Concepts

**Q: Why do we use packages in Java?**
**A:** Namespace management (prevent class name collisions), access control (package-private scope), logical organization, and module system integration (Java 9+ `exports` directives).

**Q: What are the access modifiers in Java?**
**A:**

| Modifier | Class | Package | Subclass (different pkg) | World |
|----------|-------|---------|--------------------------|-------|
| `public` | ✅ | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ✅ (via inheritance only) | ❌ |
| *default* (no modifier) | ✅ | ✅ | ❌ | ❌ |
| `private` | ✅ | ❌ | ❌ | ❌ |

**Q: Why do we use getter/setters when we can make fields public directly?**
**A:** Validation, computed properties, read-only access, lazy initialization, change detection/events, and binary compatibility (changing internal representation without breaking callers).

**Q: Can a top-level class be private or protected in Java?**
**A:** No. Only `public` and package-private (default) are valid for top-level classes.

**Q: Explain the concept of a class and objects in Java.**
**A:** A **class** is a blueprint (template) stored in Metaspace — it defines fields (state) and methods (behavior). An **object** is a runtime instance of a class, allocated on the Heap. The object contains: (1) **object header** (8-byte mark word for locking/GC + 4-byte compressed klass pointer), (2) instance field data, (3) padding to 8-byte alignment. `new ClassName()` allocates memory, zero-initializes fields, runs the constructor, and returns a reference.

**Q: What are the ways to create an object?**
**A:** Five ways:
1. `new ClassName()` — calls constructor.
2. `Class.forName("...").getDeclaredConstructor().newInstance()` — reflection.
3. `object.clone()` — bypasses constructor, shallow copy.
4. Deserialization (`ObjectInputStream.readObject()`) — bypasses constructor.
5. Factory methods (`List.of()`, `Optional.of()`, `LocalDate.now()`).

**Q: Can a class in Java be without any method or fields?**
**A:** Yes — a marker class. The compiler generates a default no-arg constructor. Useful as a type tag, though marker interfaces and annotations are preferred.

---

## Singleton Pattern

**Q: What is a Singleton class?**
**A:** A class restricted to a **single instance** across the JVM, accessed via a global static method. Use cases: configuration manager, connection pool manager, logger factory, application-wide cache.

**Q: How can we create this Singleton class?**
**A:** Three patterns, from weakest to strongest:

```java
// 1. Holder Pattern (lazy, thread-safe, no synchronization)
public class Singleton {
    private Singleton() {}
    private static class Holder { static final Singleton INSTANCE = new Singleton(); }
    public static Singleton getInstance() { return Holder.INSTANCE; }
}

// 2. Double-Checked Locking (lazy, thread-safe)
public class Singleton {
    private static volatile Singleton instance; // volatile prevents reordering!
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {                    // Check 1 (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {             // Check 2 (with lock)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 3. Enum Singleton (BEST — reflection-proof, serialization-proof)
public enum Singleton {
    INSTANCE;
    public void doWork() { /* ... */ }
}
```

**Q: How do we prevent multiple instances in a Singleton if accessed by multiple threads?**
**A:** The **Holder pattern** leverages JVM class-loading guarantees — static initialization is thread-safe by specification. **Enum singletons** are immune to reflection (`Constructor.newInstance()` throws `IllegalArgumentException` for enum types) and serialization (`readResolve()` is handled by the JVM).

---

## Constructors & Immutability

**Q: What is a constructor in Java?**
**A:** A special method (same name as class, no return type) called during object creation. It initializes instance state. If no constructor is defined, the compiler generates a **default no-arg constructor** that calls `super()`. Constructors are invoked via `invokespecial` bytecode — direct dispatch, not polymorphic.

**Q: Can we use a private constructor?**
**A:** Yes — Singleton, utility classes, factory pattern, builder pattern.

**Q: Can a constructor be overloaded?**
**A:** Yes — constructor chaining with different parameter lists. Use `this(args)` to delegate to another constructor.

**Q: What does immutability mean in Java?**
**A:** An immutable object's state **cannot change after construction**. All fields are `final`, no setters exist, and mutable fields are defensively copied. `String`, `Integer`, `LocalDate`, `List.of()` results are immutable.

**Q: Why are immutable objects useful for concurrent programming?**
**A:** No synchronization needed — immutable objects are inherently thread-safe. Multiple threads can read them simultaneously without locks. `final` fields have a JMM guarantee: once the constructor completes, all `final` fields are visible to all threads (safe publication).

**Q: What are immutable classes?**
**A:** Classes whose instances cannot be modified: `String`, `Integer`, `BigDecimal`, `LocalDate`, `Optional`, `Path`. Java Records (Java 16+) are syntactic sugar for immutable classes.

**Q: How can we create an immutable class?**
**A:** (1) `final` class, (2) `private final` fields, (3) no setters, (4) constructor initialization, (5) defensive copy mutable arguments, (6) return copies from getters.

---

## Inheritance & Polymorphism

**Q: What does Java inheritance mean?**
**A:** A class acquires fields and methods from a parent class via `extends`. The subclass IS-A parent type, enabling polymorphism. Java uses **single class inheritance** (one parent) + **multiple interface implementation**.

**Q: Can a class extend on its own?**
**A:** No — circular inheritance. Compile error.

**Q: Why is multiple inheritance not possible in Java?**
**A:** The **Diamond Problem** — ambiguity when two parents define the same method/field. Interfaces solve this by requiring explicit override resolution for conflicting default methods.

**Q: What is the difference between inheritance and composition?**
**A:**
| Aspect | Inheritance | Composition |
|--------|-------------|-------------|
| Relationship | IS-A | HAS-A |
| Coupling | Tight (subclass depends on parent internals) | Loose (delegates to component) |
| Flexibility | Static (compile-time) | Dynamic (runtime swappable) |
| Rule of thumb | Use when relationship is genuinely hierarchical | Prefer by default ("favor composition over inheritance") |

**Q: What does polymorphism mean in Java?**
**A:** Same interface, different implementations. **Compile-time:** Overloading (method signature resolution). **Runtime:** Overriding (vtable dispatch based on actual object type).

**Q: How does method overloading relate to polymorphism?**
**A:** Compile-time (static) polymorphism. The compiler selects the method based on parameter types at the call site.

**Q: What is dynamic method dispatch in Java?**
**A:** Runtime resolution via vtable: `Animal a = new Dog(); a.speak()` → JVM looks up `Dog`'s vtable → calls `Dog.speak()`.

**Q: Can a constructor be polymorphic?**
**A:** No — constructors use `invokespecial` (direct call), not `invokevirtual` (vtable dispatch).

---

## Abstraction & Interfaces

**Q: What does abstraction mean in Java?**
**A:** Hiding implementation details behind a well-defined interface. Users interact with the *what* (method contracts) without knowing the *how* (implementation). Achieved via abstract classes and interfaces.

**Q: Can you provide an example of where abstraction is effectively used in Java libraries?**
**A:** `java.util.List` → ArrayList/LinkedList, `java.sql.Connection` → MySQL/PostgreSQL drivers, `org.slf4j.Logger` → Logback/Log4j2, `javax.servlet.Servlet` → HttpServlet.

**Q: What happens if a class includes an abstract method?**
**A:** The class must be declared `abstract`. It cannot be instantiated. Concrete subclasses must implement all inherited abstract methods.

**Q: How does abstraction help in achieving independent application parts?**
**A:** Components depend on abstractions (interfaces), not concrete implementations. Teams develop independently against shared contracts. Implementations are swappable (MySQL → PostgreSQL). Mocking in tests is trivial.

**Q: What is an Interface in Java?**
**A:** A contract defining method signatures that implementing classes must fulfill. Since Java 8: `default` methods (implementation in interface), `static` methods. Since Java 9: `private` methods for shared logic between defaults.

**Q: What is the difference between an Interface and Abstract class in Java?**
**A:**
| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Instance fields | ✅ Yes | ❌ Only `public static final` |
| Constructors | ✅ Yes | ❌ No |
| Multiple inheritance | Single | Multiple |
| Access modifiers | Any | `public` (default, static, abstract), `private` (Java 9) |

**Q: Can you provide an example of when to use an Interface versus when to extend a class?**
**A:** Interface: unrelated classes sharing a capability (`Comparable`, `Serializable`). Class: genuine IS-A hierarchy with shared state (`HttpServlet extends GenericServlet`).

**Q: How do you use multiple inheritance in Java using interfaces?**
**A:** A class implements multiple interfaces. If conflicting default methods exist, the class must override and explicitly resolve via `InterfaceName.super.method()`.

**Q: Can an Interface in Java contain static methods?**
**A:** Yes (Java 8+). Called on the interface: `Comparator.comparing(Employee::getName)`.

---

## Encapsulation & Overloading/Overriding

**Q: What does encapsulation mean in Java?**
**A:** Bundling data (fields) and behavior (methods) within a class, restricting direct access via `private` fields and controlled exposure via getters/setters. Enforces invariants — prevents invalid state.

**Q: How does encapsulation enhance security and integrity?**
**A:** Private fields prevent direct mutation. Setters enforce validation. Getters can return defensive copies. Internal representation can change without affecting callers.

**Q: What is method overloading in Java?**
**A:** Multiple methods with the same name but different parameter lists in the same class. Resolved at **compile time** (static dispatch).

**Q: How does the Java compiler determine which overloaded method to call?**
**A:** Three-phase resolution: (1) exact match without boxing, (2) allow autoboxing, (3) allow varargs. Selects the **most specific** match.

**Q: Is it possible to overload a method that differs only by its return type in Java?**
**A:** No — return type is not part of the method signature for overloading.

**Q: What are the rules for method overloading in Java?**
**A:** Must differ in: number of parameters, parameter types, or parameter order.

**Q: What is method overriding in Java?**
**A:** A subclass provides a specific implementation for a method defined in the parent. Same name, same parameters, same or covariant return type.

**Q: How does the @Override annotation influence method overriding?**
**A:** Compile-time safety net — error if the method doesn't actually override a parent method. Catches typos and parameter mismatches.

**Q: What happens if a superclass method is overridden by more than one subclass in Java?**
**A:** Each subclass has its own vtable entry. At runtime, `invokevirtual` dispatches to the correct implementation based on the actual object type.

---

## Keywords: this, super, static, final

**Q: What is `this` and `super` keyword in Java?**
**A:** `this` → current object instance. `super` → parent class portion. Both are compile-time constructs resolved to specific targets.

**Q: Can the `this` keyword be assigned a new value in Java?**
**A:** No — `this` is a read-only, implicitly `final` reference.

**Q: What happens if we attempt to use the `super` keyword in a class that doesn't have a superclass?**
**A:** Every class implicitly extends `Object`. So `super.toString()` calls `Object.toString()`. An error occurs only if the referenced method doesn't exist in `Object`.

**Q: Can the `this` or `super` keyword be used in a static method?**
**A:** No — static methods have no instance context.

**Q: How does `super` play a role in polymorphism in Java?**
**A:** Enables **method chaining**: a subclass can extend parent behavior (`super.save(entity)`) rather than replacing it entirely.

**Q: What is the `static` keyword in Java?**
**A:** Declares class-level members: shared across all instances, loaded at class initialization, accessible without an object. Stored in Metaspace (metadata) or Heap (static fields referencing objects).

**Q: Can a static block throw an exception?**
**A:** Yes, but only unchecked. If an exception escapes, the JVM wraps it in `ExceptionInInitializerError`, and the class becomes permanently unusable (`NoClassDefFoundError` on subsequent access).

**Q: Can we override a static method in Java?**
**A:** No — static methods use `invokestatic` (compile-time binding). Subclasses can **hide** but not override them.

**Q: Is it possible to access non-static members from within a static method?**
**A:** Only by creating or receiving an instance: `new MyClass().instanceMethod()`.

**Q: What is a static block?**
**A:** A `static { }` block that runs **once** when the class is loaded by the ClassLoader, before any constructor or static method. Used for complex static initialization.

**Q: Can we print something on console without the main method in Java?**
**A:** Before Java 7: yes, via static block. Java 7+: the JVM verifies `main()` exists before loading the class.

**Q: What is the `final` keyword in Java?**
**A:** Three uses: (1) `final` variable — constant (cannot be reassigned), (2) `final` method — cannot be overridden, (3) `final` class — cannot be extended.

**Q: What are some common use cases for using final variables?**
**A:** Constants (`static final`), lambda captures (must be effectively final), immutable class fields, method parameters (prevent reassignment).

**Q: How does the final keyword contribute to immutability and thread safety?**
**A:** `final` fields have a **JMM guarantee**: once the constructor completes, all `final` fields are visible to other threads without synchronization. This is **safe publication** — the foundation of immutable object thread safety.

**Q: Can you describe any performance considerations related to using final?**
**A:** The JIT compiler can inline `final` methods and devirtualize calls. `final` classes enable more aggressive optimization since no subclass can override behavior. However, modern JIT compilers already perform speculative devirtualization for effectively-final methods, so the performance difference is minimal.

---

## Java 8+ Features

**Q: What is a Functional Interface?**
**A:** An interface with exactly **one abstract method** (SAM). Enables lambda expressions. Examples: `Runnable` (void run()), `Callable<V>` (V call()), `Function<T,R>` (R apply(T)), `Predicate<T>` (boolean test(T)).

**Q: Can a functional interface extend another interface?**
**A:** Yes, if the total abstract methods remain exactly one. Default and static methods don't count.

**Q: Can you tell me some new features introduced in Java 8?**
**A:** Lambda expressions, Stream API, `Optional`, `CompletableFuture`, default/static interface methods, new Date/Time API (`java.time`), method references, `Nashorn` JavaScript engine.

**Q: Why were Optional, Lambdas, and Streams introduced in Java 8?**
**A:**
- **`Optional<T>`** — type-safe null handling. Forces callers to explicitly handle absent values instead of risking NPE.
- **Lambdas** — concise syntax for functional interfaces. Enables functional programming style.
- **Stream API** — declarative data processing pipelines. Enables parallel processing via `parallelStream()`.

**Q: Difference between `filter` and `map` functions of Stream API?**
**A:** `filter(Predicate<T>)` — keeps elements matching the predicate, discards others (1:0 or 1:1 mapping). `map(Function<T,R>)` — transforms each element (1:1 mapping). `flatMap(Function<T, Stream<R>>)` — transforms each element into a stream and flattens (1:N mapping).

```java
List<String> names = employees.stream()
    .filter(e -> e.getSalary() > 50000)     // Keep high earners
    .map(Employee::getName)                  // Extract names
    .collect(Collectors.toList());
```

**Q: Can you tell me some new features introduced in Java 11?**
**A:** `HttpClient` (standard HTTP/2 client), `var` in lambda parameters, `String` methods (`isBlank()`, `strip()`, `lines()`, `repeat(n)`), `Files.readString()`, `Optional.isEmpty()`, Epsilon GC (no-op collector for benchmarks), ZGC (experimental).

**Q: Can you tell me some new features introduced in Java 17?**
**A:**
- **Sealed classes:** Restrict which classes can extend/implement them.
```java
public sealed interface Shape permits Circle, Rectangle, Triangle { }
public final class Circle implements Shape { }     // Must be final, sealed, or non-sealed
```
- **Pattern matching for `instanceof`:** Eliminates cast boilerplate.
```java
if (obj instanceof String s) { System.out.println(s.length()); } // s is cast automatically
```
- **Records:** Concise immutable data carriers.
- **Text blocks:** Multi-line strings with `"""`.

**Q: Can you tell me some new features introduced in Java 21?**
**A:**
- **Virtual Threads (JEP 444):** Lightweight threads managed by the JVM, not the OS. Create millions of threads without OS resource exhaustion.
```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i ->
        executor.submit(() -> handleRequest(i))  // 100K virtual threads!
    );
}
```
- **Structured Concurrency (Preview):** Treat groups of related async tasks as a single unit of work.
- **Scoped Values:** Thread-safe alternative to `ThreadLocal` for virtual threads.
- **Sequenced Collections:** `SequencedCollection`, `SequencedSet`, `SequencedMap` with `getFirst()`, `getLast()`, `reversed()`.
- **Record Patterns:** Deconstruct records in pattern matching.

---

## Collections Framework

**Q: What is the Collection Framework in Java?**
**A:** A unified architecture of interfaces, implementations, and algorithms for storing, retrieving, and manipulating groups of objects. The framework provides: (1) interfaces (`List`, `Set`, `Map`, `Queue`), (2) implementations (`ArrayList`, `HashMap`, `TreeSet`), (3) algorithms (`Collections.sort()`, `Collections.binarySearch()`).

**Q: What are the main interfaces of the Java Collection framework?**
**A:** `Iterable` → `Collection` → `List`, `Set`, `Queue`, `Deque`. Separately: `Map` (not extends `Collection`). Java 21 added `SequencedCollection`, `SequencedSet`, `SequencedMap`.

**Q: Can you explain how Iterator works?**
**A:** `Iterator<E>` provides `hasNext()` (boolean check), `next()` (return element and advance cursor), and `remove()` (remove last returned element). Internally, it maintains a cursor index and a `expectedModCount` for fail-fast detection. `for-each` loops compile to iterator usage.

**Q: What are some common methods available in all Collection types?**
**A:** `add(E)`, `remove(Object)`, `contains(Object)`, `size()`, `isEmpty()`, `clear()`, `iterator()`, `stream()`, `toArray()`, `addAll(Collection)`, `removeIf(Predicate)`.

**Q: How does the Collection framework handle concurrency?**
**A:** Three approaches: (1) `Collections.synchronizedXxx()` — wraps with full-map locking, (2) `CopyOnWriteArrayList/Set` — copy on write, snapshot iterators, (3) `ConcurrentHashMap`, `ConcurrentLinkedQueue` — lock-free/fine-grained locking.

**Q: How do you choose the right Collection type?**
**A:**
| Need | Collection | Reason |
|------|-----------|--------|
| Ordered, indexed, duplicates OK | `ArrayList` | O(1) random access |
| Unique elements, no order | `HashSet` | O(1) add/contains |
| Unique, sorted | `TreeSet` | O(log n), range queries |
| Unique, insertion order | `LinkedHashSet` | O(1) + order |
| Key-value, fast lookup | `HashMap` | O(1) get/put |
| Key-value, sorted keys | `TreeMap` | O(log n), NavigableMap |
| FIFO processing | `ArrayDeque` | Faster than LinkedList |
| Priority processing | `PriorityQueue` | Binary heap |
| Thread-safe map | `ConcurrentHashMap` | Fine-grained locking |

**Q: What enhancements were made to the Java Collection Framework in Java 8?**
**A:** Stream API (`stream()`, `parallelStream()`), `forEach()` default method on `Iterable`, `removeIf()` on `Collection`, `Map.computeIfAbsent()`, `Map.merge()`, `Map.getOrDefault()`, `Spliterator` for parallel traversal.

**Q: What is the difference between Iterator and ListIterator?**
**A:** `Iterator`: forward only, read + remove. `ListIterator`: bidirectional (`hasPrevious()`, `previous()`), plus `add()`, `set()`, `nextIndex()`, `previousIndex()`. Only works with `List`.

**Q: Name the algorithm used by `Arrays.sort` and `Collections.sort`.**
**A:** Primitives: Dual-Pivot Quicksort (O(n log n) average). Objects: TimSort (O(n log n) guaranteed, stable). TimSort exploits existing order in data.

**Q: What's the use case of ArrayList, LinkedList, and HashSet?**
**A:** `ArrayList`: random access, general purpose (use ~99% of the time). `LinkedList`: rarely — only as `Deque`. `HashSet`: uniqueness enforcement with O(1) membership check.

**Q: Can you describe how `hashCode` and `equals` work together in a collection?**
**A:** **Sequence:** `hashCode()` → bucket index → `equals()` → identity confirmation. Both must be consistent. If `a.equals(b)`, then `a.hashCode() == b.hashCode()`.

**Q: Can you give an example where a TreeSet is more appropriate?**
**A:** Leaderboard scores needing sorted display and range queries (`headSet()`, `tailSet()`).

**Q: What is the internal working of HashMap in Java?**
**A:** Hash perturbation (`hashCode() ^ (hashCode() >>> 16)`) → bucket index (`hash & (capacity-1)`) → chain (linked list → Red-Black Tree at threshold 8). See [Collections Questions](./collections-interview-questions.md#explain-the-internal-working-of-hashmap) for full details.

**Q: What happens when two keys have the same hash code?**
**A:** Hash collision — both land in same bucket, chained as linked list or tree. `equals()` differentiates them.

**Q: What changes were done for the Java HashMap in Java 8?**
**A:** Treeification (list → tree at 8 nodes), simplified hash function, optimized resizing (bitwise check instead of full rehash).

**Q: Can we include a class as a key in a HashMap?**
**A:** Yes, if `hashCode()` and `equals()` are correctly overridden. Use immutable fields for hash code calculation to prevent phantom entries.

**Q: Can you please explain ConcurrentHashMap?**
**A:** Java 8+: `Node<K,V>[]` array with CAS for empty bucket insertion, `synchronized` per node for collisions. No full-map locking. Lock-free reads via `volatile`. Null keys/values prohibited.

**Q: How does it improve performance in a multi-threaded environment?**
**A:** Multiple threads read without locks; writes lock only the affected bucket node, not the entire map. Under 8 threads: ~6-8× throughput vs `synchronizedMap`.

**Q: What is the time complexity of insert, delete, and traversal of HashSet and HashMap?**
**A:** Average: O(1). Worst case (severe collisions): O(n) with linked list, O(log n) with tree (Java 8+).

**Q: What is the time complexity of insert, delete, and retrieval of TreeSet and TreeMap?**
**A:** O(log n) guaranteed — Red-Black Tree height is bounded by 2×log₂(n).

**Q: What techniques do HashMap, TreeMap, HashSet, and TreeSet use internally?**
**A:** HashMap: hash table (array + linked list/tree). TreeMap: Red-Black Tree. HashSet: wraps HashMap (element = key, value = `PRESENT` sentinel). TreeSet: wraps TreeMap.

---

## Design Patterns & SOLID

**Q: What is a Design Pattern in Java and why do we use it?**
**A:** Reusable solutions to recurring software design problems. They provide shared vocabulary (Singleton, Factory, Observer), proven architectural approaches, and framework extensibility points.

**Q: Can you list and explain a few common design patterns?**
**A:**
- **Singleton:** One instance, global access. (e.g., `Runtime.getRuntime()`)
- **Factory Method:** Defers instantiation to subclasses. (e.g., `Calendar.getInstance()`)
- **Observer:** Pub-sub notification. (e.g., `ApplicationEventPublisher` in Spring)
- **Strategy:** Swappable algorithms at runtime. (e.g., `Comparator`)
- **Builder:** Step-by-step construction of complex objects. (e.g., `StringBuilder`, `HttpRequest.newBuilder()`)
- **Proxy:** Control access to an object. (e.g., Spring AOP proxies)

**Q: How can design patterns affect the performance of a Java application?**
**A:** Patterns add abstraction layers (interfaces, factories), but the JIT compiler aggressively inlines and devirtualizes. The real cost is over-engineering — applying patterns where simple code suffices.

**Q: Which design pattern would you use to manage database connections?**
**A:** **Object Pool** (HikariCP). The pool itself is often a Singleton, but the pattern is connection pooling — reusing expensive JDBC connections instead of creating/destroying them per request.

**Q: How do you choose the appropriate design pattern?**
**A:** Identify the problem category (creational, structural, behavioral), evaluate alternatives, consider team familiarity, and apply the simplest pattern that solves the problem.

**Q: What are SOLID principles?**
**A:**
- **S (Single Responsibility):** Each class has one reason to change.
- **O (Open-Closed):** Open for extension (new implementations), closed for modification (existing code unchanged). Achieved via interfaces and polymorphism.
- **L (Liskov Substitution):** Subclasses must be substitutable for their parent without breaking behavior.
- **I (Interface Segregation):** Split fat interfaces into focused, client-specific ones.
- **D (Dependency Inversion):** High-level modules depend on abstractions (interfaces), not concrete implementations. Spring's `@Autowired` embodies this.

---

## Multithreading & Concurrency

**Q: What is a Thread in Java and how can we create it?**
**A:** A thread is the smallest unit of execution within a process. Creation: `extends Thread`, `implements Runnable`, `implements Callable<V>`, `CompletableFuture.supplyAsync()`, `Thread.startVirtualThread()` (Java 21). In production, always use `ExecutorService`.

**Q: Can you explain the life cycle of a Java thread?**
**A:** Six states: `NEW → RUNNABLE → {BLOCKED | WAITING | TIMED_WAITING} → TERMINATED`. Key insight: a thread blocked on I/O (database call, socket read) shows as `RUNNABLE`, not `WAITING` — the JVM considers OS-level blocking as "runnable."

**Q: How would you handle a scenario where two threads need to update the same data structure?**
**A:** Depends on complexity: `AtomicInteger` for counters, `ConcurrentHashMap` for maps, `synchronized` for compound operations, `ReadWriteLock` for read-heavy workloads.

**Q: Can we start a thread twice?**
**A:** No — `IllegalThreadStateException`. Thread lifecycle is one-way: `NEW → TERMINATED`.

**Q: What is the difference between Thread class and Runnable interface?**
**A:** `Thread` = execution mechanism + task (coupled). `Runnable` = task only (decoupled). `Runnable` is preferred — enables thread pooling, doesn't consume the single inheritance slot.

**Q: How can you ensure a method is thread-safe in Java?**
**A:** (1) Make it stateless (no shared mutable state). (2) Use immutable objects. (3) `synchronized` for mutual exclusion. (4) `Atomic*` classes for lock-free operations. (5) Concurrent collections.

**Q: What are volatile variables?**
**A:** `volatile` ensures **visibility** (reads/writes go to main memory, not CPU cache) and prevents **instruction reordering** (memory fence). Does NOT guarantee atomicity for compound operations (`count++`).

**Q: What is thread synchronization and why is it important?**
**A:** Controls concurrent access to shared resources via mutual exclusion (`synchronized`, `Lock`). Prevents race conditions, data corruption, and ensures happens-before ordering per the JMM.

**Q: Can you describe a scenario where you would use `wait()` and `notify()`?**
**A:** **Producer-Consumer pattern:** Producer adds items to a bounded queue and calls `notify()`. Consumer calls `wait()` when queue is empty, blocking until notified. Always use `wait()` in a `while` loop (not `if`) to guard against **spurious wakeups**:
```java
synchronized (queue) {
    while (queue.isEmpty()) { queue.wait(); }
    return queue.poll();
}
```
> **Modern alternative:** `BlockingQueue.take()` / `put()` handles all this internally.

**Q: What is the Java Memory Model and how is it linked to threads?**
**A:** The JMM (JSR-133) defines the rules for when writes by one thread become visible to reads by another thread. It defines **happens-before** relationships: (1) program order within a thread, (2) monitor unlock → subsequent lock, (3) volatile write → subsequent read, (4) thread start → first action in started thread, (5) thread termination → `join()` return.

---

## Advanced Topics

**Q: Can we create a server in a Java application without Spring or any other framework?**
**A:** Yes — `HttpServer` (Java 6+) for HTTP, `ServerSocket` for raw TCP. See [70+ Questions](./java-interview-questions-70.md) for code examples.

**Q: What is the `transient` keyword?**
**A:** Marks a field to be **excluded from serialization**. When `ObjectOutputStream` serializes an object, `transient` fields are skipped (deserialized as type default: `null`, `0`, `false`). Use for: passwords, cached/computed values, non-serializable dependencies.

**Q: What is the Exchanger class?**
**A:** A synchronization point where two threads **swap data**. `exchange(V data)` blocks until both threads arrive, then atomically swaps their values. Use case: pipeline stages passing data between producer and consumer threads.

**Q: What is Reflection in Java?**
**A:** The ability to inspect and manipulate classes, methods, fields, and constructors at **runtime** — bypassing compile-time type safety. `Class.forName()`, `getMethod()`, `getDeclaredField()`, `setAccessible(true)`. Used by frameworks (Spring DI, Hibernate ORM, Jackson serialization). **Cost:** 5-50× slower than direct calls due to bypassing JIT optimizations. Java 9 modules (`module-info.java`) restrict reflection via `opens` directives.

**Q: What is a Weak Reference and Soft Reference?**
**A:**

| Reference Type | GC Behavior | Use Case |
|---------------|-------------|----------|
| **Strong** (`Object o = new Object()`) | Never collected while reachable | Default |
| **Soft** (`new SoftReference<>(obj)`) | Collected only when memory is low (before OOM) | Memory-sensitive caches |
| **Weak** (`new WeakReference<>(obj)`) | Collected at next GC if no strong refs exist | `WeakHashMap`, canonicalization maps |
| **Phantom** (`new PhantomReference<>(obj, queue)`) | Enqueued after finalization, before memory reclaim | Resource cleanup (replaces `finalize()`) |

```java
// WeakHashMap: entries auto-removed when key has no strong references
Map<Object, String> cache = new WeakHashMap<>();
Object key = new Object();
cache.put(key, "value");
key = null;       // Remove strong reference
System.gc();      // Entry is eligible for removal
cache.size();     // Likely 0
```

**Q: What is Java Flight Recorder?**
**A:** A low-overhead (less than 1%) profiling and diagnostics framework built into the JVM (formerly commercial, free since Java 11). Records: CPU usage per method, memory allocation rates, GC pauses, thread contention, I/O waits, lock profiling, and custom application events. Data is saved to `.jfr` files, analyzed with **JDK Mission Control** or programmatically.
```bash
# Start recording with the JVM
java -XX:StartFlightRecording=duration=60s,filename=recording.jfr MyApp

# Or attach to a running process
jcmd <pid> JFR.start duration=60s filename=recording.jfr
```

**Q: What is Serialize and Deserialize data?**
**A:** **Serialization:** Converting an object graph into a byte stream (`ObjectOutputStream.writeObject()`) for storage or network transmission. **Deserialization:** Reconstructing the object from the byte stream (`ObjectInputStream.readObject()`). The class must implement `Serializable`. A `serialVersionUID` field ensures version compatibility.

> **Security warning:** Deserialization of untrusted data is a major attack vector (arbitrary code execution). Prefer JSON/Protocol Buffers over Java serialization. Java 9+ added serialization filters (`ObjectInputFilter`).

**Q: What is the difference between Young Generation and Old Generation memory spaces?**
**A:**

| Aspect | Young Generation | Old Generation |
|--------|-----------------|----------------|
| Contents | Newly created objects | Objects surviving multiple minor GCs |
| Subdivisions | Eden + Survivor (S0, S1) | Single space |
| GC type | Minor GC (fast, frequent) | Major/Full GC (slow, infrequent) |
| Algorithm | Copying collector (copy live objects S0↔S1) | Mark-Compact or Mark-Sweep |
| Typical size ratio | 1/3 of heap | 2/3 of heap |
| Promotion threshold | After ~15 minor GCs (`-XX:MaxTenuringThreshold`) | N/A |

Most objects die young (>95% in typical applications) — Eden is collected in milliseconds. Only long-lived objects (caches, singletons, static structures) reach Old Gen.