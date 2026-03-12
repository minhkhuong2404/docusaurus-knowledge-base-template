---
id: singleton
title: "Singleton Pattern"
slug: singleton
---

# Singleton Pattern

> **Category:** Creational  
> **Intent:** Ensure a class has only one instance and provide a global point of access to it.

---

## Overview

The Singleton pattern restricts the instantiation of a class to a single object. It is one of the simplest and most widely used design patterns. The single instance is typically used to coordinate actions across the system.

**Key characteristics:**
- Private constructor prevents external instantiation
- A static method provides the sole access point to the instance
- The instance is shared across the entire application

---

## When to Use

- **Shared resources** — configuration managers, loggers, connection pools, thread pools
- **Global state** — application-wide settings, caches, or registries
- **Coordination** — when exactly one object must coordinate actions (e.g., a print spooler)
- **Expensive objects** — when object creation is costly and only one instance is ever needed

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

| Approach | Thread-safe | Lazy | Serialization-safe | Reflection-safe |
|----------|-------------|------|-------------------|----------------|
| Eager | ✅ | ❌ | ❌ | ❌ |
| Synchronized method | ✅ | ✅ | ❌ | ❌ |
| Double-checked locking | ✅ | ✅ | ❌ | ❌ |
| Holder idiom | ✅ | ✅ | ❌ | ❌ |
| Enum | ✅ | ❌ | ✅ | ✅ |

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
