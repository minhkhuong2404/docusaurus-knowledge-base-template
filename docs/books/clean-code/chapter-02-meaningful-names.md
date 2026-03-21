---
sidebar_position: 3
title: "Chapter 2: Meaningful Names"
description: How to choose names that reveal intent and make code self-documenting.
---

# Chapter 2: Meaningful Names

## Why Naming Matters

Names are everywhere in code — variables, functions, classes, packages, files. Since we do so much of it, we might as well do it **well**. A good name removes the need for a comment. A bad name creates confusion that compounds over time.

This chapter is one of the most immediately actionable in the entire book.

---

## Use Intention-Revealing Names

The name should tell you **why it exists**, **what it does**, and **how it is used**.

```java
// Bad
int d; // elapsed time in days

// Good
int elapsedTimeInDays;
int daysSinceCreation;
int fileAgeInDays;
```

If a name requires a comment to explain it, the name is not doing its job.

**Another example — a method returning flagged cells from a game board:**

```java
// Bad — what is "theList"? What does "4" mean? What is [0]?
public List<int[]> getThem() {
    List<int[]> list1 = new ArrayList<>();
    for (int[] x : theList)
        if (x[0] == 4)
            list1.add(x);
    return list1;
}

// Good — now the intent is clear
public List<Cell> getFlaggedCells() {
    List<Cell> flaggedCells = new ArrayList<>();
    for (Cell cell : gameBoard)
        if (cell.isFlagged())
            flaggedCells.add(cell);
    return flaggedCells;
}
```

The logic is identical — but the second version explains itself.

---

## Avoid Disinformation

Don't use names that carry misleading connotations.

```java
// Bad — "List" in a name implies a java.util.List
Map<String, Account> accountList; // it's a Map, not a List!

// Good
Map<String, Account> accountMap;
// or just:
Map<String, Account> accounts;
```

Also be careful with names that look similar. Names like `XYZControllerForEfficientHandlingOfStrings` and `XYZControllerForEfficientStorageOfStrings` are nearly impossible to distinguish at a glance.

Using lowercase `L` and uppercase `O` as variable names is particularly dangerous because they look like `1` and `0`:

```java
// Terrible
int l = 1;
if (O == l) {
    O = O1;
}
```

---

## Make Meaningful Distinctions

If names must differ, they should differ in meaning — not just arbitrarily.

```java
// Bad — what's the difference between a1 and a2?
public static void copyChars(char a1[], char a2[]) {
    for (int i = 0; i < a1.length; i++)
        a2[i] = a1[i];
}

// Good
public static void copyChars(char source[], char destination[]) {
    for (int i = 0; i < source.length; i++)
        destination[i] = source[i];
}
```

Also avoid "noise words" that add no meaning:

- `ProductInfo` vs `ProductData` — what's the difference?
- `theCustomer` vs `customer` — `the` adds nothing
- `nameString` vs `name` — it's obviously a String in typed Java

---

## Use Pronounceable Names

Human brains are optimized for spoken language. If you can't say the name out loud, you can't discuss the code naturally.

```java
// Bad — try saying "genymdhms" in a standup
class DtaRcrd102 {
    private Date genymdhms;
    private Date modymdhms;
    private final String pszqint = "102";
}

// Good
class Customer {
    private Date generationTimestamp;
    private Date modificationTimestamp;
    private final String recordId = "102";
}
```

With pronounceable names, you can say: "Hey, does `generationTimestamp` get set before or after we call the service?"

---

## Use Searchable Names

Single-letter variable names and numeric literals are nearly impossible to search for.

```java
// Bad — try searching for "5" in a large codebase
for (int j = 0; j < 34; j++) {
    s += (t[j] * 4) / 5;
}

// Good — each name is searchable and meaningful
int realDaysPerIdealDay = 4;
const int WORK_DAYS_PER_WEEK = 5;
int sum = 0;
for (int j = 0; j < NUMBER_OF_TASKS; j++) {
    int realTaskDays = taskEstimate[j] * realDaysPerIdealDay;
    int realTaskWeeks = realTaskDays / WORK_DAYS_PER_WEEK;
    sum += realTaskWeeks;
}
```

:::tip Rule of Thumb
The **length of a name** should correspond to the **size of its scope**. A loop counter `i` is fine in a 3-line loop. In a method spanning 30 lines, a single letter is dangerous.
:::

---

## Avoid Encodings

### Hungarian Notation — Don't Do It in Java

Hungarian notation (prefixing type information into the name) was useful in C where the compiler didn't enforce types. In modern Java, your IDE and compiler already know the type.

```java
// Unnecessary in Java
String strName;
int iCount;
boolean bEnabled;

// Just use the plain name
String name;
int count;
boolean enabled;
```

### Member Prefixes

Don't use `m_` or `_` to denote member fields. Modern IDEs highlight them differently, and it just creates noise.

```java
// Old style — unnecessary
private String m_description;

// Clean
private String description;
```

### Interfaces and Implementations

Don't encode the fact that something is an interface with a prefix like `I`:

```java
// Avoid
interface IShapeFactory {}

// Prefer — encode in the *implementation* if needed
interface ShapeFactory {}
class ShapeFactoryImpl implements ShapeFactory {} // acceptable
```

---

## Avoid Mental Mapping

Readers shouldn't need to translate your name into a different concept. Single-letter variable names (except well-understood loop counters like `i`, `j`, `k`) force mental mapping.

```java
// Bad — reader must remember that "r" means the filtered URL
String r = getFilteredUrl(u);

// Good
String filteredUrl = getFilteredUrl(originalUrl);
```

Cleverness is not clarity. Clarity wins.

---

## Class Names and Method Names

- **Class names** should be nouns or noun phrases: `Customer`, `Account`, `WikiPage`, `AddressParser`. Avoid vague names like `Manager`, `Processor`, `Data`.
- **Method names** should be verbs or verb phrases: `postPayment()`, `deletePage()`, `save()`.

For accessors, mutators, and predicates, use JavaBeans conventions:

```java
String name = customer.getName();
customer.setName("Bob");

if (paycheck.isPosted()) { ... }
```

---

## One Word per Concept — and Don't Pun

Pick one word for one abstract concept and stick with it throughout:

```java
// Inconsistent — pick ONE
fetchUsers();
retrieveProducts();
getOrders();

// Consistent
getUsers();
getProducts();
getOrders();
```

But don't use the same word for two different concepts either (that's punning):

```java
// "add" means "create a sum" in MathUtils
int add(int a, int b) { return a + b; }

// "add" means "append to list" in ListUtils — different concept!
// Better: use "append" or "insert"
void add(Element element) { ... }
```

---

## Use Problem and Solution Domain Names

- **Solution domain names** are fine — developers know what `Queue`, `Stack`, `Factory`, `Visitor`, and `Builder` mean.
- **Problem domain names** are fine too — if there's no technical equivalent, name it from the domain.

A developer reading the code should be able to ask a domain expert what `PolicyTransaction` means. They can't ask anyone what `q37x` means.

---

## Add Meaningful Context — Don't Add Gratuitous Context

Variables like `state`, `city`, and `street` are clear *in context* — if they're part of an `Address` class. But used alone in a method, `state` is ambiguous. Adding them to an `Address` class (or an `addrState` prefix if needed) clarifies the context.

On the other hand, don't add context unnecessarily:

```java
// Too much context — every class in "Gas Station Deluxe" starts with GSD?
class GSDAccountAddress { ... }

// Better
class AccountAddress { ... }
```

---

## Key Takeaways

- A good name **eliminates the need for a comment**
- Names should be pronounceable, searchable, and reflect intent
- Avoid encodings, noise words, and misleading type-in-name patterns
- One word per concept; don't pun
- The length of a name should match the size of its scope

## Quick Reference

| Pattern | Bad Example | Good Example |
|--------|-------------|--------------|
| Intent-revealing | `int d` | `int daysSinceModified` |
| No disinformation | `List<Account> accountList` (it's a Map) | `Map<String, Account> accounts` |
| Pronounceable | `Date genymdhms` | `Date generationTimestamp` |
| Searchable | `5` (magic number) | `WORK_DAYS_PER_WEEK` |
| No encoding | `String strName` | `String name` |
| Class names | `Manager`, `Processor` | `Customer`, `Account` |
| Method names | `data()`, `info()` | `getCustomer()`, `save()` |
