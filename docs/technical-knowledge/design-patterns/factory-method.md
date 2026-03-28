---
id: factory-method
title: "Factory Method Pattern"
slug: factory-method
description: Explains the Factory Method pattern for deferring object creation to subclasses while preserving a common creation contract.
tags: [design-patterns, java, creational, factory-method]
---

# Factory Method Pattern

> **Category:** Creational  
> **Intent:** Define an interface for creating objects, but let subclasses decide which class to instantiate.

---

## Overview

The Factory Method pattern provides an interface for creating objects in a superclass while allowing subclasses to alter the type of objects that will be created. Instead of calling `new` directly, clients use a factory method that returns an instance of a common interface.

**Key characteristics:**
- Encapsulates object creation logic in one place
- Client code works with interfaces, not concrete classes
- Adding new types doesn't require modifying existing code (Open/Closed Principle)

---

## ❓ Problem & Solution

**The Problem:** Imagine you're creating a logistics management application. Your MVP only handles transportation by land, so most of your code lives in a `Truck` class. When the app becomes popular, maritime companies ask you to incorporate sea logistics. However, your code is so heavily coupled to the `Truck` class that adding a `Ship` class would require major changes across the entire codebase.

**The Solution:** The Factory Method pattern replaces direct object construction calls (using the `new` operator) with calls to a special *factory* method. The objects returned by a factory method are often referred to as "products." Now, you can easily override the factory method in a subclass and change the class of products being created. The only caveat: subclasses must return products that share a common base class or interface (like `Transport`).

---

## 🌍 Real-World Analogy

Consider a large real-world logistics company. The core logistics flow (planning, routing, invoicing) works the same whether a package is delivered overland or overseas. However, the actual vehicle required differs. 
A `RoadLogistics` manager creates `Truck` objects for ground delivery, whereas a `SeaLogistics` manager creates `Ship` objects for maritime routes. The overarching `planDelivery()` process delegates the creation of the vehicle to these specific managers using a factory method.

---

## 🏗️ Structure

```mermaid
classDiagram
    class Product {
        <<interface>>
        +doStuff()
    }
    class ConcreteProductA {
        +doStuff()
    }
    class ConcreteProductB {
        +doStuff()
    }
    
    class Creator {
        <<abstract>>
        +someOperation()
        +createProduct()* Product
    }
    class ConcreteCreatorA {
        +createProduct() Product
    }
    class ConcreteCreatorB {
        +createProduct() Product
    }

    Product <|.. ConcreteProductA
    Product <|.. ConcreteProductB
    Creator <|-- ConcreteCreatorA
    Creator <|-- ConcreteCreatorB
    
    ConcreteCreatorA ..> ConcreteProductA
    ConcreteCreatorB ..> ConcreteProductB
```

---

## When to Use

- The exact type of object to create isn't known until runtime
- Multiple classes share a common interface but have different implementations
- Complex initialization logic needs to be encapsulated
- You want to centralize object creation to simplify maintenance
- A class wants to delegate the responsibility of instantiation to its subclasses

---

## How It Works

### Simple Factory (Static Factory Method)

The simplest form — a static method that returns different implementations based on input:

```java
public interface Notification {
    void send(String message);
}

public class EmailNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}

public class SmsNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("SMS: " + message);
    }
}

public class PushNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Push: " + message);
    }
}

public class NotificationFactory {
    public static Notification create(String type) {
        return switch (type) {
            case "EMAIL" -> new EmailNotification();
            case "SMS"   -> new SmsNotification();
            case "PUSH"  -> new PushNotification();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}

// Usage
Notification notification = NotificationFactory.create("EMAIL");
notification.send("Hello!");
```

### Classic Factory Method (Using Inheritance)

The GoF version — an abstract creator class defines the factory method, and concrete creators override it:

```java
// Product interface
public interface Transport {
    void deliver(String cargo);
}

// Concrete products
public class Truck implements Transport {
    @Override
    public void deliver(String cargo) {
        System.out.println("Delivering '" + cargo + "' by truck on road");
    }
}

public class Ship implements Transport {
    @Override
    public void deliver(String cargo) {
        System.out.println("Delivering '" + cargo + "' by ship across sea");
    }
}

// Abstract creator
public abstract class Logistics {
    // Factory method — subclasses decide which Transport to create
    public abstract Transport createTransport();

    public void planDelivery(String cargo) {
        Transport transport = createTransport();
        transport.deliver(cargo);
    }
}

// Concrete creators
public class RoadLogistics extends Logistics {
    @Override
    public Transport createTransport() {
        return new Truck();
    }
}

public class SeaLogistics extends Logistics {
    @Override
    public Transport createTransport() {
        return new Ship();
    }
}

// Usage
Logistics logistics = new RoadLogistics();
logistics.planDelivery("Electronics");  // Delivering 'Electronics' by truck on road
```

### Factory with Registry (Extensible)

A more flexible approach that allows registering new types without modifying the factory:

```java
public class NotificationRegistry {
    private static final Map<String, Supplier<Notification>> registry = new HashMap<>();

    public static void register(String type, Supplier<Notification> supplier) {
        registry.put(type, supplier);
    }

    public static Notification create(String type) {
        Supplier<Notification> supplier = registry.get(type);
        if (supplier == null) {
            throw new IllegalArgumentException("Unknown type: " + type);
        }
        return supplier.get();
    }

    // Register defaults
    static {
        register("EMAIL", EmailNotification::new);
        register("SMS", SmsNotification::new);
    }
}

// Third-party code can register new types
NotificationRegistry.register("SLACK", SlackNotification::new);
```

---

## Real-World Examples in Java

| Class/Method | Description |
|-------------|-------------|
| `Calendar.getInstance()` | Returns a calendar based on the current locale and timezone |
| `NumberFormat.getInstance()` | Returns a locale-specific number formatter |
| `java.util.Collections.unmodifiableList()` | Wraps and returns a different list implementation |
| `java.nio.charset.Charset.forName()` | Returns a charset by name |
| Spring's `BeanFactory` | Creates and manages bean instances |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Decouples client code from concrete classes | Can introduce many small classes |
| Follows Open/Closed Principle | Clients may need to subclass the creator just to create a product |
| Follows Single Responsibility Principle | The `switch`/`if-else` in simple factories can grow |
| Centralizes object creation logic | Slightly more complex than direct instantiation |
| Makes code more testable (easy to mock) | |

---

## Interview Questions

**Q1: What is the Factory pattern and why is it commonly used?**

The Factory pattern creates objects without specifying the exact class of object to be created. It allows a class to defer instantiation to subclasses or a dedicated factory, making it easier to add new types without changing existing code. It's commonly used to manage flexibility when class types and dependencies change over time, and to decouple client code from creation logic.

**Q2: Can you explain the concept of a Factory Method in Java?**

The Factory Method is a design pattern where a class defines an interface for creating objects but lets subclasses decide which class to instantiate. This is achieved by declaring an abstract method (often named `create()`, `getInstance()`, or similar) in a base class, and having subclasses provide the specific implementation. This enhances flexibility and encapsulation by isolating construction from usage.

**Q3: What are the advantages and disadvantages of using the Factory pattern?**

**Advantages:** promotes code reusability, separates object creation from implementation (SRP), allows new types without altering existing code (OCP), and makes testing easier. **Disadvantages:** can introduce complexity through multiple layers of abstraction and many small factory classes. The creation logic (switch/if-else) can grow unless combined with a registry approach.

**Q4: Can you provide an example where the Factory pattern simplifies object creation?**

A database connection factory: an application supports MySQL, PostgreSQL, and Oracle. Using a Factory, a single `ConnectionFactory.create("mysql")` call returns the correct connection implementation. The application code only deals with the `Connection` interface, not the specific JDBC driver details. Adding a new database type requires only a new implementation class and a factory registration — no changes to existing client code.

**Q5: What is the difference between a Simple Factory and a Factory Method?**

A Simple Factory is a single class with a static method that creates objects based on input parameters — it's not a formal GoF pattern but is widely used. A Factory Method is the GoF pattern where an abstract creator class declares a creation method and concrete subclasses override it to produce specific products. The Factory Method uses inheritance and polymorphism; the Simple Factory uses conditional logic.

---

## Advanced Editorial Pass: Factory Method for Controlled Instantiation

### Where It Adds Real Value
- Product variants must evolve independently behind a stable creation contract.
- Construction requires environment-specific wiring unknown to callers.
- You need test seams to substitute product implementations safely.

### Trade-offs
- Overuse introduces subtype sprawl with minimal behavioral difference.
- Creation logic can become fragmented across many classes.
- Discoverability suffers if naming conventions are weak.

### Implementation Guidance
1. Keep product contracts narrow and behavior-focused.
2. Enforce naming and packaging conventions for creators and products.
3. Measure extension frequency; collapse hierarchy if variation is not real.

### 🔄 Relations with Other Patterns
- **[Abstract Factory](./abstract-factory.md)**: Many designs start by using Factory Method (less complicated, highly customizable via subclasses) and naturally evolve toward Abstract Factory, Prototype, or Builder as flexibility needs increase.
- **[Template Method](./template-method.md)**: Factory Method can be considered a specialization of Template Method. Additionally, a Factory Method often serves as a specific step within a larger Template Method.
- **[Prototype](./prototype.md)**: Factory Method relies on inheritance to let subclasses determine the objects to create, whereas Prototype avoids deep inheritance hierarchies but requires a complex initialization/cloning process instead.
