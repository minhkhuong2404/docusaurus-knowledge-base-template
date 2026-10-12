---
id: blockchain-production-engineering
title: Blockchain Production Engineering - Reorgs, Nonces, Keys, Indexers
sidebar_label: Production Engineering
description: Production runbook for blockchain backends - deposit detection with reorg safety, nonce management, transaction replacement, idempotency, key custody with HSM/MPC, RPC resilience, gas estimation, observability, and incident response.
tags:
  - technical-knowledge
  - blockchain
  - production
  - distributed-systems
---

# Blockchain Production Engineering

Integrating a chain into a backend means integrating an **eventually consistent, adversarial, probabilistic** external system. Most outages come from treating it like a synchronous REST API.

## 1. Mental Model: A Transaction Is a Saga Step

```
CREATED -> SIGNED -> BROADCAST -> PENDING (mempool) -> INCLUDED (1 conf)
        -> SAFE (n conf / justified) -> FINALIZED
                 \-> DROPPED / REPLACED / REORGED / REVERTED (status=0)
```

Persist every transition in your DB (state machine + outbox). The chain is the source of truth for *what happened*; your DB is the source of truth for *what you intended*.

## 2. Deposit Detection with Reorg Safety

```
poll loop (or WebSocket newHeads):
  head = eth_getBlockByNumber("latest")
  for each block n from lastProcessed+1 .. head:
      blk = getBlock(n)
      if blk.parentHash != stored[n-1].hash:     // REORG detected
           rollback derived rows with blockNumber >= commonAncestor+1
           re-scan from commonAncestor+1
      store (n, blk.hash); ingest logs idempotently
  credit user when blockNumber <= finalized (or head - N confirmations)
```

| Rule | Reason |
|---|---|
| Key every credit by `(chainId, txHash, logIndex)` with a UNIQUE constraint | Idempotency under replays/reorgs |
| Use `finalized`/`safe` tags on Ethereum rather than fixed N | Real finality semantics |
| Check `receipt.status == 1` | Reverted txs still consume gas and appear in blocks |
| Verify the **token contract address**, not just the symbol | Fake tokens named "USDT" |
| Handle internal transfers (traces) for native ETH sent via contracts | `to` on the tx is not the final recipient |
| Never trust a single RPC | Providers lag, return stale data, or fork |

## 3. Nonce Management (the #1 Outbound Failure)

Account nonces must be strictly sequential. A gap blocks all later transactions (they sit "queued").

| Problem | Symptom | Fix |
|---|---|---|
| Concurrent senders sharing one account | `nonce too low` / `replacement underpriced` | **Single-writer per account** (queue) or one account per worker |
| Tx dropped from mempool (low fee) | Nonce gap, everything stuck | Re-broadcast same nonce with higher fee (replace by fee: >= +10% on both tip and max fee) |
| Using `latest` count after pending txs | Reuses nonce | Use `eth_getTransactionCount(addr, "pending")` + local counter reconciled periodically |
| Crash between sign and broadcast | Unknown tx state | Persist signed raw tx + hash **before** broadcasting; rebroadcast on restart (idempotent: same hash) |
| Cancel stuck tx | - | Send 0 ETH to self with same nonce and higher fee |

```java
import java.math.BigInteger;
import java.util.concurrent.locks.ReentrantLock;

/** Single-writer nonce allocator; reconcile with chain on startup and after failures. */
public final class NonceManager {
    private final ReentrantLock lock = new ReentrantLock();
    private BigInteger next;

    public NonceManager(BigInteger initialPendingCount) {
        this.next = initialPendingCount;
    }

    public BigInteger allocate() {
        lock.lock();
        try {
            BigInteger n = next;
            next = next.add(BigInteger.ONE);
            return n;
        } finally {
            lock.unlock();
        }
    }

    /** Called after detecting a gap or a failed broadcast to resynchronise with the node. */
    public void reset(BigInteger pendingCountFromChain) {
        lock.lock();
        try {
            next = pendingCountFromChain;
        } finally {
            lock.unlock();
        }
    }
}
```

## 4. Gas & Fee Strategy

- Use `eth_feeHistory` percentiles for the priority fee; `maxFeePerGas = 2 * nextBaseFee + priorityFee`.
- Add 20-30% buffer to `eth_estimateGas` for state-dependent paths (63/64 rule, cold/warm access).
- **Fee bumping policy:** after K blocks pending, replace with +12.5% (nodes require >= 10%).
- Set a **max spend cap** per tx and per hour; page humans above it.
- `intrinsic gas too low`, `insufficient funds for gas * price + value`, `execution reverted: <reason>` - decode revert data (`Error(string)` selector `0x08c379a0`, custom errors by selector) to give actionable messages.

## 5. Key Custody

| Tier | Mechanism | Use |
|---|---|---|
| Hot | KMS/HSM-backed signing service, per-tx policy, rate limits | Operational payouts (small float) |
| Warm | MPC/threshold signing across 2+ clouds, approval workflow | Mid-size treasury |
| Cold | Air-gapped hardware wallets / multisig (Safe 3-of-5, geographically split) | Majority of funds |

- Keys never in env vars, repos, or logs. Use **AWS KMS / GCP KMS secp256k1 keys** (sign-only, non-exportable) or MPC.
- **Policy engine** between app and signer: allow-list destinations/contracts, per-asset daily limits, simulation check (`eth_call`/Tenderly) before signing, human approval above thresholds.
- Rotation plan + tested recovery drill; separation of duties (builder cannot approve).
- Withdrawal flow should be: request -> risk checks -> **idempotent** payout record -> sign -> broadcast -> confirm -> notify. Never derive the tx purely from a user-supplied amount without server-side re-validation.

## 6. RPC & Infra Resilience

| Concern | Practice |
|---|---|
| Provider outage / rate limits | Multi-provider failover (Alchemy + Infura + own node), circuit breaker, backoff with jitter |
| Stale reads | Compare `head` across providers; pin reads to a block number for consistency |
| `eth_getLogs` limits | Chunk ranges (e.g. 2k blocks), paginate, store cursor |
| WebSocket drops | Reconnect + backfill from last processed block (no gaps!) |
| Own node | Run EL+CL pair, snapshot sync, monitor peers/sync lag/disk growth (~1 TB, NVMe required) |
| Cost | Cache immutable data (finalized blocks, receipts), batch JSON-RPC calls, multicall contract |

## 7. Data Pipeline Pattern

```
Node/RPC -> Ingestor (reorg-aware, cursor) -> Kafka topic (chainId.blocks / logs, keyed by contract)
         -> Decoders (ABI) -> Postgres / ClickHouse -> API + alerts
```

Kafka gives replay, backpressure and exactly-once-ish processing with idempotent upserts. See [Kafka Intro](../../kafka/intro.md) and [Exactly-Once vs Dedup](../../kafka/advanced/exactly-once-vs-dedup.md).

## 8. Observability

| Signal | Alert on |
|---|---|
| Head lag (`provider head - processed`) | > 5 blocks for 2 min |
| Pending tx age | > 10 min without inclusion |
| Nonce gap / queued tx count | Any > 0 for 5 min |
| Hot wallet balance | Below gas runway / above exposure limit |
| Revert rate per contract | Spike -> incident or exploit |
| Reorg depth | >= 2 on Ethereum, >= 6 on PoW chains |
| Signing requests per minute | Anomalies (compromise indicator) |

## 9. Testing Strategy

- **Local forks:** Anvil/Hardhat `--fork-url` at a pinned block for deterministic integration tests.
- **Chaos:** drop RPC, delay blocks, force reorgs (`anvil_reorg`/ custom devnet), kill process between sign and broadcast.
- **Property tests** for amount/decimal conversions (6 vs 18 decimals; `BigDecimal` + explicit `RoundingMode`).
- **Testnets** (Sepolia/Holesky) for end-to-end; mainnet canary with tiny amounts.

## 10. Incident Playbook: Suspected Exploit

1. **Pause** (guardian multisig) or disable withdrawals at the service layer.
2. Snapshot state; identify attacker txs (trace) and affected contracts.
3. Rotate keys if backend compromise is possible; revoke approvals.
4. Coordinate: SEAL 911, exchanges/stablecoin issuers for freezes, white-hat negotiation (bounty offer).
5. Public communication with factual timeline; post-mortem with root cause and invariant that failed.

## Senior Gotchas

1. **Decimals:** USDT/USDC = 6, WBTC = 8, most = 18. Normalise at the boundary; never store as floating point.
2. **Address checksum & chain confusion:** same address exists on all EVM chains; sending to a contract address that exists on one chain only loses funds on another. Always include `chainId` in every record.
3. **Exchange-style hot wallet sweeps** cost gas; batch and sweep at low base fee.
4. **Time:** `block.timestamp` is not monotonic with wall-clock in your DB; store both block time and ingest time.
5. **Quotas:** infinite retry on revert wastes gas and can double-send when status is unknown - always check by tx hash/nonce before re-sending.

Next: [Blockchain Interview Questions](../interview/blockchain-interview-questions.md).
