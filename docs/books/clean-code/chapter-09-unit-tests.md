---
sidebar_position: 10
title: "Chapter 9: Unit Tests"
description: Why tests must be clean, what makes a good test, and the F.I.R.S.T. principles.
---

# Chapter 9: Unit Tests

## Tests Are Not Second-Class Citizens

The testing discipline has grown significantly with TDD (Test-Driven Development). But having tests is not enough — **test code must be as clean as production code**. Dirty tests are often worse than no tests at all, because they become a burden that teams eventually abandon.

---

## The Three Laws of TDD

Martin describes TDD as following three laws:

1. **You may not write production code until you have written a failing unit test.**
2. **You may not write more of a unit test than is sufficient to fail.** (Not compiling counts as failing.)
3. **You may not write more production code than is sufficient to pass the current failing test.**

These three laws keep you in a very tight loop: write a tiny failing test, write just enough code to pass it, repeat. This cycle keeps the tests and production code growing together, a few seconds apart.

---

## Keeping Tests Clean

Many teams write test code quickly and carelessly — thinking it doesn't matter as long as the tests pass. This is a mistake.

**Dirty test code has a compounding cost:**
- As production code changes, dirty tests break and are hard to update.
- Maintaining dirty tests takes more time than writing new production code.
- Eventually teams abandon the tests entirely.
- Without tests, refactoring becomes dangerous.
- Without refactoring, code rots.

:::danger
**Test code that is abandoned is worse than no tests.** It gives false confidence and leaves the codebase fragile.
:::

Test code must evolve with the production code. That's only possible when tests are clean.

---

## Tests Enable Change

This is the core value proposition of a test suite:

> *"If you have tests, you do not fear making changes to the code! If you don't have tests, every change is a possible bug."*

Tests give you the **confidence to refactor**. Without them, you're afraid to touch anything. The production code rots because nobody dares clean it.

Clean tests → confident refactoring → clean production code → sustainable velocity.

---

## Clean Tests: Readability

The most important quality of a test is **readability**. A test should clearly tell the story of what's being tested.

The pattern that helps most: **Build-Operate-Check** (or Arrange-Act-Assert):

```java
@Test
public void turnOnLoTempAlarmAtThreashold() throws Exception {
    // Arrange (Build)
    hw.setTemp(WAY_TOO_COLD);

    // Act (Operate)
    controller.tic();

    // Assert (Check)
    assertTrue(hw.heaterState());
    assertTrue(hw.blowerState());
    assertFalse(hw.coolerState());
    assertFalse(hw.hiTempAlarm());
    assertTrue(hw.loTempAlarm());
}
```

Each test should have a clear setup, a clear action, and a clear assertion. No noise between them.

### Domain-Specific Testing Language

Build helper functions that read like a domain language, making tests almost prose-like:

```java
// With helper methods, the test becomes readable
@Test
public void turnOnCoolerAndBlowerIfTooHot() throws Exception {
    tooHot();  // helper that sets conditions
    assertEquals("hBChl", hw.getState()); // h=heater off, B=blower on, C=cooler on, h=hiTemp off, l=loTemp on
}
```

### One Assert per Test (Roughly)

Tests with a single assertion are the easiest to understand — the test title matches its single purpose. This isn't an absolute rule, but minimize the number of assertions per test.

More importantly: **one concept per test**. Don't test multiple unrelated behaviors in a single test method.

---

## The F.I.R.S.T. Principles

Clean tests follow five rules:

### F — Fast
Tests should run quickly. If they're slow, you won't run them frequently. If you don't run them frequently, they lose their value as a fast feedback loop.

### I — Independent
Tests should not depend on each other. No test should set up conditions for the next one. You should be able to run tests in any order, in isolation.

```java
// Bad — test2 depends on state left by test1
@Test public void test1() { user = createUser(); }
@Test public void test2() { user.setName("Bob"); } // NPE if test1 didn't run!

// Good — each test sets up its own state
@Test public void test2() { User user = createUser(); user.setName("Bob"); ... }
```

### R — Repeatable
Tests should produce the same results in any environment: local machine, CI server, offline. If tests depend on network, clock, or database state, they become unreliable.

### S — Self-Validating
Tests should return a boolean result: pass or fail. You should never have to read a log file to determine if a test passed. Assertions do this — use them.

### T — Timely
Write tests **at the right time** — before the production code (TDD). If you write tests after the production code, you may find the code hard to test, or skip writing tests altogether under time pressure.

---

## Key Takeaways

- Tests are not second-class code — they must be **as clean** as production code
- Test code that becomes a burden gets abandoned, making the codebase fragile
- Clean tests follow **Arrange-Act-Assert**: clear setup, action, and verification
- **One concept per test** — don't mix multiple behaviors in one test
- Tests must be **F.I.R.S.T.**: Fast, Independent, Repeatable, Self-validating, Timely
- Without tests, you can't refactor with confidence — the codebase will rot

## The Real Value

> *"Having dirty tests is equivalent to — if not worse than — having no tests."*

Tests give you permission to change code. They are the safety net that makes continuous improvement possible. Treat them with the same care as production code.
