---
sidebar_position: 5
title: "Chapter 4: Comments"
description: When comments help, when they hurt, and why good code rarely needs them.
---

# Chapter 4: Comments

## The Uncomfortable Truth About Comments

Martin opens with a provocation:

> *"The proper use of comments is to compensate for our failure to express ourselves in code."*

Comments are not automatically good. Every time you write a comment, you've failed to express something in code. The best comment is the one you **didn't need to write** because the code explained itself.

Comments lie. Code runs — it is the truth. But comments drift from the code they describe. Someone updates the code but forgets to update the comment. Now the comment misleads.

:::warning
Don't celebrate comments. Every comment is a sign that the code could be clearer.
:::

---

## Good Comments

There are a few cases where comments genuinely add value.

### 1. Legal Comments

Required by corporate or open-source standards:

```java
// Copyright (C) 2024 Acme Corp. All rights reserved.
// Licensed under the MIT License.
```

These are necessary but should be short — reference a license file rather than pasting the whole thing inline.

### 2. Informative Comments

Sometimes useful when explaining the return value of an abstract method:

```java
// Returns an instance of the Responder being tested.
protected abstract Responder responderInstance();
```

Even here, a better name like `responderBeingTested()` would eliminate the need.

### 3. Explanation of Intent

When the *why* behind a decision isn't obvious from the code:

```java
// We need to use ConcurrentHashMap here because this method is accessed
// by multiple threads and LinkedHashMap is not thread-safe.
private final Map<String, User> userCache = new ConcurrentHashMap<>();
```

### 4. Clarification

When translating an obscure argument or value into readable form:

```java
assertTrue(a.compareTo(b) == -1); // a < b
assertTrue(b.compareTo(a) == 1);  // b > a
```

Though a better refactor is often possible.

### 5. Warning of Consequences

```java
// WARNING: This test is very slow. Don't run it on every build.
// Only run before a release.
@Test
public void testWithRealDatabase() { ... }
```

### 6. TODO Comments

Acceptable in moderation as a marker for work that hasn't been done yet:

```java
// TODO: Replace with proper dependency injection when Spring is integrated
private final UserService service = new UserServiceImpl();
```

Modern IDEs highlight TODOs. But don't leave them forever — they become graveyard markers.

### 7. Amplification

When something might seem trivial but is critically important:

```java
String listItemContent = match.group(3).trim();
// The trim is very important. It removes the starting spaces that could
// cause the item to be recognized as another list.
```

### 8. Javadoc in Public APIs

For publicly published APIs, Javadoc is essential. It's the primary documentation contract between library authors and their users:

```java
/**
 * Calculates the compound interest on a principal amount.
 *
 * @param principal the initial amount
 * @param rate      the annual interest rate (as a decimal, e.g., 0.05 for 5%)
 * @param periods   the number of compounding periods
 * @return the total amount after interest
 */
public double compoundInterest(double principal, double rate, int periods) { ... }
```

---

## Bad Comments

This is the longer and more important section. Most comments fall into one of these categories.

### 1. Mumbling

A comment that was written quickly without intent to help:

```java
try {
    loadProperties();
} catch (IOException e) {
    // No properties files means defaults are loaded
}
```

What does this mean? Are the defaults loaded before this call? After? By whom? This comment raises more questions than it answers.

### 2. Redundant Comments

A comment that explains exactly what the code already says:

```java
// Utility method that returns when this.closed is true. Throws an exception
// if the real object cannot be closed within the timeout.
public synchronized void waitForClose(final long timeoutMillis) throws Exception {
    if (!closed) {
        wait(timeoutMillis);
        if (!closed)
            throw new Exception("MockResponseSender could not be closed");
    }
}
```

The comment adds zero value. Reading the code takes the same or less time.

```java
/** The name of the customer */
private String customerName;

/** The customer's age */
private int age;
```

Javadoc on trivial private fields is pure noise.

### 3. Misleading Comments

Comments that are subtly wrong — out of sync with the code:

```java
// Returns true if the widget is enabled
// (but actually it checks BOTH enabled AND visible)
public boolean isEnabled() {
    return this.enabled && this.visible;
}
```

A reader trusting the comment will be confused when the method behaves differently than expected.

### 4. Mandated Comments

Some organizations require Javadoc on *every* method. This produces noise:

```java
/**
 * @param title The title of the CD
 * @param author The author of the CD
 * @param tracks The number of tracks on the CD
 * @param durationInMinutes The duration of the CD in minutes
 */
public void addCD(String title, String author, int tracks, int durationInMinutes) { ... }
```

This adds nothing. The method signature already says all of this.

### 5. Journal Comments

Before version control, developers sometimes tracked changes in a comment block at the top of a file:

```java
// Changes (from 2023-11-01)
// -----------------------------------------
// 2024-01-14: Fixed NPE in processOrder
// 2024-02-01: Added discount logic
// 2024-03-22: Refactored to use streams
```

**Don't do this.** Git exists. Use `git log`.

### 6. Noise Comments

Comments that restate the obvious:

```java
/** Default constructor */
public Customer() {}

/** The day of the month */
private int dayOfMonth;
```

These clutter the file without providing any signal.

### 7. Scary Noise (Javadoc Noise)

Copy-paste errors in Javadoc create actively misleading documentation:

```java
/** The name */
private String name;

/** The name */   // ← meant to say "version"
private String version;

/** The name */   // ← meant to say "licenceName"
private String licenceName;
```

### 8. Don't Use a Comment When You Can Use a Function or Variable

```java
// Bad — explaining what a condition does with a comment
// Check to see if the employee is eligible for full benefits
if ((employee.flags & HOURLY_FLAG) && (employee.age > 65)) { ... }

// Good — extract to a method with an expressive name
if (employee.isEligibleForFullBenefits()) { ... }
```

### 9. Position Markers / Banner Comments

```java
// /////////// Actions //////////////////
```

These are visual noise. If your file is so long that you need banners to navigate it, that's a sign to split it up.

### 10. Closing Brace Comments

```java
while (condition) {
    if (something) {
        // ...
    } // if something
} // while condition
```

This is a sign your functions are too long. Shorten them instead.

### 11. Commented-Out Code

```java
// InputStreamResponse response = new InputStreamResponse();
// response.setBody(formatter.getResultStream(), formatter.getByteCount());
OutputStream response = formatter.getResultStream();
```

**Never leave commented-out code.** Others assume it must be there for a reason and won't delete it. It accumulates. It rots. Source control remembers history — delete it.

### 12. HTML in Comments

```java
/**
 * Task for <em>TestRunner</em>, as defined in
 * <a href="http://www.junit.org">JUnit</a>.
 */
```

HTML in comments is unreadable in the source file. It only makes sense when rendered by a tool. If the tool generates HTML, let the tool add the tags.

### 13. Nonlocal Information

Comments should describe the code they are next to — not system-wide knowledge injected into an unrelated place.

### 14. Too Much Information

Comments don't need to include historical discussions, RFCs, design arguments, or tangential notes. Keep it lean.

### 15. Inobvious Connection

A comment should explain something **about its code**. If you have to read the comment and then hunt for which code it's talking about, it's broken.

---

## The Main Message

The best way to get rid of bad comments is to **improve the code** so the comment is no longer needed.

Before writing a comment, ask:
1. Can I rename a variable or function to make this unnecessary?
2. Can I extract a method whose name documents the intent?
3. Is this comment staying in sync with the code, or will it rot?

---

## Key Takeaways

| Type | Verdict |
|------|---------|
| Legal notices | ✅ Necessary |
| Warning of consequences | ✅ Acceptable |
| TODO markers | ✅ Use sparingly |
| Public API Javadoc | ✅ Essential |
| Redundant comments | ❌ Delete |
| Commented-out code | ❌ Always delete |
| Misleading comments | ❌ Dangerous |
| Noise comments | ❌ Delete |
| Journal comments | ❌ Use version control |
| Position markers | ❌ Refactor instead |
