---
id: offus
title: Off-Us Transaction Architecture — Clearing, Settlement & The 4-Corner Model
sidebar_label: Off-Us Transactions
description: Deep architectural guide to off-us transaction processing in banking, the 4-corner payment model, clearing vs settlement mechanics, DNS vs RTGS liquidity models, and resilient interbank gateway design.
tags: [banking, off-us, payments, clearing, settlement, rtgs, ach, swift]
---

# Off-Us Transaction Architecture — Clearing, Settlement & Rails

An **Off-Us Transaction** is a payment where the payer (debtor) and the recipient (creditor) hold accounts at **different financial institutions**. Because funds must traverse organizational and sovereign boundaries, the transaction cannot be settled via a simple internal database write.

Off-Us payments require standardized messaging rails, multi-stage clearing pipelines, central bank liquidity reserves, and legal settlement frameworks. Understanding Off-Us architecture requires mastering the **4-Corner Model**, the critical separation between **Clearing and Settlement**, and the trade-offs between **Deferred Net Settlement (DNS)** and **Real-Time Gross Settlement (RTGS)**.

---

## 1. The 4-Corner Payment Model

All modern interbank payment systems—including retail wire transfers, automated clearing houses (ACH), instant payments (FedNow, SEPA Instant, NPP), and credit card schemes—are structured around the **4-Corner Model**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE 4-CORNER PAYMENT MODEL                                │
│                                                                                        │
│   CORNER 1: PAYER (DEBTOR)                                CORNER 4: PAYEE (CREDITOR)   │
│   ┌──────────────────────┐                                ┌────────────────────────┐   │
│   │ Alice (Buyer)        │                                │ Bob (Merchant/Seller)  │   │
│   └──────────┬───────────┘                                └───────────▲────────────┘   │
│              │ 1. Initiates Transfer                                  │ 6. Account     │
│              │    (pain.001 / Card Tap)                               │    Credited    │
│              ▼                                                        │    (camt.054)  │
│   CORNER 2: DEBTOR BANK (ISSUER)                          CORNER 3: CREDITOR BANK      │
│   ┌──────────────────────┐                                ┌────────────────────────┐   │
│   │ Debtor Bank          │                                │ Creditor Bank          │   │
│   │ (Alice's Bank)       │                                │ (Bob's Bank)           │   │
│   └──────────┬───────────┘                                └───────────▲────────────┘   │
│              │                                                        │                │
│              │ 2. Validates & Debits Alice                            │ 5. Credits Bob │
│              │ 3. Dispatches Interbank Msg (pacs.008)                 │    Post-Settlem│
│              ▼                                                        │                │
│   ───────────────────────────────────────────────────────────────────────────────────  │
│                     CLEARING & SETTLEMENT NETWORK (INTERMEDIARY)                       │
│                     (Central Bank RTGS / ACH / SWIFT / VisaNet)                        │
│                                                                                        │
│                     4. Interbank Settlement across Central Bank Reserves               │
│                        DR Debtor Bank Reserve Account    -$10,000                      │
│                        CR Creditor Bank Reserve Account  +$10,000                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fundamental Separation: Clearing vs. Settlement

A core tenet of payment systems engineering is that **Clearing** and **Settlement** are distinct processes that often execute at completely different times:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CLEARING VS. SETTLEMENT DECOUPLING                              │
│                                                                                        │
│  CLEARING (The Exchange of Information & Obligations)                                  │
│  ────────────────────────────────────────────────────                                  │
│  • Message transmission, syntactic validation, and counterparty routing.              │
│  • Computation of net obligations: Bank A owes Bank B $5M; Bank B owes Bank A $3M.     │
│  • Result: Calculation of net balance owed ($2M). NO CENTRAL BANK MONEY MOVES YET.    │
│                                                                                        │
│  SETTLEMENT (The Unconditional Discharge of the Obligation)                            │
│  ──────────────────────────────────────────────────────────                            │
│  • Irrevocable transfer of central bank reserves from Bank A to Bank B.                │
│  • Governed by central bank legal finality regulations (e.g. Fedwire, TARGET2).        │
│  • Once settled, the transaction cannot be unwound or reversed by insolvency.          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Deferred Net Settlement (DNS) vs. Real-Time Gross Settlement (RTGS)

| Architectural Dimension | Deferred Net Settlement (DNS) (e.g. Traditional ACH, BACS, SEPA Core) | Real-Time Gross Settlement (RTGS) (e.g. Fedwire, TARGET2, CHAPS, FedNow) |
|---|---|---|
| **Settlement Frequency** | Batched at fixed cut-off windows (e.g. $1\text{ to }3\text{ times daily}$) | Continuous, transaction-by-transaction in real time |
| **Gross vs. Net** | **Net Multilateral**: Millions of payments offset into a single net settlement figure | **Gross**: Every single transaction transfers physical reserves individually |
| **Liquidity Efficiency** | **Extremely High**: Banks need minimal intraday cash buffers; incoming cancels outgoing | **Low**: Banks must maintain massive cash reserves at the central bank |
| **Settlement Risk (Herstatt Risk)** | **High**: If a participant bank defaults before the net batch settles, the entire batch must unwind | **Zero**: Settlement is instantaneous and final upon commit |
| **Throughput & Cost** | Millions of transactions per batch; fractions of a cent per payment | Hundreds of transactions per second; higher fees (\$0.10 to \$15.00) |

---

## 3. End-to-End Interbank Message Protocol Exchange

In modern ISO 20022 clearing architectures, an Off-Us payment executes through a deterministic multi-message choreography:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      OFF-US ISO 20022 MESSAGE PROTOCOL CHOREOGRAPHY                    │
│                                                                                        │
│  Debtor            Debtor Bank             Clearing System            Creditor Bank    │
│    │                    │                         │                         │          │
│    │ 1. pain.001        │                         │                         │          │
│    │───────────────────>│                         │                         │          │
│    │                    │ 2. Debit Customer       │                         │          │
│    │                    │ 3. pacs.008             │                         │          │
│    │                    │────────────────────────>│                         │          │
│    │                    │                         │ 4. Liquidity Settlement │          │
│    │                    │                         │ 5. pacs.008 Dispatched  │          │
│    │                    │                         │────────────────────────>│          │
│    │                    │                         │                         │ 6. Posts │
│    │                    │                         │ 7. pacs.002 (ACCP)      │    Credit│
│    │                    │                         │<────────────────────────│          │
│    │                    │ 8. pacs.002 (ACCP)      │                         │          │
│    │                    │<────────────────────────│                         │          │
│    │ 9. pain.002 (ACCP) │                         │                         │          │
│    │<───────────────────│                         │                         │          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Initiation (`pain.001`)**: Payer initiates a credit transfer. Debtor bank runs sanctions, AML, and balance availability checks.
2. **Debtor Ledger Posting**: Debtor bank reserves or hard-debits the customer account, crediting an internal *Due-To Central Bank Clearing Suspense Account*.
3. **FI-to-FI Instruction (`pacs.008`)**: Debtor bank packages transaction details, including `EndToEndId` and `UETR`, and dispatches to the central clearing switch.
4. **Central Settlement**: Clearing house debits Debtor Bank's reserve balance and credits Creditor Bank's reserve balance.
5. **Creditor Ledger Posting**: Creditor bank validates beneficiary account details and posts credit to payee's balance.
6. **Technical Confirmation (`pacs.002`)**: Creditor bank returns an acceptance (`ACCP`) or rejection (`RJCT`) status report back through the clearing rail.

---

## 4. Resilient Gateway Design: The Transactional Outbox Pattern

Communicating with external clearing networks over WAN introduces network partitions, socket timeouts, and remote crash failures.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     OUTBOX PATTERN FOR OFF-US CLEARING GATEWAYS                        │
│                                                                                        │
│   PAYMENT APPLICATION DATABASE                      DEBEZIUM CDC ENGINE                │
│   ┌────────────────────────────────────────┐        ┌──────────────────────────────┐   │
│   │ BEGIN TRANSACTION;                     │        │ Scans Postgres WAL Log       │   │
│   │ 1. UPDATE accounts SET balance = ...;  │ ─────> │ Captures new Outbox event    │   │
│   │ 2. INSERT INTO payments_outbox         │        │ Emits to Kafka:              │   │
│   │    (id, pacs008_xml, status='PENDING');│        │ topic: outbox.pacs008        │   │
│   │ COMMIT;                                │        └──────────────┬───────────────┘   │
│   └────────────────────────────────────────┘                       │                   │
│                                                                    ▼                   │
│   CLEARING NETWORK (FEDNOW / SWIFT MQ)              CLEARING ADAPTER SERVICE           │
│   ┌────────────────────────────────────────┐        ┌──────────────────────────────┐   │
│   │ Remote Network Host Gateway            │ <───── │ Consumer Worker Pool         │   │
│   │ Enforces Idempotency on EndToEndId     │        │ • TLS Mutual Auth / PKI Sign │   │
│   │ Acknowledges with pacs.002 Message     │        │ • Circuit Breaker & Retries  │   │
│   └────────────────────────────────────────┘        └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Critical Gateway Invariants
1. **Guaranteed Exactly-Once Semantics via Clearing Idempotency**:
   - Clearing networks reject duplicate requests based on the composite key:
     $$\text{RailIdempotencyKey} = (\text{SenderBIC}, \text{MessageId}, \text{EndToEndId})$$
   - If an adapter worker times out waiting for an ACK, it **must re-send with the exact same `EndToEndId` and `UETR`**. Generating a new message ID risks executing duplicate interbank settlements.
2. **Nostro / Vostro Liquidity Monitoring**:
   - For cross-border wires (SWIFT), banks maintain bilateral **Nostro** ("our money at your bank") and **Vostro** ("your money at our bank") accounts.
   - Outbound payment engines must monitor Nostro credit limits in real time; if an account drops below required intraday margins, outbound wires must pause in an authorized liquidity buffer queue.

---

## 5. Architectural Comparison Matrix: Payment Rails

| Rail / Architecture | Governing Standard | Settlement Mechanism | End-to-End Latency | Operating Window | Typical Use Case |
|---|---|---|---|---|---|
| **FedNow / SEPA Instant** | ISO 20022 (`pacs.008`) | Real-Time Gross Settlement (RTGS) | $< 3\text{ seconds}$ | 24/7/365 continuous | Instant consumer & B2B retail transfers |
| **Traditional ACH (NACHA)** | FedLine / Nacha Flat | Deferred Net Settlement (DNS) | $1\text{ to }3\text{ business days}$ | Banking days / Batch cuts | Payroll, bill pay, recurring subscriptions |
| **Fedwire / TARGET2** | ISO 20022 / MT103 | Real-Time Gross Settlement (RTGS) | $1\text{ to }10\text{ minutes}$ | Central bank operating hours | High-value wholesale & institutional settlement |
| **SWIFT CBPR+ (Cross-Border)**| ISO 20022 / MT103 | Correspondent Nostro/Vostro | Hours to days | Multi-jurisdiction timezones | International cross-border trade & remittances |
| **Visa / Mastercard** | ISO 8583 / Single Message | Dual-Message (Auth now, DNS settle later) | Auth: $< 1.5\text{s}$, Settle: 24h | 24/7/365 | Point-of-sale retail & e-commerce payments |

---

## Related Documentation

- [On-Us Transaction Processing & Concurrency](./onus.md)
- [pacs.008 — Direct Credit Transfer Deep Dive](./pacs008.md)
- [pacs.004 — Payment Returns & Failure Codes](./pacs004.md)
- [Debit Reversals & Distributed Saga Rollbacks](./debit_reversal.md)
- [Card Wire Protocols: ISO 8583 & AS 2805](./card_iso8583.md)
