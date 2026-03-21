---
id: chapter-05-generics
title: "Chapter 5: Generics"
sidebar_label: "5. Generics"
---

# Chapter 5: Generics

Generics were added in Java 5. Before generics, you had to cast every object read from a collection — if someone accidentally inserted an object of the wrong type, the cast would fail at runtime. With generics, you tell the compiler what types of objects are permitted in each collection. The compiler inserts casts automatically and tells you at **compile time** if you try to insert an object of the wrong type.

---

## Item 26: Don't Use Raw Types

A **raw type** is a generic class or interface used without any type parameters: `List` instead of `List<String>`. They exist for backward compatibility.

```java
// Raw type - don't do this!
private final Collection stamps = ...;
stamps.add(new Coin(...)); // Compiles fine — but wrong!
// ... later ...
for (Iterator i = stamps.iterator(); i.hasNext(); ) {
    Stamp stamp = (Stamp) i.next(); // ClassCastException at runtime!
}
```

With generics:
```java
private final Collection<Stamp> stamps = ...;
stamps.add(new Coin(...)); // Compile-time error! Exactly what you want.
```

### Raw Types vs. Unbounded Wildcards

- `List` — raw type, dangerous (opts out of the generic type system)
- `List<Object>` — explicitly allows any object (safe, parameterized)
- `List<?>` — unbounded wildcard — can hold *some specific type* but we don't know which; you can't add anything except `null`

**You lose type safety if you use raw types. You lose flexibility if you use `List<Object>`. Use wildcards (`?`) when you don't know or care about the type.**

### Legitimate Uses of Raw Types

- **Class literals**: `List.class`, `String[].class`, `int.class` (not `List<String>.class`)
- **`instanceof` checks**: The type information is erased at runtime:
  ```java
  if (o instanceof Set) {      // raw type OK here
      Set<?> s = (Set<?>) o;   // wildcard cast — safe
  }
  ```

---

## Item 27: Eliminate Unchecked Warnings

When you mix generics with raw types or use unsafe casts, the compiler emits **unchecked warnings**. Take every unchecked warning seriously — it represents a potential `ClassCastException` at runtime.

- Eliminate every unchecked warning you can.
- If you can't eliminate one but you're certain the cast is safe, suppress it with `@SuppressWarnings("unchecked")` — but always at the **smallest possible scope** (a single local variable declaration, never a whole class).
- Always add a comment explaining **why** the suppression is safe.

```java
// This cast is safe because toArray() creates an Object[] which
// we then fill with elements of type E from this list.
@SuppressWarnings("unchecked")
public <T> T[] toArray(T[] a) {
    if (a.length < size) {
        T[] result = (T[]) Arrays.copyOf(elements, size, a.getClass());
        return result;
    }
    // ...
}
```

---

## Item 28: Prefer Lists to Arrays

Arrays differ from generic types in two key ways:

**Arrays are covariant:** `Sub[]` is a subtype of `Super[]`. This means the following compiles but fails at runtime:
```java
Object[] objectArray = new Long[1];
objectArray[0] = "I don't fit in"; // ArrayStoreException at runtime
```

**Generics are invariant:** `List<Sub>` is NOT a subtype of `List<Super>`. The following fails at compile time (which is better):
```java
List<Object> ol = new ArrayList<Long>(); // COMPILE ERROR
ol.add("I don't fit in");
```

**Arrays are reified:** they know their element type at runtime and enforce it. Generics are **erased** — element type is enforced only at compile time.

Because of these differences, generic array creation is illegal:
```java
new List<E>[]      // Compile error
new List<String>[] // Compile error
new E[]            // Compile error
```

If you find yourself mixing arrays with generics and getting compiler errors, strongly consider using lists instead of arrays.

---

## Item 29: Favor Generic Types

It is generally easier to use a generic type correctly than a raw type. When you write a class that would benefit from being generic, parameterize it:

```java
// BEFORE (raw type stack)
public class Stack {
    private Object[] elements;
    public void push(Object e) { ... }
    public Object pop() { ... }
}

// AFTER (generic stack — preferred)
public class Stack<E> {
    private E[] elements;

    @SuppressWarnings("unchecked")
    public Stack() {
        elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY]; // safe cast
    }

    public void push(E e) { ... }
    public E pop() { ... }
}
```

Most pre-existing non-generic classes can and should be parameterized without breaking existing clients.

---

## Item 30: Favor Generic Methods

Static utility methods in particular benefit from being generic. All algorithms in `Collections` (like `binarySearch`, `sort`) are generic methods.

```java
// BEFORE: raw type, unsafe
public static Set union(Set s1, Set s2) {
    Set result = new HashSet(s1);
    result.addAll(s2);
    return result;
}

// AFTER: generic method
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
    Set<E> result = new HashSet<>(s1);
    result.addAll(s2);
    return result;
}
```

### Generic Singleton Factory

For creating singleton objects (like identity functions) that need to be used for multiple types:

```java
private static UnaryOperator<Object> IDENTITY_FN = (t) -> t;

@SuppressWarnings("unchecked")
public static <T> UnaryOperator<T> identityFunction() {
    return (UnaryOperator<T>) IDENTITY_FN;
}
```

### Recursive Type Bound

To express the constraint that elements in a list can be compared to each other:

```java
public static <E extends Comparable<E>> E max(Collection<E> c) {
    // ...
}
```

---

## Item 31: Use Bounded Wildcards to Increase API Flexibility

Parameterized types are **invariant** (`List<String>` is not a subtype of `List<Object>`). This is sometimes too restrictive.

### Producer — `? extends T` (PECS: Producer Extends)

When a parameter is a **producer** (you're reading from it), use `? extends T`:

```java
// INFLEXIBLE — won't accept List<Integer> even though Integer extends Number
public void pushAll(Iterable<E> src) { ... }

// FLEXIBLE — accepts Iterable<Integer>, Iterable<Number>, etc.
public void pushAll(Iterable<? extends E> src) {
    for (E e : src) push(e);
}
```

### Consumer — `? super T` (PECS: Consumer Super)

When a parameter is a **consumer** (you're writing to it), use `? super T`:

```java
// INFLEXIBLE — won't accept Collection<Object> for a Stack<Number>
public void popAll(Collection<E> dst) { ... }

// FLEXIBLE — accepts Collection<Number>, Collection<Object>
public void popAll(Collection<? super E> dst) {
    while (!isEmpty()) dst.add(pop());
}
```

### **PECS: Producer Extends, Consumer Super**

Remember this mnemonic. The `union` method example:

```java
public static <E> Set<E> union(Set<? extends E> s1, Set<? extends E> s2) { ... }
```

Return types should almost never be wildcards — it forces wildcard types on the caller.

For complex declarations, use explicit type parameters or helper methods to push the wildcard inward.

---

## Item 32: Combine Generics and Varargs Judiciously

Varargs and generics interact poorly. Varargs methods expose a **generic array** under the hood. This is a **heap pollution** warning — the variable might refer to an object of a different type.

```java
// Unsafe — heap pollution!
static void dangerous(List<String>... stringLists) {
    List<Integer> intList = List.of(42);
    Object[] objects = stringLists;
    objects[0] = intList;                  // heap pollution
    String s = stringLists[0].get(0);      // ClassCastException
}
```

Use `@SafeVarargs` **only when the method is safe** — i.e., it doesn't store anything in the varargs array and doesn't expose the array to untrusted code:

```java
@SafeVarargs
static <T> List<T> flatten(List<? extends T>... lists) {
    List<T> result = new ArrayList<>();
    for (List<? extends T> list : lists) result.addAll(list);
    return result;
}
```

As an alternative, return a `List<T>` built using `List.of(args...)` instead of a varargs method.

---

## Item 33: Consider Typesafe Heterogeneous Containers

A `Set<E>` can only hold one type, a `Map<K,V>` only two. When you need a container that can hold many different types safely, **parameterize the key, not the container**:

```java
public class Favorites {
    private Map<Class<?>, Object> favorites = new HashMap<>();

    public <T> void putFavorite(Class<T> type, T instance) {
        favorites.put(Objects.requireNonNull(type), instance);
    }

    public <T> T getFavorite(Class<T> type) {
        return type.cast(favorites.get(type));
    }
}

// Usage:
Favorites f = new Favorites();
f.putFavorite(String.class, "Java");
f.putFavorite(Integer.class, 0xcafebabe);
String favoriteString = f.getFavorite(String.class);
int favoriteInteger = f.getFavorite(Integer.class);
```

`type.cast()` performs a **dynamic cast** using the `Class` object as a type token.

**Limitation:** Cannot use with non-reifiable types. `List<String>.class` is illegal. A workaround uses `super type tokens` (via Guava's `TypeToken`).

This pattern (using `Class` objects as typed keys in a map) is the basis for many frameworks: Spring's `ApplicationContext.getBean(Class<T>)`, JPA's `EntityManager.find()`, etc.
