---
id: java-interview-questions-trickiest
title: 70+ Trickiest Core Java Interview Questions and Answers
sidebar_label: Java Interview Questions
---

# 70+ Trickiest Core Java Interview Questions and Answers

**Q: What happens if a return statement is executed inside the try or catch block? Does the finally block still execute?**
**A:** The finally block executes even if a return statement is used in the try or catch block, ensuring cleanup runs.

**Q: Is it possible to execute a program without a catch block? If so, how would you use try and finally together?**
**A:** Yes, we can use try with finally without a catch block to ensure cleanup occurs even if we allow the exception to propagate up.

**Q: How does the exception handling with try catch finally affect the performance of a Java application?**
**A:** Using try catch finally can affect performance slightly due to overhead of managing exceptions but is generally minimal unless exceptions are thrown frequently.

**Q: Can we write multiple finally blocks in Java?**
**A:** No, each try can have only one finally block. Multiple finally blocks are not allowed within a single try catch finally structure.

**Q: How would you handle multiple exceptions in a single catch block?**
**A:** Use a single catch block for multiple exceptions by separating them with a pipe symbol. Example: `catch (IOException | SQLException e)` to handle both exceptions with the same logic.

**Q: Can a Java application be run without installing the JRE?**
**A:** We cannot run a Java application without the JRE because it has the essential tools and libraries the application needs. But there is a cool tool called `jlink` in newer Java versions from Java 9 that lets us bundle our Java application with its little version of the JRE and also with GraalVM we can build a native image that doesn't need a JRE to run.

**Q: Is it possible to have the JDK installed without having the JRE?**
**A:** No, the JDK contains the JRE. It is impossible to have a JDK without a JRE as it contains essential components for running Java applications which the JDK also uses for development.

**Q: Can you tell me what algorithm JVM uses for garbage collection?**
**A:** JVM uses multiple garbage collection algorithms such as Mark Sweep, Mark Compact, and Generational Copying depending on the collector chosen.

**Q: How can memory leak occurs in Java even if we have automatic garbage collection?**
**A:** Memory leaks in Java occurs when objects are no longer needed but still referenced from other reachable objects, and hence preventing the garbage collector from reclaiming their memory.

**Q: Is Java a 100% object-oriented programming language?**
**A:** No, Java is not considered 100% object-oriented because it uses primitive types like `int`, `char`, etc., that are not objects. In a fully object-oriented language, everything is treated as an object.

**Q: What are the advantages of Java being partially object-oriented?**
**A:** Using simple non-object types like integers and booleans helps Java run faster and use less memory. The mix of features allows Java to work well with other technologies and systems which might not be fully object-oriented.

**Q: What is the use of object-oriented programming language in the enterprise projects?**
**A:** Object-oriented programming is used in big projects to make coding easier to handle. It helps organize code better, makes it easier to update and scale, and lets programmers reuse code, saving time and efforts.

**Q: Explain `public static void main` in Java.**
**A:** `public static void main(String[] args)` is the entry point of any standalone Java application. `public` makes this method accessible from anywhere. `static` means I don't need to create an object to call this method. `void` means it doesn't return any value. And `main` is the name of this method. The `String[] args` part is an array that holds any command-line arguments passed to the program. So when I run a Java program, this is the first method that gets called.

**Q: What will happen if we don't declare the main as a static?**
**A:** If we don't declare the main method as a static in a Java program, the JVM won't be able to launch our Java application.

**Q: Can we override the main method?**
**A:** No, we cannot override the main method of Java because a static method cannot be overridden. The static method in Java is associated with a class, whereas the non-static method is associated with an object. Static belongs to the class area. Static methods don't need an object to be called.

**Q: Can we overload the main method?**
**A:** Yes, we can overload the main method in Java by just changing its arguments, but JVM only calls the original main method. It will never call our overloaded main method.

**Q: Can primitive data types be null?**
**A:** No, primitive data types in Java cannot be null. They have default values (example: 0 for `int`, false for `boolean`, 0.0 for `double`) and must always have a value.

**Q: Can we declare pointer in Java?**
**A:** No, Java does not provide the support of pointers as Java needed to be more secure, because of which the feature of the pointer is not provided in Java.

**Q: Why we use wrapper class in collections?**
**A:** Because ArrayList, HashMap, and others in Java Collection framework can only hold objects and not primitive types. Wrapper classes allow primitive values to be treated as objects, enabling them to be stored and managed within these collections. Examples of wrapper classes are Integer, Boolean, Double, etc.

**Q: Can you explain the difference between unboxing and autoboxing in Java?**
**A:** Autoboxing automatically converts a primitive type like `int` to its corresponding wrapper class object like `Integer`. Unboxing does the reverse, converting a wrapper class object back to its primitive type.

**Q: Are there scenarios where autoboxing could lead to unexpected behavior?**
**A:** Yes, when comparing two Integer instances using `==`, autoboxing might lead to false results because it compares object references, not values.

**Q: Is there any scenario where autoboxing and unboxing could cause a NullPointerException?**
**A:** A NullPointerException can occur if you unbox a null object. For example, assigning null to an Integer and then using it in a context where an `int` is expected.

**Q: Are there any scenarios where using the string pool might not be beneficial?**
**A:** It will not be beneficial when there are many unique strings because it will be complex to check each string.

**Q: Give a scenario where StringBuffer is better than the String.**
**A:** A scenario where StringBuffer is more appropriate is when frequent string modifications are required, especially in a multi-threaded environment where thread safety is needed.

**Q: Why do we use packages in Java?**
**A:** Organizing classes into the packages makes it easier to locate related classes and manage the program better.

**Q: Why do we use getter setter when we can make fields public and setting getting directly?**
**A:** Using getters and setters instead of public variables allows us to control how values are set and accessed, add validation, and keep the ability to change how data is stored without affecting other parts of your program.

**Q: Can a top-level class be private or protected in Java?**
**A:** No, a top-level class cannot be private or protected because it restricts access making it unusable from any other classes, contrary to the purpose of a top class.

**Q: Can a class in Java be without any methods or fields?**
**A:** Yes, a class in Java can be declared without any methods or fields. Such a class can still be used to create objects, although these objects would have no specific behavior or state.

**Q: How can we create singleton classes?**
**A:** In order to make a singleton class, first we have to make a constructor as private. Next, we have to create a private static instance of the class. And finally, we have to provide a static method instance. 

**Q: How do we prevent multiple instances in a Singleton if accessed by multiple threads?**
**A:** If we have multiple threads trying to create an instance at the same time, it could result in multiple instances. To prevent this, we can synchronize the method that creates the instance or use a static initializer.

**Q: Can we use a private constructor?**
**A:** Yes, we can use private constructors in Java. They are mostly used in classes that provide static methods or contain only static fields. A common use is in the singleton design pattern where the goal is to limit the class to only one object.

**Q: Can constructor be overloaded?**
**A:** Yes, we can have multiple constructors in a Java class, each with a different set of parameters. This lets us create objects in various ways depending on what information we have at the time.

**Q: Why are immutable objects useful for concurrent programming?**
**A:** These are useful in concurrent programming because they can be shared between threads without needing synchronization.

**Q: How can we create an immutable class?**
**A:** First, declare the class as `final` so it cannot be extended. Second, make all of the fields final and private so that direct access is not allowed. Third, don't provide setters methods for variables. Fourth, initialize all fields using a constructor method.

**Q: Can a class extends on its own?**
**A:** No, a class in Java cannot extend itself. If it tries, it will cause an error.

**Q: Why multiple inheritance is not possible in Java?**
**A:** Java avoids using multiple inheritance because it can make things complicated, such as when two parent classes have methods that conflict.

**Q: How does method overloading relate to polymorphism?**
**A:** Method overloading is using the same method name with different inputs in the same class. It's a simple way to use polymorphism when we are writing our code.

**Q: What is dynamic method dispatch in Java?**
**A:** Dynamic method dispatch is a way Java decides which method to use at runtime when methods are overridden in subclasses. It ensures the correct method is used based on the type of object.

**Q: Can constructor be polymorphic?**
**A:** No, constructor cannot be polymorphic. We can have many constructors in a class with different inputs, but they don't behave differently based on the object type like methods do.

**Q: Can you provide examples of where abstraction is effectively used in Java libraries?**
**A:** Java uses abstraction in its collection tools. For example, when we use a List, we don't need to know how it stores data, whether as an ArrayList or LinkedList.

**Q: What happens if a class includes an abstract method?**
**A:** A class with an abstract method must itself be abstract. We cannot create objects directly from an abstract class. It is meant to be a blueprint for other classes.

**Q: How does abstraction helps in achieving independent application parts?**
**A:** Abstraction helps us hide complexities and only show what's necessary. This makes it easier to change parts of a program without affecting others, keeping different parts independent and easier to manage.

**Q: Can you provide examples of when to use an interface versus when to extend a class?**
**A:** Use an interface when we want to list the methods a class should have without detailing how they work. Use class extensions when we want a new class to inherit attributes and behaviors from an existing class and possibly modify them.

**Q: How do you use multiple inheritance in Java using interfaces?**
**A:** In Java, we cannot inherit from multiple classes directly, but we can use interfaces for a similar effect. A class can follow the guidelines of many interfaces at once, which lets it combine many sets of capabilities.

**Q: Can an interface in Java contain static methods and if so how can they be used?**
**A:** Yes, interfaces in Java can have static methods which we can use without creating an instance of the class.

**Q: How encapsulation enhances security and integrity?**
**A:** Encapsulation keeps important data hidden and safe. It only lets certain parts of our program use this data, which helps prevent mistakes and keeps the data secure from unwanted changes.

**Q: How does the Java compiler determine which overloaded method to call?**
**A:** When we call an overloaded method, the Java compiler looks at the number and the type of arguments we have provided and picks the method that matches these arguments best.

**Q: Is it possible to overload methods that differ only by their return type in Java?**
**A:** In Java, we cannot overload methods just by changing their return type. These methods must differ by their parameters for overloading to be valid.

**Q: What are the rules for method overloading in Java?**
**A:** The parameters must differ in how many they are, what type they are, or the order they are in.

**Q: What are the rules and conditions for method overriding in Java?**
**A:** In Java, method overriding occurs when a subclass has a method with the same name, return type, and parameters as one in its parent class. The method in the subclass replaces the one in the parent class when called.

**Q: How does the override notation influence method overriding?**
**A:** The `@Override` annotation tells the compiler that the method is supposed to replace one from its super class. It's useful because it helps find mistakes if the method does not actually override an existing method from the parent class.

**Q: What happens if a super class method is overwritten by more than one subclass in Java?**
**A:** If different subclasses override the same method from a super class, each subclass will have its own version of that method.

**Q: What happens if you attempt to use a super keyword in a class that doesn't have a super class?**
**A:** If you attempt to use a super keyword in a class that doesn't have a super class, a compilation error occurs. The `super` keyword is only applicable within the sub classes to refer to members of the super class.

**Q: Can the `this` or `super` keyword be used in static method?**
**A:** No, `this` and `super` keyword cannot be used in static methods. Static methods belong to the class, not instances, and `super` refers to the super class's object context, which does not exist in a static context.

**Q: How does `super` play a role in polymorphism in Java?**
**A:** The `super` keyword lets a subclass use methods from its parent class, helping it behave in different ways, and that is nothing but a polymorphic behavior.

**Q: Can a static block throw an exception?**
**A:** Yes, a static block can throw an exception, but if it does, the exception must be handled within the block itself or declared using a `throws` clause in the class.

**Q: Can we override static methods in Java?**
**A:** No, static methods cannot be overridden in Java because method overriding is based on dynamic binding at runtime and static methods are bound at compile time.

**Q: Can we print something on console without the main method in Java?**
**A:** Prior to Java 8, yes we can print something without the main method, but it's not possible from Java 8 onwards.

**Q: What are some common use cases for using final variables in Java programming?**
**A:** Common use cases for using final variables in Java programming include defining constants, parameters passed to methods, and local variables in lambdas or anonymous inner classes.

**Q: How does the final keyword contribute to immutability and thread safety in Java?**
**A:** The final keyword contributes to immutability and thread safety in Java by ensuring that a variable's value or object's reference cannot be changed once assigned, preventing unintended modifications and potential concurrency issues.

**Q: Can a functional interface extend another interface?**
**A:** No, as functional interfaces allow to have only a single abstract method. However, functional interfaces can inherit if it contains only a static and default methods in it.

**Q: Name of the algorithm used by `Arrays.sort` and `Collections.sort`.**
**A:** `Arrays.sort` uses a Dual-Pivot Quicksort algorithm for primitive types and TimSort for object arrays. `Collections.sort` uses TimSort, a hybrid sorting algorithm combining merge sort and insertion sort.

**Q: Can you give an example where a TreeSet is more appropriate?**
**A:** A TreeSet is more appropriate when you need elements to be automatically sorted as they are inserted.

**Q: What is the internal working of HashMap in Java?**
**A:** A HashMap in Java stores key-value pairs in an array where each element is a bucket. It uses a hash function to determine which bucket a key should go into for efficient data retrieval. If two keys end up in the same bucket, a collision happens. Then the HashMap manages this collision by maintaining a linked list or a balanced tree (depending upon the Java versions) in each bucket.

**Q: What happens when two keys have the same hash code?**
**A:** If two keys have the same hash code, they end up in the same bucket in the HashMap. The keys are then linked together in a list inside the bucket to manage them.

**Q: Can you please tell me what changes were done for the HashMap in Java 8 because before Java 8 HashMap behaved differently?**
**A:** Before Java 8, HashMap dealt with collisions by using a simple linked list. Starting from Java 8, when too many items end up in the same bucket, the list turns into a balanced tree, which helps speed up searching.

**Q: How does ConcurrentHashMap improve performance in a multi-threaded environment?**
**A:** ConcurrentHashMap boosts performance in a multi-threaded setting by letting different threads access and modify different parts of the map simultaneously, reducing waiting times and improving efficiency.

**Q: How can design patterns affect the performance of a Java application?**
**A:** Design patterns can impact performance by adding complexity, but they improve system architecture and maintainability. The long-term benefits often outweigh the initial performance cost.

**Q: Which design pattern would you use to manage database connections efficiently in a Java application?**
**A:** The Singleton pattern is commonly used to manage database connections, ensuring a single shared connection instance is reused efficiently.

**Q: How would you handle a scenario where two threads need to update the same data structure?**
**A:** Use `synchronized` blocks or methods to ensure that only one thread can access the data structure at a time, preventing concurrent modification issues.

**Q: Can we start a thread twice?**
**A:** No, a thread in Java cannot be started more than once. Attempting to restart a thread that has already run will throw an `IllegalThreadStateException`.

**Q: Can we create a server in a Java application without creating Spring or any other framework?**
**A:** Yes, we can create a server in Java application using only Java SE APIs, such as by utilizing the `ServerSocket` class for a simple TCP server or the `HttpServer` class for an HTTP service.