---
id: liskov-substitution
title: Liskov Substitution Principle
sidebar_position: 3
description: If class `B` extends class `A`, then anywhere you use `A`, you should
  be able to swap in `B` without anything breaking.
tags:
- technical-knowledge
- solid
- liskov-substitution
---
import SolidPrinciplesDiagram from '@site/src/components/SolidPrinciplesDiagram';

# L — Liskov Substitution Principle

> **"Objects of a subclass should be replaceable with objects of the superclass without breaking the application."**
> — Barbara Liskov, 1987

<SolidPrinciplesDiagram initialPrinciple="LSP" />

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

## 🎯 Why Should I Care?

Here's a real scenario that happens more often than you think:

A team builds a file storage system with a `FileStorage` abstraction. Everything works perfectly with `LocalFileStorage` in development. In production, they swap in `S3FileStorage`. Deployment goes smoothly — until 3 AM when the on-call engineer gets paged:

```
java.lang.UnsupportedOperationException: S3 does not support atomic rename
    at com.app.storage.S3FileStorage.rename(S3FileStorage.java:47)
    at com.app.service.DocumentService.updateDocument(DocumentService.java:112)
```

The `S3FileStorage` subclass threw an exception that `LocalFileStorage` never did. The calling code assumed all `FileStorage` implementations support `rename()`. **The substitution broke the application.**

**This is the cost of violating LSP:**
- 💥 **Runtime failures** — code that works with one implementation silently breaks with another
- 🎰 **Environment-specific bugs** — passes in dev, crashes in production
- 🔍 **Defensive programming** — callers litter code with `instanceof` checks and try-catch blocks "just in case"
- 🧩 **Broken polymorphism** — the entire point of using abstractions is lost if you can't trust substitution

LSP ensures that **polymorphism actually works** — that you can trust your abstractions.

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

## 🔍 How to Spot Violations

### Code Smells Checklist

| Smell | What It Means |
|---|---|
| **`throw new UnsupportedOperationException()`** | The subclass can't fulfill the parent contract |
| **Empty method overrides** | The subclass silently does nothing where the parent did something |
| **`instanceof` checks before calling methods** | Callers don't trust the abstraction and check concrete types |
| **Subclass strengthens preconditions** | The child rejects inputs the parent accepted |
| **Subclass weakens postconditions** | The child returns results the parent guaranteed against |
| **Surprising behavior changes** | Same method call, radically different outcome |
| **"Works in dev, crashes in prod"** | Different implementations substituted by environment |

### The Substitution Test

Ask yourself: *"If I swap this subclass for its parent in every place the parent is used, does everything still work correctly?"*

If the answer is **no** — you have an LSP violation.

```java
// Quick mental test
void processPayment(PaymentProcessor processor) {
    processor.charge(100.0);   // Will this ALWAYS work for every subclass?
    processor.refund(50.0);    // Or will some subclass throw/fail here?
}
```

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

## 🏢 Real-World Use Cases

### 1. Caching Layer Substitution

A team builds a caching abstraction:

```java
public interface Cache<K, V> {
    void put(K key, V value);
    V get(K key);
    void evict(K key);
    Map<K, V> getAll(); // Returns all cached entries
}
```

`InMemoryCache` implements everything perfectly. Later, they introduce `RedisCache` for distributed caching. But `RedisCache.getAll()` is extremely expensive with millions of keys — it times out in production.

**The LSP fix:** The `getAll()` method should never have been part of the core `Cache` contract. Split it:

```java
public interface Cache<K, V> {
    void put(K key, V value);
    V get(K key);
    void evict(K key);
}

public interface BrowsableCache<K, V> extends Cache<K, V> {
    Map<K, V> getAll();
}
```

Only code that genuinely needs `getAll()` depends on `BrowsableCache`. The core `Cache` is safe for any implementation.

### 2. Authentication Providers

An application supports multiple auth methods:

```java
public abstract class AuthProvider {
    public abstract User authenticate(String credentials);
    public abstract void changePassword(String userId, String newPassword);
}
```

`PasswordAuthProvider` handles both operations. But `OAuthProvider` (Google/GitHub login) doesn't manage passwords — users change passwords on the OAuth provider's site.

**The LSP fix:** Don't force `OAuthProvider` to implement `changePassword()`. Separate the capabilities into distinct interfaces.

### 3. Database Repository Abstractions

A `Repository<T>` interface promises `save()`, `findById()`, `findAll()`, and `delete()`. A read-only replica implementation can't support `save()` or `delete()`. If the replica is substituted for the primary, writes silently fail.

**The LSP fix:** Separate `ReadRepository<T>` from `WriteRepository<T>`. Read-only services depend only on `ReadRepository<T>`.

---

## 🏗️ Architecture-Level Deep Dive

### The Formal Definition: Contracts

Barbara Liskov's original definition is more precise than "subtypes should be substitutable." It involves three contract elements:

#### 1. Preconditions (What the method requires)
A subclass **must not strengthen preconditions** — it should accept at least everything the parent accepts.

```java
// Parent accepts any positive amount
class PaymentProcessor {
    void charge(double amount) {  // precondition: amount > 0
        // ...
    }
}

// ❌ Subclass strengthens the precondition
class PremiumProcessor extends PaymentProcessor {
    @Override
    void charge(double amount) {
        if (amount < 100) throw new IllegalArgumentException("Minimum $100");
        // Callers sending $50 worked with the parent but break with this subclass!
    }
}
```

#### 2. Postconditions (What the method guarantees)
A subclass **must not weaken postconditions** — it should guarantee at least what the parent guarantees.

```java
// Parent guarantees a non-null result
class UserRepository {
    User findById(Long id) {  // postcondition: returns User or throws NotFoundException
        // ...
    }
}

// ❌ Subclass weakens the postcondition
class CachedUserRepository extends UserRepository {
    @Override
    User findById(Long id) {
        return cache.get(id);  // might return null! Callers don't expect null.
    }
}
```

#### 3. Invariants (What must always be true)
A subclass **must preserve class invariants** — properties that are always true.

```java
// Invariant: balance is always >= 0
class BankAccount {
    protected double balance;

    void withdraw(double amount) {
        if (amount > balance) throw new InsufficientFundsException();
        balance -= amount;
    }
}

// ❌ Subclass breaks the invariant
class OverdraftAccount extends BankAccount {
    @Override
    void withdraw(double amount) {
        balance -= amount;  // allows negative balance! Invariant broken.
    }
}
```

### Covariance and Contravariance

In Java, LSP manifests in type relationships:

| Concept | Meaning | Example |
|---|---|---|
| **Covariant return** | Subclass can return a more specific type | `Object clone()` → `MyClass clone()` ✅ |
| **Contravariant parameters** | Subclass should accept equal or broader input types | Less common in Java due to overloading rules |
| **Invariant generics** | `List<Dog>` is NOT a `List<Animal>` | Prevents type-unsafe substitution at compile time |

```java
// Covariant return is LSP-safe in Java
class AnimalShelter {
    Animal adopt() { return new Animal(); }
}

class DogShelter extends AnimalShelter {
    @Override
    Dog adopt() { return new Dog(); }  // ✅ More specific return is safe
}
```

### Design-by-Contract (DbC)

LSP is the theoretical foundation of **Design-by-Contract**, popularized by Bertrand Meyer in Eiffel:

```
Method Contract = Preconditions + Postconditions + Invariants

Subclass Rule:
  - Preconditions: same or weaker (accept more)
  - Postconditions: same or stronger (guarantee more)
  - Invariants: always preserved
```

In Java, you can approximate DbC with:
- **Assertions** for internal invariants
- **Guava's `Preconditions`** for input validation
- **`@NonNull` / `@Nullable`** annotations for null contracts
- **Bean Validation (`@Valid`)** for declarative constraints

### Sealed Classes (Java 17+)

Java 17's `sealed` classes help enforce LSP by **controlling which classes can extend a type**:

```java
// Only these three can implement Shape — no rogue subclasses
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

public record Circle(double radius) implements Shape {
    public double area() { return Math.PI * radius * radius; }
}

public record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
}

public record Triangle(double base, double height) implements Shape {
    public double area() { return 0.5 * base * height; }
}
```

Sealed types + records give you:
- **Compile-time safety** — no unexpected subtypes
- **Exhaustive pattern matching** — the compiler checks all cases
- **Immutability** — records can't break invariants via mutation

---

## ⚖️ Trade-offs & When NOT to Apply

### When Inheritance Is Genuinely Useful

LSP violations are often caused by **forced inheritance**. But inheritance isn't always wrong:

| Use Inheritance When | Use Composition/Interfaces When |
|---|---|
| True "is-a" relationship exists | "Has-a" or "can-do" relationship |
| Subclass genuinely extends ALL parent behavior | Subclass only needs SOME parent behavior |
| The type hierarchy is stable and well-understood | The hierarchy might grow unpredictably |
| You want to reuse implementation (template method) | You want to mix capabilities flexibly |

### The "Circle-Ellipse" Problem

Some real-world concepts that seem like inheritance are actually not:

| Seems Like Inheritance | Actually Not |
|---|---|
| Square → Rectangle | Square constrains Rectangle's behavior |
| Penguin → Bird (fly?) | Penguins can't fly |
| Stack → List | Stack restricts List's operations |
| ReadOnlyList → List | ReadOnlyList removes mutability |

**The rule:** If the subclass needs to **remove, restrict, or fundamentally alter** parent behavior, inheritance is the wrong tool.

### Pragmatic Approach

In practice, minor LSP tensions can be acceptable:

```java
// Technically an LSP violation, but pragmatic in a small codebase
public class ReadOnlyRepository extends Repository {
    @Override
    public void save(Entity entity) {
        throw new UnsupportedOperationException("Read-only");
    }
}
```

This is a **code smell**, not a cardinal sin. If the codebase is small and the violation is well-documented, it might not be worth a full refactor. But in a large system with many developers, fix it properly — the cost of confusion compounds.

---

## 🧪 Testing Implications

### Contract Tests: The LSP Safety Net

The most powerful technique for enforcing LSP is **contract testing** — writing a shared test suite that ALL implementations must pass:

```java
// Abstract contract test — every Cache implementation must pass these
abstract class CacheContractTest<K, V> {

    abstract Cache<K, V> createCache();

    @Test
    void shouldReturnStoredValue() {
        Cache<String, String> cache = createCache();
        cache.put("key", "value");
        assertEquals("value", cache.get("key"));
    }

    @Test
    void shouldReturnNullForMissingKey() {
        Cache<String, String> cache = createCache();
        assertNull(cache.get("nonexistent"));
    }

    @Test
    void shouldEvictStoredValue() {
        Cache<String, String> cache = createCache();
        cache.put("key", "value");
        cache.evict("key");
        assertNull(cache.get("key"));
    }

    @Test
    void shouldOverwriteExistingValue() {
        Cache<String, String> cache = createCache();
        cache.put("key", "v1");
        cache.put("key", "v2");
        assertEquals("v2", cache.get("key"));
    }
}

// Every implementation inherits all contract tests
class InMemoryCacheTest extends CacheContractTest<String, String> {
    @Override Cache<String, String> createCache() { return new InMemoryCache<>(); }
}

class RedisCacheTest extends CacheContractTest<String, String> {
    @Override Cache<String, String> createCache() { return new RedisCache<>(testConfig); }
}
```

If `RedisCache` violates any contract, the shared test catches it **before production**.

### Parameterized Tests for Substitution

JUnit 5's `@ParameterizedTest` is another approach:

```java
@ParameterizedTest
@MethodSource("allPaymentProcessors")
void shouldProcessPaymentWithoutException(PaymentProcessor processor) {
    assertDoesNotThrow(() -> processor.processPayment(100.0));
}

static Stream<PaymentProcessor> allPaymentProcessors() {
    return Stream.of(
        new CreditCardProcessor(),
        new PayPalProcessor(),
        new GiftCardProcessor()
    );
}
```

### Property-Based Testing

For deeper LSP validation, use property-based testing (e.g., with jqwik):

```java
@Property
void rectangleAreaIsAlwaysWidthTimesHeight(
    @ForAll @IntRange(min = 1, max = 1000) int w,
    @ForAll @IntRange(min = 1, max = 1000) int h
) {
    Shape rect = new Rectangle(w, h);
    assertEquals(w * h, rect.getArea());
}
```

---

## 🔗 Relationship to Other SOLID Principles

| Principle | How It Connects to LSP |
|---|---|
| **Single Responsibility (SRP)** | Classes with one responsibility are simpler to subclass correctly — fewer behaviors to honor |
| **Open/Closed (OCP)** | OCP relies on LSP — you extend by adding new implementations, but they must be valid substitutions |
| **Interface Segregation (ISP)** | ISP prevents LSP violations — narrow interfaces mean subclasses only commit to behaviors they can fulfill |
| **Dependency Inversion (DIP)** | DIP makes you depend on abstractions, but LSP ensures those abstractions are trustworthy |

**LSP is the gatekeeper of polymorphism.** Without LSP, OCP's "add new implementations" strategy falls apart — new implementations that break existing behavior are worse than no abstraction at all.

**LSP + ISP is the most powerful pairing.** When ISP gives you narrow interfaces and LSP ensures every implementation honors those interfaces, you get truly reliable polymorphism.

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

---

## Interview Questions

### Q: How do you verify LSP in code reviews?
**A:** Check whether subclass preconditions are stricter, postconditions are weaker, or invariants are broken compared with the base contract.

### Q: Why is UnsupportedOperationException in overrides usually a red flag?
**A:** It indicates the subtype cannot honor the parent contract, which means inheritance hierarchy is incorrect.

### Q: How does LSP affect API compatibility?
**A:** Consumers rely on contract behavior, not concrete type. Breaking substitutability causes hidden runtime failures in downstream services.

### Q: What test strategy helps catch LSP violations early?
**A:** Contract tests run against all implementations of an interface/base type to ensure behavior remains consistent.

### Q: How can LSP violations appear in exception handling?
**A:** Subclasses throwing broader/unexpected exceptions violate caller assumptions and break established error-handling paths.

### Q: In Spring, where is LSP especially important?
**A:** In strategy beans and repository/service interfaces where runtime wiring may substitute implementations by profile or configuration.

### Q: When should composition replace inheritance for LSP safety?
**A:** When behavior differs substantially and cannot preserve the original type contract without hacks.

### Q: How do LSP and OCP work together?
**A:** OCP enables extension by substitution, and LSP ensures those substitutions are behaviorally safe.
