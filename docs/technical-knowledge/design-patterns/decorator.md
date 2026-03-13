---
id: decorator
title: "Decorator Pattern"
slug: decorator
description: Explains the Decorator pattern for adding responsibilities to objects dynamically without relying on subclassing.
tags: [design-patterns, java, structural, decorator]
---

# Decorator Pattern

> **Category:** Structural  
> **Intent:** Attach additional responsibilities to an object dynamically, providing a flexible alternative to subclassing for extending functionality.

---

## Overview

The Decorator pattern wraps an object with additional behavior without modifying the original class. Decorators implement the same interface as the object they wrap, adding behavior before or after delegating to the wrapped object. Multiple decorators can be stacked.

**Key characteristics:**
- Same interface as the wrapped object (transparent to the client)
- Adds behavior dynamically at runtime, not compile-time
- Decorators can be composed/stacked in any combination
- Each decorator is responsible for one concern (Single Responsibility)

---

## When to Use

- You need to add behavior to individual objects without affecting others of the same class
- Extending functionality through subclassing would lead to a class explosion
- Responsibilities need to be added or removed at runtime
- You want to combine multiple behaviors in different combinations

---

## How It Works

### Coffee Shop Example

```java
// Component interface
public interface Coffee {
    String getDescription();
    double getCost();
}

// Base component
public class SimpleCoffee implements Coffee {
    @Override public String getDescription() { return "Simple Coffee"; }
    @Override public double getCost() { return 2.00; }
}

public class Espresso implements Coffee {
    @Override public String getDescription() { return "Espresso"; }
    @Override public double getCost() { return 3.00; }
}

// Abstract decorator — implements the same interface, wraps a component
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee decoratedCoffee;

    public CoffeeDecorator(Coffee coffee) {
        this.decoratedCoffee = coffee;
    }

    @Override
    public String getDescription() { return decoratedCoffee.getDescription(); }

    @Override
    public double getCost() { return decoratedCoffee.getCost(); }
}

// Concrete decorators
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + ", Milk";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 0.50;
    }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) { super(coffee); }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + ", Sugar";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 0.25;
    }
}

public class WhippedCreamDecorator extends CoffeeDecorator {
    public WhippedCreamDecorator(Coffee coffee) { super(coffee); }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + ", Whipped Cream";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 0.75;
    }
}

// Usage — stack decorators dynamically
Coffee coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);
coffee = new WhippedCreamDecorator(coffee);

System.out.println(coffee.getDescription());
// Simple Coffee, Milk, Sugar, Whipped Cream
System.out.println("$" + coffee.getCost());
// $3.50

// Different combination
Coffee espresso = new WhippedCreamDecorator(new MilkDecorator(new Espresso()));
System.out.println(espresso.getDescription());  // Espresso, Milk, Whipped Cream
System.out.println("$" + espresso.getCost());   // $4.25
```

### Data Stream Example (Closer to Java I/O)

```java
public interface DataStream {
    void write(String data);
    String read();
}

public class FileDataStream implements DataStream {
    private String content = "";

    @Override
    public void write(String data) {
        this.content = data;
        System.out.println("Writing to file: " + data);
    }

    @Override
    public String read() { return content; }
}

public class EncryptionDecorator implements DataStream {
    private final DataStream wrapped;

    public EncryptionDecorator(DataStream stream) { this.wrapped = stream; }

    @Override
    public void write(String data) {
        String encrypted = encrypt(data);
        System.out.println("Encrypting data...");
        wrapped.write(encrypted);
    }

    @Override
    public String read() {
        return decrypt(wrapped.read());
    }

    private String encrypt(String data) {
        return Base64.getEncoder().encodeToString(data.getBytes());
    }

    private String decrypt(String data) {
        return new String(Base64.getDecoder().decode(data));
    }
}

public class CompressionDecorator implements DataStream {
    private final DataStream wrapped;

    public CompressionDecorator(DataStream stream) { this.wrapped = stream; }

    @Override
    public void write(String data) {
        System.out.println("Compressing data...");
        wrapped.write("[compressed]" + data);  // simplified
    }

    @Override
    public String read() {
        String data = wrapped.read();
        return data.replace("[compressed]", "");
    }
}

// Usage — combine behaviors
DataStream stream = new CompressionDecorator(
    new EncryptionDecorator(
        new FileDataStream()
    )
);
stream.write("Sensitive data");
// Compressing data...
// Encrypting data...
// Writing to file: [compressed]U2Vuc2l0aXZlIGRhdGA=
```

---

## Java I/O — The Classic Decorator Example

Java's I/O library is built on the Decorator pattern:

```java
// Base stream
InputStream fileStream = new FileInputStream("data.txt");

// Add buffering (decorator)
InputStream buffered = new BufferedInputStream(fileStream);

// Add decompression (decorator)
InputStream decompressed = new GZIPInputStream(buffered);

// Or chain them
InputStream stream = new GZIPInputStream(
    new BufferedInputStream(
        new FileInputStream("archive.gz")
    )
);
```

Each wrapper adds functionality while preserving the `InputStream` interface.

---

## Decorator vs Inheritance vs Proxy

| Aspect | Decorator | Inheritance | Proxy |
|--------|-----------|-------------|-------|
| **When** | Runtime | Compile-time | Runtime |
| **Purpose** | Add behavior | Extend class | Control access |
| **Interface** | Same as wrapped | New subclass | Same as wrapped |
| **Scope** | Individual objects | Entire class | Individual objects |
| **Flexibility** | Combine freely | Fixed hierarchy | Single wrapper |
| **Stacking** | ✅ Multiple decorators | ❌ One parent chain | Usually ❌ |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Add/remove behavior at runtime | Stacked decorators can be hard to debug |
| Combine behaviors in any order | Many small decorator classes |
| Follows Open/Closed Principle | Order of wrapping can matter |
| Follows Single Responsibility | Object identity changes with each wrap |
| Avoids deep inheritance hierarchies | |

---

## Interview Questions

**Q1: What is the Decorator pattern and how does it differ from inheritance?**

The Decorator pattern adds functionality to objects dynamically by wrapping them with new behavior. It differs from inheritance because it extends behavior at runtime (not compile-time), doesn't require modifying the original class, and enhances specific objects individually rather than an entire class. You can stack multiple decorators for different combinations; inheritance provides only a fixed hierarchy.

**Q2: How would you implement the Decorator pattern in Java?**

Create a common interface (e.g., `Coffee`). Create concrete classes implementing it (e.g., `SimpleCoffee`). Create an abstract decorator class that implements the same interface and holds a reference to a component. Concrete decorators extend the abstract decorator, calling the wrapped object's method and adding behavior before or after. This allows dynamic, stackable enhancement.

**Q3: What are the advantages of using the Decorator pattern for extending behavior?**

Dynamic runtime enhancement without altering original classes. Flexible combinations by stacking decorators in any order. Avoids the complexity of deep inheritance hierarchies. Each decorator is responsible for one concern (SRP). New behaviors can be added without modifying existing code (OCP).

**Q4: Can you provide a real-world example of the Decorator pattern?**

Java I/O streams: `new BufferedReader(new InputStreamReader(new FileInputStream("file.txt")))`. Each wrapper adds a layer — `FileInputStream` reads bytes, `InputStreamReader` converts to characters, `BufferedReader` adds buffering. Each preserves the `Reader` interface while adding behavior. The coffee ordering system (base coffee + optional add-ons) is another common example.

**Q5: How does the Decorator pattern promote flexibility in extending object behavior?**

It allows behavior to be added or removed at runtime without modifying the original object or creating subclasses. By layering decorators, you create a wide range of behavior combinations from a small set of classes. This avoids the rigidity of inheritance hierarchies and enables per-object customization.
