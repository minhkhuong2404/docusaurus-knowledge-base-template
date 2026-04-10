---
id: chapter-17-20-boundaries
title: "Chapters 17–20: Boundaries, Business Rules & Policy"
sidebar_position: 3
description: >
  Boundaries separate software elements and restrict knowledge between them. This section covers drawing lines between components, anatomy of boundaries, policy levels, entities, and use cases — the core of Clean Architecture.
tags:
  - boundaries
  - business-rules
  - entities
  - use-cases
  - policy
  - architecture
---

# Chapters 17–20: Boundaries, Business Rules & Policy

> _"Software architecture is the art of drawing lines that I call boundaries."_

## 🎓 For New Learners

### Chapter 17: Boundaries — Drawing Lines

Boundaries separate things that change at different rates or for different reasons. The most important boundary in any system: **between business rules and everything else**.

**What to draw boundaries between:**
- Business logic ↔ Database
- Business logic ↔ UI / Web framework
- Business logic ↔ Third-party services
- Business logic ↔ Device I/O

**The key question**: what does the business rule need to know?

A business rule that calculates an order discount needs to know: the order, the customer, the discount policy. It does **not** need to know whether data comes from MySQL or MongoDB, whether it's serving a REST request or a gRPC call, or whether results are rendered in HTML or JSON.

Draw the boundary between what the rule knows and what it doesn't.

### The FitNesse Example

Martin uses FitNesse (a wiki/testing tool) to illustrate boundary drawing. Early in the project, MySQL was considered for persistence. But by delaying the database decision and writing a `WikiPage` interface, the team was able to build the entire application against an in-memory implementation — and delay the database decision for over a year.

When they finally needed to make the decision, they had much more information — and the cost of any choice was minimal because the boundary was clean.

```java
// The boundary: WikiPage is an interface
public interface WikiPage {
    WikiPagePath getPagePath();
    WikiPage getChildPage(String name);
    void addChildPage(String name);
    PageData getData();
}

// Early implementation: in-memory (free the team to move fast)
// Later implementation: file system, then database
// Business logic: never changed
```

### Chapter 18: Boundary Anatomy

Boundaries can take three physical forms:

| Form | Communication | Cost |
|---|---|---|
| **Monolith** (source-level) | Function calls (in-memory) | Near zero |
| **Local process** (same machine, separate process) | IPC / sockets | Low |
| **Services** (separate machines) | Network (REST, gRPC, messaging) | High |

All three forms use the same architectural principle: **the dependency rule**. Source code dependencies always point inward. Communication may cross the boundary in either direction at runtime — but the source code only knows about the inner layer's interface.

**The cost of boundaries matters**: every service-level boundary adds latency, failure modes, versioning concerns, and operational complexity. Don't add service boundaries unless the operational benefit justifies the cost.

### Chapter 19: Policy and Level

Every piece of software is a **policy** — a statement of how to transform inputs into outputs. Policies can be sorted by **level**: the distance from the inputs and outputs of the system.

- **High-level policy**: far from I/O, stable, abstract (e.g., business rules)
- **Low-level policy**: close to I/O, volatile, concrete (e.g., format a PDF, read from a file)

The dependency rule restated as a level rule: **source code dependencies should point toward higher levels** (further from I/O, more stable).

```
Low Level (volatile, close to I/O)
  File reader → Data parser → Business rule calculator → Report formatter → File writer
                                ↑ highest level — most stable

Dependencies should point: → toward the calculator ←
The calculator should know nothing about files or formatting.
```

### Chapter 20: Business Rules

Martin distinguishes two types of business rules:

**Entities**: Enterprise-wide business rules. The critical rules that make or save money, entirely independent of automation. They would exist even if you ran the business on paper.

```java
// Entity: pure business rule — no framework dependencies
public class Loan {
    private BigDecimal principal;
    private BigDecimal rate;
    private int period;

    // Critical business rule: makes/saves money for the bank
    public BigDecimal makePayment(BigDecimal payment) {
        BigDecimal interest = principal.multiply(rate);
        BigDecimal principalReduction = payment.subtract(interest);
        principal = principal.subtract(principalReduction);
        return principalReduction;
    }
}
```

**Use Cases**: Application-specific business rules. They automate how a human would interact with entities to achieve a goal. They depend on entities but should know nothing about the UI or database.

```java
// Use Case: orchestrates entities for a specific application flow
public class MakeLoanPaymentUseCase {
    private final LoanRepository loanRepo;
    private final PaymentGateway paymentGateway;

    public PaymentResult execute(MakePaymentCommand cmd) {
        Loan loan = loanRepo.findById(cmd.loanId());
        BigDecimal reduction = loan.makePayment(cmd.amount());
        paymentGateway.charge(cmd.accountId(), cmd.amount());
        loanRepo.save(loan);
        return new PaymentResult(reduction, loan.getRemainingBalance());
    }
}
```

---

## 🔬 Senior Deep Dive

### The Database Is Not the Center

Many developers think of their Spring application as: "The database is the center. Everything serves the database model."

Martin explicitly inverts this: **the database is a detail**. It is a low-level policy. The business rules — entities and use cases — are the center.

```
Wrong:
  DB Tables → JPA Entities → Services → Controllers → (User)
  (database-centric)

Right:
  (User) → Controllers → Use Cases → Domain Entities → [DB Interface]
                                                              ↓
                                                         [JPA Repository]
  (domain-centric — dependencies point inward)
```

In a database-centric Spring application, the database schema drives the domain model (`@Entity` classes are shaped by tables). In a domain-centric architecture, the domain model drives the database schema. The JPA mapping layer translates between them.

### Entities vs. JPA Entities

A critical distinction for Spring developers:

| | Domain Entity | JPA Entity |
|---|---|---|
| Purpose | Captures business rules | Maps to database table |
| Dependencies | None | JPA, Hibernate |
| Location | domain module | infrastructure module |
| Testability | Plain JUnit | Requires DataSource |
| Should they be the same? | **No** | **No** |

Separating them:

```java
// domain module: pure business rule
public class Order {
    private final OrderId id;
    private Money total;
    public void applyDiscount(Discount d) { ... }
}

// infrastructure module: JPA mapping
@Entity @Table(name = "orders")
public class OrderJpaEntity {
    @Id private Long id;
    private BigDecimal totalAmount;
    private String currency;
}

// infrastructure module: mapper between the two
public class OrderJpaMapper {
    public Order toDomain(OrderJpaEntity e) { ... }
    public OrderJpaEntity toJpa(Order o) { ... }
}
```

More code, but: the domain entity is testable without a database, the JPA entity can be tuned for persistence without affecting business rules, and the two can evolve independently.

### Level in Spring: Where Should Logic Live?

Applying the "level" concept to a Spring application:

```
Level 0 (lowest): HTTP request/response parsing     → @RestController body parsing
Level 1:          Request validation                → @Valid, custom validators
Level 2:          Use case orchestration            → @Service / use case class
Level 3:          Domain entity logic               → pure Java domain objects  ← highest level
Level 2:          Persistence                       → @Repository / JPA
Level 1:          External service calls            → HTTP clients, SDK calls
Level 0 (lowest): Network I/O                       → Spring's embedded Tomcat
```

Business logic at Level 3 (highest) should have zero dependencies on anything at Levels 0–2. It should only depend on its own domain model.

---

## Summary

| Chapter | Key Concept |
|---|---|
| 17: Drawing Lines | Boundaries separate things that change at different rates; draw between business rules and I/O |
| 18: Boundary Anatomy | Monolith / local process / service — all use same dependency rule, different costs |
| 19: Policy and Level | Higher level = further from I/O = more stable; dependencies point toward higher levels |
| 20: Business Rules | Entities = enterprise rules; Use Cases = application-specific orchestration |
