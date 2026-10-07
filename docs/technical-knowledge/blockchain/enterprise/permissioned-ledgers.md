---
id: permissioned-ledgers
title: Permissioned Ledgers - Hyperledger Fabric, Corda, Besu
sidebar_label: Permissioned Ledgers
description: Enterprise blockchain - when to use a permissioned ledger vs a database, Hyperledger Fabric execute-order-validate, channels and private data, Corda UTXO and notaries, Besu, decision framework, and production concerns.
tags:
  - technical-knowledge
  - blockchain
  - enterprise
  - hyperledger
---

# Permissioned Ledgers (Enterprise Blockchain)

Participants are **identified and admitted** (via PKI / MSP). That removes Sybil attacks, so you can use cheap **crash-fault or BFT consensus** (Raft, SmartBFT) and get high TPS, privacy and governance - at the cost of "public trustlessness".

## Do You Need One? (Decision Framework)

```
Do multiple organisations write to shared data?              No  -> Use a normal database
Do they distrust each other / no neutral operator?           No  -> Shared DB / API owned by the operator
Do you need tamper-evident history auditable by all?         No  -> Append-only DB + signed logs
Can't one party host the system acceptably (regulation)?     Yes -> Permissioned ledger (consortium)
Need public verifiability / censorship-resistance for all?   Yes -> Public chain (or public L2)
```

Many "enterprise blockchain" pilots failed because a **signed, replicated database** met the need. Honest framing: you are buying *shared write governance*, not magic trust.

## Hyperledger Fabric: Execute-Order-Validate

Traditional "order-execute" (Ethereum) forces every node to run every contract deterministically. Fabric splits the work:

```
Client app
  1. Propose tx  ---------------->  Endorsing peers (per policy, e.g. 2-of-3 orgs)
                                     simulate chaincode against current world state,
                                     return signed read-write set
  2. Collect endorsements  <-------
  3. Submit to Ordering Service (Raft)   -> orders tx into blocks (no execution, no content visibility)
  4. Ordered blocks delivered to all peers
  5. Each peer VALIDATES: endorsement policy satisfied? read-set versions still current (MVCC)?
        -> valid: apply write-set to state DB (LevelDB/CouchDB); invalid: marked invalid but kept in the block
```

| Concept | Meaning |
|---|---|
| **Channel** | Separate ledger shared by a subset of orgs (data isolation) |
| **Private Data Collection** | Hashed on channel ledger, plaintext stored only on authorised peers' side DB |
| **Endorsement policy** | Boolean expression on org signatures, e.g. `AND('Org1.peer', OR('Org2.peer', 'Org3.peer'))` |
| **MSP** | Membership Service Provider - X.509 identities per org (Fabric CA) |
| **Chaincode** | Smart contract in Go/Java/JS; no gas, runs in a container |
| **MVCC conflict** | Two txs read the same key version; the second fails validation -> **retry** in client |

**Gotchas:** non-deterministic chaincode (maps iteration, timestamps, random) yields endorsement mismatches; hot keys cause MVCC conflicts - design keys so concurrent updates touch different keys (e.g. UTXO-style per-transfer keys instead of a single balance row); ordering-service availability is critical.

## R3 Corda

- **UTXO-like states** + **notaries** to prevent double spends; **point-to-point** flows (no global broadcast) so only parties to a deal see it.
- Contracts are JVM code verifying transaction structure; flows orchestrate off-ledger negotiation.
- Strong fit for financial agreements (loans, trade finance); notary clusters use Raft/BFT.

## Hyperledger Besu / Quorum (Enterprise EVM)

Run EVM contracts on permissioned networks with **IBFT 2.0 / QBFT** consensus (instant finality), privacy groups (Tessera), and can be anchored to Ethereum mainnet. Easier to reuse Solidity tooling and audit practices.

## Comparison

| | Fabric | Corda | Besu (QBFT) | Public Ethereum |
|---|---|---|---|---|
| Identity | MSP/PKI | Doorman/PKI | Permissioning contracts | Pseudonymous |
| Consensus | Raft / SmartBFT | Notary (Raft/BFT) | QBFT | PoS (Gasper) |
| Privacy | Channels, PDC | Need-to-know flows | Privacy groups | Public (ZK optional) |
| Language | Go/Java/JS | Kotlin/Java | Solidity | Solidity/Vyper |
| Finality | Immediate | Immediate | Immediate | ~13 min |
| TPS (typical) | 1k-20k | 100s-1k | 100s-1k | 15 (+L2s) |

## Production Concerns

- **Governance:** onboarding/offboarding orgs, chaincode upgrade approval, key rotation.
- **Ops:** each org runs its own peers; backup the ledger + state DB + MSP keys; monitor block height lag and ordering latency.
- **Integration:** use the **transactional outbox** pattern to publish ledger events to Kafka (see [Kafka](../../kafka/intro.md)); make external calls idempotent keyed by tx ID.
- **Data protection:** store PII off-ledger; keep only hashes/consent receipts on ledger (GDPR erasure).
- **Interop:** anchor checkpoints to a public chain for third-party verifiability, or bridge via notarised messages.

Next: [DeFi, AMMs & MEV](../defi/defi-amm-mev.md).
