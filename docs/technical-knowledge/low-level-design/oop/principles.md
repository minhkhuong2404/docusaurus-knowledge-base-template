---
id: principles
title: Design Principles (SOLID + More)
sidebar_label: Design Principles
---

# Design Principles

> Principles are **heuristics**, not laws. Know them deeply enough to know when to break them — and be able to explain why.

---

## SOLID Principles

SOLID is an acronym for five principles that make object-oriented designs more maintainable, flexible, and testable.

---

### S — Single Responsibility Principle (SRP)

> **A class should have only one reason to change.**

"Reason to change" = stakeholder/actor whose requirements drive that change.

```java
// ❌ Violates SRP: three different reasons to change
public class Employee {
    public double calculatePay() { /* Finance team owns this */ }
    public String generateReport() { /* HR team owns this */ }
    public void saveToDatabase() { /* DBA owns this */ }
}

// ✅ Three separate classes, each with one responsibility
public class PayrollCalculator {
    public double calculatePay(Employee employee) {
        return employee.getHoursWorked() * employee.getHourlyRate();
    }
}

public class EmployeeReporter {
    public String generateReport(Employee employee) {
        return String.format("Employee: %s, Dept: %s", employee.getName(), employee.getDept());
    }
}

public class EmployeeRepository {
    private final DataSource dataSource;
    public void save(Employee employee) { /* JDBC logic */ }
    public Optional<Employee> findById(long id) { /* JDBC logic */ }
}
```

:::tip Interview Tip 🎯
SRP is the first thing interviewers look for. If they see you put `calculatePrice()`, `sendEmail()`, and `saveToDb()` in one class, it's an immediate red flag. Split responsibilities early.
:::

---

### O — Open/Closed Principle (OCP)

> **Open for extension, closed for modification.**

Add new behavior by adding new code — not by changing existing, tested code.

```java
// ❌ Every new discount type requires modifying this class
public class PriceCalculator {
    public double calculate(Order order, String discountType) {
        double price = order.getBasePrice();
        if ("SEASONAL".equals(discountType)) {
            price *= 0.9;
        } else if ("LOYALTY".equals(discountType)) {
            price *= 0.85;
        } else if ("EMPLOYEE".equals(discountType)) {  // new requirement → modify class
            price *= 0.7;
        }
        return price;
    }
}

// ✅ Add new discount types without touching PriceCalculator
@FunctionalInterface
public interface DiscountStrategy {
    double apply(double basePrice);
}

public enum Discounts implements DiscountStrategy {
    SEASONAL  (p -> p * 0.90),
    LOYALTY   (p -> p * 0.85),
    EMPLOYEE  (p -> p * 0.70),  // new — no existing code modified
    VIP       (p -> p * 0.60);  // new — no existing code modified

    private final DiscountStrategy strategy;
    Discounts(DiscountStrategy s) { this.strategy = s; }

    @Override
    public double apply(double basePrice) { return strategy.apply(basePrice); }
}

public class PriceCalculator {
    public double calculate(Order order, DiscountStrategy discount) {
        return discount.apply(order.getBasePrice());  // closed for modification
    }
}
```

:::note[Senior Deep Dive 🔴]
OCP doesn't mean *never* modify existing code. It means that for a given *axis of variation* (e.g., discount types), you should be able to add new variants without touching the core logic. Identify the axes of variation in your design and apply OCP there.
:::

---

### L — Liskov Substitution Principle (LSP)

> **Subtypes must be substitutable for their base types without breaking the program.**

If `S` extends `T`, then anywhere a `T` is used, an `S` must work correctly — with the same pre/postconditions.

```java
// ❌ Classic LSP violation: ReadOnlyList "is-a" List? Behaviorally no.
public class ReadOnlyList<E> extends ArrayList<E> {
    @Override
    public boolean add(E e) {
        throw new UnsupportedOperationException("Read-only!"); // breaks caller expectations
    }
}

// Code that works with List breaks with ReadOnlyList:
void addItem(List<String> list) {
    list.add("hello"); // throws if ReadOnlyList is passed — LSP violation!
}
```

```java
// ✅ Model the hierarchy correctly
public interface ReadableList<E> {
    E get(int index);
    int size();
    boolean contains(Object o);
}

public interface MutableList<E> extends ReadableList<E> {
    boolean add(E e);
    E remove(int index);
}

// Now ReadOnlyList implements ReadableList — callers can't call add() on it
public class ReadOnlyList<E> implements ReadableList<E> { ... }
public class StandardList<E> implements MutableList<E> { ... }
```

**LSP Rules for subclasses:**
- Don't strengthen preconditions (don't demand more from callers)
- Don't weaken postconditions (don't deliver less to callers)
- Don't throw new checked exceptions not declared in the parent

---

### I — Interface Segregation Principle (ISP)

> **Clients should not be forced to depend on interfaces they don't use.**

Fat interfaces create tight coupling — split them by client need.

```java
// ❌ One fat interface forces implementors to implement irrelevant methods
public interface Animal {
    void eat();
    void sleep();
    void fly();    // Dogs have to implement this?!
    void swim();   // Eagles have to implement this?!
    void run();
}

public class Dog implements Animal {
    @Override public void eat() { System.out.println("Nom nom"); }
    @Override public void sleep() { System.out.println("Zzz"); }
    @Override public void fly() { throw new UnsupportedOperationException(); }  // 🤢
    @Override public void swim() { System.out.println("Splashing"); }
    @Override public void run() { System.out.println("Running"); }
}
```

```java
// ✅ Segregated interfaces — implement only what makes sense
public interface Eatable  { void eat(); }
public interface Sleepable { void sleep(); }
public interface Flyable  { void fly(); }
public interface Swimmable { void swim(); }
public interface Runnable { void run(); }

public class Dog implements Eatable, Sleepable, Swimmable, Runnable {
    @Override public void eat()   { System.out.println("Nom nom"); }
    @Override public void sleep() { System.out.println("Zzz"); }
    @Override public void swim()  { System.out.println("Splashing"); }
    @Override public void run()   { System.out.println("Running"); }
    // No fly() — doesn't need it!
}

public class Eagle implements Eatable, Sleepable, Flyable {
    @Override public void eat()   { System.out.println("Hunting"); }
    @Override public void sleep() { System.out.println("Zzz"); }
    @Override public void fly()   { System.out.println("Soaring"); }
}
```

:::tip Interview Tip 🎯
When designing interfaces in an LLD interview, ask yourself: *"Is there a client that would use every method in this interface?"* If not, it's a candidate for splitting.
:::

---

### D — Dependency Inversion Principle (DIP)

> **Depend on abstractions, not concretions. High-level modules should not depend on low-level modules.**

```java
// ❌ High-level OrderService depends on low-level MySQLOrderRepository
public class OrderService {
    private MySQLOrderRepository repository = new MySQLOrderRepository(); // concrete!
    private SmtpEmailSender emailSender = new SmtpEmailSender();           // concrete!

    public void placeOrder(Order order) {
        repository.save(order);
        emailSender.send(order.getCustomer().getEmail(), "Order confirmed!");
    }
}
// Now switching from MySQL to PostgreSQL requires changing OrderService!
```

```java
// ✅ OrderService depends on abstractions — injected via constructor
public interface OrderRepository {
    void save(Order order);
    Optional<Order> findById(String id);
}

public interface EmailSender {
    void send(String to, String subject, String body);
}

public class OrderService {
    private final OrderRepository repository;  // abstraction
    private final EmailSender emailSender;     // abstraction

    // Dependencies are INJECTED — OrderService doesn't create them
    public OrderService(OrderRepository repository, EmailSender emailSender) {
        this.repository = repository;
        this.emailSender = emailSender;
    }

    public void placeOrder(Order order) {
        repository.save(order);
        emailSender.send(order.getCustomerEmail(), "Order Confirmed", buildBody(order));
    }
}

// Wiring (in your main / DI container):
OrderRepository repo     = new PostgreSQLOrderRepository(dataSource);
EmailSender    mailer   = new SmtpEmailSender(smtpConfig);
OrderService   service  = new OrderService(repo, mailer);
// Swap PostgreSQL for Mongo? Change one line here, OrderService unchanged.
```

:::note[Senior Deep Dive 🔴]
DIP is why **dependency injection** frameworks (Spring, Guice) exist. In an interview without a framework, demonstrate DIP manually through constructor injection. Avoid `new` inside business logic classes — say: *"I'd inject this dependency through the constructor to keep this class testable and decoupled."*
:::

---

## Additional Principles

### DRY — Don't Repeat Yourself

Every piece of knowledge should have a **single, authoritative representation**.

```java
// ❌ DRY violation: magic number 0.08 repeated everywhere
double tax1 = price1 * 0.08;
double tax2 = price2 * 0.08;
double tax3 = price3 * 0.08;

// ✅ Single source of truth
public class TaxCalculator {
    private static final double TAX_RATE = 0.08; // one place to change

    public double calculate(double price) {
        return price * TAX_RATE;
    }
}
```

### KISS — Keep It Simple, Stupid

The simplest solution that works is usually the best. Don't over-engineer.

```java
// ❌ Over-engineered for a simple task
public class StringReverser {
    private final StringReversingAlgorithmFactory factory;
    private final StringReversingStrategy strategy;
    // ... 50 lines of code

    public String reverse(String s) {
        return strategy.reverse(s);
    }
}

// ✅ KISS
public String reverse(String s) {
    return new StringBuilder(s).reverse().toString();
}
```

### YAGNI — You Aren't Gonna Need It

Don't implement features until they're actually needed.

:::tip Interview Tip 🎯
When an interviewer asks "what if we need to support X in the future?", a great answer is: *"I'd design the interface so it's easy to add X without breaking existing code, but I wouldn't implement X now since it's not in the current requirements. This keeps our codebase lean and the design focused."*
:::

---

## SOLID Quick Reference

| Principle | Violation Signal | Fix |
|-----------|-----------------|-----|
| **SRP** | Class has multiple `import` groups from different domains | Extract classes by actor/responsibility |
| **OCP** | `if/switch` on type tag that grows over time | Replace with polymorphism / Strategy pattern |
| **LSP** | `instanceof` checks, `UnsupportedOperationException` in overrides | Redesign the hierarchy; use composition |
| **ISP** | Implementing an interface with `throw new UnsupportedOperationException()` | Split the fat interface |
| **DIP** | `new ConcreteClass()` inside business logic | Constructor inject an interface |

**Next →** [Design Patterns Overview](../design-patterns/overview)
