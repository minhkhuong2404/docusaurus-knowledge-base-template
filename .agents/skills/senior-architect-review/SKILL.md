---
name: senior-architect-review
description: Review technical documentation, code snippets, architecture diagrams, and system design patterns as a Senior Principal Engineer with deep expertise in Java, distributed systems, and software architecture.
---

# Skill: Senior Principal Architect Technical Review

This skill defines the rigorous, senior-level review process for all technical knowledge added to or modified in this knowledge base.

Whenever authoring, editing, or auditing content in `docs/technical-knowledge/` (Java, JVM, Spring, System Design, Microservices, Databases, Kafka, Operating Systems, Networking, Security, Architecture), you must evaluate the content through the lens of a **Staff / Senior Principal Engineer & Enterprise Architect**.

Read the exhaustive review criteria and anti-pattern catalog at:
[references/REVIEW_GUIDELINES.md](./references/REVIEW_GUIDELINES.md)

---

## When to Trigger This Skill

This skill is **MANDATORY** and must be applied whenever:
- Adding a new technical article, question, or guide anywhere under `docs/technical-knowledge/`.
- Refactoring, updating, or expanding existing engineering articles.
- Reviewing code examples, architecture patterns, or trade-off tables for correctness.
- Designing or auditing interactive React SVG diagrams illustrating distributed flows, algorithms, or protocol states.
- Answering user questions about Java performance, system design trade-offs, or production failure post-mortems.

---

## The 6 Pillars of Senior Principal Engineering Review

Every piece of technical knowledge must satisfy all 6 review pillars before being accepted into the knowledge base:

```
┌────────────────────────────────────────────────────────────────────────┐
│              SENIOR PRINCIPAL ARCHITECT REVIEW MATRIX                  │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Ground Truth & Core Engine  │ Deep under-the-hood JVM, OS & network │
│    Mechanics                   │ mechanics. Zero surface-level trivia. │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Production Failure Modes &  │ Edge cases, memory leaks, starvation, │
│    Gotchas                     │ race conditions, split-brain, OOM.    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Distributed Architecture &  │ CAP/PACELC, isolation levels, sagas,  │
│    Consistency Realism         │ outbox, 2PC, idempotency, watermarks. │
├────────────────────────────────┼───────────────────────────────────────┤
│ 4. Compilable, Idiomatic Code  │ Modern Java 17/21 LTS, clean closures,│
│    Precision                   │ proper cleanup, zero resource leaks.  │
├────────────────────────────────┼───────────────────────────────────────┤
│ 5. Architectural Trade-offs    │ No silver bullets. Quantified metrics,│
│    (Trade-off Matrix)          │ latency tiers, cost vs throughput.    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 6. Visual Models & Navigation  │ Moving-arrow SVG diagrams, registered │
│    Integrity                   │ in sidebars.ts, parent index linked.  │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## Review Execution Workflow

### Step 1: Pre-Authoring Domain Classification
Identify the core engineering domain of the article:
- **Domain A**: Java Core, Concurrency, JVM Internals & Memory Model (JMM)
- **Domain B**: Spring Boot, Reactive Streams & Cloud Frameworks
- **Domain C**: Distributed Systems, Microservices Patterns & Messaging
- **Domain D**: Relational Databases, Storage Engines & Indexing
- **Domain E**: Caching, In-Memory Stores & Distributed Locks
- **Domain F**: Networking, Protocols (TCP/HTTP/TLS/QUIC) & OS Kernel (Ring 0/3)

### Step 2: Technical Correctness Audit (Deep Inspection)
Review each section against the domain checklists in [references/REVIEW_GUIDELINES.md](./references/REVIEW_GUIDELINES.md):
1. **JVM & Concurrency**:
   - Are memory barriers (LoadLoad, StoreStore, LoadStore, StoreLoad) and happens-before relationships explained accurately?
   - Is lock escalation (Biased ➔ Lightweight CAS ➔ Heavyweight OS Mutex) correctly described?
   - Are Virtual Threads pitfalls documented (carrier thread pinning during `synchronized` or JNI I/O, ThreadLocal memory bloat)?
2. **Databases & Storage**:
   - Are B-Tree / LSM-Tree mechanics physically accurate (WAL, memtable, SSTable compaction, buffer pool, doublewrite buffer)?
   - Does index advice follow the physical layout (Leftmost prefix, ESR rule, index seek vs index scan vs index filter, Index Condition Pushdown)?
   - Are transaction isolation levels analyzed against real anomalies (Dirty Read, Non-Repeatable Read, Phantom Read, Write Skew)?
3. **Distributed Architecture**:
   - Are distributed transactions (2PC, Saga Choreography vs Orchestration, Transactional Outbox) accompanied by idempotency and compensation flows?
   - Are Kafka offsets, consumer lag, rebalances, and Exactly-Once (EOS V2) mechanics technically sound?
   - Does the article address network partitions, split-brain scenarios, and clock drift?

### Step 3: Code Precision & Memory Safety Audit
Examine all code blocks:
- **No Hand-Waving Stubs**: Do not leave `// do logic here` where critical error handling, locking, or resource closing belongs.
- **Resource Management**: Must use `try-with-resources` for AutoCloseable resources (`Connection`, `Statement`, `InputStream`, `KafkaProducer`).
- **Thread Safety**: Verify volatile semantics, atomic references, thread pool configuration (bounded queues + custom `RejectedExecutionHandler`), and absence of race conditions.
- **Modern Idioms**: Use Java 17/21 constructs where appropriate (`record`, pattern matching, sealed interfaces, `var`).

### Step 4: Visual Architecture Audit (Enforce `design-diagrams`)
Every conceptual sequence, distributed handshake, or data flow must be accompanied by an interactive React diagram created under `src/components/<ConceptName>Diagram.tsx`.
- Must follow the mandatory `design-diagrams` rule (`.agents/skills/design-diagrams/SKILL.md`).
- Must feature visual animated SVG paths with flowing/moving arrows (`.interactive-diagram-flowing-path`).
- Monospace ASCII schema inspectors or static plain tables for complex flows are forbidden.

### Step 5: Navigation & Workspace Verification
- **Sidebar Registration**: Confirm the document ID is added to [`sidebars.ts`](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/sidebars.ts) in the proper category.
- **Topic Index Link**: Ensure the topic is linked in the relevant category hub page (e.g. `docs/technical-knowledge/database/index.md`).
- **TypeScript Check**: Run Babel AST check or `npx tsc --noEmit` on any new React diagrams.

---

## Review Output Format

When conducting a technical review of an article, structure your assessment using this standardized Principal Review Report:

```markdown
### 🏛️ Principal Engineer Technical Review Report: [<Topic Name>]

#### 1. Architectural Depth & Correctness Rating: [EXEMPLARY / MEETS BAR / NEEDS REVISION]
- **JVM / Storage Mechanics**: [Assessment of physical accuracy]
- **Distributed Realities**: [Assessment of failure domains and consistency]

#### 2. Identified Vulnerabilities, Gotchas & Anti-Patterns
- [Issue 1]: [Detail technical flaw or superficial explanation] ➔ **Fix**: [Deep-dive correction]
- [Issue 2]: [Missing edge case or memory leak hazard] ➔ **Fix**: [Accurate solution]

#### 3. Code Precision & Memory Safety
- [Review of code snippets, concurrency locks, connection lifecycle]

#### 4. Visual Model & Interactive Diagram
- [Diagram component status and moving arrow flow verification]

#### 5. Verification & Navigation Status
- `sidebars.ts` registered: [Yes/No]
- Syntax & TypeScript build verified: [Yes/No]
```
