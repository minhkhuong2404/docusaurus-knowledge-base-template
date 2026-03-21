---
id: cognizant-fresher-java-developer-interview
title: Cognizant Fresher Technical Interview Experience & Questions
description: A comprehensive list of real technical interview questions and answers from a Cognizant Java Developer campus interview for freshers. Covers Core Java, Collections Framework, OOPs, and SQL.
tags:
  - Java
  - Fresher
  - Collections Framework
  - OOPs
  - SQL
  - Interview Experience
  - Cognizant
---

# Cognizant Fresher Java Developer Interview Questions & Answers

This guide covers real-world technical interview questions asked during a Cognizant campus placement interview for a Fresher Java Developer role. The technical round heavily focused on Core Java fundamentals, the Collections Framework, Object-Oriented Programming (OOP), and basic Database concepts.

---

## 1. Java Collections Framework

### Q: What is the difference between `ArrayList` and `LinkedList`?
**A:** * **`ArrayList`:** Uses a dynamic array internally to store elements. It provides extremely fast read access ($O(1)$) using an index but is slow for insertions and deletions in the middle because it requires shifting elements. It is preferred for read-heavy operations.
* **`LinkedList`:** Uses a doubly-linked list internally. It makes insertions and deletions much faster ($O(1)$ once positioned) but random access is slow ($O(n)$) because it must traverse the nodes. It is suited for scenarios with frequent insertions and removals.

### Q: Which is faster for insertion in the middle: `ArrayList` or `LinkedList`, and why?
**A:** A `LinkedList` is significantly faster for insertion in the middle. This is because inserting a new node simply requires updating the pointers of the neighboring nodes. An `ArrayList` is slower because it has to physically shift all the elements that come after the insertion index one position to the right to create space.

### Q: Why does `ArrayList` have an $O(1)$ `get()` method but `LinkedList` has an $O(n)$ `get()` method?
**A:** `ArrayList` stores elements in a continuous, contiguous block of memory, allowing Java to mathematically calculate the exact memory address of any index instantly. `LinkedList` stores elements as scattered, independent nodes connected by pointers. To reach a specific index, Java must traverse the chain node-by-node from the beginning (or end), making it slower.

### Q: What is the default size of an `ArrayList` and how does it grow?
**A:** By default, an `ArrayList` starts with an initial capacity of **10** (once the first element is added). When the array becomes completely full, it automatically grows by increasing its size by **50%** (1.5 times) of its current capacity. 

### Q: What exactly happens internally when an `ArrayList` becomes full?
**A:** When it becomes full, it automatically triggers a resize operation. Internally, it creates a brand new array with a larger capacity (usually 1.5x the old size). It then copies all existing elements from the old array into the new array. Because of this copying process, resizing is considered an expensive operation.

### Q: Can we store primitive types in an `ArrayList`?
**A:** No, we cannot store raw primitive types (like `int`, `double`, `char`) directly in an `ArrayList` or any Java Collection because collections only work with Objects. However, Java handles this seamlessly using **Wrapper Classes** (like `Integer`, `Double`). Through a feature called **Autoboxing**, Java automatically converts primitive values into their corresponding Wrapper objects when adding them to a list.

### Q: Why do we override the `equals` and `hashCode` methods?
**A:** We override them to define how objects should be logically compared based on their internal data (like an Employee ID) rather than simply comparing their memory references. This is critically important when using hash-based collections like `HashMap` or `HashSet`. If both methods are not overridden consistently, the collections will behave unpredictably, leading to duplicate objects being stored or data lookups failing completely.

### Q: What happens if `hashCode` is the same but `equals` is false?
**A:** This causes a **Hash Collision**. Both objects will be routed to the exact same hash bucket in the `HashMap`. The map then uses the `equals()` method to differentiate between the objects residing in that bucket. It does not break the application's functionality, but if collisions happen frequently, it degrades the map's lookup performance from $O(1)$ to $O(n)$ (or $O(\log n)$ with modern Java trees).

### Q: What happens if `equals` is true but `hashCode` is different?
**A:** This breaks the Java contract. The `HashMap` will treat the logically identical objects as completely different keys because they will generate different hash codes and be routed to different buckets. Duplicates will accidentally be stored. When you try to look up the data later using an identical object, the map will look in the wrong bucket and return `null`, causing lookup failures.

---

## 2. Core Java & Object-Oriented Programming (OOP)

### Q: What is the difference between an `Error` and an `Exception`?
**A:** Both represent problems during execution, but they differ in severity:
* **`Error`:** Represents critical, system-level issues (like `OutOfMemoryError` or `StackOverflowError`) that an application generally cannot recover from. You should not try to catch them.
* **`Exception`:** Represents problems that a programmer can anticipate and recover from using `try-catch` blocks (like `NullPointerException` or `IOException`), allowing the application to continue running gracefully.

### Q: What are the 4 main pillars of OOP?
**A:** 1. **Encapsulation:** Protecting data by hiding it and exposing it via controlled methods.
2. **Inheritance:** Promoting code reuse by allowing a child class to inherit properties from a parent.
3. **Polymorphism:** Allowing a single action or method to behave differently based on the object (Overloading and Overriding).
4. **Abstraction:** Hiding complex implementation details and exposing only the essential features to the user.

### Q: What is an Abstract Class and where do we use it in a project?
**A:** An abstract class is a class declared with the `abstract` keyword that cannot be instantiated. It can contain both abstract (unimplemented) and non-abstract (implemented) methods. We use it when we want to share common logic, fields, and code across closely related classes, while simultaneously forcing those child classes to implement specific, distinct behaviors.

### Q: What is an Interface and what is a Functional Interface? Give an example.
**A:** * **Interface:** A blueprint of a class that defines a strict contract by declaring abstract methods that implementing classes must define.
* **Functional Interface:** A special type of interface that contains exactly **one abstract method**. They are primarily used to enable Lambda Expressions in Java. 
* *Example:* `Runnable` (which only has the `run()` method) or `Comparator`.

### Q: What is a Constructor? Can we override a constructor?
**A:** A constructor is a special method used to initialize an object exactly when it is created. It has the exact same name as the class and does not have a return type. 
**No**, constructors cannot be overridden because they belong to the specific class and are not inherited by child classes. However, they *can* be overloaded within the same class.

### Q: Explain Encapsulation vs. Inheritance.
**A:** * **Encapsulation:** Focuses on data security and hiding. You make class variables `private` and provide access via `public` getter and setter methods.
* **Inheritance:** Focuses on code reusability and establishing relationships. A subclass extends a parent class to acquire its properties and behaviors, reducing code duplication.

### Q: What is a Wrapper class and what are its uses?
**A:** Wrapper classes (like `Integer`, `Boolean`, `Double`) wrap primitive data types into fully-fledged Objects. 
* **Uses:** They are mandatory when working with the Java Collections Framework (which only accepts Objects). They also provide highly useful static utility methods (like `Integer.parseInt("123")`). Java handles the conversion automatically via Autoboxing and Unboxing.

---

## 3. SQL & Databases

### Q: What are the most common SQL commands?
**A:** * **DML (Data Manipulation):** `SELECT` (read), `INSERT` (add), `UPDATE` (modify), `DELETE` (remove).
* **DDL (Data Definition):** `CREATE`, `ALTER`, `DROP`, `TRUNCATE`.
* **Clauses:** `WHERE` (filtering), `JOIN` (combining tables), `GROUP BY` (aggregating data).

### Q: Explain `COMMIT` vs. `ROLLBACK`.
**A:** Both are used in database transaction management:
* **`COMMIT`:** Saves all data changes permanently to the database when all statements in a transaction execute successfully.
* **`ROLLBACK`:** Undoes all pending changes made in the current transaction if an error or exception occurs, reverting the database to its previous, consistent state.

### Q: What are ACID properties and where are they useful?
**A:** ACID stands for **A**tomicity (all-or-nothing execution), **C**onsistency (data remains valid according to rules), **I**solation (concurrent transactions do not interfere with each other), and **D**urability (committed data is saved permanently, even during power loss).
* **Use Case:** They are mandatory in critical systems where data integrity cannot be compromised, such as banking transfers, payment gateways, and e-commerce order processing.

### Q: Write a SQL query to get the top 5 employees with a salary above 1,00,000 and age above 40.
**A:** ```sql
SELECT * FROM employees 
WHERE salary > 100000 AND age > 40 
ORDER BY salary DESC 
LIMIT 5;