---
id: distributed-locking
title: Distributed Locking
sidebar_label: Distributed Locking
description: Designing safe distributed locks with leases, fencing tokens, and failure handling across Redis, ZooKeeper, and Kubernetes.
tags: [distributed-locking, lease, fencing-token, redis, zookeeper, kubernetes, coordination]
---

# Distributed Locking

> A distributed lock coordinates mutually exclusive work across multiple processes or nodes.

---

## Beginner View

Use distributed locking when exactly one worker should perform an operation at a time:
- Scheduled billing job
- Leader-only background compaction
- Single owner of resource migration

Basic pattern:
1. Acquire lock with TTL
2. Execute critical section
3. Renew lease if long-running
4. Release lock

---

## Why Naive Locks Fail

Naive pattern:
```text
SET lock_key = worker-A
...work...
DEL lock_key
```

Problems:
- Worker crash may leave lock stuck forever
- Network pause may let lock expire while worker still writing
- Clock assumptions create split ownership

Always use lease + ownership token checks.

---

## Senior Deep Dive

### Leases and Fencing Tokens
A lease prevents permanent deadlock, but lease alone is not enough.

**Fencing token** (monotonic number) is required for write safety:
- Lock service returns token 101 to worker A
- Later returns token 102 to worker B
- Storage accepts only highest token

If worker A resumes after GC pause, its stale token is rejected.

```java
public record LockGrant(String ownerId, long fencingToken, Instant expiresAt) {}
```

### Safety and Liveness Goals
- Safety: at most one valid writer at a time
- Liveness: progress continues despite crashes/network delays

### Backend Choices

| Backend | Strengths | Risks |
|---|---|---|
| Redis (`SET NX PX`) | Simple, fast | Requires careful failover semantics |
| ZooKeeper/etcd | Strong coordination primitives | Operational complexity |
| Kubernetes Lease | Native for k8s workloads | Limited beyond k8s control plane context |

---

## Patterns

### Redis Lease Pattern
```text
SET lock:jobA owner-1 NX PX 30000
```
Release only if owner matches value (Lua compare-and-delete).

### Database Advisory Lock Pattern
Useful when lock scope is tightly coupled to DB transaction and throughput is moderate.

### Leader Election Pattern
When many operations are "leader-only," election can replace many fine-grained locks.

---

## Failure Modes and Mitigations

- GC pause exceeds lease TTL -> stale writer risk
- Network partition isolates lock holder
- Lock storm causes thundering retries

Mitigations:
- Fencing token validation in data store
- Jittered retries and bounded retry windows
- Lock metrics: acquisition latency, contention, expiry count
- Avoid long critical sections; split into smaller idempotent units

---

## Interview Questions

### Q: Why is lease-based locking safer than permanent locks?

**A:** Leases expire automatically if a holder crashes or gets partitioned, preventing indefinite deadlock. Permanent locks require manual cleanup and are prone to orphaned ownership.

### Q: What problem do fencing tokens solve?

**A:** They prevent stale lock holders from writing after losing lock ownership. Storage accepts only the highest token, so old owners are rejected.

### Q: Is Redis lock enough for critical financial writes? Why or why not?

**A:** Usually no by itself, because failover timing and partition edges can violate strict correctness assumptions. For critical money movement, combine stronger coordination and storage-level safeguards.

### Q: How do you safely release a Redis lock without deleting someone else's lock?

**A:** Store a random owner value at acquire, then release via atomic compare-and-delete Lua script. Never `DEL` by key alone.

### Q: When should you use leader election instead of per-task locks?

**A:** Use leader election when one coordinator should own a stream of tasks or cluster-wide decisions. Use per-task locks when ownership must be fine-grained and parallel.

### Q: How would you design lock observability and SLOs?

**A:** Track acquisition latency, contention rate, lease expiries, and stale-write rejections. Define SLOs on lock success latency and correctness incidents, not just throughput.

### Q: What can still go wrong even with a lease?

**A:** Clock skew, GC pauses, network partitions, and delayed packets can make a client act on an expired lease. Leases reduce risk but must be combined with fencing/idempotency.

### Q: Compare ZooKeeper/etcd locks vs Redis locks for correctness guarantees.

**A:** ZooKeeper/etcd provide stronger linearizable coordination semantics for correctness-critical locking. Redis locks are simpler and fast but better suited to best-effort coordination.

