---
title: Welcome
slug: /docs
description: Engineering knowledge base for practical learning, interview preparation, real-world system design, DSA training, banking systems, and cloud certification.
tags: [engineering, documentation, knowledge-base, onboarding, interview, dsa, system-design]
---

import KnowledgeBaseHubDiagram from '@site/src/components/KnowledgeBaseHubDiagram';

# 🚀 Engineering Knowledge Base

A practical, production-grade engineering knowledge base and interactive practice platform — designed for accelerated learning, architectural decision-making, and high-impact interview preparation.

:::tip[How to Navigate This Platform]
- **Interactive Practice:** Access the [📝 Daily Quizzes](/technical-knowledge/daily-quiz) and [🧩 LeetCode Daily](/technical-knowledge/dsa/leetcode-daily) to build daily consistency with instant feedback and cloud progress syncing.
- **Visual Learning:** Explore 60+ interactive SVG diagrams and animated protocol visualizers embedded across topics.
- **Structured Roadmaps:** Follow sequential paths from Foundations to Domain Specialization using the sidebar navigation.
:::

---

## ⚡ Interactive Features & Practice Hubs

| Feature | Description | Access |
|---------|-------------|--------|
| **📝 Daily Concept Quizzes** | Live interactive practice canvas synchronized with our central Google Sheets question bank (**☕ Java [508 Qs]**, **🍃 Spring Boot [508 Qs]**, **🏗️ System Design [508 Qs]**, **🌐 All [1,524 Qs]**). Supports topic/difficulty filtering, instant solution rationales, and accuracy tracking. | [→ Open Daily Quizzes](/technical-knowledge/daily-quiz) |
| **🧩 LeetCode Daily Challenge** | Daily featured algorithmic problem, random global challenge picker, and topic explorer covering curated high-yield interview problems. | [→ Open LeetCode Daily](/technical-knowledge/dsa/leetcode-daily) |
| **📊 20-Week DSA Roadmap** | Comprehensive 20-week pattern-based algorithmic training curriculum from Two Pointers to Dynamic Programming and Advanced Graphs. | [→ 20-Week DSA Guide](/technical-knowledge/dsa/20-week-dsa-roadmap-intro) |
| **🏢 LeetCode Company-Wise** | Frequently asked interview questions tagged by top tech companies (Google, Meta, Amazon, Microsoft, Apple, Uber, etc.). | [→ Company-Wise Questions](/technical-knowledge/dsa/leetcode-companywise/) |
| **🎨 Interactive Visualizers** | 60+ custom React SVG diagrams for distributed consensus (Raft), TLS 1.3 handshakes, Kafka internal pipelines, Linux kernel subsystems, and ISO 20022 payment flows. | *Embedded throughout docs* |
| **👤 Cloud Progress & Sync** | Sign in with Google to sync your reading completion, quiz scores, accuracy metrics, and custom study plans in real time via Cloud Firestore. | [→ Account Login](/login) |

---

## 🗺️ Learning Paths & Knowledge Domains

<KnowledgeBaseHubDiagram />

---

## 💼 1. Interview Preparation Track

A structured path for software engineers targeting Senior Backend, Distributed Systems, and Java/Spring roles.

### Phase 1 — Foundations & Core Engineering

| # | Topic | Key Concepts Covered | Direct Link |
|---|-------|----------------------|-------------|
| 1 | **Java Fundamentals & 21+** | Virtual Threads (Loom), Sequenced Collections (JEP 431), Scoped Values, Pattern Matching, JMM | [→ Java Overview](/technical-knowledge/java/java-overview) |
| 2 | **OOP & SOLID Principles** | Encapsulation, Covariant returns, Diamond problem resolution, Liskov Substitution Principle | [→ Java OOP](/technical-knowledge/java/java-oop) |
| 3 | **Collections & Data Structures**| HashMap bitwise bucket hashing, ConcurrentHashMap CAS node locking, ArrayList resizing formula | [→ Collections](/technical-knowledge/java/java-collections) |
| 4 | **Multithreading & Concurrency**| AbstractQueuedSynchronizer (AQS), ReentrantLock, StampedLock, False Sharing `@Contended`, Memory Barriers | [→ Concurrency](/technical-knowledge/java/java-concurrency) |
| 5 | **JVM Internals & GC** | Generational ZGC colored pointers, G1 GC regions, Tiered Compilation (C1/C2 JIT), Metaspace | [→ JVM Internals](/technical-knowledge/java/java-jvm) |
| 6 | **Design Patterns & Architecture**| Creational, Structural (Decorator, Proxy), Behavioral (Saga, Strategy, Observer) patterns | [→ Design Patterns](/technical-knowledge/design-patterns/design-patterns-overview) |

### Phase 2 — System Design & Distributed Systems

| # | System Design Topic | Core Architectural Focus | Direct Link |
|---|---------------------|--------------------------|-------------|
| 1 | **Interview Framework** | 4-step structured system design interview blueprint & trade-off scoring | [→ Framework](/technical-knowledge/system-design/interview-framework) |
| 2 | **Distributed Transactions** | Two-Phase Commit (2PC), Saga Pattern (Orchestration vs Choreography), Transactional Outbox + Debezium CDC | [→ Distributed Transactions](/technical-knowledge/system-design/distributed-transactions) |
| 3 | **Distributed Consensus & Replication** | Raft majority quorum calculations, Multi-Paxos, Google Spanner TrueTime API vs CockroachDB HLC | [→ Distributed Systems](/technical-knowledge/system-design/distributed-systems) |
| 4 | **Consistent Hashing & Partitioning**| Hash ring topology, virtual nodes (vnodes), replication factors, data migration | [→ Consistent Hashing](/technical-knowledge/system-design/consistent-hashing-deep-dive) |
| 5 | **Distributed Caching & Stampede Defense**| Cache-Aside vs Write-Behind, Redis Cluster 16384 hash slots, XFetch probabilistic early expiration | [→ Caching Strategies](/technical-knowledge/system-design/caching-strategies) |
| 6 | **Message Queues & Streaming** | Apache Kafka partition allocations, zero-copy sendfile, Idempotent Producer PID deduplication | [→ Message Queues](/technical-knowledge/system-design/message-queues) |
| 7 | **API Design & Rate Limiting** | RESTful idempotency keys, Distributed Token Bucket with Redis Lua scripts, gRPC vs REST | [→ API Design](/technical-knowledge/system-design/api-design) |
| 8 | **Database Scaling & Storage Engines** | B-Trees vs Log-Structured Merge-Trees (LSM-Trees write amplification), Sharding, Read Replicas | [→ Database Scaling](/technical-knowledge/system-design/scaling-writes) |
| 9 | **Microservices Resilience** | Resilience4j Circuit Breakers, Bulkheads, Rate Limiters, Service Mesh mTLS | [→ Microservices](/technical-knowledge/system-design/microservices-patterns) |
| 10 | **Observability & Telemetry** | Distributed Tracing (OpenTelemetry), Metrics (Prometheus), Log Aggregation, SLI/SLO/SLA | [→ Observability](/technical-knowledge/system-design/observability) |

### Phase 3 — Behavioral & Leadership Strategy

| Topic | Focus | Direct Link |
|-------|-------|-------------|
| **Big 8 Behavioral Themes** | Conflict resolution, leadership, failure recovery, ambiguity, customer obsession | [→ Behavioral Guide](/technical-knowledge/interview-questions/behavioral/intro) |
| **STAR / STAR-L Framework** | Animated 4-step STAR timing rubric, action verbs, and lessons learned structure | [→ STAR Method](/technical-knowledge/interview-questions/behavioral/star-method) |
| **Amazon 16 Leadership Principles**| Comprehensive breakdown of all 16 Amazon LPs with story strategies and questions | [→ Amazon LP Guide](/technical-knowledge/interview-questions/behavioral/amazon-lp) |
| **Questions to Ask Interviewers** | Curated questions to evaluate engineering culture, architecture maturity, and growth | [→ Questions to Ask](/technical-knowledge/interview-questions/behavioral/questions-to-ask) |

---

## 📊 2. DSA Coding Training (20-Week Master Curriculum)

A structured 20-week curriculum designed for algorithmic pattern recognition and mastery:

| Week | Algorithmic Pattern | Key Problem Types | Guide Link |
|------|--------------------|-------------------|------------|
| **W1** | **Arrays & Prefix Sums** | Subarray sums, running totals, difference arrays | [→ Week 1](/technical-knowledge/dsa/week-1-arrays-strings-prefix-sums) |
| **W2** | **Two Pointers & Sliding Window** | Container with most water, longest substring without repeats | [→ Week 2](/technical-knowledge/dsa/week-2-two-pointers-sliding-window) |
| **W3** | **Linked Lists & Pointers** | Fast/slow pointers, cycle detection, reverse linked lists | [→ Week 3](/technical-knowledge/dsa/week-3-linked-lists-pointers) |
| **W4** | **Hash Tables & Sets** | Group anagrams, frequency counting, LRU cache foundations | [→ Week 4](/technical-knowledge/dsa/week-4-hash-tables-sets) |
| **W5** | **Monotonic Stacks & Queues** | Next greater element, daily temperatures, sliding window maximum | [→ Week 5](/technical-knowledge/dsa/week-5-stacks-queues-monotonic) |
| **W6** | **Binary Trees & BST** | Lowest Common Ancestor, level-order BFS, tree serialization | [→ Week 6](/technical-knowledge/dsa/week-6-binary-trees-bst) |
| **W7** | **Graph Foundations** | Connected components, flood fill, topological sort (Kahn's) | [→ Week 7](/technical-knowledge/dsa/week-7-graph-foundations) |
| **W8** | **Advanced Graph Algorithms** | Dijkstra's shortest path, Bellman-Ford, cycle detection | [→ Week 8](/technical-knowledge/dsa/week-8-advanced-graph-concepts) |
| **W9** | **Binary Search Patterns** | Search in rotated sorted array, search space reduction | [→ Week 9](/technical-knowledge/dsa/week-9-binary-search) |
| **W10** | **Recursion & Backtracking** | Subsets, permutations, combination sum, N-Queens | [→ Week 10](/technical-knowledge/dsa/week-10-recursion-backtracking) |
| **W11** | **Intervals & Sweep Line** | Merge intervals, meeting rooms, insert intervals | [→ Week 11](/technical-knowledge/dsa/week-11-intervals-sweep-line) |
| **W12** | **Heaps & Greedy Algorithms** | Top K frequent elements, task scheduler, merge K sorted lists | [→ Week 12](/technical-knowledge/dsa/week-12-heaps-greedy) |
| **W13** | **Dynamic Programming (1D)** | House robber, coin change, longest increasing subsequence | [→ Week 13](/technical-knowledge/dsa/week-13-dynamic-programming-1d) |
| **W14** | **Dynamic Programming (2D & Strings)** | Unique paths, edit distance, longest common subsequence | [→ Week 14](/technical-knowledge/dsa/week-14-dynamic-programming-2d) |
| **W15** | **Advanced Sliding Window** | Minimum window substring, sliding window with multi-constraints | [→ Week 15](/technical-knowledge/dsa/week-15-advanced-sliding-windows) |
| **W16** | **Tries & Prefix Trees** | Prefix matching, autocomplete, word search II | [→ Week 16](/technical-knowledge/dsa/week-16-tries-prefix-trees) |
| **W17** | **Shortest Paths & MST** | Kruskal, Prim, minimum spanning trees | [→ Week 17](/technical-knowledge/dsa/week-17-shortest-paths-mst) |
| **W18** | **Disjoint Set Union (DSU)** | Union-Find with path compression & rank optimization | [→ Week 18](/technical-knowledge/dsa/week-18-disjoint-set-union) |
| **W19** | **Bit Manipulation & Math** | Single number, bitwise arithmetic, power sets | [→ Week 19](/technical-knowledge/dsa/week-19-bit-manipulation-math) |
| **W20** | **Comprehensive Review & Mocks**| Complex multi-pattern problems & mock interview simulations | [→ Week 20](/technical-knowledge/dsa/week-20-comprehensive-review-systems) |

---

## 🏦 3. Banking & Financial Core Architecture

In-depth technical reference for fintech, payment hub, and banking system developers:

| Area | Core Topics Covered | Direct Link |
|------|---------------------|-------------|
| **Payment Fundamentals** | 10-step payment lifecycle, On-Us vs Off-Us routing, settlement types | [→ Banking Guide](/technical-knowledge/banking/overview) |
| **ISO 20022 Standards** | XML schema definitions for `pain.001`, `pacs.008`, `pacs.002`, `pacs.004`, `camt.054` | [→ ISO 20022 Specs](/technical-knowledge/banking/pain001) |
| **Global Payment Rails** | NPP (New Payments Platform), SWIFT gpi / ISO MX, BECS Direct Debit, BPAY, RTGS | [→ Payment Rails](/technical-knowledge/banking/npp) |
| **Core Banking Ledger (CBS)** | Double-entry accounting invariants, Booked vs Available balance posting, End of Day (EOD) | [→ Core Banking](/technical-knowledge/banking/core_banking) |
| **Clearing & Settlement** | Deferred Net Settlement (DNS) vs Real-Time Gross Settlement (RTGS), Multilateral netting | [→ Settlement Engine](/technical-knowledge/banking/clearing) |
| **Sanctions & AML Compliance**| Real-time fuzzy sanctions screening (Jaro-Winkler), AML/CTF transaction monitoring | [→ Compliance & Fraud](/technical-knowledge/banking/fraud) |
| **Open Banking & FAPI** | Consumer Data Right (CDR), OAuth 2.0 PKCE, FAPI 1.0 Advanced Security Profiles | [→ Open Banking](/technical-knowledge/banking/overview) |

---

## 🤖 4. AI Agents & Vibe Coding

Modern paradigms for agentic software engineering and LLM application design:

| Module | Core Topics | Direct Link |
|--------|-------------|-------------|
| **AI Agents Architecture** | ReAct loops, planning agents, tool calling protocols, execution traces | [→ Agent Overview](/technical-knowledge/ai-agents/overview) |
| **Custom Skill Systems** | Sandboxed skill registries, CLI harnesses, YAML schemas, MCP configs | [→ Skill Systems](/technical-knowledge/ai-agents/skills) |
| **Evaluation & Testing Harness**| E2E agent validation, prompt regression suites, simulation sandboxes | [→ Harness Testing](/technical-knowledge/ai-agents/harness) |
| **Vibe Coding Workflows** | Natural language coding loops, dynamic context iteration, prompt orchestration | [→ Vibe Coding](/technical-knowledge/ai-agents/vibe-coding) |
| **Context Engineering** | RAG architectures, sliding context window budgeting, instruction pruning | [→ Context Engineering](/technical-knowledge/ai-agents/context-engineering) |

---

## 🛠️ 5. DevOps, Cloud & Infrastructure

Production engineering practices for scalable, resilient deployments:

| Domain | Key Technologies & Concepts | Direct Link |
|--------|----------------------------|-------------|
| **Containerization** | Docker Engine internals (dockerd, containerd, runc), Multi-stage OCI layer builds | [→ Docker Architecture](/devops) |
| **Kubernetes** | Control Plane & Worker topologies, Workload controllers, Service routing, CSI storage | [→ Kubernetes Architecture](/devops) |
| **GitOps CI/CD** | ArgoCD reconciliation loops, declarative Canary deployments, Custom Resource Definitions | [→ GitOps Pipelines](/devops) |
| **Infrastructure as Code (IaC)**| Terraform State DAG execution engine, declarative vs procedural drift detection | [→ IaC & Observability](/devops) |
| **AWS DVA-C02 Certification**| 17-module complete preparation path (Lambda, DynamoDB, SQS/SNS, IAM, CloudFormation) | [→ AWS Certification Guide](/technical-knowledge/aws/dva-c02-roadmap) |

---

## 📚 6. Engineering Books Knowledge Repository

Condensed key takeaways, architectural principles, and mental models from cornerstone literature:

| Book | Author | Core Focus | Notes Link |
|------|--------|------------|------------|
| **Effective Java** | Joshua Bloch | 90 best practices: Generics, Lambdas, Concurrency, Serialization, Records | [→ Effective Java Notes](/books/effective-java/introduction) |
| **Designing Data-Intensive Applications (DDIA)** | Martin Kleppmann | Storage engines, Replication logs, Partitioning, Distributed Transactions, Consensus | [→ DDIA Notes](/books/ddia/intro) |
| **Clean Code** | Robert C. Martin | Functions, naming conventions, error handling, clean unit testing | [→ Clean Code Notes](/books/clean-code/intro) |
| **Clean Architecture** | Robert C. Martin | Hexagonal architecture, dependency inversion rule, boundaries | [→ Clean Architecture Notes](/books/clean-architecture/intro) |
| **Cracking the Coding Interview** | Gayle Laakmann McDowell | Data structures, technical interview mental frameworks, complexity trade-offs | [→ CTCI Notes](/books/clean-code/intro) |
| **System Design Interview (Vol. 1 & 2)** | Alex Xu & Sahn Lam | Large-scale production architectures (URL Shortener, Distributed Message Queue, Payments) | [→ SDI Notes](/books/ddia/intro) |

---

:::tip[Ready to Start?]
Jump straight into the [📝 Daily Quizzes](/technical-knowledge/daily-quiz) or pick a topic from the left sidebar navigation to begin learning!
:::
