---
id: java-classloaders-metaspace
title: "Java ClassLoaders Delegation & Metaspace Internals"
sidebar_label: "ClassLoaders & Metaspace"
sidebar_position: 7
description: Comprehensive principal engineering guide to Java ClassLoader delegation hierarchies, child-first class loading in web servers, Metaspace off-heap native memory chunk architecture, and class unloading leak diagnostics.
tags: [java, jvm, classloader, metaspace, delegation, child-first, memory-leaks, off-heap]
---

# 🧬 Java ClassLoaders Delegation & Metaspace Internals

In the Java Virtual Machine, classes are not loaded monolithically at startup. They are loaded lazily on-demand, linked, and materialized in native **Metaspace** memory through a tree of **ClassLoaders**.

Understanding the delegation model and Metaspace memory layout is vital for architecting plugin systems, modular web runtimes, and diagnosing critical `OutOfMemoryError: Metaspace` leaks.

---

## 1. The ClassLoader Delegation Hierarchy

```
                  ┌─────────────────────────────────────────┐
                  │ 1. Bootstrap ClassLoader (Native C++)   │
                  │    • Loads core JDK classes: java.base  │
                  │    • Represented as 'null' in Java API  │
                  └────────────────────▲────────────────────┘
                                       │ (Delegates Parent First)
                  ┌────────────────────┴────────────────────┐
                  │ 2. Platform ClassLoader (JDK 9+ Modules)│
                  │    • Loads java.sql, java.xml, etc.     │
                  │    • Formerly Extension ClassLoader     │
                  └────────────────────▲────────────────────┘
                                       │ (Delegates Parent First)
                  ┌────────────────────┴────────────────────┐
                  │ 3. System / App ClassLoader (Classpath) │
                  │    • Loads application classes from     │
                  │      -classpath, -jar, and Main class   │
                  └────────────────────▲────────────────────┘
                                       │ (Custom Delegation)
         ┌─────────────────────────────┴─────────────────────────────┐
         │                                                           │
┌────────┴───────────────────────────┐     ┌─────────────────────────┴─────────┐
│ 4a. Tomcat WebAppClassLoader       │     │ 4b. OSGi Bundle ClassLoader       │
│     (Child-First Delegation)       │     │     (Peer-to-Peer Modular Graph)  │
└────────────────────────────────────┘     └───────────────────────────────────┘
```

### The Parent-First Delegation Principle
Under standard parent-first delegation (`ClassLoader.loadClass()`):
1. Check if the class is already cached in memory (`findLoadedClass()`).
2. If not cached, delegate to the parent ClassLoader (`parent.loadClass()`).
3. Only if all parents fail to find the class does the current loader invoke its own `findClass()` to read bytecode from disk or network.

### The Child-First Exception (Web Servers & Containers)
In web servers (such as Apache Tomcat) and OSGi runtimes:
* **The Problem**: WebApp A requires Spring 5.3, while WebApp B requires Spring 6.1. If the parent container loads Spring, both webapps are forced into a version clash.
* **Child-First Resolution**: Tomcat's `WebAppClassLoader` overrides `loadClass()`:
  1. Checks local `/WEB-INF/classes` and `/WEB-INF/lib` **first**.
  2. If the class exists locally, loads it immediately, isolating the web application from the container's libraries.
  3. **Strict Boundary**: Core `java.*` classes are **never** loaded child-first; they must always delegate to the Bootstrap ClassLoader for security.

---

## 2. Metaspace Architecture & Memory Allocation

In Java 8, the legacy **PermGen** (Permanent Generation) was replaced by **Metaspace**, which allocates class metadata in **off-heap native memory**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ METASPACE NATIVE MEMORY ARCHITECTURE                                        │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Compressed Class Space (-XX:CompressedClassSpaceSize=1G)                │ │
│ │ • Stores native Klass structures for 32-bit compressed klass pointers   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Non-Class Metaspace (Chunk Allocator)                                   │ │
│ │ • Method bytecode, Constant Pools, Annotations, Symbol Tables           │ │
│ │ • Allocated in arena chunks: 4KB (Small), 64KB (Medium), Specialized    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### When Can a Class Be Unloaded?
Unlike heap objects that are reclaimed as soon as they become unreachable from GC roots, a class in Metaspace can **only be unloaded if all three conditions are simultaneously met**:
1. Zero instances of the class exist on the Java heap.
2. The `java.lang.Class` object is no longer referenced anywhere.
3. The **`ClassLoader` that loaded the class** is completely unreachable and collected by GC.

---

## 3. The ThreadLocal Thread-Pool Metaspace Leak

The most prevalent Metaspace leak in enterprise Java stems from worker thread pools:

```
[Tomcat Worker Thread (Pooled, Never Dies)]
               │
               ▼ (ThreadLocal Map)
       [ThreadLocal Key] ──► [MyContext Object]
                                     │
                                     ▼
                           [WebAppClassLoader]
                                     │
                                     ▼
                    [Pinned Metaspace Native Memory!]
```

* **The Hazard**: A web request handler sets a `ThreadLocal<MyContext>` inside a worker thread. When the web application is redeployed, the application ClassLoader should be garbage collected.
* **The Root Cause**: Because worker threads are pooled and **never terminate**, the `ThreadLocal` value on the worker thread retains a reference to `MyContext`, which points to its `ClassLoader`.
* **The Consequence**: The entire ClassLoader, its classes, and all associated Metaspace native chunks are **pinned forever**, causing `java.lang.OutOfMemoryError: Metaspace` after 3 or 4 application redeployments.

---

## 4. Principal Architect Review Checklist

- [ ] **Thread Context ClassLoader Cleanliness**: Are thread pools configured to reset `Thread.currentThread().setContextClassLoader(null)` or clean up `ThreadLocal` entries upon worker task completion?
- [ ] **Metaspace Sizing Guardrails**: Is `-XX:MaxMetaspaceSize` explicitly configured alongside `-XX:CompressedClassSpaceSize` to prevent container memory exhaustion (OOMKilled)?
- [ ] **Child-First Isolation Rules**: Do custom plugin or module ClassLoaders strictly delegate `java.*` and `javax.*` packages to the parent to maintain JVM security boundaries?
- [ ] **Metaspace Monitoring in JFR**: Is `jdk.MetaspaceSummary` monitored to identify high water mark expansion rates?

---

## Related Documentation

- [JVM Bytecode Instructions, invokedynamic & Java Agents](./java-dynamic-bytecode-agents.md)
- [JVM Internals: Memory, GC & Class Loading](./java-jvm.md)
- [Java Object Layout (JOL) & Memory Architecture](./java-object-layout-memory.md)
- [Diagnostics & Production Troubleshooting](./java-diagnostics-troubleshooting.md)
