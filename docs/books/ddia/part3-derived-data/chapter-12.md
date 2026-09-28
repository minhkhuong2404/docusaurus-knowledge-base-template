---
id: chapter-12
title: 'Chapter 12: The Future of Data Systems'
sidebar_label: Ch 12 — The Future of Data Systems
sidebar_position: 3
description: 'The final chapter synthesizes everything in the book and looks forward.
  It addresses two questions:'
tags:
- books
- ddia
- part3-derived-data
- chapter-12
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

| Data Layer | Mutability | System Examples | Architectural Purpose |
|---|---|---|---|
| **Immutable Event Log** | Strictly Append-Only | Apache Kafka, Apache Pulsar, Database WAL | Single Source of Truth; preserves ground truth historical facts. |
| **OLTP State Store** | Mutable Primary DB | PostgreSQL, MySQL, CockroachDB | Point-in-time entity state for read-your-writes user transactions. |
| **Derived Specialized Views** | Read-Optimized Materialized Views | Elasticsearch (Full-text search), Redis (Sub-millisecond cache), Snowflake (Analytical OLAP) | Rebuildable projections optimized for specific access patterns. |

Events are facts — things that happened. The current state is a **derived view** of those facts. You can re-derive any view from the log if you need to change the schema, fix a bug, or add a new use case.

**This is analogous to:**
- Unix pipes: immutable stdin → transformation → stdout
- Event sourcing in DDD: events are stored; state is derived
- Accounting ledgers: transactions are immutable; balance is derived

### Change Data Capture (CDC)

For systems that already exist as databases (not event-sourced from day one), **CDC** lets you treat the database's replication log as an event stream:

| Data Layer | Mutability | System Examples | Architectural Purpose |
|---|---|---|---|
| **Immutable Event Log** | Strictly Append-Only | Apache Kafka, Apache Pulsar, Database WAL | Single Source of Truth; preserves ground truth historical facts. |
| **OLTP State Store** | Mutable Primary DB | PostgreSQL, MySQL, CockroachDB | Point-in-time entity state for read-your-writes user transactions. |
| **Derived Specialized Views** | Read-Optimized Materialized Views | Elasticsearch (Full-text search), Redis (Sub-millisecond cache), Snowflake (Analytical OLAP) | Rebuildable projections optimized for specific access patterns. |

This architecture is:
- **Reliable:** Failures in one derived view don't affect others; re-derive from the log
- **Scalable:** Each layer scales independently
- **Maintainable:** Clear separation of concerns; change a derived view without touching the source
- **Auditable:** The event log is the complete history

The goal of the entire book — and of good data systems engineering — is to build systems that exhibit these three properties: **reliable, scalable, and maintainable**.
