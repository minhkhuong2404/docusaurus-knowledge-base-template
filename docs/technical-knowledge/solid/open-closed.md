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

## 🎯 Why Should I Care?

Picture this: You're working on an e-commerce platform with a pricing engine. Every time marketing wants a new promotion type — flash sales, buy-one-get-one, loyalty discounts, seasonal deals — a developer has to:

1. Open `PricingService.java`
2. Add another `else if` branch to a 400-line method
3. Hope the new branch doesn't break the 15 existing discount types
4. Run the entire regression suite (which takes 45 minutes)
5. Coordinate with 3 other developers who are also editing the same file

After 18 months, the method has 32 branches, nobody fully understands it, and marketing requests take 2 weeks instead of 2 days.

**This is what happens without OCP:**
- 🐛 **Regression risk** — every change to existing code can break proven behavior
- 🐢 **Slow feature delivery** — adding a simple variant requires deep understanding of the entire method
- 💥 **Merge hell** — multiple developers editing the same switch/if-else chain
- 😰 **Testing burden** — you must retest everything because the modification touches shared code

With OCP, adding a new discount type is just creating a new class. **Zero risk to existing behavior.**

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

## 🔍 How to Spot Violations

| Smell | What It Looks Like |
|---|---|
| **Growing if/else chains** | Every new feature adds another branch to the same method |
| **Switch on type** | `switch(type)` with cases that grow over time |
| **"Just add it here"** | PRs that always modify the same file for new features |
| **Enum-driven logic** | A central enum where every new value requires editing multiple switch statements |
| **Fragile tests** | Existing tests break when unrelated new features are added |
| **String-based dispatching** | Using string comparisons to decide behavior (`if type.equals("X")`) |

**The golden rule:** If adding a new feature requires you to **open an existing file and add an `if/else` or `switch` case**, that's a sign you're violating OCP.

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

## 🏢 Real-World Use Cases

### 1. Payment Provider Integration

A fintech company starts with Stripe integration. Six months later, they need to support PayPal, then Apple Pay, then local payment methods for Southeast Asian markets.

**Without OCP:** The `PaymentService` grows a massive switch statement. Every new provider risks breaking Stripe processing — the most critical revenue path.

**With OCP:**
```java
public interface PaymentProvider {
    PaymentResult charge(PaymentRequest request);
    boolean supports(String method);
}

@Component
public class StripeProvider implements PaymentProvider { /* ... */ }

@Component
public class PayPalProvider implements PaymentProvider { /* ... */ }

// Adding GrabPay for Southeast Asia — zero changes to existing code
@Component
public class GrabPayProvider implements PaymentProvider { /* ... */ }
```

The `PaymentOrchestrator` routes to the right provider dynamically. Adding GrabPay is a single new class — no existing tests need to change.

### 2. Report Export Engine

A SaaS analytics platform initially exports PDF reports. Customers request CSV, then Excel, then interactive HTML dashboards.

**Without OCP:** A single `ExportService` with format-specific `if` branches. Adding HTML export accidentally breaks PDF margins.

**With OCP:**
```java
public interface ReportExporter {
    byte[] export(ReportData data);
    String getFormat();
}

@Component public class PdfExporter implements ReportExporter { /* ... */ }
@Component public class CsvExporter implements ReportExporter { /* ... */ }
@Component public class ExcelExporter implements ReportExporter { /* ... */ }
// New! No existing exporters touched
@Component public class HtmlDashboardExporter implements ReportExporter { /* ... */ }
```

### 3. Rule Engine for Insurance Underwriting

An insurance company has dozens of underwriting rules that change quarterly. Business analysts need to add new rules without risking existing approved rules.

**With OCP:**
```java
public interface UnderwritingRule {
    RuleResult evaluate(Application application);
    int priority();
}

@Component public class AgeEligibilityRule implements UnderwritingRule { /* ... */ }
@Component public class CreditScoreRule implements UnderwritingRule { /* ... */ }
@Component public class MedicalHistoryRule implements UnderwritingRule { /* ... */ }

@Service
public class UnderwritingEngine {
    private final List<UnderwritingRule> rules; // auto-injected by Spring

    public UnderwritingResult evaluate(Application app) {
        return rules.stream()
            .sorted(Comparator.comparingInt(UnderwritingRule::priority))
            .map(rule -> rule.evaluate(app))
            .reduce(UnderwritingResult::merge)
            .orElse(UnderwritingResult.APPROVED);
    }
}
```

New rules are just new classes. The engine never changes. Compliance auditors love it because approved rules are never modified.

---

## 🏗️ Architecture-Level Deep Dive

### Design Patterns That Implement OCP

OCP isn't a single pattern — it's a principle that multiple patterns serve:

| Pattern | How It Achieves OCP | Best For |
|---|---|---|
| **Strategy** | Swap behavior via interchangeable algorithms | Discount calculation, sorting, validation |
| **Template Method** | Override specific steps while keeping the overall flow fixed | Processing pipelines, lifecycle hooks |
| **Decorator** | Wrap and extend behavior without modifying the original | Logging, caching, retry logic |
| **Observer/Listener** | Add new reactions to events without changing the emitter | Notifications, audit trails, analytics |
| **Chain of Responsibility** | Add new handlers without modifying the chain manager | Validation, filtering, request processing |

### OCP in Event-Driven Systems

Event-driven architecture is OCP at the system level:

```
Order Service          →  publishes OrderCreatedEvent
                           ↓
Email Service          →  listens and sends confirmation     (existing)
Inventory Service      →  listens and reserves stock         (existing)
Analytics Service      →  listens and tracks conversion      (NEW — zero changes above!)
Fraud Detection Service →  listens and flags suspicious orders (NEW — zero changes above!)
```

Adding a new consumer is pure extension — no modification to the publisher or existing consumers.

### Compile-Time vs Runtime Extension

| Type | Mechanism | Example |
|---|---|---|
| **Compile-time** | Generics, abstract classes, sealed interfaces | `Comparable<T>`, template method |
| **Runtime** | Dependency injection, plugin loading, service discovery | Spring beans, SPI, OSGi |

Most enterprise applications use **runtime extension** via dependency injection (Spring) or configuration — this gives maximum flexibility without recompilation.

### OCP and Plugin Architecture

Frameworks like VS Code, IntelliJ, and WordPress are built entirely around OCP:

```
Core Application (closed for modification)
    ├── Plugin Interface (the extension point)
    ├── Plugin A (community-built)
    ├── Plugin B (community-built)
    └── Plugin C (your custom plugin — no core changes needed!)
```

In Java, this maps to the **Service Provider Interface (SPI)** mechanism or Spring's auto-discovered `@Component` beans.

---

## ⚖️ Trade-offs & When NOT to Apply

### When a Simple Switch Is Better

Not every `if/else` needs to become a strategy pattern:

```java
// This is FINE — it's stable, simple, and rarely changes
public String formatCurrency(double amount, String currency) {
    return switch (currency) {
        case "USD" -> "$" + amount;
        case "EUR" -> "€" + amount;
        case "GBP" -> "£" + amount;
        default -> currency + " " + amount;
    };
}
```

**Apply OCP when:**
- The branching logic grows frequently (new types added often)
- Different teams own different branches
- Each branch has complex, independent logic
- You need to add new variants without redeploying existing code

**Keep it simple when:**
- The set of options is small and stable (enum of 3–5 values)
- The logic per branch is a single line
- The code rarely changes
- You're building a prototype

### Premature Abstraction

The biggest risk of OCP is **creating extension points where no extension is needed**. This adds complexity for zero benefit:

```java
// Over-engineered — this enum has 3 values and hasn't changed in 2 years
public interface GenderFormatter {
    String format(Gender gender);
}
public class MaleFormatter implements GenderFormatter { /* ... */ }
public class FemaleFormatter implements GenderFormatter { /* ... */ }
public class OtherFormatter implements GenderFormatter { /* ... */ }

// Just use a switch — it's simpler and more readable
```

**Rule of thumb:** Wait until you see the **second variation** before abstracting. "Three strikes and you refactor."

---

## 🧪 Testing Implications

### Isolated Strategy Testing

With OCP, each implementation is tested independently:

```java
// Each strategy gets its own focused test class
class RegularDiscountTest {
    @Test
    void shouldApplyFivePercentDiscount() {
        var discount = new RegularDiscount();
        assertEquals(5.0, discount.calculate(100.0));
    }
}

class VIPDiscountTest {
    @Test
    void shouldApplyTwentyPercentDiscount() {
        var discount = new VIPDiscount();
        assertEquals(20.0, discount.calculate(100.0));
    }
}

// Adding StudentDiscount? Just add StudentDiscountTest.
// No existing tests touched!
```

### Contract Tests for New Implementations

When new implementations are added, contract tests ensure they honor the interface:

```java
// Shared contract test — every DiscountStrategy must pass these
abstract class DiscountStrategyContractTest {

    abstract DiscountStrategy createStrategy();

    @Test
    void shouldReturnNonNegativeDiscount() {
        assertThat(createStrategy().calculate(100.0)).isGreaterThanOrEqualTo(0);
    }

    @Test
    void shouldReturnZeroForZeroPrice() {
        assertEquals(0, createStrategy().calculate(0));
    }

    @Test
    void shouldNotExceedOriginalPrice() {
        double price = 100.0;
        assertThat(createStrategy().calculate(price)).isLessThanOrEqualTo(price);
    }
}

// Each implementation extends the contract test
class RegularDiscountContractTest extends DiscountStrategyContractTest {
    @Override
    DiscountStrategy createStrategy() { return new RegularDiscount(); }
}
```

### The Testing Pyramid with OCP

```
         /  E2E Tests  \          ← Few: test full workflows
        / Integration    \        ← Some: test strategy wiring
       / Unit Tests (each  \      ← Many: test each strategy independently
      /  strategy in isolation)  \
```

---

## 🔗 Relationship to Other SOLID Principles

| Principle | How It Connects to OCP |
|---|---|
| **Single Responsibility (SRP)** | SRP creates focused classes that are easier to extend without modification — each class has one clear extension point |
| **Liskov Substitution (LSP)** | OCP relies on substitution: new implementations must honor the interface contract or OCP breaks at runtime |
| **Interface Segregation (ISP)** | Narrow interfaces make OCP easier — extending a focused interface is simpler than extending a fat one |
| **Dependency Inversion (DIP)** | DIP is the **mechanism** that enables OCP — by depending on abstractions, you can inject new implementations |

**OCP and DIP are a power couple.** DIP gives you the interface to depend on; OCP gives you the confidence that adding new implementations won't break existing code. Together, they enable the Strategy pattern and most plugin architectures.

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
