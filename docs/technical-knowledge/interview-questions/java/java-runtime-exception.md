---
id: java-runtime-exceptions
title: Java Runtime & Exception Propagation
sidebar_label: Runtime & Exceptions
description: "Interview notes on JVM runtime architecture and exception propagation in Java applications."
tags: [java, interview, jvm, exception-handling]
---

# Java Runtime Architecture and Exception Propagation

This section explores how Java code is executed by the JVM and how exceptions move through the call stack.

## 1. Why is Java Platform Independent?

Java follows the **WORA (Write Once, Run Anywhere)** principle through a two-layer execution model:

1. **Compilation:** `javac` converts source code (`.java`) into **Bytecode** (`.class` files) — a standardized, platform-neutral binary format.
2. **Execution:** The **JVM** (Java Virtual Machine) translates bytecode into platform-specific machine instructions at runtime.

### The Key Insight
**Java code is platform-independent, but the JVM is not.** Each OS has its own JVM implementation:

| Platform | JVM Implementation |
|:---------|:------------------|
| Linux x86_64 | HotSpot (Oracle/OpenJDK), OpenJ9 (Eclipse) |
| macOS ARM64 | HotSpot with Apple Silicon optimizations |
| Windows x64 | HotSpot, GraalVM |
| Containers | Same JVM, but needs container-awareness (Java 10+) |

The bytecode format is standardized in the **JVM Specification** (JSR 924). Any compliant JVM must execute the same bytecode identically (modulo timing and optimization differences).

### Bytecode Structure
Every `.class` file starts with the magic number `0xCAFEBABE` and contains:
- **Constant Pool** — literals, class/method/field references
- **Access Flags** — public, final, abstract, etc.
- **Method bytecode** — stack-based instructions (`iload`, `iadd`, `invokevirtual`, etc.)

## 2. Java Runtime Memory Areas

The JVM manages memory in several distinct runtime data areas:

| Memory Category | Sub-Area Components | Thread Access Model | Contents & Management Model |
|---|---|---|---|
| **Per-Thread (Private)** | **JVM Stack** (`-Xss`)<br />**PC Register**<br />**Native Method Stack** | Isolated to owning thread | Stack frames (local variables array, operand stack, frame data); lifecycle tied directly to method invocation. |
| **Shared (All Threads)** | **Heap** (`-Xmx` / `-Xms`)<br />**Metaspace** (`-XX:MaxMetaspaceSize`)<br />**String Pool**<br />**Code Cache** | Shared across entire JVM process | All Java object instances, class metadata, interned string literals, and JIT-compiled C2 native machine code. Managed by GC. |
| **Native / Off-Heap** | **Direct Buffers** (NIO / Netty)<br />**OS Thread Memory**<br />**JNI Libraries** | Kernel & Native runtime | Bypasses JVM garbage collection; allocates raw off-heap memory via `sun.misc.Unsafe` / native C wrappers. |

### Per-Thread Memory Areas

**JVM Stack:** Each thread has its own stack. Each method call creates a **stack frame** containing:
- **Local variables array** — method parameters + local vars (primitives stored directly, objects stored as references)
- **Operand stack** — temporary values for bytecode operations
- **Frame data** — return address, exception table reference

**Default stack size:** ~512KB–1MB per thread. Override with `-Xss512k`. With 200 threads, stack memory alone is ~100-200MB.

**PC (Program Counter) Register:** Holds the address of the JVM instruction currently being executed. For native methods, the PC is undefined.

### Shared Memory Areas

**Heap:** Where ALL object instances live. Divided into generations for GC:
- **Young Generation** (Eden + Survivor S0/S1) — new objects, Minor GC
- **Old Generation** — long-lived objects, Major GC

Configured with: `-Xms` (initial), `-Xmx` (maximum), e.g., `-Xms512m -Xmx2g`

**Metaspace (Java 8+):** Replaced PermGen. Stores class metadata in **native memory** (not heap). Grows dynamically by default. Limit with `-XX:MaxMetaspaceSize=256m`.

## 3. Interpreter vs. JIT Compiler

The JVM uses an **adaptive optimization** strategy:

### Interpreter
- Reads and executes bytecode **one instruction at a time**
- **Pros:** Fast startup, no compilation delay
- **Cons:** Slow for repeatedly executed code (no optimization)

### JIT (Just-In-Time) Compiler
- Monitors execution and identifies **hot methods** (executed frequently)
- Compiles hot bytecode into **optimized native machine code**
- Stores compiled code in the **Code Cache** for reuse

### Tiered Compilation (Default since Java 8)

| Tier | Compiler | Trigger | Optimizations |
|:-----|:---------|:--------|:-------------|
| 0 | Interpreter | Always starts here | None — collects profiling data |
| 1 | C1 (Client) | ~1,500 invocations | Basic optimizations, no profiling |
| 2 | C1 | ~2,000 invocations | With invocation counters |
| 3 | C1 | ~5,000 invocations | Full profiling (type checks, branch stats) |
| 4 | C2 (Server) | ~10,000 invocations | Aggressive: inlining, escape analysis, loop unrolling, dead code elimination |

### Key C2 Optimizations

**Method Inlining:** Replaces a method call with the method's body, eliminating call overhead:
```java
// Before inlining
int result = add(a, b);
// After inlining (by JIT)
int result = a + b; // No method call overhead
```

**Escape Analysis:** If an object doesn't "escape" the method (not returned, not stored in a field), the JIT can:
1. **Stack-allocate** it (no heap allocation, no GC)
2. **Scalar replace** it (decompose into individual fields on the stack)
3. **Eliminate locks** on it (no other thread can access it)

**Deoptimization:** If the JIT's assumptions become invalid (e.g., a new class is loaded that invalidates an optimistic type check), the compiled code is discarded and the method falls back to interpretation.

## 4. Class Loader Subsystem

The Class Loader loads `.class` files into the JVM through three phases:

### Phase 1: Loading
Finds and imports the binary class data. Uses a **delegation model**:

```
Bootstrap ClassLoader (rt.jar, java.base)
    ↑ delegates to parent first
Extension/Platform ClassLoader (jdk.* modules)
    ↑ delegates to parent first
Application ClassLoader (classpath, -cp)
    ↑ delegates to parent first
Custom ClassLoaders (web apps, plugins)
```

**Delegation model:** When asked to load a class, a classloader first asks its **parent**. Only if the parent fails does the child attempt to load. This ensures core Java classes (`java.lang.String`) are always loaded by the Bootstrap ClassLoader, preventing malicious replacements.

### Phase 2: Linking
1. **Verification:** Validates bytecode structure (magic number, version, type safety)
2. **Preparation:** Allocates memory for static variables and sets them to default values (`0`, `null`, `false`)
3. **Resolution:** Converts symbolic references (e.g., `"java/lang/String"`) to direct memory references

### Phase 3: Initialization
Executes static initializers and assigns values to static fields:
```java
class Config {
    static int MAX_RETRIES = 3;        // Assigned during initialization
    static {
        System.out.println("Config loaded"); // Executed during initialization
    }
}
```

**When does initialization happen?** Only on first **active use**:
- `new Config()`
- Accessing a static field: `Config.MAX_RETRIES`
- Calling a static method: `Config.getDefault()`
- Reflection: `Class.forName("Config")`

**NOT triggered by:** Declaring a variable of the type, accessing a `final static` constant (inlined by compiler).

## 5. What is Exception Propagation?

Exception propagation occurs when an exception is not caught in the method where it occurred and "bubbles up" the call stack.

### The Mechanism

```java
void methodA() {
    methodB();  // ← Exception propagates here after methodB fails
}

void methodB() {
    methodC();  // ← Exception propagates here after methodC fails
}

void methodC() {
    throw new ArithmeticException("/ by zero"); // Exception originates here
}
```

### Step-by-step:
1. `methodC()` throws `ArithmeticException`
2. JVM looks for a matching `catch` block in `methodC()` — **not found**
3. `methodC()`'s stack frame is **popped** (removed from the call stack)
4. JVM looks for a matching `catch` block in `methodB()` — **not found**
5. `methodB()`'s stack frame is popped
6. JVM looks for a matching `catch` block in `methodA()` — **not found**
7. Process continues until `main()` is reached
8. If still uncaught: the thread's `UncaughtExceptionHandler` is invoked, and the thread terminates

### Checked vs. Unchecked Propagation

| Type | Propagation Rule | Example |
|:-----|:----------------|:--------|
| **Unchecked** (RuntimeException) | Propagates silently — no `throws` declaration needed | `NullPointerException`, `ArithmeticException` |
| **Checked** (Exception) | Must be explicitly declared with `throws` at every level | `IOException`, `SQLException` |

```java
// Checked: every method in the chain must declare it
void readFile() throws IOException {    // Must declare
    new FileInputStream("missing.txt"); // Throws IOException
}

// Unchecked: propagates without declaration
void divide() {        // No throws needed
    int x = 1 / 0;    // ArithmeticException propagates silently
}
```

### `finally` Block Execution During Propagation

The `finally` block executes **even during propagation** — as each method's stack frame is unwound:

```java
void methodB() {
    try {
        methodC(); // throws
    } finally {
        cleanup(); // STILL RUNS even though there's no catch block
    }
    // Exception continues propagating to methodA() after cleanup()
}
```

---