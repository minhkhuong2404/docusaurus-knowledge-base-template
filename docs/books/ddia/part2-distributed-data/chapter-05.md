---
id: chapter-05
title: "Chapter 5: Replication"
sidebar_label: "Ch 5 — Replication"
sidebar_position: 1
---

# Chapter 5: Replication

## The Big Idea

**Replication** means keeping a copy of the same data on multiple machines (connected via a network). Reasons to replicate:

- **Latency:** Keep data geographically close to users
- **Availability:** Continue working even if some nodes fail
- **Read throughput:** Scale out read queries across multiple machines

The hard part is not copying data — it's **handling changes** to replicated data. This chapter covers the main replication algorithms and their trade-offs.

---

## 📡 Leaders and Followers

The most common replication approach: **leader-based replication** (also called master-slave or active-passive).

```
Client writes → Leader → replication log → Follower 1
                                         → Follower 2
Client reads  → Follower (any)
```

1. One replica is the **leader**. All writes go through the leader.
2. The leader writes data to its local storage and sends a **replication log** to all followers.
3. **Followers** apply the log in the same order — their data is an exact copy.
4. Reads can be served by the leader or any follower.

Used by: PostgreSQL, MySQL, MongoDB, Kafka, RabbitMQ (and many more).

---

## ⏱️ Synchronous vs Asynchronous Replication

**Synchronous:** The leader waits for follower acknowledgment before confirming the write to the client.
- ✅ Follower is guaranteed up-to-date
- ❌ Write blocked if follower is slow or down

**Asynchronous:** The leader sends the write to the follower but doesn't wait.
- ✅ Leader can continue writing even if follower is slow
- ❌ If leader fails before follower catches up, writes are lost

In practice, **semi-synchronous** is common: one follower is synchronous, the rest are async. This ensures at least two nodes have the latest data.

Fully asynchronous replication is widely used (especially for geographically distributed systems) despite the durability risk, because blocking writes on slow replicas is unacceptable.

---

## 🔧 Handling Node Outages

### Follower Failure: Catch-up Recovery

The follower keeps a log of the last transaction it processed. On restart, it requests all changes since that point from the leader. This is simple and reliable.

### Leader Failure: Failover

Leader failure is hard. **Failover** steps:
1. **Detect** that the leader has failed (timeout — usually 30 seconds)
2. **Elect** a new leader (most up-to-date follower, or consensus algorithm)
3. **Reconfigure** clients to send writes to the new leader
4. **Decommission** the old leader if it comes back (it might still think it's the leader — **split-brain**)

**Things that can go wrong:**
- New leader may not have all writes from old leader → data loss
- Two nodes both believe they are the leader (split-brain) → data corruption
- Timeout too short → unnecessary failovers from transient slowness
- Timeout too long → prolonged unavailability

These problems have no simple solutions. Some teams prefer to do **manual failover** to stay in control.

---

## 📋 Replication Logs: Implementation Methods

### Statement-Based Replication
Forward SQL statements (`INSERT`, `UPDATE`) to followers.

Problems:
- Non-deterministic functions (`NOW()`, `RAND()`) produce different results
- Statements with side effects (triggers, stored procedures) may differ
- Auto-increment columns depending on execution order

Used by: MySQL (before v5.1), but mostly abandoned.

### Write-Ahead Log (WAL) Shipping
Ship the WAL (the same log used for crash recovery) to followers.

Problem: WAL is tightly coupled to the storage engine. A version upgrade of the leader may produce a WAL format the follower can't read → **zero-downtime upgrades impossible**.

Used by: PostgreSQL, Oracle.

### Logical (Row-Based) Log Replication
A separate log format, at the granularity of rows (not storage engine internals):
- Insert: new values of all columns
- Delete: primary key (or all columns if no PK)
- Update: primary key + new values

This decouples replication from the storage engine format → **allows rolling upgrades** and can be consumed by external tools (CDC — Change Data Capture).

Used by: MySQL binlog.

### Trigger-Based Replication
Custom application-level replication using database triggers. Most flexible but slowest and most error-prone. Used when you need to replicate a subset of data or between different database systems.

---

## 🔄 Replication Lag and Consistency

In asynchronous replication, followers lag behind the leader. A user might see stale data when reading from a follower. This leads to several **consistency anomalies**:

### Read-Your-Own-Writes Consistency

**Problem:** You update your profile, then reload the page — but your change is gone (you were routed to a lagging follower).

**Solution:** Read from the leader for data you might have modified, followers for everything else. Or track the user's last write timestamp and route reads to replicas that are up-to-date with that timestamp.

### Monotonic Reads

**Problem:** You see a message, refresh, and it's gone (you were routed to a more-lagging replica).

**Solution:** Each user always reads from the same replica. If that replica fails, they're rerouted, but consistently.

### Consistent Prefix Reads

**Problem:** In a conversation, you see the reply before the question (because the replies partition was replicated faster).

**Solution:** Causally related writes are written to the same partition, or include causal metadata.

---

## 🌐 Multi-Leader Replication

Allow multiple leaders (each can accept writes). Leaders replicate to each other.

**Use cases:**
- **Multi-datacenter:** One leader per datacenter. Lower latency for local writes. Continue operating if datacenter goes down.
- **Offline clients:** Each device is its own leader (e.g., calendar app that works offline). Sync when connected.
- **Collaborative editing:** Google Docs — each user's local changes are applied immediately and replicated.

**The big problem: write conflicts**

If two users simultaneously modify the same record on different leaders, you get a **conflict** that must be resolved.

### Conflict Resolution Strategies

- **Last Write Wins (LWW):** Most recent timestamp wins. Simple but loses data.
- **Merge:** Try to merge both values (works for some data types like sets/counters).
- **Custom logic:** Run application code on conflict, let the user decide.
- **CRDTs (Conflict-free Replicated Data Types):** Special data structures that automatically merge conflicts in a mathematically sound way.

---

## 🔄 Leaderless Replication (Dynamo-Style)

No single leader. Clients send writes to **multiple replicas directly** and reads similarly.

Used by: Amazon Dynamo, Apache Cassandra, Riak, Voldemort.

### Quorums for Reading and Writing

With `n` replicas, `w` writes required, `r` reads required:

```
If w + r > n → you're guaranteed to read up-to-date data
```

Common: `n=3, w=2, r=2` — tolerate 1 node failure.

**Read repair:** On read, compare values across replicas. If one is stale, update it.

**Anti-entropy:** Background process that continuously compares replicas and copies missing data.

### Sloppy Quorums and Hinted Handoff

During a network partition, write to *any* available nodes (even outside the home quorum). When the preferred nodes recover, hand off the writes — **hinted handoff**. This increases write availability at the cost of consistency.

### Limitations of Leaderless Replication

Even with `w + r > n`, edge cases can return stale reads:
- Two writes occur simultaneously (need conflict resolution)
- A write partially succeeds (some nodes got it, some didn't)
- A node returns stale data after recovery

Leaderless replication is optimized for high availability and low latency across datacenters, not for strong consistency guarantees.

---

## Summary

| Approach | Writes go to | Read scalability | Availability | Consistency |
|---|---|---|---|---|
| **Single-leader** | One leader | Read from followers | Leader SPOF | Strong (sync) or eventual (async) |
| **Multi-leader** | Any leader | High | Very high | Eventual + conflict resolution |
| **Leaderless** | Multiple replicas | High | Very high | Eventual (quorum-based) |

Replication is fundamentally about a trade-off between **performance**, **availability**, and **consistency** — a theme that runs throughout the rest of the book.
