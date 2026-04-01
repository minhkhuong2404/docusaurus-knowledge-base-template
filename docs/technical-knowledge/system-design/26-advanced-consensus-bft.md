---
id: advanced-consensus-bft
title: Advanced Consensus and BFT
sidebar_label: Advanced Consensus and BFT
description: Crash-fault vs Byzantine-fault consensus, when BFT is needed, and the operational tradeoffs of protocols such as PBFT and HotStuff.
tags: [consensus, bft, raft, paxos, pbft, hotstuff, distributed-systems]
---

# Advanced Consensus and BFT

> Raft/Paxos assume nodes fail by crashing. BFT protocols handle arbitrary or malicious behavior.

---

## Beginner View

### Crash Fault vs Byzantine Fault
- **Crash fault**: node stops responding
- **Byzantine fault**: node responds incorrectly, inconsistently, or maliciously

Most enterprise systems use crash-fault consensus (Raft/Paxos). BFT is used only when trust assumptions are weaker.

### Replica Count Intuition
- Crash fault tolerance: usually `2f + 1` replicas for `f` faults
- Byzantine fault tolerance: usually `3f + 1` replicas for `f` Byzantine faults

This is why BFT is more expensive.

---

## Senior Deep Dive

### Why BFT Costs More
- More message rounds for agreement
- Signature/verification overhead
- Higher network fan-out and latency

### Protocol Families
- **PBFT**: classic three-phase protocol; high communication overhead
- **HotStuff**: pipeline-friendly design reducing protocol complexity
- **Tendermint-style**: practical BFT for validator-based systems

### Decision Framework
Use crash-fault consensus when:
- Single organization control plane
- Strongly authenticated infra and low adversarial risk

Use BFT when:
- Multi-organization governance
- Adversarial environment cannot be ignored
- Cost of inconsistent/malicious state is catastrophic

---

## Failure Models and Risk Mapping

| Environment | Recommended model | Reason |
|---|---|---|
| Internal service registry | Crash fault | Trusted infra, lower cost |
| Cross-company settlement network | BFT | Independent trust domains |
| Public validator network | BFT | Adversarial participants expected |

---

## Operational Considerations

- Benchmark consensus latency under realistic geo RTT
- Use hardware crypto acceleration if signature-heavy
- Define quorum-loss runbooks and emergency governance flows
- Continuously test node equivocation/Byzantine simulation in staging

---

## Interview Questions

1. Why can Raft not handle Byzantine faults by design?
2. Explain why BFT generally needs `3f + 1` replicas.
3. When is BFT over-engineering for enterprise systems?
4. Compare PBFT and HotStuff at a high level.
5. How do trust assumptions drive consensus choice?
6. What are practical performance bottlenecks in BFT systems?
7. How would you justify BFT to a product team concerned about latency?
8. What staging tests would you run for Byzantine behavior?
