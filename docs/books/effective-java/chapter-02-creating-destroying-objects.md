---
id: chapter-02-creating-destroying-objects
title: "Chapter 2: Creating and Destroying Objects"
sidebar_label: "2. Creating & Destroying Objects"
---

# Chapter 2: Creating and Destroying Objects

This chapter covers the full lifecycle of objects: when and how to create them, when and how to avoid creating them, how to ensure they are destroyed in a timely manner, and how to manage any cleanup actions that must precede their destruction.

---

## Item 1: Consider Static Factory Methods Instead of Constructors

The traditional way to allow a client to obtain an instance is to provide a **public constructor**. A lesser-known but powerful alternative is a **public static factory method** — a static method that returns an instance of the class.

```java
// Example from Boolean class
public static Boolean valueOf(boolean b) {
    return b ? Boolean.TRUE : Boolean.FALSE;
}
```

### Advantages

**1. They have names.**
A constructor named `BigInteger(int, int, Random)` is opaque. A static factory named `BigInteger.probablePrime(...)` is self-documenting. A class can only have one constructor per signature, but can have multiple static factories with descriptive names.

**2. They are not required to create a new object each time.**
This allows immutable classes to use pre-constructed instances or caching. `Boolean.valueOf(boolean)` never creates a new object. This is the basis of the Flyweight pattern and enables *instance-controlled* classes (singletons, noninstantiable types, value uniqueness guarantees).

**3. They can return any subtype of their return type.**
This is the basis of interface-based frameworks. The Java Collections Framework exports 45 utility implementations through static factories in `java.util.Collections`. As of Java 9, interfaces can have static factory methods directly.

**4. The class of the returned object can vary with parameters.**
`EnumSet.of(...)` returns a `RegularEnumSet` for ≤64 elements and a `JumboEnumSet` for larger ones — transparently.

**5. The class of the returned object need not exist when the class is written.**
This forms the basis of service provider frameworks (JDBC): a provider registers an implementation, and clients obtain it through the framework. `ServiceLoader` formalizes this.

### Disadvantages

- Classes without public/protected constructors **cannot be subclassed** (but this encourages composition over inheritance — Item 18).
- Static factory methods are **hard to find in documentation**. They don't stand out like constructors. Use conventional names:

| Convention | Purpose |
|---|---|
| `from` | Type-conversion: `Date.from(instant)` |
| `of` | Aggregation: `EnumSet.of(JACK, QUEEN, KING)` |
| `valueOf` | More verbose alternative: `BigInteger.valueOf(long)` |
| `instance` / `getInstance` | Returns a described instance |
| `create` / `newInstance` | Guarantees a new instance each call |
| `getType` | Returns a different type: `Files.getFileStore(path)` |
| `newType` | New instance of different type: `BufferedReader.newBufferedReader()` |
| `type` | Concise alternative: `Collections.list(legacyLitany)` |

---

## Item 2: Consider a Builder When Faced with Many Constructor Parameters

Static factories and constructors share a limitation: they don't scale well to **many optional parameters**.

### Telescoping Constructor (Anti-pattern)

```java
public NutritionFacts(int servingSize, int servings) { ... }
public NutritionFacts(int servingSize, int servings, int calories) { ... }
public NutritionFacts(int servingSize, int servings, int calories, int fat) { ... }
// ... and so on
```
Hard to write, hard to read, easy to get parameter order wrong.

### JavaBeans (Anti-pattern for immutability)

```java
NutritionFacts cocaCola = new NutritionFacts();
cocaCola.setServingSize(240);
cocaCola.setServings(8);
cocaCola.setCalories(100);
```
Allows construction in an **inconsistent state** across multiple calls. Precludes making the class immutable.

### Builder Pattern (Recommended)

```java
public class NutritionFacts {
    private final int servingSize;
    private final int servings;
    private final int calories;
    private final int fat;

    public static class Builder {
        // Required parameters
        private final int servingSize;
        private final int servings;
        // Optional parameters — initialized to defaults
        private int calories = 0;
        private int fat = 0;

        public Builder(int servingSize, int servings) {
            this.servingSize = servingSize;
            this.servings = servings;
        }

        public Builder calories(int val) { calories = val; return this; }
        public Builder fat(int val) { fat = val; return this; }

        public NutritionFacts build() {
            return new NutritionFacts(this);
        }
    }
    private NutritionFacts(Builder builder) {
        servingSize = builder.servingSize;
        servings = builder.servings;
        calories = builder.calories;
        fat = builder.fat;
    }
}

// Usage:
NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8)
    .calories(100)
    .fat(0)
    .build();
```

The Builder pattern simulates **named optional parameters** as in Python/Scala. It's well-suited to class hierarchies — use a simulated self-type (`abstract Builder<T extends Builder<T>>`) so subclass builders can be returned from inherited setter methods.

**When to use:** Typically when there are **4+ parameters**, especially if most are optional. It's often better to start with a builder if you think you'll need one.

---

## Item 3: Enforce the Singleton Property with a Private Constructor or an Enum Type

A **singleton** is a class that is instantiated exactly once, typically representing a stateless service or a unique system component.

### Approach 1: Public Final Field

```java
public class Elvis {
    public static final Elvis INSTANCE = new Elvis();
    private Elvis() { ... }
    public void leaveTheBuilding() { ... }
}
```

### Approach 2: Static Factory Method

```java
public class Elvis {
    private static final Elvis INSTANCE = new Elvis();
    private Elvis() { ... }
    public static Elvis getInstance() { return INSTANCE; }
}
```

Advantages: flexibility to change to non-singleton later without changing API, can make it generic, can use a method reference as a supplier (`Elvis::getInstance`).

### Approach 3: Enum (Preferred)

```java
public enum Elvis {
    INSTANCE;
    public void leaveTheBuilding() { ... }
}
```

This is the **best approach**: concise, provides serialization machinery for free, and provides an **ironclad guarantee** against multiple instantiation — even in the face of sophisticated serialization or reflection attacks. The only downside: can't use if the class must extend a superclass.

---

## Item 4: Enforce Noninstantiability with a Private Constructor

Utility classes (like `java.lang.Math`, `java.util.Arrays`, `java.util.Collections`) are not designed to be instantiated. Making them abstract doesn't work — they can be subclassed and the subclass instantiated.

```java
public class UtilityClass {
    // Suppress default constructor for noninstantiability
    private UtilityClass() {
        throw new AssertionError();
    }
    // ... static methods
}
```

The `AssertionError` isn't strictly required but provides insurance. Add a comment explaining why the constructor exists.

---

## Item 5: Prefer Dependency Injection to Hardwiring Resources

Static utility classes and singletons are inappropriate for classes that depend on underlying resources. Do **not** use a singleton or static utility class for a `SpellChecker` that depends on a `Lexicon` — different clients need different lexicons.

**Instead, pass the resource into the constructor:**

```java
public class SpellChecker {
    private final Lexicon dictionary;

    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }
    // ...
}
```

This is **dependency injection** — a simple, testable, flexible pattern. A useful variant is passing a **resource factory** (e.g., `Supplier<T>`) instead of the resource itself. DI frameworks like **Spring** and **Guice** automate this at scale.

> For Spring developers: `@Autowired` constructor injection is the recommended practice and directly embodies this item.

---

## Item 6: Avoid Creating Unnecessary Objects

Reuse a single object instead of creating a new functionally equivalent one each time.

```java
// BAD: creates a new String every time
String s = new String("bikini");

// GOOD: uses a single literal instance
String s = "bikini";
```

**Autoboxing** is a subtle trap:

```java
// SLOW: creates ~2^31 Long instances
Long sum = 0L;
for (long i = 0; i <= Integer.MAX_VALUE; i++) {
    sum += i; // autoboxes i
}
```

Fix: use `long` instead of `Long`. **Prefer primitives to boxed primitives and watch out for unintentional autoboxing.**

Also, prefer reusing expensive objects (compiled `Pattern`, DB connections) through caching or lazy initialization. However, don't over-optimize — the cost of a small object creation is trivial; defensive copying (Item 50) is far more important to get right.

---

## Item 7: Eliminate Obsolete Object References

Java's GC does not prevent all memory leaks. A common source is **obsolete references** — references that are no longer used but are still held.

```java
// Can you spot the memory leak?
public Object pop() {
    if (size == 0) throw new EmptyStackException();
    return elements[--size]; // FIX: elements[size] = null; // Eliminate obsolete reference
}
```

**Solution:** null out references once they become obsolete, but do this only when it's truly necessary (managing your own memory). Don't clutter every method with null-outs.

**Common sources of memory leaks:**
- Classes that manage their own memory (arrays, pools)
- **Caches** — use `WeakHashMap` or `LinkedHashMap` with `removeEldestEntry`
- **Listeners and callbacks** — store only weak references

---

## Item 8: Avoid Finalizers and Cleaners

**Finalizers** (`finalize()`) are unpredictable, dangerous, and generally unnecessary. **Cleaners** (Java 9 replacement) are less dangerous but still unpredictable and slow.

There is **no guarantee** when (or if) they'll be executed. Never do anything time-critical in a finalizer/cleaner. Never release critical resources (file handles, locks) in them.

**The right approach:** implement `AutoCloseable` and use **try-with-resources** (Item 9).

Legitimate uses for cleaners/finalizers:
1. A safety net for resources whose owner forgets to call `close()`.
2. Objects with **native peers** (non-Java objects) that the GC doesn't know about.

---

## Item 9: Prefer try-with-resources to try-finally

Java 7 introduced `try`-with-resources. For resources that must be closed, it's always preferable.

```java
// try-finally — BAD (especially with multiple resources)
static String firstLineOfFile(String path) throws IOException {
    BufferedReader br = new BufferedReader(new FileReader(path));
    try {
        return br.readLine();
    } finally {
        br.close(); // If readLine() throws AND close() throws, the second exception silently suppresses the first!
    }
}

// try-with-resources — GOOD
static String firstLineOfFile(String path) throws IOException {
    try (BufferedReader br = new BufferedReader(new FileReader(path))) {
        return br.readLine();
    }
}

// Multiple resources — still clean
static void copy(String src, String dst) throws IOException {
    try (InputStream in = new FileInputStream(src);
         OutputStream out = new FileOutputStream(dst)) {
        byte[] buf = new byte[BUFFER_SIZE];
        int n;
        while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);
    }
}
```

Resources are closed in reverse order. Suppressed exceptions from close() are preserved and accessible via `getSuppressed()`. You can still add catch/finally clauses.

**Any class that represents a resource should implement `AutoCloseable`.**
