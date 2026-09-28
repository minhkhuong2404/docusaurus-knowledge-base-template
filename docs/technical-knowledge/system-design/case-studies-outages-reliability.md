---
id: case-studies-outages-reliability
title: "Real-World Case Studies: Catastrophic Outages & High-Reliability Patterns"
sidebar_label: 🚨 Outages & Reliability
description: Senior analysis of landmark production outages and reliability architectures — Facebook 2021 BGP/DNS global collapse, AWS Kinesis 2020 OS thread exhaustion, Stripe Idempotency-Key state machine, Discord Go to Rust GC tail latency rewrite, and Graceful Degradation tiers.
tags: [case-study, system-design, outages, reliability, facebook, aws, stripe, discord, rust, resilience]
---

import CaseStudiesOutagesDiagram from '@site/src/components/CaseStudiesOutagesDiagram';

# Real-World Case Studies: Catastrophic Outages & Reliability

---

Theoretical reliability patterns look clean in architecture diagrams; production reality is messy. The most profound engineering lessons come from examining catastrophic post-mortems of the world's largest distributed platforms.

This guide analyzes five landmark production case studies covering BGP/DNS circular failure loops, operating system kernel thread ceilings, financial idempotency guarantees, garbage-collection tail latency traps, and multi-tier graceful degradation.

<CaseStudiesOutagesDiagram />

---

## 1. Facebook October 2021: Global Backbone & DNS Collapse

On October 4, 2021, Meta (Facebook, Instagram, WhatsApp, Messenger, and Oculus) completely disappeared from the global internet for over **6 hours**.

### What Happened: The Anatomy of the Failure
1. **The Routine Command**: An engineer issued a routine maintenance command to assess backbone network capacity. A software bug in the network audit script bypassed validation and accidentally severed all physical backbone links connecting Facebook’s global datacenters.
2. **DNS Health Check Failure**: Facebook’s authoritative DNS servers run on dedicated edge points of presence (PoPs). These servers periodically perform health checks against backend datacenter services. Because the backbone was severed, all health checks failed.
3. **Automated BGP Route Withdrawal**: By design, if an authoritative DNS server cannot reach its backend, it **withdraws its Border Gateway Protocol (BGP) routes** from the global internet to prevent traffic black-holing.
4. **The Global Blackout**: Within minutes, all Facebook authoritative DNS IPs were withdrawn from global BGP routing tables. To the rest of the internet, `facebook.com` ceased to exist. Resolvers returned `NXDOMAIN`.

```
Backbone Link Severed ──► Health Checks Fail ──► BGP Routes Withdrawn ──► DNS NXDOMAIN
                                                                               │
Datacenter Access Lockout ◄── Smart Badges Depend on Internal DNS ─────────────┘
```

### The Circular Dependency Nightmare
The outage was prolonged to 6 hours because of a fatal circular dependency:
- Facebook's internal communication tools (Workplace, internal chat, email) were hosted on the same infrastructure.
- **Physical Datacenter Lockout**: Engineers dispatched to datacenters to manually restart network switches were physically locked out of server rooms because the **smart badge entry doors evaluated card credentials via internal DNS servers that were unreachable**!
- Accessing the console ports of network switches required physical entry, manual air-gapped serial console cables, and emergency bypass protocol authorizations.

### Architectural Takeaways:
1. **Out-of-Band (OOB) Air-Gapping**: Out-of-band management networks, emergency authentication, and physical facility security systems must **never share dependencies with production DNS or data planes**.
2. **Blast-Radius Gating on BGP**: BGP automated route withdrawals must enforce rate limits. Withdrawing more than 10% of a global backbone route table must trigger a mandatory human confirmation prompt.

---

## 2. AWS Kinesis November 2020: OS Thread Exhaustion

On November 25, 2020, Amazon Web Services suffered a severe multi-hour outage in `us-east-1` that disabled Amazon Cognito, CloudWatch, DynamoDB Streams, and hundreds of third-party platforms relying on AWS Kinesis.

### What Happened: The $O(N^2)$ Mesh Trap
1. **Fleet Capacity Expansion**: The Kinesis team initiated a small capacity expansion on the front-end fleet in `us-east-1` to accommodate increasing customer traffic.
2. **The Hidden Operating System Ceiling**: The Kinesis front-end fleet was designed as an internal all-to-all communication mesh: **every server in the fleet spawned dedicated OS threads to communicate with every other server in the fleet**.
3. **The Kernel Thread Limit**: Adding a batch of new instances pushed the total number of running threads on each server past the Linux kernel operating system limit (`cat /proc/sys/kernel/threads-max` and `ulimit -u`).
4. **Cascading Node Panic**: When servers breached the OS thread ceiling, they could no longer allocate memory or fork new processes. Front-end instances began crashing simultaneously, triggering a massive thundering herd that repeatedly crashed replacement nodes during bootstrap.

```
Add Nodes to Fleet ──► Thread Count = O(N^2) ──► Breaches Linux threads-max ──► Kernel Out of Memory
```

### The Blast Radius: Downstream Service Cascade
Because AWS CloudWatch metrics and Cognito user token validation internally emit events to Kinesis Streams, the Kinesis outage caused CloudWatch to fail, which in turn blinded operators and auto-scalers across all of `us-east-1`.

### Architectural Takeaways:
1. **Never Design $O(N^2)$ Internal Meshes**: Topologies where server connections, heartbeats, or thread allocations scale quadratically ($N^2$) with fleet size are ticking time bombs. Internal communication must use partitioned rings, gossip protocols, or dedicated proxy layers.
2. **Defensive Kernel Capacity Ceilings**: Operating system kernel limits (`threads-max`, `max_user_watches`, file descriptors `nofile`) must be monitored as critical infrastructure metrics with alarms configured at 60% capacity.

---

## 3. Stripe Idempotency: Financial Fault Tolerance

In payment infrastructure, network timeouts are normal occurrences. A mobile phone sending an authorization request to charge $100 might lose cellular connectivity while the bank has already approved the transaction.

If the client retries naively, the customer will be charged twice ($200), resulting in angry customers, merchant disputes, and heavy card network penalties.

### The Stripe Idempotency Key Pattern
Stripe requires clients to send a unique `Idempotency-Key` header with every mutating financial request:

```http
POST /v1/charges
Idempotency-Key: 9e3b4a2c-7b12-4c28-91af-f8c0e2a34b12
Amount: 10000
Currency: USD
```

### The Atomic State Machine:
Stripe's idempotency engine operates as a strict state machine backed by ACID transactions in database and Redis storage:

```
                  ┌──────────────────────────────┐
                  │ Request Arrives with Key     │
                  └──────────────┬───────────────┘
                                 │
                 Check Idempotency-Key in Datastore
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
    [ NOT FOUND ]          [ IN-PROGRESS ]          [ COMMITTED ]
• Insert (key, status)  • Another request is     • Return stored response
• Status: "STARTED"       currently processing     payload immediately!
• Execute payment API   • Return HTTP 409 or     • Zero duplicate charge!
• Store result payload    Wait on Redis Mutex
• Status: "COMMITTED"
```

### Critical Edge Cases:
1. **Payload Mismatch Detection**: If a client sends an identical `Idempotency-Key` with a *different payload* (e.g., trying to charge $500 instead of $100), Stripe rejects the request with an error (`Idempotency key reused with different parameters`), preventing replay attacks.
2. **Atomic Lock Expiration**: If the charging server crashes midway while `status = STARTED`, the lock key expires after a safe timeout window (e.g. 120 seconds), allowing an idempotent retry to recover without permanent deadlocks.

### Key Lessons Learned: Stripe Idempotency
- **Idempotency is not optional in financial APIs**: Network requests are fundamentally at-least-once over the internet. Without idempotency keys, duplicate charges are statistically guaranteed.
- **Locking must be atomic**: Always acquire the mutex atomically (e.g. `SET resource:lock token NX EX 120`) before calling external upstream payment gateways.
- **Store the complete response**: Returning the identical stored payload ensures clients get the same charge ID, receipt URL, and status code on retries without re-invoking payment processors.

---

## 4. Discord: Go to Rust Migration (Eliminating GC Tail Spikes)

In 2020, Discord operated their **Read States** service—responsible for tracking which text channels and messages millions of users had read—written in Go.

### The GC Latency Spike Problem:
- The service held a massive in-memory LRU cache of **30 million user state objects**.
- In Go, the garbage collector traverses all live heap pointers to perform mark-and-sweep reclamation.
- Every **2 minutes**, Go's garbage collector kicked in. Scanning 30 million pointers across dozens of gigabytes of RAM saturated CPU cores, producing catastrophic **2,000ms (2-second) P99 latency spikes**!

```
Go Service:   ───[15ms]───[12ms]───[ 2,000ms GC SPIKE! ]───[15ms]───[12ms]───[ 2,000ms GC SPIKE! ]──►
Rust Service: ───[12ms]───[13ms]───[ 14ms (Flat P99) ]─────[12ms]───[13ms]───[ 15ms (Flat P99) ]─────►
```

### The Rust Architecture:
Discord rewrote the Read States service in **Rust**:
1. **Zero Garbage Collection**: Rust uses RAII (Resource Acquisition Is Initialization) and compile-time ownership tracking. Memory is deallocated the instant a cache item drops out of scope.
2. **Manual Memory Control**: Zero background sweeps. The CPU is dedicated entirely to serving user requests.
3. **The Result**: Average latency dropped from 15ms to 8ms; **P99 latency plummeted from 2,000ms down to a flat 15ms**, and memory consumption dropped by 60%!

### Key Lessons Learned: Discord Go to Rust
- **Beware of Large In-Memory Heaps in GC Languages**: Tracing garbage collectors (Java, Go, C#) degrade when heaps exceed millions of live pointers. GC pause times are proportional to the number of live pointers, not allocated gigabytes.
- **Use Rust for Latency-Critical In-Memory Hot Paths**: Where tail latency (P99 / P99.9) directly impacts real-time user experience, deterministic RAII memory management completely eliminates unpredictable stop-the-world pauses.
- **Go is still great for I/O bound services**: Discord continues using Go for thousands of standard I/O microservices; Rust is reserved for massive in-memory caching and compute-heavy kernels.

---

## 5. Graceful Degradation: Load Shedding Tiers

When extreme traffic spikes or cascading downstream outages strike, high-reliability platforms don't crash binary style (100% up or 100% down). They practice **Graceful Degradation** through stratified load-shedding tiers.

```
                        PRIORITY SHEDDING TIERS
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
TIER 1: CRITICAL           TIER 2: EXPECTED           TIER 3: SPECULATIVE
• Checkout / Payment       • Review count badge       • Personalized recs
• Authentication           • View counter             • Real-time typing indicators
• Order creation           • Search auto-complete     • Background analytics
  (NEVER SHED)               (SERVE CACHED / ESTIMATE)   (SHED IMMEDIATELY UNDER LOAD)
```

### Production Patterns:
1. **Speculative Shedding**: Under 85% CPU load, the API gateway immediately drops Tier 3 calls (`HTTP 204 No Content` or cached defaults) without invoking microservices.
2. **Fallback Caches**: If the search service fails, return a pre-computed static JSON of the top 50 bestselling products.
3. **Decoupled UI Components**: Web and mobile apps are engineered with defensive micro-frontends: an error in the recommendation carousel simply hides the section, allowing the user to complete checkout seamlessly.

### Key Lessons Learned: Graceful Degradation
- **A partial response beats an HTTP 500 error**: Users tolerate a missing product review score if they can still buy the item; they will abandon the app if checkout fails entirely.
- **Classify endpoints into strict priority tiers**: Establish clear SLA contracts with product teams on what degrades first during load events.
- **Test degradation under chaos conditions**: Regularly run game days with Chaos Engineering (e.g. Chaos Mesh, Gremlin) killing secondary dependencies to verify that primary user journeys stay operational.

---

### Compare Next
- [Hyper-Scale Architecture Case Studies](./case-studies-architecture-scaling.md)
- [Petabyte Data Stores & Migrations](./case-studies-data-migrations.md)
- [Platform Delivery & Modern CI/CD](./platform-delivery-reliability.md)
