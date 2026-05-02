---
id: chapter-03
title: "Chapter 3 — Making Decisions"
sidebar_label: "Ch 3 · Making Decisions"
description: "Complete guide to Java control flow: if/else, switch statements and expressions, while/do-while/for loops, break/continue with labels, and pattern matching — including Java 21 switch with when guards."
tags:
  - control-flow
  - switch-expression
  - pattern-matching
  - loops
  - break-continue
  - yield
  - sealed-classes
  - java-21
---

# Chapter 3 — Making Decisions

<span class="chapter-badge">Exam Domain: Controlling Program Flow</span>

> **Key Topics:** `if`/`else`, `switch` statements & expressions, `while`, `do-while`, `for`, enhanced `for`, `break`, `continue`, labels, pattern matching with `switch`.

---

## 🟦 New Learner: Control Flow

### if / else Statements

```java
int score = 78;

if (score >= 90) {
    System.out.println("A");
} else if (score >= 80) {
    System.out.println("B");
} else if (score >= 70) {
    System.out.println("C");
} else {
    System.out.println("F");
}
// Output: C
```

:::caution[Always Use Braces]
Without braces, only the next **single statement** belongs to the `if`. This is a very common exam trap:
```java
if (false)
    System.out.println("Not printed");
    System.out.println("Always printed!"); // NOT part of the if!
```
:::

---

### Pattern Matching with `instanceof` (Java 16+)

```java
Object obj = "Hello, World!";

// Old way
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// New way (pattern matching)
if (obj instanceof String s) {
    System.out.println(s.length()); // s is already cast
}

// With guard condition
if (obj instanceof String s && s.length() > 5) {
    System.out.println("Long string: " + s);
}
```

---

### switch Statement (Classic)

```java
int day = 3;
switch (day) {
    case 1:
        System.out.println("Monday");
        break;
    case 2:
        System.out.println("Tuesday");
        break;
    case 3:
    case 4:
        System.out.println("Mid-week");
        break; // covers both 3 and 4 (fall-through)
    default:
        System.out.println("Other");
}
```

**Valid types for `switch`:**
- `int`, `Integer`
- `byte`, `Byte`, `short`, `Short`, `char`, `Character`
- `String`
- `enum`
- **NOT** `long`, `float`, `double`, `boolean`

---

### switch Expressions (Java 14+)

The new arrow syntax eliminates fall-through and returns a value:

```java
// Arrow form — no fall-through, no break needed
String dayName = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3, 4 -> "Mid-week";   // multiple labels in one case
    default -> "Other";
};

// Block form with yield
String result = switch (score) {
    case 100 -> "Perfect!";
    default -> {
        String grade = score >= 60 ? "Pass" : "Fail";
        yield grade + " (" + score + ")"; // yield returns from block
    }
};
```

:::tip[`switch` Expression Must Be Exhaustive]
Every possible value must be covered. For `int`, `String`, etc. you need a `default`. For `enum` you can cover all constants instead.
:::

---

### Pattern Matching with switch (Java 21)

```java
Object shape = new Circle(5.0);

String desc = switch (shape) {
    case Circle c    -> "Circle with radius " + c.radius();
    case Rectangle r -> "Rectangle " + r.width() + "x" + r.height();
    case null        -> "No shape";
    default          -> "Unknown shape";
};
```

---

### while Loop

```java
int count = 0;
while (count < 5) {
    System.out.println(count);
    count++;
} // prints 0, 1, 2, 3, 4
```

The condition is checked **before** entering the loop. If `false` from the start, the loop body never runs.

---

### do-while Loop

```java
int count = 0;
do {
    System.out.println(count);
    count++;
} while (count < 5);
// prints 0, 1, 2, 3, 4
```

The condition is checked **after** the first iteration — body always runs **at least once**.

---

### Basic for Loop

```java
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}
// prints 0, 1, 2, 3, 4

// Multiple variables (same type)
for (int i = 0, j = 10; i < j; i++, j--) {
    System.out.println(i + " " + j);
}

// Infinite loop
for (;;) { ... }
```

All three parts of the `for` header are optional.

---

### Enhanced for-each Loop

```java
int[] numbers = {1, 2, 3, 4, 5};
for (int num : numbers) {
    System.out.println(num);
}

List<String> names = List.of("Alice", "Bob", "Charlie");
for (String name : names) {
    System.out.println(name);
}
```

:::note[Limitation]
You cannot modify the underlying collection or array through the loop variable — you only get a copy of the value.
:::

---

### break and continue

```java
// break — exits the entire loop
for (int i = 0; i < 10; i++) {
    if (i == 5) break;
    System.out.print(i + " "); // 0 1 2 3 4
}

// continue — skips rest of current iteration
for (int i = 0; i < 10; i++) {
    if (i % 2 == 0) continue;
    System.out.print(i + " "); // 1 3 5 7 9
}
```

---

### Labeled Statements

Labels let you `break`/`continue` **outer** loops from an inner one:

```java
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) continue outer; // skip to next i
        System.out.println(i + "," + j);
    }
}
// Output: 0,0  1,0  2,0
```

---

## 🟣 Senior Deep Dive

### Switch Fall-Through — Intentional vs Accidental

Fall-through is one of the biggest bugs in legacy Java code:

```java
int x = 2;
switch (x) {
    case 1:
    case 2:               // intentional: 1 and 2 share same action
        System.out.println("one or two");
        // missing break — falls through to case 3!
    case 3:
        System.out.println("three");
}
// Output:
// one or two
// three    ← accidental fall-through!
```

**Java 14+ arrow cases eliminate fall-through entirely.** Prefer the new switch expression syntax.

### Switch Expressions and `yield` vs `return`

```java
int x = 3;
int result = switch (x) {
    case 1 -> 10;
    case 2 -> 20;
    default -> {
        // yield is REQUIRED in block switch cases
        // return would exit the enclosing method, not the switch
        int calculated = x * 7;
        yield calculated;  // correct!
    }
};
```

### Pattern Matching Guard Conditions in switch (Java 21)

```java
Object obj = 42;
String result = switch (obj) {
    case Integer i when i < 0  -> "negative int";
    case Integer i when i == 0 -> "zero";
    case Integer i             -> "positive int: " + i;
    case String s              -> "string: " + s;
    default                    -> "other";
};
```

The `when` clause adds a **guard** — the pattern only matches if both the type AND the condition are true. Cases are evaluated **top to bottom**, so order matters.

### Dominance in Pattern Matching

```java
// ❌ COMPILE ERROR: Integer i before Integer i when i > 0
// The unrestricted case dominates the guarded one
switch (obj) {
    case Integer i        -> "any int";   // dominates the next case
    case Integer i when i > 0 -> "positive"; // unreachable!
}
```

### Sealed Classes + switch Exhaustiveness

When switching over a sealed hierarchy, the compiler knows all permitted subclasses:

```java
sealed interface Shape permits Circle, Rectangle, Triangle {}

// No default needed — compiler verifies all cases covered
String area = switch (shape) {
    case Circle c    -> String.valueOf(Math.PI * c.radius() * c.radius());
    case Rectangle r -> String.valueOf(r.width() * r.height());
    case Triangle t  -> String.valueOf(0.5 * t.base() * t.height());
};
```

Adding a new subclass to `Shape` will cause a **compile error** in the switch — this is intentional and safe!

### Loop Performance Considerations

```java
// Cache list size in traditional for loops (micro-optimization)
List<String> list = getHugeList();
for (int i = 0, size = list.size(); i < size; i++) { ... }

// Enhanced for uses Iterator internally
for (String s : list) { ... }
// equivalent to:
Iterator<String> it = list.iterator();
while (it.hasNext()) { String s = it.next(); ... }

// ConcurrentModificationException risk
for (String s : list) {
    if (s.equals("remove")) list.remove(s); // ❌ throws CME!
    // Use it.remove() instead, or collect to a separate list
}
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| `switch` valid types | int/Integer, byte/Byte, short/Short, char/Character, String, enum — NOT long/float/double/boolean |
| `switch` expression | Must be exhaustive (cover all values); use `default` |
| `yield` | Returns a value from a block in a `switch` expression |
| Fall-through | Only with `case X:` (colon syntax); arrow `->` cases never fall through |
| `do-while` | Body always executes at least once |
| `break` with label | Exits the labeled loop entirely |
| `continue` with label | Skips to next iteration of labeled loop |
| Pattern matching | `instanceof String s` — variable `s` is in scope only when cast succeeds |
| `when` guard | Only Java 21+ `switch`; filters a pattern case further |
| `null` in switch | Must be handled explicitly with `case null` or NPE is thrown |
| Enhanced `for` | Cannot modify the collection while iterating — use `Iterator` |
| `for` header parts | All three parts optional; `for(;;)` is valid infinite loop |
| `while (false)` | Body unreachable → compile error for trivial constant false |
| `if` without braces | Only next statement is conditional — indentation deceives |
| Enum `switch` exhaustiveness | For enum switch statement (not expression), `default` optional but omitting cases allowed |
| Pattern switch dominance | Broader type patterns must not hide narrower ones — compiler error if unreachable case |
| `switch` on `boolean` | Not allowed — use `if` |
| `break` in `switch` expression | Arrow form does not use `break`; colon block form in classic switch does |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 3]
**Trap 1 — Brace-less if and misleading indentation:**
```java
if (x > 0)
    System.out.println("positive");
    System.out.println("always prints"); // NOT in the if!
```

**Trap 2 — switch on `String` is case-sensitive:**
```java
String day = "monday";
switch (day) {
    case "Monday" -> System.out.println("Start"); // ❌ won't match!
    case "monday" -> System.out.println("Start"); // ✅
}
```

**Trap 3 — `yield` is required in block switch cases:**
```java
int result = switch (x) {
    case 1 -> 10;           // arrow: implicit return
    default -> {
        int y = x * 2;
        // return y;        // ❌ COMPILE ERROR — use yield, not return
        yield y;            // ✅
    }
};
```

**Trap 4 — `null` in switch (Java 21):**
```java
Object obj = null;
switch (obj) {                     // Before Java 21: NPE here
    case null -> System.out.println("null");  // Java 21: safe
    case String s -> System.out.println(s);
    default -> System.out.println("other");
}
```

**Trap 5 — Labeled `break` vs `continue`:**
```java
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i == 1 && j == 1) break outer;    // exits outer loop completely
        if (i == 1 && j == 1) continue outer; // would skip to next i
        System.out.println(i + "," + j);
    }
}
```

**Trap 6 — Enhanced for loop does NOT update array via loop variable:**
```java
int[] arr = {1, 2, 3};
for (int n : arr) {
    n = n * 2; // modifies copy only — arr unchanged!
}
System.out.println(arr[0]); // still 1
```

**Trap 7 — switch expression with multiple case labels:**
```java
// Old style (comma not allowed with colon in traditional switch):
switch (x) { case 1: case 2: break; } // fall-through idiom

// New style (comma is fine with arrows):
switch (x) {
    case 1, 2 -> System.out.println("one or two"); // ✅ Java 14+
}
```

**Trap 8 — Cannot mix `->` and `:` in one `switch`:**
```java
// switch (x) { case 1 -> ... case 2: ... } // ❌ not allowed — pick one style per switch
```

**Trap 9 — Enhanced `for` on `null` collection:**
```java
List<String> list = null;
for (String s : list) { } // ❌ NullPointerException (not a compile error)
```

**Trap 10 — Infinite `for` without `break`:**
```java
for (;;) { } // infinite — same as while(true)
```
:::

### Exam vignettes

```java
// Vignette — enum switch
enum Day { MON, TUE }
Day d = Day.MON;
switch (d) {
    case MON -> System.out.println("m");
    case TUE -> System.out.println("t");
}
```

:::tip[Spring/Senior Relevance]
- Pattern matching with `switch` is heavily used in modern Spring applications for handling `ResponseEntity` types and processing polymorphic DTOs.
- `switch` expressions (no fall-through) make Spring `@Service` strategy patterns cleaner — use them instead of `if-else` chains in factory methods.
- The `when` guard in `switch` is useful for building type-safe route handlers in functional Spring WebFlux routers.
:::

---

## 🔗 Review Questions Focus

1. Which data types are **not** valid in a `switch` statement?
2. What is the output when `break` is missing in a `switch` case?
3. What does `yield` do in a switch expression?
4. How does a labeled `continue` differ from an unlabeled one?
5. What is the difference between `while` and `do-while`?
6. Can you modify a collection element through an enhanced for-each loop variable?
7. What happens if no `default` is provided in a `switch` expression?
8. What is the scope of a pattern variable declared in `instanceof`?
9. What does `case null` do in a Java 21 switch?
10. Can arrow and colon cases be mixed in the same `switch`?
