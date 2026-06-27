---
id: java-tricky-core-questions
title: Tricky Core Java Interview Questions
sidebar_label: Core Java Q&A
description: "Tricky Core Java interview scenarios across exceptions, design patterns, and Java 8 concepts."
tags: [java, interview, core-java, advanced]
---

# Tricky Core Java Interview Questions & Answers

This guide addresses advanced scenarios in Core Java, including exception handling, design patterns, and Java 8 features.

## 1. How can you break a Singleton Design Pattern?

A Singleton pattern ensures one instance per JVM, but it can be broken using:

* **Reflection:** By calling `constructor.setAccessible(true)`, you bypass the private access modifier and create a second instance. **Prevention:** Add a guard in the constructor that throws `IllegalStateException` if an instance already exists.
* **Serialization:** Serializing and deserializing an object creates a new instance with a different identity. **Prevention:** Implement `readResolve()` to return the existing instance.
* **Cloning:** If the singleton implements `Cloneable`, `clone()` produces a new instance. **Prevention:** Override `clone()` to either throw `CloneNotSupportedException` or return the existing instance.
* **Multithreading:** Two threads can simultaneously pass the `if (instance == null)` check before either creates the instance. **Prevention:** Use Double-Checked Locking with `volatile`, Bill Pugh Holder pattern, or Enum singleton.

**Best practice:** Use an **Enum Singleton** (recommended by Joshua Bloch in Effective Java). It's immune to all four attack vectors because the JVM guarantees enum instance creation is atomic, serialization-safe, and reflection-proof.

```java
public enum DatabaseConnectionPool {
    INSTANCE;
    
    private final HikariDataSource dataSource;
    
    DatabaseConnectionPool() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost/mydb");
        this.dataSource = new HikariDataSource(config);
    }
    
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}
```

## 2. `ClassNotFoundException` vs. `NoClassDefFoundError`

This is a common interview question that tests understanding of classloading timing:

| Feature | ClassNotFoundException | NoClassDefFoundError |
| :------------- | :----------- | :----------- |
| **Type** | Checked Exception | Error (unchecked, unrecoverable) |
| **When** | **Runtime** — class not found when explicitly loading | **Runtime** — class was present at **compile-time** but missing at **runtime** |
| **Trigger** | `Class.forName("com.example.Foo")`, `ClassLoader.loadClass()` | JVM tries to use a class that was available during compilation but its `.class` file is now missing |
| **Root Cause** | Wrong classpath, typo in class name, missing JAR | Deleted JAR after compilation, classpath misconfiguration in deployment |
| **Recovery** | Catchable — can provide fallback behavior | Usually fatal — indicates deployment/packaging error |

### Real-world scenarios

**ClassNotFoundException — Runtime class loading:**
```java
// JDBC driver loading (legacy pattern)
try {
    Class.forName("com.mysql.cj.jdbc.Driver"); // Not in classpath!
} catch (ClassNotFoundException e) {
    log.error("MySQL driver not found. Is mysql-connector-java in the classpath?");
}
```

**NoClassDefFoundError — Compile vs. runtime mismatch:**
```java
// Step 1: Compile with library-v1.jar (has class Helper)
// Step 2: Deploy with library-v2.jar (Helper was removed in v2!)
// Step 3: Runtime → NoClassDefFoundError: com/example/Helper

// Another common cause: static initializer failure
class Config {
    static {
        // If this throws an exception, the class is marked as unusable
        Properties props = loadProperties(); // throws IOException!
    }
}
// First access: ExceptionInInitializerError
// All subsequent accesses: NoClassDefFoundError (class failed to initialize)
```

**Interview follow-up:** `NoClassDefFoundError` can also occur when a class's **static initializer** throws an exception. The first access throws `ExceptionInInitializerError`, but all subsequent accesses throw `NoClassDefFoundError` because the JVM marks the class as failed-to-initialize.

## 3. Which predefined classes can be used as Keys in a Map?

The best candidates for Map keys are **immutable classes with well-defined `equals()` and `hashCode()`:**

* **String** — most common (hashcode is cached for performance)
* **Integer, Long, Double** and other wrapper classes
* **Enum** constants (excellent keys — fixed set, cached hashcode)
* **LocalDate, LocalDateTime** (immutable since Java 8)

### Why immutability matters for Map keys

```java
// DANGEROUS: Mutable object as key
class MutableKey {
    int id;
    
    @Override
    public int hashCode() { return id; }
    
    @Override
    public boolean equals(Object o) {
        return o instanceof MutableKey && ((MutableKey) o).id == this.id;
    }
}

MutableKey key = new MutableKey();
key.id = 1;
map.put(key, "value");     // Stored in bucket for hashCode=1

key.id = 2;                // MUTATED! hashCode is now 2
map.get(key);              // null! Looks in bucket for hashCode=2, but entry is in bucket 1
map.containsKey(key);      // false! The entry is "lost" — memory leak!
```

**Rule:** If you must use a custom class as a Map key, make it immutable and override both `equals()` and `hashCode()` following the contract.

## 4. Java 8 Stream Operations on Employee List

Given a list of Employees, here are common sorting and filtering tasks:

### Sort by Salary (Descending)
```java
// WRONG — integer overflow for large salaries!
// .sorted((e1, e2) -> (int)(e2.getSalary() - e1.getSalary()))

// CORRECT — use Comparator methods
List<Employee> sortedList = empList.stream()
    .sorted(Comparator.comparingDouble(Employee::getSalary).reversed())
    .collect(Collectors.toList());
```

**Why the cast is wrong:** `(int)(e2.getSalary() - e1.getSalary())` can overflow if salaries are large doubles. For example, `Long.MAX_VALUE - (-1)` overflows to a negative number, reversing the sort order. Always use `Comparator.comparing()` or `Double.compare()`.

### Fetch Top 3 Salaried Employees
```java
List<Employee> top3 = empList.stream()
    .sorted(Comparator.comparingDouble(Employee::getSalary).reversed())
    .limit(3)
    .collect(Collectors.toList());
```

### Fetch Employees with Salary less than the 3rd Highest
```java
List<Employee> others = empList.stream()
    .sorted(Comparator.comparingDouble(Employee::getSalary).reversed())
    .skip(3)
    .collect(Collectors.toList());
```

### More practical Stream patterns

**Group by Department:**
```java
Map<String, List<Employee>> byDept = empList.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment));
```

**Average Salary per Department:**
```java
Map<String, Double> avgSalary = empList.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)
    ));
```

**Partition into two groups:**
```java
Map<Boolean, List<Employee>> partitioned = empList.stream()
    .collect(Collectors.partitioningBy(e -> e.getSalary() > 50000));
// true → high earners, false → others
```

## 5. Why use Character Array over String for Passwords?

This is a **security** question, not a performance question:

* **Immutability Risk:** Strings are immutable. Once `"myP@ssw0rd"` is created, it stays in the **String Constant Pool** until Garbage Collection occurs — which could be minutes, hours, or never (for interned strings). During that time, a memory dump, core dump, or heap dump can extract the password.

* **No Control Over Lifetime:** You cannot force a String to be zeroed out. Even setting the reference to `null` doesn't erase the content — the string object remains in memory until GC collects it.

* **Mutable Alternative (char[]):** You can **explicitly overwrite** the array contents as soon as authentication is done:
```java
char[] password = getPasswordFromUser();
try {
    authenticate(password);
} finally {
    // Immediately overwrite the password in memory
    Arrays.fill(password, '\0');
}
```

### Additional reasons
- **Log safety:** If a `String` password is accidentally passed to `toString()` or a logger, the password appears in logs. A `char[]` prints as `[C@1a2b3c4` (memory address).
- **JConsole/JMX exposure:** String values in the heap are visible in heap dump analysis tools.

**Framework support:** `javax.security.auth.callback.PasswordCallback` uses `char[]`. Spring Security's `PasswordEncoder.encode()` accepts `CharSequence`. Java's `Console.readPassword()` returns `char[]`.

---
