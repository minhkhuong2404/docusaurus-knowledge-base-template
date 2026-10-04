---
name: design-diagrams
description: Design and implement custom interactive React SVG components and flowing arrow animations for diagrams in Docusaurus
---

# Skill: Design Diagrams (Interactive SVG & Flowing Arrows)

This skill covers the full lifecycle of creating, styling, and integrating interactive React diagram components in this Docusaurus knowledge base.

Read the detailed design guide at [references/DESIGNS.md](./references/DESIGNS.md) before starting work.

---

## When to Trigger This Skill

Use this skill when:
- Converting a static ASCII art flow, Mermaid diagram, markdown table, or text-only stub container into a fully functional interactive component.
- Creating a new architecture diagram, state machine, protocol sequence, interactive lookup reference, or checklist from scratch.
- Adding hover effects, animated arrows, step-by-step playback, tabbed panels, or filterable lists to technical documentation.
- Auditing existing diagram components across topic directories (`kafka`, `networking`, `operating-systems`, `redis`, `java`, `database`).

---

## Execution Workflow

### Step 1 — Audit Existing Components & Stubs

Before creating any new diagram, **always check whether a component already exists** to prevent duplicate implementations.
Identify if an existing file is a **text-only stub** (short shell with simple text tabs and no visual representations) vs a **real visual component** (SVG node graphs, animated directional flow sequences, rich interactive tabs with gotchas/metrics, or filterable references).

Commands to check component status:
```bash
# Check if a diagram already exists for a concept
ls src/components/*<Keyword>*Diagram.tsx

# Check line count & stub signatures in components
wc -l src/components/<ConceptName>Diagram.tsx
```

#### Existing Component Catalog (Categorized by Domain)

| Domain | Key Components in `src/components/` | What it Covers |
|---|---|---|
| **Testing & Quality** | `BlackboxSystemTestingDiagram`<br/>`DistributedTestingCoverageDiagram`<br/>`TestingPyramidDoublesDiagram`<br/>`WireMockResilienceDiagram`<br/>`ContractTestingPactFlowDiagram`<br/>`SpringTestAnnotationsDiagram` | Black-box vs system boundaries, distributed test coverage & chaos, test pyramid & test doubles (dummy/stub/mock/spy/fake), WireMock network chaos & transient fault simulation, consumer-driven Pact contracts, Spring test slices (`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`). |
| **Kafka & Event Streaming** | `KafkaArchitectureOverviewDiagram`<br/>`KafkaTopicPartitionDiagram`<br/>`KafkaBrokerStorageDiagram`<br/>`KraftVsZookeeperDiagram`<br/>`KafkaProducerTransactionsDiagram`<br/>`KafkaConsumerGroupRebalanceDiagram`<br/>`KafkaConsumerLagPoisonDiagram`<br/>`KafkaZeroCopyDiagram`<br/>`KafkaStreamsTopologyDiagram`<br/>`KafkaStreamsStateStoreDiagram`<br/>`KafkaStreamsExactlyOnceDiagram` | Broker cluster topology, log segments & zero-copy sendfile, KRaft quorum, 2PC transactional producer & zombie fencing, eager vs cooperative sticky rebalance, consumer lag & DLQ poison pill alerts, RocksDB LSM state stores & changelog restore, Exactly-Once V2 processing. |
| **Redis & Caching** | `RedisDataTypesDiagram`<br/>`RedisClusterReplicationDiagram`<br/>`RedisLuaDistributedLockDiagram`<br/>`RedisPersistenceMechanicsDiagram`<br/>`RedisReactorPatternDiagram`<br/>`RedisEvictionPoliciesDiagram`<br/>`RedisPubSubVsStreamsDiagram`<br/>`WTinyLfuArchitectureDiagram`<br/>`ThunderingHerdDiagram` | Redis memory structures, cluster master-replica slot migration, Redlock & Lua atomic release, RDB snapshot + AOF fsync, epoll single-threaded event loop, allkeys-lru vs volatile-lfu, Pub/Sub vs consumer groups, Caffeine W-TinyLFU cache admission, thundering herd mitigation. |
| **Distributed Consensus & Resilience** | `TwoPhaseCommitProtocolFlowDiagram`<br/>`ThreePhaseCommitPhasesDiagram`<br/>`SagaChoreographyVsOrchestrationDiagram`<br/>`SagaCompensationLifecycleDiagram`<br/>`TransactionalOutboxDiagram`<br/>`CircuitBreakerDiagram`<br/>`RateLimitingTokenBucketDiagram`<br/>`ReplicationConsistentHashingDiagram` | 2PC commit/abort flows & coordinator crash recovery, 3PC Pre-Commit non-blocking state transitions, Choreography vs Orchestration Saga comparison, compensation transaction rollbacks, Transactional Outbox CDC flow, Circuit Breaker state machine, Token Bucket / Leaky Bucket rate limiting, Consistent Hashing ring & virtual nodes. |
| **Networking & Web Protocols** | `NetworkIndexOverviewDiagram`<br/>`TcpHandshakesDiagram`<br/>`TcpCongestionControlDiagram`<br/>`TcpStateTransitionDiagram`<br/>`TlsHandshakeDiagram`<br/>`HttpEvolutionDiagram`<br/>`QuicStackDiagram`<br/>`CorsDiagram`<br/>`NetworkTroubleshootingToolsDiagram` | 5-layer OSI/TCP stack, 3-way handshake & 4-way FIN termination, Slow Start / Congestion Avoidance / Fast Recovery, full TCP state machine (TIME_WAIT, CLOSE_WAIT), TLS 1.3 1-RTT animated handshake, HTTP/1.1 vs HTTP/2 vs HTTP/3, QUIC UDP multiplexing, CORS preflight flow, network diagnostic CLI reference. |
| **Linux OS & Systems** | `OsOverviewDiagram`<br/>`OsProcessesThreadsDiagram`<br/>`OsCpuSchedulingDiagram`<br/>`OsMemoryManagementDiagram`<br/>`OsVirtualMemoryDiagram`<br/>`OsSyncDeadlockDiagram`<br/>`OsFileSystemsIoDiagram`<br/>`OsLinuxSyscallsDiagram`<br/>`OsIpcNetworkingDiagram` | Ring 3 to Ring 0 Linux kernel architecture, 1:1 kernel threads vs virtual threads, Linux CFS red-black tree scheduling, multi-level page table translation & TLB, demand paging & copy-on-write fork, deadlock Coffman conditions, VFS & buffered vs direct vs mmap I/O, SYSCALL/SYSRET lifecycle, IPC mechanisms (Pipes, UDS, shm). |
| **Spring Boot & Java Internals** | `SpringBootStartupTimelineDiagram`<br/>`SpringBootStarterAnatomyDiagram`<br/>`SpringBeanLifecycleDiagram`<br/>`SpringMVCFlowDiagram`<br/>`SpringSecurityFilterDiagram`<br/>`AQSArchitectureDiagram`<br/>`LockDecisionTreeDiagram`<br/>`VirtualThreadLifecycleDiagram`<br/>`TomcatDirectMemoryDiagram` | Spring Boot initialization phases & auto-configuration import selector, starter BOM anatomy, BeanPostProcessor lifecycle, DispatcherServlet request pipeline, SecurityFilterChain order, AbstractQueuedSynchronizer state & CLH queue, Lock decision matrix, Virtual Thread carrier unmounting, Tomcat off-heap connector buffers. |
| **Database & Storage** | `SqlExecutionOrderDiagram`<br/>`SlowQueryOptimizationDiagram`<br/>`WalWritePathDiagram`<br/>`WalReplicationDiagram`<br/>`StarVsSnowflakeSchemaDiagram`<br/>`TimeSeriesDatabaseEngineDiagram`<br/>`SnapshotPatternDiagram` | SQL logical execution order (FROM → WHERE → GROUP BY → SELECT), B-Tree vs Hash index scan analysis, Write-Ahead Log durability & append-only commit, primary-replica WAL streaming, Star vs Snowflake dimension modeling, TSDB time-partitioned chunking, LSM write path. |
| **Security & Identity** | `TokenInvalidationFlowDiagram`<br/>`AccountHackedResponseDiagram`<br/>`PasswordInvalidationDiagram`<br/>`TokenTheftContainmentDiagram`<br/>`ZeroTrustDiagram`<br/>`SshHardeningDiagram`<br/>`WafDiagram` | Refresh token rotation & multi-device session revocation, account takeover containment timeline & blacklist bloom filter, password change cascade invalidation, JWT replay mitigation, Zero Trust identity-first perimeter, SSH certificate authentication, WAF rule inspection pipeline. |
| **Career, Practices & Behavioral** | `SeniorArchitectureDeepDiveDiagram`<br/>`SeniorDevCodingLawsDiagram`<br/>`StarMethodDiagram`<br/>`StoryBankDiagram`<br/>`BehavioralQuestionsDiagram`<br/>`AmazonLPDiagram`<br/>`VibeCodingWorkflowDiagram` | Senior Principal architecture evaluation rubric, production coding laws (Conway, Hyrum, Postel, Gall), 4-stage STAR story delivery with timing allocations, behavioral story bank matrix, Amazon 16 Leadership Principles, modern AI-augmented vibe coding workflow with verification loops. |
| **Banking & FinTech Systems** | `BankingPaymentLifecycleDiagram`<br/>`Iso20022MigrationDiagram`<br/>`BankingClearingSettlementDiagram`<br/>`BankingSanctionsScreeningDiagram`<br/>`BankingCardPaymentFlowDiagram`<br/>`BankingAmlRegulatoryTestingDiagram` | End-to-end 10-step payment processing lifecycle, ISO 20022 XML (pacs.008) vs legacy SWIFT MT103, RTGS vs DNS settlement with multilateral netting, real-time sanctions screening with fuzzy matching algorithms, 4-party card payment model with interchange/MDR, AML regulatory testing pipelines. |

---

---

### Step 2 — Read the Design Specification & Editorial Standards

Before writing code, inspect [references/DESIGNS.md](./references/DESIGNS.md).
Adhere strictly to the **Editorial Diagram Design Standards** (adapted from `cathrynlavery/diagram-design`):

1. **Deletion Mindset**: The highest-quality move is usually deletion.
   - Every node represents a distinct idea. Two nodes that always travel together are one node.
   - Every connection carries information. If the relationship is obvious from layout, remove the line.
   - Target density: **4/10**. Complete without cognitive overload. Above 9 primary nodes, split into an overview + detail view.
2. **Accent Discipline**: The accent color (`#38bdf8` or `#34d399`) is reserved for the **1–2 focal items** the reader should look at first. Using accent on 5+ nodes erases the signal.
3. **No Mermaid Slop**: No generic rounded boxes, no meaningless heavy drop shadows, no tangled crossing arrows.

---

### Step 3 — Select Semantic Pattern First, Then Visual Type

When behavior, state, enforcement, or risk carries meaning, choose the **semantic pattern** first to define behavior, then choose the nearest visual type for layout:

| Behavioral Trigger | Semantic Pattern | Nearest Visual Type |
|---|---|---|
| Many arrivals competing for finite capacity / backpressure | **Fan-in queue / bottleneck** | Data flow |
| Repeated Question / Input / Governance / Output across stages | **Stage framework with semantic slots** | Process |
| Unstructured dialogue/telemetry into structured state | **Unstructured input → structured artifact** | Data flow |
| Why two decisions differ and where they first diverge | **Paired policy-evaluation traces** | Flowchart / Sequence |
| Trust boundaries with allowed vs blocked ingress paths | **Secure paved road** | Architecture |
| Controls grouped by enforcement surface | **Governance / control catalog** | Layer stack |
| Defenses compensate for prior gaps (defense in depth) | **Compensating security layers** | Layer stack |
| Hierarchical, ID-addressable block decomposition | **Traceable block decomposition** | Tree |
| Lifecycle progress through waits, retries, terminal outcomes | **Lifecycle phase map** | State Machine |

#### The 42 Visual Types Classification

| Category | Types Supported |
|---|---|
| **Topologies & Architecture** | **Architecture**, **Architecture delta** (Before · Changes · After topology), **IT current-state**, **High-Level** (cluster stack), **Deployment** (zones, hosts, replicas, ports), **DP integration** (sources → core → consumers). |
| **Sequences & Workflows** | **Sequence** (actor lifelines), **Process** (multi-actor sequential handoffs), **Swimlane** (cross-functional lanes), **Timeline** (chronological events), **User journey** (stages, actions, sentiment), **Data flow** (role-scoped pipelines). |
| **State, Logic & Trees** | **State machine** (states, transitions, guards), **Flowchart** (decision branching), **Tree** (parent → children), **Nested** (hierarchy by containment), **Org chart** (ownership & routing), **Fishbone** (Ishikawa root-cause analysis). |
| **Data & Storage** | **ER / data model** (entities, attributes, cardinalities), **Database schema** (physical tables, SQL types, column FKs), **Medallion** (bronze/silver/gold tiers), **Dependency graph** (fan-in & cyclic dependencies), **UML class** (classes, operations, associations). |
| **Strategy & Management** | **Wardley map** (value chain × evolution), **Kanban** (WIP limits by state), **Story map** (backbone × release slices), **Gantt** (tasks on timeline), **Quadrant** (2×2 prioritization), **DP security matrix** (role access permissions). |
| **Cycles, Sets & Quantitative** | **Loop / Flywheel** (reinforcing cycle + state hub), **Venn** (set overlap), **Pyramid / Funnel** (ranked hierarchy / drop-off), **Bar / Dumbbell**, **Waterfall** (running total + bridges), **Treemap / Marimekko**, **Heatmap**, **Line / Slopegraph / Ridgeline**, **Scatter / Bubble / Beeswarm**, **Radar / Spider**, **Polar chart**, **Sankey** (split/merge volume). |

---

## MANDATORY PRINCIPLE: ALWAYS GENERATE INTERACTIVE DIAGRAMS WITH MOVING ARROWS ONLY

> 🚨 **ABSOLUTE RULE**:
> - **NEVER** generate Monospace Schema Inspector diagrams, static code block viewers, or text-only card lists.
> - **ALWAYS** generate genuine visual SVG interactive diagrams with **moving/flowing arrows** (`.interactive-diagram-flowing-path`, animated step-by-step directional arrows, or SVG conduits with moving arrowheads).
> - Every diagram generated MUST feature an SVG canvas or visual animated flow with moving arrows that visually conveys data movement, state transition, network packet flow, or lifecycle.

---

### Step 4 — Choose the Right Archetype Implementation

| Content Type | Archetype | Signature Visual Elements |
|---|---|---|
| Protocol handshake / sequence / request-response / payload flow | **A — Animated Flow (Moving Arrows)** | Actor boxes, directional step arrows with moving arrow animations and `opacity` fade, Play/Animate button with `useEffect` playback timer |
| System architecture / kernel & cluster nodes / message topologies / runbooks | **B — SVG Node Graph (Flowing Arrows)** | `<svg viewBox>` canvas with dot-matrix background, SVG nodes (`<rect>` + `<text>`), directed `<path>` / `<line>` edges with moving flowing dashed arrows (`.interactive-diagram-flowing-path`), click/hover details panel |
| Feature comparison / protocol evolution / topic tabs | **C — Tabbed Explorer with Flowing SVG** | Custom tab buttons with colored highlight borders, paired with visual SVG topology showing moving data paths per tab |
| Lookup reference (headers, status codes, commands, tools) | **D — Searchable List** | Live search `<input>`, filterable list buttons with colored badges, split-pane detail inspection card with SVG flow |
| Pre-launch audit / review criteria / checklists | **E — Interactive Checklist** | Category tabs, clickable custom checkboxes, dynamic progress bar, summary metrics |

---

### Step 5 — Implement the Component

1. File path: `src/components/<ConceptName>Diagram.tsx`.
2. Outermost wrapper: `<div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>`.
3. Header bar: `<div className="interactive-diagram-header">` containing inline `<svg>` icon (never emoji), primary title, and optional action buttons.
4. Color palette: Use exact hex tokens (`#38bdf8`, `#34d399`, `#fbbf24`, `#f97316`, `#f87171`, `#a78bfa`, `#8b5cf6`, `#2dd4bf`, `#f472b6`).
5. Theme & Color Invariant (Dark Telemetry Canvas in BOTH Themes):
   - All interactive diagrams (`.interactive-diagram-container`) are cyber telemetry instruments designed on a dark canvas (`#090b14` / `#0b0f19` container, `#0d0f1e` SVG canvas with dot grid, dark node fills `rgba(15, 23, 42, 0.85)` / `rgba(255, 255, 255, 0.04)`).
   - In light theme, diagrams KEEP THE EXACT SAME DARK TELEMETRY HUD COLORS (enforced via `src/css/diagrams.css` where `[data-theme="light"] .interactive-diagram-container` sets `--ifm-color-content: #f8fafc`, `background: #0b0f19 !important`, and `color: #f8fafc !important`).
   - NEVER use light theme card tokens (`#F7FDF9`, `#D9D9D9`, `#0f172a` text, `#F2F2F2`, or white backgrounds) inside interactive diagrams.
   - Text inside diagrams must ALWAYS be light and high-contrast: `#ffffff` for titles/active labels, `#e2e8f0` for body/code, and `#94a3b8` for subtitles/hints.
6. Grid responsiveness: Use fixed percentage columns (e.g. `55% 45%`, `58% 42%`, `50% 50%`, `align-items: start`) and embed an inline `<style>` media query block (`@media (max-width: 768px)`) to collapse columns to `1fr` on small screens.

---

### Step 5 — Verify Compilation & Type Safety

Run TypeScript validation to catch syntax or type errors:
```bash
npx tsc --noEmit
```

Ensure output returns 0 errors for the target component.

---

### Step 6 — Integrate into Documentation Markdown

1. Add import after frontmatter in `docs/.../<page>.md`:
   ```markdown
   import ConceptNameDiagram from '@site/src/components/ConceptNameDiagram';
   ```
2. Place the component tag directly under the specific **descendant section heading** (`## ...` or `### ...`) that describes the topic, NOT loosely under the main top-level H1 page title (`# ...`).
3. Replace/remove any old static ASCII, code block, or table under that descendant section:
   ```markdown
   ## How the Transaction Coordinator Works
   
   <KafkaExactlyOnceDiagram initialTab="steps" />
   
   ## Zombie Producer Fencing
   
   <KafkaExactlyOnceDiagram initialTab="zombie" />
   ```

---

### Step 7 — MANDATORY: Register Any New Markdown Page in sidebars.ts

If your task created a new `.md` page (not just a React component), register its doc ID in `sidebars.ts` under the matching category. See [AGENTS.md](../../AGENTS.md#mandatory-register-every-new-page-in-sidebarsts) for details.
