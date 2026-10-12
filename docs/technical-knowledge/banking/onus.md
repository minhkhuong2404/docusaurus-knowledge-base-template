---
id: onus
title: On-Us Transaction Processing — Internal Clearing, Ledger Deadlocks & Card Bypass
sidebar_label: On-Us Transactions
description: Comprehensive senior architectural guide to on-us transaction mechanics, direct ledger book transfers, lexicographical lock ordering to prevent deadlocks, cross-shard 2PC, and card scheme bypass routing.
tags: [banking, on-us, payments, ledger, concurrency, deadlocks, card-scheme]
---

# On-Us Transaction Processing — Internal Clearing & Architecture

An **On-Us Transaction** is a payment where both the originator (debtor/payer) and the beneficiary (creditor/payee) hold accounts within the **same financial institution** or core banking entity.

Because the funds remain entirely within the bank's sovereign balance sheet, an On-Us transaction **bypasses external clearing houses** (such as ACH, Fedwire, SEPA, or card network switches like Visa/Mastercard). This eliminates interbank interchange fees, reduces processing latency from days/hours to milliseconds, and eliminates counterparty settlement risk.

However, executing high-throughput On-Us transfers introduces severe concurrency challenges: **distributed database deadlocks**, **cross-shard ledger balance transfers**, and **internal compliance gating**.

---

## 1. Physical Ledger Mechanics: The Direct Book Transfer

In an Off-Us payment, money must transition through intermediary clearing suspense accounts while waiting for central bank settlement. In contrast, an On-Us transfer executes as a **direct internal book transfer**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ON-US DIRECT LEDGER BOOK TRANSFER                               │
│                                                                                        │
│   ORIGINATOR (ALICE)                  CORE BANKING SYSTEM           BENEFICIARY (BOB)  │
│   Account: #1001-A                    Single Relational Unit        Account: #2002-B   │
│   ┌────────────────────┐              ┌──────────────────────┐      ┌────────────────┐ │
│   │ Balance: $1,200.00 │ ───────────> │ ATOMIC TRANSACTION:  │ ───> │ Balance: $50.00│ │
│   └────────────────────┘              │                      │      └────────────────┘ │
│                                       │ 1. DR Alice -$200.00 │                         │
│                                       │ 2. CR Bob   +$200.00 │                         │
│                                       │                      │                         │
│                                       │ Net Balance Delta:   │                         │
│                                       │ Δ Liabilities = $0.00│                         │
│                                       └──────────────────────┘                         │
│                                                  │                                     │
│   EXTERNAL CLEARING (ACH / SWIFT / VISA):        ▼                                     │
│   BYPASSED COMPLETELY ($0 Scheme Fees, < 15ms Latency, Zero Interbank Credit Risk)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Double-Entry Accounting Representation
In the general ledger (GL), customer deposits represent liabilities owed by the bank to depositors:

$$\text{Bank Assets} = \text{Bank Liabilities} + \text{Equity}$$

When Alice pays Bob \$200.00 On-Us:
1. **Debit (DR)**: Alice Deposit Liability Account (`#2001-Alice`) $-\$200.00$
2. **Credit (CR)**: Bob Deposit Liability Account (`#2001-Bob`) $+\$200.00$

**Net Change to Bank Balance Sheet**: Exactly $\$0.00$. No central bank reserve account movement is required, and no settlement delay exists.

---

## 2. High-Throughput Concurrency: The Ledger Deadlock Hazard

In high-volume systems (e.g., peer-to-peer apps like Venmo, Zelle, or commercial B2B treasury engines), thousands of concurrent transfers occur simultaneously across overlapping accounts.

### The Circular Deadlock Trap
Consider two concurrent transfers between Alice (Account `1001`) and Bob (Account `2002`):
- **Thread 1 (Alice $\to$ Bob, \$50)**:
  1. Acquires lock on Account `1001` (Alice).
  2. Attempts to acquire lock on Account `2002` (Bob).
- **Thread 2 (Bob $\to$ Alice, \$30)**:
  1. Acquires lock on Account `2002` (Bob).
  2. Attempts to acquire lock on Account `1001` (Alice).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE CONCURRENT TRANSFER DEADLOCK                                │
│                                                                                        │
│         Thread 1 (Alice -> Bob)                 Thread 2 (Bob -> Alice)                │
│         ───────────────────────                 ───────────────────────                │
│         1. LOCK Account 1001 (Alice)            1. LOCK Account 2002 (Bob)             │
│            [GRANTED]                               [GRANTED]                           │
│                                                                                        │
│         2. LOCK Account 2002 (Bob)              2. LOCK Account 1001 (Alice)           │
│            [BLOCKED - Waiting on Thread 2]         [BLOCKED - Waiting on Thread 1]     │
│                                                                                        │
│                                      DEADLOCK!                                         │
│                      Database Engine Aborts One Transaction (40P01)                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Architectural Solution: Strict Lexicographical Lock Ordering
To mathematically eliminate circular wait conditions, all threads must acquire locks in a globally deterministic order. The standard industry pattern is **Lexicographical Account ID Sorting**:

```java
public void executeOnUsTransfer(String sourceAccountId, String targetAccountId, BigDecimal amount) {
    // 1. Determine deterministic lock acquisition sequence
    String firstLockId;
    String secondLockId;

    if (sourceAccountId.compareTo(targetAccountId) < 0) {
        firstLockId = sourceAccountId;
        secondLockId = targetAccountId;
    } else {
        firstLockId = targetAccountId;
        secondLockId = sourceAccountId;
    }

    // 2. Acquire locks in strict ascending order
    synchronizedAccountLock(firstLockId, () -> {
        synchronizedAccountLock(secondLockId, () -> {
            // 3. Both locks secured; perform double-entry booking inside SQL transaction
            ledgerService.postDebit(sourceAccountId, amount);
            ledgerService.postCredit(targetAccountId, amount);
        });
    });
}
```

By enforcing that Account `1001` is **always locked before** Account `2002` regardless of transfer direction, circular dependency is impossible.

---

## 3. Sharded & Multi-Entity Ledgers: Cross-Partition On-Us Transfers

Modern cloud-native core banking systems (e.g. CockroachDB, YugabyteDB, or sharded Aurora) partition account tables across database nodes by Customer ID or Entity ID:
- **Account A** resides on **Shard 1** (Retail Banking Division).
- **Account B** resides on **Shard 2** (Commercial Banking Division).

Even though both accounts belong to the same bank, they cannot be updated within a single node's local ACID transaction.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 CROSS-SHARD ON-US TRANSFER VIA INTER-ENTITY CLEARING                   │
│                                                                                        │
│   SHARD 1 (Retail Division)                         SHARD 2 (Commercial Division)      │
│   ┌─────────────────────────────────────┐           ┌────────────────────────────────┐ │
│   │ 1. DR Alice Account     -$500.00    │           │ 3. CR Bob Account     +$500.00 │ │
│   │ 2. CR Inter-Entity Clrg +$500.00    │           │ 4. DR Inter-Entity Clrg-$500.00│ │
│   │    (Suspense Account #9901)         │           │    (Suspense Account #9902)    │ │
│   └─────────────────────────────────────┘           └────────────────────────────────┘ │
│                      │                                               ▲                 │
│                      └──────────── Distributed 2PC / Saga ───────────┘                 │
│                        Net Inter-Entity Suspense Position: $0.00                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Settlement Approaches
1. **Distributed Two-Phase Commit (2PC / Raft-backed Distributed SQL)**:
   - Atomic commit coordinated by distributed storage engine. Suitable when database read/write latency is low ($< 5\text{ms}$).
2. **Internal Clearing Saga**:
   - Shard 1 debits the sender and credits an *Internal Due-To Clearing Account*.
   - An asynchronous reliable message (via Kafka or transactional outbox) commands Shard 2 to debit an *Internal Due-From Clearing Account* and credit the recipient.
   - End-of-day automated job sweeps the two internal clearing accounts to confirm net-zero variance.

---

## 4. Card Acquiring: On-Us Scheme Bypass Routing

In card payment acquiring (POS and e-commerce), On-Us processing unlocks massive economic savings:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      CARD SCHEME INTERCHANGE BYPASS ROUTING                            │
│                                                                                        │
│   MERCHANT POS TERMINAL (Acquired by Bank X)                                           │
│   Customer swipes Debit Card (Issued by Bank X)                                        │
│   ┌─────────────────────────────────────────────────────────┐                          │
│   │ Transaction Request: $100.00 (BIN Range: 4111 22...)    │                          │
│   └────────────────────────────┬────────────────────────────┘                          │
│                                │                                                       │
│                                ▼                                                       │
│   ACQUIRING SWITCH (Bank X)                                                            │
│   BIN Lookup: "Card Issuer BIN matches Bank X internal range!"                         │
│                                │                                                       │
│                ┌───────────────┴───────────────┐                                       │
│                ▼                               ▼                                       │
│   [TRADITIONAL OFF-US PATH]       [ON-US DIRECT BYPASS PATH]                           │
│   Route to Visa / Mastercard Net  Bypass Card Scheme Network Entirely                  │
│   • Merchant pays 1.8% Interchange • Merchant pays reduced 0.2% fee                    │
│   • Bank pays scheme assessment fee• Zero scheme assessment fees                       │
│   • Clearing takes 24–48 hours    • Immediate real-time internal settlement            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Compliance Invariants: The Sanctions Trap

A frequent engineering error in internal ledger projects is bypassing anti-money laundering (AML) controls for On-Us payments:
- **The Anti-Pattern**: Assuming "both customers are already KYC-verified by us, so we can skip sanctions and fraud checks."
- **Regulatory Reality**: Regulatory frameworks (e.g. OFAC, EU Sanctions, AUSTRAC) enforce strict liability. A customer may be added to a global sanctions list *after* opening their account. Internal transfers used for **structuring (smurfing)** or internal laundering must be intercepted by transaction monitoring engines before ledger commit.

---

## 6. Architectural Comparison Matrix

| Dimension | On-Us Internal Transfer | Off-Us Real-Time (e.g. FedNow, NPP) | Off-Us Batch (ACH, Direct Entry) |
|---|---|---|---|
| **Clearing Network** | None (Internal core ledger) | Central Bank RTGS switch | National clearing house (NACHA) |
| **Processing Latency** | $< 25\text{ ms}$ | $1\text{ to }3\text{ seconds}$ | $1\text{ to }3\text{ business days}$ |
| **Interchange / Network Fee** | **$0.00** | Small network assessment (\$0.02–\$0.05) | Batch fee (\$0.01–\$0.10) |
| **Settlement Risk** | Zero (Internal balance sheet) | Zero (Immediate central bank funds) | Counterparty settlement risk |
| **Concurrency Challenge** | Database deadlocks, lock contention | Network timeouts, idempotency keys | Cut-off windows, return handling |

---

## Related Documentation

- [Off-Us Transaction Architecture & Clearing Rails](./offus.md)
- [Debit Reversals & Distributed Saga Rollbacks](./debit_reversal.md)
- [pacs.008 — FI-to-FI Customer Credit Transfer](./pacs008.md)
- [camt.054 — Real-Time Debit/Credit Notifications](./camt054.md)
- [Card Wire Protocols: ISO 8583 & AS 2805](./card_iso8583.md)
