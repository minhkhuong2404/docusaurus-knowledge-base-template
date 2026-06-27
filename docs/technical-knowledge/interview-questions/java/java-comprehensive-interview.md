---
id: java-comprehensive-interview
title: Comprehensive Java Interview Questions
sidebar_label: Java & Spring Mixed
description: "Comprehensive Java and Spring interview set spanning core Java, collections, Hibernate, and Spring."
tags: [java, interview, spring, hibernate]
---

# Java & Spring Interview Questions [Most Asked]

This compilation covers critical interview topics across Core Java, Collections, Hibernate, and the Spring Framework with senior-level depth.

## 1. ArrayList vs. LinkedList

| Feature | ArrayList | LinkedList |
| :-------------------------- | :-------------------------------- | :-------------------------- |
| **Internal Data Structure** | Resizable Array (contiguous memory) | Doubly Linked List (nodes on heap) |
| **Random Access** | **O(1)** — direct index | O(n) — traversal from head/tail |
| **Add/Remove at end** | O(1) amortized | O(1) |
| **Add/Remove in middle** | O(n) — `System.arraycopy()` shift | O(n) traversal + O(1) pointer update |
| **Memory per element** | ~4-8 bytes | ~40 bytes (Node overhead) |
| **Cache Friendliness** | Excellent (contiguous) | Poor (scattered on heap) |
| **Best Use Case** | Default choice for most scenarios | Queue/Deque operations, frequent iterator removal |

**Key insight for interviews:** Prefer `ArrayDeque` over `LinkedList` for stack/queue operations — it's faster due to contiguous memory layout and has no Node allocation overhead.

## 2. Lazy Loading in Hibernate

Lazy loading postpones the initialization of associated entities until they are explicitly accessed, reducing unnecessary database queries.

### How it works internally
Hibernate creates a **proxy object** (using CGLIB or ByteBuddy bytecode generation) that extends your entity class. When you access a lazily-loaded field, the proxy intercepts the call and fires the SQL query at that point.

```java
@Entity
public class Employee {
    @OneToMany(fetch = FetchType.LAZY)  // Default for collections
    private List<Address> addresses;    // Proxy, not loaded yet
}

Employee emp = session.get(Employee.class, 1L); // SQL: SELECT * FROM employee WHERE id=1
// emp.addresses is a PersistentBag proxy — NO SQL yet

emp.getAddresses().size(); // NOW fires SQL: SELECT * FROM address WHERE employee_id=1
```

### The N+1 Problem
```java
List<Employee> emps = session.createQuery("FROM Employee", Employee.class).list();
// 1 query: SELECT * FROM employee (returns 100 employees)

for (Employee emp : emps) {
    emp.getAddresses().size(); // 100 MORE queries! One per employee
}
// Total: 1 + 100 = 101 queries (the "N+1 problem")
```

**Solutions:**
1. **`JOIN FETCH`** (JPQL): `"FROM Employee e JOIN FETCH e.addresses"` — single query with a JOIN
2. **`@EntityGraph`** (JPA 2.1): Declarative fetch plan
3. **`@BatchSize(size=20)`**: Loads 20 address collections per query → 1 + 5 = 6 queries for 100 employees

### LazyInitializationException
If you access a lazy field **after the Hibernate Session is closed**, you get `LazyInitializationException`. Common in web apps where the Session closes after the Service layer but the Controller/View tries to access lazy data.

**Solutions:** Open Session in View (anti-pattern), DTO projection, or fetch eagerly for known access patterns.

## 3. Hibernate Caching: First Level vs. Second Level

| Feature | First Level Cache | Second Level Cache |
|:--------|:-----------------|:------------------|
| **Scope** | Single `Session` (EntityManager) | `SessionFactory` (application-wide) |
| **Enabled** | Always (cannot disable) | Must be explicitly configured |
| **Storage** | Identity Map: `Map<EntityKey, Entity>` | Dehydrated state (serialized form, not entity objects) |
| **Eviction** | When Session is closed/cleared | TTL-based, size-based, or manual |
| **Object Identity** | Same Session → same object reference (`==`) | Different Sessions → different objects (`equals()` true) |
| **Provider** | Built into Hibernate | External: EhCache, Hazelcast, Infinispan, Redis |

### Query Cache (often overlooked)
The entity cache only works for `session.get(id)` / `session.find(id)`. For HQL/JPQL queries, you need the **Query Cache** — it stores the list of matching primary keys, not the entities themselves. The entity cache is then used to resolve each key to an entity.

```java
// Enable Query Cache for specific queries
List<Product> products = session.createQuery("FROM Product WHERE active = true")
    .setCacheable(true)
    .list();
```

## 4. JVM Garbage Collection Generations

JVM Heap memory is divided into generations based on object lifetime, enabling optimized GC strategies:

```
┌──────────────────── Heap ────────────────────────┐
│                                                   │
│  ┌──────── Young Generation (~1/3 of heap) ────┐ │
│  │  Eden Space    │ Survivor S0 │ Survivor S1   │ │
│  │  (new objects) │  (from)     │  (to)         │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────── Old (Tenured) Generation (~2/3) ────┐ │
│  │  Long-lived objects that survived multiple   │ │
│  │  Young GC cycles                             │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
└───────────────────────────────────────────────────┘

┌──────── Metaspace (Native Memory, NOT Heap) ─────┐
│  Class metadata, method bytecode, constant pool   │
│  (Replaced PermGen in Java 8)                     │
└───────────────────────────────────────────────────┘
```

### GC Types

| GC Event | What happens | Impact |
|:---------|:------------|:-------|
| **Minor GC** | Collects Young Gen only | Fast (10-50ms), frequent |
| **Major GC** | Collects Old Gen | Slower (100ms-1s), less frequent |
| **Full GC** | Collects entire heap + Metaspace | **Stop-the-world**, very slow |

### Object Lifecycle
1. New object → **Eden** space
2. Survives Minor GC → moves to **Survivor S0** (age = 1)
3. Survives another Minor GC → moves to **Survivor S1** (age = 2)
4. Alternates between S0/S1 for several GC cycles
5. Age reaches threshold (default 15) → **promoted to Old Gen**
6. Large objects may go directly to Old Gen (avoids copying overhead)

### GC Algorithms (Java 17+)

| Algorithm | Pause Target | Best For |
|:----------|:-----------|:---------|
| **G1 GC** (default since Java 9) | ~200ms | General purpose, balanced throughput/latency |
| **ZGC** | < 1ms | Ultra-low latency (trading databases, real-time) |
| **Shenandoah** | < 10ms | Low latency (similar to ZGC, available in OpenJDK) |
| **Parallel GC** | Maximize throughput | Batch processing, offline computation |

## 5. What is Serialization?

Serialization is the process of converting an object's state into a **byte stream**, so it can be saved to a file, sent over a network, or stored in a database. Deserialization is the reverse process.

```java
// Serialize
try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("data.ser"))) {
    oos.writeObject(employee);
}

// Deserialize
try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("data.ser"))) {
    Employee emp = (Employee) ois.readObject();
}
```

### Key details
- Class must implement `java.io.Serializable` (marker interface)
- `serialVersionUID` — version control for serialized classes. If you change the class structure without updating this ID, deserialization throws `InvalidClassException`
- `transient` keyword — marks fields that should NOT be serialized (passwords, connections, caches)
- `static` fields are NOT serialized (they belong to the class, not the instance)

### Modern alternatives
Java serialization has known security vulnerabilities (deserialization attacks) and performance issues. Modern alternatives:
- **JSON:** Jackson, Gson (human-readable, widely supported)
- **Protocol Buffers:** Google's binary format (compact, fast, schema-driven)
- **Avro:** Apache's format (schema evolution, used in Kafka)

## 6. Spring IoC and Dependency Injection (DI)

### Inversion of Control (IoC)
A principle where the control of object creation and lifecycle is transferred from the developer to the **Spring Container** (ApplicationContext). Instead of `new Service()`, the container creates, configures, and manages the object.

### Dependency Injection (DI)
The mechanism to implement IoC. Instead of an object creating its dependencies, the container **injects** them:

```java
// WITHOUT DI — tight coupling
class OrderService {
    private PaymentGateway gateway = new StripeGateway(); // Hard-coded dependency
}

// WITH DI — loose coupling
@Service
class OrderService {
    private final PaymentGateway gateway; // Interface, not implementation
    
    @Autowired // Constructor injection (recommended)
    OrderService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
```

### Injection Types (ranked by recommendation)

| Type | Pros | Cons |
|:-----|:-----|:-----|
| **Constructor** (recommended) | Immutable (`final` fields), testable, fails fast | Verbose for many dependencies |
| **Setter** | Optional dependencies, reconfigurable | Mutable, easy to forget |
| **Field** (`@Autowired` on field) | Concise | Untestable without reflection, hides dependencies |

### Bean Lifecycle
```
Constructor → @PostConstruct → afterPropertiesSet() → Custom init → 
Ready → 
@PreDestroy → destroy() → Custom destroy
```

## 7. What is WeakHashMap?

A `WeakHashMap` stores keys as **WeakReferences**. When a key has no more strong references anywhere in the program, the GC can reclaim it and the entry is automatically removed from the map.

**Use case:** Metadata/annotation caches where the cache entry should live only as long as the key object is in use. Example: caching computed properties of objects without preventing those objects from being garbage collected.

```java
WeakHashMap<ClassLoader, Map<String, Class<?>>> classCache = new WeakHashMap<>();
// When a ClassLoader is unloaded, its cached classes are automatically cleaned up
```

**Caveat:** String literal keys are **never** garbage collected (they live in the String Pool). Use `new String("key")` for testing, but be aware this defeats the purpose in production.

## 8. Functional Interfaces (Java 8)

A **Functional Interface** has exactly **one abstract method** (SAM — Single Abstract Method). It can have any number of `default` or `static` methods.

### Built-in Functional Interfaces

| Interface | Signature | Example |
|:----------|:----------|:--------|
| `Predicate<T>` | `T → boolean` | `filter()`, validation |
| `Function<T,R>` | `T → R` | `map()`, transformation |
| `Consumer<T>` | `T → void` | `forEach()`, logging |
| `Supplier<T>` | `() → T` | Factory methods, lazy init |
| `UnaryOperator<T>` | `T → T` | `replaceAll()` |
| `BinaryOperator<T>` | `(T, T) → T` | `reduce()` |
| `BiFunction<T,U,R>` | `(T, U) → R` | `merge()`, `replaceAll()` |

### Lambda Implementation (Under the Hood)
Lambdas are **not** compiled to anonymous inner classes. They use `invokedynamic` bytecode + `LambdaMetafactory`:
1. First call: JVM generates a class at runtime (no `.class` file on disk)
2. Subsequent calls: reuse the generated class (cached)
3. **Benefit:** No `.class` file explosion, potential for JIT optimization, less memory overhead

## 9. ConcurrentHashMap vs. SynchronizedMap

| Feature | SynchronizedMap | ConcurrentHashMap |
|:--------|:---------------|:-----------------|
| **Locking** | Single mutex on entire map | CAS + per-node `synchronized` (Java 8+) |
| **Read concurrency** | Blocked (readers wait for writers) | **Lock-free** (volatile reads) |
| **Write concurrency** | One writer at a time | Multiple writers to different buckets |
| **Null keys/values** | Allowed | **Not allowed** |
| **Atomic operations** | `putIfAbsent`, `computeIfAbsent` NOT atomic | `putIfAbsent`, `computeIfAbsent` ARE atomic |
| **Iterator** | Fail-fast | Weakly consistent |
| **Scalability** | Poor (serializes all access) | Excellent |

**When to use SynchronizedMap:** Only when you need null keys/values in a thread-safe map (very rare). For everything else, use `ConcurrentHashMap`.

---