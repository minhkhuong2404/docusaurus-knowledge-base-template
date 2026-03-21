---
id: items-index
title: All 90 Items — Quick Reference Index
sidebar_label: All 90 Items Index
---

# All 90 Items — Quick Reference Index

A complete index of every item in *Effective Java (3rd Edition)* with links to the relevant chapter documentation.

---

## Chapter 2 — Creating and Destroying Objects

| # | Item | Key Takeaway |
|---|---|---|
| 1 | [Consider static factory methods instead of constructors](./chapter-02-creating-destroying-objects#item-1-consider-static-factory-methods-instead-of-constructors) | Named, cached, flexible return types |
| 2 | [Consider a builder when faced with many constructor parameters](./chapter-02-creating-destroying-objects#item-2-consider-a-builder-when-faced-with-many-constructor-parameters) | Use Builder for 4+ params, especially optional ones |
| 3 | [Enforce the singleton property with a private constructor or an enum type](./chapter-02-creating-destroying-objects#item-3-enforce-the-singleton-property-with-a-private-constructor-or-an-enum-type) | Prefer single-element enum |
| 4 | [Enforce noninstantiability with a private constructor](./chapter-02-creating-destroying-objects#item-4-enforce-noninstantiability-with-a-private-constructor) | Private constructor + `AssertionError` |
| 5 | [Prefer dependency injection to hardwiring resources](./chapter-02-creating-destroying-objects#item-5-prefer-dependency-injection-to-hardwiring-resources) | Pass resources via constructor; enables Spring DI |
| 6 | [Avoid creating unnecessary objects](./chapter-02-creating-destroying-objects#item-6-avoid-creating-unnecessary-objects) | Reuse; avoid `new String("...")`, watch autoboxing |
| 7 | [Eliminate obsolete object references](./chapter-02-creating-destroying-objects#item-7-eliminate-obsolete-object-references) | Null out stale refs; use weak references in caches |
| 8 | [Avoid finalizers and cleaners](./chapter-02-creating-destroying-objects#item-8-avoid-finalizers-and-cleaners) | Implement `AutoCloseable` instead |
| 9 | [Prefer try-with-resources to try-finally](./chapter-02-creating-destroying-objects#item-9-prefer-try-with-resources-to-try-finally) | Cleaner, suppressed exceptions preserved |

---

## Chapter 3 — Methods Common to All Objects

| # | Item | Key Takeaway |
|---|---|---|
| 10 | [Obey the general contract when overriding equals](./chapter-03-methods-common-to-all-objects#item-10-obey-the-general-contract-when-overriding-equals) | Reflexive, symmetric, transitive, consistent |
| 11 | [Always override hashCode when you override equals](./chapter-03-methods-common-to-all-objects#item-11-always-override-hashcode-when-you-override-equals) | Equal objects must have equal hash codes |
| 12 | [Always override toString](./chapter-03-methods-common-to-all-objects#item-12-always-override-tostring) | Include all interesting fields; provide programmatic access |
| 13 | [Override clone judiciously](./chapter-03-methods-common-to-all-objects#item-13-override-clone-judiciously) | Prefer copy constructors/factories |
| 14 | [Consider implementing Comparable](./chapter-03-methods-common-to-all-objects#item-14-consider-implementing-comparable) | Use `Comparator.comparingInt()` chaining; never use subtraction |

---

## Chapter 4 — Classes and Interfaces

| # | Item | Key Takeaway |
|---|---|---|
| 15 | [Minimize the accessibility of classes and members](./chapter-04-classes-and-interfaces#item-15-minimize-the-accessibility-of-classes-and-members) | Make everything as private as possible |
| 16 | [In public classes, use accessor methods, not public fields](./chapter-04-classes-and-interfaces#item-16-in-public-classes-use-accessor-methods-not-public-fields) | Encapsulate with getters/setters |
| 17 | [Minimize mutability](./chapter-04-classes-and-interfaces#item-17-minimize-mutability) | All fields `private final`; functional operations |
| 18 | [Favor composition over inheritance](./chapter-04-classes-and-interfaces#item-18-favor-composition-over-inheritance) | Wrapper/decorator pattern; avoid fragile subclassing |
| 19 | [Design and document for inheritance or else prohibit it](./chapter-04-classes-and-interfaces#item-19-design-and-document-for-inheritance-or-else-prohibit-it) | Never invoke overridable methods from constructors |
| 20 | [Prefer interfaces to abstract classes](./chapter-04-classes-and-interfaces#item-20-prefer-interfaces-to-abstract-classes) | Multiple implementation; mixins; skeletal implementation |
| 21 | [Design interfaces for posterity](./chapter-04-classes-and-interfaces#item-21-design-interfaces-for-posterity) | Default methods can break existing implementations |
| 22 | [Use interfaces only to define types](./chapter-04-classes-and-interfaces#item-22-use-interfaces-only-to-define-types) | Avoid constant interface anti-pattern |
| 23 | [Prefer class hierarchies to tagged classes](./chapter-04-classes-and-interfaces#item-23-prefer-class-hierarchies-to-tagged-classes) | Replace `enum Shape` switch with polymorphism |
| 24 | [Favor static member classes over nonstatic](./chapter-04-classes-and-interfaces#item-24-favor-static-member-classes-over-nonstatic) | Nonstatic holds hidden enclosing instance reference |
| 25 | [Limit source files to a single top-level class](./chapter-04-classes-and-interfaces#item-25-limit-source-files-to-a-single-top-level-class) | Compiler-order dependent bugs otherwise |

---

## Chapter 5 — Generics

| # | Item | Key Takeaway |
|---|---|---|
| 26 | [Don't use raw types](./chapter-05-generics#item-26-dont-use-raw-types) | Use `List<?>` not `List`; raw types only for class literals & instanceof |
| 27 | [Eliminate unchecked warnings](./chapter-05-generics#item-27-eliminate-unchecked-warnings) | Suppress narrowly with comment justifying safety |
| 28 | [Prefer lists to arrays](./chapter-05-generics#item-28-prefer-lists-to-arrays) | Arrays covariant/reified; generics invariant/erased |
| 29 | [Favor generic types](./chapter-05-generics#item-29-favor-generic-types) | Parameterize your classes |
| 30 | [Favor generic methods](./chapter-05-generics#item-30-favor-generic-methods) | Type-safe, flexible utility methods |
| 31 | [Use bounded wildcards to increase API flexibility](./chapter-05-generics#item-31-use-bounded-wildcards-to-increase-api-flexibility) | PECS: Producer Extends, Consumer Super |
| 32 | [Combine generics and varargs judiciously](./chapter-05-generics#item-32-combine-generics-and-varargs-judiciously) | Use `@SafeVarargs` when truly safe |
| 33 | [Consider typesafe heterogeneous containers](./chapter-05-generics#item-33-consider-typesafe-heterogeneous-containers) | `Class<T>` as typed key; basis of Spring `getBean(Class<T>)` |

---

## Chapter 6 — Enums and Annotations

| # | Item | Key Takeaway |
|---|---|---|
| 34 | [Use enums instead of int constants](./chapter-06-enums-and-annotations#item-34-use-enums-instead-of-int-constants) | Type-safe; can have methods and data |
| 35 | [Use instance fields instead of ordinals](./chapter-06-enums-and-annotations#item-35-use-instance-fields-instead-of-ordinals) | Never derive meaning from `ordinal()` |
| 36 | [Use EnumSet instead of bit fields](./chapter-06-enums-and-annotations#item-36-use-enumset-instead-of-bit-fields) | Type-safe, compact, interoperable |
| 37 | [Use EnumMap instead of ordinal indexing](./chapter-06-enums-and-annotations#item-37-use-enummap-instead-of-ordinal-indexing) | Never use `ordinal()` to index arrays |
| 38 | [Emulate extensible enums with interfaces](./chapter-06-enums-and-annotations#item-38-emulate-extensible-enums-with-interfaces) | Enum implements interface for extensibility |
| 39 | [Prefer annotations to naming patterns](./chapter-06-enums-and-annotations#item-39-prefer-annotations-to-naming-patterns) | Type-safe, tool-friendly metadata |
| 40 | [Consistently use the Override annotation](./chapter-06-enums-and-annotations#item-40-consistently-use-the-override-annotation) | Catches wrong-signature bugs at compile time |
| 41 | [Use marker interfaces to define types](./chapter-06-enums-and-annotations#item-41-use-marker-interfaces-to-define-types) | Better than marker annotations when type is needed |

---

## Chapter 7 — Lambdas and Streams

| # | Item | Key Takeaway |
|---|---|---|
| 42 | [Prefer lambdas to anonymous classes](./chapter-07-lambdas-and-streams#item-42-prefer-lambdas-to-anonymous-classes) | Concise; `this` refers to enclosing instance |
| 43 | [Prefer method references to lambdas](./chapter-07-lambdas-and-streams#item-43-prefer-method-references-to-lambdas) | 5 types: static, bound, unbound, constructor, array |
| 44 | [Favor the use of standard functional interfaces](./chapter-07-lambdas-and-streams#item-44-favor-the-use-of-standard-functional-interfaces) | 6 core interfaces; use primitive variants to avoid boxing |
| 45 | [Use streams judiciously](./chapter-07-lambdas-and-streams#item-45-use-streams-judiciously) | Not everything should be a stream |
| 46 | [Prefer side-effect-free functions in streams](./chapter-07-lambdas-and-streams#item-46-prefer-side-effect-free-functions-in-streams) | Use `collect`; avoid `forEach` for computation |
| 47 | [Prefer Collection to Stream as a return type](./chapter-07-lambdas-and-streams#item-47-prefer-collection-to-stream-as-a-return-type) | `Collection` is both `Iterable` and has `stream()` |
| 48 | [Use caution when making streams parallel](./chapter-07-lambdas-and-streams#item-48-use-caution-when-making-streams-parallel) | Measure; wrong data structures degrade performance |

---

## Chapter 8 — Methods

| # | Item | Key Takeaway |
|---|---|---|
| 49 | [Check parameters for validity](./chapter-08-methods#item-49-check-parameters-for-validity) | Use `Objects.requireNonNull`, document, fail fast |
| 50 | [Make defensive copies when needed](./chapter-08-methods#item-50-make-defensive-copies-when-needed) | Copy before checking; use immutable types (`Instant`) |
| 51 | [Design method signatures carefully](./chapter-08-methods#item-51-design-method-signatures-carefully) | ≤4 params; interface types; enums over booleans |
| 52 | [Use overloading judiciously](./chapter-08-methods#item-52-use-overloading-judiciously) | Resolution at compile-time; avoid same-arity overloads |
| 53 | [Use varargs judiciously](./chapter-08-methods#item-53-use-varargs-judiciously) | Require ≥1 arg explicitly; mind array allocation cost |
| 54 | [Return empty collections or arrays, not nulls](./chapter-08-methods#item-54-return-empty-collections-or-arrays-not-nulls) | Return `Collections.emptyList()` / `new Foo[0]` |
| 55 | [Return optionals judiciously](./chapter-08-methods#item-55-return-optionals-judiciously) | For absence; never for containers/arrays/primitives |
| 56 | [Write doc comments for all exposed API elements](./chapter-08-methods#item-56-write-doc-comments-for-all-exposed-api-elements) | `@param`, `@return`, `@throws`; use `{@code}` |

---

## Chapter 9 — General Programming

| # | Item | Key Takeaway |
|---|---|---|
| 57 | [Minimize the scope of local variables](./chapter-09-general-programming#item-57-minimize-the-scope-of-local-variables) | Declare where first used; prefer `for` over `while` |
| 58 | [Prefer for-each loops to traditional for loops](./chapter-09-general-programming#item-58-prefer-for-each-loops-to-traditional-for-loops) | Cleaner; works on any `Iterable` |
| 59 | [Know and use the libraries](./chapter-09-general-programming#item-59-know-and-use-the-libraries) | Use `ThreadLocalRandom`; know `java.util`, `java.util.concurrent` |
| 60 | [Avoid float and double if exact answers are required](./chapter-09-general-programming#item-60-avoid-float-and-double-if-exact-answers-are-required) | Use `BigDecimal`, `int`, or `long` for money |
| 61 | [Prefer primitive types to boxed primitives](./chapter-09-general-programming#item-61-prefer-primitive-types-to-boxed-primitives) | Boxed: identity bugs, NPE, performance cost |
| 62 | [Avoid strings where other types are more appropriate](./chapter-09-general-programming#item-62-avoid-strings-where-other-types-are-more-appropriate) | Use enums, typed keys, value types |
| 63 | [Beware the performance of string concatenation](./chapter-09-general-programming#item-63-beware-the-performance-of-string-concatenation) | Use `StringBuilder` in loops |
| 64 | [Refer to objects by their interfaces](./chapter-09-general-programming#item-64-refer-to-objects-by-their-interfaces) | `Set<>` not `HashSet<>`; enables impl swap |
| 65 | [Prefer interfaces to reflection](./chapter-09-general-programming#item-65-prefer-interfaces-to-reflection) | Create reflectively; access via interface |
| 66 | [Use native methods judiciously](./chapter-09-general-programming#item-66-use-native-methods-judiciously) | JVM is fast; native methods reduce portability and safety |
| 67 | [Optimize judiciously](./chapter-09-general-programming#item-67-optimize-judiciously) | Write good programs first; profile before optimizing |
| 68 | [Adhere to generally accepted naming conventions](./chapter-09-general-programming#item-68-adhere-to-generally-accepted-naming-conventions) | JLS §6.1; `HttpUrl` not `HTTPURL` |

---

## Chapter 10 — Exceptions

| # | Item | Key Takeaway |
|---|---|---|
| 69 | [Use exceptions only for exceptional conditions](./chapter-10-exceptions#item-69-use-exceptions-only-for-exceptional-conditions) | Never for control flow |
| 70 | [Use checked exceptions for recoverable conditions and runtime exceptions for programming errors](./chapter-10-exceptions#item-70-use-checked-exceptions-for-recoverable-conditions-and-runtime-exceptions-for-programming-errors) | Checked = recoverable; Runtime = bug |
| 71 | [Avoid unnecessary use of checked exceptions](./chapter-10-exceptions#item-71-avoid-unnecessary-use-of-checked-exceptions) | Consider Optional or state-testing method |
| 72 | [Favor the use of standard exceptions](./chapter-10-exceptions#item-72-favor-the-use-of-standard-exceptions) | `IAE`, `ISE`, `NPE`, `IOOBE`, `UOE` |
| 73 | [Throw exceptions appropriate to the abstraction](./chapter-10-exceptions#item-73-throw-exceptions-appropriate-to-the-abstraction) | Exception translation with chaining |
| 74 | [Document all exceptions thrown by each method](./chapter-10-exceptions#item-74-document-all-exceptions-thrown-by-each-method) | `@throws` for checked and unchecked |
| 75 | [Include failure-capture information in detail messages](./chapter-10-exceptions#item-75-include-failure-capture-information-in-detail-messages) | Include all relevant field values |
| 76 | [Strive for failure atomicity](./chapter-10-exceptions#item-76-strive-for-failure-atomicity) | Object unchanged after failed operation |
| 77 | [Don't ignore exceptions](./chapter-10-exceptions#item-77-dont-ignore-exceptions) | Log or comment; name variable `ignored` |

---

## Chapter 11 — Concurrency

| # | Item | Key Takeaway |
|---|---|---|
| 78 | [Synchronize access to shared mutable data](./chapter-11-concurrency#item-78-synchronize-access-to-shared-mutable-data) | Sync both reads AND writes; `volatile` for visibility only |
| 79 | [Avoid excessive synchronization](./chapter-11-concurrency#item-79-avoid-excessive-synchronization) | Never call alien methods while holding a lock |
| 80 | [Prefer executors, tasks, and streams to threads](./chapter-11-concurrency#item-80-prefer-executors-tasks-and-streams-to-threads) | `ExecutorService` > raw `Thread`; Spring `@Async` |
| 81 | [Prefer concurrency utilities to wait and notify](./chapter-11-concurrency#item-81-prefer-concurrency-utilities-to-wait-and-notify) | `CountDownLatch`, `ConcurrentHashMap`, `BlockingQueue` |
| 82 | [Document thread safety](./chapter-11-concurrency#item-82-document-thread-safety) | Immutable / unconditional / conditional / not thread-safe |
| 83 | [Use lazy initialization judiciously](./chapter-11-concurrency#item-83-use-lazy-initialization-judiciously) | Holder class idiom for statics; double-check for instances |
| 84 | [Don't depend on the thread scheduler](./chapter-11-concurrency#item-84-dont-depend-on-the-thread-scheduler) | No `yield`, no busy-wait, no thread priorities for correctness |

---

## Chapter 12 — Serialization

| # | Item | Key Takeaway |
|---|---|---|
| 85 | [Prefer alternatives to Java serialization](./chapter-12-serialization#item-85-prefer-alternatives-to-java-serialization) | Use JSON / protobuf in new systems |
| 86 | [Implement Serializable with great caution](./chapter-12-serialization#item-86-implement-serializable-with-great-caution) | Locks implementation; adds testing burden |
| 87 | [Consider using a custom serialized form](./chapter-12-serialization#item-87-consider-using-a-custom-serialized-form) | Serialize logical state; mark impl fields `transient` |
| 88 | [Write readObject methods defensively](./chapter-12-serialization#item-88-write-readobject-methods-defensively) | Defensive copies + invariant checks |
| 89 | [For instance control, prefer enum types to readResolve](./chapter-12-serialization#item-89-for-instance-control-prefer-enum-types-to-readresolve) | Enum singleton is the safest approach |
| 90 | [Consider serialization proxies instead of serialized instances](./chapter-12-serialization#item-90-consider-serialization-proxies-instead-of-serialized-instances) | Proxy delegates to public constructor; safest pattern |
