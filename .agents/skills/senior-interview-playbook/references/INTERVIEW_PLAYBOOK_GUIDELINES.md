# Senior/Staff Interview Playbook Guidelines & Trap Catalog

This reference manual provides the domain-specific evaluation rubrics, classic interviewer traps, principal engineer rebuttals, and ready-to-use Markdown templates required by the `senior-interview-playbook` skill.

---

## 1. What Separates a Mid-Level Candidate from a Senior/Staff Engineer?

| Evaluation Dimension | Mid-Level Candidate (L4) | Senior / Staff Candidate (L5 / L6+) |
|:---|:---|:---|
| **Problem Framing** | Jumps immediately into drawing boxes or writing code. | Clarifies physical invariants, read/write ratios, SLA targets, and failure domains first. |
| **Mechanism Depth** | Names technologies (*"Use Redis"*, *"Use Kafka"*, *"Use `@Transactional`"*). | Explains engine internals (*B+Tree page splits*, *CGLIB proxy interception*, *JMM `StoreLoad` fences*, *WAL tailing*). |
| **Failure Realism** | Assumes the network is reliable and dependencies respond in 10ms. | Designs for partial degradation, slow calls (Little's Law), split-brain, clock skew, and poison pills. |
| **Trade-Off Honesty** | Claims a solution is "fast and scalable" without caveats. | Articulates exact trade-offs (e.g., *PACELC latency vs. consistency*, *write amplification vs. read speed*). |
| **Day-2 Operations** | Stops once the happy path works. | Covers observability, safe migration/rollout, dead-letter triage, and offline financial reconciliation. |

---

## 2. Domain-Specific Interview Trap Catalog

Use these domain patterns as inspiration when crafting the **Classic Interviewer Traps & Principal Rebuttals** for any newly added or updated knowledge page:

### Domain A: Core Java, JVM Internals & Concurrency
1. **Custom `HashMap` Keys**: Overriding `equals()` and `hashCode()` is not enough—keys **must be strictly immutable** (`final` fields or Java `record`), otherwise mutating a key after insertion changes its bucket hash and creates a silent memory leak.
2. **`volatile` Misconceptions**: `volatile` guarantees memory visibility and prevents instruction reordering via JMM barriers (`LoadLoad`, `StoreStore`, `StoreLoad`), but offers **zero atomicity** for compound actions (`count++` is `getfield` ➔ `iadd` ➔ `putfield`). Use `AtomicLong` or `LongAdder` (cell striping under high contention).
3. **Java 21 Virtual Threads (Project Loom)**: Virtual threads excel at blocking I/O, not CPU-bound work. Beware **Carrier Thread Pinning** inside `synchronized` blocks or native JNI calls (replace with `ReentrantLock`), and never eliminate downstream connection pools (HikariCP is still mandatory to protect the database).
4. **`ThreadLocal` Memory Leaks**: Pooled worker threads (Tomcat) live for the lifetime of the JVM. While `ThreadLocalMap` keys are `WeakReference`, values are strong references. Always invoke `threadLocal.remove()` inside a `finally` block to prevent heap OOM and cross-tenant data bleed.
5. **Garbage Collection Selection**: Explain when to choose **G1 GC** (balanced throughput with `-XX:MaxGCPauseMillis`) vs. **Generational ZGC** (colored pointers + load barriers for sub-millisecond pauses on multi-hundred-GB heaps).

### Domain B: Spring Framework, Spring Boot & JPA/Hibernate
1. **AOP Proxy Self-Invocation Trap**: Calling `@Transactional`, `@Async`, or `@Cacheable` methods via `this.method()` inside the same class bypasses the Spring CGLIB/JDK proxy completely. Fix by extracting a dedicated collaborator bean or injecting self via `ObjectProvider`.
2. **`@Transactional` Rollback Defaults**: Spring only rolls back on unchecked exceptions (`RuntimeException` and `Error`) by default. Checked exceptions commit the transaction unless explicitly configured with `@Transactional(rollbackFor = Exception.class)`.
3. **HikariCP Connection Pool Sizing**: More connections $\neq$ faster database. Due to CPU context switching and disk/WAL contention, use the PostgreSQL formula: $\text{Pool Size} = (2 \times \text{CPU Cores}) + \text{Effective Spindle Count}$ (typically 10–20 connections per instance).
4. **Kubernetes Liveness vs. Readiness Probes**: Never attach external database or downstream dependency checks to `/health/liveness`—a temporary DB blip will cause Kubernetes to restart all pods in a cascading crash loop. Keep `/liveness` strictly local and put dependency checks in `/health/readiness`.
5. **JPA N+1 & OSIV Anti-Pattern**: Disable `spring.jpa.open-in-view` (`false`) so database connections aren't held open during slow HTTP JSON rendering or view serialization. Solve N+1 queries using `JOIN FETCH`, `@EntityGraph`, or `@BatchSize`.

### Domain C: System Design, Payments, Ticketing & Distributed Systems
1. **No 2PC Across WAN Boundaries**: Never hold local ACID database row locks while making synchronous HTTP calls to third-party payment gateways (Stripe/Adyen). Use **TCC (Try-Confirm-Cancel)** or **Transactional Outbox + Compensating Sagas**.
2. **Two-Tier Idempotency Storage**: Storing idempotency keys only in Redis risks double-charging if Redis evicts keys or crashes. Pair a short-lived Redis `SETNX` in-flight lock with a durable PostgreSQL `UNIQUE(user_id, idempotency_key)` ledger table storing the SHA-256 request fingerprint.
3. **Flash-Sale Inventory & The "Seam Problem"**: Decrementing Redis first and syncing asynchronously to SQL risks overselling on worker crash. Shave excess ingress at the CDN edge with a **Virtual Waiting Room** (signed JWT queue tokens) and enforce atomic reservations via `SELECT ... FOR UPDATE SKIP LOCKED` or sharded SQL counters + a **Timeout Reaper**.
4. **Bulkheading & Adaptive Concurrency**: By Little's Law ($L = \lambda \times W$), a single degraded partner API spiking from 50ms to 4,000ms will exhaust all shared Tomcat worker threads in seconds. Isolate each external dependency in its own **Bulkhead** and apply **TCP Vegas Adaptive Concurrency Limits**.
5. **Retry Storms & Full Jitter**: Naive exponential backoff still clusters retries at powers of 2. Always apply AWS **Full Jitter**: $T_{\text{sleep}} = \text{random}(0, \min(M, B \times 2^i))$.

### Domain D: Databases, Indexing, UUIDs & Storage Engines
1. **UUIDv4 vs. UUIDv7 in Clustered Indexes**: Random `UUIDv4` primary keys scatter inserts across the entire InnoDB/PostgreSQL B+Tree, causing random I/O, 50% page fill factors, frequent 16KB page splits, and buffer pool thrashing. Use **UUIDv7** (48-bit Unix epoch ms prefix) for sequential append locality.
2. **Composite Indexes & The ESR Rule**: Order composite index columns by **Equality ➔ Sort ➔ Range**. Once the B+Tree encounters a range predicate (`>`, `<`, `BETWEEN`), any subsequent columns in the index cannot be used for tree seek traversal.
3. **Isolation Anomalies & Write Skew**: `REPEATABLE READ` via MVCC prevents Dirty and Non-Repeatable Reads, but unless Next-Key Locks or `SERIALIZABLE` / explicit `FOR UPDATE` locks are used, concurrent transactions can still suffer from **Write Skew** (e.g., two doctors going off-call simultaneously).

### Domain E: Apache Kafka & Event-Driven Architecture
1. **Durability Quartet**: `acks=all` alone does not guarantee zero data loss if only 1 replica is in-sync. Production durability requires `acks=all`, `replication.factor=3`, `min.insync.replicas=2`, and `enable.idempotence=true`.
2. **Dual-Write Bug**: Publishing to Kafka inside a database `@Transactional` method is a race condition (DB commits, JVM crashes before Kafka ack, or Kafka succeeds and DB rolls back). Use the **Transactional Outbox Pattern** with **Debezium CDC** reading the database WAL.
3. **Consumer Rebalance Storms**: Heavy processing or blocking I/O on the consumer thread exceeds `max.poll.interval.ms`, kicking the consumer out of the group and triggering stop-the-world rebalances. Use `CooperativeStickyAssignor`, keep `poll()` loops fast, and route poison pills to tiered retry/DLQ topics.

### Domain F: AI Agents, LLM Orchestration & RAG Architecture
1. **Unbounded Agent Loops**: Autonomous ReAct agents can enter infinite tool-calling loops or suffer context rot as scratchpad tokens grow. Enforce strict **Step Budgets**, **Token Cost Circuit Breakers**, and **Context Compaction / Sub-Agent Isolation**.
2. **Naive Vector-Only RAG**: Pure cosine similarity on dense embeddings misses exact keyword matches (SKUs, error codes, function names). Production RAG combines **Hybrid Search (BM25 lexical + HNSW dense vector)** merged via **Reciprocal Rank Fusion (RRF)** and refined with a **Cross-Encoder Reranker**.
3. **Prompt Injection & Tool Privilege Escalation**: Never allow an LLM agent to execute mutating SQL or shell tools directly with admin credentials. Enforce deterministic **Schema Validation**, **Read-Only Sandboxes**, and **Human-in-the-Loop (HITL) Approval Gates** for high-consequence actions.

---

## 3. Ready-to-Use Markdown Template

Copy and customize this template at the bottom of every new or updated knowledge page:

```markdown
---

## 🧠 Senior/Staff Interview Playbook: How to Ace [Topic Name] Interviews

When interviewers at Tier-1 engineering organizations ask about **[Topic Name]**, they are not looking for textbook definitions. They are evaluating whether you understand **under-the-hood engine mechanics, production failure modes under load, and quantifiable architectural trade-offs**.

### 1. The Four-Step "Senior Framing" Strategy

Before drawing boxes or writing code, anchor your explanation using these four principal constraints:

1. **State the Core Physical Invariant:**
   * *"[Define the non-negotiable invariant: e.g., memory visibility, at-most-once mutation, bounded tail latency, or zero lock starvation]."*
2. **Quantify the Hardware / Capacity Physics:**
   * *"[Provide back-of-the-envelope math: e.g., Little's Law, B+Tree page sizes, network RTT vs. disk IOPS, or thread pool sizing formula]."*
3. **Highlight Partial Degradation & Failure Boundaries:**
   * *"[Proactively identify what fails under load: e.g., network partitions, GC pauses, slow downstream dependencies, or cache stampedes]."*
4. **Address Day-2 Operations & Observability:**
   * *"[Specify key SLIs/SLOs, reconciliation pipelines, dead-letter handling, or safe rollout strategies]."*

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "[Insert deceptive or surface-level question an interviewer asks]"
* **Junior/Mid Answer:** *"[Insert common textbook or naive response that falls into the trap.]"*
* **Principal Rebuttal:**
  > *"[Insert deep technical rebuttal explaining why the naive approach fails in production, referencing internal mechanics, and stating the production-proven architecture.]"*

#### Trap 2: "[Insert second probing question on concurrency, scale, or edge cases]"
* **Junior/Mid Answer:** *"[Insert common naive response.]"*
* **Principal Rebuttal:**
  > *"[Insert deep technical rebuttal with concrete mechanism or code pattern.]"*

#### Trap 3: "[Insert third probing question on failure recovery, memory leaks, or trade-offs]"
* **Junior/Mid Answer:** *"[Insert common naive response.]"*
* **Principal Rebuttal:**
  > *"[Insert deep technical rebuttal.]"*

---

### 3. Quick Reference: Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
|:---|:---|:---|
| **[Concept 1]** | *"[Surface-level statement]"* | *"[Deep engine mechanism + trade-off]"* |
| **[Concept 2]** | *"[Surface-level statement]"* | *"[Deep engine mechanism + trade-off]"* |
| **[Concept 3]** | *"[Surface-level statement]"* | *"[Deep engine mechanism + trade-off]"* |
| **[Concept 4]** | *"[Surface-level statement]"* | *"[Deep engine mechanism + trade-off]"* |
```
