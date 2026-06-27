---
id: java-interview-answers-part-1
title: Java Interview Q&A - OOP & Telephonic Round
description: Comprehensive answers to Java OOP and Telephonic screening interview questions.
sidebar_position: 3
tags: [java, interview, oop, telephonic, answers]
---

# Java Interview Questions & Answers: Part 1

This guide provides deep, production-grade answers to common Object-Oriented Programming (OOP) and telephonic screening questions.

---

## Object-Oriented Programming (OOP)

### 1. What is method overloading in OOP or Java?

Method overloading occurs when a class has multiple methods with the same name but different signatures. The signature difference must be in the **number**, **type**, or **order** of arguments. 

```java
public class Printer {
    public void print(String s) { ... }
    public void print(int i) { ... }          // Overloaded by type
    public void print(String s, int count) { ... } // Overloaded by count
}
```

* **Compilation:** It is resolved at compile-time (**static polymorphism / static binding**) using the static types of the arguments passed.
* **Return Type:** You **cannot** overload a method by changing only its return type. If method signatures are identical, changing the return type results in a compile-time error.

---

### 2. What is method overriding in OOP or Java?

Method overriding occurs when a subclass provides a specific implementation for a method already defined in its superclass. The method in the subclass must have the **exact same name, arguments, and return type** (or a covariant subtype).

```java
class Animal {
    void makeNoise() { System.out.println("Generic sound"); }
}

class Dog extends Animal {
    @Override
    void makeNoise() { System.out.println("Bark"); } // Overrides parent
}
```

* **Execution:** Overriding is resolved at runtime (**dynamic polymorphism / dynamic binding**). The JVM looks up the method in the object's virtual method table (**vtable**) based on the actual runtime object, not the reference variable's type.

---

### 3. What is method hiding in Java?

Method hiding occurs when a subclass defines a `static` method with the exact same signature as a `static` method in the superclass.

```java
class Parent {
    static void show() { System.out.println("Parent Static"); }
}

class Child extends Parent {
    static void show() { System.out.println("Child Static"); } // Hiding, not overriding
}

Parent ref = new Child();
ref.show(); // Prints "Parent Static" — resolved at compile-time via reference type!
```

Unlike instance methods, static methods do not participate in runtime polymorphism. They are bound at compile time based on the reference type.

---

### 4. Is Java a pure object-oriented language? If not, why?

No, Java is not considered a 100% pure object-oriented language because:
1. **Primitive Types:** It supports raw primitives (`int`, `boolean`, `char`, etc.) that are not objects, do not inherit from `java.lang.Object`, and do not have methods.
2. **Static Members:** Static variables and methods belong to the class namespace, not to any object instance, allowing execution without instantiating objects.
3. **Wrapper Classes:** While autoboxing bridges primitives and objects, primitives are still widely used for memory efficiency.

---

### 5. What are the rules of method overloading and overriding in Java?

#### Overloading Rules
- Method signatures must differ in parameter list (count, type, or position).
- Return type, access modifiers, and exceptions thrown can be different, but they cannot be the *only* difference.

#### Overriding Rules
- Must have the same name and parameter list.
- Return type must be identical or a subtype (**covariant return type**).
- **Access Modifier:** The subclass method cannot restrict access further (e.g., overriding a `protected` method as `private` is a compilation error). It can, however, make it more accessible.
- **Exceptions:** The overriding method cannot throw broader checked exceptions than the overridden method, but can throw narrower exceptions, fewer exceptions, or any number of runtime exceptions.

---

### 6. What is covariant method overriding in Java?

Introduced in Java 1.5, covariant overriding allows the overriding method in a subclass to return a subtype of the class returned by the parent method. This avoids casting on the caller side.

```java
class Animal {
    Animal reproduce() { return new Animal(); }
}

class Dog extends Animal {
    @Override
    Dog reproduce() { return new Dog(); } // Covariant return: Dog is a subtype of Animal
}
```

---

### 7. Can we prevent overriding a method without using the final modifier?

Yes, you can prevent overriding in three ways:
1. Mark the method as `private` (subclasses cannot see it to override it).
2. Mark the method as `static` (this turns overriding into method hiding).
3. Make the constructor private and use a static factory (prevents inheritance entirely).

---

### 8. interface Default Methods & The Diamond Problem (Java 8+)

Default methods allow adding new methods to interfaces with default implementations:

```java
interface Reader {
    default void read() { System.out.println("Reading..."); }
}
```

#### The Diamond Problem
If a class implements two interfaces that declare the same default method, a compiler error occurs due to ambiguity:

```java
interface InterfaceA {
    default void run() { System.out.println("A"); }
}
interface InterfaceB {
    default void run() { System.out.println("B"); }
}

// Compilation error: Duplicate default methods named run
class MyClass implements InterfaceA, InterfaceB {
    // MUST override to resolve ambiguity:
    @Override
    public void run() {
        InterfaceA.super.run(); // Or provide custom logic
    }
}
```

---

## Telephonic Round Questions

### 9. Difference between String, StringBuffer, and StringBuilder?

* **`String`**: Immutable. Any modification creates a new object in memory. String literals are stored in the String Constant Pool.
* **`StringBuffer`**: Mutable. Modifies the underlying `char[]` / `byte[]` in-place. Methods are `synchronized` (thread-safe), which adds lock overhead.
* **`StringBuilder`**: Mutable. Identical API to `StringBuffer` but **not synchronized** (not thread-safe). It is much faster and should be preferred for single-threaded tasks like local string building.

---

### 10. Difference between Runnable and Callable?

| Feature | Runnable | Callable&lt;V&gt; |
|:--------|:---------|:------------|
| **Method** | `void run()` | `V call()` |
| **Return Value**| None (returns `void`) | Returns a result of type `V` |
| **Checked Exceptions** | Cannot throw checked exceptions | Can throw any checked exception |
| **Introduction**| Since Java 1.0 | Since Java 1.5 (`java.util.concurrent`) |

---

### 11. What is the difference between `wait()` and `notify()`?

These are final methods in `java.lang.Object` used for inter-thread coordination:

* **`wait()`**: Tells the current thread to release the object monitor/lock and go to sleep until another thread calls `notify()` or `notifyAll()` on the same monitor.
* **`notify()`**: Wakes up a single thread that is waiting on the object's monitor.
* **`notifyAll()`**: Wakes up all threads waiting on the object's monitor (recommended to avoid missed signals).

#### Production Pattern (Always check condition in a loop!)
```java
synchronized (lock) {
    // Always use a while loop, never an if block, to prevent spurious wakeups
    while (!condition) {
        lock.wait(); // Releases lock, goes to sleep
    }
    // Perform action
}
```

---

### 12. Difference between Serializable and Externalizable?

* **`Serializable`**: A marker interface (no methods). The JVM handles serialization automatically via reflection, which is slow, generates bulky byte streams, and has security vulnerabilities.
* **`Externalizable`**: Extends `Serializable` and requires implementing two methods:
  ```java
  void writeExternal(ObjectOutput out) throws IOException;
  void readExternal(ObjectInput in) throws IOException, ClassNotFoundException;
  ```
  This gives you complete control over which fields are written/read, making serialization much faster and more compact.

---

### 13. Difference between `transient` and `volatile`?

* **`transient`**: A serialization keyword. Fields marked `transient` are skipped during serialization (e.g. passwords, database connections).
* **`volatile`**: A concurrency keyword. It guarantees **visibility** of variables across threads. Reads and writes to a volatile variable bypass local CPU registers/caches and go directly to the shared system memory (RAM). It also prevents compiler instruction reordering.