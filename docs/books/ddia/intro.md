---
id: intro
title: Designing Data-Intensive Applications
sidebar_label: 📖 Introduction
sidebar_position: 1
---

# Designing Data-Intensive Applications

> *The Big Ideas Behind Reliable, Scalable, and Maintainable Systems*
> — Martin Kleppmann (O'Reilly, 2017)

## What Is This Book About?

Modern applications are not **compute-intensive** (CPU is rarely the bottleneck) — they are **data-intensive**. The real challenges are:

- The **volume** of data
- The **complexity** of data
- The **speed** at which data changes

This book cuts through the buzzwords (NoSQL, Big Data, CAP theorem, eventual consistency…) and explains the *engineering principles* behind the tools, so you can make smart architectural decisions.

---

## Book Structure

The book is divided into **three parts**, covering 12 chapters:

### 📦 Part I — Foundations of Data Systems
Covers ideas that apply to any data system, whether on a single machine or a cluster.

| Chapter | Topic |
|---------|-------|
| [Chapter 1](/books/ddia/part1-foundations/chapter-01) | Reliable, Scalable, and Maintainable Applications |
| [Chapter 2](/books/ddia/part1-foundations/chapter-02) | Data Models and Query Languages |
| [Chapter 3](/books/ddia/part1-foundations/chapter-03) | Storage and Retrieval |
| [Chapter 4](/books/ddia/part1-foundations/chapter-04) | Encoding and Evolution |

### 🌐 Part II — Distributed Data
What happens when data is spread across multiple machines — for scale and fault tolerance.

| Chapter | Topic |
|---------|-------|
| [Chapter 5](/books/ddia/part2-distributed-data/chapter-05) | Replication |
| [Chapter 6](/books/ddia/part2-distributed-data/chapter-06) | Partitioning |
| [Chapter 7](/books/ddia/part2-distributed-data/chapter-07) | Transactions |
| [Chapter 8](/books/ddia/part2-distributed-data/chapter-08) | The Trouble with Distributed Systems |
| [Chapter 9](/books/ddia/part2-distributed-data/chapter-09) | Consistency and Consensus |

### 🔄 Part III — Derived Data
Systems that transform and combine datasets to produce new ones.

| Chapter | Topic |
|---------|-------|
| [Chapter 10](/books/ddia/part3-derived-data/chapter-10) | Batch Processing |
| [Chapter 11](/books/ddia/part3-derived-data/chapter-11) | Stream Processing |
| [Chapter 12](/books/ddia/part3-derived-data/chapter-12) | The Future of Data Systems |

---

## Who Should Read This?

- **Backend / platform engineers** who store and process data at scale
- **Software architects** choosing between databases, queues, and processing frameworks
- **Technical leads** who need to reason about trade-offs in distributed systems

You should be comfortable with SQL and basic backend development. Everything else is explained from first principles.

---

## Key Themes

```
Reliability   →  Working correctly even when things go wrong
Scalability   →  Handling growth in data, traffic, and complexity  
Maintainability → Being easy to work on over time by different teams
```

These three properties appear in every chapter and tie the whole book together.

## Quick Navigation

- Start DDIA: [Chapter 1 - Reliable, Scalable, and Maintainable Applications](/books/ddia/part1-foundations/chapter-01)
- Jump to distributed systems: [Chapter 8 - The Trouble with Distributed Systems](/books/ddia/part2-distributed-data/chapter-08)
- Switch book: [Clean Code Introduction](/books/clean-code/intro)
- Switch book: [Effective Java Introduction](/books/effective-java/introduction)
