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

## MANDATORY: Interactive Diagram Creation Rules

**Before creating ANY diagram component, you MUST read the full design specification at:**
[`.agents/skills/design-diagrams/references/DESIGNS.md`](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/.agents/skills/design-diagrams/references/DESIGNS.md)

### When to create an interactive diagram

Replace static content (ASCII art, ```` ```mermaid ``` ```` blocks, plain markdown tables) with a React component whenever the section covers:
- A protocol handshake or multi-step sequence flow
- A system architecture with interconnected nodes/services
- A comparison table with more than 4 rows
- A reference list users need to search or filter (headers, status codes, config options)
- A production checklist or audit criteria

### Mandatory implementation rules

1. **File location**: Always create in `src/components/<ConceptName>Diagram.tsx`.
2. **Outer wrapper**: Always use `className="interactive-diagram-container"` — never a bare `<div>`.
3. **Header bar**: Always include a header with an `<svg>` icon (never emoji) and a descriptive title. Use the `.interactive-diagram-header` CSS class pattern from DESIGNS.md. Style the icon with a distinct accent color from the palette, the title text with the primary theme color (e.g. `#34d399`), and match any action buttons to this theme scheme.
4. **Color tokens**: Use only the curated hex palette from DESIGNS.md Section 3. Never use plain CSS color names (`red`, `blue`, etc.).
5. **CSS variables for text**: Always use `var(--ifm-color-content)` and `var(--ifm-color-content-secondary)` for body text — this handles light/dark mode automatically.
6. **No emoji in JSX headers**: Use inline `<svg>` icons from the icon library in DESIGNS.md Section 6.
7. **Ternary safety**: Always resolve all branches in nested ternaries. Dangling ternaries cause Rspack build failures.
8. **SVG markers**: Always set `fill="context-fill"` on `<marker>` path elements for hover-aware arrowheads. When using colored paths, define specific colored `<marker>` elements in `<defs>` and apply them dynamically to ensure the arrowhead color matches the path body color exactly.
9. **Responsive Grid Columns**: In multi-column (split pane) layouts, avoid flexible fractional columns like `1.2fr 1fr` which shift when text content wraps. Use fixed percentage grids (e.g., `55% 45%`, `align-items: start`) and embed an inline `<style>` media query block to wrap columns to `1fr` on screens smaller than `768px`.
10. **Node & Lifeline Spacing**: For both sequence diagrams and state/flow charts, add gap offsets to arrow coordinates (e.g. `+6px` start, `-12px` target) so that path lines and arrowhead tips float cleanly and do not overlap or touch vertical sequence lifelines or block nodes.

### Choose the right archetype (full templates in DESIGNS.md Section 5)

| Content Type | Archetype |
|---|---|
| Protocol handshake / sequence / request-response flow | **A — Animated Flow** |
| Architecture with nodes and directed edges | **B — SVG Node Graph** |
| Feature comparison / protocol evolution / tabs | **C — Tabbed Explorer** |
| Lookup reference (headers, status codes, options) | **D — Searchable List** |
| Pre-launch audit / review criteria | **E — Interactive Checklist** |

### Integration into markdown

```markdown
import MyDiagram from '@site/src/components/MyDiagram';

<MyDiagram />
```

- Imports go immediately after the frontmatter `---` block.
- Replace the static block (ASCII, code block, or table) entirely with the JSX tag.
- Verify with the running dev server: look for `client (Rspack) compiled successfully`.

### Existing component index

Before creating a new component, check whether one already exists for the concept:

| Component | What it shows |
|---|---|
| `HttpWhatIsDiagram` | HTTP request-response flow, stateless concept |
| `HttpIntroDiagram` | HTTP request anatomy (method / headers / body) |
| `HttpMethodDecisionDiagram` | Flowchart for choosing GET/POST/PUT/PATCH/DELETE |
| `HttpStatusCodesDiagram` | Interactive 2xx/3xx/4xx/5xx explorer with confusion pairs |
| `HttpHeadersDiagram` | Searchable request/response/security header reference |
| `HttpCachingDiagram` | Cache-Control directives + ETag flow |
| `HttpEvolutionDiagram` | HTTP/1.1 → HTTP/2 → HTTP/3 comparison |
| `QuicStackDiagram` | QUIC vs TCP/TLS protocol stack |
| `TlsHandshakeDiagram` | TLS 1.3 handshake animated sequence |
| `CertChainDiagram` | Certificate chain of trust (Root → Intermediate → Leaf) |
| `CorsDiagram` | CORS preflight flow (browser → server) |
| `ProductionChecklistDiagram` | HTTP production readiness checklist with progress |
| `CircuitBreakerDiagram` | Circuit breaker state machine (Closed/Open/Half-Open) |
| `CollectionsHierarchyDiagram` | Java Collections Framework class hierarchy |
| `AQSArchitectureDiagram` | AbstractQueuedSynchronizer internals |
| `LockDecisionTreeDiagram` | Decision tree for choosing the right Java lock |
| `ConcurrencyCoordinationDiagram` | CountDownLatch / CyclicBarrier / Semaphore visualised |

