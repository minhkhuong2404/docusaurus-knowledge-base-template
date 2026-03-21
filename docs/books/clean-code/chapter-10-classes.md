---
sidebar_position: 11
title: "Chapter 10: Classes"
description: Designing small, cohesive classes with a single responsibility and organizing them for change.
---

# Chapter 10: Classes

## Class Organization

In Java, the conventional order within a class is:

1. Public static constants
2. Private static variables
3. Private instance variables
4. Public functions
5. Private utility functions called by public functions (near their callers)

This ordering follows the **newspaper metaphor** — the most important/public things are at the top, details follow below.

---

## Classes Should Be Small

Just like functions, classes should be **small**. But the measure of a class's size is not lines of code — it's **responsibilities**.

```java
// This class name should be a warning sign
public class SuperDashboard {
    public Component getLastFocusedComponent() { ... }
    public void setLastFocused(Component lastFocused) { ... }
    public int getMajorVersionNumber() { ... }
    public int getMinorVersionNumber() { ... }
    public int getBuildNumber() { ... }
    // ...and 70 more methods
}
```

A class like `SuperDashboard` is a "God Class" — it does too much. The sign is in the name itself: `Super`, `Manager`, `Processor`, `Handler` often indicate a class that's shouldering too many responsibilities.

**The test:** you should be able to describe a class in **about 25 words** without using "and", "or", "but", or "if":

- ❌ "The `SuperDashboard` provides access to the component that last held focus **and** it allows us to track the version and build numbers."
- ✅ "The `Version` class manages version information for the application."

---

## The Single Responsibility Principle (SRP)

> *"A class should have one, and only one, reason to change."*

This is the Single Responsibility Principle. A "reason to change" = a responsibility.

```java
// Bad — SuperDashboard has at least two responsibilities
public class SuperDashboard {
    public Component getLastFocusedComponent() { ... } // UI responsibility
    public int getMajorVersionNumber() { ... }          // Versioning responsibility
}

// Good — each class has one responsibility
public class SuperDashboard {
    public Component getLastFocusedComponent() { ... }
    public void setLastFocused(Component lastFocused) { ... }
}

public class Version {
    public int getMajorVersionNumber() { ... }
    public int getMinorVersionNumber() { ... }
    public int getBuildNumber() { ... }
}
```

### The "But My System Has a Lot of Things to Do!" Objection

Many developers resist small classes because they worry about navigating many files. Martin's response: you have the same complexity either way. A system with many small focused classes is like a box with many organized drawers. A system with a few large classes is like a box with everything dumped in.

The organized drawer system is easier to navigate once you understand the organization.

---

## Cohesion

A class is **cohesive** when its methods use most of its instance variables. High cohesion means the class forms a coherent unit — every piece belongs.

```java
// Highly cohesive — every method uses both variables
public class Stack {
    private int topOfStack = 0;
    private List<Integer> elements = new LinkedList<>();

    public int size() { return topOfStack; }

    public void push(int element) {
        topOfStack++;
        elements.add(element);
    }

    public int pop() throws PoppedWhenEmpty {
        if (topOfStack == 0) throw new PoppedWhenEmpty();
        int element = elements.get(--topOfStack);
        elements.remove(topOfStack);
        return element;
    }
}
```

When a class has methods that use only 1 or 2 of its many instance variables, those methods are weakly cohesive — they might belong in a different class.

### Cohesion Guides Refactoring

When you break large functions into smaller ones, you often need to pass variables around. If many smaller functions need the same set of variables, consider promoting those variables to **instance variables of a new class**. Then the functions become methods of that class — achieving high cohesion.

---

## Organizing for Change: Open/Closed Principle

Classes should be **open for extension but closed for modification**.

```java
// Bad — adding a new SQL statement type requires modifying Sql
public class Sql {
    public Sql(String table, Column[] columns) { ... }
    public String create() { ... }
    public String insert(Object[] fields) { ... }
    public String selectAll() { ... }
    public String findByKey(String keyColumn, String keyValue) { ... }
    // Adding UPDATE requires modifying this class
}

// Good — each SQL type is its own class; adding UPDATE = new class, no modification
abstract public class Sql {
    public Sql(String table, Column[] columns) { ... }
    abstract public String generate();
}

public class CreateSql extends Sql {
    public CreateSql(String table, Column[] columns) { ... }
    @Override public String generate() { ... }
}

public class SelectSql extends Sql {
    public SelectSql(String table, Column[] columns) { ... }
    @Override public String generate() { ... }
}

public class InsertSql extends Sql {
    public InsertSql(String table, Column[] columns, Object[] fields) { ... }
    @Override public String generate() { ... }
}
```

Adding `UpdateSql` requires **adding a class**, not modifying existing ones. The risk of breaking existing behavior is zero.

---

## Isolating from Change: Dependency Inversion

Concrete implementations change; abstract interfaces are more stable. Code that depends on concrete classes is tightly coupled to those changes.

```java
// Bad — tightly coupled to a concrete implementation
public class Portfolio {
    private TokyoStockExchange exchange;

    public Portfolio() {
        this.exchange = new TokyoStockExchange(); // hard-coded dependency
    }

    public Money value() {
        return exchange.currentPrice(ticker) * shares;
    }
}

// Good — depends on an abstraction; easy to test and extend
public interface StockExchange {
    Money currentPrice(String symbol);
}

public class Portfolio {
    private StockExchange exchange;

    public Portfolio(StockExchange exchange) {
        this.exchange = exchange; // injected dependency
    }
}

// In tests, we can inject a fake
@Test
public void portfolioGrowsWithStockPrice() {
    StockExchange exchange = (symbol) -> Money.of(100); // fake implementation
    Portfolio portfolio = new Portfolio(exchange);
    // ...test logic...
}
```

This is the **Dependency Inversion Principle** — depend on abstractions, not concretions.

---

## Key Takeaways

- Classes, like functions, should be **small** — measured in responsibilities, not lines
- **Single Responsibility Principle**: one reason to change
- **High cohesion**: methods use most of the class's instance variables
- **Open/Closed Principle**: open for extension, closed for modification
- **Dependency Inversion**: depend on abstractions, not concretions
- Many small, focused classes are easier to navigate than a few large, chaotic ones
- The urge to create "convenience" God classes is a smell — decompose them
