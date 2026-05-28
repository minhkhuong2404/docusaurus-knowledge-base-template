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

> **Key Topics:** Java Platform Module System (JPMS), `module-info.java` syntax & directives, Named vs. Automatic vs. Unnamed Modules, Service Loader Pattern, CLI tools (`javac`, `java`, `jar`, `jdeps`, `jmod`, `jlink`, `jpackage`), and migration strategies (circular dependency rules).

---

## 🟦 New Learner: The Module System

### 1. Introduction to JPMS and Benefits
The Java Platform Module System (JPMS) groups packages into modules. It addresses the issues of a flat classpath ("JAR hell") by enforcing:
*   **Strong Encapsulation**: A module explicitly controls which packages are accessible outside.
*   **Reliable Configuration**: Dependencies are declared explicitly. The JVM checks them at startup, preventing runtime `NoClassDefFoundError`s.
*   **Performance & Security**: Allows custom JVM runtime builds containing only needed modules, reducing memory footprint and security vulnerability surfaces.
*   **Unique Package Enforcement**: Ensures each package name is unique across all modules.

---

### 2. The `module-info.java` File
Every module requires a `module-info.java` file in its root directory (compiled as `module-info.class`).
*   It must use the `module` keyword instead of `class`/`interface`.
*   Module names follow the standard naming rules of package names (e.g., lowercase, dots allowed, hyphens not allowed).
*   Directives can appear in any order.

```java
module zoo.animal.feeding {
    // Declares that other modules can access this package
    exports zoo.animal.feeding;
}
```

---

### 3. Basic Directives
*   `exports <packageName>`: Exposes a package so other modules can import its public types.
*   `requires <moduleName>`: Declares a compile-time and runtime dependency on another module.
*   `java.base`: The foundation module of the JDK (containing packages like `java.lang`, `java.util`). It is implicitly required by all modules—declaring it explicitly is redundant but legal.

```java
module zoo.animal.care {
    exports zoo.animal.care.medical;
    requires zoo.animal.feeding; // Depends on feeding module
}
```

---

### 4. Compiling, Packaging, and Running Modules
Unlike classpath compilation, modular compilation and execution rely on the **module path** (`--module-path` or `-p`), which replaces the classpath (`-cp`).

#### Compilation
The `-d` option specifies the directory for compiled class files.
```bash
javac -p mods -d feeding feeding/zoo/animal/feeding/*.java feeding/module-info.java
```

#### Packaging
Creating a modular JAR is identical to a standard JAR, packaging the compiled root folder:
```bash
jar -cvf mods/zoo.animal.feeding.jar -C feeding/ .
```

#### Running
Specify the module path and the module name along with the fully qualified class name containing the `main()` method, formatted as `moduleName/packageName.ClassName`:
```bash
java -p mods -m zoo.animal.feeding/zoo.animal.feeding.Task
```
*(Alternative syntax: `--module` instead of `-m`, `--module-path` instead of `-p`)*

---

## 🟣 Senior Deep Dive

### 1. Detailed Directives: Exports, Requires Transitive, and Opens

#### Qualified Exports (`exports ... to ...`)
Restricts access of a package to specific listed modules instead of exposing it to all.
```java
module zoo.animal.talks {
    exports zoo.animal.talks.content to zoo.staff; // Only zoo.staff can access
}
```

#### Transitive Dependencies (`requires transitive`)
If Module A requires Module B transitively, any module that requires Module A automatically obtains readability of Module B (implied readability).
*   Avoids requiring callers to specify redundant dependencies in their `module-info` files.
*   **Rule**: You cannot duplicate the same module name in `requires` and `requires transitive` statements in a single module definition (e.g., compile error).

```java
module zoo.animal.care {
    requires transitive zoo.animal.feeding;
}
```

#### Open Packages and Reflection (`opens` vs. `open module`)
By default, modular types are protected against runtime reflection (deep inspection).
*   `opens <packageName>`: Allows other modules to reflect (read private fields/methods) on that package at runtime. No compile-time access is granted.
*   `opens <packageName> to <moduleName>`: Restricts reflection access to a specific module.
*   `open module <moduleName>`: Opens all packages inside the module for runtime reflection. An `open module` cannot contain `opens` directives inside it (compile error).

```java
open module zoo.animal.talks {
    // All packages open for reflection, no opens directives allowed here
}
```

---

### 2. The Service Loader Pattern
Loose coupling in JPMS is achieved using Services. A **Service** consists of an interface (or abstract class), a service locator, a consumer, and a provider.

```
[Consumer Module] ──► [Service Locator] ──► [Service Provider Interface] ◄── [Provider Module]
```

*   **Service Provider Interface (SPI)**: The interface or abstract class defining the service (e.g., `zoo.tours.api.Tour`).
*   **Service Locator**: Discovers implementations at runtime using `java.util.ServiceLoader`.
    *   The service locator module must declare `uses <SPI-fully-qualified-name>`.
    *   `ServiceLoader.load(SPI.class)` returns an iterable containing loaded providers.
    *   `ServiceLoader.load(SPI.class).stream()` returns a `Stream<Provider<SPI>>` (requiring `.map(Provider::get)`).
*   **Service Provider**: The implementation module.
    *   Must declare `provides <SPI> with <ImplementationClass>`.
    *   The implementation class must have a public no-argument constructor (or a public static `provider()` method returning the instance).
    *   The implementation module does **not** need to export its implementation package.

```java
// Service Locator Module Definition
module zoo.tours.reservations {
    exports zoo.tours.reservations;
    requires zoo.tours.api;
    uses zoo.tours.api.Tour; // Declares SPI usage
}

// Service Provider Module Definition
module zoo.tours.agency {
    requires zoo.tours.api;
    provides zoo.tours.api.Tour with zoo.tours.agency.TourImpl; // Binds implementation
}
```

---

### 3. Comparing Module Types: Named, Automatic, and Unnamed
Understanding where JARs are placed determines how they behave:

| Characteristic | Named Module | Automatic Module | Unnamed Module |
| :--- | :--- | :--- | :--- |
| **Location** | Module Path | Module Path | Classpath |
| **Contains `module-info.java`?** | Yes | No | No (ignored if present) |
| **Module Name** | Defined in `module-info` | `Automatic-Module-Name` in manifest, or derived from JAR filename | None |
| **Exports Packages** | Explicitly declared packages | Exports **all** packages | No packages exported to named modules |
| **Reads Other Modules** | Declared in `module-info` | Reads **all** modules | Reads **all** modules |
| **Access to Classpath** | No | Yes (reads unnamed modules) | Yes |

#### Automatic Module Naming Rules (No manifest entry)
If `Automatic-Module-Name` is not in `META-INF/MANIFEST.MF`, Java derives it from the filename:
1.  Remove `.jar` extension.
2.  Remove version info from the end (e.g., `-1.0.0`, `-RC`).
3.  Replace all non-alphanumeric characters with dots (`.`).
4.  Merge consecutive dots, and strip leading/trailing dots.

```
cat-1.2.3-RC1.jar -> cat
jackson-databind-2.15.jar -> jackson.databind
```

---

### 4. CLI Tool Cheat Sheet for JPMS
*   `javac --module-path <dir> -d <out> <files>`: Compiles modular files.
*   `java --module-path <dir> --list-modules`: Lists all observable modules (including JDK modules).
*   `java --module-path <dir> --describe-module <moduleName>`: (or `-d`) Describes a module's exports and dependencies.
*   `java -p <dir> --show-module-resolution -m <module/class>`: Debugs module loading resolution hierarchy.
*   `jar --file <jarFile> --describe-module`: Describes a modular JAR's definition.
*   `jdeps --module-path <dir> <jarFile>`: Prints static dependency maps of packages/modules.
*   `jdeps -s <jarFile>`: (or `-summary`) Prints module summary only.
*   `jdeps --jdk-internals <jarFile>`: Detects references to unsupported internal JDK APIs (e.g., `sun.misc.Unsafe`) and suggests replacements.
*   `jmod`: Used to work with JMOD files (JDK modular format containing native code). Modes include `create`, `extract`, `describe`, `list`.
*   `jlink --module-path <path> --add-modules <modules> --output <dir>`: Links modular dependencies to create a custom, lightweight Java Runtime Image (no compiler included).
*   `jpackage --name <name> --module-path <path> --module <module/class>`: Packages modular or non-modular JARs into a platform-native self-contained executable installer (e.g. `.exe`, `.dmg`, `.deb`).

---

### 5. Migration Strategies and Cyclic Dependencies
*   **Bottom-Up Migration**: Start with the lowest-level libraries (no dependencies). Turn them into named modules first and move them to the module path. Higher-level code stays on the classpath as unnamed modules.
*   **Top-Down Migration**: Place all JARs on the module path (treating them as automatic modules). Modularize the highest-level application first by adding `module-info.java` requiring the automatic modules.

#### Circular Dependencies
Modular systems do **not** allow circular dependencies (e.g., A requires B, and B requires A).
*   **Compilation Failure**: If circular dependencies exist between modules, the compiler throws an error and code will not compile.
*   **Resolution**: Break the cycle by introducing a third module containing the shared code, or reorganize packages.
*   *(Note: Circular dependencies between packages within the same module are allowed, but discouraged).*

---

## 📝 Exam Quick Reference

### Module Directives Summary
| Directive | Argument | Purpose |
| :--- | :--- | :--- |
| `exports` | Package name | Exposes package public types to other modules. |
| `exports ... to` | Package to Module | Exposes package public types only to specific modules. |
| `requires` | Module name | Declares dependency on a module. |
| `requires transitive` | Module name | Declares transitive dependency (implied readability). |
| `requires static` | Module name | Compile-time optional dependency. |
| `opens` | Package name | Allows runtime reflection on package. |
| `opens ... to` | Package to Module | Restricts runtime reflection on package to listed modules. |
| `uses` | Service Interface | Declares consumer of a service. |
| `provides ... with` | Service with ImplClass | Declares implementation of a service. |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 12]
**Trap 1 — `exports` vs. `opens` compile-time availability:**
*   `exports` makes types available at compile-time and runtime. It does **not** allow reflection on private class members.
*   `opens` does **not** make types available at compile-time (you cannot import classes in an opened package if it is not exported). It only allows runtime reflection.

**Trap 2 — Requiring a Transitive Module by Name:**
If module A has `requires transitive B;`, and module C has `requires A;`, module C can use B without declaring it. However, if C explicitly declares `requires B;`, this is legal (just redundant). Repeating the exact same module name in `requires` and `requires transitive` inside the *same* module-info file is a **compile error**.
```java
module bad.module {
    requires zoo.animal;
    requires transitive zoo.animal; // ❌ DOES NOT COMPILE
}
```

**Trap 3 — Named Modules Accessing the Classpath:**
A named module on the module path cannot declare dependency on (`requires`) or access unnamed modules on the classpath. If you try, the code fails to compile.

**Trap 4 — Location of `module-info.java`:**
The `module-info.java` file must be in the root folder of the module, not inside any package subdirectory.
```
src/zoo.animal/module-info.java // ✅ Correct
src/zoo.animal/zoo/animal/module-info.java // ❌ WRONG
```

**Trap 5 — Missing `uses` or `requires` in Service Locators:**
A service locator module needs:
1.  `requires <service-interface-module>;` (to compile the interface types).
2.  `uses <service-interface-fully-qualified-name>;` (to look up implementations at runtime).
If either is missing, compilation or lookup will fail.

**Trap 6 — Illegal Characters in Module Names:**
Module names can use dots (`.`) but cannot contain hyphens (`-`) or other special characters.

**Trap 7 — Jlink and Automatic/Unnamed Modules:**
`jlink` requires all modules to be named modules. If any dependency is an automatic module or unnamed module, `jlink` fails.

**Trap 8 — Package Split Conflict:**
Java does not allow two different modules to define packages with the exact same name (split package). Doing so results in a compilation error.

**Trap 9 — Service Provider Constructor requirements:**
The implementation class supplied in `provides ... with ...` must have a public no-arg constructor, or a public static `provider()` method returning the instance. If it lacks both, `ServiceLoader` throws a runtime error when trying to instantiate it.

**Trap 10 — Mixing `open module` with `opens` directives:**
An `open module` cannot contain `opens` directives inside the body since all packages are already open.
```java
open module bad {
    opens com.bad; // ❌ DOES NOT COMPILE
}
```
:::

:::tip[Spring/Senior Relevance]
*   **Framework Reflection Access**: Libraries like Spring Boot, Hibernate, and Jackson utilize deep reflection on private entity/bean fields. When modularizing Spring applications, you must use `opens` or `open module` for your controller, service, and entity packages, otherwise runtime DI will fail.
*   **Plugin architectures**: JPMS services provide a native, JVM-level alternative to Spring's dynamic beans, useful in highly decoupled microservices or standalone utilities.
:::

---

## 🔗 Review Questions Focus

1.  What is the difference between `exports com.zoo.animal;` and `exports com.zoo.animal to zoo.staff;`?
2.  If Module X `requires transitive Y`, and Module Z `requires X`, does Z need to declare `requires Y`?
3.  Why does `jlink` fail if one of the dependencies is an automatic module?
4.  Given the file `library-1.5.0-beta.jar` on the module path, what is its automatic module name?
5.  What must a service consumer specify in `module-info.java` to use an interface `com.spi.Parser`?
6.  How does a named module declare that its packages can be inspected by reflection, but not imported at compile time?
7.  What tool is used to identify if an application depends on unsupported internal APIs (like `sun.misc.Unsafe`)?
8.  Why does Java fail to compile modules that contain circular dependencies?
9.  Under what conditions does code in an unnamed module have access to code in a named module?
10. If a service provider implements `provides com.spi.Logger with com.impl.ConsoleLogger`, does `com.impl` need to be exported?
