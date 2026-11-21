---
id: distributed-systems
title: Distributed Systems
sidebar_label: Distributed Systems
description: Core distributed systems concepts including consensus algorithms, leader election, vector clocks, distributed transactions, fault tolerance, and the fallacies of distributed computing.
tags: [distributed-systems, consensus, raft, paxos, leader-election, vector-clocks, fault-tolerance, two-phase-commit]
---

# Distributed Systems

---

## Fallacies of Distributed Computing

Never assume:
1. The network is reliable
2. Latency is zero
3. Bandwidth is infinite
4. The network is secure
5. Topology doesn't change
6. There is one administrator
7. Transport cost is zero
8. The network is homogeneous

---

## Consensus Problem

**How do N nodes agree on a single value despite failures?**

Used for: leader election, distributed commits, replicated state machines.

### Paxos (Classic)
Complex, hard to implement. Foundation of many systems.

### Raft (Understandable)
Used by: etcd, Consul, CockroachDB.

```
All nodes start as Followers
If no heartbeat received → become Candidate → request votes
Majority votes → become Leader
Leader sends heartbeats + log entries to Followers
```

**Leader Election:**
```
Follower timeout (150–300ms) → RequestVote RPC
First to get majority wins
Split vote → timeout + retry with new term
```

**Log Replication:**
```
Client → Leader (append entry to log)
       → Send to all Followers (AppendEntries RPC)
       → Majority ACK → Mark committed
       → Reply to client
```

---

## Leader Election Patterns

### Zookeeper Ephemeral Nodes
```
All candidates create ephemeral sequential znode: /election/node-000N
Node with smallest number = leader
On leader failure → znode deleted → next node becomes leader
```

### Kubernetes — Only one leader with Lease
```yaml
# Leader election via lease object
# Spring Integration or custom via k8s client
```

```java
// Spring Integration Leader Election
@Bean
public LeaderInitiator leaderInitiator(LockRegistry lockRegistry) {
    return new LeaderInitiator(lockRegistry, new DefaultCandidate("my-service", "my-role"));
}

@EventListener
public void onLeadershipGranted(OnGrantedEvent event) {
    log.info("This node is now the leader");
    startLeaderOnlyTask();
}

@EventListener
public void onLeadershipRevoked(OnRevokedEvent event) {
    log.info("Leadership revoked");
    stopLeaderOnlyTask();
}
```

---

## Vector Clocks

Track causality across distributed systems without synchronized clocks.

```
Initial: A=[0,0,0], B=[0,0,0], C=[0,0,0]

A sends event:  A=[1,0,0]
A→B message:    B receives → B=[1,1,0]
A→C message:    C receives → C=[1,0,1]
B→C message:    C receives → C=[max(1,1), max(0,1), max(1,1)] = [1,1,1]

Causality: if VC(a) < VC(b) for all components → a happened-before b
           if neither VC(a) < VC(b) nor VC(b) < VC(a) → concurrent
```

**Used by**: Amazon DynamoDB, Riak (for conflict detection).

---

## Two-Phase Commit (2PC)

Two-Phase Commit (2PC) is a distributed transaction protocol that ensures atomic commit across multiple participants. 

For complete sequence diagrams, failure mode analyses (e.g., blocking coordinators, network partitions), and a comparison with **Three-Phase Commit (3PC)** and the **Saga Pattern**, see the dedicated [Two-Phase Commit (2PC) & Three-Phase Commit (3PC) Guide](./two-phase-commit.md) and the [Saga Pattern Guide](./saga-pattern.md).

---

## CAP Theorem in Real Systems

CAP fundamentals are documented in [Architecture Fundamentals](./architecture-fundamentals). In practice, partition tolerance is non-negotiable, so production choices are usually CP vs AP by workload.

### Applied Decision Guide
- Payments, inventory, ledger: lean CP for correctness on critical writes
- Feeds, analytics, recommendations: lean AP for availability and low latency
- Hybrid systems often expose CP writes and AP reads in different endpoints

### Senior Tradeoff Example
For `N=3` replicas:
- `W=2, R=2` gives stronger read freshness but lower availability under partition
- `W=1, R=1` improves availability but increases stale-read risk

---

## Distributed Locking Essentials

### Beginner View
Distributed locks ensure only one worker performs a critical operation at a time (for example, one scheduler instance runs a monthly billing job).

### Senior Deep Dive
Leases are safer than forever locks: each lock has TTL and requires renewal.

Critical safety concept: **fencing tokens**.
- Lock service returns monotonically increasing token
- Downstream storage accepts writes only from highest token
- Prevents stale leader from writing after lease expiry

```
Worker A gets token 41 (lease expires)
Worker B gets token 42
If A wakes up late, storage rejects token 41 writes
```

See dedicated guide: [Distributed Locking](./data-consistency#distributed-locking).

---

## Beyond Crash Faults: BFT Overview

Raft/Paxos assume crash faults (nodes fail-stop). Byzantine Fault Tolerance (BFT) handles arbitrary or malicious behavior.

### Senior View
- Crash fault model: typically `2f + 1` nodes tolerate `f` failures
- Byzantine model: typically `3f + 1` nodes tolerate `f` Byzantine nodes
- BFT adds communication rounds and signature overhead

Use BFT only when trust boundaries require it (multi-organization consensus, adversarial environments).

See dedicated guide: [Advanced Consensus and BFT](./advanced-consensus-bft).

---

## Gossip Protocol

Nodes periodically share information with random peers. Information spreads like a virus.

```
Round 1: A knows X → A tells B, C
Round 2: B knows X → B tells D, E; C tells F, G
Round 3: All nodes know X
```

**Properties**:
- Fault-tolerant (no central coordinator)
- Eventually consistent
- Used by: Cassandra (membership), Redis Cluster, Consul

---

## Failure Detectors

### Heartbeat + Timeout
```
Every 5s: Node A sends heartbeat to B
If B doesn't hear from A in 15s → A is suspected failed
```

**Challenge**: Cannot distinguish slow from dead (network partition vs node crash).

### Phi Accrual Failure Detector (Cassandra)
Instead of binary alive/dead, outputs a suspicion level φ (phi):
- φ = 1: ~10% chance of failure
- φ = 10: ~99.99% chance of failure
- Application sets threshold (e.g., φ > 8 → mark suspect)

---

## Consistency Patterns in Practice

### Read-Your-Writes via Sticky Reads
```java
// After write, route subsequent reads to primary for N seconds
public User getUser(Long userId, String sessionToken) {
    boolean recentWrite = recentWriteCache.contains(userId);
    if (recentWrite) {
        return primaryRepo.findById(userId); // Strong consistency
    }
    return replicaRepo.findById(userId); // Eventual consistency
}
```

### Monotonic Read Consistency
Always read from the same replica in a session.

```java
// Session affinity: bind user to replica by userId hash
public DataSource selectReplica(Long userId) {
    int replicaIndex = (int)(userId % replicas.size());
    return replicas.get(replicaIndex);
}
```

---

## Distributed Transactions Comparison

| Approach | Availability | Consistency | Complexity |
|---|---|---|---|
| 2PC | Low (blocking) | Strong | Medium |
| 3PC | Medium | Strong | High |
| Saga (Orchestration) | High | Eventual | Medium |
| Saga (Choreography) | High | Eventual | High (debugging) |
| TCC (Try-Confirm-Cancel) | High | Strong (conceptually) | High |

---

## Idempotency Keys (Distributed)

```java
// Distributed idempotency with Redis
public <T> T executeIdempotent(String key, Supplier<T> operation, Duration ttl) {
    String result = redis.opsForValue().get("idem:" + key);
    if (result != null) {
        return deserialize(result, operationType);
    }

    T value = operation.get();

    // SET NX (only if not exists) prevents race condition
    redis.opsForValue().setIfAbsent("idem:" + key, serialize(value), ttl);
    return value;
}
```

---

## Network Partitions & Split-Brain

```
Data Center A ←──×──→ Data Center B
(network cut)

A: "I'm the leader"
B: "I'm the leader"
→ Both accept writes → divergent state (split-brain)
```

**Solutions**:
- **Quorum**: Only side with majority can elect leader
- **Fencing**: External authority invalidates old leader's token
- **Pause-minority**: Smaller partition stops accepting writes

---

## Interview Questions

### Q: What is the consensus problem? What algorithms solve it?

**A:** Consensus means multiple nodes agree on one sequence of decisions despite failures. Paxos, Raft, and various BFT protocols solve different fault/trust models.

### Q: Explain Raft leader election in plain English.

**A:** When followers stop hearing heartbeats, they start an election and request votes for a new term. A node winning majority becomes leader and starts sending heartbeats.

### Q: What is a vector clock and how does it detect causal ordering?

**A:** A vector clock tracks per-node event counters in updates. Comparing vectors shows whether one event happened-before another or if they are concurrent conflicts.

### Q: What is Two-Phase Commit? What are its failure modes?

**A:** Two-Phase Commit (2PC) coordinates distributed resource updates by voting to prepare before executing a commit. Its primary failure modes are coordinator failure (leaving participants blocked holding locks) and network partitions. See the [Two-Phase Commit Guide](./two-phase-commit.md) for details.

### Q: How does a gossip protocol work? What is it used for?

**A:** Nodes periodically exchange state with random peers, and updates spread probabilistically through the cluster. It is used for membership, health signals, and configuration dissemination.

### Q: What is split-brain syndrome and how do you prevent it?

**A:** Split-brain is when partitions each believe they are primary and accept conflicting writes. Prevent it with quorum rules, fencing, and single-writer leadership.

### Q: How do you build a distributed system that is available during a network partition?

**A:** Favor AP behavior for selected operations, allow local writes, and reconcile conflicts later. Classify which paths can be eventually consistent versus requiring strong consistency.

### Q: What is the difference between a failure detector and a consensus algorithm?

**A:** Failure detector guesses node liveness; consensus establishes agreed decisions despite uncertain liveness. One provides signals, the other provides safety/ordering guarantees.

### Q: How does Zookeeper achieve distributed coordination?

**A:** ZooKeeper uses a quorum-backed ordered log and ephemeral/sequential znodes for locks, leader election, and config. Session semantics and watches enable reliable coordination workflows.

### Q: What are the fallacies of distributed computing and why do they matter?

**A:** They are false assumptions like "network is reliable" and "latency is zero." Ignoring them leads to fragile designs that fail under normal production conditions.

---

## 🔬 Deep Dive: Distributed Consensus — FLP, Paxos, Raft, and Linearizable Reads

> **Reference**: [Sujeet Pro — Distributed Consensus](https://sujeet.pro/articles/distributed-consensus)

### 1. The FLP Impossibility Theorem & Safety vs. Liveness

In 1985, Fischer, Lynch, and Paterson proved one of the most foundational theorems in computer science (**FLP Impossibility**):
> *In a purely **asynchronous network model** (where message delays are unbounded and there is no shared global clock), **no deterministic consensus protocol** can guarantee both **Safety** (agreement) and **Liveness** (termination) if even a **single node** is allowed to experience an unannounced crash-stop failure ($f = 1$).*

#### Why Does FLP Happen, and How Do Real Protocols Circumvent It?
- **The Fundamental Ambiguity**: In an asynchronous network, if Node A sends a message to Node B and receives no reply after $500\text{ ms}$, Node A cannot tell whether Node B has crashed or whether the network packet is merely delayed behind a congested router.
- **Safety vs. Liveness Split**: Production consensus protocols (Paxos, Raft, ZAB) **never compromise Safety** (two nodes must never commit conflicting values for the same log index, even under arbitrary network delays or partitions). To achieve **Liveness** (eventually electing a leader and making progress) despite FLP, they relax the pure asynchronous model to a **Partially Synchronous Model** using **randomized election timeouts**—guaranteeing safety at all times and guaranteeing progress whenever the network remains stable longer than the broadcast round-trip time ($RTT \ll \text{ElectionTimeout}$).

---

### 2. Single-Decree Paxos vs. Multi-Paxos vs. Raft

#### Single-Decree Paxos (2-Phase Protocol)
Basic Paxos agrees on a **single immutable value** across Proposers, Acceptors, and Learners using monotonically increasing, globally unique proposal numbers $n = (\text{round\_counter}, \text{node\_id})$:
1. **Phase 1a — `Prepare(n)`**: A Proposer selects proposal number $n$ and sends `Prepare(n)` to a majority quorum of Acceptors ($\lfloor N/2 \rfloor + 1$).
2. **Phase 1b — `Promise(n, n_a, v_a)`**: If $n$ is strictly greater than any proposal number the Acceptor has ever promised (`n > minProposal`), the Acceptor persists `minProposal = n` to disk and replies with a **Promise** never to accept any future proposal $< n$, returning the highest-numbered proposal $(n_a, v_a)$ it has already accepted (if any).
3. **Phase 2a — `Accept(n, v)`**: Once the Proposer collects promises from a majority quorum, **it is constrained in its choice of value**: if any Acceptor returned a previously accepted value $v_a$, the Proposer **must** set $v$ to the value $v_a$ with the highest proposal number $n_a$ among the responses; only if no Acceptor in the quorum had accepted anything is the Proposer free to propose its own client value $v$.
4. **Phase 2b — `Accepted(n)`**: Each Acceptor accepts $(n, v)$ unless it has subsequently promised a higher number $> n$. Once a majority accepts $(n, v)$, the value is **chosen (committed)** forever.

#### Multi-Paxos vs. Raft: Why Raft Conquered Production Engineering
Running 2-RTT Basic Paxos for every single state machine command suffers from dueling proposers (livelock) and double network latency. **Multi-Paxos** elects a stable distinguished leader (running Phase 1 `Prepare/Promise` once per leadership epoch) so steady-state writes only need Phase 2 (`Accept/Accepted` — **1 RTT**). However, Multi-Paxos leaves log gaps, out-of-order slot commits, and membership changes underspecified. **Raft** (Ongaro & Ousterhout, 2014) formalizes replicated state machines via strong leader constraints:

| Mechanism | Multi-Paxos | Raft | ZooKeeper ZAB (ZooKeeper Atomic Broadcast) |
| :--- | :--- | :--- | :--- |
| **Leader Election Restriction** | Any node can run Phase 1 to become leader, then must reconstruct missing log slots during recovery | **Leader Completeness**: Only a candidate whose log is at least as up-to-date (`lastLogTerm`, `lastLogIndex`) as a majority can win election | Node with highest `(epoch, zxid)` wins election; explicit **Synchronization Phase** before accepting traffic |
| **Log Continuity** | Allows out-of-order log slot commits (leaves temporary holes that delay state machine application) | **Strict Contiguous Log**: Logs are append-only with zero gaps; `Log Matching Property` guarantees identical prefixes | Strict FIFO TCP channel ordering + contiguous `zxid` (64-bit: 32-bit epoch + 32-bit counter) |
| **Logical Clock** | Proposal ballot number `(round, nodeId)` | **Term (`uint64`)** monotonic counter incremented on every election | **Epoch** (upper 32 bits of the 64-bit `zxid`) |
| **Previous-Term Commit Rule** | Leader re-proposes uncommitted entries from earlier ballots under its new ballot number | A newly elected Raft leader **never commits entries from previous terms by counting replicas alone**; it must first commit an entry from its *current* term (often a `no-op` entry immediately upon election) | Synchronization phase commits/truncates prior epoch proposals before broadcasting new epoch transactions |

---

### 3. Linearizable Reads Without Raft Log Writes (`ReadIndex` & `LeaseRead`)

A naive assumption is that reading from the Raft Leader is automatically linearizable. **It is not!** If Leader $L_1$ is silently partitioned from the other 4 nodes in a 5-node cluster, nodes $\{N_2, N_3, N_4, N_5\}$ will elect $L_2$ and commit new writes while $L_1$ still believes it is the leader (until $L_1$ steps down). If a client reads directly from $L_1$'s local memory during that window, $L_1$ serves **stale split-brain data**.

On the other hand, putting every `GET` request through the full Raft disk log (`AppendEntries` + `fsync`) ruins read throughput. Production systems (etcd, TiKV, CockroachDB) use two optimizations:

1. **`ReadIndex` Protocol (Zero Disk I/O, 1 Lightweight Heartbeat RTT)**:
   - When Leader $L_1$ receives a linearizable read, it records its current `commitIndex` as `readIndex`.
   - $L_1$ sends a lightweight **heartbeat round** (no log payload, no disk `fsync`) to a majority quorum to prove it is still the active leader *after* the read request arrived.
   - Once the majority acknowledges the heartbeat, $L_1$ waits until its local state machine `lastApplied >= readIndex`, then serves the read from memory. (Multiple concurrent reads batch onto a single heartbeat round!).
2. **`LeaseRead` Protocol (Zero Network RTT, Bounded Clock Drift Assumption)**:
   - The leader acquires a time-bounded **Leader Lease** (e.g., $\text{LeaseDuration} = \frac{\text{ElectionTimeout}}{\text{MaxClockDriftFactor}}$). Since followers promise not to start an election until `ElectionTimeout` expires, $L_1$ serves linearizable reads in **0ms locally** without any network RPC as long as its monotonic clock is within the safe lease window.

---

### 4. Production Raft Hardening: The `Pre-Vote` Protocol & Joint Consensus

#### The Disruptive Partitioned Node Problem & `Pre-Vote`
Suppose Follower $F_5$ experiences an asymmetric network partition where it cannot receive heartbeats from Leader $L_1$. Every 150ms, $F_5$'s election timer fires, so $F_5$ increments its `currentTerm` ($4 \rightarrow 5 \rightarrow 6 \dots \rightarrow 999$). When the partition heals, $F_5$ broadcasts `RequestVote(term=999)`. Even though $F_5$'s log is stale and it **cannot win** the election, its higher term number (`999 > 4`) forces the healthy Leader $L_1$ to immediately step down to Follower, causing a cluster-wide availability outage!
- **The `Pre-Vote` Fix (etcd / Raft PhD Thesis)**: Before a node increments its `currentTerm` and transitions to `Candidate`, it enters a **`PreCandidate`** phase and sends `PreVote(nextTerm = currentTerm + 1, lastLogIndex, lastLogTerm)`. Peers only grant a `PreVote` if (a) the candidate's log is up-to-date AND (b) the peer has not received a valid heartbeat from a current leader within the minimum election timeout. Thus, an isolated node never inflates its term!

#### Dynamic Membership Changes (`Single-Server` vs. `Joint Consensus`)
Naively switching a cluster configuration from $C_{\text{old}}$ (3 nodes) to $C_{\text{new}}$ (5 nodes) in one step is unsafe: due to message delays, two disjoint majorities ($2\text{ of }3$ under $C_{\text{old}}$ and $3\text{ of }5$ under $C_{\text{new}}$) can elect two simultaneous leaders in the same term!
- **Joint Consensus ($C_{\text{old,new}}$)**: The leader first appends a transitional configuration entry $C_{\text{old,new}}$ where **every decision requires a separate majority in BOTH $C_{\text{old}}$ AND $C_{\text{new}}$**. Once $C_{\text{old,new}}$ is committed, the leader appends the final configuration entry $C_{\text{new}}$.
- **Single-Server Change**: Alternatively, only add or remove **1 node at a time**, waiting for each single-node configuration change to commit before starting the next (mathematically guaranteeing that the old majority and new majority always overlap by at least 1 node).

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Distributed Consensus Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

- **State Non-Negotiable Invariants Upfront**: Open by defining the **Replicated State Machine (RSM)** invariant: if two deterministic state machines start from the same initial state and apply the exact same ordered sequence of committed log entries, they are guaranteed to reach the exact same state. State the **Crash-Fault Quorum Math**: tolerating $f$ fail-stop node failures requires $N = 2f + 1$ nodes (whereas Byzantine Fault Tolerance requires $N = 3f + 1$).
- **Back-of-the-Envelope Capacity & Hardware Physics**: Anchor why consensus groups are kept small (3 or 5 nodes, almost never 11+): every Raft write requires the leader to serialize the entry, `fsync` its local WAL ($0.5\text{–}2\text{ ms}$ on NVMe), and wait for $\lfloor N/2 \rfloor$ followers to `fsync` and reply over the network. Adding nodes **decreases write throughput** and increases tail latency without improving read capacity unless you shard the keyspace into **Multi-Raft ranges** (CockroachDB ranges / TiKV regions, where each 64 MB shard runs its own independent 3-node Raft group).
- **Proactive Failure-Mode Identification**: Proactively raise **stale leader reads during network partitions** (requiring `ReadIndex`), **term inflation by isolated nodes** (requiring `Pre-Vote`), **split-vote election livelocks** (solved by randomized timeouts $150\text{–}300\text{ ms}$), and **zombie leader writes** (solved by monotonic **fencing tokens**).
- **Day-2 Operational Realism**: Explain why **5 nodes** is the production sweet spot over 3 nodes (during a rolling upgrade or maintenance where 1 node is intentionally taken offline, a 3-node cluster has $0$ fault tolerance left, whereas a 5-node cluster can still survive 1 unexpected crash while maintaining a quorum of 3), and how **Non-Voting Learner Nodes** are used to catch up new replicas before promoting them to voting members.

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "We have a 3-node etcd/Raft cluster and want higher availability and faster performance, so let's scale it up to 6 nodes!"
* **Junior/Mid Answer:** *"Great idea—6 nodes gives us double the cluster capacity and lets us survive more node failures."*
* **Principal Rebuttal:**
  > *"Moving from 3 nodes to 6 nodes actually makes the cluster **less fault-tolerant** than 5 nodes while making every write slower! First, an even-numbered cluster ($N = 6$) requires a majority quorum of $\lfloor 6/2 \rfloor + 1 = 4$, meaning it can only tolerate $6 - 4 = 2$ node failures—the exact same fault tolerance ($f = 2$) as a **5-node** cluster (quorum = 3), but with a higher probability that a random failure takes down 4 nodes. Second, every write in Raft must replicate to all nodes and wait for a majority quorum, so increasing $N$ increases network fan-out on the leader and inflates p99 commit latency. Never use even-numbered consensus quorums, and scale horizontally via **Multi-Raft sharding** rather than giant single Raft groups."*

#### Trap 2: "To guarantee linearizable reads in Raft without writing to the Raft log, can't the client just always send read requests to the current Raft Leader?"
* **Junior/Mid Answer:** *"Yes, because all writes go through the Raft Leader, the Leader always has the latest state in memory."*
* **Principal Rebuttal:**
  > *"Reading directly from the Leader's local memory without verification violates Linearizability during a network partition! Suppose Leader $L_1$ is isolated in a minority partition while the majority partition elects Leader $L_2$, which commits $X = 2$. Until $L_1$'s step-down check fires or it sees a higher term, $L_1$ still thinks it is Leader and will serve the stale value $X = 1$ from memory. To serve linearizable reads without disk log writes, $L_1$ must either execute the **`ReadIndex` protocol** (capturing `commitIndex` and confirming majority leadership via a lightweight heartbeat round) or use a bounded **`LeaseRead`** with strict monotonic clock drift guards."*

#### Trap 3: "When adding a new node to a 3-node Raft cluster with a 50 GB state log, we just call `AddServer` and include it in the voting quorum immediately, right?"
* **Junior/Mid Answer:** *"Yes, Raft's `AppendEntries` RPC will automatically stream the missing log entries to the new node."*
* **Principal Rebuttal:**
  > *"If you immediately add an empty node as a **voting member** (moving from 3 to 4 or 5 voting nodes), its log is 50 GB behind and it cannot acknowledge new entries until it finishes streaming a snapshot (`InstallSnapshot`). If one existing node crashes during that 10-minute catch-up window, your cluster loses majority quorum and suffers a total write outage! Worse, if the leader's replication pipeline saturates the network link sending the snapshot, heartbeats can stall. In production (etcd / Kafka KRaft), you always add the new node as a **Non-Voting Learner (`PromoteLearner`)** first; it receives the snapshot and catches up to within milliseconds of the leader's `commitIndex` without counting toward quorum calculations, and only then is it atomically promoted to a voting Follower."*

#### Trap 4: "We use Redis / ZooKeeper to acquire a distributed lock before our worker updates a file in S3 / database. Once the worker holds the lock with a 30-second TTL, is mutual exclusion guaranteed?"
* **Junior/Mid Answer:** *"Yes, as long as the lock has a TTL so it auto-releases if the worker crashes, two workers can never corrupt the resource."*
* **Principal Rebuttal:**
  > *"A TTL-based distributed lock alone cannot guarantee safety because of unbounded process pauses (Martin Kleppmann's GC pause scenario). Suppose Worker 1 acquires the lock (`TTL = 30s`), prepares to write to storage, and immediately hits a 35-second JVM stop-the-world GC pause (or kernel page fault). At $t = 30\text{s}$, the lock expires; Worker 2 acquires the lock and writes to storage at $t = 32\text{s}$. At $t = 35\text{s}$, Worker 1's CPU thread wakes up—completely unaware its lease expired 5 seconds ago—and overwrites Worker 2's data! To make distributed locking safe, the consensus coordinator (ZooKeeper `zxid` / etcd `ModRevision`) must issue a monotonically increasing **Fencing Token** (`33`, then `34`), and the downstream storage engine must reject any write carrying a token $\le$ the highest token it has already processed."*

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **FLP Impossibility** | *"Consensus is always guaranteed if a majority of nodes are alive."* | *"FLP proves deterministic consensus cannot guarantee both Safety and Liveness in a purely asynchronous network; Raft/Paxos guarantee **Safety unconditionally** and achieve **Liveness via partial synchrony + randomized election timeouts**."* |
| **Raft Election Safety** | *"Any follower whose timer expires first becomes the new leader."* | *"Enforce **Leader Completeness**: voters reject `RequestVote` RPCs unless the candidate's `(lastLogTerm, lastLogIndex)` is at least as up-to-date as the voter's own log, and leaders only commit prior-term entries indirectly by committing an entry in their current term."* |
| **Linearizable Reads** | *"Just read from the Raft leader node."* | *"Use **`ReadIndex`** (capture `commitIndex` + 1 batched heartbeat quorum confirmation + wait for `lastApplied >= readIndex`) to prevent stale reads from a partitioned leader without paying Raft disk log overhead."* |
| **Partitioned Flapping Node** | *"When a partitioned node reconnects, it rejoins as a follower."* | *"Without **`Pre-Vote`**, an isolated follower repeatedly increments its `term` and forces the healthy leader to step down upon reconnection; `Pre-Vote` verifies majority reachability and log freshness before incrementing `currentTerm`."* |
| **ZooKeeper vs. Kafka KRaft** | *"Kafka removed ZooKeeper just to have one fewer service to deploy."* | *"Replacing ZooKeeper (`ZAB`) with an embedded **KRaft** (`Raft` pull-based metadata log) eliminated the dual-state split-brain between ZK znodes and Controller memory, scaling cluster metadata from $\sim 200\text{k}$ to Millions of partitions with millisecond controller failover (`Active` to hot-standby `Voter`)."* |


