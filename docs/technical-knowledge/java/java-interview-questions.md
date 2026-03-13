---
id: java-interview-questions
title: "Java Interview Questions & Answers"
slug: java-interview-questions
description: Curated Java interview questions and answers spanning core language topics, JVM internals, collections, concurrency, and OOP.
tags: [java, interview-questions, core-java, backend]
---

# Java Interview Questions & Answers

A curated collection of Java interview questions and answers organized by topic and difficulty level. Questions are drawn from real interview scenarios and cover core Java through expert-level topics.

**Difficulty Levels:**
- 🟢 Intermediate — Solid fundamentals expected
- 🟡 Advanced — Deep understanding required
- 🔴 Expert — Production experience and system design knowledge

---

## 1. Core Java & OOP

### 🟢 What does Java use: pass by value or pass by reference?

Java uses **pass by value**. For primitive types, Java copies the actual value. For objects, Java copies the **reference value** (the memory address), not the object itself. Changes to the parameter inside a method do not affect the original reference outside the method, but you can modify the object's internal state through the copied reference.

```java
void modify(List<String> list) {
    list.add("item");      // Modifies the object — visible to caller
    list = new ArrayList<>(); // Reassigns local reference only — NOT visible to caller
}
```

### 🟢 What is the impact of declaring a method as `final` on inheritance?

Declaring a method as `final` prevents it from being **overridden** in any subclass. This ensures the method's behavior remains consistent across the class hierarchy. It's commonly used when a specific algorithm or security-sensitive operation must not be altered by subclasses.

### 🟢 Can method overloading be determined at runtime?

No. Method overloading is resolved at **compile-time** based on the method signature (name + parameter types). This differs from method **overriding**, which is resolved at runtime via dynamic dispatch based on the object's actual type.

### 🟢 What is a marker interface?

A marker interface has **no methods or fields**. It "marks" a class with a certain capability, enabling `instanceof` checks at runtime. Examples include `Serializable` and `Cloneable`.

```java
// Custom marker interface
public interface Transmittable {}

// Usage: only transmit objects that implement Transmittable
if (data instanceof Transmittable) {
    transmit(data);
}
```

### 🟢 Can you modify a `final` object reference in Java?

You cannot reassign a `final` reference to a different object. However, the **object itself** can still be mutated if it's mutable:

```java
final List<String> list = new ArrayList<>();
list.add("item");           // ✅ Allowed — mutating the object
list = new ArrayList<>();   // ❌ Compile error — reassigning the reference
```

### 🟡 What are inner classes in Java?

Inner classes are classes defined within another class. They have access to the outer class's members (even private ones). Types include:

| Type | Description |
|------|-------------|
| **Non-static inner class** | Tied to an instance of the outer class |
| **Static nested class** | Not tied to an outer instance; can have static members |
| **Local class** | Defined inside a method |
| **Anonymous class** | Unnamed class defined and instantiated inline |

Non-static inner classes **cannot** contain static declarations, because they are associated with an instance of the outer class. Static nested classes can.

### 🟡 What is TypeErasure?

Type Erasure is the process by which the Java compiler removes generic type information after compilation. At runtime, `List<Integer>` and `List<String>` are both just `List`. This ensures backward compatibility with pre-generics code but means generic type information is unavailable via reflection.

```java
// At compile time: type-safe
List<String> strings = new ArrayList<>();
// At runtime: type information erased
// Both are just ArrayList
```

### 🟡 Why can't we create an array of generic types in Java?

Arrays require concrete type information at runtime to enforce type safety (they perform runtime type checks on insertion). Due to type erasure, generic type information is unavailable at runtime, creating a fundamental incompatibility:

```java
// ❌ Compile error:
// T[] array = new T[10];

// ✅ Workaround using Object array with cast:
@SuppressWarnings("unchecked")
T[] array = (T[]) new Object[10];
```

### 🟡 How would generics help maintain type safety and reduce code duplication?

Generics allow classes, methods, and collections to use **type parameters**, catching type mismatches at compile time instead of runtime. A single generic implementation works with multiple types, eliminating the need for type-specific duplicates:

```java
// Without generics: separate methods or unsafe casting
Object item = list.get(0);
String s = (String) item; // ClassCastException risk

// With generics: compile-time safety, no duplication
List<String> list = new ArrayList<>();
String s = list.get(0); // Type-safe, no cast needed
```

### 🔴 What happens if a `final` field is changed using reflection?

Reflection can bypass compile-time restrictions and modify a `final` field using `field.setAccessible(true)`. However, this **breaks the immutability contract** and can lead to unpredictable behavior because the JIT compiler may inline final field values at compile time. This should be avoided in production code.

### 🔴 How have records and sealed classes impacted OOP?

**Records** (Java 14+) provide a concise way to model immutable data, auto-generating `equals()`, `hashCode()`, and `toString()`, reinforcing encapsulation and immutability.

**Sealed classes** (Java 15+) restrict which classes can extend them, giving precise control over inheritance hierarchies and enabling exhaustive pattern matching:

```java
// Record: immutable data carrier
record Point(int x, int y) {}

// Sealed class: controlled hierarchy
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
```

---

## 2. Collections & Data Structures

### 🟢 What are the potential issues with using mutable objects as HashMap keys?

If a key object's state changes after insertion, its `hashCode()` changes, making the entry **unreachable** in the map — even though it still exists. This causes data loss and potential memory leaks. Always use **immutable objects** as map keys.

### 🟢 What happens if you override only `equals()` and not `hashCode()`?

The `HashMap` contract requires that **equal objects must have the same hash code**. Without consistent `hashCode()`, the map may store duplicate keys or fail to find existing entries, since it uses hash codes to locate buckets before checking `equals()`.

### 🟢 What is the difference between `HashMap` and `IdentityHashMap`?

| Aspect | `HashMap` | `IdentityHashMap` |
|--------|-----------|-------------------|
| Key comparison | `equals()` + `hashCode()` (logical equality) | `==` (reference equality) |
| Use case | General-purpose mapping | Identity-based operations (e.g., serialization graphs) |

### 🟢 How does `Collections.sort()` work internally?

It uses **TimSort**, a modified merge sort that is stable (preserves equal-element order) and optimized for partially sorted data. It breaks the list into small runs, sorts them with insertion sort, and merges them.

### 🟡 What causes `ConcurrentModificationException` and how do you prevent it?

It occurs when a collection is structurally modified while being iterated. Prevention strategies:

1. Use **iterator's `remove()`** method during iteration
2. Use **concurrent collections** (`CopyOnWriteArrayList`, `ConcurrentHashMap`)
3. Use **`removeIf()`** for conditional removal
4. Collect items to remove in a separate list, then remove after iteration

```java
// ❌ Throws ConcurrentModificationException
for (String s : list) {
    if (s.isEmpty()) list.remove(s);
}

// ✅ Safe removal
list.removeIf(String::isEmpty);
```

### 🟡 When would `LinkedHashSet` outperform `TreeSet` and vice versa?

| Scenario | Best Choice | Reason |
|----------|-------------|--------|
| Frequent insertions/lookups | `LinkedHashSet` | O(1) operations |
| Insertion order preservation | `LinkedHashSet` | Maintains order by design |
| Sorted element access | `TreeSet` | Auto-sorted, O(log n) operations |
| Range queries (`subSet`, `headSet`) | `TreeSet` | Navigable sorted structure |

### 🟡 How would you implement an LRU cache?

Use a `LinkedHashMap` with access-order enabled, overriding `removeEldestEntry()`:

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true); // true = access order
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}
```

### 🟡 What is the difference between `Collections.sort()` and `Stream.sorted()`?

| Aspect | `Collections.sort()` | `Stream.sorted()` |
|--------|---------------------|-------------------|
| Mutability | **Mutates** the original list | Returns a **new** sorted stream |
| Style | Imperative | Functional/declarative |
| Chaining | Standalone operation | Chainable in a pipeline |
| Source | Works only on `List` | Works on any stream source |

### 🔴 How does `ConcurrentHashMap` work internally?

**Java 7:** Uses **segment-based locking** — the map is divided into segments, each with its own lock, allowing concurrent writes to different segments.

**Java 8+:** Replaced segments with **node-level locking** using CAS (Compare-And-Swap) operations and `synchronized` blocks on individual bins. Read operations are generally **lock-free** using `volatile` reads. The structure uses an array of nodes, where each bin can be a linked list or a **red-black tree** (when a bin exceeds 8 entries).

---

## 3. Java 8 Features

### 🟢 What is a Functional Interface?

An interface with **exactly one abstract method**. It can have default/static methods. The `@FunctionalInterface` annotation provides compile-time enforcement:

| Interface | Method | Purpose |
|-----------|--------|---------|
| `Function<T,R>` | `R apply(T)` | Transform T → R |
| `Predicate<T>` | `boolean test(T)` | Filter T → boolean |
| `Consumer<T>` | `void accept(T)` | Side-effect T → void |
| `Supplier<T>` | `T get()` | Factory () → T |

### 🟢 What is the difference between `map()` and `flatMap()` in Streams?

`map()` transforms each element 1:1. `flatMap()` transforms each element into a stream and then **flattens** all resulting streams into one:

```java
// map: List<String> → Stream of uppercase strings
list.stream().map(String::toUpperCase);

// flatMap: List<List<String>> → single Stream<String>
listOfLists.stream().flatMap(Collection::stream);
```

### 🟢 What is the difference between `Optional.of()` and `Optional.ofNullable()`?

| Method | Null handling | Use when |
|--------|--------------|----------|
| `Optional.of(value)` | Throws `NullPointerException` if null | Value is guaranteed non-null |
| `Optional.ofNullable(value)` | Returns `Optional.empty()` if null | Value might be null |

### 🟢 What is the difference between `findFirst()` and `findAny()` in Streams?

`findFirst()` returns the **first element** in encounter order — deterministic and useful for sequential streams. `findAny()` returns **any element** and is optimized for **parallel streams** where it can return whichever element is found first across threads.

### 🟡 What is the difference between `peek()` and `map()`?

`map()` **transforms** elements and returns a new stream of transformed values. `peek()` is for **side effects** (like logging) and returns the same stream unmodified. Caution: `peek()` behavior is unpredictable for purposes other than debugging, since intermediate operations may not execute if there's no terminal operation.

### 🟡 How does Java 8 handle parallel processing with Streams?

`parallelStream()` or `.parallel()` splits data into chunks processed concurrently via the **ForkJoinPool.commonPool()**. The pool typically has `Runtime.getRuntime().availableProcessors() - 1` threads. The framework handles data splitting, parallel execution, and result merging automatically.

> **Caution:** Parallel streams are not always faster. Overhead from splitting, thread coordination, and merging can outweigh gains for small datasets or simple operations.

### 🟡 Can you use `this` and `super` in a Lambda expression?

Yes, but they refer to the **enclosing instance**, not the lambda itself (lambdas have no `this`). `this` refers to the class where the lambda is defined; `super` refers to its superclass. This differs from anonymous classes, where `this` refers to the anonymous class instance.

### 🟡 What happens if you modify a local variable inside a Lambda?

It causes a **compile-time error**. Local variables accessed from within a lambda must be `final` or **effectively final** (not modified after initialization). This ensures thread safety and prevents side effects in functional-style code.

### 🟡 How do Default Methods in interfaces affect design decisions vs abstract classes?

Default methods blur the line between interfaces and abstract classes by allowing interfaces to provide implementations. Key differences remain:

| Feature | Interface (with defaults) | Abstract Class |
|---------|--------------------------|----------------|
| Multiple inheritance | ✅ A class can implement many | ❌ Single inheritance |
| State (fields) | ❌ Only constants | ✅ Instance fields |
| Constructors | ❌ None | ✅ Supported |
| Access modifiers | `public` only (until Java 9) | Any access level |

**Choose interfaces** for shared behavior across unrelated types. **Choose abstract classes** when shared state or a common base is needed.

### 🟡 Can a Lambda throw an exception?

Yes. **Unchecked exceptions** can be thrown freely. **Checked exceptions** must either be caught within the lambda or the functional interface must declare them. Since standard functional interfaces (e.g., `Function`, `Predicate`) don't declare checked exceptions, you need a try-catch inside the lambda or a custom functional interface.

---

## 4. Concurrency & Multithreading

### 🟢 How would you ensure safe access to a shared resource by multiple threads?

Use synchronization mechanisms:
1. **`synchronized`** keyword on methods or blocks
2. **`ReentrantLock`** for advanced locking with fairness and timeouts
3. **Atomic classes** (`AtomicInteger`, `AtomicReference`) for lock-free thread safety
4. **Concurrent collections** (`ConcurrentHashMap`, `CopyOnWriteArrayList`)

### 🟢 What is the significance of `volatile` in Java concurrency?

The `volatile` keyword ensures that reads and writes to a variable go directly to **main memory**, bypassing CPU caches. This guarantees **visibility** — changes by one thread are immediately visible to others. However, `volatile` does **not** provide atomicity for compound operations (e.g., `count++`).

### 🟢 Can `volatile` replace `synchronized`?

No. `volatile` ensures **visibility** but not **mutual exclusion**. For compound operations (check-then-act, read-modify-write), you still need `synchronized` or `Lock`:

```java
// ❌ Not thread-safe even with volatile
volatile int count = 0;
count++; // This is read + increment + write (3 operations)

// ✅ Thread-safe alternatives
synchronized(this) { count++; }
// or
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
```

### 🟢 What are the differences between `Runnable` and `Callable`?

| Feature | `Runnable` | `Callable<V>` |
|---------|-----------|---------------|
| Method | `void run()` | `V call()` |
| Return value | None | Returns a result |
| Checked exceptions | Cannot throw | Can throw |
| Usage with Executor | `execute()` or `submit()` | `submit()` only |

### 🟡 What is the difference between `synchronized` and `ReentrantLock`?

| Feature | `synchronized` | `ReentrantLock` |
|---------|---------------|-----------------|
| Lock acquisition | Implicit (enter block) | Explicit (`lock()` / `unlock()`) |
| Fairness | No control | Configurable fair/unfair |
| Try-lock | Not possible | `tryLock(timeout)` supported |
| Interruptible | No | `lockInterruptibly()` supported |
| Multiple conditions | One wait-set per monitor | Multiple `Condition` objects |
| Automatic release | Yes (on block exit/exception) | Manual (must call `unlock()` in `finally`) |

### 🟡 Can a deadlock occur with a single thread?

A single thread can experience a **self-deadlock** if it tries to recursively acquire a **non-reentrant lock** it already holds. This is rare and typically a programming error. `ReentrantLock` and `synchronized` (which is reentrant) prevent this by design.

### 🟡 What is the difference between synchronized and concurrent collections?

**Synchronized collections** (e.g., `Collections.synchronizedList()`) wrap standard collections with a single lock — only one thread accesses at a time. **Concurrent collections** (e.g., `ConcurrentHashMap`, `CopyOnWriteArrayList`) use fine-grained locking or lock-free algorithms, allowing higher throughput under contention.

### 🟡 What is `CountDownLatch` vs `CyclicBarrier`?

| Feature | `CountDownLatch` | `CyclicBarrier` |
|---------|-----------------|-----------------|
| Reusable | ❌ One-time use | ✅ Can be reset |
| Direction | N threads count down, 1+ threads wait | N threads wait for each other |
| Action on completion | None built-in | Optional barrier action |
| Use case | Wait for services to initialize | Multi-phase computation |

### 🟡 How does the Executor Framework handle task interruption?

Tasks check for interruption via `Thread.interrupted()` or `isInterrupted()`. Best practices:
1. Regularly check interruption status in long-running tasks
2. Catch `InterruptedException` and clean up resources
3. Use `Future.cancel(true)` to interrupt running tasks
4. Restore the interrupt flag if catching `InterruptedException` without terminating

### 🟡 What is `RejectedExecutionHandler` in `ThreadPoolExecutor`?

Handles tasks that cannot be executed when the pool and queue are full. Built-in policies:

| Policy | Behavior |
|--------|----------|
| `AbortPolicy` (default) | Throws `RejectedExecutionException` |
| `CallerRunsPolicy` | Executes task in the submitting thread |
| `DiscardPolicy` | Silently discards the task |
| `DiscardOldestPolicy` | Discards oldest queued task, retries submission |

### 🔴 Explain the difference between visibility and atomicity in multithreading.

**Visibility**: Whether changes made by one thread are seen by other threads. Solved by `volatile`, `synchronized`, or memory barriers.

**Atomicity**: Whether an operation completes as an indivisible unit. A `volatile long` read/write is atomic on 64-bit, but `count++` on a `volatile int` is NOT atomic (it's read + modify + write). Atomic classes or locks are needed for compound operations.

### 🔴 Explain the internal working of `ThreadPoolExecutor`.

1. **Task submitted** → If active threads < `corePoolSize`, create a new worker thread
2. **Core full** → Place task in the `workQueue` (e.g., `LinkedBlockingQueue`)
3. **Queue full** → If active threads < `maximumPoolSize`, create a new thread
4. **Max reached + queue full** → Invoke `RejectedExecutionHandler`
5. **Idle threads** exceeding `corePoolSize` are terminated after `keepAliveTime`

States: `RUNNING` → `SHUTDOWN` (no new tasks, complete existing) → `STOP` (interrupt all) → `TIDYING` → `TERMINATED`

### 🔴 How many threads does a parallel stream use?

Parallel streams default to the **ForkJoinPool.commonPool()**, which has `availableProcessors() - 1` threads. You can customize this:

```java
// Custom pool with specific parallelism
ForkJoinPool customPool = new ForkJoinPool(8);
customPool.submit(() ->
    list.parallelStream()
        .filter(...)
        .collect(Collectors.toList())
).get();
```

### 🔴 Write the Producer/Consumer problem using `wait`/`notify`.

```java
class ProducerConsumer {
    private final LinkedList<Integer> buffer = new LinkedList<>();
    private final int CAPACITY = 5;
    private int value = 0;

    public void produce() throws InterruptedException {
        while (true) {
            synchronized (this) {
                while (buffer.size() == CAPACITY) {
                    wait(); // Release lock and wait for space
                }
                System.out.println("Produced: " + value);
                buffer.add(value++);
                notify(); // Notify consumer
            }
        }
    }

    public void consume() throws InterruptedException {
        while (true) {
            synchronized (this) {
                while (buffer.isEmpty()) {
                    wait(); // Release lock and wait for items
                }
                int consumed = buffer.removeFirst();
                System.out.println("Consumed: " + consumed);
                notify(); // Notify producer
            }
        }
    }
}
```

Key points:
- **`while` loop** (not `if`) for wait condition — guards against spurious wakeups
- **`wait()`** releases the monitor lock and suspends the thread
- **`notify()`** wakes one waiting thread; `notifyAll()` wakes all

---

## 5. Memory Management & JVM

### 🟢 How does Java handle memory leaks?

Java's garbage collector automatically reclaims unreachable objects. However, **memory leaks still occur** when objects are unintentionally retained:
- Static collections holding references indefinitely
- Unclosed resources (streams, connections)
- Listener/callback accumulation
- Inner classes holding outer class references
- ThreadLocal variables not cleaned up

### 🟢 What is the difference between `NoClassDefFoundError` and `ClassNotFoundException`?

| Error | When | Cause |
|-------|------|-------|
| `ClassNotFoundException` | Runtime (Class.forName, ClassLoader) | Class not on classpath |
| `NoClassDefFoundError` | Runtime | Class was available at compile time but not at runtime (e.g., static initializer failure) |

### 🟢 How does the `static` keyword affect memory management?

Static fields and methods are stored in the **Method Area/Metaspace** (not per-instance heap memory). They are created when the class is loaded and persist as long as the class is loaded, shared among all instances. This can inadvertently cause memory leaks if static collections grow unboundedly.

### 🟡 What is Metaspace and how does it differ from PermGen?

| Aspect | PermGen (≤ Java 7) | Metaspace (Java 8+) |
|--------|-------------------|---------------------|
| Location | JVM heap | Native memory |
| Sizing | Fixed (`-XX:MaxPermSize`) | Dynamic (grows as needed) |
| OOM risk | Frequent (`OutOfMemoryError: PermGen`) | Rare (uses native memory) |
| Content | Class metadata, string pool, static vars | Class metadata only |

### 🟡 What are Strong, Weak, Soft, and Phantom References?

| Type | GC Behavior | Use Case |
|------|-------------|----------|
| **Strong** | Never collected while reachable | Normal object references |
| **Soft** | Collected only when JVM is low on memory | Memory-sensitive caches |
| **Weak** | Collected at next GC cycle | `WeakHashMap`, canonicalizing maps |
| **Phantom** | Enqueued after finalization, before memory reclaim | Resource cleanup tracking |

### 🟡 How does garbage collection handle circular references?

Java's GC uses **reachability analysis** from GC roots (stack frames, static fields, JNI references), not reference counting. Objects in a circular reference are collected if none of them are reachable from any GC root — the circular references don't prevent collection.

### 🟡 What is the difference between `Class.forName()` and `ClassLoader.loadClass()`?

| Method | Initialization | Use when |
|--------|---------------|----------|
| `Class.forName()` | Loads AND initializes (runs static blocks) | Class needs immediate initialization |
| `ClassLoader.loadClass()` | Loads but does NOT initialize | Deferring initialization for performance |

### 🔴 How would you investigate an `OutOfMemoryError`?

1. **Check JVM settings**: `-Xms`, `-Xmx` heap size configuration
2. **Capture heap dump**: `-XX:+HeapDumpOnOutOfMemoryError` or `jmap -dump:live,format=b`
3. **Analyze with tools**: Eclipse MAT, VisualVM, JProfiler
4. **Review code**: Look for unbounded caches, unclosed resources, large collections
5. **Monitor runtime**: Use JConsole/VisualVM to track heap usage patterns over time
6. **Check Metaspace**: If the error mentions Metaspace, investigate class loading leaks

### 🔴 Explain all garbage collectors up to the latest Java release.

| Collector | Threads | Pause | Best For |
|-----------|---------|-------|----------|
| **Serial GC** | Single | Stop-the-world | Small apps, single-core |
| **Parallel GC** | Multi | Stop-the-world | Throughput-focused batch jobs |
| **CMS** | Concurrent mark + sweep | Short pauses | Legacy responsive apps (deprecated) |
| **G1 GC** | Concurrent + parallel | Predictable pauses | General purpose (default Java 11+) |
| **ZGC** | Concurrent | Ultra-low (< 1ms) | Large heaps, latency-critical |
| **Shenandoah** | Concurrent | Low-latency | Large heaps, similar to ZGC |

**Defaults by version:**
- Java 8–10: Parallel GC
- Java 11+: G1 GC
- ZGC and Shenandoah available from Java 15+

### 🔴 How would you structure code to avoid memory leaks in long-running applications?

1. **Close resources** with try-with-resources
2. **Use weak references** for cache objects (`WeakHashMap`, `SoftReference`)
3. **Avoid static references** to large or growing collections
4. **Unregister listeners/callbacks** when no longer needed
5. **Clean up `ThreadLocal`** variables (call `remove()`)
6. **Use connection pooling** for database/network resources
7. **Profile regularly** with VisualVM or Java Flight Recorder

### 🔴 How do you create a high-performance system with minimal GC?

- Reduce object creation: prefer primitives over wrapper types
- **Object pooling** for frequently created/destroyed objects
- Reuse collections with `clear()` instead of re-allocating
- Use off-heap storage for large datasets (`ByteBuffer.allocateDirect()`)
- Choose the right GC: ZGC or Shenandoah for low-latency
- Tune JVM: `-Xms` = `-Xmx` to avoid heap resizing, appropriate young/old gen ratios

---

## 6. Design Patterns & Best Practices

### 🟢 What is the Builder Pattern and how does it differ from Factory?

| Aspect | Builder Pattern | Factory Pattern |
|--------|----------------|-----------------|
| Purpose | Construct complex objects **step by step** | Create objects **in a single step** |
| Control | Fine-grained control over construction | Hides creation logic from client |
| Use case | Many optional parameters | Choosing between related types |

```java
// Builder pattern
User user = User.builder()
    .name("Alice")
    .email("alice@example.com")
    .age(30)
    .build();
```

### 🟡 What is the difference between Strategy and State patterns?

Both use composition and polymorphism, but serve different purposes:

| Aspect | Strategy | State |
|--------|----------|-------|
| Purpose | Select an **algorithm** at runtime | Change behavior based on **internal state** |
| Trigger | External (client chooses strategy) | Internal (state transitions) |
| Awareness | Strategies are independent | States know about transitions |

### 🟡 How would you apply the Observer pattern in an event-driven application?

**Observers** (listeners) register with a **subject** (event source). When the subject triggers an event, all registered observers are notified and react accordingly. This decouples event sources from response logic:

```java
// Subject
interface EventPublisher {
    void subscribe(EventListener listener);
    void unsubscribe(EventListener listener);
    void publish(Event event);
}

// Observer
interface EventListener {
    void onEvent(Event event);
}
```

### 🟡 How can you break a Singleton? How do you prevent it?

| Attack Vector | Prevention |
|---------------|------------|
| **Reflection** | Throw exception in constructor if instance exists |
| **Serialization** | Implement `readResolve()` returning the singleton |
| **Cloning** | Override `clone()` to throw `CloneNotSupportedException` |
| **Multiple classloaders** | Use enum-based singleton |

**Best approach**: Use an **enum** singleton, which prevents all of the above by design:

```java
public enum ConfigManager {
    INSTANCE;

    public String getConfig(String key) { /* ... */ }
}
```

### 🟡 Implement a thread-safe Singleton without `synchronized`.

**Bill Pugh Singleton** — leverages the classloader mechanism for lazy, thread-safe initialization:

```java
public class Singleton {
    private Singleton() {}

    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

The inner class `Holder` is loaded only when `getInstance()` is first called, and the JVM guarantees class loading is thread-safe.

### 🔴 How would you implement Singleton and Strategy patterns using enums?

```java
// Singleton via enum
public enum AppConfig {
    INSTANCE;
    private final Properties props = new Properties();
    public String get(String key) { return props.getProperty(key); }
}

// Strategy via enum
public enum SortStrategy {
    QUICKSORT {
        @Override public <T> void sort(List<T> list, Comparator<T> c) { /* quicksort impl */ }
    },
    MERGESORT {
        @Override public <T> void sort(List<T> list, Comparator<T> c) { /* mergesort impl */ }
    };

    public abstract <T> void sort(List<T> list, Comparator<T> c);
}

// Usage: SortStrategy.QUICKSORT.sort(myList, comparator);
```

---

## 7. Serialization & Class Loading

### 🟢 Can you serialize static fields in Java?

No. Serialization captures the **object's instance state**. Static fields belong to the class, not individual objects, and are excluded from serialization.

### 🟢 What happens if a `Serializable` class contains a non-serializable member?

A `NotSerializableException` is thrown during serialization. Solutions:
1. Mark the field as `transient` (excluded from serialization)
2. Make the member class implement `Serializable`
3. Provide custom `writeObject()`/`readObject()` methods

### 🟡 What are the differences between `Externalizable` and `Serializable`?

| Feature | `Serializable` | `Externalizable` |
|---------|---------------|-------------------|
| Implementation effort | None (marker interface) | Must implement `writeExternal()`/`readExternal()` |
| Control | Default mechanism | Complete control over serialization |
| Performance | Can be slower (serializes everything) | Can be faster (selective serialization) |
| `transient` fields | Supported | Not needed (you control what's written) |

### 🟡 What are the different types of class loaders in Java?

1. **Bootstrap ClassLoader** — Loads core Java classes (`java.lang`, `java.util` from `rt.jar`)
2. **Extension/Platform ClassLoader** — Loads extension classes from `lib/ext`
3. **Application/System ClassLoader** — Loads classes from application classpath

They follow the **parent delegation model**: each loader delegates to its parent first, only loading the class itself if the parent cannot.

### 🔴 What are dynamic proxies in Java?

Dynamic proxies create proxy instances for interfaces **at runtime**, without explicit class definitions. They intercept method calls via an `InvocationHandler`:

```java
interface UserService {
    User findById(long id);
}

UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    (proxyObj, method, args) -> {
        System.out.println("Calling: " + method.getName());
        // Delegate to real implementation, add logging/caching/etc.
        return realService.findById((long) args[0]);
    }
);
```

Used extensively in frameworks for AOP, transaction management, and lazy loading.

### 🔴 What is a hidden class (Java 15+)?

A hidden class is a **non-discoverable, dynamically created class** that cannot be found by name or via reflection. It's used by frameworks for runtime-generated classes (like lambda expressions and proxy classes). Benefits:
- Cannot pollute the application classpath
- Reduces classloader memory leaks
- Can be unloaded independently when no longer needed

---

## 8. Exception Handling

### 🟢 What happens when an exception is thrown in a static initialization block?

It wraps the exception in `ExceptionInInitializerError`, and subsequent attempts to use the class throw `NoClassDefFoundError` because the class failed to initialize.

### 🟢 When would you use a checked exception over an unchecked one?

Use **checked exceptions** for recoverable conditions that the caller should handle (e.g., `IOException`, `SQLException`). Use **unchecked exceptions** for programming errors (e.g., `NullPointerException`, `IllegalArgumentException`).

### 🟡 Why is catching `Throwable` considered bad practice?

`Throwable` is the superclass of both `Exception` and `Error`. Catching it intercepts JVM-level errors like `OutOfMemoryError` and `StackOverflowError`, which typically indicate unrecoverable conditions. Handling these errors can mask critical problems and lead to system instability.

### 🟡 What unexpected behavior can the `finally` block cause?

If a new exception is thrown in `finally`, it **replaces** the original exception from the `try` block, causing it to be lost:

```java
try {
    throw new RuntimeException("Original");
} finally {
    throw new RuntimeException("From finally"); // Original exception is lost!
}
// Only "From finally" propagates
```

**Best practice:** Use try-with-resources instead of manual `finally` blocks for resource cleanup.

---

## 9. Modern Java Features (Java 9+)

### 🟡 How does the module system (Java 9) impact application architecture?

The **Java Platform Module System (JPMS)** enables:
- **Explicit dependencies** via `module-info.java`
- **Strong encapsulation** — internal packages are hidden by default
- **Reduced memory footprint** — load only required modules
- **Improved security** — no access to unexported internals

```java
module com.myapp.core {
    requires java.sql;
    exports com.myapp.core.api;    // Public API
    // com.myapp.core.internal is hidden
}
```

### 🟡 What is the purpose of `@Retention` and `@Target` annotations?

**`@Retention`** controls how long an annotation is available:
| Value | Available at |
|-------|-------------|
| `SOURCE` | Source code only (discarded by compiler) |
| `CLASS` | Compiled bytecode (not available via reflection) |
| `RUNTIME` | Runtime (accessible via reflection) |

**`@Target`** restricts where an annotation can be applied: `METHOD`, `FIELD`, `TYPE`, `CONSTRUCTOR`, `PARAMETER`, etc.

### 🟡 What is a `record` in Java (14+)?

A concise declaration for **immutable data carriers** that auto-generates `equals()`, `hashCode()`, `toString()`, and accessor methods:

```java
record Point(int x, int y) {}

// Equivalent to a class with:
// - final fields x, y
// - Constructor Point(int x, int y)
// - Accessors x(), y()
// - equals(), hashCode(), toString()
```

### 🟡 What is a sealed class (Java 15+)?

A sealed class restricts which classes can extend it, enabling exhaustive type hierarchies:

```java
sealed interface Shape permits Circle, Rectangle, Triangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
final class Triangle implements Shape { /* ... */ }
```

Benefits: Type safety, exhaustive pattern matching, controlled extensibility.

### 🔴 How does the Java Reflection API work, and what are its use cases?

Reflection allows runtime inspection and modification of classes, methods, and fields. The API can:
- Create instances dynamically
- Invoke methods by name
- Access and modify private fields
- Inspect annotations

**Use cases:** Dependency injection (Spring), ORM mapping (Hibernate), test frameworks (JUnit), serialization

**Caution:** Reflection bypasses access control, has performance overhead, and can break encapsulation. Use sparingly and prefer compile-time alternatives when possible.

---

## 10. Performance & Troubleshooting

### 🟡 What tools and techniques identify memory leaks?

| Tool | Purpose |
|------|---------|
| **VisualVM** | Real-time heap monitoring, thread analysis |
| **Eclipse MAT** | Heap dump analysis, dominator tree, leak suspects |
| **JProfiler / YourKit** | CPU + memory profiling |
| **Java Flight Recorder** | Low-overhead production profiling |
| **jmap** | Heap dump generation |
| **jstat** | GC statistics monitoring |

### 🟡 What are the disadvantages of JIT compilation?

- **Higher memory usage** during compilation of bytecode to native code
- **Increased CPU load** during initial execution (warm-up phase)
- **Startup overhead** — short-lived applications may terminate before JIT benefits kick in

Consider disabling JIT (`-Djava.compiler=NONE`) for development/debugging or use **AOT compilation** (GraalVM Native Image) for fast-startup scenarios.

### 🔴 How would you improve scalability and memory efficiency of a large Java application?

1. **Efficient data structures** — choose the right collection for access patterns
2. **Object pooling** — reuse expensive objects (connections, threads)
3. **Caching** — Redis/Caffeine for frequently accessed data
4. **Lazy initialization** — create objects only when needed
5. **Connection pooling** — HikariCP for database connections
6. **JVM tuning** — heap size, GC selection, Metaspace config
7. **Horizontal scaling** — distribute load across instances
8. **Remove unnecessary references** — prevent memory leaks
9. **Profile continuously** — identify hotspots with JFR/async-profiler

### 🔴 What performance optimizations have you applied in Java projects?

Common optimization strategies:
- **Caching** (Redis, Caffeine) to reduce database calls
- **Query optimization** — proper indexing, batch operations
- **Appropriate data structures** — `ConcurrentHashMap` over `synchronized HashMap`
- **Connection pooling** (HikariCP) for database access
- **JVM tuning** — GC selection, heap sizing
- **Lazy loading** — defer expensive initialization
- **Async processing** — `CompletableFuture` for non-blocking operations
