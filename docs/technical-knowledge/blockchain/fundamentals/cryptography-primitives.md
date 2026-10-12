---
id: cryptography-primitives
title: Cryptography Primitives for Blockchain
sidebar_label: Cryptography Primitives
description: Hash functions, digital signatures (ECDSA, EdDSA, BLS), key derivation, Merkle trees, Merkle Patricia tries, and zero-knowledge proofs explained for blockchain engineers.
tags:
  - technical-knowledge
  - blockchain
  - cryptography
---

import BlockchainCoreDiagram from '@site/src/components/BlockchainCoreDiagram';

# Cryptography Primitives for Blockchain

Blockchains replace *trusted institutions* with *math*. Four primitives carry almost all of the weight: **hash functions**, **digital signatures**, **Merkle commitments**, and (increasingly) **zero-knowledge proofs**.

## 1. Cryptographic Hash Functions

A hash `H(x)` maps arbitrary bytes to a fixed-size digest. Required properties:

| Property | Meaning | Why the chain needs it |
|---|---|---|
| Deterministic | Same input, same output | All nodes compute the same block hash |
| Pre-image resistance | Cannot find `x` from `H(x)` | Addresses do not reveal public keys until spent |
| Second pre-image resistance | Given `x`, cannot find `y != x` with same hash | Cannot forge a replacement block |
| Collision resistance | Cannot find any `x != y` with `H(x)=H(y)` | Merkle roots uniquely commit to tx sets |
| Avalanche effect | 1 bit flip changes ~50% of output | Tampering is obvious |

| Chain | Hash | Note |
|---|---|---|
| Bitcoin | SHA-256 (double: `SHA256(SHA256(x))`) | Double hashing mitigates length-extension attacks |
| Ethereum | Keccak-256 | **Not** NIST SHA3-256 (different padding) - a classic bug source |
| Filecoin / IPFS | SHA2-256 multihash | Self-describing via multihash |
| Zcash/ZK systems | Poseidon, Pedersen, MiMC | Algebraic hashes cheap *inside* circuits |

```java
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class Sha256Demo {
    public static String sha256Hex(String input) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
    }

    public static void main(String[] args) throws Exception {
        System.out.println(sha256Hex("hello"));
        System.out.println(sha256Hex("hellp")); // completely different digest
    }
}
```

## 2. Proof of Work as Hash Puzzle

Miners search for a `nonce` such that `H(header || nonce) < target`. Expected work is `2^256 / target` hashes. The network retargets difficulty (Bitcoin: every 2016 blocks, ~2 weeks) to keep ~10 min block time.

```java
public static long mine(String headerData, int leadingZeroBits) throws NoSuchAlgorithmException {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    for (long nonce = 0; ; nonce++) {
        byte[] d = md.digest((headerData + nonce).getBytes(StandardCharsets.UTF_8));
        if (leadingZeros(d) >= leadingZeroBits) {
            return nonce;
        }
    }
}

private static int leadingZeros(byte[] d) {
    int bits = 0;
    for (byte b : d) {
        if (b == 0) { bits += 8; continue; }
        bits += Integer.numberOfLeadingZeros(b & 0xFF) - 24;
        break;
    }
    return bits;
}
```

## 3. Digital Signatures

A key pair `(sk, pk)`; `sign(sk, msg) -> sig`; `verify(pk, msg, sig) -> bool`. Ownership on chain **is** the ability to produce a valid signature.

| Scheme | Used by | Property |
|---|---|---|
| **ECDSA secp256k1** | Bitcoin, Ethereum EOAs | Needs a *secret random* nonce `k`; reused/biased `k` leaks the private key (Sony PS3, Android 2013 wallets) |
| **EdDSA (Ed25519)** | Solana, Cardano, SSH | Deterministic nonce; fast batch verification |
| **Schnorr (BIP-340)** | Bitcoin Taproot | Linear -> key/signature aggregation (MuSig2) |
| **BLS12-381** | Ethereum consensus | Signatures aggregate into one -> thousands of validator votes verified as one |

**Ethereum address derivation**

```
privateKey (256-bit random)
  -> publicKey = privateKey * G   (secp256k1 point, 64 bytes uncompressed)
  -> keccak256(publicKey)         (32 bytes)
  -> last 20 bytes                (address, EIP-55 checksum casing)
```

**Replay protection:** EIP-155 includes `chainId` in the signed payload so a signature valid on Ethereum mainnet is invalid on a fork or L2. Always use typed transactions (EIP-2718/1559) and EIP-712 for structured off-chain signing.

### Wallet Key Hierarchy (BIP-32/39/44)

```
12/24-word mnemonic (BIP-39)  -- PBKDF2-HMAC-SHA512, 2048 rounds + optional passphrase -->  512-bit seed
  -> master key (BIP-32 HMAC-SHA512 "Bitcoin seed")
    -> m/44'/60'/0'/0/0   first Ethereum account (BIP-44, coin type 60)
    -> m/44'/0'/0'/0/0    first Bitcoin account
```

The mnemonic *is* the wallet. Anyone with it controls every derived account.

## 4. Merkle Trees

A binary tree of hashes whose root commits to an entire list. Proving that one element is included needs only `log2(n)` sibling hashes.

<BlockchainCoreDiagram initialTab="merkle" />

```java
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

public final class Merkle {
    public static byte[] root(List<byte[]> leaves) throws Exception {
        if (leaves.isEmpty()) throw new IllegalArgumentException("empty");
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        List<byte[]> level = new ArrayList<>();
        for (byte[] l : leaves) level.add(md.digest(l));
        while (level.size() > 1) {
            List<byte[]> next = new ArrayList<>();
            for (int i = 0; i < level.size(); i += 2) {
                byte[] left = level.get(i);
                byte[] right = (i + 1 < level.size()) ? level.get(i + 1) : left; // Bitcoin duplicates last node
                md.update(left);
                md.update(right);
                next.add(md.digest());
            }
            level = next;
        }
        return level.get(0);
    }
}
```

> **Gotcha (CVE-2012-2459):** Bitcoin's "duplicate last node" rule lets two different transaction lists share a Merkle root. Domain-separate leaves from inner nodes (`0x00 || leaf`, `0x01 || left || right`) in your own designs, as RFC 6962 (Certificate Transparency) does.

### Merkle Patricia Trie (Ethereum state)

Ethereum commits *state* (address -> account) in a **Modified Merkle Patricia Trie** with hex-nibble keys. Its root appears in every block header (`stateRoot`, `transactionsRoot`, `receiptsRoot`). It supports proofs of *inclusion and non-inclusion* (`eth_getProof`, EIP-1186), which light clients and bridges use. Verkle trees (EIP-6800) will shrink proofs from ~kB to ~150 bytes to enable stateless clients.

## 5. Zero-Knowledge Proofs (ZKPs)

Prove "I know `w` such that `C(x, w) = true`" without revealing `w`.

| System | Trusted setup | Proof size | Verify | Quantum-safe | Used by |
|---|---|---|---|---|---|
| Groth16 (SNARK) | Per-circuit | ~200 B | ~1 ms (3 pairings) | No | Zcash Sapling, Tornado Cash |
| PLONK / Halo2 | Universal / none | ~1 kB | ms | No | zkSync, Scroll, Aztec |
| STARK | None (hash-based) | 50-200 kB | ms-ish | Yes | StarkNet |

Applications: **validity rollups** (prove a batch of 1000s of txs executed correctly), **private transfers**, **identity** ("over 18" without birthdate), **zkBridges**.

## Senior Gotchas

1. **Never roll your own crypto.** Use audited libraries (libsecp256k1, BouncyCastle, noble-curves).
2. **Randomness:** Weak RNG in key/nonce generation has drained real wallets (Profanity vanity-address exploit, 2022). Use the OS CSPRNG (`SecureRandom`, `/dev/urandom`).
3. **Signature malleability:** ECDSA `(r, s)` and `(r, n-s)` both verify. Bitcoin (BIP-62/146 low-S, SegWit) and OpenZeppelin `ECDSA.recover` enforce canonical low-S; never use a raw signature as a unique ID.
4. **`ecrecover` returns `address(0)` on failure** - always check it; an unchecked zero address has authorised withdrawals.
5. **Hash length extension:** never build MACs as `SHA256(key || msg)`; use HMAC.
6. **Quantum:** Shor breaks ECDSA/BLS; hash-based and lattice signatures (SLH-DSA, ML-DSA) are the migration targets. Addresses that have never revealed their public key are safer.

Next: [Ledger Models](./ledger-models.md).
