---
id: singleton
title: "Singleton Pattern"
slug: singleton
description: Explains the Singleton pattern for ensuring a single shared instance and a controlled global access point.
tags: [design-patterns, java, creational, singleton]
---

# Singleton Pattern

> **Category:** Creational    
> **Complexity:** ⭐☆☆ (1/3)  
> **Popularity:** ⭐⭐☆ (2/3)  
> **Intent:** Ensure a class has only one instance and provide a global point of access to it.

---

## Overview

The Singleton pattern restricts the instantiation of a class to a single object. It is one of the simplest and most widely used design patterns. The single instance is typically used to coordinate actions across the system.

**Key characteristics:**
- Private constructor prevents external instantiation
- A static method provides the sole access point to the instance
- The instance is shared across the entire application

---

## 👶 Explain Like I'm 5

Imagine your house has **one TV remote**. Everyone in the family shares it. Nobody goes to the store to buy their own remote — they all just grab the same one from the coffee table. The Singleton pattern is that remote: there's only **one**, everyone uses the **same** one, and there's a **known place** to find it.

If someone made a second remote, the two remotes might send conflicting signals to the TV. Similarly, if your code creates two "database connections" or two "settings managers" when only one should exist, things break. The Singleton pattern prevents that.

---

## ❓ Problem & Solution

**The Problem:** You are trying to solve two distinct issues: 
1. **Ensure a class has just a single instance** (often to control access to a shared resource like a database, cache, or file system).
2. **Provide a global access point to that instance** (like global variables, but without the risk of other code accidentally overwriting them).

**The Solution:** The Singleton pattern tackles both problems simultaneously by:
- Modifying the default constructor to be `private`, preventing other objects from using the `new` operator.
- Implementing a `static` creation method that acts as a constructor. This method creates an object using the private constructor, saves it in a static field, and returns the cached object on all subsequent calls.

---

## 🌍 Real-World Analogy

The government is an excellent analogy for the Singleton pattern. A country can have only one official government. Regardless of the personal identities of the individuals forming the government, the title "The Government of X" serves as a global, recognizable point of access that identifies the single entity in charge.

---

import SingletonDiagram from '@site/src/components/SingletonDiagram';

## 🏗️ Structure

<SingletonDiagram />


---

## When to Use

**✅ Use this when:**
- **Shared resources** — You need exactly one configuration manager, logger, connection pool, or thread pool across the whole app.
- **Global state** — Application-wide settings, caches, or registries that must stay consistent.
- **Coordination** — Exactly one object must coordinate actions (e.g., a print spooler, a task scheduler).
- **Expensive objects** — Object creation is costly (e.g., loading a large config file from disk) and only one instance is ever needed.

**❌ Don't use this when:**
- You're using **dependency injection** (Spring, Guice) — the DI container already manages singleton scope for you. Hand-rolling a Singleton alongside DI is redundant.
- The class holds **mutable shared state** that you need to vary per-request, per-tenant, or per-thread.
- You're writing **unit tests** extensively — Singletons carry state between tests and make isolation painful.
- You need **multiple instances** in the future (e.g., multi-tenant config, per-region settings). Singleton locks you into exactly one.
- A simpler solution works — don't reach for Singleton just because you "only need one instance right now."

**🔍 Quick Decision Checklist:**
1. Does the system **break** if two instances exist? → Yes = Singleton candidate.
2. Is the single instance needed by **many unrelated classes**? → Yes = Singleton candidate.
3. Are you already using Spring or another DI framework? → Yes = Use `@Scope("singleton")` instead.
4. Will you need to **mock/replace** this in tests? → Yes = Use DI-managed singleton, not static accessor.

---

## How It Works

### 1. Eager Initialization

The instance is created at class loading time. Simple but not lazy.

```java
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();

    private EagerSingleton() {}

    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}
```

**Pros:** Thread-safe (guaranteed by JVM class loading), simple.  
**Cons:** Instance is created even if never used, wasting resources.

### 2. Lazy Initialization (Not Thread-safe)

```java
public class LazySingleton {
    private static LazySingleton instance;

    private LazySingleton() {}

    public static LazySingleton getInstance() {
        if (instance == null) {
            instance = new LazySingleton();
        }
        return instance;
    }
}
```

**Problem:** Two threads could both see `instance == null` simultaneously, creating two instances.

### 3. Synchronized Method

```java
public class SynchronizedSingleton {
    private static SynchronizedSingleton instance;

    private SynchronizedSingleton() {}

    public static synchronized SynchronizedSingleton getInstance() {
        if (instance == null) {
            instance = new SynchronizedSingleton();
        }
        return instance;
    }
}
```

**Pros:** Thread-safe.  
**Cons:** Every call to `getInstance()` acquires a lock, causing unnecessary overhead after the instance is created.

### 4. Double-Checked Locking

```java
public class DCLSingleton {
    private static volatile DCLSingleton instance;

    private DCLSingleton() {}

    public static DCLSingleton getInstance() {
        if (instance == null) {                  // first check (no lock)
            synchronized (DCLSingleton.class) {
                if (instance == null) {          // second check (with lock)
                    instance = new DCLSingleton();
                }
            }
        }
        return instance;
    }
}
```

**Key detail:** The `volatile` keyword is essential — without it, the JVM might reorder instructions and another thread could see a partially constructed object.

**Pros:** Lazy, thread-safe, minimal synchronization overhead.  
**Cons:** More complex, easy to get wrong without `volatile`.

### 5. Initialization-on-Demand Holder (Recommended)

```java
public class HolderSingleton {
    private HolderSingleton() {}

    private static class Holder {
        private static final HolderSingleton INSTANCE = new HolderSingleton();
    }

    public static HolderSingleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

**How it works:** The inner `Holder` class is not loaded until `getInstance()` is first called. The JVM guarantees that class initialization is thread-safe, so no explicit synchronization is needed.

**Pros:** Lazy, thread-safe, no synchronization overhead, simple.  
**Cons:** None significant — this is the recommended approach.

### 6. Enum Singleton

```java
public enum EnumSingleton {
    INSTANCE;

    private final Map<String, String> config = new HashMap<>();

    public void put(String key, String value) { config.put(key, value); }
    public String get(String key) { return config.get(key); }
}

// Usage
EnumSingleton.INSTANCE.put("env", "production");
String env = EnumSingleton.INSTANCE.get("env");
```

**Pros:** Thread-safe, serialization-safe, reflection-safe — all handled by the JVM.  
**Cons:** Cannot extend other classes, less intuitive for some developers.

---

## Comparison of Approaches

| Approach | Thread-safe | Lazy | Serialization-safe | Reflection-safe | Best For |
|----------|-------------|------|-------------------|----------------|----------|
| Eager | ✅ | ❌ | ❌ | ❌ | Small, always-used singletons |
| Synchronized method | ✅ | ✅ | ❌ | ❌ | Low-traffic access (simple) |
| Double-checked locking | ✅ | ✅ | ❌ | ❌ | High-traffic access (performance) |
| Holder idiom | ✅ | ✅ | ❌ | ❌ | **General purpose (recommended)** |
| Enum | ✅ | ❌ | ✅ | ✅ | When serialization/reflection safety matters |

---

## 🔄 Before & After: Why Singleton Matters

### ❌ Without Singleton — Multiple config loaders, inconsistent state

```java
// Every service creates its own config loader — wasteful and inconsistent
public class OrderService {
    private AppConfig config = new AppConfig(); // loads config from disk AGAIN
    public void process() {
        String dbUrl = config.get("db.url"); // might see stale data
    }
}

public class PaymentService {
    private AppConfig config = new AppConfig(); // ANOTHER disk read
    public void charge() {
        String apiKey = config.get("payment.apiKey"); // different instance!
    }
}
// Problem: 10 services = 10 disk reads, and if config changes mid-flight,
// some services see old values, others see new ones.
```

### ✅ With Singleton — One config loader, consistent state

```java
public class AppConfig {
    private static class Holder {
        private static final AppConfig INSTANCE = new AppConfig();
    }
    private final Map<String, String> properties;

    private AppConfig() {
        this.properties = loadFromDisk(); // loaded ONCE
    }

    public static AppConfig getInstance() { return Holder.INSTANCE; }
    public String get(String key) { return properties.get(key); }
}

// Now every service uses the same instance:
public class OrderService {
    public void process() {
        String dbUrl = AppConfig.getInstance().get("db.url"); // same instance
    }
}
public class PaymentService {
    public void charge() {
        String apiKey = AppConfig.getInstance().get("payment.apiKey"); // same instance
    }
}
// Result: 1 disk read, all services see the same consistent config.
```

---

## Breaking a Singleton

### Via Reflection

```java
Constructor<HolderSingleton> constructor = HolderSingleton.class.getDeclaredConstructor();
constructor.setAccessible(true);
HolderSingleton anotherInstance = constructor.newInstance(); // creates a second instance!
```

**Prevention:** Throw an exception inside the constructor if an instance already exists:

```java
private HolderSingleton() {
    if (Holder.INSTANCE != null) {
        throw new IllegalStateException("Singleton already initialized");
    }
}
```

### Via Serialization

Deserializing a Singleton creates a new instance by default.

**Prevention:** Add a `readResolve()` method:

```java
private Object readResolve() {
    return getInstance();
}
```

### Via Cloning

If the Singleton implements `Cloneable`, calling `clone()` creates a second instance.

**Prevention:** Override `clone()` to throw an exception or return the same instance.

---

## Real-World Examples in Java

| Class | Description |
|-------|-------------|
| `java.lang.Runtime.getRuntime()` | Access to the JVM runtime environment |
| `java.awt.Desktop.getDesktop()` | Desktop integration (open files, browse URIs) |
| Spring's `@Scope("singleton")` | Default bean scope — one instance per container |
| `LoggerFactory.getLogger()` (SLF4J) | Typically returns a cached logger instance |

---

## 💼 Singleton in Spring & Enterprise Java

### Spring's Singleton Scope (The Modern Way)

In Spring, **you almost never write a hand-coded Singleton**. Spring beans are singleton-scoped by default:

```java
@Service // singleton by default — Spring manages the lifecycle
public class NotificationService {
    private final EmailClient emailClient;

    public NotificationService(EmailClient emailClient) {
        this.emailClient = emailClient; // injected, testable, clean
    }

    public void send(String to, String message) {
        emailClient.send(to, message);
    }
}

// In tests, you can easily mock:
@MockBean
private EmailClient emailClient; // replaces the singleton's dependency
```

### When You Still Need a Hand-Coded Singleton in Enterprise Java

| Scenario | Why Hand-Coded Singleton |
|----------|-------------------------|
| **Pre-Spring bootstrap** | Config loaded before Spring context starts (e.g., `LogManager`) |
| **Library/SDK code** | Your library can't assume the consumer uses Spring |
| **JVM-wide resource** | Security managers, native resource handles |
| **Legacy integration** | Wrapping a legacy system that expects a static access point |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Controlled access to a single instance | Acts like a global variable — tight coupling |
| Reduced memory footprint | Hard to unit test (difficult to mock) |
| Lazy initialization possible | Violates Single Responsibility Principle (controls own lifecycle) |
| Thread-safe (with proper implementation) | Can hide dependencies |
| | Problematic in distributed/clustered environments |

---

## Interview Questions

**Q1: What is the Singleton pattern and why is it useful?**

The Singleton pattern ensures a class has only one instance and provides a global point of access to it. It is useful when exactly one object is needed to coordinate actions across the system — like a settings manager, connection pool, or logger. By controlling instance creation, it manages shared resources efficiently and prevents conflicts.

**Q2: How would you implement a thread-safe Singleton in Java?**

The recommended approach is the Initialization-on-Demand Holder idiom. Create a `static inner class` that holds the instance. The instance is only created when the inner class is first referenced, leveraging the JVM's class loading mechanism for thread-safe, lazy initialization without explicit synchronization. Alternatively, use an enum Singleton for complete safety against reflection and serialization attacks.

**Q3: What is lazy initialization in the context of a Singleton pattern?**

Lazy initialization means the instance is created only when it is needed for the first time, rather than at class loading time. This conserves resources when the Singleton is expensive to create and may not always be needed during the application's lifecycle.

**Q4: How do you prevent a Singleton from breaking during serialization or reflection?**

For serialization: implement a `readResolve()` method that returns the existing instance. For reflection: throw an exception in the private constructor if an instance already exists. The simplest approach is to use an enum Singleton, which is inherently safe against both serialization and reflection attacks by design.

**Q5: When should you avoid using the Singleton pattern?**

Avoid Singletons when your application requires scalable or flexible architecture. They act like global variables, making dependency management difficult. They complicate testing because they're hard to mock, carry state across the entire application lifecycle, and can create issues in concurrent or distributed environments. Consider dependency injection as an alternative.

**Q6: What is the difference between a Singleton and a static class?**

A Singleton is a class with a private constructor and a static method to get the single instance — it can implement interfaces, be passed as a parameter, and support lazy initialization. A static class (utility class) has only static methods and cannot be instantiated at all — it cannot implement interfaces or be injected as a dependency. Singleton supports polymorphism; static classes do not.

---

## Advanced Editorial Pass: Singleton and Global State Governance

### Legitimate Use Cases
- Process-wide coordination where exactly one instance is semantically required.
- Expensive shared infrastructure objects with controlled lifecycle.
- Registry-like components where duplication causes correctness defects.

### Senior Concerns
- Hidden global state creates implicit coupling and test fragility.
- Lifecycle ordering and shutdown behavior become hard in complex runtimes.
- In distributed systems, process singleton is not a system singleton.

### Governance Rules
1. Prefer dependency injection-managed singletons over static accessors.
2. Make initialization and teardown explicit for observability and testing.
3. Re-evaluate singleton necessity when scaling from monolith to distributed services.

### 🔄 Relations with Other Patterns
- **[Facade](./facade.md)**: A Facade class can often be transformed into a Singleton since a single facade object representing the subsystem is usually sufficient.
- **[Flyweight](./flyweight.md)**: Flyweight resembles Singleton if you manage to reduce all shared states to just one flyweight object. However, Flyweight instances are usually immutable and there can be multiple distinct Flyweights, whereas there is only one mutable Singleton instance.
- **[Abstract Factory](./abstract-factory.md), [Builder](./builder.md), and [Prototype](./prototype.md)**: These creational patterns can all be implemented as Singletons if exactly one instance of the factory, builder, or registry is needed.

### ⚖️ Singleton vs. Similar Approaches

| Aspect | Singleton | Static Utility Class | Spring Bean (`@Service`) | Dependency Injection |
|--------|-----------|---------------------|--------------------------|---------------------|
| **Instance count** | Exactly 1 | 0 (no instance) | 1 per container (default) | Configurable |
| **Implements interfaces** | ✅ | ❌ | ✅ | ✅ |
| **Supports polymorphism** | ✅ | ❌ | ✅ | ✅ |
| **Lazy initialization** | ✅ | N/A | ✅ | ✅ |
| **Testability** | ❌ Hard to mock | ❌ Hard to mock | ✅ Easy to mock | ✅ Easy to mock |
| **Lifecycle control** | Manual | N/A | Container-managed | Container-managed |
| **Thread safety** | You must ensure | Stateless = safe | Container ensures | Container ensures |
| **When to pick** | No DI container available | Pure utility functions (`Math`) | Standard Spring apps | Flexibility needed |
