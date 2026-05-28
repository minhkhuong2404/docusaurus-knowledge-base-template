---
id: chapter-02
title: "Chapter 2 — Operators"
sidebar_label: "Ch 2 · Operators"
description: "Deep dive into Java operator precedence, arithmetic, logical, bitwise, compound assignment, and ternary operators — including the classic pre/post-increment traps on the OCP exam."
tags:
  - operators
  - precedence
  - increment
  - decrement
  - bitwise
  - short-circuit
  - ternary
  - compound-assignment
---

# Chapter 2 — Operators

<span class="chapter-badge">Exam Domain: Handling Date, Time, Text, Numeric and Boolean Values</span>

> **Key Topics:** Java operator terminology, operator precedence, unary operators (negation, complement, pre/post-increment/decrement), binary arithmetic operators, division and modulus math, numeric promotion rules, assignment operators (simple vs. compound), casting (widening vs. narrowing, overflow/underflow), equality operators, relational operators, `instanceof` (compatible vs. incompatible types, `null` checks), logical vs. bitwise operators, conditional (short-circuit) operators, ternary operator, unperformed side effects.

---

## 🟦 New Learner: Understanding Operators

### Operator Terminology & Types

A Java **operator** is a special symbol applied to a set of variables, values, or literals (known as **operands**) that returns a **result**.
- **Unary Operators:** Take exactly one operand (e.g., `-x`, `!y`).
- **Binary Operators:** Take two operands (e.g., `a + b`, `x * y`). Most operators in Java are binary.
- **Ternary Operators:** Take three operands (specifically `? :`).

---

### Operator Precedence (Highest → Lowest)

Java evaluates expressions based on **operator precedence** rather than strict left-to-right order. Operators on the same level are evaluated from left to right (except assignment and ternary operators, which evaluate right to left).

| Precedence | Category | Operators | Association |
|------------|----------|-----------|-------------|
| 1 | Post-unary | `expr++`, `expr--` | Left-to-right |
| 2 | Pre-unary | `++expr`, `--expr` | Left-to-right |
| 3 | Other unary | `-`, `!`, `~`, `+`, `(cast)` | Right-to-left |
| 4 | Multiplication / Division / Modulus | `*`, `/`, `%` | Left-to-right |
| 5 | Addition / Subtraction | `+`, `-` | Left-to-right |
| 6 | Shift | `<<`, `>>`, `>>>` | Left-to-right |
| 7 | Relational | `<`, `>`, `<=`, `>=`, `instanceof` | Left-to-right |
| 8 | Equality | `==`, `!=` | Left-to-right |
| 9 | Logical AND | `&` | Left-to-right |
| 10 | Logical XOR | `^` | Left-to-right |
| 11 | Logical OR | `\|` | Left-to-right |
| 12 | Conditional AND | `&&` | Left-to-right |
| 13 | Conditional OR | `\|\|` | Left-to-right |
| 14 | Ternary | `? :` | Right-to-left |
| 15 | Assignment | `=`, `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `^=`, `\|=`, `<<=`, `>>=`, `>>>=` | Right-to-left |
| 16 | Arrow | `->` | Right-to-left |

:::tip[Precedence Trick]
```java
int cookies = 4;
double reward = 3 + 2 * --cookies;
// Evaluated as:
// 1. Decrement cookies: --cookies -> cookies becomes 3, returns 3
// 2. Multiply: 2 * 3 -> 6
// 3. Add: 3 + 6 -> 9
// 4. Assign and promote: reward = 9.0 (cookies = 3)
```
:::

---

### Unary Operators

#### Logical Complement (`!`)
Applied only to `boolean` values. Flips `true` to `false` and vice versa.
```java
boolean isAsleep = false;
isAsleep = !isAsleep; // true
```

#### Bitwise Complement (`~`)
Applied to integral numeric types. It flips all `0`s and `1`s in the binary representation of the number. The shortcut value is: `~n = -n - 1` (or `~n = -(n + 1)`).
```java
int val = 70;
System.out.println(~val); // -71
```

#### Negation (`-`)
Reverses the sign of a numeric value.
```java
double temp = 1.21;
temp = -temp; // -1.21
temp = -(-temp); // 1.21
```

:::danger[Type Mismatches Compile Error]
You cannot apply negation (`-`) or bitwise complement (`~`) to a `boolean`, nor a logical complement (`!`) to a number.
```java
int p = !5;        // ❌ DOES NOT COMPILE
boolean b1 = -true; // ❌ DOES NOT COMPILE
boolean b2 = ~true; // ❌ DOES NOT COMPILE
boolean b3 = !0;    // ❌ DOES NOT COMPILE (Unlike C/C++, 0 is NOT boolean false)
```
:::

#### Increment and Decrement (`++`, `--`)
- **Pre-increment/decrement (`++x`, `--x`):** Modifies the variable value first, then returns the new value.
- **Post-increment/decrement (`x++`, `x--`):** Returns the original variable value first, then modifies the variable.
```java
int count = 0;
System.out.println(++count); // prints 1 (count is 1)
System.out.println(count--); // prints 1 (count becomes 0)
System.out.println(count);   // prints 0
```

---

### Binary Arithmetic Operators

Operate on two numeric values.

```java
int a = 10, b = 3;
System.out.println(a / b); // 3 (integer division discards remainder, floor value)
System.out.println(a % b); // 1 (modulus/remainder)
```

#### Modulus with Negative Numbers
When calculating `x % y`, the sign of the divisor `y` is ignored. The sign of the result matches the sign of the dividend `x` (the left operand):
```java
System.out.println(7 % 5);    // 2
System.out.println(7 % -5);   // 2
System.out.println(-7 % 5);   // -2
System.out.println(-7 % -5);  // -2
```

#### Parentheses Syntax
Parentheses can override default operator precedence. They must always be balanced. Java does not allow brackets `[]` or braces `{}` for grouping mathematical operations:
```java
long p = 1 + ((3 * 5) / 3;     // ❌ DOES NOT COMPILE (unbalanced)
short r = 3 + [(4 * 2) + 4];   // ❌ DOES NOT COMPILE (invalid bracket syntax)
```

---

### Primitive Numeric Promotion Rules

Before performing binary operations, Java automatically promotes operand data types according to these rules:

1. **Widening:** If two operands have different types, Java promotes the smaller type to the larger type.
2. **Float / Double Promotion:** If one operand is integral and the other is a floating-point, Java promotes the integral to the floating-point type.
3. **Unary Promotion:** Smaller integral types (`byte`, `short`, `char`) are promoted to `int` **any time** they are used with a binary arithmetic operator, even if neither operand is an `int`.
4. **Result Type:** The resulting value has the same data type as the promoted operands.

```java
short x = 10;
short y = 3;
short z = x * y; // ❌ DOES NOT COMPILE: x * y is promoted to int, cannot assign to short directly!
short zCorrected = (short)(x * y); // ✅ Valid with explicit cast
```

---

### Assigning Values & Casting

#### Widening vs. Narrowing
Java automatically wide-casts values (smaller to larger). Narrowing casts (larger to smaller) require explicit casting:
```java
int fish = (int)1.0;          // double -> int (truncates decimals)
short bird = (short)1921222;  // Stored as 20678 (overflow)
```
Literals that exceed their type's range compile only with explicit definitions:
```java
long reptile = 192301398193810323;  // ❌ DOES NOT COMPILE: literal is treated as int first
long reptile2 = 192301398193810323L; // ✅ Valid
```

#### Compound Assignment Operators (`+=`, `-=`, `*=`, `/=`)
Compound assignment operators automatically apply an **implicit cast** to the type of the left-hand variable:
```java
long goat = 10;
int sheep = 5;
sheep = sheep * goat; // ❌ DOES NOT COMPILE (int = int * long produces long)
sheep *= goat;        // ✅ Compiles! Evaluated as sheep = (int)(sheep * goat)
```

#### Assignment Return Values
An assignment expression returns the value assigned:
```java
long wolf = 5;
long coyote = (wolf = 3); // Sets wolf to 3 AND returns 3
System.out.println(wolf);   // 3
System.out.println(coyote); // 3
```

---

### Comparing Values

#### Equality Operators (`==`, `!=`)
- Used on numeric primitives, `boolean` values, and object references.
- Cannot compare incompatible types.
```java
boolean monkey = true == 3;       // ❌ DOES NOT COMPILE
boolean ape = false != "Grape";   // ❌ DOES NOT COMPILE
```
- For object references, `==` returns `true` **only** if they point to the exact same object in memory, or if both are `null`:
```java
var f1 = new File("list.txt");
var f2 = new File("list.txt");
System.out.println(f1 == f2);     // false (distinct objects)
System.out.println(null == null); // true
```

#### Relational Operators (`<`, `>`, `<=`, `>=`)
Compare numeric values and automatically promote mixed types.

#### `instanceof` Operator
Determines whether an object reference is an instance of a specific class or interface at runtime:
```java
Integer time = 9;
System.out.println(time instanceof Number); // true
```

##### `instanceof` Traps:
1. **Incompatible Types:** If the compiler determines that a reference variable cannot possibly be cast to the specified class, it triggers a compilation error:
   ```java
   Number n = 10;
   if (n instanceof String) { } // ❌ DOES NOT COMPILE
   ```
2. **`null` Check:** Evaluating `instanceof` with a `null` literal or variable pointing to `null` always returns `false` without throwing an exception:
   ```java
   System.out.println(null instanceof Object); // false
   ```

---

### Logical and Conditional Operators

#### Logical Operators (`&`, `|`, `^`)
Evaluate **both** sides of the expression regardless of the result on the left.
- `&` (Logical AND): `true` only if both are `true`.
- `|` (Logical OR): `false` only if both are `false`.
- `^` (Logical XOR): `true` if operands are different.

#### Conditional (Short-Circuit) Operators (`&&`, `||`)
Skip evaluation of the right-hand operand if the left-hand operand already determines the result.
- `&&`: If left is `false`, the expression is `false` (right side is skipped).
- `||`: If left is `true`, the expression is `true` (right side is skipped).

```java
// Preventing NullPointerException:
if (duck != null && duck.getAge() < 5) { } // Safe; does not call getAge() if duck is null
```

:::danger[Unperformed Side Effects Trap]
Avoid modifying variables on the right-hand side of short-circuit operators:
```java
int rabbit = 6;
boolean bunny = (rabbit >= 6) || (++rabbit <= 7);
System.out.println(rabbit); // prints 6 (right side never evaluated!)
```
:::

---

### Ternary Operator (`? :`)

Format: `booleanExpression ? expression1 : expression2`

- Only one of `expression1` or `expression2` is executed at runtime (unperformed side effects apply).
```java
int sheep = 1;
int zzz = 1;
int sleep = zzz < 10 ? sheep++ : zzz++;
System.out.println(sheep + "," + zzz); // 2,1 (zzz++ was not evaluated)
```

- If assigned to a variable, both return expressions must be compatible with that variable:
```java
int stripes = 7;
System.out.println(stripes > 5 ? 21 : "Zebra"); // ✅ Compiles (System.out.print handles Object)
int animal = stripes < 9 ? 3 : "Horse";        // ❌ DOES NOT COMPILE (String cannot be cast to int)
```

---

## 🟣 Senior Deep Dive

### Bitwise Operators — Under the Hood

When applied to numeric operands, `&`, `|`, and `^` behave as bitwise operators, performing calculations at the bit level.

```
  70 in binary:  0 1 0 0 0 1 1 0
 ~70 in binary:  1 0 1 1 1 0 0 1  (-71 in two's complement)
 --------------------------------
  Bitwise AND:   0 0 0 0 0 0 0 0  (70 & ~70 = 0)
  Bitwise OR:    1 1 1 1 1 1 1 1  (70 | ~70 = -1)
  Bitwise XOR:   1 1 1 1 1 1 1 1  (70 ^ ~70 = -1)
```

```java
int num = 70;
int negated = ~num; // -71
System.out.println(num & negated); // 0
System.out.println(num | negated); // -1
System.out.println(num ^ negated); // -1
```

---

### Bit Shift Operators

Used to shift bits of a number left or right.

- **`<<` (Signed Left Shift):** Shifts bits left, filling empty spaces on the right with `0`. Equivalent to multiplying by $2^{\text{shift}}$.
- **`>>` (Signed Right Shift):** Shifts bits right, filling empty spaces on the left with the sign bit (preserves negative/positive sign). Equivalent to floor-dividing by $2^{\text{shift}}$.
- **`>>>` (Unsigned Right Shift):** Shifts bits right, filling empty spaces on the left with `0` regardless of the sign bit.

```java
int neg = -8;
System.out.println(neg >> 1);  // -4
System.out.println(neg >>> 1); // 2147483644 (Sign bit 1 shifted to 0, producing a large positive number)
```

---

### Double Division Edge Cases

Unlike integer division, division on floating-point types (`double`/`float`) does not throw `ArithmeticException` on division by zero:
- `1.0 / 0.0` yields `Double.POSITIVE_INFINITY`.
- `-1.0 / 0.0` yields `Double.NEGATIVE_INFINITY`.
- `0.0 / 0.0` yields `Double.NaN` (Not a Number).

:::warning[NaN Rule]
`NaN` is not equal to any value, including itself.
```java
double val = Double.NaN;
System.out.println(val == val); // false!
System.out.println(Double.isNaN(val)); // true (use this to check)
```
:::

---

## 📝 Exam Quick Reference

### Rules & Restrictions Summary

| Topic | Critical Fact |
|-------|---------------|
| **Operator Precedence** | Post-unary > Pre-unary > Cast > Multiplicative > Additive > Relational > Equality > Logical > Conditional > Ternary > Assignment. |
| **Numeric Promotion** | Promotes smaller values to larger ones. `byte`/`short`/`char` always promote to `int` in binary arithmetic. |
| **Modulus Result Sign** | The sign of the result of `a % b` always matches the sign of `a`. |
| **`instanceof` Compatibility** | Fails to compile if the reference variable type cannot be cast to the compared type. |
| **`instanceof` with `null`** | `null instanceof AnyType` returns `false` (never throws an exception). |
| **Short-Circuit Side Effects** | If the left side of `&&` is `false` or `||` is `true`, the right side is skipped entirely. |
| **Compound Cast** | `x += y` is equivalent to `x = (typeOfX)(x + y)`. |
| **Bitwise Negation** | `~n` is equivalent to `-n - 1`. |
| **Cache Comparison** | Comparing wrapper objects using `==` works for `-128` to `127` due to caching, but fails outside this range. |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 2]
**Trap 1 — Compound assignment with variable promotion:**
```java
byte x = 5;
x = x + 2;  // ❌ DOES NOT COMPILE (x + 2 yields int)
x += 2;     // ✅ Compiles (implicit cast)
```

**Trap 2 — Post-increment assignment:**
```java
int a = 5;
a = a++;
System.out.println(a); // prints 5 (not 6! The original value is assigned back)
```

**Trap 3 — Unary cast precedence:**
```java
short mouse = 10;
short hamster = 3;
short capybara = (short)mouse * hamster; // ❌ DOES NOT COMPILE
// Cast is applied to mouse only; the expression evaluates as ((short)mouse) * hamster, which yields an int!
// Correct: (short)(mouse * hamster)
```

**Trap 4 — Logical `&` vs. Conditional `&&`:**
Check whether the variable on the right-hand side has been modified.
```java
int x = 10;
if (x > 20 && ++x > 0) {} // x remains 10 (&& short-circuits)
if (x > 20 & ++x > 0) {}  // x becomes 11 (& executes both sides)
```

**Trap 5 — Literal boundaries and overflow:**
```java
int val = Integer.MAX_VALUE + 1; // Wraps around to Integer.MIN_VALUE (-2147483648)
```

**Trap 6 — Ternary operator return assignment:**
```java
int price = 10;
String type = price > 5 ? 20 : "Zebra"; // ❌ DOES NOT COMPILE: Cannot assign int/String to String
```

**Trap 7 — Operator precedence with division:**
```java
int a = 2 * 5 / 3; // Evaluates left-to-right: (2 * 5) / 3 = 10 / 3 = 3
```

**Trap 8 — Comparing float and double literals:**
```java
float f = 2.1f;
double d = 2.1;
System.out.println(f == d); // false (loss of precision in float conversion)
```

**Trap 9 — `instanceof` with primitives:**
```java
int a = 5;
if (a instanceof Integer) {} // ❌ DOES NOT COMPILE: instanceof requires an object reference
```

**Trap 10 — Assignment inside boolean checks:**
```java
boolean flag = false;
if (flag = true) {
    System.out.println("True!"); // prints "True!" because flag is assigned true, returning true
}
```
:::

### Exam Vignettes

```java
// Vignette: Complex pre/post increment
int x = 2;
int y = 3 * x++ + ++x;
// 1. 3 * x++: returns 3 * 2 = 6. (x becomes 3)
// 2. ++x: increments x to 4, returns 4.
// 3. y = 6 + 4 = 10. (x is now 4)
```

:::tip[Spring/Senior Relevance]
- **Ternary guards in configs:** Often used in Spring `@Value` annotations or environment configs to fallback on defaults, e.g., `String port = env.getProperty("port") != null ? env.getProperty("port") : "8080";`
- **Short-circuiting in Spring filters:** In security/interceptors, checks like `request != null && checkAuth(request)` guard against `NullPointerException` during filter chains.
:::

---

## 🔗 Review Questions Focus

1. **Arithmetic promotions:** Understand why `apples + oranges` promotes to `int` when both are smaller types.
2. **Short-circuit values:** Be able to trace exact changes to variables in logical expressions (such as unperformed side effects).
3. **Compound operator casts:** Spot why `goat -= 1.0` works for a `long` variable without explicit casts.
4. **Ternary assignments:** Know how type compatibility rules affect variable assignments in conditional expressions.
5. **Relational compiler errors:** Identify why comparing incompatible object types with `instanceof` triggers a compiler failure.
6. **Bitwise calculations:** Master `~x`, `x & y`, `x | y`, and `x ^ y` on small numbers.
7. **Modulus equations:** Work out modulus with negative variables (e.g., `-7 % 5` vs. `7 % -5`).
8. **Balanced expressions:** Verify parentheses and brackets syntax correctness.
9. **String concatenation ordering:** Evaluate `1 + 2 + "3"` vs. `"3" + 1 + 2`.
10. **Wrapper caching checks:** Spot `==` outside the `[-128, 127]` range.
