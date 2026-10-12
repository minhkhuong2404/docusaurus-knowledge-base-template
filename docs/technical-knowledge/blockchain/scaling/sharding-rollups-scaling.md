---
id: sharding-rollups-scaling
title: Sharding, Rollups & Blockchain Scaling
sidebar_label: Sharding, Rollups & Scaling
description: Blockchain scalability - the trilemma, database-style sharding vs blockchain sharding, Ethereum danksharding, data availability sampling, optimistic and ZK rollups, state channels, sidechains, cross-shard atomicity, and bridge risks.
tags:
  - technical-knowledge
  - blockchain
  - sharding
  - scaling
  - rollups
---

import BlockchainScalingDiagram from '@site/src/components/BlockchainScalingDiagram';

# Sharding, Rollups & Blockchain Scaling

## Why L1 Is Slow

Every full node re-executes every transaction and stores all state. Throughput is bounded by the **weakest honest node** (CPU, disk IOPS, bandwidth), because raising limits prices out verifiers and centralises the network.

| Scaling axis | Approach | Cost |
|---|---|---|
| Vertical | Bigger blocks / faster blocks / bigger hardware (Solana, BSC) | Fewer, richer validators |
| Horizontal: **sharding** | Split state & processing across committees | Cross-shard complexity, smaller security per shard |
| Layered: **rollups** | Execute off-chain, verify/store compressed data on L1 | Sequencer centralisation, bridging, fragmentation |
| Off-chain: **channels** | Lock funds, exchange signed updates, settle later | Liveness assumption, limited to participants |

## 1. Sharding

<BlockchainScalingDiagram initialTab="sharding" />

### Database Sharding (for contrast)

Hash/range partition rows over trusted machines; a coordinator routes queries; cross-shard transactions use 2PC or Sagas. Machines are *honest* and replicated.

### Blockchain Sharding - New Problems

| Problem | Why it is harder than DB sharding |
|---|---|
| **Single-shard takeover** | Adversary with 30% of *total* stake could capture one small committee (1/64) -> committees need random sampling, frequent reshuffling, and large size |
| **Cross-shard atomicity** | No trusted coordinator; use async receipts (Near, Zilliqa) or lock/commit across committees (Elrond) -> latency and failure modes |
| **State availability** | A shard's data may be withheld -> need *data availability* proofs |
| **Validator state load** | Reshuffled validators must sync new shard state (stateless validation / witnesses) |
| **Hot shards** | Popular contract lives on one shard -> unequal load |

**Production designs:** Near *Nightshade* (chunks per shard in one block), Zilliqa, Elrond/MultiversX (adaptive state sharding), Polkadot (parachains with shared security, shard-like), Ethereum 2.0's original **execution sharding** (dropped 2020).

### Ethereum's Pivot: Data Sharding + Rollups

- **EIP-4844** (blobs) -> **Danksharding / PeerDAS**: shard *data*, not execution.
- **Data Availability Sampling (DAS):** data is erasure-coded (Reed-Solomon, 2x extension) with KZG commitments; each node downloads *random small samples*. If > 50% of data were withheld, a node detects it with probability `1 - 2^-k` after `k` samples. Light nodes jointly guarantee availability without anyone downloading everything.

## 2. Rollups

<BlockchainScalingDiagram initialTab="rollup" />

| | **Optimistic Rollup** | **ZK (Validity) Rollup** |
|---|---|---|
| Examples | Arbitrum, Optimism, Base | zkSync Era, Starknet, Scroll, Linea, Polygon zkEVM |
| Security assumption | >= 1 honest verifier submits a fraud proof within the window | Cryptographic validity proof (SNARK/STARK) checked by L1 contract |
| L1 withdrawal delay | ~7 days (fast exits via liquidity providers) | Minutes to hours (proof generation + verification) |
| Prover cost | None unless disputed | Heavy (GPU/ASIC provers), improving fast |
| EVM equivalence | Near-complete | Type-1..4 zkEVMs trade compatibility for proving cost |
| Data on L1 | Full tx data (compressed) | Data or state diffs (smaller) |

### Rollup Anatomy

1. **Sequencer** orders L2 txs, issues soft confirmations (ms), builds batches.
2. **Batch poster** compresses (RLP, brotli/zstd, signature aggregation) and posts as blob data to an L1 inbox/`BatchInbox`.
3. **State root** commitment stored in an L1 contract.
4. **Proof system** - fraud proof (interactive bisection down to one VM step) or validity proof.
5. **Bridge** - deposit via L1 contract (message to L2); withdraw by proving L2 state on L1.
6. **Escape hatch / forced inclusion** - users can submit txs via L1 if the sequencer censors them.

**Stage framework (L2BEAT):** Stage 0 (training wheels, council can override), Stage 1 (permissionless proofs, security council), Stage 2 (fully trustless except in provable bugs). Most rollups are still < Stage 2 - read the risk disclosures.

### Data Availability Choices

| Mode | DA layer | Trust |
|---|---|---|
| **Rollup** | Ethereum blobs | Ethereum security |
| **Validium** | Off-chain committee / DAC | Committee can withhold data -> funds frozen |
| **Celestia / Avail / EigenDA** (modular DA) | Dedicated DA network | Their validator set + DAS |

## 3. Other Scaling Approaches

| Approach | Idea | Note |
|---|---|---|
| **State channels** (Lightning, Raiden) | Off-chain signed state updates; on-chain dispute | Great for recurring pairwise payments |
| **Plasma** | Child chains with exit games | Mass-exit problem; superseded by rollups |
| **Sidechains** (Polygon PoS, Gnosis) | Independent chain with own validators + bridge | Security is *not* inherited from L1 |
| **Parallel EVM / optimistic concurrency** (Monad, Sei, Block-STM in Aptos/Sui) | Execute txs in parallel with conflict detection | Needs read/write-set analysis |
| **App-chains** (Cosmos zones, OP Stack, Arbitrum Orbit) | Dedicated chain per application | Own security/liquidity cost |

## 4. Cross-Chain Bridges - The Weakest Link

~$2.5B+ stolen from bridges (Ronin $625M, Poly Network $611M, Wormhole $325M, Nomad $190M).

| Bridge design | Trust | Typical failure |
|---|---|---|
| Multisig/validator set | m-of-n keys | Key compromise (Ronin) |
| Optimistic | Watchers | Bad initialisation (Nomad) |
| Light client / ZK | Math + chain consensus | Complexity, bugs in verifier |
| Liquidity network | LPs + routers | Liquidity risk, MEV |

**Engineering rule:** minimise value at risk; use rate limits, delayed withdrawals, per-asset caps, independent monitoring, and canonical (native) bridges where possible.

## 5. Choosing a Scaling Strategy (Trade-off Matrix)

| Need | Pick | Why |
|---|---|---|
| Max security, DeFi settlement | Ethereum L1 | Highest decentralisation; expensive |
| Cheap consumer apps with L1 security | ZK/optimistic rollup | Inherits Ethereum safety, low fees |
| Ultra-low latency trading | Solana / app-chain | Higher throughput, hardware requirements |
| Micro-payments between known parties | State channels / Lightning | Near-zero fees |
| Enterprise consortium | Permissioned chain (Fabric/Besu) | Throughput + privacy, no token |

## Senior Interview Angles

1. *Why didn't Ethereum ship execution sharding?* Rollups scale execution today; bottleneck is **data**, so shard data and leave execution to L2s.
2. *What happens if a sequencer goes down?* Soft finality halts; forced-inclusion via L1 and (eventually) decentralised/based sequencing.
3. *Why 7 days?* Time for honest watchers to detect, craft and land a fraud proof under censorship and congestion assumptions.
4. *Cost model:* L2 fee = L2 execution + (L1 blob/calldata cost / batch size); batch size and blob price dominate.
5. *Atomic cross-shard transfer?* Two-phase lock -> commit with proofs, or async receipts with eventual completion and failure-refund handling.

Next: [IPFS & Decentralized Storage](../storage/ipfs-decentralized-storage.md).
