---
id: proxy
title: "Proxy Pattern"
slug: proxy
description: Explains the Proxy pattern for controlling access to another object through an intermediary with the same interface.
tags: [design-patterns, java, structural, proxy]
---

# Proxy Pattern

> **Category:** Structural    
> **Complexity:** ⭐⭐☆ (2/3)  
> **Popularity:** ⭐☆☆ (1/3)  
> **Intent:** Provide a surrogate or placeholder for another object to control access to it.

---

## Overview

The Proxy pattern creates a stand-in for another object. The proxy controls access to the real object — it can add lazy initialization, access control, logging, caching, or remote communication, all transparently to the client.

**Key characteristics:**
- Proxy implements the same interface as the real object
- Clients interact with the proxy as if it were the real object
- The proxy controls when, how, and whether the real object is accessed

---

## ❓ Problem & Solution

**The Problem:** Why would you want to control access to an object? Imagine you have a massive object that consumes a vast amount of system resources (like a database connection or a huge video file). You need it from time to time, but not always.
You could implement lazy initialization to create this object only when it's actually needed. However, all of the object's clients would have to execute this conditional initialization code, leading to massive code duplication. You could put this check inside the object's class, but the class might be part of a closed 3rd-party library where you can't alter the source code.

**The Solution:** The Proxy pattern suggests creating a new class (the proxy) with the exact same interface as the original service object. You then update your app so it passes the proxy object to the clients instead of the real object. Upon receiving a request from a client, the proxy performs its intermediate duties (like lazy initialization, caching, or access control), and then passes the request to the real service object. Because the proxy acts as a perfect drop-in replacement, you can plug it in anywhere the original object was expected, completely hiding the extra logic from the client.

---

## 🌍 Real-World Analogy

A credit card is a proxy for a bank account, which in turn is a proxy for a bundle of physical cash. Both the credit card and the cash implement the same interface: they can be used for making payments. A consumer feels perfectly fine because there's no need to carry tons of cash around. A shop owner is also happy because the income gets added electronically to their bank account without the risk of being robbed on the way to the deposit box.

---

import ProxyDiagram from '@site/src/components/ProxyDiagram';

## 🏗️ Structure

<ProxyDiagram />


---

## When to Use

- **Lazy initialization** — defer creation of resource-heavy objects until actually needed
- **Access control** — check permissions before allowing access
- **Remote access** — represent an object in a different JVM or server
- **Logging/monitoring** — log method calls transparently
- **Caching** — cache results of expensive operations

---

## Proxy Types

| Type | Purpose | Example |
|------|---------|---------|
| **Virtual proxy** | Lazy initialization — creates the real object on first use | Load a large image only when displayed |
| **Protection proxy** | Access control — checks permissions before delegating | Verify user roles before method access |
| **Remote proxy** | Represents an object on a different server | RMI stub, gRPC client |
| **Caching proxy** | Caches responses from the real object | Cache DB query results |
| **Logging proxy** | Logs all method calls | Audit trail for sensitive operations |

---

## How It Works

### Virtual Proxy (Lazy Loading)

```java
public interface Image {
    void display();
    String getFilename();
}

// Real object — expensive to create
public class HighResolutionImage implements Image {
    private final String filename;
    private final byte[] data;

    public HighResolutionImage(String filename) {
        this.filename = filename;
        this.data = loadFromDisk(filename);  // expensive!
    }

    private byte[] loadFromDisk(String filename) {
        System.out.println("Loading " + filename + " from disk... (slow)");
        return new byte[10_000_000];  // simulating large image
    }

    @Override
    public void display() {
        System.out.println("Displaying " + filename + " (" + data.length + " bytes)");
    }

    @Override
    public String getFilename() { return filename; }
}

// Virtual proxy — delays creation until needed
public class ImageProxy implements Image {
    private final String filename;
    private HighResolutionImage realImage;  // created lazily

    public ImageProxy(String filename) {
        this.filename = filename;
        // No heavy loading here!
    }

    @Override
    public void display() {
        if (realImage == null) {
            realImage = new HighResolutionImage(filename);  // load on first use
        }
        realImage.display();
    }

    @Override
    public String getFilename() { return filename; }
}

// Usage
Image image = new ImageProxy("photo.jpg");  // no loading happens
System.out.println("Image created");
image.display();                             // NOW it loads
image.display();                             // cached — no reload
```

### Protection Proxy (Access Control)

```java
public interface Document {
    String read();
    void write(String content);
    void delete();
}

public class SensitiveDocument implements Document {
    private String content;

    public SensitiveDocument(String content) { this.content = content; }

    @Override public String read() { return content; }
    @Override public void write(String content) { this.content = content; }
    @Override public void delete() { this.content = null; }
}

public class DocumentProxy implements Document {
    private final SensitiveDocument realDocument;
    private final String userRole;

    public DocumentProxy(SensitiveDocument realDocument, String userRole) {
        this.realDocument = realDocument;
        this.userRole = userRole;
    }

    @Override
    public String read() {
        if ("GUEST".equals(userRole)) {
            throw new SecurityException("Guests cannot read this document");
        }
        return realDocument.read();
    }

    @Override
    public void write(String content) {
        if (!"ADMIN".equals(userRole)) {
            throw new SecurityException("Only admins can write to this document");
        }
        realDocument.write(content);
    }

    @Override
    public void delete() {
        if (!"ADMIN".equals(userRole)) {
            throw new SecurityException("Only admins can delete this document");
        }
        realDocument.delete();
    }
}

// Usage
SensitiveDocument doc = new SensitiveDocument("Secret content");
Document adminView = new DocumentProxy(doc, "ADMIN");
Document userView = new DocumentProxy(doc, "USER");

adminView.write("Updated content");  // works
userView.read();                      // works
userView.write("Hack!");              // throws SecurityException
```

### Caching Proxy

```java
public interface UserService {
    User findById(long id);
}

public class UserServiceImpl implements UserService {
    @Override
    public User findById(long id) {
        System.out.println("Querying database for user " + id + "...");
        // expensive database call
        return new User(id, "User-" + id);
    }
}

public class CachingUserServiceProxy implements UserService {
    private final UserService realService;
    private final Map<Long, User> cache = new ConcurrentHashMap<>();

    public CachingUserServiceProxy(UserService realService) {
        this.realService = realService;
    }

    @Override
    public User findById(long id) {
        return cache.computeIfAbsent(id, realService::findById);
    }
}

// Usage
UserService service = new CachingUserServiceProxy(new UserServiceImpl());
service.findById(1);  // queries database
service.findById(1);  // returns cached result
service.findById(2);  // queries database
```

### Java Dynamic Proxy

Java provides built-in support for dynamic proxies via `java.lang.reflect.Proxy`:

```java
public class LoggingHandler implements InvocationHandler {
    private final Object target;

    public LoggingHandler(Object target) { this.target = target; }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("Calling: " + method.getName() + " with args: " + Arrays.toString(args));
        long start = System.nanoTime();
        Object result = method.invoke(target, args);
        long elapsed = System.nanoTime() - start;
        System.out.println("Returned: " + result + " (took " + elapsed / 1_000_000 + "ms)");
        return result;
    }
}

// Create a dynamic proxy
UserService realService = new UserServiceImpl();
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    new LoggingHandler(realService)
);

proxy.findById(42);
// Calling: findById with args: [42]
// Querying database for user 42...
// Returned: User{id=42, name='User-42'} (took 5ms)
```

---

## Proxy vs Decorator vs Adapter

| Pattern | Purpose | Interface change? | Controls lifecycle? |
|---------|---------|-------------------|---------------------|
| **Proxy** | Control access | ❌ Same | ✅ Yes (can create/destroy real object) |
| **Decorator** | Add behavior | ❌ Same | ❌ No (wraps existing object) |
| **Adapter** | Convert interface | ✅ Different | ❌ No |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Controls resource-heavy objects (lazy loading) | Adds indirection — slight performance overhead |
| Adds security transparently | Can make debugging harder |
| Enables caching and logging without modifying real object | Extra classes to maintain |
| Follows Open/Closed Principle | |
| Client code doesn't change | |

---

## Interview Questions

**Q1: What is the Proxy pattern and how does it control access to objects?**

The Proxy pattern provides a placeholder for another object, controlling access to it. The proxy implements the same interface as the real object and intercepts client requests. It can add functionality like lazy initialization, access control, logging, or caching before (or instead of) delegating to the real object — all transparently to the client.

**Q2: Can you explain the difference between a virtual proxy, remote proxy, and protection proxy?**

A **virtual proxy** delays object creation until it's actually needed, saving resources through lazy initialization. A **remote proxy** represents an object on a different server, managing network communication transparently. A **protection proxy** enforces access control, checking permissions before allowing the client to interact with the real object.

**Q3: How do you implement the Proxy pattern in Java?**

Create an interface that both the real object and proxy implement. The real class performs core operations. The proxy class implements the same interface and holds a reference to the real object. In the proxy's methods, add control logic (lazy init, security checks, caching) before delegating to the real object. Java also supports dynamic proxies via `java.lang.reflect.Proxy` for runtime proxy generation.

**Q4: When would you use the Proxy pattern in real-world applications?**

Lazy loading of expensive resources (images, large datasets). Access control in security-sensitive systems. Caching database query results. Logging and monitoring method calls. Remote service invocation (RMI, gRPC stubs). Spring AOP uses proxies extensively for transaction management, security, and caching.

**Q5: What are the potential downsides of using the Proxy pattern?**

Added complexity from the extra indirection layer. Possible performance overhead from proxy processing. Can make debugging harder since the proxy intercepts all calls. If overused, proxies create design clutter and complicate the object graph. The response from a proxy might differ from the real object in edge cases.

---

## Advanced Editorial Pass: Proxy as Control Point for Access and Cost

### Core Advantages
- Centralizes policy enforcement (auth, rate limiting, lazy loading, circuit behavior).
- Preserves client contract while introducing control and observability.
- Supports remote, virtual, and protection scenarios with minimal caller change.

### Operational Pitfalls
- Added hop obscures source of latency and error translation.
- Inconsistent caching semantics can return stale or contradictory results.
- Proxy logic drifts into business workflow orchestration.

### Implementation Heuristics
1. Keep policy concerns explicit and separately testable.
2. Emit proxy-level metrics to distinguish upstream vs proxy-induced issues.
3. Define strict boundaries: policy layer only, not domain decision engine.

### 🔄 Relations with Other Patterns
- **[Adapter](./adapter.md)**: Adapter provides a completely different interface to the wrapped object, Proxy provides it with the exactly same interface, and Decorator provides it with an enhanced interface.
- **[Facade](./facade.md)**: Facade is similar to Proxy in that both buffer a complex entity and handle initialization on their own. Unlike Facade, Proxy has the exact same interface as its service object, which makes them interchangeable.
- **[Decorator](./decorator.md)**: Decorator and Proxy have similar structures, but very different intents. Both patterns are built on the composition principle, where one object delegates work to another. But a Proxy usually manages the lifecycle of its service object on its own, whereas the composition of Decorators is almost always controlled dynamically by the client.
