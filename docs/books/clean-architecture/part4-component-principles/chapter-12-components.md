---
id: chapter-12-components
title: "Chapter 12: Components"
sidebar_position: 1
description: >
  Components are the units of deployment — JARs, DLLs, shared libraries. Martin traces their history from early relocatable binaries to modern package managers, establishing the foundation for the component cohesion and coupling principles that follow.
tags:
  - components
  - deployment
  - jar
  - linkers
  - history
  - architecture
---

# Chapter 12: Components

> _"Components are the units of deployment. They are the smallest entities that can be deployed as part of a system."_

## 🎓 For New Learners

### What Is a Component?

A **component** is the smallest deployable unit:
- In Java: a **JAR file**
- In .NET: a **DLL**
- In compiled C: a **shared library (.so / .dll)**
- In JavaScript: an **npm package**

Components are what you ship. They can be combined into a single executable or deployed as independently upgradeable pieces of a larger system.

### A Brief History: Why Components Matter

In the early days of programming (1950s–60s), programs were tiny and loaded directly into memory starting at a fixed address. Functions from libraries were copied directly into the binary — if you needed a sorting routine, the whole routine was embedded in your program.

As programs grew, this became painful. Memory was scarce. You didn't want multiple programs each carrying their own copy of the same library. The solution: **relocatable binaries** and **linkers**.

**Linkers** allowed programmers to keep library functions in separate files. At link time, the linker stitched them together into a single executable. This was slow (linking could take hours), but programs could share library code.

**Dynamic linking** (shared libraries, loaded at runtime) solved the remaining issues: multiple programs share one in-memory copy of a library. Change the library, all programs that use it benefit — without relinking.

### Modern Components: Still the Same Idea

Today's JAR files, npm packages, and Maven artifacts are the direct descendants of these relocatable binaries. The principles are the same:

- Components can be developed independently
- Components can be tested independently
- Components can be deployed independently
- Components can be versioned independently

The chapters that follow (13 and 14) explain the principles that govern **how components should be organized** — which classes belong together, and how components should depend on each other.

---

## 🔬 Senior Deep Dive

### The Plugin Nature of Components

A key insight from the history: dynamic linking enables **plugin architectures**. At runtime, a program loads components it didn't know about at compile time. This is the foundation for:

- OSGi bundles in enterprise Java
- Spring Boot auto-configuration (discovers and wires `@AutoConfiguration` classes from JARs on the classpath)
- Java ServiceLoader (discovers implementations of an interface from JARs)

Martin's point: component architecture is not a new idea — it's the natural evolution of how programs have been organized since the 1950s. What's changed is the scale and the tooling.

### Maven Multi-Module Architecture

In a Spring application, components map naturally to Maven modules:

```
my-ecommerce-app/
├── pom.xml                      (parent POM)
├── domain/                      (JAR: pure domain — no Spring)
│   └── src/main/java/
│       └── com/example/domain/
├── application/                 (JAR: use cases — depends on domain)
├── infrastructure/              (JAR: JPA, Kafka, etc. — depends on domain)
├── web-adapter/                 (JAR: Spring MVC — depends on application)
└── app/                         (JAR: Spring Boot main — depends on all)
```

Each `pom.xml` declares only the components it needs. The `domain` module has **no framework dependencies**. The `infrastructure` module has JPA. The `web-adapter` has Spring MVC. This matches the Clean Architecture rings as Maven artifacts.

### Component Granularity — The Coming Challenge

Components being small and independently deployable is desirable — but choosing the right granularity is difficult. Too fine: hundreds of tiny JARs, dependency hell, deployment complexity. Too coarse: one JAR that must always be deployed as a unit, no independent evolution.

The next two chapters (Component Cohesion and Component Coupling) provide the principles for making these decisions correctly.

### Build Tools as Architecture Enforcement

Maven/Gradle module boundaries can **enforce** architectural constraints:

```xml
<!-- domain/pom.xml — enforces: no Spring, no JPA allowed -->
<dependencies>
    <!-- intentionally empty or only test-scope dependencies -->
</dependencies>
```

If a developer tries to add a Spring dependency to the domain module, the build fails. The architecture is machine-enforced, not just convention-enforced.

ArchUnit provides runtime enforcement:

```java
@Test
void domainShouldNotDependOnSpring() {
    JavaClasses classes = new ClassFileImporter().importPackages("com.example.domain");
    noClasses().that().resideInAPackage("com.example.domain..")
        .should().dependOnClassesThat().resideInAPackage("org.springframework..")
        .check(classes);
}
```

---

## Summary

| Concept | Key Point |
|---|---|
| Component | Smallest deployable unit — JAR, DLL, shared library |
| History | Evolved from relocatable binaries and linkers to modern package managers |
| Dynamic linking | Enables plugin architectures — load implementations at runtime |
| Maven modules | Each Clean Architecture ring maps to a Maven module with controlled dependencies |
| Next chapters | Chapter 13: which classes belong in which component; Chapter 14: how components depend on each other |
