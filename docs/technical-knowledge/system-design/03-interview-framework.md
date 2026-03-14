---
id: interview-framework
title: System Design Interview Framework
sidebar_label: Interview Framework
description: A structured, step-by-step framework for approaching any system design interview question. Covers requirements gathering, estimation, high-level design, deep dives, and common pitfalls.
tags: [interview-prep, framework, system-design, process, communication]
---

# System Design Interview Framework

> Interviewers care more about **how you think** than the final architecture. Structure is everything.

---

## The RADIO Framework

| Step | Time | Goal |
|---|---|---|
| **R**equirements | 5 min | Define scope & constraints |
| **A**PI Design | 5 min | Define the interface |
| **D**ata Model | 5 min | Define storage schema |
| **I**nitial Design | 5–10 min | High-level diagram |
| **O**ptimizations | 10–15 min | Deep dives on bottlenecks |

---

## Step 1 — Requirements Clarification (5 min)

Never start designing without asking these questions.

### Functional Requirements
- What are the core features? (List top 3)
- What's out of scope?
- Who are the users?

### Non-Functional Requirements
- Scale: DAU, QPS, data volume
- Latency target (p99 < 200ms?)
- Availability (99.9%, 99.99%?)
- Consistency level (strong, eventual?)
- Geo-distribution needed?
- Read/write ratio

### Good Questions to Ask
```
- "How many daily active users should I design for?"
- "Is this read-heavy or write-heavy?"
- "Do we need to support mobile clients?"
- "What's the acceptable latency for the core operation?"
- "Do we need global distribution?"
- "How long should data be retained?"
```

---

## Step 2 — API Design (5 min)

Define the public interface before the internals.

### REST Example
```
POST   /v1/posts              - Create a post
GET    /v1/posts/{id}         - Get a post
GET    /v1/users/{id}/feed    - Get user feed
PUT    /v1/posts/{id}         - Update a post
DELETE /v1/posts/{id}         - Delete a post
```

### Key Decisions
- Request/response shape
- Authentication mechanism (JWT, OAuth)
- Pagination strategy (cursor vs offset)
- Rate limiting boundaries

---

## Step 3 — Data Model (5 min)

Define entities and relationships before choosing storage.

```
User     { id, name, email, created_at }
Post     { id, user_id, content, created_at }
Follow   { follower_id, followee_id, created_at }
```

### Storage Selection Guide

| Use Case | Storage Choice |
|---|---|
| Structured relational data | PostgreSQL / MySQL |
| Unstructured / flexible schema | MongoDB |
| Key-value / cache | Redis |
| Time-series data | InfluxDB / TimescaleDB |
| Full-text search | Elasticsearch |
| Large files / blobs | S3 / GCS |
| Graph relationships | Neo4j |
| Column-family (wide table) | Cassandra / HBase |

---

## Step 4 — High-Level Design (5–10 min)

Draw boxes and arrows. Keep it simple at first.

```
Client → Load Balancer → API Gateway → Service → DB
                                     ↓
                                  Cache (Redis)
                                     ↓
                               Message Queue (Kafka)
                                     ↓
                               Worker Service
```

### Always Include
- Load balancer (never one server)
- Database (specify type)
- Cache layer
- CDN (if media/static assets involved)
- Async processing (if writes are heavy)

---

## Step 5 — Deep Dive / Optimizations (10–15 min)

The interviewer will guide this. Common deep dives:

| Problem | Solution to Discuss |
|---|---|
| High read QPS | Caching, read replicas, CDN |
| High write QPS | Sharding, write-ahead log, async queue |
| Hotspot (celebrity user) | Special handling, fan-out-on-read |
| Large payloads | Chunking, object storage, presigned URLs |
| Real-time requirements | WebSocket, SSE, long polling |
| Exactly-once semantics | Idempotency keys, deduplication |
| Long-running jobs | Job queue, progress API, async callbacks |

---

## Communication Tips

### Do
- Think out loud at all times
- State assumptions explicitly
- Estimate before architecting
- Mention trade-offs for every decision
- Ask "does this align with what you're looking for?"

### Don't
- Jump to solutions before requirements
- Over-engineer the first design
- Stay silent while thinking
- Ignore non-functional requirements
- Forget to mention failure scenarios

---

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Designing a single-server system | Always start with load balancer + multiple instances |
| Ignoring failure modes | Ask "what happens if this component fails?" |
| No capacity estimation | Do rough math before picking technology |
| Picking tech without justification | "I choose Kafka here because we need durable, ordered message delivery at scale" |
| Skipping the data model | Schema design surfaces hidden complexity early |
| Not discussing consistency trade-offs | State your consistency model explicitly |

---

## Sample Opening Structure

> "Let me start by clarifying requirements. Based on what you said, the core features are: [X, Y, Z]. I'll treat [A, B] as out of scope for now. For scale, I'll assume 10M DAU, with a 10:1 read/write ratio. Let me do a quick estimation before we dive into the design..."

---

## Interview Questions

1. How would you approach designing a system you've never built before?
2. If an interviewer asks you to "design Twitter," what are the first 5 questions you ask?
3. How do you decide whether to use SQL or NoSQL for a new system?
4. How do you handle the trade-off between consistency and availability in your design?
5. Walk me through how you'd estimate QPS for a feature that 1% of 100M users will use daily.
