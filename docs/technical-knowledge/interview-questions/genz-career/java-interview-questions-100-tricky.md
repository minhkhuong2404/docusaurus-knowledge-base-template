---
id: java-interview-questions-100
title: 100+ Core Java Tricky Interview Questions and Answers
sidebar_label: Java Interview Questions
---

# 100+ Core Java Tricky Interview Questions and Answers

**Q: Can you tell me the difference between JVM, JRE, and JDK?**
**A:** The JVM is the engine that runs Java bytecode, making Java platform-independent. The JRE contains JVM and the standard libraries that Java programs need to run. The JDK is the Java Development Kit for developers that contains everything in the JRE plus tools like compilers and debuggers to create Java applications.

**Q: What are the key components of JVM architecture?**
**A:** JVM has three components: the Class Loader, the Runtime Data Areas, and the Execution Engine. The Class Loader loads class files into the JVM. The Runtime Data Areas store data needed while the program runs, like memory for variables and code. The Execution Engine actually runs the instructions in the class files.

**Q: Can a Java application be run without installing the JRE?**
**A:** We cannot run a Java application without having the JRE because it has the essential tools and libraries the application needs to work. But there is a tool called `jlink` in the newer Java versions that lets us bundle our Java application with its own little version of the JRE.

**Q: Is it possible to have the JDK installed without having the JRE?**
**A:** No, the JDK contains the JRE. It's not possible to have the JDK without a JRE as the JRE contains essential components for running Java applications which the JDK also uses for development.

**Q: What are the memory storage available with the JVM?**
**A:** JVM memory is divided into the Heap space, Stack memory, Method area (or Metaspace in newer versions), and also the Native method stacks. Heap space is where the program stores objects and data that it creates and shares. Stack memory is used for keeping track of what happens inside each function call, including variable values. The Method area/Metaspace stores information about the program's classes like methods and constants.

**Q: How does garbage collection work in Java?**
**A:** Garbage collection in Java automatically frees memory by removing objects that are no longer used. It frees the memory from unused objects, making space for new objects.

**Q: What's the role of finalize method in garbage collection?**
**A:** The finalize method is called by the garbage collector on an object when it determines that there are no more references to the object. It's meant to give the object a chance to clean up resources before it's collected, such as closing file streams or releasing network connections.

**Q: Can you tell me what algorithm JVM uses for garbage collection?**
**A:** JVM uses multiple garbage collection algorithms such as Mark Sweep, Mark Compact, and Generational Copying, depending on the collector chosen.

**Q: How can memory leak occur in Java even if we have automatic garbage collection?**
**A:** Memory leak occurs in Java when objects are no longer needed but are still referenced from other reachable objects, preventing the garbage collector from reclaiming their memory.

**Q: Is Java 100% object-oriented programming language?**
**A:** No, Java is not considered a 100% object-oriented programming language because it uses primitive data types like `int`, `char`, etc. In a fully object-oriented language, everything is treated as an object.

**Q: What are the advantages of Java being partially object-oriented?**
**A:** Using simple non-object types like integers and booleans helps Java run faster and use less memory. The mix of features allows Java to work well with other technologies and systems which might not be fully object-oriented.

**Q: What is the use of object-oriented programming languages in enterprise projects?**
**A:** Object-oriented programming is used in big projects to make coding easier to handle. It helps organize code better, makes it easier to update and scale, and lets programmers reuse code, saving time and efforts.

**Q: Explain `public static void main(String[] args)`.**
**A:** This is the entry point of any standalone Java application. `public` makes this method accessible from anywhere. `static` means we don't need to create an object to call this method. `void` means it doesn't return any value. `main` is the name of the method. The `String[] args` part is an array that holds any command-line arguments passed to the program. When running a Java program, this is the first method that gets called.

**Q: What happens if we don't declare the main as static?**
**A:** If we don't declare the main as static, the JVM won't be able to launch the application. The program will compile, but it will fail to run, giving an error like "Main method is not static in class...".

**Q: Can we override the main method?**
**A:** No, we cannot override the main method of Java because a static method cannot be overridden. Static methods belong to the class area and are associated with a class rather than an object.

**Q: Can we overload the main method?**
**A:** Yes, we can overload the main method in Java by changing its arguments.

**Q: Can JVM execute our overloaded main method?**
**A:** No, JVM only calls the original main method. It will never call our overloaded main method.

**Q: What is the difference between primitive data types and non-primitive data types?**
**A:** Primitive data types are the basic types of data predefined by the language (e.g., `int`, `double`, `char`, `boolean`), have a fixed size, and are not objects. Non-primitive data types are objects and classes defined by the programmer or the Java API (e.g., Strings, Arrays), which can be used to call methods, and their size is not fixed.

**Q: Can primitive data types be null?**
**A:** No, primitive data types in Java cannot be null. They have default values (0 for `int`, false for `boolean`, 0.0 for `double`) and must always have a value.

**Q: Can we declare pointers in Java?**
**A:** No, Java doesn't provide the support of pointers as Java needed to be more secure.

**Q: What are wrapper classes in Java?**
**A:** A wrapper class is an object that encapsulates a primitive data type, allowing primitives to be treated as an object. Each primitive has a corresponding wrapper class (e.g., `Integer` for `int`, `Double` for `double`).

**Q: Why do we need wrapper classes?**
**A:** Wrapper classes are final and immutable, provide methods like `valueOf()`, `parseX()`, etc., and provide the features of autoboxing and unboxing.

**Q: Why we use wrapper class in collections?**
**A:** Because Java collections such as ArrayList, HashMap, and others can only hold objects and not primitive types. Wrapper classes allow primitive values to be treated as objects, enabling them to be stored and managed within these collections.

**Q: Can you explain the difference between unboxing and autoboxing in Java?**
**A:** Autoboxing automatically converts a primitive type (like `int`) to its corresponding wrapper class object (like `Integer`). Unboxing does the reverse, converting a wrapper class object back to a primitive type.

**Q: Can you provide an example where autoboxing could lead to unexpected behavior?**
**A:** When comparing two `Integer` instances using the `==` operator, autoboxing might lead to a false result because it compares object references, not values (especially for integers outside the cached range of -128 to 127).

**Q: Is there a scenario where autoboxing and unboxing could cause a NullPointerException?**
**A:** A NullPointerException can occur if you unbox a null object. For example, assigning null to an `Integer` and then using it in a context where an `int` is expected.

**Q: Can you explain the role of each try, catch, and finally block in exception handling?**
**A:** The `try` block contains code that might throw exceptions. `catch` handles those exceptions. `finally` executes code after try-catch regardless of an exception, typically used for cleanup.

**Q: What happens if a return statement is executed inside the try or catch block? Does the finally block still execute?**
**A:** The finally block executes even if a return statement is used in the try or catch block, ensuring cleanup runs.

**Q: Is it possible to execute a program without a catch block? If so, how would you use try and finally together?**
**A:** Yes, we can use try with finally without a catch block to ensure cleanup occurs even if we allow the exception to propagate up.

**Q: How does exception handling with try catch finally affect the performance of a Java application?**
**A:** Using try catch finally can affect performance slightly due to overhead of managing exceptions but is generally minimal unless exceptions are thrown frequently.

**Q: What happens if the JVM exits via System.exit() during try or catch execution?**
**A:** The finally block will not be executed if the JVM exits via `System.exit()` during try or catch execution.

**Q: Can we write multiple finally blocks in Java?**
**A:** No, each try can only have one finally block. Multiple finally blocks are not allowed within a single try-catch-finally structure.

**Q: What is an exception and the difference between checked and unchecked exceptions?**
**A:** An exception is an unwanted event that occurs during the execution of a program and disrupts the flow. Checked exceptions must be declared and handled (e.g., IOException). Unchecked exceptions do not need to be declared or caught (e.g., NullPointerException).

**Q: How would you handle multiple exceptions in a single catch block?**
**A:** Using a single catch block for multiple exceptions by separating them with a pipe symbol `|` (e.g., `catch (IOException | SQLException e)`).

**Q: What is String Pool?**
**A:** A Java String Pool is a place in the heap memory where all the strings defined in the program are stored. Whenever we create a new String object, JVM checks the pool. If the string is available, the same object reference is shared.

**Q: Are there scenarios where using the string pool might not be beneficial?**
**A:** It will not be beneficial when there are a lot of unique strings, because it will be complex to check each string.

**Q: Can you please tell me about String and StringBuffer?**
**A:** String in Java is immutable, meaning once created, its value cannot be changed. StringBuffer is mutable and thread-safe.

**Q: Why String Builder is introduced when we already had String Buffer?**
**A:** StringBuilder is similar to StringBuffer but is not thread-safe, making it faster for single-threaded scenarios where thread safety is not a concern.

**Q: Give a scenario where a StringBuffer is better than the String.**
**A:** A scenario where StringBuffer is more appropriate is when frequent string modifications are required, especially in a multi-threaded environment where thread safety is needed.

**Q: Why do we use packages in Java?**
**A:** Packages are used to group related classes, interfaces, and sub-packages. They prevent naming conflicts, manage access control, and provide a structured way to manage Java code.

**Q: What are the access modifiers in Java?**
**A:** Java uses `public`, `protected`, `default` (no modifier), and `private` to control access to classes, methods, and fields, ensuring appropriate encapsulation and security within the application.

**Q: Why do we use getter/setters when we can make fields public directly?**
**A:** Using getter/setters allows us to control how values are set and accessed, add validation, and keep the ability to change how data is stored without affecting other parts of a program.

**Q: Can a top-level class be private or protected in Java?**
**A:** No, a top-level class cannot be private or protected because it restricts access, making it unusable from any other class and defeating the purpose of a top-level class.

**Q: Explain the concept of a class and objects in Java.**
**A:** Classes are blueprints for objects in Java, defining the state and behavior that the object of the class can have. Objects are instances of classes, representing entities with states and behavior defined by their class.

**Q: What are the ways to create an object?**
**A:** 1. Using the `new` keyword.
2. Using a class factory method (e.g., `Calendar.getInstance()`).
3. Using the `clone()` method.

**Q: Can a class in Java be without any method or fields?**
**A:** Yes, a class in Java can be declared without any method or fields. Such a class can still be used to create objects, although these objects would have no specific behavior or state.

**Q: What is a Singleton class?**
**A:** A singleton class is a special class that can have only one instance at any time. It's useful when we want to make sure there is just one shared resource (like configuration settings or a database connection).

**Q: How can we create this Singleton class?**
**A:** 1. Make the constructor private.
2. Create a private static instance of the class.
3. Provide a static method to return that instance.

**Q: How do we prevent multiple instances in a Singleton if accessed by multiple threads?**
**A:** We can synchronize the method that creates the instance or use a static initializer to prevent multiple instances.

**Q: What is a constructor in Java?**
**A:** A constructor is a special method used to initialize an object. It has the same name as the class and may take arguments to set initial values for the object's attributes.

**Q: Can we use a private constructor?**
**A:** Yes, they are mostly used in classes that provide static methods or contain only static fields, commonly in the Singleton design pattern.

**Q: Can a constructor be overloaded?**
**A:** Yes, we can have multiple constructors in a Java class, each with a different set of parameters.

**Q: What does immutability mean in Java?**
**A:** Immutability in Java means that once an object's state is created, it cannot be changed.

**Q: Why are immutable objects useful for concurrent programming?**
**A:** They are useful because they can be shared among threads without needing synchronization.

**Q: What are immutable classes?**
**A:** Immutable classes are classes whose objects cannot be modified after they are created.

**Q: How can we create an immutable class?**
**A:** 1. Declare the class as `final`.
2. Make all fields `final` and `private`.
3. Don't provide setter methods.
4. Initialize all fields using a constructor method.

**Q: What does Java inheritance mean?**
**A:** Inheritance in Java means a class can use the features of another class. This helps reuse code and makes things simpler.

**Q: Can a class extend on its own?**
**A:** No, a class cannot extend itself.

**Q: Why is multiple inheritance not possible in Java?**
**A:** Java avoids multiple inheritance because it can make things complicated, such as when two parent classes have methods that conflict.

**Q: What is the difference between inheritance and composition?**
**A:** Inheritance is when one class gets its features from another class. Composition is when a class is made using parts from other classes, which can be more flexible.

**Q: What does polymorphism mean in Java?**
**A:** Polymorphism means the same piece of code can do different things depending on what kind of object it's dealing with (e.g., a `draw()` method drawing a circle for a Circle object and a square for a Square object).

**Q: How does method overloading relate to polymorphism?**
**A:** Method overloading is using the same method name with different inputs in the same class, serving as a simple way to use polymorphism.

**Q: What is dynamic method dispatch in Java?**
**A:** Dynamic method dispatch is the mechanism by which a call to an overridden method is resolved at runtime, ensuring the correct method is used based on the type of object.

**Q: Can a constructor be polymorphic?**
**A:** No, a constructor cannot be polymorphic.

**Q: What does abstraction mean in Java?**
**A:** Abstraction means focusing on what needs to be done, not how to do it. You create a blueprint that tells other parts of the program what actions they can perform without explaining the details.

**Q: Can you provide an example of where abstraction is effectively used in Java libraries?**
**A:** Java uses abstraction in its Collections framework (e.g., using a `List` interface without needing to know if the underlying store is an `ArrayList` or `LinkedList`).

**Q: What happens if a class includes an abstract method?**
**A:** A class with an abstract method must itself be abstract. We cannot create objects directly from an abstract class.

**Q: How does abstraction help in achieving independent application parts?**
**A:** Abstraction helps hide complexities and only shows what is necessary, making it easier to change parts of a program without affecting others.

**Q: What is an Interface in Java?**
**A:** An interface is a blueprint for a class. It defines a set of methods that the class must implement without specifying how those methods should work.

**Q: What is the difference between an Interface and Abstract class in Java?**
**A:** Abstract classes achieve partial abstraction (can have abstract and non-abstract methods). Interfaces achieve full abstraction (historically only abstract methods, though modern Java allows default and static methods).

**Q: Can you provide an example of when to use an Interface versus when to extend a class?**
**A:** Use an interface when you want to list the methods a class should have without detailing how they work. Use class extensions to inherit attributes and behaviors from an existing class.

**Q: How do you use multiple inheritance in Java using interfaces?**
**A:** We cannot inherit from multiple classes directly, but a class can implement multiple interfaces at once.

**Q: Can an Interface in Java contain static methods?**
**A:** Yes, interfaces in Java can have static methods which you can use without creating an instance of the class.

**Q: What does encapsulation mean in Java?**
**A:** Encapsulation is like putting important information into a safe. We store data and methods inside a class and control who can access or change the data by using specific methods.

**Q: How does encapsulation enhance security and integrity?**
**A:** Encapsulation keeps important data hidden and safe, only letting certain parts of a program use this data, which prevents mistakes and keeps data secure.

**Q: What is method overloading in Java?**
**A:** Method overloading means having multiple methods with the same name but different parameters in the same class.

**Q: How does the Java compiler determine which overloaded method to call?**
**A:** The compiler looks at the number and types of the arguments provided and picks the method that matches best.

**Q: Is it possible to overload a method that differs only by its return type in Java?**
**A:** No, methods must differ by their parameters for overloading to be valid.

**Q: What are the rules for method overloading in Java?**
**A:** Parameters must differ in how many they are, what type they are, or the order they are in.

**Q: What is method overriding in Java?**
**A:** To override a method, the new method in the subclass must have the same name, return type, and parameters as the method in the parent class.

**Q: How does the @Override annotation influence method overriding?**
**A:** The `@Override` annotation tells the compiler that the method is supposed to replace one from its superclass, helping find mistakes if it doesn't actually override properly.

**Q: What happens if a superclass method is overridden by more than one subclass in Java?**
**A:** Each subclass will have its own version of that method.

**Q: What is `this` and `super` keyword in Java?**
**A:** `this` is used to refer to the current class instance/members. `super` is used to access methods/members of the parent class.

**Q: Can the `this` keyword be assigned a new value in Java?**
**A:** No, it cannot be assigned a new value; it's a read-only reference that always points to the current object.

**Q: What happens if we attempt to use the `super` keyword in a class that doesn't have a superclass?**
**A:** A compilation error occurs.

**Q: Can the `this` or `super` keyword be used in a static method?**
**A:** No, they cannot be used in a static method because static methods belong to the class, not instances.

**Q: How does `super` play a role in polymorphism in Java?**
**A:** The `super` keyword lets a subclass use methods from its parent class, helping it behave in a different way.

**Q: What is the `static` keyword in Java?**
**A:** The `static` keyword indicates that a particular member (variable or method) belongs to the class rather than any instance of the class.

**Q: Can a static block throw an exception?**
**A:** Yes, but the exception must be handled within the block itself or declared appropriately.

**Q: Can we override a static method in Java?**
**A:** No, static methods cannot be overridden because method overriding is based on dynamic binding at runtime, whereas static methods are bound at compile time.

**Q: Is it possible to access non-static members from within a static method?**
**A:** Yes, by creating an instance of the class containing those members.

**Q: What is a static block?**
**A:** A static block is used to initialize static variables. The statements inside are executed only once when the class is loaded into memory.

**Q: Can we print something on console without the main method in Java?**
**A:** Prior to Java 8, yes, using a static block. From Java 8 onwards, it is not possible.

**Q: What is the `final` keyword in Java?**
**A:** The `final` keyword is used to declare constants (making variables unchangeable), to prevent method overriding, or to prevent class inheritance.

**Q: What are some common use cases for using final variables?**
**A:** Defining constants, parameters passed to methods, and local variables in lambdas or anonymous inner classes.

**Q: How does the final keyword contribute to immutability and thread safety?**
**A:** It ensures a variable's value or object's reference cannot be changed once assigned, preventing unintended modifications.

**Q: Can you describe any performance considerations related to using final?**
**A:** The `final` keyword improves performance by reducing call overhead (allowing the compiler to optimize).

**Q: What is a Functional Interface?**
**A:** Functional Interfaces are interfaces in Java that have exactly one abstract method. They are used to represent behaviors as objects, enabling functional programming.

**Q: Can a functional interface extend another interface?**
**A:** Yes, but only if the inherited methods are default or static, ensuring the functional interface still only has one abstract method.

**Q: Can you tell me some new features introduced in Java 8?**
**A:** Lambda expressions, Stream API, Method references, Default methods, Optional class, and the new Date/Time API.

**Q: Why were Optional, Lambdas, and Streams introduced in Java 8?**
**A:** `Optional` addresses NullPointerException issues. `Lambdas` make it easier to write code for single-method interfaces. `Stream API` helps process collections of data efficiently, especially for bulk operations.

**Q: Difference between `filter` and `map` functions of Stream API?**
**A:** `filter` eliminates elements where a condition is not satisfied. `map` is used to perform operations on all elements and returns all modified elements.

**Q: Can you tell me some new features introduced in Java 11?**
**A:** HTTP Client, Epsilon Garbage Collector, Z Garbage Collector, Local-Variable Syntax for Lambda Parameters, and String methods like `isBlank()`, `strip()`, `repeat()`.

**Q: Can you tell me some new features introduced in Java 17?**
**A:** Sealed Classes, Pattern Matching for `switch`, and Foreign Function & Memory API.

**Q: Can you tell me some new features introduced in Java 21?**
**A:** Virtual Threads, Structured Concurrency, Scoped Values, Sequenced Collections, and Record Patterns.

**Q: What is the Collection Framework in Java?**
**A:** It is a set of tools that help organize, store, and manage groups of data easily (like Lists, Sets, Maps).

**Q: What are the main interfaces of the Java Collection framework?**
**A:** Collection, List, Set, Queue, and Map.

**Q: Can you explain how Iterator works?**
**A:** An Iterator is a tool that lets you go through a collection's elements one by one.

**Q: What are some common methods available in all Collection types?**
**A:** `add`, `remove`, `clear`, `size`, `isEmpty`.

**Q: How does the Collection framework handle concurrency?**
**A:** It uses special collection classes like `ConcurrentHashMap` and `CopyOnWriteArrayList` which let different parts of a program modify the collection safely at the same time.

**Q: How do you choose the right Collection type?**
**A:** List if we want ordered/duplicate elements. Set if we need unique elements. Queue for processing elements in order. Map for storing key-value pairs.

**Q: What enhancements were made to the Java Collection Framework in Java 8?**
**A:** Java 8 added Streams (to handle collections in bulk) and Lambda expressions (to simplify writing operations on collections).

**Q: What is the difference between Iterator and ListIterator?**
**A:** Iterator allows forward traversal. ListIterator extends Iterator to allow bidirectional traversal of a List and supports element modification.

**Q: Name the algorithm used by `Arrays.sort` and `Collections.sort`.**
**A:** `Arrays.sort` uses a Dual-Pivot Quicksort algorithm for primitive types and TimSort for object arrays. `Collections.sort` uses TimSort.

**Q: What's the use case of ArrayList, LinkedList, and HashSet?**
**A:** Use ArrayList for efficient random access to elements. Use LinkedList for frequent insertions/deletions. Use HashSet to ensure there is no duplication.

**Q: Can you describe how `hashCode` and `equals` work together in a collection?**
**A:** `hashCode` determines which bucket an object goes into, while `equals` checks equality between objects in the same bucket to handle collisions, ensuring each key is unique.

**Q: Can you give an example where a TreeSet is more appropriate?**
**A:** A TreeSet is more appropriate when you need elements to be automatically sorted.

**Q: What is the internal working of HashMap in Java?**
**A:** A HashMap stores key-value pairs in an array where each element is a bucket. It uses a hash function to determine the bucket. If two keys end up in the same bucket, a collision happens. The HashMap manages this collision using a linked list or a balanced tree (in newer Java versions).

**Q: What happens when two keys have the same hash code?**
**A:** They end up in the same bucket and are linked together in a list/tree inside that bucket.

**Q: What changes were done for the Java HashMap in Java 8?**
**A:** Before Java 8, HashMap dealt with collisions using a simple linked list. Starting from Java 8, when too many items end up in the same bucket, the list turns into a balanced tree, which helps speed up searching.

**Q: Can we include a class as a key in a HashMap?**
**A:** Yes, but it's important to ensure that the class overrides `hashCode()` and `equals()` methods properly.

**Q: Can you please explain ConcurrentHashMap?**
**A:** ConcurrentHashMap is a version of HashMap that is safe to use by many threads at once without needing to lock the entire map. It splits the map into parts that can be locked separately.

**Q: How does it improve performance in a multi-threaded environment?**
**A:** By letting different threads access and modify different parts of the map simultaneously, reducing wait times.

**Q: What is the time complexity of insert, delete, and traversal of HashSet and HashMap?**
**A:** Insertion/Deletion: Average O(1), Worst O(n) (if rehashing or severe collision occurs). Retrieval: Average O(1), Worst O(n).

**Q: What is the time complexity of insert, delete, and retrieval of TreeSet and TreeMap?**
**A:** O(log n) for all operations because they are internally sorted using self-balancing trees.

**Q: What techniques do HashMap, TreeMap, HashSet, and TreeSet use internally?**
**A:** HashMap uses an array of nodes (linked list/tree). TreeMap uses a Red-Black Tree. HashSet internally uses a HashMap. TreeSet internally uses a TreeMap.

**Q: What is a Design Pattern in Java and why do we use it?**
**A:** Design patterns are proven solutions for common software design problems. They provide standardized approaches to organize code.

**Q: Can you list and explain a few common design patterns?**
**A:** - Singleton: Ensures a class has only one instance with a global access point.
- Observer: Allows objects to notify others about changes in their state.
- Factory Method: Delegates object creation to subclasses.

**Q: How can design patterns affect the performance of a Java application?**
**A:** They can add complexity, but they improve system architecture and maintainability, often outweighing initial performance costs.

**Q: Which design pattern would you use to manage database connections?**
**A:** The Singleton pattern.

**Q: How do you choose the appropriate design pattern?**
**A:** Understand the problem fully, identify the requirements, and consider the pros and cons of each pattern.

**Q: What are SOLID principles?**
**A:**
- **S** (Single Responsibility Principle): A class should only have one reason to change.
- **O** (Open-Closed Principle): Classes should be open for extension but closed for modification.
- **L** (Liskov Substitution Principle): Objects of a superclass should be replaceable with objects of its subclasses.
- **I** (Interface Segregation Principle): Do not force any client to depend on methods it does not use. Split large interfaces.
- **D** (Dependency Inversion Principle): High-level modules should not depend directly on low-level modules but should communicate through abstractions like interfaces.

**Q: What is a Thread in Java and how can we create it?**
**A:** A thread is a pathway of execution within a program. We can create it by extending the `Thread` class or implementing the `Runnable` interface.

**Q: Can you explain the life cycle of a Java thread?**
**A:** New, Runnable, Blocked, Waiting, Timed Waiting, and Terminated.

**Q: How would you handle a scenario where two threads need to update the same data structure?**
**A:** Use `synchronized` blocks or methods to ensure that only one thread accesses the data structure at a time.

**Q: Can we start a thread twice?**
**A:** No, attempting to restart a thread that has already run will throw an `IllegalThreadStateException`.

**Q: What is the difference between Thread class and Runnable interface?**
**A:** A Thread class defines thread execution. The Runnable interface is intended to be implemented by a class whose instances are executed by a thread.

**Q: How can you ensure a method is thread-safe in Java?**
**A:** Use synchronization mechanisms like `synchronized` blocks, `volatile` variables, or concurrent structures.

**Q: What are volatile variables?**
**A:** Volatile variables indicate that a variable's value will be modified by different threads, ensuring any read is always the latest written value.

**Q: What is thread synchronization and why is it important?**
**A:** It controls the access of multiple threads to shared resources to prevent data inconsistency and ensure thread safety.

**Q: Can you describe a scenario where you would use `wait()` and `notify()`?**
**A:** Use them for inter-thread communication, like when one thread needs to wait for another to complete a task before proceeding.

**Q: What is the Java Memory Model and how is it linked to threads?**
**A:** It defines the rules by which Java programs achieve consistency when reading and writing variables across multiple threads.

**Q: Can we create a server in a Java application without Spring or any other framework?**
**A:** Yes, using Java SE APIs like the `ServerSocket` class for TCP or the `HttpServer` class.

**Q: What is the `transient` keyword?**
**A:** It is used to indicate that a field should not be serialized.

**Q: What is the Exchanger class?**
**A:** A synchronization point at which threads can pair and swap elements.

**Q: What is Reflection in Java?**
**A:** The capability to inspect and modify the runtime behavior of applications (manipulating internal properties of classes/methods dynamically).

**Q: What is a Weak Reference and Soft Reference?**
**A:** Weak References are garbage collected when no strong references exist. Soft References are only cleared at the discretion of the garbage collector, typically when memory is low.

**Q: What is Java Flight Recorder?**
**A:** A tool for collecting diagnostic and profiling data about a running Java application without significant performance overhead.

**Q: What is Serialize and Deserialize data?**
**A:** Serialization is converting an object into a byte stream. Deserialization is turning the byte stream back into an object.

**Q: What is the difference between Young Generation and Old Generation memory spaces?**
**A:** The Young Generation stores newly created objects. The Old Generation holds objects that have survived several garbage collection cycles in the Young Generation.