---
id: chapter-10-exceptions
title: "Chapter 10: Exceptions"
sidebar_label: "10. Exceptions"
---

# Chapter 10: Exceptions

When used to best advantage, exceptions can improve a program's readability, reliability, and maintainability. When used improperly, they can have the opposite effect.

---

## Item 69: Use Exceptions Only for Exceptional Conditions

Exceptions are, as their name implies, to be used only for **exceptional conditions**. They should never be used for ordinary control flow.

```java
// BAD: Uses exception for normal loop termination
try {
    int i = 0;
    while (true)
        range[i++].climb();
} catch (ArrayIndexOutOfBoundsException e) {}

// GOOD: Standard idiom
for (Mountain m : range)
    m.climb();
```

The exception-based loop is slower, harder to read, and may hide bugs. If a `climb()` call inside the loop throws `ArrayIndexOutOfBoundsException` due to a bug, the loop silently exits instead of propagating the error.

**Rule:** A well-designed API must not force its clients to use exceptions for ordinary control flow. If a method can sometimes return no result, use `Optional` (Item 55) or a `hasNext()` style state-testing method.

---

## Item 70: Use Checked Exceptions for Recoverable Conditions and Runtime Exceptions for Programming Errors

Java provides three kinds of throwables:

| Type | Extends | Use Case |
|---|---|---|
| Checked exceptions | `Exception` | Recoverable conditions (caller can reasonably be expected to recover) |
| Runtime exceptions | `RuntimeException` | Programming errors (precondition violations, bugs) |
| Errors | `Error` | JVM-level abnormalities (don't use, don't catch) |

**If the caller can reasonably be expected to recover, use a checked exception.** The checked exception forces the caller to address it or propagate it.

**If a programming error is suspected, use a runtime exception.** The vast majority are `IllegalArgumentException`, `IllegalStateException`, `NullPointerException`, `IndexOutOfBoundsException`.

**Never define `Error` subtypes** — they are reserved for the JVM. Also avoid `Throwable` directly.

**For checked exceptions, provide methods that help the caller recover.** For example, if a payment is rejected due to insufficient funds, include the deficit amount in the exception so the caller can display a helpful message.

---

## Item 71: Avoid Unnecessary Use of Checked Exceptions

Checked exceptions are a "burden" on callers — they must catch or propagate them. This is appropriate when:
1. The exceptional condition cannot be prevented by proper use of the API
2. The programmer using the API can take some useful action when encountering the exception

**If neither condition is met, use an unchecked exception.**

One technique to reduce checked exception burden: turn a checked method into one that returns an `Optional` or uses state-testing:

```java
// Checked exception approach — burdens caller
try {
    obj.action(args);
} catch (TheCheckedException e) {
    // Handle exceptional condition
}

// State-testing method approach (if threading is not a concern)
if (obj.actionPermitted(args)) {
    obj.action(args);
} else {
    // Handle exceptional condition
}
```

---

## Item 72: Favor the Use of Standard Exceptions

The Java libraries provide a set of standard exceptions that covers most APIs' exception-throwing needs. **Reusing standard exceptions** makes your API easier to learn and use (familiar to programmers) and less cluttered.

| Exception | Occasion |
|---|---|
| `IllegalArgumentException` | Non-null parameter value is inappropriate |
| `IllegalStateException` | Object state is inappropriate for method invocation |
| `NullPointerException` | Parameter is null where prohibited |
| `IndexOutOfBoundsException` | Index parameter value is out of range |
| `ConcurrentModificationException` | Concurrent modification of object detected where prohibited |
| `UnsupportedOperationException` | Object does not support requested operation |

**Never throw `Exception`, `RuntimeException`, `Throwable`, or `Error` directly** — they prevent callers from catching or discriminating the exception.

**Choosing between `IllegalArgumentException` and `IllegalStateException`:**
- If the object's state is the root cause → `IllegalStateException`
- If it would be wrong regardless of state → `IllegalArgumentException`
- Many values are wrong regardless of state → `IllegalArgumentException`

---

## Item 73: Throw Exceptions Appropriate to the Abstraction

If a method propagates an exception from a lower abstraction layer, it pollutes the caller's API with unrelated implementation details. **Higher layers should catch lower-level exceptions and throw exceptions that are explainable in terms of the higher-level abstraction:**

```java
// Exception translation
try {
    // Use lower-level abstraction to do our bidding
    return i.next();
} catch (NoSuchElementException cause) {
    throw new IndexOutOfBoundsException("Index: " + index, cause);
}
```

Use **exception chaining** when the lower-level exception is useful for debugging:

```java
// Exception chaining
try {
    // ...
} catch (LowerLevelException cause) {
    throw new HigherLevelException(cause); // preserve cause for getOriginalCause()
}
```

**Don't overuse exception translation.** The best way to deal with lower-level exceptions is to avoid them altogether (validate inputs before delegating to lower layers). If unavoidable, log the exception at the lower level and handle it there.

---

## Item 74: Document All Exceptions Thrown by Each Method

Always declare checked exceptions individually with `@throws` in Javadoc. **Never declare `throws Exception` or `throws Throwable`** — it prevents callers from distinguishing checked from unchecked exceptions and makes the API nearly unusable.

Use `@throws` in Javadoc for unchecked exceptions too (but don't include them in the `throws` clause):

```java
/**
 * Returns the element at the specified position in this list.
 *
 * @param index index of element to return; must be non-negative and less than the size of this list
 * @throws IndexOutOfBoundsException if the index is out of range ({@code index < 0 || index >= size()})
 */
E get(int index);
```

If many methods in a class throw the same exception for the same reason, document it at the class level rather than on each method.

---

## Item 75: Include Failure-Capture Information in Detail Messages

To capture a failure, the detail message of an exception should contain the values of all parameters and fields that contributed to the exception:

```java
// BAD: no context
throw new IndexOutOfBoundsException();

// GOOD: context for debugging
throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
```

For example, `IndexOutOfBoundsException` should include the lower bound, upper bound, and the out-of-bounds index. This is critically important for production failures that are hard to reproduce.

However, **detail messages should not contain sensitive information** (passwords, encryption keys).

One way to ensure this: create custom exceptions with constructors that require the relevant parameters:

```java
public IndexOutOfBoundsException(int lowerBound, int upperBound, int index) {
    super(String.format("Lower bound: %d, Upper bound: %d, Index: %d",
        lowerBound, upperBound, index));
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
    this.index = index;
}
```

---

## Item 76: Strive for Failure Atomicity

A failed method invocation should leave the object in the state that it was in prior to the invocation. An object that satisfies this property is said to be **failure atomic**.

**Approaches:**

1. **Use immutable objects** — failure atomicity is free; state can't be modified at all.

2. **Check parameters for validity before performing the operation:**
   ```java
   public Object pop() {
       if (size == 0) throw new EmptyStackException(); // check before modifying
       Object result = elements[--size];
       elements[size] = null;
       return result;
   }
   ```

3. **Order computation so the part that may fail precedes the part that modifies the object.**

4. **Perform the operation on a temporary copy**, then replace the object's state if the operation succeeds (used by `TreeMap.addAll()`).

5. **Recovery code** — intercept failures and restore to the prior state (primarily for disk-based operations).

**Failure atomicity is not always achievable** (two threads modifying an object concurrently). Document when it is not achieved.

---

## Item 77: Don't Ignore Exceptions

```java
// WRONG: empty catch block ignores exception
try {
    ...
} catch (SomeException e) {
    // Silently ignored!
}
```

An empty catch block **defeats the purpose of exceptions**. If you ignore an exception, at a minimum add a comment explaining why. The exception variable should be named `ignored`:

```java
Future<Integer> f = exec.submit(planarMap::chromaticNumber);
int numColors = 4;
try {
    numColors = f.get(1L, TimeUnit.SECONDS);
} catch (TimeoutException | ExecutionException ignored) {
    // Use default: minimum colors guaranteed to be sufficient
}
```

If you genuinely can't do anything about an exception, at least log it at a high-priority level.
