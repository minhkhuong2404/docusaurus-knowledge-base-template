---
id: chapter-12
title: "Chapter 12: The Future of Data Systems"
sidebar_label: "Ch 12 — The Future of Data Systems"
sidebar_position: 3
---

# Chapter 12: The Future of Data Systems

## The Big Idea

The final chapter synthesizes everything in the book and looks forward. It addresses two questions:

1. **How should we build data systems** given everything we've learned?
2. **What responsibilities do we have** as the engineers who build these systems?

This is the most philosophical chapter, but it has practical implications for system design.

---

## 🏗️ Data Integration: The Core Challenge

Real-world systems don't use a single database. They use many specialized tools:

- An OLTP database (PostgreSQL) for transactional data
- A cache (Redis) for hot reads
- A search index (Elasticsearch) for full-text search
- A data warehouse (Snowflake) for analytics
- A message queue (Kafka) for async communication
- A recommendation system with its own graph store

Each tool is good at its specific job. The challenge: **keeping them in sync**.

If a user updates their profile:
- OLTP gets the write
- Cache must be invalidated or updated
- Search index must reflect the new name
- Analytics warehouse may need the change for reports

This is the **data integration problem**.

---

## 🔄 Derived Data and Dataflow

### The Event Log as Source of Truth

The central architectural idea Kleppmann proposes: treat an **immutable event log as the source of truth**, and derive all other representations from it.

```
┌────────────────────────────────────────────────────┐
│              Immutable Event Log                   │
│  (Kafka / append-only database log)                │
└──────────┬─────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
OLTP State    Derived Views
(mutable)     (search index,
              cache, analytics,
              ML models...)
```

Events are facts — things that happened. The current state is a **derived view** of those facts. You can re-derive any view from the log if you need to change the schema, fix a bug, or add a new use case.

**This is analogous to:**
- Unix pipes: immutable stdin → transformation → stdout
- Event sourcing in DDD: events are stored; state is derived
- Accounting ledgers: transactions are immutable; balance is derived

### Change Data Capture (CDC)

For systems that already exist as databases (not event-sourced from day one), **CDC** lets you treat the database's replication log as an event stream:

```
PostgreSQL WAL → Debezium (CDC tool) → Kafka → Elasticsearch
                                              → Redis (cache invalidation)
                                              → Data warehouse
```

This makes the database the source of truth for writes while enabling derived views in specialized systems.

### The Unbundled Database

Traditional databases bundle many features: storage, indexing, query engine, transactions, replication. Modern data systems "unbundle" these:

| Feature | Specialized tool |
|---|---|
| Durable storage | S3 / HDFS |
| Full-text search | Elasticsearch |
| Analytics | BigQuery / Redshift |
| Caching | Redis / Memcached |
| Stream processing | Kafka / Flink |
| OLTP | PostgreSQL / MySQL |
| Coordination | ZooKeeper / etcd |

The event log ties them together. This is the **Unix philosophy applied at system scale**: small, composable tools connected by a uniform interface (the event stream).

---

## ✅ Correctness Guarantees

### End-to-End Correctness

Individual components can be correct, but the system as a whole might not be. The classic example:

```
User submits payment form twice (double-click or network retry)
→ Server processes both requests
→ User is charged twice
→ Each individual database write was atomic and correct
→ The system as a whole was wrong
```

End-to-end correctness requires:
- **Idempotency keys** for operations that must happen exactly once
- **Deduplication** at multiple layers (network, application, database)
- **Atomic end-to-end transactions** (hard across multiple services)

### Fault-Tolerant Dataflows

The dataflow model (batch + stream) provides natural fault tolerance:
- Immutable input data
- Pure transformation functions (no side effects)
- Deterministic output

If something goes wrong, you can replay from the source. This is far easier to reason about than imperative, stateful systems.

### Constraints and Uniqueness

In distributed systems, uniqueness constraints (e.g., "only one account per email") are hard to enforce without coordination:

- **Optimistic:** Allow the write; detect violation asynchronously; compensate
- **Pessimistic:** Use a consensus service (ZooKeeper) to check before writing — but this adds latency

The right approach depends on the business cost of each option.

---

## 🔄 Doing the Right Thing: Ethics in Data Engineering

This is the most unusual part of the book — an engineering book that ends with ethics. But Kleppmann argues this is essential.

### Predictive Analytics and Discrimination

Machine learning models trained on historical data learn historical biases. A model that predicts "creditworthiness" based on postal code effectively implements redlining. A hiring model trained on historical data will perpetuate historical discrimination.

**The data engineer's responsibility:** Understand what the model is doing, what proxies it uses, and what historical biases it might encode. "The algorithm did it" is not an ethical defense.

### Privacy and Surveillance

Data collected for one purpose is often repurposed for another. "Behavioral data" collected for ad targeting can be used for:
- Insurance risk scoring
- Employment screening
- Government surveillance

Once data exists, you lose control of how it's used. Engineers build the systems that collect and store this data.

### Data as Power

Data creates **asymmetric information** between organizations and individuals. Companies know far more about users than users know about companies. This asymmetry can be exploited.

Privacy regulations (GDPR, CCPA) are attempts to rebalance this. As engineers, we should ask:

> "Does the person whose data this is benefit from this system, or are they the product being sold?"

### Trust, but Verify

**Auditability:** Systems should produce audit logs so that what happened can be reconstructed and verified. This applies to:
- Financial systems (who authorized this transaction?)
- Machine learning systems (why was this person denied credit?)
- Access logs (who looked at whose medical records?)

Immutable append-only logs (like the event log architecture) naturally provide this.

---

## 🔮 Composing Reliable Systems from Unreliable Components

The book's ultimate message: building reliable systems from unreliable components is possible — and the tools and patterns to do it are well-understood.

**The recipe:**

1. **Use the right tool for each job** — don't force one database to do everything
2. **Connect tools via event streams** — treat the event log as the source of truth
3. **Design for idempotency and replayability** — make operations safe to retry
4. **Accept partial failures** — design for degraded mode, not just happy path
5. **Monitor and observe** — if you can't measure it, you can't fix it
6. **Think about end-to-end correctness** — correctness at one layer doesn't guarantee correctness at the system level

And above all:

> **Build systems that serve the people who use them, not just the business interests of those who deploy them.**

---

## Summary: The Full Architecture

Looking back at the entire book through the lens of Chapter 12:

```
Raw Data (events, writes)
    ↓
Immutable Event Log (Kafka)
    ↓
┌──────────────────────────────────────────┐
│         Processing Layer                 │
│  Batch (Spark)  |  Stream (Flink)        │
└──────────────────────────────────────────┘
    ↓
Derived Views (Materialized for serving):
  • OLTP state (PostgreSQL)
  • Search index (Elasticsearch)
  • Cache (Redis)
  • Analytics (BigQuery)
  • ML models (offline-trained, online-served)
    ↓
Application Layer
    ↓
Users
```

This architecture is:
- **Reliable:** Failures in one derived view don't affect others; re-derive from the log
- **Scalable:** Each layer scales independently
- **Maintainable:** Clear separation of concerns; change a derived view without touching the source
- **Auditable:** The event log is the complete history

The goal of the entire book — and of good data systems engineering — is to build systems that exhibit these three properties: **reliable, scalable, and maintainable**.
