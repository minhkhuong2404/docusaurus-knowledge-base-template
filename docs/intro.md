---
title: Welcome
slug: /docs
description: Engineering knowledge base for practical learning, interview preparation, real-world system design, DSA training, and cloud certification.
tags: [engineering, documentation, knowledge-base, onboarding, interview]
---

# Engineering Knowledge Base

A practical, continuously growing knowledge base for software engineers — built for faster learning, better technical decisions, and focused interview preparation.

> **How to use this site:** Pick a learning path below, follow the sections in order, and connect each concept to a real implementation or design scenario. Use the sidebar to navigate between topics.

---

## 🗺️ Learning Paths Overview

| Path | What It Covers | Best For |
|------|---------------|----------|
| [💼 Interview Preparation](#-interview-preparation-roadmap) | System design, Java, behavioral, patterns | Upcoming interviews |
| [📊 DSA Coding Training](#-dsa-coding-training-20-week-roadmap) | 20-week structured algorithm training | LeetCode & coding rounds |
| [🏦 Banking & Finance](#-banking--finance) | Payment lifecycles, ISO 20022 messages, clearing & settlement | Fintech & banking developers |
| [🤖 AI Agents & Vibe Coding](#-ai-agents--vibe-coding) | Agents, skills, harnesses, vibe coding, context engineering | AI-assisted software engineering |
| [📚 Engineering Books](#-engineering-books) | Key takeaways from essential books | Deep, long-term growth |
| [☁️ Cloud Certifications](#️-cloud-certifications-aws-dva-c02) | AWS DVA-C02 exam prep | Cloud developer cert |

---

## 💼 Interview Preparation Roadmap

A structured path for engineers targeting backend, system design, and Java/Spring interviews.

### Phase 1 — Foundations

| # | Topic | Key Concepts | Link |
|---|-------|-------------|------|
| 1 | Java Fundamentals | Types, OOP, generics, exceptions, memory model | [→ Java Overview](/technical-knowledge/java/java-overview) |
| 2 | OOP Principles | Encapsulation, inheritance, polymorphism, interfaces | [→ Java OOP](/technical-knowledge/java/java-oop) |
| 3 | Java Collections | List, Map, Set, Queue, complexity trade-offs | [→ Collections](/technical-knowledge/java/java-collections) |
| 4 | Concurrency | Threads, locks, executors, CompletableFuture | [→ Concurrency](/technical-knowledge/java/java-concurrency) |
| 5 | JVM Internals | Memory areas, GC, class loading, JIT | [→ JVM](/technical-knowledge/java/java-jvm) |
| 6 | SOLID Principles | Single responsibility through dependency inversion | [→ SOLID](/technical-knowledge/solid/) |
| 7 | Design Patterns | Creational, structural, behavioral patterns | [→ Design Patterns](/technical-knowledge/design-patterns/design-patterns-overview) |

### Phase 2 — System Design

| # | Topic | Key Concepts | Link |
|---|-------|-------------|------|
| 1 | Interview Framework | How to approach a system design question | [→ Framework](/technical-knowledge/system-design/interview-framework) |
| 2 | Architecture Fundamentals | Monolith vs microservices, trade-off model | [→ Architecture](/technical-knowledge/system-design/architecture-fundamentals) |
| 3 | Distributed Systems | CAP theorem, consistency, partitioning | [→ Distributed Systems](/technical-knowledge/system-design/distributed-systems) |
| 4 | Consistent Hashing | Rings, virtual nodes, replication | [→ Consistent Hashing](/technical-knowledge/system-design/consistent-hashing-deep-dive) |
| 5 | Caching Strategies | Cache-aside, write-through, eviction policies | [→ Caching](/technical-knowledge/system-design/caching-strategies) |
| 6 | Message Queues | Kafka, SQS, async patterns, ordering guarantees | [→ Message Queues](/technical-knowledge/system-design/message-queues) |
| 7 | API Design | REST, versioning, rate limiting, idempotency | [→ API Design](/technical-knowledge/system-design/api-design) |
| 8 | Load Balancing | Strategies, health checks, failover | [→ Load Balancing](/technical-knowledge/system-design/load-balancing-reliability) |
| 9 | Scaling Reads | Read replicas, CDN, sharding patterns | [→ Scaling Reads](/technical-knowledge/system-design/scaling-reads) |
| 10 | Scaling Writes | CQRS, event sourcing, write-behind | [→ Scaling Writes](/technical-knowledge/system-design/scaling-writes) |
| 11 | Observability | Metrics, tracing, logging, alerting | [→ Observability](/technical-knowledge/system-design/observability) |
| 12 | Security Patterns | Auth, zero trust, secrets management | [→ Security Patterns](/technical-knowledge/system-design/security-patterns) |
| 13 | Microservices Patterns | Saga, circuit breaker, service mesh | [→ Microservices](/technical-knowledge/system-design/microservices-patterns) |
| 14 | Common Interview Questions | URL shortener, Twitter, payment system | [→ Interview Questions](/technical-knowledge/system-design/common-interview-questions) |

### Phase 3 — Domain Depth

| Domain | Key Topics | Link |
|--------|-----------|------|
| **Database** | ACID, indexes, transactions, replication, NoSQL vs SQL | [→ Database](/technical-knowledge/database/) |
| **Kafka** | Topics, partitions, consumer groups, Kafka Streams | [→ Kafka](/technical-knowledge/kafka/intro) |
| **Redis** | Data structures, pub/sub, caching, Lua scripting | [→ Redis](/technical-knowledge/redis/redis-overview) |
| **Networking** | TCP/IP, DNS, TLS, HTTP/2, gRPC | [→ Networking](/technical-knowledge/networking/) |
| **Security** | Auth flows, JWT, OAuth2, encryption, OWASP | [→ Security](/security) |
| **Elasticsearch** | Inverted index, tokenizers, search queries, cluster state | [→ Elasticsearch](/technical-knowledge/elasticsearch/elasticsearch-overview) |
| **Operating Systems** | Processes, threads, memory management, syscalls, scheduling | [→ OS](/technical-knowledge/operating-systems/intro) |
| **LLD & OOD** | Class diagrams, SOLID principles, design problems | [→ LLD](/intro) |
| **Testing & Mocking** | Unit testing, Spring annotations, Wiremock | [→ Testing](/technical-knowledge/test/testing-concepts) |
| **DevOps** | Docker, Kubernetes, CI/CD pipelines | [→ DevOps](/devops) |
| **Git** | Branching, rebase, cherry-pick, worktrees | [→ Git](/technical-knowledge/git/) |

### Interview Self-Check

Before your interview, confirm you can answer:

1. Explain your design with at least one alternative considered
2. What breaks first at 10× traffic?
3. How do you detect and recover from failures?
4. How does your solution behave under partial failure or network partition?

:::tip[Interview Success Formula]
Good answers connect three layers: **Concept** (what it is) → **Design choice** (when to use it, trade-offs) → **Operations** (how it behaves at scale or under failure).
:::

:::caution[Common Interview Traps]
- Definition-only answers without trade-off reasoning
- Ignoring scale assumptions (QPS, payload size, latency targets)
- Treating consistency, reliability, and cost as independent concerns
- Forgetting operational details: monitoring, alerting, rollback strategy
:::

---

## 📊 DSA Coding Training 20-Week Roadmap

A structured 20-week curriculum for mastering coding interview patterns. Each week focuses on one core pattern with progressive difficulty.

| Week | Pattern | Key Topics | Weekly Guide |
|------|---------|-----------|-------------|
| 1 | Arrays & Prefix Sums | Two-sum, subarray sums, running totals | [→ Week 1](/technical-knowledge/dsa/week-1-arrays-strings-prefix-sums) |
| 2 | Two Pointers & Sliding Window | Container with most water, substring problems | [→ Week 2](/technical-knowledge/dsa/week-2-two-pointers-sliding-window) |
| 3 | Linked Lists & Pointers | Reversal, cycle detection, merge | [→ Week 3](/technical-knowledge/dsa/week-3-linked-lists-pointers) |
| 4 | Hash Tables & Sets | Frequency counting, anagrams, grouping | [→ Week 4](/technical-knowledge/dsa/week-4-hash-tables-sets) |
| 5 | Stacks, Queues & Monotonic | Valid parentheses, next greater element | [→ Week 5](/technical-knowledge/dsa/week-5-stacks-queues-monotonic) |
| 6 | Binary Trees & BST | DFS/BFS traversal, LCA, BST operations | [→ Week 6](/technical-knowledge/dsa/week-6-binary-trees-bst) |
| 7 | Graph Foundations | BFS, DFS, adjacency list, connected components | [→ Week 7](/technical-knowledge/dsa/week-7-graph-foundations) |
| 8 | Advanced Graphs | Topological sort, cycle detection, Dijkstra | [→ Week 8](/technical-knowledge/dsa/week-8-advanced-graph-concepts) |
| 9 | Binary Search | Search space reduction, rotated arrays | [→ Week 9](/technical-knowledge/dsa/week-9-binary-search) |
| 10 | Recursion & Backtracking | Permutations, combinations, N-Queens | [→ Week 10](/technical-knowledge/dsa/week-10-recursion-backtracking) |
| 11 | Intervals & Sweep Line | Merge intervals, meeting rooms | [→ Week 11](/technical-knowledge/dsa/week-11-intervals-sweep-line) |
| 12 | Heaps & Greedy | K-largest elements, task scheduling | [→ Week 12](/technical-knowledge/dsa/week-12-heaps-greedy) |
| 13 | Dynamic Programming 1D | Fibonacci variants, house robber, DP on strings | [→ Week 13](/technical-knowledge/dsa/week-13-dynamic-programming-1d) |
| 14 | Dynamic Programming 2D | Grid DP, edit distance, LCS | [→ Week 14](/technical-knowledge/dsa/week-14-dynamic-programming-2d) |
| 15 | Advanced Sliding Window | Variable-size windows, multi-condition problems | [→ Week 15](/technical-knowledge/dsa/week-15-advanced-sliding-windows) |
| 16 | Tries & Prefix Trees | Word search, autocomplete, prefix matching | [→ Week 16](/technical-knowledge/dsa/week-16-tries-prefix-trees) |
| 17 | Shortest Paths & MST | Dijkstra, Bellman-Ford, Prim, Kruskal | [→ Week 17](/technical-knowledge/dsa/week-17-shortest-paths-mst) |
| 18 | Disjoint Set Union | Union-find, Kruskal, dynamic connectivity | [→ Week 18](/technical-knowledge/dsa/week-18-disjoint-set-union) |
| 19 | Bit Manipulation & Math | XOR tricks, power of two, prime sieve | [→ Week 19](/technical-knowledge/dsa/week-19-bit-manipulation-math) |
| 20 | Comprehensive Review | Mock interviews, system + coding integration | [→ Week 20](/technical-knowledge/dsa/week-20-comprehensive-review-systems) |

:::info[Start Here]
New to DSA training? Read the [20-Week Roadmap Introduction](/technical-knowledge/dsa/20-week-dsa-roadmap-intro) for the full curriculum structure, weekly study plan, and tips for maximizing retention.
:::

### DSA Pattern Quick Reference

| Pattern | Use When | Typical Complexity |
|---------|----------|-------------------|
| **Sliding Window** | Fixed/variable window over array/string | O(n) |
| **Two Pointers** | Sorted array, in-place manipulation | O(n) |
| **Binary Search** | Sorted/monotonic search space | O(log n) |
| **BFS** | Shortest path in unweighted graph, level traversal | O(V+E) |
| **DFS + Backtrack** | Permutations, combinations, constraint satisfaction | O(n!) |
| **DP 1D** | Overlapping subproblems, 1D state | O(n) |
| **DP 2D** | Grid problems, string comparison | O(m×n) |
| **Heap** | K-th element, streaming median | O(n log k) |
| **Union-Find** | Dynamic connectivity, cycle detection in graphs | O(α(n)) ≈ O(1) |
| **Trie** | Prefix matching, word search | O(L) per operation |

---

## 🏦 Banking & Finance

A comprehensive guide to financial core systems, transaction lifecycles, global payment networks, and compliance frameworks.

### Core Modules

| Module | Key Topics | Link |
|--------|------------|------|
| **Payment Fundamentals** | Payment lifecycles, banking roles, A-Z banking glossary | [→ Learner Guide](/technical-knowledge/banking/overview) |
| **ISO 20022 Standards** | MX messages: pain (initiation), pacs (clearing), camt (statement) | [→ ISO 20022 Messages](/technical-knowledge/banking/pain001) |
| **Payment Flows** | Inbound, outbound, On-Us, and Off-Us transaction clearing | [→ Payment Flows](/technical-knowledge/banking/inbound) |
| **Payment Rails** | NPP (instant), SWIFT (cross-border), BECS (debit), BPAY | [→ Payment Rails](/technical-knowledge/banking/npp) |
| **CBS & Posting** | Core Banking Systems, debit/credit posting, reversals, interest | [→ CBS & Posting](/technical-knowledge/banking/core_banking) |
| **Clearing & Settlement**| Direct, bilateral, multilateral clearing and RTGS settlement | [→ Settlement](/technical-knowledge/banking/clearing) |
| **Compliance & Risk** | Fraud detection, sanctions screening, AML/CTF & KYC | [→ Compliance](/technical-knowledge/banking/fraud) |
| **Operations & Testing** | Reconciliation, investigation workflows, end-to-end payment testing | [→ Operations](/technical-knowledge/banking/reconciliation) |

---

## 🤖 AI Agents & Vibe Coding

Understanding modern agentic AI development, harness testing, prompts, and context engineering patterns.

| Topic | Focus | Link |
|-------|-------|------|
| **AI Agents Overview** | Introduction to agentic design loops, tool calling, and planning | [→ Overview](/technical-knowledge/ai-agents/overview) |
| **Agent Design** | Agent architecture, memory, state machines, and decision patterns | [→ Agent Design](/technical-knowledge/ai-agents/agents) |
| **Skill Systems** | Extensibility, tool registries, custom skills, and sandbox runs | [→ Skill Systems](/technical-knowledge/ai-agents/skills) |
| **Testing Harness** | Evaluating agents, test harnesses, simulation environments, and validation | [→ Harness](/technical-knowledge/ai-agents/harness) |
| **Vibe Coding** | Natural language coding paradigms, prompt orchestration, and iteration loops | [→ Vibe Coding](/technical-knowledge/ai-agents/vibe-coding) |
| **Context Engineering**| Context window optimization, RAG patterns, and instruction tuning | [→ Context Engineering](/technical-knowledge/ai-agents/context-engineering) |

---

## 📚 Engineering Books

Distilled notes and key takeaways from essential software engineering books.

### Interview Preparation Track

| Book | Author | Focus | Notes |
|------|--------|-------|-------|
| **Cracking the Coding Interview** | Gayle McDowell | Data structures, algorithms, system design, OOP, concurrency | [→ Notes](/books/clean-code/intro) |
| **System Design Interview Vol.1** | Alex Xu | 4-step framework + 10 real system designs (URL shortener, Twitter, etc.) | [→ Notes](/books/ddia/intro) |
| **System Design Interview Vol.2** | Alex Xu & Sahn Lam | Advanced designs: payments, maps, stock exchange | [→ Notes](/books/ddia/intro) |

### Software Craft Track

| Book | Author | Focus | Notes |
|------|--------|-------|-------|
| **Effective Java** | Joshua Bloch | 90 best practices: generics, lambdas, APIs, concurrency, serialization | [→ Notes](/books/effective-java/introduction) |
| **Clean Code** | Robert C. Martin | Naming, functions, comments, formatting, error handling | [→ Notes](/books/clean-code/intro) |
| **Building Microservices** | Sam Newman | Service decomposition, resilience, integration, deployment | *Coming soon* |

### Deep Foundations Track

| Book | Author | Focus | Notes |
|------|--------|-------|-------|
| **Designing Data-Intensive Applications (DDIA)** | Martin Kleppmann | Storage, replication, partitioning, transactions, distributed systems | [→ Notes](/books/ddia/intro) |
| **Clean Architecture** | Robert C. Martin | Architecture principles, dependency rules, component isolation | [→ Notes](/books/clean-architecture/intro) |

:::tip[Reading Order]
**For interviews:** Cracking the Coding Interview → System Design Interview Vol.1 → Vol.2

**For engineering depth:** Effective Java → Clean Code → Building Microservices → DDIA
:::

---

## ☁️ Cloud Certifications AWS DVA-C02

Targeted preparation for the **AWS Certified Developer – Associate (DVA-C02)** exam.

### Exam Overview

| Domain | Weight | Key Services |
|--------|--------|-------------|
| **Domain 1:** Development with AWS Services | **32%** | Lambda, DynamoDB, S3, API Gateway, SQS/SNS |
| **Domain 2:** Security | **26%** | IAM, Cognito, Secrets Manager, KMS, STS |
| **Domain 3:** Deployment | **24%** | CodePipeline, CodeDeploy, Elastic Beanstalk, CloudFormation |
| **Domain 4:** Troubleshooting & Optimization | **18%** | CloudWatch, X-Ray, performance tuning |

### Study Path

| # | Topic | Key Concepts | Link |
|---|-------|-------------|------|
| 1 | DVA-C02 Roadmap | Full exam roadmap and study strategy | [→ Roadmap](/technical-knowledge/aws/dva-c02-roadmap) |
| 2 | AWS Overview | Core services, regions, shared responsibility | [→ Overview](/aws) |
| 3 | Lambda | Invocation models, cold start, layers, destinations, DLQ | [→ Lambda](/technical-knowledge/aws/lambda/) |
| 4 | DynamoDB | Keys, GSI/LSI, streams, DAX, single-table design | [→ DynamoDB](/technical-knowledge/aws/dynamodb/) |
| 5 | API Gateway | REST vs HTTP API, authorizers, throttling, caching | [→ API Gateway](/technical-knowledge/aws/api-gateway/) |
| 6 | S3 | Storage classes, lifecycle, encryption, presigned URLs | [→ S3](/technical-knowledge/aws/s3/) |
| 7 | IAM | Roles, policies, STS, least privilege patterns | [→ IAM](/technical-knowledge/aws/iam/) |
| 8 | Messaging | SQS, SNS, EventBridge, Kinesis — choosing the right service | [→ Messaging](/technical-knowledge/aws/messaging/sqs) |
| 9 | CloudFormation & SAM | IaC, stack management, SAM for serverless | [→ CloudFormation](/technical-knowledge/aws/cloudformation/) |
| 10 | Containers | ECS, ECR, Fargate, App Runner | [→ Containers](/technical-knowledge/aws/containers/ecs-ecr) |
| 11 | RDS & Aurora | Multi-AZ, read replicas, Aurora Serverless | [→ RDS & Aurora](/technical-knowledge/aws/rds-aurora) |
| 12 | ElastiCache | Redis vs Memcached, cache strategies | [→ ElastiCache](/technical-knowledge/aws/elasticache/) |
| 13 | Monitoring | CloudWatch, CloudTrail, X-Ray, Logs Insights | [→ Monitoring](/technical-knowledge/aws/monitoring/cloudwatch) |
| 14 | Security | KMS, Secrets Manager, WAF, Shield | [→ Security](/technical-knowledge/aws/security/kms) |
| 15 | Serverless Patterns | Event-driven, fan-out, saga patterns | [→ Patterns](/technical-knowledge/aws/serverless-patterns) |
| 16 | Exam Tips & Traps | Last-minute key facts and common traps | [→ Exam Tips](/technical-knowledge/aws/exam-tips) |
| 17 | Mock Exam | Full practice exam with explanations | [→ Mock Exam](/technical-knowledge/aws/mock-exam) |

:::caution[DVA-C02 High-Priority Topics]
- **Lambda** — invocation types, cold start optimization, reserved concurrency
- **DynamoDB** — single-table design, GSI/LSI trade-offs, strongly vs eventually consistent reads
- **SQS** — visibility timeout, DLQ, long polling, FIFO vs Standard
- **IAM** — policy evaluation order, role assumption, resource-based vs identity-based policies
- **CloudFormation** — rollback triggers, change sets, stack drift, cross-stack references
:::

---

## Who This Is For

- **Backend engineers** preparing for system design and coding interviews
- **Developers** studying for the AWS DVA-C02 certification
- **Engineers** onboarding to new backend or distributed systems domains
- **Anyone** building a structured, long-term engineering knowledge base
