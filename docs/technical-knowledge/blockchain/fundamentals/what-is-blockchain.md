---
id: what-is-blockchain
title: What Is a Blockchain? (Beginner Guide)
sidebar_label: What Is a Blockchain?
description: Beginner-friendly but technically accurate explanation of blocks, hashes, nodes, wallets, transactions, mining, smart contracts, and the difference between blockchain, crypto, and Web3.
tags:
  - technical-knowledge
  - blockchain
  - fundamentals
---

import BlockchainCoreDiagram from '@site/src/components/BlockchainCoreDiagram';

# What Is a Blockchain?

## The One-Paragraph Version

A blockchain is a shared notebook that thousands of computers keep identical copies of. New pages (**blocks**) are only added when the network agrees on them, each page carries a fingerprint (**hash**) of the previous page, so nobody can quietly edit old pages. No single company owns the notebook.

## Core Vocabulary

| Term | Plain meaning | Technical meaning |
|---|---|---|
| **Transaction** | "Alice pays Bob 1 coin" | A signed message that requests a state change |
| **Block** | A page of transactions | Header (prev hash, Merkle root, timestamp, nonce) + body |
| **Hash** | Digital fingerprint | Fixed-size output of a one-way function (SHA-256, Keccak-256) |
| **Node** | A computer running the software | Stores chain, validates blocks, gossips with peers |
| **Miner / Validator** | Who proposes new blocks | Spends work (PoW) or stake (PoS) for the right to propose |
| **Wallet** | App holding your "money" | Holds a **private key**; the chain only knows signatures |
| **Address** | Account number | Hash of a public key (Ethereum: last 20 bytes of `keccak256(pubkey)`) |
| **Gas / Fee** | Cost to use the network | Price of computation + storage, paid to block producers |
| **Smart contract** | Program on the chain | Deterministic bytecode executed by every node |
| **Fork** | Disagreement / split | Two valid blocks at the same height (temporary) or a rule change (hard/soft fork) |

## How One Transaction Travels

<BlockchainCoreDiagram initialTab="chain" />

1. **Create & sign** - your wallet builds `{to, value, nonce, gasPrice}` and signs it with your private key (ECDSA secp256k1).
2. **Broadcast** - sent to a node, which gossips it to peers; it waits in the **mempool**.
3. **Select** - a block producer picks transactions (usually highest fee first).
4. **Execute & validate** - every node re-runs the transaction; invalid ones are rejected (bad signature, insufficient balance, wrong nonce).
5. **Agree** - consensus decides which block becomes canonical.
6. **Finalize** - after enough confirmations the block is practically irreversible.

## Blockchain vs Crypto vs Web3

| Concept | What it is |
|---|---|
| **Blockchain** | The data structure + replication protocol |
| **Cryptocurrency** | A token whose ledger lives on a blockchain (BTC, ETH) |
| **Smart contract platform** | A blockchain with a general-purpose VM (Ethereum, Solana, Avalanche) |
| **Web3** | Applications where users own identity/assets via wallets, backed by chains + decentralized storage |
| **DeFi / NFT / DAO** | Application categories built on smart contracts |

## Types of Blockchains

| Type | Who can read | Who can write/validate | Examples | Use case |
|---|---|---|---|---|
| Public permissionless | Anyone | Anyone | Bitcoin, Ethereum | Open finance, assets |
| Public permissioned | Anyone | Approved validators | Some L1s, Polygon Edge setups | Regulated public rails |
| Private / consortium | Members | Members | Hyperledger Fabric, Corda | Supply chain, interbank settlement |

## Common Beginner Misconceptions

- **"Blockchain is anonymous."** It is **pseudonymous**. Every transaction is public forever; chain analysis links addresses to identities.
- **"Data on chain is secret."** Public chains are transparent. Never put personal data on chain.
- **"Immutable means can't be wrong."** Immutable means can't be *changed*; a buggy contract stays buggy (see The DAO hack).
- **"Blockchain = Bitcoin."** Bitcoin is one application of the idea.
- **"Losing the key can be fixed by support."** No one can reset a private key. Self-custody means self-responsibility.

## Hands-On: Read the Chain

```bash
# Latest block number on a public Ethereum JSON-RPC endpoint
curl -s -X POST https://cloudflare-eth.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
# {"jsonrpc":"2.0","id":1,"result":"0x1312d00"}   (hex = block height)
```

## Check Your Understanding

1. Why does editing an old block invalidate all newer blocks?
2. What is the difference between an address and a private key?
3. Why can two honest miners temporarily produce different blocks at the same height?

Next: [Cryptography Primitives](./cryptography-primitives.md).
