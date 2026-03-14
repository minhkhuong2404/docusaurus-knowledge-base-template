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

Atomic commit across multiple databases.

```
Phase 1 (Prepare):
  Coordinator → "Can you commit?" → Participant A: "Yes"
                                  → Participant B: "Yes"

Phase 2 (Commit):
  Coordinator → "Commit!" → Participant A commits
                          → Participant B commits

If any "No" in Phase 1:
  Coordinator → "Rollback" → All rollback
```

**Problems**:
- Coordinator failure during Phase 2 = participants stuck in limbo
- Blocking protocol — participants hold locks during prepare
- Network partition breaks the protocol

**Alternatives**: Saga pattern (non-blocking), 3PC (complex).

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

1. What is the consensus problem? What algorithms solve it?
2. Explain Raft leader election in plain English.
3. What is a vector clock and how does it detect causal ordering?
4. What is Two-Phase Commit? What are its failure modes?
5. How does a gossip protocol work? What is it used for?
6. What is split-brain syndrome and how do you prevent it?
7. How do you build a distributed system that is available during a network partition?
8. What is the difference between a failure detector and a consensus algorithm?
9. How does Zookeeper achieve distributed coordination?
10. What are the fallacies of distributed computing and why do they matter?
