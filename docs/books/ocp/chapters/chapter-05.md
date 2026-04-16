---
id: chapter-05
title: "Chapter 5 — Methods"
sidebar_label: "Ch 5 · Methods"
description: "Master Java method design: access modifiers, static vs instance members, varargs, method overloading resolution order, pass-by-value semantics, and constructor chaining — all commonly tested on the OCP exam."
tags:
  - methods
  - access-modifiers
  - overloading
  - varargs
  - pass-by-value
  - static
  - constructors
  - encapsulation
---

# Chapter 5 — Methods

<span class="chapter-badge">Exam Domain: Using Object-Oriented Concepts in Java</span>

> **Key Topics:** Method declaration, access modifiers, `static` vs instance, `varargs`, method overloading, `pass-by-value`.

---

## 🟦 New Learner: Designing Methods

### Method Declaration Anatomy

```java
//  [access] [optional modifiers] returnType name(params) [throws] { body }
public static final int add(int a, int b) throws ArithmeticException {
    return a + b;
}
```

| Element | Required? | Example |
|---------|-----------|---------|
| Access modifier | No (default if omitted) | `public`, `private`, `protected` |
| Optional modifiers | No | `static`, `final`, `abstract`, `synchronized` |
| Return type | **Yes** | `int`, `void`, `String` |
| Method name | **Yes** | `add` |
| Parameter list | **Yes** (can be empty) | `(int a, int b)` |
| Exception list | No | `throws IOException` |
| Body | **Yes** (unless abstract/native) | `{ return a + b; }` |

---

### Access Modifiers

| Modifier | Same Class | Same Package | Subclass | Anywhere |
|----------|-----------|--------------|---------|---------|
| `private` | ✅ | ❌ | ❌ | ❌ |
| package-private (none) | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

```java
public class BankAccount {
    private double balance;      // only this class
    protected String owner;      // this class + subclasses + package
    public String id;            // everyone
    int transactions;            // package-private
}
```

---

### Static vs Instance Members

```java
public class Counter {
    private static int count = 0; // shared across ALL instances
    private int id;               // unique per instance

    public Counter() {
        count++;
        this.id = count;
    }

    public static int getCount() { return count; } // static method
    public int getId() { return id; }               // instance method
}

// Static — call on class, not object
System.out.println(Counter.getCount()); // 0

Counter a = new Counter();
Counter b = new Counter();
System.out.println(Counter.getCount()); // 2
System.out.println(a.getId());          // 1
System.out.println(b.getId());          // 2
```

:::caution[Static Cannot Access Instance Members]
```java
public class Foo {
    int x = 10;
    static void bar() {
        System.out.println(x); // ❌ COMPILE ERROR: non-static field x
    }
}
```
:::

---

### Pass-by-Value

Java is **always pass-by-value**. For objects, the *reference* is passed by value.

```java
// Primitives: original cannot be changed
void doubleIt(int x) { x = x * 2; }
int n = 5;
doubleIt(n);
System.out.println(n); // still 5

// Objects: reference copy — can mutate the object, but not reassign the caller's reference
void addToList(List<String> list) { list.add("new"); }
List<String> myList = new ArrayList<>();
addToList(myList);
System.out.println(myList); // [new] — mutation visible!

void reassign(List<String> list) { list = new ArrayList<>(); }
reassign(myList);
System.out.println(myList); // still [new] — reassignment invisible!
```

---

### varargs (Variable Arguments)

```java
public static int sum(int... numbers) {
    int total = 0;
    for (int n : numbers) total += n;
    return total;
}

sum();           // OK — zero args → empty array
sum(1);          // OK
sum(1, 2, 3);    // OK
sum(new int[]{1,2,3}); // OK — explicit array
```

**Rules:**
- `varargs` must be the **last** parameter
- Only **one** `varargs` per method
- Treated as an array inside the method

---

### Method Overloading

Multiple methods with the same name but different parameter lists:

```java
public class Printer {
    void print(int i)    { System.out.println("int: " + i); }
    void print(double d) { System.out.println("double: " + d); }
    void print(String s) { System.out.println("String: " + s); }
}

Printer p = new Printer();
p.print(10);     // int: 10
p.print(10.0);   // double: 10.0
p.print("hi");   // String: hi
p.print(10L);    // double: 10.0 (long promoted to double — no long method)
```

**Java's overload resolution order:**
1. Exact match
2. Widening primitive conversion
3. Autoboxing
4. Varargs

---

## 🟣 Senior Deep Dive

### Method Hiding vs Overriding

```java
class Parent {
    static void staticMethod() { System.out.println("Parent static"); }
    void instanceMethod()      { System.out.println("Parent instance"); }
}
class Child extends Parent {
    static void staticMethod() { System.out.println("Child static"); } // HIDING
    void instanceMethod()      { System.out.println("Child instance"); } // OVERRIDING
}

Parent obj = new Child();
obj.staticMethod();   // "Parent static" — resolved at compile time (hiding)
obj.instanceMethod(); // "Child instance" — resolved at runtime (polymorphism)
```

### Covariant Return Types

An overriding method can return a **subtype** of the original return type:

```java
class Animal { Animal create() { return new Animal(); } }
class Dog extends Animal {
    @Override
    Dog create() { return new Dog(); } // covariant: Dog is-a Animal ✅
}
```

### Autoboxing in Overloading — Subtle Traps

```java
void test(Integer i) { System.out.println("Integer"); }
void test(long l)    { System.out.println("long"); }
void test(Object o)  { System.out.println("Object"); }

test(5);     // "long" — widening preferred over boxing!
test((Integer)5); // "Integer" — explicit box
```

Widening beats autoboxing beats varargs in overload resolution.

### `this()` and Constructor Chaining

```java
public class Point {
    int x, y, z;

    public Point() { this(0, 0, 0); }       // chains to (int,int,int)
    public Point(int x, int y) { this(x, y, 0); } // chains to (int,int,int)
    public Point(int x, int y, int z) {
        this.x = x; this.y = y; this.z = z;
    }
}
```

`this()` must be the **first** statement in a constructor. Cannot call `this()` and `super()` in the same constructor.

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| `private` | Same class only |
| `protected` | Package + subclasses (even different packages) |
| Static method call | Can call on instance variable, but compiles as class call |
| Overloading rule | Widening > boxing > varargs |
| `varargs` | Last parameter; treated as array; only one per method |
| Pass-by-value | Java ALWAYS passes by value; object references are copied |
| Covariant return | Override can return subtype |
| Method hiding | Static methods are hidden, not overridden |
| `this()` | Must be first statement in constructor; cannot combine with `super()` |
| Overloading ≠ overriding | Overloading is compile-time (different params); overriding is runtime (same params) |
| `protected` in subclass | A subclass in another package can only access `protected` through its own type |
| Default access | No modifier = package-private (accessible only within same package) |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 5]
**Trap 1 — Static method called on an instance (compiler resolves to class):**
```java
class Dog { static void bark() { System.out.println("Woof"); } }
Dog d = null;
d.bark(); // ✅ Compiles and runs — resolves to Dog.bark(), d is never dereferenced
```

**Trap 2 — Widening beats autoboxing in overload resolution:**
```java
void test(long l)    { System.out.println("long"); }
void test(Integer i) { System.out.println("Integer"); }

test(5); // "long" — widening int→long preferred over boxing int→Integer
```

**Trap 3 — varargs can be passed as an array OR individual elements:**
```java
void sum(int... nums) { ... }
sum(1, 2, 3);              // ✅ individual
sum(new int[]{1, 2, 3});   // ✅ array
sum();                     // ✅ empty (nums.length == 0)

// BUT:
void bad(int... a, int... b) { } // ❌ COMPILE ERROR — only one varargs allowed
void bad2(int... a, int b) { }   // ❌ COMPILE ERROR — varargs must be LAST
```

**Trap 4 — `protected` access across packages:**
```java
// Package com.parent:
public class Parent {
    protected void secret() { }
}
// Package com.child:
public class Child extends Parent {
    void test() {
        secret();           // ✅ via inheritance
        new Parent().secret(); // ❌ cannot access protected via Parent reference from different package!
    }
}
```

**Trap 5 — Pass-by-value with object mutation vs reassignment:**
```java
void addItem(List<String> list) { list.add("new"); } // mutates → visible to caller
void replace(List<String> list) { list = new ArrayList<>(); } // reassigns → NOT visible
```

**Trap 6 — Constructor chaining order:**
```java
class A {
    A() { this("hello"); System.out.println("A()"); }
    A(String s) { System.out.println("A(String)"); }
}
new A();
// Output:
// A(String)   ← this() called first
// A()         ← then rest of no-arg constructor runs
```

**Trap 7 — Method hiding vs overriding with polymorphism:**
```java
class Parent { static String name() { return "Parent"; } }
class Child extends Parent { static String name() { return "Child"; } }

Parent p = new Child();
p.name(); // "Parent" — static method hiding resolved at compile time!
```
:::

:::tip[Spring/Senior Relevance]
- Understanding method visibility is critical in Spring: `@Transactional` on a `private` or `package-private` method is silently **ignored** by Spring's proxy mechanism (only `public` methods are intercepted by default).
- `protected` methods in abstract Spring components (like `WebMvcConfigurer`) follow the same overriding rules as Java — knowing the difference between overriding and hiding prevents subtle bugs in Spring MVC configurations.
- Pass-by-value semantics explain why Spring's `@Autowired` constructor injection always works correctly — the reference to the dependency is copied into the field, but both point to the same bean.
:::

---

## 🔗 Review Questions Focus

1. Can `private` methods be overridden?
2. What is the order Java uses to resolve overloaded methods?
3. Can a `static` method access an instance field?
4. What happens when you pass an object to a method and reassign it?
5. Where must `varargs` appear in a parameter list?
6. What is the difference between method overloading and overriding?
7. Can a subclass in a different package access a `protected` method via a parent reference?
8. What happens when `this()` is called in a constructor?
9. If a method is called on a `null` reference and the method is `static`, does it throw NPE?
10. Can you overload a method by changing only the return type?
