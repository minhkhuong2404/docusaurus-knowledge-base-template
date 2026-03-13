---
id: abstract-factory
title: "Abstract Factory Pattern"
slug: abstract-factory
description: Explains the Abstract Factory pattern for creating related object families without coupling code to concrete classes.
tags: [design-patterns, java, creational, abstract-factory]
---

# Abstract Factory Pattern

> **Category:** Creational  
> **Intent:** Provide an interface for creating **families of related objects** without specifying their concrete classes.

---

## Overview

The Abstract Factory pattern is a "factory of factories." It provides an interface for creating entire families of related or dependent objects. The client works with factories and products through abstract interfaces, making it easy to swap entire families of objects without changing client code.

**Key characteristics:**
- Creates families of related objects that are designed to work together
- Enforces consistency — you can't accidentally mix products from different families
- Client code depends only on abstract interfaces, never on concrete classes

---

## When to Use

- Your system needs to work with multiple families of related products
- You want to ensure that products from the same family are used together
- Switching between product families at runtime is required
- You need to enforce constraints between related objects
- Building cross-platform UIs, multi-database support, or theme systems

---

## How It Works

### Structure

```
AbstractFactory (interface)
├── ConcreteFactory1 → creates ProductA1, ProductB1
└── ConcreteFactory2 → creates ProductA2, ProductB2

AbstractProductA (interface)
├── ConcreteProductA1
└── ConcreteProductA2

AbstractProductB (interface)
├── ConcreteProductB1
└── ConcreteProductB2
```

### Example: Cross-Platform UI Components

```java
// ── Abstract Products ──
public interface Button {
    void render();
    void onClick(Runnable action);
}

public interface Checkbox {
    void render();
    boolean isChecked();
}

public interface TextField {
    void render();
    String getText();
}

// ── Windows Family ──
public class WindowsButton implements Button {
    @Override public void render() { System.out.println("[Windows Button]"); }
    @Override public void onClick(Runnable action) { action.run(); }
}

public class WindowsCheckbox implements Checkbox {
    private boolean checked = false;
    @Override public void render() { System.out.println("[Windows Checkbox]"); }
    @Override public boolean isChecked() { return checked; }
}

public class WindowsTextField implements TextField {
    @Override public void render() { System.out.println("[Windows TextField]"); }
    @Override public String getText() { return "windows-input"; }
}

// ── macOS Family ──
public class MacButton implements Button {
    @Override public void render() { System.out.println("[Mac Button]"); }
    @Override public void onClick(Runnable action) { action.run(); }
}

public class MacCheckbox implements Checkbox {
    private boolean checked = false;
    @Override public void render() { System.out.println("[Mac Checkbox]"); }
    @Override public boolean isChecked() { return checked; }
}

public class MacTextField implements TextField {
    @Override public void render() { System.out.println("[Mac TextField]"); }
    @Override public String getText() { return "mac-input"; }
}

// ── Abstract Factory ──
public interface GUIFactory {
    Button createButton();
    Checkbox createCheckbox();
    TextField createTextField();
}

// ── Concrete Factories ──
public class WindowsFactory implements GUIFactory {
    @Override public Button createButton() { return new WindowsButton(); }
    @Override public Checkbox createCheckbox() { return new WindowsCheckbox(); }
    @Override public TextField createTextField() { return new WindowsTextField(); }
}

public class MacFactory implements GUIFactory {
    @Override public Button createButton() { return new MacButton(); }
    @Override public Checkbox createCheckbox() { return new MacCheckbox(); }
    @Override public TextField createTextField() { return new MacTextField(); }
}

// ── Client Code ──
public class Application {
    private final Button button;
    private final Checkbox checkbox;
    private final TextField textField;

    public Application(GUIFactory factory) {
        this.button = factory.createButton();
        this.checkbox = factory.createCheckbox();
        this.textField = factory.createTextField();
    }

    public void renderUI() {
        button.render();
        checkbox.render();
        textField.render();
    }
}

// Usage — the client never references concrete classes
GUIFactory factory = isWindows() ? new WindowsFactory() : new MacFactory();
Application app = new Application(factory);
app.renderUI();
```

---

## Factory Method vs Abstract Factory

| Aspect | Factory Method | Abstract Factory |
|--------|---------------|-----------------|
| **Creates** | One product at a time | Family of related products |
| **Mechanism** | Inheritance (subclass overrides method) | Composition (factory object passed to client) |
| **Complexity** | Simpler | More complex |
| **Extensibility** | Add product variants | Add entire product families |
| **Example** | `createNotification()` | `createButton()`, `createCheckbox()`, `createTextField()` |

---

## Real-World Examples

| Framework/Library | Description |
|-------------------|-------------|
| `javax.xml.parsers.DocumentBuilderFactory` | Creates XML parsers (different implementations) |
| `javax.xml.transform.TransformerFactory` | Creates XSLT transformers |
| Java AWT Toolkit | `Toolkit.getDefaultToolkit()` creates platform-specific UI peers |
| Spring `BeanFactory` / `ApplicationContext` | Creates and manages families of beans |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Isolates concrete classes from client code | Adding new product types requires changing all factories |
| Ensures consistency among related products | Can lead to a large number of classes |
| Makes exchanging product families easy | Increases initial complexity |
| Follows Open/Closed Principle for families | Overkill for simple object creation |
| Promotes programming to interfaces | |

---

## Interview Questions

**Q1: What is the Abstract Factory pattern and how does it differ from the Factory pattern?**

The Abstract Factory pattern creates families of related objects without specifying their concrete classes, often grouped by theme or platform. It differs from the Factory pattern in scope: a Factory Method creates one product, while an Abstract Factory creates a suite of related products designed to work together. Abstract Factory is a "factory of factories."

**Q2: Can you describe a real-world scenario where you would use the Abstract Factory pattern?**

Building a cross-platform UI toolkit. The Abstract Factory interface defines methods to create buttons, text fields, and checkboxes. Each platform (Windows, macOS, Linux) has its own concrete factory that produces platform-specific components. The client code works with the abstract factory interface, so switching the entire UI to a different platform requires changing only the factory — no client code modifications.

**Q3: How would you implement the Abstract Factory pattern in Java?**

Define an abstract factory interface with creation methods for each product type. Create concrete factory classes for each product family, implementing all creation methods. Each factory class instantiates its family-specific products. The client receives a factory through its constructor (dependency injection) and calls the creation methods through the abstract interface.

**Q4: What are the advantages of using the Abstract Factory pattern?**

It promotes scalability by allowing new product families to be added without modifying existing code. It ensures consistency among products designed to work together. It isolates concrete classes from clients, supporting the Dependency Inversion Principle. And it makes switching between product families trivial.

**Q5: How can the Abstract Factory pattern support scalability in large systems?**

New product families can be added by creating new concrete factory classes without modifying existing code or factories. The client code remains unchanged because it depends only on the abstract interface. This separation allows different teams to develop different product families independently, and the system can be extended as requirements grow.
