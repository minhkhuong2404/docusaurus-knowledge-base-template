---
id: smart-contract-security
title: Smart Contract Security & Design Patterns
sidebar_label: Smart Contract Security
description: Solidity security for senior engineers - reentrancy, checks-effects-interactions, oracle manipulation, access control, upgradeable proxies, signature replay, integer handling, invariants and fuzzing, and audit workflow.
tags:
  - technical-knowledge
  - blockchain
  - smart-contracts
  - security
---

# Smart Contract Security & Design Patterns

Smart contracts are **immutable, public, adversarially-called programs holding money**. Bugs are exploited within blocks, often by bots, and cannot be hot-patched. Losses exceed $10B cumulatively (Ronin, Poly Network, Wormhole, The DAO, Euler, Nomad).

## Hello Contract (Beginner)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Counter {
    uint256 public count;                 // auto-generated getter
    event Incremented(address indexed by, uint256 newCount);

    function increment() external {
        unchecked { count += 1; }         // safe: cannot realistically overflow uint256
        emit Incremented(msg.sender, count);
    }
}
```

Solidity >= 0.8 reverts on arithmetic overflow by default; `unchecked` opts out for gas.

## 1. Reentrancy

An external call hands control to attacker code which re-enters before state is updated.

```solidity
// VULNERABLE
function withdraw() external {
    uint256 amt = balances[msg.sender];
    (bool ok, ) = msg.sender.call{value: amt}("");   // attacker's receive() re-enters here
    require(ok, "send failed");
    balances[msg.sender] = 0;                         // too late
}
```

**Fixes (layer them):**

```solidity
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function withdraw() external nonReentrant {
        uint256 amt = balances[msg.sender];
        balances[msg.sender] = 0;                     // EFFECTS before INTERACTIONS
        (bool ok, ) = msg.sender.call{value: amt}("");
        require(ok, "send failed");
    }
}
```

- **Checks-Effects-Interactions** ordering.
- `nonReentrant` mutex (EIP-1153 transient-storage version is cheaper).
- **Cross-function** and **cross-contract** and **read-only reentrancy** (a view function read mid-update by another protocol - Curve/Balancer incidents) are not fixed by a single-function guard.
- Pull-over-push payments: let users withdraw instead of looping `call`.

## 2. Access Control & Initialisation

| Bug | Example | Fix |
|---|---|---|
| Missing modifier | `function setOwner()` public | `onlyOwner` / `AccessControl` roles |
| Uninitialised proxy | Implementation left uninitialised, attacker calls `initialize` and `selfdestruct`/delegatecalls (Parity wallet 2017 froze ~$150M) | `_disableInitializers()` in constructor |
| `tx.origin` | Phishing contract relays user tx | Use `msg.sender` |
| Single EOA admin | Key compromise (Ronin: 5 of 9 validators) | Multisig + timelock + role separation |

## 3. Oracle & Price Manipulation

Using a **spot price** from a low-liquidity pool as truth is exploitable with a **flash loan** (borrow, skew pool, call victim, restore, repay - one transaction).

| Defence | Detail |
|---|---|
| TWAP (Uniswap v3 oracle) | Time-weighted over >= 30 min; costs capital over multiple blocks |
| Chainlink feeds | Check `updatedAt` staleness, `answeredInRound`, min/max bounds, sequencer-uptime feed on L2 |
| Multiple sources + deviation circuit breaker | Pause on > X% divergence |
| Don't price LP tokens naively | Use fair-value formulas (`sqrt(x*y)` based) |

## 4. Signatures & Replay

- Use **EIP-712** typed data including `chainId`, `verifyingContract`, `nonce`, `deadline`.
- Track used nonces/hashes; reject malleable `s` (use OpenZeppelin `ECDSA`).
- Beware `ecrecover` returning `address(0)`.
- ERC-1271 for contract-wallet signature validation.

## 5. Upgradeable Proxies

```
User -> Proxy (storage lives here) --delegatecall--> Implementation (logic only)
```

| Pattern | Notes |
|---|---|
| **Transparent proxy** | Admin calls go to proxy; others delegated. Extra gas per call (admin check) |
| **UUPS (ERC-1822)** | Upgrade logic in implementation (`_authorizeUpgrade`); cheaper; bricked if you upgrade to an implementation lacking upgrade function |
| **Beacon** | Many proxies share one implementation address |
| **Diamond (EIP-2535)** | Multiple facets; escapes 24 KB limit; complex |

**Rules:** never reorder or change types of existing storage variables; append only; use ERC-7201 namespaced storage or `__gap`; never `selfdestruct`/`delegatecall` to untrusted code from an implementation; put upgrades behind **timelock + multisig**; consider *immutability* for the core and upgradeability only where truly needed.

## 6. Other Classic Vulnerabilities

| Vulnerability | Description | Mitigation |
|---|---|---|
| **Front-running / sandwich** | Mempool-visible txs reordered by bots | Slippage limits, private RPC (Flashbots Protect), commit-reveal, batch auctions |
| **Unchecked low-level call** | Ignoring `call` return value | Check `ok`, use `SafeERC20` |
| **DoS by revert / gas griefing** | Looping over unbounded array; one failing receiver blocks all | Pull payments, pagination |
| **Rounding / precision** | Share inflation attack on ERC-4626 first deposit | Virtual shares/offset, dead shares minted at deploy |
| **Delegatecall to user input** | Executes arbitrary code in your storage context | Whitelist targets |
| **Timestamp dependence** | Validator drift ~ seconds | Don't use for fine-grained logic |
| **Flash-loan governance attack** | Borrow voting power in one tx (Beanstalk $182M) | Snapshot-based voting (`getPastVotes`), timelock |
| **Bridge key / verification flaws** | Forged messages, compromised validators | Light-client verification, rate limits, multi-proof |

## 7. Secure Development Workflow

```
Spec & invariants  ->  Foundry unit tests  ->  Fuzz + invariant tests  ->  Static analysis (Slither)
   ->  Formal verification (Certora/Halmos) for critical math  ->  2+ independent audits
   ->  Bug bounty (Immunefi)  ->  Staged rollout with TVL caps  ->  Monitoring + pause guardian
```

```solidity
// Foundry invariant test: total supply always equals sum of balances
function invariant_supplyEqualsBalances() public view {
    assertEq(token.totalSupply(), handler.ghostSumOfBalances());
}
```

Design for failure: **circuit breakers** (pausable, with narrow scope), **rate limits** on withdrawals, **TVL caps**, and on-chain/off-chain **monitoring** (Forta, OpenZeppelin Defender, Tenderly alerts).

## Senior Review Checklist

- [ ] Every external call is last, or guarded, and its result handled
- [ ] No spot-price oracles; staleness and bounds validated
- [ ] Admin powers minimised, behind timelock/multisig, events emitted on change
- [ ] Storage layout checked with `forge inspect ... storage-layout` across upgrades
- [ ] ERC-20 integrations tolerate fee-on-transfer, no-return tokens, and 6/8/18 decimals
- [ ] Invariants written and fuzzed; coverage of failure branches
- [ ] Emergency response runbook: who can pause, who signs, how users are notified

Next: [Web3 Architecture](../web3/web3-architecture.md).
