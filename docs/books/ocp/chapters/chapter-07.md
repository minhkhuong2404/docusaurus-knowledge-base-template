---
id: chapter-07
title: "Chapter 7 — Beyond Classes"
sidebar_label: "Ch 7 · Beyond Classes"
description: "Covers interfaces (default, static, private methods), functional interfaces, enums with fields/constructors, records, sealed classes, and nested classes — all featuring heavily in the OCP Java 21 exam with Java 21-specific additions like pattern matching and exhaustive switch."
tags:
  - interfaces
  - enums
  - records
  - sealed-classes
  - nested-classes
  - functional-interface
  - default-methods
  - java-21
  - pattern-matching
---

# Chapter 7 — Beyond Classes

<span class="chapter-badge">Exam Domain: Using Object-Oriented Concepts in Java</span>

> **Key Topics:** Interfaces, default/static/private interface methods, enums, records, sealed classes, nested classes.

---

## 🟦 New Learner: Modern Java Type System

### Interfaces

An interface defines a **contract** — what a class can do, not how:

```java
public interface Flyable {
    // Implicitly: public abstract
    double getMaxAltitude();

    // Default method (Java 8+) — provides implementation
    default String describe() {
        return "Can fly up to " + getMaxAltitude() + "m";
    }

    // Static method (Java 8+) — utility, called on interface
    static boolean isHighAltitude(double altitude) {
        return altitude > 10000;
    }

    // Private method (Java 9+) — shared helper for default methods
    private void logFlight() {
        System.out.println("Flying...");
    }
}

public class Eagle implements Flyable {
    @Override
    public double getMaxAltitude() { return 3000; }
}
```

| Member Type | Modifier | Inherited by implementing class? |
|-------------|----------|----------------------------------|
| Abstract method | `public abstract` (implicit) | Yes |
| Default method | `public default` | Yes (can override) |
| Static method | `public static` | No (call on interface) |
| Private method | `private` | No |
| Constant | `public static final` (implicit) | Yes |

---

### Multiple Interface Implementation

```java
interface Swimmable {
    void swim();
}
interface Flyable {
    void fly();
}

class Duck implements Swimmable, Flyable {
    @Override public void swim() { System.out.println("Swimming"); }
    @Override public void fly()  { System.out.println("Flying"); }
}
```

**Default method conflict resolution:** If two interfaces provide the same default method, the implementing class MUST override it:

```java
interface A { default void hello() { System.out.println("A"); } }
interface B { default void hello() { System.out.println("B"); } }

class C implements A, B {
    @Override
    public void hello() {
        A.super.hello(); // explicitly call A's version
    }
}
```

---

### Enums

Enums represent a fixed set of constants:

```java
public enum Season {
    SPRING, SUMMER, FALL, WINTER;

    // Enums can have methods
    public boolean isWarm() {
        return this == SPRING || this == SUMMER;
    }
}

Season s = Season.SUMMER;
System.out.println(s.name());    // "SUMMER"
System.out.println(s.ordinal()); // 1 (zero-based)
Season[] all = Season.values();  // all constants
Season parsed = Season.valueOf("WINTER"); // WINTER

// In switch
switch (s) {
    case SUMMER, SPRING -> System.out.println("Warm");
    default -> System.out.println("Cold");
}
```

**Enums with fields and constructors:**

```java
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS  (4.869e+24, 6.0518e6),
    EARTH  (5.976e+24, 6.37814e6);

    private final double mass;
    private final double radius;

    Planet(double mass, double radius) { // constructor is always private
        this.mass = mass;
        this.radius = radius;
    }

    double surfaceGravity() {
        final double G = 6.67300E-11;
        return G * mass / (radius * radius);
    }
}
```

---

### Records (Java 16+)

Records are **immutable data carriers** — they auto-generate constructor, getters, `equals`, `hashCode`, and `toString`:

```java
public record Point(int x, int y) {}
// Equivalent to a class with:
// - private final int x, y
// - canonical constructor Point(int x, int y)
// - getters: x(), y() (not getX()!)
// - equals, hashCode, toString

Point p = new Point(3, 4);
System.out.println(p.x());        // 3
System.out.println(p.y());        // 4
System.out.println(p);            // Point[x=3, y=4]

// Compact constructor (validate/normalize)
public record Range(int min, int max) {
    Range { // no parameter list in compact constructor
        if (min > max) throw new IllegalArgumentException("min > max");
    }
}
```

---

### Sealed Classes (Java 17+)

Sealed classes restrict which classes can extend them:

```java
public sealed class Shape permits Circle, Rectangle, Triangle {}

public final class Circle extends Shape {
    private final double radius;
    public Circle(double radius) { this.radius = radius; }
}

public non-sealed class Rectangle extends Shape { // can be freely extended
    public double width, height;
}

public sealed class Triangle extends Shape permits RightTriangle {}
```

**Permitted subclasses must be:**
- `final` — no further extension
- `sealed` — further restricts subclasses
- `non-sealed` — opens up extension freely

---

### Nested Classes

| Type | Keyword | Can access outer fields? | Requires outer instance? |
|------|---------|--------------------------|--------------------------|
| Inner class | none | Yes (including private) | Yes |
| Static nested | `static` | Only static fields | No |
| Local | inside method | Effectively final locals | No |
| Anonymous | inline | Effectively final locals | No |

```java
public class Outer {
    private int x = 10;

    class Inner {                      // inner class
        void show() { System.out.println(x); } // can access x
    }

    static class StaticNested {       // static nested
        void show() { System.out.println("no outer"); }
    }

    void method() {
        class Local {                 // local class
            void show() { System.out.println(x); }
        }
        Runnable r = new Runnable() { // anonymous class
            public void run() { System.out.println(x); }
        };
    }
}

// Usage
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner(); // needs outer instance
Outer.StaticNested nested = new Outer.StaticNested(); // no outer needed
```

---

## 🟣 Senior Deep Dive

### Interface Default Method Resolution Rules

Java uses three rules (in order):

1. **Classes win over interfaces** — if the class or its superclass provides the method, it wins
2. **More specific interface wins** — if one interface extends another, the more specific one's default wins
3. **Override required** — if neither rule resolves the conflict, the class must override

### Sealed Classes and Pattern Matching

Sealed classes enable **exhaustive** pattern matching — the compiler verifies all permitted subclasses are handled:

```java
sealed interface Expr permits Num, Add, Mul {}
record Num(int value) implements Expr {}
record Add(Expr left, Expr right) implements Expr {}
record Mul(Expr left, Expr right) implements Expr {}

int eval(Expr e) {
    return switch (e) {
        case Num(int v)          -> v;
        case Add(var l, var r)   -> eval(l) + eval(r);
        case Mul(var l, var r)   -> eval(l) * eval(r);
        // No default needed — all subclasses covered!
    };
}
```

### Record Internals

Records are NOT just "data classes":

```java
// Records can implement interfaces
public record Coordinate(double lat, double lon) implements Comparable<Coordinate> {
    // Custom static factory
    public static Coordinate of(String latLon) { ... }

    // Additional instance methods allowed
    public double distanceTo(Coordinate other) { ... }

    @Override
    public int compareTo(Coordinate other) {
        return Double.compare(this.lat, other.lat);
    }

    // You can override component accessors
    @Override
    public double lat() { return Math.round(lat * 1000.0) / 1000.0; }
}

// Records CANNOT:
// - extend another class (implicitly extends Record)
// - be abstract
// - have non-static non-final instance fields
// - have mutable state
```

### Anonymous Class vs Lambda

```java
// Anonymous class — can implement interface with multiple methods, has state
Comparator<String> comp = new Comparator<>() {
    private int callCount = 0; // has state!
    @Override
    public int compare(String a, String b) {
        callCount++;
        return a.compareTo(b);
    }
};

// Lambda — only for functional interfaces (exactly 1 abstract method)
Comparator<String> comp2 = (a, b) -> a.compareTo(b);
// Lambdas cannot have their own instance state
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| Interface constants | `public static final` (implicit) |
| `default` methods | Can be overridden; class implementation wins over interface |
| Enum constructor | Always `private`; called when constants created |
| `values()` / `valueOf()` | `values()` returns all constants; `valueOf("X")` parses from name |
| Record accessors | `x()` NOT `getX()` — no `get` prefix! |
| Record compact constructor | No parameter list; params in scope implicitly |
| Sealed permitted subclass | Must be `final`, `sealed`, or `non-sealed` |
| Inner class | Requires outer instance: `outer.new Inner()` |
| Static nested class | No outer instance needed: `new Outer.StaticNested()` |
| Interface variables | Implicitly `public static final` — cannot be reassigned |
| Enum ordinal | Zero-based; `ordinal()` returns position |
| Record fields | Implicitly `private final`; no setters auto-generated |
| `non-sealed` | Removes sealing restriction; subclasses can extend freely |
| Pattern `instanceof` | Binding variable in scope only where pattern matches; use `&&` carefully with flow scoping |
| Sealed + `switch` | Exhaustive `switch` on sealed type must cover all permitted subclasses (or use `default` where allowed) |
| Record `equals`/`hashCode` | Auto-generated from components; two records equal iff all components equal |
| Enum singleton | JVM guarantees one instance per enum constant; constructors run before static use |
| Interface `private` methods | Java 9+ — helper methods inside interface; not part of SAM count |
| Interface `static` methods | Not inherited by implementing classes; call with `InterfaceName.method()` |
| Sealed + permits | Permitted types must be accessible; typically same module/package per exam |
| Record cannot declare instance fields | Only components in header; extra state via static fields only |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 7]
**Trap 1 — Interface variables are implicitly final:**
```java
interface Limits {
    int MAX = 100; // public static final int MAX = 100
}
Limits.MAX = 200; // ❌ COMPILE ERROR — cannot reassign final
```

**Trap 2 — Enum with abstract methods:**
```java
enum Operation {
    PLUS {
        @Override public int apply(int a, int b) { return a + b; }
    },
    MINUS {
        @Override public int apply(int a, int b) { return a - b; }
    };
    public abstract int apply(int a, int b); // each constant MUST implement this
}
```

**Trap 3 — Record accessors use field name, NOT JavaBean style:**
```java
record Person(String firstName, int age) {}
Person p = new Person("Duke", 21);
p.firstName(); // ✅ correct accessor
p.getFirstName(); // ❌ NO such method — records don't use "get" prefix
```

**Trap 4 — Records cannot extend classes:**
```java
record Point(int x, int y) extends Object { } // ✅ Object is implicit
record Point(int x, int y) extends Shape { }  // ❌ records cannot extend classes
// Records can implement interfaces:
record Point(int x, int y) implements Comparable<Point> { ... } // ✅
```

**Trap 5 — sealed class — permitted subclass must be same compilation unit or explicitly listed:**
```java
// File: Shape.java
public sealed class Shape permits Circle, Rectangle { }

// ❌ Triangle cannot be added later in a separate module without updating permits
// ✅ All permitted types must be in the same package (or module)
```

**Trap 6 — Default method conflict resolution:**
```java
interface A { default String greet() { return "A"; } }
interface B { default String greet() { return "B"; } }

class C implements A, B {
    // ❌ COMPILE ERROR unless C overrides greet()
    @Override
    public String greet() {
        return A.super.greet(); // explicitly pick A's version
    }
}
```

**Trap 7 — Enum `values()` vs `valueOf()` exception:**
```java
Season s = Season.valueOf("SUMMER"); // ✅
Season s2 = Season.valueOf("summer"); // ❌ IllegalArgumentException — case-sensitive!
Season s3 = Season.valueOf("INVALID"); // ❌ IllegalArgumentException
```

**Trap 8 — Anonymous class vs lambda limitations:**
```java
Runnable r = new Runnable() {
    int count = 0;             // ✅ anonymous class CAN have state
    public void run() { count++; }
};

Runnable r2 = () -> { count++; }; // ❌ lambda CANNOT have own instance fields
```

**Trap 9 — Pattern variable and `&&` (flow scoping):**
```java
Object o = "hi";
if (o instanceof String s && s.length() > 1) {
    System.out.println(s); // ✅ s in scope — both conditions required for truth
}
if (o instanceof String s || s.length() > 1) { } // ❌ s not in scope in second part
```

**Trap 10 — Negated `instanceof` and pattern scope:**
```java
if (!(o instanceof String s)) {
    return;
}
System.out.println(s.length()); // ✅ s in scope here (pattern holds in remaining block)
```

**Trap 11 — Record compact constructor is for validation, not field reassignment:**
```java
record Range(int min, int max) {
    Range {
        if (min > max) throw new IllegalArgumentException(); // ✅
        // this.min = min; // ❌ illegal — components are assigned implicitly
    }
}
```

**Trap 12 — Enum cannot extend another enum:**
```java
enum A { X }
enum B extends A { Y } // ❌ enums cannot extend another enum (only java.lang.Enum implicitly)
```
:::

### Exam vignettes

```java
// Vignette 1 — Exhaustive switch on sealed hierarchy (Java 21)
sealed interface Pet permits Dog, Cat {}
final class Dog implements Pet {}
final class Cat implements Pet {}
String s = switch (pet) { // must cover Dog and Cat or use default
    case Dog d -> "woof";
    case Cat c -> "meow";
};

// Vignette 2 — Record accessor naming on exam
record Box(int id) {}
new Box(1).id();   // ✅
new Box(1).getId(); // ❌ compile-time error
```

:::tip[Spring/Senior Relevance]
- `sealed` interfaces + records + `switch` pattern matching form the backbone of modern Spring 6 / Boot 3 **discriminated union** patterns — replacing stringly-typed result wrappers.
- Spring `@Configuration` classes that implement interfaces with `default` methods must carefully follow the interface default method resolution rules, especially when multiple `@Configuration` classes are involved via `@Import`.
- Enums are widely used in Spring as strategy selectors (e.g., `@ConditionalOnProperty`), and their `valueOf()` is called internally for `@Value` injection — understand why case sensitivity matters.
:::

---

## 🔗 Review Questions Focus

1. What happens when two interfaces declare the same default method?
2. Can an enum have abstract methods?
3. What methods does a record auto-generate?
4. What are the three options for a permitted subclass of a sealed class?
5. How do you instantiate an inner (non-static nested) class?
6. Can a record implement an interface?
7. Can a record extend another class?
8. What is the difference between a static nested class and an inner class?
9. What does `Season.valueOf("SUMMER")` throw if "SUMMER" does not exist?
10. Can an interface have `private` methods in Java 9+?
