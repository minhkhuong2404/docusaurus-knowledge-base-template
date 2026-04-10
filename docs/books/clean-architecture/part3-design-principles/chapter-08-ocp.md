---
id: chapter-08-ocp
title: "Chapter 8: OCP — The Open-Closed Principle"
sidebar_position: 2
description: >
  A software artifact should be open for extension but closed for modification. OCP is the architectural goal that drives Clean Architecture: protect high-level policy from changes in low-level details by controlling the direction of dependencies.
tags:
  - solid
  - ocp
  - open-closed
  - design-principles
  - extension
  - architecture
---

# Chapter 8: OCP — The Open-Closed Principle

> _"A software artifact should be open for extension but closed for modification."_  
> — Bertrand Meyer (1988), restated by Martin

## 🎓 For New Learners

### What OCP Says

If you want to add a new feature, you should be able to **add new code** rather than **change existing code**.

Why? Because every time you change existing code, you risk breaking everything that already works. If you can add features by only adding code — new classes, new modules — you can never break existing behavior.

### A Thought Experiment

Imagine a financial reporting system that displays data on a web page. A new requirement: also generate a printed report.

**OCP violation (modification):**
```java
public class ReportGenerator {
    public void generate(Report data, OutputType type) {
        if (type == WEB) { /* web-specific logic */ }
        else if (type == PRINT) { /* print-specific logic */ }
        // Adding PDF means editing this class again
    }
}
```

Every new output format requires modifying `ReportGenerator`. Every modification risks breaking web and print.

**OCP compliance (extension):**
```java
public interface ReportPresenter {
    void present(Report data);
}
public class WebReportPresenter implements ReportPresenter { ... }
public class PrintReportPresenter implements ReportPresenter { ... }
public class PdfReportPresenter implements ReportPresenter { ... }  // new, no changes elsewhere
```

Adding PDF adds a new class. Existing classes are untouched. They are **closed for modification**.

### The Direction of Protection

OCP is achieved by **controlling which component knows about which**:

- High-level components (business logic, policy) should be **protected from** changes in low-level components (presenters, formatters, I/O)
- This means: high-level components must NOT depend on low-level ones
- Instead: both depend on **abstractions** (interfaces)

This is why OCP and the Dependency Inversion Principle (Chapter 11) are deeply connected.

---

## 🔬 Senior Deep Dive

### OCP as the Goal of Architecture

Martin makes a bold statement: **OCP is the driving motivation behind Clean Architecture itself**. The entire model of concentric rings, the dependency rule, the boundary-drawing — all of it exists to make high-level policy closed to changes in low-level details.

The "closed" part is about **protection hierarchy**:

```
Business Rules (closed to everything below)
       ↑ depends on abstractions
Use Cases (closed to presenters and DB)
       ↑ depends on abstractions
Interface Adapters (closed to frameworks)
       ↑ depends on abstractions
Frameworks & Drivers (open, changes freely)
```

When a framework changes (Spring Boot version upgrade, JPA API change), only the outermost ring is affected. Business rules are not recompiled, not retested.

### Directional Control and Information Hiding

Two mechanisms achieve OCP in practice:

**Directional Control**: Interfaces are placed at boundaries so that dependencies point the right direction. A `ReportPresenter` interface lives in the use case layer. Both the use case and the web presenter depend on it — the dependency arrow points toward the use case, not toward the presenter.

**Information Hiding**: A component that should be closed doesn't expose its internals. The `FinancialReportController` in the web adapter doesn't need to know which database stores the financial data — that knowledge is hidden behind a `FinancialDataGateway` interface.

### Spring Implementation

```java
// Use Case — closed to presentation concerns
public class GenerateFinancialReportUseCase {
    private final FinancialDataGateway gateway;        // interface
    private final FinancialReportPresenter presenter;  // interface

    public void execute(ReportRequest request) {
        FinancialData data = gateway.fetchFor(request.period());
        presenter.present(FinancialReport.from(data));
    }
}

// New output format — ZERO changes to use case
@Component
public class PdfFinancialReportPresenter implements FinancialReportPresenter {
    public void present(FinancialReport report) {
        // PDF generation logic
    }
}
```

New requirement → new class. Existing use case: untouched, unconcerned.

### OCP and Tests

OCP also applies to test doubles. Because production code depends on interfaces, tests substitute implementations freely:

```java
class GenerateFinancialReportUseCaseTest {
    @Test void generatesReport() {
        var fakeGateway = new InMemoryFinancialGateway();
        var capturePresenter = new CapturingPresenter();
        var useCase = new GenerateFinancialReportUseCase(fakeGateway, capturePresenter);

        useCase.execute(new ReportRequest(Q3_2024));

        assertThat(capturePresenter.lastReport()).isNotNull();
    }
}
```

No Spring context. No database. No HTTP. The use case is closed to all infrastructure — and thus testable in microseconds.

---

## Summary

| Concept | Key Point |
|---|---|
| OCP definition | Add features by adding code, not by modifying existing code |
| Protection hierarchy | High-level policy is closed; low-level details are open |
| Mechanism | Interfaces at boundaries + dependency inversion |
| Architecture connection | OCP is the core motivation for Clean Architecture's concentric rings |
| Spring pattern | `@Component` implementing an interface defined in the inner layer |
