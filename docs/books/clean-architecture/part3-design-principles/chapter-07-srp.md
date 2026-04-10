---
id: chapter-07-srp
title: "Chapter 7: SRP — The Single Responsibility Principle"
sidebar_position: 1
description: >
  The most misunderstood SOLID principle. SRP is NOT "every class does one thing" — it means a module should have only one reason to change, i.e., it serves only one actor. Learn the two symptoms of SRP violation and how to solve them.
tags:
  - solid
  - srp
  - single-responsibility
  - design-principles
  - cohesion
---

# Chapter 7: SRP — The Single Responsibility Principle

> _"A module should be responsible to one, and only one, actor."_

## 🎓 For New Learners

### The Most Misunderstood Principle

SRP is almost universally misquoted as: _"A class should do only one thing."_

That is **not** what it means. A class can do many things and satisfy SRP. The real definition:

> **A module should have one, and only one, reason to change.**

And "reason to change" means: **one actor** (a person or group of people) who can require that change. When a single module serves multiple actors, those actors' competing needs will cause unintended collisions.

### The Two Symptoms

**Symptom 1: Accidental Duplication**

Imagine an `Employee` class with three methods:
- `calculatePay()` — used by the Finance team
- `reportHours()` — used by the HR team  
- `save()` — used by the DBA team

All three share a private helper `regularHours()`. Finance asks for a change to how regular hours are calculated. A developer updates `regularHours()` — unaware that `reportHours()` calls it too. Now HR reports are wrong. The actors' shared dependency caused a silent bug.

**Symptom 2: Merges**

Two developers modify `Employee` simultaneously — one changing `calculatePay()` for Finance, one changing `reportHours()` for HR. Git merge conflict. Risky merge. Potential bugs. The class serving multiple actors becomes a collision point.

### The Solution: Separate the Actors

Move the data into a plain `EmployeeData` class with no methods. Give each actor its own class:

```
EmployeeData (plain data, no methods)
      ↑
PayCalculator        → used by Finance
HourReporter         → used by HR
EmployeeRepository   → used by DBAs
```

Now each class has exactly one actor. Changes requested by Finance cannot accidentally break HR. Merge conflicts disappear.

The **Facade pattern** can provide a single entry point if convenient:

```java
public class EmployeeFacade {
    private PayCalculator payCalc;
    private HourReporter hourReporter;
    private EmployeeRepository repo;

    public Money calculatePay(Employee e) { return payCalc.calculate(e); }
    public Hours reportHours(Employee e) { return hourReporter.report(e); }
    public void save(Employee e) { repo.save(e); }
}
```

---

## 🔬 Senior Deep Dive

### Actor, Not Function

The word "actor" is deliberate. An actor is a **human role** — a stakeholder group that has authority over and interest in a particular behavior. Finance owns pay calculation. HR owns hour reporting. DBAs own persistence schema.

When an actor requests a change, only their module changes. Other actors' modules are untouched. This is what makes the system safe to evolve.

Contrast with the common misreading "one function": a `PayCalculator` might have many methods — `calculateRegularPay()`, `calculateOvertimePay()`, `calculateBonus()`. All are owned by Finance. SRP is satisfied.

### SRP at Multiple Scales

SRP applies at every level of abstraction:

| Level | SRP Means |
|---|---|
| Function | Does one transformation; one reason to change |
| Class | Serves one actor; one cohesive responsibility |
| Component | Deployed for one team; one change cycle |
| Service | Owned by one team; bounded context |

Microservice boundaries are often SRP boundaries at the deployment level.

### Common Spring Violations

A classic Spring SRP violation is the **God Service**:

```java
@Service  // serves: Finance, HR, DBAs, Audit team, Email team
public class EmployeeService {
    public Money calculatePay(Long id) { ... }          // Finance
    public Hours reportHours(Long id) { ... }           // HR
    public void save(Employee e) { ... }                // DBAs
    public AuditLog getAuditLog(Long id) { ... }        // Audit
    public void sendWelcomeEmail(Employee e) { ... }    // Email/Marketing
}
```

Five actors. Any change for any actor forces a retest of all other actors' behavior. Every release of this class carries risk for all five teams.

**Refactored:**

```java
@Service public class PayrollService { ... }       // Finance only
@Service public class HRReportingService { ... }   // HR only
@Service public class EmployeeRepository { ... }   // DBAs only
@Service public class AuditService { ... }         // Audit only
@Service public class EmployeeOnboardingService { ... }  // Email/Marketing
```

### Detecting SRP Violations

Heuristics to spot violations in code review:
- A class that requires changes from multiple teams per quarter
- A class with imports from more than 2-3 unrelated domains
- Methods in a class that share no common data
- A class that is frequently the source of merge conflicts
- A class that needs full regression testing whenever any part changes

---

## Summary

| Concept | Key Point |
|---|---|
| Real SRP | One reason to change = one actor |
| Accidental duplication | Shared helpers serving multiple actors cause silent bugs |
| Merge collisions | Multiple actors → multiple developers → constant conflicts |
| Solution | Separate classes per actor; use Facade for convenience |
| Scale | Applies from function to microservice boundary |
