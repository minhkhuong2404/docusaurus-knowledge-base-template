# Workspace Guidelines

## LeetCode Company-Wise Questions Update
To update the LeetCode companywise questions in this repository based on the Desktop cloned repository:
1. Ensure the cloned repository exists at `/Users/lukhuong/Desktop/leetcode-companywise-interview-questions`.
2. Run the automation script `scratch/update_leetcode_questions.py` inside the workspace `docusaurus-knowledge-base-template`.
   - Command: `python scratch/update_leetcode_questions.py`
   - This script automatically runs `git pull` in the cloned repository to fetch latest tags, parses the CSVs, and updates the markdown files in `docs/technical-knowledge/dsa/leetcode-companywise/`, preserving existing capitalization.
3. Verify that the build completes successfully by running `npm run build` or `npm start`.

## Java Interview Questions Update Progress
The following files in `docs/technical-knowledge/interview-questions/java/` have been updated with senior-level explanations, design diagrams, under-the-hood details, and performance gotchas:
1. `core-java-questions.md` - Core concepts, JIT, tiered compilation, immutability, marker interfaces.
2. `java-experience-interview.md` - Substring memory leak, HashMap load factor, treeification, equals/hashCode contract.
3. `experience-java-questions.md` - ConcurrentHashMap evolution, String literals vs objects, Resilience4j circuit breaker, Saga pattern, Hibernate caching.
4. `java-multithread-questions.md` - Context switching, thread states, Callable/Runnable differences.
5. `concurrent-collection-interview.md` - ConcurrentHashMap evolution (CAS + node locks), null key/value policy.
6. `concurrent-collection-interview-2.md` - modCount, CopyOnWriteArrayList internals, sorting algorithms (TimSort/Quicksort).
7. `break-singleton-questions.md` - Reflection, serialization, cloning, multithreading attacks & prevention (Holder/DCL/Enum).
8. `java-tricky-core-questions.md` - ClassNotFoundException vs NoClassDefFoundError, stream operations (fixing overflow bug), passwords storage.
9. `java-collections-questions.md` - Collection hierarchy, Fail-Fast vs Fail-Safe, BlockingQueue, HashMap internals.
10. `java-collections-questions-p2.md` - ArrayList vs LinkedList, TreeMap/LinkedHashMap, PriorityQueue, key design, Reference types.
11. `java-collection-differences.md` - ArrayList resizing formula, Vector obsolescence, CPU cache locality/misses.
12. `java-comprehensive-interview.md` - N+1 database problem solutions, GC generational memory layout and algorithms.
13. `exception-handling-questions.md` - Layered error propagation, global exception handling, try-with-resources.
14. `java-8-optional.md` - orElse vs orElseGet performance trap, optional anti-patterns.
15. `java-runtime-exception.md` - JVM memory areas (PC, stacks, Metaspace), Classloader delegation model.
16. `java-string-basics.md` - String Constant Pool heap shift, compile-time optimization, String equals() implementation.
17. `java-string-rotation.md` - Concatenation substring check, Left/Right rotation, in-place array rotation.
18. `java-lead-interview-questions.md` - HikariCP sizing, GC logging, container heap vs off-heap context, Strangler Fig, Outbox pattern, JIT optimization timing bugs.
19. `java-8-tricky-questions.md` - Custom collector design, parallel stream commonPool hazards, virtual threads, lambda metafactory.
20. `java-time-questions.md` - SimpleDateFormat thread-safety, DST transitions, Clock mocking, TemporalAdjuster.
21. `tricky-java-interview.md` - HashMap treeification Poisson distribution math, Map vs FlatMap, Metaspace flags/leaks.
22. `spring-boot-questions.md` - Auto-configuration imports flow, BOM version resolution, programmatic web server bootstrap.
23. `spring-boot-real-time-questions.md` - Soft deletes code pattern, Spring WebFlux non-blocking controller stream examples.
24. `sql-interview-questions.md` - Window functions (DENSE_RANK), B-Tree vs Hash indexing, left-prefix rule, Execution plan analysis.

The following files in `docs/technical-knowledge/interview-questions/grokking-java/` have been rewritten:
25. `java-interview-answers-part-1.md` - Java OOP concepts (covariant return types, method hiding, interface default method Diamond problem resolution), thread vs runnable, serialization types, volatile.
26. `java-interview-answers-part-2.md` - CountDownLatch vs CyclicBarrier, DCL volatile reordering, ThreadLocal memory leak (remove() method), thread pool rejection policies, busy spin.
27. `java-interview-answers-part-3.md` - HashMap index bitwise AND logic, custom key immutability, NavigableMap APIs, synchronized collection lock requirements.
28. `java-interview-answers-part-4.md` - Decorator pattern code structure, Liskov Substitution Principle violation/fix code, generational GC promotion flow, G1 GC vs ZGC, GC log times.
29. `java-interview-answers-part-5.md` - Generics PECS wildcard logic (extends vs super), generic type erasure bytecode representation, database transaction isolation levels table, optimistic vs pessimistic SQL locks.

## Build Verification Guidelines
- Do not run `npm run build` automatically to verify changes unless explicitly requested by the user, as the build process is very slow and compiles the entire website.

## Diagram Styling & Animation Guidelines
- Prefer custom interactive React SVG components (like [CircuitBreakerDiagram.tsx](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/components/CircuitBreakerDiagram.tsx)) for core system architectures, state machines, and key visual assets.
- Standard flowchart Mermaid diagrams automatically inherit the dynamic moving arrow effect (background solid conduit + flowing dashed overlay). Ensure that custom styles do not disrupt this global flow animation.
- Always use SVG 2 `context-fill` / `context-stroke` properties on arrowhead markers to ensure they inherit parent hover transitions.

