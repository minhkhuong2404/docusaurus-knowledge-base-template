---
id: chapter-08-methods
title: "Chapter 8: Methods"
sidebar_label: "8. Methods"
---

# Chapter 8: Methods

This chapter discusses several aspects of method design: how to treat parameters and return values, how to design method signatures, and how to document methods.

---

## Item 49: Check Parameters for Validity

Most methods have restrictions on parameter values (e.g., index must be non-negative, object must be non-null). **Document these restrictions and enforce them with checks at the beginning of the method.**

```java
/**
 * Returns a BigInteger whose value is (this mod m).
 *
 * @param m the modulus, which must be positive
 * @return this mod m
 * @throws ArithmeticException if m is less than or equal to zero
 */
public BigInteger mod(BigInteger m) {
    if (m.signum() <= 0)
        throw new ArithmeticException("Modulus <= 0: " + m);
    // ...
}
```

### Tools for Validity Checks

- **`Objects.requireNonNull`** (Java 7): the easiest way to check for null
  ```java
  this.strategy = Objects.requireNonNull(strategy, "strategy");
  ```
- **`Objects.checkIndex`, `checkFromIndexSize`, `checkFromToIndex`** (Java 9): index checks for lists and arrays
- **`assert`** for private methods (when arguments are accessible only within the package):
  ```java
  private static void sort(long a[], int offset, int length) {
      assert a != null;
      assert offset >= 0 && offset <= a.length;
      assert length >= 0 && length <= a.length - offset;
      // ...
  }
  ```

**Don't skip parameter checking just because the computation will fail naturally** — the resulting exception may be confusing, the failure may be delayed (causing corruption), or the method may complete normally but leave objects in a broken state.

---

## Item 50: Make Defensive Copies When Needed

A class whose objects contain internal mutable components must protect against corrupted state from clients who modify those components directly.

```java
// Broken "immutable" period class
public final class Period {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        // BROKEN: Date is mutable!
        if (start.compareTo(end) > 0)
            throw new IllegalArgumentException(start + " after " + end);
        this.start = start;
        this.end = end;
    }
    // An attacker can call start.setYear(78) after construction!
}
```

### Fix: Defensive Copies

```java
public Period(Date start, Date end) {
    // Make copies BEFORE validity check (prevents TOCTOU attack)
    this.start = new Date(start.getTime());
    this.end   = new Date(end.getTime());

    if (this.start.compareTo(this.end) > 0)
        throw new IllegalArgumentException(this.start + " after " + this.end);
}

// Also defensive copies in accessors
public Date start() { return new Date(start.getTime()); }
public Date end()   { return new Date(end.getTime()); }
```

**Important:** Don't use `clone` for defensive copies when the type may be a hostile subclass. Use constructor or static factory.

The real lesson: **use immutable objects (`Instant`, `LocalDateTime`, `ZonedDateTime`) instead of `Date`** wherever possible. If you must use mutable internal components, make defensive copies when storing inputs and when returning outputs.

---

## Item 51: Design Method Signatures Carefully

**Choose method names carefully.** They should be understandable, consistent with your package's naming conventions, and consistent with the broader Java library. When in doubt, consult Java library names.

**Don't over-provide convenience methods.** Every method must be tested and maintained. When in doubt, leave it out.

**Avoid long parameter lists.** Four parameters should be the maximum. Techniques to shorten:
1. Break the method into multiple methods, each with fewer parameters
2. Create helper classes to hold groups of parameters (`static` member class)
3. Adapt the Builder pattern (Item 2) for method invocation

**Prefer interfaces to classes for parameter types.** Use `Map` instead of `HashMap`.

**Prefer two-element enum types to boolean parameters** for clarity:

```java
// LESS CLEAR
Thermometer.newInstance(true); // Celsius? Fahrenheit?

// MORE CLEAR
public enum TemperatureScale { FAHRENHEIT, CELSIUS }
Thermometer.newInstance(TemperatureScale.CELSIUS);
```

---

## Item 52: Use Overloading Judiciously

The choice of which overloaded method to invoke is made **at compile time**, based on the static type of the argument. This often produces confusing results:

```java
public class CollectionClassifier {
    public static String classify(Set<?> s) { return "Set"; }
    public static String classify(List<?> lst) { return "List"; }
    public static String classify(Collection<?> c) { return "Unknown Collection"; }

    public static void main(String[] args) {
        Collection<?>[] collections = { new HashSet<>(), new ArrayList<>(), new HashMap<>().values() };
        for (Collection<?> c : collections)
            System.out.println(classify(c)); // Prints "Unknown Collection" three times!
    }
}
```

The loop variable `c` has static type `Collection<?>` — all three calls resolve to `classify(Collection<?>)`.

**For constructors,** you can't avoid overloading, but you can often replace them with static factory methods.

**A safe, conservative policy:** never export two overloadings with the same number of parameters. Or, at minimum, ensure that all overloadings behave identically for the same arguments (e.g., `ArrayList(int)` and `ArrayList(Collection)` are fine because their behaviors differ — one specifies capacity, the other copies a collection).

**Avoid overloading a varargs method** or methods that use autoboxing/unboxing — the interactions are especially confusing.

---

## Item 53: Use Varargs Judiciously

Varargs (*variable arity*) methods accept zero or more arguments of a specified type:

```java
static int sum(int... args) {
    int sum = 0;
    for (int arg : args) sum += arg;
    return sum;
}
```

When at least one argument is required, **don't rely on runtime checking** — enforce it statically:

```java
// WRONG: fails at runtime with cryptic exception for 0 args
static int min(int... args) {
    if (args.length == 0) throw new IllegalArgumentException("Too few arguments");
    // ...
}

// RIGHT: first argument is required
static int min(int firstArg, int... remainingArgs) {
    int min = firstArg;
    for (int arg : remainingArgs) if (arg < min) min = arg;
    return min;
}
```

**Performance concern:** every varargs invocation allocates and initializes an array. For performance-critical methods with 3 or fewer common cases, provide explicit overloads:

```java
public void foo() { }
public void foo(int a1) { }
public void foo(int a1, int a2) { }
public void foo(int a1, int a2, int a3) { }
public void foo(int a1, int a2, int a3, int... rest) { }
```

`EnumSet`'s static factories use this technique.

---

## Item 54: Return Empty Collections or Arrays, Not Nulls

Never return `null` to indicate that no results are available:

```java
// BAD: forces every caller to handle null
private final List<Cheese> cheesesInStock = ...;
public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? null : new ArrayList<>(cheesesInStock);
}

// Client must always do:
List<Cheese> cheeses = shop.getCheeses();
if (cheeses != null && cheeses.contains(Cheese.STILTON)) ...

// GOOD: return empty collection
public List<Cheese> getCheeses() {
    return new ArrayList<>(cheesesInStock);
}
// Or, if performance matters, return the same empty collection every time:
public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? Collections.emptyList()
                                    : new ArrayList<>(cheesesInStock);
}
```

Similarly for arrays: return `new Cheese[0]`, never `null`. You can return the same zero-length array repeatedly (it's immutable).

---

## Item 55: Return Optionals Judiciously

Java 8 added `Optional<T>` as a way to represent the possible absence of a value without throwing an exception.

```java
// BEFORE: throws exception or returns null
public static <E extends Comparable<E>> E max(Collection<E> c) {
    if (c.isEmpty()) throw new IllegalArgumentException("Empty collection");
    // ...
}

// WITH OPTIONAL: lets the caller decide how to handle absence
public static <E extends Comparable<E>> Optional<E> max(Collection<E> c) {
    if (c.isEmpty()) return Optional.empty();
    E result = null;
    for (E e : c) if (result == null || e.compareTo(result) > 0) result = Objects.requireNonNull(e);
    return Optional.of(result);
}
// OR using streams:
public static <E extends Comparable<E>> Optional<E> max(Collection<E> c) {
    return c.stream().max(Comparator.naturalOrder());
}
```

### How Callers Use Optionals

```java
// Provide a default value
String lastWordInLexicon = max(words).orElse("No words...");

// Throw an exception if absent
Toy myToy = max(toys).orElseThrow(TemperNotFoundException::new);

// Assume present (use only if you know it's present)
Element lastNobleGas = max(Elements.NOBLE_GASES).get();
```

### When NOT to Use Optional

- **Container types** (`Optional<List<T>>`) — return an empty list instead
- **Array elements or collection values** — adds overhead
- **Primitive types** — use `OptionalInt`, `OptionalLong`, `OptionalDouble`
- **Return types of methods used in performance-critical code** — wrapping/unwrapping costs time and memory

**Never return `Optional` from methods that return primitive wrappers or container types.** The rule of thumb: return an `Optional` when a value might legitimately be absent and the caller must actively handle the absence.

---

## Item 56: Write Doc Comments for All Exposed API Elements

Javadoc is the only standard way to document a Java API. **Every exported class, interface, constructor, method, and field should have a doc comment.**

### Method Doc Comment Requirements

- **`@param`**: every parameter
- **`@return`**: unless return type is `void`
- **`@throws`**: every checked and unchecked exception the method can throw
- The description should state what the method does (not how), including its preconditions and postconditions

```java
/**
 * Returns the element at the specified position in this list.
 *
 * <p>This method is <i>not</i> guaranteed to run in constant time. In some implementations
 * it may run in time proportional to the element position.
 *
 * @param index index of element to return; must be non-negative and less than the size of this list
 * @return the element at the specified position in this list
 * @throws IndexOutOfBoundsException if the index is out of range
 *         ({@code index < 0 || index >= this.size()})
 */
E get(int index);
```

- Use `{@code ...}` for code in doc comments (escapes HTML, uses code font)
- Use `{@literal ...}` for HTML special characters
- Use `{@implSpec ...}` to document self-use patterns for subclassers
- Doc comments should be readable as plain text even without HTML rendering
- Avoid "this class" — use "this list" etc.
- Thread safety and serializability should be documented in class-level comments
