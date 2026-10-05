---
id: card_clearing_settlement
title: "Card Processing, Clearing & Interchange Economics"
sidebar_label: "SMS vs DMS, Clearing & Interchange"
sidebar_position: 4
description: Comprehensive principal engineering guide to card transaction processing models (SMS vs DMS), clearing file formats (Visa BASE II, Mastercard IPM), Merchant Discount Rate (MDR) economics, and Interchange++ vs Blended pricing.
tags: [banking, cards, clearing, settlement, dms, sms, base2, ipm, mdr, interchange, pricing]
---

import BankingCardPaymentFlowDiagram from '@site/src/components/BankingCardPaymentFlowDiagram';

# ⚖️ Card Processing, Clearing & Interchange Economics

Unlike account-to-account (A2A) instant rails where balance verification and funds transfer occur simultaneously, payment cards decouple **real-time risk authorization** from **asynchronous batch clearing and multi-party net settlement**.

Understanding this separation is critical for architecting resilient merchant gateways, core banking posting engines, and treasury reconciliation pipelines.

---

## 1. Single-Message (SMS) vs. Dual-Message (DMS) Processing

Card schemes support two distinct operational processing architectures:

```
DUAL-MESSAGE SYSTEM (DMS) - Visa / Mastercard Credit & Signature Debit:
Day T (08:00):  [0100 Auth Request] ────────► Issuer places Authorization HOLD
Day T (18:00):  [0220 Presentment Batch] ───► Issuer converts HOLD to POSTED DEBIT

SINGLE-MESSAGE SYSTEM (SMS) - eftpos, ATM, PIN Debit:
Day T (08:00):  [0200 Financial Request] ────► Real-time immediate POSTED DEBIT (Zero Hold)
```

### Architectural Comparison

| Operational Dimension | Dual-Message System (DMS) | Single-Message System (SMS) |
|---|---|---|
| **Representative Rails** | Visa Credit/Debit, Mastercard Credit/Debit | eftpos Australia, Interac Canada, STAR, Pulse, NYCE, ATM networks |
| **Phase 1 (Real-Time)** | Authorization only (`0100`/`0110`); balance is held/reserved. | Authorization + Presentment combined (`0200`/`0210`). |
| **Phase 2 (Clearing)** | Merchant batches authorizations at close of business via clearing files. | No secondary clearing file; the real-time auth message is the clearing record. |
| **Settlement Velocity** | T+1 to T+3 days across global multi-currency clearing batches. | Near real-time or T+0/T+1 domestic multilateral net settlement. |
| **Tipping & Adjustments** | Native support: Auth for \$100, finalize capture for \$120 (hospitality, hotels). | Difficult; requires separate reversal (`0400`) or adjustment transaction. |
| **Core Ledger Impact** | Two distinct database state transitions: `HOLD_RESERVED` $\rightarrow$ `POSTED_DEBIT`. | Single atomic database state transition: `POSTED_DEBIT`. |

---

## 2. Authorization Hold Mechanics & Lifecycle

In Dual-Message processing, an authorization hold temporarily decreases the cardholder's **Available Balance** while leaving the **Current (Ledger) Balance** unchanged:

$$\text{Available Balance} = \text{Current Balance} - \sum \text{Active Authorization Holds}$$

```
Cardholder Account Ledger: Current Balance = $1,000 AUD
1. Merchant dispatches 0100 Auth for $100
   ├── Available Balance: $900 AUD
   ├── Current Balance:   $1,000 AUD
   └── Hold Record:       HOLD_ID=H8912, Amount=$100, Expires=T+7 Days
```

### Hold Scenarios & Edge Cases

1. **Pre-Authorization (Tipping / Fuel Dispensing)**:
   * Automated fuel dispensers pre-authorize an arbitrary amount (e.g. \$150 AUD). Upon completion, a completion advice adjusts the amount to the actual fuel pumped (\$65 AUD), immediately unlocking the \$85 difference.
2. **Incremental Authorizations (Car Rentals & Hotels)**:
   * When hotel stays extend or rental damage occurs, the merchant issues incremental authorizations linked by the original **RRN** and authorization code.
3. **Hold Expiration & Auto-Decay**:
   * If a merchant fails to submit a clearing presentment within the scheme window (typically 7 days for retail, 30 days for car rentals and hotels), the issuing bank's background sweep job must automatically release the hold to prevent stranded customer balances.

---

## 3. Clearing File Specifications: Visa BASE II & Mastercard IPM

In Dual-Message systems, clearing occurs via compressed, encrypted batch files exchanged between acquirers, scheme networks, and issuers:

```
[Acquiring Bank / Processor]
             │
             ├────── Dispatches Nightly Outgoing Clearing Batch ──────► [Scheme Switch]
             │                                                              │
             │◄───── Receives Settlement Recon & Reject Reports ─────────────┤
             │                                                              │
             │       [Scheme Processes, Cleanses & Routes Batches]          │
             │                                                              │
             │                                                              ▼
             │◄───── Delivers Incoming Clearing Batch to Issuing Banks ─────┘
```

### 1. Visa BASE II Clearing
* Structured around **TC (Transaction Code)** records:
  * **`TC 05`**: Sales Draft (standard purchase presentment).
  * **`TC 06`**: Credit Draft (customer refund).
  * **`TC 15` / `TC 17`**: Chargeback / Second Presentment.
  * **`TC 25`**: Reversal of previous clearing draft.
  * **`TC 33`**: Fee Collection / Scheme Billing.

### 2. Mastercard IPM (Integrated Processing Module)
* Fixed-length or variable-length blocked ISO 8583 clearing batches:
  * **`1240`**: First Presentment (clearing message containing financial capture).
  * **`1442`**: Chargeback presentment.
  * **`1644`**: Administrative advice and interchange notification.

---

## 4. Multi-Party Fee Economics & The Interchange Engine

When a customer pays \$100 AUD using a payment card, the merchant does not receive \$100. The cost of acceptance is governed by the **Merchant Discount Rate (MDR)**:

$$\text{MDR} = \text{Interchange Fee} + \text{Scheme Assessment Fee} + \text{Acquirer Margin}$$

<BankingCardPaymentFlowDiagram initialTab="fee" />

### Fee Allocation Breakdown (\$100 AUD Transaction Example)

```
Customer purchases goods: $100.00 AUD
─────────────────────────────────────────────────────────────────
  ├── Interchange Fee (retained by Issuing Bank):      $0.60 (0.60%)
  │   - Compensates issuer for interest-free credit grace period,
  │     cardholder rewards points, and unpaid fraud risk.
  ├── Scheme Assessment Fee (paid to Visa/Mastercard): $0.20 (0.20%)
  │   - Brand licensing, network switching, and directory infrastructure.
  └── Acquirer Margin (retained by Acquiring Bank):    $0.20 (0.20%)
      - Terminal hardware, payment gateway APIs, and merchant underwriting.
─────────────────────────────────────────────────────────────────
Total Merchant Fees Deducted (MDR = 1.00%):           -$1.00 AUD
Net Merchant Settlement Payout:                       $99.00 AUD
```

---

## 5. Interchange++ (IC++) vs. Blended Pricing

Merchants contract with acquiring banks under one of two primary pricing models:

```
BLENDED PRICING:
Merchant is charged flat 1.75% + $0.10 regardless of card type or origin.
├── Acquirer profits heavily on low-cost domestic debit cards (cost: ~0.30%).
└── Acquirer loses margin on international commercial cards (cost: ~2.10%).

INTERCHANGE++ (IC++):
Merchant is charged the transparent sum of:
├── Leg 1: Exact interchange fee determined by card scheme interchange tables.
├── Leg 2 (+): Exact scheme assessment fee.
└── Leg 3 (+): Acquirer's fixed processing markup (e.g. 0.15% + $0.05).
```

### Architectural Trade-Off Matrix

| Pricing Model | Pros for Merchants | Cons for Merchants | Target Merchants |
|---|---|---|---|
| **Blended Pricing** | Simple, predictable billing; easy accounting reconciliations. | Hidden acquirer margins; expensive for businesses whose customers primarily use domestic debit cards. | Small-to-medium businesses (SMBs), micro-merchants (Stripe/Square default). |
| **Interchange++** | Complete transparency; massive savings when optimized with Least-Cost Routing (LCR). | Variable, complex month-end reconciliation; exposed to fluctuations in scheme fee schedules. | Enterprise merchants, airlines, supermarkets, high-volume e-commerce. |

---

## 6. Multi-Currency Clearing & Settlement Netting

International card transactions involve three distinct currency concepts:

1. **Transaction Currency**: The currency in which the merchant prices goods (e.g. `USD`).
2. **Clearing / Billing Currency**: The currency agreed upon between the scheme and the issuer (e.g. `AUD`).
3. **Settlement Currency**: The domestic currency used to settle net balances between member banks at the central bank (e.g. `AUD` via RITS).

### FX Slippage & Settlement Risks
Between Day T (real-time authorization) and Day T+2 (clearing presentment settlement), currency exchange rates fluctuate. The card scheme switch applies its published daily reference rate at the moment the clearing batch is processed, absorbing or passing through intraday currency volatility.

---

## Related Documentation

- [Cards & Card Schemes Architecture Overview](./cards.md)
- [Card Anatomy & EMV Chip Cryptography](./card_anatomy_emv.md)
- [Card Wire Protocols: ISO 8583 & AS 2805](./card_iso8583.md)
- [Network Tokenization & EMV 3-D Secure](./card_tokenization_3ds.md)
- [Disputes, Chargebacks & Least-Cost Routing](./card_disputes_lcr.md)
