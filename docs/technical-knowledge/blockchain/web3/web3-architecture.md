---
id: web3-architecture
title: Web3 Architecture - Wallets, RPC, Indexers, and dApps
sidebar_label: Web3 Architecture
description: How a Web3 dApp really works - wallets and key custody, JSON-RPC providers, ABI encoding, events and indexers (The Graph), ENS, SIWE login, gas sponsorship, and a Java web3j example.
tags:
  - technical-knowledge
  - blockchain
  - web3
---

# Web3 Architecture

Web2: `Browser -> API server -> database`. Web3 swaps some of those boxes for chain + wallet + decentralized storage, but **real products are hybrid**: most latency-sensitive and private data still sit in conventional services.

```
┌─────────┐  1. connect / sign      ┌──────────────┐
│ Browser │ <---------------------> │ Wallet       │  MetaMask, Rabby, Ledger, Safe, passkey smart account
│ (dApp   │                         │ (holds keys) │
│  UI)    │  2. read / write        └──────────────┘
│         │ --------------------->  ┌──────────────┐   JSON-RPC    ┌─────────────┐
│ ethers/ │                         │ RPC Provider │ ------------> │ Full node   │ (Geth+Prysm)
│ viem    │                         │ Alchemy/Infura│              └─────────────┘
│         │  3. indexed queries     └──────────────┘
│         │ --------------------->  ┌──────────────┐  reads logs   ┌─────────────┐
│         │  GraphQL/SQL            │ Indexer      │ <------------ │ Chain events│
│         │                         │ Graph/Ponder │               └─────────────┘
│         │  4. files               ┌──────────────┐
│         │ --------------------->  │ IPFS/Arweave │  CID content addressing
└─────────┘                         └──────────────┘
```

## 1. Wallets & Key Custody

| Wallet type | Keys held by | Recovery | Trade-off |
|---|---|---|---|
| **EOA software** (MetaMask) | User device (encrypted keystore) | 12/24-word seed | Simple, phishing-prone, single point of failure |
| **Hardware** (Ledger, Trezor) | Secure element | Seed backup | Strong vs malware; blind-signing risk |
| **Multisig** (Safe) | m-of-n owners (contract) | Owner rotation | Team treasuries; gas overhead |
| **Smart account** (ERC-4337) | Passkey / social / session keys | Guardians, modules | UX (gasless, batching); contract risk |
| **MPC wallet** | Key shares across parties; no full key ever assembled | Share refresh | Custodians; no on-chain visibility of policy |
| **Custodial** (exchange) | Third party | Account recovery | Not "Web3" ownership; counterparty risk |

**Rules of thumb:** treat the seed phrase like a root password; never type it into a website; verify what you sign (EIP-712 human-readable payloads, transaction simulation); revoke stale token approvals.

## 2. Reading vs Writing

| Action | Mechanism | Cost | Needs wallet |
|---|---|---|---|
| **Read** state (`balanceOf`) | `eth_call` against a node | Free | No |
| **Write** (transfer, swap) | Signed transaction -> mempool -> block | Gas | Yes (signature) |
| **Subscribe** to events | `eth_subscribe` (WebSocket) / `eth_getLogs` polling | Free | No |
| **Off-chain sign** (login, order) | EIP-191/712 signature | Free | Yes |

### ABI Encoding

A function call is `selector(4 B) || abi.encode(args...)` where `selector = first 4 bytes of keccak256("transfer(address,uint256)")` = `0xa9059cbb`. Events: `topic0 = keccak256("Transfer(address,address,uint256)")`; `indexed` params become topics (filterable), others live in `data`.

## 3. Sign-In With Ethereum (SIWE, EIP-4361)

Passwordless auth where the wallet signs a server-issued challenge.

```
1. GET  /nonce                   -> server returns random nonce (single-use, expires in 5 min)
2. Wallet signs SIWE message     -> "app.example.com wants you to sign in with your Ethereum account:
                                     0xAbc... Nonce: 8hf3k2  Issued At: ... Chain ID: 1"
3. POST /verify {message, sig}   -> server recovers signer, checks domain, nonce, expiry
4. Issue session JWT / cookie    -> standard Web2 session from here on
```

Gotchas: bind to `domain` and `nonce` (phishing + replay), support **ERC-1271** for smart-contract wallets, expire nonces server-side.

## 4. Indexing: Why You Cannot Query the Chain Like a DB

Nodes are optimised for state transitions, not analytics: no joins, `eth_getLogs` is range-limited, historical state is expensive. Production dApps run an **indexer**:

```
Chain -> ingest blocks/logs (reorg-aware) -> decode via ABI -> relational/graph store -> GraphQL / REST
```

| Option | Notes |
|---|---|
| The Graph (subgraphs) | Hosted/decentralized; GraphQL; AssemblyScript mappings |
| Ponder / Envio / Subsquid | TypeScript-first, SQL, fast re-sync |
| Custom (Kafka + Postgres) | Full control; see [Kafka](../../kafka/intro.md) for the ingestion backbone |

**Reorg handling is mandatory:** store `(blockNumber, blockHash)` for each row; on parent-hash mismatch, delete rows above the common ancestor and replay.

## 5. ENS & Identity

Ethereum Name Service maps `alice.eth` -> address (and text records, content hash for IPFS websites). Resolution: `namehash` -> registry -> resolver -> `addr()`. Always validate the forward and reverse records match before showing a name as an identity. Other identity primitives: **DIDs/Verifiable Credentials**, **EAS attestations**, **Proof-of-Humanity** systems.

## 6. Gas UX Patterns

| Pattern | How |
|---|---|
| **Meta-transactions** (ERC-2771) | User signs; relayer pays gas and forwards |
| **Paymasters** (ERC-4337) | Sponsor or accept ERC-20 for gas |
| **Batching** | Multicall / smart-account batch: approve + swap in one tx |
| **L2s** | Sub-cent fees (Base, Arbitrum, Optimism, zkSync) |

## 7. Java Example with web3j

```java
// build.gradle: implementation 'org.web3j:core:4.12.2'
import java.math.BigDecimal;
import java.math.BigInteger;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Convert;

public final class EthReader {
    public static void main(String[] args) throws Exception {
        Web3j web3 = Web3j.build(new HttpService(System.getenv("ETH_RPC_URL")));
        try {
            BigInteger head = web3.ethBlockNumber().send().getBlockNumber();
            BigInteger wei = web3.ethGetBalance(
                    "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe", DefaultBlockParameterName.FINALIZED)
                .send().getBalance();
            System.out.println("head=" + head + " balanceEth=" + Convert.fromWei(new BigDecimal(wei), Convert.Unit.ETHER));
        } finally {
            web3.shutdown();
        }
    }
}
```

> Use **`BigInteger`/`BigDecimal`** for all token amounts. Never `double`/`long` - ETH has 18 decimals (`10^18` wei) and a `uint256` overflows `long`.

## 8. Web3 Security Hygiene for Users and Teams

- **Approvals:** prefer exact-amount approvals or permit; audit with revoke tools.
- **Phishing:** drainer kits abuse `setApprovalForAll` and `permit` signatures - signatures can be as dangerous as transactions.
- **Supply chain:** pin frontend dependencies (the Ledger Connect Kit 2023 compromise), use SRI, publish frontend to IPFS with ENS contenthash for verifiability.
- **RPC trust:** a malicious RPC can lie; for high value verify with light clients / multiple providers.

Next: [IPFS & Decentralized Storage](../storage/ipfs-decentralized-storage.md).
