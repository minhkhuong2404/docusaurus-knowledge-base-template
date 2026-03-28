---
id: open-closed
title: Open/Closed Principle
sidebar_position: 2
description: 'Your class should be: - **Open for extension** → You can add new behavior
  - **Closed for modification** → You don''t change existing, working code'
tags:
- technical-knowledge
- solid
- open-closed
---
# O — Open/Closed Principle

> **"Software entities should be open for extension, but closed for modification."**
> — Bertrand Meyer, popularized by Robert C. Martin

---

## 🧠 What Does It Mean?

Your class should be:
- **Open for extension** → You can add new behavior
- **Closed for modification** → You don't change existing, working code

The goal is to **add new features without touching existing, tested code**. Every time you modify old code, you risk introducing bugs.

A great analogy: Think of a **power strip**. You don't rewire the strip every time you want to plug in a new device — you just plug in. The strip is "closed" for internal modification, but "open" for new devices.

---

## ❌ Bad Example — Violating OCP

```java
public class DiscountService {

    public double calculateDiscount(String customerType, double price) {
        if (customerType.equals("REGULAR")) {
            return price * 0.05;
        } else if (customerType.equals("PREMIUM")) {
            return price * 0.10;
        } else if (customerType.equals("VIP")) {
            return price * 0.20;
        }
        // What happens when you need a new "STUDENT" type?
        // You have to come back and modify this method! ❌
        return 0;
    }
}
```

**Why is this bad?**

Every time a new customer type is added, you have to **modify** `DiscountService`. This risks breaking the existing logic for `REGULAR` and `PREMIUM` customers. And if this class is big, things get fragile fast.

---

## ✅ Good Example — Applying OCP

Use **abstraction** (interfaces or abstract classes) to define a contract, then create separate implementations:

```java
// Define a common contract (abstraction)
public interface DiscountStrategy {
    double calculate(double price);
}
```

```java
// Each customer type is its own class
public class RegularDiscount implements DiscountStrategy {
    @Override
    public double calculate(double price) {
        return price * 0.05;
    }
}
```

```java
public class PremiumDiscount implements DiscountStrategy {
    @Override
    public double calculate(double price) {
        return price * 0.10;
    }
}
```

```java
public class VIPDiscount implements DiscountStrategy {
    @Override
    public double calculate(double price) {
        return price * 0.20;
    }
}
```

```java
// DiscountService never changes when you add new types
public class DiscountService {

    public double calculateDiscount(DiscountStrategy strategy, double price) {
        return strategy.calculate(price);
    }
}
```

Now if you need a `StudentDiscount`:

```java
// Just add a new class — don't touch DiscountService! ✅
public class StudentDiscount implements DiscountStrategy {
    @Override
    public double calculate(double price) {
        return price * 0.15;
    }
}
```

---

## 🌱 In a Spring Boot Application

This pattern fits naturally with Spring's dependency injection. You can use `@Component` on each strategy and inject the right one:

```java
public interface NotificationSender {
    void send(String message, String recipient);
}
```

```java
@Component("email")
public class EmailNotificationSender implements NotificationSender {
    @Override
    public void send(String message, String recipient) {
        System.out.println("Email to " + recipient + ": " + message);
    }
}
```

```java
@Component("sms")
public class SmsNotificationSender implements NotificationSender {
    @Override
    public void send(String message, String recipient) {
        System.out.println("SMS to " + recipient + ": " + message);
    }
}
```

```java
@Service
public class NotificationService {

    private final Map<String, NotificationSender> senders;

    // Spring auto-injects all NotificationSender beans into this map!
    public NotificationService(Map<String, NotificationSender> senders) {
        this.senders = senders;
    }

    public void notify(String type, String message, String recipient) {
        NotificationSender sender = senders.get(type);
        if (sender == null) throw new IllegalArgumentException("Unknown type: " + type);
        sender.send(message, recipient);
    }
}
```

To add a new `PushNotificationSender`, just create a new `@Component` class. `NotificationService` stays **unchanged**. 🎉

---

## 💡 Quick Rule of Thumb

If adding a new feature requires you to **open an existing file and add an `if/else` or `switch` case**, that's a sign you're violating OCP.

---

## 📌 Summary

| | Bad | Good |
|---|---|---|
| **New feature** | Modify existing class | Add a new class |
| **Risk** | Break existing behavior | Isolated, safe |
| **Key tool** | `if/else`, `switch` | Interfaces + polymorphism |

Next up: [Liskov Substitution Principle →](./liskov-substitution)

---

## Interview Questions

### Q: How do you apply OCP in feature-flag-heavy systems?
**A:** Keep stable orchestration fixed, and plug variant behavior behind strategy interfaces selected by flags/config.

### Q: What is the difference between OCP and over-engineering?
**A:** OCP targets expected change points. Over-engineering adds extension points where change is unlikely.

### Q: How does OCP improve release safety?
**A:** New behavior is introduced by adding isolated implementations, reducing risk of regressions in existing paths.

### Q: In Spring, what is a practical OCP pattern for business rules?
**A:** Register rule handlers as beans implementing a common interface, then route by key/context instead of adding new switch branches.

### Q: What is an anti-pattern that pretends to follow OCP?
**A:** A central dispatcher class that still requires modifying a switch map for each new behavior.

### Q: How do you decide when a branch should be replaced by polymorphism?
**A:** If branching grows with business variants and changes frequently, move to polymorphism. If it is stable and small, keep a simple branch.

### Q: How does OCP interact with API versioning?
**A:** New versions can be added as new handlers/adapters while preserving old behavior, minimizing risky edits in existing version paths.

### Q: Give a production scenario where OCP paid off.
**A:** Swapping a notification channel or pricing rule by adding a new implementation without touching order workflow logic.
