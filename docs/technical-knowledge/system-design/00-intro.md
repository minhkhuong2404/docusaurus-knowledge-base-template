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
| [Architecture Fundamentals](./01-architecture-fundamentals) | CAP theorem, consistency models, trade-offs |
| [Capacity Planning & Estimation](./02-capacity-planning) | Back-of-envelope math, traffic/storage estimation |
| [Interview Framework](./03-interview-framework) | Structured approach to design interviews |
| [Scaling Reads](./04-scaling-reads) | Caching, read replicas, CDN, CQRS |
| [Scaling Writes](./05-scaling-writes) | Sharding, partitioning, write-ahead log |
| [Real-Time Updates](./06-real-time-updates) | WebSocket, SSE, polling strategies |
| [Handling Contention](./07-handling-contention) | Locks, MVCC, optimistic concurrency |
| [Large Blob Storage](./08-large-blobs) | Object storage, chunking, CDN delivery |
| [Multi-Step Processes](./09-multi-step-process) | Sagas, orchestration, choreography |
| [Long-Running Tasks](./10-long-running-tasks) | Job queues, async patterns, progress tracking |
| [Microservices Patterns](./11-microservices-patterns) | Service mesh, circuit breaker, API gateway |
| [Database Design](./12-database-design) | Normalization, indexing, partitioning |
| [Caching Strategies](./13-caching-strategies) | Cache aside, write-through, eviction policies |
| [Message Queues & Streaming](./14-message-queues) | Kafka, RabbitMQ, pub/sub, event sourcing |
| [API Design](./15-api-design) | REST, gRPC, GraphQL, versioning |
| [Distributed Systems](./16-distributed-systems) | Consensus, leader election, clock sync |
| [Security Patterns](./17-security-patterns) | AuthN/AuthZ, rate limiting, zero trust |
| [Common Interview Questions](./18-common-interview-questions) | Full question bank with discussion points |

## How to Use This Guide

1. **For interviews** — Start with the [Interview Framework](./03-interview-framework), then study each pattern topic.
2. **For production systems** — Jump directly to the relevant pattern topic.
3. **For review** — Use the [Common Interview Questions](./18-common-interview-questions) page as a self-test.

## Key Principles to Internalize

- **There is no silver bullet** — every design choice is a trade-off.
- **Identify bottlenecks first** — don't optimize prematurely.
- **Consistency vs. Availability** — know which one your use case needs.
- **Data is the hardest part** — compute is cheap, storage and consistency are not.
