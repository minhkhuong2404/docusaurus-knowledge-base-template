---
id: chapter-04
title: "Chapter 4 — Core APIs"
sidebar_label: "Ch 4 · Core APIs"
description: "Comprehensive coverage of Java's String, StringBuilder, arrays, Math API, and the Date-Time API (LocalDate, LocalTime, LocalDateTime, ZonedDateTime, Period, Duration, Instant) with immutability traps and exam-critical edge cases."
tags:
  - string
  - stringbuilder
  - arrays
  - date-time
  - localdate
  - localdatetime
  - period
  - duration
  - immutability
  - math-api
---

# Chapter 4 — Core APIs

<span class="chapter-badge">Exam Domain: Handling Date, Time, Text · Arrays & Collections</span>

> **Key Topics:** `String`, `StringBuilder`, arrays, `Arrays` utility, `Math` API, `LocalDate`/`LocalTime`/`LocalDateTime`/`ZonedDateTime`, `Period`, `Duration`, `Instant`.

---

## 🟦 New Learner: Working with Core Types

### String — Immutable Text

`String` objects are **immutable** — every method returns a new `String`.

```java
String s = "Hello, World!";

// Common methods
System.out.println(s.length());          // 13
System.out.println(s.charAt(0));         // 'H'
System.out.println(s.indexOf("World")); // 7
System.out.println(s.substring(7));     // "World!"
System.out.println(s.substring(7, 12)); // "World" (end index exclusive)
System.out.println(s.toLowerCase());    // "hello, world!"
System.out.println(s.toUpperCase());    // "HELLO, WORLD!"
System.out.println(s.trim());           // removes leading/trailing whitespace
System.out.println(s.strip());          // Unicode-aware trim (prefer this)
System.out.println(s.replace("World", "Java")); // "Hello, Java!"
System.out.println(s.contains("World")); // true
System.out.println(s.startsWith("Hello")); // true
System.out.println(s.endsWith("!"));   // true
System.out.println(s.isEmpty());       // false
System.out.println(s.isBlank());       // false (true for "   ")

// Chaining (each returns a new String)
String result = "  hello  ".strip().toUpperCase(); // "HELLO"
```

:::caution[String Immutability Trap]
```java
String s = "Hello";
s.toUpperCase();           // ❌ return value ignored! s is unchanged
s = s.toUpperCase();       // ✅ reassign to capture the result
System.out.println(s);     // "HELLO"
```
:::

---

### StringBuilder — Mutable Text

`StringBuilder` is **mutable** and more efficient for building strings in loops.

```java
StringBuilder sb = new StringBuilder("Hello");
sb.append(", World");   // Hello, World
sb.append("!");         // Hello, World!
sb.insert(5, " Java");  // Hello Java, World!
sb.delete(5, 10);       // Hello, World!
sb.reverse();           // !dlroW ,olleH
sb.replace(0, 6, "Hi"); // Hi olleH (replaced indices 0-5)

// Get result
String result = sb.toString();

// Method chaining works because each method returns 'this'
String built = new StringBuilder()
    .append("Java ")
    .append(21)
    .append(" rocks!")
    .toString(); // "Java 21 rocks!"
```

| Method | String | StringBuilder |
|--------|--------|---------------|
| `length()` | ✅ | ✅ |
| `charAt()` | ✅ | ✅ |
| `indexOf()` | ✅ | ✅ |
| `substring()` | ✅ Returns new String | ✅ Returns new String |
| `append()` | ❌ | ✅ Modifies in place |
| `insert()` | ❌ | ✅ Modifies in place |
| `delete()` | ❌ | ✅ Modifies in place |
| `reverse()` | ❌ | ✅ Modifies in place |

---

### Arrays

```java
// Declaration and initialization
int[] nums = new int[5];             // {0, 0, 0, 0, 0}
int[] nums2 = {10, 20, 30, 40, 50}; // array literal

// Access
System.out.println(nums2[0]); // 10
System.out.println(nums2.length); // 5 (not a method call — it's a field!)

// Multi-dimensional
int[][] grid = new int[3][4]; // 3 rows, 4 columns
int[][] jagged = {{1,2}, {3,4,5}, {6}}; // unequal rows
```

#### Arrays Utility Class

```java
import java.util.Arrays;

int[] arr = {3, 1, 4, 1, 5, 9, 2, 6};

Arrays.sort(arr);                     // [1, 1, 2, 3, 4, 5, 6, 9]
int idx = Arrays.binarySearch(arr, 4); // 4 (must be sorted first!)
System.out.println(Arrays.toString(arr)); // "[1, 1, 2, 3, 4, 5, 6, 9]"

int[] copy = Arrays.copyOf(arr, 5);       // first 5 elements
int[] rangeCopy = Arrays.copyOfRange(arr, 2, 5); // indices 2,3,4

boolean equal = Arrays.equals(arr, copy); // element-by-element comparison
```

:::tip[Binary Search Rules]
- Array **must be sorted** before calling `binarySearch`
- If element found, returns its **index**
- If not found, returns a **negative value** `-(insertion point) - 1`
:::

---

### Math API

```java
Math.abs(-5);        // 5
Math.ceil(3.1);      // 4.0
Math.floor(3.9);     // 3.0
Math.round(3.5);     // 4  (rounds up at .5)
Math.round(3.4);     // 3
Math.pow(2, 10);     // 1024.0
Math.sqrt(16);       // 4.0
Math.min(3, 7);      // 3
Math.max(3, 7);      // 7
Math.random();       // [0.0, 1.0)  (excludes 1.0)
Math.PI;             // 3.14159...
```

---

### Date and Time API

Java 8+ introduced an immutable, fluent Date-Time API in `java.time`.

#### Core Types

| Class | What It Represents | Has Time? | Has Date? | Has Zone? |
|-------|--------------------|-----------|-----------|-----------|
| `LocalDate` | Date only | ❌ | ✅ | ❌ |
| `LocalTime` | Time only | ✅ | ❌ | ❌ |
| `LocalDateTime` | Date + Time | ✅ | ✅ | ❌ |
| `ZonedDateTime` | Date + Time + Zone | ✅ | ✅ | ✅ |
| `Instant` | Machine timestamp (UTC epoch) | ✅ | ✅ | UTC only |

```java
LocalDate date = LocalDate.of(2024, 3, 15);      // 2024-03-15
LocalTime time = LocalTime.of(10, 30, 0);         // 10:30:00
LocalDateTime dt = LocalDateTime.of(date, time);  // 2024-03-15T10:30:00

// Now
LocalDate today = LocalDate.now();
LocalDateTime now = LocalDateTime.now();

// Parsing
LocalDate parsed = LocalDate.parse("2024-03-15"); // ISO format
```

#### Manipulation

All Date-Time objects are **immutable** — manipulations return new instances:

```java
LocalDate date = LocalDate.of(2024, 1, 1);

LocalDate next = date.plusDays(10);       // 2024-01-11
LocalDate prev = date.minusMonths(1);     // 2023-12-01
LocalDate future = date.plusYears(1);     // 2025-01-01

// Checking
date.isBefore(next);  // true
date.isAfter(prev);   // false
date.isEqual(LocalDate.of(2024,1,1)); // true

// Accessors
date.getYear();       // 2024
date.getMonth();      // JANUARY (Month enum)
date.getMonthValue(); // 1
date.getDayOfMonth(); // 1
date.getDayOfWeek();  // MONDAY (DayOfWeek enum)
```

---

### Period and Duration

| Class | Models | Used With |
|-------|--------|-----------|
| `Period` | Date-based amount (years, months, days) | `LocalDate`, `LocalDateTime` |
| `Duration` | Time-based amount (hours, minutes, seconds, nanos) | `LocalTime`, `LocalDateTime`, `Instant` |

```java
Period period = Period.of(1, 2, 3);     // 1 year, 2 months, 3 days
Period p = Period.ofMonths(6);
Period diff = Period.between(date1, date2);

Duration duration = Duration.ofHours(2).plusMinutes(30); // 2.5 hours
Duration d = Duration.ofSeconds(3600);
Duration diff2 = Duration.between(time1, time2);

// Apply to dates
LocalDate newDate = date.plus(Period.ofWeeks(2)); // add 14 days
```

---

## 🟣 Senior Deep Dive

### String Pool and Memory

```java
String a = "hello";                // in String pool
String b = "hello";                // same pool object
String c = new String("hello");    // forced new heap object
String d = c.intern();             // explicitly add to pool

a == b;         // true
a == c;         // false
a == d;         // true (interned)
a.equals(c);    // true (content equal)
```

### `String.format` and Formatted Output

```java
String name = "Duke";
int version = 21;
double pi = 3.14159;

String s = String.format("Hello, %s! Java %d, PI=%.2f", name, version, pi);
// "Hello, Duke! Java 21, PI=3.14"

// Java 15+: instance method
String s2 = "Hello, %s! Java %d".formatted(name, version);
```

Common format specifiers: `%s` (String), `%d` (int/long), `%f` (float/double), `%n` (newline), `%b` (boolean).

### StringBuilder Internals

`StringBuilder` uses a `char[]` internally. Default capacity is 16; it doubles when exceeded (like `ArrayList`). Use `new StringBuilder(expectedSize)` to avoid resizing:

```java
// Concatenation in loops — avoid + in loops:
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i; // ❌ creates 1000 intermediate String objects!
}

StringBuilder sb = new StringBuilder(5000);
for (int i = 0; i < 1000; i++) {
    sb.append(i); // ✅ efficient, single buffer
}
String result2 = sb.toString();
```

### ZonedDateTime and DST

```java
ZoneId ny = ZoneId.of("America/New_York");
ZonedDateTime zdt = ZonedDateTime.of(2024, 3, 10, 2, 30, 0, 0, ny);
// 2:30 AM on DST transition — this time doesn't actually exist!
// Java adjusts it to 3:30 AM automatically

ZonedDateTime spring = ZonedDateTime.of(2024, 3, 10, 1, 0, 0, 0, ny);
ZonedDateTime after = spring.plusHours(2); // jumps from 1 AM → 4 AM (skips 2-3 AM)
```

### `Instant` and `ChronoUnit`

```java
Instant now = Instant.now();
Instant epoch = Instant.EPOCH; // 1970-01-01T00:00:00Z
long secondsElapsed = epoch.until(now, ChronoUnit.SECONDS);

// Instant ↔ ZonedDateTime
ZonedDateTime zdt = now.atZone(ZoneId.of("UTC"));
Instant back = zdt.toInstant();
```

### `Arrays.compare` vs `Arrays.mismatch`

```java
int[] a = {1, 2, 3, 4};
int[] b = {1, 2, 5, 4};

Arrays.compare(a, b);   // negative (a < b at first difference)
Arrays.mismatch(a, b);  // 2 (index of first difference)

// If arrays are equal:
Arrays.compare(a, a);   // 0
Arrays.mismatch(a, a);  // -1 (no mismatch)
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| `String` immutability | All `String` methods return new objects; original unchanged |
| `StringBuilder` mutability | Methods modify in place AND return `this` for chaining |
| `String.substring(a,b)` | From index `a` (inclusive) to `b` (exclusive) |
| `Arrays.binarySearch` | Must be sorted; returns negative if not found |
| `LocalDate.of(y,m,d)` | Month is 1-based (1=January); use `Month` enum |
| `Period` vs `Duration` | Period = date-based; Duration = time-based |
| Date-Time immutability | All `plus`/`minus` methods return new objects |
| `Instant` | UTC-based machine time; use for timestamps, logging |
| `isBlank()` | Returns `true` for empty or whitespace-only strings |
| `strip()` vs `trim()` | `strip()` handles Unicode whitespace; prefer it |
| `charAt(i)` | Throws `StringIndexOutOfBoundsException` if out of range |
| `indexOf` returns | Returns `-1` if not found (never throws) |
| `StringBuilder.delete(a,b)` | Deletes from `a` (inclusive) to `b` (exclusive) |
| `LocalDate.plusMonths` | Adjusts day-of-month if necessary (e.g. Jan 31 + 1 month = Feb 28) |
| `ZonedDateTime` | Combines local date-time with `ZoneId`; watch for DST gaps/overlaps |
| `LocalTime` | No date component; `atDate(LocalDate)` to combine |
| `ZoneId` vs `ZoneOffset` | Named zones vs fixed offset; prefer `ZoneId.of("Europe/Paris")` |
| `String.intern()` | Returns canonical pool reference — exam may pair with `==` |
| `String.repeat(n)` | Java 11+ — `n` must be ≥ 0 |
| `String.stripLeading` / `stripTrailing` | Unicode-aware partial strip |
| `Arrays.compare` / `compareUnsigned` | Lexicographic; unsigned variant for `byte`/`int` arrays |
| `StringBuilder` capacity | Default 16; `new StringBuilder(0)` grows as needed |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 4]
**Trap 1 — String immutability with chaining:**
```java
String s = "  hello  ";
s.strip();              // ❌ result discarded! s unchanged
s = s.strip();          // ✅ reassign
System.out.println(s);  // "hello"
```

**Trap 2 — `StringBuilder.reverse()` vs String:**
```java
StringBuilder sb = new StringBuilder("abcde");
sb.reverse(); // modifies sb in place — "edcba"
// String has NO reverse() method — use new StringBuilder(s).reverse().toString()
```

**Trap 3 — `substring` end index is exclusive:**
```java
String s = "Hello";
s.substring(1);     // "ello" (from index 1 to end)
s.substring(1, 3);  // "el"  (indices 1 and 2 only; 3 is excluded)
s.substring(2, 2);  // ""    (empty — start equals end)
s.substring(2, 1);  // ❌ StringIndexOutOfBoundsException
```

**Trap 4 — `Arrays.binarySearch` on unsorted arrays:**
```java
int[] arr = {5, 3, 1, 4, 2};
Arrays.binarySearch(arr, 3); // undefined behavior — result is unpredictable!
// Always sort first: Arrays.sort(arr); then binarySearch
```

**Trap 5 — Date-Time month numbering:**
```java
LocalDate d1 = LocalDate.of(2024, 2, 29);  // ✅ 2024 is a leap year
LocalDate d2 = LocalDate.of(2023, 2, 29);  // ❌ DateTimeException — 2023 is not a leap year
LocalDate d3 = LocalDate.of(2024, Month.FEBRUARY, 29); // ✅ using enum
```

**Trap 6 — `Period.between` vs `Duration.between`:**
```java
LocalDate d1 = LocalDate.of(2024, 1, 1);
LocalDate d2 = LocalDate.of(2024, 3, 15);
Period p = Period.between(d1, d2);       // 2 months 14 days (not 74 days!)
Duration dur = Duration.between(d1.atStartOfDay(), d2.atStartOfDay()); // in seconds/nanos

// Period CANNOT be used with LocalTime
// Duration CANNOT be used with LocalDate alone
```

**Trap 7 — `Math.round` rounds half-up but returns `long`:**
```java
long r1 = Math.round(3.5);  // 4L
long r2 = Math.round(-3.5); // -3L (NOT -4L — rounds toward positive infinity)
int r3 = (int) Math.round(3.5); // cast needed for int
```

**Trap 8 — `StringBuilder` chaining returns `this`:**
```java
StringBuilder sb1 = new StringBuilder("a");
StringBuilder sb2 = sb1.append("b").append("c");
System.out.println(sb1 == sb2); // TRUE — same object!
```

**Trap 9 — `Period` does not mix with `LocalTime`:**
```java
LocalTime t = LocalTime.NOON;
t.plus(Period.ofDays(1)); // ❌ UnsupportedTemporalTypeException — Period is date-based
```

**Trap 10 — `Instant` vs `LocalDateTime`:**
```java
Instant.now(); // UTC instant — no zone until you attach `atZone(ZoneId)`
```

**Trap 11 — `Arrays.binarySearch` negative return:**
```java
int i = Arrays.binarySearch(sorted, key); // if negative: insertion point = -(i+1)
```
:::

### Exam vignettes

```java
// Vignette — Period vs Duration
LocalDate d = LocalDate.of(2024,1,1);
d.plus(Period.ofDays(1)); // OK — date-based amount
d.plus(Duration.ofDays(1)); // OK — day-based Duration converts to days
// Prefer Period for calendar dates; Duration for time quantities (LocalTime/Instant)
```

:::tip[Spring/Senior Relevance]
- `StringBuilder` (or `StringJoiner`) is preferred in Spring's query builders and log formatting instead of `String` concatenation.
- `LocalDate`/`LocalDateTime` are standard in Spring Data JPA entities — always use `@Column` with `columnDefinition` or `@Temporal` appropriately. Jackson maps these via `JavaTimeModule`.
- `Instant` is the right type for Spring's auditing (`@CreatedDate`, `@LastModifiedDate`) when you need timezone-agnostic UTC timestamps.
:::

---

## 🔗 Review Questions Focus

1. What is the output of `"abc".substring(1, 2)`?
2. What happens to `StringBuilder sb = new StringBuilder("abc"); sb.reverse();`?
3. Which Date-Time classes have a time zone?
4. What is the difference between `Period` and `Duration`?
5. What does `Arrays.binarySearch` return when the element is not found?
6. Can you call `Period.between()` with two `LocalTime` objects?
7. What is the return type of `Math.round(double)`?
8. What does `String.indexOf()` return if the character is not found?
9. Is `StringBuilder.delete(0,0)` valid? What does it do?
10. What exception is thrown by `LocalDate.of(2023, 2, 29)`?
