---
id: database-overview
title: Database Knowledge Base
description: A comprehensive reference covering relational fundamentals, indexing, transactions, distributed systems, caching, and more — with common interview questions.
tags: [database, overview]
sidebar_position: 1
---

# 🗄️ Database Knowledge Base

A structured guide covering everything you need to know about databases — from foundational SQL concepts to distributed NoSQL systems — with interview questions for each topic.

## Topics Covered

| # | Topic | Description |
|---|-------|-------------|
| 1 | [Relational Fundamentals](./relational-fundamentals) | SQL, joins, keys, constraints |
| 2 | [Database Design & Normalization](./database-design) | ERD, 1NF–BCNF, schema patterns |
| 3 | [Advanced SQL](./advanced-sql) | Window functions, CTEs, recursive queries |
| 4 | [Schema Migrations](./schema-migrations) | Flyway, Liquibase, zero-downtime |
| 5 | [Indexing & Query Optimization](./indexing-query-optimization) | B-Tree, covering indexes, EXPLAIN |
| 6 | [Query Planner & Optimizer](./query-planner-optimizer) | CBO, statistics, join algorithms |
| 7 | [Transactions & Concurrency](./transactions-concurrency) | ACID, isolation levels, MVCC, deadlocks |
| 8 | [Storage Engines & Data Structures](./storage-engines-data-structures) | InnoDB, LSM trees, WAL, buffer pool |
| 9 | [Replication & Partitioning](./replication-partitioning) | Leader-follower, sharding, CAP |
| 10 | [NoSQL & Distributed Databases](./nosql-distributed) | Document, key-value, wide-column, graph |
| 11 | [Caching Strategies](./caching-strategies) | Redis, eviction, cache patterns, pitfalls |
| 12 | [Performance & Monitoring](./performance-monitoring) | Slow queries, profiling, connection pooling |
| 13 | [Full-Text Search](./full-text-search) | Inverted index, tsvector, Elasticsearch |
| 14 | [Data Warehousing & OLAP](./data-warehousing-olap) | Star schema, ETL/ELT, materialized views |
| 15 | [Database Patterns for Microservices](./database-patterns-microservices) | Outbox, Saga, CQRS, Event Sourcing |
| 16 | [Time-Series Databases](./time-series-databases) | TimescaleDB, InfluxDB, Prometheus |
| 17 | [Backup & Recovery](./backup-recovery) | RPO/RTO, PITR, DR checklist |
| 18 | [Database Security](./database-security) | SQL injection, encryption, auditing |

:::tip Java / Spring Tip
Throughout this guide, Java and Spring Data / JPA notes are included where relevant to bridge theory and real-world usage.
:::

---

## Advanced Editorial Pass: Database Decision-Making Under Real Constraints

### Senior Engineering Focus
- Choose patterns by access shape, consistency needs, and scaling envelope.
- Treat schema, indexing, and query behavior as a single design unit.
- Plan operability early: migration, observability, backup, and recovery.

### Failure Modes to Anticipate
- Tool-first choices that ignore data-model and workload realities.
- Performance optimization without plan-level evidence.
- Operational blind spots in replication, failover, and restore flows.

### Practical Heuristics
1. Document data contracts and change strategy before shipping.
2. Validate assumptions with production-like cardinality and skew.
3. Define ownership for schema evolution and incident response.

### Compare Next
- [Relational Fundamentals](./relational-fundamentals.md)
- [Indexing & Query Optimization](./indexing-query-optimization.md)
- [Transactions & Concurrency](./transactions-concurrency.md)
