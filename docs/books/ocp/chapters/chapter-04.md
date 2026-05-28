---
id: chapter-04
title: "Chapter 4 — Core APIs"
sidebar_label: "Ch 4 · Core APIs"
description: "Master Java's core APIs: String, StringBuilder, arrays, Arrays utility class, Math API, BigInteger/BigDecimal, and the modern Date-Time API including daylight saving time shifts."
tags:
  - core-apis
  - strings
  - arrays
  - math-api
  - date-time
  - period-duration
  - java-21
---

# Chapter 4 — Core APIs

<span class="chapter-badge">Exam Domain: Handling Date, Time, Text, Numeric and Boolean Values · Arrays & Collections</span>

> **Key Topics:** String immutability, concatenation rules, core String methods (indexing, substring, search, replacement, strip/trim, indent, isEmpty/isBlank, formatting), method chaining, StringBuilder mutability, capacities, common StringBuilder methods, String pool internals & interning, arrays (primitives vs. objects, bracket declarations, anonymous arrays), Arrays utility (sorting, binary search index calculation, compare, mismatch), varargs, multidimensional arrays, Math API, BigInteger/BigDecimal, Date-Time API (LocalDate, LocalTime, LocalDateTime, ZonedDateTime, Instant), ChronoUnit, Period vs. Duration, Daylight Saving Time (DST) arithmetic.

---

## 🟦 New Learner: Core API Basics

### Strings & Concatenation

A `String` is an immutable sequence of characters. It implements `CharSequence` and does not require the `new` keyword to instantiate.

#### Concatenation Rules:
1. If both operands are numeric, `+` performs **numeric addition**.
2. If either operand is a `String`, `+` performs **string concatenation**.
3. Expressions are evaluated strictly from **left to right**.

```java
System.out.println(1 + 2);           // 3
System.out.println("a" + "b" + 3);   // ab3
System.out.println(1 + 2 + "c");     // 3c (1 + 2 evaluated first -> 3 + "c")
System.out.println("c" + 1 + 2);     // c12 ("c" + 1 -> "c1" + 2 -> "c12")
System.out.println("c" + null);      // cnull
```

---

### Essential String Methods
Java uses **0-based indexing** for characters in a string.

- **`length()`**: Returns the number of characters in the string.
  ```java
  var name = "animals";
  System.out.println(name.length()); // 7 (normal counting)
  ```
- **`charAt(int index)`**: Returns the character at the specified index. Throws `StringIndexOutOfBoundsException` if index is out of bounds.
  ```java
  System.out.println(name.charAt(0)); // a
  System.out.println(name.charAt(7)); // ❌ Throws Exception
  ```
- **`indexOf()`**: Finds the first index matching a character or substring. Returns `-1` if no match is found (never throws exceptions).
  ```java
  System.out.println(name.indexOf('a'));      // 0
  System.out.println(name.indexOf("al"));     // 4
  System.out.println(name.indexOf('a', 4));   // 4 (starts search at index 4)
  System.out.println(name.indexOf('a', 2, 4));// -1 (search between index 2 [inclusive] and 4 [exclusive])
  ```
- **`substring(int beginIndex, int endIndex)`**: Returns a substring starting at `beginIndex` (inclusive) and stopping right before `endIndex` (exclusive).
  ```java
  System.out.println(name.substring(3));     // mals (goes to the end)
  System.out.println(name.substring(3, 4));  // m
  System.out.println(name.substring(3, 7));  // mals (7 is the end of the string, valid boundary)
  System.out.println(name.substring(3, 3));  // "" (empty string)
  System.out.println(name.substring(3, 2));  // ❌ Throws StringIndexOutOfBoundsException (backward indices)
  ```
- **`replace(char old, char new)`**: Returns a new string with replaced characters/substrings.
  ```java
  System.out.println("abcabc".replace('a', 'A')); // AbcAbc
  ```
- **`trim()` / `strip()`**: Removes leading and trailing whitespace. `strip()` is preferred in modern Java as it supports Unicode whitespace.
  - `stripLeading()`: Removes leading whitespace only.
  - `stripTrailing()`: Removes trailing whitespace only.
- **`isEmpty()` vs `isBlank()`**:
  - `isEmpty()` returns `true` only if `length() == 0`.
  - `isBlank()` returns `true` if empty or containing only whitespace.
  ```java
  System.out.println(" ".isEmpty()); // false
  System.out.println(" ".isBlank()); // true
  ```

---

### String Formatting

Use `String.format()` or `formatted()` to build formatted strings.

```java
var name = "Kate";
var order = 5;
// Both evaluate to: "Hello Kate, order 5 is ready"
String s1 = String.format("Hello %s, order %d is ready", name, order);
String s2 = "Hello %s, order %d is ready".formatted(name, order);
```

#### Formatting Symbols:
- `%s`: Any type (typically formats as String via `.toString()`).
- `%d`: Integer types (`int`, `long`, `byte`, `short`).
- `%f`: Floating-point types (`float`, `double`).
- `%n`: System-dependent line break.

:::danger[Formatter Type Mismatch Trap]
Passing a float type to `%d` causes an `IllegalFormatConversionException` at runtime:
```java
var s = "Score: %d".formatted(95.5); // ❌ Throws Exception
```
:::

---

### Mutability & StringBuilder

Since `String` is immutable, frequent concatenation creates many garbage objects. `StringBuilder` is a **mutable** alternative.

```java
StringBuilder sb = new StringBuilder("start");
sb.append("+middle"); // Modifies sb directly
StringBuilder same = sb.append("+end"); // returns a reference to itself
System.out.println(sb == same); // true (point to the same object!)
```

#### Constructors:
```java
StringBuilder sb1 = new StringBuilder();        // Empty sequence, default capacity (16)
StringBuilder sb2 = new StringBuilder("animal");// Specific string value
StringBuilder sb3 = new StringBuilder(10);      // Empty sequence, specific initial capacity
```

#### StringBuilder Methods:
- **`append(val)`**: Appends various data types to the end.
- **`insert(int offset, val)`**: Inserts data starting at index `offset`.
  ```java
  var sb = new StringBuilder("animals");
  sb.insert(7, "-"); // animals-
  sb.insert(0, "-"); // -animals-
  sb.insert(4, "-"); // -ani-mals-
  ```
- **`delete(int start, int end)` & `deleteCharAt(int index)`**: Removes characters between `start` (inclusive) and `end` (exclusive).
- **`replace(int start, int end, String newStr)`**: Deletes elements from `start` to `end`, then inserts `newStr` at `start`.
- **`reverse()`**: Reverses the character sequence.

---

### Primitives vs. Object Equality

- `==` compares primitive values or object reference addresses.
- `equals()` performs logical comparison based on object class implementations.

:::warning[StringBuilder does NOT override equals()]
```java
var sb1 = new StringBuilder("a");
var sb2 = new StringBuilder("a");
System.out.println(sb1.equals(sb2)); // false (uses default reference comparison!)
// Correct way:
System.out.println(sb1.toString().equals(sb2.toString())); // true
```
:::

---

### Array Fundamentals

An array is a fixed-size heap object containing contiguous slots for primitives or object references.

#### Declarations & Bracket Positions:
```java
int[] ids, types; // Two int[] arrays
int ids2[], types2; // ids2 is an int[] array, types2 is a single int variable!
```

#### Initialization:
```java
int[] numbers = new int[3]; // [0, 0, 0] (initialized to primitive default values)
int[] numbers2 = new int[] {42, 55, 99}; // Initialized with specific values
int[] numbers3 = {42, 55, 99}; // Anonymous array shortcut
```

#### Elements and length:
- Use `.length` (a property, not a method) to find capacity.
- Valid index range is `0` to `length - 1`. Out of range indices throw `ArrayIndexOutOfBoundsException`.

---

## 🟣 Senior Deep Dive

### String Pool and Interning

To save memory, the JVM stores compile-time string literals and constants in the **String Pool**.

```
    [ STACK ]                          [ HEAP ]
+---------------------+           +------------------------+
| x: reference  ------+-----------> "Hello World" (Pool)   |
| y: reference  ------+----------/                        |
| z: reference  ------+-----------> "Hello World" (Object) |
+---------------------+           +------------------------+
```

```java
var x = "Hello World";
var y = "Hello World";
System.out.println(x == y); // true (Literal references point to String Pool)

var z = new String("Hello World");
System.out.println(x == z); // false (new forces a distinct heap object)

// Interning: force reference to pool
var internedZ = z.intern();
System.out.println(x == internedZ); // true
```

#### Compile-Time Constants vs Runtime Computations:
```java
var first = "rat" + 1;                  // Compile-time constant -> pooled "rat1"
var second = "r" + "a" + "t" + "1";     // Compile-time constant -> pooled "rat1"
var third = "r" + "a" + "t" + new String("1"); // Runtime computed -> new heap object
System.out.println(first == second); // true
System.out.println(first == third);  // false
```

---

### Arrays Utility Class (`java.util.Arrays`)

#### Sorting (7Up Rule)
`Arrays.sort()` sorts elements in natural order: **Numbers (7)** -> **Uppercase letters (U)** -> **Lowercase letters (p)**.
```java
String[] strings = { "10", "9", "100" };
Arrays.sort(strings); // Alphabetical: ["10", "100", "9"]
```

#### Binary Search
`Arrays.binarySearch(array, target)` requires a **sorted** array.
- **If found:** Returns the index of the match.
- **If not found:** Returns **`-(insertionPoint) - 1`** (showing where the element should be inserted to keep the array sorted).
```java
int[] numbers = {2, 4, 6, 8};
System.out.println(Arrays.binarySearch(numbers, 2)); // 0
System.out.println(Arrays.binarySearch(numbers, 3)); // -2  (should insert at index 1 -> -1 - 1 = -2)
System.out.println(Arrays.binarySearch(numbers, 9)); // -5  (should insert at index 4 -> -4 - 1 = -5)
```

#### Comparison APIs:
- **`Arrays.compare(a, b)`**: Returns a negative number if $a < b$, `0` if $a == b$, and positive if $a > b$.
  - `null` is smaller than any other value.
  - If one array is a prefix of another, the shorter array is smaller.
- **`Arrays.mismatch(a, b)`**: Returns the first index where the arrays differ, or `-1` if they are equal.
```java
System.out.println(Arrays.mismatch(new int[]{1, 2}, new int[]{1})); // 1 (index of difference)
```

---

### Multidimensional Arrays
Java supports arrays of arrays (multidimensional arrays), which can be rectangular or asymmetric (jagged).
```java
int[][] args1 = new int[2][]; // First dimension initialized, second is null
args1[0] = new int[5]; // Jagged array construction
args1[1] = new int[3];

// Iterating asymmetric array
for (int[] inner : args1) {
    for (int num : inner) {
        System.out.print(num + " ");
    }
}
```

---

### Math APIs

- `Math.max(a, b)` / `Math.min(a, b)`: Overloaded for `int`, `long`, `float`, `double`.
- `Math.round(num)`: Rounds half up. Returns `long` for `double` input, and `int` for `float` input.
- `Math.ceil(double)`: Rounds up to the next integer (returns `double`).
- `Math.floor(double)`: Rounds down (returns `double`).
- `Math.pow(double base, double exp)`: Returns $base^{exp}$ as a `double`.
- `Math.random()`: Returns a `double` in range $[0.0, 1.0)$.

#### BigInteger and BigDecimal
Used for infinite-precision math. Unlike primitives, they are **immutable** objects.
- Use `valueOf()` or constructor to initialize.
- Use `.add()`, `.subtract()`, `.multiply()`, `.divide()`.
- `BigDecimal` prevents floating-point rounding errors:
```java
double errorVal = 64.1 * 100; // 6409.999999999999
BigDecimal correctVal = BigDecimal.valueOf(64.1).multiply(BigDecimal.valueOf(100)); // 6410.0
```

---

### Date-Time APIs (`java.time.*`)

Java 8 introduced modern date-time classes with private constructors (Factory Pattern). Use `.of()` or `.now()`.

| Class | Contains | Format Example |
|-------|----------|----------------|
| `LocalDate` | Date only | `2025-01-20` |
| `LocalTime` | Time only | `06:15:30.200` |
| `LocalDateTime` | Date + Time | `2025-01-20T06:15:30.200` |
| `ZonedDateTime` | Date + Time + Time Zone | `2025-01-20T06:15:30.200-05:00[America/New_York]` |
| `Instant` | Instant in UTC (GMT) | `2025-01-20T11:15:30Z` |

:::danger[Factory Instantiation Trap]
Calling a constructor triggers a compilation error:
```java
var d = new LocalDate(); // ❌ DOES NOT COMPILE (private constructor)
```
:::

#### Periods and Durations
- **`Period`**: Represents date intervals (Years, Months, Weeks, Days). Format: `P1Y2M3D`.
- **`Duration`**: Represents time intervals (Days, Hours, Minutes, Seconds, Nanos). Format: `PT2H30M`.

```java
var date = LocalDate.of(2025, 1, 20);
var period = Period.ofMonths(1);
System.out.println(date.plus(period)); // 2025-02-20

var time = LocalTime.of(6, 15);
var duration = Duration.ofHours(6);
System.out.println(time.plus(duration)); // 12:15

System.out.println(date.plus(duration)); // ❌ Throws UnsupportedTemporalTypeException (no time fields in LocalDate)
```

:::warning[Period/Duration Chain Trap]
You **cannot** chain static creation methods in `Period` or `Duration`. Only the last call is evaluated:
```java
var p = Period.ofYears(1).ofWeeks(1); // ❌ Warns/Evaluates to Period.ofWeeks(1) ONLY!
// Correct way:
var pCorrect = Period.of(1, 0, 7); // 1 year, 0 months, 7 days
```
:::

#### ChronoUnit and Instants
- Use `ChronoUnit` to calculate difference between temporal objects:
  ```java
  long mins = ChronoUnit.MINUTES.between(time1, time2);
  ```
- `Instant` represents a moment in UTC. Convert via `ZonedDateTime.toInstant()`. You cannot convert `LocalDateTime` to `Instant` directly without a zone offset.

#### Daylight Saving Time (DST)
The U.S. clock change occurs at 2:00 a.m. early Sunday morning.
- **Spring Forward (March):** Clocks jump from 1:59 a.m. to 3:00 a.m. The hour between 2:00 and 2:59 does not exist.
- **Fall Back (November):** Clocks jump from 1:59 a.m. back to 1:00 a.m. The hour between 1:00 and 1:59 is repeated twice.

```java
// Spring Forward Example:
var date = LocalDate.of(2025, Month.MARCH, 9);
var time = LocalTime.of(1, 30);
var zone = ZoneId.of("US/Eastern");
var dt = ZonedDateTime.of(date, time, zone); // 2025-03-09T01:30-05:00

dt = dt.plusHours(1); // Springs forward over 2:00 a.m.
System.out.println(dt); // 2025-03-09T03:30-04:00 (Notice time and offset change!)
```

---

## 📝 Exam Quick Reference

### Rules & Restrictions Summary

| Topic | Critical Fact |
|-------|---------------|
| **String pool** | Holds string literals and constants. Created on the heap. |
| **`substring(a, b)`** | Starts at `a`, ends at `b-1`. If `a == b`, returns `""`. Throws if `b < a`. |
| **`indexOf()`** | Returns `-1` if not found. Starting index parameter is inclusive. |
| **`trim()` vs `strip()`** | `strip()` is Unicode-aware; `trim()` only handles ASCII `&lt;=` space character. |
| **`StringBuilder` mutability** | Methods like `append()`, `insert()`, `delete()` modify the object in-place and return a reference. |
| **Array declarations** | Space and bracket ordering options exist. `int ids[]` vs `int[] ids`. |
| **`binarySearch()`** | Must be sorted first. Insertion point formula: `-(index) - 1`. |
| **`Arrays.compare()`** | Negative if first is smaller, 0 if equal, positive if larger. `null` is smallest. |
| **Date/Time class math** | Modern dates are immutable. You must assign the result of `.plus()`/`.minus()`. |
| **Period parameters** | `Period` handles only years, months, and days. `Duration` handles days, hours, minutes, seconds, nanos. |
| **Daylight Saving Time** | Skipping/repeating hours occurs depending on March/November shifts. |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 4]
**Trap 1 — Ignoring date/time return values:**
```java
var date = LocalDate.of(2025, 1, 20);
date.plusDays(10); // Return value ignored!
System.out.println(date); // prints 2025-01-20
```

**Trap 2 — Unsupported Date-Time operations:**
```java
var date = LocalDate.of(2025, 1, 20);
date.plusMinutes(5); // ❌ DOES NOT COMPILE (LocalDate has no time fields)
```

**Trap 3 — Comparing mismatched types:**
```java
String s = "a";
StringBuilder sb = new StringBuilder("a");
System.out.println(s == sb); // ❌ DOES NOT COMPILE (types are incompatible)
```

**Trap 4 — Binary search on unsorted arrays:**
```java
int[] nums = {3, 2, 1};
System.out.println(Arrays.binarySearch(nums, 2)); // Result is undefined/unpredictable!
```

**Trap 5 — Array length property vs String length method:**
```java
int[] arr = new int[5];
System.out.println(arr.length); // property (no parentheses)
String s = "abc";
System.out.println(s.length()); // method (has parentheses)
```

**Trap 6 — String Pool comparison vs. runtime concatenation:**
```java
String s1 = "rat1";
String s2 = "rat" + new String("1");
System.out.println(s1 == s2); // false (computed at runtime, not pooled)
```

**Trap 7 — Invalid index limits in `substring()`:**
```java
String s = "abc";
s.substring(1, 4); // ❌ Throws StringIndexOutOfBoundsException (max endIndex is length() = 3)
```

**Trap 8 — ArrayStoreException at runtime:**
```java
Object[] objs = new String[1];
objs[0] = new StringBuilder(); // Compiles, but throws ArrayStoreException at runtime!
```

**Trap 9 — Rounding method return types:**
```java
int val = Math.round(3.14); // ❌ DOES NOT COMPILE: Math.round(double) returns a long!
```

**Trap 10 — Invalid Period / Duration arguments:**
```java
Period.of(1, 2, 3, 4); // ❌ DOES NOT COMPILE: Period.of() accepts at most 3 parameters (years, months, days)
```
:::

### Exam Vignettes

```java
// Vignette: StringBuilder offset insertion
StringBuilder sb = new StringBuilder("123");
sb.append("45").insert(2, "-");
// 1. sb.append("45") -> "12345"
// 2. sb.insert(2, "-") -> inserts '-' at index 2 -> "12-345"
```

:::tip[Spring/Senior Relevance]
- **`BigDecimal` in Financial Services:** Never use `double` for currency calculations in Spring transactional services. Use `BigDecimal` to prevent precision loss.
- **Date conversions in Spring APIs:** Spring Boot uses Jackson to serialize Date-Time objects. Correctly formatting `ZonedDateTime` ensures timezones are preserved across microservice boundaries.
:::

---

## 🔗 Review Questions Focus

1. **Immutable assignments:** Recognize ignored math operations on `LocalDate`/`String`.
2. **Binary search outcomes:** Predict values returned when items are not present in a sorted array.
3. **Capacity declarations:** Differentiate `new StringBuilder(10)` capacity allocation from actual character length.
4. **Daylight Saving offsets:** Track timezone offset modifications during spring-forward and fall-back weekends.
5. **Array comparison rules:** Compare sorting criteria (7Up) in `Arrays.compare()`.
6. **Varargs arrays:** Treat `String... args` parameters as arrays inside method blocks.
7. **Math return types:** Recognize when `Math` methods return `double` vs. `long` or `int`.
8. **String Pool allocations:** Differentiate `intern()` matches from runtime string concatenations.
9. **Jagged array iterations:** Trace loops on asymmetric multidimensional structures.
10. **Exception types:** Identify runtime errors like `ArrayStoreException` and `UnsupportedTemporalTypeException`.
