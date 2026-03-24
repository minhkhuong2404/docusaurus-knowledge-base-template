---
id: dependency-inversion
title: Dependency Inversion Principle
sidebar_position: 5
description: Don't let your important business logic classes depend directly on concrete
  implementations (like a specific database driver, a specific email provider, etc.).
tags:
- technical-knowledge
- solid
- dependency-inversion
---
# D — Dependency Inversion Principle

> **"High-level modules should not depend on low-level modules. Both should depend on abstractions."**
> — Robert C. Martin

---

## 🧠 What Does It Mean?

Don't let your important business logic classes depend directly on concrete implementations (like a specific database driver, a specific email provider, etc.).

Instead, both the high-level class and low-level class should **depend on an interface (abstraction)**.

**Real-world analogy:** When you plug a lamp into the wall, you don't care if the electricity comes from a coal plant, solar panels, or a nuclear reactor. The **plug socket (interface)** is the abstraction. Your lamp depends on the socket — not on where the electricity comes from. You can swap the power source without touching the lamp.

---

## ❌ Bad Example — Violating DIP

```java
// Low-level class — a specific implementation
public class MySQLUserRepository {
    public void save(String username) {
        System.out.println("Saving to MySQL: " + username);
    }
}
```

```java
// High-level class depends DIRECTLY on the low-level MySQLUserRepository
public class UserService {

    // Tightly coupled to MySQL! ❌
    private MySQLUserRepository repository = new MySQLUserRepository();

    public void registerUser(String username) {
        // some business logic...
        repository.save(username);
    }
}
```

**Why is this bad?**
- Want to switch to PostgreSQL? You must modify `UserService`.
- Want to write unit tests with a fake/mock repository? You can't — it's hardcoded.
- `UserService` (high-level business logic) is directly tied to `MySQLUserRepository` (low-level detail).

---

## ✅ Good Example — Applying DIP

Introduce an interface (abstraction) that both the high-level and low-level modules depend on:

```java
// The abstraction — both sides depend on this
public interface UserRepository {
    void save(String username);
}
```

```java
// Low-level: MySQL implementation
public class MySQLUserRepository implements UserRepository {
    @Override
    public void save(String username) {
        System.out.println("Saving to MySQL: " + username);
    }
}
```

```java
// Low-level: PostgreSQL implementation (easy to add!)
public class PostgreSQLUserRepository implements UserRepository {
    @Override
    public void save(String username) {
        System.out.println("Saving to PostgreSQL: " + username);
    }
}
```

```java
// Low-level: In-memory implementation (great for testing!)
public class InMemoryUserRepository implements UserRepository {
    private final List<String> users = new ArrayList<>();

    @Override
    public void save(String username) {
        users.add(username);
        System.out.println("Saved in memory: " + username);
    }
}
```

```java
// High-level: UserService now depends on the INTERFACE, not a concrete class
public class UserService {

    private final UserRepository repository; // interface, not concrete class ✅

    // Dependency is INJECTED — not created inside
    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public void registerUser(String username) {
        // business logic...
        repository.save(username);
    }
}
```

Now you can plug in any repository without touching `UserService`!

```java
// Easily swap implementations
UserService mysqlService = new UserService(new MySQLUserRepository());
UserService postgresService = new UserService(new PostgreSQLUserRepository());
UserService testService = new UserService(new InMemoryUserRepository());
```

---

## 🌱 In a Spring Boot Application

Spring's **dependency injection** is literally built on DIP. When you use `@Autowired` or constructor injection, Spring injects the right implementation at runtime.

```java
// The interface (abstraction)
public interface PaymentGateway {
    void charge(String customerId, double amount);
}
```

```java
// Real implementation (used in production)
@Component
@Profile("production")
public class StripePaymentGateway implements PaymentGateway {
    @Override
    public void charge(String customerId, double amount) {
        System.out.println("Charging via Stripe: $" + amount + " for customer " + customerId);
        // real Stripe API call here
    }
}
```

```java
// Fake implementation (used in development/testing)
@Component
@Profile("development")
public class MockPaymentGateway implements PaymentGateway {
    @Override
    public void charge(String customerId, double amount) {
        System.out.println("[MOCK] Fake charge of $" + amount + " for " + customerId);
    }
}
```

```java
@Service
public class OrderService {

    private final PaymentGateway paymentGateway;

    // Spring injects the right implementation based on @Profile
    public OrderService(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    public void placeOrder(String customerId, double total) {
        // business logic...
        paymentGateway.charge(customerId, total);
    }
}
```

In production → Stripe is injected.
In testing → Mock is injected.
`OrderService` **never changes** — it always works with the `PaymentGateway` interface. ✅

---

## 🔑 Key Concepts

| Term | Meaning |
|------|---------|
| **High-level module** | Your business logic (`OrderService`, `UserService`) |
| **Low-level module** | The detail (`MySQLRepo`, `StripeGateway`, `EmailSender`) |
| **Abstraction** | The interface that sits between them |
| **Dependency Injection** | Providing the dependency from outside (constructor injection) |

---

## 💡 Quick Rule of Thumb

If you see `new ConcreteClass()` **inside** a service or business class, ask yourself: *"Should this be an interface instead?"*

A high-level class should **never** call `new` on a low-level class. Let Spring (or another IoC container) manage that.

---

## 📌 Summary

| | Bad | Good |
|---|---|---|
| **Dependency on** | Concrete class (`MySQLUserRepository`) | Interface (`UserRepository`) |
| **How created** | `new MySQLUserRepository()` inside service | Injected via constructor |
| **Swap implementation** | Must modify business class | Just provide a different bean |
| **Testability** | Hard — can't mock | Easy — inject a test double |

You've completed all 5 SOLID principles! [See the full summary →](../summary)
