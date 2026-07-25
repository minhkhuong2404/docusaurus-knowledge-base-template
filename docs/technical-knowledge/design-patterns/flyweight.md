---
id: flyweight
title: "Flyweight Pattern"
slug: flyweight
description: Explains the Flyweight pattern for minimizing memory usage by sharing as much data as possible with similar objects.
tags: [design-patterns, java, structural, flyweight]
---

# Flyweight Pattern

> **Category:** Structural    
> **Complexity:** ⭐⭐⭐ (3/3)  
> **Popularity:** ⭐☆☆ (1/3)  
> **Intent:** Use sharing to support large numbers of fine-grained objects efficiently.

---

## Overview

The Flyweight pattern is an optimization technique used to minimize memory usage when a system requires a massive number of objects. It achieves this by extracting the common, unchanging state (intrinsic state) of the objects and sharing it, while the varying, context-specific state (extrinsic state) is passed in from the client only when needed.

**Key characteristics:**
- Divides object state into intrinsic (shared, immutable) and extrinsic (unique, mutable).
- A factory manages a pool of shared flyweight objects.
- Drastically reduces the memory footprint of applications with high object counts.
- Trades CPU time (for calculating/passing extrinsic state) for memory space.

---

## ❓ Problem & Solution

**The Problem:** Imagine you're creating a fun multiplayer shooter game. The most exciting feature is the massive battles with huge numbers of players and NPCs firing countless bullets. However, soon after you send the game to your friends for playtesting, it crashes on their machines with an `OutOfMemoryError`. 
You discover the problem is related to the game's particle system. Each bullet, missile, and piece of shrapnel is represented by a separate object containing heavy assets like full 3D meshes and textures. When the battle reaches its climax, the sheer number of these objects exhausts the available RAM and crashes the game.

**The Solution:** On closer inspection, you notice that while the coordinates, movement vectors, and current speed of each particle vary wildly (extrinsic state), the color, 3D model, and texture always remain exactly the same (intrinsic state) for all particles of a given type.
The Flyweight pattern suggests that you stop storing the extrinsic state inside the object. Instead, you pass this state to specific methods which rely on it. Only the intrinsic state stays within the object, letting you reuse it in different contexts. As a result, you only need a few intrinsic objects (e.g., one for a "Bullet", one for a "Missile") rather than millions, saving enormous amounts of RAM.

---

## 🌍 Real-World Analogy

In a publishing company, printing 100,000 copies of a book doesn't mean the authors have to write the text 100,000 times. The text itself (the intrinsic state) is written once and set into a master printing plate. The individual pieces of paper, the binding, and the ink (the extrinsic state) are provided for each individual copy. The master plate acts as the flyweight, greatly reducing the effort and resources needed to produce mass copies.

---

import FlyweightDiagram from '@site/src/components/FlyweightDiagram';

## 🏗️ Structure

<FlyweightDiagram />


---

## When to Use

- A system generates an enormous number of objects causing memory exhaustion (e.g., millions of characters in a text editor, trees in a game forest).
- The state of these objects can easily be split into context-independent and context-dependent parts.
- The context-dependent state can be computed or stored externally and passed to the object at runtime.
- Object identity is not important (since multiple logical objects might map to the same physical Flyweight instance).

---

## How It Works

### Game Environment Example

Let's imagine a game where we need to render one million trees in a forest. Each tree has a type, color, texture (intrinsic state - shared) and X/Y coordinates, and current health (extrinsic state - unique).

```java
// 1. Unoptimized approach (will crash with OutOfMemoryError for 1,000,000 trees)
class HeavyTree {
    private int x, y;
    private String name;
    private Color color;
    private byte[] textureData; // Heavy!
    // constructor, getters, draw()...
}

// 2. Flyweight approach - Separate intrinsic (shared) state
public class TreeType {
    private final String name;
    private final Color color;
    private final byte[] textureData; // Shared heavy data

    public TreeType(String name, Color color, byte[] textureData) {
        this.name = name;
        this.color = color;
        this.textureData = textureData;
    }

    // Extrinsic state is passed in via method arguments
    public void draw(int x, int y, Graphics g) {
        System.out.println("Drawing " + name + " tree at (" + x + ", " + y + ")");
        // g.drawTexture(textureData, x, y)...
    }
}

// 3. Flyweight Factory - Manages shared instances
public class TreeFactory {
    private static final Map<String, TreeType> treeTypes = new HashMap<>();

    public static TreeType getTreeType(String name, Color color, byte[] textureData) {
        TreeType result = treeTypes.get(name);
        if (result == null) {
            result = new TreeType(name, color, textureData);
            treeTypes.put(name, result);
        }
        return result;
    }
    
    public static int getCacheSize() {
        return treeTypes.size();
    }
}

// 4. Context Object - Stores extrinsic state and links to intrinsic state
public class Tree {
    private final int x;
    private final int y;
    private final TreeType type; // Reference to shared Flyweight

    public Tree(int x, int y, TreeType type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    public void draw(Graphics g) {
        type.draw(x, y, g);
    }
}

// 5. Client / Forest structure
public class Forest {
    private final List<Tree> trees = new ArrayList<>();

    public void plantTree(int x, int y, String name, Color color, byte[] textureData) {
        TreeType type = TreeFactory.getTreeType(name, color, textureData);
        Tree tree = new Tree(x, y, type);
        trees.add(tree);
    }

    public void draw(Graphics g) {
        for (Tree tree : trees) {
            tree.draw(g);
        }
    }
}
```

### Usage

```java
Forest forest = new Forest();
byte[] oakTexture = new byte[1024]; // simulated 1KB texture
byte[] pineTexture = new byte[1024];

for (int i = 0; i < 500_000; i++) {
    forest.plantTree(randomX(), randomY(), "Oak", Color.GREEN, oakTexture);
    forest.plantTree(randomX(), randomY(), "Pine", Color.DARK_GRAY, pineTexture);
}

// We have 1,000,000 Tree objects, but only 2 TreeType objects!
// Total RAM: (1,000,000 * small object) + (2 * heavy object)
// Instead of: (1,000,000 * heavy object) => OutOfMemory
```

---

## Intrinsic vs. Extrinsic State

| Property | Intrinsic State (Flyweight) | Extrinsic State (Context) |
|----------|-----------------------------|---------------------------|
| **Description** | In a game: tree mesh, texture | In a game: tree x/y coordinates |
| **Storage** | Stored inside the Flyweight object | Stored in the Context object or computed |
| **Mutability** | **Immutable** (read-only) | Mutable (can change) |
| **Sharing** | Shared across many contexts | Unique per context |
| **Lifecycle** | Managed by Flyweight Factory | Managed by Client / application logic |

---

## Real-World Examples

| Framework/Library | Description |
|-------------------|-------------|
| `java.lang.Integer.valueOf()` | Java caches `Integer` instances for values -128 to +127. |
| `java.lang.String.intern()` | The String Constant Pool shares duplicate string literals. |
| `java.math.BigDecimal` | Common values like `BigDecimal.ZERO`, `ONE`, `TEN` are cached. |
| **GUI Frameworks** | Font formatting objects (bold, italic rules) applied across millions of characters. |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Drastically reduces RAM usage for high-volume objects | Code becomes more complicated |
| Centralizes state that is shared | CPU overhead to look up Flyweights |
| Enables features that would otherwise OOM | Can break `==` object identity checks |
| | Requires clear separation of intrinsic/extrinsic data |

---

## Interview Questions

**Q1: What is the main problem the Flyweight pattern solves?**

The Flyweight pattern prevents `OutOfMemoryError` constraints when an application must instantiate an enormous quantity of very similar objects. It saves RAM by isolating shared (intrinsic) state into a single immutable instance referenced by many context wrappers that hold the unique (extrinsic) state.

**Q2: What is the difference between Intrinsic and Extrinsic state?**

Intrinsic state is context-independent and shared among many objects (like the 3D mesh or texture of an enemy in a game). It is strictly immutable. Extrinsic state is context-dependent and unique to a specific instance (like the exact X/Y coordinates and current health of that specific enemy in the level).

**Q3: How does Flyweight differ from Singleton?**

Singleton pattern guarantees exactly one instance of a class across the entire application. Flyweight aims to minimize instances, but a Flyweight Factory can manage *multiple* flyweight objects (e.g., one for "Oak Tree", one for "Pine Tree", one for "Birch Tree"). Unlike Singleton, Flyweight focuses on optimizing high-volume fine-grained objects rather than coordinating global system behavior.

**Q4: Can a Flyweight object be modified after creation?**

No. The intrinsic state within a Flyweight object must be strictly immutable because it is shared among many contexts. If one context modifies the shared object, it would inappropriately change the state for all other contexts utilizing that Flyweight.

**Q5: Why is `Integer.valueOf(5) == Integer.valueOf(5)` true in Java?**

This is an implementation of the Flyweight pattern. Java's `Integer` class maintains an internal cache array of `Integer` objects for values between -128 and 127. When `valueOf()` is called within this range, it returns the shared, pre-instantiated Flyweight reference, making pointer comparison (`==`) evaluate to true.

---

## Advanced Editorial Pass: Flyweight and Memory Governance

### Strategic Payoff
- Allows scaling architectures (like massive multiplayer online games or high-volume data streaming) to handle data loads that normally exceed JVM heap limits.
- Substantially reduces Garbage Collection pauses by minimizing object churn and heap fragmentation.
- Forces precise immutability contracts in domain modeling.

### Non-Obvious Risks
- **Cache Leaks:** The Flyweight Factory often acts as a global cache. If unbound, or if it lacks eviction policies, what was meant to optimize memory becomes a memory leak.
- **CPU vs Memory Tradeoff:** Extracting extrinsic state and passing it down call stacks incurs CPU pipeline overhead. If memory is not your actual bottleneck, Flyweight is a net negative.
- **Thread Safety:** While Flyweights are immutable (safe), the *Flyweight Factory* must be thread-safe to handle concurrent requests, introducing lock contention.

### Implementation Heuristics
1. Do not use Flyweight preemptively. Prove there is extreme memory pressure first.
2. Ensure Flyweights are strictly immutable (`final` fields, no setter methods).
3. Back your Flyweight Factory with a size-bounded structure (like Guava `Cache` or Caffeine) rather than a boundless `HashMap` to prevent runaway heap consumption.

### 🔄 Relations with Other Patterns
- **[Composite](./composite.md)**: You can implement shared leaf nodes of a Composite tree as Flyweights to save memory.
- **[Facade](./facade.md)**: Flyweight shows how to make lots of little objects, whereas Facade shows how to make a single object that represents an entire subsystem.
- **[Singleton](./singleton.md)**: Flyweight would resemble Singleton if you somehow managed to reduce all shared states of the objects to just one flyweight object. However, there are two crucial differences: 1) There should be only one Singleton instance, whereas a Flyweight class can have multiple instances with different intrinsic states. 2) The Singleton object can be mutable, while Flyweight objects are strictly immutable.
