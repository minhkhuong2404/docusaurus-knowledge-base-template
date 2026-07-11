---
id: java-fundamentals
title: "Java Fundamentals: Core Language Concepts"
slug: java-fundamentals
description: Covers Java fundamentals, including the platform model, syntax, types, control flow, and essential language concepts.
tags: [java, fundamentals, core-java, beginner]
---

import StringConstantPoolDiagram from '@site/src/components/StringConstantPoolDiagram';
import ExceptionHierarchyDiagram from '@site/src/components/ExceptionHierarchyDiagram';

# Java Fundamentals: Core Language Concepts

A comprehensive guide to Java's foundational concepts — from the platform architecture to core syntax, OOP principles, and essential language features every developer should know.

---

## 1. Java Platform Overview

### JVM vs JDK vs JRE

| Component | Description |
|-----------|-------------|
| **JVM** (Java Virtual Machine) | Executes Java bytecode. Platform-specific — each OS has its own JVM implementation. |
| **JRE** (Java Runtime Environment) | JVM + core class libraries. Everything needed to **run** Java programs. |
| **JDK** (Java Development Kit) | JRE + development tools (compiler `javac`, debugger, profiler). Everything needed to **develop** Java programs. |

> **Note:** Since Java 11, Oracle no longer ships standalone JRE distributions. The JDK is the standard distribution.

### Bytecode & "Compile Once, Run Anywhere"

Java source code (`.java`) is compiled by `javac` into **bytecode** (`.class` files), which is platform-independent. The JVM interprets or JIT-compiles bytecode into native machine code at runtime.

```
Source.java  →  javac  →  Source.class (bytecode)  →  JVM  →  Native execution
```

This two-stage approach gives Java its portability: the same `.class` files run on any platform with a compatible JVM.

### AOT vs JIT Compilation

- **JIT (Just-In-Time):** Compiles bytecode to native code at runtime. Enables optimizations based on runtime profiling (hot-spot detection, inlining).
- **AOT (Ahead-Of-Time):** Compiles directly to native code before execution (e.g., GraalVM Native Image). Faster startup, lower memory, but loses some runtime optimization opportunities.

---

## 2. Data Types & Variables

### Primitive Types

Java has 8 primitive types:

| Type | Size | Default | Range |
|------|------|---------|-------|
| `byte` | 1 byte | 0 | -128 to 127 |
| `short` | 2 bytes | 0 | -32,768 to 32,767 |
| `int` | 4 bytes | 0 | -2³¹ to 2³¹ - 1 |
| `long` | 8 bytes | 0L | -2⁶³ to 2⁶³ - 1 |
| `float` | 4 bytes | 0.0f | IEEE 754 single-precision |
| `double` | 8 bytes | 0.0d | IEEE 754 double-precision |
| `char` | 2 bytes | '\u0000' | 0 to 65,535 (Unicode) |
| `boolean` | ~1 byte | false | true / false |

### Autoboxing & Unboxing

Java automatically converts between primitives and their wrapper classes:

```java
// Autoboxing: int → Integer
Integer wrapped = 42;

// Unboxing: Integer → int
int unwrapped = wrapped;
```

**Pitfall — Integer Cache:** Java caches `Integer` values from **-128 to 127**. Comparisons with `==` work for cached values but fail for larger numbers:

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b);  // true (cached)

Integer c = 200;
Integer d = 200;
System.out.println(c == d);  // false (different objects)
System.out.println(c.equals(d));  // true (correct way)
```

### BigDecimal for Precision

Floating-point types (`float`, `double`) cannot represent all decimal numbers exactly. For financial calculations, use `BigDecimal`:

```java
// WRONG: floating-point imprecision
System.out.println(0.1 + 0.2);  // 0.30000000000000004

// CORRECT: BigDecimal
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));  // 0.3
```

> **Always use the `String` constructor** for `BigDecimal`, not the `double` constructor, to avoid inheriting floating-point imprecision.

---

## 3. Object-Oriented Programming

### Three Pillars of OOP

#### Encapsulation

Hide internal state and expose behavior through methods. Use access modifiers to control visibility:

| Modifier | Class | Package | Subclass | World |
|----------|-------|---------|----------|-------|
| `private` | ✅ | ❌ | ❌ | ❌ |
| (default) | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

#### Inheritance

A class can extend another class to inherit fields and methods. Java supports **single inheritance** (one parent class) but allows implementing multiple interfaces.

```java
public class Animal {
    protected String name;
    public void speak() { System.out.println("..."); }
}

public class Dog extends Animal {
    @Override
    public void speak() { System.out.println("Woof!"); }
}
```

#### Polymorphism

A parent reference can point to a child object. The actual method invoked is determined at **runtime** (dynamic dispatch):

```java
Animal animal = new Dog();
animal.speak();  // Prints "Woof!" — runtime polymorphism
```

### Interfaces vs Abstract Classes

| Feature | Interface | Abstract Class |
|---------|-----------|---------------|
| Multiple inheritance | ✅ (implement many) | ❌ (extend one) |
| Constructors | ❌ | ✅ |
| Fields | Only `static final` | Any field type |
| Default methods | ✅ (since Java 8) | ✅ |
| Purpose | Define a **contract** | Provide **shared base** with partial implementation |

### Deep Copy vs Shallow Copy

- **Shallow copy:** Copies the object but shares references to nested objects.
- **Deep copy:** Copies the object and recursively copies all nested objects.

```java
// Shallow copy — address is shared
Person copy = original.clone();
copy.getAddress().setCity("New York");  // also changes original!

// Deep copy — address is duplicated
Person deepCopy = new Person(original.getName(),
    new Address(original.getAddress().getCity()));
```

---

## 4. Key Language Features

### The `final` Keyword

- **`final` variable:** Cannot be reassigned after initialization.
- **`final` method:** Cannot be overridden by subclasses.
- **`final` class:** Cannot be extended (`String`, `Integer` are final).

### The `static` Keyword

- **`static` field:** Shared across all instances of a class (class-level).
- **`static` method:** Called on the class itself, not on instances. Cannot access `this`.
- **`static` block:** Executed once when the class is loaded.
- **`static` inner class:** Does not hold a reference to the outer class.

### Value Passing in Java (Pass-By-Value)

**Java is strictly pass-by-value.** There is no "pass-by-reference" in Java like there is in C++. 

#### 👶 Beginner Concept: The "House Map"
Imagine you build a beautiful house (The `Object` residing in the Heap). 
You hold a map the construction company gave you. The map tells you the exact physical street address of your house (The **Reference Variable** living on your Local Stack).
- When you pass this variable to a method `paintHouse(myHouseMap)`, Java does NOT pass the physical house.
- Java does NOT pass your original map either!
- Java walks to a photocopier, **makes a 100% exact copy of your map**, and hands the *copy* of the map to the painter method (Pass by Value).

**Scenario 1: Mutating the Object**
If the painter looks at the copied map, drives to the actual address, and paints the physical house blue, your physical house becomes blue! The object *state* mutated.

**Scenario 2: Reassigning the Reference**
If the painter takes his copied map, erases the address with a pencil, and writes down the address to a completely different treehouse (`new House()`), he then paints the treehouse green.
Your original map back in your hand is **completely untouched**. It still points to your blue house.

#### 🧠 Senior Deep Dive: Stack Frame Pointers
For primitives (`int`, `double`), the literal binary value (e.g., `42`) is copied. For Objects, the "Value" being passed is the **64-bit memory pointer representing the address on the Java Heap**. 
When method `A` calls method `B(User u)`, the JVM pushes a brand new Stack Frame onto the CPU for method `B`. It physically copies the 8-byte pointer from A's frame onto B's frame. They are mathematically distinct variables occupying different hardware registers that simply happen to possess the identical 64-bit numerical string pointing to the same Heap sector.

```java
public void changeRef(StringBuilder sb) {
    sb = new StringBuilder("new");  // reassigning the local copy
}

StringBuilder original = new StringBuilder("original");
changeRef(original);
System.out.println(original);  // still "original"
```

```java
public void mutate(StringBuilder sb) {
    sb.append(" modified");  // mutating the object the copy points to
}

StringBuilder original = new StringBuilder("original");
mutate(original);
System.out.println(original);  // "original modified"
```

### String Immutability & The String Constant Pool

String is one of the most critical classes in Java. To save memory and increase performance, Java uses a unique memory management area called the **String Constant Pool** (located within the Heap).

#### 1. String Immutability
Once a `String` object is created, its value cannot be modified.
- **Why is String immutable?**
  1. **String Pool Cache:** If Strings were mutable, changing the value of one variable would silently change the values of other references pointing to the same pool object.
  2. **Security:** Strings are widely used as parameters for database connection URLs, file paths, and network ports. Mutability would allow attackers to bypass security checks by modifying the string value after authorization.
  3. **Thread Safety:** Immutability makes String objects inherently thread-safe without requiring external synchronization.
  4. **HashCode Caching:** Since the string value cannot change, its `hashCode()` can be cached upon creation, making hash-based collections (like `HashMap` and `HashSet`) extremely fast when using strings as keys.

#### 2. String Constant Pool (SCP)
When you create a string literal, the JVM checks the SCP first:
```java
String s1 = "Hello"; // Checks pool. If not present, creates "Hello" in pool. s1 points to pool object.
String s2 = "Hello"; // Checks pool. "Hello" is already present. s2 points to the SAME pool object.
System.out.println(s1 == s2); // true (both point to same memory address)
```

If you use the `new` operator, you explicitly force heap allocation:
```java
String s3 = new String("Hello"); // Creates a brand new object in the normal Heap.
System.out.println(s1 == s3); // false (different objects, different memory regions)
```

<StringConstantPoolDiagram />

#### 3. String Interning (`String.intern()`)
Calling `.intern()` on a string checks the pool for a string with the identical character sequence. If present, it returns the pool reference. If not, it adds the string to the pool and returns its reference.
```java
String s4 = s3.intern();
System.out.println(s1 == s4); // true (s4 now points to the pool instance)
```

---

### String Concatenation & `invokedynamic` (Java 9+)

Before Java 9, string concatenation (e.g., `String s = a + b + c`) was compiled into nested `StringBuilder.append()` calls by the compiler:
```java
// Prior to Java 9 compiler translation:
String s = new StringBuilder().append(a).append(b).append(c).toString();
```
While this works, it hardcodes a specific implementation and size estimation algorithm into the compiled bytecode.

#### Modern Concatenation with `invokedynamic`
Since Java 9, the compiler translates string concatenation into a single **`invokedynamic`** call pointing to the bootstrap method `StringConcatFactory.makeConcatWithTemplate()`.
- **Decoupling:** By generating dynamic call sites at runtime instead of hardcoding `StringBuilder` instantiation, the JVM can change and optimize the implementation strategy (e.g., using direct byte array copying, byte-preallocation, or MethodHandles) without requiring recompilation of your code.
- **Performance:** Decoupled allocation results in reduced CPU instructions and up to a 10% reduction in object allocation overhead in hot paths.

---

### Object Finalization & Alternatives

For a long time, `Object.finalize()` was the standard hook to perform resource cleanup before an object was reclaimed by the GC. However, **`finalize()` is deprecated** (since Java 9) and terminally marked for removal (Java 18+).

#### Why is `finalize()` bad?
1. **Unpredictable Timing:** The GC is not guaranteed to run at any specific time, meaning resource release is delayed indefinitely.
2. **Performance Degradation:** Objects with finalizers require at least two GC cycles to be reclaimed (one to enqueue them for finalization, another to reclaim them after the finalizer runs).
3. **Security Risks:** Finalizer attacks can exploit partially constructed objects that throw exceptions during construction.
4. **Thread Starvation:** The JVM uses a single low-priority thread to run all finalizers.

#### Modern Alternatives

##### 1. try-with-resources (`AutoCloseable`)
For synchronous resource release, implement `AutoCloseable` and clean up deterministically:
```java
public class Resource implements AutoCloseable {
    @Override
    public void close() {
        // Clean up connections/files
    }
}
```

##### 2. `java.lang.ref.Cleaner` (Java 9+)
For asynchronous safety nets, use `Cleaner`. Cleaners do not rely on inheritance (avoiding `finalize()` overrides) and prevent memory leaks by using static nested cleanup actions that do not keep a strong reference to the monitored object.
```java
import java.lang.ref.Cleaner;

public class DatabaseClient implements AutoCloseable {
    private static final Cleaner cleaner = Cleaner.create();
    
    private static class State implements Runnable {
        private final long nativeSocketAddress;
        
        State(long address) { this.nativeSocketAddress = address; }
        
        @Override
        public void run() {
            // Clean up native resources
            System.out.println("Native resource cleaned up");
        }
    }
    
    private final State state;
    private final Cleaner.Cleanable cleanable;
    
    public DatabaseClient(long address) {
        this.state = new State(address);
        this.cleanable = cleaner.register(this, state);
    }
    
    @Override
    public void close() {
        cleanable.clean(); // Runs state.run() once, either now or during GC
    }
}
```

---

## 5. Exception Handling

### Exception Hierarchy

<ExceptionHierarchyDiagram />

### Checked vs Unchecked Exceptions

| Type | Must handle? | Examples |
|------|-------------|----------|
| **Checked** | Yes (`try-catch` or `throws`) | `IOException`, `ClassNotFoundException` |
| **Unchecked** | No (but you should) | `NullPointerException`, `ArrayIndexOutOfBoundsException` |

### try-with-resources (Java 7+)

Automatically closes resources implementing `AutoCloseable`:

```java
// Before: manual close in finally
BufferedReader br = null;
try {
    br = new BufferedReader(new FileReader("file.txt"));
    return br.readLine();
} finally {
    if (br != null) br.close();
}

// After: try-with-resources
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    return br.readLine();
}  // br is automatically closed
```

---

## 6. Generics

### Why Generics?

Generics provide **compile-time type safety** without casting:

```java
// Without generics — requires casting, error-prone
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0);

// With generics — type-safe, no casting
List<String> list = new ArrayList<>();
list.add("hello");
String s = list.get(0);
```

### Generic Classes, Interfaces, and Methods

```java
// Generic class
public class Box<T> {
    private T content;
    public void set(T content) { this.content = content; }
    public T get() { return content; }
}

// Generic method
public <T> T firstElement(List<T> list) {
    return list.get(0);
}
```

### Wildcards & Bounds

| Wildcard | Meaning | Use Case |
|----------|---------|----------|
| `<?>` | Unknown type | Read-only access |
| `<? extends T>` | T or subtype (upper bound) | Producing (reading) |
| `<? super T>` | T or supertype (lower bound) | Consuming (writing) |

**PECS Principle:** Producer `extends`, Consumer `super`.

```java
// Producer — reading items out
public double sum(List<? extends Number> list) {
    return list.stream().mapToDouble(Number::doubleValue).sum();
}

// Consumer — writing items in
public void addIntegers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
}
```

### Type Erasure

Generics are a **compile-time** feature. At runtime, generic type information is erased — `List<String>` and `List<Integer>` compile to the same raw `List` class. This ensures backward compatibility with pre-generics (Java 1.4 and earlier) code, but introduces key restrictions:

- You cannot create generic arrays: `new T[]`
- You cannot use `instanceof` with parameterized types: `obj instanceof List<String>`
- You cannot have overloaded methods that differ only by generic parameters (as they have the same signature in bytecode)

#### 🧠 Senior Deep Dive: Compiler Bridge Methods

To preserve polymorphism when a class extends a generic class or implements a generic interface with a specific type parameter, the Java compiler automatically generates synthetic, package-private **bridge methods** in the bytecode.

Consider this scenario:

```java
public interface Node<T> {
    void set(T value);
}

public class MyNode implements Node<Integer> {
    @Override
    public void set(Integer value) {
        // Business logic
    }
}
```

After type erasure, the interface `Node` becomes:
```java
public interface Node {
    void set(Object value);
}
```

If `MyNode` only implemented `set(Integer)`, it would not technically implement `Node.set(Object)` at the bytecode level (signatures differ). To bridge this, the compiler generates a synthetic **bridge method** in `MyNode`:

```java
// Generated by compiler in MyNode.class
public void set(Object value) {
    this.set((Integer) value); // Delegates to your Integer method
}
```

##### ⚠️ Production Impact of Bridge Methods
1. **Reflection Anomalies:** Calling `MyNode.class.getDeclaredMethods()` returns *two* `set` methods: one taking `Integer` and one taking `Object`.
2. **ClassCastExceptions at Runtime:** If a client invokes the raw type method with a `String`, the compilation succeeds but throws a `ClassCastException` at runtime inside the bridge method:
   ```java
   Node rawNode = new MyNode();
   rawNode.set("Not an Integer"); // Compiles! Throws ClassCastException at runtime
   ```

#### 🧠 Senior Deep Dive: Retrieving Erased Generics (Super Type Tokens)

While generic type parameters of *object instances* are erased, generic metadata is **retained in the class signature** for subclasses, fields, and method parameters.

We can exploit this to retrieve erased type parameters at runtime. This pattern is called the **Super Type Token** (or Type Token) and is used by Jackson (`TypeReference`), Gson (`TypeToken`), and Spring (`ParameterizedTypeReference`).

By creating an anonymous subclass of a parameterized type, we can inspect its generic superclass at runtime:

```java
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;

public class GenericResolver {
    public static void main(String[] args) {
        // Create an anonymous subclass of ArrayList<String>
        ArrayList<String> list = new ArrayList<String>() {}; 

        // Retrieve the generic superclass metadata
        Type superclass = list.getClass().getGenericSuperclass();

        if (superclass instanceof ParameterizedType) {
            ParameterizedType parameterized = (ParameterizedType) superclass;
            Type actualType = parameterized.getActualTypeArguments()[0];
            System.out.println("Actual generic type: " + actualType); // Prints "class java.lang.String"
        }
    }
}
```

---

## 7. Reflection

Reflection allows inspecting and manipulating classes, methods, and fields at runtime.

### Getting a Class Object

```java
// 1. From class literal
Class<String> cls1 = String.class;

// 2. From instance
Class<?> cls2 = "hello".getClass();

// 3. From fully qualified name
Class<?> cls3 = Class.forName("java.lang.String");

// 4. From class loader
Class<?> cls4 = ClassLoader.getSystemClassLoader().loadClass("java.lang.String");
```

### Common Reflection Operations

```java
Class<?> cls = MyClass.class;

// Create instance
Object obj = cls.getDeclaredConstructor().newInstance();

// Access private field
Field field = cls.getDeclaredField("name");
field.setAccessible(true);
field.set(obj, "value");

// Invoke method
Method method = cls.getDeclaredMethod("doSomething", String.class);
method.setAccessible(true);
method.invoke(obj, "arg");
```

**Use cases:** Framework dependency injection (Spring), ORM mapping (Hibernate), serialization libraries, testing frameworks.

**Downsides:** Performance overhead, breaks encapsulation, bypasses compile-time checks.

---

## 8. Proxy Pattern

### Static Proxy

A proxy class implements the same interface as the target, delegating calls with added behavior:

```java
public interface UserService {
    void save(User user);
}

public class UserServiceProxy implements UserService {
    private final UserService target;

    public UserServiceProxy(UserService target) {
        this.target = target;
    }

    @Override
    public void save(User user) {
        System.out.println("Before save...");
        target.save(user);
        System.out.println("After save...");
    }
}
```

### JDK Dynamic Proxy

Creates proxies at runtime for interfaces using `java.lang.reflect.Proxy`:

```java
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    (proxyObj, method, args) -> {
        System.out.println("Before: " + method.getName());
        Object result = method.invoke(realService, args);
        System.out.println("After: " + method.getName());
        return result;
    }
);
```

### CGLIB Dynamic Proxy

Creates proxies by **subclassing** the target class (no interface required):

```java
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(UserServiceImpl.class);
enhancer.setCallback((MethodInterceptor) (obj, method, args, proxy) -> {
    System.out.println("Before: " + method.getName());
    Object result = proxy.invokeSuper(obj, args);
    System.out.println("After: " + method.getName());
    return result;
});
UserServiceImpl proxy = (UserServiceImpl) enhancer.create();
```

| Feature | JDK Dynamic Proxy | CGLIB |
|---------|-------------------|-------|
| Requires interface | Yes | No |
| Mechanism | Reflection | Bytecode generation (subclassing) |
| Performance | Slightly slower | Slightly faster for invocations |
| Cannot proxy | Classes without interfaces | `final` classes/methods |

> **Spring AOP** uses JDK dynamic proxy when the target implements an interface, and CGLIB otherwise.

---

## 9. Serialization

### What Is Serialization?

**Serialization** converts an object into a byte stream for storage or network transmission. **Deserialization** reconstructs the object from bytes.

### Java's Built-In Serialization

Implement `Serializable` and use `ObjectOutputStream` / `ObjectInputStream`:

```java
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private transient String password;  // excluded from serialization
}
```

- **`serialVersionUID`**: Version identifier. If the class changes and the UID doesn't match, deserialization fails with `InvalidClassException`.
- **`transient`**: Fields marked `transient` are excluded from serialization.

### Common Serialization Frameworks

| Framework | Format | Speed | Size | Schema Required |
|-----------|--------|-------|------|-----------------|
| JDK built-in | Binary | Slow | Large | No |
| **Kryo** | Binary | Very fast | Small | No |
| **Protobuf** | Binary | Fast | Very small | Yes (`.proto` files) |
| **Jackson/Gson** | JSON | Medium | Medium | No |
| **Hessian** | Binary | Fast | Small | No |

> **Recommendation:** Avoid JDK built-in serialization in production. Use Kryo for in-process caching, Protobuf for cross-service communication, and JSON for REST APIs.

---

## 10. SPI (Service Provider Interface)

SPI is a service discovery mechanism that allows third parties to provide implementations of an interface.

### SPI vs API

- **API:** The implementor provides both the interface and the implementation. Callers use it.
- **SPI:** The caller defines the interface; implementors provide implementations discovered at runtime.

### How It Works

1. Define a service interface:
   ```java
   public interface Parser {
       Document parse(InputStream input);
   }
   ```

2. Implementors add a file `META-INF/services/com.example.Parser` containing:
   ```
   com.vendor.XmlParser
   com.vendor.JsonParser
   ```

3. Load implementations at runtime:
   ```java
   ServiceLoader<Parser> loader = ServiceLoader.load(Parser.class);
   for (Parser parser : loader) {
       // use discovered implementations
   }
   ```

**Real-world examples:** JDBC driver loading, SLF4J logging backends, Spring Boot auto-configuration.

---

## 11. Immutability

Immutable objects cannot be modified after creation. They are inherently thread-safe, cache-friendly, and safe to use as `HashMap` keys.

### Creating Immutable Classes

1. Declare the class `final` (prevent subclassing)
2. Make all fields `private final`
3. No setter methods
4. Deep-copy mutable fields in the constructor and accessors
5. Consider using Java 14+ `record` for simple data carriers

```java
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(BigDecimal amount, Currency currency) {
        this.amount = amount;
        this.currency = Currency.getInstance(currency.getCurrencyCode());
    }

    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return Currency.getInstance(currency.getCurrencyCode()); }
}

// Java 14+: records are immutable by design
record Money(BigDecimal amount, Currency currency) {}
```

### Benefits in Multi-threaded Applications

- **No synchronization needed** — immutable objects can be shared freely across threads
- **No defensive copying** when passing between methods
- **Predictable behavior** — no risk of state corruption
- **Safe as Map keys** — hash code never changes

---

## 12. The `equals()` and `hashCode()` Contract

When overriding `equals()`, you **must** also override `hashCode()` to maintain the contract required by hash-based collections.

### The Contract

- **Reflexive:** `x.equals(x)` → `true`
- **Symmetric:** `x.equals(y)` ↔ `y.equals(x)`
- **Transitive:** `x.equals(y)` && `y.equals(z)` → `x.equals(z)`
- **Consistent:** Multiple calls return the same result if objects are unchanged
- **Null-safe:** `x.equals(null)` → `false`
- **Equal objects must have equal hash codes** (but unequal objects may share hash codes)

### Correct Implementation

```java
public class User {
    private final Long id;
    private final String email;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
```

> **Pitfall:** Using mutable fields in `equals()`/`hashCode()` can cause objects to "disappear" from `HashMap` or `HashSet` if their state changes after insertion.

---

## 13. Enums

Enums define a fixed set of constants with type safety, replacing magic numbers and strings.

### Key Properties

- All enums implicitly extend `java.lang.Enum` (no other class inheritance)
- Can implement interfaces
- Can have fields, methods, and constructors
- Ideal for Singleton and Strategy pattern implementations

```java
public enum OrderStatus {
    PENDING("Pending", true),
    SHIPPED("Shipped", true),
    DELIVERED("Delivered", false),
    CANCELLED("Cancelled", false);

    private final String displayName;
    private final boolean modifiable;

    OrderStatus(String displayName, boolean modifiable) {
        this.displayName = displayName;
        this.modifiable = modifiable;
    }

    public String getDisplayName() { return displayName; }
    public boolean isModifiable() { return modifiable; }
}

// Iterating
for (OrderStatus status : OrderStatus.values()) {
    System.out.println(status.getDisplayName());
}
```

### Enum-based Singleton

The simplest thread-safe Singleton with built-in serialization protection:

```java
public enum AppConfig {
    INSTANCE;

    private final Properties properties = new Properties();

    public String get(String key) {
        return properties.getProperty(key);
    }
}
```

---

## Advanced Editorial Pass: Fundamentals as Performance and Correctness Tools

### What Matters at Senior Level
- Language features are design constraints, not just syntax options.
- Correctness under concurrency and memory pressure starts with fundamentals.
- Clarity of type and object lifecycle decisions drives long-term maintainability.

### Misuse Patterns
- Choosing features for novelty instead of readability and failure behavior.
- Ignoring boxing, allocation, and escape patterns in hot paths.
- Treating exceptions as control flow without cost awareness.

### Engineering Heuristics
1. Optimize for predictable behavior before micro-optimizing throughput.
2. Make mutability and ownership explicit in API design.
3. Validate assumptions with small benchmarks and profiling snapshots.

### Compare Next
- [Java Collections Framework: Deep Dive](./java-collections.md)
- [Java Concurrency: Threads, Locks & Concurrent Utilities](./java-concurrency.md)
- [JVM Internals: Memory, GC & Class Loading](./java-jvm.md)

---

## Interview Questions

### Q: Why do fundamentals still matter for senior backend roles?
**A:** Most production bugs involve core language behavior: mutability, equality, exceptions, concurrency, or memory semantics.

### Q: When should BigDecimal be mandatory?
**A:** For monetary and precision-critical calculations where floating-point rounding is unacceptable.

### Q: What is a common equals/hashCode bug in enterprise code?
**A:** Using mutable fields in identity methods, causing broken HashMap and HashSet behavior after mutation.

### Q: How do you choose between interface and abstract class?
**A:** Use interfaces for contracts and flexibility; use abstract classes when shared state or template behavior is needed.

### Q: Why is pass-by-value misunderstood in Java interviews?
**A:** Object references are copied by value, so object mutation is visible but reference reassignment is not.

### Q: How do you decide if reflection is acceptable?
**A:** Use it in framework boundaries and tooling, but avoid it in hot paths or core domain logic.
