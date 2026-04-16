---
id: chapter-06
title: "Chapter 6 — Class Design"
sidebar_label: "Ch 6 · Class Design"
description: "Deep dive into Java inheritance, abstract classes, polymorphism, method overriding rules, final keyword, immutable class design, and Object methods — with focus on the subtle OCP exam traps around field hiding and initialization order."
tags:
  - inheritance
  - abstract-classes
  - polymorphism
  - overriding
  - final
  - immutable
  - object-methods
  - equals-hashcode
  - class-design
---

# Chapter 6 — Class Design

<span class="chapter-badge">Exam Domain: Using Object-Oriented Concepts in Java</span>

> **Key Topics:** Inheritance, `extends`, `super`, method overriding, `abstract` classes, polymorphism, `final`, immutable classes, `Object` methods.

---

## 🟦 New Learner: Inheritance & Polymorphism

### Inheritance Basics

```java
public class Animal {
    protected String name;
    public Animal(String name) { this.name = name; }
    public void speak() { System.out.println(name + " makes a sound"); }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name); // MUST call super constructor first
    }

    @Override
    public void speak() {
        System.out.println(name + " barks!");
    }
}
```

`super(...)` must be the **first** statement in the child constructor.  
If you don't explicitly call `super()`, Java inserts a no-arg `super()` automatically — which fails if the parent has no no-arg constructor.

---

### Method Overriding Rules

| Rule | Requirement |
|------|------------|
| Signature | Must match exactly (name + parameter types) |
| Return type | Same type or **covariant** (subtype) |
| Access | Same or **wider** access (can make `protected` → `public`, not `public` → `private`) |
| Exceptions | Cannot throw **new or broader checked** exceptions |
| Annotation | `@Override` is optional but strongly recommended (compiler catches errors) |

```java
class Parent {
    protected Number getValue() throws IOException { return 1; }
}
class Child extends Parent {
    @Override
    public Integer getValue() { return 42; } // ✅ wider access, covariant return, fewer exceptions
}
```

---

### Abstract Classes

An `abstract` class cannot be instantiated — it's a template:

```java
public abstract class Shape {
    private String color;

    public Shape(String color) { this.color = color; }
    public String getColor() { return color; }

    public abstract double area(); // no implementation
    public abstract double perimeter();

    // Concrete method available to all subclasses
    public void describe() {
        System.out.printf("A %s %s with area %.2f%n",
            color, getClass().getSimpleName(), area());
    }
}

public class Circle extends Shape {
    private double radius;
    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }
    @Override public double area() { return Math.PI * radius * radius; }
    @Override public double perimeter() { return 2 * Math.PI * radius; }
}
```

:::tip[Abstract Class Rules]
- Cannot be instantiated with `new`
- Can have constructors (called by subclasses via `super`)
- Can have abstract and concrete methods
- Subclass must implement ALL abstract methods, or also be declared `abstract`
:::

---

### Polymorphism

The declared type (reference type) and actual type (object type) can differ:

```java
Shape shape = new Circle("red", 5.0); // reference: Shape, object: Circle

shape.area();     // calls Circle.area() — runtime dispatch
shape.describe(); // calls Shape.describe()

// Cannot call Circle-specific methods via Shape reference:
// shape.radius; // ❌ compile error

// Cast to access Circle methods
if (shape instanceof Circle c) {
    System.out.println(c.radius); // ✅
}
```

---

### `final` Keyword

| Applied To | Effect |
|------------|--------|
| `final` class | Cannot be subclassed (`String`, `Integer` are final) |
| `final` method | Cannot be overridden |
| `final` variable | Cannot be reassigned (but object's state can still change) |

---

### Immutable Classes

An immutable class cannot change state after construction:

```java
public final class Money {
    private final String currency;
    private final double amount;

    public Money(String currency, double amount) {
        this.currency = currency;
        this.amount = amount;
    }

    // Only getters, no setters
    public String getCurrency() { return currency; }
    public double getAmount() { return amount; }

    // Operations return NEW instances
    public Money add(Money other) {
        return new Money(this.currency, this.amount + other.amount);
    }
}
```

**Immutability rules:**
1. Class is `final`
2. All fields are `private final`
3. No setters
4. No methods that modify state
5. Defensive copies for mutable field types (e.g., `Date`, arrays)

---

### Object Class Methods

Every Java class inherits from `Object`:

```java
// toString: called by println, string concatenation
@Override
public String toString() { return "Dog[name=" + name + "]"; }

// equals: content equality
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Dog d)) return false;
    return Objects.equals(name, d.name);
}

// hashCode: must be consistent with equals
@Override
public int hashCode() { return Objects.hash(name); }
```

:::caution[equals and hashCode Contract]
If two objects are **equal** (`a.equals(b)` is `true`), they **must** have the same `hashCode`. If you override `equals`, always override `hashCode` too!
:::

---

## 🟣 Senior Deep Dive

### Constructor Chaining and Initialization Order

When creating an object, Java initializes in this order:

1. Parent static initializers (once, when class first loaded)
2. Child static initializers (once, when class first loaded)
3. Parent instance initializers + fields
4. Parent constructor body
5. Child instance initializers + fields
6. Child constructor body

```java
class Parent {
    static { System.out.println("1. Parent static"); }
    { System.out.println("3. Parent instance init"); }
    Parent() { System.out.println("4. Parent constructor"); }
}
class Child extends Parent {
    static { System.out.println("2. Child static"); }
    { System.out.println("5. Child instance init"); }
    Child() { System.out.println("6. Child constructor"); }
}
new Child();
// Output: 1, 2, 3, 4, 5, 6
```

### Hiding Fields (Exam Trap)

Unlike methods, **fields are never overridden — they are hidden**:

```java
class Parent { String name = "Parent"; }
class Child extends Parent { String name = "Child"; } // hides, not overrides

Parent obj = new Child();
System.out.println(obj.name);        // "Parent" (field resolved at compile time!)
System.out.println(((Child)obj).name); // "Child"
```

### `super` Keyword in Methods

```java
class Animal {
    String describe() { return "Animal"; }
}
class Dog extends Animal {
    @Override
    String describe() {
        return super.describe() + " > Dog"; // explicitly call parent
    }
}
// new Dog().describe() == "Animal > Dog"
```

### Polymorphism and Reference Type Rules

```java
// Allowed assignments (widening reference conversion)
Animal a = new Dog(); // ✅
Object o = new Dog(); // ✅ Object is root

// Narrowing (requires explicit cast + runtime check)
Dog d = (Dog) a;      // ✅ (a actually IS a Dog)
Cat c = (Cat) a;      // ❌ ClassCastException at runtime!

// Use instanceof to guard
if (a instanceof Dog dog) {
    dog.fetch(); // safe
}
```

### Designing for Extensibility

```java
// Template Method Pattern using abstract classes
public abstract class DataProcessor {
    // Template method — final to prevent override
    public final void process() {
        readData();
        validateData();
        transformData();
        writeData();
    }

    protected abstract void readData();
    protected abstract void validateData();
    protected abstract void transformData();
    protected abstract void writeData();
}
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| `super()` | Must be first statement in child constructor |
| Abstract class | Cannot instantiate; subclass must implement all abstract methods |
| `final` class | Cannot extend (e.g., `String`, `Integer`) |
| `final` method | Cannot override |
| Overriding access | Must be same or wider |
| Overriding exceptions | Cannot add new/broader checked exceptions |
| Field hiding | Fields resolved at compile time (reference type); not polymorphic |
| `equals`+`hashCode` | Must override both together; contract: equal objects have same hash |
| Immutable class | `final`, all fields `private final`, no setters, defensive copies |
| Initialization order | Static blocks → parent fields/instance → parent constructor → child fields/instance → child constructor |
| `@Override` | Optional but catches typos at compile time — always use it |
| Covariant return type | Overriding method can return a subtype of the declared return type |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 6]
**Trap 1 — Abstract class CAN have constructors:**
```java
abstract class Shape {
    private String color;
    Shape(String color) { this.color = color; } // ✅ valid constructor
    abstract double area();
}
class Circle extends Shape {
    Circle(String color, double r) {
        super(color); // must call the abstract class constructor
    }
    double area() { return Math.PI * r * r; }
}
```

**Trap 2 — Calling overridden method from constructor (dangerous):**
```java
class Parent {
    Parent() { print(); } // ⚠️ calls overridden version!
    void print() { System.out.println("Parent"); }
}
class Child extends Parent {
    int value = 42;
    Child() { super(); } // implicitly
    @Override void print() { System.out.println(value); }
}
new Child(); // prints 0, not 42 — value not yet initialized when print() runs!
```

**Trap 3 — Field hiding vs method overriding:**
```java
class A { String name = "A"; String name() { return "A"; } }
class B extends A { String name = "B"; String name() { return "B"; } }

A obj = new B();
obj.name;    // "A"  — field: compile-time type wins
obj.name();  // "B"  — method: runtime type wins (polymorphism)
```

**Trap 4 — Narrowing checked exceptions in overrides:**
```java
class Parent {
    void method() throws IOException { }
}
class Child extends Parent {
    @Override
    void method() throws FileNotFoundException { } // ✅ narrower (subtype)
    // void method() throws Exception { }          // ❌ broader — compile error
    // void method() throws SQLException { }       // ❌ unrelated checked exception
}
```

**Trap 5 — `equals` contract with null and wrong type:**
```java
// Always follow this pattern:
@Override
public boolean equals(Object o) {
    if (this == o) return true;           // same object
    if (o == null) return false;          // null check
    if (!(o instanceof MyClass m)) return false; // type check + cast
    return Objects.equals(field, m.field);
}
// "this.equals(null)" must always return false — NEVER throw NPE
```

**Trap 6 — `hashCode` contract violation:**
```java
class Bad {
    int id;
    @Override public boolean equals(Object o) {
        return o instanceof Bad b && this.id == b.id;
    }
    // No hashCode override!
}
// If a.equals(b) → true, but a.hashCode() != b.hashCode() → broken HashMap behavior!
```

**Trap 7 — Immutable class with mutable fields:**
```java
public final class Period {
    private final Date start; // Date is mutable!
    public Period(Date start) {
        this.start = start; // ❌ caller can mutate via original reference
    }
    public Period(Date start) {
        this.start = new Date(start.getTime()); // ✅ defensive copy
    }
    public Date getStart() {
        return new Date(start.getTime()); // ✅ defensive copy in getter too
    }
}
```
:::

:::tip[Spring/Senior Relevance]
- The `equals`/`hashCode` contract is critical in Spring applications that use entities as `HashMap` keys or `HashSet` elements (e.g., JPA entity caching). JPA requires that entity `equals` be based on the database ID, not object identity.
- Spring's `@Transactional` propagation relies heavily on polymorphism — understanding how method overriding works explains why self-invocation doesn't trigger transaction boundaries.
- Abstract class + template method pattern is the foundation of many Spring abstractions: `AbstractMessageConverterMethodArgumentResolver`, `AbstractController`, `JdbcTemplate`, etc.
:::

---

## 🔗 Review Questions Focus

1. What is printed when a child class hides a parent field?
2. Can an abstract class have a constructor?
3. What access modifier can an overriding method NOT use?
4. What is the initialization order for parent and child classes?
5. Why must `equals()` and `hashCode()` be overridden together?
6. Can an abstract class have no abstract methods?
7. What is the danger of calling an overridable method from a constructor?
8. What are the requirements for an immutable class?
9. Can a `final` class have abstract methods?
10. What is a covariant return type and when can you use it?
