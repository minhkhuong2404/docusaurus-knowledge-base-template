---
sidebar_position: 18
title: "Chapter 17: Smells and Heuristics"
description: A comprehensive catalog of code smells and heuristics for identifying and fixing bad code.
---

# Chapter 17: Smells and Heuristics

## The Reference Catalog

This final chapter is the most comprehensive in the book — a catalog of code smells (signs that something is wrong) and heuristics (rules of thumb for making it better). It's meant as a reference to consult when reviewing or refactoring code.

The smells and heuristics are grouped by category.

---

## Comments

### C1: Inappropriate Information
Comments should hold only information relevant to the code. Don't use comments for metadata that belongs in version control (change history, author info). Don't explain business decisions that belong in a wiki or ticket system.

### C2: Obsolete Comment
A comment that has drifted out of sync with the code it describes. If you can't update it, delete it. Stale comments are worse than no comments.

### C3: Redundant Comment
A comment that describes exactly what the code already says. Noise. Delete it.
```java
// Redundant
i++; // increment i
```

### C4: Poorly Written Comment
If a comment is worth writing, write it well. Use correct grammar and spelling. Be brief and precise. Don't ramble.

### C5: Commented-Out Code
Delete it immediately. Source control preserves history. Commented-out code accumulates, rots, and confuses readers who wonder if it's important.

---

## Environment

### E1: Build Requires More Than One Step
You should be able to build the entire project with a single command. Build scripts that require multiple manual steps are fragile and error-prone.
```bash
# Goal: one command builds everything
mvn clean install
```

### E2: Tests Require More Than One Step
Running all the tests should also be a single command. If running tests requires navigating menus, clicking buttons, or running multiple commands, developers will run them less often.

---

## Functions

### F1: Too Many Arguments
Functions should have few arguments. Zero is ideal. One or two are fine. Three is borderline. More than three requires a very strong justification. Consider wrapping related arguments in a parameter object.

### F2: Output Arguments
Arguments that are modified by a function are confusing. Prefer returning a value over modifying an argument.
```java
// Confusing — is s being filled? Cleared? Appended to?
appendFooter(s);

// Clear
s = appendFooter(s);
// or: s.appendFooter();
```

### F3: Flag Arguments
Passing a `boolean` to a function declares that the function does two things. Split it into two functions.
```java
// Bad
render(true);  // what does true mean?

// Good
renderForSuite();
renderForSingleTest();
```

### F4: Dead Function
Methods that are never called should be deleted. Don't fear deletion — source control is your safety net.

---

## General

### G1: Multiple Languages in One Source File
Source files should contain one language. A Java file with embedded XML, HTML, or SQL strings (especially if long) is hard to read and maintain.

### G2: Obvious Behavior Is Unimplemented
Following the "Principle of Least Surprise" — a function named `getDayOfWeek(Day.MONDAY)` should obviously return `DayOfWeek.MONDAY`. If the obvious behavior isn't implemented, readers lose trust and must study every detail.

### G3: Incorrect Behavior at the Boundaries
Don't rely on intuition for edge cases. Write a test for every boundary condition. Algorithms that work in the normal case often fail at min/max values, empty collections, null inputs, or first/last elements.

### G4: Overridden Safeties
Don't override safety mechanisms:
- Don't turn off failing tests
- Don't suppress compiler warnings
- Don't ignore exception handling

```java
// Bad — silently ignoring an exception
try {
    riskyOperation();
} catch (Exception e) {
    // TODO: handle this
}
```

### G5: Duplication
Every time you see duplicated code, extract it. DRY (Don't Repeat Yourself) is one of the most important principles in software. Common duplication patterns:
- Identical code blocks (extract to method)
- Similar algorithms with minor variations (Template Method pattern)
- Switch/if chains that appear multiple times (polymorphism)

### G6: Code at Wrong Level of Abstraction
High-level concepts and low-level details should not be mixed in the same class or function.
```java
// Mixed levels
public interface Stack {
    void push(Object o);
    Object pop();
    double percentFull(); // implementation detail leaked into abstract interface
}
```

### G7: Base Classes Depending on Their Derivatives
Base classes should not know about their derived classes. If a parent class imports or references a subclass, something is very wrong with the design.

### G8: Too Much Information
Well-defined interfaces are small. A class or module with a huge public API is hard to understand and creates tight coupling. Expose the minimum necessary. Hide everything else.

### G9: Dead Code
Code that is never executed should be deleted: unreachable branches, uncalled utility functions, unused variables and parameters.

### G10: Vertical Separation
Variables and functions should be defined close to where they are used. Local variables should be declared just above their first use. Private functions should appear just below their first use.

### G11: Inconsistency
If you do something a certain way, do all similar things the same way. `getUser()` in one place and `fetchCustomer()` in another for the same kind of operation is confusing.

### G12: Clutter
Files with unused variables, functions that are never called, comments that add no information — all of this is clutter. Keep the codebase clean.

### G13: Artificial Coupling
Things that don't depend on each other should not be forced together. Don't put a general-purpose enum inside a specific class if it has broader use.

### G14: Feature Envy
A method that spends most of its time manipulating the data of *another* class probably belongs in that other class (see: Law of Demeter).
```java
// Feature envy — HourlyPayCalculator is doing Report's job
public class HourlyPayCalculator {
    public Money calculateWeeklyPay(HourlyEmployee e) {
        int tenthRate = e.getTenthRate().getPennies(); // reaches into HourlyEmployee
        int tenthsWorked = e.getTenthsWorked();
        // ...
    }
}
```

### G15: Selector Arguments
Selector arguments (boolean flags, enums, integers that select behavior) are generally a sign that a function should be split:
```java
// Bad
public int calculatePay(boolean overtime) { ... }

// Good
public int calculateRegularPay() { ... }
public int calculateOvertimePay() { ... }
```

### G16: Obscured Intent
Code should reveal its intent. Magic numbers, cryptic names, and clever tricks obscure intent. Always prefer clarity.

### G17: Misplaced Responsibility
Code should be placed where the reader expects to find it. `Math.PI` belongs in `Math`, not in `Geometry` or `Circle`.

### G18: Inappropriate Static
Static methods are fine for pure functions that don't operate on any particular instance. But if a method could reasonably be polymorphic — if you might want to override it in a subclass — it should not be static.

### G19: Use Explanatory Variables
Break up calculations with well-named intermediate variables:
```java
// Hard to parse
if (line.split(",")[3].trim().equals("")) { ... }

// Clear
String city = line.split(",")[3].trim();
if (city.isEmpty()) { ... }
```

### G20: Function Names Should Say What They Do
```java
// What does add mean here? Addition? Append? Create?
Date newDate = date.add(5);

// Much clearer
Date newDate = date.addDaysTo(5);
Date newDate = date.increaseByDays(5);
```

### G21: Understand the Algorithm
Before you declare a function done, make sure you actually understand it — not just that the tests pass. "The tests pass but I'm not sure why" is a dangerous state.

### G22: Make Logical Dependencies Physical
If a module depends on another, that dependency should be explicit (through method calls, constructor injection, etc.) — not implicit (via global state or assumed order of initialization).

### G23: Prefer Polymorphism to If/Else or Switch/Case
When a switch or if-else chains on type, prefer polymorphism. The exception: if a switch/if chain appears only once and is never duplicated, it may be acceptable.

### G24: Follow Standard Conventions
Use the standard Java conventions: class names as nouns, method names as verbs, constants in ALL_CAPS, etc. Don't invent your own naming conventions.

### G25: Replace Magic Numbers with Named Constants
```java
// Magic number
if (employees.size() > 25) { ... }

// Named constant
if (employees.size() > MAX_EMPLOYEES_PER_TEAM) { ... }
```

### G26: Be Precise
When you make a decision in code, make it precisely. "Almost correct" is not correct.
- Don't use `float` when you need `BigDecimal` for money
- Don't assume a `List` when your algorithm requires ordered unique values (use `SortedSet`)
- Don't assume only one match when there could be multiple

### G27: Structure Over Convention
Design decisions enforced by structure are better than those enforced by convention. Use abstract base classes to force implementation — don't rely on naming conventions that could be ignored.

### G28: Encapsulate Conditionals
Extract complex conditionals into named methods:
```java
// Before
if (timer.hasExpired() && !timer.isRecurrent()) { ... }

// After
if (shouldBeDeleted(timer)) { ... }
```

### G29: Avoid Negative Conditionals
Positive conditionals are easier to read:
```java
// Negative — requires mental negation
if (!buffer.shouldNotCompact()) { ... }

// Positive
if (buffer.shouldCompact()) { ... }
```

### G30: Functions Should Do One Thing
If a function does more than one thing, extract it into multiple functions.

### G31: Hidden Temporal Couplings
When functions must be called in a certain order, make that order explicit:
```java
// Bad — implicit order dependency
dive();
checkForObstacles();
// ... must be called in this order but nothing enforces it

// Good — explicit via return value threading
Oxygen oxygen = dive();
UnderwaterMap map = checkForObstacles(oxygen); // takes previous result
```

### G32: Don't Be Arbitrary
Every structural decision in code should have a reason. If you can't articulate why you made a choice, reconsider it.

### G33: Encapsulate Boundary Conditions
Boundary conditions are tricky. Encapsulate them so they appear in one place:
```java
// Before — +1 scattered everywhere
if (level + 1 < tags.length) { ... }
nextLevel = level + 1;
subList = list.subList(level + 1, list.size());

// After — encapsulated
int nextLevel = level + 1;
if (nextLevel < tags.length) { ... }
subList = list.subList(nextLevel, list.size());
```

### G34: Functions Should Descend Only One Level of Abstraction
Each function should be one level of abstraction below its name, and should contain statements at the same level of abstraction.

### G35: Keep Configurable Data at High Levels
Constants and configuration values that define default behaviors should be at the top of the call hierarchy — easy to find and change.

### G36: Avoid Transitive Navigation (Law of Demeter)
A module should not reach through one object to get to another:
```java
// Bad — transitive navigation (train wreck)
a.getB().getC().doSomething();

// Good — each object talks only to its immediate neighbors
a.doSomething(); // a internally delegates to b and c as needed
```

---

## Java-Specific Smells

### J1: Avoid Long Import Lists with Wildcards
Use specific imports:
```java
// Unclear — what's being imported from java.util?
import java.util.*;

// Clear
import java.util.List;
import java.util.Map;
import java.util.HashMap;
```

### J2: Don't Inherit Constants
Don't implement an interface just to access its constants (the Constant Interface Antipattern). Use `import static` instead.
```java
// Bad — inheriting just to get constants
class Foo implements Constants { ... }

// Good
import static com.example.Constants.MAX_SIZE;
```

### J3: Constants vs. Enums
Prefer enums over constants for type safety:
```java
// Old style — not type-safe
public static final int MONDAY = 1;

// Modern Java — type-safe, self-documenting
public enum Day { MONDAY, TUESDAY, WEDNESDAY, ... }
```

---

## Names

### N1: Choose Descriptive Names
Names should describe intent precisely. Take time to choose good names — it pays off many times over.

### N2: Choose Names at the Appropriate Level of Abstraction
Don't use implementation detail names in high-level code:
```java
// Too specific — reveals implementation detail at abstract level
interface Modem { void dial(String phoneNumber); }  // what about TCP/IP modems?

// Better — abstracts to the concept
interface Modem { void connect(String connectionString); }
```

### N3: Use Standard Nomenclature Where Possible
Use names from the domain and from established patterns. A `Factory` creates things. A `Decorator` wraps things. Readers recognize these immediately.

### N4: Unambiguous Names
Avoid names that can be interpreted multiple ways. If the name requires the reader to look at the code to understand it, it's not good enough.

### N5: Use Long Names for Long Scopes
The longer the scope, the more descriptive the name should be. `i` is fine for a 3-line loop. It's confusing in a 50-line method.

### N6: Avoid Encodings
Don't encode type or scope information into names. Hungarian notation, member prefixes (`m_`), interface prefixes (`I`) — all noise in modern Java.

### N7: Names Should Describe Side Effects
Names should describe everything a function, variable, or class is or does:
```java
// Bad — the name hides the side effect (creating the output stream)
public ObjectOutputStream getOos() throws IOException {
    if (oos == null) oos = new ObjectOutputStream(socket.getOutputStream()); // side effect!
    return oos;
}

// Better
public ObjectOutputStream createOrReturnOos() throws IOException { ... }
```

---

## Tests

### T1: Insufficient Tests
A test suite should cover every condition that might fail. Test until you're confident there are no remaining bugs — then add one more test for good measure.

### T2: Use a Coverage Tool
Coverage tools reveal untested paths. Aim for high coverage, but remember: 100% coverage doesn't mean 100% correct.

### T3: Don't Skip Trivial Tests
Trivial tests are easy to write and document behavior clearly. Write them.

### T4: An Ignored Test Is a Question About an Ambiguity
If you `@Ignore` a test, that's usually a sign of ambiguous requirements. Resolve the ambiguity.

### T5: Test Boundary Conditions
Most bugs live at the boundaries: min/max, empty/full, first/last, null/non-null. Test them explicitly.

### T6: Exhaustively Test Near Bugs
When you find a bug, test the surrounding area thoroughly. Bugs cluster.

### T7: Patterns of Failure Are Revealing
Failed tests often reveal patterns — e.g., all failures happen when input is null, or on certain days of the week. These patterns point to root causes.

### T8: Test Coverage Patterns Can Be Revealing
Similar to T7 — looking at which lines of production code are exercised (or not) by failing tests helps diagnose root causes.

### T9: Tests Should Be Fast
Slow tests are skipped. Slow tests that are skipped don't catch regressions. Keep tests fast.

---

## Key Takeaways

This chapter is a reference. The key meta-lessons:

1. **Code smells are signals**, not verdicts. They indicate where to look, not necessarily what to do.
2. **Heuristics require judgment**. Apply them with wisdom, not mechanically.
3. **This list is not exhaustive**. Develop your own smell-detection instincts through experience and code review.
4. **Clean code is a practice**, not a destination. Smells accumulate; clearing them requires continuous attention.
