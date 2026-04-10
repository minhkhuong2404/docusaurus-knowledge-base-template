---
id: java-interview-answers-part-5
title: Java Interview Q&A - Generics, JDBC & Streams
description: Comprehensive answers to Java Generics, JDBC, and Java 8 Stream & Functional Programming interview questions.
sidebar_position: 7
tags: [java, interview, generics, jdbc, java8, streams, functional-programming]
---

# Java Interview Questions & Answers: Part 5

## Generics

### 1. What is Generics in Java? What are advantages of using Generics?
Generics provide compile-time type safety. Before Java 5, developers had to cast objects retrieved from collections back to their correct type, which could lead to runtime `ClassCastException`s. Generics prevent this by allowing you to specify the type of objects a collection can hold at compile time, ensuring you only insert the correct type.

### 2. How do Generics work in Java? What is type erasure?
Generics are implemented using **Type Erasure**. The compiler erases all generic type information during compilation, replacing it with the bounds or `Object` (if unbounded), and inserts necessary casts. This means no generic type information is available at runtime (e.g., `List<String>` becomes just `List`). This was done to ensure backward compatibility with legacy code written prior to Java 5.

### 3. What is Bounded and Unbounded wildcards in Generics?
* **Bounded Wildcards** impose restrictions on the type. 
  * `<? extends T>` establishes an upper bound, meaning the type must be `T` or a subclass of `T`. 
  * `<? super T>` establishes a lower bound, meaning the type must be `T` or a superclass of `T`.
* **Unbounded Wildcards** `<?>` represent an unknown type and can be replaced with any type.

### 4. What is the difference between List&lt;? extends T&gt; and List&lt;? super T&gt;?
* `List<? extends T>` accepts any list whose elements are of type `T` or a subclass of `T` (e.g., `List<? extends Number>` accepts `List<Integer>` or `List<Float>`). You generally read from this list.
* `List<? super T>` accepts any list whose elements are of type `T` or a superclass of `T`. You generally write to this list.

### 5. How to write a generic method which accepts a generic argument and returns a Generic Type?
You declare the generic type parameter before the return type. Standard placeholders are `T` (Type), `E` (Element), or `K, V` (Key, Value).
```java
public <K, V> V put(K key, V value) {
    return cache.put(key, value);
}
```

### 6. Can you pass List&lt;String&gt; to a method which accepts List&lt;Object&gt;?
No, doing so will result in a compilation error. While `String` is an `Object`, a `List<String>` is *not* a `List<Object>`. A `List<Object>` can hold any object (like an `Integer`), so allowing a `List<String>` to act as a `List<Object>` would break type safety.

### 7. Can we use Generics with Arrays?
No, Java arrays do not support Generics. Arrays are covariant and reified (they retain their element type at runtime), whereas Generics are invariant and use type erasure. This is why it is generally recommended to prefer `List` over arrays when working with generic types.

### 8. How can you suppress an unchecked warning in Java?
If you are mixing legacy raw types with generic types, the compiler will generate an unchecked warning. You can suppress this by annotating the method or variable with `@SuppressWarnings("unchecked")`.

### 9. Difference between List&lt;Object&gt; and raw type List?
The compiler does not check type safety for the raw `List`, but it does for `List<Object>`. Furthermore, you can pass any parameterized type (like `List<String>`) to a raw `List`, but you *cannot* pass a `List<String>` to a method expecting a `List<Object>`.

### 10. Difference between List&lt;?&gt; and List&lt;Object&gt;?
`List<?>` is a list of an *unknown* type, whereas `List<Object>` is explicitly a list of any type of `Object`. You can assign `List<String>` or `List<Integer>` to a `List<?>`, but you cannot assign them to a `List<Object>`.

---

## Java Database Connectivity (JDBC)

### 1. What is JDBC?
Java Database Connectivity (JDBC) is a Java API used to communicate with relational databases. It consists of Java classes and interfaces that allow developers to execute SQL queries and interact with databases using database-specific drivers.

### 2. What are the main steps in Java to make JDBC connectivity?
1. **Load the Driver:** Load the database-specific JDBC driver.
2. **Make Connection:** Use `DriverManager` to get a `Connection` object.
3. **Get Statement:** Create a `Statement` or `PreparedStatement` from the connection.
4. **Execute Query:** Execute the SQL query to get a `ResultSet`.
5. **Close Connection:** Close the `ResultSet`, `Statement`, and `Connection` resources (usually in a `finally` block or try-with-resources).

### 3. What is a "dirty read" in a database?
A dirty read occurs when one transaction modifies a field, and another transaction reads that modified field *before* the first transaction commits or rolls back. If the first transaction rolls back, the second transaction is left with an invalid, "dirty" value.

### 4. What is a 2-Phase Commit?
It is a protocol used in distributed systems to ensure data consistency across multiple databases. 
* **Phase 1 (Commit Request):** The coordinator asks all participating databases if they are ready to commit. They lock the resources and vote "Yes" or "No".
* **Phase 2 (Commit Phase):** If all vote "Yes", the coordinator issues the final commit command. If any vote "No", a rollback is issued to all databases.

### 5. What are the different types of Statements in JDBC?
* **Statement:** Used for executing static SQL queries without parameters. (Vulnerable to SQL injection).
* **PreparedStatement:** Used for executing pre-compiled SQL queries with parameters. Highly recommended as it prevents SQL injection and performs better when executed multiple times.
* **CallableStatement:** Used to execute stored procedures in the database.

### 6. What is connection pooling?
Creating a database connection is an expensive and slow operation. Connection pooling creates a pool of ready-to-use connection objects at application startup. When a client needs a connection, it borrows one from the pool, and when finished, returns it to the pool instead of closing it, vastly improving performance.

### 7. What are the locking systems in JDBC?
* **Optimistic Locking:** Assumes multiple transactions will rarely collide. It does not lock the record when reading; instead, it checks if the record was modified by someone else at the exact moment of an update (often using a version column).
* **Pessimistic Locking:** Assumes collisions are highly likely. It explicitly locks the record (e.g., using `SELECT ... FOR UPDATE`) as soon as it selects the row, preventing others from updating it until the transaction completes.

---

## Stream API and Functional Programming (Java 8+)

### 1. What is the difference between a Collection and a Stream?
A Collection is an in-memory data structure that holds all its elements. A Stream is a computational view or pipeline that processes data from a source (like a Collection). Streams do *not* store data themselves, and unlike Collections, Streams do not modify the underlying data source.

### 2. What does the map() function do?
`map()` transforms one type of object into another by applying a function to each element in the stream. For example, applying a function that extracts the lengths of strings in a `List<String>` will result in a stream of `Integer` lengths.

### 3. What does the filter() method do?
It filters elements based on a condition specified by a `Predicate` (a function that returns a boolean). Elements that satisfy the condition are passed down the stream, while others are discarded.

### 4. What is the difference between map() and flatMap()?
While `map()` transforms objects one-to-one, `flatMap()` transforms *and* flattens. If you have a list of lists, `flatMap()` can unpack the inner lists and merge all their individual elements into a single, massive, flat stream.

### 5. Intermediate vs. Terminal operations on a Stream?
* **Intermediate Operations** (e.g., `map()`, `filter()`) return another Stream, allowing you to chain multiple operations together to form a pipeline. They are evaluated *lazily*.
* **Terminal Operations** (e.g., `forEach()`, `collect()`, `count()`) trigger the execution of the pipeline and produce a non-stream result (a value, a collection, or void). Once a terminal operation is called, the stream is consumed and cannot be reused.

### 6. What do you mean by saying Stream is "lazy"?
Intermediate operations on a stream do not perform any processing immediately. They merely build up the pipeline. The actual processing only begins when a terminal operation is invoked. The stream also "short-circuits" when possible, finishing execution as soon as it finds the required data (e.g., `findFirst()`) without scanning the rest of the dataset.

### 7. What is a functional interface in Java 8?
A functional interface is an interface that contains exactly **one abstract method**. They are used as the assignment target for lambda expressions or method references. You can explicitly mark them with the `@FunctionalInterface` annotation so the compiler ensures they only have one abstract method.

### 8. What is the difference between findFirst() and findAny()?
In a sequential stream, they generally do the same thing. In a parallel stream, `findFirst()` guarantees it will return the very first element meeting the criteria based on the stream's encounter order. `findAny()` is optimized for performance and will return whichever matching element it finds first across any of the parallel threads.

### 9. What is a Predicate interface?
It is a built-in functional interface that takes one argument and returns a `boolean` (its abstract method is `test(T t)`). It is heavily used in the `filter()` method.

### 10. What are the Supplier and Consumer functional interfaces?
* **Supplier:** Takes no arguments and returns an object (abstract method: `get()`). It acts like a factory.
* **Consumer:** Takes an argument and returns nothing (abstract method: `accept(T t)`). It consumes the input and operates via side effects (e.g., `System.out.println` used in `forEach`).

### 11. Can you convert an array to a Stream?
Yes, using `Stream.of(array)` or `Arrays.stream(array)`.

### 12. What is a parallel Stream?
A parallel stream splits the data processing tasks across multiple threads, utilizing multi-core processors. You can easily get a parallel stream from a list by calling `list.parallelStream()`. It is excellent for CPU-intensive operations on massive datasets, but the overhead of spinning up threads can make it slower than sequential streams for small or simple tasks.