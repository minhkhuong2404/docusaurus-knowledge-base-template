---
id: design-patterns-overview
title: "Java Design Patterns: Overview"
slug: design-patterns-overview
description: Overview of Java design patterns, their categories, and how they improve maintainability, readability, and software design decisions.
tags: [design-patterns, java, software-design, oop]
---

# Java Design Patterns: Overview

Design patterns are reusable solutions to common software design problems. They provide proven approaches that improve code maintainability, readability, and scalability, while establishing a shared vocabulary for developers to communicate design decisions.


## Design Patterns Quick Reference

| Pattern | Category | Complexity | Popularity |
|---------|----------|------------|------------|
| [Abstract Factory](abstract-factory) | Creational | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) |
| [Adapter](adapter) | Structural | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) |
| [Bridge](bridge) | Structural | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) |
| [Builder](builder) | Creational | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) |
| [Chain of Responsibility](chain-of-responsibility) | Behavioral | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) |
| [Command](command) | Behavioral | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) |
| [Composite](composite) | Structural | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) |
| [Decorator](decorator) | Structural | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) |
| [Facade](facade) | Structural | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) |
| [Factory Method](factory-method) | Creational | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) |
| [Flyweight](flyweight) | Structural | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) |
| [Interpreter](interpreter) | Behavioral | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) |
| [Iterator](iterator) | Behavioral | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) |
| [Mediator](mediator) | Behavioral | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) |
| [Memento](memento) | Behavioral | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) |
| [Observer](observer) | Behavioral | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) |
| [Prototype](prototype) | Creational | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) |
| [Proxy](proxy) | Structural | ⭐⭐☆ (2/3) | ⭐☆☆ (1/3) |
| [Singleton](singleton) | Creational | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) |
| [State](state) | Behavioral | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) |
| [Strategy](strategy) | Behavioral | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) |
| [Template Method](template-method) | Behavioral | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) |
| [Visitor](visitor) | Behavioral | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) |

---

## The Three Categories

| Category | Purpose | Patterns Covered |
|----------|---------|-----------------|
| **Creational** | Control how objects are created | [Singleton](singleton), [Factory Method](factory-method), [Abstract Factory](abstract-factory), [Builder](builder), [Prototype](prototype) |
| **Structural** | Manage object composition & relationships | [Adapter](adapter), [Bridge](bridge), [Composite](composite), [Decorator](decorator), [Facade](facade), [Flyweight](flyweight), [Proxy](proxy) |
| **Behavioral** | Define how objects communicate & share responsibility | [Chain of Responsibility](chain-of-responsibility), [Command](command), [Interpreter](interpreter), [Iterator](iterator), [Mediator](mediator), [Memento](memento), [Observer](observer), [State](state), [Strategy](strategy), [Template Method](template-method), [Visitor](visitor) |

---

## Creational Patterns at a Glance

| Pattern | Complexity | Popularity | Intent | Key Mechanism |
|---------|------------|------------|--------|---------------|
| **[Abstract Factory](abstract-factory)** | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) | Provide an interface for creating families of related objects without specifying their concrete classes. | Factory of factories |
| **[Builder](builder)** | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) | Separate the construction of a complex object from its representation, allowing the same construction process to create different representations. | Fluent builder with `build()` |
| **[Factory Method](factory-method)** | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) | Define an interface for creating objects, but let subclasses decide which class to instantiate. | Factory method returns interface type |
| **[Prototype](prototype)** | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) | Create new objects by cloning an existing instance (prototype) rather than constructing from scratch. | `clone()` method |
| **[Singleton](singleton)** | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) | Ensure a class has only one instance and provide a global point of access to it. | Private constructor + static accessor |

## Structural Patterns at a Glance

| Pattern | Complexity | Popularity | Intent | Key Mechanism |
|---------|------------|------------|--------|---------------|
| **[Adapter](adapter)** | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) | Convert the interface of a class into another interface clients expect, allowing incompatible interfaces to work together. | Wraps adaptee, implements target |
| **[Bridge](bridge)** | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) | Decouple an abstraction from its implementation so that the two can vary independently. | Composition linking two hierarchies |
| **[Composite](composite)** | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) | Compose objects into tree structures to represent part-whole hierarchies, and treat individual objects and compositions uniformly. | Component interface for leaf + composite |
| **[Decorator](decorator)** | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) | Attach additional responsibilities to an object dynamically, providing a flexible alternative to subclassing for extending functionality. | Wraps object, extends same interface |
| **[Facade](facade)** | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) | Provide a simplified, unified interface to a complex subsystem. | High-level wrapper methods |
| **[Flyweight](flyweight)** | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) | Use sharing to support large numbers of fine-grained objects efficiently. | Flyweight pool returning existing instances |
| **[Proxy](proxy)** | ⭐⭐☆ (2/3) | ⭐☆☆ (1/3) | Provide a surrogate or placeholder for another object to control access to it. | Same interface, intercepts requests |

## Behavioral Patterns at a Glance

| Pattern | Complexity | Popularity | Intent | Key Mechanism |
|---------|------------|------------|--------|---------------|
| **[Chain of Responsibility](chain-of-responsibility)** | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) | Pass a request along a chain of handlers. Each handler decides to process the request or pass it to the next handler. | Linked handlers with next reference |
| **[Command](command)** | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) | Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations. | Command object with `execute()`/`undo()` |
| **[Interpreter](interpreter)** | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) | Given a language, define a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language. | Syntax tree of rule expressions |
| **[Iterator](iterator)** | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) | Provide a way to access the elements of an aggregate object sequentially without exposing its underlying representation (list, stack, tree, etc.). | Iterator interface with `hasNext()`/`next()` |
| **[Mediator](mediator)** | ⭐⭐☆ (2/3) | ⭐⭐☆ (2/3) | Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently. | Mediator interface coordinates colleagues |
| **[Memento](memento)** | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) | Without violating encapsulation, capture and externalize an object's internal state so that the object can be restored to this state later. | Memento stores internal state snapshot |
| **[Observer](observer)** | ⭐⭐☆ (2/3) | ⭐⭐⭐ (3/3) | Define a one-to-many dependency so that when one object changes state, all its dependents are notified and updated automatically. | Subject maintains observer list |
| **[State](state)** | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) | Allow an object to alter its behavior when its internal state changes. The object will appear to change its class. | State classes encapsulate context behaviors |
| **[Strategy](strategy)** | ⭐☆☆ (1/3) | ⭐⭐⭐ (3/3) | Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it. | Composition with strategy interface |
| **[Template Method](template-method)** | ⭐☆☆ (1/3) | ⭐⭐☆ (2/3) | Define the skeleton of an algorithm in a superclass, letting subclasses override specific steps without changing the algorithm's structure. | Abstract class with `final` template method |
| **[Visitor](visitor)** | ⭐⭐⭐ (3/3) | ⭐☆☆ (1/3) | Represent an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates. | Double dispatch pattern |


## Design Patterns vs Design Principles

| Concept | What It Is | Examples |
|---------|-----------|----------|
| **Design Principle** | General guideline for writing good code | SOLID, DRY, KISS, YAGNI |
| **Design Pattern** | Specific, proven solution template for a recurring problem | Singleton, Factory, Observer |

Patterns often implement one or more principles — for example, the Strategy pattern applies the **Open/Closed Principle** and **Dependency Inversion**.

---

## When to Use Design Patterns

- **DO** use patterns when you recognize a recurring design problem they solve
- **DO** use patterns to communicate intent clearly with your team
- **DON'T** force patterns into every problem — simplicity beats cleverness
- **DON'T** over-engineer with patterns when a straightforward solution works

> _"Design patterns should be used to simplify code, not to complicate it."_

---

## Advanced Editorial Pass: Pattern Selection Under Real Constraints

### Architectural Decision Heuristics
- Start with volatility analysis: which part of the design is likely to change first (creation, composition, or behavior)?
- Select the lightest pattern that isolates that volatility; avoid introducing extension points with no credible change pressure.
- Evaluate operational impact early: observability, failure isolation, and debugging complexity matter as much as class design elegance.

### Common Misuse Signals
- A pattern is chosen before a concrete pain point exists.
- Teams use pattern names as status signals instead of problem-solution language.
- The implementation increases indirection but does not reduce coupling or change risk.

### Senior-Level Review Questions
1. Which design axis are we trying to stabilize: construction, structure, or runtime behavior?
2. What is the expected cost of removing this pattern in 6 months if requirements simplify?
3. Does this pattern improve deploy-time and run-time operability, or only source-level aesthetics?

### Compare Next
- [Strategy Pattern](./strategy.md)
- [Factory Method Pattern](./factory-method.md)
- [Decorator Pattern](./decorator.md)
