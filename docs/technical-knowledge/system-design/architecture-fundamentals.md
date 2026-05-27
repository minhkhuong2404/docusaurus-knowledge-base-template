---
id: architecture-fundamentals
title: Architecture Fundamentals
sidebar_label: Architecture Fundamentals
description: Core principles of distributed systems architecture including CAP theorem, consistency models, availability, partition tolerance, and key trade-offs every engineer must understand.
tags: [architecture, cap-theorem, consistency, availability, distributed-systems, fundamentals]
---

# Architecture Fundamentals

## CAP Theorem

**You can only guarantee 2 of 3:**

| Property | Description |
|---|---|
| **Consistency** | Every read receives the most recent write or an error |
| **Availability** | Every request receives a (non-error) response, without guarantee it's the most recent |
| **Partition Tolerance** | The system continues operating despite network partitions |

> In practice, **network partitions always happen**, so the real choice is **CP vs AP**.

| System Type | Examples | Trade-off |
|---|---|---|
| CP | HBase, Zookeeper, etcd | Returns error or timeout during partition |
| AP | Cassandra, DynamoDB, CouchDB | Returns stale data during partition |
| CA (not realistic in distributed) | Traditional RDBMS | Assumes no partition |

---

## Consistency Models (Weakest → Strongest)

```
Eventual  →  Monotonic Read  →  Read-Your-Writes  →  Causal  →  Sequential  →  Linearizable  →  Strict
```

| Model | Guarantee | Example |
|---|---|---|
| **Eventual** | Will converge eventually | DNS, shopping carts |
| **Read-Your-Writes** | You always see your own writes | User profile update |
| **Causal** | Causally related operations seen in order | Comments/replies |
| **Linearizable** | Appears as if on a single machine | Bank balance |

---

## Availability Numbers

| Availability | Downtime/year | Downtime/month |
|---|---|---|
| 99% ("two nines") | 3.65 days | 7.2 hours |
| 99.9% ("three nines") | 8.76 hours | 43.8 minutes |
| 99.99% ("four nines") | 52.6 minutes | 4.4 minutes |
| 99.999% ("five nines") | 5.26 minutes | 26 seconds |

**Calculating SLA in series (weakest link):**
```
Total = SLA_A × SLA_B  →  0.999 × 0.999 = 0.998 (99.8%)
```

**Availability in parallel (redundancy):**
```
Total = 1 − (1 − SLA)^N  →  1 − (0.001)^2 = 99.9999%
```

---

## Latency Reference Numbers

| Operation | Latency |
|---|---|
| L1 cache reference | ~1 ns |
| Main memory reference | ~100 ns |
| SSD random read | ~100 µs |
| HDD seek | ~10 ms |
| Network RTT (same datacenter) | ~0.5 ms |
| Network RTT (cross-continent) | ~150 ms |

---

## Key Architectural Trade-offs

### Latency vs Throughput
- **Latency**: Time for one request to complete
- **Throughput**: Requests processed per second
- Caching improves both; queuing improves throughput at the cost of latency

### Stateful vs Stateless Services
| | Stateless | Stateful |
|---|---|---|
| Scaling | Easy (add instances) | Hard (session affinity needed) |
| Failure recovery | Easy | Requires state replication |
| Examples | REST APIs, workers | WebSocket servers, databases |

### Synchronous vs Asynchronous
| | Sync | Async |
|---|---|---|
| Simplicity | Higher | Lower |
| Coupling | Tight | Loose |
| Failure isolation | Lower | Higher |
| Use case | User-facing reads | Background processing |

---

## Data Partitioning Strategies

### Horizontal Partitioning (Sharding)
- **Range-based**: `user_id 1-1M → shard1`, `1M-2M → shard2` — risk of hot spots
- **Hash-based**: `shard = hash(key) % N` — even distribution, hard to rebalance
- **Directory-based**: Lookup service maps key to shard — flexible, single point of failure

### Vertical Partitioning
- Split table columns: keep hot columns separate from cold columns
- Example: `user_core(id, name, email)` + `user_profile(id, bio, avatar, ...)`

---

## Replication Strategies

| Strategy | Pros | Cons |
|---|---|---|
| **Single-leader** | Simple, strong consistency | Write bottleneck, failover complexity |
| **Multi-leader** | Geographic writes, higher write throughput | Conflict resolution needed |
| **Leaderless (Dynamo-style)** | High availability, no single point | Eventual consistency, quorum complexity |

### Quorum (N replicas, W writes, R reads)
- Strong consistency: `W + R > N`
- Common: `N=3, W=2, R=2`

---

## Common Failure Modes

- **Cascading failures**: One service overwhelms another during recovery
- **Split-brain**: Network partition causes two leaders
- **Thundering herd**: Cache miss causes N simultaneous DB hits
- **Head-of-line blocking**: One slow request blocks the queue

---

## Interview Questions

### Q: What is the CAP theorem and what trade-off do most modern databases make?

**A:** Under partition, distributed systems choose between consistency and availability for that operation. Many modern databases expose tunable modes but often default to availability for reads and stronger consistency for critical writes.

### Q: Explain the difference between linearizability and eventual consistency. Give a use case for each.

**A:** Linearizability makes each operation appear instantaneous and globally ordered; eventual consistency allows temporary divergence that converges later. Use linearizability for balances/inventory, eventual consistency for feeds/caches.

### Q: A service has 99.9% uptime. You depend on 3 such services in series. What's your effective uptime?

**A:** Effective uptime is roughly $0.999^3 \approx 0.997$ or about 99.7%. Serial dependencies multiply failure probability, so compositional reliability drops quickly.

### Q: When would you choose a CP system over an AP system?

**A:** Choose CP when correctness of latest state matters more than always serving requests, such as financial ledgers or unique constraints. AP is preferable when availability and partition tolerance dominate.

### Q: What is the difference between horizontal and vertical scaling?

**A:** Vertical scaling adds resources to one node; horizontal scaling adds more nodes and distributes load. Horizontal offers better fault isolation but increases coordination complexity.

### Q: How does replication lag affect your system, and how do you mitigate it?

**A:** Lag causes stale reads and broken user expectations after writes. Mitigate with read-after-write routing, bounded-staleness policies, faster replication paths, and lag-aware query routing.

---

## PACELC Theorem: Beyond CAP

:::info[Chapter 12 Reference]
Building Microservices Chapter 12 on resilience digs into the real trade-offs that database and infrastructure choices make — PACELC provides a more precise framework than CAP for understanding these choices.
:::

CAP only addresses behavior **during a partition**. PACELC extends this:

```
PACELC:
  If Partition → choose C (consistency) or A (availability)
  ELse         → choose L (latency) or C (consistency)

Even without a network partition, there's a fundamental trade-off:
  Latency   vs   Consistency

More consistent = more coordination = higher latency
Lower latency = less coordination = weaker consistency
```

### PACELC Classification of Common Systems

| System | Partition Behavior | Latency/Consistency | Notes |
|---|---|---|---|
| **DynamoDB** | PA (Available) | EL (Low Latency) | Full IELC/IELC system |
| **Cassandra** | PA (Available) | EL (Low Latency) | Tunable with quorum writes |
| **MongoDB** | PC (Consistent by default) | EC (Consistent) | Single-leader replication |
| **HBase** | PC (Consistent) | EC (Consistent) | Strong consistency always |
| **ZooKeeper** | PC (Consistent) | EC (Consistent) | Coordination service |
| **MySQL async replication** | PC/PA | EL | Lag-prone on failure |
| **CockroachDB** | PC | EC (Slow) | Geo-distributed strong consistency |

---

## Consistency Models: Deep Dive

### Linearizability (Strongest Practical Model)

Linearizability is the gold standard for distributed consistency. A system is linearizable if every operation appears to take effect atomically at some point between its invocation and completion.

```
Linearizability guarantee:

  Client A: --[write X=1]-------
  Client B:          --[read X]-  → MUST return 1 (or later value)
  Client C: -----[read X]-------  → MAY return 0 or 1 (depending on ordering)

  If write completed before read started: MUST see write
  If read overlapped write: may see old or new value (ordering uncertain)
```

**Systems that provide linearizability:**
- Single-leader databases with synchronous replication
- etcd (via Raft consensus)
- ZooKeeper
- Google Spanner (via TrueTime)

**Cost:** Requires coordination on every read/write — high latency, especially geo-distributed.

### Sequential Consistency

All operations appear in some total order consistent with program order, but this order need not match real-world time.

```
Sequential: Operations must appear in some global order, but
  that order needn't match wall-clock time.

Linearizable: Operations must appear to execute instantaneously
  at some point between their start and end.

Linearizable ⊂ Sequential (Sequential is weaker)
```

### Causal Consistency

If operation A causes operation B, all processes see A before B. Operations with no causal relationship may be seen in any order.

```
Practical example: Comments and replies
  User A posts comment (op1)
  User B replies to A's comment (op2) — causally depends on op1

  Causal consistency guarantees: any node that has seen op2
  must also have seen op1 (even on different replicas)

  But: Two independent comments may appear in any order
```

**Implementation:** Vector clocks track causal dependencies.

### Eventual Consistency Subtypes

| Variant | Guarantee | Example |
|---|---|---|
| **Eventual** | Will converge with no new writes | DNS, NTP |
| **Strong Eventual (SEC)** | Merges are deterministic (CRDT) | Shopping cart, collaborative editing |
| **Read-Your-Writes** | You see your own writes | User profile, personalization |
| **Monotonic Reads** | If you read v2, you never read v1 again | Feed, message inbox |
| **Monotonic Writes** | Your writes appear in order | Log appends |

---

## Replication: Consensus Protocols

### Raft Consensus Algorithm

Raft is the most widely implemented consensus protocol (etcd, CockroachDB, TiKV). It provides linearizable distributed log replication.

```
Raft roles:
  Leader: handles all writes, replicates to followers
  Follower: applies entries from leader
  Candidate: requests votes during election

Leader Election:
  1. Follower timeout → becomes Candidate
  2. Votes for itself, sends RequestVote to others
  3. If majority vote granted → becomes Leader
  4. Leader sends heartbeat to prevent new elections

Log Replication:
  1. Client sends write to Leader
  2. Leader appends to local log, sends AppendEntries to followers
  3. Majority acknowledges → commit
  4. Leader responds to client
  5. Followers apply on next heartbeat
```

```
Raft safety guarantee:
  - At most one leader per term
  - Committed entries never overwritten
  - A node won't vote for a candidate whose log is less up-to-date

Raft liveness:
  - Requires a majority (quorum) to be available
  - With N nodes: tolerates floor((N-1)/2) failures
  - 3 nodes → tolerates 1 failure
  - 5 nodes → tolerates 2 failures
```

### Single-Leader vs. Multi-Leader vs. Leaderless

| Dimension | Single-Leader | Multi-Leader | Leaderless (Dynamo-style) |
|---|---|---|---|
| **Write path** | All writes to primary | Any leader accepts writes | Any replica accepts writes |
| **Read path** | Usually from primary or replicas | Any replica | Any replica |
| **Conflict resolution** | No conflicts | LWW (last-write-wins), CRDTs | LWW, CRDTs, vector clocks |
| **Consistency** | Strong (sync replica) or eventual (async) | Eventual | Eventual (tunable with quorum) |
| **Failover** | Complex (leader election needed) | Automatic | Transparent |
| **Network partitions** | Leader must be reachable | Some leaders may be cut off | Quorum determines availability |
| **Examples** | MySQL, PostgreSQL, MongoDB | CockroachDB, Google Spanner, Cassandra (multi-DC) | Dynamo, Cassandra, Riak |

### Quorum Reads and Writes

```
N = total replicas
W = write quorum (minimum acks required)
R = read quorum (minimum reads required)

Strong consistency (linearizable reads): W + R > N
  Example: N=3, W=2, R=2 (2+2 > 3) → always reads at least 1 node with latest write

High availability (eventual reads): W + R ≤ N
  Example: N=3, W=1, R=1 → fast but may return stale data

Common production configs:
  - QUORUM writes + QUORUM reads: balanced (N=3, W=2, R=2)
  - ONE write + QUORUM reads: fast writes, consistent reads
  - QUORUM writes + ONE reads: consistent writes, fast reads
```

---

## Partitioning Strategies: Deep Dive

### Range-Based Partitioning

```
Key range: user_id 1-1,000,000 → shard1
           user_id 1,000,001-2,000,000 → shard2

Advantages:
  - Range scans efficient (sequential reads within a shard)
  - Easy to repartition by splitting ranges

Disadvantages:
  - Hot spots: if users are added sequentially, shard1 handles all new writes
  - Uneven distribution if access is skewed

Mitigation:
  - Append random prefix to key (scatter): 0_user_123, 1_user_123, 2_user_123
  - Requires scatter-gather for reads
```

### Hash-Based Partitioning

```
shard = hash(key) % N

Advantages:
  - Even distribution (good hash function)
  - No hot spots by default

Disadvantages:
  - Range scans require scatter-gather across all shards
  - Adding shards requires rehashing (costly)
  - Solution: consistent hashing (virtual nodes)

Consistent Hashing:
  - Ring of 2^32 positions
  - Each shard owns a range of the ring
  - Adding/removing shards only moves a fraction of keys
  - Virtual nodes (multiple positions per server) improve balance
```

### Directory-Based Partitioning

```
Lookup service maps key → shard

Client → Lookup Service (ZooKeeper/etcd) → gets shard location → query shard

Advantages:
  - Flexible: any mapping logic
  - Easy to migrate data between shards

Disadvantages:
  - Lookup service is a critical dependency (SPOF if not HA)
  - Extra network hop on every request
  - Lookup service must be kept in sync
```

---

## Failure Modes Taxonomy

Distributed systems exhibit distinct failure categories with different causes and mitigations:

### Crash Failures
```
Process stops entirely, doesn't respond
Detection: heartbeat timeout
Mitigation: redundancy + automatic restart (K8s restartPolicy)
```

### Omission Failures
```
Process is running but drops some messages (network packet loss, buffer overflow)
Detection: sequence numbers + acknowledgment
Mitigation: retries, TCP (handles most omissions at transport layer)
```

### Timing Failures
```
Process responds but not within expected time window
Detection: timeout threshold
Mitigation: circuit breaker + timeout tuning, SLA-based timeouts
```

### Byzantine Failures
```
Process behaves arbitrarily — sends malformed/inconsistent data
Detection: extremely hard
Mitigation: cryptographic signatures, BFT consensus (PBFT, Tendermint)
Relevance: normally only in untrusted distributed systems (blockchain)
```

### Failure Mode Comparison Matrix

| Failure | In Practice | Detection | Mitigation |
|---|---|---|---|
| **Cascading failure** | Slow dependency exhausts thread pool | Circuit breaker opens | Bulkhead + circuit breaker |
| **Thundering herd** | Cache expires, N requests hit DB simultaneously | Metric spike on cache miss ratio | Mutex/singleflight, cache stampede protection |
| **Split-brain** | Network partition creates two leaders | STONITH, heartbeat diverge | Leader election via Raft/ZK |
| **Head-of-line blocking** | Long request blocks others in queue | p99/p50 diverge | Request timeout, priority queues |
| **Memory leak** | Service OOM-killed | RSS memory metric climbing | Heap dumps, GC tuning |
| **Clock skew** | NTP drift causes out-of-order events | Compare logical vs wall clock | Hybrid logical clocks, vector clocks |

---

## Database Internal Architecture

### B-Tree vs. LSM-Tree

| Dimension | B-Tree | LSM-Tree |
|---|---|---|
| **Write path** | In-place update (random write) | Append to WAL + memtable (sequential write) |
| **Read path** | Single tree traversal | Check memtable → SSTables → bloom filter |
| **Write amplification** | Low–medium | High (compaction rewrites data) |
| **Read amplification** | Low (single lookup) | Medium (check multiple levels) |
| **Space amplification** | Low | High (until compaction) |
| **Best for** | Read-heavy, random access | Write-heavy, sequential/time-series |
| **Examples** | PostgreSQL, MySQL InnoDB, SQLite | Cassandra, RocksDB, LevelDB, HBase |

```
B-Tree write path:
  1. Find page containing key
  2. Modify page in-place
  3. Write to WAL (Write-Ahead Log) for durability
  4. fsync WAL before returning success

LSM-Tree write path:
  1. Write to WAL (append-only, sequential)
  2. Insert into in-memory memtable (sorted)
  3. When memtable full → flush to disk as immutable SSTable
  4. Background compaction merges SSTables → reduced read amplification
```

### Index Types Comparison

| Index | Structure | Lookup | Range Scan | Updates | Use Case |
|---|---|---|---|---|---|
| **B-tree** | Balanced tree | O(log n) | Efficient | Efficient | General purpose |
| **Hash** | Hash table | O(1) | Not supported | Efficient | Equality lookup only |
| **Bitmap** | Bit arrays | Very fast AND/OR | Inefficient | Expensive | Low-cardinality columns |
| **GiST** | Generalized Search Tree | Variable | Efficient | Moderate | Geospatial, full-text |
| **Inverted** | Term → document list | Very fast | Partial | Expensive | Full-text search |
| **Covering** | Includes all needed columns | No table lookup | Efficient | Moderate | Read-heavy queries |

---

## Network Topology and Latency

### Latency Budget Planning

```
Budget a 200ms SLO for a typical user-facing request:

  Browser → CDN:                    5ms  (3% budget)
  CDN → Load Balancer:              2ms  (1% budget)
  Load Balancer → API Gateway:      2ms  (1% budget)
  API Gateway → Service:            2ms  (1% budget)
  Service → Cache (Redis):          2ms  (1% budget)
  Service → DB (Postgres):         10ms  (5% budget)
  Service → External API:          50ms  (25% budget)
  Response serialization:           5ms  (2.5% budget)
  ─────────────────────────────────────────────────
  Total:                           78ms  (39% of budget)
  Safety headroom:                122ms  (61%)

If p99 is 180ms: only 20ms of safety headroom
  → Need to reduce external API call or add caching
```

### Network Partition Scenarios

```
Scenario 1: Full partition (two halves)
  [Services A, B, C] ←✗→ [Services D, E, F]
  CP system: D, E, F return errors
  AP system: D, E, F serve stale data independently

Scenario 2: Partial partition (asymmetric)
  A can reach B, B can reach C, but A cannot reach C
  More insidious — difficult to detect
  Can cause split-brain in leader election

Scenario 3: Network degradation (not full partition)
  50% packet loss, 10x higher latency
  Timeout thresholds become critical
  Circuit breakers must be carefully tuned
```

---

## Disaster Recovery and Business Continuity

### RTO and RPO

```
RTO (Recovery Time Objective): How long until system is restored after disaster?
  Aggressive: < 1 minute (multi-region active-active)
  Moderate: < 1 hour (warm standby)
  Lenient: < 24 hours (cold backup restore)

RPO (Recovery Point Objective): How much data loss is acceptable?
  Zero: synchronous replication to standby (expensive)
  Seconds: streaming replication lag
  Minutes: WAL shipping
  Hours: periodic backups
```

### DR Strategy Comparison

| Strategy | RTO | RPO | Cost | Complexity |
|---|---|---|---|---|
| **Backup & Restore** | Hours–days | Hours | Low | Low |
| **Pilot Light** | < 1 hour | Minutes | Medium | Medium |
| **Warm Standby** | Minutes | Seconds | High | High |
| **Multi-Region Active-Active** | Seconds | Near-zero | Very High | Very High |

```
Pilot Light:
  Primary region: full production
  DR region: minimal running resources (DB replica, no app servers)
  On disaster: spin up app servers, redirect DNS → RTO ~15 min

Warm Standby:
  DR region: scaled-down but running copy of production
  On disaster: scale up DR, redirect DNS → RTO ~5 min
  Continuously receiving DB replication

Active-Active:
  Both regions serve production traffic simultaneously
  No failover needed — traffic automatically rerouted
  Challenge: cross-region data consistency
```

### Multi-Region Architecture Challenges

```
Challenge 1: Consistency vs Latency
  Cross-region write requires synchronous replication → high latency
  Solution: async replication + eventual consistency where tolerable
           or geo-partition data (EU data stays in EU)

Challenge 2: Conflicting writes
  User updates profile in US and EU simultaneously
  Solution: CRDT data structures, LWW (last-write-wins), or vector clocks

Challenge 3: Global state
  Unique username constraints, sequential IDs
  Solution: ULID/UUID (no coordination), or centralized ID service with local caching
```

---

## Architectural Decision Records (ADRs)

ADRs document significant architectural decisions with their context, rationale, and consequences. Building Microservices emphasizes documenting decisions explicitly to enable independent team decision-making.

### ADR Template

```markdown
## ADR-042: Use Kafka for Order Event Streaming

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Platform Team, Order Team

### Context
Order Service needs to notify Inventory, Payment, and Analytics services
when an order is placed. Current synchronous REST calls create:
- Tight coupling (Order must know all consumers)
- Availability dependency (all services must be up for order placement)
- Scaling bottleneck (Order waits for all downstream services)

### Decision
Publish OrderPlaced events to Kafka. Consumers independently subscribe.

### Rationale
- Decouples Order Service from downstream services
- Consumers process at their own rate
- Event history enables replay for new consumers
- Kafka provides at-least-once delivery with offset management

### Consequences
- Positive: Loose coupling, independent scaling, event replay
- Negative: Eventual consistency (Inventory may lag behind Order state)
- Negative: Requires consumer idempotency (events may be delivered twice)
- Risk: Kafka becomes critical infrastructure — needs HA deployment

### Alternatives Considered
- REST fan-out: tight coupling, all consumers must be available
- Outbox + polling: simpler but higher latency, more DB load
```

---

## Interview Questions: Senior Level

### Q: What is PACELC and how does it extend the CAP theorem?

**A:** CAP only describes trade-offs during a network partition — which is a binary, rare event. PACELC extends this to cover the normal operating case: even without a partition, there is a fundamental trade-off between latency and consistency. A strongly consistent system must coordinate across replicas before responding, adding latency. A low-latency system responds from local state without coordination, returning potentially stale data. PACELC forces architects to state both their partition-time and normal-operation trade-offs explicitly, making it more practical for database selection.

### Q: Explain how Raft consensus ensures only one leader is elected at a time.

**A:** Raft uses term numbers as logical clocks. A candidate must win a strict majority vote, and voters can only vote once per term. Since no two candidates can simultaneously win a majority from the same set of N nodes, at most one can become leader per term. If two candidates split votes, neither wins, and a new election occurs after a randomized timeout (preventing perpetual split votes). A follower rejects any leader whose term is less than its current term, ensuring old leaders that recover after a partition cannot resume leadership.

### Q: What is the difference between B-tree and LSM-tree storage engines? When would you choose each?

**A:** B-trees store data on sorted pages and perform in-place updates — optimized for random reads. LSM-trees append writes to an in-memory structure (memtable), flush it to immutable sorted files (SSTables), and compact in the background — optimized for write throughput. Choose B-trees (PostgreSQL, MySQL) for OLTP workloads with mixed reads and writes. Choose LSM-trees (Cassandra, RocksDB) for write-heavy time-series, logging, or event-store workloads where sequential write throughput is the primary constraint and some read amplification is acceptable.

### Q: How do you achieve zero-downtime database migrations in a microservices system?

**A:** Use the expand-contract pattern. Phase 1 (expand): add the new column/table without removing old ones; both old and new code versions work. Phase 2 (migrate): run a background migration to populate new columns. Phase 3 (contract): once all instances run new code, remove old columns. For schema separation in a shared database being split, use the strangler pattern: replicate data bidirectionally between old and new schemas, switch traffic to new schema, stop bidirectional sync, remove old schema.

### Q: How would you design a globally distributed system that needs both low latency and strong consistency for financial data?

**A:** This requires geographic data partitioning rather than replication. Assign each account to a home region, enforce that all writes go to the home region, and use local reads for most queries with synchronous replication for cross-region reads that must be consistent. For inter-account transfers (e.g., wire transfers), accept higher latency and use a saga with two-phase approach: debit in source region, credit in destination region, with compensation if the credit fails. Google Spanner uses TrueTime (GPS + atomic clocks) to provide global linearizability with bounded uncertainty, accepting slightly higher commit latency (~7ms) as the trade-off.

### Q: What are the failure modes of an eventual consistency model and how do you design systems to handle them?

**A:** Key failure modes: (1) Read-your-writes violation — user posts a comment, refreshes, and does not see it because the read hit a lagging replica; mitigate with sticky routing for the originating user's reads for 30 seconds after a write. (2) Lost updates — two concurrent writers overwrite each other; mitigate with compare-and-swap (optimistic locking) or CRDTs. (3) Phantom reads — query returns different results on two consecutive reads; mitigate with monotonic read guarantees or session-level consistency. (4) Inconsistent secondary indexes — a delete is applied to the primary but not yet to the secondary index; mitigate with index-aware reads and tombstone handling.
