---
id: chapter-03-methods-common-to-all-objects
title: "Chapter 3: Methods Common to All Objects"
sidebar_label: "3. Methods Common to All Objects"
---

# Chapter 3: Methods Common to All Objects

Although `Object` is a concrete class, it is designed primarily for extension. All of its nonfinal methods (`equals`, `hashCode`, `toString`, `clone`, and `finalize`) have explicit general contracts because they are designed to be overridden. Failure to obey these contracts will prevent classes like `HashMap` and `HashSet` from functioning properly.

---

## Item 10: Obey the General Contract When Overriding equals

The easiest way to avoid problems is **not to override** `equals`. Each instance is then only equal to itself. This is correct when:
- Each instance is inherently unique (e.g., `Thread`)
- Logical equality isn't needed (e.g., `java.util.regex.Pattern`)
- A superclass has already overridden `equals` appropriately
- The class is private or package-private and equals will never be called

Override `equals` when the class has a notion of **logical equality** (i.e., value classes like `Integer`, `String`) and no superclass has already done it.

### The equals Contract

`equals` must implement an **equivalence relation**:
- **Reflexive**: `x.equals(x)` must return `true`
- **Symmetric**: `x.equals(y)` ↔ `y.equals(x)`
- **Transitive**: `x.equals(y) && y.equals(z)` → `x.equals(z)`
- **Consistent**: Multiple calls return the same result (unless state changes)
- **Non-null**: `x.equals(null)` must return `false`

**Critical warning:** There is no way to extend an instantiable class while adding a value component and preserving the `equals` contract. Use **composition over inheritance** (Item 18): add a field of the parent type, expose a view method.

### High-Quality equals Recipe

```java
@Override
public boolean equals(Object o) {
    // 1. Use == to check for reference equality (optimization)
    if (o == this) return true;

    // 2. Use instanceof to check for correct type (handles null)
    if (!(o instanceof PhoneNumber)) return false;

    // 3. Cast, then compare every significant field
    PhoneNumber pn = (PhoneNumber) o;
    return pn.lineNum == lineNum
        && pn.prefix == prefix
        && pn.areaCode == areaCode;
}
```

- For primitive fields (except `float`/`double`): use `==`
- For `float`/`double`: use `Float.compare()` / `Double.compare()` (handles NaN, -0.0)
- For object references: call `equals` recursively; use `Objects.equals(a, b)` for nullable fields
- For arrays: use `Arrays.equals()`
- Check the most likely-to-differ fields first for performance

> **Always override `hashCode` when overriding `equals` (Item 11).**

---

## Item 11: Always Override hashCode When You Override equals

**Failure to override `hashCode` when you override `equals` violates the general contract for `Object.hashCode` and will break hashing collections (`HashMap`, `HashSet`).**

### The hashCode Contract

1. `hashCode()` must consistently return the same value if no information used in `equals` changes.
2. If `a.equals(b)`, then `a.hashCode() == b.hashCode()`.
3. If `!a.equals(b)`, `a.hashCode()` and `b.hashCode()` *need not* differ — but distributing them improves hash table performance.

### Recipe for a Good hashCode

```java
@Override
public int hashCode() {
    int result = Short.hashCode(areaCode);
    result = 31 * result + Short.hashCode(prefix);
    result = 31 * result + Short.hashCode(lineNum);
    return result;
}
```

Or use `Objects.hash()` for convenience (slightly slower due to array creation and autoboxing):

```java
@Override
public int hashCode() {
    return Objects.hash(lineNum, prefix, areaCode);
}
```

- Include every significant field used in `equals`
- Use multiplier `31` (odd prime, easily optimized to `(i << 5) - i` by JVM)
- For arrays, use `Arrays.hashCode()`
- Exclude redundant/derived fields and fields not in `equals`
- **Never exclude significant fields to improve performance** — you'll create collisions

For lazily-cached hashCode:
```java
private int hashCode; // 0 by default (acceptable sentinel for "not computed")

@Override
public int hashCode() {
    int result = hashCode;
    if (result == 0) {
        result = Short.hashCode(areaCode);
        result = 31 * result + Short.hashCode(prefix);
        result = 31 * result + Short.hashCode(lineNum);
        hashCode = result;
    }
    return result;
}
```

---

## Item 12: Always Override toString

`Object.toString()` returns something like `PhoneNumber@163b91`, which is rarely useful. A good `toString` makes your class much more pleasant to use and provides vital diagnostic information in log messages, assert failures, and debuggers.

### Contract

> "Returns a concise but informative representation that is easy for a person to read."

### Best Practices

- When practical, return **all interesting information** in the object.
- Decide whether to **specify the format** in Javadoc. If you do, provide a matching static factory or constructor. If you don't, state clearly that the format may change.
- **Always provide programmatic access** to the values in `toString`. Don't force clients to parse the string.

```java
/**
 * Returns the string representation of this phone number.
 * The string consists of twelve characters whose format is
 * "(XXX) YYY-ZZZZ", where XXX is the area code, YYY is the
 * prefix, and ZZZZ is the line number.
 */
@Override
public String toString() {
    return String.format("(%03d) %03d-%04d", areaCode, prefix, lineNum);
}
```

Abstract classes that define state shared by subclasses should override `toString`.

---

## Item 13: Override clone Judiciously

`Cloneable` is a **marker interface** with no methods. It changes the behavior of `Object.clone()`, which is `protected`. The `Cloneable` contract is fragile and problematic — a good API shouldn't rely on it.

### The Problems

- `Object.clone()` makes a field-by-field copy — this is a **shallow copy**. For mutable state (arrays, collections), this creates aliasing bugs.
- You cannot properly use `super.clone()` from a `final` class without implementing `Cloneable` throughout the hierarchy.
- A covariant return type makes it cleaner to declare `clone()` to return the exact class type.

### Implementing Clone Correctly

```java
@Override
public Stack clone() {
    try {
        Stack result = (Stack) super.clone();
        result.elements = elements.clone(); // Deep copy the array
        return result;
    } catch (CloneNotSupportedException e) {
        throw new AssertionError();
    }
}
```

For complex objects with linked structures (like hash tables), recursively deep-copy each entry, or call `put()` on a fresh instance.

### The Better Alternative

**Copy constructors and copy factories are better than `Cloneable`:**

```java
// Copy constructor
public Yum(Yum yum) { ... }

// Copy factory
public static Yum newInstance(Yum yum) { ... }
```

- Don't rely on a risky extralinguistic creation mechanism
- Don't require adherence to a thinly-documented contract
- Can accept an interface argument (e.g., `new TreeSet<>(hashSet)`)
- Don't throw checked exceptions

> **Bottom line:** Don't extend `Cloneable` in new code. Prefer copy constructors/factories. If inheriting from a class that implements `Cloneable`, implement a well-behaved clone method.

---

## Item 14: Consider Implementing Comparable

`Comparable` is a single-method interface:

```java
public interface Comparable<T> {
    int compareTo(T t);
}
```

By implementing it, you gain integration with all sorted collections (`TreeSet`, `TreeMap`), sorting utilities (`Collections.sort()`, `Arrays.sort()`), and search utilities.

### The compareTo Contract

- `sgn(x.compareTo(y)) == -sgn(y.compareTo(x))` (antisymmetric)
- Transitivity: `x.compareTo(y) > 0 && y.compareTo(z) > 0` → `x.compareTo(z) > 0`
- `x.compareTo(y) == 0` → `sgn(x.compareTo(z)) == sgn(y.compareTo(z))` for all z
- Strongly recommended (not required): `(x.compareTo(y) == 0) == (x.equals(y))`

### Implementation

Use `Comparator.comparingInt()` and the comparator chaining methods (Java 8+) for concise, correct implementations:

```java
// Using a Comparator construction method
private static final Comparator<PhoneNumber> COMPARATOR =
    Comparator.comparingInt((PhoneNumber pn) -> pn.areaCode)
              .thenComparingInt(pn -> pn.prefix)
              .thenComparingInt(pn -> pn.lineNum);

@Override
public int compareTo(PhoneNumber pn) {
    return COMPARATOR.compare(this, pn);
}
```

**Never use subtraction for integer comparison** — it risks integer overflow:

```java
// BROKEN — can overflow
static Comparator<Object> hashCodeOrder = (o1, o2) -> o1.hashCode() - o2.hashCode();

// CORRECT
static Comparator<Object> hashCodeOrder = (o1, o2) ->
    Integer.compare(o1.hashCode(), o2.hashCode());
// OR
static Comparator<Object> hashCodeOrder = Comparator.comparingInt(Object::hashCode);
```
