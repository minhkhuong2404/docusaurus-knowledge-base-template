---
id: intro
title: Blockchain & Web3 Knowledge Base
sidebar_label: Introduction
description: Complete learning path for blockchain, distributed ledgers, consensus, Ethereum, smart contracts, Web3, sharding, rollups and IPFS - from first principles for new learners to production failure modes for senior engineers.
tags:
  - technical-knowledge
  - blockchain
  - web3
  - intro
---

import BlockchainCoreDiagram from '@site/src/components/BlockchainCoreDiagram';

# Blockchain & Web3 Knowledge Base

> A blockchain is a **replicated, append-only, hash-linked state machine** whose replicas agree on the next state without trusting a coordinator. Everything else (mining, gas, wallets, NFTs, DeFi) is machinery built around that single sentence.

---

## Core Mechanics at a Glance

<BlockchainCoreDiagram />

---

## Two Learning Paths

### 🌱 New Learner Path (start here)

| Step | Page | You will be able to... |
|---|---|---|
| 1 | [What Is a Blockchain?](./fundamentals/what-is-blockchain.md) | Explain blocks, hashes, nodes, wallets and why anyone cares |
| 2 | [Cryptography Primitives](./fundamentals/cryptography-primitives.md) | Understand hashing, digital signatures and Merkle trees |
| 3 | [Ledger Models](./fundamentals/ledger-models.md) | Compare UTXO vs account ledgers and a normal database ledger |
| 4 | [Consensus Mechanisms](./consensus/consensus-mechanisms.md) | Explain PoW, PoS, BFT and finality |
| 5 | [Web3 Architecture](./web3/web3-architecture.md) | Connect a wallet to a dApp and read/write the chain |
| 6 | [IPFS & Decentralized Storage](./storage/ipfs-decentralized-storage.md) | Know why NFTs and dApps keep files off-chain |

### 🏛️ Senior Engineer Path

| Step | Page | Focus |
|---|---|---|
| 1 | [Bitcoin Internals](./platforms/bitcoin-internals.md) | UTXO set, script, mempool, difficulty, reorgs |
| 2 | [Ethereum & the EVM](./platforms/ethereum-evm.md) | State trie, gas, opcodes, storage layout, EIP-1559, EIP-4844 |
| 3 | [Smart Contract Security](./smart-contracts/smart-contract-security.md) | Reentrancy, oracle manipulation, upgrade proxies, access control |
| 4 | [Sharding, Rollups & Scaling](./scaling/sharding-rollups-scaling.md) | Trilemma, data availability, ZK vs optimistic, cross-shard atomicity |
| 5 | [DeFi, AMMs & MEV](./defi/defi-amm-mev.md) | Constant-product math, flash loans, sandwich attacks |
| 6 | [Permissioned Ledgers](./enterprise/permissioned-ledgers.md) | Fabric, Corda, when a database is the right answer |
| 7 | [Production Engineering](./production/blockchain-production-engineering.md) | Reorg handling, nonce management, key custody, idempotency, indexers |
| 8 | [Interview Questions](./interview/blockchain-interview-questions.md) | Junior to staff-level Q&A |

---

## Mental Model: Where Blockchain Sits

```
Application layer   dApps, wallets, NFTs marketplaces, DAOs           (Web3)
Execution layer     EVM / WASM / Move VM, smart contracts, rollups
Settlement layer    L1 state transition + finality
Consensus layer     PoW / PoS / BFT agreement on block order
Data availability   Block bodies, blobs, IPFS / Arweave / Celestia
Network layer       Gossip (libp2p / devp2p), peer discovery (Kademlia)
Crypto layer        Hashes, ECDSA / EdDSA / BLS, ZK proofs
```

---

## The Blockchain Trilemma (and why it is really a trade-off matrix)

| Property | Meaning | Typical cost |
|---|---|---|
| **Decentralization** | Anyone can run a validating node on commodity hardware | Low throughput, high latency |
| **Security** | Cost to rewrite history exceeds attacker gain | Redundant computation across all nodes |
| **Scalability** | Transactions per second grows with demand | Larger blocks or fewer verifiers |

You can optimize two; the third degrades. Solana picks throughput with heavier hardware requirements; Bitcoin picks decentralization/security with ~7 TPS; Ethereum + rollups tries to push execution off L1 while keeping L1 verification cheap.

---

## When NOT to Use a Blockchain

A blockchain is an expensive, slow, append-only database. Use it only when **all** are true:

1. Multiple writers who **do not trust** each other.
2. No acceptable trusted intermediary (or its fee/risk is unacceptable).
3. You need a **shared, tamper-evident history** that outlives any participant.
4. Throughput and latency needs are modest relative to the guarantees.

Otherwise PostgreSQL + audit log + signatures is cheaper, faster and GDPR-friendly (you cannot delete from a chain).
