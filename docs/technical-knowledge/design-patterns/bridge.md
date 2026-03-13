---
id: bridge
title: "Bridge Pattern"
slug: bridge
description: Explains the Bridge pattern for separating abstractions from implementations so both can evolve independently.
tags: [design-patterns, java, structural, bridge]
---

# Bridge Pattern

> **Category:** Structural  
> **Intent:** Decouple an abstraction from its implementation so that the two can vary independently.

---

## Overview

The Bridge pattern splits a large class or a set of closely related classes into two separate hierarchies — abstraction and implementation — which can be developed independently. It uses composition instead of inheritance to connect the two hierarchies.

**Key characteristics:**
- Two independent hierarchies connected via composition
- Abstraction contains a reference to an implementation object (the "bridge")
- Both sides can be extended without affecting the other

---

## When to Use

- Both abstraction and implementation need to be extended independently
- You want to avoid a combinatorial explosion of classes (e.g., N abstractions × M implementations = N×M classes)
- Switching implementations at runtime is needed
- The implementation details should be hidden from the client
- You're designing a system where two orthogonal dimensions of variation exist

---

## The Problem: Class Explosion

Without Bridge, combining two dimensions leads to exponential class growth:

```
Shape × Color without Bridge:
├── RedCircle
├── BlueCircle
├── GreenCircle
├── RedSquare
├── BlueSquare
├── GreenSquare
├── RedTriangle
├── BlueTriangle
└── GreenTriangle    → 9 classes for 3 shapes × 3 colors
```

Adding a new color requires 3 new classes. Adding a new shape requires 3 more. This scales poorly.

## How It Works

### Bridge Solution

```java
// ── Implementation hierarchy ──
public interface Color {
    String fill();
    String getHex();
}

public class Red implements Color {
    @Override public String fill() { return "Red"; }
    @Override public String getHex() { return "#FF0000"; }
}

public class Blue implements Color {
    @Override public String fill() { return "Blue"; }
    @Override public String getHex() { return "#0000FF"; }
}

public class Green implements Color {
    @Override public String fill() { return "Green"; }
    @Override public String getHex() { return "#00FF00"; }
}

// ── Abstraction hierarchy ──
public abstract class Shape {
    protected final Color color;  // ← the bridge

    public Shape(Color color) {
        this.color = color;
    }

    public abstract String draw();
    public abstract double area();
}

public class Circle extends Shape {
    private final double radius;

    public Circle(Color color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    public String draw() {
        return "Drawing Circle (r=" + radius + ") in " + color.fill();
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Square extends Shape {
    private final double side;

    public Square(Color color, double side) {
        super(color);
        this.side = side;
    }

    @Override
    public String draw() {
        return "Drawing Square (s=" + side + ") in " + color.fill();
    }

    @Override
    public double area() {
        return side * side;
    }
}

// Usage — combine any shape with any color
Shape redCircle = new Circle(new Red(), 5.0);
Shape blueSquare = new Square(new Blue(), 4.0);
Shape greenCircle = new Circle(new Green(), 3.0);

System.out.println(redCircle.draw());    // Drawing Circle (r=5.0) in Red
System.out.println(blueSquare.draw());   // Drawing Square (s=4.0) in Blue
```

**Result:** 3 shapes + 3 colors = 6 classes (instead of 9). Adding a new color = 1 class. Adding a new shape = 1 class.

### More Realistic Example: Notification System

```java
// Implementation — how to send
public interface MessageSender {
    void send(String recipient, String message);
}

public class EmailSender implements MessageSender {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Email to " + recipient + ": " + message);
    }
}

public class SmsSender implements MessageSender {
    @Override
    public void send(String recipient, String message) {
        System.out.println("SMS to " + recipient + ": " + message);
    }
}

public class SlackSender implements MessageSender {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Slack to #" + recipient + ": " + message);
    }
}

// Abstraction — what to send
public abstract class Notification {
    protected final MessageSender sender;

    public Notification(MessageSender sender) {
        this.sender = sender;
    }

    public abstract void notify(String recipient, String event);
}

public class UrgentNotification extends Notification {
    public UrgentNotification(MessageSender sender) { super(sender); }

    @Override
    public void notify(String recipient, String event) {
        sender.send(recipient, "🚨 URGENT: " + event);
    }
}

public class InfoNotification extends Notification {
    public InfoNotification(MessageSender sender) { super(sender); }

    @Override
    public void notify(String recipient, String event) {
        sender.send(recipient, "ℹ️ Info: " + event);
    }
}

// Usage — combine any notification type with any sender
Notification urgentEmail = new UrgentNotification(new EmailSender());
Notification infoSlack = new InfoNotification(new SlackSender());

urgentEmail.notify("admin@company.com", "Server is down");
infoSlack.notify("engineering", "Deployment completed");
```

---

## Bridge vs Adapter

| Aspect | Bridge | Adapter |
|--------|--------|---------|
| **Purpose** | Design flexibility upfront | Integration fix after the fact |
| **When applied** | During system design | When connecting existing incompatible code |
| **Relationship** | Abstraction ↔ Implementation (both evolve) | Target ↔ Adaptee (converting interfaces) |
| **Intent** | Prevent class explosion | Make things work together |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Prevents combinatorial class explosion | Adds complexity via indirection |
| Abstraction and implementation evolve independently | Can be overkill for simple systems |
| Runtime switching of implementations | Requires identifying two orthogonal dimensions |
| Follows Open/Closed and Single Responsibility | |
| Hides implementation details from client | |

---

## Interview Questions

**Q1: What is the Bridge pattern and how does it decouple abstraction from implementation?**

The Bridge pattern separates a class into two hierarchies — abstraction and implementation — connected through composition (the "bridge"). This allows both to evolve independently. The abstraction holds a reference to an implementation interface and delegates work to it. This decoupling prevents class explosion and enables changing implementations without touching the abstraction.

**Q2: Can you explain the difference between the Bridge pattern and the Adapter pattern?**

Bridge is a design-time pattern — you plan it upfront to avoid class explosion by separating two dimensions of variation. Adapter is an integration-time fix — you apply it when connecting existing incompatible interfaces. Bridge allows both sides to vary independently; Adapter translates one interface to another.

**Q3: In what scenarios would you use the Bridge pattern?**

When a system has two orthogonal dimensions that can vary independently — for example, shapes and colors, notification types and delivery channels, or UI components and rendering engines. Also when you need runtime switching of implementations, or when combining N abstractions × M implementations would create N×M classes using inheritance alone.

**Q4: What are the key benefits of using the Bridge pattern in large systems?**

It prevents class explosion by composing instead of inheriting. Both abstraction and implementation can be developed, tested, and deployed independently. It simplifies maintenance because changes to the implementation don't ripple through the abstraction hierarchy. And it enables runtime flexibility — swap implementations without recompiling.

**Q5: How would you implement the Bridge pattern in Java?**

Create an interface for the implementation dimension with its concrete classes. Create an abstract class for the abstraction dimension that holds a reference to the implementation interface. Extend the abstraction with refined abstractions. The abstract class delegates work to the implementation through the bridge reference. Both hierarchies can grow independently.

---

## Advanced Editorial Pass: Bridge for Orthogonal Variability

### Where Bridge Pays Off
- Two independent change axes evolve at different rates (for example, abstraction behavior and platform implementation).
- You need combinatorial flexibility without exploding class hierarchies.
- Runtime composition of implementation families is a requirement, not an academic preference.

### Warning Signs
- Only one axis actually varies in practice.
- The abstraction layer adds no policy and simply forwards calls.
- Teams cannot explain why Bridge is better than Strategy plus interfaces in this context.

### Engineering Checklist
1. Define explicit ownership boundaries: who owns abstraction policy and who owns implementation details?
2. Ensure both hierarchies can be tested independently with stable contracts.
3. Document expected extension strategy for each axis to prevent accidental inheritance coupling.

### Compare Next
- [Strategy Pattern](./strategy.md)
- [Adapter Pattern](./adapter.md)
- [Template Method Pattern](./template-method.md)
