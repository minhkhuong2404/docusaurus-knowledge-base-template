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

> **Key Topics:** Operator precedence, unary/binary operators, arithmetic, assignment, comparison, logical, bitwise, ternary.

---

## 🟦 New Learner: Understanding Operators

### Operator Precedence (Highest → Lowest)

The order Java evaluates operators — **memorize this table**:

| Priority | Category | Operators |
|----------|----------|-----------|
| 1 | Post-unary | `expr++`, `expr--` |
| 2 | Pre-unary | `++expr`, `--expr` |
| 3 | Other unary | `-`, `!`, `~`, `+`, `(cast)` |
| 4 | Multiplication | `*`, `/`, `%` |
| 5 | Addition | `+`, `-` |
| 6 | Shift | `<<`, `>>`, `>>>` |
| 7 | Relational | `<`, `>`, `<=`, `>=`, `instanceof` |
| 8 | Equality | `==`, `!=` |
| 9 | Logical AND | `&` |
| 10 | Logical XOR | `^` |
| 11 | Logical OR | `\|` |
| 12 | Conditional AND | `&&` |
| 13 | Conditional OR | `\|\|` |
| 14 | Ternary | `? :` |
| 15 | Assignment | `=`, `+=`, `-=`, etc. |

When in doubt, use parentheses `()` to make evaluation order explicit.

---

### Unary Operators

Operate on a **single** operand:

```java
int a = 5;
System.out.println(-a);   // -5  (negation)
System.out.println(!true); // false (logical complement)
System.out.println(~a);   // -6  (bitwise complement: ~n = -(n+1))

// Pre vs Post increment
int x = 10;
int y = x++;  // y = 10, x = 11 (post: return THEN increment)
int z = ++x;  // z = 12, x = 12 (pre: increment THEN return)
```

:::tip[Pre vs Post — Exam Favourite]
```java
int i = 3;
int j = i++ + ++i; // = 3 + 5 = 8 (i ends at 5)
// Step 1: i++ returns 3, then i becomes 4
// Step 2: ++i increments i to 5, then returns 5
// Result: 3 + 5 = 8
```
:::

---

### Binary Arithmetic Operators

```java
int a = 10, b = 3;
System.out.println(a + b);   // 13
System.out.println(a - b);   // 7
System.out.println(a * b);   // 30
System.out.println(a / b);   // 3  (integer division, truncates!)
System.out.println(a % b);   // 1  (remainder/modulo)

// Floating point division
System.out.println(10.0 / 3);  // 3.3333...
System.out.println(10 / 3.0);  // 3.3333...
```

---

### Assignment Operators

```java
int x = 10;          // simple assignment

x += 5;   // x = x + 5  → 15
x -= 3;   // x = x - 3  → 12
x *= 2;   // x = x * 2  → 24
x /= 4;   // x = x / 4  → 6
x %= 4;   // x = x % 4  → 2
```

:::caution[Compound Assignment Includes a Cast]
```java
byte b = 10;
b = b + 5;  // ❌ COMPILE ERROR: b+5 is int, can't assign to byte
b += 5;     // ✅ OK! Compound assignment automatically casts back
```
:::

---

### Equality and Relational Operators

```java
// Equality
System.out.println(5 == 5);    // true
System.out.println(5 != 6);    // true
System.out.println("a" == "a"); // true (String pool) — but don't rely on this!

// Relational
System.out.println(5 > 3);    // true
System.out.println(5 <= 5);   // true

// instanceof (pattern matching in Java 16+)
Object obj = "Hello";
if (obj instanceof String s) {       // pattern matching
    System.out.println(s.length());  // s is already cast here
}
```

---

### Logical Operators

| Operator | Name | Short-circuits? |
|----------|------|----------------|
| `&` | Logical AND | No (always evaluates both sides) |
| `\|` | Logical OR | No (always evaluates both sides) |
| `^` | Logical XOR | No |
| `&&` | Conditional AND | Yes (stops if left is false) |
| `\|\|` | Conditional OR | Yes (stops if left is true) |
| `!` | Negation | — |

```java
// Short-circuit example
int x = 5;
boolean result = (x > 3) || (++x > 0); // x never incremented: ||  short-circuits
System.out.println(x); // still 5!

boolean result2 = (x > 3) | (++x > 0); // | does NOT short-circuit
System.out.println(x); // now 6
```

---

### Ternary Operator

A compact if-else expression:

```java
int score = 85;
String grade = (score >= 90) ? "A" : (score >= 80) ? "B" : "C";
System.out.println(grade); // B
```

Both branches must be **type-compatible** with the expected result.

---

## 🟣 Senior Deep Dive

### Bitwise Operators — Under the Hood

```java
int a = 0b1010; // 10 in binary
int b = 0b1100; // 12 in binary

System.out.println(a & b);  // 0b1000 = 8  (AND: both bits must be 1)
System.out.println(a | b);  // 0b1110 = 14 (OR: either bit is 1)
System.out.println(a ^ b);  // 0b0110 = 6  (XOR: bits must differ)
System.out.println(~a);     // -11 (all bits flipped: two's complement)
```

### Bit Shift Operators

```java
int x = 8; // 0b00001000

System.out.println(x << 1);  // 16  (shift left = multiply by 2)
System.out.println(x >> 1);  // 4   (signed right shift = divide by 2)
System.out.println(x >>> 1); // 4   (unsigned right shift — fills with 0s)

// Difference matters for negatives:
int neg = -8;
System.out.println(neg >> 1);  // -4  (sign bit preserved)
System.out.println(neg >>> 1); // 2147483644 (sign bit becomes 0)
```

### Numeric Promotion in Expressions

Java promotes operands before performing arithmetic:

1. If either operand is `double` → both promoted to `double`
2. If either operand is `float` → both promoted to `float`
3. If either operand is `long` → both promoted to `long`
4. Otherwise → both promoted to `int`

```java
byte b1 = 5, b2 = 10;
var result = b1 + b2; // result is int, not byte!
byte sum = (byte)(b1 + b2); // explicit cast required

char c = 'A';        // char has numeric value 65
int x = c + 1;       // 66 (char promoted to int)
char next = (char)(c + 1); // 'B'
```

### Operator Overloading Edge Case: `+` with Strings

```java
System.out.println("Value: " + 1 + 2);   // "Value: 12" (left to right!)
System.out.println("Value: " + (1 + 2)); // "Value: 3"  (parentheses first)
System.out.println(1 + 2 + " is sum");   // "3 is sum"  (int math first)
```

### Overflow and Underflow

Java wraps around silently for integer types:

```java
int max = Integer.MAX_VALUE; // 2,147,483,647
System.out.println(max + 1); // -2,147,483,648 (overflow — wraps to MIN_VALUE)

// Double has special values:
System.out.println(1.0 / 0.0);   // Infinity
System.out.println(-1.0 / 0.0);  // -Infinity
System.out.println(0.0 / 0.0);   // NaN (Not a Number)
System.out.println(Double.isNaN(0.0 / 0.0)); // true
```

### Compound Assignment — Casting Behavior in Detail

```java
long x = 10L;
int i = 5;
i += x;  // ✅ compiles — compound assignment casts long → int automatically
i = i + x; // ❌ compile error — explicit cast needed: i = (int)(i + x);
```

This is a very common exam trap!

### Short-Circuit Evaluation and Side Effects

```java
int counter = 0;

// && short-circuits: second expression only runs if first is true
boolean a = (counter++ > 5) && (counter++ > 5);
System.out.println(counter); // 1 (only left side ran)

counter = 0;
// || short-circuits: second expression only runs if first is false
boolean b = (counter++ < 5) || (counter++ < 5);
System.out.println(counter); // 1 (only left side ran, and it was true)
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| Integer division | Truncates toward zero: `7/2 = 3`, `-7/2 = -3` |
| `%` with negatives | Result takes sign of left operand: `-7 % 2 = -1` |
| `++` post-increment | Returns original value, then increments |
| `&&` short-circuit | Second operand skipped if first is `false` |
| `\|\|` short-circuit | Second operand skipped if first is `true` |
| Compound `+=` | Implicit cast included — safer than explicit `+` |
| `~` bitwise NOT | `~n` equals `-(n+1)` |
| Overflow | Wraps around silently — no exception! |
| `NaN` | Result of `0.0/0.0`; `NaN != NaN` is always `true` |
| Promotion rule | `byte`+`byte` → `int`; must cast back to assign to `byte` |
| `>>>` vs `>>` | `>>>` fills with 0 (unsigned); `>>` preserves sign bit |
| String + number | Left-to-right: `"a" + 1 + 2 = "a12"` but `1 + 2 + "a" = "3a"` |
| `equals` on mixed types | `Integer` vs `Long` with same numeric value → `false` (different types) |
| `instanceof` null | `null instanceof AnyType` → always `false` |
| Assignment operators | `=` lowest precedence; expression value is assigned value |
| `switch` on enum | `case RED:` uses simple constant name (not `Color.RED` in label) |
| `break` in nested loops | Without label, breaks innermost `switch` or loop only |
| Floating-point infinity | `Double.POSITIVE_INFINITY`, `1.0/0.0` → `Infinity` for double |
| `strictfp` | Rare on exam — floating-point semantics consistent across platforms |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 2]
**Trap 1 — Post vs pre in a complex expression:**
```java
int a = 5;
int b = a-- - --a;
// a-- → returns 5, a becomes 4
// --a → a becomes 3, returns 3
// b = 5 - 3 = 2, a = 3
System.out.println(a + " " + b); // 3 2
```

**Trap 2 — Division with mixed types:**
```java
int a = 5, b = 2;
double result = a / b;       // 2.0! int division first, then widened
double result2 = (double)a / b; // 2.5 ✅ cast before operation
double result3 = a / (double)b; // 2.5 ✅ also fine
```

**Trap 3 — Compound assignment with incompatible types:**
```java
long x = 10;
int i = 5;
i += x;          // ✅ compound includes implicit (int) cast
i = i + x;       // ❌ COMPILE ERROR: long cannot be assigned to int
i = (int)(i + x); // ✅ explicit cast
```

**Trap 4 — `NaN` comparisons:**
```java
double nan = Double.NaN;
System.out.println(nan == nan); // false!
System.out.println(nan != nan); // true!
System.out.println(Double.isNaN(nan)); // true ✅ correct way to check
```

**Trap 5 — Ternary type coercion:**
```java
int i = 1;
System.out.println(true ? i : 3.14); // prints 1.0 (int promoted to double!)
// Both branches must be compatible — Java uses widest common type
```

**Trap 6 — `&` vs `&&` with side effects:**
```java
int x = 0;
if (false & (++x > 0)) { }   // x becomes 1 (& always evaluates both)
if (false && (++x > 0)) { }  // x stays 1 (&& short-circuits)
System.out.println(x); // 1
```

**Trap 7 — Modulo with floating point:**
```java
System.out.println(5 % 3);     // 2 (int)
System.out.println(5.5 % 3.0); // 2.5 (double — modulo works on floats too!)
System.out.println(-7 % 3);    // -1 (sign follows left operand)
System.out.println(7 % -3);    // 1  (sign follows left operand)
```

**Trap 8 — `==` on `Integer` outside cache:**
```java
Integer a = 200, b = 200;
System.out.println(a == b); // false — not cached; use equals()
```

**Trap 9 — String concatenation in loop (performance vs exam):**
```java
String s = "";
for (int i = 0; i < 3; i++) s += i; // creates many intermediate Strings — exam may ask about immutability cost
```

**Trap 10 — Unary `+` on `char`:**
```java
char c = 'A';
System.out.println(+c); // 65 — promoted to int
```
:::

### Exam vignettes

```java
// Vignette — evaluation order
int i = 0;
System.out.println(i++ + ++i + i); // careful: 0 + 2 + 2 = 4? trace: i++ ->0 i=1, ++i ->2 i=2, +i ->2 → 0+2+2=4
```

:::tip[Spring/Senior Relevance]
- Bitwise operators appear in Spring Security's permission masks (`hasPermission(obj, 0b0001 | 0b0100)`) and in JPA's `@Column(columnDefinition)` bitmask patterns.
- Short-circuit evaluation is critical in Spring Expression Language (SpEL): `#{bean.field != null && bean.field.isEmpty()}` — the null check guards the method call.
- Overflow behavior matters in distributed ID generation (Twitter Snowflake-style IDs use bit shifts heavily): `(timestamp << 22) | (datacenterId << 17) | sequenceId`.
:::

---

## 🔗 Review Questions Focus

1. What is the result of `int x = 5; int y = x++ + ++x;`?
2. Why does `byte b = 10; b = b + 1;` fail but `b += 1;` succeeds?
3. Given `(false && methodA()) || methodB()`, which methods are called?
4. What is the output of `System.out.println(1 + 2 + "3")`?
5. What does `~5` evaluate to?
6. What is `-7 % 2`?
7. What is the difference between `>>` and `>>>`?
8. What type does a ternary expression `(true ? 1 : 2.0)` produce?
9. What happens when `int` overflows?
10. Why is `NaN != NaN` always `true`?
