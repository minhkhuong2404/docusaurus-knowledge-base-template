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

> **Key Topics:** Control flow statements, code blocks, `if`/`else` statements, pattern matching with `instanceof`, pattern variables, flow scoping, `switch` statements vs. `switch` expressions, case constants, enum case labels, arrow operator (`->`) vs. colon (`:`), break/continue statements, labels in nested structures, `yield` statement, exhaustiveness, dominance (unreachable cases), guard clauses (`when`), pattern matching for `switch` (Java 21), `case null`, loop structures (`while`, `do-while`, traditional `for`, enhanced `for-each`).

---

## 🟦 New Learner: Control Flow

### Statements and Blocks
- A **statement** is a complete unit of execution terminated with a semicolon (`;`).
- A **block of code** is a group of zero or more statements enclosed in braces `{}`. It can be used anywhere a single statement is allowed.
- Indentation is for readability only; Java ignores tabs and spaces.

:::danger[Misleading Indentation Trap]
Without braces `{}`, only the **first statement** immediately following the `if` is executed conditionally.
```java
if (hourOfDay < 11)
    System.out.println("Good Morning");
    morningGreetingCount++; // ❌ Always executed, regardless of hourOfDay!
```
:::

---

### The `if` / `else` Statements
The condition inside an `if` statement **must** evaluate to a `boolean` expression. Other types are not implicitly converted to booleans:
```java
int hour = 1;
if (hour) { } // ❌ DOES NOT COMPILE (Unlike JavaScript/C++, integers are NOT boolean)
```

---

### Pattern Matching with `instanceof`

Pattern matching reduces boilerplate code by combining type checking and casting in a single operation.

```java
// Traditional boilerplate
if (number instanceof Integer) {
    Integer data = (Integer) number;
    System.out.print(data.compareTo(5));
}

// Pattern matching (Java 16+)
if (number instanceof Integer data) {
    System.out.print(data.compareTo(5)); // 'data' is the pattern variable, automatically cast
}
```

#### Final Pattern Variables
You can mark the pattern variable as `final` to prevent reassigning it inside the block:
```java
if (number instanceof final Integer data) {
    data = 10; // ❌ DOES NOT COMPILE
}
```

#### Pattern Matching with `null`
The `instanceof` operator always returns `false` when checked against `null`. Therefore, pattern matching is safe from throwing `NullPointerException`:
```java
String text = null;
if (text instanceof String s) {
    System.out.println(s.length()); // Skipped; block never executes
}
```

---

### Classic `switch` Statements

A `switch` statement redirects execution flow to one or more branches based on a single runtime value.

```java
switch (day) {
    case 1:
        System.out.println("Monday");
        break;
    case 2:
        System.out.println("Tuesday");
        break;
    case 3, 4: // Comma-separated cases (Java 14+)
        System.out.println("Mid-week");
        break;
    default:
        System.out.println("Other day");
        break;
}
```

#### Supported Types for Switch Variable:
- `int` and `Integer`
- `byte` and `Byte`
- `short` and `Short`
- `char` and `Character`
- `String`
- Enum values
- Any object type (when used with Java 21 pattern matching)
- `var` (if it resolves to one of the above)
- **NOT SUPPORTED:** `boolean`, `long`, `float`, `double`.

#### Compile-Time Constants as Case Values:
Case values must be literals, enum constants, or `final` constant variables initialized with literals on the same line:
```java
final int bananas = 1;
int apples = 2;
final int cookies = getCookies(); // Evaluated at runtime

switch (items) {
    case bananas:     // ✅ Valid (compile-time constant)
    case apples:      // ❌ DOES NOT COMPILE (not final)
    case cookies:     // ❌ DOES NOT COMPILE (initialized at runtime via method)
    case 3 * 5:       // ✅ Valid (evaluates to literal 15 at compile time)
}
```

#### Case Label Syntax:
- Arrow (`->`) cases eliminate the need for `break` statements and prevent fall-through.
- Colon (`:`) cases require `break` statements. Without a `break`, the execution falls through to subsequent branches (including `default`).
- **Do not mix** `->` and `:` in the same `switch` block:
  ```java
  switch (x) {
      case 1 -> System.out.print("One");
      case 2 : System.out.print("Two"); // ❌ DOES NOT COMPILE (mixed syntax)
  }
  ```

---

### `switch` Expressions

Introduced in Java 14, `switch` expressions return a value that can be assigned or used directly.

```java
String meal = switch (food) {
    case 1 -> "Dessert";
    case 2, 3 -> "Snack";
    default -> "Porridge";
}; // Semicolon is required at the end of the assignment statement
```

#### The `yield` Keyword
Used to return a value from a `case` block inside a `switch` expression:
```java
var name = switch (fish) {
    case 1 -> "Goldfish";
    case 2 -> {
        yield "Trout"; // yield returns the value from the block
    }
    default -> "Unknown";
};
```
:::note[yield vs return]
Use `yield` to return a value from a `switch` expression block. Using `return` inside a `switch` expression will attempt to return from the enclosing method, which is a compilation error if the method returns a different type (or is void).
:::

---

### Loop Structures

#### `while` vs. `do-while`
- **`while` loop:** Evaluates the boolean condition **before** executing the loop body. If the condition starts as `false`, the body is never executed.
- **`do-while` loop:** Evaluates the boolean condition **after** executing the loop body. The body is guaranteed to run **at least once**.
```java
while (false) { } // ❌ DOES NOT COMPILE: Unreachable code detected by compiler

do {
    // Executes once
} while (false); // ✅ Compiles (condition checked after execution)
```

#### Traditional `for` Loops
A `for` loop has three sections: `for (initialization; booleanExpression; update)`.
```java
// Multiple variables in the initialization block (must share the same type)
for (int i = 0, j = 10; i < j; i++, j--) {
    System.out.println(i + " " + j);
}
```
All three parts of the `for` header are optional:
```java
for ( ; ; ) { } // Valid infinite loop (identical to while(true))
```

#### Enhanced `for-each` Loops
Used to iterate through arrays or objects implementing `java.lang.Iterable`.
```java
int[] numbers = {1, 2, 3};
for (int num : numbers) {
    num = num * 2; // Modifies the local copy 'num' only!
}
System.out.println(numbers[0]); // Prints 1 (underlying array is unmodified)
```

---

### Branching and Labeled Statements

#### `break` vs. `continue`
- `break` exits the innermost loop immediately.
- `continue` skips the remaining statements of the current iteration and jumps to the update statement or loop check.

#### Optional Labels
A **label** is an identifier followed by a colon (`:`) placed before a loop. They allow you to jump or break out of outer loops from an inner loop.
```java
OUTER_LOOP: for (int i = 0; i < 3; i++) {
    INNER_LOOP: for (int j = 0; j < 3; j++) {
        if (i == 1 && j == 1) {
            continue OUTER_LOOP; // Jumps directly to the update section of OUTER_LOOP
        }
        System.out.println(i + "," + j);
    }
}
```

---

## 🟣 Senior Deep Dive

### Flow Scoping

Flow scoping restricts a pattern variable's scope to regions where the compiler can guarantee the cast succeeded.

```java
// AND operator (&&)
if (number instanceof Integer data && data.compareTo(5) > 0) {
    // data is in scope here because the left side must be true to evaluate the right side
}

// OR operator (||)
if (number instanceof Integer data || data.compareTo(5) > 0) { // ❌ DOES NOT COMPILE
    // If number is not an Integer, data is undefined on the right side!
}
```

#### Flow Scoping with `return`
Flow scoping can extend beyond the `if` block if the execution path terminates (e.g., via `return` or `throw`):
```java
void printOnlyIntegers(Number number) {
    if (!(number instanceof Integer data)) {
        return; // Exits if not Integer
    }
    System.out.print(data.intValue()); // ✅ Compiles! data is in scope because the method didn't return
}
```

---

### Switch Pattern Matching & Guard Clauses (Java 21)

Java 21 allows switching on any object type using pattern matching, along with **guard clauses** specified by the `when` keyword.

```java
String getTrainer(Object animal) {
    return switch (animal) {
        case Integer i when i > 10 -> "Joseph"; // Guarded pattern
        case Integer i             -> "John";   // Unguarded pattern
        case String s when s.length() > 5 -> "Sarah";
        case null                  -> "No Trainer"; // Null case pattern
        default                    -> "Unknown";
    };
}
```

---

### Exhaustiveness in Switch Statements

While legacy `switch` statements did not require covering all possible paths, **switch expressions** and **pattern-matching switch statements** must be exhaustive.
```java
// Switch statement using pattern matching:
switch (obj) { // ❌ DOES NOT COMPILE if not exhaustive
    case String s -> System.out.println("String: " + s);
    // Needs default case or additional cases to cover all Object types
}
```

#### Exhaustive Enums
An enum `switch` expression is exhaustive if it covers all defined enum constants, meaning a `default` case is not required:
```java
enum Season { SPRING, SUMMER, FALL, WINTER }

String weather = switch (season) {
    case SPRING -> "Rainy";
    case SUMMER -> "Hot";
    case FALL -> "Windy";
    case WINTER -> "Cold";
}; // ✅ Exhaustive (no default needed)
```

---

### Dominance (Pattern Ordering)

The compiler evaluates cases from top to bottom. A case is **dominated** (unreachable) if a preceding case matches a broader or identical set of conditions:

```java
switch (obj) {
    case Number n  -> System.out.println("Number");
    case Integer i -> System.out.println("Int"); // ❌ DOES NOT COMPILE: Dominated by Number (Integer is a subtype)
}

// Guarded Dominance:
switch (obj) {
    case Integer i             -> System.out.println("Any Int");
    case Integer i when i > 10 -> System.out.println("Big Int"); // ❌ DOES NOT COMPILE: Unguarded case dominates guarded case
}
```

---

## 📝 Exam Quick Reference

### Rules & Restrictions Summary

| Topic | Critical Fact |
|-------|---------------|
| **Switch Types** | Integral primitives (except `long`), wrappers (except `Long`), `String`, `enum`, and objects (in pattern switch). |
| **`switch` Exhaustiveness** | All `switch` expressions, and any `switch` statement using pattern matching/sealed types, must be exhaustive. |
| **Dominance Rule** | Narrower cases (subtypes, guarded cases) must appear before broader cases (supertypes, unguarded cases). |
| **`case null`** | Java 21 supports explicit null checking in `switch`. If `null` is passed and no `case null` is present, `switch` throws `NullPointerException`. |
| **`when` Keyword** | Used for guard conditions in `switch` cases. Relies on the pattern variable. |
| **`yield` Semicolon** | A semicolon is required after a `yield` statement. |
| **Arrow vs Colon Semicolon** | `case X -> expr;` requires a semicolon. `case X -> { ... }` block does not. |
| **Labeled Loops** | Labels are followed by a colon (`:`). Unlabeled `break`/`continue` only targets the innermost loop. |
| **Constant Expressions** | In classic `switch`, case labels must be constant expressions evaluated at compile time. |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 3]
**Trap 1 — Mixed switch case styles:**
```java
switch (x) {
    case 1 -> "One";
    case 2 : yield "Two"; // ❌ DOES NOT COMPILE: Cannot mix -> and : in same switch
}
```

**Trap 2 — `switch` on `boolean`/`long`/`float`/`double`:**
```java
long val = 5L;
switch (val) { } // ❌ DOES NOT COMPILE: long is not supported
```

**Trap 3 — Unreachable loop check:**
```java
while (false) {
    System.out.println("Test"); // ❌ DOES NOT COMPILE: Compiler detects unreachable code
}
```

**Trap 4 — Comma in switch case label syntax:**
```java
switch (x) {
    case 1: 2: System.out.print("Test"); // ❌ DOES NOT COMPILE: Colon cannot separate labels (use comma)
    case 1, 2: System.out.print("Test");  // ✅ Valid
}
```

**Trap 5 — Missing semicolon in block expression assignment:**
```java
String result = switch (x) {
    default -> "Value"
}; // ❌ Missing semicolons inside and outside the switch
```

**Trap 6 — Pattern variable scope leaks:**
```java
if (!(obj instanceof String s)) {
    System.out.println(s); // ❌ DOES NOT COMPILE: s is not in scope here
}
```

**Trap 7 — Enhanced `for` on `null` reference:**
```java
List<String> list = null;
for (var item : list) {} // Throws NullPointerException at runtime (compiles fine!)
```

**Trap 8 — Dominated pattern case in switch:**
```java
switch (value) {
    case Object o -> System.out.print("Obj");
    case String s -> System.out.print("Str"); // ❌ DOES NOT COMPILE: s is dominated by Object o
}
```

**Trap 9 — Traditional `for` initialization variable type restriction:**
```java
for (int i = 0, long j = 10; i < j; i++) {} // ❌ DOES NOT COMPILE: variables in initialization block must share same type declaration
```

**Trap 10 — `yield` vs `return` inside switch expression blocks:**
```java
int val = switch(x) {
    default -> { return 5; } // ❌ DOES NOT COMPILE: cannot use return to return value from switch block
};
```
:::

### Exam Vignettes

```java
// Vignette: Complex loop label trace
int count = 0;
ROW_LOOP: for(int i=1; i<=3; i++) {
    for(int j=1; j<=3; j++) {
        if(i * j > 3) break ROW_LOOP;
        count++;
    }
}
// i=1: j=1 (1*1=1 -> count=1), j=2 (1*2=2 -> count=2), j=3 (1*3=3 -> count=3)
// i=2: j=1 (2*1=2 -> count=4), j=2 (2*2=4 -> breaks OUTER)
// Output: count = 4
```

:::tip[Spring/Senior Relevance]
- **Polymorphic request body routing:** Pattern matching `switch` makes implementing custom payload handlers in web sockets or message consumers much more readable.
- **Sealed validation records:** Combining sealed types and switch exhaustiveness ensures that all business rule validation outcomes are handled compile-safe.
:::

---

## 🔗 Review Questions Focus

1. **Exhaustiveness requirements:** Differentiate when a `switch` is required to have a `default` case.
2. **Dominance checking:** Recognize dominated pattern cases in custom object hierarchies.
3. **`yield` applicability:** Identify when `yield` is required vs. optional in switch case statements.
4. **Boolean checks in if-statements:** Spot expressions that return numbers or objects instead of actual booleans.
5. **Short-circuiting logic:** Trace variable state changes inside complex boolean loop checks.
6. **Initialization limitations:** Catch loops that declare variables of different types in the initialization block.
7. **`case null` processing:** Predict switch outputs when `null` is passed under different Java versions.
8. **Label scope behavior:** Understand where labeled `break` and `continue` jump.
9. **Pattern matching scopes:** Trace where a pattern variable is visible (flow scoping).
10. **Enhanced loop limitations:** Explain why modifications to loop variables inside for-each loops do not persist.
