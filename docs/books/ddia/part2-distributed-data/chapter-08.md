---
id: chapter-08
title: "Chapter 8: The Trouble with Distributed Systems"
sidebar_label: "Ch 8 — Trouble with Distributed Systems"
sidebar_position: 4
---

# Chapter 8: The Trouble with Distributed Systems

## The Big Idea

Working with distributed systems requires a fundamentally different mindset than single-machine programming. In a single process, if something works once, it works reliably. In a distributed system, **anything can go wrong at any time** — and your system must be designed to work *despite* this.

This chapter catalogs what can go wrong and why, building the vocabulary for the solutions in Chapter 9.

---

## 🤔 Faults and Partial Failures

In a single computer: if hardware works, software either runs correctly or crashes completely. Either/or. But in a distributed system, you get **partial failures** — some parts work, others don't, and it's non-deterministic.

**Example:** You send a request to a remote node. Did it:
- Receive the request? (network packet lost)
- Process the request? (node crashed before processing)
- Send a response? (response lost)
- Respond but you didn't receive it? (one-way network failure)

You cannot tell which case occurred. The only signal you have is: *timeout*.

This is the **fundamental difficulty** of distributed systems.

---

## 🌐 Unreliable Networks

The dominant model for distributed systems is **shared-nothing**: each node has its own CPU, RAM, and disk. Communication is via an **asynchronous packet network**. This network can:

- Drop packets
- Queue packets for an arbitrarily long time
- Duplicate packets
- Deliver packets out of order
- Lose packets without any notification

:::tip Real-world example
In 2012, a network switch at GitHub's data center had a bug that caused 2-minute packet delays. Thousands of servers thought each other were dead and tried to elect new leaders simultaneously. Pure chaos.
:::

### Timeouts and Unbounded Delays

Since networks are unreliable, the only way to detect failure is **timeouts**. But:

- Too short → spurious failures (a slow node triggers failover unnecessarily)
- Too long → long wait during actual failures

There is **no perfect timeout value**. Network round-trip times vary widely (from < 1ms to minutes, or never). Even on a LAN with fiber, a paused GC or a congested switch can cause multi-second delays.

**TCP vs UDP:** TCP retransmits lost packets (but adds latency). UDP doesn't (better for real-time: voice calls, games). Neither gives you delivery time guarantees.

### Synchronous vs Asynchronous Networks

**Telephone circuit (synchronous):** A fixed bandwidth slice is reserved for your call. Guaranteed max delay. But you're paying for that bandwidth even when silent.

**TCP/IP (asynchronous / packet-switched):** No reserved bandwidth. Best-effort delivery. When idle, uses zero bandwidth. When busy, the queue grows and delay increases. This is why TCP networks have variable latency.

You *could* build a distributed system with bounded delays if you used circuit-switched reserved bandwidth — but the internet isn't built that way.

---

## ⏰ Unreliable Clocks

Clocks matter for:
- Measuring durations (timeouts, SLA monitoring)
- Describing points in time (ordering events)

Distributed systems have **two kinds of clocks**:

### Time-of-Day Clocks

Reports the current date and time. Synchronized via **NTP (Network Time Protocol)**. Problems:

- NTP sync jumps time forward or backward (your timestamps can go backward!)
- NTP can only be as accurate as the network (typically 35ms over internet, 1ms on LAN)
- A clock running too fast or too slow may be forcibly reset
- The resolution is often coarser than you think (milliseconds, not nanoseconds)

### Monotonic Clocks

Always increasing. Never set backwards. Used to measure elapsed time (e.g., `System.nanoTime()` in Java).

**But:** Monotonic clocks are *per-node*. You cannot meaningfully compare monotonic clock values across different machines.

### Dangerous Assumption: Clock Synchronization

**Example — Last Write Wins with timestamps:**

```
Node 1 clock: 10:00:00.002 → writes value "A" to key X
Node 2 clock: 10:00:00.000 → writes value "B" to key X (0.002 seconds "earlier")
→ LWW says "A" wins (later timestamp), but "B" was actually written later
→ Data silently lost!
```

**Example — Distributed lock with lease:**

```
Client 1 gets lock, lease expires in 10 seconds
Client 1 pauses for 15 seconds (GC, scheduling)
Client 1 resumes, thinks it still has the lock (checked local clock)
Client 2 got the lock 5 seconds ago (Client 1's lease expired)
→ Both clients think they have the lock → data corruption!
```

**Logical clocks (Lamport clocks):** Don't use wall-clock time at all. Use incrementing counters that capture *causal ordering* — if A happened before B, A's counter < B's counter. Safer for ordering events across machines.

---

## ⏸️ Process Pauses

A process can be paused for surprisingly long periods:

- **Garbage collection (stop-the-world GC):** Java GC pauses can last minutes in extreme cases
- **Virtual machine migration:** VM is paused while migrating between hosts
- **Laptop sleep:** User closes the lid; process is suspended
- **OS context switch:** OS scheduler preempts the process
- **Disk I/O:** Waiting for a page fault

During a pause, **the world moves on** — locks expire, leases expire, timeouts fire, other nodes declare you dead. When you resume, you don't know how much time has passed.

This is why you cannot trust a node that checks its own clock to determine if it's still the leader. **A paused leader may wake up and think it's still in charge.**

**Fencing tokens:** A monotonically increasing token issued with each lock grant. Storage server rejects requests with stale tokens. This protects against paused processes that think they still hold the lock.

---

## 🧠 Knowledge, Truth, and Lies

### The Truth Is Defined by the Majority

A node cannot trust its own judgment about whether it's the leader or whether it holds a lock. The *system* decides — typically by majority vote (quorum). A node that is isolated from the majority and thinks it's the leader is wrong, even if locally consistent.

**If a node declares itself dead, is it?** Not necessarily. It could be temporarily slow (network partition), then come back. The cluster may have elected a new leader in the meantime.

### Byzantine Faults

So far, we've assumed nodes are **fail-stop** — they may be slow or crash, but they don't lie. **Byzantine faults** are when nodes send intentionally incorrect or malicious messages.

**Byzantine fault tolerance (BFT):** Systems that work correctly even if some nodes are Byzantine (lying). Used in aerospace, blockchains, and some critical systems.

For most data systems: not worth the complexity. Trust that nodes follow the protocol.

### System Models

Theoretical models for reasoning about distributed algorithms:

| Model | Network | Clocks | Processes |
|---|---|---|---|
| **Synchronous** | Bounded delays | Accurate, bounded drift | Bounded pauses |
| **Partially synchronous** | Usually bounded, sometimes not | Usually ok | Usually ok (GC pauses) |
| **Asynchronous** | No timing guarantees | No clocks | Unbounded pauses |

Real systems are closest to **partially synchronous** — mostly well-behaved, occasionally pathological.

For crash failures:
- **Crash-stop:** Node crashes → stays dead forever
- **Crash-recovery:** Node crashes → may restart (with durable state)
- **Byzantine:** Node may behave arbitrarily (lie, send random data)

---

## Summary

In distributed systems, you must assume:

```
✗ Network is reliable
✗ Latency is zero or bounded
✗ Bandwidth is infinite
✗ Network is secure
✗ Topology doesn't change
✗ There is only one administrator
✗ Transport cost is zero
✗ The network is homogeneous
✗ Clocks are accurate
✗ Your process is not paused
```

(These are the "8 Fallacies of Distributed Computing" — all of them false.)

Designing good distributed systems means building **safety guarantees** that hold despite all of these assumptions being violated. That's the topic of Chapter 9.
