---
id: prototype
title: "Prototype Pattern"
slug: prototype
description: Explains the Prototype pattern for creating new objects by cloning existing instances instead of rebuilding them from scratch.
tags: [design-patterns, java, creational, prototype]
---

# Prototype Pattern

> **Category:** Creational    
> **Complexity:** ⭐☆☆ (1/3)  
> **Popularity:** ⭐⭐☆ (2/3)  
> **Intent:** Create new objects by cloning an existing instance (prototype) rather than constructing from scratch.

---

## Overview

The Prototype pattern copies existing objects without making the code dependent on their classes. Instead of calling `new` and re-running expensive initialization, you duplicate an already-configured object and tweak it as needed.

**Key characteristics:**
- Objects are created by cloning a prototype instance
- Avoids the cost of re-creating objects with expensive initialization
- New types can be introduced at runtime by cloning different prototypes

---

## 👶 Explain Like I'm 5

Imagine you draw a beautiful picture of a house. Now your friend wants the same picture but with a blue door instead of red. Instead of drawing the entire house again from scratch, you just **photocopy** your picture and color the door blue. Much faster!

The Prototype pattern is that photocopier. Instead of building a new object from nothing (which might take a lot of time — reading files, querying databases), you **copy** an existing object and change just what you need.

---

## ❓ Problem & Solution

**The Problem:** Imagine you have an object, and you want to create an exact copy of it. How would you do it? Normally, you create a new object of the same class, then go through all the fields of the original object and copy their values over. 
However, not all objects can be copied that way since some fields may be private and not visible from outside the object. Furthermore, doing this makes your code highly dependent on the concrete classes of the objects you copy. Sometimes you only know the interface the object follows, but not its concrete class (e.g., when the object is passed to a method as a parameter).

**The Solution:** The Prototype pattern delegates the cloning process to the actual objects that are being cloned. The pattern declares a common interface for all objects that support cloning, usually containing just a single `clone()` method. This lets you clone an object without coupling your code to the specific class of that object.

---

## 🌍 Real-World Analogy

A great analogy is mitotic cell division in biology. After a cell splits, two completely identical cells form. The original cell acts as a prototype and takes an active role in creating the exact copy.
Another everyday analogy is formatting a document. Instead of creating a new document from scratch and manually setting up the margins, fonts, and headers, you simply duplicate an existing, well-formatted document (the prototype) and just change the text contents.

---

import PrototypeDiagram from '@site/src/components/PrototypeDiagram';

## 🏗️ Structure

<PrototypeDiagram />


---

## When to Use

**✅ Use this when:**
- Object creation is **expensive** (heavy initialization, DB calls, file I/O, network requests) and you can avoid the cost by cloning.
- You need **many similar objects** with slight variations (e.g., game entities, test fixtures, document templates).
- The exact type of object **isn't known at compile time** — you only have a reference to an interface.
- You want to **avoid building complex factory hierarchies** just to create different object configurations.
- Configuring a prototype once and cloning it is **simpler than re-specifying** all parameters each time.

**❌ Don't use this when:**
- Object creation is **cheap** — `new MyObject()` with simple field assignments doesn't justify the cloning complexity.
- Objects contain **circular references** or complex resource handles (DB connections, file locks) that can't be trivially cloned.
- The object is **immutable** — there's no need to clone immutable objects; just share the reference.
- You're in a **Spring DI environment** and can use Spring's `@Scope("prototype")` to create new instances automatically.

**🔍 Quick Decision Checklist:**
1. Is creating the object **slow** (>1ms, DB call, parsing)? → Yes = Prototype saves time.
2. Do you need **many copies** with small differences? → Yes = Clone + tweak.
3. Does the object have **mutable nested objects**? → Be careful — you need deep clone.
4. Can you just use `new`? → Yes = Don't over-engineer with Prototype.

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

## 🔄 Before & After: Why Prototype Matters

### ❌ Without Prototype — Expensive re-creation every time

```java
// Each test creates a User from scratch — slow and repetitive
@Test
void testVipDiscount() {
    User user = new User();
    user.setName("Alice");
    user.setEmail("alice@test.com");
    user.setAddress(loadDefaultAddress());     // DB call!
    user.setPreferences(loadDefaultPrefs());   // another DB call!
    user.setStatus(UserStatus.VIP);            // the only thing that varies
    // ...
}

@Test
void testRegularDiscount() {
    User user = new User();
    user.setName("Alice");                     // same setup repeated
    user.setEmail("alice@test.com");
    user.setAddress(loadDefaultAddress());     // same DB call again
    user.setPreferences(loadDefaultPrefs());   // and again
    user.setStatus(UserStatus.REGULAR);
}
```

### ✅ With Prototype — Clone once, tweak what varies

```java
// Create the prototype once (expensive setup done ONCE)
private static final User PROTOTYPE = createBaseUser();

@Test
void testVipDiscount() {
    User user = PROTOTYPE.clone();
    user.setStatus(UserStatus.VIP);  // only change what matters
}

@Test
void testRegularDiscount() {
    User user = PROTOTYPE.clone();
    user.setStatus(UserStatus.REGULAR);
}
// 10x faster test setup, zero repeated DB calls.
```

---

## 💼 Prototype in Spring & Enterprise Java

### Spring's `@Scope("prototype")` — Framework-Managed Prototype

Spring has a built-in prototype scope that creates a **new instance** for each injection/request:

```java
@Component
@Scope("prototype")
public class ShoppingCart {
    private final List<CartItem> items = new ArrayList<>();
    public void addItem(CartItem item) { items.add(item); }
}

// Each user gets a FRESH cart — Spring creates a new instance each time:
@Service
public class CheckoutService {
    @Autowired
    private Provider<ShoppingCart> cartProvider; // javax.inject.Provider

    public ShoppingCart getNewCart() {
        return cartProvider.get(); // new instance every call
    }
}
```

### Prototype Registry for Configuration Templates

```java
@Component
public class ReportTemplateRegistry {
    private final Map<String, ReportConfig> templates = new HashMap<>();

    @PostConstruct
    public void init() {
        // Pre-configure expensive templates once
        templates.put("monthly-sales", buildMonthlySalesTemplate());
        templates.put("user-activity", buildUserActivityTemplate());
    }

    public ReportConfig getTemplate(String type) {
        return templates.get(type).clone(); // clone, don't share!
    }
}
```

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

---

## Advanced Editorial Pass: Prototype for Expensive Object Genesis

### When Prototype Is Effective
- Object creation cost is dominated by initialization, hydration, or graph assembly.
- You need many similar instances with small controlled differences.
- Runtime composition of baseline configurations is preferable to large factory trees.

### Hidden Complexity
- Deep copy correctness is hard when graphs contain shared references.
- Clone semantics become ambiguous with lazy fields and external resources.
- Mutation after cloning can break assumptions about shared vs isolated state.

### Senior-Level Guidance
1. Make clone depth explicit in API and documentation.
2. Prefer copy constructors/factory copy methods when clone() semantics are unclear.
3. Add regression tests for aliasing bugs in nested object graphs.

### 🔄 Relations with Other Patterns
- **[Factory Method](./factory-method.md)**: Many designs start by using Factory Method (simpler) and naturally evolve toward Prototype or Abstract Factory as complexity increases. Prototype does not require deep inheritance hierarchies but necessitates a complex initialization (cloning) process.
- **[Abstract Factory](./abstract-factory.md) and [Builder](./builder.md)**: Abstract Factory classes are often based on a set of Factory Methods, but you can also use Prototype to compose the methods on these classes.
- **[Command](./command.md)**: Prototypes can be very useful when you need to save exact copies of Commands into a history stack.
- **[Composite](./composite.md) and [Decorator](./decorator.md)**: Designs that make heavy use of Composite and Decorator often benefit from Prototype. You can clone complex structural graphs instead of reconstructing them from scratch.

### ⚖️ Prototype vs. Similar Approaches

| Aspect | Prototype (clone) | Copy Constructor | Factory Method | `Object.clone()` | Serialization clone |
|--------|-------------------|------------------|---------------|------------------|--------------------|
| **Mechanism** | Custom `clone()` | `new Foo(original)` | Method returns new instance | JVM shallow copy | Serialize + deserialize |
| **Deep copy** | You implement it | You implement it | N/A | ❌ Shallow only | ✅ Automatic deep copy |
| **Type safety** | ✅ Covariant return | ✅ Compile-time | ✅ Interface-based | ❌ Returns `Object` | ✅ Generic |
| **Performance** | Fast | Fast | Depends on creation | Fastest (native) | Slow (I/O overhead) |
| **When to pick** | Polymorphic cloning needed | Known concrete types | Type selection needed | Legacy code only | Complex object graphs |
