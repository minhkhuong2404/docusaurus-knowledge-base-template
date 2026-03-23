---
id: liskov-substitution
title: Liskov Substitution Principle
sidebar_position: 3
---

# L — Liskov Substitution Principle

> **"Objects of a subclass should be replaceable with objects of the superclass without breaking the application."**
> — Barbara Liskov, 1987

---

## 🧠 What Does It Mean?

If class `B` extends class `A`, then anywhere you use `A`, you should be able to swap in `B` without anything breaking.

A subclass should **honor the contract** of its parent. It shouldn't:
- Throw unexpected exceptions
- Return nonsense values
- Do nothing (empty override)
- Change the expected behavior

**Real-world analogy:** If someone orders "a vehicle", you can give them a car, a bus, or a truck — they're all vehicles and they all work as transportation. But if you hand them a toy car that can't actually drive, that violates the "vehicle" contract!

---

## ❌ Bad Example — Violating LSP

The classic example: `Square` extends `Rectangle`.

```java
public class Rectangle {
    protected int width;
    protected int height;

    public void setWidth(int width) {
        this.width = width;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getArea() {
        return width * height;
    }
}
```

```java
public class Square extends Rectangle {

    // A square must keep width == height
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width; // forces both dimensions to be equal
    }

    @Override
    public void setHeight(int height) {
        this.width = height; // same here
        this.height = height;
    }
}
```

```java
public class Main {

    // This method works correctly with Rectangle
    public static void printArea(Rectangle r) {
        r.setWidth(5);
        r.setHeight(10);
        // Expected: 5 * 10 = 50
        System.out.println("Area: " + r.getArea());
    }

    public static void main(String[] args) {
        printArea(new Rectangle()); // Area: 50 ✅
        printArea(new Square());    // Area: 100 ❌ — height overrides width!
    }
}
```

**Why is this bad?**

When you substitute `Square` for `Rectangle`, the behavior changes unexpectedly. The caller set width=5 and height=10 but got area=100 instead of 50. The contract is broken!

---

## ✅ Good Example — Applying LSP

Don't force an inheritance relationship that doesn't make sense. Use a **common interface** instead:

```java
// Shared abstraction
public interface Shape {
    int getArea();
}
```

```java
public class Rectangle implements Shape {
    private final int width;
    private final int height;

    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public int getArea() {
        return width * height;
    }
}
```

```java
public class Square implements Shape {
    private final int side;

    public Square(int side) {
        this.side = side;
    }

    @Override
    public int getArea() {
        return side * side;
    }
}
```

```java
public class Main {

    public static void printArea(Shape shape) {
        System.out.println("Area: " + shape.getArea());
    }

    public static void main(String[] args) {
        printArea(new Rectangle(5, 10)); // Area: 50 ✅
        printArea(new Square(5));        // Area: 25 ✅
    }
}
```

Both shapes substitute correctly — no surprises!

---

## 🌱 A More Practical Java/Spring Example

Imagine a payment processing system:

```java
public abstract class PaymentProcessor {
    public abstract void processPayment(double amount);
    public abstract void refund(double amount);
}
```

```java
// CreditCardProcessor supports both payment and refund ✅
public class CreditCardProcessor extends PaymentProcessor {
    @Override
    public void processPayment(double amount) {
        System.out.println("Charging credit card: $" + amount);
    }

    @Override
    public void refund(double amount) {
        System.out.println("Refunding to credit card: $" + amount);
    }
}
```

```java
// ❌ GiftCardProcessor can't do refunds — throws exception!
public class GiftCardProcessor extends PaymentProcessor {
    @Override
    public void processPayment(double amount) {
        System.out.println("Charging gift card: $" + amount);
    }

    @Override
    public void refund(double amount) {
        // Gift cards can't be refunded in this system
        throw new UnsupportedOperationException("Gift cards are non-refundable");
    }
}
```

If your service calls `processor.refund()` assuming all `PaymentProcessor`s support it, `GiftCardProcessor` will blow up at runtime.

**Fix:** Use Interface Segregation (next principle!) to split the contracts:

```java
public interface Payable {
    void processPayment(double amount);
}

public interface Refundable {
    void refund(double amount);
}

public class CreditCardProcessor implements Payable, Refundable {
    @Override
    public void processPayment(double amount) { /* ... */ }

    @Override
    public void refund(double amount) { /* ... */ }
}

public class GiftCardProcessor implements Payable {
    // Only implements Payable — no refund contract imposed ✅
    @Override
    public void processPayment(double amount) { /* ... */ }
}
```

---

## 🚨 Warning Signs of LSP Violation

- You see `throw new UnsupportedOperationException()` in an overridden method
- A subclass overrides a method and does **nothing** (empty body)
- You need `instanceof` checks before calling a method
- The child class weakens the guarantees of the parent

---

## 📌 Summary

| | Bad | Good |
|---|---|---|
| **Square extends Rectangle** | Breaks area calculation | Use a `Shape` interface instead |
| **GiftCard extends PaymentProcessor** | Throws on `refund()` | Implement only the interfaces it supports |
| **Key question** | "Can I swap subclass for parent safely?" | Yes → LSP is satisfied ✅ |

Next up: [Interface Segregation Principle →](./interface-segregation)
