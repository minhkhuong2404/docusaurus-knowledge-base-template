---
id: chapter-12-serialization
title: "Chapter 12: Serialization"
sidebar_label: "12. Serialization"
---

# Chapter 12: Serialization

This chapter concerns **object serialization** — Java's framework for encoding objects as byte streams (*serializing*) and reconstructing objects from their encodings (*deserializing*). Once an object is serialized, its encoding can be sent from one VM to another or stored on disk and later deserialized. This chapter focuses on the dangers of serialization and how to minimize them.

---

## Item 85: Prefer Alternatives to Java Serialization

The fundamental problem with Java serialization is that its **attack surface is too large to protect** and constantly growing. Deserialization of untrusted data is the source of many critical security vulnerabilities.

Object graphs are deserialized by invoking `readObject` on an `ObjectInputStream`. This essentially acts as a magic constructor that can instantiate objects of almost any type on the class path. During deserialization, the `readObject` methods of any serializable class on the classpath can be invoked. This is called a **gadget chain** — a sequence of object deserialization that can lead to arbitrary code execution.

```java
// This simple deserialization can take FOREVER (DoS attack via deep byte stream)
static byte[] bomb() {
    Set<Object> root = new HashSet<>();
    Set<Object> s1 = root;
    Set<Object> s2 = new HashSet<>();
    for (int i = 0; i < 100; i++) {
        Set<Object> t1 = new HashSet<>();
        Set<Object> t2 = new HashSet<>();
        t1.add("foo"); // t1 != t2
        s1.add(t1); s1.add(t2);
        s2.add(t1); s2.add(t2);
        s1 = t1; s2 = t2;
    }
    return serialize(root);
}
```

**The best way to avoid serialization exploits is to never deserialize anything.** There is no reason to use Java serialization in any new system you write.

### Alternatives

Use **cross-platform structured-data representations** instead:
- **JSON** (text-based, human-readable)
- **Protocol Buffers / protobuf** (Google, binary, compact, typed)
- **Avro**, **Thrift**, **CBOR**

These are far simpler, more portable, and have a much smaller attack surface. JSON and protobuf were designed with security in mind.

### If You Must Use Serialization

Use a **Java serialization filter** (`java.io.ObjectInputFilter`) to whitelist or blacklist classes:

```java
ObjectInputStream ois = new ObjectInputStream(inputStream);
ois.setObjectInputFilter(filter);
```

Prefer whitelisting to blacklisting — blacklisting is impossible to keep up with. The JVM-wide deserialization filter (`jdk.serialFilter`) provides defense-in-depth.

---

## Item 86: Implement Serializable with Great Caution

Implementing `Serializable` is easy — just add `implements Serializable`. But the long-term costs are high.

### Costs of Implementing Serializable

**1. It decreases the flexibility to change the class's implementation** once it's released. The serialized form becomes part of your exported API. If you accept the default serialized form, the internal representation is permanently locked.

**2. It increases the likelihood of bugs and security holes.** Deserialization is a "hidden constructor" with all the dangers that entails. Deserialized objects can violate class invariants.

**3. It increases the testing burden** as new versions are released — you must ensure serialized instances from old versions can be deserialized into new versions, and vice versa.

**Classes designed for inheritance should rarely implement `Serializable`** and **interfaces should rarely extend it.** If a parent class does not implement `Serializable`, any subclass that does must write/read state via `writeObject`/`readObject`.

```java
// If a superclass doesn't have an accessible no-arg constructor,
// a Serializable subclass must provide readResolve or use serialization proxy
```

**Inner classes should not implement `Serializable** — their synthesized fields for capturing enclosing instances and local variables are implementation-specific.

---

## Item 87: Consider Using a Custom Serialized Form

Do not accept the default serialized form unless it represents a reasonable description of your object's logical state independently of its physical representation.

The default serialized form is acceptable if the physical representation and logical content are identical (e.g., a `Name` class with `firstName`, `lastName`, `middleName` fields).

**A bad custom serialized form:** The default form for a linked list would serialize every node and link — an implementation detail, not the logical sequence:

```java
// Bad: uses default serialized form on a linked-list based class
public final class StringList implements Serializable {
    private int size = 0;
    private Entry head = null;

    private static class Entry implements Serializable {
        String data;
        Entry next;
        Entry previous;
    }
    // ...
}
```

Problems: permanently ties implementation to API, takes excessive space, takes excessive time, and can cause stack overflows.

**A good custom serialized form:** Just write the number of strings followed by each string:

```java
public final class StringList implements Serializable {
    private transient int size = 0;
    private transient Entry head = null;

    // No longer serialized
    private static class Entry {
        String data;
        Entry next;
        Entry previous;
    }

    private void writeObject(ObjectOutputStream s) throws IOException {
        s.defaultWriteObject();
        s.writeInt(size);
        for (Entry e = head; e != null; e = e.next)
            s.writeObject(e.data);
    }

    private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
        s.defaultReadObject();
        int numElements = s.readInt();
        for (int i = 0; i < numElements; i++)
            add((String) s.readObject());
    }
    // ...
}
```

**Mark all fields `transient` that don't represent the object's logical state.** Even if you use a custom serialized form, call `defaultWriteObject`/`defaultReadObject` first for forward and backward compatibility.

**Declare a `serialVersionUID`** explicitly to avoid potential incompatibilities:

```java
private static final long serialVersionUID = 234098243823485285L; // any long value
```

---

## Item 88: Write readObject Methods Defensively

`readObject` is effectively a public constructor. It must check the validity of its arguments (the stream data) and make defensive copies:

```java
// VULNERABLE: attacker can hand-craft bytes to create invalid Period
// and can even modify the Date fields after deserialization
public final class Period implements Serializable {
    private Date start;
    private Date end;
    // ...
    private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
        s.defaultReadObject();
        // Bad: defensive copies not made
    }
}
```

### Correct readObject

```java
private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
    s.defaultReadObject();

    // Defensive copies of mutable components
    start = new Date(start.getTime());
    end   = new Date(end.getTime());

    // Check that our invariants are satisfied
    if (start.compareTo(end) > 0)
        throw new InvalidObjectException(start + " after " + end);
}
```

**Rules for writing `readObject`:**

1. For classes with object reference fields that must remain private, defensively copy each mutable component in `readObject`. (Use constructor/factory, not `clone`.)
2. Check any invariants and throw `InvalidObjectException` if violated.
3. If an entire graph of objects must be validated after deserialization, use `ObjectInputValidation`.
4. Do not invoke overridable methods (directly or indirectly).

---

## Item 89: For Instance Control, Prefer Enum Types to readResolve

If you depend on `readResolve` to maintain a singleton or other instance-controlled class, **all instance fields with object reference types must be `transient`**. Otherwise, a determined attacker can steal references to the deserialized object before `readResolve` runs (the "stream-attack" technique).

**If you can use an enum singleton, use it.** It is the simplest, safest approach:

```java
// Enum singleton — the preferred approach
public enum Elvis {
    INSTANCE;
    private String[] favoriteSongs = { "Hound Dog", "Heartbreak Hotel" };
    public void printFavorites() { System.out.println(Arrays.toString(favoriteSongs)); }
}
```

If you cannot use enum (e.g., must extend a non-enum type), use `readResolve` and ensure all fields are either primitive or transient:

```java
// readResolve for instance control
private Object readResolve() {
    // Return the one true Elvis and let the garbage collector take care of the Elvis impersonator.
    return INSTANCE;
}
```

---

## Item 90: Consider Serialization Proxies Instead of Serialized Instances

The **serialization proxy pattern** greatly reduces the risks of implementing `Serializable`:

1. Design a `private static` nested class that concisely represents the logical state of an enclosing instance — the **serialization proxy**.
2. It has one constructor taking the enclosing class as its sole parameter.
3. Add `writeReplace` to the enclosing class to return a serialization proxy.
4. Add `readObject` to the enclosing class to throw `InvalidObjectException`.
5. Add `readResolve` to the proxy class to return a logically equivalent enclosing instance.

```java
public final class Period implements Serializable {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = new Date(start.getTime());
        this.end   = new Date(end.getTime());
        if (this.start.compareTo(this.end) > 0)
            throw new IllegalArgumentException(start + " after " + end);
    }

    // Serialization proxy
    private static class SerializationProxy implements Serializable {
        private final Date start;
        private final Date end;
        static final long serialVersionUID = 234098243823485285L;

        SerializationProxy(Period p) {
            this.start = p.start;
            this.end   = p.end;
        }

        private Object readResolve() {
            return new Period(start, end); // uses public constructor — checks invariants!
        }
    }

    // Serialize the proxy, not the real object
    private Object writeReplace() { return new SerializationProxy(this); }

    // Never produce a real Period from stream
    private void readObject(ObjectInputStream stream) throws InvalidObjectException {
        throw new InvalidObjectException("Proxy required");
    }
}
```

### Advantages of Serialization Proxy

- The real class's invariants are checked by its constructor — no need for defensive copies or validity checks in `readObject`.
- Works for classes that don't support deserialization in the same form they were serialized (e.g., `EnumSet` — size can differ)
- Stops the "stream-attack" trick cold
- Barely requires thought about which fields to serialize

### Limitations

- Not compatible with classes extendable by clients
- Not compatible with classes whose object graphs contain circularities
- ~14% slower than defensive copies (roughly)

---

## Summary: Serialization Guidelines

| Guideline | Recommendation |
|---|---|
| New systems | Use JSON, protobuf, or similar — avoid Java serialization |
| Legacy systems that must use serialization | Filter incoming streams with whitelist |
| Adding Serializable to a class | Do it with great caution — test backward compatibility |
| Custom vs. default serialized form | Choose the form that best represents logical state |
| Security | Use serialization proxy pattern wherever possible |
| Singletons | Use enum; use `readResolve` only if enum is not applicable |
| Instance control | Prefer enum types; if not possible, ensure all reference fields are transient |
