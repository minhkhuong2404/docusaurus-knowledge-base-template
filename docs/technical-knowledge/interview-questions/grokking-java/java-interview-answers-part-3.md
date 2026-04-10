---
id: java-interview-answers-part-3
title: Java Interview Q&A - Collections & Serialization
description: Comprehensive answers to Java Collection Framework and Serialization interview questions.
sidebar_position: 5
tags: [java, interview, collections, serialization, answers]
---

# Java Interview Questions & Answers: Part 3

## Collection Framework

### 1. How does HashMap work in Java?
`HashMap` works on the principle of hashing. It stores key-value pairs in an internal array (buckets). When `put()` is called, it calculates the hash of the key to determine the bucket index. If a collision occurs, it uses a linked list (or balanced tree in newer Java versions) to store the entries. Immutable keys (like `String`) are preferred to ensure the hash code does not change.

### 2. What is the difference between poll() and remove() method of Queue interface?
Both methods return and remove the head of the queue. The difference is their behavior when the queue is empty: `remove()` throws a `NoSuchElementException`, whereas `poll()` returns `null`.

### 3. What is the difference between fail-fast and fail-safe Iterators?
* **Fail-fast Iterators** (e.g., in `ArrayList`, `HashMap`) immediately throw a `ConcurrentModificationException` if the collection is structurally modified by another thread (or the same thread outside the iterator) during iteration.
* **Fail-safe Iterators** (e.g., in `ConcurrentHashMap`, `CopyOnWriteArrayList`) operate on a clone or snapshot of the collection, so they do not throw an exception if the original collection is modified.

### 4. How do you remove an entry from a Collection during iteration?
You must use the `Iterator.remove()` method. If you use the Collection's or List's `remove()` method while iterating using a `for-each` loop or `Iterator`, it will throw a `ConcurrentModificationException`.

### 5. What is the difference between Synchronized Collection and Concurrent Collection?
Synchronized collections (like `Hashtable` or those created via `Collections.synchronizedMap()`) achieve thread safety by locking the entire collection, which severely impacts performance under high concurrency. Concurrent collections (like `ConcurrentHashMap`) use advanced techniques like lock stripping (locking only portions of the map) to allow safe, highly scalable concurrent access.

### 6. What is the difference between Iterator and Enumeration?
`Iterator` replaced `Enumeration`. `Iterator` provides a `remove()` method, which `Enumeration` lacks. Furthermore, `Iterator` is fail-fast and will throw an exception if the collection is modified concurrently, making it safer than `Enumeration`.

### 7. How is HashSet implemented in Java? How does it use Hashing?
`HashSet` is internally backed by a `HashMap`. When you insert an element into a `HashSet`, it is inserted as the *key* in the underlying `HashMap`, with a constant dummy object (called `PRESENT`) serving as the value. Since `HashMap` keys must be unique, this guarantees `HashSet` elements are unique.

### 8. What do you need to do to use a custom object as a key in a Map or Set?
You must override the `equals()` and `hashCode()` methods in your custom class and ensure they strictly follow the Java contract (objects that are equal must have the same hash code). For sorted collections (like `TreeMap` or `TreeSet`), the object must also implement `Comparable` (or you must provide a `Comparator`), and its `compareTo` method should be consistent with `equals()`.

### 9. The difference between HashMap and Hashtable?
`HashMap` is non-synchronized (faster) and allows one null key and multiple null values. `Hashtable` is synchronized (thread-safe, but slower) and does not allow any null keys or values.

### 10. When do you use ConcurrentHashMap in Java?
Use it in highly concurrent multi-threaded environments where you have multiple readers and fewer writers. It provides better performance than a fully synchronized map because it only locks the specific bucket/segment being written to, while reads generally do not require locks.

### 11. What is the difference between Set and List in Java?
A `Set` represents a collection of unique elements and does not maintain insertion order (with exceptions like `LinkedHashSet`). A `List` is an ordered collection that maintains insertion order and allows duplicate elements.

### 12. How do you sort objects in a collection?
You can use `Collections.sort()`. If sorting by natural order, the objects must implement the `Comparable` interface. If sorting by custom logic, you can pass a `Comparator` instance to the `Collections.sort(list, comparator)` method.

### 13. What is the difference between Vector and ArrayList?
Both are backed by dynamic arrays. `Vector` is a legacy class and is fully synchronized (thread-safe but slow). `ArrayList` is not synchronized, making it significantly faster for single-threaded or externally synchronized operations.

### 14. What is the difference between HashMap and HashSet?
`HashMap` implements the `Map` interface and stores key-value pairs, allowing duplicate values but unique keys. `HashSet` implements the `Set` interface, stores individual objects, and guarantees uniqueness. Internally, a `HashSet` uses a `HashMap`.

### 15. What is NavigableMap in Java?
Introduced in Java 1.6, `NavigableMap` is an extension of `SortedMap` that adds navigation methods like `lowerKey()`, `floorKey()`, `ceilingKey()`, and `higherKey()`. It allows you to find keys or entries closest to a given target.

### 16. Which one will you prefer between Array and ArrayList for storing objects?
If the size is strictly fixed and known in advance, or if you are storing primitives and need maximum performance, use an Array. If the size is dynamic, or you want built-in support for Generics, insertion, deletion, and utility methods, prefer `ArrayList`.

### 17. Can we replace Hashtable with ConcurrentHashMap?
Yes, it is highly recommended. However, you must be careful if your legacy code relies on locking the entire map. `ConcurrentHashMap` doesn't lock the whole map, so compound operations like `putIfAbsent` should be used instead of manual `if(get(key) == null) put(...)` blocks.

### 18. What is CopyOnWriteArrayList? How is it different than ArrayList and Vector?
It is a concurrent `List` implementation. Unlike `Vector` (which synchronizes every method), `CopyOnWriteArrayList` achieves thread-safety by creating a fresh copy of the underlying array every time it is modified (add/set/remove). It is highly efficient for lists where reads vastly outnumber writes.

### 19. Why does ListIterator have an add() method but Iterator doesn't?
`ListIterator` is bi-directional and maintains internal state for both "previous" and "next" elements, allowing it to safely insert an element into the list at the current cursor position without disrupting the iteration.

### 20. When does ConcurrentModificationException occur?
It occurs when a collection is structurally modified (an item is added or removed) while a thread is iterating over it, and the modification was done using the collection's methods (e.g., `list.remove()`) instead of the `Iterator`'s safe `iterator.remove()` method.

### 21. Difference between Set, List, and Map?
* **List:** Ordered, index-based, allows duplicates.
* **Set:** Unordered (usually), no duplicates.
* **Map:** Stores key-value pairs; keys must be unique, values can be duplicated. Map does not inherit from the `Collection` interface.

### 22. What is BlockingQueue?
It is a thread-safe Queue added in `java.util.concurrent` that provides flow control. If a thread tries to dequeue from an empty queue, it blocks until an element is available. If it tries to enqueue to a full queue, it blocks until space frees up. It is the standard solution for the Producer-Consumer pattern.

### 23. How is LinkedList implemented in Java?
`LinkedList` in Java is implemented as a Doubly-Linked List, meaning each node contains a reference to both the previous and the next node.

### 24. How do you iterate over a Synchronized HashMap? Do you need to lock it?
Yes, you must explicitly synchronize on the map instance when iterating over it using an `Iterator` or a `for-each` loop. While individual methods like `get()` and `put()` are synchronized, the `iterator()` itself is not thread-safe against structural modifications.

### 25. What is Deque? When do you use it?
`Deque` stands for Double Ended Queue. It allows you to insert and remove elements from both ends (head and tail). It can be used to implement both FIFO queues and LIFO stacks (and is preferred over the legacy `Stack` class).

---

## Serialization

### 1. What is a Serializable interface? What is its purpose?
`Serializable` is a marker interface (contains no methods) in `java.io`. It signals to the JVM that objects of this class are permitted to be serialized—meaning their state can be converted into a byte stream to be saved to disk or sent over a network.

### 2. What is the difference between Serializable and Externalizable?
* **Serializable:** Uses default JVM serialization. It is easy to implement but can be slow and inflexible.
* **Externalizable:** Extends `Serializable` and requires you to implement `readExternal()` and `writeExternal()`. It gives you complete control over the serialization process, often resulting in better performance and security.

### 3. What is a transient variable?
The `transient` keyword is used to mark a variable so that the JVM ignores it during the serialization process. It is useful for sensitive data (like passwords) or data that can be easily recalculated.

### 4. What is SerialVersionUID in Java? Why is it important?
It is a unique version identifier for a `Serializable` class. During deserialization, the JVM compares the `SerialVersionUID` of the incoming byte stream with the local class. If they don't match, it throws an `InvalidClassException`. Defining it explicitly prevents crashes when you add/remove fields in later versions of the class.

### 5. How many methods do we have in the Serializable interface?
Zero. It is a marker interface.

### 6. What is a marker interface in Java?
An interface with no methods or fields. It acts as a tag to inform the compiler or JVM that the class possesses a certain property or requires special processing (e.g., `Serializable`, `Cloneable`).

### 7. Can you add a field in a Serializable class that doesn't implement Serializable?
No. If an object reference field does not implement `Serializable`, the JVM will throw a `NotSerializableException` during serialization. To prevent this, you must mark that specific field as `transient` or `static`.

### 8. How do you serialize an object in Java?
Ensure the class implements `java.io.Serializable`. Then, wrap a `FileOutputStream` in an `ObjectOutputStream` and call the `writeObject(obj)` method.

### 9. How does Serialization of an object work?
When you serialize an object, the JVM first serializes its superclass, then the subclass. It traverses the object graph, saving the state of all non-transient, non-static fields. If any reference field in the graph is not serializable, it throws an exception.

### 10. Are static variables serialized?
No. Static variables belong to the class, not the object instance. Their state is not saved during serialization. When deserialized, the object will simply use the current value of the static variable in the running JVM.

### 11. What is the difference between transient and volatile?
`volatile` is a concurrency keyword that ensures variable updates are instantly visible to all threads (preventing caching). `transient` is a serialization keyword that prevents a variable from being saved to a byte stream.

### 12. Can you make a subclass NotSerializable if the Superclass is Serializable?
It is not mandatory for a subclass to explicitly declare `implements Serializable` if the superclass already does. However, if you explicitly want to *prevent* a subclass from being serialized when its parent is, you can implement the `writeObject()` and `readObject()` methods in the subclass and force them to throw a `NotSerializableException`.

### 13. Do you know any alternatives to Serialization for Java applications?
Yes. You can use custom binary encoders/decoders, JSON formats (via Jackson or Gson), XML, or modern high-performance binary protocols like Google Protocol Buffers (protobuf) or Apache Avro (often used with gRPC).