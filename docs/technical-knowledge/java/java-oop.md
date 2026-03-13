---
title: Object-Oriented Programming in Java
description: Guide to object-oriented programming in Java, covering encapsulation, inheritance, polymorphism, abstraction, and SOLID principles.
tags: [java, oop, object-oriented-programming, solid]
---

# Object-Oriented Programming in Java

Object-Oriented Programming (OOP) is the foundation of Java. Everything in Java revolves around **objects** and **classes**, making it one of the most naturally OOP-friendly languages available.

## Core Concepts

### 1. Class & Object

A **class** is a blueprint. An **object** is an instance of that blueprint.

```java
public class Car {
    String brand;
    int year;

    public Car(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }

    public void drive() {
        System.out.println(brand + " is driving!");
    }
}

// Creating an object
Car myCar = new Car("Toyota", 2022);
myCar.drive(); // Toyota is driving!
```

---

### 2. Encapsulation

**Encapsulation** means bundling data (fields) and behavior (methods) together, while restricting direct access to internal state using access modifiers.

:::info Key Idea
Hide the data, expose the behavior.
:::

```java
public class BankAccount {
    private double balance; // hidden from outside

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
        }
    }
}
```

**Access Modifiers:**

| Modifier    | Same Class | Same Package | Subclass | Everywhere |
| ----------- | :--------: | :----------: | :------: | :--------: |
| `private`   |     ✅      |      ❌       |    ❌     |     ❌      |
| (default)   |     ✅      |      ✅       |    ❌     |     ❌      |
| `protected` |     ✅      |      ✅       |    ✅     |     ❌      |
| `public`    |     ✅      |      ✅       |    ✅     |     ✅      |

:::tip Spring Tip
Spring beans rely heavily on encapsulation. `@Service`, `@Repository`, and `@Component` classes expose only what's needed through public methods or interfaces.
:::

---

### 3. Inheritance

**Inheritance** allows a class to acquire properties and methods from a parent class using the `extends` keyword.

```java
public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void makeSound() {
        System.out.println(name + " makes a sound.");
    }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name); // call parent constructor
    }

    @Override
    public void makeSound() {
        System.out.println(name + " barks!");
    }
}

Animal dog = new Dog("Rex");
dog.makeSound(); // Rex barks!
```

**Key rules:**
- Java supports **single inheritance** only (one parent class)
- Use `super` to access parent class members
- `@Override` annotation signals an intentional method override — always use it!

:::warning
Avoid deep inheritance chains (more than 2–3 levels). They make code harder to understand and maintain. Prefer **composition over inheritance** when possible.
:::

---

### 4. Polymorphism

**Polymorphism** means "many forms" — the same interface can behave differently depending on the actual object.

#### Compile-time (Method Overloading)

```java
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public double add(double a, double b) { // same name, different params
        return a + b;
    }
}
```

#### Runtime (Method Overriding)

```java
public class Shape {
    public double area() {
        return 0;
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    private double width, height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}

// Polymorphic behavior
List<Shape> shapes = List.of(new Circle(5), new Rectangle(4, 6));
shapes.forEach(s -> System.out.println(s.area()));
```

:::tip Spring Tip
Polymorphism powers Spring's dependency injection. You program to an **interface**, and Spring injects the correct implementation at runtime.
:::

---

### 5. Abstraction

**Abstraction** hides implementation details and exposes only the essential features. Java achieves this through **abstract classes** and **interfaces**.

#### Abstract Class

```java
public abstract class Vehicle {
    protected String model;

    public Vehicle(String model) {
        this.model = model;
    }

    public abstract void fuelUp(); // must be implemented by subclass

    public void startEngine() {    // shared behavior
        System.out.println(model + " engine started.");
    }
}

public class ElectricCar extends Vehicle {
    public ElectricCar(String model) {
        super(model);
    }

    @Override
    public void fuelUp() {
        System.out.println(model + " is charging...");
    }
}
```

#### Interface

```java
public interface Payable {
    void processPayment(double amount); // implicitly public & abstract

    default void printReceipt() {       // default method (Java 8+)
        System.out.println("Payment processed.");
    }
}

public class CreditCardPayment implements Payable {
    @Override
    public void processPayment(double amount) {
        System.out.println("Charging $" + amount + " to credit card.");
    }
}
```

**Abstract Class vs Interface:**

| Feature              | Abstract Class      | Interface                     |
| -------------------- | ------------------- | ----------------------------- |
| Instantiation        | ❌ Cannot            | ❌ Cannot                      |
| Multiple inheritance | ❌ No                | ✅ Yes (`implements A, B`)     |
| Constructor          | ✅ Yes               | ❌ No                          |
| Fields               | Any type            | `public static final` only    |
| Methods              | Abstract + concrete | Abstract + `default`/`static` |

:::tip Spring Tip
Interfaces are everywhere in Spring. `JpaRepository`, `ApplicationContext`, `BeanFactory` — you always code to the interface, letting Spring provide the implementation.
:::

---

## SOLID Principles

These 5 principles guide writing clean, maintainable OOP code.

| Principle                 | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| **S**ingle Responsibility | A class should have only one reason to change              |
| **O**pen/Closed           | Open for extension, closed for modification                |
| **L**iskov Substitution   | Subclasses must be substitutable for their base class      |
| **I**nterface Segregation | Prefer small, specific interfaces over large, general ones |
| **D**ependency Inversion  | Depend on abstractions, not concrete implementations       |

```java
// ✅ Dependency Inversion in Spring
@Service
public class OrderService {
    private final PaymentGateway paymentGateway; // interface, not implementation

    public OrderService(PaymentGateway paymentGateway) { // injected by Spring
        this.paymentGateway = paymentGateway;
    }
}
```

:::note
Following SOLID principles naturally leads to better Spring application design — especially **Dependency Inversion**, which is the backbone of Spring's IoC container.
:::

---

## Quick Reference

```
OOP in Java
├── Encapsulation  → private fields + public getters/setters
├── Inheritance    → extends (single), super keyword
├── Polymorphism   → overloading (compile-time), overriding (runtime)
└── Abstraction    → abstract class, interface
```

## Further Reading

- [Java OOP Documentation (Oracle)](https://docs.oracle.com/javase/tutorial/java/concepts/)
- [Effective Java – Joshua Bloch](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Spring Framework & OOP Patterns](https://spring.io/guides)