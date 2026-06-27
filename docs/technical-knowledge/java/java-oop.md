---
title: Object-Oriented Programming in Java
description: Guide to object-oriented programming in Java, covering encapsulation, inheritance, polymorphism, abstraction, and SOLID principles.
tags: [java, oop, object-oriented-programming, solid]
---

# Object-Oriented Programming in Java

Object-Oriented Programming (OOP) is the foundation of Java. Everything in Java revolves around **objects** and **classes**, making it one of the most naturally OOP-friendly languages available.

---

## Core Concepts

### 1. Class & Object

A **class** is a blueprint. An **object** is an instance of that blueprint.

```java
public class Car {
    String brand;
    int year;

    public Car(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }

    public void drive() {
        System.out.println(brand + " is driving!");
    }
}

// Creating an object
Car myCar = new Car("Toyota", 2022);
myCar.drive(); // Toyota is driving!
```

**Key terminology:**

| Term | Meaning |
|---|---|
| **Class** | A template/blueprint defining fields and methods |
| **Object** | A concrete instance created from a class (`new Car(...)`) |
| **Field** | Data stored inside an object (also called instance variable or attribute) |
| **Method** | Behavior/action an object can perform |
| **Constructor** | Special method called when creating an object (`new`) |
| **`this`** | Reference to the current object instance |

---

## 2. Encapsulation

> **"Hide the data, expose the behavior."**

**Encapsulation** means bundling data (fields) and behavior (methods) together, while restricting direct access to internal state using access modifiers.

:::info[Key Idea]
Hide the data, expose the behavior.
:::

```java
public class BankAccount {
    private double balance; // hidden from outside

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
        }
    }
}
```

**Access Modifiers:**

| Modifier    | Same Class | Same Package | Subclass | Everywhere |
| ----------- | :--------: | :----------: | :------: | :--------: |
| `private`   |     ✅      |      ❌       |    ❌     |     ❌      |
| (default)   |     ✅      |      ✅       |    ❌     |     ❌      |
| `protected` |     ✅      |      ✅       |    ✅     |     ❌      |
| `public`    |     ✅      |      ✅       |    ✅     |     ✅      |

:::tip[Spring Tip]
Spring beans rely heavily on encapsulation. `@Service`, `@Repository`, and `@Component` classes expose only what's needed through public methods or interfaces.
:::

### 🎯 Why Encapsulation Matters

Without encapsulation, any code can modify an object's internal state directly — leading to unpredictable behavior:

```java
// ❌ No encapsulation — anyone can set invalid state
public class Order {
    public double totalPrice;
    public String status;
}

Order order = new Order();
order.totalPrice = -500;     // Negative price? Allowed!
order.status = "BANANA";     // Nonsense status? Allowed!
```

```java
// ✅ With encapsulation — business rules enforced internally
public class Order {
    private double totalPrice;
    private OrderStatus status;

    public void applyDiscount(double percent) {
        if (percent < 0 || percent > 100) {
            throw new IllegalArgumentException("Invalid discount");
        }
        this.totalPrice -= this.totalPrice * (percent / 100.0);
    }

    public void markAsShipped() {
        if (this.status != OrderStatus.PAID) {
            throw new IllegalStateException("Only paid orders can be shipped");
        }
        this.status = OrderStatus.SHIPPED;
    }
}
```

The object **protects its own invariants**. Callers can't put it in an invalid state.

### 🔍 How to Spot Encapsulation Violations

| Smell | What It Means |
|---|---|
| **Public fields** | Any code can set invalid values |
| **Getters that expose mutable internals** | `getList()` returning the actual `List` — callers can modify it directly |
| **Validation scattered across callers** | 5 different services all check `if (amount > 0)` before calling your class |
| **Setter for everything** | Auto-generated setters defeat the purpose of encapsulation |
| **Domain logic in services, not objects** | The "Anemic Domain Model" anti-pattern |

### 🏢 Real-World Use Case: Protecting Domain Invariants

In a banking application, the `Account` class must ensure:
- Balance never goes negative (for standard accounts)
- Transactions are logged
- Currency is consistent

```java
public class Account {
    private final String accountId;
    private final Currency currency;
    private BigDecimal balance;
    private final List<Transaction> transactions = new ArrayList<>();

    public Account(String accountId, Currency currency, BigDecimal initialBalance) {
        this.accountId = accountId;
        this.currency = currency;
        this.balance = initialBalance;
    }

    public void transfer(Account target, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }
        if (this.balance.compareTo(amount) < 0) {
            throw new InsufficientFundsException(accountId, amount);
        }
        if (!this.currency.equals(target.currency)) {
            throw new CurrencyMismatchException(this.currency, target.currency);
        }

        this.balance = this.balance.subtract(amount);
        target.balance = target.balance.add(amount);

        this.transactions.add(Transaction.debit(amount, target.accountId));
        target.transactions.add(Transaction.credit(amount, this.accountId));
    }

    // Defensive copy — don't expose the mutable list!
    public List<Transaction> getTransactions() {
        return Collections.unmodifiableList(transactions);
    }

    // No setter for balance — it can only change through business operations
}
```

**Key techniques:**
- `final` fields for immutable properties
- No setters — state changes only through **business methods** with validation
- Defensive copy via `Collections.unmodifiableList()` for mutable collections
- Invariants (positive balance, matching currency) enforced **inside** the class

### 🏗️ Architecture Deep Dive: Rich vs Anemic Domain Models

| Anemic Domain Model (anti-pattern) | Rich Domain Model (proper encapsulation) |
|---|---|
| Objects are just data holders (DTOs with getters/setters) | Objects contain both data **and** behavior |
| Business logic lives in service classes | Business logic lives in domain objects |
| Validation scattered everywhere | Validation centralized in the object |
| Easy to accidentally create invalid state | Object always in a valid state |

```java
// ❌ Anemic: Order is just a data bag
public class Order {
    private double total;
    private String status;
    // getters and setters for everything...
}

// Logic is in the service — not the object
public class OrderService {
    public void cancel(Order order) {
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("...");
        }
        order.setStatus("CANCELLED");
        order.setTotal(0);
    }
}
```

```java
// ✅ Rich: Order owns its behavior
public class Order {
    private BigDecimal total;
    private OrderStatus status;

    public void cancel() {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be cancelled");
        }
        this.status = OrderStatus.CANCELLED;
    }
    // No setters — state transitions through behavior methods only
}
```

### ⚖️ Trade-offs

| Over-encapsulation | Under-encapsulation |
|---|---|
| Too many tiny methods for simple data access | Public fields everywhere |
| Wrapper classes for primitive values with no business rules | Mutable internals exposed via getters |
| Forced builder pattern for 2-field objects | No validation — callers must check everything |

**Pragmatic guideline:** Encapsulate where there are **business rules to protect**. Simple DTOs, configuration objects, and value objects with no invariants can use public fields or records.

```java
// Records (Java 16+) are great for data without behavior
public record UserResponse(String name, String email, LocalDate joinDate) {}
// Immutable, transparent, no hidden state — no need for heavy encapsulation
```

---

## 3. Inheritance

> **"Reuse behavior by specialization — but think twice before you extend."**

**Inheritance** allows a class to acquire properties and methods from a parent class using the `extends` keyword.

```java
public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void makeSound() {
        System.out.println(name + " makes a sound.");
    }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name); // call parent constructor
    }

    @Override
    public void makeSound() {
        System.out.println(name + " barks!");
    }
}

Animal dog = new Dog("Rex");
dog.makeSound(); // Rex barks!
```

**Key rules:**
- Java supports **single inheritance** only (one parent class)
- Use `super` to access parent class members
- `@Override` annotation signals an intentional method override — always use it!

:::warning[Avoid deep inheritance chains (more than 2–3 levels). They make code harder to understand and maintain. Prefer **composition over inheritance** when possible.]
:::

### 🎯 Why Inheritance Matters (And When It Hurts)

Inheritance is the **most powerful but most dangerous** OOP tool. Used correctly, it eliminates duplication and enables polymorphism. Used incorrectly, it creates rigid, fragile hierarchies that are nearly impossible to refactor.

**When inheritance helps:**

```java
// Template Method pattern — shared algorithm, customizable steps
public abstract class DataImporter {
    // The overall algorithm is fixed
    public final void importData(String source) {
        String rawData = readData(source);
        List<Record> records = parseRecords(rawData);
        validate(records);
        saveAll(records);
    }

    protected abstract String readData(String source);    // subclass customizes
    protected abstract List<Record> parseRecords(String raw); // subclass customizes

    protected void validate(List<Record> records) {
        // shared validation — can be overridden if needed
        records.forEach(r -> {
            if (r.isEmpty()) throw new ValidationException("Empty record");
        });
    }

    private void saveAll(List<Record> records) {
        // shared behavior — NOT overridable
        repository.saveAll(records);
    }
}

public class CsvImporter extends DataImporter {
    @Override
    protected String readData(String source) { /* read CSV file */ }
    @Override
    protected List<Record> parseRecords(String raw) { /* parse CSV format */ }
}

public class JsonImporter extends DataImporter {
    @Override
    protected String readData(String source) { /* read JSON file */ }
    @Override
    protected List<Record> parseRecords(String raw) { /* parse JSON format */ }
}
```

**When inheritance hurts:**

```java
// ❌ The Fragile Base Class problem
public class InstrumentedHashSet<E> extends HashSet<E> {
    private int addCount = 0;

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c); // BUG: HashSet.addAll() calls add() internally!
        // addCount is now DOUBLE the actual additions!
    }
}
```

This is a famous example from *Effective Java*. The subclass breaks because it depends on the **internal implementation** of `HashSet`, not just its public contract.

### 🔍 How to Decide: Inheritance vs Composition

Ask these questions:

| Question | If Yes → | If No → |
|---|---|---|
| Is it a true **"is-a"** relationship? | Consider inheritance | Use composition |
| Does the subclass need **ALL** parent behavior? | Consider inheritance | Use composition |
| Will the hierarchy be **stable** (2–3 levels max)? | Consider inheritance | Use composition |
| Do you need to **swap behavior at runtime**? | Use composition | Consider either |
| Is the parent class from a **library you don't control**? | Use composition (wrap it) | Consider either |

```java
// ✅ Composition: flexible, runtime-swappable
public class NotificationService {
    private final MessageSender sender; // can be email, SMS, push — swappable

    public NotificationService(MessageSender sender) {
        this.sender = sender;
    }

    public void notifyUser(User user, String message) {
        sender.send(user.getContact(), message);
    }
}

// vs

// ❌ Inheritance: rigid, locked at compile time
public class EmailNotificationService extends NotificationService {
    // Can't easily switch to SMS at runtime
}
```

### 🏢 Real-World Use Case: Framework Extension Points

Most frameworks use inheritance for **controlled extension points** — places where you're meant to customize behavior:

```java
// Spring Security — extending a base class to customize authentication
public class CustomAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {

    @Override
    protected void additionalAuthenticationChecks(UserDetails userDetails,
            UsernamePasswordAuthenticationToken authentication) {
        // custom authentication logic (e.g., 2FA check)
    }

    @Override
    protected UserDetails retrieveUser(String username,
            UsernamePasswordAuthenticationToken authentication) {
        return userDetailsService.loadUserByUsername(username);
    }
}
```

```java
// JPA — extending a repository to add custom queries
public interface OrderRepository extends JpaRepository<Order, Long> {
    // JpaRepository provides findById, save, delete, etc.
    // You extend with custom methods:
    List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status);
}
```

**Key insight:** Framework inheritance is designed for it — the `abstract` methods are explicit extension points. Business domain inheritance is where things get dangerous.

### 🏗️ Architecture Deep Dive: Types of Inheritance

| Type | Mechanism | Example | Risk Level |
|---|---|---|---|
| **Implementation inheritance** | `extends` a class | `Dog extends Animal` | ⚠️ Medium — tight coupling to parent internals |
| **Interface inheritance** | `implements` an interface | `Dog implements Pet` | ✅ Low — only commits to a contract |
| **Mixin inheritance** | `default` methods in interfaces | `Comparable`, `Serializable` | ⚠️ Medium — diamond problem with multiple defaults |
| **Sealed inheritance** | `sealed class` (Java 17+) | `Shape permits Circle, Rectangle` | ✅ Low — controlled, exhaustive |

### Java 17+: Sealed Classes

Sealed classes give you **controlled inheritance** — you explicitly list who can extend:

```java
public sealed abstract class PaymentMethod
    permits CreditCard, BankTransfer, DigitalWallet {

    public abstract PaymentResult process(Money amount);
}

public final class CreditCard extends PaymentMethod {
    @Override
    public PaymentResult process(Money amount) { /* ... */ }
}

public final class BankTransfer extends PaymentMethod {
    @Override
    public PaymentResult process(Money amount) { /* ... */ }
}

public final class DigitalWallet extends PaymentMethod {
    @Override
    public PaymentResult process(Money amount) { /* ... */ }
}
```

**Benefits:**
- Compiler knows all subtypes → exhaustive `switch` (pattern matching)
- No rogue subclasses can appear unexpectedly
- Combines the power of inheritance with the safety of enums

```java
// Pattern matching with sealed classes (Java 21+)
public String describePayment(PaymentMethod method) {
    return switch (method) {
        case CreditCard cc   -> "Card ending in " + cc.lastFour();
        case BankTransfer bt -> "Transfer from " + bt.bankName();
        case DigitalWallet dw -> "Wallet: " + dw.provider();
        // No default needed — compiler knows all cases!
    };
}
```

### ⚖️ Trade-offs

| Too Much Inheritance | Too Little Inheritance |
|---|---|
| Deep hierarchies (5+ levels) nobody can follow | Duplicated code across similar classes |
| Fragile base class problem — parent changes break children | Missing polymorphism — switch statements everywhere |
| God class that everything extends | No shared contracts — each class is an island |
| "Yo-yo problem" — jumping up and down the hierarchy to understand behavior | Can't leverage framework extension points |

**The golden rule from Effective Java:** *"Favor composition over inheritance. If you must use inheritance, design and document for it — or else prohibit it (use `final`)."*

---

## 4. Polymorphism

> **"One interface, many implementations."**

**Polymorphism** means "many forms" — the same interface can behave differently depending on the actual object.

### Compile-time Polymorphism (Method Overloading)

Same method name, different parameter lists — resolved by the compiler:

```java
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public double add(double a, double b) { // same name, different params
        return a + b;
    }

    public int add(int a, int b, int c) { // different number of params
        return a + b + c;
    }
}
```

**Overloading rules:**
- Methods must differ in **parameter types or count**
- Return type alone is NOT enough to distinguish overloaded methods
- `add(int, int)` and `add(long, long)` are valid overloads

### Runtime Polymorphism (Method Overriding)

Same method signature, different behavior — resolved at runtime based on the actual object type:

```java
public class Shape {
    public double area() {
        return 0;
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    private double width, height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}

// Polymorphic behavior
List<Shape> shapes = List.of(new Circle(5), new Rectangle(4, 6));
shapes.forEach(s -> System.out.println(s.area()));
```

:::tip[Spring Tip]
Polymorphism powers Spring's dependency injection. You program to an **interface**, and Spring injects the correct implementation at runtime.
:::

### 🎯 Why Polymorphism Matters

Polymorphism is what makes OOP **powerful**, not just organized. Without it, you'd write code like this:

```java
// ❌ Without polymorphism — every new type requires modifying this code
public double calculateTotalArea(List<Object> shapes) {
    double total = 0;
    for (Object obj : shapes) {
        if (obj instanceof Circle c) {
            total += Math.PI * c.radius * c.radius;
        } else if (obj instanceof Rectangle r) {
            total += r.width * r.height;
        } else if (obj instanceof Triangle t) {
            total += 0.5 * t.base * t.height;
        }
        // Every new shape = add another branch here...
    }
    return total;
}
```

```java
// ✅ With polymorphism — adding a new shape requires ZERO changes here
public double calculateTotalArea(List<Shape> shapes) {
    return shapes.stream()
        .mapToDouble(Shape::area)
        .sum();
    // New shapes just implement area() — this code never changes!
}
```

### 🔍 The Dispatch Mechanism: How Java Does It

Understanding **how** polymorphism works internally helps you debug and optimize:

```java
Animal animal = new Dog("Rex");
animal.makeSound(); // Which method runs?
```

| Step | What Happens |
|---|---|
| **1. Compile time** | Compiler checks: does `Animal` have `makeSound()`? Yes → compiles |
| **2. Runtime** | JVM looks at the **actual object type** (Dog), not the reference type (Animal) |
| **3. Virtual method dispatch** | JVM finds `Dog.makeSound()` in the virtual method table (vtable) |
| **4. Execution** | `Dog.makeSound()` runs → "Rex barks!" |

**Key insight:** The **reference type** determines which methods you can **call** (compile time). The **object type** determines which implementation **runs** (runtime).

```java
Animal animal = new Dog("Rex");
animal.makeSound(); // ✅ Compiles — Animal has makeSound()
animal.fetch();     // ❌ Compile error — Animal doesn't have fetch()

Dog dog = new Dog("Rex");
dog.fetch();        // ✅ Compiles — Dog has fetch()
```

### 🏢 Real-World Use Cases

#### 1. Payment Processing with Strategy Pattern

```java
public interface PaymentProcessor {
    PaymentResult process(Order order);
    boolean supports(PaymentMethod method);
}

@Component
public class CreditCardProcessor implements PaymentProcessor {
    @Override
    public PaymentResult process(Order order) {
        // Stripe API call for credit cards
        return stripeClient.charge(order.getTotal(), order.getCardToken());
    }

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.CREDIT_CARD;
    }
}

@Component
public class PayPalProcessor implements PaymentProcessor {
    @Override
    public PaymentResult process(Order order) {
        // PayPal API call
        return paypalClient.executePayment(order.getPaypalOrderId());
    }

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.PAYPAL;
    }
}

// The orchestrator doesn't know or care about specific processors
@Service
public class PaymentService {
    private final List<PaymentProcessor> processors;

    public PaymentService(List<PaymentProcessor> processors) {
        this.processors = processors; // Spring injects ALL implementations
    }

    public PaymentResult pay(Order order) {
        return processors.stream()
            .filter(p -> p.supports(order.getPaymentMethod()))
            .findFirst()
            .orElseThrow(() -> new UnsupportedPaymentException(order.getPaymentMethod()))
            .process(order);
    }
}
```

Adding Apple Pay? Just create `ApplePayProcessor implements PaymentProcessor`. **Zero changes to `PaymentService`.**

#### 2. Event Handling System

```java
public interface EventHandler<T extends DomainEvent> {
    void handle(T event);
    Class<T> getEventType();
}

@Component
public class OrderCreatedHandler implements EventHandler<OrderCreatedEvent> {
    @Override
    public void handle(OrderCreatedEvent event) {
        // Send confirmation email, reserve inventory, etc.
    }

    @Override
    public Class<OrderCreatedEvent> getEventType() {
        return OrderCreatedEvent.class;
    }
}

@Component
public class PaymentFailedHandler implements EventHandler<PaymentFailedEvent> {
    @Override
    public void handle(PaymentFailedEvent event) {
        // Notify customer, retry payment, etc.
    }

    @Override
    public Class<PaymentFailedEvent> getEventType() {
        return PaymentFailedEvent.class;
    }
}
```

#### 3. Data Export Pipeline

```java
public interface DataExporter {
    byte[] export(ReportData data);
    String getContentType();
    String getFileExtension();
}

@Component public class PdfExporter implements DataExporter {
    public byte[] export(ReportData data) { /* generate PDF */ }
    public String getContentType() { return "application/pdf"; }
    public String getFileExtension() { return ".pdf"; }
}

@Component public class CsvExporter implements DataExporter {
    public byte[] export(ReportData data) { /* generate CSV */ }
    public String getContentType() { return "text/csv"; }
    public String getFileExtension() { return ".csv"; }
}

@Component public class ExcelExporter implements DataExporter {
    public byte[] export(ReportData data) { /* generate Excel */ }
    public String getContentType() { return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; }
    public String getFileExtension() { return ".xlsx"; }
}
```

### 🏗️ Architecture Deep Dive: Polymorphism Patterns

| Pattern | How It Uses Polymorphism | When to Use |
|---|---|---|
| **Strategy** | Swap algorithms at runtime | Payment processing, discount calculation, sorting |
| **Template Method** | Override specific steps in a fixed algorithm | Data import, report generation, lifecycle hooks |
| **Observer** | Notify multiple listeners through a common interface | Event handling, notifications, pub/sub |
| **Decorator** | Wrap objects to add behavior transparently | Logging, caching, retry, compression |
| **Command** | Encapsulate actions as objects | Undo/redo, task queues, macro recording |

### Polymorphism with Generics

Java generics add **type-safe polymorphism** without casting:

```java
// Without generics — unsafe, requires casting
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0); // runtime ClassCastException risk

// With generics — compile-time safety
List<String> list = new ArrayList<>();
list.add("hello");
String s = list.get(0); // no cast needed, type-safe
```

**Bounded type parameters** combine generics with polymorphism:

```java
// Only accepts types that are Comparable
public <T extends Comparable<T>> T findMax(List<T> items) {
    return items.stream()
        .max(Comparator.naturalOrder())
        .orElseThrow();
}

// Works with any Comparable type
findMax(List.of(3, 1, 4, 1, 5));           // Integer
findMax(List.of("apple", "banana", "cherry")); // String
findMax(List.of(LocalDate.now(), LocalDate.of(2020, 1, 1))); // LocalDate
```

### ⚖️ Trade-offs

| Too Much Polymorphism | Too Little Polymorphism |
|---|---|
| Simple operations wrapped in unnecessary interfaces | `if/else` chains that grow with every new type |
| "Astronaut architecture" — 5 layers of abstraction for a CRUD endpoint | `instanceof` checks scattered through the codebase |
| Hard to debug — "what implementation is actually running?" | Duplicated logic across similar types |
| Performance overhead from virtual dispatch (rare in practice) | Can't extend without modifying existing code |

**When to use a simple `switch` instead of polymorphism:**
- The set of types is small (3–5) and **stable**
- Each branch is a single line
- No team needs to add new types independently
- It's internal code, not a public API

```java
// This is FINE — 3 enum values, stable, one-liners
public String formatCurrency(Currency currency, double amount) {
    return switch (currency) {
        case USD -> "$%.2f".formatted(amount);
        case EUR -> "€%.2f".formatted(amount);
        case GBP -> "£%.2f".formatted(amount);
    };
}
```

### 🧪 Testing Implications

Polymorphism makes testing **easier** by enabling mock/fake substitution:

```java
// Test with a fake implementation — no real payment processing!
@Test
void shouldProcessOrder() {
    PaymentProcessor fakeProcessor = new PaymentProcessor() {
        @Override
        public PaymentResult process(Order order) {
            return PaymentResult.success(); // always succeeds in tests
        }

        @Override
        public boolean supports(PaymentMethod method) {
            return true; // supports everything in tests
        }
    };

    PaymentService service = new PaymentService(List.of(fakeProcessor));
    PaymentResult result = service.pay(testOrder);
    assertTrue(result.isSuccess());
}
```

---

## 5. Abstraction

> **"Show only what matters, hide the complexity."**

**Abstraction** hides implementation details and exposes only the essential features. Java achieves this through **abstract classes** and **interfaces**.

### Abstract Class

```java
public abstract class Vehicle {
    protected String model;

    public Vehicle(String model) {
        this.model = model;
    }

    public abstract void fuelUp(); // must be implemented by subclass

    public void startEngine() {    // shared behavior
        System.out.println(model + " engine started.");
    }
}

public class ElectricCar extends Vehicle {
    public ElectricCar(String model) {
        super(model);
    }

    @Override
    public void fuelUp() {
        System.out.println(model + " is charging...");
    }
}
```

### Interface

```java
public interface Payable {
    void processPayment(double amount); // implicitly public & abstract

    default void printReceipt() {       // default method (Java 8+)
        System.out.println("Payment processed.");
    }
}

public class CreditCardPayment implements Payable {
    @Override
    public void processPayment(double amount) {
        System.out.println("Charging $" + amount + " to credit card.");
    }
}
```

**Abstract Class vs Interface:**

| Feature              | Abstract Class      | Interface                     |
| -------------------- | ------------------- | ----------------------------- |
| Instantiation        | ❌ Cannot            | ❌ Cannot                      |
| Multiple inheritance | ❌ No                | ✅ Yes (`implements A, B`)     |
| Constructor          | ✅ Yes               | ❌ No                          |
| Fields               | Any type            | `public static final` only    |
| Methods              | Abstract + concrete | Abstract + `default`/`static` |

:::tip[Spring Tip]
Interfaces are everywhere in Spring. `JpaRepository`, `ApplicationContext`, `BeanFactory` — you always code to the interface, letting Spring provide the implementation.
:::

### 🎯 Why Abstraction Matters

Abstraction lets you work with **concepts** instead of **implementation details**. Consider sending a notification:

```java
// ❌ Without abstraction — caller must know EVERY detail
public class OrderService {
    public void notifyCustomer(Order order) {
        // Must know SMTP details
        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("user@gmail.com", "password");
            }
        });
        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress("noreply@shop.com"));
        message.setRecipients(Message.RecipientType.TO, order.getCustomerEmail());
        message.setSubject("Order Confirmation");
        message.setText("Your order #" + order.getId() + " is confirmed.");
        Transport.send(message);
    }
}
```

```java
// ✅ With abstraction — caller only knows "send notification"
public class OrderService {
    private final NotificationSender notifier;

    public void notifyCustomer(Order order) {
        notifier.send(
            order.getCustomerEmail(),
            "Order Confirmation",
            "Your order #" + order.getId() + " is confirmed."
        );
    }
}
```

The `OrderService` doesn't know or care about SMTP, Twilio, Firebase, or any implementation detail. It just says **"send a notification"** — that's abstraction.

### 🔍 When to Use Abstract Class vs Interface

| Use an Abstract Class When | Use an Interface When |
|---|---|
| You want to share **state** (fields) across subclasses | You want to define a **contract** without state |
| You have a **template method** pattern (fixed algorithm, customizable steps) | You need **multiple inheritance** of types |
| Subclasses share 60%+ of their behavior | Implementations are fundamentally different |
| You want to provide a **default constructor** or initialization logic | You want maximum flexibility and decoupling |
| The hierarchy is **stable and well-understood** | You're designing a **public API** |

**A common combined pattern:**

```java
// Interface defines the contract
public interface MessageSender {
    void send(String to, String subject, String body);
    boolean supports(String channel);
}

// Abstract class provides shared behavior for similar implementations
public abstract class AbstractEmailSender implements MessageSender {
    protected final EmailConfig config;

    protected AbstractEmailSender(EmailConfig config) {
        this.config = config;
    }

    @Override
    public boolean supports(String channel) {
        return "email".equals(channel);
    }

    // Template method — shared email structure, customizable sending
    @Override
    public final void send(String to, String subject, String body) {
        validateAddress(to);
        String formattedBody = formatBody(body);
        doSend(to, subject, formattedBody);
        logSent(to, subject);
    }

    protected abstract void doSend(String to, String subject, String body);

    protected String formatBody(String body) {
        return wrapInHtmlTemplate(body); // shared default
    }

    private void validateAddress(String to) { /* shared validation */ }
    private void logSent(String to, String subject) { /* shared logging */ }
}

// Concrete implementations only implement the unique part
public class SmtpEmailSender extends AbstractEmailSender {
    @Override
    protected void doSend(String to, String subject, String body) {
        // SMTP-specific sending logic
    }
}

public class SendGridEmailSender extends AbstractEmailSender {
    @Override
    protected void doSend(String to, String subject, String body) {
        // SendGrid API-specific logic
    }
}
```

### 🏢 Real-World Use Cases

#### 1. Repository Abstraction (Spring Data)

Spring Data is a masterclass in abstraction:

```java
// You write this:
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByActiveTrue();
}

// Spring generates the implementation at runtime!
// You never write SQL, manage connections, or handle ResultSets.
// That's abstraction — hiding ALL persistence complexity behind a simple interface.
```

What Spring abstracts away:
- Connection pool management
- SQL generation
- Transaction handling
- Result mapping
- Pagination

#### 2. Cloud Storage Abstraction

```java
public interface StorageService {
    String upload(String fileName, byte[] data);
    byte[] download(String fileId);
    void delete(String fileId);
    String getPublicUrl(String fileId);
}

@Component @Profile("aws")
public class S3StorageService implements StorageService {
    // 200 lines of AWS S3 SDK complexity hidden behind 4 simple methods
}

@Component @Profile("local")
public class LocalStorageService implements StorageService {
    // Simple file system operations for local development
}
```

#### 3. Caching Abstraction (Spring Cache)

```java
// Spring's @Cacheable is abstraction in action
@Service
public class ProductService {

    @Cacheable("products")  // Abstraction! Don't care if it's Redis, Caffeine, or Hazelcast
    public Product getProduct(Long id) {
        return repository.findById(id).orElseThrow();
    }
}
```

Behind `@Cacheable`, Spring abstracts away:
- Cache provider selection (Redis, Caffeine, EhCache)
- Cache key generation
- Serialization/deserialization
- TTL management
- Cache eviction policies

### 🏗️ Architecture Deep Dive: Levels of Abstraction

Abstraction operates at multiple scales:

```
Level 1 — Method Abstraction
    calculateTax(order)  // hides tax calculation details

Level 2 — Class Abstraction
    TaxCalculator         // hides which tax strategy is used

Level 3 — Interface Abstraction
    TaxService interface  // hides the entire tax subsystem

Level 4 — Module Abstraction
    tax-service module    // hides internal classes, exposes only API

Level 5 — Service Abstraction
    Tax Microservice      // hides technology stack, database, deployment
```

**Each level hides more complexity.** A well-architected system uses the right level of abstraction at each boundary.

### Abstraction and the Dependency Rule

In Clean Architecture, abstraction enforces the **Dependency Rule** — outer layers depend on inner layers through abstractions:

```
Controller → UseCase (interface) ← UseCaseImpl
                                        ↓
                              Repository (interface) ← JpaRepositoryImpl
```

Inner layers define the interfaces. Outer layers implement them. This is abstraction + DIP working together.

### Java's Evolution of Abstraction

| Java Version | Abstraction Feature | Impact |
|---|---|---|
| Java 1.0 | `abstract class`, `interface` | Basic abstraction tools |
| Java 8 | `default` methods in interfaces | Interfaces can evolve without breaking implementors |
| Java 8 | `static` methods in interfaces | Utility methods belong with the abstraction |
| Java 9 | `private` methods in interfaces | Share code between `default` methods |
| Java 14 | `record` classes | Transparent data carriers (abstraction of boilerplate) |
| Java 17 | `sealed` classes | Controlled abstraction — known set of implementations |
| Java 21 | Pattern matching | Work with abstractions more expressively |

### ⚖️ Trade-offs

| Over-Abstraction | Under-Abstraction |
|---|---|
| Too many interfaces with single implementations | Business logic coupled to specific libraries/frameworks |
| Can't trace code flow — too many layers of indirection | Changing one technology requires rewriting business code |
| "Lasagna code" — too many layers for simple operations | Can't swap implementations for testing |
| `Ctrl+Click` leads through 5 interfaces before reaching real code | Infrastructure details leak into domain logic |

**When to abstract:**
- You have (or expect) **multiple implementations**
- You need to **mock/fake** in tests
- The implementation involves an **external system** (DB, API, file system)
- You're building a **library or framework** for others

**When NOT to abstract:**
- The class is simple, stable, and has no variants
- It's a utility/helper with pure functions
- You're adding an interface just for the sake of having one (`UserService` → `UserServiceImpl`)
- YAGNI — "You Ain't Gonna Need It"

### 🧪 Testing Implications

Abstraction is the **key enabler** of testable code:

```java
// Without abstraction — can't test without a real database
public class OrderService {
    private final DataSource dataSource = new MySQLDataSource();

    public Order getOrder(Long id) {
        Connection conn = dataSource.getConnection();
        // ... SQL queries, result mapping, etc.
    }
}

// With abstraction — easily testable
public class OrderService {
    private final OrderRepository repository; // abstraction!

    @Test
    void shouldFindOrder() {
        // Use a simple in-memory fake — no database needed!
        OrderRepository fakeRepo = new InMemoryOrderRepository();
        fakeRepo.save(new Order(1L, "Test Order"));

        OrderService service = new OrderService(fakeRepo);
        Order result = service.getOrder(1L);

        assertEquals("Test Order", result.getName());
    }
}
```

| Without Abstraction | With Abstraction |
|---|---|
| Tests need real infrastructure (DB, Redis, S3) | Tests use in-memory fakes |
| Tests take seconds (I/O bound) | Tests take milliseconds |
| Tests are flaky (network issues, state leakage) | Tests are deterministic |
| Can't run tests offline or in CI easily | Tests run anywhere |

---

## 🔗 How the 4 Pillars Work Together

The four OOP pillars aren't isolated concepts — they **reinforce each other**:

```
Encapsulation
    ↓ protects internal state
Abstraction
    ↓ hides complexity behind interfaces
Inheritance / Composition
    ↓ enables code reuse and specialization
Polymorphism
    ↓ allows runtime flexibility and extensibility
```

**A real example showing all four:**

```java
// ABSTRACTION — defines the contract
public interface NotificationChannel {
    void send(Notification notification);
    boolean supports(NotificationType type);
}

// ENCAPSULATION — hides Twilio API details and configuration
public class SmsChannel implements NotificationChannel {
    private final TwilioClient client;        // private — encapsulated
    private final String fromNumber;           // private — encapsulated
    private final RateLimiter rateLimiter;     // private — encapsulated

    public SmsChannel(TwilioConfig config) {
        this.client = new TwilioClient(config.getAccountSid(), config.getAuthToken());
        this.fromNumber = config.getFromNumber();
        this.rateLimiter = new RateLimiter(config.getMaxPerMinute());
    }

    // POLYMORPHISM — same send() method, different behavior per channel
    @Override
    public void send(Notification notification) {
        rateLimiter.acquire();
        client.sendSms(fromNumber, notification.getRecipient(), notification.getMessage());
    }

    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.URGENT;
    }
}

// INHERITANCE — shared base behavior (optional, when useful)
public abstract class AbstractEmailChannel implements NotificationChannel {
    protected final EmailConfig config;

    protected AbstractEmailChannel(EmailConfig config) {
        this.config = config;
    }

    @Override
    public final void send(Notification notification) {
        String html = renderTemplate(notification);
        doSend(notification.getRecipient(), notification.getSubject(), html);
    }

    protected abstract void doSend(String to, String subject, String html);
    protected abstract String renderTemplate(Notification notification);
}

// POLYMORPHISM — the orchestrator doesn't care which channel handles it
@Service
public class NotificationService {
    private final List<NotificationChannel> channels;

    public void notify(Notification notification) {
        channels.stream()
            .filter(ch -> ch.supports(notification.getType()))
            .forEach(ch -> ch.send(notification));
    }
}
```

---

## SOLID Principles

These 5 principles guide writing clean, maintainable OOP code. Each principle is covered in depth in its own page.

| Principle                 | Description                                                | Deep Dive |
| ------------------------- | ---------------------------------------------------------- | --------- |
| **S**ingle Responsibility | A class should have only one reason to change              | [Read more →](../solid/single-responsibility) |
| **O**pen/Closed           | Open for extension, closed for modification                | [Read more →](../solid/open-closed) |
| **L**iskov Substitution   | Subclasses must be substitutable for their base class      | [Read more →](../solid/liskov-substitution) |
| **I**nterface Segregation | Prefer small, specific interfaces over large, general ones | [Read more →](../solid/interface-segregation) |
| **D**ependency Inversion  | Depend on abstractions, not concrete implementations       | [Read more →](../solid/dependency-inversion) |

```java
// ✅ Dependency Inversion in Spring
@Service
public class OrderService {
    private final PaymentGateway paymentGateway; // interface, not implementation

    public OrderService(PaymentGateway paymentGateway) { // injected by Spring
        this.paymentGateway = paymentGateway;
    }
}
```

:::note[Following SOLID principles naturally leads to better Spring application design — especially **Dependency Inversion**, which is the backbone of Spring's IoC container.]
:::

---

## Quick Reference

```
OOP in Java
├── Encapsulation  → private fields + public getters/setters + business methods
├── Inheritance    → extends (single), implements (multiple), sealed (Java 17+)
├── Polymorphism   → overloading (compile-time), overriding (runtime), generics
└── Abstraction    → abstract class, interface, default methods, records
```

---

## Further Reading

- [Java OOP Documentation (Oracle)](https://docs.oracle.com/javase/tutorial/java/concepts/)
- [Effective Java – Joshua Bloch](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Spring Framework & OOP Patterns](https://spring.io/guides)
- [Java Fundamentals: Core Language Concepts](./java-fundamentals.md)
- [Java Collections Framework: Deep Dive](./java-collections.md)
- [Java Interview Questions & Answers](./java-interview-questions.md)

---

## Interview Questions

### Encapsulation

### Q: How do you decide between a getter/setter and a business method?
**A:** Use getters for read access. Replace setters with business methods that enforce invariants — e.g., `withdraw(amount)` instead of `setBalance(newBalance)`.

### Q: What is a practical sign of poor encapsulation?
**A:** Business invariants are enforced in many callers instead of inside the domain object. If 5 services all check `if (amount > 0)` before calling your class, that validation belongs inside the class.

### Q: How do you handle encapsulation with mutable collections?
**A:** Return defensive copies (`Collections.unmodifiableList()`) or use immutable collection types. Never expose internal mutable state through getters.

### Inheritance

### Q: How do you decide between inheritance and composition in service design?
**A:** Prefer composition for runtime variability and lower coupling; use inheritance only for true semantic substitution (is-a relationships) where the subclass genuinely specializes ALL parent behavior.

### Q: What is the Fragile Base Class problem?
**A:** When a change to a parent class breaks subclasses because they depend on internal implementation details (like `HashSet.addAll()` internally calling `add()`). This is why *Effective Java* says: design for inheritance or prohibit it.

### Q: When would you use sealed classes over regular inheritance?
**A:** When you want a fixed, known set of subtypes — e.g., `PaymentMethod permits CreditCard, BankTransfer, DigitalWallet`. It enables exhaustive pattern matching and prevents rogue subclasses.

### Polymorphism

### Q: Why is polymorphism useful in payment or notification domains?
**A:** It lets teams add providers without modifying core orchestration logic. A new `ApplePayProcessor implements PaymentProcessor` just works — the `PaymentService` never changes.

### Q: What is the difference between overloading and overriding?
**A:** Overloading is compile-time polymorphism (same method name, different parameters). Overriding is runtime polymorphism (subclass provides a different implementation of a parent method). Overloading is resolved by the compiler; overriding is resolved by the JVM at runtime via the vtable.

### Q: How does Java resolve method calls on an interface reference?
**A:** The JVM uses the actual object's class at runtime (dynamic dispatch). The interface reference determines which methods can be *called* (compile-time check), but the object's class determines which implementation *runs*.

### Abstraction

### Q: When can abstraction harm maintainability?
**A:** When abstractions are introduced before real variation exists, increasing indirection with no payoff. The `UserService`/`UserServiceImpl` 1:1 pattern is a common symptom.

### Q: How do SOLID principles influence API stability?
**A:** They reduce ripple effects so extensions and internal refactors do not break consumers. Abstraction hides implementation changes; DIP ensures consumers depend on stable interfaces.

### Q: How would you refactor a god service using OOP principles?
**A:** Split responsibilities (SRP), extract domain behaviors into rich objects (encapsulation), introduce interfaces for dependencies (abstraction + DIP), and use polymorphism to eliminate type-switching code.
