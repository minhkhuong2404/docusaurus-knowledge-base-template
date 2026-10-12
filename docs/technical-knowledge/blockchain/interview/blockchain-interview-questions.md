---
id: blockchain-interview-questions
title: Blockchain & Web3 Interview Questions (Junior to Staff)
sidebar_label: Interview Questions
description: Tiered blockchain and Web3 interview questions with model answers - fundamentals, consensus, Ethereum, smart contract security, scaling, sharding, IPFS, and system design.
tags:
  - technical-knowledge
  - blockchain
  - interview
---

# Blockchain & Web3 Interview Questions

## Level 1 - Fundamentals (New Learner)

**Q1. What problem does a blockchain solve?**
Agreement on a shared, ordered history among parties who do not trust each other and have no common trusted operator - without a central coordinator.

**Q2. How does a block link to the previous one?**
Header contains the hash of the previous header. Changing any earlier block changes its hash, breaking every following link, so tampering requires recomputing (PoW) or overriding (PoS) all later blocks.

**Q3. Public key vs private key vs address?**
Private key: secret 256-bit number that produces signatures. Public key: curve point derived one-way from it. Address: hash-derived identifier of the public key. Ownership = ability to sign.

**Q4. What is a Merkle tree and why is it used?**
Binary hash tree whose root commits to all leaves; inclusion proof is `O(log n)` hashes, enabling light clients (SPV) to verify a transaction without the full block.

**Q5. Difference between a coin and a token?**
Coins are native to a chain (BTC, ETH, pay for fees). Tokens are balances managed by smart contracts on a chain (ERC-20).

**Q6. What is gas?**
Unit measuring EVM computation/storage cost; fee = gas used x price. It meters execution so infinite loops cannot halt the network and prices block space.

**Q7. What is a 51% attack?**
An entity controlling a majority of hash power (or stake) can reorder recent blocks, double-spend, and censor, but cannot forge signatures or steal arbitrary funds.

**Q8. Hard fork vs soft fork?**
Hard fork loosens/changes rules; non-upgraded nodes reject new blocks (chain split unless unanimous). Soft fork tightens rules; old nodes still accept new blocks.

## Level 2 - Intermediate

**Q9. UTXO vs account model - when is each better?**
UTXO: parallel validation, simple double-spend rule, good privacy, limited programmability. Account: natural for smart contracts and shared state, simple balances, but sequential per-account nonces and global state bloat.

**Q10. Why does Ethereum use `keccak256` and nonces on accounts?**
Hash for addressing/commitments; the nonce prevents replay and orders an account's transactions.

**Q11. What is reentrancy and how do you prevent it?**
Attacker re-enters a function through an external call before state is updated. Use checks-effects-interactions, `nonReentrant`, pull payments, and consider cross-function/read-only reentrancy.

**Q12. How can you read a "private" variable of a contract?**
`private` is a compiler visibility rule only; storage is public. Use `eth_getStorageAt(contract, slot)` after computing the slot layout.

**Q13. How does a wallet connect to a dApp?**
Wallet injects an EIP-1193 provider (or WalletConnect); dApp requests accounts, builds txs, wallet signs after user approval; dApp/provider broadcasts via JSON-RPC.

**Q14. Why do you need an indexer?**
Nodes serve state and logs but no joins/aggregations/history queries efficiently. Indexers ingest events, handle reorgs, and expose queryable stores.

**Q15. What is EIP-1559?**
Per-block `baseFee` (burned, auto-adjusts toward 50% utilization) + priority tip; users set `maxFeePerGas`. Improves fee predictability.

**Q16. What is IPFS and does it guarantee storage?**
Content-addressed P2P file distribution (CID = hash of content). No guarantee: data persists only while pinned by someone; Filecoin/Arweave add economic persistence.

## Level 3 - Senior

**Q17. Explain finality in Ethereum vs Bitcoin.**
Bitcoin: probabilistic - reorg probability decays with depth. Ethereum PoS: Casper FFG finalizes checkpoints after 2 epochs (~13 min) with economic finality (>= 1/3 stake slashable); LMD-GHOST provides fork choice in between.

**Q18. How do optimistic and ZK rollups differ?**
Optimistic: assume validity, fraud proofs within a ~7-day challenge window. ZK: validity proofs checked on L1, faster finality, heavier proving. Both post data to L1 (blobs) so users can reconstruct state and force-exit.

**Q19. What is data availability and why does it matter?**
A proof of validity is useless if the data to reconstruct state is withheld (users can't prove balances/exit). DA sampling with erasure coding lets nodes probabilistically ensure availability cheaply.

**Q20. Why is sharding a blockchain harder than sharding a database?**
Adversarial validators: a small shard committee can be targeted, so sampling and reshuffling are needed; no trusted coordinator for cross-shard atomicity; DA withholding; validators must sync state when reassigned.

**Q21. How would you prevent oracle manipulation in a lending protocol?**
No spot pools; use TWAP and/or Chainlink with staleness + deviation checks; multi-source with circuit breakers; liquidity-aware collateral caps; delay/limits for large changes.

**Q22. Design safe upgradeability for a protocol holding $100M.**
UUPS/Transparent proxy with namespaced storage, storage-layout diff checks in CI, `_disableInitializers`, timelock (48-72h) + multisig, upgrade events + monitoring, immutable core where possible, pause guardian with narrow scope, public audit before upgrade.

**Q23. How do you detect and handle a reorg in a deposit service?**
Store `(number, hash, parentHash)`; on parent mismatch walk back to the common ancestor, revert derived rows, re-ingest. Credit only at `finalized`/N confirmations; idempotent keys `(chainId, txHash, logIndex)`.

**Q24. What are flash-loan attacks and their root cause?**
Atomic uncollateralised capital allows temporary price/voting-power manipulation. Root cause: protocol trusting instantaneous state (spot price, current-balance votes). Fix by using time-averaged or snapshot-based inputs.

**Q25. MEV: explain sandwich attacks and defenses.**
Bot front-runs a pending swap to move price, victim executes at worse price within slippage, bot back-runs to profit. Defenses: tight slippage, private mempools, batch auctions/RFQ, protocol design with uniform clearing price.

## Level 4 - Staff / Architect (System Design Prompts)

### Design 1: Custodial Crypto Exchange Wallet System

**Key points to cover**
- Per-user deposit addresses (HD derivation, xpub on watch-only service); sweep to cold/warm wallets.
- Reorg-aware ingestors per chain; confirmation policy per asset/value; idempotent credits.
- Withdrawal pipeline: risk engine -> policy signer (KMS/MPC) -> nonce manager -> broadcast -> confirmation tracker; fee bumping.
- Double-entry internal ledger with daily reconciliation against on-chain balances (proof of reserves via Merkle sum tree).
- Hot/warm/cold ratio; limits; incident kill switch.
- Failure modes: stuck nonce, provider divergence, chain halt, token contract upgrade/pause, dust attacks, address poisoning.

### Design 2: NFT Marketplace

- On-chain: ERC-721/1155, escrowless listings via EIP-712 signed orders (Seaport) settled atomically by an exchange contract.
- Off-chain: order book DB, indexer, metadata cache; media on IPFS/Arweave with multi-pin; CDN gateway.
- Royalties (ERC-2981 is advisory), wash-trading detection, spam filtering, signature expiry and cancellation by nonce counter.

### Design 3: Cross-Chain Bridge Risk Review

- Trust model (multisig vs light client vs ZK), key management, message replay protection (nonce + chain id domain), rate limits, per-asset caps, delayed withdrawals, independent monitoring, canonical token minting/burning accounting invariant (`locked on L1 == minted on L2`).

### Design 4: Supply-Chain Traceability on a Consortium Ledger

- Choose Fabric/Besu only if multiple orgs need shared governance; otherwise signed append-only DB.
- Store hashes of documents/IoT readings on ledger; documents off-ledger (encrypted, IPFS private cluster or S3); channel per consortium sub-group; oracle problem: garbage in -> immutable garbage, so use signed sensors and attestations.

## Rapid-Fire Gotcha Round

| Question | One-line answer |
|---|---|
| Can a smart contract call a REST API? | No - determinism; use oracles (Chainlink) |
| Can you delete data on a blockchain? | No; keep PII off-chain, store hashes |
| Is `block.timestamp` random? | No; proposer-influenceable by seconds |
| Why is `tx.origin` bad for auth? | Phishing contract can relay; use `msg.sender` |
| `delegatecall` vs `call`? | `delegatecall` runs callee code with caller's storage/msg.sender |
| Why `SafeERC20`? | Some tokens don't return `bool`; avoids silent failure |
| What stops a validator from signing two blocks? | Slashing (equivocation proofs) |
| Are testnets safe for key reuse? | Never reuse mainnet keys on testnets or dev machines |
| Optimistic rollup withdrawal time? | ~7 days (fast bridges front liquidity) |
| IPFS vs Filecoin? | IPFS distributes; Filecoin pays for persistence |

## Self-Assessment Checklist

- [ ] I can explain hash links, Merkle proofs and signatures from memory
- [ ] I can compare PoW, PoS, BFT and name each one's attack model
- [ ] I can write a reentrancy exploit and its fix
- [ ] I can compute an AMM swap output and impermanent loss
- [ ] I can design a reorg-safe deposit pipeline with idempotency keys
- [ ] I can explain why rollups + DA sampling replaced execution sharding on Ethereum
- [ ] I can justify when NOT to use a blockchain
