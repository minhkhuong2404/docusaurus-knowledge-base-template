---
id: chapter-09
title: "Chapter 9: Consistency and Consensus"
sidebar_label: "Ch 9 — Consistency & Consensus"
sidebar_position: 5
---

# Chapter 9: Consistency and Consensus

## The Big Idea

Chapter 8 cataloged everything that can go wrong in distributed systems. This chapter asks: **given all those failure modes, what guarantees can we actually provide, and how?**

The key insight: some problems are **solvable** in distributed systems (with the right algorithms), and some are **provably impossible** (no algorithm can solve them). Understanding this boundary is crucial.

---

## 🔄 Consistency Guarantees

### Eventual Consistency

The weakest guarantee: if writes stop, eventually all replicas converge to the same value. But during operation, you might read different values from different replicas.

This is fine for many use cases (DNS, caching), but makes application programming hard — you must reason about concurrent writes and convergence.

### Stronger Consistency Models

We want guarantees closer to "it works like a single machine."

---

## 📖 Linearizability

> **The strongest consistency model.** Makes a distributed system appear as if there is only one copy of the data, and all operations are atomic.

In a linearizable system:
- As soon as a write completes, all subsequent reads (by anyone) see the written value
- Operations appear to take effect at a single point in time (the "linearization point")

**Analogy:** Like a global, instantly-consistent single database — no matter which replica you read from, you always see the latest committed value.

### What Linearizability Enables

- **Locks and leader election:** Only one node can hold a lock at a time. Requires linearizable writes.
- **Unique constraints:** Only one username `alice` can exist. Requires linearizable check-then-write.
- **Cross-channel timing:** If you upload a photo, tell your friend via a chat message, and they look at the photo — they must see the photo (causal dependency).

### The Cost of Linearizability

**CAP Theorem** (Brewer, 2000): In the presence of network partitions, you must choose between **Consistency** (linearizability) and **Availability**.

- If you maintain linearizability during a partition, a node cut off from the leader must refuse requests (unavailable)
- If you stay available, the isolated node serves stale data (not linearizable)

Most real systems cannot tolerate unavailability, so they sacrifice linearizability under partitions.

**Real latency cost:** Even without partitions, achieving linearizability requires coordination (usually via the leader), which adds round-trip latency. RAM in modern multi-core CPUs is not linearizable (CPU caches are not instantly synchronized) — modern CPUs sacrifice linearizability for performance too.

---

## ⏩ Ordering and Causality

**Causality** is weaker than linearizability but still very useful. If event A caused event B, then A must appear before B in any history.

### Sequence Numbers and Lamport Timestamps

Each operation gets a unique, incrementing sequence number. **Lamport timestamps** provide a simple, compact causal ordering:

```
(counter, node_id)
```

Each node tracks the max counter it has seen. On every operation, increment counter by 1. On receiving a message, set counter = max(local, received) + 1. This ensures: if A happened before B, then A's timestamp < B's timestamp.

**Limitation:** Lamport timestamps give total ordering but can't tell you if two events are concurrent. You need to check both nodes to know if `(5, node1)` happened before `(5, node2)`.

### Total Order Broadcast

**Total order broadcast** = all nodes deliver the same messages in the same order. This is a stronger guarantee:

1. **Reliable delivery:** No messages are lost; if delivered to one node, delivered to all
2. **Totally ordered delivery:** Messages delivered in the same order to every node

This is equivalent to **consensus** (as we'll see) and is the basis for replication logs (Chapter 5).

Total order broadcast + replay from the beginning = state machine replication. Every node applies the same sequence of operations → all end up in the same state.

---

## 🏆 Distributed Transactions and Consensus

**Consensus:** Get several nodes to agree on a single value. Sounds simple. In practice, very hard.

**Why it's needed:**
- Leader election: all nodes must agree on which one is the leader
- Atomic commit: all nodes must agree on whether a transaction committed or aborted

### Two-Phase Commit (2PC)

The standard protocol for **atomic commit across multiple nodes**:

**Phase 1 (Prepare):**
```
Coordinator → "Prepare to commit transaction T"
Node 1 → "Yes, I'm prepared" (writes to WAL, locks data)
Node 2 → "Yes, I'm prepared"
```

**Phase 2 (Commit):**
```
Coordinator → "Commit transaction T"
Node 1 → "Committed"
Node 2 → "Committed"
```

If any node votes "No" (or times out), the coordinator sends **Abort** instead.

**The fatal flaw:** The coordinator is a single point of failure. If the coordinator crashes **after** the prepare phase but **before** the commit phase:

```
Nodes 1 & 2 are prepared (in-doubt state — cannot commit or abort alone)
Coordinator is dead
→ Nodes are stuck until coordinator recovers
→ They hold locks, blocking other transactions
```

This is why **2PC is sometimes called a "blocking" protocol** — it can block indefinitely on coordinator failure.

### Three-Phase Commit (3PC)

Attempts to fix 2PC's blocking by adding a third phase. Only works in synchronous networks with bounded delays — impractical for real-world networks.

### Consensus Algorithms: Paxos, Raft, Zab

**Real consensus algorithms** (like Paxos, Raft, Zab) provide:

1. **Uniform agreement:** No two nodes decide differently
2. **Integrity:** No node decides twice; value must have been proposed by some node
3. **Validity:** Only a proposed value can be decided
4. **Termination:** Every non-faulty node eventually decides

They work in **partially synchronous** networks (not perfectly synchronous) and tolerate up to `(n-1)/2` node failures in a cluster of `n` nodes.

**Raft** (Diego Ongaro, 2013) was designed to be more understandable than Paxos. Used by: etcd, CockroachDB, TiKV, Consul.

**Key idea in Raft:** One leader at a time (elected by majority vote). The leader serializes all writes and replicates them. Leader failure → new election. At any point in time, there is one and only one leader, and you can only commit if a majority of nodes acknowledge.

---

## 🔑 ZooKeeper and etcd

ZooKeeper and etcd are **coordination services** built on top of consensus. They're not general-purpose databases — they store small amounts of configuration data that must be strongly consistent.

**What they provide:**
- **Linearizable atomic operations** (CAS — compare-and-set)
- **Total ordering of operations** (with monotonic transaction IDs)
- **Failure detection** (ephemeral nodes + sessions with timeouts)
- **Change notifications** (watchers — notify clients when data changes)

**Common use cases:**
- Leader election (one service registers itself; if the node fails, ephemeral node disappears → others detect and elect new leader)
- Partition assignment (store which partition is assigned to which node)
- Service discovery (register service instances)
- Distributed locks and leases

**The goal:** Outsource the hardest distributed systems problems to ZooKeeper/etcd, then implement your application logic on top of their simple, reliable primitives.

---

## 🚫 Impossibility Results

### FLP Impossibility

In a fully asynchronous system (no timing guarantees), **consensus is impossible** if even one node can crash (Fischer, Lynch, Paterson, 1985).

This sounds catastrophic — but real systems are partially synchronous (mostly well-behaved, occasionally slow). Real consensus algorithms achieve safety always and liveness in good conditions.

### The CAP Theorem, Revisited

CAP is often misunderstood. More precisely:

- **Consistency** = linearizability (not just any consistency model)
- **Availability** = every request receives a response (not just that *some* node responds)
- **Partition tolerance** = the system works despite network partitions

In real networks, partitions *will* happen. So the real choice is: during a partition, do you sacrifice consistency (serve stale data) or availability (refuse requests)?

**PACELC** is a more nuanced model: even without partitions (when the system is running normally), there's a latency-consistency trade-off. Higher consistency = more coordination = more latency.

---

## Summary

| Guarantee | Strength | Cost | Use when |
|---|---|---|---|
| **Eventual consistency** | Weakest | Lowest | High availability, partition-tolerant |
| **Causal consistency** | Medium | Medium | Need ordering without full coordination |
| **Linearizability** | Strongest | Highest | Locks, unique constraints, leader election |

**Key insight:** Consensus is the fundamental primitive that enables everything else in distributed systems — atomic commits, leader election, total order broadcast. These all reduce to consensus. And consensus has provable impossibility in fully async systems, which is why distributed systems are hard.
