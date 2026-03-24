---
id: visitor
title: "Visitor Pattern"
slug: visitor
description: Explains the Visitor pattern used to separate algorithms from the objects on which they operate.
tags: [design-patterns, java, behavioral, visitor]
---

# Visitor Pattern

> **Category:** Behavioral  
> **Intent:** Represent an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.

---

## Overview

Sometimes you have a complex structure of objects (like a massive tree of UI components or a parsed Abstract Syntax Tree of code). You need to perform various operations across these objects (e.g., export to XML, export to JSON, calculate size). If you add these operation methods directly into the component classes, you break the Single Responsibility Principle and constantly force modifications to core domain models.

The Visitor pattern extracts these operations out into a separate "Visitor" object. The complex objects simply "accept" the visitor and pass themselves to the visitor's appropriate method. 

**Key characteristics:**
- Separates algorithms from the object structures they operate on.
- Heavily utilizes a technique called **Double Dispatch**.
- Perfect for iterating over highly heterogeneous object structures (lists containing vastly different classes).
- Hard to modify the core hierarchy, easy to add new operations.

---

## When to Use

- You need to perform operations on all elements of a complex object structure (e.g., a tree or graph).
- The elements are of drastically different classes, with different interfaces.
- The operations you perform are unrelated to the core business logic of the elements.
- The object structure is extremely stable (rarely changes), but the operations you want to perform on them change frequently.

---

## How It Works

### Document Export Example

We have a document composed of diverse elements (`Paragraph`, `Image`, `Hyperlink`). We want to extract text from them, or export them to JSON, without stuffing those methods into the node classes.

```java
// 1. Element Interface
public interface DocumentElement {
    // The magical Double Dispatch method
    void accept(Visitor visitor);
}

// 2. Concrete Elements
public class Paragraph implements DocumentElement {
    private String text;
    public Paragraph(String text) { this.text = text; }
    public String getText() { return text; }

    @Override
    public void accept(Visitor visitor) {
        visitor.visit(this); // Passes its specific Type (Paragraph) to the Visitor
    }
}

public class Image implements DocumentElement {
    private String url;
    public Image(String url) { this.url = url; }
    public String getUrl() { return url; }

    @Override
    public void accept(Visitor visitor) {
        visitor.visit(this); // Passes exactly 'this' (Image)
    }
}

// 3. Visitor Interface - Must define an overload for EVERY concrete Element
public interface Visitor {
    void visit(Paragraph paragraph);
    void visit(Image image);
}

// 4. Concrete Visitor (The Algorithm) - e.g. JSON Exporter
public class JsonExportVisitor implements Visitor {
    private StringBuilder sb = new StringBuilder();

    @Override
    public void visit(Paragraph paragraph) {
        sb.append("{ \"type\": \"paragraph\", \"content\": \"")
          .append(paragraph.getText())
          .append("\" }\n");
    }

    @Override
    public void visit(Image image) {
        sb.append("{ \"type\": \"image\", \"url\": \"")
          .append(image.getUrl())
          .append("\" }\n");
    }

    public String getJson() {
        return sb.toString();
    }
}

// 5. Another Concrete Visitor (The Algorithm) - e.g. Plain Text Extractor
public class PlainTextVisitor implements Visitor {
    private StringBuilder textOnly = new StringBuilder();

    @Override
    public void visit(Paragraph paragraph) {
        textOnly.append(paragraph.getText()).append("\n");
    }

    @Override
    public void visit(Image image) {
        textOnly.append("[Image at: ").append(image.getUrl()).append("]\n");
    }

    public String getText() {
        return textOnly.toString();
    }
}
```

### Usage

```java
List<DocumentElement> doc = Arrays.asList(
    new Paragraph("Welcome to the docs!"),
    new Image("https://example.com/logo.png")
);

// We want JSON! No problem, no need to touch the classes.
JsonExportVisitor jsonVisitor = new JsonExportVisitor();
for (DocumentElement element : doc) {
    element.accept(jsonVisitor);
}
System.out.println(jsonVisitor.getJson());

// We want Plain Text! No problem.
PlainTextVisitor textVisitor = new PlainTextVisitor();
for (DocumentElement element : doc) {
    element.accept(textVisitor);
}
System.out.println(textVisitor.getText());
```

---

## Understanding Double Dispatch

Java natively uses single dispatch. If you have an `Animal x = new Dog()`, and you call `feed(x)`, Java dynamically resolves the method based solely on the runtime type of `x` (Dog). It does *not* dynamically resolve the runtime type of the argument if you have overloaded the `feed` parameter signature.

```java
public void perform(Visitor v, DocumentElement element) {
    // This will cause a compile error or call a generic `visit(DocumentElement)`!
    // Java does NOT know at runtime if it should call visit(Paragraph) or visit(Image).
    v.visit(element); 
}
```

The Visitor pattern solves this by doing **Double Dispatch** in two steps:
1. First dispatch: `element.accept(v)`. Polymorphism routes it to the correct `Paragraph.accept` implementation.
2. Second dispatch: inside `Paragraph.accept`, we call `v.visit(this)`. Since `this` is statically bound to `Paragraph` at compile time, Java explicitly calls the `visit(Paragraph p)` method on the Visitor.

---

## Real-World Examples

| Framework/Library | Description |
|-------------------|-------------|
| **Java Compiler (AST)** | The `javax.lang.model.element.ElementVisitor` traverses parsed Java syntax trees to map over Class, Method, and Variable syntax blocks. |
| `java.nio.file.FileVisitor` | Used by `Files.walkFileTree()` to execute custom code (`visitFile()`, `preVisitDirectory()`) while traversing nested directory structures. |
| **Spring Framework** | `BeanDefinitionVisitor` executes operations directly against parsed and nested IoC XML/Annotation bean definitions. |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Open/Closed Principle: You can easily add a completely new algorithm (CSV Export) by simply making a new `Visitor` class. | Every time you add a new Element type (e.g. `Table`), you must update EVERY existing Visitor. |
| Single Responsibility Principle: Groups related behavior into one class, extracting it from business domains. | Visitor must have public/package access to the Element state, potentially breaking strict encapsulation. |
| The best way to execute logic on a collection of completely heterogeneous types. | Can be highly confusing to junior developers due to the Double Dispatch ping-pong flow. |

---

## Interview Questions

**Q1: What is the primary purpose of the Visitor pattern?**

The Visitor pattern is used to perform operations across a heterogeneous collection of objects (like an object tree) without modifying the classes of those objects. It cleanly separates the algorithm from the domain object structure.

**Q2: How does the Visitor pattern facilitate the Open/Closed Principle?**

It perfectly satisfies the Open/Closed Principle for **Algorithms**. You can introduce as many new operations as you want (export to PDF, validate tree, calculate metrics, print JSON) by adding new Visitor classes without ever touching a line of code inside the actual Element classes.

**Q3: When is the Visitor pattern a bad choice?**

Visitor is a terrible choice if the core object hierarchy is unstable. Every time you add a new Element class (like adding `Video` to the `Document`), you are forced to add `visit(Video video)` to the main `Visitor` interface, which subsequently breaks compilation and forces you to implement that method in *every single past Visitor implementation*.

**Q4: What is Double Dispatch and why does the Visitor pattern require it?**

Java does not support dynamic method overloading resolution based on the runtime type of method arguments. If a collection returns generic `Element` interfaces, Java doesn't know which specific overloaded `visit(ConcreteType)` to call. Double dispatch solves this: the Client calls an overridden method on the Element (`accept`), and the Element then explicitly passes `this` to the Visitor, providing compile-time type clarity to Java to execute the correct overload.

---

## Advanced Editorial Pass: Visitor in Abstract Syntax Trees

### Strategic Payoff
- Irreplaceable in compiler design (ANTLR, Java AST). Navigating source code representations to apply linting rules, formatting rules, or byte-code generation is exclusively done via nested Visitors.
- Centralizes scattered analytics/transformation code making system maintenance highly organized.

### Non-Obvious Risks
- **Encapsulation Decay:** To be useful, the Visitor needs to read data from the Element. This often forces designers to expose data via getters that otherwise would have been safely kept private.
- **Traversal vs Operation:** Who drives the loop? If the Object Structure drives the loop, Visitors are simple. If the Visitor drives the loop (e.g., navigating a Tree structure by calling `visit(node.left) ; visit(node.right)`), the Visitor is forced to know intricate structural details.

### Implementation Heuristics
1. Ensure your object hierarchy is 99% locked before committing to the Visitor pattern.
2. If your collection is homogeneous (all `Employee` classes), just use standard Iterators. Visitor is specifically designed for traversing *heterogeneous* sets.

### Compare Next
- [Iterator Pattern](./iterator.md)
- [Composite Pattern](./composite.md)
- [Command Pattern](./command.md)
