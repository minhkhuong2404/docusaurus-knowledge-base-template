---
id: java-interview-answers-part-3
title: Java Interview Q&A - Collections & Serialization
description: Comprehensive answers to Java Collection Framework and Serialization interview questions.
sidebar_position: 5
tags: [java, interview, collections, serialization, answers]
---

# Java Interview Questions & Answers: Part 3

This guide covers advanced concepts in the Java Collections Framework and the object serialization subsystem.

---

## Collection Framework

### 1. How does HashMap work in Java?

`HashMap` works on the principle of **hashing** using an array-backed structure of buckets:

* **Bucket Index Calculation:** First, it computes the key's hash using a secondary hash function:
  $$\text{hash} = \text{hashCode} \oplus (\text{hashCode} \gg 16)$$
  This mixes the high bits into the low bits, reducing collisions. The bucket index is calculated using a bitwise AND:
  $$\text{index} = \text{hash} \ \& \ (\text{capacity} - 1)$$
  This bitwise AND is extremely fast but requires the array capacity to be a **power of 2**.
* **Collision Resolution:** If the bucket is empty, a new `Node` is inserted. If a collision occurs (keys hash to the same bucket):
  - In a **linked list** (< 8 nodes), the list is traversed using `equals()` to find the matching key and replace the value, or append a new node.
  - If a bucket accumulates **8+ nodes** and the map capacity is **64+**, it converts the bucket into a **Red-Black Tree** (`TreeBin`), dropping lookup from O(n) to O(log n).

---

### 2. What do you need to do to use a custom object as a key in a Map or Set?

You must override the `equals()` and `hashCode()` methods in your custom class and follow the strict contract:
- If `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` must be true.
- If you modify fields used in `hashCode()` after inserting the key, the key's hash code changes. The map will look for the key in a different bucket, making the entry unreachable and causing a **silent memory leak**.

**Best Practice:** Always declare fields used in `hashCode()` and `equals()` as `final` (make the key object immutable).

---

### 3. How to safely iterate over a Synchronized Map?

Although class methods of synchronized collections (like `Hashtable` or `Collections.synchronizedMap()`) are thread-safe, their iterators are **fail-fast** and not thread-safe. You must manually lock the map instance during iteration to prevent other threads from modifying it:

```java
Map<String, String> syncMap = Collections.synchronizedMap(new HashMap<>());

// Manually synchronize on the collection object
synchronized (syncMap) {
    Iterator<String> it = syncMap.keySet().iterator();
    while (it.hasNext()) {
        String key = it.next();
        // Read or perform thread-safe mutations
    }
}
```
Without the `synchronized` block, another thread calling `put()` during iteration will trigger a `ConcurrentModificationException`.

---

### 4. What is `NavigableMap` and when should you use it?

`NavigableMap` (implemented by `TreeMap`) extends `SortedMap` to add navigation methods that return closest-match keys or entries:

```java
NavigableMap<Integer, String> map = new TreeMap<>();
map.put(10, "Ten");
map.put(20, "Twenty");
map.put(30, "Thirty");

map.lowerKey(20);   // Returns 10  (strict <)
map.floorKey(20);   // Returns 20  (<=)
map.ceilingKey(20); // Returns 20  (>=)
map.higherKey(20);  // Returns 30  (strict >)

// Retrieve and remove first/last
map.pollFirstEntry(); // {10, "Ten"}
```

Use `NavigableMap` when you need range queries (e.g. `subMap()`), sorting, or finding nearest-value matches (like IP routing lookup ranges).

---

## Serialization

### 5. Prevent Subclass Serialization if the Superclass is `Serializable`

If a superclass implements `Serializable`, all its subclasses are automatically serializable. To prevent a subclass from being serialized (for security or architectural reasons), override `writeObject()` and `readObject()` in the subclass to throw `NotSerializableException`:

```java
public class SecureSubClass extends SerializableParent {

    private void writeObject(ObjectOutputStream out) throws IOException {
        throw new NotSerializableException("Serialization is forbidden for this subclass");
    }

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        throw new NotSerializableException("Deserialization is forbidden for this subclass");
    }
}
```

---

### 6. Do you know any alternatives to Java Serialization?

Default Java serialization is slow (reflection-heavy), generates large payloads, and is highly vulnerable to **deserialization gadget chain attacks** (arbitrary code execution). Production alternatives include:

| Format | Library | Pros | Cons |
|:-------|:--------|:-----|:-----|
| **JSON** | Jackson / Gson | Human-readable, language-neutral, standard for web | Large size, slow compared to binary formats |
| **Protocol Buffers** | Google Protobuf | Compact binary format, strongly typed schemas, extremely fast | Requires pre-compilation of `.proto` schemas |
| **Avro** | Apache Avro | Compact binary format, self-describing schema, excellent schema evolution | Slower than Protobuf for simple objects |
| **Kryo** | Kryo | High-performance binary format for Java-only systems | Java-specific, vulnerable to class structure changes |

---

### 7. What is `serialVersionUID` and what happens if it's missing?

`serialVersionUID` is a 64-bit hash used to verify that the sender and receiver of a serialized object have loaded classes that are compatible.

```java
private static final long serialVersionUID = 1L;
```

#### What happens if you don't define it?
If missing, the JVM will compute a default `serialVersionUID` at runtime using class details (fields, methods, modifiers). 
If you make a minor modification to the class (e.g. adding a private field), the computed hash changes. Deserializing older saved data will then fail with an **`InvalidClassException`**, even if the changes were backward-compatible. Always define it explicitly.