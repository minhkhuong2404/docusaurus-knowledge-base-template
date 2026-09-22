# Senior Principal Architect Review Guidelines & Evaluation Benchmarks

This reference manual specifies the rigorous technical evaluation criteria, anti-pattern catalogs, and architectural standards enforced across all engineering documentation in this knowledge base.

---

## 1. Core Technical Review Pillars

### Pillar 1: Ground Truth & Under-the-Hood Engine Mechanics
**Bar to Meet:**
- **No superficial analogies without physical ground truth**: Stating "an index is like a book index" is insufficient. The article must explain the underlying physical data structure (B+Tree page structure, fill factor, pointer traversal, binary search within page directory, buffer pool LRU caching, or LSM memtable + WAL + SSTable bloom filter lookups).
- **Bytecode & Memory Representation**: When discussing Java constructs (lambdas, records, generics, enums, synchronization), reference what happens at bytecode level (`invokedynamic` + `LambdaMetafactory`, `checkcast` type erasure, `monitorenter`/`monitorexit`, lock mark words in object headers).
- **OS Kernel Boundary**: Clearly demarcate user space (Ring 3) vs kernel space (Ring 0). Explain system calls (`read`, `write`, `epoll`, `mmap`, `sendfile`), context switch costs, CPU cache lines (64-byte L1/L2/L3), and false sharing (`@Contended`).

---

### Pillar 2: Java Core, JVM & Concurrency Standards

#### A. Java Memory Model (JMM) & Multithreading
- **Volatile Semantics**: Must explicitly explain visibility AND instruction reordering prevention via CPU memory barriers (LoadLoad, StoreStore, LoadStore, StoreLoad) or `#StoreLoad` fence on x86/ARM architectures.
- **Double-Checked Locking (DCL)**: Must explain why `volatile` is strictly required (out-of-order execution: allocation ➔ pointer assignment ➔ constructor execution vs allocation ➔ constructor ➔ pointer).
- **Atomic Operations & Lock-Free Programming**: CAS (Compare-And-Swap) loops, ABA problem prevention via `AtomicStampedReference`, cache-line contention (`AtomicLong` vs `LongAdder` cell striped arrays).
- **Thread Pool Engineering**:
  - Never use unbounded queues (`newLinkedBlockingQueue()` without capacity) with `Executors.newFixedThreadPool()`, as it causes out-of-memory (`OutOfMemoryError: Java heap space`) under load.
  - Never use `Executors.newCachedThreadPool()`, as unbounded thread spawning causes thread exhaustion (`OutOfMemoryError: unable to create new native thread`).
  - Always configure explicit thread pools using `ThreadPoolExecutor` with core pool size, maximum pool size, keep-alive time, bounded queue (`ArrayBlockingQueue`), thread factory with meaningful naming, and custom `RejectedExecutionHandler` (CallerRunsPolicy, AbortPolicy with metrics).
- **ThreadLocal Leaks**: Always document that `ThreadLocal` variables in thread pools MUST be cleared in a `finally` block via `.remove()`. Explain why weak keys in `ThreadLocalMap` still leak strong value references held by long-lived worker threads.
- **Virtual Threads (Project Loom - Java 21+)**:
  - Explain carrier thread mounting/unmounting and continuations.
  - Highlight the **Carrier Thread Pinning** gotcha: executing blocking operations inside `synchronized` blocks or methods or native JNI calls pins the underlying OS carrier thread, preventing other virtual threads from running. Solution: Replace `synchronized` with `ReentrantLock`.
  - Highlight memory traps: Massive `ThreadLocal` allocations across millions of virtual threads cause severe heap bloat.

#### B. JVM Memory Layout & Garbage Collection
- **Generational Heap Layout**: Eden, Survivor spaces (S0/S1), Tenured/Old Gen, Metaspace (native memory replacing PermGen since Java 8).
- **Object Header Breakdown**: 64-bit JVM object layout (12-byte header with compressed OOPs: 8-byte Mark Word + 4-byte Klass Word + instance fields + 8-byte alignment padding).
- **Lock Escalation Mechanics**: Biased Lock (deprecated/disabled in modern JDKs) ➔ Lightweight Lock (CAS on thread stack basic lock) ➔ Heavyweight Lock (Inflated OS mutex with monitor wait set).
- **Garbage Collection Algorithms**:
  - G1 GC: Region-based memory layout, humongous objects allocation trap, SATB (Snapshot-At-The-Beginning) write barriers, mixed GC pause targets.
  - ZGC / Shenandoah: Concurrent marking and relocation using colored pointers and load barriers, sub-millisecond max pause times independent of heap size.
  - Stop-the-World (STW) pauses: Safe points, thread polling, allocation stalls, and GC logging analysis (`-Xlog:gc*`).

---

### Pillar 3: Distributed Systems & Microservices Architecture

#### A. Consistency & Distributed Consensus
- **CAP Theorem & PACELC Realism**:
  - In network partitions, systems choose Availability or Consistency. If no partition (normal operation), choose Latency ($L$) or Consistency ($C$).
  - Systems like DynamoDB, Cassandra, Kafka, MongoDB must be classified accurately using PACELC: e.g. PC/EC vs PA/EL.
- **Distributed Transactions**:
  - 2-Phase Commit (2PC): Coordinator single point of failure, blocking participant locks, recovery phase timeouts.
  - Saga Pattern: Choreography (event-driven via message bus) vs Orchestration (central saga coordinator). Must explain compensating transactions, forward recovery, backward recovery, and semantic rollback vs atomic rollback.
  - Transactional Outbox Pattern: Atomic local database write to business table and `outbox` table in the same local ACID transaction. Decoupled CDC (Change Data Capture like Debezium) or poller relaying to Kafka/RabbitMQ.
- **Idempotency Keys**: Network retries will happen. Every mutating API or consumer must validate unique idempotency keys using atomic Redis `SET NX EX` or SQL unique constraints before executing side-effects.

#### B. Messaging & Event-Driven Architecture (Apache Kafka)
- **Log Architecture**: Append-only commit log, partition segment files (`.log`, `.index`, `.timeindex`), segment rolling, Log End Offset (LEO) vs High Watermark (HW).
- **Producer Semantics**:
  - `acks=0`: Fire-and-forget, zero latency, high loss risk.
  - `acks=1`: Leader broker acknowledgment, loss on immediate leader crash before replication.
  - `acks=all` (`-1`) + `min.insync.replicas=2`: True durablity across replicas.
- **Consumer Group Rebalances**: Eager rebalance (stop-the-world for all consumers) vs Cooperative Sticky Assignor (incremental rebalancing without stopping unassigned partitions). Heartbeat background thread vs `max.poll.interval.ms` timeout processing trap.
- **Exactly-Once Semantics (EOS V2)**:
  - Idempotent producer (PID + Sequence Numbers + broker epoch deduplication).
  - Transactional Coordinator + `__transaction_state` internal topic + 2-phase commit control markers (`COMMIT`/`ABORT`) written directly into partition logs.
  - Zombie fencing via Producer Epoch bump.

---

### Pillar 4: Relational Databases & Storage Mechanics

#### A. B-Tree Indexing & Query Execution
- **Physical Layout of B+Tree**: Branch/node pages with router keys; leaf pages linked in bidirectional doubly linked list. All data rows (clustered index) or row pointers/primary keys (secondary index) reside strictly at the leaf level.
- **The Leftmost Prefix Rule**: Physical consequence of composite index sorting (`(A, B, C)` is ordered by `A`, then by `B` within identical `A`, then by `C` within identical `B`). Skipping `A` destroys range seek continuity.
- **The ESR Rule (Equality ➔ Sort ➔ Range)**:
  - Columns with `=` equality filters must come first.
  - Columns used in `ORDER BY` must come next (to avoid in-memory `Using filesort`).
  - Columns used in range queries (`>`, `<`, `BETWEEN`) must come last. Once a range filter is encountered, subsequent index columns cannot be used for B-Tree seek operations!
- **Index Condition Pushdown (ICP)**: Storage engine evaluates `WHERE` filter conditions directly inside InnoDB/storage engine before returning rows to the MySQL server layer, saving disk read I/O.
- **Deferred Join (Late Materialization)**: Optimization for deep pagination (`LIMIT 100000, 20`). Perform a covering index lookup on secondary index to obtain row IDs first, then join against primary table to fetch the 20 actual rows.

#### B. Concurrency Control & Isolation Levels
- **Isolation Levels & Real Anomalies Matrix**:
  | Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Serialization Anomaly / Write Skew |
  |---|---|---|---|---|
  | **Read Uncommitted** | ❌ Yes | ❌ Yes | ❌ Yes | ❌ Yes |
  | **Read Committed** | ✅ Prevented | ❌ Yes | ❌ Yes | ❌ Yes |
  | **Repeatable Read** (InnoDB default) | ✅ Prevented | ✅ Prevented | ✅ Prevented (via MVCC + Next-Key Lock) | ❌ Write Skew Possible |
  | **Serializable** | ✅ Prevented | ✅ Prevented | ✅ Prevented | ✅ Prevented |
- **InnoDB Locking**: Record lock, Gap lock (locks the gap before or between index records to prevent phantom inserts), Next-Key lock (record lock + gap lock combined).
- **MVCC (Multi-Version Concurrency Control)**: Undo log segments, `DB_TRX_ID`, `DB_ROLL_PTR`, and Read View visibility rules.

---

### Pillar 5: Production Code & Implementation Standards

#### A. Code Quality Checklist
1. **Compilable & Executable**: Code blocks must be syntactically valid modern Java (or SQL/bash/config). Avoid non-existent pseudo-APIs.
2. **Defensive Resource Closing**:
   ```java
   // ✅ MANDATORY: Proper try-with-resources
   try (Connection conn = dataSource.getConnection();
        PreparedStatement ps = conn.prepareStatement(SQL)) {
       ps.setString(1, param);
       try (ResultSet rs = ps.executeQuery()) {
           while (rs.next()) { ... }
       }
   }
   ```
3. **Thread Safety & Immutability**:
   - Prefer unmodifiable collections: `List.of()`, `Set.of()`, `Map.of()`.
   - Prefer Java `record` for immutable DTOs and value objects.
   - For shared mutable state, use `ConcurrentHashMap` with atomic methods (`computeIfAbsent`, `merge`), not compound non-atomic checks (`containsKey` followed by `put`).

#### B. Anti-Patterns to Call Out & Eliminate
- ❌ **The Parallel Stream Hazard**: Using `.parallelStream()` for blocking I/O (database, HTTP). All parallel streams share the JVM-wide `ForkJoinPool.commonPool()`. Blocking tasks in one stream starve the entire JVM.
- ❌ **The String Intern Synchronization Trap**: Synchronizing on `String.intern()` or string literals risks global lock contention and deadlocks with third-party libraries sharing the JVM String Constant Pool.
- ❌ **Unchecked Context Switching**: Creating thousands of OS threads instead of using bounded thread pools or Java 21 virtual threads.
- ❌ **Silent Exception Swallowing**: `catch (Exception e) {}` or `e.printStackTrace()` without proper propagation, logging, or metric recording.

---

## 2. Interactive Diagram Review Standards

In addition to technical accuracy, every major architecture, protocol, or state transition article must feature an interactive React diagram satisfying the `design-diagrams` skill (`.agents/skills/design-diagrams/SKILL.md`):

1. **Active Motion**: Flowcharts and sequence diagrams MUST feature **moving/flowing arrows** (`.interactive-diagram-flowing-path` or animated step-by-step conduits).
2. **No Superficial Text Stubs**: Every component must offer real visual node topologies, state sequences, or interactive comparison matrices.
3. **Mobile & Theme Compatible**: Wrap multi-column grids in `@media (max-width: 768px)` blocks; use `var(--ifm-color-content)` for body text.
4. **Placement**: Place diagram tags directly under the descendant `##` topic heading, not loosely under the top-level H1 title.
