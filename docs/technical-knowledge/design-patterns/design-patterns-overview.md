---
id: design-patterns-overview
title: "Java Design Patterns: Overview"
slug: design-patterns-overview
description: Overview of Java design patterns, their categories, and how they improve maintainability, readability, and software design decisions.
tags: [design-patterns, java, software-design, oop]
---

# Java Design Patterns: Overview

Design patterns are reusable solutions to common software design problems. They provide proven approaches that improve code maintainability, readability, and scalability, while establishing a shared vocabulary for developers to communicate design decisions.

---

## The Three Categories

| Category | Purpose | Patterns Covered |
|----------|---------|-----------------|
| **Creational** | Control how objects are created | [Singleton](singleton), [Factory Method](factory-method), [Abstract Factory](abstract-factory), [Builder](builder), [Prototype](prototype) |
| **Structural** | Manage object composition & relationships | [Adapter](adapter), [Bridge](bridge), [Composite](composite), [Decorator](decorator), [Facade](facade), [Proxy](proxy) |
| **Behavioral** | Define how objects communicate & share responsibility | [Chain of Responsibility](chain-of-responsibility), [Observer](observer), [Strategy](strategy), [Command](command), [Template Method](template-method) |

---

## Creational Patterns at a Glance

| Pattern | Intent | Key Mechanism |
|---------|--------|---------------|
| **Singleton** | One instance globally | Private constructor + static accessor |
| **Factory Method** | Delegate creation to subclasses | Factory method returns interface type |
| **Abstract Factory** | Create families of related objects | Factory of factories |
| **Builder** | Step-by-step complex construction | Fluent builder with `build()` |
| **Prototype** | Clone existing objects | `clone()` method |

## Structural Patterns at a Glance

| Pattern | Intent | Key Mechanism |
|---------|--------|---------------|
| **Adapter** | Make incompatible interfaces compatible | Wraps adaptee, implements target |
| **Bridge** | Decouple abstraction from implementation | Composition linking two hierarchies |
| **Composite** | Tree structures with uniform interface | Component interface for leaf + composite |
| **Decorator** | Add behavior dynamically | Wraps object, extends same interface |
| **Facade** | Simplify complex subsystem | High-level wrapper methods |
| **Proxy** | Control access to an object | Same interface, intercepts requests |

## Behavioral Patterns at a Glance

| Pattern | Intent | Key Mechanism |
|---------|--------|---------------|
| **Chain of Responsibility** | Pass request along handler chain | Linked handlers with next reference |
| **Observer** | Notify dependents of state change | Subject maintains observer list |
| **Strategy** | Swap algorithms at runtime | Composition with strategy interface |
| **Command** | Encapsulate request as object | Command object with `execute()`/`undo()` |
| **Template Method** | Fixed algorithm, customizable steps | Abstract class with `final` template method |

---

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
