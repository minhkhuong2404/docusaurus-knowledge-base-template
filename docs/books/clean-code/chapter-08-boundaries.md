---
sidebar_position: 9
title: "Chapter 8: Boundaries"
description: Strategies for cleanly integrating third-party code and managing the edges of your system.
---

# Chapter 8: Boundaries

## The Challenge at the Edge of Your System

Every system has **boundaries** — places where your code touches third-party libraries, external APIs, or modules owned by other teams. These boundaries are sources of friction: the third-party code does things its way, not yours. It changes. Its API might be too broad, or too narrow.

This chapter is about managing those boundaries so they don't corrupt your clean code.

---

## Using Third-Party Code

Third-party providers want their interfaces to be broadly useful. You want an interface that's focused on your specific needs. This tension causes friction.

### The `Map` Problem

`java.util.Map` is a powerful API with many methods: `get`, `put`, `remove`, `clear`, `keySet`, `entrySet`, etc. If you pass a `Map<Sensor>` around your codebase:

```java
Map<Sensor> sensors = new HashMap<Sensor>();
// ...passes around...
Sensor s = sensors.get(sensorId);
```

Any code that holds this `Map` can call `clear()` on it, add to it, remove from it, get keysets from it — even if those operations are inappropriate for your domain. The API is far broader than what you need.

**Encapsulate it:**

```java
public class Sensors {
    private Map<String, Sensor> sensors = new HashMap<>();

    public Sensor getById(String id) {
        return sensors.get(id);
    }

    // Only expose what callers actually need
    public void addSensor(String id, Sensor sensor) {
        sensors.put(id, sensor);
    }
}
```

Now the boundary (the raw `Map`) is hidden. The `Sensors` class enforces the domain-appropriate operations.

:::tip
Don't pass `Map` (or any other boundary interface) across the codebase. Encapsulate it at the boundary.
:::

---

## Exploring and Learning Boundaries: Learning Tests

When you adopt a new third-party library, write **learning tests** — unit tests that verify your understanding of the library's API, not your production code.

```java
// Learning tests for log4j (from the book)
@Test
public void testLogCreate() {
    Logger logger = Logger.getLogger("MyLogger");
    logger.info("hello");
}

@Test
public void testLogAddAppender() {
    Logger logger = Logger.getLogger("MyLogger");
    ConsoleAppender appender = new ConsoleAppender(new PatternLayout());
    logger.addAppender(appender);
    logger.info("hello");
}
```

Benefits:
- You **learn the API** through experimentation with fast feedback
- The tests **document** how you use the library
- When the library **upgrades**, run the tests — if they break, you know exactly what changed

Learning tests cost nothing extra because you'd have to learn the API anyway.

---

## Using Code That Doesn't Exist Yet

Sometimes you need to write code that depends on a module that hasn't been built yet. Don't wait.

Define the interface you *wish* you had. Use it in your code. Write a fake/stub implementation for testing. When the real module is complete, write an Adapter that translates between your ideal interface and the real API.

```
Your Code → [Your Interface] → [Adapter] → [Real Third-Party API]
                                    ↑
                        Written when real API is available
```

This keeps your code clean and testable while decoupling it from external dependencies.

---

## Clean Boundaries

When you use third-party code, the code at the boundary needs extra care:

- **Don't let third-party types leak** across your codebase. Wrap them.
- **Write learning tests** to verify and document behavior.
- **Use Adapters** to bridge the gap between the API you wish you had and the one you got.
- **Expect the API to change.** Fewer places that know about it = fewer places to update.

---

## Key Takeaways

- Encapsulate third-party APIs instead of passing them around raw
- Write learning tests to understand and document how third-party code behaves
- Define your desired interface first; use an adapter to connect to the real implementation
- Design for change: minimize the number of places that know about a third-party API
