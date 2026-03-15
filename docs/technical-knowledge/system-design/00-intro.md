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
