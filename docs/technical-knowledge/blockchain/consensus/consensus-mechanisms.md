---
id: consensus-mechanisms
title: Consensus Mechanisms - PoW, PoS, BFT, and Finality
sidebar_label: Consensus Mechanisms
description: Distributed consensus for blockchains - FLP impossibility, Nakamoto consensus, Proof of Stake with Casper FFG, PBFT/Tendermint, Raft vs BFT, fork choice, 51% attacks, long-range attacks, and trade-offs.
tags:
  - technical-knowledge
  - blockchain
  - consensus
  - distributed-systems
---

import BlockchainCoreDiagram from '@site/src/components/BlockchainCoreDiagram';

# Consensus Mechanisms

**Consensus** lets N nodes, some of which may be faulty or malicious, agree on a single ordered log. Two properties matter:

- **Safety** - no two honest nodes finalise conflicting histories.
- **Liveness** - the network keeps finalising new blocks.

## Theory You Must Know

| Result | Statement | Implication |
|---|---|---|
| **FLP (1985)** | In a fully asynchronous network, deterministic consensus is impossible with even one crash fault | Real protocols add timeouts (partial synchrony) or randomness |
| **CAP** | Under partition choose consistency or availability | Bitcoin/Ethereum favour **availability** (chains fork, reconcile later); Tendermint favours **consistency** (halts without 2/3) |
| **BFT bound** | Tolerating `f` Byzantine nodes needs `n >= 3f + 1` | Classic BFT tolerates < 1/3 malicious |
| **Crash-fault bound** | Raft/Paxos need `n >= 2f + 1` | Cheaper but assumes nodes are *not* malicious |

## 1. Proof of Work - Nakamoto Consensus

<BlockchainCoreDiagram initialTab="consensus" />

- Anyone can append a block by finding `H(header) < target`.
- **Fork choice: heaviest cumulative work** (not "longest by count").
- Safety is **probabilistic**: attacker with fraction `q` of hash power catches up from `z` blocks behind with probability `(q/p)^z` (`p = 1-q`) for `q < 0.5`.
- **Incentives:** block reward + fees; honest mining is the profit-maximising strategy for `q < ~0.33` (selfish mining can profit above that).

| Pros | Cons |
|---|---|
| Permissionless, Sybil resistance via physical cost | ~150 TWh/yr (Bitcoin) energy |
| Simple, battle-tested since 2009 | Low TPS, probabilistic finality |
| Objective weak-subjectivity-free sync (just verify work) | ASIC / pool centralisation |

**Attacks:** 51% (double-spend, censorship), selfish mining, eclipse attacks (isolate a node's peers), **timestamp manipulation**, and **rental attacks** on small chains (Ethereum Classic 2019/2020 reorgs).

## 2. Proof of Stake

Validators lock capital; misbehaviour is **slashed**.

### Ethereum Gasper = LMD-GHOST + Casper FFG

| Concept | Detail |
|---|---|
| Slot / Epoch | 12 s slot, 32 slots = 1 epoch (6.4 min) |
| Proposer | One pseudo-random validator per slot (RANDAO) |
| Committees | Validators split into committees that attest each slot; BLS signatures aggregated |
| Fork choice | **LMD-GHOST** - follow the subtree with most recent attestation weight |
| Finality | **Casper FFG** - checkpoint is *justified* with 2/3 stake, *finalized* when the next is justified (~2 epochs ~ 12.8 min) |
| Slashing | Double-vote, surround-vote, double-proposal. Reverting a finalized block burns >= 1/3 of total stake |
| Inactivity leak | If no finality, non-attesting validators bleed stake until the active set is 2/3 again |

### PoS-Specific Attacks

| Attack | Description | Mitigation |
|---|---|---|
| **Nothing-at-stake** | Validators vote on all forks because it is free | Slashing makes equivocation costly |
| **Long-range** | Old keys rewrite history from far back | **Weak subjectivity checkpoints** - new nodes sync from a trusted recent state root |
| **Liveness / censorship** | >1/3 offline stalls finality; >1/2 can censor | Inactivity leak, proposer-builder separation |
| **Stake centralisation** | Liquid staking (Lido) holding large share | Social pressure, DVT, protocol limits |

## 3. Classical BFT (PBFT, Tendermint/CometBFT, HotStuff)

Known validator set; rounds of voting; **instant deterministic finality** if > 2/3 are honest.

```
Tendermint round (height H, round R):
  Propose  : designated proposer broadcasts block B
  Prevote  : each validator prevotes B (or nil on timeout)
  Precommit: on seeing > 2/3 prevotes -> precommit B (and lock)
  Commit   : on seeing > 2/3 precommits -> block committed, H+1
```

- **Locking** guarantees safety across rounds: a validator that precommitted `B` only prevotes `B` (or a block with a newer valid proof-of-lock) later.
- **Cost:** O(n^2) messages in PBFT; HotStuff makes it linear with leader-aggregated threshold signatures, which Diem/Aptos/Sui-style protocols adopt.
- Used by Cosmos, Binance Smart Chain-like validators sets, many permissioned ledgers.

## 4. Raft / Paxos vs BFT

| | Raft / Paxos | BFT (PBFT/Tendermint) | Nakamoto (PoW/PoS) |
|---|---|---|---|
| Fault model | Crash only | Byzantine (< 1/3) | Byzantine (< 1/2 resource) |
| Membership | Fixed | Fixed or stake-weighted | Open |
| Finality | Immediate | Immediate | Probabilistic / economic |
| Scale | 3-7 nodes | 4-200 validators | Thousands of nodes |
| Use | Kafka KRaft, etcd, Consul | Cosmos, permissioned chains | Bitcoin, Ethereum |

See also: [Raft Consensus in Kafka](../../kafka/core/raft-consensus.md).

## 5. Other Mechanisms (quick reference)

| Mechanism | Idea | Example |
|---|---|---|
| **Delegated PoS** | Token holders elect a small block-producer set | EOS, Tron |
| **Proof of History** | Verifiable delay function sequence acts as a clock; combined with Tower BFT | Solana |
| **Proof of Authority** | Identified approved signers | Private/test networks, Clique |
| **DAG-based** (Narwhal/Bullshark, Avalanche) | Separate data dissemination from ordering, or metastable sampling | Sui, Avalanche |
| **Proof of Space/Time** | Committed storage | Filecoin, Chia |

## 6. Fork Choice vs Finality - Do Not Confuse

- **Fork choice** picks the head *now* (may flip).
- **Finality** is a promise it will *never* flip without slashing/enormous cost.

Services should expose three block tags: `latest` (head), `safe` (justified), `finalized`. Use `finalized` for custody and bridge actions.

## Senior Interview Gotchas

1. *Why is "longest chain" wrong?* Must be most **accumulated work**; a long chain of low-difficulty blocks is cheaper to fake.
2. *Why can PoS be "cheaper" yet secure?* Attack cost is stake slashed (burned) vs PoW miners keeping hardware after failed attack.
3. *Why does Tendermint halt rather than fork?* It prefers consistency (CP) - no commit without 2/3 precommits.
4. *Is 51% needed to attack?* Not for censorship in BFT (1/3 halts), nor for selfish mining (~25-33%).
5. *Finality gadget on top of PoW?* Yes - e.g. checkpointing (Bitcoin has none by design; some chains add it for exchange safety).

Next: [Bitcoin Internals](../platforms/bitcoin-internals.md).
