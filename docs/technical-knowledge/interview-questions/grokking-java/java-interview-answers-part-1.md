---
id: java-interview-answers-part-1
title: Java Interview Q&A - OOP & Telephonic Round
description: Comprehensive answers to Java OOP and Telephonic screening interview questions.
sidebar_position: 3
tags: [java, interview, oop, telephonic, answers]
---

# Java Interview Questions & Answers: Part 1

## Object-Oriented Programming (OOP)

### 1. What is method overloading in OOP or Java?
When we have multiple methods with the same name but different functionality (either the number of arguments or the type of arguments), it is called method overloading. For example, `System.out.println()` is overloaded to accept different types of parameters. It is resolved at compile-time.

### 2. What is the method overriding in OOP or Java?
Method overriding requires Inheritance and Polymorphism. It occurs when a method with the exact same signature exists in both the superclass and subclass. A call to an overridden method is resolved at runtime depending upon the actual object, not the reference variable type.

### 3. What is the method of hiding in Java?
When you declare two static methods with the same name and signature in both a superclass and subclass, they hide each other. A call to the method is resolved at compile time based on the type of the reference variable, not the actual object.

### 4. Is Java a pure object-oriented language? If not, why?
Java is not a pure object-oriented programming language. There are many things you can do without objects, such as using `static` methods. Additionally, primitive variables (like `int`, `boolean`) are not objects in Java.

### 5. What are the rules of method overloading and overriding in Java?
* **Overloading:** The method signature must be different (number or type of arguments). Changing only the return type will result in a compiler error.
* **Overriding:** The name, return type, and method signature must be exactly the same. The overriding method cannot throw a higher-level checked exception than the overridden method.

### 6. The difference between method overloading and overriding?
Method overloading is resolved at compile-time (static polymorphism) using the reference type. Method overriding is resolved at runtime (dynamic polymorphism) based on the actual object created. 

### 7. Can we overload a static method in Java?
Yes, you can overload a static method. You can declare as many static methods of the same name as you wish, provided they all have different method signatures.

### 8. Can we override the static method in Java?
No, you cannot override a static method because it is not bound to an object. Static methods belong to a class and are resolved at compile time. Declaring the same static method in a subclass results in method hiding, not overriding.

### 9. Can we prevent overriding a method without using the final modifier?
Yes. You can prevent method overriding by marking the method as `private` or `static`. Those cannot be overridden by subclasses.

### 10. Can we override a private method in Java?
No. Since a private method is only accessible and visible inside the class it is declared in, it's not possible to override it in subclasses. (You can, however, override it inside an inner class).

### 11. What is covariant method overriding in Java?
Introduced in Java 1.5, covariant overriding allows the overriding method in a subclass to return a subclass of the object returned by the original overridden method (e.g., overriding a method that returns `Object` to return `String`).

### 12. Can we change the argument list of an overriding method?
No. The argument list is part of the method signature. Both overriding and overridden methods must have the exact same signature.

### 13. Can we override a method that throws a runtime exception without a throws clause?
Yes, there is no restriction on unchecked (runtime) exceptions while overriding. However, for checked exceptions, the overriding method cannot throw a checked exception higher in the hierarchy than the original method.

### 14. How do you call a superclass version of an overriding method in a subclass?
You can call it using the `super` keyword (e.g., `super.toString()`).

### 15. Can we override a non-static method as static in Java?
Yes, you can override a non-static method as long as it is not private or final. 

### 16. Can we override the final method in Java?
No. The `final` keyword explicitly prevents method overriding. This is used for security reasons (like in the `String` class) or to enforce the Template design pattern.

### 17. Can we have a non-abstract method inside an interface?
Yes, from Java 8 onward, interfaces can contain non-abstract methods in the form of `static` and `default` methods.

### 18. What is the default method of Java 8?
Default methods (extension methods) have an implementation and are intended to be used by default. They allowed JDK 8 to add functionality (like Lambda and Stream support) to existing interfaces without breaking client code.

### 19. What is an abstract class in Java?
An abstract class is incomplete and cannot be instantiated. It defines default behavior and contracts that subclasses must adhere to by implementing its abstract methods. A class can be abstract without having any abstract methods.

### 20. What is an interface in Java? What is its real use?
An interface specifies the contract of an API, supporting abstraction by defining only behavior without implementation (prior to Java 8). Its real use is to define types to leverage Polymorphism.

### 21. The difference between Abstract class and interface?
Historically, abstract classes could contain non-abstract methods and state, while interfaces could not. From Java 8 onward, interfaces can have static and default methods, but abstract classes are still used when you need to share state (instance variables) across implementations.

### 22. Can we make a class abstract without an abstract method?
Yes, simply adding the `abstract` keyword to the class definition makes it abstract.

### 23. Can we make a class both final and abstract at the same time?
No. They are exact opposites. A `final` class cannot be extended, but an `abstract` class *must* be extended to be used. The compiler will throw an error.

### 24. Can we overload or override the main method in Java?
You can overload it (create other `main` methods with different signatures), but you cannot override it because `main()` is a `static` method resolved at compile time.

### 25. What is the difference between Polymorphism, Overloading, and Overriding?
Polymorphism is the overarching concept. Overloading is compile-time Polymorphism, and Overriding is Runtime Polymorphism.

### 26. Can a class extend more than one class in Java?
No. Java does not support multiple inheritance for classes to avoid the "Diamond Problem." However, a class can implement multiple interfaces.

---

## Telephonic Round Questions

### 27. Difference between String, StringBuffer and StringBuilder in Java?
`String` is immutable. `StringBuffer` and `StringBuilder` are mutable. Between the two mutable options, `StringBuffer` is synchronized (thread-safe) while `StringBuilder` is not (faster, added in Java 1.5).

### 28. Difference between extends Thread vs implements Runnable?
Java only allows extending one class. If you extend `Thread`, you cannot extend any other class. Implementing `Runnable` leaves your class free to extend another class if needed.

### 29. Difference between Runnable and Callable interface in Java?
`Runnable`'s `run()` method cannot return a value or throw checked exceptions. `Callable` (added in JDK 1.5) defines a `call()` method that can return a value (via a `Future` object) and throw exceptions.

### 30. Difference between ArrayList and LinkedList in Java?
`ArrayList` is backed by a dynamic array (fast random access, slow insertions/deletions in the middle). `LinkedList` is backed by a doubly-linked list (slow sequential access, fast insertions/deletions).

### 31. What is difference between wait and notify in Java?
Used for inter-thread communication. `wait()` pauses a thread on a condition, and `notify()` wakes up waiting threads. Both must be called from within a synchronized context.

### 32. Difference between HashMap and Hashtable in Java?
`HashMap` is not synchronized (faster) and allows one null key. `Hashtable` is synchronized (slower) and does not allow null keys.

### 33. Difference between TreeSet and TreeMap in Java?
`TreeSet` is a Set data structure (no duplicates) implemented internally using a `TreeMap`. `TreeMap` is an implementation of the Map interface (key-value pairs) sorted by natural order or a provided Comparator.

### 34. Difference between Serializable and Externalizable in Java?
`Serializable` is a marker interface (no methods) that uses the default, often slower, JVM serialization. `Externalizable` requires implementing `readExternal()` and `writeExternal()` methods, giving you full control over the serialization process.

### 35. Difference between transient and volatile in Java?
`transient` is used in Serialization to exclude a variable from being saved. `volatile` is used in multithreading to signal the compiler that a variable will be modified by multiple threads, ensuring read/write visibility across threads.

### 36. Difference between Association, Composition and Aggregation?
Association is the relationship between objects. Aggregation is a loose form where the "part" can exist without the "whole" (e.g., a city and people). Composition is a strict form where the "part" cannot survive without the "whole" (e.g., a body and organs).

### 37. What is difference between FileInputStream and FileReader in Java?
`FileInputStream` is used to read raw binary data (bytes). `FileReader` is used to read text data (characters) and takes character encoding into account.

### 38. Can we have return statement in finally clause? What will happen?
Yes, but it is bad practice. If a `finally` block has a return statement, it overrides any return value previously established in the `try` or `catch` blocks.

### 39. Difference between static and dynamic binding in Java?
Static binding occurs at compile time (used for overloaded, private, final, and static methods). Dynamic binding occurs at runtime (used for overridden virtual methods).

### 40. Difference between Checked and Unchecked Exception in Java?
Checked exceptions are verified by the compiler and must be declared in a `throws` clause or caught. Unchecked exceptions (RuntimeExceptions) do not require explicit handling or declaration.