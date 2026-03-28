---
id: intro
title: System Design Knowledge Base
sidebar_label: Overview
slug: /system-design
description: A comprehensive knowledge base for system design patterns, architectural principles, scalability strategies, and interview preparation for software engineers.
tags: [system-design, overview, architecture, interview-prep]
---

# System Design Knowledge Base

> A structured reference for engineers preparing for system design interviews or building production-grade distributed systems.

## What's Covered

| Topic | Description |
|---|---|
| [Architecture Fundamentals](/technical-knowledge/system-design/architecture-fundamentals) | CAP theorem, consistency models, trade-offs |
| [Capacity Planning & Estimation](/technical-knowledge/system-design/capacity-planning) | Back-of-envelope math, traffic/storage estimation |
| [Interview Framework](/technical-knowledge/system-design/interview-framework) | Structured approach to design interviews |
| [Scaling Reads](/technical-knowledge/system-design/scaling-reads) | Caching, read replicas, CDN, CQRS |
| [Scaling Writes](/technical-knowledge/system-design/scaling-writes) | Sharding, partitioning, write-ahead log |
| [Real-Time Updates](/technical-knowledge/system-design/real-time-updates) | WebSocket, SSE, polling strategies |
| [Handling Contention](/technical-knowledge/system-design/handling-contention) | Locks, MVCC, optimistic concurrency |
| [Large Blob Storage](/technical-knowledge/system-design/large-blobs) | Object storage, chunking, CDN delivery |
| [Multi-Step Processes](/technical-knowledge/system-design/multi-step-process) | Sagas, orchestration, choreography |
| [Long-Running Tasks](/technical-knowledge/system-design/long-running-tasks) | Job queues, async patterns, progress tracking |
| [Microservices Patterns](/technical-knowledge/system-design/microservices-patterns) | Service mesh, circuit breaker, API gateway |
| [Database Design](/technical-knowledge/system-design/database-design) | Normalization, indexing, partitioning |
| [Caching Strategies](/technical-knowledge/system-design/caching-strategies) | Cache aside, write-through, eviction policies |
| [Message Queues & Streaming](/technical-knowledge/system-design/message-queues) | Kafka, RabbitMQ, pub/sub, event sourcing |
| [API Design](/technical-knowledge/system-design/api-design) | REST, gRPC, GraphQL, versioning |
| [Distributed Systems](/technical-knowledge/system-design/distributed-systems) | Consensus, leader election, clock sync |
| [Security Patterns](/technical-knowledge/system-design/security-patterns) | AuthN/AuthZ, rate limiting, zero trust |
| [Common Interview Questions](/technical-knowledge/system-design/common-interview-questions) | Full question bank with discussion points |

## How to Use This Guide

1. **For interviews** — Start with the [Interview Framework](/technical-knowledge/system-design/interview-framework), then study each pattern topic.
2. **For production systems** — Jump directly to the relevant pattern topic.
3. **For review** — Use the [Common Interview Questions](/technical-knowledge/system-design/common-interview-questions) page as a self-test.

## Key Principles to Internalize

- **There is no silver bullet** — every design choice is a trade-off.
- **Identify bottlenecks first** — don't optimize prematurely.
- **Consistency vs. Availability** — know which one your use case needs.
- **Data is the hardest part** — compute is cheap, storage and consistency are not.

---

## Interview Questions

### Q: How do you structure the first 5 minutes of a system design interview?
**A:** Clarify requirements and constraints, define scale assumptions, identify core entities and APIs, then propose a baseline architecture before deep dives.

### Q: What distinguishes a senior-level system design answer from a mid-level one?
**A:** Seniors make explicit trade-offs, quantify scale, discuss failure modes, and connect design choices to operational concerns like SLOs, cost, and rollout risk.

### Q: How do you decide what to design first: API, data model, or infrastructure?
**A:** Start from user flows and invariants, then model data and APIs, and finally map to infrastructure based on throughput, latency, and consistency requirements.

### Q: How should you handle unknown numbers during estimation?
**A:** State assumptions clearly, use round-number math, and show sensitivity analysis to communicate how the design changes at 10x scale.

### Q: What is your framework for discussing consistency trade-offs?
**A:** Identify correctness requirements per operation, classify tolerance for stale reads, and choose patterns (quorum, idempotency, saga) accordingly.

### Q: How do you include reliability in an interview design without getting lost?
**A:** Cover failure domains, retries/timeouts, backpressure, graceful degradation, and observability hooks in a concise reliability pass.

### Q: When do you introduce caching in the interview flow?
**A:** After baseline bottlenecks are identified. Explain cache key design, invalidation strategy, and consistency implications.

### Q: How do you communicate cost-awareness in architecture decisions?
**A:** Compare options by resource profile (CPU, memory, storage, network, operations), then justify the cheapest design that still meets SLOs.
