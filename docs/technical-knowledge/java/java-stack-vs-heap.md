---
title: Stack vs Heap Memory in Java
description: An in-depth guide to understanding what data is stored in stack memory and heap memory in the Java Virtual Machine (JVM), including memory tuning and garbage collection.
tags: [java, jvm, memory, stack, heap, garbage-collection]
---

In Java, memory management is handled automatically by the Java Virtual Machine (JVM). While you don't manually allocate and free memory like in C or C++, understanding how the JVM divides memory is crucial for writing performant, bug-free applications. 

Memory is broadly divided into two primary areas you interact with daily:

- **Stack memory:** Per-thread memory used for execution call frames and method-local execution data.
- **Heap memory:** Shared memory space used for dynamic object storage, managed by the Garbage Collector (GC).

---

## What Is Stored in Stack Memory

Stack memory is responsible for storing data tied tightly to method execution. It represents the "execution trace" of a specific thread.

- **Method Call Frames:** Every time a method is invoked, a new block (frame) is created on top of the stack.
- **Primitive Local Variables:** Types like `int`, `double`, `float`, `boolean`, `char`, `byte`, `short`, and `long` that are declared inside a method.
- **Object References:** The actual memory address/pointer of an object stored in the heap. 
- **Method Parameters:** Arguments passed into the method.
- **Return Addresses:** Information telling the JVM where to return control after the method finishes.

### Key Properties of Stack Memory

- **Thread-Local:** Each thread has its own dedicated stack. This makes local variables inherently thread-safe because they cannot be accessed by other threads.
- **Fast Allocation/Deallocation:** Follows a strict LIFO (Last-In, First-Out) order. Memory is instantly reclaimed the moment a method returns or throws an exception.
- **Continuous Memory:** Stack memory is allocated in a contiguous block, which contributes to its high speed.
- **Size Constraints:** The stack is much smaller than the heap. Deep or infinite recursion will quickly exhaust this space, throwing a `java.lang.StackOverflowError`.
- **Tuning Flag:** You can adjust the stack size for each thread using the JVM flag `-Xss` (e.g., `-Xss1m`).

---

## What Is Stored in Heap Memory

Heap memory is the runtime data area from which memory for all class instances (objects) and arrays is allocated. It is designed to store data that outlives a single method call.

- **Objects created with `new`:** Any instance of a class (e.g., `new ArrayList<>()`, `new Person()`).
- **Object Fields (Instance Variables):** Both primitive and reference variables declared at the class level live on the heap *inside* their parent object.
- **Arrays:** Arrays are always objects in Java, meaning both the array itself and its elements (if they are primitives) live on the heap.
- **String Pool:** A special storage area in the heap specifically for String literals to optimize memory usage and avoid creating duplicate Strings.

### Key Properties of Heap Memory

- **Shared Across Threads:** All threads share the same heap. Objects here can be accessed globally, meaning you must use synchronization or concurrent collections to maintain thread safety.
- **Generational Structure:** Modern JVMs divide the heap to optimize garbage collection:
  - **Young Generation:** Where newly created objects start. It is divided into Eden Space and Survivor Spaces. Most objects die young here (Minor GC).
  - **Old (Tenured) Generation:** Objects that survive multiple GC cycles in the Young Generation are moved here (Major GC).
- **Garbage Collection (GC):** Dead objects (those with no active references pointing to them) are automatically cleared by the GC.
- **Size Constraints:** If the heap fills up and the GC cannot free enough space, the JVM throws a `java.lang.OutOfMemoryError: Java heap space`.
- **Tuning Flags:** You can configure the heap size using `-Xms` (initial heap size) and `-Xmx` (maximum heap size).

*(Note: Prior to Java 8, class metadata was stored in the heap in an area called PermGen. Since Java 8, this was moved to a native memory area called **Metaspace**, separate from the heap).*

---

## Quick Example: Stack vs. Heap in Action

```java
public class MemoryExample {
    public static void main(String[] args) {
        int count = 10;               // primitive local -> Stack
        
        // local reference 'label' -> Stack
        // actual String object "Java" -> Heap (String Pool)
        String label = "Java";        
        
        // local reference 'p' -> Stack
        // actual Person object -> Heap
        Person p = new Person("Ana"); 
        p.sayHello();
    }
}

class Person {
    // 'name' is a reference variable. Because it's an instance field, 
    // the reference itself lives inside the Person object on the Heap.
    private String name;              

    Person(String name) {
        this.name = name;
    }

    void sayHello() {
        // primitive local -> Stack
        int greetingCount = 1;       
        
        // local reference 'msg' -> Stack
        // actual String object "Hi" -> Heap (String Pool)
        String msg = "Hi";           
        
        System.out.println(msg + ", " + name);
    }
}
```

---

## Advanced Concept: Escape Analysis
While the general rule is "objects go to the heap," modern JVMs (using the C2 JIT compiler) employ a technique called **Escape Analysis**. If the compiler determines that an object created inside a method never "escapes" that method (i.e., it is never returned, passed to another thread, or assigned to a global variable), the JVM may optimize it using **Scalar Replacement**. This means the object is broken down into its primitive fields and allocated directly on the **Stack**, bypassing the Heap entirely to reduce Garbage Collection overhead.

---

## Stack vs Heap Summary

| Aspect            | Stack Memory                               | Heap Memory                                   |
| ----------------- | ------------------------------------------ | --------------------------------------------- |
| **Ownership**     | Per thread                                 | Shared by all threads                         |
| **Lifetime**      | Method scope (destroyed when method ends)  | Until unreachable + Garbage Collected         |
| **Stores**        | Frames, local primitives, local references | Objects, arrays, instance fields, String Pool |
| **Thread Safety** | Inherently thread-safe                     | Requires manual synchronization               |
| **Performance**   | Extremely fast (push/pop)                  | Slower allocation, subject to GC pauses       |
| **Typical Error** | `StackOverflowError`                       | `OutOfMemoryError`                            |
| **JVM Flags**     | `-Xss`                                     | `-Xms`, `-Xmx`                                |

## Interview-Friendly Rules of Thumb

1. **The Reference vs. The Object:** The Stack stores *where* a reference variable lives during method execution. The Heap stores *what* the reference points to (the actual object data).
2. **Primitives vs. Wrappers:** `int` goes on the Stack (if local). `Integer` is an object, so it goes on the Heap.
3. **Fields vs. Locals:** Local variables live on the Stack. Instance variables (fields) live on the Heap inside their objects, regardless of whether they are primitives or references.
4. **String Literals:** String literals are stored in the String Pool on the Heap, while references to them are on the Stack.
5. **Garbage Collection:** Objects on the Heap are subject to GC, while Stack memory is automatically reclaimed when methods return.
6. **Escape Analysis:** Some objects that don't escape their method may be optimized to live on the Stack instead of the Heap, improving performance.
7. **Tuning Memory:** Use JVM flags to adjust stack and heap sizes based on your application's needs and expected load.
8. **Thread Safety:** Stack variables are thread-safe by design, while Heap objects require careful synchronization to avoid concurrency issues.
9. **Performance Implications:** Excessive object creation on the Heap can lead to GC overhead, while deep recursion can lead to Stack overflow. Always consider memory usage patterns when designing your application.