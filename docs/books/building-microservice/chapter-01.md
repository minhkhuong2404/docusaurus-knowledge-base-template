---
sidebar_position: 2
title: "Chapter 1: What Are Microservices?"
---

# Chapter 1: What Are Microservices?

**Part I — Foundation**

> This chapter introduces the core concept of microservices, their defining characteristics, how they differ from monolithic architectures, and the trade-offs you must understand before adopting them.

---

## What Are Microservices?

Microservices are **independently deployable services modeled around a business domain**. Each service encapsulates its own functionality and exposes it to the outside world only through a network interface — typically a REST API, a message queue, or a gRPC endpoint.

A key insight: a microservice is a **black box** from the outside. Consumers don't care about the internal implementation — what language it's written in, how it stores data, or how it processes requests. Only the public interface (contract) matters.

### Defining Characteristics

1. **Independent Deployability** — You can deploy one service without touching any other. This is *the* most important property to internalize.
2. **Modeled Around a Business Domain** — Boundaries are drawn along business capabilities, not technical layers.
3. **Own Their Own State** — Each service owns its data. No shared databases. If Service A needs data from Service B, it asks Service B through its API.
4. **Technology Agnostic** — Different services can use different languages, frameworks, and databases (Java + Spring for one, Go for another).
5. **Small Enough to Understand** — A service should fit in a developer's head. The concept of size is contextual, not a fixed line count.

:::tip Key Takeaway
If you take only one thing from this book: **embrace independent deployability**. Everything else follows from it.
:::

---

## Microservices vs. Monoliths

The book identifies three common monolith types:

### 1. Single-Process Monolith
All code packaged and deployed as a single process. The classic monolith. One deployment unit, one database.

```
[ UI ] → [ Business Logic ] → [ Database ]
     all in one deployable artifact
```

### 2. Modular Monolith
Still one deployment unit, but with internal modular boundaries. Actually a good architecture if done well — better than poorly structured microservices.

### 3. Distributed Monolith
The *worst* of both worlds. Multiple services that still must be deployed together, tightly coupled at the network level. High operational complexity with none of the benefits.

:::warning
A distributed monolith occurs when teams split services but keep sharing databases or create chatty synchronous coupling between every service. Avoid at all costs.
:::

---

## Key Concepts Explained

### Information Hiding
From David Parnas: hide as much internal detail as possible. Expose only a stable public contract. Internal implementation can change freely as long as the contract stays stable.

In Java terms: think of it like encapsulation in OOP, but at the service level. Your `OrderService` class doesn't expose its internal fields — neither should your Order microservice expose its database schema.

### Conway's Law
> "Organizations which design systems are constrained to produce designs which are copies of the communication structures of those organizations."

A three-tiered architecture (DB / Backend / Frontend owned by three separate teams) emerges from how IT organizations historically grouped people by skill (DBAs, Java devs, frontend devs). Microservices encourages **stream-aligned teams** — cross-functional teams that own end-to-end functionality.

### SOA vs. Microservices
Service-Oriented Architecture (SOA) was the predecessor concept. Microservices are an *opinionated form* of SOA. Where SOA failed due to heavy ESBs (Enterprise Service Buses) and SOAP, microservices favor lightweight, decentralized communication and team autonomy.

---

## Advantages of Microservices

| Advantage | Explanation |
|-----------|-------------|
| **Technology flexibility** | Use the best tool per service |
| **Independent scaling** | Scale only the bottleneck service |
| **Team autonomy** | Small teams own their services end-to-end |
| **Resilience** | Failure in one service doesn't crash the whole system |
| **Easier deployment** | Smaller releases, lower risk per deployment |

---

## Disadvantages and Challenges

Microservices are **not free**. The book is unusually honest about this:

- **Distributed systems complexity** — network failures, latency, partial failures
- **Data consistency** — no shared ACID transactions across services
- **Testing difficulty** — end-to-end tests become expensive
- **Operational overhead** — more services = more to monitor, deploy, and maintain
- **Organizational investment** — requires mature DevOps practices

:::caution
Microservices are not the default right choice. Starting with a well-structured monolith and extracting services incrementally is often the smarter path.
:::

---

## When to Use Microservices

Use them when you need:
- **Independent team scaling** — multiple teams working without stepping on each other
- **Selective technical scaling** — one component needs 10× the resources of others
- **Robustness** — failures should be isolated
- **Independent release cadence** — different parts of the system evolve at different speeds

Don't use them:
- For brand-new, greenfield products where the domain is still unclear
- For small teams with limited ops experience
- When you haven't yet defined stable domain boundaries

---

## MusicCorp — The Running Example

Throughout the book, Sam Newman uses **MusicCorp** as a fictional e-commerce company selling CDs online. We follow this company's journey as it explores microservices. The Catalog, Orders, Customer, Shipping, and Recommendation services that appear in examples all belong to MusicCorp.

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| Microservice | Independently deployable, business-domain-scoped service |
| Information Hiding | Expose only stable contracts; hide internals |
| Independent Deployability | The most important property — deploy one service without touching others |
| Conway's Law | Your architecture mirrors your org structure |
| Monolith types | Single-process, Modular, Distributed (worst) |
