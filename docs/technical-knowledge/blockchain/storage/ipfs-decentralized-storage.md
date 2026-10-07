---
id: ipfs-decentralized-storage
title: IPFS & Decentralized Storage (Filecoin, Arweave)
sidebar_label: IPFS & Decentralized Storage
description: IPFS internals - content addressing, CIDs and multihash, chunking and Merkle DAG, UnixFS, Kademlia DHT, Bitswap, IPNS, pinning, gateways, Filecoin and Arweave, and NFT metadata best practices.
tags:
  - technical-knowledge
  - blockchain
  - ipfs
  - storage
---

import BlockchainScalingDiagram from '@site/src/components/BlockchainScalingDiagram';

# IPFS & Decentralized Storage

Blockchains are terrible file systems (Ethereum storage ~ 640,000 gas per KB). Real dApps keep **hashes on chain** and **bytes in content-addressed storage**.

## Location vs Content Addressing

| | HTTP (location) | IPFS (content) |
|---|---|---|
| Address | `https://host/path` - *where* | `ipfs://bafy...` - *what* (hash of bytes) |
| Integrity | Trust the server (TLS only authenticates the host) | Self-verifying: re-hash received bytes |
| Duplicates | Many copies, many URLs | Same bytes = same CID |
| Link rot | Server disappears -> 404 | Survives while anyone provides/pins it |
| Mutability | Same URL, changing content | New content = new CID (use IPNS/DNSLink for stable names) |

## How IPFS Stores a File

<BlockchainScalingDiagram initialTab="ipfs" />

1. **Chunk** - default fixed-size 256 KiB (or Rabin/buzhash content-defined chunking for better dedup).
2. **Hash each chunk** - `sha2-256` -> multihash.
3. **Build a Merkle DAG** - parent nodes list child CIDs (UnixFS dag-pb nodes); root CID identifies the whole file or directory.
4. **Announce** - provider records stored in the **Kademlia DHT**: "peer X has CID Y".
5. **Retrieve** - resolve providers via DHT, fetch blocks with **Bitswap**, verify each hash, assemble.

### CID Anatomy

```
CIDv1 = <multibase> <version> <multicodec> <multihash>
  bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
  b            -> base32 multibase
  afy          -> CID v1 prefix
  be           -> dag-pb codec ... then sha2-256 multihash (0x12 0x20 + 32-byte digest)
```

CIDv0 (`Qm...`) is base58 sha256 dag-pb; CIDv1 is case-insensitive base32, safer for subdomain gateways (`https://<cid>.ipfs.dweb.link`).

## Kademlia DHT & Bitswap

- **DHT:** 256-bit XOR-distance keyspace; k-buckets (k=20); lookups take O(log n) hops. Stores *provider records* (not content) and peer records. Records expire (~48 h) and are republished.
- **Bitswap:** exchanges `want-list` / `have` messages with connected peers *before* falling back to DHT, which makes popular content fast.
- **Transport:** libp2p (TCP, QUIC, WebRTC, WebTransport), NAT traversal via hole punching and relays.
- **Delegated routing / IPNI** (InterPlanetary Network Indexer) accelerates large providers.

## Persistence: Pinning

> **IPFS is not storage; it is a distribution protocol.** Unpinned blocks are garbage-collected.

| Option | How persistence is achieved | Model |
|---|---|---|
| Self-hosted node `ipfs pin add <cid>` | Your hardware | Cheapest, you operate it |
| Pinning services (Pinata, web3.storage, Filebase) | Paid SaaS via Pinning Service API | Subscription |
| **Filecoin** | Storage deals; Proof-of-Replication + Proof-of-Spacetime audited on chain | Market of storage providers, deal duration (e.g. 540 days) |
| **Arweave** | Pay once, endowment funds ~200+ years of storage (blockweave, Succinct Proofs of Access) | Permanent storage |
| Storj / Sia / Walrus | Erasure-coded shards across nodes | Encrypted, decentralised object storage |

## Mutable Names

| Mechanism | Description | Trade-off |
|---|---|---|
| **IPNS** | Name = hash of a public key; record maps name -> CID, signed | Slow resolution, record TTL |
| **DNSLink** | `_dnslink.example.com TXT "dnslink=/ipfs/<cid>"` | Needs DNS trust |
| **ENS contenthash** | `app.eth` -> CID stored on chain | Updating costs gas; verifiable frontends |

## NFT & dApp Metadata Best Practices

```json
{
  "name": "Cosmic Cat #42",
  "description": "Generative cat",
  "image": "ipfs://bafybeih.../42.png",
  "attributes": [{ "trait_type": "Fur", "value": "Nebula" }]
}
```

- `tokenURI(id)` should return an **`ipfs://` or `ar://` URI**, not an `https://` URL on your server (rug-pull / link rot risk).
- The CID in the contract commits to the content: *"the image can't be swapped"* - **only if** the metadata JSON itself is also content-addressed and the contract is immutable (or metadata frozen).
- Pin on **at least two** independent providers; test retrieval through several gateways.
- Don't put personal or private data on IPFS: content is public, addressable by anyone who knows the CID, and **cannot be deleted** globally. Encrypt before upload (and manage keys elsewhere).

## Gateways

HTTP gateways (`ipfs.io`, `dweb.link`, Cloudflare) fetch by CID on behalf of browsers. They are **trusted intermediaries** (can censor or serve slowly). Mitigation: run a dedicated gateway, use service-worker verifying clients (**Helia**, `@helia/verified-fetch`) that re-hash responses in the browser, or trustless-gateway CAR responses.

## Java Example: Add and Fetch via a Kubo Node

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

public final class IpfsClient {
    private final HttpClient http = HttpClient.newHttpClient();
    private final String api = "http://127.0.0.1:5001/api/v0";

    /** Uploads a file to the local Kubo node; returns the JSON response containing the CID ("Hash"). */
    public String add(Path file) throws Exception {
        String boundary = "----kb" + UUID.randomUUID();
        byte[] content = Files.readAllBytes(file);
        String head = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\""
            + file.getFileName() + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
        String tail = "\r\n--" + boundary + "--\r\n";
        byte[] body = concat(head.getBytes(), content, tail.getBytes());
        HttpRequest req = HttpRequest.newBuilder(URI.create(api + "/add?pin=true&cid-version=1"))
            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
            .POST(HttpRequest.BodyPublishers.ofByteArray(body))
            .build();
        return http.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    private static byte[] concat(byte[]... parts) {
        int len = 0;
        for (byte[] p : parts) len += p.length;
        byte[] out = new byte[len];
        int pos = 0;
        for (byte[] p : parts) { System.arraycopy(p, 0, out, pos, p.length); pos += p.length; }
        return out;
    }
}
```

Never expose the Kubo RPC API (`:5001`) beyond localhost - it can add/remove pins and shut the node down.

## Senior Gotchas

1. **Cold content is slow:** DHT lookups for unpopular CIDs can take tens of seconds; keep a pinned, well-connected provider and publish to IPNI.
2. **GC and pin accounting:** forgetting to pin directory roots (`--pin=true` pins recursively) loses data silently on `ipfs repo gc`.
3. **Same bytes, different CID** if chunker, CID version, or DAG layout settings differ - reproducibility requires fixed parameters (`--chunker`, `--cid-version`, `--raw-leaves`).
4. **Gateway as SPOF:** don't hardcode one public gateway in NFT metadata.
5. **Legal/abuse:** you may host content you cannot delete; implement denylists on your gateway and nodes (badbits).

Next: [Permissioned Ledgers](../enterprise/permissioned-ledgers.md).
