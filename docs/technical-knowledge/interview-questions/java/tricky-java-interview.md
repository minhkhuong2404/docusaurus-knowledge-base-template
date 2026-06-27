---
id: tricky-java-interview
title: Tricky Java Interview Questions
sidebar_label: Tricky Java Q&A
description: "Advanced and tricky Java interview questions aimed at experienced developers and edge-case behavior."
tags: [java, interview, advanced, backend]
---

# Tricky Java Interview Questions & Answers

This guide covers advanced and tricky topics frequently asked in interviews for experienced Java developers.

## 1. Under the Hood: HashMap Collisions & Red-Black Trees (Java 8)

In Java 8, `HashMap` resolves high-collision scenarios (e.g. hash collision attacks) by converting overloaded buckets from linked lists to balanced **Red-Black Trees**.

### Why 8 and 6? (Treeification Thresholds)
- **`TREEIFY_THRESHOLD = 8`**: If a bucket's size reaches 8, it converts to a Red-Black Tree.
- **`UNTREEIFY_THRESHOLD = 6`**: If elements are removed and size drops to 6, it reverts to a linked list.
- **`MIN_TREEIFY_CAPACITY = 64`**: The map will **not** treeify unless the total array capacity is at least 64. If capacity is under 64, it resizes (doubles) the array instead to redistribute elements.

### The Mathematics (Poisson Distribution)
Why was 8 chosen as the threshold? According to the OpenJDK source code comments, key hash distributions follow a **Poisson distribution**:
$$P(k) = \frac{e^{-\lambda} \lambda^k}{k!}$$
With a default load factor of 0.75, the probability of a bucket having 8 entries under a normal hash distribution is approximately **$0.00000006$ (less than 1 in 10 million)**. 

Thus, treeification is a fallback mechanism designed specifically to defend against **Hash Collision Denial of Service (DoS) attacks**, where an attacker deliberately inputs keys with identical hashcodes to degrade map performance from O(1) to O(n). With treeification, worst-case performance remains bounded at **O(log n)**.

## 2. Map vs. FlatMap

Both are used in Java Streams for transformation, but they differ in their return types and structural impacts:

| Feature | Map | FlatMap |
| :--- | :--- | :--- |
| **Function Type** | `Function<T, R>` | `Function<T, Stream<R>>` |
| **Relationship** | 1-to-1 (one element in, one out) | 1-to-many (one element in, zero-to-many out) |
| **Output Structure** | Keeps the stream structure nested | Flattens the nested stream structure |
| **Use Case** | Extracting a property (e.g. User → Email) | Flattening collections (e.g. User → List&lt;Order&gt; → Stream of Orders) |

### Code Comparison

```java
List<List<String>> nested = Arrays.asList(
    Arrays.asList("A", "B"),
    Arrays.asList("C", "D")
);

// Map: keeps nested lists intact
List<Stream<String>> mapped = nested.stream()
    .map(Collection::stream)
    .collect(Collectors.toList()); // Result: [[A, B], [C, D]]

// FlatMap: flattens lists into a single flat collection
List<String> flattened = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList()); // Result: [A, B, C, D]
```

## 3. Factory vs. Abstract Factory Pattern

Both are creational design patterns, but their level of abstraction differs:

* **Factory Method Pattern:** Defines an interface for creating a single product, letting subclasses decide which concrete class to instantiate.
* **Abstract Factory Pattern:** Provides an interface for creating **families of related or dependent products** without specifying their concrete classes. It is essentially a "Factory of Factories."

```java
// Factory Pattern: Creates a single type of object
interface Button { void render(); }
class WindowsButton implements Button { public void render() {} }

abstract class Dialog {
    public abstract Button createButton(); // Factory Method
}

// Abstract Factory Pattern: Creates families of objects (e.g. GUI Toolkits)
interface GUIFactory {
    Button createButton();
    Checkbox createCheckbox(); // Family of products
}

class WindowsGUIFactory implements GUIFactory {
    public Button createButton() { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}
```

## 4. MetaSpace vs. PermGen

| Feature | PermGen (Java 7 and earlier) | MetaSpace (Java 8+) |
|:--------|:----------------------------|:--------------------|
| **Memory Source** | **JVM Heap** (fixed maximum size) | **Native System Memory** (RAM) |
| **Size Limit** | Fixed (default max ~64-82MB) | Uncapped by default (grows dynamically) |
| **Common Error** | `java.lang.OutOfMemoryError: PermGen space` | `java.lang.OutOfMemoryError: Metaspace` |
| **Garbage Collection** | Slow and expensive | Cleaned up when classloaders are collected |

### MetaSpace JVM Flags
Although Metaspace grows dynamically, in production you should cap it to prevent a memory leak from consuming all host RAM:
- `-XX:MetaspaceSize=128m`: Initial threshold. Reaching this triggers a GC cycle to clean up unused classloaders.
- `-XX:MaxMetaspaceSize=256m`: The maximum limit. If class metadata exceeds this, it throws `OutOfMemoryError: Metaspace`.
- `-XX:CompressedClassSpaceSize=1g`: Space allocated for class pointers when compressed OOPs are enabled.

### Classloader Leaks
Since Metaspace is cleaned up only when the **ClassLoader** that loaded those classes is garbage collected, redeploying applications in application servers (like Tomcat) without restarting the JVM often leads to ClassLoader leaks, causing eventual Metaspace exhaustion.

## 5. Spring Bean Scopes

Spring supports six bean scopes (four of which are web-aware):

1. **Singleton (Default):** Scopes a single bean definition to a single Spring IoC container instance.
2. **Prototype:** Scopes a single bean definition to any number of object instances. A new instance is created every time the bean is requested.
3. **Request:** Scopes a single bean definition to the lifecycle of a single HTTP request. (Web-aware).
4. **Session:** Scopes a single bean definition to the lifecycle of an HTTP Session. (Web-aware).
5. **Application:** Scopes a single bean definition to the lifecycle of a `ServletContext`. (Web-aware).
6. **WebSocket:** Scopes a single bean definition to the lifecycle of a `WebSocket`. (Web-aware).

### Prototype Injection into Singleton Gotcha
If you inject a `Prototype` bean into a `Singleton` bean, the prototype bean is instantiated **only once** (when the singleton is initialized). Subsequent calls to the singleton will use the same prototype instance.

**Solution:** Use **Lookup Method Injection** (`@Lookup`) or inject `ObjectProvider<MyPrototype>`:
```java
@Component
public class SingletonBean {
    @Autowired
    private ObjectProvider<PrototypeBean> prototypeProvider;

    public void process() {
        // Obtains a fresh instance every time
        PrototypeBean prototype = prototypeProvider.getObject();
        prototype.execute();
    }
}
```

---
