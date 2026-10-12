---
id: ledger-models
title: Ledger Models - UTXO, Account, and Traditional Ledgers
sidebar_label: Ledger Models
description: Deep dive into distributed ledger design - UTXO vs account model, state commitments, double-entry bookkeeping vs blockchain, event sourcing parallels, finality, and ledger design trade-offs.
tags:
  - technical-knowledge
  - blockchain
  - ledger
---

# Ledger Models

A **ledger** is an ordered record of state changes from which balances/state can be derived. Blockchain ledgers differ from a bank's ledger in *who orders writes* and *who can verify*.

## 1. Traditional vs Distributed Ledger

| Dimension | Bank / RDBMS ledger | Distributed (blockchain) ledger |
|---|---|---|
| Write ordering | Single DB primary (WAL / sequence) | Consensus among N replicas |
| Trust | Operator + auditors | Cryptographic verification by every node |
| History | Mutable by DBA (audit trail is policy) | Append-only, hash-linked (tamper-evident) |
| Latency | ms | seconds to minutes (finality) |
| Throughput | 10k-100k+ TPS | 7 (BTC) - 15 (ETH L1) - thousands (L2/Solana) |
| Privacy | Access control | Public by default; ZK / permissioned for privacy |
| Correction | Reversal entries / DBA fix | Compensating transaction only; or social fork |

If you already operate a double-entry ledger (see [Digital Wallet design](../../system-design/problem-breakdowns/digital-wallet.md)), a blockchain is a *replicated, adversarially-verifiable* version of the same idea: **immutable journal + derived balances**. It is event sourcing where the event log is shared with strangers.

## 2. UTXO Model (Bitcoin, Cardano, Litecoin)

State = the set of **Unspent Transaction Outputs**. A transaction consumes whole outputs and creates new ones.

```
UTXO set:  { (txA:0, 5 BTC, Alice), (txB:1, 2 BTC, Alice) }

Tx C:  inputs  : txA:0 (5 BTC)  [signed by Alice]
       outputs : 3 BTC -> Bob
                 1.999 BTC -> Alice (change)
       fee     : 0.001 BTC   (inputs - outputs, implicit)

UTXO set after: { (txB:1, 2), (txC:0, 3, Bob), (txC:1, 1.999, Alice) }
```

**Strengths:** parallel validation (independent outputs), simple replay protection (each output spent once), better privacy via fresh addresses, easy light-client proofs.
**Weaknesses:** awkward for stateful logic, change-output management, UTXO set growth (the *UTXO set* must be in fast storage; Bitcoin Core `chainstate` on LevelDB ~ 10 GB+), coin-selection complexity.

**Validation (per input):** output exists and unspent -> script `scriptSig + scriptPubKey` evaluates true -> sum(inputs) >= sum(outputs) -> no double spend in mempool/block.

## 3. Account Model (Ethereum, Solana, most smart-contract chains)

State = a map `address -> {balance, nonce, codeHash, storageRoot}`.

| Account type | Controlled by | Has code | Nonce counts |
|---|---|---|---|
| **EOA** (externally owned) | Private key | No | Transactions sent |
| **Contract** | Its code | Yes | Contracts created |

```
Tx: { from: Alice, to: Bob, value: 3 ETH, nonce: 7 }
Rule: nonce must equal account.nonce (7) -> then nonce becomes 8
```

The **nonce** gives ordering and replay protection per account. **Strengths:** natural for smart contracts and balances. **Weaknesses:** transactions on the same account are sequential (hard to parallelise; Solana declares read/write sets to schedule in parallel), global state bloat, front-running because contract state is globally shared.

## 4. Side-by-Side

| | UTXO | Account |
|---|---|---|
| State | Set of coins | Map of balances + storage |
| Double-spend defence | Output already spent | Nonce + balance check |
| Parallelism | High (disjoint inputs) | Low unless access lists (Solana, EIP-2930) |
| Smart contracts | Limited (Script, eUTXO datums/redeemers) | Rich (EVM, SVM) |
| Privacy | Better by default | Address reuse is the norm |
| Typical failure | Dust, fee estimation on large input counts | Stuck nonce, MEV, state bloat |

## 5. State Commitment & Light Clients

Each block header commits to the state via a root hash.

- Bitcoin header: `prevHash, merkleRoot(txs), time, bits, nonce`.
- Ethereum header: `parentHash, stateRoot, transactionsRoot, receiptsRoot, logsBloom, baseFeePerGas, ...`.

A light client downloads only headers (~500 bytes each) and verifies Merkle / Patricia proofs for specific data: **trust the consensus, verify the data**.

## 6. Finality Types

| Type | Meaning | Examples |
|---|---|---|
| **Probabilistic** | Reversal probability decays exponentially with depth | Bitcoin (6 confirmations ~ 1 h), Ethereum PoW |
| **Deterministic / economic** | Once finalised, reversal requires slashing >= 1/3 stake | Ethereum Casper FFG (~13 min, 2 epochs), Tendermint (1 block) |
| **Soft (L2)** | Sequencer promises; reversible until L1 posting/proof | Optimistic/ZK rollups |

Exchanges and bridges must wait for the finality type that matches their risk; crediting at 1 confirmation has caused real double-spend losses on small PoW chains (51% attacks on ETC, BTG).

## 7. Designing a Ledger-Backed Service (Senior view)

1. **Idempotency:** a transaction hash is a natural idempotency key. Store `(chainId, txHash)` as a unique key before crediting a user.
2. **Reorg safety:** treat blocks as *provisional*; credit at `confirmations >= N` (or `finalized` tag) and keep a rollback path for derived DB rows.
3. **Reconciliation:** periodically compare off-chain ledger sums against on-chain balances (`eth_getBalance` at a fixed block).
4. **Double-entry internally:** even when the chain is the source of truth, model your internal movements as debit/credit pairs so totals are provably conserved.
5. **Do not store PII on chain.** Right-to-erasure (GDPR Art. 17) is incompatible with immutable storage; keep hashes/commitments on chain and data off chain.

Next: [Consensus Mechanisms](../consensus/consensus-mechanisms.md).
