---
id: strategy
title: "Strategy Pattern"
slug: strategy
description: Explains the Strategy pattern for swapping algorithms at runtime through a shared interface and composition.
tags: [design-patterns, java, behavioral, strategy]
---

# Strategy Pattern

> **Category:** Behavioral  
> **Intent:** Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.

---

## Overview

The Strategy pattern extracts related algorithms into separate classes (strategies) and lets the client switch between them at runtime. Instead of hardcoding a specific algorithm, you program to an interface and inject the desired strategy.

**Key characteristics:**
- Defines a common interface for a family of algorithms
- Each algorithm is encapsulated in its own class
- Client delegates work to the strategy object instead of implementing it directly
- Strategies can be swapped at runtime

---

## When to Use

- You have multiple algorithms for a specific task and want to switch between them
- You want to avoid conditional logic (`if/else`, `switch`) that selects an algorithm
- You want to isolate the algorithm implementation from the code that uses it
- Related classes differ only in their behavior

---

## How It Works

### Sorting Strategy Example

```java
// Strategy interface
public interface SortStrategy<T extends Comparable<T>> {
    void sort(List<T> data);
    String getName();
}

// Concrete strategies
public class QuickSortStrategy<T extends Comparable<T>> implements SortStrategy<T> {
    @Override
    public void sort(List<T> data) {
        Collections.sort(data);  // simplified — uses Java's built-in sort
        System.out.println("Sorted using QuickSort");
    }

    @Override
    public String getName() { return "QuickSort"; }
}

public class BubbleSortStrategy<T extends Comparable<T>> implements SortStrategy<T> {
    @Override
    public void sort(List<T> data) {
        for (int i = 0; i < data.size() - 1; i++) {
            for (int j = 0; j < data.size() - i - 1; j++) {
                if (data.get(j).compareTo(data.get(j + 1)) > 0) {
                    T temp = data.get(j);
                    data.set(j, data.get(j + 1));
                    data.set(j + 1, temp);
                }
            }
        }
        System.out.println("Sorted using BubbleSort");
    }

    @Override
    public String getName() { return "BubbleSort"; }
}

public class MergeSortStrategy<T extends Comparable<T>> implements SortStrategy<T> {
    @Override
    public void sort(List<T> data) {
        mergeSort(data, 0, data.size() - 1);
        System.out.println("Sorted using MergeSort");
    }

    private void mergeSort(List<T> data, int left, int right) {
        if (left < right) {
            int mid = (left + right) / 2;
            mergeSort(data, left, mid);
            mergeSort(data, mid + 1, right);
            merge(data, left, mid, right);
        }
    }

    private void merge(List<T> data, int left, int mid, int right) {
        // merge logic omitted for brevity
    }

    @Override
    public String getName() { return "MergeSort"; }
}
```

### Context — Auto-Selecting Strategy

```java
public class Sorter<T extends Comparable<T>> {
    private SortStrategy<T> strategy;

    public Sorter(SortStrategy<T> strategy) {
        this.strategy = strategy;
    }

    public void setStrategy(SortStrategy<T> strategy) {
        this.strategy = strategy;
    }

    public void sort(List<T> data) {
        System.out.println("Using strategy: " + strategy.getName());
        strategy.sort(data);
    }

    // Auto-select based on data size
    public static <T extends Comparable<T>> Sorter<T> autoSelect(List<T> data) {
        if (data.size() < 10) {
            return new Sorter<>(new BubbleSortStrategy<>());
        } else if (data.size() < 1000) {
            return new Sorter<>(new QuickSortStrategy<>());
        } else {
            return new Sorter<>(new MergeSortStrategy<>());
        }
    }
}

// Usage
List<Integer> data = new ArrayList<>(List.of(5, 2, 8, 1, 9, 3));
Sorter<Integer> sorter = Sorter.autoSelect(data);
sorter.sort(data);  // BubbleSort for small list

// Switch strategy at runtime
sorter.setStrategy(new MergeSortStrategy<>());
sorter.sort(data);
```

### Payment Processing Example

```java
public interface PaymentStrategy {
    boolean pay(BigDecimal amount);
    String getPaymentMethod();
}

public class CreditCardPayment implements PaymentStrategy {
    private final String cardNumber;
    private final String cvv;

    public CreditCardPayment(String cardNumber, String cvv) {
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }

    @Override
    public boolean pay(BigDecimal amount) {
        System.out.printf("💳 Paid $%s with credit card ending in %s%n",
            amount, cardNumber.substring(cardNumber.length() - 4));
        return true;
    }

    @Override
    public String getPaymentMethod() { return "Credit Card"; }
}

public class PayPalPayment implements PaymentStrategy {
    private final String email;

    public PayPalPayment(String email) {
        this.email = email;
    }

    @Override
    public boolean pay(BigDecimal amount) {
        System.out.printf("📧 Paid $%s via PayPal (%s)%n", amount, email);
        return true;
    }

    @Override
    public String getPaymentMethod() { return "PayPal"; }
}

public class CryptoPayment implements PaymentStrategy {
    private final String walletAddress;

    public CryptoPayment(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    @Override
    public boolean pay(BigDecimal amount) {
        System.out.printf("🪙 Paid $%s via crypto wallet %s%n",
            amount, walletAddress.substring(0, 8) + "...");
        return true;
    }

    @Override
    public String getPaymentMethod() { return "Cryptocurrency"; }
}

// Context
public class ShoppingCart {
    private final List<Item> items = new ArrayList<>();
    private PaymentStrategy paymentStrategy;

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public boolean checkout() {
        BigDecimal total = items.stream()
            .map(Item::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return paymentStrategy.pay(total);
    }
}
```

### Strategy with Java Lambda (Functional Approach)

```java
@FunctionalInterface
public interface DiscountStrategy {
    BigDecimal applyDiscount(BigDecimal price);
}

public class PricingService {
    public BigDecimal calculatePrice(BigDecimal basePrice, DiscountStrategy discount) {
        return discount.applyDiscount(basePrice);
    }
}

// Usage with lambdas — no need for separate classes
PricingService service = new PricingService();

// 10% off
BigDecimal price1 = service.calculatePrice(new BigDecimal("100"),
    price -> price.multiply(new BigDecimal("0.90")));

// Flat $15 off
BigDecimal price2 = service.calculatePrice(new BigDecimal("100"),
    price -> price.subtract(new BigDecimal("15")));

// Buy above $50, get 20% off
BigDecimal price3 = service.calculatePrice(new BigDecimal("100"),
    price -> price.compareTo(new BigDecimal("50")) > 0
        ? price.multiply(new BigDecimal("0.80")) : price);
```

---

## Strategy vs. Template Method

| Aspect | Strategy | Template Method |
|--------|----------|-----------------|
| Mechanism | Composition (has-a) | Inheritance (is-a) |
| Algorithm structure | Entire algorithm is replaceable | Overall structure is fixed; steps vary |
| Flexibility | Swappable at runtime | Fixed at compile time |
| Coupling | Loose — strategy is a separate object | Tight — subclass is bound to superclass |
| Use case | Interchangeable behaviors | Variations on a common workflow |

---

## Real-World Examples

| Framework/Library | Description |
|-------------------|-------------|
| `java.util.Comparator` | Sort strategy — `Collections.sort(list, comparator)` |
| `java.util.concurrent.RejectedExecutionHandler` | Strategy for handling tasks rejected by a `ThreadPoolExecutor` |
| Spring `Resource` | `ClassPathResource`, `FileSystemResource`, `UrlResource` — different loading strategies |
| `javax.validation` | Different validation strategies per annotation |
| `java.util.zip` | `Deflater`/`Inflater` compression strategies |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Eliminates conditional algorithm selection | Clients must be aware of different strategies |
| Easy to extend with new algorithms (OCP) | Increased number of objects |
| Strategies are reusable across contexts | Overkill for only two variants |
| Runtime algorithm switching | Communication overhead between context and strategy |

---

## Interview Questions

**Q1: What is the Strategy pattern and how does it differ from using if/else?**

The Strategy pattern replaces conditional algorithm selection with polymorphism. Instead of `if (type == "A") doA(); else if (type == "B") doB();`, you encapsulate each algorithm behind a common interface and inject the desired one. This is more extensible (new algorithms don't modify existing code), more testable (strategies can be tested independently), and follows the Open/Closed Principle.

**Q2: How does the Strategy pattern promote the Open/Closed Principle?**

New algorithms can be added by creating new strategy classes that implement the common interface — without modifying the context class or existing strategies. The context delegates work to the strategy interface, so it's closed for modification but open for extension.

**Q3: Can you implement the Strategy pattern with lambdas in Java?**

Yes. If the strategy interface has a single abstract method (functional interface), you can use lambdas or method references instead of creating full classes. For example, `Comparator` is a strategy interface that's commonly used with lambdas: `list.sort((a, b) -> a.getName().compareTo(b.getName()))`. This reduces boilerplate for simple strategies.

**Q4: How does the Strategy pattern differ from the State pattern?**

Both encapsulate behavior behind an interface. Strategy lets the client choose which algorithm to use — the choice is external. State manages automatic transitions between behaviors based on internal state — the object itself changes its behavior. In Strategy, the client sets the strategy; in State, the context transitions between states on its own.

**Q5: When should you prefer Strategy over Template Method?**

Use Strategy when you need runtime flexibility, when the algorithms are fundamentally different (not just steps within a shared template), or when you want loose coupling through composition. Use Template Method when there's a clear algorithmic skeleton with only certain steps varying. Strategy favors composition; Template Method favors inheritance.

---

## Advanced Editorial Pass: Strategy for Runtime Policy Evolution

### Strategic Payoff
- Encapsulates policy variation behind stable contracts.
- Enables safe runtime switching based on context, telemetry, or tenant profile.
- Reduces condition-heavy logic that is hard to test and reason about.

### Non-Obvious Risks
- Strategy count can grow faster than governance and naming discipline.
- Context leaks too much state into strategy APIs, creating covert coupling.
- Runtime selection logic becomes a hidden second decision system.

### Implementation Heuristics
1. Keep strategy interfaces minimal and context-agnostic.
2. Externalize strategy selection policy and make it observable.
3. Benchmark critical strategies; abstraction should not hide major performance cliffs.

### Compare Next
- [Template Method Pattern](./template-method.md)
- [Command Pattern](./command.md)
- [Bridge Pattern](./bridge.md)
