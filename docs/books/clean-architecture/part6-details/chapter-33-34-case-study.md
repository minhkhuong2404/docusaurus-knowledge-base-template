---
id: chapter-33-34-case-study
title: "Chapters 33–34: Case Study & The Missing Chapter"
sidebar_position: 2
description: >
  Chapter 33 applies Clean Architecture to a real video sales system end-to-end. Chapter 34 (by Simon Brown) confronts the gap between architecture and implementation — packaging strategies that make or break the dependency rule in practice.
tags:
  - case-study
  - video-sales
  - missing-chapter
  - package-by-component
  - package-by-feature
  - package-by-layer
  - simon-brown
---

# Chapters 33–34: Case Study & The Missing Chapter

## Chapter 33: Case Study — Video Sales

> _"Let's put it all together."_

### The System

A video sales website:
- Single actors: viewers (buy videos), authors (submit videos), administrators (manage content)
- Purchasable items: individual videos and video series
- Payment: credit card processing
- Licenses: stream-only or download-and-stream

### Use Case Analysis

Martin walks through the use case identification:

**Actors:** Viewer, Author, Administrator, Purchaser (may be same person as Viewer)

**Use Cases (partial):**
- View catalog
- Purchase video / series
- Stream video
- Download video
- Add video
- Remove video
- Update user info
- Update billing info

Each use case is a separate class. Each actor's use cases form a cluster.

### Component Architecture

| Architecture Tier | Components & Classes | Dependency Flow | Inversion & Isolation Rule |
|---|---|---|---|
| **1. Views (UI)** | `VideoView`, `CatalogView`, `PurchaseView`, `AdminView` | Depends on Presenters | Presentation layer: renders view models without knowing use cases. |
| **2. Presenters** | `VideoPresenter`, `CatalogPresenter`, `PurchasePresenter` | Depends on Use Cases | Formats use case output into UI-friendly view models. |
| **3. Use Cases** | `ViewCatalog`, `PurchaseVideo`, `StreamVideo` | Depends on Entities & Gateways | Application policies: orchestrates domain models and gateway interfaces. |
| **4. Entities (Domain)** | `Video`, `License`, `Catalog`, `Purchase` | **Zero Dependencies** | Core enterprise business rules and domain invariants. |
| **5. Gateways (SPI)** | `VideoGateway`, `LicenseGateway`, `PaymentGateway` | Lives in Use Case layer | Decouples use cases from persistence/external API details. |
| **6. Infrastructure** | `JpaVideoRepo`, `StripePaymentGateway`, `S3VideoStore` | Implements Gateways | Lowest-level detail: swapped or upgraded without breaking business code. |

All dependencies point inward. Entities know nothing about gateways. Use cases know nothing about presenters. Infrastructure knows only about the gateway interfaces it implements.

### Dependency Management

The dependency rule means:
- A change to the database schema may require changes to `JpaVideoRepo` but never to `ViewCatalogUseCase`
- Adding a new payment provider requires adding `PayPalPayment` — not modifying `PurchaseVideoUseCase`
- Adding a mobile UI requires new mobile views and presenters — not touching use cases
- Adding a new use case (e.g., `GiftVideo`) adds classes; existing classes are untouched

---

## Chapter 34: The Missing Chapter (Simon Brown)

> _"The devil is in the implementation details."_

### The Problem This Chapter Solves

You can understand every concept in the previous 33 chapters and still produce a tangled codebase. Why? Because **knowing the principles and implementing them correctly are two different skills**.

Simon Brown (author of the C4 model) contributes this chapter to address the gap. The focus: **packaging strategies** and how they determine whether the dependency rule is enforceable.

### Four Packaging Strategies

**1. Package by Layer**
```
com.example.web          (controllers)
com.example.service      (services)
com.example.repository   (repositories)
com.example.domain       (entities)
```

**Problems:**
- No way to enforce who can call whom — Java's package visibility won't help
- Changes to a feature touch multiple packages
- Architecture is not visible from the structure
- A `web` class can directly import a `repository` class — no enforcement

**2. Package by Feature**
```
com.example.order        (OrderController, OrderService, OrderRepository, Order)
com.example.billing      (BillingController, BillingService, BillingRepository)
com.example.catalog      (CatalogController, CatalogService, CatalogRepository)
```

**Better:**
- Feature changes are localized
- Architecture is more visible
- Still no enforcement — `OrderController` can still call `BillingRepository` directly

**3. Ports and Adapters (Hexagonal)**
```
com.example.domain       (Order, OrderService, OrderRepository interface)
com.example.infrastructure.web        (OrderController)
com.example.infrastructure.database   (JpaOrderRepository)
```

**Good:**
- Domain is isolated
- Infrastructure details are separated
- **But**: nothing in Java prevents the domain from reaching into infrastructure

**4. Package by Component**
```
com.example.web                       (controllers — thin adapters only)
com.example.ordercomponent            (OrderComponent interface — public)
com.example.ordercomponent.internal   (OrderServiceImpl, JpaOrderRepository — package-private)
```

**Best:**
- Components expose only an interface (`OrderComponent`)
- Internals are package-private — **Java's visibility enforces the boundary**
- Controllers can only call through the public interface
- The implementation is encapsulated from the caller

### The Devil: Java's Visibility and Architecture Enforcement

This is Brown's key insight: **architecture that relies on developer discipline fails**. Architecture that is enforced by the language or build tools succeeds.

| Strategy | Java Enforcement | Risk |
|---|---|---|
| Package by layer | None | High — anyone can call anyone |
| Package by feature | None | Medium — features can still cross-call |
| Ports and Adapters | Weak | Medium — domain can import infrastructure |
| Package by component | **Strong** (package-private) | Low — compiler enforces the boundary |

In the "package by component" approach, the `internal` package classes are package-private. No class outside the component package can instantiate or access them. The component's public interface is the only seam.

```java
// Public API of the OrderComponent
package com.example.ordercomponent;
public interface OrderComponent {
    PlaceOrderResult placeOrder(PlaceOrderCommand cmd);
    Optional<OrderSummary> findOrder(OrderId id);
}

// Internal — package-private, invisible outside the component
package com.example.ordercomponent.internal;
class OrderServiceImpl implements OrderComponent { ... }    // package-private
class JpaOrderRepository implements OrderRepository { ... } // package-private
class Order { ... }                                         // package-private
```

A controller in `com.example.web` cannot access `OrderServiceImpl` or `JpaOrderRepository` — they're not visible. It can only call through `OrderComponent`. The architecture is enforced.

### Other Decoupling Modes

If package-private visibility isn't enough (e.g., in multi-module Maven projects), other enforcement mechanisms:

- **Maven module boundaries**: separate modules can only access public APIs of their dependencies
- **ArchUnit tests**: fail the build if any class violates declared dependency rules
- **OSGi**: runtime enforcement of module boundaries (overkill for most projects)

### The Missing Advice

Brown's conclusion: choose a packaging approach that **your tooling can enforce**. Don't rely on team discipline. The best architectural patterns are the ones the compiler and build system can verify.

```java
// ArchUnit: machine-enforced architectural rules
@Test
void domainShouldNotDependOnInfrastructure() {
    noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
        .check(importedClasses);
}

@Test
void controllersShouldOnlyCallComponentInterfaces() {
    classes().that().resideInAPackage("..web..")
        .should().onlyAccessClassesThat().resideInAPackage("..component..")
        .orShould().onlyAccessClassesThat().areInterfaces()
        .check(importedClasses);
}
```

These tests run in CI. Architecture violations fail the build. Developers cannot accidentally violate the dependency rule without the pipeline catching it.

---

## 🔬 Senior Deep Dive

### Choosing the Right Strategy for Your Context

| Context | Recommended Strategy |
|---|---|
| Small team, early project | Package by feature (simplicity) |
| Domain-complex, multiple teams | Ports and Adapters or Package by Component |
| Strict boundaries required | Package by Component + ArchUnit |
| Multi-team with independent deployment | Maven multi-module + Package by Component |
| Microservices | Each service uses Ports and Adapters internally |

### ArchUnit as Architectural Test Suite

A comprehensive ArchUnit test suite becomes the "living architecture document":

```java
class ArchitectureTests {
    JavaClasses classes = new ClassFileImporter()
        .importPackages("com.example");

    @Test void domainHasNoDependencies() {
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure..", "..web..", "org.springframework..")
            .check(classes);
    }

    @Test void useCasesOnlyDependOnDomainAndInterfaces() {
        classes().that().resideInAPackage("..application..")
            .should().onlyDependOnClassesThat()
            .resideInAnyPackage("..domain..", "java..", "..application..")
            .check(classes);
    }

    @Test void noCycles() {
        slices().matching("com.example.(*)..").should().beFreeOfCycles().check(classes);
    }
}
```

This test suite is more reliable than any diagram or document — it runs on every commit.

---

## Summary

| Chapter | Key Insight |
|---|---|
| 33: Case Study | Clean Architecture applied end-to-end: use cases, components, dependency management |
| 34: Package by Layer | No enforcement — architecture is aspiration, not reality |
| 34: Package by Feature | Better, but cross-feature coupling still possible |
| 34: Ports and Adapters | Domain isolation, but language visibility doesn't enforce it |
| 34: Package by Component | Package-private visibility enforces the boundary at compile time |
| 34: Missing Advice | Use tooling (ArchUnit, Maven modules) to machine-enforce architectural rules |
