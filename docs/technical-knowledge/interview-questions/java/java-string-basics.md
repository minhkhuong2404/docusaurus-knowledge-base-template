---
id: java-string-basics
title: Java String Interview Questions
sidebar_label: String Basics
description: "Java String basics for interviews, including immutability, pooling, and object creation patterns."
tags: [java, interview, strings, core-java]
---

# Java String Interview Questions & Answers

This guide covers the fundamental concepts of Strings in Java, including memory allocation, internals, and the nature of immutability.

## 1. How many ways are there to create a String object?

There are two primary ways to create a String in Java:

### String Literal
```java
String s1 = "code";
```
- JVM checks the **String Constant Pool (SCP)** first
- If `"code"` already exists in the pool, returns the existing reference (no new object)
- If not, creates a new entry in the pool
- **One object** created (in the pool)

### `new` Keyword
```java
String s2 = new String("code");
```
- **Always** creates a new object in the **Heap** memory (bypasses pool lookup)
- Also ensures the literal `"code"` exists in the SCP (created at class-loading time if not already present)
- Up to **two objects** created: one in heap + one in pool

### Why does `new String()` exist?

You might wonder: why would anyone use `new String()` when literals are more efficient? In practice, it's used when you explicitly need a **distinct object** (rare), or more commonly when constructing strings from byte arrays, char arrays, or other sources:
```java
byte[] data = response.getBody();
String json = new String(data, StandardCharsets.UTF_8); // From bytes
```

## 2. What is the String Constant Pool (SCP)?

The SCP is a special memory area used to store unique string literals for reusability and memory savings.

### Location Evolution

| Java Version | Pool Location | GC Eligible? |
|:------------|:-------------|:------------|
| Java 6 and earlier | **PermGen** (fixed size) | Limited — could cause `OutOfMemoryError: PermGen space` |
| **Java 7+** | **Heap** | ✅ Yes — pool strings can be garbage collected |

**Why the move?** PermGen had a fixed, small size. Applications with many unique strings (e.g., XML parsers, ORM frameworks) would exhaust PermGen. Moving to the heap allows the pool to grow dynamically and participate in normal GC.

### Pool Size
The SCP is implemented as a **hash table**. You can tune its size:
```
-XX:StringTableSize=60013  # Default varies by JDK version (1009 in JDK 7, 60013 in JDK 11+)
```

A larger table means fewer hash collisions and faster `intern()` lookups.

## 3. How many objects are created?

### Case 1: `String s1 = new String("code");`
- **Two objects:** One `"code"` in the SCP (if not already present) + one new String in the Heap (referenced by `s1`).
- `s1` points to the **heap** object, not the pool entry.

### Case 2: `String s1 = "code"; String s2 = new String("code");`
- **Two objects total:**
  - `s1` creates `"code"` in the SCP
  - `s2` creates a new String in the Heap that copies the content
  - The SCP entry is reused (not created again)

### Case 3: What about concatenation?
```java
String a = "Hello";       // 1 object in pool
String b = "World";       // 1 object in pool
String c = a + b;         // NEW object in heap (StringBuilder used internally)
String d = "Hello" + "World"; // Resolved at COMPILE time → "HelloWorld" in pool
```

**Key insight:** Compile-time constants (`"Hello" + "World"`) are optimized by `javac` into a single literal. Runtime concatenation (involving variables) uses `StringBuilder` (or `invokedynamic` + `StringConcatFactory` in Java 9+).

## 4. `==` vs. `.equals()`

* **`==` operator:** Compares **memory addresses** (reference identity). Returns `true` only if both variables point to the exact same object in memory.
* **`.equals()` method:** Compares the **actual content** of the strings character by character. `String` overrides `Object.equals()` to provide content-based comparison.

```java
String a = "hello";
String b = "hello";
String c = new String("hello");

System.out.println(a == b);      // true  — same pool reference
System.out.println(a == c);      // false — different objects (pool vs heap)
System.out.println(a.equals(c)); // true  — same content
```

### The `String.equals()` Implementation (Optimized)
```java
// Simplified from OpenJDK source
public boolean equals(Object anObject) {
    if (this == anObject) return true;        // 1. Same reference? Done.
    if (anObject instanceof String other) {
        if (coder() == other.coder()) {       // 2. Same encoding?
            return isLatin1()
                ? StringLatin1.equals(value, other.value)  // Byte-by-byte
                : StringUTF16.equals(value, other.value);  // Char-by-char
        }
    }
    return false;
}
```

## 5. What does the `intern()` method do?

`intern()` returns a canonical representation of the string from the String Constant Pool:

1. If a string with the same content **already exists** in the pool → returns the pool reference
2. If **not** in the pool → adds it to the pool and returns the pool reference

```java
String s1 = new String("hello");  // Heap object
String s2 = s1.intern();          // Returns pool reference
String s3 = "hello";             // Pool reference

System.out.println(s1 == s2);    // false — s1 is heap, s2 is pool
System.out.println(s2 == s3);    // true  — both point to pool entry
```

### When to use `intern()`
- **Large-scale deduplication:** If your application processes millions of strings with many duplicates (e.g., country codes, status values), interning can significantly reduce memory.
- **Caution:** Overusing `intern()` can cause the StringTable to become a bottleneck (it's a global, synchronized hash table). In modern Java, consider `String.intern()` alternatives like manual deduplication maps or `-XX:+UseStringDeduplication` (G1 GC feature).

## 6. Why is String immutable in Java?

Immutability means the content of a String object cannot be changed after creation.

### Reasons for Immutability

1. **String Pool Safety:** Multiple references can point to the same pool entry. If strings were mutable, modifying through one reference would corrupt all others.

2. **Security:** Strings carry sensitive data — file paths, class names, database URLs, SQL queries. Immutability prevents modification after security validation. Example: if a filename were changed between the permission check and the actual file operation (TOCTOU vulnerability), the security check would be bypassed.

3. **Hashcode Caching:** `String.hashCode()` is computed once and cached in `private int hash`. Since the content never changes, the cached hashcode is always valid — making Strings extremely efficient as `HashMap` keys.

4. **Thread Safety:** Immutable objects are inherently thread-safe. Any number of threads can read the same String simultaneously without synchronization.

5. **Class Loading Security:** Class names are Strings. If they were mutable, a class name could be changed after the security manager approved it, loading a different (malicious) class.

### How Immutability is Enforced (Internal Design)

```java
public final class String {                     // final — cannot be subclassed
    private final byte[] value;                  // final — reference cannot be reassigned
    private final byte coder;                    // LATIN1 (0) or UTF16 (1)
    private int hash;                            // Cached hashcode (computed lazily)
    
    // No setter methods
    // All "modification" methods return NEW String objects
}
```

### Proving Immutability
```java
String s1 = "Hello";
String s2 = s1.concat(" World");

System.out.println(s1); // "Hello"       — UNCHANGED
System.out.println(s2); // "Hello World" — NEW object
System.out.println(s1 == s2); // false   — different objects
```

### Java 9+ Compact Strings

Before Java 9, `String` used `char[]` (2 bytes per character, always UTF-16). Java 9 introduced **Compact Strings**:
- Latin-1 strings (ASCII, Western European) → `byte[]` with 1 byte per character
- Non-Latin strings → `byte[]` with 2 bytes per character (UTF-16)
- The `coder` field tracks which encoding is used

**Impact:** ~40% reduction in String memory footprint for typical English-language applications. Enabled by default (`-XX:+CompactStrings`).

---
