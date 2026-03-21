---
sidebar_position: 4
title: "Chapter 3: Functions"
description: Rules for writing small, focused functions that do exactly one thing well.
---

# Chapter 3: Functions

## The First Rule of Functions

Functions are the first line of organization in any program. This chapter provides concrete rules for writing functions that are easy to read, test, and maintain.

The core principle: **functions should be small, do one thing, and do it well.**

---

## Rule 1: Small!

Functions should be small. Then they should be smaller than that.

Martin argues that functions should **rarely be more than 20 lines** and ideally shorter than 10.

```java
// This is too long — it's doing many things at once
public static String renderPageWithSetups(PageData pageData, boolean isSuite) throws Exception {
    boolean isTestPage = pageData.hasAttribute("Test");
    if (isTestPage) {
        WikiPage testPage = pageData.getWikiPage();
        StringBuffer newPageContent = new StringBuffer();
        includeSetupPages(testPage, newPageContent, isSuite);
        newPageContent.append(pageData.getContent());
        includeTeardownPages(testPage, newPageContent, isSuite);
        pageData.setContent(newPageContent.toString());
    }
    return pageData.getHtml();
}

// Much better — express intent clearly
public static String renderPageWithSetups(PageData pageData, boolean isSuite) throws Exception {
    if (isTestPage(pageData))
        includeSetupAndTeardownPages(pageData, isSuite);
    return pageData.getHtml();
}
```

Blocks inside `if`, `else`, and `while` statements should be **one line long** — typically a function call. This keeps the enclosing function small and adds documentary value.

---

## Rule 2: Do One Thing

> **Functions should do one thing. They should do it well. They should do it only.**

But what is "one thing"? Martin's test: **you can describe a function by a brief TO paragraph without using the word "and"**:

- *TO render the page, we check if it's a test page and include setups and teardowns.* ✅ One thing.
- *TO render the page, we check if it's a test page, **and** if so we build the content, **and** then we add teardown pages.* ❌ Multiple things.

Another test: can you extract a meaningful sub-function from it? If yes, the original function was doing more than one thing.

---

## Rule 3: One Level of Abstraction per Function

Functions mix levels of abstraction when they jump between high-level business logic and low-level implementation details:

```java
// Mixes abstraction levels — concept (getHtml) + detail (StringBuffer manipulation)
public String buildPage() {
    String header = getHtml(); // high level
    StringBuffer buf = new StringBuffer(); // low level
    buf.append("\n");
    return buf.toString();
}
```

Keep one level of abstraction per function. High-level functions call mid-level functions which call low-level functions — this is the **Stepdown Rule**.

### The Stepdown Rule (Top-Down Narrative)

Code should read like a top-down narrative. Each function introduces the next level of abstraction. Like reading a story where each paragraph sets up the next:

```java
// High level
public void makeSandwich() {
    gatherIngredients();
    assembleSandwich();
    plate();
}

// Mid level
private void assembleSandwich() {
    spreadCondiments();
    addFillings();
    closeBread();
}

// Low level
private void spreadCondiments() {
    spreadMustard(bottomSlice);
    spreadMayonnaise(topSlice);
}
```

---

## Rule 4: Switch Statements

Switch statements are inherently multi-case. The goal is to **bury them in a factory and never repeat them.**

```java
// Bad — this switch will be duplicated everywhere employee type matters
public Money calculatePay(Employee e) throws InvalidEmployeeType {
    switch (e.type) {
        case COMMISSIONED: return calculateCommissionedPay(e);
        case HOURLY:       return calculateHourlyPay(e);
        case SALARIED:     return calculateSalariedPay(e);
        default: throw new InvalidEmployeeType(e.type);
    }
}

// Good — use polymorphism via Abstract Factory
public abstract class Employee {
    public abstract Money calculatePay();
}

public interface EmployeeFactory {
    Employee makeEmployee(EmployeeRecord r) throws InvalidEmployeeType;
}

public class EmployeeFactoryImpl implements EmployeeFactory {
    public Employee makeEmployee(EmployeeRecord r) throws InvalidEmployeeType {
        switch (r.type) {
            case COMMISSIONED: return new CommissionedEmployee(r);
            case HOURLY:       return new HourlyEmployee(r);
            case SALARIED:     return new SalariedEmployee(r);
            default: throw new InvalidEmployeeType(r.type);
        }
    }
}
```

The switch is used **once** to create the right object. From then on, behavior is dispatched via polymorphism. The switch is never repeated.

---

## Rule 5: Use Descriptive Names

> *"You know you are working on clean code when each routine turns out to be pretty much what you expected."*

Don't be afraid of long names. A long descriptive name is better than a short cryptic name.

```java
// Cryptic — what does this do?
private void init() { ... }

// Descriptive — now it's obvious
private void initializeSetupAndTeardownIncluder() { ... }
```

Be consistent with naming. If you use `get`, use it everywhere for retrieval. Don't mix `get`, `fetch`, `retrieve`, and `obtain`.

---

## Rule 6: Function Arguments

The ideal number of arguments is **zero**. Then one. Then two. Three or more is to be avoided — justify it carefully.

### Why fewer arguments?

- They're harder to read: `circle(11, true)` — what does `true` mean?
- They're harder to test: with 3 arguments, you need to test many combinations.
- They complicate the API surface.

### Common Argument Patterns

**Monadic (1 argument):** Two good forms:

```java
// 1. Asking a question about the argument
boolean fileExists(String fileName)

// 2. Transforming the argument into something else
InputStream fileOpen(String fileName)
```

**Dyadic (2 arguments):** Can be fine when the arguments are ordered/paired by nature:

```java
// Natural pair — order is obvious
Point p = new Point(0, 0);

// Not natural — order of expected vs actual is easy to mix up
assertEquals(expected, actual); // which comes first?
```

**Flag Arguments:** Passing a `boolean` into a function is ugly. It means the function does two things — one when true, another when false. Split it:

```java
// Bad
render(true);     // what does true mean?

// Good
renderForSuite();
renderForSingleTest();
```

**Argument Objects:** When a function takes 2-3 related arguments, wrap them in a class:

```java
// Bad
Circle makeCircle(double x, double y, double radius);

// Good
Circle makeCircle(Point center, double radius);
```

**Verbs and Keywords:** Encode the argument meaning in the function name:

```java
// What is the second arg?
assertEquals(expected, actual);

// Now the args are documented in the name
assertExpectedEqualsActual(expected, actual);
```

---

## Rule 7: Have No Side Effects

A function that promises to do one thing should not secretly do something else.

```java
// Looks like it just checks the password — but it also initializes the session!
public boolean checkPassword(String userName, String password) {
    User user = UserGateway.findByName(userName);
    if (user != null) {
        if (user.passwordMatches(password)) {
            Session.initialize(); // SIDE EFFECT — unexpected!
            return true;
        }
    }
    return false;
}
```

The `Session.initialize()` is a hidden side effect. If you call `checkPassword` just to verify a password, you accidentally wipe the session. The fix: rename it `checkPasswordAndInitializeSession`, or (better) split into two functions.

### Output Arguments

Avoid using arguments as output:

```java
// Confusing — is s being appended to the report, or is the report being appended to s?
appendFooter(s);

// Much clearer — the object's method makes the receiver obvious
report.appendFooter();
```

---

## Rule 8: Command-Query Separation

A function should either **do something** (command) or **answer something** (query) — never both.

```java
// Bad — sets AND returns success status — confusing in an if-statement
if (set("username", "bob")) { ... }  // Is it setting something? Checking something?

// Good — separate the command from the query
setAttribute("username", "bob");
if (attributeExists("username")) { ... }
```

---

## Rule 9: Prefer Exceptions to Returning Error Codes

Returning error codes forces callers to deal with them immediately and creates deeply nested structures:

```java
// Bad — nested if-hell to check every error code
if (deletePage(page) == E_OK) {
    if (registry.deleteReference(page.name) == E_OK) {
        if (configKeys.deleteKey(page.name.makeKey()) == E_OK) {
            logger.log("page deleted");
        } else {
            logger.log("configKey not deleted");
        }
    } else {
        logger.log("deleteReference from registry failed");
    }
} else {
    logger.log("delete failed");
    return E_ERROR;
}

// Good — exceptions separate the happy path from the error path
try {
    deletePage(page);
    registry.deleteReference(page.name);
    configKeys.deleteKey(page.name.makeKey());
} catch (Exception e) {
    logger.log(e.getMessage());
}
```

Also: **extract try/catch blocks into their own functions**. Error handling *is* one thing. A function that handles errors should do nothing else.

```java
public void delete(Page page) {
    try {
        deletePageAndAllReferences(page);
    } catch (Exception e) {
        logError(e);
    }
}

private void deletePageAndAllReferences(Page page) throws Exception {
    deletePage(page);
    registry.deleteReference(page.name);
    configKeys.deleteKey(page.name.makeKey());
}
```

---

## Rule 10: Don't Repeat Yourself (DRY)

Duplication is the root of all evil in software. Every time logic is repeated, it creates multiple places to fix bugs. Extract duplicated logic into its own function.

---

## How to Write Functions Like This

Martin is honest: first drafts are often long and messy. That's okay. **Refine it:**

1. Write the ugly first draft
2. Write tests that cover the behavior
3. Refactor: split functions, rename variables, remove duplication
4. Keep the tests passing throughout

Writing clean functions is not something that happens in one pass — it's an iterative craft.

---

## Key Takeaways

| Rule | Principle |
|------|-----------|
| Small | Functions should rarely exceed 20 lines |
| One thing | One function, one purpose, no "and" |
| One abstraction level | Don't mix high-level intent with low-level detail |
| Descriptive names | Long descriptive > short cryptic |
| Few arguments | 0-2 preferred; 3+ needs justification |
| No side effects | Don't do hidden things |
| Command-query separation | Do OR answer, never both |
| Exceptions over error codes | Keep the happy path clean |
| DRY | Never duplicate logic |
