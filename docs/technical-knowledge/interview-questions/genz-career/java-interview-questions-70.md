---
id: java-interview-questions-trickiest
title: 70+ Trickiest Core Java Interview Questions and Answers
sidebar_label: Java Interview Questions Trickiest
description: A comprehensive guide covering 70+ tricky, real-world interview questions on Core Java for experienced developers.
tags:
  - Java
  - Core Java
  - Interview Questions
  - Tricky Questions
---

# 70+ Trickiest Core Java Interview Questions and Answers

## Exception Handling

**Q: What happens if a return statement is executed inside the try or catch block? Does the finally block still execute?**
**A:** Yes — the `finally` block **always** executes, even if `try` or `catch` contains a `return`. The JVM pushes the return value onto a temporary stack slot, executes `finally`, then returns the saved value. If `finally` also has a `return`, it **overwrites** the try/catch return — a dangerous, rarely-intended behavior:
```java
int getValue() {
    try {
        return 1;      // Saved as pending return
    } finally {
        return 2;      // ⚠️ Overwrites! Method returns 2
    }
}
```
> **Only two exceptions where `finally` doesn't execute:** `System.exit()` is called, or the JVM crashes / the thread is killed by the OS.

**Q: Is it possible to execute a program without a catch block? If so, how would you use try and finally together?**
**A:** Yes. `try-finally` (without `catch`) ensures cleanup happens even when exceptions propagate. The exception is **not caught** — it continues up the call stack. This is useful for resource cleanup without swallowing the error:
```java
Lock lock = new ReentrantLock();
lock.lock();
try {
    // Critical section — exception propagates to caller
} finally {
    lock.unlock(); // Guaranteed cleanup
}
```
Since Java 7, **try-with-resources** replaces most `try-finally` patterns:
```java
try (Connection conn = dataSource.getConnection()) {
    // Auto-closed even on exception
}
```

**Q: How does the exception handling with try catch finally affect the performance of a Java application?**
**A:** The performance impact depends on **where** the cost lies:
- **`try` block:** Near-zero overhead on the **happy path** (no exception thrown). The JVM uses an **exception table** — a lookup table of PC ranges mapped to handlers. No runtime cost unless an exception occurs.
- **Exception creation:** The expensive part. `new Exception()` captures the entire **stack trace** (`fillInStackTrace()`) by walking every frame — O(stack depth). A 50-frame deep call stack costs ~5-10μs per exception.
- **`catch` block:** Minimal — just a goto to the handler.
- **`finally` block:** The compiler duplicates `finally` code at every exit point — slight code bloat but no runtime penalty.

> **Anti-pattern:** Using exceptions for **control flow** (e.g., catching `NumberFormatException` instead of validating input) can degrade performance by 100-1000× in hot loops.

**Q: Can we write multiple finally blocks in Java?**
**A:** No. Each `try` block can have **exactly one** `finally` block. Multiple `catch` blocks are allowed (to handle different exception types), but `finally` is singular. If you need multiple cleanup stages, nest `try-finally` blocks or use try-with-resources with multiple resources:
```java
try (InputStream is = new FileInputStream("a.txt");
     OutputStream os = new FileOutputStream("b.txt")) {
    // Both auto-closed in reverse declaration order
}
```

**Q: How would you handle multiple exceptions in a single catch block?**
**A:** Use **multi-catch** (Java 7+) with the pipe `|` operator:
```java
try {
    // risky code
} catch (IOException | SQLException | ParseException e) {
    log.error("Operation failed: {}", e.getMessage(), e);
    throw new ServiceException("Data operation failed", e); // Wrap and rethrow
}
```
> **Constraint:** The exception types must be **unrelated** (no parent-child). `catch (Exception | IOException e)` is a compile error because `IOException` is already covered by `Exception`. Also, the variable `e` is **effectively final** — you cannot reassign it inside the multi-catch block.

---

## JVM Architecture & Memory

**Q: Can a Java application be run without installing the JRE?**
**A:** Since Java 9, yes — using **`jlink`**. It creates a custom runtime image containing only the modules your application actually uses, bundled directly with the application. This produces a self-contained distribution without requiring a separate JRE installation.

Since Java 14+, **GraalVM Native Image** goes further: it compiles Java bytecode into a **native binary** (no JVM at all) — sub-millisecond startup, lower memory, but no JIT optimization at runtime.

```bash
# jlink: Create custom runtime (only java.base + java.sql modules)
jlink --module-path $JAVA_HOME/jmods --add-modules java.base,java.sql --output my-runtime

# GraalVM: Compile to native binary
native-image -jar myapp.jar
```

**Q: Is it possible to have the JDK installed without having the JRE?**
**A:** Since Java 11, the standalone JRE distribution was **removed** — the JDK is the only download. The JDK contains everything the JRE did (JVM, class libraries, security manager) plus development tools (javac, jdb, jshell, jlink). So the question is somewhat outdated — in modern Java, you always install the JDK, and it implicitly provides runtime capabilities.

**Q: Can you tell me what algorithm JVM uses for garbage collection?**
**A:** The JVM offers multiple GC algorithms, each optimized for different workloads:

| Collector | Algorithm | Pause | Best For | Flag |
|-----------|-----------|-------|----------|------|
| **Serial** | Mark-Compact, single-threaded | Long STW | Small heaps, single-core | `-XX:+UseSerialGC` |
| **Parallel** (default ≤ Java 14) | Mark-Compact, multi-threaded | Medium STW | Throughput-oriented batch jobs | `-XX:+UseParallelGC` |
| **G1** (default ≥ Java 15) | Region-based, incremental | Short STW (~10ms target) | General purpose, balanced | `-XX:+UseG1GC` |
| **ZGC** | Colored pointers, concurrent | Ultra-low (~1ms) | Low-latency, large heaps (TB) | `-XX:+UseZGC` |
| **Shenandoah** | Brooks pointers, concurrent | Ultra-low (~1ms) | Low-latency (Red Hat) | `-XX:+UseShenandoahGC` |

All modern collectors use **generational** memory layout:
```
Heap: [ Eden | S0 | S1 ] (Young Gen)  [ Old Gen ]
       ← minor GC (frequent, fast) →  ← major/mixed GC (infrequent, slower) →

Non-Heap: [ Metaspace ] [ Code Cache ] [ Direct Memory ]
```
- **Eden:** New objects allocated here (via TLAB). Minor GC runs when Eden fills.
- **Survivor (S0/S1):** Objects surviving minor GC are copied here. After surviving ~15 minor GCs (`-XX:MaxTenuringThreshold`), they're **promoted** to Old Gen.
- **Old Gen:** Long-lived objects. Major GC (or mixed GC in G1) reclaims space here.

**Q: How can memory leak occur in Java even if we have automatic garbage collection?**
**A:** A memory leak in Java means objects that are **no longer needed** are still **reachable** from GC roots, preventing collection. Common causes:

1. **Static collections that only grow:**
```java
private static final List<Object> cache = new ArrayList<>(); // Never cleared!
public void process(Object obj) { cache.add(obj); } // Leak!
```

2. **Unclosed resources:** `InputStream`, `Connection`, `ResultSet` hold native memory or file descriptors. Not closing them leaks native resources even if the Java object is GC'd.

3. **Inner class holding outer reference:** Non-static inner classes implicitly hold `Outer.this`. If the inner class outlives the outer (e.g., registered as a listener), the entire outer object is retained.

4. **ThreadLocal without `remove()`:** In thread pools, threads are reused. `ThreadLocal` values persist across requests unless explicitly cleared with `threadLocal.remove()`, accumulating per-thread state indefinitely.

5. **Classloader leaks:** In application servers, redeploying a web app without proper cleanup can keep the old classloader (and all its loaded classes) alive.

> **Detection tools:** Use `jmap -histo`, `jcmd <pid> GC.heap_info`, or profilers like **Eclipse MAT**, **VisualVM**, or **async-profiler** to identify retained objects.

---

## Core Java Fundamentals

**Q: Is Java a 100% object-oriented programming language?**
**A:** No. Java uses **8 primitive types** (`byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`) that are not objects — they don't inherit from `Object`, can't have methods called on them, and live on the stack (not heap). Languages like Smalltalk and Ruby treat everything as objects. Java chose primitives for **performance**: an `int` occupies 4 bytes on the stack, while an `Integer` object requires ~16 bytes on the heap (12-byte object header + 4-byte int field) plus GC overhead.

> **Project Valhalla** (planned for future Java) introduces **value types** — objects without identity that can be stored flat like primitives, potentially eliminating the primitive/object divide.

**Q: What are the advantages of Java being partially object-oriented?**
**A:**
1. **Performance:** Primitive operations compile to single CPU instructions (`iadd`, `imul`). No heap allocation, no GC pressure.
2. **Memory efficiency:** Array of 1M `int` = 4 MB. Array of 1M `Integer` = ~20 MB (objects + references + padding).
3. **Predictable behavior:** Primitives have value semantics (compare by value, not reference). `int a = 5; int b = 5; a == b` → always `true`.
4. **Interop:** JNI and native code expect primitive types for system calls.

**Q: What is the use of object-oriented programming language in the enterprise projects?**
**A:** OOP enables managing **complexity at scale** through:
- **Encapsulation:** Each module hides its internals, reducing cognitive load. A team working on `PaymentService` doesn't need to understand `InventoryService` internals.
- **Inheritance + Polymorphism:** Shared behaviors are defined once and extended/overridden. Framework extensibility (Spring's `AbstractController`, `JpaRepository`) relies on this.
- **Abstraction:** Business logic depends on interfaces, not implementations. Swapping MySQL for PostgreSQL or REST for gRPC requires changing only the adapter layer.
- **Design patterns:** Patterns like Factory, Strategy, Observer, and Decorator are OOP constructs that solve recurring enterprise problems.

---

## `main` Method & Static

**Q: Explain `public static void main` in Java.**
**A:** Each keyword serves a specific purpose:
- **`public`** — The JVM calls `main()` from outside the class. It must be accessible from anywhere.
- **`static`** — The JVM doesn't create an instance of the class before calling `main()`. Static allows calling without `new`.
- **`void`** — The return value goes to the **OS exit code** (use `System.exit(int)` instead). `void` means no return to JVM.
- **`main`** — The JVM searches for exactly this method name. It's a convention hardcoded into the JVM launcher.
- **`String[] args`** — Command-line arguments passed via `java MyApp arg1 arg2`.

> **Java 21+ Preview:** `void main()` is now valid without `String[] args` or even `static` (instance main methods) as part of **Flexible Launch Protocol** — aimed at simplifying learning Java.

**Q: What will happen if we don't declare the main as a static?**
**A:** The JVM launcher specifically searches for `public static void main(String[])`. Without `static`, the method is an instance method, and the JVM would need to instantiate the class first — but it doesn't know which constructor to call or what arguments to pass. The program compiles successfully but fails at runtime with: `Error: Main method is not static in class MyApp`.

**Q: Can we override the main method?**
**A:** No. `main` is `static`, and static methods are bound at **compile time** based on the reference type — they participate in **method hiding**, not overriding. Even if a subclass declares the same signature, the JVM launcher calls `main` based on the class name you specify on the command line, not via polymorphic dispatch.

**Q: Can we overload the main method?**
**A:** Yes. You can have `main(int x)`, `main(String s, int n)`, etc. They are separate methods with the same name but different parameter lists. However, the JVM entry point is **exclusively** `public static void main(String[] args)` — no other signature is recognized.

---

## Primitives, Wrappers & Autoboxing

**Q: Can primitive data types be null?**
**A:** No. Primitives always hold a **value** — they cannot be `null`. They have well-defined defaults:
| Type | Default | Size |
|------|---------|------|
| `byte` | 0 | 1 byte |
| `short` | 0 | 2 bytes |
| `int` | 0 | 4 bytes |
| `long` | 0L | 8 bytes |
| `float` | 0.0f | 4 bytes |
| `double` | 0.0d | 8 bytes |
| `char` | `\u0000` | 2 bytes |
| `boolean` | `false` | 1 byte (JVM-dependent) |

> **Gotcha:** These defaults apply only to **instance/static fields**. Local variables have **no default** — using an uninitialized local variable causes a compile error.

**Q: Can we declare pointer in Java?**
**A:** No. Java deliberately eliminated pointers for **memory safety**. Pointers in C/C++ allow direct memory manipulation, which causes buffer overflows, dangling pointer bugs, and segfaults. Java uses **references** instead — they point to objects but cannot be incremented, cast to integers, or used for pointer arithmetic. The JVM manages all memory addresses internally, enabling GC and preventing entire categories of security vulnerabilities.

**Q: Why we use wrapper class in collections?**
**A:** Java generics use **type erasure** — at runtime, `List<Integer>` becomes `List<Object>`. Since primitives don't extend `Object`, they can't participate in generics. Wrapper classes bridge this gap: `Integer` wraps `int` as an object, enabling storage in `ArrayList<Integer>`, `HashMap<Integer, String>`, etc.

Additionally, wrappers provide utility methods:
```java
Integer.parseInt("42");        // String → int
Integer.valueOf(42);           // int → Integer (cached for -128 to 127)
Integer.MAX_VALUE;             // 2,147,483,647
Integer.toBinaryString(42);   // "101010"
```

**Q: Can you explain the difference between unboxing and autoboxing in Java?**
**A:**
- **Autoboxing:** Compiler automatically converts `int` → `Integer` (calls `Integer.valueOf()`).
- **Unboxing:** Compiler automatically converts `Integer` → `int` (calls `intValue()`).

```java
Integer boxed = 42;        // Autoboxing: Integer.valueOf(42)
int unboxed = boxed;       // Unboxing: boxed.intValue()
```

Under the hood, `Integer.valueOf()` uses an **internal cache** for values -128 to 127 (configurable via `-XX:AutoBoxCacheMax`). This means:
```java
Integer a = 127; Integer b = 127;
a == b  // true — same cached object

Integer c = 128; Integer d = 128;
c == d  // false — different objects! Use .equals() instead
```

**Q: Are there scenarios where autoboxing could lead to unexpected behavior?**
**A:** Yes — the `==` trap is the most common:
```java
Integer x = 200; Integer y = 200;
System.out.println(x == y);      // false! Compares references, not values
System.out.println(x.equals(y)); // true — correct comparison
```
Also, autoboxing in tight loops causes excessive object creation:
```java
Long sum = 0L;
for (long i = 0; i < 1_000_000; i++) {
    sum += i; // Autoboxing on EVERY iteration! Creates 1M Long objects
}
// Fix: use primitive `long sum = 0L;`
```

**Q: Is there any scenario where autoboxing and unboxing could cause a NullPointerException?**
**A:** Yes — when unboxing a `null` wrapper:
```java
Integer value = null;
int result = value; // NPE! Compiler generates: value.intValue() → null.intValue()

// Common in real code:
Map<String, Integer> map = new HashMap<>();
int count = map.get("missing-key"); // map.get() returns null → NPE on unboxing!
```
**Fix:** Always check for null before unboxing, or use `getOrDefault()`:
```java
int count = map.getOrDefault("missing-key", 0); // Safe
```

---

## Strings

**Q: Are there any scenarios where using the string pool might not be beneficial?**
**A:** Yes — when the application creates a massive number of **unique strings** (e.g., UUIDs, session tokens, log messages with dynamic content). Each unique string added to the pool stays in the Heap's string table (backed by a hashtable), consuming memory and increasing lookup time. `String.intern()` on millions of unique strings can cause:
1. **Memory waste:** The string table grows indefinitely.
2. **Hashtable contention:** The intern table uses a global lock, causing thread contention.
3. **GC pressure:** Interned strings in the string table are strongly referenced (not GC'd until the table entry is removed).

> **Tuning:** `-XX:StringTableSize=<prime_number>` adjusts the hash table bucket count. The default is 65536 (Java 11+). For applications with many interned strings, increase this to reduce collision chain length.

**Q: Give a scenario where StringBuffer is better than the String.**
**A:** When building a string through **repeated concatenation** in a multi-threaded context. `String` is immutable — each `+=` creates a new `String` object, copying all previous characters. `StringBuffer` mutates an internal `char[]` (or `byte[]` in Java 9+ compact strings) in-place:

```java
// BAD: O(n²) — creates n intermediate String objects
String result = "";
for (String s : items) { result += s; } // Each += copies the entire string

// GOOD: O(n) — appends in-place
StringBuffer sb = new StringBuffer(); // Thread-safe (synchronized methods)
for (String s : items) { sb.append(s); }

// BEST (single-threaded): StringBuilder — same API, no synchronization overhead
StringBuilder sb = new StringBuilder(estimatedLength);
for (String s : items) { sb.append(s); }
```

> **Modern note:** The Java compiler automatically converts simple `"a" + "b" + "c"` into `StringBuilder` chains (or since Java 9, uses `invokedynamic` + `StringConcatFactory` for even more efficient concatenation). Manual `StringBuilder` is still needed for loops.

---

## OOP Concepts

**Q: Why do we use packages in Java?**
**A:** Packages serve multiple purposes:
1. **Namespace management:** Prevents class name collisions. `com.google.common.collect.ImmutableList` and `java.util.List` coexist.
2. **Access control:** Package-private (default) access restricts visibility to classes within the same package.
3. **Organization:** Groups related classes logically (e.g., `model`, `service`, `repository`, `controller`).
4. **Module system (Java 9+):** Packages are the unit of `exports` in `module-info.java`.

**Q: Why do we use getter setter when we can make fields public and setting getting directly?**
**A:** See the detailed explanation in the [OOP Interview Questions](./java-oop-interview-questions.md#2-encapsulation--abstraction) section. Key reasons: validation, computed properties, read-only access, lazy initialization, change detection, and binary compatibility.

**Q: Can a top-level class be private or protected in Java?**
**A:** No. A `private` top-level class would be invisible to all other classes — useless. `protected` implies subclass access across packages, which doesn't apply at the top level (no enclosing class). Only `public` (globally visible) and package-private (default, visible within the package) are valid for top-level classes.

**Q: Can a class in Java be without any methods or fields?**
**A:** Yes — a **Marker Class**. It compiles, can be instantiated, and can serve as a type tag. However, marker **interfaces** (`Serializable`, `Cloneable`) and **annotations** (`@Entity`, `@Deprecated`) are the modern equivalent and are preferred because they allow `instanceof` checks and annotation processing without empty class files.

---

## Singleton & Constructors

**Q: How can we create singleton classes?**
**A:** Multiple approaches, from weakest to strongest:

```java
// 1. Double-Checked Locking (thread-safe, lazy)
public class Singleton {
    private static volatile Singleton instance; // volatile prevents reordering
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 2. Holder Pattern (thread-safe, lazy, no synchronization overhead)
public class Singleton {
    private Singleton() {}
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() { return Holder.INSTANCE; }
}

// 3. Enum Singleton (BEST — immune to reflection, serialization, cloning attacks)
public enum Singleton {
    INSTANCE;
    public void doWork() { /* ... */ }
}
```

**Q: How do we prevent multiple instances in a Singleton if accessed by multiple threads?**
**A:** The **Holder pattern** and **Enum singleton** are inherently thread-safe without explicit synchronization:
- **Holder:** The JVM guarantees that static class initialization is thread-safe (happens-before). The `Holder` class is loaded only when `getInstance()` is first called.
- **Enum:** The JVM guarantees single-instance creation for enum constants, even under concurrent access, reflection, and deserialization.

For DCL, the `volatile` keyword is essential — without it, instruction reordering can expose a partially-constructed object to another thread.

**Q: Can we use a private constructor?**
**A:** Yes. Use cases:
1. **Singleton:** Prevent external instantiation.
2. **Utility class:** `private` constructor + `final` class (e.g., `java.lang.Math`).
3. **Factory pattern:** Force object creation through static factory methods (`LocalDate.of()`, `Optional.of()`).
4. **Builder pattern:** Only the inner `Builder` class can call the outer class constructor.

**Q: Can constructor be overloaded?**
**A:** Yes — **constructor chaining**. Each constructor has a different parameter list, allowing flexible initialization. Use `this()` to delegate to another constructor:
```java
public class User {
    private final String name;
    private final int age;
    
    public User(String name) { this(name, 0); }       // Delegates to primary
    public User(String name, int age) {                // Primary constructor
        this.name = Objects.requireNonNull(name);
        this.age = age;
    }
}
```

---

## Immutability

**Q: Why are immutable objects useful for concurrent programming?**
**A:** Immutable objects are **inherently thread-safe** — no synchronization needed. Since their state can't change after construction, multiple threads can read them simultaneously without locks, `volatile`, or `Atomic*`. Additionally:
1. **Safe publication:** Once constructed, an immutable object can be shared freely.
2. **Cache-friendly:** Can be used as `HashMap` keys without hash code instability.
3. **Fail-fast reasoning:** No defensive copying needed — pass by reference is safe.

Examples: `String`, `Integer`, `LocalDate`, `Optional`, `List.of()`, `Map.of()`.

**Q: How can we create an immutable class?**
**A:**
1. Declare the class as **`final`** (prevent subclass from adding mutable state).
2. Make all fields **`private final`**.
3. **No setters** — no way to mutate state.
4. Initialize all fields in the **constructor**.
5. **Defensive copy** mutable arguments in the constructor and return copies from getters:

```java
public final class Employee {
    private final String name;
    private final List<String> roles;
    
    public Employee(String name, List<String> roles) {
        this.name = name;
        this.roles = List.copyOf(roles); // Defensive copy — caller can't mutate
    }
    
    public List<String> getRoles() { 
        return roles; // List.copyOf() already unmodifiable — safe to return directly
    }
}
```

> **Java 16+:** Use `record` for concise immutable classes:
> ```java
> public record Employee(String name, List<String> roles) {
>     public Employee { roles = List.copyOf(roles); } // Compact constructor
> }
> ```

---

## Inheritance, Polymorphism & Abstraction

**Q: Can a class extends on its own?**
**A:** No. `class A extends A` creates a **circular dependency** — the JVM can't determine the class hierarchy. The compiler rejects this with a compile error.

**Q: Why multiple inheritance is not possible in Java?**
**A:** The **Diamond Problem**: if `class C extends A, B` and both `A` and `B` define `void work()`, the compiler can't determine which `work()` to inherit. Additionally, if both `A` and `B` have a field `int x`, does `C` get one or two copies? Java avoids this complexity by allowing **single class inheritance** + **multiple interface implementation**. Interfaces with default methods handle the Diamond Problem by requiring the implementing class to explicitly override the conflicting method.

**Q: How does method overloading relate to polymorphism?**
**A:** Overloading is **compile-time polymorphism** (static dispatch). The compiler selects the method based on the **declared parameter types** at the call site. This is resolved during compilation, unlike overriding (runtime polymorphism) which uses vtable dispatch.

**Q: What is dynamic method dispatch in Java?**
**A:** The mechanism by which the JVM resolves an overridden method call at **runtime** based on the actual object type, not the reference type:
```java
Animal animal = new Dog(); // Reference type: Animal, Object type: Dog
animal.speak();            // JVM looks up Dog's vtable → calls Dog.speak()
```
The JVM uses `invokevirtual` bytecode, which looks up the **virtual method table (vtable)** of the actual object's class to find the correct method implementation. This is what makes polymorphism work.

**Q: Can constructor be polymorphic?**
**A:** No. Constructors are **not inherited** (they belong to their specific class) and are invoked via `invokespecial` (direct call), not `invokevirtual` (vtable dispatch). You can overload constructors (different parameters), but there's no runtime method resolution based on object type.

**Q: Can you provide examples of where abstraction is effectively used in Java libraries?**
**A:**
- **`java.util.List`** → `ArrayList`, `LinkedList`, `CopyOnWriteArrayList` — code against `List`, swap implementations.
- **`java.sql.Connection`** → MySQL, PostgreSQL, Oracle drivers — JDBC abstracts the database vendor.
- **`javax.servlet.Servlet`** → `HttpServlet`, `DispatcherServlet` — web container dispatches to implementations.
- **`org.slf4j.Logger`** → Logback, Log4j2 — logging abstraction layer.

**Q: What happens if a class includes an abstract method?**
**A:** The class **must** be declared `abstract`. You cannot instantiate it with `new`. Any concrete (non-abstract) subclass must provide implementations for **all** inherited abstract methods, or the subclass itself must be declared abstract.

**Q: How does abstraction helps in achieving independent application parts?**
**A:** Abstraction creates **boundaries** between components via interfaces/abstract classes. Each component depends on the abstraction, not the concrete implementation (Dependency Inversion Principle). This means:
- Teams can develop components in parallel, agreeing only on the interface.
- Implementations can be swapped (e.g., switching from MySQL to MongoDB) without affecting consumers.
- Unit testing is possible via mocks/stubs implementing the same interface.

---

## Interfaces & Functional Interfaces

**Q: Can you provide examples of when to use an interface versus when to extend a class?**
**A:** Use an **interface** when unrelated classes need a common capability: `Comparable`, `Serializable`, `AutoCloseable`. Use **class extension** when there's a genuine IS-A hierarchy with shared state and behavior: `HttpServlet extends GenericServlet`, `ArrayList extends AbstractList`.

**Q: How do you use multiple inheritance in Java using interfaces?**
**A:**
```java
interface Flyable { default void move() { System.out.println("Flying"); } }
interface Swimmable { default void move() { System.out.println("Swimming"); } }

class Duck implements Flyable, Swimmable {
    @Override
    public void move() {
        Flyable.super.move(); // Explicit resolution of Diamond Problem
    }
}
```

**Q: Can an interface in Java contain static methods and if so how can they be used?**
**A:** Yes (Java 8+). Static interface methods are called on the **interface itself**, not on instances:
```java
interface Validator {
    boolean isValid(String input);
    static Validator emailValidator() { return input -> input.contains("@"); }
}

Validator v = Validator.emailValidator(); // Static factory method
```

**Q: How encapsulation enhances security and integrity?**
**A:** Encapsulation enforces **controlled access**:
- Private fields prevent external code from setting invalid values (e.g., negative account balance).
- Getters can return defensive copies, preventing callers from mutating internal state.
- Business rules are centralized in methods, not scattered across callers.
- API evolution: internal representation can change without breaking external code.

---

## Overloading & Overriding

**Q: How does the Java compiler determine which overloaded method to call?**
**A:** The compiler follows a **three-phase resolution** (JLS §15.12.2):
1. **Phase 1:** Find methods matching without boxing/unboxing or varargs.
2. **Phase 2:** Allow autoboxing/unboxing, still no varargs.
3. **Phase 3:** Allow varargs.

Within each phase, the compiler selects the **most specific** method — the one whose parameter types are subtypes of all other candidates.

**Q: Is it possible to overload methods that differ only by their return type in Java?**
**A:** No. Method signature = name + parameter list. Return type is **not** part of the signature. The compiler can't disambiguate `int get()` from `String get()` at a call site like `get()` where the return is ignored.

**Q: What are the rules for method overloading in Java?**
**A:** Methods must differ in at least one of: **(1)** number of parameters, **(2)** parameter types, or **(3)** parameter order. Name and return type are irrelevant for overloading resolution.

**Q: What are the rules and conditions for method overriding in Java?**
**A:**
1. Same method name, same parameter list.
2. Return type must be the **same or covariant** (more specific subtype).
3. Access modifier must be the **same or more permissive** (e.g., `protected` → `public` is OK, `public` → `private` is not).
4. Cannot throw **new or broader** checked exceptions (can narrow or remove them).
5. `final`, `static`, and `private` methods **cannot be overridden**.

**Q: How does the override notation influence method overriding?**
**A:** `@Override` is a **compile-time safety net**. If the method doesn't actually override a superclass/interface method (due to a typo in the name or wrong parameter types), the compiler throws an error. Without it, you'd silently create a new method instead of overriding — a bug that's extremely hard to spot.

**Q: What happens if a super class method is overwritten by more than one subclass in Java?**
**A:** Each subclass has its **own vtable entry** for that method. At runtime, `invokevirtual` dispatches to the correct implementation based on the actual object type:
```java
Animal a = new Dog(); a.speak(); // → Dog.speak()
Animal b = new Cat(); b.speak(); // → Cat.speak()
```

---

## Static, Final & Keywords

**Q: What happens if you attempt to use a super keyword in a class that doesn't have a super class?**
**A:** Every class in Java implicitly extends `Object`. So `super` in any class refers to `Object`. You can call `super.toString()`, `super.equals()`, etc. A compile error only occurs if you try to call `super.someMethod()` where `someMethod()` doesn't exist in the parent class.

**Q: Can the `this` or `super` keyword be used in static method?**
**A:** No — static methods have no object context. `this` and `super` require an active instance, which doesn't exist in a static context.

**Q: How does `super` play a role in polymorphism in Java?**
**A:** `super` enables **method chaining** — a subclass can extend parent behavior rather than completely replacing it:
```java
@Override
public void save(Entity entity) {
    validate(entity);           // Subclass-specific logic
    super.save(entity);         // Reuse parent's persistence logic
    auditLog(entity);           // Additional behavior
}
```

**Q: Can a static block throw an exception?**
**A:** Yes, but only **unchecked exceptions** can propagate. If a checked exception occurs, it must be caught within the block. If an unchecked exception escapes a static initializer, the JVM wraps it in `ExceptionInInitializerError`, and the class becomes **permanently unusable** — any subsequent attempt to use the class throws `NoClassDefFoundError`.

**Q: Can we override static methods in Java?**
**A:** No — static methods use `invokestatic` (compile-time binding), not `invokevirtual` (runtime dispatch). A subclass can **hide** a parent's static method by declaring the same signature, but calling it via the parent reference always invokes the parent's version.

**Q: Can we print something on console without the main method in Java?**
**A:** Before Java 7, yes — using a `static` block. The static block runs when the class is loaded, before the JVM looks for `main()`. From Java 7 onwards, the JVM verifies the presence of `main()` **before** loading the class, so this trick no longer works.

**Q: What are some common use cases for using final variables in Java programming?**
**A:** Constants (`static final`), method parameters (prevent reassignment, especially in lambdas), local variables captured by lambdas/anonymous classes (must be effectively final), and immutable class fields.

**Q: How does the final keyword contribute to immutability and thread safety in Java?**
**A:** `final` fields have a special guarantee in the **Java Memory Model**: once an object's constructor completes, all `final` fields are guaranteed to be visible to other threads without synchronization. This is called **safe publication** — it's why immutable objects (all `final` fields) are inherently thread-safe.

---

## Sorting, Collections & Design Patterns

**Q: Name of the algorithm used by `Arrays.sort` and `Collections.sort`.**
**A:**
| Method | Type | Algorithm | Complexity |
|--------|------|-----------|------------|
| `Arrays.sort(int[])` | Primitives | **Dual-Pivot Quicksort** | O(n log n) average, O(n²) worst |
| `Arrays.sort(Object[])` | Objects | **TimSort** (merge + insertion sort) | O(n log n) guaranteed, stable |
| `Collections.sort()` | Objects | **TimSort** (delegates to `Arrays.sort()`) | O(n log n) guaranteed, stable |

TimSort exploits existing order in data ("runs") — nearly-sorted arrays are sorted in O(n). It's also **stable** (preserves order of equal elements), which is critical for multi-key sorting.

**Q: Can you give an example where a TreeSet is more appropriate?**
**A:** When you need **sorted iteration** and **range queries**:
```java
TreeSet<Integer> scores = new TreeSet<>(List.of(95, 72, 88, 60, 100));
scores.headSet(80);    // [60, 72] — all scores below 80
scores.tailSet(90);    // [95, 100] — all scores 90+
scores.first();        // 60 — minimum
scores.last();         // 100 — maximum
```

**Q: What is the internal working of HashMap in Java?**
**A:** See the detailed explanation in the [Collections Interview Questions](./collections-interview-questions.md#explain-the-internal-working-of-hashmap) section. Key points: hash perturbation, bucket index via `hash & (capacity-1)`, linked list → Red-Black Tree treeification at threshold 8, load factor 0.75.

**Q: What happens when two keys have the same hash code?**
**A:** A **hash collision**. Both keys land in the same bucket and are chained as a linked list. The `equals()` method differentiates them within the chain. In Java 8+, if the chain exceeds 8 nodes (and capacity ≥ 64), it's converted to a Red-Black Tree for O(log n) lookup instead of O(n).

**Q: Can you please tell me what changes were done for the HashMap in Java 8 because before Java 8 HashMap behaved differently?**
**A:**
1. **Treeification:** Long collision chains convert from linked list → Red-Black Tree (O(n) → O(log n)).
2. **Hash function:** Simplified from multiple shifts/XORs to a single `hashCode() ^ (hashCode() >>> 16)`.
3. **Resize optimization:** Entries either stay in the same bucket or move to `oldIndex + oldCapacity` (bitwise check instead of full rehash).
4. **Iteration:** `Node` class replaces `Entry` — cleaner internal API.

**Q: How does ConcurrentHashMap improve performance in a multi-threaded environment?**
**A:** See the [Collections section](./collections-interview-questions.md#explain-the-internal-working-of-concurrenthashmap). In Java 8+, it uses CAS for empty bucket insertion and per-node `synchronized` for collisions — far superior to full-map locking.

**Q: How can design patterns affect the performance of a Java application?**
**A:** Design patterns add **abstraction layers** (interfaces, factories, proxies), each introducing method dispatch overhead. However, the JIT compiler aggressively **inlines** small methods and **devirtualizes** interface calls when only one implementation exists (monomorphic dispatch). In practice, the maintainability and extensibility benefits vastly outweigh the negligible performance cost. The real danger is **over-engineering** — applying patterns where simple code suffices.

**Q: Which design pattern would you use to manage database connections efficiently in a Java application?**
**A:** The **Object Pool pattern** — specifically, a connection pool like **HikariCP**. While Singletons manage the pool instance, the pool itself maintains a fixed number of reusable `Connection` objects. Creating a JDBC connection costs ~5-10ms (TCP handshake + authentication), so pooling amortizes this cost across thousands of requests.

**Q: How would you handle a scenario where two threads need to update the same data structure?**
**A:** Depends on the operation complexity:
- **Simple counter:** `AtomicInteger` or `LongAdder` (lock-free).
- **Key-value map:** `ConcurrentHashMap` (per-node locking).
- **Compound operation (check-then-act):** `synchronized` block or `ReentrantLock`.
- **Read-heavy, write-rare:** `ReadWriteLock` or `CopyOnWriteArrayList`.
- **Producer-consumer:** `BlockingQueue`.

**Q: Can we start a thread twice?**
**A:** No. `IllegalThreadStateException` is thrown. A thread transitions `NEW → RUNNABLE → ... → TERMINATED` — the lifecycle is one-way. Reuse threads via `ExecutorService` instead.

**Q: Can we create a server in a Java application without creating Spring or any other framework?**
**A:** Yes, using core Java SE APIs:
```java
// Simple HTTP server (Java 6+)
HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
server.createContext("/api", exchange -> {
    String response = "{\"status\":\"ok\"}";
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(200, response.length());
    exchange.getResponseBody().write(response.getBytes());
    exchange.close();
});
server.start();

// TCP server
ServerSocket serverSocket = new ServerSocket(9090);
while (true) {
    Socket client = serverSocket.accept(); // Blocking
    new Thread(() -> handle(client)).start();
}
```