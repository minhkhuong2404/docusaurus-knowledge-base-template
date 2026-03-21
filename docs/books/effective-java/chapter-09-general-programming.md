---
id: chapter-09-general-programming
title: "Chapter 9: General Programming"
sidebar_label: "9. General Programming"
---

# Chapter 9: General Programming

This chapter covers the nuts and bolts of Java programming: local variables, control structures, libraries, data types, and using two non-language features (reflection and native methods).

---

## Item 57: Minimize the Scope of Local Variables

The single most powerful technique for minimizing the scope of a local variable is to **declare it where it is first used**.

- Declaring a local variable before it is used clutters the code with variables out of context.
- If a variable is initialized to something but can't be meaningfully initialized until later, wait until you can.
- Prefer `for` loops over `while` loops — the loop variable is scoped to the loop body:

```java
// Best: index variable 'i' scoped to the for loop
for (int i = 0, n = expensiveComputation(); i < n; i++) {
    doSomething(i);
}

// WRONG: iterator visible after loop — and there's a cut-and-paste bug risk
Iterator<Element> i = c.iterator();
while (i.hasNext()) {
    doSomething(i.next());
}
Iterator<Element> i2 = c2.iterator();
while (i.hasNext()) { // BUG! Uses old iterator 'i' — compiles, but wrong!
    doSomethingElse(i2.next());
}

// CORRECT: use for-each or for with iterator in loop header
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
    doSomething(e);
}
```

- **Keep methods small and focused** — a good way to prevent one variable's scope from leaking into another.

---

## Item 58: Prefer for-each Loops to Traditional for Loops

The **for-each loop** (enhanced for statement) eliminates clutter and the opportunity for bugs:

```java
// Traditional for loops — error-prone
for (int i = 0; i < a.length; i++) doSomething(a[i]);
for (Iterator<Suit> i = suits.iterator(); i.hasNext(); ) {
    Suit suit = i.next();
    for (Iterator<Rank> j = ranks.iterator(); j.hasNext(); )
        deck.add(new Card(suit, j.next()));
}

// for-each loop — simpler and less error-prone
for (Suit suit : suits)
    for (Rank rank : ranks)
        deck.add(new Card(suit, rank));
```

For-each loops can iterate over arrays, `Iterable` objects, and anything that implements `Iterable`. The overhead is negligible.

**Three situations where you can't use for-each:**

1. **Destructive filtering** — when you need to remove elements (use `Collection.removeIf` or an explicit iterator)
2. **Transforming** — when you need to replace element values (use explicit list iterator or array index)
3. **Parallel iteration** — when you need to traverse multiple collections in lockstep

---

## Item 59: Know and Use the Libraries

By using a standard library, you take advantage of the knowledge of the experts who wrote it and the experience of those who used it before you.

### The Random Example

```java
// Broken: can generate negative numbers for most values, and biased distribution
static Random rnd = new Random();
static int random(int n) {
    return Math.abs(rnd.nextInt()) % n;
}

// Correct: use ThreadLocalRandom (or Random.nextInt(n))
ThreadLocalRandom.current().nextInt(n);
```

**As of Java 7, `ThreadLocalRandom` is preferred over `Random` for most uses.** For fork-join pools and parallel streams, use `SplittableRandom`.

### Key Libraries to Know

At a minimum, every Java programmer should be familiar with:
- **`java.lang`**, **`java.util`**, **`java.io`** and their subpackages
- **Collections framework** (`java.util.Collections`, `Arrays`)
- **Streams library** (`java.util.stream`)
- **`java.util.concurrent`** for concurrency
- **`java.util.function`** for functional interfaces

Check if a library has what you need before rolling your own. The quality is almost certainly higher. Every year (major releases), new features are added to the libraries; make sure you're not reinventing them.

---

## Item 60: Avoid float and double if Exact Answers Are Required

`float` and `double` are designed for scientific and engineering calculations. They perform **binary floating-point arithmetic**, which is not exact. They are particularly ill-suited for monetary calculations:

```java
System.out.println(1.03 - 0.42);  // prints 0.6100000000000001
System.out.println(1.00 - 9 * 0.10); // prints 0.09999999999999998

// Monetary example:
double funds = 1.00;
int itemsBought = 0;
for (double price = 0.10; funds >= price; price += 0.10) {
    funds -= price;
    itemsBought++;
}
System.out.println(itemsBought + " items bought, change: $" + funds);
// Prints: 3 items bought, change: $0.3999999999999999 (WRONG)
```

**Use `BigDecimal`, `int`, or `long` for monetary calculations:**

```java
// Using BigDecimal (verbose, slower)
final BigDecimal TEN_CENTS = new BigDecimal(".10");
BigDecimal funds = new BigDecimal("1.00");
for (BigDecimal price = TEN_CENTS; funds.compareTo(price) >= 0; price = price.add(TEN_CENTS)) {
    funds = funds.subtract(price);
}
// Correct!

// OR: use int/long representing cents
int funds = 100;  // cents
for (int price = 10; funds >= price; price += 10)
    funds -= price;
```

Use `int` for amounts ≤9 decimal digits, `long` for ≤18, `BigDecimal` for larger.

---

## Item 61: Prefer Primitive Types to Boxed Primitives

There are three differences between primitives and boxed primitives:

1. **Primitives have only values; boxed primitives have identities distinct from their values.** Two `Integer` instances with the same value may or may not be `==` equal.
2. **Primitives have only fully functional values; boxed primitives can be `null`.**
3. **Primitives are more time- and space-efficient.**

```java
// BROKEN: uses == to compare Integer values (compares identity, not value)
Comparator<Integer> naturalOrder = (i, j) -> (i < j) ? -1 : (i == j ? 0 : 1);
// naturalOrder.compare(new Integer(42), new Integer(42)) returns 1! (not 0)

// FIX: unbox first
Comparator<Integer> naturalOrder = (iBoxed, jBoxed) -> {
    int i = iBoxed, j = jBoxed; // auto-unbox
    return i < j ? -1 : (i == j ? 0 : 1);
};
```

**Mixing primitives and boxed primitives causes unboxing — which can throw `NullPointerException`:**

```java
Integer i = null;
if (i == 42) ... // NullPointerException! (unboxes null)
```

**Performance: autoboxing in a tight loop is catastrophic:**

```java
Long sum = 0L; // Should be long, not Long!
for (long i = 0; i <= Integer.MAX_VALUE; i++)
    sum += i; // boxes/unboxes ~2 billion times
```

**When to use boxed primitives:**
- As type parameters in generics (can't use `int` in `List<int>`)
- When null is needed to represent absence
- Reflection (Item 65)

---

## Item 62: Avoid Strings Where Other Types Are More Appropriate

Strings are poor substitutes for:
- **Other value types:** If data comes as a string but represents an `int`, `float`, `boolean`, or enum — convert it to that type.
- **Enums:** Item 34 explains this in detail.
- **Aggregate types:** A string like `"className#fieldName"` is error-prone. Use a private static member class instead.
- **Capabilities:** Strings as unforgeable keys (like `ThreadLocal` key names) should be typed keys instead:

```java
// BAD: String-keyed ThreadLocal
public class ThreadLocal {
    public static void set(String key, Object value);
    public static Object get(String key); // Any caller with the same key can read!
}

// GOOD: Typed key
public class ThreadLocal {
    public static class Key { Key() {} }
    public static Key newKey() { return new Key(); }
    public static void set(Key key, Object value);
    public static Object get(Key key);
}
```

---

## Item 63: Beware the Performance of String Concatenation

Using the `+` operator to concatenate `n` strings requires **O(n²)** time. Each `+` copies the entire accumulated string.

```java
// BAD: O(n^2) performance
public String statement() {
    String result = "";
    for (int i = 0; i < numItems(); i++)
        result += lineForItem(i); // slow!
    return result;
}

// GOOD: use StringBuilder
public String statement() {
    StringBuilder b = new StringBuilder(numItems() * LINE_WIDTH);
    for (int i = 0; i < numItems(); i++)
        b.append(lineForItem(i));
    return b.toString();
}
```

---

## Item 64: Refer to Objects by Their Interfaces

If appropriate interface types exist, **use them for parameters, return values, variables, and fields**. The only time you'd use a class is if no appropriate interface exists (value classes like `String`, or framework classes like `TimerTask`).

```java
// GOOD: interface type
Set<Son> sonSet = new LinkedHashSet<>();

// BAD: class type
LinkedHashSet<Son> sonSet = new LinkedHashSet<>();
```

If you get into the habit of using interface types, your program will be more flexible. If you later decide to switch implementations (`LinkedHashSet` → `HashSet`), you only change the constructor call.

---

## Item 65: Prefer Interfaces to Reflection

The `java.lang.reflect` API provides programmatic access to arbitrary classes at runtime. But reflection has severe costs:
- **No compile-time type checking** — errors surface as runtime exceptions
- **Verbose and ugly code**
- **Performance hit** — reflective invocations are much slower than normal calls

The core use case where reflection is legitimate: creating instances of classes unknown at compile time. But once created, access them through an **interface or superclass** that you do know:

```java
// Legitimate use of reflection — instantiate, then use via interface
Class<? extends Set<String>> cl = (Class<? extends Set<String>>) Class.forName(args[0]);
Constructor<? extends Set<String>> cons = cl.getDeclaredConstructor();
Set<String> s = cons.newInstance();
```

---

## Item 66: Use Native Methods Judiciously

The Java Native Interface (JNI) lets you call native methods (C or C++). Historically used for performance and platform-specific functionality. Today:
- **Performance:** JVM is fast enough that native methods are rarely needed for performance. JVM has `BigDecimal` and other optimized implementations natively.
- **Platform-specific:** Still legitimate for accessing platform-specific facilities not available in Java.

**Native methods have serious disadvantages:** not memory-safe, platform-specific, harder to debug. Think carefully before using them.

---

## Item 67: Optimize Judiciously

> "More computing sins are committed in the name of efficiency (without necessarily achieving it) than for any other single reason — including blind stupidity." — W.A. Wulf

> "We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil." — Donald Knuth

**Write good programs rather than fast ones.** Performance will generally follow from good structure.

**Measure performance before and after each attempted optimization.** Java's performance model is unpredictable — what looks like optimization often isn't. Profile before optimizing.

**Design APIs, protocols, and persistent data formats with performance in mind** — these are hard to change later. Avoid making types mutable, using inheritance where composition would serve, or using implementation types in APIs. But don't warp your API to achieve performance — a good implementation can always be replaced; an exported API is forever.

---

## Item 68: Adhere to Generally Accepted Naming Conventions

The Java platform has well-established naming conventions (Java Language Specification §6.1). Violate them at your peril:

| Identifier Type | Examples |
|---|---|
| Package/module | `com.google.inject`, `org.joda.time.format` |
| Class/Interface | `Timer`, `FutureTask`, `LinkedHashMap`, `HttpClient` |
| Method/Field | `remove`, `groupingBy`, `getCrc` |
| Constant Field | `MIN_VALUE`, `NEGATIVE_INFINITY` |
| Local Variable | `i`, `denom`, `houseNum` |
| Type Parameter | `T`, `E`, `K`, `V`, `X`, `R`, `T1`, `T2` |

Acronyms: capitalize only the first letter — `HttpUrl`, not `HTTPURL` (more readable in compound names).

Grammatical conventions:
- **Classes/interfaces:** noun or adjective — `Thread`, `Runnable`
- **Methods that return boolean:** start with `is`/`has` — `isEmpty`, `hasNext`
- **Methods that return non-boolean info:** start with `get` (standard beans convention) or just the noun — `size()`, `getTime()`
- **Methods that convert types:** `toString`, `toArray`, `asCollection`, `intValue`
- **Static factories:** `from`, `of`, `valueOf`, `instance`, `getInstance`, `newInstance`, `getType`, `newType`
