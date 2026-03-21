---
id: chapter-06-enums-and-annotations
title: "Chapter 6: Enums and Annotations"
sidebar_label: "6. Enums and Annotations"
---

# Chapter 6: Enums and Annotations

Java supports two special-purpose families of reference types: *enum types* (a kind of class) and *annotation types* (a kind of interface). This chapter discusses best practices for using these type families.

---

## Item 34: Use Enums Instead of int Constants

Before enum types, a common pattern was to declare a group of `int` constants:

```java
// BAD: int enum pattern — severely deficient
public static final int APPLE_FUJI = 0;
public static final int APPLE_PIPPIN = 1;
public static final int ORANGE_NAVEL = 2;
public static final int ORANGE_TEMPLE = 3;
```

Problems: no type safety, no namespace, won't compile-time fail if you pass an `ORANGE` where an `APPLE` is expected, printed values are just numbers.

### Basic Enum

```java
public enum Apple { FUJI, PIPPIN, GRANNY_SMITH }
public enum Orange { NAVEL, TEMPLE, BLOOD }
```

Enums are **classes that export one instance per constant** via public static final fields. They are effectively `final` — clients cannot create instances or extend them.

### Enums with Data and Behavior

Enums can have fields and methods. Use them to associate data with constants:

```java
public enum Planet {
    MERCURY (3.302e+23, 2.439e6),
    VENUS   (4.869e+24, 6.052e6),
    EARTH   (5.975e+24, 6.378e6);

    private final double mass;    // kg
    private final double radius;  // meters
    static final double G = 6.67300E-11;

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    double surfaceGravity() { return G * mass / (radius * radius); }
    double surfaceWeight(double mass) { return mass * surfaceGravity(); }
}
```

### Constant-Specific Method Implementations (Strategy Pattern)

Avoid switch statements on enums — instead, give each constant its own implementation:

```java
public enum Operation {
    PLUS("+") {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x / y; }
    };

    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }

    public abstract double apply(double x, double y);

    @Override public String toString() { return symbol; }
}
```

**Strategy pattern for shared behavior:** Use a private nested enum for shared behavior across subsets of constants (e.g., "WEEKDAY" / "WEEKEND" pay calculation).

**Enums can implement interfaces**, which makes them very powerful.

**`fromString` factory:**
```java
private static final Map<String, Operation> STRING_TO_ENUM =
    Stream.of(values()).collect(toMap(Object::toString, e -> e));

public static Optional<Operation> fromString(String symbol) {
    return Optional.ofNullable(STRING_TO_ENUM.get(symbol));
}
```

---

## Item 35: Use Instance Fields Instead of Ordinals

All enums have an `ordinal()` method that returns the position of a constant in the enum type. Never derive a value associated with an enum from its ordinal:

```java
// BAD: uses ordinal()
public enum Ensemble {
    SOLO, DUET, TRIO, QUARTET, QUINTET; // ...
    public int numberOfMusicians() { return ordinal() + 1; } // FRAGILE!
}

// GOOD: use an instance field
public enum Ensemble {
    SOLO(1), DUET(2), TRIO(3), QUARTET(4), QUINTET(5);
    private final int numberOfMusicians;
    Ensemble(int size) { this.numberOfMusicians = size; }
    public int numberOfMusicians() { return numberOfMusicians; }
}
```

---

## Item 36: Use EnumSet Instead of Bit Fields

When elements of an enum type are used in sets, it was traditional to use `int` bit fields:

```java
// BAD: bit field enum pattern
public static final int STYLE_BOLD = 1 << 0;   // 1
public static final int STYLE_ITALIC = 1 << 1; // 2
```

**Use `EnumSet` instead** — it's compact (internally a single `long` for enums with ≤64 elements), type-safe, and interoperable with other `Set` implementations.

```java
public class Text {
    public enum Style { BOLD, ITALIC, UNDERLINE, STRIKETHROUGH }

    public void applyStyles(Set<Style> styles) { ... }
}

// Usage:
text.applyStyles(EnumSet.of(Style.BOLD, Style.ITALIC));
```

Note: Use `Set<Style>` as the parameter type, not `EnumSet<Style>` — allows clients to pass other `Set` implementations (Item 64).

---

## Item 37: Use EnumMap Instead of Ordinal Indexing

Never use `ordinal()` to index into an array:

```java
// BAD: uses ordinal as array index
Set<Plant>[] plantsByLifeCycle =
    (Set<Plant>[]) new Set[Plant.LifeCycle.values().length];
for (int i = 0; i < plantsByLifeCycle.length; i++)
    plantsByLifeCycle[i] = new HashSet<>();

for (Plant p : garden)
    plantsByLifeCycle[p.lifeCycle.ordinal()].add(p); // fragile!
```

**Use `EnumMap` instead:**

```java
Map<Plant.LifeCycle, Set<Plant>> plantsByLifeCycle =
    new EnumMap<>(Plant.LifeCycle.class);
for (Plant.LifeCycle lc : Plant.LifeCycle.values())
    plantsByLifeCycle.put(lc, new HashSet<>());
for (Plant p : garden)
    plantsByLifeCycle.get(p.lifeCycle).add(p);
```

For multi-dimensional transitions (e.g., SOLID → LIQUID → GAS), use `EnumMap<..., EnumMap<..., ...>>` or stream-based `groupingBy`.

---

## Item 38: Emulate Extensible Enums with Interfaces

Enums cannot be extended. But you can emulate it by using an interface:

```java
public interface Operation {
    double apply(double x, double y);
}

public enum BasicOperation implements Operation {
    PLUS("+") { public double apply(double x, double y) { return x + y; } },
    MINUS("-") { public double apply(double x, double y) { return x - y; } };
    // ...
}

public enum ExtendedOperation implements Operation {
    EXP("^") { public double apply(double x, double y) { return Math.pow(x, y); } },
    REMAINDER("%") { public double apply(double x, double y) { return x % y; } };
    // ...
}
```

Now both `BasicOperation` and `ExtendedOperation` implement `Operation`. APIs that accept `Operation` work with both.

---

## Item 39: Prefer Annotations to Naming Patterns

Before annotations, it was common to use **naming patterns** to signal special treatment by tools or frameworks. For example, JUnit 3 required test methods to start with `test`.

Problems: typos silently skip tests, no way to associate parameter values, no type-checking.

**Annotations solve all these problems:**

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {} // Marker annotation

// Test runner uses reflection:
for (Method m : testClass.getDeclaredMethods()) {
    if (m.isAnnotationPresent(Test.class)) {
        try {
            m.invoke(null);
            passed++;
        } catch (InvocationTargetException wrappedExc) {
            failed++;
            System.out.println(m + " failed: " + wrappedExc.getCause());
        }
    }
}
```

**Annotations with parameters:**

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTest {
    Class<? extends Throwable>[] value(); // Supports array of exception types
}

@ExceptionTest({ IndexOutOfBoundsException.class, NullPointerException.class })
public static void doublyBad() { ... }
```

**Repeatable annotations** (Java 8):

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(ExceptionTestContainer.class)
public @interface ExceptionTest { Class<? extends Throwable> value(); }
```

---

## Item 40: Consistently Use the Override Annotation

`@Override` should be used on every method declaration that you believe overrides a superclass declaration.

```java
// BAD: looks like it overrides equals, but doesn't! (different signature)
public boolean equals(Bigram b) { return b.first == first && b.second == second; }

// GOOD: compiler error caught immediately
@Override
public boolean equals(Object o) { ... }
```

**The only case where it's not necessary:** a concrete class overriding an abstract method (the compiler would catch missing implementations anyway). But there's no harm in including `@Override` there too.

---

## Item 41: Use Marker Interfaces to Define Types

A **marker interface** is an interface with no methods (e.g., `Serializable`, `Cloneable`). It serves as a type that marks objects as having some property.

**Marker interfaces vs. marker annotations:**

- **Marker interfaces define a type** — you can use it as a parameter type, enabling compile-time type checking. `ObjectOutputStream.writeObject(Object o)` should have been `writeObject(Serializable s)`.
- **Marker annotations are more flexible** — they can be applied to classes, methods, fields, packages, etc.

Use marker interfaces when you want to define a **type** that adds no new methods. Use marker annotations when you want to add metadata to elements beyond classes and interfaces, or when the framework already uses annotations pervasively (Spring, JUnit).
