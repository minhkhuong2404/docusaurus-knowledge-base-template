---
id: prototype
title: "Prototype Pattern"
slug: prototype
description: Explains the Prototype pattern for creating new objects by cloning existing instances instead of rebuilding them from scratch.
tags: [design-patterns, java, creational, prototype]
---

# Prototype Pattern

> **Category:** Creational  
> **Intent:** Create new objects by cloning an existing instance (prototype) rather than constructing from scratch.

---

## Overview

The Prototype pattern copies existing objects without making the code dependent on their classes. Instead of calling `new` and re-running expensive initialization, you duplicate an already-configured object and tweak it as needed.

**Key characteristics:**
- Objects are created by cloning a prototype instance
- Avoids the cost of re-creating objects with expensive initialization
- New types can be introduced at runtime by cloning different prototypes

---

## When to Use

- Object creation is expensive (heavy initialization, DB calls, file I/O, network requests)
- You need many similar objects with slight variations
- The exact type of object isn't known at compile time
- You want to avoid building complex class hierarchies of factories
- Configuring a prototype once and cloning it is simpler than re-specifying parameters

---

## How It Works

### Shallow Clone vs Deep Clone

Understanding the difference is critical:

```
Original object:    [ name: "A",  list: → [1, 2, 3] ]
                                        ↑
Shallow clone:      [ name: "A",  list: ─┘           ]  ← shares the same list!

Deep clone:         [ name: "A",  list: → [1, 2, 3] ]  ← independent copy
```

| Type | Behavior | Risk |
|------|----------|------|
| **Shallow** | Copies field values directly; reference fields point to the same objects | Modifications to referenced objects affect both original and clone |
| **Deep** | Recursively copies all referenced objects | Safer but more expensive and complex to implement |

### Implementation Using Copy Constructor (Recommended)

```java
public abstract class Shape {
    private String color;
    private int x, y;

    public Shape() {}

    // Copy constructor
    protected Shape(Shape source) {
        this.color = source.color;
        this.x = source.x;
        this.y = source.y;
    }

    public abstract Shape clone();

    public void setColor(String color) { this.color = color; }
    public void moveTo(int x, int y) { this.x = x; this.y = y; }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{color='" + color + "', x=" + x + ", y=" + y + "}";
    }
}

public class Circle extends Shape {
    private int radius;

    public Circle(int radius) { this.radius = radius; }

    // Copy constructor — deep copies all fields
    private Circle(Circle source) {
        super(source);
        this.radius = source.radius;
    }

    @Override
    public Circle clone() {
        return new Circle(this);
    }

    @Override
    public String toString() {
        return "Circle{radius=" + radius + ", " + super.toString() + "}";
    }
}

public class Rectangle extends Shape {
    private int width, height;

    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }

    private Rectangle(Rectangle source) {
        super(source);
        this.width = source.width;
        this.height = source.height;
    }

    @Override
    public Rectangle clone() {
        return new Rectangle(this);
    }
}

// Usage
Circle original = new Circle(10);
original.setColor("Red");
original.moveTo(5, 5);

Circle copy = original.clone();  // independent deep copy
copy.setColor("Blue");           // doesn't affect original
copy.moveTo(20, 20);

System.out.println(original);  // Circle{radius=10, color='Red', x=5, y=5}
System.out.println(copy);      // Circle{radius=10, color='Blue', x=20, y=20}
```

### Deep Clone with Mutable References

When objects contain mutable reference fields, you must deep-copy them:

```java
public class Document implements Cloneable {
    private String title;
    private List<String> pages;
    private Map<String, String> metadata;

    public Document(String title, List<String> pages, Map<String, String> metadata) {
        this.title = title;
        this.pages = pages;
        this.metadata = metadata;
    }

    // Deep copy constructor
    public Document(Document source) {
        this.title = source.title;                              // String is immutable — safe
        this.pages = new ArrayList<>(source.pages);             // new list with same elements
        this.metadata = new HashMap<>(source.metadata);         // new map with same entries
    }

    @Override
    public Document clone() {
        return new Document(this);
    }
}

// Usage
Document original = new Document("Design Patterns",
    new ArrayList<>(List.of("Intro", "Creational")),
    new HashMap<>(Map.of("author", "GoF")));

Document copy = original.clone();
copy.getPages().add("Structural");     // doesn't affect original
copy.getMetadata().put("year", "1994");
```

### Prototype Registry

A registry (or cache) of pre-configured prototypes that can be cloned on demand:

```java
public class ShapeRegistry {
    private final Map<String, Shape> prototypes = new HashMap<>();

    public void register(String key, Shape prototype) {
        prototypes.put(key, prototype);
    }

    public Shape get(String key) {
        Shape prototype = prototypes.get(key);
        if (prototype == null) {
            throw new IllegalArgumentException("No prototype registered for: " + key);
        }
        return prototype.clone();
    }
}

// Setup
ShapeRegistry registry = new ShapeRegistry();

Circle defaultCircle = new Circle(50);
defaultCircle.setColor("White");
registry.register("default-circle", defaultCircle);

Rectangle header = new Rectangle(800, 60);
header.setColor("DarkBlue");
registry.register("header-bar", header);

// Usage — clone from registry
Shape circle1 = registry.get("default-circle");
Shape circle2 = registry.get("default-circle");
// circle1 and circle2 are independent copies
```

---

## Prototype vs Other Creational Patterns

| Aspect | Prototype | Factory | Builder |
|--------|-----------|---------|---------|
| **Creates via** | Cloning an existing object | Method call with type selection | Step-by-step construction |
| **Best for** | Expensive initialization, many similar objects | Different types behind a common interface | Complex objects with many parameters |
| **Runtime flexibility** | High — clone any prototype | Medium — factory must know types | Low — builds one specific type |

---

## Real-World Examples in Java

| Class/Method | Description |
|-------------|-------------|
| `Object.clone()` | Built-in shallow clone support |
| `java.util.ArrayList(Collection)` | Copy constructor |
| `java.util.Collections.unmodifiableList()` | Creates a wrapper, preserving original |
| Spring bean scopes (`prototype`) | Creates a new instance for each request |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Avoids expensive object creation | Deep cloning can be complex to implement correctly |
| Adds new types at runtime by cloning prototypes | Circular references make deep cloning tricky |
| Reduces the need for factory subclasses | Must maintain clone methods as class evolves |
| Independent of concrete classes | Shallow clone pitfalls if not handled carefully |

---

## Interview Questions

**Q1: What is the Prototype pattern and how does it work?**

The Prototype pattern creates new objects by copying existing ones rather than constructing from scratch. It provides a `clone()` method that produces a copy of the current object. This is efficient when object creation involves expensive operations like database queries, file reads, or complex initialization. Clients clone a configured prototype and modify the copy as needed.

**Q2: What is the difference between shallow cloning and deep cloning?**

Shallow cloning copies field values directly — if fields are references to mutable objects, both original and clone share those references, so changes to one affect the other. Deep cloning recursively copies all referenced objects, creating a fully independent copy. Deep cloning is safer but more complex and expensive to implement correctly.

**Q3: What are the common pitfalls of using the Prototype pattern?**

The main pitfall is mismanaging shallow vs deep cloning. Shallow cloning can cause subtle bugs when cloned objects unknowingly share mutable state. Deep cloning can be difficult to implement correctly, especially with complex object graphs or circular references, and may cause performance issues if the object tree is large. The clone method must also be maintained as the class structure evolves.

**Q4: How does Java's `Object.clone()` work and why is it considered problematic?**

`Object.clone()` performs a field-by-field shallow copy and requires the class to implement `Cloneable` (a marker interface). It's considered problematic because: (1) it returns `Object`, requiring a cast; (2) it performs only a shallow copy; (3) `Cloneable` has no `clone()` method itself — the method is on `Object` and protected; (4) it bypasses constructors, which can leave objects in an invalid state. Copy constructors are generally preferred.

**Q5: When would you choose Prototype over Factory?**

Choose Prototype when object initialization is expensive and you already have a configured instance to copy from. Choose Factory when you need to create objects of different types based on runtime conditions. Prototype is also useful when you want to defer the decision of what to clone until runtime, and when a prototype registry can serve as a flexible alternative to a complex factory hierarchy.
