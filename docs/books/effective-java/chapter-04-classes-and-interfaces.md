---
id: chapter-04-classes-and-interfaces
title: "Chapter 4: Classes and Interfaces"
sidebar_label: "4. Classes and Interfaces"
---

# Chapter 4: Classes and Interfaces

Classes and interfaces are the heart of the Java programming language. This chapter gives guidelines for making the best use of these language elements so that classes and interfaces are usable, robust, and flexible.

---

## Item 15: Minimize the Accessibility of Classes and Members

The single most important factor that distinguishes a well-designed module from a poorly designed one is the degree to which it **hides its internal data and implementation details**. This is *information hiding* or *encapsulation*.

### Rules

- **Make each class or member as inaccessible as possible.**
- Top-level classes and interfaces: `package-private` (or `public` only if it's truly part of your exported API).
- Members (fields, methods, nested classes): `private` → `package-private` → `protected` → `public`.
- If you override a superclass method, you cannot reduce its accessibility.

### Key Points

- `public static final` fields are fine for constants, but **never** expose a `public static final` array or a field that returns a mutable container — it is a security hole:

```java
// PROBLEM
public static final Thing[] VALUES = { ... };

// FIX 1: Private array, public unmodifiable list
private static final Thing[] PRIVATE_VALUES = { ... };
public static final List<Thing> VALUES =
    Collections.unmodifiableList(Arrays.asList(PRIVATE_VALUES));

// FIX 2: Private array, public clone
public static final Thing[] values() {
    return PRIVATE_VALUES.clone();
}
```

- As of Java 9, the module system introduces two additional implicit access levels, but they are of limited use for most developers.

---

## Item 16: In Public Classes, Use Accessor Methods, Not Public Fields

If a class is accessible outside its package, **always use accessor methods** (getters/setters), not `public` fields.

```java
// WRONG — data fields are directly accessible!
class Point {
    public double x;
    public double y;
}

// RIGHT — encapsulated with accessor methods
class Point {
    private double x;
    private double y;
    public Point(double x, double y) { this.x = x; this.y = y; }
    public double getX() { return x; }
    public double getY() { return y; }
    public void setX(double x) { this.x = x; }
    public void setY(double y) { this.y = y; }
}
```

Exception: package-private or private nested classes can expose fields directly — it produces less visual clutter and the access is limited anyway.

---

## Item 17: Minimize Mutability

An **immutable class** is one whose instances cannot be modified. All information in the instance is provided at creation time and remains fixed for the lifetime of the object (`String`, `BigInteger`, `BigDecimal`).

### Five Rules for Immutability

1. **Don't provide methods that modify the object's state** (no mutators).
2. **Ensure the class can't be extended** — make it `final` or use the static factory + private constructor pattern.
3. **Make all fields `final`.**
4. **Make all fields `private`.**
5. **Ensure exclusive access to any mutable components** — never return a reference to a mutable field; make defensive copies.

```java
public final class Complex {
    private final double re;
    private final double im;

    public Complex(double re, double im) { this.re = re; this.im = im; }
    public double realPart() { return re; }
    public double imaginaryPart() { return im; }

    // Operations return new instances — "functional" approach
    public Complex plus(Complex c) {
        return new Complex(re + c.re, im + c.im);
    }
}
```

### Advantages of Immutability

- **Thread-safe** — no synchronization required
- Can be shared freely — no need for defensive copies
- Can share internals (e.g., `BigInteger.negate()`)
- Make great building blocks for other objects (map keys, set elements)
- Failure atomicity (Item 76) for free

### Disadvantages

- Require a separate object for each distinct value (can be costly for large objects).
- Use a mutable *companion class* for complex multi-step operations (e.g., `StringBuilder` for `String`).

> **Classes should be immutable unless there's a good reason to make them mutable.** If you can't make a class immutable, minimize its mutability. Make every field `private final` unless there is a compelling reason otherwise.

---

## Item 18: Favor Composition Over Inheritance

Inheritance (the `extends` keyword) is **powerful but problematic** when used across package boundaries. It violates encapsulation: a subclass depends on the implementation details of its superclass.

### The Problem

```java
// Broken — subclass depends on HashSet's internals
public class InstrumentedHashSet<E> extends HashSet<E> {
    private int addCount = 0;

    @Override public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c); // This calls add() internally, double-counting!
    }
}

s.addAll(List.of("Snap", "Crackle", "Pop")); // addCount is 6, not 3!
```

The fix is not `addAll` calling `super.addAll` then subtracting — you'd be tied to the implementation.

### The Solution: Composition (Wrapper / Decorator Pattern)

```java
public class InstrumentedSet<E> extends ForwardingSet<E> {
    private int addCount = 0;
    public InstrumentedSet(Set<E> s) { super(s); }

    @Override public boolean add(E e) { addCount++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); return super.addAll(c);
    }
    public int getAddCount() { return addCount; }
}

// Forwarding class
public class ForwardingSet<E> implements Set<E> {
    private final Set<E> s;
    public ForwardingSet(Set<E> s) { this.s = s; }
    public boolean add(E e) { return s.add(e); }
    public boolean addAll(Collection<? extends E> c) { return s.addAll(c); }
    // ... delegate all other methods
}
```

This is the **decorator pattern**. `InstrumentedSet` wraps any `Set` implementation and adds instrumentation.

**Inheritance is appropriate only when a genuine "is-a" relationship exists and the superclass is designed for inheritance.** Ask yourself: is every B really an A? Does the API of the superclass have any flaws that would propagate to the subclass?

---

## Item 19: Design and Document for Inheritance or Else Prohibit It

Designing a class for inheritance is hard. You must:
- Document exactly **which self-use overridable methods occur**, when, and how the results are used.
- The **only way to test** a class designed for inheritance is to **write subclasses**.
- **Constructors must never invoke overridable methods** — the overriding method will run before the subclass constructor, potentially operating on uninitialized state.

```java
public class Super {
    public Super() {
        overrideMe(); // DANGER: calls the overriding method before subclass constructor runs
    }
    public void overrideMe() {}
}

public final class Sub extends Super {
    private final Instant instant;
    Sub() {
        instant = Instant.now(); // set AFTER Super() runs
    }
    @Override public void overrideMe() {
        System.out.println(instant); // prints null on first call!
    }
}
```

**If a class is not designed and documented for inheritance, prohibit it** by making the class `final` or making all constructors private/package-private and using static factories.

---

## Item 20: Prefer Interfaces to Abstract Classes

Java allows only **single inheritance** of class but **multiple implementation** of interfaces. Interfaces are generally superior to abstract classes for defining types that permit multiple implementations.

### Advantages of Interfaces

- **Existing classes can easily implement a new interface** (just add `implements` and the methods). Existing classes can rarely be retrofitted to extend a new abstract class.
- **Interfaces are ideal for defining mixins** (e.g., `Comparable`, `Serializable`).
- **Interfaces allow nonhierarchical type frameworks.** Real-world types often don't fit neatly into a hierarchy:

```java
public interface Singer { AudioClip sing(Song s); }
public interface Songwriter { Song compose(int chartPosition); }
// A type can be both:
public interface SingerSongwriter extends Singer, Songwriter {
    AudioClip strum();
    void actSensitive();
}
```

### Skeletal Implementation (Abstract Interface Pattern)

Combine interface flexibility with the code reuse of abstract classes: provide a **skeletal implementation** (`AbstractInterface`):

```java
public abstract class AbstractList<E> extends AbstractCollection<E> implements List<E> {
    // Provides default implementations for many methods
}
```

The skeletal implementation takes care of all the interface methods above the primitives. Subclasses only need to implement a few "primitive" methods.

If a skeletal implementation can't be provided (e.g., interface can't be modified), use **default methods** in the interface (but with care — they can cause problems with `equals`, `hashCode`, `toString`).

---

## Item 21: Design Interfaces for Posterity

Java 8 added **default methods** to interfaces so new methods can be added to existing interfaces. However, not all default methods work perfectly with all pre-existing implementations.

The `removeIf` default method added to `Collection` broke `SynchronizedCollection` implementations — they bypass the synchronization when `removeIf` iterates.

> **Do not count on correcting interface design mistakes after the fact with default methods.** It is still crucial to design interfaces carefully. Always test a new interface by writing at least three different implementations before releasing it.

---

## Item 22: Use Interfaces Only to Define Types

When a class implements an interface, it serves as a **type** for referring to instances. Using an interface solely to export constants is wrong — this is the **constant interface anti-pattern**:

```java
// WRONG: Constant interface anti-pattern
public interface PhysicalConstants {
    static final double AVOGADROS_NUMBER = 6.022_140_857e23;
    static final double BOLTZMANN_CONST = 1.380_648_52e-23;
}

// RIGHT: Use a utility class or enum
public class PhysicalConstants {
    private PhysicalConstants() {} // Non-instantiable
    public static final double AVOGADROS_NUMBER = 6.022_140_857e23;
}
```

Use a `static import` if you need access without class qualification.

---

## Item 23: Prefer Class Hierarchies to Tagged Classes

A **tagged class** is one that uses an internal "tag" field to indicate what kind of object it represents:

```java
// BAD: tagged class
class Figure {
    enum Shape { RECTANGLE, CIRCLE }
    final Shape shape;
    double length; double width; // used only for RECTANGLE
    double radius; // used only for CIRCLE
    // ...
}
```

Tagged classes are cluttered, error-prone, and inefficient. Replace them with a **class hierarchy**:

```java
abstract class Figure {
    abstract double area();
}
class Circle extends Figure {
    final double radius;
    @Override double area() { return Math.PI * radius * radius; }
}
class Rectangle extends Figure {
    final double length, width;
    @Override double area() { return length * width; }
}
```

---

## Item 24: Favor Static Member Classes over Nonstatic

A nested class should serve only the enclosing class. There are four kinds of nested classes:
- **Static member class** — regular class inside another; can access private members of outer class
- **Nonstatic member class** — implicitly associated with an instance of its enclosing class (via the "hidden" reference)
- **Anonymous class** — like a local class but declared and instantiated simultaneously
- **Local class** — a class declared inside a method

**Common mistake:** If a member class doesn't need access to the enclosing instance, declare it `static`. Every nonstatic member class instance has a hidden reference to its enclosing instance — which costs memory, time, and can prevent GC.

Private static member classes are commonly used to represent components of outer class objects (e.g., `Map.Entry`).

---

## Item 25: Limit Source Files to a Single Top-Level Class

**Never put multiple top-level class definitions in a single source file.** The order in which source files are passed to the compiler can affect program behavior — a subtle, insidious bug:

```java
// TWO top-level classes in Utensil.java — BAD
class Utensil { static final String NAME = "pan"; }
class Dessert { static final String NAME = "cake"; }
```

If both `Utensil.java` and `Dessert.java` define these classes, compilation order determines which definitions win. Use separate source files, or use static member classes (which have minimal encapsulation cost and don't cause this problem).
