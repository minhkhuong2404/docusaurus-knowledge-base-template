---
id: bitcoin-internals
title: Bitcoin Internals - UTXO Set, Script, Mempool, and Reorgs
sidebar_label: Bitcoin Internals
description: Senior-level Bitcoin internals - block structure, difficulty adjustment, Script and Taproot, UTXO set and chainstate, mempool policy, fee estimation, SegWit, Lightning, and reorg handling.
tags:
  - technical-knowledge
  - blockchain
  - bitcoin
---

# Bitcoin Internals

## Block & Header Layout

```
Block header (80 bytes):
  version      4 B
  prevBlockHash 32 B
  merkleRoot   32 B   <- commits to all txids (wtxid commitment in coinbase since SegWit)
  time         4 B
  bits         4 B    <- compact encoding of target
  nonce        4 B
Body: varint txCount, transactions[]   (weight limit 4,000,000 WU ~ 1-2 MB)
```

Only 4 bytes of nonce = 4.3 billion tries - far fewer than needed. Miners also roll the **extra-nonce** in the coinbase input (changing the Merkle root) and `time`/`version` bits (ASICBoost).

## Difficulty Adjustment

Every **2016 blocks**: `newTarget = oldTarget * (actualTimespan / 1,209,600 s)`, clamped to x4 / /4. Known quirk: off-by-one bug measuring 2015 intervals enables the *time warp attack* (fixed in proposed consensus cleanup).

## Transactions & Script

A stack-based, non-Turing-complete language (no loops) -> every script terminates, validation cost is bounded.

| Output type | Locking script idea | Notes |
|---|---|---|
| P2PKH | `OP_DUP OP_HASH160 <pkh> OP_EQUALVERIFY OP_CHECKSIG` | Legacy |
| P2SH | `OP_HASH160 <scriptHash> OP_EQUAL` | Multisig behind a hash |
| P2WPKH / P2WSH | witness v0 | **SegWit**: signatures moved to witness, fixes txid malleability, weight discount |
| P2TR | witness v1, Schnorr key + optional Merkelized script tree (MAST) | **Taproot**: multisig looks like single-sig, better privacy |

**Double spend / validation checklist** (per input): UTXO exists -> not already spent in this block/mempool -> script validates -> amounts conserve -> coinbase maturity (100 blocks) -> `nLockTime`/`nSequence` (BIP-65/112) satisfied.

## UTXO Set & Chainstate

Bitcoin Core keeps a LevelDB `chainstate` of unspent outputs keyed by `(txid, vout)`, held mostly in an in-memory `dbcache`. Initial Block Download (IBD) cost is dominated by script verification and UTXO lookups. `-assumevalid` skips old signature checks; `assumeutxo` snapshots speed bootstrapping.

## Mempool, Fees & Replacement

- Each node has its own mempool with **policy** (not consensus) rules: min relay fee, standardness, ancestor/descendant limits (25/101 kvB by default), package relay.
- **Fee rate** = sat/vbyte. Miners fill the block by fee rate (child-pays-for-parent considers packages).
- **RBF (BIP-125):** replace an unconfirmed tx with a higher-fee version signalling replaceability; full-RBF is now widely relayed.
- **CPFP:** spend an unconfirmed output with a high-fee child to pull in the parent.

## Reorgs & Confirmations

Orphaned/stale blocks occur when two miners find blocks near-simultaneously (propagation ~ seconds vs 600 s block time -> ~0.5% stale rate historically). Compact block relay (BIP-152) cut propagation. Services should:

1. Persist `(height, hash)`; on a new tip with a different ancestor, **roll back** derived state to the fork point.
2. Credit deposits at >= 3-6 confirmations depending on value; for >$1M consider 12+ or exchange-style risk checks.

## Layer 2: Lightning Network

Bidirectional payment channels secured by 2-of-2 multisig + **HTLC** routing (hash time-locked contracts). Updates are off-chain; only open/close touch L1. Risks: channel jamming, liquidity fragmentation, must watch chain for revoked-state cheating (watchtowers), force-close fee spikes.

## Supply, Halving & Security Budget

Block subsidy halves every 210,000 blocks (~4 years): 50 -> 25 -> ... 3.125 BTC (2024) -> ~0 around 2140. Long-term security must be funded by fees; a recurring research topic (fee-only mining, selfish-mining stability).

## Quick Java RPC Example

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;

public final class BitcoinRpc {
    private final HttpClient client = HttpClient.newHttpClient();
    private final URI uri = URI.create("http://127.0.0.1:8332/");
    private final String auth;

    public BitcoinRpc(String user, String pass) {
        this.auth = "Basic " + Base64.getEncoder().encodeToString((user + ":" + pass).getBytes());
    }

    public String call(String method, String paramsJson) throws Exception {
        String body = "{\"jsonrpc\":\"1.0\",\"id\":\"kb\",\"method\":\"" + method + "\",\"params\":" + paramsJson + "}";
        HttpRequest req = HttpRequest.newBuilder(uri)
            .header("Authorization", auth)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
        return client.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }
}
// new BitcoinRpc("user","pass").call("getblockchaininfo", "[]");
```

Never expose the RPC port publicly; bind to localhost / private subnet and use cookie or rpcauth.

## Senior Gotchas

1. **txid malleability** pre-SegWit broke naive payment tracking; always track by outputs/confirmations, not only txid.
2. **Dust outputs** (< ~546 sats for P2PKH) are non-standard; consolidating many small UTXOs during low fees saves money later.
3. **Address reuse** hurts privacy and (for ECDSA) exposes the public key after first spend.
4. **Fee estimation** - `estimatesmartfee` lags in spikes; use RBF + fee bumping instead of overpaying.
5. **Chain splits (BCH 2017)** require replay protection awareness when moving funds post-fork.

Next: [Ethereum & the EVM](./ethereum-evm.md).
