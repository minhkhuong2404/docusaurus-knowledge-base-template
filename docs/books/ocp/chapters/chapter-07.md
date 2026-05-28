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

> **Key Topics:** Interface members (abstract, default, static, private methods), implicit modifiers, enums (fields, constructors, custom methods), sealed classes & interfaces, record classes (canonical/compact constructors, immutability, pattern matching), nested classes (inner, static nested, local, anonymous), casting, and polymorphism.

---

## 🟦 New Learner: Interfaces, Enums, & Records

### Implementing Interfaces
An **interface** is an abstract data type that specifies a contract of abstract methods that implementing classes must define.
* **Syntax:** Declared using the `interface` keyword.
* **Inheritance:** A class may implement any number of interfaces (separated by commas). An interface can extend multiple other interfaces using the `extends` keyword.
* **Implicit Modifiers:**
  * Interfaces are implicitly `abstract` (specifying `abstract` is optional; marking them `final` is a compiler error).
  * Interface variables are implicitly `public static final` (constants).
  * Interface methods without a body are implicitly `public abstract`.
  * Non-private interface methods without an access modifier are implicitly `public`.

```java
public interface WalksOnTwoLegs {
    int MAX_LEGS = 2; // Implicitly: public static final int MAX_LEGS = 2;
    void walk();      // Implicitly: public abstract void walk();
}
```

```java
// Multiple interface inheritance
public interface Nocturnal {}
public interface CanFly {}
public interface HasBigEyes extends Nocturnal, CanFly {} // ✅ Interfaces can extend multiple interfaces
```

---

### Working with Enums
An **enumeration** (enum) represents a fixed, finite set of type-safe constants.
* **Values:** Enum values are public static final constants, commonly written in uppercase.
* **Construction:** Enums are initialized exactly once when the class is first loaded. You cannot extend an enum, and enums cannot be marked `final`.
* **Switch exhaustiveness:** When using enums in switch expressions, a `default` branch is not required if all enum values are covered.

```java
public enum Season {
    WINTER, SPRING, SUMMER, FALL; // Semicolon optional if only listing constants
}
```

#### Common Enum Methods:
* `values()`: Returns an array of all constants in declaration order.
* `name()`: Returns the string representation of the constant.
* `ordinal()`: Returns the zero-based declaration order position of the constant.
* `valueOf(String)`: Converts a String to the matching enum constant (case-sensitive; throws `IllegalArgumentException` on mismatch).

---

### Records Basics
A **record** is a special type of immutable class that removes boilerplate when carrying data.
* **Automatic Members:** The compiler automatically inserts:
  1. `private final` instance fields for each record component.
  2. A constructor with parameters matching the components (Canonical Constructor).
  3. Getter accessor methods named exactly after the components (e.g., `x()`, **not** `getX()`).
  4. `equals()`, `hashCode()`, and `toString()` implementations based on the components.

```java
public record Point(int x, int y) {} // That's it!
```

---

## 🟣 Senior Deep Dive: Interface Methods, Sealed Classes, Record Constructors, & Nested Types

### Interface Methods Matrix
Interfaces support six member types. Only `abstract`, `default`, and instance `private` methods are associated with an instance of the interface.

| Member Type | Access Modifier | Modifiers Required | Body? | Class or Instance? |
| :--- | :--- | :--- | :--- | :--- |
| **Constant variable** | `public` (implicit) | `static final` (implicit) | Yes | Class |
| **Abstract method** | `public` (implicit) | `abstract` (implicit) | No | Instance |
| **Default method** | `public` (implicit) | `default` | Yes | Instance |
| **Static method** | `public` (implicit) | `static` | Yes | Class |
| **Private method** | `private` | `private` | Yes | Instance |
| **Private static method**| `private` | `private static` | Yes | Class |

> [!WARNING]
> Interfaces do **not** support `protected` or package-private members. Any explicit attempt to use these modifiers results in a compilation error.

#### Default Method Conflict Resolution
If a class implements two interfaces that declare default methods with matching signatures, the compiler errors out due to ambiguity. The class **must** override the method:
```java
interface Walk { default int getSpeed() { return 5; } }
interface Run  { default int getSpeed() { return 10; } }

class Athlete implements Walk, Run {
    @Override
    public int getSpeed() {
        return Walk.super.getSpeed(); // ✅ Accesses Walk's default implementation
    }
}
```

#### Static Interface Methods
Unlike class static methods, static interface methods are **not inherited** by implementing classes or subinterfaces.
```java
interface Hop { static int getHeight() { return 8; } }
class Bunny implements Hop {
    public void print() {
        // System.out.println(getHeight());     // ❌ DOES NOT COMPILE
        System.out.println(Hop.getHeight());    // ✅ Compiles (Interface name required)
    }
}
```

---

### Complex Enums
Enums can contain instance variables, static variables, constructors, and methods.
* **Constructor Rule:** All enum constructors are implicitly `private`. Specifying `public` or `protected` is a compiler error.
* **Abstract Methods:** An enum can declare abstract methods. If it does, **every** enum constant must override it.

```java
public enum SeasonWithHours {
    WINTER {
        public String getHours() { return "10am-3pm"; }
    },
    SUMMER {
        public String getHours() { return "9am-7pm"; }
    },
    SPRING, FALL; // Uses default implementation below
    
    public String getHours() { return "9am-5pm"; } // Default implementation
}
```

---

### Sealed Classes and Interfaces
Sealed types restrict which subclasses or subinterfaces are allowed to extend or implement them.
* **Declaring:** Use the `sealed` modifier along with the `permits` clause.
* **Package/Module Constraint:** Subclasses must be declared in the **same package** (or same named module) as the sealed class.
* **Subclass Modifiers:** Every class that directly extends a sealed class must declare exactly one of these modifiers:
  1. `final`: Prevents any further subclasses.
  2. `sealed`: Permits a specific, nested subclass list.
  3. `non-sealed`: Opens the class so any unspecified subclass can extend it.

```java
public sealed class Shape permits Circle, Rectangle {}

public final class Circle extends Shape {}                  // ✅ Prevents further inheritance
public non-sealed class Rectangle extends Shape {}         // ✅ Can be extended by any class
```

#### Omitting the `permits` Clause:
If the sealed class and its subclasses are declared in the **same file**, or if the subclasses are **nested** inside the sealed class, the `permits` clause is optional.
```java
// Cobra.java
public sealed class Snake {
    final class Cobra extends Snake {} // ✅ Implicitly permitted since it's nested
}
```

#### Sealed Interfaces:
Sealed interfaces can restrict which interfaces can extend them or classes can implement them. Since interfaces cannot be marked `final`, subinterfaces can only be marked `sealed` or `non-sealed`.

---

### Customizing Records & Constructors
Records are implicitly `final` and cannot be extended. They cannot declare instance variables outside the record header. However, you can declare constructors:

#### 1. Compact Constructors
Specifically designed for records. It has **no parameters** and no parentheses. It processes validation/normalization before assigning fields implicitly.
```java
public record Range(int min, int max) {
    public Range { // ✅ Compact constructor (no parameter list)
        if (min > max) throw new IllegalArgumentException();
        // min = min; // Normalizes parameter value
        // this.min = min; // ❌ DOES NOT COMPILE (Cannot assign final fields directly here)
    }
}
```

#### 2. Canonical (Long) Constructors
Declares the full parameter list. Every field **must** be explicitly assigned.
```java
public record Range(int min, int max) {
    public Range(int min, int max) {
        if (min > max) throw new IllegalArgumentException();
        this.min = min;
        this.max = max; // ✅ Required explicit assignments
    }
}
```

#### 3. Overloaded Constructors
Must call the canonical constructor on the **very first line** using `this(...)`.
```java
public record Range(int min, int max) {
    public Range(int singleValue) {
        this(singleValue, singleValue); // ✅ Must delegate
    }
}
```

#### Record Pattern Matching (Java 21)
Destructuring records inside `instanceof` checks:
```java
record Monkey(String name, int age) {}

public void checkAnimal(Object obj) {
    if (obj instanceof Monkey(String name, int age)) {
        System.out.println(name + " is " + age); // ✅ Access variables directly
    }
}
```
* **Generics & var:** You can use `var` inside record patterns. Nested record patterns are also supported.
```java
if (couple instanceof Couple(Bear(var name, List<String> favs), var b)) {
    // Yogi bear nested extraction
}
```

---

### Nested Classes
There are four types of nested classes:

| Type | Declared Location | Static? | Access to Outer Members? |
| :--- | :--- | :--- | :--- |
| **Inner Class** | Member level | No | Yes (all fields & methods) |
| **Static Nested Class** | Member level | Yes | Only static fields & methods |
| **Local Class** | Inside method/block | No | Only final or effectively final local variables |
| **Anonymous Class** | Inline instantiation | No | Only final or effectively final local variables |

#### Inner Class Scope Referencing:
If an inner class defines variables with names matching the outer class, use `OuterClassName.this.variable` to reference the outer scope:
```java
public class Outer {
    private int x = 10;
    class Inner {
        private int x = 20;
        public void print() {
            System.out.println(x);            // 20
            System.out.println(this.x);       // 20
            System.out.println(Outer.this.x); // 10
        }
    }
}
```

#### Local Classes and Variable Scope:
A local class can only reference variables in the enclosing method scope if they are marked `final` or are **effectively final** (never reassigned after initialization).
```java
public void process() {
    int size = 10; // Effectively final
    int limit = 50;
    limit = 60;    // Not effectively final

    class Checker {
        public void check() {
            System.out.println(size);  // ✅ Compiles
            // System.out.println(limit); // ❌ DOES NOT COMPILE (Not effectively final)
        }
    }
}
```

#### Anonymous Classes:
Must either extend exactly one class or implement exactly one interface. You cannot declare constructor blocks in an anonymous class.

---

### Polymorphism & Casting
Polymorphism allows a subclass instance to be accessed via its superclass or interface reference types.
* **Implicit Cast:** Casting subclass -> superclass (always safe, no operator required).
* **Explicit Cast:** Casting superclass -> subclass (requires explicit `(Type)` cast; throws `ClassCastException` at runtime if incompatible).
* **Compiler Rules:** The compiler disallows casting between unrelated class types. For interfaces, the compiler permits casting to unrelated interfaces *unless* the class is marked `final` (which guarantees no subclass could implement that interface).

```java
interface Climb {}
class Animal {}
final class Dog extends Animal {} // final!

public class Test {
    public void test() {
        Animal a = new Animal();
        Climb c = (Climb) a; // ✅ Compiles (a could be a subclass that implements Climb)
        
        Dog d = new Dog();
        // Climb c2 = (Climb) d; // ❌ DOES NOT COMPILE (Dog is final and does not implement Climb!)
    }
}
```

---

## 🚨 Top 10 Exam Traps

### Trap 1: Interface variable reassignments
All variables in interfaces are implicitly constants (`final`).
```java
interface Limits { int MIN = 1; }
// Limits.MIN = 5; // ❌ DOES NOT COMPILE (Cannot assign a value to a final variable)
```

### Trap 2: Incorrect interface static method invocations
You cannot call a static interface method using an implementing class reference.
```java
interface Jump { static void high() {} }
class Frog implements Jump {}
// Frog.high(); // ❌ DOES NOT COMPILE (Must call Jump.high())
```

### Trap 3: Interface method access override mismatch
Because interface methods are implicitly `public`, the implementing class must explicitly declare them `public`.
```java
interface Bark { void bark(); }
class Dog implements Bark {
    // void bark() {} // ❌ DOES NOT COMPILE (reduces visibility from public to package-private)
    public void bark() {} // ✅ Correct
}
```

### Trap 4: Non-exhaustive switch with pattern matching
When pattern matching sealed classes, the compiler verifies all subclasses are handled. If one is missing and there is no default block, it fails.
```java
sealed interface Pet permits Dog, Cat {}
final class Dog implements Pet {}
final class Cat implements Pet {}

public void feed(Pet p) {
    switch (p) {
        case Dog d -> System.out.println("Bone");
        // case Cat c -> ... // ❌ DOES NOT COMPILE (Non-exhaustive switch)
    }
}
```

### Trap 5: Declaring instance fields in Records
Records cannot declare instance variables outside the record header.
```java
public record Box(int size) {
    // private int weight; // ❌ DOES NOT COMPILE
    private static int maxWeight = 100; // ✅ Static fields are allowed
}
```

### Trap 6: Calling `this(...)` loop cycles in Records
Record overloaded constructors must invoke the canonical constructor, and cannot cycle.
```java
public record Card(int rank) {
    public Card() { this(1); } // ✅ Compiles (invokes canonical constructor)
}
```

### Trap 7: Case-sensitivity of Enum `valueOf()`
Passing incorrect case or invalid string throws runtime exceptions.
```java
Season s = Season.valueOf("summer"); // ❌ Throws IllegalArgumentException (must be "SUMMER")
```

### Trap 8: Instantiating Inner Classes in Static Contexts
Inner classes require an outer class instance.
```java
class Outer {
    class Inner {}
    public static void main(String[] args) {
        // Inner i = new Inner(); // ❌ DOES NOT COMPILE
        Inner i = new Outer().new Inner(); // ✅ Correct
    }
}
```

### Trap 9: Duplicate default methods override failure
If a class implements two interfaces with the same default method signature, it must override it.
```java
interface A { default void run() {} }
interface B { default void run() {} }
// class Runner implements A, B {} // ❌ DOES NOT COMPILE
```

### Trap 10: Modifiers compatibility conflicts
Combining invalid modifier combinations (e.g., static abstract, private abstract, abstract final).
```java
// public abstract final class Shape {} // ❌ DOES NOT COMPILE
```

---

## 🔗 Spring / Enterprise Relevance
* **DTOs with Records:** Spring Boot 3.x extensively supports Java Records as request body payloads (`@RequestBody`) and query parameter projections, eliminating lombok requirements for immutable DTO structures.
* **Strategy Selection with Enums:** Enums combined with Spring context lookups are utilized to resolve runtime bean behavior dynamically based on environment configuration or database flag values.
* **Component Encapsulation:** Nested classes are often used inside `@Configuration` classes to define nested bean requirements or specific properties mappings locally, limiting configuration visibility.
