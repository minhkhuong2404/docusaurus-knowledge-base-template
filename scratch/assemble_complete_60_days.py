#!/usr/bin/env python3
import os
import sys

# Import days from p1 and p2
from build_60_days_scenarios import DAYS as DAYS_P1
from build_60_days_scenarios_p2 import DAYS_P2

ALL_DAYS = DAYS_P1 + DAYS_P2
print(f"Total days to assemble: {len(ALL_DAYS)}")

output_path = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/system-design/60-days-of-system-design.md"

content = []

# Frontmatter & Header
content.append("""---
id: 60-days-of-system-design
title: "60 Days of System Design: A Comprehensive Study Guide"
sidebar_label: 60 Days of System Design
description: An exhaustive architectural study guide synthesizing 60 core system design topics across 7 architectural domains with 60 high-impact scenario breakdowns.
tags: [system-design, interview-prep, architecture, scalability, distributed-systems, study-guide]
---

import SystemDesign60DaysDiagram from '@site/src/components/SystemDesign60DaysDiagram';

# 60 Days of System Design: A Comprehensive Study Guide

> **An exhaustive architectural roadmap and scenario workbook.**  
> This curriculum is synthesized from production engineering post-mortems and the *"60 Days of System Design Questions"* workbook. It provides a structured 60-day syllabus categorized across **7 architectural domains** and features **60 high-impact scenario breakdowns** detailing battle-tested industry solutions, mathematical proofs, and critical production traps.

---

## 🗺️ Quick Navigation

- [60-Day Architectural Syllabus](#60-day-architectural-syllabus)
  - [Module 1: Foundational Decoupling & Query Efficiency (Days 01–08)](#module-1-foundational-decoupling--query-efficiency)
  - [Module 2: Data Distribution & Indexing (Days 09–16)](#module-2-data-distribution--indexing)
  - [Module 3: Resilience & Reliability (Days 17–24)](#module-3-resilience--reliability)
  - [Module 4: High-Performance Data & Search (Days 25–32)](#module-4-high-performance-data--search)
  - [Module 5: Specialized Workflows & Concurrency (Days 33–40)](#module-5-specialized-workflows--concurrency)
  - [Module 6: Modern AI & Streaming (Days 41–50)](#module-6-modern-ai--streaming)
  - [Module 7: Platform Engineering & Schema Management (Days 51–60)](#module-7-platform-engineering--schema-management)
- [High-Impact Scenario Breakdowns (All 60 Days)](#high-impact-scenario-breakdowns)
""")

# Add quick navigation links for all 60 days
content.append("  - **Module 1 (Days 01–08):** " + " · ".join([f"[Day {d['day']:02d}](#day-{d['day']:02d}-{d['title'].split('(')[0].strip().lower().replace(' ', '-').replace('/', '-').replace('&', 'and')})" for d in ALL_DAYS if d['day'] <= 8]))
content.append("  - **Module 2 (Days 09–16):** " + " · ".join([f"[Day {d['day']:02d}](#day-{d['day']:02d}-{d['title'].split('(')[0].strip().lower().replace(' ', '-').replace('/', '-').replace('&', 'and')})" for d in ALL_DAYS if 9 <= d['day'] <= 16]))
content.append("  - **Module 3 (Days 17–24):** " + " · ".join([f"[Day {d['day']:02d}](#day-{d['day']:02d}-{d['title'].split('(')[0].strip().lower().replace(' ', '-').replace('/', '-').replace('&', 'and')})" for d in ALL_DAYS if 17 <= d['day'] <= 24]))
content.append("  - **Module 4 (Days 25–32):** " + " · ".join([f"[Day {d['day']:02d}](#day-{d['day']:02d}-{d['title'].split('(')[0].strip().lower().replace(' ', '-').replace('/', '-').replace('&', 'and')})" for d in ALL_DAYS if 25 <= d['day'] <= 32]))
content.append("  - **Module 5 (Days 33–40):** " + " · ".join([f"[Day {d['day']:02d}](#day-{d['day']:02d}-{d['title'].split('(')[0].strip().lower().replace(' ', '-').replace('/', '-').replace('&', 'and')})" for d in ALL_DAYS if 33 <= d['day'] <= 40]))
content.append("  - **Module 6 (Days 41–50):** " + " · ".join([f"[Day {d['day']:02d}](#day-{d['day']:02d}-{d['title'].split('(')[0].strip().lower().replace(' ', '-').replace('/', '-').replace('&', 'and')})" for d in ALL_DAYS if 41 <= d['day'] <= 50]))
content.append("  - **Module 7 (Days 51–60):** " + " · ".join([f"[Day {d['day']:02d}](#day-{d['day']:02d}-{d['title'].split('(')[0].strip().lower().replace(' ', '-').replace('/', '-').replace('&', 'and')})" for d in ALL_DAYS if 51 <= d['day'] <= 60]))

content.append("""
---

## 60-Day Architectural Syllabus

The curriculum is structured into 7 sequential modules that guide you from fundamental component decoupling to modern AI agentic architectures and enterprise multi-tenant SaaS platforms. Every day includes direct links to deep-dive documentation within this knowledge base.

<SystemDesign60DaysDiagram initialView="syllabus" />

---

### Module 1: Foundational Decoupling & Query Efficiency

Focuses on boundary isolation, request shaping, distributed coordination primitives, and stopping catastrophic database write/read bottlenecks at the network edge.

| Day | Topic | Key Focus Area | Deep-Dive Documentation Links |
| :---: | :--- | :--- | :--- |
| **01** | Decoupling Mobile from Backend | API Gateways vs. Backend-for-Frontend (BFF) | [Backend for Frontend (BFF)](/technical-knowledge/system-design/backend-for-frontend) · [API Gateway & Reverse Proxy](/technical-knowledge/system-design/reverse-proxy-load-balancer-api-gateway) · [API Design Guidelines](/technical-knowledge/system-design/api-design) |
| **02** | Killing the N+1 Query Problem | Eager Loading vs. DataLoaders | [Database Indexing & Optimization](/technical-knowledge/database/indexing-query-optimization) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads) · [N+1 Problem & Caching Fixes](/technical-knowledge/interview-questions/java/java-comprehensive-interview) |
| **03** | Rate Limiting | Token Bucket and Boundary Bursts | [Rate Limiting Algorithms](/technical-knowledge/system-design/rate-limiting-algorithms) · [Redis Rate Limiting](/technical-knowledge/redis/redis-rate-limiting) · [Breakdown Below](#day-03-rate-limiting-without-boundary-bursts-token-bucket-vs-fixed-window) |
| **04** | Preventing Duplicate Payments | Idempotency Keys and Concurrency | [Handling Contention](/technical-knowledge/system-design/handling-contention) · [Banking Payment Lifecycle](/technical-knowledge/banking/payment-lifecycle) · [Breakdown Below](#day-04-preventing-duplicate-payment-charges-idempotency-keys-and-concurrency) |
| **05** | Database Sharding Strategies | Directory-based vs. Hash Sharding | [Sharding & Partitioning](/technical-knowledge/system-design/sharding-partitioning) · [Consistent Hashing Deep Dive](/technical-knowledge/system-design/consistent-hashing-deep-dive) · [Breakdown Below](#day-05-choosing-a-database-sharding-strategy-directory-based-vs-hash) |
| **06** | Safe Distributed Locks | Fencing Tokens and TTL Expiry | [Redis Distributed Lock](/technical-knowledge/redis/redis-distributed-lock) · [Handling Contention](/technical-knowledge/system-design/handling-contention) · [Distributed Systems](/technical-knowledge/system-design/distributed-systems) |
| **07** | Event Ordering | SQS FIFO and Message Group IDs | [Message Queues](/technical-knowledge/system-design/message-queues) · [Kafka Topic Partitioning](/technical-knowledge/kafka/core/topic-partition-architecture) · [Time, Ordering & Unique IDs](/technical-knowledge/system-design/time-and-ordering-and-unique-ids) |
| **08** | Cache and Database Sync | Cache-Aside vs. Write-Through | [Caching Strategies](/technical-knowledge/system-design/caching-strategies) · [Redis Distributed Cache](/technical-knowledge/redis/redis-distributed-cache) · [CDC Pattern](/technical-knowledge/system-design/cdc) |

---

### Module 2: Data Distribution & Indexing

Focuses on horizontal partitioning, cross-shard query aggregation, replication models, and zero-downtime schema rollouts.

| Day | Topic | Key Focus Area | Deep-Dive Documentation Links |
| :---: | :--- | :--- | :--- |
| **09** | Splitting Read/Write Models | CQRS Architectures | [CQRS Pattern](/technical-knowledge/system-design/cqrs) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads) · [Breakdown Below](#day-09-cqrs-splitting-read-and-write-models) |
| **10** | Distributed Transactions | Saga Orchestration vs. 2PC | [Saga Pattern](/technical-knowledge/system-design/saga-pattern) · [Two-Phase Commit (2PC)](/technical-knowledge/system-design/two-phase-commit) · [Breakdown Below](#day-10-distributed-transactions-saga-orchestration-vs-2pc) |
| **11** | Handling Webhook Retries | Idempotent Receivers & Deduplication | [Webhook Architecture](/technical-knowledge/system-design/webhook) · [Retry Pattern](/technical-knowledge/system-design/retry-pattern) · [Breakdown Below](#day-11-handling-webhook-retries-idempotent-receivers) |
| **12** | Indexing High-Ingest Tables | Write-heavy Optimization & HOT | [PostgreSQL Heap Architecture](/technical-knowledge/database/postgresql-heap-storage-architecture) · [PostgreSQL BRIN Index Guide](/technical-knowledge/database/postgresql-brin-index-guide) · [Breakdown Below](#day-12-indexing-high-ingest-tables-write-heavy-optimization) |
| **13** | Shared Connection Pools | Database Proxying (PgBouncer) | [Connection Pooling](/technical-knowledge/database/connection-pooling) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads) · [HikariCP Sizing](/technical-knowledge/interview-questions/java/java-lead-interview-questions) |
| **14** | Safely Rolling Out Changes | Feature Flags and Canary Deploys | [Feature Toggles](/technical-knowledge/system-design/feature-toggle) · [Deployment Strategies](/technical-knowledge/system-design/deployment-strategies) · [Blue-Green Deployment](/technical-knowledge/system-design/blue-green-deployment) |
| **15** | Membership Checks | Bloom Filters & False Positives | [Bloom Filters Deep-Dive](/technical-knowledge/system-design/bloom-filters) · [Caching Strategies](/technical-knowledge/system-design/caching-strategies) |
| **16** | Taming Hot Partitions | Shard Key Salting & Splitting | [Sharding & Partitioning](/technical-knowledge/system-design/sharding-partitioning) · [Sharded Counters & Leaderboards](/technical-knowledge/system-design/sharded-counters-and-leaderboards) |

---

### Module 3: Resilience & Reliability

Focuses on protecting downstream systems from cascading failure, handling replication delays, and delivering real-time state safely.

| Day | Topic | Key Focus Area | Deep-Dive Documentation Links |
| :---: | :--- | :--- | :--- |
| **17** | Backpressure | Consumer Throttling & Flow Control | [Load Balancing & Reliability](/technical-knowledge/system-design/load-balancing-reliability) · [Bulkhead Pattern](/technical-knowledge/system-design/bulkhead-pattern) · [Kafka Consumer Poll Loop](/technical-knowledge/kafka/consumer/consumer-overview) |
| **18** | Cache Stampedes | Lock X-fetching & Probabilistic Leaping | [Caching Strategies (Stampede & Dogpiling)](/technical-knowledge/system-design/caching-strategies) · [Redis Performance Patterns](/technical-knowledge/redis/redis-performance-patterns) |
| **19** | Read-Your-Writes | Replication Lag Consistency | [Data Consistency Models](/technical-knowledge/system-design/data-consistency) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads) · [Breakdown Below](#day-19-read-your-writes-consistency-replication-lag-and-session-pinning) |
| **20** | Failing Downstream Dependencies | Circuit Breaker Pattern & Fallbacks | [Circuit Breaker Pattern](/technical-knowledge/system-design/circuit-breaker-pattern) · [Bulkhead Pattern](/technical-knowledge/system-design/bulkhead-pattern) · [Retry Pattern](/technical-knowledge/system-design/retry-pattern) |
| **21** | Real-Time Streaming Transports | WebSockets vs. SSE | [Real-Time Updates (WebSocket vs SSE)](/technical-knowledge/system-design/real-time-updates) · [HTTP & HTTPS Protocols](/technical-knowledge/networking/http-https-application-layer) · [Breakdown Below](#day-21-streaming-transports-websockets-vs-server-sent-events) |
| **22** | Reliable Messaging | Transactional Outbox Pattern | [Transactional Outbox Pattern](/technical-knowledge/system-design/outbox-pattern) · [Change Data Capture (CDC)](/technical-knowledge/system-design/cdc) · [Event-Driven Microservices](/technical-knowledge/system-design/event-driven-microservices) |
| **23** | Feed Fanout | Pull vs. Push for Celebrities | [Design Twitter / Social Feed](/technical-knowledge/system-design/common-interview-questions#2-design-twitter--social-feed) · [Scaling Reads](/technical-knowledge/system-design/scaling-reads) |
| **24** | Efficient Pagination | Keyset (Cursor) vs. Offset Pagination | [API Design](/technical-knowledge/system-design/api-design) · [Database Indexing](/technical-knowledge/database/indexing-query-optimization) |

---

### Module 4: High-Performance Data & Search

Focuses on modern search indexing, vector retrieval, edge computing, and zero-trust secrets management.

| Day | Topic | Key Focus Area | Deep-Dive Documentation Links |
| :---: | :--- | :--- | :--- |
| **25** | Queue Backpressure | Traffic Spike Buffering & Absorbing | [Message Queues](/technical-knowledge/system-design/message-queues) · [Dead Letter Queue (DLQ)](/technical-knowledge/system-design/dead-letter-queue) |
| **26** | Write-Path Consistency | Cache Invalidation Strategies | [Caching Strategies](/technical-knowledge/system-design/caching-strategies) · [CDC Pattern](/technical-knowledge/system-design/cdc) |
| **27** | Keeping LLMs Up to Date | RAG (Retrieval-Augmented Generation) | [RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals) · [Context Engineering](/technical-knowledge/ai-agents/context-engineering) |
| **28** | Vector Store Selection | Semantic Search and Embeddings | [RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals) · [Elasticsearch Overview](/technical-knowledge/elasticsearch/elasticsearch-overview) |
| **29** | Multi-Agent Workflows | State Management in AI Agents | [AI Agents Architecture](/technical-knowledge/ai-agents/agents) · [Model Context Protocol (MCP)](/technical-knowledge/ai-agents/mcp-and-agentic-ai) |
| **30** | File Storage Backends | Object Storage vs. Block Storage | [Large Blob Storage](/technical-knowledge/system-design/large-blobs) · [OS File Systems & I/O](/technical-knowledge/operating-systems/os-file-systems-io) |
| **31** | Cross-Region Latency | Edge Computing and CDNs | [Scaling Reads (CDN Distribution)](/technical-knowledge/system-design/scaling-reads) · [Network Performance Optimization](/technical-knowledge/networking/network-performance-optimization) |
| **32** | Secrets Management | Credential Rotation and Vaults | [Security Patterns](/technical-knowledge/system-design/security-patterns) · [Externalized Configuration](/technical-knowledge/system-design/externalized-configuration) |

---

### Module 5: Specialized Workflows & Concurrency

Focuses on complex data structures, peer-to-peer conflict resolution, low-latency geospatial calculations, and transport evolution.

| Day | Topic | Key Focus Area | Deep-Dive Documentation Links |
| :---: | :--- | :--- | :--- |
| **33** | Event Sourcing | Reconstructing State from History | [Event-Driven Microservices](/technical-knowledge/system-design/event-driven-microservices) · [CQRS Architecture](/technical-knowledge/system-design/cqrs) · [Kafka Architecture](/technical-knowledge/kafka/core/kafka-architecture-overview) |
| **34** | LLM Classification | Accuracy and Prompt Engineering | [Prompt Engineering](/technical-knowledge/ai-agents/prompt-engineering) · [AI Agent Interview Guide](/technical-knowledge/ai-agents/ai-agent-interview-questions) |
| **35** | Geospatial Scaling | Quadtrees and Geohashing | [Proximity Search & Geospatial Indexes](/technical-knowledge/system-design/proximity-search-geospatial-indexes) |
| **36** | Edge Protocols | HTTP/3 vs. HTTP/2 & Head-of-Line Blocking | [QUIC & Modern Transport](/technical-knowledge/networking/quic-modern-transport) · [HTTP/HTTPS Deep Dive](/technical-knowledge/networking/http-https-application-layer) |
| **37** | Collaborative Editing | CRDTs vs. Operational Transformation (OT) | [CRDTs in Collaborative Systems](/technical-knowledge/system-design/crdt-collaborative-systems) · [Breakdown Below](#day-37-collaborative-editing-crdts-vs-operational-transformation) |
| **38** | Long Context LLMs | Document Chunking and Context Windows | [Context Engineering](/technical-knowledge/ai-agents/context-engineering) · [RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals) |
| **39** | Concurrent Overspend | Distributed Locking for Account Balances | [Handling Contention](/technical-knowledge/system-design/handling-contention) · [Banking Payment Lifecycle](/technical-knowledge/banking/payment-lifecycle) · [Double-Entry Ledger](/technical-knowledge/banking/core-posting-accounting) |
| **40** | Off-Main-Thread Processing | Worker Threads and Background Jobs | [Long-Running Tasks](/technical-knowledge/system-design/long-running-tasks) · [Concurrency & Threading Models](/technical-knowledge/system-design/concurrency-async-threading-models) |

---

### Module 6: Modern AI & Streaming

Focuses on transitioning architectures from batch to real-time streams, LLM function calling, and zero-downtime legacy migration.

| Day | Topic | Key Focus Area | Deep-Dive Documentation Links |
| :---: | :--- | :--- | :--- |
| **41** | Batch to Real-Time | Stream Processing Engines | [Kafka Architecture Overview](/technical-knowledge/kafka/core/kafka-architecture-overview) · [Message Queues](/technical-knowledge/system-design/message-queues) |
| **42** | AI Agent Memory | Episodic Summarization | [AI Agents Architecture](/technical-knowledge/ai-agents/agents) · [Context Engineering](/technical-knowledge/ai-agents/context-engineering) · [Breakdown Below](#day-42-agentic-memory-hierarchical-episodic-summarization) |
| **43** | CDN Invalidation | Cache Purging on Deploy | [Caching Strategies](/technical-knowledge/system-design/caching-strategies) · [Network Performance Optimization](/technical-knowledge/networking/network-performance-optimization) |
| **44** | Offline Edit Sync | Data Loss Prevention & Vector Clocks | [CRDTs in Collaborative Systems](/technical-knowledge/system-design/crdt-collaborative-systems) · [Data Consistency](/technical-knowledge/system-design/data-consistency) |
| **45** | Full-Text Search | Inverted Indexes and Scaling | [Database Full-Text Search](/technical-knowledge/database/full-text-search) · [Search Systems](/technical-knowledge/system-design/search-systems) · [Elasticsearch Internals](/technical-knowledge/elasticsearch/elasticsearch-internals) |
| **46** | Structured LLM Output | JSON Mode and Tool Calling | [Prompt Engineering](/technical-knowledge/ai-agents/prompt-engineering) · [AI Agents Architecture](/technical-knowledge/ai-agents/agents) |
| **47** | Strangling the Monolith | Incremental Migration Patterns | [Strangler Fig Pattern](/technical-knowledge/system-design/strangler-fig-pattern) · [Service Decomposition](/technical-knowledge/system-design/service-decomposition) |
| **48** | Agent Tool Selection | Function Calling and Reasoning Loops | [Model Context Protocol (MCP)](/technical-knowledge/ai-agents/mcp-and-agentic-ai) · [AI Agents Architecture](/technical-knowledge/ai-agents/agents) |
| **49** | Data Warehouse Costs | Query Optimization and Partitioning | [Data Warehousing & OLAP](/technical-knowledge/database/data-warehousing-olap) · [Database Partitioning](/technical-knowledge/database/replication-partitioning) |
| **50** | ML Model Serving | High-Throughput Inference Architecture | [Load Balancing & Reliability](/technical-knowledge/system-design/load-balancing-reliability) · [Long-Running Tasks](/technical-knowledge/system-design/long-running-tasks) |

---

### Module 7: Platform Engineering & Schema Management

Focuses on multi-tenant isolation, enterprise API governance, telemetry collection, and scalable SaaS foundations.

| Day | Topic | Key Focus Area | Deep-Dive Documentation Links |
| :---: | :--- | :--- | :--- |
| **51** | Noisy Tenant Isolation | Multi-tenant Resource Quotas | [Rate Limiting Algorithms](/technical-knowledge/system-design/rate-limiting-algorithms) · [Bulkhead Pattern](/technical-knowledge/system-design/bulkhead-pattern) |
| **52** | API Versioning | Breaking Changes and Header Versioning | [API Design Best Practices](/technical-knowledge/system-design/api-design) · [Contract Testing](/technical-knowledge/system-design/contract-testing) |
| **53** | Schema Migrations | Zero-Downtime Alterations (Expand-Contract) | [Database Schema Migrations](/technical-knowledge/database/schema-migrations) · [Case Studies: Data Migrations](/technical-knowledge/system-design/case-studies-data-migrations) |
| **54** | Embedding Drift | RAG Maintenance and Re-indexing | [RAG Fundamentals](/technical-knowledge/ai-agents/rag-fundamentals) · [AI Agent Interview Guide](/technical-knowledge/ai-agents/ai-agent-interview-questions) |
| **55** | Parallel Agents | Shared State Coordination | [AI Agents Architecture](/technical-knowledge/ai-agents/agents) · [Distributed Systems](/technical-knowledge/system-design/distributed-systems) |
| **56** | Long-Running Jobs | Polling vs. Webhooks vs. SSE | [Long-Running Tasks](/technical-knowledge/system-design/long-running-tasks) · [Webhook Architecture](/technical-knowledge/system-design/webhook) · [Real-Time Updates](/technical-knowledge/system-design/real-time-updates) |
| **57** | Read Consistency | Confirmation Latency & Quorum | [Data Consistency](/technical-knowledge/system-design/data-consistency) · [CAP Theorem in Practice](/technical-knowledge/system-design/cap-theorem-system-design) |
| **58** | Agent Observability | Tracing LLM Pipelines & OpenTelemetry | [Observability](/technical-knowledge/system-design/observability) · [Distributed Tracing](/technical-knowledge/system-design/distributed-tracing) · [OTel Sampling Strategies](/technical-knowledge/system-design/opentelemetry-sampling-strategies) |
| **59** | Idempotency Key Design | Deterministic Key Generation | [Time, Ordering & Unique IDs](/technical-knowledge/system-design/time-and-ordering-and-unique-ids) · [Handling Contention](/technical-knowledge/system-design/handling-contention) |
| **60** | SaaS Platform Architecture | Multi-tenant Isolation and Modular Monoliths | [Database per Service](/technical-knowledge/system-design/database-per-service) · [Microservice Chassis](/technical-knowledge/system-design/microservice-chassis) · [Breakdown Below](#day-60-saas-platform-architecture-multi-tenant-isolation-and-modular-monoliths) |

---

## High-Impact Scenario Breakdowns

The following **60 scenario analyses** demonstrate how principal engineers and software architects navigate complex system trade-offs under real-world production stress. Use the interactive simulator below to test your architectural decisions against real-world failure modes:

<SystemDesign60DaysDiagram initialView="scenarios" />

---
""")

# Now append all 60 scenarios
for d in ALL_DAYS:
    day_num = f"{d['day']:02d}"
    title = d['title']
    scenario = d['scenario']
    question = d['question']
    options = d['options']
    correct = d['correct']
    deep_dive = d['deep_dive']
    links = d['links']
    
    # Format options
    opt_lines = []
    for opt_key, opt_text, is_corr, expl in options:
        opt_rec = " (Recommended)" if is_corr else ""
        opt_lines.append(f"- **{opt_key}) {opt_text}{opt_rec}**")
    
    opts_str = "\n".join(opt_lines)
    
    # Append to content
    content.append(f"""
### Day {day_num}: {title}

#### The Real-World Scenario
{scenario}

#### The Architectural Design Question
{question}

{opts_str}

**Correct Answer: {correct}**

#### Deep-Dive Analysis & Production Traps
{deep_dive}

> **Related Guides:** {links}

---
""")

# Append Recommended Next Steps
content.append("""
## 🎯 Recommended Next Steps

To get the maximum value from this 60-day curriculum:

1. **Daily Practice Loop**: Spend 30 minutes reading each day's topic in the syllabus, then explore the linked architectural guides.
2. **Scenario Self-Testing**: Review the [60 High-Impact Scenario Breakdowns](#high-impact-scenario-breakdowns) without looking at the solutions to sharpen your trade-off analysis.
3. **Question Bank Integration**: Complement this study guide with our curated [Common System Design Interview Questions](/technical-knowledge/system-design/common-interview-questions) and [Interview Framework](/technical-knowledge/system-design/interview-framework).
""")

# Write file
full_text = "\n".join(content)
with open(output_path, "w", encoding="utf-8") as f:
    f.write(full_text)

print(f"Successfully generated {output_path} with {len(ALL_DAYS)} days, total characters: {len(full_text)}")
