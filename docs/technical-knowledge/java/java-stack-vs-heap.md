---
title: Stack vs Heap Memory in Java
description: Understand what data is stored in stack memory and heap memory in Java.
tags: [java, jvm, memory, stack, heap]
---

In Java, memory is broadly divided into two areas you use every day:

- Stack memory: per-thread call frames and method-local execution data.
- Heap memory: shared object storage managed by the garbage collector.

## What Is Stored in Stack Memory

Stack memory stores data tied to method execution.

- Method call frames (one frame per active method call)
- Primitive local variables (`int`, `double`, `boolean`, etc.)
- References of local variables (the address-like value pointing to heap objects)
- Method parameters
- Return addresses and some JVM bookkeeping for call flow

### Key Properties of Stack Memory

- Thread-local: each thread has its own stack.
- Fast allocation/deallocation: follows LIFO (last in, first out).
- Automatically cleaned up when a method returns.
- Limited size: deep recursion can cause `StackOverflowError`.

## What Is Stored in Heap Memory

Heap memory stores data that can outlive a single method call.

- Objects created with `new`
- Object fields (instance variables)
- Arrays and their elements
- Class metadata references and runtime-allocated structures (JVM-specific details vary)

### Key Properties of Heap Memory

- Shared across threads (objects can be referenced from multiple threads).
- Larger than stack in most configurations.
- Managed by the garbage collector (GC).
- Mismanaged long-lived objects can increase memory pressure and cause `OutOfMemoryError`.

## Quick Example

```java
public class MemoryExample {
    public static void main(String[] args) {
        int count = 10;               // primitive local variable -> stack
        String label = "Java";        // local reference -> stack, String object -> heap

        Person p = new Person("Ana"); // reference p -> stack, Person object -> heap
        p.sayHello();
    }
}

class Person {
    private String name;              // field stored as part of object on heap

    Person(String name) {
        this.name = name;
    }

    void sayHello() {
        String msg = "Hi";           // reference msg -> stack, String object -> heap
        System.out.println(msg + ", " + name);
    }
}
```

## Stack vs Heap Summary

| Aspect | Stack | Heap |
| --- | --- | --- |
| Ownership | Per thread | Shared by all threads |
| Lifetime | Method scope | Until unreachable + GC |
| Stores | Frames, primitives, local references | Objects, arrays, instance fields |
| Performance | Very fast push/pop | Slower allocation, GC overhead |
| Typical error | `StackOverflowError` | `OutOfMemoryError` |

## Interview-Friendly Rule of Thumb

- Stack stores where a reference variable lives during method execution.
- Heap stores what the reference points to (the actual object data).
