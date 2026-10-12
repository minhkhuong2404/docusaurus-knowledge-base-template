---
id: ethereum-evm
title: Ethereum & the EVM - State, Gas, Storage, and Upgrades
sidebar_label: Ethereum & the EVM
description: Senior-level Ethereum internals - account state trie, EVM stack machine, opcodes and gas, storage layout, calldata, EIP-1559 fee market, EIP-4844 blobs, execution vs consensus clients, and transaction lifecycle.
tags:
  - technical-knowledge
  - blockchain
  - ethereum
  - evm
---

# Ethereum & the EVM

Ethereum is a **transaction-based state machine**: `state' = STF(state, tx)`. The *Ethereum Virtual Machine* is the deterministic runtime that every node uses to apply a transaction.

## Architecture After The Merge

```
┌──────────────────────┐   Engine API (JWT-auth RPC)   ┌──────────────────────┐
│  Consensus client    │ <---------------------------> │  Execution client    │
│  Prysm / Lighthouse  │   newPayload / forkchoiceUpd  │  Geth / Nethermind   │
│  Teku / Nimbus       │                                │  Besu / Reth         │
│  - fork choice, FFG  │                                │  - EVM, state, mempool│
│  - validators, p2p   │                                │  - JSON-RPC for dApps │
└──────────────────────┘                                └──────────────────────┘
```

Client diversity matters: a bug in a client with > 2/3 share could finalise an invalid chain; > 1/3 share could stall finality.

## Accounts & World State

```
account = { nonce, balance, storageRoot, codeHash }
worldState = MerklePatriciaTrie( keccak256(address) -> rlp(account) )
```

Each contract has its own **storage trie** (`slot -> 32-byte word`). Block header commits to `stateRoot`. Archive nodes keep all historical states (~15+ TB); full nodes keep recent ones (~1 TB); light/stateless approaches are in progress (Verkle, EIP-4444 history expiry).

## Transaction Lifecycle

| Stage | What happens |
|---|---|
| 1. Sign | Type-2 tx: `chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList` -> ECDSA signature |
| 2. Gossip | Sent via `eth_sendRawTransaction`; propagates; sits in mempool (txpool) keyed by (sender, nonce) |
| 3. Build | Block builder (often MEV-Boost relay/builder) orders txs to maximise value |
| 4. Propose | Validator proposes the builder's block for the slot (PBS) |
| 5. Execute | Each node runs the EVM, computes `receiptsRoot` and `stateRoot`, verifies against header |
| 6. Attest/Finalize | Committees attest; checkpoint finalises (~13 min) |

## The EVM: Stack Machine

- 256-bit words, **stack** (1024 items max), **memory** (byte-addressable, volatile, quadratic expansion cost), **storage** (persistent), **calldata** (read-only input), **transient storage** (`TSTORE`/`TLOAD`, EIP-1153, cleared per tx), and return data.
- Deterministic: no floats, no wall-clock randomness, no network I/O.

### Gas Cost Landmarks (post-Berlin/Cancun)

| Operation | Approx gas | Why it matters |
|---|---|---|
| `ADD`, `MUL`, stack ops | 3-5 | Cheap compute |
| `KECCAK256` | 30 + 6/word | Mapping key hashing |
| `SLOAD` cold / warm | 2100 / 100 | **Access lists (EIP-2929)**: first touch is expensive |
| `SSTORE` 0 -> nonzero | 20,000 (+ cold 2100) | Storage is the dominant cost |
| `SSTORE` nonzero -> nonzero | 2,900 (+ cold) | Pack variables to reduce slots |
| Refund (clear slot) | up to 20% of tx gas (EIP-3529) | Gas-token tricks died |
| `CALL` w/ value | 9,000 (+ 25,000 new account) | External calls are costly + risky |
| `LOG` n topics | 375 + 375n + 8/byte | Events are cheaper than storage for off-chain consumers |
| Calldata | 16 per non-zero byte, 4 per zero byte | Drives L2 data cost, blob rationale |
| Tx base | 21,000 | Floor for any tx |

### Storage Layout (Solidity)

```solidity
contract Packed {
    uint128 a;       // slot 0 (low 16 bytes)
    uint128 b;       // slot 0 (high 16 bytes)  -> packed with a, 1 SSTORE for both
    uint256 c;       // slot 1
    mapping(address => uint256) bal;   // slot 2; element at keccak256(abi.encode(key, 2))
    uint256[] arr;   // slot 3 holds length; data at keccak256(3) + index
}
```

Understanding layout is essential for **proxy upgrades** (storage collisions) and for reading private-looking state: `private` only hides from other contracts, not from `eth_getStorageAt`.

## Fee Market: EIP-1559

```
baseFee      : protocol-set, adjusts +-12.5% per block toward 50% full (target 15M gas, max 30M)
priorityFee  : tip to block producer
paid per gas = min(maxFeePerGas, baseFee + maxPriorityFeePerGas)
baseFee portion is BURNED  ->  ETH can become deflationary under load
```

Benefits: predictable fees, no first-price auction guessing. Set `maxFeePerGas ~ 2 x baseFee + tip` to survive several consecutive full blocks.

## Data Availability: EIP-4844 (Proto-Danksharding)

Type-3 transactions carry **blobs** (128 KiB each, target 3, max 6 per block at launch; increasing with Pectra/PeerDAS). Blobs are committed via KZG commitments, stored by consensus nodes for ~18 days, **not accessible by the EVM** (only the `BLOBHASH`), and priced by a *separate* blob base-fee market. They cut rollup data costs by an order of magnitude. See [Sharding & Rollups](../scaling/sharding-rollups-scaling.md).

## Account Abstraction (ERC-4337 & EIP-7702)

EOAs only sign ECDSA. ERC-4337 adds **smart accounts**: `UserOperation` objects go to an alt-mempool, bundlers submit them to the singleton `EntryPoint`, and the account's `validateUserOp` defines authentication (passkeys, multisig, session keys), with **paymasters** sponsoring gas. EIP-7702 lets an EOA temporarily delegate to contract code.

## Token Standards

| Standard | Purpose | Key functions |
|---|---|---|
| ERC-20 | Fungible tokens | `transfer`, `approve`, `transferFrom`, `allowance` |
| ERC-721 | NFT | `ownerOf`, `safeTransferFrom` (calls `onERC721Received`) |
| ERC-1155 | Multi-token (fungible + NFT) | batch transfers |
| ERC-2612 | Gasless approval (permit) | EIP-712 signature |
| ERC-4626 | Tokenised vault | `deposit`, `redeem`, share/asset conversion |

> **Gotchas:** non-standard ERC-20s (USDT does not return `bool`) require `SafeERC20`; fee-on-transfer and rebasing tokens break AMM/vault accounting; the infamous *approve race* is mitigated with `increaseAllowance` / permit; infinite approvals are a phishing risk.

## Execution Client RPC Cheat Sheet

| Method | Purpose |
|---|---|
| `eth_blockNumber`, `eth_getBlockByNumber("finalized")` | Chain head / finalized block |
| `eth_call` | Read-only EVM execution at a block |
| `eth_estimateGas` | Binary-search gas (can under-estimate with refund/63/64 rule) |
| `eth_getLogs` | Event query (range-limited by providers) |
| `eth_getTransactionReceipt` | `status`, `gasUsed`, logs - pending returns `null` |
| `eth_feeHistory` | Percentile priority fees for fee estimation |
| `debug_traceTransaction` / `trace_*` | Opcode / call traces for forensics |

## Senior Gotchas

1. **63/64 rule:** a `CALL` forwards at most 63/64 of remaining gas - affects griefing and gas-estimation in relayers.
2. **`block.timestamp` / `prevrandao`:** proposers can bias slightly; never use as sole randomness (use VRF like Chainlink VRF).
3. **`tx.origin` auth** is phishable; use `msg.sender`.
4. **Reorgs on L1** are rare post-Merge but 1-2 slot reorgs occur; wait for `safe`/`finalized` for value.
5. **Contract size limit 24,576 B (EIP-170)** and initcode limit 49,152 B (EIP-3860) drive diamond/proxy architectures.
6. **Selfdestruct** semantics largely removed (EIP-6780): do not rely on it for upgrade/cleanup.

Next: [Smart Contract Security](../smart-contracts/smart-contract-security.md).
