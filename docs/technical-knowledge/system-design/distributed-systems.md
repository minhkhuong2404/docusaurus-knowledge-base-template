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

