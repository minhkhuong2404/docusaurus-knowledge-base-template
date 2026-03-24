---
id: summary
title: Summary & Cheat Sheet
sidebar_position: 3
description: Congratulations! You've learned all 5 SOLID principles. Here's everything
  at a glance.
tags:
- technical-knowledge
- solid
- summary
---
# ✅ Summary & Cheat Sheet

Congratulations! You've learned all 5 SOLID principles. Here's everything at a glance.

---

## 🗺️ The Big Picture

```
S — Single Responsibility  →  One class, one job
O — Open/Closed            →  Extend, don't modify
L — Liskov Substitution    →  Subclasses keep parent's promise
I — Interface Segregation  →  Small, focused interfaces
D — Dependency Inversion   →  Depend on interfaces, not concretions
```

---

## 📋 Principle Quick Reference

### S — Single Responsibility
- **Rule:** A class should have only **one reason to change**
- **Smell:** The class description needs the word "AND"
- **Fix:** Extract each responsibility into its own class
- **Spring example:** Separate `@Controller`, `@Service`, `@Repository`

```java
// ❌ Bad
class UserService { void save() {} void sendEmail() {} void log() {} }

// ✅ Good
class UserRepository { void save() {} }
class EmailService    { void send() {} }
class AuditLogger     { void log() {}  }
```

---

### O — Open/Closed
- **Rule:** Open for extension, **closed for modification**
- **Smell:** Adding a feature requires adding another `if/else` to an existing class
- **Fix:** Use interfaces and polymorphism; add new classes instead of changing old ones
- **Spring example:** Strategy pattern with `@Component` beans in a `Map`

```java
// ❌ Bad
if (type.equals("EMAIL")) { ... }
else if (type.equals("SMS")) { ... }

// ✅ Good
interface NotificationSender { void send(String msg); }
class EmailSender implements NotificationSender { ... }
class SmsSender   implements NotificationSender { ... }
```

---

### L — Liskov Substitution
- **Rule:** Subclasses must be **drop-in replacements** for their parent
- **Smell:** A subclass throws `UnsupportedOperationException` or has an empty method body
- **Fix:** Don't inherit just for code reuse — inherit for true "is-a" relationships; use interfaces instead
- **Spring example:** All `PaymentGateway` implementations actually support `charge()`

```java
// ❌ Bad: Square extends Rectangle breaks area calculation
// ✅ Good: Both implement Shape interface with getArea()

interface Shape { int getArea(); }
class Rectangle implements Shape { ... }
class Square    implements Shape { ... }
```

---

### I — Interface Segregation
- **Rule:** Don't force classes to implement methods they don't use
- **Smell:** Empty method bodies or `// not applicable` comments in implementations
- **Fix:** Break fat interfaces into small, focused ones
- **Spring example:** Separate read/write repositories; separate sender interfaces

```java
// ❌ Bad
interface Worker { void work(); void eat(); void sleep(); }

// ✅ Good
interface Workable  { void work();  }
interface Eatable   { void eat();   }
interface Sleepable { void sleep(); }
```

---

### D — Dependency Inversion
- **Rule:** Depend on **abstractions** (interfaces), not concrete classes
- **Smell:** `new ConcreteClass()` inside a service or business logic class
- **Fix:** Inject dependencies through constructor; depend on interfaces
- **Spring example:** `@Autowired` with interface types; `@Profile` to swap implementations

```java
// ❌ Bad
class OrderService {
    private StripeGateway gateway = new StripeGateway(); // hardcoded!
}

// ✅ Good
class OrderService {
    private final PaymentGateway gateway; // interface!
    public OrderService(PaymentGateway gateway) { this.gateway = gateway; }
}
```

---

## 🔗 How They Work Together

The SOLID principles aren't isolated rules — they complement each other:

| Principle | Enables |
|-----------|---------|
| **SRP** | Smaller, focused classes → easier to apply OCP and DIP |
| **OCP** | Uses interfaces (ISP) and injection (DIP) to allow extension |
| **LSP** | Ensures that OCP's substitutions actually work correctly |
| **ISP** | Makes DIP easier — small interfaces are easier to implement and inject |
| **DIP** | The foundation for testability and flexibility in Spring |

---

## 🧪 Testing Is Your Signal

If a class is **hard to unit test**, it's usually violating one or more SOLID principles:

| Symptom | Likely Violation |
|---------|-----------------|
| Can't test without a real database | D — no interface for repository |
| Test class setup is 100 lines | S — class does too much |
| Adding a new case breaks existing tests | O — not open for extension |
| Mock throws unexpectedly | L — subclass doesn't honor contract |
| Mocking forces you to stub 10 unused methods | I — interface is too fat |

---

## 🎯 Where to Go Next

- **Practice:** Refactor a class in your current project using these principles
- **Read:** *Clean Code* by Robert C. Martin
- **Learn:** Design patterns (Strategy, Factory, Observer) — they all build on SOLID
- **Explore:** Spring's source code itself is a masterclass in SOLID applied to real frameworks
