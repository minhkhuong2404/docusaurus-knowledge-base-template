---
id: chapter-12
title: "Chapter 12 — Modules"
sidebar_label: "Ch 12 · Modules"
description: "Comprehensive guide to the Java Platform Module System (JPMS): module-info.java directives (requires, exports, opens, uses, provides), named/unnamed/automatic modules, ServiceLoader, jlink, jdeps, jpackage, and migration strategies for the OCP exam."
tags:
  - modules
  - jpms
  - module-info
  - requires
  - exports
  - opens
  - service-loader
  - jlink
  - jdeps
  - automatic-modules
---

# Chapter 12 — Modules

<span class="chapter-badge">Exam Domain: Packaging and Deploying Java Code</span>

> **Key Topics:** JPMS (Java Platform Module System), `module-info.java`, `requires`, `exports`, `opens`, services, `jlink`, `jdeps`, `jpackage`, unnamed/automatic modules.

---

## 🟦 New Learner: The Module System

### Why Modules?

Before Java 9, Java had a flat classpath with no real encapsulation between JARs. The **Java Platform Module System (JPMS)** introduced in Java 9 adds:
- **Strong encapsulation** — only explicitly exported packages are accessible
- **Explicit dependencies** — a module declares what it needs
- **Reliable configuration** — missing or duplicate modules are detected at startup

---

### module-info.java

Every module has a `module-info.java` at the **root** of the source tree:

```java
module com.example.myapp {
    // Declare dependencies
    requires java.sql;
    requires java.logging;
    requires transitive java.xml; // transitive: dependents also get java.xml

    // Export packages to everyone
    exports com.example.myapp.api;

    // Export only to specific modules (qualified export)
    exports com.example.myapp.internal to com.example.partner;

    // Open package for deep reflection (needed by frameworks like Spring)
    opens com.example.myapp.model;

    // Open only to specific module (qualified open)
    opens com.example.myapp.entity to org.hibernate.orm;

    // Service declarations
    uses com.example.spi.PaymentProvider;       // consumer
    provides com.example.spi.PaymentProvider     // provider
        with com.example.myapp.PayPalProvider;
}
```

---

### Key Directives

| Directive | Meaning |
|-----------|---------|
| `requires X` | This module depends on module X |
| `requires transitive X` | Dependents of this module also get X |
| `requires static X` | Compile-time only dependency (optional at runtime) |
| `exports pkg` | Makes `pkg` accessible to all modules |
| `exports pkg to M` | Makes `pkg` accessible only to module M |
| `opens pkg` | Allows deep reflection on `pkg` at runtime |
| `opens pkg to M` | Allows deep reflection only by module M |
| `uses SPI` | This module is a consumer of SPI |
| `provides SPI with Impl` | This module is a provider of SPI |

---

### Module Directory Structure

```
src/
  com.example.myapp/
    module-info.java
    com/example/myapp/
      Main.java
      api/
        Service.java
```

Compile:
```bash
javac -d out --module-source-path src -m com.example.myapp
```

Run:
```bash
java --module-path out -m com.example.myapp/com.example.myapp.Main
```

---

### Types of Modules

| Type | Description | Has module-info.java? |
|------|-------------|----------------------|
| Named module | Fully modularized JAR | Yes |
| Unnamed module | JAR on the classpath | No |
| Automatic module | Named JAR on module-path without module-info | No (name from filename) |

---

### Access Control with Modules

| Accessible to | Without Module | With Module |
|--------------|----------------|-------------|
| `public` in exported package | Any code | Only requiring modules |
| `public` in non-exported package | Any code | Nobody outside the module |
| `private` | Same class | Same class |

---

### Command-Line Tools

#### javac module options
```bash
javac --module-source-path src       # source root for modules
      --module-path mods             # where to find module dependencies
      -d out                         # output directory
      -m com.myapp                   # compile specific module
```

#### java module options
```bash
java --module-path mods
     --module com.myapp/com.myapp.Main
     --add-modules java.sql          # add optional modules
     --add-opens java.base/java.lang=ALL-UNNAMED  # open for reflection
```

#### jar
```bash
jar --create --file myapp.jar --main-class com.myapp.Main -C out .
```

#### jdeps — dependency analysis
```bash
jdeps --module-path mods myapp.jar   # show module dependencies
jdeps --generate-module-info out myapp.jar  # generate module-info.java
```

#### jlink — create custom runtime image
```bash
jlink --module-path $JAVA_HOME/jmods:mods \
      --add-modules com.myapp \
      --output myapp-runtime
```

#### jpackage — create native installer
```bash
jpackage --name MyApp \
         --module-path mods \
         --module com.myapp/com.myapp.Main \
         --type exe   # or dmg, deb, rpm
```

---

## 🟣 Senior Deep Dive

### Service Loader Pattern

The `ServiceLoader` API enables plug-in architectures:

```java
// SPI (service provider interface) — in a separate module
public interface SearchEngine {
    List<String> search(String query);
}

// Consumer module — uses the service
module com.myapp {
    uses com.spi.SearchEngine;
}

// Implementation module — provides the service
module com.google.search {
    requires com.spi;
    provides com.spi.SearchEngine with com.google.search.GoogleSearchEngine;
}

// Consumer code
ServiceLoader<SearchEngine> loader = ServiceLoader.load(SearchEngine.class);
for (SearchEngine engine : loader) {
    engine.search("Java modules");
}
```

### `exports` vs `opens`

| Feature | `exports` | `opens` |
|---------|-----------|---------|
| Public type access | ✅ | ✅ |
| Reflection (private members) | ❌ | ✅ |
| Needed for frameworks | Sometimes | Usually (Spring, Hibernate) |
| Available at compile time | ✅ | ❌ (runtime only) |

### Automatic Module Name from JAR

When a JAR without `module-info.java` is placed on the **module-path**, Java creates an automatic module whose name comes from:

1. `Automatic-Module-Name` entry in `MANIFEST.MF` (preferred)
2. JAR filename — dots replace hyphens, version stripped

```
my-library-1.2.3.jar → automatic module name: my.library
```

### Migration Strategies

**Bottom-up:** Start with libraries (low-level modules), work up to the app. Best when you control all the code.

**Top-down:** Start with the app, treat dependencies as automatic modules. Good when using third-party libs.

```
Bottom-up:  lib1 → lib2 → app      (modularize leaves first)
Top-down:   app → [auto-module lib1] → [auto-module lib2]
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| `requires transitive` | Dependents of this module also get that dependency (implied readability) |
| `requires static` | Compile-time only; optional at runtime (e.g., annotation processors) |
| `exports` | Makes package publicly accessible to other modules |
| `exports X to M` | Qualified export — only module M can access package X |
| `opens` | Allows deep reflection (runtime only — no compile-time access) |
| `opens X to M` | Qualified open — only module M can reflect on package X |
| Unnamed module | Classpath code; reads ALL named modules; cannot be required by name |
| Automatic module | JAR on module-path without `module-info`; exports all packages, reads all modules |
| `jlink` | Creates minimal custom runtime image containing only required modules |
| `jdeps` | Analyzes class/module dependencies; can generate `module-info.java` |
| `jpackage` | Creates platform native installer (exe, dmg, deb, rpm) |
| `ServiceLoader` | Runtime discovery via `uses`/`provides` directives |
| `module-info.java` | Must be at the **root** of the module's source directory |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 12]
**Trap 1 — `exports` vs `opens` — what each allows:**
```java
module com.myapp {
    exports com.myapp.api;   // ✅ compile-time AND runtime access to public types
    opens com.myapp.model;   // ✅ runtime deep reflection (private fields too)
    // A package can be both exported AND opened
}
// exports alone: no reflection on private members
// opens alone: reflection OK, but no compile-time import of types
```

**Trap 2 — Unnamed module vs automatic module:**
```java
// Unnamed module = JAR on CLASSPATH:
// - Has no name → cannot be 'required' by named modules
// - Reads ALL named modules automatically
// - All its packages are accessible to other unnamed modules

// Automatic module = JAR on MODULE-PATH (no module-info.java):
// - Gets a name derived from JAR filename
// - Exports ALL its packages
// - Reads ALL other modules (named and unnamed)
// - Named modules CAN require it
```

**Trap 3 — `requires transitive` creates implied readability:**
```java
module A { requires transitive B; }
module C { requires A; }
// C can now use types from B WITHOUT explicitly requiring B
// This is essential for library APIs that expose types from their dependencies
```

**Trap 4 — `module-info.java` location matters:**
```java
// CORRECT structure:
src/
  com.myapp/
    module-info.java   ← must be here (root of module source)
    com/myapp/Main.java

// WRONG — module-info.java inside a package directory won't work
```

**Trap 5 — Service provider binding:**
```java
// Consumer declares: uses com.spi.Engine;
// Provider declares: provides com.spi.Engine with com.impl.TurboEngine;
// TurboEngine MUST:
//   1. Implement (or extend) Engine
//   2. Have a public no-arg constructor OR a public static provider() method
// ServiceLoader.load(Engine.class) discovers providers at runtime
```

**Trap 6 — Automatic module name from JAR filename:**
```java
// Rules:
// 1. Strip version suffix: my-lib-1.2.3.jar → my-lib
// 2. Replace hyphens with dots: my-lib → my.lib
// 3. Remove leading/trailing dots
// Examples:
// spring-core-6.0.jar → spring.core
// jackson-databind-2.15.jar → jackson.databind
// Prefer MANIFEST.MF "Automatic-Module-Name" header to control the name
```

**Trap 7 — `jlink` only works with named modules:**
```java
// jlink CANNOT package unnamed modules or automatic modules
// All dependencies must be proper named modules with module-info.java
// This is why migrating to modules is required before using jlink
jlink --module-path $JAVA_HOME/jmods:mods \
      --add-modules com.myapp \
      --output runtime-image
```
:::

:::tip[Spring/Senior Relevance]
- Spring Boot 3.x added experimental JPMS support — `opens` directives are required for Spring's reflection-based dependency injection to work on `private` fields in your `@Component` classes.
- `requires transitive` mirrors Spring's concept of transitive bean dependencies — if your `@Configuration` class exposes beans that return types from another library, consumers of your config get access to those types.
- The `ServiceLoader` pattern is the foundation for Spring Boot's auto-configuration mechanism (`spring.factories` / `AutoConfiguration.imports`) — a Java-native SPI that Spring Boot extends with its own discovery layer.
:::

---

## 🔗 Review Questions Focus

1. What is the difference between `exports` and `opens`?
2. How does `requires transitive` differ from `requires`?
3. What is an automatic module and how is its name determined?
4. What tool creates a custom runtime image?
5. What directive does a service consumer use vs a service provider?
6. Can a named module require an unnamed module?
7. What is the difference between bottom-up and top-down module migration?
8. What does `jdeps` do?
9. Can an automatic module be required by a named module?
10. What must be true for a class to be a valid service provider?
