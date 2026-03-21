---
sidebar_position: 7
title: "Chapter 6: Objects and Data Structures"
description: The fundamental tension between objects and data structures, and when to use each.
---

# Chapter 6: Objects and Data Structures

## The Core Tension

This chapter explores a deep and often misunderstood distinction in OOP:

- **Objects** hide their data behind abstractions and expose behavior through methods.
- **Data structures** expose their data directly and have no meaningful behavior.

These two approaches are **fundamentally different** and lead to different design trade-offs. Neither is universally better — the skill is knowing which to use when.

---

## Data Abstraction

Consider two representations of a 2D point:

```java
// Concrete Point — exposes implementation details
public class Point {
    public double x;
    public double y;
}

// Abstract Point — hides implementation details behind an interface
public interface Point {
    double getX();
    double getY();
    void setCartesian(double x, double y); // atomic setter
    double getR();
    double getTheta();
    void setPolar(double r, double theta); // atomic setter
}
```

The abstract version doesn't just add getters and setters — it forces the *user* to use coordinates in a meaningful way. You can't access `x` without `y`, because they're part of a coordinate pair. The implementation could be Cartesian or polar internally — you don't know and you don't need to.

:::warning
Adding getters and setters to every field is **not abstraction**. It's just exposing the implementation with extra steps.
:::

The real point of abstraction is to **represent the essence of the data** rather than exposing the internal implementation.

```java
// Bad abstraction — just thin wrappers around fields
public interface Vehicle {
    double getFuelTankCapacityInGallons();
    double getGallonsOfGasoline();
}

// Good abstraction — expresses a meaningful concept
public interface Vehicle {
    double getPercentFuelRemaining();
}
```

---

## Data/Object Anti-Symmetry

Here is one of the most important insights in the chapter:

> **Objects and data structures are nearly opposite in nature. What is easy for objects is hard for data structures, and vice versa.**

### Procedural Code with Data Structures

```java
// Data structures — just data, no behavior
public class Square { public Point topLeft; public double side; }
public class Rectangle { public Point topLeft; public double height, width; }
public class Circle { public Point center; public double radius; }

// All behavior lives in a separate Geometry class
public class Geometry {
    public final double PI = Math.PI;

    public double area(Object shape) throws NoSuchShapeException {
        if (shape instanceof Square s)     return s.side * s.side;
        if (shape instanceof Rectangle r)  return r.height * r.width;
        if (shape instanceof Circle c)     return PI * c.radius * c.radius;
        throw new NoSuchShapeException();
    }
}
```

**Trade-off:** Adding a new function (`perimeter()`) is easy — just add it to `Geometry`. But adding a new shape requires updating *every* function in `Geometry`.

### Object-Oriented Code with Polymorphism

```java
// Each shape knows how to compute its own area
public class Square implements Shape {
    private Point topLeft;
    private double side;
    public double area() { return side * side; }
}

public class Rectangle implements Shape {
    private Point topLeft;
    private double height, width;
    public double area() { return height * width; }
}

public class Circle implements Shape {
    private Point center;
    private double radius;
    public double area() { return Math.PI * radius * radius; }
}
```

**Trade-off:** Adding a new shape (`Triangle`) is easy — just add the class. But adding a new function (`perimeter()`) requires changing *all* existing shape classes.

### The Principle

| Goal | Use |
|------|-----|
| Easy to add new functions, fixed set of types | Procedural / data structures |
| Easy to add new types, fixed set of functions | Object-oriented / polymorphism |

Pick the right tool for the job.

---

## The Law of Demeter

> *"A module should not know about the innards of the objects it manipulates."*

More formally: a method `f` of class `C` should only call methods of:

- `C` itself
- An object created by `f`
- An object passed as an argument to `f`
- An object held in an instance variable of `C`

```java
// Violation — "train wreck"
String outputDir = ctxt.getOptions().getScratchDir().getAbsolutePath();

// Better — each object only talks to its direct neighbors
Options opts = ctxt.getOptions();
File scratchDir = opts.getScratchDir();
String outputDir = scratchDir.getAbsolutePath();
```

But even this is questionable. Are `ctxt`, `Options`, and `File` objects or data structures? If they're data structures (plain data containers with no meaningful behavior), the Law of Demeter doesn't apply — you're just reaching into data.

The real fix is to ask: **why do you need the path?** If the answer is to create a file, let `ctxt` do it:

```java
// Best — ctxt encapsulates the behavior, we don't care about internal paths
BufferedOutputStream bos = ctxt.createScratchFileStream(classFileName);
```

---

## Train Wrecks

Chains of method calls like this are called "train wrecks":

```java
final String outputDir = ctxt.getOptions().getScratchDir().getAbsolutePath();
```

These are hard to read, fragile (one null breaks everything), and violate the Law of Demeter when objects (not data structures) are involved. Split them apart or redesign so the behavior lives in the right object.

---

## Hybrids: The Worst of Both Worlds

Avoid creating **hybrid structures** — half object, half data structure. They expose their fields (data structure style) while also having business logic (object style). This gives you the worst of both:

- Hard to add new functions (because they're awkward hybrids)
- Hard to add new types (because they have procedures mixed in)

Hybrids often arise from uncertainty about whether something should be an object or a data structure. Decide and commit.

---

## Data Transfer Objects (DTOs)

A pure data structure with no behavior — just public fields — is called a **Data Transfer Object (DTO)**:

```java
public class Address {
    public String street;
    public String city;
    public String state;
    public String zip;
}
```

DTOs are useful for communicating with databases, parsing network messages, or passing data between layers. They are not objects in the OOP sense — don't put business logic in them.

The "Active Record" pattern (a DTO with `save()` and `find()` methods) is common in frameworks, but beware of putting business rules in them — that creates a hybrid.

---

## Key Takeaways

- Real abstraction hides implementation — **getters/setters are not abstraction**
- Objects hide data, expose behavior; data structures expose data, have no behavior
- Adding new functions: easier with data structures (procedural code)
- Adding new types: easier with objects (OOP polymorphism)
- Avoid **train wrecks** — don't chain method calls across objects
- **Law of Demeter**: talk only to your immediate friends
- **Hybrids** (half object, half data structure) are the worst of both worlds — avoid them
- DTOs are pure data containers — don't put business logic in them
