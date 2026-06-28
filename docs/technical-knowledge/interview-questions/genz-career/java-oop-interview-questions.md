---
id: java-oops-interview-guide
title: 50+ Real & Tricky Java OOPs Interview Questions
sidebar_label: Java OOPs Interview Questions Tricky
tags:
  - Java
  - OOPs
  - Interview Prep
  - Backend Development
  - Software Design
description: An exhaustive, detailed guide covering 50+ advanced Java Object-Oriented Programming (OOP) interview questions for developers with 2-7 years of experience.
---

# Java OOPs Interview Questions & Answers

This guide provides an exhaustive list of detailed interview questions and answers focused on Java Object-Oriented Programming (OOPs), specifically curated to help experienced developers tackle tricky MNC interview scenarios.

---

## 1. Object Creation & Memory Management

**Q: What happens internally when you create an object using `new`?**
**A:** The `new` keyword triggers a well-defined sequence at the JVM level:

1. **Class loading:** If the class hasn't been loaded, the ClassLoader loads the `.class` file, parses it, and creates a `Class<?>` object in Metaspace.
2. **Memory allocation:** The JVM allocates space in the **Heap**. It first tries the current thread's **TLAB (Thread-Local Allocation Buffer)** — a pre-allocated chunk of Eden space private to each thread, enabling lock-free allocation. If TLAB is exhausted, it falls back to a CAS-based bump-pointer allocation in Eden.
3. **Zero initialization:** All instance fields are set to their **type defaults** (`0`, `false`, `null`). This happens before the constructor runs — which is why fields have known values even if the constructor hasn't assigned them.
4. **Constructor chain:** The `<init>` method executes. Java guarantees that the parent constructor (`super()`) runs first, initializing inherited state top-down from `Object`.
5. **Reference returned:** The heap address is stored in the reference variable on the Stack (or in a register if JIT-optimized).

At the **bytecode level**, `new MyClass()` compiles to three instructions:
```
new           #2    // Allocate memory, push reference
dup                 // Duplicate reference (one for init, one for assignment)
invokespecial #3    // Call <init> constructor
astore_1            // Store reference in local variable
```

**Q: Can we create an object without using the `new` keyword? If yes, how?**
**A:** Yes, five ways:

| Method | Calls Constructor? | Use Case |
|--------|-------------------|----------|
| `Class.forName("...").getDeclaredConstructor().newInstance()` | Yes | Reflection, frameworks (Spring, Hibernate) |
| `object.clone()` | No (uses `Cloneable`) | Prototype pattern, but shallow copy pitfalls |
| `ObjectInputStream.readObject()` | No (bypasses constructor) | Deserialization — **security risk!** |
| `Constructor.newInstance()` via `Unsafe` | No | Internal JVM use, extremely dangerous |
| Factory methods (`String.valueOf()`, `List.of()`) | Varies | API-driven object creation |

> **Interview trap:** Deserialization bypasses the constructor entirely, which means `final` fields set in the constructor may not be initialized correctly. This is why the `readResolve()` method exists for Singleton protection.

**Q: Can a class be declared without any variables or methods?**
**A:** Yes. The Java compiler still generates a `.class` file with a **default no-arg constructor** (calls `super()` internally). These are called **Marker Classes** when used to represent a type identity. However, marker **interfaces** (like `Serializable`, `Cloneable`) are far more common because they allow `instanceof` checks across unrelated class hierarchies. Since Java 5, **annotations** (`@Entity`, `@Deprecated`) have largely replaced marker patterns for metadata.

**Q: What is the difference between an object and an object reference?**
**A:** The **object** is the actual data allocated on the Heap — it contains instance fields, a pointer to its `Class` metadata (in Metaspace), and the object header (mark word for locking/GC, klass pointer). The **reference** is a variable (on the Stack, in a register, or inside another object) that holds the **address** of the heap object. Multiple references can point to the same object. In a 64-bit JVM with compressed oops (default for heaps < 32 GB), a reference occupies 4 bytes; without compressed oops, it's 8 bytes. The object header itself is 12 bytes (8-byte mark word + 4-byte compressed klass pointer).

**Q: Does assigning `null` to a reference delete the object?**
**A:** No. Assigning `null` only severs the reference → object link. The object remains on the Heap as an **unreachable** entity. It becomes eligible for Garbage Collection, but the GC runs on its own schedule — there's no deterministic moment of destruction. The object might survive multiple GC cycles if it was promoted to Old Generation. Calling `System.gc()` is merely a **hint** to the JVM; it's free to ignore it. In production, the `-XX:+DisableExplicitGC` flag is often set, making `System.gc()` a no-op.

**Q: Can a class have only static members? If yes, is it still object-oriented?**
**A:** Yes — `java.lang.Math`, `java.util.Collections`, and `java.util.Objects` are purely static utility classes. They are **not object-oriented** in the strict sense because OOP requires objects with encapsulated state and behavior. Static members belong to the `Class` object in Metaspace, not to instances. These classes are conceptually **procedural** — they're stateless function containers. Best practice: make the constructor `private` and the class `final` to prevent instantiation and extension:
```java
public final class MathUtils {
    private MathUtils() { throw new AssertionError("No instances"); }
    public static int gcd(int a, int b) { /* ... */ }
}
```

---

## 2. Encapsulation & Abstraction

**Q: Is encapsulation only about making variables private?**
**A:** No. Making fields `private` is necessary but insufficient. Encapsulation is about **controlling invariants** — ensuring the object's internal state is always consistent. A proper setter enforces business rules:
```java
public void setAge(int age) {
    if (age < 0 || age > 150) throw new IllegalArgumentException("Invalid age: " + age);
    this.age = age;
}
```
Beyond validation, encapsulation includes: making fields `final` when appropriate, returning **defensive copies** of mutable internal collections (`return new ArrayList<>(internalList)` instead of `return internalList`), and using **immutable objects** where state mutation isn't needed.

**Q: If a class has private fields but public setters, is it truly encapsulated?**
**A:** Only partially. If the setter performs no validation and allows arbitrary values, it's essentially equivalent to a public field. True encapsulation requires the setter to enforce the class's **invariants**. Consider a `BankAccount` with a `balance` field — a raw setter would allow negative balances, but a properly encapsulated class exposes `deposit()` and `withdraw()` methods with overdraft checks instead of a generic `setBalance()`.

> **Modern approach:** Java Records (Java 16+) provide encapsulation with `private final` fields, auto-generated getters, and no setters — making immutability the default.

**Q: Why do we use getters/setters when we can make fields public and access them directly?**
**A:** Getters/setters provide an **abstraction layer** between the internal representation and external access:
1. **Validation:** Reject invalid values before they corrupt state.
2. **Computed properties:** `getFullName()` can return `firstName + " " + lastName` without storing a separate field.
3. **Read-only access:** Omit the setter to make a field read-only externally.
4. **Lazy initialization:** Compute or fetch the value only when first accessed.
5. **Change detection:** Trigger events or logging when a value changes.
6. **Binary compatibility:** Changing internal representation (e.g., storing `int cents` instead of `double dollars`) only requires updating the getter/setter, not every caller.

**Q: What are anonymous classes?**
**A:** An anonymous class is a **one-off, unnamed inner class** declared and instantiated inline. The compiler generates a synthetic class file (e.g., `Outer$1.class`). It can extend a class or implement one interface, and it captures `effectively final` local variables from the enclosing scope.

```java
// Pre-Java 8: anonymous class for Comparator
Collections.sort(list, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return a.length() - b.length();
    }
});

// Java 8+: lambda replaces the anonymous class for functional interfaces
Collections.sort(list, (a, b) -> a.length() - b.length());
```

> **Under the hood:** Anonymous classes create a new `.class` file per usage and capture a reference to the enclosing `this` (for non-static contexts), which can cause **memory leaks** if the anonymous class outlives the enclosing object. Lambdas avoid this overhead — they're compiled to `invokedynamic` instructions and don't always create a new class.

**Q: What is the difference between encapsulation and abstraction?**
**A:** They solve different problems:
- **Encapsulation** = **data hiding** + **invariant protection**. The internal state is wrapped and controlled via methods. *How is the data protected?*
- **Abstraction** = **complexity hiding**. The user sees a simplified interface without knowing the implementation details. *What can the user do?*

| Aspect | Encapsulation | Abstraction |
|--------|--------------|-------------|
| Focus | Protects data integrity | Hides implementation complexity |
| Mechanism | Access modifiers, getters/setters | Interfaces, abstract classes |
| Example | `private int balance` with `withdraw()` | `List` interface hiding `ArrayList` vs `LinkedList` |
| Goal | Prevent invalid state | Reduce cognitive load |

**Q: What problem does abstraction solve that encapsulation does not?**
**A:** Encapsulation protects data but doesn't address **design complexity**. Abstraction enables:
1. **Polymorphic substitution:** Code written against `List<T>` works with `ArrayList`, `LinkedList`, or any custom implementation.
2. **Plugin architectures:** `PaymentGateway` interface allows swapping Stripe for PayPal without touching business logic.
3. **Testability:** Mock implementations (e.g., `InMemoryUserRepository`) can replace real database calls in tests.
4. **Dependency inversion:** High-level modules depend on abstractions, not concrete classes — the "D" in SOLID.

---

## 3. Abstract Classes & Interfaces

**Q: Why do we need abstract classes when we already have interfaces?**
**A:** Abstract classes provide capabilities that interfaces cannot:

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Instance fields | ✅ Yes (any access modifier) | ❌ Only `public static final` constants |
| Constructors | ✅ Yes (called via `super()`) | ❌ No |
| State management | ✅ Can hold and mutate object state | ❌ Stateless (no instance state) |
| Method access modifiers | `public`, `protected`, `private` | `public` only (until Java 9 `private`) |
| Inheritance | Single (`extends`) | Multiple (`implements`) |

**Use abstract class** when classes share a common **IS-A** relationship with shared state (e.g., `Animal` → `Dog`, `Cat` sharing `name`, `age` fields and `eat()` behavior). **Use interface** when unrelated classes need a common capability (e.g., `Serializable`, `Comparable`).

**Q: Can a class exist without any abstract methods?**
**A:** Yes. An abstract class without abstract methods simply means: "This class is incomplete — don't instantiate it directly." It's used as a **template** that provides default implementations while forcing subclassing. The `AbstractList` class in the JDK is a real example — it provides default `indexOf()`, `lastIndexOf()`, `subList()` etc., but leaves `get()` and `size()` for subclasses.

**Q: Why can an interface not have instance variables?**
**A:** An interface defines a **contract**, not an object blueprint. Instance variables represent **per-object state**, which requires construction and memory allocation per instance. Since you can't instantiate an interface (no `new`), per-instance state is meaningless. All variables in an interface are implicitly `public static final` — they're **constants** shared across all implementations. If you need shared state, use an abstract class.

**Q: Why were `default`, `static`, and `private` methods introduced in interfaces after Java 8?**
**A:** 
* **`default` methods (Java 8):** Enable **API evolution** without breaking existing implementations. When `Iterable.forEach()` was added in Java 8, all existing `Iterable` implementations automatically inherited it without modification. Without default methods, adding a method to an interface would break every implementing class.
* **`static` methods (Java 8):** Utility methods logically tied to the interface concept (e.g., `Comparator.comparing()`, `List.of()`). Before Java 8, these had to live in companion utility classes like `Collections`.
* **`private` methods (Java 9):** Allow default methods to share internal helper logic without exposing it to implementing classes. This prevents code duplication within an interface.

**Q: Why does Java support multiple inheritance using interfaces but not classes?**
**A:** Multiple class inheritance creates the **Diamond Problem**: if `class C extends A, B` and both `A` and `B` define `void doWork()`, which implementation does `C` inherit? The ambiguity extends to **state**: if both `A` and `B` have a field `int x`, does `C` get one `x` or two?

Interfaces avoid this because:
1. **No state ambiguity** — interfaces can't have instance fields.
2. **Explicit resolution required** — if two interfaces provide conflicting `default` methods, the implementing class **must override** and explicitly choose:
```java
interface A { default void greet() { System.out.println("A"); } }
interface B { default void greet() { System.out.println("B"); } }

class C implements A, B {
    @Override
    public void greet() {
        A.super.greet(); // Explicitly choose A's implementation
    }
}
```

**Q: Can an interface exist without any methods?**
**A:** Yes — a **Marker Interface** (e.g., `Serializable`, `Cloneable`, `RandomAccess`). It acts as a **type tag** that the JVM or frameworks check at runtime via `instanceof`. For example, `ObjectOutputStream` checks `if (obj instanceof Serializable)` before serialization. Since Java 5, **annotations** (`@Entity`, `@Documented`) have largely replaced marker interfaces, but marker interfaces still carry an advantage: they define a **type** that can be used in generics and method signatures (`void process(Serializable data)`).

**Q: What exactly makes an interface a functional interface?**
**A:** Exactly **one abstract method** (SAM — Single Abstract Method). Methods inherited from `Object` (`equals()`, `hashCode()`, `toString()`) don't count toward this limit because every class inherits them from `Object`.

```java
@FunctionalInterface
interface Transformer<T, R> {
    R transform(T input);          // The single abstract method
    default Transformer<T, R> andThen(Transformer<R, ?> after) { /* ... */ }
    static <T> Transformer<T, T> identity() { return t -> t; }
    // equals() and hashCode() don't count — inherited from Object
}
```

**Q: Can a functional interface have default and static methods?**
**A:** Yes. Default and static methods have implementations, so they are not abstract. A functional interface can have any number of default and static methods. The critical rule is: **exactly one abstract method**.

**Q: Why is the `@FunctionalInterface` annotation optional but recommended?**
**A:** The compiler detects SAM interfaces automatically. The annotation serves two purposes:
1. **Documentation:** Signals to developers that this interface is designed for lambda usage.
2. **Compile-time enforcement:** If someone accidentally adds a second abstract method, the compiler throws an error immediately, preserving lambda compatibility. Without the annotation, the interface silently becomes non-functional and lambda assignments fail at the call site with a confusing error.

**Q: Can a functional interface extend another interface?**
**A:** Yes, with a constraint: the **total number of abstract methods must remain exactly one**. If the parent has one abstract method and the child adds another, it ceases to be functional. However, if the child **overrides** the parent's abstract method with a `default` implementation, it can then add its own single abstract method and remain functional.

---

## 4. Overriding, Overloading, & Methods

**Q: Why can't private methods be overridden?**
**A:** Private methods are bound at **compile time** (static dispatch) and are invisible to subclasses. The subclass doesn't even know the private method exists. If a subclass declares a method with the same signature, it's a completely new, unrelated method — not an override. The JVM uses `invokespecial` for private methods (direct call) vs `invokevirtual` for virtual/overridable methods (vtable dispatch).

**Q: Why can't static methods be overridden and only hidden?**
**A:** Static methods are resolved at **compile time** based on the **reference type**, not the runtime object type. They use `invokestatic` in bytecode — there's no vtable lookup. If a subclass declares a static method with the same signature, it **hides** the parent's version but doesn't participate in polymorphism:
```java
class Parent { static void greet() { System.out.println("Parent"); } }
class Child extends Parent { static void greet() { System.out.println("Child"); } }

Parent ref = new Child();
ref.greet(); // Prints "Parent" — resolved by reference type, not object type
```

**Q: What is a covariant return type and why is it allowed?**
**A:** An overriding method in a subclass can return a **more specific type** than the parent method. This is type-safe because the subtype IS-A parent type:
```java
class AnimalFactory { Animal create() { return new Animal(); } }
class DogFactory extends AnimalFactory { 
    @Override
    Dog create() { return new Dog(); } // Dog extends Animal — covariant return
}
```

Under the hood, the compiler generates a **bridge method** with the original return type that delegates to the covariant method. This maintains binary compatibility with code compiled against the parent class.

**Q: Can we override the `main` method?**
**A:** No. The `main` method is `static`, and static methods cannot be overridden — only hidden. Even if you declare `main` in a subclass, the JVM always invokes `main` based on the class you specify on the command line, not via polymorphic dispatch.

**Q: Why is overloading resolved at compile time but overriding at runtime?**
**A:** **Overloading** selects the method signature (name + parameter types) at compile time. The compiler examines the **declared types** of the arguments and picks the most specific matching signature. This uses `invokevirtual` or `invokestatic` with the exact descriptor chosen at compile time.

**Overriding** selects the method **implementation** at runtime. The JVM uses the **virtual method table (vtable)** — each class has a vtable where each entry points to the most specific implementation. When `invokevirtual` is executed, the JVM looks up the actual object's class vtable to find the correct method body. This is **dynamic dispatch** and is what makes polymorphism work.

**Q: Can you overload a method by only changing the return type?**
**A:** No. Java's method resolution uses only the **method name + parameter list** as the signature. Return type is not part of the method signature for overloading purposes. The compiler cannot determine which method to invoke based on the call site because the return value might be ignored: `doSomething()` — which version should be called?

> **Fun fact:** At the JVM bytecode level, the return type IS part of the method descriptor. This is why bridge methods for covariant returns work — they have different descriptors even though Java source code wouldn't allow it.

**Q: Can you overload static methods?**
**A:** Yes. Overloading is about having multiple methods with the same name but different parameter lists within the same class. It applies equally to static and instance methods.

**Q: Can you overload the `main` method?**
**A:** Yes. You can have `main(int x)`, `main(String s)`, etc. But the JVM entry point is strictly `public static void main(String[] args)` — only this exact signature is recognized as the application launcher.

**Q: Can you overload private methods?**
**A:** Yes. Overloading is resolved at compile time within the same class scope. Access modifiers don't affect overloading resolution.

---

## 5. Constructors

**Q: Can a constructor be overridden?**
**A:** No. Constructors are not inherited — they are **class-specific initializers** tied to their exact class name. Since they aren't inherited, the concept of overriding (providing a different implementation in a subclass) doesn't apply. A subclass defines its own constructors and invokes the parent's constructor via `super()`.

**Q: Can an abstract class have a constructor?**
**A:** Yes. The constructor initializes the **inherited state** of the abstract class. When a concrete subclass is instantiated, the JVM calls the constructor chain bottom-up: `ConcreteClass()` → calls `super()` → `AbstractClass()` → calls `super()` → `Object()`. Without a constructor, the abstract class couldn't enforce initialization of its fields:
```java
abstract class Shape {
    protected final String color;
    protected Shape(String color) {  // Required initialization
        this.color = Objects.requireNonNull(color, "color must not be null");
    }
}
class Circle extends Shape {
    Circle(String color, double radius) {
        super(color); // Must call abstract class constructor
    }
}
```

**Q: Why doesn't Java allow static constructors?**
**A:** Constructors initialize **instance state** — they run once per object creation. Static members belong to the class itself, not instances. A "static constructor" would be a contradiction. Java uses **static initializer blocks** for class-level initialization:
```java
class Config {
    private static final Map<String, String> DEFAULTS;
    static {
        DEFAULTS = new HashMap<>();
        DEFAULTS.put("timeout", "30");
        DEFAULTS.put("retries", "3");
    }
}
```
The static block executes once when the class is **loaded** by the ClassLoader, before any instance is created.

**Q: Can a constructor call another constructor using `this()` and `super()`?**
**A:** Yes, but **not both in the same constructor**. Java requires that `this()` or `super()` be the **very first statement** in the constructor body. Since only one statement can be first, you must choose one. `this()` delegates to a sibling constructor; `super()` delegates to the parent. Constructor chaining typically works as: specialized constructors call `this()` to delegate to a "primary" constructor, which calls `super()`.

**Q: Why are constructors not inherited but accessible via `super()`?**
**A:** Constructors are named after their class (e.g., `Animal()`) — inheriting them into a subclass (`Dog`) would mean `Dog` has a constructor named `Animal()`, which violates Java's constructor naming rule. However, `super()` provides **explicit delegation** — the child says "initialize my parent's portion of me" without inheriting the constructor as its own.

**Q: What happens if you make all constructors private?**
**A:** No external class can instantiate the object via `new`. This pattern is used in:
1. **Singleton:** One controlled instance via a static factory method.
2. **Utility classes:** No instances allowed (e.g., `java.lang.Math`).
3. **Factory pattern:** Instances created only through static factory methods that may return cached objects or subtypes.
4. **Builder pattern:** The outer class's constructor is private; only the inner `Builder` class can call it.

**Q: What problems arise with too many constructors?**
**A:** **Telescoping constructor anti-pattern:** Each constructor adds one more parameter, leading to permutation explosion. With 5 optional parameters, you'd need 2⁵ = 32 constructors. Code becomes unreadable — callers see `new Pizza(true, false, true, 2, null)` with no idea what each parameter means.

**Solution:** Use the **Builder pattern**:
```java
Pizza pizza = new Pizza.Builder("thin")
    .cheese(true)
    .pepperoni(true)
    .size(Size.LARGE)
    .build();
```

---

## 6. Access Modifiers & Keywords

**Q: Can a class in another package access `protected` members via object references?**
**A:** No. `protected` grants access through two paths:
1. **Same package:** Any class in the same package can access protected members directly.
2. **Subclass in different package:** The subclass can access protected members **only through inheritance** (`this.field`, `super.method()`), not through an arbitrary instance reference.

```java
// package com.other;
class Dog extends Animal {
    void test() {
        this.name = "Rex";          // ✅ Inherited access
        super.getName();            // ✅ Through super
        
        Animal other = new Animal();
        other.name = "Bob";         // ❌ Compile error! Not through inheritance
    }
}
```

**Q: Why are interface methods always `public` even if not specified?**
**A:** An interface is a **public contract** — its purpose is to be implemented by any class, potentially across different packages and modules. If methods were package-private, classes outside the package couldn't implement them, defeating the interface's purpose. The `public` modifier is implicit and enforced by the compiler.

**Q: What happens if a class has no access modifier in a multi-module project?**
**A:** It defaults to **package-private** (visible only within its exact package). In the Java Module System (Java 9+), even `public` classes aren't accessible across modules unless the package is explicitly **exported** in `module-info.java`. A package-private class in a non-exported package is doubly invisible to other modules.

**Q: Why can a top-level class not be `private` or `protected`?**
**A:** A `private` top-level class would be invisible to everything outside its source file — no other class could use it, making it pointless. `protected` implies visibility to subclasses across packages, but a top-level class's "enclosing scope" is the package, not another class — the concept of "subclass access" doesn't apply at the file level. Only `public` (globally visible) and package-private (visible within the package) make sense for top-level classes.

> **Exception:** Inner classes can be `private` or `protected` because their enclosing scope is the outer class, not the file.

**Q: Can fields be `public` but still maintain encapsulation?**
**A:** Only if they are `public static final` and hold an **immutable** value:
```java
public static final int MAX_RETRIES = 3;                    // ✅ Safe — primitive constant
public static final String API_VERSION = "v2";               // ✅ Safe — String is immutable
public static final List<String> ALLOWED = List.of("a", "b"); // ✅ Safe — unmodifiable list

public static final List<String> MUTABLE = new ArrayList<>(); // ❌ Dangerous — callers can add/remove!
```

The `final` keyword prevents reassignment of the reference, but it doesn't make the referenced object immutable. A `public final List` can still have elements added/removed unless it's wrapped with `Collections.unmodifiableList()` or created with `List.of()`.

**Q: What is the `this` and `super` keyword?**
**A:** 
- **`this`** — reference to the **current object** instance. Used to disambiguate field names from parameters (`this.name = name`), to call sibling constructors (`this(defaultValue)`), and to pass the current object as an argument (`listener.notify(this)`).
- **`super`** — reference to the **parent class's portion** of the current object. Used to call overridden parent methods (`super.toString()`), to access shadowed parent fields, and to invoke parent constructors (`super(args)`).

Both are **compile-time references** resolved to specific method/field targets. They are not actual object pointers that can be assigned or passed around (you can't do `Object x = super`).

**Q: What happens if you use `this()` and `super()` together in a constructor?**
**A:** Compiler error: `"call to this must be first statement in constructor"` or `"call to super must be first statement in constructor"`. Since both demand to be the first statement, they're mutually exclusive within a single constructor. The workaround is constructor chaining: let `this()` delegate to another constructor that calls `super()`.

**Q: Can `this` or `super` be used inside a static method?**
**A:** No. Static methods belong to the `Class` object, not to any instance. There is no `this` (current instance) or `super` (parent instance) in a static context. Using either results in a compile-time error: `"non-static variable this/super cannot be referenced from a static context"`.

**Q: Can `super` access private members of a parent class?**
**A:** No. `private` is the strongest access modifier and is enforced even against subclasses. The parent class's private members are invisible to all other classes, including children. If the parent wants to expose internal state to subclasses, it should use `protected`.

**Q: Can `this` and `super` be used together in the same method? Give a scenario.**
**A:** Yes, in **instance methods** (not constructors):
```java
class SportsCar extends Car {
    @Override
    public int getSpeed() { return super.getSpeed() * 2; }
    
    public String compare() {
        return "My speed: " + this.getSpeed() +     // Calls SportsCar.getSpeed()
               " vs base: " + super.getSpeed();      // Calls Car.getSpeed()
    }
}
```

---

## 7. Design Principles: Cohesion, Coupling, & Relationships

**Q: What is the difference between Cohesion and Coupling?**
**A:**
* **Cohesion** — how closely related the responsibilities within a **single class/module** are. **High cohesion** means the class does one thing well (Single Responsibility Principle). A `UserRepository` that only handles User CRUD is highly cohesive. A `UserRepository` that also sends emails and generates PDFs is low cohesion.
* **Coupling** — how much one class/module **depends on** another. **Low coupling** means classes interact through narrow interfaces and can be swapped independently. Depending on `List<T>` (interface) is low coupling; depending on `ArrayList<T>` (concrete) is higher coupling.

**Goal:** High Cohesion + Low Coupling = maintainable, testable, extensible code.

**Q: Can a class have high cohesion but still be tightly coupled? Give a real example.**
**A:** Yes — this is surprisingly common. A `PaymentProcessor` that exclusively handles payments (high cohesion) but internally does:
```java
class PaymentProcessor {
    void process(Order order) {
        StripeAPI stripe = new StripeAPI();         // Tight coupling to Stripe
        MySQLConnection db = new MySQLConnection(); // Tight coupling to MySQL
        SMSService sms = new SMSService();          // Tight coupling to SMS provider
        // ...
    }
}
```
If the payment gateway changes from Stripe to PayPal, the `PaymentProcessor` must be rewritten. **Fix:** Inject dependencies via interfaces:
```java
class PaymentProcessor {
    private final PaymentGateway gateway;    // Interface, not concrete
    private final OrderRepository repo;      // Interface, not concrete
    PaymentProcessor(PaymentGateway gateway, OrderRepository repo) { ... }
}
```

**Q: Is it possible to increase cohesion and coupling at the same time?**
**A:** Yes. Breaking a monolithic "God Class" into smaller, focused classes increases cohesion but introduces inter-class dependencies (coupling). For example, splitting a 3000-line `OrderService` into `OrderValidator`, `PriceCalculator`, `InventoryChecker`, and `OrderPersister` creates four highly cohesive classes that must communicate with each other. This is acceptable coupling because each dependency is narrow and well-defined (through interfaces). The trade-off is worth it — the classes are individually testable and replaceable.

**Q: What is the difference between Association, Aggregation, and Composition?**
**A:**

| Relationship | Lifecycle | Ownership | Example |
|-------------|-----------|-----------|---------|
| **Association** | Independent | None — both exist independently | Doctor ↔ Patient |
| **Aggregation** | Independent — part survives whole's destruction | Weak "has-a" | University → Professor (professor continues if university closes) |
| **Composition** | Dependent — part dies with whole | Strong "owns-a" | House → Room (rooms don't exist without the house) |

In code, the difference is in **who creates and destroys** the part:
```java
// Composition: Engine created and owned by Car
class Car {
    private final Engine engine = new Engine(); // Car creates it
}

// Aggregation: Department doesn't own Employee
class Department {
    private List<Employee> employees; // Injected, not created
    Department(List<Employee> employees) { this.employees = employees; }
}
```

**Q: Can aggregation exist without association?**
**A:** No. Aggregation is a **specialized form** of association. The UML hierarchy is: Association → Aggregation → Composition (each more restrictive than the last). Without the basic "knows about" link (association), the whole/part relationship (aggregation) cannot exist.

**Q: What design problem can occur if you use composition everywhere?**
**A:** The system becomes **rigid and brittle**. If the parent (whole) is destroyed, all children (parts) are destroyed too — there's no reuse. Changes to the parent cascade downward. Testing becomes difficult because you can't isolate the composed parts. Additionally, deep composition hierarchies make object construction complex and tightly couple the lifecycle of unrelated components.

**Q: Give a real-world example where aggregation is a better choice than composition.**
**A:** An **Airport** and an **Airplane**. The airport "has" airplanes, but airplanes have an independent lifecycle — they fly to other airports, get sold to other airlines, or get retired. If the airport closes, the airplanes don't get demolished; they relocate. This is aggregation. In contrast, a **Car and its Engine** is composition — the engine is purpose-built for that car and doesn't independently exist in a meaningful operational sense.
