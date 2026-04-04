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

1. What is the CAP theorem and what trade-off do most modern databases make?
2. Explain the difference between linearizability and eventual consistency. Give a use case for each.
3. A service has 99.9% uptime. You depend on 3 such services in series. What's your effective uptime?
4. When would you choose a CP system over an AP system?
5. What is the difference between horizontal and vertical scaling?
6. How does replication lag affect your system, and how do you mitigate it?
